#!/usr/bin/env node
// Phase 20260703-c1-g1：GitHub build cache hygiene 回歸 guard（source-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 src/scripts/build-github.js source 字串；**不** build / deploy / dev server /
//     fetch / pull；**不**寫任何檔；**不**呼叫 Blogger / Google / GA4 / AdSense API。
//
// 目的（防回歸）：
//   C1-G0 發現 stale `.cache/pages/posts/<slug>/` 會被 vite（glob `**/*.html` 當 rollup
//   input + emptyOutDir rebuild）複製進 dist/ 成 orphan URL（draft / quarantined / deleted
//   post）。C1-G1 於 build-github.js `main()` 在寫任何 page 前整個清除 `PAGES_DIR`。
//   本 guard 靜態鎖住該修復，避免未來 refactor 移除 cleanup 或把它移到 page 寫入之後。
//
// 斷言：
//   1. build-github.js 含整棵 `fs.rm(PAGES_DIR, { recursive: true, force: true })` 清除。
//   2. 該清除出現在第一個 `writeText(path.join(PAGES_DIR, ...))` page 寫入之前。

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BUILD_GITHUB = path.join(REPO_ROOT, 'src', 'scripts', 'build-github.js');

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

const src = readFileSync(BUILD_GITHUB, 'utf-8');

// 1. 存在整棵 PAGES_DIR cleanup（容忍空白差異）。
const cleanupRe = /fs\.rm\(\s*PAGES_DIR\s*,\s*\{\s*recursive:\s*true\s*,\s*force:\s*true\s*\}\s*\)/;
const cleanupMatch = src.match(cleanupRe);
record('build-github.js clears entire PAGES_DIR', !!cleanupMatch,
  cleanupMatch ? '' : 'missing fs.rm(PAGES_DIR, { recursive: true, force: true })');

// 2. cleanup 在第一個 PAGES_DIR page 寫入之前。
const cleanupIdx = cleanupMatch ? src.indexOf(cleanupMatch[0]) : -1;
const firstWriteIdx = src.search(/writeText\(\s*path\.join\(\s*PAGES_DIR/);
const orderOk = cleanupIdx >= 0 && firstWriteIdx >= 0 && cleanupIdx < firstWriteIdx;
record('PAGES_DIR cleanup precedes first page write', orderOk,
  orderOk ? '' : `cleanupIdx=${cleanupIdx} firstWriteIdx=${firstWriteIdx}`);

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;
console.log('');
console.log(`GitHub build cache hygiene guard: ${passed}/${total} PASS`);
if (passed !== total) process.exit(1);
