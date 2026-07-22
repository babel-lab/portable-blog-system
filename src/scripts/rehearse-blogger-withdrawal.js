#!/usr/bin/env node
// Phase 20260722-publish-target-stage Slice 4E：Blogger withdrawal — OS-temp rehearsal capability.
//
// 上位契約：
//   - docs/20260722-blogger-withdrawal-rehearsal.md（本 Slice 契約）
//   - docs/20260722-blogger-withdrawal-authorization-preparation.md（Slice 4D：authorization / preflight）
//   - docs/20260721-blogger-withdrawal-planner.md（Slice 4C：read-only planner）
//   - docs/20260720-publish-target-stage-contract.md（stage 三者正交；missing→production；invalid fail-closed）
//   - docs/publish-json-schema.md §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
//
// 目的：
//   在既有 authorization contract、planner、preflight 皆 apply-ready 的前提下，把「未來 production
//   apply 將對 sidecar 執行的 deterministic mutate-in-place」搬到 os.tmpdir() 之下的隔離副本演練
//   一次；驗證 write primitive、new sidecar semantics、read-back exact bytes；結束後 unconditional
//   cleanup。**永不**寫入 source repository、**永不**呼叫 Blogger／Google API、**永不** apply
//   production、**永不** commit、**永不** push、**永不**建立 authorization、**永不**驗證遠端真值。
//
// Pipeline position（見 docs/20260722-blogger-withdrawal-authorization-preparation.md §0）：
//   plan:blogger-withdrawals                     (Slice 4C；read-only planner)
//     → remote disposition verification          (人工；本工具不做)
//     → prepare:blogger-withdrawal-authorization (Slice 4D；read-only、stdout-only draft generator)
//     → operator review + 手動 flip explicitlyAuthorized
//     → validate:blogger-withdrawal-authorization(Slice 4D；read-only preflight)
//     → **this slice** rehearse:blogger-withdrawal-withdrawal (OS-temp mutate-in-place rehearsal)
//     → (future) production apply / commit / push  (皆尚未存在；各須獨立授權)
//
// 語意重用（單一事實來源；本檔**不**複製任何一份）：
//   - preflight（documentValid + repo-state + fingerprints + explicitlyAuthorized）：
//       validate-blogger-withdrawal-authorization.js  preflightWithdrawalAuthorization
//   - authorization strict loader（含 duplicate-key detection）：
//       blogger-withdrawal-authorization.js  parseAndValidateAuthorization / classifyBloggerSourcePath
//   - withdrawal sidecar schema（allowed keys / lifecycle event required fields / enum / v2 status）：
//       sidecar-withdrawal-contract.js  collectSidecarWithdrawalIssues + exported constants
//
// Redaction（§16）：
//   所有 human／JSON／blocker slug 皆為固定安全短碼；**絕不**回顯：raw publishedUrl / Blogger host /
//   Blogger post id / publishedAt / operator identity / authorization file path / authorization
//   file content / OS temp absolute path / repository absolute path / gitdir path / stack trace /
//   raw fs error / environment variables / tokens。scratch 為 OS-temp 之 mkdtemp 子目錄，report
//   只回 boolean / repo-relative POSIX path / SHA-256 hex / enum / 安全短碼。
//
// 硬邊界（zero production write；違反即設計錯誤）：
//   - 無 fs.writeFile / mkdir / rm / rename / unlink / copyFile / appendFile / link 觸及 source
//     repository、deploy repository、tmpdir root 之外任一路徑；所有 scratch write／rename／rm
//     只發生於 mkdtempSync(os.tmpdir()) 子目錄下之 realpath descendant。
//   - 無 child_process / spawn / exec；無 fetch / http(s)；無 Blogger / Google / GA4 / AdSense API。
//   - CLI **不**接受任何 caller-provided scratch / test / repo / output root；scratch root 由
//     CLI 自行建立；programmatic API 於 focused guard 用途下允許注入 projectRoot（供 synthetic
//     git repo 驅動），但**不**開放於 CLI。
//   - explicitlyAuthorized 由 preflight 決定；本檔**無任何** in-band code path 會將其設 true。
//   - 對 production source / sidecar 只做讀取（`readFileSync`）；無任何 write / rename / rm。

import { createHash } from 'node:crypto';
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync,
  renameSync, rmSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { preflightWithdrawalAuthorization } from './validate-blogger-withdrawal-authorization.js';
import {
  classifyBloggerSourcePath,
  parseAndValidateAuthorization,
} from './blogger-withdrawal-authorization.js';
import {
  LIFECYCLE_WITHDRAWN_EVENT,
  WITHDRAWN_STATUS,
  collectSidecarWithdrawalIssues,
} from './sidecar-withdrawal-contract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export const REHEARSAL_MODE = 'rehearse-blogger-withdrawal';
export const SCRATCH_PREFIX = 'portable-blog-withdrawal-rehearsal-';
export const SCRATCH_MARKER_FILENAME = '.blogger-withdrawal-rehearsal-marker.json';
export const SCRATCH_MARKER_PURPOSE = 'blogger-withdrawal-rehearsal';
export const SCRATCH_MARKER_SCHEMA_VERSION = 1;
export const OUTPUT_SCHEMA_VERSION = 2;

// forbidden flags：任一出現即 exit 2；含所有 apply / write / output / repo-root / scratch-root /
// approve / bypass / production / publish / deploy / commit / push / restore / republish / api。
const FORBIDDEN_FLAGS = new Set([
  '--apply', '--write', '--output', '--repo-root', '--project-root',
  '--test-root', '--scratch-root', '--temp-root', '--approve', '--yes', '-y',
  '--force', '--skip-validation', '--skip-fingerprint', '--ignore-head',
  '--dirty-ok', '--no-verify', '--production', '--publish', '--deploy',
  '--commit', '--push', '--restore', '--republish', '--api',
]);

const USAGE = `Usage: rehearse-blogger-withdrawal \\
  --source-path <content/blogger/posts/<slug>.md> \\
  --authorization <path-outside-repo> \\
  [--json] [--help]

Read-only, OS-temp-isolated rehearsal of a future Blogger withdrawal apply.

For an operator-authored withdrawal authorization that already passes the
Slice 4D preflight (documentValid + repository / plan / record bindings
matched + explicitlyAuthorized), this command copies the target Blogger
Markdown and its \`.publish.json\` sidecar into a private mkdtemp scratch
directory under os.tmpdir(), rehearses the exact deterministic mutate-in-place
that future production apply would perform on the sidecar, verifies the
resulting bytes read back byte-identical and pass the landed withdrawal
sidecar schema, and then unconditionally removes the entire scratch tree.

This command NEVER:
  - writes, renames, or deletes any file in the source repository
  - touches the deploy repository
  - modifies any Markdown or metadata
  - creates or approves an authorization
  - claims the remote Blogger post is deleted / drafted / still public
  - performs a production apply, commit, or push
  - calls Blogger / Google / any HTTP API (zero network)

Required:
  --source-path <path>     Repo-relative POSIX-style Blogger post Markdown under
                           content/blogger/posts/ (must match the authorization
                           target sourcePath and a current withdrawal candidate).
  --authorization <path>   Path (typically OUTSIDE the repo) to the authorization JSON.

Options:
  --json                   Emit a deterministic JSON report to stdout instead of text.
  --help / -h              Print this usage.

Forbidden flags (any occurrence → exit 2):
  --apply, --write, --output, --repo-root, --project-root, --test-root,
  --scratch-root, --temp-root, --approve, --yes, -y, --force,
  --skip-validation, --skip-fingerprint, --ignore-head, --dirty-ok,
  --no-verify, --production, --publish, --deploy, --commit, --push,
  --restore, --republish, --api

Exit codes:
  0   rehearsal completed (scratchMutationPerformed:true, cleanupPerformed:true)
  1   rehearsal refused / failed (blockers reported)
  2   CLI misuse (unknown / forbidden flag / missing required flag)
`;

// ── argv parsing ─────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
    authorization: null,
    sourcePath: null,
    forbidden: [],
    unknown: [],
  };
  const take = (a, i) => (a.includes('=') ? a.slice(a.indexOf('=') + 1) : args[i + 1]);
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    const bare = a.includes('=') ? a.slice(0, a.indexOf('=')) : a;
    if (a === '--help' || a === '-h') { opts.help = true; continue; }
    if (a === '--json') { opts.json = true; continue; }
    if (bare === '--authorization') { opts.authorization = take(a, i); if (!a.includes('=')) i += 1; continue; }
    if (bare === '--source-path') { opts.sourcePath = take(a, i); if (!a.includes('=')) i += 1; continue; }
    if (FORBIDDEN_FLAGS.has(bare)) { opts.forbidden.push(bare); continue; }
    opts.unknown.push(a);
  }
  return opts;
}

// ── deterministic helpers ────────────────────────────────────────────────────
function sha256HexOfBuffer(buf) {
  return createHash('sha256').update(buf).digest('hex');
}
function sha256HexOfString(text) {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}
function isSha256HexLower(v) {
  return typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
}
function isGitSha40Lower(v) {
  return typeof v === 'string' && /^[0-9a-f]{40}$/.test(v);
}
// segment-safe strict-descendant test（realpath 已解析）：child === parent → false（不算 strict）；
// child 位於 parent 之下 → true；其它 → false。避免 `.../tmp-evil/` 誤判為 `.../tmp/` 內。
function isStrictDescendant(parent, child) {
  const rel = path.relative(parent, child);
  if (rel === '') return false;
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || rel.startsWith('../')) return false;
  return !path.isAbsolute(rel);
}

// canonical POSIX-relative sidecar path derivation（`<stem>.md` → `<stem>.publish.json`）。
function deriveSidecarPathFromSource(sourcePath) {
  if (typeof sourcePath !== 'string' || !sourcePath.endsWith('.md')) return null;
  return sourcePath.slice(0, -'.md'.length) + '.publish.json';
}

// ── deterministic sidecar builder（withdrawn v2）─────────────────────────────
// 依既有 withdrawal contract（sidecar-withdrawal-contract.js §7.1）建構：
//   - schemaVersion 統一 2。
//   - blogger.status: "published" → "withdrawn"。
//   - blogger.lifecycle: append 一個 withdrawn event（allowed keys 嚴格遵守）。
//   - blogger.publishedUrl / publishedAt / bloggerPostId / publishYear / publishMonth：**保留**
//     （contract §7.1 明列 withdrawn sidecar 之 evidence 必要條件；publishedUrl 缺 → withdrawnMissingEvidence
//     error）。這些欄位在 status="withdrawn" 下**不再**構成 active publication（active-publication.js
//     依 status gate；consumer 端已於 Slice 4A 硬編為 active-only），因此保留只是 historical evidence，
//     不會被 build / preview / admin / render 顯示為 live URL。
//   - blogger 其餘欄位（type / permalink / history / …）、其他 platform block（github / …）、
//     canonical / ogImage / seo 等 top-level 全部保留。
//   - lifecycle append-only（prior 陣列元素不改動）。
//
// Deterministic：所有 input（priorSidecar / authorization / sourcePath / hashes / gitHead /
//   authorizationFingerprint）皆 immutable；輸出僅由 input 決定；不使用 current time / mtime /
//   OS clock / env / random。field ordering：固定 top-level order → schemaVersion → blogger →
//   其餘 top-level（依 prior 順序）；blogger 內 → prior 非 status / lifecycle 之 keys（依 prior 順序）
//   → status → lifecycle。
export function buildWithdrawnSidecar({
  priorSidecar,
  authorization,
  sourcePath,
  sourceSha256,
  sidecarSha256,
  gitHead,
  authorizationFingerprint,
}) {
  const priorBlogger = (priorSidecar && typeof priorSidecar.blogger === 'object' && priorSidecar.blogger !== null && !Array.isArray(priorSidecar.blogger))
    ? priorSidecar.blogger
    : {};
  const priorLifecycle = Array.isArray(priorBlogger.lifecycle) ? priorBlogger.lifecycle : null;

  // lifecycle event —— 嚴格遵守 withdrawal contract 之 allowed keys（含 optional reasonDetail）。
  // Contract 已禁止 DUPLICATE_EVIDENCE_FIELDS（publishedUrl / publishedAt / bloggerPostId 等）出現於
  // event，因此 event 之 payload 只綁 fingerprint 與 sourcePath，raw evidence 保留於 blogger 區塊。
  const event = {
    event: LIFECYCLE_WITHDRAWN_EVENT,
    fromStatus: 'published',
    toStatus: WITHDRAWN_STATUS,
    // rehearsal 是未來 apply 的 deterministic simulation，不使用 wall clock。以 remoteVerifiedAt
    // 同時作為 recordedAt，滿足 contract 之 remoteVerifiedAt.epoch <= recordedAt.epoch。
    recordedAt: authorization.withdrawal.remoteVerifiedAt,
    remoteVerifiedAt: authorization.withdrawal.remoteVerifiedAt,
    reason: authorization.withdrawal.reason,
    remoteDisposition: authorization.withdrawal.remoteDisposition,
    sourcePath,
    sourceSha256,
    priorSidecarSha256: sidecarSha256,
    gitHead,
    authorizationFingerprint,
  };
  // reasonDetail 為 contract-allowed optional key；只在非空字串時輸出（reduces surface）。
  if (typeof authorization.withdrawal.reasonDetail === 'string' && authorization.withdrawal.reasonDetail !== '') {
    event.reasonDetail = authorization.withdrawal.reasonDetail;
  }

  // 保留 prior blogger 之所有欄位（含 publishedUrl / publishedAt / bloggerPostId 等 evidence）；
  // 只 drop status / lifecycle（下方重新寫入）。
  const preservedBlogger = {};
  for (const key of Object.keys(priorBlogger)) {
    if (key === 'status' || key === 'lifecycle') continue;
    preservedBlogger[key] = priorBlogger[key];
  }

  // blogger 內固定順序：preserved keys → status → lifecycle。
  const newBlogger = {
    ...preservedBlogger,
    status: WITHDRAWN_STATUS,
    lifecycle: priorLifecycle ? [...priorLifecycle, event] : [event],
  };

  // top-level：schemaVersion → blogger → 其餘 top-level（依 prior 順序保留）。
  const newSidecar = {};
  newSidecar.schemaVersion = OUTPUT_SCHEMA_VERSION;
  newSidecar.blogger = newBlogger;
  for (const key of Object.keys(priorSidecar || {})) {
    if (key === 'schemaVersion' || key === 'blogger') continue;
    newSidecar[key] = priorSidecar[key];
  }
  return newSidecar;
}

// Serializer：repository 慣用 2-space indent + trailing newline。相同 immutable input →
//   byte-identical output（JSON.stringify object key order 由 caller 控制，本檔 buildWithdrawnSidecar
//   已固定）。
export function serializeSidecar(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}

// ── canonical scratch containment guard ──────────────────────────────────────
// 驗證 canonicalScratch 為合法 rehearsal scratch root：
//   - 位於 os.tmpdir() 的 realpath 之 strict descendant
//   - 不等於 os.tmpdir() 本身
//   - 與 canonicalProjectRoot 不重疊（不是 project root 本身、不是其 parent、不是其 descendant）
// 回 null（合法）或安全短碼。**不**回顯 absolute path。
export function classifyScratchContainment({ canonicalScratch, canonicalTmpBase, canonicalProjectRoot }) {
  if (typeof canonicalScratch !== 'string' || canonicalScratch === '') return 'scratch-unresolvable';
  if (typeof canonicalTmpBase !== 'string' || canonicalTmpBase === '') return 'os-tmp-unresolvable';
  if (canonicalScratch === canonicalTmpBase) return 'scratch-is-os-tmp-root';
  if (!isStrictDescendant(canonicalTmpBase, canonicalScratch)) return 'scratch-outside-os-tmp';
  if (canonicalProjectRoot) {
    if (canonicalScratch === canonicalProjectRoot) return 'scratch-is-project-root';
    if (isStrictDescendant(canonicalProjectRoot, canonicalScratch)) return 'scratch-inside-project-root';
    if (isStrictDescendant(canonicalScratch, canonicalProjectRoot)) return 'scratch-ancestor-of-project-root';
  }
  return null;
}

// ── rehearsal report shape ────────────────────────────────────────────────────
function baseReport(sourcePath) {
  return {
    ok: false,
    mode: REHEARSAL_MODE,
    sourcePath: typeof sourcePath === 'string' ? sourcePath : null,
    sidecarPath: null,
    branch: null,
    sourceHead: null,
    planFingerprint: null,
    recordFingerprint: null,
    documentValid: false,
    repositoryBindingsMatched: false,
    planBindingsMatched: false,
    recordBindingsMatched: false,
    explicitlyAuthorized: false,
    preflightEligible: false,
    authorizationValidated: false,
    sourceHashMatched: false,
    sidecarHashMatched: false,
    outputSha256: null,
    semanticValidationOk: false,
    scratchMutationPerformed: false,
    readBackOk: false,
    rehearsalPerformed: false,
    productionMutationPerformed: false,
    applyReady: false,
    cleanupPerformed: false,
    blockers: [],
  };
}

// ── main rehearsal API（pure orchestration + isolated OS-temp mutation）───────
// `projectRoot` 在程式 API 暴露（供 focused guard 以 synthetic git repo 驅動）；CLI 硬編碼 PROJECT_ROOT、
//   不暴露此參數。`scratchRootFactory` / `tmpBase` 供 guard 注入 canonical containment 測試（如
//   simulate scratch under project-root）；CLI 不暴露。
export async function rehearseBloggerWithdrawal({
  projectRoot = PROJECT_ROOT,
  authorizationPath,
  sourcePath,
  scratchRootFactory,
  tmpBase,
} = {}) {
  const report = baseReport(sourcePath);
  const push = (b) => { if (!report.blockers.includes(b)) report.blockers.push(b); };

  // ── source-path shape ───────────────────────────────────────────────
  if (classifyBloggerSourcePath(sourcePath) !== null) {
    push('source-path-invalid');
    return report;
  }
  const derivedSidecarPath = deriveSidecarPathFromSource(sourcePath);
  report.sidecarPath = derivedSidecarPath;

  // ── run existing Slice 4D preflight（re-uses authorization loader / repo-state /
  // plan / record bindings / explicit-authorization gate；no writes）──
  let pf;
  try {
    pf = await preflightWithdrawalAuthorization({ projectRoot, authorizationPath, sourcePath });
  } catch {
    push('preflight-error');
    return report;
  }
  report.branch = pf.branch;
  report.sourceHead = pf.sourceHead;
  report.planFingerprint = pf.planFingerprint;
  report.recordFingerprint = pf.recordFingerprint;
  report.documentValid = pf.documentValid;
  report.repositoryBindingsMatched = pf.repositoryBindingsMatched;
  report.planBindingsMatched = pf.planBindingsMatched;
  report.recordBindingsMatched = pf.recordBindingsMatched;
  report.explicitlyAuthorized = pf.explicitlyAuthorized;
  report.applyReady = pf.applyReady;
  for (const b of pf.blockers) push(b);
  report.preflightEligible = pf.applyReady === true;
  if (!pf.applyReady) return report;
  report.authorizationValidated = true;

  // ── re-load authorization for authorization fingerprint（bytes hash；deterministic）──
  let rawAuthorization;
  try {
    rawAuthorization = readFileSync(authorizationPath, 'utf-8');
  } catch {
    push('authorization-unreadable');
    return report;
  }
  const parsed = parseAndValidateAuthorization(rawAuthorization);
  if (!parsed.ok || parsed.explicitlyAuthorized !== true) {
    // preflight 已 pass；此處若不一致代表 TOCTOU drift。
    push('authorization-drift');
    return report;
  }
  const authorization = parsed.authorization;
  const authorizationFingerprint = sha256HexOfString(rawAuthorization);

  // ── re-read source + sidecar（TOCTOU: SHA-256 必再次符合 authorization 綁定值）──
  const absSource = path.join(projectRoot, ...sourcePath.split('/'));
  const absSidecar = path.join(projectRoot, ...derivedSidecarPath.split('/'));

  let srcStat;
  try {
    srcStat = lstatSync(absSource);
  } catch {
    push('source-unreadable');
    return report;
  }
  if (srcStat.isSymbolicLink() || !srcStat.isFile()) {
    push('source-not-regular-file');
    return report;
  }
  let sidecarStat;
  try {
    sidecarStat = lstatSync(absSidecar);
  } catch {
    push('sidecar-unreadable');
    return report;
  }
  if (sidecarStat.isSymbolicLink() || !sidecarStat.isFile()) {
    push('sidecar-not-regular-file');
    return report;
  }

  let sourceBuf; let sidecarBuf;
  try { sourceBuf = readFileSync(absSource); } catch { push('source-unreadable'); return report; }
  try { sidecarBuf = readFileSync(absSidecar); } catch { push('sidecar-unreadable'); return report; }

  const sourceSha256 = sha256HexOfBuffer(sourceBuf);
  const sidecarSha256 = sha256HexOfBuffer(sidecarBuf);
  if (sourceSha256 !== authorization.target.expectedSourceSha256) {
    push('source-hash-toctou-drift');
    return report;
  }
  report.sourceHashMatched = true;
  if (sidecarSha256 !== authorization.target.expectedSidecarSha256) {
    push('sidecar-hash-toctou-drift');
    return report;
  }
  report.sidecarHashMatched = true;

  // Prior sidecar parsed as immutable snapshot for rehearsal payload derivation.
  let priorSidecar;
  try {
    priorSidecar = JSON.parse(sidecarBuf.toString('utf-8'));
  } catch {
    push('sidecar-parse-error');
    return report;
  }

  // ── build rehearsal payload（immutable；bytes reused verbatim in scratch write）──
  if (!isGitSha40Lower(report.sourceHead)) {
    // preflight should always resolve HEAD; guard against silent drift.
    push('git-head-invalid');
    return report;
  }
  const newSidecar = buildWithdrawnSidecar({
    priorSidecar,
    authorization,
    sourcePath,
    sourceSha256,
    sidecarSha256,
    gitHead: report.sourceHead,
    authorizationFingerprint,
  });
  const newBytes = serializeSidecar(newSidecar);
  const outputSha256 = sha256HexOfString(newBytes);
  report.outputSha256 = outputSha256;

  // ── semantic validation of the rehearsal payload（landed withdrawal contract）──
  const issues = collectSidecarWithdrawalIssues(newSidecar, {
    sourcePath,
    sidecarPath: derivedSidecarPath,
  });
  if (issues.length > 0) {
    const types = [...new Set(issues.map((i) => i.type))].sort();
    for (const t of types) push(`rehearsal-semantic-invalid:${t}`);
    return report;
  }
  report.semanticValidationOk = true;

  // ── OS-temp scratch containment + isolated mutation + cleanup（unconditional）─
  const canonicalProjectRoot = safeRealpath(projectRoot);
  const tmpBaseResolved = typeof tmpBase === 'string' ? tmpBase : os.tmpdir();
  const canonicalTmpBase = safeRealpath(tmpBaseResolved);
  if (canonicalTmpBase == null) { push('os-tmp-unresolvable'); return report; }

  let scratchRoot = null;
  let canonicalScratch = null;
  try {
    // scratch factory 只供 guard 注入 containment 測試（例如強制 scratch 落於 project root）；
    // 若未注入，CLI 走 mkdtempSync(join(tmpBase, PREFIX))。
    if (typeof scratchRootFactory === 'function') {
      scratchRoot = scratchRootFactory({ canonicalTmpBase, canonicalProjectRoot });
    } else {
      scratchRoot = mkdtempSync(path.join(canonicalTmpBase, SCRATCH_PREFIX));
    }
    if (typeof scratchRoot !== 'string' || scratchRoot === '') {
      push('scratch-unresolvable');
      return report;
    }
    canonicalScratch = safeRealpath(scratchRoot);
    if (canonicalScratch == null) { push('scratch-unresolvable'); return report; }

    const containmentReason = classifyScratchContainment({
      canonicalScratch,
      canonicalTmpBase,
      canonicalProjectRoot,
    });
    if (containmentReason != null) { push(containmentReason); return report; }

    // marker 由本次 invocation 建立；`wx` 拒絕已存在的 marker（外部預置不視為信任證據）。
    const markerAbs = path.join(canonicalScratch, SCRATCH_MARKER_FILENAME);
    const markerBytes = JSON.stringify(
      { schemaVersion: SCRATCH_MARKER_SCHEMA_VERSION, purpose: SCRATCH_MARKER_PURPOSE },
      null, 2,
    ) + '\n';
    try {
      writeFileSync(markerAbs, markerBytes, { encoding: 'utf-8', flag: 'wx' });
    } catch {
      push('scratch-marker-write-failed');
      return report;
    }

    // copy source + sidecar into scratch, mirroring repo-relative POSIX layout。
    const scratchSource = path.join(canonicalScratch, ...sourcePath.split('/'));
    const scratchSidecar = path.join(canonicalScratch, ...derivedSidecarPath.split('/'));
    try {
      mkdirSync(path.dirname(scratchSource), { recursive: true });
      mkdirSync(path.dirname(scratchSidecar), { recursive: true });
      writeFileSync(scratchSource, sourceBuf, { flag: 'wx' });
      writeFileSync(scratchSidecar, sidecarBuf, { flag: 'wx' });
    } catch {
      push('scratch-copy-failed');
      return report;
    }

    // ── atomic scratch mutate-in-place primitive ──
    // 1) same-directory rehearsal temp file，`wx` 防覆蓋。
    const tempName = `.${path.basename(scratchSidecar)}.rehearsal-${process.pid}-tmp`;
    const tempAbs = path.join(path.dirname(scratchSidecar), tempName);
    try {
      writeFileSync(tempAbs, newBytes, { flag: 'wx' });
    } catch {
      push('scratch-tempfile-write-failed');
      return report;
    }
    // 2) pre-rename: verify scratch target still regular file, not symlink（防被換掉）。
    let preTargetLst;
    try {
      preTargetLst = lstatSync(scratchSidecar);
    } catch {
      try { rmSync(tempAbs, { force: true }); } catch { /* ignore */ }
      push('scratch-sidecar-vanished-pre-rename');
      return report;
    }
    if (preTargetLst.isSymbolicLink() || !preTargetLst.isFile()) {
      try { rmSync(tempAbs, { force: true }); } catch { /* ignore */ }
      push('scratch-sidecar-not-regular-pre-rename');
      return report;
    }
    // 3) same-directory rename replace。
    try {
      renameSync(tempAbs, scratchSidecar);
    } catch {
      try { rmSync(tempAbs, { force: true }); } catch { /* ignore */ }
      push('scratch-rename-failed');
      return report;
    }
    report.scratchMutationPerformed = true;

    // 4) read-back：bytes must be exact；SHA-256 must equal outputSha256；再走一次 semantic validation。
    let readBack;
    try {
      readBack = readFileSync(scratchSidecar, 'utf-8');
    } catch {
      push('scratch-readback-failed');
      return report;
    }
    if (readBack !== newBytes) { push('rehearsal-readback-mismatch'); return report; }
    if (sha256HexOfString(readBack) !== outputSha256) { push('rehearsal-readback-hash-mismatch'); return report; }
    let readBackObj;
    try {
      readBackObj = JSON.parse(readBack);
    } catch {
      push('rehearsal-readback-parse-error');
      return report;
    }
    if (
      readBackObj == null || typeof readBackObj !== 'object'
      || readBackObj.schemaVersion !== OUTPUT_SCHEMA_VERSION
      || readBackObj.blogger == null || readBackObj.blogger.status !== WITHDRAWN_STATUS
    ) {
      push('rehearsal-readback-semantic-mismatch');
      return report;
    }
    const readBackIssues = collectSidecarWithdrawalIssues(readBackObj, {
      sourcePath,
      sidecarPath: derivedSidecarPath,
    });
    if (readBackIssues.length > 0) {
      const types = [...new Set(readBackIssues.map((i) => i.type))].sort();
      for (const t of types) push(`rehearsal-readback-invalid:${t}`);
      return report;
    }
    report.readBackOk = true;
    report.rehearsalPerformed = true;
    report.ok = true;
    return report;
  } finally {
    // unconditional cleanup：清除 scratch tree（含 marker、copy、tmp 殘留）。cleanup 失敗
    //   不改變 report.ok（rehearsal 是否成功已由上方分支決定），但 cleanupPerformed 反映實際結果。
    if (scratchRoot) {
      try {
        rmSync(scratchRoot, { recursive: true, force: true, maxRetries: 3 });
        report.cleanupPerformed = !existsSync(scratchRoot);
      } catch {
        report.cleanupPerformed = false;
      }
    } else {
      report.cleanupPerformed = true; // 尚未建立 scratch，等同已清除。
    }
  }
}

function safeRealpath(p) {
  if (typeof p !== 'string' || p === '') return null;
  try { return realpathSync(p); } catch { return null; }
}

// ── output formatting（deterministic；固定 key order；redacted）───────────────
export function formatJson(result) {
  const body = {
    ok: result.ok,
    mode: result.mode,
    sourcePath: result.sourcePath,
    sidecarPath: result.sidecarPath,
    branch: result.branch,
    sourceHead: result.sourceHead,
    planFingerprint: result.planFingerprint,
    recordFingerprint: result.recordFingerprint,
    documentValid: result.documentValid,
    repositoryBindingsMatched: result.repositoryBindingsMatched,
    planBindingsMatched: result.planBindingsMatched,
    recordBindingsMatched: result.recordBindingsMatched,
    explicitlyAuthorized: result.explicitlyAuthorized,
    preflightEligible: result.preflightEligible,
    authorizationValidated: result.authorizationValidated,
    sourceHashMatched: result.sourceHashMatched,
    sidecarHashMatched: result.sidecarHashMatched,
    outputSha256: result.outputSha256,
    semanticValidationOk: result.semanticValidationOk,
    scratchMutationPerformed: result.scratchMutationPerformed,
    readBackOk: result.readBackOk,
    rehearsalPerformed: result.rehearsalPerformed,
    productionMutationPerformed: result.productionMutationPerformed,
    applyReady: result.applyReady,
    cleanupPerformed: result.cleanupPerformed,
    blockers: result.blockers,
  };
  return JSON.stringify(body, null, 2) + '\n';
}

export function formatHumanReadable(result) {
  const lines = [];
  lines.push('rehearse-blogger-withdrawal (OS-temp; no production mutation)');
  lines.push('');
  lines.push(`mode:                            ${result.mode}`);
  lines.push(`source path:                     ${result.sourcePath ?? '(unknown)'}`);
  lines.push(`sidecar path:                    ${result.sidecarPath ?? '(unknown)'}`);
  lines.push(`branch:                          ${result.branch ?? '(unknown)'}`);
  lines.push(`source HEAD:                     ${result.sourceHead ?? '(unknown)'}`);
  lines.push(`plan fingerprint:                ${result.planFingerprint ?? '(not computed)'}`);
  lines.push(`record fingerprint:              ${result.recordFingerprint ?? '(not computed)'}`);
  lines.push(`document valid:                  ${result.documentValid ? 'YES' : 'NO'}`);
  lines.push(`repository bindings matched:     ${result.repositoryBindingsMatched ? 'YES' : 'NO'}`);
  lines.push(`plan bindings matched:           ${result.planBindingsMatched ? 'YES' : 'NO'}`);
  lines.push(`record bindings matched:         ${result.recordBindingsMatched ? 'YES' : 'NO'}`);
  lines.push(`explicitly authorized:           ${result.explicitlyAuthorized ? 'YES' : 'NO'}`);
  lines.push(`preflight eligible:              ${result.preflightEligible ? 'YES' : 'NO'}`);
  lines.push(`authorization validated:         ${result.authorizationValidated ? 'YES' : 'NO'}`);
  lines.push(`source hash matched:             ${result.sourceHashMatched ? 'YES' : 'NO'}`);
  lines.push(`sidecar hash matched:            ${result.sidecarHashMatched ? 'YES' : 'NO'}`);
  lines.push(`output sha256:                   ${result.outputSha256 ?? '(not computed)'}`);
  lines.push(`semantic validation ok:          ${result.semanticValidationOk ? 'YES' : 'NO'}`);
  lines.push(`scratch mutation performed:      ${result.scratchMutationPerformed ? 'YES' : 'NO'}`);
  lines.push(`read-back ok:                    ${result.readBackOk ? 'YES' : 'NO'}`);
  lines.push(`rehearsal performed:             ${result.rehearsalPerformed ? 'YES' : 'NO'}`);
  lines.push('production mutation performed:   NO');
  lines.push(`apply ready:                     ${result.applyReady ? 'YES' : 'NO'}`);
  lines.push(`cleanup performed:               ${result.cleanupPerformed ? 'YES' : 'NO'}`);
  lines.push('');
  if (result.blockers.length > 0) {
    lines.push('---- blockers ----');
    for (const b of result.blockers) lines.push(`  - ${b}`);
    lines.push('');
  }
  lines.push('OS-temp rehearsal only. No production files were created, modified, renamed, or deleted.');
  lines.push('No apply, commit, or push was performed. No remote Blogger action was attempted.');
  lines.push(`Overall: ${result.ok ? 'PASS' : 'FAIL'}`);
  return lines.join('\n') + '\n';
}

// ── CLI entry ────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (opts.forbidden.length > 0) {
    process.stderr.write(
      `[rehearse-blogger-withdrawal] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write('  This tool never applies to production, never writes to the source repo, and never approves.\n');
    return 2;
  }
  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[rehearse-blogger-withdrawal] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 2;
  }
  if (!opts.authorization) {
    process.stderr.write('[rehearse-blogger-withdrawal] ERROR: --authorization <path> is required\n');
    process.stderr.write(USAGE);
    return 2;
  }
  if (!opts.sourcePath) {
    process.stderr.write('[rehearse-blogger-withdrawal] ERROR: --source-path <path> is required\n');
    process.stderr.write(USAGE);
    return 2;
  }

  const authorizationPath = path.isAbsolute(opts.authorization)
    ? opts.authorization
    : path.resolve(process.cwd(), opts.authorization);

  const result = await rehearseBloggerWithdrawal({
    projectRoot: PROJECT_ROOT,
    authorizationPath,
    sourcePath: opts.sourcePath,
  });

  if (opts.json) {
    process.stdout.write(formatJson(result));
  } else {
    process.stdout.write(formatHumanReadable(result));
  }
  return result.ok ? 0 : 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main()
    .then((code) => process.exit(typeof code === 'number' ? code : 0))
    .catch(() => {
      // safe error boundary：**絕不**回顯 raw err.message / stack / path / secret。
      process.stderr.write('[rehearse-blogger-withdrawal] ERROR: unexpected-internal-error\n');
      process.exit(1);
    });
}
