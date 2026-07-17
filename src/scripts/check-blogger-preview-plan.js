#!/usr/bin/env node
// Phase 20260717-B2-a：blogger-preview-plan（draft-aware preview target planner）contract guard / tests。
//
// 範圍 / 邊界：
//   - 全部斷言在 **OS temp 目錄** 之 synthetic fixture tree 上跑；**絕不**碰 production content /
//     dist / settings / gh-pages；temp 目錄於 finally{} 清除。
//   - 只 import 被測模組（blogger-preview-plan.js）之唯讀 API + node 讀取 API；**不** build / deploy /
//     commit / push / 寫 production 檔。唯一 write = 自己的 temp fixtures（隔離、finally 清除）。
//   - 不呼叫 Blogger / Google API；不需網路；不需 credential。
//
// 覆蓋（per docs/20260710-blogger-preview-only-script-preanalysis.md §8 forbidden / §9 gates / §11.2）：
//   - draft-aware：draft slug 可解析（B1 結構上做不到）；officialBuild.includes=false + reason=draft:true。
//   - ready slug：officialBuild.includes=true + reason=ok。
//   - blogger-native / github-cross enabled / github-cross disabled（not-a-blogger-target hard-fail）。
//   - mode 解析：frontmatter 有效值 / 缺漏 / 無效值 → 預設 full（與正式 build 一致）+ note。
//   - zero-write：跑 planner 後 fixture tree 之檔案內容 + mtime 不變；dist-blogger-preview/ 未被建立。
//   - write flag 明確拒絕（hard-fail exit≠0，非靜默忽略）；unknown-arg 拒絕；slug 缺漏拒絕。
//   - Phase A 解析透傳：not-found / not-unique / invalid-slug。
//   - determinism：同輸入兩次結果 byte-identical。
//   - 邊界旗標：dryRun/written/writePathImplemented/touchesOfficialDist 恆為預期值。
//   - 反 drift：VALID_BLOGGER_MODES 為 load-blogger-posts.js 之真實 export；classify 為真實 export。
//   - source no-write 契約：本 planner 原始碼不得含 writeFile / mkdir / rm 等 write API。
//
// 執行：`npm run check:blogger-preview-plan`（或 `node src/scripts/check-blogger-preview-plan.js`）。

import assert from 'node:assert';
import fs from 'node:fs/promises';
import { statSync, readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  planBloggerPreview,
  resolveBloggerPreviewTarget,
  formatPreviewPlan,
  runCli,
  exitCodeForError,
  PREVIEW_DIST_REL,
  PREVIEW_MARKER,
  PREVIEW_PLANNED_FILES,
} from './blogger-preview-plan.js';
import { VALID_BLOGGER_MODES } from './load-blogger-posts.js';
import { classify } from './load-posts.js';

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

// ── fixture helpers ──────────────────────────────────────────────────────────────
function fm(fields) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) lines.push(`${k}: ${v}`);
  lines.push('---', '', 'body text — 本文不應被 planner 讀取或輸出。', '');
  return lines.join('\n');
}

async function writeFixture(root, rel, content) {
  const abs = path.join(root, ...rel.split('/'));
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, 'utf-8');
  return abs;
}

async function main() {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'blogger-preview-plan-'));
  console.log(`  fixture root: ${tmpRoot}`);

  try {
    // blogger-native ready 文章
    await writeFixture(tmpRoot, 'content/blogger/posts/native-ready.md', fm({
      id: '"f-native-ready"',
      slug: '"native-ready"',
      title: '"Native ready post"',
      status: '"ready"',
      draft: 'false',
    }));

    // blogger-native draft 文章（B2 核心情境）
    await writeFixture(tmpRoot, 'content/blogger/posts/native-draft.md', fm({
      id: '"f-native-draft"',
      slug: '"native-draft"',
      title: '"Native draft post"',
      status: '"draft"',
      draft: 'true',
    }));

    // github-cross，blogger enabled + mode summary
    await writeFixture(tmpRoot, 'content/github/posts/cross-enabled.md', fm({
      id: '"f-cross-enabled"',
      slug: '"cross-enabled"',
      title: '"Cross enabled post"',
      status: '"ready"',
      draft: 'false',
      publishTargets: '{ github: { enabled: true, mode: "full" }, blogger: { enabled: true, mode: "summary" } }',
    }));

    // github-cross，blogger disabled → not-a-blogger-target
    await writeFixture(tmpRoot, 'content/github/posts/cross-disabled.md', fm({
      id: '"f-cross-disabled"',
      slug: '"cross-disabled"',
      title: '"Cross disabled post"',
      status: '"ready"',
      draft: 'false',
      publishTargets: '{ github: { enabled: true, mode: "full" }, blogger: { enabled: false, mode: "summary" } }',
    }));

    // github-cross draft + blogger enabled + 無效 mode → 預設 full
    await writeFixture(tmpRoot, 'content/github/posts/cross-draft-badmode.md', fm({
      id: '"f-cross-draft-badmode"',
      slug: '"cross-draft-badmode"',
      title: '"Cross draft bad mode"',
      status: '"draft"',
      draft: 'true',
      publishTargets: '{ blogger: { enabled: true, mode: "teleport" } }',
    }));

    // github-cross enabled 但 mode 缺漏 → 預設 full
    await writeFixture(tmpRoot, 'content/github/posts/cross-nomode.md', fm({
      id: '"f-cross-nomode"',
      slug: '"cross-nomode"',
      title: '"Cross no mode"',
      status: '"ready"',
      draft: 'false',
      publishTargets: '{ blogger: { enabled: true } }',
    }));

    // duplicate slug（兩 root 各一）→ not-unique
    await writeFixture(tmpRoot, 'content/blogger/posts/dupe.md', fm({
      id: '"f-dupe-b"', slug: '"dupe"', title: '"Dupe blogger"', status: '"ready"', draft: 'false',
    }));
    await writeFixture(tmpRoot, 'content/github/posts/dupe.md', fm({
      id: '"f-dupe-g"', slug: '"dupe"', title: '"Dupe github"', status: '"ready"', draft: 'false',
      publishTargets: '{ blogger: { enabled: true, mode: "full" } }',
    }));

    // ── 1. draft-aware：draft slug 可解析（B1 做不到）────────────────────────────
    await check('draft slug resolvable — planner 可解析 draft（B1 結構上無法）', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true, `expected ok, got ${JSON.stringify(r)}`);
      assert.strictEqual(r.plan.slug, 'native-draft');
      assert.strictEqual(r.plan.previewBuild.draftAware, true);
    });

    await check('draft slug — officialBuild.includes=false + reason=draft:true', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.officialBuild.includes, false);
      assert.strictEqual(r.plan.officialBuild.reason, 'draft:true');
      assert.strictEqual(r.plan.officialBuild.distDir, null, 'draft 不得指向正式 dist 路徑');
    });

    await check('draft slug — current.status/draft 如實回報', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      assert.deepStrictEqual(r.plan.current, { status: 'draft', draft: true });
    });

    // ── 2. ready slug ─────────────────────────────────────────────────────────
    await check('ready slug — officialBuild.includes=true + reason=ok + distDir', async () => {
      const r = await planBloggerPreview({ slug: 'native-ready', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.plan.officialBuild.includes, true);
      assert.strictEqual(r.plan.officialBuild.reason, 'ok');
      assert.strictEqual(r.plan.officialBuild.distDir, 'dist-blogger/posts/native-ready');
    });

    // ── 3. sourceSite 判定 ────────────────────────────────────────────────────
    await check('blogger-native → sourceSite=blogger', async () => {
      const r = await planBloggerPreview({ slug: 'native-ready', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.sourceSite, 'blogger');
      assert.strictEqual(r.plan.contentRoot, 'blogger');
    });

    await check('github-cross enabled → sourceSite=github-cross', async () => {
      const r = await planBloggerPreview({ slug: 'cross-enabled', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.plan.sourceSite, 'github-cross');
      assert.strictEqual(r.plan.contentRoot, 'github');
    });

    await check('github-cross disabled → not-a-blogger-target hard-fail (exit 8)', async () => {
      const r = await planBloggerPreview({ slug: 'cross-disabled', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'not-a-blogger-target');
      assert.strictEqual(exitCodeForError(r.error), 8, 'hard-fail 須有非 0 exit code');
    });

    // ── 4. mode 解析 ──────────────────────────────────────────────────────────
    await check('mode 有效值 → 採用 frontmatter（summary）', async () => {
      const r = await planBloggerPreview({ slug: 'cross-enabled', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.previewBuild.mode, 'summary');
      assert.strictEqual(r.plan.previewBuild.modeSource, 'frontmatter');
    });

    await check('mode 缺漏 → 預設 full + modeSource=default', async () => {
      const r = await planBloggerPreview({ slug: 'cross-nomode', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.previewBuild.mode, 'full');
      assert.strictEqual(r.plan.previewBuild.modeSource, 'default');
      assert.ok(r.plan.notes.some((n) => n.includes('缺漏')), 'note 須說明 mode 缺漏');
    });

    await check('mode 無效值 → 預設 full + note 指出無效值', async () => {
      const r = await planBloggerPreview({ slug: 'cross-draft-badmode', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.previewBuild.mode, 'full');
      assert.strictEqual(r.plan.previewBuild.modeSource, 'default');
      assert.ok(r.plan.notes.some((n) => n.includes('teleport')), 'note 須指出無效值');
    });

    await check('draft + github-cross 同時成立時仍 draft-aware', async () => {
      const r = await planBloggerPreview({ slug: 'cross-draft-badmode', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true);
      assert.strictEqual(r.plan.sourceSite, 'github-cross');
      assert.strictEqual(r.plan.officialBuild.includes, false);
      assert.strictEqual(r.plan.officialBuild.reason, 'draft:true');
    });

    // ── 5. 輸出路徑 / marker ──────────────────────────────────────────────────
    await check('previewBuild.outputDir 落在 dist-blogger-preview/ 且不碰正式 dist-blogger/', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.previewBuild.outputDir, `${PREVIEW_DIST_REL}/posts/native-draft`);
      assert.ok(r.plan.previewBuild.outputDir.startsWith('dist-blogger-preview/'));
      for (const w of r.plan.wouldWrite) {
        assert.ok(w.startsWith('dist-blogger-preview/'), `wouldWrite 不得逸出 preview dist: ${w}`);
        assert.ok(!/^dist-blogger\//.test(w), `wouldWrite 不得指向正式 dist-blogger/: ${w}`);
        assert.ok(!w.startsWith('dist/'), `wouldWrite 不得指向 GitHub Pages dist/: ${w}`);
      }
    });

    await check('preview marker = PREVIEW-ONLY / NOT FOR DEPLOY', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.previewBuild.marker, PREVIEW_MARKER);
      assert.strictEqual(PREVIEW_MARKER, 'PREVIEW-ONLY / NOT FOR DEPLOY');
    });

    await check('planned files = post.html / copy-helper.txt / meta.json（publish-checklist 刻意省略）', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      assert.deepStrictEqual(r.plan.previewBuild.files, ['post.html', 'copy-helper.txt', 'meta.json']);
      assert.ok(!r.plan.previewBuild.files.includes('publish-checklist.txt'),
        'preview 不應產 publish-checklist（避免誘導正式發布）');
      assert.deepStrictEqual([...PREVIEW_PLANNED_FILES], r.plan.previewBuild.files);
    });

    // ── 6. 邊界旗標 ───────────────────────────────────────────────────────────
    await check('邊界旗標：dryRun/written/writePathImplemented/touchesOfficialDist', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      assert.strictEqual(r.plan.dryRun, true);
      assert.strictEqual(r.plan.written, false);
      assert.strictEqual(r.plan.writePathImplemented, false, '本切片無 write path');
      assert.strictEqual(r.plan.touchesOfficialDist, false);
    });

    // ── 7. zero-write（內容 + mtime + 目錄未建立）─────────────────────────────
    await check('zero-write：fixture 檔案內容與 mtime 不變', async () => {
      const target = path.join(tmpRoot, 'content', 'blogger', 'posts', 'native-draft.md');
      const before = readFileSync(target, 'utf-8');
      const beforeM = statSync(target).mtimeMs;
      await new Promise((r) => setTimeout(r, 12));
      await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      await planBloggerPreview({ slug: 'native-ready', projectRoot: tmpRoot });
      assert.strictEqual(readFileSync(target, 'utf-8'), before, 'source 內容被改動');
      assert.strictEqual(statSync(target).mtimeMs, beforeM, 'source mtime 被改動');
    });

    await check('zero-write：dist-blogger-preview/ 與 dist-blogger/ 未於 fixture root 被建立', async () => {
      await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      assert.ok(!existsSync(path.join(tmpRoot, 'dist-blogger-preview')), 'planner 不得建立 preview dist');
      assert.ok(!existsSync(path.join(tmpRoot, 'dist-blogger')), 'planner 不得建立正式 dist');
    });

    await check('source no-write 契約：planner 原始碼不含 write API', async () => {
      const src = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'blogger-preview-plan.js'), 'utf-8');
      const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
      for (const banned of ['writeFile', 'mkdir', 'rmdir', 'appendFile', 'copyFile', 'createWriteStream', 'execSync', 'spawnSync']) {
        assert.ok(!code.includes(banned), `planner 不得含 write/exec API: ${banned}`);
      }
    });

    await check('no-network / no-API 契約：planner 原始碼不含網路或 Blogger API 呼叫', async () => {
      const src = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'blogger-preview-plan.js'), 'utf-8');
      const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
      for (const banned of ['fetch(', 'node:https', 'node:http', 'googleapis', 'blogger.googleapis', 'OAuth', 'apiKey']) {
        assert.ok(!code.includes(banned), `planner 不得含網路 / API token: ${banned}`);
      }
    });

    // ── 8. CLI：write flag / arg 拒絕 ─────────────────────────────────────────
    for (const flag of ['--apply', '--write', '--build', '--deploy', '--push', '--publish', '--save', '--output', '--force']) {
      await check(`CLI 明確拒絕 write flag ${flag}（hard-fail exit 2；非靜默忽略）`, async () => {
        const r = await runCli({ argv: ['--slug=native-draft', flag], projectRoot: tmpRoot });
        assert.strictEqual(r.exit, 2, `${flag} 須 hard-fail`);
        assert.strictEqual(r.result.error, 'write-flag-not-supported');
        assert.ok(r.stdout.includes('write-flag-not-supported') || r.stdout.includes('不受支援'),
          'stdout 須說明拒絕原因');
      });
    }

    await check('CLI 拒絕 --apply=true（帶值形式亦拒絕）', async () => {
      const r = await runCli({ argv: ['--slug=native-draft', '--apply=true'], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 2);
      assert.strictEqual(r.result.error, 'write-flag-not-supported');
    });

    await check('CLI 拒絕 unknown-arg（exit 2）', async () => {
      const r = await runCli({ argv: ['--slug=native-draft', '--wat'], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 2);
      assert.strictEqual(r.result.error, 'unknown-arg');
    });

    await check('CLI 要求 --slug（不支援「全部」模式；exit 2）', async () => {
      const r = await runCli({ argv: [], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 2);
      assert.strictEqual(r.result.error, 'slug-arg-missing');
    });

    await check('CLI 接受 --dry-run（本工具唯一模式）', async () => {
      const r = await runCli({ argv: ['--slug=native-draft', '--dry-run'], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 0);
      assert.strictEqual(r.result.plan.dryRun, true);
    });

    await check('CLI happy-path exit 0 + stdout 含 dry-run 邊界宣告', async () => {
      const r = await runCli({ argv: ['--slug=native-draft'], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 0);
      assert.ok(r.stdout.includes('dry-run only'), 'stdout 須宣告 dry-run only');
      assert.ok(r.stdout.includes('NO file written'), 'stdout 須宣告未寫檔');
    });

    await check('CLI --json 輸出可解析且含邊界旗標', async () => {
      const r = await runCli({ argv: ['--slug=native-draft', '--json'], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 0);
      const parsed = JSON.parse(r.stdout);
      assert.strictEqual(parsed.ok, true);
      assert.strictEqual(parsed.plan.written, false);
      assert.strictEqual(parsed.plan.dryRun, true);
    });

    await check('CLI --site 過濾可解 duplicate slug', async () => {
      const dup = await runCli({ argv: ['--slug=dupe'], projectRoot: tmpRoot });
      assert.strictEqual(dup.exit, 5, 'duplicate slug 須 not-unique(5)');
      assert.strictEqual(dup.result.error, 'not-unique');
      const ok = await runCli({ argv: ['--slug=dupe', '--site=blogger'], projectRoot: tmpRoot });
      assert.strictEqual(ok.exit, 0, '--site 指定後應唯一');
      assert.strictEqual(ok.result.plan.contentRoot, 'blogger');
    });

    // ── 9. Phase A 錯誤透傳 ───────────────────────────────────────────────────
    await check('not-found 透傳（exit 4）', async () => {
      const r = await runCli({ argv: ['--slug=no-such-slug'], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 4);
      assert.strictEqual(r.result.error, 'not-found');
    });

    await check('invalid-slug 透傳（exit 3）', async () => {
      const r = await runCli({ argv: ['--slug=../etc/passwd'], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 3);
      assert.strictEqual(r.result.error, 'invalid-slug');
    });

    await check('invalid-project-root hard-fail（exit 1）', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: 'relative/path' });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'invalid-project-root');
      assert.strictEqual(exitCodeForError(r.error), 1);
    });

    // ── 10. determinism ───────────────────────────────────────────────────────
    await check('determinism：同輸入兩次 JSON byte-identical', async () => {
      const a = await planBloggerPreview({ slug: 'cross-enabled', projectRoot: tmpRoot });
      const b = await planBloggerPreview({ slug: 'cross-enabled', projectRoot: tmpRoot });
      assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
      assert.strictEqual(formatPreviewPlan(a), formatPreviewPlan(b));
    });

    await check('輸出不含 body 內容', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      const blob = JSON.stringify(r) + formatPreviewPlan(r);
      assert.ok(!blob.includes('body text'), 'plan 不得洩漏 body');
    });

    // ── 11. 反 drift：真實 export 而非另抄規格 ────────────────────────────────
    await check('反 drift：VALID_BLOGGER_MODES 為 load-blogger-posts.js 之真實 export', async () => {
      assert.ok(VALID_BLOGGER_MODES instanceof Set);
      assert.deepStrictEqual([...VALID_BLOGGER_MODES].sort(), ['full', 'redirect-card', 'summary']);
    });

    await check('反 drift：officialBuild 判定與真實 classify 一致', async () => {
      const r = await planBloggerPreview({ slug: 'native-draft', projectRoot: tmpRoot });
      const truth = classify({ status: 'draft', draft: true });
      assert.strictEqual(r.plan.officialBuild.includes, truth.include);
      assert.strictEqual(r.plan.officialBuild.reason, truth.reason);
    });

    await check('resolveBloggerPreviewTarget 為純函式（不需 fs；輸入非物件 hard-fail）', async () => {
      const bad = resolveBloggerPreviewTarget(null);
      assert.strictEqual(bad.ok, false);
      assert.strictEqual(bad.error, 'invalid-article');
      const good = resolveBloggerPreviewTarget({
        contentRoot: 'blogger',
        publishTargets: { blogger: { enabled: true, mode: 'full' } },
      });
      assert.strictEqual(good.ok, true);
      assert.strictEqual(good.target.sourceSite, 'blogger');
    });

    // ── 12. production content 未被碰觸（真實 repo root；唯讀）────────────────
    await check('production 契約：真實 repo 之 dist-blogger-preview/ 未被本 guard 建立', async () => {
      assert.ok(!existsSync(path.join(REPO_ROOT, PREVIEW_DIST_REL)),
        '本切片不得建立 dist-blogger-preview/（write path 屬後續 phase）');
    });
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
    console.log('  cleanup: temp dir removed');
  }

  console.log('');
  console.log(`blogger-preview-plan contract guard: ${pass} / ${fail}`);
  if (fail > 0) {
    console.log('');
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[check-blogger-preview-plan] crashed: ${err && err.stack ? err.stack : err}`);
  process.exit(2);
});
