import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

// Phase 8-b-4：接入 .publish.json sidecar；
// Phase 8-b-5：接入 .fb.md sidecar；
//   兩個 sidecar 由 helper 個別函式提供；
//   本檔仍不 import readPostSidecars（保留低粒度，以利後續批次微調讀取邏輯）。
import { readPublishSidecar, readFacebookSidecar } from './load-sidecars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const VISIBLE_STATUS = new Set(['ready', 'published']);

function classify(data) {
  if (data.draft === true) return { include: false, reason: 'draft:true' };
  const status = data.status ?? 'draft';
  if (!VISIBLE_STATUS.has(status)) return { include: false, reason: `status:${status}` };
  return { include: true, reason: 'ok' };
}

function toRelative(absPath) {
  return path.relative(PROJECT_ROOT, absPath).split(path.sep).join('/');
}

// Phase 8-b-7：抽出共用處理流程，讓 posts 與 pages 共用同一邏輯
//   - 解析 frontmatter（含 8-b-3 contentKind 相容讀取）
//   - 並行讀取 .publish.json 與 .fb.md sidecar（8-b-4 / 8-b-5）
//   - sourceCollection 標記來源（'posts' | 'pages'），加在 entry 與 filtered 兩種輸出
async function processMarkdownEntry(absPath, sourceCollection) {
  const raw = await fs.readFile(absPath, 'utf-8');
  const { data, content } = matter(raw);

  const sourcePath = toRelative(absPath);
  const verdict = classify(data);

  if (!verdict.include) {
    return {
      included: false,
      filtered: {
        sourcePath,
        sourceCollection,
        id: data.id ?? null,
        slug: data.slug ?? null,
        status: data.status ?? null,
        draft: data.draft ?? null,
        reason: verdict.reason,
      },
    };
  }

  // Phase 8-b-3：type → contentKind 相容讀取
  //   data.contentKind 為主；若無則 fallback 到 data.type（舊命名）。
  //   保留原始 data 之 type 欄位不刪，避免破壞既有 debug 流程；
  //   兩者並存且值不同之 warning 由 validate-content.js 處理。
  const normalizedData = {
    ...data,
    contentKind: data.contentKind ?? data.type,
  };

  // Phase 8-b-4 + 8-b-5：並行讀取 .publish.json 與 .fb.md sidecar
  //   - 兩個 helper 皆不 throw；I/O 與 parse 失敗皆轉為 issues
  //   - sidecar 不存在不是錯誤
  //   - 本 helper 僅將 sidecar 內容掛到 entry.sidecars 與 entry.publish；不做欄位映射
  //   - sidecar metadata + .fb.md 內容統一放 entry.sidecars namespace，不攤平到 top-level
  const [publishSidecar, facebookSidecar] = await Promise.all([
    readPublishSidecar(absPath),
    readFacebookSidecar(absPath),
  ]);

  const entry = {
    ...normalizedData,
    sourcePath,
    sourceCollection,
    bodyLength: content.length,
    body: content,
    sidecars: {
      publish: {
        exists: publishSidecar.exists,
        path: publishSidecar.path,
        issues: publishSidecar.issues,
      },
      // Phase 8-b-5：FB sidecar 內容掛在 entry.sidecars.facebook（依 helper 既有命名）；
      //   含 frontmatter (data) 與 body（純文字保留，不做 placeholder 解析、不 render markdown）
      facebook: {
        exists: facebookSidecar.exists,
        path: facebookSidecar.path,
        data: facebookSidecar.data,
        body: facebookSidecar.body,
        issues: facebookSidecar.issues,
      },
    },
  };

  // Phase 8-b-4：僅當 publish sidecar 存在且 data 非 null 時，將 raw data 掛到 entry.publish
  //   exists=false 或 data=null（parse 失敗 / 空檔）時，entry.publish 不新增
  if (publishSidecar.exists && publishSidecar.data) {
    entry.publish = publishSidecar.data;
  }

  return { included: true, entry };
}

// Phase 8-b-7：posts 與 pages 共用之排序比較器
//   date 降序，date 相同則 slug 升序（沿用 8-b-6 之前的既有比較規則）
function sortByDateThenSlug(a, b) {
  const ad = a.date ?? '';
  const bd = b.date ?? '';
  if (ad === bd) return (a.slug ?? '').localeCompare(b.slug ?? '');
  return bd.localeCompare(ad);
}

export async function loadPosts({ site = 'github' } = {}) {
  const baseDir = path.join(PROJECT_ROOT, 'content', site, 'posts');
  const pattern = path.join(baseDir, '**/*.md').split(path.sep).join('/');

  // Phase 8-b-7：pages/ 路徑支援
  //   獨立 glob、獨立陣列、獨立排序、獨立 totals；posts 行為與既有完全一致。
  //   此處不變更 build / EJS template / validate-content 之輸出，
  //   只讓 load-posts 能讀到 pages 並保留 sourceCollection 來源標記。
  const pagesBaseDir = path.join(PROJECT_ROOT, 'content', site, 'pages');
  const pagesPattern = path.join(pagesBaseDir, '**/*.md').split(path.sep).join('/');

  const [files, pagesFiles] = await Promise.all([
    fg(pattern, { absolute: true, onlyFiles: true }),
    fg(pagesPattern, { absolute: true, onlyFiles: true }),
  ]);

  const posts = [];
  const filteredOut = [];
  for (const absPath of files) {
    const result = await processMarkdownEntry(absPath, 'posts');
    if (result.included) posts.push(result.entry);
    else filteredOut.push(result.filtered);
  }
  posts.sort(sortByDateThenSlug);

  // Phase 8-b-7：pages 處理（獨立陣列；不影響 posts 結構與排序）
  const pages = [];
  const filteredOutPages = [];
  for (const absPath of pagesFiles) {
    const result = await processMarkdownEntry(absPath, 'pages');
    if (result.included) pages.push(result.entry);
    else filteredOutPages.push(result.filtered);
  }
  pages.sort(sortByDateThenSlug);

  return {
    site,
    totalScanned: files.length,
    totalReady: posts.length,
    totalFiltered: filteredOut.length,
    posts,
    filteredOut,
    // Phase 8-b-7：pages/ 路徑支援之新欄位（既有 callers 可繼續忽略 pages 與 filteredOutPages）
    pages,
    filteredOutPages,
    pagesTotalScanned: pagesFiles.length,
    pagesTotalReady: pages.length,
    pagesTotalFiltered: filteredOutPages.length,
  };
}
