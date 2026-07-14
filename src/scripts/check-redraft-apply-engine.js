#!/usr/bin/env node
// Phase 20260714-C.1a：dormant atomic lifecycle apply engine（redraft-apply-engine.js）contract guard。
//
// 範圍 / 邊界（fixture-only；違反即設計錯誤）：
//   - 所有實際 filesystem write 只發生於 **OS temp 目錄** 之 isolated 臨時 git repository（各自 git init、
//     可建 commits / refs，per §八 明允）；**絕不**碰 production content / dist / settings / gh-pages /
//     deploy clone；所有 temp 目錄於 finally{} 清除（無 residue）。
//   - production repository 只做 **read-only**：靜態掃描 engine / 既有 write 路徑 / package.json，
//     並回歸斷言 Phase A/B/C0 CLI 仍拒 `--apply`、既有 real-write whitelist 未含 status/draft。
//   - 本 guard **不** build / deploy / commit / push production；**不**改任何 production frontmatter；
//     **不**呼叫 Blogger / Google / GA4 / AdSense API。
//
// 覆蓋（本 session §10 最低契約 1–40）：合法 redraft/republish 原子寫入成功、寫入後 status/draft 正確、
//   draft 為未加引號 boolean、body byte-identical、slug/非白名單欄位不變、LF/CRLF 保留、file mode 保留、
//   source/target SHA 不符→寫入前 hard-fail、sourcePath/site/duplicate slug/lifecycle/矛盾/no-op/
//   changedFields → hard-fail、wrong-branch/ahead/behind/dirty/index.lock → 寫入前 hard-fail（且 lock 不變）、
//   validation callback 缺失 → hard-fail、validation success → 保留、validation failure → rollback 恢復
//   （source SHA / mode 恢復）、成功/失敗無 temp residue、sidecar/其他 Markdown 不變、arbitrary absolute
//   path / traversal 拒絕、engine source 無 git mutation/network/deploy、production CLI 仍無 --apply、
//   既有 whitelist 不含 status/draft、package.json 無 apply 入口、Phase A/B/C0 reuse 未破壞。
//
// 執行：`npm run check:redraft-apply-engine`（或 `node src/scripts/check-redraft-apply-engine.js`）。

import assert from 'node:assert';
import fs from 'node:fs/promises';
import { existsSync, readFileSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyLifecycleAtomic } from './redraft-apply-engine.js';
import { planRedraft, applyLifecyclePatch, runCli as redraftRunCli } from './redraft-plan.js';
import { evaluatePreflight } from './admin-git-safety-preflight.js';
import { resolveArticleBySlug, runCli as lookupRunCli } from './admin-article-lookup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const SECRET_MARKER = 'TOPSECRET-DO-NOT-LEAK-xyz789';

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
  const d = await fs.mkdtemp(path.join(os.tmpdir(), `redraft-apply-${label}-`));
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
  // 關閉 EOL 正規化 → CRLF fixture commit 後 working tree 仍 clean（byte-verbatim）。
  writeFileSync(path.join(dir, '.gitattributes'), '* -text\n', 'utf-8');
}
function rootOf(dir) {
  return path.resolve(git(['rev-parse', '--show-toplevel'], dir).stdout);
}
function headOf(dir) {
  return git(['rev-parse', 'HEAD'], dir).stdout;
}
function setOriginMain(dir, sha) {
  git(['update-ref', 'refs/remotes/origin/main', sha], dir);
}

// frontmatter 文章 builder（可控 eol / quote style / slug / body）。
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

// 建立 clean、eligible（main / 0-0 / clean / no lock）之 temp repo，內含一篇 post（+ 可選 sidecar / other）。
// 回 { dir, root, postRel, postAbs, sidecarAbs?, otherAbs? }。
async function makeRepo({ label, status, draft, statusStyle, slug = 'fixture-post', site = 'github', eol = '\n', withSidecar = false, withOther = false, dupSlugSecond = false }) {
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
  if (dupSlugSecond) {
    // 同一 site 內第二個相同 slug 檔（觸發 not-unique）。
    writeFileSync(path.join(postsAbs, `${slug}-copy.md`), buildPost({ status, draft, statusStyle, slug, site }), 'utf-8');
  }

  git(['add', '-A'], dir);
  git(['commit', '-m', 'seed'], dir);
  const head = headOf(dir);
  setOriginMain(dir, head);
  const root = rootOf(dir);
  return {
    dir, root,
    postRel: `${postsRel}/${slug}.md`,
    postAbs,
    sidecarAbs,
    otherAbs,
  };
}

// 產生真實 Phase B plan。
async function makePlan({ root, slug, op }) {
  const r = await planRedraft({ slug, op, projectRoot: root });
  assert.ok(r.ok, `plan generation failed: ${r.error} ${r.reason || ''}`);
  return r.plan;
}
const clonePlan = (p) => JSON.parse(JSON.stringify(p));

// 成功 validation callback。
const okValidator = async () => ({ ok: true });

// 掃描目標檔所在目錄是否遺留 engine temp（.<base>.redraft-apply.tmp-…）。
function tempResidue(fileAbs) {
  const dir = path.dirname(fileAbs);
  return readdirSync(dir).filter((n) => n.includes('.redraft-apply.tmp-'));
}
function modeOf(p) { return statSync(p).mode & 0o777; }

async function main() {
  // ════════ 1–9：合法寫入成功 + byte/EOL/mode 保留 ════════
  await check('(1) legal redraft fixture → atomic write success (status/draft flipped)', async () => {
    const { root, postAbs } = await makeRepo({ label: 'redraft-ok', status: 'ready', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    assert.strictEqual(r.applied, true);
    assert.strictEqual(r.validated, true);
    const after = readFileSync(postAbs, 'utf-8');
    assert.ok(after.includes('status: "draft"'), 'status should be "draft"');
    assert.ok(after.includes('draft: true'), 'draft should be true');
    assert.strictEqual(sha256(after), plan.targetSha256, 'file SHA must equal plan.targetSha256');
  });

  await check('(2) legal republish fixture → atomic write success', async () => {
    const { root, postAbs } = await makeRepo({ label: 'republish-ok', status: 'draft', draft: true });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'republish' });
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    const after = readFileSync(postAbs, 'utf-8');
    assert.ok(after.includes('status: "ready"'));
    assert.ok(after.includes('draft: false'));
  });

  await check('(3,4) after write status/draft correct; draft is unquoted boolean literal', async () => {
    const { root, postAbs } = await makeRepo({ label: 'unquoted', status: 'published', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    const after = readFileSync(postAbs, 'utf-8');
    assert.ok(after.includes('draft: true') && !after.includes('draft: "true"'), 'draft must stay unquoted boolean');
    assert.ok(after.includes('status: "draft"'), 'status must stay double-quoted (style preserved)');
  });

  await check('(5,6) body byte-identical; slug & non-whitelist fields unchanged; exactly 2 lines differ', async () => {
    const { root, postAbs } = await makeRepo({ label: 'bytepreserve', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    const after = readFileSync(postAbs, 'utf-8');
    assert.ok(after.includes(`hello body ${SECRET_MARKER} para.`), 'body preserved');
    assert.ok(after.includes('slug: "fixture-post"'), 'slug preserved');
    assert.ok(after.includes('tags: ["x", "y", "z"]'), 'inline array preserved');
    assert.ok(after.includes('description: "seo desc unchanged"'), 'unrelated field preserved');
    assert.ok(after.includes('publishTargets:\n  github:\n    enabled: true\n    mode: "full"'), 'nested block preserved');
    assert.ok(after.includes('# trailing comment kept'), 'comment preserved');
    const bl = before.split('\n'); const al = after.split('\n');
    assert.strictEqual(bl.length, al.length, 'line count unchanged');
    let d = 0; for (let i = 0; i < bl.length; i += 1) if (bl[i] !== al[i]) d += 1;
    assert.strictEqual(d, 2, 'exactly 2 lines differ (status + draft)');
  });

  await check('(7) LF preserved (no CRLF introduced)', async () => {
    const { root, postAbs } = await makeRepo({ label: 'lf', status: 'ready', draft: false, eol: '\n' });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    const after = readFileSync(postAbs, 'utf-8');
    assert.ok(!after.includes('\r'), 'no CR should be introduced into an LF file');
    assert.ok(after.includes('status: "draft"\n'), 'LF preserved on status line');
  });

  await check('(8) CRLF preserved on all lines', async () => {
    const { root, postAbs } = await makeRepo({ label: 'crlf', status: 'ready', draft: false, eol: '\r\n' });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, true, JSON.stringify(r));
    const after = readFileSync(postAbs, 'utf-8');
    assert.ok(after.includes('status: "draft"\r\n'), 'CRLF preserved on status line');
    assert.ok(after.includes('draft: true\r\n'), 'CRLF preserved on draft line');
    assert.ok(after.includes('slug: "fixture-post"\r\n'), 'other lines keep CRLF');
  });

  await check('(9) file mode preserved across atomic replace', async () => {
    const { root, postAbs } = await makeRepo({ label: 'mode', status: 'ready', draft: false });
    const before = modeOf(postAbs);
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(modeOf(postAbs), before, 'file mode must be preserved');
  });

  // ════════ 10–18：plan / integrity / lifecycle hard-fails（寫入前）════════
  await check('(10) source SHA mismatch → hard-fail before write (stale-source)', async () => {
    const { root, postAbs } = await makeRepo({ label: 'stale', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.sourceSha256 = '0'.repeat(64);
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'stale-source');
    assert.strictEqual(r.applied, false);
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file must be unchanged');
  });

  await check('(11) target SHA mismatch → hard-fail before write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'targetsha', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.targetSha256 = 'f'.repeat(64);
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'target-sha-mismatch');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file must be unchanged');
  });

  await check('(12) sourcePath mismatch (slug resolves elsewhere) → hard-fail', async () => {
    const { root, postAbs } = await makeRepo({ label: 'pathmis', status: 'ready', draft: false, withOther: true });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.sourcePath = 'content/github/posts/other-post.md'; // allowlisted but ≠ slug re-resolution
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'source-path-mismatch');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'target file unchanged');
  });

  await check('(13) site mismatch (contentRoot has no such slug) → hard-fail', async () => {
    const { root } = await makeRepo({ label: 'sitemis', status: 'ready', draft: false, site: 'github' });
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.contentRoot = 'blogger'; // slug only exists under github
    plan.sourcePath = 'content/blogger/posts/fixture-post.md';
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.ok(r.error === 're-resolve-failed', `expected re-resolve-failed, got ${r.error}`);
  });

  await check('(14) duplicate slug within site → hard-fail (not-unique)', async () => {
    const { root, postAbs } = await makeRepo({ label: 'dup', status: 'ready', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    // 事後加入第二個同 slug 檔（保持 clean / 0-0）。
    const dup = path.join(root, 'content', 'github', 'posts', 'fixture-post-2.md');
    writeFileSync(dup, buildPost({ status: 'ready', draft: false, slug: 'fixture-post' }), 'utf-8');
    git(['add', '-A'], root); git(['commit', '-m', 'dup'], root); setOriginMain(root, headOf(root));
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 're-resolve-failed');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'original file unchanged');
  });

  await check('(15) lifecycle current-state mismatch → hard-fail', async () => {
    const { root, postAbs } = await makeRepo({ label: 'lifemis', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.current = { status: 'published', draft: false }; // valid redraft pre, but ≠ actual ready
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'lifecycle-precondition-mismatch');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  await check('(16) contradictory target (status/draft not paired) → hard-fail', async () => {
    const { root } = await makeRepo({ label: 'contra', status: 'ready', draft: false });
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.target = { status: 'draft', draft: false }; // contradictory / not the fixed transition
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.stage, 'plan-validation');
    assert.ok(['plan-transition-mismatch', 'plan-target-contradiction'].includes(r.error), r.error);
  });

  await check('(17) changedFields not exactly {status,draft} → hard-fail', async () => {
    const { root } = await makeRepo({ label: 'fields', status: 'ready', draft: false });
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.changes.push({ field: 'title', old: 'a', new: 'b', lineNumber: 4, oldLine: 'x', newLine: 'y' });
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'plan-changed-fields-invalid');
  });

  await check('(18) no-op plan (sourceSha == targetSha) → hard-fail', async () => {
    const { root } = await makeRepo({ label: 'noop', status: 'ready', draft: false });
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.targetSha256 = plan.sourceSha256;
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'plan-no-op');
  });

  // ════════ 19–23：repository safety preflight hard-fails（寫入前）════════
  async function planThenBreak(label, breakFn) {
    const { root, postAbs } = await makeRepo({ label, status: 'ready', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    await breakFn(root);
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    return { r, root, postAbs, before, after: readFileSync(postAbs, 'utf-8') };
  }

  await check('(19) wrong branch → hard-fail before write', async () => {
    const { r, before, after } = await planThenBreak('wrongbranch', (root) => git(['checkout', '-b', 'feature'], root));
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'repository-not-eligible');
    assert.strictEqual(r.preflight.branch, 'feature');
    assert.strictEqual(after, before, 'file unchanged');
  });

  await check('(20) ahead of origin → hard-fail before write', async () => {
    const { r, before, after } = await planThenBreak('ahead', (root) => {
      writeFileSync(path.join(root, 'unrelated.txt'), 'x\n', 'utf-8');
      git(['add', '-A'], root); git(['commit', '-m', 'ahead'], root); // main ahead, origin/main stays
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'repository-not-eligible');
    assert.strictEqual(r.preflight.ahead, 1);
    assert.strictEqual(after, before, 'file unchanged');
  });

  await check('(21) behind origin → hard-fail before write', async () => {
    const { r, before, after } = await planThenBreak('behind', (root) => {
      const c1 = headOf(root);
      const tree = git(['rev-parse', `${c1}^{tree}`], root).stdout;
      const res = spawnSync('git', ['commit-tree', tree, '-p', c1, '-m', 'origin-ahead'], {
        cwd: root, encoding: 'utf-8', shell: false, windowsHide: true,
        env: { ...process.env, GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@e.com', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@e.com' },
      });
      setOriginMain(root, res.stdout.trim()); // origin/main ahead; tree identical → tree stays clean
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'repository-not-eligible');
    assert.strictEqual(r.preflight.behind, 1);
    assert.strictEqual(after, before, 'file unchanged');
  });

  await check('(22) dirty working tree → hard-fail before write', async () => {
    const { r, before, after } = await planThenBreak('dirty', (root) => {
      writeFileSync(path.join(root, 'untracked.txt'), 'stuff\n', 'utf-8'); // untracked → dirty
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'repository-not-eligible');
    assert.strictEqual(r.preflight.workingTreeClean, false);
    assert.strictEqual(after, before, 'file unchanged');
  });

  await check('(23) index.lock present → hard-fail before write; lock untouched', async () => {
    const { root, postAbs } = await makeRepo({ label: 'lock', status: 'ready', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    const before = readFileSync(postAbs, 'utf-8');
    const lockPath = path.join(root, '.git', 'index.lock');
    writeFileSync(lockPath, 'lock-marker', 'utf-8');
    const lockBefore = readFileSync(lockPath, 'utf-8');
    const lockMtime = statSync(lockPath).mtimeMs;
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'repository-not-eligible');
    assert.strictEqual(r.preflight.indexLockPresent, true);
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
    assert.ok(existsSync(lockPath), 'index.lock must NOT be deleted');
    assert.strictEqual(readFileSync(lockPath, 'utf-8'), lockBefore, 'lock content unchanged');
    assert.strictEqual(statSync(lockPath).mtimeMs, lockMtime, 'lock mtime unchanged');
  });

  // ════════ 24：validation callback 必要 ════════
  await check('(24) missing validation callback → hard-fail before write', async () => {
    const { root, postAbs } = await makeRepo({ label: 'nocb', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    const r = await applyLifecycleAtomic({ projectRoot: root, plan }); // no validateAfterWrite
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'validation-callback-required');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged (no write without callback)');
    const notFn = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: 'nope' });
    assert.strictEqual(notFn.error, 'validation-callback-required');
  });

  // ════════ 25–28：validation success / failure + rollback ════════
  await check('(25) validation success → target preserved; callback receives context', async () => {
    const { root, postAbs } = await makeRepo({ label: 'valok', status: 'ready', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    let ctx = null;
    const r = await applyLifecycleAtomic({
      projectRoot: root, plan,
      validateAfterWrite: async (c) => { ctx = c; return { ok: true }; },
    });
    assert.strictEqual(r.ok, true);
    assert.ok(ctx && ctx.projectRoot === root && ctx.sourcePath === plan.sourcePath && ctx.plan === plan, 'callback context');
    assert.strictEqual(sha256(readFileSync(postAbs, 'utf-8')), plan.targetSha256, 'target preserved');
  });

  await check('(26,27,28) validation failure → rollback restores original bytes / source SHA / mode', async () => {
    const { root, postAbs } = await makeRepo({ label: 'valfail', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const modeBefore = modeOf(postAbs);
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    let sawTargetDuringValidation = null;
    const r = await applyLifecycleAtomic({
      projectRoot: root, plan,
      validateAfterWrite: async () => { sawTargetDuringValidation = sha256(readFileSync(postAbs, 'utf-8')); return { ok: false }; },
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'post-write-validation-failed');
    assert.strictEqual(r.rolledBack, true);
    assert.strictEqual(r.rollbackOk, true);
    assert.strictEqual(r.needsManualInspection, false);
    // 寫入確實發生過（validation 時看到 target），但已 rollback。
    assert.strictEqual(sawTargetDuringValidation, plan.targetSha256, 'target was written before validation');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'original bytes restored');
    assert.strictEqual(sha256(readFileSync(postAbs, 'utf-8')), plan.sourceSha256, 'source SHA restored');
    assert.strictEqual(r.restoredSha256, plan.sourceSha256, 'reported restoredSha256 == source SHA');
    assert.strictEqual(modeOf(postAbs), modeBefore, 'mode restored');
  });

  // ════════ 29–32：no temp residue / sidecar / other markdown ════════
  await check('(29) no temp residue after success', async () => {
    const { root, postAbs } = await makeRepo({ label: 'residueok', status: 'ready', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.deepStrictEqual(tempResidue(postAbs), [], 'no temp files left after success');
  });

  await check('(30) no temp residue after failure (validation fail → rollback)', async () => {
    const { root, postAbs } = await makeRepo({ label: 'residuefail', status: 'ready', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: async () => ({ ok: false }) });
    assert.deepStrictEqual(tempResidue(postAbs), [], 'no temp files left after rollback');
  });

  await check('(31) sidecar (.publish.json) bytes unchanged', async () => {
    const { root, postAbs, sidecarAbs } = await makeRepo({ label: 'sidecar', status: 'ready', draft: false, withSidecar: true });
    const sidecarBefore = readFileSync(sidecarAbs, 'utf-8');
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(readFileSync(sidecarAbs, 'utf-8'), sidecarBefore, 'sidecar must be byte-unchanged');
    assert.ok(readFileSync(postAbs, 'utf-8').includes('status: "draft"'), 'post was updated');
  });

  await check('(32) other markdown in same folder unchanged', async () => {
    const { root, otherAbs } = await makeRepo({ label: 'othermd', status: 'ready', draft: false, withOther: true });
    const otherBefore = readFileSync(otherAbs, 'utf-8');
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(readFileSync(otherAbs, 'utf-8'), otherBefore, 'other post must be unchanged');
  });

  // ════════ 33–34：arbitrary absolute path / traversal 拒絕 ════════
  await check('(33) engine rejects arbitrary absolute path in plan.sourcePath', async () => {
    const { root, postAbs } = await makeRepo({ label: 'abspath', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.sourcePath = path.join(root, 'content', 'github', 'posts', 'fixture-post.md'); // absolute
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'plan-source-path-not-allowlisted');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  await check('(34) engine rejects traversal in plan.sourcePath', async () => {
    const { root, postAbs } = await makeRepo({ label: 'traversal', status: 'ready', draft: false });
    const before = readFileSync(postAbs, 'utf-8');
    const plan = clonePlan(await makePlan({ root, slug: 'fixture-post', op: 'redraft' }));
    plan.sourcePath = 'content/github/posts/../../../evil.md';
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'plan-source-path-not-allowlisted');
    assert.strictEqual(readFileSync(postAbs, 'utf-8'), before, 'file unchanged');
  });

  // ════════ 35：engine source contract（no git mutation / network / deploy）════════
  await check('(35) engine source contains no git mutation / network / deploy calls', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'redraft-apply-engine.js'), 'utf-8');
    const importLines = src.split('\n').filter((l) => /^\s*import\b/.test(l));
    for (const bad of ['safe-write', 'admin-write-cli', 'admin-write-whitelist', 'admin-frontmatter-patcher', 'child_process']) {
      assert.ok(!importLines.some((l) => l.includes(bad)), `engine must not import ${bad}`);
    }
    assert.ok(!/\bspawnSync\s*\(/.test(src), 'no spawnSync');
    assert.ok(!/\bexecSync\s*\(/.test(src) && !/[^.\w]exec\s*\(/.test(src), 'no exec/execSync');
    assert.ok(!/\bfetch\s*\(/.test(src), 'no network fetch');
    // 不得含 commit/push/deploy/build/gh-pages 的執行呼叫（掃 **非註解** 程式碼；散文邊界說明允許提及）。
    const codeOnly = src.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
    for (const tok of ['git commit', 'git push', 'gh-pages', 'deploy(', 'build:github', 'build:blogger']) {
      assert.ok(!codeOnly.includes(tok), `engine executable code must not reference "${tok}"`);
    }
    // 確認 dormant：main-module 區塊不呼叫 applyLifecycleAtomic。
    const mainIdx = src.indexOf('isMainModule()');
    const afterMain = src.slice(src.lastIndexOf('if (isMainModule())'));
    assert.ok(mainIdx > 0 && !/applyLifecycleAtomic\s*\(/.test(afterMain), 'main-module block must not call applyLifecycleAtomic');
  });

  // ════════ 36：production CLI 仍無 --apply（Phase A/B/C0）════════
  await check('(36) Phase A/B/C0 CLIs still reject --apply', async () => {
    const b = await redraftRunCli({ argv: ['--slug=x', '--op=redraft', '--apply'], projectRoot: REPO_ROOT });
    assert.strictEqual(b.exit, 2, 'Phase B --apply must exit 2');
    assert.strictEqual(b.result.error, 'write-flag-not-supported');
    const a = await lookupRunCli({ argv: ['--slug=x', '--apply'], projectRoot: REPO_ROOT });
    assert.strictEqual(a.exit, 2, 'Phase A --apply must exit 2');
    assert.ok(['apply-not-supported', 'write-flag-not-supported'].includes(a.result.error));
  });

  // ════════ 37：既有 real-write whitelist 未含 status/draft ════════
  await check('(37) existing real-write whitelist unchanged — no status/draft', () => {
    const patcher = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-frontmatter-patcher.js'), 'utf-8');
    const mP = patcher.match(/const ALLOWED_TOP_LEVEL_KEYS = new Set\(\[([^\]]*)\]\)/);
    assert.ok(mP, 'ALLOWED_TOP_LEVEL_KEYS present');
    assert.ok(mP[1].includes("'description'") && mP[1].includes("'searchDescription'"));
    assert.ok(!/status/.test(mP[1]) && !/draft/.test(mP[1]), 'patcher whitelist must NOT include status/draft');
    const cli = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-write-cli.js'), 'utf-8');
    const mC = cli.match(/const ALLOWED_FIELDS = new Set\(\[([^\]]*)\]\)/);
    assert.ok(mC, 'ALLOWED_FIELDS present');
    assert.ok(mC[1].includes("'description'") && mC[1].includes("'searchDescription'"));
    assert.ok(!/status/.test(mC[1]) && !/draft/.test(mC[1]), 'cli ALLOWED_FIELDS must NOT include status/draft');
  });

  // ════════ 38：package.json 無 apply 入口 ════════
  await check('(38) package.json has no apply/production write entry for the engine', () => {
    const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
    const scripts = pkg.scripts || {};
    for (const [name, value] of Object.entries(scripts)) {
      assert.ok(!/apply-redraft/i.test(name), `no apply-redraft script: ${name}`);
      assert.ok(!/apply-redraft/i.test(value), `no apply-redraft target: ${name}`);
      assert.ok(!/redraft-apply-engine\.js\b/.test(value) || name === 'check:redraft-apply-engine',
        `engine .js may only be referenced by its guard script, not ${name}`);
      assert.ok(!value.includes('--apply'), `no script may pass --apply: ${name}`);
    }
    // engine 只由其 guard 引用（透過 check script）。
    assert.ok(scripts['check:redraft-apply-engine'] === 'node src/scripts/check-redraft-apply-engine.js',
      'check:redraft-apply-engine must point at the guard');
    assert.ok(!Object.prototype.hasOwnProperty.call(scripts, 'admin:apply-redraft'), 'no admin:apply-redraft script');
  });

  // ════════ 39–40：Phase A/B/C0 reuse 未破壞（行為 smoke）════════
  await check('(39,40) reused Phase A/B/C0 primitives still behave (patch / preflight / resolver)', async () => {
    // Phase B applyLifecyclePatch 仍 byte-preserving 兩欄位。
    const raw = ['---', 'status: "ready"', 'draft: false', '---', '', 'body', ''].join('\n');
    const p = applyLifecyclePatch(raw, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.ok(p.ok && p.output.includes('status: "draft"') && p.output.includes('draft: true'));
    // Phase C0 evaluatePreflight 對 production repo 唯讀且結構完好。
    const pre = evaluatePreflight({ projectRoot: REPO_ROOT });
    assert.strictEqual(pre.mode, 'read-only-preflight');
    assert.strictEqual(pre.networkFetchPerformed, false);
    assert.strictEqual(pre.writePerformed, false);
    // Phase A resolver 對非法 slug hard-fail。
    const rr = await resolveArticleBySlug({ slug: '../evil', projectRoot: REPO_ROOT });
    assert.strictEqual(rr.ok, false);
    assert.strictEqual(rr.error, 'invalid-slug');
  });

  // ════════ 額外：no-leak（engine 輸出不含 body / secret）════════
  await check('(extra) engine report carries no article body / secret marker', async () => {
    const { root } = await makeRepo({ label: 'noleak', status: 'ready', draft: false });
    const plan = await makePlan({ root, slug: 'fixture-post', op: 'redraft' });
    const r = await applyLifecycleAtomic({ projectRoot: root, plan, validateAfterWrite: okValidator });
    const s = JSON.stringify(r);
    assert.ok(!s.includes(SECRET_MARKER), 'engine report must not leak body/secret');
  });

  console.log('');
  console.log(`redraft-apply-engine contract guard: ${pass} / ${fail}`);
  if (fail > 0) {
    console.log('');
    for (const f of fails) console.log(`  - ${f}`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(`[check-redraft-apply-engine] crashed: ${err && err.stack ? err.stack : err}`);
    process.exitCode = 2;
  })
  .finally(async () => {
    for (const d of tempDirs) {
      try { await fs.rm(d, { recursive: true, force: true }); } catch (_) { /* ignore */ }
    }
    console.log(`  cleanup: ${tempDirs.length} temp dirs removed`);
  });
