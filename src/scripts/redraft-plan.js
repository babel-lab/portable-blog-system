#!/usr/bin/env node
// Phase 20260714-B：GitHub 文章 lifecycle「退回草稿 / 重新上架」dry-run-only patch planner。
//
// 背景 / 上位契約：
//   docs/20260714-admin-github-redraft-write-path-preflight.md §14 之 **Phase B**（dry-run patch
//   generation）。Phase A（admin-article-lookup.js）已提供 slug→唯一文章唯讀解析；本檔在其之上
//   產生「若要 redraft / republish，status 與 boolean draft 兩欄位該如何改」的 **dry-run 計畫**：
//   deterministic human diff + JSON plan + source/target SHA-256。**絕不寫檔**，apply（Phase C）/
//   commit-push（Phase D）/ deploy（Phase E）皆未實作、皆 Dean-gated。
//
// 生命週期轉換（preflight §5）：
//   redraft   ：status ∈ {ready, published} + draft:false  →  status:draft + draft:true
//   republish ：status:draft + draft:true                  →  status:ready + draft:false
//   兩欄位 **必須成對** 且一致；只改一半不被允許（planner 原子產生兩欄位變更）。
//
// 邊界（zero-write；違反即設計錯誤）：
//   - 只在**記憶體**中計算新內容；**不**寫 Markdown、**不**改 mtime、**不**動 sidecar、**不** build /
//     deploy / commit / push / 碰 gh-pages、**不** Blogger / Google / GA4 / AdSense API。
//   - 只 import 讀取 API：admin-article-lookup（唯讀 resolver）、node:fs/promises readFile、
//     node:crypto（hash）、gray-matter / fast-glob（間接經 resolver）。**不** import safe-write /
//     admin-write-cli / admin-frontmatter-patcher，**不**呼叫任何寫入 API。
//   - **不**接受 `--apply` / `--write` / `--commit` / `--push` / `--deploy` / `--save` / `--output`
//     （明確拒絕，非忽略）。
//   - **不**修改既有 dormant real-write whitelist（admin-frontmatter-patcher.js 之 ALLOWED_TOP_LEVEL_KEYS
//     維持 {description, searchDescription}；admin-write-cli 之 ALLOWED_FIELDS 不含 status/draft）。
//     本檔自帶獨立 byte-preserving line patcher，**不**經由既有 write 路徑。
//
// 執行：
//   node src/scripts/redraft-plan.js --slug=<slug> --op=redraft|republish [--site=github|blogger] [--json]
//   （npm：`npm run admin:plan-redraft -- --slug=<slug> --op=redraft`）

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveArticleBySlug } from './admin-article-lookup.js';

// 生命週期轉換定義（唯二 op）。
const OPS = {
  redraft: {
    label: 'redraft (退回草稿 / 暫時下架)',
    precondition: (status, draft) => (status === 'ready' || status === 'published') && draft === false,
    preconditionText: 'status ∈ {ready, published} 且 draft:false',
    target: { status: 'draft', draft: true },
    effectNote:
      'redraft 只影響本機 build / 未來 deploy；重新 build+deploy 後該 GitHub URL 才會 404。線上 Blogger 貼文不受影響。',
  },
  republish: {
    label: 'republish (重新上架)',
    precondition: (status, draft) => status === 'draft' && draft === true,
    preconditionText: 'status:draft 且 draft:true',
    target: { status: 'ready', draft: false },
    effectNote:
      'republish 沿用原 slug；重新 build+deploy 後恢復相同 posts/<slug>/index.html 與公開 URL。',
  },
};

// ── byte-preserving frontmatter line 工具（自帶；不經既有 write 路徑）─────────────────
// 找出 frontmatter 區塊範圍（沿用 admin-frontmatter-patcher 的判斷邏輯，但為獨立實作）。
function findFrontmatterRange(raw) {
  const openMatch = raw.match(/^---(\r?\n)/);
  if (!openMatch) return { ok: false, error: 'no-opening-frontmatter-delimiter' };
  const fmStart = openMatch[0].length;
  let pos = fmStart;
  while (pos < raw.length) {
    const nextLF = raw.indexOf('\n', pos);
    const lineEnd = nextLF < 0 ? raw.length : nextLF;
    const rawLine = raw.slice(pos, lineEnd);
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (line === '---') return { ok: true, fmStart, fmContentEnd: pos };
    if (nextLF < 0) break;
    pos = nextLF + 1;
  }
  return { ok: false, error: 'no-closing-frontmatter-delimiter' };
}

// 收集 frontmatter 內各行（絕對 offset；end 不含行終止符 \r/\n，以保留 byte）。
function frontmatterLines(raw, fmStart, fmContentEnd) {
  const lines = [];
  let pos = fmStart;
  let lineNo = raw.slice(0, fmStart).split('\n').length; // 1-based：fmStart 所在行號
  while (pos < fmContentEnd) {
    const nextLF = raw.indexOf('\n', pos);
    const hardEnd = nextLF < 0 || nextLF > fmContentEnd ? fmContentEnd : nextLF;
    let end = hardEnd;
    if (end > pos && raw[end - 1] === '\r') end -= 1;
    lines.push({ start: pos, end, text: raw.slice(pos, end), lineNumber: lineNo });
    lineNo += 1;
    if (nextLF < 0 || nextLF >= fmContentEnd) break;
    pos = nextLF + 1;
  }
  return lines;
}

// 找出唯一 top-level `key:` 行（無縮排、恰一次）。回 { ok, line } 或 { ok:false, error }。
function findUniqueTopLevelLine(lines, key) {
  const prefix = `${key}:`;
  const hits = lines.filter((l) => {
    if (!l.text.startsWith(prefix)) return false;
    const next = l.text.charAt(prefix.length);
    return next === '' || next === ' ' || next === '\t';
  });
  if (hits.length === 0) return { ok: false, error: `${key}-line-not-found` };
  if (hits.length > 1) return { ok: false, error: `${key}-line-duplicated` };
  return { ok: true, line: hits[0] };
}

// 解析 status scalar：支援 double / single / plain；保留 leading/trailing 空白。
function decodeStatusScalar(rest) {
  // block scalar（| / >）與 YAML 特殊 leading 字元 → fail-closed（不安全 patch）。
  const trimmed = rest.replace(/^[ \t]+/, '');
  if (trimmed.startsWith('|') || trimmed.startsWith('>')) return { ok: false, error: 'status-scalar-unsupported' };
  if (/^[-?:[\]{},&*!%@`]/.test(trimmed)) return { ok: false, error: 'status-scalar-unsupported' };
  let m;
  if ((m = rest.match(/^([ \t]*)"([^"\\]*)"([ \t]*)$/))) {
    return { ok: true, style: 'double', leadingWs: m[1], value: m[2], trailingWs: m[3] };
  }
  if ((m = rest.match(/^([ \t]*)'([^']*)'([ \t]*)$/))) {
    return { ok: true, style: 'single', leadingWs: m[1], value: m[2], trailingWs: m[3] };
  }
  if ((m = rest.match(/^([ \t]*)([^\s"'#][^\s#]*)([ \t]*)$/))) {
    return { ok: true, style: 'plain', leadingWs: m[1], value: m[2], trailingWs: m[3] };
  }
  return { ok: false, error: 'status-scalar-unsupported' };
}

function encodeStatusScalar(style, leadingWs, trailingWs, newValue) {
  if (style === 'double') return `${leadingWs}"${newValue}"${trailingWs}`;
  if (style === 'single') return `${leadingWs}'${newValue}'${trailingWs}`;
  return `${leadingWs}${newValue}${trailingWs}`; // plain（status 列舉值皆 plain-safe）
}

// 解析 draft boolean literal（僅小寫 true/false；其餘 fail-closed）。
function decodeDraftBool(rest) {
  const m = rest.match(/^([ \t]*)(true|false)([ \t]*)$/);
  if (!m) return { ok: false, error: 'draft-not-boolean-literal' };
  return { ok: true, leadingWs: m[1], value: m[2] === 'true', trailingWs: m[3] };
}

function encodeDraftBool(leadingWs, trailingWs, boolVal) {
  return `${leadingWs}${boolVal ? 'true' : 'false'}${trailingWs}`;
}

// 對 raw 套用 status+draft 兩欄位成對、byte-preserving 變更（記憶體中；不寫檔）。
// spec：{ currentStatus, currentDraft, targetStatus, targetDraft }
// 回 { ok:true, output, changes:[{field,old,new,lineNumber,oldLine,newLine}] } 或 { ok:false, error }。
export function applyLifecyclePatch(raw, spec) {
  if (typeof raw !== 'string') return { ok: false, error: 'raw-must-be-string' };
  const { currentStatus, currentDraft, targetStatus, targetDraft } = spec;

  // 成對不變式：兩欄位都必須真的改變（redraft / republish 恆滿足）。
  if (typeof targetStatus !== 'string' || typeof targetDraft !== 'boolean') {
    return { ok: false, error: 'target-shape-invalid' };
  }
  if (targetStatus === currentStatus && targetDraft === currentDraft) {
    return { ok: false, error: 'no-op-not-a-lifecycle-transition' };
  }

  const fm = findFrontmatterRange(raw);
  if (!fm.ok) return { ok: false, error: fm.error };
  const lines = frontmatterLines(raw, fm.fmStart, fm.fmContentEnd);

  const statusLine = findUniqueTopLevelLine(lines, 'status');
  if (!statusLine.ok) return { ok: false, error: statusLine.error };
  const draftLine = findUniqueTopLevelLine(lines, 'draft');
  if (!draftLine.ok) return { ok: false, error: draftLine.error };

  // status
  const sRest = statusLine.line.text.slice('status:'.length);
  const sDec = decodeStatusScalar(sRest);
  if (!sDec.ok) return { ok: false, error: sDec.error };
  if (sDec.value !== currentStatus) {
    return { ok: false, error: 'status-precondition-mismatch', detail: { raw: sDec.value, expected: currentStatus } };
  }
  const newStatusLineText = 'status:' + encodeStatusScalar(sDec.style, sDec.leadingWs, sDec.trailingWs, targetStatus);

  // draft
  const dRest = draftLine.line.text.slice('draft:'.length);
  const dDec = decodeDraftBool(dRest);
  if (!dDec.ok) return { ok: false, error: dDec.error };
  if (dDec.value !== currentDraft) {
    return { ok: false, error: 'draft-precondition-mismatch', detail: { raw: dDec.value, expected: currentDraft } };
  }
  const newDraftLineText = 'draft:' + encodeDraftBool(dDec.leadingWs, dDec.trailingWs, targetDraft);

  // 依 offset 升序 splice 兩行（不重疊）。
  const edits = [
    { start: statusLine.line.start, end: statusLine.line.end, newText: newStatusLineText },
    { start: draftLine.line.start, end: draftLine.line.end, newText: newDraftLineText },
  ].sort((a, b) => a.start - b.start);

  let output = '';
  let cursor = 0;
  for (const e of edits) {
    output += raw.slice(cursor, e.start) + e.newText;
    cursor = e.end;
  }
  output += raw.slice(cursor);

  const changes = [
    {
      field: 'status',
      old: currentStatus,
      new: targetStatus,
      lineNumber: statusLine.line.lineNumber,
      oldLine: statusLine.line.text,
      newLine: newStatusLineText,
    },
    {
      field: 'draft',
      old: currentDraft,
      new: targetDraft,
      lineNumber: draftLine.line.lineNumber,
      oldLine: draftLine.line.text,
      newLine: newDraftLineText,
    },
  ];
  return { ok: true, output, changes };
}

function sha256Hex(str) {
  return createHash('sha256').update(Buffer.from(str, 'utf-8')).digest('hex');
}

// ── 核心 planner（dry-run；不寫檔）────────────────────────────────────────────────
// 回 { ok:true, plan:{...} } 或 { ok:false, error, ... }。
export async function planRedraft({ slug, op, site, projectRoot } = {}) {
  if (typeof projectRoot !== 'string' || projectRoot === '' || !path.isAbsolute(projectRoot)) {
    return { ok: false, error: 'invalid-project-root', reason: 'projectRoot 必須為非空絕對路徑' };
  }
  if (op !== 'redraft' && op !== 'republish') {
    return { ok: false, error: 'invalid-op', reason: 'op 須為 redraft | republish', op };
  }

  // 唯讀解析：唯一 slug → 文章（reuse Phase A；含 slug 驗證 / 唯一性 / 型別檢查）。
  const resolved = await resolveArticleBySlug({ slug, site, projectRoot });
  if (!resolved.ok) return resolved; // 直接透傳 Phase A 之結構化錯誤（invalid-slug / not-found / not-unique / ...）

  const a = resolved.article;
  const opDef = OPS[op];

  // 前置狀態檢查（op 是否適用於當前 lifecycle 狀態）。
  if (!opDef.precondition(a.status, a.draft)) {
    return {
      ok: false,
      error: 'precondition-not-met',
      reason: `${op} 需要 ${opDef.preconditionText}；當前 status:${a.status ?? '—'} draft:${a.draft === null ? '—' : a.draft}`,
      op,
      slug: a.slug,
      sourcePath: a.sourcePath,
      current: { status: a.status, draft: a.draft },
    };
  }

  // 讀取原始 bytes（唯讀），計算 source SHA-256，並在記憶體中套用 patch。
  const absPath = path.join(projectRoot, ...a.sourcePath.split('/'));
  let raw;
  try {
    raw = await readFile(absPath, 'utf-8');
  } catch (err) {
    return { ok: false, error: 'read-failed', reason: err.message, sourcePath: a.sourcePath };
  }

  const patch = applyLifecyclePatch(raw, {
    currentStatus: a.status,
    currentDraft: a.draft,
    targetStatus: opDef.target.status,
    targetDraft: opDef.target.draft,
  });
  if (!patch.ok) {
    return { ok: false, error: 'patch-failed', reason: patch.error, detail: patch.detail, sourcePath: a.sourcePath };
  }

  const plan = {
    op,
    slug: a.slug,
    sourcePath: a.sourcePath,
    contentRoot: a.contentRoot,
    current: { status: a.status, draft: a.draft },
    target: { status: opDef.target.status, draft: opDef.target.draft },
    changes: patch.changes,
    expectedOldValues: { status: a.status, draft: a.draft },
    sourceSha256: sha256Hex(raw),
    targetSha256: sha256Hex(patch.output),
    dryRun: true,
    apply: false,
    written: false,
    effectNote: opDef.effectNote,
  };
  return { ok: true, plan };
}

// ── 顯示（human diff / json）——不含 body、不含 secrets ────────────────────────────
export function formatPlan(result, { json = false } = {}) {
  if (json) return JSON.stringify(result, null, 2);
  if (!result.ok) {
    const lines = [`✗ plan 失敗：${result.error}`];
    if (result.reason) lines.push(`  reason: ${result.reason}`);
    if (Array.isArray(result.matches)) {
      lines.push('  命中多篇：');
      for (const m of result.matches) lines.push(`    - ${m.sourcePath} (contentRoot=${m.contentRoot})`);
    }
    return lines.join('\n');
  }
  const p = result.plan;
  const fmtStatus = (v) => `"${v}"`;
  const lines = [];
  lines.push(`✓ dry-run plan: ${p.op}   ${p.sourcePath}`);
  lines.push(`  status : ${fmtStatus(p.current.status)}  →  ${fmtStatus(p.target.status)}`);
  lines.push(`  draft  : ${p.current.draft}  →  ${p.target.draft}`);
  lines.push('  ── frontmatter diff (byte-level; only these 2 lines change) ──');
  for (const c of p.changes) {
    lines.push(`  - [L${c.lineNumber}] ${c.oldLine}`);
    lines.push(`  + [L${c.lineNumber}] ${c.newLine}`);
  }
  lines.push('  ── integrity ──');
  lines.push(`  source sha256 : ${p.sourceSha256}`);
  lines.push(`  target sha256 : ${p.targetSha256}`);
  lines.push('  ── boundary ──');
  lines.push('  dry-run only — NO file written; NO mtime / sidecar / build / deploy change.');
  lines.push(`  ${p.effectNote}`);
  lines.push('  apply (Phase C) is NOT implemented; --apply is rejected.');
  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────────
const REJECTED_WRITE_FLAGS = new Set([
  '--apply',
  '--write',
  '--commit',
  '--push',
  '--deploy',
  '--save',
  '--output',
]);

function parseArgv(argv) {
  let slug = null;
  let op = null;
  let site = undefined;
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (typeof raw !== 'string') continue;
    const bare = raw.includes('=') ? raw.slice(0, raw.indexOf('=')) : raw;
    if (REJECTED_WRITE_FLAGS.has(bare)) {
      return { ok: false, error: 'write-flag-not-supported', flag: bare };
    }
    if (raw === '--json') {
      json = true;
      continue;
    }
    if (raw.startsWith('--slug=')) { slug = raw.slice('--slug='.length); continue; }
    if (raw === '--slug') { slug = argv[i + 1]; i += 1; continue; }
    if (raw.startsWith('--op=')) { op = raw.slice('--op='.length); continue; }
    if (raw === '--op') { op = argv[i + 1]; i += 1; continue; }
    if (raw.startsWith('--site=')) { site = raw.slice('--site='.length); continue; }
    if (raw === '--site') { site = argv[i + 1]; i += 1; continue; }
    return { ok: false, error: 'unknown-arg', arg: raw };
  }
  return { ok: true, slug, op, site, json };
}

function exitCodeForError(error) {
  switch (error) {
    case 'invalid-project-root':
      return 1;
    case 'write-flag-not-supported':
    case 'unknown-arg':
    case 'slug-arg-missing':
    case 'op-arg-missing':
    case 'invalid-op':
    case 'invalid-site':
      return 2;
    case 'invalid-slug':
      return 3;
    case 'not-found':
      return 4;
    case 'not-unique':
      return 5;
    case 'frontmatter-parse-failed':
      return 6;
    case 'status-draft-type-invalid':
      return 7;
    case 'precondition-not-met':
      return 8;
    case 'patch-failed':
    case 'read-failed':
      return 9;
    default:
      return 1;
  }
}

export async function runCli({ argv, projectRoot } = {}) {
  const stderrLines = [];
  const log = (line) => stderrLines.push(`[redraft-plan] ${line}`);

  const parsed = parseArgv(Array.isArray(argv) ? argv : []);
  if (!parsed.ok) {
    const detail =
      parsed.error === 'write-flag-not-supported'
        ? `${parsed.flag} 不受支援：本工具僅產生 dry-run 計畫，無 write / apply / commit / push / deploy / save / output 路徑`
        : parsed.error === 'unknown-arg'
          ? `未知參數：${parsed.arg}`
          : parsed.error;
    log(`argv rejected: ${parsed.error}`);
    const result = { ok: false, error: parsed.error, reason: detail };
    return { exit: exitCodeForError(parsed.error), stdout: formatPlan(result, { json: false }), result, stderrLines };
  }

  const json = parsed.json === true;
  if (typeof parsed.slug !== 'string' || parsed.slug === '') {
    const result = { ok: false, error: 'slug-arg-missing', reason: '必須提供 --slug=<slug>' };
    return { exit: exitCodeForError('slug-arg-missing'), stdout: formatPlan(result, { json }), result, stderrLines };
  }
  if (typeof parsed.op !== 'string' || parsed.op === '') {
    const result = { ok: false, error: 'op-arg-missing', reason: '必須提供 --op=redraft|republish' };
    return { exit: exitCodeForError('op-arg-missing'), stdout: formatPlan(result, { json }), result, stderrLines };
  }

  const result = await planRedraft({ slug: parsed.slug, op: parsed.op, site: parsed.site, projectRoot });
  const exit = result.ok ? 0 : exitCodeForError(result.error);
  log(result.ok ? `planned: ${result.plan.op} ${result.plan.sourcePath}` : `plan failed: ${result.error}`);
  return { exit, stdout: formatPlan(result, { json }), result, stderrLines };
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
  runCli({ argv: process.argv.slice(2), projectRoot: PROJECT_ROOT }).then(
    ({ exit, stdout, stderrLines }) => {
      for (const line of stderrLines) process.stderr.write(line + '\n');
      process.stdout.write(stdout + '\n');
      process.exit(exit);
    },
    (err) => {
      process.stderr.write(`[redraft-plan] crashed: ${err && err.stack ? err.stack : err}\n`);
      process.exit(1);
    },
  );
}
