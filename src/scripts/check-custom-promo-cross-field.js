#!/usr/bin/env node
// Phase 20260707-custom-promo-metadata-cross-field-guard：custom / self-owned promo block 之
//   「內部一致性」最小守門（report-only / warning-only / additive；standalone，不動
//   validate-content.js / build / package 語意；不混入 check:metadata-guards umbrella）。
//
// 這是本專案第二個 cross-field metadata guard；只涵蓋 custom promo blocks 自身欄位的
//   內部一致性，不碰 AdSense mode、不碰 content type、不碰 campaign purpose / industry、
//   不碰 EJS template 檔案存在性、不碰 Blogger metadata。
//
// 與 check:custom-promo-metadata（single-field 型別 guard）之分工：
//   - check-custom-promo-metadata.js：逐欄位「型別」守門（customPromoBlocks 是否 array、
//     block 是否 object、blockId/template/campaignId/placement 是否 string、enabled 是否 boolean）。
//   - 本 guard（cross-field / 內部一致性）：檢查同一篇文章內 custom promo blocks 之間 /
//     之內是否「互相矛盾或不完整」——
//       * customPromoBlocks 明確存在但為空 array（啟用欄位卻無任何 block）。
//       * 啟用中的 block 缺 identifier（blockId）。
//       * 同一篇文章內 block identifier（blockId）重複。
//       * block 若有 enabled 欄位但不是 boolean（無法判定啟用狀態 → 影響一致性判斷）。
//   兩者刻意分開，本 guard 不 refactor / 不取代 single-field guard，只加疊一層 cross-field 回報。
//
// 背景 / 決策來源：
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §B / §C
//     （article / landing / campaign page 皆可選配 custom promo block；custom promo 為
//      optional overlay，不限特定 content type；§C conceptual model：
//        ads.customPromoBlocks: [ { blockId, template, campaignId, placement, enabled } ]）
//   - src/scripts/check-custom-promo-metadata.js（欄位命名 / 掃描 globs / 輸出風格對齊）
//   - src/scripts/check-campaign-metadata-cross-field.js（cross-field guard 樣板 / report-only 慣例）
//
// 核心原則（per task §2）：
//   - 一般 article、landing / campaign page 皆可有 custom promo block → 本 guard 不檢查
//     content type 是否允許 custom promo，只檢查 custom promo metadata 自身是否矛盾 / 不完整。
//   - legacy content 無 custom promo metadata → 歸類 legacy，不報 warning。
//
// 為何獨立 script（而非改 validate-content.js / umbrella）：
//   - validate-content.js 為 build-coupled 中央 validator；於其加規則會位移 documented
//     validate:content 0/135/107 baseline。獨立 report-only script = 零 baseline blast radius。
//   - 本輪刻意不混入 check:metadata-guards umbrella；cross-field guard 維持獨立存在。
//
// 內部一致性規則（per task §5；沿用 check-custom-promo-metadata 之欄位命名）：
//   1. 缺 ads block，或有 ads 但缺 customPromoBlocks → legacy（no custom promo metadata），不報。
//   2. ads.customPromoBlocks 存在但不是 array →
//        warning（custom-promo-crossfield-invalid-type）；無法逐 block 檢查，不 fail。
//   3. ads.customPromoBlocks 是空 array →
//        warning（custom-promo-crossfield-empty-blocks）：明確啟用 custom promo 欄位但無任何 block。
//   4. ads.customPromoBlocks 有 block：
//        - block 非 object → warning（custom-promo-crossfield-block-invalid-type）。
//        - block 之 enabled 欄位存在但非 boolean →
//            warning（custom-promo-crossfield-enabled-invalid-type）。
//        - block enabled === false → disabled，計入 disabled count，不要求 identifier 完整。
//        - 啟用中（無 enabled 欄位視為預設啟用，或 enabled === true）之 block 缺 identifier
//            （blockId 缺 / 非 string / 空字串）→ warning（custom-promo-crossfield-missing-identifier）。
//        - 同一篇文章內 blockId（string 且非空）重複 →
//            warning（custom-promo-crossfield-duplicate-identifier）。
//   - complete / usable：candidate 之 customPromoBlocks 為非空 array 且該檔 0 warning。
//   - 不檢查 EJS template 檔是否存在、不檢查廣告素材 URL、不檢查 content type、不檢查 AdSense mode。
//   - 不自動修正 / 不自動補欄位 / 不猜 metadata / 不猜 Blogger URL / postId / publishedAt。
//
// 掃描範圍（沿用姊妹 metadata guards 之 content globs）：
//   - content/github/posts/**/*.md
//   - content/blogger/posts/**/*.md
//   - content/github/pages/**/*.md
//   - content/blogger/pages/**/*.md
//   排除 *.fb.md sidecar（既有姊妹 guard 慣例）。
//   不掃 deploy clone、不掃 content/settings、不掃 validation-fixtures（避免擾動既有 baseline）。
//
// 可選 CLI 參數：傳入一或多個 file / glob，改掃指定目標（供臨時 fixture 驗證用，不需在 repo 新增 fixture）。
//   例：node src/scripts/check-custom-promo-cross-field.js /tmp/_cpx-fixtures/**/*.md
//
// 執行：node src/scripts/check-custom-promo-cross-field.js
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

// 非空 string 判斷（identifier 用）。
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// 檢查單一 frontmatter 之 custom promo blocks 內部一致性；回傳 { kind, complete, disabled, warnings[] }。
//   kind：'legacy' | 'candidate'
//   complete：candidate 且非空 array 且 0 warning
//   disabled：本檔 enabled === false 之 block 數
function inspectCustomPromoCrossField(data, sourcePath) {
  const ads = data.ads;
  const warnings = [];

  // 缺 ads block，或 ads 非 object，或無 customPromoBlocks → legacy / no custom promo（不報）。
  if (!isPlainObject(ads) || ads.customPromoBlocks === undefined) {
    return { kind: 'legacy', complete: false, disabled: 0, warnings };
  }

  const blocks = ads.customPromoBlocks;

  // 非 array → 無法逐 block 檢查一致性。
  if (!Array.isArray(blocks)) {
    warnings.push({
      type: 'custom-promo-crossfield-invalid-type',
      sourcePath,
      value: `ads.customPromoBlocks typeof=${describeType(blocks)} (must be array)`,
    });
    return { kind: 'candidate', complete: false, disabled: 0, warnings };
  }

  // 空 array → 明確啟用 custom promo 欄位卻無任何 block（內部不完整）。
  if (blocks.length === 0) {
    warnings.push({
      type: 'custom-promo-crossfield-empty-blocks',
      sourcePath,
      value: 'ads.customPromoBlocks is an empty array (custom promo field present but no block defined)',
    });
    return { kind: 'candidate', complete: false, disabled: 0, warnings };
  }

  let disabled = 0;
  const seenIds = new Map(); // blockId -> first index（重複偵測）

  blocks.forEach((block, i) => {
    if (!isPlainObject(block)) {
      warnings.push({
        type: 'custom-promo-crossfield-block-invalid-type',
        sourcePath,
        value: `ads.customPromoBlocks[${i}] typeof=${describeType(block)} (must be object)`,
      });
      return;
    }

    // enabled 欄位：存在但非 boolean → 無法判定啟用狀態（一致性問題）。
    let isDisabled = false;
    if (block.enabled !== undefined) {
      if (typeof block.enabled !== 'boolean') {
        warnings.push({
          type: 'custom-promo-crossfield-enabled-invalid-type',
          sourcePath,
          value: `ads.customPromoBlocks[${i}].enabled typeof=${describeType(block.enabled)} (must be boolean)`,
        });
      } else if (block.enabled === false) {
        isDisabled = true;
        disabled++;
      }
    }

    // identifier（blockId）：啟用中的 block 需有可用 identifier；disabled block 不要求。
    if (!isDisabled && !isNonEmptyString(block.blockId)) {
      warnings.push({
        type: 'custom-promo-crossfield-missing-identifier',
        sourcePath,
        value: `ads.customPromoBlocks[${i}] enabled block missing usable blockId (blockId=${describeType(block.blockId)})`,
      });
    }

    // 重複 identifier 偵測（只對可用 string blockId；含 disabled，仍屬同一篇內識別碼衝突）。
    if (isNonEmptyString(block.blockId)) {
      const id = block.blockId.trim();
      if (seenIds.has(id)) {
        warnings.push({
          type: 'custom-promo-crossfield-duplicate-identifier',
          sourcePath,
          value: `ads.customPromoBlocks[${i}].blockId="${id}" duplicates block[${seenIds.get(id)}]`,
        });
      } else {
        seenIds.set(id, i);
      }
    }
  });

  const complete = warnings.length === 0;
  return { kind: 'candidate', complete, disabled, warnings };
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
  let complete = 0;
  let disabledBlocks = 0;
  let emptyBlocksWarnings = 0;
  let invalidBlockWarnings = 0; // custom-promo-crossfield-invalid-type + block-invalid-type + enabled-invalid-type
  let missingIdentifierWarnings = 0;
  let duplicateIdentifierWarnings = 0;
  const warnings = [];

  for (const absPath of files) {
    const sourcePath = toRelative(absPath);
    scanned++;

    let data;
    try {
      ({ data } = matter(readFileSync(absPath, 'utf-8')));
    } catch (err) {
      // frontmatter parse 失敗 → 以 warning 記錄（不 blocking；非 cross-field 語意，但避免靜默略過）。
      warnings.push({
        type: 'custom-promo-crossfield-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }

    const result = inspectCustomPromoCrossField(data, sourcePath);

    if (result.kind === 'legacy') {
      legacy++;
      continue;
    }

    // candidate（有 ads.customPromoBlocks）。
    candidates++;
    if (result.complete) complete++;
    disabledBlocks += result.disabled;

    for (const w of result.warnings) {
      warnings.push(w);
      if (w.type === 'custom-promo-crossfield-empty-blocks') emptyBlocksWarnings++;
      else if (
        w.type === 'custom-promo-crossfield-invalid-type' ||
        w.type === 'custom-promo-crossfield-block-invalid-type' ||
        w.type === 'custom-promo-crossfield-enabled-invalid-type'
      ) {
        invalidBlockWarnings++;
      } else if (w.type === 'custom-promo-crossfield-missing-identifier') {
        missingIdentifierWarnings++;
      } else if (w.type === 'custom-promo-crossfield-duplicate-identifier') {
        duplicateIdentifierWarnings++;
      }
    }
  }

  // 輸出（report-only）。
  console.log(
    `[check-custom-promo-cross-field] scan target: ${
      usingCustom ? 'custom glob(s)' : 'default content globs'
    }`
  );
  for (const w of warnings) {
    console.log(`WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(
    `\nscanned ${scanned} | legacy(no custom promo metadata) ${legacy} | custom promo candidates ${candidates} | complete/usable ${complete}`
  );
  console.log(
    `empty blocks ${emptyBlocksWarnings} | invalid block/type ${invalidBlockWarnings} | missing identifier ${missingIdentifierWarnings} | duplicate identifier ${duplicateIdentifierWarnings} | disabled blocks ${disabledBlocks} | total warnings ${warnings.length}`
  );
  console.log('report-only / warning-only：不阻擋 build，exit 0');

  // 一律 exit 0（warning-only / 非 blocking）。
  process.exit(0);
}

main();
