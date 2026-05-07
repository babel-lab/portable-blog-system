#!/usr/bin/env node
// Phase 7-c：broken links check
// 掃 ready/published 文章 body 內 markdown link 與 HTML <a href>，分類：
//   - internal-broken：站內路徑既非已知 page route，也非 public/ 內檔案
//   - external：http(s):// 連結（不打網路請求）
//   - external-protocol：mailto:/tel: 等
//   - anchor：純 #section 連結（不驗證 heading）
//   - relative-suspicious：./ ../ 開頭的相對連結（可能因 render context 失效）
//   - unknown：無協議、不以 / 開頭，視為可疑
// 純 read-only：只讀資料、只寫到 dist-reports/，不改 content。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { md } from './parse-markdown.js';
import { loadPosts } from './load-posts.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const REPORT_DIR = path.join(PROJECT_ROOT, 'dist-reports');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

async function ensureReportDir() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

// 從現況推算已知站內 page route（不依賴 .cache/build-manifest.json）
async function buildInternalRoutes() {
  const github = await loadPosts({ site: 'github' });

  const routes = new Set();
  const addBoth = (p) => {
    routes.add(p);
    if (!p.endsWith('/')) routes.add(p + '/');
    if (p.endsWith('/')) routes.add(p.replace(/\/$/, ''));
  };

  // 靜態頁
  ['/', '/posts/', '/categories/', '/tags/', '/404', '/design-system/'].forEach(addBoth);
  for (const sub of ['colors', 'spacing', 'typography', 'buttons', 'cards', 'article-components']) {
    addBoth(`/design-system/${sub}/`);
  }

  // Posts
  for (const post of github.posts) {
    if (post.slug) addBoth(`/posts/${post.slug}/`);
  }

  // Categories（有 ready post 才產生頁）
  const cats = new Set();
  for (const p of github.posts) if (p.category) cats.add(p.category);
  for (const c of cats) addBoth(`/categories/${c}/`);

  // Tags（有 ready post 才產生頁）
  const tags = new Set();
  for (const p of github.posts) for (const t of p.tags || []) tags.add(t);
  for (const t of tags) addBoth(`/tags/${t}/`);

  return routes;
}

async function pathExistsInPublic(urlPath) {
  const clean = urlPath.split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return false;
  const trimmed = clean.slice(1);
  let decoded;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return false;
  }
  const full = path.join(PUBLIC_DIR, decoded);
  try {
    await fs.access(full);
    return true;
  } catch {
    return false;
  }
}

function extractLinks(markdown) {
  const tokens = md.parse(markdown ?? '', {});
  const out = [];
  function walk(toks) {
    for (const tok of toks) {
      if (tok.type === 'link_open') {
        const href = typeof tok.attrGet === 'function' ? tok.attrGet('href') : null;
        if (href) out.push({ kind: 'markdown-link', url: href });
      }
      if (tok.type === 'html_inline' || tok.type === 'html_block') {
        const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["']/gi;
        let m;
        while ((m = re.exec(tok.content || '')) !== null) {
          out.push({ kind: 'html-a', url: m[1] });
        }
      }
      if (tok.children) walk(tok.children);
    }
  }
  walk(tokens);
  return out;
}

function classify(url) {
  if (typeof url !== 'string') return { kind: 'unknown' };
  const u = url.trim();
  if (u === '') return { kind: 'unknown' };
  if (/^https?:\/\//i.test(u)) return { kind: 'external' };
  if (/^(mailto:|tel:|javascript:)/i.test(u)) return { kind: 'external-protocol' };
  if (u.startsWith('#')) return { kind: 'anchor', anchor: u };
  if (u.startsWith('/')) {
    const [pathPart, anchor = null] = u.split('#');
    return { kind: 'internal', path: pathPart, anchor };
  }
  if (u.startsWith('./') || u.startsWith('../')) return { kind: 'relative' };
  return { kind: 'unknown' };
}

export async function generateBrokenLinksReport({ writeFiles = true } = {}) {
  const routes = await buildInternalRoutes();
  const github = await loadPosts({ site: 'github' });
  const blogger = await loadPosts({ site: 'blogger' });

  const allPosts = [
    ...github.posts.map((p) => ({ ...p, site: p.site ?? 'github' })),
    ...blogger.posts.map((p) => ({ ...p, site: p.site ?? 'blogger' })),
  ];

  const broken = [];
  const externals = [];
  const externalProtocols = [];
  const anchors = [];
  const unknowns = [];
  let totalLinks = 0;

  for (const post of allPosts) {
    const links = extractLinks(post.body || '');
    for (const link of links) {
      totalLinks++;
      const cls = classify(link.url);
      const ctx = {
        site: post.site,
        sourcePath: post.sourcePath,
        slug: post.slug,
        kind: link.kind,
        url: link.url,
      };
      switch (cls.kind) {
        case 'external':
          externals.push(ctx);
          break;
        case 'external-protocol':
          externalProtocols.push(ctx);
          break;
        case 'anchor':
          anchors.push({ ...ctx, anchor: cls.anchor });
          break;
        case 'internal': {
          const matchesRoute = routes.has(cls.path);
          let matchesPublic = false;
          if (!matchesRoute) matchesPublic = await pathExistsInPublic(cls.path);
          if (!matchesRoute && !matchesPublic) {
            broken.push({ ...ctx, classification: 'internal-broken', resolved: cls.path });
          }
          break;
        }
        case 'relative':
          broken.push({ ...ctx, classification: 'relative-suspicious' });
          break;
        case 'unknown':
        default:
          unknowns.push({ ...ctx, classification: 'unknown' });
          break;
      }
    }
  }

  const data = {
    generatedAt: new Date().toISOString(),
    totalPostsScanned: allPosts.length,
    totalLinksFound: totalLinks,
    summary: {
      broken: broken.length,
      externals: externals.length,
      externalProtocols: externalProtocols.length,
      anchors: anchors.length,
      unknowns: unknowns.length,
    },
    broken,
    externals,
    externalProtocols,
    anchors,
    unknowns,
    notes: [
      'External http(s) links are not actually fetched in this version.',
      'Anchor (#section) links are listed but not verified against rendered headings.',
      'Internal routes are derived from current ready/published GitHub posts + categories/tags + static design-system pages.',
      'Internal links to public/ files are accepted if the file exists.',
    ],
  };

  const txt = formatTxt(data);

  if (writeFiles) {
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'check-broken-links-report.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(REPORT_DIR, 'check-broken-links-report.txt'),
      txt,
      'utf-8',
    );
    console.log('[check-broken-links] wrote dist-reports/check-broken-links-report.{json,txt}');
    console.log(
      `[check-broken-links] total=${totalLinks} broken=${data.summary.broken} external=${data.summary.externals} anchors=${data.summary.anchors} unknown=${data.summary.unknowns}`,
    );
  }

  return { data, txt };
}

function formatTxt(data) {
  const lines = [];
  lines.push('[check-broken-links-report]');
  lines.push(`generated: ${data.generatedAt}`);
  lines.push('');
  lines.push(`Posts scanned (ready/published): ${data.totalPostsScanned}`);
  lines.push(`Total links found in body: ${data.totalLinksFound}`);
  lines.push('');
  lines.push(`Broken (internal-broken / relative-suspicious): ${data.summary.broken}`);
  lines.push(`External (http/https, not fetched): ${data.summary.externals}`);
  lines.push(`External-protocol (mailto:/tel:/etc): ${data.summary.externalProtocols}`);
  lines.push(`Anchors (# only, not verified): ${data.summary.anchors}`);
  lines.push(`Unknown (no protocol, no leading /): ${data.summary.unknowns}`);
  lines.push('');

  lines.push('--- Broken ---');
  if (data.broken.length === 0) {
    lines.push('  (none)');
  } else {
    for (const b of data.broken) {
      lines.push(`  - [${b.site}] ${b.sourcePath}`);
      lines.push(`      url=${b.url} (${b.classification})`);
    }
  }
  lines.push('');

  lines.push('--- Notes ---');
  for (const n of data.notes) lines.push(`  • ${n}`);
  lines.push('');

  return lines.join('\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  await generateBrokenLinksReport();
}
