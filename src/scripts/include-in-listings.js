// Phase 20260623-pm-sp4a-include-in-listings-selector-github-wiring-a：
//   站內列表（home / post-list / category / tag / prev-next）之 includeInListings selector（SP-4a）。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.4
//   + docs/20260623-sp4-include-in-listings-inventory-preflight.md §H（保守、預設輸出不變）
//
// Phase 20260624-sp9b-conservative-precedence-a：
//   接 `platformPolicy.github.includeInListings` override；top-level false 仍最高優先。
//   policy === false → 可排除；policy === true → no-op（不放寬 top-level false）。
//
// Phase 20260624-night-special-page-slice2-listing-selector-optin-landing-a：
//   Slice 2 — download / gated_download 特殊頁 listing 預設 opt-in。
//   per docs/20260624-download-listing-special-page-preflight-spec-lock.md §2.D Slice 2
//   + docs/20260624-sp-download-include-in-listings-opt-in-preanalysis.md §6 Slice 2
//   - contentKind === 'download' 或 pageType ∈ {download, gated_download} 之 post，
//     若 includeInListings 缺省（既未顯式 true 也未顯式 false）→ 預設排除 listing。
//   - top-level includeInListings === true → 明示 opt-in，覆蓋 Slice 2 default-exclude（仍可被 top-level false / policy false 排除）。
//   - normal post（contentKind 非 download 且 pageType 非 download/gated_download）預設仍 include（byte-identical）。
//   - SP-9b precedence 不變：policy false 仍排除；policy true 仍 no-op（不放寬；不另闢 opt-in 路徑）。
//   - 不讀 seo.indexing / robots / includeInSitemap / includeInFeeds（正交；mirror SP-4a 邊界）。
//
// 純函式、零依賴（仰賴同目錄 platform-policy-effective.js 純函式）、無 side effect：可被
//   build-github.js（SP-4a / SP-9b / Slice 2）與未來 listing / feed phase 重用。
//
// Slice 2 邊界（binding，per spec lock §2.D Slice 2）：
//   - 預設行為改變者**僅限** contentKind=download / pageType ∈ {download, gated_download} 之 post；
//     其他 post 之預設行為（include）byte-identical。
//   - top-level includeInListings === false 仍永遠最高優先（policy true 不放寬）。
//   - SP-9b：platformPolicy.github.includeInListings === false 可在 top-level 未顯式排除時排除。
//   - ❌ 本 selector 不由 seo.indexing / includeInSitemap / includeInFeeds / gatedDownload / robots 推導。
//   - ❌ 不改 sitemap selector / robots meta selector / platformPolicy indexing precedence（SP-3 / SP-5a / SP-9b 不變）。

import { resolvePlatformPolicyValue } from './platform-policy-effective.js';

const DOWNLOAD_PAGE_TYPES = new Set(['download', 'gated_download']);

/**
 * 是否屬於 Slice 2 默認排除之特殊頁（contentKind=download 或 pageType ∈ {download, gated_download}）。
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean}
 */
function isDownloadSpecialPage(post) {
  if (!post || typeof post !== 'object') return false;
  if (post.contentKind === 'download') return true;
  if (typeof post.pageType === 'string' && DOWNLOAD_PAGE_TYPES.has(post.pageType)) return true;
  return false;
}

/**
 * 解析 post 之 includeInListings 旗標（lower-level；回傳 strict boolean）。
 *
 * 規則（SP-4a + SP-9b + Slice 2；高 → 低）：
 *   - post.includeInListings === false → false（top-level 顯式排除，最高優先；
 *     policy === true 也不放寬）
 *   - SP-9b：platformPolicy.github.includeInListings === false → false（policy 顯式排除；
 *     inherit / invalid / secret / absent → skip；policy === true 為 no-op）
 *   - post.includeInListings === true → true（明示 opt-in；覆蓋 Slice 2 default-exclude）
 *   - Slice 2：contentKind === 'download' OR pageType ∈ {download, gated_download}
 *     且 includeInListings 非顯式 true（undefined / 非 boolean / inherit / null）→ false
 *     （default-exclude；special page 必須顯式 includeInListings:true 才能留在 listing）
 *   - 其餘（normal post：缺省 / 非 boolean / inherit / invalid / secret / absent）→ true
 *     （預設保底，normal post listing 輸出 byte-identical）
 *
 * 註：
 *   - 非 boolean（string / number / null / object 等）：normal post 視同 undefined 走預設 include；
 *     download special page 同樣不視為「明示 opt-in」→ 套 Slice 2 default-exclude。
 *     validator 已對非法型別 warn（rule 2 `page-include-flag-invalid-type`），此處不重複解讀。
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean} 是否列入站內列表
 */
export function resolveIncludeInListings(post) {
  // 1. top-level 顯式 false → 永遠排除（最高優先；policy true 不得放寬）
  const value = post ? post.includeInListings : undefined;
  if (value === false) return false;
  // 2. SP-9b：platformPolicy.github.includeInListings === false 可額外排除
  //    （policy true → 不放寬上方 top-level false 或 Slice 2 default-exclude；此處只看 false）
  const { value: policyValue, source } = resolvePlatformPolicyValue(post, 'github', 'includeInListings');
  if (source === 'override' && policyValue === false) return false;
  // 3. top-level 顯式 true → 明示 opt-in（覆蓋 Slice 2 default-exclude）
  if (value === true) return true;
  // 4. Slice 2：download / gated_download special page 若未明示 includeInListings:true → 預設排除
  //    （value 為 undefined / 非 boolean / null 等皆不視為 opt-in；含 invalid type fallback）
  if (isDownloadSpecialPage(post)) return false;
  // 5. 其餘（normal post 缺省 / 非 boolean / inherit / invalid / secret / absent）→ 預設 include
  return true;
}

/**
 * 是否將該 post 列入站內列表（home / post-list / category / tag / prev-next）。
 *
 * 薄包裝 resolveIncludeInListings，供 build listing surfaces 以 .filter() 直接套用。
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean}
 */
export function shouldIncludeInListings(post) {
  return resolveIncludeInListings(post);
}
