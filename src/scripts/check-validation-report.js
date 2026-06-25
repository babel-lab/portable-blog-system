// Phase 20260616-admin-validation-reporter-smoke-guard-a：
//   validation report smoke regression guard。
//
// 目的：鎖住 report-validation.js 之 read-only reporter 行為，使
//   `.cache/data/validation-report.json` 之 schema / totals / per-entry shape
//   不會被後續改壞。兩層：
//     A. synthetic-input 純函式 locks（buildReport / classifyRuleClass / classifyKind）——
//        不讀檔、不依賴 content / settings；鎖 §C schema 形狀 + §C.4 class 對映 +
//        §C.3 bucket / §D.2 cross-post 分流邏輯。
//     B. real-report assertions——讀已生成之 `.cache/data/validation-report.json`，
//        驗 envelope 形狀 + totals 與 validate:content baseline 一致（0/133/105）+ per-entry shape。
//
// 約束（mirror src/scripts/check-admin-governance-aggregation.js 慣例）：
//   - zero new dependency（僅 node:assert / node:fs / node:path / node:url）
//   - 不重跑 validator、不改 reporter schema、不接 admin loader / UI
//   - real report 為 git-ignored generated cache（先 `npm run report:validation` 產生）；
//     缺檔時本 guard FAIL 並提示，不自行 build / 不假裝 0（mirror check-blogger-adsense-output.js）
//
// 執行：node src/scripts/check-validation-report.js
//   或  npm run check:validation-report
//   - exit 0 = 全 pass
//   - exit 1 = 任一 case fail（列出 FAIL 後 process.exit(1)）

import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildReport, classifyRuleClass, classifyKind, BY_CLASS_KEYS } from './report-validation.js';
// F8 / slice 10：corpus cross-post bidirectional locks 需直接餵 validateContent（全 posts）。
import { validateContent } from './validate-content.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const REPORT_PATH = path.join(PROJECT_ROOT, '.cache', 'data', 'validation-report.json');

// validate:content documented baseline (CLAUDE.md「當前 baseline」). This guard intentionally
// pins these so a future drift forces a conscious baseline update rather than silently passing.
// 20260624 Slice 1 (download-in-listings-default)：rule landing 顯式 +21 warning / +3 issue-post
//   per docs/20260624-download-listing-special-page-preflight-spec-lock.md §2.D Slice 1
//   pre-Slice-1: { errorCount: 0, warningCount: 112, issuePostCount: 102 }
const BASELINE = { errorCount: 0, warningCount: 134, issuePostCount: 106 };

const ASOF = '2026-01-01T00:00:00.000Z';

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

function issue(overrides = {}) {
  return { severity: 'warning', type: 'unknown-tag', sourcePath: 'content/github/posts/a.md', ...overrides };
}
function result(issues) {
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity !== 'error').length;
  return { issues, errorCount, warningCount };
}

// ─── A. synthetic-input pure-logic locks ──────────────────────────────────

// A1. class 對映（§C.4）——含 blogger 先於 frontmatter 之 ordering（invalid-publish-target-mode）
check('A1 classifyRuleClass maps every documented prefix', () => {
  assert.equal(classifyRuleClass('unknown-tag'), 'taxonomy');
  assert.equal(classifyRuleClass('unknown-category'), 'taxonomy');
  assert.equal(classifyRuleClass('category-site-mismatch'), 'taxonomy');
  assert.equal(classifyRuleClass('tag-site-mismatch'), 'taxonomy');
  assert.equal(classifyRuleClass('commerce-ref-not-found'), 'commerce');
  assert.equal(classifyRuleClass('commerce-link-missing-target-url'), 'commerce');
  assert.equal(classifyRuleClass('affiliate-block-missing-id'), 'commerce');
  assert.equal(classifyRuleClass('affiliate-blocks-not-array'), 'commerce');
  assert.equal(classifyRuleClass('adsense-block-invalid-position'), 'adsense');
  assert.equal(classifyRuleClass('ads-missing-client'), 'adsense');
  assert.equal(classifyRuleClass('promotion-fb-missing'), 'blogger');
  assert.equal(classifyRuleClass('fb-md-invalid'), 'blogger');
  assert.equal(classifyRuleClass('fb-post-url-missing'), 'blogger');
  assert.equal(classifyRuleClass('sidecar-frontmatter-overlap'), 'blogger');
  // critical ordering: blogger checked before frontmatter so invalid-* is not swallowed
  assert.equal(classifyRuleClass('invalid-publish-target-mode'), 'blogger');
  assert.equal(classifyRuleClass('missing-title'), 'frontmatter');
  assert.equal(classifyRuleClass('invalid-status'), 'frontmatter');
  assert.equal(classifyRuleClass('duplicate-slug'), 'frontmatter');
  assert.equal(classifyRuleClass('series-number-duplicate'), 'frontmatter');
  assert.equal(classifyRuleClass('book-volume-invalid-type'), 'frontmatter');
  // unmapped → unknown bucket (future-proof)
  assert.equal(classifyRuleClass('totally-new-rule-xyz'), 'unknown');
});

// A2. kind 對映（§C.2）by sourcePath
check('A2 classifyKind by sourcePath', () => {
  assert.equal(classifyKind('content/github/posts/a.md'), 'post');
  assert.equal(classifyKind('content/blogger/posts/b.md'), 'post');
  assert.equal(classifyKind('content/validation-fixtures/blogger/posts/_test-x.md'), 'fixture');
  assert.equal(classifyKind('content/settings/commerce-links.json'), 'settings');
});

// A3. empty result → envelope shape + zero totals + empty buckets
check('A3 empty result → well-formed empty envelope', () => {
  const r = buildReport(result([]), { asOf: ASOF });
  assert.equal(r.schemaVersion, 1);
  assert.equal(r.generator, 'report-validation');
  assert.equal(r.asOf, ASOF);
  assert.deepEqual(r.inputs, { sites: ['github', 'blogger'], includesFixtures: true, registryOverlay: null });
  assert.deepEqual(r.totals, { errorCount: 0, warningCount: 0, issuePostCount: 0 });
  assert.deepEqual(r.bySourcePath, []);
  assert.deepEqual(r.buckets, { settings: [], fixtures: [], crossPost: [] });
});

// A4. single post warning → entry shape, byClass, normalizedKey, optional value
check('A4 single post warning entry shape', () => {
  const r = buildReport(result([issue({ type: 'unknown-tag', value: 'download' })]), { asOf: ASOF });
  assert.equal(r.totals.issuePostCount, 1);
  assert.equal(r.bySourcePath.length, 1);
  const e = r.bySourcePath[0];
  assert.equal(e.sourcePath, 'content/github/posts/a.md');
  assert.equal(e.normalizedKey, e.sourcePath);
  assert.equal(e.kind, 'post');
  assert.equal(e.errorCount, 0);
  assert.equal(e.warningCount, 1);
  // byClass always carries all 9 keys
  assert.deepEqual(Object.keys(e.byClass).sort(), [...BY_CLASS_KEYS].sort());
  assert.equal(e.byClass.taxonomy, 1);
  assert.equal(Array.isArray(e.issues), true);
  assert.deepEqual(e.issues[0], { severity: 'warning', type: 'unknown-tag', class: 'taxonomy', value: 'download' });
});

// A5. value / site optional fields: absent → key omitted (no `value:undefined`)
check('A5 absent value/site keys are omitted', () => {
  const r = buildReport(result([issue({ type: 'missing-title' })]), { asOf: ASOF });
  const it = r.bySourcePath[0].issues[0];
  assert.equal('value' in it, false);
  assert.equal('site' in it, false);
  const r2 = buildReport(result([issue({ type: 'tag-site-mismatch', value: 'x', site: 'github' })]), { asOf: ASOF });
  const it2 = r2.bySourcePath[0].issues[0];
  assert.equal(it2.value, 'x');
  assert.equal(it2.site, 'github');
});

// A6. byClass sum == issues length per entry; multi-issue same sourcePath → 1 entry
check('A6 byClass sum equals issues length per entry', () => {
  const r = buildReport(
    result([
      issue({ type: 'unknown-tag' }),
      issue({ type: 'missing-title' }),
      issue({ type: 'commerce-ref-not-found' }),
    ]),
    { asOf: ASOF },
  );
  assert.equal(r.bySourcePath.length, 1); // same sourcePath
  const e = r.bySourcePath[0];
  const byClassSum = BY_CLASS_KEYS.reduce((a, k) => a + e.byClass[k], 0);
  assert.equal(byClassSum, e.issues.length);
  assert.equal(e.issues.length, 3);
  assert.equal(e.byClass.taxonomy, 1);
  assert.equal(e.byClass.frontmatter, 1);
  assert.equal(e.byClass.commerce, 1);
});

// A7. totals pass-through (errorCount/warningCount from result) + computed issuePostCount
check('A7 totals pass-through + issuePostCount computed', () => {
  const issues = [
    issue({ type: 'missing-title', severity: 'error', sourcePath: 'content/github/posts/a.md' }),
    issue({ type: 'unknown-tag', sourcePath: 'content/blogger/posts/b.md' }),
  ];
  const r = buildReport(result(issues), { asOf: ASOF });
  assert.equal(r.totals.errorCount, 1);
  assert.equal(r.totals.warningCount, 1);
  assert.equal(r.totals.issuePostCount, 2); // 2 distinct sourcePaths
  // error severity counted into entry errorCount, not warningCount
  const errEntry = r.bySourcePath.find((e) => e.sourcePath === 'content/github/posts/a.md');
  assert.equal(errEntry.errorCount, 1);
  assert.equal(errEntry.warningCount, 0);
});

// A8. buckets settings/fixtures by kind; crossPost holds cross-post types AND they remain in bySourcePath
check('A8 buckets + cross-post split', () => {
  const r = buildReport(
    result([
      issue({ type: 'commerce-link-missing-target-url', sourcePath: 'content/settings/commerce-links.json' }),
      issue({ type: 'book-volume-invalid-type', sourcePath: 'content/validation-fixtures/blogger/posts/_t.md' }),
      issue({ type: 'duplicate-slug', sourcePath: 'content/github/posts/dup.md' }),
      issue({ type: 'series-number-duplicate', sourcePath: 'content/github/posts/ser.md' }),
      issue({ type: 'unknown-tag', sourcePath: 'content/github/posts/plain.md' }),
    ]),
    { asOf: ASOF },
  );
  assert.equal(r.buckets.settings.length, 1);
  assert.equal(r.buckets.settings[0].kind, 'settings');
  assert.equal(r.buckets.fixtures.length, 1);
  assert.equal(r.buckets.fixtures[0].kind, 'fixture');
  // crossPost: only duplicate-slug + series-number-duplicate
  assert.deepEqual(r.buckets.crossPost.map((c) => c.type).sort(), ['duplicate-slug', 'series-number-duplicate']);
  assert.equal(r.buckets.crossPost.every((c) => typeof c.sourcePath === 'string'), true);
  // they ALSO remain as per-sourcePath entries
  assert.ok(r.bySourcePath.find((e) => e.sourcePath === 'content/github/posts/dup.md'));
  assert.ok(r.bySourcePath.find((e) => e.sourcePath === 'content/github/posts/ser.md'));
  // plain unknown-tag is NOT in crossPost
  assert.equal(r.buckets.crossPost.find((c) => c.type === 'unknown-tag'), undefined);
});

// A8b. F8 downloadFunnel bidirectional cross-post codes → frontmatter class + crossPost bucket
check('A8b downloadFunnel bidirectional codes classify + bucket', () => {
  assert.equal(classifyRuleClass('downloadFunnel-entry-page-not-listed-by-gated-page'), 'frontmatter');
  assert.equal(classifyRuleClass('downloadFunnel-gated-page-not-targeted-by-entry'), 'frontmatter');
  const r = buildReport(
    result([
      issue({ type: 'downloadFunnel-entry-page-not-listed-by-gated-page', sourcePath: 'content/github/posts/e.md' }),
      issue({ type: 'downloadFunnel-gated-page-not-targeted-by-entry', sourcePath: 'content/github/posts/g.md' }),
    ]),
    { asOf: ASOF },
  );
  assert.deepEqual(r.buckets.crossPost.map((c) => c.type).sort(), [
    'downloadFunnel-entry-page-not-listed-by-gated-page',
    'downloadFunnel-gated-page-not-targeted-by-entry',
  ]);
});

// A9. determinism + no input mutation
check('A9 deterministic + does not mutate input', () => {
  const issues = [issue({ type: 'unknown-tag', value: 'x' }), issue({ type: 'missing-title', sourcePath: 'content/github/posts/b.md' })];
  const res = result(issues);
  const snapshot = JSON.stringify(res);
  const a = buildReport(res, { asOf: ASOF });
  const b = buildReport(res, { asOf: ASOF });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(res), snapshot, 'buildReport must not mutate input');
});

// ─── B. real generated report assertions ──────────────────────────────────

check('B0 generated report exists', () => {
  assert.ok(
    existsSync(REPORT_PATH),
    `missing ${path.relative(PROJECT_ROOT, REPORT_PATH).split(path.sep).join('/')} — run \`npm run report:validation\` first`,
  );
});

if (existsSync(REPORT_PATH)) {
  const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));

  check('B1 envelope basic shape', () => {
    assert.equal(report.schemaVersion, 1);
    assert.equal(report.generator, 'report-validation');
    assert.equal(typeof report.asOf, 'string');
    assert.ok(report.asOf.endsWith('Z'), 'asOf is ISO-8601 Z');
    assert.ok(report.inputs && typeof report.inputs === 'object');
    assert.deepEqual(report.inputs.sites, ['github', 'blogger']);
    assert.equal(report.inputs.includesFixtures, true);
    assert.equal(report.inputs.registryOverlay, null);
    assert.ok(report.totals && typeof report.totals === 'object');
    assert.ok(Array.isArray(report.bySourcePath));
    assert.ok(report.buckets && Array.isArray(report.buckets.settings) && Array.isArray(report.buckets.fixtures) && Array.isArray(report.buckets.crossPost));
  });

  check('B2 totals match validate:content baseline (0/134/106)', () => {
    assert.equal(report.totals.errorCount, BASELINE.errorCount, 'errorCount');
    assert.equal(report.totals.warningCount, BASELINE.warningCount, 'warningCount');
    assert.equal(report.totals.issuePostCount, BASELINE.issuePostCount, 'issuePostCount');
    assert.equal(report.bySourcePath.length, BASELINE.issuePostCount, 'bySourcePath length == issuePostCount');
  });

  check('B3 every entry well-formed; byClass sum == issues length', () => {
    let sumW = 0;
    let sumE = 0;
    let unknownTotal = 0;
    for (const e of report.bySourcePath) {
      assert.equal(typeof e.sourcePath, 'string', 'sourcePath string');
      assert.ok(e.sourcePath.length > 0, 'sourcePath non-empty');
      assert.equal(typeof e.normalizedKey, 'string', 'normalizedKey string');
      assert.equal(e.normalizedKey, e.sourcePath, 'normalizedKey == sourcePath (repo-relative posix)');
      // repo-relative posix: no drive letter, not absolute, no backslash
      assert.ok(!e.sourcePath.includes('\\'), `no backslash in ${e.sourcePath}`);
      assert.ok(!/^[A-Za-z]:/.test(e.sourcePath), `no drive letter in ${e.sourcePath}`);
      assert.ok(!e.sourcePath.startsWith('/'), `not absolute: ${e.sourcePath}`);
      assert.ok(['post', 'fixture', 'settings'].includes(e.kind), `kind enum (${e.kind})`);
      assert.equal(typeof e.errorCount, 'number', 'errorCount number');
      assert.equal(typeof e.warningCount, 'number', 'warningCount number');
      assert.ok(Array.isArray(e.issues), 'issues array');
      assert.ok(e.byClass && typeof e.byClass === 'object', 'byClass object');
      for (const k of BY_CLASS_KEYS) assert.equal(typeof e.byClass[k], 'number', `byClass.${k} number`);
      const byClassSum = BY_CLASS_KEYS.reduce((a, k) => a + e.byClass[k], 0);
      assert.equal(byClassSum, e.issues.length, `byClass sum == issues length for ${e.sourcePath}`);
      for (const it of e.issues) {
        assert.ok(BY_CLASS_KEYS.includes(it.class), `issue.class valid (${it.class})`);
        assert.equal(typeof it.type, 'string', 'issue.type string');
      }
      sumW += e.warningCount;
      sumE += e.errorCount;
      unknownTotal += e.byClass.unknown;
    }
    // Σ per-entry counts == totals
    assert.equal(sumW, BASELINE.warningCount, `Σ warningCount == ${BASELINE.warningCount}`);
    assert.equal(sumE, BASELINE.errorCount, `Σ errorCount == ${BASELINE.errorCount}`);
    // class mapping fully covers current rule-types → no leakage into unknown
    assert.equal(unknownTotal, 0, 'no issues fall into unknown class (mapping complete)');
  });

  check('B4 buckets consistent with entries', () => {
    assert.equal(report.buckets.settings.length, report.bySourcePath.filter((e) => e.kind === 'settings').length);
    assert.equal(report.buckets.fixtures.length, report.bySourcePath.filter((e) => e.kind === 'fixture').length);
    for (const c of report.buckets.crossPost) {
      assert.ok(
        [
          'duplicate-slug',
          'series-number-duplicate',
          'downloadFunnel-entry-page-not-listed-by-gated-page',
          'downloadFunnel-gated-page-not-targeted-by-entry',
        ].includes(c.type),
        `crossPost type (${c.type})`,
      );
      assert.equal(typeof c.sourcePath, 'string', 'crossPost sourcePath string');
    }
  });

  // B5（F-fixture / slice 11）：valid downloadFunnel `.md` fixtures 端對端產生 0 issue
  //   → 不出現在 bySourcePath；證明 valid entry + valid gated_page reciprocating pair 不誤報，
  //   且 production / fixture baseline 維持 0/133/105（valid fixture 貢獻 0 warning）。
  check('B5 valid downloadFunnel .md fixtures produce 0 issues (absent from report)', () => {
    for (const p of [
      'content/validation-fixtures/github/posts/_test-download-funnel-valid-entry.md',
      'content/validation-fixtures/github/posts/_test-download-funnel-valid-gated-page.md',
    ]) {
      assert.equal(
        report.bySourcePath.find((e) => e.sourcePath === p),
        undefined,
        `${p} should produce 0 issues (valid fixture)`,
      );
    }
  });

  // B6（F-fixture group 2 / slice 12）：deferred-case `.md` fixtures（dangling / absolute-URL ref）
  //   端對端產生 0 issue → 鎖住「dangling / absolute URL deferred → silent」；0-warning → 不 bump baseline。
  check('B6 deferred-case downloadFunnel .md fixtures produce 0 issues (absent from report)', () => {
    for (const p of [
      'content/validation-fixtures/github/posts/_test-download-funnel-dangling-target.md',
      'content/validation-fixtures/github/posts/_test-download-funnel-absolute-url-target.md',
    ]) {
      assert.equal(
        report.bySourcePath.find((e) => e.sourcePath === p),
        undefined,
        `${p} should produce 0 issues (deferred-case fixture)`,
      );
    }
  });

  // B7（F-fixture group 3 / scanned invalid bump）：scanned invalid `.md` fixture（role=entry 缺 targetGatedPage）
  //   端對端產生 exactly 1 warning（required-combo），證明 scanned invalid baseline bump 鎖定；
  //   此 fixture 即 0/133/105 → 0/134/106 bump 之唯一來源。
  check('B7 scanned invalid downloadFunnel .md fixture produces exactly 1 required-combo warning', () => {
    const p = 'content/validation-fixtures/github/posts/_test-download-funnel-invalid-entry.md';
    const entry = report.bySourcePath.find((e) => e.sourcePath === p);
    assert.ok(entry, `${p} should appear in report (scanned invalid fixture)`);
    assert.equal(entry.kind, 'fixture', 'kind=fixture');
    assert.equal(entry.errorCount, 0, 'errorCount 0 (warning-only)');
    assert.equal(entry.warningCount, 1, 'exactly 1 warning');
    assert.deepEqual(
      entry.issues.map((i) => i.type),
      ['downloadFunnel-entry-missing-target-gated-page'],
      'exactly the required-combo missing-target code',
    );
  });
}

// ─── C. corpus cross-post: downloadFunnel bidirectional (F8 / slice 10) ────
//   直接餵 validateContent（全 posts）；只斷言 BIDIR 兩 type；sample 全 placeholder slug。
//   per docs/20260625-funnel-metadata-schema-validator-slice9-bidirectional-preflight.md §3
const BIDIR_TYPES = new Set([
  'downloadFunnel-entry-page-not-listed-by-gated-page',
  'downloadFunnel-gated-page-not-targeted-by-entry',
]);
function corpusPost(slug, downloadFunnel) {
  return {
    sourcePath: `content/github/posts/${slug}.md`,
    status: 'ready',
    title: slug,
    slug,
    date: '2026-06-25',
    contentKind: 'post',
    description: 'fixture',
    cover: '/images/placeholders/cover.png',
    tags: [],
    downloadFunnel,
  };
}
function bidir(posts) {
  const r = validateContent({ posts, settings: { categories: [], tags: [] } });
  for (const i of r.issues) {
    if (BIDIR_TYPES.has(i.type)) {
      assert.equal(i.severity, 'warning', `${i.type} must be warning`);
      assert.ok(
        typeof i.value !== 'string' || !i.value.includes('://'),
        `${i.type} must not echo URL-like value`,
      );
    }
  }
  return r.issues
    .filter((i) => BIDIR_TYPES.has(i.type))
    .map((i) => `${i.type}@${i.sourcePath}`)
    .sort();
}

check('C1 entry→gated, gated does not list entry → entry-page-not-listed', () => {
  assert.deepEqual(
    bidir([
      corpusPost('entry-e', { role: 'entry', targetGatedPage: 'gated-x' }),
      corpusPost('gated-x', { role: 'gated_page', entryPages: ['other'] }),
    ]),
    ['downloadFunnel-entry-page-not-listed-by-gated-page@content/github/posts/entry-e.md'],
  );
});

check('C2 gated lists entry, entry does not point back → gated-page-not-targeted', () => {
  assert.deepEqual(
    bidir([
      corpusPost('gated-x', { role: 'gated_page', entryPages: ['entry-e'] }),
      corpusPost('entry-e', { role: 'entry', targetGatedPage: 'other-gated' }),
    ]),
    ['downloadFunnel-gated-page-not-targeted-by-entry@content/github/posts/gated-x.md'],
  );
});

check('C3 bidirectional consistent → no bidir warning', () => {
  assert.deepEqual(
    bidir([
      corpusPost('entry-e', { role: 'entry', targetGatedPage: 'gated-x' }),
      corpusPost('gated-x', { role: 'gated_page', entryPages: ['entry-e'] }),
    ]),
    [],
  );
});

check('C4 multiple entries → same gated, all listed back → no bidir warning', () => {
  assert.deepEqual(
    bidir([
      corpusPost('entry-1', { role: 'entry', targetGatedPage: 'gated-x' }),
      corpusPost('entry-2', { role: 'entry', targetGatedPage: 'gated-x' }),
      corpusPost('gated-x', { role: 'gated_page', entryPages: ['entry-1', 'entry-2'] }),
    ]),
    [],
  );
});

check('C5 dangling reference (target post missing) → deferred, no bidir warning', () => {
  assert.deepEqual(
    bidir([corpusPost('entry-e', { role: 'entry', targetGatedPage: 'nonexistent-gated' })]),
    [],
  );
});

check('C6 absolute URL ref → deferred, no bidir warning', () => {
  assert.deepEqual(
    bidir([
      corpusPost('entry-e', { role: 'entry', targetGatedPage: 'https://example.com/gated-x' }),
      corpusPost('gated-x', { role: 'gated_page', entryPages: ['entry-e'] }),
    ]),
    [],
  );
});

check('C7 private-looking ref (F7) → skipped by cross-file, no duplicate bidir warning', () => {
  assert.deepEqual(
    bidir([
      corpusPost('entry-e', { role: 'entry', targetGatedPage: 'https://drive.example.com/drive/folders/FAKE' }),
      corpusPost('gated-x', { role: 'gated_page', entryPages: ['entry-e'] }),
    ]),
    [],
  );
});

// ─── D. isolated invalid private-value + no-value-echo (F-fixture / slice 11) ──
//   在「獨立 baseline + 明確隔離」之 in-memory harness 驗 invalid private-value，**不**經 global
//   validate:content 掃描（故 production validate:content 維持 0/133/105；scanned invalid .md 會 +1，
//   與本 phase 硬約束衝突，故 invalid case 改以隔離 harness 驗）。sample 全 fake / placeholder。
function funnelTypes(downloadFunnel) {
  const r = validateContent({
    posts: [corpusPost('isolated-funnel-case', downloadFunnel)],
    settings: { categories: [], tags: [] },
  });
  return r.issues.filter((i) => i.type.startsWith('downloadFunnel-'));
}

check('D1 invalid private-value (isolated) → only private-value warning, value not echoed', () => {
  const out = funnelTypes({ role: 'entry', targetGatedPage: 'https://drive.example.com/drive/folders/FAKE' });
  assert.deepEqual(out.map((i) => i.type).sort(), ['downloadFunnel-target-gated-page-private-value']);
  for (const i of out) {
    assert.equal(i.severity, 'warning', 'private-value must be warning');
    assert.ok(!String(i.value).includes('drive.example.com'), 'must not echo the fake host');
    assert.ok(!String(i.value).includes('FAKE'), 'must not echo the fake id');
  }
});

check('D2 valid reciprocating pair (isolated, mirrors .md fixtures) → 0 funnel warning', () => {
  const r = validateContent({
    posts: [
      corpusPost('test-download-funnel-valid-entry', { role: 'entry', targetGatedPage: 'test-download-funnel-valid-gated-page' }),
      { ...corpusPost('test-download-funnel-valid-gated-page', { role: 'gated_page', entryPages: ['test-download-funnel-valid-entry'] }), pageType: 'gated_download', includeInListings: false, includeInSitemap: false, seo: { indexing: 'noindex-follow' } },
    ],
    settings: { categories: [], tags: [] },
  });
  assert.deepEqual(r.issues.filter((i) => i.type.startsWith('downloadFunnel-')).map((i) => i.type), []);
});

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
