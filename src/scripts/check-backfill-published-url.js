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

import { parseArgs, resolvePublishedAt, deriveYearMonth, isHttpUrl } from './backfill-published-url.js';

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

// ── 3b. pure resolver：Date 可解析但非嚴格 ISO → not-strict-iso（fail-closed）──────────
// 攔截「resolvePublishedAt 接受、deriveYearMonth 卻推不出年月」之落差值。此類值若被接受，
// CLI 會寫入 status:"published" + publishYear:"" + publishMonth:""，與 publishedUrl 之
// /yyyy/mm/ 不一致（docs/publish-json-schema.md §9.5）。
const NOT_STRICT_ISO_CASES = [
  ['空格取代 T', '2026-05-15 10:00'],
  ['空格取代 T（含秒）', '2026-05-15 10:00:00'],
  ['人類可讀月份', 'May 15, 2026'],
  ['斜線分隔', '2026/05/15'],
  ['美式順序', '05/15/2026'],
];
for (const [label, input] of NOT_STRICT_ISO_CASES) {
  check(`resolvePublishedAt: fail-closed — ${label}`, () => {
    assert.deepStrictEqual(resolvePublishedAt(input), { ok: false, error: 'not-strict-iso' });
  });
}

// ── 3c. pure resolver：前後空白 → not-strict-iso（fail-closed）─────────────────────────
// deriveYearMonth 以 trim 後之字串比對，resolvePublishedAt 卻回傳原值、CLI 逐字寫入 sidecar。
// 若不在此攔截，`\t2026-05-15` 會以 exit 0 寫出含空白之 blogger.publishedAt —— 年月正確，
// 但寫入之值本身不符 docs/publish-json-schema.md §5.4 之嚴格 ISO-8601。
const PADDED_CASES = [
  ['前導空格', ' 2026-05-15T10:00:00+08:00'],
  ['尾隨空格', '2026-05-15T10:00:00+08:00 '],
  ['前導 tab', '\t2026-05-15'],
  ['尾隨換行', '2026-05-15\n'],
  ['前後皆空白', '  2026-05-15T10:00:00Z  '],
  ['date-only 前後空格', ' 2026-05-15 '],
];
for (const [label, input] of PADDED_CASES) {
  check(`resolvePublishedAt: fail-closed — ${label}`, () => {
    assert.deepStrictEqual(resolvePublishedAt(input), { ok: false, error: 'not-strict-iso' });
  });
}

// 不變式：凡接受之值，其本身即為嚴格 ISO（== 已 trim）。回傳值會被逐字寫入 sidecar，
// 故「通過驗證」與「可安全寫入」必須是同一件事。
check('invariant: 凡接受之 publishedAt，其值本身即嚴格 ISO（無前後空白）', () => {
  const PROBE = [
    '2026-05-15',
    '2026-05-15T10:00:00+08:00',
    ' 2026-05-15',
    '2026-05-15\t',
    '\n2026-05-15T10:00:00Z',
    '2028-02-29T12:00:00+08:00',
  ];
  for (const input of PROBE) {
    const r = resolvePublishedAt(input);
    if (!r.ok) continue;
    assert.strictEqual(
      r.publishedAt,
      r.publishedAt.trim(),
      `接受了帶前後空白之 publishedAt（會逐字寫入 sidecar）：${JSON.stringify(input)}`,
    );
  }
});

// 不變式（本切片之核心契約）：凡 resolvePublishedAt 接受之值，deriveYearMonth 必推得非空年月。
// 覆蓋正向 + 各類負向，確保兩個 validator 不再各自為政。
check('invariant: 凡接受之 publishedAt，deriveYearMonth 必非空', () => {
  const PROBE = [
    '2026-05-15',
    '2026-05-15T10:00:00+08:00',
    '2026-08-01T00:30:00+08:00',
    '2027-01-01T00:15:00+08:00',
    '2028-02-29T12:00:00+08:00',
    '2026-05-15 10:00',
    'May 15, 2026',
    '2026/05/15',
    'not-a-date',
    '2026-02-30T10:00:00+08:00',
    '2026-7-15T12:00:00+08:00',
    '',
    '   ',
  ];
  for (const input of PROBE) {
    const r = resolvePublishedAt(input);
    if (!r.ok) continue;
    const { year, month } = deriveYearMonth(r.publishedAt);
    assert.ok(
      year !== '' && month !== '',
      `接受了無法推導年月之 publishedAt（會寫出空 publishYear/Month）：${JSON.stringify(input)}`,
    );
  }
});

// 既有嚴格度不得放寬：先前由 new Date() 攔下之值仍須被拒（非降級為 not-strict-iso 之外的放行）。
check('resolvePublishedAt: 非法時間 2026-05-15T99:99:99Z 仍被拒（regression）', () => {
  const r = resolvePublishedAt('2026-05-15T99:99:99Z');
  assert.strictEqual(r.ok, false, '非法時鐘值不得被接受');
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

// ── 8c. CLI 負向：非嚴格 ISO 之 --published-at → 寫入前 exit 1 ───────────────────────
// 用 FIXTURE_SLUG（真實文章）+ --dry-run + --force：即使 CLI 回退成放行，dry-run 分支仍
// 早於 atomic write（見 §4 static 斷言）→ 零寫入；runCli 另比對 bytes/mtime 作防禦縱深。
// 此組合證明「即便文章存在且帶 --force，非 ISO 值仍走不到 plan」。
check('cli: 空格取代 T 之 --published-at → exit 1（非 exit 0 靜默寫入）', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
    '--published-at', '2026-05-15 10:00',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\n${r.stdout}`);
  assert.ok(/must be strict ISO 8601/.test(r.stderr), `stderr: ${r.stderr}`);
});
check('cli: 非嚴格 ISO 時不得輸出 OK / DRY-RUN plan', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
    '--published-at', '2026-05-15 10:00',
  ]);
  assert.ok(!/DRY-RUN plan/.test(r.stdout), 'stdout 不得輸出 plan');
  assert.ok(!/\bOK\b/.test(r.stdout), 'stdout 不得回報 OK');
});
check('cli: 非嚴格 ISO 絕不產出空 publishYear/publishMonth 之 plan', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
    '--published-at', '2026-05-15 10:00',
  ]);
  assert.ok(
    !/"blogger\.publishYear":\s*""/.test(r.stdout),
    `plan 不得帶空 publishYear（會寫出與 publishedUrl /yyyy/mm/ 不一致之 sidecar）：${r.stdout}`,
  );
});
check('cli: 非嚴格 ISO 之錯誤訊息須指引正確格式', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
    '--published-at', 'May 15, 2026',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/YYYY-MM-DD/.test(r.stderr), `stderr 須指出期望格式：${r.stderr}`);
});
check('cli: 嚴格 ISO 檢查早於 post 查找（寫入路徑不可達）', () => {
  const r = runCli([
    '--slug', NONEXISTENT_SLUG, '--url', FIXTURE_URL, '--dry-run',
    '--published-at', '2026-05-15 10:00',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/must be strict ISO 8601/.test(r.stderr), `stderr: ${r.stderr}`);
  assert.ok(!/no post found/.test(r.stderr), 'ISO 檢查須早於 post 查找');
});
// ── 8d. CLI 負向：前後帶空白之 --published-at → 寫入前 exit 1 ───────────────────────
// 與 8c 同組合（真實文章 + --dry-run + --force）。此類值年月推得出來，故 8c 之空 publishYear
// 斷言攔不到；缺口在於「寫入之 publishedAt 本身帶空白」。runCli 之 bytes/mtime 比對確保零寫入。
for (const [label, input] of [
  ['前導 tab', '\t2026-05-15'],
  ['尾隨換行', '2026-05-15\n'],
  ['前後空格', ' 2026-05-15T10:00:00+08:00 '],
]) {
  check(`cli: ${label} 之 --published-at → exit 1（非 exit 0 寫入帶空白之值）`, () => {
    const r = runCli([
      '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
      '--published-at', input,
    ]);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\n${r.stdout}`);
    assert.ok(/must be strict ISO 8601/.test(r.stderr), `stderr: ${r.stderr}`);
    assert.ok(!/DRY-RUN plan/.test(r.stdout), 'stdout 不得輸出 plan');
  });
}

// ── 8e. publishedUrl：前後帶空白 → 寫入前 fail-closed ────────────────────────────────
// 與 publishedAt 同型缺口：isHttpUrl 先前以 s.trim() 比對 http(s) 前綴，main 卻以
// `publishedUrl: opts.url` 逐字寫入未 trim 之原值 → " https://…" / "https://…\t" 會以
// exit 0 寫出帶空白之 publishedUrl，該值不再與 Blogger 上之真實 URL 逐字相同（§5.3）。
// 取自既有 sidecar 之現值（與正向測試同源；未新增任何推測之 Blogger 真值）。
const PADDED_URL = FIXTURE_URL;
const PADDED_URL_CASES = [
  ['前導空格', ` ${PADDED_URL}`],
  ['尾隨空格', `${PADDED_URL} `],
  ['前導 tab', `\t${PADDED_URL}`],
  ['尾隨換行', `${PADDED_URL}\n`],
  ['前後皆空白', `  ${PADDED_URL}  `],
  ['尾隨 CR（CRLF 貼上殘留）', `${PADDED_URL}\r`],
];
for (const [label, input] of PADDED_URL_CASES) {
  check(`isHttpUrl: fail-closed — ${label}`, () => {
    assert.strictEqual(isHttpUrl(input), false, `padded URL 不得通過驗證：${JSON.stringify(input)}`);
  });
}

// 正向 regression：既有合法 URL 行為不變（無空白之 http/https 仍通過）。
check('isHttpUrl: 無空白之 https URL 仍通過（regression）', () => {
  assert.strictEqual(isHttpUrl(PADDED_URL), true);
});
check('isHttpUrl: 無空白之 http URL 仍通過（regression）', () => {
  assert.strictEqual(isHttpUrl('http://example.com/2026/05/x.html'), true);
});
check('isHttpUrl: 非 http(s) scheme 仍被拒（regression）', () => {
  assert.strictEqual(isHttpUrl('ftp://x/y'), false);
});
check('isHttpUrl: 非字串 → false（regression）', () => {
  assert.strictEqual(isHttpUrl(12345), false);
  assert.strictEqual(isHttpUrl(null), false);
  assert.strictEqual(isHttpUrl(undefined), false);
});

// 不變式：凡通過 isHttpUrl 之值，其本身即無前後空白。此值會被逐字寫入 sidecar，
// 故「通過驗證」與「可安全寫入」必須是同一件事（mirror publishedAt 之不變式）。
check('invariant: 凡接受之 publishedUrl，其值本身即無前後空白', () => {
  const PROBE = [
    PADDED_URL,
    ' ' + PADDED_URL,
    PADDED_URL + '\t',
    '\n' + PADDED_URL,
    'http://example.com/2026/05/x.html ',
    'ftp://x/y',
  ];
  for (const input of PROBE) {
    if (!isHttpUrl(input)) continue;
    assert.strictEqual(
      input,
      input.trim(),
      `接受了帶前後空白之 publishedUrl（會逐字寫入 sidecar）：${JSON.stringify(input)}`,
    );
  }
});

// CLI 端到端：padded --url → 寫入前 exit 1。用 FIXTURE_SLUG（真實文章）+ --dry-run + --force
// 證明「即便文章存在且帶 --force，padded URL 仍走不到 plan」；runCli 之 bytes/mtime 比對確保零寫入。
// spawnSync shell:false → argv 逐字傳遞，不受 host shell quoting 影響。
for (const [label, input] of PADDED_URL_CASES) {
  check(`cli: ${label} 之 --url → exit 1（非 exit 0 寫入帶空白之值）`, () => {
    const r = runCli([
      '--slug', FIXTURE_SLUG, '--url', input, '--dry-run', '--force',
      '--published-at', '2026-05-15T10:00:00+08:00',
    ]);
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}\n${r.stdout}`);
    assert.ok(/must start with http/.test(r.stderr), `stderr: ${r.stderr}`);
    assert.ok(!/DRY-RUN plan/.test(r.stdout), 'stdout 不得輸出 plan');
    assert.ok(!/\bOK\b/.test(r.stdout), 'stdout 不得回報 OK');
  });
}
check('cli: padded --url 之錯誤訊息說明空白遭拒（deterministic）', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', ` ${PADDED_URL}`, '--dry-run', '--force',
    '--published-at', '2026-05-15T10:00:00+08:00',
  ]);
  assert.ok(/surrounding whitespace is rejected/.test(r.stderr), `stderr 須說明空白遭拒：${r.stderr}`);
});
check('cli: padded --url 絕不出現於 resolved payload', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', `\t${PADDED_URL}`, '--dry-run', '--force',
    '--published-at', '2026-05-15T10:00:00+08:00',
  ]);
  assert.ok(
    !/"blogger\.publishedUrl"/.test(r.stdout),
    `padded URL 不得進入 payload：${r.stdout}`,
  );
});
check('cli: padded --url 不得被 trim 後放行（stdout 不得帶 trim 後之 URL）', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', `${PADDED_URL}\n`, '--dry-run', '--force',
    '--published-at', '2026-05-15T10:00:00+08:00',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(!r.stdout.includes(PADDED_URL), `不得回傳正規化後之 URL：${r.stdout}`);
});
check('cli: URL 檢查早於 post 查找（寫入路徑不可達）', () => {
  const r = runCli([
    '--slug', NONEXISTENT_SLUG, '--url', ` ${PADDED_URL}`, '--dry-run',
    '--published-at', '2026-05-15T10:00:00+08:00',
  ]);
  assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status}`);
  assert.ok(/must start with http/.test(r.stderr), `stderr: ${r.stderr}`);
  assert.ok(!/no post found/.test(r.stderr), 'URL 檢查須早於 post 查找');
});
// 正向 regression：乾淨 URL 之 plan 逐字等於作者提供值（未被工具改寫）。
check('cli: 乾淨 --url 之 plan publishedUrl 逐字等於作者提供值', () => {
  const r = runCli([
    '--slug', FIXTURE_SLUG, '--url', FIXTURE_URL, '--dry-run', '--force',
    '--published-at', '2026-05-15T10:00:00+08:00',
  ]);
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}\n${r.stderr}`);
  const json = JSON.parse(r.stdout.slice(r.stdout.indexOf('{'), r.stdout.lastIndexOf('}') + 1));
  assert.strictEqual(json.changes['blogger.publishedUrl'], FIXTURE_URL);
});

check('static: USAGE 說明 --url 之前後空白遭拒', () => {
  assert.ok(
    /--url with surrounding whitespace/i.test(SRC),
    'USAGE 須說明 --url 之前後空白會被拒絕',
  );
});
check('static: URL 檢查早於 findPosts（負向測試零寫入之前提）', () => {
  const urlIdx = SRC.indexOf('if (!isHttpUrl(opts.url))');
  const findIdx = SRC.indexOf('await findPosts(');
  assert.ok(urlIdx > 0 && findIdx > 0, '找不到 isHttpUrl 檢查或 findPosts');
  assert.ok(urlIdx < findIdx, 'URL fail-closed 必須早於 post 查找與寫入');
});
check('static: isHttpUrl 不得以 trim 後之值比對前綴', () => {
  const block = SRC.slice(SRC.indexOf('export function isHttpUrl'));
  const body = block.slice(0, block.indexOf('\n}\n') + 1);
  assert.ok(
    !/test\(\s*s\.trim\(\)\s*\)/.test(body),
    'isHttpUrl 不得以 s.trim() 比對（驗證與寫入須為同一字串）',
  );
});
check('static: publishedUrl 逐字取自 opts.url（未被工具正規化）', () => {
  assert.ok(
    /publishedUrl:\s*opts\.url\b/.test(SRC),
    'publishedUrl 須逐字取自作者提供值',
  );
  assert.ok(
    !/publishedUrl:\s*opts\.url\.trim\(\)/.test(SRC),
    'CLI 不得於寫入前 trim 作者提供之 URL（真值不由工具改寫）',
  );
});

check('static: USAGE 說明 --published-at 須為 strict ISO 8601', () => {
  const required = SRC.slice(SRC.indexOf('Required:'), SRC.indexOf('Optional:'));
  assert.ok(
    /strict ISO 8601/i.test(required),
    'USAGE Required 區塊須說明 --published-at 為 strict ISO 8601',
  );
});

// ── 8b. deriveYearMonth：pure function；年月取自 publishedAt 原始 offset，不換算 UTC ──
// 依據 docs/publish-json-schema.md §5.4 + §5.3.1 + §9.5。純函式測試 → 零寫入路徑、
// 不碰 production sidecar、與執行機器 timezone 無關。
const ym = (s) => {
  const r = deriveYearMonth(s);
  return `${r.year}/${r.month}`;
};

// 正向：一般含 offset 時間
check('deriveYearMonth: 一般 offset 2026-07-15T12:00:00+08:00 → 2026/07', () => {
  assert.strictEqual(ym('2026-07-15T12:00:00+08:00'), '2026/07');
});
// 正向：UTC
check('deriveYearMonth: UTC 2026-07-15T04:00:00Z → 2026/07', () => {
  assert.strictEqual(ym('2026-07-15T04:00:00Z'), '2026/07');
});
// 正向：負 offset（UTC 換算後會跨入 8 月 → 必須仍為 07）
check('deriveYearMonth: 負 offset 2026-07-31T23:30:00-07:00 → 2026/07（非 08）', () => {
  assert.strictEqual(ym('2026-07-31T23:30:00-07:00'), '2026/07');
});

// 月份邊界：舊 UTC 實作會誤推為 07
check('deriveYearMonth: 月份邊界 2026-08-01T00:30:00+08:00 → 2026/08（非 07）', () => {
  assert.strictEqual(ym('2026-08-01T00:30:00+08:00'), '2026/08');
});
check('deriveYearMonth: 月份邊界 2026-07-31T23:30:00-07:00 → 2026/07', () => {
  assert.strictEqual(ym('2026-07-31T23:30:00-07:00'), '2026/07');
});

// 跨年邊界：舊 UTC 實作會誤推為 2026/12
check('deriveYearMonth: 跨年 2027-01-01T00:15:00+08:00 → 2027/01（非 2026/12）', () => {
  assert.strictEqual(ym('2027-01-01T00:15:00+08:00'), '2027/01');
});
check('deriveYearMonth: 跨年 2026-12-31T23:30:00-05:00 → 2026/12（非 2027/01）', () => {
  assert.strictEqual(ym('2026-12-31T23:30:00-05:00'), '2026/12');
});

// 邊界：零補位 / 閏年
check('deriveYearMonth: 月份零補位（01 而非 1）', () => {
  assert.strictEqual(deriveYearMonth('2027-01-01T00:15:00+08:00').month, '01');
});
check('deriveYearMonth: 閏年合法日期 2028-02-29T12:00:00+08:00 → 2028/02', () => {
  assert.strictEqual(ym('2028-02-29T12:00:00+08:00'), '2028/02');
});
check('deriveYearMonth: 非閏年非法日期 2027-02-29T12:00:00+08:00 → fail-closed', () => {
  assert.deepStrictEqual(deriveYearMonth('2027-02-29T12:00:00+08:00'), { year: '', month: '' });
});

// 結果不得依執行機器 timezone 改變
check('deriveYearMonth: 結果與執行機器 timezone 無關（不使用 local getter）', () => {
  const orig = process.env.TZ;
  const seen = new Set();
  for (const tz of ['UTC', 'Asia/Taipei', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
    process.env.TZ = tz;
    seen.add(ym('2026-08-01T00:30:00+08:00'));
  }
  if (orig === undefined) delete process.env.TZ;
  else process.env.TZ = orig;
  assert.deepStrictEqual([...seen], ['2026/08'], `結果隨 TZ 改變：${[...seen].join(', ')}`);
});

// 靜態：不得使用 UTC / local 年月 getter 推導（鎖住舊 bug 不得回歸）
check('static: deriveYearMonth 不得使用 getUTCFullYear / getUTCMonth 推導年月', () => {
  const block = SRC.slice(SRC.indexOf('export function deriveYearMonth'));
  const body = block.slice(0, block.indexOf('\n}\n') + 1);
  assert.ok(!/getUTCFullYear\(\)|getUTCMonth\(\)/.test(body.replace(/probe\.getUTC\w+\(\)/g, '')),
    'deriveYearMonth 不得以 UTC getter 推導年月（會在月份邊界推導錯誤月份）');
  assert.ok(!/getFullYear\(\)|getMonth\(\)/.test(body),
    'deriveYearMonth 不得以 local getter 推導年月（結果會依執行機器 timezone 改變）');
});

// 負向 / fail-closed
const EMPTY_YM = { year: '', month: '' };
const NEGATIVE_CASES = [
  ['missing (undefined)', undefined],
  ['null', null],
  ['空字串', ''],
  ['純空白', '   '],
  ['number', 20260715],
  ['object', { publishedAt: '2026-07-15T12:00:00+08:00' }],
  ['array', ['2026-07-15T12:00:00+08:00']],
  ['invalid ISO', 'not-a-date'],
  ['不存在之曆法日期', '2026-02-30T10:00:00+08:00'],
  ['月份 00', '2026-00-15T10:00:00+08:00'],
  ['月份 13', '2026-13-15T10:00:00+08:00'],
  ['日 32', '2026-07-32T10:00:00+08:00'],
  ['前綴垃圾字元', 'x2026-07-15T12:00:00+08:00'],
  ['尾隨垃圾字元', '2026-07-15T12:00:00+08:00-junk'],
  ['非零補位月份', '2026-7-15T12:00:00+08:00'],
  ['僅 YYYY-MM（無日）', '2026-07'],
];
for (const [label, input] of NEGATIVE_CASES) {
  check(`deriveYearMonth: fail-closed — ${label}`, () => {
    assert.deepStrictEqual(deriveYearMonth(input), EMPTY_YM);
  });
}
check('deriveYearMonth: 不得因前七碼看似 YYYY-MM 就繞過完整日期驗證', () => {
  assert.deepStrictEqual(deriveYearMonth('2026-02-30T10:00:00+08:00'), EMPTY_YM);
  assert.deepStrictEqual(deriveYearMonth('2026-07-99T10:00:00+08:00'), EMPTY_YM);
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
