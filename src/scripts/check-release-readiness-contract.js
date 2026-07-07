#!/usr/bin/env node
// Phase 20260707：check:release-readiness no-deploy contract guard（source-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 package.json 文字；**不**執行 check:release-readiness；**不**執行任何被指到的腳本；
//     **不** build / deploy / dev server / fetch / pull；**不**寫任何檔；**不**讀取 deploy clone
//     （/d/github/blog-new/portable-blog-deploy）；**不**碰 gh-pages；**不**呼叫 Blogger / Google
//     / GA4 / AdSense API。
//
// 目的（防呆 / 防回歸）：
//   check:release-readiness 是「checks-only umbrella」，只串接既有 read-only 子檢查
//   （github-pages-prepublish → prepublish-smoke → metadata-all → validate:content）。
//   若未來有人誤把它改成含 build / deploy / push / gh-pages / dist 等危險操作，release
//   readiness 就從「安全檢查」變成「會實際發布」，且平時 baseline 不會發現。本 guard 靜態斷言
//   package.json 中該 script 維持 checks-only 契約。
//
// 斷言：
//   1. package.json 可解析。
//   2. scripts["check:release-readiness"] 存在且為非空 string。
//   3. script 包含四個必要片段（prepublish / prepublish-smoke / metadata-all / validate:content）。
//   4. script 不含任何危險 token（build / deploy / gh-pages / push / publish / dist /
//      portable-blog-deploy）。
//   5. script 包含五個 ordered fragments（contract → prepublish → prepublish-smoke →
//      metadata-all → validate:content），且 indexOf 嚴格遞增。
//
// 注意：check:github-pages-prepublish{,-smoke} 名稱含 "prepublish"，其中的 "publish" 屬合法
//       子字串，不得被誤判為危險的 "publish"。危險 "publish" 偵測以 negative lookbehind
//       (?<!pre) 排除 "prepublish"。

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PKG = path.join(REPO_ROOT, 'package.json');

const SCRIPT_NAME = 'check:release-readiness';

const REQUIRED_FRAGMENTS = [
  'npm run check:github-pages-prepublish',
  'npm run check:github-pages-prepublish-smoke',
  'npm run check:metadata-all',
  'npm run validate:content',
];

// Ordered fragments：check:release-readiness 契約要求 contract guard 先跑
// （避免其他子檢查在 contract 未通過前浪費時間），最後才跑重量級 validate:content。
// 使用 indexOf 嚴格遞增判斷。若某 fragment missing，其 indexOf = -1 會使 order check fail；
// 為避免與 REQUIRED_FRAGMENTS missing 檢查重複噪音，本檢查以單一 aggregate case 呈現。
const ORDERED_FRAGMENTS = [
  'npm run check:release-readiness-contract',
  'npm run check:github-pages-prepublish',
  'npm run check:github-pages-prepublish-smoke',
  'npm run check:metadata-all',
  'npm run validate:content',
];

// 危險 token：每項可為 plain 子字串或 { label, re }（regex）。
// "publish" 用 negative lookbehind 排除 "prepublish"，避免誤判合法 prepublish 片段。
const FORBIDDEN_TOKENS = [
  'build',
  'deploy',
  'gh-pages',
  'push',
  'dist',
  'portable-blog-deploy',
  { label: 'publish', re: /(?<!pre)publish/ },
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
  console.log('release-readiness contract guard: 0/1 PASS');
  process.exit(1);
}

const scripts = pkg.scripts || {};
const value = scripts[SCRIPT_NAME];

// 2. script 存在且為非空 string
const scriptExists = typeof value === 'string' && value.trim().length > 0;
record(`scripts["${SCRIPT_NAME}"] exists and is a non-empty string`, scriptExists,
  scriptExists ? '' : `got ${typeof value}`);

// script 不存在時，後續片段 / token 檢查無意義 → 直接收尾
if (!scriptExists) {
  const passed = cases.filter((c) => c.ok).length;
  console.log('');
  console.log(`release-readiness contract guard: ${passed}/${cases.length} PASS`);
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
console.log('release-readiness contract summary:');
console.log(`  script "${SCRIPT_NAME}" present: ${scriptExists ? 'yes' : 'no'}`);
console.log(`  required fragments: ${requiredHit}/${REQUIRED_FRAGMENTS.length}`);
console.log(`  ordered fragments: ${orderedHit}/${ORDERED_FRAGMENTS.length}`);
console.log(`  forbidden tokens found: ${forbiddenHit}/${FORBIDDEN_TOKENS.length} checked`);
console.log('');
console.log(`release-readiness contract guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);

if (passed !== total) {
  console.log('');
  console.log('FAIL reasons:');
  for (const c of cases.filter((x) => !x.ok)) {
    console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  process.exit(1);
}
