#!/usr/bin/env node
// Phase 20260624-sp9d：Blogger operator guidance（display-only）in-memory smoke。
//
// 範圍 / 邊界：
//   - 只在記憶體渲染 blogger-copy-helper.ejs / blogger-publish-checklist.ejs（ejs.renderFile → string）。
//   - **不**寫 dist-blogger / .cache / 任何 generated file；**不**跑 build / deploy / validate。
//   - **不** import build-blogger.js（其 module load 會無條件執行 main()）。
//   - 驗證對象：display-only `[15]` operator guidance 區塊 + publish-checklist 對應 manual-check rows。
//
// 設計說明：
//   - bloggerOperatorGuidance projection 與 build-blogger.js deriveBloggerOperatorGuidance 同一邏輯，
//     在此 smoke 內重現（避免 import build-blogger.js 之 side effect）。兩者皆委派 SP-9a
//     resolvePlatformPolicyValue（platform-policy-effective.js）做 secret-safe / inherit-aware projection。
//   - 任一斷言失敗即 process.exit(1)；尾端印 "<pass> / <fail>"。

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

import { resolvePlatformPolicyValue } from './platform-policy-effective.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIEWS_DIR = path.resolve(__dirname, '..', 'views', 'blogger');
const COPY_HELPER = path.join(VIEWS_DIR, 'blogger-copy-helper.ejs');
const PUBLISH_CHECKLIST = path.join(VIEWS_DIR, 'blogger-publish-checklist.ejs');

// ── projection（mirror build-blogger.js deriveBloggerOperatorGuidance）─────────────
function deriveBloggerOperatorGuidance(post) {
  const pageType =
    post && typeof post.pageType === 'string' && post.pageType.trim() !== ''
      ? post.pageType.trim()
      : null;

  const policy = post && typeof post === 'object' ? post.platformPolicy : undefined;
  const hasBloggerPolicy = !!(
    policy &&
    typeof policy === 'object' &&
    !Array.isArray(policy) &&
    policy.blogger &&
    typeof policy.blogger === 'object' &&
    !Array.isArray(policy.blogger)
  );

  let blogger = null;
  if (hasBloggerPolicy) {
    blogger = {};
    for (const field of ['indexing', 'includeInListings', 'includeInSitemap']) {
      const r = resolvePlatformPolicyValue(post, 'blogger', field);
      blogger[field] = { value: r.value, source: r.source };
    }
  }

  return { present: pageType !== null || hasBloggerPolicy, pageType, hasBloggerPolicy, blogger };
}

// ── minimal render fixtures（滿足兩個 EJS 之 prop 參照；皆 full mode）────────────────
function basePost(extra = {}) {
  return {
    title: 'SP-9d Smoke Post',
    slug: 'sp9d-smoke-post',
    bloggerMode: 'full',
    sourcePath: 'content/blogger/posts/_sp9d-smoke.md',
    tags: ['smoke'],
    searchDescription: 'smoke desc',
    description: 'smoke desc',
    contentKind: 'post',
    normalized: {},
    ...extra,
  };
}

const META = { build: { builtAt: '2026-01-01T00:00:00Z', postFile: 'post.html' } };
const CANONICAL = { url: 'https://example.com/x', warning: '' };
const OG = { title: '', description: '', image: '', alt: '' };
const JSONLD = { '@type': 'BlogPosting', articleSection: '' };

async function renderCopyHelper(post) {
  const guidance = deriveBloggerOperatorGuidance(post);
  return ejs.renderFile(
    COPY_HELPER,
    {
      post,
      normalized: post.normalized,
      canonical: CANONICAL,
      meta: META,
      ogFields: OG,
      jsonLd: JSONLD,
      copyHelperSeriesTitle: null,
      copyHelperSeriesTitleUnresolvedPlaceholders: [],
      bloggerOperatorGuidance: guidance,
    },
    { async: true },
  );
}

async function renderChecklist(post) {
  const guidance = deriveBloggerOperatorGuidance(post);
  return ejs.renderFile(
    PUBLISH_CHECKLIST,
    {
      post,
      normalized: post.normalized,
      canonical: CANONICAL,
      meta: META,
      bloggerOperatorGuidance: guidance,
    },
    { async: true },
  );
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

const COPY_MARKER = '[15] Blogger pageType / platformPolicy';
const CHECKLIST_MARKER = '特殊 pageType / platformPolicy 操作檢查';

async function main() {
  // (a) 無 pageType / platformPolicy → 新區塊不出現（byte-identical 保證之基礎）
  const aCopy = await renderCopyHelper(basePost());
  const aList = await renderChecklist(basePost());
  check('(a) no pageType/platformPolicy → copy-helper [15] absent', () => {
    assert.ok(!aCopy.includes(COPY_MARKER), 'copy-helper 不應出現 [15] 區塊');
  });
  check('(a) no pageType/platformPolicy → checklist section absent', () => {
    assert.ok(!aList.includes(CHECKLIST_MARKER), 'checklist 不應出現特殊 pageType 區塊');
  });
  // (a-2) 與「完全不傳 bloggerOperatorGuidance prop」之輸出一致（防呆 typeof guard）
  const aCopyNoProp = await ejs.renderFile(
    COPY_HELPER,
    {
      post: basePost(),
      normalized: {},
      canonical: CANONICAL,
      meta: META,
      ogFields: OG,
      jsonLd: JSONLD,
      copyHelperSeriesTitle: null,
      copyHelperSeriesTitleUnresolvedPlaceholders: [],
      bloggerOperatorGuidance: undefined,
    },
    { async: true },
  );
  check('(a-2) undefined guidance prop → copy-helper identical to present=false', () => {
    assert.strictEqual(aCopyNoProp, aCopy, 'undefined prop 與 present=false 應 byte-identical');
  });

  // (b) pageType: gated_download → copy-helper / checklist 出現正確 manual guidance
  const bCopy = await renderCopyHelper(basePost({ pageType: 'gated_download' }));
  const bList = await renderChecklist(basePost({ pageType: 'gated_download' }));
  check('(b) gated_download → copy-helper shows guidance', () => {
    assert.ok(bCopy.includes(COPY_MARKER), '應出現 [15] 區塊');
    assert.ok(bCopy.includes('pageType：gated_download'), '應顯示 pageType');
    assert.ok(bCopy.includes('noindex, nofollow'), '應建議 noindex, nofollow');
    assert.ok(bCopy.includes('Google Form'), '應提及 Google Form 漏斗閘門 SOP');
  });
  check('(b) gated_download → checklist shows manual rows', () => {
    assert.ok(bList.includes(CHECKLIST_MARKER), '應出現特殊 pageType 檢查區塊');
    assert.ok(bList.includes('gated_download'), 'checklist 應提及 gated_download');
    assert.ok(bList.includes('noindex, nofollow'), 'checklist 應建議 noindex, nofollow');
  });
  check('(b) checklist 不宣稱系統自動套用（仍須手動 Blogger 後台設定）', () => {
    assert.ok(bList.includes('手動於 Blogger 後台設定') || bList.includes('Blogger 後台'), '應強調手動設定');
    assert.ok(bList.includes('source of truth'), 'Blogger 後台應標為 source of truth');
  });

  // (c) platformPolicy.blogger 含 suspicious/secret-like keys → 不可 echo secret value
  const SECRET = 'SECRET_VALUE_DO_NOT_ECHO_42';
  const cPost = basePost({
    platformPolicy: { blogger: { token: SECRET, apiKey: SECRET, indexing: 'noindex-follow' } },
  });
  const cCopy = await renderCopyHelper(cPost);
  const cList = await renderChecklist(cPost);
  check('(c) secret-like key value not echoed in copy-helper', () => {
    assert.ok(!cCopy.includes(SECRET), 'copy-helper 不得 echo secret value');
    assert.ok(cCopy.includes('noindex-follow'), '合法 indexing 欄位仍應顯示');
  });
  check('(c) secret-like key value not echoed in checklist', () => {
    assert.ok(!cList.includes(SECRET), 'checklist 不得 echo secret value');
  });

  // (d) indexing: inherit → 顯示 inherit/audit 語義，不誤顯示為 override
  const dCopy = await renderCopyHelper(
    basePost({ platformPolicy: { blogger: { indexing: 'inherit' } } }),
  );
  check('(d) indexing inherit → shows inherit, not override text', () => {
    assert.ok(dCopy.includes('platformPolicy.blogger.indexing：inherit'), '應顯示 inherit 語義');
    assert.ok(!dCopy.includes('audit record；非自動套用'), '不得顯示 override 專屬文案');
  });

  // (e) includeInListings=false → 顯示 Blogger label/listing caveat，不宣稱會自動壓制
  const eCopy = await renderCopyHelper(
    basePost({ platformPolicy: { blogger: { includeInListings: false } } }),
  );
  check('(e) includeInListings=false → label/listing caveat, no auto-suppress claim', () => {
    assert.ok(eCopy.includes('includeInListings：false'), '應顯示欄位值');
    assert.ok(eCopy.includes('無法壓制 Blogger label'), '應標明 repo 無法壓制 Blogger label');
  });

  // (f) includeInSitemap=false → 顯示 Blogger sitemap/feed caveat，不宣稱 repo 可控制
  const fCopy = await renderCopyHelper(
    basePost({ platformPolicy: { blogger: { includeInSitemap: false } } }),
  );
  check('(f) includeInSitemap=false → sitemap/feed caveat, no repo-control claim', () => {
    assert.ok(fCopy.includes('includeInSitemap：false'), '應顯示欄位值');
    assert.ok(fCopy.includes('無法控制 Blogger 自動 sitemap / feed'), '應標明 repo 無法控制 Blogger sitemap/feed');
  });

  console.log(`check-blogger-operator-guidance: ${pass} / ${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
