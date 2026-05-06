#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadSettings } from './load-settings.js';
import { loadPosts } from './load-posts.js';

export function validateContent({ posts, settings }) {
  const warnings = [];

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
        warnings.push({ type: 'unknown-category', sourcePath, value: post.category });
      } else if (post.site && Array.isArray(cat.site) && !cat.site.includes(post.site)) {
        warnings.push({ type: 'category-site-mismatch', sourcePath, value: post.category, site: post.site });
      }
    }

    for (const tag of post.tags || []) {
      const t = tagById.get(tag) || tagBySlug.get(tag);
      if (!t) {
        warnings.push({ type: 'unknown-tag', sourcePath, value: tag });
      } else if (post.site && Array.isArray(t.site) && !t.site.includes(post.site)) {
        warnings.push({ type: 'tag-site-mismatch', sourcePath, value: tag, site: post.site });
      }
    }

    // Phase 4-g：promotion.facebook 驗證
    // 僅當 post 自己 enabled 才觸發；enabled=false 視為作者明確選擇不發 FB
    const fb = post.promotion?.facebook;
    if (fb && fb.enabled === true) {
      // P0: 推廣文案必填
      if (!fb.message || String(fb.message).trim() === '') {
        warnings.push({ type: 'promotion-message-missing', sourcePath });
      }
      // P0: hashtags 必填非空
      const cleanedHashtags = Array.isArray(fb.hashtags)
        ? fb.hashtags.filter((h) => typeof h === 'string' && h.trim() !== '')
        : [];
      if (cleanedHashtags.length === 0) {
        warnings.push({ type: 'promotion-hashtags-empty', sourcePath });
      }
      // P0: page 必須存在於 promotion.config.json 且未停用
      const page = fb.page || fbConfig.defaultPage || null;
      if (page) {
        const pageDef = fbConfig.pages?.[page];
        if (!pageDef) {
          warnings.push({ type: 'promotion-page-unknown', sourcePath, value: page });
        } else if (pageDef.enabled !== true) {
          warnings.push({ type: 'promotion-page-disabled', sourcePath, value: page });
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
        warnings.push({ type: 'promotion-target-invalid', sourcePath, value: target });
      }
      // P1: 全域停用診斷（不阻擋）
      if (!fbGloballyEnabled) {
        warnings.push({ type: 'promotion-globally-disabled', sourcePath });
      }
    }
  }

  return { warnings, count: warnings.length };
}

export function printWarnings(warnings) {
  if (warnings.length === 0) {
    console.log('[validate-content] 0 warning(s)');
    return;
  }
  const byPath = new Map();
  for (const w of warnings) {
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
  console.warn(`[validate-content] ${warnings.length} warning(s) on ${byPath.size} post(s)`);
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
  const { warnings } = validateContent({ posts, settings });
  printWarnings(warnings);
}
