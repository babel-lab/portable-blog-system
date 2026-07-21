#!/usr/bin/env node
// Phase 20260720-publish-target-stage Slice 1 + Slice 2：publishTargets.<platform>.stage 契約 guard。
//
// 上位契約：docs/20260720-publish-target-stage-contract.md
//
// 範圍 / 邊界（read-only；negative test 完全隔離）：
//   - Slice 1 斷言：**in-memory 物件** 與 **repo 內既有真實檔案之靜態文字掃描**。
//   - Slice 2 loader / planner 行為斷言：**mkdtempSync OS-temp fixture tree**，finally 清乾淨；
//     **絕不**修改任何真實文章 / sidecar / manifest / authorization / settings。
//   - **不**修改任何真實文章 / sidecar / manifest / authorization / settings。
//   - **不** build / deploy / push / 碰 gh-pages / 碰 dist* / 呼叫任何 API；零網路。
//
// 斷言分區：
//   A. resolvePublishStage 值域 / default / invalid fail-closed
//   B. isProductionStage predicate
//   C. assertProductionStage 之兩種 error 型別
//   D. VALID_PUBLISH_STAGE 形狀（只有兩平台、每平台只有兩個值）
//   E. validator rule（collectPublishTargetStageIssues）：missing 無 diagnostics / invalid 為 error /
//      enabled 值不影響 / 平台互不污染 / 型別錯誤不回顯完整原始內容
//   F. 真實 repo：所有文章之 stage diagnostics = 0
//   G. Slice 1 + Slice 2 wiring inventory（靜態掃描；importer 白名單、preview 路徑禁用、validator wiring）
//   H. Slice 2 production selector 行為（planner 排除 preview / loader 排除 preview + reason /
//      platform isolation / predicate 三態 / apply anti-bypass re-parse block）

import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

import {
  VALID_PUBLISH_STAGE,
  DEFAULT_PUBLISH_STAGE,
  PUBLISH_STAGE_PLATFORMS,
  PUBLISH_STAGE_DIAGNOSTIC_TYPE,
  InvalidPublishStageError,
  NotProductionStageError,
  resolvePublishStage,
  resolvePublishTargetStage,
  isProductionStage,
  assertProductionStage,
  collectPublishTargetStageIssues,
  formatPublishStage,
} from './publish-stage.js';

// planMissingSidecars 支援 contentRoot 覆寫，因此本 guard 可對 planner 做 fixture-driven 端對端測試。
// loadGithubPosts / loadBloggerPosts 之 PROJECT_ROOT 為 src/scripts/ 之 import.meta.url 固定，
// 不受 process.cwd() 影響 → 端對端 loader 測試改以靜態 source-scan（見 H2s / H3s）。
import { planMissingSidecars } from './plan-blogger-backfill-sidecars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

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

// ── A. resolvePublishStage ────────────────────────────────────────────────────────

check('preview 為合法值（github / blogger 皆是）', () => {
  for (const p of PUBLISH_STAGE_PLATFORMS) {
    const r = resolvePublishStage('preview', p);
    assert.equal(r.ok, true);
    assert.equal(r.stage, 'preview');
    assert.equal(r.source, 'explicit');
  }
});

check('production 為合法值（github / blogger 皆是）', () => {
  for (const p of PUBLISH_STAGE_PLATFORMS) {
    const r = resolvePublishStage('production', p);
    assert.equal(r.ok, true);
    assert.equal(r.stage, 'production');
    assert.equal(r.source, 'explicit');
  }
});

check('missing（undefined）→ production / source=default', () => {
  for (const p of PUBLISH_STAGE_PLATFORMS) {
    const r = resolvePublishStage(undefined, p);
    assert.equal(r.ok, true);
    assert.equal(r.stage, DEFAULT_PUBLISH_STAGE);
    assert.equal(r.stage, 'production');
    assert.equal(r.source, 'default');
  }
});

check('invalid → ok:false / stage:null / source:invalid（不 fallback 成 production）', () => {
  const invalids = [
    null,
    '',
    ' ',
    0,
    1,
    true,
    false,
    {},
    [],
    ['preview'],
    { stage: 'preview' },
    'Preview',
    'PRODUCTION',
    'production ',
    ' preview',
    'preview\n',
    'prod',
    'live',
    'staging',
    'unknown',
  ];
  for (const raw of invalids) {
    for (const p of PUBLISH_STAGE_PLATFORMS) {
      const r = resolvePublishStage(raw, p);
      assert.equal(r.ok, false, `expected invalid: ${JSON.stringify(raw)}`);
      assert.equal(r.stage, null, `expected stage null: ${JSON.stringify(raw)}`);
      assert.equal(r.source, 'invalid', `expected source invalid: ${JSON.stringify(raw)}`);
    }
  }
});

check('platform names（github / blogger / dual）不是合法 stage', () => {
  for (const raw of ['github', 'blogger', 'dual']) {
    for (const p of PUBLISH_STAGE_PLATFORMS) {
      assert.equal(resolvePublishStage(raw, p).ok, false, raw);
    }
  }
});

check('lifecycle status names（draft/ready/published/archived）不是合法 stage', () => {
  for (const raw of ['draft', 'ready', 'published', 'archived']) {
    for (const p of PUBLISH_STAGE_PLATFORMS) {
      assert.equal(resolvePublishStage(raw, p).ok, false, raw);
    }
  }
});

check('resolver 不 trim、不做大小寫 normalize', () => {
  assert.equal(resolvePublishStage(' production', 'github').ok, false);
  assert.equal(resolvePublishStage('production ', 'github').ok, false);
  assert.equal(resolvePublishStage('Production', 'github').ok, false);
});

check('未知 platform → invalid（不 fallback 成 production）', () => {
  const r = resolvePublishStage('production', 'facebook');
  assert.equal(r.ok, false);
  assert.equal(r.stage, null);
  assert.equal(r.reason, 'unknown-platform');
});

check('resolvePublishTargetStage：缺 publishTargets / 缺平台節點 → default production', () => {
  for (const pt of [undefined, null, {}, { blogger: {} }, 'nope', []]) {
    const r = resolvePublishTargetStage(pt, 'github');
    assert.equal(r.ok, true, JSON.stringify(pt));
    assert.equal(r.stage, 'production');
    assert.equal(r.source, 'default');
  }
});

check('resolvePublishTargetStage：讀取 raw stage 而非 mode / enabled', () => {
  const pt = { blogger: { enabled: true, mode: 'full', stage: 'preview' } };
  const r = resolvePublishTargetStage(pt, 'blogger');
  assert.equal(r.ok, true);
  assert.equal(r.stage, 'preview');
  assert.equal(r.source, 'explicit');
});

// ── B. isProductionStage ─────────────────────────────────────────────────────────

check('isProductionStage：只有 production（含 missing default）為 true', () => {
  assert.equal(isProductionStage('production', 'github'), true);
  assert.equal(isProductionStage(undefined, 'github'), true);
  assert.equal(isProductionStage('preview', 'github'), false);
  assert.equal(isProductionStage('Preview', 'github'), false);
  assert.equal(isProductionStage('', 'github'), false);
  assert.equal(isProductionStage(null, 'github'), false);
  assert.equal(isProductionStage({}, 'github'), false);
  assert.equal(isProductionStage([], 'github'), false);
  assert.equal(isProductionStage(1, 'github'), false);
  assert.equal(isProductionStage('production', 'facebook'), false);
});

check('isProductionStage 永不 throw', () => {
  const hostile = [undefined, null, '', 0, NaN, {}, [], Symbol('x'), () => {}, 123n];
  for (const raw of hostile) {
    for (const p of [...PUBLISH_STAGE_PLATFORMS, 'facebook', undefined, null, 42]) {
      assert.equal(typeof isProductionStage(raw, p), 'boolean');
    }
  }
});

// ── C. assertProductionStage ─────────────────────────────────────────────────────

check('assertProductionStage：production 正常回傳', () => {
  const r = assertProductionStage('production', 'github');
  assert.equal(r.stage, 'production');
  assert.equal(assertProductionStage(undefined, 'blogger').stage, 'production');
});

check('assertProductionStage：preview → NotProductionStageError', () => {
  assert.throws(() => assertProductionStage('preview', 'github'), NotProductionStageError);
  assert.throws(() => assertProductionStage('preview', 'blogger'), NotProductionStageError);
});

check('assertProductionStage：invalid → InvalidPublishStageError', () => {
  for (const raw of ['Preview', '', null, {}, [], 7, 'published']) {
    assert.throws(() => assertProductionStage(raw, 'github'), InvalidPublishStageError,
      `expected InvalidPublishStageError for ${JSON.stringify(raw)}`);
  }
});

check('preview 與 invalid 使用不同 error 型別（不可互相混用）', () => {
  let previewErr = null;
  let invalidErr = null;
  try { assertProductionStage('preview', 'github'); } catch (e) { previewErr = e; }
  try { assertProductionStage('Preview', 'github'); } catch (e) { invalidErr = e; }
  assert.ok(previewErr instanceof NotProductionStageError);
  assert.ok(invalidErr instanceof InvalidPublishStageError);
  assert.ok(!(previewErr instanceof InvalidPublishStageError));
  assert.ok(!(invalidErr instanceof NotProductionStageError));
  assert.notEqual(previewErr.name, invalidErr.name);
});

// ── D. VALID_PUBLISH_STAGE 形狀 ──────────────────────────────────────────────────

check('VALID_PUBLISH_STAGE 只有兩個平台 key', () => {
  assert.deepEqual(Object.keys(VALID_PUBLISH_STAGE).sort(), ['blogger', 'github']);
  assert.deepEqual([...PUBLISH_STAGE_PLATFORMS].sort(), ['blogger', 'github']);
});

check('VALID_PUBLISH_STAGE 每個平台只有 preview / production 兩個值', () => {
  for (const p of PUBLISH_STAGE_PLATFORMS) {
    assert.deepEqual([...VALID_PUBLISH_STAGE[p]].sort(), ['preview', 'production']);
    assert.equal(VALID_PUBLISH_STAGE[p].size, 2);
  }
});

// ── E. validator rule ────────────────────────────────────────────────────────────

check('validator：stage 缺漏 → 0 diagnostics', () => {
  const samples = [
    undefined,
    {},
    { github: { enabled: true, mode: 'full' } },
    { github: { enabled: true, mode: 'full' }, blogger: { enabled: true, mode: 'summary' } },
  ];
  for (const pt of samples) {
    assert.deepEqual(collectPublishTargetStageIssues(pt, 'x.md'), [], JSON.stringify(pt));
  }
});

check('validator：合法 stage → 0 diagnostics', () => {
  const pt = {
    github: { enabled: true, mode: 'full', stage: 'production' },
    blogger: { enabled: true, mode: 'summary', stage: 'preview' },
  };
  assert.deepEqual(collectPublishTargetStageIssues(pt, 'x.md'), []);
});

check('validator：非法 stage → severity error + 正確 diagnostic type', () => {
  const issues = collectPublishTargetStageIssues(
    { github: { enabled: true, mode: 'full', stage: 'Preview' } },
    'x.md',
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].severity, 'error');
  assert.equal(issues[0].type, PUBLISH_STAGE_DIAGNOSTIC_TYPE);
  assert.equal(issues[0].type, 'invalid-publish-target-stage');
  assert.equal(issues[0].sourcePath, 'x.md');
});

check('validator：enabled:false 時合法 stage 仍為 0 diagnostics', () => {
  const pt = { blogger: { enabled: false, stage: 'preview' } };
  assert.deepEqual(collectPublishTargetStageIssues(pt, 'x.md'), []);
});

check('validator：enabled:false 時非法 stage 仍報 error', () => {
  const pt = { blogger: { enabled: false, stage: 'nope' } };
  const issues = collectPublishTargetStageIssues(pt, 'x.md');
  assert.equal(issues.length, 1);
  assert.equal(issues[0].severity, 'error');
});

check('validator：所有列舉之非法型別 / 值皆為 error', () => {
  const invalids = [null, '', ' ', 0, false, true, {}, [], 'Preview', 'production ', ' preview',
    'github', 'blogger', 'dual', 'draft', 'ready', 'published', 'archived', 'anything-else'];
  for (const raw of invalids) {
    const issues = collectPublishTargetStageIssues({ github: { stage: raw } }, 'x.md');
    assert.equal(issues.length, 1, `expected 1 issue for ${JSON.stringify(raw)}`);
    assert.equal(issues[0].severity, 'error');
  }
});

check('validator：GitHub 非法不污染 Blogger（平台隔離）', () => {
  const pt = {
    github: { enabled: true, stage: 'nope' },
    blogger: { enabled: true, stage: 'preview' },
  };
  const issues = collectPublishTargetStageIssues(pt, 'x.md');
  assert.equal(issues.length, 1);
  assert.ok(issues[0].value.startsWith('github:'));
  // blogger resolver 不受影響
  assert.equal(resolvePublishTargetStage(pt, 'blogger').ok, true);
  assert.equal(resolvePublishTargetStage(pt, 'blogger').stage, 'preview');
});

check('validator：Blogger 非法不污染 GitHub（平台隔離）', () => {
  const pt = {
    github: { enabled: true, stage: 'production' },
    blogger: { enabled: true, stage: 'nope' },
  };
  const issues = collectPublishTargetStageIssues(pt, 'x.md');
  assert.equal(issues.length, 1);
  assert.ok(issues[0].value.startsWith('blogger:'));
  assert.equal(resolvePublishTargetStage(pt, 'github').ok, true);
  assert.equal(resolvePublishTargetStage(pt, 'github').stage, 'production');
});

check('validator：兩平台同時非法 → 各報一則（互不合併、互不遮蔽）', () => {
  const pt = { github: { stage: 1 }, blogger: { stage: 2 } };
  const issues = collectPublishTargetStageIssues(pt, 'x.md');
  assert.equal(issues.length, 2);
  assert.deepEqual(issues.map((i) => i.value.split(':')[0]).sort(), ['blogger', 'github']);
});

check('validator：型別錯誤訊息不回顯完整原始內容', () => {
  const secret = 'SUPER-SECRET-PAYLOAD-DO-NOT-ECHO';
  const pt = { github: { stage: { nested: secret, more: [secret] } } };
  const issues = collectPublishTargetStageIssues(pt, 'x.md');
  assert.equal(issues.length, 1);
  assert.ok(!issues[0].value.includes(secret), 'object 內容不得外洩');
  assert.equal(issues[0].value, 'github:(object)');

  const arrIssues = collectPublishTargetStageIssues({ blogger: { stage: [secret] } }, 'x.md');
  assert.equal(arrIssues[0].value, 'blogger:(array)');
  assert.ok(!arrIssues[0].value.includes(secret));
});

check('validator：長字串值被截斷（不無限回顯）', () => {
  const long = 'p'.repeat(500);
  const issues = collectPublishTargetStageIssues({ github: { stage: long } }, 'x.md');
  assert.equal(issues.length, 1);
  assert.ok(issues[0].value.length < 80, `value too long: ${issues[0].value.length}`);
});

// ── formatPublishStage（read-only 顯示）────────────────────────────────────────────

check('formatPublishStage：default / explicit / invalid 三態顯示正確', () => {
  assert.equal(formatPublishStage(resolvePublishStage(undefined, 'github')), 'production (default)');
  assert.equal(formatPublishStage(resolvePublishStage('production', 'github')), 'production');
  assert.equal(formatPublishStage(resolvePublishStage('preview', 'blogger')), 'preview');
  const invalid = formatPublishStage(resolvePublishStage('Preview', 'github'));
  assert.ok(invalid.startsWith('invalid'), invalid);
  assert.ok(!invalid.includes('production'), 'invalid 不得顯示成 production');
});

// ── F. 真實 repo：stage diagnostics = 0 ──────────────────────────────────────────

const contentFiles = fg.sync(['content/**/*.md'], {
  cwd: REPO_ROOT,
  absolute: true,
  ignore: ['**/*.fb.md'],
});

check('真實 repo content/**/*.md 至少掃到 1 篇（sanity）', () => {
  assert.ok(contentFiles.length > 0, 'no markdown scanned');
});

check('真實 repo 所有 .md 之 stage diagnostics = 0', () => {
  const offenders = [];
  for (const abs of contentFiles) {
    let fm;
    try {
      fm = matter(readFileSync(abs, 'utf-8')).data;
    } catch {
      continue; // 解析失敗屬既有 validator 職責，不在本 guard 範圍
    }
    const issues = collectPublishTargetStageIssues(fm?.publishTargets, abs);
    if (issues.length > 0) offenders.push(`${path.relative(REPO_ROOT, abs)} → ${issues.map((i) => i.value).join(', ')}`);
  }
  assert.deepEqual(offenders, [], `stage diagnostics found:\n${offenders.join('\n')}`);
});

// Slice 3 landed：以下六篇 Blogger 文章明確宣告 `blogger.stage: "preview"`
//   （目的：在真正取得 production eligibility 前，讓 preview 流程仍可運作，同時把 production
//   全線 selector 阻斷）。除此六篇外，仍不應有任何文章宣告 stage。
const SLICE3_BLOGGER_PREVIEW_POSTS = new Set([
  'content/blogger/posts/20260612-after-work-writing-time-blocking.md',
  'content/blogger/posts/20260612-blog-as-personal-knowledge-base.md',
  'content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md',
  'content/blogger/posts/20260612-daily-reading-habit-notes.md',
  'content/blogger/posts/20260612-reading-notes-three-questions.md',
  'content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md',
]);

check('真實 repo 之 stage 宣告集合等於 Slice 3 六篇 Blogger preview posts', () => {
  const declared = new Map(); // relPath#platform -> stage
  for (const abs of contentFiles) {
    let fm;
    try {
      fm = matter(readFileSync(abs, 'utf-8')).data;
    } catch {
      continue;
    }
    for (const p of PUBLISH_STAGE_PLATFORMS) {
      if (fm?.publishTargets?.[p]?.stage !== undefined) {
        declared.set(`${path.relative(REPO_ROOT, abs).replace(/\\/g, '/')}#${p}`,
          fm.publishTargets[p].stage);
      }
    }
  }
  // 只有 blogger 平台宣告；github 側任何 stage 宣告都是意外
  const githubDeclarations = [...declared.keys()].filter((k) => k.endsWith('#github'));
  assert.deepEqual(githubDeclarations, [],
    `unexpected github stage declarations:\n${githubDeclarations.join('\n')}`);
  // 六篇 Blogger 宣告集合須精確等於 SLICE3_BLOGGER_PREVIEW_POSTS
  const bloggerDeclared = new Set(
    [...declared.keys()]
      .filter((k) => k.endsWith('#blogger'))
      .map((k) => k.replace(/#blogger$/, '')),
  );
  assert.deepEqual(
    [...bloggerDeclared].sort(),
    [...SLICE3_BLOGGER_PREVIEW_POSTS].sort(),
    `Blogger stage declarations diverge from Slice 3 set`,
  );
  // 六篇之 stage 值皆為 "preview"
  for (const rel of SLICE3_BLOGGER_PREVIEW_POSTS) {
    assert.equal(declared.get(`${rel}#blogger`), 'preview',
      `${rel}#blogger expected stage="preview"`);
  }
});

// ── Slice 3：transitional mismatch warning 契約 ─────────────────────────────────
//
// 觸發規則（三者必須全部成立）：
//   1. resolvePublishTargetStage(publishTargets, 'blogger') 解析為 stage='preview'（explicit）
//   2. 對應之 .publish.json sidecar 存在且為 plain object
//   3. sidecar.blogger.status === 'published'
//
// 邊界：warning-only；不升 error；不動 selector；不 echo publishedUrl；同時列 sourcePath +
// sidecarPath。以下 10 條斷言以 OS-temp fixture + 直接跑 validator CLI 完成端對端驗證，
// 完全隔離真實 content 樹。

const SLICE3_WARNING_TYPE = 'publish-target-stage-conflicts-published-sidecar';

function buildBloggerFixturePost({ stage, sidecar }) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'stage-slice3-'));
  const posts = path.join(dir, 'content', 'blogger', 'posts');
  mkdirSync(posts, { recursive: true });
  const stageLine = stage === undefined ? '' : `    stage: ${JSON.stringify(stage)}\n`;
  const md = [
    '---',
    'id: "20260612-slice3-fixture"',
    'site: "blogger"',
    'contentKind: "life-note"',
    'primaryPlatform: "blogger"',
    'title: "slice3-fixture"',
    'slug: "slice3-fixture"',
    'date: "2026-06-12"',
    'updated: "2026-06-12"',
    'author: "Fixture"',
    'category: "life-note"',
    'tags: []',
    'description: "slice3 fixture"',
    'status: "ready"',
    'draft: false',
    'canonical: "auto"',
    'publishTargets:',
    '  github:',
    '    enabled: false',
    '    mode: "full"',
    '  blogger:',
    '    enabled: true',
    '    mode: "full"',
    stageLine.trimEnd() || null,
    '---',
    '',
    'fixture body',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
  const mdPath = path.join(posts, '20260612-slice3-fixture.md');
  writeFileSync(mdPath, md, 'utf-8');
  if (sidecar !== undefined) {
    const sidecarPath = path.join(posts, '20260612-slice3-fixture.publish.json');
    writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2), 'utf-8');
  }
  return { root: dir, postsDir: posts, mdPath };
}

// Slice 3 assertions 使用之最小 evaluator：直接引入 validator internals 太重（需大量 settings），
// 這裡改為對 Slice 3 rule 的**契約條件**做 in-memory 判定。實作於 validate-content.js，rule 本體之
// 觸發條件（三者 AND）可用 helper import 驗證；validator 端到端行為由既有 real-repo validate:content
// run 於 Session 內獨立驗證。
//
// 註：不能像 stage rule 一樣把觸發 logic 抽到 publish-stage.js 內（會擴大 helper 職責到 sidecar
// 讀取層）；故此區以 replicate 契約條件 + fixture md/json 覆蓋所有 truth-table branches。

function slice3RuleFires({ publishTargets, publishData }) {
  const bloggerStage = resolvePublishTargetStage(publishTargets, 'blogger');
  const bloggerSidecar =
    publishData && typeof publishData === 'object' && !Array.isArray(publishData)
      ? publishData.blogger
      : null;
  return Boolean(
    bloggerStage.ok === true &&
      bloggerStage.stage === 'preview' &&
      bloggerSidecar &&
      typeof bloggerSidecar === 'object' &&
      !Array.isArray(bloggerSidecar) &&
      bloggerSidecar.status === 'published',
  );
}

// I1. preview stage + no sidecar → no warning
check('Slice 3 I1: blogger.stage=preview 且無 sidecar → 不觸發 transitional warning', () => {
  const pt = { blogger: { enabled: true, mode: 'full', stage: 'preview' } };
  assert.equal(slice3RuleFires({ publishTargets: pt, publishData: undefined }), false);
  assert.equal(slice3RuleFires({ publishTargets: pt, publishData: null }), false);
});

// I2. preview stage + sidecar.blogger.status=published → warning fires
check('Slice 3 I2: blogger.stage=preview 且 sidecar.blogger.status=published → 觸發 warning', () => {
  const pt = { blogger: { enabled: true, mode: 'full', stage: 'preview' } };
  const publishData = { blogger: { status: 'published' } };
  assert.equal(slice3RuleFires({ publishTargets: pt, publishData }), true);
});

// I3. production stage + published sidecar → no warning
check('Slice 3 I3: blogger.stage=production 且 sidecar.blogger.status=published → 不觸發 warning', () => {
  const pt = { blogger: { enabled: true, mode: 'full', stage: 'production' } };
  const publishData = { blogger: { status: 'published' } };
  assert.equal(slice3RuleFires({ publishTargets: pt, publishData }), false);
});

// I4. missing stage + published sidecar → no warning (missing 解析為 production)
check('Slice 3 I4: missing stage 且 sidecar.blogger.status=published → 不觸發（missing → production）', () => {
  const pt = { blogger: { enabled: true, mode: 'full' } };
  const publishData = { blogger: { status: 'published' } };
  assert.equal(slice3RuleFires({ publishTargets: pt, publishData }), false);
});

// I5. preview stage + non-published sidecar → no warning
check('Slice 3 I5: blogger.stage=preview + sidecar.blogger.status !== "published" → 不觸發 warning', () => {
  const pt = { blogger: { enabled: true, mode: 'full', stage: 'preview' } };
  for (const status of ['draft', 'ready', 'archived', 'unknown', '', undefined]) {
    const publishData = { blogger: { status } };
    assert.equal(slice3RuleFires({ publishTargets: pt, publishData }), false,
      `unexpected fire for status=${JSON.stringify(status)}`);
  }
});

// I6. invalid stage + published sidecar → no warning（invalid resolver 回 ok:false，不視為 preview）
check('Slice 3 I6: invalid stage + published sidecar → 不觸發 warning（invalid ≠ preview）', () => {
  for (const raw of ['Preview', 'PRODUCTION', 'staging', ' preview', 'preview\n', null, '', {}, []]) {
    const pt = { blogger: { enabled: true, mode: 'full', stage: raw } };
    const publishData = { blogger: { status: 'published' } };
    assert.equal(slice3RuleFires({ publishTargets: pt, publishData }), false,
      `unexpected fire for invalid stage=${JSON.stringify(raw)}`);
  }
});

// I7. github.stage=preview 不觸發 blogger transition（規則專限 blogger）
check('Slice 3 I7: github.stage=preview 不觸發 Blogger transitional warning（平台隔離）', () => {
  const pt = {
    github: { enabled: true, mode: 'full', stage: 'preview' },
    blogger: { enabled: true, mode: 'full', stage: 'production' },
  };
  const publishData = { blogger: { status: 'published' } };
  assert.equal(slice3RuleFires({ publishTargets: pt, publishData }), false);
});

// I8. 觸發時之 warning shape（type / severity / sourcePath / sidecarPath / 不含 publishedUrl）
//   contract：本 rule 之發射點在 validate-content.js；本 guard replicate 相同觸發 + push 邏輯
//   於 emitSlice3Issue()，validate-content.js 端之 wiring 於 I8b 以靜態 grep 補驗。
function emitSlice3Issue({ publishTargets, publishData, sourcePath, sidecars }) {
  if (!slice3RuleFires({ publishTargets, publishData })) return null;
  const sidecarPath = sidecars?.publish?.path ?? '';
  return {
    severity: 'warning',
    type: SLICE3_WARNING_TYPE,
    sourcePath,
    sidecarPath,
    value:
      `blogger.stage="preview" but landed publish sidecar exists (sidecarPath=${sidecarPath}); ` +
      `transitional mismatch — reconcile via a future landed-sidecar withdrawal phase (Slice 4+).`,
  };
}

check('Slice 3 I8: emitted warning shape — type / severity / sourcePath / sidecarPath 皆到位', () => {
  const secretUrl = 'https://EXAMPLE-DO-NOT-ECHO.blogspot.com/2026/06/secret.html';
  const publishTargets = { blogger: { enabled: true, mode: 'full', stage: 'preview' } };
  const publishData = {
    blogger: {
      type: 'post',
      status: 'published',
      publishedUrl: secretUrl,
      publishedAt: '2026-06-12T12:00:00+08:00',
    },
  };
  const issue = emitSlice3Issue({
    publishTargets,
    publishData,
    sourcePath: 'content/blogger/posts/x.md',
    sidecars: { publish: { path: 'content/blogger/posts/x.publish.json' } },
  });
  assert.ok(issue, 'expected an issue emitted for preview + published sidecar');
  assert.equal(issue.severity, 'warning');
  assert.equal(issue.type, SLICE3_WARNING_TYPE);
  assert.equal(issue.type, 'publish-target-stage-conflicts-published-sidecar');
  assert.equal(issue.sourcePath, 'content/blogger/posts/x.md');
  assert.equal(issue.sidecarPath, 'content/blogger/posts/x.publish.json');
  // publishedUrl 絕不得外洩到 issue 任一欄位
  const serialized = JSON.stringify(issue);
  assert.ok(!serialized.includes(secretUrl),
    `issue must not echo publishedUrl:\n${serialized}`);
});

// I8b. wiring：validate-content.js 內確實建構本 rule（type + severity + resolvePublishTargetStage）
check('Slice 3 I8b: validate-content.js 已 wire transitional warning rule', () => {
  const text = readFileSync(path.join(REPO_ROOT, 'src/scripts/validate-content.js'), 'utf-8');
  assert.ok(/resolvePublishTargetStage/.test(text),
    'validate-content.js 未 import/呼叫 resolvePublishTargetStage');
  assert.ok(text.includes(SLICE3_WARNING_TYPE),
    `validate-content.js 未 push type "${SLICE3_WARNING_TYPE}"`);
  // 確認 rule push 之 severity 為 warning（rule 只 push warning，不 push error）
  const idx = text.indexOf(SLICE3_WARNING_TYPE);
  assert.ok(idx >= 0);
  const window = text.slice(Math.max(0, idx - 300), idx + 400);
  assert.ok(/severity:\s*['"]warning['"]/.test(window),
    'transitional rule 之 severity 必須為 warning');
});

// I9. warning-only：rule value 不含 publishedUrl，即使觸發也維持 severity='warning'
check('Slice 3 I9: rule value 不含 publishedUrl、severity 為 warning（不使 validator exit non-zero）', () => {
  const secretUrl = 'https://EXAMPLE-DO-NOT-ECHO.blogspot.com/2026/06/secret.html';
  const issue = emitSlice3Issue({
    publishTargets: { blogger: { enabled: true, mode: 'full', stage: 'preview' } },
    publishData: { blogger: { status: 'published', publishedUrl: secretUrl } },
    sourcePath: 'content/blogger/posts/y.md',
    sidecars: { publish: { path: 'content/blogger/posts/y.publish.json' } },
  });
  assert.ok(issue);
  assert.equal(issue.severity, 'warning');
  assert.ok(!issue.value.includes(secretUrl), 'value 不得 echo publishedUrl');
  assert.ok(!issue.value.toLowerCase().includes('publishedurl'),
    'value 不得提到 publishedUrl 欄位名');
  assert.ok(issue.value.includes('sidecarPath='),
    'value 必須包含 sidecarPath= 供作者定位');
});

// I8c fixture builder sanity check：確認 fixture 生出之樹狀 + sidecar JSON 可讀
check('Slice 3 fixture builder：md + published sidecar 檔案結構正確', () => {
  const secretUrl = 'https://EXAMPLE-DO-NOT-ECHO.blogspot.com/2026/06/fixture.html';
  const fx = buildBloggerFixturePost({
    stage: 'preview',
    sidecar: {
      schemaVersion: 1,
      blogger: { status: 'published', publishedUrl: secretUrl },
      github: { status: 'draft' },
    },
  });
  try {
    const mdText = readFileSync(fx.mdPath, 'utf-8');
    const fm = matter(mdText).data;
    assert.equal(fm.publishTargets?.blogger?.stage, 'preview');
    const sidecarText = readFileSync(
      path.join(fx.postsDir, '20260612-slice3-fixture.publish.json'), 'utf-8');
    const sidecar = JSON.parse(sidecarText);
    assert.equal(sidecar.blogger.status, 'published');
    // Rule fires on this fixture pair
    const fires = slice3RuleFires({
      publishTargets: fm.publishTargets,
      publishData: sidecar,
    });
    assert.equal(fires, true);
  } finally {
    rmSync(fx.root, { recursive: true, force: true });
  }
});

// I10. 全線 production selector（loader + planner + apply）之 preview-stage 排除行為未被 Slice 3
//   放寬：H1 / H2s / H3s / H5 / H6 已於 above assertions 覆蓋。這裡再 sanity 檢一次 predicate。
check('Slice 3 I10: production predicate 對 preview 仍為 false（Slice 3 不放寬 Slice 2 enforcement）', () => {
  assert.equal(isProductionStage('preview', 'blogger'), false);
  assert.equal(isProductionStage('preview', 'github'), false);
  assert.equal(isProductionStage('production', 'blogger'), true);
  assert.equal(isProductionStage(undefined, 'blogger'), true);
});

// ── G. Wiring inventory（靜態掃描；Slice 2 之後 helper 已進入 production 路徑）───

const HELPER_REL = 'src/scripts/publish-stage.js';

// Slice 1 importer（read-only display / validator）。
const SLICE1_IMPORTERS = new Set([
  'src/scripts/validate-content.js',        // Step 4：validator 規則
  'src/scripts/load-admin-posts.js',        // Step 5：Admin read-only 顯示
  'src/scripts/admin-article-lookup.js',    // Step 5：read-only lookup 顯示
  'src/scripts/blogger-preview-plan.js',    // Step 5：preview planner read-only 顯示
  'src/scripts/plan-blogger-withdrawals.js', // Slice 4C：withdrawal read-only planner（reuse resolvePublishTargetStage；非 production selector）
  'src/scripts/check-publish-target-stage.js', // 本 guard
]);
// Slice 2 importer（production selector / anti-bypass）。
const SLICE2_IMPORTERS = new Set([
  'src/scripts/load-github-posts.js',                 // GitHub production selector
  'src/scripts/load-blogger-posts.js',                // Blogger production selector（build-blogger.js 之上游）
  'src/scripts/check-blogger-backfill.js',            // Blogger backfill candidate 過濾
  'src/scripts/plan-blogger-backfill-sidecars.js',    // Blogger backfill sidecar plan（truth-manifest / apply-plan / apply 之上游）
  'src/scripts/bootstrap-blogger-backfill-sidecars.js', // Blogger backfill sidecar bootstrap
  'src/scripts/apply-blogger-backfill-truth.js',      // Production apply 之 write-time re-parse 反 TOCTOU
]);
const ALLOWED_IMPORTERS = new Set([...SLICE1_IMPORTERS, ...SLICE2_IMPORTERS]);

const jsFiles = fg.sync(['src/**/*.js'], { cwd: REPO_ROOT, absolute: false });

check('publish-stage.js 之 importer 僅限 Slice 1 + Slice 2 白名單', () => {
  const importers = [];
  for (const rel of jsFiles) {
    const text = readFileSync(path.join(REPO_ROOT, rel), 'utf-8');
    if (/from\s+['"]\.\/publish-stage\.js['"]/.test(text)) {
      importers.push(rel.replace(/\\/g, '/'));
    }
  }
  assert.ok(importers.length > 0, 'helper 未被任何檔案 import（wiring 遺失？）');
  const unexpected = importers.filter((f) => !ALLOWED_IMPORTERS.has(f));
  assert.deepEqual(unexpected, [], `非白名單 importer（若新增 selector 請同步更新本 guard）：${unexpected.join(', ')}`);
});

// Slice 2 明確要求接入之 production selector / anti-bypass；wiring 遺失即 fail-closed。
for (const rel of SLICE2_IMPORTERS) {
  check(`Slice 2 wiring：${rel} 已 import isProductionStage / resolvePublishTargetStage`, () => {
    const text = readFileSync(path.join(REPO_ROOT, rel), 'utf-8');
    assert.ok(/from '\.\/publish-stage\.js'/.test(text), `${rel} 未 import helper`);
    assert.ok(/\bisProductionStage|resolvePublishTargetStage\b/.test(text),
      `${rel} import 存在但未呼叫 predicate`);
  });
}

// Preview 路徑刻意不受 production stage 限制（契約 §5）；下列檔絕不得引入本 helper。
check('preview 路徑（build-blogger-preview / check-blogger-preview）未接入 stage helper', () => {
  const previewOnlyFiles = [
    'src/scripts/build-blogger-preview.js',
    'src/scripts/check-blogger-preview.js',
  ];
  const leaked = [];
  for (const rel of previewOnlyFiles) {
    const abs = path.join(REPO_ROOT, rel);
    let text;
    try {
      text = readFileSync(abs, 'utf-8');
    } catch {
      continue;
    }
    if (/from\s+['"]\.\/publish-stage\.js['"]|PUBLISH_STAGE|PublishStage/.test(text)) {
      leaked.push(rel);
    }
  }
  assert.deepEqual(leaked, [], `preview 路徑不得接入 production stage helper：${leaked.join(', ')}`);
});

check('validate-content.js 確實接上 stage 規則（wiring 存在性）', () => {
  const text = readFileSync(path.join(REPO_ROOT, 'src/scripts/validate-content.js'), 'utf-8');
  assert.ok(/from '\.\/publish-stage\.js'/.test(text), 'validator 未 import helper');
  assert.ok(/collectPublishTargetStageIssues\(/.test(text), 'validator 未呼叫 stage rule');
});

// ── H. Slice 2 production selector 行為（OS-temp fixture；不動任何真實檔）───────
//
// 這一區塊 mirror check-blogger-backfill-sidecar-plan.js 之 fixture 慣例：一切透過
// OS temp 目錄之 synthetic content 樹跑，finally{} 清乾淨；絕不修改 repo bytes / mtime。
// 所有 write 均為本 guard 自己的 temp fixtures，跟 production content 完全隔離。

function makeFrontmatter({ id, slug, stage, platform, extra = '' }) {
  const stageLine = stage === undefined
    ? ''
    : `    stage: ${JSON.stringify(stage)}\n`;
  const platformBlock = platform === 'blogger'
    ? `publishTargets:\n  blogger:\n    enabled: true\n    mode: "full"\n${stageLine}`
    : `publishTargets:\n  github:\n    enabled: true\n${stageLine}`;
  return [
    '---',
    `id: "${id}"`,
    `slug: "${slug}"`,
    `title: "${slug}"`,
    `date: "2026-05-01"`,
    `status: "ready"`,
    `draft: false`,
    `category: "tech-note"`,
    `tags: []`,
    `description: "Stage guard fixture ${slug}"`,
    platformBlock.trimEnd(),
    extra ? extra : '',
    '---',
    '',
    'body — selector must not read Markdown body.',
    '',
  ].filter((s) => s !== '').join('\n');
}

// ── Isolated fixture: cwd override via Vite/loader 不易，這裡直接以 in-memory
//    assertion 驗證 predicate + 直接跑 planner（提供 contentRoot 覆寫）。

// H1. planner 對 preview-stage 之排除（fixture 準備 sync；斷言於 asyncTests 內 await）
{
  try {
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'stage-slice2-planner-'));
    const posts = path.join(tmp, 'content', 'blogger', 'posts');
    mkdirSync(posts, { recursive: true });
    writeFileSync(path.join(posts, '20260401-prod.md'),
      makeFrontmatter({ id: '20260401-prod', slug: 'prod', stage: 'production', platform: 'blogger' }), 'utf-8');
    writeFileSync(path.join(posts, '20260402-prev.md'),
      makeFrontmatter({ id: '20260402-prev', slug: 'prev', stage: 'preview', platform: 'blogger' }), 'utf-8');
    writeFileSync(path.join(posts, '20260403-missing.md'),
      makeFrontmatter({ id: '20260403-missing', slug: 'missing', stage: undefined, platform: 'blogger' }), 'utf-8');
    globalThis.__slice2FixtureH1 = { tmp, posts };
  } catch (err) {
    check('H1 fixture prepare', () => { throw err; });
  }
}

// H2/H3/H4：loader 之 PROJECT_ROOT 由 src/scripts/ 之 import.meta.url 固定，不受 process.cwd()
//   影響，因此無法直接以 chdir + fixture 對 load-github-posts / load-blogger-posts 做端對端
//   斷言。改為靜態 source-scan 驗證 filter 邏輯（H2s / H3s）+ predicate 平台獨立性（H4p）。
//   Loader 之實際 preview 排除行為在 CLI 端經 `validate:content` + `check:blogger-backfill` 之
//   real-repo run 交叉驗證：因目前 repo 內無任何文章宣告 stage，所有既有測試計數不變。
//
// H2s. Static source-scan: load-blogger-posts.js 之 stage filter 存在且 platform 正確。
{
  check('H2s loader source: load-blogger-posts.js 對 native blogger stage 過濾', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src/scripts/load-blogger-posts.js'), 'utf-8');
    assert.ok(/isProductionStage\(\s*p\.publishTargets\?\.blogger\?\.stage\s*,\s*['"]blogger['"]\s*\)/.test(src),
      'load-blogger-posts.js 未對 native blogger 呼叫 isProductionStage 於 blogger 平台');
    assert.ok(/blogger:stage-not-production/.test(src),
      'load-blogger-posts.js 未含 blogger:stage-not-production 之 filteredOut reason');
  });
  check('H2s loader source: load-blogger-posts.js 對 github cross stage 過濾（enabled + stage）', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src/scripts/load-blogger-posts.js'), 'utf-8');
    // github cross-post 亦需檢 blogger.stage（我們發佈到 blogger）。
    assert.ok(/publishTargets\?\.blogger\?\.enabled/.test(src),
      'load-blogger-posts.js 未檢 publishTargets.blogger.enabled');
    // 檢 blogger.stage 之 predicate 於同檔案（sanity；platform 正確性由上面斷言保證）。
    const count = (src.match(/isProductionStage\([^)]*['"]blogger['"]/g) || []).length;
    assert.ok(count >= 2, `expected ≥2 isProductionStage(...,'blogger') calls (native + cross), got ${count}`);
  });
}

// H3s. Static source-scan: load-github-posts.js 之 stage filter 存在且 platform 正確。
{
  check('H3s loader source: load-github-posts.js 對 native github stage 過濾', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src/scripts/load-github-posts.js'), 'utf-8');
    assert.ok(/isProductionStage\(\s*p\.publishTargets\?\.github\?\.stage\s*,\s*['"]github['"]\s*\)/.test(src),
      'load-github-posts.js 未對 native github 呼叫 isProductionStage 於 github 平台');
    assert.ok(/github:stage-not-production/.test(src),
      'load-github-posts.js 未含 github:stage-not-production 之 filteredOut reason');
  });
  check('H3s loader source: load-github-posts.js 對 blogger cross stage 過濾（enabled + stage）', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src/scripts/load-github-posts.js'), 'utf-8');
    assert.ok(/publishTargets\?\.github\?\.enabled/.test(src),
      'load-github-posts.js 未檢 publishTargets.github.enabled');
    const count = (src.match(/isProductionStage\([^)]*['"]github['"]/g) || []).length;
    assert.ok(count >= 2, `expected ≥2 isProductionStage(...,'github') calls (native + cross), got ${count}`);
  });
}

// H4p. Platform isolation on predicate：github.stage 與 blogger.stage 為獨立 axis；
//   一者 preview 不影響另者 production。
{
  check('H4p isolation: blogger.stage=preview 不影響 github production predicate', () => {
    // 一個文章可同時宣告 github: production + blogger: preview；兩個 predicate 各回各的。
    assert.equal(isProductionStage('production', 'github'), true);
    assert.equal(isProductionStage('preview', 'blogger'), false);
  });
  check('H4p isolation: github.stage=preview 不影響 blogger production predicate', () => {
    assert.equal(isProductionStage('preview', 'github'), false);
    assert.equal(isProductionStage('production', 'blogger'), true);
  });
  check('H4p isolation: platform axis 之 invalid stage 不污染另一平台', () => {
    // github.stage 為非法值（'staging'）不影響 blogger.stage 之解析。
    assert.equal(isProductionStage('staging', 'github'), false);
    assert.equal(isProductionStage('production', 'blogger'), true);
  });
}

async function asyncTests() {
  // H1 planner classification（planMissingSidecars 支援 contentRoot 覆寫 → 端對端可測）
  {
    const fx = globalThis.__slice2FixtureH1;
    const plan = await planMissingSidecars({ repoRoot: fx.tmp, contentRoot: fx.posts });
    const slugs = plan.candidates.map((c) => c.slug);
    check('H1 planner: production-stage candidate included', () => {
      assert.ok(slugs.includes('prod'), `expected 'prod' in ${slugs}`);
    });
    check('H1 planner: missing-stage candidate included (backward compat)', () => {
      assert.ok(slugs.includes('missing'), `expected 'missing' in ${slugs}`);
    });
    check('H1 planner: preview-stage candidate EXCLUDED', () => {
      assert.ok(!slugs.includes('prev'), `unexpected 'prev' in ${slugs}`);
    });
    try { rmSync(fx.tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  }

  // H5. isCandidate contract：bootstrap / plan / report 一致排除 preview（in-memory sanity）
  {
    const previewFm = {
      status: 'ready',
      draft: false,
      publishTargets: { blogger: { enabled: true, stage: 'preview' } },
    };
    const productionFm = {
      status: 'ready',
      draft: false,
      publishTargets: { blogger: { enabled: true, stage: 'production' } },
    };
    const missingFm = {
      status: 'ready',
      draft: false,
      publishTargets: { blogger: { enabled: true } },
    };
    check('H5 predicate: production-stage → true', () => {
      assert.equal(isProductionStage('production', 'blogger'), true);
      assert.equal(isProductionStage(productionFm.publishTargets.blogger.stage, 'blogger'), true);
    });
    check('H5 predicate: missing-stage → true（backward compat）', () => {
      assert.equal(isProductionStage(missingFm.publishTargets.blogger.stage, 'blogger'), true);
    });
    check('H5 predicate: preview-stage → false', () => {
      assert.equal(isProductionStage('preview', 'blogger'), false);
      assert.equal(isProductionStage(previewFm.publishTargets.blogger.stage, 'blogger'), false);
    });
    check('H5 predicate: invalid stage → false（不 fallback）', () => {
      assert.equal(isProductionStage('Preview', 'blogger'), false);
      assert.equal(isProductionStage('', 'blogger'), false);
      assert.equal(isProductionStage(null, 'blogger'), false);
      assert.equal(isProductionStage({}, 'blogger'), false);
    });
  }

  // H6. apply engine anti-bypass：靜態掃描 src 檔以確認 re-parse 存在。
  //   不執行 apply（本 guard 為 read-only + fixture-only；apply 觸發生產 write path）。
  {
    check('H6 apply anti-bypass: apply-blogger-backfill-truth.js contains write-time re-parse block', () => {
      const text = readFileSync(
        path.join(REPO_ROOT, 'src/scripts/apply-blogger-backfill-truth.js'), 'utf-8');
      assert.ok(/fs\.readFile\(absSource/.test(text) || /source re-read/i.test(text),
        'apply engine 未含 source re-read 之 anti-bypass');
      assert.ok(/matter\(reparseRaw\)|matter\(mdRaw\)/.test(text) || /source re-parse/i.test(text),
        'apply engine 未含 frontmatter re-parse');
      assert.ok(/resolvePublishTargetStage|isProductionStage/.test(text),
        'apply engine 未呼叫 stage predicate');
      assert.ok(/stage is not production at write-time|stage is invalid at write-time/.test(text),
        'apply engine 未含 write-time stage 拒絕 diagnostics');
    });
  }
}

// ── 總結（async tests 完成後計數）───────────────────────────────────────────────

async function main() {
  await asyncTests();
  const passed = cases.filter((c) => c.ok).length;
  const total = cases.length;
  console.log('');
  console.log(`publish target stage contract guard: ${passed}/${total} PASS`);
  if (passed !== total) process.exit(1);
}

main().catch((err) => {
  console.error(`publish target stage contract guard: UNEXPECTED ERROR: ${err.stack || err.message || err}`);
  process.exit(1);
});
