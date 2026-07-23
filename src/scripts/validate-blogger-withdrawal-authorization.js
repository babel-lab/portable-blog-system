#!/usr/bin/env node
// Phase 20260722-publish-target-stage Slice 4D：Blogger withdrawal authorization — read-only preflight validator.
//
// 目的：
//   給定一個 operator 已 authored 的 withdrawal authorization JSON（`--authorization`，位於 repo 外）
//   與 `--source-path`，唯讀驗證：
//     1. documentValid              —— authorization 通過 strict schema（§七）。
//     2. repositoryBindingsMatched  —— repo-state eligible + HEAD/branch 綁定吻合 + 無 preview artifact。
//     3. planBindingsMatched        —— 重算 withdrawal plan fingerprint 與 authorization 吻合。
//     4. recordBindingsMatched      —— candidate 恰好一筆且 path 吻合、target source/sidecar SHA-256 /
//                                       published URL fingerprint / current status 吻合、重算 record
//                                       fingerprint 與 authorization 吻合。
//     5. explicitlyAuthorized       —— approval.explicitlyAuthorized === true。
//   applyReady === 上述五者皆真。mutationPerformed === false，invariantly。
//   **即使 applyReady:true，本工具也不執行任何 apply、不寫任何位元組。**
//
// 本工具**永不** apply / 寫檔 / 修改 repository / 驗證遠端 Blogger 真值 / 呼叫任何 API / 連網。
//
// 安全契約（fail-closed；hard-coded）：
//   - Read-only：只讀 authorization 檔（lstat 拒 symlink / 非一般檔後 readFileSync）+ 透過 planner
//     讀 source/sidecar bytes + 透過 admin-git-safety-preflight.js 之 vetted read-only git runner
//     讀 repo state。無 fs.writeFile / mkdir / rm / rename / unlink / copyFile / appendFile / link；
//     本檔無 child_process / spawn / exec / fetch / http(s) / Blogger / Google API。
//   - `--authorization` / `--source-path` 必填。
//   - Redaction：所有 blocker 為固定安全短碼；報表**不**回顯 authorization file path、authorization
//     內容、publishedUrl / URL host / post id / publishedAt / operator identity / OS temp path /
//     repository absolute path / gitdir path / stack trace / raw fs error。
//
// Exit codes：
//   0  applyReady === true。
//   1  任何 refusal（invalid document / mismatched binding / unapproved / repo-state gate /
//      planner blocker / internal safe failure）。
//   2  CLI misuse（unknown / forbidden flag / missing required flag）。
//   --help → 0（不掃描 repo）。

import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluatePreflight } from './admin-git-safety-preflight.js';
import { planBloggerWithdrawals } from './plan-blogger-withdrawals.js';
import {
  classifyBloggerSourcePath,
  parseAndValidateAuthorization,
  computePlanFingerprint,
  computeRecordFingerprint,
} from './blogger-withdrawal-authorization.js';
import {
  isWithdrawalEligibleRemoteDisposition,
  REMOTE_LIVE_BLOCKER,
} from './sidecar-withdrawal-contract.js';

function sha256HexOfString(text) {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const FORBIDDEN_FLAGS = new Set([
  '--apply', '--write', '--force', '--yes', '-y', '--approve', '--auto-approve',
  '--skip-validation', '--skip-fingerprint', '--ignore-head', '--dirty-ok', '--no-verify',
  '--production', '--publish', '--deploy', '--commit', '--push', '--restore', '--republish',
  '--api', '--repo-root', '--project-root', '--test-root', '--output', '--out', '--save',
]);

const USAGE = `Usage: validate-blogger-withdrawal-authorization \\
  --authorization <path-outside-repo> \\
  --source-path <content/blogger/posts/<slug>.md> \\
  [--json] [--help]

Read-only preflight validator for an operator-authored Blogger withdrawal
authorization document. Verifies (all read-only; zero mutation):

  1. documentValid             (strict withdrawal-authorization schema)
  2. repositoryBindingsMatched (repo-state eligible + HEAD/branch + no preview artifact)
  3. planBindingsMatched       (recomputed withdrawal plan fingerprint matches)
  4. recordBindingsMatched     (candidate unique + paths + source/sidecar SHA-256 +
                                published-URL fingerprint + current status + record fingerprint)
  5. explicitlyAuthorized      (approval.explicitlyAuthorized === true)

applyReady === all five are true. mutationPerformed === false, invariantly. Even when
applyReady is true, this tool performs NO apply and writes NO bytes.

Required:
  --authorization <path>   Path (typically OUTSIDE the repo) to the authorization JSON.
  --source-path <path>     Repo-relative POSIX-style Blogger post Markdown under
                           content/blogger/posts/ (must match a current withdrawal candidate).

Options:
  --json                   Emit a deterministic JSON report to stdout.
  --help / -h              Print this usage.

Forbidden flags (any occurrence → exit 2):
  --apply, --write, --force, --yes, -y, --approve, --auto-approve, --skip-validation,
  --skip-fingerprint, --ignore-head, --dirty-ok, --no-verify, --production, --publish,
  --deploy, --commit, --push, --restore, --republish, --api, --repo-root, --project-root,
  --test-root, --output, --out, --save

Repository state gate (fail-closed): branch == main, HEAD == origin/main, ahead/behind
== 0/0, working tree clean, .git/index.lock absent, dist-blogger-preview/ absent.

Exit codes: 0 applyReady · 1 refusal · 2 CLI misuse.
`;

// ── argv parsing ─────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { help: false, json: false, authorization: null, sourcePath: null, forbidden: [], unknown: [] };
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

// 唯讀讀取 authorization 檔：lstat 拒 symlink / 非一般檔，再 readFileSync。
// 回 { ok:true, rawText } 或 { ok:false, blocker }。**不**回顯 path / raw fs error。
function readAuthorizationFile(authorizationPath) {
  if (typeof authorizationPath !== 'string' || authorizationPath === '') {
    return { ok: false, blocker: 'authorization-path-missing' };
  }
  let st;
  try {
    st = lstatSync(authorizationPath);
  } catch {
    return { ok: false, blocker: 'authorization-unreadable' };
  }
  if (st.isSymbolicLink()) return { ok: false, blocker: 'authorization-symlink' };
  if (!st.isFile()) return { ok: false, blocker: 'authorization-not-regular-file' };
  let rawText;
  try {
    rawText = readFileSync(authorizationPath, 'utf-8');
  } catch {
    return { ok: false, blocker: 'authorization-unreadable' };
  }
  return { ok: true, rawText };
}

// ── preflight orchestrator（唯讀）─────────────────────────────────────────────────
// `projectRoot` 只在程式 API 暴露；CLI 硬編碼 PROJECT_ROOT。
export async function preflightWithdrawalAuthorization({ projectRoot = PROJECT_ROOT, authorizationPath, sourcePath }) {
  const blockers = [];
  const result = {
    ok: false,
    mode: 'preflight-blogger-withdrawal-authorization',
    sourcePath: typeof sourcePath === 'string' ? sourcePath : null,
    branch: null,
    sourceHead: null,
    planFingerprint: null,
    recordFingerprint: null,
    documentValid: false,
    repositoryBindingsMatched: false,
    planBindingsMatched: false,
    recordBindingsMatched: false,
    // Slice 4G：syntactically-valid remote disposition ≠ withdrawal-eligible remote disposition。
    //   `remote-live` 是合法遠端觀察值（documentValid 可為 true），但代表 Blogger 文章仍公開，
    //   撤回會讓 metadata 與遠端真值脫節，故 applyReady 必為 false。任何只讀 applyReady 之 consumer
    //   不會被誤導：applyReady=true ⇒ remoteDispositionEligible=true。
    remoteDispositionEligible: false,
    explicitlyAuthorized: false,
    applyReady: false,
    mutationPerformed: false,
    // Post-preflight TOCTOU binding surfaces（Slice 4E correction）：
    //   validatedAuthorizationSha256 = SHA-256 of the exact raw authorization bytes that passed
    //     initial preflight schema/binding validation. Any post-preflight re-read whose SHA-256
    //     differs — even whitespace / key order / reasonDetail — is authorization drift.
    //   observedSourceSha256 / observedSidecarSha256 = SHA-256 of the source / sidecar bytes the
    //     planner actually read and matched during preflight. Post-preflight re-hash must equal
    //     these observed values, not merely the re-read authorization's expected values (which
    //     could be replaced together with the authorization document).
    // All three are null when preflight has not observed / validated the corresponding artifact.
    validatedAuthorizationSha256: null,
    observedSourceSha256: null,
    observedSidecarSha256: null,
    blockers,
  };

  // ── source-path shape ───────────────────────────────────────────────
  if (classifyBloggerSourcePath(sourcePath) !== null) {
    blockers.push('source-path-invalid');
    return result;
  }

  // ── read + strict-parse authorization ───────────────────────────────
  const read = readAuthorizationFile(authorizationPath);
  if (!read.ok) {
    blockers.push(read.blocker);
    return result;
  }
  const parsed = parseAndValidateAuthorization(read.rawText);
  if (!parsed.ok) {
    blockers.push(parsed.blocker);
    return result;
  }
  result.documentValid = true;
  const auth = parsed.authorization;
  result.explicitlyAuthorized = parsed.explicitlyAuthorized;
  // Slice 4G：withdrawal-eligibility gate 獨立於 schema enum check。
  //   parseAndValidateAuthorization 已保證 remoteDisposition ∈ REMOTE_DISPOSITIONS（含 remote-live）；
  //   本 gate 於 documentValid 之後、repo/plan/record binding 之前決定，讓 blocker 順序 deterministic：
  //   fully-valid remote-live authorization 之 blockers = [remote-disposition-still-live]。
  result.remoteDispositionEligible = isWithdrawalEligibleRemoteDisposition(auth.withdrawal.remoteDisposition);
  if (!result.remoteDispositionEligible) blockers.push(REMOTE_LIVE_BLOCKER);
  // Bind the exact raw authorization bytes that passed schema validation. Post-preflight
  // re-reads compare their SHA-256 against this value; any byte-level drift (whitespace,
  // key order, reasonDetail, reason, remoteDisposition, operator identity) is refused.
  result.validatedAuthorizationSha256 = sha256HexOfString(read.rawText);

  // authorization.target.sourcePath 必須等於 CLI --source-path（兩者同一 candidate）。
  if (auth.target.sourcePath !== sourcePath) {
    blockers.push('target-source-path-mismatch');
  }

  // ── repo-state gate ─────────────────────────────────────────────────
  const preflight = evaluatePreflight({ projectRoot });
  result.branch = preflight.branch;
  result.sourceHead = preflight.head;
  let repoOk = true;
  if (!preflight.eligible) {
    for (const f of preflight.failures) blockers.push(`repo-state:${f.code}`);
    repoOk = false;
  }
  if (existsSync(path.join(projectRoot, 'dist-blogger-preview'))) {
    blockers.push('preview-artifact-present');
    repoOk = false;
  }
  if (repoOk) {
    if (preflight.head !== auth.repository.expectedHead) { blockers.push('repository-head-mismatch'); repoOk = false; }
    if (preflight.branch !== auth.repository.expectedBranch) { blockers.push('repository-branch-mismatch'); repoOk = false; }
  }
  result.repositoryBindingsMatched = repoOk;

  // ── re-run withdrawal planner ───────────────────────────────────────
  let plan;
  try {
    plan = await planBloggerWithdrawals({ repoRoot: projectRoot, gitHead: preflight.head });
  } catch {
    blockers.push('planner-error');
    return result;
  }
  if (plan.summary.blockedCount > 0) {
    blockers.push('planner-blocked');
  }

  // ── plan fingerprint binding ────────────────────────────────────────
  const planFp = computePlanFingerprint(plan);
  result.planFingerprint = planFp.value;
  result.planBindingsMatched = planFp.value === auth.plan.expectedPlanFingerprint;
  if (!result.planBindingsMatched) blockers.push('plan-fingerprint-mismatch');

  // ── candidate selection + target/record bindings ────────────────────
  let recordOk = true;
  const matches = plan.candidates.filter((c) => c.sourcePath === sourcePath);
  if (matches.length === 0) {
    blockers.push('candidate-not-found');
    recordOk = false;
  } else if (matches.length > 1) {
    blockers.push('candidate-not-unique');
    recordOk = false;
  } else {
    const c = matches[0];
    // Record the source/sidecar SHA-256 the planner actually observed and matched, so a later
    // rehearsal step can compare its own re-hash against the truth we saw here — not merely
    // against the re-read authorization's expected fields (which an attacker could rotate
    // together with the source/sidecar bytes).
    result.observedSourceSha256 = c.sourceSha256;
    result.observedSidecarSha256 = c.sidecarSha256;
    if (c.sidecarPath !== auth.target.sidecarPath) { blockers.push('sidecar-path-mismatch'); recordOk = false; }
    if (c.sourceSha256 !== auth.target.expectedSourceSha256) { blockers.push('source-sha-mismatch'); recordOk = false; }
    if (c.sidecarSha256 !== auth.target.expectedSidecarSha256) { blockers.push('sidecar-sha-mismatch'); recordOk = false; }
    if (c.publishedUrlFingerprint !== auth.target.expectedPublishedUrlFingerprint) { blockers.push('published-url-fingerprint-mismatch'); recordOk = false; }
    if (c.sidecarStatus !== auth.target.expectedCurrentStatus) { blockers.push('current-status-mismatch'); recordOk = false; }

    // 以 CURRENT candidate 真值 + authorization withdrawal intent 重算 record fingerprint。
    const recFp = computeRecordFingerprint({
      sourcePath: c.sourcePath,
      sidecarPath: c.sidecarPath,
      expectedCurrentStatus: c.sidecarStatus,
      expectedSourceSha256: c.sourceSha256,
      expectedSidecarSha256: c.sidecarSha256,
      expectedPublishedUrlFingerprint: c.publishedUrlFingerprint,
      remoteDisposition: auth.withdrawal.remoteDisposition,
      remoteVerifiedAt: auth.withdrawal.remoteVerifiedAt,
      reason: auth.withdrawal.reason,
      reasonDetail: auth.withdrawal.reasonDetail,
    });
    result.recordFingerprint = recFp.value;
    if (recFp.value !== auth.plan.expectedRecordFingerprint) { blockers.push('record-fingerprint-mismatch'); recordOk = false; }
  }
  // target-source-path-mismatch / planner-blocked 也算 record 綁定失敗。
  if (auth.target.sourcePath !== sourcePath || plan.summary.blockedCount > 0) recordOk = false;
  result.recordBindingsMatched = recordOk;

  // ── explicit-authorization gate ─────────────────────────────────────
  if (!result.explicitlyAuthorized) blockers.push('explicit-authorization-not-granted');

  // ── applyReady classification（即使 true 也不 apply）──────────────────
  //   Slice 4G：remoteDispositionEligible 必為 true 才可能 applyReady。
  result.applyReady =
    result.documentValid &&
    result.remoteDispositionEligible &&
    result.repositoryBindingsMatched &&
    result.planBindingsMatched &&
    result.recordBindingsMatched &&
    result.explicitlyAuthorized;
  result.ok = result.applyReady;
  return result;
}

// ── formatting（deterministic；固定 key order；無 authorization path / secret）─────────
export function formatJson(result) {
  const body = {
    ok: result.ok,
    mode: result.mode,
    sourcePath: result.sourcePath,
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
    applyReady: result.applyReady,
    mutationPerformed: result.mutationPerformed,
    validatedAuthorizationSha256: result.validatedAuthorizationSha256,
    observedSourceSha256: result.observedSourceSha256,
    observedSidecarSha256: result.observedSidecarSha256,
    blockers: result.blockers,
  };
  return JSON.stringify(body, null, 2) + '\n';
}

export function formatHumanReadable(result) {
  const lines = [];
  lines.push('validate-blogger-withdrawal-authorization (read-only preflight; no apply)');
  lines.push('');
  lines.push(`mode:                            ${result.mode}`);
  lines.push(`source path:                     ${result.sourcePath ?? '(unknown)'}`);
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
  lines.push(`apply ready:                     ${result.applyReady ? 'YES' : 'NO'}`);
  lines.push('mutation performed:              NO');
  lines.push('');
  if (result.blockers.length > 0) {
    lines.push('---- blockers ----');
    for (const b of result.blockers) lines.push(`  - ${b}`);
    lines.push('');
  }
  lines.push('Read-only preflight. No files were created, modified, renamed, or deleted.');
  lines.push('No apply was performed even if apply ready is YES.');
  lines.push(`Overall: ${result.applyReady ? 'PASS' : 'FAIL'}`);
  return lines.join('\n') + '\n';
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
      `[validate-blogger-withdrawal-authorization] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write('  This tool never applies, never writes, and never approves.\n');
    return 2;
  }
  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[validate-blogger-withdrawal-authorization] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 2;
  }
  if (!opts.authorization) {
    process.stderr.write('[validate-blogger-withdrawal-authorization] ERROR: --authorization <path> is required\n');
    process.stderr.write(USAGE);
    return 2;
  }
  if (!opts.sourcePath) {
    process.stderr.write('[validate-blogger-withdrawal-authorization] ERROR: --source-path <path> is required\n');
    process.stderr.write(USAGE);
    return 2;
  }

  const authorizationPath = path.isAbsolute(opts.authorization)
    ? opts.authorization
    : path.resolve(process.cwd(), opts.authorization);

  const result = await preflightWithdrawalAuthorization({
    projectRoot: PROJECT_ROOT,
    authorizationPath,
    sourcePath: opts.sourcePath,
  });

  if (opts.json) {
    process.stdout.write(formatJson(result));
  } else {
    process.stdout.write(formatHumanReadable(result));
  }
  return result.applyReady ? 0 : 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main()
    .then((code) => process.exit(typeof code === 'number' ? code : 0))
    .catch(() => {
      // safe error boundary：**絕不**回顯 raw err.message / stack / path / secret。
      process.stderr.write('[validate-blogger-withdrawal-authorization] ERROR: unexpected-internal-error\n');
      process.exit(1);
    });
}
