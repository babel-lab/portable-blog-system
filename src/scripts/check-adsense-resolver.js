// Phase 20260610-night-10（N7）：AdSense resolver smoke test。
//
// 目的：鎖住 deriveRenderedAdsenseBlocks（src/scripts/resolve-adsense-blocks.js）
//   行為；驗證其與 validator（src/scripts/validate-content.js）之 enum / shape 規
//   則不互相矛盾。
//
// 約束（mirror src/scripts/check-commerce-affiliate-resolver.js 慣例）：
//   - zero new dependency（僅 node:assert / node:fs / node:url）
//   - 不改 production posts / settings / resolver / validator / build / package（本檔 +
//     resolver + package script + docs sync 屬 N7 同一 commit；本檔自身不修改其他檔）
//   - Section 1 = 純 in-memory deterministic locks（settings-independent）
//   - Section 2 = settings-coupled invariants（讀 content/settings/ads.config.json，
//     read-only）
//   - Section 3 = anchor enum reconciliation
//
// 執行：node src/scripts/check-adsense-resolver.js  或  npm run check:adsense-resolver
//   - exit 0 = 全 pass
//   - exit 1 = 任一 case fail（列出 FAIL 後 process.exit(1)）

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deriveRenderedAdsenseBlocks, ADSENSE_V1_ANCHORS } from './resolve-adsense-blocks.js';

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

// Common factory：valid 11-slot settings shape（mirror post-N6a production target）
function makeAdsSettings(overrides = {}) {
  return {
    enabled: true,
    adsenseClient: 'ca-pub-FIXTURE-1234567890',
    loader: { blogger: 'theme', pages: 'head' },
    slots: {
      postTop: 'slot-postTop-fixture',
      postMiddle: 'slot-postMiddle-fixture',
      postBottom: 'slot-postBottom-fixture',
      sidebar: 'slot-sidebar-fixture',
      homeInline: 'slot-homeInline-fixture',
      articleAd1: 'slot-articleAd1-fixture',
      articleAd2: 'slot-articleAd2-fixture',
      articleAd3: 'slot-articleAd3-fixture',
      articleAd4: 'slot-articleAd4-fixture',
      articleAd5: 'slot-articleAd5-fixture',
      articleAd6: 'slot-articleAd6-fixture',
    },
    defaults: { blocks: [] },
    ...overrides,
  };
}

function makePost(adsense) {
  return { adsense };
}

function isEmptyObject(o) {
  return o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length === 0;
}

// ─── Section 1：in-memory deterministic behavior locks ──────────────────

// 1. ads.enabled=false → {}
check('1 ads.enabled=false → {}', () => {
  const ads = makeAdsSettings({ enabled: false });
  const post = makePost({
    blocks: [{ id: 'b', anchor: 'afterHeader', slotKey: 'articleAd1' }],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.ok(isEmptyObject(out), 'expected {}');
});

// 2. enabled=true but missing client → {}
check('2 enabled=true, adsenseClient empty → {}', () => {
  const ads = makeAdsSettings({ adsenseClient: '' });
  const post = makePost({
    blocks: [{ id: 'b', anchor: 'afterHeader', slotKey: 'articleAd1' }],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.ok(isEmptyObject(out));
});

// 3. enabled=true + client but empty slot ID → {}（block skip → no anchor key）
check('3 valid settings but slot id empty → {}', () => {
  const ads = makeAdsSettings({
    slots: { ...makeAdsSettings().slots, articleAd1: '' },
  });
  const post = makePost({
    blocks: [{ id: 'b', anchor: 'afterHeader', slotKey: 'articleAd1' }],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.ok(isEmptyObject(out));
});

// 4. valid block → 1 grouped block under correct anchor
check('4 valid block resolves to 1 grouped block', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [{ id: 'ad-1', anchor: 'afterHeader', slotKey: 'articleAd1', order: 1 }],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.deepEqual(Object.keys(out), ['afterHeader']);
  assert.equal(out.afterHeader.length, 1);
  assert.equal(out.afterHeader[0].id, 'ad-1');
  assert.equal(out.afterHeader[0].anchor, 'afterHeader');
  assert.equal(out.afterHeader[0].slotKey, 'articleAd1');
  assert.equal(out.afterHeader[0].slotId, 'slot-articleAd1-fixture');
  assert.equal(out.afterHeader[0].client, 'ca-pub-FIXTURE-1234567890');
  assert.equal(out.afterHeader[0].order, 1);
});

// 5. post.adsense.enabled === false → {}
check('5 post-level adsense.enabled=false → {}', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    enabled: false,
    blocks: [{ id: 'b', anchor: 'afterHeader', slotKey: 'articleAd1' }],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.ok(isEmptyObject(out));
});

// 6. missing adsense.blocks → {}
check('6 post.adsense without blocks → {}', () => {
  const ads = makeAdsSettings();
  const post = makePost({ enabled: true });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.ok(isEmptyObject(out));
});

// 7. empty adsense.blocks → {}
check('7 empty adsense.blocks → {}', () => {
  const ads = makeAdsSettings();
  const post = makePost({ enabled: true, blocks: [] });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.ok(isEmptyObject(out));
});

// 8. block.enabled=false → block skipped (other blocks still resolve)
check('8 block.enabled=false skips that block', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [
      { id: 'off', enabled: false, anchor: 'afterHeader', slotKey: 'articleAd1' },
      { id: 'on', anchor: 'beforeHashtags', slotKey: 'articleAd6' },
    ],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.deepEqual(Object.keys(out), ['beforeHashtags']);
  assert.equal(out.beforeHashtags[0].id, 'on');
});

// 9. omitted surfaces renders for both blogger and pages
check('9 surfaces omitted renders both', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [{ id: 'both', anchor: 'afterHeader', slotKey: 'articleAd1' }],
  });
  assert.equal(deriveRenderedAdsenseBlocks(post, ads, 'blogger').afterHeader.length, 1);
  assert.equal(deriveRenderedAdsenseBlocks(post, ads, 'pages').afterHeader.length, 1);
});

// 10. surfaces=['blogger'] skips pages surface
check('10 surfaces=[blogger] skips pages', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [{ id: 'bl', surfaces: ['blogger'], anchor: 'afterHeader', slotKey: 'articleAd1' }],
  });
  assert.equal(deriveRenderedAdsenseBlocks(post, ads, 'blogger').afterHeader.length, 1);
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(post, ads, 'pages')));
});

// 11. surfaces=['pages'] skips blogger surface
check('11 surfaces=[pages] skips blogger', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [{ id: 'pg', surfaces: ['pages'], anchor: 'afterHeader', slotKey: 'articleAd1' }],
  });
  assert.equal(deriveRenderedAdsenseBlocks(post, ads, 'pages').afterHeader.length, 1);
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(post, ads, 'blogger')));
});

// 12. surfaces=['blogger','pages'] renders both
check('12 surfaces=[blogger,pages] renders both', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [{ id: 'all', surfaces: ['blogger', 'pages'], anchor: 'afterHeader', slotKey: 'articleAd1' }],
  });
  assert.equal(deriveRenderedAdsenseBlocks(post, ads, 'blogger').afterHeader.length, 1);
  assert.equal(deriveRenderedAdsenseBlocks(post, ads, 'pages').afterHeader.length, 1);
});

// 13. invalid anchor (not in v1 enum) → block skipped
check('13 invalid anchor skipped', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [
      { id: 'bad', anchor: 'afterIntro', slotKey: 'articleAd1' }, // mid-body anchor; deferred to v2
      { id: 'bad2', anchor: 'nowhere', slotKey: 'articleAd1' },
    ],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.ok(isEmptyObject(out));
});

// 14. unknown slotKey (not in adsSettings.slots) → block skipped
check('14 unknown slotKey skipped', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [{ id: 'b', anchor: 'afterHeader', slotKey: 'articleAd99' }],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.ok(isEmptyObject(out));
});

// 15. order sorting within same anchor (3, 1, 2 → 1, 2, 3)
check('15 order sorting within same anchor', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [
      { id: 'three', anchor: 'afterHeader', slotKey: 'articleAd1', order: 3 },
      { id: 'one', anchor: 'afterHeader', slotKey: 'articleAd2', order: 1 },
      { id: 'two', anchor: 'afterHeader', slotKey: 'articleAd3', order: 2 },
    ],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.equal(out.afterHeader.length, 3);
  assert.deepEqual(out.afterHeader.map((b) => b.id), ['one', 'two', 'three']);
});

// 15b. missing order goes to end; ties preserve source order (stable)
check('15b missing order goes to end; stable for ties', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [
      { id: 'no-order-a', anchor: 'afterHeader', slotKey: 'articleAd1' },
      { id: 'order-2', anchor: 'afterHeader', slotKey: 'articleAd2', order: 2 },
      { id: 'no-order-b', anchor: 'afterHeader', slotKey: 'articleAd3' },
      { id: 'order-1', anchor: 'afterHeader', slotKey: 'articleAd4', order: 1 },
    ],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.deepEqual(
    out.afterHeader.map((b) => b.id),
    ['order-1', 'order-2', 'no-order-a', 'no-order-b'],
    'order 1, 2, then source-order tail for missing-order pair',
  );
});

// 16. multiple blocks same anchor retained
check('16 multiple blocks same anchor retained', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [
      { id: 'a', anchor: 'afterHeader', slotKey: 'articleAd1', order: 1 },
      { id: 'b', anchor: 'afterHeader', slotKey: 'articleAd2', order: 2 },
      { id: 'c', anchor: 'afterHeader', slotKey: 'articleAd3', order: 3 },
    ],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.equal(out.afterHeader.length, 3);
  assert.deepEqual(out.afterHeader.map((b) => b.slotKey), ['articleAd1', 'articleAd2', 'articleAd3']);
});

// 17. multiple anchors grouped correctly
check('17 multiple anchors grouped correctly', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [
      { id: 'top', anchor: 'afterHeader', slotKey: 'articleAd1' },
      { id: 'bot', anchor: 'beforeHashtags', slotKey: 'articleAd6' },
      { id: 'mid', anchor: 'beforeRelatedLinks', slotKey: 'articleAd4' },
    ],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  assert.deepEqual(new Set(Object.keys(out)), new Set(['afterHeader', 'beforeHashtags', 'beforeRelatedLinks']));
  assert.equal(out.afterHeader[0].id, 'top');
  assert.equal(out.beforeHashtags[0].id, 'bot');
  assert.equal(out.beforeRelatedLinks[0].id, 'mid');
});

// 18. legacy blocks.adsenseTop / adsenseBottom completely ignored
check('18 legacy blocks.adsenseTop/Bottom ignored', () => {
  const ads = makeAdsSettings();
  const post = {
    blocks: { adsenseTop: true, adsenseBottom: true }, // legacy frontmatter shape
    // no post.adsense at all
  };
  const out = deriveRenderedAdsenseBlocks(post, ads, 'pages');
  assert.ok(isEmptyObject(out), 'legacy flags must not produce any output');
});

// 19. output excludes surfaces / enabled / note / raw settings
check('19 output does not expose internal fields', () => {
  const ads = makeAdsSettings();
  const post = makePost({
    blocks: [
      {
        id: 'b',
        enabled: true,
        surfaces: ['blogger'],
        note: 'INTERNAL-NOTE',
        anchor: 'afterHeader',
        slotKey: 'articleAd1',
        order: 1,
      },
    ],
  });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
  const json = JSON.stringify(out);
  assert.ok(!json.includes('surfaces'), 'must not expose surfaces');
  assert.ok(!json.includes('enabled'), 'must not expose enabled');
  assert.ok(!json.includes('note'), 'must not expose note');
  assert.ok(!json.includes('INTERNAL-NOTE'), 'must not leak note value');
  assert.ok(!json.includes('loader'), 'must not leak settings.loader');
  assert.ok(!json.includes('defaults'), 'must not leak settings.defaults');
  // expected fields are present
  const block = out.afterHeader[0];
  assert.deepEqual(
    new Set(Object.keys(block)),
    new Set(['id', 'anchor', 'slotKey', 'slotId', 'client', 'order']),
    'block exposes only renderer-needed fields',
  );
});

// 20. null / undefined / scalar defensive inputs do not throw and return {}
check('20 defensive null/undefined/scalar inputs return {} without throwing', () => {
  // resolver(null, null, null) etc.
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(null, null, null)));
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(undefined, undefined, undefined)));
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks({}, {}, 'blogger')));
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks('post', 'ads', 'pages')));
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(42, [], 'blogger')));
  // wrong surface
  const ads = makeAdsSettings();
  const post = makePost({ blocks: [{ id: 'b', anchor: 'afterHeader', slotKey: 'articleAd1' }] });
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(post, ads, 'invalid-surface')));
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(post, ads, undefined)));
  // non-object adsense
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks({ adsense: 'string' }, ads, 'blogger')));
  // non-object block entry
  const postBadBlock = makePost({ blocks: ['not-an-object', null, 42] });
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(postBadBlock, ads, 'blogger')));
});

// ─── Section 2：settings-coupled invariants（讀真實 production settings，read-only）

const ADS_SETTINGS_PATH = fileURLToPath(new URL('../../content/settings/ads.config.json', import.meta.url));
const prodAdsSettings = JSON.parse(readFileSync(ADS_SETTINGS_PATH, 'utf-8'));

// 21. real production ads.config.json with enabled=false → {} for any post
check('21 production ads.config.json (enabled=false) → {} regardless of post', () => {
  assert.equal(prodAdsSettings.enabled, false, 'production ads.config.json must keep enabled=false');
  const post = makePost({
    blocks: [
      { id: 'b1', anchor: 'afterHeader', slotKey: 'articleAd1' },
      { id: 'b2', anchor: 'beforeHashtags', slotKey: 'articleAd6' },
    ],
  });
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(post, prodAdsSettings, 'blogger')));
  assert.ok(isEmptyObject(deriveRenderedAdsenseBlocks(post, prodAdsSettings, 'pages')));
});

// 22. simulated 11-slot settings shape supports articleAd1~articleAd6 + retained 5 legacy
check('22 11-slot shape supports articleAd1..articleAd6 + 5 retained keys', () => {
  const ads = makeAdsSettings();
  // all 11 keys present
  const expectedKeys = ['postTop', 'postMiddle', 'postBottom', 'sidebar', 'homeInline',
                       'articleAd1', 'articleAd2', 'articleAd3', 'articleAd4', 'articleAd5', 'articleAd6'];
  for (const k of expectedKeys) {
    assert.ok(k in ads.slots, `slot key ${k} present`);
    assert.ok(typeof ads.slots[k] === 'string' && ads.slots[k] !== '', `slot ${k} non-empty in fixture`);
  }
  // production ads.config.json also has all 11 keys (post-N6a)
  for (const k of expectedKeys) {
    assert.ok(k in (prodAdsSettings.slots || {}), `production slots includes ${k}`);
  }
  // resolver supports each of the 6 new article slot keys
  for (let n = 1; n <= 6; n++) {
    const slotKey = `articleAd${n}`;
    const post = makePost({ blocks: [{ id: `b-${n}`, anchor: 'afterHeader', slotKey, order: n }] });
    const out = deriveRenderedAdsenseBlocks(post, ads, 'blogger');
    assert.equal(out.afterHeader.length, 1, `articleAd${n} resolves`);
    assert.equal(out.afterHeader[0].slotKey, slotKey);
  }
});

// ─── Section 3：anchor enum reconciliation ──────────────────

// 23. all 14 v1 anchors can resolve when given valid block setup
check('23 all 14 v1 anchors resolve when given valid block', () => {
  const ads = makeAdsSettings();
  assert.equal(ADSENSE_V1_ANCHORS.length, 14, 'ADSENSE_V1_ANCHORS exports 14 anchors');
  // build one block per anchor (each on its own anchor to verify grouping)
  const blocks = ADSENSE_V1_ANCHORS.map((anchor, idx) => ({
    id: `b-${anchor}`,
    anchor,
    slotKey: `articleAd${(idx % 6) + 1}`, // cycle through articleAd1..articleAd6
    order: idx + 1,
  }));
  const post = makePost({ blocks });
  const out = deriveRenderedAdsenseBlocks(post, ads, 'pages');
  assert.equal(Object.keys(out).length, 14, 'all 14 anchors present in output map');
  for (const anchor of ADSENSE_V1_ANCHORS) {
    assert.ok(out[anchor], `anchor ${anchor} resolved`);
    assert.equal(out[anchor].length, 1);
    assert.equal(out[anchor][0].anchor, anchor);
  }
});

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
