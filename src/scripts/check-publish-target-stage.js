#!/usr/bin/env node
// Phase 20260720-publish-target-stage Slice 1：publishTargets.<platform>.stage 契約 guard。
//
// 上位契約：docs/20260720-publish-target-stage-contract.md
//
// 範圍 / 邊界（read-only；negative test 完全隔離）：
//   - 全部斷言使用 **in-memory 物件** 與 **repo 內既有真實檔案之靜態文字掃描**。
//   - **不**修改任何真實文章 / sidecar / manifest / authorization / settings。
//   - **不**建立 fixture 檔、**不**寫暫存檔、**不**暫時弄髒 repo 再還原。
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
//   G. Slice 2 未提前實作（helper 尚未被 production selector 使用）之靜態掃描

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

check('真實 repo 目前無任何文章宣告 stage（Slice 1 未改動文章 metadata）', () => {
  const declared = [];
  for (const abs of contentFiles) {
    let fm;
    try {
      fm = matter(readFileSync(abs, 'utf-8')).data;
    } catch {
      continue;
    }
    for (const p of PUBLISH_STAGE_PLATFORMS) {
      if (fm?.publishTargets?.[p]?.stage !== undefined) {
        declared.push(`${path.relative(REPO_ROOT, abs)}#${p}`);
      }
    }
  }
  assert.deepEqual(declared, [], `unexpected stage declarations:\n${declared.join('\n')}`);
});

// ── G. Slice 2 未提前實作（靜態掃描）─────────────────────────────────────────────

const HELPER_REL = 'src/scripts/publish-stage.js';
const ALLOWED_IMPORTERS = new Set([
  'src/scripts/validate-content.js',        // Step 4：validator 規則
  'src/scripts/load-admin-posts.js',        // Step 5：Admin read-only 顯示
  'src/scripts/admin-article-lookup.js',    // Step 5：read-only lookup 顯示
  'src/scripts/blogger-preview-plan.js',    // Step 5：preview planner read-only 顯示
  'src/scripts/check-publish-target-stage.js', // 本 guard
]);

const jsFiles = fg.sync(['src/**/*.js'], { cwd: REPO_ROOT, absolute: false });

check('publish-stage.js 之 importer 僅限 Slice 1 白名單', () => {
  const importers = [];
  for (const rel of jsFiles) {
    const text = readFileSync(path.join(REPO_ROOT, rel), 'utf-8');
    if (/from\s+['"]\.\/publish-stage\.js['"]/.test(text)) {
      importers.push(rel.replace(/\\/g, '/'));
    }
  }
  assert.ok(importers.length > 0, 'helper 未被任何檔案 import（wiring 遺失？）');
  const unexpected = importers.filter((f) => !ALLOWED_IMPORTERS.has(f));
  assert.deepEqual(unexpected, [], `Slice 2 提前實作？非白名單 importer：${unexpected.join(', ')}`);
});

check('assertProductionStage / isProductionStage 尚未被任何 production selector 使用', () => {
  const callers = [];
  for (const rel of jsFiles) {
    const norm = rel.replace(/\\/g, '/');
    if (norm === HELPER_REL || norm === 'src/scripts/check-publish-target-stage.js') continue;
    const text = readFileSync(path.join(REPO_ROOT, rel), 'utf-8');
    if (/\b(assertProductionStage|isProductionStage)\s*\(/.test(text)) callers.push(norm);
  }
  assert.deepEqual(callers, [], `Slice 2 提前實作？production predicate 已被使用：${callers.join(', ')}`);
});

check('build / deploy / apply / manifest / authorization 路徑未接入 stage helper', () => {
  const forbidden = [
    'src/scripts/build-github.js',
    'src/scripts/build-blogger.js',
    'src/scripts/build-blogger-preview.js',
    'src/scripts/build-sitemap.js',
    'src/scripts/load-posts.js',
    'src/scripts/load-github-posts.js',
    'src/scripts/load-blogger-posts.js',
    'src/scripts/apply-blogger-backfill-truth.js',
    'src/scripts/plan-blogger-backfill-truth-apply.js',
    'src/scripts/prepare-blogger-backfill-truth-manifest.js',
    'src/scripts/prepare-blogger-backfill-apply-authorization.js',
    'src/scripts/validate-blogger-backfill-apply-authorization.js',
  ];
  const leaked = [];
  for (const rel of forbidden) {
    const abs = path.join(REPO_ROOT, rel);
    let text;
    try {
      text = readFileSync(abs, 'utf-8');
    } catch {
      continue; // 檔案不存在則略過（不硬編存在性）
    }
    if (/publish-stage\.js|PublishStage|PUBLISH_STAGE/.test(text)) leaked.push(rel);
  }
  assert.deepEqual(leaked, [], `Slice 2 提前實作？production 路徑已引用 stage：${leaked.join(', ')}`);
});

check('validate-content.js 確實接上 stage 規則（wiring 存在性）', () => {
  const text = readFileSync(path.join(REPO_ROOT, 'src/scripts/validate-content.js'), 'utf-8');
  assert.ok(/from '\.\/publish-stage\.js'/.test(text), 'validator 未 import helper');
  assert.ok(/collectPublishTargetStageIssues\(/.test(text), 'validator 未呼叫 stage rule');
});

// ── 總結 ────────────────────────────────────────────────────────────────────────

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;
console.log('');
console.log(`publish target stage contract guard: ${passed}/${total} PASS`);
if (passed !== total) process.exit(1);
