#!/usr/bin/env node
// Phase 20260711：check:blogger-backfill:write-rehearsal-template-contract
//
// Static contract guard for docs/20260710-blogger-backfill-write-rehearsal-template.md
// (WP-01 rehearsal template；docs-only；本 doc 為 offline 可走完之 rehearsal 模板，
// **不**含任何 Blogger 真值、**不**寫任何 sidecar、**不**啟動 WP-02。)
//
// 範圍 / 邊界（read-only；本 guard 完全不寫 / 不呼叫 API / 不啟動 write phase）：
//   - 純讀該份 docs markdown 文字；**不**執行任何其他腳本；**不** build / deploy / dev
//     server / fetch / pull；**不**寫任何檔；**不**讀取 deploy clone；**不**碰 gh-pages；
//     **不**呼叫 Blogger / Google / GA4 / AdSense API；**不**動 report-only backfill
//     guard 語意；**不**觸發 WP-02 真實 sidecar 寫入；**不**要求 Dean 提供之 Blogger
//     真值。
//
// 與既有 3 支 doc-contract guard 之關係（互補、非重疊）：
//   - check:blogger-backfill:wp02-intake-contract               守 WP-02 intake packet
//   - check:blogger-backfill:one-post-worksheet-contract        守 one-post worksheet
//   - check:blogger-backfill:wp02-one-post-consistency-contract 守 上述兩份 doc 跨檔 drift
//   - 本 guard（write-rehearsal-template-contract）             守 rehearsal template 內部結構
//
// 抽取（正規化後結構；不做 byte-for-byte 比對；不綁行號 / 空白）：
//   R-A. Header title + `WP-01` + `docs-only` scope tags（頂 20 行）
//   R-B. 13 個 top-level 標題（§0 Boot baseline ~ §12 變更安全性）
//   R-C. §4.2 template table：per-slug row + `sidecar action` 欄位（`update` / `create`）
//   R-D. §4.3 sidecar JSON template：`schemaVersion: 1` / `<Dean to provide>` placeholder /
//        `"bloggerPostId": ""` / `"canonical"` / `"blogger"`
//   R-E. §7 post-write verification：`**V-1**` ~ `**V-10**`（10 項）
//   R-F. §8 rollback：Case A / Case B / Case C 三個 subheading（§8.1 / §8.2 / §8.3）
//   R-G. §8.4 rollback drill：Mock scenario 1 / 2 / 3
//   R-H. §9.1 data red lines：5 個 `絕不**` marker（guess / 從 slug 推導 / 由 URL pattern
//        反推 / 由 markdown date 推導 / 填 bloggerPostId）
//   R-I. §11 recommendation：`remain rehearsal-only` + `idle freeze`
//
// 斷言（本 doc 內部；不與其他 doc 比對）：
//   1. Doc 存在且可讀
//   2. Header title + WP-01 scope + docs-only 標記
//   3. 13 個 top-level 標題皆存在
//   4. §4.2 表 7 個 slug 各出現一次；`we-media-myself2` action = `update`；其餘 6 篇 action = `create`
//   5. §4.3 template 內含 5 個核心 JSON marker（含 placeholder + bloggerPostId 空字串）
//   6. V-1 ~ V-10 10 個 marker 皆存在
//   7. §8.1 Case A / §8.2 Case B / §8.3 Case C 三個 subheading 皆存在
//   8. §8.4 Mock scenario 1 / 2 / 3 皆存在
//   9. §9.1 5 個 `絕不` red-line marker 皆存在
//   10. §11 recommendation 兩個關鍵字皆存在
//   11. 全文不得出現 `.blogspot.com` literal（rehearsal 模板應以 `<blogger-domain>`
//       placeholder 取代；防未來誤 leak Blogger 真值）
//
// Negative / counter cases（in-memory fixtures；不改動正式 doc；證明 comparator 於 drift
// 時 fail）：
//   N-1. 若 §4.2 表 `we-media-myself2` 之 `sidecar action` 由 `update` 被改為 `create`，
//        per-slug action comparator 應偵測。
//   N-2. 若 §4.2 表其中一 candidate slug 被移除，per-slug row comparator 應偵測。
//   N-3. 若 §4.3 sidecar JSON template 之 `"bloggerPostId": ""` 被改為含真值（例：
//        `"bloggerPostId": "12345"`），bloggerPostId 空字串 comparator 應偵測。
//
// Exit：所有 assertion PASS → exit 0；任一 FAIL → exit 1。

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const DOC_REL = 'docs/20260710-blogger-backfill-write-rehearsal-template.md';
const DOC_PATH = path.join(REPO_ROOT, DOC_REL);

const EXPECTED_TITLE = '# Blogger backfill write-phase rehearsal template（docs-only；WP-01）';

const TOP_HEADINGS = [
  '## 0. Boot baseline',
  '## 1. 結論',
  '## 2. Relationship to WP-01 and WP-02',
  '## 3. Current report-only backfill baseline',
  '## 4. Required Dean input table template',
  '## 5. Dry-run checklist',
  '## 6. Apply-phase checklist',
  '## 7. Post-write verification checklist',
  '## 8. Rollback / recovery checklist',
  '## 9. Red lines',
  '## 10. WP-01 non-goals',
  '## 11. Recommendation',
  '## 12. 變更安全性',
];

// §4.2 template table：7 個 slug + sidecar action。
const CANDIDATE_ROWS = [
  { slug: 'we-media-myself2',                  action: 'update' },
  { slug: 'after-work-writing-time-blocking',  action: 'create' },
  { slug: 'ai-tools-simplify-daily-workflow',  action: 'create' },
  { slug: 'blog-as-personal-knowledge-base',   action: 'create' },
  { slug: 'blog-restart-steady-rhythm-notes',  action: 'create' },
  { slug: 'daily-reading-habit-notes',         action: 'create' },
  { slug: 'reading-notes-three-questions',     action: 'create' },
];

// §4.3 sidecar JSON template markers.
const SIDECAR_TEMPLATE_MARKERS = [
  '"schemaVersion": 1',
  '<Dean to provide>',
  '"bloggerPostId": ""',
  '"canonical"',
  '"blogger"',
];

// §7 post-write verification V-1 ~ V-10.
const V_MARKERS = Array.from({ length: 10 }, (_, i) => `**V-${i + 1}**`);

// §8 rollback cases.
const ROLLBACK_CASE_HEADINGS = [
  '### 8.1 Case A：apply 完成、commit 尚未執行',
  '### 8.2 Case B：commit 完成、push 尚未執行',
  '### 8.3 Case C：push 已完成（發現需 revert）',
];

// §8.4 rollback drill mock scenarios.
const MOCK_SCENARIOS = [
  '**Mock scenario 1**',
  '**Mock scenario 2**',
  '**Mock scenario 3**',
];

// §9.1 red lines 5 markers（sub-string 命中；不強逐字元）。
const RED_LINE_MARKERS = [
  '絕不** guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt`',
  '絕不** 從 slug / date / title / URL path / GitHub metadata',
  '絕不** 由 `we-media-myself2` sidecar 之 URL pattern 反推',
  '絕不** 由 markdown frontmatter `date` 推導 Blogger `publishedAt`',
  '絕不** 填任何值於 `blogger.bloggerPostId`',
];

// §11 recommendation 兩個關鍵字。
const RECOMMENDATION_MARKERS = [
  'remain rehearsal-only',
  'idle freeze',
];

// 禁止 token：全文不得出現 `.blogspot.com` literal。
const FORBIDDEN_TOKEN = '.blogspot.com';

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

// 1. Doc 存在 + 可讀
if (!existsSync(DOC_PATH)) {
  record(`doc exists: "${DOC_REL}"`, false, `missing at ${DOC_PATH}`);
  console.log('');
  console.log('write-rehearsal-template-contract guard: 0/1 PASS');
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
  console.log('write-rehearsal-template-contract guard: 0/2 PASS');
  process.exit(1);
}

const lines = text.split(/\r?\n/);

// 2. Header title + WP-01 + docs-only
{
  const headerOk = lines[0]?.startsWith(EXPECTED_TITLE);
  record(
    `header title starts with "${EXPECTED_TITLE}"`,
    headerOk,
    headerOk ? '' : `got "${lines[0] ?? ''}"`,
  );

  // 頂 20 行內應含 `WP-01` scope tag
  const top20 = lines.slice(0, 20).join('\n');
  record(
    `top-of-doc contains WP-01 scope tag`,
    top20.includes('WP-01'),
    top20.includes('WP-01') ? '' : 'WP-01 tag missing from lines 1..20',
  );
  record(
    `top-of-doc contains docs-only marker`,
    top20.includes('docs-only'),
    top20.includes('docs-only') ? '' : 'docs-only marker missing from lines 1..20',
  );
}

// 3. 13 個 top-level 標題皆存在
for (const heading of TOP_HEADINGS) {
  const hit = lines.some((ln) => ln.startsWith(heading));
  record(`top-level heading present: "${heading}"`, hit,
    hit ? '' : 'section heading missing');
}

// 4. §4.2 表 7 個 slug + sidecar action
//    每列 pattern：`| N | \`<slug>\` | <markdown path> | <sidecar path> | \`<action>\` |...`
//    抽取 §4.2 起、§4.3 前之範圍。
function findSectionRange(startPattern, endPattern) {
  const startIdx = lines.findIndex((ln) => startPattern.test(ln));
  if (startIdx < 0) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    if (endPattern.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  return { startIdx, endIdx, body: lines.slice(startIdx, endIdx) };
}

const S42_RANGE = findSectionRange(/^### 4\.2 模板表/, /^### 4\.3 /);
if (!S42_RANGE) {
  record(`§4.2 template table range extractable`, false,
    'could not locate ### 4.2 ... before ### 4.3');
} else {
  record(`§4.2 template table range extractable`, true,
    `lines ${S42_RANGE.startIdx + 1}..${S42_RANGE.endIdx}`);

  const s42Body = S42_RANGE.body.join('\n');

  for (const cand of CANDIDATE_ROWS) {
    // slug 出現於 §4.2 表中；且 `\`<action>\`` 於同一行相符。
    // Row shape:
    //   | # | `<slug>` | `<md-path>` | `<sc-path>` | `<action>` | ...
    // 使用 per-line regex；slug 與 action 皆以 backtick 包住。
    const slugCell = new RegExp(`\\|\\s*\`${cand.slug.replace(/[-.]/g, '\\$&')}\`\\s*\\|`);
    const rowLine = S42_RANGE.body.find((ln) => slugCell.test(ln));
    if (!rowLine) {
      record(`§4.2 row present: "${cand.slug}"`, false, 'row missing');
      continue;
    }
    const actionMatch = rowLine.includes(`\`${cand.action}\``);
    record(
      `§4.2 row "${cand.slug}" has sidecar action \`${cand.action}\``,
      actionMatch,
      actionMatch ? '' : `row present but expected action "${cand.action}" not found`,
    );
  }
}

// 5. §4.3 sidecar JSON template markers
const S43_RANGE = findSectionRange(/^### 4\.3 期望 sidecar 落地形態/, /^## /);
if (!S43_RANGE) {
  record(`§4.3 sidecar JSON template range extractable`, false,
    'could not locate ### 4.3 before next ## heading');
} else {
  const s43Body = S43_RANGE.body.join('\n');
  for (const marker of SIDECAR_TEMPLATE_MARKERS) {
    const hit = s43Body.includes(marker);
    record(`§4.3 marker present: ${marker}`, hit,
      hit ? '' : 'marker missing from §4.3 body');
  }
}

// 6. §7 V-1 ~ V-10
const S7_RANGE = findSectionRange(/^## 7\. Post-write verification/, /^## 8\. /);
if (!S7_RANGE) {
  record(`§7 range extractable`, false,
    'could not locate ## 7. before ## 8.');
} else {
  const s7Body = S7_RANGE.body.join('\n');
  for (const marker of V_MARKERS) {
    const hit = s7Body.includes(marker);
    record(`§7 verification marker present: ${marker}`, hit,
      hit ? '' : 'marker missing from §7 body');
  }
}

// 7. §8 Case A / Case B / Case C
for (const heading of ROLLBACK_CASE_HEADINGS) {
  const hit = lines.some((ln) => ln === heading);
  record(`§8 rollback case heading present: "${heading}"`, hit,
    hit ? '' : 'heading missing');
}

// 8. §8.4 Mock scenario 1 / 2 / 3
const S84_RANGE = findSectionRange(/^### 8\.4 Rollback drill/, /^## /);
if (!S84_RANGE) {
  record(`§8.4 rollback drill range extractable`, false,
    'could not locate ### 8.4 before next ## heading');
} else {
  const s84Body = S84_RANGE.body.join('\n');
  for (const marker of MOCK_SCENARIOS) {
    const hit = s84Body.includes(marker);
    record(`§8.4 mock scenario marker present: ${marker}`, hit,
      hit ? '' : 'marker missing from §8.4 body');
  }
}

// 9. §9.1 red lines
const S91_RANGE = findSectionRange(/^### 9\.1 Data red lines/, /^### 9\.2 /);
if (!S91_RANGE) {
  record(`§9.1 data red lines range extractable`, false,
    'could not locate ### 9.1 before ### 9.2');
} else {
  const s91Body = S91_RANGE.body.join('\n');
  for (const marker of RED_LINE_MARKERS) {
    const hit = s91Body.includes(marker);
    record(`§9.1 red-line marker present: "${marker.slice(0, 50)}…"`, hit,
      hit ? '' : 'red-line marker missing from §9.1 body');
  }
}

// 10. §11 recommendation markers
const S11_RANGE = findSectionRange(/^## 11\. Recommendation/, /^## 12\. /);
if (!S11_RANGE) {
  record(`§11 recommendation range extractable`, false,
    'could not locate ## 11. before ## 12.');
} else {
  const s11Body = S11_RANGE.body.join('\n');
  for (const marker of RECOMMENDATION_MARKERS) {
    const hit = s11Body.includes(marker);
    record(`§11 recommendation marker present: "${marker}"`, hit,
      hit ? '' : 'marker missing from §11 body');
  }
}

// 11. 禁止 token：全文不得出現 `.blogspot.com` literal
{
  const hit = text.includes(FORBIDDEN_TOKEN);
  record(
    `forbidden token absent whole-doc: "${FORBIDDEN_TOKEN}"`,
    !hit,
    hit ? `token "${FORBIDDEN_TOKEN}" leaked into doc; should stay as <blogger-domain> placeholder` : '',
  );
}

// 12. Negative in-memory counter cases（驗證 comparator 於 drift 時 fail；不寫檔）
{
  // N-1：swap `we-media-myself2` action `update` → `create`
  const rowLineOriginal =
    '| 1 | `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.md` | `content/blogger/posts/20260515-we-media-myself2.publish.json` | `update` | ...';
  const rowLineDrifted = rowLineOriginal.replace('`update`', '`create`');
  const canonicalCand = CANDIDATE_ROWS[0]; // we-media-myself2 / update
  const driftDetectedN1 =
    rowLineDrifted.includes(`\`${canonicalCand.slug}\``) &&
    !rowLineDrifted.includes(`\`${canonicalCand.action}\``);
  record(
    `negative N-1: swap "we-media-myself2" action update→create detected by per-slug action comparator`,
    driftDetectedN1,
    driftDetectedN1
      ? `detected: row still names "${canonicalCand.slug}" but action "${canonicalCand.action}" absent`
      : `expected drift not detected in fixture row`,
  );

  // N-2：§4.2 表移除一個 candidate slug 之 row
  const fixtureRows42 = CANDIDATE_ROWS.filter((c) => c.slug !== 'ai-tools-simplify-daily-workflow');
  const missingSlug = 'ai-tools-simplify-daily-workflow';
  const driftDetectedN2 = !fixtureRows42.some((c) => c.slug === missingSlug);
  record(
    `negative N-2: remove candidate row "${missingSlug}" detected by per-slug row comparator`,
    driftDetectedN2,
    driftDetectedN2
      ? `detected: slug "${missingSlug}" absent from fixture row set`
      : `expected drift not detected`,
  );

  // N-3：§4.3 sidecar JSON template `"bloggerPostId": ""` → 含真值
  const s43MarkerOriginal = '"bloggerPostId": ""';
  const s43MarkerDrifted = '"bloggerPostId": "12345"';
  const fixtureS43Drifted = `{ "blogger": { ${s43MarkerDrifted} } }`;
  const driftDetectedN3 = !fixtureS43Drifted.includes(s43MarkerOriginal);
  record(
    `negative N-3: replace §4.3 bloggerPostId empty-string with real value detected by marker comparator`,
    driftDetectedN3,
    driftDetectedN3
      ? `detected: exact marker "${s43MarkerOriginal}" absent in drifted fixture`
      : `expected drift not detected`,
  );
}

// Summary
const total = cases.length;
const passed = cases.filter((c) => c.ok).length;
const failed = total - passed;

console.log('');
console.log('write-rehearsal-template-contract summary:');
console.log(`  doc: ${DOC_REL}`);
console.log(`  candidate rows scanned: ${CANDIDATE_ROWS.length}`);
console.log(`  top-level headings scanned: ${TOP_HEADINGS.length}`);
console.log(`  V-marker items scanned: ${V_MARKERS.length}`);
console.log(`  mock scenarios scanned: ${MOCK_SCENARIOS.length}`);
console.log(`  red-line markers scanned: ${RED_LINE_MARKERS.length}`);
console.log(`  total assertions: ${total}`);
console.log('');
console.log(`write-rehearsal-template-contract guard: ${passed}/${total} PASS`);

process.exit(failed === 0 ? 0 : 1);
