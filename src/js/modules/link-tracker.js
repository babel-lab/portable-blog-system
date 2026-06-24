// Phase 5-d：全域 click 委派監聽，讀 data-ga4-* 屬性 → 派發 GA4 event
// 與 ga4-events.js 的 trackEvent 搭配；trackEvent 在 gtag 不存在時自動 no-op
// 因此本模組在 ga4 enabled=false 時也安全（綁了 listener 但不會送 event）

import { trackEvent } from './ga4-events.js';

// Phase 20260624-ga4-param-allowlist-source-a：集中式 GA4 event param allowlist filter。
// 原本 link-tracker 把元素上每個 data-ga4-param-* 屬性 verbatim forward 給 gtag；
// 自本 phase 起，只 forward allowlisted key，其餘（raw URL / deferred / 未知 / 可疑欄位）一律不送。
// 允許清單 = D4 已註冊 4 維度（link_type / provider / placement / link_label）
//   + P1 article_bottom_nav 報表依賴欄位（post_slug / surface / click_area / nav_direction / target_slug）。
// DROP（非 allowlisted）：link_url / target_url / outbound / link_source_key / email-like /
//   user-id-like / token-like / 任何其他 data-ga4-param-*。
// 設計：純 key-based allowlist。allowlisted 欄位之 value 不因其人類文字內容（如 link_label 中文）
//   被過濾；非 allowlisted 欄位即使值看似無害亦一律 drop。本 phase 不改 EJS template / generated HTML，
//   raw attr 仍留在靜態 HTML（等同 href），僅阻止其 forward 到 GA4。
export const GA4_PARAM_ALLOWLIST = Object.freeze([
  // D4 registered custom dimensions（必須保留 forward）
  'link_type',
  'provider',
  'placement',
  'link_label',
  // P1 / 既有報表依賴欄位（必須保留 forward）
  'post_slug',
  'surface',
  'click_area',
  'nav_direction',
  'target_slug',
]);

const _GA4_ALLOWED = new Set(GA4_PARAM_ALLOWLIST);

// 純函式：輸入 params 物件，回傳只含 allowlisted key 的淺拷貝；非物件輸入回傳空物件。
// 供 smoke（src/scripts/check-ga4-param-allowlist.js）直接 import 測試。
export function filterGa4EventParams(params) {
  const out = {};
  if (!params || typeof params !== 'object') return out;
  for (const key of Object.keys(params)) {
    if (_GA4_ALLOWED.has(key)) {
      out[key] = params[key];
    }
  }
  return out;
}

export function initLinkTracker() {
  if (typeof document === 'undefined') return;
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target || typeof target.closest !== 'function') return;
    const el = target.closest('[data-ga4-event]');
    if (!el) return;
    const eventName = el.getAttribute('data-ga4-event');
    if (!eventName) return;
    const params = {};
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-ga4-param-')) {
        const key = attr.name.slice('data-ga4-param-'.length);
        params[key] = attr.value;
      }
    }
    trackEvent(eventName, filterGa4EventParams(params));
  });
}
