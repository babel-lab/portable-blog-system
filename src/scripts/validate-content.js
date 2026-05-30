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
// Phase 8-g-12-b：series.titleTemplate placeholder resolver helper（Phase 8-f-4-b 落地之 pure function）
//   - 用於 series-title-unresolved warning 規則之 placeholder 偵測
//   - 與 normalize-post-output / build-promotion 共用同一 helper（資料一致性）
import { resolveTitleTemplate } from './resolve-series-title.js';

// Phase 5-g-3：ERROR 規則常數
const VALID_STATUS = new Set(['draft', 'ready', 'published', 'archived']);
const READY_STATUS = new Set(['ready', 'published']);
const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;

// Phase 5-g-4：WARNING 規則常數
const VALID_SITE = new Set(['github', 'blogger']);
// Phase 8-b-3：VALID_TYPE 改名為 VALID_CONTENT_KIND，並新增 'page' 列舉值
const VALID_CONTENT_KIND = new Set(['post', 'tech-note', 'book-review', 'download', 'comic', 'life-note', 'page']);
// Phase 20260520-seo-2：seo.indexing 顯式欄位之合法列舉值（per docs/seo-indexing-rules.md §3 / §6 SEO-2）
const VALID_SEO_INDEXING = new Set(['index', 'noindex-follow', 'noindex-nofollow']);
const VALID_PRIMARY_PLATFORM = new Set(['github', 'blogger']);
const VALID_PUBLISH_MODE = {
  github: new Set(['full', 'summary']),
  blogger: new Set(['full', 'summary', 'redirect-card']),
};
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const SEARCH_DESCRIPTION_MAX = 200;
const VALID_CANONICAL_RE = /^https?:\/\//;

// Phase 9-e-d-b：book schema mediaType 列舉
//   - 缺省值為 "book"（per docs/book-schema.md §5.1；於 getBookMediaType 處理）
const VALID_BOOK_MEDIA_TYPE = new Set(['book', 'magazine']);

// Phase 9-e-d-c：book authors role 列舉
//   - 列舉值 per docs/book-schema.md §4.5
//   - role 缺省為 "author"（於 book-authors-invalid-role 規則內處理：undefined 不觸發）
const VALID_BOOK_AUTHOR_ROLE = new Set(['author', 'translator', 'illustrator', 'editor', 'other']);

// Phase 9-g-c-c：relatedLinks / otherLinks entry kind 列舉
//   - per docs/related-links-schema.md §3.2 / §4.1
//   - 用於 related-links-entry-kind-invalid 規則之檢查
const VALID_LINK_KIND = new Set(['internal', 'external']);

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

// Phase 9-e-d-b：book schema validate helpers（inline）
//   - isNonEmptyString：non-empty trimmed string 守門；用於 book.issue / book.issn 檢查
//   - getBookMediaType：返回 effective mediaType（缺省 "book"；per docs/book-schema.md §5.1）；
//     book 非 plain object 時返回 undefined（呼叫者已加前置 guard，理論上不會走到 undefined 分支）
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
function getBookMediaType(book) {
  if (!book || typeof book !== 'object' || Array.isArray(book)) return undefined;
  return book.mediaType === undefined ? 'book' : book.mediaType;
}

// Phase 9-e-d-c：book authors / volume / publishedYear validate helpers（inline）
//   - isIntegerOrNull：integer 或 null 視為合法；用於 volume / publishedYear 型別檢查
//   - hasAnyAuthorName：authorEntry 之 displayName / localName / originalName 任一為 non-empty trimmed string；
//     authorEntry 非 plain object 時返回 false（呼叫者已加前置 guard）
function isIntegerOrNull(value) {
  return value === null || Number.isInteger(value);
}
function hasAnyAuthorName(authorEntry) {
  if (!authorEntry || typeof authorEntry !== 'object' || Array.isArray(authorEntry)) return false;
  return (
    isNonEmptyString(authorEntry.displayName) ||
    isNonEmptyString(authorEntry.localName) ||
    isNonEmptyString(authorEntry.originalName)
  );
}

// Phase 20260527-am-8 step-7：active sourceKey 清單（per docs/related-links-schema.md §11.5 step 7）
//   - 從 settings.linkSources.sources 取出 isActive !== false 之 sourceKey 字串
//   - mirror src/scripts/build-github.js buildSourcesByKey 之 isActive 過濾語義；本批不要求 displayLabel 存在
//   - 本批不處理 inactive 專屬規則：inactive source 不在此清單；entry 使用 inactive key 會由 not-found 視角捕捉
//     （per Phase 20260527-am-7 preanalysis §5.1 C.2 + Phase 20260527-am-8 spec 第 4 點選擇）
function buildActiveSourceKeySet(settings) {
  const set = new Set();
  const sources = settings && settings.linkSources && settings.linkSources.sources;
  if (!Array.isArray(sources)) return set;
  for (const s of sources) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
    if (s.isActive === false) continue;
    if (typeof s.sourceKey !== 'string' || s.sourceKey === '') continue;
    set.add(s.sourceKey);
  }
  return set;
}

// Phase 9-g-c-c：relatedLinks / otherLinks 結構檢查 helper（warning-only；4 條 critical 規則）
//   - fieldName: 'relatedLinks' | 'otherLinks'（用於 warning value 前綴；mirror book.authors[${i}] 之 既有 pattern）
//   - value: post[fieldName]
//   - undefined 不觸發；空 array 不觸發（per docs/related-links-schema.md §3.1）
//   - non-array → related-links-not-array；skip entry-level（per Phase 9-g-c-c-a §7.1）
//   - entry 非 plain object（含 array / null / 非 object）→ skip 該 entry
//     （mirror book.authors 既有 pattern；不新增 entry-not-object 規則 per Phase 9-g-c-c-a §7.1）
//   - missing-kind 與 kind-invalid **互斥**：empty string / undefined 算 missing-kind；其他非合法值算 kind-invalid
//     （避免同一 entry 重複噪音；per Phase 9-g-c-c-a §7 之表格）
//   - relatedLinks 與 otherLinks 共用同一 helper（schema 完全相同 per docs §3.1）
// Phase 20260527-am-8 step-7：新增第 5 條 warning related-links-source-key-not-found
//   - 加上 activeSourceKeys 參數（Set<string>）；undefined-safe（caller 必傳；helper 內預期已建構）
//   - 不改既有 4 條 warning 之觸發條件與 value 格式
function validateRelatedLinksField(fieldName, value, sourcePath, issues, activeSourceKeys) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    issues.push({
      severity: 'warning',
      type: 'related-links-not-array',
      sourcePath,
      value: `${fieldName} typeof=${value === null ? 'null' : typeof value}`,
    });
    return;
  }
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;

    const kindMissing =
      entry.kind === undefined ||
      (typeof entry.kind === 'string' && entry.kind.trim() === '');
    if (kindMissing) {
      issues.push({
        severity: 'warning',
        type: 'related-links-entry-missing-kind',
        sourcePath,
        value: `${fieldName}[${i}] kind missing or empty`,
      });
    } else if (!VALID_LINK_KIND.has(entry.kind)) {
      issues.push({
        severity: 'warning',
        type: 'related-links-entry-kind-invalid',
        sourcePath,
        value: `${fieldName}[${i}].kind=${
          typeof entry.kind === 'string' ? `"${entry.kind}"` : `typeof=${typeof entry.kind}`
        } (must be internal/external)`,
      });
    }

    if (!isNonEmptyString(entry.url)) {
      issues.push({
        severity: 'warning',
        type: 'related-links-entry-missing-url',
        sourcePath,
        value: `${fieldName}[${i}] url missing or empty`,
      });
    }

    // Phase 20260527-am-8 step-7：sourceKey 未命中 active registry → warning（warning-only）
    //   - non-empty trimmed string 但不在 activeSourceKeys → related-links-source-key-not-found
    //   - 與既有 4 條 related-links warning 規則（not-array / missing-kind / kind-invalid / missing-url）彼此獨立
    // Phase 20260527-pm-14 step-7-d：新增 invalid-type / empty sourceKey warning（互斥）
    //   - 規則順序（mirror missing-kind / kind-invalid 既有互斥 pattern）：
    //     1. sourceKey !== undefined 且 typeof !== 'string' → invalid-type
    //     2. else if typeof === 'string' 且 trim() === '' → empty
    //     3. else if non-empty string 但不在 activeSourceKeys → not-found（既有；行為不變）
    //   - undefined 不觸發；保留 optional 欄位語意
    //   - 三條規則互斥；同 entry 之 sourceKey 最多觸發 1 條，避免重複噪音
    if (entry.sourceKey !== undefined) {
      if (typeof entry.sourceKey !== 'string') {
        const typeLabel = Array.isArray(entry.sourceKey)
          ? 'array'
          : (entry.sourceKey === null ? 'null' : typeof entry.sourceKey);
        issues.push({
          severity: 'warning',
          type: 'related-links-source-key-invalid-type',
          sourcePath,
          value: `${fieldName}[${i}].sourceKey typeof=${typeLabel} (must be string)`,
        });
      } else if (entry.sourceKey.trim() === '') {
        issues.push({
          severity: 'warning',
          type: 'related-links-source-key-empty',
          sourcePath,
          value: `${fieldName}[${i}].sourceKey is empty or whitespace-only`,
        });
      } else if (!activeSourceKeys.has(entry.sourceKey)) {
        issues.push({
          severity: 'warning',
          type: 'related-links-source-key-not-found',
          sourcePath,
          value: `${fieldName}[${i}].sourceKey="${entry.sourceKey}" not found in link-sources registry`,
        });
      }
    }
  }
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

  // Phase 20260527-am-8 step-7：active sourceKey 清單（一次建構；passed-down 至 validateRelatedLinksField）
  //   - per docs/related-links-schema.md §11.5 step 7（warning-only；本批僅 not-found）
  const activeSourceKeys = buildActiveSourceKeySet(settings);

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
      //   - post.type 仍保留作 debug；以下兩條規則處理命名落差
      //   - Phase 8-h-c：移除 `frontmatter-uses-deprecated-type` warning rule（dormant；0 active caller per docs/phase-8h-c-pre-plan.md §3.2 位置 #1）
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
      // Phase 20260520-seo-2-e：seo block 結構檢查（hardening per SEO-2-d gap candidates）
      //   - 當 post.seo 存在但非 plain object 時觸發 invalid-seo-block warning
      //   - 涵蓋 null / string / number / boolean / array 等非 plain object 之 seo 值
      //   - 與下方 invalid-seo-indexing 互斥：本檢查通過 → seo 為 plain object → 下方檢查才會走 .indexing path
      //   - 採 warning 對齊既有 invalid-seo-indexing / invalid-content-kind 之 severity 慣例
      if (
        post.seo !== undefined &&
        (post.seo === null || typeof post.seo !== 'object' || Array.isArray(post.seo))
      ) {
        issues.push({
          severity: 'warning',
          type: 'invalid-seo-block',
          sourcePath,
          value: String(post.seo),
        });
      }
      // Phase 20260520-seo-2：seo.indexing 顯式欄位之合法列舉值檢查
      //   - 採 warning 對齊既有 invalid-content-kind 之 severity 慣例
      //   - 非 string 或不在 VALID_SEO_INDEXING 中視為 invalid
      //   - 缺欄位（undefined）不觸發；屬合法 fallback path（contentKind=download → SEO-1 / 否則 default）
      if (
        post.seo !== undefined &&
        post.seo !== null &&
        typeof post.seo === 'object' &&
        post.seo.indexing !== undefined &&
        (typeof post.seo.indexing !== 'string' || !VALID_SEO_INDEXING.has(post.seo.indexing))
      ) {
        issues.push({
          severity: 'warning',
          type: 'invalid-seo-indexing',
          sourcePath,
          value: String(post.seo.indexing),
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

      // Phase 20260530-am-7 / am-13：download.fileUrl 結構檢查（warning-only；D1 + D2 + D3）
      //   - download 區塊不存在或非 plain object 時：D1 / D2 / D3 一律跳過
      //   - D2（download-fileurl-invalid-type）：download.fileUrl !== undefined 且非 string → warning
      //     mirror book-volume-invalid-type 既有 pattern
      //   - D1（download-enabled-fileurl-empty）：contentKind === 'download' 且 download.enabled === true
      //     且 fileUrl 為 undefined / empty string / whitespace-only string → warning
      //     mirror CLAUDE.md §13「若 download.enabled: true 但沒有 fileUrl，build 時應警告」
      //   - D3（download-fileurl-invalid-format；Phase 20260530-am-13）：fileUrl 為 non-empty trimmed string
      //     但不符合 `^https?://` → warning
      //     per docs/20260530-download-validation-d3-s1-s2-decision-preanalysis.md §5.8（B-strict regex）
      //     per docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md §6.1（Option D：不允許 relative path）
      //   - D1 / D2 / D3 互斥：fileUrl 非 string 由 D2 接住；string 但空/whitespace 由 D1 接住（限 download 文章）；
      //     其餘 non-empty trimmed string 但非 http(s) 由 D3 接住
      //     （per Phase 20260530-am-5 §7.1 / am-6 §6.1–§6.2 / am-9 §5.2）
      //   - 範圍與 series / book 規則一致：僅 ready / published；loadPosts 已過濾 draft / archived
      //   - 不檢查 URL reachability / Google Drive semantic / preview URL risk / noindex（屬後續 phase 範圍）
      if (post.download && typeof post.download === 'object' && !Array.isArray(post.download)) {
        const download = post.download;
        const fileUrl = download.fileUrl;
        if (fileUrl !== undefined && typeof fileUrl !== 'string') {
          issues.push({
            severity: 'warning',
            type: 'download-fileurl-invalid-type',
            sourcePath,
            value:
              typeof fileUrl === 'number'
                ? `${fileUrl} (non-string)`
                : Array.isArray(fileUrl)
                  ? 'typeof=array'
                  : fileUrl === null
                    ? 'typeof=null'
                    : `typeof=${typeof fileUrl}`,
          });
        } else if (
          post.contentKind === 'download' &&
          download.enabled === true &&
          (fileUrl === undefined ||
            (typeof fileUrl === 'string' && fileUrl.trim() === ''))
        ) {
          issues.push({
            severity: 'warning',
            type: 'download-enabled-fileurl-empty',
            sourcePath,
            value: 'download.enabled=true but download.fileUrl is missing or empty',
          });
        } else if (
          typeof fileUrl === 'string' &&
          fileUrl.trim() !== '' &&
          !/^https?:\/\//.test(fileUrl.trim())
        ) {
          issues.push({
            severity: 'warning',
            type: 'download-fileurl-invalid-format',
            sourcePath,
            value: `download.fileUrl=${fileUrl.trim()} does not match ^https?://`,
          });
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

      // Phase 8-g-12-b：series-title-unresolved（warning-only）
      //   - 觸發：post.normalized.series 存在且為 plain object；series.titleTemplate 為非空 string；
      //     resolveTitleTemplate(...) 返回之 unresolvedPlaceholders.length > 0
      //   - 觸發範圍與既有 series 規則一致（僅 ready/published；drafts/archived 由 load-posts 過濾不進此處）
      //   - 沿用 normalize-post-output 既有之 normalized.series 結構（per Phase 8-f-3-b）；本批不動 normalize
      //   - 不重複觸發既有 series 結構規則：
      //     - series 非 plain object → normalize 不建 normalized.series；本規則前置守門過濾
      //     - series.id invalid / missing → normalize 不建 valid normalized.series；本規則自動不觸發
      //     - 本規則屬「placeholder 解析」面向，與 series-id-not-in-settings（settings 配置）/
      //       series-number-duplicate（編號規劃）獨立；可共存
      //   - 與 fb-md-placeholder-unresolved 形成對稱（後者針對 .fb.md body；本規則針對 series.titleTemplate）
      //   - 沿用 resolve-series-title.js（Phase 8-f-4-b）pure function helper；不修改 helper / normalize / build-promotion
      const normalizedSeries = post.normalized?.series;
      if (
        normalizedSeries &&
        typeof normalizedSeries === 'object' &&
        !Array.isArray(normalizedSeries) &&
        typeof normalizedSeries.titleTemplate === 'string' &&
        normalizedSeries.titleTemplate !== ''
      ) {
        const resolved = resolveTitleTemplate(normalizedSeries.titleTemplate, {
          series: normalizedSeries,
          post: { title: post.title, titleEn: post.titleEn },
        });
        if (resolved.unresolvedPlaceholders.length > 0) {
          const names = resolved.unresolvedPlaceholders
            .map((u) => `{${u.name}}`)
            .join(', ');
          const reasons = resolved.unresolvedPlaceholders
            .map((u) => `${u.name}=${u.reason}`)
            .join(', ');
          issues.push({
            severity: 'warning',
            type: 'series-title-unresolved',
            sourcePath,
            value: `series.id="${normalizedSeries.id ?? ''}"; titleTemplate has unresolved placeholders: ${names} (reasons: ${reasons})`,
          });
        }
      }

      // Phase 9-e-d-b：book schema metadata 結構檢查（warning-only）
      //   - book.mediaType 存在但非 "book"/"magazine" → book-mediatype-invalid
      //   - book.issue 非空字串但 effective mediaType !== "magazine" → book-issue-without-magazine-mediatype
      //   - book.issn 非空字串但 effective mediaType !== "magazine" → book-issn-without-magazine-mediatype
      //   - mediaType 缺省為 "book"（per docs/book-schema.md §5.1）
      //   - 觸發範圍：與既有 series 規則一致（僅 ready/published；drafts/archived 由 load-posts 過濾）
      //   - book 區塊不存在或非 plain object 時：全部規則不觸發
      //   - 不接 normalize-post-output / build pipeline（純 validate 內部）
      if (post.book && typeof post.book === 'object' && !Array.isArray(post.book)) {
        const book = post.book;

        if (book.mediaType !== undefined && !VALID_BOOK_MEDIA_TYPE.has(book.mediaType)) {
          issues.push({
            severity: 'warning',
            type: 'book-mediatype-invalid',
            sourcePath,
            value:
              typeof book.mediaType === 'string'
                ? book.mediaType
                : `typeof=${typeof book.mediaType}`,
          });
        }

        const effectiveMediaType = getBookMediaType(book);

        if (isNonEmptyString(book.issue) && effectiveMediaType !== 'magazine') {
          issues.push({
            severity: 'warning',
            type: 'book-issue-without-magazine-mediatype',
            sourcePath,
            value: `book.issue is set but mediaType="${effectiveMediaType}"`,
          });
        }

        if (isNonEmptyString(book.issn) && effectiveMediaType !== 'magazine') {
          issues.push({
            severity: 'warning',
            type: 'book-issn-without-magazine-mediatype',
            sourcePath,
            value: `book.issn is set but mediaType="${effectiveMediaType}"`,
          });
        }

        // Phase 9-e-d-c：book.volume 型別檢查（warning-only）
        //   - book.volume 存在但非 integer / 非 null → book-volume-invalid-type
        //   - undefined 不觸發；null 合法；integer 合法；
        //     其他（string / float / boolean / array / object）→ warning
        if (book.volume !== undefined && !isIntegerOrNull(book.volume)) {
          issues.push({
            severity: 'warning',
            type: 'book-volume-invalid-type',
            sourcePath,
            value:
              typeof book.volume === 'number'
                ? `${book.volume} (non-integer)`
                : `typeof=${typeof book.volume}`,
          });
        }

        // Phase 9-e-d-c：book.publishedYear 型別檢查（warning-only）
        //   - mirror book.volume 型別檢查
        if (book.publishedYear !== undefined && !isIntegerOrNull(book.publishedYear)) {
          issues.push({
            severity: 'warning',
            type: 'book-published-year-invalid-type',
            sourcePath,
            value:
              typeof book.publishedYear === 'number'
                ? `${book.publishedYear} (non-integer)`
                : `typeof=${typeof book.publishedYear}`,
          });
        }

        // Phase 9-e-d-c：book.authors[] role 列舉值檢查（warning-only）
        //   - book.authors 為 array 時逐 entry 檢查 role
        //   - role === undefined 不觸發（缺省為 "author"，per docs/book-schema.md §4.5）
        //   - role 存在但不在 VALID_BOOK_AUTHOR_ROLE → warning
        //   - authors 非 array 不處理（per 9-e-d-c 限制：不新增 book-authors-invalid-type）
        if (Array.isArray(book.authors)) {
          for (let i = 0; i < book.authors.length; i++) {
            const entry = book.authors[i];
            if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
              if (entry.role !== undefined && !VALID_BOOK_AUTHOR_ROLE.has(entry.role)) {
                issues.push({
                  severity: 'warning',
                  type: 'book-authors-invalid-role',
                  sourcePath,
                  value:
                    typeof entry.role === 'string'
                      ? `authors[${i}].role="${entry.role}"`
                      : `authors[${i}].role typeof=${typeof entry.role}`,
                });
              }
            }
          }
        }

        // Phase 9-e-d-c：book.authors[] entry 空名稱檢查（warning-only）
        //   - book.authors 為 array 時逐 entry 檢查；entry 為 plain object 時：
        //     displayName / localName / originalName 全空 → warning
        //   - **legacy fallback 邊界**：當 i === 0 且 legacy book.author 為 non-empty string 時
        //     不觸發（per docs/book-schema.md §7.1：第 0 位作者可 fallback 到 legacy book.author）
        //   - i ≥ 1 不適用此 fallback（per §7.1：第 1 位以後不回頭抓 legacy book.author）
        if (Array.isArray(book.authors)) {
          for (let i = 0; i < book.authors.length; i++) {
            const entry = book.authors[i];
            if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
              if (!hasAnyAuthorName(entry)) {
                if (i === 0 && isNonEmptyString(book.author)) continue;
                issues.push({
                  severity: 'warning',
                  type: 'book-authors-entry-empty',
                  sourcePath,
                  value: `authors[${i}] has no displayName / localName / originalName`,
                });
              }
            }
          }
        }
      }

      // Phase 9-g-c-c：relatedLinks / otherLinks 結構檢查（warning-only；4 條 critical 規則）
      //   - 沿用既有 series / book 規則範圍：僅 ready / published（drafts/archived 由 loadPosts 過濾）
      //   - relatedLinks 與 otherLinks 共用同一 helper（schema 完全相同）
      //   - undefined / 空 array 合法；non-array → related-links-not-array；entry 非 plain object → skip 該 entry
      //   - missing-kind 與 kind-invalid 互斥（避免同 entry 重複噪音）
      //   - per docs/related-links-schema.md §3.3 / §4.1 / §9.1
      validateRelatedLinksField('relatedLinks', post.relatedLinks, sourcePath, issues, activeSourceKeys);
      validateRelatedLinksField('otherLinks', post.otherLinks, sourcePath, issues, activeSourceKeys);
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

      // Phase 20260521-pm-34：fb-post-url-missing rule（warning-only）
      //   對齊 Admin completeness.fbPublished P3 規則（per pm-11 / docs/fb-sidecar-schema.md §3.5.5）
      //   觸發：.fb.md enabled=true && .md status='published' && fbPostUrl 為空
      //   不觸發：.fb.md 不存在 / enabled=false / status 非 published / fbPostUrl 非空
      //   fbPostedAt / fbPostId / fbCampaign 為補充欄位；不單獨檢查（per Admin loader 同步）
      if (
        fbData &&
        fbData.enabled === true &&
        status === 'published' &&
        (typeof fbData.fbPostUrl !== 'string' || fbData.fbPostUrl === '')
      ) {
        issues.push({
          severity: 'warning',
          type: 'fb-post-url-missing',
          sourcePath,
          value: `.fb.md enabled=true && .md status='published' but fbPostUrl is empty (status=${status})`,
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
