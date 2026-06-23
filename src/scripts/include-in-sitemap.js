// Phase 20260623-pm-sp5a-include-in-sitemap-selector-wiring-a：
//   sitemap inclusion 之 includeInSitemap selector（SP-5a）。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.3
//   + docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md（mirror 慣例）
//
// Phase 20260624-sp9b-conservative-precedence-a：
//   接 `platformPolicy.github.includeInSitemap` override（safety 仍最高優先）。
//   policy === false → 可排除 eligible post；policy === true → no-op（safety 已決定）。
//
// 純函式、零依賴（仰賴同目錄 platform-policy-effective.js 純函式）、無 side effect：
//   封裝 build-sitemap.js 既有 inclusion precedence，並在「既有 safety 仍 eligible」之後
//   疊加 optional 顯式 `includeInSitemap` 與 SP-9b `platformPolicy.github.includeInSitemap` override。
//
// SP-5a / SP-9b 邊界（binding）：
//   - sitemap inclusion 與 listing inclusion 正交（不讀 includeInListings）。
//   - 既有 safety exclusion 永遠優先（noindex-* / legacy contentKind:download）；
//     includeInSitemap === true 或 platformPolicy.github.includeInSitemap === true
//     **不得**把 noindex / download 頁強塞進 sitemap。
//   - 缺省 / 非 boolean / inherit / invalid / secret → 完全保留既有 build-sitemap 行為（byte-identical 保證）。
//   - ❌ 不由 includeInListings / includeInFeeds / gatedDownload / pageType 推導 sitemap 排除
//     （本 phase 不新增 pageType sitemap 預設；維持 SP-3 不碰 sitemap 之語意）。

import { resolvePlatformPolicyValue } from './platform-policy-effective.js';

/**
 * 既有 build-sitemap inclusion safety 判定（SEO-1 / SEO-2，post-detail）。
 *
 * 逐字對齊 build-sitemap.js `buildEntries()` 原 inline precedence：
 *   1. seo.indexing === 'noindex-follow' | 'noindex-nofollow' → 不入 sitemap
 *   2. seo.indexing !== 'index' 且 contentKind === 'download'    → 不入 sitemap（legacy）
 *   3. 其餘                                                       → eligible
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean} 是否通過既有 safety（尚未套 includeInSitemap override）
 */
export function isSitemapEligible(post) {
  if (!post) return false;
  const seoIndexing =
    post.seo && typeof post.seo.indexing === 'string' ? post.seo.indexing : null;
  if (seoIndexing === 'noindex-follow' || seoIndexing === 'noindex-nofollow') return false;
  if (seoIndexing !== 'index' && post.contentKind === 'download') return false;
  return true;
}

/**
 * 解析 post 之 sitemap inclusion（lower-level；回傳 strict boolean）。
 *
 * Precedence（SP-5a + SP-9b；高 → 低）：
 *   1. 既有 safety exclusion 永遠優先：!isSitemapEligible(post) → false
 *      （含 noindex-follow / noindex-nofollow / legacy contentKind:download；
 *       即使 includeInSitemap === true 或 platformPolicy.github.includeInSitemap === true 亦不放行）。
 *   2. eligible 之後：post.includeInSitemap === false → false（top-level 顯式排除）。
 *   3. eligible 之後：SP-9b platformPolicy.github.includeInSitemap === false → false
 *      （policy 顯式排除；inherit / invalid / secret / absent → skip）。
 *   4. eligible 且 includeInSitemap === true / 缺省 / 非 boolean → true（policy true 亦為 no-op）。
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean} 是否列入 sitemap
 */
export function resolveIncludeInSitemap(post) {
  // 1. safety 永遠優先（任何 override 不得放寬）
  if (!isSitemapEligible(post)) return false;
  // 2. 已 eligible：top-level 顯式 false → exclude
  if (post.includeInSitemap === false) return false;
  // 3. SP-9b：platformPolicy.github.includeInSitemap === false 可在 eligible 之後 exclude
  //    （policy === true → 不放寬 safety 已涵蓋；inherit/invalid/secret/absent → 不替換）
  const { value: policyValue, source } = resolvePlatformPolicyValue(post, 'github', 'includeInSitemap');
  if (source === 'override' && policyValue === false) return false;
  // 4. 其餘 → 沿用既有行為（include）
  return true;
}

/**
 * 是否將該 post 列入 sitemap。
 *
 * 薄包裝 resolveIncludeInSitemap，供 build-sitemap.js 以 .filter() / 迴圈直接套用。
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean}
 */
export function shouldIncludeInSitemap(post) {
  return resolveIncludeInSitemap(post);
}
