// Phase 20260623-pm-sp7a-admin-readonly-page-metadata-summary-a：
//   page-metadata-summary helper（SP-7a）regression smoke harness。
//   per docs/20260623-pm-sp7-admin-metadata-visibility-preanalysis.md §E / §F
//
// 目的：鎖住 src/scripts/page-metadata-summary.js 之 derivePageMetadataView 契約：
//   1. 缺省（無新欄位）→ default / current behavior（pageType article default、indexable、
//      listing true、sitemap eligible 依 contentKind、無 warning）。
//   2. effective 值委派既有 SP-3/4a/5a helper（robots / listing / sitemap）。
//   3. warning 逐條 mirror SP-2 validator rule type（precise 觸發）。
//   4. gatedDownload / platformPolicy 只投影 safe 欄位；suspicious-field 不 echo value。
//   5. 兩個指定案例：portable-blog-system-mvp（download：listing true / sitemap false）、
//      未來 gated_download 頁可表達且不洩 secret。
//
// 約束（mirror check-include-in-sitemap.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - 只 import 純 helper（不 import load-admin-posts.js / build-*；避免 side effect）
//   - 不改 production posts / registry / build / package
//
// 執行：node src/scripts/check-page-metadata-summary.js
//   - exit 0 = 全 pass；exit 1 = 任一 case fail

import { strict as assert } from 'node:assert';
import { derivePageMetadataView } from './page-metadata-summary.js';

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

function hasWarning(view, type) {
  return view.warnings.some((w) => w.type === type);
}

// --- 1. 缺省（一般文章；無新欄位）→ default / current behavior ---
check('absent: pageType default article, indexable, listing true, no warnings', () => {
  const v = derivePageMetadataView({ contentKind: 'post', slug: 'x' });
  assert.equal(v.pageType.raw, '');
  assert.equal(v.pageType.present, false);
  assert.equal(v.pageType.valid, null);
  assert.equal(v.pageType.label, 'article (default)');
  assert.equal(v.seoIndexing.indexable, true);
  assert.equal(v.seoIndexing.source, 'default');
  assert.equal(v.robots.value, 'index, follow');
  assert.equal(v.robots.source, 'default');
  assert.equal(v.includeInListings.effective, true);
  assert.equal(v.includeInListings.rawLabel, 'auto');
  assert.equal(v.includeInSitemap.effective, true);
  assert.equal(v.includeInFeeds.hasConsumer, false);
  assert.equal(v.gatedDownload.present, false);
  assert.equal(v.platformPolicy.present, false);
  assert.equal(v.warnings.length, 0);
  assert.equal(v.summary.listing, true);
  assert.equal(v.summary.sitemap, true);
});

check('null / non-object fm → safe defaults, no throw', () => {
  const v = derivePageMetadataView(null);
  assert.equal(v.pageType.label, 'article (default)');
  assert.equal(v.warnings.length, 0);
  assert.equal(v.includeInListings.effective, true);
});

// --- 2. portable-blog-system-mvp 案例（contentKind: download）---
check('mvp download: listing true (stays in listings), sitemap false (legacy safety), robots noindex follow', () => {
  const v = derivePageMetadataView({ contentKind: 'download', slug: 'portable-blog-system-mvp' });
  // listing 不受 contentKind 影響（SP-4a：只看 includeInListings）→ 仍顯示於列表
  assert.equal(v.includeInListings.effective, true);
  // sitemap：legacy download safety → 排除
  assert.equal(v.includeInSitemap.effective, false);
  assert.equal(v.includeInSitemap.eligible, false);
  // robots：legacy download → noindex, follow
  assert.equal(v.robots.value, 'noindex, follow');
  assert.equal(v.robots.source, 'legacy contentKind:download');
  // download contentKind 本身不觸發 SP-2 warning
  assert.equal(v.warnings.length, 0);
  assert.equal(v.summary.listing, true);
  assert.equal(v.summary.sitemap, false);
});

// --- 3. explicit seo.indexing 覆蓋（precedence）---
check('explicit seo.indexing=index overrides download → robots index follow', () => {
  const v = derivePageMetadataView({ contentKind: 'download', seo: { indexing: 'index' } });
  assert.equal(v.robots.value, 'index, follow');
  assert.equal(v.robots.source, 'frontmatter.seo.indexing');
  // explicit index 使 download 變 eligible → sitemap include
  assert.equal(v.includeInSitemap.effective, true);
  assert.equal(v.seoIndexing.indexable, true);
});

check('seo.indexing=noindex-follow → indexable false, robots noindex follow', () => {
  const v = derivePageMetadataView({ contentKind: 'post', seo: { indexing: 'noindex-follow' } });
  assert.equal(v.seoIndexing.indexable, false);
  assert.equal(v.robots.value, 'noindex, follow');
  assert.equal(v.robots.source, 'frontmatter.seo.indexing');
  // noindex → sitemap 排除
  assert.equal(v.includeInSitemap.effective, false);
});

// --- 4. pageType 推導 robots（無 explicit / 非 download）---
check('pageType=utility_hidden → robots noindex nofollow, source pageType', () => {
  const v = derivePageMetadataView({ contentKind: 'post', pageType: 'utility_hidden' });
  assert.equal(v.robots.value, 'noindex, nofollow');
  assert.equal(v.robots.source, 'pageType');
  assert.equal(v.pageType.valid, true);
  assert.equal(v.warnings.length, 0);
});

check('pageType=gated_download → robots noindex follow, valid, no warning when no bad combo', () => {
  const v = derivePageMetadataView({ contentKind: 'post', pageType: 'gated_download', seo: { indexing: 'noindex-follow' } });
  assert.equal(v.robots.value, 'noindex, follow');
  assert.equal(v.pageType.valid, true);
  assert.equal(v.warnings.length, 0);
});

// --- 5. explicit includeInListings / includeInSitemap override ---
check('includeInListings=false → effective false (hidden from listings)', () => {
  const v = derivePageMetadataView({ contentKind: 'post', includeInListings: false });
  assert.equal(v.includeInListings.effective, false);
  assert.equal(v.includeInListings.rawLabel, 'false');
  assert.equal(v.summary.listing, false);
});

check('includeInSitemap=false on eligible post → effective false', () => {
  const v = derivePageMetadataView({ contentKind: 'post', includeInSitemap: false });
  assert.equal(v.includeInSitemap.effective, false);
  assert.equal(v.includeInSitemap.rawLabel, 'false');
});

check('includeInSitemap=true cannot override noindex safety', () => {
  const v = derivePageMetadataView({ contentKind: 'post', seo: { indexing: 'noindex-follow' }, includeInSitemap: true });
  assert.equal(v.includeInSitemap.effective, false);
});

// --- 6. warnings mirror SP-2 validator rule types ---
check('warning: page-type-invalid (unknown pageType)', () => {
  const v = derivePageMetadataView({ contentKind: 'post', pageType: 'made_up' });
  assert.equal(v.pageType.valid, false);
  assert.ok(hasWarning(v, 'page-type-invalid'));
});

check('warning: page-include-flag-invalid-type (non-boolean)', () => {
  const v = derivePageMetadataView({ contentKind: 'post', includeInListings: 'yes' });
  assert.ok(hasWarning(v, 'page-include-flag-invalid-type'));
});

check('warning: page-platform-policy-invalid-type', () => {
  const v = derivePageMetadataView({ contentKind: 'post', platformPolicy: 'nope' });
  assert.ok(hasWarning(v, 'page-platform-policy-invalid-type'));
});

check('warning: page-gated-download-invalid-type', () => {
  const v = derivePageMetadataView({ contentKind: 'post', gatedDownload: 'nope' });
  assert.ok(hasWarning(v, 'page-gated-download-invalid-type'));
});

check('warning: page-gated-download-indexed (gated + index)', () => {
  const v = derivePageMetadataView({ contentKind: 'post', pageType: 'gated_download', seo: { indexing: 'index' } });
  assert.ok(hasWarning(v, 'page-gated-download-indexed'));
});

check('warning: page-gated-download-in-listings', () => {
  const v = derivePageMetadataView({ contentKind: 'post', pageType: 'gated_download', includeInListings: true });
  assert.ok(hasWarning(v, 'page-gated-download-in-listings'));
});

check('warning: page-noindex-in-sitemap (orthogonal)', () => {
  const v = derivePageMetadataView({ contentKind: 'post', seo: { indexing: 'noindex-follow' }, includeInSitemap: true });
  assert.ok(hasWarning(v, 'page-noindex-in-sitemap'));
});

check('warning: page-noindex-in-listings (orthogonal)', () => {
  const v = derivePageMetadataView({ contentKind: 'post', seo: { indexing: 'noindex-nofollow' }, includeInListings: true });
  assert.ok(hasWarning(v, 'page-noindex-in-listings'));
});

check('warning: page-redirect-canonical-missing-target (auto)', () => {
  const v = derivePageMetadataView({ contentKind: 'post', pageType: 'redirect_canonical', canonical: 'auto' });
  assert.ok(hasWarning(v, 'page-redirect-canonical-missing-target'));
});

check('no warning: redirect_canonical with explicit canonical', () => {
  const v = derivePageMetadataView({ contentKind: 'post', pageType: 'redirect_canonical', canonical: 'https://example.com/real' });
  assert.equal(hasWarning(v, 'page-redirect-canonical-missing-target'), false);
});

// --- 7. gatedDownload safe projection (no secret leak) ---
check('gatedDownload: safe fields projected, secret key flagged but value never echoed', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    pageType: 'gated_download',
    seo: { indexing: 'noindex-follow' },
    gatedDownload: {
      mechanism: 'google-form',
      postSubmitResource: 'drive-link',
      driveFolderId: 'SECRET-FOLDER-ID-123',
      token: 'SECRET-TOKEN-XYZ',
    },
  });
  assert.equal(v.gatedDownload.present, true);
  assert.equal(v.gatedDownload.isObject, true);
  assert.equal(v.gatedDownload.mechanism, 'google-form');
  assert.equal(v.gatedDownload.postSubmitResource, 'drive-link');
  // suspicious keys listed by NAME only
  assert.ok(v.gatedDownload.suspiciousKeys.includes('driveFolderId'));
  assert.ok(v.gatedDownload.suspiciousKeys.includes('token'));
  // suspicious-field warning present
  assert.ok(hasWarning(v, 'page-gated-download-suspicious-field'));
  // value never echoed anywhere in the serialized view
  const serialized = JSON.stringify(v);
  assert.equal(serialized.includes('SECRET-FOLDER-ID-123'), false);
  assert.equal(serialized.includes('SECRET-TOKEN-XYZ'), false);
});

// --- 8. platformPolicy safe summary ---
check('platformPolicy: per-platform safe summary projected', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    platformPolicy: {
      blogger: { indexing: 'noindex-nofollow', includeInListings: false },
      pages: { indexing: 'noindex-follow', includeInListings: false },
    },
  });
  assert.equal(v.platformPolicy.present, true);
  assert.equal(v.platformPolicy.isObject, true);
  assert.equal(v.platformPolicy.platforms.length, 2);
  const blogger = v.platformPolicy.platforms.find((p) => p.name === 'blogger');
  assert.equal(blogger.indexing, 'noindex-nofollow');
  assert.equal(blogger.includeInListings, false);
  // valid object platformPolicy → no invalid-type warning
  assert.equal(hasWarning(v, 'page-platform-policy-invalid-type'), false);
});

// --- 9. SP-9a：platformPolicy effective hint (display-only) ---
//   committed binding：本批僅顯示 effective；**永不**改變 robots / listing / sitemap / canonical /
//   feeds / Blogger guidance / live output 行為（SP-9b / SP-9c 才會接，仍 dormant）。
check('SP-9a: recognized platform + explicit override → effective populated, source override', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    platformPolicy: { github: { indexing: 'noindex-follow', includeInListings: false } },
  });
  const g = v.platformPolicy.platforms.find((p) => p.name === 'github');
  assert.equal(g.recognized, true);
  assert.equal(g.secretLike, false);
  assert.equal(g.effectiveIndexing.value, 'noindex-follow');
  assert.equal(g.effectiveIndexing.source, 'override');
  assert.equal(g.effectiveIncludeInListings.value, false);
  assert.equal(g.effectiveIncludeInListings.source, 'override');
});

check('SP-9a: inherit leaf → effective null, source inherit, topLevelFallback exposed', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    seo: { indexing: 'noindex-follow' },
    includeInListings: false,
    platformPolicy: { blogger: { indexing: 'inherit', includeInListings: 'inherit' } },
  });
  const b = v.platformPolicy.platforms.find((p) => p.name === 'blogger');
  assert.equal(b.recognized, true);
  assert.equal(b.effectiveIndexing.value, null);
  assert.equal(b.effectiveIndexing.source, 'inherit');
  // topLevelFallback derived from effective robots (noindex, follow → noindex-follow)
  assert.equal(b.effectiveIndexing.topLevelFallback, 'noindex-follow');
  assert.equal(b.effectiveIncludeInListings.source, 'inherit');
  assert.equal(b.effectiveIncludeInListings.topLevelFallback, false);
});

check('SP-9a: absent leaf → source absent, topLevelFallback still exposed', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    platformPolicy: { future: { canonical: 'inherit', note: 'reserved' } },
  });
  const f = v.platformPolicy.platforms.find((p) => p.name === 'future');
  assert.equal(f.effectiveIndexing.source, 'absent');
  assert.equal(f.effectiveIndexing.topLevelFallback, 'index'); // default 'index, follow' → 'index'
  assert.equal(f.effectiveIncludeInListings.source, 'absent');
  assert.equal(f.effectiveIncludeInListings.topLevelFallback, true); // default listing true
});

check('SP-9a: invalid leaf (non-enum indexing) → source invalid, value null', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    platformPolicy: { github: { indexing: 'sometimes' } },
  });
  const g = v.platformPolicy.platforms.find((p) => p.name === 'github');
  assert.equal(g.effectiveIndexing.value, null);
  assert.equal(g.effectiveIndexing.source, 'invalid');
});

check('SP-9a: unrecognized platform key (wordpress) → recognized false, source unrecognized-platform', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    platformPolicy: { wordpress: { indexing: 'index', includeInListings: true } },
  });
  const w = v.platformPolicy.platforms.find((p) => p.name === 'wordpress');
  assert.equal(w.recognized, false);
  assert.equal(w.effectiveIndexing.source, 'unrecognized-platform');
  // raw 仍顯示原值（policy 未認可，但供作者除錯）
  assert.equal(w.indexing, 'index');
  assert.equal(w.includeInListings, true);
  // effective 不推導
  assert.equal(w.effectiveIndexing.value, null);
  assert.equal(w.effectiveIncludeInListings.value, null);
});

check('SP-9a secret-safety: suspicious platform key (token) → secretLike true, value never echoed', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    platformPolicy: { token: { indexing: 'noindex-follow' } },
  });
  const t = v.platformPolicy.platforms.find((p) => p.name === 'token');
  assert.equal(t.secretLike, true);
  assert.equal(t.recognized, false);
  // raw / effective 一律空 / null（不讀 sub）
  assert.equal(t.indexing, '');
  assert.equal(t.includeInListings, null);
  assert.equal(t.effectiveIndexing.source, 'secret');
  assert.equal(t.effectiveIncludeInListings.source, 'secret');
  // 整個 view JSON 不含 secret leaf 'noindex-follow' from suspicious platform
  //   （注意：頂層 seo 沒有 noindex-follow；本 case 確認 secret platform 之 leaf 不被讀）
  const ser = JSON.stringify(v);
  assert.equal(ser.includes('noindex-follow'), false);
});

check('SP-9a: pageType-driven robots fallback (utility_hidden) propagates to inherit hint', () => {
  const v = derivePageMetadataView({
    contentKind: 'post',
    pageType: 'utility_hidden',
    platformPolicy: { github: { indexing: 'inherit' } },
  });
  const g = v.platformPolicy.platforms.find((p) => p.name === 'github');
  assert.equal(g.effectiveIndexing.source, 'inherit');
  // utility_hidden → 'noindex, nofollow' → 'noindex-nofollow'
  assert.equal(g.effectiveIndexing.topLevelFallback, 'noindex-nofollow');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
