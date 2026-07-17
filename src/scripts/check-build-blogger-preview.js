#!/usr/bin/env node
// Phase 20260717-B2-c：build-blogger-preview（draft-aware preview artifact builder）contract guard。
//
// 範圍 / 邊界：
//   - 全部斷言在 **OS temp 目錄** 之 synthetic fixture tree（content）+ temp output root 上跑；
//     **絕不**寫 production content / dist-blogger/ / dist-blogger-preview/ / gh-pages；
//     temp 目錄於 finally{} 清除。
//   - 唯一對 production 之存取 = **唯讀**：讀 src/scripts/*.js 原始碼做契約斷言、
//     loadSettings() 讀 content/settings/（render 所需）。不寫、不刪、不改 mtime。
//   - 不呼叫 Blogger / Google API；不需網路；不需 credential。
//
// 覆蓋（per 本 phase spec §E）：
//   A. CLI 與參數：missing / unknown / duplicate / malformed slug、--apply / --deploy / --publish、
//      不存在 output override。
//   B. Target classification：draft accepted / ready accepted / non-Blogger rejected /
//      invalid frontmatter rejected / duplicate slug ambiguity rejected / planner 與 builder 不漂移。
//   C. Artifact：路徑、正式 dist 未動、PREVIEW-ONLY、NOT FOR DEPLOY、結構完整、renderer 實際共用、
//      failure 不留半成品、deterministic modulo builtAt、不執行 content-embedded script、
//      不讀 credential、不呼叫 network。
//   D. Formal build parity：preview marker 不滲入正式 build、draft 不滲入正式 dist-blogger/、
//      renderer 非兩套、import 無 side effect。
//
// 執行：`npm run check:build-blogger-preview`。

import assert from 'node:assert';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  buildBloggerPreview,
  assertSafeOutputRoot,
  resolveDefaultOutputRoot,
  previewOutputDirFor,
  runCli,
  exitCodeForError,
  PREVIEW_DIST_REL,
  PREVIEW_MARKER,
  PREVIEW_PLANNED_FILES,
} from './build-blogger-preview.js';
import { planBloggerPreview } from './blogger-preview-plan.js';
import { renderBloggerPost } from './blogger-render.js';
import { classify, processMarkdownEntry } from './load-posts.js';
import { loadSettings } from './load-settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(REPO_ROOT, 'src', 'scripts');

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

function srcOf(file) {
  return readFileSync(path.join(SCRIPTS_DIR, file), 'utf-8');
}
// 去除註解行後之「實際程式碼」（避免把說明文字誤判為實作）。
function codeOf(file) {
  return srcOf(file).split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
}

function fm(fields, body = 'body text.') {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) lines.push(`${k}: ${v}`);
  lines.push('---', '', body, '');
  return lines.join('\n');
}

async function writeFixture(root, rel, content) {
  const abs = path.join(root, ...rel.split('/'));
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, 'utf-8');
  return abs;
}

const base = (over = {}) => ({
  id: '"f-id"',
  title: '"Fixture post"',
  date: '"2026-05-04"',
  author: '"Dean"',
  category: '"life-note"',
  description: '"fixture description"',
  ...over,
});

async function main() {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'build-blogger-preview-'));
  const outRoot = path.join(tmpRoot, '_out');
  const outRoot2 = path.join(tmpRoot, '_out2');
  console.log(`  fixture root: ${tmpRoot}`);

  try {
    await writeFixture(tmpRoot, 'content/blogger/posts/native-ready.md', fm(base({
      id: '"f-native-ready"', slug: '"native-ready"', title: '"Native ready"', status: '"ready"', draft: 'false',
    })));
    await writeFixture(tmpRoot, 'content/blogger/posts/native-draft.md', fm(base({
      id: '"f-native-draft"', slug: '"native-draft"', title: '"Native draft"', status: '"draft"', draft: 'true',
    })));
    await writeFixture(tmpRoot, 'content/github/posts/cross-enabled.md', fm(base({
      id: '"f-cross-enabled"', slug: '"cross-enabled"', title: '"Cross enabled"', status: '"ready"', draft: 'false',
      publishTargets: '{ github: { enabled: true, mode: "full" }, blogger: { enabled: true, mode: "summary" } }',
    })));
    await writeFixture(tmpRoot, 'content/github/posts/cross-disabled.md', fm(base({
      id: '"f-cross-disabled"', slug: '"cross-disabled"', title: '"Cross disabled"', status: '"ready"', draft: 'false',
      publishTargets: '{ github: { enabled: true, mode: "full" }, blogger: { enabled: false } }',
    })));
    await writeFixture(tmpRoot, 'content/blogger/posts/dupe.md', fm(base({
      id: '"f-dupe-b"', slug: '"dupe"', status: '"ready"', draft: 'false',
    })));
    await writeFixture(tmpRoot, 'content/github/posts/dupe.md', fm(base({
      id: '"f-dupe-g"', slug: '"dupe"', status: '"ready"', draft: 'false',
      publishTargets: '{ blogger: { enabled: true, mode: "full" } }',
    })));
    // 壞 frontmatter（YAML 無法解析）但文字上宣告目標 slug
    await writeFixture(tmpRoot, 'content/blogger/posts/broken-fm.md',
      '---\nslug: "broken-fm"\ntitle: "unclosed\n  bad: [1,2\n---\n\nbody\n');
    // content-embedded script / EJS 樣板注入（不得被求值）
    await writeFixture(tmpRoot, 'content/blogger/posts/inject.md', fm(base({
      id: '"f-inject"', slug: '"inject"', title: '"Inject"', status: '"draft"', draft: 'true',
    }), 'EJS_NOT_EVAL <%= 6*7 %> and <%- process.exit(1) %> end.'));

    const ok = (r) => { assert.strictEqual(r.ok, true, `expected ok, got ${JSON.stringify(r).slice(0, 400)}`); return r.result; };

    // ══ A. CLI 與參數 ═══════════════════════════════════════════════════════════
    await check('A1 CLI missing slug → hard-fail (exit 2)', async () => {
      const r = await runCli({ argv: [], projectRoot: tmpRoot, outputRoot: outRoot });
      assert.strictEqual(r.exit, 2);
      assert.strictEqual(r.result.error, 'slug-arg-missing');
    });

    await check('A2 CLI unknown slug → hard-fail (not-found, exit 4)', async () => {
      const r = await runCli({ argv: ['--slug=no-such-slug'], projectRoot: tmpRoot, outputRoot: outRoot });
      assert.strictEqual(r.exit, 4);
      assert.strictEqual(r.result.error, 'not-found');
    });

    await check('A3 CLI duplicate slug argument → hard-fail（不默默取最後一個）', async () => {
      const r = await runCli({ argv: ['--slug=native-draft', '--slug=native-ready'], projectRoot: tmpRoot, outputRoot: outRoot });
      assert.strictEqual(r.exit, 2);
      assert.strictEqual(r.result.error, 'duplicate-slug-arg');
      assert.ok(!existsSync(previewOutputDirFor(outRoot, 'native-ready')), '重複 slug 不得產出任何檔');
      assert.ok(!existsSync(previewOutputDirFor(outRoot, 'native-draft')), '重複 slug 不得產出任何檔');
    });

    await check('A4 CLI malformed slug → hard-fail (invalid-slug, exit 3)', async () => {
      for (const bad of ['../etc/passwd', 'Has Space', 'UPPER', 'a//b', '%2e%2e']) {
        const r = await runCli({ argv: [`--slug=${bad}`], projectRoot: tmpRoot, outputRoot: outRoot });
        assert.strictEqual(r.exit, 3, `malformed slug 未被拒絕: ${bad}`);
        assert.strictEqual(r.result.error, 'invalid-slug');
      }
    });

    for (const flag of ['--apply', '--deploy', '--publish', '--push', '--write', '--force', '--commit']) {
      await check(`A5 CLI 明確拒絕 ${flag}（hard-fail exit 2；非靜默忽略）`, async () => {
        const r = await runCli({ argv: ['--slug=native-draft', flag], projectRoot: tmpRoot, outputRoot: outRoot });
        assert.strictEqual(r.exit, 2, `${flag} 須 hard-fail`);
        assert.strictEqual(r.result.error, 'write-flag-not-supported');
        assert.ok(!existsSync(previewOutputDirFor(outRoot, 'native-draft')), `${flag} 被拒後不得留下產物`);
      });
      await check(`A5b CLI 拒絕帶值形式 ${flag}=x`, async () => {
        const r = await runCli({ argv: ['--slug=native-draft', `${flag}=x`], projectRoot: tmpRoot, outputRoot: outRoot });
        assert.strictEqual(r.exit, 2);
        assert.strictEqual(r.result.error, 'write-flag-not-supported');
      });
    }

    await check('A6 不存在 output override：--output / --out-dir 一律 hard-fail', async () => {
      for (const f of ['--output', '--out-dir']) {
        const r = await runCli({ argv: ['--slug=native-draft', `${f}=${path.join(tmpRoot, 'anywhere')}`], projectRoot: tmpRoot, outputRoot: outRoot });
        assert.strictEqual(r.exit, 2, `${f} 須 hard-fail`);
        assert.strictEqual(r.result.error, 'write-flag-not-supported');
      }
    });

    await check('A7 不存在 output override：CLI 原始碼未把使用者輸入接進 outputRoot', async () => {
      const code = codeOf('build-blogger-preview.js');
      assert.ok(code.includes("REJECTED_WRITE_FLAGS.has(bare)"), 'CLI 須有 write-flag 拒絕閘');
      assert.ok(/outputRoot:\s*outputRoot\s*\?\?\s*resolveDefaultOutputRoot\(projectRoot\)/.test(code),
        'CLI 之 outputRoot 必須恆為 canonical default（不得來自 argv）');
      assert.ok(!/parsed\.(output|outDir)/.test(code), 'CLI 不得從 argv 取 output 路徑');
    });

    await check('A8 CLI 拒絕 unknown-arg（exit 2）', async () => {
      const r = await runCli({ argv: ['--slug=native-draft', '--wat'], projectRoot: tmpRoot, outputRoot: outRoot });
      assert.strictEqual(r.exit, 2);
      assert.strictEqual(r.result.error, 'unknown-arg');
    });

    // ══ B. Target classification ════════════════════════════════════════════════
    await check('B1 valid draft Blogger target accepted（不需改 frontmatter）', async () => {
      const before = readFileSync(path.join(tmpRoot, 'content/blogger/posts/native-draft.md'), 'utf-8');
      const r = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      assert.strictEqual(r.slug, 'native-draft');
      assert.strictEqual(r.current.draft, true);
      assert.strictEqual(r.officialBuild.includes, false);
      assert.strictEqual(r.officialBuild.reason, 'draft:true');
      assert.strictEqual(readFileSync(path.join(tmpRoot, 'content/blogger/posts/native-draft.md'), 'utf-8'), before,
        'preview 不得修改 frontmatter');
    });

    await check('B2 valid ready Blogger target accepted', async () => {
      const r = ok(await buildBloggerPreview({ slug: 'native-ready', projectRoot: tmpRoot, outputRoot: outRoot }));
      assert.strictEqual(r.officialBuild.includes, true);
      assert.strictEqual(r.officialBuild.reason, 'ok');
      assert.strictEqual(r.sourceSite, 'blogger');
    });

    await check('B3 valid ready github-cross target accepted（mode 沿用 frontmatter）', async () => {
      const r = ok(await buildBloggerPreview({ slug: 'cross-enabled', projectRoot: tmpRoot, outputRoot: outRoot }));
      assert.strictEqual(r.sourceSite, 'github-cross');
      assert.strictEqual(r.mode, 'summary');
      assert.strictEqual(r.rendered, 'summary');
    });

    await check('B4 non-Blogger target rejected（不得靜默通過；exit 8）', async () => {
      const r = await buildBloggerPreview({ slug: 'cross-disabled', projectRoot: tmpRoot, outputRoot: outRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'not-a-blogger-target');
      assert.strictEqual(exitCodeForError(r.error), 8);
      assert.ok(!existsSync(previewOutputDirFor(outRoot, 'cross-disabled')), '被拒 target 不得留下產物');
    });

    await check('B5 invalid frontmatter rejected（exit 6）', async () => {
      const r = await buildBloggerPreview({ slug: 'broken-fm', projectRoot: tmpRoot, outputRoot: outRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'frontmatter-parse-failed');
      assert.strictEqual(exitCodeForError(r.error), 6);
      assert.ok(!existsSync(previewOutputDirFor(outRoot, 'broken-fm')));
    });

    await check('B6 duplicate slug ambiguity rejected（exit 5；--site 可消歧）', async () => {
      const r = await buildBloggerPreview({ slug: 'dupe', projectRoot: tmpRoot, outputRoot: outRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'not-unique');
      assert.strictEqual(exitCodeForError(r.error), 5);
      assert.ok(!existsSync(previewOutputDirFor(outRoot, 'dupe')), '歧義 slug 不得產出（不得默默取第一筆）');
      const okr = ok(await buildBloggerPreview({ slug: 'dupe', site: 'blogger', projectRoot: tmpRoot, outputRoot: outRoot }));
      assert.strictEqual(okr.contentRoot, 'blogger');
    });

    await check('B7 反 drift：builder 之 eligibility 完全等於 Phase A planner', async () => {
      for (const slug of ['native-draft', 'native-ready', 'cross-enabled']) {
        const plan = await planBloggerPreview({ slug, projectRoot: tmpRoot });
        const built = ok(await buildBloggerPreview({ slug, projectRoot: tmpRoot, outputRoot: outRoot }));
        assert.strictEqual(built.sourceSite, plan.plan.sourceSite, `${slug}: sourceSite drift`);
        assert.strictEqual(built.mode, plan.plan.previewBuild.mode, `${slug}: mode drift`);
        assert.strictEqual(built.officialBuild.includes, plan.plan.officialBuild.includes, `${slug}: includes drift`);
        assert.strictEqual(built.officialBuild.reason, plan.plan.officialBuild.reason, `${slug}: reason drift`);
        assert.deepStrictEqual(built.files, [...plan.plan.previewBuild.files], `${slug}: files drift`);
        assert.strictEqual(built.marker, plan.plan.previewBuild.marker, `${slug}: marker drift`);
      }
      // 被拒 target 兩端同樣 hard-fail、同一 error。
      const p = await planBloggerPreview({ slug: 'cross-disabled', projectRoot: tmpRoot });
      const b = await buildBloggerPreview({ slug: 'cross-disabled', projectRoot: tmpRoot, outputRoot: outRoot });
      assert.strictEqual(p.ok, false); assert.strictEqual(b.ok, false);
      assert.strictEqual(p.error, b.error, 'planner / builder 拒絕原因不一致');
    });

    await check('B8 反 drift：builder 之 outputDir / files 由 Phase A 常數推導', async () => {
      assert.strictEqual(PREVIEW_DIST_REL, 'dist-blogger-preview');
      assert.strictEqual(PREVIEW_MARKER, 'PREVIEW-ONLY / NOT FOR DEPLOY');
      assert.deepStrictEqual([...PREVIEW_PLANNED_FILES], ['post.html', 'copy-helper.txt', 'meta.json']);
      const code = codeOf('build-blogger-preview.js');
      assert.ok(code.includes("from './blogger-preview-plan.js'"), 'builder 須 import Phase A planner 常數');
      assert.ok(code.includes('planBloggerPreview('), 'builder 須實際呼叫 planner（而非另抄 eligibility）');
    });

    // ══ C. Artifact ═════════════════════════════════════════════════════════════
    await check('C1 output 位於 dist-blogger-preview/posts/<slug>/', async () => {
      const canonical = resolveDefaultOutputRoot(REPO_ROOT);
      assert.strictEqual(canonical, path.join(REPO_ROOT, 'dist-blogger-preview'));
      assert.strictEqual(previewOutputDirFor(canonical, 'x'), path.join(REPO_ROOT, 'dist-blogger-preview', 'posts', 'x'));
      const r = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      assert.strictEqual(r.outputDir, path.join(outRoot, 'posts', 'native-draft'));
      for (const w of r.writtenFiles) {
        assert.ok(!/(^|\/)dist-blogger\//.test(w), `寫出路徑不得落在正式 dist-blogger/: ${w}`);
      }
    });

    await check('C2 artifact 結構完整（3 檔齊全；publish-checklist 刻意不產）', async () => {
      const r = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      const dir = r.outputDir;
      for (const f of PREVIEW_PLANNED_FILES) {
        assert.ok(existsSync(path.join(dir, f)), `缺少 ${f}`);
        assert.ok(readFileSync(path.join(dir, f), 'utf-8').length > 0, `${f} 為空`);
      }
      assert.ok(!existsSync(path.join(dir, 'publish-checklist.txt')),
        'preview 不得產 publish-checklist.txt（避免誘導正式發布）');
      assert.strictEqual(r.publishChecklistWritten, false);
      const meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf-8'));
      assert.strictEqual(meta.slug, 'native-draft');
      assert.strictEqual(meta.status, 'draft');
      assert.strictEqual(meta.draft, true);
      assert.strictEqual(meta.bloggerMode, 'full');
      assert.strictEqual(meta.rendered, 'full');
      assert.ok(typeof meta.build.builtAt === 'string' && meta.build.builtAt !== '');
      const files = (await fs.readdir(dir)).sort();
      assert.deepStrictEqual(files, ['copy-helper.txt', 'meta.json', 'post.html'], '產出目錄不得有多餘檔案');
    });

    await check('C3 preview marker：post.html 含 PREVIEW-ONLY 與 NOT FOR DEPLOY', async () => {
      const r = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      const html = readFileSync(path.join(r.outputDir, 'post.html'), 'utf-8');
      assert.ok(html.includes('PREVIEW-ONLY'), 'post.html 缺 PREVIEW-ONLY');
      assert.ok(html.includes('NOT FOR DEPLOY'), 'post.html 缺 NOT FOR DEPLOY');
      assert.ok(html.trimStart().startsWith('<!--'), 'marker 須位於檔首（人工檢查者第一眼可見）');
    });

    await check('C4 preview marker：copy-helper.txt 含 PREVIEW-ONLY 與 NOT FOR DEPLOY', async () => {
      const r = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      const txt = readFileSync(path.join(r.outputDir, 'copy-helper.txt'), 'utf-8');
      assert.ok(txt.includes('PREVIEW-ONLY'), 'copy-helper 缺 PREVIEW-ONLY');
      assert.ok(txt.includes('NOT FOR DEPLOY'), 'copy-helper 缺 NOT FOR DEPLOY');
    });

    await check('C5 preview marker：meta.json 之機器可讀旗標', async () => {
      const r = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      const meta = JSON.parse(readFileSync(path.join(r.outputDir, 'meta.json'), 'utf-8'));
      assert.strictEqual(meta.preview.marker, PREVIEW_MARKER);
      assert.strictEqual(meta.preview.previewOnly, true);
      assert.strictEqual(meta.preview.notForDeploy, true);
      assert.strictEqual(meta.preview.generatedBy, 'build:blogger-preview');
      assert.strictEqual(meta.preview.officialBuild.includes, false);
      assert.strictEqual(meta.preview.officialBuild.reason, 'draft:true');
    });

    await check('C6 正式 dist-blogger/ 未被 preview 建立或修改（temp root 與真實 repo 皆驗）', async () => {
      await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot });
      assert.ok(!existsSync(path.join(tmpRoot, 'dist-blogger')), 'preview 不得建立正式 dist-blogger/');
      assert.ok(!existsSync(path.join(outRoot, 'dist-blogger')), 'preview 不得於 output root 建立正式 dist');
      const code = codeOf('build-blogger-preview.js');
      assert.ok(!/writeFile\([^)]*dist-blogger[^-]/.test(code), 'builder 不得寫入正式 dist-blogger/');
    });

    await check('C7 renderer 實際共用（非測試假 implementation）：產出 === banner + renderBloggerPost()', async () => {
      const settings = await loadSettings();
      const r = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      const meta = JSON.parse(readFileSync(path.join(r.outputDir, 'meta.json'), 'utf-8'));
      const absPath = path.join(tmpRoot, ...r.sourcePath.split('/'));
      const processed = await processMarkdownEntry(absPath, 'posts', settings, { includeFiltered: true });
      const post = { ...processed.entry, sourcePath: r.sourcePath, sourceSite: r.sourceSite, bloggerMode: r.mode };
      // 以 artifact 自身之 builtAt 重放共用 renderer → 應逐字重現（證明真的走同一實作）。
      const direct = await renderBloggerPost(post, settings, {
        builtAt: meta.build.builtAt, outputDir: r.outputDir, projectRoot: tmpRoot,
      });
      const html = readFileSync(path.join(r.outputDir, 'post.html'), 'utf-8');
      assert.ok(html.endsWith(direct.html), 'post.html 之本體須逐字等於共用 renderer 之輸出');
      assert.strictEqual(direct.renderedKind, r.rendered);
    });

    await check('C8 renderer 非兩套：build-blogger.js 與 preview 皆 import blogger-render.js', async () => {
      const official = codeOf('build-blogger.js');
      const preview = codeOf('build-blogger-preview.js');
      for (const [name, code] of [['build-blogger.js', official], ['build-blogger-preview.js', preview]]) {
        assert.ok(code.includes("from './blogger-render.js'"), `${name} 須 import 共用 renderer`);
        assert.ok(code.includes('renderBloggerPost('), `${name} 須呼叫共用 renderBloggerPost`);
      }
      // 正式 build 不得再自帶一份 renderer 實作（否則就是兩套會漂移）。
      for (const dup of ['ejs.renderFile(', 'function buildMeta(', 'function renderFullPost(', 'blogger-post-full.ejs']) {
        assert.ok(!official.includes(dup), `build-blogger.js 不得保留重複 renderer 實作: ${dup}`);
      }
    });

    await check('C9 import 無 side effect：renderer 不含 write API / 不含 top-level main()', async () => {
      const code = codeOf('blogger-render.js');
      for (const banned of ['writeFile', 'mkdir', 'rmdir', 'appendFile', 'copyFile', 'createWriteStream', 'execSync', 'spawnSync', 'node:fs']) {
        assert.ok(!code.includes(banned), `renderer 不得含 fs / write / exec API: ${banned}`);
      }
      assert.ok(!/^main\(\)/m.test(code), 'renderer 不得於 top-level 執行 main()');
      assert.ok(!/^\s*await\s/m.test(code.split('\n').filter((l) => !l.startsWith(' ')).join('\n')),
        'renderer 不得有 top-level await 觸發工作');
    });

    await check('C10 import 無 side effect：子行程 import renderer 不建立任何 dist 目錄', async () => {
      const probe = path.join(tmpRoot, '_probe');
      await fs.mkdir(probe, { recursive: true });
      const url = 'file:///' + path.join(SCRIPTS_DIR, 'blogger-render.js').replace(/\\/g, '/');
      const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(url)}); process.stdout.write('IMPORT-OK');`], {
        cwd: probe, encoding: 'utf-8', timeout: 60000,
      });
      assert.strictEqual(r.status, 0, `import renderer 失敗: ${r.stderr}`);
      assert.ok(r.stdout.includes('IMPORT-OK'), 'import 未完成');
      assert.deepStrictEqual(await fs.readdir(probe), [], 'import renderer 不得建立任何目錄 / 檔案');
    });

    await check('C11 import 無 side effect：子行程 import preview builder 不觸發 build', async () => {
      const probe2 = path.join(tmpRoot, '_probe2');
      await fs.mkdir(probe2, { recursive: true });
      const url = 'file:///' + path.join(SCRIPTS_DIR, 'build-blogger-preview.js').replace(/\\/g, '/');
      const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(url)}); process.stdout.write('IMPORT-OK');`], {
        cwd: probe2, encoding: 'utf-8', timeout: 60000,
      });
      assert.strictEqual(r.status, 0, `import preview builder 失敗: ${r.stderr}`);
      assert.ok(r.stdout.includes('IMPORT-OK'));
      assert.deepStrictEqual(await fs.readdir(probe2), [], 'import builder 不得產生任何輸出');
    });

    await check('C12 failure 不留半成品：unsafe output root 被拒且未建立任何目錄', async () => {
      // 指向正式 dist-blogger/ —— 最重要的一條紅線（不可因 outputRoot 而污染正式產物）。
      const unsafeRoot = path.join(tmpRoot, 'dist-blogger');
      const r = await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: unsafeRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'unsafe-output-root');
      assert.ok(!existsSync(unsafeRoot), '被拒之 output root 不得被建立（連空目錄都不行）');
    });

    await check('C13 failure 不留半成品：成功後無 .staging 殘留', async () => {
      const r = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      assert.ok(!existsSync(path.join(outRoot, '.staging')), '.staging 不得殘留');
      const entries = (await fs.readdir(outRoot)).sort();
      assert.deepStrictEqual(entries, ['posts'], `preview root 只應有 posts/，實得 ${entries.join(',')}`);
      assert.ok(existsSync(r.outputDir));
    });

    await check('C14 atomic 落地：先 render 至記憶體、全成功才寫 staging → rename', async () => {
      const code = codeOf('build-blogger-preview.js');
      assert.ok(code.includes('fs.rename('), '須以 atomic rename 落地');
      assert.ok(code.includes("'.staging'"), '須先寫 staging dir');
      assert.ok(code.indexOf('renderBloggerPost(') < code.indexOf('fs.rename('),
        'render 必須先於任何寫入（失敗不留半成品）');
    });

    await check('C15 deterministic modulo builtAt：同 slug 重跑 byte-identical', async () => {
      const r1 = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      const read1 = Object.fromEntries(PREVIEW_PLANNED_FILES.map((f) => [f, readFileSync(path.join(r1.outputDir, f), 'utf-8')]));
      await new Promise((res) => setTimeout(res, 8));
      const r2 = ok(await buildBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot, outputRoot: outRoot }));
      const read2 = Object.fromEntries(PREVIEW_PLANNED_FILES.map((f) => [f, readFileSync(path.join(r2.outputDir, f), 'utf-8')]));
      assert.notStrictEqual(r1.builtAt, r2.builtAt, '兩次 builtAt 應不同，否則此測試無意義');
      for (const f of PREVIEW_PLANNED_FILES) {
        const n1 = read1[f].split(r1.builtAt).join('__T__');
        const n2 = read2[f].split(r2.builtAt).join('__T__');
        assert.strictEqual(n1, n2, `${f}：正規化 builtAt 後仍有非時間戳差異`);
      }
      // post.html 完全不含時間戳 → 應 raw byte-identical。
      assert.strictEqual(read1['post.html'], read2['post.html'], 'post.html 應完全 deterministic');
    });

    await check('C16 不執行任意 content-embedded script（EJS 樣板標記不得被求值）', async () => {
      const r = ok(await buildBloggerPreview({ slug: 'inject', projectRoot: tmpRoot, outputRoot: outRoot }));
      const html = readFileSync(path.join(r.outputDir, 'post.html'), 'utf-8');
      assert.ok(!html.includes('EJS_NOT_EVAL 42'), 'body 內 EJS 標記被求值（6*7 → 42）= 樣板注入');
      assert.ok(html.includes('EJS_NOT_EVAL'), 'body 應以資料形式輸出');
    });

    await check('C17 不讀 credential / secret：builder 與 renderer 不觸碰 env / token', async () => {
      for (const f of ['build-blogger-preview.js', 'blogger-render.js']) {
        const code = codeOf(f);
        for (const banned of ['process.env', 'OAuth', 'apiKey', 'api_key', 'accessToken', 'client_secret', 'credential']) {
          assert.ok(!code.includes(banned), `${f} 不得存取 credential / env: ${banned}`);
        }
      }
    });

    await check('C18 不呼叫 network：builder 與 renderer 無網路 / Blogger API', async () => {
      for (const f of ['build-blogger-preview.js', 'blogger-render.js']) {
        const code = codeOf(f);
        for (const banned of ['fetch(', 'node:https', 'node:http', 'googleapis', 'blogger.googleapis', 'axios', 'XMLHttpRequest']) {
          assert.ok(!code.includes(banned), `${f} 不得含網路 / API 呼叫: ${banned}`);
        }
      }
    });

    await check('C19 不猜 Blogger 身分：builder 不寫 bloggerPostId / publishedUrl / publishedAt', async () => {
      const code = codeOf('build-blogger-preview.js');
      for (const banned of ['bloggerPostId =', 'publishedUrl =', 'publishedAt =', 'bloggerBlogId']) {
        assert.ok(!code.includes(banned), `builder 不得指派 Blogger 身分欄位: ${banned}`);
      }
    });

    // ══ D. output root 安全閘 ═══════════════════════════════════════════════════
    await check('D1 output root 拒絕正式 dist-blogger/', async () => {
      const r = assertSafeOutputRoot(path.join(tmpRoot, 'dist-blogger'), tmpRoot);
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'unsafe-output-root');
      assert.ok(r.reason.includes('dist-blogger'));
      assert.strictEqual(assertSafeOutputRoot(path.join(tmpRoot, 'dist-blogger', 'posts'), tmpRoot).ok, false,
        '正式 dist 之子目錄亦須拒絕');
    });

    await check('D2 output root 拒絕 repository root', async () => {
      const r = assertSafeOutputRoot(tmpRoot, tmpRoot);
      assert.strictEqual(r.ok, false);
      assert.ok(r.reason.includes('repository root'));
    });

    await check('D3 output root 拒絕 repo 外路徑（非 OS temp）', async () => {
      const outside = process.platform === 'win32' ? 'C:\\Windows\\Temp\\evil' : '/var/evil';
      const r = assertSafeOutputRoot(outside, tmpRoot);
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'unsafe-output-root');
    });

    await check('D4 output root 拒絕 deploy clone / gh-pages', async () => {
      for (const p of [path.join(path.dirname(REPO_ROOT), 'portable-blog-deploy'), path.join(path.dirname(REPO_ROOT), 'gh-pages-out')]) {
        const r = assertSafeOutputRoot(p, REPO_ROOT);
        assert.strictEqual(r.ok, false, `deploy clone 未被拒絕: ${p}`);
        assert.strictEqual(r.error, 'unsafe-output-root');
      }
    });

    await check('D5 output root 拒絕非絕對路徑 / 空值 / repo 祖先目錄', async () => {
      assert.strictEqual(assertSafeOutputRoot('relative/dir', tmpRoot).ok, false);
      assert.strictEqual(assertSafeOutputRoot('', tmpRoot).ok, false);
      assert.strictEqual(assertSafeOutputRoot(path.dirname(tmpRoot), tmpRoot).ok, false, 'repo 祖先目錄須拒絕');
    });

    await check('D6 output root 拒絕其他 dist（dist / dist-promotion / dist-reports）', async () => {
      for (const d of ['dist', 'dist-promotion', 'dist-reports']) {
        const r = assertSafeOutputRoot(path.join(tmpRoot, d), tmpRoot);
        assert.strictEqual(r.ok, false, `${d} 未被拒絕`);
      }
    });

    await check('D7 output root 允許 canonical preview root', async () => {
      const r = assertSafeOutputRoot(path.join(tmpRoot, PREVIEW_DIST_REL), tmpRoot);
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.kind, 'canonical');
    });

    // ══ E. Formal build parity（結構性；byte 級 pre/post 比對於 phase 內以快照完成）══
    await check('E1 preview marker 不得滲入正式 build（build-blogger.js / renderer / 模板）', async () => {
      // JS：檢查**執行程式碼**（去註解）。註解永不進 build 產物，且說明邊界之註解屬正當文件。
      for (const f of ['build-blogger.js', 'blogger-render.js']) {
        const code = codeOf(f);
        assert.ok(!code.includes('PREVIEW-ONLY'), `${f} 不得含 preview marker`);
        assert.ok(!code.includes('NOT FOR DEPLOY'), `${f} 不得含 preview marker`);
        assert.ok(!code.includes(PREVIEW_DIST_REL), `${f} 不得引用 preview dist 路徑`);
      }
      // EJS 模板：檢查**原始內容** —— 模板註解可能被輸出至 HTML，故不得含 marker。
      const viewsDir = path.join(REPO_ROOT, 'src', 'views', 'blogger');
      for (const f of await fs.readdir(viewsDir)) {
        const s = readFileSync(path.join(viewsDir, f), 'utf-8');
        assert.ok(!s.includes('PREVIEW-ONLY') && !s.includes('NOT FOR DEPLOY'),
          `共用模板 ${f} 不得含 preview marker（會滲入正式 build）`);
      }
    });

    await check('E2 draft 不得滲入正式 dist-blogger/：正式 build 仍走 ready-only loader', async () => {
      const code = codeOf('build-blogger.js');
      assert.ok(code.includes('loadBloggerPosts('), '正式 build 須沿用 ready-only loader');
      assert.ok(!code.includes('includeFiltered'), '正式 build 不得使用 includeFiltered（會讓 draft 進正式 dist）');
      assert.ok(!code.includes('processMarkdownEntry'), '正式 build 不得繞過 loadBloggerPosts 直接組 entry');
      assert.ok(!code.includes('planBloggerPreview'), '正式 build 不得依賴 preview planner');
    });

    await check('E3 反 drift：classify 仍為真實 export 且 draft 恆被排除', async () => {
      assert.deepStrictEqual(classify({ status: 'draft', draft: true }), { include: false, reason: 'draft:true' });
      assert.deepStrictEqual(classify({ status: 'ready', draft: false }), { include: true, reason: 'ok' });
      assert.deepStrictEqual(classify({ status: 'archived', draft: false }), { include: false, reason: 'status:archived' });
    });

    await check('E4 load-posts additive option 預設關閉（正式 build 路徑逐字不變）', async () => {
      const settings = await loadSettings();
      const draftAbs = path.join(tmpRoot, 'content/blogger/posts/native-draft.md');
      // 預設（不傳 options）：與改動前完全相同 —— included:false 且**不**附 entry。
      const def = await processMarkdownEntry(draftAbs, 'posts', settings);
      assert.strictEqual(def.included, false);
      assert.strictEqual(def.entry, undefined, '預設路徑不得組裝 entry（正式 build 行為須逐字不變）');
      assert.strictEqual(def.filtered.reason, 'draft:true');
      // opt-in：附 entry，但 included 仍如實為 false（不放寬 classify）。
      const opt = await processMarkdownEntry(draftAbs, 'posts', settings, { includeFiltered: true });
      assert.strictEqual(opt.included, false, 'includeFiltered 不得把 draft 標成 included');
      assert.ok(opt.entry && typeof opt.entry === 'object', 'includeFiltered 須附 entry');
      assert.strictEqual(opt.entry.slug, 'native-draft');
      // ready 文章兩種呼叫方式結果一致。
      const readyAbs = path.join(tmpRoot, 'content/blogger/posts/native-ready.md');
      const r1 = await processMarkdownEntry(readyAbs, 'posts', settings);
      const r2 = await processMarkdownEntry(readyAbs, 'posts', settings, { includeFiltered: true });
      assert.strictEqual(r1.included, true);
      assert.strictEqual(r2.included, true);
      assert.strictEqual(JSON.stringify(r1.entry), JSON.stringify(r2.entry), 'ready 文章不得因 option 而不同');
    });

    await check('E5 package.json：兩支 script 皆註冊且指向正確檔案', async () => {
      const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'));
      assert.strictEqual(pkg.scripts['build:blogger-preview'], 'node src/scripts/build-blogger-preview.js');
      assert.strictEqual(pkg.scripts['check:build-blogger-preview'], 'node src/scripts/check-build-blogger-preview.js');
      // 正式 build script 未被改動。
      assert.strictEqual(pkg.scripts['build:blogger'], 'node src/scripts/build-blogger.js');
      // preview 不得混入任何 readiness / release umbrella。
      for (const u of ['check:phase1-readiness', 'check:release-readiness', 'check:metadata-all']) {
        assert.ok(!pkg.scripts[u].includes('blogger-preview'), `${u} 不得納入 preview 工具`);
      }
    });

    await check('E6 .gitignore：dist-blogger-preview/ 已忽略且未影響正式 dist-blogger 規則', async () => {
      const gi = readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf-8');
      const lines = gi.split('\n').map((l) => l.trim());
      assert.ok(lines.includes('dist-blogger-preview/'), '.gitignore 須忽略 dist-blogger-preview/');
      assert.ok(lines.includes('dist-blogger/*'), '正式 dist-blogger 忽略規則不得被改動');
      assert.ok(lines.includes('!dist-blogger/.gitkeep'), 'dist-blogger/.gitkeep 例外不得被改動');
    });
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
    console.log('  cleanup: temp dir removed');
  }

  console.log('');
  console.log(`build-blogger-preview contract guard: ${pass} / ${fail}`);
  if (fail > 0) {
    console.log('');
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[check-build-blogger-preview] crashed: ${err && err.stack ? err.stack : err}`);
  process.exit(2);
});
