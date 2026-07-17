#!/usr/bin/env node
// Phase 20260717-B2-d：Blogger preview **active-docs status contract guard**（docs-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀兩份 active operational docs（runbook + sanity checklist）+ package.json 之文字；
//     **不**寫任何檔；**不**建立 dist-blogger-preview/；**不** build / preview / deploy /
//     dev server / fetch / pull；**不**碰 dist-blogger/ / dist/ / deploy clone / gh-pages；
//     **不**呼叫 Blogger / Google / GA4 / AdSense API；**不**動 content / frontmatter /
//     `.publish.json`；**不**引入任何 dependency（只用 node:fs / node:path / node:url）。
//
// 守的契約：**implemented feature ↔ active operational documentation status**。
//
// 為何需要（實際發生過的 drift）：
//   B2 draft-aware preview build 於 2026-07-17 落地（Phase A planner 22f1789 + Phase C
//   builder 2f70290）後，本 runbook 之 §I / §I-1 仍宣稱「B2 尚未實作」且「§D-4 暫改
//   frontmatter 是 draft-preview 之唯一路徑」，與同檔 §C.6 直接矛盾（已由 a0707c9 修正）。
//   危害具體：operator 讀到 stale 段落會被推回「暫改 status: ready + draft: false → build:blogger
//   → 改回 draft」，即 B2 建來消滅的那個隱患（忘了改回）。且 B1 navigator 之 console output
//   會主動指向本 runbook（check-blogger-preview.js 之 RUNBOOK_DOC），該矛盾自工具輸出即可達。
//
//   既有 check:docs-npm-run-refs / check:docs-node-script-refs **刻意**只掃 CLAUDE.md +
//   README.md、不 sweep docs/**（歷史 snapshot 須保留當時語境），且只驗「命令是否存在」、
//   不驗「狀態敘述是否為真」→ 結構上抓不到此類假狀態。本 guard 補此缺口。
//
// 為何只掃這兩份 docs（不做全 repo docs lint）：
//   - 兩份皆為工具**執行期輸出主動指向**之 active operational docs：
//       runbook —— check-blogger-preview.js 之 RUNBOOK_DOC（--help 之 See also）。
//       sanity  —— build-blogger-preview.js / blogger-preview-plan.js 於成功輸出末尾印出
//                  「對照 …-sanity-analysis.md §5 之 preview sanity checklist。」
//     即 operator 跑完 B2 後會被導向 sanity checklist；該檔若仍宣稱 B2 不存在，就是
//     B2 自己的輸出把人推回 §D-4 暫改 frontmatter —— B2 建來消滅的那個隱患。
//     （20260717-B2-e 之實際 drift：sanity §5.0 行 123 仍寫 "⏸ not implemented / Dean-gated"。）
//   - 歷史 phase ledger / snapshot（如 docs/20260712-*）可能**合理**保留當時之 not-implemented
//     敘述；把它們納入 hard-fail sweep 會逼人竄改歷史紀錄。故 point-in-time docs **不**納入。
//   - route-selection / planning preanalysis（如 docs/20260710-phase1-rc-next-phase-*）為
//     規劃面而非操作面，且不被任何工具輸出指向 → 同樣**不**納入。
//
// 兩份 target 之契約層級**刻意不同**（不要求 sanity 複製 runbook 全文）：
//   runbook = B2 之**入口規格文件** → REQUIRED_EVIDENCE（6 項：命令 / output root /
//             implemented / PREVIEW-ONLY / NOT FOR DEPLOY / no Blogger write）+ FORBIDDEN_STALE。
//   sanity  = post-paste **人工檢查清單**，非入口規格 → 只要 SANITY_MIN_EVIDENCE（2 項：
//             辨識得出 B2 已實作、指得出入口命令）+ FORBIDDEN_STALE。output root / marker /
//             safety 全套為 §C.6 之職責；在此重複要求只會製造 doc duplication。
//
// 刻意**不**斷言（避免守錯契約；per slice spec §6C）：
//   - **不**要求 B1 `--dry-run` 具備新的實際行為 —— 它目前仍是相容性 no-op，這是正確現況。
//   - **不**要求 B1 navigator 支援 dist-blogger-preview/ —— navigator 仍只認 dist-blogger/。
//   - **不**要求 B2 已取代 §D —— §D 十步流程保留為 fallback，且在需驗證正式 dist-blogger/
//     ready-only build artifact 時仍適用。
//
// 誤判防範（per slice spec §6D）：
//   forbidden pattern 針對 **stale positive assertion**（「仍是 / 是 … 唯一路徑」「B2 尚未實作」），
//   不可單純 grep 關鍵詞 —— 正確之糾正句（「§D 不再是 draft preview 的唯一路徑」「B2 不再是
//   未實作狀態」）字面同樣含該關鍵詞，必須放行。故各 pattern 皆帶 不再 / no longer 之排除。
//
// 執行：
//   npm run check:blogger-preview-docs-status
//   exit 0 = 全部通過；exit 1 = contract failure；exit 2 = guard 自身 crash。

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const RUNBOOK_REL = 'docs/20260708-blogger-draft-preview-runbook.md';
const RUNBOOK = path.join(REPO_ROOT, RUNBOOK_REL);
const SANITY_REL = 'docs/20260710-blogger-preview-sanity-analysis.md';
const SANITY = path.join(REPO_ROOT, SANITY_REL);
const PKG_REL = 'package.json';
const PKG = path.join(REPO_ROOT, PKG_REL);

// FORBIDDEN_STALE 之掃描範圍（僅此二；歷史 / planning docs 刻意不納入）。
export const STALE_SCAN_DOCS = [RUNBOOK_REL, SANITY_REL];

const SELF_SCRIPT = 'check:blogger-preview-docs-status';
const SELF_FILE = 'src/scripts/check-blogger-preview-docs-status.js';
// runbook 宣稱之 B2 入口；必須真的存在於 package.json（docs 不得宣稱不存在之命令）。
const PREVIEW_SCRIPT = 'build:blogger-preview';

// ── 正規化 ────────────────────────────────────────────────────────────────────────
// 容許合理之空白 / Markdown formatting 差異：去除 ` 與 *（**不再是** → 不再是），
// 收斂水平空白（含全形空格）。保留換行 → 各 pattern 以行為界、可回報行號。
export function normalizeDocText(raw) {
  return String(raw)
    .replace(/\r\n?/g, '\n')
    .replace(/[`*]/g, '')
    .replace(/[ \t　]+/g, ' ');
}

// ── A. Required implemented-state evidence ───────────────────────────────────────
// 不只查單一模糊詞：具體 command + output root + preview-only safety status 皆須到位。
export const REQUIRED_EVIDENCE = [
  { label: 'A1 具體命令：npm run build:blogger-preview', re: /npm run build:blogger-preview/ },
  { label: 'A2 output root：dist-blogger-preview/posts/<slug>/', re: /dist-blogger-preview\/posts\/<slug>\// },
  { label: 'A3 implemented 狀態（已實作 / 已落地 / 已 landed / implemented）', re: /已實作|已落地|已 ?landed|implemented/i },
  { label: 'A4 preview-only marker：PREVIEW-ONLY', re: /PREVIEW-ONLY/ },
  { label: 'A5 preview-only marker：NOT FOR DEPLOY', re: /NOT FOR DEPLOY/i },
  { label: 'A6 safety status：不寫入 Blogger / no Blogger write', re: /不寫入 ?Blogger|no Blogger write/i },
];

// ── S. Sanity checklist 之最低 current-state evidence ─────────────────────────────
// 只守「讀者不會被誤導成 B2 不存在」所需之最小集合：辨識得出已實作 + 指得出入口。
// 刻意**不**要求 output root / PREVIEW-ONLY / NOT FOR DEPLOY / no-Blogger-write ——
// 那些是 runbook §C.6 之職責；在 checklist 重複要求 = 逼兩份文件互相抄寫。
export const SANITY_MIN_EVIDENCE = [
  { label: 'S1 implemented 狀態（已實作 / 已落地 / 已 landed / implemented）', re: /已實作|已落地|已 ?landed|implemented/i },
  { label: 'S2 指得出 B2 入口命令：build:blogger-preview', re: /build:blogger-preview/ },
];

// ── B. Forbidden stale current-state claims ──────────────────────────────────────
// 每條皆排除糾正句（不再 / no longer），避免誤殺正確之否定敘述。
export const FORBIDDEN_STALE = [
  {
    label: 'B1 stale：B2 被說成「尚未 / 還沒實作」',
    re: /B2(?![^\n]{0,60}不再)[^\n]{0,60}(?:尚未|還沒)[^\n]{0,12}實作/,
  },
  {
    label: 'B2 stale：B2 被說成「未實作」（排除「不再是未實作」之糾正句）',
    re: /B2(?![^\n]{0,60}不再)[^\n]{0,60}未實作/,
  },
  {
    label: 'B3 stale：B2 被說成 not implemented（排除 no longer）',
    re: /B2(?![^\n]{0,80}no longer)[^\n]{0,80}not\s+implemented/i,
  },
  {
    label: 'B4 stale：B2 被以未來式描述（若/如未來 … B2 … 實作）',
    re: /(?:若|如)未來[^\n]{0,40}B2[^\n]{0,60}實作/,
  },
  {
    label: 'B5 stale：B2 被說成仍為 Dean-gated',
    re: /B2(?![^\n]{0,60}不再)[^\n]{0,60}(?:仍|尚)[^\n]{0,8}(?:為|是)[^\n]{0,8}Dean-gated/i,
  },
  {
    label: 'B6 stale：dist-blogger-preview 被說成尚未落地 / 實作 / 建立',
    re: /dist-blogger-preview[^\n]{0,60}(?:尚未|還沒)[^\n]{0,12}(?:落地|實作|建立)/,
  },
  {
    label: 'B7 stale：暫改 frontmatter 被斷言為 draft-preview 之唯一路徑（排除「不再是…唯一路徑」）',
    re: /(?<!不再)(?:仍為|仍是|即為|即是|作為|是)[^\n]{0,40}唯一路徑/,
  },
];

// ── 掃描器（純函式；供 fixtures 直接驗證）────────────────────────────────────────
export function findStaleClaims(text) {
  const norm = normalizeDocText(text);
  const lines = norm.split('\n');
  const hits = [];
  for (const rule of FORBIDDEN_STALE) {
    lines.forEach((line, i) => {
      const m = rule.re.exec(line);
      if (m) hits.push({ label: rule.label, line: i + 1, excerpt: m[0].slice(0, 80) });
    });
  }
  return hits;
}

// rules 預設為 runbook 之 REQUIRED_EVIDENCE；sanity 傳入 SANITY_MIN_EVIDENCE。
export function findMissingEvidence(text, rules = REQUIRED_EVIDENCE) {
  const norm = normalizeDocText(text);
  return rules.filter((e) => !e.re.test(norm)).map((e) => e.label);
}

// guard target 缺失 / 空檔 → hard-fail（不得靜默 pass）。
export function readDocOrThrow(abs, rel) {
  if (!existsSync(abs)) throw new Error(`guard target 不存在：${rel}`);
  const raw = readFileSync(abs, 'utf-8');
  if (raw.trim() === '') throw new Error(`guard target 為空：${rel}`);
  return raw;
}

// ── fixtures ─────────────────────────────────────────────────────────────────────
// 只用純字串常數；**不**建立檔案 / 目錄 / temp dir。
const STALE_FIXTURES = [
  ['B2 尚未實作', 'B2 尚未實作。'],
  ['B2 ... is not implemented', 'B2 draft-aware preview build is not implemented.'],
  ['若未來有 B2 ... 實作', '若未來有 B2 draft-aware preview build 實作，語意才會擴展。'],
  ['B2 仍為 Dean-gated', 'B2 仍為 Dean-gated，須另開 phase。'],
  ['dist-blogger-preview/ 尚未落地', '`dist-blogger-preview/` 尚未落地。'],
  [
    '暫改 status/draft 仍是唯一路徑',
    '暫改 `status: ready` 與 `draft: false` 仍是 draft preview 的唯一路徑。',
  ],
];

const BENIGN_FIXTURES = [
  ['§D 不再是唯一路徑（糾正句）', '§D **不再是** draft preview 的唯一路徑；保留為 fallback。'],
  ['B1 --dry-run 仍是相容性 no-op', 'B1 `--dry-run` 目前仍是相容性 no-op，不模擬 build。'],
  ['§D 保留為 fallback', '§D 保留為 fallback，驗證正式 `dist-blogger/` 輸出時仍適用。'],
  ['B2 不再是未實作狀態（糾正句）', 'B2 不再是未實作狀態，入口見 §C.6。'],
];

// 最小合規文件：含全部 required evidence，且保留 B1 / §D 之正確現況語意。
// 用來證明本 guard **不**要求「B1 --dry-run 有新行為」/「navigator 支援 preview dist」/
// 「B2 已取代 §D」—— 這份文件三者皆未宣稱，仍須全數通過。
const MINIMAL_COMPLIANT_DOC = [
  'B2 draft-aware preview build 已實作。',
  '入口：`npm run build:blogger-preview -- --slug=<slug>`。',
  '產出：`dist-blogger-preview/posts/<slug>/`（PREVIEW-ONLY / NOT FOR DEPLOY）。',
  '邊界：local-only；不寫入 Blogger；不 deploy。',
  'B1 `--dry-run` 目前仍是相容性 no-op；navigator 仍只認 `dist-blogger/`。',
  '§D 保留為 fallback，不再是 draft preview 的唯一路徑。',
].join('\n');

// sanity-doc role fixtures。
// REAL_SANITY_STALE = 20260717-B2-e 修正前之真實行 123 逐字內容（非杜撰變體）：
// 用它證明「本 guard 若早存在於 sanity scope，就會擋下這次實際發生的 drift」。
const REAL_SANITY_STALE =
  'B1 / B2 邊界：B1 navigator = ✅ implemented（`docs/20260712-preview-only-helper-implementation.md`；' +
  '`cc6497b`，2026-07-12）；B2 draft-aware preview build = ⏸ not implemented / Dean-gated' +
  '（`docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2；須另開 phase + explicit approval）。';

// 最小合規 sanity 文件：只含 S1 + S2，**不**含 output root / marker / safety 全套 ——
// 用來證明 sanity target 不被 runbook 之 REQUIRED_EVIDENCE 綁架。
const MINIMAL_COMPLIANT_SANITY = [
  'B1 / B2 邊界：B2 draft-aware preview build = ✅ implemented。',
  'draft 外觀請跑 `npm run build:blogger-preview`；入口與限制見 runbook §C.6。',
  'B1 navigator 仍只讀 `dist-blogger/`；§D 保留為 fallback。',
].join('\n');

// ── 執行 ─────────────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
const fails = [];
function record(name, ok, msg) {
  if (ok) { pass += 1; console.log(`[PASS] ${name}`); }
  else { fail += 1; fails.push(`${name} — ${msg}`); console.error(`[FAIL] ${name}\n       ${msg}`); }
}
function check(name, fn) {
  try { fn(); record(name, true); }
  catch (err) { record(name, false, err && err.message ? err.message : String(err)); }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function main() {
  // ── G. guard targets 可讀（兩份任一缺檔皆 hard-fail：共用 readDocOrThrow）──
  let runbookRaw = '';
  check(`G1 guard target 存在且可讀：${RUNBOOK_REL}`, () => {
    runbookRaw = readDocOrThrow(RUNBOOK, RUNBOOK_REL);
    assert(runbookRaw.length > 0, 'runbook 內容為空');
  });

  let sanityRaw = '';
  check(`G1b guard target 存在且可讀：${SANITY_REL}`, () => {
    sanityRaw = readDocOrThrow(SANITY, SANITY_REL);
    assert(sanityRaw.length > 0, 'sanity checklist 內容為空');
  });

  check('G2 guard target 缺失時 hard-fail（不得靜默 pass；兩 target 共用此 helper）', () => {
    let threw = false;
    try {
      readDocOrThrow(path.join(REPO_ROOT, 'docs/__no-such-runbook__.md'), 'docs/__no-such-runbook__.md');
    } catch { threw = true; }
    assert(threw, '缺失 guard target 未 hard-fail');
  });

  // ── A. runbook：required implemented-state evidence（逐項）──
  for (const e of REQUIRED_EVIDENCE) {
    check(`${e.label}（active runbook 必須含）`, () => {
      const norm = normalizeDocText(runbookRaw);
      assert(e.re.test(norm), `runbook 缺少 implemented-state evidence：${e.re}`);
    });
  }

  check('A7 runbook required evidence 缺失時 hard-fail（以合成缺證文件驗證）', () => {
    const missing = findMissingEvidence('本文完全沒有提到任何 preview 命令或標記。');
    assert(missing.length === REQUIRED_EVIDENCE.length, `缺證文件應報全部 ${REQUIRED_EVIDENCE.length} 項，實得 ${missing.length}`);
  });

  // ── S. sanity checklist：最低 current-state evidence（刻意少於 runbook）──
  for (const e of SANITY_MIN_EVIDENCE) {
    check(`${e.label}（active sanity checklist 必須含）`, () => {
      const norm = normalizeDocText(sanityRaw);
      assert(e.re.test(norm), `sanity checklist 缺少 current-state evidence：${e.re}`);
    });
  }

  check('S3 sanity 最低 evidence 缺失時 hard-fail（以合成缺證文件驗證）', () => {
    const missing = findMissingEvidence('本文完全沒有提到 B2 狀態或入口命令。', SANITY_MIN_EVIDENCE);
    assert(missing.length === SANITY_MIN_EVIDENCE.length, `缺證文件應報全部 ${SANITY_MIN_EVIDENCE.length} 項，實得 ${missing.length}`);
  });

  // ── B. forbidden stale current-state claims（逐條 × 兩份 active docs → 0 命中）──
  const staleTargets = [
    { rel: RUNBOOK_REL, raw: () => runbookRaw },
    { rel: SANITY_REL, raw: () => sanityRaw },
  ];
  for (const rule of FORBIDDEN_STALE) {
    for (const t of staleTargets) {
      check(`${rule.label} → ${t.rel} 0 命中`, () => {
        const lines = normalizeDocText(t.raw()).split('\n');
        const hit = lines.findIndex((l) => rule.re.test(l));
        assert(hit === -1, `行 ${hit + 1} 命中 stale 敘述：${lines[hit]?.slice(0, 120)}`);
      });
    }
  }

  for (const t of staleTargets) {
    check(`B8 真實文件之 stale 掃描總命中數為 0：${t.rel}`, () => {
      const hits = findStaleClaims(t.raw());
      assert(hits.length === 0, `命中 ${hits.length} 筆：${hits.map((h) => `行${h.line}「${h.excerpt}」`).join(' / ')}`);
    });
  }

  // ── N. negative fixtures：合成 stale 變體必須被抓到 ──
  for (const [name, text] of STALE_FIXTURES) {
    check(`N 抓得到合成 stale 變體：${name}`, () => {
      const hits = findStaleClaims(text);
      assert(hits.length > 0, `未被任何 forbidden pattern 抓到：${text}`);
    });
  }

  // ── P. 不得誤殺：正確之糾正句 / 現況敘述 ──
  for (const [name, text] of BENIGN_FIXTURES) {
    check(`P 不誤殺正確敘述：${name}`, () => {
      const hits = findStaleClaims(text);
      assert(hits.length === 0, `誤判為 stale：${hits.map((h) => h.label).join(' / ')} @ ${text}`);
    });
  }

  // ── C. preserve B1 / §D semantics：guard 不得要求 B2 取代 B1 --dry-run 或 §D ──
  check('C1 最小合規文件（B1 --dry-run 仍 no-op、navigator 仍只認 dist-blogger/、§D 為 fallback）全數通過', () => {
    assert(findMissingEvidence(MINIMAL_COMPLIANT_DOC).length === 0,
      `最小合規文件不應缺證：${findMissingEvidence(MINIMAL_COMPLIANT_DOC).join(', ')}`);
    const hits = findStaleClaims(MINIMAL_COMPLIANT_DOC);
    assert(hits.length === 0, `最小合規文件不應命中 stale：${hits.map((h) => h.label).join(' / ')}`);
  });

  // ── C2 / N-sanity：sanity target role 之雙向驗證（同一套 production matcher）──
  check('C2 最小合規 sanity 文件（僅 S1+S2、無 runbook 全套 evidence）通過 sanity role', () => {
    const missing = findMissingEvidence(MINIMAL_COMPLIANT_SANITY, SANITY_MIN_EVIDENCE);
    assert(missing.length === 0, `最小合規 sanity 文件不應缺證：${missing.join(', ')}`);
    const hits = findStaleClaims(MINIMAL_COMPLIANT_SANITY);
    assert(hits.length === 0, `最小合規 sanity 文件不應命中 stale：${hits.map((h) => h.label).join(' / ')}`);
    // 反向鎖定角色分層：這份文件**故意**通不過 runbook 之 REQUIRED_EVIDENCE，
    // 若哪天它通過了，代表 sanity 被要求複製 runbook 全文 → 契約已走樣。
    assert(findMissingEvidence(MINIMAL_COMPLIANT_SANITY).length > 0,
      'sanity 最小文件不應滿足 runbook REQUIRED_EVIDENCE（否則兩份文件契約層級已混同）');
  });

  check('N-sanity 抓得到 sanity role 之真實 stale 內容（20260717-B2-e 修正前之行 123 逐字）', () => {
    const hits = findStaleClaims(REAL_SANITY_STALE);
    assert(hits.length > 0, `未被任何 forbidden pattern 抓到實際發生過的 drift：${REAL_SANITY_STALE}`);
    const missing = findMissingEvidence(REAL_SANITY_STALE, SANITY_MIN_EVIDENCE);
    assert(missing.length > 0, 'stale 版行 123 應同時缺 sanity 最低 evidence（未指出入口命令）');
  });

  // ── R. docs 宣稱之命令必須真的存在（feature ↔ docs 雙向對齊）──
  check(`R1 runbook 宣稱之入口 ${PREVIEW_SCRIPT} 確實註冊於 ${PKG_REL}`, () => {
    const pkg = JSON.parse(readDocOrThrow(PKG, PKG_REL));
    assert(typeof pkg.scripts?.[PREVIEW_SCRIPT] === 'string', `package.json 缺少 script：${PREVIEW_SCRIPT}`);
  });

  check(`R2 本 guard 自身已註冊：${SELF_SCRIPT} → ${SELF_FILE}`, () => {
    const pkg = JSON.parse(readDocOrThrow(PKG, PKG_REL));
    const entry = pkg.scripts?.[SELF_SCRIPT];
    assert(typeof entry === 'string', `package.json 缺少 script：${SELF_SCRIPT}`);
    assert(entry.includes(SELF_FILE), `${SELF_SCRIPT} 未指向 ${SELF_FILE}（實得：${entry}）`);
  });

  console.log('');
  console.log('blogger preview docs status summary:');
  console.log(`  active operational docs scanned: ${STALE_SCAN_DOCS.length}`);
  console.log(`    - ${RUNBOOK_REL}  [entry spec: ${REQUIRED_EVIDENCE.length} required evidence + stale scan]`);
  console.log(`    - ${SANITY_REL}  [checklist: ${SANITY_MIN_EVIDENCE.length} minimum evidence + stale scan]`);
  console.log(`  historical point-in-time docs: NOT scanned (刻意保留當時語境)`);
  console.log(`  route-selection / planning docs: NOT scanned (規劃面，非操作面)`);
  console.log(`  forbidden stale-claim patterns: ${FORBIDDEN_STALE.length} × ${STALE_SCAN_DOCS.length} docs scanned`);
  console.log(`  negative fixtures (stale variants must be caught): ${STALE_FIXTURES.length} + 1 real sanity drift`);
  console.log(`  benign fixtures (must not false-positive): ${BENIGN_FIXTURES.length}`);
  console.log(`  referenced npm entries: 2 (${PREVIEW_SCRIPT}, ${SELF_SCRIPT})`);
  console.log('');
  console.log(`blogger-preview-docs-status contract guard: ${pass} / ${fail}`);
  if (fail > 0) {
    console.log('');
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(`[check-blogger-preview-docs-status] crashed: ${err && err.stack ? err.stack : err}`);
  process.exit(2);
}
