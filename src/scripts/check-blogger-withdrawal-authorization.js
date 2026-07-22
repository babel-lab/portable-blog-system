#!/usr/bin/env node
// Phase 20260722-publish-target-stage Slice 4D：Blogger withdrawal authorization preparation + preflight — focused guard.
//
// 上位契約：docs/20260722-blogger-withdrawal-authorization-preparation.md
//
// 範圍 / 邊界（negative test 完全隔離；memory: feedback_negative_test_isolation）：
//   - 所有寫入皆發生於 os.tmpdir() 之 mkdtemp synthetic git repo（git init + 一個 commit +
//     refs/remotes/origin/main at HEAD）；每個 fixture 於 finally{} 清除。真實 production content 與
//     deploy clone 全程唯讀。
//   - schema fail-closed 以 in-memory string / OS-temp fixture 檔驗證；**不**弄髒真實 repo 再還原。
//   - 兩支 CLI 只做 input-validation / CLI-contract smoke；端對端行為走程式 API
//     prepareWithdrawalAuthorizationDraft / preflightWithdrawalAuthorization（projectRoot 指向 synthetic repo）。
//   - 兩支工具皆不寫任何檔；本 guard 斷言 source-level static ban + observed no-write。
//   - 本 guard 以 spawnSync 播種 synthetic git repo（工具本身無 child_process / network / API）。
//
// Run:
//   npm run check:blogger-withdrawal-authorization
//   或  node src/scripts/check-blogger-withdrawal-authorization.js

import assert from 'node:assert';
import {
  readFileSync, statSync, existsSync, readdirSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, symlinkSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseArgs as prepareParseArgs,
  prepareWithdrawalAuthorizationDraft,
} from './prepare-blogger-withdrawal-authorization.js';
import {
  parseArgs as validateParseArgs,
  preflightWithdrawalAuthorization,
  formatJson as validateFormatJson,
  formatHumanReadable as validateFormatHuman,
} from './validate-blogger-withdrawal-authorization.js';
import {
  planBloggerWithdrawals,
} from './plan-blogger-withdrawals.js';
import {
  AUTHORIZATION_SCHEMA_VERSION,
  AUTHORIZATION_PURPOSE,
  AUTHORIZATION_BRANCH,
  WITHDRAWAL_EVENT,
  EXPECTED_CURRENT_STATUS,
  computePlanFingerprint,
  computeRecordFingerprint,
  parseAndValidateAuthorization,
  jsonTextHasDuplicateKeys,
  scanJsonForDuplicateKeys,
  isLandedStrictTzIso,
  classifyBloggerSourcePath,
  deriveSidecarPath,
  canonicalize,
  buildDraft,
  serializeDraft,
} from './blogger-withdrawal-authorization.js';
import { REMOTE_DISPOSITIONS, LIFECYCLE_REASONS } from './sidecar-withdrawal-contract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PREPARE_CLI = path.join(REPO_ROOT, 'src', 'scripts', 'prepare-blogger-withdrawal-authorization.js');
const VALIDATE_CLI = path.join(REPO_ROOT, 'src', 'scripts', 'validate-blogger-withdrawal-authorization.js');
const SHARED = path.join(REPO_ROOT, 'src', 'scripts', 'blogger-withdrawal-authorization.js');
const DEPLOY_ROOT_CANDIDATE = path.resolve(REPO_ROOT, '..', 'portable-blog-deploy');

// ── injected secrets（§八；下列字串在所有 stdout / stderr / serialized blocker 中須零命中）──
const SECRET_STRINGS = [
  'SECRET-AUTH-PATH',
  'SECRET-OPERATOR-NAME',
  'secret@example.invalid',
  'https://secret.invalid/private-post',
  '/d/private/operator/authorization.json',
  'authorization.json',
];

// ── harness ────────────────────────────────────────────────────────────────────
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
const PREPARE_SRC = stripComments(readFileSync(PREPARE_CLI, 'utf-8'));
const VALIDATE_SRC = stripComments(readFileSync(VALIDATE_CLI, 'utf-8'));
const SHARED_SRC = stripComments(readFileSync(SHARED, 'utf-8'));

// ── fixture builders ────────────────────────────────────────────────────────────
function mdText({ enabled = true, stage = 'preview' } = {}) {
  let pt = `  blogger:\n    enabled: ${enabled ? 'true' : 'false'}\n    mode: "full"\n`;
  if (stage !== undefined) pt += `    stage: "${stage}"\n`;
  return `---\nsite: "blogger"\ntitle: "T"\npublishTargets:\n${pt}---\nbody — must not be read for candidacy.\n`;
}
function activePublishedSidecar({ publishedUrl = 'https://example.invalid/post', bloggerPostId = '' } = {}) {
  return {
    schemaVersion: 1,
    blogger: { status: 'published', publishedUrl, publishedAt: '2026-07-01T10:00:00+08:00', bloggerPostId },
  };
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

// setup a synthetic repo with exactly one active-published preview candidate.
async function setupCandidateRepo(tmpRoot, label, { publishedUrl = 'https://example.invalid/post' } = {}) {
  const repoRoot = mkdtempSync(path.join(tmpRoot, `${label}-`));
  seedGitRepo(repoRoot);
  writeFileSyncMk(path.join(repoRoot, CAND_SOURCE), mdText({ stage: 'preview' }));
  writeFileSyncMk(path.join(repoRoot, CAND_SIDECAR), JSON.stringify(activePublishedSidecar({ publishedUrl }), null, 2));
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

// ── file inventory snapshots（no-write proof）──────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════════
async function main() {
  const prodPostsDir = path.join(REPO_ROOT, 'content', 'blogger', 'posts');
  const prodBefore = snapshotTree(prodPostsDir, ['.md', '.publish.json']);
  const distPreviewAbsent = !existsSync(path.join(REPO_ROOT, 'dist-blogger-preview'));
  let deployBefore = null;
  const deployHasGit = existsSync(DEPLOY_ROOT_CANDIDATE) && existsSync(path.join(DEPLOY_ROOT_CANDIDATE, '.git'));
  if (deployHasGit) deployBefore = snapshotTree(DEPLOY_ROOT_CANDIDATE, ['.publish.json']);

  const allOutputs = []; // 收集所有 stdout/stderr/blocker，最後統一 no-leak 掃描

  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'wd-authz-'));
  try {
    // ══ A. source-level static bans ══════════════════════════════════════
    for (const [label, src] of [['prepare', PREPARE_SRC], ['validate', VALIDATE_SRC], ['shared', SHARED_SRC]]) {
      await check(`src[${label}]: no fs write primitive`, () => {
        for (const re of [/\bfs\.writeFile\s*\(/, /\bwriteFileSync\s*\(/, /\bfs\.mkdir\s*\(/, /\bmkdirSync\s*\(/,
          /\bfs\.rm(\b|\s*\()/, /\brmSync\s*\(/, /\bfs\.rename\s*\(/, /\bfs\.unlink\s*\(/, /\bfs\.copyFile\s*\(/,
          /\bfs\.appendFile\s*\(/, /\bfs\.link\s*\(/, /\bsymlinkSync\s*\(/, /createWriteStream/]) {
          assert.ok(!re.test(src), `unexpected write primitive ${re}`);
        }
      });
      await check(`src[${label}]: no child_process / spawn / exec`, () => {
        assert.ok(!/from ['"]node:child_process['"]/.test(src));
        assert.ok(!/require\(['"]child_process['"]\)/.test(src));
        assert.ok(!/spawnSync|execSync|execFileSync|\bspawn\s*\(|\bexec\s*\(/.test(src));
      });
      await check(`src[${label}]: no network / api`, () => {
        assert.ok(!/\bfetch\s*\(/.test(src));
        assert.ok(!/from ['"]node:https?['"]/.test(src));
        assert.ok(!/googleapis|oauth/i.test(src));
        assert.ok(!/blogger\.googleapis\.com/.test(src));
      });
      await check(`src[${label}]: no git command strings`, () => {
        for (const g of ['git commit', 'git push', 'git add', 'git fetch', 'git pull', 'git reset', 'git clean', 'git stash', 'git checkout']) {
          assert.ok(!new RegExp(`["']${g}["']`).test(src), `unexpected ${g}`);
        }
      });
      await check(`src[${label}]: no real production host / id`, () => {
        for (const needle of ['blog' + 'spot.com', 'babel' + '-lab', 'git' + 'hub.io']) {
          assert.ok(!src.includes(needle), `must not contain ${needle}`);
        }
      });
    }
    await check('src[prepare]: explicitlyAuthorized never set true in-band', () => {
      // buildDraft (shared) hard-codes false; prepare source must not contain explicitlyAuthorized: true.
      assert.ok(!/explicitlyAuthorized:\s*true/.test(PREPARE_SRC));
    });
    await check('src[shared]: buildDraft hard-codes explicitlyAuthorized false (only false literal)', () => {
      const matches = SHARED_SRC.match(/explicitlyAuthorized:\s*(true|false)/g) || [];
      assert.deepStrictEqual(matches, ['explicitlyAuthorized: false']);
    });
    await check('src[shared]: reuses landed enums + planner + contract (single source of truth)', () => {
      assert.ok(/from ['"]\.\/sidecar-withdrawal-contract\.js['"]/.test(SHARED_SRC));
      assert.ok(/from ['"]\.\/plan-blogger-withdrawals\.js['"]/.test(SHARED_SRC));
      assert.ok(/REMOTE_DISPOSITIONS/.test(SHARED_SRC));
      assert.ok(/LIFECYCLE_REASONS/.test(SHARED_SRC));
    });

    // ══ B. parseArgs smoke ═══════════════════════════════════════════════
    await check('prepare.parseArgs: full valid set', () => {
      const o = prepareParseArgs(['n', 'c', '--source-path', CAND_SOURCE, '--remote-disposition', 'remote-deleted',
        '--remote-verified-at', INTENT.remoteVerifiedAt, '--reason', 'content-retirement', '--reason-detail', 'x']);
      assert.strictEqual(o.sourcePath, CAND_SOURCE);
      assert.strictEqual(o.remoteDisposition, 'remote-deleted');
      assert.strictEqual(o.remoteVerifiedAt, INTENT.remoteVerifiedAt);
      assert.strictEqual(o.reason, 'content-retirement');
      assert.strictEqual(o.reasonDetail, 'x');
    });
    await check('prepare.parseArgs: = form', () => {
      const o = prepareParseArgs(['n', 'c', `--source-path=${CAND_SOURCE}`, '--remote-disposition=remote-draft']);
      assert.strictEqual(o.sourcePath, CAND_SOURCE);
      assert.strictEqual(o.remoteDisposition, 'remote-draft');
    });
    for (const flag of ['--apply', '--write', '--force', '--yes', '-y', '--approve', '--auto-approve',
      '--skip-validation', '--skip-fingerprint', '--ignore-head', '--dirty-ok', '--no-verify', '--production',
      '--publish', '--deploy', '--commit', '--push', '--restore', '--republish', '--api', '--repo-root',
      '--project-root', '--test-root', '--output', '--out', '--save']) {
      await check(`prepare.parseArgs: forbidden ${flag}`, () => {
        assert.ok(prepareParseArgs(['n', 'c', flag]).forbidden.includes(flag));
      });
      await check(`validate.parseArgs: forbidden ${flag}`, () => {
        assert.ok(validateParseArgs(['n', 'c', flag]).forbidden.includes(flag));
      });
    }
    await check('prepare.parseArgs: unknown captured', () => assert.ok(prepareParseArgs(['n', 'c', '--nope']).unknown.includes('--nope')));
    await check('validate.parseArgs: valid set', () => {
      const o = validateParseArgs(['n', 'c', '--authorization', '/x/a.json', '--source-path', CAND_SOURCE, '--json']);
      assert.strictEqual(o.authorization, '/x/a.json');
      assert.strictEqual(o.sourcePath, CAND_SOURCE);
      assert.strictEqual(o.json, true);
    });

    // ══ C. CLI --help / forbidden / unknown / missing ════════════════════
    await check('prepare CLI --help → exit 0, read-only + never approve', () => {
      const r = runCli(PREPARE_CLI, ['--help']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 0, r.stderr);
      assert.ok(/UNAPPROVED/.test(r.stdout));
      assert.ok(/never approves|NEVER approves/i.test(r.stdout) || /explicitlyAuthorized/.test(r.stdout));
      assert.ok(/read-only|stdout-only/i.test(r.stdout));
    });
    await check('validate CLI --help → exit 0, never apply + applyReady', () => {
      const r = runCli(VALIDATE_CLI, ['--help']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 0, r.stderr);
      assert.ok(/applyReady|apply ready/i.test(r.stdout));
      assert.ok(/no apply|never appl/i.test(r.stdout) || /performs NO apply/i.test(r.stdout));
    });
    await check('prepare CLI forbidden → exit 2', () => {
      const r = runCli(PREPARE_CLI, ['--apply', '--source-path', CAND_SOURCE]);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2, r.stderr);
      assert.ok(/forbidden flag/i.test(r.stderr));
    });
    await check('prepare CLI unknown → exit 2', () => {
      const r = runCli(PREPARE_CLI, ['--totally-fake']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/unknown argument/i.test(r.stderr));
    });
    await check('prepare CLI missing required → exit 2', () => {
      const r = runCli(PREPARE_CLI, ['--source-path', CAND_SOURCE]);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/is required/i.test(r.stderr));
    });
    await check('validate CLI forbidden → exit 2', () => {
      const r = runCli(VALIDATE_CLI, ['--apply', '--authorization', '/x/a.json', '--source-path', CAND_SOURCE]);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/forbidden flag/i.test(r.stderr));
    });
    await check('validate CLI unknown → exit 2', () => {
      const r = runCli(VALIDATE_CLI, ['--totally-fake']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
    });
    await check('validate CLI missing --authorization → exit 2', () => {
      const r = runCli(VALIDATE_CLI, ['--source-path', CAND_SOURCE]);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/--authorization.*is required/i.test(r.stderr));
    });
    await check('validate CLI missing --source-path → exit 2', () => {
      const r = runCli(VALIDATE_CLI, ['--authorization', '/x/a.json']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2);
      assert.ok(/--source-path.*is required/i.test(r.stderr));
    });

    // ══ D. shared-module units ═══════════════════════════════════════════
    await check('canonicalize: deterministic + key-order independent', () => {
      const a = canonicalize({ b: 1, a: [2, { y: 1, x: 2 }] });
      const b = canonicalize({ a: [2, { x: 2, y: 1 }], b: 1 });
      assert.strictEqual(a, b);
    });
    await check('deriveSidecarPath', () => {
      assert.strictEqual(deriveSidecarPath(CAND_SOURCE), CAND_SIDECAR);
      assert.strictEqual(deriveSidecarPath('x.txt'), null);
    });
    await check('classifyBloggerSourcePath: happy + fails', () => {
      assert.strictEqual(classifyBloggerSourcePath(CAND_SOURCE), null);
      assert.ok(classifyBloggerSourcePath('content/github/posts/x.md'));
      assert.ok(classifyBloggerSourcePath('content/blogger/posts/../x.md'));
      assert.ok(classifyBloggerSourcePath('/abs/content/blogger/posts/x.md'));
      assert.ok(classifyBloggerSourcePath('content/blogger/posts/x.fb.md'));
      assert.ok(classifyBloggerSourcePath('content\\blogger\\posts\\x.md'));
      assert.ok(classifyBloggerSourcePath(' content/blogger/posts/x.md'));
    });
    await check('isLandedStrictTzIso: reuses landed calendar parser', () => {
      assert.strictEqual(isLandedStrictTzIso('2026-07-21T09:00:00+08:00'), true);
      assert.strictEqual(isLandedStrictTzIso('2026-07-21T09:00:00Z'), true);
      assert.strictEqual(isLandedStrictTzIso('2026-02-30T00:00:00Z'), false); // impossible date
      assert.strictEqual(isLandedStrictTzIso('2026-07-21T09:00:00'), false);   // no timezone
      assert.strictEqual(isLandedStrictTzIso('2026-07-21'), false);            // date-only
      assert.strictEqual(isLandedStrictTzIso(' 2026-07-21T09:00:00Z'), false); // padded
      assert.strictEqual(isLandedStrictTzIso(123), false);
      assert.strictEqual(isLandedStrictTzIso(''), false);
    });
    await check('jsonTextHasDuplicateKeys', () => {
      assert.strictEqual(jsonTextHasDuplicateKeys('{"a":1,"a":2}'), true);
      assert.strictEqual(jsonTextHasDuplicateKeys('{"a":1,"b":{"a":2}}'), false);
      assert.strictEqual(jsonTextHasDuplicateKeys('{"a":"a","b":1}'), false); // "a" as value not key
      assert.strictEqual(jsonTextHasDuplicateKeys('{"purpose":"x","purpose":"y"}'), true);
    });

    // ── scanJsonForDuplicateKeys: decoded-key semantics (§五 targeted cases) ──────────
    // duplicate = JSON-decoded property-name exact equality per object scope. Literal and
    // \uXXXX spellings that decode to the same name MUST be duplicate; different scopes MUST NOT.
    await check('scan §5.1 top-level exact duplicate → duplicate', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"purpose":"blogger-sidecar-withdrawal","purpose":"other"}').status, 'duplicate');
    });
    await check('scan §5.2 nested exact duplicate → duplicate', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"approval":{"explicitlyAuthorized":false,"explicitlyAuthorized":true}}').status, 'duplicate');
    });
    await check('scan §5.3 unicode-escaped top-level duplicate → duplicate', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"purpose":"blogger-sidecar-withdrawal","\\u0070urpose":"other"}').status, 'duplicate');
    });
    await check('scan §5.4 escaped nested approval duplicate → duplicate', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"approval":{"explicitlyAuthorized":false,"explicitly\\u0041uthorized":true}}').status, 'duplicate');
    });
    await check('scan §5.5 first-safe/second-dangerous → duplicate (not last-value-wins true)', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"approval":{"explicitlyAuthorized":false,"explicitly\\u0041uthorized":true}}').status, 'duplicate');
    });
    await check('scan §5.6 first-dangerous/second-safe → duplicate (not accepted via last false)', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"approval":{"explicitlyAuthorized":true,"explicitly\\u0041uthorized":false}}').status, 'duplicate');
    });
    await check('scan §5.7 escaped key first → duplicate', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"approval":{"explicitly\\u0041uthorized":true,"explicitlyAuthorized":false}}').status, 'duplicate');
    });
    await check('scan §5.8 multi-char escape composing same key → duplicate', () => {
      // "explicitlyAuthorized" decodes to "explicitlyAuthorized"
      assert.strictEqual(scanJsonForDuplicateKeys('{"approval":{"explicitlyAuthorized":false,"\\u0065\\u0078plicitlyAuthorized":true}}').status, 'duplicate');
    });
    await check('scan §5.9 same key in different object scope → ok (not duplicate)', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"repository":{"expectedBranch":"main"},"other":{"expectedBranch":"main"}}').status, 'ok');
    });
    await check('scan §5.10 array of distinct-scope objects → ok', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('[{"a":1},{"a":2}]').status, 'ok');
    });
    await check('scan §5.11 nested-in-array object duplicate → duplicate', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('[{"a":1,"\\u0061":2}]').status, 'duplicate');
    });
    await check('scan §5.12 string value content not treated as key → ok', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"note":"\\"purpose\\": \\"x\\"","purpose":"y"}').status, 'ok');
    });
    await check('scan §5.13 escaped-quote vs escaped-backslash keys distinct → ok', () => {
      // "a\"b" and "a\\b" decode to different property names
      assert.strictEqual(scanJsonForDuplicateKeys('{"a\\"b":1,"a\\\\b":2}').status, 'ok');
    });
    await check('scan §5.14 malformed unicode escape → malformed', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"a":"\\u12\\uZZZZ"}').status, 'malformed');
    });
    await check('scan §5.15 unterminated string → malformed', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"a":"unterminated}').status, 'malformed');
    });
    await check('scan §5.16 missing colon / comma / brace / trailing comma → malformed', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"a" 1}').status, 'malformed');
      assert.strictEqual(scanJsonForDuplicateKeys('{"a":1 "b":2}').status, 'malformed');
      assert.strictEqual(scanJsonForDuplicateKeys('{"a":1').status, 'malformed');
      assert.strictEqual(scanJsonForDuplicateKeys('{"a":1,}').status, 'malformed');
      assert.strictEqual(scanJsonForDuplicateKeys('[1,2,]').status, 'malformed');
    });
    await check('scan §5.17 duplicate unknown key still detected → duplicate', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"totallyUnknownKey":1,"totallyUnknownKey":2}').status, 'duplicate');
    });
    await check('scan §5.18 deep nesting: duplicate detected + clean scope', () => {
      let open = '';
      let close = '';
      for (let d = 0; d < 40; d += 1) { open += '{"n":'; close += '}'; }
      assert.strictEqual(scanJsonForDuplicateKeys(`${open}{"x":1,"x":2}${close}`).status, 'duplicate');
      assert.strictEqual(scanJsonForDuplicateKeys(`${open}{"x":1}${close}`).status, 'ok');
    });
    await check('scan: valid authorization-shaped doc → ok (no false positive)', () => {
      assert.strictEqual(scanJsonForDuplicateKeys('{"schemaVersion":1,"purpose":"blogger-sidecar-withdrawal","approval":{"explicitlyAuthorized":false}}').status, 'ok');
    });
    await check('scan: non-string input → malformed (fail-closed)', () => {
      assert.strictEqual(scanJsonForDuplicateKeys(null).status, 'malformed');
      assert.strictEqual(scanJsonForDuplicateKeys(undefined).status, 'malformed');
      assert.strictEqual(scanJsonForDuplicateKeys(42).status, 'malformed');
    });

    // ══ E. shared schema loader: happy + fail-closed (in-memory) ═════════
    const goodHead = 'a'.repeat(40);
    const goodFp = 'b'.repeat(64);
    const goodTarget = {
      sourcePath: CAND_SOURCE, sidecarPath: CAND_SIDECAR,
      expectedSourceSha256: 'c'.repeat(64), expectedSidecarSha256: 'd'.repeat(64),
      expectedCurrentStatus: 'published', expectedPublishedUrlFingerprint: 'e'.repeat(64),
    };
    const goodAuthObj = makeAuth({ head: goodHead, planFp: goodFp, recFp: goodFp, target: goodTarget, approved: false });
    await check('loader: happy shape-valid draft (unapproved) → documentValid', () => {
      const r = parseAndValidateAuthorization(JSON.stringify(goodAuthObj));
      assert.strictEqual(r.ok, true, JSON.stringify(r));
      assert.strictEqual(r.explicitlyAuthorized, false);
    });
    await check('loader: approved → explicitlyAuthorized true', () => {
      const r = parseAndValidateAuthorization(JSON.stringify(makeAuth({ head: goodHead, planFp: goodFp, recFp: goodFp, target: goodTarget, approved: true })));
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.explicitlyAuthorized, true);
    });
    const loaderFails = [
      ['parse error', '{ not json', 'authorization-parse-error'],
      ['not object', '[]', 'authorization-not-object'],
      ['unknown top key', JSON.stringify({ ...goodAuthObj, extra: 1 }), 'authorization-unknown-top-level-key'],
      ['schema version', JSON.stringify({ ...goodAuthObj, schemaVersion: 2 }), 'authorization-schema-version-invalid'],
      ['wrong purpose', JSON.stringify({ ...goodAuthObj, purpose: 'blogger-backfill-production-sidecar-apply' }), 'authorization-purpose-mismatch'],
      ['repo not object', JSON.stringify({ ...goodAuthObj, repository: 1 }), 'authorization-repository-invalid'],
      ['repo unknown key', JSON.stringify({ ...goodAuthObj, repository: { expectedBranch: 'main', expectedHead: goodHead, x: 1 } }), 'authorization-repository-unknown-key'],
      ['branch invalid', JSON.stringify({ ...goodAuthObj, repository: { expectedBranch: 'dev', expectedHead: goodHead } }), 'authorization-branch-invalid'],
      ['head uppercase', JSON.stringify({ ...goodAuthObj, repository: { expectedBranch: 'main', expectedHead: 'A'.repeat(40) } }), 'authorization-head-invalid'],
      ['head short', JSON.stringify({ ...goodAuthObj, repository: { expectedBranch: 'main', expectedHead: 'a'.repeat(39) } }), 'authorization-head-invalid'],
      ['plan unknown key', JSON.stringify({ ...goodAuthObj, plan: { expectedPlanFingerprint: goodFp, expectedRecordFingerprint: goodFp, recordCount: 1, x: 1 } }), 'authorization-plan-unknown-key'],
      ['plan fp uppercase', JSON.stringify({ ...goodAuthObj, plan: { expectedPlanFingerprint: 'B'.repeat(64), expectedRecordFingerprint: goodFp, recordCount: 1 } }), 'authorization-plan-fingerprint-invalid'],
      ['record fp short', JSON.stringify({ ...goodAuthObj, plan: { expectedPlanFingerprint: goodFp, expectedRecordFingerprint: 'b'.repeat(63), recordCount: 1 } }), 'authorization-record-fingerprint-invalid'],
      ['recordCount 0', JSON.stringify({ ...goodAuthObj, plan: { expectedPlanFingerprint: goodFp, expectedRecordFingerprint: goodFp, recordCount: 0 } }), 'authorization-record-count-invalid'],
      ['recordCount 2', JSON.stringify({ ...goodAuthObj, plan: { expectedPlanFingerprint: goodFp, expectedRecordFingerprint: goodFp, recordCount: 2 } }), 'authorization-record-count-invalid'],
      ['recordCount string', JSON.stringify({ ...goodAuthObj, plan: { expectedPlanFingerprint: goodFp, expectedRecordFingerprint: goodFp, recordCount: '1' } }), 'authorization-record-count-invalid'],
      ['target unknown key', JSON.stringify({ ...goodAuthObj, target: { ...goodTarget, x: 1 } }), 'authorization-target-unknown-key'],
      ['target source path bad', JSON.stringify({ ...goodAuthObj, target: { ...goodTarget, sourcePath: 'content/github/posts/x.md', sidecarPath: 'content/github/posts/x.publish.json' } }), 'authorization-target-source-path-invalid'],
      ['sidecar path mismatch', JSON.stringify({ ...goodAuthObj, target: { ...goodTarget, sidecarPath: 'content/blogger/posts/other.publish.json' } }), 'authorization-target-sidecar-path-mismatch'],
      ['source sha bad', JSON.stringify({ ...goodAuthObj, target: { ...goodTarget, expectedSourceSha256: 'x'.repeat(64) } }), 'authorization-target-source-sha-invalid'],
      ['current status bad', JSON.stringify({ ...goodAuthObj, target: { ...goodTarget, expectedCurrentStatus: 'draft' } }), 'authorization-target-current-status-invalid'],
      ['withdrawal unknown key', JSON.stringify({ ...goodAuthObj, withdrawal: { event: 'withdrawn', remoteDisposition: 'remote-deleted', remoteVerifiedAt: INTENT.remoteVerifiedAt, reason: 'policy', reasonDetail: '', x: 1 } }), 'authorization-withdrawal-unknown-key'],
      ['event invalid', JSON.stringify({ ...goodAuthObj, withdrawal: { event: 'unpublished', remoteDisposition: 'remote-deleted', remoteVerifiedAt: INTENT.remoteVerifiedAt, reason: 'policy', reasonDetail: '' } }), 'authorization-withdrawal-event-invalid'],
      ['remote disposition invalid', JSON.stringify({ ...goodAuthObj, withdrawal: { event: 'withdrawn', remoteDisposition: 'confirmed-inactive', remoteVerifiedAt: INTENT.remoteVerifiedAt, reason: 'policy', reasonDetail: '' } }), 'authorization-remote-disposition-invalid'],
      ['remote verified at invalid', JSON.stringify({ ...goodAuthObj, withdrawal: { event: 'withdrawn', remoteDisposition: 'remote-deleted', remoteVerifiedAt: '2026-13-01T00:00:00Z', reason: 'policy', reasonDetail: '' } }), 'authorization-remote-verified-at-invalid'],
      ['reason invalid', JSON.stringify({ ...goodAuthObj, withdrawal: { event: 'withdrawn', remoteDisposition: 'remote-deleted', remoteVerifiedAt: INTENT.remoteVerifiedAt, reason: 'bogus', reasonDetail: '' } }), 'authorization-reason-invalid'],
      ['reason detail non-string', JSON.stringify({ ...goodAuthObj, withdrawal: { event: 'withdrawn', remoteDisposition: 'remote-deleted', remoteVerifiedAt: INTENT.remoteVerifiedAt, reason: 'policy', reasonDetail: 5 } }), 'authorization-reason-detail-invalid'],
      ['approval unknown key', JSON.stringify({ ...goodAuthObj, approval: { explicitlyAuthorized: true, x: 1 } }), 'authorization-approval-unknown-key'],
      ['approval 1', JSON.stringify({ ...goodAuthObj, approval: { explicitlyAuthorized: 1 } }), 'authorization-approval-not-boolean'],
      ['approval "true"', JSON.stringify({ ...goodAuthObj, approval: { explicitlyAuthorized: 'true' } }), 'authorization-approval-not-boolean'],
      ['approval "yes"', JSON.stringify({ ...goodAuthObj, approval: { explicitlyAuthorized: 'yes' } }), 'authorization-approval-not-boolean'],
      ['duplicate key', '{"schemaVersion":1,"schemaVersion":1,"purpose":"blogger-sidecar-withdrawal"}', 'authorization-duplicate-key'],
    ];
    for (const [label, text, expectedBlocker] of loaderFails) {
      await check(`loader fail-closed: ${label} → ${expectedBlocker}`, () => {
        const r = parseAndValidateAuthorization(text);
        assert.strictEqual(r.ok, false, `expected fail for ${label}`);
        assert.strictEqual(r.blocker, expectedBlocker, `got ${r.blocker}`);
      });
    }
    // missing key (remove a required nested key)
    await check('loader fail-closed: missing repository → invalid', () => {
      const { repository, ...rest } = goodAuthObj;
      const r = parseAndValidateAuthorization(JSON.stringify(rest));
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.blocker, 'authorization-repository-invalid');
    });

    // ── E-dup. escaped/semantic duplicate-key fail-closed via parseAndValidateAuthorization ──
    // Duplicate object property names can only exist in RAW text (JS objects collapse them), so
    // these fixtures are built by injecting a raw escaped-duplicate spelling into an otherwise
    // legal, shape-valid authorization. The decisive requirement: the escaped duplicate must
    // fail closed with 'authorization-duplicate-key' BEFORE JSON.parse last-value-wins can make
    // approval trusted — regardless of which spelling carries the dangerous `true`.
    function withRawApproval(authObj, rawApprovalObjText) {
      const compact = JSON.stringify(authObj);
      const m = compact.match(/"approval":\{[^}]*\}/);
      assert.ok(m, 'approval block not found in serialized authorization');
      return compact.replace(m[0], `"approval":${rawApprovalObjText}`);
    }
    await check('loader e2e: escaped approval duplicate (false,true) → authorization-duplicate-key, not authorized', () => {
      const raw = withRawApproval(goodAuthObj, '{"explicitlyAuthorized":false,"explicitly\\u0041uthorized":true}');
      const r = parseAndValidateAuthorization(raw);
      assert.strictEqual(r.ok, false, JSON.stringify(r));
      assert.strictEqual(r.blocker, 'authorization-duplicate-key');
      assert.notStrictEqual(r.explicitlyAuthorized, true); // never collapses to true
    });
    await check('loader e2e: escaped approval duplicate (true,false) → duplicate (not accepted via last false)', () => {
      const raw = withRawApproval(goodAuthObj, '{"explicitlyAuthorized":true,"explicitly\\u0041uthorized":false}');
      const r = parseAndValidateAuthorization(raw);
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.blocker, 'authorization-duplicate-key');
    });
    await check('loader e2e: escaped approval duplicate (escaped-first) → duplicate', () => {
      const raw = withRawApproval(goodAuthObj, '{"explicitly\\u0041uthorized":true,"explicitlyAuthorized":false}');
      const r = parseAndValidateAuthorization(raw);
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.blocker, 'authorization-duplicate-key');
    });
    await check('loader e2e: escaped top-level purpose duplicate → authorization-duplicate-key', () => {
      const compact = JSON.stringify(goodAuthObj);
      const raw = compact.replace('"purpose":"blogger-sidecar-withdrawal"', '"purpose":"blogger-sidecar-withdrawal","\\u0070urpose":"other"');
      const r = parseAndValidateAuthorization(raw);
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.blocker, 'authorization-duplicate-key');
    });
    await check('loader e2e: legal unapproved authorization unaffected → documentValid', () => {
      // regression guard: the corrected scanner must not reject a legal document.
      const r = parseAndValidateAuthorization(JSON.stringify(goodAuthObj));
      assert.strictEqual(r.ok, true, JSON.stringify(r));
      assert.strictEqual(r.explicitlyAuthorized, false);
    });

    // ── E-cli. §9 synthetic validator CLI reproduction (OS-temp fixture; read-only) ──────
    // Build a legal authorization JSON, hand-insert a semantic duplicate approval key (literal
    // false + escaped true), write it to an OS-temp file OUTSIDE the repo, run the validator CLI,
    // and assert fail-closed: exit 1, no ready payload, fixed duplicate-key blocker, not approved,
    // zero secrets, fixture bytes byte-stable across the read-only run.
    await check('cli §9: escaped duplicate authorization → exit 1 + authorization-duplicate-key, no approval', () => {
      const legal = makeAuth({ head: goodHead, planFp: goodFp, recFp: goodFp, target: goodTarget, approved: false });
      const rawDoc = withRawApproval(legal, '{"explicitlyAuthorized":false,"explicitly\\u0041uthorized":true}');
      const fixtureAbs = path.join(tmpRoot, 'cli-escaped-duplicate-authorization.json');
      writeFileSync(fixtureAbs, rawDoc, 'utf-8');
      const bytesBefore = readFileSync(fixtureAbs, 'utf-8');
      const r = runCli(VALIDATE_CLI, ['--authorization', fixtureAbs, '--source-path', CAND_SOURCE, '--json']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 1, r.stderr);
      const j = JSON.parse(r.stdout);
      assert.strictEqual(j.documentValid, false);
      assert.strictEqual(j.applyReady, false);
      assert.strictEqual(j.explicitlyAuthorized, false);
      assert.strictEqual(j.mutationPerformed, false);
      assert.ok(j.blockers.includes('authorization-duplicate-key'), JSON.stringify(j.blockers));
      assert.ok(!('authorizationPath' in j), 'must not echo authorization path');
      // fixture bytes unchanged by the read-only validator run.
      assert.strictEqual(readFileSync(fixtureAbs, 'utf-8'), bytesBefore);
      // safe slug only: the escaped duplicate-key spelling from the document must not leak.
      // (`explicitlyAuthorized` is a legitimate report status field, so it is expected in output.)
      const out = r.stdout + r.stderr;
      assert.ok(!/u0041|\\u/.test(out), 'must not echo raw escaped key spelling');
    });

    // ══ F. generator happy path (synthetic repo) ═════════════════════════
    {
      const fx = await setupCandidateRepo(tmpRoot, 'gen-happy');
      const invBefore = snapshotTree(fx.repoRoot, ['.md', '.publish.json']);
      const result = await prepareWithdrawalAuthorizationDraft({
        projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT,
      });
      const invAfter = snapshotTree(fx.repoRoot, ['.md', '.publish.json']);
      await check('gen: happy ok', () => assert.strictEqual(result.ok, true, JSON.stringify(result.blockers)));
      await check('gen: draft schema fields', () => {
        const d = result.draft;
        assert.strictEqual(d.schemaVersion, AUTHORIZATION_SCHEMA_VERSION);
        assert.strictEqual(d.purpose, AUTHORIZATION_PURPOSE);
        assert.strictEqual(d.repository.expectedBranch, AUTHORIZATION_BRANCH);
        assert.strictEqual(d.repository.expectedHead, fx.head);
        assert.ok(/^[0-9a-f]{64}$/.test(d.plan.expectedPlanFingerprint));
        assert.ok(/^[0-9a-f]{64}$/.test(d.plan.expectedRecordFingerprint));
        assert.strictEqual(d.plan.recordCount, 1);
        assert.strictEqual(d.target.sourcePath, CAND_SOURCE);
        assert.strictEqual(d.target.sidecarPath, CAND_SIDECAR);
        assert.strictEqual(d.target.expectedCurrentStatus, EXPECTED_CURRENT_STATUS);
        assert.ok(/^[0-9a-f]{64}$/.test(d.target.expectedSourceSha256));
        assert.strictEqual(d.withdrawal.event, WITHDRAWAL_EVENT);
        assert.strictEqual(d.withdrawal.remoteDisposition, INTENT.remoteDisposition);
      });
      await check('gen: explicitlyAuthorized fixed false', () => assert.strictEqual(result.draft.approval.explicitlyAuthorized, false));
      await check('gen: plan fingerprint matches recomputation', () => assert.strictEqual(result.draft.plan.expectedPlanFingerprint, fx.planFp));
      await check('gen: record fingerprint matches recomputation', () => assert.strictEqual(result.draft.plan.expectedRecordFingerprint, recordFpFor(fx.candidate)));
      await check('gen: no file created', () => assert.deepStrictEqual(invMap(invAfter), invMap(invBefore)));
      await check('gen: serialized draft ends with newline + JSON.parse-able', () => {
        const s = serializeDraft(result.draft);
        assert.ok(s.endsWith('\n'));
        assert.deepStrictEqual(JSON.parse(s), result.draft);
      });
      await check('gen: deterministic repeated output', async () => {
        const s1 = serializeDraft(result.draft);
        const r2 = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT });
        assert.strictEqual(serializeDraft(r2.draft), s1);
      });
      await check('gen: no timestamp key / generatedAt / absolute path in draft', () => {
        const s = serializeDraft(result.draft);
        assert.ok(!/generatedAt|"timestamp"/i.test(s));
        assert.ok(!/[A-Za-z]:\\/.test(s));
        assert.ok(!s.includes(fx.repoRoot));
      });
      await check('gen: no raw publishedUrl / publishedAt / bloggerPostId in draft', () => {
        const s = serializeDraft(result.draft);
        assert.ok(!/"publishedUrl"/.test(s) && !/"publishedAt"/.test(s) && !/"bloggerPostId"/.test(s));
        assert.ok(!s.includes('example.invalid'));
      });
      // all 6 remote dispositions + all reason enums produce a valid draft
      for (const rd of REMOTE_DISPOSITIONS) {
        await check(`gen: remote-disposition ${rd} → ok`, async () => {
          const r = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT, remoteDisposition: rd });
          assert.strictEqual(r.ok, true, JSON.stringify(r.blockers));
          assert.strictEqual(r.draft.withdrawal.remoteDisposition, rd);
        });
      }
      for (const rs of LIFECYCLE_REASONS) {
        await check(`gen: reason ${rs} → ok`, async () => {
          const r = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT, reason: rs });
          assert.strictEqual(r.ok, true, JSON.stringify(r.blockers));
        });
      }
      await check('gen: reasonDetail present changes record fingerprint', async () => {
        const withDetail = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT, reasonDetail: 'a note' });
        assert.notStrictEqual(withDetail.draft.plan.expectedRecordFingerprint, result.draft.plan.expectedRecordFingerprint);
      });
      // fixture-derived count (NOT hardcoded real repo count)
      await check('gen: synthetic plan candidateCount derived == 1', () => assert.strictEqual(fx.plan.summary.candidateCount, 1));
      fx.__inv = invBefore;
      global.__genHappyFx = fx;
    }

    // ══ G. generator fail-closed ═════════════════════════════════════════
    {
      const fx = global.__genHappyFx;
      const bad = [
        ['invalid disposition', { remoteDisposition: 'deleted' }, 'remote-disposition-invalid'],
        ['invalid ISO', { remoteVerifiedAt: '2026-13-40T00:00:00Z' }, 'remote-verified-at-invalid'],
        ['no-tz ISO', { remoteVerifiedAt: '2026-07-21T09:00:00' }, 'remote-verified-at-invalid'],
        ['invalid reason', { reason: 'nope' }, 'reason-invalid'],
        ['bad source path', { sourcePath: 'content/github/posts/x.md' }, 'source-path-invalid'],
        ['non-candidate source', { sourcePath: 'content/blogger/posts/nowhere.md' }, 'source-path-not-a-candidate'],
      ];
      for (const [label, override, expected] of bad) {
        await check(`gen fail-closed: ${label}`, async () => {
          const r = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT, ...override });
          assert.strictEqual(r.ok, false);
          assert.ok(!r.draft, 'no half-baked draft');
          assert.ok(r.blockers.includes(expected), `blockers=${JSON.stringify(r.blockers)}`);
        });
      }
    }
    // repo-state fail-closed for generator (dirty / branch / ahead / lock)
    await check('gen fail-closed: dirty tree', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'gen-dirty');
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# dirty\n', 'utf-8');
      const r = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT });
      assert.strictEqual(r.ok, false);
      assert.ok(r.blockers.some((b) => /repo-state:dirty-working-tree/.test(b)));
    });
    await check('gen fail-closed: wrong branch', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'gen-branch');
      gitQuiet(fx.repoRoot, ['checkout', '-q', '-b', 'feature']);
      const r = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT });
      assert.strictEqual(r.ok, false);
      assert.ok(r.blockers.some((b) => /repo-state:wrong-branch/.test(b)));
    });
    await check('gen fail-closed: index lock', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'gen-lock');
      writeFileSync(path.join(fx.repoRoot, '.git', 'index.lock'), '', 'utf-8');
      const r = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT });
      assert.strictEqual(r.ok, false);
      assert.ok(r.blockers.some((b) => /repo-state:index-lock-present/.test(b)));
    });

    // ══ H. validator happy + roundtrip ═══════════════════════════════════
    {
      const fx = await setupCandidateRepo(tmpRoot, 'val-happy');
      const target = makeTargetFromCandidate(fx.candidate);
      const recFp = recordFpFor(fx.candidate);
      const approvedPath = writeAuthFixture(fx.repoRoot, makeAuth({ head: fx.head, planFp: fx.planFp, recFp, target, approved: true }), 'approved.json');
      const invBefore = snapshotTree(fx.repoRoot, ['.md', '.publish.json']);
      const res = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: approvedPath, sourcePath: CAND_SOURCE });
      const invAfter = snapshotTree(fx.repoRoot, ['.md', '.publish.json']);
      allOutputs.push(validateFormatJson(res), validateFormatHuman(res));
      await check('val: approved → applyReady + mutationPerformed false', () => {
        assert.strictEqual(res.documentValid, true, JSON.stringify(res.blockers));
        assert.strictEqual(res.repositoryBindingsMatched, true, JSON.stringify(res.blockers));
        assert.strictEqual(res.planBindingsMatched, true, JSON.stringify(res.blockers));
        assert.strictEqual(res.recordBindingsMatched, true, JSON.stringify(res.blockers));
        assert.strictEqual(res.explicitlyAuthorized, true);
        assert.strictEqual(res.applyReady, true);
        assert.strictEqual(res.mutationPerformed, false);
        assert.deepStrictEqual(res.blockers, []);
      });
      await check('val: no repo mutation from applyReady run', () => assert.deepStrictEqual(invMap(invAfter), invMap(invBefore)));
      await check('val: JSON deterministic + stable field set', () => {
        assert.strictEqual(validateFormatJson(res), validateFormatJson(res));
        const j = JSON.parse(validateFormatJson(res));
        for (const k of ['ok', 'mode', 'sourcePath', 'branch', 'sourceHead', 'planFingerprint', 'recordFingerprint',
          'documentValid', 'repositoryBindingsMatched', 'planBindingsMatched', 'recordBindingsMatched',
          'explicitlyAuthorized', 'applyReady', 'mutationPerformed', 'blockers']) {
          assert.ok(k in j, `missing ${k}`);
        }
        assert.ok(!('authorizationPath' in j), 'must not echo authorization path');
      });
      // unapproved draft
      const unapprovedPath = writeAuthFixture(fx.repoRoot, makeAuth({ head: fx.head, planFp: fx.planFp, recFp, target, approved: false }), 'unapproved.json');
      const resU = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: unapprovedPath, sourcePath: CAND_SOURCE });
      allOutputs.push(validateFormatJson(resU));
      await check('val: unapproved → documentValid + bindings matched, applyReady false', () => {
        assert.strictEqual(resU.documentValid, true);
        assert.strictEqual(resU.repositoryBindingsMatched, true, JSON.stringify(resU.blockers));
        assert.strictEqual(resU.planBindingsMatched, true);
        assert.strictEqual(resU.recordBindingsMatched, true);
        assert.strictEqual(resU.explicitlyAuthorized, false);
        assert.strictEqual(resU.applyReady, false);
        assert.ok(resU.blockers.includes('explicit-authorization-not-granted'));
      });
      // roundtrip: generator draft → flip approval → validate
      const gen = await prepareWithdrawalAuthorizationDraft({ projectRoot: fx.repoRoot, sourcePath: CAND_SOURCE, ...INTENT });
      const flipped = { ...gen.draft, approval: { explicitlyAuthorized: true } };
      const rtPath = writeAuthFixture(fx.repoRoot, flipped, 'roundtrip.json');
      const rt = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: rtPath, sourcePath: CAND_SOURCE });
      await check('val: roundtrip generator→flip→validate → applyReady', () => {
        assert.strictEqual(rt.applyReady, true, JSON.stringify(rt.blockers));
        assert.strictEqual(rt.mutationPerformed, false);
      });
      global.__valHappyFx = { fx, target, recFp };
    }

    // ══ I. validator binding mismatches ══════════════════════════════════
    {
      const { fx, target, recFp } = global.__valHappyFx;
      const mism = [
        ['stale HEAD', makeAuth({ head: '0'.repeat(40), planFp: fx.planFp, recFp, target, approved: true }), 'repository-head-mismatch'],
        ['stale plan fp', makeAuth({ head: fx.head, planFp: 'a'.repeat(64), recFp, target, approved: true }), 'plan-fingerprint-mismatch'],
        ['stale record fp', makeAuth({ head: fx.head, planFp: fx.planFp, recFp: 'a'.repeat(64), target, approved: true }), 'record-fingerprint-mismatch'],
        ['stale source hash', makeAuth({ head: fx.head, planFp: fx.planFp, recFp, target: { ...target, expectedSourceSha256: 'f'.repeat(64) }, approved: true }), 'source-sha-mismatch'],
        ['stale sidecar hash', makeAuth({ head: fx.head, planFp: fx.planFp, recFp, target: { ...target, expectedSidecarSha256: 'f'.repeat(64) }, approved: true }), 'sidecar-sha-mismatch'],
        ['stale url fingerprint', makeAuth({ head: fx.head, planFp: fx.planFp, recFp, target: { ...target, expectedPublishedUrlFingerprint: 'f'.repeat(64) }, approved: true }), 'published-url-fingerprint-mismatch'],
      ];
      for (const [label, auth, expected] of mism) {
        await check(`val mismatch: ${label} → applyReady false + ${expected}`, async () => {
          const p = writeAuthFixture(fx.repoRoot, auth, `mism-${label.replace(/\s/g, '-')}.json`);
          const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: p, sourcePath: CAND_SOURCE });
          allOutputs.push(validateFormatJson(r));
          assert.strictEqual(r.applyReady, false);
          assert.ok(r.blockers.includes(expected), `blockers=${JSON.stringify(r.blockers)}`);
        });
      }
      // target-source-path mismatch: CLI source-path != auth.target.sourcePath.
      await check('val mismatch: source-path != auth target sourcePath', async () => {
        // auth built for CAND_SOURCE but we pass a different (also-candidate-shaped) source-path
        const p = writeAuthFixture(fx.repoRoot, makeAuth({ head: fx.head, planFp: fx.planFp, recFp, target, approved: true }), 'target-mismatch.json');
        const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: p, sourcePath: 'content/blogger/posts/other-post.md' });
        assert.strictEqual(r.applyReady, false);
        assert.ok(r.blockers.includes('target-source-path-mismatch') || r.blockers.includes('candidate-not-found'));
      });
    }

    // ══ J. validator repo-state / preview-artifact ═══════════════════════
    await check('val repo-state: dirty tree → applyReady false', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'val-dirty');
      const p = writeAuthFixture(fx.repoRoot, makeAuth({ head: fx.head, planFp: fx.planFp, recFp: recordFpFor(fx.candidate), target: makeTargetFromCandidate(fx.candidate), approved: true }), 'a.json');
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# dirty\n', 'utf-8');
      const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: p, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.applyReady, false);
      assert.ok(r.blockers.some((b) => /repo-state:dirty-working-tree/.test(b)));
    });
    await check('val repo-state: preview artifact present → applyReady false', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'val-preview');
      const p = writeAuthFixture(fx.repoRoot, makeAuth({ head: fx.head, planFp: fx.planFp, recFp: recordFpFor(fx.candidate), target: makeTargetFromCandidate(fx.candidate), approved: true }), 'a.json');
      mkdirSync(path.join(fx.repoRoot, 'dist-blogger-preview'), { recursive: true });
      const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: p, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.applyReady, false);
      assert.ok(r.blockers.includes('preview-artifact-present'));
    });
    await check('val repo-state: stale HEAD (repo advanced) → head-mismatch', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'val-advance');
      const p = writeAuthFixture(fx.repoRoot, makeAuth({ head: fx.head, planFp: fx.planFp, recFp: recordFpFor(fx.candidate), target: makeTargetFromCandidate(fx.candidate), approved: true }), 'a.json');
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# after\n', 'utf-8');
      git(fx.repoRoot, ['add', 'README.md']);
      git(fx.repoRoot, ['commit', '--quiet', '-m', 'advance']);
      git(fx.repoRoot, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
      const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: p, sourcePath: CAND_SOURCE });
      assert.strictEqual(r.applyReady, false);
      assert.ok(r.blockers.includes('repository-head-mismatch'));
    });

    // ══ K. authorization file boundary (symlink / dir / missing) ═════════
    await check('val: missing authorization file → authorization-unreadable', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'val-missing');
      const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: path.join(fx.repoRoot, 'fixtures', 'nope.json'), sourcePath: CAND_SOURCE });
      assert.strictEqual(r.documentValid, false);
      assert.ok(r.blockers.includes('authorization-unreadable'));
    });
    await check('val: authorization is a directory → not-regular-file', async () => {
      const fx = await setupCandidateRepo(tmpRoot, 'val-dir');
      const d = path.join(fx.repoRoot, 'fixtures', 'authdir');
      mkdirSync(d, { recursive: true });
      const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: d, sourcePath: CAND_SOURCE });
      assert.ok(r.blockers.includes('authorization-not-regular-file'));
    });
    {
      // symlink authorization → fail-closed (skip if platform can't symlink)
      let symOk = true;
      try {
        const probe = mkdtempSync(path.join(tmpRoot, 'symprobe-'));
        writeFileSync(path.join(probe, 't'), 'x');
        symlinkSync(path.join(probe, 't'), path.join(probe, 'l'), 'file');
      } catch { symOk = false; }
      await check('val: authorization symlink → fail-closed (or skip)', async () => {
        if (!symOk) { assert.ok(true); return; }
        const fx = await setupCandidateRepo(tmpRoot, 'val-symlink');
        const realAuth = writeAuthFixture(fx.repoRoot, makeAuth({ head: fx.head, planFp: fx.planFp, recFp: recordFpFor(fx.candidate), target: makeTargetFromCandidate(fx.candidate), approved: true }), 'real.json');
        const linkPath = path.join(fx.repoRoot, 'fixtures', 'link.json');
        symlinkSync(realAuth, linkPath, 'file');
        const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: linkPath, sourcePath: CAND_SOURCE });
        assert.strictEqual(r.applyReady, false);
        assert.ok(r.blockers.includes('authorization-symlink'));
      });
    }

    // ══ L. redaction: inject secrets, assert zero leakage ════════════════
    {
      const fx = await setupCandidateRepo(tmpRoot, 'redact', { publishedUrl: 'https://secret.invalid/private-post' });
      // authorization doc laced with secrets in an extra key + operator-ish values → rejected.
      const laced = {
        ...makeAuth({ head: fx.head, planFp: fx.planFp, recFp: recordFpFor(fx.candidate), target: makeTargetFromCandidate(fx.candidate), approved: true }),
        SECRET_OPERATOR: 'SECRET-OPERATOR-NAME',
        operatorEmail: 'secret@example.invalid',
        privatePath: '/d/private/operator/authorization.json',
      };
      const p = writeAuthFixture(fx.repoRoot, laced, 'laced.json');
      const r = await preflightWithdrawalAuthorization({ projectRoot: fx.repoRoot, authorizationPath: p, sourcePath: CAND_SOURCE });
      allOutputs.push(validateFormatJson(r), validateFormatHuman(r), r.blockers.join('\n'));
      await check('redact: laced authorization rejected via safe slug', () => {
        assert.strictEqual(r.documentValid, false);
        assert.ok(r.blockers.includes('authorization-unknown-top-level-key'));
      });
      // candidate publishedUrl is a secret; validator output must not contain its fingerprint source.
      await check('redact: secret publishedUrl host absent from all validator output', () => {
        const out = validateFormatJson(r) + validateFormatHuman(r);
        assert.ok(!out.includes('secret.invalid'));
      });
    }
    // aggregate no-leak scan across every captured output
    await check('redact: zero secret hits across ALL captured stdout/stderr/blockers', () => {
      const joined = allOutputs.join('\n');
      for (const s of SECRET_STRINGS) {
        assert.ok(!joined.includes(s), `LEAK: ${s}`);
      }
    });

    // ══ M. real repository smoke (read-only) ═════════════════════════════
    const realHead = git(REPO_ROOT, ['rev-parse', 'HEAD']);
    const realPlan = await planBloggerWithdrawals({ repoRoot: REPO_ROOT, gitHead: realHead });
    await check('real: candidateCount === 1', () => assert.strictEqual(realPlan.summary.candidateCount, 1));
    await check('real: authorizationEligibleCount === 0', () => assert.strictEqual(realPlan.summary.authorizationEligibleCount, 0));
    await check('real: unique candidate remains not authorization eligible', () => {
      const c = realPlan.candidates[0];
      assert.strictEqual(c.authorizationEligible, false);
      assert.strictEqual(c.remoteDisposition, null);
      assert.strictEqual(c.nextAction, 'verify-remote-disposition');
    });
    await check('real: generator against real candidate WITHOUT remote-disposition → CLI fail-closed exit 2, no draft', () => {
      const r = runCli(PREPARE_CLI, ['--source-path', realPlan.candidates[0].sourcePath, '--remote-verified-at', INTENT.remoteVerifiedAt, '--reason', 'content-retirement']);
      allOutputs.push(r.stdout, r.stderr);
      assert.strictEqual(r.status, 2, r.stderr);
      assert.strictEqual(r.stdout, '', 'no draft on stdout');
      assert.ok(/--remote-disposition.*is required/i.test(r.stderr));
    });

    // final aggregate leak scan (includes real-repo CLI output)
    await check('redact(final): zero secret hits across ALL outputs incl. real-repo CLI', () => {
      const joined = allOutputs.join('\n');
      for (const s of SECRET_STRINGS) assert.ok(!joined.includes(s), `LEAK: ${s}`);
    });
  } finally {
    try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* ignore */ }
    delete global.__genHappyFx;
    delete global.__valHappyFx;
  }

  // ── production / deploy no-write verification ────────────────────────────
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

  console.log('');
  console.log(`[check:blogger-withdrawal-authorization] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[check:blogger-withdrawal-authorization] UNEXPECTED ERROR: ${err.stack || err.message || err}`);
  process.exit(1);
});
