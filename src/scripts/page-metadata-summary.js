// Phase 20260623-pm-sp7a-admin-readonly-page-metadata-summary-a：
//   special page-type / indexing metadata 之 Admin read-only summary（SP-7a）。
//   per docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md §E / §F / §G
//   + docs/20260623-special-page-types-indexing-metadata-preanalysis.md（SP-1 架構）
//
// 純函式、零依賴、無 side effect：由 load-admin-posts.js toAdminView() 消費，產出 read-only
//   pageMetadata 投影供 Admin detail panel 顯示。**不**參與 build / render / listing / sitemap /
//   Blogger / GitHub Pages output（那些由 SP-3 / SP-4a / SP-5a helper 在各自 build 端消費）。
//
// 委派既有 helper（不重造 business logic）：
//   - robots effective       → page-type-robots.js  resolvePostDetailRobots / derivePageTypeRobots
//   - listing effective      → include-in-listings.js resolveIncludeInListings
//   - sitemap effective      → include-in-sitemap.js  resolveIncludeInSitemap / isSitemapEligible
//   - indexing summary       → 本檔內 deriveSeoIndexingSummary（mirror load-admin-posts.js
//                              deriveSeoIndexingStatus；同一 seo.indexing 規則）
//
// 🔴 warning / badge 邏輯（derivePageTypeWarnings）為 SP-2 validate-content.js
//   validatePageTypeMetadata 之**逐條 mirror**（rule type 一字不差）。本 phase **刻意不** refactor
//   validate-content.js export（避免動到 pin 住 0/104/94 baseline 之大檔），改以此處最小化重複實作，
//   每條附對映之 SP-2 rule type 註解。**validator（npm run validate:content）仍為 ground truth**；
//   此處僅供 Admin 顯示提示，不改 validator severity / count。
//   未來若把 validatePageTypeMetadata 抽成 export pure helper（byte-identical refactor + baseline
//   不漂移 + smoke），可改為共用同一份以消除本重複（per preanalysis §G.4）。

import { resolvePostDetailRobots, derivePageTypeRobots } from './page-type-robots.js';
import { resolveIncludeInListings } from './include-in-listings.js';
import { resolveIncludeInSitemap, isSitemapEligible } from './include-in-sitemap.js';

// SP-2 鎖定之 pageType 封閉列舉（snake_case；mirror validate-content.js VALID_PAGE_TYPE）
const VALID_PAGE_TYPE = new Set([
  'article',
  'static_page',
  'download',
  'gated_download',
  'landing',
  'utility_hidden',
  'redirect_canonical',
  'platform_special',
]);

// seo.indexing 之 noindex 家族（mirror validate-content.js PAGE_NOINDEX_INDEXING）
const PAGE_NOINDEX_INDEXING = new Set(['noindex-follow', 'noindex-nofollow']);

// gatedDownload 描述子之 disallowed key 名單（mirror validate-content.js GATED_DOWNLOAD_DISALLOWED_KEYS；
//   僅比對 key 名稱、不檢查 / 不 echo value）。命中即作者把 secret / token / 表單回覆 / 私有權限放進
//   repo frontmatter → warning。合法 safe 欄位（mechanism / formEmbedUrl / postSubmitResource）不在名單。
const GATED_DOWNLOAD_DISALLOWED_KEYS = new Set([
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'secret',
  'clientsecret',
  'client_secret',
  'password',
  'passwd',
  'apikey',
  'api_key',
  'authorization',
  'bearer',
  'drivefolderid',
  'drive_folder_id',
  'responses',
  'responsedata',
  'response_data',
  'respondents',
]);

// gatedDownload 之 safe 描述子欄位（preanalysis §2.8）：唯二供 Admin 顯示之 key；
//   其餘 key（含 disallowed）一律不顯示其 value。
const GATED_SAFE_STRING_KEYS = ['mechanism', 'postSubmitResource'];

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// raw include flag → 顯示用 label（不解讀，僅描述作者實填值）。
function rawFlagLabel(value) {
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (value === undefined) return 'auto';
  return `invalid (typeof=${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value})`;
}

/**
 * seo.indexing 摘要（mirror load-admin-posts.js deriveSeoIndexingStatus；同一規則）。
 *   - 無 seo block → default → indexable true
 *   - index → indexable true；noindex-* → indexable false
 *   - 空字串 → default → indexable true
 *   - 不合法值 → indexable null（不猜；validator 以 invalid-seo-indexing warn）
 *
 * @param {object} fm frontmatter
 * @returns {{ value: string, indexable: boolean|null, source: string }}
 */
function deriveSeoIndexingSummary(fm) {
  if (!fm || typeof fm !== 'object') return { value: '', indexable: null, source: 'no-frontmatter' };
  const seo = fm.seo;
  if (!seo || typeof seo !== 'object' || Array.isArray(seo)) {
    return { value: '', indexable: true, source: 'default' };
  }
  const v = typeof seo.indexing === 'string' ? seo.indexing : '';
  if (v === 'index') return { value: v, indexable: true, source: 'frontmatter.seo.indexing' };
  if (v === 'noindex-follow' || v === 'noindex-nofollow') {
    return { value: v, indexable: false, source: 'frontmatter.seo.indexing' };
  }
  if (v === '') return { value: '', indexable: true, source: 'default' };
  return { value: v, indexable: null, source: 'frontmatter.seo.indexing (invalid value)' };
}

/**
 * 推導 robots effective 之來源標籤（mirror resolvePostDetailRobots precedence；僅用於顯示）。
 *   explicit seo.indexing → 'frontmatter.seo.indexing'
 *   legacy contentKind:download → 'legacy contentKind:download'
 *   pageType 推導 → 'pageType'
 *   其餘 → 'default'
 *
 * @param {object} fm frontmatter
 * @returns {string}
 */
function deriveRobotsSource(fm) {
  const seoIndexing =
    fm && fm.seo && typeof fm.seo.indexing === 'string' ? fm.seo.indexing : null;
  if (seoIndexing === 'index' || seoIndexing === 'noindex-follow' || seoIndexing === 'noindex-nofollow') {
    return 'frontmatter.seo.indexing';
  }
  if (fm && fm.contentKind === 'download') return 'legacy contentKind:download';
  const metadataPageType = fm && typeof fm.pageType === 'string' ? fm.pageType : null;
  if (derivePageTypeRobots(metadataPageType)) return 'pageType';
  return 'default';
}

/**
 * gatedDownload 之 safe 投影（**永不**回傳 secret / token / 表單回覆 / 私有權限 value）。
 *   - present：物件是否存在（不論型別）
 *   - mechanism / postSubmitResource：唯二 safe string 描述子（其餘 key 一律不投影 value）
 *   - hasSuspiciousKey：是否含 disallowed key（只回布林 + key 名清單，不 echo value）
 *
 * @param {*} gated fm.gatedDownload
 * @returns {{ present: boolean, isObject: boolean, mechanism: string, postSubmitResource: string, suspiciousKeys: string[] }}
 */
function deriveGatedDownloadSafe(gated) {
  const out = { present: gated !== undefined, isObject: false, mechanism: '', postSubmitResource: '', suspiciousKeys: [] };
  if (!isPlainObject(gated)) return out;
  out.isObject = true;
  for (const k of GATED_SAFE_STRING_KEYS) {
    if (typeof gated[k] === 'string') out[k] = gated[k];
  }
  for (const k of Object.keys(gated)) {
    if (GATED_DOWNLOAD_DISALLOWED_KEYS.has(k.toLowerCase())) out.suspiciousKeys.push(k);
  }
  return out;
}

/**
 * platformPolicy 之 safe 摘要（per-platform indexing / includeInListings；read-only）。
 *   platformPolicy 子欄位 shape validator 屬 deferred（SP-7/SP-8）；此處僅顯示已存在之 primitive 值。
 *
 * @param {*} pp fm.platformPolicy
 * @returns {{ present: boolean, isObject: boolean, platforms: Array<{name:string, indexing:string, includeInListings:(boolean|null)}> }}
 */
function derivePlatformPolicySafe(pp) {
  const out = { present: pp !== undefined, isObject: false, platforms: [] };
  if (!isPlainObject(pp)) return out;
  out.isObject = true;
  for (const name of Object.keys(pp)) {
    const sub = pp[name];
    const entry = { name, indexing: '', includeInListings: null };
    if (isPlainObject(sub)) {
      if (typeof sub.indexing === 'string') entry.indexing = sub.indexing;
      if (typeof sub.includeInListings === 'boolean') entry.includeInListings = sub.includeInListings;
    }
    out.platforms.push(entry);
  }
  return out;
}

/**
 * 逐條 mirror SP-2 validate-content.js validatePageTypeMetadata（warning-only）。
 *   回傳 [{ type, badge, message }]；type 與 SP-2 rule type 一字不差。
 *   **不** echo gatedDownload value（suspicious-field 只列 key 名）。
 *   ⚠️ 此為 SP-2 之 Admin-side mirror（per preanalysis §G.4）；validator 仍為 ground truth。
 *
 * @param {object} fm frontmatter
 * @returns {Array<{type:string, badge:string, message:string}>}
 */
function derivePageTypeWarnings(fm) {
  const warnings = [];
  if (!fm || typeof fm !== 'object') return warnings;

  const seo = fm.seo;
  const seoIndexing = isPlainObject(seo) && typeof seo.indexing === 'string' ? seo.indexing : null;
  const isNoindex = seoIndexing !== null && PAGE_NOINDEX_INDEXING.has(seoIndexing);

  // 1. page-type-invalid：pageType present 但非合法列舉值（含非 string）
  const frontmatterPageType = fm.pageType;
  const pageTypeIsValid =
    typeof frontmatterPageType === 'string' && VALID_PAGE_TYPE.has(frontmatterPageType);
  if (frontmatterPageType !== undefined && !pageTypeIsValid) {
    warnings.push({ type: 'page-type-invalid', badge: 'pageType 非法', message: 'pageType present but not a valid enum value' });
  }

  // 2. page-include-flag-invalid-type：includeIn* present 但非 boolean（per 欄位）
  for (const flag of ['includeInListings', 'includeInSitemap', 'includeInFeeds']) {
    const v = fm[flag];
    if (v !== undefined && typeof v !== 'boolean') {
      warnings.push({ type: 'page-include-flag-invalid-type', badge: `${flag} 型別`, message: `${flag} must be boolean` });
    }
  }

  // 3. page-platform-policy-invalid-type：platformPolicy present 但非 plain object
  if (fm.platformPolicy !== undefined && !isPlainObject(fm.platformPolicy)) {
    warnings.push({ type: 'page-platform-policy-invalid-type', badge: 'platformPolicy 型別', message: 'platformPolicy must be object' });
  }

  // 4. page-gated-download-invalid-type：gatedDownload present 但非 plain object
  const gated = fm.gatedDownload;
  const gatedIsObject = isPlainObject(gated);
  if (gated !== undefined && !gatedIsObject) {
    warnings.push({ type: 'page-gated-download-invalid-type', badge: 'gatedDownload 型別', message: 'gatedDownload must be object' });
  }

  // 10. page-gated-download-suspicious-field：gatedDownload 含 disallowed key（只比對 key 名，不 echo value）
  if (gatedIsObject) {
    for (const k of Object.keys(gated)) {
      if (GATED_DOWNLOAD_DISALLOWED_KEYS.has(k.toLowerCase())) {
        warnings.push({
          type: 'page-gated-download-suspicious-field',
          badge: 'gated 含敏感 key',
          message: `gatedDownload.${k} looks like a secret / token / response / private-permission field; do not store it in repo frontmatter`,
        });
      }
    }
  }

  // 5. page-gated-download-indexed：pageType=gated_download 且 seo.indexing=index（最高風險）
  if (frontmatterPageType === 'gated_download' && seoIndexing === 'index') {
    warnings.push({ type: 'page-gated-download-indexed', badge: 'gated+index', message: 'gated/download page should not be indexed' });
  }

  // 6. page-gated-download-in-listings：pageType=gated_download 且 includeInListings=true
  if (frontmatterPageType === 'gated_download' && fm.includeInListings === true) {
    warnings.push({ type: 'page-gated-download-in-listings', badge: 'gated+listings', message: 'gated/download page should not appear in listings' });
  }

  // 7. page-noindex-in-sitemap：seo.indexing=noindex-* 且 includeInSitemap=true（正交）
  if (isNoindex && fm.includeInSitemap === true) {
    warnings.push({ type: 'page-noindex-in-sitemap', badge: 'noindex+sitemap', message: 'noindex page should not be in sitemap' });
  }

  // 8. page-noindex-in-listings：seo.indexing=noindex-* 且 includeInListings=true（正交）
  if (isNoindex && fm.includeInListings === true) {
    warnings.push({ type: 'page-noindex-in-listings', badge: 'noindex+listings', message: 'noindex page may mislead users into a non-indexed page' });
  }

  // 9. page-redirect-canonical-missing-target：pageType=redirect_canonical 但無明確 canonical
  if (frontmatterPageType === 'redirect_canonical') {
    const canonical = fm.canonical;
    const canonicalMissing =
      canonical === undefined ||
      canonical === null ||
      (typeof canonical === 'string' && (canonical.trim() === '' || canonical.trim() === 'auto'));
    if (canonicalMissing) {
      warnings.push({ type: 'page-redirect-canonical-missing-target', badge: 'redirect 缺 canonical', message: 'redirect_canonical requires an explicit canonical target URL' });
    }
  }

  return warnings;
}

/**
 * 由 frontmatter 投影 Admin read-only pageMetadata view（純函式）。
 *
 * 所有 effective 值委派既有 SP-3 / SP-4a / SP-5a helper；warning mirror SP-2 validator。
 * 缺省欄位 → 顯示 default / current behavior（非 error）。gatedDownload / platformPolicy 只投影
 * safe 欄位（**不**含 secret / token / 表單回覆 / 私有 URL）。
 *
 * @param {object} fm frontmatter（admin loader 之 raw fm）
 * @returns {object} pageMetadata（見下方欄位）
 */
export function derivePageMetadataView(fm) {
  const safeFm = fm && typeof fm === 'object' ? fm : {};

  const rawPageType = typeof safeFm.pageType === 'string' ? safeFm.pageType : '';
  const pageTypePresent = safeFm.pageType !== undefined;
  const pageTypeValid = pageTypePresent
    ? typeof safeFm.pageType === 'string' && VALID_PAGE_TYPE.has(safeFm.pageType)
    : null;

  const seoIndexing = deriveSeoIndexingSummary(safeFm);
  const robotsValue = resolvePostDetailRobots(safeFm, 'index, follow');
  const robotsSource = deriveRobotsSource(safeFm);

  const listingEffective = resolveIncludeInListings(safeFm);
  const sitemapEffective = resolveIncludeInSitemap(safeFm);

  const gated = deriveGatedDownloadSafe(safeFm.gatedDownload);
  const platformPolicy = derivePlatformPolicySafe(safeFm.platformPolicy);
  const warnings = derivePageTypeWarnings(safeFm);

  return {
    pageType: {
      raw: rawPageType,
      present: pageTypePresent,
      valid: pageTypeValid,
      label: rawPageType || 'article (default)',
    },
    seoIndexing,
    robots: { value: robotsValue, source: robotsSource },
    includeInListings: {
      raw: safeFm.includeInListings,
      rawLabel: rawFlagLabel(safeFm.includeInListings),
      effective: listingEffective,
    },
    includeInSitemap: {
      raw: safeFm.includeInSitemap,
      rawLabel: rawFlagLabel(safeFm.includeInSitemap),
      effective: sitemapEffective,
      // sitemap safety（noindex-* / legacy download）之 eligible 旗標，協助說明「為何排除」
      eligible: isSitemapEligible(safeFm),
    },
    includeInFeeds: {
      raw: safeFm.includeInFeeds,
      rawLabel: rawFlagLabel(safeFm.includeInFeeds),
      // 無消費端（preanalysis §2.5）：feed builder 尚未實作
      hasConsumer: false,
    },
    gatedDownload: gated,
    platformPolicy,
    warnings,
    // 收合摘要列用（§F.4）：一眼預覽 indexing · listing · sitemap
    summary: {
      indexable: seoIndexing.indexable,
      listing: listingEffective,
      sitemap: sitemapEffective,
      warningCount: warnings.length,
    },
  };
}
