#!/usr/bin/env node
// Phase 20260714-B：redraft-plan（dry-run lifecycle patch planner）contract guard / tests。
//
// 範圍 / 邊界：
//   - 全部斷言在 **OS temp 目錄** 之 synthetic fixture tree 上跑；**絕不**碰 production content /
//     dist / settings / gh-pages；temp 目錄於 finally{} 清除。
//   - 只 import 被測模組（redraft-plan.js）之唯讀 API + node 讀取 API；**不** build / deploy / commit /
//     push / 寫 production 檔。唯一 write = 自己的 temp fixtures（隔離、finally 清除）。
//
// 覆蓋（本 session §8 明列 + ops / preconditions / determinism / rejections）：
//   - boolean scalar：draft false→true / true→false，literal 正確、不加引號、byte-preserving。
//   - 兩欄位成對變更：plan 恆含 status+draft 兩 change；byte diff 恰 2 行；不只改一半。
//   - byte preservation：除該 2 行外全部 byte-identical（含 inline array / nested / 註解 / CRLF）。
//   - zero-write：source no-write 契約（imports/calls）+ 檔案內容 / mtime 不變。
//   - 既有 write whitelist 不變：admin-frontmatter-patcher ALLOWED_TOP_LEVEL_KEYS 與 admin-write-cli
//     ALLOWED_FIELDS 維持 {description, searchDescription}，**未**含 status/draft（本 session 紅線）。
//   - redraft / republish state transitions；precondition-not-met；write flag 明確拒絕；
//     Phase A 解析透傳（not-found/duplicate/invalid slug）；determinism + SHA-256 正確；no body/secrets。
//
// 執行：`npm run check:redraft-plan`（或 `node src/scripts/check-redraft-plan.js`）。

import assert from 'node:assert';
import fs from 'node:fs/promises';
import { statSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { planRedraft, applyLifecyclePatch, formatPlan, runCli } from './redraft-plan.js';

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

function sha256(str) {
  return createHash('sha256').update(Buffer.from(str, 'utf-8')).digest('hex');
}

// 便利 fixture builder（LF）。
function mkPost({ status, draft, extra = [], statusStyle = 'double', body = 'body para one.' }) {
  const statusLine =
    statusStyle === 'double' ? `status: "${status}"`
      : statusStyle === 'single' ? `status: '${status}'`
        : `status: ${status}`;
  return [
    '---',
    'id: "20260101-fixture"',
    'site: "github"',
    'title: "Fixture Post"',
    'slug: "fixture-post"',
    'tags: ["a", "b", "c"]',
    'description: "seo desc"',
    'publishTargets:',
    '  github:',
    '    enabled: true',
    '    mode: "full"',
    '  blogger:',
    '    enabled: false',
    '    mode: "summary"',
    ...extra,
    statusLine,
    `draft: ${draft}`,
    '# a trailing comment',
    '---',
    '',
    body,
    '',
  ].join('\n');
}

function diffLineCount(a, b) {
  const al = a.split('\n');
  const bl = b.split('\n');
  assert.strictEqual(al.length, bl.length, `line count changed (${al.length} → ${bl.length})`);
  let n = 0;
  for (let i = 0; i < al.length; i++) if (al[i] !== bl[i]) n += 1;
  return n;
}

async function main() {
  // ── pure applyLifecyclePatch checks ───────────────────────────────────────
  await check('(boolean) draft false→true toggles literal, no quotes added', () => {
    const raw = mkPost({ status: 'ready', draft: 'false' });
    const r = applyLifecyclePatch(raw, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.strictEqual(r.ok, true, r.error);
    assert.ok(r.output.includes('draft: true'), 'draft should become true');
    assert.ok(!r.output.includes('draft: "true"'), 'draft must stay unquoted boolean');
    assert.ok(r.output.includes('status: "draft"'), 'status should become "draft"');
  });

  await check('(boolean) draft true→false toggles literal', () => {
    const raw = mkPost({ status: 'draft', draft: 'true' });
    const r = applyLifecyclePatch(raw, { currentStatus: 'draft', currentDraft: true, targetStatus: 'ready', targetDraft: false });
    assert.strictEqual(r.ok, true, r.error);
    assert.ok(r.output.includes('draft: false'));
    assert.ok(r.output.includes('status: "ready"'));
  });

  await check('(paired) exactly 2 lines change; both status+draft', () => {
    const raw = mkPost({ status: 'published', draft: 'false' });
    const r = applyLifecyclePatch(raw, { currentStatus: 'published', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.strictEqual(r.ok, true, r.error);
    assert.strictEqual(diffLineCount(raw, r.output), 2, 'exactly 2 lines must differ');
    assert.strictEqual(r.changes.length, 2);
    assert.deepStrictEqual(r.changes.map((c) => c.field).sort(), ['draft', 'status']);
  });

  await check('(byte-preservation) all non-target lines byte-identical (inline array / nested / comment)', () => {
    const raw = mkPost({ status: 'ready', draft: 'false' });
    const r = applyLifecyclePatch(raw, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.ok(r.output.includes('tags: ["a", "b", "c"]'), 'inline array preserved');
    assert.ok(r.output.includes('publishTargets:\n  github:\n    enabled: true\n    mode: "full"'), 'nested block preserved');
    assert.ok(r.output.includes('# a trailing comment'), 'comment preserved');
    assert.ok(r.output.includes('description: "seo desc"'), 'unrelated field preserved');
  });

  await check('(quote-style) double stays double / single stays single / plain stays plain', () => {
    const dbl = applyLifecyclePatch(mkPost({ status: 'ready', draft: 'false', statusStyle: 'double' }),
      { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.ok(dbl.output.includes('status: "draft"'), 'double-quote preserved');
    const sgl = applyLifecyclePatch(mkPost({ status: 'ready', draft: 'false', statusStyle: 'single' }),
      { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.ok(sgl.output.includes("status: 'draft'"), 'single-quote preserved');
    const pln = applyLifecyclePatch(mkPost({ status: 'ready', draft: 'false', statusStyle: 'plain' }),
      { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.ok(/status: draft(\n|$)/.test(pln.output.split('\n').join('\n')), 'plain scalar preserved');
    assert.ok(pln.output.includes('status: draft'));
  });

  await check('(CRLF) carriage returns preserved; only value bytes change', () => {
    const raw = ['---', 'title: "x"', 'status: "ready"', 'draft: false', '---', '', 'body', ''].join('\r\n');
    const r = applyLifecyclePatch(raw, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.strictEqual(r.ok, true, r.error);
    assert.ok(r.output.includes('status: "draft"\r\n'), 'CRLF preserved on status line');
    assert.ok(r.output.includes('draft: true\r\n'), 'CRLF preserved on draft line');
    assert.ok(r.output.includes('title: "x"\r\n'), 'other CRLF lines preserved');
  });

  await check('(fail-closed) missing status line / missing draft line / block scalar / non-bool draft', () => {
    const noStatus = ['---', 'title: "x"', 'draft: false', '---', 'body', ''].join('\n');
    assert.strictEqual(applyLifecyclePatch(noStatus, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true }).error, 'status-line-not-found');
    const noDraft = ['---', 'title: "x"', 'status: "ready"', '---', 'body', ''].join('\n');
    assert.strictEqual(applyLifecyclePatch(noDraft, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true }).error, 'draft-line-not-found');
    const blockStatus = ['---', 'status: |', '  ready', 'draft: false', '---', 'body', ''].join('\n');
    assert.strictEqual(applyLifecyclePatch(blockStatus, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true }).error, 'status-scalar-unsupported');
    const badBool = ['---', 'status: "ready"', 'draft: "false"', '---', 'body', ''].join('\n');
    assert.strictEqual(applyLifecyclePatch(badBool, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true }).error, 'draft-not-boolean-literal');
  });

  await check('(fail-closed) precondition mismatch between raw & expected; no-op rejected', () => {
    const raw = mkPost({ status: 'ready', draft: 'false' });
    const mism = applyLifecyclePatch(raw, { currentStatus: 'published', currentDraft: false, targetStatus: 'draft', targetDraft: true });
    assert.strictEqual(mism.error, 'status-precondition-mismatch');
    const noop = applyLifecyclePatch(raw, { currentStatus: 'ready', currentDraft: false, targetStatus: 'ready', targetDraft: false });
    assert.strictEqual(noop.error, 'no-op-not-a-lifecycle-transition');
  });

  // ── source no-write contract + existing whitelist unchanged ────────────────
  await check('(zero-write) redraft-plan imports/calls no write API', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'redraft-plan.js'), 'utf-8');
    const importLines = src.split('\n').filter((l) => /^\s*import\b/.test(l));
    const fsImport = importLines.find((l) => l.includes('node:fs/promises'));
    assert.ok(fsImport && /import\s*\{\s*readFile\s*\}\s*from/.test(fsImport), 'fs/promises import must be readFile only');
    for (const bad of ['safe-write', 'admin-write-cli', 'admin-frontmatter-patcher', 'admin-write-whitelist']) {
      assert.ok(!importLines.some((l) => l.includes(bad)), `must not import ${bad}`);
    }
    assert.ok(!/\b(writeFile|appendFile|mkdir|rename|copyFile|unlink|rmdir)\s*\(/.test(src), 'must not call fs write APIs');
    assert.ok(!/\bfs\.rm\s*\(/.test(src) && !/(^|[^a-zA-Z._])rm\s*\(/.test(src), 'must not call rm()');
  });

  await check('(red line) existing real-write whitelist unchanged — status/draft NOT added', () => {
    const patcher = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-frontmatter-patcher.js'), 'utf-8');
    const mP = patcher.match(/const ALLOWED_TOP_LEVEL_KEYS = new Set\(\[([^\]]*)\]\)/);
    assert.ok(mP, 'admin-frontmatter-patcher must declare ALLOWED_TOP_LEVEL_KEYS');
    const setP = mP[1];
    assert.ok(setP.includes("'description'") && setP.includes("'searchDescription'"), 'patcher whitelist must keep description/searchDescription');
    assert.ok(!/status/.test(setP) && !/draft/.test(setP), 'patcher whitelist must NOT include status/draft');

    const cli = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-write-cli.js'), 'utf-8');
    const mC = cli.match(/const ALLOWED_FIELDS = new Set\(\[([^\]]*)\]\)/);
    assert.ok(mC, 'admin-write-cli must declare ALLOWED_FIELDS');
    const setC = mC[1];
    assert.ok(setC.includes("'description'") && setC.includes("'searchDescription'"), 'cli whitelist must keep description/searchDescription');
    assert.ok(!/status/.test(setC) && !/draft/.test(setC), 'cli ALLOWED_FIELDS must NOT include status/draft');
  });

  // ── fixture-based planner + CLI checks ─────────────────────────────────────
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'redraft-plan-test-'));
  console.log(`  tmpRoot=${tmpRoot}`);
  try {
    const ghPosts = path.join(tmpRoot, 'content', 'github', 'posts');
    const bgPosts = path.join(tmpRoot, 'content', 'blogger', 'posts');
    await fs.mkdir(ghPosts, { recursive: true });
    await fs.mkdir(bgPosts, { recursive: true });

    const readyPath = path.join(ghPosts, 'ready.md');
    const publishedPath = path.join(ghPosts, 'published.md');
    const draftPath = path.join(ghPosts, 'draft.md');
    const dupGhPath = path.join(ghPosts, 'dup.md');
    const dupBgPath = path.join(bgPosts, 'dup.md');

    const readyRaw = [
      '---', 'title: "Ready"', 'slug: "ready-post"', 'tags: ["x", "y"]', 'status: "ready"', 'draft: false', '---', '',
      `body ${SECRET_MARKER} more.`, '',
    ].join('\n');
    await fs.writeFile(readyPath, readyRaw, 'utf-8');
    await fs.writeFile(publishedPath, ['---', 'title: "Pub"', 'slug: "published-post"', 'status: "published"', 'draft: false', '---', '', 'body', ''].join('\n'), 'utf-8');
    await fs.writeFile(draftPath, ['---', 'title: "Draft"', 'slug: "draft-post"', 'status: "draft"', 'draft: true', '---', '', 'body', ''].join('\n'), 'utf-8');
    await fs.writeFile(dupGhPath, ['---', 'title: "DupG"', 'slug: "dup-slug"', 'status: "ready"', 'draft: false', '---', '', 'b', ''].join('\n'), 'utf-8');
    await fs.writeFile(dupBgPath, ['---', 'title: "DupB"', 'slug: "dup-slug"', 'status: "ready"', 'draft: false', '---', '', 'b', ''].join('\n'), 'utf-8');

    await check('(redraft) published+false → draft+true plan', async () => {
      const r = await planRedraft({ slug: 'published-post', op: 'redraft', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true, r.error);
      assert.deepStrictEqual(r.plan.target, { status: 'draft', draft: true });
      assert.deepStrictEqual(r.plan.current, { status: 'published', draft: false });
      assert.strictEqual(r.plan.written, false);
      assert.strictEqual(r.plan.apply, false);
    });

    await check('(redraft) ready+false → draft+true plan', async () => {
      const r = await planRedraft({ slug: 'ready-post', op: 'redraft', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true, r.error);
      assert.deepStrictEqual(r.plan.target, { status: 'draft', draft: true });
    });

    await check('(republish) draft+true → ready+false plan', async () => {
      const r = await planRedraft({ slug: 'draft-post', op: 'republish', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true, r.error);
      assert.deepStrictEqual(r.plan.target, { status: 'ready', draft: false });
      assert.deepStrictEqual(r.plan.current, { status: 'draft', draft: true });
    });

    await check('(precondition) redraft on a draft article → precondition-not-met', async () => {
      const r = await planRedraft({ slug: 'draft-post', op: 'redraft', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'precondition-not-met');
    });

    await check('(precondition) republish on a published article → precondition-not-met', async () => {
      const r = await planRedraft({ slug: 'published-post', op: 'republish', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'precondition-not-met');
    });

    await check('(invalid op) → invalid-op', async () => {
      const r = await planRedraft({ slug: 'ready-post', op: 'archive', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'invalid-op');
    });

    await check('(Phase A passthrough) not-found / duplicate / invalid slug', async () => {
      assert.strictEqual((await planRedraft({ slug: 'nope-post', op: 'redraft', projectRoot: tmpRoot })).error, 'not-found');
      assert.strictEqual((await planRedraft({ slug: 'dup-slug', op: 'redraft', projectRoot: tmpRoot })).error, 'not-unique');
      assert.strictEqual((await planRedraft({ slug: '../../etc', op: 'redraft', projectRoot: tmpRoot })).error, 'invalid-slug');
    });

    await check('(sha256) sourceSha256 = hash of file bytes; targetSha256 = hash of patched output', async () => {
      const r = await planRedraft({ slug: 'ready-post', op: 'redraft', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.sourceSha256, sha256(readyRaw), 'sourceSha256 must equal hash of file bytes');
      const patched = applyLifecyclePatch(readyRaw, { currentStatus: 'ready', currentDraft: false, targetStatus: 'draft', targetDraft: true });
      assert.strictEqual(r.plan.targetSha256, sha256(patched.output), 'targetSha256 must equal hash of patched output');
      assert.notStrictEqual(r.plan.sourceSha256, r.plan.targetSha256);
    });

    await check('(determinism) JSON plan byte-identical across runs', async () => {
      const a = await runCli({ argv: ['--slug=ready-post', '--op=redraft', '--json'], projectRoot: tmpRoot });
      const b = await runCli({ argv: ['--slug=ready-post', '--op=redraft', '--json'], projectRoot: tmpRoot });
      assert.strictEqual(a.stdout, b.stdout);
      const parsed = JSON.parse(a.stdout);
      assert.deepStrictEqual(Object.keys(parsed.plan).slice(0, 6), ['op', 'slug', 'sourcePath', 'contentRoot', 'current', 'target']);
    });

    await check('(zero-write) planning does not mutate file content or mtime', async () => {
      const before = await fs.readFile(readyPath, 'utf-8');
      const mtimeBefore = statSync(readyPath).mtimeMs;
      await planRedraft({ slug: 'ready-post', op: 'redraft', projectRoot: tmpRoot });
      await runCli({ argv: ['--slug=ready-post', '--op=redraft', '--json'], projectRoot: tmpRoot });
      const after = await fs.readFile(readyPath, 'utf-8');
      assert.strictEqual(after, before, 'file content must be unchanged');
      assert.strictEqual(statSync(readyPath).mtimeMs, mtimeBefore, 'mtime must be unchanged');
    });

    await check('(reject) --apply/--write/--commit/--push/--deploy/--save/--output → exit 2', async () => {
      for (const flag of ['--apply', '--write', '--commit', '--push', '--deploy', '--save', '--output', '--output=x.md']) {
        const r = await runCli({ argv: ['--slug=ready-post', '--op=redraft', flag], projectRoot: tmpRoot });
        assert.strictEqual(r.exit, 2, `${flag} must exit 2`);
        assert.strictEqual(r.result.error, 'write-flag-not-supported', `${flag} → write-flag-not-supported`);
      }
    });

    await check('(args) missing slug / missing op → exit 2; success/not-found/duplicate exit codes', async () => {
      assert.strictEqual((await runCli({ argv: ['--op=redraft'], projectRoot: tmpRoot })).exit, 2);
      assert.strictEqual((await runCli({ argv: ['--slug=ready-post'], projectRoot: tmpRoot })).exit, 2);
      assert.strictEqual((await runCli({ argv: ['--slug=ready-post', '--op=redraft'], projectRoot: tmpRoot })).exit, 0);
      assert.strictEqual((await runCli({ argv: ['--slug=nope-post', '--op=redraft'], projectRoot: tmpRoot })).exit, 4);
      assert.strictEqual((await runCli({ argv: ['--slug=dup-slug', '--op=redraft'], projectRoot: tmpRoot })).exit, 5);
      assert.strictEqual((await runCli({ argv: ['--slug=draft-post', '--op=redraft'], projectRoot: tmpRoot })).exit, 8); // precondition
    });

    await check('(no leak) plan output contains no body text and no secret marker', async () => {
      const r = await planRedraft({ slug: 'ready-post', op: 'redraft', projectRoot: tmpRoot });
      const human = formatPlan(r, { json: false });
      const jsonOut = formatPlan(r, { json: true });
      assert.ok(!human.includes(SECRET_MARKER) && !jsonOut.includes(SECRET_MARKER), 'must not leak secret marker');
      assert.ok(!human.includes('body ') && !jsonOut.includes('body '), 'must not include article body');
    });
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
    console.log('  cleanup: temp dir removed');
  }

  console.log('');
  console.log(`redraft-plan contract guard: ${pass} / ${fail}`);
  if (fail > 0) {
    console.log('');
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[check-redraft-plan] crashed: ${err && err.stack ? err.stack : err}`);
  process.exit(2);
});
