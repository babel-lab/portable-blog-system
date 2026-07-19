#!/usr/bin/env node
// Phase 20260719：Blogger backfill apply authorization preparation + preflight — focused guard.
//
// Scope / boundary:
//   - Every write happens inside a mkdtempSync directory rooted at os.tmpdir() that is a
//     synthetic git repository (`git init`, one commit, `refs/remotes/origin/main` at HEAD).
//     Every fixture is cleaned up in finally{}. Production content and the deploy clone are
//     read-only.
//   - The public CLIs are exercised only for input validation and CLI-contract smoke.
//     End-to-end behavior goes through the programmatic APIs `prepareAuthorizationDraft` /
//     `preflightAuthorization` with `projectRoot` pointing at synthetic OS-temp git repos.
//   - Neither the generator nor the preflight validator ever writes any file. This guard
//     asserts source-level static bans + observed no-write.
//   - No network, no Blogger / Google / GA4 / AdSense API, no child_process in the tools
//     themselves. The guard uses `spawnSync` to seed synthetic git repos.
//
// Run:
//   npm run check:blogger-backfill-apply-authorization-preparation
//   or  node src/scripts/check-blogger-backfill-apply-authorization-preparation.js

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
  parseArgs as prepareParseArgs,
  prepareAuthorizationDraft,
  serializeDraft,
} from './prepare-blogger-backfill-apply-authorization.js';

import {
  parseArgs as validateParseArgs,
  preflightAuthorization,
  formatJson as validateFormatJson,
  formatHumanReadable as validateFormatHuman,
} from './validate-blogger-backfill-apply-authorization.js';

import {
  fingerprintEntry,
  AUTHORIZATION_SCHEMA_VERSION,
  AUTHORIZATION_PURPOSE,
  AUTHORIZATION_BRANCH,
} from './apply-blogger-backfill-truth.js';
import { planTruthApply } from './plan-blogger-backfill-truth-apply.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PREPARE_CLI = path.join(
  REPO_ROOT, 'src', 'scripts', 'prepare-blogger-backfill-apply-authorization.js',
);
const VALIDATE_CLI = path.join(
  REPO_ROOT, 'src', 'scripts', 'validate-blogger-backfill-apply-authorization.js',
);
const DEPLOY_ROOT_CANDIDATE = path.resolve(REPO_ROOT, '..', 'portable-blog-deploy');

function stripComments(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
  return noBlock
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}
const PREPARE_SRC = stripComments(readFileSync(PREPARE_CLI, 'utf-8'));
const VALIDATE_SRC = stripComments(readFileSync(VALIDATE_CLI, 'utf-8'));

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
    'body — prepare/validate must not read Markdown body.',
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

function fixturePath(repoRoot, filename) {
  const dir = path.join(repoRoot, 'fixtures');
  mkdirSync(dir, { recursive: true });
  const safe = filename.replace(/["?*<>:|/\\]/g, '_');
  return path.join(dir, safe);
}

function writeManifest(repoRoot, obj, filename = 'manifest.json') {
  const p = fixturePath(repoRoot, filename);
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
  return p;
}

function writeAuthorization(repoRoot, obj, filename = 'auth.json') {
  const p = fixturePath(repoRoot, filename);
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
  return p;
}

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
  runG(['symbolic-ref', 'HEAD', 'refs/heads/main']);
  runG(['config', 'user.email', 'test@example.invalid']);
  runG(['config', 'user.name', 'test']);
  runG(['config', 'commit.gpgsign', 'false']);
  writeFileSyncMk(path.join(repoRoot, 'README.md'), '# synthetic test repo\n');
  writeFileSyncMk(path.join(repoRoot, '.gitignore'), '/fixtures/\n');
  runG(['add', 'README.md', '.gitignore']);
  runG(['commit', '--quiet', '-m', 'init']);
  runG(['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  const head = runG(['rev-parse', 'HEAD']);
  if (!/^[0-9a-f]{40}$/.test(head)) {
    throw new Error(`unexpected HEAD SHA: ${head}`);
  }
  return head;
}

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

function snapshotSidecarInventory(rootAbs) {
  const inv = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir).sort()) {
      const abs = path.join(dir, name);
      let st;
      try { st = statSync(abs); } catch (_) { continue; }
      if (st.isDirectory()) { walk(abs); continue; }
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
      try { st = statSync(abs); } catch (_) { continue; }
      if (st.isDirectory()) { walk(abs); continue; }
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

function runPrepareCli(args) {
  const r = spawnSync(process.execPath, [PREPARE_CLI, ...args], {
    cwd: REPO_ROOT, encoding: 'utf-8', shell: false, windowsHide: true,
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}
function runValidateCli(args) {
  const r = spawnSync(process.execPath, [VALIDATE_CLI, ...args], {
    cwd: REPO_ROOT, encoding: 'utf-8', shell: false, windowsHide: true,
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

async function setupHappyFixture(baseTmp, label) {
  const repoRoot = mkdtempSync(path.join(baseTmp, `${label}-`));
  seedSyntheticGitRepo(repoRoot);
  seedTwoMissingCandidates(repoRoot);
  const finalHead = gitCommitFilesQuiet(
    repoRoot,
    ['content/blogger/posts/20260301-first.md', 'content/blogger/posts/20260302-second.md'],
    'seed blogger candidates',
  );
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
  return { repoRoot, head: finalHead, manifestPath, planned, planFp, firstEntry, secondEntry, firstFp, secondFp };
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
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

  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'prep-authz-'));
  try {
    // ── source-level static bans (both tools) ──────────────────────────
    for (const [label, src] of [['prepare', PREPARE_SRC], ['validate', VALIDATE_SRC]]) {
      await check(`src[${label}]: no fs.writeFile / mkdir / rm / rename / unlink / copyFile / appendFile`, () => {
        assert.ok(!/\bfs\.writeFile\s*\(/.test(src));
        assert.ok(!/\bfs\.mkdir\s*\(/.test(src));
        assert.ok(!/\bfs\.rm(\b|\s*\()/.test(src));
        assert.ok(!/\bfs\.rename\s*\(/.test(src));
        assert.ok(!/\bfs\.unlink\s*\(/.test(src));
        assert.ok(!/\bfs\.copyFile\s*\(/.test(src));
        assert.ok(!/\bfs\.appendFile\s*\(/.test(src));
        assert.ok(!/\bfs\.link\s*\(/.test(src));
      });
      await check(`src[${label}]: no child_process import`, () => {
        assert.ok(!/from ['"]node:child_process['"]/.test(src));
        assert.ok(!/require\(['"]child_process['"]\)/.test(src));
        assert.ok(!/from ['"]child_process['"]/.test(src));
      });
      await check(`src[${label}]: no spawn / exec`, () => {
        assert.ok(!/spawnSync|execSync|execFileSync|\bspawn\s*\(|\bexec\s*\(/.test(src));
      });
      await check(`src[${label}]: no fetch(`, () => {
        assert.ok(!/\bfetch\s*\(/.test(src));
      });
      await check(`src[${label}]: no node:http / node:https`, () => {
        assert.ok(!/from ['"]node:https?['"]/.test(src));
        assert.ok(!/require\(['"]node:https?['"]\)/.test(src));
      });
      await check(`src[${label}]: no googleapis / oauth / blogger API`, () => {
        assert.ok(!/googleapis|oauth/i.test(src));
        assert.ok(!/blogger\.googleapis\.com/.test(src));
      });
      await check(`src[${label}]: no git command strings`, () => {
        assert.ok(!/["']git commit["']/.test(src));
        assert.ok(!/["']git push["']/.test(src));
        assert.ok(!/["']git add["']/.test(src));
        assert.ok(!/["']git fetch["']/.test(src));
        assert.ok(!/["']git pull["']/.test(src));
        assert.ok(!/["']git reset["']/.test(src));
        assert.ok(!/["']git clean["']/.test(src));
        assert.ok(!/["']git stash["']/.test(src));
        assert.ok(!/["']git checkout["']/.test(src));
      });
      await check(`src[${label}]: no build / dist reference`, () => {
        assert.ok(!/\bnpm\s+run\s+build/.test(src));
        assert.ok(!/\bdist-blogger-preview\b/.test(src));
      });
      await check(`src[${label}]: no env override for repo root`, () => {
        assert.ok(!/process\.env\.[A-Z_]*APPLY_ROOT/.test(src));
        assert.ok(!/process\.env\.[A-Z_]*APPLY_REPO_ROOT/.test(src));
        assert.ok(!/process\.env\.[A-Z_]*TEST_ROOT/.test(src));
      });
      await check(`src[${label}]: reuses apply schema (imports from apply-blogger-backfill-truth.js)`, () => {
        assert.ok(/from ['"]\.\/apply-blogger-backfill-truth\.js['"]/.test(src));
      });
      await check(`src[${label}]: reuses planner`, () => {
        assert.ok(/from ['"]\.\/plan-blogger-backfill-truth-apply\.js['"]/.test(src));
      });
      await check(`src[${label}]: reuses preflight`, () => {
        assert.ok(/from ['"]\.\/admin-git-safety-preflight\.js['"]/.test(src));
      });
    }

    // The generator MUST NOT contain any code path that sets explicitlyAuthorized true.
    await check('src[prepare]: explicitlyAuthorized: false hard-coded (no "true" occurrence in draft builder)', () => {
      // Locate the buildDraft body (up to closing brace). Strict regex on the literal.
      assert.ok(/explicitlyAuthorized:\s*false/.test(PREPARE_SRC));
      // There must be exactly ONE explicitlyAuthorized: … in the source (the false one).
      // (There may be extra text in comments; comments were stripped.)
      const matches = PREPARE_SRC.match(/explicitlyAuthorized:\s*(true|false)/g) || [];
      assert.deepStrictEqual(matches, ['explicitlyAuthorized: false']);
    });

    // ── parseArgs smoke ────────────────────────────────────────────────
    await check('prepare.parseArgs: --help', () => {
      const o = prepareParseArgs(['node', 'cli', '--help']);
      assert.strictEqual(o.help, true);
    });
    await check('prepare.parseArgs: --manifest + --source-path', () => {
      const o = prepareParseArgs([
        'node', 'cli',
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
      ]);
      assert.strictEqual(o.manifest, '/tmp/m.json');
      assert.strictEqual(o.sourcePath, 'content/blogger/posts/x.md');
    });
    await check('prepare.parseArgs: --manifest= --source-path=', () => {
      const o = prepareParseArgs([
        'node', 'cli',
        '--manifest=/tmp/m.json',
        '--source-path=content/blogger/posts/x.md',
      ]);
      assert.strictEqual(o.manifest, '/tmp/m.json');
      assert.strictEqual(o.sourcePath, 'content/blogger/posts/x.md');
    });
    for (const flag of [
      '--approve', '--authorized', '--explicitly-authorized', '--yes', '-y', '--apply',
      '--output', '--out', '--write', '--save',
      '--force', '--overwrite', '--replace', '--merge',
      '--skip-validation', '--skip-fingerprint', '--ignore-head', '--dirty-ok', '--no-verify',
      '--production', '--publish', '--deploy', '--commit', '--push', '--dry-run',
      '--repo-root', '--project-root', '--test-root',
    ]) {
      await check(`prepare.parseArgs: forbidden ${flag}`, () => {
        const o = prepareParseArgs(['node', 'cli', flag]);
        assert.ok(o.forbidden.includes(flag), `not captured: ${flag}`);
      });
    }
    await check('prepare.parseArgs: unknown flag captured', () => {
      const o = prepareParseArgs(['node', 'cli', '--totally-fake']);
      assert.ok(o.unknown.includes('--totally-fake'));
    });

    await check('validate.parseArgs: --help', () => {
      const o = validateParseArgs(['node', 'cli', '--help']);
      assert.strictEqual(o.help, true);
    });
    await check('validate.parseArgs: all three flags', () => {
      const o = validateParseArgs([
        'node', 'cli',
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
        '--authorization', '/tmp/a.json',
        '--json',
      ]);
      assert.strictEqual(o.manifest, '/tmp/m.json');
      assert.strictEqual(o.sourcePath, 'content/blogger/posts/x.md');
      assert.strictEqual(o.authorization, '/tmp/a.json');
      assert.strictEqual(o.json, true);
    });
    for (const flag of [
      '--apply', '--force', '--overwrite', '--replace', '--merge', '--yes', '-y', '--all',
      '--auto-approve', '--skip-validation', '--skip-fingerprint', '--ignore-head', '--dirty-ok',
      '--no-verify', '--production', '--publish', '--deploy', '--commit', '--push', '--dry-run',
      '--repo-root', '--project-root', '--test-root',
      '--output', '--out', '--write', '--save',
    ]) {
      await check(`validate.parseArgs: forbidden ${flag}`, () => {
        const o = validateParseArgs(['node', 'cli', flag]);
        assert.ok(o.forbidden.includes(flag), `not captured: ${flag}`);
      });
    }

    // ── CLI: --help ────────────────────────────────────────────────────
    await check('prepare CLI --help: exit 0 + mentions no approval / no output / no write', () => {
      const r = runPrepareCli(['--help']);
      assert.strictEqual(r.status, 0, r.stderr);
      assert.ok(/UNAPPROVED/.test(r.stdout));
      assert.ok(/explicitlyAuthorized/.test(r.stdout));
      assert.ok(/never produces an approved/i.test(r.stdout) || /NEVER produces an approved/.test(r.stdout) || /No in-band/i.test(r.stdout) || /NO in-band/.test(r.stdout));
      assert.ok(/read-only/i.test(r.stdout));
    });
    await check('validate CLI --help: exit 0 + mentions never applies + applyReady', () => {
      const r = runValidateCli(['--help']);
      assert.strictEqual(r.status, 0, r.stderr);
      assert.ok(/applyReady/.test(r.stdout));
      assert.ok(/NEVER performs apply/i.test(r.stdout) || /never applies/i.test(r.stdout));
      assert.ok(/read-only/i.test(r.stdout));
    });

    // ── CLI: forbidden / unknown / missing ─────────────────────────────
    for (const flag of ['--approve', '--yes', '--apply', '--output', '--write', '--force', '--repo-root']) {
      await check(`prepare CLI forbidden ${flag} → exit 1`, () => {
        const r = runPrepareCli([
          flag,
          '--manifest', '/tmp/m.json',
          '--source-path', 'content/blogger/posts/x.md',
        ]);
        assert.strictEqual(r.status, 1, `unexpected exit ${r.status}: ${r.stderr}`);
        assert.ok(/forbidden flag/i.test(r.stderr));
      });
    }
    await check('prepare CLI unknown flag → exit 1', () => {
      const r = runPrepareCli([
        '--totally-fake',
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/unknown argument/i.test(r.stderr));
    });
    await check('prepare CLI missing --manifest → exit 1', () => {
      const r = runPrepareCli([
        '--source-path', 'content/blogger/posts/x.md',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--manifest.*is required/i.test(r.stderr));
    });
    await check('prepare CLI missing --source-path → exit 1', () => {
      const r = runPrepareCli([
        '--manifest', '/tmp/m.json',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--source-path.*is required/i.test(r.stderr));
    });

    for (const flag of ['--apply', '--force', '--yes', '--commit', '--push', '--write']) {
      await check(`validate CLI forbidden ${flag} → exit 1`, () => {
        const r = runValidateCli([
          flag,
          '--manifest', '/tmp/m.json',
          '--source-path', 'content/blogger/posts/x.md',
          '--authorization', '/tmp/a.json',
        ]);
        assert.strictEqual(r.status, 1);
        assert.ok(/forbidden flag/i.test(r.stderr));
      });
    }
    await check('validate CLI unknown flag → exit 1', () => {
      const r = runValidateCli([
        '--totally-fake',
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
        '--authorization', '/tmp/a.json',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/unknown argument/i.test(r.stderr));
    });
    await check('validate CLI missing --manifest → exit 1', () => {
      const r = runValidateCli([
        '--source-path', 'content/blogger/posts/x.md',
        '--authorization', '/tmp/a.json',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--manifest.*is required/i.test(r.stderr));
    });
    await check('validate CLI missing --source-path → exit 1', () => {
      const r = runValidateCli([
        '--manifest', '/tmp/m.json',
        '--authorization', '/tmp/a.json',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--source-path.*is required/i.test(r.stderr));
    });
    await check('validate CLI missing --authorization → exit 1', () => {
      const r = runValidateCli([
        '--manifest', '/tmp/m.json',
        '--source-path', 'content/blogger/posts/x.md',
      ]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--authorization.*is required/i.test(r.stderr));
    });

    // ── Prepare: happy path ────────────────────────────────────────────
    let happyDraft = null;
    let happyFx = null;
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-happy');
      happyFx = fx;
      const inv1 = snapshotSidecarInventory(fx.repoRoot);
      const md1 = snapshotMarkdownBytes(fx.repoRoot);
      const result = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
      });
      const inv2 = snapshotSidecarInventory(fx.repoRoot);
      const md2 = snapshotMarkdownBytes(fx.repoRoot);
      happyDraft = result.draft;
      await check('prepare: happy PASS', () => {
        assert.strictEqual(result.ok, true, JSON.stringify(result.errors));
      });
      await check('prepare: draft uses formal schema (fields match apply loadAuthorization requirements)', () => {
        assert.strictEqual(result.draft.schemaVersion, AUTHORIZATION_SCHEMA_VERSION);
        assert.strictEqual(result.draft.purpose, AUTHORIZATION_PURPOSE);
        assert.strictEqual(result.draft.repository.expectedBranch, AUTHORIZATION_BRANCH);
        assert.ok(/^[0-9a-f]{40}$/.test(result.draft.repository.expectedHead));
        assert.ok(/^[0-9a-f]{64}$/.test(result.draft.plan.expectedPlanFingerprint));
        assert.ok(/^[0-9a-f]{64}$/.test(result.draft.plan.expectedRecordFingerprint));
        assert.strictEqual(result.draft.plan.recordCount, 1);
        assert.deepStrictEqual(result.draft.targets, [fx.firstEntry.targetPath]);
      });
      await check('prepare: explicitlyAuthorized fixed false', () => {
        assert.strictEqual(result.draft.approval.explicitlyAuthorized, false);
      });
      await check('prepare: expectedHead exact', () => {
        assert.strictEqual(result.draft.repository.expectedHead, fx.head);
      });
      await check('prepare: plan fingerprint exact', () => {
        assert.strictEqual(result.draft.plan.expectedPlanFingerprint, fx.planFp);
      });
      await check('prepare: record fingerprint exact', () => {
        assert.strictEqual(result.draft.plan.expectedRecordFingerprint, fx.firstFp);
      });
      await check('prepare: no file created in fixture repo', () => {
        assert.deepStrictEqual(
          Object.fromEntries(inv2.map((s) => [s.rel, s.bytes])),
          Object.fromEntries(inv1.map((s) => [s.rel, s.bytes])),
        );
        assert.deepStrictEqual(
          Object.fromEntries(md2.map((s) => [s.rel, s.bytes])),
          Object.fromEntries(md1.map((s) => [s.rel, s.bytes])),
        );
      });
      await check('prepare: serialized draft ends with final newline', () => {
        const s = serializeDraft(result.draft);
        assert.ok(s.endsWith('\n'));
      });
      await check('prepare: deterministic repeated output', async () => {
        const s1 = serializeDraft(result.draft);
        const result2 = await prepareAuthorizationDraft({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: fx.firstEntry.sourcePath,
        });
        const s2 = serializeDraft(result2.draft);
        assert.strictEqual(s1, s2);
      });
      await check('prepare: no timestamp / hostname / username / absolute path in draft', () => {
        const s = serializeDraft(result.draft);
        assert.ok(!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s), 'timestamp leaked');
        assert.ok(!/generatedAt|timestamp/i.test(s), 'timestamp key leaked');
        assert.ok(!/(^|[^a-zA-Z0-9_])hostname|homedir|username/i.test(s), 'hostname/homedir/username leaked');
        // No absolute repo path (e.g., /tmp/… or C:\…).
        // The draft carries only the repo-relative target path.
        assert.ok(!/[A-Za-z]:\\/.test(s), 'windows absolute path leaked');
        // Allow "content/blogger/posts/…"; absolute-POSIX would start with '/' inside a string.
        // Check with a specific regex: strings starting with "/" but not "/blogger" (blogspot URL is fine).
        // Simplest: check that the draft does not contain the OS-temp fixture root string.
        assert.ok(!s.includes(fx.repoRoot), 'fixture root leaked');
      });
      await check('prepare: no payload duplication (payload keys not in draft)', () => {
        const s = serializeDraft(result.draft);
        assert.ok(!/"payload"\s*:/.test(s));
        assert.ok(!/"publishedUrl"\s*:/.test(s));
        assert.ok(!/"publishedAt"\s*:/.test(s));
        assert.ok(!/"bloggerPostId"\s*:/.test(s));
      });
    }

    // ── Prepare: unknown source ────────────────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-unknown-src');
      const result = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: 'content/blogger/posts/nowhere.md',
      });
      await check('prepare: unknown source → FAIL + no draft', () => {
        assert.strictEqual(result.ok, false);
        assert.ok(!result.draft);
        assert.ok(result.errors.some((e) => /record-selection/.test(e)));
      });
    }

    // ── Prepare: non-candidate source ──────────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-non-cand');
      await check('prepare: outside content/blogger/posts → FAIL', async () => {
        const r = await prepareAuthorizationDraft({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: 'content/github/posts/x.md',
        });
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /source-path/.test(e)));
      });
      await check('prepare: source-path with .. → FAIL', async () => {
        const r = await prepareAuthorizationDraft({
          projectRoot: fx.repoRoot,
          manifestPath: fx.manifestPath,
          sourcePath: 'content/blogger/posts/../../etc/passwd.md',
        });
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /source-path/.test(e) || /".."/.test(e)));
      });
    }

    // ── Prepare: target already exists ─────────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-target-exists');
      writeFileSyncMk(path.join(fx.repoRoot, fx.firstEntry.targetPath),
        JSON.stringify({ schemaVersion: 1 }, null, 2) + '\n');
      const result = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
      });
      await check('prepare: target already exists → FAIL', () => {
        assert.strictEqual(result.ok, false);
      });
    }

    // ── Prepare: dirty repository / wrong branch / HEAD-differs-from-origin / index lock ─
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-dirty');
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# dirty\n', 'utf-8');
      const r = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
      });
      await check('prepare: dirty tree → FAIL', () => {
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /dirty-working-tree/.test(e)));
      });
    }
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-branch');
      const g = spawnSync('git', ['checkout', '-q', '-b', 'feature'], {
        cwd: fx.repoRoot, encoding: 'utf-8', shell: false, windowsHide: true, timeout: 10000,
      });
      assert.strictEqual(g.status, 0);
      const r = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
      });
      await check('prepare: wrong branch → FAIL', () => {
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /wrong-branch/.test(e)));
      });
    }
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-ahead');
      writeFileSync(path.join(fx.repoRoot, 'other.txt'), 'x\n', 'utf-8');
      gitCommitFilesQuiet(fx.repoRoot, ['other.txt'], 'ahead');
      const r = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
      });
      await check('prepare: HEAD ahead of origin/main → FAIL', () => {
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /ahead-of-origin/.test(e)));
      });
    }
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-lock');
      writeFileSync(path.join(fx.repoRoot, '.git', 'index.lock'), '', 'utf-8');
      const r = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
      });
      await check('prepare: index-lock → FAIL', () => {
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /index-lock-present/.test(e)));
      });
      try { rmSync(path.join(fx.repoRoot, '.git', 'index.lock'), { force: true }); } catch (_) {}
    }

    // ── Prepare: validator failure (sentinel TODO) ─────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'prep-sentinel');
      const bad = validManifestForTwoMissing();
      bad.records[0].blogger.publishedUrl = 'TODO';
      writeManifest(fx.repoRoot, bad);
      const r = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
      });
      await check('prepare: validator failure → FAIL', () => {
        assert.strictEqual(r.ok, false);
        assert.ok(r.errors.some((e) => /plan-validation-failed|validator/i.test(e)));
      });
    }

    // ── Validate: happy PASS (approved synthetic authorization matches runtime) ──
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-happy');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const invBefore = snapshotSidecarInventory(fx.repoRoot);
      const mdBefore = snapshotMarkdownBytes(fx.repoRoot);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      const invAfter = snapshotSidecarInventory(fx.repoRoot);
      const mdAfter = snapshotMarkdownBytes(fx.repoRoot);
      await check('validate: approved synthetic → applyReady + writePerformed:false', () => {
        assert.strictEqual(result.authorizationDocumentValid, true, JSON.stringify(result.blockers));
        assert.strictEqual(result.authorizationBindingsMatched, true, JSON.stringify(result.blockers));
        assert.strictEqual(result.explicitlyAuthorized, true);
        assert.strictEqual(result.applyReady, true);
        assert.strictEqual(result.writePerformed, false);
      });
      await check('validate: no repo mutation from approved-synthetic run', () => {
        assert.deepStrictEqual(
          Object.fromEntries(invAfter.map((s) => [s.rel, s.bytes])),
          Object.fromEntries(invBefore.map((s) => [s.rel, s.bytes])),
        );
        assert.deepStrictEqual(
          Object.fromEntries(mdAfter.map((s) => [s.rel, s.bytes])),
          Object.fromEntries(mdBefore.map((s) => [s.rel, s.bytes])),
        );
      });
      await check('validate: deterministic JSON', () => {
        const a = validateFormatJson(result);
        const b = validateFormatJson(result);
        assert.strictEqual(a, b);
      });
      await check('validate: JSON envelope has stable field set', () => {
        const j = JSON.parse(validateFormatJson(result));
        for (const k of [
          'ok', 'mode', 'manifestPath', 'sourcePath', 'authorizationPath',
          'branch', 'sourceHead', 'planFingerprint', 'recordFingerprint',
          'authorizationDocumentValid', 'authorizationBindingsMatched',
          'explicitlyAuthorized', 'applyReady', 'writePerformed', 'blockers',
        ]) {
          assert.ok(k in j, `missing field: ${k}`);
        }
      });
    }

    // ── Validate: unapproved draft (explicitlyAuthorized: false) ───────
    // Preflight uses loadAuthorization with { requireApproved: false } so an
    // unapproved-but-shape-valid draft classifies as authorizationDocumentValid=true,
    // explicitlyAuthorized=false, applyReady=false. This is the exact semantic the
    // Session prompt §6 requires.
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-unapproved');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: false },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: unapproved draft → documentValid=true + bindingsMatched=true + applyReady=false', () => {
        assert.strictEqual(result.authorizationDocumentValid, true, JSON.stringify(result.blockers));
        assert.strictEqual(result.authorizationBindingsMatched, true, JSON.stringify(result.blockers));
        assert.strictEqual(result.explicitlyAuthorized, false);
        assert.strictEqual(result.applyReady, false);
        assert.strictEqual(result.writePerformed, false);
        assert.ok(result.blockers.some((b) => /explicit-authorization-not-granted/.test(b)));
      });
    }

    // Truthy non-boolean explicit-auth still fails at the shape layer (loader
    // enforces `typeof === 'boolean'` regardless of requireApproved).
    for (const bad of [1, 'true', 'yes']) {
      const fx = await setupHappyFixture(tmpRoot, `validate-nonbool-${String(bad).replace(/[^a-z0-9]/gi, '')}`);
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: bad },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check(`validate: explicitlyAuthorized=${JSON.stringify(bad)} (truthy non-boolean) → documentValid=false`, () => {
        assert.strictEqual(result.authorizationDocumentValid, false);
        assert.strictEqual(result.applyReady, false);
      });
    }

    // ── Validate: wrong HEAD (fingerprint valid but binding differs) ───
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-wrong-head');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: '0'.repeat(40), expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: wrong HEAD → applyReady=false + binding blocker', () => {
        assert.strictEqual(result.applyReady, false);
        assert.ok(result.blockers.some((b) => /head-mismatch/.test(b)));
      });
    }

    // ── Validate: wrong plan fingerprint ──────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-wrong-planfp');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: 'a'.repeat(64),
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: wrong plan fingerprint → applyReady=false', () => {
        assert.strictEqual(result.applyReady, false);
        assert.ok(result.blockers.some((b) => /plan-fingerprint-mismatch/.test(b)));
      });
    }

    // ── Validate: wrong record fingerprint ─────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-wrong-recfp');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.secondFp, // wrong for firstEntry
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: wrong record fingerprint → applyReady=false', () => {
        assert.strictEqual(result.applyReady, false);
        assert.ok(result.blockers.some((b) => /record-fingerprint-mismatch/.test(b)));
      });
    }

    // ── Validate: wrong target ─────────────────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-wrong-target');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.secondEntry.targetPath], // wrong target
        approval: { explicitlyAuthorized: true },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: wrong target → applyReady=false', () => {
        assert.strictEqual(result.applyReady, false);
        assert.ok(result.blockers.some((b) => /target-mismatch/.test(b)));
      });
    }

    // ── Validate: malformed authorization JSON ─────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-bad-json');
      const badPath = path.join(fx.repoRoot, 'fixtures', 'bad.json');
      writeFileSyncMk(badPath, '{ not json');
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: badPath,
      });
      await check('validate: malformed JSON → authorizationDocumentValid=false + applyReady=false', () => {
        assert.strictEqual(result.authorizationDocumentValid, false);
        assert.strictEqual(result.applyReady, false);
        assert.ok(result.blockers.some((b) => /authorization-document-invalid/.test(b)));
      });
    }

    // ── Validate: missing authorization file ───────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-missing-auth');
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: path.join(fx.repoRoot, 'fixtures', 'no-such.json'),
      });
      await check('validate: missing file → authorizationDocumentValid=false', () => {
        assert.strictEqual(result.authorizationDocumentValid, false);
        assert.strictEqual(result.applyReady, false);
      });
    }

    // ── Validate: wrong schema / wrong purpose ─────────────────────────
    for (const [tweak, label] of [
      [{ schemaVersion: 2 }, 'wrong schema'],
      [{ purpose: 'something-else' }, 'wrong purpose'],
    ]) {
      const fx = await setupHappyFixture(tmpRoot, `validate-${label.replace(/\s/g, '-')}`);
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
        ...tweak,
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check(`validate: ${label} → authorizationDocumentValid=false`, () => {
        assert.strictEqual(result.authorizationDocumentValid, false);
        assert.strictEqual(result.applyReady, false);
      });
    }

    // ── Validate: whitespace-padded fingerprint / SHA / target ─────────
    for (const [field, mutate, label] of [
      ['expectedHead', (a, fx) => { a.repository.expectedHead = ' ' + fx.head; }, 'whitespace-padded expectedHead'],
      ['expectedPlanFingerprint', (a, fx) => { a.plan.expectedPlanFingerprint = fx.planFp + ' '; }, 'whitespace-padded plan fingerprint'],
      ['expectedRecordFingerprint', (a, fx) => { a.plan.expectedRecordFingerprint = ' ' + fx.firstFp; }, 'whitespace-padded record fingerprint'],
      ['targets[0]', (a, fx) => { a.targets = [' ' + fx.firstEntry.targetPath]; }, 'whitespace-padded target'],
    ]) {
      const fx = await setupHappyFixture(tmpRoot, `validate-ws-${field}`);
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
      };
      mutate(auth, fx);
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check(`validate: ${label} → authorizationDocumentValid=false`, () => {
        assert.strictEqual(result.authorizationDocumentValid, false);
        assert.strictEqual(result.applyReady, false);
      });
    }

    // ── Validate: unknown field ────────────────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-unknown-field');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
        extra: 'no',
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: unknown top-level field → authorizationDocumentValid=false', () => {
        assert.strictEqual(result.authorizationDocumentValid, false);
        assert.strictEqual(result.applyReady, false);
      });
    }

    // ── Validate: manifest changed after draft (payload drift → plan/record fp shift) ─
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-manifest-drift');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      // Now drift the manifest.
      const drift = validManifestForTwoMissing();
      drift.records[0].blogger.publishedUrl = 'https://example.blogspot.com/2026/03/first-different.html';
      writeManifest(fx.repoRoot, drift);
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: manifest drift → plan-fingerprint-mismatch + applyReady=false', () => {
        assert.strictEqual(result.applyReady, false);
        assert.ok(result.blockers.some((b) => /plan-fingerprint-mismatch/.test(b)));
      });
    }

    // ── Validate: stale HEAD (repo state advanced after auth) ──────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-stale-head');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      // Advance HEAD (and origin/main) so authorization becomes stale.
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# after-auth\n', 'utf-8');
      gitCommitFilesQuiet(fx.repoRoot, ['README.md'], 'advance');
      spawnSync('git', ['update-ref', 'refs/remotes/origin/main', 'HEAD'], {
        cwd: fx.repoRoot, encoding: 'utf-8', shell: false, windowsHide: true, timeout: 10000,
      });
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: stale HEAD → head-mismatch + applyReady=false', () => {
        assert.strictEqual(result.applyReady, false);
        assert.ok(result.blockers.some((b) => /head-mismatch/.test(b)));
      });
    }

    // ── Validate: repo dirty ───────────────────────────────────────────
    {
      const fx = await setupHappyFixture(tmpRoot, 'validate-dirty');
      const auth = {
        schemaVersion: AUTHORIZATION_SCHEMA_VERSION,
        purpose: AUTHORIZATION_PURPOSE,
        repository: { expectedHead: fx.head, expectedBranch: AUTHORIZATION_BRANCH },
        plan: {
          expectedPlanFingerprint: fx.planFp,
          expectedRecordFingerprint: fx.firstFp,
          recordCount: 1,
        },
        targets: [fx.firstEntry.targetPath],
        approval: { explicitlyAuthorized: true },
      };
      const authPath = writeAuthorization(fx.repoRoot, auth);
      writeFileSync(path.join(fx.repoRoot, 'README.md'), '# dirty\n', 'utf-8');
      const result = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('validate: dirty tree → applyReady=false + blockers include repo-state', () => {
        assert.strictEqual(result.applyReady, false);
        assert.ok(result.blockers.some((b) => /dirty-working-tree/.test(b)));
      });
    }

    // ── Cross-tool round-trip: prepare draft → edit approval → validate ─
    {
      const fx = await setupHappyFixture(tmpRoot, 'roundtrip');
      const prep = await prepareAuthorizationDraft({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
      });
      assert.strictEqual(prep.ok, true, 'prepare should succeed');
      // Flip approval to true, save fixture-side.
      const approved = { ...prep.draft, approval: { explicitlyAuthorized: true } };
      const authPath = writeAuthorization(fx.repoRoot, approved);
      const val = await preflightAuthorization({
        projectRoot: fx.repoRoot,
        manifestPath: fx.manifestPath,
        sourcePath: fx.firstEntry.sourcePath,
        authorizationPath: authPath,
      });
      await check('roundtrip: prepare → flip approval → validate → applyReady', () => {
        assert.strictEqual(val.applyReady, true, JSON.stringify(val.blockers));
        assert.strictEqual(val.writePerformed, false);
      });
    }
  } finally {
    try { rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) {}
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
  await check('dist-blogger-preview/ absent (was + remains)', () => {
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
  console.log(`[check:blogger-backfill-apply-authorization-preparation] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(
    `[check:blogger-backfill-apply-authorization-preparation] UNEXPECTED ERROR: ${err.stack || err.message || err}`,
  );
  process.exit(1);
});
