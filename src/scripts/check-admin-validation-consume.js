// Phase 20260616-admin-validation-report-detail-panel-readonly-consume-implementation-a：
//   admin validation-report consume smoke test。
//
// 目的：鎖住 derivePostValidationReport（src/scripts/load-admin-posts.js）之 read-only
//   join 決策（pm-14 §D.2）——report 缺檔 / status-excluded / matched / clean 四態 +
//   nullable 防呆 + 不 mutate input。確保 admin detail panel consume 不破壞既有資料結構。
//
// 約束（mirror check-admin-governance-aggregation.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - synthetic in-memory input only；不讀檔 / 不讀 content·settings / 不打 API / 不寫檔
//   - 純函式 deterministic；不重跑 validator；不改 reporter schema
//
// 執行：node src/scripts/check-admin-validation-consume.js
//   或  npm run check:admin-validation-consume
//   - exit 0 = 全 pass / exit 1 = 任一 fail

import { strict as assert } from 'node:assert';
import { derivePostValidationReport } from './load-admin-posts.js';

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

const ASOF = '2026-06-16T08:00:00.000Z';
function entry(overrides = {}) {
  return {
    sourcePath: 'content/blogger/posts/x.md',
    normalizedKey: 'content/blogger/posts/x.md',
    kind: 'post',
    errorCount: 0,
    warningCount: 2,
    byClass: { taxonomy: 1, frontmatter: 1 },
    issues: [
      { severity: 'warning', type: 'unknown-tag', class: 'taxonomy', value: 'download' },
      { severity: 'warning', type: 'missing-title', class: 'frontmatter' },
    ],
    ...overrides,
  };
}

// 1. report unavailable → no-report（不論 status / entry）
check('1 report unavailable → no-report', () => {
  assert.deepEqual(derivePostValidationReport({ available: false, asOf: null, entry: null }, 'ready'), {
    reportAvailable: false,
    state: 'no-report',
    asOf: null,
  });
  // even with an entry present, unavailable wins
  assert.equal(derivePostValidationReport({ available: false, entry: entry() }, 'published').state, 'no-report');
});

// 2. null / undefined ctx → no-report（不 crash）
check('2 null / undefined ctx → no-report', () => {
  assert.equal(derivePostValidationReport(null, 'ready').state, 'no-report');
  assert.equal(derivePostValidationReport(undefined, 'draft').state, 'no-report');
});

// 3. available + draft → status-excluded（非 0 warnings）
check('3 draft → status-excluded', () => {
  const out = derivePostValidationReport({ available: true, asOf: ASOF, entry: null }, 'draft');
  assert.equal(out.state, 'status-excluded');
  assert.equal(out.reportAvailable, true);
  assert.equal(out.asOf, ASOF);
  assert.equal(out.status, 'draft');
  assert.equal('warningCount' in out, false, 'status-excluded must NOT report 0 warnings');
});

// 4. available + archived / 空 status → status-excluded
check('4 archived / empty status → status-excluded', () => {
  assert.equal(derivePostValidationReport({ available: true, asOf: ASOF, entry: null }, 'archived').state, 'status-excluded');
  const empty = derivePostValidationReport({ available: true, asOf: ASOF, entry: null }, '');
  assert.equal(empty.state, 'status-excluded');
  assert.equal(empty.status, '');
});

// 5. available + ready + matched entry → matched（counts / byClass / issues brief）
check('5 ready + entry → matched', () => {
  const out = derivePostValidationReport({ available: true, asOf: ASOF, entry: entry() }, 'ready');
  assert.equal(out.state, 'matched');
  assert.equal(out.warningCount, 2);
  assert.equal(out.errorCount, 0);
  assert.deepEqual(out.byClass, { taxonomy: 1, frontmatter: 1 });
  assert.equal(out.issueCount, 2);
  // brief issues: type / class / severity only (no value echo)
  assert.deepEqual(out.issues, [
    { type: 'unknown-tag', class: 'taxonomy', severity: 'warning' },
    { type: 'missing-title', class: 'frontmatter', severity: 'warning' },
  ]);
  assert.equal('value' in out.issues[0], false, 'brief issue must not echo value');
  assert.equal(out.asOf, ASOF);
});

// 6. available + published + matched → matched（visible status 同 ready）
check('6 published + entry → matched', () => {
  assert.equal(derivePostValidationReport({ available: true, asOf: ASOF, entry: entry() }, 'published').state, 'matched');
});

// 7. available + ready + no entry → clean（0 warnings）
check('7 ready + no entry → clean', () => {
  const out = derivePostValidationReport({ available: true, asOf: ASOF, entry: null }, 'ready');
  assert.deepEqual(out, { reportAvailable: true, state: 'clean', asOf: ASOF, warningCount: 0, errorCount: 0 });
});
check('8 published + no entry → clean', () => {
  assert.equal(derivePostValidationReport({ available: true, asOf: ASOF, entry: null }, 'published').state, 'clean');
});

// 8. matched severity normalization + class default + non-number counts safety
check('9 matched field normalization / safety', () => {
  const out = derivePostValidationReport(
    {
      available: true,
      asOf: ASOF,
      entry: {
        warningCount: 'oops',
        errorCount: null,
        byClass: null,
        issues: [{ type: 'duplicate-slug', class: undefined, severity: 'error' }, { type: 'x', severity: 'weird' }],
      },
    },
    'ready',
  );
  assert.equal(out.warningCount, 0, 'non-number warningCount → 0');
  assert.equal(out.errorCount, 0, 'null errorCount → 0');
  assert.deepEqual(out.byClass, {}, 'null byClass → {}');
  assert.equal(out.issues[0].class, 'unknown', 'missing class → unknown');
  assert.equal(out.issues[0].severity, 'error', 'error severity preserved');
  assert.equal(out.issues[1].severity, 'warning', 'non-error severity → warning');
  assert.equal(out.issueCount, 2);
});

// 9. matched with non-array issues → empty issues / issueCount 0
check('10 non-array issues → empty', () => {
  const out = derivePostValidationReport({ available: true, asOf: ASOF, entry: entry({ issues: 'nope' }) }, 'ready');
  assert.deepEqual(out.issues, []);
  assert.equal(out.issueCount, 0);
});

// 10. asOf non-string → null（不 crash）
check('11 non-string asOf → null', () => {
  const out = derivePostValidationReport({ available: true, asOf: 12345, entry: null }, 'ready');
  assert.equal(out.asOf, null);
});

// 11. determinism + 不 mutate input
check('12 deterministic + does not mutate input', () => {
  const e = entry();
  const ctx = { available: true, asOf: ASOF, entry: e };
  const snapshot = JSON.stringify({ ctx, e });
  const a = derivePostValidationReport(ctx, 'ready');
  const b = derivePostValidationReport(ctx, 'ready');
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify({ ctx, e }), snapshot, 'must not mutate ctx / entry');
});

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
