#!/usr/bin/env node
// Phase 20260711：check:blogger-backfill:one-post-worksheet-contract docs contract guard
// （source-level 靜態斷言；純讀 docs markdown 文字）。
//
// 範圍 / 邊界：
//   - 純讀 docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md 文字；**不**執行任何
//     其他腳本；**不** build / deploy / dev server / fetch / pull；**不**寫任何檔；**不**讀取
//     deploy clone（/d/github/blog-new/portable-blog-deploy）；**不**碰 gh-pages；**不**呼叫
//     Blogger / Google / GA4 / AdSense API；**不**動 report-only backfill guard 語意；**不**觸發
//     WP-02 真實 sidecar 寫入。
//
// 目的（防呆 / 防回歸）：
//   One-post dry-run worksheet 是 WP-01 follow-up 之單篇 dry-run rehearsal + 5 rollback drill
//   scenario + 11 abort condition + 8 placeholder token + placeholder-only sidecar diff 範例。
//   本 guard 靜態斷言該 doc 之結構仍為：
//     (a) 5 rollback drill scenarios（§13.1–§13.5）皆在；
//     (b) §10 abort condition table 有 11 個具名 row（A-1 – A-11）；
//     (c) §6.1 8 個 placeholder token 皆定義；
//     (d) §7.1 create-case placeholder diff 只含 <PLACEHOLDER_*> token，**不含**真實 URL
//         / blogspot.com / .html path；
//     (e) §7.3「Absolute placeholder rule」meta 段落仍在；
//     (f) §11 / §12 兩段之「future only」邊界標記皆在；
//     (g) §14 四條核心「絕不 guess」紅線宣告皆命中；
//     (h) §16 recommendation 明示「worksheet-only」idle-freeze。
//   若未來有人：
//     (1) 誤刪某個 rollback drill scenario；
//     (2) 誤刪 abort condition row（A-* 少於 11 個）；
//     (3) 誤刪某個 placeholder token 定義；
//     (4) 誤把真實 Blogger URL / blogspot.com domain 貼進 §7.1 create-case 範例；
//     (5) 誤把 §11 / §12 之 future-only 邊界降級（去掉「future only；本 doc 不執行」標記）；
//     (6) 誤刪 §14 紅線；
//     (7) 誤把 §16 recommendation 改成「啟動 WP-02」；
//   本 guard 靜態抓出來。與 check:blogger-backfill / check:blogger-backfill:one-post /
//   check:blogger-backfill:wp02-intake-contract 互補：本 guard 守 **one-post worksheet doc
//   結構契約**，不掃 sidecar、不改變 backfill guard 語意、不進 write phase。

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOC_REL = 'docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md';
const DOC_PATH = path.join(REPO_ROOT, DOC_REL);

const EXPECTED_TITLE = '# Blogger backfill one-post dry-run worksheet';

// 5 rollback drill scenarios（§13.1–§13.5）。
// 匹配時用 startsWith 對照具名 heading 前綴，允許尾巴附加中括號 / 全形括號描述。
const ROLLBACK_SCENARIOS = [
  { section: '13.1', headingPrefix: '### 13.1 Scenario 1 — Uncommitted sidecar write rollback' },
  { section: '13.2', headingPrefix: '### 13.2 Scenario 2 — Committed but not pushed rollback' },
  { section: '13.3', headingPrefix: '### 13.3 Scenario 3 — Pushed bad sidecar rollback' },
  { section: '13.4', headingPrefix: '### 13.4 Scenario 4（新增）— Partial multi-file accidental write abort' },
  { section: '13.5', headingPrefix: '### 13.5 Scenario 5（新增）— Permalink mismatch abort' },
];

// §10 abort condition table：11 個具名 row，label 為 A-1 – A-11。
const EXPECTED_ABORT_LABELS = [
  'A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6',
  'A-7', 'A-8', 'A-9', 'A-10', 'A-11',
];

// §6.1 placeholder tokens：8 個。
const PLACEHOLDER_TOKENS = [
  '<PLACEHOLDER_PUBLISHED_URL>',
  '<PLACEHOLDER_PUBLISHED_AT>',
  '<PLACEHOLDER_PERMALINK>',
  '<PLACEHOLDER_PUBLISH_YEAR>',
  '<PLACEHOLDER_PUBLISH_MONTH>',
  '<PLACEHOLDER_EMPTY_STRING>',
  '<PLACEHOLDER_TITLE>',
  '<PLACEHOLDER_NOTE>',
];

// §11 / §12 future-only 邊界標記。
const FUTURE_ONLY_MARKERS = [
  '## 11. Future WP-02 apply checklist（**future only；本 doc 不執行**）',
  '## 12. Post-write verification checklist（**future only；本 doc 不執行**）',
];

// §7.3 Absolute placeholder rule 之 meta 段落標題。
const PLACEHOLDER_RULE_HEADING = '### 7.3 Absolute placeholder rule';

// §14 核心「絕不 guess」紅線宣告（子字串 include；不強求逐字元完整）。
const RED_LINE_MARKERS = [
  '絕不** guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt`',
  '絕不** 從 slug / date / title / URL path / GitHub metadata / 檔名 yyyymmdd',
  '絕不** 由 `we-media-myself2` sidecar 之 URL pattern 反推其他 6 篇之 URL',
  '絕不** 填任何值於 `blogger.bloggerPostId`',
];

// §16 recommendation：明示 worksheet-only / idle-freeze。
const RECOMMENDATION_MARKER =
  '建議：本 doc landing 後 remain worksheet-only';

// §7.1 create-case placeholder diff 之 code fence 起始標記。
// 逐行找 `--- /dev/null` 之後之 diff block，驗證只含 <PLACEHOLDER_*> token、**不含**真實 URL。
const CREATE_CASE_DIFF_START = '--- /dev/null';

// §7.1 create-case diff block 內禁止之真實 URL / domain 痕跡。
const FORBIDDEN_SUBSTRINGS_IN_CREATE_CASE_DIFF = [
  'https://',
  'blogspot.com',
  '.html',
];

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

// 1. doc exists
if (!existsSync(DOC_PATH)) {
  record(`doc exists: "${DOC_REL}"`, false, `missing at ${DOC_PATH}`);
  console.log('');
  console.log('one-post-worksheet-contract guard: 0/1 PASS');
  process.exit(1);
}
record(`doc exists: "${DOC_REL}"`, true);

// 2. doc readable
let text;
try {
  text = readFileSync(DOC_PATH, 'utf-8');
  record(`doc readable`, true, `${text.length} chars`);
} catch (err) {
  record(`doc readable`, false, err.message);
  console.log('');
  console.log('one-post-worksheet-contract guard: 0/2 PASS');
  process.exit(1);
}

const lines = text.split(/\r?\n/);

// 3. header title
const headerOk = lines[0]?.startsWith(EXPECTED_TITLE);
record(`header title starts with "${EXPECTED_TITLE}"`, headerOk,
  headerOk ? '' : `got "${lines[0] ?? ''}"`);

// 4. 5 rollback drill scenarios present（§13.1–§13.5）
for (const sc of ROLLBACK_SCENARIOS) {
  const ok = lines.some((ln) => ln.startsWith(sc.headingPrefix));
  record(`§${sc.section} rollback scenario heading present`, ok,
    ok ? '' : `expected line starting with "${sc.headingPrefix}"`);
}

// 5. §10 abort condition table：A-1 – A-11 皆在
for (const label of EXPECTED_ABORT_LABELS) {
  const pattern = new RegExp(`^\\| ${label} \\|`);
  const ok = lines.some((ln) => pattern.test(ln));
  record(`§10 abort condition row present: "${label}"`, ok,
    ok ? '' : `expected table row "| ${label} |"`);
}

// 6. §6.1 8 placeholder tokens 皆有定義
//    定義行形如「| <PLACEHOLDER_X> | ... | ... |」
for (const token of PLACEHOLDER_TOKENS) {
  // 於整份 doc 中搜；限制條件 = 該 token 至少 appears in §6.1 table row
  // 為避免 §7.1 code block reference 造成假 PASS，額外要求該 token 出現在 pipe-table row
  const rowPattern = new RegExp(`^\\| \`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\|`);
  const ok = lines.some((ln) => rowPattern.test(ln));
  record(`§6.1 placeholder token definition row present: "${token}"`, ok,
    ok ? '' : `expected table row starting with "| \`${token}\` |"`);
}

// 7. §11 / §12 future-only 邊界標記
for (const marker of FUTURE_ONLY_MARKERS) {
  const ok = lines.some((ln) => ln === marker);
  record(`future-only marker line present: "${marker.slice(0, 60)}${marker.length > 60 ? '…' : ''}"`,
    ok, ok ? '' : `expected exact line`);
}

// 8. §7.3 Absolute placeholder rule 標題
{
  const ok = lines.some((ln) => ln === PLACEHOLDER_RULE_HEADING);
  record(`§7.3 placeholder-rule heading present: "${PLACEHOLDER_RULE_HEADING}"`,
    ok, ok ? '' : 'missing');
}

// 9. §14 核心「絕不 guess」紅線宣告
for (const marker of RED_LINE_MARKERS) {
  const ok = text.includes(marker);
  record(`§14 red-line marker present: "${marker.slice(0, 50)}${marker.length > 50 ? '…' : ''}"`,
    ok, ok ? '' : 'missing');
}

// 10. §16 recommendation 明示 worksheet-only
{
  const ok = text.includes(RECOMMENDATION_MARKER);
  record(`§16 recommendation marker present: "${RECOMMENDATION_MARKER}"`,
    ok, ok ? '' : 'missing');
}

// 11. §7.1 create-case diff block 只含 <PLACEHOLDER_*> token；**不含**真實 URL / domain / .html
//     切出從 `--- /dev/null` 起至下一個 code fence 結束（``` 為 close）為止之 block。
{
  const startIdx = lines.findIndex((ln) => ln.trim() === CREATE_CASE_DIFF_START);
  if (startIdx < 0) {
    record(`§7.1 create-case diff block anchor present: "${CREATE_CASE_DIFF_START}"`,
      false, 'missing');
  } else {
    record(`§7.1 create-case diff block anchor present: "${CREATE_CASE_DIFF_START}"`, true);

    let endIdx = lines.length;
    for (let i = startIdx + 1; i < lines.length; i += 1) {
      if (lines[i].trim() === '```') {
        endIdx = i;
        break;
      }
    }
    const block = lines.slice(startIdx, endIdx).join('\n');

    // Positive：至少含 <PLACEHOLDER_PUBLISHED_URL> 與 <PLACEHOLDER_PUBLISHED_AT>
    const hasUrlToken = block.includes('<PLACEHOLDER_PUBLISHED_URL>');
    record(`§7.1 create-case diff contains <PLACEHOLDER_PUBLISHED_URL>`, hasUrlToken,
      hasUrlToken ? '' : 'missing');

    const hasAtToken = block.includes('<PLACEHOLDER_PUBLISHED_AT>');
    record(`§7.1 create-case diff contains <PLACEHOLDER_PUBLISHED_AT>`, hasAtToken,
      hasAtToken ? '' : 'missing');

    // Negative：禁止真實 URL / domain / .html 痕跡
    for (const bad of FORBIDDEN_SUBSTRINGS_IN_CREATE_CASE_DIFF) {
      const hit = block.includes(bad);
      record(`§7.1 create-case diff free of "${bad}"`, !hit,
        hit ? `unexpected substring "${bad}" in create-case diff block` : '');
    }
  }
}

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;

console.log('');
console.log('one-post-worksheet-contract summary:');
console.log(`  doc: ${DOC_REL}`);
console.log(`  rollback scenarios scanned: ${ROLLBACK_SCENARIOS.length}`);
console.log(`  abort labels scanned: ${EXPECTED_ABORT_LABELS.length}`);
console.log(`  placeholder tokens scanned: ${PLACEHOLDER_TOKENS.length}`);
console.log(`  total assertions: ${total}`);
console.log('');
console.log(`one-post-worksheet-contract guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);

if (passed !== total) {
  console.log('');
  console.log('FAIL reasons:');
  for (const c of cases.filter((x) => !x.ok)) {
    console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  process.exit(1);
}
