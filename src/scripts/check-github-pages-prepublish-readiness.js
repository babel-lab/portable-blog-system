#!/usr/bin/env node
// Phase K1：GitHub Pages prepublish readiness guard MVP。
//
// 範圍 / 邊界：
//   - **只讀（read-only）**：僅 spawn `git` 讀取狀態、`fs.existsSync` 檢查檔案存在。
//   - **不** 執行 fetch / pull / checkout / reset / merge / rebase。
//   - **不** 執行 build / deploy / publish / dev server / preview。
//   - **不** 寫任何檔（無 fs.writeFile / mkdir / rm / rename）。
//   - **不** 呼叫 Blogger / Google / GA4 / AdSense / Search Console API。
//   - **不** 動 deploy clone（../portable-blog-deploy），只讀其 git 狀態。
//
// 目的：
//   在未來實際 publish / deploy 前，先跑這支 guard，確認 source repo 與 deploy clone
//   都處於「安全可 publish」狀態；任一項不通過即 process.exit(1)，caller 應停下處理。
//
// 檢查範圍：
//   Source repo（cwd）
//     1. is git repo
//     2. branch == main
//     3. working tree clean（porcelain empty）
//     4. HEAD == origin/main
//     5. ahead/behind == 0/0
//     6. .git/index.lock absent
//     7. C1 checklist doc 存在
//     8. dual repo baseline snapshot doc 存在
//   Deploy clone（../portable-blog-deploy）
//     1. dir 存在且是 git repo
//     2. branch == gh-pages
//     3. working tree clean
//     4. HEAD == origin/gh-pages
//     5. ahead/behind == 0/0
//     6. .git/index.lock absent

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Test-only env overrides for fixture-based smoke（僅本專案 smoke 使用；
// 未設定時維持 real-repo 預設路徑，default behavior 不變）。
const ENV_SOURCE = process.env.PB_PREPUBLISH_SOURCE_ROOT;
const ENV_DEPLOY = process.env.PB_PREPUBLISH_DEPLOY_CLONE;
const SOURCE_ROOT = ENV_SOURCE && ENV_SOURCE.length > 0
  ? path.resolve(ENV_SOURCE)
  : path.resolve(__dirname, '..', '..');
const DEPLOY_CLONE = ENV_DEPLOY && ENV_DEPLOY.length > 0
  ? path.resolve(ENV_DEPLOY)
  : path.resolve(SOURCE_ROOT, '..', 'portable-blog-deploy');

const SOURCE_BRANCH_EXPECTED = 'main';
const SOURCE_REMOTE_REF = 'origin/main';
const DEPLOY_BRANCH_EXPECTED = 'gh-pages';
const DEPLOY_REMOTE_REF = 'origin/gh-pages';

const REQUIRED_SOURCE_DOCS = [
  'docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md',
  'docs/20260702-session-start-dual-repo-baseline-snapshot.md',
];

const results = [];

function record(label, ok, detail = '') {
  results.push({ label, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  const suffix = detail ? `  — ${detail}` : '';
  console.log(`[${tag}] ${label}${suffix}`);
}

function gitRead(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf-8', shell: false });
  if (r.error) {
    return { ok: false, code: null, stdout: '', stderr: String(r.error.message || r.error) };
  }
  return {
    ok: r.status === 0,
    code: r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
  };
}

function isGitRepo(cwd) {
  if (!existsSync(cwd)) return false;
  const r = gitRead(cwd, ['rev-parse', '--is-inside-work-tree']);
  return r.ok && r.stdout === 'true';
}

function checkRepo(kind, cwd, expectedBranch, remoteRef) {
  const label = (s) => `${kind}: ${s}`;

  if (!existsSync(cwd)) {
    record(label('dir exists'), false, cwd);
    return;
  }
  record(label('dir exists'), true, cwd);

  if (!isGitRepo(cwd)) {
    record(label('is git repo'), false, cwd);
    return;
  }
  record(label('is git repo'), true);

  const branchR = gitRead(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const branch = branchR.stdout;
  record(
    label(`branch == ${expectedBranch}`),
    branchR.ok && branch === expectedBranch,
    branchR.ok ? `actual=${branch}` : `git error: ${branchR.stderr}`,
  );

  const porcR = gitRead(cwd, ['status', '--porcelain']);
  const dirty = porcR.stdout.length > 0;
  record(
    label('working tree clean'),
    porcR.ok && !dirty,
    porcR.ok
      ? (dirty ? `dirty entries: ${porcR.stdout.split('\n').length}` : '')
      : `git error: ${porcR.stderr}`,
  );

  const headR = gitRead(cwd, ['rev-parse', 'HEAD']);
  const remR = gitRead(cwd, ['rev-parse', remoteRef]);
  const headEqRemote =
    headR.ok && remR.ok && headR.stdout && remR.stdout && headR.stdout === remR.stdout;
  record(
    label(`HEAD == ${remoteRef}`),
    headEqRemote,
    headEqRemote
      ? `sha=${headR.stdout.slice(0, 7)}`
      : `HEAD=${headR.stdout || 'n/a'} ${remoteRef}=${remR.stdout || 'n/a'}`,
  );

  const abR = gitRead(cwd, ['rev-list', '--left-right', '--count', `${remoteRef}...HEAD`]);
  let ahead = null;
  let behind = null;
  if (abR.ok) {
    const parts = abR.stdout.split(/\s+/);
    if (parts.length === 2) {
      behind = Number(parts[0]);
      ahead = Number(parts[1]);
    }
  }
  const abOk = abR.ok && ahead === 0 && behind === 0;
  record(
    label('ahead/behind == 0/0'),
    abOk,
    abR.ok ? `ahead=${ahead} behind=${behind}` : `git error: ${abR.stderr}`,
  );

  const lockPath = path.join(cwd, '.git', 'index.lock');
  const lockAbsent = !existsSync(lockPath);
  record(label('.git/index.lock absent'), lockAbsent, lockAbsent ? '' : lockPath);
}

function checkRequiredDocs(cwd, relPaths) {
  for (const rel of relPaths) {
    const abs = path.join(cwd, rel);
    const present = existsSync(abs);
    record(`source: required doc present`, present, rel);
  }
}

console.log('── Source repo checks ──────────────────────────────────────────────');
checkRepo('source', SOURCE_ROOT, SOURCE_BRANCH_EXPECTED, SOURCE_REMOTE_REF);
checkRequiredDocs(SOURCE_ROOT, REQUIRED_SOURCE_DOCS);

console.log('');
console.log('── Deploy clone checks (../portable-blog-deploy, read-only) ────────');
checkRepo('deploy', DEPLOY_CLONE, DEPLOY_BRANCH_EXPECTED, DEPLOY_REMOTE_REF);

const passCount = results.filter((r) => r.ok).length;
const failCount = results.length - passCount;

console.log('');
console.log('── Summary ─────────────────────────────────────────────────────────');
console.log(`total=${results.length}  pass=${passCount}  fail=${failCount}`);

if (failCount > 0) {
  console.log('');
  console.log('Failed checks:');
  for (const r of results) {
    if (!r.ok) console.log(`  - ${r.label}${r.detail ? `  (${r.detail})` : ''}`);
  }
  process.exit(1);
}

process.exit(0);
