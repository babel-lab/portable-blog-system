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
  deriveRenderedAffiliateBlocks,
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

// ─── Section 3：deriveRenderedAffiliateBlocks（Blogger dual-block resolver；Phase pm-11）──
//   - additive helper；不改 deriveRenderedAffiliateLinks（Section 1/2 行為仍須全 pass = backward-compat 證明）
//   - in-memory deterministic（registry-independent，除非明確帶入 registry）

// 12. 缺 affiliate / 缺 blocks / blocks 非 array → []
check('12 blocks: missing affiliate / missing blocks / non-array → []', () => {
  assert.deepEqual(deriveRenderedAffiliateBlocks(undefined, []), []);
  assert.deepEqual(deriveRenderedAffiliateBlocks(null, []), []);
  assert.deepEqual(deriveRenderedAffiliateBlocks({}, []), []); // 無 blocks
  assert.deepEqual(deriveRenderedAffiliateBlocks({ blocks: 'x' }, []), []); // 非 array
  assert.deepEqual(deriveRenderedAffiliateBlocks({ blocks: {} }, []), []); // object 非 array
});

// 13. enabled:false block → skip
check('13 enabled:false block skipped', () => {
  const out = deriveRenderedAffiliateBlocks(
    { blocks: [{ id: 'b', enabled: false, position: 'top', links: [{ label: 'L', url: 'https://e.example.invalid/?uid1=blog' }] }] },
    [],
  );
  assert.equal(out.length, 0);
});

// 14. surfaces 省略 → 預設 blogger（render）
check('14 surfaces omitted defaults to blogger (renders)', () => {
  const out = deriveRenderedAffiliateBlocks(
    { blocks: [{ id: 'b', position: 'top', links: [{ label: 'L', url: 'https://e.example.invalid/?uid1=blog' }] }] },
    [],
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].position, 'top');
});

// 15. surfaces ['blogger'] → render；surfaces ['pages'] → 本 phase 不 render
check("15 surfaces ['blogger'] renders, ['pages'] does not (this phase)", () => {
  const mk = (surfaces) => ({
    blocks: [{ id: 'b', surfaces, position: 'top', links: [{ label: 'L', url: 'https://e.example.invalid/?uid1=blog' }] }],
  });
  assert.equal(deriveRenderedAffiliateBlocks(mk(['blogger']), []).length, 1);
  assert.equal(deriveRenderedAffiliateBlocks(mk(['pages']), []).length, 0);
  assert.equal(deriveRenderedAffiliateBlocks(mk(['pages', 'blogger']), []).length, 1); // 含 blogger → render
  assert.equal(deriveRenderedAffiliateBlocks(mk('blogger'), []).length, 0); // 非 array → 不 render
});

// 16. invalid position → skip；top/bottom 皆 resolve
check('16 invalid position skipped; top + bottom both resolve', () => {
  const link = [{ label: 'L', url: 'https://e.example.invalid/?uid1=blog' }];
  assert.equal(
    deriveRenderedAffiliateBlocks({ blocks: [{ id: 'b', position: 'middle', links: link }] }, []).length,
    0,
  );
  const out = deriveRenderedAffiliateBlocks(
    { blocks: [{ id: 't', position: 'top', links: link }, { id: 'b', position: 'bottom', links: link }] },
    [],
  );
  assert.equal(out.length, 2);
  assert.equal(out[0].position, 'top');
  assert.equal(out[1].position, 'bottom');
});

// 17. heading / disclosure / id 保留（非空 string）；缺則 undefined
check('17 heading / disclosure / id preserved when present', () => {
  const out = deriveRenderedAffiliateBlocks(
    { blocks: [{ id: 'top-x', position: 'top', heading: '上方標題', disclosure: '上方揭露', links: [{ label: 'L', url: 'https://e.example.invalid/?uid1=blog' }] }] },
    [],
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'top-x');
  assert.equal(out[0].heading, '上方標題');
  assert.equal(out[0].disclosure, '上方揭露');
  // 缺 heading/disclosure → undefined
  const out2 = deriveRenderedAffiliateBlocks(
    { blocks: [{ id: 'b', position: 'bottom', links: [{ label: 'L', url: 'https://e.example.invalid/?uid1=blog' }] }] },
    [],
  );
  assert.equal(out2[0].heading, undefined);
  assert.equal(out2[0].disclosure, undefined);
});

// 18. block links 透過既有 ref resolver：ref-only active → url=targetUrl 逐字（uid1=blog），不洩 internalLabel
check('18 block links resolve via existing ref behavior (targetUrl verbatim, no internalLabel leak)', () => {
  const registry = [
    { linkId: 'm-active', active: true, displayLabel: '博客來：實體書', internalLabel: 'SECRET-INTERNAL', targetUrl: 'https://whitehippo.net/3QWBP?uid1=blog' },
  ];
  const out = deriveRenderedAffiliateBlocks(
    { blocks: [{ id: 'b', position: 'top', links: [{ ref: 'm-active' }] }] },
    registry,
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].links.length, 1);
  assert.equal(out[0].links[0].url, 'https://whitehippo.net/3QWBP?uid1=blog'); // 逐字含 uid1=blog
  assert.equal(out[0].links[0].label, '博客來：實體書'); // displayLabel，非 internalLabel
  assert.ok(!JSON.stringify(out).includes('SECRET-INTERNAL'), 'internalLabel must not leak in blocks output');
  assertSafeUrls(out[0].links, ['m-active']);
});

// 19. block 內 inactive / not-found / malformed links 全 omit；若 block 解析後 0 link → 整個 block 不 render
check('19 inactive/not-found/malformed links omitted; empty-after-resolve block skipped', () => {
  const registry = [
    { linkId: 'm-inactive', active: false, displayLabel: 'safe', targetUrl: 'https://x.example.invalid/?uid1=blog' },
    { linkId: 'm-active', active: true, displayLabel: '博客來', targetUrl: 'https://a.example.invalid/?uid1=blog' },
  ];
  // block 1：全部不可解析（inactive + not-found + malformed）→ 0 link → block skip
  // block 2：1 raw + 1 active + 1 invalid → 2 link render
  const out = deriveRenderedAffiliateBlocks(
    {
      blocks: [
        { id: 'empty', position: 'top', links: [{ ref: 'm-inactive' }, { ref: '__nope__' }, { ref: 123 }] },
        { id: 'mixed', position: 'bottom', links: [{ label: 'raw', url: 'https://raw.example.invalid/?uid1=blog' }, { ref: 'm-active' }, { ref: '__nope__' }] },
      ],
    },
    registry,
  );
  assert.equal(out.length, 1, 'only the non-empty block should render');
  assert.equal(out[0].id, 'mixed');
  assert.equal(out[0].links.length, 2);
  assert.equal(out[0].links[0].url, 'https://raw.example.invalid/?uid1=blog');
  assert.equal(out[0].links[1].url, 'https://a.example.invalid/?uid1=blog');
  assertSafeUrls(out[0].links, ['m-active', '__nope__']);
});

// 20. registry-coupled：production 真實 active entry 經 block resolver → targetUrl 逐字（uid1=blog）
check('20 production active entry via block resolver → targetUrl verbatim (uid1=blog)', () => {
  const firstActive = commerceLinks.find((e) => e && e.active !== false && typeof e.linkId === 'string' && e.linkId.trim() !== '');
  assert.ok(firstActive, 'registry should contain at least 1 active entry');
  const out = deriveRenderedAffiliateBlocks(
    { blocks: [{ id: 'b', position: 'top', links: [{ ref: firstActive.linkId }] }] },
    commerceLinks,
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].links.length, 1);
  assert.equal(out[0].links[0].url, firstActive.targetUrl); // 逐字
  assert.ok(out[0].links[0].url.includes('uid1=blog'), 'production targetUrl should retain uid1=blog');
  assertSafeUrls(out[0].links, [firstActive.linkId]);
});

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
