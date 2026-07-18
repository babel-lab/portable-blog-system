#!/usr/bin/env node
// Phase 20260718：Blogger backfill truth-manifest template generator（read-only；no write; no Blogger API）。
//
// 用途：
//   對現行 planner 判定為 `MISSING_SIDECAR` 之 Blogger backfill candidates，產出一份 deterministic、
//   人工可填寫、schema 與現有 bootstrap writer 完全一致之 truth manifest **template**。Template 為
//   純輸出（stdout）；本工具**絕不**建立、修改任何 `.md` / `.publish.json` / manifest 檔；**不**呼叫
//   Blogger / Google API；**不**猜測 `publishedUrl` / `publishedAt` / `bloggerPostId` / `bloggerBlogId`。
//
// 上游 / policy：
//   - `docs/20260706-blogger-identity-and-backfill-strategy.md` §A（identity 分層；A.1 human / A.3 system）
//   - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（planner classification；本工具重用其 result）
//   - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`（writer manifest schema；本工具產物 = writer 輸入）
//   - `docs/publish-json-schema.md` §5.3 / §5.4（Blogger URL / publishedAt 為唯一真相）
//
// 安全契約（fail-closed；hard-coded）：
//   - 純 read-only：本工具本身不呼叫 fs.writeFile / mkdir / rm / rename / unlink / copyFile。
//   - 預設輸出至 stdout；**無** --output / --write / --apply / --force / --overwrite / --merge / --yes
//     等寫入 / mutation-like flag，出現即 hard-fail exit 1（防止未來誤加）。
//   - 直接重用 planner 之 structured result（`planMissingSidecars(...)`）；**不** 透過 child_process 執行
//     planner CLI 再 parse console text；**不** duplicate candidate scan 邏輯。
//   - Deterministic：records 依 sourcePath 升冪、key ordering 固定、`JSON.stringify(_, null, 2) + '\n'`；
//     輸出**不含** `generatedAt` / timestamp / absolute machine path / hostname / OS-dependent separator /
//     random ID。同一 frozen repo 重跑兩次，`--json` 與 `--manifest-only` 之 stdout bytes 應完全一致。
//   - Records 只包含符合以下所有條件之項目：
//       (a) planner 判定為 Blogger backfill candidate（publishTargets.blogger.enabled === true AND
//           status ∈ [ready, published] AND draft !== true）；
//       (b) planner sidecarStatus === `MISSING_SIDECAR`；
//       (c) source Markdown 合法（planner 已排除 INVALID_SOURCE / duplicate slug）；
//       (d) 目標 sidecar 尚不存在（隱含於 MISSING_SIDECAR）。
//     `PRESENT_COMPLETE` / `PRESENT_INCOMPLETE` / `INVALID_SIDECAR` / non-candidate / templates 皆排除。
//   - Template 之 record shape 與 bootstrap writer 之 `ALLOWED_RECORD_TOP_KEYS` /
//     `ALLOWED_RECORD_BLOGGER_KEYS` **完全一致**（僅 `sourcePath` + `blogger.publishedUrl` +
//     `blogger.publishedAt`）；**不**含 `bloggerPostId`（identity A.3；系統欄位）；**不**含
//     `permalink` / `type` / `status` / `history` / 其他 writer 未接受欄位。
//   - Truth 未填之表示：writer 之 `isHttpUrl("")` / `resolvePublishedAt("")` 皆 fail-closed，
//     故 template 之空 `publishedUrl` / `publishedAt` 直接使用**空字串** `""`；writer dry-run 會
//     以 `INVALID_RECORD` + `publishedUrl must be strict http(s):// URL` / `publishedAt is invalid`
//     訊息 fail-closed（不會被誤判為 ready）。此為刻意設計：**未填 template 交給 writer** 必然
//     zero mutation。
//
// 本 slice 明確 **不** 做：
//   - 寫入 template 至 tracked repo 之 data directory（唯一 mutation channel = stdout）。
//   - 填入六篇正式 20260612-* 之 production truth（Dean human input，屬未來 slice）。
//   - 呼叫 bootstrap writer `--apply`（本工具不呼叫任何 subprocess）。
//   - 建立 production `.publish.json`。
//   - 動 Blogger / GA4 / AdSense / Google Drive / Search Console / gh-pages / deploy clone / build /
//     deploy / preview / dist-*。
//   - 升級任何 warning-only guard 為 blocking。
//
// 使用：
//   npm run prepare:blogger-backfill-truth-manifest              # human-readable summary（stdout）
//   npm run prepare:blogger-backfill-truth-manifest -- --json    # full JSON envelope（planner scan +
//                                                                 template manifest + summary）
//   npm run prepare:blogger-backfill-truth-manifest -- --manifest-only
//                                                                # pure manifest JSON only（可直接
//                                                                 存檔後餵給 bootstrap writer --input）
//   npm run prepare:blogger-backfill-truth-manifest -- --help
//   [Guard only] --repo-root <abs>：override repo root for synthetic fixture testing.
//                                    Defaults to the current repo root.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { planMissingSidecars } from './plan-blogger-backfill-sidecars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Writer accepts these two keys under `blogger`, in this order.
export const TEMPLATE_BLOGGER_KEY_ORDER = ['publishedUrl', 'publishedAt'];
export const TEMPLATE_RECORD_KEY_ORDER = ['sourcePath', 'blogger'];

// Sidecar statuses considered eligible for template inclusion. Fixed enum; only MISSING_SIDECAR.
export const INCLUDED_SIDECAR_STATUSES = new Set(['MISSING_SIDECAR']);

// Sidecar statuses that produce an explicit exclusion entry (documented reason).
export const EXCLUDED_SIDECAR_STATUSES = new Set([
  'PRESENT_INCOMPLETE',
  'PRESENT_COMPLETE',
  'INVALID_SIDECAR',
]);

// Manifest schema version — must match bootstrap writer (`MANIFEST_SCHEMA_VERSION`).
export const MANIFEST_SCHEMA_VERSION = 1;

// Truth fields that Dean must populate before writer dry-run accepts the manifest.
export const REQUIRED_TRUTH_FIELDS = ['blogger.publishedUrl', 'blogger.publishedAt'];

// Forbidden flags — mutation-like; any occurrence fail-closes without producing output.
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
]);

const USAGE = `Usage: prepare-blogger-backfill-truth-manifest [--json | --manifest-only] [--help]

Generate a deterministic, human-fillable truth-manifest TEMPLATE for the Blogger
backfill candidates currently classified as MISSING_SIDECAR by
plan:blogger-backfill-sidecars.

This command NEVER creates, modifies, or writes any file — the template goes to
stdout only. The template's shape matches the exact schema accepted by
bootstrap-blogger-backfill-sidecars. Truth values (publishedUrl / publishedAt)
are left empty; Dean fills them by hand from Blogger backstage. bloggerPostId is
NOT part of the template — that field is system-supplied (identity A.3) and is
never guessed by any human-driven backfill flow.

Modes:
  (default)          Human-readable summary of what the template would contain,
                     plus per-record inclusion / exclusion reasons. No JSON.
  --json             Full JSON envelope: planner scan result summary, template
                     manifest, per-record excluded list, mutationPerformed=false.
  --manifest-only    Emit only the pure manifest object accepted by the
                     bootstrap writer. Save this to a file, hand-populate the
                     truth fields, then dry-run
                     \`bootstrap:blogger-backfill-sidecars --input <file>\` to
                     verify readiness.

Options:
  --help / -h            Print this usage.
  --repo-root <abs>      (Guard use only.) Absolute path to an alternate repo root
                         used for isolated fixture testing. Defaults to the current
                         repo root.

Fail-closed:
  This generator refuses mutation-like flags: --apply, --write, --output, --out,
  --force, --overwrite, --replace, --merge, --yes, -y, --fix. Any occurrence
  produces exit 1 with no output.

Never fabricates Blogger truth:
  publishedUrl, publishedAt, bloggerPostId, and bloggerBlogId are all real
  Blogger platform values. This generator emits empty strings for the two
  human-supplied fields (publishedUrl / publishedAt) so that Dean fills them in
  by hand; bloggerPostId is not present in the template at all. If the generated
  template is fed as-is to the bootstrap writer, dry-run will fail closed —
  intentionally — because empty publishedUrl / publishedAt are rejected by the
  writer's URL and ISO date validators.
`;

// ── argv parsing ─────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
    manifestOnly: false,
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
    if (a === '--manifest-only') {
      opts.manifestOnly = true;
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

// ── template construction ───────────────────────────────────────────────────

// Build a single deterministic template record. Key ordering is fixed:
// sourcePath first, then blogger { publishedUrl, publishedAt }. Truth values
// are empty strings so the bootstrap writer's validators fail-close on unfilled
// templates (isHttpUrl("") === false; resolvePublishedAt("") not ok).
export function buildTemplateRecord(sourcePath) {
  return {
    sourcePath,
    blogger: {
      publishedUrl: '',
      publishedAt: '',
    },
  };
}

// Given a planner result, produce:
//   - manifest: { schemaVersion: 1, records: [...] }   (writer-compatible)
//   - excluded: [ { sourcePath, sidecarStatus, reason } ]   (documented reason)
//   - summary counts
// All lists are sorted deterministically (by sourcePath ascending).
export function deriveTemplate(plan) {
  const includedCandidates = [];
  const excludedCandidates = [];

  for (const c of plan.candidates) {
    if (INCLUDED_SIDECAR_STATUSES.has(c.sidecarStatus)) {
      includedCandidates.push(c);
    } else {
      excludedCandidates.push(c);
    }
  }

  includedCandidates.sort((a, b) =>
    a.sourcePath < b.sourcePath ? -1 : a.sourcePath > b.sourcePath ? 1 : 0,
  );
  excludedCandidates.sort((a, b) =>
    a.sourcePath < b.sourcePath ? -1 : a.sourcePath > b.sourcePath ? 1 : 0,
  );

  const records = includedCandidates.map((c) => buildTemplateRecord(c.sourcePath));

  const manifest = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    records,
  };

  const excluded = excludedCandidates.map((c) => ({
    sourcePath: c.sourcePath,
    sidecarStatus: c.sidecarStatus,
    reason:
      c.sidecarStatus === 'PRESENT_COMPLETE'
        ? 'sidecar already complete; nothing to bootstrap'
        : c.sidecarStatus === 'PRESENT_INCOMPLETE'
          ? 'sidecar already exists; use backfill:url to populate missing fields (not this template)'
          : c.sidecarStatus === 'INVALID_SIDECAR'
            ? 'sidecar JSON invalid; manual repair required (not template-driven)'
            : `sidecarStatus=${c.sidecarStatus}`,
  }));

  const invalidSourceCount = plan.invalidSources.length;

  const summary = {
    markdownScanned: plan.scanned,
    candidateCount: plan.candidateCount,
    missingSidecarCount: plan.summary.sidecarStatus.MISSING_SIDECAR,
    templateRecordCount: records.length,
    excludedExistingSidecarCount: excludedCandidates.filter(
      (c) => c.sidecarStatus === 'PRESENT_COMPLETE' || c.sidecarStatus === 'PRESENT_INCOMPLETE',
    ).length,
    excludedInvalidSidecarCount: excludedCandidates.filter(
      (c) => c.sidecarStatus === 'INVALID_SIDECAR',
    ).length,
    excludedInvalidSourceCount: invalidSourceCount,
  };

  return { manifest, excluded, summary };
}

// ── formatting ──────────────────────────────────────────────────────────────

export function formatHumanReadable({ plan, template }) {
  const lines = [];
  lines.push('prepare-blogger-backfill-truth-manifest (read-only; no mutation performed)');
  lines.push('');
  lines.push(`Markdown scanned:                    ${template.summary.markdownScanned}`);
  lines.push(`Candidate count:                     ${template.summary.candidateCount}`);
  lines.push(`Missing-sidecar count:               ${template.summary.missingSidecarCount}`);
  lines.push(`Template record count:               ${template.summary.templateRecordCount}`);
  lines.push(`Excluded (existing sidecar):         ${template.summary.excludedExistingSidecarCount}`);
  lines.push(`Excluded (invalid sidecar):          ${template.summary.excludedInvalidSidecarCount}`);
  lines.push(`Excluded (invalid source):           ${template.summary.excludedInvalidSourceCount}`);
  lines.push('Mutation performed:                  NO');
  lines.push('');

  if (template.manifest.records.length === 0) {
    lines.push('(no MISSING_SIDECAR candidates; template would contain zero records)');
    lines.push('');
  } else {
    lines.push('---- template records (included) ----');
    let n = 0;
    for (const r of template.manifest.records) {
      n += 1;
      // Derive target sidecar path deterministically from sourcePath.
      const stem = r.sourcePath.replace(/\.md$/, '');
      const targetSidecar = `${stem}.publish.json`;
      lines.push(`  ${n}. ${r.sourcePath}`);
      lines.push(`     target sidecar:    ${targetSidecar}`);
      lines.push('     required truth fields (Dean must populate before writer accepts):');
      for (const f of REQUIRED_TRUTH_FIELDS) {
        lines.push(`       - ${f}   [human-supplied]   (currently empty; writer will reject until filled)`);
      }
      lines.push(`     inclusion reason:  planner sidecarStatus=MISSING_SIDECAR`);
      lines.push('');
    }
  }

  if (template.excluded.length > 0) {
    lines.push('---- excluded (existing sidecar or invalid) ----');
    for (const e of template.excluded) {
      lines.push(`  - ${e.sourcePath}`);
      lines.push(`      sidecarStatus:  ${e.sidecarStatus}`);
      lines.push(`      reason:         ${e.reason}`);
    }
    lines.push('');
  }

  if (plan.invalidSources.length > 0) {
    lines.push('---- excluded (invalid source) ----');
    for (const s of plan.invalidSources) {
      lines.push(`  - ${s.sourcePath}  [${s.readiness}]`);
      for (const r of s.blockingReasons) {
        lines.push(`      - ${r}`);
      }
    }
    lines.push('');
  }

  lines.push('Next step:');
  lines.push('  1. Re-run with --manifest-only to capture the pure JSON template:');
  lines.push('       npm run prepare:blogger-backfill-truth-manifest -- --manifest-only > <path>');
  lines.push('  2. Populate each record\'s blogger.publishedUrl and blogger.publishedAt by hand from Blogger backstage.');
  lines.push('  3. Verify with the bootstrap writer dry-run (no --apply):');
  lines.push('       npm run bootstrap:blogger-backfill-sidecars -- --input <path>');
  lines.push('  4. Only with explicit approval, run --apply to create sidecars.');
  lines.push('');
  lines.push('This generator never writes files, never guesses Blogger truth, never calls Blogger/Google APIs.');
  return lines.join('\n') + '\n';
}

export function formatJson({ template }) {
  const body = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    mode: 'prepare',
    mutationPerformed: false,
    summary: template.summary,
    manifest: template.manifest,
    excluded: template.excluded,
  };
  return JSON.stringify(body, null, 2) + '\n';
}

export function formatManifestOnly({ template }) {
  return JSON.stringify(template.manifest, null, 2) + '\n';
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
      `[prepare-blogger-backfill-truth-manifest] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This generator is read-only. Mutation-like flags are never accepted; use the bootstrap writer with --apply for actual writes.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[prepare-blogger-backfill-truth-manifest] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  if (opts.json && opts.manifestOnly) {
    process.stderr.write(
      '[prepare-blogger-backfill-truth-manifest] ERROR: --json and --manifest-only are mutually exclusive\n',
    );
    return 1;
  }

  let repoRoot = PROJECT_ROOT;
  if (opts.repoRoot != null) {
    if (!path.isAbsolute(opts.repoRoot)) {
      process.stderr.write(
        `[prepare-blogger-backfill-truth-manifest] ERROR: --repo-root must be an absolute path (got: ${opts.repoRoot})\n`,
      );
      return 1;
    }
    repoRoot = opts.repoRoot;
  }

  const plan = await planMissingSidecars({ repoRoot });
  const template = deriveTemplate(plan);

  if (opts.manifestOnly) {
    process.stdout.write(formatManifestOnly({ template }));
  } else if (opts.json) {
    process.stdout.write(formatJson({ template }));
  } else {
    process.stdout.write(formatHumanReadable({ plan, template }));
  }

  return 0;
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
        `[prepare-blogger-backfill-truth-manifest] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}
