#!/usr/bin/env node
// Phase 20260707-campaign-industry-metadata-guard：frontmatter `industry` 值域守門
//   （report-only / warning-only / additive；standalone，不動 validate-content.js / build / package）。
//
// 背景 / 決策來源：
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §A（landing-page /
//     campaign-page 與 article 分開建模；`industry` 概念示意用來標示同一 topic 之下
//     旅遊推廣頁 vs 一般旅遊文章之區隔；本 guard 只鎖初始值域，不新增 required 條件、
//     不跨 contentType 交叉推斷、不做 purpose 與 industry 的 cross-field check）
//   - src/scripts/check-campaign-purpose-metadata.js（同輪期姊妹 guard；enum-only 慣例對齊）
//   - src/scripts/check-content-type-metadata.js（同型 standalone guard 之樣板；
//     `contentType` 值域 = article / landing-page / campaign-page，本 guard 沿用其
//     landing-page / campaign-page 判斷作為 candidate scope）
//
// 目的：建立「未來若 frontmatter 出現 `industry`，可被檢查」之最小保護。
//   - 本輪不導入 industry-page renderer / EJS block / GA4 tracker / UTM 規則、
//     不改正式 content / template / schema / build script、不新增 industry registry JSON。
//   - 現有 production 文章皆無 `industry` → legacy 全部靜默 → 0 warning。
//
// 為何獨立 script（而非改 validate-content.js）：
//   - validate-content.js 為 build-coupled 中央 validator；於其加規則須連動改 SP-2 in-memory
//     harness 與 validation-fixtures，會位移 documented validate:content 0/135/107 baseline。
//     獨立 report-only script = 零 baseline blast radius。
//
// 行為（per decision §A + task §3）：
//   - 缺 `industry` 且 `contentType` ∉ { landing-page, campaign-page }：
//       legacy（no industry），不報 error、不報 warning。（一般 article 通常不含此欄位）
//   - 缺 `industry` 且 `contentType` ∈ { landing-page, campaign-page }：
//       missing-candidate，僅計數（silent），不報 error、不報 warning。
//       （candidate 未來可能被要求標示 industry，但本輪只做欄位存在性回報，不強制）
//   - `industry` ∈ 允許值域（初始 = { travel }，exact match、case-sensitive）：valid。
//   - `industry` 為 string 但不在允許值域：warning（industry-invalid-value）。
//   - `industry` 型別不是 string：warning（industry-invalid-type）。
//   - 不自動修正 / 不自動補欄位 / 不用 category / tags / campaignPurpose / UTM /
//     GA4 / Blogger / GitHub metadata 交叉推斷 / 不猜 Blogger URL / postId / publishedAt。
//   - 不讀寫 settings JSON、不修改任何正式 content。
//   - 不做 purpose × industry cross-field check（該類跨欄位語意屬未來 phase）。
//   - 允許值域無 registry JSON；沿用 hardcoded 最小集合 { travel }（decision §A 示例值）。
//     categories.json 為「內容分類」（tech-note / book-review / …），與 industry
//     為兩個不同維度，本 guard 不 fallback 到 categories.json 以免造成 schema 誤讀。
//
// 掃描範圍（per decision §A；沿用 campaign-purpose guard 之 content globs）：
//   - content/github/posts/**/*.md
//   - content/blogger/posts/**/*.md
//   - content/github/pages/**/*.md
//   - content/blogger/pages/**/*.md
//   排除 *.fb.md sidecar（既有姊妹 guard 慣例；本 guard 不消費 sidecar frontmatter）。
//   不掃 deploy clone、不掃 content/settings、不掃 validation-fixtures（避免擾動既有 baseline）。
//
// 可選 CLI 參數：傳入一或多個 file / glob，改掃指定目標（供臨時 fixture 驗證用，不需在 repo 新增 fixture）。
//   例：node src/scripts/check-campaign-industry-metadata.js /tmp/_ci-fixtures/**/*.md
//
// 執行：node src/scripts/check-campaign-industry-metadata.js
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

// industry 初始允許值域（per decision §A 示例）。exact match，case-sensitive。
// 本 guard 不引入 industry registry JSON；未來若引入請以 registry 取代此常數。
const VALID_INDUSTRY = new Set([
  'travel',
]);

// candidate 判斷所用 contentType 值域（per decision §A：article / landing-page / campaign-page）。
// 沿用 check-content-type-metadata.js 之 landing-page / campaign-page 二值，
// 作為「應該考慮 industry 標示」之對象範圍。article 不列入 candidate（本輪不強制其標示 industry）。
const CANDIDATE_CONTENT_TYPES = new Set([
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

function describeType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

// 檢查單一 frontmatter 之 industry；回傳分類結果。
// candidate 判斷來自同 frontmatter 之 contentType，僅用於報告 missing bucket 分流，
// 不對 industry 值本身進行 cross-field 推論（例：不因 contentType 決定合法值域）。
function inspectIndustry(data, sourcePath) {
  const ct = data.contentType;
  const isCandidate = typeof ct === 'string' && CANDIDATE_CONTENT_TYPES.has(ct);
  const ind = data.industry;

  // 缺 industry → 依 candidate 分流：
  //   - candidate（landing-page / campaign-page）→ missing-candidate（計數、不報 warning）
  //   - 非 candidate → legacy（不計數、不報 warning）
  if (ind === undefined) {
    return isCandidate ? { kind: 'missing-candidate', isCandidate } : { kind: 'legacy', isCandidate };
  }

  // 型別非 string → warning（不論 candidate 與否）。
  if (typeof ind !== 'string') {
    return {
      kind: 'warning',
      type: 'industry-invalid-type',
      sourcePath,
      value: `industry typeof=${describeType(ind)} (must be string, allowed: ${[...VALID_INDUSTRY].join('/')})`,
      isCandidate,
    };
  }

  // string 但不在允許值域 → warning（不論 candidate 與否）。
  if (!VALID_INDUSTRY.has(ind)) {
    return {
      kind: 'warning',
      type: 'industry-invalid-value',
      sourcePath,
      value: `industry="${ind}" (allowed: ${[...VALID_INDUSTRY].join('/')})`,
      isCandidate,
    };
  }

  // 合法值 → PASS。
  return { kind: 'valid', value: ind, isCandidate };
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
  let candidates = 0;
  let valid = 0;
  let missingCandidate = 0;
  const warnings = [];

  for (const absPath of files) {
    const sourcePath = toRelative(absPath);
    scanned++;

    let data;
    try {
      ({ data } = matter(readFileSync(absPath, 'utf-8')));
    } catch (err) {
      // frontmatter parse 失敗 → 以 warning 記錄（不 blocking；非 industry 語意，但避免靜默略過）。
      warnings.push({
        type: 'industry-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }

    const result = inspectIndustry(data, sourcePath);
    if (result.isCandidate) candidates++;

    if (result.kind === 'valid') valid++;
    else if (result.kind === 'missing-candidate') missingCandidate++;
    else if (result.kind === 'warning') warnings.push(result);
    // 'legacy' 不計入任何 bucket（silent）。
  }

  // 輸出（report-only）。
  console.log(`[check-campaign-industry-metadata] scan target: ${usingCustom ? 'custom glob(s)' : 'default content globs'}`);
  for (const w of warnings) {
    console.log(`WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(
    `\nscanned ${scanned} | candidates(landing-page/campaign-page) ${candidates} | valid ${valid} | missing(candidate) ${missingCandidate} | warnings ${warnings.length}`
  );
  console.log('report-only / warning-only：不阻擋 build，exit 0');

  // 一律 exit 0（warning-only / 非 blocking）。
  process.exit(0);
}

main();
