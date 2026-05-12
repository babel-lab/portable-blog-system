#!/usr/bin/env node
// Phase 8-g-17-b：series report（visibility / dump channel）
//
// 依 series.id 分群列出所有 series 相關 posts（含 drafts），供作者人工檢視系列結構：
//   - posts 之 series.id / number / subtitle / titleTemplate / resolvedTitle
//   - unresolvedPlaceholders（per resolve-series-title.js Phase 8-f-4-b helper）
//   - hashtags fallback chain（frontmatter.promotion.facebook.hashtags > series.hashtags）
//   - group-level：number sequence / missing / duplicate / unresolvedPlaceholders 旗標
//
// 屬 visibility channel 而非 validation channel：
//   - 不新增 warning / error
//   - 不影響 validate exit code
//   - 不阻擋 build
//   - 不接 build:github / build:blogger / build:promotion / build:sitemap
//
// 觸發：npm run report:series（獨立 npm script；non-aggregator）
// 與既有 validate-content series warnings（series-number-duplicate / series-title-unresolved 等）
// 形成 dual-channel：
//   - validate：ready/published only；逐 post warning；warning-only exit code
//   - report：含 draft / ready / published；依 series.id 分群之 summary view；不影響 exit code
//
// 掃描範圍：
//   - 包含：content/github/posts/ + content/blogger/posts/
//   - 狀態包含：draft / ready / published
//   - 狀態排除：archived
//   - 路徑排除：validation-fixtures / templates / drafts/ / archive/ / pages/（per Phase 8-g-17-b 範圍）
//
// 注意：本批採直接 fast-glob + gray-matter 掃描（同 Phase 8-g-2-c-b suggest-series-number.js
// 之 pattern），不經 loadPosts（loadPosts 預設過濾 drafts）。publishedAt / publishedUrl
// 之精準值來自 .publish.json sidecar；本版僅讀 frontmatter（與 sidecar 一併進入屬未來
// 可選補強，不在本批 scope）。
//
// 純 read-only：只讀資料、只寫 dist-reports/，不改 content / settings / source。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

import { loadSettings } from './load-settings.js';
import { resolveTitleTemplate } from './resolve-series-title.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const REPORT_DIR = path.join(PROJECT_ROOT, 'dist-reports');

// 掃描範圍：正式 posts 目錄；fast-glob 之 ignore 排除其他路徑（fixtures / templates 等
// 路徑本身不在 INCLUDE_PATTERNS 內，自動不會被掃到，無需額外 ignore；列出僅作說明）
const INCLUDE_PATTERNS = [
  'content/github/posts/**/*.md',
  'content/blogger/posts/**/*.md',
];

// 狀態過濾：包含 draft / ready / published；排除 archived（per series-schema §4.3
// 排序欄位不含 archive；per Phase 8-g-2-c suggest-series-number.js §3.6 既有保守決策）
const INCLUDED_STATUS = new Set(['draft', 'ready', 'published']);

async function ensureReportDir() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

// 合併 frontmatter.series + settings.series[id] → normalizedSeries
// 邏輯對齊 normalize-post-output.js 之 series resolution（per series-schema.md §15.2 / §15.3）；
// 但本 script 不 import normalize-post-output.js（loadPosts 不掃 drafts，故獨立實作最小邏輯）
function resolveSeriesEntry(rawSeries, settingsSeries) {
  if (!rawSeries || typeof rawSeries !== 'object' || Array.isArray(rawSeries)) {
    return null;
  }
  const idValid =
    typeof rawSeries.id === 'string' && rawSeries.id.trim() !== '';
  if (!idValid) return null;
  const id = rawSeries.id;

  const settingsArr = Array.isArray(settingsSeries?.series)
    ? settingsSeries.series
    : [];
  const def = settingsArr.find(
    (e) => e && typeof e === 'object' && e.id === id,
  );

  const number =
    typeof rawSeries.number === 'number' &&
    Number.isInteger(rawSeries.number) &&
    rawSeries.number > 0
      ? rawSeries.number
      : null;
  const subtitle =
    typeof rawSeries.subtitle === 'string' ? rawSeries.subtitle : null;

  const hasFrontmatterName =
    typeof rawSeries.name === 'string' && rawSeries.name !== '';
  const name = hasFrontmatterName
    ? rawSeries.name
    : def && typeof def.name === 'string'
      ? def.name
      : null;

  const hasFrontmatterNameEn =
    typeof rawSeries.nameEn === 'string' && rawSeries.nameEn !== '';
  const nameEn = hasFrontmatterNameEn
    ? rawSeries.nameEn
    : def && typeof def.nameEn === 'string'
      ? def.nameEn
      : null;

  const hasFrontmatterTitleTemplate =
    typeof rawSeries.titleTemplate === 'string' &&
    rawSeries.titleTemplate !== '';
  const titleTemplate = hasFrontmatterTitleTemplate
    ? rawSeries.titleTemplate
    : def &&
        typeof def.titleTemplate === 'string' &&
        def.titleTemplate !== ''
      ? def.titleTemplate
      : null;

  // hashtags 採完整覆寫（per series-schema §8.4）；非合併
  const hasFrontmatterHashtags =
    Array.isArray(rawSeries.hashtags) && rawSeries.hashtags.length > 0;
  const hashtags = hasFrontmatterHashtags
    ? rawSeries.hashtags
    : def && Array.isArray(def.hashtags) && def.hashtags.length > 0
      ? def.hashtags
      : [];

  return {
    id,
    number,
    subtitle,
    name,
    nameEn,
    titleTemplate,
    hashtags,
    resolved: !!def,
  };
}

// effective hashtags fallback chain（簡化版；不讀 .fb.md sidecar）
// 順序：frontmatter.promotion.facebook.hashtags > series.hashtags > []
// 完整版（含 .fb.md）為 Phase 8-f-7-b 之 normalize-post-output post-pass backfill；
// 本 report 僅作 visibility，不重建 sidecar pipeline
function resolveEffectiveHashtags(data, normalizedSeries) {
  const fb = data.promotion?.facebook?.hashtags;
  if (Array.isArray(fb) && fb.length > 0) {
    return { hashtags: fb, source: 'frontmatter.promotion.facebook.hashtags' };
  }
  if (
    normalizedSeries &&
    Array.isArray(normalizedSeries.hashtags) &&
    normalizedSeries.hashtags.length > 0
  ) {
    return {
      hashtags: normalizedSeries.hashtags,
      source: normalizedSeries.resolved
        ? 'settings.series[id].hashtags'
        : 'frontmatter.series.hashtags',
    };
  }
  return { hashtags: [], source: 'fallback:empty' };
}

export async function generateSeriesReport({ writeFiles = true } = {}) {
  const settings = await loadSettings();

  const files = await fg(INCLUDE_PATTERNS, {
    cwd: PROJECT_ROOT,
    absolute: false,
  });

  const seriesPosts = [];

  for (const relPath of files) {
    const absPath = path.join(PROJECT_ROOT, relPath);
    let raw;
    try {
      raw = await fs.readFile(absPath, 'utf-8');
    } catch (e) {
      console.warn(`[report-series] cannot read ${relPath}: ${e.message}`);
      continue;
    }

    let parsed;
    try {
      parsed = matter(raw);
    } catch (e) {
      console.warn(
        `[report-series] cannot parse frontmatter in ${relPath}: ${e.message}`,
      );
      continue;
    }

    const data = parsed.data || {};

    // status 過濾
    const status = typeof data.status === 'string' ? data.status : null;
    if (status === null || !INCLUDED_STATUS.has(status)) continue;
    // legacy draft:true（per validate-content classify）；視同 draft（INCLUDED_STATUS 已含）；
    // 但若 draft:true 而 status 是 published 等，仍以 draft 處理之保守路線
    if (data.draft === true && !INCLUDED_STATUS.has('draft')) continue;

    // 無 series 區塊 → skip
    if (
      !data.series ||
      typeof data.series !== 'object' ||
      Array.isArray(data.series)
    ) {
      continue;
    }

    const normalizedSeries = resolveSeriesEntry(data.series, settings.series);
    // series.id invalid → skip（validate-content 會 warn）；report 不重複觸發
    if (normalizedSeries === null) continue;

    // 解析 titleTemplate
    let resolvedTitle = null;
    let unresolvedPlaceholders = [];
    if (
      typeof normalizedSeries.titleTemplate === 'string' &&
      normalizedSeries.titleTemplate !== ''
    ) {
      const result = resolveTitleTemplate(normalizedSeries.titleTemplate, {
        series: normalizedSeries,
        post: { title: data.title, titleEn: data.titleEn },
      });
      resolvedTitle = result.resolvedText;
      unresolvedPlaceholders = result.unresolvedPlaceholders;
    }

    const hashtagsInfo = resolveEffectiveHashtags(data, normalizedSeries);

    seriesPosts.push({
      sourcePath: relPath.replace(/\\/g, '/'),
      title: typeof data.title === 'string' ? data.title : null,
      titleEn: typeof data.titleEn === 'string' ? data.titleEn : null,
      status,
      publishedAt:
        (typeof data.publishedAt === 'string' ? data.publishedAt : null) ??
        null,
      publishedUrl:
        (typeof data.publishedUrl === 'string' ? data.publishedUrl : null) ??
        null,
      date: typeof data.date === 'string' ? data.date : null,
      series: {
        id: normalizedSeries.id,
        number: normalizedSeries.number,
        subtitle: normalizedSeries.subtitle,
      },
      titleTemplate: normalizedSeries.titleTemplate,
      resolvedTitle,
      unresolvedPlaceholders,
      hashtags: hashtagsInfo.hashtags,
      hashtagsSource: hashtagsInfo.source,
    });
  }

  // 排序：series.id → series.number → publishedAt → date → sourcePath
  seriesPosts.sort((a, b) => {
    const idA = a.series.id || '';
    const idB = b.series.id || '';
    if (idA !== idB) return idA < idB ? -1 : 1;

    const numA = a.series.number ?? Number.MAX_SAFE_INTEGER;
    const numB = b.series.number ?? Number.MAX_SAFE_INTEGER;
    if (numA !== numB) return numA - numB;

    const paA = a.publishedAt || '';
    const paB = b.publishedAt || '';
    if (paA !== paB) {
      if (!paA) return 1;
      if (!paB) return -1;
      return paA < paB ? -1 : 1;
    }

    const dA = a.date || '';
    const dB = b.date || '';
    if (dA !== dB) {
      if (!dA) return 1;
      if (!dB) return -1;
      return dA < dB ? -1 : 1;
    }

    return a.sourcePath < b.sourcePath
      ? -1
      : a.sourcePath > b.sourcePath
        ? 1
        : 0;
  });

  // 依 series.id 分群
  const groupsMap = new Map();
  for (const p of seriesPosts) {
    const id = p.series.id;
    if (!groupsMap.has(id)) groupsMap.set(id, []);
    groupsMap.get(id).push(p);
  }

  const groups = [];
  const sortedIds = [...groupsMap.keys()].sort();
  for (const id of sortedIds) {
    const posts = groupsMap.get(id);

    const numbers = posts
      .map((p) => p.series.number)
      .filter((n) => typeof n === 'number');

    const numberCount = new Map();
    for (const n of numbers) {
      numberCount.set(n, (numberCount.get(n) ?? 0) + 1);
    }

    const numberSet = new Set(numbers);
    const numberSequence = [...numberSet].sort((a, b) => a - b);

    const duplicateNumbers = [...numberCount.entries()]
      .filter(([, c]) => c >= 2)
      .map(([n]) => n)
      .sort((a, b) => a - b);

    let missingNumbers = [];
    if (numberSequence.length > 0) {
      const max = numberSequence[numberSequence.length - 1];
      for (let i = 1; i <= max; i++) {
        if (!numberSet.has(i)) missingNumbers.push(i);
      }
    }

    const hasUnresolvedPlaceholders = posts.some(
      (p) =>
        Array.isArray(p.unresolvedPlaceholders) &&
        p.unresolvedPlaceholders.length > 0,
    );

    groups.push({
      seriesId: id,
      postsLength: posts.length,
      numberSequence,
      missingNumbers,
      duplicateNumbers,
      hasUnresolvedPlaceholders,
      posts,
    });
  }

  const data = {
    generatedAt: new Date().toISOString(),
    totalSeries: groups.length,
    totalPosts: seriesPosts.length,
    groups,
  };

  const txt = formatTxt(data);

  if (writeFiles) {
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'series-report.json'),
      JSON.stringify(data, null, 2) + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(REPORT_DIR, 'series-report.txt'),
      txt,
      'utf-8',
    );
    console.log(
      '[report-series] wrote dist-reports/series-report.{json,txt}',
    );
    console.log(
      `[report-series] total series=${data.totalSeries} total posts=${data.totalPosts}`,
    );
  }

  return { data, txt };
}

function formatTxt(data) {
  const lines = [];
  lines.push('[series-report]');
  lines.push(`generated: ${data.generatedAt}`);
  lines.push('');
  lines.push(`Total series: ${data.totalSeries}`);
  lines.push(`Total posts:  ${data.totalPosts}`);
  lines.push('');
  lines.push(
    'Visibility / dump channel：不阻擋 build / validate；不新增 warning / error。',
  );
  lines.push(
    '範圍：content/github/posts/ + content/blogger/posts/；含 draft / ready / published；',
  );
  lines.push(
    '      排除 archived / validation-fixtures / templates / pages。',
  );
  lines.push('');

  if (data.totalSeries === 0) {
    lines.push('(no series posts found)');
    lines.push('');
    return lines.join('\n');
  }

  for (const g of data.groups) {
    lines.push(`--- series.id = ${g.seriesId} ---`);
    lines.push(
      `posts=${g.postsLength} numbers=[${g.numberSequence.join(', ')}]`,
    );
    if (g.missingNumbers.length > 0) {
      lines.push(`  missing=[${g.missingNumbers.join(', ')}]`);
    }
    if (g.duplicateNumbers.length > 0) {
      lines.push(`  duplicate=[${g.duplicateNumbers.join(', ')}] ⚠`);
    }
    if (g.hasUnresolvedPlaceholders) {
      lines.push('  hasUnresolvedPlaceholders=true ⚠');
    }
    lines.push('');

    for (const p of g.posts) {
      const numStr =
        p.series.number !== null ? `#${p.series.number}` : '#(missing)';
      lines.push(`  ${numStr} [${p.status}] ${p.title ?? '(no title)'}`);
      lines.push(`    source: ${p.sourcePath}`);
      if (p.titleEn) lines.push(`    titleEn: ${p.titleEn}`);
      if (p.series.subtitle) lines.push(`    subtitle: ${p.series.subtitle}`);
      if (p.titleTemplate) {
        lines.push(`    titleTemplate: ${p.titleTemplate}`);
        if (p.resolvedTitle !== null) {
          lines.push(`    resolvedTitle: ${p.resolvedTitle}`);
        }
        if (p.unresolvedPlaceholders.length > 0) {
          const names = p.unresolvedPlaceholders
            .map((u) => `{${u.name}} (${u.reason})`)
            .join(', ');
          lines.push(`    unresolvedPlaceholders: ${names}`);
        }
      }
      if (p.hashtags.length > 0) {
        lines.push(
          `    hashtags (${p.hashtagsSource}): ${p.hashtags.join(' ')}`,
        );
      }
      if (p.publishedAt) lines.push(`    publishedAt: ${p.publishedAt}`);
      if (p.publishedUrl) lines.push(`    publishedUrl: ${p.publishedUrl}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  await generateSeriesReport();
}
