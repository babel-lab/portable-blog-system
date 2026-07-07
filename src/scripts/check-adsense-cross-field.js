#!/usr/bin/env node
// Phase 20260707-adsense-metadata-cross-field-guard：AdSense metadata「內部一致性」最小守門
//   （report-only / warning-only / additive；standalone，不動 validate-content.js / build /
//   package 語意；**不**混入 check:metadata-guards umbrella）。
//
// 這是本專案第三個 cross-field metadata guard；只涵蓋 AdSense metadata（adsenseMode +
//   adsenseSlots）自身欄位的內部一致性，不碰 custom promo、不碰 content type、不碰 campaign
//   purpose / industry、不碰 EJS template 檔案存在性、不碰廣告素材 URL、不碰 Blogger metadata。
//
// 與姊妹 guards 之分工：
//   - check-adsense-mode-metadata.js（single-field）：只做 ads.adsenseMode 值域（full/limited/off）
//     與型別守門。本 guard **不重複做值域 fail**，僅在需判定「啟用 / 關閉」時參考 mode 值。
//   - check-custom-promo-cross-field.js（cross-field）：檢查 ads.customPromoBlocks 內部一致性。
//     本 guard **不碰** customPromoBlocks（那是自有推廣覆蓋層，屬另一個 guard）。
//   - 本 guard（cross-field / 內部一致性）：檢查同一篇文章內 AdSense 版位 metadata 之間 / 之內是否
//     「互相矛盾或不完整」——
//       * adsenseMode 與 adsenseSlots 是否搭配矛盾（啟用卻空 array / 關閉卻配置 slots）。
//       * adsenseSlots 型別 / 空 array / slot 非 object / enabled 型別。
//       * 啟用中的 slot 缺可辨識 identifier。
//       * 同一篇文章內 slot identifier 重複。
//       * mode=full（依決策 §D 明示「使用完整六個 slots」）但 slot 數量不是 6。
//   三者刻意分開，本 guard 不 refactor / 不取代姊妹 guard，只加疊一層 cross-field 回報。
//
// 背景 / 決策來源：
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §B（base six AdSense slots：
//     預設頁面有六個 AdSense block，跨 content type 通用；不等於 custom promo block）
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §C（AdSense metadata 概念模型：
//     ads.adsenseMode / ads.adsenseSlots: [ { slotId, placement, enabled } ]；custom promo 另分層）
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §D（adsenseMode：
//     full=完整六個 slots / limited=部分 slots / off=完全關閉，只留 campaign CTA）
//   - src/scripts/check-adsense-mode-metadata.js（欄位命名 / 掃描 globs / 輸出風格對齊）
//   - src/scripts/check-custom-promo-cross-field.js（cross-field guard 樣板 / report-only 慣例）
//
// 核心原則（per task §2 / §5）：
//   - 文章與頁面預設都有基本 AdSense 版位；頁面預設規格是六個 AdSense block（§B）。
//   - 既有 legacy content 沒有明確 AdSense metadata 時**不可 fail、不要求回填** → 歸類 legacy、0 warning。
//   - 本 guard 只檢查 AdSense metadata 內部一致性；不檢查 custom promo、不檢查 campaign
//     industry / purpose、不檢查 content type 是否允許 AdSense、不改渲染 / EJS / CSS / 廣告版位。
//
// 為何獨立 script（而非改 validate-content.js / umbrella）：
//   - validate-content.js 為 build-coupled 中央 validator；於其加規則會位移 documented
//     validate:content 0/135/107 baseline。獨立 report-only script = 零 baseline blast radius。
//   - 本輪刻意**不**混入 check:metadata-guards umbrella；cross-field guard 維持獨立存在。
//
// 內部一致性規則（per task §5；沿用 check-adsense-mode-metadata 之欄位命名）：
//   1. 缺 ads block、ads 非 object、或同時無 adsenseMode 且無 adsenseSlots
//        → legacy（no AdSense metadata），不報。
//      （註：ads 存在但非 object 之型別問題由 single-field guard 負責；本 guard 不重複報，
//        僅視為「無可用 AdSense metadata」→ legacy。）
//   2. adsenseSlots 存在但不是 array
//        → warning（adsense-crossfield-slots-invalid-type）；無法逐 slot 檢查，不 fail。
//   3. mode 與 slots 搭配一致性（mode 為可辨識 string 時才判斷；值域交給 single-field guard）：
//        - mode ∈ {full, limited}（啟用）但 adsenseSlots 為空 array
//            → warning（adsense-crossfield-mode-empty-slots）：啟用廣告卻宣告零 slot。
//        - mode === off（關閉）但 adsenseSlots 為非空 array
//            → warning（adsense-crossfield-disabled-mode-slots）：關閉廣告卻仍配置 slot。
//        - mode 啟用但 adsenseSlots 欄位「整個缺席」→ **不報**（視為使用預設六 slot，§B）。
//   4. adsenseSlots 為非空 array 時，逐 slot：
//        - slot 非 object → warning（adsense-crossfield-slot-invalid-type）。
//        - slot 之 enabled 欄位存在但非 boolean → warning（adsense-crossfield-enabled-invalid-type）。
//        - slot enabled === false → disabled，計入 disabled count，不要求 identifier。
//        - 啟用中（無 enabled 視為預設啟用，或 enabled === true）之 slot 缺可辨識 identifier
//            （slotId / id / slot / name / placement 任一非空 string 皆可）
//            → warning（adsense-crossfield-missing-identifier）。
//        - 同一篇文章內 slot identifier（非空 string）重複
//            → warning（adsense-crossfield-duplicate-identifier）。
//        - 若 mode === full（§D 明示「使用完整六個 slots」）但啟用中 slot 數量不是 6
//            → warning（adsense-crossfield-six-block-count）。
//   - complete / usable：candidate 該檔 0 warning。
//   - 不檢查 EJS template 檔是否存在、不檢查廣告素材 URL、不檢查 content type、不檢查 custom promo、
//     不檢查 campaign purpose / industry。
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
//   例：node src/scripts/check-adsense-cross-field.js /tmp/_ax-fixtures/**/*.md
//
// 執行：node src/scripts/check-adsense-cross-field.js
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

// adsenseMode 語意（沿用 check-adsense-mode-metadata / 決策 §D）：full/limited=啟用、off=關閉。
// 本 guard 不做值域 fail，只在 mode 為此三值時用於一致性判斷；其它值視為「無法辨識啟用狀態」→ 略過搭配判斷。
const MODE_ENABLED = new Set(['full', 'limited']);
const MODE_OFF = 'off';
const MODE_FULL = 'full'; // §D：full 明示使用完整六個 slots
const EXPECTED_FULL_SLOT_COUNT = 6; // §B：預設頁面六個 AdSense block

// slot identifier 候選欄位（任一非空 string 即視為可辨識）。slotId 為決策 §C 主欄位，其餘為容錯。
const IDENTIFIER_FIELDS = ['slotId', 'id', 'slot', 'name', 'placement'];

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

// 取 slot 的可辨識 identifier（第一個非空 string 候選欄位）；無則回 null。
function pickIdentifier(slot) {
  for (const f of IDENTIFIER_FIELDS) {
    if (isNonEmptyString(slot[f])) return slot[f].trim();
  }
  return null;
}

// 檢查單一 frontmatter 之 AdSense metadata 內部一致性；回傳 { kind, complete, disabled, warnings[] }。
//   kind：'legacy' | 'candidate'
//   complete：candidate 且該檔 0 warning
//   disabled：本檔 enabled === false 之 slot 數
function inspectAdsenseCrossField(data, sourcePath) {
  const ads = data.ads;
  const warnings = [];

  // 缺 ads、或 ads 非 object → 無可用 AdSense metadata（型別問題交給 single-field guard）→ legacy。
  if (!isPlainObject(ads)) {
    return { kind: 'legacy', complete: false, disabled: 0, warnings };
  }

  const mode = ads.adsenseMode;
  const slots = ads.adsenseSlots;
  const modePresent = mode !== undefined;
  const slotsPresent = slots !== undefined;

  // 同時無 adsenseMode 且無 adsenseSlots → legacy（no AdSense metadata），不報。
  if (!modePresent && !slotsPresent) {
    return { kind: 'legacy', complete: false, disabled: 0, warnings };
  }

  // 以下為 candidate（有明確 AdSense metadata）。
  const modeStr = typeof mode === 'string' ? mode : null;
  const modeEnabled = modeStr !== null && MODE_ENABLED.has(modeStr);
  const modeOff = modeStr === MODE_OFF;

  // adsenseSlots 存在但非 array → 無法逐 slot 檢查一致性。
  if (slotsPresent && !Array.isArray(slots)) {
    warnings.push({
      type: 'adsense-crossfield-slots-invalid-type',
      sourcePath,
      value: `ads.adsenseSlots typeof=${describeType(slots)} (must be array)`,
    });
    return { kind: 'candidate', complete: false, disabled: 0, warnings };
  }

  const slotsIsArray = Array.isArray(slots);
  const slotsEmpty = slotsIsArray && slots.length === 0;

  // mode 與 slots 搭配一致性（slots 欄位整個缺席 → 視為預設六 slot，不報）。
  if (slotsEmpty && modeEnabled) {
    warnings.push({
      type: 'adsense-crossfield-mode-empty-slots',
      sourcePath,
      value: `ads.adsenseMode="${modeStr}" (enabled) but ads.adsenseSlots is an empty array`,
    });
  }
  if (slotsIsArray && slots.length > 0 && modeOff) {
    warnings.push({
      type: 'adsense-crossfield-disabled-mode-slots',
      sourcePath,
      value: `ads.adsenseMode="off" (disabled) but ads.adsenseSlots has ${slots.length} slot(s)`,
    });
  }

  let disabled = 0;
  let enabledCount = 0;
  const seenIds = new Map(); // identifier -> first index（重複偵測）

  if (slotsIsArray && slots.length > 0) {
    slots.forEach((slot, i) => {
      if (!isPlainObject(slot)) {
        warnings.push({
          type: 'adsense-crossfield-slot-invalid-type',
          sourcePath,
          value: `ads.adsenseSlots[${i}] typeof=${describeType(slot)} (must be object)`,
        });
        return;
      }

      // enabled 欄位：存在但非 boolean → 無法判定啟用狀態（一致性問題）。
      let isDisabled = false;
      if (slot.enabled !== undefined) {
        if (typeof slot.enabled !== 'boolean') {
          warnings.push({
            type: 'adsense-crossfield-enabled-invalid-type',
            sourcePath,
            value: `ads.adsenseSlots[${i}].enabled typeof=${describeType(slot.enabled)} (must be boolean)`,
          });
        } else if (slot.enabled === false) {
          isDisabled = true;
          disabled++;
        }
      }

      const id = pickIdentifier(slot);

      // identifier：啟用中的 slot 需有可辨識 identifier；disabled slot 不要求。
      if (!isDisabled) {
        enabledCount++;
        if (id === null) {
          warnings.push({
            type: 'adsense-crossfield-missing-identifier',
            sourcePath,
            value: `ads.adsenseSlots[${i}] enabled slot missing usable identifier (${IDENTIFIER_FIELDS.join('/')})`,
          });
        }
      }

      // 重複 identifier 偵測（對可用 string identifier；含 disabled，仍屬同一篇內識別碼衝突）。
      if (id !== null) {
        if (seenIds.has(id)) {
          warnings.push({
            type: 'adsense-crossfield-duplicate-identifier',
            sourcePath,
            value: `ads.adsenseSlots[${i}] identifier="${id}" duplicates slot[${seenIds.get(id)}]`,
          });
        } else {
          seenIds.set(id, i);
        }
      }
    });

    // 六-block 一致性：mode=full 明示完整六 slots，但啟用中 slot 數量不是 6 → warning。
    if (modeStr === MODE_FULL && enabledCount !== EXPECTED_FULL_SLOT_COUNT) {
      warnings.push({
        type: 'adsense-crossfield-six-block-count',
        sourcePath,
        value: `ads.adsenseMode="full" expects ${EXPECTED_FULL_SLOT_COUNT} enabled slots but found ${enabledCount}`,
      });
    }
  }

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
  let disabledModeSlotsWarnings = 0;
  let modeEmptySlotsWarnings = 0;
  let invalidBlockWarnings = 0; // slots-invalid-type + slot-invalid-type + enabled-invalid-type
  let missingIdentifierWarnings = 0;
  let duplicateIdentifierWarnings = 0;
  let sixBlockWarnings = 0;
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
        type: 'adsense-crossfield-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }

    const result = inspectAdsenseCrossField(data, sourcePath);

    if (result.kind === 'legacy') {
      legacy++;
      continue;
    }

    // candidate（有明確 AdSense metadata）。
    candidates++;
    if (result.complete) complete++;
    disabledBlocks += result.disabled;

    for (const w of result.warnings) {
      warnings.push(w);
      if (w.type === 'adsense-crossfield-disabled-mode-slots') disabledModeSlotsWarnings++;
      else if (w.type === 'adsense-crossfield-mode-empty-slots') modeEmptySlotsWarnings++;
      else if (
        w.type === 'adsense-crossfield-slots-invalid-type' ||
        w.type === 'adsense-crossfield-slot-invalid-type' ||
        w.type === 'adsense-crossfield-enabled-invalid-type'
      ) {
        invalidBlockWarnings++;
      } else if (w.type === 'adsense-crossfield-missing-identifier') {
        missingIdentifierWarnings++;
      } else if (w.type === 'adsense-crossfield-duplicate-identifier') {
        duplicateIdentifierWarnings++;
      } else if (w.type === 'adsense-crossfield-six-block-count') {
        sixBlockWarnings++;
      }
    }
  }

  // 輸出（report-only）。
  console.log(
    `[check-adsense-cross-field] scan target: ${
      usingCustom ? 'custom glob(s)' : 'default content globs'
    }`
  );
  for (const w of warnings) {
    console.log(`WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(
    `\nscanned ${scanned} | legacy(no AdSense metadata) ${legacy} | AdSense candidates ${candidates} | complete/usable ${complete}`
  );
  console.log(
    `disabled mode with slots ${disabledModeSlotsWarnings} | mode with empty slots ${modeEmptySlotsWarnings} | invalid slots/type ${invalidBlockWarnings} | missing identifier ${missingIdentifierWarnings} | duplicate identifier ${duplicateIdentifierWarnings} | six-block count ${sixBlockWarnings} | disabled slots ${disabledBlocks} | total warnings ${warnings.length}`
  );
  console.log('report-only / warning-only：不阻擋 build，exit 0');

  // 一律 exit 0（warning-only / 非 blocking）。
  process.exit(0);
}

main();
