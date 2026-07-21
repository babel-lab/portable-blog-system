#!/usr/bin/env node
// Phase 20260721-publish-target-stage Slice 4B：Blogger withdrawn sidecar schema focused guard。
//
// 上位契約：
//   - docs/publish-json-schema.md §5.7 / §9（withdrawn / schemaVersion 2 / lifecycle）
//   - docs/20260720-publish-target-stage-contract.md §11（Slice 4B）
//
// 範圍 / 邊界（fixture-only；negative test 完全隔離）：
//   - 所有測試資料皆為 **in-memory fixture**、**synthetic URL（.invalid TLD）**、**synthetic hash**。
//   - **不**讀 / 改任何真實文章、sidecar、manifest、authorization、settings。
//   - **不** build / deploy / push / 碰 gh-pages / 碰 dist* / 呼叫任何 API；零網路。
//   - 只呼叫純函式 helper（sidecar-withdrawal-contract.js / publish-stage.js / active-publication.js）。
//
// 斷言分區（對齊 spec §十一 case 1–40）：
//   Compatibility（1–6）／Withdrawn happy path（7–11）／Evidence preservation（12–17）／
//   Lifecycle（18–36）／Existing behavior（37–40）＋ echo-guard。

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  collectSidecarWithdrawalIssues,
  withdrawnStageStatusWarning,
  resolveSchemaVersion,
  WITHDRAWAL_ISSUE_TYPES as WT,
  STAGE_STATUS_ISSUE_TYPES as ST,
} from './sidecar-withdrawal-contract.js';
import { isActivePublishedTarget, getActivePublishedUrl } from './active-publication.js';

// 註：本 guard **不** import publish-stage.js（維持既有 importer 白名單不變）。stage 解析
//   （missing→production / invalid→ok:false）之單一事實來源為 publish-stage.js，已由
//   check:publish-target-stage 完整覆蓋；本 guard 只以「已解析之 stage 值」測 withdrawn 側決策。

const __filename = fileURLToPath(import.meta.url);

// ── harness ─────────────────────────────────────────────────────────────────────
const cases = [];
function check(name, fn) {
  try {
    fn();
    cases.push({ name, ok: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    cases.push({ name, ok: false });
    console.log(`[FAIL] ${name} — ${err.message}`);
  }
}

// ── fixtures（synthetic only）──────────────────────────────────────────────────────
const HEX64_A = 'a'.repeat(64);
const HEX64_B = 'b'.repeat(64);
const HEX64_C = 'c'.repeat(64);
const HEX40 = 'd'.repeat(40);
const SYNTH_URL = 'https://example.invalid/example-post';
const CTX = {
  sourcePath: 'content/blogger/posts/example.md',
  sidecarPath: 'content/blogger/posts/example.publish.json',
};

const clone = (o) => JSON.parse(JSON.stringify(o));

function validWithdrawnEvent() {
  return {
    event: 'withdrawn',
    fromStatus: 'published',
    toStatus: 'withdrawn',
    recordedAt: '2026-07-21T10:00:00+08:00',
    remoteVerifiedAt: '2026-07-21T09:55:00+08:00',
    reason: 'stage-preview',
    remoteDisposition: 'remote-live',
    sourcePath: 'content/blogger/posts/example.md',
    sourceSha256: HEX64_A,
    priorSidecarSha256: HEX64_B,
    gitHead: HEX40,
    authorizationFingerprint: HEX64_C,
  };
}

function validWithdrawnSidecar() {
  return {
    schemaVersion: 2,
    blogger: {
      type: 'post',
      status: 'withdrawn',
      permalink: 'example-post',
      publishedUrl: SYNTH_URL,
      publishedAt: '2026-01-01T12:00:00+08:00',
      bloggerPostId: '',
      publishYear: '2026',
      publishMonth: '01',
      history: [],
      lifecycle: [validWithdrawnEvent()],
    },
  };
}

// stage×status predicate 之輸入以「已解析之 stage」表示（見上方 import 註）。
const wsw = (stageResolvedOk, stage, status) =>
  withdrawnStageStatusWarning({ stageResolvedOk, stage, status, ...CTX });

// ── assertion helpers ─────────────────────────────────────────────────────────────
const hasType = (issues, type) => issues.some((i) => i.type === type);
const valuesOf = (issues, type) => issues.filter((i) => i.type === type).map((i) => i.value);
const run = (sidecar) => collectSidecarWithdrawalIssues(sidecar, CTX);

// ── Compatibility（1–6）────────────────────────────────────────────────────────────
check('1. legacy（無 schemaVersion）合法 sidecar 通過', () => {
  assert.deepEqual(run({ blogger: { status: 'published', publishedUrl: 'x' } }), []);
});
check('2. schemaVersion 1 合法 sidecar 通過', () => {
  assert.deepEqual(run({ schemaVersion: 1, blogger: { status: 'draft', history: [] } }), []);
});
check('3. schemaVersion 2 published 且無 lifecycle 通過', () => {
  assert.deepEqual(run({ schemaVersion: 2, blogger: { status: 'published', publishedUrl: 'x' } }), []);
});
check('4. schemaVersion 2 draft / ready / archived 維持現行規則（無 withdrawal issue）', () => {
  for (const status of ['draft', 'ready', 'archived']) {
    assert.deepEqual(run({ schemaVersion: 2, blogger: { status } }), [], `status=${status}`);
  }
});
check('5. unknown / 過大 / 0 / 負數 schemaVersion → error', () => {
  for (const v of [3, 99, 0, -1]) {
    const issues = run({ schemaVersion: v, blogger: { status: 'published' } });
    assert.ok(hasType(issues, WT.schemaVersionUnsupported), `schemaVersion=${v}`);
  }
  assert.equal(resolveSchemaVersion({ schemaVersion: 3 }).ok, false);
});
check('6. non-integer schemaVersion → error（1.5 / "2"）', () => {
  assert.ok(hasType(run({ schemaVersion: 1.5, blogger: {} }), WT.schemaVersionUnsupported));
  assert.ok(hasType(run({ schemaVersion: '2', blogger: {} }), WT.schemaVersionUnsupported));
});

// ── v1 誤用 v2-only 功能 → error（§五 5.1）─────────────────────────────────────────
check('5.1 v1 使用 withdrawn status → error', () => {
  const issues = run({ schemaVersion: 1, blogger: { status: 'withdrawn', publishedUrl: 'x' } });
  assert.ok(valuesOf(issues, WT.v1UsesV2Feature).includes('status:withdrawn'));
});
check('5.1 v1（legacy 缺省）使用 lifecycle → error', () => {
  const issues = run({ blogger: { status: 'published', lifecycle: [] } });
  assert.ok(valuesOf(issues, WT.v1UsesV2Feature).includes('lifecycle'));
});

// ── Withdrawn happy path（7–11）────────────────────────────────────────────────────
check('7. v2 withdrawn 完整 fixture 通過', () => {
  assert.deepEqual(run(validWithdrawnSidecar()), []);
});
check('8. preview + withdrawn → 無 stage/status diagnostic', () => {
  assert.equal(wsw(true, 'preview', 'withdrawn'), null);
});
check('9. production + withdrawn → publish-target-stage-conflicts-withdrawn-sidecar warning', () => {
  const issue = wsw(true, 'production', 'withdrawn');
  assert.ok(issue);
  assert.equal(issue.type, ST.conflictsWithdrawnSidecar);
  assert.equal(issue.severity, 'warning');
});
check('10. missing stage（→default production）+ withdrawn → 相同 warning', () => {
  // missing stage 於 publish-stage.js 解析為 production（DEFAULT_PUBLISH_STAGE；由 check:publish-target-stage
  //   覆蓋該映射）。此處以已解析之 stage='production' 表示，斷言 withdrawn 側產生相同 warning。
  const issue = wsw(true, 'production', 'withdrawn');
  assert.ok(issue);
  assert.equal(issue.type, ST.conflictsWithdrawnSidecar);
});
check('11. invalid stage → 不產 withdrawn warning（不 downgrade / 不隱藏 invalid-stage error）', () => {
  // invalid-stage error 本身由 publish-stage.js / validate-content.js 產生並由 check:publish-target-stage
  //   覆蓋；此處斷言 withdrawn predicate 於 stageResolvedOk=false 一律回 null，不 downgrade、不隱藏。
  assert.equal(wsw(false, null, 'withdrawn'), null);
});

// ── Evidence preservation（12–17）──────────────────────────────────────────────────
check('12. withdrawn 允許保留 publishedUrl（不報 missing evidence）', () => {
  assert.ok(!hasType(run(validWithdrawnSidecar()), WT.withdrawnMissingEvidence));
});
check('13. withdrawn 允許保留 publishedAt（不報 missing evidence）', () => {
  assert.ok(!valuesOf(run(validWithdrawnSidecar()), WT.withdrawnMissingEvidence).includes('publishedAt'));
});
check('14. withdrawn 允許 bloggerPostId 空字串', () => {
  const s = validWithdrawnSidecar();
  s.blogger.bloggerPostId = '';
  assert.deepEqual(run(s), []);
});
check('15. withdrawn 缺 publishedUrl → error', () => {
  const s = validWithdrawnSidecar();
  delete s.blogger.publishedUrl;
  assert.ok(valuesOf(run(s), WT.withdrawnMissingEvidence).includes('publishedUrl'));
});
check('16. withdrawn 缺 publishedAt → error', () => {
  const s = validWithdrawnSidecar();
  delete s.blogger.publishedAt;
  assert.ok(valuesOf(run(s), WT.withdrawnMissingEvidence).includes('publishedAt'));
});
check('17. validator output 不 echo URL（schema + stage/status 皆不含 publishedUrl 值）', () => {
  // 有效 fixture 於 production stage：schema issues + withdrawn warning 訊息皆不得含 URL。
  const combined = [
    ...run(validWithdrawnSidecar()),
    wsw(true, 'production', 'withdrawn'),
  ].filter(Boolean);
  const blob = combined.map((i) => `${i.type}|${i.value}`).join('\n');
  assert.ok(!blob.includes(SYNTH_URL), 'combined issue values must not echo publishedUrl');
  // 即使 lifecycle event 誤放 publishedUrl（duplicate evidence），也只回顯欄位名稱、不回顯 URL 值。
  const dup = validWithdrawnSidecar();
  dup.blogger.lifecycle[0].publishedUrl = SYNTH_URL;
  const dupIssues = run(dup);
  assert.ok(valuesOf(dupIssues, WT.lifecycleDuplicateEvidence).includes('publishedUrl'));
  assert.ok(!dupIssues.map((i) => String(i.value)).join('\n').includes(SYNTH_URL));
});

// ── Lifecycle（18–36）──────────────────────────────────────────────────────────────
check('18. withdrawn 缺 lifecycle → error', () => {
  const s = validWithdrawnSidecar();
  delete s.blogger.lifecycle;
  assert.ok(hasType(run(s), WT.withdrawnMissingLifecycle));
});
check('19. lifecycle 非 array → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle = { event: 'withdrawn' };
  assert.ok(valuesOf(run(s), WT.lifecycleMalformed).includes('not-array'));
});
check('20. empty lifecycle → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle = [];
  assert.ok(valuesOf(run(s), WT.withdrawnMissingLifecycle).includes('empty'));
});
check('21. last event 非 withdrawn → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle = [{ ...validWithdrawnEvent(), event: 'republished' }];
  assert.ok(valuesOf(run(s), WT.lifecycleStatusTransitionInconsistent).includes('last-event-not-withdrawn'));
});
check('22. fromStatus 非 published → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].fromStatus = 'draft';
  assert.ok(valuesOf(run(s), WT.lifecycleStatusTransitionInconsistent).includes('fromStatus'));
});
check('23. toStatus 非 withdrawn → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].toStatus = 'archived';
  assert.ok(valuesOf(run(s), WT.lifecycleStatusTransitionInconsistent).includes('toStatus'));
});
check('24. duplicate withdrawn event → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle = [validWithdrawnEvent(), validWithdrawnEvent()]; // 同 recordedAt → 隔離 ordering
  assert.ok(hasType(run(s), WT.lifecycleDuplicateWithdrawnEvent));
});
check('25. timestamp 無時區 → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].recordedAt = '2026-07-21T10:00:00';
  assert.ok(valuesOf(run(s), WT.lifecycleTimestampMalformed).includes('recordedAt:no-timezone'));
});
check('26. remoteVerifiedAt 晚於 recordedAt → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].remoteVerifiedAt = '2026-07-21T10:05:00+08:00';
  assert.ok(valuesOf(run(s), WT.lifecycleTimestampMalformed).includes('remoteVerifiedAt-after-recordedAt'));
});
check('27. invalid reason → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].reason = 'bogus';
  assert.ok(valuesOf(run(s), WT.lifecycleReasonInvalid).includes('reason'));
});
check('28. invalid remoteDisposition → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].remoteDisposition = 'bogus';
  assert.ok(hasType(run(s), WT.lifecycleRemoteDispositionInvalid));
});
check('29. malformed source SHA → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].sourceSha256 = 'xyz';
  assert.ok(valuesOf(run(s), WT.lifecycleHashMalformed).includes('sourceSha256'));
});
check('30. malformed prior sidecar SHA（uppercase）→ error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].priorSidecarSha256 = 'B'.repeat(64);
  assert.ok(valuesOf(run(s), WT.lifecycleHashMalformed).includes('priorSidecarSha256'));
});
check('31. malformed authorizationFingerprint → error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].authorizationFingerprint = 'abc';
  assert.ok(valuesOf(run(s), WT.lifecycleHashMalformed).includes('authorizationFingerprint'));
});
check('32. malformed git HEAD（長度錯誤）→ error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].gitHead = 'a'.repeat(64);
  assert.ok(valuesOf(run(s), WT.lifecycleHashMalformed).includes('gitHead'));
});
check('33. invalid sourcePath（absolute / dotdot / not-md / not-under）→ error', () => {
  for (const bad of [
    '/etc/passwd',
    'content/blogger/posts/../secret.md',
    'content/blogger/posts/example.txt',
    'content/github/posts/example.md',
  ]) {
    const s = validWithdrawnSidecar();
    s.blogger.lifecycle[0].sourcePath = bad;
    assert.ok(hasType(run(s), WT.lifecycleSourcePathInvalid), `sourcePath=${bad}`);
  }
});
check('34. lifecycle 重複 publishedUrl（duplicate evidence）→ error', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].publishedUrl = SYNTH_URL;
  assert.ok(valuesOf(run(s), WT.lifecycleDuplicateEvidence).includes('publishedUrl'));
});
check('35. lifecycle 含 approvedBy（private field）→ error（只回顯欄位名、不回顯 identity 值）', () => {
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle[0].approvedBy = 'secret-operator@example.invalid';
  const issues = run(s);
  assert.ok(valuesOf(issues, WT.lifecyclePrivateField).includes('approvedBy'));
  assert.ok(!issues.map((i) => String(i.value)).join('\n').includes('secret-operator'));
});
check('36. lifecycle 排序錯誤（recordedAt 遞減）→ error', () => {
  const later = { ...validWithdrawnEvent(), recordedAt: '2026-07-21T10:00:00+08:00' };
  const earlier = { ...validWithdrawnEvent(), recordedAt: '2026-07-21T09:00:00+08:00', remoteVerifiedAt: '2026-07-21T08:55:00+08:00' };
  const s = validWithdrawnSidecar();
  s.blogger.lifecycle = [later, earlier];
  assert.ok(hasType(run(s), WT.lifecycleOrderingInvalid));
});

// ── Existing behavior（37–40）──────────────────────────────────────────────────────
check('37. preview + published → withdrawn predicate 不介入（既有 transitional warning 由 check:publish-target-stage 覆蓋）', () => {
  // 既有 publish-target-stage-conflicts-published-sidecar warning 仍 inline 於 validate-content.js，
  //   由 check:publish-target-stage 覆蓋；此處斷言 Slice 4B withdrawn predicate 對 published 不產生任何 warning。
  assert.equal(wsw(true, 'preview', 'published'), null);
  assert.equal(wsw(true, 'production', 'published'), null);
});
check('38. active-publication helper 仍把 withdrawn 視為 inactive', () => {
  const target = { status: 'withdrawn', publishedUrl: SYNTH_URL };
  assert.equal(isActivePublishedTarget(target), false);
  assert.equal(getActivePublishedUrl(target), null);
});
check('39. 既有 blogger.history[] 契約不受 withdrawal 契約影響（不與 lifecycle 混同）', () => {
  // v2 published 帶 history[] 且無 lifecycle → 無 withdrawal issue。
  assert.deepEqual(
    run({ schemaVersion: 2, blogger: { status: 'published', publishedUrl: 'x', history: [{ from: 'a', to: 'b' }] } }),
    [],
  );
  // v1（legacy）帶 history[] → 無 issue。
  assert.deepEqual(run({ blogger: { status: 'draft', history: [{ from: 'a', to: 'b' }] } }), []);
});
check('40. 既有形狀 sidecar corpus（proxy of production summary 不變）→ 0 withdrawal issue', () => {
  // 對齊真實 repo 5 個 sidecar 之 (schemaVersion, status) 形狀：全部 legacy/v1、無 withdrawn/lifecycle。
  // 真正的 summary 不變由 §十二 validate:content（0/136/108）+ §十四 hash manifest 佐證；此為 fixture proxy。
  const corpus = [
    { blogger: { status: 'published', publishedUrl: 'x' } }, // schemaVersion 缺省 → v1
    { schemaVersion: 1, blogger: { status: 'draft', history: [] } },
    { schemaVersion: 1, blogger: { status: 'published', history: [] } },
  ];
  const total = corpus.flatMap((s) => run(s));
  assert.deepEqual(total, []);
});

// ── echo-guard：本 guard source 只用 synthetic host（.invalid），不含真實 production host ───────
check('echo-guard：guard source 不含真實 production host（fixture-only 自證）', () => {
  const src = readFileSync(__filename, 'utf8');
  // needle 以 fragment 組裝，避免 banned 字面本身出現在 source 而自我誤判（其餘文字亦不得寫出真實 host）。
  const banned = ['blog' + 'spot.com', 'babel' + '-lab', 'git' + 'hub.io'];
  for (const needle of banned) {
    assert.ok(!src.includes(needle), 'guard source must not contain a real production host');
  }
  assert.ok(src.includes('.invalid'), 'guard must use .invalid synthetic host');
});

// ── summary ────────────────────────────────────────────────────────────────────────
const total = cases.length;
const passed = cases.filter((c) => c.ok).length;
const failed = total - passed;
console.log('');
console.log(`sidecar withdrawal schema guard: ${passed}/${total} PASS`);
if (failed > 0) {
  console.log(`FAIL ${failed}`);
  process.exit(1);
}
