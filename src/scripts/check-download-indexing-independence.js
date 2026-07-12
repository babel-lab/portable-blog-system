#!/usr/bin/env node
// Phase 20260712：check:download-indexing-independence
//
// Cross-resolver invariant guard：assert Dean §1.3 之「indexing 必須獨立、可覆寫」規則
// 於既有 architecture 之 core invariant 已完整落地，且未來 refactor 不會回歸為「隱性耦合」。
//
// per docs/20260712-download-page-indexing-independence-policy-lock.md §4.3
//
// Invariant（本 guard 之核心 assertion）：
//   當 seo.indexing 為 explicit 合法值（'index' / 'noindex-follow' / 'noindex-nofollow'）
//   時，resolvePostDetailRobots() 與 shouldIncludeInSitemap() 之結果，完全由 seo.indexing
//   決定，與 (contentKind, pageType) 之任意組合無關。
//
// 邊界 / 紅線（binding；per docs §4.4）：
//   - ❌ 不 import build-github.js / build-sitemap.js（其 import 即觸發 main() build side effect）；
//     只呼叫既有 pure resolver（page-type-robots.js / include-in-sitemap.js / include-in-listings.js）。
//   - ❌ 不改 production posts / registry / build / package（除 package.json 之 1 個 script 註冊）。
//   - ❌ 不新增 validator rule / schema 欄位 / EJS / SCSS。
//   - ❌ 不 build / deploy / dev server / fetch / pull / Blogger API / GA4 / AdSense / Search Console。
//   - ❌ 不動既有 3 支 per-resolver guard（check-page-type-robots.js / check-include-in-listings.js
//     / check-include-in-sitemap.js）語意；本 guard 為 matrix 補強、非 case 重疊。
//   - ✅ 本 guard **不**加入任何 umbrella check（不進 check:phase1-readiness / check:metadata-all /
//     check:release-readiness）；standalone / additive only。
//
// 執行：node src/scripts/check-download-indexing-independence.js
//   exit 0 = 全 PASS；exit 1 = 任一 case FAIL。

import { strict as assert } from 'node:assert';
import { resolvePostDetailRobots } from './page-type-robots.js';
import { shouldIncludeInSitemap, isSitemapEligible } from './include-in-sitemap.js';
import { shouldIncludeInListings } from './include-in-listings.js';

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failed++;
    console.log(`[FAIL] ${name} :: ${err.message}`);
  }
}

// post factory：最小欄位；caller 以 overrides 疊加
function post(overrides = {}) {
  return { slug: 'sample', ...overrides };
}

const DEFAULT_ROBOTS = 'index, follow';

// 三軸 matrix（per docs §4.3 M-A / M-B）
const CONTENT_KINDS = ['post', 'page', 'download', 'tech-note', 'book-review'];
const PAGE_TYPES = [
  undefined,
  'article',
  'static_page',
  'landing',
  'platform_special',
  'download',
  'gated_download',
  'utility_hidden',
  'redirect_canonical',
];

// explicit seo.indexing 之三個合法值（per validate-content.js VALID_SEO_INDEXING）
const EXPLICIT_INDEXING = [
  { value: 'index', robots: 'index, follow', sitemapEligible: true },
  { value: 'noindex-follow', robots: 'noindex, follow', sitemapEligible: false },
  { value: 'noindex-nofollow', robots: 'noindex, nofollow', sitemapEligible: false },
];

// ── Matrix M-A：robots invariance under explicit seo.indexing ────────────────
//   對 (contentKind × pageType) 每一 cell，assert explicit seo.indexing 完全決定 robots。
console.log('');
console.log('── Matrix M-A: robots invariance under explicit seo.indexing ──');
for (const explicit of EXPLICIT_INDEXING) {
  for (const contentKind of CONTENT_KINDS) {
    for (const pageType of PAGE_TYPES) {
      const p = post({ contentKind, ...(pageType ? { pageType } : {}), seo: { indexing: explicit.value } });
      const label = `M-A: seo.indexing="${explicit.value}" + contentKind="${contentKind}" + pageType=${pageType ?? '(absent)'} → robots "${explicit.robots}"`;
      check(label, () => {
        assert.equal(resolvePostDetailRobots(p, DEFAULT_ROBOTS), explicit.robots);
      });
    }
  }
}

// ── Matrix M-B：sitemap invariance under explicit seo.indexing ──────────────
//   對 (contentKind × pageType) 每一 cell，assert explicit seo.indexing 完全決定 sitemap
//   eligibility：'index' → eligible (isSitemapEligible === true)；'noindex-*' → not eligible。
console.log('');
console.log('── Matrix M-B: sitemap eligibility invariance under explicit seo.indexing ──');
for (const explicit of EXPLICIT_INDEXING) {
  for (const contentKind of CONTENT_KINDS) {
    for (const pageType of PAGE_TYPES) {
      const p = post({ contentKind, ...(pageType ? { pageType } : {}), seo: { indexing: explicit.value } });
      const label = `M-B: seo.indexing="${explicit.value}" + contentKind="${contentKind}" + pageType=${pageType ?? '(absent)'} → sitemap eligible=${explicit.sitemapEligible}`;
      check(label, () => {
        assert.equal(isSitemapEligible(p), explicit.sitemapEligible);
      });
    }
  }
}

// ── Matrix M-C：archetype A（activity/direct-download）完整範例 sanity ──────
//   per docs §3.1 方案 A-1：pageType:landing + explicit index + includeInSitemap:true + includeInListings:true
console.log('');
console.log('── Matrix M-C: archetype A (activity/direct-download) sanity ──');
{
  const archetypeA = post({
    contentKind: 'page',
    pageType: 'landing',
    seo: { indexing: 'index' },
    includeInSitemap: true,
    includeInListings: true,
  });
  check('M-C1: archetype A → robots "index, follow"', () => {
    assert.equal(resolvePostDetailRobots(archetypeA, DEFAULT_ROBOTS), 'index, follow');
  });
  check('M-C2: archetype A → sitemap include (true)', () => {
    assert.equal(shouldIncludeInSitemap(archetypeA), true);
  });
  check('M-C3: archetype A → listing include (true)', () => {
    assert.equal(shouldIncludeInListings(archetypeA), true);
  });
}

// 方案 A-2 補強：contentKind:download + pageType:landing + explicit index + explicit include-in-*
{
  const archetypeA2 = post({
    contentKind: 'download',
    pageType: 'landing',
    seo: { indexing: 'index' },
    includeInSitemap: true,
    includeInListings: true,
  });
  check('M-C4: archetype A-2 (contentKind:download + explicit index) → robots "index, follow"', () => {
    assert.equal(resolvePostDetailRobots(archetypeA2, DEFAULT_ROBOTS), 'index, follow');
  });
  check('M-C5: archetype A-2 → sitemap include (safety 放行)', () => {
    assert.equal(shouldIncludeInSitemap(archetypeA2), true);
  });
  check('M-C6: archetype A-2 → listing include (explicit opt-in 覆蓋 Slice 2 default-exclude)', () => {
    assert.equal(shouldIncludeInListings(archetypeA2), true);
  });
}

// ── Matrix M-D：archetype B（Google Form gated download）完整範例 sanity ────
//   per docs §3.2：pageType:gated_download + explicit noindex-follow + explicit exclude
console.log('');
console.log('── Matrix M-D: archetype B (Google Form gated) sanity ──');
{
  const archetypeB = post({
    contentKind: 'download',
    pageType: 'gated_download',
    seo: { indexing: 'noindex-follow' },
    includeInSitemap: false,
    includeInListings: false,
  });
  check('M-D1: archetype B → robots "noindex, follow"', () => {
    assert.equal(resolvePostDetailRobots(archetypeB, DEFAULT_ROBOTS), 'noindex, follow');
  });
  check('M-D2: archetype B → sitemap exclude (safety + explicit false)', () => {
    assert.equal(shouldIncludeInSitemap(archetypeB), false);
  });
  check('M-D3: archetype B → listing exclude (explicit false)', () => {
    assert.equal(shouldIncludeInListings(archetypeB), false);
  });
}

// 補強：archetype B 之 opt-in index 罕見 case（explicit override 覆蓋 gated_download default）
{
  const archetypeBOptIn = post({
    contentKind: 'download',
    pageType: 'gated_download',
    seo: { indexing: 'index' },
  });
  check('M-D4: gated_download + explicit index → robots "index, follow"（override wins）', () => {
    assert.equal(resolvePostDetailRobots(archetypeBOptIn, DEFAULT_ROBOTS), 'index, follow');
  });
  check('M-D5: gated_download + explicit index → sitemap eligible (safety 放行)', () => {
    assert.equal(isSitemapEligible(archetypeBOptIn), true);
  });
}

// ── Matrix M-E：legacy MVP post shape 保留（Q6 asymmetry documented hold）───
//   per docs §3.3 + docs/20260626-q6-download-listing-asymmetry-policy-lock.md
console.log('');
console.log('── Matrix M-E: legacy MVP shape (Q6 asymmetry hold) ──');
{
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
  check('M-E1: mvp shape → robots "noindex, follow"', () => {
    assert.equal(resolvePostDetailRobots(mvpLike, DEFAULT_ROBOTS), 'noindex, follow');
  });
  check('M-E2: mvp shape → sitemap exclude (safety)', () => {
    assert.equal(shouldIncludeInSitemap(mvpLike), false);
  });
  check('M-E3: mvp shape → listing include (Q6 documented asymmetry)', () => {
    assert.equal(shouldIncludeInListings(mvpLike), true);
  });
}

// ── Matrix M-F：fallback default-behavior 保留（無 explicit seo.indexing）──
//   assert 未 explicit 情況下，legacy / derived defaults 未 drift。
console.log('');
console.log('── Matrix M-F: default-behavior when seo.indexing absent ──');
{
  // legacy contentKind:download safety fallback
  check('M-F1: contentKind:download + no seo/pageType → "noindex, follow"（SEO-1 legacy）', () => {
    assert.equal(resolvePostDetailRobots(post({ contentKind: 'download' }), DEFAULT_ROBOTS), 'noindex, follow');
  });
  check('M-F2: contentKind:download + no seo → sitemap exclude (legacy safety)', () => {
    assert.equal(isSitemapEligible(post({ contentKind: 'download' })), false);
  });

  // pageType:download derived default
  check('M-F3: pageType:download + no seo/contentKind:page → "noindex, follow"（SP-3 derived）', () => {
    assert.equal(
      resolvePostDetailRobots(post({ contentKind: 'page', pageType: 'download' }), DEFAULT_ROBOTS),
      'noindex, follow',
    );
  });

  // pageType:gated_download derived default
  check('M-F4: pageType:gated_download + no seo/contentKind:page → "noindex, follow"（SP-3 derived）', () => {
    assert.equal(
      resolvePostDetailRobots(post({ contentKind: 'page', pageType: 'gated_download' }), DEFAULT_ROBOTS),
      'noindex, follow',
    );
  });

  // pageType:landing → 無推導 → default index
  check('M-F5: pageType:landing + no seo/contentKind:page → "index, follow"（activity archetype default 落點）', () => {
    assert.equal(
      resolvePostDetailRobots(post({ contentKind: 'page', pageType: 'landing' }), DEFAULT_ROBOTS),
      'index, follow',
    );
  });

  // pageType:article → 無推導
  check('M-F6: pageType:article + no seo/contentKind:post → "index, follow"（normal article default）', () => {
    assert.equal(
      resolvePostDetailRobots(post({ contentKind: 'post', pageType: 'article' }), DEFAULT_ROBOTS),
      'index, follow',
    );
  });

  // pageType:utility_hidden → derived noindex, nofollow
  check('M-F7: pageType:utility_hidden + no seo → "noindex, nofollow"（SP-3 derived）', () => {
    assert.equal(
      resolvePostDetailRobots(post({ contentKind: 'page', pageType: 'utility_hidden' }), DEFAULT_ROBOTS),
      'noindex, nofollow',
    );
  });

  // pageType:redirect_canonical → derived noindex, follow
  check('M-F8: pageType:redirect_canonical + no seo → "noindex, follow"（SP-3 derived）', () => {
    assert.equal(
      resolvePostDetailRobots(post({ contentKind: 'page', pageType: 'redirect_canonical' }), DEFAULT_ROBOTS),
      'noindex, follow',
    );
  });

  // SAFETY：contentKind:download + pageType:landing + 無 seo → 仍 noindex, follow（不放寬）
  check('M-F9: SAFETY contentKind:download + pageType:landing + no seo → "noindex, follow"（SEO-1 safety 不放寬）', () => {
    assert.equal(
      resolvePostDetailRobots(post({ contentKind: 'download', pageType: 'landing' }), DEFAULT_ROBOTS),
      'noindex, follow',
    );
  });
}

// ── Matrix M-G：explicit override 完全獨立於 pageType 之 sanity aggregate ───
//   Dean §1.3 core invariant 之最直接 statement。
console.log('');
console.log('── Matrix M-G: explicit override 獨立性 aggregate（Dean §1.3 core）──');
{
  // "只因為是直接下載，就在程式內永久推論為 index" — 禁止；因此以下 case 中，
  //   contentKind:download 之 default 仍是 noindex；但 explicit 'index' 可覆寫。
  check('M-G1: contentKind:download + explicit index → "index, follow"（禁止永久推論 noindex）', () => {
    assert.equal(
      resolvePostDetailRobots(post({ contentKind: 'download', seo: { indexing: 'index' } }), DEFAULT_ROBOTS),
      'index, follow',
    );
  });

  // "只因為經過 Google Form，就在程式內永久推論為 noindex" — 禁止；因此 gated_download
  //   之 default 是 noindex，但 explicit 'index' 可覆寫。
  check('M-G2: pageType:gated_download + explicit index → "index, follow"（禁止永久推論 noindex）', () => {
    assert.equal(
      resolvePostDetailRobots(
        post({ contentKind: 'page', pageType: 'gated_download', seo: { indexing: 'index' } }),
        DEFAULT_ROBOTS,
      ),
      'index, follow',
    );
  });

  // 若 explicit 'noindex-follow' 於 article page 也可強制 noindex（獨立控制）。
  check('M-G3: pageType:article + explicit noindex-follow → "noindex, follow"（獨立可 opt-out index）', () => {
    assert.equal(
      resolvePostDetailRobots(
        post({ contentKind: 'post', pageType: 'article', seo: { indexing: 'noindex-follow' } }),
        DEFAULT_ROBOTS,
      ),
      'noindex, follow',
    );
  });

  // 三面向正交（listing 不由 robots 推論）：pageType:gated_download + explicit index +
  //   includeInListings 缺省 → listing 仍 default-exclude（Slice 2 gated_download default-exclude
  //   維持；robots 與 listing 正交）。author 若要 index + listing 都有，須同時 explicit 兩者。
  check('M-G4: listing 與 robots 正交：pageType:gated_download + explicit index + missing includeInListings → listing false', () => {
    assert.equal(
      shouldIncludeInListings(
        post({ contentKind: 'page', pageType: 'gated_download', seo: { indexing: 'index' } }),
      ),
      false,
    );
  });
  check('M-G5: listing 與 robots 正交：pageType:gated_download + explicit index + explicit includeInListings:true → listing true', () => {
    assert.equal(
      shouldIncludeInListings(
        post({
          contentKind: 'page',
          pageType: 'gated_download',
          seo: { indexing: 'index' },
          includeInListings: true,
        }),
      ),
      true,
    );
  });
}

// ── summary ─────────────────────────────────────────────────────────────────
console.log('');
console.log(`download indexing independence guard: ${passed}/${passed + failed} ${failed === 0 ? 'PASS' : 'FAIL'}`);
if (failed > 0) process.exit(1);
