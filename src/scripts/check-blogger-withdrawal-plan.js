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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync } from 'node:fs';
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
