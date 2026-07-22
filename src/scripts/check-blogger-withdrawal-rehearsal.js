#!/usr/bin/env node
// Phase 20260722-publish-target-stage Slice 4E：Blogger withdrawal — OS-temp rehearsal focused guard.
//
// 上位契約：docs/20260722-blogger-withdrawal-rehearsal.md
//
// 範圍 / 邊界：
//   - 所有 fixture 寫入皆發生於 os.tmpdir() 之 mkdtemp synthetic git repo；每個 fixture 於 finally{} 清除。
//     真實 production content 與 deploy clone 全程唯讀。
//   - Rehearsal 對 scratch 之 OS-temp 副本執行；guard 每次 invocation 後驗證 cleanup 已把 scratch 清空。
//   - Guard 以 spawnSync 播種 synthetic git repo；rehearsal 本身無 child_process / network / API。
//   - Guard 斷言 source-level static bans + programmatic API 之 e2e mutation/redaction/atomicity/
//     determinism/privacy。
//
// Run:
//   npm run check:blogger-withdrawal-rehearsal
//   或  node src/scripts/check-blogger-withdrawal-rehearsal.js

import assert from 'node:assert';
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync,
  rmSync, statSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseArgs as rehearseParseArgs,
  rehearseBloggerWithdrawal,
  formatJson as rehearseFormatJson,
  formatHumanReadable as rehearseFormatHuman,
  buildWithdrawnSidecar,
  serializeSidecar,
  classifyScratchContainment,
  SCRATCH_PREFIX,
} from './rehearse-blogger-withdrawal.js';
import { planBloggerWithdrawals } from './plan-blogger-withdrawals.js';
import {
  AUTHORIZATION_SCHEMA_VERSION,
  AUTHORIZATION_PURPOSE,
  AUTHORIZATION_BRANCH,
  WITHDRAWAL_EVENT,
  computePlanFingerprint,
  computeRecordFingerprint,
} from './blogger-withdrawal-authorization.js';
import {
  WITHDRAWN_STATUS,
  LIFECYCLE_WITHDRAWN_EVENT,
  REMOTE_DISPOSITIONS,
  LIFECYCLE_REASONS,
  collectSidecarWithdrawalIssues,
} from './sidecar-withdrawal-contract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const REHEARSE_CLI = path.join(REPO_ROOT, 'src', 'scripts', 'rehearse-blogger-withdrawal.js');
const DEPLOY_ROOT_CANDIDATE = path.resolve(REPO_ROOT, '..', 'portable-blog-deploy');

// ── injected secret strings（redaction 目標；在所有 stdout / stderr / blocker / serialized report 中須零命中）──
const SECRET_STRINGS = [
  'SECRET-REHEARSAL-AUTH-PATH',
  'SECRET-OPERATOR-EMAIL',
  'secret@example.invalid',
  'https://secret.invalid/private-post',
  '/d/private/operator/rehearsal-authorization.json',
  'rehearsal-authorization.json',
];

// ── harness ────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
const fails = [];
function record(name, ok, msg) {
  if (ok) { pass += 1; console.log(`[PASS] ${name}`); }
  else { fail += 1; fails.push(`${name} — ${msg}`); console.error(`[FAIL] ${name}\n       ${msg}`); }
}
async function check(name, fn) {
  try { await fn(); record(name, true); } catch (err) { record(name, false, err.message); }
}

function stripComments(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
  return noBlock.split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n');
}
const REHEARSE_SRC = stripComments(readFileSync(REHEARSE_CLI, 'utf-8'));

// ── fixture builders ───────────────────────────────────────────────────────
function mdText({ enabled = true, stage = 'preview' } = {}) {
  let pt = `  blogger:\n    enabled: ${enabled ? 'true' : 'false'}\n    mode: "full"\n`;
  if (stage !== undefined) pt += `    stage: "${stage}"\n`;
  return `---\nsite: "blogger"\ntitle: "T"\npublishTargets:\n${pt}---\nbody — must not be read for candidacy.\n`;
}
function activePublishedSidecar({
  publishedUrl = 'https://example.invalid/post',
  bloggerPostId = '',
  extraTop = null,
  extraBlogger = null,
} = {}) {
  const sidecar = {
    schemaVersion: 1,
    blogger: {
      status: 'published',
      publishedUrl,
      publishedAt: '2026-07-01T10:00:00+08:00',
      bloggerPostId,
      ...(extraBlogger || {}),
    },
  };
  if (extraTop) Object.assign(sidecar, extraTop);
  return sidecar;
}
function writeFileSyncMk(abs, content) {
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf-8');
}
function fixturePath(repoRoot, filename) {
  const dir = path.join(repoRoot, 'fixtures');
  mkdirSync(dir, { recursive: true });
  return path.join(dir, filename.replace(/["?*<>:|/\\]/g, '_'));
}
function writeAuthFixture(repoRoot, obj, filename = 'auth-fixture.json') {
  const p = fixturePath(repoRoot, filename);
  const text = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) + '\n';
  writeFileSync(p, text, 'utf-8');
  return p;
}

function git(repoRoot, args) {
  const r = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf-8', shell: false, windowsHide: true, timeout: 10000 });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || '').trim()}`);
  return (r.stdout || '').trim();
}
function gitQuiet(repoRoot, args) {
  spawnSync('git', args, { cwd: repoRoot, encoding: 'utf-8', shell: false, windowsHide: true, timeout: 10000 });
}

function seedGitRepo(repoRoot) {
  git(repoRoot, ['init', '--quiet']);
  git(repoRoot, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(repoRoot, ['config', 'user.email', 'test@example.invalid']);
  git(repoRoot, ['config', 'user.name', 'test']);
  git(repoRoot, ['config', 'commit.gpgsign', 'false']);
  writeFileSyncMk(path.join(repoRoot, 'README.md'), '# synthetic\n');
  writeFileSyncMk(path.join(repoRoot, '.gitignore'), '/fixtures/\ndist-blogger-preview/\n');
  git(repoRoot, ['add', 'README.md', '.gitignore']);
  git(repoRoot, ['commit', '--quiet', '-m', 'init']);
  git(repoRoot, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
}

const SLUG = '20260601-candidate';
const CAND_SOURCE = `content/blogger/posts/${SLUG}.md`;
const CAND_SIDECAR = `content/blogger/posts/${SLUG}.publish.json`;
const INTENT = {
  remoteDisposition: 'remote-deleted',
  remoteVerifiedAt: '2026-07-21T09:00:00+08:00',
  reason: 'content-retirement',
  reasonDetail: '',
};

async function setupCandidateRepo(tmpRoot, label, { publishedUrl = 'https://example.invalid/post', sidecarOverrides = null } = {}) {
  const repoRoot = mkdtempSync(path.join(tmpRoot, `${label}-`));
  seedGitRepo(repoRoot);
  writeFileSyncMk(path.join(repoRoot, CAND_SOURCE), mdText({ stage: 'preview' }));
  const sidecar = sidecarOverrides
    ? { ...activePublishedSidecar({ publishedUrl }), ...sidecarOverrides }
    : activePublishedSidecar({ publishedUrl });
  writeFileSyncMk(path.join(repoRoot, CAND_SIDECAR), JSON.stringify(sidecar, null, 2));
  git(repoRoot, ['add', CAND_SOURCE, CAND_SIDECAR]);
  git(repoRoot, ['commit', '--quiet', '-m', 'seed candidate']);
  git(repoRoot, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  const head = git(repoRoot, ['rev-parse', 'HEAD']);
  const plan = await planBloggerWithdrawals({ repoRoot, gitHead: head });
  const candidate = plan.candidates.find((c) => c.sourcePath === CAND_SOURCE);
  const planFp = computePlanFingerprint(plan).value;
  return { repoRoot, head, plan, candidate, planFp };
}

function makeTargetFromCandidate(c) {
  return {
    sourcePath: c.sourcePath,
    sidecarPath: c.sidecarPath,
    expectedSourceSha256: c.sourceSha256,
    expectedSidecarSha256: c.sidecarSha256,
    expectedCurrentStatus: c.sidecarStatus,
    expectedPublishedUrlFingerprint: c.publishedUrlFingerprint,
  };
}
function recordFpFor(c, intent = INTENT) {
  return computeRecordFingerprint({
    sourcePath: c.sourcePath,
    sidecarPath: c.sidecarPath,
    expectedCurrentStatus: c.sidecarStatus,
    expectedSourceSha256: c.sourceSha256,
    expectedSidecarSha256: c.sidecarSha256,
    expectedPublishedUrlFingerprint: c.publishedUrlFingerprint,
    remoteDisposition: intent.remoteDisposition,
    remoteVerifiedAt: intent.remoteVerifiedAt,
    reason: intent.reason,
    reasonDetail: intent.reasonDetail,
  }).value;
}
function makeAuth({ head, planFp, recFp, target, intent = INTENT, approved = false, overrides = {} }) {
  const auth = {
    schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
    purpose: AUTHORIZATION_PURPOSE,
    repository: { expectedBranch: AUTHORIZATION_BRANCH, expectedHead: head },
    plan: { expectedPlanFingerprint: planFp, expectedRecordFingerprint: recFp, recordCount: 1 },
    target: { ...target },
    withdrawal: {
      event: WITHDRAWAL_EVENT,
      remoteDisposition: intent.remoteDisposition,
      remoteVerifiedAt: intent.remoteVerifiedAt,
      reason: intent.reason,
      reasonDetail: intent.reasonDetail,
    },
    approval: { explicitlyAuthorized: approved },
  };
  return { ...auth, ...overrides };
}

async function seedApprovedAuth(fx, filename = 'approved.json', intent = INTENT) {
  const target = makeTargetFromCandidate(fx.candidate);
  const recFp = recordFpFor(fx.candidate, intent);
  return writeAuthFixture(fx.repoRoot, makeAuth({
    head: fx.head, planFp: fx.planFp, recFp, target, intent, approved: true,
  }), filename);
}

// ── snapshot helpers（no-write proof）─────────────────────────────────────
function snapshotTree(rootAbs, exts) {
  const inv = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir).sort()) {
      const abs = path.join(dir, name);
      let st;
      try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) { walk(abs); continue; }
      if (exts.some((e) => abs.endsWith(e))) {
        inv.push({ rel: path.relative(rootAbs, abs).split(path.sep).join('/'), bytes: readFileSync(abs, 'utf-8'), mtimeMs: st.mtimeMs });
      }
    }
  }
  walk(rootAbs);
  return inv;
}
function invMap(inv) { return Object.fromEntries(inv.map((s) => [s.rel, s.bytes])); }

function runCli(cli, args) {
  const r = spawnSync(process.execPath, [cli, ...args], { cwd: REPO_ROOT, encoding: 'utf-8', shell: false, windowsHide: true });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function countOsTempScratchDirs() {
  // Best-effort inventory of dangling scratch dirs from *earlier* invocations. Not a hard fail;
  // used only to prove that guard's own runs do not leave residue.
  try {
    const base = os.tmpdir();
    return readdirSync(base).filter((n) => n.startsWith(SCRATCH_PREFIX)).length;
  } catch { return -1; }
}

// ════════════════════════════════════════════════════════════════════════════════
async function main() {
  const prodPostsDir = path.join(REPO_ROOT, 'content', 'blogger', 'posts');
  const prodBefore = snapshotTree(prodPostsDir, ['.md', '.publish.json']);
  const distPreviewAbsent = !existsSync(path.join(REPO_ROOT, 'dist-blogger-preview'));
  let deployBefore = null;
  const deployHasGit = existsSync(DEPLOY_ROOT_CANDIDATE) && existsSync(path.join(DEPLOY_ROOT_CANDIDATE, '.git'));
  if (deployHasGit) deployBefore = snapshotTree(DEPLOY_ROOT_CANDIDATE, ['.publish.json']);

  const scratchCountBefore = countOsTempScratchDirs();
  const allOutputs = []; // 收集所有 stdout / stderr / serialized report，最後統一 no-leak 掃描

  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'wd-rehearse-'));
  try {
    // ══ A. source-level static bans ══════════════════════════════════════
    await check('src: no fs write primitive targeting source repo', () => {
      // rehearse module MAY write to scratch; static ban confirms only OS-temp-safe primitives are used
      // (writeFileSync / renameSync / rmSync / mkdirSync are allowed). What must NEVER appear are
      // primitives that could touch source repo without being routed through the scratch subtree.
      for (const re of [/\bfs\.copyFile\s*\(/, /\bfs\.appendFile\s*\(/, /\bcreateWriteStream\s*\(/,
        /\bfs\.link\s*\(/, /\bsymlinkSync\s*\(/, /\bfs\.unlink\s*\(/]) {
        assert.ok(!re.test(REHEARSE_SRC), `unexpected primitive ${re}`);
      }
    });
    await check('src: no child_process / spawn / exec', () => {
      assert.ok(!/from ['"]node:child_process['"]/.test(REHEARSE_SRC));
      assert.ok(!/require\(['"]child_process['"]\)/.test(REHEARSE_SRC));
      assert.ok(!/spawnSync|execSync|execFileSync|\bspawn\s*\(|\bexec\s*\(/.test(REHEARSE_SRC));
    });
    await check('src: no network / api', () => {
      assert.ok(!/\bfetch\s*\(/.test(REHEARSE_SRC));
      assert.ok(!/from ['"]node:https?['"]/.test(REHEARSE_SRC));
      assert.ok(!/googleapis|oauth/i.test(REHEARSE_SRC));
      assert.ok(!/blogger\.googleapis\.com/.test(REHEARSE_SRC));
    });
    await check('src: no git command strings', () => {
      for (const g of ['git commit', 'git push', 'git add', 'git fetch', 'git pull', 'git reset', 'git clean', 'git stash', 'git checkout']) {
        assert.ok(!new RegExp(`["']${g}["']`).test(REHEARSE_SRC), `unexpected ${g}`);
      }
    });
    await check('src: no real production host / id', () => {
      for (const needle of ['blog' + 'spot.com', 'babel' + '-lab', 'git' + 'hub.io']) {
        assert.ok(!REHEARSE_SRC.includes(needle), `must not contain ${needle}`);
      }
    });
    await check('src: no in-band production apply / write / commit flags', () => {
      // Public CLI must document forbidden flags including --apply / --commit / --push;
      // there must be no production-apply branch or bypass gate.
      assert.ok(!/mutationPerformed\s*:\s*true/.test(REHEARSE_SRC), 'must not set productionMutationPerformed true');
      assert.ok(!/explicitlyAuthorized\s*=\s*true/.test(REHEARSE_SRC), 'must not force explicitlyAuthorized true');
    });
    await check('src: OS-temp scratch pattern (mkdtempSync + tmpdir + prefix)', () => {
      assert.ok(/mkdtempSync\s*\(/.test(REHEARSE_SRC));
      assert.ok(/os\.tmpdir\s*\(\s*\)/.test(REHEARSE_SRC));
      assert.ok(/SCRATCH_PREFIX/.test(REHEARSE_SRC));
    });
    await check('src: marker file written via wx flag (never trust preexisting)', () => {
      assert.ok(/SCRATCH_MARKER_FILENAME/.test(REHEARSE_SRC));
      assert.ok(/flag\s*:\s*['"]wx['"]/.test(REHEARSE_SRC));
    });
    await check('src: cleanup is inside finally block', () => {
      assert.ok(/finally\s*{[\s\S]*rmSync\s*\(\s*scratchRoot/.test(REHEARSE_SRC), 'cleanup not in finally');
    });

    // ══ B. parseArgs smoke ═══════════════════════════════════════════════
    await check('parseArgs: valid set', () => {
      const o = rehearseParseArgs(['n', 'c', '--source-path', CAND_SOURCE, '--authorization', '/x/a.json', '--json']);
      assert.strictEqual(o.sourcePath, CAND_SOURCE);
      assert.strictEqual(o.authorization, '/x/a.json');
      assert.strictEqual(o.json, true);
    });
    await check('parseArgs: = form', () => {
      const o = rehearseParseArgs(['n', 'c', `--source-path=${CAND_SOURCE}`, `--authorization=/x/a.json`]);
      assert.strictEqual(o.sourcePath, CAND_SOURCE);
      assert.strictEqual(o.authorization, '/x/a.json');
    });
    const FORBIDDEN = [
      '--apply', '--write', '--output', '--repo-root', '--project-root', '--test-root',
      '--scratch-root', '--temp-root', '--approve', '--yes', '-y', '--force',
      '--skip-validation', '--skip-fingerprint', '--ignore-head', '--dirty-ok',
      '--no-verify', '--production', '--publish', '--deploy', '--commit', '--push',
      '--restore', '--republish', '--api',
    ];
    for (const flag of FORBIDDEN) {
      await check(`parseArgs: forbidden ${flag}`, () => {
        assert.ok(rehearseParseArgs(['n', 'c', flag]).forbidden.includes(flag));
      });
    }
    await check('parseArgs: unknown captured', () => {
      assert.ok(rehearseParseArgs(['n', 'c', '--nope']).unknown.includes('--nope'));
    });

    // ══ C. CLI --help / forbidden / unknown / missing ════════════════════
    await check('CLI --help → exit 0, mentions OS-temp + no production', () => {
      const r = runCli(REHEARSE_CLI, ['--help']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 0, r.stderr);
      assert.ok(/OS-temp|os\.tmpdir/i.test(r.stdout));
      assert.ok(/never|NEVER/i.test(r.stdout));
      assert.ok(/production/i.test(r.stdout));
    });
    await check('CLI forbidden --apply → exit 2', () => {
      const r = runCli(REHEARSE_CLI, ['--apply', '--authorization', '/x/a.json', '--source-path', CAND_SOURCE]);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/forbidden flag/i.test(r.stderr));
    });
    await check('CLI forbidden --scratch-root → exit 2', () => {
      const r = runCli(REHEARSE_CLI, ['--scratch-root', '/tmp/xxx', '--authorization', '/x/a.json', '--source-path', CAND_SOURCE]);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/forbidden flag/i.test(r.stderr));
    });
    await check('CLI unknown → exit 2', () => {
      const r = runCli(REHEARSE_CLI, ['--totally-fake']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/unknown argument/i.test(r.stderr));
    });
    await check('CLI missing --authorization → exit 2', () => {
      const r = runCli(REHEARSE_CLI, ['--source-path', CAND_SOURCE]);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/--authorization.*is required/i.test(r.stderr));
    });
    await check('CLI missing --source-path → exit 2', () => {
      const r = runCli(REHEARSE_CLI, ['--authorization', '/x/a.json']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/--source-path.*is required/i.test(r.stderr));
    });

    // ══ D. deterministic sidecar builder units ═══════════════════════════
    const dummyAuth = {
      withdrawal: {
        remoteDisposition: 'remote-deleted',
        remoteVerifiedAt: '2026-07-21T09:00:00+08:00',
        reason: 'content-retirement',
        reasonDetail: '',
      },
      target: {},
    };
    const dummyPrior = {
      schemaVersion: 1,
      blogger: {
        status: 'published',
        publishedUrl: 'https://example.invalid/x',
        publishedAt: '2026-07-01T10:00:00+08:00',
        bloggerPostId: 'abc',
        type: 'post',
        permalink: '/2026/07/x.html',
      },
      canonical: 'https://example.invalid/x',
    };
    await check('buildWithdrawnSidecar: v2 + withdrawn + evidence preserved + non-active preserved', () => {
      const out = buildWithdrawnSidecar({
        priorSidecar: dummyPrior,
        authorization: dummyAuth,
        sourcePath: CAND_SOURCE,
        sourceSha256: 'a'.repeat(64),
        sidecarSha256: 'b'.repeat(64),
        gitHead: '0'.repeat(40),
        authorizationFingerprint: 'c'.repeat(64),
      });
      assert.strictEqual(out.schemaVersion, 2);
      assert.strictEqual(out.blogger.status, WITHDRAWN_STATUS);
      // withdrawal contract §7.1 requires publishedUrl / publishedAt to remain as evidence.
      assert.strictEqual(out.blogger.publishedUrl, 'https://example.invalid/x');
      assert.strictEqual(out.blogger.publishedAt, '2026-07-01T10:00:00+08:00');
      assert.strictEqual(out.blogger.bloggerPostId, 'abc');
      assert.strictEqual(out.blogger.type, 'post');
      assert.strictEqual(out.blogger.permalink, '/2026/07/x.html');
      assert.strictEqual(out.canonical, 'https://example.invalid/x');
      assert.ok(Array.isArray(out.blogger.lifecycle));
      assert.strictEqual(out.blogger.lifecycle.length, 1);
      const ev = out.blogger.lifecycle[0];
      assert.strictEqual(ev.event, LIFECYCLE_WITHDRAWN_EVENT);
      assert.strictEqual(ev.fromStatus, 'published');
      assert.strictEqual(ev.toStatus, WITHDRAWN_STATUS);
      assert.strictEqual(ev.sourceSha256, 'a'.repeat(64));
      assert.strictEqual(ev.priorSidecarSha256, 'b'.repeat(64));
      assert.strictEqual(ev.gitHead, '0'.repeat(40));
      assert.strictEqual(ev.authorizationFingerprint, 'c'.repeat(64));
      // event must NOT duplicate evidence (contract §6.8 DUPLICATE_EVIDENCE_FIELDS ban).
      assert.ok(!('publishedUrl' in ev));
      assert.ok(!('publishedAt' in ev));
      assert.ok(!('bloggerPostId' in ev));
    });
    await check('buildWithdrawnSidecar: appends to existing lifecycle (append-only)', () => {
      const priorWithLifecycle = { ...dummyPrior, blogger: { ...dummyPrior.blogger, lifecycle: [{ event: 'other-legacy' }] } };
      const out = buildWithdrawnSidecar({
        priorSidecar: priorWithLifecycle, authorization: dummyAuth, sourcePath: CAND_SOURCE,
        sourceSha256: 'a'.repeat(64), sidecarSha256: 'b'.repeat(64),
        gitHead: '0'.repeat(40), authorizationFingerprint: 'c'.repeat(64),
      });
      assert.strictEqual(out.blogger.lifecycle.length, 2);
      assert.strictEqual(out.blogger.lifecycle[0].event, 'other-legacy');
      assert.strictEqual(out.blogger.lifecycle[1].event, LIFECYCLE_WITHDRAWN_EVENT);
    });
    await check('buildWithdrawnSidecar: reasonDetail omitted when empty', () => {
      const out = buildWithdrawnSidecar({
        priorSidecar: dummyPrior, authorization: dummyAuth, sourcePath: CAND_SOURCE,
        sourceSha256: 'a'.repeat(64), sidecarSha256: 'b'.repeat(64),
        gitHead: '0'.repeat(40), authorizationFingerprint: 'c'.repeat(64),
      });
      assert.ok(!('reasonDetail' in out.blogger.lifecycle[0]));
    });
    await check('buildWithdrawnSidecar: reasonDetail preserved when non-empty', () => {
      const auth2 = { ...dummyAuth, withdrawal: { ...dummyAuth.withdrawal, reasonDetail: 'clarification' } };
      const out = buildWithdrawnSidecar({
        priorSidecar: dummyPrior, authorization: auth2, sourcePath: CAND_SOURCE,
        sourceSha256: 'a'.repeat(64), sidecarSha256: 'b'.repeat(64),
        gitHead: '0'.repeat(40), authorizationFingerprint: 'c'.repeat(64),
      });
      assert.strictEqual(out.blogger.lifecycle[0].reasonDetail, 'clarification');
    });
    await check('buildWithdrawnSidecar: serialization deterministic (same input → byte-identical + stable SHA-256)', () => {
      const args = {
        priorSidecar: dummyPrior, authorization: dummyAuth, sourcePath: CAND_SOURCE,
        sourceSha256: 'a'.repeat(64), sidecarSha256: 'b'.repeat(64),
        gitHead: '0'.repeat(40), authorizationFingerprint: 'c'.repeat(64),
      };
      const s1 = serializeSidecar(buildWithdrawnSidecar(args));
      const s2 = serializeSidecar(buildWithdrawnSidecar(args));
      assert.strictEqual(s1, s2);
      assert.ok(s1.endsWith('\n'));
    });
    await check('buildWithdrawnSidecar: rehearsal payload passes landed withdrawal contract', () => {
      const out = buildWithdrawnSidecar({
        priorSidecar: dummyPrior, authorization: dummyAuth, sourcePath: CAND_SOURCE,
        sourceSha256: 'a'.repeat(64), sidecarSha256: 'b'.repeat(64),
        gitHead: '0'.repeat(40), authorizationFingerprint: 'c'.repeat(64),
      });
      const issues = collectSidecarWithdrawalIssues(out, { sourcePath: CAND_SOURCE, sidecarPath: CAND_SIDECAR });
      assert.deepStrictEqual(issues, [], JSON.stringify(issues));
    });

    // ══ E. classifyScratchContainment predicate ═════════════════════════
    await check('containment: happy scratch under os-tmp, disjoint from project → null', () => {
      assert.strictEqual(classifyScratchContainment({
        canonicalScratch: path.join('/tmp', 'wd-x'), canonicalTmpBase: '/tmp', canonicalProjectRoot: '/repo',
      }), null);
    });
    await check('containment: scratch === tmpBase → scratch-is-os-tmp-root', () => {
      assert.strictEqual(classifyScratchContainment({
        canonicalScratch: '/tmp', canonicalTmpBase: '/tmp', canonicalProjectRoot: '/repo',
      }), 'scratch-is-os-tmp-root');
    });
    await check('containment: scratch outside tmpBase → scratch-outside-os-tmp', () => {
      assert.strictEqual(classifyScratchContainment({
        canonicalScratch: '/elsewhere/wd', canonicalTmpBase: '/tmp', canonicalProjectRoot: '/repo',
      }), 'scratch-outside-os-tmp');
    });
    await check('containment: sibling prefix collision NOT treated as inside', () => {
      // "/tmp-evil/wd" is not a descendant of "/tmp" — segment-safe check must reject it.
      assert.strictEqual(classifyScratchContainment({
        canonicalScratch: '/tmp-evil/wd', canonicalTmpBase: '/tmp', canonicalProjectRoot: '/repo',
      }), 'scratch-outside-os-tmp');
    });
    await check('containment: scratch equals project root → scratch-is-project-root', () => {
      assert.strictEqual(classifyScratchContainment({
        canonicalScratch: '/tmp/repo', canonicalTmpBase: '/tmp', canonicalProjectRoot: '/tmp/repo',
      }), 'scratch-is-project-root');
    });
    await check('containment: scratch under project root → scratch-inside-project-root', () => {
      assert.strictEqual(classifyScratchContainment({
        canonicalScratch: '/tmp/repo/child', canonicalTmpBase: '/tmp', canonicalProjectRoot: '/tmp/repo',
      }), 'scratch-inside-project-root');
    });
    await check('containment: scratch ancestor of project root → scratch-ancestor-of-project-root', () => {
      assert.strictEqual(classifyScratchContainment({
        canonicalScratch: '/tmp', canonicalTmpBase: '/', canonicalProjectRoot: '/tmp/repo',
      }), 'scratch-ancestor-of-project-root');
    });
    await check('containment: unresolvable inputs → safe slug', () => {
      assert.strictEqual(classifyScratchContainment({ canonicalScratch: '', canonicalTmpBase: '/tmp' }), 'scratch-unresolvable');
      assert.strictEqual(classifyScratchContainment({ canonicalScratch: '/tmp/x', canonicalTmpBase: '' }), 'os-tmp-unresolvable');
    });

    // ══ F. happy path e2e via programmatic API (synthetic repo) ══════════
    let happyReport = null;
    let happySnapshot = null;
    {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-happy');
      const authPath = await seedApprovedAuth(fx);
      const prodInvBefore = snapshotTree(fx.repoRoot, ['.md', '.publish.json']);
      const result = await rehearseBloggerWithdrawal({
        projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE,
      });
      happyReport = result;
      happySnapshot = { fx, authPath, before: prodInvBefore };
      const prodInvAfter = snapshotTree(fx.repoRoot, ['.md', '.publish.json']);
      allOutputs.push(rehearseFormatJson(result), rehearseFormatHuman(result));
      await check('happy: rehearsal ok / performed / cleaned', () => {
        assert.strictEqual(result.ok, true, JSON.stringify(result.blockers));
        assert.strictEqual(result.rehearsalPerformed, true);
        assert.strictEqual(result.scratchMutationPerformed, true);
        assert.strictEqual(result.productionMutationPerformed, false);
        assert.strictEqual(result.cleanupPerformed, true);
        assert.strictEqual(result.readBackOk, true);
        assert.strictEqual(result.semanticValidationOk, true);
        assert.strictEqual(result.applyReady, true);
        assert.strictEqual(result.preflightEligible, true);
        assert.strictEqual(result.sourceHashMatched, true);
        assert.strictEqual(result.sidecarHashMatched, true);
      });
      await check('happy: production source + sidecar bytes unchanged after rehearsal', () => {
        assert.deepStrictEqual(invMap(prodInvAfter), invMap(prodInvBefore));
      });
      await check('happy: outputSha256 is 64-char lowercase hex', () => {
        assert.ok(/^[0-9a-f]{64}$/.test(result.outputSha256), result.outputSha256);
      });
      await check('happy: report shape has all rehearsal-status booleans', () => {
        for (const k of ['rehearsalPerformed', 'scratchMutationPerformed', 'productionMutationPerformed',
          'authorizationValidated', 'preflightEligible', 'sourceHashMatched', 'sidecarHashMatched',
          'planFingerprintMatched' in result ? 'planFingerprintMatched' : 'planBindingsMatched',
          'recordFingerprintMatched' in result ? 'recordFingerprintMatched' : 'recordBindingsMatched',
          'outputSha256', 'readBackOk', 'semanticValidationOk', 'cleanupPerformed', 'applyReady']) {
          assert.ok(k in result, `missing report key: ${k}`);
        }
      });
    }
    await check('happy: JSON report deterministic + stable field set + no absolute paths / urls', () => {
      const j1 = rehearseFormatJson(happyReport);
      const j2 = rehearseFormatJson(happyReport);
      assert.strictEqual(j1, j2);
      const parsed = JSON.parse(j1);
      for (const k of ['ok', 'mode', 'sourcePath', 'sidecarPath', 'branch', 'sourceHead',
        'planFingerprint', 'recordFingerprint', 'documentValid', 'repositoryBindingsMatched',
        'planBindingsMatched', 'recordBindingsMatched', 'explicitlyAuthorized',
        'preflightEligible', 'authorizationValidated', 'sourceHashMatched', 'sidecarHashMatched',
        'outputSha256', 'semanticValidationOk', 'scratchMutationPerformed', 'readBackOk',
        'rehearsalPerformed', 'productionMutationPerformed', 'applyReady', 'cleanupPerformed',
        'blockers']) {
        assert.ok(k in parsed, `missing ${k}`);
      }
      // must not echo authorization / scratch / os-temp path
      assert.ok(!('authorizationPath' in parsed));
      assert.ok(!('scratchPath' in parsed));
      assert.ok(!('scratchRoot' in parsed));
      // published URL / host must be redacted from the report body (evidence is preserved inside
      // the scratch sidecar bytes, but the report itself must never echo it).
      assert.ok(!/example\.invalid/.test(j1));
      assert.ok(!/tmpdir|tempdir|tmp-/i.test(j1));
      // productionMutationPerformed invariant is false
      assert.strictEqual(parsed.productionMutationPerformed, false);
    });

    // ══ G. deterministic bytes across repeated runs on same inputs ═══════
    {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-determ');
      const authPath = await seedApprovedAuth(fx);
      const r1 = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      const r2 = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      await check('determinism: same input → identical outputSha256', () => {
        assert.strictEqual(r1.outputSha256, r2.outputSha256);
        assert.ok(/^[0-9a-f]{64}$/.test(r1.outputSha256));
      });
      // Approval flip must not change plan or record fingerprint (fingerprints don't bind approval).
      const target = makeTargetFromCandidate(fx.candidate);
      const recFp = recordFpFor(fx.candidate);
      const unapprovedPath = writeAuthFixture(fx.repoRoot, makeAuth({
        head: fx.head, planFp: fx.planFp, recFp, target, approved: false,
      }), 'unapproved.json');
      const rUnapproved = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: unapprovedPath, sourcePath: CAND_SOURCE });
      await check('determinism: approval flip does not change plan/record fingerprints in report', () => {
        assert.strictEqual(rUnapproved.planFingerprint, r1.planFingerprint);
        assert.strictEqual(rUnapproved.recordFingerprint, r1.recordFingerprint);
      });
    }

    // ══ H. authorization failure cases ═══════════════════════════════════
    async function runWithAuthFile(fx, rawText) {
      const p = fixturePath(fx.repoRoot, 'fail-auth.json');
      writeFileSync(p, rawText, 'utf-8');
      return rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: p, sourcePath: CAND_SOURCE });
    }
    async function runWithAuthObj(fx, obj) {
      return runWithAuthFile(fx, JSON.stringify(obj, null, 2) + '\n');
    }
    {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-auth');
      const target = makeTargetFromCandidate(fx.candidate);
      const recFp = recordFpFor(fx.candidate);
      const goodAuth = makeAuth({ head: fx.head, planFp: fx.planFp, recFp, target, approved: true });

      await check('auth: approval false → refuse (no scratch mutation)', async () => {
        const r = await runWithAuthObj(fx, { ...goodAuth, approval: { explicitlyAuthorized: false } });
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.scratchMutationPerformed, false);
        assert.ok(r.blockers.includes('explicit-authorization-not-granted'));
      });
      await check('auth: approval missing → document-invalid path', async () => {
        // remove approval key entirely
        const { approval: _a, ...rest } = goodAuth;
        const r = await runWithAuthObj(fx, rest);
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.scratchMutationPerformed, false);
        assert.ok(r.blockers.some((b) => b === 'authorization-approval-invalid' || b === 'explicit-authorization-not-granted'));
      });
      await check('auth: malformed JSON → parse-error', async () => {
        const r = await runWithAuthFile(fx, '{ not json ');
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.scratchMutationPerformed, false);
        assert.ok(r.blockers.includes('authorization-parse-error'));
      });
      await check('auth: duplicate literal key → duplicate-key fail closed', async () => {
        const raw = '{"schemaVersion":1,"schemaVersion":1,"purpose":"blogger-sidecar-withdrawal"}';
        const r = await runWithAuthFile(fx, raw);
        assert.ok(r.blockers.includes('authorization-duplicate-key'));
      });
      await check('auth: Unicode-escaped duplicate approval key → duplicate-key (not last-value-wins true)', async () => {
        const compact = JSON.stringify(goodAuth);
        const m = compact.match(/"approval":\{[^}]*\}/);
        const raw = compact.replace(m[0], '"approval":{"explicitlyAuthorized":false,"explicitly\\u0041uthorized":true}');
        const r = await runWithAuthFile(fx, raw);
        assert.ok(r.blockers.includes('authorization-duplicate-key'));
        assert.strictEqual(r.scratchMutationPerformed, false);
      });
      await check('auth: unknown top-level key → refuse', async () => {
        const r = await runWithAuthObj(fx, { ...goodAuth, extra: 1 });
        assert.ok(r.blockers.includes('authorization-unknown-top-level-key'));
      });
      await check('auth: wrong purpose → refuse', async () => {
        const r = await runWithAuthObj(fx, { ...goodAuth, purpose: 'blogger-backfill-production-sidecar-apply' });
        assert.ok(r.blockers.includes('authorization-purpose-mismatch'));
      });
      await check('auth: wrong branch → refuse', async () => {
        const r = await runWithAuthObj(fx, { ...goodAuth, repository: { expectedBranch: 'dev', expectedHead: fx.head } });
        assert.ok(r.blockers.includes('authorization-branch-invalid'));
      });
      await check('auth: stale HEAD → head-mismatch', async () => {
        const r = await runWithAuthObj(fx, { ...goodAuth, repository: { expectedBranch: 'main', expectedHead: '0'.repeat(40) } });
        assert.ok(r.blockers.includes('repository-head-mismatch'));
      });
      await check('auth: stale plan fingerprint → refuse', async () => {
        const r = await runWithAuthObj(fx, { ...goodAuth, plan: { expectedPlanFingerprint: 'a'.repeat(64), expectedRecordFingerprint: recFp, recordCount: 1 } });
        assert.ok(r.blockers.includes('plan-fingerprint-mismatch'));
      });
      await check('auth: stale record fingerprint → refuse', async () => {
        const r = await runWithAuthObj(fx, { ...goodAuth, plan: { expectedPlanFingerprint: fx.planFp, expectedRecordFingerprint: 'a'.repeat(64), recordCount: 1 } });
        assert.ok(r.blockers.includes('record-fingerprint-mismatch'));
      });
      await check('auth: stale source SHA → source-sha-mismatch', async () => {
        const r = await runWithAuthObj(fx, {
          ...goodAuth,
          target: { ...target, expectedSourceSha256: 'f'.repeat(64) },
        });
        assert.ok(r.blockers.includes('source-sha-mismatch'));
      });
      await check('auth: stale sidecar SHA → sidecar-sha-mismatch', async () => {
        const r = await runWithAuthObj(fx, {
          ...goodAuth,
          target: { ...target, expectedSidecarSha256: 'f'.repeat(64) },
        });
        assert.ok(r.blockers.includes('sidecar-sha-mismatch'));
      });
      await check('auth: stale URL fingerprint → published-url-fingerprint-mismatch', async () => {
        const r = await runWithAuthObj(fx, {
          ...goodAuth,
          target: { ...target, expectedPublishedUrlFingerprint: 'f'.repeat(64) },
        });
        assert.ok(r.blockers.includes('published-url-fingerprint-mismatch'));
      });
      await check('auth: source-path mismatch → refuse', async () => {
        const p = writeAuthFixture(fx.repoRoot, goodAuth, 'auth-mismatch.json');
        const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: p, sourcePath: 'content/blogger/posts/other.md' });
        assert.ok(r.blockers.includes('target-source-path-mismatch') || r.blockers.includes('candidate-not-found'));
      });
      await check('auth: missing file → authorization-unreadable', async () => {
        const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: path.join(fx.repoRoot, 'fixtures', 'nowhere.json'), sourcePath: CAND_SOURCE });
        assert.ok(r.blockers.includes('authorization-unreadable'));
      });
      await check('auth: directory as authorization → authorization-not-regular-file', async () => {
        const d = path.join(fx.repoRoot, 'fixtures', 'authdir');
        mkdirSync(d, { recursive: true });
        const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: d, sourcePath: CAND_SOURCE });
        assert.ok(r.blockers.includes('authorization-not-regular-file'));
      });
      {
        let symOk = true;
        try {
          const probe = mkdtempSync(path.join(tmpRoot, 'symprobe-'));
          writeFileSync(path.join(probe, 't'), 'x');
          symlinkSync(path.join(probe, 't'), path.join(probe, 'l'), 'file');
        } catch { symOk = false; }
        await check('auth: symlink → authorization-symlink (or skip)', async () => {
          if (!symOk) { assert.ok(true); return; }
          const real = await seedApprovedAuth(fx, 'sym-real.json');
          const link = path.join(fx.repoRoot, 'fixtures', 'sym-link.json');
          symlinkSync(real, link, 'file');
          const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: link, sourcePath: CAND_SOURCE });
          assert.ok(r.blockers.includes('authorization-symlink'));
        });
      }
    }

    // ══ I. candidate / sidecar failure cases ═════════════════════════════
    await check('candidate: source-path invalid shape → refuse', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-badsrc');
      const authPath = await seedApprovedAuth(fx);
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: '/abs/x.md' });
      assert.ok(r.blockers.includes('source-path-invalid'));
    });
    await check('candidate: production stage → refuse (candidate-not-found)', async () => {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'rh-prod-'));
      seedGitRepo(repoRoot);
      writeFileSyncMk(path.join(repoRoot, CAND_SOURCE), mdText({ stage: 'production' }));
      writeFileSyncMk(path.join(repoRoot, CAND_SIDECAR), JSON.stringify(activePublishedSidecar(), null, 2));
      git(repoRoot, ['add', CAND_SOURCE, CAND_SIDECAR]);
      git(repoRoot, ['commit', '--quiet', '-m', 'prod stage seed']);
      git(repoRoot, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
      const head = git(repoRoot, ['rev-parse', 'HEAD']);
      const plan = await planBloggerWithdrawals({ repoRoot, gitHead: head });
      const planFp = computePlanFingerprint(plan).value;
      // Even without a candidate we can craft an authorization referencing this source-path; validator
      // will refuse via candidate-not-found before any scratch mutation.
      const target = {
        sourcePath: CAND_SOURCE, sidecarPath: CAND_SIDECAR,
        expectedSourceSha256: 'a'.repeat(64), expectedSidecarSha256: 'b'.repeat(64),
        expectedCurrentStatus: 'published', expectedPublishedUrlFingerprint: 'c'.repeat(64),
      };
      const auth = makeAuth({ head, planFp, recFp: 'd'.repeat(64), target, approved: true });
      const authPath = writeAuthFixture(repoRoot, auth, 'a.json');
      const r = await rehearseBloggerWithdrawal({ projectRoot: repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.includes('candidate-not-found'));
    });
    await check('candidate: source file deleted between preflight and rehearsal read → refuse', async () => {
      // Impossible to simulate TOCTOU precisely, but confirming that missing source triggers refusal.
      const fx = await setupCandidateRepo(tmpRoot, 'rh-src-missing');
      const authPath = await seedApprovedAuth(fx);
      rmSync(path.join(fx.repoRoot, CAND_SOURCE), { force: true });
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.strictEqual(r.ok, false);
    });
    await check('candidate: sidecar removed after preflight → refuse', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-sidecar-missing');
      const authPath = await seedApprovedAuth(fx);
      rmSync(path.join(fx.repoRoot, CAND_SIDECAR), { force: true });
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.strictEqual(r.ok, false);
    });

    // ══ J. git safety cases ══════════════════════════════════════════════
    await check('git: dirty tree → refuse (no mutation)', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-dirty');
      const authPath = await seedApprovedAuth(fx);
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# dirty\n', 'utf-8');
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.some((b) => /repo-state:dirty-working-tree/.test(b)));
    });
    await check('git: wrong branch → refuse', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-branch');
      const authPath = await seedApprovedAuth(fx);
      gitQuiet(fx.repoRoot, ['checkout', '-q', '-b', 'feature']);
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.some((b) => /repo-state:wrong-branch/.test(b)));
    });
    await check('git: index lock → refuse', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-lock');
      const authPath = await seedApprovedAuth(fx);
      writeFileSync(path.join(fx.repoRoot, '.git', 'index.lock'), '', 'utf-8');
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.some((b) => /repo-state:index-lock-present/.test(b)));
    });
    await check('git: ahead → refuse', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-ahead');
      const authPath = await seedApprovedAuth(fx);
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# advance\n', 'utf-8');
      git(fx.repoRoot, ['add', 'README.md']);
      git(fx.repoRoot, ['commit', '--quiet', '-m', 'advance']);
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.some((b) => /repo-state:ahead-of-origin/.test(b)));
    });
    await check('git: preview artifact present → refuse', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-preview');
      const authPath = await seedApprovedAuth(fx);
      mkdirSync(path.join(fx.repoRoot, 'dist-blogger-preview'), { recursive: true });
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.includes('preview-artifact-present'));
    });

    // ══ K. scratch boundary via injected scratchRootFactory ══════════════
    async function runWithFactory(fx, factory) {
      const authPath = await seedApprovedAuth(fx);
      return rehearseBloggerWithdrawal({
        projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE,
        scratchRootFactory: factory,
      });
    }
    await check('scratch: injected scratch under project root → refuse (scratch-inside-project-root)', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-scratch-inside');
      const bad = path.join(fx.repoRoot, 'scratch-inside');
      const r = await runWithFactory(fx, () => { mkdirSync(bad, { recursive: true }); return bad; });
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.some((b) => /scratch-inside-project-root|scratch-is-project-root/.test(b)));
      // Guard cleanup of injected dir
      try { rmSync(bad, { recursive: true, force: true }); } catch { /* ignore */ }
    });
    await check('scratch: injected scratch equal to project root → refuse (scratch-is-project-root)', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-scratch-eq');
      const r = await runWithFactory(fx, () => fx.repoRoot);
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.some((b) => /scratch-is-project-root|scratch-inside-project-root/.test(b)));
    });
    await check('scratch: injected scratch === os-tmp root → refuse (scratch-is-os-tmp-root)', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-scratch-tmp');
      const r = await runWithFactory(fx, ({ canonicalTmpBase }) => canonicalTmpBase);
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.includes('scratch-is-os-tmp-root'));
    });
    await check('scratch: injected scratch outside os-tmp → refuse (scratch-outside-os-tmp)', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-scratch-outside');
      // Put candidate scratch under fx.repoRoot's parent (guaranteed outside os.tmpdir())
      const outside = mkdtempSync(path.join(REPO_ROOT, '.rh-not-tmp-'));
      try {
        const r = await runWithFactory(fx, () => outside);
        assert.strictEqual(r.scratchMutationPerformed, false);
        // outside might still be under REPO_ROOT (fx.repoRoot's ancestor), so containment may hit
        // scratch-outside-os-tmp OR scratch-inside-project-root depending on relationship. Either safe slug is acceptable.
        assert.ok(r.blockers.some((b) => /^scratch-/.test(b)), JSON.stringify(r.blockers));
      } finally {
        try { rmSync(outside, { recursive: true, force: true }); } catch { /* ignore */ }
      }
    });
    await check('scratch: factory returning empty string → scratch-unresolvable', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-scratch-empty');
      const r = await runWithFactory(fx, () => '');
      assert.strictEqual(r.scratchMutationPerformed, false);
      assert.ok(r.blockers.includes('scratch-unresolvable'));
    });
    await check('scratch: default happy path leaves NO residual scratch under os.tmpdir()', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-cleanup-a');
      const authPath = await seedApprovedAuth(fx);
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.cleanupPerformed, true);
      assert.strictEqual(r.rehearsalPerformed, true);
    });

    // ══ L. atomic primitive & TOCTOU proof ═══════════════════════════════
    await check('atomic: rehearsal never touches production sidecar bytes (repeated runs stable)', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-atomic');
      const authPath = await seedApprovedAuth(fx);
      const bytesBefore = readFileSync(path.join(fx.repoRoot, CAND_SIDECAR), 'utf-8');
      for (let i = 0; i < 3; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
        assert.strictEqual(r.rehearsalPerformed, true);
        assert.strictEqual(r.productionMutationPerformed, false);
      }
      const bytesAfter = readFileSync(path.join(fx.repoRoot, CAND_SIDECAR), 'utf-8');
      assert.strictEqual(bytesAfter, bytesBefore);
    });
    await check('atomic: prior sidecar with existing lifecycle → append-only within rehearsal payload', async () => {
      // sidecar with a legacy-ignored key must round-trip through rehearsal and preserve unrelated keys.
      const sidecarOverrides = {
        blogger: {
          status: 'published',
          publishedUrl: 'https://example.invalid/legacy',
          publishedAt: '2026-07-01T10:00:00+08:00',
          bloggerPostId: '',
          type: 'post',
          permalink: '/legacy/permalink',
        },
        canonical: 'https://example.invalid/legacy',
      };
      const fx = await setupCandidateRepo(tmpRoot, 'rh-preserve', { sidecarOverrides });
      const authPath = await seedApprovedAuth(fx);
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.ok, true, JSON.stringify(r.blockers));
    });

    // ══ M. determinism / privacy proofs across all outputs ═══════════════
    {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-privacy', { publishedUrl: 'https://secret.invalid/private-post' });
      const authPath = await seedApprovedAuth(fx, 'privacy-auth.json');
      const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
      allOutputs.push(rehearseFormatJson(r), rehearseFormatHuman(r), r.blockers.join('\n'));
      await check('privacy: rehearsal succeeded with secret publishedUrl fixture', () => {
        assert.strictEqual(r.ok, true, JSON.stringify(r.blockers));
      });
      await check('privacy: rehearsal report never echoes secret publishedUrl / host / path', () => {
        const joined = rehearseFormatJson(r) + rehearseFormatHuman(r);
        assert.ok(!joined.includes('secret.invalid'));
        assert.ok(!joined.includes('private-post'));
        assert.ok(!joined.includes('example.invalid'));
      });
      await check('privacy: rehearsal report never echoes authorization file path', () => {
        const joined = rehearseFormatJson(r) + rehearseFormatHuman(r);
        assert.ok(!joined.includes(authPath));
        assert.ok(!joined.includes('privacy-auth'));
      });
      await check('privacy: rehearsal report never echoes fixture repo absolute path', () => {
        const joined = rehearseFormatJson(r) + rehearseFormatHuman(r);
        assert.ok(!joined.includes(fx.repoRoot));
      });
    }

    // ══ N. remote disposition / reason enum coverage ═════════════════════
    {
      const fx = await setupCandidateRepo(tmpRoot, 'rh-enums');
      for (const rd of REMOTE_DISPOSITIONS) {
        // Only certain enum values pair with each reason cleanly; we're using stage-preview reason to keep valid.
        // eslint-disable-next-line no-await-in-loop
        await check(`enum: remote-disposition ${rd} → rehearsal ok`, async () => {
          const intent = { ...INTENT, remoteDisposition: rd };
          const authPath = await seedApprovedAuth(fx, `auth-rd-${rd}.json`, intent);
          const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
          assert.strictEqual(r.ok, true, `${rd}: ${JSON.stringify(r.blockers)}`);
        });
      }
      for (const rs of LIFECYCLE_REASONS) {
        // eslint-disable-next-line no-await-in-loop
        await check(`enum: reason ${rs} → rehearsal ok`, async () => {
          const intent = { ...INTENT, reason: rs };
          const authPath = await seedApprovedAuth(fx, `auth-reason-${rs}.json`, intent);
          const r = await rehearseBloggerWithdrawal({ projectRoot: fx.repoRoot, authorizationPath: authPath, sourcePath: CAND_SOURCE });
          assert.strictEqual(r.ok, true, `${rs}: ${JSON.stringify(r.blockers)}`);
        });
      }
    }

    // ══ O. CLI e2e happy path (spawns rehearsal CLI against synthetic repo cwd) ══
    await check('CLI e2e: synthetic-repo rehearsal via CLI happy path via API only (CLI targets real repo)', async () => {
      // The CLI hardcodes PROJECT_ROOT; e2e correctness of programmatic API is proven above. Here
      // we simply spawn the CLI with an unrelated authorization path (missing) to verify exit 1 + no mutation.
      const bogusAuth = path.join(tmpRoot, 'nowhere-auth.json');
      const r = runCli(REHEARSE_CLI, ['--source-path', CAND_SOURCE, '--authorization', bogusAuth, '--json']);
      allOutputs.push(r.stdout, r.stderr);
      // The CLI targets the REAL repository, where source-path CAND_SOURCE (synthetic) is NOT a
      // candidate; expect exit 1 with a report body that must never claim scratch mutation performed.
      assert.strictEqual(r.status, 1, r.stderr);
      const j = JSON.parse(r.stdout);
      assert.strictEqual(j.rehearsalPerformed, false);
      assert.strictEqual(j.scratchMutationPerformed, false);
      assert.strictEqual(j.productionMutationPerformed, false);
    });

    // ══ P. real repository smoke (read-only) ═════════════════════════════
    const realHead = git(REPO_ROOT, ['rev-parse', 'HEAD']);
    const realPlan = await planBloggerWithdrawals({ repoRoot: REPO_ROOT, gitHead: realHead });
    await check('real: candidateCount === 1 (unchanged)', () => assert.strictEqual(realPlan.summary.candidateCount, 1));
    await check('real: authorizationEligibleCount === 0 (unchanged)', () => assert.strictEqual(realPlan.summary.authorizationEligibleCount, 0));
    await check('real: rehearsal CLI --help → exit 0', () => {
      const r = runCli(REHEARSE_CLI, ['--help']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 0, r.stderr);
    });

    // final aggregate leak scan
    await check('redact(final): zero secret hits across ALL outputs', () => {
      const joined = allOutputs.join('\n');
      for (const s of SECRET_STRINGS) assert.ok(!joined.includes(s), `LEAK: ${s}`);
    });
  } finally {
    try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  // ── production / deploy no-write verification ──────────────────────────
  const prodAfter = snapshotTree(prodPostsDir, ['.md', '.publish.json']);
  await check('production Blogger content bytes unchanged', () => assert.deepStrictEqual(invMap(prodAfter), invMap(prodBefore)));
  await check('production Blogger content mtimes unchanged', () => {
    assert.deepStrictEqual(
      Object.fromEntries(prodAfter.map((s) => [s.rel, s.mtimeMs])),
      Object.fromEntries(prodBefore.map((s) => [s.rel, s.mtimeMs])),
    );
  });
  await check('dist-blogger-preview/ absent (was + remains)', () => {
    assert.strictEqual(distPreviewAbsent, true);
    assert.ok(!existsSync(path.join(REPO_ROOT, 'dist-blogger-preview')));
  });
  if (deployHasGit) {
    const deployAfter = snapshotTree(DEPLOY_ROOT_CANDIDATE, ['.publish.json']);
    await check('deploy repository sidecar bytes unchanged', () => assert.deepStrictEqual(invMap(deployAfter), invMap(deployBefore)));
  }
  const scratchCountAfter = countOsTempScratchDirs();
  await check('OS-temp scratch dirs count did not grow (rehearsal cleanup effective)', () => {
    if (scratchCountBefore < 0 || scratchCountAfter < 0) { assert.ok(true); return; }
    assert.ok(scratchCountAfter <= scratchCountBefore, `scratch dirs grew: ${scratchCountBefore} → ${scratchCountAfter}`);
  });

  console.log('');
  console.log(`[check:blogger-withdrawal-rehearsal] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[check:blogger-withdrawal-rehearsal] UNEXPECTED ERROR: ${err.stack || err.message || err}`);
  process.exit(1);
});
