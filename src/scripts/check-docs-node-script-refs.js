#!/usr/bin/env node
// Phase 20260717-B：canonical docs 內 direct-node `.js` script 參照之存在性 guard（source-level 靜態斷言）。
//
// 範圍 / 邊界：
//   - 純讀 CLAUDE.md + README.md + fs.existsSync / fs.statSync；**不** build / deploy / dev server /
//     fetch / pull；**不**執行任何被參照之 script（見 self-check "does not execute target"）；
//     **不**寫任何 repo 檔（self-check fixtures 建於 os.tmpdir() 之 mkdtemp 目錄，結束即刪）；
//     **不**呼叫 Blogger / Google / GA4 / AdSense API；**不**讀 deploy clone；**不**讀 package.json；
//     **不**掃描 docs/**/*.md（歷史 snapshot 刻意保留當時語境，不納入 hard guard）。
//
// 目的（防呆 / 防回歸）：
//   sibling guard 之責任矩陣目前是：
//
//     參照來源 \ 參照型式   | `npm run <name>`          | `node <path>.js`
//     ---------------------|---------------------------|---------------------------
//     package.json         | check:npm-script-targets  | check:npm-script-targets
//     CLAUDE.md / README.md| check:docs-npm-run-refs   | （本 guard 之前：無人覆蓋）
//
//   右下象限即本 guard 所補之 silent gap。CLAUDE.md § Validation baseline 以 direct-node 形式列出
//   數條指令（`node src/scripts/X.js`）。若該 .js 被 rename / move / delete，docs 會靜默腐化：
//   operator 照抄即得 runtime "Cannot find module"，而既有 baseline 全綠——因為
//   check:npm-script-targets 只讀 package.json、check:docs-npm-run-refs 只認 `npm run <name>`。
//
//   commit 616a18a（2026-07-16）恰為此象限之成因：當時 CLAUDE.md 內 dangling 的
//   `npm run check-commerce-affiliate-resolver` 被改寫為 direct-node 形式，等同把該參照從
//   （現已受守之）左下象限搬進當時無人守之右下象限。本 guard 將該象限納入靜態覆蓋。
//
// 偵測範圍（刻意收窄；不建立通用 Markdown / command parser）：
//   僅認「`node` 之後緊接的第一個 token 且該 token 以 .js 結尾」之 direct-node script invocation。
//   刻意 **不** 處理：node flags 前置形（`node --flag x.js`）、node binaries（`node -e "..."`）、
//   任意 shell command parsing、`npm run <name>`（屬 check:docs-npm-run-refs 之責任）。
//   canonical docs 現況 100% 為「node 後緊接 script path」形；若未來出現 flag 前置形，須另開
//   phase 擴充，不由本 guard 靜默容忍或就地擴張。
//
//   Negative lookbehind `(?<![\w-])` 為必要：prose 內之 "Direct-node smoke"（CLAUDE.md §280 等）
//   中 `-` 屬 regex word boundary，裸 `\bnode` 會誤命中並把後續 prose 當 token。
//
//   Markdown wrapper（backtick / table pipe / 空白）不在 token charset 內，由 regex 天然終止；
//   此為 §4 所允許之「最小必要支援」，非 Markdown parser。
//
// Hard-fail 條件（任一成立 → exit 1；與 check:docs-npm-run-refs 之 hard-fail 語意一致）：
//   1. absolute path（POSIX `/x.js`、UNC `\\x.js`、Windows drive `D:\x.js`）——本 guard 只接受 repo-relative。
//   2. 逃逸 repo root（`../outside.js`、`src/../../outside.js`）。
//   3. 非 .js target。
//   4. target 不存在。
//   5. target 存在但非 regular file（如同名目錄）。
//   6. 無效 path（path 解析拋錯）。
//
// 斷言組成（N 由實際掃描 deterministic 推導，不 hard-code）：
//   2 個 doc presence + K 個 self-check + M 個 per-occurrence + 1 個 sanity。

import { existsSync, statSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// 掃描目標：canonical operator-facing docs 之根目錄檔，順序即報表順序。
const IN_SCOPE_DOCS = ['CLAUDE.md', 'README.md'];

// `node` 之後緊接的第一個 token。lookbehind 拒 "Direct-node" 等含 node 之複合詞；
// charset 排除空白 / backtick / pipe，使 Markdown code span 與表格 cell 天然終止 token。
const REF_PATTERN = /(?<![\w-])node[ \t]+([^\s`|]+)/g;

// 由右至左剝除 prose 尾隨標點；一旦 token 以 .js 結尾即停（不切掉副檔名本身）。
function normalizeToken(rawToken) {
  let token = rawToken;
  while (token.length > 0 && !/\.js$/.test(token) && /[.,;:!?)\]}>'"]$/.test(token)) {
    token = token.slice(0, -1);
  }
  return token;
}

// 是否為本 guard 之 in-scope direct-node script invocation。
function isDirectNodeScriptToken(token) {
  return /\.js$/.test(token);
}

// 對單一 token 判定 target 有效性。repoRoot 為參數，使 self-check 可注入合成 root。
function classifyTarget(token, repoRoot) {
  if (/^[A-Za-z]:[\\/]/.test(token) || /^[\\/]/.test(token) || path.isAbsolute(token)) {
    return { resolved: false, reason: 'absolute path (repo-relative reference required)' };
  }
  if (path.extname(token) !== '.js') {
    return { resolved: false, reason: 'target is not a .js file' };
  }
  let abs;
  let rel;
  try {
    abs = path.resolve(repoRoot, token);
    rel = path.relative(repoRoot, abs);
  } catch (err) {
    return { resolved: false, reason: `invalid path (${err.message})` };
  }
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    return { resolved: false, reason: 'target escapes repo root' };
  }
  if (!existsSync(abs)) {
    return { resolved: false, reason: 'target file does not exist' };
  }
  let stats;
  try {
    stats = statSync(abs);
  } catch (err) {
    return { resolved: false, reason: `stat failed (${err.message})` };
  }
  if (!stats.isFile()) {
    return { resolved: false, reason: 'target is not a regular file' };
  }
  return { resolved: true, reason: 'ok', target: rel.split(path.sep).join('/') };
}

// 掃描一段文字，回傳依出現順序之 in-scope 參照判定結果。
function scanText(text, repoRoot) {
  REF_PATTERN.lastIndex = 0;
  const out = [];
  let match;
  while ((match = REF_PATTERN.exec(text)) !== null) {
    const rawToken = match[1];
    const token = normalizeToken(rawToken);
    if (!isDirectNodeScriptToken(token)) continue;
    out.push({ rawToken, token, ...classifyTarget(token, repoRoot) });
  }
  return out;
}

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? `  — ${detail}` : ''}`);
}

// ── 1–2. 掃描目標 docs 存在 ──────────────────────────────────────────
const docPresence = new Map();
for (const rel of IN_SCOPE_DOCS) {
  const abs = path.join(REPO_ROOT, rel);
  const ok = existsSync(abs);
  docPresence.set(rel, ok);
  record(`${rel} present`, ok, ok ? '' : `missing ${abs}`);
}

// ── 3. Self-check：以 os.tmpdir() 之合成 repo root 驗證 parser + classifier ──
// 不新增第四個 repo file、不引入 devDependency、不依賴 repo 現有 script 名。
const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'docs-node-refs-'));
const sentinelPath = path.join(tmpRoot, 'EXECUTED.sentinel');
try {
  mkdirSync(path.join(tmpRoot, 'scripts'), { recursive: true });
  mkdirSync(path.join(tmpRoot, 'data'), { recursive: true });
  writeFileSync(path.join(tmpRoot, 'scripts', 'ok.js'), '// fixture\n');
  writeFileSync(path.join(tmpRoot, 'data', 'config.json'), '{}\n');
  // 若本 guard 誤執行 target，此 fixture 會寫出 sentinel；self-check 據此斷言「未執行」。
  writeFileSync(
    path.join(tmpRoot, 'scripts', 'exec-sentinel.js'),
    `require('node:fs').writeFileSync(${JSON.stringify(sentinelPath)}, 'executed');\n`,
  );
  // 同名為 .js 之目錄：驗證 regular-file 條件。
  mkdirSync(path.join(tmpRoot, 'scripts', 'adir.js'), { recursive: true });

  const selfCheckCases = [
    // ── 必備：valid / missing ──────────────────────────────
    { label: 'valid existing target resolves',
      text: 'node scripts/ok.js',
      want: [{ token: 'scripts/ok.js', resolved: true }] },
    { label: 'missing target hard-fails',
      text: 'node scripts/nope.js',
      want: [{ token: 'scripts/nope.js', resolved: false }] },
    // ── 必備：repo-relative ./ normalization ───────────────
    { label: 'repo-relative "./" prefix normalizes and resolves',
      text: 'node ./scripts/ok.js',
      want: [{ token: './scripts/ok.js', resolved: true }] },
    { label: 'inner "./" segment normalizes and resolves',
      text: 'node scripts/./ok.js',
      want: [{ token: 'scripts/./ok.js', resolved: true }] },
    // ── 必備：escaping repo root ───────────────────────────
    { label: 'target escaping repo root hard-fails',
      text: 'node ../outside.js',
      want: [{ token: '../outside.js', resolved: false }] },
    { label: 'target escaping repo root via inner traversal hard-fails',
      text: 'node scripts/../../outside.js',
      want: [{ token: 'scripts/../../outside.js', resolved: false }] },
    { label: 'target normalizing to repo root itself hard-fails',
      text: 'node scripts/../.js',
      want: [{ token: 'scripts/../.js', resolved: false }] },
    // ── absolute paths hard-fail ───────────────────────────
    { label: 'POSIX absolute path hard-fails',
      text: 'node /tmp/evil.js',
      want: [{ token: '/tmp/evil.js', resolved: false }] },
    { label: 'Windows drive absolute path hard-fails',
      text: 'node D:/tmp/evil.js',
      want: [{ token: 'D:/tmp/evil.js', resolved: false }] },
    { label: 'UNC-style absolute path hard-fails',
      text: 'node \\\\server\\share\\evil.js',
      want: [{ token: '\\\\server\\share\\evil.js', resolved: false }] },
    // ── non-regular-file hard-fails ────────────────────────
    { label: 'directory named *.js hard-fails (not a regular file)',
      text: 'node scripts/adir.js',
      want: [{ token: 'scripts/adir.js', resolved: false }] },
    // ── out-of-scope forms are not detected ────────────────
    { label: 'rejects "npm run <name>" as a direct-node reference',
      text: 'npm run check:docs-npm-run-refs',
      want: [] },
    { label: 'rejects "npm run" even when name ends in .js',
      text: 'npm run build.js',
      want: [] },
    { label: 'rejects node binary/eval form (no .js token)',
      text: 'node -e "console.log(1)"',
      want: [] },
    { label: 'rejects non-.js target token (.json)',
      text: 'node data/config.json',
      want: [] },
    { label: 'rejects hyphenated prose word containing "node"',
      text: 'Direct-node smoke（非 package scripts）',
      want: [] },
    { label: 'rejects word-prefixed "node" (e.g. autonode)',
      text: 'autonode scripts/ok.js',
      want: [] },
    // ── Markdown wrappers / args（最小必要支援） ────────────
    { label: 'backtick code span terminates token',
      text: '`node scripts/ok.js`',
      want: [{ token: 'scripts/ok.js', resolved: true }] },
    { label: 'table cell pipe terminates token',
      text: '| `node scripts/ok.js` | 0 / 0 |',
      want: [{ token: 'scripts/ok.js', resolved: true }] },
    { label: 'trailing CLI args are not treated as the target',
      text: 'node scripts/ok.js --registry-overlay data/config.json',
      want: [{ token: 'scripts/ok.js', resolved: true }] },
    { label: 'trailing prose punctuation stripped when token would not end in .js',
      text: 'Run node scripts/ok.js.',
      want: [{ token: 'scripts/ok.js', resolved: true }] },
    // ── ordering ───────────────────────────────────────────
    { label: 'multiple references on one line keep source order',
      text: '`node scripts/ok.js` then `node scripts/nope.js`',
      want: [{ token: 'scripts/ok.js', resolved: true }, { token: 'scripts/nope.js', resolved: false }] },
  ];

  for (const { label, text, want } of selfCheckCases) {
    const got = scanText(text, tmpRoot).map((r) => ({ token: r.token, resolved: r.resolved }));
    const ok = got.length === want.length
      && got.every((g, i) => g.token === want[i].token && g.resolved === want[i].resolved);
    record(`self-check: ${label}`, ok,
      ok ? '' : `text=${JSON.stringify(text)} want=${JSON.stringify(want)} got=${JSON.stringify(got)}`);
  }

  // 必備：deterministic ordering／summary —— 同一輸入重複掃描結果逐字相同。
  const orderingText = '`node scripts/ok.js` `node ./scripts/ok.js` `node scripts/nope.js`';
  const first = JSON.stringify(scanText(orderingText, tmpRoot));
  const second = JSON.stringify(scanText(orderingText, tmpRoot));
  record('self-check: repeated scans are deterministic', first === second,
    first === second ? '' : 'repeated scan of identical input produced different results');

  // 必備：不執行 target script —— 掃描含 sentinel fixture 之參照後，sentinel 不得存在。
  const sentinelScan = scanText('node scripts/exec-sentinel.js', tmpRoot);
  const sentinelResolved = sentinelScan.length === 1 && sentinelScan[0].resolved === true;
  const sentinelAbsent = !existsSync(sentinelPath);
  record('self-check: resolves target without executing it', sentinelResolved && sentinelAbsent,
    sentinelResolved
      ? (sentinelAbsent ? '' : 'target script WAS executed (sentinel written)')
      : `expected 1 resolved reference, got ${JSON.stringify(sentinelScan)}`);
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

// ── 4. 掃描 in-scope docs 之每個 occurrence（IN_SCOPE_DOCS 順序 → line asc → 行內順序）──
const occurrences = [];
for (const rel of IN_SCOPE_DOCS) {
  if (!docPresence.get(rel)) continue;
  const lines = readFileSync(path.join(REPO_ROOT, rel), 'utf-8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    for (const r of scanText(lines[i], REPO_ROOT)) {
      occurrences.push({ file: rel, line: i + 1, ...r });
    }
  }
}
occurrences.sort((a, b) => {
  const ai = IN_SCOPE_DOCS.indexOf(a.file);
  const bi = IN_SCOPE_DOCS.indexOf(b.file);
  if (ai !== bi) return ai - bi;
  return a.line - b.line;
});

for (const occ of occurrences) {
  const trimmed = occ.rawToken !== occ.token ? `  (trimmed from "${occ.rawToken}")` : '';
  record(
    `${occ.file}:${occ.line} → node ${occ.token}${trimmed}`,
    occ.resolved,
    occ.resolved ? '' : occ.reason,
  );
}

// ── 5. Sanity：至少掃到 1 個具體 direct-node 參照（regex 全 miss 亦攔）──
record('at least one concrete direct-node script reference scanned',
  occurrences.length > 0,
  occurrences.length > 0
    ? `${occurrences.length} reference(s)`
    : 'no direct-node script references found in in-scope docs');

const resolved = occurrences.filter((o) => o.resolved).length;
const missing = occurrences.length - resolved;
const passed = cases.filter((c) => c.ok).length;
const total = cases.length;
const firstFailingOcc = occurrences.find((o) => !o.resolved);

console.log('');
console.log('docs direct-node script reference guard summary:');
console.log(`  documents scanned: ${IN_SCOPE_DOCS.length}`);
console.log(`  references detected: ${occurrences.length}`);
console.log(`  references resolved: ${resolved}`);
console.log(`  references missing: ${missing}`);
console.log(`  assertions passed: ${passed}/${total}`);
if (firstFailingOcc) {
  console.log(`  first failing target: ${firstFailingOcc.token} `
    + `(${firstFailingOcc.file}:${firstFailingOcc.line}) — ${firstFailingOcc.reason}`);
}
console.log('');
console.log(`docs direct-node script reference guard: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);

if (passed !== total) {
  console.log('');
  console.log('FAIL reasons:');
  for (const c of cases.filter((x) => !x.ok)) {
    console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  process.exit(1);
}
