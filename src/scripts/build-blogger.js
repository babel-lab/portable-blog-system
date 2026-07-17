#!/usr/bin/env node
// Blogger 正式 build（**ready-only**；輸出 dist-blogger/）。
//
// 本檔職責 = **orchestration only**：
//   載入 settings → 載入 Blogger posts（ready-only 過濾）→ validate → 逐篇呼叫共用 renderer →
//   寫入 dist-blogger/ → 產索引（blogger-home / category-*）→ 寫 build-manifest.json。
//
// Phase 20260717-B2-c：單篇 render 之純邏輯已抽至 `blogger-render.js`，與 draft-aware preview
//   builder（build-blogger-preview.js）**共用同一份 implementation**，避免第二套會漂移的 Blogger
//   HTML renderer。本次抽出為 **行為保持**：dist-blogger/ 輸出經 pre/post 快照比對為
//   byte-identical modulo builtAt（見 docs/20260717-blogger-preview-artifact-builder-b2-phase-c.md §7）。
//
// 紅線（CLAUDE.md §23）：draft **不得**進正式 dist。
//   內容選擇之唯一事實來源仍為 loadBloggerPosts → loadPosts → classify（本檔不另抄規格、不放寬）。
//   共用 renderer 對「誰該被 render」無意見；ready-only 過濾完全發生在本檔這一層。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSettings } from './load-settings.js';
import { loadBloggerPosts } from './load-blogger-posts.js';
import { validateContent, printWarnings } from './validate-content.js';
import { renderBloggerPost, renderHomeIndex, renderCategoryIndex } from './blogger-render.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist-blogger');
const POSTS_DIR = path.join(DIST_DIR, 'posts');
const MANIFEST_FILE = path.join(DIST_DIR, 'build-manifest.json');

const rel = (p) => path.relative(PROJECT_ROOT, p).split(path.sep).join('/');

function parseMode(argv) {
  const flag = argv.find((a) => a.startsWith('--mode='));
  if (!flag) return 'build';
  return flag.split('=')[1] || 'build';
}

async function writeText(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf-8');
}

async function writeJson(file, data) {
  await writeText(file, JSON.stringify(data, null, 2) + '\n');
}

async function main() {
  const startedAt = new Date();
  const mode = parseMode(process.argv.slice(2));

  console.log(`[build-blogger] mode=${mode}`);

  const settings = await loadSettings();
  // Phase 8-f-2-b：plumbing — settings 經 loadBloggerPosts 轉發至內部 loadPosts → processMarkdownEntry
  const blogger = await loadBloggerPosts({ settings });

  console.log(
    `[build-blogger] sources scanned: blogger=${blogger.bySource.blogger.scanned}, github-cross=${blogger.bySource.githubCross.scanned}`,
  );
  console.log(
    `[build-blogger]   blogger source: ${blogger.bySource.blogger.ready} ready / ${blogger.bySource.blogger.filtered} filtered`,
  );
  console.log(
    `[build-blogger]   github-cross source: ${blogger.bySource.githubCross.ready} ready / ${blogger.bySource.githubCross.filtered} filtered`,
  );
  console.log(
    `[build-blogger] total ready: ${blogger.totalReady} / total filtered: ${blogger.totalFiltered}`,
  );

  for (const f of blogger.filteredOut) {
    console.log(`[build-blogger]   filtered: ${f.sourcePath} (${f.reason})`);
  }

  const validate = validateContent({ posts: blogger.posts, settings });
  printWarnings(validate.warnings);

  const builtAtIso = startedAt.toISOString();
  const postsManifest = [];
  const indexPosts = [];
  for (const post of blogger.posts) {
    const outputDir = path.join(POSTS_DIR, post.slug);
    const outputFile = path.join(outputDir, 'post.html');
    const metaFile = path.join(outputDir, 'meta.json');
    // Phase 3-e-5：copy-helper.txt + publish-checklist.txt
    const copyHelperFile = path.join(outputDir, 'copy-helper.txt');
    const publishChecklistFile = path.join(outputDir, 'publish-checklist.txt');

    // Phase 20260717-B2-c：單篇 render 全數委派共用 renderer（canonical / SEO / mode dispatch /
    //   meta / copy-helper / publish-checklist）。renderer 回傳字串、不寫檔；寫檔為本檔之責。
    const rendered = await renderBloggerPost(post, settings, {
      builtAt: builtAtIso,
      outputDir,
      projectRoot: PROJECT_ROOT,
    });
    const { canonical, html, renderedKind, meta, copyHelperText, publishChecklistText } = rendered;

    if (canonical.warning) blogger.warnings.push(canonical.warning);

    await writeText(outputFile, html);
    console.log(`[build-blogger] wrote ${rel(outputFile)} (${renderedKind})`);

    await writeJson(metaFile, meta);
    console.log(`[build-blogger] wrote ${rel(metaFile)}`);

    await writeText(copyHelperFile, copyHelperText);
    await writeText(publishChecklistFile, publishChecklistText);
    console.log(`[build-blogger] wrote ${rel(copyHelperFile)}`);
    console.log(`[build-blogger] wrote ${rel(publishChecklistFile)}`);

    postsManifest.push({
      slug: post.slug,
      title: post.title ?? null,
      bloggerMode: post.bloggerMode,
      sourceSite: post.sourceSite,
      sourcePath: post.sourcePath,
      outputDir: rel(outputDir).replace(/\\/g, '/') + '/',
      rendered: renderedKind,
      metaFile: rel(metaFile).replace(/\\/g, '/'),
      copyHelperFile: rel(copyHelperFile).replace(/\\/g, '/'),
      publishChecklistFile: rel(publishChecklistFile).replace(/\\/g, '/'),
    });

    // Phase 3-e-6 / 8-d-3c-8-a：收集索引資料（in-memory）
    indexPosts.push({
      slug: post.slug,
      title: post.title ?? null,
      description: post.description ?? null,
      category: post.category ?? null,
      date: post.date ?? null,
      bloggerMode: post.bloggerMode,
      canonicalResolved: canonical.url,
      bloggerPublishedUrl: post.blogger?.publishedUrl || null,
      normalized: post.normalized ?? null,
    });
  }

  // Phase 3-e-6：依分類分組（用 settings.categories 解析名稱）
  const findCategory = (ref) =>
    settings.categories?.find((c) => c.id === ref) ||
    settings.categories?.find((c) => c.slug === ref) ||
    null;

  const groupedByCategory = {};
  for (const p of indexPosts) {
    const cat = findCategory(p.category) || {
      slug: p.category || 'uncategorized',
      name: p.category || 'Uncategorized',
    };
    if (!groupedByCategory[cat.slug]) {
      groupedByCategory[cat.slug] = { categoryName: cat.name, slug: cat.slug, posts: [] };
    }
    groupedByCategory[cat.slug].posts.push(p);
  }

  // Phase 3-e-6：產出 blogger-home.html（即使 0 ready post 仍輸出空狀態）
  const homeFile = path.join(DIST_DIR, 'index', 'blogger-home.html');
  const homeHtml = await renderHomeIndex({
    siteName: settings.site?.siteName ?? 'Portable Blog System',
    posts: indexPosts,
    groupedByCategory,
    builtAt: builtAtIso,
  });
  await writeText(homeFile, homeHtml);
  console.log(`[build-blogger] wrote ${rel(homeFile)}`);

  // Phase 3-e-6：產出每個有 ready post 的分類索引
  const categoryFiles = [];
  for (const slug of Object.keys(groupedByCategory)) {
    const group = groupedByCategory[slug];
    const file = path.join(DIST_DIR, 'index', `category-${slug}.html`);
    const html = await renderCategoryIndex({
      categoryName: group.categoryName,
      slug,
      posts: group.posts,
      builtAt: builtAtIso,
    });
    await writeText(file, html);
    console.log(`[build-blogger] wrote ${rel(file)}`);
    categoryFiles.push({
      slug,
      name: group.categoryName,
      file: rel(file).replace(/\\/g, '/'),
      count: group.posts.length,
    });
  }

  for (const w of blogger.warnings) {
    console.log(`[build-blogger]   warning: ${w}`);
  }

  const manifest = {
    buildAt: startedAt.toISOString(),
    mode,
    site: 'blogger',
    totals: {
      scanned: blogger.totalScanned,
      ready: blogger.totalReady,
      filtered: blogger.totalFiltered,
      warnings: blogger.warnings.length + validate.warnings.length,
    },
    bySource: blogger.bySource,
    posts: postsManifest,
    filteredOut: blogger.filteredOut,
    warnings: blogger.warnings,
    indexFiles: {
      home: rel(homeFile).replace(/\\/g, '/'),
      categories: categoryFiles,
    },
  };
  await writeJson(MANIFEST_FILE, manifest);
  console.log(`[build-blogger] wrote ${rel(MANIFEST_FILE)}`);

  const elapsed = Date.now() - startedAt.getTime();
  console.log(`[build-blogger] done in ${elapsed}ms`);
}

main().catch((err) => {
  console.error('[build-blogger] failed:', err);
  process.exit(1);
});
