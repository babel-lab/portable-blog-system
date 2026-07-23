#!/usr/bin/env node
// Phase 20260723-publish-target-stage Slice 4I：Blogger withdrawal — production apply library.
//
// 上位契約：
//   - docs/20260723-blogger-withdrawal-production-apply.md（本 Slice 契約）
//   - docs/20260722-blogger-withdrawal-rehearsal.md（Slice 4E：OS-temp rehearsal）
//   - docs/20260722-blogger-withdrawal-authorization-preparation.md（Slice 4D：authorization / preflight）
//   - docs/20260721-blogger-withdrawal-planner.md（Slice 4C：read-only planner）
//   - docs/publish-json-schema.md §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
//
// 目的：
//   在既有 authorization contract、planner、preflight、rehearsal 皆 apply-ready 的前提下，把
//   deterministic withdrawal mutation 實際套用到單一 production `.publish.json` sidecar。所有寫入
//   限於「authorization 指定之 sidecar 檔案本身」；source Markdown 全程唯讀；deploy repo 全程無關；
//   無網路、無 Blogger／Google／GA4／AdSense API、無 child_process、無 git mutation。
//
// Pipeline position（見 docs/20260723-blogger-withdrawal-production-apply.md §0）：
//   plan:blogger-withdrawals                     (Slice 4C；read-only planner)
//     → remote disposition verification          (人工；本工具不做)
//     → prepare:blogger-withdrawal-authorization (Slice 4D；draft generator)
//     → operator review + 手動 flip explicitlyAuthorized
//     → validate:blogger-withdrawal-authorization(Slice 4D；read-only preflight)
//     → rehearse:blogger-withdrawal              (Slice 4E；OS-temp mutation rehearsal)
//     → **this slice** apply:blogger-withdrawal  (single-record production mutation)
//     → (future) post-commit audit / push / redraft  (各須獨立授權)
//
// 硬邊界（zero-secondary-mutation；違反即設計錯誤）：
//   - 只寫「authorization 指定之 sidecar 檔案」；不動 source Markdown、不動其他 sidecar、不動
//     dist*、不動 deploy repo、不動 git index、不 commit / push / rebase / reset。
//   - No network / no child_process / no fetch / no https / no googleapis / no exec / no spawn。
//   - CLI 硬綁 project root（PROJECT_ROOT）；programmatic API 之 projectRoot / hooks 只由 guard
//     以直接函式呼叫注入，永不由 CLI / env / authorization / repo file / JSON 觸發。
//
// Redaction：所有 human／JSON／blocker slug 皆為固定安全短碼；**絕不**回顯 raw publishedUrl /
//   Blogger host / Blogger post id / publishedAt / operator identity / authorization absolute path
//   / project absolute path / scratch absolute path / raw fs error / stack trace / secret token。

import { createHash } from 'node:crypto';
import {
  closeSync, existsSync, fstatSync, fsyncSync, lstatSync, openSync, readFileSync,
  renameSync, rmSync, statSync, writeSync,
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

// ── main apply API ──────────────────────────────────────────────────────────
// programmatic-only parameters（CLI **不**傳入；guard 直接以 function invocation 注入）：
//   projectRoot — synthetic guard 以 mkdtemp git repo 驅動；CLI 硬編碼 PROJECT_ROOT。
//   hooks — pre/post filesystem stages 供 guard 注入 race / failure：
//     beforeFreshnessCheck({ sidecarPath })  — 於 temp write 完成後、freshness compare 前
//     beforeTempWrite({ sidecarPath, tempPath }) — 於 temp file writeSync 前
//     beforeRename({ tempPath, sidecarPath })    — 於 rename primitive 前
//     afterRename({ sidecarPath })                — 於 rename primitive 完成、read-back 前
//     beforeReadBack({ sidecarPath })             — 於 read-back readFileSync 前
//     beforeRollback({ sidecarPath, rollbackTempPath }) — 於 rollback rename 前
//   Hook exception 一律 swallowed；hooks 不影響 CLI code path（CLI 從不建構 hooks 物件）。
//
// applyReady 語意：
//   preflight 決定 applyReady；apply-time TOCTOU drift / temp write fail / rename fail /
//   readback mismatch / rollback / cleanup failure 均會清空 applyReady 為 false。
//
// 硬綁定：
//   - authorization raw bytes 只讀一次（authorizationPath），計算 SHA-256，透過
//     authorizationText 傳給 preflight；apply 使用同一份 in-memory bytes 之 parsed object。
//   - source / sidecar 各讀入單一 buffer，SHA-256 從 buffer 計算，與 preflight 觀察值相等
//     方可繼續；pre-rename freshness check 只作 compare-only，不 rebuild transformation。
export async function applyBloggerWithdrawal({
  projectRoot = PROJECT_ROOT,
  authorizationPath,
  hooks,
} = {}) {
  const report = baseReport(null, null);
  const push = (b) => { if (!report.blockers.includes(b)) report.blockers.push(b); };
  const refuse = (blocker) => {
    push(blocker);
    report.applyReady = false;
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

  // strict containment: both files must be strict descendants of projectRoot; no
  //   `..` escape, no absolute injection. path.join+relative gives us a defense-in-depth
  //   check against symbolic path shapes even before lstat.
  if (!isStrictDescendant(projectRoot, absSource) || !isStrictDescendant(projectRoot, absSidecar)) {
    refuse('target-outside-project-root');
    return report;
  }

  // lstat gates: refuse symlinks / non-regular files. lstat (not stat) so symlinks
  //   are surfaced instead of being silently dereferenced. Windows junctions/reparse
  //   points also surface as symbolic links via lstat.
  let sourceLst;
  try {
    sourceLst = lstatSync(absSource);
  } catch {
    refuse('source-unreadable');
    return report;
  }
  if (sourceLst.isSymbolicLink()) { refuse('source-symlink'); return report; }
  if (!sourceLst.isFile()) { refuse('source-not-regular-file'); return report; }

  let sidecarLst;
  try {
    sidecarLst = lstatSync(absSidecar);
  } catch {
    refuse('sidecar-unreadable');
    return report;
  }
  if (sidecarLst.isSymbolicLink()) { refuse('sidecar-symlink'); return report; }
  if (!sidecarLst.isFile()) { refuse('sidecar-not-regular-file'); return report; }

  // Same-file alias defense: on POSIX filesystems dev+ino uniquely identifies a file;
  //   two distinct paths sharing dev+ino means they alias the same bytes (e.g., hard link).
  //   On Windows node's lstat may not populate dev/ino uniquely (both can be 0 or share
  //   values across different files on the same volume), so we can't reliably detect
  //   aliases via inode. The path-level check above (different absolute paths, both
  //   regular non-symlink files, sidecar filename ends `.publish.json` distinct from `.md`)
  //   is the primary anti-alias gate. Inode check only fires when we can distinguish.
  if (process.platform !== 'win32'
      && sourceLst.dev === sidecarLst.dev
      && sourceLst.ino === sidecarLst.ino
      && sourceLst.ino !== 0) {
    refuse('source-sidecar-same-inode');
    return report;
  }

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
  //   accidentally append a second withdrawn lifecycle event or re-hash. Fingerprints
  //   would already fail preflight (expectedCurrentStatus === 'published') — this is
  //   defense-in-depth in case preflight is later relaxed.
  if (priorSidecar
      && priorSidecar.blogger
      && priorSidecar.blogger.status === WITHDRAWN_STATUS) {
    refuse('sidecar-already-withdrawn');
    return report;
  }

  // ── build withdrawal transformation via authorized production helper ──
  //   Reuses rehearsal's buildWithdrawnSidecar (single mutation authority). No second
  //   transformation lives in this module.
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

  // Additional invariants (§14 requires these hard checks even if collect passes):
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
      // O_EXCL semantics via 'wx' flag: fails with EEXIST if candidate already exists.
      //   Bounded retry (5) shields against collision; exhausting means fail-closed.
      tempFd = openSync(candidate, 'wx', 0o600);
      tempAbs = candidate;
      break;
    } catch {
      tempAbs = null;
      tempFd = -1;
      // continue retry loop
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
    // Verify residue gone.
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
      // §18 cleanup contract: cleanup failure must surface as blocker without masking primary.
      push('temp-cleanup-failed');
      report.ok = false;
      report.applyReady = false;
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
    // Confirm we wrote every byte before continuing.
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
  //   §12 requires we do NOT follow symlinks; a between-preflight-and-rename swap that
  //   converts the target to a symlink must be refused.
  let sidecarLst2;
  try {
    sidecarLst2 = lstatSync(absSidecar);
  } catch {
    refuse('sidecar-vanished-pre-rename');
    finalizeCleanup();
    return report;
  }
  if (sidecarLst2.isSymbolicLink() || !sidecarLst2.isFile()) {
    refuse('sidecar-not-regular-pre-rename');
    finalizeCleanup();
    return report;
  }

  // Compare-only freshness gate: sidecar bytes must still equal the buffer we hashed
  //   at preflight. This is a compare, not a transformation input; if drift is detected,
  //   we refuse without overwriting external content.
  let sidecarBufNow;
  try {
    sidecarBufNow = readFileSync(absSidecar);
  } catch {
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

  // Source freshness gate (§13): source must not have changed either — its SHA-256 is
  //   embedded in the withdrawal event, and drifting source would invalidate the payload.
  let sourceBufNow;
  try {
    sourceBufNow = readFileSync(absSource);
  } catch {
    refuse('source-vanished-pre-rename');
    finalizeCleanup();
    return report;
  }
  if (sha256HexOfBuffer(sourceBufNow) !== sourceSha256 || !sourceBufNow.equals(sourceBuf)) {
    refuse('source-freshness-drift');
    finalizeCleanup();
    return report;
  }

  // Guard-only hook: before rename primitive.
  if (hooks && typeof hooks.beforeRename === 'function') {
    try { hooks.beforeRename({ tempPath: tempAbs, sidecarPath }); } catch { /* swallow */ }
  }

  // ── atomic rename primitive ──
  //   Node's renameSync on Windows is atomic replace (MoveFileEx with MOVEFILE_REPLACE_EXISTING
  //   semantics under the hood). We never truncate + write; we never delete-then-rename.
  try {
    renameSync(tempAbs, absSidecar);
  } catch {
    refuse('rename-failed');
    finalizeCleanup();
    return report;
  }
  // After rename, temp path no longer exists as a separate file.
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
    // Semantic verification: parse and re-collect issues from the on-disk artifact.
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

  if (!readBackOk) {
    // ── rollback ──
    //   Restore original sidecar bytes via same temp+rename primitive; do NOT truncate.
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
      report.ok = false;
      report.applyReady = false;
      finalizeCleanup();
      return report;
    }
    let rbWriteOk = false;
    try {
      const enc = sidecarBuf; // original bytes buffered before mutation
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
    try { closeSync(rbTempFd); rbTempFd = -1; } catch { /* ignore */ }
    if (!rbWriteOk) {
      push('rollback-temp-write-failed');
      // Best-effort cleanup of rollback temp, then leave production sidecar in mutated state.
      try { if (rbTempAbs && existsSync(rbTempAbs)) rmSync(rbTempAbs, { force: true }); } catch { /* ignore */ }
      report.rollbackSucceeded = false;
      report.rollbackVerified = false;
      report.ok = false;
      report.applyReady = false;
      // productionMutationPerformed stays true — mutation state is compromised.
      finalizeCleanup();
      return report;
    }
    try {
      renameSync(rbTempAbs, absSidecar);
      rbTempAbs = null;
    } catch {
      push('rollback-rename-failed');
      try { if (rbTempAbs && existsSync(rbTempAbs)) rmSync(rbTempAbs, { force: true }); } catch { /* ignore */ }
      report.rollbackSucceeded = false;
      report.rollbackVerified = false;
      report.ok = false;
      report.applyReady = false;
      finalizeCleanup();
      return report;
    }
    // Verify rollback: sidecar bytes byte-identical to original.
    try {
      const verifyBuf = readFileSync(absSidecar);
      if (verifyBuf.equals(sidecarBuf) && sha256HexOfBuffer(verifyBuf) === sidecarSha256Before) {
        report.rollbackSucceeded = true;
        report.rollbackVerified = true;
        // Successful rollback: production mutation semantically reverted.
        report.productionMutationPerformed = false;
        report.sidecarSha256After = sidecarSha256Before;
      } else {
        push('rollback-verification-failed');
        report.rollbackSucceeded = false;
        report.rollbackVerified = false;
      }
    } catch {
      push('rollback-verification-failed');
      report.rollbackSucceeded = false;
      report.rollbackVerified = false;
    }
    push('readback-mismatch');
    report.ok = false;
    report.applyReady = false;
    finalizeCleanup();
    return report;
  }

  // ── success path ──
  report.ok = true;
  report.applyReady = true;
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
