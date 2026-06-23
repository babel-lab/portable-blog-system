// Phase 20260623-pm-sp3-github-page-type-robots-precedence-a：
//   special page-type → robots meta 推導（SP-3）。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.2 / §4
//   + docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md（schema lock）
//
// Phase 20260624-sp9b-conservative-precedence-a：
//   接 `platformPolicy.github.indexing` override，**tighten-only**（per SP-9b locked rules）。
//   override 永不放寬 explicit noindex / contentKind:download / special pageType；只在
//   policy 值嚴格比 base 結果更嚴時生效。
//
// 純函式、零依賴（仰賴同目錄 platform-policy-effective.js 純函式）、無 side effect：可被
//   build-github.js（SP-3 / SP-9b）與未來 sitemap / listing phase 重用。
//
// 命名注意：本模組讀取之為「frontmatter 內容語意 pageType」（封閉列舉，見下），與
//   build-github.js 內部 render-time 區域變數 pageType（home / post-detail / 404 /
//   design-system，純供 SEO/OG）為兩個獨立概念，互不推導。為避免混淆，呼叫端讀
//   post.pageType 時使用 metadataPageType 命名。

// SP-2 鎖定之 pageType 封閉列舉（snake_case）：
//   article  static_page  download  gated_download  landing  utility_hidden
//   redirect_canonical  platform_special

import { resolvePlatformPolicyValue } from './platform-policy-effective.js';

// SP-9b：indexing enum → robots meta string（對齊 build-github.js 既有輸出格式，含空格）
const INDEXING_TO_ROBOTS = {
  'index': 'index, follow',
  'noindex-follow': 'noindex, follow',
  'noindex-nofollow': 'noindex, nofollow',
};

// SP-9b：robots 字串嚴緊度排序（數字大 = 較嚴）；未列入 → undefined（視為 unknown，永不替換）
const ROBOTS_TIGHTNESS = {
  'index, follow': 0,
  'noindex, follow': 1,
  'noindex, nofollow': 2,
};

// SP-9b：是否 candidate 嚴格比 current 更嚴
function isStrictlyTighter(candidate, current) {
  const tc = ROBOTS_TIGHTNESS[candidate];
  const tb = ROBOTS_TIGHTNESS[current];
  if (tc === undefined || tb === undefined) return false;
  return tc > tb;
}

/**
 * 由 frontmatter pageType 推導 robots meta 值。
 *
 * 僅針對「天生不該被索引」之頁面類型回傳明確 robots；其餘（article / static_page /
 * landing / platform_special / 未知值 / 缺省）回傳 null = 不主動推導，交由呼叫端沿用
 * 既有 default（保證既有輸出不變）。
 *
 * robots 字串格式刻意對齊 build-github.js 既有輸出（含空格："noindex, follow"），
 * 確保 byte-identical。
 *
 * @param {string|null|undefined} metadataPageType frontmatter pageType（內容語意）
 * @returns {string|null} robots meta 值，或 null（無推導）
 */
export function derivePageTypeRobots(metadataPageType) {
  switch (metadataPageType) {
    case 'download':
    case 'gated_download':
      // 漏斗後段 / 閘門頁：noindex 但保留 follow 以維持外向連結 PageRank flow
      //   （對齊既有 contentKind=download 之 SEO-1 姿勢，per seo-indexing-rules.md §3）
      return 'noindex, follow';
    case 'redirect_canonical':
      // 純跳轉 / canonical 載體頁：noindex；保留 follow（per preanalysis §4 矩陣）。
      //   canonical 必 explicit 之檢查屬 validator（SP-2 page-redirect-canonical-missing-target），
      //   SP-3 不在此 phase 改 canonical 行為。
      return 'noindex, follow';
    case 'utility_hidden':
      // 工具 / 隱藏頁：noindex, nofollow（對齊既有 buildSeoNoindex 姿勢）
      return 'noindex, nofollow';
    default:
      // article / static_page / landing / platform_special / 未知值 / 缺省 → 不推導
      return null;
  }
}

/**
 * GitHub post detail robots meta 之完整 precedence 解析（純函式）。
 *
 * 優先序（高 → 低）：
 *   1. explicit post.seo.indexing（index / noindex-follow / noindex-nofollow）—— 最高優先
 *   2. legacy contentKind === 'download' safety fallback（noindex, follow）—— 既有 SEO-1，不可降級
 *   3. pageType 推導（derivePageTypeRobots）—— SP-3 新增
 *   4. 既有 default（呼叫端傳入；通常為 commonSeo 之 'index, follow'）
 *   5. SP-9b conservative override：platformPolicy.github.indexing **tighten-only**
 *      - 僅當 policy 值嚴格比 base 結果更嚴時生效（noindex-nofollow > noindex-follow > index）
 *      - 不放寬 explicit noindex / contentKind:download / special pageType / 任何已 noindex 之輸出
 *      - inherit / invalid / secret / absent → 沿用 base
 *
 * 設計保證：
 *   - 缺省（無 seo.indexing / 非 download / 無 pageType / 無 platformPolicy）→ 既有輸出 byte-identical。
 *   - explicit seo.indexing 永遠覆蓋 pageType 推導與 download fallback。
 *   - contentKind=download 之 noindex,follow 永不被 pageType 放寬（download 在 pageType 之前判定）。
 *   - platformPolicy.github.indexing 永遠不能把 noindex 放寬成 index（tighten-only 保證）。
 *
 * @param {object} post post（已解析 frontmatter）
 * @param {string} [defaultRobots='index, follow'] 無任何推導時之 fallback
 * @returns {string} robots meta 值
 */
export function resolvePostDetailRobots(post, defaultRobots = 'index, follow') {
  const baseRobots = computeBaseRobots(post, defaultRobots);

  // SP-9b：platformPolicy.github.indexing tighten-only override
  //   - 只有 source === 'override'（leaf 為合法 enum）才考慮；inherit/invalid/secret/absent → skip
  //   - 嚴格比 base 更嚴才替換；其餘維持 base（含相等、較鬆、unknown）
  const { value: policyIndexing, source } = resolvePlatformPolicyValue(post, 'github', 'indexing');
  if (source === 'override' && typeof policyIndexing === 'string') {
    const policyRobots = INDEXING_TO_ROBOTS[policyIndexing];
    if (policyRobots && isStrictlyTighter(policyRobots, baseRobots)) {
      return policyRobots;
    }
  }
  return baseRobots;
}

// SP-3 既有 precedence 抽出為私有純函式，便於 SP-9b 在末端疊加 tighten-only override。
function computeBaseRobots(post, defaultRobots) {
  const seoIndexing =
    post && post.seo && typeof post.seo.indexing === 'string' ? post.seo.indexing : null;

  // 1. explicit seo.indexing（最高優先）
  if (seoIndexing === 'index') return 'index, follow';
  if (seoIndexing === 'noindex-follow') return 'noindex, follow';
  if (seoIndexing === 'noindex-nofollow') return 'noindex, nofollow';

  // 2. legacy contentKind === 'download' safety（SEO-1；不可被 pageType 放寬）
  if (post && post.contentKind === 'download') return 'noindex, follow';

  // 3. pageType 推導（SP-3）
  const metadataPageType = post && typeof post.pageType === 'string' ? post.pageType : null;
  const derived = derivePageTypeRobots(metadataPageType);
  if (derived) return derived;

  // 4. 既有 default
  return defaultRobots;
}
