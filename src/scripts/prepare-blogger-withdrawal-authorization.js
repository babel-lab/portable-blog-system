#!/usr/bin/env node
// Phase 20260722-publish-target-stage Slice 4D：Blogger withdrawal authorization — read-only draft generator.
//
// 目的：
//   給定一個現行 withdrawal-investigation candidate（`--source-path`）以及 operator 明確提供的
//   remote disposition / remote-verified time / reason / (reasonDetail)，把「未來若要撤回此文章」
//   之意圖，輸出為一份 **UNAPPROVED** authorization JSON *draft* 到 **stdout**。draft 綁定當前 source
//   repo HEAD、withdrawal plan fingerprint、per-record fingerprint、target source/sidecar SHA-256、
//   published URL fingerprint 與現行 status。`approval.explicitlyAuthorized` 硬編碼為 boolean false。
//
// 本工具**只**輸出 stdout、**永不**寫檔、**永不** apply、**永不**修改 repository、**永不**驗證遠端
//   Blogger 真值、**永不**自動批准。remote disposition 是 operator-provided fact；operator 必須把
//   stdout 存到 **repo 外**（或 .gitignore 路徑），親自 review 後、才可將 explicitlyAuthorized
//   改為 true，再交給 read-only preflight validator。
//
// Pipeline position（見 docs/20260722-blogger-withdrawal-authorization-preparation.md）：
//   plan:blogger-withdrawals                                  (Slice 4C；read-only planner)
//     → operator 親自驗證遠端 Blogger disposition             (人工；本工具不做)
//     → **this slice** prepare:blogger-withdrawal-authorization  (unapproved draft；本檔)
//     → operator 於 repo 外 review + 手動 flip explicitlyAuthorized
//     → validate:blogger-withdrawal-authorization             (read-only preflight)
//     → (future) rehearsal / production apply / commit / push  (皆尚未存在；各須獨立授權)
//
// 安全契約（fail-closed；hard-coded）：
//   - Read-only：無 fs.writeFile / mkdir / rm / rename / unlink / copyFile / appendFile / link；
//     無 child_process / spawn / exec；無 fetch / http(s)；無 Blogger / Google API。
//     （repo-state gate 透過 admin-git-safety-preflight.js 之 vetted read-only git runner，
//     本檔不直接呼叫 child_process。）
//   - `--source-path` / `--remote-disposition` / `--remote-verified-at` / `--reason` 必填。
//   - `approval.explicitlyAuthorized` 由 buildDraft 硬編碼 false；本檔無任何路徑設它為 true。
//   - 不接受 output path（不寫檔）；不接受 approval / bypass / mutation / repo-root flag。
//   - 不使用目前時間；不產生 generatedAt；輸出無 absolute path；輸出無 raw publishedUrl /
//     publishedAt / bloggerPostId（只含 fingerprint / hash / status enum）。
//   - 成功時 stdout 只有 draft JSON（可直接 JSON.parse）；stderr 為空。
//   - 若 source-path 非現行 candidate，或 operator 未提供有效 remote disposition → fail-closed，
//     不生成半成品 draft。
//
// Exit codes：
//   0  draft emitted。
//   1  semantic refusal（invalid value / repo-state gate / source-path 非 candidate / planner blocker）。
//   2  CLI misuse（unknown / forbidden flag / missing required flag）。

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluatePreflight } from './admin-git-safety-preflight.js';
import { planBloggerWithdrawals } from './plan-blogger-withdrawals.js';
import {
  REMOTE_DISPOSITIONS,
  LIFECYCLE_REASONS,
} from './sidecar-withdrawal-contract.js';
import {
  classifyBloggerSourcePath,
  isLandedStrictTzIso,
  computePlanFingerprint,
  computeRecordFingerprint,
  buildDraft,
  serializeDraft,
  EXPECTED_CURRENT_STATUS,
} from './blogger-withdrawal-authorization.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// 任何出現即 fail-closed（exit 2）。approval / output / bypass / mutation / repo-root flags。
const FORBIDDEN_FLAGS = new Set([
  '--apply', '--write', '--force', '--yes', '-y', '--approve', '--auto-approve',
  '--skip-validation', '--skip-fingerprint', '--ignore-head', '--dirty-ok', '--no-verify',
  '--production', '--publish', '--deploy', '--commit', '--push', '--restore', '--republish',
  '--api', '--repo-root', '--project-root', '--test-root', '--output', '--out', '--save',
]);

const REMOTE_DISPOSITION_LIST = [...REMOTE_DISPOSITIONS].sort().join(', ');
const REASON_LIST = [...LIFECYCLE_REASONS].sort().join(', ');

const USAGE = `Usage: prepare-blogger-withdrawal-authorization \\
  --source-path <content/blogger/posts/<slug>.md> \\
  --remote-disposition <landed-enum> \\
  --remote-verified-at <timezone-aware-ISO> \\
  --reason <landed-reason-enum> \\
  [--reason-detail <text>] \\
  [--help]

Read-only, stdout-only Blogger withdrawal authorization draft generator. Emits an
UNAPPROVED authorization JSON to stdout that binds the current source repo HEAD, the
withdrawal plan / per-record fingerprint, the exact target source + sidecar path and
their SHA-256, the published-URL fingerprint, and the current sidecar status for a
single withdrawal-investigation candidate.

Every draft has:
  "approval": { "explicitlyAuthorized": false }

There is NO in-band code path that sets explicitlyAuthorized to true. This tool NEVER
verifies remote Blogger state, NEVER approves, NEVER writes a file, and NEVER applies.
An operator must save the stdout OUTSIDE the source repo (or in a .gitignore path),
review it, then flip explicitlyAuthorized to true if and only if it matches intent.

Required:
  --source-path <path>        Repo-relative POSIX-style Blogger post Markdown under
                              content/blogger/posts/ that is a current withdrawal candidate.
  --remote-disposition <v>    Operator-verified remote disposition. One of:
                              ${REMOTE_DISPOSITION_LIST}
  --remote-verified-at <iso>  Timezone-aware ISO-8601 instant of the operator's remote check.
  --reason <r>                Landed reason enum. One of:
                              ${REASON_LIST}

Optional:
  --reason-detail <text>      Free-form detail string (default empty).
  --help / -h                 Print this usage.

Forbidden flags (any occurrence → exit 2):
  --apply, --write, --force, --yes, -y, --approve, --auto-approve, --skip-validation,
  --skip-fingerprint, --ignore-head, --dirty-ok, --no-verify, --production, --publish,
  --deploy, --commit, --push, --restore, --republish, --api, --repo-root, --project-root,
  --test-root, --output, --out, --save

Repository state gate (fail-closed): branch == main, HEAD == origin/main, ahead/behind
== 0/0, working tree clean, .git/index.lock absent.

Determinism: same repo state + same inputs → byte-identical stdout. No timestamp key,
no generatedAt, no absolute path, no raw publishedUrl / publishedAt / bloggerPostId.

Exit codes: 0 draft emitted · 1 semantic refusal · 2 CLI misuse.
`;

// ── argv parsing ─────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    sourcePath: null,
    remoteDisposition: null,
    remoteVerifiedAt: null,
    reason: null,
    reasonDetail: null,
    forbidden: [],
    unknown: [],
  };
  const take = (a, i) => (a.includes('=') ? a.slice(a.indexOf('=') + 1) : args[i + 1]);
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    const bare = a.includes('=') ? a.slice(0, a.indexOf('=')) : a;
    if (a === '--help' || a === '-h') { opts.help = true; continue; }
    if (bare === '--source-path') { opts.sourcePath = take(a, i); if (!a.includes('=')) i += 1; continue; }
    if (bare === '--remote-disposition') { opts.remoteDisposition = take(a, i); if (!a.includes('=')) i += 1; continue; }
    if (bare === '--remote-verified-at') { opts.remoteVerifiedAt = take(a, i); if (!a.includes('=')) i += 1; continue; }
    if (bare === '--reason') { opts.reason = take(a, i); if (!a.includes('=')) i += 1; continue; }
    if (bare === '--reason-detail') { opts.reasonDetail = take(a, i); if (!a.includes('=')) i += 1; continue; }
    if (FORBIDDEN_FLAGS.has(bare)) { opts.forbidden.push(bare); continue; }
    opts.unknown.push(a);
  }
  return opts;
}

// ── draft preparation API（guard 以 synthetic OS-temp repo 驅動 projectRoot）──────────
// 回 { ok, draft?, blockers, planFingerprint?, recordFingerprint?, head?, branch? }。
// `projectRoot` 只在程式 API 暴露；CLI 硬編碼 PROJECT_ROOT、不暴露此參數。
// planBloggerWithdrawals 為 async，故本 API 為 async。
export async function prepareWithdrawalAuthorizationDraft({
  projectRoot = PROJECT_ROOT,
  sourcePath,
  remoteDisposition,
  remoteVerifiedAt,
  reason,
  reasonDetail = '',
}) {
  const blockers = [];

  // ── input validation ────────────────────────────────────────────────
  if (classifyBloggerSourcePath(sourcePath) !== null) { blockers.push('source-path-invalid'); return { ok: false, blockers }; }
  if (!REMOTE_DISPOSITIONS.has(remoteDisposition)) { blockers.push('remote-disposition-invalid'); return { ok: false, blockers }; }
  if (!isLandedStrictTzIso(remoteVerifiedAt)) { blockers.push('remote-verified-at-invalid'); return { ok: false, blockers }; }
  if (!LIFECYCLE_REASONS.has(reason)) { blockers.push('reason-invalid'); return { ok: false, blockers }; }
  if (typeof reasonDetail !== 'string') { blockers.push('reason-detail-invalid'); return { ok: false, blockers }; }

  // ── repo-state gate ─────────────────────────────────────────────────
  const preflight = evaluatePreflight({ projectRoot });
  if (!preflight.eligible) {
    for (const f of preflight.failures) blockers.push(`repo-state:${f.code}`);
    return { ok: false, blockers, branch: preflight.branch, head: preflight.head };
  }

  // ── re-run withdrawal planner ───────────────────────────────────────
  let plan;
  try {
    plan = await planBloggerWithdrawals({ repoRoot: projectRoot, gitHead: preflight.head });
  } catch {
    blockers.push('planner-error');
    return { ok: false, blockers, branch: preflight.branch, head: preflight.head };
  }
  return finishDraft(plan, {
    sourcePath, remoteDisposition, remoteVerifiedAt, reason, reasonDetail,
    head: preflight.head, branch: preflight.branch, blockers,
  });
}

function finishDraft(plan, ctx) {
  const { sourcePath, remoteDisposition, remoteVerifiedAt, reason, reasonDetail, head, branch, blockers } = ctx;

  // planner blocker 存在時，任何 candidate 之真值可能不完整 → fail-closed。
  if (plan.summary.blockedCount > 0) {
    blockers.push('planner-blocked');
    return { ok: false, blockers, branch, head };
  }

  const matches = plan.candidates.filter((c) => c.sourcePath === sourcePath);
  if (matches.length === 0) {
    blockers.push('source-path-not-a-candidate');
    return { ok: false, blockers, branch, head };
  }
  if (matches.length > 1) {
    blockers.push('candidate-not-unique');
    return { ok: false, blockers, branch, head };
  }
  const c = matches[0];

  const target = {
    sourcePath: c.sourcePath,
    sidecarPath: c.sidecarPath,
    expectedSourceSha256: c.sourceSha256,
    expectedSidecarSha256: c.sidecarSha256,
    expectedCurrentStatus: c.sidecarStatus, // active-published candidate → 'published'
    expectedPublishedUrlFingerprint: c.publishedUrlFingerprint,
  };
  if (target.expectedCurrentStatus !== EXPECTED_CURRENT_STATUS) {
    blockers.push('candidate-current-status-unexpected');
    return { ok: false, blockers, branch, head };
  }

  const withdrawal = { remoteDisposition, remoteVerifiedAt, reason, reasonDetail };

  const planFingerprint = computePlanFingerprint(plan);
  const recordFingerprint = computeRecordFingerprint({
    sourcePath: target.sourcePath,
    sidecarPath: target.sidecarPath,
    expectedCurrentStatus: target.expectedCurrentStatus,
    expectedSourceSha256: target.expectedSourceSha256,
    expectedSidecarSha256: target.expectedSidecarSha256,
    expectedPublishedUrlFingerprint: target.expectedPublishedUrlFingerprint,
    remoteDisposition,
    remoteVerifiedAt,
    reason,
    reasonDetail,
  });

  const draft = buildDraft({
    head,
    planFingerprint: planFingerprint.value,
    recordFingerprint: recordFingerprint.value,
    target,
    withdrawal,
  });

  return { ok: true, blockers, draft, planFingerprint, recordFingerprint, branch, head };
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
      `[prepare-blogger-withdrawal-authorization] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write('  This tool never approves, never writes a file, and never applies.\n');
    return 2;
  }
  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[prepare-blogger-withdrawal-authorization] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 2;
  }
  for (const [flag, val] of [
    ['--source-path', opts.sourcePath],
    ['--remote-disposition', opts.remoteDisposition],
    ['--remote-verified-at', opts.remoteVerifiedAt],
    ['--reason', opts.reason],
  ]) {
    if (val == null) {
      process.stderr.write(`[prepare-blogger-withdrawal-authorization] ERROR: ${flag} <value> is required\n`);
      process.stderr.write(USAGE);
      return 2;
    }
  }

  const result = await prepareWithdrawalAuthorizationDraft({
    projectRoot: PROJECT_ROOT,
    sourcePath: opts.sourcePath,
    remoteDisposition: opts.remoteDisposition,
    remoteVerifiedAt: opts.remoteVerifiedAt,
    reason: opts.reason,
    reasonDetail: opts.reasonDetail == null ? '' : opts.reasonDetail,
  });

  if (!result.ok) {
    process.stderr.write('[prepare-blogger-withdrawal-authorization] refused; no draft emitted\n');
    for (const b of result.blockers) process.stderr.write(`  - ${b}\n`);
    return 1;
  }

  process.stdout.write(serializeDraft(result.draft));
  return 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main()
    .then((code) => process.exit(typeof code === 'number' ? code : 0))
    .catch(() => {
      // safe error boundary：**絕不**回顯 raw err.message / stack / path / secret。
      process.stderr.write('[prepare-blogger-withdrawal-authorization] ERROR: unexpected-internal-error\n');
      process.exit(1);
    });
}
