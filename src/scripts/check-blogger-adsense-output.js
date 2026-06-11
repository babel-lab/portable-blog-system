// Phase 20260611-night-2-blogger-adsense-phase-e-output-guard-implementation-a：
//   Blogger bottom article AdSense output guard。
//
// 目的：把 Phase D 人工手測（docs/20260611-blogger-adsense-phase-d-manual-post-
//   verification-record.md）所驗證之輸出形狀，轉成 repo 內可重複執行之本地
//   structural check。本 script **不開 Blogger 後台**、**不打 AdSense 後台**、
//   **不上傳**、**不部署**；只讀本機 `dist-blogger/posts/{slug}/post.html`。
//
// 設計約束：
//   - 不 hardcode 真實 AdSense publisher / slot id（這些屬 ad-markup identifier，
//     僅允許存於 content/settings/ads.config.json；本檔以 settings 為來源驗證輸出
//     一致，不在 test 內 inline real id 字面值）。
//   - 不引入新 dependency（僅 node:fs / node:path / node:url / node:assert）。
//   - 不修改 production posts / settings / templates / build / package（本檔 +
//     package script 屬同一 commit；本檔自身不修改其他檔）。
//   - 若 target HTML 不存在 → 列出明確錯誤訊息並提示先跑 `npm run build:blogger`。
//
// 對應 Phase D readiness packet §7 之 expected output checklist：
//   - 恰一個 articleAd6 / beforeRelatedLinks Blogger AdSense block
//   - 位置：affiliate / commerce 區塊之後、related links 之前
//   - 無 articleAd1..articleAd5
//   - 無 legacy slots（postTop / postMiddle / postBottom / sidebar / homeInline）
//   - 無 raw EJS（`<%` / `%>` / `await include`）
//   - 無 `undefined` / `null` 字樣
//   - related links 完整
//   - commerce / affiliate blocks 完整
//
// 執行：node src/scripts/check-blogger-adsense-output.js
//        或  npm run check:blogger-adsense-output
//   - exit 0 = 全 pass
//   - exit 1 = 任一 case fail（列出 FAIL 後 process.exit(1)）

import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Phase D 之 single-post target（per pm-11 plan / pm-13 readiness packet / night-1 verification record）
const TARGET_SLUG = 'we-media-myself2';
const TARGET_HTML = path.join(PROJECT_ROOT, 'dist-blogger', 'posts', TARGET_SLUG, 'post.html');
const ADS_SETTINGS_PATH = path.join(PROJECT_ROOT, 'content', 'settings', 'ads.config.json');

const LEGACY_SLOT_KEYS = ['postTop', 'postMiddle', 'postBottom', 'sidebar', 'homeInline'];
const PAGES_ONLY_SLOT_KEYS = ['articleAd1', 'articleAd2', 'articleAd3', 'articleAd4', 'articleAd5'];
const APPROVED_BLOGGER_SLOT_KEY = 'articleAd6';
const APPROVED_BLOGGER_ANCHOR = 'beforeRelatedLinks';

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name} :: ${err.message}`);
  }
}

// ─── Preflight：target HTML 必須存在；缺失給明確訊息 ────────────────────────
if (!existsSync(TARGET_HTML)) {
  console.error(`[check-blogger-adsense-output] target HTML not found: ${path.relative(PROJECT_ROOT, TARGET_HTML)}`);
  console.error('[check-blogger-adsense-output] 請先執行：  npm run build:blogger');
  process.exit(1);
}

const html = readFileSync(TARGET_HTML, 'utf-8');
const ads = JSON.parse(readFileSync(ADS_SETTINGS_PATH, 'utf-8'));

// 工具：count occurrences of a literal substring（非 regex；避免特殊字元誤判）
function countOf(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

console.log(`[check-blogger-adsense-output] target: ${path.relative(PROJECT_ROOT, TARGET_HTML)}`);

// ─── Section 1：唯一 articleAd6 block 存在性 ───────────────────────────────

// 1. 恰一個 lab-ad-slot--articleAd6 class（Phase D §7 第一條）
check('1 exactly one lab-ad-slot--articleAd6 class in output', () => {
  const n = countOf(html, `lab-ad-slot--${APPROVED_BLOGGER_SLOT_KEY}`);
  assert.equal(n, 1, `expected exactly 1 occurrence of lab-ad-slot--${APPROVED_BLOGGER_SLOT_KEY}, found ${n}`);
});

// 2. 該 block 是 adsbygoogle <ins>（class 同行含 adsbygoogle）
check('2 articleAd6 block is an adsbygoogle <ins> element', () => {
  const reIns = /<ins\b[^>]*\bclass="[^"]*\badsbygoogle\b[^"]*\blab-ad-slot--articleAd6\b[^"]*"/;
  assert.ok(reIns.test(html), 'expected <ins class="... adsbygoogle ... lab-ad-slot--articleAd6 ..."');
});

// 3. inline push 呼叫存在（slot 後緊接的 inline script）
check('3 inline (adsbygoogle = window.adsbygoogle || []).push({}) present', () => {
  const n = countOf(html, '(adsbygoogle = window.adsbygoogle || []).push({});');
  assert.ok(n >= 1, `expected at least 1 inline adsbygoogle push, found ${n}`);
});

// ─── Section 2：attribute 完整性（不 hardcode real id；以 settings 為 source of truth）

// 4. data-ad-client attribute 存在 且 值 = settings.adsenseClient（非空）
check('4 data-ad-client attribute matches ads.adsenseClient (no hardcode)', () => {
  const client = ads.adsenseClient;
  assert.ok(typeof client === 'string' && client.trim() !== '', 'ads.adsenseClient must be non-empty');
  const reClient = /<ins\b[^>]*\bdata-ad-client="([^"]+)"/g;
  let match;
  let found = false;
  while ((match = reClient.exec(html)) !== null) {
    if (match[1] === client) {
      found = true;
      break;
    }
  }
  assert.ok(found, 'expected at least one <ins> with data-ad-client equal to ads.config.json adsenseClient');
});

// 5. data-ad-slot attribute 存在 且 值 = settings.slots.articleAd6（非空）
check('5 data-ad-slot attribute matches ads.slots.articleAd6 (no hardcode)', () => {
  const slotId = ads.slots && ads.slots[APPROVED_BLOGGER_SLOT_KEY];
  assert.ok(
    typeof slotId === 'string' && slotId.trim() !== '',
    `ads.slots.${APPROVED_BLOGGER_SLOT_KEY} must be non-empty`,
  );
  const reSlot = /<ins\b[^>]*\bdata-ad-slot="([^"]+)"/g;
  let match;
  let found = false;
  while ((match = reSlot.exec(html)) !== null) {
    if (match[1] === slotId) {
      found = true;
      break;
    }
  }
  assert.ok(found, 'expected at least one <ins> with data-ad-slot equal to ads.config.json slots.articleAd6');
});

// 6. data-ad-format / data-full-width-responsive 屬性 present（renderer 之既定形狀）
check('6 data-ad-format and data-full-width-responsive present on <ins>', () => {
  assert.ok(/<ins\b[^>]*\bdata-ad-format="auto"/.test(html), 'expected data-ad-format="auto"');
  assert.ok(
    /<ins\b[^>]*\bdata-full-width-responsive="true"/.test(html),
    'expected data-full-width-responsive="true"',
  );
});

// ─── Section 3：位置語意（在 affiliate bottom 之後、related links 之前）

// 7. 文件順序：bottom affiliate-box（最後一個） → ad slot → related-links
//    Phase D §7：「位置：在下方 affiliate / commerce 區塊之後、related links 之前」
check('7 ad slot positioned after bottom affiliate box and before related links', () => {
  const adIdx = html.indexOf(`lab-ad-slot--${APPROVED_BLOGGER_SLOT_KEY}`);
  assert.ok(adIdx > -1, 'ad slot index not found');
  const relatedIdx = html.indexOf('lab-related-links');
  assert.ok(relatedIdx > -1, 'related links section not found');
  assert.ok(adIdx < relatedIdx, 'ad slot must appear before related links section');
  // 最後一個 affiliate-box（bottom）須在 ad slot 之前
  const lastAffiliateIdx = html.lastIndexOf('lab-affiliate-box');
  if (lastAffiliateIdx > -1) {
    assert.ok(
      lastAffiliateIdx < adIdx,
      'last affiliate-box must precede the ad slot (ad placed after affiliate bottom)',
    );
  }
});

// ─── Section 4：negative guards（不得出現之 slot key / legacy / leak）

// 8. 不得出現 articleAd1..articleAd5 之 lab-ad-slot class
check('8 no pages-only articleAd1..articleAd5 slot rendered on blogger output', () => {
  for (const k of PAGES_ONLY_SLOT_KEYS) {
    const n = countOf(html, `lab-ad-slot--${k}`);
    assert.equal(n, 0, `expected 0 occurrences of lab-ad-slot--${k}, found ${n}`);
  }
});

// 9. 不得出現 legacy slot class（postTop / postMiddle / postBottom / sidebar / homeInline）
check('9 no legacy slot classes rendered', () => {
  for (const k of LEGACY_SLOT_KEYS) {
    const n = countOf(html, `lab-ad-slot--${k}`);
    assert.equal(n, 0, `expected 0 occurrences of legacy lab-ad-slot--${k}, found ${n}`);
  }
});

// 10. 不得有原始 EJS leak（`<%` / `%>` / `await include`）
check('10 no raw EJS leak in output (<%, %>, await include)', () => {
  assert.equal(countOf(html, '<%'), 0, 'found raw EJS `<%` in output');
  assert.equal(countOf(html, '%>'), 0, 'found raw EJS `%>` in output');
  assert.equal(countOf(html, 'await include'), 0, 'found raw `await include` in output');
});

// 11. ins / script 區段不得含 attribute-value 或 text-node 形式之 undefined / null
//     （render 失敗時典型形狀：`data-ad-slot="undefined"` 或 `>null<`；只查 ad block 周邊
//     400 字元，避免 body 作者內容被誤判）
check('11 no `undefined` / `null` attribute-value or text-node near the ad markup', () => {
  const adIdx = html.indexOf(`lab-ad-slot--${APPROVED_BLOGGER_SLOT_KEY}`);
  assert.ok(adIdx > -1, 'ad slot index not found');
  const windowStart = Math.max(0, adIdx - 200);
  const windowEnd = Math.min(html.length, adIdx + 400);
  const win = html.slice(windowStart, windowEnd);
  assert.ok(!/="undefined"/.test(win), 'found `="undefined"` attribute value near ad markup');
  assert.ok(!/="null"/.test(win), 'found `="null"` attribute value near ad markup');
  assert.ok(!/>undefined</.test(win), 'found `>undefined<` text node near ad markup');
  assert.ok(!/>null</.test(win), 'found `>null<` text node near ad markup');
});

// ─── Section 5：周邊區塊完整性（related links / affiliate）

// 12. related links section 完整（有 title + at least one list item）
check('12 related links section is intact', () => {
  assert.ok(html.includes('<aside class="lab-related-links">'), 'expected lab-related-links aside');
  assert.ok(html.includes('lab-related-links__title'), 'expected lab-related-links__title');
  assert.ok(html.includes('lab-related-links__item'), 'expected at least one lab-related-links__item');
});

// 13. affiliate / commerce blocks 完整（we-media-myself2 為書評 + dual block；至少 1 個 affiliate-box）
check('13 affiliate / commerce blocks intact', () => {
  const n = countOf(html, '<aside class="lab-affiliate-box">');
  assert.ok(n >= 1, `expected at least 1 lab-affiliate-box aside, found ${n}`);
  // sponsored rel 必須在 affiliate link 上
  assert.ok(
    /rel="sponsored nofollow noopener noreferrer"/.test(html),
    'expected sponsored rel on affiliate links',
  );
});

// ─── Section 6：surface-correctness consistency 與 settings ─────────────────

// 14. ads.config.json 必須 enable + articleAd6 surfaces 含 'blogger'（與 N9e + Phase B 一致）
check('14 ads.config.json invariants (enabled + articleAd6 blogger surface)', () => {
  assert.equal(ads.enabled, true, 'ads.config.json enabled must be true (post-N9e baseline)');
  const blocks = (ads.defaults && ads.defaults.blocks) || [];
  const articleAd6Block = blocks.find((b) => b && b.slotKey === APPROVED_BLOGGER_SLOT_KEY);
  assert.ok(articleAd6Block, `expected defaults.blocks entry for ${APPROVED_BLOGGER_SLOT_KEY}`);
  assert.equal(
    articleAd6Block.anchor,
    APPROVED_BLOGGER_ANCHOR,
    `${APPROVED_BLOGGER_SLOT_KEY} anchor must be ${APPROVED_BLOGGER_ANCHOR}`,
  );
  assert.ok(
    Array.isArray(articleAd6Block.surfaces) && articleAd6Block.surfaces.includes('blogger'),
    `${APPROVED_BLOGGER_SLOT_KEY} surfaces must include 'blogger' (Phase B opt-in)`,
  );
});

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
