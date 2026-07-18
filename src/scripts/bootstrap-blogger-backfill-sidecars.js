#!/usr/bin/env node
// Phase 20260718：missing `.publish.json` sidecar bootstrap writer（dry-run by default；apply requires --apply）。
//
// 用途：
//   對 planner 判定為 `MISSING_SIDECAR` 之 Blogger backfill candidate，依 Dean 提供之 manifest 建立
//   缺漏之 `.publish.json`。writer 為 create-only；不覆寫；不 patch；不 merge；不 touch Markdown；
//   不 touch 其他 sidecar；不呼叫任何 Blogger / Google API；不需網路；不需 credential。
//
// 上游 / policy：
//   - `docs/20260706-blogger-identity-and-backfill-strategy.md` §A（identity 分層；A.1 human / A.3 system）
//   - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（planner classification）
//   - `docs/publish-json-schema.md` §5.3 / §5.4（Blogger URL 為唯一真相；publishedAt 嚴格 ISO）
//   - `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = sidecar）
//
// 安全契約（fail-closed；hard-coded）：
//   - 預設 dry-run；apply 需明確 `--apply`；無 `--force` / `--overwrite` / `--replace` / `--merge` / `--yes` 支援
//     （出現即 hard-fail exit 1）。
//   - `--input <manifest>` 必填（除非 --help）。manifest 為 JSON，schemaVersion === 1。
//   - 只接受 manifest 明確提供之 human-supplied truth（`blogger.publishedUrl` / `blogger.publishedAt`）；
//     **絕不**由 slug / title / URL / 檔案時間推導 Blogger truth；**絕不** fabricate `bloggerPostId`。
//   - Source path 必須位於 `content/blogger/posts/`（allowed range），且對應 Markdown 存在、frontmatter
//     可解析、為 candidate、planner 判定為 MISSING_SIDECAR。
//   - target sidecar 已存在 → fail closed；create-only；不 overwrite / patch / merge / force。
//   - 兩階段：先完成所有 validation 產生 mutation plan；任一筆 invalid 於任何 mutation 前 fail-closed
//     （不會出現「前 N 筆已寫、末筆失敗」）。
//   - Apply 以 `writeFile` `flag: 'wx'`（exclusive）+ `.tmp` → `rename` 完成原子寫入；失敗清 tmp。
//     不建立額外目錄（目標目錄已為既有 candidate 之 Markdown 所在資料夾）。
//   - Dry-run 之 JSON `mutationPerformed: false`；apply 之 JSON `mutationPerformed: true` 表已寫入。
//   - CLI 之 exit code：0 = normal（含 dry-run 全部 valid / 全部 blocked）；1 = malformed input / invalid CLI /
//     any record invalid / target-collision / write failure。
//
// 本 slice 明確 **不** 做：
//   - 對六篇正式 `20260612-*` 執行 apply（無 truth manifest；由 Dean 授權後另 slice 執行）
//   - Blogger API credential / auth / publish / update flow
//   - `bloggerPostId` capture / write
//   - Markdown frontmatter modification
//   - build / deploy / preview / dist-* mutation
//   - deploy repo modification
//   - 升級任何 warning-only guard 為 blocking
//
// 使用：
//   npm run bootstrap:blogger-backfill-sidecars -- --help
//   npm run bootstrap:blogger-backfill-sidecars -- --input <manifest.json>          # dry-run
//   npm run bootstrap:blogger-backfill-sidecars -- --input <manifest.json> --json   # dry-run + json
//   npm run bootstrap:blogger-backfill-sidecars -- --input <manifest.json> --apply  # apply
//   [Guard only] --repo-root <abs>：override repo root for isolated fixture testing.
//
// Manifest shape（v1）：
//   {
//     "schemaVersion": 1,
//     "records": [
//       {
//         "sourcePath": "content/blogger/posts/<file>.md",
//         "blogger": {
//           "publishedUrl": "https://<blogspot-domain>/YYYY/MM/<permalink>.html",
//           "publishedAt": "YYYY-MM-DD"   // or strict ISO-8601 w/ time+offset
//         }
//       }
//     ]
//   }
//
//   * `bloggerPostId` **不**列入 manifest 接受欄位（identity 分層 A.3；系統欄位、Dean 取不到）。
//     writer 會將該欄寫為空字串 `""`，等未來 Blogger API integration 落地時系統寫入。
//   * 未來若擴充接受欄位（如 `blogger.permalink` 明示、`seo.metaTitle` 覆寫），須另 slice + explicit approval。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

import {
  isHttpUrl,
  resolvePublishedAt,
  deriveYearMonth,
} from './backfill-published-url.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// 允許 sourcePath 之 prefix。writer 之範圍限於 Blogger posts；不接受 pages / github / drafts / archive。
export const ALLOWED_SOURCE_PREFIX = 'content/blogger/posts/';

// Manifest schema 上限。
export const MANIFEST_SCHEMA_VERSION = 1;

// 接受之 record 欄位。任何 key 不在此白名單即 fail closed。
const ALLOWED_RECORD_TOP_KEYS = new Set(['sourcePath', 'blogger']);
const ALLOWED_RECORD_BLOGGER_KEYS = new Set(['publishedUrl', 'publishedAt']);
const ALLOWED_MANIFEST_TOP_KEYS = new Set(['schemaVersion', 'records', 'notes']);

// 禁止之 flag：出現即 hard-fail（防覆寫 / 合併 / bypass）。
const FORBIDDEN_FLAGS = new Set([
  '--force',
  '--overwrite',
  '--replace',
  '--merge',
  '--yes',
  '-y',
]);

const USAGE = `Usage: bootstrap-blogger-backfill-sidecars --input <manifest.json> [--apply] [--json] [--help]

Create MISSING \`.publish.json\` sidecars for Blogger backfill candidates,
using truth values supplied by Dean via a JSON manifest.

This command is create-only and defaults to dry-run.

Required:
  --input <path>            Absolute or repo-relative path to a JSON manifest.

Options:
  --apply                   Perform mutation. Without --apply, this command is a dry-run and
                            no files are created or modified.
  --json                    Emit stable JSON plan/report to stdout instead of human-readable text.
  --repo-root <abs>         (Guard use only.) Absolute path to an alternate repo root, used to
                            resolve manifest sourcePath entries against an isolated fixture tree.
                            Defaults to the current repo root.
  --help / -h               Print this usage.

Behavior:
  - Dry-run (default): validates manifest end-to-end; prints the mutation plan; writes nothing.
  - Apply: only enters mutation after every record passes every check. Any invalid record
    causes zero mutation.
  - Create-only: if a target \`.publish.json\` already exists, this command fails closed.
    Overwrite / patch / merge is never supported. The following flags are rejected:
    --force, --overwrite, --replace, --merge, --yes/-y.
  - Never fabricates Blogger truth: publishedUrl and publishedAt must be provided per-record
    in the manifest; \`bloggerPostId\` is not accepted (system-supplied per identity strategy A.3)
    and is written as an empty string.
  - No network / no Blogger API / no Google API.
  - Never touches Markdown, other sidecars, dist-*, deploy clone, or gh-pages.

Exit codes:
  0  Normal completion (dry-run of a valid manifest, or apply that wrote every planned sidecar).
  1  Any of: malformed CLI usage, forbidden flag, manifest read/parse error, invalid record,
     source not found, source out of allowed range, source not a candidate, target already
     exists, duplicate source, duplicate target, write failure.
`;

// ── argv parsing ─────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
    apply: false,
    input: null,
    repoRoot: null,
    forbidden: [],
    unknown: [],
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--help' || a === '-h') {
      opts.help = true;
      continue;
    }
    if (a === '--json') {
      opts.json = true;
      continue;
    }
    if (a === '--apply') {
      opts.apply = true;
      continue;
    }
    if (a === '--input') {
      opts.input = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--input=')) {
      opts.input = a.slice('--input='.length);
      continue;
    }
    if (a === '--repo-root') {
      opts.repoRoot = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--repo-root=')) {
      opts.repoRoot = a.slice('--repo-root='.length);
      continue;
    }
    if (FORBIDDEN_FLAGS.has(a)) {
      opts.forbidden.push(a);
      continue;
    }
    const eqIdx = a.indexOf('=');
    if (eqIdx > 0) {
      const bare = a.slice(0, eqIdx);
      if (FORBIDDEN_FLAGS.has(bare)) {
        opts.forbidden.push(bare);
        continue;
      }
    }
    opts.unknown.push(a);
  }
  return opts;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function toRelFromRoot(abs, root) {
  return path.relative(root, abs).split(path.sep).join('/');
}

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function isCandidate(fm) {
  if (!isPlainObject(fm)) return false;
  const blogger = fm.publishTargets && fm.publishTargets.blogger;
  const enabled = !!(blogger && blogger.enabled === true);
  if (!enabled) return false;
  if (fm.draft === true) return false;
  const status = typeof fm.status === 'string' ? fm.status.trim() : '';
  return status === 'ready' || status === 'published';
}

// Build a deterministic sidecar body from human-supplied truth. Mirrors
// content/templates/_sample.publish.json structure minus $comment. bloggerPostId
// is written as "" per identity strategy A.3 (never fabricated).
export function buildSidecarBody({ publishedUrl, publishedAt }) {
  const { year, month } = deriveYearMonth(publishedAt);
  return {
    schemaVersion: 1,
    canonical: {
      url: '',
      source: 'auto',
    },
    ogImage: {
      url: '',
      alt: '',
    },
    blogger: {
      type: 'post',
      permalink: '',
      status: 'published',
      publishedUrl,
      publishedAt,
      bloggerPostId: '',
      publishYear: year,
      publishMonth: month,
      history: [],
    },
    github: {
      slug: '',
      path: '',
      status: 'draft',
      publishedUrl: '',
      publishedAt: '',
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      robots: 'index,follow',
    },
  };
}

// Deterministic serialization: 2-space indent + trailing LF, matching backfill-published-url.js.
function serializeSidecar(body) {
  return JSON.stringify(body, null, 2) + '\n';
}

// ── manifest loading + shape validation ─────────────────────────────────────

export async function loadManifest(inputPath) {
  let raw;
  try {
    raw = await fs.readFile(inputPath, 'utf-8');
  } catch (err) {
    return { ok: false, error: `manifest read failed: ${err.message}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: `manifest JSON parse error: ${err.message}` };
  }
  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'manifest top-level must be a JSON object' };
  }
  const unknownTop = Object.keys(parsed).filter((k) => !ALLOWED_MANIFEST_TOP_KEYS.has(k));
  if (unknownTop.length > 0) {
    return {
      ok: false,
      error: `manifest has unknown top-level field(s): ${unknownTop.join(', ')}`,
    };
  }
  if (parsed.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `manifest schemaVersion must be ${MANIFEST_SCHEMA_VERSION} (got: ${JSON.stringify(parsed.schemaVersion)})`,
    };
  }
  if (!Array.isArray(parsed.records)) {
    return { ok: false, error: 'manifest.records must be an array' };
  }
  return { ok: true, manifest: parsed };
}

// Validate a single manifest record's static shape; does not touch filesystem.
function validateRecordShape(record, index) {
  const errors = [];
  if (!isPlainObject(record)) {
    errors.push(`records[${index}] must be an object`);
    return errors;
  }
  const unknown = Object.keys(record).filter((k) => !ALLOWED_RECORD_TOP_KEYS.has(k));
  if (unknown.length > 0) {
    errors.push(`records[${index}] has unknown field(s): ${unknown.join(', ')}`);
  }
  if (typeof record.sourcePath !== 'string' || record.sourcePath.trim() === '') {
    errors.push(`records[${index}].sourcePath must be a non-empty string`);
  } else if (record.sourcePath !== record.sourcePath.trim()) {
    errors.push(`records[${index}].sourcePath has surrounding whitespace`);
  } else if (path.isAbsolute(record.sourcePath) || record.sourcePath.includes('\\')) {
    errors.push(`records[${index}].sourcePath must be repo-relative POSIX-style`);
  } else if (record.sourcePath.split('/').includes('..')) {
    errors.push(`records[${index}].sourcePath must not contain ".."`);
  } else if (!record.sourcePath.startsWith(ALLOWED_SOURCE_PREFIX)) {
    errors.push(
      `records[${index}].sourcePath must be within ${ALLOWED_SOURCE_PREFIX} (got: ${record.sourcePath})`,
    );
  } else if (!record.sourcePath.endsWith('.md') || record.sourcePath.endsWith('.fb.md')) {
    errors.push(
      `records[${index}].sourcePath must be a Blogger post Markdown (.md, not .fb.md)`,
    );
  }
  if (!isPlainObject(record.blogger)) {
    errors.push(`records[${index}].blogger must be an object`);
  } else {
    const unknownB = Object.keys(record.blogger).filter(
      (k) => !ALLOWED_RECORD_BLOGGER_KEYS.has(k),
    );
    if (unknownB.length > 0) {
      errors.push(
        `records[${index}].blogger has unknown field(s): ${unknownB.join(', ')}`,
      );
    }
    if (!isHttpUrl(record.blogger.publishedUrl)) {
      errors.push(
        `records[${index}].blogger.publishedUrl must be a strict http(s):// URL with no surrounding whitespace (got: ${JSON.stringify(record.blogger.publishedUrl)})`,
      );
    }
    const resolved = resolvePublishedAt(record.blogger.publishedAt);
    if (!resolved.ok) {
      errors.push(
        `records[${index}].blogger.publishedAt is invalid (${resolved.error}): ${JSON.stringify(record.blogger.publishedAt)}`,
      );
    }
  }
  return errors;
}

// ── planning ────────────────────────────────────────────────────────────────
//
// For each manifest record, produce a plan entry with readiness ∈
// { READY_FOR_WRITE, INVALID_RECORD, SOURCE_NOT_FOUND, SOURCE_NOT_CANDIDATE,
//   SIDECAR_ALREADY_EXISTS, DUPLICATE_SOURCE, DUPLICATE_TARGET }.
// Any state other than READY_FOR_WRITE is a hard block; apply requires ALL
// records to be READY_FOR_WRITE.

export async function planBootstrap({ manifest, repoRoot }) {
  const root = repoRoot;
  const entries = [];
  const errors = [];

  const seenSources = new Map();
  const seenTargets = new Map();

  for (let i = 0; i < manifest.records.length; i += 1) {
    const record = manifest.records[i];
    const shapeErrors = validateRecordShape(record, i);
    if (shapeErrors.length > 0) {
      entries.push({
        recordIndex: i,
        sourcePath: (record && typeof record.sourcePath === 'string') ? record.sourcePath : null,
        expectedSidecarPath: null,
        readiness: 'INVALID_RECORD',
        reasons: shapeErrors,
      });
      for (const e of shapeErrors) errors.push(e);
      continue;
    }

    const sourcePath = record.sourcePath;
    const absSource = path.resolve(root, sourcePath);
    const dir = path.dirname(absSource);
    const stem = path.basename(absSource, path.extname(absSource));
    const absSidecar = path.join(dir, `${stem}.publish.json`);
    const sidecarRel = toRelFromRoot(absSidecar, root);

    // duplicate source detection.
    if (seenSources.has(sourcePath)) {
      const dupReason = `duplicate sourcePath ("${sourcePath}") also at records[${seenSources.get(sourcePath)}]`;
      entries.push({
        recordIndex: i,
        sourcePath,
        expectedSidecarPath: sidecarRel,
        readiness: 'DUPLICATE_SOURCE',
        reasons: [dupReason],
      });
      errors.push(dupReason);
      continue;
    }
    seenSources.set(sourcePath, i);

    // duplicate target detection (guards against two different sourcePaths that
    // resolve to the same sidecar, e.g., via case collision).
    if (seenTargets.has(sidecarRel)) {
      const dupReason = `duplicate target sidecar ("${sidecarRel}") also produced by records[${seenTargets.get(sidecarRel)}]`;
      entries.push({
        recordIndex: i,
        sourcePath,
        expectedSidecarPath: sidecarRel,
        readiness: 'DUPLICATE_TARGET',
        reasons: [dupReason],
      });
      errors.push(dupReason);
      continue;
    }
    seenTargets.set(sidecarRel, i);

    // source Markdown must exist.
    let mdRaw;
    try {
      mdRaw = await fs.readFile(absSource, 'utf-8');
    } catch (err) {
      const reason = `source Markdown not found or unreadable: ${sourcePath} (${err.code || err.message})`;
      entries.push({
        recordIndex: i,
        sourcePath,
        expectedSidecarPath: sidecarRel,
        readiness: 'SOURCE_NOT_FOUND',
        reasons: [reason],
      });
      errors.push(reason);
      continue;
    }

    // frontmatter parseable + candidate.
    let fm;
    try {
      fm = matter(mdRaw).data || {};
    } catch (err) {
      const reason = `frontmatter parse error for ${sourcePath}: ${err.message}`;
      entries.push({
        recordIndex: i,
        sourcePath,
        expectedSidecarPath: sidecarRel,
        readiness: 'SOURCE_NOT_CANDIDATE',
        reasons: [reason],
      });
      errors.push(reason);
      continue;
    }
    if (!isCandidate(fm)) {
      const reason = `source is not a Blogger backfill candidate (publishTargets.blogger.enabled must be true, draft !== true, status ∈ [ready, published])`;
      entries.push({
        recordIndex: i,
        sourcePath,
        expectedSidecarPath: sidecarRel,
        readiness: 'SOURCE_NOT_CANDIDATE',
        reasons: [reason],
      });
      errors.push(reason);
      continue;
    }

    // target must not exist (create-only).
    let sidecarExists = false;
    try {
      await fs.access(absSidecar, fs.constants.F_OK);
      sidecarExists = true;
    } catch (err) {
      if (!err || err.code !== 'ENOENT') {
        const reason = `target sidecar stat failed: ${err.message}`;
        entries.push({
          recordIndex: i,
          sourcePath,
          expectedSidecarPath: sidecarRel,
          readiness: 'INVALID_RECORD',
          reasons: [reason],
        });
        errors.push(reason);
        continue;
      }
      sidecarExists = false;
    }
    if (sidecarExists) {
      const reason = `target sidecar already exists (create-only; no overwrite/merge/patch): ${sidecarRel}`;
      entries.push({
        recordIndex: i,
        sourcePath,
        expectedSidecarPath: sidecarRel,
        readiness: 'SIDECAR_ALREADY_EXISTS',
        reasons: [reason],
      });
      errors.push(reason);
      continue;
    }

    // Ready for write.
    const body = buildSidecarBody({
      publishedUrl: record.blogger.publishedUrl,
      publishedAt: record.blogger.publishedAt,
    });
    entries.push({
      recordIndex: i,
      sourcePath,
      expectedSidecarPath: sidecarRel,
      readiness: 'READY_FOR_WRITE',
      reasons: [],
      preview: {
        blogger: {
          publishedUrl: body.blogger.publishedUrl,
          publishedAt: body.blogger.publishedAt,
          publishYear: body.blogger.publishYear,
          publishMonth: body.blogger.publishMonth,
          status: body.blogger.status,
          bloggerPostId: body.blogger.bloggerPostId,
        },
      },
    });
  }

  entries.sort((a, b) => {
    const sa = a.sourcePath ?? '';
    const sb = b.sourcePath ?? '';
    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return a.recordIndex - b.recordIndex;
  });

  const summary = {
    manifestRecordCount: manifest.records.length,
    readyCount: entries.filter((e) => e.readiness === 'READY_FOR_WRITE').length,
    blockedCount: entries.filter((e) => e.readiness !== 'READY_FOR_WRITE').length,
    byReadiness: {
      READY_FOR_WRITE: 0,
      INVALID_RECORD: 0,
      SOURCE_NOT_FOUND: 0,
      SOURCE_NOT_CANDIDATE: 0,
      SIDECAR_ALREADY_EXISTS: 0,
      DUPLICATE_SOURCE: 0,
      DUPLICATE_TARGET: 0,
    },
  };
  for (const e of entries) {
    if (Object.prototype.hasOwnProperty.call(summary.byReadiness, e.readiness)) {
      summary.byReadiness[e.readiness] += 1;
    }
  }

  return {
    ok: summary.blockedCount === 0,
    entries,
    summary,
    errors,
  };
}

// ── apply ───────────────────────────────────────────────────────────────────

async function writeSidecarExclusive(absTarget, body) {
  const jsonStr = serializeSidecar(body);
  const tmpPath = absTarget + '.tmp';
  // Exclusive create for the tmp file first; rename over target which does not yet exist.
  try {
    await fs.writeFile(tmpPath, jsonStr, { encoding: 'utf-8', flag: 'wx' });
  } catch (err) {
    throw new Error(`tmp create failed for ${absTarget}: ${err.message}`);
  }
  try {
    // Extra safety: even though plan phase confirmed absence, race-check now.
    // `rename` on Windows will overwrite by default; use link+unlink? Node's fs.rename overwrites
    // on POSIX. We accept this tiny race; the plan-phase check + creation ordering keeps it safe
    // in single-user solo-admin context. A cross-check via link()/unlink() would still race on Windows.
    // To harden: verify target still absent right before rename.
    let stillAbsent = false;
    try {
      await fs.access(absTarget, fs.constants.F_OK);
    } catch (err) {
      if (err && err.code === 'ENOENT') stillAbsent = true;
    }
    if (!stillAbsent) {
      await fs.unlink(tmpPath).catch(() => {});
      throw new Error(
        `target sidecar appeared during apply (create-only): ${absTarget}`,
      );
    }
    await fs.rename(tmpPath, absTarget);
  } catch (err) {
    await fs.unlink(tmpPath).catch(() => {});
    throw err;
  }
}

export async function applyBootstrap({ plan, repoRoot }) {
  if (!plan.ok) {
    return {
      ok: false,
      created: [],
      error: 'apply requested but plan has blocked records; refuse to mutate',
    };
  }
  // Re-verify no target exists before any write (belt + suspenders).
  for (const e of plan.entries) {
    const absTarget = path.resolve(repoRoot, e.expectedSidecarPath);
    try {
      await fs.access(absTarget, fs.constants.F_OK);
      return {
        ok: false,
        created: [],
        error: `target appeared before apply (create-only): ${e.expectedSidecarPath}`,
      };
    } catch (err) {
      if (!err || err.code !== 'ENOENT') {
        return {
          ok: false,
          created: [],
          error: `target stat failed before apply: ${e.expectedSidecarPath}: ${err.message}`,
        };
      }
    }
  }

  const created = [];
  for (const e of plan.entries) {
    const absTarget = path.resolve(repoRoot, e.expectedSidecarPath);
    const body = buildSidecarBody({
      publishedUrl: e.preview.blogger.publishedUrl,
      publishedAt: e.preview.blogger.publishedAt,
    });
    try {
      await writeSidecarExclusive(absTarget, body);
    } catch (err) {
      return {
        ok: false,
        created,
        error: `write failed for ${e.expectedSidecarPath}: ${err.message}`,
      };
    }
    created.push(e.expectedSidecarPath);
  }
  return { ok: true, created };
}

// ── formatting ──────────────────────────────────────────────────────────────

export function formatHumanReadable({ plan, apply, applyResult }) {
  const lines = [];
  lines.push('bootstrap-blogger-backfill-sidecars');
  lines.push('');
  lines.push(`manifest record count:              ${plan.summary.manifestRecordCount}`);
  lines.push(`READY_FOR_WRITE:                    ${plan.summary.byReadiness.READY_FOR_WRITE}`);
  lines.push(`INVALID_RECORD:                     ${plan.summary.byReadiness.INVALID_RECORD}`);
  lines.push(`SOURCE_NOT_FOUND:                   ${plan.summary.byReadiness.SOURCE_NOT_FOUND}`);
  lines.push(`SOURCE_NOT_CANDIDATE:               ${plan.summary.byReadiness.SOURCE_NOT_CANDIDATE}`);
  lines.push(`SIDECAR_ALREADY_EXISTS:             ${plan.summary.byReadiness.SIDECAR_ALREADY_EXISTS}`);
  lines.push(`DUPLICATE_SOURCE:                   ${plan.summary.byReadiness.DUPLICATE_SOURCE}`);
  lines.push(`DUPLICATE_TARGET:                   ${plan.summary.byReadiness.DUPLICATE_TARGET}`);
  lines.push(`Apply requested:                    ${apply ? 'YES' : 'NO'}`);
  lines.push(`Mutation performed:                 ${applyResult && applyResult.ok ? 'YES' : 'NO'}`);
  if (applyResult) {
    lines.push(`Created count:                      ${applyResult.created.length}`);
  }
  lines.push('');

  if (plan.entries.length === 0) {
    lines.push('(manifest contained no records)');
  } else {
    lines.push('---- records ----');
    let n = 0;
    for (const e of plan.entries) {
      n += 1;
      lines.push(`  ${n}. ${e.sourcePath ?? '(no sourcePath)'}`);
      lines.push(`     expected sidecar:  ${e.expectedSidecarPath ?? '(n/a)'}`);
      lines.push(`     readiness:         ${e.readiness}`);
      if (e.reasons && e.reasons.length > 0) {
        lines.push('     reasons:');
        for (const r of e.reasons) {
          lines.push(`       - ${r}`);
        }
      }
      if (e.preview) {
        lines.push('     preview:');
        lines.push(`       - blogger.publishedUrl:  ${e.preview.blogger.publishedUrl}`);
        lines.push(`       - blogger.publishedAt:   ${e.preview.blogger.publishedAt}`);
        lines.push(`       - blogger.publishYear:   ${e.preview.blogger.publishYear}`);
        lines.push(`       - blogger.publishMonth:  ${e.preview.blogger.publishMonth}`);
        lines.push(`       - blogger.status:        ${e.preview.blogger.status}`);
        lines.push(`       - blogger.bloggerPostId: "" (system-supplied; never fabricated)`);
      }
      lines.push('');
    }
  }

  if (applyResult && applyResult.created && applyResult.created.length > 0) {
    lines.push('---- created ----');
    for (const rel of applyResult.created) {
      lines.push(`  + ${rel}`);
    }
    lines.push('');
  }
  if (applyResult && !applyResult.ok) {
    lines.push(`Apply error: ${applyResult.error}`);
    lines.push('');
  }

  lines.push('This command is create-only. Missing or invalid manifest → zero mutation.');
  lines.push('Existing sidecars are never overwritten, patched, or merged.');
  return lines.join('\n') + '\n';
}

export function formatJson({ plan, apply, applyResult }) {
  const body = {
    schemaVersion: 1,
    mode: apply ? 'apply' : 'dry-run',
    applyRequested: apply === true,
    mutationPerformed: !!(applyResult && applyResult.ok),
    summary: plan.summary,
    entries: plan.entries,
  };
  if (applyResult) {
    body.apply = {
      ok: applyResult.ok === true,
      created: applyResult.created,
    };
    if (applyResult.error) body.apply.error = applyResult.error;
  }
  return JSON.stringify(body, null, 2) + '\n';
}

// ── CLI entry ───────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  if (opts.forbidden.length > 0) {
    process.stderr.write(
      `[bootstrap-blogger-backfill-sidecars] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This writer is create-only. Overwrite / merge / bypass flags are never accepted.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[bootstrap-blogger-backfill-sidecars] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  if (!opts.input) {
    process.stderr.write(
      '[bootstrap-blogger-backfill-sidecars] ERROR: --input <manifest.json> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }

  let repoRoot = PROJECT_ROOT;
  if (opts.repoRoot != null) {
    if (!path.isAbsolute(opts.repoRoot)) {
      process.stderr.write(
        `[bootstrap-blogger-backfill-sidecars] ERROR: --repo-root must be an absolute path (got: ${opts.repoRoot})\n`,
      );
      return 1;
    }
    repoRoot = opts.repoRoot;
  }

  const inputPath = path.isAbsolute(opts.input)
    ? opts.input
    : path.resolve(process.cwd(), opts.input);

  const loaded = await loadManifest(inputPath);
  if (!loaded.ok) {
    process.stderr.write(`[bootstrap-blogger-backfill-sidecars] ERROR: ${loaded.error}\n`);
    return 1;
  }

  const plan = await planBootstrap({ manifest: loaded.manifest, repoRoot });

  let applyResult = null;
  if (opts.apply) {
    if (!plan.ok) {
      // Emit the plan report (JSON or human) then fail. Zero mutation.
      if (opts.json) {
        process.stdout.write(formatJson({ plan, apply: true, applyResult: null }));
      } else {
        process.stdout.write(formatHumanReadable({ plan, apply: true, applyResult: null }));
      }
      process.stderr.write(
        '[bootstrap-blogger-backfill-sidecars] ERROR: apply refused — one or more records are blocked. Zero mutation performed.\n',
      );
      return 1;
    }
    applyResult = await applyBootstrap({ plan, repoRoot });
  }

  if (opts.json) {
    process.stdout.write(formatJson({ plan, apply: opts.apply, applyResult }));
  } else {
    process.stdout.write(formatHumanReadable({ plan, apply: opts.apply, applyResult }));
  }

  if (opts.apply && applyResult && !applyResult.ok) return 1;
  if (!opts.apply && !plan.ok) return 1;
  return 0;
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main()
    .then((code) => {
      process.exit(typeof code === 'number' ? code : 0);
    })
    .catch((err) => {
      process.stderr.write(
        `[bootstrap-blogger-backfill-sidecars] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}
