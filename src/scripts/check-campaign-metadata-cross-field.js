#!/usr/bin/env node
// Phase 20260707-campaign-metadata-cross-field-guard：campaign 類 frontmatter 欄位「跨欄位一致性」
//   最小守門（report-only / warning-only / additive；standalone，不動 validate-content.js /
//   build / package 語意；不混入 check:metadata-guards umbrella）。
//
// 這是本專案第一個 cross-field metadata guard；只涵蓋 campaign / landing / promotion 相關欄位，
//   不碰 AdSense mode、不碰 custom promo、不碰 EJS template / Blogger metadata。
//
// 背景 / 決策來源：
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §A（landing-page /
//     campaign-page 與 article 分開建模；campaignPurpose / industry 為 campaign 頁之選配標示）
//   - src/scripts/check-content-type-metadata.js（contentType 值域 = article / landing-page /
//     campaign-page；本 guard 沿用 landing-page / campaign-page 作為 "campaign-like" 判斷）
//   - src/scripts/check-campaign-purpose-metadata.js（campaignPurpose 單欄位值域 guard）
//   - src/scripts/check-campaign-industry-metadata.js（industry 單欄位值域 guard；
//     其 candidate 判斷 = contentType ∈ {landing-page, campaign-page}，本 guard 沿用相同值域）
//
// 目的：建立「若 campaign 類欄位已明確出現，跨欄位是否搭配一致」之最小回報。
//   - 現有 production 文章皆無 contentType / campaignPurpose / industry → 全部視為 legacy → 0 warning。
//   - 本 guard 不新增 required 條件、不改 content / template / schema / build，不猜任何 metadata。
//
// 為何獨立 script（而非改 validate-content.js / umbrella）：
//   - validate-content.js 為 build-coupled 中央 validator；於其加規則會位移 documented
//     validate:content 0/135/107 baseline。獨立 report-only script = 零 baseline blast radius。
//   - 本輪刻意不混入 check:metadata-guards umbrella；cross-field guard 先獨立存在。
//
// 跨欄位規則（per task §4；只做「存在性 + campaign-like 與否」，不重驗單欄位值域）：
//   欄位定義：
//     - campaign-like contentType = contentType ∈ { landing-page, campaign-page }
//     - campaignPurpose「明確存在」= frontmatter 有 campaignPurpose 且 !== undefined
//     - industry「明確存在」= frontmatter 有 industry 且 !== undefined
//   分類與 warning：
//     1. contentType 是 campaign-like：
//        - campaignPurpose 缺 → warning（campaign-crossfield-missing-purpose）
//        - industry 缺 → warning（campaign-crossfield-missing-industry）
//        - 兩者皆備 → cross-field complete（計數）
//     2. contentType 非 campaign-like，但 campaignPurpose 或 industry 任一存在：
//        - contentType 缺 → warning（campaign-crossfield-content-type-missing）
//        - contentType 存在但非 campaign-like（如 article / 非法值）
//          → warning（campaign-crossfield-content-type-mismatch）
//     3. 三者皆不存在 → legacy（no campaign metadata），不報 warning。
//
// 不做（per task §4 紅線）：
//   - 不檢查 campaignPurpose / industry 之值是否合法（單欄位 guard 已做）。
//   - 不檢查 custom promo 是否存在、不檢查 AdSense mode、不檢查 EJS template、不檢查 Blogger metadata。
//   - 不用 category / tags / UTM / GA4 / Blogger / GitHub metadata 交叉推斷。
//   - 不猜 Blogger URL / postId / publishedAt、不自動修正 / 不自動補欄位、不改 content。
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
//   例：node src/scripts/check-campaign-metadata-cross-field.js /tmp/_cx-fixtures/**/*.md
//
// 執行：node src/scripts/check-campaign-metadata-cross-field.js
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

// campaign-like contentType 值域（沿用 check-content-type-metadata.js 之 landing-page /
// campaign-page；article 與非法值皆非 campaign-like）。
const CAMPAIGN_LIKE_CONTENT_TYPES = new Set([
  'landing-page',
  'campaign-page',
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

function describeContentType(ct) {
  if (ct === undefined) return 'contentType absent';
  if (typeof ct !== 'string') {
    const t = ct === null ? 'null' : Array.isArray(ct) ? 'array' : typeof ct;
    return `contentType typeof=${t}`;
  }
  return `contentType="${ct}"`;
}

// 檢查單一 frontmatter 之 campaign 類欄位跨欄位一致性；回傳 { kind, warnings[] }。
//   kind：'legacy' | 'candidate' | 'campaign-signal-non-campaign-like'
//   warnings：本檔案觸發之 cross-field warning 陣列（可能多筆）。
function inspectCrossField(data, sourcePath) {
  const ct = data.contentType;
  const ctIsCampaignLike =
    typeof ct === 'string' && CAMPAIGN_LIKE_CONTENT_TYPES.has(ct);
  const ctPresent = ct !== undefined;
  const purposePresent = data.campaignPurpose !== undefined;
  const industryPresent = data.industry !== undefined;

  const warnings = [];

  // Case 1：contentType 是 campaign-like → 期待 campaignPurpose + industry 皆備。
  if (ctIsCampaignLike) {
    if (!purposePresent) {
      warnings.push({
        type: 'campaign-crossfield-missing-purpose',
        sourcePath,
        value: `${describeContentType(ct)} but campaignPurpose absent`,
      });
    }
    if (!industryPresent) {
      warnings.push({
        type: 'campaign-crossfield-missing-industry',
        sourcePath,
        value: `${describeContentType(ct)} but industry absent`,
      });
    }
    const complete = purposePresent && industryPresent;
    return { kind: 'candidate', complete, warnings };
  }

  // Case 2：contentType 非 campaign-like，但 campaignPurpose / industry 任一存在。
  if (purposePresent || industryPresent) {
    const present = [
      purposePresent ? 'campaignPurpose' : null,
      industryPresent ? 'industry' : null,
    ]
      .filter(Boolean)
      .join('+');

    if (!ctPresent) {
      warnings.push({
        type: 'campaign-crossfield-content-type-missing',
        sourcePath,
        value: `${present} present but contentType absent (expected landing-page/campaign-page)`,
      });
    } else {
      warnings.push({
        type: 'campaign-crossfield-content-type-mismatch',
        sourcePath,
        value: `${present} present but ${describeContentType(
          ct
        )} is not campaign-like (expected landing-page/campaign-page)`,
      });
    }
    return { kind: 'campaign-signal-non-campaign-like', warnings };
  }

  // Case 3：三者皆不存在 → legacy（no campaign metadata）。
  return { kind: 'legacy', warnings };
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
  let missingPurpose = 0;
  let missingIndustry = 0;
  let contentTypeMismatch = 0; // 含 content-type-missing 與 content-type-mismatch 兩型
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
        type: 'campaign-crossfield-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }

    const result = inspectCrossField(data, sourcePath);

    if (result.kind === 'legacy') {
      legacy++;
    } else if (result.kind === 'candidate') {
      candidates++;
      if (result.complete) complete++;
    }
    // 'campaign-signal-non-campaign-like' 不計入 legacy / candidate（僅其 warning 計數）。

    for (const w of result.warnings) {
      warnings.push(w);
      if (w.type === 'campaign-crossfield-missing-purpose') missingPurpose++;
      else if (w.type === 'campaign-crossfield-missing-industry') missingIndustry++;
      else if (
        w.type === 'campaign-crossfield-content-type-missing' ||
        w.type === 'campaign-crossfield-content-type-mismatch'
      ) {
        contentTypeMismatch++;
      }
    }
  }

  // 輸出（report-only）。
  console.log(
    `[check-campaign-metadata-cross-field] scan target: ${
      usingCustom ? 'custom glob(s)' : 'default content globs'
    }`
  );
  for (const w of warnings) {
    console.log(`WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(
    `\nscanned ${scanned} | legacy(no campaign metadata) ${legacy} | campaign-like candidates ${candidates} | cross-field complete ${complete}`
  );
  console.log(
    `missing purpose ${missingPurpose} | missing industry ${missingIndustry} | content type mismatch ${contentTypeMismatch} | total warnings ${warnings.length}`
  );
  console.log('report-only / warning-only：不阻擋 build，exit 0');

  // 一律 exit 0（warning-only / 非 blocking）。
  process.exit(0);
}

main();
