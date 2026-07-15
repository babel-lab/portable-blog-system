#!/usr/bin/env node
// Phase 20260703-A：npm script target 存在性 guard（source-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 package.json + fs.existsSync；**不** build / deploy / dev server / fetch / pull；
//     **不**執行任何被指到的腳本；**不**寫任何檔；**不**呼叫 Blogger / Google / GA4 / AdSense API。
//
// 目的（防呆 / 防回歸）：
//   package.json 大量 script 形如 `node src/scripts/X.js`。若未來 rename / move / refactor
//   把腳本檔改名或刪除，卻忘了同步 package.json，該 npm script 會在被呼叫時才 runtime 爆
//   「Cannot find module」，且平時 baseline 不會發現。本 guard 靜態斷言：package.json 每個
//   script 內出現的 .js 目標檔（node 呼叫的 local 路徑）都存在於 repo。
//
//   umbrella script（如 check:metadata-all / check:release-readiness / check:phase1-readiness /
//   check:redraft-all）另以 `npm run <name>` 串接既有 script。該參照具相同失效模式：rename 或
//   typo 後 npm 只在實際執行時報「Missing script」，靜態 baseline 不會發現。既有 umbrella
//   contract guard 只硬編碼守自己那一支的子檢查名單，repo 內其餘 `npm run` 參照無任何覆蓋，
//   因此本 guard 一併靜態解析 `npm run` 參照並斷言其可解析到 scripts 內既有 key。
//
// 斷言：
//   1. 逐一掃 package.json `scripts` 每個 value，抽出其中所有 local `.js` 目標（node 呼叫）。
//   2. 每個目標檔於 repo root 下 existsSync 為 true。
//   3. 至少掃到 1 個目標（sanity；避免 regex 全 miss 卻假綠）。
//   4. 逐一抽出每個 value 內所有 `npm run <name>` 參照，斷言 <name> 存在於 scripts。
//   5. 至少掃到 1 個 `npm run` 參照（sanity；避免 regex 全 miss 卻假綠）。

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PKG = path.join(REPO_ROOT, 'package.json');

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

const pkg = JSON.parse(readFileSync(PKG, 'utf-8'));
const scripts = pkg.scripts || {};

// 抽出一個 script value 內所有 local .js 目標：
//   - 僅取以 .js 結尾的 whitespace-delimited token
//   - 略過 flags（以 '-' 開頭，如 --mode=x.js 這種罕見情況也排除）
//   - 略過非 local 目標（http(s) URL）
function extractJsTargets(value) {
  const targets = [];
  for (const token of value.split(/\s+/)) {
    if (!token.endsWith('.js')) continue;
    if (token.startsWith('-')) continue;
    if (/^https?:\/\//i.test(token)) continue;
    targets.push(token);
  }
  return targets;
}

// 抽出一個 script value 內所有 `npm run <name>` 參照：
//   - 允許 npm 與 run 之間、run 與 name 之間有多個空白
//   - script name 允許 npm 慣用字元集（英數 + : _ . -）
function extractNpmRunTargets(value) {
  const targets = [];
  const pattern = /\bnpm\s+run\s+([A-Za-z0-9][A-Za-z0-9:_.-]*)/g;
  let match;
  while ((match = pattern.exec(value)) !== null) {
    targets.push(match[1]);
  }
  return targets;
}

let targetCount = 0;
for (const [name, value] of Object.entries(scripts)) {
  const targets = extractJsTargets(value);
  for (const target of targets) {
    targetCount += 1;
    const abs = path.join(REPO_ROOT, target);
    record(`${name} → ${target}`, existsSync(abs), existsSync(abs) ? '' : `missing ${target}`);
  }
}

record('at least one script .js target scanned', targetCount > 0,
  targetCount > 0 ? `${targetCount} targets` : 'no .js targets found in package.json scripts');

let npmRunCount = 0;
for (const [name, value] of Object.entries(scripts)) {
  for (const ref of extractNpmRunTargets(value)) {
    npmRunCount += 1;
    const resolves = Object.prototype.hasOwnProperty.call(scripts, ref);
    record(`${name} → npm run ${ref}`, resolves,
      resolves ? '' : `missing script "${ref}" in package.json scripts`);
  }
}

record('at least one npm run reference scanned', npmRunCount > 0,
  npmRunCount > 0 ? `${npmRunCount} references` : 'no npm run references found in package.json scripts');

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;
console.log('');
console.log(`npm script target existence guard: ${passed}/${total} PASS`);
if (passed !== total) process.exit(1);
