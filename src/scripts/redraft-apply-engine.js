#!/usr/bin/env node
// Phase 20260714-C.1a：dormant atomic lifecycle apply engine（fixture-only；未接任何 production CLI）。
//
// 背景 / 上位契約：
//   docs/20260714-admin-github-redraft-write-path-preflight.md §14 之 **Phase C**（local apply,
//   no Git automation）。Phase A（admin-article-lookup.js，唯讀 resolver）、Phase B（redraft-plan.js，
//   dry-run patch planner）、Phase C0（admin-git-safety-preflight.js，唯讀 repository safety）皆已落地。
//   本檔是 Phase C 的 **atomic write 本體**，但**刻意維持 dormant**：
//     - **無** production CLI 進入點、**無** `admin:apply-redraft` npm script、**未**被任何 production
//       CLI / Admin UI / existing write CLI import；`isMainModule` 只印 dormant 提示、**不** apply。
//     - 唯一實際 filesystem write 只發生在 contract guard（check-redraft-apply-engine.js）之
//       **OS temp isolated git fixtures**；**絕不**對 production Markdown 執行。
//   啟用為正式 CLI（Phase C.1b）須另開 phase + Dean explicit approval。**通過所有安全門 ≠ 已授權寫入。**
//
// 硬邊界（違反即設計錯誤）：
//   - 只重用既有成熟 module：Phase A `resolveArticleBySlug` / `ALLOWED_CONTENT_ROOTS`、
//     Phase B `applyLifecyclePatch`、Phase C0 `evaluatePreflight`。**不** import safe-write /
//     admin-write-cli / admin-frontmatter-patcher / admin-write-whitelist（避免動到既有 real-write
//     whitelist 語意）；**不** import child_process；**不** spawn git；**不** fetch / pull / push /
//     commit / build / deploy / 碰 gh-pages；**不** Blogger / Google / GA4 / AdSense API。
//   - 只改**單一**目標 Markdown 之 frontmatter `status` + `draft` 兩行（委派 Phase B byte-preserving
//     patch）；**不**動 sidecar（`.publish.json` / `.fb.md`）、**不**動任何其他檔、**不**動 body、
//     **不**動 slug / 其他 frontmatter。
//   - **不**信任呼叫端傳入的 `eligible` / target bytes / 任意檔案路徑；目標檔一律由 Phase A resolver
//     依 plan.slug / plan.contentRoot **重新唯一解析**；safety preflight 由 engine **自行**重跑。
//   - `validateAfterWrite`（post-write validation callback）為**必要條件**；缺少即在寫入前 hard-fail。
//   - validation 失敗 → 以原始 source bytes 執行 atomic rollback；rollback 亦失敗 → high-severity
//     hard failure（needsManualInspection），**絕不**宣稱成功。

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { resolveArticleBySlug, ALLOWED_CONTENT_ROOTS } from './admin-article-lookup.js';
import { applyLifecyclePatch } from './redraft-plan.js';
import { evaluatePreflight } from './admin-git-safety-preflight.js';

// ── 生命週期轉換（與 Phase B OPS 對齊；唯二合法 op / 固定 target；不接受任意 target status）──────
const TRANSITIONS = Object.freeze({
  redraft: {
    precondition: (status, draft) => (status === 'ready' || status === 'published') && draft === false,
    target: { status: 'draft', draft: true },
  },
  republish: {
    precondition: (status, draft) => status === 'draft' && draft === true,
    target: { status: 'ready', draft: false },
  },
});

const SHA256_HEX_RE = /^[0-9a-f]{64}$/;
const VALID_SITES = new Set(ALLOWED_CONTENT_ROOTS.map((r) => r.site));

// 唯一 temp 檔名序號（module-level；配合 process.pid + EEXIST retry 保證同目錄不衝突）。
let tmpCounter = 0;

function sha256Hex(str) {
  return createHash('sha256').update(Buffer.from(str, 'utf-8')).digest('hex');
}

// posix repo-relative sourcePath → 絕對路徑（engine 內部唯一路徑組裝點）。
function sourcePathToAbs(projectRoot, sourcePath) {
  return path.join(projectRoot, ...sourcePath.split('/'));
}

// 驗證 sourcePath 落在 allowlisted content root（防禦 malicious plan；非路徑組裝來源）。
// 回 { ok:true, site } 或 { ok:false, reason }。
function classifyAllowlistedSourcePath(sourcePath) {
  if (typeof sourcePath !== 'string' || sourcePath === '') return { ok: false, reason: 'source-path-empty' };
  if (sourcePath.includes('\0')) return { ok: false, reason: 'source-path-null-byte' };
  if (sourcePath.includes('\\')) return { ok: false, reason: 'source-path-backslash' };
  if (sourcePath.includes('..')) return { ok: false, reason: 'source-path-traversal' };
  if (sourcePath.startsWith('/')) return { ok: false, reason: 'source-path-absolute' };
  if (path.isAbsolute(sourcePath)) return { ok: false, reason: 'source-path-absolute' };
  if (sourcePath.endsWith('.fb.md')) return { ok: false, reason: 'source-path-sidecar' };
  if (!sourcePath.endsWith('.md')) return { ok: false, reason: 'source-path-not-md' };
  for (const root of ALLOWED_CONTENT_ROOTS) {
    const prefix = `${root.rel}/`;
    if (sourcePath.startsWith(prefix) && sourcePath.length > prefix.length) {
      return { ok: true, site: root.site };
    }
  }
  return { ok: false, reason: 'source-path-not-in-allowlisted-content-root' };
}

// ── §5.1 Plan schema 驗證（不接受自行拼裝的不完整 plan）───────────────────────────────
// 回 { ok:true } 或 { ok:false, error, reason }。
function validatePlanSchema(plan) {
  if (plan === null || typeof plan !== 'object' || Array.isArray(plan)) {
    return { ok: false, error: 'plan-not-object', reason: 'plan 必須為物件' };
  }
  // dry-run 契約（Phase B 真實 schema：dryRun:true / apply:false / written:false）。
  if (plan.dryRun !== true) return { ok: false, error: 'plan-not-dry-run', reason: 'plan.dryRun 必須為 true' };
  if (plan.apply !== false) return { ok: false, error: 'plan-apply-not-false', reason: 'plan.apply 必須為 false' };
  if (plan.written !== false) return { ok: false, error: 'plan-already-written', reason: 'plan.written 必須為 false' };

  // op ∈ {redraft, republish}
  if (plan.op !== 'redraft' && plan.op !== 'republish') {
    return { ok: false, error: 'plan-invalid-op', reason: 'plan.op 必須為 redraft | republish' };
  }
  const tr = TRANSITIONS[plan.op];

  // slug（Phase A resolver 會再嚴格驗證；此處僅型別）
  if (typeof plan.slug !== 'string' || plan.slug === '') {
    return { ok: false, error: 'plan-slug-invalid', reason: 'plan.slug 必須為非空字串' };
  }

  // contentRoot（= 重新解析用 site）
  if (!VALID_SITES.has(plan.contentRoot)) {
    return { ok: false, error: 'plan-content-root-invalid', reason: `plan.contentRoot 必須為 ${[...VALID_SITES].join(' | ')}` };
  }

  // sourcePath 落在 allowlisted content root（防 malicious plan；非任意檔案路徑）
  const sp = classifyAllowlistedSourcePath(plan.sourcePath);
  if (!sp.ok) return { ok: false, error: 'plan-source-path-not-allowlisted', reason: sp.reason, sourcePath: plan.sourcePath };
  if (sp.site !== plan.contentRoot) {
    return { ok: false, error: 'plan-source-path-site-mismatch', reason: `sourcePath 所在 site (${sp.site}) 與 plan.contentRoot (${plan.contentRoot}) 不一致` };
  }

  // current / target shape
  const cur = plan.current;
  const tgt = plan.target;
  if (!cur || typeof cur.status !== 'string' || typeof cur.draft !== 'boolean') {
    return { ok: false, error: 'plan-current-invalid', reason: 'plan.current 必須含 status(string)+draft(boolean)' };
  }
  if (!tgt || typeof tgt.status !== 'string' || typeof tgt.draft !== 'boolean') {
    return { ok: false, error: 'plan-target-invalid', reason: 'plan.target 必須含 status(string)+draft(boolean)' };
  }

  // op precondition 對 current；target 精確等於 op 的固定轉換（拒任意 target status）
  if (!tr.precondition(cur.status, cur.draft)) {
    return { ok: false, error: 'plan-transition-mismatch', reason: `plan.current (status:${cur.status} draft:${cur.draft}) 不符 ${plan.op} 前置條件` };
  }
  if (tgt.status !== tr.target.status || tgt.draft !== tr.target.draft) {
    return { ok: false, error: 'plan-transition-mismatch', reason: `plan.target 必須為 status:${tr.target.status} draft:${tr.target.draft}（${plan.op} 固定轉換）` };
  }
  // status/draft 成對一致（visible⇔draft:false；hidden⇔draft:true）
  const targetVisible = tgt.status === 'ready' || tgt.status === 'published';
  if (targetVisible === tgt.draft) {
    return { ok: false, error: 'plan-target-contradiction', reason: 'plan.target 之 status 與 draft 不一致（成對不變式違反）' };
  }

  // changes 精確等於 status + draft 兩欄位（changedFields 精確 = status, draft）
  if (!Array.isArray(plan.changes) || plan.changes.length !== 2) {
    return { ok: false, error: 'plan-changed-fields-invalid', reason: 'plan.changes 必須恰為 status + draft 兩筆' };
  }
  const fields = plan.changes.map((c) => (c && typeof c.field === 'string' ? c.field : null)).sort();
  if (fields[0] !== 'draft' || fields[1] !== 'status') {
    return { ok: false, error: 'plan-changed-fields-invalid', reason: 'plan.changes 欄位必須精確為 {status, draft}' };
  }

  // source / target SHA-256 合法（64 hex）
  if (typeof plan.sourceSha256 !== 'string' || !SHA256_HEX_RE.test(plan.sourceSha256)) {
    return { ok: false, error: 'plan-source-sha-invalid', reason: 'plan.sourceSha256 必須為 64 位 hex' };
  }
  if (typeof plan.targetSha256 !== 'string' || !SHA256_HEX_RE.test(plan.targetSha256)) {
    return { ok: false, error: 'plan-target-sha-invalid', reason: 'plan.targetSha256 必須為 64 位 hex' };
  }
  if (plan.sourceSha256 === plan.targetSha256) {
    return { ok: false, error: 'plan-no-op', reason: 'sourceSha256 == targetSha256（no-op 非 lifecycle transition）' };
  }

  return { ok: true };
}

// ── §6/§7 same-directory atomic replace（exclusive create + fsync + mode 保留）────────────
// 只在所有安全門通過後呼叫。成功 = temp 已 rename over 目標、無 residue；失敗 = 清 temp、拋錯。
async function atomicReplace(absPath, contentStr, mode) {
  const dir = path.dirname(absPath);
  const base = path.basename(absPath);
  const bytes = Buffer.from(contentStr, 'utf-8');

  let handle = null;
  let tmpPath = null;
  // exclusive create 於相同目錄；EEXIST 時換名重試（temp 不與既有檔衝突、不覆蓋既有 temp）。
  for (let attempt = 0; attempt < 64 && handle === null; attempt += 1) {
    tmpCounter += 1;
    const candidate = path.join(dir, `.${base}.redraft-apply.tmp-${process.pid}-${tmpCounter}-${attempt}`);
    try {
      handle = await fs.open(candidate, 'wx', mode); // 'wx' = O_CREAT|O_EXCL（不覆蓋既有 temp）
      tmpPath = candidate;
    } catch (err) {
      if (err && err.code === 'EEXIST') { handle = null; continue; }
      throw err;
    }
  }
  if (handle === null) {
    const e = new Error('could-not-create-unique-temp'); e.code = 'ENOTMP'; throw e;
  }

  try {
    await handle.write(bytes, 0, bytes.length, 0);
    await handle.sync(); // file flush / fsync（支援平台）
    await handle.close();
    handle = null;
    // 明確保留原始 mode（open 之 mode 受 umask 影響；chmod 精確還原）。
    await fs.chmod(tmpPath, mode);
    await fs.rename(tmpPath, absPath); // same-dir replace（POSIX atomic；Windows MoveFileEx REPLACE_EXISTING）
    tmpPath = null;
  } finally {
    if (handle !== null) { try { await handle.close(); } catch { /* ignore */ } }
    if (tmpPath !== null) { try { await fs.unlink(tmpPath); } catch { /* ignore */ } }
  }
}

// ── 核心：dormant atomic lifecycle apply engine ──────────────────────────────────────────
// applyLifecycleAtomic({ projectRoot, plan, validateAfterWrite })
//   - projectRoot：非空絕對路徑（= git repository top-level）
//   - plan：Phase B（redraft-plan.js）產出之 dry-run plan（真實 schema）
//   - validateAfterWrite：必要 callback，({ projectRoot, sourcePath, plan }) → { ok:boolean, ... }
//     （async 亦可）；重讀檔並回傳 success/failure；engine 絕不由此 commit/push/build/deploy。
// 回固定 shape 的 report（見各 return）。所有安全門任一失敗 → 寫入前 hard-fail（applied:false）。
export async function applyLifecycleAtomic({ projectRoot, plan, validateAfterWrite } = {}) {
  const fail = (stage, error, extra = {}) => ({ ok: false, applied: false, stage, error, ...extra });

  // 0. 基本參數
  if (typeof projectRoot !== 'string' || projectRoot === '' || !path.isAbsolute(projectRoot)) {
    return fail('params', 'invalid-project-root', { reason: 'projectRoot 必須為非空絕對路徑' });
  }

  // §7/§4.1：validation callback 為必要條件；缺失 → 寫入前 hard-fail（絕不寫入）。
  if (typeof validateAfterWrite !== 'function') {
    return fail('validation-callback', 'validation-callback-required', {
      reason: 'validateAfterWrite 為必要條件；缺少 post-write validation callback 時拒絕寫入',
    });
  }

  // §5.1：plan schema
  const schema = validatePlanSchema(plan);
  if (!schema.ok) return fail('plan-validation', schema.error, { reason: schema.reason, sourcePath: schema.sourcePath });

  // §5.2：repository safety preflight（engine 自行重跑；不信任呼叫端 eligible）
  const pre = evaluatePreflight({ projectRoot });
  const safetyOk =
    pre.eligible === true &&
    pre.branch === 'main' &&
    pre.ahead === 0 &&
    pre.behind === 0 &&
    pre.workingTreeClean === true &&
    pre.indexLockPresent === false;
  if (!safetyOk) {
    return fail('preflight', 'repository-not-eligible', {
      reason: 'repository safety preflight 未通過；拒絕寫入（不 fetch/pull/push/checkout/reset/stash/clean/delete-lock/自動修復）',
      preflight: {
        eligible: pre.eligible,
        branch: pre.branch,
        ahead: pre.ahead,
        behind: pre.behind,
        workingTreeClean: pre.workingTreeClean,
        indexLockPresent: pre.indexLockPresent,
        failures: pre.failures.map((f) => f.code),
      },
    });
  }

  // §5.3：以 plan.slug / plan.contentRoot 重新唯一解析（不接受呼叫端任意檔案路徑）
  const resolved = await resolveArticleBySlug({ slug: plan.slug, site: plan.contentRoot, projectRoot });
  if (!resolved.ok) {
    return fail('re-resolution', 're-resolve-failed', { reason: resolved.error, detail: resolved.reason });
  }
  const article = resolved.article;
  if (article.sourcePath !== plan.sourcePath) {
    return fail('re-resolution', 'source-path-mismatch', {
      reason: `重新解析之 sourcePath (${article.sourcePath}) 與 plan.sourcePath (${plan.sourcePath}) 不一致`,
    });
  }
  if (article.slug !== plan.slug) {
    return fail('re-resolution', 'slug-mismatch', { reason: `重新解析之 slug (${article.slug}) 與 plan.slug 不一致` });
  }
  if (article.contentRoot !== plan.contentRoot) {
    return fail('re-resolution', 'site-mismatch', { reason: `重新解析之 site (${article.contentRoot}) 與 plan.contentRoot 不一致` });
  }
  // allowlisted content root（再次確認；resolver 本已限定，但 defense-in-depth）
  const spCheck = classifyAllowlistedSourcePath(article.sourcePath);
  if (!spCheck.ok) return fail('re-resolution', 'resolved-path-not-allowlisted', { reason: spCheck.reason });

  const absPath = sourcePathToAbs(projectRoot, article.sourcePath);

  // §5.4：重讀當下 source bytes + SHA-256（TOCTOU）
  let raw;
  let originalMode;
  try {
    raw = await fs.readFile(absPath, 'utf-8');
    const st = await fs.stat(absPath);
    originalMode = st.mode & 0o777;
  } catch (err) {
    return fail('read', 'read-failed', { reason: err.message });
  }
  const actualSourceSha256 = sha256Hex(raw);
  if (actualSourceSha256 !== plan.sourceSha256) {
    return fail('source-sha', 'stale-source', {
      reason: '當下 source SHA-256 與 plan.sourceSha256 不一致（檔案已變動）；拒絕寫入，不自動重產 plan、不覆蓋最新檔案',
      actualSourceSha256,
      expectedSourceSha256: plan.sourceSha256,
    });
  }

  // §5.5：lifecycle precondition（重新解析 status/draft，必須等於 plan.current + 符合 op 轉換）
  if (article.status !== plan.current.status || article.draft !== plan.current.draft) {
    return fail('lifecycle-precondition', 'lifecycle-precondition-mismatch', {
      reason: `當下 status:${article.status} draft:${article.draft} 與 plan.current 不一致`,
    });
  }
  const tr = TRANSITIONS[plan.op];
  if (!tr.precondition(article.status, article.draft)) {
    return fail('lifecycle-precondition', 'lifecycle-precondition-not-met', {
      reason: `當下狀態不符 ${plan.op} 前置條件（可能已改變 / archived / 矛盾 / no-op）`,
    });
  }

  // §5.6：target recomputation（不信任 plan target bytes；重算 candidate 並核 SHA）
  const patch = applyLifecyclePatch(raw, {
    currentStatus: article.status,
    currentDraft: article.draft,
    targetStatus: tr.target.status,
    targetDraft: tr.target.draft,
  });
  if (!patch.ok) {
    return fail('target-recompute', 'patch-failed', { reason: patch.error, detail: patch.detail });
  }
  const candidate = patch.output;
  const recomputedTargetSha256 = sha256Hex(candidate);
  if (recomputedTargetSha256 !== plan.targetSha256) {
    return fail('target-recompute', 'target-sha-mismatch', {
      reason: '重算 candidate 之 SHA-256 與 plan.targetSha256 不一致；拒絕寫入',
      recomputedTargetSha256,
      expectedTargetSha256: plan.targetSha256,
    });
  }
  // body / 非白名單欄位不變之額外保證：candidate 與 raw 僅差 frontmatter status+draft 兩行。
  // （applyLifecyclePatch 已 byte-preserving；此處防禦性斷言「恰 2 行 differ」。）
  const rawLines = raw.split('\n');
  const candLines = candidate.split('\n');
  if (rawLines.length !== candLines.length) {
    return fail('target-recompute', 'line-count-changed', { reason: 'candidate 行數與原檔不同（byte-preserving 契約違反）' });
  }
  let diffLines = 0;
  for (let i = 0; i < rawLines.length; i += 1) if (rawLines[i] !== candLines[i]) diffLines += 1;
  if (diffLines !== 2) {
    return fail('target-recompute', 'unexpected-diff-scope', { reason: `candidate 與原檔差異行數為 ${diffLines}（應恰 2：status + draft）` });
  }

  // ── §6：原子寫入（僅在所有安全門通過後）─────────────────────────────────────────────
  try {
    await atomicReplace(absPath, candidate, originalMode);
  } catch (err) {
    return fail('write', 'write-failed', { reason: err.message, code: err.code });
  }

  // §6.8：成功後重新讀取並驗證 target SHA。
  let afterRaw;
  try {
    afterRaw = await fs.readFile(absPath, 'utf-8');
  } catch (err) {
    // 寫入後讀不到 → 高嚴重度；嘗試 rollback。
    return await rollback(absPath, raw, plan, originalMode, {
      stage: 'post-write-verify',
      error: 'post-write-read-failed',
      reason: err.message,
    });
  }
  const afterSha256 = sha256Hex(afterRaw);
  if (afterSha256 !== plan.targetSha256) {
    return await rollback(absPath, raw, plan, originalMode, {
      stage: 'post-write-verify',
      error: 'post-write-sha-mismatch',
      reason: `寫入後檔案 SHA-256 (${afterSha256}) 與 plan.targetSha256 不一致`,
    });
  }

  // ── §7：post-write validation callback（必要）→ 失敗即 rollback ──────────────────────
  let validationResult;
  try {
    validationResult = await validateAfterWrite({ projectRoot, sourcePath: article.sourcePath, plan });
  } catch (err) {
    return await rollback(absPath, raw, plan, originalMode, {
      stage: 'post-write-validation',
      error: 'validation-callback-threw',
      reason: err.message,
    });
  }
  if (!validationResult || validationResult.ok !== true) {
    return await rollback(absPath, raw, plan, originalMode, {
      stage: 'post-write-validation',
      error: 'post-write-validation-failed',
      reason: 'validateAfterWrite 回報失敗',
      validation: validationResult ?? null,
    });
  }

  // ── 成功 ─────────────────────────────────────────────────────────────────────────────
  return {
    ok: true,
    applied: true,
    op: plan.op,
    slug: article.slug,
    sourcePath: article.sourcePath,
    sourceSha256: plan.sourceSha256,
    targetSha256: plan.targetSha256,
    validated: true,
    rolledBack: false,
  };
}

// ── §7：以原始 source bytes 執行 atomic rollback ─────────────────────────────────────────
// 回失敗 report（含 rollback 結果）。rollback 亦失敗 → needsManualInspection、絕不宣稱成功。
async function rollback(absPath, originalRaw, plan, originalMode, failInfo) {
  const base = {
    ok: false,
    applied: false, // lifecycle transition 未成立（已還原或需人工）
    stage: failInfo.stage,
    error: failInfo.error,
    reason: failInfo.reason,
  };
  if (Object.prototype.hasOwnProperty.call(failInfo, 'validation')) base.validation = failInfo.validation;

  try {
    await atomicReplace(absPath, originalRaw, originalMode);
  } catch (err) {
    return {
      ...base,
      severity: 'high',
      rolledBack: false,
      rollbackOk: false,
      needsManualInspection: true,
      rollbackError: err.message,
      manualInspectionNote:
        'apply 失敗且 rollback 亦失敗；目標檔可能處於半套狀態，需人工檢查並手動還原。engine 不宣稱成功。',
    };
  }

  // rollback 後重新驗證 source SHA 恢復。
  let restoredSha256 = null;
  try {
    const restored = await fs.readFile(absPath, 'utf-8');
    restoredSha256 = sha256Hex(restored);
  } catch (err) {
    return {
      ...base,
      severity: 'high',
      rolledBack: true,
      rollbackOk: false,
      needsManualInspection: true,
      rollbackError: `rollback 後無法重讀驗證：${err.message}`,
      manualInspectionNote: 'rollback 已寫回但無法重讀驗證；需人工檢查。',
    };
  }
  if (restoredSha256 !== plan.sourceSha256) {
    return {
      ...base,
      severity: 'high',
      rolledBack: true,
      rollbackOk: false,
      needsManualInspection: true,
      restoredSha256,
      manualInspectionNote: 'rollback 後 source SHA 未恢復；需人工檢查。engine 不宣稱成功。',
    };
  }

  return {
    ...base,
    rolledBack: true,
    rollbackOk: true,
    needsManualInspection: false,
    restoredSha256,
    note: 'apply failed + rollback succeeded：原始 source bytes 已還原、SHA 恢復、無半套 lifecycle state。',
  };
}

// ── dormant：無 CLI apply 進入點 ─────────────────────────────────────────────────────────
function isMainModule() {
  if (!process.argv[1]) return false;
  const argvUrl = new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;
  return import.meta.url === argvUrl;
}

if (isMainModule()) {
  process.stderr.write(
    '[redraft-apply-engine] dormant library module — no CLI apply entry point.\n' +
      '  This engine performs atomic lifecycle writes only when imported by its contract guard\n' +
      '  (check-redraft-apply-engine.js) against isolated temp fixtures. It is NOT wired to any\n' +
      '  production CLI, npm script, or Admin UI. Phase C.1b activation requires a separate phase\n' +
      '  and Dean explicit approval. Passing every safety gate is NOT authorization to write.\n',
  );
  process.exit(0);
}
