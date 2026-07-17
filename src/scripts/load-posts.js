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

// Phase 8-d-2：於 entry 組裝完成後 additive 掛載 entry.normalized；
//   helper 為純函式，不修改 entry 既有欄位；不讀 settings；不啟用 GitHub URL 推導。
import { normalizePostOutput } from './normalize-post-output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const VISIBLE_STATUS = new Set(['ready', 'published']);

// Phase 20260714-github-redraft-lifecycle：classify 為 build 的唯一「文章是否進正式輸出」判斷。
//   additive export（行為不變；既有 loadPosts 之內部呼叫沿用同一函式）供 lifecycle contract
//   guard（check-github-redraft-lifecycle.js）以真實函式驗證 redraft state matrix，避免另抄一份
//   規格產生 drift。draft:true 或 status∉{ready,published} → 排除（保守：矛盾狀態亦排除，偏向隱藏）。
export function classify(data) {
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
//
// Phase 20260717-B2-c：additive export + additive option `includeFiltered`（**預設 false**）。
//   動機：draft-aware Blogger preview builder（build-blogger-preview.js）需要與正式 build **完全相同**
//   的 entry 組裝結果（frontmatter + sidecars + normalized），否則就得另抄一份組裝邏輯 → 必然漂移。
//   契約：`includeFiltered` 只影響「被 classify 排除者是否仍組裝 entry」，**不影響 `included` 之值**
//   —— 被排除者恆回 `included: false`。既有唯一 caller（loadPosts）不傳此參數 → 走與改動前
//   **完全相同**的分支與輸出 → 正式 build 之 dist/ 與 dist-blogger/ 不受影響（CLAUDE.md §23：
//   draft 不得進正式 dist；本改動不放寬 classify、不改變任何過濾規則）。
export async function processMarkdownEntry(absPath, sourceCollection, settings, options = {}) {
  const { includeFiltered = false } = options;
  const raw = await fs.readFile(absPath, 'utf-8');
  const { data, content } = matter(raw);

  const sourcePath = toRelative(absPath);
  const verdict = classify(data);

  const filtered = verdict.include
    ? null
    : {
        sourcePath,
        sourceCollection,
        id: data.id ?? null,
        slug: data.slug ?? null,
        status: data.status ?? null,
        draft: data.draft ?? null,
        reason: verdict.reason,
      };

  // 預設路徑（includeFiltered=false）：與改動前逐字等價 —— 被排除者不組裝 entry、直接回報。
  if (filtered && !includeFiltered) {
    return { included: false, filtered };
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

  // Phase 8-d-2：additive 掛載 entry.normalized
  //   - normalize-post-output 為純函式；不修改 entry 既有欄位
  //   - 不啟用 GitHub URL 推導（deriveGithubUrl: false）
  //   - 既有 callers / EJS / build 仍讀 entry 原欄位；entry.normalized 屬 additive runtime 欄位
  //   - 不 console.warn warnings；不 throw；warning 由 entry.normalized.validationMeta.warnings 攜帶供下游使用
  // Phase 8-f-2-b：plumbing — settings 由 caller 經 loadPosts → processMarkdownEntry 轉發至此
  //   - 本批僅資料通道；normalize-post-output 目前仍未使用 settings.series（屬 8-f-3 範圍）
  //   - 若 caller 未傳 settings（向後相容），processMarkdownEntry 收到 undefined；normalizePostOutput 之 settings 預設為 {}
  entry.normalized = normalizePostOutput(entry, settings ?? {}, { deriveGithubUrl: false });

  // Phase 20260717-B2-c：includeFiltered=true 且被 classify 排除 → `included` 仍如實回報 false
  //   （呼叫端不會誤把 draft 當可發布），但附上已組裝之 entry 供 draft-aware preview 使用。
  //   正式 build 不傳 includeFiltered → 永遠走不到此分支。
  if (filtered) return { included: false, filtered, entry, verdict };

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

export async function loadPosts({ site = 'github', settings = {} } = {}) {
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
    const result = await processMarkdownEntry(absPath, 'posts', settings);
    if (result.included) posts.push(result.entry);
    else filteredOut.push(result.filtered);
  }
  posts.sort(sortByDateThenSlug);

  // Phase 8-b-7：pages 處理（獨立陣列；不影響 posts 結構與排序）
  const pages = [];
  const filteredOutPages = [];
  for (const absPath of pagesFiles) {
    const result = await processMarkdownEntry(absPath, 'pages', settings);
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
