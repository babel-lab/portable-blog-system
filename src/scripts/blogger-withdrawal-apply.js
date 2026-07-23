#!/usr/bin/env node
// Phase 20260723-publish-target-stage Slice 4I：Blogger withdrawal — production apply library.
//
// 上位契約：
//   - docs/20260723-blogger-withdrawal-production-apply.md（本 Slice 契約；Strategy B fail-closed）
//   - docs/20260722-blogger-withdrawal-rehearsal.md（Slice 4E：OS-temp rehearsal）
//   - docs/20260722-blogger-withdrawal-authorization-preparation.md（Slice 4D：authorization / preflight）
//   - docs/20260721-blogger-withdrawal-planner.md（Slice 4C：read-only planner）
//   - docs/publish-json-schema.md §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
//
// Strategy B（fail-closed atomic commit capability gate）：
//   本 runtime（Node.js 於 Windows，無 child_process、無未稽核 native binding、無 shell、無 unaudited
//   dependency）**無**受支持之：
//     - native compare-and-swap（e.g. Linux renameat2 + RENAME_EXCHANGE / Windows atomic rename-if-unchanged）
//     - mandatory exclusive lock（Windows FILE_SHARE_NONE 需要底層 API、POSIX flock/fcntl 為 advisory）
//   因此 default CLI / default library path **不**執行 production temp write / rename。所有 production
//   mutation 之嘗試皆 fail-closed 於 `atomic-commit-capability-unavailable` blocker。
//
//   test / synthetic mutation 需要 commit primitive 時，只能透過 programmatic API 之
//   `atomicCommitAdapter` 明示注入；CLI / env / authorization / repo config / prototype 皆不可到達；
//   default library call（無 adapter）必 fail closed。
//
// 硬邊界（zero-secondary-mutation；違反即設計錯誤）：
//   - 只寫「authorization 指定之 sidecar 檔案」；不動 source Markdown、不動其他 sidecar、不動
//     dist*、不動 deploy repo、不動 git index、不 commit / push / rebase / reset。
//   - No network / no child_process / no fetch / no https / no googleapis / no exec / no spawn。
//   - CLI 硬綁 project root（PROJECT_ROOT）；programmatic API 之 projectRoot / hooks /
//     atomicCommitAdapter 只由 guard 以直接函式呼叫注入，永不由 CLI / env / authorization / repo
//     file / JSON / prototype 觸發。
//
// Redaction：所有 human／JSON／blocker slug 皆為固定安全短碼；**絕不**回顯 raw publishedUrl /
//   Blogger host / Blogger post id / publishedAt / operator identity / authorization absolute path
//   / project absolute path / scratch absolute path / raw fs error / stack trace / secret token。

import { createHash } from 'node:crypto';
import {
  closeSync, existsSync, fstatSync, fsyncSync, lstatSync, openSync, readFileSync,
  realpathSync, renameSync, rmSync, statSync, writeSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { preflightWithdrawalAuthorization } from './validate-blogger-withdrawal-authorization.js';
import {
  classifyBloggerSourcePath,
  deriveSidecarPath,
  parseAndValidateAuthorization,
} from './blogger-withdrawal-authorization.js';
import {
  LIFECYCLE_WITHDRAWN_EVENT,
  WITHDRAWN_STATUS,
  collectSidecarWithdrawalIssues,
} from './sidecar-withdrawal-contract.js';
import {
  buildWithdrawnSidecar,
  serializeSidecar,
  OUTPUT_SCHEMA_VERSION,
} from './rehearse-blogger-withdrawal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export const APPLY_MODE = 'apply-blogger-withdrawal';

// exact confirmation phrase：case-sensitive、fixed；CLI 必須 verbatim 匹配。
// 不接受 yes / y / true / any localization / any env override。
export const APPLY_CONFIRMATION_PHRASE = 'APPLY BLOGGER WITHDRAWAL';

// deterministic temp filename base；join process.pid + high-entropy suffix 以避免 collision。
const TEMP_SUFFIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const TEMP_SUFFIX_LEN = 16;
const TEMP_MAX_ATTEMPTS = 5;

// Stable atomic commit strategy enum. Adapter must self-report exactly one of these.
const STRATEGY_NATIVE_CAS = 'native-compare-and-swap';
const STRATEGY_MANDATORY_LOCK = 'mandatory-exclusive-lock';
const STRATEGY_UNSUPPORTED = 'unsupported';
const SUPPORTED_STRATEGIES = new Set([STRATEGY_NATIVE_CAS, STRATEGY_MANDATORY_LOCK]);

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
function isStrictDescendant(parent, child) {
  const rel = path.relative(parent, child);
  if (rel === '') return false;
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || rel.startsWith('../')) return false;
  return !path.isAbsolute(rel);
}

// unpredictable temp suffix：avoid Math.random correlation across process； createHash of
//   process.hrtime + attempt counter + pid as entropy source (deterministic per-attempt but
//   uncorrelated between invocations). `wx` flag prevents accidental clobber even if collision.
function randomTempSuffix(attempt) {
  const seed = createHash('sha256')
    .update(String(process.pid))
    .update('|')
    .update(String(attempt))
    .update('|')
    .update(String(process.hrtime.bigint()))
    .update('|')
    .update(String(Date.now()))
    .digest('hex');
  let out = '';
  for (let i = 0; i < TEMP_SUFFIX_LEN; i += 1) {
    const idx = parseInt(seed.slice(i * 2, i * 2 + 2), 16) % TEMP_SUFFIX_CHARS.length;
    out += TEMP_SUFFIX_CHARS[idx];
  }
  return out;
}

// ── atomic-commit capability contract ───────────────────────────────────────
// Single authoritative capability probe. Report echoes { atomicCommitSupported, atomicCommitStrategy }.
//
// Contract:
//   - If a programmatic adapter is provided and its `strategy` field is one of the stable enums
//     (native-compare-and-swap / mandatory-exclusive-lock), capability is supported.
//   - Otherwise capability is unsupported. The default library / CLI path always lands here
//     because CLI never constructs an adapter.
//   - No environment, argv, authorization content, repo file, or prototype chain can promote
//     capability from unsupported to supported. Only a direct programmatic call may pass an
//     adapter whose own-property `strategy` matches an enum value.
//
// Adapter object contract (opaque; consumed by apply library only when supported):
//   - own property `strategy` ∈ SUPPORTED_STRATEGIES (own-property check; prototype ignored)
//   - own method  `commit({ tempPath, targetPath, expectedTargetSha256, expectedTargetBytes })`
//       returns { ok: true } on successful atomic replace of targetPath with tempPath
//       returns { ok: false, blocker: 'atomic-commit-cas-mismatch' | 'atomic-commit-error' }
//         if target bytes differ from expectedTargetBytes (mandatory CAS refusal) or the
//         commit primitive itself faulted. Adapter MUST NOT perform rename if bytes drifted.
export function resolveAtomicCommitCapability({ atomicCommitAdapter } = {}) {
  if (atomicCommitAdapter === undefined || atomicCommitAdapter === null) {
    return { supported: false, strategy: STRATEGY_UNSUPPORTED };
  }
  if (typeof atomicCommitAdapter !== 'object') {
    return { supported: false, strategy: STRATEGY_UNSUPPORTED };
  }
  // Own-property strategy only; prototype pollution cannot inject strategy.
  if (!Object.prototype.hasOwnProperty.call(atomicCommitAdapter, 'strategy')) {
    return { supported: false, strategy: STRATEGY_UNSUPPORTED };
  }
  const s = atomicCommitAdapter.strategy;
  if (typeof s !== 'string' || !SUPPORTED_STRATEGIES.has(s)) {
    return { supported: false, strategy: STRATEGY_UNSUPPORTED };
  }
  if (typeof atomicCommitAdapter.commit !== 'function') {
    return { supported: false, strategy: STRATEGY_UNSUPPORTED };
  }
  return { supported: true, strategy: s };
}

// ── report shape ────────────────────────────────────────────────────────────
function baseReport(sourcePath, sidecarPath) {
  return {
    ok: false,
    mode: APPLY_MODE,
    sourcePath: typeof sourcePath === 'string' ? sourcePath : null,
    sidecarPath: typeof sidecarPath === 'string' ? sidecarPath : null,
    branch: null,
    sourceHead: null,
    planFingerprint: null,
    recordFingerprint: null,
    documentValid: false,
    repositoryBindingsMatched: false,
    planBindingsMatched: false,
    recordBindingsMatched: false,
    remoteDispositionEligible: false,
    explicitlyAuthorized: false,
    preflightEligible: false,
    applyReady: false,
    commitReady: false,
    atomicCommitSupported: false,
    atomicCommitStrategy: STRATEGY_UNSUPPORTED,
    applyPerformed: false,
    productionMutationPerformed: false,
    authorizationSha256: null,
    sourceSha256: null,
    sidecarSha256Before: null,
    sidecarSha256After: null,
    outputSha256: null,
    readBackOk: false,
    rollbackAttempted: false,
    rollbackSucceeded: false,
    rollbackVerified: false,
    cleanupPerformed: true,
    cleanupSucceeded: true,
    tempFileCreated: false,
    tempFileRemoved: false,
    blockers: [],
  };
}

// ── path safety helpers ─────────────────────────────────────────────────────
// Check every intermediate parent segment between `fromRoot` (real path) and `toAbs`
//   (real path) for symbolic link / junction / reparse-point. On Windows Node treats
//   junction / reparse-point as symbolic link via lstat. Any hit → fail closed.
function firstSymlinkOrJunctionAncestor(fromRoot, toAbs) {
  if (!isStrictDescendant(fromRoot, toAbs)) return { ok: false, reason: 'not-descendant' };
  const rel = path.relative(fromRoot, toAbs);
  const segments = rel.split(path.sep);
  let current = fromRoot;
  // Iterate all segments EXCEPT the leaf (which the caller already lstat-checked).
  for (let i = 0; i < segments.length - 1; i += 1) {
    current = path.join(current, segments[i]);
    let s;
    try { s = lstatSync(current); } catch { return { ok: false, reason: 'ancestor-unreadable' }; }
    if (s.isSymbolicLink()) return { ok: false, reason: 'ancestor-symlink' };
    if (!s.isDirectory()) return { ok: false, reason: 'ancestor-not-directory' };
  }
  return { ok: true };
}

// Safe realpath: returns null on failure (caller decides how to react).
function safeRealpath(p) {
  try { return realpathSync.native(p); } catch { return null; }
}

// ── main apply API ──────────────────────────────────────────────────────────
// programmatic-only parameters（CLI **不**傳入；guard 直接以 function invocation 注入）：
//   projectRoot          — synthetic guard 以 mkdtemp git repo 驅動；CLI 硬編碼 PROJECT_ROOT。
//   atomicCommitAdapter  — Strategy B commit primitive；CLI **never** constructs；default
//                          library call without this parameter fails closed at the capability gate.
//   hooks — pre/post filesystem stages 供 guard 注入 race / failure：
//     beforeFreshnessCheck({ sidecarPath })  — 於 temp write 完成後、freshness compare 前
//     beforeTempWrite({ sidecarPath, tempPath }) — 於 temp file writeSync 前
//     beforeRename({ tempPath, sidecarPath })    — 於 adapter.commit 前（final race window）
//     afterRename({ sidecarPath })                — 於 adapter.commit 完成、read-back 前
//     beforeReadBack({ sidecarPath })             — 於 read-back readFileSync 前
//     beforeRollback({ sidecarPath, rollbackTempPath }) — 於 rollback rename 前
//   Hook exception 一律 swallowed；hooks 不影響 CLI code path（CLI 從不建構 hooks 物件）。
//
// applyReady vs commitReady 語意：
//   - applyReady   ← preflight outcome（authorization / bindings / disposition / explicit approval）
//   - commitReady  ← applyReady AND atomicCommitSupported AND path safety gates cleared
//   - ok           ← commitReady AND successful atomic commit AND read-back verified AND
//                    post-write source freshness verified AND rollback not required
//
// 硬綁定：
//   - authorization raw bytes 只讀一次（authorizationPath），計算 SHA-256，透過
//     authorizationText 傳給 preflight；apply 使用同一份 in-memory bytes 之 parsed object。
//   - source / sidecar 各讀入單一 buffer，SHA-256 從 buffer 計算，與 preflight 觀察值相等
//     方可繼續；pre-rename freshness check 只作 compare-only，不 rebuild transformation。
//   - post-commit source freshness check：re-read source after successful commit；若 SHA
//     或 bytes 不匹配 apply-time buffer → rollback sidecar 並保留 post-write-source-freshness-drift
//     為 primary blocker。
export async function applyBloggerWithdrawal({
  projectRoot = PROJECT_ROOT,
  authorizationPath,
  hooks,
  atomicCommitAdapter,
} = {}) {
  const report = baseReport(null, null);
  const push = (b) => { if (!report.blockers.includes(b)) report.blockers.push(b); };
  const refuse = (blocker) => {
    push(blocker);
    report.applyReady = false;
    report.commitReady = false;
  };

  // ── read authorization raw bytes exactly once（apply layer 之 single-read 契約）──
  if (typeof authorizationPath !== 'string' || authorizationPath === '') {
    refuse('authorization-path-missing');
    return report;
  }
  let authLst;
  try {
    authLst = lstatSync(authorizationPath);
  } catch {
    refuse('authorization-unreadable');
    return report;
  }
  if (authLst.isSymbolicLink()) { refuse('authorization-symlink'); return report; }
  if (!authLst.isFile()) { refuse('authorization-not-regular-file'); return report; }
  let rawAuthText;
  try {
    rawAuthText = readFileSync(authorizationPath, 'utf-8');
  } catch {
    refuse('authorization-unreadable');
    return report;
  }
  const authorizationSha256 = sha256HexOfString(rawAuthText);
  report.authorizationSha256 = authorizationSha256;

  // Parse once to derive target sourcePath before preflight (which needs sourcePath).
  //   Any schema violation surfaces below via preflight itself; here we only extract the
  //   target sourcePath in a shape-safe way. If parse fails or shape is wrong, preflight
  //   will refuse with the appropriate blocker.
  const parsed = parseAndValidateAuthorization(rawAuthText);
  if (!parsed.ok) {
    // Mirror preflight blocker semantics so caller gets a stable slug even before preflight.
    refuse(parsed.blocker);
    return report;
  }
  const authorization = parsed.authorization;
  const sourcePath = authorization.target.sourcePath;
  const sidecarPath = authorization.target.sidecarPath;
  report.sourcePath = sourcePath;
  report.sidecarPath = sidecarPath;

  // Independent shape check (defense-in-depth; parseAndValidateAuthorization also gates this).
  if (classifyBloggerSourcePath(sourcePath) !== null) {
    refuse('source-path-invalid');
    return report;
  }
  if (sidecarPath !== deriveSidecarPath(sourcePath)) {
    refuse('sidecar-path-mismatch');
    return report;
  }

  // ── run preflight with the exact bytes we just hashed（no second pathname read）──
  let pf;
  try {
    pf = await preflightWithdrawalAuthorization({
      projectRoot,
      authorizationPath,
      authorizationText: rawAuthText,
      sourcePath,
    });
  } catch {
    refuse('preflight-error');
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
  report.remoteDispositionEligible = pf.remoteDispositionEligible === true;
  report.explicitlyAuthorized = pf.explicitlyAuthorized === true;
  report.applyReady = pf.applyReady === true;
  report.preflightEligible = pf.applyReady === true;
  for (const b of pf.blockers) push(b);
  if (!pf.applyReady) return report;

  // Preflight-observed truth (single source for TOCTOU compare targets).
  const preflightAuthSha256 = pf.validatedAuthorizationSha256;
  const preflightSourceSha256 = pf.observedSourceSha256;
  const preflightSidecarSha256 = pf.observedSidecarSha256;
  if (!isSha256HexLower(preflightAuthSha256)
    || !isSha256HexLower(preflightSourceSha256)
    || !isSha256HexLower(preflightSidecarSha256)
    || preflightAuthSha256 !== authorizationSha256) {
    refuse('preflight-binding-incomplete');
    return report;
  }
  if (!isGitSha40Lower(report.sourceHead)) {
    refuse('git-head-invalid');
    return report;
  }

  // ── resolve absolute source / sidecar paths and safety gates ──
  const absSource = path.join(projectRoot, ...sourcePath.split('/'));
  const absSidecar = path.join(projectRoot, ...sidecarPath.split('/'));

  // Strict containment: both files must be strict descendants of projectRoot; no
  //   `..` escape, no absolute injection.
  if (!isStrictDescendant(projectRoot, absSource) || !isStrictDescendant(projectRoot, absSidecar)) {
    refuse('target-outside-project-root');
    return report;
  }

  // ── lstat gates: symlink / non-regular file → refuse ──
  let sourceLst;
  try { sourceLst = lstatSync(absSource); } catch { refuse('source-unreadable'); return report; }
  if (sourceLst.isSymbolicLink()) { refuse('source-symlink'); return report; }
  if (!sourceLst.isFile()) { refuse('source-not-regular-file'); return report; }

  let sidecarLst;
  try { sidecarLst = lstatSync(absSidecar); } catch { refuse('sidecar-unreadable'); return report; }
  if (sidecarLst.isSymbolicLink()) { refuse('sidecar-symlink'); return report; }
  if (!sidecarLst.isFile()) { refuse('sidecar-not-regular-file'); return report; }

  // ── hard-link identity gate (§10) ──
  //   Windows NTFS file indexes (used for ino) frequently exceed Number.MAX_SAFE_INTEGER
  //   (2^53); reading them via default fs.Stats can silently collapse two distinct inodes
  //   to the same Number and produce a false-positive "same file" verdict. We therefore
  //   re-stat with { bigint: true } for the identity comparison, keeping dev / ino as
  //   BigInt so equality is bit-exact. `nlink` remains a small integer (Number-safe).
  //
  //   If both files share dev+ino (both non-zero), they alias the same bytes. If nlink
  //   is > 1 for either file, an unknown external hard-link exists — fail closed because
  //   our CAS invariants only cover the one path we control. If the platform cannot
  //   provide reliable identity (ino is 0n), fail closed with a stable blocker.
  let sourceBig;
  let sidecarBig;
  try { sourceBig = lstatSync(absSource, { bigint: true }); } catch { refuse('source-unreadable'); return report; }
  try { sidecarBig = lstatSync(absSidecar, { bigint: true }); } catch { refuse('sidecar-unreadable'); return report; }
  const srcDev = sourceBig.dev;
  const srcIno = sourceBig.ino;
  const scDev = sidecarBig.dev;
  const scIno = sidecarBig.ino;
  if (typeof srcDev !== 'bigint' || typeof srcIno !== 'bigint'
    || typeof scDev !== 'bigint' || typeof scIno !== 'bigint'
    || srcIno === 0n || scIno === 0n) {
    refuse('file-identity-unavailable');
    return report;
  }
  if (srcDev === scDev && srcIno === scIno) {
    refuse('source-sidecar-same-file');
    return report;
  }
  const srcNlink = Number(sourceBig.nlink);
  const scNlink = Number(sidecarBig.nlink);
  if (!Number.isFinite(srcNlink) || srcNlink > 1) {
    refuse('source-hard-link-detected');
    return report;
  }
  if (!Number.isFinite(scNlink) || scNlink > 1) {
    refuse('sidecar-hard-link-detected');
    return report;
  }

  // ── realpath + parent junction gate (§10b / §11) ──
  //   Two-layer check:
  //   (a) Iterate every intermediate parent segment of the ORIGINAL (un-realpath'd)
  //       absSource / absSidecar starting at projectRoot; if any segment is a symbolic
  //       link / junction / reparse-point (isSymbolicLink()), refuse. This catches the
  //       case where an attacker has replaced a repo-relative directory with a junction
  //       pointing elsewhere.
  //   (b) Resolve projectRoot / absSource / absSidecar through realpathSync.native and
  //       verify the resolved source / sidecar remain strict descendants of the resolved
  //       root. This catches subtler cases where realpath resolution escapes the tree.
  //   Additionally lstat the projectRoot leaf itself: if projectRoot is a symlink,
  //   refuse (any subsequent write would traverse the link).
  let projectRootLst;
  try { projectRootLst = lstatSync(projectRoot); } catch { refuse('realpath-unresolvable'); return report; }
  if (projectRootLst.isSymbolicLink()) {
    refuse('project-root-symlink');
    return report;
  }
  const srcAncestor = firstSymlinkOrJunctionAncestor(projectRoot, absSource);
  if (!srcAncestor.ok) { refuse('source-parent-junction-detected'); return report; }
  const scAncestor = firstSymlinkOrJunctionAncestor(projectRoot, absSidecar);
  if (!scAncestor.ok) { refuse('sidecar-parent-junction-detected'); return report; }
  const projectRootReal = safeRealpath(projectRoot);
  const sourceReal = safeRealpath(absSource);
  const sidecarReal = safeRealpath(absSidecar);
  if (projectRootReal === null || sourceReal === null || sidecarReal === null) {
    refuse('realpath-unresolvable');
    return report;
  }
  if (!isStrictDescendant(projectRootReal, sourceReal)
    || !isStrictDescendant(projectRootReal, sidecarReal)) {
    refuse('target-outside-project-root-after-realpath');
    return report;
  }

  // ── atomic commit capability gate (Strategy B) ──
  //   Runs AFTER read-only preflight / hash observation / path safety gates but BEFORE
  //   any production temp file creation, source / sidecar production write, or rename.
  //   If unsupported: applyReady preserves preflight verdict (authorization may be
  //   ready) but commitReady is false and a stable blocker is emitted.
  const capability = resolveAtomicCommitCapability({ atomicCommitAdapter });
  report.atomicCommitSupported = capability.supported;
  report.atomicCommitStrategy = capability.strategy;
  if (!capability.supported) {
    push('atomic-commit-capability-unavailable');
    report.commitReady = false;
    // applyReady preserved (authorization gate outcome); no temp file created.
    // productionMutationPerformed / tempFileCreated / rollbackAttempted stay false.
    return report;
  }
  report.commitReady = true;

  // ── same-buffer source / sidecar binding ──
  let sourceBuf;
  let sidecarBuf;
  try { sourceBuf = readFileSync(absSource); } catch { refuse('source-unreadable'); return report; }
  try { sidecarBuf = readFileSync(absSidecar); } catch { refuse('sidecar-unreadable'); return report; }
  const sourceSha256 = sha256HexOfBuffer(sourceBuf);
  const sidecarSha256Before = sha256HexOfBuffer(sidecarBuf);
  report.sourceSha256 = sourceSha256;
  report.sidecarSha256Before = sidecarSha256Before;
  if (sourceSha256 !== preflightSourceSha256) {
    refuse('source-hash-toctou-drift');
    return report;
  }
  if (sidecarSha256Before !== preflightSidecarSha256) {
    refuse('sidecar-hash-toctou-drift');
    return report;
  }

  // Parse sidecar from the same buffer we hashed. All transformation input comes from
  //   this in-memory object; we never re-read the sidecar pathname for transformation input.
  let priorSidecar;
  try {
    priorSidecar = JSON.parse(sidecarBuf.toString('utf-8'));
  } catch {
    refuse('sidecar-parse-error');
    return report;
  }

  // Already-withdrawn no-op: contract §15 chooses "fail closed" so operator cannot
  //   accidentally append a second withdrawn lifecycle event or re-hash.
  if (priorSidecar
      && priorSidecar.blogger
      && priorSidecar.blogger.status === WITHDRAWN_STATUS) {
    refuse('sidecar-already-withdrawn');
    return report;
  }

  // ── build withdrawal transformation via authorized production helper ──
  const newSidecarObj = buildWithdrawnSidecar({
    priorSidecar,
    authorization,
    sourcePath,
    sourceSha256,
    sidecarSha256: sidecarSha256Before,
    gitHead: report.sourceHead,
    authorizationFingerprint: authorizationSha256,
  });
  const newBytes = serializeSidecar(newSidecarObj);
  const outputSha256 = sha256HexOfString(newBytes);
  report.outputSha256 = outputSha256;

  // Semantic validation of the payload BEFORE we ever create a temp file — defense-in-depth
  //   so a bug in transformation cannot escape to a production write.
  const issues = collectSidecarWithdrawalIssues(newSidecarObj, { sourcePath, sidecarPath });
  if (issues.length > 0) {
    const types = [...new Set(issues.map((i) => i.type))].sort();
    for (const t of types) refuse(`apply-payload-invalid:${t}`);
    return report;
  }
  if (newSidecarObj.schemaVersion !== OUTPUT_SCHEMA_VERSION
    || !newSidecarObj.blogger
    || newSidecarObj.blogger.status !== WITHDRAWN_STATUS
    || !Array.isArray(newSidecarObj.blogger.lifecycle)
    || newSidecarObj.blogger.lifecycle.length === 0
    || newSidecarObj.blogger.lifecycle[newSidecarObj.blogger.lifecycle.length - 1].event
       !== LIFECYCLE_WITHDRAWN_EVENT) {
    refuse('apply-payload-invalid:invariant');
    return report;
  }

  // ── temp file creation（same-directory sibling; exclusive; unpredictable name）──
  const sidecarDir = path.dirname(absSidecar);
  const sidecarBase = path.basename(absSidecar);
  let tempAbs = null;
  let tempFd = -1;
  let attempt = 0;
  while (attempt < TEMP_MAX_ATTEMPTS) {
    attempt += 1;
    const candidate = path.join(
      sidecarDir,
      `.${sidecarBase}.apply-${process.pid}-${randomTempSuffix(attempt)}.tmp`,
    );
    try {
      tempFd = openSync(candidate, 'wx', 0o600);
      tempAbs = candidate;
      break;
    } catch {
      tempAbs = null;
      tempFd = -1;
    }
  }
  if (tempFd === -1 || tempAbs === null) {
    refuse('temp-file-create-failed');
    return report;
  }
  report.tempFileCreated = true;

  const cleanupTemp = () => {
    if (tempAbs && existsSync(tempAbs)) {
      try {
        rmSync(tempAbs, { force: true, maxRetries: 3 });
      } catch {
        return false;
      }
    }
    const still = tempAbs ? existsSync(tempAbs) : false;
    return !still;
  };

  const finalizeCleanup = () => {
    if (!tempAbs) {
      report.cleanupPerformed = true;
      report.cleanupSucceeded = true;
      report.tempFileRemoved = true;
      return;
    }
    const ok = cleanupTemp();
    report.cleanupPerformed = true;
    report.cleanupSucceeded = ok;
    report.tempFileRemoved = ok;
    if (!ok) {
      // §12 cleanup contract: cleanup failure surfaces as blocker AFTER primary blockers,
      //   without masking them.
      push('temp-cleanup-failed');
      report.ok = false;
      report.applyReady = false;
      report.commitReady = false;
    }
  };

  // Guard-only hook: before temp write.
  if (hooks && typeof hooks.beforeTempWrite === 'function') {
    try { hooks.beforeTempWrite({ sidecarPath, tempPath: tempAbs }); } catch { /* swallow */ }
  }

  // ── write full bytes + flush + close ──
  try {
    const encoded = Buffer.from(newBytes, 'utf-8');
    let offset = 0;
    while (offset < encoded.length) {
      const written = writeSync(tempFd, encoded, offset, encoded.length - offset);
      if (written <= 0) throw new Error('short-write');
      offset += written;
    }
    const st = fstatSync(tempFd);
    if (st.size !== encoded.length) throw new Error('size-mismatch');
    fsyncSync(tempFd);
  } catch {
    try { closeSync(tempFd); } catch { /* ignore */ }
    tempFd = -1;
    refuse('temp-file-write-failed');
    finalizeCleanup();
    return report;
  }
  try { closeSync(tempFd); tempFd = -1; } catch { /* ignore */ }

  // Guard-only hook: before freshness compare.
  if (hooks && typeof hooks.beforeFreshnessCheck === 'function') {
    try { hooks.beforeFreshnessCheck({ sidecarPath }); } catch { /* swallow */ }
  }

  // ── re-verify sidecar target safety immediately before rename ──
  let sidecarLst2;
  try { sidecarLst2 = lstatSync(absSidecar, { bigint: true }); } catch {
    refuse('sidecar-vanished-pre-rename');
    finalizeCleanup();
    return report;
  }
  if (sidecarLst2.isSymbolicLink() || !sidecarLst2.isFile()) {
    refuse('sidecar-not-regular-pre-rename');
    finalizeCleanup();
    return report;
  }
  const scNlink2 = Number(sidecarLst2.nlink);
  if (!Number.isFinite(scNlink2) || scNlink2 > 1) {
    refuse('sidecar-hard-link-detected');
    finalizeCleanup();
    return report;
  }

  // Compare-only freshness gate.
  let sidecarBufNow;
  try { sidecarBufNow = readFileSync(absSidecar); } catch {
    refuse('sidecar-vanished-pre-rename');
    finalizeCleanup();
    return report;
  }
  const sidecarSha256Now = sha256HexOfBuffer(sidecarBufNow);
  if (sidecarSha256Now !== sidecarSha256Before || !sidecarBufNow.equals(sidecarBuf)) {
    refuse('sidecar-freshness-drift');
    finalizeCleanup();
    return report;
  }

  // Source freshness gate — pre-commit compare.
  let sourceBufNow;
  try { sourceBufNow = readFileSync(absSource); } catch {
    refuse('source-vanished-pre-rename');
    finalizeCleanup();
    return report;
  }
  if (sha256HexOfBuffer(sourceBufNow) !== sourceSha256 || !sourceBufNow.equals(sourceBuf)) {
    refuse('source-freshness-drift');
    finalizeCleanup();
    return report;
  }

  // Guard-only hook: before rename primitive (final race window).
  if (hooks && typeof hooks.beforeRename === 'function') {
    try { hooks.beforeRename({ tempPath: tempAbs, sidecarPath }); } catch { /* swallow */ }
  }

  // ── atomic commit primitive via adapter (Strategy B) ──
  //   Adapter re-reads target bytes under its own strategy (native CAS or mandatory
  //   exclusive lock) and refuses rename if target bytes drifted from expectedTargetBytes.
  //   The library holds no assumption about how the adapter achieves atomicity; it only
  //   consumes { ok, blocker? } and reflects them in the report.
  let commitResult;
  try {
    commitResult = atomicCommitAdapter.commit({
      tempPath: tempAbs,
      targetPath: absSidecar,
      expectedTargetSha256: sidecarSha256Before,
      expectedTargetBytes: sidecarBuf,
    });
  } catch {
    commitResult = { ok: false, blocker: 'atomic-commit-error' };
  }
  if (!commitResult || commitResult.ok !== true) {
    const blocker = (commitResult && typeof commitResult.blocker === 'string')
      ? commitResult.blocker
      : 'atomic-commit-mismatch';
    // Restrict to a small stable set — never echo adapter-provided arbitrary strings.
    const stable = new Set(['atomic-commit-cas-mismatch', 'atomic-commit-error', 'atomic-commit-mismatch']);
    push(stable.has(blocker) ? blocker : 'atomic-commit-mismatch');
    report.applyReady = false;
    report.commitReady = false;
    finalizeCleanup();
    return report;
  }
  // Adapter succeeded: production sidecar now holds tempAbs's bytes.
  tempAbs = null;
  report.tempFileRemoved = true;
  report.applyPerformed = true;
  report.productionMutationPerformed = true;

  if (hooks && typeof hooks.afterRename === 'function') {
    try { hooks.afterRename({ sidecarPath }); } catch { /* swallow */ }
  }
  if (hooks && typeof hooks.beforeReadBack === 'function') {
    try { hooks.beforeReadBack({ sidecarPath }); } catch { /* swallow */ }
  }

  // ── read-back verification ──
  let readBackBytes;
  let readBackText;
  let readBackOk = false;
  try {
    readBackBytes = readFileSync(absSidecar);
    readBackText = readBackBytes.toString('utf-8');
  } catch {
    readBackOk = false;
  }
  const readBackSha256 = readBackBytes ? sha256HexOfBuffer(readBackBytes) : null;
  report.sidecarSha256After = readBackSha256;

  if (readBackBytes && readBackText === newBytes && readBackSha256 === outputSha256) {
    try {
      const parsedBack = JSON.parse(readBackText);
      const backIssues = collectSidecarWithdrawalIssues(parsedBack, { sourcePath, sidecarPath });
      if (backIssues.length === 0
        && parsedBack.schemaVersion === OUTPUT_SCHEMA_VERSION
        && parsedBack.blogger
        && parsedBack.blogger.status === WITHDRAWN_STATUS) {
        readBackOk = true;
      }
    } catch {
      readBackOk = false;
    }
  }
  report.readBackOk = readBackOk;

  // Rollback helper: primary blocker MUST be pushed by caller BEFORE this is invoked;
  //   rollback failure paths append rollback-* blockers without overwriting primary.
  const attemptRollback = () => {
    report.rollbackAttempted = true;
    if (hooks && typeof hooks.beforeRollback === 'function') {
      try { hooks.beforeRollback({ sidecarPath, rollbackTempPath: null }); } catch { /* swallow */ }
    }
    let rbTempAbs = null;
    let rbTempFd = -1;
    let rbAttempt = 0;
    while (rbAttempt < TEMP_MAX_ATTEMPTS) {
      rbAttempt += 1;
      const candidate = path.join(
        sidecarDir,
        `.${sidecarBase}.rollback-${process.pid}-${randomTempSuffix(1000 + rbAttempt)}.tmp`,
      );
      try {
        rbTempFd = openSync(candidate, 'wx', 0o600);
        rbTempAbs = candidate;
        break;
      } catch {
        rbTempAbs = null;
        rbTempFd = -1;
      }
    }
    if (rbTempFd === -1) {
      push('rollback-temp-create-failed');
      return;
    }
    let rbWriteOk = false;
    try {
      const enc = sidecarBuf;
      let off = 0;
      while (off < enc.length) {
        const w = writeSync(rbTempFd, enc, off, enc.length - off);
        if (w <= 0) throw new Error('short');
        off += w;
      }
      const st = fstatSync(rbTempFd);
      if (st.size !== enc.length) throw new Error('size');
      fsyncSync(rbTempFd);
      rbWriteOk = true;
    } catch {
      rbWriteOk = false;
    }
    try { closeSync(rbTempFd); } catch { /* ignore */ }
    if (!rbWriteOk) {
      try { if (rbTempAbs && existsSync(rbTempAbs)) rmSync(rbTempAbs, { force: true }); } catch { /* ignore */ }
      push('rollback-temp-write-failed');
      return;
    }
    try {
      renameSync(rbTempAbs, absSidecar);
      rbTempAbs = null;
    } catch {
      try { if (rbTempAbs && existsSync(rbTempAbs)) rmSync(rbTempAbs, { force: true }); } catch { /* ignore */ }
      push('rollback-rename-failed');
      return;
    }
    try {
      const verifyBuf = readFileSync(absSidecar);
      if (verifyBuf.equals(sidecarBuf) && sha256HexOfBuffer(verifyBuf) === sidecarSha256Before) {
        report.rollbackSucceeded = true;
        report.rollbackVerified = true;
        report.productionMutationPerformed = false;
        report.sidecarSha256After = sidecarSha256Before;
      } else {
        push('rollback-verification-failed');
      }
    } catch {
      push('rollback-verification-failed');
    }
  };

  if (!readBackOk) {
    // §12: push primary blocker BEFORE invoking rollback so rollback failures append
    //   rollback-* blockers without ever displacing readback-mismatch.
    push('readback-mismatch');
    attemptRollback();
    report.ok = false;
    report.applyReady = false;
    report.commitReady = false;
    finalizeCleanup();
    return report;
  }

  // ── post-commit source freshness gate (§9) ──
  //   Even after successful commit + readback, if source drifted between our pre-commit
  //   freshness check and now, the withdrawal lifecycle event we just persisted has a
  //   sourceSha256 that no longer describes the current source bytes. Rollback the
  //   sidecar so we do not leave production with a stale-source-bound lifecycle.
  let sourceBufPostCommit;
  let sourceDrifted = false;
  try {
    sourceBufPostCommit = readFileSync(absSource);
    if (sha256HexOfBuffer(sourceBufPostCommit) !== sourceSha256
      || !sourceBufPostCommit.equals(sourceBuf)) sourceDrifted = true;
  } catch {
    sourceDrifted = true;
  }
  if (sourceDrifted) {
    push('post-write-source-freshness-drift');
    attemptRollback();
    report.ok = false;
    report.applyReady = false;
    report.commitReady = false;
    finalizeCleanup();
    return report;
  }

  // ── success path ──
  report.ok = true;
  report.applyReady = true;
  report.commitReady = true;
  finalizeCleanup();
  return report;
}

// ── formatting（deterministic；固定 key order；redacted）───────────────────────
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
    remoteDispositionEligible: result.remoteDispositionEligible,
    explicitlyAuthorized: result.explicitlyAuthorized,
    preflightEligible: result.preflightEligible,
    applyReady: result.applyReady,
    commitReady: result.commitReady,
    atomicCommitSupported: result.atomicCommitSupported,
    atomicCommitStrategy: result.atomicCommitStrategy,
    applyPerformed: result.applyPerformed,
    productionMutationPerformed: result.productionMutationPerformed,
    authorizationSha256: result.authorizationSha256,
    sourceSha256: result.sourceSha256,
    sidecarSha256Before: result.sidecarSha256Before,
    sidecarSha256After: result.sidecarSha256After,
    outputSha256: result.outputSha256,
    readBackOk: result.readBackOk,
    rollbackAttempted: result.rollbackAttempted,
    rollbackSucceeded: result.rollbackSucceeded,
    rollbackVerified: result.rollbackVerified,
    cleanupPerformed: result.cleanupPerformed,
    cleanupSucceeded: result.cleanupSucceeded,
    tempFileCreated: result.tempFileCreated,
    tempFileRemoved: result.tempFileRemoved,
    blockers: result.blockers,
  };
  return JSON.stringify(body, null, 2) + '\n';
}

export function formatHumanReadable(result) {
  const lines = [];
  lines.push('apply-blogger-withdrawal');
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
  lines.push(`remote disposition eligible:     ${result.remoteDispositionEligible ? 'YES' : 'NO'}`);
  lines.push(`explicitly authorized:           ${result.explicitlyAuthorized ? 'YES' : 'NO'}`);
  lines.push(`preflight eligible:              ${result.preflightEligible ? 'YES' : 'NO'}`);
  lines.push(`apply ready:                     ${result.applyReady ? 'YES' : 'NO'}`);
  lines.push(`commit ready:                    ${result.commitReady ? 'YES' : 'NO'}`);
  lines.push(`atomic commit supported:         ${result.atomicCommitSupported ? 'YES' : 'NO'}`);
  lines.push(`atomic commit strategy:          ${result.atomicCommitStrategy}`);
  lines.push(`apply performed:                 ${result.applyPerformed ? 'YES' : 'NO'}`);
  lines.push(`production mutation performed:   ${result.productionMutationPerformed ? 'YES' : 'NO'}`);
  lines.push(`authorization sha256:            ${result.authorizationSha256 ?? '(not computed)'}`);
  lines.push(`source sha256:                   ${result.sourceSha256 ?? '(not computed)'}`);
  lines.push(`sidecar sha256 before:           ${result.sidecarSha256Before ?? '(not computed)'}`);
  lines.push(`sidecar sha256 after:            ${result.sidecarSha256After ?? '(not computed)'}`);
  lines.push(`output sha256:                   ${result.outputSha256 ?? '(not computed)'}`);
  lines.push(`read-back ok:                    ${result.readBackOk ? 'YES' : 'NO'}`);
  lines.push(`rollback attempted:              ${result.rollbackAttempted ? 'YES' : 'NO'}`);
  lines.push(`rollback succeeded:              ${result.rollbackSucceeded ? 'YES' : 'NO'}`);
  lines.push(`rollback verified:               ${result.rollbackVerified ? 'YES' : 'NO'}`);
  lines.push(`cleanup performed:               ${result.cleanupPerformed ? 'YES' : 'NO'}`);
  lines.push(`cleanup succeeded:               ${result.cleanupSucceeded ? 'YES' : 'NO'}`);
  lines.push(`temp file created:               ${result.tempFileCreated ? 'YES' : 'NO'}`);
  lines.push(`temp file removed:               ${result.tempFileRemoved ? 'YES' : 'NO'}`);
  lines.push('');
  if (result.blockers.length > 0) {
    lines.push('---- blockers ----');
    for (const b of result.blockers) lines.push(`  - ${b}`);
    lines.push('');
  }
  lines.push('Single-record Blogger withdrawal production apply.');
  lines.push('No commit, no push, no Blogger action, no deploy was performed.');
  lines.push(`Overall: ${result.ok ? 'PASS' : 'FAIL'}`);
  return lines.join('\n') + '\n';
}
