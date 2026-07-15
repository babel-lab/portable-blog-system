#!/usr/bin/env node
// Phase 20260715：`backfill:url` publishedAt 真值契約 guard。
//
// 保護之行為（fail-closed；違反即紅線）：
//   `src/scripts/backfill-published-url.js` 之 --published-at 為 Blogger 平台真值，必須由作者提供。
//   缺省時必須於任何寫入前 hard-fail，**不得**回填當下時間、**不得**由當下時間推導
//   publishYear / publishMonth。依據：
//     - docs/publish-json-schema.md §5.4（「不得預測、不得回填當下時間」）
//     - docs/publish-workflow.md §13（不預測 Blogger 真值）
//     - CLAUDE.md §3a Red lines（不得 guess Blogger publishedAt）
//     - docs/20260706-blogger-identity-and-backfill-strategy.md（publishedAt 屬 Dean 提供之真值）
//
// 邊界（read-only；違反即設計錯誤）：
//   - **結構性零寫入**（非僅事後斷言）：CLI smoke 只用以下兩種參數組合，兩者皆使實際寫入路徑
//     unreachable —— 即使未來 CLI 回退（regress）成偽造 publishedAt，也不可能寫到 production：
//       (a) 負向 flag 測試：--slug 指向**不存在之文章**（NONEXISTENT_SLUG）→ findPosts 0 命中 →
//           寫入前 exit 1。非 vacuous：斷言 stderr 之**精確**錯誤訊息（回退時訊息會變成
//           "no post found"，測試即失敗）。
//       (b) 正向測試：--dry-run（CLI 於 dry-run 分支 return 0，永不進 atomic write）；另有
//           static 斷言鎖住「dry-run 早於 write」之順序。
//     **絕不**對 production 文章跑「無 --dry-run 之 --force」組合（該組合會觸發真實寫入）。
//   - production `.publish.json` 只做 read-only；每個 CLI smoke 前後比對 bytes + mtime 不變（防禦縱深）。
//   - 不 build / 不 deploy / 不 commit / 不 push / 不碰 gh-pages / 不呼叫 Blogger·Google API。
//   - 不猜任何 Blogger 真值：正向測試所用之 URL / publishedAt 皆取自 repo 內既有 sidecar 之現值。
//
// 執行：`npm run check:backfill-published-url`（或 `node src/scripts/check-backfill-published-url.js`）。

import assert from 'node:assert';
import { readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs, resolvePublishedAt } from './backfill-published-url.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(REPO_ROOT, 'src', 'scripts', 'backfill-published-url.js');
const SRC = readFileSync(CLI, 'utf-8');

// 正向測試對象：repo 內既有、已帶真值之 sidecar（值取自現檔，未新增任何推測值）。
const FIXTURE_SIDECAR = path.join(
  REPO_ROOT,
  'content',
  'blogger',
  'posts',
  '20260515-we-media-myself2.publish.json',
);
const FIXTURE = JSON.parse(readFileSync(FIXTURE_SIDECAR, 'utf-8'));
const FIXTURE_SLUG = FIXTURE.blogger.permalink;
const FIXTURE_URL = FIXTURE.blogger.publishedUrl;

// 負向 flag 測試專用：刻意不存在之 slug。使 findPosts 0 命中 → 任何寫入路徑 unreachable，
// 即使 CLI 回退成偽造 publishedAt 亦不可能寫到 production sidecar。
const NONEXISTENT_SLUG = 'zzz-guard-fixture-no-such-post';

let pass = 0;
let fail = 0;
const fails = [];
function record(name, ok, msg) {
  if (ok) {
    pass += 1;
    console.log(`[PASS] ${name}`);
  } else {
    fail += 1;
    fails.push(`${name} — ${msg}`);
    console.error(`[FAIL] ${name}\n       ${msg}`);
  }
}
function check(name, fn) {
  try {
    fn();
    record(name, true);
  } catch (err) {
    record(name, false, err.message);
  }
}

// 快照 production sidecar 狀態，供每次 CLI smoke 前後比對（證明零寫入）。
function snapshot(file) {
  return { bytes: readFileSync(file, 'utf-8'), mtimeMs: statSync(file).mtimeMs };
}

// 驅動 CLI；回 { status, stdout, stderr }。呼叫端負責只傳「不會寫入」之參數組合。
function runCli(args) {
  const before = snapshot(FIXTURE_SIDECAR);
  const res = spawnSync(process.execPath, [CLI, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    shell: false,
    windowsHide: true,
  });
  const after = snapshot(FIXTURE_SIDECAR);
  assert.strictEqual(after.bytes, before.bytes, 'production sidecar bytes 不得因 CLI smoke 改變');
  assert.strictEqual(after.mtimeMs, before.mtimeMs, 'production sidecar mtime 不得因 CLI smoke 改變');
  return { status: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

// ── 1. pure resolver：publishedAt 缺省 / 空白 → missing（fail-closed）───────────────
check('resolvePublishedAt: undefined → missing', () => {
  assert.deepStrictEqual(resolvePublishedAt(undefined), { ok: false, error: 'missing' });
});
check('resolvePublishedAt: null → missing', () => {
  assert.deepStrictEqual(resolvePublishedAt(null), { ok: false, error: 'missing' });
});
check('resolvePublishedAt: 空字串 → missing', () => {
  assert.deepStrictEqual(resolvePublishedAt(''), { ok: false, error: 'missing' });
});
check('resolvePublishedAt: 純空白 → missing', () => {
  assert.deepStrictEqual(resolvePublishedAt('   '), { ok: false, error: 'missing' });
});
check('resolvePublishedAt: 非字串 → missing', () => {
  assert.deepStrictEqual(resolvePublishedAt(12345), { ok: false, error: 'missing' });
});

// ── 2. pure resolver：無法解析 → unparseable（不 fallback 到當下時間）────────────────
check('resolvePublishedAt: 非日期字串 → unparseable', () => {
  assert.deepStrictEqual(resolvePublishedAt('not-a-date'), { ok: false, error: 'unparseable' });
});
check('resolvePublishedAt: 不存在之日期 → unparseable', () => {
  assert.deepStrictEqual(resolvePublishedAt('2026-13-45T99:99:99Z'), {
    ok: false,
    error: 'unparseable',
  });
});

// ── 3. pure resolver：合法值原樣回傳（不正規化、不改寫作者提供之真值）─────────────────
check('resolvePublishedAt: ISO 8601 +08:00 原樣回傳', () => {
  const input = '2026-05-12T08:30:00+08:00';
  assert.deepStrictEqual(resolvePublishedAt(input), { ok: true, publishedAt: input });
});
check('resolvePublishedAt: date-only 原樣回傳', () => {
  assert.deepStrictEqual(resolvePublishedAt('2026-05-15'), {
    ok: true,
    publishedAt: '2026-05-15',
  });
});
check('resolvePublishedAt: 合法值不被改寫為當下時間', () => {
  const input = '2020-01-01T00:00:00Z';
  const out = resolvePublishedAt(input);
  assert.strictEqual(out.publishedAt, input);
  assert.ok(!out.publishedAt.startsWith(String(new Date().getFullYear())), '不得回填當下年份');
});

// ── 4. 靜態紅線：CLI 不得含「以當下時間 fallback publishedAt」之程式碼 ────────────────
check('static: 無 `opts.publishedAt ?? new Date()` fallback', () => {
  assert.ok(
    !/publishedAt\s*(\?\?|\|\|)\s*new Date\(/.test(SRC),
    'CLI 不得於 publishedAt 缺省時 fallback 至當下時間',
  );
});
check('static: 無 new Date().toISOString() 作為 publishedAt 來源', () => {
  const assignsNow = /(?:const|let|var)\s+publishedAt\s*=[^;]*new Date\(\s*\)/.test(SRC);
  assert.ok(!assignsNow, 'publishedAt 不得由無參數 new Date() 產生');
});
check('static: USAGE 將 --published-at 列為 Required', () => {
  const required = SRC.slice(SRC.indexOf('Required:'), SRC.indexOf('Optional:'));
  assert.ok(required.includes('--published-at'), '--published-at 須列於 USAGE Required 區塊');
});
check('static: USAGE 不再宣稱 default: now', () => {
  assert.ok(!/--published-at[^\n]*default:\s*now/i.test(SRC), 'USAGE 不得宣稱 publishedAt 預設為 now');
});
check('static: dry-run 分支早於 atomic write（正向測試零寫入之前提）', () => {
  const dryRunIdx = SRC.indexOf('if (opts.dryRun)');
  const writeIdx = SRC.indexOf('await fs.rename(tmpPath, publishJsonPath)');
  assert.ok(dryRunIdx > 0 && writeIdx > 0, '找不到 dry-run 分支或 atomic write');
  assert.ok(dryRunIdx < writeIdx, 'dry-run 早期返回必須位於 atomic write 之前');
});
check('static: publishedAt 檢查早於 findPosts（負向測試零寫入之前提）', () => {
  const resolveIdx = SRC.indexOf('resolvePublishedAt(opts.publishedAt)');
  const findIdx = SRC.indexOf('await findPosts(');
  assert.ok(resolveIdx > 0 && findIdx > 0, '找不到 resolvePublishedAt 或 findPosts');
  assert.ok(resolveIdx < findIdx, 'publishedAt fail-closed 必須早於 post 查找與寫入');
});
check('static: CLI 無 Blogger API 呼叫', () => {
  assert.ok(
    !/googleapis|blogger\.googleapis|oauth|fetch\s*\(/i.test(SRC),
    'CLI 不得呼叫 Blogger / Google API',
  );
});

// ── 5. parseArgs：--published-at 解析正確、缺省為 null（不預設值）─────────────────────
check('parseArgs: 未給 --published-at → publishedAt 為 null', () => {
  const opts = parseArgs(['node', 'cli', '--slug', 'x', '--url', 'https://e.com/2026/05/x.html']);
  assert.strictEqual(opts.publishedAt, null);
});
check('parseArgs: --published-at 值原樣保留', () => {
  const opts = parseArgs(['node', 'cli', '--published-at', '2026-05-12T08:30:00+08:00']);
  assert.strictEqual(opts.publishedAt, '2026-05-12T08:30:00+08:00');
});

// ── 6. CLI 負向：缺 --published-at → 寫入前 exit 1（用不存在之 slug；寫入路徑 unreachable）──
// 非 vacuous：斷言**精確**訊息。若 CLI 回退成偽造 publishedAt，流程會走到 findPosts 才失敗，
// stderr 變為 "no post found" → 下列斷言即失敗。
check('cli: 缺 --published-at → exit 1', () => {
  const r = runCli(['--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL, '--dry-run']);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\n${r.stderr}`);
});
check('cli: 缺 --published-at 之錯誤訊息指出 required（非 not-found）', () => {
  const r = runCli(['--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL, '--dry-run']);
  assert.ok(
    /--published-at is required/.test(r.stderr),
    `stderr 未說明 required（表示未於寫入前 fail-closed）：${r.stderr}`,
  );
  assert.ok(!/no post found/.test(r.stderr), 'publishedAt 檢查須早於 post 查找');
});
check('cli: 缺 --published-at 時不得輸出 OK / DRY-RUN plan', () => {
  const r = runCli(['--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL, '--dry-run']);
  assert.strictEqual(r.status, 1, '即使帶 --dry-run 仍須 hard-fail');
  assert.ok(!/\bOK\b/.test(r.stdout), 'stdout 不得回報 OK');
  assert.ok(!/DRY-RUN plan/.test(r.stdout), 'stdout 不得輸出 plan');
});
check('cli: 缺 --published-at 之錯誤訊息不得洩漏當下時間', () => {
  const r = runCli(['--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL, '--dry-run']);
  const nowYear = String(new Date().getFullYear());
  assert.ok(
    !new RegExp(`${nowYear}-\\d{2}-\\d{2}T`).test(r.stderr),
    `stderr 不得帶出當下時間戳：${r.stderr}`,
  );
});
check('cli: 空字串 --published-at → exit 1 required', () => {
  const r = runCli(['--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL, '--dry-run', '--published-at', '']);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/--published-at is required/.test(r.stderr), `stderr: ${r.stderr}`);
});

// ── 7. CLI 負向（regression）：既有錯誤路徑之 exit code 契約不變 ─────────────────────
check('cli: 無法解析之 --published-at → exit 1 unparseable（regression）', () => {
  const r = runCli([
    '--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL, '--dry-run', '--published-at', 'not-a-date',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/not parseable as a date/.test(r.stderr), `stderr: ${r.stderr}`);
});
check('cli: 缺 --url → exit 1（regression）', () => {
  const r = runCli(['--slug', NONEXISTENT_SLUG, '--published-at', '2026-05-15', '--dry-run']);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/--url is required/.test(r.stderr), `stderr: ${r.stderr}`);
});
check('cli: --url 非 http(s) → exit 1（regression）', () => {
  const r = runCli([
    '--slug', NONEXISTENT_SLUG, '--url', 'ftp://x/y', '--published-at', '2026-05-15', '--dry-run',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/must start with http/.test(r.stderr), `stderr: ${r.stderr}`);
});
check('cli: --id 與 --slug 併用 → exit 1（regression）', () => {
  const r = runCli([
    '--id', 'x', '--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL,
    '--published-at', '2026-05-15', '--dry-run',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/mutually exclusive/.test(r.stderr), `stderr: ${r.stderr}`);
});
check('cli: 不存在之 slug 仍 exit 1（NONEXISTENT_SLUG 前提成立）', () => {
  const r = runCli([
    '--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL, '--published-at', '2026-05-15', '--dry-run',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/no post found/.test(r.stderr), `NONEXISTENT_SLUG 必須真的不存在：${r.stderr}`);
});
check('cli: --help → exit 0（regression）', () => {
  const r = runCli(['--help']);
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}`);
  assert.ok(/--published-at/.test(r.stdout), 'help 須提及 --published-at');
});

// ── 8. CLI 正向：帶作者提供之 publishedAt + --dry-run → exit 0、plan 採用該真值 ────────
check('cli: 合法 --published-at + --dry-run → exit 0', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
    '--published-at', '2026-05-15T10:00:00+08:00',
  ]);
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stderr}`);
  assert.ok(/DRY-RUN plan/.test(r.stdout), 'stdout 須輸出 plan');
  assert.ok(/No changes written/.test(r.stdout), 'dry-run 須聲明未寫入');
});
check('cli: dry-run plan 之 publishedAt 等於作者提供值（未被改寫）', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
    '--published-at', '2026-05-15T10:00:00+08:00',
  ]);
  const json = JSON.parse(r.stdout.slice(r.stdout.indexOf('{'), r.stdout.lastIndexOf('}') + 1));
  assert.strictEqual(json.changes['blogger.publishedAt'], '2026-05-15T10:00:00+08:00');
});
check('cli: dry-run plan 之 publishYear/Month 由作者提供之 publishedAt 推導', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
    '--published-at', '2026-05-15T10:00:00+08:00',
  ]);
  const json = JSON.parse(r.stdout.slice(r.stdout.indexOf('{'), r.stdout.lastIndexOf('}') + 1));
  assert.strictEqual(json.changes['blogger.publishYear'], '2026');
  assert.strictEqual(json.changes['blogger.publishMonth'], '05');
});

// ── 9. Sanity：fixture 前提成立（避免 guard 在錯誤前提下空跑）────────────────────────
check('sanity: fixture sidecar 帶既有 publishedUrl（正向測試前提）', () => {
  assert.ok(typeof FIXTURE_URL === 'string' && FIXTURE_URL.startsWith('https://'), 'fixture URL 無效');
  assert.ok(typeof FIXTURE_SLUG === 'string' && FIXTURE_SLUG !== '', 'fixture slug 無效');
});

// ── 結果 ─────────────────────────────────────────────────────────────────────────
console.log(`\n[check:backfill-published-url] ${pass}/${pass + fail} PASS`);
if (fail > 0) {
  console.error('\nFailures:');
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
