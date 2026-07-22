#!/usr/bin/env node
// Phase 20260721-publish-target-stage Slice 4C：Blogger withdrawal planner focused guard。
//
// 上位契約：docs/20260721-blogger-withdrawal-planner.md
//
// 範圍 / 邊界（negative test 完全隔離）：
//   - 所有 fixture 皆為 OS temp directory 下之 synthetic markdown / sidecar、synthetic URL（.invalid TLD）、
//     synthetic hash、synthetic gitHead。**不**讀 / 改任何真實文章、sidecar、manifest、authorization。
//     唯一觸及真實 repo 之處為 read-only：`planBloggerWithdrawals({ repoRoot: PROJECT_ROOT })`
//     與比對 real-repo sidecar hash manifest（純 read + hash）。
//   - **不** build / deploy / push / 碰 gh-pages / dist*；**不**呼叫任何 API；零網路。
//   - 禁止修改真實 repo 檔案再還原（memory: feedback_negative_test_isolation）。temp dir 於各 case
//     內自建自清（rmSync），永不落在 repo 內。
//
// 覆蓋（≥55 named checks）：candidate selection（1–9）／fail-closed（10–18）／candidate contract
//   （19–29）／determinism（30–36）／redaction（37–44）／real repo（45–55）＋ no-write / echo-guard。

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync,
  readdirSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  planBloggerWithdrawals,
  formatJson,
  formatHumanReadable,
  resolveGitHead,
  parseArgs,
  exitCodeForPlan,
  isInsideCanonicalRoot,
  PlannerError,
  CLASSIFICATION,
  CANDIDATE_NEXT_ACTION,
  CANDIDATE_REASON,
} from './plan-blogger-withdrawals.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PLANNER = path.join(PROJECT_ROOT, 'src', 'scripts', 'plan-blogger-withdrawals.js');

// ── harness ─────────────────────────────────────────────────────────────────────
const cases = [];
function check(name, fn) {
  try {
    fn();
    cases.push({ name, ok: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    cases.push({ name, ok: false });
    console.log(`[FAIL] ${name} — ${err.message}`);
  }
}

// ── synthetic constants（絕不使用真實 production host / 真實 ID）─────────────────────
const HEX40 = 'd'.repeat(40);
const HEX64_A = 'a'.repeat(64);
const HEX64_B = 'b'.repeat(64);
const HEX64_C = 'c'.repeat(64);

const SECRET_URL = 'https://secret.invalid/private-post';
const SECRET_ID = 'secret-post-id-123';
const SECRET_EMAIL = 'operator@private.invalid';
const SECRET_PATH = '/d/github/blog-new/operator-private/private.json';
const SECRET_NOTE = 'SECRET-AUTHORIZATION-NOTE';

// ── fixture builders ──────────────────────────────────────────────────────────────
function mdText({ enabled = true, stage } = {}) {
  let pt = `  blogger:\n    enabled: ${enabled ? 'true' : 'false'}\n    mode: "full"\n`;
  if (stage !== undefined) pt += `    stage: "${stage}"\n`;
  return `---\nsite: "blogger"\ntitle: "T"\npublishTargets:\n${pt}---\nbody\n`;
}

function activePublishedSidecar({ publishedUrl = SECRET_URL, bloggerPostId = '', extra = {} } = {}) {
  return {
    schemaVersion: 1,
    blogger: { status: 'published', publishedUrl, publishedAt: '2026-07-01T10:00:00+08:00', bloggerPostId },
    ...extra,
  };
}

function statusSidecar(status) {
  return { schemaVersion: 1, blogger: { status, publishedUrl: '', bloggerPostId: '' } };
}

function validWithdrawnSidecar(sourcePath) {
  return {
    schemaVersion: 2,
    blogger: {
      status: 'withdrawn',
      publishedUrl: 'https://example.invalid/withdrawn-post',
      publishedAt: '2026-07-01T10:00:00+08:00',
      bloggerPostId: '',
      lifecycle: [
        {
          event: 'withdrawn',
          fromStatus: 'published',
          toStatus: 'withdrawn',
          recordedAt: '2026-07-21T10:00:00+08:00',
          remoteVerifiedAt: '2026-07-21T09:55:00+08:00',
          reason: 'stage-preview',
          remoteDisposition: 'remote-deleted',
          sourcePath,
          sourceSha256: HEX64_A,
          priorSidecarSha256: HEX64_B,
          gitHead: HEX40,
          authorizationFingerprint: HEX64_C,
        },
      ],
    },
  };
}

function makeTempRepo() {
  const root = mkdtempSync(path.join(tmpdir(), 'wdplan-'));
  const postsDir = path.join(root, 'content', 'blogger', 'posts');
  mkdirSync(postsDir, { recursive: true });
  return {
    root,
    postsDir,
    dispose() {
      rmSync(root, { recursive: true, force: true });
    },
    // sidecar: undefined=不建 / object=JSON 檔 / string=raw（測 parse error）/ {__dir:true}=同名資料夾（測 read error）
    writePost(name, mdOpts, sidecar) {
      const mdContent = typeof mdOpts === 'string' ? mdOpts : mdText(mdOpts);
      writeFileSync(path.join(this.postsDir, `${name}.md`), mdContent, 'utf-8');
      const sidecarPath = path.join(this.postsDir, `${name}.publish.json`);
      if (sidecar === undefined) return { mdContent };
      if (sidecar && sidecar.__dir === true) {
        mkdirSync(sidecarPath, { recursive: true });
        return { mdContent };
      }
      const sidecarContent = typeof sidecar === 'string' ? sidecar : JSON.stringify(sidecar, null, 2);
      writeFileSync(sidecarPath, sidecarContent, 'utf-8');
      return { mdContent, sidecarContent };
    },
  };
}

function sha256(text) {
  return createHash('sha256').update(Buffer.from(text, 'utf-8')).digest('hex');
}

function runCli(repoRoot, extraArgs = []) {
  const args = [PLANNER, '--repo-root', repoRoot, '--git-head', HEX40, ...extraArgs];
  try {
    const stdout = execFileSync(process.execPath, args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return { status: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

// 不注入 --git-head：迫使 CLI 走真正 resolveGitHead（用於 linked-worktree / invalid-layout / redaction）。
function runCliNoHead(repoRoot, extraArgs = []) {
  const args = [PLANNER, '--repo-root', repoRoot, ...extraArgs];
  try {
    const stdout = execFileSync(process.execPath, args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return { status: err.status, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

// ── synthetic .git layout builders（純檔案；於 OS temp 內自建自清）─────────────────
const SHA_A = 'a'.repeat(40); // synthetic 40-hex（**非**真 commit）
const SHA_B = 'b'.repeat(40);
const GIT_SECRET_ABS = process.platform === 'win32'
  ? 'C:\\Users\\secret\\repo\\SECRET-GIT-PATH\\gitdir'
  : '/d/private/repo/SECRET-GIT-PATH/gitdir';

function newTmp(prefix) {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

// 於 <root>/.git（目錄）建 primary worktree 佈局。head='ref'|'detached'；ref via loose|packed。
function writePrimaryGit(root, { detached = false, sha = SHA_A, via = 'loose', ref = 'refs/heads/main', headSha } = {}) {
  const gitDir = path.join(root, '.git');
  mkdirSync(gitDir, { recursive: true });
  if (detached) {
    writeFileSync(path.join(gitDir, 'HEAD'), `${headSha != null ? headSha : sha}\n`);
    return gitDir;
  }
  writeFileSync(path.join(gitDir, 'HEAD'), `ref: ${ref}\n`);
  if (via === 'loose') {
    const refPath = path.join(gitDir, ...ref.split('/'));
    mkdirSync(path.dirname(refPath), { recursive: true });
    writeFileSync(refPath, `${sha}\n`);
  } else if (via === 'packed') {
    writeFileSync(path.join(gitDir, 'packed-refs'), `# pack-refs with: peeled fully-peeled sorted\n${sha} ${ref}\n`);
  }
  return gitDir;
}

// 建 linked worktree 佈局：<root>/.git 為指標檔 → worktreeGitDir；commonGitDir 內含 branch ref。
//   ptr: 'absolute'|'relative'；refLoc: 'worktree'|'common'；via: 'loose'|'packed'；detached
function writeLinkedWorktreeGit(root, { ptr = 'absolute', refLoc = 'common', via = 'loose', ref = 'refs/heads/wt', sha = SHA_B, detached = false, withCommondir = true } = {}) {
  // common git dir（模擬主 repo 的 .git）
  const commonDir = path.join(root, 'maingit');
  mkdirSync(commonDir, { recursive: true });
  // worktree git dir（模擬 .git/worktrees/<name>）
  const wtDir = path.join(commonDir, 'worktrees', 'wt1');
  mkdirSync(wtDir, { recursive: true });

  if (detached) {
    writeFileSync(path.join(wtDir, 'HEAD'), `${sha}\n`);
  } else {
    writeFileSync(path.join(wtDir, 'HEAD'), `ref: ${ref}\n`);
    const base = refLoc === 'common' ? commonDir : wtDir;
    if (via === 'loose') {
      const refPath = path.join(base, ...ref.split('/'));
      mkdirSync(path.dirname(refPath), { recursive: true });
      writeFileSync(refPath, `${sha}\n`);
    } else {
      writeFileSync(path.join(base, 'packed-refs'), `# pack-refs\n${sha} ${ref}\n`);
    }
  }
  if (withCommondir) {
    const rel = path.relative(wtDir, commonDir);
    writeFileSync(path.join(wtDir, 'commondir'), `${rel}\n`);
  }
  // .git 指標檔
  const pointerTarget = ptr === 'absolute' ? wtDir : path.relative(root, wtDir);
  writeFileSync(path.join(root, '.git'), `gitdir: ${pointerTarget}\n`);
  return { wtDir, commonDir };
}

// symlink / junction 能力探測（Windows 上 symlink 常需權限；junction 通常可）。
function probeCapability(type) {
  const d = newTmp('cap-');
  try {
    const target = path.join(d, 'target');
    mkdirSync(target, { recursive: true });
    if (type === 'junction') {
      symlinkSync(target, path.join(d, 'link'), 'junction');
    } else {
      const f = path.join(d, 'f');
      writeFileSync(f, 'x');
      symlinkSync(f, path.join(d, 'l'), 'file');
    }
    return true;
  } catch {
    return false;
  } finally {
    try { rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
const SYMLINK_OK = probeCapability('file');
const JUNCTION_OK = probeCapability('junction');
const skippedOsFixtures = [];

// deterministic JSON via CLI with a controlled env (for TZ determinism proof)。
function runCliEnv(repoRoot, env) {
  const args = [PLANNER, '--repo-root', repoRoot, '--git-head', HEX40, '--json'];
  try {
    const stdout = execFileSync(process.execPath, args, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    return { status: 0, stdout };
  } catch (err) {
    return { status: err.status, stdout: err.stdout || '' };
  }
}

// 於 dir 外部（scan root 之外）寫一組看似合格的 preview 候選（含 SECRET_URL），用以證明 escape 不被讀取。
function writeOutsideCandidate(dir, name) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${name}.md`), mdText({ stage: 'preview' }), 'utf-8');
  writeFileSync(
    path.join(dir, `${name}.publish.json`),
    JSON.stringify(activePublishedSidecar({ publishedUrl: SECRET_URL }), null, 2),
    'utf-8',
  );
}

// ── real-repo sidecar hash manifest / posts listing（read-only）────────────────────
function sidecarManifest() {
  const out = [];
  const walk = (d) => {
    for (const ent of readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith('.publish.json')) {
        const rel = path.relative(PROJECT_ROOT, full).split(path.sep).join('/');
        out.push(`${rel}:${sha256(readFileSync(full, 'utf-8'))}`);
      }
    }
  };
  walk(path.join(PROJECT_ROOT, 'content'));
  return out.sort();
}
function postsDirListing() {
  return readdirSync(path.join(PROJECT_ROOT, 'content', 'blogger', 'posts')).sort();
}

const TARGET_SOURCE = 'content/blogger/posts/20260612-after-work-writing-time-blocking.md';
const TARGET_SIDECAR = 'content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json';
const EXPECTED_SOURCE_SHA = 'cadcd68e639367964c3cdb0dc92a663cbfabfcb2b13404b01e8db8c2c1b4f060';
const EXPECTED_SIDECAR_SHA = 'ed3e1e4a6700e30b5ae4458c40d4694b63d5f7ae218f79a83cb710efa095022e';

// ════════════════════════════════════════════════════════════════════════════════
async function main() {
  // ── Phase 1：kitchen-sink（cases 1–18, 30–31, 37–44）────────────────────────────
  const repo = makeTempRepo();
  repo.writePost(
    'a-candidate-empty-postid',
    { stage: 'preview' },
    activePublishedSidecar({
      publishedUrl: SECRET_URL,
      bloggerPostId: '',
      extra: { operatorEmail: SECRET_EMAIL, authorizationPath: SECRET_PATH, note: SECRET_NOTE },
    }),
  );
  repo.writePost(
    'b-candidate-with-postid',
    { stage: 'preview' },
    activePublishedSidecar({ publishedUrl: 'https://example.invalid/with-id', bloggerPostId: SECRET_ID }),
  );
  repo.writePost('c-production-published', {}, activePublishedSidecar({ publishedUrl: 'https://example.invalid/prod' }));
  repo.writePost('d-preview-withdrawn', { stage: 'preview' }, validWithdrawnSidecar('content/blogger/posts/d-preview-withdrawn.md'));
  repo.writePost('e-preview-draft', { stage: 'preview' }, statusSidecar('draft'));
  repo.writePost('f-preview-ready', { stage: 'preview' }, statusSidecar('ready'));
  repo.writePost('g-preview-archived', { stage: 'preview' }, statusSidecar('archived'));
  repo.writePost('h-preview-no-sidecar', { stage: 'preview' }, undefined);
  repo.writePost('i-disabled-blogger', { enabled: false, stage: 'preview' }, activePublishedSidecar());
  repo.writePost('m-invalid-stage', { stage: 'bogus' }, undefined);
  repo.writePost('n-parse-error', { stage: 'preview' }, `{ "blogger": { "status": "published" ${SECRET_NOTE} not-json`);
  repo.writePost('o-read-error', { stage: 'preview' }, { __dir: true });
  repo.writePost('p-schemaversion', { stage: 'preview' }, { schemaVersion: 3, blogger: { status: 'published', publishedUrl: 'x' } });
  repo.writePost('q-v2-unknown-status', { stage: 'preview' }, { schemaVersion: 2, blogger: { status: 'bogus', publishedUrl: 'x' } });
  const wl = validWithdrawnSidecar('content/blogger/posts/r-malformed-lifecycle.md');
  wl.blogger.lifecycle[0].recordedAt = 'not-a-timestamp';
  repo.writePost('r-malformed-lifecycle', { stage: 'preview' }, wl);

  const ks = await planBloggerWithdrawals({ repoRoot: repo.root, gitHead: HEX40 });
  const P = (n) => `content/blogger/posts/${n}.md`;
  const isCandidate = (n) => ks.candidates.some((c) => c.sourcePath === P(n));
  const isBlocked = (n) => ks.blockers.some((b) => b.sourcePath === P(n));
  const blockerOf = (n) => ks.blockers.find((b) => b.sourcePath === P(n));

  check('1. preview + published + active URL → candidate', () => {
    assert.equal(isCandidate('a-candidate-empty-postid'), true);
    assert.equal(ks.summary.candidateCount, 2);
  });
  check('2. production + published → not candidate', () => {
    assert.equal(isCandidate('c-production-published'), false);
    assert.equal(isBlocked('c-production-published'), false);
  });
  check('3. missing stage + published → not candidate (production default)', () => {
    assert.equal(isCandidate('c-production-published'), false);
  });
  check('4. preview + withdrawn → already-withdrawn no-action', () => {
    assert.equal(isCandidate('d-preview-withdrawn'), false);
    assert.equal(isBlocked('d-preview-withdrawn'), false);
  });
  check('5. preview + draft → no-action', () => {
    assert.equal(isCandidate('e-preview-draft'), false);
    assert.equal(isBlocked('e-preview-draft'), false);
  });
  check('6. preview + ready → no-action', () => {
    assert.equal(isCandidate('f-preview-ready'), false);
    assert.equal(isBlocked('f-preview-ready'), false);
  });
  check('7. preview + archived → no-action', () => {
    assert.equal(isCandidate('g-preview-archived'), false);
    assert.equal(isBlocked('g-preview-archived'), false);
  });
  check('8. preview + no sidecar → no-action', () => {
    assert.equal(isCandidate('h-preview-no-sidecar'), false);
    assert.equal(isBlocked('h-preview-no-sidecar'), false);
  });
  check('9. backfill-only production published post not mis-listed', () => {
    assert.equal(isCandidate('c-production-published'), false);
    assert.equal(isBlocked('c-production-published'), false);
  });
  check('10. invalid stage → blocker (BLOCKED_INVALID_STAGE)', () => {
    assert.equal(isBlocked('m-invalid-stage'), true);
    assert.equal(blockerOf('m-invalid-stage').classification, CLASSIFICATION.blockedInvalidStage);
  });
  check('11. sidecar JSON parse error → blocker (BLOCKED_SIDECAR_MALFORMED)', () => {
    assert.equal(blockerOf('n-parse-error').classification, CLASSIFICATION.blockedSidecarMalformed);
    assert.deepEqual(blockerOf('n-parse-error').details, ['parse-error']);
  });
  check('12. unsupported schemaVersion → blocker (BLOCKED_SIDECAR_INVALID)', () => {
    assert.equal(blockerOf('p-schemaversion').classification, CLASSIFICATION.blockedSidecarInvalid);
    assert.ok(blockerOf('p-schemaversion').details.includes('sidecar-schema-version-unsupported'));
  });
  check('13. v2 unknown status → blocker (BLOCKED_SIDECAR_INVALID)', () => {
    assert.equal(blockerOf('q-v2-unknown-status').classification, CLASSIFICATION.blockedSidecarInvalid);
    assert.ok(blockerOf('q-v2-unknown-status').details.includes('blogger-status-invalid'));
  });
  check('14. malformed lifecycle → blocker (BLOCKED_SIDECAR_INVALID)', () => {
    assert.equal(blockerOf('r-malformed-lifecycle').classification, CLASSIFICATION.blockedSidecarInvalid);
    assert.ok(blockerOf('r-malformed-lifecycle').details.length > 0);
  });
  check('15. sidecar read error (path is dir) → blocker (BLOCKED_SIDECAR_MALFORMED)', () => {
    assert.equal(blockerOf('o-read-error').classification, CLASSIFICATION.blockedSidecarMalformed);
    assert.deepEqual(blockerOf('o-read-error').details, ['sidecar-read-error']);
  });
  check('16. blockers cause exit code 1', () => {
    assert.equal(ks.summary.blockedCount, 6);
    assert.equal(runCli(repo.root).status, 1);
  });
  check('17. unknown CLI arg → exit code 2 (incl. write-like flags)', () => {
    assert.equal(runCli(repo.root, ['--frobnicate']).status, 2);
    assert.equal(runCli(repo.root, ['--apply']).status, 2);
    assert.equal(runCli(repo.root, ['--output', 'x']).status, 2);
  });
  check('18. --help → exit code 0 with usage', () => {
    const r = runCli(repo.root, ['--help']);
    assert.equal(r.status, 0);
    assert.ok(/Usage: plan-blogger-withdrawals/.test(r.stdout));
  });
  check('30. candidates sorted by sourcePath ascending', () => {
    const paths = ks.candidates.map((c) => c.sourcePath);
    assert.deepEqual(paths, [...paths].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    assert.equal(paths[0], 'content/blogger/posts/a-candidate-empty-postid.md');
    assert.equal(paths[1], 'content/blogger/posts/b-candidate-with-postid.md');
  });
  check('31. blockers sorted by sourcePath ascending', () => {
    const paths = ks.blockers.map((b) => b.sourcePath);
    assert.deepEqual(paths, [...paths].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
  });

  const json = formatJson(ks);
  const human = formatHumanReadable(ks);
  const cliJson = runCli(repo.root, ['--json']);
  const cliHuman = runCli(repo.root);
  const allOut = json + human + cliJson.stdout + cliJson.stderr + cliHuman.stdout + cliHuman.stderr;

  check('37. JSON output contains no publishedUrl', () => {
    assert.ok(!json.includes(SECRET_URL));
    assert.ok(!json.includes('example.invalid/with-id'));
  });
  check('38. human output contains no publishedUrl', () => {
    assert.ok(!human.includes(SECRET_URL));
    assert.ok(!cliHuman.stdout.includes(SECRET_URL));
  });
  check('39. output contains no URL host', () => {
    assert.ok(!allOut.includes('secret.invalid'));
    assert.ok(!allOut.includes('example.invalid'));
  });
  check('40. output contains no Blogger post id value', () => {
    assert.ok(!allOut.includes(SECRET_ID));
  });
  check('41. output contains no operator email', () => {
    assert.ok(!allOut.includes(SECRET_EMAIL));
  });
  check('42. output contains no private path', () => {
    assert.ok(!allOut.includes(SECRET_PATH));
    assert.ok(!allOut.includes('operator-private'));
  });
  check('43. blocker does not echo malformed secret value', () => {
    assert.ok(!allOut.includes(SECRET_NOTE));
  });
  check('44. planner source contains no real production Blogger host', () => {
    const src = readFileSync(PLANNER, 'utf-8');
    const banned = ['blog' + 'spot.com', 'babel' + '-lab', 'git' + 'hub.io'];
    for (const needle of banned) assert.ok(!src.includes(needle), `planner must not contain ${needle}`);
  });

  repo.dispose();

  // ── Phase 2：candidate contract（19–29）＋ determinism（32–36）─────────────────
  const kr = makeTempRepo();
  const w = kr.writePost('k-known-candidate', { stage: 'preview' }, activePublishedSidecar({ publishedUrl: SECRET_URL, bloggerPostId: '' }));
  kr.writePost('z-known-with-id', { stage: 'preview' }, activePublishedSidecar({ publishedUrl: 'https://example.invalid/z', bloggerPostId: SECRET_ID }));

  const kp = await planBloggerWithdrawals({ repoRoot: kr.root, gitHead: HEX40 });
  const cand = kp.candidates.find((c) => c.sourcePath === 'content/blogger/posts/k-known-candidate.md');
  const candId = kp.candidates.find((c) => c.sourcePath === 'content/blogger/posts/z-known-with-id.md');

  check('19. candidate sourceSha256 correct', () => assert.equal(cand.sourceSha256, sha256(w.mdContent)));
  check('20. candidate sidecarSha256 correct', () => assert.equal(cand.sidecarSha256, sha256(w.sidecarContent)));
  check('21. candidate publishedUrlFingerprint correct (sha256 of exact url)', () => {
    assert.equal(cand.publishedUrlFingerprint, createHash('sha256').update(SECRET_URL, 'utf-8').digest('hex'));
  });
  check('22. hasPublishedUrl is boolean true', () => {
    assert.equal(typeof cand.hasPublishedUrl, 'boolean');
    assert.equal(cand.hasPublishedUrl, true);
  });
  check('23. empty Blogger post id → hasBloggerPostId false', () => assert.equal(cand.hasBloggerPostId, false));
  check('24. nonempty Blogger post id → hasBloggerPostId true, value not emitted', () => {
    assert.equal(candId.hasBloggerPostId, true);
    assert.ok(!formatJson(kp).includes(SECRET_ID));
  });
  check('25. remoteDisposition fixed null', () => assert.strictEqual(cand.remoteDisposition, null));
  check('26. remoteVerifiedAt fixed null', () => assert.strictEqual(cand.remoteVerifiedAt, null));
  check('27. authorizationEligible fixed false', () => assert.strictEqual(cand.authorizationEligible, false));
  check('28. nextAction fixed verify-remote-disposition', () => {
    assert.equal(cand.nextAction, CANDIDATE_NEXT_ACTION);
    assert.equal(cand.nextAction, 'verify-remote-disposition');
  });
  check('29. reason fixed stage-preview', () => {
    assert.equal(cand.reason, CANDIDATE_REASON);
    assert.equal(cand.reason, 'stage-preview');
  });

  const [p1, p2] = await Promise.all([
    planBloggerWithdrawals({ repoRoot: kr.root, gitHead: HEX40 }),
    planBloggerWithdrawals({ repoRoot: kr.root, gitHead: HEX40 }),
  ]);
  check('32. same fixture twice → JSON byte-identical', () => assert.equal(formatJson(p1), formatJson(p2)));
  check('33. JSON has no generatedAt', () => assert.ok(!formatJson(p1).includes('generatedAt')));
  check('34. JSON has no absolute repo path', () => assert.ok(!formatJson(p1).includes(kr.root)));
  check('35. JSON has no current-time dependency (no ISO timestamp; injected gitHead)', () => {
    const j = formatJson(p1);
    assert.ok(!/\d{4}-\d\d-\d\dT\d\d:\d\d/.test(j), 'no ISO timestamp in output');
    assert.equal(p1.gitHead, HEX40);
  });
  check('36. authorizationEligibleCount precisely 0', () => assert.strictEqual(kp.summary.authorizationEligibleCount, 0));

  kr.dispose();

  // ── Phase 3：no-write design & unit（額外）──────────────────────────────────────
  check('no-write: planner source imports no fs write primitive', () => {
    const src = readFileSync(PLANNER, 'utf-8');
    const banned = ['writeFile', 'appendFile', '.rename(', '.unlink(', '.rmdir(', '.mkdir(', '.rm(', 'copyFile', 'rmSync', 'mkdirSync', 'writeFileSync'];
    for (const needle of banned) assert.ok(!src.includes(needle), `planner must not use ${needle}`);
  });
  check('no-write: planner source references no network / child_process / apply module', () => {
    const src = readFileSync(PLANNER, 'utf-8');
    const banned = ['child_process', 'node:http', 'fetch(', 'googleapis', 'oauth', 'apply-blogger'];
    for (const needle of banned) assert.ok(!src.includes(needle), `planner must not reference ${needle}`);
  });
  check('parseArgs: --json / --help / unknown classification', () => {
    assert.equal(parseArgs(['node', 's', '--json']).json, true);
    assert.equal(parseArgs(['node', 's', '--help']).help, true);
    assert.deepEqual(parseArgs(['node', 's', '--nope']).unknown, ['--nope']);
  });
  check('exitCodeForPlan: blocked>0 → 1, else 0', () => {
    assert.equal(exitCodeForPlan({ summary: { blockedCount: 0 } }), 0);
    assert.equal(exitCodeForPlan({ summary: { blockedCount: 3 } }), 1);
  });

  // ── Phase 4：real repo（45–55）—— read-only；manifest 前後不變；無 artifact ──────
  const manifestBefore = sidecarManifest();
  const listingBefore = postsDirListing();
  const rp = await planBloggerWithdrawals({ repoRoot: PROJECT_ROOT, gitHead: resolveGitHead(PROJECT_ROOT) });
  const manifestAfter = sidecarManifest();
  const listingAfter = postsDirListing();
  const rc = rp.candidates[0];

  check('45. real repo candidateCount === 1', () => assert.equal(rp.summary.candidateCount, 1));
  check('46. real repo unique candidate path correct', () => {
    assert.equal(rc.sourcePath, TARGET_SOURCE);
    assert.equal(rc.sidecarPath, TARGET_SIDECAR);
  });
  check('47. real repo candidate source SHA correct', () => assert.equal(rc.sourceSha256, EXPECTED_SOURCE_SHA));
  check('48. real repo candidate sidecar SHA correct', () => assert.equal(rc.sidecarSha256, EXPECTED_SIDECAR_SHA));
  check('49. real repo needsRemoteVerificationCount === 1', () => assert.equal(rp.summary.needsRemoteVerificationCount, 1));
  check('50. real repo authorizationEligibleCount === 0', () => assert.equal(rp.summary.authorizationEligibleCount, 0));
  check('51. real repo blockedCount === 0', () => assert.equal(rp.summary.blockedCount, 0));
  check('52. real repo mutationPerformed === false', () => assert.strictEqual(rp.mutationPerformed, false));
  check('53. real repo sidecar hash manifest unchanged', () => assert.deepEqual(manifestAfter, manifestBefore));
  check('54. real repo target md + sidecar unchanged (byte hash)', () => {
    assert.equal(sha256(readFileSync(path.join(PROJECT_ROOT, TARGET_SOURCE), 'utf-8')), EXPECTED_SOURCE_SHA);
    assert.equal(sha256(readFileSync(path.join(PROJECT_ROOT, TARGET_SIDECAR), 'utf-8')), EXPECTED_SIDECAR_SHA);
  });
  check('55. real repo produced no output artifact (posts dir listing unchanged)', () => {
    assert.deepEqual(listingAfter, listingBefore);
  });
  check('real repo output does not leak production Blogger host', () => {
    const j = formatJson(rp);
    assert.ok(!j.includes('blog' + 'spot.com'));
    assert.ok(!j.includes('babel' + '-lab'));
  });
  check('real repo candidate reason/nextAction/schemaVersion/stage/status contract', () => {
    assert.equal(rc.reason, 'stage-preview');
    assert.equal(rc.nextAction, 'verify-remote-disposition');
    assert.equal(rc.resolvedStage, 'preview');
    assert.equal(rc.sidecarStatus, 'published');
    assert.equal(rc.hasBloggerPostId, false);
    assert.equal(typeof rc.resolvedSchemaVersion, 'number');
  });

  // ── echo-guard ─────────────────────────────────────────────────────────────────
  check('echo-guard: guard source contains no real production host (fixture-only self-proof)', () => {
    const src = readFileSync(__filename, 'utf-8');
    const banned = ['blog' + 'spot.com', 'babel' + '-lab', 'git' + 'hub.io'];
    for (const needle of banned) assert.ok(!src.includes(needle), 'guard source must not contain a real production host');
    assert.ok(src.includes('.invalid'), 'guard must use .invalid synthetic host');
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // Phase 5：git HEAD resolution across layouts（synthetic .git in OS temp；純函式）
  // ════════════════════════════════════════════════════════════════════════════════
  const withTmp = (prefix, fn) => {
    const root = newTmp(prefix);
    try {
      return fn(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };
  const expectGitHeadError = (root, expectedCode) => {
    let thrown = null;
    try {
      resolveGitHead(root);
    } catch (e) {
      thrown = e;
    }
    assert.ok(thrown, 'expected resolveGitHead to throw');
    assert.ok(thrown instanceof PlannerError, 'must throw PlannerError, not raw fs error');
    assert.equal(thrown.code, expectedCode);
    return thrown;
  };

  check('G1. primary worktree loose ref → resolves SHA', () => {
    withTmp('gl-', (root) => {
      writePrimaryGit(root, { via: 'loose', sha: SHA_A });
      assert.equal(resolveGitHead(root), SHA_A);
    });
  });
  check('G2. primary worktree packed ref → resolves SHA', () => {
    withTmp('gl-', (root) => {
      writePrimaryGit(root, { via: 'packed', sha: SHA_A });
      assert.equal(resolveGitHead(root), SHA_A);
    });
  });
  check('G3. detached HEAD (40-hex) → resolves SHA', () => {
    withTmp('gl-', (root) => {
      writePrimaryGit(root, { detached: true, sha: SHA_B });
      assert.equal(resolveGitHead(root), SHA_B);
    });
  });
  check('G4. linked worktree .git pointer file (absolute) + common branch ref → resolves', () => {
    withTmp('gl-', (root) => {
      writeLinkedWorktreeGit(root, { ptr: 'absolute', refLoc: 'common', via: 'loose', sha: SHA_B });
      assert.equal(resolveGitHead(root), SHA_B);
    });
  });
  check('G5. linked worktree relative gitdir pointer → resolves', () => {
    withTmp('gl-', (root) => {
      writeLinkedWorktreeGit(root, { ptr: 'relative', refLoc: 'common', via: 'loose', sha: SHA_A });
      assert.equal(resolveGitHead(root), SHA_A);
    });
  });
  check('G6. linked worktree commondir honored (ref lives only in common dir)', () => {
    withTmp('gl-', (root) => {
      writeLinkedWorktreeGit(root, { refLoc: 'common', via: 'loose', sha: SHA_B, withCommondir: true });
      assert.equal(resolveGitHead(root), SHA_B);
    });
  });
  check('G7. linked worktree branch ref in common dir (non-default branch name)', () => {
    withTmp('gl-', (root) => {
      writeLinkedWorktreeGit(root, { refLoc: 'common', via: 'loose', ref: 'refs/heads/feature', sha: SHA_A });
      assert.equal(resolveGitHead(root), SHA_A);
    });
  });
  check('G8. linked worktree packed ref in common dir → resolves', () => {
    withTmp('gl-', (root) => {
      writeLinkedWorktreeGit(root, { refLoc: 'common', via: 'packed', sha: SHA_B });
      assert.equal(resolveGitHead(root), SHA_B);
    });
  });
  check('G9. missing .git → missing-dot-git', () => {
    withTmp('gl-', (root) => expectGitHeadError(root, 'unresolvable-git-head:missing-dot-git'));
  });
  check('G10. malformed gitdir pointer → invalid-gitdir-pointer', () => {
    withTmp('gl-', (root) => {
      writeFileSync(path.join(root, '.git'), 'not-a-gitdir-pointer\n');
      expectGitHeadError(root, 'unresolvable-git-head:invalid-gitdir-pointer');
    });
  });
  check('G11. missing gitdir target → missing-gitdir', () => {
    withTmp('gl-', (root) => {
      writeFileSync(path.join(root, '.git'), `gitdir: ${GIT_SECRET_ABS}\n`);
      expectGitHeadError(root, 'unresolvable-git-head:missing-gitdir');
    });
  });
  check('G12. malformed HEAD → invalid-head', () => {
    withTmp('gl-', (root) => {
      const g = path.join(root, '.git');
      mkdirSync(g, { recursive: true });
      writeFileSync(path.join(g, 'HEAD'), 'garbage-not-ref-not-sha\n');
      expectGitHeadError(root, 'unresolvable-git-head:invalid-head');
    });
  });
  check('G13. missing symbolic ref (loose + packed absent) → missing-ref', () => {
    withTmp('gl-', (root) => {
      const g = path.join(root, '.git');
      mkdirSync(g, { recursive: true });
      writeFileSync(path.join(g, 'HEAD'), 'ref: refs/heads/main\n');
      expectGitHeadError(root, 'unresolvable-git-head:missing-ref');
    });
  });
  check('G14. invalid loose ref SHA → invalid-ref', () => {
    withTmp('gl-', (root) => {
      const g = writePrimaryGit(root, { via: 'loose', sha: SHA_A });
      writeFileSync(path.join(g, 'refs', 'heads', 'main'), 'ZZZZ-not-hex\n');
      expectGitHeadError(root, 'unresolvable-git-head:invalid-ref');
    });
  });
  check('G15. malformed packed-refs (matching ref, non-hex SHA) → invalid-packed-refs', () => {
    withTmp('gl-', (root) => {
      const g = path.join(root, '.git');
      mkdirSync(g, { recursive: true });
      writeFileSync(path.join(g, 'HEAD'), 'ref: refs/heads/main\n');
      writeFileSync(path.join(g, 'packed-refs'), '# hdr\nNOThex40 refs/heads/main\n');
      expectGitHeadError(root, 'unresolvable-git-head:invalid-packed-refs');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // Phase 6：error redaction（no absolute path / no raw fs error / safe stderr only）
  // ════════════════════════════════════════════════════════════════════════════════
  const REDACT_BANNED = [
    'C:\\Users\\secret\\repo\\.git\\HEAD',
    '/d/private/repo/.git/HEAD',
    'operator@example.invalid',
    'SECRET-GIT-PATH',
    GIT_SECRET_ABS,
  ];
  const assertNoBannedPath = (text) => {
    for (const b of REDACT_BANNED) assert.ok(!text.includes(b), `must not leak ${b}`);
    assert.ok(!/ENOENT/.test(text), 'must not leak raw ENOENT');
    assert.ok(!/\.git[\\/]HEAD/.test(text), 'must not leak .git/HEAD path');
  };

  check('R16. linked-worktree failure error carries no absolute path / secret', () => {
    withTmp('rd-', (root) => {
      writeFileSync(path.join(root, '.git'), `gitdir: ${GIT_SECRET_ABS}\n`);
      const e = expectGitHeadError(root, 'unresolvable-git-head:missing-gitdir');
      assertNoBannedPath(e.code);
      assertNoBannedPath(String(e.message));
    });
  });
  check('R17. missing .git error carries no repo path', () => {
    withTmp('rd-', (root) => {
      const e = expectGitHeadError(root, 'unresolvable-git-head:missing-dot-git');
      assert.ok(!e.code.includes(root) && !String(e.message).includes(root));
      assertNoBannedPath(e.code);
    });
  });
  check('R18. missing HEAD fs error → invalid-head, no ENOENT raw path', () => {
    withTmp('rd-', (root) => {
      mkdirSync(path.join(root, '.git'), { recursive: true }); // .git dir, but no HEAD file
      const e = expectGitHeadError(root, 'unresolvable-git-head:invalid-head');
      assert.ok(!/ENOENT/.test(String(e.message)));
      assert.ok(!String(e.message).includes(root));
    });
  });
  check('R19. CLI maps non-PlannerError → unexpected-internal-error; never echoes raw err.message', () => {
    const src = readFileSync(PLANNER, 'utf-8');
    assert.ok(src.includes('unexpected-internal-error'), 'planner must define unexpected-internal-error fallback');
    assert.ok(!/stderr\.write\([^)]*err\.message/.test(src), 'CLI must not write raw err.message to stderr');
  });
  check('R20. CLI stderr on git-head failure = single safe code line only', () => {
    withTmp('rd-', (root) => {
      mkdirSync(path.join(root, 'content', 'blogger', 'posts'), { recursive: true });
      writeFileSync(path.join(root, '.git'), `gitdir: ${GIT_SECRET_ABS}\n`);
      const r = runCliNoHead(root, ['--json']);
      assert.equal(r.status, 1);
      assert.match(r.stderr, /^\[plan-blogger-withdrawals\] ERROR: unresolvable-git-head:[a-z-]+\n$/);
      assertNoBannedPath(r.stderr);
      assert.equal(r.stdout, '');
    });
  });
  check('R21. CLI stderr on failure has no stack trace / file:line / secret', () => {
    withTmp('rd-', (root) => {
      mkdirSync(path.join(root, 'content', 'blogger', 'posts'), { recursive: true });
      writeFileSync(path.join(root, '.git'), 'totally-invalid-gitdir\n');
      const r = runCliNoHead(root);
      assert.equal(r.status, 1);
      assert.ok(!/\bat\s+\w/.test(r.stderr), 'no stack frames');
      assert.ok(!/\.js:\d+/.test(r.stderr), 'no file:line');
      assertNoBannedPath(r.stderr);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // Phase 7：symlink / junction containment + segment-safe root check
  // ════════════════════════════════════════════════════════════════════════════════
  check('S31. containment segment-safe: root itself + nested inside → true', () => {
    const root = path.sep === '\\' ? 'C:\\repo\\posts' : '/repo/posts';
    assert.equal(isInsideCanonicalRoot(root, root), true);
    assert.equal(isInsideCanonicalRoot(root, path.join(root, 'sub', 'a.md')), true);
  });
  check('S32. containment: sibling prefix NOT inside (posts-evil vs posts) + parent outside', () => {
    const root = path.sep === '\\' ? 'C:\\repo\\posts' : '/repo/posts';
    assert.equal(isInsideCanonicalRoot(root, `${root}-evil${path.sep}a.md`), false);
    assert.equal(isInsideCanonicalRoot(root, path.join(path.dirname(root), 'outside.md')), false);
  });

  // S30：安全巢狀一般檔仍被掃描為 candidate
  const nestRepo = makeTempRepo();
  mkdirSync(path.join(nestRepo.postsDir, 'sub'), { recursive: true });
  writeFileSync(path.join(nestRepo.postsDir, 'sub', 'nested.md'), mdText({ stage: 'preview' }), 'utf-8');
  writeFileSync(
    path.join(nestRepo.postsDir, 'sub', 'nested.publish.json'),
    JSON.stringify(activePublishedSidecar({ publishedUrl: 'https://example.invalid/nested' }), null, 2),
    'utf-8',
  );
  const nestPlan = await planBloggerWithdrawals({ repoRoot: nestRepo.root, gitHead: HEX40 });
  nestRepo.dispose();
  check('S30. safe nested regular file still scanned as candidate', () => {
    assert.ok(nestPlan.candidates.some((c) => c.sourcePath === 'content/blogger/posts/sub/nested.md'));
  });

  // S22/S24：junction 目錄指向 repo 外
  let jPlan = null;
  let jOutside = null;
  if (JUNCTION_OK) {
    const repo = makeTempRepo();
    jOutside = newTmp('evil-out-');
    try {
      repo.writePost('good', { stage: 'preview' }, activePublishedSidecar({ publishedUrl: 'https://example.invalid/good' }));
      writeOutsideCandidate(jOutside, 'evil');
      symlinkSync(jOutside, path.join(repo.postsDir, 'jdir'), 'junction');
      jPlan = await planBloggerWithdrawals({ repoRoot: repo.root, gitHead: HEX40 });
    } finally {
      try { rmSync(path.join(repo.postsDir, 'jdir'), { recursive: false, force: true }); } catch { /* ignore */ }
      try { repo.dispose(); } catch { /* ignore */ }
      try { rmSync(jOutside, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  } else {
    skippedOsFixtures.push('S22/S24 junction-dir-to-outside (junction unsupported)');
  }
  check('S22/S24. junction dir → outside candidate NOT admitted; good candidate intact; no leak', () => {
    if (!JUNCTION_OK) {
      assert.ok(skippedOsFixtures.some((s) => s.startsWith('S22')));
      return;
    }
    const evilPath = 'content/blogger/posts/jdir/evil.md';
    assert.ok(!jPlan.candidates.some((c) => c.sourcePath === evilPath), 'outside candidate must not be admitted');
    assert.equal(jPlan.summary.candidateCount, 1);
    const evilBlocker = jPlan.blockers.find((b) => b.sourcePath === evilPath);
    if (evilBlocker) assert.equal(evilBlocker.classification, CLASSIFICATION.blockedUnsafeSourcePath);
    const j = formatJson(jPlan);
    assert.ok(!j.includes('secret.invalid'), 'no outside URL host leak');
    assert.ok(!j.includes(SECRET_URL));
    assert.ok(!j.includes(jOutside), 'no outside absolute path leak');
  });

  // S23：symlink 檔指向 repo 外
  let symFilePlan = null;
  let symFileOutsideDir = null;
  if (SYMLINK_OK) {
    const repo = makeTempRepo();
    symFileOutsideDir = newTmp('evil-file-');
    try {
      writeOutsideCandidate(symFileOutsideDir, 'evilfile');
      symlinkSync(path.join(symFileOutsideDir, 'evilfile.md'), path.join(repo.postsDir, 'evillink.md'), 'file');
      symFilePlan = await planBloggerWithdrawals({ repoRoot: repo.root, gitHead: HEX40 });
    } finally {
      try { rmSync(path.join(repo.postsDir, 'evillink.md'), { force: true }); } catch { /* ignore */ }
      try { repo.dispose(); } catch { /* ignore */ }
      try { rmSync(symFileOutsideDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  } else {
    skippedOsFixtures.push('S23 symlink-file-to-outside (symlink unsupported)');
  }
  check('S23/S26. symlink file → outside markdown not read; unsafe-source blocker; no leak', () => {
    if (!SYMLINK_OK) {
      assert.ok(skippedOsFixtures.some((s) => s.startsWith('S23')));
      return;
    }
    const linkPath = 'content/blogger/posts/evillink.md';
    assert.ok(!symFilePlan.candidates.some((c) => c.sourcePath === linkPath), 'symlink must not become candidate');
    const b = symFilePlan.blockers.find((x) => x.sourcePath === linkPath);
    assert.ok(b, 'symlink source must surface as blocker');
    assert.equal(b.classification, CLASSIFICATION.blockedUnsafeSourcePath);
    assert.deepEqual(b.details, ['unsafe-source-symlink']);
    const j = formatJson(symFilePlan);
    assert.ok(!j.includes('secret.invalid') && !j.includes(SECRET_URL) && !j.includes(symFileOutsideDir));
  });

  // S25：symlink sidecar（markdown 合法但 sidecar 為 symlink）
  let symSidePlan = null;
  let symSideOutsideDir = null;
  if (SYMLINK_OK) {
    const repo = makeTempRepo();
    symSideOutsideDir = newTmp('evil-side-');
    try {
      mkdirSync(symSideOutsideDir, { recursive: true });
      writeFileSync(
        path.join(symSideOutsideDir, 'secret.publish.json'),
        JSON.stringify(activePublishedSidecar({ publishedUrl: SECRET_URL }), null, 2),
        'utf-8',
      );
      writeFileSync(path.join(repo.postsDir, 'legit.md'), mdText({ stage: 'preview' }), 'utf-8');
      symlinkSync(path.join(symSideOutsideDir, 'secret.publish.json'), path.join(repo.postsDir, 'legit.publish.json'), 'file');
      symSidePlan = await planBloggerWithdrawals({ repoRoot: repo.root, gitHead: HEX40 });
    } finally {
      try { rmSync(path.join(repo.postsDir, 'legit.publish.json'), { force: true }); } catch { /* ignore */ }
      try { repo.dispose(); } catch { /* ignore */ }
      try { rmSync(symSideOutsideDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  } else {
    skippedOsFixtures.push('S25 symlink-sidecar-to-outside (symlink unsupported)');
  }
  check('S25/S27. symlink sidecar → not read; unsafe-sidecar blocker; no leak', () => {
    if (!SYMLINK_OK) {
      assert.ok(skippedOsFixtures.some((s) => s.startsWith('S25')));
      return;
    }
    const src = 'content/blogger/posts/legit.md';
    assert.ok(!symSidePlan.candidates.some((c) => c.sourcePath === src), 'symlink sidecar must not yield candidate');
    const b = symSidePlan.blockers.find((x) => x.sourcePath === src);
    assert.ok(b, 'symlink sidecar must surface as blocker');
    assert.equal(b.classification, CLASSIFICATION.blockedUnsafeSourcePath);
    assert.deepEqual(b.details, ['unsafe-sidecar-symlink']);
    const j = formatJson(symSidePlan);
    assert.ok(!j.includes('secret.invalid') && !j.includes(SECRET_URL) && !j.includes(symSideOutsideDir));
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // Phase 8：real linked worktree（git worktree add --detach；OS temp；primary 不受污染）
  // ════════════════════════════════════════════════════════════════════════════════
  let lwRan = false;
  let lwCli = null;
  let lwPrimaryHead = null;
  let lwWtDir = null;
  let lwPrimaryJson = null;
  try {
    lwWtDir = newTmp('wt-');
    rmSync(lwWtDir, { recursive: true, force: true }); // `git worktree add` requires a non-existent path
    execFileSync('git', ['-C', PROJECT_ROOT, 'worktree', 'add', '--detach', lwWtDir, 'HEAD'], { stdio: 'ignore' });
    lwPrimaryHead = resolveGitHead(PROJECT_ROOT);
    lwCli = runCliNoHead(lwWtDir, ['--json']); // current planner, repoRoot = linked worktree → real resolveGitHead
    lwPrimaryJson = formatJson(await planBloggerWithdrawals({ repoRoot: PROJECT_ROOT, gitHead: lwPrimaryHead }));
    lwRan = true;
  } catch (e) {
    skippedOsFixtures.push(`real-linked-worktree (${(e && e.code) || 'error'})`);
  } finally {
    if (lwWtDir) {
      try { execFileSync('git', ['-C', PROJECT_ROOT, 'worktree', 'remove', '--force', lwWtDir], { stdio: 'ignore' }); } catch { /* ignore */ }
      try { execFileSync('git', ['-C', PROJECT_ROOT, 'worktree', 'prune'], { stdio: 'ignore' }); } catch { /* ignore */ }
      try { rmSync(lwWtDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }
  const lw = lwRan ? JSON.parse(lwCli.stdout) : null;
  check('LW1. real linked worktree: CLI exit 0 + gitHead full 40-hex matching primary', () => {
    assert.ok(lwRan, 'real linked-worktree fixture must run in a git repo');
    assert.equal(lwCli.status, 0);
    assert.match(lw.gitHead, /^[0-9a-f]{40}$/);
    assert.equal(lw.gitHead, lwPrimaryHead);
  });
  check('LW2. real linked worktree: candidate identity + summary structurally match primary', () => {
    assert.ok(lwRan);
    const primary = JSON.parse(lwPrimaryJson);
    // 結構一致：candidate 路徑 / summary counts / gitHead 全等（證明 linked-worktree gitHead 解析 +
    // 掃描與 primary 等價）。**不**斷言跨 checkout 的 content-byte hash 相等——`git worktree add` 會
    // 重新 checkout，Windows 上 git 會依 core.autocrlf 正規化行尾，使 checkout bytes 與 working tree
    // 不同；此為 git checkout artifact，**非** planner 屬性。
    assert.equal(lw.summary.candidateCount, 1);
    assert.equal(lw.candidates[0].sourcePath, TARGET_SOURCE);
    assert.equal(lw.candidates[0].sidecarPath, TARGET_SIDECAR);
    assert.deepEqual(lw.summary, primary.summary);
    assert.equal(lw.gitHead, primary.gitHead);
    assert.deepEqual(
      lw.candidates.map((c) => c.sourcePath),
      primary.candidates.map((c) => c.sourcePath),
    );
  });
  check('LW3. real linked worktree: output leaks no absolute worktree path / gitdir', () => {
    assert.ok(lwRan);
    assert.ok(!lwCli.stdout.includes(lwWtDir), 'no absolute worktree path in JSON');
    assert.ok(!/gitdir/.test(lwCli.stdout), 'no gitdir token in JSON');
    assert.equal(lwCli.stderr, '');
  });

  // ════════════════════════════════════════════════════════════════════════════════
  // Phase 9：determinism（TZ-independent）+ OS-fixture disclosure
  // ════════════════════════════════════════════════════════════════════════════════
  const tzA = runCliEnv(PROJECT_ROOT, { TZ: 'UTC' });
  const tzB = runCliEnv(PROJECT_ROOT, { TZ: 'Asia/Taipei' });
  check('D-TZ. real repo --json byte-identical under TZ=UTC vs TZ=Asia/Taipei', () => {
    assert.equal(tzA.status, 0);
    assert.equal(tzB.status, 0);
    assert.equal(tzA.stdout, tzB.stdout);
  });
  check('OS-fixture disclosure: skipped OS-specific fixtures are explicitly recorded', () => {
    // 本檢查恆通過；其副作用是在 summary 前印出被略過之 OS-specific fixture（供 final report）。
    if (skippedOsFixtures.length > 0) {
      console.log(`[NOTE] skipped OS-specific fixtures: ${skippedOsFixtures.join('; ')}`);
    } else {
      console.log('[NOTE] no OS-specific fixtures skipped (symlink + junction both exercised)');
    }
    assert.ok(true);
  });
}

main()
  .then(() => {
    const total = cases.length;
    const passed = cases.filter((c) => c.ok).length;
    const failed = total - passed;
    console.log('');
    console.log(`blogger withdrawal plan guard: ${passed}/${total} PASS`);
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.log(`[FATAL] guard harness error — ${err.message}`);
    process.exit(1);
  });
