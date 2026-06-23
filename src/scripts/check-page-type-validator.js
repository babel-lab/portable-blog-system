// Phase 20260623-pm-sp2-page-type-schema-warning-validator-fixtures-a：
//   special page-type / indexing metadata validator（SP-2）regression smoke harness。
//   per docs/20260623-special-page-types-indexing-metadata-preanalysis.md + SP-2 spec
//
// 目的：鎖住 validatePageTypeMetadata（src/scripts/validate-content.js）之 warning-only 契約：
//   - 全部新欄位 optional；缺省 → 0 SP-2 warning（既有 post 行為不變）
//   - 只在欄位 present 且 problematic 時觸發；missing pageType 不警
//   - 所有 SP-2 issue severity 一律 'warning'（嚴禁 error）
//   - SP-2 純 validation layer：本 harness 不碰 build / render / listing / sitemap
//
// 約束（mirror src/scripts/check-commerce-affiliate-resolver.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - 不改 production posts / registry / build / package
//   - 純 in-memory deterministic locks：用最小 settings + 單篇 post 餵 validateContent，
//     再 filter 出 type 前綴為 'page-' 之 issue 斷言（與其他規則 warning 解耦）
//
// 執行：node src/scripts/check-page-type-validator.js
//   - exit 0 = 全 pass
//   - exit 1 = 任一 case fail（列出 FAIL 後 process.exit(1)）

import { strict as assert } from 'node:assert';
import { validateContent } from './validate-content.js';

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

// 最小 settings：空 registries → 不觸發 category/tag/commerce/download/ads 等其他規則之 registry 依賴
const SETTINGS = { categories: [], tags: [] };

// base：status ready + 必填欄位齊全（避免 missing-* 噪音）；caller 以 overrides 疊加新欄位
function makePost(overrides) {
  return {
    sourcePath: 'in-memory/_test.md',
    status: 'ready',
    title: 'fixture',
    slug: 'fixture',
    date: '2026-06-23',
    contentKind: 'post',
    description: 'fixture description',
    cover: '/images/placeholders/cover.png',
    tags: [],
    ...overrides,
  };
}

// 回傳該 post 觸發之 SP-2 issue（type 前綴 'page-'）
function pageIssues(overrides) {
  const result = validateContent({ posts: [makePost(overrides)], settings: SETTINGS });
  // 不變式：validateContent 永不為 SP-2 規則回 error
  for (const i of result.issues) {
    if (i.type.startsWith('page-')) {
      assert.equal(i.severity, 'warning', `SP-2 issue ${i.type} must be severity 'warning', got '${i.severity}'`);
    }
  }
  return result.issues.filter((i) => i.type.startsWith('page-'));
}

function types(issues) {
  return issues.map((i) => i.type).sort();
}

// ─── valid / absent cases：0 SP-2 warning ────────────────────────────────

check('1 absent (no SP-2 fields) → 0 SP-2 warning', () => {
  assert.deepEqual(types(pageIssues({})), []);
});

check('2 valid gated_download (noindex + listings/sitemap false) → 0 SP-2 warning', () => {
  const out = pageIssues({
    pageType: 'gated_download',
    includeInListings: false,
    includeInSitemap: false,
    includeInFeeds: false,
    gatedDownload: { mechanism: 'google-form', formEmbedUrl: 'https://example.com/f', postSubmitResource: 'drive-link' },
    platformPolicy: { blogger: { indexing: 'noindex-nofollow', includeInListings: false } },
    seo: { indexing: 'noindex-follow' },
  });
  assert.deepEqual(types(out), []);
});

check('3 all 8 valid pageType values → 0 page-type-invalid', () => {
  for (const v of ['article', 'static_page', 'download', 'gated_download', 'landing', 'utility_hidden', 'redirect_canonical', 'platform_special']) {
    const out = pageIssues(v === 'redirect_canonical'
      ? { pageType: v, canonical: 'https://example.com/x' }   // redirect_canonical 需 explicit canonical
      : { pageType: v });
    assert.ok(!types(out).includes('page-type-invalid'), `pageType="${v}" should be valid`);
  }
});

check('4 valid redirect_canonical (explicit canonical) → no missing-target warning', () => {
  const out = pageIssues({ pageType: 'redirect_canonical', canonical: 'https://example.com/x' });
  assert.ok(!types(out).includes('page-redirect-canonical-missing-target'));
});

check('5 article + includeInListings true (boolean) → 0 SP-2 warning', () => {
  assert.deepEqual(types(pageIssues({ pageType: 'article', includeInListings: true })), []);
});

// ─── invalid cases：each rule fires exactly its own warning ──────────────

check('6 unknown pageType → page-type-invalid', () => {
  assert.deepEqual(types(pageIssues({ pageType: 'blog_post' })), ['page-type-invalid']);
});

check('7 non-string pageType (number) → page-type-invalid', () => {
  assert.deepEqual(types(pageIssues({ pageType: 5 })), ['page-type-invalid']);
});

check('8 includeInListings string → page-include-flag-invalid-type', () => {
  assert.deepEqual(types(pageIssues({ includeInListings: 'yes' })), ['page-include-flag-invalid-type']);
});

check('9 all three include flags wrong type → 3 page-include-flag-invalid-type', () => {
  const out = pageIssues({ includeInListings: 'x', includeInSitemap: 1, includeInFeeds: [] });
  assert.equal(out.length, 3);
  assert.ok(out.every((i) => i.type === 'page-include-flag-invalid-type'));
});

check('10 platformPolicy string → page-platform-policy-invalid-type', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: 'blogger' })), ['page-platform-policy-invalid-type']);
});

check('11 gatedDownload string → page-gated-download-invalid-type (no suspicious scan)', () => {
  assert.deepEqual(types(pageIssues({ gatedDownload: 'google-form' })), ['page-gated-download-invalid-type']);
});

check('12 gated_download + index → page-gated-download-indexed', () => {
  assert.deepEqual(types(pageIssues({ pageType: 'gated_download', seo: { indexing: 'index' } })), ['page-gated-download-indexed']);
});

check('13 gated_download + includeInListings true → page-gated-download-in-listings', () => {
  assert.deepEqual(types(pageIssues({ pageType: 'gated_download', includeInListings: true })), ['page-gated-download-in-listings']);
});

check('14 noindex-follow + includeInSitemap true → page-noindex-in-sitemap', () => {
  assert.deepEqual(types(pageIssues({ includeInSitemap: true, seo: { indexing: 'noindex-follow' } })), ['page-noindex-in-sitemap']);
});

check('15 noindex-nofollow + includeInListings true → page-noindex-in-listings', () => {
  assert.deepEqual(types(pageIssues({ includeInListings: true, seo: { indexing: 'noindex-nofollow' } })), ['page-noindex-in-listings']);
});

check('16 index + includeInListings true → no noindex orthogonal warning', () => {
  const out = pageIssues({ includeInListings: true, seo: { indexing: 'index' } });
  assert.ok(!types(out).includes('page-noindex-in-listings'));
  assert.ok(!types(out).includes('page-noindex-in-sitemap'));
});

check('17 gatedDownload with driveFolderId → page-gated-download-suspicious-field (value not echoed)', () => {
  const out = pageIssues({ gatedDownload: { mechanism: 'google-form', driveFolderId: 'SECRET-ID-VALUE' } });
  assert.deepEqual(types(out), ['page-gated-download-suspicious-field']);
  assert.ok(!out[0].value.includes('SECRET-ID-VALUE'), 'must not echo the disallowed value');
  assert.ok(out[0].value.includes('driveFolderId'), 'should name the field');
});

check('18 gatedDownload with only allowed keys → no suspicious-field warning', () => {
  const out = pageIssues({ gatedDownload: { mechanism: 'google-form', formEmbedUrl: 'https://example.com/f', postSubmitResource: 'drive-link' } });
  assert.ok(!types(out).includes('page-gated-download-suspicious-field'));
});

check('19 redirect_canonical + canonical "auto" → page-redirect-canonical-missing-target', () => {
  assert.deepEqual(types(pageIssues({ pageType: 'redirect_canonical', canonical: 'auto' })), ['page-redirect-canonical-missing-target']);
});

check('20 redirect_canonical + canonical missing → page-redirect-canonical-missing-target', () => {
  assert.deepEqual(types(pageIssues({ pageType: 'redirect_canonical' })), ['page-redirect-canonical-missing-target']);
});

// ─── summary ─────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
