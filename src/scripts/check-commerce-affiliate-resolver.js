// Phase 20260610-pm-1-commerce-ref-renderer-regression-fixture-a：
//   commerce affiliate ref resolver（R1）regression smoke harness。
//   per docs/20260610-commerce-ref-renderer-regression-fixture.md
//
// 目的：鎖住 R1 resolver（src/scripts/resolve-affiliate-links.js）行為，並驗證其與
//   validator C1–C9（src/scripts/validate-content.js）之分類契約不互相矛盾：
//     - validator 允許之 ref-only active entry → renderer 必能安全 render
//     - validator warning 之 invalid / not-found / inactive ref → renderer 必 omit
//
// 約束（mirror src/scripts/smoke-reverse-utm.js 慣例 + R2 spec）：
//   - zero new dependency（僅 node:assert / node:fs / node:url）
//   - 不改 production posts / registry / resolver / build / validator / package
//   - Section 1 = 純 in-memory deterministic locks（registry-independent）
//   - Section 2 = registry-coupled invariants（讀 content/settings/commerce-links.json，
//     read-only；mirror check-*.js 讀 content 之慣例）
//   - validator C3/C4 linkId-gate 於本 harness 以 inline 重建（validator 未 export
//     buildCommerceLinkIdSet / buildCommerceLinkEntryMap；不改 validator）
//
// 執行：node src/scripts/check-commerce-affiliate-resolver.js
//   - exit 0 = 全 pass
//   - exit 1 = 任一 case fail（列出 FAIL 後 process.exit(1)）

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  deriveRenderedAffiliateLinks,
  buildActiveCommerceLinkEntryMap,
} from './resolve-affiliate-links.js';

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

// helper：output link 之 url 必為非空 string、絕不 "undefined" / ""、絕不等於 ref 字串
function assertSafeUrls(out, refStrings = []) {
  for (const link of out) {
    assert.equal(typeof link.url, 'string', 'url must be string');
    assert.ok(link.url.trim() !== '', 'url must be non-empty');
    assert.notEqual(link.url, 'undefined', 'url must not be literal "undefined"');
    for (const ref of refStrings) {
      assert.notEqual(link.url, ref, 'url must not equal the ref string (ref must not be used as href)');
    }
  }
}

// ─── Section 1：in-memory deterministic behavior locks ──────────────────

// 1. raw url only → url 原樣輸出（registry 無關）
check('1 raw-url-only → url unchanged', () => {
  const out = deriveRenderedAffiliateLinks(
    { links: [{ label: '博客來：實體書', network: '通路王', url: 'https://whitehippo.net/3QaKr?uid1=blog' }] },
    [],
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].url, 'https://whitehippo.net/3QaKr?uid1=blog');
  assert.equal(out[0].label, '博客來：實體書');
  assert.equal(out[0].network, '通路王');
  assertSafeUrls(out);
});

// 2. url + ref 並存 → url wins（ref 不改寫既有 url）
check('2 url+ref coexist → url wins', () => {
  const registry = [
    { linkId: 'm-active', active: true, displayLabel: 'safe', targetUrl: 'https://registry.example.invalid/x?uid1=blog' },
  ];
  const out = deriveRenderedAffiliateLinks(
    { links: [{ label: 'L', network: 'N', url: 'https://raw.example.invalid/keep?uid1=blog', ref: 'm-active' }] },
    registry,
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].url, 'https://raw.example.invalid/keep?uid1=blog'); // url，不是 registry targetUrl
  assertSafeUrls(out, ['m-active']);
});

// 3. ref-only valid active entry → url = registry targetUrl exactly（含 uid1=blog）；label fallback = displayLabel
check('3 ref-only active → url = targetUrl exact (uid1=blog preserved)', () => {
  const registry = [
    { linkId: 'm-active', active: true, displayLabel: '博客來：實體書', internalLabel: 'SECRET', targetUrl: 'https://whitehippo.net/3QWBP?uid1=blog' },
  ];
  const out = deriveRenderedAffiliateLinks({ links: [{ ref: 'm-active' }] }, registry);
  assert.equal(out.length, 1);
  assert.equal(out[0].url, 'https://whitehippo.net/3QWBP?uid1=blog'); // 逐字，無 canonicalize / 無刪 uid1=blog
  assert.equal(out[0].label, '博客來：實體書'); // displayLabel fallback（非 internalLabel）
  assert.ok(!JSON.stringify(out).includes('SECRET'), 'internalLabel must not leak');
  assertSafeUrls(out, ['m-active']);
});

// 3b. ref-only active + 文章端 label → 文章端 label 勝；url 仍 targetUrl
check('3b ref + frontmatter label → frontmatter label wins', () => {
  const registry = [
    { linkId: 'm-active', active: true, displayLabel: 'reg-label', targetUrl: 'https://whitehippo.net/3QWBP?uid1=blog' },
  ];
  const out = deriveRenderedAffiliateLinks({ links: [{ ref: 'm-active', label: '自訂顯示' }] }, registry);
  assert.equal(out.length, 1);
  assert.equal(out[0].label, '自訂顯示');
  assert.equal(out[0].url, 'https://whitehippo.net/3QWBP?uid1=blog');
});

// 4a. not-found ref → omit（不 fabricate）
check('4a not-found ref → omit', () => {
  const out = deriveRenderedAffiliateLinks({ links: [{ ref: '__nonexistent__', label: 'x' }] }, [
    { linkId: 'm-active', active: true, displayLabel: 'safe', targetUrl: 'https://x.example.invalid/?uid1=blog' },
  ]);
  assert.equal(out.length, 0);
});

// 4b. inactive entry（active:false）ref → omit
check('4b inactive ref → omit', () => {
  const registry = [
    { linkId: 'm-inactive', active: false, displayLabel: 'safe', targetUrl: 'https://x.example.invalid/?uid1=blog' },
  ];
  const out = deriveRenderedAffiliateLinks({ links: [{ ref: 'm-inactive' }] }, registry);
  assert.equal(out.length, 0);
});

// 4c. malformed ref（非字串 / 空 / null / 純空白）→ omit
check('4c malformed refs → omit', () => {
  const out = deriveRenderedAffiliateLinks(
    { links: [{ ref: 123 }, { ref: '' }, { ref: '   ' }, { ref: null }] },
    [],
  );
  assert.equal(out.length, 0);
});

// 5. missing safe public label（registry 只有 internalLabel）→ omit；不洩 internalLabel
check('5 no safe label → omit + no internalLabel leak', () => {
  const registry = [
    { linkId: 'm-no-label', active: true, internalLabel: 'SECRET-INTERNAL', targetUrl: 'https://y.example.invalid/?uid1=blog' },
  ];
  const out = deriveRenderedAffiliateLinks({ links: [{ ref: 'm-no-label' }] }, registry);
  assert.equal(out.length, 0);
  assert.ok(!JSON.stringify(out).includes('SECRET-INTERNAL'), 'internalLabel must not leak');
});

// 6. empty links → []
check('6 empty links → []', () => {
  const out = deriveRenderedAffiliateLinks({ links: [] }, []);
  assert.ok(Array.isArray(out) && out.length === 0);
});

// 7. targetUrl 缺 / 空 → omit（即使 ref 命中 active entry）
check('7 active entry without targetUrl → omit', () => {
  const registry = [{ linkId: 'm-no-url', active: true, displayLabel: 'safe', targetUrl: '' }];
  const out = deriveRenderedAffiliateLinks({ links: [{ ref: 'm-no-url' }] }, registry);
  assert.equal(out.length, 0);
});

// 8. mixed batch：raw + active-ref + invalid-ref → 只保留前兩者，順序維持
check('8 mixed batch order + omit invalid', () => {
  const registry = [
    { linkId: 'm-active', active: true, displayLabel: '博客來', targetUrl: 'https://a.example.invalid/?uid1=blog' },
  ];
  const out = deriveRenderedAffiliateLinks(
    {
      links: [
        { label: 'raw', network: '通路王', url: 'https://raw.example.invalid/?uid1=blog' },
        { ref: '__nope__' },
        { ref: 'm-active' },
      ],
    },
    registry,
  );
  assert.equal(out.length, 2);
  assert.equal(out[0].url, 'https://raw.example.invalid/?uid1=blog');
  assert.equal(out[1].url, 'https://a.example.invalid/?uid1=blog');
  assertSafeUrls(out, ['__nope__', 'm-active']);
});

// ─── Section 2：registry-coupled invariants（讀真實 production registry，read-only）──

const REGISTRY_PATH = fileURLToPath(new URL('../../content/settings/commerce-links.json', import.meta.url));
const registryFile = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
const commerceLinks = Array.isArray(registryFile.commerceLinks) ? registryFile.commerceLinks : [];

// validator C3/C4 linkId-gate inline 重建（mirror validate-content.js 之 buildCommerceLinkIdSet：
//   idSet = 所有 valid linkId，**含 inactive**；C3 = ref 不在 idSet；C4 = ref 在 idSet 但 active:false）
const validLinkIdSet = new Set(
  commerceLinks
    .filter((e) => e && typeof e === 'object' && !Array.isArray(e) && typeof e.linkId === 'string' && e.linkId.trim() !== '')
    .map((e) => e.linkId.trim()),
);
const activeEntryMap = buildActiveCommerceLinkEntryMap(commerceLinks);

// 9. 每個 active entry：ref → 恰 1 link，url === entry.targetUrl 逐字（uid1=blog 保留），url 非空
check('9 every active registry entry resolves to exact targetUrl', () => {
  let activeCount = 0;
  for (const entry of commerceLinks) {
    if (!entry || entry.active === false || typeof entry.linkId !== 'string') continue;
    activeCount++;
    const out = deriveRenderedAffiliateLinks({ links: [{ ref: entry.linkId }] }, commerceLinks);
    assert.equal(out.length, 1, `active entry ${entry.linkId} must resolve to exactly 1 link`);
    assert.equal(out[0].url, entry.targetUrl, `url must equal registry targetUrl verbatim for ${entry.linkId}`);
    assertSafeUrls(out, [entry.linkId]);
  }
  assert.ok(activeCount >= 1, 'registry should contain at least 1 active entry');
});

// 10. validator/resolver consistency：對 registry 每個 entry，validator 分類 ↔ resolver 行為一致
check('10 validator C3/C4 gate ↔ resolver consistency', () => {
  for (const entry of commerceLinks) {
    if (!entry || typeof entry.linkId !== 'string' || entry.linkId.trim() === '') continue;
    const ref = entry.linkId.trim();
    const out = deriveRenderedAffiliateLinks({ links: [{ ref }] }, commerceLinks);
    const inIdSet = validLinkIdSet.has(ref); // 一定 true（來自 registry）
    const isActive = entry.active !== false;
    if (inIdSet && isActive) {
      // validator: 無 C3 / 無 C4（clean）→ resolver 必 render
      assert.equal(out.length, 1, `clean active ref ${ref} must render`);
    } else if (inIdSet && !isActive) {
      // validator: C4 inactive → resolver 必 omit
      assert.equal(out.length, 0, `inactive ref ${ref} (validator C4) must be omitted`);
    }
  }
});

// 11. KOBO / 金石堂電子書 excluded entry 仍不可被 resolve（不在 registry → validator C3 → omit）
check('11 KOBO excluded entry not resolvable', () => {
  const KOBO = 'book-rouhou-time-kingstone-ebook-books';
  assert.ok(!validLinkIdSet.has(KOBO), 'KOBO linkId must NOT be present in registry (excluded)');
  assert.ok(!activeEntryMap.has(KOBO), 'KOBO linkId must NOT be in active entry map');
  const out = deriveRenderedAffiliateLinks({ links: [{ ref: KOBO, label: 'KOBO' }] }, commerceLinks);
  assert.equal(out.length, 0, 'ref to KOBO excluded entry must be omitted (validator C3 not-found)');
});

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
