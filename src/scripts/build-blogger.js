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
// Phase 8-f-5-b：series.titleTemplate placeholder resolver（純函式 helper；Phase 8-f-4-b 落地）
//   - 僅用於 copy-helper 之「系列組合標題」輔助區塊預計算
//   - 不取代 post.title / fbTitle / Blogger 主標題；不修改其他 EJS 或 dist 路徑
import { resolveTitleTemplate } from './resolve-series-title.js';

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

async function renderFullPost(post, canonicalUrl, jsonLd) {
  const bodyHtml = renderBody(post.body || '');
  // Phase 8-d-3b：additive alias for EJS ergonomics；指向 8-d-2 掛載之 post.normalized。
  //   - 不重新呼叫 normalizePostOutput；不啟用 deriveGithubUrl；不預測 Blogger URL
  //   - EJS template 本批不改讀 normalized；屬 8-d-3c 之後範圍
  //   - 既有 EJS 仍讀 post.X；本欄位 additive，不影響輸出
  //   - 同樣 pattern 套用於 renderSummaryPost / renderRedirectCardPost / renderCopyHelper / renderPublishChecklist
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-post-full.ejs'),
    { post: { ...post, bodyHtml }, normalized: post.normalized, canonicalUrl, jsonLd },
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
// Phase 9-i-b2：當 primaryPlatform=blogger + canonical auto/缺 + 有 Blogger publishedUrl 時，
//   直接使用 Blogger publishedUrl（不 cross-link GitHub；不加 UTM）
//   per docs/phase-9h-known-blockers.md §4（Blocker #2 根因 2）
function resolveCanonicalUrl(post, settings) {
  const raw = post.canonical;
  // sidecar publish data 由 load-posts.js attach 至 post.publish；不從 legacy post.blogger 讀
  const bloggerPublishedUrl = post.publish?.blogger?.publishedUrl;
  if (
    post.primaryPlatform === 'blogger' &&
    (!raw || raw === 'auto') &&
    typeof bloggerPublishedUrl === 'string' &&
    bloggerPublishedUrl !== ''
  ) {
    return { url: bloggerPublishedUrl, warning: null };
  }
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

// Phase 5-f-2：cover 絕對化（用 bloggerSiteUrl 為 base；cover 已 absolute 直接返回）
function absolutizeBloggerCover(post, settings) {
  const url = post.cover;
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const base = (settings.site?.bloggerSiteUrl || '').replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/${url.replace(/^\/+/, '')}`;
}

// Phase 5-f-2：BlogPosting JSON-LD（in-body）；canonicalUrl 缺則 null
function buildBloggerJsonLd(post, canonicalUrl, settings, ogImage) {
  if (!canonicalUrl) return null;
  const cat = (settings.categories || []).find(
    (c) => c.id === post.category || c.slug === post.category,
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': canonicalUrl,
    headline: post.title,
    description: post.description || settings.site.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@type': 'Person', name: post.author || settings.site.author },
    mainEntityOfPage: canonicalUrl,
    inLanguage: settings.site.language,
    articleSection: cat?.name || post.category,
  };
  if (ogImage) jsonLd.image = ogImage;
  return jsonLd;
}

// Phase 5-f-2：OG 欄位（5-f-3 才會被 copy-helper 使用；本階段先建立）
function buildOgFields(post, canonicalUrl, ogImage) {
  return {
    title: post.fbTitle || post.title || '',
    description: post.description || '',
    url: canonicalUrl || '',
    image: ogImage || '',
    alt: post.coverAlt || '',
  };
}

async function renderSummaryPost(post, canonicalUrl, jsonLd) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-post-summary.ejs'),
    // Phase 8-d-3b：additive alias `normalized`（見 renderFullPost 之說明）
    { post, normalized: post.normalized, canonicalUrl, jsonLd },
    { async: true },
  );
}

async function renderRedirectCardPost(post, canonicalUrl) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-redirect-card.ejs'),
    // Phase 8-d-3b：additive alias `normalized`（見 renderFullPost 之說明）
    { post, normalized: post.normalized, canonicalUrl },
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
// Phase 5-f-3：擴充傳入 ogFields / jsonLd 給 SEO 區段 [7]-[10]
async function renderCopyHelper(
  post,
  canonical,
  meta,
  ogFields,
  jsonLd,
  copyHelperSeriesTitle,
  copyHelperSeriesTitleUnresolvedPlaceholders,
) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-copy-helper.ejs'),
    // Phase 8-d-3b：additive alias `normalized`（見 renderFullPost 之說明）
    // Phase 8-f-5-b：additive props `copyHelperSeriesTitle` / `copyHelperSeriesTitleUnresolvedPlaceholders`
    //   - 由 main loop 預計算（呼叫 resolveTitleTemplate）；helper 與 EJS 自身保持純函式 / 純模板
    //   - 不修改 post.title / post.normalized.display.title / buildMeta() 輸出 / 其他 EJS
    //   - copy-helper.ejs 內僅作為新增「系列組合標題」輔助區塊；不取代原 [1] Blogger 標題
    {
      post,
      normalized: post.normalized,
      canonical,
      meta,
      ogFields,
      jsonLd,
      copyHelperSeriesTitle,
      copyHelperSeriesTitleUnresolvedPlaceholders,
    },
    { async: true },
  );
}

// Phase 3-e-5：publish-checklist.txt（mode-aware checkbox 清單）
async function renderPublishChecklist(post, canonical, meta) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-publish-checklist.ejs'),
    // Phase 8-d-3b：additive alias `normalized`（見 renderFullPost 之說明）
    { post, normalized: post.normalized, canonical, meta },
    { async: true },
  );
}

// Phase 3-e-4：每篇 post 對應 meta.json（uniform schema、缺漏填 null）
function buildMeta(post, { renderedKind, canonical, builtAt, outputDir }) {
  // Phase 8-g-18-d：Blogger tags 輸出來源為 normalized.publish.blogger.tags
  //   - 設計依據：docs/series-schema.md §22 candidate 7 + Phase 8-d normalized-priority pattern
  //   - normalize-post-output.js（Phase 8-g-18-c）已於 normalized.publish.blogger.tags 封裝
  //     fallback chain：post.tags (non-empty) → series.tags (non-empty) → []
  //   - 本欄不直接讀 series.tags / series.hashtags（per §22.5 分離原則）；series.tags 之繼承走 normalize 已封裝
  //   - Phase 8-h-e-1：移除 legacy post.tags fallback（per docs/phase-8h-c-pre-plan.md §3.2 位置 #11；defensive-only，0 active caller across content/）
  const normalizedBloggerTags = post.normalized?.publish?.blogger?.tags;
  const bloggerTags = Array.isArray(normalizedBloggerTags) ? normalizedBloggerTags : [];

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
    tags: bloggerTags,
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
  // Phase 8-f-2-b：plumbing — settings 經 loadBloggerPosts 轉發至內部 loadPosts → processMarkdownEntry / normalizePostOutput
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

    // Phase 3-e-4：每篇 post 一次性解析 canonical，結果共用於渲染與 meta.json
    const canonical = resolveCanonicalUrl(post, settings);
    if (canonical.warning) blogger.warnings.push(canonical.warning);

    // Phase 5-f-2：SEO helper 預先計算（cover 絕對化 / BlogPosting JSON-LD / OG 欄位）
    // ogFields 5-f-3 才會被 copy-helper 使用；此處先建立避免 5-f-3 再動 build-blogger.js
    const ogImage = absolutizeBloggerCover(post, settings);
    const jsonLd = buildBloggerJsonLd(post, canonical.url, settings, ogImage);
    const ogFields = buildOgFields(post, canonical.url, ogImage);

    let html;
    let renderedKind;
    if (post.bloggerMode === 'full') {
      html = await renderFullPost(post, canonical.url, jsonLd);
      renderedKind = 'full';
    } else if (post.bloggerMode === 'summary') {
      html = await renderSummaryPost(post, canonical.url, jsonLd);
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

    // Phase 8-f-5-b：預計算 series.titleTemplate 解析結果，作為 copy-helper 「系列組合標題」輔助區塊
    //   - 僅當 post.normalized.series 存在且 titleTemplate 非空字串時觸發解析
    //   - resolveTitleTemplate 為純函式；不 throw / 不 process.exit；unresolved 保留原文
    //   - 不修改 post.title / post.normalized.display.title / buildMeta 輸出 / 其他 EJS / 其他 dist 路徑
    //   - 現有 fixture 無 series 區塊 → copyHelperSeriesTitle 為 null → EJS 不顯示 [11] 區塊 → copy-helper.txt byte-identical
    let copyHelperSeriesTitle = null;
    let copyHelperSeriesTitleUnresolvedPlaceholders = [];
    {
      const series = post.normalized?.series;
      if (series && typeof series.titleTemplate === 'string' && series.titleTemplate !== '') {
        const result = resolveTitleTemplate(series.titleTemplate, {
          series,
          post: { title: post.title, titleEn: post.titleEn },
        });
        copyHelperSeriesTitle = result.resolvedText;
        copyHelperSeriesTitleUnresolvedPlaceholders = result.unresolvedPlaceholders;
      }
    }

    const copyHelperText = await renderCopyHelper(
      post,
      canonical,
      meta,
      ogFields,
      jsonLd,
      copyHelperSeriesTitle,
      copyHelperSeriesTitleUnresolvedPlaceholders,
    );
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
    // Phase 8-d-3c-8-a：additive 加入 normalized 投影；指向 8-d-2 掛載之 post.normalized。
    //   - 不重新呼叫 normalizePostOutput；不修改既有 8 個投影欄位之語意
    //   - 配合 blogger-category-index.ejs 之 per-item view-model 改造
    //   - blogger-home-index.ejs 之 EJS 改造留待 8-d-3c-8-b（本批先把資料投影備好；blogger-home-index 本批仍不讀 normalized）
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
