#!/usr/bin/env node
// Phase 20260711：check:blogger-backfill:wp02-intake-contract docs contract guard
// （source-level 靜態斷言；純讀 docs markdown 文字）。
//
// 範圍 / 邊界：
//   - 純讀 docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md 文字；**不**執行任何
//     其他腳本；**不** build / deploy / dev server / fetch / pull；**不**寫任何檔；**不**讀取
//     deploy clone（/d/github/blog-new/portable-blog-deploy）；**不**碰 gh-pages；**不**呼叫
//     Blogger / Google / GA4 / AdSense API；**不**動 report-only backfill guard 語意；**不**觸發
//     WP-02 真實 sidecar 寫入。
//
// 目的（防呆 / 防回歸）：
//   WP-02 true-value intake packet 是 7 篇 candidate 之空白填寫包；本 guard 靜態斷言該 doc 之
//   結構仍為「7 個具名 intake item + Dean-provided true values 全空 + Review checklist 全未勾選
//   + Ready-for-write 0/7」。若未來有人：
//     (a) 誤刪其中任一 intake item；
//     (b) 誤填任何 Blogger 真值（publishedUrl / publishedAt / evidence / notes）；
//     (c) 誤勾任何 Review checklist item；
//     (d) 誤改 bloggerPostId 之 API-only 固定標記；
//     (e) 誤刪 expected sidecar path；
//   本 guard 靜態抓出來。與 check:blogger-backfill（report-only 掃 sidecar 資料）互補：本 guard
//   守 **doc 結構契約**，不掃 sidecar 資料、不改變 backfill guard 語意。
//
// 斷言：
//   1. Target doc 可讀。
//   2. Header title 正確。
//   3. 7 個具名 intake item（§E.1–§E.7）皆存在，slug 對照 fixed identifier。
//   4. 每個 intake item 之三個子小節皆存在（Fixed identifiers / Dean-provided Blogger true values
//      / Review checklist before any future write）。
//   5. 每個 intake item 之 expected sidecar path 到齊。
//   6. 每個 intake item 之 Dean-provided Blogger true values 五欄位：
//      - Blogger published URL / Blogger publishedAt / evidence / notes 皆為 empty
//        （no non-whitespace after colon）
//      - Blogger postId 為 fixed API-only 標記（`""`（一律留空；API-only；per §D.2））
//   7. 每個 intake item 之 Review checklist 皆為 7 個 unchecked `[ ]`（無 `[x]` / `[X]`）。
//   8. §F.3 現況表明列 `Ready for write: 0 / 7`。
//   9. §G forbidden-actions 之核心猜值紅線宣告皆命中。

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DOC_REL = 'docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md';
const DOC_PATH = path.join(REPO_ROOT, DOC_REL);

const EXPECTED_TITLE = '# Blogger backfill WP-02 true-value intake packet';

// 7 具名 intake item：對照 doc §E.1–§E.7；順序固定；slug 與 sidecar path 對照 dry-run report。
const INTAKE_ITEMS = [
  {
    section: 'E.1',
    n: '01',
    slug: 'we-media-myself2',
    sidecar: 'content/blogger/posts/20260515-we-media-myself2.publish.json',
  },
  {
    section: 'E.2',
    n: '02',
    slug: 'after-work-writing-time-blocking',
    sidecar: 'content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json',
  },
  {
    section: 'E.3',
    n: '03',
    slug: 'ai-tools-simplify-daily-workflow',
    sidecar: 'content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.publish.json',
  },
  {
    section: 'E.4',
    n: '04',
    slug: 'blog-as-personal-knowledge-base',
    sidecar: 'content/blogger/posts/20260612-blog-as-personal-knowledge-base.publish.json',
  },
  {
    section: 'E.5',
    n: '05',
    slug: 'blog-restart-steady-rhythm-notes',
    sidecar: 'content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json',
  },
  {
    section: 'E.6',
    n: '06',
    slug: 'daily-reading-habit-notes',
    sidecar: 'content/blogger/posts/20260612-daily-reading-habit-notes.publish.json',
  },
  {
    section: 'E.7',
    n: '07',
    slug: 'reading-notes-three-questions',
    sidecar: 'content/blogger/posts/20260612-reading-notes-three-questions.publish.json',
  },
];

const REQUIRED_SUBHEADINGS = [
  '#### Fixed identifiers',
  '#### Dean-provided Blogger true values',
  '#### Review checklist before any future write',
];

// Dean-provided Blogger true values 五欄位；publishedUrl / publishedAt / evidence / notes 必空；
// bloggerPostId 為 fixed API-only 標記。
const POSTID_FIXED_LINE =
  '- Blogger postId: `""`（一律留空；API-only；per §D.2）';

// §F.3 之 ready-for-write 現況 summary line。
const READY_FOR_WRITE_LINE = '**Ready for write: 0 / 7**';

// §G 之核心猜值紅線宣告；至少下列句子需命中（不強求逐字元一致，但需 include）。
const FORBIDDEN_ACTION_MARKERS = [
  '不可** 從 Blogger URL 反推 `bloggerPostId`',
  '不可** 用日期 / slug / title 假造 `bloggerPostId`',
  '不可** 從 Blogger URL 反推 `publishedAt`',
  '不可** 從 GitHub markdown frontmatter `date` 推導 Blogger `publishedAt`',
];

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

// 1. Target doc 可讀
if (!existsSync(DOC_PATH)) {
  record(`doc exists: "${DOC_REL}"`, false, `missing at ${DOC_PATH}`);
  console.log('');
  console.log('wp02-intake-contract guard: 0/1 PASS');
  process.exit(1);
}
record(`doc exists: "${DOC_REL}"`, true);

let text;
try {
  text = readFileSync(DOC_PATH, 'utf-8');
  record(`doc readable`, true, `${text.length} chars`);
} catch (err) {
  record(`doc readable`, false, err.message);
  console.log('');
  console.log('wp02-intake-contract guard: 0/2 PASS');
  process.exit(1);
}

const lines = text.split(/\r?\n/);

// 2. Header title 正確
const headerOk = lines[0]?.startsWith(EXPECTED_TITLE);
record(`header title starts with "${EXPECTED_TITLE}"`, headerOk,
  headerOk ? '' : `got "${lines[0] ?? ''}"`);

// 從整份 doc 中切出 §E.x 每個 intake item 的內容區塊。
// 每個 item block = 從其 `### E.x Intake item ##` 標題起，到下一個 `### ` 或 `## ` 標題為止。
function findSectionRange(startPattern) {
  const startIdx = lines.findIndex((ln) => startPattern.test(ln));
  if (startIdx < 0) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    if (/^### /.test(lines[i]) || /^## /.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  return { startIdx, endIdx, body: lines.slice(startIdx, endIdx) };
}

// 3. + 4. + 5. + 6. + 7. 對每個 intake item 逐項斷言
for (const item of INTAKE_ITEMS) {
  const headingPattern = new RegExp(
    `^### ${item.section.replace('.', '\\.')} Intake item ${item.n} — \`${item.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\``,
  );
  const range = findSectionRange(headingPattern);
  const found = range !== null;
  record(
    `§${item.section} intake item present: "${item.slug}"`,
    found,
    found ? '' : 'section heading missing',
  );
  if (!found) continue;

  const body = range.body.join('\n');

  // 4. 三個子小節
  for (const sub of REQUIRED_SUBHEADINGS) {
    const ok = body.includes(sub);
    record(`§${item.section} subheading present: "${sub}"`, ok,
      ok ? '' : 'missing');
  }

  // 5. expected sidecar path 到齊（於 Fixed identifiers 區塊中列出）
  const sidecarLine = `- expected sidecar path: \`${item.sidecar}\``;
  const sidecarOk = body.includes(sidecarLine);
  record(`§${item.section} expected sidecar path present`, sidecarOk,
    sidecarOk ? '' : `missing "${sidecarLine}"`);

  // 6. Dean-provided Blogger true values 五欄位
  //    切出 Dean-provided block（從其小節標題起，到 Review checklist 小節止）
  const deanStartIdx = range.body.findIndex(
    (ln) => ln === '#### Dean-provided Blogger true values',
  );
  const deanEndIdx = range.body.findIndex(
    (ln, idx) => idx > deanStartIdx && ln === '#### Review checklist before any future write',
  );
  const deanBlockLines =
    deanStartIdx >= 0 && deanEndIdx > deanStartIdx
      ? range.body.slice(deanStartIdx + 1, deanEndIdx)
      : [];

  function findValueLine(prefix) {
    return deanBlockLines.find((ln) => ln.startsWith(prefix));
  }
  function assertEmptyValue(fieldLabel, prefix) {
    const line = findValueLine(prefix);
    if (line === undefined) {
      record(`§${item.section} Dean-provided "${fieldLabel}" line present`, false, 'not found');
      return;
    }
    const after = line.slice(prefix.length);
    const empty = after.trim().length === 0;
    record(`§${item.section} Dean-provided "${fieldLabel}" empty`, empty,
      empty ? '' : `got "${after.trim()}"`);
  }

  assertEmptyValue('Blogger published URL', '- Blogger published URL:');
  assertEmptyValue('Blogger publishedAt', '- Blogger publishedAt:');
  assertEmptyValue('evidence / screenshot / admin source', '- evidence / screenshot / admin source:');
  assertEmptyValue('notes', '- notes:');

  // bloggerPostId 為 fixed API-only 標記
  const postIdOk = deanBlockLines.some((ln) => ln === POSTID_FIXED_LINE);
  record(`§${item.section} Dean-provided "Blogger postId" fixed API-only marker present`,
    postIdOk,
    postIdOk ? '' : `expected line "${POSTID_FIXED_LINE}"`);

  // 7. Review checklist 為 7 個 unchecked `[ ]`；無 `[x]` / `[X]`
  const reviewStartIdx = deanEndIdx;
  const reviewBlockLines = range.body.slice(reviewStartIdx + 1);
  const uncheckedCount = reviewBlockLines.filter((ln) => /^- \[ \] /.test(ln)).length;
  const checkedCount = reviewBlockLines.filter((ln) => /^- \[[xX]\] /.test(ln)).length;
  record(`§${item.section} Review checklist has exactly 7 unchecked items`, uncheckedCount === 7,
    uncheckedCount === 7 ? '' : `got ${uncheckedCount}`);
  record(`§${item.section} Review checklist has zero checked items`, checkedCount === 0,
    checkedCount === 0 ? '' : `got ${checkedCount}`);
}

// 8. §F.3 現況表明列 `Ready for write: 0 / 7`
const readyOk = text.includes(READY_FOR_WRITE_LINE);
record(`§F.3 "${READY_FOR_WRITE_LINE}" present`, readyOk,
  readyOk ? '' : 'missing');

// 9. §G 之核心猜值紅線宣告皆命中
for (const marker of FORBIDDEN_ACTION_MARKERS) {
  const ok = text.includes(marker);
  record(`§G forbidden-action marker present: "${marker.slice(0, 50)}${marker.length > 50 ? '…' : ''}"`,
    ok, ok ? '' : 'missing');
}

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;

console.log('');
console.log('wp02-intake-contract summary:');
console.log(`  doc: ${DOC_REL}`);
console.log(`  intake items scanned: ${INTAKE_ITEMS.length}`);
console.log(`  total assertions: ${total}`);
console.log('');
console.log(`wp02-intake-contract guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);

if (passed !== total) {
  console.log('');
  console.log('FAIL reasons:');
  for (const c of cases.filter((x) => !x.ok)) {
    console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  process.exit(1);
}
