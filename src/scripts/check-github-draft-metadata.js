#!/usr/bin/env node
// Phase 20260701-a3-2：GitHub draft frontmatter contract regression smoke（direct-node）。
//
// 範圍 / 邊界：
//   - **只讀**：gray-matter 解析單一 GitHub draft + 讀 categories.json / tags.json registry。
//   - **不**寫任何檔、**不**跑 build / deploy / validate / dev server、**不**碰 gh-pages / deploy clone。
//   - **不** import build-github.js / load-posts.js（loadPosts 會過濾掉 draft，取不到本檔；
//     且其 module load 可能觸發 side effect）。此處直接 readFile + matter 解析目標檔。
//   - **非** package.json wired script；比照 CLAUDE.md「Direct-node smoke（非 package scripts）」前例
//     （check-ga4-param-allowlist.js / check-blogger-operator-guidance.js / check-platform-policy-effective.js）。
//     以 `node src/scripts/check-github-draft-metadata.js` 直接執行。
//
// 目的：
//   鎖住 build-preview-workflow GitHub draft 的 frontmatter contract，避免未來被無意破壞：
//     - category 必須綁 registry（categories.json），且該 category 之 site[] 含 'github'
//     - tags 必須全部存在於 registry（tags.json），且各 tag 之 site[] 含 'github'
//     - tags 不得使用紅線禁用 / 不存在之 tag（admin-ui / design-token / blogger / download / markdown）
//     - status / draft contract 合法且互相一致（status: draft ⇔ draft: true）
//     - site / primaryPlatform / contentKind / publishTargets.github.enabled 合法
//
//   任一斷言失敗即 process.exit(1)；尾端印 "<pass> / <fail>"。

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const DRAFT_PATH = path.join(
  ROOT,
  'content',
  'github',
  'posts',
  '2026-07-01-github-pages-build-preview-workflow.md',
);
const CATEGORIES_PATH = path.join(ROOT, 'content', 'settings', 'categories.json');
const TAGS_PATH = path.join(ROOT, 'content', 'settings', 'tags.json');

// contentKind 列舉（CLAUDE.md §11）
const VALID_CONTENT_KIND = new Set([
  'post',
  'tech-note',
  'book-review',
  'download',
  'comic',
  'life-note',
  'page',
]);

// 紅線禁用 / 不存在 tags（本 session 明列，不得出現於 github draft）
const FORBIDDEN_TAGS = new Set(['admin-ui', 'design-token', 'blogger', 'download', 'markdown']);

// ── 讀取（read-only）─────────────────────────────────────────────────────────────
const draftRaw = readFileSync(DRAFT_PATH, 'utf-8');
const { data: fm } = matter(draftRaw);
const categories = JSON.parse(readFileSync(CATEGORIES_PATH, 'utf-8'));
const tags = JSON.parse(readFileSync(TAGS_PATH, 'utf-8'));

// registry lookup：id 或 slug 命中，回該 registry entry（含 site[]），否則 null
function resolveEntry(registry, key) {
  if (typeof key !== 'string' || key.trim() === '') return null;
  const k = key.trim();
  return registry.find((e) => e && (e.id === k || e.slug === k)) ?? null;
}

function siteIncludesGithub(entry) {
  return !!(entry && Array.isArray(entry.site) && entry.site.includes('github'));
}

// ── test harness ──────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass += 1;
  } catch (err) {
    fail += 1;
    console.error(`FAIL: ${name}`);
    console.error(`      ${err.message}`);
  }
}

// ── contract 斷言 ──────────────────────────────────────────────────────────────────
check('frontmatter parses to a plain object', () => {
  assert.ok(fm && typeof fm === 'object' && !Array.isArray(fm), 'frontmatter 應為物件');
});

check('site === "github"', () => {
  assert.strictEqual(fm.site, 'github', `site 應為 github（實得 ${JSON.stringify(fm.site)}）`);
});

check('primaryPlatform === "github"', () => {
  assert.strictEqual(
    fm.primaryPlatform,
    'github',
    `primaryPlatform 應為 github（實得 ${JSON.stringify(fm.primaryPlatform)}）`,
  );
});

check('contentKind is a valid enum value', () => {
  assert.ok(
    typeof fm.contentKind === 'string' && VALID_CONTENT_KIND.has(fm.contentKind),
    `contentKind 非法：${JSON.stringify(fm.contentKind)}`,
  );
});

check('title / titleEn / slug are non-empty strings', () => {
  for (const key of ['title', 'titleEn', 'slug']) {
    assert.ok(
      typeof fm[key] === 'string' && fm[key].trim() !== '',
      `${key} 應為非空字串（實得 ${JSON.stringify(fm[key])}）`,
    );
  }
});

check('category is registry-bound and site[] includes "github"', () => {
  assert.ok(
    typeof fm.category === 'string' && fm.category.trim() !== '',
    `category 應為非空字串（實得 ${JSON.stringify(fm.category)}）`,
  );
  const entry = resolveEntry(categories, fm.category);
  assert.ok(entry, `category "${fm.category}" 不存在於 categories.json registry`);
  assert.ok(
    siteIncludesGithub(entry),
    `category "${fm.category}" 之 site[] 未含 github（實得 ${JSON.stringify(entry.site)}）`,
  );
});

check('tags is a non-empty array', () => {
  assert.ok(Array.isArray(fm.tags) && fm.tags.length > 0, `tags 應為非空陣列（實得 ${JSON.stringify(fm.tags)}）`);
});

check('every tag is registry-bound and site[] includes "github"', () => {
  for (const t of fm.tags ?? []) {
    const entry = resolveEntry(tags, t);
    assert.ok(entry, `tag "${t}" 不存在於 tags.json registry`);
    assert.ok(
      siteIncludesGithub(entry),
      `tag "${t}" 之 site[] 未含 github（實得 ${JSON.stringify(entry.site)}）`,
    );
  }
});

check('no forbidden / non-existent tag is used', () => {
  for (const t of fm.tags ?? []) {
    assert.ok(!FORBIDDEN_TAGS.has(t), `tag "${t}" 屬紅線禁用 / 不存在 tag，不得用於 github draft`);
  }
});

check('draft contract is consistent (status: "draft" ⇔ draft: true)', () => {
  assert.strictEqual(fm.status, 'draft', `status 應為 draft（實得 ${JSON.stringify(fm.status)}）`);
  assert.strictEqual(fm.draft, true, `draft 應為 true（實得 ${JSON.stringify(fm.draft)}）`);
});

check('publishTargets.github.enabled === true', () => {
  assert.strictEqual(
    fm.publishTargets?.github?.enabled,
    true,
    `publishTargets.github.enabled 應為 true（實得 ${JSON.stringify(fm.publishTargets?.github?.enabled)}）`,
  );
});

console.log(`check-github-draft-metadata: ${pass} / ${fail}`);
if (fail > 0) process.exit(1);
