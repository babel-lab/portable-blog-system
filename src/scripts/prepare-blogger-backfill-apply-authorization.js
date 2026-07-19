#!/usr/bin/env node
// Phase 20260719：Blogger backfill apply authorization — read-only draft generator。
//
// Purpose:
//   Given a Dean-populated + validator-PASS truth manifest and a single --source-path,
//   emit an authorization JSON *draft* that binds the current source repo HEAD, expected
//   plan / per-record fingerprint, exact target path, and record count. The draft's
//   `approval.explicitlyAuthorized` is fixed at `false`. This tool NEVER writes a file;
//   NEVER executes apply; NEVER modifies repository state. A human editor / reviewer must
//   later flip `explicitlyAuthorized` to `true` (out-of-band) before feeding the file to
//   `apply:blogger-backfill-truth`.
//
// Pipeline position:
//   validate:blogger-backfill-truth-manifest
//     → plan:blogger-backfill-truth-apply
//     → rehearse:blogger-backfill-truth-apply         (OS-temp only)
//     → **this slice** — prepare:blogger-backfill-apply-authorization
//                        (read-only draft; explicitlyAuthorized: false)
//     → validate:blogger-backfill-apply-authorization (preflight; still no apply)
//     → apply:blogger-backfill-truth                  (requires Dean-approved authorization
//                                                       + separate commit / push)
//
// Contract sharing:
//   Every schema constant, allowed-key set, fingerprint algorithm, and repository-state
//   gate is imported directly from `apply-blogger-backfill-truth.js` /
//   `plan-blogger-backfill-truth-apply.js` / `admin-git-safety-preflight.js`. There is
//   NO second source of truth for the authorization schema in this file.
//
// Safety contract (fail-closed; hard-coded):
//   - Read-only: no fs.writeFile / mkdir / rm / rename / unlink / copyFile / appendFile;
//     no child_process; no network; no Blogger / Google API.
//   - `--manifest` and `--source-path` are required. Missing → hard-fail.
//   - Approval-related flags are HARD-REJECTED. There is NO way to produce an approved
//     draft from this tool:
//       --approve, --authorized, --explicitly-authorized, --yes, -y, --apply
//   - Output-related flags are HARD-REJECTED. This tool NEVER writes a file. Use shell
//     redirection or an editor to save the JSON that appears on stdout:
//       --output, --out, --write, --save
//   - Bypass / mutation / repo-root override flags are HARD-REJECTED (mirrored from
//     apply-blogger-backfill-truth.js FORBIDDEN_FLAGS):
//       --force, --overwrite, --replace, --merge, --skip-validation,
//       --skip-fingerprint, --ignore-head, --dirty-ok, --no-verify,
//       --production, --publish, --deploy, --commit, --push, --dry-run,
//       --repo-root, --project-root, --test-root
//   - Unknown flag → hard-fail.
//   - `approval.explicitlyAuthorized` is hard-coded to `false` in every emitted draft.
//     There is no in-band code path that sets it to `true`.
//   - Repository-state gate (via `evaluatePreflight`) must be eligible:
//       branch === 'main', HEAD === origin/main, ahead/behind === 0/0, working tree clean,
//       .git/index.lock absent.
//   - Validator + planner must PASS. Fingerprints are computed from the planner's plan.
//   - Selection: `--source-path` must correspond to exactly one plan entry.
//   - Output is deterministic:
//       fixed field ordering (matches apply schema literally),
//       2-space pretty JSON with final newline,
//       no timestamps, no absolute paths, no hostname, no username,
//       no payload duplication.
//     Same repo state + same manifest + same source-path → byte-identical stdout.
//   - Diagnostics only to stderr; stdout is ONLY the JSON draft. This lets an operator
//     `>authorization.json` without contaminating the file.
//
// What this slice explicitly does NOT do:
//   - Author an approved authorization document.
//   - Write ANY file (no --output, no --save, no --write path).
//   - Execute apply / rehearsal.
//   - Modify manifest, Markdown, or sidecars.
//   - Add / commit / push.
//   - Build / deploy / preview.
//   - Call Blogger / Google / GA4 / AdSense API.
//   - Consult a network.
//   - Fabricate `bloggerPostId`.
//   - Modify `.gitignore`.
//   - Establish a repo-internal authorization storage convention.
//
// Usage:
//   npm run prepare:blogger-backfill-apply-authorization -- \
//     --manifest <path> \
//     --source-path <content/blogger/posts/<slug>.md> \
//     [--help]
//
// Then, out-of-band, an operator:
//   1. reviews the printed JSON draft byte-for-byte
//   2. saves it OUTSIDE the source repo (e.g., ~/authorizations/2026-XX-YY-<slug>.json)
//      or somewhere inside a `.gitignore`d path — otherwise the working tree becomes
//      dirty and `apply:blogger-backfill-truth` will refuse.
//   3. flips `approval.explicitlyAuthorized` to `true` if and only if the plan and
//      target are what they intend to apply.
//   4. runs `validate:blogger-backfill-apply-authorization` for a fresh, read-only
//      binding check against runtime state.
//   5. runs `apply:blogger-backfill-truth ... --apply` (separate authorized step).
//
// Exit codes:
//   0 — draft emitted successfully.
//   1 — any gate refused: CLI misuse, forbidden flag, unknown flag, repo-state gate,
//       validator failure, planner failure, source-path missing from plan, unexpected error.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluatePreflight } from './admin-git-safety-preflight.js';
import { planTruthApply } from './plan-blogger-backfill-truth-apply.js';
import {
  fingerprintEntry,
  AUTHORIZATION_SCHEMA_VERSION,
  AUTHORIZATION_PURPOSE,
  AUTHORIZATION_BRANCH,
} from './apply-blogger-backfill-truth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const ALLOWED_SOURCE_PREFIX = 'content/blogger/posts/';

// Any occurrence of any of these hard-fails. Separated into three groups only so error
// diagnostics can be crisp; the runtime effect is identical.
const APPROVAL_FLAGS = new Set([
  '--approve',
  '--authorized',
  '--explicitly-authorized',
  '--yes',
  '-y',
  '--apply',
]);
const OUTPUT_FLAGS = new Set([
  '--output',
  '--out',
  '--write',
  '--save',
]);
const BYPASS_FLAGS = new Set([
  '--force',
  '--overwrite',
  '--replace',
  '--merge',
  '--skip-validation',
  '--skip-fingerprint',
  '--ignore-head',
  '--dirty-ok',
  '--no-verify',
  '--production',
  '--publish',
  '--deploy',
  '--commit',
  '--push',
  '--dry-run',
  '--repo-root',
  '--project-root',
  '--test-root',
]);

function isForbidden(flag) {
  return APPROVAL_FLAGS.has(flag) || OUTPUT_FLAGS.has(flag) || BYPASS_FLAGS.has(flag);
}

const USAGE = `Usage: prepare-blogger-backfill-apply-authorization \\
  --manifest <path> \\
  --source-path <content/blogger/posts/<slug>.md> \\
  [--help]

Read-only authorization draft generator. Emits an UNAPPROVED authorization JSON to
stdout that binds the current source repo HEAD, expected plan / per-record
fingerprint, exact target path, and record count for a single Blogger backfill
truth-apply candidate.

Every draft has:
  "approval": { "explicitlyAuthorized": false }

There is NO in-band code path that sets \`explicitlyAuthorized\` to true. An operator
who wants to approve the draft must save the stdout OUTSIDE the source repo (or
inside a \`.gitignore\`d path — otherwise the apply capability refuses on dirty
tree), then edit the file to flip \`explicitlyAuthorized\` to true if and only if
they agree with the printed plan and target.

Required:
  --manifest <path>          Repo-relative or absolute path to a validated truth manifest.
  --source-path <path>       Repo-relative POSIX-style path under
                             ${ALLOWED_SOURCE_PREFIX} that selects a single plan entry.

Options:
  --help / -h                Print this usage.

Forbidden flags (any occurrence hard-fails):
  approval:  --approve, --authorized, --explicitly-authorized, --yes, -y, --apply
  output:    --output, --out, --write, --save
  bypass:    --force, --overwrite, --replace, --merge, --skip-validation,
             --skip-fingerprint, --ignore-head, --dirty-ok, --no-verify,
             --production, --publish, --deploy, --commit, --push, --dry-run,
             --repo-root, --project-root, --test-root

Unknown flags hard-fail. No environment-variable override for project root.

Repository state gate (fail-closed):
  branch == main, HEAD == origin/main, ahead/behind == 0/0, working tree clean,
  .git/index.lock absent.

Validator + planner:
  Delegates to validate:blogger-backfill-truth-manifest and plan:blogger-backfill-
  truth-apply. Any refusal propagates as a non-zero exit and NO draft is emitted.

Determinism:
  Same repo state + same manifest + same source-path → byte-identical stdout.
  No timestamp, no absolute path, no hostname, no username, no payload duplication.

Non-goals:
  This tool does NOT authorize apply. It does NOT write any file. It does NOT modify
  the repository. Approval is a separate out-of-band step that requires human review
  of the printed draft.
`;

// ── argv parsing ─────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    manifest: null,
    sourcePath: null,
    forbidden: [],
    unknown: [],
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--help' || a === '-h') { opts.help = true; continue; }
    if (a === '--manifest') { opts.manifest = args[++i] ?? null; continue; }
    if (a.startsWith('--manifest=')) { opts.manifest = a.slice('--manifest='.length); continue; }
    if (a === '--source-path') { opts.sourcePath = args[++i] ?? null; continue; }
    if (a.startsWith('--source-path=')) {
      opts.sourcePath = a.slice('--source-path='.length);
      continue;
    }
    if (isForbidden(a)) { opts.forbidden.push(a); continue; }
    const eqIdx = a.indexOf('=');
    if (eqIdx > 0) {
      const bare = a.slice(0, eqIdx);
      if (isForbidden(bare)) { opts.forbidden.push(bare); continue; }
    }
    opts.unknown.push(a);
  }
  return opts;
}

// ── source-path CLI arg validation ─────────────────────────────────────────
//
// Mirrors apply-blogger-backfill-truth.js validateSourcePathArg contract. Keeping a
// local copy avoids importing an un-exported helper; the shape (POSIX, no ..,
// prefix + .md suffix, no .fb.md) is stable and tested by the apply guard, so a
// silent copy here is safe: any change to apply's contract would need the same
// change here and would fail apply's guard first.

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

// ── deterministic draft serialization ──────────────────────────────────────
//
// Field order is fixed literal (matches apply schema top-level order:
// schemaVersion → purpose → repository → plan → targets → approval).
// Sub-objects follow the same literal order as authorization documents in
// apply-blogger-backfill-truth.js. This tool does NOT sort object keys —
// the literal order below IS the canonical order.

function buildDraft({ head, planFingerprint, recordFingerprint, targetPath }) {
  return {
    schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
    purpose: AUTHORIZATION_PURPOSE,
    repository: {
      expectedHead: head,
      expectedBranch: AUTHORIZATION_BRANCH,
    },
    plan: {
      expectedPlanFingerprint: planFingerprint,
      expectedRecordFingerprint: recordFingerprint,
      recordCount: 1,
    },
    targets: [targetPath],
    approval: {
      explicitlyAuthorized: false,
    },
  };
}

export function serializeDraft(draft) {
  return JSON.stringify(draft, null, 2) + '\n';
}

// ── main preparation API ───────────────────────────────────────────────────

// One-shot: repo-state gate → plan-once → record selection → per-record fingerprint
// → draft construction. Returns { ok, draft?, errors, preflight, planFingerprint,
// recordFingerprint }. Never writes anything.
//
// `projectRoot` is exposed on the programmatic API so the focused guard can drive
// synthetic OS-temp git repositories. The CLI hardcodes projectRoot=PROJECT_ROOT
// and does NOT expose this parameter.
export async function prepareAuthorizationDraft({
  projectRoot = PROJECT_ROOT,
  manifestPath,
  sourcePath,
}) {
  const errors = [];

  // ── Source-path CLI arg validation ─────────────────────────────────────
  const spCheck = validateSourcePathArg(sourcePath);
  if (!spCheck.ok) {
    errors.push(`source-path: ${spCheck.error}`);
    return { ok: false, errors };
  }

  // ── Gate: repository state ─────────────────────────────────────────────
  const preflight = evaluatePreflight({ projectRoot });
  if (!preflight.eligible) {
    for (const f of preflight.failures) {
      errors.push(`repo-state: ${f.code} — ${f.message}`);
    }
    return { ok: false, errors, preflight };
  }

  // ── Gate: plan (once) ──────────────────────────────────────────────────
  let planned;
  try {
    planned = await planTruthApply({ manifestPath, repoRoot: projectRoot });
  } catch (err) {
    errors.push(`plan-error: ${err.message}`);
    return { ok: false, errors, preflight };
  }
  const { report, plan, fingerprint } = planned;
  if (!report.ok || !plan.ok || fingerprint == null) {
    errors.push('plan-validation-failed');
    for (const e of (report.errors || [])) errors.push(`validator: ${e}`);
    for (const e of (plan.errors || [])) errors.push(`planner: ${e}`);
    return { ok: false, errors, preflight };
  }

  // ── Gate: record selection by exact source-path match ─────────────────
  const matches = plan.entries.filter((e) => e.sourcePath === sourcePath);
  if (matches.length === 0) {
    errors.push(
      `record-selection: --source-path not present in plan (${sourcePath})`,
    );
    return { ok: false, errors, preflight, planFingerprint: fingerprint };
  }
  if (matches.length > 1) {
    errors.push(
      `record-selection: --source-path matched ${matches.length} plan entries ` +
        `(invariant violation)`,
    );
    return { ok: false, errors, preflight, planFingerprint: fingerprint };
  }
  const selected = matches[0];

  // ── Per-record fingerprint ────────────────────────────────────────────
  const recordFp = fingerprintEntry(selected, report.manifest.schemaVersion);

  // ── Build the draft ───────────────────────────────────────────────────
  const draft = buildDraft({
    head: preflight.head,
    planFingerprint: fingerprint.value,
    recordFingerprint: recordFp.value,
    targetPath: selected.targetPath,
  });

  return {
    ok: true,
    errors,
    preflight,
    planFingerprint: fingerprint,
    recordFingerprint: recordFp,
    draft,
  };
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
      `[prepare-blogger-backfill-apply-authorization] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This tool NEVER produces an approved draft and NEVER writes a file.\n' +
        '  Approval flags, output flags, and mutation / bypass / repo-root flags are refused.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[prepare-blogger-backfill-apply-authorization] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  if (!opts.manifest) {
    process.stderr.write(
      '[prepare-blogger-backfill-apply-authorization] ERROR: --manifest <path> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }
  if (!opts.sourcePath) {
    process.stderr.write(
      '[prepare-blogger-backfill-apply-authorization] ERROR: --source-path <path> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }

  const manifestPath = path.isAbsolute(opts.manifest)
    ? opts.manifest
    : path.resolve(process.cwd(), opts.manifest);

  const result = await prepareAuthorizationDraft({
    projectRoot: PROJECT_ROOT,
    manifestPath,
    sourcePath: opts.sourcePath,
  });

  if (!result.ok) {
    process.stderr.write(
      `[prepare-blogger-backfill-apply-authorization] refused; no draft emitted\n`,
    );
    for (const e of result.errors) {
      process.stderr.write(`  - ${e}\n`);
    }
    return 1;
  }

  process.stdout.write(serializeDraft(result.draft));
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
        `[prepare-blogger-backfill-apply-authorization] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}
