#!/usr/bin/env node
// Phase K1-smoke：GitHub Pages prepublish readiness guard failure-branch smoke。
//
// 範圍 / 邊界：
//   - 使用 OS temp dir + 本地 git init 建 temp source repo + temp deploy repo；
//     用 `git update-ref refs/remotes/origin/...` 手動綁 remote-tracking ref，
//     **不** 執行 `git fetch` / `git pull` / `git remote add ... origin_url` 等網路操作。
//   - 透過 env `PB_PREPUBLISH_SOURCE_ROOT` / `PB_PREPUBLISH_DEPLOY_CLONE` 覆寫 guard
//     的檢查目標；**不** 動 real source repo / real deploy clone。
//   - Guard 本身仍為 read-only；smoke 對 fixture 有寫入，但 fixture 位於 OS temp dir。
//   - **不** build / deploy / publish / dev server / fetch / pull real repo；
//     **不** 呼叫 Blogger / Google / GA4 / AdSense / Search Console API。
//
// 目的：
//   鎖住 guard 的 exit-code 契約與 PASS/FAIL output contract，避免未來 refactor 破壞失敗分支。
//
// Smoke cases：
//   1. happy-path                 → exit 0
//   2. missing-deploy-clone       → exit 1
//   3. deploy-wrong-branch        → exit 1（deploy repo 在錯 branch）
//   4. source-dirty               → exit 1（source repo 有 uncommitted change）
//   5. missing-required-docs      → exit 1（source repo 缺 C1 checklist 或 snapshot doc）
//   6. source-ahead-of-remote     → exit 1（local commit 未同步至 origin/main）
//   7. source-index-lock-present  → exit 1（source .git/index.lock 存在）
//   8. deploy-index-lock-present  → exit 1（deploy .git/index.lock 存在）

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const GUARD_SCRIPT = path.join(REPO_ROOT, 'src', 'scripts', 'check-github-pages-prepublish-readiness.js');

const REQUIRED_DOCS = [
  'docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md',
  'docs/20260702-session-start-dual-repo-baseline-snapshot.md',
];

const cases = [];

function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  const suffix = detail ? `  — ${detail}` : '';
  console.log(`[${tag}] ${name}${suffix}`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd,
    env: opts.env || process.env,
    encoding: 'utf-8',
    shell: false,
  });
  return {
    ok: r.status === 0,
    code: r.status,
    stdout: (r.stdout || '').toString(),
    stderr: (r.stderr || '').toString(),
    error: r.error ? String(r.error.message || r.error) : null,
  };
}

function git(cwd, args) {
  return run('git', args, { cwd });
}

// Build a minimal git repo at `root` on `branch`, with:
//   - initial commit "seed.txt"
//   - refs/remotes/origin/<branch> pointed at HEAD (manually, no fetch)
//   - user.name / user.email set locally so commit works in CI-less env
function buildRepo(root, branch) {
  mkdirSync(root, { recursive: true });
  const init = git(root, ['init', '-q', '-b', branch]);
  if (!init.ok) throw new Error(`git init failed: ${init.stderr || init.error}`);
  git(root, ['config', 'user.email', 'smoke@example.invalid']);
  git(root, ['config', 'user.name', 'smoke']);
  git(root, ['config', 'commit.gpgsign', 'false']);
  writeFileSync(path.join(root, 'seed.txt'), 'seed\n', 'utf-8');
  const add = git(root, ['add', 'seed.txt']);
  if (!add.ok) throw new Error(`git add failed: ${add.stderr}`);
  const commit = git(root, ['commit', '-q', '-m', 'seed']);
  if (!commit.ok) throw new Error(`git commit failed: ${commit.stderr}`);
  const head = git(root, ['rev-parse', 'HEAD']);
  if (!head.ok) throw new Error(`rev-parse HEAD failed: ${head.stderr}`);
  const ref = `refs/remotes/origin/${branch}`;
  const upd = git(root, ['update-ref', ref, head.stdout.trim()]);
  if (!upd.ok) throw new Error(`update-ref ${ref} failed: ${upd.stderr}`);
  return head.stdout.trim();
}

function writeRequiredDocs(sourceRoot) {
  for (const rel of REQUIRED_DOCS) {
    const abs = path.join(sourceRoot, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, `# fixture doc: ${rel}\n`, 'utf-8');
  }
}

// Run guard against fixture paths and return exit code + stdout+stderr snippet
function runGuard(sourceRoot, deployClone) {
  const env = { ...process.env };
  env.PB_PREPUBLISH_SOURCE_ROOT = sourceRoot;
  if (deployClone === null) {
    // explicit "missing" — point at a non-existent path
    env.PB_PREPUBLISH_DEPLOY_CLONE = path.join(sourceRoot, '__missing_deploy_clone__');
  } else {
    env.PB_PREPUBLISH_DEPLOY_CLONE = deployClone;
  }
  return run(process.execPath, [GUARD_SCRIPT], { env });
}

function assertExit(name, result, expectedExit, extraCheck) {
  const gotExit = result.code;
  const exitOk = gotExit === expectedExit;
  let extraOk = true;
  let extraDetail = '';
  if (extraCheck) {
    const out = (result.stdout || '') + '\n' + (result.stderr || '');
    const { ok, detail } = extraCheck(out);
    extraOk = ok;
    extraDetail = detail;
  }
  const ok = exitOk && extraOk;
  const detail = ok
    ? `exit=${gotExit}${extraDetail ? ` ${extraDetail}` : ''}`
    : `exit=${gotExit} expected=${expectedExit}${extraDetail ? ` ${extraDetail}` : ''}`;
  record(name, ok, detail);
}

function containsLine(out, substr) {
  return out.split(/\r?\n/).some((l) => l.includes(substr));
}

// ── main ─────────────────────────────────────────────────────────────────────
const smokeRoot = mkdtempSync(path.join(os.tmpdir(), 'pb-prepub-smoke-'));

try {
  // Case 1: happy path — source clean on main + deploy clean on gh-pages + docs present
  {
    const sourceRoot = path.join(smokeRoot, 'c1-source');
    const deployClone = path.join(smokeRoot, 'c1-deploy');
    buildRepo(sourceRoot, 'main');
    writeRequiredDocs(sourceRoot);
    buildRepo(deployClone, 'gh-pages');
    // After writing docs, source is dirty (untracked). Commit them so it's clean.
    git(sourceRoot, ['add', '-A']);
    git(sourceRoot, ['commit', '-q', '-m', 'docs']);
    // Re-sync origin/main to new HEAD so ahead/behind == 0/0
    const h = git(sourceRoot, ['rev-parse', 'HEAD']);
    git(sourceRoot, ['update-ref', 'refs/remotes/origin/main', h.stdout.trim()]);
    const r = runGuard(sourceRoot, deployClone);
    assertExit('happy-path', r, 0, (out) => ({
      ok: containsLine(out, 'total=16  pass=16  fail=0'),
      detail: containsLine(out, 'total=16  pass=16  fail=0') ? 'summary=16/16' : 'missing 16/16 summary',
    }));
  }

  // Case 2: missing deploy clone
  {
    const sourceRoot = path.join(smokeRoot, 'c2-source');
    buildRepo(sourceRoot, 'main');
    writeRequiredDocs(sourceRoot);
    git(sourceRoot, ['add', '-A']);
    git(sourceRoot, ['commit', '-q', '-m', 'docs']);
    const h = git(sourceRoot, ['rev-parse', 'HEAD']);
    git(sourceRoot, ['update-ref', 'refs/remotes/origin/main', h.stdout.trim()]);
    // Point deploy at a non-existent dir
    const r = runGuard(sourceRoot, null);
    assertExit('missing-deploy-clone', r, 1, (out) => ({
      ok: containsLine(out, '[FAIL] deploy: dir exists'),
      detail: containsLine(out, '[FAIL] deploy: dir exists') ? 'flagged deploy dir missing' : 'no [FAIL] deploy: dir exists line',
    }));
  }

  // Case 3: deploy wrong branch (main instead of gh-pages)
  {
    const sourceRoot = path.join(smokeRoot, 'c3-source');
    const deployClone = path.join(smokeRoot, 'c3-deploy');
    buildRepo(sourceRoot, 'main');
    writeRequiredDocs(sourceRoot);
    git(sourceRoot, ['add', '-A']);
    git(sourceRoot, ['commit', '-q', '-m', 'docs']);
    const h = git(sourceRoot, ['rev-parse', 'HEAD']);
    git(sourceRoot, ['update-ref', 'refs/remotes/origin/main', h.stdout.trim()]);
    // Deploy on wrong branch: build on "main" then also update refs/remotes/origin/gh-pages
    // so the branch check fails but HEAD == origin/gh-pages could still be false.
    buildRepo(deployClone, 'main');
    const dh = git(deployClone, ['rev-parse', 'HEAD']);
    git(deployClone, ['update-ref', 'refs/remotes/origin/gh-pages', dh.stdout.trim()]);
    const r = runGuard(sourceRoot, deployClone);
    assertExit('deploy-wrong-branch', r, 1, (out) => ({
      ok: containsLine(out, '[FAIL] deploy: branch == gh-pages'),
      detail: containsLine(out, '[FAIL] deploy: branch == gh-pages') ? 'flagged wrong branch' : 'no [FAIL] deploy: branch line',
    }));
  }

  // Case 4: source repo dirty
  {
    const sourceRoot = path.join(smokeRoot, 'c4-source');
    const deployClone = path.join(smokeRoot, 'c4-deploy');
    buildRepo(sourceRoot, 'main');
    writeRequiredDocs(sourceRoot);
    git(sourceRoot, ['add', '-A']);
    git(sourceRoot, ['commit', '-q', '-m', 'docs']);
    const h = git(sourceRoot, ['rev-parse', 'HEAD']);
    git(sourceRoot, ['update-ref', 'refs/remotes/origin/main', h.stdout.trim()]);
    buildRepo(deployClone, 'gh-pages');
    // Introduce a dirty file
    writeFileSync(path.join(sourceRoot, 'dirty.txt'), 'uncommitted\n', 'utf-8');
    const r = runGuard(sourceRoot, deployClone);
    assertExit('source-dirty', r, 1, (out) => ({
      ok: containsLine(out, '[FAIL] source: working tree clean'),
      detail: containsLine(out, '[FAIL] source: working tree clean') ? 'flagged dirty' : 'no [FAIL] source: working tree clean line',
    }));
  }

  // Case 5: missing required docs (create source but omit the two required docs)
  {
    const sourceRoot = path.join(smokeRoot, 'c5-source');
    const deployClone = path.join(smokeRoot, 'c5-deploy');
    buildRepo(sourceRoot, 'main');
    // Intentionally do NOT write required docs
    buildRepo(deployClone, 'gh-pages');
    const r = runGuard(sourceRoot, deployClone);
    assertExit('missing-required-docs', r, 1, (out) => ({
      ok: containsLine(out, '[FAIL] source: required doc present'),
      detail: containsLine(out, '[FAIL] source: required doc present') ? 'flagged missing docs' : 'no [FAIL] source: required doc present line',
    }));
  }

  // Case 6: source ahead of origin/main
  //   Build baseline source repo + pin origin/main to first commit, then add a
  //   second commit locally so ahead/behind == 1/0. Docs are committed in the
  //   *first* commit so origin/main already knows about them; HEAD advances
  //   past origin/main.
  {
    const sourceRoot = path.join(smokeRoot, 'c6-source');
    const deployClone = path.join(smokeRoot, 'c6-deploy');
    buildRepo(sourceRoot, 'main');
    writeRequiredDocs(sourceRoot);
    git(sourceRoot, ['add', '-A']);
    git(sourceRoot, ['commit', '-q', '-m', 'docs']);
    // Pin origin/main here so the following extra commit becomes ahead=1
    const baseHead = git(sourceRoot, ['rev-parse', 'HEAD']);
    git(sourceRoot, ['update-ref', 'refs/remotes/origin/main', baseHead.stdout.trim()]);
    // Extra local commit → ahead of origin/main
    writeFileSync(path.join(sourceRoot, 'extra.txt'), 'ahead\n', 'utf-8');
    git(sourceRoot, ['add', 'extra.txt']);
    git(sourceRoot, ['commit', '-q', '-m', 'extra local commit']);
    buildRepo(deployClone, 'gh-pages');
    const r = runGuard(sourceRoot, deployClone);
    assertExit('source-ahead-of-remote', r, 1, (out) => ({
      ok:
        containsLine(out, '[FAIL] source: HEAD == origin/main') ||
        containsLine(out, '[FAIL] source: ahead/behind == 0/0'),
      detail:
        containsLine(out, '[FAIL] source: ahead/behind == 0/0')
          ? 'flagged ahead/behind'
          : containsLine(out, '[FAIL] source: HEAD == origin/main')
            ? 'flagged HEAD divergence'
            : 'no [FAIL] source: ahead/behind or HEAD line',
    }));
  }

  // Case 7: source .git/index.lock present
  {
    const sourceRoot = path.join(smokeRoot, 'c7-source');
    const deployClone = path.join(smokeRoot, 'c7-deploy');
    buildRepo(sourceRoot, 'main');
    writeRequiredDocs(sourceRoot);
    git(sourceRoot, ['add', '-A']);
    git(sourceRoot, ['commit', '-q', '-m', 'docs']);
    const h = git(sourceRoot, ['rev-parse', 'HEAD']);
    git(sourceRoot, ['update-ref', 'refs/remotes/origin/main', h.stdout.trim()]);
    buildRepo(deployClone, 'gh-pages');
    // Plant an index.lock in source
    writeFileSync(path.join(sourceRoot, '.git', 'index.lock'), '', 'utf-8');
    const r = runGuard(sourceRoot, deployClone);
    assertExit('source-index-lock-present', r, 1, (out) => ({
      ok: containsLine(out, '[FAIL] source: .git/index.lock absent'),
      detail: containsLine(out, '[FAIL] source: .git/index.lock absent')
        ? 'flagged source index.lock'
        : 'no [FAIL] source: .git/index.lock line',
    }));
  }

  // Case 8: deploy .git/index.lock present
  {
    const sourceRoot = path.join(smokeRoot, 'c8-source');
    const deployClone = path.join(smokeRoot, 'c8-deploy');
    buildRepo(sourceRoot, 'main');
    writeRequiredDocs(sourceRoot);
    git(sourceRoot, ['add', '-A']);
    git(sourceRoot, ['commit', '-q', '-m', 'docs']);
    const h = git(sourceRoot, ['rev-parse', 'HEAD']);
    git(sourceRoot, ['update-ref', 'refs/remotes/origin/main', h.stdout.trim()]);
    buildRepo(deployClone, 'gh-pages');
    // Plant an index.lock in deploy
    writeFileSync(path.join(deployClone, '.git', 'index.lock'), '', 'utf-8');
    const r = runGuard(sourceRoot, deployClone);
    assertExit('deploy-index-lock-present', r, 1, (out) => ({
      ok: containsLine(out, '[FAIL] deploy: .git/index.lock absent'),
      detail: containsLine(out, '[FAIL] deploy: .git/index.lock absent')
        ? 'flagged deploy index.lock'
        : 'no [FAIL] deploy: .git/index.lock line',
    }));
  }
} finally {
  // Cleanup (best-effort; warn only, do not affect result)
  try {
    rmSync(smokeRoot, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[warn] cleanup temp dir failed: ${smokeRoot} — ${err && err.message ? err.message : err}`);
  }
}

const passCount = cases.filter((c) => c.ok).length;
const failCount = cases.length - passCount;

console.log('');
console.log(`GitHub Pages prepublish readiness smoke: ${passCount}/${cases.length} PASS`);

if (failCount > 0) {
  console.log('Failed cases:');
  for (const c of cases) if (!c.ok) console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  process.exit(1);
}
process.exit(0);
