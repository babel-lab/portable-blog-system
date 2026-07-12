#!/usr/bin/env node
// Phase 20260712-shared-author-byline-contract：byline schema + renderer decision 契約 guard
//   （report-only / warning-only / standalone；不動 validate-content.js / build / package
//    以外之現有 scripts；不接進 validate:content / phase1-readiness / release-readiness umbrella）。
//
// 背景 / 決策來源：
//   - docs/20260712-shared-author-byline-contract.md（Blogger / GitHub Pages 共用同一份 `author`；
//     `byline.showAuthor` 只控制視覺；omitted → 預設顯示；meta.json / JSON-LD 一律保留 author）
//   - CLAUDE.md §Red lines（作者不因發布平台改變；不新增 `bloggerAuthor` / `githubAuthor` /
//     `showOnBlogger` / `showOnGithub`；Blogger 主題不會額外顯示 Google 帳號作者）
//
// 為何獨立 script（而非改 validate-content.js）：
//   - validate-content.js 是 build-coupled 中央 validator；改它會位移 documented baseline
//     （0 error / 135 warning / 107 post）。standalone report-only = 零 baseline blast radius，
//     mirrors check-content-type-metadata / check-adsense-mode-metadata / check-blogger-backfill
//     既有 pattern。
//   - 本 guard 不接 build / render / listing / sitemap / Blogger / GitHub Pages / Admin
//     消費路徑；純 metadata 層 warning。
//
// 兩層契約：
//   Layer 1（renderer decision contract；in-memory cases A–E）：
//     鎖 EJS 判斷式 `!(post.byline && post.byline.showAuthor === false)` 之語意。
//     Case A（backward-compat）：byline 缺 → 顯示。
//     Case B（新文章預設方向）：`byline.showAuthor: true` → 顯示。
//     Case C（隱藏 opt-in）：`byline.showAuthor: false` → 隱藏。
//     Case D（外部投稿）：byline.showAuthor: true + 非 Babel 作者 → 顯示原作者名。
//     Case E（invalid type；string "false"）：**不**靜默轉 boolean，renderer 視為
//       顯示（因為 `=== false` strict 比較不通過）；guard 另在 Layer 2 對其發 warning。
//     這些 case 一旦失敗 = renderer 契約已被無意間改動 → exit 非 0（contract failure）。
//
//   Layer 2（frontmatter schema surface scan；warning-only）：
//     掃 content/{github,blogger}/{posts,pages}/**/*.md，若 byline 出現：
//       - byline 非 plain object → warning（byline-invalid-type）
//       - byline.showAuthor 存在且非 boolean → warning（byline-showAuthor-invalid-type）
//     缺 byline 或 byline.showAuthor 是 boolean → 靜默通過。
//     所有 warning 只印出；exit code 由 Layer 1 決定；Layer 2 從不影響 exit。
//
// 掃描範圍（mirror check-content-type-metadata §3.B）：
//   content/github/posts/**/*.md
//   content/blogger/posts/**/*.md
//   content/github/pages/**/*.md
//   content/blogger/pages/**/*.md
//   排除 *.fb.md sidecar。不掃 deploy clone、不掃 validation-fixtures、不掃 templates
//   （templates 已於本 phase 落預設 byline，掃了不會 warning 但也不需要掃）。
//
// 執行：node src/scripts/check-byline-contract.js
//   - Layer 1 全 PASS + Layer 2 純 warning → exit 0。
//   - Layer 1 有任一 FAIL → exit 1（renderer 契約破損；務必回頭修）。
//   - I/O 錯誤 → node 預設拋非 0。

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Renderer decision（mirror `!(post.byline && post.byline.showAuthor === false)`）。
// 純函式，rendererShouldShowAuthor 內只做 `=== false` strict 比較，不做隱含 boolean coercion。
function rendererShouldShowAuthor(post) {
  const author = post && post.author;
  if (typeof author !== 'string' || author.trim() === '') return false;
  const byline = post && post.byline;
  if (byline && typeof byline === 'object' && byline.showAuthor === false) return false;
  return true;
}

// Layer 1 cases — 一 case fail 就代表 EJS 判斷式與意圖已脫勾。
const RENDERER_CASES = [
  {
    id: 'A',
    label: 'legacy post (no byline) still shows author',
    post: { author: 'Dean' },
    expected: true,
  },
  {
    id: 'B',
    label: 'byline.showAuthor: true shows author',
    post: { author: 'Babel', byline: { showAuthor: true } },
    expected: true,
  },
  {
    id: 'C',
    label: 'byline.showAuthor: false hides author',
    post: { author: 'Babel', byline: { showAuthor: false } },
    expected: false,
  },
  {
    id: 'D',
    label: 'guest author (non-Babel) still shows when byline.showAuthor: true',
    post: { author: '投稿者姓名', byline: { showAuthor: true } },
    expected: true,
  },
  {
    id: 'E',
    label: 'invalid type (string "false") is NOT silently coerced; renderer still shows',
    post: { author: 'Babel', byline: { showAuthor: 'false' } },
    expected: true,
  },
];

// Frontmatter schema surface scan.
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

function inspectByline(data, sourcePath) {
  const b = data.byline;
  if (b === undefined) return { kind: 'legacy' };
  if (b === null || typeof b !== 'object' || Array.isArray(b)) {
    return {
      kind: 'warning',
      type: 'byline-invalid-type',
      sourcePath,
      value: `byline typeof=${b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b} (must be object with { showAuthor: boolean })`,
    };
  }
  if (b.showAuthor !== undefined && typeof b.showAuthor !== 'boolean') {
    return {
      kind: 'warning',
      type: 'byline-showAuthor-invalid-type',
      sourcePath,
      value: `byline.showAuthor typeof=${typeof b.showAuthor} (must be boolean; strict comparison — string "false" is NOT hidden)`,
    };
  }
  return { kind: 'valid' };
}

function runLayer1() {
  console.log('[byline-contract] Layer 1 — renderer decision cases');
  let passed = 0;
  const failures = [];
  for (const c of RENDERER_CASES) {
    const actual = rendererShouldShowAuthor(c.post);
    const ok = actual === c.expected;
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] Case ${c.id} — ${c.label} (expected=${c.expected}, actual=${actual})`);
    if (ok) passed++;
    else failures.push(c.id);
  }
  console.log(`  layer1: ${passed}/${RENDERER_CASES.length} PASS`);
  return { passed, total: RENDERER_CASES.length, failures };
}

function runLayer2() {
  console.log('');
  console.log('[byline-contract] Layer 2 — frontmatter schema surface scan (report-only / warning-only)');

  const files = fg.sync(DEFAULT_GLOBS, {
    cwd: PROJECT_ROOT,
    absolute: true,
    onlyFiles: true,
    ignore: IGNORE_GLOBS,
    dot: false,
  });
  files.sort();

  let scanned = 0;
  let legacy = 0;
  let withByline = 0;
  const warnings = [];

  for (const absPath of files) {
    const sourcePath = toRelative(absPath);
    scanned++;
    let data;
    try {
      ({ data } = matter(readFileSync(absPath, 'utf-8')));
    } catch (err) {
      warnings.push({
        type: 'byline-frontmatter-unreadable',
        sourcePath,
        value: `frontmatter parse failed: ${err.message}`,
      });
      continue;
    }
    const result = inspectByline(data, sourcePath);
    if (result.kind === 'legacy') legacy++;
    else if (result.kind === 'valid') withByline++;
    else warnings.push(result);
  }

  for (const w of warnings) {
    console.log(`  WARN  ${w.type}  ${w.sourcePath}  ${w.value}`);
  }
  console.log(`  scanned ${scanned} | legacy(no byline) ${legacy} | withByline ${withByline} | warnings ${warnings.length}`);
}

function main() {
  const layer1 = runLayer1();
  runLayer2();

  const overallOk = layer1.passed === layer1.total;
  console.log('');
  console.log(`byline-contract guard: ${overallOk ? 'PASS' : 'FAIL'} (layer1 ${layer1.passed}/${layer1.total}${overallOk ? '' : `; failed cases: ${layer1.failures.join(', ')}`}; layer2 warning-only)`);

  if (!overallOk) process.exit(1);
  process.exit(0);
}

main();
