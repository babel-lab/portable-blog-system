// Phase 20260623-pm-sp4a-include-in-listings-selector-github-wiring-a：
//   站內列表（home / post-list / category / tag / prev-next）之 includeInListings selector（SP-4a）。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.4
//   + docs/20260623-sp4-include-in-listings-inventory-preflight.md §H（保守、預設輸出不變）
//
// 純函式、零依賴、無 side effect：可被 build-github.js（SP-4a）與未來 listing / feed
//   phase 重用。本 phase 僅由 GitHub Pages listing surfaces 消費。
//
// SP-4a 邊界（binding，per inventory §H.3）：
//   - 預設一律 include（缺省 / 非 boolean → true）→ 既有 12 篇 production post（含唯一 visible
//     download `portable-blog-system-mvp`）listing 輸出 byte-identical。
//   - 只有顯式 includeInListings === false 才隱藏。
//   - ❌ 本 selector 不由 contentKind / pageType / seo.indexing / includeInSitemap /
//     includeInFeeds / platformPolicy / gatedDownload 推導 listing 排除（legacy download
//     自動隱藏屬另開之 content migration / policy phase，非 SP-4a 範圍）。

/**
 * 解析 post 之 includeInListings 旗標（lower-level；回傳 strict boolean）。
 *
 * 規則（SP-4a）：
 *   - post.includeInListings === false → false
 *   - post.includeInListings === true  → true
 *   - 缺省（undefined / 缺欄位）          → true（預設保底，確保 byte-identical）
 *   - 非 boolean（string / number / null / object 等）→ true（runtime safety；
 *     validator 已對非法型別 warn，此處不重複解讀，僅以預設 true 保護輸出）
 *
 * @param {object} post post（已解析 frontmatter）
 * @returns {boolean} 是否列入站內列表
 */
export function resolveIncludeInListings(post) {
  const value = post ? post.includeInListings : undefined;
  if (value === false) return false;
  // true / 缺省 / 任何非 boolean 值 → 預設 include
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
