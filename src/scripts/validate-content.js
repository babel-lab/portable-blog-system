#!/usr/bin/env node
// Phase 5-g-2：severity 機制基礎建設
//   - issue.severity ∈ { 'error', 'warning' }
//   - 既有 10 條規則維持 'warning'（4 條 category/tag + 6 條 promotion-* from 4-g）；不升 error
//   - 5-g-3 起再加 ERROR 規則
//   - main 模式 exit code：errorCount > 0 → process.exit(1)；warning-only → 0；無 issue → 0
//   - 程式錯誤（檔案缺漏 / JSON / frontmatter parse fail）→ 由 node 預設拋例外 / 退出非 0
//   - build-github / build-blogger 仍呼叫 validateContent / printWarnings 維持向後相容
//     （回傳物件保留 `warnings` 欄位，內容為 severity:'warning' 的子集合）

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSettings } from './load-settings.js';
import { loadPosts } from './load-posts.js';

export function validateContent({ posts, settings }) {
  const issues = [];

  const categoryById = new Map();
  const categoryBySlug = new Map();
  for (const c of settings.categories || []) {
    if (c.id) categoryById.set(c.id, c);
    if (c.slug) categoryBySlug.set(c.slug, c);
  }

  const tagById = new Map();
  const tagBySlug = new Map();
  for (const t of settings.tags || []) {
    if (t.id) tagById.set(t.id, t);
    if (t.slug) tagBySlug.set(t.slug, t);
  }

  // Phase 4-g：promotion.facebook 配置快取
  const fbConfig = settings.promotion?.facebook ?? {};
  const fbGloballyEnabled = fbConfig.enabled === true;
  const VALID_ABS_URL_RE = /^https?:\/\//;

  for (const post of posts) {
    const sourcePath = post.sourcePath;

    if (post.category) {
      const cat = categoryById.get(post.category) || categoryBySlug.get(post.category);
      if (!cat) {
        issues.push({ severity: 'warning', type: 'unknown-category', sourcePath, value: post.category });
      } else if (post.site && Array.isArray(cat.site) && !cat.site.includes(post.site)) {
        issues.push({ severity: 'warning', type: 'category-site-mismatch', sourcePath, value: post.category, site: post.site });
      }
    }

    for (const tag of post.tags || []) {
      const t = tagById.get(tag) || tagBySlug.get(tag);
      if (!t) {
        issues.push({ severity: 'warning', type: 'unknown-tag', sourcePath, value: tag });
      } else if (post.site && Array.isArray(t.site) && !t.site.includes(post.site)) {
        issues.push({ severity: 'warning', type: 'tag-site-mismatch', sourcePath, value: tag, site: post.site });
      }
    }

    // Phase 4-g：promotion.facebook 驗證
    // 僅當 post 自己 enabled 才觸發；enabled=false 視為作者明確選擇不發 FB
    const fb = post.promotion?.facebook;
    if (fb && fb.enabled === true) {
      // P0: 推廣文案必填
      if (!fb.message || String(fb.message).trim() === '') {
        issues.push({ severity: 'warning', type: 'promotion-message-missing', sourcePath });
      }
      // P0: hashtags 必填非空
      const cleanedHashtags = Array.isArray(fb.hashtags)
        ? fb.hashtags.filter((h) => typeof h === 'string' && h.trim() !== '')
        : [];
      if (cleanedHashtags.length === 0) {
        issues.push({ severity: 'warning', type: 'promotion-hashtags-empty', sourcePath });
      }
      // P0: page 必須存在於 promotion.config.json 且未停用
      const page = fb.page || fbConfig.defaultPage || null;
      if (page) {
        const pageDef = fbConfig.pages?.[page];
        if (!pageDef) {
          issues.push({ severity: 'warning', type: 'promotion-page-unknown', sourcePath, value: page });
        } else if (pageDef.enabled !== true) {
          issues.push({ severity: 'warning', type: 'promotion-page-disabled', sourcePath, value: page });
        }
      }
      // P0: target 須為 auto / 空 / 合法 http(s) URL
      const target = fb.target;
      if (
        typeof target === 'string' &&
        target !== '' &&
        target !== 'auto' &&
        !VALID_ABS_URL_RE.test(target)
      ) {
        issues.push({ severity: 'warning', type: 'promotion-target-invalid', sourcePath, value: target });
      }
      // P1: 全域停用診斷（不阻擋）
      if (!fbGloballyEnabled) {
        issues.push({ severity: 'warning', type: 'promotion-globally-disabled', sourcePath });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return {
    issues,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
    count: issues.length,
  };
}

// Phase 5-g-2：新增 printIssues — 區分 severity 印出
export function printIssues(issues) {
  if (!Array.isArray(issues) || issues.length === 0) {
    console.log('[validate-content] 0 issue(s)');
    return;
  }
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity !== 'error');

  const byPath = new Map();
  for (const i of issues) {
    if (!byPath.has(i.sourcePath)) byPath.set(i.sourcePath, []);
    byPath.get(i.sourcePath).push(i);
  }
  for (const [p, list] of byPath) {
    console.warn(`[validate-content] post: ${p}`);
    for (const i of list) {
      const sev = (i.severity || 'warning').toUpperCase();
      const valuePart = i.value !== undefined ? `: ${i.value}` : '';
      const extra = i.site ? ` (site=${i.site})` : '';
      console.warn(`[validate-content]   - [${sev}] ${i.type}${valuePart}${extra}`);
    }
  }
  console.warn(
    `[validate-content] ${errors.length} error(s) / ${warnings.length} warning(s) on ${byPath.size} post(s)`,
  );
}

// 向後相容：build-github / build-blogger 仍呼叫 printWarnings(warnings)
//   接收 warnings 陣列；輸出維持 5-g-2 之前的「N warning(s)」格式
//   避免既有 build console 因 5-g-2 引入 severity 機制而變化
export function printWarnings(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    console.log('[validate-content] 0 warning(s)');
    return;
  }
  const byPath = new Map();
  for (const w of arr) {
    if (!byPath.has(w.sourcePath)) byPath.set(w.sourcePath, []);
    byPath.get(w.sourcePath).push(w);
  }
  for (const [p, ws] of byPath) {
    console.warn(`[validate-content] post: ${p}`);
    for (const w of ws) {
      const valuePart = w.value !== undefined ? `: ${w.value}` : '';
      const extra = w.site ? ` (site=${w.site})` : '';
      console.warn(`[validate-content]   - ${w.type}${valuePart}${extra}`);
    }
  }
  console.warn(`[validate-content] ${arr.length} warning(s) on ${byPath.size} post(s)`);
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMain) {
  const settings = await loadSettings();
  // Phase 4-g：main 模式同時檢查 github + blogger
  // build:github / build:blogger 仍依各自呼叫方傳入的 posts 範圍處理
  const github = await loadPosts({ site: 'github' });
  const blogger = await loadPosts({ site: 'blogger' });
  const posts = [...github.posts, ...blogger.posts];
  const result = validateContent({ posts, settings });
  printIssues(result.issues);
  if (result.errorCount > 0) {
    process.exit(1);
  }
}
