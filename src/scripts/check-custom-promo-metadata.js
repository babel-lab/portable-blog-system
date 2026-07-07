#!/usr/bin/env node
// Phase 20260707-custom-promo-metadata-guard：frontmatter `ads.customPromoBlocks` 型別守門
//   （report-only / warning-only / additive；standalone，不動 validate-content.js / build / package）。
//
// 背景 / 決策來源：
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §B / §C
//     （base six AdSense slots ≠ custom / self-owned promo EJS blocks，是兩個不同層；
//      custom promo blocks 不是每頁必加、不限 landing/campaign page、一般 article 亦可選配、
//      為 optional overlay，不取代 base slots。§C conceptual model：
//        ads:
//          adsenseMode: full | limited | off
//          customPromoBlocks:
//            - blockId / template / campaignId / placement / enabled
//      —— 概念示意、非最終欄位。本 guard 只鎖最保守型別檢查，不新增 required 條件、
//      不做 content type / industry / campaign purpose / adsense mode 之間 cross-field 推論）
//   - src/scripts/check-adsense-mode-metadata.js（同 `ads` block 下欄位、同輪期姊妹 guard 之樣板）
//   - src/scripts/check-campaign-purpose-metadata.js / check-campaign-industry-metadata.js
//     （report-only / warning-only 慣例、content globs 對齊）
//
// 目的：建立「未來若 frontmatter 出現 `ads.customPromoBlocks`，可被檢查」之最小保護。
//   - 本輪不導入 custom promo renderer / EJS block / GA4 tracker / UTM 規則、
//     不改正式 content / template / schema / build script、不動 ads.config.json、不建 promo registry JSON。
//   - 現有 production 文章皆無 `ads.customPromoBlocks` → 全部視為 legacy / no custom promo → 0 warning。
//
// 為何獨立 script（而非改 validate-content.js）：
//   - validate-content.js 為 build-coupled 中央 validator；於其加規則須連動改 SP-2 in-memory
//     harness 與 validation-fixtures，會位移 documented validate:content 0/135/107 baseline。
//     獨立 report-only script = 零 baseline blast radius。
//
// 行為（per decision §B/§C + task §4）：
//   - 缺 `ads` block，或有 `ads` 但缺 `customPromoBlocks`：legacy / no custom promo，不報 error、不報 warning。
//     （custom promo 為 optional overlay；legacy content 無此欄位視為正常，一律不 fail）
//   - `ads.customPromoBlocks` 存在 → candidate；才做基本型別 / 值域檢查：
//       - `customPromoBlocks` 型別非 array → warning（custom-promo-blocks-invalid-type）。
//       - array 內每個 block 非 object（含 array / null）→ warning（custom-promo-block-invalid-type）。
//       - block 內若存在下列欄位才逐一型別檢查（只檢存在者，不強制補欄位、不跨欄位語意推論）：
//           blockId / template / campaignId / placement → 必須 string，否則 warning。
//           enabled → 必須 boolean，否則 warning。
//   - candidate 若無任何 warning → valid custom promo；有 ≥1 warning → invalid（計入 invalid 檔數）。
//   - 不自動修正 / 不自動補欄位 / 不猜 metadata / 不用 contentType / industry / campaignPurpose /
//     adsenseMode 交叉推斷 / 不猜 Blogger URL / postId / publishedAt。
//   - 不檢查 template 指向之 EJS 檔是否存在（既有姊妹 guard 無此慣例）。
//   - 不讀寫 settings JSON、不修改任何正式 content、不要求 landing/campaign/article 必須或不得有 custom promo。
//
// 掃描範圍（沿用 campaign-purpose / campaign-industry guard 之 content globs）：
//   - content/github/posts/**/*.md
//   - content/blogger/posts/**/*.md
//   - content/github/pages/**/*.md
//   - content/blogger/pages/**/*.md
//   排除 *.fb.md sidecar（既有姊妹 guard 慣例；本 guard 不消費 sidecar frontmatter）。
//   不掃 deploy clone、不掃 content/settings、不掃 validation-fixtures（避免擾動既有 baseline）。
//
// 可選 CLI 參數：傳入一或多個 file / glob，改掃指定目標（供臨時 fixture 驗證用，不需在 repo 新增 fixture）。
//   例：node src/scripts/check-custom-promo-metadata.js /tmp/_cpromo-fixtures/**/*.md
//
// 執行：node src/scripts/check-custom-promo-metadata.js
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

// block 內只做「存在才型別檢查」之欄位（per decision §C conceptual model）。
// 只檢型別、不檢值域語意、不跨欄位推論、不要求存在。
const STRING_FIELDS = ['blockId', 'template', 'campaignId', 'placement'];
const BOOLEAN_FIELDS = ['enabled'];

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

// object（非 array、非 null）判斷。
function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// 檢查單一 frontmatter 之 ads.customPromoBlocks；回傳分類結果 + 該檔之 warnings。
function inspectCustomPromo(data, sourcePath) {
  const ads = data.ads;
  const warnings = [];

  // 缺 ads block，或 ads 非 object，或無 customPromoBlocks → legacy / no custom promo（不報）。
  if (!isPlainObject(ads) || ads.customPromoBlocks === undefined) {
    return { kind: 'legacy', warnings };
  }

  // 有 customPromoBlocks → candidate。
  const blocks = ads.customPromoBlocks;

  // customPromoBlocks 型別非 array → warning（整體型別錯誤，無法逐 block 檢查）。
  if (!Array.isArray(blocks)) {
    warnings.push({
      type: 'custom-promo-blocks-invalid-type',
      sourcePath,
      value: `ads.customPromoBlocks typeof=${describeType(blocks)} (must be array)`,
    });
    return { kind: 'candidate', warnings };
  }

  // 逐 block 型別檢查（只檢存在欄位；不要求欄位存在、不跨欄位推論）。
  blocks.forEach((block, i) => {
    if (!isPlainObject(block)) {
      warnings.push({
        type: 'custom-promo-block-invalid-type',
        sourcePath,
        value: `ads.customPromoBlocks[${i}] typeof=${describeType(block)} (must be object)`,
      });
      return;
    }
    for (const f of STRING_FIELDS) {
      if (block[f] !== undefined && typeof block[f] !== 'string') {
        warnings.push({
          type: 'custom-promo-block-field-invalid-type',
          sourcePath,
          value: `ads.customPromoBlocks[${i}].${f} typeof=${describeType(block[f])} (must be string)`,
        });
      }
    }
    for (const f of BOOLEAN_FIELDS) {
      if (block[f] !== undefined && typeof block[f] !== 'boolean') {
        warnings.push({
          type: 'custom-promo-block-field-invalid-type',
          sourcePath,
          value: `ads.customPromoBlocks[${i}].${f} typeof=${describeType(block[f])} (must be boolean)`,
        });
      }
    }
  });

  return { kind: 'candidate', warnings };
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
  let candidates = 0;
  let valid = 0;
  let invalid = 0;
  const warnings = [];

  for (const absPath of files) {
    const sourcePath = toRelative(absPath);
    scanned++;

    let data;
    try {
      ({ data } = matter(readFileSync(absPath, 'utf-8')));
    } catch (err) {
      // frontmatter parse 失敗 → 以 warning 記錄（不 blocking；非 custom promo 語意，但避免靜默略過）。
      warnings.push({
        type: 'custom-promo-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }

    const result = inspectCustomPromo(data, sourcePath);
    if (result.kind === 'legacy') {
      legacy++;
      continue;
    }
    // candidate（有 ads.customPromoBlocks）。
    candidates++;
    if (result.warnings.length === 0) {
      valid++;
    } else {
      invalid++;
      warnings.push(...result.warnings);
    }
  }

  // 輸出（report-only）。
  console.log(`[check-custom-promo-metadata] scan target: ${usingCustom ? 'custom glob(s)' : 'default content globs'}`);
  for (const w of warnings) {
    console.log(`WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(
    `\nscanned ${scanned} | legacy(no custom promo) ${legacy} | candidates ${candidates} | valid ${valid} | invalid ${invalid} | warnings ${warnings.length}`
  );
  console.log('report-only / warning-only：不阻擋 build，exit 0');

  // 一律 exit 0（warning-only / 非 blocking）。
  process.exit(0);
}

main();
