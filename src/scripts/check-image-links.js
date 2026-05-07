#!/usr/bin/env node
// Phase 7-c：image links check
// 掃 ready/published 文章 frontmatter cover / book.coverImage 與 body 內 markdown image / HTML <img>，分類：
//   - local-missing：站內路徑但 public/ 內找不到對應檔
//   - external：http(s):// 圖片 URL（不打網路請求）
//   - unknown：無協議、不以 / 開頭，視為可疑
//   - alt-missing：缺 alt 文字（a11y 提醒）
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

function extractImages(markdown) {
  const tokens = md.parse(markdown ?? '', {});
  const out = [];
  function walk(toks) {
    for (const tok of toks) {
      if (tok.type === 'image') {
        const src = typeof tok.attrGet === 'function' ? tok.attrGet('src') : null;
        // markdown-it: image alt 在 token.content 或 children text 中
        let alt = '';
        if (typeof tok.attrGet === 'function') {
          const attrAlt = tok.attrGet('alt');
          if (typeof attrAlt === 'string') alt = attrAlt;
        }
        if (!alt && tok.content) alt = tok.content;
        if (src) out.push({ kind: 'markdown-image', src, alt });
      }
      if (tok.type === 'html_inline' || tok.type === 'html_block') {
        const re = /<img\s+([^>]+?)\/?>/gi;
        let m;
        while ((m = re.exec(tok.content || '')) !== null) {
          const attrs = m[1];
          const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
          const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/i);
          if (srcMatch) {
            out.push({
              kind: 'html-img',
              src: srcMatch[1],
              alt: altMatch ? altMatch[1] : '',
            });
          }
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
  if (u.startsWith('/')) return { kind: 'local' };
  return { kind: 'unknown' };
}

export async function generateImageLinksReport({ writeFiles = true } = {}) {
  const github = await loadPosts({ site: 'github' });
  const blogger = await loadPosts({ site: 'blogger' });

  const allPosts = [
    ...github.posts.map((p) => ({ ...p, site: p.site ?? 'github' })),
    ...blogger.posts.map((p) => ({ ...p, site: p.site ?? 'blogger' })),
  ];

  const localMissing = [];
  const externals = [];
  const unknowns = [];
  const altMissing = [];
  let totalImages = 0;

  for (const post of allPosts) {
    const sources = [];

    // 1. frontmatter cover
    if (typeof post.cover === 'string' && post.cover.trim() !== '') {
      sources.push({
        location: 'frontmatter.cover',
        url: post.cover,
        alt: typeof post.coverAlt === 'string' ? post.coverAlt : '',
      });
    }

    // 2. frontmatter book.coverImage
    if (post.book && typeof post.book.coverImage === 'string' && post.book.coverImage.trim() !== '') {
      sources.push({
        location: 'frontmatter.book.coverImage',
        url: post.book.coverImage,
        alt: typeof post.book.coverAlt === 'string' ? post.book.coverAlt : '',
      });
    }

    // 3. body images
    const bodyImgs = extractImages(post.body || '');
    for (const img of bodyImgs) {
      sources.push({ location: img.kind, url: img.src, alt: img.alt });
    }

    for (const s of sources) {
      totalImages++;
      const ctx = {
        site: post.site,
        sourcePath: post.sourcePath,
        slug: post.slug,
        location: s.location,
        url: s.url,
        alt: s.alt,
      };
      const cls = classify(s.url);
      switch (cls.kind) {
        case 'external':
          externals.push(ctx);
          break;
        case 'local': {
          const exists = await pathExistsInPublic(s.url);
          if (!exists) {
            localMissing.push({
              ...ctx,
              classification: 'local-missing',
              expectedPath: path.posix.join('public', s.url.split('?')[0].split('#')[0].replace(/^\/+/, '')),
            });
          }
          break;
        }
        case 'unknown':
        default:
          unknowns.push({ ...ctx, classification: 'unknown' });
          break;
      }
      if (typeof s.alt !== 'string' || s.alt.trim() === '') {
        altMissing.push(ctx);
      }
    }
  }

  const data = {
    generatedAt: new Date().toISOString(),
    totalPostsScanned: allPosts.length,
    totalImagesFound: totalImages,
    summary: {
      localMissing: localMissing.length,
      externals: externals.length,
      unknowns: unknowns.length,
      altMissing: altMissing.length,
    },
    localMissing,
    externals,
    unknowns,
    altMissing,
    notes: [
      'External http(s) image URLs are not actually fetched in this version.',
      'Local image paths are resolved relative to public/ (e.g. /images/foo.svg → public/images/foo.svg).',
      'alt-missing is an a11y reminder, not a hard error; required for cover and book.coverImage in particular.',
    ],
  };

  const txt = formatTxt(data);

  if (writeFiles) {
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'check-image-links-report.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(REPORT_DIR, 'check-image-links-report.txt'),
      txt,
      'utf-8',
    );
    console.log('[check-image-links] wrote dist-reports/check-image-links-report.{json,txt}');
    console.log(
      `[check-image-links] total=${totalImages} local-missing=${data.summary.localMissing} external=${data.summary.externals} unknown=${data.summary.unknowns} alt-missing=${data.summary.altMissing}`,
    );
  }

  return { data, txt };
}

function formatTxt(data) {
  const lines = [];
  lines.push('[check-image-links-report]');
  lines.push(`generated: ${data.generatedAt}`);
  lines.push('');
  lines.push(`Posts scanned (ready/published): ${data.totalPostsScanned}`);
  lines.push(`Total images found (frontmatter + body): ${data.totalImagesFound}`);
  lines.push('');
  lines.push(`Local missing: ${data.summary.localMissing}`);
  lines.push(`External (not fetched): ${data.summary.externals}`);
  lines.push(`Unknown (no protocol, not /): ${data.summary.unknowns}`);
  lines.push(`Alt missing (a11y): ${data.summary.altMissing}`);
  lines.push('');

  lines.push('--- Local missing ---');
  if (data.localMissing.length === 0) {
    lines.push('  (none)');
  } else {
    for (const m of data.localMissing) {
      lines.push(`  - [${m.site}] ${m.sourcePath}`);
      lines.push(`      location=${m.location} url=${m.url}`);
      lines.push(`      expected file at: ${m.expectedPath}`);
    }
  }
  lines.push('');

  lines.push('--- Unknown ---');
  if (data.unknowns.length === 0) {
    lines.push('  (none)');
  } else {
    for (const u of data.unknowns) {
      lines.push(`  - [${u.site}] ${u.sourcePath}`);
      lines.push(`      location=${u.location} url=${u.url}`);
    }
  }
  lines.push('');

  lines.push('--- Alt missing (a11y reminder) ---');
  if (data.altMissing.length === 0) {
    lines.push('  (none)');
  } else {
    for (const a of data.altMissing) {
      lines.push(`  - [${a.site}] ${a.sourcePath}`);
      lines.push(`      location=${a.location} url=${a.url}`);
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
  await generateImageLinksReport();
}
