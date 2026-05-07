#!/usr/bin/env node
// Phase 7-b：missing tags report
// 列出 ready/published 文章 frontmatter 用到、但未定義於 content/settings/tags.json 的 tag。
// 也列出 site mismatch（tag 定義中 site 範圍不含該 post.site）。
// 純 read-only：只讀資料、只寫到 dist-reports/，不修 content、不修 tags.json。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPosts } from './load-posts.js';
import { loadSettings } from './load-settings.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const REPORT_DIR = path.join(PROJECT_ROOT, 'dist-reports');

async function ensureReportDir() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

export async function generateMissingTagsReport({ writeFiles = true } = {}) {
  const settings = await loadSettings();
  const github = await loadPosts({ site: 'github' });
  const blogger = await loadPosts({ site: 'blogger' });

  const tagById = new Map();
  const tagBySlug = new Map();
  for (const t of settings.tags || []) {
    if (t && t.id) tagById.set(t.id, t);
    if (t && t.slug) tagBySlug.set(t.slug, t);
  }

  const allPosts = [
    ...github.posts.map((p) => ({ ...p, site: p.site ?? 'github' })),
    ...blogger.posts.map((p) => ({ ...p, site: p.site ?? 'blogger' })),
  ];

  const missingByTag = new Map();
  const siteMismatches = [];

  for (const post of allPosts) {
    const tags = Array.isArray(post.tags) ? post.tags : [];
    for (const t of tags) {
      if (typeof t !== 'string' || t.trim() === '') continue;
      const def = tagById.get(t) ?? tagBySlug.get(t);
      if (!def) {
        if (!missingByTag.has(t)) missingByTag.set(t, []);
        missingByTag.get(t).push({
          site: post.site,
          sourcePath: post.sourcePath,
          slug: post.slug,
        });
      } else if (Array.isArray(def.site) && !def.site.includes(post.site)) {
        siteMismatches.push({
          tag: t,
          tagSites: def.site,
          postSite: post.site,
          sourcePath: post.sourcePath,
          slug: post.slug,
        });
      }
    }
  }

  const missing = [...missingByTag.entries()]
    .map(([tag, usedIn]) => ({ tag, usedIn }))
    .sort((a, b) => a.tag.localeCompare(b.tag));

  const data = {
    generatedAt: new Date().toISOString(),
    totalMissing: missing.length,
    totalSiteMismatches: siteMismatches.length,
    totalPostsScanned: allPosts.length,
    totalTagsDefined: (settings.tags || []).length,
    missing,
    siteMismatches,
  };

  const txt = formatTxt(data);

  if (writeFiles) {
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'missing-tags-report.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(REPORT_DIR, 'missing-tags-report.txt'),
      txt,
      'utf-8',
    );
    console.log('[report-missing-tags] wrote dist-reports/missing-tags-report.{json,txt}');
    console.log(
      `[report-missing-tags] missing=${data.totalMissing} site-mismatch=${data.totalSiteMismatches}`,
    );
  }

  return { data, txt };
}

function formatTxt(data) {
  const lines = [];
  lines.push('[missing-tags-report]');
  lines.push(`generated: ${data.generatedAt}`);
  lines.push('');
  lines.push(`Posts scanned (ready/published): ${data.totalPostsScanned}`);
  lines.push(`Tags defined in tags.json: ${data.totalTagsDefined}`);
  lines.push(`Missing tags: ${data.totalMissing}`);
  lines.push(`Site mismatches: ${data.totalSiteMismatches}`);
  lines.push('');

  lines.push('--- Missing tags ---');
  if (data.missing.length === 0) {
    lines.push('  (none)');
  } else {
    for (const m of data.missing) {
      lines.push(`  ${m.tag} (used in ${m.usedIn.length}):`);
      for (const u of m.usedIn) {
        lines.push(`    - [${u.site}] ${u.sourcePath} (slug=${u.slug ?? '(none)'})`);
      }
    }
  }
  lines.push('');

  lines.push('--- Site mismatches ---');
  if (data.siteMismatches.length === 0) {
    lines.push('  (none)');
  } else {
    for (const s of data.siteMismatches) {
      lines.push(
        `  ${s.tag}: post site=${s.postSite}, tag sites=[${s.tagSites.join(',')}]`,
      );
      lines.push(`    - ${s.sourcePath} (slug=${s.slug ?? '(none)'})`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  await generateMissingTagsReport();
}
