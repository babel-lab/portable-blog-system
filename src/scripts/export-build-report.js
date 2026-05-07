#!/usr/bin/env node
// Phase 7-b：build report（aggregate）
// 彙總 ready / draft / 警告 / missing tags / published URL 狀態，輸出總覽報表。
// 純 read-only：只讀資料、只寫到 dist-reports/，不改 content。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPosts } from './load-posts.js';
import { loadSettings } from './load-settings.js';
import { validateContent } from './validate-content.js';
import { generateDraftPostsReport } from './report-draft-posts.js';
import { generateMissingTagsReport } from './report-missing-tags.js';
import { generatePublishedUrlsReport } from './report-published-urls.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const REPORT_DIR = path.join(PROJECT_ROOT, 'dist-reports');

async function ensureReportDir() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

export async function generateBuildReport({ writeFiles = true } = {}) {
  const settings = await loadSettings();
  const github = await loadPosts({ site: 'github' });
  const blogger = await loadPosts({ site: 'blogger' });

  const allVisible = [...github.posts, ...blogger.posts];
  const validate = validateContent({ posts: allVisible, settings });

  // 子報表（不寫檔，只取資料）
  const drafts = await generateDraftPostsReport({ writeFiles: false });
  const missingTags = await generateMissingTagsReport({ writeFiles: false });
  const publishedUrls = await generatePublishedUrlsReport({ writeFiles: false });

  const data = {
    generatedAt: new Date().toISOString(),
    sites: {
      github: {
        totalScanned: github.totalScanned,
        totalReady: github.totalReady,
        totalFiltered: github.totalFiltered,
      },
      blogger: {
        totalScanned: blogger.totalScanned,
        totalReady: blogger.totalReady,
        totalFiltered: blogger.totalFiltered,
      },
    },
    validate: {
      errorCount: validate.errorCount,
      warningCount: validate.warningCount,
      totalIssues: validate.count,
    },
    drafts: {
      total: drafts.data.totalDrafts,
      bySite: {
        github: drafts.data.sites.github.totalDrafts,
        blogger: drafts.data.sites.blogger.totalDrafts,
      },
    },
    missingTags: {
      totalMissing: missingTags.data.totalMissing,
      totalSiteMismatches: missingTags.data.totalSiteMismatches,
      totalTagsDefined: missingTags.data.totalTagsDefined,
    },
    publishedUrls: {
      totalEnabled: publishedUrls.data.blogger.totalEnabled,
      totalFilled: publishedUrls.data.blogger.totalFilled,
      totalMissing: publishedUrls.data.blogger.totalMissing,
    },
  };

  const txt = formatTxt(data);

  if (writeFiles) {
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'build-report.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(REPORT_DIR, 'build-report.txt'),
      txt,
      'utf-8',
    );
    console.log('[export-build-report] wrote dist-reports/build-report.{json,txt}');
    console.log(
      `[export-build-report] github ready=${github.totalReady} blogger ready=${blogger.totalReady} drafts=${data.drafts.total} validate-errors=${validate.errorCount} validate-warnings=${validate.warningCount}`,
    );
  }

  return { data, txt };
}

function formatTxt(data) {
  const lines = [];
  lines.push('[build-report]');
  lines.push(`generated: ${data.generatedAt}`);
  lines.push('');

  lines.push('--- Posts ---');
  for (const site of ['github', 'blogger']) {
    const s = data.sites[site];
    lines.push(
      `${site}: scanned=${s.totalScanned} ready=${s.totalReady} filtered=${s.totalFiltered}`,
    );
  }
  lines.push('');

  lines.push('--- Drafts ---');
  lines.push(`total=${data.drafts.total}`);
  lines.push(
    `  github=${data.drafts.bySite.github} blogger=${data.drafts.bySite.blogger}`,
  );
  lines.push('  詳細：見 dist-reports/draft-posts-report.txt');
  lines.push('');

  lines.push('--- Validate (Phase 5) ---');
  lines.push(
    `errors=${data.validate.errorCount} warnings=${data.validate.warningCount} total=${data.validate.totalIssues}`,
  );
  lines.push('  規則來源：src/scripts/validate-content.js');
  lines.push('');

  lines.push('--- Missing tags ---');
  lines.push(
    `missing=${data.missingTags.totalMissing} site-mismatch=${data.missingTags.totalSiteMismatches} (defined=${data.missingTags.totalTagsDefined})`,
  );
  lines.push('  詳細：見 dist-reports/missing-tags-report.txt');
  lines.push('');

  lines.push('--- Published URLs (Blogger) ---');
  lines.push(
    `enabled=${data.publishedUrls.totalEnabled} filled=${data.publishedUrls.totalFilled} missing=${data.publishedUrls.totalMissing}`,
  );
  lines.push('  詳細：見 dist-reports/published-urls-report.txt');
  lines.push('');

  lines.push('--- 健康度 ---');
  const healthy =
    data.validate.errorCount === 0 &&
    data.missingTags.totalMissing === 0 &&
    data.missingTags.totalSiteMismatches === 0;
  lines.push(healthy ? '  ✓ 無 ERROR、無 missing tag、無 site mismatch' : '  ⚠ 請檢查上方 errors / missing / mismatches');
  lines.push('');

  return lines.join('\n');
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  await generateBuildReport();
}
