// Phase 20260528-am-1 Admin Write Infra §15.G phase 4.5c
//   - CLI write driver — dry-run ONLY
//   - 4.5c gate: real write (--apply / dryRun:false) is FAIL-SAFE rejected;
//     real-write path opens in phase 4.5e, not here.
//   - Accepts JSON payload via --payload=<file> (Candidate B per preanalysis §5.5).
//   - Loads file → parses → validates shape → reads target post → checks status /
//     expectedOldValue → runs field validator → emits dry-run JSON + stderr trace.
//   - Never calls fs.writeFile / fs.rename / safeWrite (no real write surface).
//   - Exit codes follow preanalysis §13.1.
//
// Module shape:
//   - export async function runCli({ argv, projectRoot })
//       → { exit: number, stdoutJson: object, stderrLines: string[] }
//   - When invoked as the main script, the runner serialises stdoutJson + writes
//     stderrLines, then process.exit(exit). Tests import runCli directly so they
//     can assert without process.exit.

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

const ALLOWED_FIELDS = new Set(['description', 'searchDescription']);
const ALLOWED_STATUSES = new Set(['draft', 'ready']);

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

export async function runCli({ argv, projectRoot } = {}) {
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

  // 4.5c gate: --apply is rejected outright (phase 4.5e enables it).
  if (argvParsed.applyFlag) {
    log('--apply rejected: phase 4.5c is dry-run only');
    return buildResult({
      exit: 2,
      stdoutJson: {
        ok: false,
        reason: 'apply-not-supported-in-phase-4p5c',
        detail: 'CLI is dry-run only. Real write opens in phase 4.5e.',
      },
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

  // 4.5c gate: dryRun:false is rejected.
  if (payload.dryRun === false) {
    log('payload.dryRun=false rejected: phase 4.5c is dry-run only');
    return buildResult({
      exit: 2,
      stdoutJson: {
        ok: false,
        reason: 'apply-not-supported-in-phase-4p5c',
        detail: 'payload.dryRun must be true. Real write opens in phase 4.5e.',
      },
      stderrLines,
    });
  }

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
  // 4.5c only accepts .md posts.
  if (wl.kind !== 'post-md') {
    log(`forbidden target kind: ${wl.kind}`);
    return buildResult({
      exit: 4,
      stdoutJson: {
        ok: false,
        reason: 'forbidden-target',
        detail: 'phase-4p5c-only-allows-post-md',
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

  // 8. status gate (draft / ready only)
  const actualStatus = currentFm.status;
  if (!ALLOWED_STATUSES.has(actualStatus)) {
    log(`status not allowed: actual=${actualStatus}`);
    return buildResult({
      exit: 7,
      stdoutJson: {
        ok: false,
        reason: 'target-status-not-allowed',
        actualStatus: typeof actualStatus === 'string' ? actualStatus : null,
        allowed: ['draft', 'ready'],
      },
      stderrLines,
    });
  }
  log(`status check OK (status=${actualStatus})`);

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

  log(`mode = dry-run (no fs write)`);
  log(`diff: ${currentBytes} → ${wouldWriteBytes} bytes (${wouldWriteBytes - currentBytes >= 0 ? '+' : ''}${wouldWriteBytes - currentBytes})`);
  log(`PASS — phase 4.5c is dry-run only; no real write opens here`);

  return buildResult({
    exit: 0,
    stdoutJson: {
      ok: true,
      mode: 'dry-run',
      phase: '4.5c',
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
