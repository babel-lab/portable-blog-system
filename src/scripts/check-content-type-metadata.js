#!/usr/bin/env node
// Phase 20260706-content-type-metadata-guard：frontmatter `contentType` 值域守門
//   （report-only / warning-only / additive；standalone，不動 validate-content.js / build / package）。
//
// 背景 / 決策來源：
//   - docs/20260706-content-type-and-content-kind-naming-spec.md（§B 決策：新增獨立 contentType；
//     §D additive / backward-compatible；§F 未來 validator 切片建議：warning-only、不碰 render / build）
//   - docs/20260706-content-ad-and-campaign-page-model-decision.md §A（contentType 初始值域）
//
// 目的：建立「未來若 frontmatter 出現 `contentType`，可被檢查」之最小保護。
//   - 本輪不導入 campaign page、不改 template、不改正式 content、不改 render。
//   - 現有 17 篇 production 文章皆無 contentType → 全部視為 legacy article → 0 warning。
//
// 為何獨立 script（而非改 validate-content.js）：
//   - validate-content.js 為 build-coupled 中央 validator；於其加規則須連動改 SP-2 in-memory
//     harness（check-page-type-validator.js）之 test baseline，且任何新增 validation-fixture .md
//     會被其 CLI（content/validation-fixtures/{github,blogger}/posts/）併入 → 位移 documented
//     validate:content 0/135/107 baseline。獨立 report-only script = 零 baseline blast radius。
//
// 行為（per spec §3.A）：
//   - 缺 contentType：視為 legacy article，不報 error、不報 warning（僅計入 legacy 統計）。
//   - contentType ∈ { article, landing-page, campaign-page }（exact match）：PASS。
//   - contentType 為 string 但不在允許值域：warning-only（content-type-invalid-value），不 blocking。
//   - contentType 型別不是 string：warning-only（content-type-invalid-type），不 blocking。
//   - 不自動修正 / 不自動補欄位 / 不猜 campaignPurpose / 不猜 Blogger URL / postId / publishedAt。
//   - contentType 為內容模型維度，與 contentKind（內容性質）獨立；本 guard 不讀 contentKind /
//     UTM / GA4 / Blogger / GitHub metadata 來推斷 content type（per spec §G red lines）。
//
// 掃描範圍（per spec §3.B；standalone → 明列 4 個 content 目錄）：
//   - content/github/posts/**/*.md
//   - content/blogger/posts/**/*.md
//   - content/github/pages/**/*.md
//   - content/blogger/pages/**/*.md
//   排除 *.fb.md sidecar（既有 parser 亦不由本 guard 消費 sidecar frontmatter）。
//   不掃 deploy clone、不掃 content/settings、不掃 validation-fixtures（避免擾動既有 baseline）。
//
// 可選 CLI 參數：傳入一或多個 file / glob，改掃指定目標（供臨時 fixture 驗證用，不需在 repo 新增 fixture）。
//   例：node src/scripts/check-content-type-metadata.js /tmp/_ct-fixtures/**/*.md
//
// 執行：node src/scripts/check-content-type-metadata.js
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

// contentType 初始允許值域（per spec §B.5 / decision §A）。exact match，case-sensitive，
//   mirror validate-content.js VALID_PAGE_TYPE 之 Set.has 慣例。
const VALID_CONTENT_TYPE = new Set(['article', 'landing-page', 'campaign-page']);

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

// 檢查單一 frontmatter 之 contentType；回傳 issue 或 null（legacy / valid → null）。
function inspectContentType(data, sourcePath) {
  const ct = data.contentType;

  // 缺 contentType → legacy article（per spec §D）：不報。
  if (ct === undefined) return { kind: 'legacy' };

  // 型別非 string → warning-only。
  if (typeof ct !== 'string') {
    return {
      kind: 'warning',
      type: 'content-type-invalid-type',
      sourcePath,
      value: `contentType typeof=${
        ct === null ? 'null' : Array.isArray(ct) ? 'array' : typeof ct
      } (must be string: article/landing-page/campaign-page)`,
    };
  }

  // string 但不在允許值域 → warning-only。
  if (!VALID_CONTENT_TYPE.has(ct)) {
    return {
      kind: 'warning',
      type: 'content-type-invalid-value',
      sourcePath,
      value: `contentType="${ct}" (must be article/landing-page/campaign-page)`,
    };
  }

  // 合法值 → PASS。
  return { kind: 'valid', value: ct };
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
      // frontmatter parse 失敗 → 以 warning 記錄（不 blocking；非 contentType 語意，但避免靜默略過）。
      warnings.push({
        type: 'content-type-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }

    const result = inspectContentType(data, sourcePath);
    if (result.kind === 'legacy') legacy++;
    else if (result.kind === 'valid') valid++;
    else warnings.push(result);
  }

  // 輸出（report-only）。
  console.log(`[check-content-type-metadata] scan target: ${usingCustom ? 'custom glob(s)' : 'default content globs'}`);
  for (const w of warnings) {
    console.log(`WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(
    `\nscanned ${scanned} | legacy(no contentType) ${legacy} | valid ${valid} | warnings ${warnings.length}`
  );
  console.log('report-only / warning-only：不阻擋 build，exit 0');

  // 一律 exit 0（warning-only / 非 blocking）。
  process.exit(0);
}

main();
