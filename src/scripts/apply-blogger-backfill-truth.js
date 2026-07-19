#!/usr/bin/env node
// Phase 20260719：Blogger backfill truth apply — authorization-bound single-record production capability.
//
// Purpose:
//   Provide a production apply capability that, only when EVERY gate passes, creates ONE
//   `.publish.json` sidecar in the real repository. Every gate is fail-closed; every write is
//   create-only + no-replace + read-back verified. Authorization is a required external document
//   whose fields bind the source repo HEAD, expected plan fingerprint, expected per-record
//   fingerprint, exact target path, and record count. This slice IMPLEMENTS the capability but
//   does NOT execute production apply; no production authorization document exists; the six
//   missing sidecars remain unwritten.
//
// Pipeline position:
//   missing-sidecar planner
//     → optional create-only bootstrap
//     → truth-manifest template generator
//     → truth-manifest intake validator          (validate:blogger-backfill-truth-manifest)
//     → validated apply-plan gate                (plan:blogger-backfill-truth-apply)
//     → fingerprint-bound OS-temp rehearsal      (rehearse:blogger-backfill-truth-apply)
//     → **this slice** — authorization-bound single-record production apply capability
//                                                 (apply:blogger-backfill-truth)
//     → future production execution              (each apply invocation still requires Dean-authored
//                                                 authorization + explicit approval; commit/push are
//                                                 separate manual steps that this capability never
//                                                 performs)
//
// Upstream authorities:
//   - `docs/publish-json-schema.md` §5 / §8 / §9 (sidecar schema, published-required fields)
//   - `docs/20260706-blogger-identity-and-backfill-strategy.md` §A (identity layering; do not guess)
//   - `docs/20260719-blogger-backfill-sidecar-identity-contract-audit.md` (bloggerPostId: "" contract)
//   - `docs/20260719-blogger-backfill-truth-apply-plan.md` (validated apply-plan + plan fingerprint)
//   - `docs/20260719-blogger-backfill-truth-apply-rehearsal.md` (no-replace primitive + rollback semantics)
//   - `src/scripts/admin-git-safety-preflight.js` (branch/HEAD/ahead-behind/clean/index-lock gate)
//
// Safety contract (fail-closed; hard-coded):
//   - Single-record semantics (Decision A). Each invocation creates AT MOST one `.publish.json`.
//     Multi-record batch is intentionally not supported: best-effort compensating rollback for
//     multiple files is not crash-safe, so it is out of scope for production apply until a
//     crash-safe transaction primitive lands.
//   - `--apply` is required. `--authorization` is required. `--manifest` is required.
//     `--source-path` is required (repo-relative, POSIX-style, under `content/blogger/posts/`).
//   - Authorization document (external JSON) must supply:
//       schemaVersion (===1)
//       purpose (===AUTHORIZATION_PURPOSE)
//       repository.expectedHead (40-char lowercase hex git SHA)
//       repository.expectedBranch (===AUTHORIZATION_BRANCH === 'main')
//       plan.expectedPlanFingerprint (64-char lowercase hex sha256)
//       plan.expectedRecordFingerprint (64-char lowercase hex sha256)
//       plan.recordCount (===1)
//       targets (array of length 1; element is repo-relative POSIX path
//              under `content/blogger/posts/`, ending with `.publish.json`)
//       approval.explicitlyAuthorized (strict boolean true)
//   - Unknown top-level, unknown subobject key, missing field, wrong type,
//     whitespace-padded scalar, uppercase hex, or wrong length hex → hard-fail.
//   - No `--repo-root` / `--dry-run` / `--test-root` / `--force` / `--overwrite` /
//     `--replace` / `--merge` / `--yes` / `-y` / `--all` / `--auto-approve` /
//     `--skip-validation` / `--skip-fingerprint` / `--ignore-head` / `--dirty-ok` /
//     `--no-verify` / `--production` / `--publish` / `--deploy` / `--commit` /
//     `--push` on the CLI. Any occurrence → hard-fail.
//   - Repository state gate reuses `evaluatePreflight()` from admin-git-safety-preflight.js:
//     branch === 'main', HEAD === origin/main, ahead/behind === 0/0, working tree clean,
//     `.git/index.lock` absent. Additionally, the resolved HEAD must equal
//     `authorization.repository.expectedHead`, and the branch must equal
//     `authorization.repository.expectedBranch`.
//   - Plan is generated exactly once via `planTruthApply({manifestPath, repoRoot: projectRoot})`.
//     The engine NEVER re-reads the manifest, NEVER re-derives targets, NEVER re-constructs
//     payloads, and NEVER shells out for planner composition.
//   - Plan fingerprint must equal `authorization.plan.expectedPlanFingerprint`; per-record
//     fingerprint of the selected record must equal `authorization.plan.expectedRecordFingerprint`.
//     Mismatch → refuse; zero writes.
//   - Record selection: `--source-path` must correspond to exactly one plan entry. Zero or
//     multiple matches → hard-fail.
//   - Target list binding: `authorization.targets[0]` must equal the selected entry's targetPath.
//   - Per-file write primitive (no-replace commit; identical semantics to rehearsal engine):
//       1. Write full bytes to `<target>.production-apply.tmp` with `flag: 'wx'`.
//       2. `fs.link(tmp, target)` — sole no-replace commit primitive. EEXIST on both POSIX
//          (`link(2)`) and Windows (`CreateHardLinkW`) if `target` already exists.
//       3. `fs.stat(target).ino` — capture inode for compensating unlink ownership check.
//       4. Best-effort `unlink(tmp)`; tmp cleanup failure does NOT roll back a successful commit.
//       5. `fs.readFile(target)` byte-equality against the exact serialization.
//     On write failure: unlink tmp; target unchanged. On read-back verification failure:
//     compensating unlink of target using inode ownership check; if inode differs, refuse
//     unlink and surface the ownership failure.
//   - `productionWritePerformed`, `writePerformed`, and `commitPerformed` semantics:
//       * On success: productionWritePerformed=true, writePerformed=true, commitPerformed=false,
//         pushPerformed=false, repositoryNowDirty=true (git will show the new file as untracked).
//       * On any failed gate before write: all three false; repositoryNowDirty reflects preflight.
//       * On verification failure + successful compensating unlink: productionWritePerformed=false,
//         writePerformed=false; error surfaced.
//       * On verification failure + FAILED compensating unlink: productionWritePerformed=true
//         (target still on disk); error surfaced with both the verification failure and the
//         rollback failure.
//   - No network. No child_process (except transitively via admin-git-safety-preflight.js
//     which is the vetted read-only git subcommand runner). No Blogger / Google / GA4 / AdSense
//     API. No build. No deploy. No dist-* mutation. No preview mutation. No fetch. No pull.
//     No reset. No clean. No stash. No checkout. No switch. No git commit. No git push.
//   - This capability does NOT authorize apply by itself. It ENFORCES that a Dean-supplied
//     authorization document was supplied. Anyone with repo write access can already mutate
//     the tree; authorization is operational safety and auditability, not a cryptographic
//     boundary.
//
// What this slice explicitly does NOT do:
//   - Execute production apply (this Session).
//   - Create a production authorization document.
//   - Modify any production `.publish.json` (this Session).
//   - Modify any production Markdown.
//   - Fabricate `bloggerPostId` — payload keeps `bloggerPostId: ""` per identity contract A.3.
//   - Build / deploy / preview / mutate `dist-*` / `dist-blogger-preview/`.
//   - Call Blogger / Google / GA4 / AdSense API.
//   - Automatically git-add / git-commit / git-push after apply. Repo will be dirty; commit
//     and push are separate authorized steps that this capability never performs.
//   - Upgrade any warning-only guard to blocking.
//
// Usage:
//   npm run apply:blogger-backfill-truth -- \
//     --manifest <path> \
//     --source-path <content/blogger/posts/<slug>.md> \
//     --authorization <path> \
//     --apply \
//     [--json] [--help]
//
// Exit codes:
//   0  Every gate passed; sidecar created; read-back verified.
//   1  Any gate refused, planner/validator failed, fingerprint mismatch, HEAD mismatch,
//      dirty tree, preflight refused, target already exists, write failed, verification
//      failed (with or without successful rollback), CLI misuse, unknown flag.

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { planTruthApply, PLAN_SCHEMA_VERSION } from './plan-blogger-backfill-truth-apply.js';
import { evaluatePreflight } from './admin-git-safety-preflight.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// ── constants ───────────────────────────────────────────────────────────────

export const AUTHORIZATION_SCHEMA_VERSION = 1;
export const AUTHORIZATION_PURPOSE = 'blogger-backfill-production-sidecar-apply';
export const AUTHORIZATION_BRANCH = 'main';
export const CAPABILITY_MODE = 'production-sidecar-create';
const ALLOWED_SOURCE_PREFIX = 'content/blogger/posts/';
const TARGET_SUFFIX = '.publish.json';
const TMP_SUFFIX = '.production-apply.tmp';

// Allowed authorization structure. Missing key, unknown key, wrong type → hard-fail.
const ALLOWED_AUTH_TOP_KEYS = new Set([
  'schemaVersion', 'purpose', 'repository', 'plan', 'targets', 'approval',
]);
const ALLOWED_AUTH_REPO_KEYS = new Set(['expectedHead', 'expectedBranch']);
const ALLOWED_AUTH_PLAN_KEYS = new Set([
  'expectedPlanFingerprint', 'expectedRecordFingerprint', 'recordCount',
]);
const ALLOWED_AUTH_APPROVAL_KEYS = new Set(['explicitlyAuthorized']);

// Mutation-like or bypass flags rejected up-front. Any occurrence fail-closes with exit 1.
const FORBIDDEN_FLAGS = new Set([
  '--force', '--overwrite', '--replace', '--merge',
  '--yes', '-y', '--all', '--auto-approve',
  '--skip-validation', '--skip-fingerprint', '--ignore-head', '--dirty-ok',
  '--no-verify',
  '--production', '--publish', '--deploy',
  '--commit', '--push',
  '--dry-run',
  '--repo-root', '--project-root', '--test-root',
]);

const USAGE = `Usage: apply-blogger-backfill-truth \\
  --manifest <path> \\
  --source-path <content/blogger/posts/<slug>.md> \\
  --authorization <path> \\
  --apply \\
  [--json] [--help]

Authorization-bound single-record production apply capability for a Dean-populated
Blogger backfill truth manifest. Each invocation creates AT MOST ONE
\`.publish.json\` sidecar in the real repository, only after every gate passes.

Required flags (missing any → hard-fail):
  --manifest <path>          Repo-relative or absolute path to a validated truth manifest.
  --source-path <path>       Repo-relative POSIX-style path to the source Markdown under
                             ${ALLOWED_SOURCE_PREFIX} that selects a single plan entry.
  --authorization <path>     Repo-relative or absolute path to the external authorization
                             JSON document (see docs/20260719-blogger-backfill-production-
                             apply-capability.md).
  --apply                    Explicit action flag. Missing --apply hard-fails.

Related read-only / rehearsal tools (do NOT use this CLI for those):
  For dry-run review:        use plan:blogger-backfill-truth-apply.
  For OS-temp write exercise: use rehearse:blogger-backfill-truth-apply.

Optional:
  --json                     Emit a deterministic JSON envelope to stdout.
  --help / -h                Print this usage.

Forbidden flags (any occurrence hard-fails):
  --force, --overwrite, --replace, --merge, --yes, -y, --all, --auto-approve,
  --skip-validation, --skip-fingerprint, --ignore-head, --dirty-ok, --no-verify,
  --production, --publish, --deploy, --commit, --push, --dry-run,
  --repo-root, --project-root, --test-root

Unknown flags → hard-fail. There is NO environment-variable override for project root.
Any programmatic test-root injection is available only to the focused guard via the
in-process API and is never exposed on the CLI.

Repository state gate (fail-closed):
  branch == main, HEAD == origin/main, ahead/behind == 0/0, working tree clean,
  .git/index.lock absent. Additionally: HEAD must equal authorization.repository.
  expectedHead. Branch must equal authorization.repository.expectedBranch (== main).

Authorization gate (fail-closed):
  schemaVersion == 1, purpose == "${AUTHORIZATION_PURPOSE}",
  repository.expectedHead is 40-char lowercase hex,
  repository.expectedBranch == "${AUTHORIZATION_BRANCH}",
  plan.expectedPlanFingerprint / expectedRecordFingerprint each 64-char lowercase hex sha256,
  plan.recordCount == 1,
  targets is an array of exactly one repo-relative POSIX path under
  ${ALLOWED_SOURCE_PREFIX} ending with ${TARGET_SUFFIX},
  approval.explicitlyAuthorized is strict boolean true.

Plan / fingerprint binding:
  Plan is generated once via planTruthApply(); fingerprint is compared strictly to the
  authorization's expectedPlanFingerprint. The selected record's per-record fingerprint
  (sha256 over canonical JSON of {planSchemaVersion, manifestSchemaVersion, entry:
  {sourcePath, targetPath, operation, payload}}) is compared strictly to the
  authorization's expectedRecordFingerprint. Any mismatch → zero writes.

Success behavior:
  A single ${TARGET_SUFFIX} sidecar is created at authorization.targets[0].
  productionWritePerformed / writePerformed / repositoryNowDirty become true.
  commitPerformed and pushPerformed remain false.
  git add / git commit / git push are the caller's next explicit steps and are NOT
  performed by this capability.

Failure behavior:
  Any gate refused → zero writes.
  Write failure → tmp cleaned up; target unchanged.
  Read-back verification failure → compensating unlink of target using inode ownership
  check. If inode changed (external replacement), refuse unlink and surface both errors.

This capability does NOT authorize apply by itself. It enforces that a Dean-supplied
authorization document accompanies each invocation. Anyone with repo write access can
mutate the tree; authorization is operational safety and auditability, not a security
boundary.
`;

// ── argv parsing ────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
    apply: false,
    manifest: null,
    sourcePath: null,
    authorization: null,
    forbidden: [],
    unknown: [],
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--help' || a === '-h') { opts.help = true; continue; }
    if (a === '--json') { opts.json = true; continue; }
    if (a === '--apply') { opts.apply = true; continue; }
    if (a === '--manifest') { opts.manifest = args[++i] ?? null; continue; }
    if (a.startsWith('--manifest=')) { opts.manifest = a.slice('--manifest='.length); continue; }
    if (a === '--source-path') { opts.sourcePath = args[++i] ?? null; continue; }
    if (a.startsWith('--source-path=')) {
      opts.sourcePath = a.slice('--source-path='.length);
      continue;
    }
    if (a === '--authorization') { opts.authorization = args[++i] ?? null; continue; }
    if (a.startsWith('--authorization=')) {
      opts.authorization = a.slice('--authorization='.length);
      continue;
    }
    if (FORBIDDEN_FLAGS.has(a)) { opts.forbidden.push(a); continue; }
    const eqIdx = a.indexOf('=');
    if (eqIdx > 0) {
      const bare = a.slice(0, eqIdx);
      if (FORBIDDEN_FLAGS.has(bare)) { opts.forbidden.push(bare); continue; }
    }
    opts.unknown.push(a);
  }
  return opts;
}

// ── syntactic helpers ───────────────────────────────────────────────────────

// Lowercase SHA-256 hex: exactly 64 chars, [0-9a-f].
export function isSha256HexLower(s) {
  return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);
}

// Lowercase 40-char git SHA hex.
export function isGitSha40Lower(s) {
  return typeof s === 'string' && /^[0-9a-f]{40}$/.test(s);
}

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function toRelFromRoot(abs, root) {
  return path.relative(root, abs).split(path.sep).join('/');
}

// Deterministic sidecar serialization. Byte-identical to bootstrap writer + rehearsal
// engine so downstream byte comparisons hold.
function serializeSidecarBody(body) {
  return JSON.stringify(body, null, 2) + '\n';
}

// ── canonical JSON + sha256 (duplicated from plan-blogger-backfill-truth-apply.js) ──
//
// Deliberately duplicated so this capability does not depend on the planner's internal
// helper surface. If the planner's canonicalize algorithm ever changes, the source repo
// HEAD changes; authorization is HEAD-bound; the mismatch surfaces at the repo-state
// gate. Duplication is safer than coupling.

function canonicalize(value) {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`canonicalize: non-finite number not supported: ${value}`);
    }
    return JSON.stringify(value);
  }
  if (t === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    const parts = [];
    for (const k of keys) {
      parts.push(JSON.stringify(k) + ':' + canonicalize(value[k]));
    }
    return '{' + parts.join(',') + '}';
  }
  throw new Error(`canonicalize: unsupported type ${t}`);
}

function sha256Hex(text) {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

// Per-record deterministic fingerprint. Independent of the planner's full-plan
// fingerprint. Binds:
//   planSchemaVersion
//   manifestSchemaVersion
//   entry.sourcePath
//   entry.targetPath
//   entry.operation
//   entry.payload
// Deliberately does NOT bind: absolute path, repo root, timestamps, hostname, OS
// separator, process ID, tempdir. Same inputs → same fingerprint on any host or root.
export function fingerprintEntry(entry, manifestSchemaVersion) {
  const canonical = canonicalize({
    planSchemaVersion: PLAN_SCHEMA_VERSION,
    manifestSchemaVersion,
    entry: {
      sourcePath: entry.sourcePath,
      targetPath: entry.targetPath,
      operation: entry.operation,
      payload: entry.payload,
    },
  });
  return {
    algorithm: 'sha256',
    encoding: 'hex',
    value: sha256Hex(canonical),
  };
}

// ── authorization loader ────────────────────────────────────────────────────

// Strict validator. Every check is fail-closed. No coercion, no trimming, no fallback.
//
// Options:
//   requireApproved (default true)
//     When true (production apply), authorization.approval.explicitlyAuthorized
//     MUST be strict boolean `true`; any other value → ok: false.
//     When false (read-only preflight), authorization.approval.explicitlyAuthorized
//     may be strict boolean `true` OR strict boolean `false`; any non-boolean
//     value still hard-fails. This lets a read-only preflight tool classify
//     an unapproved-but-shape-valid draft as `authorizationDocumentValid: true`
//     while surfacing `explicitlyAuthorized: false` separately. The apply engine
//     itself invariantly calls with the default (requireApproved: true).
//
// The type check (`typeof … === 'boolean'`) is always applied, regardless of
// requireApproved. Truthy non-boolean values (1, "true", "yes", …) always fail.
export async function loadAuthorization(authPath, { requireApproved = true } = {}) {
  if (typeof authPath !== 'string' || authPath === '') {
    return { ok: false, error: 'authorization path missing' };
  }
  let raw;
  try {
    raw = await fs.readFile(authPath, 'utf-8');
  } catch (err) {
    return {
      ok: false,
      error: `authorization read failed: ${err.code || err.message}`,
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: `authorization JSON parse error: ${err.message}` };
  }
  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'authorization top-level must be a JSON object' };
  }
  const unknownTop = Object.keys(parsed).filter((k) => !ALLOWED_AUTH_TOP_KEYS.has(k));
  if (unknownTop.length > 0) {
    return {
      ok: false,
      error: `authorization has unknown top-level field(s): ${unknownTop.join(', ')}`,
    };
  }
  if (parsed.schemaVersion !== AUTHORIZATION_SCHEMA_VERSION) {
    return {
      ok: false,
      error:
        `authorization.schemaVersion must be ${AUTHORIZATION_SCHEMA_VERSION} ` +
        `(got: ${JSON.stringify(parsed.schemaVersion)})`,
    };
  }
  if (parsed.purpose !== AUTHORIZATION_PURPOSE) {
    return {
      ok: false,
      error:
        `authorization.purpose must be "${AUTHORIZATION_PURPOSE}" ` +
        `(got: ${JSON.stringify(parsed.purpose)})`,
    };
  }
  // repository
  if (!isPlainObject(parsed.repository)) {
    return { ok: false, error: 'authorization.repository must be an object' };
  }
  const unknownRepo = Object.keys(parsed.repository).filter(
    (k) => !ALLOWED_AUTH_REPO_KEYS.has(k),
  );
  if (unknownRepo.length > 0) {
    return {
      ok: false,
      error:
        `authorization.repository has unknown field(s): ${unknownRepo.join(', ')}`,
    };
  }
  if (!isGitSha40Lower(parsed.repository.expectedHead)) {
    return {
      ok: false,
      error:
        'authorization.repository.expectedHead must be 40-char lowercase hex git SHA ' +
        '(no whitespace, no uppercase)',
    };
  }
  if (parsed.repository.expectedBranch !== AUTHORIZATION_BRANCH) {
    return {
      ok: false,
      error:
        `authorization.repository.expectedBranch must be "${AUTHORIZATION_BRANCH}" ` +
        `(got: ${JSON.stringify(parsed.repository.expectedBranch)})`,
    };
  }
  // plan
  if (!isPlainObject(parsed.plan)) {
    return { ok: false, error: 'authorization.plan must be an object' };
  }
  const unknownPlan = Object.keys(parsed.plan).filter(
    (k) => !ALLOWED_AUTH_PLAN_KEYS.has(k),
  );
  if (unknownPlan.length > 0) {
    return {
      ok: false,
      error: `authorization.plan has unknown field(s): ${unknownPlan.join(', ')}`,
    };
  }
  if (!isSha256HexLower(parsed.plan.expectedPlanFingerprint)) {
    return {
      ok: false,
      error:
        'authorization.plan.expectedPlanFingerprint must be 64-char lowercase hex sha256',
    };
  }
  if (!isSha256HexLower(parsed.plan.expectedRecordFingerprint)) {
    return {
      ok: false,
      error:
        'authorization.plan.expectedRecordFingerprint must be 64-char lowercase hex sha256',
    };
  }
  if (parsed.plan.recordCount !== 1) {
    return {
      ok: false,
      error:
        'authorization.plan.recordCount must be 1 (single-record production apply only)',
    };
  }
  // targets
  if (!Array.isArray(parsed.targets)) {
    return { ok: false, error: 'authorization.targets must be an array' };
  }
  if (parsed.targets.length !== 1) {
    return {
      ok: false,
      error:
        `authorization.targets must have exactly 1 entry ` +
        `(got: ${parsed.targets.length})`,
    };
  }
  const t = parsed.targets[0];
  if (typeof t !== 'string' || t === '' || t !== t.trim()) {
    return {
      ok: false,
      error: 'authorization.targets[0] must be a non-empty string without surrounding whitespace',
    };
  }
  if (path.isAbsolute(t) || t.includes('\\')) {
    return {
      ok: false,
      error: 'authorization.targets[0] must be repo-relative POSIX-style',
    };
  }
  if (t.split('/').includes('..')) {
    return {
      ok: false,
      error: 'authorization.targets[0] must not contain ".."',
    };
  }
  if (!t.startsWith(ALLOWED_SOURCE_PREFIX)) {
    return {
      ok: false,
      error: `authorization.targets[0] must be within ${ALLOWED_SOURCE_PREFIX}`,
    };
  }
  if (!t.endsWith(TARGET_SUFFIX)) {
    return {
      ok: false,
      error: `authorization.targets[0] must end with ${TARGET_SUFFIX}`,
    };
  }
  // approval
  if (!isPlainObject(parsed.approval)) {
    return { ok: false, error: 'authorization.approval must be an object' };
  }
  const unknownApp = Object.keys(parsed.approval).filter(
    (k) => !ALLOWED_AUTH_APPROVAL_KEYS.has(k),
  );
  if (unknownApp.length > 0) {
    return {
      ok: false,
      error: `authorization.approval has unknown field(s): ${unknownApp.join(', ')}`,
    };
  }
  // Always enforce boolean type. Truthy non-boolean (1, "true", "yes", null, …)
  // always fails regardless of requireApproved.
  if (typeof parsed.approval.explicitlyAuthorized !== 'boolean') {
    return {
      ok: false,
      error:
        'authorization.approval.explicitlyAuthorized must be a boolean',
    };
  }
  if (requireApproved && parsed.approval.explicitlyAuthorized !== true) {
    return {
      ok: false,
      error:
        'authorization.approval.explicitlyAuthorized must be strict boolean true',
    };
  }
  return { ok: true, authorization: parsed };
}

// ── source-path CLI arg validation ──────────────────────────────────────────

function validateSourcePathArg(s) {
  if (typeof s !== 'string' || s === '') {
    return { ok: false, error: '--source-path missing or empty' };
  }
  if (s !== s.trim()) {
    return { ok: false, error: '--source-path has surrounding whitespace' };
  }
  if (path.isAbsolute(s) || s.includes('\\')) {
    return { ok: false, error: '--source-path must be repo-relative POSIX-style' };
  }
  if (s.split('/').includes('..')) {
    return { ok: false, error: '--source-path must not contain ".."' };
  }
  if (!s.startsWith(ALLOWED_SOURCE_PREFIX)) {
    return {
      ok: false,
      error: `--source-path must be within ${ALLOWED_SOURCE_PREFIX}`,
    };
  }
  if (!s.endsWith('.md') || s.endsWith('.fb.md')) {
    return {
      ok: false,
      error: '--source-path must be a Blogger post Markdown (.md, not .fb.md)',
    };
  }
  return { ok: true };
}

// ── write engine: per-file no-replace commit ────────────────────────────────

async function writeCreateOnlyNoReplace(targetAbs, bodyBytes) {
  const tmp = targetAbs + TMP_SUFFIX;
  await fs.writeFile(tmp, bodyBytes, { encoding: 'utf-8', flag: 'wx' });
  let committedIno = null;
  try {
    // Sole no-replace commit primitive. EEXIST on both POSIX (link(2)) and Windows
    // (CreateHardLinkW) if target already exists. No fallback to any replace-capable op.
    await fs.link(tmp, targetAbs);
    try {
      const st = await fs.stat(targetAbs);
      committedIno = st.ino;
    } catch (_) {
      // commit succeeded but stat failed — non-fatal; we simply cannot ownership-verify
      // on compensating unlink.
      committedIno = null;
    }
  } catch (err) {
    await fs.unlink(tmp).catch(() => {});
    throw err;
  }
  // Best-effort tmp cleanup; tmp leak does not roll back a successful commit.
  await fs.unlink(tmp).catch(() => {});
  return { committedIno };
}

// Read-back verification: bytes must equal exactly the intended serialization.
async function readBackEqualsOrThrow(targetAbs, expectedBytes) {
  const actual = await fs.readFile(targetAbs, 'utf-8');
  return actual === expectedBytes;
}

// Compensating unlink of a target we committed. Refuses to unlink if the target's
// current inode differs from the inode captured at commit time (indicates external
// replacement between commit and rollback). Returns { ok, error }.
async function tryCompensatingUnlink(targetAbs, expectedIno) {
  try {
    if (expectedIno != null) {
      let currentIno = null;
      let exists = true;
      try {
        const st = await fs.stat(targetAbs);
        currentIno = st.ino;
      } catch (err) {
        if (err && err.code === 'ENOENT') {
          exists = false;
        } else {
          return { ok: false, error: `ownership-stat-failed: ${err.message}` };
        }
      }
      if (!exists) {
        // Already gone. Treat as already rolled back.
        return { ok: true, alreadyGone: true };
      }
      if (currentIno !== expectedIno) {
        return {
          ok: false,
          error:
            `ownership-verification-failed: target inode changed since commit ` +
            `(committed=${expectedIno}, current=${currentIno}); ` +
            `refusing to unlink externally-replaced target`,
        };
      }
    }
    await fs.unlink(targetAbs);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── main capability API ─────────────────────────────────────────────────────

// One-shot: parse authorization → repo-state gate → plan-once → fingerprint match →
// record selection → per-record fingerprint match → target list binding → write
// preflight → per-file no-replace commit → read-back verification.
//
// `projectRoot` is exposed on the programmatic API so the focused guard can drive
// synthetic OS-temp git repositories. The CLI hard-codes projectRoot=PROJECT_ROOT
// and does NOT expose this parameter.
export async function applyProductionSidecar({
  projectRoot = PROJECT_ROOT,
  manifestPath,
  sourcePath,
  authorizationPath,
}) {
  const errors = [];
  const result = {
    ok: false,
    mode: CAPABILITY_MODE,
    authorizationValidated: false,
    repositoryStateValidated: false,
    writePerformed: false,
    productionWritePerformed: false,
    commitPerformed: false,
    pushPerformed: false,
    planFingerprint: null,
    recordFingerprint: null,
    sourceHead: null,
    branch: null,
    manifestPath,
    sourcePath,
    authorizationPath,
    records: [],
    createdTargets: [],
    verification: { readBackOk: null, compensatingUnlink: null },
    repositoryNowDirty: null,
    errors,
  };

  // ── Source-path CLI arg validation ────────────────────────────────────
  const spCheck = validateSourcePathArg(sourcePath);
  if (!spCheck.ok) {
    errors.push(`source-path: ${spCheck.error}`);
    return result;
  }

  // ── Gate: authorization loading + strict shape validation ─────────────
  const authLoad = await loadAuthorization(authorizationPath);
  if (!authLoad.ok) {
    errors.push(`authorization: ${authLoad.error}`);
    return result;
  }
  const auth = authLoad.authorization;

  // ── Gate: repository state ────────────────────────────────────────────
  const preflight = evaluatePreflight({ projectRoot });
  result.branch = preflight.branch;
  result.sourceHead = preflight.head;
  result.repositoryNowDirty = preflight.workingTreeClean === false;
  if (!preflight.eligible) {
    for (const f of preflight.failures) {
      errors.push(`repo-state: ${f.code} — ${f.message}`);
    }
    return result;
  }
  if (preflight.head !== auth.repository.expectedHead) {
    errors.push(
      `repo-state: HEAD mismatch (expected=${auth.repository.expectedHead}, ` +
        `actual=${preflight.head})`,
    );
    return result;
  }
  if (preflight.branch !== auth.repository.expectedBranch) {
    errors.push(
      `repo-state: branch mismatch (expected=${auth.repository.expectedBranch}, ` +
        `actual=${preflight.branch})`,
    );
    return result;
  }
  result.repositoryStateValidated = true;

  // ── Gate: plan (once) ─────────────────────────────────────────────────
  let planned;
  try {
    planned = await planTruthApply({ manifestPath, repoRoot: projectRoot });
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
  result.planFingerprint = fingerprint;

  // ── Gate: plan fingerprint binding ────────────────────────────────────
  if (fingerprint.value !== auth.plan.expectedPlanFingerprint) {
    errors.push(
      `plan-fingerprint-mismatch: expected=${auth.plan.expectedPlanFingerprint} ` +
        `actual=${fingerprint.value}`,
    );
    return result;
  }

  // ── Gate: record selection by exact source-path match ────────────────
  const matches = plan.entries.filter((e) => e.sourcePath === sourcePath);
  if (matches.length === 0) {
    errors.push(
      `record-selection: --source-path not present in plan (${sourcePath})`,
    );
    return result;
  }
  if (matches.length > 1) {
    errors.push(
      `record-selection: --source-path matched ${matches.length} plan entries ` +
        `(invariant violation)`,
    );
    return result;
  }
  const selected = matches[0];

  // ── Gate: per-record fingerprint binding ─────────────────────────────
  const recFp = fingerprintEntry(selected, report.manifest.schemaVersion);
  result.recordFingerprint = recFp;
  if (recFp.value !== auth.plan.expectedRecordFingerprint) {
    errors.push(
      `record-fingerprint-mismatch: expected=${auth.plan.expectedRecordFingerprint} ` +
        `actual=${recFp.value}`,
    );
    return result;
  }

  // ── Gate: exact target binding ───────────────────────────────────────
  if (auth.targets[0] !== selected.targetPath) {
    errors.push(
      `target-mismatch: authorization.targets[0]=${JSON.stringify(auth.targets[0])} ` +
        `actual=${JSON.stringify(selected.targetPath)}`,
    );
    return result;
  }

  result.authorizationValidated = true;

  // ── Preflight for write: source exists (regular file) + target absent ─
  const absSource = path.resolve(projectRoot, selected.sourcePath);
  const absTarget = path.resolve(projectRoot, selected.targetPath);
  try {
    const st = await fs.stat(absSource);
    if (!st.isFile()) {
      errors.push(
        `write-preflight: source not a regular file: ${selected.sourcePath}`,
      );
      return result;
    }
  } catch (err) {
    errors.push(
      `write-preflight: source stat failed: ${err.code || err.message}`,
    );
    return result;
  }
  try {
    await fs.access(absTarget, fs.constants.F_OK);
    errors.push(
      `write-preflight: target already exists (create-only): ${selected.targetPath}`,
    );
    return result;
  } catch (err) {
    if (!err || err.code !== 'ENOENT') {
      errors.push(
        `write-preflight: target stat failed: ${err.code || err.message}`,
      );
      return result;
    }
  }

  // ── Write engine ─────────────────────────────────────────────────────
  const bodyBytes = serializeSidecarBody(selected.payload);
  let committedIno = null;
  try {
    const commit = await writeCreateOnlyNoReplace(absTarget, bodyBytes);
    committedIno = commit.committedIno;
  } catch (err) {
    errors.push(`write-failed: ${err.message}`);
    return result;
  }

  // From this point on: production write DID land. Set flags immediately so any
  // later error still surfaces the fact that we mutated production.
  result.writePerformed = true;
  result.productionWritePerformed = true;
  result.createdTargets = [selected.targetPath];
  result.records = [{
    sourcePath: selected.sourcePath,
    targetPath: selected.targetPath,
    operation: 'create',
    created: true,
  }];
  // Repo is now dirty from git's perspective (new untracked file).
  result.repositoryNowDirty = true;

  // ── Read-back verification ───────────────────────────────────────────
  let readBackOk = false;
  try {
    readBackOk = await readBackEqualsOrThrow(absTarget, bodyBytes);
  } catch (err) {
    result.verification.readBackOk = false;
    errors.push(`verify-read-failed: ${err.message}`);
    const comp = await tryCompensatingUnlink(absTarget, committedIno);
    result.verification.compensatingUnlink = comp;
    if (comp.ok) {
      result.writePerformed = false;
      result.productionWritePerformed = false;
      result.createdTargets = [];
      result.records[0].created = false;
      result.repositoryNowDirty = false;
    }
    return result;
  }
  result.verification.readBackOk = readBackOk;

  if (!readBackOk) {
    errors.push('verify-bytes-differ: read-back bytes do not match intended serialization');
    const comp = await tryCompensatingUnlink(absTarget, committedIno);
    result.verification.compensatingUnlink = comp;
    if (comp.ok) {
      result.writePerformed = false;
      result.productionWritePerformed = false;
      result.createdTargets = [];
      result.records[0].created = false;
      result.repositoryNowDirty = false;
    }
    return result;
  }

  // ── Success ──────────────────────────────────────────────────────────
  result.ok = true;
  return result;
}

// ── formatting ──────────────────────────────────────────────────────────────

export function formatHumanReadable(result) {
  const lines = [];
  lines.push('apply-blogger-backfill-truth (production-sidecar-create; single-record)');
  lines.push('');
  lines.push(`mode:                                ${result.mode}`);
  lines.push(`manifest path:                       ${result.manifestPath}`);
  lines.push(`source path:                         ${result.sourcePath}`);
  lines.push(`authorization path:                  ${result.authorizationPath}`);
  lines.push(`branch:                              ${result.branch ?? '(unknown)'}`);
  lines.push(`source HEAD:                         ${result.sourceHead ?? '(unknown)'}`);
  lines.push(`repository state validated:          ${result.repositoryStateValidated ? 'YES' : 'NO'}`);
  lines.push(`authorization validated:             ${result.authorizationValidated ? 'YES' : 'NO'}`);
  lines.push(
    `plan fingerprint:                    ${
      result.planFingerprint ? result.planFingerprint.value : '(not computed)'
    }`,
  );
  lines.push(
    `record fingerprint:                  ${
      result.recordFingerprint ? result.recordFingerprint.value : '(not computed)'
    }`,
  );
  lines.push(`write performed:                     ${result.writePerformed ? 'YES' : 'NO'}`);
  lines.push(`production write performed:          ${result.productionWritePerformed ? 'YES' : 'NO'}`);
  lines.push(`commit performed:                    NO`);
  lines.push(`push performed:                      NO`);
  lines.push(
    `repository now dirty:                ${
      result.repositoryNowDirty === null ? '(unknown)' : (result.repositoryNowDirty ? 'YES' : 'NO')
    }`,
  );
  if (result.verification.readBackOk !== null) {
    lines.push(`read-back verified:                  ${result.verification.readBackOk ? 'YES' : 'NO'}`);
  }
  if (result.verification.compensatingUnlink) {
    lines.push(
      `compensating unlink:                 ${result.verification.compensatingUnlink.ok ? 'OK' : 'FAILED'}`,
    );
    if (!result.verification.compensatingUnlink.ok) {
      lines.push(`compensating unlink error:           ${result.verification.compensatingUnlink.error}`);
    }
  }
  lines.push('');
  if (result.createdTargets.length > 0) {
    lines.push('---- created ----');
    for (const t of result.createdTargets) lines.push(`  + ${t}`);
    lines.push('');
  }
  if (result.errors.length > 0) {
    lines.push('---- errors ----');
    for (const e of result.errors) lines.push(`  - ${e}`);
    lines.push('');
  }
  lines.push('Single-record production capability.');
  lines.push('No git add / git commit / git push was performed.');
  lines.push('Next steps require explicit human review + separate authorized commit + push.');
  lines.push(`Overall: ${result.ok ? 'PASS' : 'FAIL'}`);
  return lines.join('\n') + '\n';
}

export function formatJson(result) {
  return JSON.stringify(result, null, 2) + '\n';
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
      `[apply-blogger-backfill-truth] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This capability is single-record production apply. Overwrite, publish, deploy, commit,\n' +
        '  push, dry-run, repo-root, and bypass flags are never accepted.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[apply-blogger-backfill-truth] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  if (!opts.apply) {
    process.stderr.write(
      '[apply-blogger-backfill-truth] ERROR: --apply is required to perform a production sidecar create\n',
    );
    process.stderr.write(
      '  For dry-run: use plan:blogger-backfill-truth-apply.\n' +
        '  For OS-temp write engine exercise: use rehearse:blogger-backfill-truth-apply.\n',
    );
    return 1;
  }
  if (!opts.manifest) {
    process.stderr.write('[apply-blogger-backfill-truth] ERROR: --manifest <path> is required\n');
    process.stderr.write(USAGE);
    return 1;
  }
  if (!opts.sourcePath) {
    process.stderr.write('[apply-blogger-backfill-truth] ERROR: --source-path <path> is required\n');
    process.stderr.write(USAGE);
    return 1;
  }
  if (!opts.authorization) {
    process.stderr.write(
      '[apply-blogger-backfill-truth] ERROR: --authorization <path> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }

  const manifestPath = path.isAbsolute(opts.manifest)
    ? opts.manifest
    : path.resolve(process.cwd(), opts.manifest);
  const authorizationPath = path.isAbsolute(opts.authorization)
    ? opts.authorization
    : path.resolve(process.cwd(), opts.authorization);

  const result = await applyProductionSidecar({
    projectRoot: PROJECT_ROOT,
    manifestPath,
    sourcePath: opts.sourcePath,
    authorizationPath,
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
        `[apply-blogger-backfill-truth] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}

// ── exports for the focused guard ───────────────────────────────────────────
// (also exports named above: parseArgs, applyProductionSidecar, loadAuthorization,
//  fingerprintEntry, isSha256HexLower, isGitSha40Lower, formatHumanReadable,
//  formatJson, and constants AUTHORIZATION_SCHEMA_VERSION, AUTHORIZATION_PURPOSE,
//  AUTHORIZATION_BRANCH, CAPABILITY_MODE.)
