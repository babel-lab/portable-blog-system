#!/usr/bin/env node
// Phase 20260711：check:blogger-backfill:wp02-one-post-consistency-contract
// Cross-document consistency guard between two docs-only artifacts:
//   - docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md
//   - docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md
//
// 範圍 / 邊界（read-only；本 guard 完全不寫 / 不呼叫 API / 不啟動 write phase）：
//   - 純讀兩份 docs markdown 文字；**不**執行任何其他腳本；**不** build / deploy / dev
//     server / fetch / pull；**不**寫任何檔；**不**讀取 deploy clone；**不**碰 gh-pages；
//     **不**呼叫 Blogger / Google / GA4 / AdSense API；**不**動 report-only backfill guard
//     語意；**不**觸發 WP-02 真實 sidecar 寫入；**不**要求 Dean 提供之 Blogger 真值。
//
// 目的（防呆 / 防跨文件 drift）：
//   兩份 doc 皆列出「同一組 7 篇 WP-02 candidate」；本 guard 靜態斷言下列「應共享且不應
//   漂移」之語意在兩份 doc 之間仍然一致。與既有兩支 doc-contract guard 互補：
//     - check:blogger-backfill:wp02-intake-contract          守 intake packet 內部結構
//     - check:blogger-backfill:one-post-worksheet-contract   守 worksheet 內部結構
//     - 本 guard（consistency-contract）                     守跨文件 drift
//
// 抽取（正規化後結構；不做 byte-for-byte 比對）：
//   Intake packet：
//     I-A. §C table 7 rows：slug / markdown path / expected sidecar path / sidecar status
//     I-B. §E.1–§E.7 headings：slug
//     I-C. §E.x Fixed identifiers "- expected sidecar path: `...`"：sidecar path
//   One-post worksheet：
//     W-A. §4 table 7 rows：source markdown / sidecar status（**bold or plain**）
//     W-B. §5.2 table 7 rows：slug
//
// 斷言（cross-doc；per-slug；不比較 byte / 行號 / 空白）：
//   1. 兩份 doc 皆存在、可讀。
//   2. Intake 內部一致：§C table slugs == §E.x heading slugs；§C table sidecar path ==
//      §E.x Fixed identifiers sidecar path。
//   3. Worksheet 內部一致：§4 table slugs（由 markdown 檔名 slug 段落抽出）== §5.2 table slugs。
//   4. 兩份 doc 之 slug 集合相等，且與 EXPECTED_SLUGS 相等（順序無關；正規化為 Set）。
//   5. 對每個 slug：intake markdown path == worksheet markdown path（逐字元）。
//   6. 對每個 slug：intake sidecar path == worksheet markdown path 之 `.md`→`.publish.json`
//      衍生 sidecar path（逐字元）。
//   7. 對每個 slug：intake sidecar status == worksheet sidecar status（`present` / `absent`
//      正規化；worksheet 之 `**present**` 去 bold）。
//   8. `we-media-myself2` 於兩份 doc 皆為 `present`；其餘 6 篇於兩份 doc 皆為 `absent`。
//   9. 兩份 doc 皆含 `bloggerPostId` = API-only / 「一律留空」/「Dean 無法手動提供」之核心
//      規則語意（子字串命中，不要求逐字元）。
//   10. 兩份 doc 皆含 report-only baseline snapshot 字串
//       `scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5`。
//   11. 兩份 doc 皆含 `we-media-myself2` 之「recorded no-op」/「不建議 first slice」語意。
//   12. 兩份 doc 皆含 `blog-restart-steady-rhythm-notes` 之「Blogger LIVE 2026-06-17」
//       caveat + 「backfill 值仍待 Dean」/「不代表可推導真值」意涵，且未於任何欄位填入
//       Blogger 真值。
//   13. 兩份 doc 皆聲明 write phase = dormant / blocked / worksheet-only / 不啟動 WP-02。
//   14. 兩份 doc 皆聲明 single-post first slice 邊界（單篇 / 一次 1 篇 / 首篇）。
//
// Negative / counter cases（in-memory fixtures；不改動正式 doc；證明 extractor +
// comparator 於 drift 時 fail）：
//   N-1. 若 intake §C 表其中一 row 之 slug 被改，slug-set-equal comparator 應偵測。
//   N-2. 若 worksheet §4 表其中一 row 之 markdown path 之 yyyymmdd 前綴被改，per-slug
//        markdown/sidecar path comparator 應偵測。
//   N-3. 若 worksheet §4 表其中一 row 之 sidecar status 由 `absent` 改為 `**present**`，
//        per-slug sidecar-status comparator 應偵測。
//
// 非本 guard 範圍（避免重複與誤衝）：
//   - `blogspot.com` / `https://` 之 whole-doc grep：worksheet §7.3 之 red-line 討論段落
//     本身含這些 token 作為「禁止內容之描述」；whole-doc grep 會誤觸。§7.1 create-case
//     diff block 之 leak 檢查已由 check:blogger-backfill:one-post-worksheet-contract 覆蓋。
//   - intake §E.x「Dean-provided Blogger true values」欄位空白檢查：已由
//     check:blogger-backfill:wp02-intake-contract 覆蓋。
//
// Exit：所有 assertion PASS → exit 0；任一 FAIL → exit 1。

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const INTAKE_DOC_REL = 'docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md';
const WORKSHEET_DOC_REL = 'docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md';
const INTAKE_PATH = path.join(REPO_ROOT, INTAKE_DOC_REL);
const WORKSHEET_PATH = path.join(REPO_ROOT, WORKSHEET_DOC_REL);

// 期望之 7 篇 candidate slug（與 dry-run report / intake / worksheet 皆一致）。
// 順序固定（作為 assertion 對照；set-compare 忽略順序）。
const EXPECTED_SLUGS = [
  'we-media-myself2',
  'after-work-writing-time-blocking',
  'ai-tools-simplify-daily-workflow',
  'blog-as-personal-knowledge-base',
  'blog-restart-steady-rhythm-notes',
  'daily-reading-habit-notes',
  'reading-notes-three-questions',
];

const SIDECAR_PRESENT_SLUG = 'we-media-myself2';
const P3_LIVE_SLUG = 'blog-restart-steady-rhythm-notes';

const SHARED_BASELINE_SNAPSHOT_STRING =
  'scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5';

// ---------- extraction primitives ----------

// Intake §C table row（含 sidecar column）：
//   | N | `slug` | `content/blogger/posts/YYYYMMDD-slug.md` | `content/.../slug.publish.json` | present|absent | ... |
const INTAKE_C_ROW_RE =
  /^\|\s*\d+\s*\|\s*`([a-z0-9-]+)`\s*\|\s*`([^`]+\.md)`\s*\|\s*`([^`]+\.publish\.json)`\s*\|\s*(present|absent)\s*\|/;

// Intake §E.x heading：`### E.N Intake item NN — \`slug\``
const INTAKE_E_HEADING_RE = /^### E\.(\d) Intake item (\d\d) — `([a-z0-9-]+)`/;

// Intake §E.x Fixed identifiers "- expected sidecar path: `...`"
const INTAKE_E_SIDECAR_RE = /^- expected sidecar path: `([^`]+\.publish\.json)`\s*$/;

// Worksheet §4 table row：
//   | N | `content/blogger/posts/YYYYMMDD-slug.md` | present-or-absent(可為 **bold**) | ... |
const WORKSHEET_4_ROW_RE =
  /^\|\s*\d+\s*\|\s*`(content\/blogger\/posts\/\d{8}-([a-z0-9-]+)\.md)`\s*\|\s*(\*{0,2})(present|absent)\3\s*\|/;

// Worksheet §5.2 table row（第一 data column 為 slug；§5.1 heading row 為 label / spec，
// 不會誤匹配 slug 因為 slug 一律用 `<`` `>` 包裹且形如 `[a-z0-9-]+`）：
//   | N | `slug` | `update|create` | ... |
const WORKSHEET_52_ROW_RE = /^\|\s*\d+\s*\|\s*`([a-z0-9-]+)`\s*\|\s*`(update|create)`\s*\|/;

function extractIntake(text) {
  const lines = text.split(/\r?\n/);
  const cTableRows = []; // [{slug, markdown, sidecar, sidecarStatus}]
  const eHeadingSlugs = []; // [slug]
  // §E.x Fixed identifiers 之 sidecar path 需與其對應之 E heading 綁定；我們用 sequential scan：
  // 每遇到 E heading 就 push；遇到 sidecar path 就綁到最後一個 heading。
  const eSidecarPaths = new Map(); // slug -> sidecar path

  for (const ln of lines) {
    const cm = INTAKE_C_ROW_RE.exec(ln);
    if (cm) {
      cTableRows.push({
        slug: cm[1],
        markdown: cm[2],
        sidecar: cm[3],
        sidecarStatus: cm[4],
      });
      continue;
    }
    const em = INTAKE_E_HEADING_RE.exec(ln);
    if (em) {
      eHeadingSlugs.push(em[3]);
      continue;
    }
    const sm = INTAKE_E_SIDECAR_RE.exec(ln);
    if (sm && eHeadingSlugs.length > 0) {
      const currentSlug = eHeadingSlugs[eHeadingSlugs.length - 1];
      if (!eSidecarPaths.has(currentSlug)) {
        eSidecarPaths.set(currentSlug, sm[1]);
      }
      continue;
    }
  }
  return { cTableRows, eHeadingSlugs, eSidecarPaths };
}

function extractWorksheet(text) {
  const lines = text.split(/\r?\n/);
  const s4Rows = []; // [{slug, markdown, sidecarStatus}]
  const s52Rows = []; // [{slug, action}]

  for (const ln of lines) {
    const m4 = WORKSHEET_4_ROW_RE.exec(ln);
    if (m4) {
      s4Rows.push({
        slug: m4[2],
        markdown: m4[1],
        sidecarStatus: m4[4],
      });
      continue;
    }
    const m52 = WORKSHEET_52_ROW_RE.exec(ln);
    if (m52) {
      s52Rows.push({ slug: m52[1], action: m52[2] });
      continue;
    }
  }
  return { s4Rows, s52Rows };
}

// ---------- comparators（回傳 { ok, detail }） ----------

function setEqualSlugs(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size !== B.size) return { ok: false, detail: `sizes ${A.size} vs ${B.size}` };
  for (const s of A) if (!B.has(s)) return { ok: false, detail: `only in A: ${s}` };
  for (const s of B) if (!A.has(s)) return { ok: false, detail: `only in B: ${s}` };
  return { ok: true, detail: '' };
}

function perSlugStringEqual(mapA, mapB, label) {
  for (const slug of mapA.keys()) {
    if (!mapB.has(slug)) return { ok: false, detail: `${label} for ${slug} missing in B` };
    if (mapA.get(slug) !== mapB.get(slug)) {
      return {
        ok: false,
        detail: `${label} for ${slug}: A="${mapA.get(slug)}" vs B="${mapB.get(slug)}"`,
      };
    }
  }
  for (const slug of mapB.keys()) {
    if (!mapA.has(slug)) return { ok: false, detail: `${label} for ${slug} missing in A` };
  }
  return { ok: true, detail: '' };
}

function deriveSidecarFromMarkdown(mdPath) {
  return mdPath.replace(/\.md$/, '.publish.json');
}

// ---------- reporting ----------

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

// ---------- 1. two docs exist and readable ----------

let intakeText;
let worksheetText;
{
  if (!existsSync(INTAKE_PATH)) {
    record(`intake doc exists: "${INTAKE_DOC_REL}"`, false, `missing at ${INTAKE_PATH}`);
    console.log('');
    console.log('wp02-one-post-consistency-contract guard: 0/1 PASS');
    process.exit(1);
  }
  record(`intake doc exists: "${INTAKE_DOC_REL}"`, true);

  if (!existsSync(WORKSHEET_PATH)) {
    record(`worksheet doc exists: "${WORKSHEET_DOC_REL}"`, false, `missing at ${WORKSHEET_PATH}`);
    console.log('');
    console.log('wp02-one-post-consistency-contract guard: 0/2 PASS');
    process.exit(1);
  }
  record(`worksheet doc exists: "${WORKSHEET_DOC_REL}"`, true);

  try {
    intakeText = readFileSync(INTAKE_PATH, 'utf-8');
    record('intake doc readable', true, `${intakeText.length} chars`);
  } catch (err) {
    record('intake doc readable', false, err.message);
    process.exit(1);
  }
  try {
    worksheetText = readFileSync(WORKSHEET_PATH, 'utf-8');
    record('worksheet doc readable', true, `${worksheetText.length} chars`);
  } catch (err) {
    record('worksheet doc readable', false, err.message);
    process.exit(1);
  }
}

// ---------- 2. extract structures ----------

const intake = extractIntake(intakeText);
const worksheet = extractWorksheet(worksheetText);

record(`intake §C table row count == 7`, intake.cTableRows.length === 7,
  intake.cTableRows.length === 7 ? '' : `got ${intake.cTableRows.length}`);
record(`intake §E.x heading count == 7`, intake.eHeadingSlugs.length === 7,
  intake.eHeadingSlugs.length === 7 ? '' : `got ${intake.eHeadingSlugs.length}`);
record(`intake §E.x sidecar-path entries == 7`, intake.eSidecarPaths.size === 7,
  intake.eSidecarPaths.size === 7 ? '' : `got ${intake.eSidecarPaths.size}`);
record(`worksheet §4 table row count == 7`, worksheet.s4Rows.length === 7,
  worksheet.s4Rows.length === 7 ? '' : `got ${worksheet.s4Rows.length}`);
record(`worksheet §5.2 table row count == 7`, worksheet.s52Rows.length === 7,
  worksheet.s52Rows.length === 7 ? '' : `got ${worksheet.s52Rows.length}`);

// ---------- 3. intake internal consistency ----------

{
  const cSlugs = intake.cTableRows.map((r) => r.slug);
  const eSlugs = intake.eHeadingSlugs;
  const r = setEqualSlugs(cSlugs, eSlugs);
  record('intake internal: §C table slug set == §E heading slug set', r.ok, r.detail);
}
{
  // intake §C sidecar path 對應 §E.x fixed-identifiers sidecar path
  const cMap = new Map(intake.cTableRows.map((r) => [r.slug, r.sidecar]));
  const r = perSlugStringEqual(cMap, intake.eSidecarPaths, 'sidecar-path');
  record('intake internal: §C table sidecar path == §E.x Fixed identifiers sidecar path', r.ok, r.detail);
}

// ---------- 4. worksheet internal consistency ----------

{
  const s4Slugs = worksheet.s4Rows.map((r) => r.slug);
  const s52Slugs = worksheet.s52Rows.map((r) => r.slug);
  const r = setEqualSlugs(s4Slugs, s52Slugs);
  record('worksheet internal: §4 table slug set == §5.2 table slug set', r.ok, r.detail);
}

// ---------- 5. slug set matches expected and matches across docs ----------

{
  const cSlugs = intake.cTableRows.map((r) => r.slug);
  const r = setEqualSlugs(cSlugs, EXPECTED_SLUGS);
  record('cross-doc: intake §C slug set == EXPECTED 7 slugs', r.ok, r.detail);
}
{
  const s4Slugs = worksheet.s4Rows.map((r) => r.slug);
  const r = setEqualSlugs(s4Slugs, EXPECTED_SLUGS);
  record('cross-doc: worksheet §4 slug set == EXPECTED 7 slugs', r.ok, r.detail);
}

// ---------- 6. per-slug markdown path equality ----------

{
  const intakeMd = new Map(intake.cTableRows.map((r) => [r.slug, r.markdown]));
  const worksheetMd = new Map(worksheet.s4Rows.map((r) => [r.slug, r.markdown]));
  const r = perSlugStringEqual(intakeMd, worksheetMd, 'markdown path');
  record('cross-doc: per-slug markdown path equal (intake §C ↔ worksheet §4)', r.ok, r.detail);
}

// ---------- 7. per-slug sidecar path equality（intake explicit ↔ worksheet-derived）----------

{
  const intakeSc = new Map(intake.cTableRows.map((r) => [r.slug, r.sidecar]));
  const worksheetDerivedSc = new Map(
    worksheet.s4Rows.map((r) => [r.slug, deriveSidecarFromMarkdown(r.markdown)]),
  );
  const r = perSlugStringEqual(intakeSc, worksheetDerivedSc, 'sidecar path');
  record('cross-doc: per-slug sidecar path equal (intake §C explicit ↔ worksheet §4 derived)',
    r.ok, r.detail);
}

// ---------- 8. per-slug sidecar status equality（present/absent 正規化）----------

{
  const intakeSt = new Map(intake.cTableRows.map((r) => [r.slug, r.sidecarStatus]));
  const worksheetSt = new Map(worksheet.s4Rows.map((r) => [r.slug, r.sidecarStatus]));
  const r = perSlugStringEqual(intakeSt, worksheetSt, 'sidecar status');
  record('cross-doc: per-slug sidecar status equal (intake §C ↔ worksheet §4)', r.ok, r.detail);
}

// ---------- 9. sidecar-present partition invariant ----------

{
  const intakeStMap = new Map(intake.cTableRows.map((r) => [r.slug, r.sidecarStatus]));
  const worksheetStMap = new Map(worksheet.s4Rows.map((r) => [r.slug, r.sidecarStatus]));
  const okIntake = intakeStMap.get(SIDECAR_PRESENT_SLUG) === 'present';
  const okWorksheet = worksheetStMap.get(SIDECAR_PRESENT_SLUG) === 'present';
  record(`cross-doc: "${SIDECAR_PRESENT_SLUG}" sidecar status = present in both docs`,
    okIntake && okWorksheet,
    okIntake && okWorksheet
      ? ''
      : `intake=${intakeStMap.get(SIDECAR_PRESENT_SLUG)} worksheet=${worksheetStMap.get(SIDECAR_PRESENT_SLUG)}`);

  // 其餘 6 篇皆 absent
  let allAbsentIntake = true;
  let allAbsentWorksheet = true;
  for (const slug of EXPECTED_SLUGS) {
    if (slug === SIDECAR_PRESENT_SLUG) continue;
    if (intakeStMap.get(slug) !== 'absent') allAbsentIntake = false;
    if (worksheetStMap.get(slug) !== 'absent') allAbsentWorksheet = false;
  }
  record('cross-doc: remaining 6 slugs sidecar status = absent in both docs',
    allAbsentIntake && allAbsentWorksheet,
    allAbsentIntake && allAbsentWorksheet
      ? ''
      : `allAbsentIntake=${allAbsentIntake} allAbsentWorksheet=${allAbsentWorksheet}`);
}

// ---------- 10. shared baseline snapshot string in both docs ----------

{
  const inIntake = intakeText.includes(SHARED_BASELINE_SNAPSHOT_STRING);
  const inWorksheet = worksheetText.includes(SHARED_BASELINE_SNAPSHOT_STRING);
  record(`cross-doc: baseline snapshot string present in intake: "${SHARED_BASELINE_SNAPSHOT_STRING}"`,
    inIntake, inIntake ? '' : 'missing in intake');
  record(`cross-doc: baseline snapshot string present in worksheet: "${SHARED_BASELINE_SNAPSHOT_STRING}"`,
    inWorksheet, inWorksheet ? '' : 'missing in worksheet');
}

// ---------- 11. bloggerPostId API-only rule 語意在兩份 doc ----------

{
  // 兩份 doc 皆需含核心 API-only 語意（子字串 include；容許不同表達）：
  //   Intake：§D.2 "API-only" + "一律留 `\"\"`"
  //   Worksheet：§4 "屬 §A.3 系統欄位" + "Dean 不列必填" / §6.1 "<PLACEHOLDER_EMPTY_STRING>" + "API-only"
  // 為 robust，本 guard 對兩份 doc 皆要求：至少包含 "API-only" 且明列 bloggerPostId 空字串 rule。
  const intakeApiOnly = /API-only/i.test(intakeText) && /bloggerPostId/.test(intakeText);
  const worksheetApiOnly = /API-only/i.test(worksheetText) && /bloggerPostId/.test(worksheetText);
  record('cross-doc: intake contains bloggerPostId API-only rule', intakeApiOnly,
    intakeApiOnly ? '' : 'missing "API-only" + "bloggerPostId" co-occurrence');
  record('cross-doc: worksheet contains bloggerPostId API-only rule', worksheetApiOnly,
    worksheetApiOnly ? '' : 'missing "API-only" + "bloggerPostId" co-occurrence');

  // 明列 bloggerPostId = ""（空字串）rule
  const intakeEmpty = /bloggerPostId[^\n]*""/.test(intakeText) || /`""`.*API-only/.test(intakeText);
  const worksheetEmpty =
    /bloggerPostId[^\n]*""/.test(worksheetText) || /`""`.*API-only/.test(worksheetText);
  record('cross-doc: intake asserts bloggerPostId = "" invariant', intakeEmpty,
    intakeEmpty ? '' : 'missing bloggerPostId="" rule');
  record('cross-doc: worksheet asserts bloggerPostId = "" invariant', worksheetEmpty,
    worksheetEmpty ? '' : 'missing bloggerPostId="" rule');
}

// ---------- 12. we-media-myself2 recorded no-op / 不建議 first slice 語意 ----------

{
  // Intake：§F.3 table 之 reason column 明列；§E.1 reason line 明列
  // Worksheet：§5.2 table row 1 明列 "recorded no-op"
  const intakeNoOp =
    intakeText.includes('recorded no-op') &&
    (intakeText.includes('不建議 first slice') || intakeText.includes('不建議** 作為 first slice'));
  const worksheetNoOp =
    worksheetText.includes('recorded no-op') && worksheetText.includes('不建議作為 first slice');
  record(`cross-doc: intake contains "${SIDECAR_PRESENT_SLUG}" recorded-no-op / not-first-slice`,
    intakeNoOp,
    intakeNoOp ? '' : 'missing "recorded no-op" + "不建議 first slice" co-occurrence');
  record(`cross-doc: worksheet contains "${SIDECAR_PRESENT_SLUG}" recorded-no-op / not-first-slice`,
    worksheetNoOp,
    worksheetNoOp ? '' : 'missing "recorded no-op" + "不建議作為 first slice" co-occurrence');
}

// ---------- 13. blog-restart-steady-rhythm-notes LIVE 2026-06-17 caveat 語意 ----------

{
  // Intake §E.5 reason：包含 "Blogger LIVE 於 2026-06-17" + "不代表**可推導真值"
  // Worksheet §4 row 5：包含 "Blogger LIVE published 2026-06-17" + "backfill 值仍待 Dean"
  // 兩者皆需明示「LIVE 不等於可推導 backfill 值」之意涵。
  const dateOk = intakeText.includes('2026-06-17') && worksheetText.includes('2026-06-17');
  record('cross-doc: both docs include "2026-06-17" (P3 LIVE date)', dateOk,
    dateOk ? '' : `intake=${intakeText.includes('2026-06-17')} worksheet=${worksheetText.includes('2026-06-17')}`);

  const intakeLiveCaveat =
    intakeText.includes('Blogger LIVE') && intakeText.includes('不代表**可推導真值');
  const worksheetLiveCaveat =
    worksheetText.includes('Blogger LIVE') &&
    (worksheetText.includes('backfill 值仍待 Dean 從後台回填') ||
      worksheetText.includes('backfill 真值仍待 Dean 提供'));
  record('cross-doc: intake contains "LIVE ≠ 可推導真值" caveat', intakeLiveCaveat,
    intakeLiveCaveat ? '' : 'missing "Blogger LIVE" + "不代表**可推導真值" co-occurrence');
  record('cross-doc: worksheet contains "LIVE ≠ 可推導真值" caveat', worksheetLiveCaveat,
    worksheetLiveCaveat ? '' : 'missing "Blogger LIVE" + "backfill 值仍待 Dean" co-occurrence');
}

// ---------- 14. write-phase dormant / blocked / worksheet-only 語意 ----------

{
  // Intake §B / §H：write phase = dormant / blocked；§10 "不啟動 WP-02"；§H "不啟動 WP-02"
  // Worksheet §16：worksheet-only / 不啟動 WP-02 / idle-freeze
  const intakeDormant =
    intakeText.includes('dormant') || intakeText.includes('blocked') || intakeText.includes('不啟動') ||
    intakeText.includes('不啟動** WP-02');
  const worksheetDormant =
    worksheetText.includes('worksheet-only') ||
    worksheetText.includes('不啟動 WP-02') ||
    worksheetText.includes('dormant') ||
    worksheetText.includes('idle-freeze');
  record('cross-doc: intake asserts write phase dormant / blocked / 不啟動', intakeDormant,
    intakeDormant ? '' : 'missing dormant/blocked/不啟動 marker');
  record('cross-doc: worksheet asserts write phase worksheet-only / 不啟動 / idle-freeze',
    worksheetDormant,
    worksheetDormant ? '' : 'missing worksheet-only/不啟動/idle-freeze marker');
}

// ---------- 15. single-post first slice 邊界 ----------

{
  // Intake：§G "首次 slice 一次最多 1 篇"；§E "single-post"（section title）；§H "不代 Dean 選 first WP-02 candidate"
  // Worksheet：§1 "**單篇聚焦**"、§13.4 "單篇 first slice"、§14.4 "同時寫入 > 1 篇"
  const intakeSingle =
    intakeText.includes('一次最多 1 篇') ||
    intakeText.includes('一次 1 篇') ||
    intakeText.includes('單篇') ||
    intakeText.includes('single-post') ||
    intakeText.includes('first slice');
  const worksheetSingle =
    worksheetText.includes('單篇') ||
    worksheetText.includes('一次 1 篇') ||
    worksheetText.includes('first slice');
  record('cross-doc: intake asserts single-post first slice boundary', intakeSingle,
    intakeSingle ? '' : 'missing single-post / 一次 1 篇 marker');
  record('cross-doc: worksheet asserts single-post first slice boundary', worksheetSingle,
    worksheetSingle ? '' : 'missing single-post / 一次 1 篇 marker');
}

// 註：跨文件之 Blogger real-value leak 檢查（`blogspot.com` / `https://` 等）已由 §7.1
// scope 之 check:blogger-backfill:one-post-worksheet-contract 覆蓋（該 guard 只掃 create-case
// diff block，避免與 §7.3 之 red-line 討論段落誤衝）；同層 intake 空欄位由 wp02-intake-contract
// 覆蓋。本 consistency guard 不重複做 whole-doc 域名 grep，以避免與 red-line 文字互相干擾。

// ---------- 16. inline negative / counter cases（in-memory fixtures；證明 comparator 抓 drift） ----------

// 這些 fixture **不**觸碰任何檔；純為記憶體字串；證明若正式 doc 未來 drift，本 guard 會 fail。
{
  // N-1：slug set drift — intake §C 表其中一 row 之 slug 被改
  const mutatedIntake = intakeText.replace(
    '| 2 | `after-work-writing-time-blocking`',
    '| 2 | `after-work-writing-time-blocked`', // typo drift
  );
  const drift = extractIntake(mutatedIntake);
  const cSlugs = drift.cTableRows.map((r) => r.slug);
  const r = setEqualSlugs(cSlugs, EXPECTED_SLUGS);
  record('negative N-1: slug drift in intake §C detected by set-equal comparator', !r.ok,
    r.ok ? 'comparator failed to detect drift' : `detected: ${r.detail}`);
}
{
  // N-2：worksheet §4 表其中一 row 之 markdown path 之 yyyymmdd 前綴被改
  const mutatedWorksheet = worksheetText.replace(
    '| 3 | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md`',
    '| 3 | `content/blogger/posts/20260613-ai-tools-simplify-daily-workflow.md`', // date drift
  );
  const drift = extractWorksheet(mutatedWorksheet);
  const intakeMd = new Map(intake.cTableRows.map((r) => [r.slug, r.markdown]));
  const driftMd = new Map(drift.s4Rows.map((r) => [r.slug, r.markdown]));
  const r = perSlugStringEqual(intakeMd, driftMd, 'markdown path');
  record('negative N-2: worksheet §4 markdown path date-prefix drift detected by per-slug comparator',
    !r.ok, r.ok ? 'comparator failed to detect drift' : `detected: ${r.detail}`);
}
{
  // N-3：worksheet §4 表其中一 row 之 sidecar status 由 `absent` 改為 `**present**`
  const mutatedWorksheet = worksheetText.replace(
    '| 2 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | absent |',
    '| 2 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | **present** |',
  );
  const drift = extractWorksheet(mutatedWorksheet);
  const intakeSt = new Map(intake.cTableRows.map((r) => [r.slug, r.sidecarStatus]));
  const driftSt = new Map(drift.s4Rows.map((r) => [r.slug, r.sidecarStatus]));
  const r = perSlugStringEqual(intakeSt, driftSt, 'sidecar status');
  record('negative N-3: worksheet §4 sidecar-status absent→present drift detected by per-slug comparator',
    !r.ok, r.ok ? 'comparator failed to detect drift' : `detected: ${r.detail}`);
}

// ---------- summary ----------

const passed = cases.filter((c) => c.ok).length;
const total = cases.length;

console.log('');
console.log('wp02-one-post-consistency-contract summary:');
console.log(`  intake:    ${INTAKE_DOC_REL}`);
console.log(`  worksheet: ${WORKSHEET_DOC_REL}`);
console.log(`  expected slugs: ${EXPECTED_SLUGS.length}`);
console.log(`  intake §C rows / §E headings / §E sidecars: ${intake.cTableRows.length} / ${intake.eHeadingSlugs.length} / ${intake.eSidecarPaths.size}`);
console.log(`  worksheet §4 rows / §5.2 rows: ${worksheet.s4Rows.length} / ${worksheet.s52Rows.length}`);
console.log(`  total assertions: ${total}`);
console.log('');
console.log(`wp02-one-post-consistency-contract guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);

if (passed !== total) {
  console.log('');
  console.log('FAIL reasons:');
  for (const c of cases.filter((x) => !x.ok)) {
    console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  process.exit(1);
}
