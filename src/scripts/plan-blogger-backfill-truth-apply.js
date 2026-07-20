#!/usr/bin/env node
// Phase 20260719：Blogger backfill validated truth apply-plan gate（read-only；fail-closed；deterministic）。
//
// 用途：
//   在 truth-manifest intake validator 通過後、future writer `--apply` 之前，作為第二層唯讀
//   閘門。validator 只回報「manifest 通不通過 layered checks」；本工具在通過後**額外**產出
//   「未來 apply 若被 Dean 授權執行，會建立哪些 sidecar、以及每筆 sidecar 之 exact JSON
//   payload」之 deterministic plan，供人工審核與未來 apply-time binding（fingerprint）使用。
//   本工具**絕不**寫入任何檔案；**絕不**呼叫 Blogger / Google API；**絕不**猜測 Blogger truth；
//   **絕不**支援 `--apply` / `--write` / `--force` / `--overwrite` / `--fix` / `--output` / `--out`。
//
// Pipeline 位置：
//   missing-sidecar planner
//   → optional create-only bootstrap
//   → truth-manifest template generator
//   → truth-manifest intake validator（`validate:blogger-backfill-truth-manifest`）
//   → **本工具**：validated apply-plan gate（本 slice）
//   → future writer apply（另 slice；本 slice 不執行；仍需獨立 phase + Dean explicit approval）
//
// 上游 / policy：
//   - `docs/20260706-blogger-identity-and-backfill-strategy.md` §A（A.1 human / A.3 system；不猜 ID）
//   - `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = sidecar）
//   - `docs/publish-json-schema.md` §5.3 / §5.3.1 / §5.4 / §9.5（Blogger URL / publishedAt 為唯一真相）
//   - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（planner classification）
//   - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`（writer manifest schema + create-only）
//   - `docs/20260718-blogger-backfill-truth-manifest-template.md`（generator）
//   - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md`（intake validator；本工具之上游）
//
// 安全契約（fail-closed；hard-coded）：
//   - 純 read-only：本工具本身**不**呼叫 fs.writeFile / mkdir / rm / rename / unlink / copyFile /
//     appendFile；亦不呼叫 child_process；亦不 fetch / node:http[s] / googleapis / oauth。
//   - 缺 `--manifest` 即 hard-fail；forbidden flag / unknown flag 即 hard-fail。
//   - 直接 import `validate-blogger-backfill-truth-manifest.js` 之 `validateTruthManifest()` +
//     `bootstrap-blogger-backfill-sidecars.js` 之 `buildSidecarBody()`；**不**透過 subprocess CLI
//     呼叫 validator / bootstrap。validation 與 planning 共用同一 in-process manifest snapshot（由
//     validator `loadManifest()` 讀取一次；本工具**不**再讀第二次）。
//   - validation 未通過即 fail-closed；不產出 planned entries；`writePerformed: false`。
//   - validation 通過後，對每筆 `READY_FOR_WRITE` entry 直接呼叫 `buildSidecarBody()` 產出未來
//     apply 預計寫入之 exact JSON semantic content；operation type 恆為 `create`（bootstrap
//     writer 之 create-only 契約由 planBootstrap 之 `SIDECAR_ALREADY_EXISTS` / duplicate 檢查
//     於 validator 內強制執行；本工具不再重製規則）。
//   - Deterministic：entries 依 sourcePath / targetPath 升冪、field ordering 固定；輸出**不含**
//     `generatedAt` / `timestamp` / absolute machine path / hostname / OS-dependent separator /
//     random ID。同一 frozen repo + 同 manifest 重跑兩次，`--json` stdout bytes 應完全一致。
//   - Fingerprint = sha256 of canonical JSON of `{planSchemaVersion, manifestSchemaVersion,
//     entries: [{sourcePath, targetPath, operation, payload}]}`；**不**綁 absolute path、
//     repo root、時間、OS separator。fingerprint 為 informational；本 slice **不**實作 apply
//     或 approval 之強制 fingerprint 比對；future writer apply slice 若採用需另 slice + explicit
//     approval。
//   - `writePerformed` 恆為 `false`。
//
// 本 slice 明確 **不** 做：
//   - 對六篇正式 `20260612-*` 之 production truth 填寫、bootstrap `--apply`。
//   - Blogger API credential / auth / publish / update flow。
//   - `bloggerPostId` capture / write。
//   - Markdown frontmatter modification。
//   - build / deploy / preview / dist-* / dist-blogger-preview/ mutation。
//   - deploy repo modification。
//   - approval token 之實際執行機制。
//   - 升級任何 warning-only guard 為 blocking。
//
// 使用：
//   npm run plan:blogger-backfill-truth-apply -- --manifest <path>
//   npm run plan:blogger-backfill-truth-apply -- --manifest <path> --json
//   npm run plan:blogger-backfill-truth-apply -- --help
//   [Guard only] --repo-root <abs>：override repo root for synthetic fixture testing.
//                                   Defaults to the current repo root.

import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateTruthManifest,
  formatHumanReadable as formatValidatorHuman,
  formatJson as formatValidatorJson,
} from './validate-blogger-backfill-truth-manifest.js';
import { buildSidecarBody } from './bootstrap-blogger-backfill-sidecars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Plan-output schema version. Independent from manifest.schemaVersion. Bump when
// downstream consumers must adapt (fingerprint contract changes count as a bump).
export const PLAN_SCHEMA_VERSION = 1;

// Only supported operation for the create-only apply path. Any other value would
// signal a future superset (update / delete) that this pipeline does not accept.
export const SUPPORTED_OPERATIONS = ['create'];

// Mutation-like flags rejected up-front. Any occurrence fail-closes with exit 1.
const FORBIDDEN_FLAGS = new Set([
  '--apply',
  '--write',
  '--output',
  '--out',
  '--force',
  '--overwrite',
  '--replace',
  '--merge',
  '--yes',
  '-y',
  '--fix',
  '--commit',
  '--publish',
  '--deploy',
]);

const USAGE = `Usage: plan-blogger-backfill-truth-apply --manifest <path> [--json] [--help]

Read-only, validator-first, deterministic apply-plan gate for a Dean-populated
Blogger backfill truth manifest.

This command NEVER creates, modifies, renames, or deletes any file.
It NEVER performs the apply. It NEVER calls Blogger / Google APIs or the
network. It reuses \`validate:blogger-backfill-truth-manifest\` in-process and
only produces a plan when that validator would pass. It NEVER accepts
--apply / --write / --force / --overwrite / --output / --out / --fix / --commit /
--publish / --deploy.

The plan lists, for each future create:
  - sourcePath           the Markdown that identifies the sidecar target
  - targetPath           the exact .publish.json path a future apply would create
  - operation            always "create" (bootstrap is create-only)
  - payload              the exact JSON body a future apply would write
  - conflicts            filesystem / manifest / candidate conflicts, if any

Plans also carry a deterministic fingerprint (sha256 over canonical JSON of the
plan inputs and planned writes). The fingerprint is informational: it lets a
future authorized apply verify the reviewed plan has not drifted between review
and apply. It does not, by itself, authorize apply. Actual apply authorization
remains out of scope; a future slice must add explicit approval + apply plumbing.

Required:
  --manifest <path>         Repo-relative or absolute path to a JSON manifest
                            that matches the writer schema.

Options:
  --json                    Emit a deterministic JSON report to stdout.
  --repo-root <abs>         (Guard use only.) Absolute path to an alternate
                            repo root, for isolated fixture testing.
  --help / -h               Print this usage.

Fail-closed behavior:
  Any of the following causes a non-zero exit and prevents the manifest from
  moving downstream:
    - missing --manifest, forbidden flag, unknown flag
    - validator would fail (envelope / shape / coverage / sentinel / duplicate
      URL / cross-field errors — every layered check that validate:blogger-
      backfill-truth-manifest enforces).
`;

// ── argv parsing ─────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
    manifest: null,
    repoRoot: null,
    forbidden: [],
    unknown: [],
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--help' || a === '-h') {
      opts.help = true;
      continue;
    }
    if (a === '--json') {
      opts.json = true;
      continue;
    }
    if (a === '--manifest') {
      opts.manifest = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--manifest=')) {
      opts.manifest = a.slice('--manifest='.length);
      continue;
    }
    if (a === '--repo-root') {
      opts.repoRoot = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--repo-root=')) {
      opts.repoRoot = a.slice('--repo-root='.length);
      continue;
    }
    if (FORBIDDEN_FLAGS.has(a)) {
      opts.forbidden.push(a);
      continue;
    }
    const eqIdx = a.indexOf('=');
    if (eqIdx > 0) {
      const bare = a.slice(0, eqIdx);
      if (FORBIDDEN_FLAGS.has(bare)) {
        opts.forbidden.push(bare);
        continue;
      }
    }
    opts.unknown.push(a);
  }
  return opts;
}

// ── canonical JSON for deterministic hashing ────────────────────────────────

// Serialize a JS value with sorted object keys so equivalent objects hash the
// same regardless of insertion order. Arrays keep positional order (they are
// pre-sorted upstream by sourcePath/targetPath). Only the JSON subset is
// supported: string / number / boolean / null / array / plain object.
function canonicalize(value) {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`canonicalize: non-finite number not supported: ${value}`);
    }
    return JSON.stringify(value);
  }
  if (t === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    const parts = [];
    for (const k of keys) {
      parts.push(JSON.stringify(k) + ':' + canonicalize(value[k]));
    }
    return '{' + parts.join(',') + '}';
  }
  throw new Error(`canonicalize: unsupported type ${t}`);
}

function sha256Hex(text) {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

// ── plan builder ────────────────────────────────────────────────────────────

// Build the planned write list from a validated manifest. Reuses the in-process
// snapshot the validator produced: `report.manifest.records` for the exact
// per-record truth values and `report.shape.entries` for target paths that were
// derived once from the same manifest during validation. No filesystem re-scan;
// no second manifest parse. Returns entries pre-sorted by sourcePath so downstream
// consumers (including the fingerprint) are order-stable.
export function buildApplyPlan({ report }) {
  const entries = [];
  const errors = [];

  if (!report.ok) {
    return {
      ok: false,
      entries: [],
      conflictCount: 0,
      plannedCreateCount: 0,
      errors: report.errors.slice(),
    };
  }

  // Index shape entries by recordIndex for exact-payload derivation without
  // re-walking the filesystem.
  const shapeByIndex = new Map();
  for (const e of report.shape.entries) {
    shapeByIndex.set(e.recordIndex, e);
  }

  for (let i = 0; i < report.manifest.records.length; i += 1) {
    const record = report.manifest.records[i];
    const shape = shapeByIndex.get(i);
    if (!shape || shape.readiness !== 'READY_FOR_WRITE') {
      // Should not occur when report.ok is true, but guard defensively so an
      // invariant slip does not silently drop an entry into the plan.
      const msg = `internal: manifest record[${i}] is not READY_FOR_WRITE at plan time`;
      errors.push(msg);
      continue;
    }
    const payload = buildSidecarBody({
      publishedUrl: record.blogger.publishedUrl,
      publishedAt: record.blogger.publishedAt,
    });
    entries.push({
      recordIndex: i,
      sourcePath: shape.sourcePath,
      targetPath: shape.expectedSidecarPath,
      operation: 'create',
      payload,
      conflicts: [],
    });
  }

  entries.sort((a, b) => {
    if (a.sourcePath < b.sourcePath) return -1;
    if (a.sourcePath > b.sourcePath) return 1;
    if (a.targetPath < b.targetPath) return -1;
    if (a.targetPath > b.targetPath) return 1;
    return a.recordIndex - b.recordIndex;
  });

  return {
    ok: errors.length === 0,
    entries,
    conflictCount: 0,
    plannedCreateCount: entries.length,
    errors,
  };
}

// Deterministic fingerprint over the plan inputs and planned writes. Depends
// only on:
//   - PLAN_SCHEMA_VERSION
//   - manifest.schemaVersion
//   - for each entry: sourcePath, targetPath, operation, payload
// Deliberately does NOT depend on: manifest absolute path, repo root, current
// time, hostname, OS separator, process ID, temporary directory. Same inputs
// therefore produce the same fingerprint on any host or fixture root.
export function fingerprintPlan({ manifestSchemaVersion, entries, coverage = null }) {
  const input = {
    planSchemaVersion: PLAN_SCHEMA_VERSION,
    manifestSchemaVersion,
    entries: entries.map((e) => ({
      sourcePath: e.sourcePath,
      targetPath: e.targetPath,
      operation: e.operation,
      payload: e.payload,
    })),
  };
  // Coverage binding (Phase 20260720). The descriptor is included ONLY for
  // selected coverage. Full coverage (coverage == null) yields a canonical object
  // byte-identical to the legacy fingerprint input, so existing full-coverage
  // fingerprints — and any authorization bound to them — are unchanged. Selected
  // coverage binds { mode, selectedSourcePaths } so that an authorization prepared
  // for a selected plan can NEVER validate against a full plan, nor against a
  // different selection, even in the degenerate case where the resulting entry set
  // coincides. Changing the selected set therefore changes the plan fingerprint via
  // BOTH the entries and this descriptor; downstream authorization fails closed.
  if (coverage != null) {
    input.coverage = coverage;
  }
  const canonical = canonicalize(input);
  return {
    algorithm: 'sha256',
    encoding: 'hex',
    value: sha256Hex(canonical),
  };
}

// Derive the fingerprint coverage descriptor from a validator report. Returns null
// for full coverage (so the fingerprint stays byte-identical to legacy) and the
// bound descriptor for selected coverage. Single source of truth so buildApplyPlan
// and any downstream caller agree.
export function coverageDescriptorFromReport(report) {
  if (report && report.ok && report.coverage && report.coverage.mode === 'selected') {
    return {
      mode: 'selected',
      selectedSourcePaths: report.coverage.selectedSourcePaths,
    };
  }
  return null;
}

// ── formatting ──────────────────────────────────────────────────────────────

// Human-readable output. Includes a full JSON payload block per planned create
// so a human reviewer can audit exactly what would be written. If validation
// failed, delegates to the validator's own human-readable formatter for the
// failure detail (single source of truth for error diagnostics) then closes
// with an unambiguous no-mutation footer.
export function formatHumanReadable({ report, plan, fingerprint, manifestPath }) {
  const lines = [];
  lines.push('plan-blogger-backfill-truth-apply (planning only; no mutation performed)');
  lines.push('');
  lines.push(`manifest path:                       ${manifestPath}`);
  lines.push(`validator PASS:                      ${report.ok ? 'YES' : 'NO'}`);
  if (report.envelopeOk) {
    lines.push(`candidate count:                     ${report.summary.candidateCount}`);
    lines.push(`current MISSING_SIDECAR count:       ${report.summary.currentMissingSidecarCount}`);
    lines.push(`coverage mode:                       ${report.summary.coverageMode ?? '(unknown)'}`);
    lines.push(`manifest record count:               ${report.summary.recordCount}`);
  } else {
    lines.push(`envelope error:                      ${report.envelopeError}`);
  }
  lines.push(`planned create count:                ${plan.plannedCreateCount}`);
  lines.push(`conflict count:                      ${plan.conflictCount}`);
  lines.push(`writePerformed:                      false`);
  if (fingerprint) {
    lines.push(`plan fingerprint (${fingerprint.algorithm}):        ${fingerprint.value}`);
  } else {
    lines.push('plan fingerprint:                    (not emitted; validation failed)');
  }
  lines.push('');

  if (!report.ok) {
    lines.push('---- validator failure detail ----');
    // Re-use the validator's own human-readable body so error messages match
    // exactly what an operator would see running the validator directly.
    const inner = formatValidatorHuman(report);
    // Trim leading title so it doesn't double up; keep everything else verbatim.
    const trimmed = inner
      .split('\n')
      .slice(1)
      .join('\n');
    lines.push(trimmed.trimEnd());
    lines.push('');
    lines.push('Planning only.');
    lines.push('No files were created, modified, renamed, or deleted.');
    lines.push('Production apply was not performed.');
    lines.push('Overall: FAIL');
    return lines.join('\n') + '\n';
  }

  if (plan.entries.length === 0) {
    lines.push('(manifest contained no records; plan is empty but PASS)');
  } else {
    lines.push('---- planned creates ----');
    let n = 0;
    for (const e of plan.entries) {
      n += 1;
      lines.push(`  ${n}. ${e.sourcePath}`);
      lines.push(`     → target:    ${e.targetPath}`);
      lines.push(`     operation:   ${e.operation}`);
      lines.push(`     conflicts:   (none)`);
      lines.push('     payload:');
      const payloadJson = JSON.stringify(e.payload, null, 2);
      for (const pl of payloadJson.split('\n')) {
        lines.push(`       ${pl}`);
      }
      lines.push('');
    }
  }

  lines.push('Planning only.');
  lines.push('No files were created, modified, renamed, or deleted.');
  lines.push('Production apply was not performed.');
  lines.push('Overall: PASS');
  return lines.join('\n') + '\n';
}

// Deterministic JSON envelope. Field ordering is fixed by object literal insertion
// order. Arrays are pre-sorted by builders above.
export function formatJson({ report, plan, fingerprint, manifestPath }) {
  const body = {
    schemaVersion: PLAN_SCHEMA_VERSION,
    mode: 'plan-apply',
    writePerformed: false,
    manifestPath,
    manifest: {
      schemaVersion: report.manifest ? report.manifest.schemaVersion : null,
      recordCount: report.summary.recordCount,
    },
    summary: {
      candidateCount: report.summary.candidateCount ?? 0,
      currentMissingSidecarCount: report.summary.currentMissingSidecarCount ?? 0,
      coverageMode: report.summary.coverageMode ?? null,
      manifestRecordCount: report.summary.recordCount,
      plannedCreateCount: plan.plannedCreateCount,
      conflictCount: plan.conflictCount,
      validatorOk: report.ok,
    },
    validator: formatValidatorJsonAsObject(report),
    plan: {
      operationsAccepted: SUPPORTED_OPERATIONS,
      entries: plan.entries,
    },
    fingerprint: fingerprint ?? null,
    ok: plan.ok && report.ok,
    errors: plan.ok && report.ok ? [] : dedupePreserveOrder([...report.errors, ...plan.errors]),
  };
  return JSON.stringify(body, null, 2) + '\n';
}

// Reuse validator JSON emitter but return object form so we can nest it. Parse
// the deterministic text back so we keep a single source of truth for the
// validator envelope shape.
function formatValidatorJsonAsObject(report) {
  return JSON.parse(formatValidatorJson(report));
}

function dedupePreserveOrder(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

// ── main planner API ────────────────────────────────────────────────────────

// One-shot: validate → plan → fingerprint (if valid). Returns everything a
// caller (CLI or guard) needs to format output and pick an exit code.
export async function planTruthApply({ manifestPath, repoRoot }) {
  const report = await validateTruthManifest({ manifestPath, repoRoot });
  const plan = buildApplyPlan({ report });
  const fingerprint =
    report.ok && plan.ok
      ? fingerprintPlan({
          manifestSchemaVersion: report.manifest.schemaVersion,
          entries: plan.entries,
          coverage: coverageDescriptorFromReport(report),
        })
      : null;
  return { report, plan, fingerprint };
}

// ── CLI entry ───────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  if (opts.forbidden.length > 0) {
    process.stderr.write(
      `[plan-blogger-backfill-truth-apply] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This planner is read-only and never applies. Mutation-like flags are never accepted.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[plan-blogger-backfill-truth-apply] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  if (!opts.manifest) {
    process.stderr.write(
      '[plan-blogger-backfill-truth-apply] ERROR: --manifest <path> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }

  let repoRoot = PROJECT_ROOT;
  if (opts.repoRoot != null) {
    if (!path.isAbsolute(opts.repoRoot)) {
      process.stderr.write(
        `[plan-blogger-backfill-truth-apply] ERROR: --repo-root must be an absolute path (got: ${opts.repoRoot})\n`,
      );
      return 1;
    }
    repoRoot = opts.repoRoot;
  }

  const manifestPath = path.isAbsolute(opts.manifest)
    ? opts.manifest
    : path.resolve(process.cwd(), opts.manifest);

  const { report, plan, fingerprint } = await planTruthApply({ manifestPath, repoRoot });

  if (opts.json) {
    process.stdout.write(formatJson({ report, plan, fingerprint, manifestPath }));
  } else {
    process.stdout.write(formatHumanReadable({ report, plan, fingerprint, manifestPath }));
  }

  return report.ok && plan.ok ? 0 : 1;
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main()
    .then((code) => {
      process.exit(typeof code === 'number' ? code : 0);
    })
    .catch((err) => {
      process.stderr.write(
        `[plan-blogger-backfill-truth-apply] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}
