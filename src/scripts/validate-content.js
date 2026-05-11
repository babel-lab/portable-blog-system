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
// Phase 8-c-3：placeholder resolver helper（純函式；只用於 .fb.md body 檢查）
import { resolvePlaceholders } from './resolve-placeholders.js';

// Phase 5-g-3：ERROR 規則常數
const VALID_STATUS = new Set(['draft', 'ready', 'published', 'archived']);
const READY_STATUS = new Set(['ready', 'published']);
const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;

// Phase 5-g-4：WARNING 規則常數
const VALID_SITE = new Set(['github', 'blogger']);
// Phase 8-b-3：VALID_TYPE 改名為 VALID_CONTENT_KIND，並新增 'page' 列舉值
const VALID_CONTENT_KIND = new Set(['post', 'tech-note', 'book-review', 'download', 'comic', 'life-note', 'page']);
const VALID_PRIMARY_PLATFORM = new Set(['github', 'blogger']);
const VALID_PUBLISH_MODE = {
  github: new Set(['full', 'summary']),
  blogger: new Set(['full', 'summary', 'redirect-card']),
};
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const SEARCH_DESCRIPTION_MAX = 200;
const VALID_CANONICAL_RE = /^https?:\/\//;

// Phase 8-b-6：sidecar / frontmatter 欄位衝突 warning 之欄位清單
//   採 presence-only 檢查（兩邊都有同名欄位即 warn，不比較值）；
//   sidecar 不存在或 sidecar data 缺漏時略過該 sidecar 之檢查。
const PUBLISH_OVERLAP_FIELDS = [
  'title',
  'description',
  'excerpt',
  'slug',
  'canonicalUrl',
  'publishedUrl',
  'status',
  'tags',
  'category',
  'contentKind',
  'type',
];
const FB_OVERLAP_FIELDS = [
  'title',
  'description',
  'excerpt',
  'url',
  'canonicalUrl',
  'publishedUrl',
  'tags',
  'hashtags',
];

// Phase 7-fix-1 (E)：body-leading-h1 規則用
// 偵測 markdown body 第一個非空行是否為 ATX H1（# 後面接空白）。
// 不檢測 setext H1（=== 形式），因 source pattern 罕見且 user 報告場景為 ATX。
function bodyStartsWithAtxH1(body) {
  if (typeof body !== 'string' || body === '') return false;
  const lines = body.split('\n');
  for (const line of lines) {
    if (line.trim() === '') continue;
    return /^#\s+/.test(line);
  }
  return false;
}

// Phase 8-c-3：FB sidecar placeholder / content 之 status × severity 矩陣
//   依 docs/placeholder-resolver-design.md §7 原則：
//     - draft / archived / 未知 status：placeholder unresolved 與 body 空 → warning
//     - ready / published 之 .fb.md body 空 → error
//     - published 之所有 placeholder unresolved → error
//     - ready 之 articleUrl unresolved → error；
//       blogger.publishedUrl 在 target 指向 blogger（含 auto+primaryPlatform=blogger）時 → error；
//       github.publishedUrl 在 target 指向 github 時 → error；其餘 → warning
//   - reason='unsupported-placeholder'（暫不支援之第二批 placeholder 或未知名稱）一律 warning
function severityForFbContentMissing(status) {
  if (status === 'ready' || status === 'published') return 'error';
  return 'warning';
}
function severityForFbPlaceholder(status, placeholderName, reason, target, primaryPlatform) {
  if (reason === 'unsupported-placeholder') return 'warning';
  if (status !== 'ready' && status !== 'published') return 'warning';
  if (status === 'published') return 'error';
  // status === 'ready'
  if (placeholderName === 'articleUrl') return 'error';
  if (placeholderName === 'blogger.publishedUrl') {
    if (target === 'blogger' || (target === 'auto' && primaryPlatform === 'blogger')) return 'error';
    return 'warning';
  }
  if (placeholderName === 'github.publishedUrl') {
    if (target === 'github' || (target === 'auto' && primaryPlatform === 'github')) return 'error';
    return 'warning';
  }
  return 'warning';
}

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

    // Phase 5-g-3 ERROR：invalid-status（任何 status 都檢查；status 非合法值 → 系統無法判斷處理方式）
    const status = post.status;
    if (typeof status !== 'string' || !VALID_STATUS.has(status)) {
      issues.push({
        severity: 'error',
        type: 'invalid-status',
        sourcePath,
        value: status === undefined || status === null ? '(missing)' : String(status),
      });
    }

    // Phase 5-g-3 ERROR + Phase 5-g-4 WARNING
    // 只對 ready / published 觸發；draft / archived 視為作者編輯中或已封存，不警
    if (typeof status === 'string' && READY_STATUS.has(status)) {
      // 5-g-3 ERROR：missing-* / invalid-date-format
      if (!post.title || String(post.title).trim() === '') {
        issues.push({ severity: 'error', type: 'missing-title', sourcePath });
      }
      if (!post.slug || String(post.slug).trim() === '') {
        issues.push({ severity: 'error', type: 'missing-slug', sourcePath });
      }
      if (!post.date || (typeof post.date === 'string' && post.date.trim() === '')) {
        issues.push({ severity: 'error', type: 'missing-date', sourcePath });
      } else if (typeof post.date === 'string' && !DATE_FORMAT_RE.test(post.date)) {
        issues.push({ severity: 'error', type: 'invalid-date-format', sourcePath, value: post.date });
      }

      // 5-g-4 WARNING：SEO 內容品質（必填）
      if (!post.description || (typeof post.description === 'string' && post.description.trim() === '')) {
        issues.push({ severity: 'warning', type: 'missing-description', sourcePath });
      }
      if (!post.category || (typeof post.category === 'string' && post.category.trim() === '')) {
        issues.push({ severity: 'warning', type: 'missing-category', sourcePath });
      }
      if (!post.cover || (typeof post.cover === 'string' && post.cover.trim() === '')) {
        issues.push({ severity: 'warning', type: 'missing-cover', sourcePath });
      }
      const cleanedTags = Array.isArray(post.tags)
        ? post.tags.filter((t) => typeof t === 'string' && t.trim() !== '')
        : [];
      if (cleanedTags.length === 0) {
        issues.push({ severity: 'warning', type: 'empty-tags', sourcePath });
      }

      // Phase 7-fix-1 (E) WARNING：body-leading-h1
      // markdown body 第一個非空行為 ATX H1（# heading）→ 與 article header 的 <h1> 重複。
      // parse-markdown.js 已在 render 階段自動降級 H1 → H2，本警告僅作教育性提示，
      // 建議作者直接以 ## 起手，避免依賴 pipeline 後處理。
      if (bodyStartsWithAtxH1(post.body)) {
        issues.push({ severity: 'warning', type: 'body-leading-h1', sourcePath });
      }

      // 5-g-4 WARNING：SEO 內容品質（長度）
      if (typeof post.title === 'string' && post.title.length > TITLE_MAX) {
        issues.push({ severity: 'warning', type: 'long-title', sourcePath, value: post.title.length });
      }
      if (typeof post.description === 'string' && post.description.length > DESCRIPTION_MAX) {
        issues.push({ severity: 'warning', type: 'long-description', sourcePath, value: post.description.length });
      }
      if (typeof post.searchDescription === 'string' && post.searchDescription.length > SEARCH_DESCRIPTION_MAX) {
        issues.push({ severity: 'warning', type: 'long-search-description', sourcePath, value: post.searchDescription.length });
      }

      // 5-g-4 WARNING：schema 一致性
      if (post.site !== undefined && !VALID_SITE.has(post.site)) {
        issues.push({ severity: 'warning', type: 'invalid-site', sourcePath, value: String(post.site) });
      }
      // Phase 8-b-3：contentKind 相容讀取與舊 type 警告
      //   - post.contentKind 為主（load-posts 在無 contentKind 時自動 fallback 到 data.type）
      //   - post.type 仍保留作 debug；以下三條規則處理命名落差
      if (post.contentKind !== undefined && !VALID_CONTENT_KIND.has(post.contentKind)) {
        issues.push({
          severity: 'warning',
          type: 'invalid-content-kind',
          sourcePath,
          value: String(post.contentKind),
        });
      }
      if (
        post.type !== undefined &&
        post.contentKind !== undefined &&
        post.type !== post.contentKind
      ) {
        issues.push({
          severity: 'warning',
          type: 'contentkind-and-type-conflict',
          sourcePath,
          value: `type=${String(post.type)}, contentKind=${String(post.contentKind)}`,
        });
      }
      if (post.type !== undefined && post.contentKind === post.type) {
        issues.push({
          severity: 'warning',
          type: 'frontmatter-uses-deprecated-type',
          sourcePath,
          value: String(post.type),
        });
      }
      if (post.primaryPlatform !== undefined && !VALID_PRIMARY_PLATFORM.has(post.primaryPlatform)) {
        issues.push({ severity: 'warning', type: 'invalid-primary-platform', sourcePath, value: String(post.primaryPlatform) });
      }
      if (
        typeof post.canonical === 'string' &&
        post.canonical !== '' &&
        post.canonical !== 'auto' &&
        !VALID_CANONICAL_RE.test(post.canonical)
      ) {
        issues.push({ severity: 'warning', type: 'invalid-canonical', sourcePath, value: post.canonical });
      }
      const publishTargets = post.publishTargets || {};
      for (const platform of ['github', 'blogger']) {
        const target = publishTargets[platform];
        if (target && target.enabled === true) {
          const mode = target.mode;
          const validSet = VALID_PUBLISH_MODE[platform];
          if (typeof mode !== 'string' || !validSet.has(mode)) {
            issues.push({
              severity: 'warning',
              type: 'invalid-publish-target-mode',
              sourcePath,
              value: `${platform}:${mode === undefined ? '(missing)' : String(mode)}`,
            });
          }
        }
      }

      // Phase 8-e-5-b：series metadata 結構檢查（warning-only）
      //   - series 區塊存在但非 plain object → series-not-object
      //   - series.id 存在但非 non-empty string → series-id-invalid
      //   - series.number 存在但非正整數 → series-number-invalid
      //   - series.subtitle 存在但非 string → series-subtitle-invalid-type
      //   - 本批不檢查：缺號 / titleTemplate / hashtags 繼承 / series.id 與 _sample.series.json 之對應
      //   - 觸發範圍與 invalid-content-kind / invalid-primary-platform 一致（僅 ready/published；drafts/archived 由 load-posts 過濾不進此處）
      if (post.series !== undefined) {
        if (
          typeof post.series !== 'object' ||
          post.series === null ||
          Array.isArray(post.series)
        ) {
          issues.push({
            severity: 'warning',
            type: 'series-not-object',
            sourcePath,
            value: Array.isArray(post.series)
              ? 'array'
              : post.series === null
                ? 'null'
                : typeof post.series,
          });
        } else {
          const s = post.series;
          if (s.id !== undefined) {
            if (typeof s.id !== 'string' || s.id.trim() === '') {
              issues.push({
                severity: 'warning',
                type: 'series-id-invalid',
                sourcePath,
                value: typeof s.id === 'string' ? '(empty)' : `typeof=${typeof s.id}`,
              });
            } else {
              // Phase 8-g-2-d-b：series-id-not-in-settings（warning-only）
              //   - 觸發：s.id 為 non-empty string 且 settings.series.series 找不到對應 id
              //   - 觸發範圍與既有 series 規則一致（僅 ready/published；drafts/archived 由 load-posts 過濾）
              //   - 不擴充 settings 載入路徑；不修改 loadPosts；不新增 fixture
              //   - settings.series 結構 per docs/series-schema.md §11.3：`{ series: [{ id, ... }, ...] }`
              const seriesEntries = settings.series?.series;
              const seriesArray = Array.isArray(seriesEntries) ? seriesEntries : [];
              const found = seriesArray.some(
                (e) => e && typeof e === 'object' && e.id === s.id,
              );
              if (!found) {
                issues.push({
                  severity: 'warning',
                  type: 'series-id-not-in-settings',
                  sourcePath,
                  value: `"${s.id}" not found in content/settings/series.json (add entry or check for typo)`,
                });
              }

              // Phase 8-g-2-d-c：series-block-missing-number（warning-only）
              //   - 觸發：s.id 為 non-empty string 且 s.number === undefined
              //   - 位於 series-id-invalid 之 else 分支，保證 id 為 valid non-empty string
              //   - 既有 series-number-invalid 處理「number 存在但 invalid」；本規則只處理「number 缺漏」
              //   - 不與既有規則重複觸發；不在 series.id invalid / missing 時觸發
              //   - per docs/series-schema.md §2.1：series 區塊存在時 series.number 為必填
              if (s.number === undefined) {
                issues.push({
                  severity: 'warning',
                  type: 'series-block-missing-number',
                  sourcePath,
                  value: `series.id="${s.id}"; series.number is required when series.id is set (use new-post.js --series-number to specify)`,
                });
              }
            }
          }
          if (s.number !== undefined) {
            if (
              typeof s.number !== 'number' ||
              !Number.isInteger(s.number) ||
              s.number <= 0
            ) {
              issues.push({
                severity: 'warning',
                type: 'series-number-invalid',
                sourcePath,
                value:
                  typeof s.number === 'number'
                    ? String(s.number)
                    : `typeof=${typeof s.number}`,
              });
            }
          }
          if (s.subtitle !== undefined && typeof s.subtitle !== 'string') {
            issues.push({
              severity: 'warning',
              type: 'series-subtitle-invalid-type',
              sourcePath,
              value: `typeof=${typeof s.subtitle}`,
            });
          }

          // Phase 8-g-2-d-d：series-subtitle-without-id（warning-only）
          //   - 觸發：s.subtitle !== undefined 且 s.id === undefined
          //   - 與既有 series-subtitle-invalid-type 職責互補：
          //     既有規則處理「subtitle 存在但型別 invalid」；本規則處理「subtitle 有填但 id 缺漏」之語意警告
          //   - 不在 id 存在（即使 invalid）時觸發：id 為 "" / 非 string 由 series-id-invalid 處理
          //   - 沿用既有 series 規則範圍（ready / published only）
          if (s.id === undefined && s.subtitle !== undefined) {
            issues.push({
              severity: 'warning',
              type: 'series-subtitle-without-id',
              sourcePath,
              value: 'subtitle exists but series.id is missing (series.subtitle must be paired with series.id)',
            });
          }
        }
      }
    }

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

    // Phase 8-b-6：sidecar / frontmatter 欄位衝突 warning
    //   - presence-only 檢查；兩邊都有同名欄位即 warn，不比較值
    //   - .publish.json 不存在或 parse 失敗（post.publish === undefined） → 跳過 publish overlap
    //   - .fb.md 不存在或 parse 失敗（sidecars.facebook.data === null）→ 跳過 fb overlap
    //   - 嚴格 warning（不升 error），不改變 post 欄位值，不阻擋流程
    const publishData = post.publish;
    if (publishData && typeof publishData === 'object') {
      for (const field of PUBLISH_OVERLAP_FIELDS) {
        if (post[field] !== undefined && publishData[field] !== undefined) {
          issues.push({
            severity: 'warning',
            type: 'sidecar-frontmatter-overlap',
            sourcePath,
            value: `${field} in .md frontmatter and .publish.json`,
          });
        }
      }
    }

    const fbSidecar = post.sidecars?.facebook;
    if (
      fbSidecar &&
      fbSidecar.exists === true &&
      fbSidecar.data &&
      typeof fbSidecar.data === 'object'
    ) {
      for (const field of FB_OVERLAP_FIELDS) {
        if (post[field] !== undefined && fbSidecar.data[field] !== undefined) {
          issues.push({
            severity: 'warning',
            type: 'sidecar-frontmatter-overlap',
            sourcePath,
            value: `${field} in .md frontmatter and .fb.md`,
          });
        }
      }
    }

    // Phase 8-c-3：.fb.md placeholder 與 body 內容檢查
    //   - 僅在 .fb.md 存在時檢查（exists=false 不產生本批 warning/error）
    //   - body 為空（trim 後）→ fb-md-content-missing（severityForFbContentMissing）
    //   - body 含 placeholder → 用 resolvePlaceholders 檢查；未解析者依
    //     severityForFbPlaceholder 動態決定 severity
    //   - 不修改 .fb.md body、不修改 post 欄位、不產生 build output
    //   - 不接入 build-promotion（屬 8-c-4）
    if (fbSidecar && fbSidecar.exists === true) {
      const fbBody = typeof fbSidecar.body === 'string' ? fbSidecar.body : '';
      const fbData =
        fbSidecar.data && typeof fbSidecar.data === 'object' ? fbSidecar.data : null;

      if (fbBody.trim() === '') {
        issues.push({
          severity: severityForFbContentMissing(status),
          type: 'fb-md-content-missing',
          sourcePath,
          value: `.fb.md body is empty (status=${status ?? '(none)'})`,
        });
      } else {
        const fbTarget =
          fbData && typeof fbData.target === 'string' ? fbData.target : 'auto';
        const fbPrimaryPlatform =
          typeof post.primaryPlatform === 'string' ? post.primaryPlatform : 'blogger';

        const resolved = resolvePlaceholders(
          fbBody,
          { post, publish: post.publish ?? null, facebook: fbData },
          { target: fbTarget, primaryPlatform: fbPrimaryPlatform },
        );

        for (const u of resolved.unresolvedPlaceholders) {
          issues.push({
            severity: severityForFbPlaceholder(
              status,
              u.name,
              u.reason,
              fbTarget,
              fbPrimaryPlatform,
            ),
            type: 'fb-md-placeholder-unresolved',
            sourcePath,
            value: `{{ ${u.name} }} unresolved in .fb.md (status=${status ?? '(none)'}): ${u.reason}`,
          });
        }
      }

      // Phase 8-e-5-b：.fb.md titleEn 型別檢查（warning-only）
      //   - titleEn 為 .fb.md 之選填欄位（Phase 8-e-2 落地至 fb-sidecar-schema.md §3.1）
      //   - 存在但非 string → fb-md-titleEn-invalid-type
      //   - 空字串視為合法（fallback 至 .md frontmatter titleEn）
      //   - 觸發範圍與其他 fb-md-* 規則一致（僅當 .fb.md 存在）
      if (fbData && fbData.titleEn !== undefined && typeof fbData.titleEn !== 'string') {
        issues.push({
          severity: 'warning',
          type: 'fb-md-titleEn-invalid-type',
          sourcePath,
          value: `typeof=${typeof fbData.titleEn}`,
        });
      }
    }
  }

  // Phase 5-g-3 ERROR：duplicate-slug 全集合掃描（每篇命中都加一條 ERROR）
  const slugMap = new Map();
  for (const post of posts) {
    const s = post.slug;
    if (typeof s === 'string' && s.trim() !== '') {
      const key = s.trim();
      if (!slugMap.has(key)) slugMap.set(key, []);
      slugMap.get(key).push(post.sourcePath);
    }
  }
  for (const [slug, paths] of slugMap) {
    if (paths.length >= 2) {
      for (const p of paths) {
        issues.push({ severity: 'error', type: 'duplicate-slug', sourcePath: p, value: slug });
      }
    }
  }

  // Phase 8-g-2-d-e-b：series-number-duplicate 全集合掃描（warning-only）
  //   - 觸發：同 series.id 下 ≥ 2 篇 ready/published posts 共用 series.number
  //   - 前置：series 為 plain object；series.id 為 valid non-empty string；
  //     series.number 為 valid positive integer
  //   - id / number 為 invalid / missing 不參與 grouping，分別由
  //     series-id-invalid / series-block-missing-number / series-number-invalid 處理
  //   - id valid 但不在 settings.series.series：仍參與 grouping
  //     （series-id-not-in-settings 與本規則為獨立面向之 warning，可共存）
  //   - 範圍：沿用 loadPosts 既有 ready / published 過濾；不處理 draft / archived
  //   - 沿用 duplicate-slug cross-post pattern；每篇衝突文章皆各自 push 一條 warning
  const seriesNumberMap = new Map();
  for (const post of posts) {
    const s = post.series;
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
    if (typeof s.id !== 'string' || s.id.trim() === '') continue;
    if (
      typeof s.number !== 'number' ||
      !Number.isInteger(s.number) ||
      s.number <= 0
    ) continue;
    const key = `${s.id}::${s.number}`;
    if (!seriesNumberMap.has(key)) seriesNumberMap.set(key, []);
    seriesNumberMap.get(key).push({
      sourcePath: post.sourcePath,
      id: s.id,
      number: s.number,
    });
  }
  for (const [, entries] of seriesNumberMap) {
    if (entries.length >= 2) {
      for (const entry of entries) {
        issues.push({
          severity: 'warning',
          type: 'series-number-duplicate',
          sourcePath: entry.sourcePath,
          value: `series.id="${entry.id}", series.number=${entry.number}`,
        });
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
  // Phase 8-f-2-b：plumbing — 將 settings 轉發給 loadPosts → processMarkdownEntry → normalizePostOutput
  //   - 本批僅資料通道；normalize-post-output 目前仍未使用 settings.series（屬 8-f-3 範圍）
  //   - validate 規則邏輯零變動；現有 baseline（0 error / 9 warning on 5 post(s)）不變
  const github = await loadPosts({ site: 'github', settings });
  const blogger = await loadPosts({ site: 'blogger', settings });

  // Phase 8-e-6-b-1：額外掃 content/validation-fixtures/{github,blogger}/posts/
  //   - 透過 loadPosts 之 site 參數傳入相對子路徑（loadPosts 內部 baseDir = content/{site}/posts）
  //   - 目錄不存在時 fast-glob 返回空陣列；loadPosts graceful 返回空 posts，不報錯
  //   - fixtures 與正式 posts 合併進 validateContent；既有 validateContent() 規則邏輯零變動
  //   - 不影響 build:github / build:blogger / build:promotion（三端 loader 路徑為 content/{site}/posts，不涉及 validation-fixtures/）
  //   - 本批僅 main entry 修改；不修改 validateContent() 內任何規則；不修改 load-posts.js
  //   - 本批不新增 fixture 檔案、不新增 validation-fixtures 目錄（屬 8-e-6-b-2 範圍）
  // Phase 8-f-2-b：fixtures loadPosts 同樣傳入 settings（plumbing 一致性）
  const fixturesGithub = await loadPosts({ site: 'validation-fixtures/github', settings });
  const fixturesBlogger = await loadPosts({ site: 'validation-fixtures/blogger', settings });

  const posts = [
    ...github.posts,
    ...blogger.posts,
    ...fixturesGithub.posts,
    ...fixturesBlogger.posts,
  ];
  const result = validateContent({ posts, settings });
  printIssues(result.issues);
  if (result.errorCount > 0) {
    process.exit(1);
  }
}
