// Phase 20260611-night-2（N8 anchor wiring）：六區塊 AdSense anchor render-path smoke。
//
// 驗證 resolver → adsense-anchor.ejs → adsense-article-block.ejs → adsense-slot.ejs
// 之完整 render path：
//   - articleAd1..6 六個 convention slot key 都能被 render path 呼叫並輸出 <ins>
//   - disabled / missing client / missing slot id 時為 empty output（no-op）
//   - slot key 順序與 convention（articleAd1..6 升序）一致
//   - 不硬編碼真實 client / slot id（全為明顯 placeholder）
//
// 不碰 settings / content / build output / deploy。
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import { deriveRenderedAdsenseBlocks } from './resolve-adsense-blocks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANCHOR_PARTIAL = path.resolve(__dirname, '../views/ads/adsense-anchor.ejs');

// 明顯之測試 placeholder（非真實 AdSense 帳號 / 版位）
const TEST_CLIENT = 'ca-pub-TEST0000000000';

// 六個 convention slot key → 六個 v1 anchor（升序對應 articleAd1..6）
const SLOT_KEYS = ['articleAd1', 'articleAd2', 'articleAd3', 'articleAd4', 'articleAd5', 'articleAd6'];
const ANCHORS = ['afterHeader', 'afterCover', 'afterBookPhoto', 'afterAffiliateTop', 'beforeRelatedLinks', 'beforeHashtags'];

function makeSlots(values) {
  // values: { articleAd1: 'test-slot-0001', ... }；預設全部填 placeholder
  const slots = {};
  SLOT_KEYS.forEach((k, i) => {
    slots[k] = values && Object.prototype.hasOwnProperty.call(values, k)
      ? values[k]
      : `test-slot-000${i + 1}`;
  });
  return slots;
}

function makeAds(overrides) {
  return {
    enabled: true,
    adsenseClient: TEST_CLIENT,
    slots: makeSlots(),
    ...overrides,
  };
}

function makePost() {
  return {
    slug: 'smoke-post',
    adsense: {
      enabled: true,
      blocks: SLOT_KEYS.map((slotKey, i) => ({
        id: `block-${i + 1}`,
        enabled: true,
        surfaces: ['pages'],
        slotKey,
        anchor: ANCHORS[i],
        order: i + 1,
      })),
    },
  };
}

async function renderAnchor(blocks, ads) {
  return ejs.renderFile(ANCHOR_PARTIAL, { blocks, ads }, { async: true });
}

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.error(`FAIL  ${name}`);
  }
}

const main = async () => {
  // --- enabled + 全 placeholder 配齊：六個 slot 全部 render ---
  const ads = makeAds();
  const post = makePost();
  const resolved = deriveRenderedAdsenseBlocks(post, ads, 'pages');

  const renderedByAnchor = {};
  for (const anchor of ANCHORS) {
    renderedByAnchor[anchor] = await renderAnchor(resolved[anchor], ads);
  }

  // 1..6：每個 anchor 渲染對應 articleAdN 之 <ins> + slot-specific class + slot id + client + push
  for (let i = 0; i < 6; i++) {
    const anchor = ANCHORS[i];
    const slotKey = SLOT_KEYS[i];
    const slotId = `test-slot-000${i + 1}`;
    const html = renderedByAnchor[anchor];
    const ok = html.includes('<ins')
      && html.includes(`lab-ad-slot--${slotKey}`)
      && html.includes(`data-ad-slot="${slotId}"`)
      && html.includes(`data-ad-client="${TEST_CLIENT}"`)
      && html.includes('adsbygoogle = window.adsbygoogle');
    check(`${i + 1} ${anchor} renders ${slotKey}`, ok);
  }

  // 7：六個 slot key 在「依 anchor 順序串接」之輸出中以 articleAd1..6 升序出現
  const concatenated = ANCHORS.map((a) => renderedByAnchor[a]).join('');
  const positions = SLOT_KEYS.map((k) => concatenated.indexOf(`lab-ad-slot--${k}`));
  const allPresent = positions.every((p) => p >= 0);
  const ascending = positions.every((p, i) => i === 0 || p > positions[i - 1]);
  check('7 articleAd1..6 all present in convention order', allPresent && ascending);

  // --- disabled：resolver 回 {} → 每個 anchor empty ---
  const disabledResolved = deriveRenderedAdsenseBlocks(post, makeAds({ enabled: false }), 'pages');
  let disabledEmpty = Object.keys(disabledResolved).length === 0;
  for (const anchor of ANCHORS) {
    const html = await renderAnchor(disabledResolved[anchor], makeAds({ enabled: false }));
    if (html.trim() !== '') disabledEmpty = false;
  }
  check('8 disabled ads → all anchors empty', disabledEmpty);

  // --- missing client：enabled 但 adsenseClient='' → {} → empty ---
  const noClientResolved = deriveRenderedAdsenseBlocks(post, makeAds({ adsenseClient: '' }), 'pages');
  let noClientEmpty = Object.keys(noClientResolved).length === 0;
  for (const anchor of ANCHORS) {
    const html = await renderAnchor(noClientResolved[anchor], makeAds({ adsenseClient: '' }));
    if (html.trim() !== '') noClientEmpty = false;
  }
  check('9 missing adsenseClient → all anchors empty', noClientEmpty);

  // --- missing slot id：articleAd1 之 slot id='' → 該 block omit；其餘仍 render ---
  const partialAds = makeAds({ slots: makeSlots({ articleAd1: '' }) });
  const partialResolved = deriveRenderedAdsenseBlocks(post, partialAds, 'pages');
  const ad1Html = await renderAnchor(partialResolved.afterHeader, partialAds);
  const ad2Html = await renderAnchor(partialResolved.afterCover, partialAds);
  check('10 empty slot id → that anchor no-op', ad1Html.trim() === '');
  check('11 other slots still render when one slot id empty', ad2Html.includes('lab-ad-slot--articleAd2'));

  // --- blocks undefined / 空 → empty（adsense-anchor default-safe）---
  check('12 undefined blocks → empty', (await renderAnchor(undefined, ads)).trim() === '');
  check('13 empty blocks array → empty', (await renderAnchor([], ads)).trim() === '');

  // --- 不硬編碼真實 client / slot id：輸出僅含測試 placeholder client ---
  const clientMatches = concatenated.match(/ca-pub-[A-Za-z0-9]+/g) || [];
  const onlyTestClient = clientMatches.every((m) => m === TEST_CLIENT);
  check('14 no non-placeholder ca-pub client in output', onlyTestClient && clientMatches.length > 0);

  console.log(`\n${pass} passed / ${fail} failed`);
  if (fail > 0) process.exit(1);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
