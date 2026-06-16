// Phase 20260616-admin-validator-per-post-aggregation-implementation-a：
//   per-post governance signal aggregation smoke test。
//
// 目的：鎖住 aggregatePostGovernanceSignals（src/scripts/load-admin-posts.js）之
//   deterministic 行為與正確性——把既有 per-post governanceSignals（5 欄 taxonomy
//   概念）整理成可被 Admin read-only UI 列舉之 { hasSignals, totalSignalCount, byClass,
//   signals[] } 結構。
//
// 約束（mirror src/scripts/check-adsense-resolver.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - synthetic in-memory input only；不讀 content / settings；不打 API；不寫檔
//   - 純函式 deterministic locks（settings-independent）
//   - 不重跑 validator；不 join validator warnings（per-post validator warning 仍 deferred）
//
// 執行：node src/scripts/check-admin-governance-aggregation.js
//   或  npm run check:admin-governance-aggregation
//   - exit 0 = 全 pass
//   - exit 1 = 任一 case fail（列出 FAIL 後 process.exit(1)）

import { strict as assert } from 'node:assert';
import { aggregatePostGovernanceSignals } from './load-admin-posts.js';

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

// 既有 derivePostGovernanceSignals 之 5 欄 shape（synthetic；無真實內容 / settings）
function makeSignals(overrides = {}) {
  return {
    unknownTagCount: 0,
    unknownCategoryFlag: false,
    crossSiteMismatchTagCount: 0,
    crossSiteMismatchCategoryFlag: false,
    signalSum: 0,
    ...overrides,
  };
}

const EMPTY = { hasSignals: false, totalSignalCount: 0, byClass: {}, signals: [] };

// 1. null / undefined / 非 object input → 空 aggregation（不 throw）
check('1 null input → empty aggregation', () => {
  assert.deepEqual(aggregatePostGovernanceSignals(null), EMPTY);
});
check('2 undefined input → empty aggregation', () => {
  assert.deepEqual(aggregatePostGovernanceSignals(undefined), EMPTY);
});
check('3 non-object input → empty aggregation', () => {
  assert.deepEqual(aggregatePostGovernanceSignals('nope'), EMPTY);
});

// 2. 全零 signals → 空 aggregation
check('4 all-zero signals → empty aggregation', () => {
  assert.deepEqual(aggregatePostGovernanceSignals(makeSignals()), EMPTY);
});

// 3. 單一 count signal（unknownTagCount）
check('5 unknownTagCount only', () => {
  const out = aggregatePostGovernanceSignals(makeSignals({ unknownTagCount: 2, signalSum: 2 }));
  assert.deepEqual(out, {
    hasSignals: true,
    totalSignalCount: 2,
    byClass: { taxonomy: 2 },
    signals: [{ type: 'unknown-tag', class: 'taxonomy', count: 2 }],
  });
});

// 4. 單一 flag signal（unknownCategoryFlag）→ count 1
check('6 unknownCategoryFlag only → count 1', () => {
  const out = aggregatePostGovernanceSignals(makeSignals({ unknownCategoryFlag: true, signalSum: 1 }));
  assert.deepEqual(out.signals, [{ type: 'unknown-category', class: 'taxonomy', count: 1 }]);
  assert.equal(out.totalSignalCount, 1);
});

// 5. cross-site mismatch tag count
check('7 crossSiteMismatchTagCount only', () => {
  const out = aggregatePostGovernanceSignals(makeSignals({ crossSiteMismatchTagCount: 3, signalSum: 3 }));
  assert.deepEqual(out.signals, [{ type: 'cross-site-mismatch-tag', class: 'taxonomy', count: 3 }]);
});

// 6. cross-site mismatch category flag
check('8 crossSiteMismatchCategoryFlag only → count 1', () => {
  const out = aggregatePostGovernanceSignals(makeSignals({ crossSiteMismatchCategoryFlag: true, signalSum: 1 }));
  assert.deepEqual(out.signals, [{ type: 'cross-site-mismatch-category', class: 'taxonomy', count: 1 }]);
});

// 7. 四種訊號齊發 → 固定 canonical 順序 + total + byClass
check('9 all four signals → canonical order + totals', () => {
  const sig = makeSignals({
    unknownTagCount: 2,
    unknownCategoryFlag: true,
    crossSiteMismatchTagCount: 1,
    crossSiteMismatchCategoryFlag: true,
    signalSum: 5,
  });
  const out = aggregatePostGovernanceSignals(sig);
  assert.deepEqual(out.signals.map((s) => s.type), [
    'unknown-tag',
    'unknown-category',
    'cross-site-mismatch-tag',
    'cross-site-mismatch-category',
  ]);
  assert.equal(out.totalSignalCount, 5);
  assert.deepEqual(out.byClass, { taxonomy: 5 });
  assert.equal(out.hasSignals, true);
});

// 8. totalSignalCount 與既有 signalSum 交叉檢核（同一 universe；應一致）
check('10 totalSignalCount equals signalSum', () => {
  const sig = makeSignals({
    unknownTagCount: 4,
    unknownCategoryFlag: true,
    crossSiteMismatchTagCount: 2,
    crossSiteMismatchCategoryFlag: false,
    signalSum: 7,
  });
  const out = aggregatePostGovernanceSignals(sig);
  assert.equal(out.totalSignalCount, sig.signalSum);
});

// 9. 只列 count > 0 之 signal（穩定過濾；中間零值不留空位）
check('11 only count>0 signals are listed', () => {
  const out = aggregatePostGovernanceSignals(makeSignals({
    unknownTagCount: 1,
    crossSiteMismatchCategoryFlag: true,
    signalSum: 2,
  }));
  assert.deepEqual(out.signals.map((s) => s.type), ['unknown-tag', 'cross-site-mismatch-category']);
});

// 10. flag 欄位非嚴格 true（如 1 / 'yes'）不視為觸發（governanceSignals 一律 boolean）
check('12 non-true flag value is not counted', () => {
  const out = aggregatePostGovernanceSignals(makeSignals({ unknownCategoryFlag: 1 }));
  assert.deepEqual(out, EMPTY);
});

// 11. count 欄位防呆：負數 / NaN / 非 number → 0
check('13 negative / NaN / non-number count → 0', () => {
  assert.deepEqual(aggregatePostGovernanceSignals(makeSignals({ unknownTagCount: -3 })), EMPTY);
  assert.deepEqual(aggregatePostGovernanceSignals(makeSignals({ crossSiteMismatchTagCount: NaN })), EMPTY);
  assert.deepEqual(aggregatePostGovernanceSignals(makeSignals({ unknownTagCount: '5' })), EMPTY);
});

// 12. count 欄位 floor（保守取整；不應出現小數 count）
check('14 fractional count is floored', () => {
  const out = aggregatePostGovernanceSignals(makeSignals({ unknownTagCount: 2.9, signalSum: 2 }));
  assert.equal(out.signals[0].count, 2);
  assert.equal(out.totalSignalCount, 2);
});

// 13. determinism：同 input 連呼兩次 → deep equal（純值；無時間 / 隨機依賴）
check('15 deterministic across repeated calls', () => {
  const sig = makeSignals({
    unknownTagCount: 1,
    unknownCategoryFlag: true,
    crossSiteMismatchTagCount: 1,
    crossSiteMismatchCategoryFlag: true,
    signalSum: 4,
  });
  const a = aggregatePostGovernanceSignals(sig);
  const b = aggregatePostGovernanceSignals(sig);
  assert.deepEqual(a, b);
  // signal 順序固定且與 input 欄位宣告順序無關
  const reordered = {
    crossSiteMismatchCategoryFlag: true,
    crossSiteMismatchTagCount: 1,
    unknownCategoryFlag: true,
    unknownTagCount: 1,
    signalSum: 4,
  };
  assert.deepEqual(aggregatePostGovernanceSignals(reordered).signals, a.signals);
});

// 14. 不 mutate 輸入物件
check('16 does not mutate input', () => {
  const sig = makeSignals({ unknownTagCount: 2, signalSum: 2 });
  const snapshot = JSON.stringify(sig);
  aggregatePostGovernanceSignals(sig);
  assert.equal(JSON.stringify(sig), snapshot);
});

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
