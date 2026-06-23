// Phase 20260623-pm-sp3-github-page-type-robots-precedence-a：
//   special page-type → robots precedence（SP-3）regression smoke harness。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.2 / §4
//
// 目的：鎖住 src/scripts/page-type-robots.js 之 robots precedence 契約：
//   1. explicit seo.indexing 永遠最高優先
//   2. legacy contentKind === 'download' safety 不可被 pageType 放寬
//   3. pageType 推導僅在無 explicit seo.indexing 且非 download 時生效
//   4. 缺省 / 未知 pageType → 不推導 → 沿用既有 default（既有 post 輸出不變）
//
// 約束（mirror src/scripts/check-page-type-validator.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - 不 import build-github.js（其 import 即觸發 main() build side effect）；只測純函式
//   - 不改 production posts / registry / build / package
//
// 執行：node src/scripts/check-page-type-robots.js
//   - exit 0 = 全 pass；exit 1 = 任一 case fail

import { strict as assert } from 'node:assert';
import { derivePageTypeRobots, resolvePostDetailRobots } from './page-type-robots.js';

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

const DEFAULT = 'index, follow';

// post factory：最小欄位；caller 以 overrides 疊加
function post(overrides = {}) {
  return { contentKind: 'post', ...overrides };
}
function withIndexing(indexing, overrides = {}) {
  return post({ seo: { indexing }, ...overrides });
}

// ── derivePageTypeRobots：pure pageType → robots map ──────────────────────────

check('derive: download → noindex, follow', () => {
  assert.equal(derivePageTypeRobots('download'), 'noindex, follow');
});
check('derive: gated_download → noindex, follow', () => {
  assert.equal(derivePageTypeRobots('gated_download'), 'noindex, follow');
});
check('derive: redirect_canonical → noindex, follow', () => {
  assert.equal(derivePageTypeRobots('redirect_canonical'), 'noindex, follow');
});
check('derive: utility_hidden → noindex, nofollow', () => {
  assert.equal(derivePageTypeRobots('utility_hidden'), 'noindex, nofollow');
});
for (const pt of ['article', 'static_page', 'landing', 'platform_special']) {
  check(`derive: ${pt} → null（不推導）`, () => {
    assert.equal(derivePageTypeRobots(pt), null);
  });
}
check('derive: unknown 值 → null', () => {
  assert.equal(derivePageTypeRobots('totally_unknown'), null);
});
check('derive: null / undefined → null', () => {
  assert.equal(derivePageTypeRobots(null), null);
  assert.equal(derivePageTypeRobots(undefined), null);
});

// ── resolvePostDetailRobots：完整 precedence ─────────────────────────────────

// 1. 無 pageType + 一般 post → 既有 default 不變
check('precedence: no pageType + normal post → default index, follow', () => {
  assert.equal(resolvePostDetailRobots(post(), DEFAULT), 'index, follow');
});

// 2. legacy contentKind: download + 無 seo.indexing + 無 pageType → 既有 noindex, follow 保留
check('precedence: legacy contentKind download (no seo/pageType) → noindex, follow', () => {
  assert.equal(resolvePostDetailRobots(post({ contentKind: 'download' }), DEFAULT), 'noindex, follow');
});

// 3. explicit seo.indexing: index + pageType: gated_download → explicit index 勝
check('precedence: explicit index + pageType gated_download → index, follow', () => {
  assert.equal(
    resolvePostDetailRobots(withIndexing('index', { pageType: 'gated_download' }), DEFAULT),
    'index, follow',
  );
});

// 4. explicit seo.indexing: noindex-follow + pageType: article → explicit 勝
check('precedence: explicit noindex-follow + pageType article → noindex, follow', () => {
  assert.equal(
    resolvePostDetailRobots(withIndexing('noindex-follow', { pageType: 'article' }), DEFAULT),
    'noindex, follow',
  );
});

// 5. explicit seo.indexing: noindex-nofollow → noindex, nofollow
check('precedence: explicit noindex-nofollow → noindex, nofollow', () => {
  assert.equal(resolvePostDetailRobots(withIndexing('noindex-nofollow'), DEFAULT), 'noindex, nofollow');
});

// 6. pageType: download + 無 explicit seo.indexing → derived noindex, follow
check('precedence: pageType download (no seo) → noindex, follow', () => {
  assert.equal(resolvePostDetailRobots(post({ pageType: 'download' }), DEFAULT), 'noindex, follow');
});

// 7. pageType: gated_download + 無 explicit seo.indexing → derived noindex, follow
check('precedence: pageType gated_download (no seo) → noindex, follow', () => {
  assert.equal(resolvePostDetailRobots(post({ pageType: 'gated_download' }), DEFAULT), 'noindex, follow');
});

// 8. pageType: redirect_canonical + 無 explicit seo.indexing → derived noindex, follow
check('precedence: pageType redirect_canonical (no seo) → noindex, follow', () => {
  assert.equal(
    resolvePostDetailRobots(post({ pageType: 'redirect_canonical' }), DEFAULT),
    'noindex, follow',
  );
});

// 9. pageType: utility_hidden + 無 explicit seo.indexing → derived noindex, nofollow
check('precedence: pageType utility_hidden (no seo) → noindex, nofollow', () => {
  assert.equal(
    resolvePostDetailRobots(post({ pageType: 'utility_hidden' }), DEFAULT),
    'noindex, nofollow',
  );
});

// 10. pageType: article/static_page/landing/platform_special + 無 seo → 無推導；default 不變
for (const pt of ['article', 'static_page', 'landing', 'platform_special']) {
  check(`precedence: pageType ${pt} (no seo) → default index, follow（無推導）`, () => {
    assert.equal(resolvePostDetailRobots(post({ pageType: pt }), DEFAULT), 'index, follow');
  });
}

// 11. SAFETY：contentKind: download + pageType: article + 無 seo.indexing → 不放寬 download noindex
check('SAFETY: contentKind download + pageType article (no seo) → noindex, follow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(post({ contentKind: 'download', pageType: 'article' }), DEFAULT),
    'noindex, follow',
  );
});

// 12. SAFETY：contentKind: download + pageType: landing（會 index 之類型）+ 無 seo → 仍 noindex, follow
check('SAFETY: contentKind download + pageType landing (no seo) → noindex, follow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(post({ contentKind: 'download', pageType: 'landing' }), DEFAULT),
    'noindex, follow',
  );
});

// 13. explicit seo.indexing 覆蓋 contentKind download（既有 SEO-2 行為保留）
check('precedence: explicit index + contentKind download → index, follow', () => {
  assert.equal(
    resolvePostDetailRobots(withIndexing('index', { contentKind: 'download' }), DEFAULT),
    'index, follow',
  );
});

// 14. unknown pageType + 無 seo → 不推導 → default
check('precedence: unknown pageType (no seo) → default', () => {
  assert.equal(resolvePostDetailRobots(post({ pageType: 'mystery' }), DEFAULT), 'index, follow');
});

// 15. defaultRobots 參數受尊重（default 路徑回傳呼叫端傳入值，確保 byte-identical）
check('precedence: caller default 受尊重（自訂 fallback）', () => {
  assert.equal(resolvePostDetailRobots(post(), 'CUSTOM-DEFAULT'), 'CUSTOM-DEFAULT');
});
check('precedence: 省略 defaultRobots → index, follow', () => {
  assert.equal(resolvePostDetailRobots(post()), 'index, follow');
});

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
