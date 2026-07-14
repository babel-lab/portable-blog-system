#!/usr/bin/env node
// Phase 20260714-github-redraft-lifecycle：GitHub 文章「退回草稿 / 重新上架」生命週期契約 guard。
//
// 背景（Dean 需求，2026-07-14）：
//   READY／已上架 → 退回草稿（暫時下架）→ 未來沿用相同 slug／URL 重新上架。
//   這是「文章生命週期與建置行為」的安全切片，**不是永久刪除**：Markdown 原始檔與 git history 保留，
//   只切換 frontmatter status／draft。退回草稿後不得出現在正式站，正式 build 不得產出該文章 HTML，
//   列表／索引／sitemap 皆不含；重新部署後原 URL 應暫時成為 404。重新上架沿用原 slug → 恢復相同 URL。
//
// 範圍 / 邊界：
//   - 以 **真實** classify()（src/scripts/load-posts.js 匯出）驗證 state matrix（行為測試，非抄規格）。
//   - 唯讀掃 content/github/posts 與 content/blogger/posts（gray-matter 解析 frontmatter），
//     報告 status⇔draft 矛盾（warning-only）。
//   - 靜態斷言 build-github.js 之 PAGES_DIR 清除與 vite.config.js 之 emptyOutDir:true（stale HTML 契約）。
//   - **不** build / deploy / dev server / fetch / pull；**不**寫任何檔；**不**改任何 content／frontmatter；
//     **不**呼叫 Blogger / Google / GA4 / AdSense API；**不**碰 gh-pages / deploy clone。
//
// 契約斷言（hard-fail，任一失敗即 exit 1）：
//   1. state matrix：ready/published（draft:false 或缺省）→ include；
//      draft:true（任何 status）／status:draft／status:archived／status 缺省 → exclude。
//   2. redraft round-trip：同一 slug，ready → draft → ready 時 classify().include 為 true → false → true
//      （編碼 Dean 需求 #3/#4/#8：退回草稿移除輸出、重新上架沿用同 slug 恢復同輸出路徑）。
//   3. 矛盾狀態仍保守隱藏：ready+draft:true 與 status:draft+draft:false 皆 exclude（偏向隱藏，永不誤上架）。
//   4. stale HTML 契約：build-github.js 於寫入前清除 PAGES_DIR；vite.config.js build.emptyOutDir === true。
//
// 報告（warning-only，不影響 exit code）：
//   - 掃全部 github native + blogger 來源之 .md，列出 status⇔draft 矛盾（production 期望 0 筆）。
//
// 執行：`npm run check:github-redraft-lifecycle`（或 `node src/scripts/check-github-redraft-lifecycle.js`）。

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

import { classify } from './load-posts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

// ── test harness ──────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    fail += 1;
    console.error(`[FAIL] ${name}`);
    console.error(`       ${err.message}`);
  }
}

// ── 1 + 3. state matrix（含矛盾狀態保守隱藏）─────────────────────────────────────
// 每列為一組 frontmatter-shaped fixture（暫存測試資料，不落地 content/）。
const MATRIX = [
  // [label, frontmatter, expectInclude]
  ['ready + draft:false → include', { status: 'ready', draft: false }, true],
  ['published + draft:false → include', { status: 'published', draft: false }, true],
  ['ready + draft 缺省 → include', { status: 'ready' }, true],
  ['published + draft 缺省 → include', { status: 'published' }, true],
  ['draft:true + status:ready → exclude（矛盾；draft 保守勝出）', { status: 'ready', draft: true }, false],
  ['draft:true + status:published → exclude（矛盾；draft 保守勝出）', { status: 'published', draft: true }, false],
  ['status:draft + draft:false → exclude（矛盾；status 保守勝出）', { status: 'draft', draft: false }, false],
  ['status:draft + draft:true → exclude（一致草稿）', { status: 'draft', draft: true }, false],
  ['status:archived → exclude', { status: 'archived', draft: false }, false],
  ['status 缺省 → exclude（預設 draft）', {}, false],
];

for (const [label, data, expectInclude] of MATRIX) {
  check(`state matrix: ${label}`, () => {
    const verdict = classify(data);
    assert.strictEqual(
      verdict.include,
      expectInclude,
      `classify(${JSON.stringify(data)}).include 應為 ${expectInclude}（實得 ${verdict.include}, reason=${verdict.reason}）`,
    );
  });
}

// ── 2. redraft round-trip：同一 slug，ready → draft → ready ─────────────────────
check('redraft round-trip: 同 slug ready → draft → ready 之 include 為 true → false → true', () => {
  const slug = 'lifecycle-fixture-post';
  const base = { slug, id: '20260714-lifecycle-fixture', date: '2026-07-14' };

  // 上架
  const live1 = classify({ ...base, status: 'ready', draft: false });
  assert.strictEqual(live1.include, true, `初次上架應 include（reason=${live1.reason}）`);

  // 退回草稿（暫時下架）→ 正式 build 不產出 posts/<slug>/index.html
  const drafted = classify({ ...base, status: 'draft', draft: true });
  assert.strictEqual(drafted.include, false, `退回草稿應 exclude（reason=${drafted.reason}）`);

  // 沿用相同 slug 重新上架 → 恢復相同輸出路徑
  const republished = { ...base, status: 'ready', draft: false };
  const live2 = classify(republished);
  assert.strictEqual(live2.include, true, `重新上架應 include（reason=${live2.reason}）`);
  // classify 為唯讀 predicate：不得 mutate 傳入文章物件之 identity（slug）。
  // 這保證 redraft 生命週期反覆 classify 同一來源時 slug 不漂移 → 重新上架沿用同 slug、恢復同輸出路徑
  // posts/<slug>/index.html。斷言取 classify() 呼叫「之後」的 republished.slug，故真正依賴 classify 的行為，
  // 而非僅比較兩個 fixture 建構時已知相等的變數。
  assert.strictEqual(republished.slug, slug, 'classify 不得 mutate slug（同輸出路徑 posts/<slug>/index.html）');
});

// ── 4. stale HTML 契約（source-level 靜態斷言）──────────────────────────────────
const buildGithubSrc = readFileSync(path.join(ROOT, 'src', 'scripts', 'build-github.js'), 'utf-8');
const viteConfigSrc = readFileSync(path.join(ROOT, 'vite.config.js'), 'utf-8');

check('stale HTML 契約: build-github.js 於寫入前清除 PAGES_DIR', () => {
  const cleanupRe = /fs\.rm\(\s*PAGES_DIR\s*,\s*\{\s*recursive:\s*true\s*,\s*force:\s*true\s*\}\s*\)/;
  const m = buildGithubSrc.match(cleanupRe);
  assert.ok(m, 'build-github.js 應含 fs.rm(PAGES_DIR, { recursive: true, force: true })');
  const cleanupIdx = buildGithubSrc.indexOf(m[0]);
  const firstWriteIdx = buildGithubSrc.search(/writeText\(\s*path\.join\(\s*PAGES_DIR/);
  assert.ok(
    cleanupIdx >= 0 && firstWriteIdx >= 0 && cleanupIdx < firstWriteIdx,
    `PAGES_DIR 清除應在第一個 page 寫入之前（cleanupIdx=${cleanupIdx} firstWriteIdx=${firstWriteIdx}）`,
  );
});

check('stale HTML 契約: vite.config.js build.emptyOutDir === true（dist 清空）', () => {
  assert.ok(
    /emptyOutDir:\s*true/.test(viteConfigSrc),
    'vite.config.js build 應設 emptyOutDir: true，確保 redraft 後 dist/ 不留舊 HTML',
  );
});

// ── warning-only：掃真實 content 之 status⇔draft 矛盾 ──────────────────────────
function scanContradictions(site) {
  const baseDir = path.join(ROOT, 'content', site, 'posts');
  const pattern = path.join(baseDir, '**/*.md').split(path.sep).join('/');
  const files = fg.sync(pattern, { absolute: true, onlyFiles: true });
  const contradictions = [];
  for (const abs of files) {
    const { data } = matter(readFileSync(abs, 'utf-8'));
    const status = data.status;
    const draft = data.draft;
    const relPath = path.relative(ROOT, abs).split(path.sep).join('/');
    // 矛盾定義：status 是可見值但 draft:true；或 status 是隱藏值但 draft:false。
    const statusVisible = status === 'ready' || status === 'published';
    const statusHidden = status === 'draft' || status === 'archived';
    if (statusVisible && draft === true) {
      contradictions.push(`${relPath} — status:${status} 但 draft:true（會被隱藏；重新上架前請將 draft 改為 false）`);
    } else if (statusHidden && draft === false) {
      contradictions.push(`${relPath} — status:${status} 但 draft:false（仍被隱藏；status 需改為 ready/published 才會上架）`);
    }
  }
  return contradictions;
}

const warnings = [...scanContradictions('github'), ...scanContradictions('blogger')];

console.log('');
if (warnings.length === 0) {
  console.log('[report] status⇔draft 矛盾掃描：0 筆（production content 一致）');
} else {
  console.log(`[report] status⇔draft 矛盾掃描：${warnings.length} 筆（warning-only；classify 已保守隱藏，不阻斷 build）`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

console.log('');
console.log(`GitHub redraft lifecycle contract guard: ${pass} / ${fail}`);
if (fail > 0) process.exit(1);
