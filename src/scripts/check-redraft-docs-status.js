#!/usr/bin/env node
// Phase 20260716：redraft write-path docs status contract guard（docs-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 docs/20260714-admin-github-redraft-write-path-preflight.md、
//     docs/20260714-admin-github-redraft-first-production-rehearsal.md、
//     docs/20260714-github-redraft-lifecycle-contract.md 與 package.json 文字；
//     **不**讀 CLAUDE.md（本 guard 專守 redraft docs；CLAUDE.md 之 current-state 由 boot
//     verification 以 Git 實測，不由本 guard 靜態斷言）；
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
//   7. rehearsal packet（first-production-rehearsal）必須帶 historical / completed 標示：
//      該封包原為「執行前準備 + 未來 apply 命令範本 + approval checklist」，Phase C.2 已由
//      8a062b7 對 what-is-design-token 執行完畢。若封包看起來仍是 pending apply 指令，
//      operator 可能對同一篇文章重跑 production apply、或重用已 stale 的 expected source SHA。
//      其 §1–§24 為 2026-07-14 當時語境，**刻意保留**、不掃 stale；只掃 §0 現況區。
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

// §0 現況區必須把「8a062b7 這一次 commit/push 已完成」與「通用 Phase D 工具仍不存在」分開講清楚。
// 兩個方向的 drift 都要擋：把已完成的單次執行寫回 pending，或把單次人工執行誇大成通用 automation。
const REQUIRED_PHASE_D_BOUNDARY = [
  { label: 'phase D single-execution commit hash', text: '8a062b7' },
  { label: 'phase D single-execution target post', text: 'what-is-design-token' },
  { label: 'phase D single-execution was pushed', text: 'push 至 `origin/main`' },
  { label: 'phase D single execution was manual operator git', text: 'operator 以普通 Git 指令人工執行' },
  { label: 'phase D general tooling absent', text: '通用 Phase D commit／push CLI' },
  { label: 'phase D general assistance still not open', text: '尚未開放' },
  { label: 'phase D grants no automatic commit', text: 'automatic commit' },
  { label: 'phase D grants no automatic push', text: 'automatic push' },
  { label: 'future production work needs operator decision', text: 'operator decision' },
];

// stale 掃描（只掃 §0）：不得把已完成的單次 commit/push 描述為待執行。
const PHASE_D_STALE_SUBJECTS = ['8a062b7', 'what-is-design-token', 'commit／push', 'commit/push'];
const PHASE_D_STALE_NEGATIONS = [
  'still pending',
  'not yet committed',
  'not yet pushed',
  'awaiting push',
  '尚未 commit',
  '尚未 push',
  '尚未推送',
  '待 push',
  '尚待 push',
];

// 反向 drift 掃描（掃現況區）：不得宣稱通用 Phase D automation 已落地。
// 逐行 AND：同一行同時命中 "Phase D" 與落地宣稱詞。否定敘述（"尚未開放" / "not implemented"）
// 不含這些子字串，因此文件仍能誠實描述 Phase D 邊界。
const PHASE_D_OVERCLAIM_SUBJECTS = ['Phase D'];
const PHASE_D_OVERCLAIM_NEGATIONS = ['fully implemented', 'is implemented', '已實作', '已自動化'];

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

// ---- rehearsal packet（historical / completed status contract）----

const REHEARSAL_REL = 'docs/20260714-admin-github-redraft-first-production-rehearsal.md';
const REHEARSAL = path.join(REPO_ROOT, REHEARSAL_REL);
const REHEARSAL_CONTRACT = 'rehearsal historical/completed status contract';

// 現況區切點（標題文字定位，不依賴行號）。
const REHEARSAL_CURRENT_START = '## 0. Current status';
const REHEARSAL_HISTORICAL_START = '## 1. Executive summary';

// §0 現況區必要契約文字。
const REQUIRED_IN_REHEARSAL_CURRENT = [
  { label: 'historical/completed marker', text: 'Historical / completed rehearsal packet' },
  { label: 'historical snapshot marker for §1–§24', text: 'Historical snapshot' },
  { label: 'completion commit', text: '8a062b7' },
  { label: 'completion target post', text: 'what-is-design-token' },
  { label: 'do-not-rerun warning', text: 'Do not rerun this packet as a pending production apply' },
  { label: 'new plan/preflight required for future lifecycle change', text: '必須建立新的 plan／preflight' },
  { label: 'republish not authorized', text: 'republish' },
  { label: 'blogger write not authorized', text: 'Blogger write' },
  { label: 'github pages deploy not authorized', text: 'GitHub Pages deploy' },
];

// §1–§24 歷史區必須帶 superseded / completed 註記，讓當時的「下一步」不被讀成現行待辦。
const REQUIRED_IN_REHEARSAL_HISTORICAL = [
  { label: 'historical plan completion note', text: 'Historical plan — completed by' },
  { label: 'superseded completion status note', text: 'Superseded completion status' },
];

// stale 掃描（只掃 §0）：同一行同時命中主題詞與「尚待執行」詞才判定。
// 歷史區的 "NOT EXECUTED" / 「下一 slice」是 2026-07-14 當時的合法紀錄，不在掃描範圍。
const REHEARSAL_STALE_SUBJECTS = [
  'what-is-design-token',
  'production redraft apply',
  'production apply',
  'Phase C.2',
];
const REHEARSAL_STALE_NEGATIONS = [
  'next slice',
  '下一 slice',
  '下一個 slice',
  'not yet applied',
  'not yet implemented',
  'awaiting execution',
  'still pending',
  'NOT EXECUTED',
  '尚待執行',
  '待執行',
  '尚未執行',
];

// rehearsal 封包專屬過度宣稱（全文禁止）。
const REHEARSAL_FORBIDDEN_OVERCLAIMS = [
  ...FORBIDDEN_OVERCLAIMS,
  'safe to reuse this packet',
];

// ---- lifecycle contract（deployed-state / operator path contract）----
//
// 為何納入：本檔是 preflight 指名之**上位契約**（見 preflight §0 / See also），operator 會從它讀
// 現行 redraft 路徑。它原本於 §5 寫「退回草稿與重新上架目前仍需 Dean 手動編輯 Markdown
// frontmatter」——該敘述在 C.1b CLI + C.2 production apply 落地後已過時，且方向危險：手動編輯
// frontmatter 會繞過 git-safety preflight、source SHA TOCTOU 檢查與 atomic engine 的
// byte-preserving 斷言。反向 drift 同樣要擋：apply 已落地不代表 deploy 永久開放。

const LIFECYCLE_REL = 'docs/20260714-github-redraft-lifecycle-contract.md';
const LIFECYCLE = path.join(REPO_ROOT, LIFECYCLE_REL);
const LIFECYCLE_CONTRACT = 'lifecycle contract deployed-state / operator path contract';

// 現況區切點（標題文字定位，不依賴行號）。§0–§6 為 2026-07-14 當時語境，刻意保留、不掃 stale。
const LIFECYCLE_CURRENT_START = '## Current status';
const LIFECYCLE_HISTORICAL_START = '## 0. 目的與範圍';

// 現況區必要契約文字。
const REQUIRED_IN_LIFECYCLE_CURRENT = [
  { label: 'historical snapshot marker for §0–§6', text: 'Historical snapshot' },
  { label: 'production CLI write path exists', text: 'npm run admin:redraft-apply' },
  { label: 'manual frontmatter edit no longer standard path', text: '手動編輯 Markdown frontmatter 已不再是標準 production redraft 流程' },
  { label: 'CLI disabled by default', text: '預設 disabled' },
  { label: 'gate 1 read-only lookup', text: 'read-only lookup' },
  { label: 'gate 2 dry-run plan', text: 'dry-run plan' },
  { label: 'gate 3 git-safety preflight', text: 'git-safety preflight' },
  { label: 'gate 4 expected source sha', text: '--expected-source-sha' },
  { label: 'gate 5 environment authorization gate', text: 'environment authorization gate' },
  { label: 'gate 6 confirmation phrase', text: 'confirmation phrase' },
  { label: 'gate 7 atomic engine', text: 'atomic lifecycle mutation engine' },
  { label: 'apply and deploy are separately authorized', text: 'apply 與 deploy 為分離授權' },
  { label: 'first production apply completed', text: '8a062b7' },
  { label: 'first production apply target', text: 'what-is-design-token' },
  { label: 'first target deploy completed', text: '0eaf9c6' },
  { label: 'deploy is single-grant, not permanent', text: '不構成**永久或自動 deploy 授權' },
  { label: 're-publish CLI path not landed', text: 'Re-publish' },
  { label: 'admin UI still dormant', text: 'Admin UI 仍 dormant' },
  { label: 'phase D not started', text: 'Phase D' },
];

// 全文禁止之已知 stale negations（一旦復發，operator 會被導回繞過安全門的手動路徑）。
const LIFECYCLE_PROHIBITED_TEXTS = [
  { label: 'stale manual-frontmatter-only operator path', text: '退回草稿與重新上架目前仍需 Dean 手動編輯 Markdown frontmatter' },
  { label: 'stale "live URL still serves old page" claim', text: 'live URL 仍供應舊頁' },
];

// ---- preflight 現況區：已知 stale negations 不得復發 ----
// §1–§16 為刻意保留之當時語境（帶 historical banner），不在此掃描範圍；只掃 §0 + §17+。
const PREFLIGHT_PROHIBITED_IN_CURRENT = [
  { label: 'stale "engine not imported by any production CLI"', text: '未被任何 production CLI' },
  { label: 'stale "no --apply / apply-redraft entry in package.json"', text: '無任何 `--apply` / apply-redraft 入口' },
];

// preflight 現況區必須寫出 CLI ↔ engine 的真實接線與其邊界。
const REQUIRED_IN_PREFLIGHT_IMPL = [
  { label: 'CLI imports atomic engine', text: 'applyLifecycleAtomic' },
  { label: 'apply npm entry exists', text: 'admin:redraft-apply' },
  { label: 'CLI does not commit/push/build/deploy', text: 'commit／push／build／deploy' },
];

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

// 3b. §0 現況區必須區分「單次 commit/push 已完成」與「通用 Phase D 工具未落地」
for (const req of REQUIRED_PHASE_D_BOUNDARY) {
  const ok = currentStatusSection.includes(req.text);
  record(
    `current status states ${req.label}`,
    ok,
    ok
      ? ''
      : `${DOC_REL} §0: missing required Phase D boundary text "${req.text}" — 8a062b7 的 commit/push 由 operator 人工完成且已在 origin/main，但通用 Phase D CLI/engine/npm script/guard 皆不存在；§0 須同時寫明兩者`,
  );
}

// 3c. §0 不得把已完成的單次 commit/push 寫回 pending
{
  const offenders = [];
  for (const rawLine of currentStatusSection.split('\n')) {
    const line = rawLine.toLowerCase();
    const subject = PHASE_D_STALE_SUBJECTS.find((s) => line.includes(s.toLowerCase()));
    if (!subject) continue;
    const negation = PHASE_D_STALE_NEGATIONS.find((n) => line.includes(n.toLowerCase()));
    if (!negation) continue;
    offenders.push(`"${subject}" + "${negation}": ${rawLine.trim().slice(0, 90)}`);
  }
  const ok = offenders.length === 0;
  record(
    'no stale "first redraft commit/push still pending" claim in §0 current status',
    ok,
    ok
      ? ''
      : `${DOC_REL} §0: what-is-design-token 的 lifecycle 變更已 commit 為 8a062b7 且已 push 至 origin/main（merge-base --is-ancestor 成立），現況區不得描述為待執行 — ${offenders.join(' | ')}`,
  );
}

// 3d. 現況區不得宣稱通用 Phase D automation 已落地
for (const region of [
  { label: '§0 current status', text: currentStatusSection },
  { label: '§17+ implementation records', text: implRecordsSection },
]) {
  const offenders = [];
  for (const rawLine of region.text.split('\n')) {
    const line = rawLine.toLowerCase();
    const subject = PHASE_D_OVERCLAIM_SUBJECTS.find((s) => line.includes(s.toLowerCase()));
    if (!subject) continue;
    const negation = PHASE_D_OVERCLAIM_NEGATIONS.find((n) => line.includes(n.toLowerCase()));
    if (!negation) continue;
    offenders.push(`"${subject}" + "${negation}": ${rawLine.trim().slice(0, 90)}`);
  }
  const ok = offenders.length === 0;
  record(
    `no overclaimed "general phase D automation implemented" in ${region.label}`,
    ok,
    ok
      ? ''
      : `${DOC_REL} ${region.label}: repository 無任何 Phase D commit/push CLI/engine/npm script/guard；一次人工 commit/push（8a062b7）不構成通用 automation — ${offenders.join(' | ')}`,
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

// 7. rehearsal packet 必須標示為 historical / completed
const rehearsalExists = existsSync(REHEARSAL);
record(
  `guard target exists: ${REHEARSAL_REL}`,
  rehearsalExists,
  rehearsalExists ? '' : `missing ${REHEARSAL_REL} (${REHEARSAL_CONTRACT})`,
);
if (!rehearsalExists) summarize(1);

let rehearsal;
try {
  rehearsal = readFileSync(REHEARSAL, 'utf-8');
  record(`guard target readable: ${REHEARSAL_REL}`, true);
} catch (err) {
  record(`guard target readable: ${REHEARSAL_REL}`, false, `${REHEARSAL_REL}: ${err.message}`);
  summarize(1);
}

const idxRehearsalCurrent = rehearsal.indexOf(REHEARSAL_CURRENT_START);
const idxRehearsalHistorical = rehearsal.indexOf(REHEARSAL_HISTORICAL_START);
const rehearsalSectionsOk =
  idxRehearsalCurrent >= 0 && idxRehearsalHistorical > idxRehearsalCurrent;
record(
  'rehearsal sections resolvable (§0 current status → §1 historical plan)',
  rehearsalSectionsOk,
  rehearsalSectionsOk
    ? ''
    : `${REHEARSAL_REL} (${REHEARSAL_CONTRACT}): missing/misordered heading — required in order: "${REHEARSAL_CURRENT_START}", "${REHEARSAL_HISTORICAL_START}"`,
);
if (!rehearsalSectionsOk) summarize(1);

const rehearsalCurrent = rehearsal.slice(idxRehearsalCurrent, idxRehearsalHistorical);
const rehearsalHistorical = rehearsal.slice(idxRehearsalHistorical);

for (const req of REQUIRED_IN_REHEARSAL_CURRENT) {
  const ok = rehearsalCurrent.includes(req.text);
  record(
    `rehearsal current status states ${req.label}`,
    ok,
    ok
      ? ''
      : `${REHEARSAL_REL} §0 (${REHEARSAL_CONTRACT}): missing required text "${req.text}" — Phase C.2 已由 8a062b7 對 what-is-design-token 執行完畢，現況區須明示完成狀態與未授權範圍`,
  );
}

for (const req of REQUIRED_IN_REHEARSAL_HISTORICAL) {
  const ok = rehearsalHistorical.includes(req.text);
  record(
    `rehearsal historical region carries ${req.label}`,
    ok,
    ok
      ? ''
      : `${REHEARSAL_REL} §1+ (${REHEARSAL_CONTRACT}): missing required text "${req.text}" — 當時的 apply 範本／checklist／「下一步」須標注已由 8a062b7 完成，否則會被當成待執行 runbook`,
  );
}

{
  const offenders = [];
  for (const rawLine of rehearsalCurrent.split('\n')) {
    // ASCII 詞需大小寫不敏感（"Next slice" / "NOT EXECUTED" 等皆須命中）；中文不受影響。
    const line = rawLine.toLowerCase();
    const subject = REHEARSAL_STALE_SUBJECTS.find((s) => line.includes(s.toLowerCase()));
    if (!subject) continue;
    const negation = REHEARSAL_STALE_NEGATIONS.find((n) => line.includes(n.toLowerCase()));
    if (!negation) continue;
    offenders.push(`"${subject}" + "${negation}": ${rawLine.trim().slice(0, 90)}`);
  }
  const ok = offenders.length === 0;
  record(
    'no stale "production apply still pending" claim in rehearsal §0 current status',
    ok,
    ok
      ? ''
      : `${REHEARSAL_REL} §0 (${REHEARSAL_CONTRACT}): what-is-design-token 的 production redraft apply 已完成（8a062b7），現況區不得把它描述為待執行 — ${offenders.join(' | ')}`,
  );
}

for (const claim of REHEARSAL_FORBIDDEN_OVERCLAIMS) {
  const ok = !rehearsal.toLowerCase().includes(claim);
  record(
    `no overclaim in rehearsal packet: "${claim}"`,
    ok,
    ok
      ? ''
      : `${REHEARSAL_REL} (${REHEARSAL_CONTRACT}): apply 已完成不代表 republish / Blogger write / GitHub Pages deploy 已授權，也不代表本封包可重用；禁止 "${claim}"`,
  );
}

// 8. preflight 現況區：已知 stale negations 不得復發 + 必須寫出真實 CLI↔engine 接線
for (const prohibited of PREFLIGHT_PROHIBITED_IN_CURRENT) {
  const offenders = currentRegions
    .filter((region) => region.text.includes(prohibited.text))
    .map((region) => region.label);
  const ok = offenders.length === 0;
  record(
    `no stale negation in preflight current regions: ${prohibited.label}`,
    ok,
    ok
      ? ''
      : `${DOC_REL} ${offenders.join(' + ')}: redraft-apply-cli.js 已 import applyLifecycleAtomic 且 package.json 有 admin:redraft-apply；現況區不得再出現 "${prohibited.text}"（§1–§16 歷史區不在此掃描範圍）`,
  );
}

for (const req of REQUIRED_IN_PREFLIGHT_IMPL) {
  const ok = implRecordsSection.includes(req.text);
  record(
    `preflight §17+ states ${req.label}`,
    ok,
    ok
      ? ''
      : `${DOC_REL} §17+: missing required text "${req.text}" — 現況區須寫明 production CLI 與 atomic engine 的真實接線及其 no-commit/push/build/deploy 邊界`,
  );
}

// 9. lifecycle contract（上位契約）必須描述現行 operator path，且不得復發已知 stale negations
const lifecycleExists = existsSync(LIFECYCLE);
record(
  `guard target exists: ${LIFECYCLE_REL}`,
  lifecycleExists,
  lifecycleExists ? '' : `missing ${LIFECYCLE_REL} (${LIFECYCLE_CONTRACT})`,
);
if (!lifecycleExists) summarize(1);

let lifecycle;
try {
  lifecycle = readFileSync(LIFECYCLE, 'utf-8');
  record(`guard target readable: ${LIFECYCLE_REL}`, true);
} catch (err) {
  record(`guard target readable: ${LIFECYCLE_REL}`, false, `${LIFECYCLE_REL}: ${err.message}`);
  summarize(1);
}

const idxLifecycleCurrent = lifecycle.indexOf(LIFECYCLE_CURRENT_START);
const idxLifecycleHistorical = lifecycle.indexOf(LIFECYCLE_HISTORICAL_START);
const lifecycleSectionsOk =
  idxLifecycleCurrent >= 0 && idxLifecycleHistorical > idxLifecycleCurrent;
record(
  'lifecycle sections resolvable (Current status → §0 historical context)',
  lifecycleSectionsOk,
  lifecycleSectionsOk
    ? ''
    : `${LIFECYCLE_REL} (${LIFECYCLE_CONTRACT}): missing/misordered heading — required in order: "${LIFECYCLE_CURRENT_START}", "${LIFECYCLE_HISTORICAL_START}"`,
);
if (!lifecycleSectionsOk) summarize(1);

const lifecycleCurrent = lifecycle.slice(idxLifecycleCurrent, idxLifecycleHistorical);

for (const req of REQUIRED_IN_LIFECYCLE_CURRENT) {
  const ok = lifecycleCurrent.includes(req.text);
  record(
    `lifecycle current status states ${req.label}`,
    ok,
    ok
      ? ''
      : `${LIFECYCLE_REL} Current status (${LIFECYCLE_CONTRACT}): missing required text "${req.text}" — 本檔是 preflight 指名之上位契約，operator 由此讀現行 redraft 路徑；現況區須同時寫明 CLI 路徑、七道安全門、已完成範圍與未開放邊界`,
  );
}

for (const prohibited of LIFECYCLE_PROHIBITED_TEXTS) {
  const ok = !lifecycle.includes(prohibited.text);
  record(
    `no stale negation in lifecycle contract: ${prohibited.label}`,
    ok,
    ok
      ? ''
      : `${LIFECYCLE_REL} (${LIFECYCLE_CONTRACT}): 禁止 "${prohibited.text}" —— 手動編輯 frontmatter 會繞過 git-safety preflight / source SHA TOCTOU / atomic engine；且首個 redraft target 之 deploy 已於 0eaf9c6 完成`,
  );
}

for (const claim of FORBIDDEN_OVERCLAIMS) {
  const ok = !lifecycle.toLowerCase().includes(claim);
  record(
    `no overclaim in lifecycle contract: "${claim}"`,
    ok,
    ok
      ? ''
      : `${LIFECYCLE_REL} (${LIFECYCLE_CONTRACT}): apply CLI 已落地、首個 target 已 deploy，皆不代表未來 build／deploy／Blogger publish 已開放；禁止 "${claim}"`,
  );
}

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;
console.log('');
console.log('redraft docs status summary:');
console.log(`  guard target: ${DOC_REL}`);
console.log(`  guard target: ${REHEARSAL_REL} (${REHEARSAL_CONTRACT})`);
console.log(`  guard target: ${LIFECYCLE_REL} (${LIFECYCLE_CONTRACT})`);
console.log(`  current-status contract texts: ${REQUIRED_IN_CURRENT_STATUS.length} checked`);
console.log(`  phase D boundary contract texts: ${REQUIRED_PHASE_D_BOUNDARY.length} checked`);
console.log(`  stale-claim scans: ${currentRegions.length + 2} region(s)`);
console.log(`  phase D overclaim scans: ${currentRegions.length} region(s)`);
console.log(`  overclaim scans: ${FORBIDDEN_OVERCLAIMS.length + REHEARSAL_FORBIDDEN_OVERCLAIMS.length}`);
console.log(`  referenced npm entries: ${REFERENCED_SCRIPTS.length}`);
console.log(`  rehearsal current-status contract texts: ${REQUIRED_IN_REHEARSAL_CURRENT.length} checked`);
console.log(`  rehearsal historical markers: ${REQUIRED_IN_REHEARSAL_HISTORICAL.length} checked`);
console.log(`  preflight prohibited stale negations: ${PREFLIGHT_PROHIBITED_IN_CURRENT.length} scanned in ${currentRegions.length} region(s)`);
console.log(`  preflight §17+ CLI/engine wiring texts: ${REQUIRED_IN_PREFLIGHT_IMPL.length} checked`);
console.log(`  lifecycle current-status contract texts: ${REQUIRED_IN_LIFECYCLE_CURRENT.length} checked`);
console.log(`  lifecycle prohibited stale negations: ${LIFECYCLE_PROHIBITED_TEXTS.length} checked`);

summarize(passed === total ? 0 : 1);
