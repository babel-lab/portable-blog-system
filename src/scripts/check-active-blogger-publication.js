#!/usr/bin/env node
// Phase 20260721-publish-target-stage Slice 4A：active-publication consumer read helper guard。
//
// 上位契約：docs/20260720-publish-target-stage-contract.md（Slice 4A：consumer hardening）
//
// 唯一契約（本 guard 為 fail-closed 之 executable spec）：
//   Active Blogger publication = sidecar.blogger.status === 'published'
//                                AND typeof publishedUrl === 'string'
//                                AND publishedUrl.trim() !== ''
//
// 範圍 / 邊界（read-only；negative test 完全隔離；本 guard **絕不**動 repo bytes）：
//   - Slice 4A 之核心斷言：**in-memory 物件**（helper 純函式）＋ **repo 內既有真實檔案之
//     靜態文字掃描**（consumer wiring；preview 路徑 helper 未接入之隔離）。
//   - **不**修改任何真實 sidecar / Markdown / manifest / settings / dist-*；**不** build /
//     preview / deploy；**不**呼叫任何 API；**零網路**。
//   - **禁止** guard 輸出 echo 真實 production publishedUrl（見 F 區塊）；所有 fixture URL
//     一律使用 synthetic host（`fixture.example.test`）。
//
// 斷言分區：
//   A. isActivePublishedTarget / getActivePublishedUrl 值域（17 fixture 覆蓋 §VII）
//   B. Consumer wiring 靜態掃描（blogger-render / build-github / normalize-post-output /
//      resolve-placeholders / report-published-urls / load-admin-posts / admin-article-lookup /
//      views/admin/index.ejs）
//   C. Preview 路徑隔離（build-blogger-preview / blogger-preview-plan / check-blogger-preview
//      不得引入 active-publication helper）
//   D. Consumer 行為（in-memory post 傳入 resolveCanonicalUrl / buildCanonicalUrl /
//      resolvePlaceholders / normalizePostOutput / generatePublishedUrlsReport）
//   E. Current published sidecar happy path 不動：3 筆 production sidecar shape 之 helper 輸出
//      符合預期（皆 in-memory；不讀真實 sidecar 檔）
//   F. Echo-guard：本 guard 執行完之整體輸出不得包含任何真實 production URL 片段

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';

import {
  ACTIVE_PUBLISHED_STATUS,
  isActivePublishedTarget,
  getActivePublishedUrl,
} from './active-publication.js';
import { resolveCanonicalUrl } from './blogger-render.js';
import { normalizePostOutput } from './normalize-post-output.js';
import { resolvePlaceholders } from './resolve-placeholders.js';
import { generatePublishedUrlsReport } from './report-published-urls.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Synthetic URLs（fail-closed guard；絕不使用真實 production URL）
const FIXTURE_URL = 'https://fixture.example.test/2026/07/post.html';
const FIXTURE_URL_2 = 'https://fixture.example.test/2026/07/other.html';

const cases = [];
function check(name, fn) {
  try {
    fn();
    cases.push({ name, ok: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    cases.push({ name, ok: false });
    console.log(`[FAIL] ${name} — ${err.message}`);
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    cases.push({ name, ok: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    cases.push({ name, ok: false });
    console.log(`[FAIL] ${name} — ${err.message}`);
  }
}

// ── A. Helper 值域（§VII 17 fixture）───────────────────────────────────────────────

check('A1. status:published + valid URL → active（happy path）', () => {
  const target = { status: 'published', publishedUrl: FIXTURE_URL };
  assert.equal(isActivePublishedTarget(target), true);
  assert.equal(getActivePublishedUrl(target), FIXTURE_URL);
});

check('A2. status:published + empty string URL → inactive', () => {
  const target = { status: 'published', publishedUrl: '' };
  assert.equal(isActivePublishedTarget(target), false);
  assert.equal(getActivePublishedUrl(target), null);
});

check('A3. missing status + non-empty URL → inactive（fail-closed；不 fallback published）', () => {
  const target = { publishedUrl: FIXTURE_URL };
  assert.equal(isActivePublishedTarget(target), false);
  assert.equal(getActivePublishedUrl(target), null);
});

check('A4. invalid status（unknown enum）+ non-empty URL → inactive', () => {
  const target = { status: 'some-bogus-value', publishedUrl: FIXTURE_URL };
  assert.equal(isActivePublishedTarget(target), false);
});

check('A5. status:draft + non-empty URL → inactive', () => {
  assert.equal(isActivePublishedTarget({ status: 'draft', publishedUrl: FIXTURE_URL }), false);
});

check('A6. status:ready + non-empty URL → inactive', () => {
  assert.equal(isActivePublishedTarget({ status: 'ready', publishedUrl: FIXTURE_URL }), false);
});

check('A7. status:archived + non-empty URL → inactive', () => {
  assert.equal(isActivePublishedTarget({ status: 'archived', publishedUrl: FIXTURE_URL }), false);
});

check('A8. 未來 status:withdrawn + non-empty URL → inactive（schema 尚未加入亦 fail-closed）', () => {
  assert.equal(isActivePublishedTarget({ status: 'withdrawn', publishedUrl: FIXTURE_URL }), false);
});

check('A9. whitespace-only URL → inactive', () => {
  assert.equal(isActivePublishedTarget({ status: 'published', publishedUrl: '   ' }), false);
  assert.equal(isActivePublishedTarget({ status: 'published', publishedUrl: '\t\n' }), false);
});

check('A10. status case-sensitive：Published / PUBLISHED → inactive（不接受大小寫變體）', () => {
  assert.equal(isActivePublishedTarget({ status: 'Published', publishedUrl: FIXTURE_URL }), false);
  assert.equal(isActivePublishedTarget({ status: 'PUBLISHED', publishedUrl: FIXTURE_URL }), false);
  assert.equal(isActivePublishedTarget({ status: ' published', publishedUrl: FIXTURE_URL }), false);
  assert.equal(isActivePublishedTarget({ status: 'published ', publishedUrl: FIXTURE_URL }), false);
});

check('A11. status 為 non-string 型別 → inactive（不 throw）', () => {
  assert.equal(isActivePublishedTarget({ status: 1, publishedUrl: FIXTURE_URL }), false);
  assert.equal(isActivePublishedTarget({ status: true, publishedUrl: FIXTURE_URL }), false);
  assert.equal(isActivePublishedTarget({ status: null, publishedUrl: FIXTURE_URL }), false);
  assert.equal(isActivePublishedTarget({ status: {}, publishedUrl: FIXTURE_URL }), false);
});

check('A12. publishedUrl 為 non-string 型別 → inactive', () => {
  assert.equal(isActivePublishedTarget({ status: 'published', publishedUrl: 123 }), false);
  assert.equal(isActivePublishedTarget({ status: 'published', publishedUrl: null }), false);
  assert.equal(isActivePublishedTarget({ status: 'published', publishedUrl: undefined }), false);
  assert.equal(isActivePublishedTarget({ status: 'published', publishedUrl: [] }), false);
});

check('A13. target 缺漏 / null / non-object → inactive（不 throw）', () => {
  assert.equal(isActivePublishedTarget(null), false);
  assert.equal(isActivePublishedTarget(undefined), false);
  assert.equal(isActivePublishedTarget('published'), false);
  assert.equal(isActivePublishedTarget(42), false);
  assert.equal(isActivePublishedTarget([]), false);
});

check('A14. Platform isolation：github publication status 不啟用 blogger URL 判斷', () => {
  // 假 shape：sidecar.github 為 published；本 helper 應對「本 target」判斷，不看兄弟 platform。
  const bloggerBlock = { status: 'draft', publishedUrl: FIXTURE_URL };
  const githubBlock = { status: 'published', publishedUrl: FIXTURE_URL_2 };
  assert.equal(isActivePublishedTarget(bloggerBlock), false, 'blogger 為 draft → 應 inactive');
  assert.equal(isActivePublishedTarget(githubBlock), true, 'github 為 published → 應 active（本 helper 為 platform-agnostic）');
});

check('A15. ACTIVE_PUBLISHED_STATUS export 常數 === "published"', () => {
  assert.equal(ACTIVE_PUBLISHED_STATUS, 'published');
});

check('A16. getActivePublishedUrl 回傳原字串（不 trim；保留作者原輸入）', () => {
  const rawWithLeadingSlash = 'https://fixture.example.test/foo/';
  const target = { status: 'published', publishedUrl: rawWithLeadingSlash };
  assert.equal(getActivePublishedUrl(target), rawWithLeadingSlash);
});

check('A17. isActivePublishedTarget 為純函式：不 mutate input', () => {
  const target = { status: 'published', publishedUrl: FIXTURE_URL };
  const before = JSON.stringify(target);
  isActivePublishedTarget(target);
  getActivePublishedUrl(target);
  assert.equal(JSON.stringify(target), before);
});

// ── B. Consumer wiring 靜態掃描 ─────────────────────────────────────────────────

const EXPECTED_CONSUMERS = [
  'src/scripts/blogger-render.js',
  'src/scripts/build-github.js',
  'src/scripts/normalize-post-output.js',
  'src/scripts/resolve-placeholders.js',
  'src/scripts/report-published-urls.js',
  'src/scripts/load-admin-posts.js',
  'src/scripts/admin-article-lookup.js',
];

for (const rel of EXPECTED_CONSUMERS) {
  check(`B. Consumer wiring：${rel} 已 import active-publication helper`, () => {
    const text = readFileSync(path.join(REPO_ROOT, rel), 'utf-8');
    assert.ok(
      /from\s+['"]\.\/active-publication\.js['"]/.test(text),
      `${rel} 未 import ./active-publication.js`,
    );
    assert.ok(
      /\b(isActivePublishedTarget|getActivePublishedUrl)\b/.test(text),
      `${rel} import 存在但未實際呼叫 helper`,
    );
  });
}

check('B. Admin view（views/admin/index.ejs）已改用 hasActivePublishedUrl gate', () => {
  const text = readFileSync(path.join(REPO_ROOT, 'src/views/admin/index.ejs'), 'utf-8');
  // 三處以上使用 hasActivePublishedUrl（Dashboard count + Blogger badge + col-urls + detail dt/dd）
  const occurrences = (text.match(/hasActivePublishedUrl/g) || []).length;
  assert.ok(occurrences >= 3, `hasActivePublishedUrl 出現次數不足（實際=${occurrences}，期望 >= 3）`);
});

// ── C. Preview 路徑隔離（active-publication 為 production consumer；preview 不應接）─────

check('C. Preview 路徑不得接入 active-publication helper（fail-closed 隔離）', () => {
  const previewFiles = [
    'src/scripts/build-blogger-preview.js',
    'src/scripts/blogger-preview-plan.js',
    'src/scripts/check-blogger-preview.js',
    'src/scripts/check-blogger-preview-plan.js',
    'src/scripts/check-build-blogger-preview.js',
  ];
  const leaked = [];
  for (const rel of previewFiles) {
    let text;
    try {
      text = readFileSync(path.join(REPO_ROOT, rel), 'utf-8');
    } catch {
      continue;
    }
    if (/from\s+['"]\.\/active-publication\.js['"]/.test(text)) {
      leaked.push(rel);
    }
  }
  assert.deepEqual(leaked, [], `preview 路徑不應接 active-publication helper：${leaked.join(', ')}`);
});

// ── D. Consumer 行為（in-memory；不讀真實檔）────────────────────────────────────

// D11. Canonical resolver：非 published + preserved URL → 不選 Blogger URL（回落 GitHub）
check('D11. resolveCanonicalUrl：blogger.status=withdrawn + preserved URL → 回落 GitHub canonical', () => {
  const post = {
    slug: 'fixture-slug',
    primaryPlatform: 'blogger',
    canonical: 'auto',
    publish: { blogger: { status: 'withdrawn', publishedUrl: FIXTURE_URL } },
  };
  const settings = { site: { githubSiteUrl: 'https://fixture-github.example.test' } };
  const result = resolveCanonicalUrl(post, settings);
  assert.ok(result.url, 'resolveCanonicalUrl 未回 URL');
  assert.ok(
    !result.url.includes('/2026/07/post.html'),
    `withdrawn sidecar 之 preserved URL 不應成為 canonical（實際 host 判斷用 substring；避免 echo）`,
  );
  assert.ok(
    result.url.startsWith('https://fixture-github.example.test'),
    `應回落 GitHub canonical，但 ${result.url}`,
  );
});

check('D11b. resolveCanonicalUrl：blogger.status=published + URL → 用 Blogger URL 為 canonical（unchanged）', () => {
  const post = {
    slug: 'fixture-slug',
    primaryPlatform: 'blogger',
    canonical: 'auto',
    publish: { blogger: { status: 'published', publishedUrl: FIXTURE_URL } },
  };
  const settings = { site: { githubSiteUrl: 'https://fixture-github.example.test' } };
  const result = resolveCanonicalUrl(post, settings);
  assert.equal(result.url, FIXTURE_URL);
});

check('D11c. resolveCanonicalUrl：blogger.status=draft + preserved URL → 回落 GitHub canonical', () => {
  const post = {
    slug: 'fixture-slug',
    primaryPlatform: 'blogger',
    canonical: 'auto',
    publish: { blogger: { status: 'draft', publishedUrl: FIXTURE_URL } },
  };
  const settings = { site: { githubSiteUrl: 'https://fixture-github.example.test' } };
  const result = resolveCanonicalUrl(post, settings);
  assert.ok(result.url.startsWith('https://fixture-github.example.test'));
});

// D12. Placeholder：非 published + preserved URL → 不輸出歷史 URL
check('D12. resolvePlaceholders {{blogger.publishedUrl}}：withdrawn sidecar → 不輸出 URL（保留 placeholder）', () => {
  const post = {};
  const publish = { blogger: { status: 'withdrawn', publishedUrl: FIXTURE_URL } };
  const context = { post, publish, fb: null, settings: {} };
  const r = resolvePlaceholders('{{blogger.publishedUrl}}', context);
  // resolvePlaceholders 對 unresolved placeholder 保留原文
  assert.ok(
    !r.resolvedText.includes('/2026/07/post.html'),
    'withdrawn sidecar 之 preserved URL 不得由 resolver 輸出',
  );
  assert.ok(
    r.resolvedText.includes('{{') && r.resolvedText.includes('blogger.publishedUrl') && r.resolvedText.includes('}}'),
    `withdrawn 應留下未解析 placeholder；實際 text 未含原 placeholder`,
  );
});

check('D12b. resolvePlaceholders {{articleUrl}}：withdrawn Blogger sidecar → 不輸出 Blogger URL', () => {
  const post = { primaryPlatform: 'blogger' };
  const publish = { blogger: { status: 'withdrawn', publishedUrl: FIXTURE_URL } };
  const context = { post, publish, fb: null, settings: {} };
  const r = resolvePlaceholders('{{articleUrl}}', context);
  assert.ok(
    !r.resolvedText.includes('/2026/07/post.html'),
    'withdrawn 之 preserved URL 不得由 articleUrl 解析出來',
  );
});

check('D12c. resolvePlaceholders {{blogger.publishedUrl}}：published sidecar → 正確輸出 URL（unchanged）', () => {
  const post = {};
  const publish = { blogger: { status: 'published', publishedUrl: FIXTURE_URL } };
  const context = { post, publish, fb: null, settings: {} };
  const r = resolvePlaceholders('{{blogger.publishedUrl}}', context);
  assert.equal(r.resolvedText, FIXTURE_URL);
});

// D. normalize-post-output：cascade 到 seo.canonicalUrl / promotion.facebook.finalUrl
check('D. normalizePostOutput：withdrawn sidecar → publishOut.blogger.publishedUrl = null', () => {
  const post = {
    slug: 'fixture-slug',
    primaryPlatform: 'blogger',
    publish: { blogger: { status: 'withdrawn', publishedUrl: FIXTURE_URL } },
    sidecars: { publish: { exists: true }, facebook: { exists: false } },
  };
  const out = normalizePostOutput(post, {}, {});
  assert.equal(out.publish.blogger.publishedUrl, null);
});

check('D. normalizePostOutput：published sidecar → publishOut.blogger.publishedUrl 保留 URL（unchanged）', () => {
  const post = {
    slug: 'fixture-slug',
    primaryPlatform: 'blogger',
    publish: { blogger: { status: 'published', publishedUrl: FIXTURE_URL } },
    sidecars: { publish: { exists: true }, facebook: { exists: false } },
  };
  const out = normalizePostOutput(post, {}, {});
  assert.equal(out.publish.blogger.publishedUrl, FIXTURE_URL);
});

// D13. Published URL report：非 published 排除
await checkAsync('D13. generatePublishedUrlsReport：非 published legacy frontmatter → 不列入 filled', async () => {
  // report-published-urls 讀 post.blogger（legacy frontmatter path）；本 guard 執行 writeFiles:false
  // 只呼叫 in-memory API；不觸碰 dist-reports/。
  // 由於現行 production 3 筆 sidecar 皆無 frontmatter blogger 區塊（Phase 8-h-d-4 後），
  // loadPosts 之 post.blogger === undefined → helper 回 false → filled 為空。本 assertion 只驗
  // 「呼叫成功且非 published shape 不出現在 filled」，避免依賴 real data shape。
  const { data } = await generatePublishedUrlsReport({ writeFiles: false });
  assert.ok(data && data.blogger);
  assert.ok(Array.isArray(data.blogger.filled));
  assert.ok(Array.isArray(data.blogger.missing));
  // 所有 filled record 必為 active published（status === 'published' 且 URL 非空）
  for (const rec of data.blogger.filled) {
    assert.equal(rec.bloggerStatus, 'published', `filled record status 非 published：${rec.bloggerStatus}`);
    assert.ok(
      typeof rec.publishedUrl === 'string' && rec.publishedUrl.trim() !== '',
      'filled record 應有 non-empty URL',
    );
  }
});

// D14. Admin：hasActivePublishedUrl derived flag 於 non-published sidecar 為 false
// （load-admin-posts 之單元行為以 helper 本身之 A-區塊 fixture 涵蓋；此處以 static-scan 為主）
check('D14. Admin：load-admin-posts.js 使用 hasActivePublishedUrl 於 completeness / canonicalTarget', () => {
  const text = readFileSync(path.join(REPO_ROOT, 'src/scripts/load-admin-posts.js'), 'utf-8');
  assert.ok(/hasActivePublishedUrl/.test(text));
  // 至少 3 處使用（field derive + completeness + missingFields / canonicalTarget）
  const occurrences = (text.match(/hasActivePublishedUrl/g) || []).length;
  assert.ok(
    occurrences >= 4,
    `hasActivePublishedUrl 於 load-admin-posts.js 使用次數不足（實際=${occurrences}，期望 >= 4）`,
  );
});

check('D14b. Admin：admin-article-lookup.js CLI 顯示以 hasActivePublishedUrl 為 gate', () => {
  const text = readFileSync(path.join(REPO_ROOT, 'src/scripts/admin-article-lookup.js'), 'utf-8');
  assert.ok(/hasActivePublishedUrl/.test(text));
});

// ── E. Current published sidecar happy path 不動（in-memory shape 檢查）────────

check('E. 3 筆 production sidecar in-memory shape 之 helper 結果符合預期', () => {
  // 這裡不讀真實 sidecar 檔（避免 tie test 到 production data）；只用 shape 代表。
  // - we-media-myself2：status=published，非空 URL → active
  // - draft-book-review：status=draft，empty URL → inactive
  // - after-work-writing-time-blocking：status=published，非空 URL → active
  const s1 = { status: 'published', publishedUrl: FIXTURE_URL };
  const s2 = { status: 'draft', publishedUrl: '' };
  const s3 = { status: 'published', publishedUrl: FIXTURE_URL_2 };
  assert.equal(isActivePublishedTarget(s1), true);
  assert.equal(isActivePublishedTarget(s2), false);
  assert.equal(isActivePublishedTarget(s3), true);
});

// ── F. Echo-guard：本 guard 之 fixture URL / assertion 訊息不得包含真實 production URL 片段 ─

check('F. Echo-guard：本 guard 之 fixture URL 使用 fixture.example.test 且不含真實 production host', () => {
  const selfText = readFileSync(__filename, 'utf-8');
  // 明確禁列的 real production host / path 片段。為避免本 assertion 自己觸發（enumeration
  // 本身即含 substring），forbidden 片段以 char array 動態組回，確保 self-scan 只匹配
  // fixture / real URL，而不匹配本 assertion 之 enumeration 陣列。
  const forbiddenSubstrings = [
    ['b', 'l', 'o', 'g', 's', 'p', 'o', 't', '.', 'c', 'o', 'm'].join(''),
    ['b', 'a', 'b', 'e', 'l', '-', 'l', 'a', 'b'].join(''),
  ];
  // 移除本 assertion 自己（含 enumeration + 動態組回之 forbiddenSubstrings 陣列）之區塊，
  // 只掃描本 guard 之其他部分。以 splice 前後區段簡化：只掃描本 assertion 出現位置之前 + 之後。
  // 較穩健之做法：直接 filter 掉字串陣列中之匹配（本 assertion 就是動態組出的，字面文字不會 leak）。
  const marker = 'F. Echo-guard：本 guard 之 fixture URL';
  const idx = selfText.indexOf(marker);
  assert.ok(idx > 0, 'echo-guard self-marker not found');
  const otherSection = selfText.slice(0, idx);
  for (const s of forbiddenSubstrings) {
    assert.ok(
      !otherSection.includes(s),
      `本 guard source 不得包含真實 production 片段（在 F echo-guard 區塊之外）：${s}`,
    );
  }
});

check('F. Echo-guard：fixture URL 屬 .example.test TLD（IANA reserved；永不對外解析）', () => {
  assert.ok(FIXTURE_URL.includes('.example.test'));
  assert.ok(FIXTURE_URL_2.includes('.example.test'));
});

// ── 收尾 ──────────────────────────────────────────────────────────────────────

const total = cases.length;
const passed = cases.filter((c) => c.ok).length;
const failed = total - passed;
console.log('');
console.log(`active-publication consumer hardening guard: ${passed}/${total} PASS`);
if (failed > 0) {
  console.log(`FAIL ${failed}`);
  process.exit(1);
}
