#!/usr/bin/env node
// Phase 3-e-1：Blogger build 骨架
// 範圍：讀取兩個 source、過濾、建立 dist-blogger/posts/{slug}/ + post.html placeholder
// 不實作 full / summary / redirect-card HTML 模板內容（屬 3-e-2 起）
// 不寫 meta.json / copy-helper.txt / publish-checklist.txt（屬 3-e-4 / 3-e-5）

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

import { loadSettings } from './load-settings.js';
import { loadBloggerPosts } from './load-blogger-posts.js';
import { validateContent, printWarnings } from './validate-content.js';
import { renderBody } from './parse-markdown.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist-blogger');
const POSTS_DIR = path.join(DIST_DIR, 'posts');
const VIEWS_DIR = path.join(PROJECT_ROOT, 'src', 'views');
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

function placeholderHtml(post) {
  return `<!--
  Portable Blog System - Blogger Post (placeholder)
  Phase 3-e-1: 骨架階段；HTML 模板內容將於 Phase 3-e-2 起依 mode 補齊
  slug: ${post.slug}
  title: ${post.title ?? '(no title)'}
  mode: ${post.bloggerMode}
  sourceSite: ${post.sourceSite}
  sourcePath: ${post.sourcePath}
-->
`;
}

async function renderFullPost(post) {
  const bodyHtml = renderBody(post.body || '');
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-post-full.ejs'),
    { post: { ...post, bodyHtml } },
    { async: true },
  );
}

// Phase 3-e-3：UTM helper（CLAUDE.md §16.4 blogger→github 導流）
function buildBloggerToGithubUrl(rawUrl, slug) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('utm_source', 'blogger');
    url.searchParams.set('utm_medium', 'internal_referral');
    url.searchParams.set('utm_campaign', 'blogger_to_github');
    url.searchParams.set('utm_content', slug);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

// Phase 3-e-3：canonical URL 解析（含 fallback）
function resolveCanonicalUrl(post, settings) {
  const raw = post.canonical;
  let absolute = null;
  if (raw && raw !== 'auto') {
    absolute = raw;
  } else if (settings.site?.githubSiteUrl) {
    const base = settings.site.githubSiteUrl.replace(/\/$/, '');
    absolute = `${base}/posts/${post.slug}/`;
  }
  if (!absolute) {
    return {
      url: null,
      warning: `post slug="${post.slug}": 無法解析 canonical URL（frontmatter canonical 缺漏且 site.githubSiteUrl 未設）`,
    };
  }
  return { url: buildBloggerToGithubUrl(absolute, post.slug), warning: null };
}

async function renderSummaryPost(post, canonicalUrl) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-post-summary.ejs'),
    { post, canonicalUrl },
    { async: true },
  );
}

async function renderRedirectCardPost(post, canonicalUrl) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-redirect-card.ejs'),
    { post, canonicalUrl },
    { async: true },
  );
}

// Phase 3-e-6：blogger-home.html（全站索引、依分類分組）
async function renderHomeIndex(data) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-home-index.ejs'),
    data,
    { async: true },
  );
}

// Phase 3-e-6：category-{slug}.html（每分類一份）
async function renderCategoryIndex(data) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-category-index.ejs'),
    data,
    { async: true },
  );
}

// Phase 3-e-5：copy-helper.txt（純文字、可逐區複製到 Blogger 後台）
async function renderCopyHelper(post, canonical, meta) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-copy-helper.ejs'),
    { post, canonical, meta },
    { async: true },
  );
}

// Phase 3-e-5：publish-checklist.txt（mode-aware checkbox 清單）
async function renderPublishChecklist(post, canonical, meta) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-publish-checklist.ejs'),
    { post, canonical, meta },
    { async: true },
  );
}

// Phase 3-e-4：每篇 post 對應 meta.json（uniform schema、缺漏填 null）
function buildMeta(post, { renderedKind, canonical, builtAt, outputDir }) {
  return {
    id: post.id ?? null,
    slug: post.slug,
    title: post.title ?? null,
    titleEn: post.titleEn ?? null,
    type: post.type ?? null,
    primaryPlatform: post.primaryPlatform ?? null,

    sourceSite: post.sourceSite,
    sourcePath: post.sourcePath,

    date: post.date ?? null,
    updated: post.updated ?? null,
    author: post.author ?? null,

    category: post.category ?? null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    description: post.description ?? null,
    searchDescription: post.searchDescription ?? null,

    cover: post.cover ?? null,
    coverAlt: post.coverAlt ?? null,

    status: post.status ?? null,
    draft: post.draft ?? null,

    bloggerMode: post.bloggerMode,
    rendered: renderedKind,

    publishTargets: post.publishTargets ?? null,

    canonical: {
      raw: post.canonical ?? null,
      resolved: canonical.url,
      warning: canonical.warning,
    },

    blocks: post.blocks ?? null,
    book: post.book ?? null,
    affiliate: post.affiliate ?? null,
    download: post.download ?? null,

    bloggerPublish: post.blogger ?? null,

    build: {
      builtAt,
      outputDir: rel(outputDir).replace(/\\/g, '/') + '/',
      postFile: rel(path.join(outputDir, 'post.html')).replace(/\\/g, '/'),
      metaFile: rel(path.join(outputDir, 'meta.json')).replace(/\\/g, '/'),
    },
  };
}

async function main() {
  const startedAt = new Date();
  const mode = parseMode(process.argv.slice(2));

  console.log(`[build-blogger] mode=${mode}`);

  const settings = await loadSettings();
  const blogger = await loadBloggerPosts();

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

    // Phase 3-e-4：每篇 post 一次性解析 canonical，結果共用於渲染與 meta.json
    const canonical = resolveCanonicalUrl(post, settings);
    if (canonical.warning) blogger.warnings.push(canonical.warning);

    let html;
    let renderedKind;
    if (post.bloggerMode === 'full') {
      html = await renderFullPost(post);
      renderedKind = 'full';
    } else if (post.bloggerMode === 'summary') {
      html = await renderSummaryPost(post, canonical.url);
      renderedKind = 'summary';
    } else if (post.bloggerMode === 'redirect-card') {
      html = await renderRedirectCardPost(post, canonical.url);
      renderedKind = 'redirect-card';
    } else {
      html = placeholderHtml(post);
      renderedKind = 'placeholder';
    }

    await writeText(outputFile, html);
    console.log(`[build-blogger] wrote ${rel(outputFile)} (${renderedKind})`);

    const meta = buildMeta(post, {
      renderedKind,
      canonical,
      builtAt: builtAtIso,
      outputDir,
    });
    await writeJson(metaFile, meta);
    console.log(`[build-blogger] wrote ${rel(metaFile)}`);

    // Phase 3-e-5：copy-helper.txt + publish-checklist.txt
    const copyHelperFile = path.join(outputDir, 'copy-helper.txt');
    const publishChecklistFile = path.join(outputDir, 'publish-checklist.txt');
    const copyHelperText = await renderCopyHelper(post, canonical, meta);
    const publishChecklistText = await renderPublishChecklist(post, canonical, meta);
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

    // Phase 3-e-6：收集索引資料（in-memory）
    indexPosts.push({
      slug: post.slug,
      title: post.title ?? null,
      description: post.description ?? null,
      category: post.category ?? null,
      date: post.date ?? null,
      bloggerMode: post.bloggerMode,
      canonicalResolved: canonical.url,
      bloggerPublishedUrl: post.blogger?.publishedUrl || null,
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
