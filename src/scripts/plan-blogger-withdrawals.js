#!/usr/bin/env node
// Phase 20260721-publish-target-stage Slice 4C：Blogger withdrawal read-only planner。
//
// 上位契約：
//   - docs/20260721-blogger-withdrawal-planner.md（本 Slice 契約）
//   - docs/20260720-publish-target-stage-contract.md（stage 三者正交；missing→production；invalid fail-closed）
//   - docs/publish-json-schema.md §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
//
// 目的：
//   對現行 Blogger posts 產出「哪些 preview-stage + active-published sidecar 之文章，未來若要
//   investigate withdrawal，仍需 operator 驗證遠端 Blogger 真值」之 deterministic dry-run plan。
//
// 本 planner 是（且**只**是）：
//   - read-only：只讀 markdown / sidecar bytes 與 crypto hash；**不**寫、rename、rm、mkdir 任何檔。
//   - deterministic：candidates / blockers 依 sourcePath bytewise 升冪；field ordering 固定；
//     輸出**不含** generatedAt / current time / absolute path / hostname / pid / temp dir。
//   - fail-closed：invalid stage / malformed sidecar 一律成為 blocker（exit 1），不 fallback、不靜默。
//   - no-network / no-API：**不**呼叫 Blogger / Google / HTTP；零網路。
//   - no-authorization：**不**建立 authorization、**不**產生 withdrawal payload、**不**判定遠端狀態。
//
// 本 planner 絕不宣稱：遠端文章已刪除 / 已轉草稿 / 仍公開 / permalink 有效 / withdrawal 已核准 /
//   candidate 已可 apply。所有 candidate 初始恆為 remoteDisposition:null / remoteVerifiedAt:null /
//   authorizationEligible:false / nextAction:"verify-remote-disposition"。
//
// 語意重用（單一事實來源；本檔**不**複製任何一份）：
//   - stage 解析：publish-stage.js  resolvePublishTargetStage
//   - active publication 判定（Slice 4A）：active-publication.js  isActivePublishedTarget / getActivePublishedUrl
//   - withdrawal sidecar schema（Slice 4B）：sidecar-withdrawal-contract.js  collectSidecarWithdrawalIssues / resolveSchemaVersion / isWithdrawnSidecar
//
// Redaction（§十一）：輸出（JSON / human / stdout / stderr / blocker / error）**絕不**含
//   publishedUrl、URL host、Blogger post ID 值、operator identity、private path、authorization note。
//   可輸出：sourcePath、sidecarPath、SHA-256、URL fingerprint、boolean、status/stage enum、error code、欄位名。
//
// 使用：
//   npm run plan:blogger-withdrawals              # human-readable
//   npm run plan:blogger-withdrawals -- --json    # deterministic JSON to stdout
//   npm run plan:blogger-withdrawals -- --help
//   node src/scripts/plan-blogger-withdrawals.js [--json | --help] [--repo-root <abs>] [--git-head <40hex>]
//     --repo-root / --git-head 為 guard-only：對隔離 synthetic fixture 測試用。

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { readFileSync, lstatSync, statSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

import { resolvePublishTargetStage } from './publish-stage.js';
import { isActivePublishedTarget, getActivePublishedUrl } from './active-publication.js';
import {
  collectSidecarWithdrawalIssues,
  resolveSchemaVersion,
  isWithdrawnSidecar,
} from './sidecar-withdrawal-contract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// ── safe error boundary（§五）─────────────────────────────────────────────────
// Planner 對外拋出的 error 必為 PlannerError：stable code + safe message；code / safeMessage
// **絕不**含動態 path、raw fs error（`ENOENT: ... <abs path>`）、URL、post id、operator identity。
// CLI 只回顯 err.safeMessage（= code），unknown / unexpected error 一律轉為 'unexpected-internal-error'。
export class PlannerError extends Error {
  constructor(code, { exitCode = 1 } = {}) {
    // super(code)：message 即 code（安全短碼）。不接受 raw fs error / dynamic path。
    super(code);
    this.name = 'PlannerError';
    this.code = code;
    this.safeMessage = code;
    this.exitCode = exitCode;
  }
}

// 讀取文字檔；任何錯誤（ENOENT / EISDIR / EACCES / …）→ null（**不**外洩 raw fs error 之 path）。
function safeReadTextSync(p) {
  try {
    return readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

// Plan-output schema version（下游 consumer 需適配時 bump）。
export const PLAN_VERSION = 1;

export const BLOGGER_POSTS_SUBDIR = 'content/blogger/posts';

// 固定 candidate 契約值（§六 / §七）。本 Slice 一律如此，不因掃描結果改變。
export const CANDIDATE_NEXT_ACTION = 'verify-remote-disposition';
export const CANDIDATE_REASON = 'stage-preview';

// 分類 slug（stable；guard 依此斷言）。no-action → 併入 noActionCount；blocked → 進 blockers[]。
export const CLASSIFICATION = Object.freeze({
  candidate: 'CANDIDATE_WITHDRAWAL_INVESTIGATION',
  noActionAlreadyWithdrawn: 'NO_ACTION_ALREADY_WITHDRAWN',
  noActionNoPublication: 'NO_ACTION_PREVIEW_NO_ACTIVE_PUBLICATION',
  noActionProduction: 'NO_ACTION_PRODUCTION_STAGE',
  noActionNoBloggerTarget: 'NO_ACTION_NO_BLOGGER_TARGET',
  blockedInvalidStage: 'BLOCKED_INVALID_STAGE',
  blockedSidecarMalformed: 'BLOCKED_SIDECAR_MALFORMED',
  blockedSidecarInvalid: 'BLOCKED_SIDECAR_INVALID',
  blockedSourceUnreadable: 'BLOCKED_SOURCE_UNREADABLE',
  blockedUnsafeSourcePath: 'BLOCKED_UNSAFE_SOURCE_PATH',
});

const BLOCKED_CLASSIFICATIONS = new Set([
  CLASSIFICATION.blockedInvalidStage,
  CLASSIFICATION.blockedSidecarMalformed,
  CLASSIFICATION.blockedSidecarInvalid,
  CLASSIFICATION.blockedSourceUnreadable,
  CLASSIFICATION.blockedUnsafeSourcePath,
]);

const USAGE = `Usage: plan-blogger-withdrawals [--json] [--help]

Read-only, deterministic, fail-closed Blogger withdrawal investigation planner.

It scans content/blogger/posts, and for every post whose Blogger publish target
resolves to stage "preview" with a valid sidecar that represents an active
publication (status "published" + non-empty publishedUrl), it emits a stable
withdrawal-investigation candidate. Every candidate REQUIRES a later operator
remote-disposition verification before anything downstream may act.

This command NEVER:
  - writes, renames, or deletes any file (no sidecar / markdown / authorization write)
  - calls Blogger / Google / any HTTP API (zero network)
  - claims the remote post is deleted / drafted / still public / permalink valid
  - records remoteDisposition / remoteVerifiedAt
  - authorizes or applies a withdrawal
  - emits publishedUrl / URL host / Blogger post id value / operator identity / private path

Options:
  --json                 Emit a deterministic JSON plan to stdout instead of text.
  --repo-root <abs>      (Guard use only.) Absolute alternate repo root for isolated
                         fixtures. Defaults to the current repo root.
  --git-head <40hex>     (Guard use only.) Inject the plan gitHead (40-char lowercase
                         hex) instead of resolving it from <repo-root>/.git.
  --help / -h            Print this usage.

Exit codes:
  0   scan completed, no blockers (candidates may still await remote verification)
  1   one or more blockers (invalid stage / malformed / invalid sidecar)
  2   unknown / unsupported CLI argument
`;

// ── argv parsing ─────────────────────────────────────────────────────────────
// unknown / unsupported argument → opts.unknown（CLI 以 exit 2 回應）。任何 write / apply /
// output flag 皆不在白名單內，故落入 unknown → exit 2（planner 永無 write path）。
export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { help: false, json: false, repoRoot: null, gitHead: null, unknown: [] };
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
    if (a === '--repo-root') {
      opts.repoRoot = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--repo-root=')) {
      opts.repoRoot = a.slice('--repo-root='.length);
      continue;
    }
    if (a === '--git-head') {
      opts.gitHead = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--git-head=')) {
      opts.gitHead = a.slice('--git-head='.length);
      continue;
    }
    opts.unknown.push(a);
  }
  return opts;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function isLowercaseHex40(v) {
  return typeof v === 'string' && /^[0-9a-f]{40}$/.test(v);
}

function toRelPosix(file, repoRoot) {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}

function sha256HexOfBuffer(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function sha256HexOfString(text) {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

function getBloggerBlock(sidecar) {
  if (!sidecar || typeof sidecar !== 'object' || Array.isArray(sidecar)) return null;
  const b = sidecar.blogger;
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  return b;
}

// gitHead 解析（純 fs 讀 .git；不啟動子行程、不連網）。支援：
//   - primary worktree（`.git` 目錄）loose ref / packed-refs / detached HEAD
//   - linked worktree（`.git` 為 `gitdir: <path>` 指標檔）：branch ref 可能位於 common git dir
//     （`commondir`），packed-refs 亦可能只在 common dir。
// 任何無法解析之情況 → throw PlannerError（safe code；CLI 以 exit 1 回報，**不**回顯檔案內容 /
// 動態 path / raw fs error）。fail-closed：只產生 `unresolvable-git-head:<reason>` 安全短碼。
export function resolveGitHead(repoRoot) {
  const dotGit = path.join(repoRoot, '.git');
  let dgStat;
  try {
    dgStat = lstatSync(dotGit);
  } catch {
    throw new PlannerError('unresolvable-git-head:missing-dot-git');
  }

  // worktreeGitDir：`.git` 目錄 → 自身；`.git` 指標檔 → 解析 gitdir 指向之目錄。
  let worktreeGitDir;
  if (dgStat.isDirectory()) {
    worktreeGitDir = dotGit;
  } else if (dgStat.isFile()) {
    worktreeGitDir = resolveGitdirPointer(safeReadTextSync(dotGit), repoRoot);
  } else {
    throw new PlannerError('unresolvable-git-head:missing-dot-git');
  }

  // commonGitDir：linked worktree 之 branch ref / packed-refs 常只在 common dir。
  const commonGitDir = resolveCommonGitDir(worktreeGitDir);
  const refBases = worktreeGitDir === commonGitDir ? [worktreeGitDir] : [worktreeGitDir, commonGitDir];

  // HEAD
  const rawHead = safeReadTextSync(path.join(worktreeGitDir, 'HEAD'));
  if (rawHead == null) throw new PlannerError('unresolvable-git-head:invalid-head');
  const head = rawHead.trim();
  if (!head.startsWith('ref:')) {
    // detached HEAD：只接受 40-char lowercase hex；short / uppercase / whitespace / 其他文字 → invalid。
    if (isLowercaseHex40(head)) return head;
    throw new PlannerError('unresolvable-git-head:invalid-head');
  }
  const ref = head.slice(4).trim();
  if (!isValidRefName(ref)) throw new PlannerError('unresolvable-git-head:invalid-head');

  // loose ref：worktree git dir 優先，再 common git dir。
  for (const base of refBases) {
    const raw = safeReadTextSync(path.join(base, ...ref.split('/')));
    if (raw == null) continue;
    const sha = raw.trim();
    if (isLowercaseHex40(sha)) return sha;
    throw new PlannerError('unresolvable-git-head:invalid-ref');
  }

  // packed-refs：worktree git dir 優先，再 common git dir。
  for (const base of refBases) {
    const packed = safeReadTextSync(path.join(base, 'packed-refs'));
    if (packed == null) continue;
    const found = findPackedRef(packed, ref);
    if (found && found.invalid) throw new PlannerError('unresolvable-git-head:invalid-packed-refs');
    if (found && isLowercaseHex40(found.sha)) return found.sha;
  }

  throw new PlannerError('unresolvable-git-head:missing-ref');
}

// `.git` 指標檔內容必須嚴格為單一有效 `gitdir: <path>` 行。支援 absolute / relative-to-repoRoot；
// normalize 後必須指向一個存在之目錄。任何偏差 → invalid-gitdir-pointer / missing-gitdir（安全短碼）。
function resolveGitdirPointer(pointer, repoRoot) {
  if (pointer == null) throw new PlannerError('unresolvable-git-head:invalid-gitdir-pointer');
  const lines = pointer.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  if (lines.length !== 1) throw new PlannerError('unresolvable-git-head:invalid-gitdir-pointer');
  const m = /^gitdir:\s*(.+)$/.exec(lines[0]);
  if (!m) throw new PlannerError('unresolvable-git-head:invalid-gitdir-pointer');
  const target = m[1].trim();
  if (target === '') throw new PlannerError('unresolvable-git-head:invalid-gitdir-pointer');
  const abs = path.normalize(path.isAbsolute(target) ? target : path.resolve(repoRoot, target));
  let tStat;
  try {
    tStat = statSync(abs); // 跟隨至實際目標；目標須存在且為目錄。
  } catch {
    throw new PlannerError('unresolvable-git-head:missing-gitdir');
  }
  if (!tStat.isDirectory()) throw new PlannerError('unresolvable-git-head:missing-gitdir');
  return abs;
}

// commondir 檔（若存在）指向 common git directory；relative 以 worktree git dir 為基準。
// 缺 commondir → common == worktree（primary worktree）。
function resolveCommonGitDir(worktreeGitDir) {
  const raw = safeReadTextSync(path.join(worktreeGitDir, 'commondir'));
  if (raw == null) return worktreeGitDir;
  const val = raw.trim();
  if (val === '') return worktreeGitDir;
  return path.normalize(path.isAbsolute(val) ? val : path.resolve(worktreeGitDir, val));
}

// ref 名稱基本健全性（防止 path traversal / 空白 / 控制字元注入 ref 查找）。
function isValidRefName(ref) {
  return (
    typeof ref === 'string' &&
    ref.startsWith('refs/') &&
    !ref.includes('..') &&
    !/[\s\0]/.test(ref) &&
    /^[A-Za-z0-9._/-]+$/.test(ref)
  );
}

// 於 packed-refs 內查 ref。回傳 { sha } / { invalid:true }（找到但 SHA 非 40-hex）/ null（未找到）。
function findPackedRef(packed, ref) {
  for (const raw of packed.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#') || line.startsWith('^')) continue;
    const sp = line.indexOf(' ');
    if (sp < 0) continue;
    const sha = line.slice(0, sp).trim();
    const r = line.slice(sp + 1).trim();
    if (r === ref) {
      return isLowercaseHex40(sha) ? { sha } : { invalid: true };
    }
  }
  return null;
}

// ── symlink / junction containment（§六）──────────────────────────────────────
// segment-safe：以 path segment 判斷 canonicalTarget 是否位於 canonicalRoot 內，**不**用字串 prefix
// （避免 `.../posts-evil/` 被誤判為 `.../posts/` 內）。root 自身視為 inside。
export function isInsideCanonicalRoot(canonicalRoot, canonicalTarget) {
  const rel = path.relative(canonicalRoot, canonicalTarget);
  if (rel === '') return true;
  if (rel === '..' || rel.startsWith(`..${path.sep}`)) return false;
  return !path.isAbsolute(rel);
}

// 判斷 file 是否為「位於 canonicalScanRoot 內之一般檔案」。回傳安全 reason slug（不安全）或 null（安全）。
//   kind ∈ { 'source', 'sidecar' }。回傳值只含 kind + 固定短碼，**不**含 realpath / absolute path。
function unsafeRegularFileReason(file, canonicalScanRoot, kind) {
  let lst;
  try {
    lst = lstatSync(file);
  } catch {
    return `${kind}-lstat-error`;
  }
  if (lst.isSymbolicLink()) return `unsafe-${kind}-symlink`;
  if (!lst.isFile()) return `unsafe-${kind}-not-regular-file`;
  let real;
  try {
    real = realpathSync(file);
  } catch {
    return `unsafe-${kind}-unresolvable`;
  }
  if (canonicalScanRoot == null || !isInsideCanonicalRoot(canonicalScanRoot, real)) {
    return `unsafe-${kind}-outside-root`;
  }
  return null;
}

// ── per-post classification ───────────────────────────────────────────────────
// 回傳單一 record：{ kind, classification, sourcePath, sidecarPath, ... }。
//   kind ∈ { 'candidate', 'no-action', 'blocked' }。
// 純粹依 frontmatter（stage）+ sidecar（status / publishedUrl / schema）分類；不看 frontmatter
// 之 draft / status（withdrawal candidacy 只由 sidecar 之 active publication 真值決定）。
async function classifyPost({ file, repoRoot, canonicalScanRoot }) {
  const sourcePath = toRelPosix(file, repoRoot);
  const dir = path.dirname(file);
  const stem = path.basename(file, path.extname(file));
  const sidecarFile = path.join(dir, `${stem}.publish.json`);
  const sidecarPath = toRelPosix(sidecarFile, repoRoot);

  // §六：source 必為位於 canonical scan root 內之一般檔（拒 symlink / junction escape / outside realpath）。
  // blocker 只輸出 logical sourcePath + 安全短碼，**不**讀取內容、**不**輸出 realpath / outside path。
  const srcUnsafe = unsafeRegularFileReason(file, canonicalScanRoot, 'source');
  if (srcUnsafe) {
    return blocked(CLASSIFICATION.blockedUnsafeSourcePath, sourcePath, null, [srcUnsafe]);
  }

  // §6.4：sidecar 即使 markdown 合法亦須獨立檢查。symlink sidecar 一律拒讀（blocker）；regular-file
  // sidecar 其 realpath 若逸出 scan root 亦拒讀。directory / 其他非檔 → 交由既有讀取路徑（sidecar-read-error）。
  try {
    const sLst = lstatSync(sidecarFile);
    if (sLst.isSymbolicLink()) {
      return blocked(CLASSIFICATION.blockedUnsafeSourcePath, sourcePath, sidecarPath, ['unsafe-sidecar-symlink']);
    }
    if (sLst.isFile()) {
      let sReal;
      try {
        sReal = realpathSync(sidecarFile);
      } catch {
        sReal = null;
      }
      if (sReal == null || !isInsideCanonicalRoot(canonicalScanRoot, sReal)) {
        return blocked(CLASSIFICATION.blockedUnsafeSourcePath, sourcePath, sidecarPath, ['unsafe-sidecar-outside-root']);
      }
    }
  } catch {
    // lstat 失敗（ENOENT）→ sidecar 不存在；交由下方既有 no-sidecar 路徑處理。
  }

  // markdown / frontmatter（fail-closed；不回顯 raw 內容）。
  let rawMd;
  let fm;
  try {
    rawMd = await fs.readFile(file);
  } catch {
    return blocked(CLASSIFICATION.blockedSourceUnreadable, sourcePath, null, ['markdown-read-error']);
  }
  try {
    fm = matter(rawMd.toString('utf-8')).data || {};
  } catch {
    return blocked(CLASSIFICATION.blockedSourceUnreadable, sourcePath, null, ['frontmatter-parse-error']);
  }

  const blogger = fm.publishTargets && typeof fm.publishTargets === 'object'
    ? fm.publishTargets.blogger
    : undefined;
  const bloggerEnabled = !!(blogger && typeof blogger === 'object' && blogger.enabled === true);
  if (!bloggerEnabled) {
    return noAction(CLASSIFICATION.noActionNoBloggerTarget, sourcePath, sidecarPath);
  }

  // stage 解析（missing→production；invalid→ok:false）。§9.5 invalid → blocker；§9.4 production → no-action。
  const stage = resolvePublishTargetStage(fm.publishTargets, 'blogger');
  if (!stage.ok) {
    // reason 為安全短碼（unknown-value / invalid-type / unknown-platform）；不回顯 raw stage 值。
    return blocked(CLASSIFICATION.blockedInvalidStage, sourcePath, sidecarPath, [stage.reason || 'invalid']);
  }
  if (stage.stage !== 'preview') {
    return noAction(CLASSIFICATION.noActionProduction, sourcePath, sidecarPath, { resolvedStage: stage.stage });
  }

  // preview-stage：讀 sidecar。缺 sidecar → §9.3 no active publication truth → no-action。
  let sidecarBuf;
  try {
    sidecarBuf = await fs.readFile(sidecarFile);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return noAction(CLASSIFICATION.noActionNoPublication, sourcePath, sidecarPath, {
        resolvedStage: 'preview',
        reason: 'no-sidecar',
      });
    }
    return blocked(CLASSIFICATION.blockedSidecarMalformed, sourcePath, sidecarPath, ['sidecar-read-error']);
  }

  // parse（§9.6：parse error → blocker；**不**回顯 err.message / 檔案內容）。
  let sidecar;
  try {
    sidecar = JSON.parse(sidecarBuf.toString('utf-8'));
  } catch {
    return blocked(CLASSIFICATION.blockedSidecarMalformed, sourcePath, sidecarPath, ['parse-error']);
  }

  // schema 契約（Slice 4B）。任何 issue → blocker（§9.6）。details = unique sorted issue types（安全 slug）。
  const issues = collectSidecarWithdrawalIssues(sidecar, { sourcePath, sidecarPath });
  if (issues.length > 0) {
    const types = [...new Set(issues.map((i) => i.type))].sort(cmpString);
    return blocked(CLASSIFICATION.blockedSidecarInvalid, sourcePath, sidecarPath, types);
  }

  const bloggerBlock = getBloggerBlock(sidecar);
  const status = bloggerBlock ? bloggerBlock.status : undefined;

  // §9.2 already withdrawn → no-action（不得再成 candidate）。
  if (isWithdrawnSidecar(sidecar)) {
    return noAction(CLASSIFICATION.noActionAlreadyWithdrawn, sourcePath, sidecarPath, {
      resolvedStage: 'preview',
      sidecarStatus: status,
    });
  }

  // §五：active publication 真值（Slice 4A predicate）。非 active → §9.3 no-action。
  if (!isActivePublishedTarget(bloggerBlock)) {
    return noAction(CLASSIFICATION.noActionNoPublication, sourcePath, sidecarPath, {
      resolvedStage: 'preview',
      reason: 'no-active-publication',
    });
  }

  // ── CANDIDATE ────────────────────────────────────────────────────────────────
  const sv = resolveSchemaVersion(sidecar); // sidecar 已通過 collect*；sv.ok 必為 true。
  const activeUrl = getActivePublishedUrl(bloggerBlock); // 非空字串；**只**用於算 fingerprint。
  return {
    kind: 'candidate',
    classification: CLASSIFICATION.candidate,
    candidate: {
      sourcePath,
      sidecarPath,
      sourceSha256: sha256HexOfBuffer(rawMd),
      sidecarSha256: sha256HexOfBuffer(sidecarBuf),
      publishedUrlFingerprint: sha256HexOfString(activeUrl),
      resolvedStage: 'preview',
      sidecarStatus: status,
      resolvedSchemaVersion: sv.version,
      reason: CANDIDATE_REASON,
      hasPublishedUrl: true,
      hasBloggerPostId: isNonEmptyString(bloggerBlock.bloggerPostId),
      remoteDisposition: null,
      remoteVerifiedAt: null,
      authorizationEligible: false,
      nextAction: CANDIDATE_NEXT_ACTION,
    },
  };
}

function noAction(classification, sourcePath, sidecarPath) {
  return { kind: 'no-action', classification, sourcePath, sidecarPath };
}

function blocked(classification, sourcePath, sidecarPath, details) {
  return {
    kind: 'blocked',
    classification,
    blocker: {
      sourcePath,
      sidecarPath: sidecarPath ?? null,
      classification,
      details: [...details].sort(cmpString),
    },
  };
}

function cmpString(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

// ── main planner API（pure；used by guard + CLI）─────────────────────────────
// gitHead：若未提供，從 repoRoot/.git 解析。必為 40-char lowercase hex。
export async function planBloggerWithdrawals({ repoRoot, gitHead } = {}) {
  const root = repoRoot || PROJECT_ROOT;
  const resolvedGitHead = gitHead != null ? gitHead : resolveGitHead(root);
  if (!isLowercaseHex40(resolvedGitHead)) {
    throw new PlannerError('invalid-git-head');
  }

  // canonical scan root（realpath）：symlink / junction containment 之基準。scan root 不存在 → 空掃描。
  const scanRoot = path.join(root, ...BLOGGER_POSTS_SUBDIR.split('/'));
  let canonicalScanRoot;
  try {
    canonicalScanRoot = realpathSync(scanRoot);
  } catch {
    canonicalScanRoot = null;
  }

  // followSymbolicLinks:false → fast-glob 不走進 symlink / junction 目錄（其下檔案永不被讀取）。
  // onlyFiles:false → symlink 檔項與非一般檔仍會被列出（**不**被 fast-glob 靜默丟棄），交由
  // classifyPost / unsafeRegularFileReason 以 lstat + realpath containment 分類為 blocker——
  // 「不靜默忽略潛在 Blogger 文章、讓 operator 看得到不安全 entry」（§6.3）。
  const files = canonicalScanRoot == null
    ? []
    : await fg('**/*.md', { cwd: scanRoot, absolute: true, followSymbolicLinks: false, onlyFiles: false });
  const postFiles = files.filter((f) => !f.endsWith('.fb.md')).sort(cmpString);

  const candidates = [];
  const blockers = [];
  let scannedPostCount = 0;
  let previewTargetCount = 0;
  let noActionCount = 0;

  for (const file of postFiles) {
    scannedPostCount += 1;
    const record = await classifyPost({ file, repoRoot: root, canonicalScanRoot });
    // preview-target tally：任何 resolved preview stage 之 record（candidate / preview no-action /
    // preview-sidecar blocker）都算 preview target；invalid-stage / production / no-blogger-target 不算。
    if (isPreviewTargetRecord(record)) previewTargetCount += 1;

    if (record.kind === 'candidate') {
      candidates.push(record.candidate);
    } else if (record.kind === 'blocked') {
      blockers.push(record.blocker);
    } else {
      noActionCount += 1;
    }
  }

  candidates.sort((a, b) => cmpString(a.sourcePath, b.sourcePath));
  blockers.sort((a, b) => cmpString(a.sourcePath, b.sourcePath));

  const needsRemoteVerificationCount = candidates.filter(
    (c) => c.nextAction === CANDIDATE_NEXT_ACTION,
  ).length;
  const authorizationEligibleCount = candidates.filter((c) => c.authorizationEligible === true).length;

  return {
    planVersion: PLAN_VERSION,
    gitHead: resolvedGitHead,
    mutationPerformed: false,
    summary: {
      scannedPostCount,
      previewTargetCount,
      candidateCount: candidates.length,
      needsRemoteVerificationCount,
      authorizationEligibleCount,
      blockedCount: blockers.length,
      noActionCount,
    },
    candidates,
    blockers,
  };
}

// preview target = record 之 resolved Blogger stage 為 'preview'。candidate 與 preview no-action /
// preview-sidecar blocker 皆屬之；production / invalid-stage / no-blogger-target 不屬之。
function isPreviewTargetRecord(record) {
  if (record.kind === 'candidate') return true;
  if (record.kind === 'no-action') {
    return (
      record.classification === CLASSIFICATION.noActionNoPublication ||
      record.classification === CLASSIFICATION.noActionAlreadyWithdrawn
    );
  }
  if (record.kind === 'blocked') {
    return (
      record.classification === CLASSIFICATION.blockedSidecarMalformed ||
      record.classification === CLASSIFICATION.blockedSidecarInvalid
    );
  }
  return false;
}

// ── formatting ──────────────────────────────────────────────────────────────

// Deterministic JSON：field ordering 由 object 字面序固定；arrays 已 pre-sorted。
// 只含 candidates / blockers 與 summary counts；no-action records **不**逐筆列出（避免無謂輸出，
// 只計數）。輸出**不含** publishedUrl / URL host / Blogger post id / publishedAt / operator / path。
export function formatJson(plan) {
  return JSON.stringify(plan, null, 2) + '\n';
}

export function formatHumanReadable(plan) {
  const s = plan.summary;
  const lines = [];
  lines.push('plan-blogger-withdrawals (read-only; no mutation performed)');
  lines.push('');
  lines.push(`gitHead:                          ${plan.gitHead}`);
  lines.push(`scanned post count:               ${s.scannedPostCount}`);
  lines.push(`preview target count:             ${s.previewTargetCount}`);
  lines.push(`candidate count:                  ${s.candidateCount}`);
  lines.push(`needs remote verification count:  ${s.needsRemoteVerificationCount}`);
  lines.push(`authorization eligible count:     ${s.authorizationEligibleCount}`);
  lines.push(`blocked count:                    ${s.blockedCount}`);
  lines.push(`no-action count:                  ${s.noActionCount}`);
  lines.push('mutationPerformed:                false');
  lines.push('');

  if (plan.candidates.length === 0) {
    lines.push('(no withdrawal-investigation candidates matched)');
  } else {
    lines.push('---- candidates (each requires operator remote-disposition verification) ----');
    let n = 0;
    for (const c of plan.candidates) {
      n += 1;
      lines.push(`  ${n}. ${c.sourcePath}`);
      lines.push(`     sidecar:            ${c.sidecarPath}`);
      lines.push(`     stage:              ${c.resolvedStage}`);
      lines.push(`     sidecar status:     ${c.sidecarStatus}`);
      lines.push(`     source sha256:      ${c.sourceSha256.slice(0, 12)}…`);
      lines.push(`     sidecar sha256:     ${c.sidecarSha256.slice(0, 12)}…`);
      lines.push(`     has published url:  ${c.hasPublishedUrl}`);
      lines.push(`     has blogger postid: ${c.hasBloggerPostId}`);
      lines.push(`     next action:        ${c.nextAction}`);
      lines.push('');
    }
  }

  if (plan.blockers.length > 0) {
    lines.push('---- blockers ----');
    for (const b of plan.blockers) {
      lines.push(`  - ${b.sourcePath}  [${b.classification}]`);
      lines.push(`      details: ${b.details.join(', ')}`);
    }
    lines.push('');
  }

  lines.push('This planner never verifies remote Blogger state, authorizes, or withdraws.');
  lines.push('Every candidate remains an investigation lead pending operator remote verification.');
  return lines.join('\n') + '\n';
}

// ── exit-code policy（§9.7）───────────────────────────────────────────────────
export function exitCodeForPlan(plan) {
  return plan.summary.blockedCount > 0 ? 1 : 0;
}

// ── CLI entry ───────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[plan-blogger-withdrawals] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 2;
  }

  let repoRoot = PROJECT_ROOT;
  if (opts.repoRoot != null) {
    if (!path.isAbsolute(opts.repoRoot)) {
      process.stderr.write(
        `[plan-blogger-withdrawals] ERROR: --repo-root must be an absolute path\n`,
      );
      return 2;
    }
    repoRoot = opts.repoRoot;
  }

  if (opts.gitHead != null && !isLowercaseHex40(opts.gitHead)) {
    process.stderr.write(
      '[plan-blogger-withdrawals] ERROR: --git-head must be 40-char lowercase hex\n',
    );
    return 2;
  }

  const plan = await planBloggerWithdrawals({ repoRoot, gitHead: opts.gitHead ?? undefined });

  if (opts.json) {
    process.stdout.write(formatJson(plan));
  } else {
    process.stdout.write(formatHumanReadable(plan));
  }

  return exitCodeForPlan(plan);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main()
    .then((code) => process.exit(typeof code === 'number' ? code : 0))
    .catch((err) => {
      // 安全錯誤邊界（§五）：PlannerError → 回顯其 safeMessage（stable code）+ 專屬 exit code；
      // 其他任何 unknown / unexpected error → 一律 'unexpected-internal-error'。**絕不**回顯 raw
      // err.message / stack / absolute path / secret。
      const code = err instanceof PlannerError ? err.safeMessage : 'unexpected-internal-error';
      const exit = err instanceof PlannerError && typeof err.exitCode === 'number' ? err.exitCode : 1;
      process.stderr.write(`[plan-blogger-withdrawals] ERROR: ${code}\n`);
      process.exit(exit);
    });
}
