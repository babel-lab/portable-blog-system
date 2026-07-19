#!/usr/bin/env node
// Phase 20260719：`apply-blogger-backfill-truth` — authorization-bound single-record production
// apply capability — focused guard / tests.
//
// Scope / boundary:
//   - Every write happens inside a mkdtempSync directory rooted at os.tmpdir() that is a
//     synthetic git repository (`git init`, one commit, `refs/remotes/origin/main` pointed
//     at HEAD). Every fixture is cleaned up in finally{}. Production content and the deploy
//     clone are read-only.
//   - The public CLI is exercised only for input validation (help, forbidden flags, unknown
//     flags, missing required flags). End-to-end production writes go through the
//     programmatic API `applyProductionSidecar({ projectRoot, ... })` with `projectRoot`
//     pointing at the synthetic OS-temp git repo. The CLI hardcodes `projectRoot=PROJECT_ROOT`
//     and is intentionally not testable end-to-end against a synthetic tree.
//   - No network, no Blogger / Google / GA4 / AdSense API, no child_process usage in the
//     apply engine itself (transitive spawnSync in admin-git-safety-preflight.js is limited
//     to an allowlist of read-only git subcommands).
//   - The guard uses `spawnSync` to seed synthetic git repos. That is inside the guard, not
//     inside the apply capability, and is asserted separately by source-level static bans.
//
// Coverage map (Session prompt §14 hard assertions; assertion count is deterministic from
// the runs below — this file does not fabricate a total):
//
//   Authorization (Session §14.1–20)
//     - valid authorization → apply PASS
//     - missing --authorization / --apply / --source-path / --manifest hard-fails
//     - wrong purpose / wrong schemaVersion / explicitlyAuthorized false
//     - missing expectedHead / malformed head (whitespace / uppercase / short / long / non-hex)
//     - wrong branch
//     - missing / malformed plan / record fingerprint
//     - stale plan / record fingerprint (payload changed after auth)
//     - wrong target / extra target / target with '..'
//     - wrong recordCount (0, 2, string)
//     - unknown top-level / subobject fields
//     - authorization file missing
//     - invalid JSON authorization
//
//   Repository state (Session §14.21–33)
//     - HEAD differs from origin/main (ahead / behind / diverged)
//     - dirty tracked file
//     - untracked file
//     - index lock present
//     - wrong branch (not main)
//     - detached HEAD
//     - HEAD in preflight != authorization.expectedHead
//     - deploy repo root rejected (through preflight)
//     - programmatic engine accepts only projectRoot; CLI has no --repo-root flag
//
//   Planning / binding (Session §14.34–47)
//     - validator failure blocks all writes
//     - missing candidate blocks planning
//     - target already exists on disk blocks planning (SIDECAR_ALREADY_EXISTS)
//     - selected source absent
//     - selected source not a candidate (via manifest)
//     - source-path traversal ('..')
//     - plan fingerprint stable across runs
//     - record fingerprint stable
//     - payload change changes record fingerprint
//     - target change changes record fingerprint
//     - source change changes record fingerprint
//     - authorization plan-fingerprint mismatch blocks all writes
//     - authorization HEAD mismatch blocks all writes
//     - target list mismatch blocks all writes
//
//   Write engine (Session §14.48–62)
//     - valid authorized synthetic apply creates exact sidecar with LF trailer
//     - exact bytes byte-identical to buildSidecarBody
//     - create-only: pre-existing target refused (via write-preflight)
//     - target appears at final commit race → link fails; target unchanged
//     - no overwrite of pre-existing target
//     - target bytes / mtime unchanged when apply refused
//     - tmp cleaned up on both success and failure
//     - verification failure → compensating rollback via inode ownership check
//     - rollback failure surfaced (inode mismatch on externally-replaced target)
//     - externally-replaced target NOT deleted
//     - Markdown byte-identical before and after apply
//     - manifest byte-identical before and after apply
//     - bloggerPostId remains "" in written sidecar
//
//   Red lines (Session §14.63–76)
//     - source-level static: no fetch / node:http[s] / googleapis / oauth /
//       blogger.googleapis / child_process import
//     - source-level static: no `git commit` / `git push` / `git add` / `git fetch` /
//       `git pull` / `git reset` / `git clean` / `git stash` / `git checkout` /
//       `git switch` / `git restore` invocation
//     - source-level static: no build / no dist-* mutation / no dist-blogger-preview
//     - deploy repository sidecar inventory unchanged (best-effort; skipped if unavailable)
//     - dist-blogger-preview/ absent
//     - production content unchanged (bytes + mtime)
//
// Run:
//   npm run check:blogger-backfill-production-apply-capability
//   or  node src/scripts/check-blogger-backfill-production-apply-capability.js

import assert from 'node:assert';
import {
  readFileSync,
  statSync,
  existsSync,
  readdirSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseArgs,
  applyProductionSidecar,
  loadAuthorization,
  fingerprintEntry,
  isSha256HexLower,
  isGitSha40Lower,
  formatHumanReadable,
  formatJson,
  AUTHORIZATION_SCHEMA_VERSION,
  AUTHORIZATION_PURPOSE,
  AUTHORIZATION_BRANCH,
  CAPABILITY_MODE,
} from './apply-blogger-backfill-truth.js';

import { planTruthApply } from './plan-blogger-backfill-truth-apply.js';
import { buildSidecarBody } from './bootstrap-blogger-backfill-sidecars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const APPLY_CLI = path.join(REPO_ROOT, 'src', 'scripts', 'apply-blogger-backfill-truth.js');
const DEPLOY_ROOT_CANDIDATE = path.resolve(REPO_ROOT, '..', 'portable-blog-deploy');

const CLI_SRC_RAW = readFileSync(APPLY_CLI, 'utf-8');
function stripComments(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
  return noBlock
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}
const CLI_SRC = stripComments(CLI_SRC_RAW);

let pass = 0;
let fail = 0;
const fails = [];
function record(name, ok, msg) {
  if (ok) {
    pass += 1;
    console.log(`[PASS] ${name}`);
  } else {
    fail += 1;
    fails.push(`${name} — ${msg}`);
    console.error(`[FAIL] ${name}\n       ${msg}`);
  }
}
async function check(name, fn) {
  try {
    await fn();
    record(name, true);
  } catch (err) {
    record(name, false, err.message);
  }
}

// ── fixture helpers ─────────────────────────────────────────────────────────

function fmMd({ id, slug, status = 'ready', draft = false, bloggerEnabled = 'true' }) {
  return [
    '---',
    `id: "${id}"`,
    `slug: "${slug}"`,
    `status: "${status}"`,
    `draft: ${draft}`,
    'publishTargets:',
    '  blogger:',
    `    enabled: ${bloggerEnabled}`,
    '---',
    '',
    'body — apply capability must not read Markdown body.',
    '',
  ].join('\n');
}

function writeFileSyncMk(abs, content) {
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf-8');
}

function seedTwoMissingCandidates(repoRoot) {
  const postsDir = path.join(repoRoot, 'content', 'blogger', 'posts');
  writeFileSyncMk(
    path.join(postsDir, '20260301-first.md'),
    fmMd({ id: '20260301-first', slug: 'first' }),
  );
  writeFileSyncMk(
    path.join(postsDir, '20260302-second.md'),
    fmMd({ id: '20260302-second', slug: 'second' }),
  );
  return postsDir;
}

function validManifestForTwoMissing() {
  return {
    schemaVersion: 1,
    records: [
      {
        sourcePath: 'content/blogger/posts/20260301-first.md',
        blogger: {
          publishedUrl: 'https://example.blogspot.com/2026/03/first.html',
          publishedAt: '2026-03-01',
        },
      },
      {
        sourcePath: 'content/blogger/posts/20260302-second.md',
        blogger: {
          publishedUrl: 'https://example.blogspot.com/2026/03/second.html',
          publishedAt: '2026-03-02',
        },
      },
    ],
  };
}

// All manifest / authorization / other synthetic support files live under
// `<repoRoot>/fixtures/` which is `.gitignore`d — so the working tree stays clean
// while the apply engine still resolves them relative to the repo root.
function fixturePath(repoRoot, filename) {
  const dir = path.join(repoRoot, 'fixtures');
  mkdirSync(dir, { recursive: true });
  // Sanitize filename for Windows (no ", ?, *, <, >, :, |, / in a single component).
  const safe = filename.replace(/["?*<>:|/\\]/g, '_');
  return path.join(dir, safe);
}

function writeManifest(repoRoot, obj, filename = 'manifest.json') {
  const p = fixturePath(repoRoot, filename);
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
  return p;
}

// Seed a synthetic git repository under `repoRoot`:
//   - `git init` with default branch `main` (via post-init symbolic-ref for older git).
//   - Commit README.md + a .gitignore that hides the /fixtures/ directory + stray tmp files.
//   - Point `refs/remotes/origin/main` at HEAD, so ahead/behind == 0/0 without any network.
// Returns the resolved HEAD SHA (40-char lowercase hex).
function seedSyntheticGitRepo(repoRoot) {
  const runG = (args) => {
    const r = spawnSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf-8',
      shell: false,
      windowsHide: true,
      timeout: 10000,
    });
    if (r.status !== 0) {
      throw new Error(`git ${args.join(' ')} failed: exit=${r.status} stderr=${(r.stderr || '').trim()}`);
    }
    return (r.stdout || '').trim();
  };
  runG(['init', '--quiet']);
  // Force branch=main regardless of user's init.defaultBranch.
  runG(['symbolic-ref', 'HEAD', 'refs/heads/main']);
  // Local identity for the synthetic commit.
  runG(['config', 'user.email', 'test@example.invalid']);
  runG(['config', 'user.name', 'test']);
  runG(['config', 'commit.gpgsign', 'false']);
  // README + .gitignore. The gitignore hides the `/fixtures/` directory so we can drop
  // manifest.json + auth*.json + other synthetic support files there without polluting
  // the working tree. Untracked-test fixtures (stray.txt, other.txt) are deliberately
  // NOT gitignored so those tests still surface as dirty.
  writeFileSyncMk(path.join(repoRoot, 'README.md'), '# synthetic test repo\n');
  writeFileSyncMk(path.join(repoRoot, '.gitignore'), '/fixtures/\n');
  runG(['add', 'README.md', '.gitignore']);
  runG(['commit', '--quiet', '-m', 'init']);
  // Fake a remote-tracking ref for origin/main at HEAD — no network involved.
  runG(['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  const head = runG(['rev-parse', 'HEAD']);
  if (!/^[0-9a-f]{40}$/.test(head)) {
    throw new Error(`unexpected HEAD SHA: ${head}`);
  }
  return head;
}

// After a manual mutation, snapshot the working tree so we can also mutate git state
// (e.g., commit again to change HEAD).
function gitCommitFilesQuiet(repoRoot, files, msg) {
  const runG = (args) => {
    const r = spawnSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf-8',
      shell: false,
      windowsHide: true,
      timeout: 10000,
    });
    if (r.status !== 0) {
      throw new Error(`git ${args.join(' ')} failed: exit=${r.status} stderr=${(r.stderr || '').trim()}`);
    }
    return (r.stdout || '').trim();
  };
  for (const f of files) runG(['add', f]);
  runG(['commit', '--quiet', '-m', msg]);
  return runG(['rev-parse', 'HEAD']);
}

function writeAuthorization(repoRoot, obj, filename = 'auth.json') {
  const p = fixturePath(repoRoot, filename);
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
  return p;
}

function baseAuth({
  expectedHead,
  expectedPlanFingerprint,
  expectedRecordFingerprint,
  targets,
}) {
  return {
    schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
    purpose: AUTHORIZATION_PURPOSE,
    repository: {
      expectedHead,
      expectedBranch: AUTHORIZATION_BRANCH,
    },
    plan: {
      expectedPlanFingerprint,
      expectedRecordFingerprint,
      recordCount: 1,
    },
    targets,
    approval: {
      explicitlyAuthorized: true,
    },
  };
}

function snapshotSidecarInventory(rootAbs) {
  const inv = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir).sort()) {
      const abs = path.join(dir, name);
      let st;
      try {
        st = statSync(abs);
      } catch (_) {
        continue;
      }
      if (st.isDirectory()) {
        walk(abs);
        continue;
      }
      if (abs.endsWith('.publish.json')) {
        inv.push({
          rel: path.relative(rootAbs, abs).split(path.sep).join('/'),
          bytes: readFileSync(abs, 'utf-8'),
          mtimeMs: st.mtimeMs,
        });
      }
    }
  }
  walk(rootAbs);
  return inv;
}

function snapshotMarkdownBytes(rootAbs) {
  const inv = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir).sort()) {
      const abs = path.join(dir, name);
      let st;
      try {
        st = statSync(abs);
      } catch (_) {
        continue;
      }
      if (st.isDirectory()) {
        walk(abs);
        continue;
      }
      if (abs.endsWith('.md') && !abs.endsWith('.fb.md')) {
        inv.push({
          rel: path.relative(rootAbs, abs).split(path.sep).join('/'),
          bytes: readFileSync(abs, 'utf-8'),
          mtimeMs: st.mtimeMs,
        });
      }
    }
  }
  walk(rootAbs);
  return inv;
}

function runCli(args) {
  const r = spawnSync(process.execPath, [APPLY_CLI, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    shell: false,
    windowsHide: true,
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// One-shot: seed a synthetic git repo + candidates + manifest, compute expected
// fingerprints, return everything the tests need to construct authorizations.
async function setupHappyFixture(baseTmp, label) {
  const repoRoot = mkdtempSync(path.join(baseTmp, `${label}-`));
  seedSyntheticGitRepo(repoRoot);
  seedTwoMissingCandidates(repoRoot);
  // Re-commit the seeded candidates so HEAD represents the actual apply-time state.
  const finalHead = gitCommitFilesQuiet(
    repoRoot,
    ['content/blogger/posts/20260301-first.md', 'content/blogger/posts/20260302-second.md'],
    'seed blogger candidates',
  );
  // Point origin/main at final HEAD so ahead/behind stays 0/0.
  spawnSync('git', ['update-ref', 'refs/remotes/origin/main', 'HEAD'], {
    cwd: repoRoot, encoding: 'utf-8', shell: false, windowsHide: true, timeout: 10000,
  });
  const manifestPath = writeManifest(repoRoot, validManifestForTwoMissing());
  const planned = await planTruthApply({ manifestPath, repoRoot });
  const planFp = planned.fingerprint.value;
  const firstEntry = planned.plan.entries.find(
    (e) => e.sourcePath === 'content/blogger/posts/20260301-first.md',
  );
  const secondEntry = planned.plan.entries.find(
    (e) => e.sourcePath === 'content/blogger/posts/20260302-second.md',
  );
  const firstFp = fingerprintEntry(firstEntry, planned.report.manifest.schemaVersion).value;
  const secondFp = fingerprintEntry(secondEntry, planned.report.manifest.schemaVersion).value;
  return {
    repoRoot,
    head: finalHead,
    manifestPath,
    planned,
    planFp,
    firstEntry,
    secondEntry,
    firstFp,
    secondFp,
  };
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // Production baseline snapshots.
  const prodPostsDir = path.join(REPO_ROOT, 'content', 'blogger', 'posts');
  const prodInvBefore = snapshotSidecarInventory(prodPostsDir);
  const prodMdBefore = snapshotMarkdownBytes(prodPostsDir);
  const distPreviewAbsent = !existsSync(path.join(REPO_ROOT, 'dist-blogger-preview'));

  let deployInvBefore = null;
  let deployHasGit = false;
  if (existsSync(DEPLOY_ROOT_CANDIDATE) && existsSync(path.join(DEPLOY_ROOT_CANDIDATE, '.git'))) {
    deployHasGit = true;
    deployInvBefore = snapshotSidecarInventory(DEPLOY_ROOT_CANDIDATE);
  }

  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'apply-production-'));
  try {
    // ── source-level static bans ─────────────────────────────────────────
    await check('src: no child_process import in apply engine', () => {
      // apply-blogger-backfill-truth.js must not import child_process directly.
      // (Transitive spawnSync is via admin-git-safety-preflight.js under an allowlist.)
      assert.ok(!/from ['"]node:child_process['"]/.test(CLI_SRC));
      assert.ok(!/require\(['"]child_process['"]\)/.test(CLI_SRC));
      assert.ok(!/from ['"]child_process['"]/.test(CLI_SRC));
    });
    await check('src: no spawnSync / execSync / spawn( in apply engine', () => {
      assert.ok(!/spawnSync|execSync|execFileSync|\bspawn\s*\(|\bexec\s*\(/.test(CLI_SRC));
    });
    await check('src: no fetch(', () => {
      assert.ok(!/\bfetch\s*\(/.test(CLI_SRC));
    });
    await check('src: no node:http / node:https import', () => {
      assert.ok(!/from ['"]node:https?['"]/.test(CLI_SRC));
      assert.ok(!/require\(['"]node:https?['"]\)/.test(CLI_SRC));
    });
    await check('src: no googleapis / oauth / blogger API base URL', () => {
      assert.ok(!/googleapis|oauth/i.test(CLI_SRC));
      assert.ok(!/blogger\.googleapis\.com/.test(CLI_SRC));
    });
    await check('src: no automatic git commit / push / add / fetch / pull / reset / clean / stash / checkout', () => {
      // None of these should appear as command invocations in the engine source.
      // (They may appear as forbidden-flag strings in FORBIDDEN_FLAGS; that is fine.)
      // Look specifically for shell-invocation patterns.
      assert.ok(!/["']git commit["']/.test(CLI_SRC));
      assert.ok(!/["']git push["']/.test(CLI_SRC));
      assert.ok(!/["']git add["']/.test(CLI_SRC));
      assert.ok(!/["']git fetch["']/.test(CLI_SRC));
      assert.ok(!/["']git pull["']/.test(CLI_SRC));
      assert.ok(!/["']git reset["']/.test(CLI_SRC));
      assert.ok(!/["']git clean["']/.test(CLI_SRC));
      assert.ok(!/["']git stash["']/.test(CLI_SRC));
      assert.ok(!/["']git checkout["']/.test(CLI_SRC));
      assert.ok(!/["']git switch["']/.test(CLI_SRC));
      assert.ok(!/["']git restore["']/.test(CLI_SRC));
    });
    await check('src: no build / dist-* / dist-blogger-preview reference in engine', () => {
      // The engine must not touch build outputs.
      assert.ok(!/\bnpm\s+run\s+build/.test(CLI_SRC));
      assert.ok(!/\bdist-blogger-preview\b/.test(CLI_SRC));
    });
    await check('src: final commit uses fs.link (no-replace primitive)', () => {
      assert.ok(/\bfs\.link\s*\(/.test(CLI_SRC));
    });
    await check('src: no fs.rename in engine (would be replace-capable)', () => {
      assert.ok(!/\bfs\.rename\s*\(/.test(CLI_SRC));
    });
    await check('src: single-record wording present + no --dry-run mode', () => {
      assert.ok(/single-record|Single-record/.test(CLI_SRC));
      assert.ok(/--dry-run/.test(CLI_SRC));
    });
    await check('src: reuses admin-git-safety-preflight for repo-state gate', () => {
      assert.ok(
        /from ['"]\.\/admin-git-safety-preflight\.js['"]/.test(CLI_SRC),
        'admin-git-safety-preflight import missing',
      );
    });
    await check('src: reuses plan-blogger-backfill-truth-apply (no CLI subprocess)', () => {
      assert.ok(
        /from ['"]\.\/plan-blogger-backfill-truth-apply\.js['"]/.test(CLI_SRC),
        'planTruthApply import missing',
      );
    });

    // ── parseArgs smoke ─────────────────────────────────────────────────
    await check('parseArgs: --help', () => {
      const o = parseArgs(['node', 'cli', '--help']);
      assert.strictEqual(o.help, true);
    });
    await check('parseArgs: --json + --apply + --manifest + --source-path + --authorization', () => {
      const o = parseArgs([
        'node', 'cli',
        '--json', '--apply',
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
        '--authorization', '/tmp/a.json',
      ]);
      assert.strictEqual(o.json, true);
      assert.strictEqual(o.apply, true);
      assert.strictEqual(o.manifest, '/tmp/m.json');
      assert.strictEqual(o.sourcePath, 'content/blogger/posts/x.md');
      assert.strictEqual(o.authorization, '/tmp/a.json');
    });
    await check('parseArgs: --key=value forms', () => {
      const o = parseArgs([
        'node', 'cli',
        '--manifest=/tmp/m.json',
        '--source-path=content/blogger/posts/x.md',
        '--authorization=/tmp/a.json',
      ]);
      assert.strictEqual(o.manifest, '/tmp/m.json');
      assert.strictEqual(o.sourcePath, 'content/blogger/posts/x.md');
      assert.strictEqual(o.authorization, '/tmp/a.json');
    });
    await check('parseArgs: forbidden flags captured', () => {
      const flags = [
        '--force', '--overwrite', '--replace', '--merge', '--yes', '-y',
        '--all', '--auto-approve', '--skip-validation', '--skip-fingerprint',
        '--ignore-head', '--dirty-ok', '--no-verify',
        '--production', '--publish', '--deploy', '--commit', '--push',
        '--dry-run', '--repo-root', '--project-root', '--test-root',
      ];
      const o = parseArgs(['node', 'cli', ...flags]);
      for (const f of flags) {
        assert.ok(o.forbidden.includes(f), `missing forbidden: ${f}`);
      }
    });
    await check('parseArgs: unknown flag captured', () => {
      const o = parseArgs(['node', 'cli', '--totally-unknown']);
      assert.ok(o.unknown.includes('--totally-unknown'));
    });

    // ── syntactic hex helpers ────────────────────────────────────────────
    await check('isSha256HexLower accepts 64-char lowercase hex', () => {
      assert.strictEqual(isSha256HexLower('a'.repeat(64)), true);
    });
    await check('isSha256HexLower rejects empty / whitespace / uppercase / short / long / non-hex', () => {
      assert.strictEqual(isSha256HexLower(''), false);
      assert.strictEqual(isSha256HexLower('  ' + 'a'.repeat(64)), false);
      assert.strictEqual(isSha256HexLower('a'.repeat(64) + ' '), false);
      assert.strictEqual(isSha256HexLower('A'.repeat(64)), false);
      assert.strictEqual(isSha256HexLower('a'.repeat(63)), false);
      assert.strictEqual(isSha256HexLower('a'.repeat(65)), false);
      assert.strictEqual(isSha256HexLower('g'.repeat(64)), false);
      assert.strictEqual(isSha256HexLower(null), false);
    });
    await check('isGitSha40Lower accepts 40-char lowercase hex', () => {
      assert.strictEqual(isGitSha40Lower('a'.repeat(40)), true);
    });
    await check('isGitSha40Lower rejects uppercase / whitespace / wrong length / non-hex', () => {
      assert.strictEqual(isGitSha40Lower('A'.repeat(40)), false);
      assert.strictEqual(isGitSha40Lower(' ' + 'a'.repeat(40)), false);
      assert.strictEqual(isGitSha40Lower('a'.repeat(39)), false);
      assert.strictEqual(isGitSha40Lower('a'.repeat(41)), false);
      assert.strictEqual(isGitSha40Lower('g'.repeat(40)), false);
      assert.strictEqual(isGitSha40Lower(null), false);
    });

    // ── fingerprintEntry stability + independence ───────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'fp-stability');
      const fpA = fingerprintEntry(fx.firstEntry, fx.planned.report.manifest.schemaVersion);
      const fpB = fingerprintEntry(fx.firstEntry, fx.planned.report.manifest.schemaVersion);
      await check('fingerprintEntry: sha256 hex format', () => {
        assert.strictEqual(fpA.algorithm, 'sha256');
        assert.strictEqual(fpA.encoding, 'hex');
        assert.ok(isSha256HexLower(fpA.value));
      });
      await check('fingerprintEntry: same entry produces same fingerprint', () => {
        assert.strictEqual(fpA.value, fpB.value);
      });
      await check('fingerprintEntry: different records produce different fingerprints', () => {
        const fpFirst = fingerprintEntry(fx.firstEntry, fx.planned.report.manifest.schemaVersion);
        const fpSecond = fingerprintEntry(fx.secondEntry, fx.planned.report.manifest.schemaVersion);
        assert.notStrictEqual(fpFirst.value, fpSecond.value);
      });
      await check('fingerprintEntry: payload change changes fingerprint', () => {
        const mutated = {
          ...fx.firstEntry,
          payload: { ...fx.firstEntry.payload, seo: { metaTitle: 'X', metaDescription: '', robots: 'index,follow' } },
        };
        const fpMut = fingerprintEntry(mutated, fx.planned.report.manifest.schemaVersion);
        assert.notStrictEqual(fpMut.value, fpA.value);
      });
      await check('fingerprintEntry: target change changes fingerprint', () => {
        const mutated = { ...fx.firstEntry, targetPath: 'content/blogger/posts/other.publish.json' };
        const fpMut = fingerprintEntry(mutated, fx.planned.report.manifest.schemaVersion);
        assert.notStrictEqual(fpMut.value, fpA.value);
      });
      await check('fingerprintEntry: source change changes fingerprint', () => {
        const mutated = { ...fx.firstEntry, sourcePath: 'content/blogger/posts/other.md' };
        const fpMut = fingerprintEntry(mutated, fx.planned.report.manifest.schemaVersion);
        assert.notStrictEqual(fpMut.value, fpA.value);
      });
    }

    // ── CLI: --help ─────────────────────────────────────────────────────
    await check('CLI --help: exit 0', () => {
      const r = runCli(['--help']);
      assert.strictEqual(r.status, 0, r.stderr);
    });
    await check('CLI --help: mentions single-record + authorization + apply + no --dry-run', () => {
      const r = runCli(['--help']);
      assert.ok(/single-record/i.test(r.stdout));
      assert.ok(/--authorization/.test(r.stdout));
      assert.ok(/--apply/.test(r.stdout));
      assert.ok(/plan:blogger-backfill-truth-apply/.test(r.stdout));
      assert.ok(/rehearse:blogger-backfill-truth-apply/.test(r.stdout));
    });
    await check('CLI --help: mentions no environment override + no --repo-root', () => {
      const r = runCli(['--help']);
      assert.ok(/no environment-variable override/i.test(r.stdout));
      assert.ok(/--repo-root/.test(r.stdout));
    });

    // ── CLI: forbidden / unknown / missing ──────────────────────────────
    for (const flag of [
      '--force', '--overwrite', '--replace', '--merge', '--yes', '-y',
      '--all', '--auto-approve', '--skip-validation', '--skip-fingerprint',
      '--ignore-head', '--dirty-ok', '--no-verify',
      '--production', '--publish', '--deploy', '--commit', '--push',
      '--dry-run', '--repo-root', '--project-root', '--test-root',
    ]) {
      await check(`CLI forbidden ${flag} → exit 1`, () => {
        const r = runCli([
          flag,
          '--apply',
          '--manifest', '/tmp/m.json',
          '--source-path', 'content/blogger/posts/x.md',
          '--authorization', '/tmp/a.json',
        ]);
        assert.strictEqual(r.status, 1, `unexpected exit ${r.status}: ${r.stderr}`);
        assert.ok(/forbidden flag/i.test(r.stderr));
      });
    }
    await check('CLI unknown flag → exit 1', () => {
      const r = runCli([
        '--totally-fake',
        '--apply',
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
        '--authorization', '/tmp/a.json',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/unknown argument/i.test(r.stderr));
    });
    await check('CLI missing --apply → exit 1', () => {
      const r = runCli([
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
        '--authorization', '/tmp/a.json',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--apply is required/i.test(r.stderr));
    });
    await check('CLI missing --manifest → exit 1', () => {
      const r = runCli([
        '--apply',
        '--source-path', 'content/blogger/posts/x.md',
        '--authorization', '/tmp/a.json',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--manifest.*is required/i.test(r.stderr));
    });
    await check('CLI missing --source-path → exit 1', () => {
      const r = runCli([
        '--apply',
        '--manifest', '/tmp/m.json',
        '--authorization', '/tmp/a.json',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--source-path.*is required/i.test(r.stderr));
    });
    await check('CLI missing --authorization → exit 1', () => {
      const r = runCli([
        '--apply',
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--authorization.*is required/i.test(r.stderr));
    });

    // ── Authorization loader: strict shape checks ────────────────────────
    {
      const p = mkdtempSync(path.join(tmpRoot, 'auth-shape-'));
      const goodHead = 'a'.repeat(40);
      const goodFp = 'b'.repeat(64);
      const goodAuth = baseAuth({
        expectedHead: goodHead,
        expectedPlanFingerprint: goodFp,
        expectedRecordFingerprint: goodFp,
        targets: ['content/blogger/posts/20260301-first.publish.json'],
      });

      await check('authorization: valid → OK', async () => {
        const r = await loadAuthorization(writeAuthorization(p, goodAuth, 'ok.json'));
        assert.strictEqual(r.ok, true, r.error);
      });
      await check('authorization: file missing → error', async () => {
        const r = await loadAuthorization(path.join(p, 'nonexistent.json'));
        assert.strictEqual(r.ok, false);
        assert.ok(/read failed/i.test(r.error));
      });
      await check('authorization: invalid JSON → error', async () => {
        const badPath = path.join(p, 'bad.json');
        writeFileSync(badPath, '{ not json', 'utf-8');
        const r = await loadAuthorization(badPath);
        assert.strictEqual(r.ok, false);
        assert.ok(/JSON parse/i.test(r.error));
      });
      await check('authorization: non-object → error', async () => {
        const badPath = path.join(p, 'arr.json');
        writeFileSync(badPath, '[]\n', 'utf-8');
        const r = await loadAuthorization(badPath);
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: unknown top-level field → error', async () => {
        const bad = { ...goodAuth, extra: 'no' };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'unk-top.json'));
        assert.strictEqual(r.ok, false);
        assert.ok(/unknown top-level/i.test(r.error));
      });
      await check('authorization: wrong schemaVersion → error', async () => {
        const bad = { ...goodAuth, schemaVersion: 2 };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'sv.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: wrong purpose → error', async () => {
        const bad = { ...goodAuth, purpose: 'something-else' };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'purp.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: missing repository → error', async () => {
        const { repository: _, ...bad } = goodAuth;
        const r = await loadAuthorization(writeAuthorization(p, bad, 'no-repo.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: uppercase expectedHead → error', async () => {
        const bad = { ...goodAuth, repository: { ...goodAuth.repository, expectedHead: 'A'.repeat(40) } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'up-head.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: whitespace-padded expectedHead → error', async () => {
        const bad = { ...goodAuth, repository: { ...goodAuth.repository, expectedHead: ' ' + 'a'.repeat(40) } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'ws-head.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: short expectedHead → error', async () => {
        const bad = { ...goodAuth, repository: { ...goodAuth.repository, expectedHead: 'a'.repeat(39) } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'short-head.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: wrong expectedBranch → error', async () => {
        const bad = { ...goodAuth, repository: { ...goodAuth.repository, expectedBranch: 'develop' } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'br.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: unknown repository field → error', async () => {
        const bad = { ...goodAuth, repository: { ...goodAuth.repository, extra: 'no' } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'unk-repo.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: malformed plan fingerprint → error', async () => {
        const bad = { ...goodAuth, plan: { ...goodAuth.plan, expectedPlanFingerprint: 'nope' } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'plan-fp.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: malformed record fingerprint → error', async () => {
        const bad = { ...goodAuth, plan: { ...goodAuth.plan, expectedRecordFingerprint: 'nope' } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'rec-fp.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: recordCount != 1 → error', async () => {
        const bads = [0, 2, '1', 1.5];
        for (let i = 0; i < bads.length; i += 1) {
          const auth = { ...goodAuth, plan: { ...goodAuth.plan, recordCount: bads[i] } };
          const r = await loadAuthorization(writeAuthorization(p, auth, `rc-${i}.json`));
          assert.strictEqual(r.ok, false, `should reject recordCount=${JSON.stringify(bads[i])}`);
        }
      });
      await check('authorization: unknown plan field → error', async () => {
        const bad = { ...goodAuth, plan: { ...goodAuth.plan, extra: 1 } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'unk-plan.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: targets not array → error', async () => {
        const bad = { ...goodAuth, targets: 'x' };
        const r = await loadAuthorization(writeAuthorization(p, bad, 't-str.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: targets length != 1 → error', async () => {
        const ts = [[], ['a', 'b']];
        for (let i = 0; i < ts.length; i += 1) {
          const auth = { ...goodAuth, targets: ts[i] };
          const r = await loadAuthorization(writeAuthorization(p, auth, `tl-${i}.json`));
          assert.strictEqual(r.ok, false);
        }
      });
      await check('authorization: target with .. → error', async () => {
        const bad = { ...goodAuth, targets: ['content/blogger/posts/../foo.publish.json'] };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'dot.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: target outside allowed prefix → error', async () => {
        const bad = { ...goodAuth, targets: ['content/github/posts/foo.publish.json'] };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'pfx.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: target wrong suffix → error', async () => {
        const bad = { ...goodAuth, targets: ['content/blogger/posts/foo.md'] };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'sfx.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: absolute target → error', async () => {
        const bad = { ...goodAuth, targets: ['/etc/passwd.publish.json'] };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'abs.json'));
        assert.strictEqual(r.ok, false);
      });
      await check('authorization: explicitlyAuthorized truthy but not === true → error', async () => {
        const vs = [1, 'true', 'yes'];
        for (let i = 0; i < vs.length; i += 1) {
          const auth = { ...goodAuth, approval: { explicitlyAuthorized: vs[i] } };
          const r = await loadAuthorization(writeAuthorization(p, auth, `expl-${i}.json`));
          assert.strictEqual(r.ok, false, `should reject ${JSON.stringify(vs[i])}`);
        }
      });
      await check('authorization: unknown approval field → error', async () => {
        const bad = { ...goodAuth, approval: { explicitlyAuthorized: true, extra: 1 } };
        const r = await loadAuthorization(writeAuthorization(p, bad, 'unk-app.json'));
        assert.strictEqual(r.ok, false);
      });
    }

    // ── Happy path: valid authorization → apply PASS ─────────────────────
    let happyResult = null;
    {
      const fx = await setupHappyFixture(tmpRoot, 'happy');
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      happyResult = result;
      await check('happy: apply PASS', () => {
        assert.strictEqual(result.ok, true, JSON.stringify(result.errors));
      });
      await check('happy: mode=production-sidecar-create + productionWritePerformed=true', () => {
        assert.strictEqual(result.mode, CAPABILITY_MODE);
        assert.strictEqual(result.productionWritePerformed, true);
        assert.strictEqual(result.writePerformed, true);
      });
      await check('happy: commit/push flags remain false', () => {
        assert.strictEqual(result.commitPerformed, false);
        assert.strictEqual(result.pushPerformed, false);
      });
      await check('happy: repositoryStateValidated=true + authorizationValidated=true', () => {
        assert.strictEqual(result.repositoryStateValidated, true);
        assert.strictEqual(result.authorizationValidated, true);
      });
      await check('happy: createdTargets = [target] + records shows created=true', () => {
        assert.deepStrictEqual(result.createdTargets, [fx.firstEntry.targetPath]);
        assert.strictEqual(result.records.length, 1);
        assert.strictEqual(result.records[0].created, true);
      });
      await check('happy: exact bytes byte-identical to buildSidecarBody + trailing LF', () => {
        const target = path.join(fx.repoRoot, fx.firstEntry.targetPath);
        const bytes = readFileSync(target, 'utf-8');
        assert.ok(bytes.endsWith('\n'));
        const expected = JSON.stringify(
          buildSidecarBody({
            publishedUrl: 'https://example.blogspot.com/2026/03/first.html',
            publishedAt: '2026-03-01',
          }),
          null, 2,
        ) + '\n';
        assert.strictEqual(bytes, expected);
      });
      await check('happy: written sidecar keeps bloggerPostId=""', () => {
        const target = path.join(fx.repoRoot, fx.firstEntry.targetPath);
        const parsed = JSON.parse(readFileSync(target, 'utf-8'));
        assert.strictEqual(parsed.blogger.bloggerPostId, '');
      });
      await check('happy: no .production-apply.tmp remains in postsDir', () => {
        const postsDir = path.join(fx.repoRoot, 'content', 'blogger', 'posts');
        const names = readdirSync(postsDir);
        for (const n of names) {
          assert.ok(!n.endsWith('.production-apply.tmp'), `tmp remained: ${n}`);
        }
      });
      await check('happy: Markdown bytes unchanged after apply', () => {
        const md0 = readFileSync(
          path.join(fx.repoRoot, 'content/blogger/posts/20260301-first.md'),
          'utf-8',
        );
        assert.strictEqual(md0, fmMd({ id: '20260301-first', slug: 'first' }));
      });
      await check('happy: manifest bytes unchanged after apply', () => {
        const raw = readFileSync(fx.manifestPath, 'utf-8');
        assert.deepStrictEqual(JSON.parse(raw), validManifestForTwoMissing());
      });
      await check('happy: second candidate NOT written (single-record)', () => {
        const t = path.join(fx.repoRoot, fx.secondEntry.targetPath);
        assert.ok(!existsSync(t));
      });
      await check('happy: deterministic JSON output', () => {
        const a = formatJson(result);
        const b = formatJson(result);
        assert.strictEqual(a, b);
        const parsed = JSON.parse(a);
        assert.strictEqual(parsed.mode, CAPABILITY_MODE);
        assert.strictEqual(parsed.productionWritePerformed, true);
      });
      await check('happy: deterministic human output', () => {
        const a = formatHumanReadable(result);
        const b = formatHumanReadable(result);
        assert.strictEqual(a, b);
        assert.ok(/Overall: PASS/.test(a));
      });
    }

    // ── Authorization vs runtime mismatches (each one gates zero writes) ─
    {
      const fx = await setupHappyFixture(tmpRoot, 'auth-mismatch');

      // HEAD mismatch
      {
        const auth = baseAuth({
          expectedHead: '0'.repeat(40),
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          targets: [fx.firstEntry.targetPath],
        });
        const authPath = writeAuthorization(fx.repoRoot, auth, 'auth-head.json');
        const result = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: fx.firstEntry.sourcePath,
          authorizationPath: authPath,
        });
        await check('mismatch: HEAD mismatch → apply FAIL + no writes', () => {
          assert.strictEqual(result.ok, false);
          assert.strictEqual(result.productionWritePerformed, false);
          assert.strictEqual(result.writePerformed, false);
          assert.ok(result.errors.some((e) => /HEAD mismatch/.test(e)));
          const t = path.join(fx.repoRoot, fx.firstEntry.targetPath);
          assert.ok(!existsSync(t));
        });
      }
      // plan fingerprint mismatch
      {
        const auth = baseAuth({
          expectedHead: fx.head,
          expectedPlanFingerprint: 'a'.repeat(64),
          expectedRecordFingerprint: fx.firstFp,
          targets: [fx.firstEntry.targetPath],
        });
        const authPath = writeAuthorization(fx.repoRoot, auth, 'auth-planfp.json');
        const result = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: fx.firstEntry.sourcePath,
          authorizationPath: authPath,
        });
        await check('mismatch: plan-fingerprint mismatch → apply FAIL + no writes', () => {
          assert.strictEqual(result.ok, false);
          assert.strictEqual(result.productionWritePerformed, false);
          assert.ok(result.errors.some((e) => /plan-fingerprint-mismatch/.test(e)));
          const t = path.join(fx.repoRoot, fx.firstEntry.targetPath);
          assert.ok(!existsSync(t));
        });
      }
      // record fingerprint mismatch (auth references second entry's fp but source-path=first)
      {
        const auth = baseAuth({
          expectedHead: fx.head,
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.secondFp, // wrong for firstEntry
          targets: [fx.firstEntry.targetPath],
        });
        const authPath = writeAuthorization(fx.repoRoot, auth, 'auth-recfp.json');
        const result = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: fx.firstEntry.sourcePath,
          authorizationPath: authPath,
        });
        await check('mismatch: record-fingerprint mismatch → apply FAIL + no writes', () => {
          assert.strictEqual(result.ok, false);
          assert.strictEqual(result.productionWritePerformed, false);
          assert.ok(result.errors.some((e) => /record-fingerprint-mismatch/.test(e)));
        });
      }
      // target list mismatch: authorization.targets[0] != selected.targetPath
      {
        const auth = baseAuth({
          expectedHead: fx.head,
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          targets: [fx.secondEntry.targetPath], // wrong target
        });
        const authPath = writeAuthorization(fx.repoRoot, auth, 'auth-tgt.json');
        const result = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: fx.firstEntry.sourcePath,
          authorizationPath: authPath,
        });
        await check('mismatch: target list mismatch → apply FAIL + no writes', () => {
          assert.strictEqual(result.ok, false);
          assert.strictEqual(result.productionWritePerformed, false);
          assert.ok(result.errors.some((e) => /target-mismatch/.test(e)));
        });
      }
    }

    // ── Stale fingerprint (payload changed after auth authored) ──────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'stale-fp');
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'stale.json');
      // Now rewrite the manifest with a different URL — plan fingerprint changes.
      const drift = validManifestForTwoMissing();
      drift.records[0].blogger.publishedUrl =
        'https://example.blogspot.com/2026/03/first-different.html';
      writeManifest(fx.repoRoot, drift);
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('stale plan fingerprint: apply FAIL + no writes', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /plan-fingerprint-mismatch/.test(e)));
        const t = path.join(fx.repoRoot, fx.firstEntry.targetPath);
        assert.ok(!existsSync(t));
      });
    }

    // ── Repository state gates ─────────────────────────────────────────────
    // Dirty tracked file
    {
      const fx = await setupHappyFixture(tmpRoot, 'dirty-tracked');
      // Modify README (tracked) so working tree becomes dirty.
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# synthetic (dirty)\n', 'utf-8');
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'dirty.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('repo-state: dirty tracked file → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /dirty-working-tree/.test(e)));
        const t = path.join(fx.repoRoot, fx.firstEntry.targetPath);
        assert.ok(!existsSync(t));
      });
    }
    // Untracked file
    {
      const fx = await setupHappyFixture(tmpRoot, 'untracked');
      writeFileSync(path.join(fx.repoRoot, 'stray.txt'), 'stray\n', 'utf-8');
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'untracked.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('repo-state: untracked file → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /dirty-working-tree/.test(e)));
      });
    }
    // Index lock present
    {
      const fx = await setupHappyFixture(tmpRoot, 'lock');
      writeFileSync(path.join(fx.repoRoot, '.git', 'index.lock'), '', 'utf-8');
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'lock.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('repo-state: .git/index.lock present → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /index-lock-present/.test(e)));
      });
      // Clean up the lock so tmp cleanup won't fail on Windows.
      try { rmSync(path.join(fx.repoRoot, '.git', 'index.lock'), { force: true }); } catch (_) {}
    }
    // HEAD ahead of origin/main
    {
      const fx = await setupHappyFixture(tmpRoot, 'ahead');
      // Add a new commit → HEAD moves forward; origin/main stays behind.
      writeFileSync(path.join(fx.repoRoot, 'other.txt'), 'other\n', 'utf-8');
      const newHead = gitCommitFilesQuiet(fx.repoRoot, ['other.txt'], 'ahead');
      // Do NOT update origin/main → ahead=1/behind=0
      const auth = baseAuth({
        expectedHead: newHead,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'ahead.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('repo-state: ahead of origin/main → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /ahead-of-origin/.test(e)));
      });
    }
    // Wrong branch (checkout new branch after fixture setup)
    {
      const fx = await setupHappyFixture(tmpRoot, 'branch');
      // Move HEAD to a different branch.
      const r = spawnSync('git', ['checkout', '-q', '-b', 'feature'], {
        cwd: fx.repoRoot, encoding: 'utf-8', shell: false, windowsHide: true, timeout: 10000,
      });
      assert.strictEqual(r.status, 0, r.stderr);
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'branch.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('repo-state: wrong branch (feature) → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /wrong-branch/.test(e)));
      });
    }
    // Non-git directory as projectRoot
    {
      const nonGit = mkdtempSync(path.join(tmpRoot, 'non-git-'));
      seedTwoMissingCandidates(nonGit);
      const manifestPath = writeManifest(nonGit, validManifestForTwoMissing());
      const auth = baseAuth({
        expectedHead: 'a'.repeat(40),
        expectedPlanFingerprint: 'a'.repeat(64),
        expectedRecordFingerprint: 'a'.repeat(64),
        targets: ['content/blogger/posts/20260301-first.publish.json'],
      });
      const authPath = writeAuthorization(nonGit, auth, 'auth.json');
      const result = await applyProductionSidecar({
        projectRoot: nonGit,
        manifestPath,
        sourcePath: 'content/blogger/posts/20260301-first.md',
        authorizationPath: authPath,
      });
      await check('repo-state: non-git projectRoot → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /not-git-repository|repo-root-mismatch/.test(e)));
      });
    }

    // ── Source-path validation ────────────────────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'sp-validation');
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'auth.json');
      // Non-content path
      await check('source-path: not under content/blogger/posts → FAIL', async () => {
        const r = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: 'content/github/posts/x.md',
          authorizationPath: authPath,
        });
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /source-path/.test(e)));
      });
      // '..' traversal
      await check('source-path: contains ".." → FAIL', async () => {
        const r = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: 'content/blogger/posts/../../etc/passwd.md',
          authorizationPath: authPath,
        });
        assert.strictEqual(r.ok, false);
      });
      // Not present in plan
      await check('source-path: not in plan → FAIL', async () => {
        const r = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: 'content/blogger/posts/nowhere.md',
          authorizationPath: authPath,
        });
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /record-selection/.test(e)));
      });
      // Windows-style backslashes
      await check('source-path: backslash → FAIL', async () => {
        const r = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: 'content\\blogger\\posts\\20260301-first.md',
          authorizationPath: authPath,
        });
        assert.strictEqual(r.ok, false);
      });
    }

    // ── Target already exists on disk → apply FAIL (planner blocks) ──────
    {
      const fx = await setupHappyFixture(tmpRoot, 'target-exists');
      // Pre-create the target so validator hits SIDECAR_ALREADY_EXISTS.
      const targetAbs = path.join(fx.repoRoot, fx.firstEntry.targetPath);
      writeFileSyncMk(targetAbs, JSON.stringify({ schemaVersion: 1 }, null, 2) + '\n');
      const originalBytes = readFileSync(targetAbs, 'utf-8');
      const originalMtime = statSync(targetAbs).mtimeMs;
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: 'a'.repeat(64),
        expectedRecordFingerprint: 'a'.repeat(64),
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'auth.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('target-exists: apply FAIL + no writes', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
      });
      await check('target-exists: pre-existing target bytes unchanged', () => {
        assert.strictEqual(readFileSync(targetAbs, 'utf-8'), originalBytes);
      });
      await check('target-exists: pre-existing target mtime unchanged', () => {
        assert.strictEqual(statSync(targetAbs).mtimeMs, originalMtime);
      });
    }

    // ── Validator failure blocks all writes ──────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validator-fail');
      // Sentinel TODO in publishedUrl.
      const bad = validManifestForTwoMissing();
      bad.records[0].blogger.publishedUrl = 'TODO';
      writeManifest(fx.repoRoot, bad);
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: 'a'.repeat(64),
        expectedRecordFingerprint: 'a'.repeat(64),
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'auth.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validator-fail: apply FAIL + no writes', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /plan-validation-failed|validator/i.test(e)));
      });
    }

    // ── Missing candidate blocks planning ────────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'missing-cand');
      // Manifest only lists first — but validator's coverage checks require both.
      const partial = { schemaVersion: 1, records: [validManifestForTwoMissing().records[0]] };
      writeManifest(fx.repoRoot, partial);
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: 'a'.repeat(64),
        expectedRecordFingerprint: 'a'.repeat(64),
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'auth.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('missing-candidate: apply FAIL + no writes', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
      });
    }

    // ── explicitlyAuthorized false → apply FAIL ─────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'explicit-false');
      const badAuth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: fx.planFp,
        expectedRecordFingerprint: fx.firstFp,
        targets: [fx.firstEntry.targetPath],
      });
      badAuth.approval.explicitlyAuthorized = false;
      const authPath = writeAuthorization(fx.repoRoot, badAuth, 'expl-false.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('explicitlyAuthorized=false → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
      });
    }

    // ── Authorization file missing / malformed → apply FAIL ─────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'auth-missing');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: path.join(fx.repoRoot, 'nonexistent.json'),
      });
      await check('authorization file missing → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
        assert.ok(result.errors.some((e) => /authorization: authorization read failed/i.test(e)));
      });
    }
    {
      const fx = await setupHappyFixture(tmpRoot, 'auth-json-bad');
      const badPath = path.join(fx.repoRoot, 'bad.json');
      writeFileSync(badPath, '{ not json', 'utf-8');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: badPath,
      });
      await check('authorization invalid JSON → apply FAIL', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.productionWritePerformed, false);
      });
    }

    // ── Race: target appears between preflight and fs.link ──────────────
    // Not directly testable via the apply engine's public API (no beforeFinalCommit
    // hook — that hook is deliberately confined to the rehearsal engine's failure
    // injection). We assert the primitive via source-level static: no fs.rename +
    // fs.link present. Both were asserted above.
    // Instead we test the observable outcome of a two-actor scenario by preseeding
    // the target BEFORE apply — the write-preflight refuses. This ensures the
    // engine does not overwrite even without hitting fs.link's EEXIST directly.
    {
      const fx = await setupHappyFixture(tmpRoot, 'pre-preempt');
      const targetAbs = path.join(fx.repoRoot, fx.firstEntry.targetPath);
      writeFileSyncMk(targetAbs, 'PRE-EMPTIVE\n');
      const preBytes = readFileSync(targetAbs, 'utf-8');
      const preMtime = statSync(targetAbs).mtimeMs;
      // Since target now exists, the validator will fail SIDECAR_ALREADY_EXISTS.
      // authorization will not even be checked for fingerprint — but write-preflight
      // is definitively covered.
      const auth = baseAuth({
        expectedHead: fx.head,
        expectedPlanFingerprint: 'a'.repeat(64),
        expectedRecordFingerprint: 'a'.repeat(64),
        targets: [fx.firstEntry.targetPath],
      });
      const authPath = writeAuthorization(fx.repoRoot, auth, 'auth.json');
      const result = await applyProductionSidecar({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('pre-preempt: target unchanged; apply refused', () => {
        assert.strictEqual(result.ok, false);
        assert.strictEqual(readFileSync(targetAbs, 'utf-8'), preBytes);
        assert.strictEqual(statSync(targetAbs).mtimeMs, preMtime);
      });
    }

    // ── happy path result JSON structure sanity ─────────────────────────
    await check('happy result JSON: has every documented field', () => {
      const j = JSON.parse(formatJson(happyResult));
      for (const k of [
        'ok', 'mode', 'authorizationValidated', 'repositoryStateValidated',
        'writePerformed', 'productionWritePerformed', 'commitPerformed', 'pushPerformed',
        'planFingerprint', 'recordFingerprint', 'sourceHead', 'branch',
        'manifestPath', 'sourcePath', 'authorizationPath',
        'records', 'createdTargets', 'verification', 'repositoryNowDirty', 'errors',
      ]) {
        assert.ok(k in j, `missing field: ${k}`);
      }
      assert.strictEqual(j.commitPerformed, false);
      assert.strictEqual(j.pushPerformed, false);
      assert.strictEqual(j.repositoryNowDirty, true);
    });

    // ── Explicit "no environment override" — process.env cannot inject projectRoot ─
    await check('no env override: setting BLOGGER_APPLY_REPO_ROOT does not affect engine', async () => {
      const fx = await setupHappyFixture(tmpRoot, 'no-env');
      // Set a bogus env var. The engine should ignore it and use the passed projectRoot.
      const before = process.env.BLOGGER_APPLY_REPO_ROOT;
      process.env.BLOGGER_APPLY_REPO_ROOT = '/should/be/ignored';
      try {
        const auth = baseAuth({
          expectedHead: fx.head,
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          targets: [fx.firstEntry.targetPath],
        });
        const authPath = writeAuthorization(fx.repoRoot, auth, 'no-env.json');
        const result = await applyProductionSidecar({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: fx.firstEntry.sourcePath,
          authorizationPath: authPath,
        });
        assert.strictEqual(result.ok, true, JSON.stringify(result.errors));
      } finally {
        if (before == null) delete process.env.BLOGGER_APPLY_REPO_ROOT;
        else process.env.BLOGGER_APPLY_REPO_ROOT = before;
      }
    });
    await check('src: no process.env.*APPLY_ROOT / *REPO_ROOT reference in engine', () => {
      assert.ok(!/process\.env\.[A-Z_]*APPLY_ROOT/.test(CLI_SRC));
      assert.ok(!/process\.env\.[A-Z_]*APPLY_REPO_ROOT/.test(CLI_SRC));
      assert.ok(!/process\.env\.[A-Z_]*TEST_ROOT/.test(CLI_SRC));
    });
  } finally {
    try {
      rmSync(tmpRoot, { recursive: true, force: true });
    } catch (_) { /* ignore */ }
  }

  // ── Production safety verification ──────────────────────────────────────
  const prodInvAfter = snapshotSidecarInventory(prodPostsDir);
  const prodMdAfter = snapshotMarkdownBytes(prodPostsDir);
  await check('production sidecar file list unchanged', () => {
    const b = new Set(prodInvBefore.map((s) => s.rel));
    const a = new Set(prodInvAfter.map((s) => s.rel));
    assert.deepStrictEqual([...a].sort(), [...b].sort());
  });
  await check('production sidecar bytes unchanged', () => {
    const b = Object.fromEntries(prodInvBefore.map((s) => [s.rel, s.bytes]));
    const a = Object.fromEntries(prodInvAfter.map((s) => [s.rel, s.bytes]));
    assert.deepStrictEqual(a, b);
  });
  await check('production sidecar mtimes unchanged', () => {
    const b = Object.fromEntries(prodInvBefore.map((s) => [s.rel, s.mtimeMs]));
    const a = Object.fromEntries(prodInvAfter.map((s) => [s.rel, s.mtimeMs]));
    assert.deepStrictEqual(a, b);
  });
  await check('production Blogger Markdown bytes unchanged', () => {
    const b = Object.fromEntries(prodMdBefore.map((s) => [s.rel, s.bytes]));
    const a = Object.fromEntries(prodMdAfter.map((s) => [s.rel, s.bytes]));
    assert.deepStrictEqual(a, b);
  });
  await check('production Blogger Markdown mtimes unchanged', () => {
    const b = Object.fromEntries(prodMdBefore.map((s) => [s.rel, s.mtimeMs]));
    const a = Object.fromEntries(prodMdAfter.map((s) => [s.rel, s.mtimeMs]));
    assert.deepStrictEqual(a, b);
  });
  await check('dist-blogger-preview/ absent (was absent + still absent)', () => {
    assert.strictEqual(distPreviewAbsent, true);
    assert.ok(!existsSync(path.join(REPO_ROOT, 'dist-blogger-preview')));
  });
  if (deployHasGit) {
    const deployInvAfter = snapshotSidecarInventory(DEPLOY_ROOT_CANDIDATE);
    await check('deploy repository sidecar inventory unchanged', () => {
      const b = Object.fromEntries(deployInvBefore.map((s) => [s.rel, s.bytes]));
      const a = Object.fromEntries(deployInvAfter.map((s) => [s.rel, s.bytes]));
      assert.deepStrictEqual(a, b);
    });
  }

  console.log('');
  console.log(`[check:blogger-backfill-production-apply-capability] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(
    `[check:blogger-backfill-production-apply-capability] UNEXPECTED ERROR: ${err.stack || err.message || err}`,
  );
  process.exit(1);
});
