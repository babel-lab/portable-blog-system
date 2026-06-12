// Phase 20260611-night-2-blogger-adsense-phase-e-output-guard-implementation-a：
//   Blogger bottom article AdSense output guard。
// Phase 20260612-am-10-blogger-adsense-guard-parameterization-implementation-a：
//   single hardcoded slug → multi-target guard（targets array）。
//
// 目的：把 Phase D 人工手測（docs/20260611-blogger-adsense-phase-d-manual-post-
//   verification-record.md）所驗證之輸出形狀，轉成 repo 內可重複執行之本地
//   structural check；並涵蓋多篇已 live-verified 之 Blogger post（per
//   docs/20260612-blogger-adsense-guard-parameterization-preanalysis.md）。
//   本 script **不開 Blogger 後台**、**不打 AdSense 後台**、**不上傳**、**不部署**；
//   只讀本機 `dist-blogger/posts/{slug}/post.html`。
//
// 設計約束：
//   - 不 hardcode 真實 AdSense publisher / slot id（這些屬 ad-markup identifier，
//     僅允許存於 content/settings/ads.config.json；本檔以 settings 為來源驗證輸出
//     一致，不在 test 內 inline real id 字面值）。
//   - 不引入新 dependency（僅 node:fs / node:path / node:url / node:assert）。
//   - 不修改 production posts / settings / templates / build / package。
//   - 不依賴 exact line numbers / 絕對 byte offset（位置語意一律以「相對順序」斷言）。
//   - 不把 live-only 之 `data-ad-status="filled"` 當成本機 generated HTML 必須存在
//     之條件（fill 屬 AdSense runtime，不在本機輸出範圍）。
//   - 若 target HTML 不存在 → 列出明確錯誤訊息並提示先跑 `npm run build:blogger`。
//
// 共同（surface-invariant）斷言（對每個 target 一律成立）：
//   - 恰一個 articleAd6 / beforeRelatedLinks Blogger AdSense block
//   - 該 block 為 adsbygoogle <ins> + inline push
//   - data-ad-client / data-ad-slot 與 ads.config.json strict-equal（不 hardcode）
//   - data-ad-format="auto" / data-full-width-responsive="true"
//   - 無 articleAd1..articleAd5
//   - 無 legacy slots（postTop / postMiddle / postBottom / sidebar / homeInline）
//   - 無 raw EJS（`<%` / `%>` / `await include`）
//   - ad markup 周邊無 `undefined` / `null` attribute-value / text-node
//
// per-target 斷言（依該 post 形態）：
//   - noindex 計數
//   - affiliate / commerce box 行為（min / exact）
//   - related-links 存在性
//   - 位置 anchor：`relatedLinks`（ad 在 affiliate bottom 後、related-links 前）
//     或 `hashtags`（ad 在 body 後、hashtags 前）
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

const ADS_SETTINGS_PATH = path.join(PROJECT_ROOT, 'content', 'settings', 'ads.config.json');

const LEGACY_SLOT_KEYS = ['postTop', 'postMiddle', 'postBottom', 'sidebar', 'homeInline'];
const PAGES_ONLY_SLOT_KEYS = ['articleAd1', 'articleAd2', 'articleAd3', 'articleAd4', 'articleAd5'];
const APPROVED_BLOGGER_SLOT_KEY = 'articleAd6';
const APPROVED_BLOGGER_ANCHOR = 'beforeRelatedLinks';

// ─── Targets（第一階段 multi-target coverage）────────────────────────────────
// per docs/20260612-blogger-adsense-guard-parameterization-preanalysis.md §D/§F：
//   - we-media-myself2：複雜形態（書評 + dual affiliate-box + related-links + hashtags）
//   - daily-reading-habit-notes：最簡形態（life-note；0 affiliate / 0 related-links）
// expected.affiliateBox：{ min } 或 { exact }；min>=1 時額外要求 sponsored rel。
// expected.relatedLinks：true（aside + title + item 存在）/ false（完全不存在）。
// expected.positionAnchor：'relatedLinks'（ad 在 affiliate bottom 後、related-links 前）
//   / 'hashtags'（ad 在 body 後、hashtags 前）。
const TARGETS = [
  {
    slug: 'we-media-myself2',
    expect: {
      articleAd6: 1,
      articleAd1to5: 0,
      noindex: 0,
      affiliateBox: { min: 1 }, // dual Blogger-only block（實測 2）；保留既有 ≥1 + sponsored rel 保障
      relatedLinks: true,
      positionAnchor: 'relatedLinks',
    },
  },
  {
    slug: 'daily-reading-habit-notes',
    expect: {
      articleAd6: 1,
      articleAd1to5: 0,
      noindex: 0,
      affiliateBox: { exact: 0 }, // 純 body life-note：無 affiliate / commerce box
      relatedLinks: false,
      positionAnchor: 'hashtags',
    },
  },
  {
    // Phase am-11：第三個 live/manual-verified target（second-post night-1 record）。
    //   tech-note 簡形態（github 主寫、cross-publish 至 Blogger，bloggerMode flip 為 full）。
    //   實測 generated HTML 與 daily-reading 同型：0 affiliate / 0 related-links / hashtags anchor。
    slug: 'github-pages-blog-planning',
    expect: {
      articleAd6: 1,
      articleAd1to5: 0,
      noindex: 0,
      affiliateBox: { exact: 0 }, // tech-note：無 affiliate / commerce box
      relatedLinks: false,
      positionAnchor: 'hashtags',
    },
  },
];

function htmlPathFor(slug) {
  return path.join(PROJECT_ROOT, 'dist-blogger', 'posts', slug, 'post.html');
}

let passed = 0;
let failed = 0;
// check 帶 slug，使失敗訊息能看出是哪一篇之哪一個 case
function check(slug, name, fn) {
  const label = `[${slug}] ${name}`;
  try {
    fn();
    passed++;
    console.log(`PASS  ${label}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${label} :: ${err.message}`);
  }
}

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

// ─── settings（real id 之唯一來源；不在 test 內 inline real id）─────────────
const ads = JSON.parse(readFileSync(ADS_SETTINGS_PATH, 'utf-8'));

// ─── per-target 共同 + per-target 斷言 ───────────────────────────────────────
function runTarget(target) {
  const { slug, expect } = target;
  const htmlPath = htmlPathFor(slug);
  const rel = path.relative(PROJECT_ROOT, htmlPath);

  // Preflight：target HTML 必須存在；缺失給明確訊息（不 auto-build）
  if (!existsSync(htmlPath)) {
    failed++;
    console.log(
      `FAIL  [${slug}] 0 target HTML exists :: not found: ${rel} — 請先執行：  npm run build:blogger`,
    );
    return; // skip 該 target 之其餘 case
  }

  const html = readFileSync(htmlPath, 'utf-8');
  console.log(`\n--- target: ${slug}  (${rel}) ---`);

  const adIdx = html.indexOf(`lab-ad-slot--${APPROVED_BLOGGER_SLOT_KEY}`);

  // ── 共同（surface-invariant）斷言 ──────────────────────────────────────

  // C1. 恰一個 lab-ad-slot--articleAd6
  check(slug, 'C1 exactly one lab-ad-slot--articleAd6 (no duplicate)', () => {
    const n = countOf(html, `lab-ad-slot--${APPROVED_BLOGGER_SLOT_KEY}`);
    assert.equal(n, expect.articleAd6, `expected ${expect.articleAd6} occurrence(s) of lab-ad-slot--${APPROVED_BLOGGER_SLOT_KEY}, found ${n}`);
  });

  // C2. 該 block 是 adsbygoogle <ins>
  check(slug, 'C2 articleAd6 block is an adsbygoogle <ins>', () => {
    const reIns = /<ins\b[^>]*\bclass="[^"]*\badsbygoogle\b[^"]*\blab-ad-slot--articleAd6\b[^"]*"/;
    assert.ok(reIns.test(html), 'expected <ins class="... adsbygoogle ... lab-ad-slot--articleAd6 ..."');
  });

  // C3. inline push present
  check(slug, 'C3 inline adsbygoogle push present', () => {
    const n = countOf(html, '(adsbygoogle = window.adsbygoogle || []).push({});');
    assert.ok(n >= 1, `expected at least 1 inline adsbygoogle push, found ${n}`);
  });

  // C4. data-ad-client = ads.adsenseClient（從 settings 讀；不 hardcode）
  check(slug, 'C4 data-ad-client matches ads.adsenseClient (no hardcode)', () => {
    const client = ads.adsenseClient;
    assert.ok(typeof client === 'string' && client.trim() !== '', 'ads.adsenseClient must be non-empty');
    const re = /<ins\b[^>]*\bdata-ad-client="([^"]+)"/g;
    let m;
    let found = false;
    while ((m = re.exec(html)) !== null) {
      if (m[1] === client) {
        found = true;
        break;
      }
    }
    assert.ok(found, 'expected an <ins> with data-ad-client equal to ads.config.json adsenseClient');
  });

  // C5. data-ad-slot = ads.slots.articleAd6（從 settings 讀；不 hardcode）
  check(slug, 'C5 data-ad-slot matches ads.slots.articleAd6 (no hardcode)', () => {
    const slotId = ads.slots && ads.slots[APPROVED_BLOGGER_SLOT_KEY];
    assert.ok(typeof slotId === 'string' && slotId.trim() !== '', `ads.slots.${APPROVED_BLOGGER_SLOT_KEY} must be non-empty`);
    const re = /<ins\b[^>]*\bdata-ad-slot="([^"]+)"/g;
    let m;
    let found = false;
    while ((m = re.exec(html)) !== null) {
      if (m[1] === slotId) {
        found = true;
        break;
      }
    }
    assert.ok(found, 'expected an <ins> with data-ad-slot equal to ads.config.json slots.articleAd6');
  });

  // C6. data-ad-format / data-full-width-responsive present
  check(slug, 'C6 data-ad-format and data-full-width-responsive present', () => {
    assert.ok(/<ins\b[^>]*\bdata-ad-format="auto"/.test(html), 'expected data-ad-format="auto"');
    assert.ok(/<ins\b[^>]*\bdata-full-width-responsive="true"/.test(html), 'expected data-full-width-responsive="true"');
  });

  // C7. 無 articleAd1..articleAd5
  check(slug, 'C7 no pages-only articleAd1..articleAd5 slot rendered', () => {
    for (const k of PAGES_ONLY_SLOT_KEYS) {
      const n = countOf(html, `lab-ad-slot--${k}`);
      assert.equal(n, expect.articleAd1to5, `expected ${expect.articleAd1to5} occurrence(s) of lab-ad-slot--${k}, found ${n}`);
    }
  });

  // C8. 無 legacy slot class
  check(slug, 'C8 no legacy slot classes rendered', () => {
    for (const k of LEGACY_SLOT_KEYS) {
      const n = countOf(html, `lab-ad-slot--${k}`);
      assert.equal(n, 0, `expected 0 occurrences of legacy lab-ad-slot--${k}, found ${n}`);
    }
  });

  // C9. 無 EJS leak
  check(slug, 'C9 no raw EJS leak (<%, %>, await include)', () => {
    assert.equal(countOf(html, '<%'), 0, 'found raw EJS `<%` in output');
    assert.equal(countOf(html, '%>'), 0, 'found raw EJS `%>` in output');
    assert.equal(countOf(html, 'await include'), 0, 'found raw `await include` in output');
  });

  // C10. ad markup 周邊無 undefined / null（render 失敗典型形狀；只查 ad block 周邊）
  check(slug, 'C10 no undefined/null attr-value or text-node near ad markup', () => {
    assert.ok(adIdx > -1, 'ad slot index not found');
    const win = html.slice(Math.max(0, adIdx - 200), Math.min(html.length, adIdx + 400));
    assert.ok(!/="undefined"/.test(win), 'found `="undefined"` near ad markup');
    assert.ok(!/="null"/.test(win), 'found `="null"` near ad markup');
    assert.ok(!/>undefined</.test(win), 'found `>undefined<` near ad markup');
    assert.ok(!/>null</.test(win), 'found `>null<` near ad markup');
  });

  // ── per-target 斷言 ────────────────────────────────────────────────────

  // P1. noindex 計數
  check(slug, `P1 noindex count = ${expect.noindex}`, () => {
    const n = countOf(html, 'noindex');
    assert.equal(n, expect.noindex, `expected ${expect.noindex} occurrence(s) of noindex, found ${n}`);
  });

  // P2. affiliate / commerce box 行為
  check(slug, 'P2 affiliate / commerce box behavior', () => {
    const n = countOf(html, '<aside class="lab-affiliate-box">');
    if (typeof expect.affiliateBox.exact === 'number') {
      assert.equal(n, expect.affiliateBox.exact, `expected exactly ${expect.affiliateBox.exact} lab-affiliate-box, found ${n}`);
    } else {
      const min = expect.affiliateBox.min;
      assert.ok(n >= min, `expected at least ${min} lab-affiliate-box, found ${n}`);
      // 有 affiliate box 時必須帶 sponsored rel（不弱化既有保障）
      assert.ok(
        /rel="sponsored nofollow noopener noreferrer"/.test(html),
        'expected sponsored rel on affiliate links',
      );
    }
  });

  // P3. related-links 存在性
  check(slug, `P3 related-links ${expect.relatedLinks ? 'intact' : 'absent'}`, () => {
    if (expect.relatedLinks) {
      assert.ok(html.includes('<aside class="lab-related-links">'), 'expected lab-related-links aside');
      assert.ok(html.includes('lab-related-links__title'), 'expected lab-related-links__title');
      assert.ok(html.includes('lab-related-links__item'), 'expected at least one lab-related-links__item');
    } else {
      assert.equal(countOf(html, 'lab-related-links'), 0, 'expected no lab-related-links for this post form');
    }
  });

  // P4. 位置 anchor（相對順序；不依賴絕對 offset / line number）
  check(slug, `P4 ad position anchor = ${expect.positionAnchor}`, () => {
    assert.ok(adIdx > -1, 'ad slot index not found');
    if (expect.positionAnchor === 'relatedLinks') {
      const relatedIdx = html.indexOf('lab-related-links');
      assert.ok(relatedIdx > -1, 'related links section not found');
      assert.ok(adIdx < relatedIdx, 'ad slot must appear before related links section');
      const lastAffiliateIdx = html.lastIndexOf('lab-affiliate-box');
      if (lastAffiliateIdx > -1) {
        assert.ok(lastAffiliateIdx < adIdx, 'last affiliate-box must precede the ad slot (ad after affiliate bottom)');
      }
    } else if (expect.positionAnchor === 'hashtags') {
      const bodyIdx = html.indexOf('lab-article__body');
      const hashtagsIdx = html.indexOf('lab-hashtags');
      assert.ok(bodyIdx > -1, 'article body section not found');
      assert.ok(hashtagsIdx > -1, 'hashtags section not found');
      assert.ok(bodyIdx < adIdx, 'ad slot must appear after article body');
      assert.ok(adIdx < hashtagsIdx, 'ad slot must appear before hashtags section');
    } else {
      assert.fail(`unknown positionAnchor: ${expect.positionAnchor}`);
    }
  });
}

// ─── settings-level invariant（target-independent；跑一次）──────────────────
function runSettingsInvariants() {
  check('settings', 'S1 ads.config.json invariants (enabled + articleAd6 blogger surface)', () => {
    assert.equal(ads.enabled, true, 'ads.config.json enabled must be true (post-N9e baseline)');
    const blocks = (ads.defaults && ads.defaults.blocks) || [];
    const articleAd6Block = blocks.find((b) => b && b.slotKey === APPROVED_BLOGGER_SLOT_KEY);
    assert.ok(articleAd6Block, `expected defaults.blocks entry for ${APPROVED_BLOGGER_SLOT_KEY}`);
    assert.equal(articleAd6Block.anchor, APPROVED_BLOGGER_ANCHOR, `${APPROVED_BLOGGER_SLOT_KEY} anchor must be ${APPROVED_BLOGGER_ANCHOR}`);
    assert.ok(
      Array.isArray(articleAd6Block.surfaces) && articleAd6Block.surfaces.includes('blogger'),
      `${APPROVED_BLOGGER_SLOT_KEY} surfaces must include 'blogger' (Phase B opt-in)`,
    );
  });
}

// ─── main ──────────────────────────────────────────────────────────────────
console.log(`[check-blogger-adsense-output] targets: ${TARGETS.map((t) => t.slug).join(', ')}`);
runSettingsInvariants();
for (const target of TARGETS) {
  runTarget(target);
}

console.log(`\n${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
