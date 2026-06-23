// Phase 20260623-pm-sp4a-include-in-listings-selector-github-wiring-a：
//   includeInListings selector（SP-4a）regression smoke harness。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.4
//   + docs/20260623-sp4-include-in-listings-inventory-preflight.md §H / §I
//
// 目的：鎖住 src/scripts/include-in-listings.js 之 selector 契約：
//   1. 缺省 includeInListings → true（既有輸出 byte-identical 之保證）
//   2. 顯式 true → true；顯式 false → false
//   3. 非 boolean（string / number / null / object）→ true（runtime safety）
//   4. ❌ 不由 contentKind / pageType / seo.indexing 推導 listing 排除（正交性）
//
// 約束（mirror src/scripts/check-page-type-robots.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - 不 import build-github.js（其 import 即觸發 main() build side effect）；只測純函式
//   - 不改 production posts / registry / build / package
//
// 執行：node src/scripts/check-include-in-listings.js
//   - exit 0 = 全 pass；exit 1 = 任一 case fail

import { strict as assert } from 'node:assert';
import { resolveIncludeInListings, shouldIncludeInListings } from './include-in-listings.js';

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

// post factory：最小欄位；caller 以 overrides 疊加
function post(overrides = {}) {
  return { contentKind: 'post', ...overrides };
}

// ── 1. 缺省 includeInListings → true ─────────────────────────────────────────
check('missing includeInListings → true', () => {
  assert.equal(shouldIncludeInListings(post()), true);
});

// ── 2. 顯式 true → true ──────────────────────────────────────────────────────
check('includeInListings true → true', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: true })), true);
});

// ── 3. 顯式 false → false ────────────────────────────────────────────────────
check('includeInListings false → false', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: false })), false);
});

// ── 4. 非 boolean（string / number / null / object）→ true（runtime safety）───
check('includeInListings invalid string → true', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: 'false' })), true);
});
check('includeInListings invalid number 0 → true', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: 0 })), true);
});
check('includeInListings invalid null → true', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: null })), true);
});
check('includeInListings invalid object → true', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: {} })), true);
});

// ── 5. contentKind download + 缺省 → true（正交；legacy download 不自動隱藏）──
check('contentKind download + missing includeInListings → true', () => {
  assert.equal(shouldIncludeInListings(post({ contentKind: 'download' })), true);
});

// ── 6. contentKind download + 顯式 true → true ──────────────────────────────
check('contentKind download + includeInListings true → true', () => {
  assert.equal(
    shouldIncludeInListings(post({ contentKind: 'download', includeInListings: true })),
    true,
  );
});

// ── 7. pageType gated_download + 缺省 → true（正交；pageType 不推導 listing 排除）─
check('pageType gated_download + missing includeInListings → true', () => {
  assert.equal(shouldIncludeInListings(post({ pageType: 'gated_download' })), true);
});

// ── 8. seo.indexing noindex-follow + 缺省 → true（正交；seo.indexing 不耦合）──
check('seo.indexing noindex-follow + missing includeInListings → true', () => {
  assert.equal(
    shouldIncludeInListings(post({ seo: { indexing: 'noindex-follow' } })),
    true,
  );
});

// ── 9. includeInSitemap false + 缺省 includeInListings → true（兩維度正交）────
check('includeInSitemap false + missing includeInListings → true', () => {
  assert.equal(shouldIncludeInListings(post({ includeInSitemap: false })), true);
});

// ── 10. portable-blog-system-mvp 形狀（contentKind download，無 includeInListings）→ true ─
check('mvp-like (contentKind download, no includeInListings) → true', () => {
  const mvpLike = {
    id: '20260504-portable-blog-system-mvp',
    slug: 'portable-blog-system-mvp',
    site: 'github',
    contentKind: 'download',
    status: 'ready',
    draft: false,
  };
  assert.equal(shouldIncludeInListings(mvpLike), true);
});

// ── 補強：顯式 false 即使 contentKind/pageType 正常仍隱藏（SP-4b 路徑提前鎖契約）─
check('explicit false wins over normal contentKind → false', () => {
  assert.equal(
    shouldIncludeInListings(post({ contentKind: 'post', includeInListings: false })),
    false,
  );
});

// ── 補強：resolveIncludeInListings（lower-level）回傳與 shouldIncludeInListings 一致 ─
check('resolveIncludeInListings mirrors shouldIncludeInListings', () => {
  for (const v of [undefined, true, false, 'x', 0, null, {}]) {
    const p = post({ includeInListings: v });
    assert.equal(resolveIncludeInListings(p), shouldIncludeInListings(p));
  }
});

// ── 補強：null / undefined post → true（防呆，不 throw）──────────────────────
check('null post → true（防呆）', () => {
  assert.equal(shouldIncludeInListings(null), true);
  assert.equal(shouldIncludeInListings(undefined), true);
});

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
