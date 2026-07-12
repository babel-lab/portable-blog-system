#!/usr/bin/env node
// Phase 20260712：check:metadata-all checks-only contract guard（source-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 package.json 文字；**不**執行 check:metadata-all；**不**執行任何被指到的腳本；
//     **不** build / deploy / dev server / fetch / pull；**不**寫任何檔；**不**讀取 deploy clone
//     （/d/github/blog-new/portable-blog-deploy）；**不**碰 gh-pages；**不**呼叫 Blogger / Google
//     / GA4 / AdSense API。
//
// 目的（防呆 / 防回歸）：
//   check:metadata-all 是「metadata / cross-field / cross-resolver invariant checks umbrella」，
//   只串接既有 read-only 子檢查（metadata-guards → metadata-cross-fields →
//   download-indexing-independence）。它同時是 check:release-readiness 的一個子檢查，因此
//   加在 metadata-all 內的檢查會透過 metadata-all 間接由 release-readiness 執行一次。
//   若未來有人：
//     (a) 誤把它改成含 build / deploy / push / gh-pages / write 等危險操作；或
//     (b) 誤刪其中某一必要子檢查（例如把 download-indexing-independence 拿掉），
//   Phase 1 readiness 因為有 direct integration 仍會偵測到，但 release-readiness 會靜默
//   失去 coverage。本 guard 靜態斷言 package.json 中該 script 維持 checks-only 契約與
//   四個子檢查（本 contract + 兩個 metadata umbrella + download indexing invariant）的順序。
//
// 斷言：
//   1. package.json 可解析。
//   2. scripts["check:metadata-all"] 存在且為非空 string。
//   3. script 包含四個必要片段（metadata-all-contract / metadata-guards /
//      metadata-cross-fields / download-indexing-independence）。
//   4. script 不含任何危險 token（build / deploy / gh-pages / publish / push / write /
//      backfill:url / admin:write / safe-write / rm -rf / git push / git checkout / git reset）。
//   5. script 包含四個 ordered fragments，且 indexOf 嚴格遞增：
//      contract → metadata-guards → metadata-cross-fields → download-indexing-independence。
//
// 注意：
//   - "check:metadata-all-contract" 為 "check:metadata-all" 的前綴子字串；REQUIRED_FRAGMENTS 使用
//     完整 " && npm run check:metadata-all-contract" 之類的搜尋容易誤匹配，因此本 guard 以
//     "npm run check:metadata-all-contract"、"npm run check:metadata-guards" 等完整子字串比對，
//     並額外驗證 "npm run check:metadata-all" 在 script value 中並非以 metadata-all-contract 之外
//     的其他形式被誤引用（metadata-all 呼叫自己會造成無限遞迴）。
//   - "publish" 未出現於本 script（無 prepublish 片段），FORBIDDEN_TOKENS 仍列入以維持與
//     release-readiness / phase1-readiness contract 一致的 checks-only 契約。

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PKG = path.join(REPO_ROOT, 'package.json');

const SCRIPT_NAME = 'check:metadata-all';

// 四個必要子檢查片段；順序 = contract 先跑，再跑 metadata umbrella 與 cross-field，
// 最後跑 download indexing cross-resolver invariant。
const REQUIRED_FRAGMENTS = [
  'npm run check:metadata-all-contract',
  'npm run check:metadata-guards',
  'npm run check:metadata-cross-fields',
  'npm run check:download-indexing-independence',
];

const ORDERED_FRAGMENTS = [
  'npm run check:metadata-all-contract',
  'npm run check:metadata-guards',
  'npm run check:metadata-cross-fields',
  'npm run check:download-indexing-independence',
];

// 危險 token：每項可為 plain 子字串或 { label, re }（regex）。
const FORBIDDEN_TOKENS = [
  'build',
  'deploy',
  'gh-pages',
  'publish',
  'push',
  'write',
  'backfill:url',
  'admin:write',
  'safe-write',
  'rm -rf',
  'git push',
  'git checkout',
  'git reset',
];

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

// 1. package.json 可解析
let pkg;
try {
  pkg = JSON.parse(readFileSync(PKG, 'utf-8'));
  record('package.json parseable', true);
} catch (err) {
  record('package.json parseable', false, err.message);
  console.log('');
  console.log('metadata-all contract guard: 0/1 PASS');
  process.exit(1);
}

const scripts = pkg.scripts || {};
const value = scripts[SCRIPT_NAME];

// 2. script 存在且為非空 string
const scriptExists = typeof value === 'string' && value.trim().length > 0;
record(`scripts["${SCRIPT_NAME}"] exists and is a non-empty string`, scriptExists,
  scriptExists ? '' : `got ${typeof value}`);

if (!scriptExists) {
  const passed = cases.filter((c) => c.ok).length;
  console.log('');
  console.log(`metadata-all contract guard: ${passed}/${cases.length} PASS`);
  process.exit(1);
}

// 3. 四個必要片段皆存在
let requiredHit = 0;
for (const frag of REQUIRED_FRAGMENTS) {
  const ok = value.includes(frag);
  if (ok) requiredHit += 1;
  record(`required fragment present: "${frag}"`, ok, ok ? '' : 'missing');
}

// 4. 無危險 token
let forbiddenHit = 0;
for (const token of FORBIDDEN_TOKENS) {
  const isRegex = typeof token === 'object';
  const label = isRegex ? token.label : token;
  const present = isRegex ? token.re.test(value) : value.includes(token);
  if (present) forbiddenHit += 1;
  record(`forbidden token absent: "${label}"`, !present, present ? `found "${label}"` : '');
}

// 5. ordered fragments：indexOf 嚴格遞增
let orderedHit = 0;
let lastIdx = -1;
const orderProblems = [];
for (const frag of ORDERED_FRAGMENTS) {
  const idx = value.indexOf(frag);
  if (idx > lastIdx) {
    orderedHit += 1;
    lastIdx = idx;
  } else if (idx < 0) {
    orderProblems.push(`"${frag}" missing`);
  } else {
    orderProblems.push(`"${frag}" out of order (idx ${idx} ≤ prev ${lastIdx})`);
  }
}
const orderOk = orderProblems.length === 0;
record(
  `ordered fragments in expected sequence (${orderedHit}/${ORDERED_FRAGMENTS.length})`,
  orderOk,
  orderOk ? '' : orderProblems.join('; '),
);

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;

console.log('');
console.log('metadata-all contract summary:');
console.log(`  script "${SCRIPT_NAME}" present: ${scriptExists ? 'yes' : 'no'}`);
console.log(`  required fragments: ${requiredHit}/${REQUIRED_FRAGMENTS.length}`);
console.log(`  ordered fragments: ${orderedHit}/${ORDERED_FRAGMENTS.length}`);
console.log(`  forbidden tokens found: ${forbiddenHit}/${FORBIDDEN_TOKENS.length} checked`);
console.log('');
console.log(`metadata-all contract guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);

if (passed !== total) {
  console.log('');
  console.log('FAIL reasons:');
  for (const c of cases.filter((x) => !x.ok)) {
    console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  process.exit(1);
}
