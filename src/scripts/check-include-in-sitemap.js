// Phase 20260623-pm-sp5a-include-in-sitemap-selector-wiring-a：
//   includeInSitemap selector（SP-5a）regression smoke harness。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.3
//   + docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md（mirror 慣例）
//
// 目的：鎖住 src/scripts/include-in-sitemap.js 之 selector 契約：
//   1. 既有 safety exclusion 永遠優先（noindex-* / legacy contentKind:download）；
//      includeInSitemap === true 不得放寬。
//   2. eligible 之後：顯式 false → exclude；缺省 / 非 boolean → 既有行為（include）。
//   3. sitemap inclusion 與 listing inclusion 正交（不讀 includeInListings）。
//   4. 不新增 pageType sitemap 預設（gated_download 無 seo.indexing / contentKind → 既有行為）。
//
// 約束（mirror src/scripts/check-include-in-listings.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - 不 import build-sitemap.js（其 import 即觸發 main() build side effect）；只測純函式
//   - 不改 production posts / registry / build / package
//
// 執行：node src/scripts/check-include-in-sitemap.js
//   - exit 0 = 全 pass；exit 1 = 任一 case fail

import { strict as assert } from 'node:assert';
import {
  isSitemapEligible,
  resolveIncludeInSitemap,
  shouldIncludeInSitemap,
} from './include-in-sitemap.js';

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
  return { contentKind: 'post', slug: 'sample', ...overrides };
}

// ── 1. normal eligible post + missing includeInSitemap → true ────────────────
check('normal eligible + missing includeInSitemap → true', () => {
  assert.equal(shouldIncludeInSitemap(post()), true);
});

// ── 2. seo.indexing index + includeInSitemap true → true ─────────────────────
check('seo.indexing index + includeInSitemap true → true', () => {
  assert.equal(
    shouldIncludeInSitemap(post({ seo: { indexing: 'index' }, includeInSitemap: true })),
    true,
  );
});

// ── 3. includeInSitemap false → false ────────────────────────────────────────
check('eligible + includeInSitemap false → false', () => {
  assert.equal(shouldIncludeInSitemap(post({ includeInSitemap: false })), false);
});

// ── 4. 非 boolean（number / null / object）→ 既有行為（eligible → true）───────
check('includeInSitemap invalid string → true', () => {
  assert.equal(shouldIncludeInSitemap(post({ includeInSitemap: 'false' })), true);
});
check('includeInSitemap invalid number 0 → true', () => {
  assert.equal(shouldIncludeInSitemap(post({ includeInSitemap: 0 })), true);
});
check('includeInSitemap invalid null → true', () => {
  assert.equal(shouldIncludeInSitemap(post({ includeInSitemap: null })), true);
});
check('includeInSitemap invalid object → true', () => {
  assert.equal(shouldIncludeInSitemap(post({ includeInSitemap: {} })), true);
});

// ── 5. seo.indexing noindex-follow + includeInSitemap true → false ───────────
check('noindex-follow + includeInSitemap true → false（safety 優先）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({ seo: { indexing: 'noindex-follow' }, includeInSitemap: true }),
    ),
    false,
  );
});

// ── 6. seo.indexing noindex-nofollow + includeInSitemap true → false ─────────
check('noindex-nofollow + includeInSitemap true → false（safety 優先）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({ seo: { indexing: 'noindex-nofollow' }, includeInSitemap: true }),
    ),
    false,
  );
});

// ── 7. contentKind download + includeInSitemap true → false ──────────────────
check('contentKind download + includeInSitemap true → false（legacy safety 優先）', () => {
  assert.equal(
    shouldIncludeInSitemap(post({ contentKind: 'download', includeInSitemap: true })),
    false,
  );
});

// ── 8. contentKind download + missing includeInSitemap → false ───────────────
check('contentKind download + missing includeInSitemap → false', () => {
  assert.equal(shouldIncludeInSitemap(post({ contentKind: 'download' })), false);
});

// ── 9. eligible + includeInSitemap false → false（重申顯式排除）─────────────
check('eligible normal + includeInSitemap false → false', () => {
  assert.equal(
    shouldIncludeInSitemap(post({ contentKind: 'post', includeInSitemap: false })),
    false,
  );
});

// ── 10. portable-blog-system-mvp 形狀（contentKind download，無 includeInSitemap）→ false ─
check('mvp-like (contentKind download, no includeInSitemap) → false', () => {
  const mvpLike = {
    id: '20260504-portable-blog-system-mvp',
    slug: 'portable-blog-system-mvp',
    site: 'github',
    contentKind: 'download',
    status: 'ready',
    draft: false,
  };
  assert.equal(shouldIncludeInSitemap(mvpLike), false);
});

// ── 11. includeInListings false but otherwise sitemap eligible → true（正交性）─
check('includeInListings false + otherwise eligible → true（listing/sitemap 正交）', () => {
  assert.equal(
    shouldIncludeInSitemap(post({ includeInListings: false })),
    true,
  );
});

// ── 12. pageType gated_download + 無 seo.indexing + 無 contentKind:download + 缺省 → 既有行為（true）─
//   本 phase 不新增 pageType sitemap 預設；現行 sitemap 不消費 pageType → 不 auto-exclude。
check('pageType gated_download + no seo.indexing + no download + missing → true（不新增 pageType 預設）', () => {
  assert.equal(
    shouldIncludeInSitemap({ slug: 'gated', pageType: 'gated_download', contentKind: 'page' }),
    true,
  );
});

// ── 補強：explicit index 覆蓋 download exclusion（既有行為保留）──────────────
check('seo.indexing index + contentKind download → true（explicit index 覆蓋 legacy）', () => {
  assert.equal(
    shouldIncludeInSitemap(post({ contentKind: 'download', seo: { indexing: 'index' } })),
    true,
  );
});

// ── 補強：isSitemapEligible 逐字對齊既有 build-sitemap precedence ────────────
check('isSitemapEligible mirrors legacy precedence', () => {
  assert.equal(isSitemapEligible(post()), true);
  assert.equal(isSitemapEligible(post({ seo: { indexing: 'noindex-follow' } })), false);
  assert.equal(isSitemapEligible(post({ seo: { indexing: 'noindex-nofollow' } })), false);
  assert.equal(isSitemapEligible(post({ contentKind: 'download' })), false);
  assert.equal(
    isSitemapEligible(post({ contentKind: 'download', seo: { indexing: 'index' } })),
    true,
  );
});

// ── 補強：resolveIncludeInSitemap（lower-level）回傳與 shouldIncludeInSitemap 一致 ─
check('resolveIncludeInSitemap mirrors shouldIncludeInSitemap', () => {
  const variants = [
    post(),
    post({ includeInSitemap: true }),
    post({ includeInSitemap: false }),
    post({ includeInSitemap: 'x' }),
    post({ contentKind: 'download' }),
    post({ seo: { indexing: 'noindex-follow' }, includeInSitemap: true }),
  ];
  for (const p of variants) {
    assert.equal(resolveIncludeInSitemap(p), shouldIncludeInSitemap(p));
  }
});

// ── 補強：null / undefined post → false（防呆，不 throw；無 slug 無法入 sitemap）─
check('null / undefined post → false（防呆）', () => {
  assert.equal(shouldIncludeInSitemap(null), false);
  assert.equal(shouldIncludeInSitemap(undefined), false);
});

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
