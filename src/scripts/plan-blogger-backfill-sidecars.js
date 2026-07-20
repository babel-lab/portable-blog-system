#!/usr/bin/env node
// Phase 20260718：missing `.publish.json` sidecar bootstrap planner（report-only；warning-only）。
//
// 用途：
//   對現行 Blogger backfill candidates 產出「若未來要建立缺漏之 `.publish.json` sidecar，
//   需要哪些 Blogger 平台真值 / 阻擋原因為何」之 deterministic dry-run plan。
//   本工具**只**盤點與分類；**不**建立、修改、覆寫任何 `.publish.json`；**不**呼叫 Blogger
//   / Google API；**不**發布；**不**猜測 Blogger URL / postId / publishedAt / bloggerBlogId。
//   未來 write path 屬另一 slice，須另開 phase + Dean explicit approval。
//
// Candidate discovery（與 `check-blogger-backfill.js` 語意一致）：
//   scan `content/blogger/posts/**/*.md`（排除 `*.fb.md`），frontmatter 滿足：
//     - publishTargets.blogger.enabled === true
//     - draft !== true
//     - status ∈ [ready, published]
//   即為 candidate。**不**硬編碼檔名清單；**不**改變父 guard 之判定。
//
// Truth field 分層（依 docs/20260706-blogger-identity-and-backfill-strategy.md §A）：
//   - human-supplied（A.1；Dean 從 Blogger 後台可取得）：blogger.publishedUrl / blogger.publishedAt
//   - system-supplied（A.3；未來 Blogger API flow 取得，非人工 backfill）：blogger.bloggerPostId
//   * `bloggerBlogId` 屬站台級設定，非逐篇 sidecar truth；本 planner **不**逐篇列 required。
//
// sidecarStatus 分類（fixed enum）：
//   - MISSING_SIDECAR   `.publish.json` 不存在（同名同資料夾）
//   - PRESENT_INCOMPLETE sidecar 存在，但至少一項 human-supplied truth field 為空 / 空白
//   - PRESENT_COMPLETE  sidecar 存在，所有 human-supplied truth fields 均非空
//   - INVALID_SIDECAR   sidecar 存在但 JSON 解析失敗
//
// readiness 分類（fixed enum）：
//   - BLOCKED               任一 human-supplied truth 缺；或 sidecar missing / invalid
//   - READY_FOR_FUTURE_BOOTSTRAP 保留列舉；本 slice 永不產生（不存在 human truth 已備妥、但仍待寫入之情境）
//   - NO_ACTION_REQUIRED    sidecar 存在且所有 human-supplied truth 已備妥（system-supplied 缺失屬 informational）
//   - INVALID_SOURCE        markdown / frontmatter 解析失敗、或 candidate 重複
//
// 契約（fail-closed）：
//   - 純 read-only；planner 執行前後 repo 檔案 bytes / mtime 均不變。
//   - 預設輸出至 stdout（human-readable 或 `--json`）；**無** --output / --write / --apply / --force /
//     --yes / --create-sidecar 等寫入 / 覆蓋 flag，出現即 hard-fail（防止未來誤加）。
//   - Deterministic：candidate 依 markdown 相對路徑升冪排序；field ordering 固定；輸出不含
//     absolute machine path / current timestamp / locale-dependent date rendering。
//   - Exit 0 覆蓋「正常完成（含全部 BLOCKED）」；Exit 1 僅覆蓋 malformed source / invalid CLI 使用 /
//     重複 candidate / internal invariant。
//
// 使用：
//   npm run plan:blogger-backfill-sidecars              # human-readable
//   npm run plan:blogger-backfill-sidecars -- --json    # JSON to stdout
//   npm run plan:blogger-backfill-sidecars -- --help
//   node src/scripts/plan-blogger-backfill-sidecars.js [--json | --help] [--content-root <abs>]

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

import { isProductionStage } from './publish-stage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Truth field 分層。順序即 output ordering。
export const REQUIRED_TRUTH_FIELDS = [
  { field: 'blogger.publishedUrl', role: 'human-supplied' },
  { field: 'blogger.publishedAt', role: 'human-supplied' },
  { field: 'blogger.bloggerPostId', role: 'system-supplied' },
];

export const SIDECAR_STATUSES = [
  'MISSING_SIDECAR',
  'PRESENT_INCOMPLETE',
  'PRESENT_COMPLETE',
  'INVALID_SIDECAR',
];

export const READINESS_STATES = [
  'BLOCKED',
  'READY_FOR_FUTURE_BOOTSTRAP',
  'NO_ACTION_REQUIRED',
  'INVALID_SOURCE',
];

// 禁止之 write / apply flag：出現即 hard-fail（防止未來誤加寫入介面）。
const FORBIDDEN_FLAGS = new Set([
  '--write',
  '--apply',
  '--force',
  '--yes',
  '--create-sidecar',
  '--output',
  '--out',
  '--fix',
]);

const USAGE = `Usage: plan-blogger-backfill-sidecars [--json] [--help] [--content-root <abs>]

Scan current Blogger backfill candidates and report which .publish.json sidecars
are missing or incomplete, along with the human-supplied truth fields required
to bootstrap them in a future slice.

This command never creates or modifies .publish.json files.
Missing publication truth remains blocked until supplied and explicitly authorized.

Options:
  --json                    Emit stable JSON plan to stdout instead of human-readable text.
  --content-root <abs>      (Guard use only.) Absolute path to an alternate content root
                            for isolated fixtures. Defaults to \`\${repo}/content/blogger/posts\`.
  --help / -h               Print this usage.

Behavior:
  - Candidate discovery mirrors check:blogger-backfill (publishTargets.blogger.enabled === true
    AND status in [ready, published] AND draft !== true).
  - Truth fields are classified by role:
      human-supplied  blogger.publishedUrl / blogger.publishedAt (from Blogger backstage)
      system-supplied blogger.bloggerPostId (captured only via future Blogger API flow)
    Missing system-supplied fields are informational and never block readiness alone.
  - sidecarStatus / readiness enums are fixed (see \`SIDECAR_STATUSES\` / \`READINESS_STATES\`
    in the source header).
  - Exit 0 covers all normal outcomes (including everything BLOCKED). Exit 1 covers only
    malformed source, duplicate slug, invalid CLI usage, or internal invariant failure.
  - Never writes any file. Never calls Blogger / Google API. Never guesses publication truth.
`;

// ── argv parsing ─────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
    contentRoot: null,
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
    if (a === '--content-root') {
      opts.contentRoot = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--content-root=')) {
      opts.contentRoot = a.slice('--content-root='.length);
      continue;
    }
    if (FORBIDDEN_FLAGS.has(a)) {
      opts.forbidden.push(a);
      continue;
    }
    // 帶值形亦拒（--write=1 / --apply=true / ...）
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

// ── helpers ──────────────────────────────────────────────────────────────────

function toRelFromRoot(p, root) {
  return path.relative(root, p).split(path.sep).join('/');
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// Present == non-empty string OR finite number；與 check-blogger-backfill.js `isPresent` 一致。
function isPresentValue(v) {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'number') return Number.isFinite(v);
  return false;
}

function getBloggerBlock(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const b = obj.blogger;
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  return b;
}

function isCandidate(fm) {
  if (!fm || typeof fm !== 'object') return false;
  const blogger = fm.publishTargets && fm.publishTargets.blogger;
  const enabled = !!(blogger && blogger.enabled === true);
  if (!enabled) return false;
  if (fm.draft === true) return false;
  const status = typeof fm.status === 'string' ? fm.status.trim() : '';
  if (status !== 'ready' && status !== 'published') return false;
  // Phase 20260720 Slice 2：Blogger production stage 過濾。preview / invalid 均排除；
  //   downstream truth-manifest / apply-plan / apply 均以此 candidate set 為唯一事實來源，
  //   故 preview-stage 之 Blogger target 不會出現於 truth-manifest 之 coverage。
  //   missing stage → production（backward compat）。
  return isProductionStage(blogger.stage, 'blogger');
}

async function readSidecarIfExists(mdFile) {
  const dir = path.dirname(mdFile);
  const stem = path.basename(mdFile, path.extname(mdFile));
  const sidecarPath = path.join(dir, `${stem}.publish.json`);
  try {
    const raw = await fs.readFile(sidecarPath, 'utf-8');
    try {
      const parsed = JSON.parse(raw);
      return { path: sidecarPath, data: parsed, exists: true, parseError: null };
    } catch (err) {
      return { path: sidecarPath, data: null, exists: true, parseError: err.message };
    }
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return { path: sidecarPath, data: null, exists: false, parseError: null };
    }
    throw err;
  }
}

function slugForCandidate(fm, mdFile) {
  if (isNonEmptyString(fm.slug)) return fm.slug.trim();
  const stem = path.basename(mdFile, path.extname(mdFile));
  const m = stem.match(/^\d{8}-(.+)$/);
  return m ? m[1] : stem;
}

// Field short name = last segment after "blogger."
function shortField(field) {
  return field.replace(/^blogger\./, '');
}

// ── core：build one candidate entry ─────────────────────────────────────────

function classifyCandidate({ mdFile, contentRoot, fm, sidecar }) {
  const known = [];
  const missing = [];
  const details = [];

  for (const spec of REQUIRED_TRUTH_FIELDS) {
    const short = shortField(spec.field);
    let value = null;
    let source = 'missing';
    if (sidecar && sidecar.data) {
      const b = getBloggerBlock(sidecar.data);
      if (b && isPresentValue(b[short])) {
        value = b[short];
        source = 'sidecar';
      }
    }
    // Sidecar 為 canonical source；本 planner 不 fallback frontmatter（backfill 目標是 sidecar）。
    // 若 sidecar 未存在或該欄空，就算 frontmatter legacy 有值也視為 missing —— 因為未來 write path
    // 之寫入標的即 sidecar，該欄仍需人工提供（或系統整合後由 API 取得）。
    const present = source === 'sidecar';
    if (present) {
      known.push(spec.field);
    } else {
      missing.push(spec.field);
    }
    details.push({
      field: spec.field,
      role: spec.role,
      present,
    });
  }

  // sidecarStatus
  let sidecarStatus;
  if (!sidecar || (!sidecar.exists && !sidecar.parseError)) {
    sidecarStatus = 'MISSING_SIDECAR';
  } else if (sidecar.parseError) {
    sidecarStatus = 'INVALID_SIDECAR';
  } else {
    // Sidecar exists and is valid JSON.
    const humanFieldsMissing = REQUIRED_TRUTH_FIELDS
      .filter((s) => s.role === 'human-supplied')
      .some((s) => missing.includes(s.field));
    sidecarStatus = humanFieldsMissing ? 'PRESENT_INCOMPLETE' : 'PRESENT_COMPLETE';
  }

  // readiness + blockingReasons + suggestedNextHumanAction
  const blockingReasons = [];
  const humanMissingFields = REQUIRED_TRUTH_FIELDS
    .filter((s) => s.role === 'human-supplied' && missing.includes(s.field))
    .map((s) => s.field);
  const systemMissingFields = REQUIRED_TRUTH_FIELDS
    .filter((s) => s.role === 'system-supplied' && missing.includes(s.field))
    .map((s) => s.field);

  let readiness;
  let suggestedNextHumanAction;
  if (sidecarStatus === 'INVALID_SIDECAR') {
    readiness = 'BLOCKED';
    blockingReasons.push(`sidecar JSON parse error: ${sidecar.parseError}`);
    suggestedNextHumanAction =
      'Manually inspect and repair the sidecar JSON; do not use this planner to auto-fix.';
  } else if (sidecarStatus === 'MISSING_SIDECAR') {
    readiness = 'BLOCKED';
    blockingReasons.push('sidecar file does not exist');
    for (const f of humanMissingFields) {
      blockingReasons.push(`human-supplied truth missing: ${f}`);
    }
    suggestedNextHumanAction =
      'Wait for Dean to supply Blogger backstage truth (publishedUrl, publishedAt) before a future authorized bootstrap slice creates this sidecar; this planner does not create it.';
  } else if (sidecarStatus === 'PRESENT_INCOMPLETE') {
    readiness = 'BLOCKED';
    for (const f of humanMissingFields) {
      blockingReasons.push(`human-supplied truth missing: ${f}`);
    }
    suggestedNextHumanAction =
      'Wait for Dean to supply the missing human truth field(s); a future authorized backfill slice would write them via the existing `backfill:url` path — not via this planner.';
  } else {
    // PRESENT_COMPLETE
    readiness = 'NO_ACTION_REQUIRED';
    suggestedNextHumanAction =
      systemMissingFields.length > 0
        ? 'No human action required. System-supplied field(s) remain empty and will be captured by future Blogger API integration; this planner does not populate them.'
        : 'No human action required. Sidecar already complete.';
  }

  const slug = slugForCandidate(fm, mdFile);
  const dir = path.dirname(mdFile);
  const stem = path.basename(mdFile, path.extname(mdFile));
  const expectedSidecarPath = path.join(dir, `${stem}.publish.json`);

  return {
    sourcePath: toRelFromRoot(mdFile, contentRoot.repoRoot),
    slug,
    expectedSidecarPath: toRelFromRoot(expectedSidecarPath, contentRoot.repoRoot),
    sidecarStatus,
    requiredTruthFields: details,
    knownTruthFields: known,
    missingTruthFields: missing,
    readiness,
    blockingReasons,
    suggestedNextHumanAction,
  };
}

// ── main planner API（pure；used by guard + CLI）─────────────────────────────

export async function planMissingSidecars({ repoRoot, contentRoot } = {}) {
  const root = repoRoot || PROJECT_ROOT;
  const scanRoot = contentRoot || path.join(root, 'content', 'blogger', 'posts');

  const files = await fg('**/*.md', {
    cwd: scanRoot,
    absolute: true,
  });
  const postFiles = files.filter((f) => !f.endsWith('.fb.md')).sort();

  const candidates = [];
  const invalidSources = [];
  const seenSlugs = new Map();
  let scanned = 0;

  for (const file of postFiles) {
    scanned += 1;
    let raw;
    let parsed;
    try {
      raw = await fs.readFile(file, 'utf-8');
    } catch (err) {
      invalidSources.push({
        sourcePath: toRelFromRoot(file, root),
        readiness: 'INVALID_SOURCE',
        blockingReasons: [`markdown read error: ${err.message}`],
      });
      continue;
    }
    try {
      parsed = matter(raw);
    } catch (err) {
      invalidSources.push({
        sourcePath: toRelFromRoot(file, root),
        readiness: 'INVALID_SOURCE',
        blockingReasons: [`frontmatter parse error: ${err.message}`],
      });
      continue;
    }
    const fm = parsed.data || {};
    if (!isCandidate(fm)) continue;

    const sidecar = await readSidecarIfExists(file);
    const entry = classifyCandidate({
      mdFile: file,
      contentRoot: { repoRoot: root },
      fm,
      sidecar,
    });

    // duplicate-slug detection：exit 1 via invariant when finalized.
    const prior = seenSlugs.get(entry.slug);
    if (prior != null) {
      invalidSources.push({
        sourcePath: entry.sourcePath,
        readiness: 'INVALID_SOURCE',
        blockingReasons: [`duplicate candidate slug "${entry.slug}" also at ${prior}`],
      });
      // Skip pushing duplicate candidate to keep deterministic listing.
      continue;
    }
    seenSlugs.set(entry.slug, entry.sourcePath);
    candidates.push(entry);
  }

  candidates.sort((a, b) =>
    a.sourcePath < b.sourcePath ? -1 : a.sourcePath > b.sourcePath ? 1 : 0,
  );
  invalidSources.sort((a, b) =>
    a.sourcePath < b.sourcePath ? -1 : a.sourcePath > b.sourcePath ? 1 : 0,
  );

  const summary = {
    sidecarStatus: Object.fromEntries(SIDECAR_STATUSES.map((k) => [k, 0])),
    readiness: Object.fromEntries(READINESS_STATES.map((k) => [k, 0])),
    mutationPerformed: false,
  };
  for (const c of candidates) {
    summary.sidecarStatus[c.sidecarStatus] += 1;
    summary.readiness[c.readiness] += 1;
  }
  for (const c of invalidSources) {
    summary.readiness.INVALID_SOURCE += 1;
  }

  return {
    schemaVersion: 1,
    mode: 'report-only',
    scanned,
    candidateCount: candidates.length,
    summary,
    candidates,
    invalidSources,
  };
}

// ── formatting ──────────────────────────────────────────────────────────────

function padRight(s, n) {
  return String(s).padEnd(n, ' ');
}

export function formatHumanReadable(plan) {
  const lines = [];
  lines.push('plan-blogger-backfill-sidecars (report-only; no mutation performed)');
  lines.push('');
  lines.push(`scanned markdown files:              ${plan.scanned}`);
  lines.push(`candidate count:                     ${plan.candidateCount}`);
  lines.push(`  sidecar MISSING_SIDECAR:           ${plan.summary.sidecarStatus.MISSING_SIDECAR}`);
  lines.push(`  sidecar PRESENT_INCOMPLETE:        ${plan.summary.sidecarStatus.PRESENT_INCOMPLETE}`);
  lines.push(`  sidecar PRESENT_COMPLETE:          ${plan.summary.sidecarStatus.PRESENT_COMPLETE}`);
  lines.push(`  sidecar INVALID_SIDECAR:           ${plan.summary.sidecarStatus.INVALID_SIDECAR}`);
  lines.push(`  readiness BLOCKED:                 ${plan.summary.readiness.BLOCKED}`);
  lines.push(`  readiness READY_FOR_FUTURE_BOOTSTRAP: ${plan.summary.readiness.READY_FOR_FUTURE_BOOTSTRAP}`);
  lines.push(`  readiness NO_ACTION_REQUIRED:      ${plan.summary.readiness.NO_ACTION_REQUIRED}`);
  lines.push(`  readiness INVALID_SOURCE:          ${plan.summary.readiness.INVALID_SOURCE}`);
  lines.push('Mutation performed:                  NO');
  lines.push('');

  if (plan.candidates.length === 0) {
    lines.push('(no Blogger backfill candidates matched)');
  } else {
    lines.push('---- candidates ----');
    let n = 0;
    for (const c of plan.candidates) {
      n += 1;
      lines.push(`  ${n}. ${c.sourcePath}`);
      lines.push(`     slug:              ${c.slug}`);
      lines.push(`     expected sidecar:  ${c.expectedSidecarPath}`);
      lines.push(`     sidecar status:    ${c.sidecarStatus}`);
      lines.push('     required truth fields:');
      for (const spec of c.requiredTruthFields) {
        const state = spec.present ? 'PRESENT' : 'MISSING';
        lines.push(`       - ${padRight(spec.field, 26)} [${spec.role}] ${state}`);
      }
      if (c.missingTruthFields.length > 0) {
        lines.push(`     missing fields:    ${c.missingTruthFields.join(', ')}`);
      } else {
        lines.push('     missing fields:    (none)');
      }
      lines.push(`     readiness:         ${c.readiness}`);
      if (c.blockingReasons.length > 0) {
        lines.push('     blocking reasons:');
        for (const r of c.blockingReasons) {
          lines.push(`       - ${r}`);
        }
      }
      lines.push(`     next human action: ${c.suggestedNextHumanAction}`);
      lines.push('');
    }
  }

  if (plan.invalidSources.length > 0) {
    lines.push('---- invalid sources ----');
    for (const s of plan.invalidSources) {
      lines.push(`  - ${s.sourcePath}  [${s.readiness}]`);
      for (const r of s.blockingReasons) {
        lines.push(`      - ${r}`);
      }
    }
    lines.push('');
  }

  lines.push('This command never creates or modifies .publish.json files.');
  lines.push('Missing publication truth remains blocked until supplied and explicitly authorized.');

  return lines.join('\n') + '\n';
}

// stable JSON：整份物件 key 已由來源固定；stringify 之 replacer 保留現有順序。
export function formatJson(plan) {
  return JSON.stringify(plan, null, 2) + '\n';
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
      `[plan-blogger-backfill-sidecars] ERROR: forbidden write flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This planner is report-only and never creates or modifies .publish.json.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[plan-blogger-backfill-sidecars] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  let scanRoot = null;
  if (opts.contentRoot != null) {
    if (!path.isAbsolute(opts.contentRoot)) {
      process.stderr.write(
        `[plan-blogger-backfill-sidecars] ERROR: --content-root must be an absolute path (got: ${opts.contentRoot})\n`,
      );
      return 1;
    }
    scanRoot = opts.contentRoot;
  }

  const plan = await planMissingSidecars({
    repoRoot: PROJECT_ROOT,
    contentRoot: scanRoot,
  });

  // Duplicate candidate → invariant failure (Exit 1).
  const hasDuplicate = plan.invalidSources.some((s) =>
    s.blockingReasons.some((r) => /^duplicate candidate slug/.test(r)),
  );

  if (opts.json) {
    process.stdout.write(formatJson(plan));
  } else {
    process.stdout.write(formatHumanReadable(plan));
  }

  return hasDuplicate ? 1 : 0;
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
        `[plan-blogger-backfill-sidecars] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}
