// Phase 5-d：全域 click 委派監聽，讀 data-ga4-* 屬性 → 派發 GA4 event
// 與 ga4-events.js 的 trackEvent 搭配；trackEvent 在 gtag 不存在時自動 no-op
// 因此本模組在 ga4 enabled=false 時也安全（綁了 listener 但不會送 event）

import { trackEvent } from './ga4-events.js';

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
    trackEvent(eventName, params);
  });
}
