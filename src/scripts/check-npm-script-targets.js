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
// 斷言：
//   1. 逐一掃 package.json `scripts` 每個 value，抽出其中所有 local `.js` 目標（node 呼叫）。
//   2. 每個目標檔於 repo root 下 existsSync 為 true。
//   3. 至少掃到 1 個目標（sanity；避免 regex 全 miss 卻假綠）。

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

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;
console.log('');
console.log(`npm script target existence guard: ${passed}/${total} PASS`);
if (passed !== total) process.exit(1);
