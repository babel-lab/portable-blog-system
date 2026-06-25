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

// Slice 1（20260624）：rule name 用 'download-' 前綴（per spec lock §2.D Slice 1）；
//   harness 將其與 'page-' 前綴一同視為 SP-2 系列輸出，以保持單一 issue 池與相同 severity 不變式。
const SP_EXTRA_RULE_TYPES = new Set(['download-in-listings-default']);
function isSpRuleType(t) {
  return (
    typeof t === 'string' &&
    (t.startsWith('page-') || t.startsWith('downloadFunnel-') || SP_EXTRA_RULE_TYPES.has(t))
  );
}

// 回傳該 post 觸發之 SP-2 / Slice-1 issue（type 前綴 'page-' 或屬 SP_EXTRA_RULE_TYPES）
function pageIssues(overrides) {
  const result = validateContent({ posts: [makePost(overrides)], settings: SETTINGS });
  // 不變式：validateContent 永不為 SP-2 / Slice-1 規則回 error
  for (const i of result.issues) {
    if (isSpRuleType(i.type)) {
      assert.equal(i.severity, 'warning', `SP rule ${i.type} must be severity 'warning', got '${i.severity}'`);
    }
  }
  return result.issues.filter((i) => isSpRuleType(i.type));
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
  // includeInListings: false 顯式宣告以隔離 Slice-1 default-case warning（test 38–45 已專責覆蓋）
  assert.deepEqual(
    types(pageIssues({ pageType: 'gated_download', includeInListings: false, seo: { indexing: 'index' } })),
    ['page-gated-download-indexed']
  );
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

// ─── SP-8：platformPolicy 巢狀 shallow shape sub-rules（warning-only；additive）─────────
//   per docs/20260623-pm-sp8-platform-policy-shape-validator.md
//   - 只在 platformPolicy 為 plain object 時評估；missing / 非 object → 走 SP-2 rule 3（不變）
//   - 全部 severity 'warning'（pageIssues helper 已對所有 page-* issue 斷言 warning）

check('21 platformPolicy minimal valid object → 0 SP-2/SP-8 warning', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { github: { indexing: 'inherit' } } })), []);
});

check('22 platformPolicy full valid (github/blogger/future, all fields) → 0 warning', () => {
  const out = pageIssues({
    platformPolicy: {
      github: { indexing: 'index', includeInListings: true, includeInSitemap: false, includeInFeeds: 'inherit', canonical: 'https://example.com/x', note: 'ok' },
      blogger: { indexing: 'noindex-nofollow', includeInListings: false },
      future: { indexing: 'inherit', canonical: 'inherit' },
    },
  });
  assert.deepEqual(types(out), []);
});

check('23 unknown platform key → page-platform-policy-unknown-platform', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { wordpress: { indexing: 'inherit' } } })), ['page-platform-policy-unknown-platform']);
});

check('24 platform entry not object (string) → page-platform-policy-platform-invalid-type only', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { github: 'noindex' } })), ['page-platform-policy-platform-invalid-type']);
});

check('25 unknown nested key → page-platform-policy-unknown-field', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { github: { priority: 'high' } } })), ['page-platform-policy-unknown-field']);
});

check('26 invalid indexing value → page-platform-policy-indexing-invalid', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { github: { indexing: 'sometimes' } } })), ['page-platform-policy-indexing-invalid']);
});

check('27 invalid include flag value (string) → page-platform-policy-flag-invalid', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { blogger: { includeInListings: 'maybe' } } })), ['page-platform-policy-flag-invalid']);
});

check('28 include flag = "inherit" → no flag-invalid warning', () => {
  const out = pageIssues({ platformPolicy: { github: { includeInListings: 'inherit', includeInSitemap: true, includeInFeeds: false } } });
  assert.ok(!types(out).includes('page-platform-policy-flag-invalid'));
  assert.deepEqual(types(out), []);
});

check('29 invalid canonical (number) → page-platform-policy-canonical-invalid', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { github: { canonical: 123 } } })), ['page-platform-policy-canonical-invalid']);
});

check('30 canonical "inherit" and canonical URL string → no canonical-invalid warning', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { github: { canonical: 'inherit' }, blogger: { canonical: 'https://example.com/y' } } })), []);
});

check('31 empty canonical string → page-platform-policy-canonical-invalid', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { github: { canonical: '   ' } } })), ['page-platform-policy-canonical-invalid']);
});

check('32 invalid note type (number) → page-platform-policy-note-invalid', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: { future: { note: 2026 } } })), ['page-platform-policy-note-invalid']);
});

check('33 suspicious top-level platform key (token) → suspicious-field, value not echoed', () => {
  const out = pageIssues({ platformPolicy: { token: 'SECRET-TOP-VALUE' } });
  assert.deepEqual(types(out), ['page-platform-policy-suspicious-field']);
  assert.ok(!out[0].value.includes('SECRET-TOP-VALUE'), 'must not echo the disallowed value');
  assert.ok(out[0].value.includes('token'), 'should name the field');
});

check('34 suspicious nested key (apiKey) → suspicious-field, value not echoed, no type check', () => {
  const out = pageIssues({ platformPolicy: { github: { apiKey: 'SECRET-NESTED-VALUE' } } });
  assert.deepEqual(types(out), ['page-platform-policy-suspicious-field']);
  assert.ok(!out[0].value.includes('SECRET-NESTED-VALUE'), 'must not echo the disallowed value');
  assert.ok(out[0].value.includes('apiKey'), 'should name the field');
});

check('35 nested object beyond shallow platform object → page-platform-policy-nested-object-deferred (not recursed)', () => {
  const out = pageIssues({ platformPolicy: { github: { indexing: { deep: 'x' } } } });
  assert.deepEqual(types(out), ['page-platform-policy-nested-object-deferred']);
});

check('36 platformPolicy non-object (string) → SP-2 rule 3 unchanged, no SP-8 sub-rule', () => {
  assert.deepEqual(types(pageIssues({ platformPolicy: 'blogger' })), ['page-platform-policy-invalid-type']);
});

check('37 unknown platform key with invalid nested value → both warnings (independent)', () => {
  const out = pageIssues({ platformPolicy: { wordpress: { indexing: 'sometimes' } } });
  assert.deepEqual(types(out), ['page-platform-policy-indexing-invalid', 'page-platform-policy-unknown-platform']);
});

// ─── Slice 1：download-in-listings-default（default-case visibility；warning-only）─────────
//   per docs/20260624-download-listing-special-page-preflight-spec-lock.md §2.D Slice 1
//   - 觸發：(contentKind==='download' OR pageType∈{download,gated_download}) AND includeInListings===undefined
//   - 互斥：includeInListings 顯式 true / false / 非法型別 → 本 rule 不觸發（後者由 rule 2 處理）
//   - 與 rule 6 / 8 正交

check('38 contentKind=download + includeInListings absent → download-in-listings-default', () => {
  assert.deepEqual(
    types(pageIssues({ contentKind: 'download' })),
    ['download-in-listings-default']
  );
});

check('39 pageType=download + includeInListings absent → download-in-listings-default', () => {
  assert.deepEqual(
    types(pageIssues({ contentKind: 'post', pageType: 'download' })),
    ['download-in-listings-default']
  );
});

check('40 pageType=gated_download + includeInListings absent → download-in-listings-default', () => {
  assert.deepEqual(
    types(pageIssues({ contentKind: 'post', pageType: 'gated_download' })),
    ['download-in-listings-default']
  );
});

check('41 contentKind=download + includeInListings=false → no Slice-1 warning', () => {
  const out = pageIssues({ contentKind: 'download', includeInListings: false });
  assert.ok(!types(out).includes('download-in-listings-default'));
});

check('42 contentKind=download + includeInListings=true → no Slice-1 warning (rule 8 also silent since no noindex)', () => {
  const out = pageIssues({ contentKind: 'download', includeInListings: true });
  assert.ok(!types(out).includes('download-in-listings-default'));
});

check('43 contentKind=download + pageType=gated_download + absent → exactly 1 Slice-1 warning', () => {
  const out = pageIssues({ contentKind: 'download', pageType: 'gated_download' });
  const slice1 = out.filter((i) => i.type === 'download-in-listings-default');
  assert.equal(slice1.length, 1, 'must fire exactly once even when both triggers match');
  assert.ok(slice1[0].value.includes('contentKind="download"'));
  assert.ok(slice1[0].value.includes('pageType="gated_download"'));
});

check('44 contentKind=post + pageType=article + absent → no Slice-1 warning', () => {
  assert.ok(!types(pageIssues({ contentKind: 'post', pageType: 'article' })).includes('download-in-listings-default'));
});

check('45 contentKind=download + includeInListings invalid type → only invalid-type warning (Slice-1 silent)', () => {
  const out = pageIssues({ contentKind: 'download', includeInListings: 'yes' });
  const t = types(out);
  assert.ok(t.includes('page-include-flag-invalid-type'));
  assert.ok(!t.includes('download-in-listings-default'), 'Slice-1 must not double-fire when type is invalid');
});

// ─── F1 Slice 1：downloadFunnel 結構 / enum / 未知 key（warning-only；additive；純 metadata）─────────
//   per docs/20260625-funnel-metadata-schema-preflight-a.md §3 / §5.1
//   - 缺省 downloadFunnel → 0 warning（既有 post 行為不變）
//   - downloadFunnel 屬純 metadata：不參與 robots / sitemap / listings decision（本 harness 不碰 build）
//   - required-combo（§5.2）/ value-based secret heuristic（§5.3）/ cross-field（§5.4）本 slice 不實作

check('46 downloadFunnel absent → 0 funnel warning', () => {
  assert.ok(!types(pageIssues({})).some((t) => t.startsWith('downloadFunnel-')));
});

check('47 valid entry role (+ targetGatedPage) → 0 funnel warning', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'entry', targetGatedPage: 'gated-zhuyin-download' } })),
    []
  );
});

check('48 valid gated_page role (+ entryPages, noindex) → 0 funnel warning', () => {
  // seo.indexing noindex-follow → robots-safe，隔離 slice-6 robots-safety（test 83/84 專責覆蓋）
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, seo: { indexing: 'noindex-follow' } })),
    []
  );
});

check('49 downloadFunnel non-object (string) → downloadFunnel-invalid-type', () => {
  assert.deepEqual(types(pageIssues({ downloadFunnel: 'entry' })), ['downloadFunnel-invalid-type']);
});

check('50 downloadFunnel object but role missing → downloadFunnel-role-missing', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { targetGatedPage: 'x' } })),
    ['downloadFunnel-role-missing']
  );
});

check('51 role = post_submit (not allowed) → downloadFunnel-role-invalid-enum', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'post_submit' } })),
    ['downloadFunnel-role-invalid-enum']
  );
});

check('52 role non-string (number) → downloadFunnel-role-invalid-enum', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 1 } })),
    ['downloadFunnel-role-invalid-enum']
  );
});

check('53 role case variant ("Entry") → downloadFunnel-role-invalid-enum', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'Entry' } })),
    ['downloadFunnel-role-invalid-enum']
  );
});

check('54 unknown / secret-like key (driveFolderId) → downloadFunnel-suspicious-field, value not echoed', () => {
  // entryPages 提供以隔離 slice-2 gated-page-missing-entry-pages（test 58 已專責覆蓋）
  const out = pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'], driveFolderId: 'SECRET-ID-VALUE' }, seo: { indexing: 'noindex-follow' } });
  assert.deepEqual(types(out), ['downloadFunnel-suspicious-field']);
  assert.ok(!out[0].value.includes('SECRET-ID-VALUE'), 'must not echo the disallowed value');
  assert.ok(out[0].value.includes('driveFolderId'), 'should name the field');
});

check('55 all allowed keys for role=entry (role+targetGatedPage+ctaEventName) → 0 funnel warning', () => {
  // role=entry 之合法欄位組合不含 entryPages（entryPages 屬 gated_page；slice-2 §3.3）
  assert.deepEqual(
    types(pageIssues({
      downloadFunnel: {
        role: 'entry',
        targetGatedPage: 'gated-zhuyin-download',
        ctaEventName: 'click_all_download',
      },
    })),
    []
  );
});

check('56 invalid role + unknown key → both warnings (independent)', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'bogus', token: 'X' } })),
    ['downloadFunnel-role-invalid-enum', 'downloadFunnel-suspicious-field']
  );
});

// ─── F1 §5.2 Slice 2：downloadFunnel required-combo / field-combination（warning-only；不 echo value）─────
//   per docs/20260625-funnel-metadata-schema-preflight-a.md §3.2.2 / §3.2.3 / §3.3 / §5.2
//   - role-combo（missing / wrong-role）只在 role 為合法 enum 時評估；field-shape 獨立評估
//   - 所有 sample 一律 placeholder / fake（無真實 Drive ID / Form URL / response URL / token）
//   - 凡 value 可能像 URL / token / respondent data，warning message 不得 echo（test 67/68 鎖定）

check('57 role=entry without targetGatedPage → entry-missing-target-gated-page', () => {
  assert.deepEqual(types(pageIssues({ downloadFunnel: { role: 'entry' } })), ['downloadFunnel-entry-missing-target-gated-page']);
});

check('58 role=gated_page without entryPages → gated-page-missing-entry-pages', () => {
  assert.deepEqual(types(pageIssues({ downloadFunnel: { role: 'gated_page' }, seo: { indexing: 'noindex-follow' } })), ['downloadFunnel-gated-page-missing-entry-pages']);
});

check('59 role=gated_page with empty entryPages [] → gated-page-missing-entry-pages', () => {
  assert.deepEqual(types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: [] }, seo: { indexing: 'noindex-follow' } })), ['downloadFunnel-gated-page-missing-entry-pages']);
});

check('60 role=gated_page with targetGatedPage → target-gated-page-wrong-role', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'], targetGatedPage: 'gated-zhuyin-download' }, seo: { indexing: 'noindex-follow' } })),
    ['downloadFunnel-target-gated-page-wrong-role']
  );
});

check('61 role=entry with entryPages → entry-pages-wrong-role', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'entry', targetGatedPage: 'gated-zhuyin-download', entryPages: ['zhuyin-intro'] } })),
    ['downloadFunnel-entry-pages-wrong-role']
  );
});

check('62 targetGatedPage non-string (number) → target-gated-page-invalid-type (no missing)', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'entry', targetGatedPage: 123 } })),
    ['downloadFunnel-target-gated-page-invalid-type']
  );
});

check('63 entryPages non-array (string) → entry-pages-invalid-type (no missing)', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: 'zhuyin-intro' }, seo: { indexing: 'noindex-follow' } })),
    ['downloadFunnel-entry-pages-invalid-type']
  );
});

check('64 entryPages array with non-string element → entry-pages-invalid-type', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro', 5] }, seo: { indexing: 'noindex-follow' } })),
    ['downloadFunnel-entry-pages-invalid-type']
  );
});

check('65 entryPages > 10 unique → entry-pages-too-many', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: Array.from({ length: 11 }, (_, i) => `entry-${i}`) }, seo: { indexing: 'noindex-follow' } })),
    ['downloadFunnel-entry-pages-too-many']
  );
});

check('66 entryPages duplicate → entry-pages-duplicate', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro', 'zhuyin-intro'] }, seo: { indexing: 'noindex-follow' } })),
    ['downloadFunnel-entry-pages-duplicate']
  );
});

check('67 entry-pages-duplicate message must NOT echo value (URL-like placeholder)', () => {
  const out = pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['https://example.com/p', 'https://example.com/p'] }, seo: { indexing: 'noindex-follow' } });
  assert.deepEqual(types(out), ['downloadFunnel-entry-pages-duplicate']);
  assert.ok(!out[0].value.includes('example.com'), 'must not echo the (possibly URL/secret) entry value');
});

check('68 target-gated-page-invalid-type message must NOT echo value (array placeholder)', () => {
  const out = pageIssues({ downloadFunnel: { role: 'entry', targetGatedPage: ['https://example.com/x'] } });
  assert.deepEqual(types(out), ['downloadFunnel-target-gated-page-invalid-type']);
  assert.ok(!out[0].value.includes('example.com'), 'must not echo the (possibly URL/secret) value');
});

check('69 invalid role + field-shape error → both warnings (combo role-rules gated off)', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'bogus', targetGatedPage: 123 } })),
    ['downloadFunnel-role-invalid-enum', 'downloadFunnel-target-gated-page-invalid-type']
  );
});

check('70 role=gated_page with exactly 10 unique entryPages → 0 funnel warning (boundary)', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: Array.from({ length: 10 }, (_, i) => `entry-${i}`) }, seo: { indexing: 'noindex-follow' } })),
    []
  );
});

check('71 entryPages too-many AND duplicate → both warnings (independent)', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: [...Array.from({ length: 11 }, (_, i) => `entry-${i}`), 'entry-0'] }, seo: { indexing: 'noindex-follow' } })),
    ['downloadFunnel-entry-pages-duplicate', 'downloadFunnel-entry-pages-too-many']
  );
});

// ─── F1 §5.4 Slice 4：downloadFunnel 單篇 role↔policy 一致性（warning-only；不 echo value）─────────
//   per docs/20260625-funnel-metadata-schema-validator-slice3-preflight.md §3.1
//   - 三規則只在 role='gated_page' 時評估；純 role × includeInSitemap / includeInListings / pageType 比較
//   - 不跨檔案、不推導 effective robots、不改 indexing decision；message 不含任何 value
//   - gated_page 樣本一律帶 entryPages（隔離 slice-2 gated-page-missing-entry-pages）；sample 全 placeholder

check('72 gated_page + includeInSitemap=true → role-conflicts-sitemap-safety', () => {
  // pageType gated_download → robots-safe（隔離 slice-6 robots-safety），includeInListings:false 抑制 Slice-1
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, includeInSitemap: true, pageType: 'gated_download', includeInListings: false })),
    ['downloadFunnel-role-conflicts-sitemap-safety']
  );
});

check('73 gated_page + platformPolicy.github.includeInSitemap=true → role-conflicts-sitemap-safety', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, platformPolicy: { github: { includeInSitemap: true } }, pageType: 'gated_download', includeInListings: false })),
    ['downloadFunnel-role-conflicts-sitemap-safety']
  );
});

check('74 gated_page + includeInListings=true → role-conflicts-listings-default', () => {
  // contentKind download → robots-safe（隔離 slice-6）；includeInListings:true 已抑制 Slice-1，且非 noindex seo 故不觸發 rule 8
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, includeInListings: true, contentKind: 'download' })),
    ['downloadFunnel-role-conflicts-listings-default']
  );
});

check('75 gated_page + pageType=article (noindex) → gated-page-pageType-mismatch', () => {
  // seo noindex-follow → robots-safe（隔離 slice-6）；pageType article 仍觸發 mismatch
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, pageType: 'article', seo: { indexing: 'noindex-follow' } })),
    ['downloadFunnel-gated-page-pageType-mismatch']
  );
});

check('76 gated_page + pageType=download (+ includeInListings:false) → no mismatch', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, pageType: 'download', includeInListings: false })),
    []
  );
});

check('77 gated_page + pageType=gated_download (policy flags false) → no funnel policy warning', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, pageType: 'gated_download', includeInListings: false, includeInSitemap: false })),
    []
  );
});

check('78 gated_page + pageType absent (noindex) → no pageType-mismatch', () => {
  const out = types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, seo: { indexing: 'noindex-follow' } }));
  assert.ok(!out.includes('downloadFunnel-gated-page-pageType-mismatch'));
  assert.deepEqual(out, []);
});

check('79 role=entry + includeInSitemap=true → no sitemap-conflict (rules only apply to gated_page)', () => {
  const out = types(pageIssues({ downloadFunnel: { role: 'entry', targetGatedPage: 'gated-zhuyin-download' }, includeInSitemap: true }));
  assert.ok(!out.includes('downloadFunnel-role-conflicts-sitemap-safety'));
  assert.deepEqual(out, []);
});

check('80 role=entry + includeInListings=true → no listings-conflict', () => {
  const out = types(pageIssues({ downloadFunnel: { role: 'entry', targetGatedPage: 'gated-zhuyin-download' }, includeInListings: true }));
  assert.ok(!out.includes('downloadFunnel-role-conflicts-listings-default'));
  assert.deepEqual(out, []);
});

check('81 sitemap-conflict message must NOT echo entry value (URL-like placeholder)', () => {
  const out = pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['https://example.com/p'] }, includeInSitemap: true, pageType: 'gated_download', includeInListings: false });
  assert.deepEqual(types(out), ['downloadFunnel-role-conflicts-sitemap-safety']);
  assert.ok(!out[0].value.includes('example.com'), 'must not echo any entry value');
});

check('82 gated_page + sitemap+listings+pageType(article, indexable) → four warnings (independent)', () => {
  // 此頁 indexable（pageType article，無 noindex）→ slice-6 robots-safety 亦合理並存（展示四 funnel 規則獨立）
  assert.deepEqual(
    types(pageIssues({
      downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] },
      includeInSitemap: true,
      includeInListings: true,
      pageType: 'article',
    })),
    [
      'downloadFunnel-gated-page-pageType-mismatch',
      'downloadFunnel-role-conflicts-listings-default',
      'downloadFunnel-role-conflicts-robots-safety',
      'downloadFunnel-role-conflicts-sitemap-safety',
    ]
  );
});

// ─── F1 §5.4 Slice 6：downloadFunnel role↔robots safety（warning-only；不 echo value）─────────
//   per docs/20260625-funnel-metadata-schema-validator-slice5-robots-safety-preflight.md §3 / §4
//   - 只在 role='gated_page' 評估；重用 resolvePostDetailRobots → 只在 effective robots 'index, follow' 告警
//   - safe path：seo.indexing noindex / contentKind:download / pageType download·gated_download → 不告警
//   - sample 全 placeholder；message 不 echo value

check('83 gated_page + seo.indexing=index (explicit) → role-conflicts-robots-safety', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, seo: { indexing: 'index' } })),
    ['downloadFunnel-role-conflicts-robots-safety']
  );
});

check('84 gated_page + default indexable (no seo/pageType, contentKind post) → role-conflicts-robots-safety', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] } })),
    ['downloadFunnel-role-conflicts-robots-safety']
  );
});

check('85 gated_page + seo.indexing=noindex-follow → no robots-safety (safe)', () => {
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, seo: { indexing: 'noindex-follow' } })),
    []
  );
});

check('86 gated_page + contentKind=download → no robots-safety (false-positive defense)', () => {
  // effective robots = noindex,follow via legacy contentKind:download → resolvePostDetailRobots safe
  const out = types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, contentKind: 'download', includeInListings: false }));
  assert.ok(!out.includes('downloadFunnel-role-conflicts-robots-safety'));
  assert.deepEqual(out, []);
});

check('87 role=entry + seo.indexing=index → no robots-safety (rule only applies to gated_page)', () => {
  const out = types(pageIssues({ downloadFunnel: { role: 'entry', targetGatedPage: 'gated-zhuyin-download' }, seo: { indexing: 'index' } }));
  assert.ok(!out.includes('downloadFunnel-role-conflicts-robots-safety'));
  assert.deepEqual(out, []);
});

check('88 robots-safety message must NOT echo entry value (URL-like placeholder)', () => {
  const out = pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['https://example.com/p'] }, seo: { indexing: 'index' } });
  assert.deepEqual(types(out), ['downloadFunnel-role-conflicts-robots-safety']);
  assert.ok(!out[0].value.includes('example.com'), 'must not echo any entry value');
});

check('89 gated_page + pageType=gated_download + seo.indexing=index → robots-safety + SP-2 indexed (overlap)', () => {
  // explicit seo.indexing=index 勝過 pageType 推導 → effective robots index,follow → robots-safety；
  // 同時既有 SP-2 rule 5 page-gated-download-indexed 亦觸發（獨立維度；overlap 記錄）
  assert.deepEqual(
    types(pageIssues({ downloadFunnel: { role: 'gated_page', entryPages: ['zhuyin-intro'] }, pageType: 'gated_download', seo: { indexing: 'index' }, includeInListings: false })),
    ['downloadFunnel-role-conflicts-robots-safety', 'page-gated-download-indexed']
  );
});

// ─── summary ─────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
