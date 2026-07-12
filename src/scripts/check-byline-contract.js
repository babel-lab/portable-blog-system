#!/usr/bin/env node
// Phase 20260712-shared-author-byline-contract：byline schema + renderer decision 契約 guard
//   （standalone；不接進 validate:content / phase1-readiness / release-readiness umbrella）。
//
// 2026-07-12 boolean-hardening：新增 Layer 3 直接跑 validateContent()（validate-content.js 已於
//   本 phase 加入 ERROR 規則 `byline-invalid-type` / `byline-show-author-invalid-type`）以證明
//   非 boolean 之 byline.showAuthor 會被 validator hard-fail，而非僅在 renderer / metadata 層以
//   warning 或 fallback 帶過。
//
// 三層契約：
//   Layer 1（renderer decision contract；in-memory cases A–E）：
//     鎖 EJS 判斷式 `!(post.byline && post.byline.showAuthor === false)` 之語意（strict `=== false`）。
//     Case A（backward-compat / byline omitted）：顯示。
//     Case B（byline.showAuthor: true）：顯示。
//     Case C（byline.showAuthor: false）：隱藏。
//     Case D（外部投稿 + true）：顯示原作者名。
//     Case E（string "false"）：renderer 不靜默 coerce → 仍顯示（但於 Layer 3 被 validator hard-fail）。
//     任一 FAIL → exit 1。
//
//   Layer 2（frontmatter schema surface scan；warning-only）：
//     掃 content/{github,blogger}/{posts,pages}/**/*.md，若 byline 出現：
//       - byline 非 plain object → warning（byline-invalid-type）
//       - byline.showAuthor 存在且非 boolean → warning（byline-showAuthor-invalid-type）
//     缺 byline 或 byline.showAuthor 是 boolean → 靜默通過。
//     現有 production content 0 篇有 byline → 0 warning（此層作為未來新內容之報告器）。
//
//   Layer 3（validator hard-fail proof；in-memory validateContent() invocation）：
//     直接 import validateContent 並跑 synthetic minimal posts，驗證下列必須是 ERROR：
//       - Case D（string "false"）→ byline-show-author-invalid-type
//       - Case E（number 0）→ byline-show-author-invalid-type
//       - Case F（null / YAML `showAuthor:`）→ byline-show-author-invalid-type
//       - Case G（byline 為 string）→ byline-invalid-type
//     以及必須 NOT 觸發下列（backward-compat）：
//       - byline omitted
//       - byline.showAuthor: true
//       - byline.showAuthor: false
//     任一 case 期望不符 → exit 1（validator 契約已破損）。
//
// 執行：node src/scripts/check-byline-contract.js
//   - Layer 1 全 PASS + Layer 2 純 warning + Layer 3 全 PASS → exit 0。
//   - Layer 1 / Layer 3 任一 FAIL → exit 1。
//   - Layer 2 從不影響 exit。
//   - I/O 錯誤 → node 預設拋非 0。

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { validateContent } from './validate-content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// ---------- Layer 1 ----------
function rendererShouldShowAuthor(post) {
  const author = post && post.author;
  if (typeof author !== 'string' || author.trim() === '') return false;
  const byline = post && post.byline;
  if (byline && typeof byline === 'object' && byline.showAuthor === false) return false;
  return true;
}

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
    label: 'renderer does NOT silently coerce string "false"; still shows',
    post: { author: 'Babel', byline: { showAuthor: 'false' } },
    expected: true,
  },
];

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

// ---------- Layer 2 ----------
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

// ---------- Layer 3 ----------
// Build a minimally valid ready post; validator gates most rules on ready/published, but the byline
// rule fires for any status. We keep status:'draft' so the post won't trigger unrelated missing-*
// warnings (draft is filtered from most rules; byline rule is status-agnostic). Adjust `byline` per
// case to prove the target error type appears / disappears exactly as expected.
function makeSyntheticPost(byline) {
  const post = {
    sourcePath: '(synthetic)',
    site: 'github',
    contentKind: 'tech-note',
    primaryPlatform: 'github',
    title: 'Byline validator smoke',
    slug: 'byline-validator-smoke',
    date: '2026-07-12',
    author: 'Babel',
    category: '',
    tags: [],
    status: 'draft',
    draft: true,
  };
  if (byline !== undefined) post.byline = byline;
  return post;
}

// Minimal settings shape sufficient for validateContent() to not blow up on registry lookups.
const SYNTHETIC_SETTINGS = {
  site: { language: 'zh-TW', author: "Babel's Lab", siteName: "Babel's Lab" },
  categories: [],
  tags: [],
  ads: {},
  commerceLinks: [],
  downloadAssets: [],
  downloadForms: [],
  promotion: { facebook: { enabled: false } },
};

const VALIDATOR_CASES = [
  {
    id: 'A (validator)',
    label: 'omitted byline → no byline error (backward-compat)',
    byline: undefined,
    expectTypes: [],
  },
  {
    id: 'B (validator)',
    label: 'byline.showAuthor: true → no byline error',
    byline: { showAuthor: true },
    expectTypes: [],
  },
  {
    id: 'C (validator)',
    label: 'byline.showAuthor: false → no byline error',
    byline: { showAuthor: false },
    expectTypes: [],
  },
  {
    id: 'D (validator)',
    label: 'byline.showAuthor: "false" (string) → ERROR byline-show-author-invalid-type',
    byline: { showAuthor: 'false' },
    expectTypes: ['byline-show-author-invalid-type'],
  },
  {
    id: 'E (validator)',
    label: 'byline.showAuthor: 0 (number) → ERROR byline-show-author-invalid-type',
    byline: { showAuthor: 0 },
    expectTypes: ['byline-show-author-invalid-type'],
  },
  {
    id: 'F (validator)',
    label: 'byline.showAuthor: null (YAML empty value) → ERROR byline-show-author-invalid-type',
    byline: { showAuthor: null },
    expectTypes: ['byline-show-author-invalid-type'],
  },
  {
    id: 'G (validator)',
    label: 'byline: "true" (byline itself a string) → ERROR byline-invalid-type',
    byline: 'true',
    expectTypes: ['byline-invalid-type'],
  },
];

function runLayer3() {
  console.log('');
  console.log('[byline-contract] Layer 3 — validator hard-fail proof (in-memory validateContent invocation)');
  let passed = 0;
  const failures = [];
  for (const c of VALIDATOR_CASES) {
    const post = makeSyntheticPost(c.byline);
    const result = validateContent({ posts: [post], settings: SYNTHETIC_SETTINGS });
    const bylineErrors = result.issues.filter(
      (i) =>
        i.severity === 'error' &&
        (i.type === 'byline-invalid-type' || i.type === 'byline-show-author-invalid-type'),
    );
    const actualTypes = bylineErrors.map((i) => i.type).sort();
    const expectedTypes = [...c.expectTypes].sort();
    const ok =
      actualTypes.length === expectedTypes.length &&
      actualTypes.every((t, idx) => t === expectedTypes[idx]);
    const actualDesc = actualTypes.length === 0 ? '(none)' : actualTypes.join(', ');
    const expectedDesc = expectedTypes.length === 0 ? '(none)' : expectedTypes.join(', ');
    const detail = ok
      ? ''
      : ` — expected [${expectedDesc}], actual [${actualDesc}]${bylineErrors.length > 0 ? '; sample value=' + JSON.stringify(bylineErrors[0].value) : ''}`;
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] Case ${c.id} — ${c.label}${detail}`);
    if (ok) passed++;
    else failures.push(c.id);
  }
  console.log(`  layer3: ${passed}/${VALIDATOR_CASES.length} PASS`);
  return { passed, total: VALIDATOR_CASES.length, failures };
}

// ---------- main ----------
function main() {
  const layer1 = runLayer1();
  runLayer2();
  const layer3 = runLayer3();

  const overallOk = layer1.passed === layer1.total && layer3.passed === layer3.total;
  const details = [
    `layer1 ${layer1.passed}/${layer1.total}`,
    `layer2 warning-only`,
    `layer3 ${layer3.passed}/${layer3.total}`,
  ];
  const failedDetail =
    (layer1.failures.length > 0 ? `; layer1 failed: ${layer1.failures.join(', ')}` : '') +
    (layer3.failures.length > 0 ? `; layer3 failed: ${layer3.failures.join(', ')}` : '');

  console.log('');
  console.log(`byline-contract guard: ${overallOk ? 'PASS' : 'FAIL'} (${details.join('; ')}${failedDetail})`);

  if (!overallOk) process.exit(1);
  process.exit(0);
}

main();
