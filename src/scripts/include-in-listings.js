// Phase 20260623-pm-sp4a-include-in-listings-selector-github-wiring-a：
//   站內列表（home / post-list / category / tag / prev-next）之 includeInListings selector（SP-4a）。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.4
//   + docs/20260623-sp4-include-in-listings-inventory-preflight.md §H（保守、預設輸出不變）
//
// Phase 20260624-sp9b-conservative-precedence-a：
//   接 `platformPolicy.github.includeInListings` override；top-level false 仍最高優先。
//   policy === false → 可排除；policy === true → no-op（不放寬 top-level false）。
//
// 純函式、零依賴（仰賴同目錄 platform-policy-effective.js 純函式）、無 side effect：可被
//   build-github.js（SP-4a / SP-9b）與未來 listing / feed phase 重用。
//
// SP-4a / SP-9b 邊界（binding，per inventory §H.3）：
//   - 預設一律 include（缺省 / 非 boolean / inherit / invalid / secret → true）。
//   - top-level includeInListings === false 永遠勝出（policy true 也不放寬）。
//   - SP-9b：platformPolicy.github.includeInListings === false 可在 top-level 未排除時排除。
//   - ❌ 本 selector 不由 contentKind / pageType / seo.indexing / includeInSitemap /
//     includeInFeeds / gatedDownload 推導 listing 排除（legacy download 自動隱藏屬另開之 content
//     migration / policy phase，非 SP-4a / SP-9b 範圍）。

import { resolvePlatformPolicyValue } from './platform-policy-effective.js';

/**
 * 解析 post 之 includeInListings 旗標（lower-level；回傳 strict boolean）。
 *
 * 規則（SP-4a + SP-9b；高 → 低）：
 *   - post.includeInListings === false → false（top-level 顯式排除，最高優先；
 *     policy === true 也不放寬）
 *   - SP-9b：platformPolicy.github.includeInListings === false → false（policy 顯式排除；
 *     inherit / invalid / secret / absent → skip）
 *   - post.includeInListings === true → true
 *   - 缺省（undefined / 缺欄位）→ true（預設保底，確保 byte-identical）
 *   - 非 boolean（string / number / null / object 等）→ true（runtime safety；
 *     validator 已對非法型別 warn，此處不重複解讀，僅以預設 true 保護輸出）
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean} 是否列入站內列表
 */
export function resolveIncludeInListings(post) {
  // 1. top-level 顯式 false → 永遠排除（最高優先；policy true 不得放寬）
  const value = post ? post.includeInListings : undefined;
  if (value === false) return false;
  // 2. SP-9b：platformPolicy.github.includeInListings === false 可額外排除
  //    （policy true → 不放寬上方 top-level false；此處只看 false）
  const { value: policyValue, source } = resolvePlatformPolicyValue(post, 'github', 'includeInListings');
  if (source === 'override' && policyValue === false) return false;
  // 3. 其餘（true / 缺省 / 非 boolean / inherit / invalid / secret / absent）→ 預設 include
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
