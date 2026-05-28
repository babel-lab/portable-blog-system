// Phase 20260528-pm-8 Admin Write Infra §15.G phase 4.5e real-write gate
//   - CLI write driver — gated real-write path
//   - Mode determination (after argv + payload shape validated):
//     - --apply flag AND payload.dryRun === false  → real-write path (safeWrite)
//     - --apply alone (dryRun !== false)           → reject 'apply-requires-dryRun-false'
//     - dryRun:false alone (no --apply)            → reject 'dryRun-false-requires-apply'
//     - neither set (dryRun:true, no --apply)      → dry-run path (no fs write)
//   - Real-write extra gates (beyond dry-run):
//     - status set narrowed to {'draft'} (ready/published/missing all rejected)
//     - re-checks whitelist immediately before fs write (TOCTOU defense)
//     - delegates fs write to safeWrite (atomic tmp+rename; enforceCleanGit:true)
//     - patcher.changed === false  → skip fs write; return written:false (no-op)
//     - patcher.ok === false       → no fs write; surfaces error
//   - Dry-run behavior preserved verbatim (no regressions).
//   - Output (both modes) carries: target / site / kind / field / status /
//     diffSummary / bytesDelta / changed / written.
//   - Exit codes (additive over 4.5c):
//     0  success (dry-run OR real-write OR no-op apply)
//     1  invalid projectRoot / fatal
//     2  invalid args / mode-combo rejection
//     3  invalid payload shape
//     4  forbidden target (whitelist / traversal / kind / pre-write recheck)
//     6  expectedOldValue mismatch
//     7  status / validator failure
//     8  read / frontmatter / patcher / git-status / safeWrite I/O failure
//
// Module shape:
//   - export async function runCli({ argv, projectRoot, __testOverrides? })
//       → { exit: number, stdoutJson: object, stderrLines: string[] }
//   - __testOverrides.gitStatusFn — internal-test hook to inject gitStatus result
//     without spawning real `git status`; ignored unless a function. Production
//     CLI entry (process.argv) never passes this; the field is only consumed by
//     `safe-write-test.js` to keep tests hermetic.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

import { isWriteAllowed } from './admin-write-whitelist.js';
import {
  validateDescription,
  validateSearchDescription,
  LIMITS,
} from './admin-field-validators.js';
import { patchFrontmatter } from './admin-frontmatter-patcher.js';
import { safeWrite } from './safe-write.js';
import { checkGitStatus } from './git-status-check.js';

const ALLOWED_FIELDS = new Set(['description', 'searchDescription']);
const ALLOWED_STATUSES_DRY = new Set(['draft', 'ready']);
const ALLOWED_STATUSES_WRITE = new Set(['draft']);

function parseArgv(argv) {
  let payloadPath = null;
  let applyFlag = false;
  for (const raw of argv) {
    if (typeof raw !== 'string') continue;
    if (raw === '--apply') {
      applyFlag = true;
      continue;
    }
    if (raw.startsWith('--payload=')) {
      payloadPath = raw.slice('--payload='.length);
      continue;
    }
    if (raw === '--payload') {
      return { ok: false, error: 'payload-flag-requires-equals-form' };
    }
    return { ok: false, error: `unknown-arg: ${raw}` };
  }
  return { ok: true, payloadPath, applyFlag };
}

async function loadPayloadFile(payloadPath, projectRoot) {
  const abs = path.isAbsolute(payloadPath)
    ? path.resolve(payloadPath)
    : path.resolve(projectRoot, payloadPath);
  let raw;
  try {
    raw = await fs.readFile(abs, 'utf-8');
  } catch (err) {
    return { ok: false, reason: 'payload-file-not-readable', detail: err.message, abs };
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    return { ok: false, reason: 'payload-not-valid-json', detail: err.message, abs };
  }
  return { ok: true, payload, abs };
}

function validatePayloadShape(payload) {
  if (payload === null || typeof payload !== 'object') {
    return { ok: false, error: 'payload-must-be-object' };
  }
  if (Array.isArray(payload)) {
    return { ok: false, error: 'payload-array-not-allowed' };
  }

  const required = ['targetRel', 'field', 'newValue', 'expectedOldValue', 'dryRun'];
  const missing = [];
  for (const k of required) {
    if (!Object.prototype.hasOwnProperty.call(payload, k)) missing.push(k);
  }
  if (missing.length > 0) {
    return { ok: false, error: 'missing-fields', missing };
  }

  if (typeof payload.targetRel !== 'string' || payload.targetRel === '') {
    return { ok: false, error: 'targetRel-must-be-non-empty-string' };
  }
  if (typeof payload.field !== 'string') {
    return { ok: false, error: 'field-must-be-string' };
  }
  if (!ALLOWED_FIELDS.has(payload.field)) {
    return { ok: false, error: 'field-not-in-allowlist', field: payload.field };
  }
  if (typeof payload.newValue !== 'string') {
    return { ok: false, error: 'newValue-must-be-string' };
  }
  if (typeof payload.expectedOldValue !== 'string') {
    return { ok: false, error: 'expectedOldValue-must-be-string' };
  }
  if (typeof payload.dryRun !== 'boolean') {
    return { ok: false, error: 'dryRun-must-be-boolean' };
  }

  const hasReason = Object.prototype.hasOwnProperty.call(payload, 'reason');
  const hasMemo = Object.prototype.hasOwnProperty.call(payload, 'memo');
  if (hasReason && hasMemo) {
    return { ok: false, error: 'reason-and-memo-mutually-exclusive' };
  }
  if (hasReason && typeof payload.reason !== 'string') {
    return { ok: false, error: 'reason-must-be-string' };
  }
  if (hasMemo && typeof payload.memo !== 'string') {
    return { ok: false, error: 'memo-must-be-string' };
  }

  return { ok: true };
}

function validateTargetRel(targetRel) {
  if (path.isAbsolute(targetRel)) {
    return { ok: false, reason: 'targetRel-must-be-relative' };
  }
  if (targetRel.includes('\0')) {
    return { ok: false, reason: 'targetRel-has-null-byte' };
  }
  const parts = targetRel.split(/[\\/]/);
  if (parts.includes('..') || parts.includes('.')) {
    return { ok: false, reason: 'targetRel-has-dot-segment' };
  }
  return { ok: true };
}

function validateNewValue(field, newValue) {
  if (field === 'description') return validateDescription(newValue);
  if (field === 'searchDescription') return validateSearchDescription(newValue);
  return { ok: false, error: 'field-not-in-allowlist' };
}

function getValidatorName(field) {
  if (field === 'description') return 'validateDescription';
  if (field === 'searchDescription') return 'validateSearchDescription';
  return 'unknown';
}

function buildResult({ exit, stdoutJson, stderrLines }) {
  return { exit, stdoutJson, stderrLines };
}

export async function runCli({ argv, projectRoot, __testOverrides } = {}) {
  const stderrLines = [];
  const log = (line) => stderrLines.push(`[admin-write] ${line}`);

  if (typeof projectRoot !== 'string' || projectRoot === '' || !path.isAbsolute(projectRoot)) {
    return buildResult({
      exit: 1,
      stdoutJson: { ok: false, reason: 'invalid-project-root' },
      stderrLines: [`[admin-write] FATAL invalid projectRoot: ${projectRoot}`],
    });
  }

  // 1. Parse argv
  const argvParsed = parseArgv(Array.isArray(argv) ? argv : []);
  if (!argvParsed.ok) {
    log(`argv parse failed: ${argvParsed.error}`);
    return buildResult({
      exit: 2,
      stdoutJson: { ok: false, reason: 'invalid-args', detail: argvParsed.error },
      stderrLines,
    });
  }

  if (!argvParsed.payloadPath) {
    log('missing --payload=<file>');
    return buildResult({
      exit: 2,
      stdoutJson: {
        ok: false,
        reason: 'invalid-args',
        detail: 'missing --payload=<file>',
      },
      stderrLines,
    });
  }

  // 2. Load payload file
  const loaded = await loadPayloadFile(argvParsed.payloadPath, projectRoot);
  if (!loaded.ok) {
    log(`payload load failed: ${loaded.reason}`);
    if (loaded.reason === 'payload-not-valid-json') {
      return buildResult({
        exit: 3,
        stdoutJson: { ok: false, reason: 'invalid-payload', detail: loaded.detail },
        stderrLines,
      });
    }
    return buildResult({
      exit: 2,
      stdoutJson: { ok: false, reason: loaded.reason, detail: loaded.detail },
      stderrLines,
    });
  }
  const payload = loaded.payload;
  log(`payload loaded from ${loaded.abs}`);

  // 3. Payload shape
  const shape = validatePayloadShape(payload);
  if (!shape.ok) {
    log(`payload shape invalid: ${shape.error}`);
    const detail = { error: shape.error };
    if (shape.missing) detail.missing = shape.missing;
    if (shape.field) detail.field = shape.field;
    return buildResult({
      exit: 3,
      stdoutJson: { ok: false, reason: 'invalid-payload', detail },
      stderrLines,
    });
  }
  log(`payload shape OK (field=${payload.field}, dryRun=${payload.dryRun})`);

  // 3.5. Mode determination (--apply ↔ dryRun:false must be paired)
  const wantsRealWrite = argvParsed.applyFlag === true && payload.dryRun === false;
  if (argvParsed.applyFlag === true && payload.dryRun !== false) {
    log('--apply rejected: must be paired with payload.dryRun:false');
    return buildResult({
      exit: 2,
      stdoutJson: {
        ok: false,
        reason: 'apply-requires-dryRun-false',
        detail: '--apply must be paired with payload.dryRun:false; refusing to write.',
      },
      stderrLines,
    });
  }
  if (payload.dryRun === false && argvParsed.applyFlag !== true) {
    log('payload.dryRun:false rejected: must be paired with --apply flag');
    return buildResult({
      exit: 2,
      stdoutJson: {
        ok: false,
        reason: 'dryRun-false-requires-apply',
        detail: 'payload.dryRun:false must be paired with --apply flag; refusing to write.',
      },
      stderrLines,
    });
  }
  log(`mode = ${wantsRealWrite ? 'apply (real-write)' : 'dry-run'}`);

  // 4. targetRel sanity
  const trCheck = validateTargetRel(payload.targetRel);
  if (!trCheck.ok) {
    log(`targetRel sanity failed: ${trCheck.reason}`);
    return buildResult({
      exit: 4,
      stdoutJson: { ok: false, reason: 'forbidden-target', detail: trCheck.reason, targetRel: payload.targetRel },
      stderrLines,
    });
  }

  // 5. Whitelist check on resolved absolute path
  const targetAbs = path.resolve(projectRoot, payload.targetRel);
  const wl = isWriteAllowed(targetAbs, projectRoot);
  if (!wl.ok) {
    log(`whitelist rejected: ${wl.reason}`);
    return buildResult({
      exit: 4,
      stdoutJson: {
        ok: false,
        reason: 'forbidden-target',
        detail: wl.reason,
        targetRel: payload.targetRel,
      },
      stderrLines,
    });
  }
  // CLI only accepts .md posts (both dry-run and real-write modes).
  if (wl.kind !== 'post-md') {
    log(`forbidden target kind: ${wl.kind}`);
    return buildResult({
      exit: 4,
      stdoutJson: {
        ok: false,
        reason: 'forbidden-target',
        detail: 'cli-only-allows-post-md',
        kind: wl.kind,
      },
      stderrLines,
    });
  }
  log(`target = ${wl.normalizedRel} (site=${wl.site}, kind=${wl.kind})`);

  // 6. Read current file
  let currentContent;
  try {
    currentContent = await fs.readFile(targetAbs, 'utf-8');
  } catch (err) {
    log(`read failed: ${err.message}`);
    return buildResult({
      exit: 8,
      stdoutJson: { ok: false, reason: 'read-failed', detail: err.message },
      stderrLines,
    });
  }

  // 7. Parse frontmatter
  let parsed;
  try {
    parsed = matter(currentContent);
  } catch (err) {
    log(`frontmatter parse failed: ${err.message}`);
    return buildResult({
      exit: 8,
      stdoutJson: { ok: false, reason: 'frontmatter-parse-failed', detail: err.message },
      stderrLines,
    });
  }
  const currentFm = parsed.data || {};
  const currentBody = parsed.content;

  // 8. status gate
  //   - dry-run accepts {'draft', 'ready'}
  //   - real-write narrows to {'draft'} (per 4.5e gate condition 5/16)
  const statusSet = wantsRealWrite ? ALLOWED_STATUSES_WRITE : ALLOWED_STATUSES_DRY;
  const actualStatus = currentFm.status;
  if (!statusSet.has(actualStatus)) {
    log(`status not allowed: actual=${actualStatus} (mode=${wantsRealWrite ? 'apply' : 'dry-run'})`);
    return buildResult({
      exit: 7,
      stdoutJson: {
        ok: false,
        reason: 'target-status-not-allowed',
        actualStatus: typeof actualStatus === 'string' ? actualStatus : null,
        allowed: Array.from(statusSet),
        mode: wantsRealWrite ? 'apply' : 'dry-run',
      },
      stderrLines,
    });
  }
  log(`status check OK (status=${actualStatus}, mode=${wantsRealWrite ? 'apply' : 'dry-run'})`);

  // 9. expectedOldValue check
  const actualOld = currentFm[payload.field];
  const actualOldStr = typeof actualOld === 'string' ? actualOld : '';
  if (actualOldStr !== payload.expectedOldValue) {
    log(`expectedOldValue mismatch (field=${payload.field})`);
    return buildResult({
      exit: 6,
      stdoutJson: {
        ok: false,
        reason: 'expected-old-value-mismatch',
        field: payload.field,
        actualOldLen: actualOldStr.length,
        expectedOldLen: payload.expectedOldValue.length,
      },
      stderrLines,
    });
  }
  log(`expectedOldValue match (len=${actualOldStr.length})`);

  // 10. Validate newValue
  const valRes = validateNewValue(payload.field, payload.newValue);
  if (!valRes.ok) {
    log(`validator failed: ${valRes.error}`);
    return buildResult({
      exit: 7,
      stdoutJson: {
        ok: false,
        reason: 'validator-failed',
        errors: [{ field: payload.field, error: valRes.error }],
        limits: {
          MAX_DESCRIPTION: LIMITS.MAX_DESCRIPTION,
          MAX_SEARCH_DESCRIPTION: LIMITS.MAX_SEARCH_DESCRIPTION,
        },
      },
      stderrLines,
    });
  }
  log(`validator (${getValidatorName(payload.field)}) = ok`);

  // 11. Patch via targeted frontmatter patcher (Phase 4.5e-b mitigation A)
  //   - replaces only the target field's inline scalar value
  //   - preserves all other frontmatter bytes verbatim (inline arrays / nested objects)
  //   - fail-closed on block scalar / missing key / duplicate key
  //   - never falls back to matter.stringify full YAML dump
  const patchRes = patchFrontmatter(currentContent, { [payload.field]: payload.newValue });
  if (!patchRes.ok) {
    log(`frontmatter patcher failed: ${patchRes.error}`);
    return buildResult({
      exit: 8,
      stdoutJson: {
        ok: false,
        reason: 'frontmatter-patch-failed',
        detail: patchRes.error,
        appliedPaths: patchRes.appliedPaths,
        skippedPaths: patchRes.skippedPaths,
      },
      stderrLines,
    });
  }
  const newContent = patchRes.output;

  const currentBytes = Buffer.byteLength(currentContent, 'utf-8');
  const wouldWriteBytes = Buffer.byteLength(newContent, 'utf-8');
  const fieldChanged = payload.newValue !== payload.expectedOldValue;
  const bytesChanged = newContent !== currentContent;

  const meta = {};
  if (typeof payload.reason === 'string') meta.reason = payload.reason;
  if (typeof payload.memo === 'string') meta.memo = payload.memo;

  const baseOutput = {
    target: wl.normalizedRel,
    site: wl.site,
    kind: wl.kind,
    field: payload.field,
    currentBytes,
    wouldWriteBytes,
    bytesDelta: wouldWriteBytes - currentBytes,
    diffSummary: {
      field: payload.field,
      oldLen: payload.expectedOldValue.length,
      newLen: payload.newValue.length,
      changed: fieldChanged,
      bytesChanged,
    },
    validators: { [payload.field]: { ok: true } },
    status: actualStatus,
    meta,
  };

  // ── Dry-run path ─────────────────────────────────────────────────────
  if (!wantsRealWrite) {
    log(`mode = dry-run (no fs write)`);
    log(`diff: ${currentBytes} → ${wouldWriteBytes} bytes (${wouldWriteBytes - currentBytes >= 0 ? '+' : ''}${wouldWriteBytes - currentBytes})`);
    log(`PASS — dry-run only; no fs write performed`);

    return buildResult({
      exit: 0,
      stdoutJson: {
        ok: true,
        mode: 'dry-run',
        phase: '4.5e-dry-run',
        written: false,
        changed: bytesChanged,
        ...baseOutput,
      },
      stderrLines,
    });
  }

  // ── Real-write path (--apply + dryRun:false) ─────────────────────────
  //   Per 4.5e gate condition 8: patcher.changed === false → no fs write.
  if (!bytesChanged) {
    log('apply requested but patcher reports no bytes change — skipping fs write');
    return buildResult({
      exit: 0,
      stdoutJson: {
        ok: true,
        mode: 'apply',
        phase: '4.5e-real-write',
        written: false,
        changed: false,
        skipped: 'no-op',
        ...baseOutput,
      },
      stderrLines,
    });
  }

  // Per 4.5e gate condition 9: TOCTOU defense — re-check whitelist immediately
  // before fs write. Path resolution / kind could differ from initial check if
  // the filesystem changed underneath us between the read and the write.
  const wl2 = isWriteAllowed(targetAbs, projectRoot);
  if (!wl2.ok || wl2.kind !== 'post-md') {
    log('pre-write whitelist re-check failed');
    return buildResult({
      exit: 4,
      stdoutJson: {
        ok: false,
        reason: 'forbidden-target',
        detail: wl2.ok ? 'pre-write-kind-mismatch' : wl2.reason,
        stage: 'pre-write-recheck',
      },
      stderrLines,
    });
  }

  // gitStatus check (injectable for hermetic tests via __testOverrides.gitStatusFn).
  const gitStatusFn =
    __testOverrides && typeof __testOverrides.gitStatusFn === 'function'
      ? __testOverrides.gitStatusFn
      : checkGitStatus;
  let gitStatus;
  try {
    gitStatus = await gitStatusFn({ cwd: projectRoot });
  } catch (err) {
    log(`gitStatus probe threw: ${err.message}`);
    return buildResult({
      exit: 8,
      stdoutJson: { ok: false, reason: 'git-status-failed', detail: err.message },
      stderrLines,
    });
  }

  // Atomic write via safeWrite (whitelist + git-clean + tmp+rename).
  // Field-level validation already ran at step 10; no additional validators here.
  const wr = await safeWrite({
    targetPath: targetAbs,
    newContent,
    projectRoot,
    validators: [],
    gitStatus,
    enforceCleanGit: true,
  });

  if (!wr.ok) {
    log(`safeWrite failed: ${wr.reason}`);
    const detail = {};
    if (wr.detail) detail.detail = wr.detail;
    if (Array.isArray(wr.dirtyFiles)) detail.dirtyFiles = wr.dirtyFiles;
    if (Array.isArray(wr.untracked)) detail.untracked = wr.untracked;
    if (Array.isArray(wr.errors)) detail.errors = wr.errors;
    return buildResult({
      exit: 8,
      stdoutJson: {
        ok: false,
        reason: 'safe-write-failed',
        safeWriteReason: wr.reason,
        ...detail,
      },
      stderrLines,
    });
  }

  log(`APPLY WRITTEN: ${wl2.normalizedRel} (${currentBytes} → ${wouldWriteBytes} bytes, delta ${wouldWriteBytes - currentBytes >= 0 ? '+' : ''}${wouldWriteBytes - currentBytes})`);

  return buildResult({
    exit: 0,
    stdoutJson: {
      ok: true,
      mode: 'apply',
      phase: '4.5e-real-write',
      written: true,
      changed: true,
      ...baseOutput,
    },
    stderrLines,
  });
}

function isMainModule() {
  if (!process.argv[1]) return false;
  const argvUrl = new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;
  return import.meta.url === argvUrl;
}

if (isMainModule()) {
  runCli({ argv: process.argv.slice(2), projectRoot: process.cwd() }).then(
    ({ exit, stdoutJson, stderrLines }) => {
      for (const line of stderrLines) process.stderr.write(line + '\n');
      process.stdout.write(JSON.stringify(stdoutJson) + '\n');
      process.exit(exit);
    },
    (err) => {
      process.stderr.write(`[admin-write] crashed: ${err && err.stack ? err.stack : err}\n`);
      process.stdout.write(JSON.stringify({ ok: false, reason: 'unknown-error', detail: String(err) }) + '\n');
      process.exit(1);
    },
  );
}
