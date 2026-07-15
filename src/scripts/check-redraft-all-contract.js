#!/usr/bin/env node
// Phase 20260715：check:redraft-all no-write contract guard（source-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 package.json 文字；**不**執行 check:redraft-all；**不**執行任何被指到的腳本；
//     **不** build / deploy / dev server / fetch / pull；**不**寫任何檔；**不**讀取 deploy clone
//     （/d/github/blog-new/portable-blog-deploy）；**不**碰 gh-pages；**不**呼叫 Blogger / Google
//     / GA4 / AdSense API；**不**觸發任何 admin write path（apply / engine / CLI）。
//
// 目的（防呆 / 防回歸）：
//   check:redraft-all 是 admin redraft write-path 的聚合檢查閘門，只串接六支既有 read-only
//   contract guard（lifecycle → lookup → plan → git-safety preflight → apply engine → apply CLI）。
//   它本身必須是 checks-only：跑它**不得**寫任何 production Markdown、不得 commit / push /
//   build / deploy。若未來有人：
//     (a) 靜默刪掉其中一支子 guard → write-path 覆蓋面縮水而 baseline 不會發現；
//     (b) 把 git-safety preflight 排到 apply guard 之後 → 安全門順序契約失效；
//     (c) 塞入 `--apply` / env gate / confirmation phrase / admin:redraft-apply / build / deploy
//         → 「安全檢查」本身變成會實際寫入或發布的東西。
//   本 guard 靜態斷言 package.json 中該 script 維持 checks-only + 六支齊全 + 順序正確之契約。
//
// 斷言：
//   1. package.json 可解析。
//   2. scripts["check:redraft-all"] 存在且為非空 string。
//   3. script 包含六個必要片段（lifecycle / lookup / plan / git-safety / apply-engine / apply-cli）。
//   4. script 不含任何危險 token（write path 觸發 / build / deploy / push / gh-pages / dist）。
//   5. script 包含七個 ordered fragments（contract → lifecycle → lookup → plan → git-safety →
//      apply-engine → apply-cli），且 indexOf 嚴格遞增。git-safety preflight 必須先於兩支
//      apply guard，與 write-path preflight 契約一致。
//   6. 六支子 guard 皆存在於 scripts 且為直接 `node src/scripts/*.js` 目標（保持扁平；
//      禁止子層再套 umbrella，避免遞迴與覆蓋面被間接稀釋）。
//
// 注意：
//   - 六支子 guard 名稱含 "redraft-apply-engine" / "redraft-apply-cli"，其中的 "apply" 屬合法
//     子字串，不得被誤判為危險 token。危險偵測針對的是「真正會寫入的入口」：CLI flag `--apply`、
//     env gate、confirmation phrase、npm 入口 `admin:redraft-apply` / `admin:write`。
//   - "publish" 以 negative lookbehind (?<!pre) 排除合法 "prepublish"；"republish" 會被攔下，
//     屬預期（redraft-all 不得觸發 republish op）。

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PKG = path.join(REPO_ROOT, 'package.json');

const SCRIPT_NAME = 'check:redraft-all';

// 六支子 guard（package.json script 名稱）。順序即契約順序。
const SUB_GUARDS = [
  'check:github-redraft-lifecycle',
  'check:admin-article-lookup',
  'check:redraft-plan',
  'check:admin-git-safety-preflight',
  'check:redraft-apply-engine',
  'check:redraft-apply-cli',
];

const REQUIRED_FRAGMENTS = SUB_GUARDS.map((name) => `npm run ${name}`);

// Ordered fragments：contract guard 先跑（避免子檢查在契約破裂時浪費時間），
// 其後 lifecycle → lookup → plan → git-safety → apply-engine → apply-cli。
const ORDERED_FRAGMENTS = [
  `npm run ${SCRIPT_NAME}-contract`,
  ...REQUIRED_FRAGMENTS,
];

// 危險 token：每項可為 plain 子字串或 { label, re }（regex）。
const FORBIDDEN_TOKENS = [
  '--apply',
  '--confirm',
  'PORTABLE_BLOG_REDRAFT_APPLY',
  'DEAN',
  'admin:redraft-apply',
  'admin:write',
  'safe-write',
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

function summarize(exitCode) {
  const passed = cases.filter((c) => c.ok).length;
  const total = cases.length;
  console.log('');
  console.log(`redraft-all contract guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
  if (passed !== total) {
    console.log('');
    console.log('FAIL reasons:');
    for (const c of cases.filter((x) => !x.ok)) {
      console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
    }
  }
  process.exit(exitCode ?? (passed === total ? 0 : 1));
}

// 1. package.json 可解析
let pkg;
try {
  pkg = JSON.parse(readFileSync(PKG, 'utf-8'));
  record('package.json parseable', true);
} catch (err) {
  record('package.json parseable', false, err.message);
  summarize(1);
}

const scripts = pkg.scripts || {};
const value = scripts[SCRIPT_NAME];

// 2. script 存在且為非空 string
const scriptExists = typeof value === 'string' && value.trim().length > 0;
record(`scripts["${SCRIPT_NAME}"] exists and is a non-empty string`, scriptExists,
  scriptExists ? '' : `got ${typeof value}`);

// script 不存在時，後續片段 / token / 順序檢查無意義 → 直接收尾
if (!scriptExists) summarize(1);

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

// 6. 六支子 guard 皆為直接 node script 目標（扁平；非巢狀 umbrella）
const DIRECT_NODE_TARGET = /^node src\/scripts\/[\w.-]+\.js$/;
let flatHit = 0;
for (const name of SUB_GUARDS) {
  const sub = scripts[name];
  const ok = typeof sub === 'string' && DIRECT_NODE_TARGET.test(sub.trim());
  if (ok) flatHit += 1;
  record(
    `sub-guard "${name}" is a direct node script target`,
    ok,
    ok ? '' : (typeof sub === 'string' ? `got "${sub}"` : `missing (${typeof sub})`),
  );
}

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;

console.log('');
console.log('redraft-all contract summary:');
console.log(`  script "${SCRIPT_NAME}" present: ${scriptExists ? 'yes' : 'no'}`);
console.log(`  required fragments: ${requiredHit}/${REQUIRED_FRAGMENTS.length}`);
console.log(`  ordered fragments: ${orderedHit}/${ORDERED_FRAGMENTS.length}`);
console.log(`  flat sub-guard targets: ${flatHit}/${SUB_GUARDS.length}`);
console.log(`  forbidden tokens found: ${forbiddenHit}/${FORBIDDEN_TOKENS.length} checked`);

summarize(passed === total ? 0 : 1);
