#!/usr/bin/env node
// Phase 20260708：check:phase1-readiness checks-only contract guard（source-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 package.json 文字；**不**執行 check:phase1-readiness；**不**執行任何被指到的腳本；
//     **不** build / deploy / dev server / fetch / pull；**不**寫任何檔；**不**讀取 deploy clone
//     （/d/github/blog-new/portable-blog-deploy）；**不**碰 gh-pages；**不**呼叫 Blogger / Google
//     / GA4 / AdSense API。
//
// 目的（防呆 / 防回歸）：
//   check:phase1-readiness 是「Phase 1 穩定測試 checks-only umbrella」，只串接既有 read-only
//   子檢查（validate:content → npm-script-targets → adsense-mode-metadata → blogger-backfill
//   → github-pages-prepublish → github-pages-prepublish-smoke）。若未來有人誤把它改成含
//   build / deploy / push / gh-pages / write 等危險操作，Phase 1 readiness 就從「安全檢查」變成
//   「會實際發布 / 寫檔」，且平時 baseline 不會發現。本 guard 靜態斷言 package.json 中該 script
//   維持 checks-only 契約與六個子檢查的順序。
//
// 斷言：
//   1. package.json 可解析。
//   2. scripts["check:phase1-readiness"] 存在且為非空 string。
//   3. script 包含六個必要片段（validate:content / npm-script-targets / adsense-mode-metadata
//      / blogger-backfill / github-pages-prepublish / github-pages-prepublish-smoke）。
//   4. script 不含任何危險 token（build / deploy / gh-pages / publish / push / write /
//      backfill:url / admin:write / safe-write / rm -rf / git push / git checkout / git reset）。
//   5. script 包含六個 ordered fragments，且 indexOf 嚴格遞增。
//
// 注意：
//   - check:github-pages-prepublish{,-smoke} 名稱含 "prepublish"，其中的 "publish" 屬合法子字串，
//     不得被誤判為危險的 "publish"。危險 "publish" 偵測以 negative lookbehind (?<!pre) 排除
//     "prepublish"。
//   - check:blogger-backfill 名稱含 "backfill"，屬合法子字串；危險 token 精確指定為 "backfill:url"
//     （npm script 名），不會誤判 "blogger-backfill"。

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PKG = path.join(REPO_ROOT, 'package.json');

const SCRIPT_NAME = 'check:phase1-readiness';

// 六個 Phase 1 穩定測試 read-only 子檢查，順序固定。
const REQUIRED_FRAGMENTS = [
  'npm run validate:content',
  'npm run check:npm-script-targets',
  'npm run check:adsense-mode-metadata',
  'npm run check:blogger-backfill',
  'npm run check:github-pages-prepublish',
  'npm run check:github-pages-prepublish-smoke',
];

// Ordered fragments：與 REQUIRED_FRAGMENTS 相同的六項，以 indexOf 嚴格遞增判斷順序。
// 注意 "npm run check:github-pages-prepublish" 為 "...-smoke" 的前綴子字串；indexOf 會取第一個
// 出現位置（第 5 項），而 "-smoke"（第 6 項）出現在其後，故嚴格遞增仍成立。
const ORDERED_FRAGMENTS = [
  'npm run validate:content',
  'npm run check:npm-script-targets',
  'npm run check:adsense-mode-metadata',
  'npm run check:blogger-backfill',
  'npm run check:github-pages-prepublish',
  'npm run check:github-pages-prepublish-smoke',
];

// 危險 token：每項可為 plain 子字串或 { label, re }（regex）。
// "publish" 用 negative lookbehind 排除 "prepublish"，避免誤判合法 prepublish 片段。
const FORBIDDEN_TOKENS = [
  'build',
  'deploy',
  'gh-pages',
  'push',
  'write',
  'backfill:url',
  'admin:write',
  'safe-write',
  'rm -rf',
  'git push',
  'git checkout',
  'git reset',
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
  console.log('phase1-readiness contract guard: 0/1 PASS');
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
  console.log(`phase1-readiness contract guard: ${passed}/${cases.length} PASS`);
  process.exit(1);
}

// 3. 六個必要片段皆存在
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
console.log('phase1-readiness contract summary:');
console.log(`  script "${SCRIPT_NAME}" present: ${scriptExists ? 'yes' : 'no'}`);
console.log(`  required fragments: ${requiredHit}/${REQUIRED_FRAGMENTS.length}`);
console.log(`  ordered fragments: ${orderedHit}/${ORDERED_FRAGMENTS.length}`);
console.log(`  forbidden tokens found: ${forbiddenHit}/${FORBIDDEN_TOKENS.length} checked`);
console.log('');
console.log(`phase1-readiness contract guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);

if (passed !== total) {
  console.log('');
  console.log('FAIL reasons:');
  for (const c of cases.filter((x) => !x.ok)) {
    console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  process.exit(1);
}
