#!/usr/bin/env node
// Phase 20260716：redraft write-path docs status contract guard（docs-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 docs/20260714-admin-github-redraft-write-path-preflight.md 與 package.json 文字；
//     **不**執行 redraft plan / apply / engine / CLI；**不** build / deploy / dev server /
//     fetch / pull；**不**寫任何檔；**不**讀取 deploy clone；**不**碰 gh-pages；**不**呼叫
//     Blogger / Google / GA4 / AdSense API；**不**觸發任何 admin write path。
//
// 目的（防呆 / 防 drift）：
//   Phase C local apply（C0 preflight → C.1a engine → C.1b CLI）已落地，正式入口為
//   `npm run admin:redraft-apply`。write-path preflight 文件是 operator 讀取現行狀態的入口；
//   若該文件的**現況區**（§0 current status + §17–§21 實作紀錄）又出現「Phase C／local apply
//   尚未實作」之類敘述，operator 會誤判功能不存在而停手，或誤以為 plan CLI 可以 apply。
//   反向風險同樣要擋：不得因 Phase C 已落地就把文件寫成「整條 workflow 完成 / 可安全發布 /
//   可 deploy」——commit·push（Phase D）與 build·deploy（Phase E）仍分離、仍 Dean-gated。
//
//   §1–§16 是 2026-07-14 當時的分析與 go／no-go 紀錄，**刻意保留當時語境**，因此不納入
//   stale 掃描；但文件必須帶清楚的 historical / superseded 標示，避免被當成現行指令。
//
// 斷言分組：
//   1. 目標文件存在、可讀，且切得出「現況區」（§0 + §17 起）。
//   2. §1–§16 帶 historical snapshot / superseded 標示。
//   3. §0 現況區必須寫出正確 apply CLI、plan CLI 之 dry-run only 邊界、preflight /
//      explicit confirmation 邊界、Phase D / E / Blogger publish / GitHub Pages deploy 之分離邊界。
//   4. 現況區不得出現「Phase C / local apply / --apply 未實作」之 stale 敘述。
//   5. 全文不得出現過度宣稱（fully complete / safe to publish / ready to deploy /
//      all phases implemented）。
//   6. 文件引用的 npm 入口（admin:redraft-apply / admin:plan-redraft）必須真的存在於 package.json。
//
// 注意：
//   - 所有斷言以標題文字切區、以子字串 / 逐行比對，**不依賴行號**、不依賴日期以外的環境狀態。
//   - stale 掃描採逐行 AND 條件（同一行同時命中 Phase C 主題詞與「未實作」詞）→ 針對的是
//     「Phase C 被說成沒做」，而非泛禁「未實作」三字（Phase D / E 確實尚未開放，
//      文件仍須能誠實描述其邊界）。

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const DOC_REL = 'docs/20260714-admin-github-redraft-write-path-preflight.md';
const DOC = path.join(REPO_ROOT, DOC_REL);
const PKG_REL = 'package.json';
const PKG = path.join(REPO_ROOT, PKG_REL);

// 現況區切點（以標題文字定位，不依賴行號）。
const CURRENT_STATUS_START = '## 0. Current Phase C status';
const HISTORICAL_START = '## 1. Executive summary';
const IMPL_RECORDS_START = '## 17. Phase A 實作紀錄';

// §0 現況區必要契約文字。
const REQUIRED_IN_CURRENT_STATUS = [
  { label: 'correct apply CLI', text: 'npm run admin:redraft-apply' },
  { label: 'plan CLI named', text: 'npm run admin:plan-redraft' },
  { label: 'plan CLI dry-run only boundary', text: 'dry-run only' },
  { label: 'plan CLI rejects --apply', text: '仍拒絕 `--apply`' },
  { label: 'preflight boundary', text: 'preflight' },
  { label: 'explicit confirmation boundary', text: 'confirmation phrase' },
  { label: 'phase D separation', text: 'Phase D' },
  { label: 'phase E separation', text: 'Phase E' },
  { label: 'blogger publish separation', text: 'Blogger publish' },
  { label: 'github pages deploy separation', text: 'GitHub Pages deploy' },
];

// §1–§16 必須帶清楚的歷史 / superseded 標示。
const REQUIRED_HISTORICAL_MARKERS = [
  { label: 'historical snapshot marker', text: 'Historical snapshot' },
  { label: 'superseded marker', text: 'superseded' },
];

// stale 掃描：同一行同時命中主題詞與否定詞才判定。
const STALE_SUBJECTS = ['Phase C', 'local apply', '`--apply`'];
const STALE_NEGATIONS = ['未實作', '尚未落地', 'not implemented', 'not available', 'has not landed'];

// 過度宣稱（全文禁止）。
const FORBIDDEN_OVERCLAIMS = [
  'fully complete',
  'safe to publish',
  'ready to deploy',
  'all phases implemented',
];

// 文件引用之 npm 入口必須實際存在。
const REFERENCED_SCRIPTS = ['admin:redraft-apply', 'admin:plan-redraft'];

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? `  — ${detail}` : ''}`);
}

function summarize(exitCode) {
  const passed = cases.filter((c) => c.ok).length;
  const total = cases.length;
  console.log('');
  console.log(`redraft docs status guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
  if (passed !== total) {
    console.log('');
    console.log('FAIL reasons:');
    for (const c of cases.filter((x) => !x.ok)) {
      console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
    }
  }
  process.exit(exitCode ?? (passed === total ? 0 : 1));
}

// 1. 目標文件存在 / 可讀
const docExists = existsSync(DOC);
record(`guard target exists: ${DOC_REL}`, docExists, docExists ? '' : `missing ${DOC_REL}`);
if (!docExists) summarize(1);

let doc;
try {
  doc = readFileSync(DOC, 'utf-8');
  record(`guard target readable: ${DOC_REL}`, true);
} catch (err) {
  record(`guard target readable: ${DOC_REL}`, false, `${DOC_REL}: ${err.message}`);
  summarize(1);
}

// 1b. 切出現況區
const idxCurrent = doc.indexOf(CURRENT_STATUS_START);
const idxHistorical = doc.indexOf(HISTORICAL_START);
const idxImpl = doc.indexOf(IMPL_RECORDS_START);

const sectionsOk = idxCurrent >= 0 && idxHistorical > idxCurrent && idxImpl > idxHistorical;
record(
  'document sections resolvable (§0 current status → §1 historical → §17 implementation records)',
  sectionsOk,
  sectionsOk
    ? ''
    : `${DOC_REL}: missing/misordered heading — required in order: "${CURRENT_STATUS_START}", "${HISTORICAL_START}", "${IMPL_RECORDS_START}"`,
);
if (!sectionsOk) summarize(1);

const currentStatusSection = doc.slice(idxCurrent, idxHistorical);
const historicalSection = doc.slice(idxHistorical, idxImpl);
const implRecordsSection = doc.slice(idxImpl);
// 現況區 = §0 + §17 起實作紀錄（§1–§16 為刻意保留之當時語境，不掃 stale）。
const currentRegions = [
  { label: '§0 current status', text: currentStatusSection },
  { label: '§17+ implementation records', text: implRecordsSection },
];

// 2. 歷史區帶清楚標示
for (const marker of REQUIRED_HISTORICAL_MARKERS) {
  const ok = currentStatusSection.includes(marker.text) || historicalSection.includes(marker.text);
  record(
    `historical region carries ${marker.label}`,
    ok,
    ok ? '' : `${DOC_REL}: §1–§16 是歷史快照，必須帶 "${marker.text}" 標示，避免被當成現行指令`,
  );
}

// 3. §0 現況區必要契約文字
for (const req of REQUIRED_IN_CURRENT_STATUS) {
  const ok = currentStatusSection.includes(req.text);
  record(
    `current status states ${req.label}`,
    ok,
    ok ? '' : `${DOC_REL} §0: missing required contract text "${req.text}"`,
  );
}

// 4. 現況區不得宣稱 Phase C / local apply 未實作
for (const region of currentRegions) {
  const offenders = [];
  for (const line of region.text.split('\n')) {
    const subject = STALE_SUBJECTS.find((s) => line.includes(s));
    if (!subject) continue;
    const negation = STALE_NEGATIONS.find((n) => line.includes(n));
    if (!negation) continue;
    offenders.push(`"${subject}" + "${negation}": ${line.trim().slice(0, 90)}`);
  }
  const ok = offenders.length === 0;
  record(
    `no stale "phase C apply not implemented" claim in ${region.label}`,
    ok,
    ok
      ? ''
      : `${DOC_REL} ${region.label}: Phase C local apply 已實作（7d057f5 → 436e0bc → 8a062b7），現況區不得宣稱其未實作 — ${offenders.join(' | ')}`,
  );
}

// 5. 全文不得過度宣稱
for (const claim of FORBIDDEN_OVERCLAIMS) {
  const ok = !doc.toLowerCase().includes(claim);
  record(
    `no overclaim: "${claim}"`,
    ok,
    ok
      ? ''
      : `${DOC_REL}: Phase C 已實作不代表 commit/push（Phase D）與 deploy（Phase E）已開放；禁止 "${claim}"`,
  );
}

// 6. 文件引用之 npm 入口存在
let pkg;
try {
  pkg = JSON.parse(readFileSync(PKG, 'utf-8'));
  record(`${PKG_REL} parseable`, true);
} catch (err) {
  record(`${PKG_REL} parseable`, false, `${PKG_REL}: ${err.message}`);
  summarize(1);
}
const scripts = pkg.scripts || {};
for (const name of REFERENCED_SCRIPTS) {
  const ok = typeof scripts[name] === 'string' && scripts[name].trim().length > 0;
  record(
    `referenced npm entry exists: "${name}"`,
    ok,
    ok ? '' : `${DOC_REL} 指向 npm run ${name}，但 ${PKG_REL} scripts 無此項`,
  );
}

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;
console.log('');
console.log('redraft docs status summary:');
console.log(`  guard target: ${DOC_REL}`);
console.log(`  current-status contract texts: ${REQUIRED_IN_CURRENT_STATUS.length} checked`);
console.log(`  stale-claim scans: ${currentRegions.length} region(s)`);
console.log(`  overclaim scans: ${FORBIDDEN_OVERCLAIMS.length}`);
console.log(`  referenced npm entries: ${REFERENCED_SCRIPTS.length}`);

summarize(passed === total ? 0 : 1);
