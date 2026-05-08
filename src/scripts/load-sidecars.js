// Phase 8-b-2：sidecar I/O helper（純 I/O，不接入 load-posts、不做合併、不做 schema 驗證）
//
// 設計來源：docs/sidecar-io-helper-design.md §3 ~ §6
//
// 本檔職責（helper 邊界）：
//   - 檔案定位：依 markdownPath 推導 .publish.json 與 .fb.md 路徑
//   - 讀取：fs.readFile 容錯（區分 ENOENT 與其他 I/O 錯誤）
//   - parse：JSON.parse / gray-matter 容錯
//   - 低階 I/O issue：parse-failed / read-failed / empty-file
//
// 不做事項（屬其他層）：
//   - 不合併 sidecar data 到 post（屬後續批次 load-posts 接入）
//   - 不做 schema 完整性檢查（屬 validate-content）
//   - 不做欄位衝突檢查（屬 validate-content）
//   - 不做 placeholder 解析（屬 build / 8-c）
//   - 不做 pages/ 支援（屬延後批次）
//   - 不做 build output 比對

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// ─────────────────────────────────────────────────────────────
// 內部工具
// ─────────────────────────────────────────────────────────────

function toRelativePath(p) {
  const abs = path.isAbsolute(p) ? p : path.resolve(PROJECT_ROOT, p);
  return path.relative(PROJECT_ROOT, abs).split(path.sep).join('/');
}

function makeIssue({ severity, type, sidecarPath, message, sourcePath }) {
  const issue = { severity, type, sidecarPath, message };
  if (sourcePath !== undefined) issue.sourcePath = sourcePath;
  return issue;
}

// ─────────────────────────────────────────────────────────────
// §3.2 / §2.3：純路徑推導
// ─────────────────────────────────────────────────────────────

export function getSidecarPaths(markdownPath) {
  const dir = path.dirname(markdownPath);
  const ext = path.extname(markdownPath); // 通常為 ".md"
  const stem = path.basename(markdownPath, ext);
  return {
    publishPath: path.join(dir, `${stem}.publish.json`),
    facebookPath: path.join(dir, `${stem}.fb.md`),
  };
}

// ─────────────────────────────────────────────────────────────
// §4：readPublishSidecar
// ─────────────────────────────────────────────────────────────

export async function readPublishSidecar(markdownPath) {
  const { publishPath } = getSidecarPaths(markdownPath);
  const relPath = toRelativePath(publishPath);
  const sourcePath = toRelativePath(markdownPath);

  let raw;
  try {
    raw = await fs.readFile(publishPath, 'utf-8');
  } catch (err) {
    // 檔案不存在：不是 error
    if (err.code === 'ENOENT') {
      return { exists: false, path: relPath, data: null, issues: [] };
    }
    // 讀檔失敗（非 ENOENT）：保守填 exists=false，issues 帶 error
    return {
      exists: false,
      path: relPath,
      data: null,
      issues: [
        makeIssue({
          severity: 'error',
          type: 'sidecar-read-failed',
          sidecarPath: relPath,
          message: `Failed to read .publish.json: ${err.message}`,
          sourcePath,
        }),
      ],
    };
  }

  // 空檔案：parse 之前先判斷
  if (raw.trim() === '') {
    return {
      exists: true,
      path: relPath,
      data: null,
      issues: [
        makeIssue({
          severity: 'warning',
          type: 'sidecar-empty-file',
          sidecarPath: relPath,
          message: '.publish.json is empty',
          sourcePath,
        }),
      ],
    };
  }

  // JSON parse
  try {
    const data = JSON.parse(raw);
    return { exists: true, path: relPath, data, issues: [] };
  } catch (err) {
    return {
      exists: true,
      path: relPath,
      data: null,
      issues: [
        makeIssue({
          severity: 'error',
          type: 'publish-json-parse-failed',
          sidecarPath: relPath,
          message: `JSON.parse failed: ${err.message}`,
          sourcePath,
        }),
      ],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// §5：readFacebookSidecar
//
//   注意：
//     - body 保留純文字（不丟給 parse-markdown.js）
//     - 不解析 placeholder（{{ articleUrl }} 等）
// ─────────────────────────────────────────────────────────────

export async function readFacebookSidecar(markdownPath) {
  const { facebookPath } = getSidecarPaths(markdownPath);
  const relPath = toRelativePath(facebookPath);
  const sourcePath = toRelativePath(markdownPath);

  let raw;
  try {
    raw = await fs.readFile(facebookPath, 'utf-8');
  } catch (err) {
    // 檔案不存在：不是 error
    if (err.code === 'ENOENT') {
      return { exists: false, path: relPath, data: null, body: '', issues: [] };
    }
    // 讀檔失敗（非 ENOENT）：保守填 exists=false，issues 帶 error
    return {
      exists: false,
      path: relPath,
      data: null,
      body: '',
      issues: [
        makeIssue({
          severity: 'error',
          type: 'sidecar-read-failed',
          sidecarPath: relPath,
          message: `Failed to read .fb.md: ${err.message}`,
          sourcePath,
        }),
      ],
    };
  }

  // 空檔案
  if (raw.trim() === '') {
    return {
      exists: true,
      path: relPath,
      data: null,
      body: '',
      issues: [
        makeIssue({
          severity: 'warning',
          type: 'sidecar-empty-file',
          sidecarPath: relPath,
          message: '.fb.md is empty',
          sourcePath,
        }),
      ],
    };
  }

  // gray-matter parse
  try {
    const parsed = matter(raw);
    return {
      exists: true,
      path: relPath,
      data: parsed.data ?? null,
      body: parsed.content ?? '',
      issues: [],
    };
  } catch (err) {
    return {
      exists: true,
      path: relPath,
      data: null,
      body: '',
      issues: [
        makeIssue({
          severity: 'error',
          type: 'fb-md-parse-failed',
          sidecarPath: relPath,
          message: `gray-matter parse failed: ${err.message}`,
          sourcePath,
        }),
      ],
    };
  }
}

// ─────────────────────────────────────────────────────────────
// §3.2：readPostSidecars（一次讀取兩個 sidecar）
// ─────────────────────────────────────────────────────────────

export async function readPostSidecars(markdownPath) {
  const [publish, facebook] = await Promise.all([
    readPublishSidecar(markdownPath),
    readFacebookSidecar(markdownPath),
  ]);
  return {
    publish,
    facebook,
    issues: [...publish.issues, ...facebook.issues],
  };
}
