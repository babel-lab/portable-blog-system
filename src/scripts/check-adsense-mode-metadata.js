#!/usr/bin/env node
// Phase 20260706-adsense-mode-metadata-guard：frontmatter `ads.adsenseMode` 值域守門
//   （report-only / warning-only / additive；standalone，不動 validate-content.js / build / package）。
//
// 背景 / 決策來源：
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §D（`adsenseMode` 初始值域：
//     full / limited / off；本輪只記錄決策，不動 schema / render / build）
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §C（base six AdSense slots
//     與 custom promo blocks 分層；本 guard 不涉及 render 與 promo block）
//   - src/scripts/check-content-type-metadata.js（同型 standalone guard 之樣板）
//
// 目的：建立「未來若 frontmatter 出現 `ads.adsenseMode`，可被檢查」之最小保護。
//   - 本輪不導入 landing / campaign page、不改 EJS render、不改正式 content、不改 ads.config.json。
//   - 現有 production 文章皆無 `ads.adsenseMode` → 全部視為 legacy → 0 warning。
//
// 為何獨立 script（而非改 validate-content.js）：
//   - validate-content.js 為 build-coupled 中央 validator；於其加規則須連動改 SP-2 in-memory
//     harness 與 validation-fixtures，會位移 documented validate:content 0/135/107 baseline。
//     獨立 report-only script = 零 baseline blast radius。
//
// 行為（per decision §D + task §3）：
//   - 缺 `ads` block：legacy/no ads block，不報 error、不報 warning。
//   - 有 `ads` block 但缺 `adsenseMode`：legacy/no adsenseMode，不報 error、不報 warning。
//   - `ads.adsenseMode` ∈ { full, limited, off }（exact match、case-sensitive）：valid。
//   - `ads.adsenseMode` 為 string 但不在允許值域：warning（adsense-mode-invalid-value）。
//   - `ads.adsenseMode` 型別不是 string：warning（adsense-mode-invalid-type）。
//   - `ads` 型別不是 object / map（純 map，非 array / 非 primitive）：warning（ads-invalid-type）。
//   - 不自動修正 / 不自動補欄位 / 不用 legacy blocks.adsenseTop/Middle/Bottom 推斷 /
//     不用 category / tags / UTM / GA4 / Blogger / GitHub metadata 推斷 / 不猜 Blogger URL / postId / publishedAt。
//   - 不讀寫 settings JSON、不修改任何正式 content。
//
// 掃描範圍（per task §3.A；standalone → 明列 4 個 content 目錄）：
//   - content/github/posts/**/*.md
//   - content/blogger/posts/**/*.md
//   - content/github/pages/**/*.md
//   - content/blogger/pages/**/*.md
//   排除 *.fb.md sidecar（既有 check-content-type-metadata.js 慣例；本 guard 不消費 sidecar）。
//   不掃 deploy clone、不掃 content/settings、不掃 validation-fixtures（避免擾動既有 baseline）。
//
// 可選 CLI 參數：傳入一或多個 file / glob，改掃指定目標（供臨時 fixture 驗證用，不需在 repo 新增 fixture）。
//   例：node src/scripts/check-adsense-mode-metadata.js /tmp/_am-fixtures/**/*.md
//
// 執行：node src/scripts/check-adsense-mode-metadata.js
//   - exit code 一律 0（report-only / warning-only / 非 blocking）。
//   - warning 只印出、不影響 exit code；程式層級錯誤（glob / IO）才由 node 預設拋非 0。

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// adsenseMode 初始允許值域（per decision §D）。exact match，case-sensitive。
const VALID_ADSENSE_MODE = new Set(['full', 'limited', 'off']);

// 預設掃描 glob（relative to PROJECT_ROOT）；排除 *.fb.md sidecar。
const DEFAULT_GLOBS = [
  'content/github/posts/**/*.md',
  'content/blogger/posts/**/*.md',
  'content/github/pages/**/*.md',
  'content/blogger/pages/**/*.md',
];
const IGNORE_GLOBS = ['**/*.fb.md'];

function toRelative(absPath) {
  return path.relative(PROJECT_ROOT, absPath).split(path.sep).join('/');
}

function describeType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

// 檢查單一 frontmatter 之 ads / adsenseMode；回傳分類結果。
function inspectAdsenseMode(data, sourcePath) {
  const ads = data.ads;

  // 缺 ads block → legacy/no ads block（per task §3.A）：不報。
  if (ads === undefined) return { kind: 'legacy-no-ads' };

  // ads 存在但型別非 plain object / map → warning。
  //   YAML mapping → object；plain object 判斷：typeof === 'object' && !array && !null。
  if (typeof ads !== 'object' || ads === null || Array.isArray(ads)) {
    return {
      kind: 'warning',
      type: 'ads-invalid-type',
      sourcePath,
      value: `ads typeof=${describeType(ads)} (must be object/map)`,
    };
  }

  const mode = ads.adsenseMode;

  // 缺 adsenseMode → legacy/no adsenseMode（per task §3.A）：不報。
  if (mode === undefined) return { kind: 'legacy-no-mode' };

  // adsenseMode 型別非 string → warning。
  if (typeof mode !== 'string') {
    return {
      kind: 'warning',
      type: 'adsense-mode-invalid-type',
      sourcePath,
      value: `ads.adsenseMode typeof=${describeType(mode)} (must be string: full/limited/off)`,
    };
  }

  // string 但不在允許值域 → warning。
  if (!VALID_ADSENSE_MODE.has(mode)) {
    return {
      kind: 'warning',
      type: 'adsense-mode-invalid-value',
      sourcePath,
      value: `ads.adsenseMode="${mode}" (must be full/limited/off)`,
    };
  }

  // 合法值 → PASS。
  return { kind: 'valid', value: mode };
}

function main() {
  const argGlobs = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const usingCustom = argGlobs.length > 0;
  const globs = usingCustom ? argGlobs : DEFAULT_GLOBS;

  // 預設 glob 相對 PROJECT_ROOT；自訂 glob（CLI 參數）相對呼叫端 cwd，方便對臨時 fixture 目錄驗證。
  const files = fg.sync(globs, {
    cwd: usingCustom ? process.cwd() : PROJECT_ROOT,
    absolute: true,
    onlyFiles: true,
    ignore: IGNORE_GLOBS,
    dot: false,
  });
  files.sort();

  let scanned = 0;
  let legacyNoAds = 0;
  let legacyNoMode = 0;
  let valid = 0;
  const warnings = [];

  for (const absPath of files) {
    const sourcePath = toRelative(absPath);
    scanned++;

    let data;
    try {
      ({ data } = matter(readFileSync(absPath, 'utf-8')));
    } catch (err) {
      // frontmatter parse 失敗 → 以 warning 記錄（不 blocking；非 adsenseMode 語意，但避免靜默略過）。
      warnings.push({
        type: 'adsense-mode-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }

    const result = inspectAdsenseMode(data, sourcePath);
    if (result.kind === 'legacy-no-ads') legacyNoAds++;
    else if (result.kind === 'legacy-no-mode') legacyNoMode++;
    else if (result.kind === 'valid') valid++;
    else warnings.push(result);
  }

  // 輸出（report-only）。
  console.log(`[check-adsense-mode-metadata] scan target: ${usingCustom ? 'custom glob(s)' : 'default content globs'}`);
  for (const w of warnings) {
    console.log(`WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(
    `\nscanned ${scanned} | legacy(no ads block) ${legacyNoAds} | legacy(no adsenseMode) ${legacyNoMode} | valid ${valid} | warnings ${warnings.length}`
  );
  console.log('report-only / warning-only：不阻擋 build，exit 0');

  // 一律 exit 0（warning-only / 非 blocking）。
  process.exit(0);
}

main();
