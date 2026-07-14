#!/usr/bin/env node
// Phase 20260714-C.1b：explicit-confirmation local apply CLI wiring（production-capable，disabled-by-default）。
//
// 背景 / 上位契約：
//   docs/20260714-admin-github-redraft-write-path-preflight.md §14 之 **Phase C.1b**（production CLI
//   activation）。Phase A（admin-article-lookup.js，唯讀 resolver）、Phase B（redraft-plan.js，dry-run
//   patch planner）、Phase C0（admin-git-safety-preflight.js，唯讀 repository safety）、Phase C.1a
//   （redraft-apply-engine.js，dormant atomic apply engine）皆已落地。本檔把 C.1a engine 接上一個
//   **Dean-gated、預設完全禁用**的正式 CLI：CLI 只負責「授權 + 協調」，engine 負責真正的 atomic
//   write 安全契約（本 CLI **不**複製 engine 已有的安全邏輯）。
//
// 分層職責（CLI vs engine）：
//   - CLI（本檔）：解析 / 驗證全部 CLI arguments、驗證 env gate 精確值、驗證 confirmation phrase、
//     以 Phase A 重新唯一解析文章、以 Phase B 重新產生 dry-run plan、比對 Dean 提供的 expected source
//     SHA、顯示最終即將執行內容、呼叫 engine、提供 pure single-file post-write validation callback、
//     成功後回報「只改 local Markdown，未 commit / push / build / deploy」+ 下一步提示。
//   - engine（redraft-apply-engine.js）：plan schema recheck → 自行重跑 Phase C0 preflight → Phase A
//     重新解析 → source SHA TOCTOU → lifecycle precondition → target 重算核 SHA → atomic replace
//     （fsync / mode 保留）→ 呼叫本 CLI 的 validation callback → 失敗 rollback。
//
// 硬邊界（違反即設計錯誤；contract guard check-redraft-apply-cli.js 靜態 + fixture 斷言）：
//   - **預設完全禁用**：未同時具備 `--apply` + env gate 精確值 + `--confirm=<精確 phrase>` +
//     `--slug=<exact>` + `--op=redraft|republish` + `--expected-source-sha=<64 lowercase hex>`
//     全部吻合時，一律**不**呼叫 engine、**零寫入**。任一缺失 / 不吻合 → hard-fail。
//   - **無 force bypass**：明確拒絕 `--commit` / `--push` / `--deploy` / `--build` / `--fetch` /
//     `--pull` / `--reset` / `--checkout` / `--stash` / `--clean` / `--delete` / `--permanent-delete` /
//     `--blogger` / `--force` / `--skip-validation` / `--skip-preflight` / `--ignore-sha`（即使同時帶
//     `--apply` 亦拒）。無任何跳過安全門的參數。
//   - **只**改單一目標 Markdown 之 `status` + `draft` 兩欄位（委派 engine → Phase B byte-preserving
//     patch）；**不**動 sidecar / body / slug / 其他 frontmatter / 其他檔；**不**新增
//     previousStatus / sidecar / history metadata。
//   - **不** import 既有 real-write 路徑（admin-write-cli / admin-write-whitelist /
//     admin-frontmatter-patcher / safe-write）；**不** import child_process；**不** spawn git；
//     **不** commit / push / build / deploy / 碰 gh-pages；**不** Blogger / Google / GA4 / AdSense API；
//     **不**永久刪除；**不** git history rewrite。
//   - post-write validation 為 **pure single-file**（重讀單一目標檔、in-memory 驗證）；**不**跑
//     repo-wide validate:content / lifecycle guard（dirty-tree 下會因「預期的單一文章變更」而失敗；
//     不得繞過安全門或偽造 clean tree）。repo-wide checks 列為 apply 後 Dean 手動下一步。
//   - 成功後 working tree 預期 dirty（只有目標 Markdown 兩行變更）—— 這是正確結果；**不**自動
//     commit / push / stash / clean / reset / build / deploy。
//
// 環境變數 gate（§4.2）：
//   PORTABLE_BLOG_REDRAFT_APPLY=DEAN_APPROVED_LOCAL_WRITE_ONLY
//   - 預設不存在；**不**接受 `1` / `true` 等易誤設值；**不**接受部分匹配（精確字串相等）；
//     **不**寫入 `.env`；**不**永久開啟；每次執行都需重新提供。
//
// confirmation phrase（§4.2）：
//   --confirm=DEAN-CONFIRMS-LOCAL-STATUS-WRITE   （固定精確字串；不接受 --yes / -y）
//
// 執行（Dean-gated；本 session 不對 production 執行）：
//   PORTABLE_BLOG_REDRAFT_APPLY=DEAN_APPROVED_LOCAL_WRITE_ONLY \
//     node src/scripts/redraft-apply-cli.js \
//     --apply --slug=<slug> --op=redraft \
//     --expected-source-sha=<sourceSha256-from-dry-run> \
//     --confirm=DEAN-CONFIRMS-LOCAL-STATUS-WRITE
//   （npm：`npm run admin:redraft-apply -- --apply --slug=... --op=... --expected-source-sha=... --confirm=...`）

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

import { resolveArticleBySlug } from './admin-article-lookup.js';
import { planRedraft } from './redraft-plan.js';
import { applyLifecycleAtomic } from './redraft-apply-engine.js';

// ── 精確授權常數（§4.2）─────────────────────────────────────────────────────────────
export const ENV_GATE_NAME = 'PORTABLE_BLOG_REDRAFT_APPLY';
export const ENV_GATE_VALUE = 'DEAN_APPROVED_LOCAL_WRITE_ONLY';
export const CONFIRM_PHRASE = 'DEAN-CONFIRMS-LOCAL-STATUS-WRITE';

const SHA256_HEX_RE = /^[0-9a-f]{64}$/; // 64 lowercase hex（大寫 / 長度不符 → 格式錯誤）
const VALID_OPS = new Set(['redraft', 'republish']);
const VISIBLE_STATUS = new Set(['ready', 'published']); // 與 load-posts.js classify() 一致

// ── §9 明確拒絕的危險 / bypass 參數（即使同時帶 --apply 亦拒；無 force bypass）─────────────
export const FORBIDDEN_FLAGS = new Set([
  '--commit', '--push', '--deploy', '--build', '--fetch', '--pull', '--reset',
  '--checkout', '--stash', '--clean', '--delete', '--permanent-delete', '--blogger',
  '--force', '--skip-validation', '--skip-preflight', '--ignore-sha',
]);

function sha256Hex(str) {
  return createHash('sha256').update(Buffer.from(str, 'utf-8')).digest('hex');
}

function stripCR(s) {
  return s.endsWith('\r') ? s.slice(0, -1) : s;
}

// ── argv 解析（精確；拒絕 forbidden / unknown 參數）──────────────────────────────────────
// 回 { ok:true, apply, slug, op, expectedSourceSha, confirm, site, json }
//   或 { ok:false, error, flag? }
function parseArgv(argv) {
  const out = {
    ok: true,
    apply: false,
    slug: null,
    op: null,
    expectedSourceSha: null,
    confirm: null,
    site: undefined,
    json: false,
  };
  const list = Array.isArray(argv) ? argv : [];
  for (let i = 0; i < list.length; i += 1) {
    const raw = list[i];
    if (typeof raw !== 'string') continue;
    const bare = raw.includes('=') ? raw.slice(0, raw.indexOf('=')) : raw;

    // §9 forbidden / bypass 參數（優先攔截，即使帶 --apply）。
    if (FORBIDDEN_FLAGS.has(bare)) {
      return { ok: false, error: 'forbidden-flag', flag: bare };
    }

    if (raw === '--apply' || raw === '--apply=true') { out.apply = true; continue; }
    if (raw === '--json') { out.json = true; continue; }

    if (raw.startsWith('--slug=')) { out.slug = raw.slice('--slug='.length); continue; }
    if (raw === '--slug') { out.slug = list[i + 1]; i += 1; continue; }

    if (raw.startsWith('--op=')) { out.op = raw.slice('--op='.length); continue; }
    if (raw === '--op') { out.op = list[i + 1]; i += 1; continue; }

    if (raw.startsWith('--expected-source-sha=')) { out.expectedSourceSha = raw.slice('--expected-source-sha='.length); continue; }
    if (raw === '--expected-source-sha') { out.expectedSourceSha = list[i + 1]; i += 1; continue; }

    if (raw.startsWith('--confirm=')) { out.confirm = raw.slice('--confirm='.length); continue; }
    if (raw === '--confirm') { out.confirm = list[i + 1]; i += 1; continue; }

    if (raw.startsWith('--site=')) { out.site = raw.slice('--site='.length); continue; }
    if (raw === '--site') { out.site = list[i + 1]; i += 1; continue; }

    return { ok: false, error: 'unknown-arg', flag: raw };
  }
  return out;
}

// ── pure single-file post-write validation callback（§7）─────────────────────────────────
// 只重讀「單一目標檔」並 in-memory 驗證；不跑 repo-wide validate:content / lifecycle guard，
// 不 commit / stash / 隱藏變更、不偽造 clean tree。回 { ok:boolean, reason? }。
// 驗證項（§7）：Markdown 可解析 / status·draft 型別與一致性 / classify() 符合 action /
//              slug 未改變 / body 與非白名單 metadata 未改變 / target SHA 正確。
export function makePostWriteValidator() {
  return async ({ projectRoot, sourcePath, plan }) => {
    const abs = path.join(projectRoot, ...sourcePath.split('/'));

    let raw;
    try {
      raw = await readFile(abs, 'utf-8');
    } catch (err) {
      return { ok: false, reason: 'post-write-read-failed', detail: err.message };
    }

    // target SHA 正確（與 engine 重複；defense-in-depth）。
    if (sha256Hex(raw) !== plan.targetSha256) {
      return { ok: false, reason: 'target-sha-mismatch' };
    }

    // Markdown / frontmatter 可解析。
    let data;
    try {
      ({ data } = matter(raw));
    } catch (err) {
      return { ok: false, reason: 'frontmatter-unparseable', detail: err.message };
    }

    // status / draft 型別。
    if (typeof data.status !== 'string') return { ok: false, reason: 'status-type-invalid' };
    if (typeof data.draft !== 'boolean') return { ok: false, reason: 'draft-type-invalid' };

    // 等於 plan.target（成對）。
    if (data.status !== plan.target.status || data.draft !== plan.target.draft) {
      return { ok: false, reason: 'status-draft-not-target' };
    }

    // status⇔draft 一致（visible⇔draft:false；hidden⇔draft:true）。
    const visible = VISIBLE_STATUS.has(data.status);
    if (visible === data.draft) {
      return { ok: false, reason: 'status-draft-inconsistent' };
    }

    // classify() 結果符合 action：redraft → 隱藏（include:false）；republish → 可見（include:true）。
    const include = data.draft !== true && VISIBLE_STATUS.has(data.status ?? 'draft');
    const expectInclude = plan.op === 'republish';
    if (include !== expectInclude) {
      return { ok: false, reason: 'classify-mismatch' };
    }

    // slug 未改變。
    if (data.slug !== plan.slug) {
      return { ok: false, reason: 'slug-changed' };
    }

    // body 與非白名單 metadata 未改變：把已寫入檔中兩行 status/draft 反代回 old 值，
    // 重組後 SHA-256 必須等於 plan.sourceSha256（證明「恰 2 行變更、其餘 byte-identical」）。
    if (!Array.isArray(plan.changes) || plan.changes.length !== 2) {
      return { ok: false, reason: 'plan-changes-shape-invalid' };
    }
    const lines = raw.split('\n');
    for (const c of plan.changes) {
      const idx = (c.lineNumber | 0) - 1;
      if (idx < 0 || idx >= lines.length) return { ok: false, reason: 'change-line-out-of-range' };
      const cur = lines[idx];
      const cr = cur.endsWith('\r') ? '\r' : '';
      if (stripCR(cur) !== c.newLine) return { ok: false, reason: 'change-line-not-applied' };
      lines[idx] = c.oldLine + cr;
    }
    const reversed = lines.join('\n');
    if (sha256Hex(reversed) !== plan.sourceSha256) {
      return { ok: false, reason: 'non-whitelist-bytes-changed' };
    }

    return { ok: true };
  };
}

// ── authorization gate 檢查（§4.2 / §6 step 1–3）────────────────────────────────────────
// 依 spec 順序：1 全部 CLI args、2 env gate 精確值、3 confirmation phrase。
// 回 { ok:true } 或 { ok:false, error, reason }。
function checkAuthorization(parsed, env) {
  // step 1：CLI args 完整性 / 格式。
  if (parsed.apply !== true) {
    return { ok: false, error: 'missing-apply-flag', reason: '未提供 --apply：預設禁用；請先以 admin:plan-redraft 產生並檢視 dry-run plan' };
  }
  if (typeof parsed.op !== 'string' || parsed.op === '') {
    return { ok: false, error: 'op-missing', reason: '必須提供 --op=redraft|republish' };
  }
  if (!VALID_OPS.has(parsed.op)) {
    return { ok: false, error: 'op-invalid', reason: '--op 必須為 redraft | republish（不接受任意 target status / archived / delete）' };
  }
  if (typeof parsed.slug !== 'string' || parsed.slug === '') {
    return { ok: false, error: 'slug-missing', reason: '必須提供 --slug=<exact-slug>' };
  }
  if (typeof parsed.expectedSourceSha !== 'string' || parsed.expectedSourceSha === '') {
    return { ok: false, error: 'expected-sha-missing', reason: '必須提供 --expected-source-sha=<dry-run 顯示的 sourceSha256>' };
  }
  if (!SHA256_HEX_RE.test(parsed.expectedSourceSha)) {
    return { ok: false, error: 'expected-sha-format-invalid', reason: '--expected-source-sha 必須為 64 位 lowercase hex' };
  }

  // step 2：env gate 精確值（不接受部分匹配 / 1 / true / 空）。
  const envVal = env ? env[ENV_GATE_NAME] : undefined;
  if (envVal === undefined || envVal === null || envVal === '') {
    return { ok: false, error: 'env-gate-missing', reason: `未設定環境變數 ${ENV_GATE_NAME}（預設禁用；每次執行都需重新提供精確值）` };
  }
  if (envVal !== ENV_GATE_VALUE) {
    return { ok: false, error: 'env-gate-mismatch', reason: `環境變數 ${ENV_GATE_NAME} 值不吻合（需精確等於授權字串；不接受 1 / true / 部分匹配）` };
  }

  // step 3：confirmation phrase（固定精確字串）。
  if (typeof parsed.confirm !== 'string' || parsed.confirm === '') {
    return { ok: false, error: 'confirm-missing', reason: `必須提供 --confirm=${CONFIRM_PHRASE}` };
  }
  if (parsed.confirm !== CONFIRM_PHRASE) {
    return { ok: false, error: 'confirm-mismatch', reason: 'confirmation phrase 不吻合（需固定精確字串；不接受 --yes / -y / 部分匹配）' };
  }

  return { ok: true };
}

// ── 核心 orchestration（§6 執行流程）──────────────────────────────────────────────────
// 回固定 shape 的 result（見各 return）。apply 路徑任一 gate 失敗 → 寫入前 hard-fail（zero-write）。
export async function runApply({ argv, projectRoot, env } = {}) {
  const parsed = parseArgv(argv);
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      stage: 'argv',
      reason:
        parsed.error === 'forbidden-flag'
          ? `${parsed.flag} 不受支援：本 CLI 無任何 commit / push / build / deploy / bypass 路徑（即使帶 --apply 亦拒；無 force bypass）`
          : `未知參數：${parsed.flag}`,
      flag: parsed.flag,
    };
  }

  // §6 step 1–3：authorization gate（全部通過才前進；任一失敗 zero-write）。
  const auth = checkAuthorization(parsed, env);
  if (!auth.ok) {
    return { ok: false, error: auth.error, stage: 'authorization', reason: auth.reason };
  }

  // §6 step 4：Phase A 重新唯一解析文章。
  const resolved = await resolveArticleBySlug({ slug: parsed.slug, site: parsed.site, projectRoot });
  if (!resolved.ok) {
    return { ok: false, error: `resolve-${resolved.error}`, stage: 'resolve', reason: resolved.reason, detail: resolved };
  }
  const article = resolved.article;

  // §6 step 5：Phase B 重新產生 dry-run plan（deterministic；含 source/target SHA）。
  const planned = await planRedraft({ slug: parsed.slug, op: parsed.op, site: parsed.site, projectRoot });
  if (!planned.ok) {
    return { ok: false, error: `plan-${planned.error}`, stage: 'plan', reason: planned.reason, detail: planned };
  }
  const plan = planned.plan;

  // §6 step 6：比對 Dean 提供的 expected source SHA 與重新產生的 plan.sourceSha256。
  //   不吻合 → hard-fail stale-source；不詢問後繼續、不自動採用新的 SHA、不覆蓋最新檔案。
  if (plan.sourceSha256 !== parsed.expectedSourceSha) {
    return {
      ok: false,
      error: 'stale-source',
      stage: 'expected-sha',
      reason:
        '重新產生的 sourceSha256 與 --expected-source-sha 不一致（檔案自 dry-run 後已變動）；拒絕寫入，' +
        '不採用新的 SHA、不覆蓋最新檔案。請重新執行 admin:plan-redraft 檢視最新 diff 後再決定。',
      expectedSourceSha: parsed.expectedSourceSha,
      regeneratedSourceSha256: plan.sourceSha256,
    };
  }

  // §6 step 7：顯示最終即將執行內容（slug / title / source path / current / proposed / SHA）。
  const finalPreview = {
    slug: article.slug,
    title: article.title,
    sourcePath: article.sourcePath,
    op: plan.op,
    current: plan.current,
    proposed: plan.target,
    sourceSha256: plan.sourceSha256,
    targetSha256: plan.targetSha256,
  };

  // §6 step 8–11：呼叫 engine（engine 內部重跑 preflight → atomic write → 本 CLI 的 validation callback）。
  const engineResult = await applyLifecycleAtomic({
    projectRoot,
    plan,
    validateAfterWrite: makePostWriteValidator(),
  });

  if (!engineResult.ok) {
    return {
      ok: false,
      error: `engine-${engineResult.error}`,
      stage: `engine:${engineResult.stage ?? 'unknown'}`,
      reason: engineResult.reason,
      finalPreview,
      engine: engineResult,
    };
  }

  // §6 step 12：成功回報（只改 local Markdown；未 commit / push / build / deploy）。
  return {
    ok: true,
    applied: true,
    op: plan.op,
    slug: article.slug,
    sourcePath: article.sourcePath,
    sourceSha256: plan.sourceSha256,
    targetSha256: plan.targetSha256,
    validated: engineResult.validated === true,
    finalPreview,
    localMarkdownChanged: true,
    commitPerformed: false,
    pushPerformed: false,
    buildPerformed: false,
    deployPerformed: false,
  };
}

// ── 顯示（human / json）────────────────────────────────────────────────────────────────
export function formatResult(result, { json = false } = {}) {
  if (json) return JSON.stringify(result, null, 2);

  if (!result.ok) {
    const lines = [`✗ redraft apply refused / failed：${result.error}`];
    if (result.stage) lines.push(`  stage : ${result.stage}`);
    if (result.reason) lines.push(`  reason: ${result.reason}`);
    if (result.error === 'missing-apply-flag') {
      lines.push('  next  : 先執行 dry-run 檢視 diff →');
      lines.push('          npm run admin:plan-redraft -- --slug=<slug> --op=redraft|republish');
    }
    if (result.error === 'stale-source') {
      lines.push(`  expected (yours)      : ${result.expectedSourceSha}`);
      lines.push(`  regenerated (current) : ${result.regeneratedSourceSha256}`);
    }
    return lines.join('\n');
  }

  const p = result.finalPreview;
  const lines = [];
  lines.push('✓ local Markdown status/draft written (atomic; single file)');
  lines.push(`  op            : ${p.op}`);
  lines.push(`  slug          : ${p.slug}`);
  lines.push(`  title         : ${p.title ?? '—'}`);
  lines.push(`  source path   : ${p.sourcePath}`);
  lines.push(`  status        : "${p.current.status}"  →  "${p.proposed.status}"`);
  lines.push(`  draft         : ${p.current.draft}  →  ${p.proposed.draft}`);
  lines.push(`  source sha256 : ${p.sourceSha256}`);
  lines.push(`  target sha256 : ${p.targetSha256}`);
  lines.push('  ── what happened ──');
  lines.push('  local Markdown changed : yes (status + draft only)');
  lines.push('  commit performed       : no');
  lines.push('  push performed         : no');
  lines.push('  build performed        : no');
  lines.push('  deploy performed       : no');
  lines.push('  ── next steps (Dean decides; nothing automatic) ──');
  lines.push(`  1. git diff -- ${p.sourcePath}`);
  lines.push('  2. npm run validate:content');
  lines.push('  3. npm run check:redraft-plan   (or check:github-redraft-lifecycle)');
  lines.push('  4. Dean decides whether to commit');
  lines.push('  5. Dean decides whether to push');
  lines.push('  6. Dean decides whether to build / deploy (URL only 404s after build+deploy)');
  return lines.join('\n');
}

// ── error → exit code（success=0；所有失敗非 0）────────────────────────────────────────
export function exitCodeForError(error) {
  switch (error) {
    case 'forbidden-flag':
    case 'unknown-arg':
    case 'op-missing':
    case 'op-invalid':
    case 'slug-missing':
      return 2;
    case 'missing-apply-flag':
      return 3;
    case 'env-gate-missing':
    case 'env-gate-mismatch':
      return 4;
    case 'confirm-missing':
    case 'confirm-mismatch':
      return 5;
    case 'expected-sha-missing':
    case 'expected-sha-format-invalid':
      return 6;
    case 'stale-source':
      return 7;
    default:
      // resolve-* / plan-* → 8；engine-* → 9。
      if (typeof error === 'string' && error.startsWith('engine-')) return 9;
      if (typeof error === 'string' && (error.startsWith('resolve-') || error.startsWith('plan-'))) return 8;
      return 1;
  }
}

// ── CLI adapter（回 { exit, stdout, stderrLines, result }；不直接 process.exit，利於測試）─────
export async function runCli({ argv, projectRoot, env } = {}) {
  const stderrLines = [];
  const log = (line) => stderrLines.push(`[redraft-apply] ${line}`);
  const parsedJsonPeek = parseArgv(argv);
  const json = parsedJsonPeek.ok ? parsedJsonPeek.json === true : false;

  const result = await runApply({ argv, projectRoot, env });
  if (result.ok) {
    log(`applied: ${result.op} ${result.sourcePath}`);
  } else {
    log(`refused/failed: ${result.error} (${result.stage ?? '—'})`);
  }
  const exit = result.ok ? 0 : exitCodeForError(result.error);
  return { exit, stdout: formatResult(result, { json }), result, stderrLines };
}

function isMainModule() {
  if (!process.argv[1]) return false;
  const argvUrl = new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;
  return import.meta.url === argvUrl;
}

if (isMainModule()) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
  runCli({ argv: process.argv.slice(2), projectRoot: PROJECT_ROOT, env: process.env }).then(
    ({ exit, stdout, stderrLines }) => {
      for (const line of stderrLines) process.stderr.write(line + '\n');
      process.stdout.write(stdout + '\n');
      process.exit(exit);
    },
    (err) => {
      process.stderr.write(`[redraft-apply] crashed: ${err && err.stack ? err.stack : err}\n`);
      process.exit(1);
    },
  );
}
