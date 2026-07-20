#!/usr/bin/env node
// Phase 20260714-A：GitHub 文章唯讀查詢（read-only article lookup）。
//
// 背景 / 上位契約：
//   docs/20260714-admin-github-redraft-write-path-preflight.md §14 建議之分階段
//   A→B→C→D→E 的 **Phase A**：先建立「slug → 唯一 Markdown 文章解析 + 唯讀顯示 lifecycle /
//   publishing metadata」的安全基座。write path（Phase B dry-run patch / Phase C apply /
//   Phase D commit-push / Phase E deploy）**皆未實作、皆 Dean-gated**。本檔**只讀不寫**。
//
// 邊界（read-only 保證；違反即設計錯誤）：
//   - 只 import 讀取 API：fs/promises 之 readFile、fast-glob、gray-matter。
//   - **不** import / 呼叫任何寫入 API（writeFile / appendFile / rm / mkdir / rename / copyFile /
//     safe-write / admin-write-cli），**不** patch frontmatter、**不**建立 / 刪除任何檔、**不**動 mtime、
//     **不** commit / push / build / deploy / 碰 gh-pages、**不** Blogger / Google / GA4 / AdSense API。
//   - **不**接受 `--apply`（明確拒絕，非忽略）；**不**提供 commit / push / deploy 選項。
//
// 功能契約（preflight §14 Phase A + 本 session spec §4）：
//   1. 輸入只接受精確 slug（格式驗證；拒絕 traversal / 反斜線 / URL-encoded / 任意路徑）。
//   2. 僅掃 allowlist content roots：content/github/posts、content/blogger/posts（排除 .fb.md sidecar）。
//   3. 唯一解析：0 筆 → hard-fail（not-found）；1 筆 → 成功；≥2 筆 → hard-fail（not-unique）。
//      不默默取第一筆。可選 --site github|blogger 精確 filter（依 content-root 資料夾，deterministic）。
//   4. 唯讀顯示：title / id / slug / repo-relative source path / contentRoot / site / status / draft /
//      status⇔draft 一致性 / primaryPlatform / contentKind / category / date / updated / publishTargets 摘要 /
//      是否有 publishing sidecar / GitHub·Blogger publishing metadata 摘要。**不**輸出 body / secrets / 大量 frontmatter。
//   5. human-readable 與 deterministic --json 兩模式。
//
// 分級：
//   - hard-fail（非 0 exit、不顯示成功）：非法 slug / traversal / 找不到 / slug 命中多篇 /
//     frontmatter 無法解析 / status·draft 型別不合法 / 傳入 --apply 等不支援 write 參數。
//   - warning-only（不影響 exit code、不自動修復）：status⇔draft 矛盾、publishing metadata 缺漏。
//
// 執行：
//   node src/scripts/admin-article-lookup.js --slug=<slug> [--site=github|blogger] [--json]
//   （npm：`npm run admin:lookup -- --slug=<slug>`）

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

// Phase 20260720-publish-target-stage Slice 1：publishTargets.<platform>.stage 之 read-only 解析。
import { resolvePublishTargetStage, formatPublishStage } from './publish-stage.js';

// ── 常數 ─────────────────────────────────────────────────────────────────────────
// allowlist content roots（repo-relative；只允許這兩個資料夾之直屬 *.md）。
export const ALLOWED_CONTENT_ROOTS = Object.freeze([
  { site: 'github', rel: 'content/github/posts' },
  { site: 'blogger', rel: 'content/blogger/posts' },
]);

const VALID_SITES = new Set(ALLOWED_CONTENT_ROOTS.map((r) => r.site));
const VALID_STATUS = new Set(['draft', 'ready', 'published', 'archived']);
const VISIBLE_STATUS = new Set(['ready', 'published']);
const HIDDEN_STATUS = new Set(['draft', 'archived']);

// slug 格式：小寫英數 + 連字號分隔（不得以連字號開頭 / 結尾 / 連續連字號外的其他字元）。
// 對照真實 slug：github-pages-build-preview-workflow / we-media-myself2 / what-is-design-token。
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ── slug 驗證（回結構化錯誤；各 reason 皆 hard-fail）─────────────────────────────
export function validateSlug(slug) {
  if (typeof slug !== 'string' || slug === '') {
    return { ok: false, reason: 'slug-missing-or-empty' };
  }
  if (slug.includes('\0')) return { ok: false, reason: 'slug-has-null-byte' };
  // traversal / 路徑分隔 / URL-encoded 先於通用格式檢查，給精確 reason。
  if (slug.includes('..')) return { ok: false, reason: 'slug-traversal' };
  if (slug.includes('/') || slug.includes('\\')) return { ok: false, reason: 'slug-path-separator' };
  if (slug.includes('%')) return { ok: false, reason: 'slug-url-encoded' };
  if (path.isAbsolute(slug)) return { ok: false, reason: 'slug-absolute-path' };
  if (!SLUG_RE.test(slug)) return { ok: false, reason: 'slug-format-invalid' };
  return { ok: true };
}

// ── 內部工具 ─────────────────────────────────────────────────────────────────────
function toPosixRelative(projectRoot, absPath) {
  return path.relative(projectRoot, absPath).split(path.sep).join('/');
}

// 判斷 raw 檔案於 frontmatter 區塊內是否宣告了目標 slug。
// 用途：某檔 frontmatter YAML 無法被 gray-matter 解析（throw）時，仍能判斷它是否就是
// 使用者要找的那一篇 → 該情況回報 frontmatter-parse-failed（hard-fail），而非誤判成 not-found。
function rawFrontmatterDeclaresSlug(raw, slug) {
  if (typeof raw !== 'string') return false;
  if (!raw.startsWith('---')) return false;
  const end = raw.indexOf('\n---', 3);
  const block = end === -1 ? raw : raw.slice(0, end);
  // 允許 slug: value / slug: "value" / slug: 'value'（行首、可含前導空白）。
  const re = new RegExp(
    `(^|\\n)\\s*slug:\\s*["']?${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\s*(\\n|$)`,
  );
  return re.test(block);
}

// 掃描單一 content root，回 { matches: [{ absPath, sourcePath, data }], parseFailures: [{ sourcePath }] }。
async function scanRoot(projectRoot, root, slug) {
  const baseDir = path.join(projectRoot, ...root.rel.split('/'));
  const pattern = path.join(baseDir, '**/*.md').split(path.sep).join('/');
  const files = await fg(pattern, { absolute: true, onlyFiles: true });

  const matches = [];
  const parseFailures = [];
  for (const absPath of files) {
    // .fb.md 為 Facebook sidecar，非文章本體 → 排除（對齊 admin-write-whitelist classifyFilename）。
    if (absPath.endsWith('.fb.md')) continue;
    const sourcePath = toPosixRelative(projectRoot, absPath);

    let raw;
    try {
      raw = await readFile(absPath, 'utf-8');
    } catch {
      // 讀檔失敗：跳過該檔（不讓單一 I/O 錯誤癱瘓整體查詢）。
      continue;
    }

    // raw 層先判斷 frontmatter 是否「文字上」宣告了目標 slug。此判斷不依賴 YAML 解析成功，
    // 用於偵測「宣告了目標 slug 但 YAML 無法解析」的壞檔（含 gray-matter 對同一壞字串
    // 重複呼叫時會回快取空物件、不再 throw 的情況）→ cache-independent。
    const declaresTarget = rawFrontmatterDeclaresSlug(raw, slug);

    let data = null;
    try {
      ({ data } = matter(raw));
    } catch {
      data = null;
    }

    if (data && data.slug === slug) {
      matches.push({ absPath, sourcePath, data, contentRoot: root.site });
    } else if (declaresTarget) {
      // frontmatter 文字宣告了目標 slug，但解析未產出該 slug（throw / 快取空物件 / 格式錯誤）
      // → 視為「找到目標但 frontmatter 壞掉」，交由上層 hard-fail（不誤判成 not-found）。
      parseFailures.push({ sourcePath });
    }
  }
  return { matches, parseFailures };
}

// ── status⇔draft 一致性（warning-only）───────────────────────────────────────────
function evaluateStatusDraft(status, draft) {
  const statusPresent = status !== undefined && status !== null;
  const draftPresent = typeof draft === 'boolean';
  if (!statusPresent || !draftPresent) {
    return { consistent: null, note: 'status 或 draft 缺省，無法判定一致性（indeterminate）' };
  }
  if (!VALID_STATUS.has(status)) {
    return { consistent: null, note: `status "${status}" 非已知列舉值，無法判定一致性` };
  }
  if (VISIBLE_STATUS.has(status) && draft === true) {
    return { consistent: false, note: `status:${status} 為可見狀態，但 draft:true（會被隱藏；矛盾）` };
  }
  if (HIDDEN_STATUS.has(status) && draft === false) {
    return { consistent: false, note: `status:${status} 為隱藏狀態，但 draft:false（仍被隱藏；矛盾）` };
  }
  return { consistent: true, note: 'status 與 draft 一致' };
}

// ── publishing metadata 摘要（僅安全欄位；不輸出 secrets / token / credentials）──────
function summarizePublishing(data) {
  // publish sidecar 內容由 load-posts 掛在 entry.publish；此處 resolver 未讀 sidecar 檔，
  // 但文章 frontmatter 可能帶 blogger 區塊（legacy）。兩者皆僅取安全欄位。
  const summary = { hasSidecar: false, blogger: null, github: null };

  // frontmatter 內 legacy blogger 區塊（§24）—— 只取公開 / 操作相關欄位。
  const b = data.blogger;
  if (b && typeof b === 'object') {
    summary.blogger = {
      status: typeof b.status === 'string' ? b.status : null,
      hasPublishedUrl: typeof b.publishedUrl === 'string' && b.publishedUrl.trim() !== '',
      publishedUrl: typeof b.publishedUrl === 'string' ? b.publishedUrl : null,
      publishedAt: typeof b.publishedAt === 'string' ? b.publishedAt : null,
      hasBloggerPostId: typeof b.bloggerPostId === 'string' && b.bloggerPostId.trim() !== '',
    };
  }
  return summary;
}

// publish sidecar（.publish.json）唯讀摘要 —— resolver 讀取路徑相鄰之 sidecar 檔（read-only）。
async function readPublishSidecarSummary(absPath) {
  const dir = path.dirname(absPath);
  const stem = path.basename(absPath, path.extname(absPath));
  const sidecarPath = path.join(dir, `${stem}.publish.json`);
  let raw;
  try {
    raw = await readFile(sidecarPath, 'utf-8');
  } catch {
    return { exists: false, blogger: null, github: null };
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return { exists: true, parseError: true, blogger: null, github: null };
  }
  const b = json && typeof json === 'object' ? json.blogger : null;
  const g = json && typeof json === 'object' ? json.github : null;
  return {
    exists: true,
    blogger:
      b && typeof b === 'object'
        ? {
            status: typeof b.status === 'string' ? b.status : null,
            hasPublishedUrl: typeof b.publishedUrl === 'string' && b.publishedUrl.trim() !== '',
            publishedUrl: typeof b.publishedUrl === 'string' ? b.publishedUrl : null,
            publishedAt: typeof b.publishedAt === 'string' ? b.publishedAt : null,
            hasBloggerPostId: typeof b.bloggerPostId === 'string' && b.bloggerPostId.trim() !== '',
          }
        : null,
    github:
      g && typeof g === 'object'
        ? {
            enabled: g.enabled === true,
            hasPublishedUrl: typeof g.publishedUrl === 'string' && g.publishedUrl.trim() !== '',
            publishedUrl: typeof g.publishedUrl === 'string' ? g.publishedUrl : null,
          }
        : null,
  };
}

// publishTargets 摘要（只取 enabled / mode / stage；不輸出整個巢狀物件）。
//
// Phase 20260720-publish-target-stage Slice 1（additive / read-only）：
//   stage 為 enabled / mode 以外之第三個正交維度（production eligibility）。此處僅**顯示**
//   解析結果，不改變任何 eligibility、不過濾任何文章、不寫回 frontmatter。
//   缺漏 → stage:'production' / stageSource:'default'；非法 → stage:null / stageSource:'invalid'。
function summarizePublishTargets(pt) {
  if (!pt || typeof pt !== 'object') return null;
  const pick = (t, platform) => {
    if (!t || typeof t !== 'object') return null;
    const stage = resolvePublishTargetStage(pt, platform);
    return {
      enabled: t.enabled === true,
      mode: typeof t.mode === 'string' ? t.mode : null,
      stage: stage.ok ? stage.stage : null,
      stageSource: stage.source,
      stageDisplay: formatPublishStage(stage),
    };
  };
  return { github: pick(pt.github, 'github'), blogger: pick(pt.blogger, 'blogger') };
}

// ── 核心 resolver（純函式；deterministic；不修改輸入 / 不寫檔）─────────────────────
// 回傳：
//   成功 → { ok: true, article: {...} }
//   失敗 → { ok: false, error, reason?, matches?, ... }
// error 列舉：invalid-project-root / invalid-slug / invalid-site / not-found /
//            not-unique / frontmatter-parse-failed / status-draft-type-invalid
export async function resolveArticleBySlug({ slug, site, projectRoot } = {}) {
  if (typeof projectRoot !== 'string' || projectRoot === '' || !path.isAbsolute(projectRoot)) {
    return { ok: false, error: 'invalid-project-root', reason: 'projectRoot 必須為非空絕對路徑' };
  }

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) {
    return { ok: false, error: 'invalid-slug', reason: slugCheck.reason, slug };
  }

  let roots = ALLOWED_CONTENT_ROOTS;
  if (site !== undefined && site !== null && site !== '') {
    if (!VALID_SITES.has(site)) {
      return { ok: false, error: 'invalid-site', reason: `site 須為 ${[...VALID_SITES].join(' | ')}`, site };
    }
    roots = ALLOWED_CONTENT_ROOTS.filter((r) => r.site === site);
  }

  const allMatches = [];
  const allParseFailures = [];
  for (const root of roots) {
    const { matches, parseFailures } = await scanRoot(projectRoot, root, slug);
    allMatches.push(...matches);
    allParseFailures.push(...parseFailures);
  }

  // 找到目標 slug 但 frontmatter 壞掉 → hard-fail（不誤判成 not-found）。
  if (allMatches.length === 0 && allParseFailures.length > 0) {
    return {
      ok: false,
      error: 'frontmatter-parse-failed',
      reason: `slug "${slug}" 對應檔案之 frontmatter 無法解析`,
      files: allParseFailures.map((f) => f.sourcePath),
    };
  }

  if (allMatches.length === 0) {
    return { ok: false, error: 'not-found', reason: `找不到 slug "${slug}" 的文章`, slug };
  }

  if (allMatches.length > 1) {
    return {
      ok: false,
      error: 'not-unique',
      reason: `slug "${slug}" 命中 ${allMatches.length} 篇；請用 --site 精確指定，或修正重複 slug`,
      matches: allMatches.map((m) => ({ sourcePath: m.sourcePath, contentRoot: m.contentRoot })),
    };
  }

  const { data, sourcePath, contentRoot, absPath } = allMatches[0];

  // status / draft 型別檢查（型別不合法 → hard-fail；缺省不算型別不合法）。
  if (data.status !== undefined && data.status !== null && typeof data.status !== 'string') {
    return {
      ok: false,
      error: 'status-draft-type-invalid',
      reason: `status 型別不合法（應為 string，實得 ${typeof data.status}）`,
      sourcePath,
    };
  }
  if (data.draft !== undefined && data.draft !== null && typeof data.draft !== 'boolean') {
    return {
      ok: false,
      error: 'status-draft-type-invalid',
      reason: `draft 型別不合法（應為 boolean，實得 ${typeof data.draft}）`,
      sourcePath,
    };
  }

  const status = typeof data.status === 'string' ? data.status : null;
  const draft = typeof data.draft === 'boolean' ? data.draft : null;
  const statusDraft = evaluateStatusDraft(status, draft);

  const sidecar = await readPublishSidecarSummary(absPath);
  const fmPublishing = summarizePublishing(data);

  // article：curated 安全視圖（固定 key 順序 → deterministic JSON）。
  const article = {
    slug: typeof data.slug === 'string' ? data.slug : slug,
    id: typeof data.id === 'string' ? data.id : null,
    title: typeof data.title === 'string' ? data.title : null,
    sourcePath,
    contentRoot,
    site: typeof data.site === 'string' ? data.site : null,
    contentKind: typeof data.contentKind === 'string' ? data.contentKind : (typeof data.type === 'string' ? data.type : null),
    primaryPlatform: typeof data.primaryPlatform === 'string' ? data.primaryPlatform : null,
    category: typeof data.category === 'string' ? data.category : null,
    date: typeof data.date === 'string' ? data.date : null,
    updated: typeof data.updated === 'string' ? data.updated : null,
    status,
    draft,
    statusDraftConsistent: statusDraft.consistent,
    statusDraftNote: statusDraft.note,
    publishTargets: summarizePublishTargets(data.publishTargets),
    publishing: {
      hasSidecar: sidecar.exists === true,
      sidecarParseError: sidecar.parseError === true,
      blogger: sidecar.blogger ?? fmPublishing.blogger,
      github: sidecar.github ?? null,
    },
  };

  return { ok: true, article };
}

// ── 顯示（human-readable / json）——不含 body、不含 secrets ────────────────────────
export function formatArticleLookup(result, { json = false } = {}) {
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (!result.ok) {
    const lines = [`✗ lookup 失敗：${result.error}`];
    if (result.reason) lines.push(`  reason: ${result.reason}`);
    if (Array.isArray(result.matches)) {
      lines.push('  命中多篇：');
      for (const m of result.matches) lines.push(`    - ${m.sourcePath} (contentRoot=${m.contentRoot})`);
    }
    if (Array.isArray(result.files)) {
      for (const f of result.files) lines.push(`    - ${f}`);
    }
    return lines.join('\n');
  }

  const a = result.article;
  const yn = (v) => (v === true ? 'yes' : v === false ? 'no' : '—');
  const lines = [];
  lines.push('✓ article found (read-only)');
  lines.push(`  title            : ${a.title ?? '—'}`);
  lines.push(`  id               : ${a.id ?? '—'}`);
  lines.push(`  slug             : ${a.slug}`);
  lines.push(`  source path      : ${a.sourcePath}`);
  lines.push(`  content root     : ${a.contentRoot}`);
  lines.push(`  site             : ${a.site ?? '—'}`);
  lines.push(`  contentKind      : ${a.contentKind ?? '—'}`);
  lines.push(`  primaryPlatform  : ${a.primaryPlatform ?? '—'}`);
  lines.push(`  category         : ${a.category ?? '—'}`);
  lines.push(`  date             : ${a.date ?? '—'}`);
  lines.push(`  updated          : ${a.updated ?? '—'}`);
  lines.push(`  status           : ${a.status ?? '—'}`);
  lines.push(`  draft            : ${a.draft === null ? '—' : a.draft}`);
  lines.push(
    `  status⇔draft     : ${a.statusDraftConsistent === null ? 'indeterminate' : a.statusDraftConsistent ? 'consistent' : '⚠ INCONSISTENT'} — ${a.statusDraftNote}`,
  );
  if (a.publishTargets) {
    const pt = a.publishTargets;
    const fmt = (t) => (t ? `enabled=${yn(t.enabled)} mode=${t.mode ?? '—'} stage=${t.stageDisplay ?? '—'}` : '—');
    lines.push(`  publishTargets   : github[${fmt(pt.github)}] blogger[${fmt(pt.blogger)}]`);
  } else {
    lines.push('  publishTargets   : —');
  }
  const p = a.publishing;
  lines.push(`  publish sidecar  : ${yn(p.hasSidecar)}${p.sidecarParseError ? ' (⚠ parse error)' : ''}`);
  if (p.blogger) {
    lines.push(
      `  blogger publish  : status=${p.blogger.status ?? '—'} url=${p.blogger.hasPublishedUrl ? p.blogger.publishedUrl : '(none)'} publishedAt=${p.blogger.publishedAt ?? '—'} postId=${yn(p.blogger.hasBloggerPostId)}`,
    );
  } else {
    lines.push('  blogger publish  : (no blogger publishing metadata)');
  }
  if (p.github) {
    lines.push(
      `  github publish   : enabled=${yn(p.github.enabled)} url=${p.github.hasPublishedUrl ? p.github.publishedUrl : '(none)'}`,
    );
  }
  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────────
function parseArgv(argv) {
  let slug = null;
  let site = undefined;
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (typeof raw !== 'string') continue;
    // 明確拒絕 write / apply / deploy 類參數（非忽略）。
    if (raw === '--apply' || raw.startsWith('--apply=')) {
      return { ok: false, error: 'apply-not-supported' };
    }
    if (raw === '--commit' || raw === '--push' || raw === '--deploy' || raw === '--write') {
      return { ok: false, error: 'write-flag-not-supported', flag: raw };
    }
    if (raw === '--json') {
      json = true;
      continue;
    }
    if (raw.startsWith('--slug=')) {
      slug = raw.slice('--slug='.length);
      continue;
    }
    if (raw === '--slug') {
      slug = argv[i + 1];
      i += 1;
      continue;
    }
    if (raw.startsWith('--site=')) {
      site = raw.slice('--site='.length);
      continue;
    }
    if (raw === '--site') {
      site = argv[i + 1];
      i += 1;
      continue;
    }
    return { ok: false, error: 'unknown-arg', arg: raw };
  }
  return { ok: true, slug, site, json };
}

// error → exit code 對照。
function exitCodeForError(error) {
  switch (error) {
    case 'invalid-project-root':
      return 1;
    case 'apply-not-supported':
    case 'write-flag-not-supported':
    case 'unknown-arg':
    case 'slug-arg-missing':
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
    default:
      return 1;
  }
}

// runCli：回 { exit, stdout, stderrLines }（不直接 process.exit，利於測試）。
export async function runCli({ argv, projectRoot } = {}) {
  const stderrLines = [];
  const log = (line) => stderrLines.push(`[admin-lookup] ${line}`);

  const parsed = parseArgv(Array.isArray(argv) ? argv : []);
  if (!parsed.ok) {
    log(`argv rejected: ${parsed.error}${parsed.arg ? ` (${parsed.arg})` : ''}${parsed.flag ? ` (${parsed.flag})` : ''}`);
    const detail =
      parsed.error === 'apply-not-supported'
        ? '--apply 不受支援：本工具為唯讀 lookup，無 write / apply 路徑'
        : parsed.error === 'write-flag-not-supported'
          ? `${parsed.flag} 不受支援：本工具為唯讀 lookup`
          : parsed.error === 'unknown-arg'
            ? `未知參數：${parsed.arg}`
            : parsed.error;
    const result = { ok: false, error: parsed.error, reason: detail };
    return { exit: exitCodeForError(parsed.error), stdout: formatArticleLookup(result, { json: false }), result, stderrLines };
  }

  const json = parsed.json === true;
  if (typeof parsed.slug !== 'string' || parsed.slug === '') {
    log('missing --slug=<slug>');
    const result = { ok: false, error: 'slug-arg-missing', reason: '必須提供 --slug=<slug>' };
    return { exit: exitCodeForError('slug-arg-missing'), stdout: formatArticleLookup(result, { json }), result, stderrLines };
  }

  const result = await resolveArticleBySlug({ slug: parsed.slug, site: parsed.site, projectRoot });
  const exit = result.ok ? 0 : exitCodeForError(result.error);
  if (result.ok) log(`resolved: ${result.article.sourcePath}`);
  else log(`resolve failed: ${result.error}`);
  return { exit, stdout: formatArticleLookup(result, { json }), result, stderrLines };
}

function isMainModule() {
  if (!process.argv[1]) return false;
  const argvUrl = new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;
  return import.meta.url === argvUrl;
}

if (isMainModule()) {
  // 預設 projectRoot 由模組位置 deterministically 推導（不依賴 process.cwd() 偶然值）。
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
      process.stderr.write(`[admin-lookup] crashed: ${err && err.stack ? err.stack : err}\n`);
      process.exit(1);
    },
  );
}
