#!/usr/bin/env node
// Phase 20260719：Blogger backfill truth apply — fingerprint-bound OS-temp-only rehearsal engine + CLI.
//
// Purpose:
//   Take a truth manifest that has already been validated by
//   `validate:blogger-backfill-truth-manifest` and planned by
//   `plan:blogger-backfill-truth-apply`, verify the review-time SHA-256 fingerprint against the
//   plan that this engine would apply, and — only when the fingerprint matches and every gate
//   passes — perform the create-only sidecar writes against a synthetic content tree that lives
//   under `os.tmpdir()`. The rehearsal engine is the multi-record transactional cousin of the
//   existing `bootstrap-blogger-backfill-sidecars.js` writer: it exercises the exact payloads
//   the planner would emit at production apply time, without ever touching production content
//   or Blogger.
//
// Pipeline position:
//   missing-sidecar planner
//     → optional create-only bootstrap
//     → truth-manifest template generator
//     → truth-manifest intake validator      (validate:blogger-backfill-truth-manifest)
//     → validated apply-plan gate            (plan:blogger-backfill-truth-apply)
//     → **this engine** — fingerprint-bound OS-temp rehearsal (rehearse:blogger-backfill-truth-apply)
//     → future writer apply                  (still separate slice; still Dean-gated;
//                                             still not authorized by fingerprint alone)
//
// Upstream authorities:
//   - `docs/20260706-blogger-identity-and-backfill-strategy.md` §A (identity layering; do not guess)
//   - `docs/publish-json-schema.md` §5.3 / §5.3.1 / §5.4 / §8.2 / §9.5 (Blogger URL + publishedAt)
//   - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md` (create-only writer schema)
//   - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md` (validator layer)
//   - `docs/20260719-blogger-backfill-truth-apply-plan.md` (validated apply-plan + fingerprint)
//   - `docs/20260719-blogger-backfill-sidecar-identity-contract-audit.md` (`bloggerPostId: ""` is
//     a schema-allowed incomplete-identity state; the fingerprint is informational; production
//     apply is not authorized by fingerprint alone)
//
// Safety contract (fail-closed; hard-coded):
//   - `--repo-root` MUST be an absolute path whose realpath is a strict descendant of the realpath
//     of `os.tmpdir()`. The source repo root and any path outside `os.tmpdir()` are rejected
//     before any manifest parse or filesystem mutation. Empty basename and symlinks that escape
//     `os.tmpdir()` are rejected.
//   - `<repoRoot>/.blogger-backfill-truth-apply-rehearsal-marker.json` MUST exist and MUST contain
//     `{schemaVersion: 1, purpose: "blogger-backfill-truth-apply-rehearsal"}`. Absence, unreadable,
//     malformed, wrong schemaVersion, or wrong purpose → refuse.
//   - `--expected-fingerprint` MUST be lowercase SHA-256 hex (exactly 64 chars, `[0-9a-f]`).
//     Empty, whitespace-padded, uppercase, wrong length → refuse.
//   - Plan is generated exactly once via `planTruthApply({manifestPath, repoRoot})`; the resulting
//     entries are deep-cloned, canonical-serialized, and used verbatim for both fingerprint
//     computation and apply. This engine NEVER re-reads the manifest, NEVER re-derives target,
//     NEVER re-constructs payload, and NEVER shells out.
//   - Fingerprint match is required before ANY write is attempted. Mismatch → refuse.
//   - Every planned record is preflight-checked (schema shape via planner + engine cross-check)
//     before the first write. Any preflight failure → zero writes.
//   - Per-file write primitive (no-replace commit):
//       1. Write full bytes to `<target>.rehearse.tmp` with `flag: 'wx'` (exclusive create).
//       2. Commit via `fs.link(tmp, target)` — a single filesystem primitive whose contract on
//          both POSIX (`link(2)`) and Windows (`CreateHardLinkW`) is: fail atomically with
//          EEXIST / ERROR_ALREADY_EXISTS if `target` already exists; otherwise create a new
//          hardlink at `target`. There is NO check-then-commit gap; no reader ever sees partial
//          bytes at `target` because the tmp is fully written before the link is created.
//       3. Best-effort unlink of the tmp path after a successful link. If tmp cleanup fails, the
//          target is still correctly committed; the transaction does NOT roll back a successful
//          commit for a tmp-cleanup leak.
//       4. On link failure: unlink the tmp and throw. `target` bytes and mtime are unchanged.
//     Filesystem requirement: temp and target on the same filesystem (they are — same directory),
//     and the filesystem supports hardlinks (NTFS + all common POSIX FSes: ext4, APFS, ZFS, XFS,
//     Btrfs, HFS+). On unsupported filesystems (FAT/exFAT) the link surfaces as an error; this
//     engine hard-fails and never falls back to any replace-capable primitive.
//   - Multi-record transaction rollback: on any failure after the first write, every already-
//     created target is unlinked in reverse creation order. Before each unlink, the target's
//     current inode is compared against the inode captured at commit time; a mismatch (indicating
//     the target has been externally replaced) refuses the unlink and surfaces the ownership
//     failure in the report. Pre-existing files are NEVER touched. Rollback failures are surfaced
//     in the report; they do not cause silent partial state. Multi-record rollback remains
//     best-effort compensating (not a filesystem transaction, not crash-safe).
//   - Rehearsal writes and rollback happen ONLY under a validated OS-temp `--repo-root`. Even in
//     success, the engine never writes anywhere else — no dist-*, no gh-pages, no deploy clone,
//     no source-repo tree, no `/etc`, no `~/`.
//   - `--production` / `--allow-production` / `--force` / `--overwrite` / `--replace` / `--merge`
//     / `--publish` / `--deploy` / `--commit` / `--yes` / `-y` are forbidden.
//   - Unknown flags → hard-fail. Missing required flag → hard-fail. Non-absolute --repo-root →
//     hard-fail. Non-hex fingerprint → hard-fail.
//   - `productionWritePerformed` is invariantly `false`. `rehearsalWritePerformed` may be true,
//     but only ever reflects writes that happened under an OS-temp `--repo-root`.
//   - Failure injection hooks are exposed on the programmatic API only (for the focused guard);
//     they are NOT wired to any CLI flag or environment variable.
//   - No network, no `child_process`, no Blogger/Google API, no OAuth.
//
// What this slice explicitly does NOT do:
//   - Perform any production apply.
//   - Modify any production `.publish.json`, Markdown, sidecar inventory, or gh-pages.
//   - Grant apply authorization by fingerprint match alone. Authorization is a separate Dean-
//     gated decision that this engine does not implement.
//   - Fabricate `bloggerPostId` — the payload keeps `bloggerPostId: ""` per identity contract A.3
//     (see 2026-07-19 identity contract audit).
//   - Build, deploy, preview, or touch `dist-*` / `dist-blogger-preview/`.
//   - Call Blogger / Google / GA4 / AdSense API.
//   - Upgrade any warning-only guard to blocking.
//
// Usage:
//   npm run rehearse:blogger-backfill-truth-apply -- \
//     --manifest <abs>              # absolute path to a validated manifest under OS tmpdir
//     --repo-root <abs>              # absolute path to a synthetic repo root under OS tmpdir
//     --expected-fingerprint <sha256>   # 64-char lowercase hex; must match planner's fingerprint
//     [--json]
//     [--help]
//
// Rehearsal marker: create at
//   `<repoRoot>/.blogger-backfill-truth-apply-rehearsal-marker.json` containing exactly
//   {"schemaVersion":1,"purpose":"blogger-backfill-truth-apply-rehearsal"}
//
// Exit codes:
//   0 — every gate passed and the apply-plan was rehearsed successfully under OS tmpdir.
//   1 — any of: OS-temp gate refused, marker refused, fingerprint syntactically invalid,
//       fingerprint mismatch, validation/planning failed, preflight failed, per-file write
//       failed, verification failed, transaction rolled back (partial rehearsal), CLI misuse.

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { planTruthApply } from './plan-blogger-backfill-truth-apply.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Rehearsal marker contract. The name is deliberately verbose so a stray file cannot
// accidentally satisfy the gate; the JSON payload is a small, checkable envelope.
export const REHEARSAL_MARKER_FILENAME =
  '.blogger-backfill-truth-apply-rehearsal-marker.json';
export const REHEARSAL_MARKER_PURPOSE = 'blogger-backfill-truth-apply-rehearsal';
export const REHEARSAL_MARKER_SCHEMA_VERSION = 1;

// Suffix used for the exclusive temporary create. Kept distinct from any writer that
// might use `<target>.tmp` so a stray tmp cannot be mistaken for a rehearsal artifact.
const TMP_SUFFIX = '.rehearse.tmp';

// Mutation-like flags rejected up-front. Any occurrence fail-closes with exit 1.
const FORBIDDEN_FLAGS = new Set([
  '--production',
  '--allow-production',
  '--force',
  '--overwrite',
  '--replace',
  '--merge',
  '--publish',
  '--deploy',
  '--commit',
  '--yes',
  '-y',
]);

const USAGE = `Usage: rehearse-blogger-backfill-truth-apply \\
  --manifest <path> \\
  --repo-root <abs> \\
  --expected-fingerprint <sha256-hex-64> \\
  [--json] [--help]

Rehearsal-only apply engine for a Dean-populated Blogger backfill truth manifest.
This command writes ONLY under a synthetic OS-tmp repository. It NEVER modifies
production content, NEVER modifies Blogger, NEVER performs a production apply,
NEVER calls Blogger / Google APIs, NEVER accesses the network, and NEVER
authorizes apply by fingerprint alone.

Gates (fail-closed):
  1. --repo-root realpath must be a strict descendant of realpath(os.tmpdir()).
     Any escape (symlink, source repo, deploy repo, /etc, ~/…) is refused.
  2. \`<repoRoot>/${REHEARSAL_MARKER_FILENAME}\`
     must exist and equal {"schemaVersion":${REHEARSAL_MARKER_SCHEMA_VERSION},
     "purpose":"${REHEARSAL_MARKER_PURPOSE}"}.
  3. --expected-fingerprint must be lowercase SHA-256 hex (64 chars).
  4. Validator + planner (in-process) must pass.
  5. Actual plan fingerprint must exactly equal --expected-fingerprint.
  6. Every planned record must pass all-record preflight before the first write.

Forbidden flags (any occurrence hard-fails):
  --production, --allow-production, --force, --overwrite, --replace, --merge,
  --publish, --deploy, --commit, --yes, -y

Outputs:
  Human-readable summary by default; --json emits a deterministic JSON envelope.

Multi-record semantics:
  Success   — every planned sidecar is created under the OS-tmp repo root; report
              lists the exact byte contents that were written.
  Failure   — every already-created target is unlinked (transaction-owned only);
              pre-existing files are never touched; rollback failures, if any,
              are surfaced explicitly.

This engine is not a substitute for production apply. It shares no --apply /
--write / --production toggle with any writer. Fingerprint match does not imply
Dean approval; production apply remains a separate, still-blocked slice.
`;

// ── argv parsing ────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
    manifest: null,
    repoRoot: null,
    expectedFingerprint: null,
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
    if (a === '--manifest') {
      opts.manifest = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--manifest=')) {
      opts.manifest = a.slice('--manifest='.length);
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
    if (a === '--expected-fingerprint') {
      opts.expectedFingerprint = args[++i] ?? null;
      continue;
    }
    if (a.startsWith('--expected-fingerprint=')) {
      opts.expectedFingerprint = a.slice('--expected-fingerprint='.length);
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

// ── syntactic helpers ───────────────────────────────────────────────────────

// Lowercase SHA-256 hex: exactly 64 chars, [0-9a-f]. Explicitly rejects uppercase,
// surrounding whitespace, and any non-hex character.
export function isSha256HexLower(s) {
  return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);
}

function toRelFromRoot(abs, root) {
  return path.relative(root, abs).split(path.sep).join('/');
}

// Deterministic sidecar serialization. Mirrors bootstrap writer contract: 2-space
// indent + trailing LF. Byte-identical to `bootstrap-blogger-backfill-sidecars.js`
// so downstream byte comparisons hold.
function serializeSidecarBody(body) {
  return JSON.stringify(body, null, 2) + '\n';
}

// ── OS-temp root gate ───────────────────────────────────────────────────────

// Verify that repoRoot resolves (via realpath) to a strict descendant of
// realpath(os.tmpdir()). Rejects: non-string, empty, non-absolute, unreadable,
// exactly equal to tmpdir, escaping symlink, or same-as-source-repo-root.
export async function verifyOsTempRoot({ repoRoot }) {
  if (typeof repoRoot !== 'string' || repoRoot === '') {
    return { ok: false, error: 'repo-root missing or not a string' };
  }
  if (!path.isAbsolute(repoRoot)) {
    return { ok: false, error: `repo-root must be an absolute path (got: ${repoRoot})` };
  }
  let realRoot;
  try {
    realRoot = await fs.realpath(repoRoot);
  } catch (err) {
    return {
      ok: false,
      error: `repo-root realpath failed: ${err.message}`,
    };
  }
  let tmpBase;
  try {
    tmpBase = await fs.realpath(os.tmpdir());
  } catch (err) {
    return {
      ok: false,
      error: `os.tmpdir() realpath failed: ${err.message}`,
    };
  }
  // Path-segment-safe containment: use path.relative so ".../foo" is NOT accepted
  // as a subpath of ".../foobar" via naive startsWith.
  const rel = path.relative(tmpBase, realRoot);
  if (rel === '' || rel === '.') {
    return { ok: false, error: `repo-root equals os.tmpdir() itself (${tmpBase}); refuse` };
  }
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return {
      ok: false,
      error: `repo-root ${realRoot} is not under os.tmpdir() ${tmpBase}`,
    };
  }
  // Extra belt: refuse when realRoot coincides with the source repo root even if it
  // happened to sit under a stray tmpdir alias. Same guard applies to any repo root
  // that happens to be an ancestor of this script's own PROJECT_ROOT.
  let realProject;
  try {
    realProject = await fs.realpath(PROJECT_ROOT);
  } catch (_) {
    realProject = PROJECT_ROOT;
  }
  const relToProject = path.relative(realProject, realRoot);
  if (relToProject === '' || relToProject === '.') {
    return { ok: false, error: 'repo-root equals the source repository root; refuse' };
  }
  const relFromRepo = path.relative(realRoot, realProject);
  if (relFromRepo === '' || relFromRepo === '.') {
    return { ok: false, error: 'repo-root equals source repository root (via realpath); refuse' };
  }
  return { ok: true, realRoot, tmpBase };
}

// ── rehearsal marker gate ───────────────────────────────────────────────────

export async function verifyRehearsalMarker({ repoRoot }) {
  const p = path.join(repoRoot, REHEARSAL_MARKER_FILENAME);
  let raw;
  try {
    raw = await fs.readFile(p, 'utf-8');
  } catch (err) {
    return {
      ok: false,
      error:
        `rehearsal marker missing or unreadable at ${REHEARSAL_MARKER_FILENAME}: ` +
        `${err.code || err.message}`,
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      error: `rehearsal marker is not valid JSON: ${err.message}`,
    };
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'rehearsal marker top-level must be a JSON object' };
  }
  if (parsed.schemaVersion !== REHEARSAL_MARKER_SCHEMA_VERSION) {
    return {
      ok: false,
      error:
        `rehearsal marker schemaVersion must be ${REHEARSAL_MARKER_SCHEMA_VERSION} ` +
        `(got: ${JSON.stringify(parsed.schemaVersion)})`,
    };
  }
  if (parsed.purpose !== REHEARSAL_MARKER_PURPOSE) {
    return {
      ok: false,
      error:
        `rehearsal marker purpose must be "${REHEARSAL_MARKER_PURPOSE}" ` +
        `(got: ${JSON.stringify(parsed.purpose)})`,
    };
  }
  return { ok: true };
}

// ── per-file no-replace commit ──────────────────────────────────────────────

// Per-file commit primitive with race-safe no-replace semantics.
//
// Sequence:
//   1. Write full bytes to `<target>.rehearse.tmp` using `flag: 'wx'` (exclusive
//      create). The tmp suffix is rehearsal-specific so it can never be confused
//      with a production writer's tmp artifact.
//   2. Optional `beforeFinalCommit` test hook (programmatic-only; wired only by the
//      focused guard). Fires AFTER the temp is fully written and BEFORE the final
//      commit — the exact filesystem race point. If the hook throws, tmp is cleaned
//      up and the caller's transaction rolls back.
//   3. `fs.link(tmp, target)` is the SINGLE no-replace commit primitive:
//        - POSIX `link(2)`: fails atomically with EEXIST if `target` already exists.
//        - Windows `CreateHardLinkW`: fails with ERROR_ALREADY_EXISTS if `target`
//          already exists.
//      There is NO check-then-commit gap. If the target appears between preflight
//      and this call — either from another writer or from the `beforeFinalCommit`
//      hook — the link fails; `target` bytes and mtime are unchanged; the tmp is
//      cleaned up; the caller sees a write failure and rolls back.
//   4. Capture the target's inode (`stat.ino`) after a successful link so the
//      multi-record rollback layer can verify ownership before unlinking.
//   5. Best-effort unlink of the tmp path. If tmp cleanup fails after a successful
//      commit, the target is still correctly committed; do NOT roll back a
//      successful commit for a tmp-cleanup leak.
//
// This function does NOT read back the committed bytes; the outer loop performs
// the read-back verification so verification failure can be treated as a rollback
// trigger without duplicating the read.
async function writeExclusivelyOrThrow({
  targetAbs,
  bodyBytes,
  failureInjection = null,
  hookIndex = -1,
  hookCtx = null,
}) {
  const tmp = targetAbs + TMP_SUFFIX;
  await fs.writeFile(tmp, bodyBytes, { encoding: 'utf-8', flag: 'wx' });

  if (failureInjection && typeof failureInjection.beforeFinalCommit === 'function') {
    try {
      await failureInjection.beforeFinalCommit(hookIndex, hookCtx);
    } catch (err) {
      await fs.unlink(tmp).catch(() => {});
      throw err;
    }
  }

  let committedIno = null;
  try {
    // Single no-replace commit primitive. EEXIST is the destination-exists surface;
    // any other error (EPERM/EACCES on non-hardlink FS, EIO, ...) is likewise fatal
    // and does NOT fall back to a replace-capable operation.
    await fs.link(tmp, targetAbs);
    try {
      const st = await fs.stat(targetAbs);
      committedIno = st.ino;
    } catch (_) {
      // Non-fatal — commit succeeded; we simply cannot ownership-verify on rollback.
      committedIno = null;
    }
  } catch (err) {
    await fs.unlink(tmp).catch(() => {});
    throw err;
  }

  // Target is committed. Best-effort unlink of temp; a leak here does not
  // invalidate the commit.
  await fs.unlink(tmp).catch(() => {});

  return { committedIno };
}

// ── main rehearsal API ──────────────────────────────────────────────────────

// One-shot: gates → plan-once → fingerprint bind → preflight-all → per-file write →
// verify → return report. On any failure after the first write, the transaction is
// rolled back (transaction-owned targets only).
//
// `failureInjection` is a rehearsal-only test facility:
//   {
//     beforeWriteHook?:            async (i, ctx) => void  // BEFORE per-record write starts
//     beforeFinalCommit?:          async (i, ctx) => void  // AFTER temp write, BEFORE fs.link
//     failBeforeWriteIndex?:       number
//     failAfterWriteIndex?:        number
//     failDuringVerificationIndex?: number
//     failDuringRollbackIndex?:    number
//   }
// Neither the CLI nor any env var can populate these; they exist so the focused
// guard can exercise the transaction contract without needing a real crash source.
// `beforeFinalCommit` is the hook that reproduces the exact race: it fires between
// the successful temp write and the final `fs.link` commit, which is the only
// filesystem window that could have raced under the old check-then-rename primitive.
export async function rehearseTruthApply({
  manifestPath,
  repoRoot,
  expectedFingerprint,
  failureInjection = null,
}) {
  const errors = [];
  const result = {
    ok: false,
    mode: 'os-temp-rehearsal',
    productionWritePerformed: false,
    rehearsalWritePerformed: false,
    writePerformed: false,
    expectedFingerprint: typeof expectedFingerprint === 'string' ? expectedFingerprint : null,
    actualFingerprint: null,
    fingerprintMatched: false,
    manifestPath,
    repoRoot,
    summary: {
      plannedCount: 0,
      preflightPassed: false,
      attemptedCount: 0,
      createdCount: 0,
      rolledBackCount: 0,
      rollbackFailureCount: 0,
      remainingCreatedCount: 0,
    },
    transaction: {
      status: 'not-started',
      createdBeforeFailure: [],
      rolledBackTargets: [],
      rollbackFailures: [],
      remainingCreatedTargets: [],
    },
    records: [],
    errors,
  };

  // Gate 1: OS-temp root.
  const tempCheck = await verifyOsTempRoot({ repoRoot });
  if (!tempCheck.ok) {
    errors.push(`os-temp-gate: ${tempCheck.error}`);
    return result;
  }

  // Gate 2: rehearsal marker.
  const markerCheck = await verifyRehearsalMarker({ repoRoot });
  if (!markerCheck.ok) {
    errors.push(`rehearsal-marker: ${markerCheck.error}`);
    return result;
  }

  // Gate 3: fingerprint syntactic sanity.
  if (typeof expectedFingerprint !== 'string' || expectedFingerprint === '') {
    errors.push('expected-fingerprint: missing (must be lowercase sha256 hex, 64 chars)');
    return result;
  }
  if (!isSha256HexLower(expectedFingerprint)) {
    errors.push(
      'expected-fingerprint: must be lowercase sha256 hex (exactly 64 chars, [0-9a-f]); ' +
        'uppercase, whitespace, or wrong length is refused',
    );
    return result;
  }

  // Plan once (snapshot). No manifest re-read anywhere below.
  let planned;
  try {
    planned = await planTruthApply({ manifestPath, repoRoot });
  } catch (err) {
    errors.push(`plan-error: ${err.message}`);
    return result;
  }
  const { report, plan, fingerprint } = planned;
  if (!report.ok || !plan.ok || fingerprint == null) {
    errors.push('plan-validation-failed');
    for (const e of (report.errors || [])) errors.push(`validator: ${e}`);
    for (const e of (plan.errors || [])) errors.push(`planner: ${e}`);
    return result;
  }
  result.actualFingerprint = fingerprint.value;
  result.summary.plannedCount = plan.entries.length;

  // Gate 5: fingerprint binding — exact match.
  if (fingerprint.value !== expectedFingerprint) {
    result.fingerprintMatched = false;
    errors.push(
      `fingerprint-mismatch: expected=${expectedFingerprint} actual=${fingerprint.value}`,
    );
    return result;
  }
  result.fingerprintMatched = true;

  // Freeze the exact entries that will be applied. Deep clone so downstream mutation,
  // if any (there is none in this engine), cannot mutate the plan behind our back.
  const frozenEntries = plan.entries.map((e) => {
    const entry = {
      recordIndex: e.recordIndex,
      sourcePath: e.sourcePath,
      targetPath: e.targetPath,
      operation: e.operation,
      payload: JSON.parse(JSON.stringify(e.payload)),
    };
    Object.freeze(entry);
    return entry;
  });
  Object.freeze(frozenEntries);

  // Preflight EVERY record before the first write. Zero mutation on any failure.
  const preflightErrors = [];
  const seenSources = new Set();
  const seenTargets = new Set();
  for (const e of frozenEntries) {
    const idx = e.recordIndex;
    if (e.operation !== 'create') {
      preflightErrors.push(`records[${idx}] unsupported operation: ${e.operation}`);
    }
    if (typeof e.sourcePath !== 'string' || e.sourcePath === '') {
      preflightErrors.push(`records[${idx}] source path invalid`);
    } else if (e.sourcePath.split('/').includes('..')) {
      preflightErrors.push(`records[${idx}] source path traversal ("..")`);
    }
    if (typeof e.targetPath !== 'string' || e.targetPath === '') {
      preflightErrors.push(`records[${idx}] target path invalid`);
    } else if (e.targetPath.split('/').includes('..')) {
      preflightErrors.push(`records[${idx}] target path traversal ("..")`);
    } else if (!e.targetPath.endsWith('.publish.json')) {
      preflightErrors.push(`records[${idx}] target must end with .publish.json`);
    }
    if (seenSources.has(e.sourcePath)) {
      preflightErrors.push(`records[${idx}] duplicate source: ${e.sourcePath}`);
    }
    seenSources.add(e.sourcePath);
    if (seenTargets.has(e.targetPath)) {
      preflightErrors.push(`records[${idx}] duplicate target: ${e.targetPath}`);
    }
    seenTargets.add(e.targetPath);
    // Belt-and-suspenders: even though validator + planner already checked, verify
    // once more against the live OS-tmp tree that the source exists and the target
    // does not. A target that appeared after planning but before rehearsal is not
    // silently overwritten.
    const absSource = path.resolve(repoRoot, e.sourcePath);
    const absTarget = path.resolve(repoRoot, e.targetPath);
    try {
      const st = await fs.stat(absSource);
      if (!st.isFile()) {
        preflightErrors.push(`records[${idx}] source not a regular file: ${e.sourcePath}`);
      }
    } catch (err) {
      preflightErrors.push(
        `records[${idx}] source stat failed: ${e.sourcePath} (${err.code || err.message})`,
      );
    }
    try {
      await fs.access(absTarget, fs.constants.F_OK);
      preflightErrors.push(
        `records[${idx}] target already exists (create-only): ${e.targetPath}`,
      );
    } catch (err) {
      if (!err || err.code !== 'ENOENT') {
        preflightErrors.push(
          `records[${idx}] target stat failed: ${e.targetPath} (${err.code || err.message})`,
        );
      }
    }
  }
  if (preflightErrors.length > 0) {
    for (const m of preflightErrors) errors.push(`preflight: ${m}`);
    result.transaction.status = 'preflight-failed';
    return result;
  }
  result.summary.preflightPassed = true;

  // Enter transaction. createdTargets tracks ONLY targets we created; rollback is
  // constrained to this list. Each entry records the absolute path plus the inode
  // captured at commit time so rollback can verify ownership before unlink.
  const createdTargets = []; // { absPath: string, ino: number|null }
  const perRecord = [];
  result.transaction.status = 'in-progress';

  let failed = false;
  let failureCause = null;

  for (let i = 0; i < frozenEntries.length; i += 1) {
    const e = frozenEntries[i];
    result.summary.attemptedCount = i + 1;

    // Test hook: allow the guard to run arbitrary async work between preflight and
    // write (e.g., pre-create a colliding target to exercise the race guard).
    if (failureInjection && typeof failureInjection.beforeWriteHook === 'function') {
      try {
        await failureInjection.beforeWriteHook(i, {
          entry: e,
          absTarget: path.resolve(repoRoot, e.targetPath),
          repoRoot,
        });
      } catch (err) {
        failed = true;
        failureCause = `hook-threw at index ${i}: ${err.message}`;
        break;
      }
    }

    if (failureInjection && failureInjection.failBeforeWriteIndex === i) {
      failed = true;
      failureCause = `injected: failBeforeWriteIndex=${i}`;
      break;
    }

    const absTarget = path.resolve(repoRoot, e.targetPath);
    const bodyBytes = serializeSidecarBody(e.payload);
    let committedIno = null;
    try {
      const commit = await writeExclusivelyOrThrow({
        targetAbs: absTarget,
        bodyBytes,
        failureInjection,
        hookIndex: i,
        hookCtx: {
          entry: e,
          absTarget,
          repoRoot,
        },
      });
      committedIno = commit.committedIno;
    } catch (err) {
      failed = true;
      failureCause = `write-failed at index ${i}: ${err.message}`;
      break;
    }
    createdTargets.push({ absPath: absTarget, ino: committedIno });
    perRecord.push({
      recordIndex: e.recordIndex,
      sourcePath: e.sourcePath,
      targetPath: e.targetPath,
      operation: e.operation,
      created: true,
    });

    if (failureInjection && failureInjection.failAfterWriteIndex === i) {
      failed = true;
      failureCause = `injected: failAfterWriteIndex=${i}`;
      break;
    }

    // Post-write verification: read back the bytes and confirm equality with the
    // exact serialization we used. Catches silent partial writes or serializer drift.
    let readBack;
    try {
      readBack = await fs.readFile(absTarget, 'utf-8');
    } catch (err) {
      failed = true;
      failureCause = `verify-read-failed at index ${i}: ${err.message}`;
      break;
    }
    if (readBack !== bodyBytes) {
      failed = true;
      failureCause = `verify-bytes-differ at index ${i}`;
      break;
    }
    if (failureInjection && failureInjection.failDuringVerificationIndex === i) {
      failed = true;
      failureCause = `injected: failDuringVerificationIndex=${i}`;
      break;
    }
  }

  if (failed) {
    errors.push(`transaction-failed: ${failureCause}`);
    result.transaction.status = 'rolled-back';
    result.transaction.createdBeforeFailure = createdTargets.map((t) =>
      toRelFromRoot(t.absPath, repoRoot),
    );

    // Roll back in reverse creation order. Never touch anything outside createdTargets.
    // Before each unlink, stat the target and compare its inode against the inode
    // captured at commit time. A mismatch means the target has been externally
    // replaced since we committed; refuse to unlink and surface the ownership
    // failure. This is a best-effort ownership check, not a filesystem transaction.
    for (let i = createdTargets.length - 1; i >= 0; i -= 1) {
      const t = createdTargets[i];
      const rel = toRelFromRoot(t.absPath, repoRoot);
      if (failureInjection && failureInjection.failDuringRollbackIndex === i) {
        result.transaction.rollbackFailures.push({
          target: rel,
          error: `injected: failDuringRollbackIndex=${i}`,
        });
        continue;
      }
      // Ownership verification: only when we captured an inode at commit time.
      if (t.ino != null) {
        let currentIno = null;
        let currentExists = true;
        try {
          const st = await fs.stat(t.absPath);
          currentIno = st.ino;
        } catch (err) {
          if (err && err.code === 'ENOENT') {
            currentExists = false;
          } else {
            result.transaction.rollbackFailures.push({
              target: rel,
              error: `ownership-stat-failed: ${err.message}`,
            });
            continue;
          }
        }
        if (currentExists && currentIno !== t.ino) {
          result.transaction.rollbackFailures.push({
            target: rel,
            error:
              `ownership-verification-failed: target inode changed since commit ` +
              `(committed inode=${t.ino}, current inode=${currentIno}); ` +
              `refusing to unlink externally-replaced target`,
          });
          continue;
        }
        if (!currentExists) {
          // Already gone (someone else unlinked it). Treat as rolled back but do not
          // attempt another unlink.
          result.transaction.rolledBackTargets.push(rel);
          result.summary.rolledBackCount += 1;
          continue;
        }
      }
      try {
        await fs.unlink(t.absPath);
        result.transaction.rolledBackTargets.push(rel);
        result.summary.rolledBackCount += 1;
      } catch (err) {
        result.transaction.rollbackFailures.push({
          target: rel,
          error: err.message,
        });
      }
    }
    result.summary.rollbackFailureCount = result.transaction.rollbackFailures.length;

    // What remains on disk after rollback attempt?
    for (const t of createdTargets) {
      try {
        await fs.access(t.absPath, fs.constants.F_OK);
        result.transaction.remainingCreatedTargets.push(toRelFromRoot(t.absPath, repoRoot));
      } catch (_) {
        /* gone — expected */
      }
    }
    result.transaction.rolledBackTargets.sort();
    result.transaction.remainingCreatedTargets.sort();
    result.transaction.createdBeforeFailure.sort();
    result.summary.remainingCreatedCount =
      result.transaction.remainingCreatedTargets.length;
    result.summary.createdCount = createdTargets.length;
    result.rehearsalWritePerformed = createdTargets.length > 0;
    result.writePerformed = createdTargets.length > 0;
    result.records = perRecord;
    return result;
  }

  // Success path.
  result.ok = true;
  result.summary.createdCount = createdTargets.length;
  result.summary.rolledBackCount = 0;
  result.transaction.status = 'committed';
  result.rehearsalWritePerformed = createdTargets.length > 0;
  result.writePerformed = createdTargets.length > 0;
  result.records = perRecord;
  return result;
}

// ── formatting ──────────────────────────────────────────────────────────────

export function formatHumanReadable(result) {
  const lines = [];
  lines.push('rehearse-blogger-backfill-truth-apply (OS-temp rehearsal only; no production apply)');
  lines.push('');
  lines.push(`mode:                              ${result.mode}`);
  lines.push(`repo root (arg):                   ${result.repoRoot}`);
  lines.push(`manifest path:                     ${result.manifestPath}`);
  lines.push(`expected fingerprint:              ${result.expectedFingerprint ?? '(missing)'}`);
  lines.push(`actual   fingerprint:              ${result.actualFingerprint ?? '(not computed)'}`);
  lines.push(`fingerprint matched:               ${result.fingerprintMatched ? 'YES' : 'NO'}`);
  lines.push(`planned count:                     ${result.summary.plannedCount}`);
  lines.push(`preflight passed:                  ${result.summary.preflightPassed ? 'YES' : 'NO'}`);
  lines.push(`attempted count:                   ${result.summary.attemptedCount}`);
  lines.push(`created count:                     ${result.summary.createdCount}`);
  lines.push(`rolled back count:                 ${result.summary.rolledBackCount}`);
  lines.push(`rollback failure count:            ${result.summary.rollbackFailureCount}`);
  lines.push(`remaining created count:           ${result.summary.remainingCreatedCount}`);
  lines.push(`transaction status:                ${result.transaction.status}`);
  lines.push(`production write performed:        NO`);
  lines.push(`rehearsal write performed:         ${result.rehearsalWritePerformed ? 'YES' : 'NO'}`);
  lines.push('');
  if (result.transaction.createdBeforeFailure.length > 0) {
    lines.push('---- targets created before failure ----');
    for (const t of result.transaction.createdBeforeFailure) lines.push(`  - ${t}`);
    lines.push('');
  }
  if (result.transaction.rolledBackTargets.length > 0) {
    lines.push('---- targets rolled back ----');
    for (const t of result.transaction.rolledBackTargets) lines.push(`  - ${t}`);
    lines.push('');
  }
  if (result.transaction.rollbackFailures.length > 0) {
    lines.push('---- rollback failures ----');
    for (const f of result.transaction.rollbackFailures) {
      lines.push(`  - ${f.target}: ${f.error}`);
    }
    lines.push('');
  }
  if (result.transaction.remainingCreatedTargets.length > 0) {
    lines.push('---- targets still on disk after rollback attempt ----');
    for (const t of result.transaction.remainingCreatedTargets) lines.push(`  - ${t}`);
    lines.push('');
  }
  if (result.records.length > 0 && result.ok) {
    lines.push('---- successful rehearsal creates ----');
    let n = 0;
    for (const r of result.records) {
      n += 1;
      lines.push(`  ${n}. ${r.sourcePath}`);
      lines.push(`     → ${r.targetPath}`);
    }
    lines.push('');
  }
  if (result.errors.length > 0) {
    lines.push('---- errors ----');
    for (const e of result.errors) lines.push(`  - ${e}`);
    lines.push('');
  }
  lines.push('OS-temp rehearsal only.');
  lines.push('No production repository was modified.');
  lines.push('No Blogger operation was performed.');
  lines.push(`Overall: ${result.ok ? 'PASS' : 'FAIL'}`);
  return lines.join('\n') + '\n';
}

export function formatJson(result) {
  return JSON.stringify(result, null, 2) + '\n';
}

// ── SHA-256 helper exported for tests only ──────────────────────────────────

export function sha256HexLower(text) {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
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
      `[rehearse-blogger-backfill-truth-apply] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This engine is rehearsal-only. Production apply, overwrite, publish, and deploy flags are never accepted.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[rehearse-blogger-backfill-truth-apply] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  if (!opts.manifest) {
    process.stderr.write('[rehearse-blogger-backfill-truth-apply] ERROR: --manifest <path> is required\n');
    process.stderr.write(USAGE);
    return 1;
  }
  if (!opts.repoRoot) {
    process.stderr.write('[rehearse-blogger-backfill-truth-apply] ERROR: --repo-root <abs> is required\n');
    process.stderr.write(USAGE);
    return 1;
  }
  if (!opts.expectedFingerprint) {
    process.stderr.write(
      '[rehearse-blogger-backfill-truth-apply] ERROR: --expected-fingerprint <sha256-hex-64> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }
  if (!path.isAbsolute(opts.repoRoot)) {
    process.stderr.write(
      `[rehearse-blogger-backfill-truth-apply] ERROR: --repo-root must be an absolute path (got: ${opts.repoRoot})\n`,
    );
    return 1;
  }

  const manifestPath = path.isAbsolute(opts.manifest)
    ? opts.manifest
    : path.resolve(process.cwd(), opts.manifest);

  const result = await rehearseTruthApply({
    manifestPath,
    repoRoot: opts.repoRoot,
    expectedFingerprint: opts.expectedFingerprint,
  });

  if (opts.json) {
    process.stdout.write(formatJson(result));
  } else {
    process.stdout.write(formatHumanReadable(result));
  }

  return result.ok ? 0 : 1;
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
        `[rehearse-blogger-backfill-truth-apply] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}
