#!/usr/bin/env node
// Phase 20260714-C-pre：admin-git-safety-preflight（唯讀 repository safety preflight）contract guard。
//
// 範圍 / 邊界：
//   - 所有 gate 斷言在 **OS temp 目錄** 之 isolated 臨時 git repository 上跑（各自 git init、
//     可建 commits / refs，spec §7 明允）；**絕不**污染 production repository / dist / settings /
//     gh-pages；所有 temp 目錄於 finally{} 清除（無 residue）。
//   - production repository 只做 **read-only smoke**：呼叫被測 helper 之唯讀 API，並斷言 smoke
//     前後 HEAD / working tree / index.lock 三者狀態不變（證明零 mutation）。
//   - 被測 helper（admin-git-safety-preflight.js）本身只跑 read-only git 子命令；本 guard 另以
//     source 靜態掃描斷言其 runGit call site 皆在 allowlist、且未用 fetch/pull/push 等 mutation。
//   - 亦回歸斷言 Phase B planner 仍拒絕 `--apply`、既有 real-write whitelist 未被本 slice 動到。
//
// 執行：`npm run check:admin-git-safety-preflight`（或 `node src/scripts/check-admin-git-safety-preflight.js`）。

import assert from 'node:assert';
import fs from 'node:fs/promises';
import { existsSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluatePreflight,
  runCli,
  runGit,
  samePath,
  parsePorcelainZ,
  formatReport,
  exitCodeFor,
  DANGEROUS_CLI_FLAGS,
  FAILURE_EXIT,
} from './admin-git-safety-preflight.js';
import { runCli as redraftRunCli } from './redraft-plan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

let pass = 0;
let fail = 0;
const fails = [];
function record(name, ok, msg) {
  if (ok) { pass += 1; console.log(`[PASS] ${name}`); }
  else { fail += 1; fails.push(`${name} — ${msg}`); console.error(`[FAIL] ${name}\n       ${msg}`); }
}
async function check(name, fn) {
  try { await fn(); record(name, true); }
  catch (err) { record(name, false, err.message); }
}

const SECRET_MARKER = 'TOPSECRET-DO-NOT-LEAK-xyz789';

// ── temp-repo git helpers（僅作用於 OS temp fixture；production 永不觸及）─────────────────
const tempDirs = [];
async function mkTemp(label) {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), `git-safety-${label}-`));
  tempDirs.push(d);
  return d;
}
function git(args, cwd, { allowFail = false } = {}) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf-8', shell: false, windowsHide: true });
  if (!allowFail && res.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed (${res.status}): ${res.stderr || res.stdout}`);
  }
  return { status: res.status, stdout: (res.stdout || '').trim(), stderr: res.stderr || '' };
}
function initRepo(dir) {
  git(['init', '-b', 'main'], dir);
  git(['config', 'user.email', 'test@example.com'], dir);
  git(['config', 'user.name', 'Test Fixture'], dir);
  git(['config', 'commit.gpgsign', 'false'], dir);
}
// 用 git toplevel 當 canonical projectRoot，避免 Windows short/long path 造成 repo-root-mismatch 誤判。
function rootOf(dir) {
  return path.resolve(git(['rev-parse', '--show-toplevel'], dir).stdout);
}
function commitFile(dir, name, content, msg) {
  writeFileSync(path.join(dir, name), content, 'utf-8');
  git(['add', name], dir);
  git(['commit', '-m', msg], dir);
  return git(['rev-parse', 'HEAD'], dir).stdout;
}
function setOriginMain(dir, sha) {
  git(['update-ref', 'refs/remotes/origin/main', sha], dir);
}
function commitTreeChild(dir, parentSha, msg) {
  const tree = git(['rev-parse', `${parentSha}^{tree}`], dir).stdout;
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@e.com',
    GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@e.com',
  };
  const res = spawnSync('git', ['commit-tree', tree, '-p', parentSha, '-m', msg], {
    cwd: dir, encoding: 'utf-8', shell: false, windowsHide: true, env,
  });
  if (res.status !== 0) throw new Error(`commit-tree failed: ${res.stderr}`);
  return res.stdout.trim();
}

async function main() {
  // ── pure-unit：parser / samePath / runGit allowlist / flags ──────────────────────────
  await check('(parse) staged/unstaged/untracked/deleted porcelain-z counts', () => {
    const z = ['A  new.md', ' M mod.md', '?? untracked.txt', ' D gone.md'].join('\0') + '\0';
    const entries = parsePorcelainZ(z);
    assert.strictEqual(entries.length, 4);
    assert.deepStrictEqual(entries.map((e) => e.path).sort(), ['gone.md', 'mod.md', 'new.md', 'untracked.txt']);
  });

  await check('(parse) rename record consumes the extra source-path token', () => {
    // rename：`R  new\0old\0`（-z 下 old path 為獨立 token）
    const z = 'R  newname.md\0oldname.md\0 M other.md\0';
    const entries = parsePorcelainZ(z);
    assert.strictEqual(entries.length, 2, 'rename = 1 record (not 2) + 1 modify');
    assert.deepStrictEqual(entries.map((e) => e.path), ['newname.md', 'other.md']);
  });

  await check('(parse) empty output → 0 entries', () => {
    assert.strictEqual(parsePorcelainZ('').length, 0);
    assert.strictEqual(parsePorcelainZ('\0').length, 0);
  });

  await check('(samePath) equal paths match; different paths differ', () => {
    assert.strictEqual(samePath(REPO_ROOT, REPO_ROOT), true);
    assert.strictEqual(samePath(REPO_ROOT, path.join(REPO_ROOT, 'src')), false);
    assert.strictEqual(samePath(REPO_ROOT, 42), false);
  });

  await check('(runGit) refuses non-read-only subcommands (push/commit/fetch/reset/clean)', () => {
    for (const sub of ['push', 'commit', 'fetch', 'pull', 'reset', 'checkout', 'stash', 'clean', 'update-ref', 'init']) {
      const r = runGit([sub, '--whatever'], os.tmpdir());
      assert.strictEqual(r.ok, false, `${sub} must be refused`);
      assert.ok(/refused non-read-only git subcommand/.test(r.stderr), `${sub} refusal message`);
    }
  });

  await check('(flags) DANGEROUS_CLI_FLAGS covers write/mutation/repair set', () => {
    for (const f of ['--apply', '--write', '--fix', '--repair', '--unlock', '--delete-lock',
      '--reset', '--checkout', '--stash', '--clean', '--fetch', '--pull', '--push', '--commit', '--deploy']) {
      assert.ok(DANGEROUS_CLI_FLAGS.has(f), `${f} must be rejected`);
    }
  });

  // ── fixture: PASS（main / 0-0 / clean / no lock）─────────────────────────────────────
  await check('(PASS) main + 0/0 + clean + no lock → eligible, exit 0', async () => {
    const dir = await mkTemp('pass');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'hello\n', 'c1');
    setOriginMain(dir, c1);
    const root = rootOf(dir);
    const report = evaluatePreflight({ projectRoot: root });
    assert.strictEqual(report.eligible, true, JSON.stringify(report.failures));
    assert.strictEqual(report.branch, 'main');
    assert.strictEqual(report.ahead, 0);
    assert.strictEqual(report.behind, 0);
    assert.strictEqual(report.workingTreeClean, true);
    assert.strictEqual(report.dirtyEntryCount, 0);
    assert.strictEqual(report.indexLockPresent, false);
    assert.strictEqual(exitCodeFor(report), 0);
    assert.strictEqual(runCli({ argv: [], projectRoot: root }).exit, 0);
  });

  // ── fixture: wrong branch ────────────────────────────────────────────────────────────
  await check('(hard-fail) feature branch → wrong-branch, exit 13', async () => {
    const dir = await mkTemp('feature');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    setOriginMain(dir, c1);
    git(['checkout', '-b', 'feature'], dir);
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    assert.strictEqual(report.eligible, false);
    assert.ok(report.failures.some((f) => f.code === 'wrong-branch'), 'wrong-branch expected');
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['wrong-branch']);
  });

  // ── fixture: detached HEAD ───────────────────────────────────────────────────────────
  await check('(hard-fail) detached HEAD → detached-head, exit 14', async () => {
    const dir = await mkTemp('detached');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    setOriginMain(dir, c1);
    git(['checkout', '--detach', c1], dir);
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    assert.strictEqual(report.eligible, false);
    assert.ok(report.failures.some((f) => f.code === 'detached-head'), 'detached-head expected');
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['detached-head']);
  });

  // ── fixture: missing local main ref（fresh unborn repo）───────────────────────────────
  await check('(hard-fail) missing refs/heads/main (unborn repo) → missing-main-ref present', async () => {
    const dir = await mkTemp('nomain');
    initRepo(dir); // 無任何 commit → main unborn
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    assert.strictEqual(report.eligible, false);
    assert.ok(report.failures.some((f) => f.code === 'missing-main-ref'), 'missing-main-ref expected');
    assert.strictEqual(report.mainHead, null);
  });

  // ── fixture: missing origin/main ref ─────────────────────────────────────────────────
  await check('(hard-fail) missing refs/remotes/origin/main → missing-origin-main-ref, exit 16', async () => {
    const dir = await mkTemp('noorigin');
    initRepo(dir);
    commitFile(dir, 'a.md', 'x\n', 'c1'); // 不建 origin/main
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    assert.strictEqual(report.eligible, false);
    assert.ok(report.failures.some((f) => f.code === 'missing-origin-main-ref'), 'missing-origin-main-ref expected');
    assert.strictEqual(report.originMainHead, null);
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['missing-origin-main-ref']);
  });

  // ── fixture: ahead 1 / behind 0 ──────────────────────────────────────────────────────
  await check('(hard-fail) ahead 1 / behind 0 → ahead-of-origin, exit 17', async () => {
    const dir = await mkTemp('ahead');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    setOriginMain(dir, c1);
    commitFile(dir, 'b.md', 'y\n', 'c2'); // main 前進一步；origin/main 仍 c1
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    assert.strictEqual(report.ahead, 1);
    assert.strictEqual(report.behind, 0);
    assert.ok(report.failures.some((f) => f.code === 'ahead-of-origin'));
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['ahead-of-origin']);
  });

  // ── fixture: ahead 0 / behind 1（commit-tree child，tree 相同 → 保持 clean）───────────
  await check('(hard-fail) ahead 0 / behind 1 → behind-origin, exit 18 (tree stays clean)', async () => {
    const dir = await mkTemp('behind');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    const child = commitTreeChild(dir, c1, 'origin-ahead'); // 與 c1 同 tree
    setOriginMain(dir, child);
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    assert.strictEqual(report.ahead, 0);
    assert.strictEqual(report.behind, 1);
    assert.strictEqual(report.workingTreeClean, true, 'tree must remain clean (same tree)');
    assert.ok(report.failures.some((f) => f.code === 'behind-origin'));
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['behind-origin']);
  });

  // ── fixture: diverged 1 / 1 ──────────────────────────────────────────────────────────
  await check('(hard-fail) ahead 1 / behind 1 → diverged, exit 19', async () => {
    const dir = await mkTemp('diverged');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    const sibling = commitTreeChild(dir, c1, 'origin-sibling');
    setOriginMain(dir, sibling);           // origin/main = c1 的另一 child
    commitFile(dir, 'b.md', 'y\n', 'c2');  // main = c1 的 real child（不同 commit）
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    assert.strictEqual(report.ahead, 1);
    assert.strictEqual(report.behind, 1);
    assert.ok(report.failures.some((f) => f.code === 'diverged'));
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['diverged']);
  });

  // ── fixture: dirty variants ──────────────────────────────────────────────────────────
  async function dirtyRepo(label, mutate) {
    const dir = await mkTemp(label);
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'base\n', 'c1');
    setOriginMain(dir, c1);
    await mutate(dir);
    return evaluatePreflight({ projectRoot: rootOf(dir) });
  }

  await check('(hard-fail) staged change → dirty-working-tree, exit 20', async () => {
    const report = await dirtyRepo('staged', (dir) => {
      writeFileSync(path.join(dir, 'new.md'), 'new\n', 'utf-8');
      git(['add', 'new.md'], dir);
    });
    assert.strictEqual(report.workingTreeClean, false);
    assert.ok(report.dirtyEntryCount >= 1);
    assert.ok(report.failures.some((f) => f.code === 'dirty-working-tree'));
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['dirty-working-tree']);
  });

  await check('(hard-fail) unstaged change → dirty-working-tree', async () => {
    const report = await dirtyRepo('unstaged', (dir) => {
      writeFileSync(path.join(dir, 'a.md'), 'modified\n', 'utf-8');
    });
    assert.strictEqual(report.workingTreeClean, false);
    assert.ok(report.failures.some((f) => f.code === 'dirty-working-tree'));
  });

  await check('(hard-fail) untracked file → dirty-working-tree', async () => {
    const report = await dirtyRepo('untracked', (dir) => {
      writeFileSync(path.join(dir, 'untracked.txt'), 'stuff\n', 'utf-8');
    });
    assert.strictEqual(report.workingTreeClean, false);
    assert.ok(report.failures.some((f) => f.code === 'dirty-working-tree'));
  });

  await check('(hard-fail) deleted tracked file → dirty-working-tree', async () => {
    const report = await dirtyRepo('deleted', (dir) => {
      rmSync(path.join(dir, 'a.md'));
    });
    assert.strictEqual(report.workingTreeClean, false);
    assert.ok(report.failures.some((f) => f.code === 'dirty-working-tree'));
  });

  await check('(hard-fail) conflicted / unmerged state → dirty-working-tree', async () => {
    const dir = await mkTemp('conflict');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'base\n', 'c1');
    git(['checkout', '-b', 'other'], dir);
    commitFile(dir, 'a.md', 'other change\n', 'other');
    git(['checkout', 'main'], dir);
    commitFile(dir, 'a.md', 'main change\n', 'mainc');
    git(['merge', 'other'], dir, { allowFail: true }); // 觸發衝突（非 0 exit，忽略）
    const head = git(['rev-parse', 'HEAD'], dir).stdout;
    setOriginMain(dir, head); // 隔離：只讓 dirty 觸發，非 ahead/behind
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    assert.strictEqual(report.workingTreeClean, false, 'unmerged state must be dirty');
    assert.ok(report.dirtyEntryCount >= 1);
    assert.ok(report.failures.some((f) => f.code === 'dirty-working-tree'));
  });

  // ── fixture: index.lock present（且斷言不被刪除 / 修改）──────────────────────────────
  await check('(hard-fail) index.lock present → index-lock-present, exit 21; lock untouched', async () => {
    const dir = await mkTemp('lock');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    setOriginMain(dir, c1);
    const lockPath = path.join(dir, '.git', 'index.lock');
    writeFileSync(lockPath, 'lock-marker', 'utf-8');
    const beforeContent = readFileSync(lockPath, 'utf-8');
    const beforeMtime = statSync(lockPath).mtimeMs;
    const report = evaluatePreflight({ projectRoot: rootOf(dir) });
    runCli({ argv: ['--json'], projectRoot: rootOf(dir) }); // 再跑一次（含 CLI 路徑）
    assert.strictEqual(report.indexLockPresent, true);
    assert.ok(report.failures.some((f) => f.code === 'index-lock-present'));
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['index-lock-present']);
    // lock 不得被刪除 / 修改
    assert.ok(existsSync(lockPath), 'index.lock must NOT be deleted');
    assert.strictEqual(readFileSync(lockPath, 'utf-8'), beforeContent, 'index.lock content must be unchanged');
    assert.strictEqual(statSync(lockPath).mtimeMs, beforeMtime, 'index.lock mtime must be unchanged');
  });

  // ── fixture: repo-root mismatch（傳入 subdir）─────────────────────────────────────────
  await check('(hard-fail) projectRoot = subdir of repo → repo-root-mismatch, exit 12', async () => {
    const dir = await mkTemp('subdir');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    setOriginMain(dir, c1);
    const sub = path.join(rootOf(dir), 'content');
    await fs.mkdir(sub, { recursive: true });
    const report = evaluatePreflight({ projectRoot: sub });
    assert.strictEqual(report.eligible, false);
    assert.ok(report.failures.some((f) => f.code === 'repo-root-mismatch'), 'repo-root-mismatch expected');
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['repo-root-mismatch']);
  });

  // ── fixture: non-git directory ───────────────────────────────────────────────────────
  await check('(hard-fail) non-git directory → not-git-repository, exit 11', async () => {
    const dir = await mkTemp('nogit'); // 無 git init
    const report = evaluatePreflight({ projectRoot: dir });
    assert.strictEqual(report.eligible, false);
    assert.ok(report.failures.some((f) => f.code === 'not-git-repository'), 'not-git-repository expected');
    assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['not-git-repository']);
  });

  // ── invalid project root ─────────────────────────────────────────────────────────────
  await check('(hard-fail) invalid projectRoot (relative / missing / null) → invalid-project-root, exit 10', () => {
    for (const bad of ['relative/path', '', null, undefined, path.join(os.tmpdir(), 'definitely-missing-xyz-123')]) {
      const report = evaluatePreflight({ projectRoot: bad });
      assert.ok(report.failures.some((f) => f.code === 'invalid-project-root'), `${bad} → invalid-project-root`);
      assert.strictEqual(exitCodeFor(report), FAILURE_EXIT['invalid-project-root']);
    }
  });

  // ── determinism（human + json）───────────────────────────────────────────────────────
  await check('(determinism) human + json output byte-identical across runs; JSON key order fixed', async () => {
    const dir = await mkTemp('determ');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    setOriginMain(dir, c1);
    const root = rootOf(dir);
    const h1 = formatReport(evaluatePreflight({ projectRoot: root }), { json: false });
    const h2 = formatReport(evaluatePreflight({ projectRoot: root }), { json: false });
    assert.strictEqual(h1, h2, 'human output must be deterministic');
    const j1 = runCli({ argv: ['--json'], projectRoot: root }).stdout;
    const j2 = runCli({ argv: ['--json'], projectRoot: root }).stdout;
    assert.strictEqual(j1, j2, 'json output must be deterministic');
    const keys = Object.keys(JSON.parse(j1));
    assert.deepStrictEqual(keys.slice(0, 6), ['schemaVersion', 'mode', 'repositoryRoot', 'projectRoot', 'branch', 'head']);
    assert.ok(keys.includes('networkFetchPerformed') && keys.includes('writePerformed'));
  });

  // ── JSON 無 secrets / 無檔案內容 / 無 repo 外部絕對路徑 ──────────────────────────────
  await check('(no leak) JSON output carries paths only — no secret file contents', async () => {
    const dir = await mkTemp('leak');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    setOriginMain(dir, c1);
    writeFileSync(path.join(dir, 'notes.txt'), `secret body: ${SECRET_MARKER}\n`, 'utf-8');
    const root = rootOf(dir);
    const jsonOut = runCli({ argv: ['--json'], projectRoot: root }).stdout;
    const humanOut = runCli({ argv: [], projectRoot: root }).stdout;
    assert.ok(!jsonOut.includes(SECRET_MARKER), 'JSON must not leak file contents');
    assert.ok(!humanOut.includes(SECRET_MARKER), 'human must not leak file contents');
    // dirtyPaths 為 repo-relative（不含 repo 外部絕對路徑）
    const parsed = JSON.parse(jsonOut);
    assert.ok(parsed.dirtyPaths.includes('notes.txt'), 'dirtyPaths should list the repo-relative path');
    for (const p of parsed.dirtyPaths) {
      assert.ok(!path.isAbsolute(p), `dirtyPath must be repo-relative, got ${p}`);
    }
    for (const key of ['password', 'token', 'secret', 'credential']) {
      assert.ok(!JSON.parse(jsonOut).failures.some((f) => f.message.toLowerCase().includes(key)), `no ${key} in failures`);
    }
  });

  // ── source no-write git command contract（靜態掃描 helper 原始碼）─────────────────────
  await check('(source contract) every runGit call site uses a read-only allowlisted subcommand', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-git-safety-preflight.js'), 'utf-8');
    const ALLOWED = new Set(['rev-parse', 'branch', 'rev-list', 'status']);
    // 掃 runGit(['<sub>' , ...） 呼叫點
    const callRe = /runGit\(\s*\[\s*'([^']+)'/g;
    let m;
    let count = 0;
    while ((m = callRe.exec(src)) !== null) {
      count += 1;
      assert.ok(ALLOWED.has(m[1]), `runGit call uses non-allowlisted subcommand: ${m[1]}`);
    }
    assert.ok(count >= 5, `expected ≥5 runGit call sites, saw ${count}`);
    // 只用 spawnSync（不得用 exec / execSync / spawn 非同步逃逸）
    assert.ok(/spawnSync/.test(src), 'must use spawnSync');
    assert.ok(!/\bexecSync\b/.test(src) && !/child_process'\s*\)?\s*;?[^\n]*\bexec\b/.test(src), 'must not use exec/execSync');
    // 不得對 git 直接下 mutation / network 子命令字面
    assert.ok(!/spawnSync\('git',\s*\[\s*'(fetch|pull|push|commit|reset|checkout|stash|clean|merge|rebase|update-ref|update-index|init|add|rm|apply)'/.test(src),
      'no direct mutation/network git spawn literal');
  });

  await check('(source contract) helper does not perform network fetch/pull/push', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-git-safety-preflight.js'), 'utf-8');
    // runGit call sites 不含 fetch/pull/push
    assert.ok(!/runGit\(\s*\[\s*'(fetch|pull|push)'/.test(src), 'no fetch/pull/push via runGit');
    // report 明示 networkFetchPerformed:false / writePerformed:false
    assert.ok(/networkFetchPerformed:\s*false/.test(src), 'networkFetchPerformed must be false');
    assert.ok(/writePerformed:\s*false/.test(src), 'writePerformed must be false');
  });

  // ── production repository read-only smoke（HEAD / tree / lock 前後不變）───────────────
  await check('(prod smoke) read-only against production repo; HEAD/tree/lock unchanged', () => {
    const headBefore = git(['rev-parse', 'HEAD'], REPO_ROOT).stdout;
    const statusBefore = spawnSync('git', ['status', '--porcelain=v1', '-z'], { cwd: REPO_ROOT, encoding: 'utf-8', shell: false }).stdout;
    const lockPath = path.join(REPO_ROOT, '.git', 'index.lock');
    const lockBefore = existsSync(lockPath);

    const report = evaluatePreflight({ projectRoot: REPO_ROOT });
    const cli = runCli({ argv: ['--json'], projectRoot: REPO_ROOT });

    // well-formed & 真的指到 production repo、branch main、無 network/write
    assert.strictEqual(report.mode, 'read-only-preflight');
    assert.strictEqual(samePath(report.repositoryRoot, REPO_ROOT), true, 'repositoryRoot must equal REPO_ROOT');
    assert.strictEqual(report.branch, 'main', 'production branch should be main');
    assert.strictEqual(report.networkFetchPerformed, false);
    assert.strictEqual(report.writePerformed, false);
    assert.ok(typeof cli.exit === 'number');

    const headAfter = git(['rev-parse', 'HEAD'], REPO_ROOT).stdout;
    const statusAfter = spawnSync('git', ['status', '--porcelain=v1', '-z'], { cwd: REPO_ROOT, encoding: 'utf-8', shell: false }).stdout;
    const lockAfter = existsSync(lockPath);
    assert.strictEqual(headAfter, headBefore, 'production HEAD must be unchanged');
    assert.strictEqual(statusAfter, statusBefore, 'production working tree must be unchanged');
    assert.strictEqual(lockAfter, lockBefore, 'production index.lock state must be unchanged');
  });

  // ── 回歸：Phase B planner 仍拒絕 --apply；既有 real-write whitelist 未被本 slice 動到 ──
  await check('(regression) Phase B redraft planner still rejects --apply (exit 2)', async () => {
    const r = await redraftRunCli({ argv: ['--slug=whatever', '--op=redraft', '--apply'], projectRoot: REPO_ROOT });
    assert.strictEqual(r.exit, 2, '--apply must exit 2 in Phase B planner');
    assert.strictEqual(r.result.error, 'write-flag-not-supported');
  });

  await check('(red line) existing real-write whitelist unchanged — no status/draft added', () => {
    const patcher = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-frontmatter-patcher.js'), 'utf-8');
    const mP = patcher.match(/const ALLOWED_TOP_LEVEL_KEYS = new Set\(\[([^\]]*)\]\)/);
    assert.ok(mP, 'ALLOWED_TOP_LEVEL_KEYS present');
    assert.ok(mP[1].includes("'description'") && mP[1].includes("'searchDescription'"));
    assert.ok(!/status/.test(mP[1]) && !/draft/.test(mP[1]), 'patcher whitelist must NOT include status/draft');

    const cli = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-write-cli.js'), 'utf-8');
    const mC = cli.match(/const ALLOWED_FIELDS = new Set\(\[([^\]]*)\]\)/);
    assert.ok(mC, 'ALLOWED_FIELDS present');
    assert.ok(mC[1].includes("'description'") && mC[1].includes("'searchDescription'"));
    assert.ok(!/status/.test(mC[1]) && !/draft/.test(mC[1]), 'cli whitelist must NOT include status/draft');
  });

  // ── CLI：所有危險參數 non-zero exit ──────────────────────────────────────────────────
  await check('(reject) every dangerous CLI flag → exit 2 unsupported-argument', async () => {
    const dir = await mkTemp('reject');
    initRepo(dir);
    const c1 = commitFile(dir, 'a.md', 'x\n', 'c1');
    setOriginMain(dir, c1);
    const root = rootOf(dir);
    for (const flag of DANGEROUS_CLI_FLAGS) {
      const r = runCli({ argv: [flag], projectRoot: root });
      assert.strictEqual(r.exit, 2, `${flag} must exit 2`);
      assert.strictEqual(r.report.failures[0].code, 'unsupported-argument', `${flag} → unsupported-argument`);
    }
    // 即使 repo eligible，危險參數仍優先拒絕（不執行 gate）
    assert.strictEqual(runCli({ argv: ['--apply'], projectRoot: root }).report.eligible, false);
  });

  await check('(reject) unknown arg → exit 2 unsupported-argument', () => {
    const r = runCli({ argv: ['--nonsense'], projectRoot: REPO_ROOT });
    assert.strictEqual(r.exit, 2);
    assert.strictEqual(r.report.failures[0].code, 'unsupported-argument');
  });

  console.log('');
  console.log(`admin-git-safety-preflight contract guard: ${pass} / ${fail}`);
  if (fail > 0) {
    console.log('');
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(`[check-admin-git-safety-preflight] crashed: ${err && err.stack ? err.stack : err}`);
    process.exitCode = 2;
  })
  .finally(async () => {
    for (const d of tempDirs) {
      try { await fs.rm(d, { recursive: true, force: true }); } catch (_) { /* ignore */ }
    }
    console.log(`  cleanup: ${tempDirs.length} temp dirs removed`);
  });
