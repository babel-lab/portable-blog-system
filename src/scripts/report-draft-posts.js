#!/usr/bin/env node
// Phase 7-b：draft posts report
// 列出所有 draft 文章（status:draft 或 draft:true），跨 GitHub / Blogger 兩站。
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

function isDraftReason(reason) {
  return reason === 'draft:true' || reason === 'status:draft';
}

export async function generateDraftPostsReport({ writeFiles = true } = {}) {
  const github = await loadPosts({ site: 'github' });
  const blogger = await loadPosts({ site: 'blogger' });

  const githubDrafts = github.filteredOut.filter((f) => isDraftReason(f.reason));
  const bloggerDrafts = blogger.filteredOut.filter((f) => isDraftReason(f.reason));

  const data = {
    generatedAt: new Date().toISOString(),
    totalDrafts: githubDrafts.length + bloggerDrafts.length,
    sites: {
      github: {
        totalScanned: github.totalScanned,
        totalReady: github.totalReady,
        totalDrafts: githubDrafts.length,
        drafts: githubDrafts.map((d) => ({
          sourcePath: d.sourcePath,
          slug: d.slug,
          status: d.status,
          draft: d.draft,
          reason: d.reason,
        })),
      },
      blogger: {
        totalScanned: blogger.totalScanned,
        totalReady: blogger.totalReady,
        totalDrafts: bloggerDrafts.length,
        drafts: bloggerDrafts.map((d) => ({
          sourcePath: d.sourcePath,
          slug: d.slug,
          status: d.status,
          draft: d.draft,
          reason: d.reason,
        })),
      },
    },
  };

  const txt = formatTxt(data);

  if (writeFiles) {
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'draft-posts-report.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(REPORT_DIR, 'draft-posts-report.txt'),
      txt,
      'utf-8',
    );
    console.log('[report-draft-posts] wrote dist-reports/draft-posts-report.{json,txt}');
    console.log(`[report-draft-posts] total drafts: ${data.totalDrafts}`);
  }

  return { data, txt };
}

function formatTxt(data) {
  const lines = [];
  lines.push('[draft-posts-report]');
  lines.push(`generated: ${data.generatedAt}`);
  lines.push('');
  lines.push(`Total drafts: ${data.totalDrafts}`);
  lines.push('');
  for (const site of ['github', 'blogger']) {
    const s = data.sites[site];
    lines.push(
      `${site} site (${s.totalDrafts} drafts / ${s.totalScanned} scanned / ${s.totalReady} ready):`,
    );
    if (s.drafts.length === 0) {
      lines.push('  (none)');
    } else {
      for (const d of s.drafts) {
        lines.push(`  - ${d.sourcePath}`);
        lines.push(
          `      slug=${d.slug ?? '(none)'} status=${d.status ?? '(none)'} reason=${d.reason}`,
        );
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  await generateDraftPostsReport();
}
