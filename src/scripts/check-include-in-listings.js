// Phase 20260623-pm-sp4a-include-in-listings-selector-github-wiring-a：
//   includeInListings selector（SP-4a）regression smoke harness。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.4
//   + docs/20260623-sp4-include-in-listings-inventory-preflight.md §H / §I
//
// Phase 20260624-night-special-page-slice2-listing-selector-optin-landing-a：
//   Slice 2 — download / gated_download 特殊頁 listing 預設 opt-in 之契約鎖。
//   per docs/20260624-download-listing-special-page-preflight-spec-lock.md §2.D Slice 2
//
// 目的：鎖住 src/scripts/include-in-listings.js 之 selector 契約：
//   1. normal post 缺省 includeInListings → true（既有輸出 byte-identical 之保證）
//   2. 顯式 true → true；顯式 false → false（top-level false 最高優先）
//   3. 非 boolean（string / number / null / object）→ 走預設路徑（normal post → true；
//      Slice 2 特殊頁 → false；validator 已對非法型別 warn）
//   4. Slice 2：contentKind=download / pageType ∈ {download, gated_download} 之 post：
//      - 缺省 includeInListings → false（default-exclude）
//      - 顯式 includeInListings: true → true（明示 opt-in）
//      - 顯式 includeInListings: false → false（top-level false 仍最高優先）
//   5. ❌ 不由 seo.indexing / robots / includeInSitemap 推導 listing 排除（正交性）
//   6. SP-9b：platformPolicy.github.includeInListings === false 仍可排除（policy true 為 no-op）
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

// ── 1. normal post：缺省 includeInListings → true（byte-identical 保證）─────────
check('R1 normal post, missing includeInListings → true', () => {
  assert.equal(shouldIncludeInListings(post()), true);
});

// ── 2. 顯式 false → false（top-level 最高優先）────────────────────────────────
check('R2 includeInListings:false → false', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: false })), false);
});

// ── 3. 顯式 true → true（normal post 不變）────────────────────────────────────
check('R3 includeInListings:true → true', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: true })), true);
});

// ── 4. Slice 2：contentKind=download + 缺省 includeInListings → false（default-exclude）─
check('R4 contentKind:download + missing includeInListings → false (Slice 2 default-exclude)', () => {
  assert.equal(shouldIncludeInListings(post({ contentKind: 'download' })), false);
});

// ── 5. Slice 2：pageType=download + 缺省 → false ─────────────────────────────
check('R5 pageType:download + missing includeInListings → false (Slice 2 default-exclude)', () => {
  assert.equal(shouldIncludeInListings(post({ pageType: 'download' })), false);
});

// ── 6. Slice 2：pageType=gated_download + 缺省 → false ───────────────────────
check('R6 pageType:gated_download + missing includeInListings → false (Slice 2 default-exclude)', () => {
  assert.equal(shouldIncludeInListings(post({ pageType: 'gated_download' })), false);
});

// ── 7. Slice 2：contentKind=download + 顯式 includeInListings:true → true（opt-in）─
check('R7 contentKind:download + includeInListings:true → true (explicit opt-in)', () => {
  assert.equal(
    shouldIncludeInListings(post({ contentKind: 'download', includeInListings: true })),
    true,
  );
});

// ── 8. Slice 2：pageType=gated_download + 顯式 includeInListings:true → true（opt-in）─
check('R8 pageType:gated_download + includeInListings:true → true (explicit opt-in)', () => {
  assert.equal(
    shouldIncludeInListings(post({ pageType: 'gated_download', includeInListings: true })),
    true,
  );
});

// ── 9. SP-9b：platformPolicy.github.includeInListings:false 仍排除 ─────────────
check('R9 platformPolicy.github.includeInListings:false → false (SP-9b unchanged)', () => {
  assert.equal(
    shouldIncludeInListings(
      post({ platformPolicy: { github: { includeInListings: false } } }),
    ),
    false,
  );
});

// ── 10. 正交性：seo.indexing/robots 不單獨成為 listing selector ────────────────
//   normal post + seo.indexing:noindex-* + 缺省 includeInListings → 仍 true
//   （selector 不讀 seo.indexing；listing 與 robots 完全正交）
check('R10 normal post + seo.indexing noindex-follow + missing → true (robots not a listing selector)', () => {
  assert.equal(
    shouldIncludeInListings(post({ seo: { indexing: 'noindex-follow' } })),
    true,
  );
});

// ── 補強：top-level false 覆寫 contentKind:download + policy true 之疊加組合 ─
check('R11 contentKind:download + includeInListings:false → false (top-level false wins)', () => {
  assert.equal(
    shouldIncludeInListings(post({ contentKind: 'download', includeInListings: false })),
    false,
  );
});

// ── 補強：pageType:gated_download + includeInListings:false → false（top-level false 最高）─
check('R12 pageType:gated_download + includeInListings:false → false (top-level false wins)', () => {
  assert.equal(
    shouldIncludeInListings(post({ pageType: 'gated_download', includeInListings: false })),
    false,
  );
});

// ── 補強：非 boolean（string/number/null/object）走預設路徑 ───────────────────
//   normal post + invalid type → 預設 include（true）；
//   Slice 2 特殊頁 + invalid type → 預設 exclude（false）
//   （validator rule 2 `page-include-flag-invalid-type` 已 warn）
check('R13 normal post + invalid string includeInListings → true (runtime safety; default include)', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: 'false' })), true);
});
check('R14 normal post + invalid number 0 → true (runtime safety)', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: 0 })), true);
});
check('R15 normal post + invalid null → true (runtime safety)', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: null })), true);
});
check('R16 normal post + invalid object → true (runtime safety)', () => {
  assert.equal(shouldIncludeInListings(post({ includeInListings: {} })), true);
});
check('R17 contentKind:download + invalid string includeInListings → false (Slice 2 default-exclude)', () => {
  assert.equal(
    shouldIncludeInListings(post({ contentKind: 'download', includeInListings: 'true' })),
    false,
  );
});

// ── 補強：includeInSitemap false 不影響 listings（正交）──────────────────────
check('R18 includeInSitemap:false + missing includeInListings → true (orthogonal)', () => {
  assert.equal(shouldIncludeInListings(post({ includeInSitemap: false })), true);
});

// ── 補強：portable-blog-system-mvp 形狀（contentKind:download + 顯式 includeInListings:true）→ true ─
//   per Dean Slice 2 decision: mvp.md listing intent = keep。
check('R19 mvp-like (contentKind:download + includeInListings:true) → true', () => {
  const mvpLike = {
    id: '20260504-portable-blog-system-mvp',
    slug: 'portable-blog-system-mvp',
    site: 'github',
    contentKind: 'download',
    status: 'ready',
    draft: false,
    seo: { indexing: 'noindex-follow' },
    includeInListings: true,
  };
  assert.equal(shouldIncludeInListings(mvpLike), true);
});

// ── 補強：resolveIncludeInListings（lower-level）回傳與 shouldIncludeInListings 一致 ─
check('R20 resolveIncludeInListings mirrors shouldIncludeInListings', () => {
  const fixtures = [
    post(),
    post({ includeInListings: true }),
    post({ includeInListings: false }),
    post({ contentKind: 'download' }),
    post({ contentKind: 'download', includeInListings: true }),
    post({ pageType: 'gated_download' }),
    post({ pageType: 'download', includeInListings: false }),
    post({ platformPolicy: { github: { includeInListings: false } } }),
  ];
  for (const p of fixtures) {
    assert.equal(resolveIncludeInListings(p), shouldIncludeInListings(p));
  }
});

// ── 補強：null / undefined post → true（防呆，不 throw）──────────────────────
check('R21 null post → true (defensive)', () => {
  assert.equal(shouldIncludeInListings(null), true);
  assert.equal(shouldIncludeInListings(undefined), true);
});

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
