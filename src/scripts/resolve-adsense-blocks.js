// Phase 20260610-night-10（N7）：AdSense article-block render resolver。
//
// 目的：把 post 之 adsense.blocks[] 結合 settings.ads（client / slots）解析為
//   renderer 可直接使用之 grouped-by-anchor 物件。GitHub Pages 與 Blogger 兩
//   condition render path 將共用同一邏輯（mirror Phase pm-11 之 resolve-affiliate-
//   links.js 之 cross-surface pattern）。
//
// 設計原則（per docs/20260610-night-4-adsense-six-slot-convention-preanalysis.md
//   §4-§7 + night-9 preflight §6-§8）：
//   - side-effect-free pure module（不 import build script / 不跑 main）
//   - 對 null / undefined / wrong-shape input → 回傳 `{}`（不 throw、不 null）
//   - 不消費 legacy `blocks.adsenseTop` / `blocks.adsenseBottom`（既有 EJS L63/L294
//     之 legacy path 仍維持不變）
//   - 不消費 `adsSettings.defaults.blocks[]`（N7 不引此 fallback；deferred）
//   - 不檢查不在 v1 enum 內之 anchor（如 afterIntro / inArticle 等 mid-body
//     anchor）→ 跳過該 block；validator 已對作者警告
//   - 不輸出 internal-only 欄位（surfaces / enabled / note 等不能洩漏到 renderer）
//   - empty `adsenseClient` / empty `slots[slotKey]` → 跳過該 block；
//     生成 `data-ad-client=""` 或 `data-ad-slot=""` 屬無效 AdSense markup
//
// v1 anchor enum（per night-4 §7.2；14 個 block-edge anchor；mid-body anchors deferred）
//   - 與 validate-content.js 之 VALID_ADSENSE_ANCHOR 同源，但為避免循環依賴 /
//     維持 pure module 邊界，本檔自成獨立 Set；如未來擴充須同步更新兩處
const VALID_ADSENSE_ANCHOR = new Set([
  'afterHeader',
  'afterCover',
  'afterBookPhoto',
  'afterAffiliateTop',
  'beforeDownloadBox',
  'afterDownloadBox',
  'beforeAffiliateBottom',
  'afterAffiliateBottom',
  'beforeRelatedLinks',
  'afterRelatedLinks',
  'beforeOtherLinks',
  'afterOtherLinks',
  'beforeHashtags',
  'afterHashtags',
]);

const VALID_ADSENSE_SURFACE = new Set(['blogger', 'pages']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// deriveRenderedAdsenseBlocks：grouped-by-anchor resolved blocks。
//
//   參數：
//     post        - 文章物件；僅讀 post.adsense
//     adsSettings - 完整 settings.ads 物件（caller 須顯式傳入；不從 EJS data 取）
//     surface     - 'blogger' | 'pages'
//
//   回傳：
//     { [anchor: string]: ResolvedBlock[] }
//     - 空 anchor 不會出現於 map（不是 empty array；caller 用 truthy 檢查）
//     - 每 anchor 內陣列已依 order ascending 穩定排序
//
//   ResolvedBlock：
//     { id?, anchor, slotKey, slotId, client, order? }
//     - id   : 非空 string 時帶入；否則 undefined
//     - order: finite number 時帶入；否則 undefined（sort 視為末尾）
export function deriveRenderedAdsenseBlocks(post, adsSettings, surface) {
  // surface 必須是合法值；非合法 surface（含 undefined / null / 非 string） → {}
  if (typeof surface !== 'string' || !VALID_ADSENSE_SURFACE.has(surface)) return {};

  // 全域 gate：adsSettings 必須是 plain object
  if (!isPlainObject(adsSettings)) return {};

  // 全域 gate：enabled 必須嚴格為 true
  if (adsSettings.enabled !== true) return {};

  // 全域 gate：adsenseClient 須為非空 string
  if (!isNonEmptyString(adsSettings.adsenseClient)) return {};
  const client = adsSettings.adsenseClient;

  // 全域 gate：slots 須為 plain object
  if (!isPlainObject(adsSettings.slots)) return {};
  const slots = adsSettings.slots;

  // post-level gate：post 須為 plain object
  if (!isPlainObject(post)) return {};

  const adsense = post.adsense;
  if (!isPlainObject(adsense)) return {};

  // post-level disable：adsense.enabled === false 完全關閉
  if (adsense.enabled === false) return {};

  // blocks gate：須為非空 array
  const blocks = adsense.blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) return {};

  // 逐 block 解析；不在源頭過濾 invalid，每 block 獨立判斷便於 stable order
  const buckets = new Map(); // anchor → ResolvedBlock[]

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // (a) block 須為 plain object
    if (!isPlainObject(block)) continue;

    // (b) enabled gate：enabled === false 跳過（省略視為 enabled）
    if (block.enabled === false) continue;

    // (c) surface gate：
    //     - surfaces 省略 → 預設兩端都 render（per night-4 §6.1；不同於 affiliate）
    //     - surfaces 為 array → 必須含當前 surface 才 render
    //     - surfaces 非 array（含 null / string / object 等 invalid）→ 跳過該 block
    //       （validator 會警告作者；resolver 採嚴格跳過避免誤渲染）
    const surfaces = block.surfaces;
    let surfaceMatches;
    if (surfaces === undefined) {
      surfaceMatches = true;
    } else if (Array.isArray(surfaces)) {
      surfaceMatches = surfaces.includes(surface);
    } else {
      surfaceMatches = false;
    }
    if (!surfaceMatches) continue;

    // (d) anchor gate：須為 v1 enum 內之非空 string
    const anchor = block.anchor;
    if (!isNonEmptyString(anchor)) continue;
    const anchorTrim = anchor.trim();
    if (!VALID_ADSENSE_ANCHOR.has(anchorTrim)) continue;

    // (e) slotKey gate：須為非空 string 且 settings.slots 含該 key
    const slotKey = block.slotKey;
    if (!isNonEmptyString(slotKey)) continue;
    const slotKeyTrim = slotKey.trim();
    if (!Object.prototype.hasOwnProperty.call(slots, slotKeyTrim)) continue;

    // (f) slotId gate：settings.slots[slotKey] 必須是非空 string（safe-mode：
    //     未發 slot id 之版位不 render，避免 data-ad-slot="" 之無效 markup）
    const slotId = slots[slotKeyTrim];
    if (!isNonEmptyString(slotId)) continue;

    // 通過全部 gate；建構 ResolvedBlock（**不**輸出 surfaces / enabled / note）
    const resolved = {
      anchor: anchorTrim,
      slotKey: slotKeyTrim,
      slotId,
      client,
    };
    if (isNonEmptyString(block.id)) resolved.id = block.id;
    if (typeof block.order === 'number' && Number.isFinite(block.order)) {
      resolved.order = block.order;
    }

    if (!buckets.has(anchorTrim)) buckets.set(anchorTrim, []);
    buckets.get(anchorTrim).push(resolved);
  }

  // 每 anchor 內以 order ascending 穩定排序；undefined order 視為 +Infinity（末尾）
  const result = {};
  for (const [anchor, arr] of buckets) {
    arr.sort((a, b) => {
      const oa = a.order === undefined ? Number.POSITIVE_INFINITY : a.order;
      const ob = b.order === undefined ? Number.POSITIVE_INFINITY : b.order;
      return oa - ob;
    });
    result[anchor] = arr;
  }

  return result;
}

// 公開 v1 anchor 列表（read-only；供 smoke / future caller 對齊使用）
export const ADSENSE_V1_ANCHORS = Object.freeze([...VALID_ADSENSE_ANCHOR]);
