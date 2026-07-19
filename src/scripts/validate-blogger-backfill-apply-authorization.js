#!/usr/bin/env node
// Phase 20260719：Blogger backfill apply authorization — read-only preflight validator。
//
// Purpose:
//   Given a manifest, a source-path, and an already-authored authorization JSON, verify
//   that the authorization document is (a) shape-valid per the same strict schema
//   `apply:blogger-backfill-truth` enforces, (b) that every binding (HEAD, branch, plan
//   fingerprint, per-record fingerprint, target, record count) matches the CURRENT
//   runtime state, and (c) that `approval.explicitlyAuthorized === true`. This tool
//   NEVER executes apply, NEVER writes any file, NEVER modifies repository state.
//
//   Preflight classifies the authorization at three layers:
//     1. authorizationDocumentValid   — shape-valid per apply's loadAuthorization
//     2. authorizationBindingsMatched — every binding matches runtime state
//     3. explicitlyAuthorized         — approval.explicitlyAuthorized is true
//   `applyReady === all three are true`. `writePerformed === false` always.
//
// Pipeline position:
//   validate:blogger-backfill-truth-manifest
//     → plan:blogger-backfill-truth-apply
//     → rehearse:blogger-backfill-truth-apply
//     → prepare:blogger-backfill-apply-authorization        (unapproved draft)
//     → (operator flips explicitlyAuthorized out-of-band)
//     → **this slice** — validate:blogger-backfill-apply-authorization  (read-only)
//     → apply:blogger-backfill-truth                        (still separate authorized step)
//
// Contract sharing:
//   Every schema constant, loader, fingerprint algorithm, and preflight is imported
//   from apply-blogger-backfill-truth.js / plan-blogger-backfill-truth-apply.js /
//   admin-git-safety-preflight.js. There is NO second source of truth.
//
// Safety contract (fail-closed; hard-coded):
//   - Read-only: no fs.writeFile / mkdir / rm / rename / unlink / copyFile / appendFile;
//     no child_process; no network; no Blogger / Google API.
//   - `--manifest`, `--source-path`, and `--authorization` are required. Missing → hard-fail.
//   - `--apply` is HARD-REJECTED. This tool NEVER performs apply.
//   - Mutation / bypass / repo-root flags are HARD-REJECTED (mirrored from
//     apply-blogger-backfill-truth.js FORBIDDEN_FLAGS):
//       --force, --overwrite, --replace, --merge, --yes, -y,
//       --skip-validation, --skip-fingerprint, --ignore-head, --dirty-ok, --no-verify,
//       --production, --publish, --deploy, --commit, --push, --dry-run,
//       --repo-root, --project-root, --test-root
//   - Unknown flag → hard-fail.
//   - Exit codes:
//       0  applyReady === true  (document valid + bindings match + explicitly authorized)
//       1  any refusal (invalid document, mismatched binding, unapproved draft, planner
//          failure, repo-state gate refused, CLI misuse, unknown flag)
//   - Deterministic report envelope with fixed field ordering.
//   - Diagnostics only to stderr; stdout carries the report (human or --json).
//
// What this slice explicitly does NOT do:
//   - Execute apply.
//   - Write any file (never a --output / --save / --write path).
//   - Modify manifest, Markdown, or sidecars.
//   - Add / commit / push.
//   - Build / deploy / preview.
//   - Call Blogger / Google / GA4 / AdSense API.
//   - Consult a network.
//   - Fabricate `bloggerPostId`.
//   - Read repository state destructively (uses only the read-only preflight).
//
// Usage:
//   npm run validate:blogger-backfill-apply-authorization -- \
//     --manifest <path> \
//     --source-path <content/blogger/posts/<slug>.md> \
//     --authorization <path> \
//     [--json] [--help]

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluatePreflight } from './admin-git-safety-preflight.js';
import { planTruthApply } from './plan-blogger-backfill-truth-apply.js';
import {
  loadAuthorization,
  fingerprintEntry,
  AUTHORIZATION_SCHEMA_VERSION,
  AUTHORIZATION_PURPOSE,
  AUTHORIZATION_BRANCH,
} from './apply-blogger-backfill-truth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const ALLOWED_SOURCE_PREFIX = 'content/blogger/posts/';

// Any occurrence hard-fails. Explicit `--apply` rejection is critical: this tool
// exists precisely to be the read-only alternative to apply.
const FORBIDDEN_FLAGS = new Set([
  '--apply',
  '--force',
  '--overwrite',
  '--replace',
  '--merge',
  '--yes',
  '-y',
  '--all',
  '--auto-approve',
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
  '--output',
  '--out',
  '--write',
  '--save',
]);

const USAGE = `Usage: validate-blogger-backfill-apply-authorization \\
  --manifest <path> \\
  --source-path <content/blogger/posts/<slug>.md> \\
  --authorization <path> \\
  [--json] [--help]

Read-only preflight validator for a Dean-authored Blogger backfill apply
authorization document. Verifies:

  1. authorizationDocumentValid    (shape per apply's loadAuthorization)
  2. authorizationBindingsMatched  (HEAD / branch / plan / record / target / recordCount)
  3. explicitlyAuthorized          (approval.explicitlyAuthorized === true)

applyReady === all three are true. writePerformed === false, invariantly.

Required:
  --manifest <path>          Repo-relative or absolute path to a validated truth manifest.
  --source-path <path>       Repo-relative POSIX-style path under
                             ${ALLOWED_SOURCE_PREFIX} that selects a single plan entry.
  --authorization <path>     Repo-relative or absolute path to the authorization JSON.

Options:
  --json                     Emit a deterministic JSON report to stdout.
  --help / -h                Print this usage.

Forbidden flags (any occurrence hard-fails):
  --apply (this tool NEVER applies),
  --force, --overwrite, --replace, --merge, --yes, -y, --all, --auto-approve,
  --skip-validation, --skip-fingerprint, --ignore-head, --dirty-ok, --no-verify,
  --production, --publish, --deploy, --commit, --push, --dry-run,
  --repo-root, --project-root, --test-root,
  --output, --out, --write, --save

Unknown flags hard-fail. No environment-variable override for project root.

Repository state gate (fail-closed):
  branch == main, HEAD == origin/main, ahead/behind == 0/0, working tree clean,
  .git/index.lock absent.

Exit codes:
  0  applyReady === true
  1  any refusal (invalid document, mismatched binding, unapproved draft, planner
     or validator failure, repo-state gate refused, CLI misuse, unknown flag)

Non-goals:
  This tool does NOT perform apply. It does NOT write files. It does NOT modify
  the repository. It does NOT approve the authorization document.
`;

// ── argv parsing ─────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
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

// ── source-path CLI arg validation ─────────────────────────────────────────
// (copy of apply's contract; see prepare-* rationale.)

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

// ── preflight orchestrator ─────────────────────────────────────────────────

// One-shot: authorization loader → repo-state gate → plan-once → record selection
// → per-record fingerprint → binding comparison → classification.
//
// `projectRoot` is exposed on the programmatic API so the focused guard can drive
// synthetic OS-temp git repositories. The CLI hardcodes projectRoot=PROJECT_ROOT.
export async function preflightAuthorization({
  projectRoot = PROJECT_ROOT,
  manifestPath,
  sourcePath,
  authorizationPath,
}) {
  const blockers = [];
  const result = {
    ok: false,
    mode: 'preflight-apply-authorization',
    manifestPath,
    sourcePath,
    authorizationPath,
    branch: null,
    sourceHead: null,
    authorizationDocumentValid: false,
    authorizationBindingsMatched: false,
    explicitlyAuthorized: false,
    applyReady: false,
    writePerformed: false,
    planFingerprint: null,
    recordFingerprint: null,
    blockers,
  };

  // ── Source-path CLI arg validation ──────────────────────────────────
  const spCheck = validateSourcePathArg(sourcePath);
  if (!spCheck.ok) {
    blockers.push(`source-path: ${spCheck.error}`);
    return result;
  }

  // ── Load authorization (shape validation only; approval bit is inspected
  //    separately so an unapproved-but-shape-valid draft is not classified as
  //    malformed). We call the shared apply-schema loader with
  //    { requireApproved: false } — approval enforcement remains at the applyReady
  //    classification below, not at document validity.
  const authLoad = await loadAuthorization(authorizationPath, { requireApproved: false });
  if (!authLoad.ok) {
    blockers.push(`authorization-document-invalid: ${authLoad.error}`);
    return result;
  }
  result.authorizationDocumentValid = true;
  const auth = authLoad.authorization;
  result.explicitlyAuthorized = auth.approval.explicitlyAuthorized === true;

  // ── Gate: repository state ──────────────────────────────────────────
  const preflight = evaluatePreflight({ projectRoot });
  result.branch = preflight.branch;
  result.sourceHead = preflight.head;
  if (!preflight.eligible) {
    for (const f of preflight.failures) {
      blockers.push(`repo-state: ${f.code} — ${f.message}`);
    }
    return result;
  }

  // ── Gate: plan (once) ───────────────────────────────────────────────
  let planned;
  try {
    planned = await planTruthApply({ manifestPath, repoRoot: projectRoot });
  } catch (err) {
    blockers.push(`plan-error: ${err.message}`);
    return result;
  }
  const { report, plan, fingerprint } = planned;
  if (!report.ok || !plan.ok || fingerprint == null) {
    blockers.push('plan-validation-failed');
    for (const e of (report.errors || [])) blockers.push(`validator: ${e}`);
    for (const e of (plan.errors || [])) blockers.push(`planner: ${e}`);
    return result;
  }
  result.planFingerprint = fingerprint;

  // ── Gate: record selection by exact source-path match ──────────────
  const matches = plan.entries.filter((e) => e.sourcePath === sourcePath);
  if (matches.length === 0) {
    blockers.push(
      `record-selection: --source-path not present in plan (${sourcePath})`,
    );
    return result;
  }
  if (matches.length > 1) {
    blockers.push(
      `record-selection: --source-path matched ${matches.length} plan entries (invariant violation)`,
    );
    return result;
  }
  const selected = matches[0];

  // ── Per-record fingerprint ─────────────────────────────────────────
  const recFp = fingerprintEntry(selected, report.manifest.schemaVersion);
  result.recordFingerprint = recFp;

  // ── Binding comparisons ────────────────────────────────────────────
  const bindingIssues = [];
  if (preflight.head !== auth.repository.expectedHead) {
    bindingIssues.push(
      `head-mismatch: expected=${auth.repository.expectedHead} actual=${preflight.head}`,
    );
  }
  if (preflight.branch !== auth.repository.expectedBranch) {
    bindingIssues.push(
      `branch-mismatch: expected=${auth.repository.expectedBranch} actual=${preflight.branch}`,
    );
  }
  if (fingerprint.value !== auth.plan.expectedPlanFingerprint) {
    bindingIssues.push(
      `plan-fingerprint-mismatch: expected=${auth.plan.expectedPlanFingerprint} actual=${fingerprint.value}`,
    );
  }
  if (recFp.value !== auth.plan.expectedRecordFingerprint) {
    bindingIssues.push(
      `record-fingerprint-mismatch: expected=${auth.plan.expectedRecordFingerprint} actual=${recFp.value}`,
    );
  }
  if (auth.targets[0] !== selected.targetPath) {
    bindingIssues.push(
      `target-mismatch: authorization.targets[0]=${JSON.stringify(auth.targets[0])} actual=${JSON.stringify(selected.targetPath)}`,
    );
  }
  // recordCount === 1 is already enforced by loadAuthorization; assert again
  // as a defense-in-depth for the binding classification, but do not double-count.
  if (auth.plan.recordCount !== 1) {
    bindingIssues.push(
      `record-count-mismatch: expected=1 actual=${JSON.stringify(auth.plan.recordCount)}`,
    );
  }

  if (bindingIssues.length === 0) {
    result.authorizationBindingsMatched = true;
  } else {
    for (const b of bindingIssues) blockers.push(`binding: ${b}`);
  }

  // ── Explicit-authorization gate ────────────────────────────────────
  if (!result.explicitlyAuthorized) {
    blockers.push('explicit-authorization-not-granted');
  }

  // ── Classification: applyReady ─────────────────────────────────────
  result.applyReady =
    result.authorizationDocumentValid &&
    result.authorizationBindingsMatched &&
    result.explicitlyAuthorized;

  result.ok = result.applyReady;
  return result;
}

// ── formatting ──────────────────────────────────────────────────────────────

export function formatHumanReadable(result) {
  const lines = [];
  lines.push('validate-blogger-backfill-apply-authorization (read-only preflight; no apply)');
  lines.push('');
  lines.push(`mode:                                ${result.mode}`);
  lines.push(`manifest path:                       ${result.manifestPath}`);
  lines.push(`source path:                         ${result.sourcePath}`);
  lines.push(`authorization path:                  ${result.authorizationPath}`);
  lines.push(`branch:                              ${result.branch ?? '(unknown)'}`);
  lines.push(`source HEAD:                         ${result.sourceHead ?? '(unknown)'}`);
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
  lines.push(`authorization document valid:        ${result.authorizationDocumentValid ? 'YES' : 'NO'}`);
  lines.push(`authorization bindings matched:      ${result.authorizationBindingsMatched ? 'YES' : 'NO'}`);
  lines.push(`explicitly authorized:               ${result.explicitlyAuthorized ? 'YES' : 'NO'}`);
  lines.push(`apply ready:                         ${result.applyReady ? 'YES' : 'NO'}`);
  lines.push(`write performed:                     NO`);
  lines.push('');
  if (result.blockers.length > 0) {
    lines.push('---- blockers ----');
    for (const b of result.blockers) lines.push(`  - ${b}`);
    lines.push('');
  }
  lines.push('Read-only preflight.');
  lines.push('No files were created, modified, renamed, or deleted.');
  lines.push('Production apply was not performed.');
  lines.push(`Overall: ${result.applyReady ? 'PASS' : 'FAIL'}`);
  return lines.join('\n') + '\n';
}

export function formatJson(result) {
  // Fixed field ordering (deterministic across runs).
  const body = {
    ok: result.ok,
    mode: result.mode,
    manifestPath: result.manifestPath,
    sourcePath: result.sourcePath,
    authorizationPath: result.authorizationPath,
    branch: result.branch,
    sourceHead: result.sourceHead,
    planFingerprint: result.planFingerprint,
    recordFingerprint: result.recordFingerprint,
    authorizationDocumentValid: result.authorizationDocumentValid,
    authorizationBindingsMatched: result.authorizationBindingsMatched,
    explicitlyAuthorized: result.explicitlyAuthorized,
    applyReady: result.applyReady,
    writePerformed: result.writePerformed,
    blockers: result.blockers,
  };
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
      `[validate-blogger-backfill-apply-authorization] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write(
      '  This tool NEVER performs apply. --apply, mutation, bypass, output, and repo-root flags are refused.\n',
    );
    return 1;
  }

  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[validate-blogger-backfill-apply-authorization] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 1;
  }

  if (!opts.manifest) {
    process.stderr.write(
      '[validate-blogger-backfill-apply-authorization] ERROR: --manifest <path> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }
  if (!opts.sourcePath) {
    process.stderr.write(
      '[validate-blogger-backfill-apply-authorization] ERROR: --source-path <path> is required\n',
    );
    process.stderr.write(USAGE);
    return 1;
  }
  if (!opts.authorization) {
    process.stderr.write(
      '[validate-blogger-backfill-apply-authorization] ERROR: --authorization <path> is required\n',
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

  const result = await preflightAuthorization({
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
  return result.applyReady ? 0 : 1;
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
        `[validate-blogger-backfill-apply-authorization] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}
