import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

// Phase 8-b-4：接入 .publish.json sidecar；本批僅 import readPublishSidecar
//   不 import readFacebookSidecar / readPostSidecars（屬 8-b-5 之後）
import { readPublishSidecar } from './load-sidecars.js';

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

export async function loadPosts({ site = 'github' } = {}) {
  const baseDir = path.join(PROJECT_ROOT, 'content', site, 'posts');
  const pattern = path.join(baseDir, '**/*.md').split(path.sep).join('/');

  const files = await fg(pattern, { absolute: true, onlyFiles: true });

  const posts = [];
  const filteredOut = [];

  for (const absPath of files) {
    const raw = await fs.readFile(absPath, 'utf-8');
    const { data, content } = matter(raw);

    const sourcePath = toRelative(absPath);
    const verdict = classify(data);

    if (!verdict.include) {
      filteredOut.push({
        sourcePath,
        id: data.id ?? null,
        slug: data.slug ?? null,
        status: data.status ?? null,
        draft: data.draft ?? null,
        reason: verdict.reason,
      });
      continue;
    }

    // Phase 8-b-3：type → contentKind 相容讀取
    //   data.contentKind 為主；若無則 fallback 到 data.type（舊命名）。
    //   保留原始 data 之 type 欄位不刪，避免破壞既有 debug 流程；
    //   兩者並存且值不同之 warning 由 validate-content.js 處理。
    const normalizedData = {
      ...data,
      contentKind: data.contentKind ?? data.type,
    };

    // Phase 8-b-4：接入 .publish.json sidecar
    //   - readPublishSidecar 不 throw；I/O 與 parse 失敗皆轉為 issues
    //   - sidecar 不存在不是錯誤；issues 為空陣列時無需處理
    //   - 本批僅將 sidecar raw data 掛到 post.publish；不做欄位映射
    //     （不寫 post.canonical / post.blogger / post.github / post.cover / post.metaTitle 等，
    //      留待 8-b-5 之後設計欄位優先序與 sidecar 勝/frontmatter fallback 規則）
    //   - sidecar metadata 放 post.sidecars.publish namespace，不攤平到 top-level
    const publishSidecar = await readPublishSidecar(absPath);

    const post = {
      ...normalizedData,
      sourcePath,
      bodyLength: content.length,
      body: content,
      sidecars: {
        publish: {
          exists: publishSidecar.exists,
          path: publishSidecar.path,
          issues: publishSidecar.issues,
        },
      },
    };

    // 僅當 sidecar 存在且 data 非 null 時，將 raw data 掛到 post.publish
    //   exists=false 或 data=null（parse 失敗 / 空檔）時，post.publish 不新增
    if (publishSidecar.exists && publishSidecar.data) {
      post.publish = publishSidecar.data;
    }

    posts.push(post);
  }

  posts.sort((a, b) => {
    const ad = a.date ?? '';
    const bd = b.date ?? '';
    if (ad === bd) return (a.slug ?? '').localeCompare(b.slug ?? '');
    return bd.localeCompare(ad);
  });

  return {
    site,
    totalScanned: files.length,
    totalReady: posts.length,
    totalFiltered: filteredOut.length,
    posts,
    filteredOut,
  };
}
