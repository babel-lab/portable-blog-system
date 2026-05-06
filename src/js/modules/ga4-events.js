// Phase 5-d：GA4 event helper module
// trackEvent 對外介面，封裝 gtag('event', name, params)；當 gtag 不存在時靜默不做事
// initGa4Events 由 main.js 呼叫；gtag.js 由 tracking/ga4.ejs 端載入，本 init 預留

export function trackEvent(name, params) {
  if (!name) return;
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params || {});
}

export function initGa4Events() {
  // gtag.js 由 tracking/ga4.ejs 載入（gated by enabled + measurementId）
  // 預留：未來如需主動 page_view（SPA 路由變化）/ session 設定可在此擴充
}
