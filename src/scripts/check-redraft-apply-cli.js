#!/usr/bin/env node
// Phase 20260714-C.1b：explicit-confirmation local apply CLI（redraft-apply-cli.js）contract guard。
//
// 範圍 / 邊界（fixture-only；違反即設計錯誤）：
//   - 所有實際 apply（filesystem write）只發生於 **OS temp 目錄** 之 isolated 臨時 git repository
//     （各自 git init、可建 commits / refs，per §八 明允）；**絕不**碰 production content / dist /
//     settings / gh-pages / deploy clone；所有 temp 目錄於 finally{} 清除（無 residue）。
//   - production repository 只做 **read-only**：靜態掃描 CLI / 既有 write 路徑 / package.json；
//     並以「未授權路徑」（無 --apply）對 production repo smoke，斷言前後 HEAD / working tree /
//     index.lock 不變。**絕不**對 production 執行任何 authorized apply。
//   - 本 guard **不** build / deploy / commit / push production；**不**改任何 production frontmatter；
//     **不**呼叫 Blogger / Google / GA4 / AdSense API。
//
// 覆蓋（本 session §10 契約 1–32 + §9 forbidden flags + §11 npm script + static 紅線）：
//   無 --apply / 無 env gate / env 值錯（含 1 / true）/ 無 confirm / confirm 錯 / 無 expected SHA /
//   SHA 格式錯 / SHA mismatch(stale) → 全 hard-fail 且零寫入；合法 redraft/republish apply 成功；
//   wrong-branch / ahead / behind / dirty / index.lock(不變) / duplicate slug / lifecycle mismatch →
//   零寫入；validation failure → engine rollback（bytes/mode 恢復）；成功後只有目標 Markdown 改變、
//   sidecar / 其他 Markdown 不變、不 commit / push / build / deploy；CLI 不 import admin-write-cli；
//   既有 whitelist 不含 status/draft；Phase A/B 仍拒 --apply；production read-only smoke 前後不變；
//   package script 預設執行不造成 write。
//
// 執行：`npm run check:redraft-apply-cli`（或 `node src/scripts/check-redraft-apply-cli.js`）。

import assert from 'node:assert';
import fs from 'node:fs/promises';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runApply,
  runCli,
  formatResult,
  makePostWriteValidator,
  FORBIDDEN_FLAGS,
  ENV_GATE_NAME,
  ENV_GATE_VALUE,
  CONFIRM_PHRASE,
} from './redraft-apply-cli.js';
import { planRedraft, runCli as redraftPlanRunCli } from './redraft-plan.js';
import { runCli as lookupRunCli } from './admin-article-lookup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const SECRET_MARKER = 'TOPSECRET-DO-NOT-LEAK-xyz789';
const GOOD_ENV = { [ENV_GATE_NAME]: ENV_GATE_VALUE };

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

function sha256(str) {
  return createHash('sha256').update(Buffer.from(str, 'utf-8')).digest('hex');
}

// ── temp-repo git helpers（僅作用於 OS temp fixture；production 永不觸及）─────────────────
const tempDirs = [];
async function mkTemp(label) {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), `redraft-cli-${label}-`));
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
  git(['config', 'core.autocrlf', 'false'], dir);
  git(['config', 'core.safecrlf', 'false'], dir);
  writeFileSync(path.join(dir, '.gitattributes'), '* -text\n', 'utf-8');
}
function headOf(dir) { return git(['rev-parse', 'HEAD'], dir).stdout; }
function setOriginMain(dir, sha) { git(['update-ref', 'refs/remotes/origin/main', sha], dir); }
function porcelain(dir) { return git(['status', '--porcelain'], dir).stdout; }

function buildPost({ status, draft, statusStyle = 'double', slug = 'fixture-post', site = 'github', body = `hello body ${SECRET_MARKER} para.`, eol = '\n' }) {
  const statusLine =
    statusStyle === 'double' ? `status: "${status}"`
      : statusStyle === 'single' ? `status: '${status}'`
        : `status: ${status}`;
  return [
    '---',
    'id: "20260714-fixture"',
    `site: "${site}"`,
    `slug: "${slug}"`,
    'title: "Fixture Title"',
    'tags: ["x", "y", "z"]',
    'description: "seo desc unchanged"',
    'publishTargets:',
    '  github:',
    '    enabled: true',
    '    mode: "full"',
    statusLine,
    `draft: ${draft}`,
    '# trailing comment kept',
    '---',
    '',
    body,
    '',
  ].join(eol);
}

// clean、eligible（main / 0-0 / clean / no lock）之 temp repo，內含一篇 post（+ 可選 sidecar / other）。
async function makeRepo({ label, status, draft, statusStyle, slug = 'fixture-post', site = 'github', eol = '\n', withSidecar = false, withOther = false }) {
  const dir = await mkTemp(label);
  initRepo(dir);
  const postsRel = `content/${site}/posts`;
  const postsAbs = path.join(dir, ...postsRel.split('/'));
  await fs.mkdir(postsAbs, { recursive: true });
  const postAbs = path.join(postsAbs, `${slug}.md`);
  writeFileSync(postAbs, buildPost({ status, draft, statusStyle, slug, site, eol }), 'utf-8');

  let sidecarAbs = null;
  if (withSidecar) {
    sidecarAbs = path.join(postsAbs, `${slug}.publish.json`);
    writeFileSync(sidecarAbs, JSON.stringify({ blogger: { status: 'draft' }, note: SECRET_MARKER }, null, 2) + '\n', 'utf-8');
  }
  let otherAbs = null;
  if (withOther) {
    otherAbs = path.join(postsAbs, 'other-post.md');
    writeFileSync(otherAbs, buildPost({ status: 'ready', draft: false, slug: 'other-post', site }), 'utf-8');
  }

  git(['add', '-A'], dir);
  git(['commit', '-m', 'seed'], dir);
  const head = headOf(dir);
  setOriginMain(dir, head);
  return { dir, root: dir, postRel: `${postsRel}/${slug}.md`, postAbs, sidecarAbs, otherAbs };
}

async function makePlan({ root, slug = 'fixture-post', op }) {
  const r = await planRedraft({ slug, op, projectRoot: root });
  assert.ok(r.ok, `plan generation failed: ${r.error} ${r.reason || ''}`);
  return r.plan;
}
function modeOf(p) { return statSync(p).mode & 0o777; }

// 完整授權 argv builder（可逐項殘缺以觸發各 hard-fail）。
function argvFor({ apply = true, slug = 'fixture-post', op = 'redraft', sha, confirm = CONFIRM_PHRASE, site, extra = [] } = {}) {
  const a = [];
  if (apply) a.push('--apply');
  if (slug !== null && slug !== undefined) a.push(`--slug=${slug}`);
  if (op !== null && op !== undefined) a.push(`--op=${op}`);
  if (sha !== null && sha !== undefined) a.push(`--expected-source-sha=${sha}`);
  if (confirm !== null && confirm !== undefined) a.push(`--confirm=${confirm}`);
  if (site) a.push(`--site=${site}`);
  return [...a, ...extra];
}

async function main() {
  // ════════ 1：無 --apply → 預設拒絕、零寫入 ════════
  await check('(1) no --apply → refuse (missing-apply-flag) + zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'noapply', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = await makePlan({ root, op: 'redraft' });
    const r = await runApply({ argv: argvFor({ apply: false, sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'missing-apply-flag');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
    // human output points to planner
    assert.ok(formatResult(r).includes('admin:plan-redraft'), 'refusal should point to Phase B planner');
  });

  // ════════ 2–3：env gate（缺失 / 值錯 / 1 / true）→ hard-fail、零寫入 ════════
  await check('(2) missing env gate → hard-fail + zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'noenv', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = await makePlan({ root, op: 'redraft' });
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: {} });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'env-gate-missing');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  await check('(3) env gate wrong value (incl. 1 / true / partial) → hard-fail + zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'wrongenv', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = await makePlan({ root, op: 'redraft' });
    for (const val of ['1', 'true', 'yes', ENV_GATE_VALUE.slice(0, -1), `${ENV_GATE_VALUE}x`, ' ' + ENV_GATE_VALUE]) {
      const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: { [ENV_GATE_NAME]: val } });
      assert.strictEqual(r.ok, false, `env "${val}" must be rejected`);
      assert.strictEqual(r.error, 'env-gate-mismatch', `env "${val}" → env-gate-mismatch`);
    }
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  // ════════ 4–5：confirmation（缺失 / 錯誤 / --yes / -y）→ hard-fail、零寫入 ════════
  await check('(4) missing confirmation → hard-fail + zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'noconfirm', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = await makePlan({ root, op: 'redraft' });
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256, confirm: null }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'confirm-missing');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  await check('(5) wrong confirmation (incl. --yes/-y style) → hard-fail + zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'wrongconfirm', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = await makePlan({ root, op: 'redraft' });
    for (const c of ['yes', 'y', 'YES', CONFIRM_PHRASE.toLowerCase(), CONFIRM_PHRASE.slice(0, -1), `${CONFIRM_PHRASE}x`]) {
      const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256, confirm: c }), projectRoot: root, env: GOOD_ENV });
      assert.strictEqual(r.ok, false, `confirm "${c}" must be rejected`);
      assert.strictEqual(r.error, 'confirm-mismatch', `confirm "${c}" → confirm-mismatch`);
    }
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  // ════════ 6–7：expected SHA（缺失 / 格式錯）→ hard-fail、零寫入 ════════
  await check('(6) missing expected SHA → hard-fail + zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'nosha', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const r = await runApply({ argv: argvFor({ sha: null }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'expected-sha-missing');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  await check('(7) malformed expected SHA → hard-fail + zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'badsha', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    for (const s of ['0'.repeat(63), '0'.repeat(65), 'g'.repeat(64), 'A'.repeat(64), 'xyz', 'DEADBEEF'.repeat(8)]) {
      const r = await runApply({ argv: argvFor({ sha: s }), projectRoot: root, env: GOOD_ENV });
      assert.strictEqual(r.ok, false, `sha "${s}" rejected`);
      assert.strictEqual(r.error, 'expected-sha-format-invalid', `sha "${s}" → format-invalid`);
    }
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  // ════════ 8：SHA mismatch（合法格式但非當前檔）→ stale-source、零寫入 ════════
  await check('(8) SHA mismatch → stale-source hard-fail + zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'stale', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const r = await runApply({ argv: argvFor({ sha: 'a'.repeat(64) }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'stale-source');
    assert.strictEqual(r.stage, 'expected-sha');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged (no adopt-new-sha)');
  });

  // ════════ 9：合法 redraft apply 成功 ════════
  await check('(9) legal redraft apply → success (status/draft flipped, target SHA)', async () => {
    const { root, postAbs } = await makeRepo({ label: 'redraft-ok', status: 'ready', draft: false });
    const plan = await makePlan({ root, op: 'redraft' });
    const r = await runApply({ argv: argvFor({ op: 'redraft', sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    assert.strictEqual(r.applied, true);
    assert.strictEqual(r.validated, true);
    const after = readFileSync(postAbs, 'utf-8');
    assert.ok(after.includes('status: "draft"') && after.includes('draft: true'), 'flipped to draft/true');
    assert.strictEqual(sha256(after), plan.targetSha256, 'file SHA == plan.targetSha256');
    // success report flags
    assert.strictEqual(r.commitPerformed, false);
    assert.strictEqual(r.pushPerformed, false);
    assert.strictEqual(r.buildPerformed, false);
    assert.strictEqual(r.deployPerformed, false);
  });

  // ════════ 10：合法 republish apply 成功 ════════
  await check('(10) legal republish apply → success', async () => {
    const { root, postAbs } = await makeRepo({ label: 'republish-ok', status: 'draft', draft: true });
    const plan = await makePlan({ root, op: 'republish' });
    const r = await runApply({ argv: argvFor({ op: 'republish', sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    const after = readFileSync(postAbs, 'utf-8');
    assert.ok(after.includes('status: "ready"') && after.includes('draft: false'), 'flipped to ready/false');
  });

  // ════════ 11–15：repository safety preflight（engine 重跑）→ 零寫入 ════════
  async function planThenBreak(label, breakFn, { status = 'ready', draft = false } = {}) {
    const { root, postAbs } = await makeRepo({ label, status, draft });
    const plan = await makePlan({ root, op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    await breakFn(root);
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    return { r, root, postAbs, before, after: readFileSync(postAbs, 'utf-8') };
  }

  await check('(11) wrong branch → zero write', async () => {
    const { r, before, after } = await planThenBreak('wrongbranch', (root) => git(['checkout', '-b', 'feature'], root));
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'engine-repository-not-eligible');
    assert.strictEqual(r.engine.preflight.branch, 'feature');
    assert.strictEqual(after, before, 'file unchanged');
  });

  await check('(12) ahead of origin → zero write', async () => {
    const { r, before, after } = await planThenBreak('ahead', (root) => {
      writeFileSync(path.join(root, 'unrelated.txt'), 'x\n', 'utf-8');
      git(['add', '-A'], root); git(['commit', '-m', 'ahead'], root);
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'engine-repository-not-eligible');
    assert.strictEqual(r.engine.preflight.ahead, 1);
    assert.strictEqual(after, before, 'file unchanged');
  });

  await check('(13) behind origin → zero write', async () => {
    const { r, before, after } = await planThenBreak('behind', (root) => {
      const c1 = headOf(root);
      const tree = git(['rev-parse', `${c1}^{tree}`], root).stdout;
      const res = spawnSync('git', ['commit-tree', tree, '-p', c1, '-m', 'origin-ahead'], {
        cwd: root, encoding: 'utf-8', shell: false, windowsHide: true,
        env: { ...process.env, GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@e.com', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@e.com' },
      });
      setOriginMain(root, res.stdout.trim());
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'engine-repository-not-eligible');
    assert.strictEqual(r.engine.preflight.behind, 1);
    assert.strictEqual(after, before, 'file unchanged');
  });

  await check('(14) dirty working tree → zero write', async () => {
    const { r, before, after } = await planThenBreak('dirty', (root) => {
      writeFileSync(path.join(root, 'untracked.txt'), 'stuff\n', 'utf-8');
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'engine-repository-not-eligible');
    assert.strictEqual(r.engine.preflight.workingTreeClean, false);
    assert.strictEqual(after, before, 'file unchanged');
  });

  await check('(15) index.lock present → zero write; lock untouched', async () => {
    const { root, postAbs } = await makeRepo({ label: 'lock', status: 'ready', draft: false });
    const plan = await makePlan({ root, op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    const lockPath = path.join(root, '.git', 'index.lock');
    writeFileSync(lockPath, 'lock-marker', 'utf-8');
    const lockBefore = readFileSync(lockPath, 'utf-8');
    const lockMtime = statSync(lockPath).mtimeMs;
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'engine-repository-not-eligible');
    assert.strictEqual(r.engine.preflight.indexLockPresent, true);
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
    assert.ok(existsSync(lockPath), 'index.lock must NOT be deleted');
    assert.strictEqual(readFileSync(lockPath, 'utf-8'), lockBefore, 'lock content unchanged');
    assert.strictEqual(statSync(lockPath).mtimeMs, lockMtime, 'lock mtime unchanged');
  });

  // ════════ 16：duplicate slug → 零寫入 ════════
  await check('(16) duplicate slug within site → zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'dup', status: 'ready', draft: false });
    const plan = await makePlan({ root, op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    const dup = path.join(root, 'content', 'github', 'posts', 'fixture-post-2.md');
    writeFileSync(dup, buildPost({ status: 'ready', draft: false, slug: 'fixture-post' }), 'utf-8');
    git(['add', '-A'], root); git(['commit', '-m', 'dup'], root); setOriginMain(root, headOf(root));
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, false);
    assert.ok(r.error === 'resolve-not-unique' || r.error === 'engine-re-resolve-failed', `got ${r.error}`);
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  // ════════ 17：lifecycle precondition 不符 → 零寫入 ════════
  await check('(17) lifecycle precondition mismatch (op wrong for state) → zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'lifemis', status: 'ready', draft: false });
    // 檔為 ready/false → republish 前置為 draft/true → precondition-not-met（在 planner 階段）。
    // 先用 redraft 取得合法 source SHA，再用 republish argv（同 SHA）觸發 precondition。
    const plan = await makePlan({ root, op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    const r = await runApply({ argv: argvFor({ op: 'republish', sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'plan-precondition-not-met');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  // ════════ 18–19：validation failure → engine rollback（bytes / mode 恢復）════════
  await check('(18,19) post-write validation failure → engine rollback restores bytes & mode', async () => {
    // 讓 validation 失敗：對 fixture 檔的 body 做外部竄改是不行的（會破 SHA gate）；
    // 改以 CLI runApply 正常成功路徑無法注入失敗，故直接以 engine + CLI validator 對「已被
    // 篡改成不一致 target」的情境覆蓋——這裡以 runApply 成功後再獨立驗證 validator 對壞檔回 false，
    // 並確保 rollback 契約由 engine guard（26,27,28）鎖住。此處聚焦「CLI validator 會拒壞檔」。
    const { root, postAbs } = await makeRepo({ label: 'valfail', status: 'ready', draft: false });
    const plan = await makePlan({ root, op: 'redraft' });
    const modeBefore = modeOf(postAbs);
    const before = readFileSync(postAbs, 'utf-8');

    // 直接呼叫 engine，傳入「永遠回 false」的 validator（模擬 post-write validation 失敗）。
    const { applyLifecycleAtomic } = await import('./redraft-apply-engine.js');
    const r = await applyLifecycleAtomic({
      projectRoot: root, plan,
      validateAfterWrite: async () => ({ ok: false, reason: 'forced-fail' }),
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'post-write-validation-failed');
    assert.strictEqual(r.rolledBack, true);
    assert.strictEqual(r.rollbackOk, true);
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'bytes restored by rollback');
    assert.strictEqual(sha256(readFileSync(postAbs, 'utf-8')), plan.sourceSha256, 'source SHA restored');
    assert.strictEqual(modeOf(postAbs), modeBefore, 'mode restored');
  });

  await check('(18b) CLI post-write validator rejects a tampered file (non-whitelist bytes changed)', async () => {
    const plan = {
      op: 'redraft',
      slug: 'fixture-post',
      target: { status: 'draft', draft: true },
      sourceSha256: sha256('SRC'),
      targetSha256: 'placeholder',
      changes: [
        { field: 'status', lineNumber: 2, oldLine: 'status: "ready"', newLine: 'status: "draft"' },
        { field: 'draft', lineNumber: 3, oldLine: 'draft: false', newLine: 'draft: true' },
      ],
    };
    // 造一份「正確 target 內容」→ validator 應通過（除了 targetSha256 需對）。
    const good = ['---', 'status: "draft"', 'draft: true', 'slug: "fixture-post"', '---', '', 'body', ''].join('\n');
    // 對應 source（反代）：
    const src = ['---', 'status: "ready"', 'draft: false', 'slug: "fixture-post"', '---', '', 'body', ''].join('\n');
    plan.sourceSha256 = sha256(src);
    plan.targetSha256 = sha256(good);

    // 用 temp 檔驗證 validator。
    const dir = await mkTemp('validator');
    const rel = 'content/github/posts/fixture-post.md';
    await fs.mkdir(path.join(dir, 'content', 'github', 'posts'), { recursive: true });
    const abs = path.join(dir, ...rel.split('/'));
    const validator = makePostWriteValidator();

    // (a) 正確 target → ok:true
    writeFileSync(abs, good, 'utf-8');
    const okRes = await validator({ projectRoot: dir, sourcePath: rel, plan });
    assert.strictEqual(okRes.ok, true, JSON.stringify(okRes));

    // (b) body 被竄改（非白名單 bytes 改變）→ 反代後 SHA ≠ sourceSha256 → reject
    const tampered = good.replace('body', 'HACKED body');
    writeFileSync(abs, tampered, 'utf-8');
    const badRes = await validator({ projectRoot: dir, sourcePath: rel, plan });
    assert.strictEqual(badRes.ok, false);
    // targetSha 先被 gate（因為 tampered 改了內容）→ target-sha-mismatch，屬合理拒絕。
    assert.ok(['target-sha-mismatch', 'non-whitelist-bytes-changed'].includes(badRes.reason), badRes.reason);
  });

  // ════════ 20–22：成功後只有目標 Markdown 改變 / sidecar / 其他 Markdown 不變 ════════
  await check('(20,22) success → only target Markdown changed; other Markdown unchanged', async () => {
    const { root, postAbs, otherAbs } = await makeRepo({ label: 'onlytarget', status: 'ready', draft: false, withOther: true });
    const otherBefore = readFileSync(otherAbs, 'utf-8');
    const plan = await makePlan({ root, op: 'redraft' });
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    assert.strictEqual(readFileSync(otherAbs, 'utf-8'), otherBefore, 'other post unchanged');
    // git status：只有目標 .md modified。
    const status = porcelain(root).split('\n').filter(Boolean);
    assert.strictEqual(status.length, 1, `exactly one changed file, got: ${JSON.stringify(status)}`);
    assert.ok(status[0].includes('content/github/posts/fixture-post.md'), status[0]);
    assert.ok(readFileSync(postAbs, 'utf-8').includes('status: "draft"'), 'target updated');
  });

  await check('(21) success → sidecar (.publish.json) bytes unchanged', async () => {
    const { root, sidecarAbs } = await makeRepo({ label: 'sidecar', status: 'ready', draft: false, withSidecar: true });
    const sidecarBefore = readFileSync(sidecarAbs, 'utf-8');
    const plan = await makePlan({ root, op: 'redraft' });
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(readFileSync(sidecarAbs, 'utf-8'), sidecarBefore, 'sidecar byte-unchanged');
  });

  // ════════ 23–26：成功後不 commit / push / build / deploy ════════
  await check('(23,24,25,26) success → no commit / push / build / deploy (HEAD unchanged, no dist)', async () => {
    const { root } = await makeRepo({ label: 'nogit', status: 'ready', draft: false });
    const headBefore = headOf(root);
    const plan = await makePlan({ root, op: 'redraft' });
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(headOf(root), headBefore, 'HEAD unchanged (no commit)');
    // origin/main unchanged (no push) — remote-tracking ref stays at seed.
    assert.strictEqual(git(['rev-parse', 'refs/remotes/origin/main'], root).stdout, headBefore, 'origin/main unchanged');
    // no dist / build artifact.
    assert.ok(!existsSync(path.join(root, 'dist')), 'no dist/ created');
    assert.ok(!existsSync(path.join(root, 'dist-blogger')), 'no dist-blogger/ created');
    // working tree dirty with exactly the target file (expected correct result).
    const status = porcelain(root).split('\n').filter(Boolean);
    assert.strictEqual(status.length, 1, 'exactly the target file is dirty');
  });

  // ════════ §9：forbidden / bypass flags（即使帶 --apply）→ 拒絕、零寫入 ════════
  await check('(§9) forbidden bypass flags rejected even with --apply; zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'forbidden', status: 'ready', draft: false });
    const plan = await makePlan({ root, op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    const expected = [
      '--commit', '--push', '--deploy', '--build', '--fetch', '--pull', '--reset',
      '--checkout', '--stash', '--clean', '--delete', '--permanent-delete', '--blogger',
      '--force', '--skip-validation', '--skip-preflight', '--ignore-sha',
    ];
    for (const f of expected) {
      assert.ok(FORBIDDEN_FLAGS.has(f), `FORBIDDEN_FLAGS must include ${f}`);
      const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256, extra: [f] }), projectRoot: root, env: GOOD_ENV });
      assert.strictEqual(r.ok, false, `${f} must be rejected`);
      assert.strictEqual(r.error, 'forbidden-flag', `${f} → forbidden-flag`);
      assert.strictEqual(r.flag, f);
    }
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  await check('(§9b) unknown argument rejected; zero write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'unknown', status: 'ready', draft: false });
    const plan = await makePlan({ root, op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256, extra: ['--bogus'] }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'unknown-arg');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  // ════════ 27：CLI 不 import 既有 admin-write-cli / write 路徑 ════════
  await check('(27) CLI source imports no existing real-write path / child_process', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'redraft-apply-cli.js'), 'utf-8');
    const importLines = src.split('\n').filter((l) => /^\s*import\b/.test(l));
    for (const bad of ['admin-write-cli', 'admin-write-whitelist', 'admin-frontmatter-patcher', 'safe-write', 'child_process']) {
      assert.ok(!importLines.some((l) => l.includes(bad)), `CLI must not import ${bad}`);
    }
    assert.ok(!/\bspawnSync\s*\(/.test(src) && !/\bexecSync\s*\(/.test(src), 'no spawn/exec in CLI');
    assert.ok(!/\bfetch\s*\(/.test(src), 'no network fetch in CLI');
    // executable code（非註解）不得含 commit/push/deploy/build 呼叫。
    const codeOnly = src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
    for (const tok of ['git commit', 'git push', 'gh-pages', 'build:github', 'build:blogger']) {
      assert.ok(!codeOnly.includes(tok), `CLI executable code must not reference "${tok}"`);
    }
    // CLI 只 import Phase A resolver / Phase B planner / Phase C.1a engine。
    assert.ok(importLines.some((l) => l.includes('admin-article-lookup.js')), 'imports Phase A');
    assert.ok(importLines.some((l) => l.includes('redraft-plan.js')), 'imports Phase B');
    assert.ok(importLines.some((l) => l.includes('redraft-apply-engine.js')), 'imports Phase C.1a engine');
  });

  // ════════ 28：既有 real-write whitelist 未含 status/draft ════════
  await check('(28) existing real-write whitelist unchanged — no status/draft', () => {
    const patcher = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-frontmatter-patcher.js'), 'utf-8');
    const mP = patcher.match(/const ALLOWED_TOP_LEVEL_KEYS = new Set\(\[([^\]]*)\]\)/);
    assert.ok(mP, 'ALLOWED_TOP_LEVEL_KEYS present');
    assert.ok(mP[1].includes("'description'") && mP[1].includes("'searchDescription'"));
    assert.ok(!/status/.test(mP[1]) && !/draft/.test(mP[1]), 'patcher whitelist must NOT include status/draft');
    const cli = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-write-cli.js'), 'utf-8');
    const mC = cli.match(/const ALLOWED_FIELDS = new Set\(\[([^\]]*)\]\)/);
    assert.ok(mC, 'ALLOWED_FIELDS present');
    assert.ok(!/status/.test(mC[1]) && !/draft/.test(mC[1]), 'cli ALLOWED_FIELDS must NOT include status/draft');
  });

  // ════════ 29–30：Phase A / Phase B CLI 仍拒 --apply ════════
  await check('(29,30) Phase A & Phase B CLIs still reject --apply', async () => {
    const a = await lookupRunCli({ argv: ['--slug=x', '--apply'], projectRoot: REPO_ROOT });
    assert.strictEqual(a.exit, 2, 'Phase A --apply must exit 2');
    assert.ok(['apply-not-supported', 'write-flag-not-supported'].includes(a.result.error));
    const b = await redraftPlanRunCli({ argv: ['--slug=x', '--op=redraft', '--apply'], projectRoot: REPO_ROOT });
    assert.strictEqual(b.exit, 2, 'Phase B --apply must exit 2');
    assert.strictEqual(b.result.error, 'write-flag-not-supported');
  });

  // ════════ 31：production repository read-only smoke（前後 HEAD / tree / lock 不變）════════
  await check('(31) production repo read-only smoke — HEAD / tree / index.lock unchanged', async () => {
    const headBefore = git(['rev-parse', 'HEAD'], REPO_ROOT).stdout;
    const treeBefore = git(['status', '--porcelain'], REPO_ROOT).stdout;
    const lockBefore = existsSync(path.join(REPO_ROOT, '.git', 'index.lock'));
    // 只走「未授權」路徑（無 --apply）→ 保證零寫入；不對 production 施加任何 authorized apply。
    const r1 = await runApply({ argv: ['--slug=nonexistent-xyz', '--op=redraft'], projectRoot: REPO_ROOT, env: {} });
    assert.strictEqual(r1.ok, false, 'no --apply against production must refuse');
    const r2 = await runApply({ argv: ['--slug=nonexistent-xyz', '--op=redraft'], projectRoot: REPO_ROOT, env: GOOD_ENV });
    assert.strictEqual(r2.ok, false, 'missing --apply still refuses even with env set');
    const headAfter = git(['rev-parse', 'HEAD'], REPO_ROOT).stdout;
    const treeAfter = git(['status', '--porcelain'], REPO_ROOT).stdout;
    const lockAfter = existsSync(path.join(REPO_ROOT, '.git', 'index.lock'));
    assert.strictEqual(headAfter, headBefore, 'production HEAD unchanged');
    assert.strictEqual(treeAfter, treeBefore, 'production working tree unchanged');
    assert.strictEqual(lockAfter, lockBefore, 'production index.lock state unchanged');
  });

  // ════════ 32：package.json 入口安全（預設執行不造成 write；無 --apply / apply-redraft / engine.js）════════
  await check('(32) package.json apply entry is safe (no --apply/apply-redraft/engine.js in value)', () => {
    const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
    const scripts = pkg.scripts || {};
    // guard script 必須存在且指向本 guard。
    assert.strictEqual(scripts['check:redraft-apply-cli'], 'node src/scripts/check-redraft-apply-cli.js',
      'check:redraft-apply-cli must point at the guard');
    // 若存在 apply 入口，其 value 不得內建授權（無 --apply / env 值 / confirm phrase / engine.js）。
    for (const [name, value] of Object.entries(scripts)) {
      if (!value.includes('redraft-apply-cli.js')) continue;
      assert.ok(!value.includes('--apply'), `${name} must not embed --apply`);
      assert.ok(!value.includes(ENV_GATE_VALUE), `${name} must not embed env gate value`);
      assert.ok(!value.includes(CONFIRM_PHRASE), `${name} must not embed confirmation phrase`);
      assert.ok(!/redraft-apply-engine\.js\b/.test(value), `${name} must not reference engine .js directly`);
      // 不被 readiness / build / deploy chain 自動呼叫（名稱不屬那些 umbrella）。
      assert.ok(!/readiness|release|phase1|build|deploy/i.test(name), `${name} must be a standalone Dean-gated entry`);
    }
  });

  // ════════ extra：no-leak（result 不含 body / secret marker）════════
  await check('(extra) apply result carries no article body / secret marker', async () => {
    const { root } = await makeRepo({ label: 'noleak', status: 'ready', draft: false });
    const plan = await makePlan({ root, op: 'redraft' });
    const r = await runApply({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.ok(!JSON.stringify(r).includes(SECRET_MARKER), 'result must not leak body/secret');
    assert.ok(!formatResult(r).includes(SECRET_MARKER), 'human output must not leak body/secret');
  });

  // ════════ extra：runCli adapter exit codes（success 0；各失敗非 0）════════
  await check('(extra) runCli adapter: success exit 0, refusals non-zero', async () => {
    const { root } = await makeRepo({ label: 'exit', status: 'ready', draft: false });
    const plan = await makePlan({ root, op: 'redraft' });
    const ok = await runCli({ argv: argvFor({ sha: plan.sourceSha256 }), projectRoot: root, env: GOOD_ENV });
    assert.strictEqual(ok.exit, 0, 'success exit 0');
    // 重新產生 repo（前一個已 apply）→ 測 refusal exit。
    const { root: root2 } = await makeRepo({ label: 'exit2', status: 'ready', draft: false });
    const noApply = await runCli({ argv: ['--slug=fixture-post', '--op=redraft'], projectRoot: root2, env: GOOD_ENV });
    assert.strictEqual(noApply.exit, 3, 'missing --apply exit 3');
    assert.strictEqual(noApply.result.ok, false);
  });

  console.log('');
  console.log(`redraft-apply-cli contract guard: ${pass} / ${fail}`);
  if (fail > 0) {
    console.log('');
    for (const f of fails) console.log(`  - ${f}`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(`[check-redraft-apply-cli] crashed: ${err && err.stack ? err.stack : err}`);
    process.exitCode = 2;
  })
  .finally(async () => {
    for (const d of tempDirs) {
      try { await fs.rm(d, { recursive: true, force: true }); } catch (_) { /* ignore */ }
    }
    console.log(`  cleanup: ${tempDirs.length} temp dirs removed`);
  });
