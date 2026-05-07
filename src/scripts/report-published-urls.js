#!/usr/bin/env node
// Phase 7-b：published URL report
// 對 publishTargets.blogger.enabled === true 的 ready/published 文章，檢查 frontmatter
// blogger.publishedUrl 是否已回填。只報目前狀態，不會自動補 URL。
// 純 read-only：只讀資料、只寫到 dist-reports/，不改 content。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPosts } from './load-posts.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const REPORT_DIR = path.join(PROJECT_ROOT, 'dist-reports');

async function ensureReportDir() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

export async function generatePublishedUrlsReport({ writeFiles = true } = {}) {
  const github = await loadPosts({ site: 'github' });
  const blogger = await loadPosts({ site: 'blogger' });

  const allPosts = [
    ...github.posts.map((p) => ({ ...p, site: p.site ?? 'github' })),
    ...blogger.posts.map((p) => ({ ...p, site: p.site ?? 'blogger' })),
  ];

  const filled = [];
  const missing = [];

  for (const post of allPosts) {
    const target = post.publishTargets?.blogger;
    if (!target || target.enabled !== true) continue;
    const url = post.blogger?.publishedUrl;
    const hasUrl = typeof url === 'string' && url.trim() !== '';
    if (hasUrl) {
      filled.push({
        site: post.site,
        sourcePath: post.sourcePath,
        slug: post.slug,
        publishedUrl: url,
        bloggerPostId: post.blogger?.bloggerPostId ?? null,
        publishedAt: post.blogger?.publishedAt ?? null,
        bloggerStatus: post.blogger?.status ?? null,
      });
    } else {
      missing.push({
        site: post.site,
        sourcePath: post.sourcePath,
        slug: post.slug,
        bloggerStatus: post.blogger?.status ?? null,
      });
    }
  }

  const data = {
    generatedAt: new Date().toISOString(),
    blogger: {
      totalEnabled: filled.length + missing.length,
      totalFilled: filled.length,
      totalMissing: missing.length,
      filled,
      missing,
    },
  };

  const txt = formatTxt(data);

  if (writeFiles) {
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'published-urls-report.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(REPORT_DIR, 'published-urls-report.txt'),
      txt,
      'utf-8',
    );
    console.log('[report-published-urls] wrote dist-reports/published-urls-report.{json,txt}');
    console.log(
      `[report-published-urls] enabled=${data.blogger.totalEnabled} filled=${data.blogger.totalFilled} missing=${data.blogger.totalMissing}`,
    );
  }

  return { data, txt };
}

function formatTxt(data) {
  const lines = [];
  lines.push('[published-urls-report]');
  lines.push(`generated: ${data.generatedAt}`);
  lines.push('');
  lines.push('--- Blogger ---');
  lines.push(`Total publishTargets.blogger.enabled=true: ${data.blogger.totalEnabled}`);
  lines.push(`Filled (blogger.publishedUrl set): ${data.blogger.totalFilled}`);
  lines.push(`Missing (blogger.publishedUrl empty): ${data.blogger.totalMissing}`);
  lines.push('');

  lines.push('--- Filled posts ---');
  if (data.blogger.filled.length === 0) {
    lines.push('  (none)');
  } else {
    for (const f of data.blogger.filled) {
      lines.push(`  - [${f.site}] ${f.sourcePath}`);
      lines.push(`      slug=${f.slug ?? '(none)'}`);
      lines.push(`      url=${f.publishedUrl}`);
      lines.push(
        `      postId=${f.bloggerPostId ?? '(none)'} publishedAt=${f.publishedAt ?? '(none)'} status=${f.bloggerStatus ?? '(none)'}`,
      );
    }
  }
  lines.push('');

  lines.push('--- Missing posts (need URL backfill) ---');
  if (data.blogger.missing.length === 0) {
    lines.push('  (none)');
  } else {
    for (const m of data.blogger.missing) {
      lines.push(`  - [${m.site}] ${m.sourcePath}`);
      lines.push(`      slug=${m.slug ?? '(none)'} status=${m.bloggerStatus ?? '(none)'}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  await generatePublishedUrlsReport();
}
