// Phase 20260623-pm-sp5a-include-in-sitemap-selector-wiring-a：
//   sitemap inclusion 之 includeInSitemap selector（SP-5a）。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.3
//   + docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md（mirror 慣例）
//
// 純函式、零依賴、無 side effect：封裝 build-sitemap.js 既有 inclusion precedence，
//   並在「既有 safety 仍 eligible」之後疊加 optional 顯式 `includeInSitemap` override。
//
// SP-5a 邊界（binding）：
//   - sitemap inclusion 與 listing inclusion 正交（不讀 includeInListings）。
//   - 既有 safety exclusion 永遠優先（noindex-* / legacy contentKind:download）；
//     includeInSitemap === true **不得**把 noindex / download 頁強塞進 sitemap。
//   - 缺省 / 非 boolean → 完全保留既有 build-sitemap 行為（byte-identical 保證）。
//   - ❌ 不由 includeInListings / includeInFeeds / platformPolicy / gatedDownload / pageType
//     推導 sitemap 排除（本 phase 不新增 pageType sitemap 預設；維持 SP-3 不碰 sitemap 之語意）。

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
 * Precedence（SP-5a；高 → 低）：
 *   1. 既有 safety exclusion 永遠優先：!isSitemapEligible(post) → false
 *      （含 noindex-follow / noindex-nofollow / legacy contentKind:download；
 *       即使 includeInSitemap === true 亦不放行）。
 *   2. eligible 之後：post.includeInSitemap === false → false。
 *   3. eligible 且 includeInSitemap === true → true（顯式 opt-in，但僅在已 eligible 時）。
 *   4. eligible 且缺省（undefined / 缺欄位）→ true（保留既有 build-sitemap 行為）。
 *   5. eligible 且非 boolean（string / number / null / object）→ true（runtime safety；
 *      validator 已對非法型別 warn，此處不重複解讀，僅以既有行為保護輸出）。
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean} 是否列入 sitemap
 */
export function resolveIncludeInSitemap(post) {
  // 1. safety 永遠優先（override 不得放寬）
  if (!isSitemapEligible(post)) return false;
  // 2. 已 eligible：唯一能再排除的是顯式 false
  if (post.includeInSitemap === false) return false;
  // 3–5. 顯式 true / 缺省 / 非 boolean → 沿用既有行為（include）
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
