#!/usr/bin/env node
// Phase 20260719：Blogger backfill truth-manifest intake validator（read-only；fail-closed）。
//
// 用途：
//   在使用者填入 truth manifest 後、任何 apply/write 之前，作為嚴格唯讀驗證層。位於：
//     missing-sidecar planner
//     → optional create-only bootstrap
//     → truth-manifest template generator
//     → **本工具**（intake validator；本 slice）
//     → future writer apply（另 slice；本 slice 不執行）
//
// 上游 / policy：
//   - `docs/20260706-blogger-identity-and-backfill-strategy.md` §A（A.1 human / A.3 system）
//   - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（candidate discovery / sidecarStatus）
//   - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`（writer manifest schema；本工具驗證之對象）
//   - `docs/20260718-blogger-backfill-truth-manifest-template.md`（generator；本工具之上游）
//   - `docs/publish-json-schema.md` §5.3 / §5.3.1 / §5.4 / §9.5（URL/publishedAt 為唯一真相、
//     URL yyyy/mm 由平台依當地發布月份產生、URL yyyy/mm 須與 publishYear/publishMonth 一致）
//
// 安全契約（fail-closed；hard-coded）：
//   - 純 read-only：本工具本身不呼叫 fs.writeFile / mkdir / rm / rename / unlink / copyFile。
//   - 不建立 manifest；不重寫 / 格式化 / trim manifest；不寫 `.publish.json`；不 touch Markdown；
//     不呼叫 Blogger / Google API；無網路；無 credential；不透過 child_process 呼叫他人 CLI。
//   - 缺 `--manifest` 即 hard-fail；manifest 不存在 / 非一般檔 / 讀取失敗 / JSON parse 失敗 /
//     schema 不符 → non-zero exit。
//   - 「未提供 truth」的 sentinel（case-insensitive trim 後精確等於 TODO / TBD / UNKNOWN / N/A / NA）
//     於 publishedUrl 或 publishedAt 任一欄出現即 hard-fail；不 trim 原值後放行。
//   - 直接 import bootstrap writer 之 `loadManifest` / `planBootstrap` 重用其 shape / strict URL /
//     strict ISO / duplicate source / duplicate target / source-exists / candidate / target-absent
//     驗證；直接 import planner `planMissingSidecars` 重用其 candidate discovery + sidecarStatus。
//     **不**重寫這些 validator，避免 divergent contract。
//   - 追加驗證（bootstrap dry-run 未覆蓋，本 slice 補足）：
//       (a) coverage：manifest 之 sourcePath 集合須「精確等於」現行所有 `MISSING_SIDECAR`
//           candidate；缺一即 `missing_candidate`，多一即 `unknown_candidate`。
//       (b) sentinel：publishedUrl / publishedAt 精確 match TODO / TBD / UNKNOWN / N/A / NA
//           （case-insensitive；trim 後判定）。
//       (c) publishedUrl 於 manifest 內 uniqueness（bootstrap 只查 sourcePath / target 兩軸）。
//       (d) URL yyyy/mm ↔ publishedAt YYYY-MM 一致（依 §5.3.1 + §9.5；`deriveYearMonth` 為 authority）。
//   - Deterministic：entries 依 sourcePath 升冪、field ordering 固定；輸出**不含** generatedAt /
//     timestamp / absolute machine path / hostname / OS-dependent separator / random ID。同一 frozen
//     repo + 同 manifest 重跑兩次，`--json` stdout bytes 應完全一致。
//
// 本 slice 明確 **不** 做：
//   - 對六篇正式 `20260612-*` 之 production truth 填入 / 驗證真值 / apply。
//   - 呼叫 bootstrap writer `--apply`。
//   - 建立 / 修改 production `.publish.json`。
//   - 動 Blogger / GA4 / AdSense / Google Drive / Search Console / gh-pages / deploy clone / build /
//     deploy / preview / dist-* / dist-blogger-preview/。
//   - 升級任何 warning-only guard 為 blocking。
//
// 使用：
//   npm run validate:blogger-backfill-truth-manifest -- --manifest <path>
//   npm run validate:blogger-backfill-truth-manifest -- --manifest <path> --json
//   npm run validate:blogger-backfill-truth-manifest -- --help
//   [Guard only] --repo-root <abs>：override repo root for synthetic fixture testing.
//                                   Defaults to the current repo root.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadManifest,
  planBootstrap,
  resolveCoverageMode,
  MANIFEST_SCHEMA_VERSION,
  ALLOWED_SOURCE_PREFIX,
} from './bootstrap-blogger-backfill-sidecars.js';
import { planMissingSidecars } from './plan-blogger-backfill-sidecars.js';
import { deriveYearMonth } from './backfill-published-url.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Sentinels for "not yet supplied". Compared case-insensitively against the
// trimmed value. Bootstrap already rejects empty string via strict URL / ISO
// validators; this layer catches human placeholders that happen to be non-empty.
export const TRUTH_SENTINELS = ['TODO', 'TBD', 'UNKNOWN', 'N/A', 'NA'];

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
]);

const USAGE = `Usage: validate-blogger-backfill-truth-manifest --manifest <path> [--json] [--help]

Strict read-only intake validator for a Dean-populated Blogger backfill truth
manifest. Gates the manifest between prepare:blogger-backfill-truth-manifest
(empty template) and bootstrap:blogger-backfill-sidecars (dry-run / apply).

This command NEVER modifies the manifest, NEVER creates or modifies any
\`.publish.json\`, NEVER touches Markdown, NEVER calls Blogger / Google APIs,
and NEVER accesses the network.

Required:
  --manifest <path>         Repo-relative or absolute path to a JSON manifest
                            whose shape matches the writer schema v${MANIFEST_SCHEMA_VERSION}.

Options:
  --json                    Emit a deterministic JSON report to stdout.
  --repo-root <abs>         (Guard use only.) Absolute path to an alternate
                            repo root, for isolated fixture testing.
  --help / -h               Print this usage.

Fail-closed behavior:
  Any of the following causes a non-zero exit and prevents the manifest from
  moving downstream:
    - missing --manifest, forbidden flag, unknown flag
    - manifest read / parse failure, unknown top-level field, wrong schemaVersion
    - invalid per-record shape (unknown key, non-\`content/blogger/posts/\`
      sourcePath, empty / whitespace-padded / non-http(s) publishedUrl, empty /
      whitespace-padded / non-strict-ISO / calendar-invalid publishedAt)
    - duplicate sourcePath or duplicate target sidecar within the manifest
    - source Markdown missing, non-candidate, or target sidecar already exists
    - coverage error: a current MISSING_SIDECAR candidate is not covered by any
      manifest entry, or a manifest entry does not correspond to a current
      MISSING_SIDECAR candidate
    - sentinel truth: publishedUrl or publishedAt equals (case-insensitive,
      trimmed) any of ${TRUTH_SENTINELS.map((s) => JSON.stringify(s)).join(' / ')}
    - duplicate publishedUrl within the manifest
    - cross-field mismatch: publishedUrl \`/YYYY/MM/\` does not equal
      publishedAt YYYY-MM (per publish-json-schema §5.3.1 + §9.5)

This validator never guesses Blogger truth: publishedUrl / publishedAt / any
Blogger identifier must be supplied by Dean. Missing or malformed truth is a
hard block, never a warning.
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

// ── layered checks ──────────────────────────────────────────────────────────

// Compare trimmed value case-insensitively to sentinel list.
function matchesSentinel(rawValue) {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim().toUpperCase();
  for (const s of TRUTH_SENTINELS) {
    if (trimmed === s.toUpperCase()) return s;
  }
  return null;
}

// Extract /YYYY/MM/ month tuple from a Blogger post URL. Returns null when the
// URL does not contain the yyyy/mm segment (e.g., a non-post URL, though this
// validator only accepts sourcePath under content/blogger/posts/ so all URLs
// should be post URLs and thus should have /yyyy/mm/).
function extractUrlYearMonth(url) {
  if (typeof url !== 'string') return null;
  const m = /\/(\d{4})\/(\d{2})\//.exec(url);
  if (!m) return null;
  return { year: m[1], month: m[2] };
}

// Shape-validate a single declared `coverage.selectedSourcePaths` entry. Mirrors
// the record sourcePath contract enforced by the bootstrap writer's shape layer,
// but applies to the explicit selection declaration itself. Returns null when OK.
function validateSelectedPathShape(s) {
  if (typeof s !== 'string' || s === '') {
    return 'selectedSourcePaths entry must be a non-empty string';
  }
  if (s !== s.trim()) {
    return `selectedSourcePaths entry has surrounding whitespace: ${JSON.stringify(s)}`;
  }
  if (path.isAbsolute(s) || s.includes('\\')) {
    return `selectedSourcePaths entry must be repo-relative POSIX-style: ${JSON.stringify(s)}`;
  }
  if (s.split('/').includes('..')) {
    return `selectedSourcePaths entry must not contain "..": ${JSON.stringify(s)}`;
  }
  if (!s.startsWith(ALLOWED_SOURCE_PREFIX)) {
    return `selectedSourcePaths entry must be within ${ALLOWED_SOURCE_PREFIX}: ${JSON.stringify(s)}`;
  }
  if (!s.endsWith('.md') || s.endsWith('.fb.md')) {
    return `selectedSourcePaths entry must be a Blogger post Markdown (.md, not .fb.md): ${JSON.stringify(s)}`;
  }
  return null;
}

// Coverage cross-check: manifest sourcePath set vs current MISSING_SIDECAR
// candidate set. Two modes (Phase 20260720):
//
//   full (default; coverage absent or coverage.mode === 'full'):
//     manifest sourcePath set must be EXACTLY the current MISSING_SIDECAR set.
//     Any omission → missing_candidate; any extra → unknown_candidate. This is the
//     unchanged legacy behavior. A manifest that "just happens to have fewer
//     records" is NEVER silently treated as a subset — it fails as full coverage.
//
//   selected (coverage.mode === 'selected' + coverage.selectedSourcePaths):
//     the operator explicitly declares a NON-EMPTY subset of the current
//     MISSING_SIDECAR candidates to backfill this time. Enforced:
//       - selectedSourcePaths non-empty
//       - each entry canonical repo-relative under content/blogger/posts/ (.md)
//       - no duplicate selectedSourcePaths entry
//       - manifest record set === declared selection set EXACTLY (declared-but-
//         absent and undeclared-record are both hard errors — self-carrying
//         explicit data, so a dropped record is caught rather than silently
//         narrowing coverage)
//       - every declared path is currently MISSING_SIDECAR (catches unknown paths,
//         already-existing sidecars, and non-candidate paths)
//     Selected mode deliberately does NOT require covering every current
//     MISSING_SIDECAR candidate; unselected candidates remain reported as
//     `missingCandidates` (informational) and continue to surface in the planner.
function computeCoverage({ manifest, plan }) {
  const currentMissing = plan.candidates
    .filter((c) => c.sidecarStatus === 'MISSING_SIDECAR')
    .map((c) => c.sourcePath);
  const currentMissingSet = new Set(currentMissing);

  const manifestPaths = manifest.records
    .map((r) => (r && typeof r.sourcePath === 'string' ? r.sourcePath : null))
    .filter((p) => typeof p === 'string');
  const manifestPathSet = new Set(manifestPaths);

  const missing = currentMissing.filter((p) => !manifestPathSet.has(p)).sort();
  const unknown = [...manifestPathSet]
    .filter((p) => !currentMissingSet.has(p))
    .sort();

  const { mode, selectedSourcePaths } = resolveCoverageMode(manifest);
  const errors = [];

  if (mode === 'full') {
    for (const p of missing) {
      errors.push(
        `coverage: current MISSING_SIDECAR candidate not covered by manifest: ${p}`,
      );
    }
    for (const p of unknown) {
      errors.push(
        `coverage: manifest entry does not correspond to a current MISSING_SIDECAR candidate: ${p}`,
      );
    }
    return {
      mode: 'full',
      selectedSourcePaths: null,
      currentMissingSidecarPaths: [...currentMissing].sort(),
      manifestSourcePaths: [...manifestPaths].sort(),
      missingCandidates: missing,
      unknownCandidates: unknown,
      declaredButAbsent: [],
      undeclaredRecords: [],
      notMissingSelected: [],
      coverageOk: errors.length === 0,
      errors,
    };
  }

  // ── selected mode ─────────────────────────────────────────────────────────
  const declared = selectedSourcePaths; // array (possibly empty)
  const declaredSorted = [...declared].sort();

  if (declared.length === 0) {
    errors.push(
      'coverage(selected): coverage.selectedSourcePaths must declare a non-empty selection',
    );
  }

  const seen = new Set();
  const dupes = new Set();
  for (const p of declared) {
    const shapeErr = validateSelectedPathShape(p);
    if (shapeErr) errors.push(`coverage(selected): ${shapeErr}`);
    if (seen.has(p)) dupes.add(p);
    seen.add(p);
  }
  for (const p of [...dupes].sort()) {
    errors.push(`coverage(selected): duplicate selectedSourcePaths entry: ${p}`);
  }

  const declaredSet = new Set(declared);
  const declaredButAbsent = [...declaredSet]
    .filter((p) => !manifestPathSet.has(p))
    .sort();
  const undeclaredRecords = [...manifestPathSet]
    .filter((p) => !declaredSet.has(p))
    .sort();
  for (const p of declaredButAbsent) {
    errors.push(
      `coverage(selected): declared selectedSourcePaths entry has no matching manifest record: ${p}`,
    );
  }
  for (const p of undeclaredRecords) {
    errors.push(
      `coverage(selected): manifest record is not declared in coverage.selectedSourcePaths: ${p}`,
    );
  }

  const notMissingSelected = [...declaredSet]
    .filter((p) => !currentMissingSet.has(p))
    .sort();
  for (const p of notMissingSelected) {
    errors.push(
      `coverage(selected): selected path is not a current MISSING_SIDECAR candidate ` +
        `(unknown / already has sidecar / not a candidate): ${p}`,
    );
  }

  return {
    mode: 'selected',
    selectedSourcePaths: declaredSorted,
    currentMissingSidecarPaths: [...currentMissing].sort(),
    manifestSourcePaths: [...manifestPaths].sort(),
    // Informational in selected mode: candidates the operator did NOT select.
    // NOT an error — they stay visible in the planner and are backfilled later.
    missingCandidates: missing,
    unknownCandidates: unknown,
    declaredButAbsent,
    undeclaredRecords,
    notMissingSelected,
    coverageOk: errors.length === 0,
    errors,
  };
}

// ── main validator API ─────────────────────────────────────────────────────

// Runs every layered check and returns a stable report. Never mutates inputs.
export async function validateTruthManifest({ manifestPath, repoRoot }) {
  const errors = [];
  const layerErrors = {
    envelope: [],
    shape: [],
    coverage: [],
    sentinel: [],
    duplicateUrl: [],
    monthConsistency: [],
  };
  const perEntry = new Map();

  // Layer A: manifest envelope (schemaVersion, top-level keys, records is array).
  const loaded = await loadManifest(manifestPath);
  if (!loaded.ok) {
    layerErrors.envelope.push(loaded.error);
    errors.push(loaded.error);
    return {
      ok: false,
      manifestPath,
      envelopeOk: false,
      envelopeError: loaded.error,
      manifest: null,
      plan: null,
      shape: null,
      coverage: null,
      sentinelHits: [],
      duplicateUrls: [],
      monthMismatches: [],
      entries: [],
      layerErrors,
      errors,
      summary: {
        recordCount: 0,
        validCount: 0,
        invalidCount: 0,
      },
    };
  }
  const manifest = loaded.manifest;

  // Discover current MISSING_SIDECAR candidates for coverage.
  const plan = await planMissingSidecars({ repoRoot });

  // Layer B: per-record shape + strict URL/ISO + filesystem candidate + duplicate.
  // Reuse writer planBootstrap. It never mutates; it only accesses fs for read.
  const shape = await planBootstrap({ manifest, repoRoot });
  for (const entry of shape.entries) {
    const per = {
      recordIndex: entry.recordIndex,
      sourcePath: entry.sourcePath,
      readiness: entry.readiness,
      shapeReasons: entry.reasons.slice(),
      sentinelReasons: [],
      duplicateUrlReasons: [],
      monthMismatchReasons: [],
    };
    perEntry.set(entry.recordIndex, per);
    if (entry.readiness !== 'READY_FOR_WRITE') {
      for (const r of entry.reasons) {
        layerErrors.shape.push(`records[${entry.recordIndex}] ${r}`);
        errors.push(`records[${entry.recordIndex}] ${r}`);
      }
    }
  }

  // Layer C: coverage (mode-aware; full = exact-all, selected = declared subset).
  const coverage = computeCoverage({ manifest, plan });
  for (const msg of coverage.errors) {
    layerErrors.coverage.push(msg);
    errors.push(msg);
  }

  // Layer D: sentinel rejection.
  // Layer E: URL uniqueness (whole-manifest scope).
  // Layer F: URL /YYYY/MM/ ↔ publishedAt YYYY-MM consistency.
  const sentinelHits = [];
  const monthMismatches = [];
  const urlBuckets = new Map(); // publishedUrl → [recordIndex, ...]

  for (let i = 0; i < manifest.records.length; i += 1) {
    const record = manifest.records[i];
    const per = perEntry.get(i);
    if (!record || typeof record !== 'object' || Array.isArray(record) ||
        !record.blogger || typeof record.blogger !== 'object' ||
        Array.isArray(record.blogger)) {
      continue;
    }
    const rawUrl = record.blogger.publishedUrl;
    const rawAt = record.blogger.publishedAt;

    // sentinel checks (layer D)
    const urlSentinel = matchesSentinel(rawUrl);
    if (urlSentinel != null) {
      const msg =
        `records[${i}].blogger.publishedUrl is a placeholder sentinel (${JSON.stringify(rawUrl)}); ` +
        `supply the real Blogger URL from backstage`;
      sentinelHits.push({
        recordIndex: i,
        sourcePath: record.sourcePath ?? null,
        field: 'blogger.publishedUrl',
        sentinel: urlSentinel,
        value: rawUrl,
      });
      layerErrors.sentinel.push(msg);
      errors.push(msg);
      if (per) per.sentinelReasons.push(msg);
    }
    const atSentinel = matchesSentinel(rawAt);
    if (atSentinel != null) {
      const msg =
        `records[${i}].blogger.publishedAt is a placeholder sentinel (${JSON.stringify(rawAt)}); ` +
        `supply the real Blogger publishedAt from backstage`;
      sentinelHits.push({
        recordIndex: i,
        sourcePath: record.sourcePath ?? null,
        field: 'blogger.publishedAt',
        sentinel: atSentinel,
        value: rawAt,
      });
      layerErrors.sentinel.push(msg);
      errors.push(msg);
      if (per) per.sentinelReasons.push(msg);
    }

    // URL uniqueness (layer E)
    if (typeof rawUrl === 'string' && rawUrl.trim() !== '') {
      const key = rawUrl;
      if (!urlBuckets.has(key)) urlBuckets.set(key, []);
      urlBuckets.get(key).push(i);
    }

    // month consistency (layer F). Skip when either side is unusable — those
    // are already reported by the shape layer, so re-reporting here would just
    // add noise; but do check when both parse cleanly.
    if (typeof rawUrl === 'string' && typeof rawAt === 'string' &&
        rawUrl.trim() !== '' && rawAt.trim() !== '') {
      const urlYm = extractUrlYearMonth(rawUrl);
      const atYm = deriveYearMonth(rawAt);
      const atOk = atYm.year !== '' && atYm.month !== '';
      if (urlYm == null) {
        // URL passed strict http(s) but has no /YYYY/MM/ segment. All manifest
        // sourcePath entries are Blogger posts (ALLOWED_SOURCE_PREFIX enforced by
        // shape layer), so the URL must contain /YYYY/MM/ per publish-json-schema
        // §5.3.1. Missing segment is a hard cross-field failure.
        const msg =
          `records[${i}].blogger.publishedUrl has no /YYYY/MM/ segment ` +
          `(expected for Blogger post URLs; got ${JSON.stringify(rawUrl)})`;
        monthMismatches.push({
          recordIndex: i,
          sourcePath: record.sourcePath ?? null,
          urlYearMonth: null,
          publishedAtYearMonth: atOk ? atYm : null,
          reason: 'url_missing_yyyy_mm',
        });
        layerErrors.monthConsistency.push(msg);
        errors.push(msg);
        if (per) per.monthMismatchReasons.push(msg);
      } else if (atOk && (urlYm.year !== atYm.year || urlYm.month !== atYm.month)) {
        const msg =
          `records[${i}] blogger.publishedUrl /YYYY/MM/ ` +
          `(${urlYm.year}/${urlYm.month}) does not match blogger.publishedAt ` +
          `year-month (${atYm.year}-${atYm.month})`;
        monthMismatches.push({
          recordIndex: i,
          sourcePath: record.sourcePath ?? null,
          urlYearMonth: urlYm,
          publishedAtYearMonth: atYm,
          reason: 'url_month_mismatch',
        });
        layerErrors.monthConsistency.push(msg);
        errors.push(msg);
        if (per) per.monthMismatchReasons.push(msg);
      }
    }
  }

  const duplicateUrls = [];
  for (const [url, indices] of [...urlBuckets.entries()].sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    if (indices.length > 1) {
      const sorted = [...indices].sort((x, y) => x - y);
      const msg =
        `duplicate blogger.publishedUrl (${JSON.stringify(url)}) shared by ` +
        `records[${sorted.join(', ')}]`;
      duplicateUrls.push({ url, recordIndexes: sorted });
      layerErrors.duplicateUrl.push(msg);
      errors.push(msg);
      for (const idx of sorted) {
        const per = perEntry.get(idx);
        if (per) per.duplicateUrlReasons.push(msg);
      }
    }
  }

  // Assemble final per-entry list, sorted deterministically by sourcePath then
  // recordIndex. Note: entries with invalid shape may lack sourcePath; those
  // sort under null / '' which is fine (they will already be surfaced by shape
  // errors).
  const entries = [...perEntry.values()]
    .map((e) => {
      const reasons = [];
      for (const r of e.shapeReasons) reasons.push(r);
      for (const r of e.sentinelReasons) reasons.push(r);
      for (const r of e.duplicateUrlReasons) reasons.push(r);
      for (const r of e.monthMismatchReasons) reasons.push(r);
      const ok =
        e.readiness === 'READY_FOR_WRITE' &&
        e.sentinelReasons.length === 0 &&
        e.duplicateUrlReasons.length === 0 &&
        e.monthMismatchReasons.length === 0;
      return {
        recordIndex: e.recordIndex,
        sourcePath: e.sourcePath,
        readiness: e.readiness,
        ok,
        reasons,
      };
    })
    .sort((a, b) => {
      const sa = a.sourcePath ?? '';
      const sb = b.sourcePath ?? '';
      if (sa < sb) return -1;
      if (sa > sb) return 1;
      return a.recordIndex - b.recordIndex;
    });

  const validCount = entries.filter((e) => e.ok).length;
  const invalidCount = entries.length - validCount;
  const ok = errors.length === 0;

  return {
    ok,
    manifestPath,
    envelopeOk: true,
    envelopeError: null,
    manifest,
    plan,
    shape,
    coverage,
    sentinelHits,
    duplicateUrls,
    monthMismatches,
    entries,
    layerErrors,
    errors,
    summary: {
      recordCount: manifest.records.length,
      validCount,
      invalidCount,
      candidateCount: plan.candidateCount,
      currentMissingSidecarCount: plan.summary.sidecarStatus.MISSING_SIDECAR,
      coverageMode: coverage.mode,
      selectedCount:
        coverage.mode === 'selected' ? coverage.selectedSourcePaths.length : null,
      missingCandidateCount: coverage.missingCandidates.length,
      unknownCandidateCount: coverage.unknownCandidates.length,
      duplicateUrlCount: duplicateUrls.length,
      sentinelHitCount: sentinelHits.length,
      monthMismatchCount: monthMismatches.length,
    },
  };
}

// ── formatting ──────────────────────────────────────────────────────────────

export function formatHumanReadable(report) {
  const lines = [];
  lines.push('validate-blogger-backfill-truth-manifest (read-only; no apply performed)');
  lines.push('');
  lines.push(`manifest path:                       ${report.manifestPath}`);
  if (!report.envelopeOk) {
    lines.push(`envelope error:                      ${report.envelopeError}`);
    lines.push('');
    lines.push('Overall: FAIL');
    return lines.join('\n') + '\n';
  }
  lines.push(`candidate count:                     ${report.summary.candidateCount}`);
  lines.push(`current MISSING_SIDECAR count:       ${report.summary.currentMissingSidecarCount}`);
  lines.push(`coverage mode:                       ${report.summary.coverageMode ?? '(unknown)'}`);
  if (report.summary.coverageMode === 'selected') {
    lines.push(`selected count:                      ${report.summary.selectedCount}`);
  }
  lines.push(`manifest record count:               ${report.summary.recordCount}`);
  lines.push(`valid entries:                       ${report.summary.validCount}`);
  lines.push(`invalid entries:                     ${report.summary.invalidCount}`);
  lines.push(`missing candidates (not in manifest):${' '.repeat(1)}${report.summary.missingCandidateCount}`);
  lines.push(`unknown candidates (not MISSING):    ${report.summary.unknownCandidateCount}`);
  lines.push(`duplicate publishedUrl groups:       ${report.summary.duplicateUrlCount}`);
  lines.push(`sentinel hits:                       ${report.summary.sentinelHitCount}`);
  lines.push(`URL/publishedAt month mismatches:    ${report.summary.monthMismatchCount}`);
  lines.push('Apply performed:                     NO');
  lines.push('');

  if (report.coverage && report.coverage.missingCandidates.length > 0) {
    if (report.coverage.mode === 'selected') {
      lines.push('---- unselected candidates (intentionally deferred; still in planner inventory) ----');
    } else {
      lines.push('---- missing candidates (manifest is incomplete) ----');
    }
    for (const p of report.coverage.missingCandidates) {
      lines.push(`  - ${p}`);
    }
    lines.push('');
  }
  if (report.coverage && report.coverage.unknownCandidates.length > 0) {
    lines.push('---- unknown candidates (manifest contains non-MISSING_SIDECAR entries) ----');
    for (const p of report.coverage.unknownCandidates) {
      lines.push(`  - ${p}`);
    }
    lines.push('');
  }

  if (report.entries.length === 0) {
    lines.push('(manifest contained no records)');
    lines.push('');
  } else {
    lines.push('---- entries ----');
    let n = 0;
    for (const e of report.entries) {
      n += 1;
      lines.push(`  ${n}. ${e.sourcePath ?? '(no sourcePath)'}`);
      lines.push(`     readiness:  ${e.readiness}`);
      lines.push(`     entry ok:   ${e.ok ? 'YES' : 'NO'}`);
      if (e.reasons.length > 0) {
        lines.push('     reasons:');
        for (const r of e.reasons) {
          lines.push(`       - ${r}`);
        }
      }
      lines.push('');
    }
  }

  lines.push('This validator never modifies the manifest, never creates or modifies');
  lines.push('any .publish.json, never touches Markdown, and never calls Blogger APIs.');
  lines.push(`Overall: ${report.ok ? 'PASS' : 'FAIL'}`);
  return lines.join('\n') + '\n';
}

// Build a stable, deterministic JSON body. Field ordering is fixed by object
// literal insertion order; entries/lists are pre-sorted upstream.
export function formatJson(report) {
  const body = {
    schemaVersion: 1,
    mode: 'validate',
    mutationPerformed: false,
    manifestPath: report.manifestPath,
    envelopeOk: report.envelopeOk,
    envelopeError: report.envelopeError,
    summary: report.summary,
    ok: report.ok,
    coverage: report.coverage
      ? {
          mode: report.coverage.mode,
          selectedSourcePaths: report.coverage.selectedSourcePaths,
          currentMissingSidecarPaths: report.coverage.currentMissingSidecarPaths,
          manifestSourcePaths: report.coverage.manifestSourcePaths,
          missingCandidates: report.coverage.missingCandidates,
          unknownCandidates: report.coverage.unknownCandidates,
          declaredButAbsent: report.coverage.declaredButAbsent,
          undeclaredRecords: report.coverage.undeclaredRecords,
          notMissingSelected: report.coverage.notMissingSelected,
          coverageOk: report.coverage.coverageOk,
        }
      : null,
    sentinelHits: report.sentinelHits,
    duplicateUrls: report.duplicateUrls,
    monthMismatches: report.monthMismatches,
    entries: report.entries,
    errors: report.errors,
  };
  return JSON.stringify(body, null, 2) + '\n';
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
      `[validate-blogger-backfill-truth-manifest] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This validator is read-only. Mutation-like flags are never accepted; use the bootstrap writer with --apply for actual writes.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[validate-blogger-backfill-truth-manifest] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  if (!opts.manifest) {
    process.stderr.write(
      '[validate-blogger-backfill-truth-manifest] ERROR: --manifest <path> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }

  let repoRoot = PROJECT_ROOT;
  if (opts.repoRoot != null) {
    if (!path.isAbsolute(opts.repoRoot)) {
      process.stderr.write(
        `[validate-blogger-backfill-truth-manifest] ERROR: --repo-root must be an absolute path (got: ${opts.repoRoot})\n`,
      );
      return 1;
    }
    repoRoot = opts.repoRoot;
  }

  const manifestPath = path.isAbsolute(opts.manifest)
    ? opts.manifest
    : path.resolve(process.cwd(), opts.manifest);

  const report = await validateTruthManifest({ manifestPath, repoRoot });

  if (opts.json) {
    process.stdout.write(formatJson(report));
  } else {
    process.stdout.write(formatHumanReadable(report));
  }

  return report.ok ? 0 : 1;
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
        `[validate-blogger-backfill-truth-manifest] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}

export { ALLOWED_SOURCE_PREFIX, MANIFEST_SCHEMA_VERSION };
