#!/usr/bin/env node
// Phase 9-f-b-1：book report（visibility / dump channel）
//
// 依 book.mediaType 分群列出所有含 book metadata 之 posts（含 drafts），供作者人工檢視
// 書評 / 雜誌 metadata 完整性：
//   - posts 之 book.title / titleEn / originalTitle / subtitle / authors / publisher /
//     publishedYear / isbn / issn / volume / volumeLabel / issue
//   - resolved authors display（per docs/book-schema.md §7 之 fallback chain，inline 實作）
//   - missing 欄位摘要（visibility 用；不影響 validate / build）
//
// 屬 visibility channel 而非 validation channel：
//   - 不新增 warning / error
//   - 不影響 validate exit code
//   - 不阻擋 build
//   - 不接 build:github / build:blogger / build:promotion / build:sitemap
//   - 不修改任何 content / docs / source code
//
// 觸發：npm run report:book（獨立 npm script；non-aggregator；mirror Phase 8-g-17-b
// report:series 之 pattern）
//
// 與既有 validate-content book warnings（book-mediatype-invalid / book-authors-entry-empty
// 等 7 條 warning-only rules，per Phase 9-e-d-b/c）形成 dual-channel：
//   - validate：ready / published only；逐 post warning；warning-only exit code
//   - report：含 draft / ready / published；依 mediaType 分群之 summary view；不影響 exit code
//
// 掃描範圍（mirror report-series.js）：
//   - 包含：content/github/posts/ + content/blogger/posts/
//   - 狀態包含：draft / ready / published
//   - 狀態排除：archived
//   - 路徑排除：validation-fixtures / templates / drafts/ / archive/ / pages/
//     （fast-glob INCLUDE_PATTERNS 自然排除其他路徑；無需額外 ignore）
//   - book block 過濾：僅含 data.book 為 plain object（非 null / 非 array）之 posts
//
// 注意：authors fallback chain inline 實作（不接 normalize-post-output；per Phase 9-e §11.7
// 邊界 + Phase 9-f-a Q5 決策「normalize-post-output 暫不動」）；不抽 helper 檔案。
//
// 純 read-only：只讀資料、只寫 dist-reports/，不改 content / settings / source。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const REPORT_DIR = path.join(PROJECT_ROOT, 'dist-reports');

const INCLUDE_PATTERNS = [
  'content/github/posts/**/*.md',
  'content/blogger/posts/**/*.md',
];

const INCLUDED_STATUS = new Set(['draft', 'ready', 'published']);

async function ensureReportDir() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

// inline helper：是否為非空 trimmed string
// 邏輯與 validate-content.js Phase 9-e-d-b 之 isNonEmptyString 一致（不 import；保持本 script 自包含）
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// inline helper：effective book mediaType（缺省為 "book"；per docs/book-schema.md §5.1）
// 邏輯與 validate-content.js Phase 9-e-d-b 之 getBookMediaType 一致；非 plain object 返回 undefined
function getBookMediaType(book) {
  if (!book || typeof book !== 'object' || Array.isArray(book)) return undefined;
  return book.mediaType === undefined ? 'book' : book.mediaType;
}

// inline helper：resolve 單一 author entry 之 displayName
// per docs/book-schema.md §7.1 之 5 步 fallback chain：
//   displayName → localName → originalName → (i === 0) legacy book.author → null
function resolveAuthorDisplayName(authorEntry, index, legacyBookAuthor) {
  if (
    !authorEntry ||
    typeof authorEntry !== 'object' ||
    Array.isArray(authorEntry)
  ) {
    return null;
  }
  if (isNonEmptyString(authorEntry.displayName)) {
    return authorEntry.displayName.trim();
  }
  if (isNonEmptyString(authorEntry.localName)) {
    return authorEntry.localName.trim();
  }
  if (isNonEmptyString(authorEntry.originalName)) {
    return authorEntry.originalName.trim();
  }
  if (index === 0 && isNonEmptyString(legacyBookAuthor)) {
    return legacyBookAuthor.trim();
  }
  return null;
}

// summarize authors：先用 book.authors[]；若 authors[] 空且 book.author 非空，視為單作者 legacy
function summarizeAuthors(book) {
  const legacyAuthor = book.author;
  if (!Array.isArray(book.authors) || book.authors.length === 0) {
    if (isNonEmptyString(legacyAuthor)) {
      return {
        names: [legacyAuthor.trim()],
        source: 'legacy:book.author',
        count: 1,
      };
    }
    return { names: [], source: 'empty', count: 0 };
  }
  const names = [];
  for (let i = 0; i < book.authors.length; i++) {
    const name = resolveAuthorDisplayName(
      book.authors[i],
      i,
      legacyAuthor,
    );
    if (name !== null) names.push(name);
  }
  return {
    names,
    source: 'book.authors[]',
    count: book.authors.length,
  };
}

// 判定 missing 欄位（visibility report；不影響 validate / build）
//   - title / authors / publisher / publishedYear 共通
//   - mediaType=book → 含 isbn 檢查
//   - mediaType=magazine → 含 issn / issue 檢查
function findMissingFields(book, effectiveMediaType, authorsSummary) {
  const missing = [];
  if (!isNonEmptyString(book.title)) missing.push('title');
  if (
    authorsSummary.count === 0 ||
    authorsSummary.names.length === 0
  ) {
    missing.push('authors');
  }
  if (!isNonEmptyString(book.publisher)) missing.push('publisher');
  if (book.publishedYear === undefined || book.publishedYear === null) {
    missing.push('publishedYear');
  }
  if (effectiveMediaType === 'book') {
    if (!isNonEmptyString(book.isbn)) missing.push('isbn');
  } else if (effectiveMediaType === 'magazine') {
    if (!isNonEmptyString(book.issn)) missing.push('issn');
    if (!isNonEmptyString(book.issue)) missing.push('issue');
  }
  return missing;
}

export async function generateBookReport({ writeFiles = true } = {}) {
  const files = await fg(INCLUDE_PATTERNS, {
    cwd: PROJECT_ROOT,
    absolute: false,
  });

  const bookPosts = [];

  for (const relPath of files) {
    const absPath = path.join(PROJECT_ROOT, relPath);
    let raw;
    try {
      raw = await fs.readFile(absPath, 'utf-8');
    } catch (e) {
      console.warn(`[report-book] cannot read ${relPath}: ${e.message}`);
      continue;
    }

    let parsed;
    try {
      parsed = matter(raw);
    } catch (e) {
      console.warn(
        `[report-book] cannot parse frontmatter in ${relPath}: ${e.message}`,
      );
      continue;
    }

    const data = parsed.data || {};

    // status 過濾
    const status = typeof data.status === 'string' ? data.status : null;
    if (status === null || !INCLUDED_STATUS.has(status)) continue;
    // legacy draft:true 保守路線（per report-series.js 同邏輯）
    if (data.draft === true && !INCLUDED_STATUS.has('draft')) continue;

    // book block 過濾：必須為 plain object
    if (
      !data.book ||
      typeof data.book !== 'object' ||
      Array.isArray(data.book)
    ) {
      continue;
    }

    const book = data.book;
    const effectiveMediaType = getBookMediaType(book);
    const authorsSummary = summarizeAuthors(book);
    const missing = findMissingFields(
      book,
      effectiveMediaType,
      authorsSummary,
    );

    bookPosts.push({
      sourcePath: relPath.replace(/\\/g, '/'),
      site: typeof data.site === 'string' ? data.site : null,
      status,
      title: typeof data.title === 'string' ? data.title : null,
      slug: typeof data.slug === 'string' ? data.slug : null,
      contentKind:
        typeof data.contentKind === 'string' ? data.contentKind : null,
      book: {
        mediaType: effectiveMediaType,
        mediaTypeExplicit: book.mediaType !== undefined,
        title: typeof book.title === 'string' ? book.title : null,
        titleEn: typeof book.titleEn === 'string' ? book.titleEn : null,
        originalTitle:
          typeof book.originalTitle === 'string' ? book.originalTitle : null,
        subtitle: typeof book.subtitle === 'string' ? book.subtitle : null,
        publisher: typeof book.publisher === 'string' ? book.publisher : null,
        publishedYear:
          typeof book.publishedYear === 'number' ? book.publishedYear : null,
        isbn: typeof book.isbn === 'string' ? book.isbn : null,
        issn: typeof book.issn === 'string' ? book.issn : null,
        issue: typeof book.issue === 'string' ? book.issue : null,
        volume: typeof book.volume === 'number' ? book.volume : null,
        volumeLabel:
          typeof book.volumeLabel === 'string' ? book.volumeLabel : null,
      },
      authors: authorsSummary,
      missing,
    });
  }

  // 排序：mediaType → publishedYear desc → title → sourcePath
  bookPosts.sort((a, b) => {
    const mtA = a.book.mediaType || '';
    const mtB = b.book.mediaType || '';
    if (mtA !== mtB) return mtA < mtB ? -1 : 1;

    const yA = a.book.publishedYear ?? -Infinity;
    const yB = b.book.publishedYear ?? -Infinity;
    if (yA !== yB) return yB - yA;

    const tA = a.book.title || a.title || '';
    const tB = b.book.title || b.title || '';
    if (tA !== tB) return tA < tB ? -1 : 1;

    return a.sourcePath < b.sourcePath
      ? -1
      : a.sourcePath > b.sourcePath
        ? 1
        : 0;
  });

  // 依 mediaType 分群
  const groupsMap = new Map();
  for (const p of bookPosts) {
    const mt = p.book.mediaType || '(unknown)';
    if (!groupsMap.has(mt)) groupsMap.set(mt, []);
    groupsMap.get(mt).push(p);
  }

  const groups = [];
  const sortedMediaTypes = [...groupsMap.keys()].sort();
  for (const mt of sortedMediaTypes) {
    const posts = groupsMap.get(mt);
    const withMissing = posts.filter((p) => p.missing.length > 0);
    groups.push({
      mediaType: mt,
      postsLength: posts.length,
      missingCount: withMissing.length,
      posts,
    });
  }

  // 全 report missing 各欄位總數
  const missingTotals = {};
  for (const p of bookPosts) {
    for (const m of p.missing) {
      missingTotals[m] = (missingTotals[m] ?? 0) + 1;
    }
  }

  const dataOut = {
    generatedAt: new Date().toISOString(),
    totalPosts: bookPosts.length,
    totalGroups: groups.length,
    missingTotals,
    groups,
  };

  const txt = formatTxt(dataOut);

  if (writeFiles) {
    await ensureReportDir();
    await fs.writeFile(
      path.join(REPORT_DIR, 'book-report.json'),
      JSON.stringify(dataOut, null, 2) + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(REPORT_DIR, 'book-report.txt'),
      txt,
      'utf-8',
    );
    console.log('[report-book] wrote dist-reports/book-report.{json,txt}');
    console.log(
      `[report-book] total posts=${dataOut.totalPosts} groups=${dataOut.totalGroups}`,
    );
  }

  return { data: dataOut, txt };
}

function formatTxt(data) {
  const lines = [];
  lines.push('[book-report]');
  lines.push(`generated: ${data.generatedAt}`);
  lines.push('');
  lines.push(`Total book posts: ${data.totalPosts}`);
  lines.push(`Total groups (by mediaType): ${data.totalGroups}`);
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
  lines.push('book 過濾：僅含 frontmatter.book 為 plain object 之 posts。');
  lines.push('');

  if (data.totalPosts === 0) {
    lines.push('(no book posts found)');
    lines.push('');
    return lines.join('\n');
  }

  const missingKeys = Object.keys(data.missingTotals).sort();
  if (missingKeys.length > 0) {
    lines.push('Missing fields summary:');
    for (const k of missingKeys) {
      lines.push(`  ${k}: ${data.missingTotals[k]}`);
    }
    lines.push('');
  }

  for (const g of data.groups) {
    lines.push(`--- mediaType = ${g.mediaType} ---`);
    lines.push(
      `posts=${g.postsLength}  postsWithMissing=${g.missingCount}`,
    );
    lines.push('');

    for (const p of g.posts) {
      const titleStr = p.book.title || p.title || '(no title)';
      lines.push(`  [${p.status}] ${titleStr}`);
      lines.push(`    source: ${p.sourcePath}`);
      if (p.site) lines.push(`    site: ${p.site}`);
      if (p.slug) lines.push(`    slug: ${p.slug}`);
      if (p.contentKind) lines.push(`    contentKind: ${p.contentKind}`);
      const mtSuffix = p.book.mediaTypeExplicit ? '' : ' (default)';
      lines.push(`    book.mediaType: ${p.book.mediaType}${mtSuffix}`);
      if (p.book.titleEn) lines.push(`    book.titleEn: ${p.book.titleEn}`);
      if (p.book.originalTitle) {
        lines.push(`    book.originalTitle: ${p.book.originalTitle}`);
      }
      if (p.book.subtitle) lines.push(`    book.subtitle: ${p.book.subtitle}`);
      lines.push(
        `    book.authors (${p.authors.source}): ${
          p.authors.names.length > 0 ? p.authors.names.join(' / ') : '(none)'
        }`,
      );
      if (p.book.publisher) {
        lines.push(`    book.publisher: ${p.book.publisher}`);
      }
      if (p.book.publishedYear !== null) {
        lines.push(`    book.publishedYear: ${p.book.publishedYear}`);
      }
      if (p.book.isbn) lines.push(`    book.isbn: ${p.book.isbn}`);
      if (p.book.issn) lines.push(`    book.issn: ${p.book.issn}`);
      if (p.book.volume !== null) {
        const volLabel = p.book.volumeLabel ? ` (${p.book.volumeLabel})` : '';
        lines.push(`    book.volume: ${p.book.volume}${volLabel}`);
      } else if (p.book.volumeLabel) {
        lines.push(`    book.volumeLabel: ${p.book.volumeLabel}`);
      }
      if (p.book.issue) lines.push(`    book.issue: ${p.book.issue}`);
      if (p.missing.length > 0) {
        lines.push(`    missing: ${p.missing.join(', ')} ⚠`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  await generateBookReport();
}
