#!/usr/bin/env node
// Phase 5-c：生成 dist/sitemap.xml 與 dist/robots.txt
//
// 範圍：
//   - sitemap 列出 home / post-list / post-detail / categories index / category /
//     tags index / tag。對齊 5-b 的 head canonical 規則。
//   - robots.txt 引用 sitemap，封鎖 /design-system/ 與 /404.html（與 5-b noindex 對齊）。
//   - 不輸出 changefreq / priority（Google 已忽略）。
//
// 不在範圍：
//   - sitemap-index / 圖片 / 影片 / hreflang
//   - GA4 / AdSense
//   - prebuild / postbuild 接入（保持手動 npm run build:sitemap）

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSettings } from './load-settings.js';
import { loadGithubPosts } from './load-github-posts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const SITEMAP_FILE = path.join(DIST_DIR, 'sitemap.xml');
const ROBOTS_FILE = path.join(DIST_DIR, 'robots.txt');

const rel = (p) => path.relative(PROJECT_ROOT, p).split(path.sep).join('/');

function siteBaseUrl(settings) {
  return (settings.site?.githubSiteUrl || '').replace(/\/+$/, '');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function escapeXml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod }) {
  const lines = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  lines.push('  </url>');
  return lines.join('\n');
}

function buildSitemapXml(entries) {
  const head = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const body = entries.map(urlEntry).join('\n');
  return `${head}\n${body}\n</urlset>\n`;
}

function buildRobotsTxt(baseUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /design-system/',
    'Disallow: /404.html',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

async function writeText(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf-8');
}

// 收集有 post 的 categories（map: slug → group）
function collectCategoryMap(settings, posts) {
  const findCategory = (ref) =>
    settings.categories.find((c) => c.id === ref) ||
    settings.categories.find((c) => c.slug === ref) ||
    null;
  const map = new Map();
  for (const post of posts) {
    if (!post.category) continue;
    const cat = findCategory(post.category);
    if (!cat) continue;
    if (!map.has(cat.slug)) map.set(cat.slug, { category: cat, posts: [] });
    map.get(cat.slug).posts.push(post);
  }
  return map;
}

// 收集有 post 的 tags
function collectTagMap(settings, posts) {
  const findTag = (ref) =>
    settings.tags.find((t) => t.id === ref) ||
    settings.tags.find((t) => t.slug === ref) ||
    null;
  const map = new Map();
  for (const post of posts) {
    for (const ref of post.tags || []) {
      const t = findTag(ref);
      if (!t) continue;
      if (!map.has(t.slug)) map.set(t.slug, { tag: t, posts: [] });
      map.get(t.slug).posts.push(post);
    }
  }
  return map;
}

function buildEntries({ base, posts, categoryMap, tagMap, buildIso }) {
  const entries = [];

  // 1. home
  entries.push({ loc: `${base}/`, lastmod: buildIso });

  // 2. post-list
  entries.push({ loc: `${base}/posts/`, lastmod: buildIso });

  // 3. post-detail（draft 已由 loadPosts 過濾）
  // Phase 20260520-seo-1：contentKind=download 視為導流漏斗後段頁，排除於 sitemap
  //   - 屬 noindex,follow 配套（per docs/seo-indexing-rules.md §3）
  //   - 該頁仍可正常 build / 公開訪問；但不主動提交給搜尋引擎
  for (const post of posts) {
    if (post.contentKind === 'download') continue;
    const lastmod = post.updated || post.date || null;
    entries.push({ loc: `${base}/posts/${post.slug}/`, lastmod });
  }

  // 4. category-list（只當至少 1 個 category 有 post 才出）
  if (categoryMap.size > 0) {
    entries.push({ loc: `${base}/categories/`, lastmod: buildIso });
  }
  for (const [slug] of categoryMap) {
    entries.push({ loc: `${base}/categories/${slug}/`, lastmod: buildIso });
  }

  // 5. tag-list
  if (tagMap.size > 0) {
    entries.push({ loc: `${base}/tags/`, lastmod: buildIso });
  }
  for (const [slug] of tagMap) {
    entries.push({ loc: `${base}/tags/${slug}/`, lastmod: buildIso });
  }

  return entries;
}

async function main() {
  const startedAt = Date.now();
  const buildIso = todayIso();

  const settings = await loadSettings();
  const base = siteBaseUrl(settings);
  if (!base) {
    console.error('[build-sitemap] site.githubSiteUrl 未設，無法建立 sitemap');
    process.exit(1);
  }

  // Phase 10-sitemap-cross-source-fix-a：改用 loadGithubPosts() 跨來源 aggregator（mirror build-github.js）
  //   - 含 native github-site posts + Blogger-primary publishTargets.github.enabled cross-source mirror posts
  //   - draft / publishTargets.github.enabled !== true 仍由 loader 過濾
  const github = await loadGithubPosts({ settings });
  const categoryMap = collectCategoryMap(settings, github.posts);
  const tagMap = collectTagMap(settings, github.posts);

  const entries = buildEntries({
    base,
    posts: github.posts,
    categoryMap,
    tagMap,
    buildIso,
  });

  const sitemapXml = buildSitemapXml(entries);
  await writeText(SITEMAP_FILE, sitemapXml);
  console.log(`[build-sitemap] wrote ${rel(SITEMAP_FILE)} (${entries.length} url entries)`);

  const robotsTxt = buildRobotsTxt(base);
  await writeText(ROBOTS_FILE, robotsTxt);
  console.log(`[build-sitemap] wrote ${rel(ROBOTS_FILE)}`);

  console.log(`[build-sitemap] done in ${Date.now() - startedAt}ms`);
}

main().catch((err) => {
  console.error('[build-sitemap] failed:', err);
  process.exit(1);
});
