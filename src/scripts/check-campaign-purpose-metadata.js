#!/usr/bin/env node
// Phase 20260707-campaign-purpose-metadata-guard：frontmatter `campaignPurpose` 值域守門
//   （report-only / warning-only / additive；standalone，不動 validate-content.js / build / package）。
//
// 背景 / 決策來源：
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §A（landing-page /
//     campaign-page 與 article 分開建模；`campaignPurpose` 概念示意值域：
//     partner-promotion / tour-fill / lead-generation；本 guard 只鎖初始值域，
//     不新增 required 條件、不跨 contentType 交叉推斷、不新增 industry 欄位限制）
//   - src/scripts/check-content-type-metadata.js（同型 standalone guard 之樣板）
//   - src/scripts/check-adsense-mode-metadata.js（同輪期姊妹 guard；enum-only 慣例對齊）
//
// 目的：建立「未來若 frontmatter 出現 `campaignPurpose`，可被檢查」之最小保護。
//   - 本輪不導入 campaign-page renderer / EJS block / GA4 tracker / UTM 規則、
//     不改正式 content / template / schema / build script、不動 ads.config.json。
//   - 現有 production 文章皆無 `campaignPurpose` → 全部視為 legacy → 0 warning。
//
// 為何獨立 script（而非改 validate-content.js）：
//   - validate-content.js 為 build-coupled 中央 validator；於其加規則須連動改 SP-2 in-memory
//     harness 與 validation-fixtures，會位移 documented validate:content 0/135/107 baseline。
//     獨立 report-only script = 零 baseline blast radius。
//
// 行為（per decision §A + task §3）：
//   - 缺 `campaignPurpose`：legacy（no campaign purpose），不報 error、不報 warning。
//     （article 通常不含此欄位；landing-page / campaign-page 可選配、不強制）
//   - `campaignPurpose` ∈ { partner-promotion, tour-fill, lead-generation }
//     （exact match、case-sensitive）：valid。
//   - `campaignPurpose` 為 string 但不在允許值域：warning（campaign-purpose-invalid-value）。
//   - `campaignPurpose` 型別不是 string：warning（campaign-purpose-invalid-type）。
//   - 不自動修正 / 不自動補欄位 / 不用 contentType / contentKind / category / tags / UTM /
//     GA4 / Blogger / GitHub metadata 交叉推斷 / 不猜 Blogger URL / postId / publishedAt。
//   - 不讀寫 settings JSON、不修改任何正式 content。
//   - 不對 contentType 做 cross-field 檢查（例如「article + campaignPurpose 是否合理」）；
//     此類跨欄位語意屬未來 phase，本 guard 只做單欄位值域檢查。
//
// 掃描範圍（per decision §A；standalone → 明列 4 個 content 目錄）：
//   - content/github/posts/**/*.md
//   - content/blogger/posts/**/*.md
//   - content/github/pages/**/*.md
//   - content/blogger/pages/**/*.md
//   排除 *.fb.md sidecar（既有姊妹 guard 慣例；本 guard 不消費 sidecar frontmatter）。
//   不掃 deploy clone、不掃 content/settings、不掃 validation-fixtures（避免擾動既有 baseline）。
//
// 可選 CLI 參數：傳入一或多個 file / glob，改掃指定目標（供臨時 fixture 驗證用，不需在 repo 新增 fixture）。
//   例：node src/scripts/check-campaign-purpose-metadata.js /tmp/_cp-fixtures/**/*.md
//
// 執行：node src/scripts/check-campaign-purpose-metadata.js
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

// campaignPurpose 初始允許值域（per decision §A）。exact match，case-sensitive。
const VALID_CAMPAIGN_PURPOSE = new Set([
  'partner-promotion',
  'tour-fill',
  'lead-generation',
]);

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

// 檢查單一 frontmatter 之 campaignPurpose；回傳分類結果。
function inspectCampaignPurpose(data, sourcePath) {
  const cp = data.campaignPurpose;

  // 缺 campaignPurpose → legacy（per decision §A）：不報。
  if (cp === undefined) return { kind: 'legacy' };

  // 型別非 string → warning。
  if (typeof cp !== 'string') {
    return {
      kind: 'warning',
      type: 'campaign-purpose-invalid-type',
      sourcePath,
      value: `campaignPurpose typeof=${describeType(cp)} (must be string: partner-promotion/tour-fill/lead-generation)`,
    };
  }

  // string 但不在允許值域 → warning。
  if (!VALID_CAMPAIGN_PURPOSE.has(cp)) {
    return {
      kind: 'warning',
      type: 'campaign-purpose-invalid-value',
      sourcePath,
      value: `campaignPurpose="${cp}" (must be partner-promotion/tour-fill/lead-generation)`,
    };
  }

  // 合法值 → PASS。
  return { kind: 'valid', value: cp };
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
  let legacy = 0;
  let valid = 0;
  const warnings = [];

  for (const absPath of files) {
    const sourcePath = toRelative(absPath);
    scanned++;

    let data;
    try {
      ({ data } = matter(readFileSync(absPath, 'utf-8')));
    } catch (err) {
      // frontmatter parse 失敗 → 以 warning 記錄（不 blocking；非 campaignPurpose 語意，但避免靜默略過）。
      warnings.push({
        type: 'campaign-purpose-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }

    const result = inspectCampaignPurpose(data, sourcePath);
    if (result.kind === 'legacy') legacy++;
    else if (result.kind === 'valid') valid++;
    else warnings.push(result);
  }

  // 輸出（report-only）。
  console.log(`[check-campaign-purpose-metadata] scan target: ${usingCustom ? 'custom glob(s)' : 'default content globs'}`);
  for (const w of warnings) {
    console.log(`WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(
    `\nscanned ${scanned} | legacy(no campaignPurpose) ${legacy} | valid ${valid} | warnings ${warnings.length}`
  );
  console.log('report-only / warning-only：不阻擋 build，exit 0');

  // 一律 exit 0（warning-only / 非 blocking）。
  process.exit(0);
}

main();
