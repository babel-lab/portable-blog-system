#!/usr/bin/env node
// Phase 20260717：docs-side `npm run <name>` reference existence guard（source-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 package.json + CLAUDE.md + README.md；**不** build / deploy / dev server / fetch / pull；
//     **不**執行任何被指到的腳本；**不**寫任何檔；**不**呼叫 Blogger / Google / GA4 / AdSense API；
//     **不**掃描 docs/**/*.md（歷史 snapshot 刻意保留當時語境，可能含已 rename 之 script 名，
//     不納入本 slice）；**不**讀 deploy clone。
//
// 目的（防呆 / 防回歸）：
//   check:npm-script-targets 靜態解析 package.json 內 `.js` 目標與 `npm run` 參照，但只涵蓋
//   package.json 自身；operator-facing docs（CLAUDE.md validation baseline / README.md 指令表）
//   內的 `npm run <name>` 若因 rename / typo 而 dangling，該 guard 無法偵測。commit 616a18a
//   確診過此類事件：CLAUDE.md 曾寫出 `npm run check-commerce-affiliate-resolver`（實際 script
//   不存在），operator 照抄即得 "Missing script" 錯誤；當時修法是手動改回直接 node 呼叫形，
//   非結構性防呆。本 guard 補此缺口：對 CLAUDE.md + README.md 逐 occurrence 檢查每一具體
//   `npm run <name>` 參照，斷言 <name> 存在於 package.json.scripts。
//
// 為何只涵蓋 CLAUDE.md + README.md（不 sweep docs/**/*.md）：
//   docs/ 現存 100+ 檔含 phase-*、eod-report、closeout-note 等 historical snapshot，其中 npm run
//   參照為當時真實但可能已 rename / 已 retire。若一併掃入，會把歷史 drift 拖入 baseline，
//   違反現行 "phase 完成後 ledger 不回寫、historical snapshot 刻意保留當時語境" 之紀律。
//   scope 收窄至 operator-facing canonical docs（CLAUDE.md = 操作規範；README.md = 使用者入口），
//   對齊 616a18a 修法之實際 target；未來若要擴至 docs/，須另開 phase + explicit approval。
//
// Parser 設計（source-of-truth-aware resolver；不由單一 regex 同時決定 token boundary 與有效性）：
//   1. 以 maximal token 抽取 `npm run <T>` 之 T，T 允許 npm-script 慣用字元 [A-Za-z0-9:_.-]；
//      首字元限 [A-Za-z0-9]（拒 `<script>` / `${name}` placeholder；拒空）。
//   2. 若 maximal token T **精確存在**於 package.json.scripts → 直接 resolve 為 T。此為
//      **exact-key precedence**：當 package script 名本身合法地以 `:` / `-` / `_` / `.` 結尾
//      （contract 允許），完整 key 必須維持可辨識與可解析。
//   3. 否則，deterministic 由右至左逐字元剝離 trailing punctuation（限 `[:_.-]`），
//      每剝一字元即再比對 scripts；命中即 resolve 為剝離後之 key。此路徑處理常見 prose /
//      Markdown 尾隨情形（如 `npm run dev.` 中之句末句點）；不剝除 alnum 字元，避免把
//      script 名中間之字元切掉。
//   4. 若剝除至無 trailing punctuation 仍無 match → hard-fail，並以**原始 maximal token**
//      回報 unresolved（不靜默丟棄；operator 需看到 docs 內實際字串）。
//   Markdown wrapper（backtick / pipe / 中英文標點 / 空白 / ` -- ` args）本就不在 charset 內，
//   由 regex 天然終止 token；不需額外處理。

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PKG = path.join(REPO_ROOT, 'package.json');

// 掃描目標：canonical operator-facing docs 之根目錄檔，順序即報表順序。
const IN_SCOPE_DOCS = ['CLAUDE.md', 'README.md'];

// Maximal token：首字元限 [A-Za-z0-9]（拒 placeholder / bare），
// 後續允許 npm-script 慣用字元集 [A-Za-z0-9:_.-]（含 : - _ . 於末字元，不由 regex 決定合法性）。
const REF_PATTERN = /\bnpm\s+run\s+([A-Za-z0-9][A-Za-z0-9:_.-]*)/g;

// 抽出一段文字之所有 maximal tokens（依出現順序）。
function parseMaximalTokens(text) {
  REF_PATTERN.lastIndex = 0;
  const out = [];
  let match;
  while ((match = REF_PATTERN.exec(text)) !== null) {
    out.push(match[1]);
  }
  return out;
}

// Source-of-truth-aware resolver：exact match 優先，其後 deterministic 剝除 trailing punctuation。
function resolveRef(rawToken, scripts) {
  if (Object.prototype.hasOwnProperty.call(scripts, rawToken)) {
    return { name: rawToken, resolved: true, rawToken };
  }
  let candidate = rawToken;
  while (candidate.length > 0 && /[:_.-]$/.test(candidate)) {
    candidate = candidate.slice(0, -1);
    if (candidate.length === 0) break;
    if (Object.prototype.hasOwnProperty.call(scripts, candidate)) {
      return { name: candidate, resolved: true, rawToken };
    }
  }
  return { name: rawToken, resolved: false, rawToken };
}

// 掃描並解析：每 line 抽 maximal tokens、逐一 resolve 對照 scripts。
function scanAndResolve(text, scripts) {
  return parseMaximalTokens(text).map((t) => resolveRef(t, scripts));
}

// 內建 deterministic self-check：用 synthetic script set 驗證 parser + resolver 之關鍵行為，
// 不依賴 repo 現有 script 名（現有 script 全以 alnum 結尾之事實，不得成為固化 restriction）。
// { label, input, syntheticScripts, want: [{ name, resolved }] }
const SELF_CHECK_CASES = [
  // ── 保留：既有必備覆蓋 ────────────────────────────────
  { label: 'bare name',
    input: 'npm run build', syntheticScripts: { build: '' },
    want: [{ name: 'build', resolved: true }] },
  { label: 'colon inside a name',
    input: 'npm run check:build', syntheticScripts: { 'check:build': '' },
    want: [{ name: 'check:build', resolved: true }] },
  { label: 'hyphen inside a name',
    input: 'npm run blogger-adsense-output', syntheticScripts: { 'blogger-adsense-output': '' },
    want: [{ name: 'blogger-adsense-output', resolved: true }] },
  { label: 'dot inside a name',
    input: 'npm run check.name', syntheticScripts: { 'check.name': '' },
    want: [{ name: 'check.name', resolved: true }] },
  { label: 'underscore inside a name',
    input: 'npm run check_name', syntheticScripts: { 'check_name': '' },
    want: [{ name: 'check_name', resolved: true }] },
  { label: 'trailing arguments',
    input: 'npm run admin:lookup -- --slug=x', syntheticScripts: { 'admin:lookup': '' },
    want: [{ name: 'admin:lookup', resolved: true }] },
  { label: 'trailing backtick',
    input: '`npm run dev`', syntheticScripts: { dev: '' },
    want: [{ name: 'dev', resolved: true }] },
  { label: 'multiple refs on one line',
    input: '`npm run a` and `npm run b:c`', syntheticScripts: { a: '', 'b:c': '' },
    want: [{ name: 'a', resolved: true }, { name: 'b:c', resolved: true }] },
  { label: 'reject bare npm run',
    input: 'npm run ', syntheticScripts: {},
    want: [] },
  { label: 'reject <script> placeholder',
    input: 'npm run <script>', syntheticScripts: {},
    want: [] },
  { label: 'reject ${name} placeholder',
    input: 'npm run ${name}', syntheticScripts: {},
    want: [] },
  // ── 新增：valid keys ending in allowed punctuation ─────
  { label: 'valid key ending in colon',
    input: 'npm run task:', syntheticScripts: { 'task:': '' },
    want: [{ name: 'task:', resolved: true }] },
  { label: 'valid key ending in hyphen',
    input: 'npm run task-', syntheticScripts: { 'task-': '' },
    want: [{ name: 'task-', resolved: true }] },
  { label: 'valid key ending in underscore',
    input: 'npm run task_', syntheticScripts: { 'task_': '' },
    want: [{ name: 'task_', resolved: true }] },
  { label: 'valid key ending in dot',
    input: 'npm run task.', syntheticScripts: { 'task.': '' },
    want: [{ name: 'task.', resolved: true }] },
  // ── 新增：prose punctuation stripping when only base key exists ─
  { label: 'prose punctuation: trailing dot stripped when only base key exists',
    input: 'npm run dev.', syntheticScripts: { dev: '' },
    want: [{ name: 'dev', resolved: true }] },
  { label: 'prose punctuation: trailing colon stripped when only base key exists',
    input: 'npm run dev:', syntheticScripts: { dev: '' },
    want: [{ name: 'dev', resolved: true }] },
  { label: 'prose punctuation: consecutive trailing dots stripped',
    input: 'npm run dev..', syntheticScripts: { dev: '' },
    want: [{ name: 'dev', resolved: true }] },
  // ── 新增：exact-key precedence over prose stripping ─────
  { label: 'exact-key precedence: dev. resolves to dev. when dev. exists',
    input: 'npm run dev.', syntheticScripts: { dev: '', 'dev.': '' },
    want: [{ name: 'dev.', resolved: true }] },
  { label: 'exact-key precedence: task: resolves to task: when task: exists (even though task also exists)',
    input: 'npm run task:', syntheticScripts: { task: '', 'task:': '' },
    want: [{ name: 'task:', resolved: true }] },
  // ── 新增：unresolved must hard-fail (not silently discarded) ─
  { label: 'unresolved ref: no scripts at all',
    input: 'npm run missing', syntheticScripts: {},
    want: [{ name: 'missing', resolved: false }] },
  { label: 'unresolved ref: candidate not in scripts even after trim',
    input: 'npm run unknown-key.', syntheticScripts: { other: '' },
    want: [{ name: 'unknown-key.', resolved: false }] },
];

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

// 1. package.json 可解析
let pkg;
try {
  pkg = JSON.parse(readFileSync(PKG, 'utf-8'));
  record('package.json parseable', true);
} catch (err) {
  record('package.json parseable', false, err.message);
  console.log('');
  console.log('docs npm-run reference guard: 0/1 FAIL');
  process.exit(1);
}

// 2. package.json.scripts 為 object
const scriptsIsObject = pkg.scripts && typeof pkg.scripts === 'object' && !Array.isArray(pkg.scripts);
record('package.json.scripts is object', scriptsIsObject,
  scriptsIsObject ? '' : `got ${Array.isArray(pkg.scripts) ? 'array' : typeof pkg.scripts}`);
if (!scriptsIsObject) {
  console.log('');
  console.log(`docs npm-run reference guard: ${cases.filter((c) => c.ok).length}/${cases.length} FAIL`);
  process.exit(1);
}
const scripts = pkg.scripts;

// 3–4. 掃描目標 docs 存在
const docPresence = new Map();
for (const rel of IN_SCOPE_DOCS) {
  const abs = path.join(REPO_ROOT, rel);
  const ok = existsSync(abs);
  docPresence.set(rel, ok);
  record(`${rel} present`, ok, ok ? '' : `missing ${abs}`);
}

// 7. Self-check：parser + resolver 對合成 script set 之關鍵行為
for (const { label, input, syntheticScripts, want } of SELF_CHECK_CASES) {
  const got = scanAndResolve(input, syntheticScripts).map((r) => ({ name: r.name, resolved: r.resolved }));
  const ok = got.length === want.length
    && got.every((g, i) => g.name === want[i].name && g.resolved === want[i].resolved);
  record(`self-check: ${label}`, ok,
    ok ? '' : `input=${JSON.stringify(input)} want=${JSON.stringify(want)} got=${JSON.stringify(got)}`);
}

// 5–6. 掃描 in-scope docs 之每個 occurrence（依 IN_SCOPE_DOCS 順序、line asc）
const occurrences = [];  // { file, line, name, resolved, rawToken }
for (const rel of IN_SCOPE_DOCS) {
  if (!docPresence.get(rel)) continue;
  const abs = path.join(REPO_ROOT, rel);
  const text = readFileSync(abs, 'utf-8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const results = scanAndResolve(lines[i], scripts);
    for (const r of results) {
      occurrences.push({ file: rel, line: lineNo, name: r.name, resolved: r.resolved, rawToken: r.rawToken });
    }
  }
}

// Deterministic 排序：file（IN_SCOPE_DOCS 順序）→ line asc。
occurrences.sort((a, b) => {
  const ai = IN_SCOPE_DOCS.indexOf(a.file);
  const bi = IN_SCOPE_DOCS.indexOf(b.file);
  if (ai !== bi) return ai - bi;
  return a.line - b.line;
});

for (const occ of occurrences) {
  const trimmed = occ.resolved && occ.rawToken !== occ.name
    ? `  (trimmed from "${occ.rawToken}")`
    : '';
  const missing = !occ.resolved
    ? `script "${occ.name}" not found in package.json`
    : '';
  record(
    `${occ.file}:${occ.line} → npm run ${occ.name}${trimmed}`,
    occ.resolved,
    missing,
  );
}

// Sanity：至少掃到 1 個具體 maximal token（regex broken 或 docs 空亦攔）
record('at least one concrete npm-run reference scanned',
  occurrences.length > 0,
  occurrences.length > 0 ? `${occurrences.length} occurrence(s)` : 'no npm-run references found in in-scope docs');

const resolved = occurrences.filter((o) => o.resolved).length;
const missing = occurrences.length - resolved;
const passed = cases.filter((c) => c.ok).length;
const total = cases.length;

console.log('');
console.log('docs npm-run reference guard summary:');
console.log(`  documents scanned: ${IN_SCOPE_DOCS.length}`);
console.log(`  references found: ${occurrences.length}`);
console.log(`  references resolved: ${resolved}`);
console.log(`  references missing: ${missing}`);
console.log(`  assertions passed: ${passed}/${total}`);
console.log('');
console.log(`docs npm-run reference guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);

if (passed !== total) {
  console.log('');
  console.log('FAIL reasons:');
  for (const c of cases.filter((x) => !x.ok)) {
    console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  process.exit(1);
}
