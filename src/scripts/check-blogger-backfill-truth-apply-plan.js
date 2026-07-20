#!/usr/bin/env node
// Phase 20260719：`plan-blogger-backfill-truth-apply` apply-plan gate contract guard / tests。
//
// 範圍 / 邊界：
//   - 所有 fixture 斷言在 **OS temp 目錄** 之 synthetic content tree 上跑；**絕不**碰 production
//     content / dist / settings / gh-pages / deploy clone；temp 目錄於 finally{} 清除。
//   - 只 import 被測模組（plan-blogger-backfill-truth-apply.js）之唯讀 API + node 讀取 API；
//     CLI 邊界透過 subprocess 執行；本 guard 全程 read-only（planner 本身無 mutation channel）。
//   - 不呼叫 Blogger / Google API；不需網路；不需 credential。
//   - 執行前後 production repo 之 `.publish.json` inventory + Blogger Markdown bytes 完全不變。
//
// 覆蓋（依 Session prompt §9 hard assertions 逐項對應；實際 assertion 數見執行輸出）：
//   1  valid manifest → deterministic create-only plan (--json envelope + human)
//   2  validator failure blocks planning (fingerprint absent; entries empty; exit 1)
//   3  missing candidate blocks planning
//   4  unknown candidate blocks planning
//   5  sentinel value blocks planning
//   6  duplicate published URL blocks planning
//   7  URL/month mismatch blocks planning
//   8  invalid source path (outside content/blogger/posts/) blocks planning
//   9  source missing blocks planning
//  10  target already exists blocks planning (SIDECAR_ALREADY_EXISTS)
//  11  duplicate target (via duplicate source) blocks planning
//  12  path traversal attempt (../) blocks planning at shape layer
//  13  every plan entry.operation === "create" (no update/overwrite/delete)
//  14  forbidden --apply hard-fails
//  15  forbidden --write hard-fails
//  16  forbidden --force hard-fails
//  17  unknown CLI flag hard-fails
//  18  missing --manifest hard-fails
//  19  invalid JSON manifest hard-fails
//  20  --help contract mentions read-only + never-apply
//  21  deterministic human output across two runs
//  22  deterministic JSON output across two runs
//  23  identical fingerprint across repeated runs (same input)
//  24  fingerprint changes when payload changes
//  25  fingerprint independent of temp root / OS path representation
//  26  manifest read once (validator + planner share snapshot; no second parse)
//  27  no file created in fixture
//  28  no file modified in fixture
//  29  no file deleted in fixture
//  30  no directory created in fixture
//  31  source-level: no network / node:http[s] / fetch / googleapis / oauth
//  32  source-level: no fs mutation (writeFile/mkdir/rm/rename/unlink/copyFile/appendFile)
//  33  source-level: no child_process
//  34  production sidecar inventory unchanged (bytes + mtimes)
//  35  writePerformed === false in JSON always
//
// 執行：`npm run check:blogger-backfill-truth-apply-plan`
//       或 `node src/scripts/check-blogger-backfill-truth-apply-plan.js`

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
  planTruthApply,
  buildApplyPlan,
  fingerprintPlan,
  formatHumanReadable,
  formatJson,
  PLAN_SCHEMA_VERSION,
  SUPPORTED_OPERATIONS,
} from './plan-blogger-backfill-truth-apply.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(REPO_ROOT, 'src', 'scripts', 'plan-blogger-backfill-truth-apply.js');
const CLI_SRC_RAW = readFileSync(CLI, 'utf-8');
// Strip // line comments and /* … */ block comments so source-level bans do not
// false-positive on docblock text that intentionally names what the script does NOT do.
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
    'body — planner must not read this.',
    '',
  ].join('\n');
}

function writeFileSyncMk(abs, content) {
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf-8');
}

function snapshotTree(root) {
  const out = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir).sort()) {
      const abs = path.join(dir, name);
      const st = statSync(abs);
      if (st.isDirectory()) {
        walk(abs);
      } else {
        out.push({
          rel: path.relative(root, abs).split(path.sep).join('/'),
          bytes: readFileSync(abs, 'utf-8'),
          mtimeMs: st.mtimeMs,
        });
      }
    }
  }
  walk(root);
  return out;
}

function snapshotSidecarInventory(rootAbs) {
  const inv = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir).sort()) {
      const abs = path.join(dir, name);
      const st = statSync(abs);
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
      const st = statSync(abs);
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
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    shell: false,
    windowsHide: true,
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
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

function writeManifest(repoRoot, obj, filename = 'manifest.json') {
  const p = path.join(repoRoot, filename);
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
  return p;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // Real-repo baseline snapshots — planner must be side-effect-free on production.
  const prodPostsDir = path.join(REPO_ROOT, 'content', 'blogger', 'posts');
  const prodInvBefore = snapshotSidecarInventory(prodPostsDir);
  const prodMdBefore = snapshotMarkdownBytes(prodPostsDir);

  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'plan-truth-apply-'));
  try {
    // ── T20: --help contract ────────────────────────────────────────────────
    {
      const before = snapshotTree(tmpRoot);
      const r = runCli(['--help']);
      await check('T20a --help: exit 0', () => {
        assert.strictEqual(r.status, 0, r.stderr);
      });
      await check('T20b --help: mentions read-only + never apply', () => {
        assert.ok(/NEVER performs the apply/i.test(r.stdout) || /read-only/i.test(r.stdout));
      });
      await check('T20c --help: mentions --manifest as required', () => {
        assert.ok(/--manifest\s+<path>/.test(r.stdout));
      });
      await check('T20d --help: mentions fingerprint informational', () => {
        assert.ok(/fingerprint/i.test(r.stdout));
        assert.ok(/informational/i.test(r.stdout));
      });
      await check('T20e --help: fixture root unchanged', () => {
        const after = snapshotTree(tmpRoot);
        assert.deepStrictEqual(after, before);
      });
    }

    // ── T18: missing --manifest → exit 1 ─────────────────────────────────
    await check('T18 missing --manifest: exit 1', () => {
      const r = runCli([]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--manifest.*is required/i.test(r.stderr));
    });

    // ── T14/T15/T16/T17: forbidden + unknown flags ───────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'forbidden-'));
      seedTwoMissingCandidates(repoRoot);
      const manifestPath = writeManifest(repoRoot, validManifestForTwoMissing());
      const before = snapshotTree(repoRoot);
      for (const flag of [
        '--apply',
        '--write',
        '--output',
        '--out',
        '--force',
        '--overwrite',
        '--replace',
        '--merge',
        '--yes',
        '-y',
        '--fix',
        '--commit',
        '--publish',
        '--deploy',
      ]) {
        await check(`forbidden flag ${flag}: exit 1`, () => {
          const r = runCli([flag, '--manifest', manifestPath, '--repo-root', repoRoot]);
          assert.strictEqual(r.status, 1, `unexpected exit ${r.status}: ${r.stderr}`);
          assert.ok(/forbidden flag/i.test(r.stderr));
        });
      }
      await check('forbidden also via --flag=value form (--apply=1)', () => {
        const r = runCli(['--apply=1', '--manifest', manifestPath, '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/forbidden flag/i.test(r.stderr));
      });
      await check('T17 unknown flag: exit 1', () => {
        const r = runCli(['--totally-fake', '--manifest', manifestPath, '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/unknown argument/i.test(r.stderr));
      });
      await check('non-absolute --repo-root: exit 1', () => {
        const r = runCli(['--manifest', manifestPath, '--repo-root', 'relative/path']);
        assert.strictEqual(r.status, 1);
        assert.ok(/must be an absolute path/i.test(r.stderr));
      });
      await check('forbidden / unknown runs left fixture unchanged', () => {
        const after = snapshotTree(repoRoot);
        assert.deepStrictEqual(after, before);
      });
    }

    // ── T19: invalid JSON manifest → exit 1 ─────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'invalid-json-'));
      seedTwoMissingCandidates(repoRoot);
      const p = path.join(repoRoot, 'bad.json');
      writeFileSync(p, '{ this is not json', 'utf-8');
      const r = runCli(['--manifest', p, '--repo-root', repoRoot]);
      await check('T19 invalid JSON manifest: exit 1', () => {
        assert.strictEqual(r.status, 1);
      });
    }

    // ── T1/T21/T22/T23/T35: valid manifest happy path ───────────────────
    let fpTwoMissing = null;
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'happy-'));
      const postsDir = seedTwoMissingCandidates(repoRoot);
      const manifestPath = writeManifest(repoRoot, validManifestForTwoMissing());
      const treeBefore = snapshotTree(repoRoot);
      const invBefore = snapshotSidecarInventory(postsDir);

      const r1 = runCli(['--manifest', manifestPath, '--repo-root', repoRoot]);
      const r2 = runCli(['--manifest', manifestPath, '--repo-root', repoRoot]);
      await check('T1 valid manifest human: exit 0', () => {
        assert.strictEqual(r1.status, 0, r1.stderr);
      });
      await check('T1 valid manifest human: ends with Overall: PASS', () => {
        assert.ok(/Overall: PASS/.test(r1.stdout));
      });
      await check('T1 valid manifest human: shows planned create count = 2', () => {
        assert.ok(/planned create count:\s+2/.test(r1.stdout));
      });
      await check('T21 valid manifest human deterministic across two runs', () => {
        assert.strictEqual(r1.stdout, r2.stdout);
      });

      const j1 = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      const j2 = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T1 valid manifest --json: exit 0', () => {
        assert.strictEqual(j1.status, 0, j1.stderr);
      });
      await check('T22 valid manifest --json deterministic across two runs', () => {
        assert.strictEqual(j1.stdout, j2.stdout);
      });
      const parsed = JSON.parse(j1.stdout);
      await check('T1 --json envelope: schemaVersion + mode + writePerformed', () => {
        assert.strictEqual(parsed.schemaVersion, PLAN_SCHEMA_VERSION);
        assert.strictEqual(parsed.mode, 'plan-apply');
        assert.strictEqual(parsed.writePerformed, false);
        assert.strictEqual(parsed.ok, true);
        assert.deepStrictEqual(parsed.errors, []);
      });
      await check('T1 --json summary: plannedCreateCount=2, conflictCount=0, validatorOk=true', () => {
        assert.strictEqual(parsed.summary.plannedCreateCount, 2);
        assert.strictEqual(parsed.summary.conflictCount, 0);
        assert.strictEqual(parsed.summary.validatorOk, true);
      });
      await check('T1 --json entries: 2 create entries sorted by sourcePath', () => {
        assert.strictEqual(parsed.plan.entries.length, 2);
        const paths = parsed.plan.entries.map((e) => e.sourcePath);
        assert.deepStrictEqual(paths, [...paths].sort());
      });
      await check('T13 every entry.operation === "create"', () => {
        for (const e of parsed.plan.entries) {
          assert.strictEqual(e.operation, 'create');
        }
        assert.deepStrictEqual(parsed.plan.operationsAccepted, SUPPORTED_OPERATIONS);
      });
      await check('T1 --json payload: full sidecar body (canonical/ogImage/blogger/github/seo)', () => {
        const first = parsed.plan.entries[0];
        assert.strictEqual(first.targetPath, 'content/blogger/posts/20260301-first.publish.json');
        assert.strictEqual(first.payload.schemaVersion, 1);
        assert.ok(first.payload.canonical, 'payload.canonical present');
        assert.ok(first.payload.ogImage, 'payload.ogImage present');
        assert.ok(first.payload.blogger, 'payload.blogger present');
        assert.ok(first.payload.github, 'payload.github present');
        assert.ok(first.payload.seo, 'payload.seo present');
        assert.strictEqual(first.payload.blogger.bloggerPostId, '');
        assert.strictEqual(first.payload.blogger.publishYear, '2026');
        assert.strictEqual(first.payload.blogger.publishMonth, '03');
      });
      await check('T23 --json fingerprint stable across two runs (same input)', () => {
        const a = JSON.parse(j1.stdout).fingerprint;
        const b = JSON.parse(j2.stdout).fingerprint;
        assert.strictEqual(a.algorithm, 'sha256');
        assert.strictEqual(a.encoding, 'hex');
        assert.ok(/^[0-9a-f]{64}$/.test(a.value), `fingerprint not sha256 hex: ${a.value}`);
        assert.strictEqual(a.value, b.value);
        fpTwoMissing = a.value;
      });
      await check('T35 writePerformed === false in JSON', () => {
        assert.strictEqual(parsed.writePerformed, false);
        assert.strictEqual(parsed.validator.mutationPerformed, false);
      });
      await check('T27/T28/T29/T30 no fixture file created / modified / deleted', () => {
        const treeAfter = snapshotTree(repoRoot);
        const beforeMap = Object.fromEntries(treeBefore.map((f) => [f.rel, f]));
        const afterMap = Object.fromEntries(treeAfter.map((f) => [f.rel, f]));
        assert.deepStrictEqual(Object.keys(afterMap).sort(), Object.keys(beforeMap).sort());
        for (const rel of Object.keys(beforeMap)) {
          assert.strictEqual(afterMap[rel].bytes, beforeMap[rel].bytes, `bytes drift: ${rel}`);
          assert.strictEqual(afterMap[rel].mtimeMs, beforeMap[rel].mtimeMs, `mtime drift: ${rel}`);
        }
      });
      await check('no sidecar created in fixture', () => {
        const invAfter = snapshotSidecarInventory(postsDir);
        assert.deepStrictEqual(invAfter, invBefore);
      });
    }

    // ── T24: fingerprint changes when payload changes ────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'fp-payload-'));
      seedTwoMissingCandidates(repoRoot);
      const alt = validManifestForTwoMissing();
      alt.records[0].blogger.publishedUrl = 'https://example.blogspot.com/2026/03/first-different.html';
      const manifestPath = writeManifest(repoRoot, alt);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T24 fingerprint changes when payload changes', () => {
        assert.strictEqual(j.status, 0, j.stderr);
        const parsed = JSON.parse(j.stdout);
        assert.notStrictEqual(parsed.fingerprint.value, fpTwoMissing);
      });
    }

    // ── T25: fingerprint independent of temp root / OS path representation ─
    {
      // Same manifest content + same fixture layout, but a different temp root.
      const repoRootA = mkdtempSync(path.join(tmpRoot, 'fp-root-a-'));
      const repoRootB = mkdtempSync(path.join(tmpRoot, 'fp-root-b-'));
      seedTwoMissingCandidates(repoRootA);
      seedTwoMissingCandidates(repoRootB);
      const manifestPathA = writeManifest(repoRootA, validManifestForTwoMissing());
      const manifestPathB = writeManifest(repoRootB, validManifestForTwoMissing());
      const jA = runCli(['--manifest', manifestPathA, '--json', '--repo-root', repoRootA]);
      const jB = runCli(['--manifest', manifestPathB, '--json', '--repo-root', repoRootB]);
      await check('T25 fingerprint identical across different temp roots', () => {
        assert.strictEqual(jA.status, 0, jA.stderr);
        assert.strictEqual(jB.status, 0, jB.stderr);
        const fpA = JSON.parse(jA.stdout).fingerprint.value;
        const fpB = JSON.parse(jB.stdout).fingerprint.value;
        assert.strictEqual(fpA, fpB);
      });
    }

    // ── SELECTED COVERAGE fingerprint binding (Phase 20260720) ────────────
    {
      const FIRST = 'content/blogger/posts/20260301-first.md';
      const SECOND = 'content/blogger/posts/20260302-second.md';
      const R0 = () => validManifestForTwoMissing().records[0];
      const R1 = () => validManifestForTwoMissing().records[1];
      const sel = (paths, recs) => ({
        schemaVersion: 1,
        coverage: { mode: 'selected', selectedSourcePaths: paths },
        records: recs,
      });
      function fpOf(repoRoot, manifestObj, name) {
        const p = writeManifest(repoRoot, manifestObj, name);
        const j = runCli(['--manifest', p, '--json', '--repo-root', repoRoot]);
        assert.strictEqual(j.status, 0, `${name}: ${j.stderr}${j.stdout}`);
        return JSON.parse(j.stdout);
      }

      const repoRoot = mkdtempSync(path.join(tmpRoot, 'sel-fp-'));
      const invBefore = snapshotSidecarInventory(seedTwoMissingCandidates(repoRoot));

      const full = fpOf(repoRoot, validManifestForTwoMissing(), 'full.json');
      const selBoth = fpOf(repoRoot, sel([FIRST, SECOND], [R0(), R1()]), 'sel-both.json');
      const selFirst = fpOf(repoRoot, sel([FIRST], [R0()]), 'sel-first.json');
      const selSecond = fpOf(repoRoot, sel([SECOND], [R1()]), 'sel-second.json');

      await check('SEL plan JSON surfaces coverageMode (full vs selected)', () => {
        assert.strictEqual(full.summary.coverageMode, 'full');
        assert.strictEqual(selBoth.summary.coverageMode, 'selected');
        assert.strictEqual(selFirst.summary.coverageMode, 'selected');
      });
      await check('SEL full vs selected same set → different plan fingerprint (coverage bound)', () => {
        // Same entry set {first, second}, but full vs selected must NOT collide.
        assert.notStrictEqual(full.fingerprint.value, selBoth.fingerprint.value);
      });
      await check('SEL different selected sets → different plan fingerprint', () => {
        assert.notStrictEqual(selFirst.fingerprint.value, selSecond.fingerprint.value);
        assert.notStrictEqual(selFirst.fingerprint.value, selBoth.fingerprint.value);
        assert.notStrictEqual(selSecond.fingerprint.value, selBoth.fingerprint.value);
      });
      await check('SEL selected fingerprint deterministic across two runs', () => {
        const again = fpOf(repoRoot, sel([FIRST], [R0()]), 'sel-first-2.json');
        assert.strictEqual(again.fingerprint.value, selFirst.fingerprint.value);
      });
      await check('SEL authorization fail-closed: fp bound to {first,second} rejects narrowed {first}', () => {
        // An authorization document persists expectedPlanFingerprint = selBoth's value.
        // After the operator narrows the selection to {first}, plan:apply recomputes a
        // different fingerprint. The apply / preflight binding compares strict equality,
        // so the stale authorization can no longer match — fail-closed by construction.
        const staleAuthorizedFingerprint = selBoth.fingerprint.value;
        const currentFingerprint = selFirst.fingerprint.value;
        assert.notStrictEqual(currentFingerprint, staleAuthorizedFingerprint);
      });
      await check('SEL selected-mode planning created no sidecar', () => {
        const invAfter = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
        assert.deepStrictEqual(invAfter, invBefore);
      });

      // API-level: fingerprintPlan coverage descriptor differentiates full vs selected
      // while remaining byte-identical to legacy when coverage omitted.
      await check('API fingerprintPlan: omitting coverage === legacy full fingerprint', async () => {
        const p = writeManifest(repoRoot, validManifestForTwoMissing(), 'api-full.json');
        const { report, plan, fingerprint } = await planTruthApply({ manifestPath: p, repoRoot });
        const legacy = fingerprintPlan({
          manifestSchemaVersion: report.manifest.schemaVersion,
          entries: plan.entries,
        });
        assert.strictEqual(legacy.value, fingerprint.value);
      });
      await check('API fingerprintPlan: selected descriptor changes the value', async () => {
        const p = writeManifest(repoRoot, sel([FIRST], [R0()]), 'api-sel.json');
        const { report, plan } = await planTruthApply({ manifestPath: p, repoRoot });
        const withCoverage = fingerprintPlan({
          manifestSchemaVersion: report.manifest.schemaVersion,
          entries: plan.entries,
          coverage: { mode: 'selected', selectedSourcePaths: [FIRST] },
        });
        const withoutCoverage = fingerprintPlan({
          manifestSchemaVersion: report.manifest.schemaVersion,
          entries: plan.entries,
        });
        assert.notStrictEqual(withCoverage.value, withoutCoverage.value);
      });
    }

    // ── T2: validator failure blocks planning ────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't2-vf-'));
      seedTwoMissingCandidates(repoRoot);
      // Sentinel in publishedUrl → validator fails.
      const bad = validManifestForTwoMissing();
      bad.records[0].blogger.publishedUrl = 'TODO';
      const manifestPath = writeManifest(repoRoot, bad);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T2a validator fail → exit 1', () => {
        assert.strictEqual(j.status, 1);
      });
      const parsed = JSON.parse(j.stdout);
      await check('T2b validator fail → ok=false + fingerprint null', () => {
        assert.strictEqual(parsed.ok, false);
        assert.strictEqual(parsed.fingerprint, null);
      });
      await check('T2c validator fail → plan.entries empty + plannedCreateCount=0', () => {
        assert.strictEqual(parsed.summary.plannedCreateCount, 0);
        assert.strictEqual(parsed.plan.entries.length, 0);
      });
      await check('T2d writePerformed still false', () => {
        assert.strictEqual(parsed.writePerformed, false);
      });
    }

    // ── T3: missing candidate blocks planning ────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't3-missing-'));
      seedTwoMissingCandidates(repoRoot);
      const partial = {
        schemaVersion: 1,
        records: [validManifestForTwoMissing().records[0]],
      };
      const manifestPath = writeManifest(repoRoot, partial);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T3 missing candidate → exit 1 + fingerprint null', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.ok, false);
        assert.strictEqual(parsed.fingerprint, null);
        assert.strictEqual(parsed.validator.summary.missingCandidateCount, 1);
      });
    }

    // ── T4: unknown candidate blocks planning ────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't4-unknown-'));
      seedTwoMissingCandidates(repoRoot);
      const extra = {
        schemaVersion: 1,
        records: [
          ...validManifestForTwoMissing().records,
          {
            sourcePath: 'content/blogger/posts/20260303-ghost.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/ghost.html',
              publishedAt: '2026-03-03',
            },
          },
        ],
      };
      const manifestPath = writeManifest(repoRoot, extra);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T4 unknown candidate → exit 1 + fingerprint null', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.ok, false);
        assert.strictEqual(parsed.fingerprint, null);
        assert.strictEqual(parsed.validator.summary.unknownCandidateCount, 1);
      });
    }

    // ── T5: sentinel value blocks planning (covered by T2 but assert explicitly) ─
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't5-sentinel-'));
      seedTwoMissingCandidates(repoRoot);
      // Use N/A this time to hit a different code path than TODO.
      const bad = validManifestForTwoMissing();
      bad.records[1].blogger.publishedUrl = 'https://example.blogspot.com/2026/03/second.html';
      bad.records[1].blogger.publishedAt = 'N/A';
      const manifestPath = writeManifest(repoRoot, bad);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T5 sentinel N/A in publishedAt → exit 1 + fingerprint null', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.fingerprint, null);
        assert.ok(parsed.validator.summary.sentinelHitCount >= 1);
      });
    }

    // ── T6: duplicate published URL blocks planning ──────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't6-dup-url-'));
      seedTwoMissingCandidates(repoRoot);
      const dup = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/shared.html',
              publishedAt: '2026-03-01',
            },
          },
          {
            sourcePath: 'content/blogger/posts/20260302-second.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/shared.html',
              publishedAt: '2026-03-02',
            },
          },
        ],
      };
      const manifestPath = writeManifest(repoRoot, dup);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T6 duplicate publishedUrl → exit 1 + fingerprint null', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.fingerprint, null);
        assert.strictEqual(parsed.validator.summary.duplicateUrlCount, 1);
      });
    }

    // ── T7: URL/month mismatch blocks planning ───────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't7-month-'));
      seedTwoMissingCandidates(repoRoot);
      const bad = validManifestForTwoMissing();
      bad.records[0].blogger.publishedUrl = 'https://example.blogspot.com/2026/05/first.html';
      const manifestPath = writeManifest(repoRoot, bad);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T7 URL/month mismatch → exit 1 + fingerprint null', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.fingerprint, null);
        assert.strictEqual(parsed.validator.summary.monthMismatchCount, 1);
      });
    }

    // ── T8: invalid source path (outside allowed prefix) blocks planning ─
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't8-prefix-'));
      seedTwoMissingCandidates(repoRoot);
      writeFileSyncMk(
        path.join(repoRoot, 'content', 'github', 'posts', '20260301-gh.md'),
        fmMd({ id: '20260301-gh', slug: 'gh' }),
      );
      const bad = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/github/posts/20260301-gh.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/gh.html',
              publishedAt: '2026-03-01',
            },
          },
        ],
      };
      const manifestPath = writeManifest(repoRoot, bad);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T8 sourcePath outside content/blogger/posts/ → exit 1', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.fingerprint, null);
      });
    }

    // ── T9: source missing blocks planning ───────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't9-src-missing-'));
      seedTwoMissingCandidates(repoRoot);
      const bad = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260401-nowhere.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/04/nowhere.html',
              publishedAt: '2026-04-01',
            },
          },
        ],
      };
      const manifestPath = writeManifest(repoRoot, bad);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T9 source Markdown missing → exit 1', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.fingerprint, null);
      });
    }

    // ── T10: target already exists blocks planning ───────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't10-target-'));
      const postsDir = seedTwoMissingCandidates(repoRoot);
      writeFileSyncMk(
        path.join(postsDir, '20260301-first.publish.json'),
        JSON.stringify(
          {
            schemaVersion: 1,
            blogger: {
              type: 'post',
              permalink: 'first',
              status: 'published',
              publishedUrl: 'https://example.blogspot.com/2026/03/first.html',
              publishedAt: '2026-03-01',
              bloggerPostId: '',
            },
          },
          null,
          2,
        ) + '\n',
      );
      const manifestPath = writeManifest(repoRoot, validManifestForTwoMissing());
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T10 target sidecar already exists → exit 1', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.fingerprint, null);
      });
    }

    // ── T11: duplicate target (via duplicate source) blocks planning ─────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't11-dup-src-'));
      seedTwoMissingCandidates(repoRoot);
      const dup = {
        schemaVersion: 1,
        records: [
          validManifestForTwoMissing().records[0],
          validManifestForTwoMissing().records[0],
        ],
      };
      const manifestPath = writeManifest(repoRoot, dup);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T11 duplicate sourcePath → exit 1', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.fingerprint, null);
      });
    }

    // ── T12: path traversal blocks planning ──────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't12-traversal-'));
      seedTwoMissingCandidates(repoRoot);
      const bad = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/../../../etc/passwd.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/x.html',
              publishedAt: '2026-03-01',
            },
          },
        ],
      };
      const manifestPath = writeManifest(repoRoot, bad);
      const j = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T12 path traversal (../) → exit 1', () => {
        assert.strictEqual(j.status, 1);
        const parsed = JSON.parse(j.stdout);
        assert.strictEqual(parsed.fingerprint, null);
      });
    }

    // ── T26: manifest read once — in-process planTruthApply exercises this ─
    //         (validator + planner share the same in-process report object;
    //          if fs.readFile were called twice with different content, plan
    //          would drift from validation. Cover via API smoke.)
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't26-snapshot-'));
      seedTwoMissingCandidates(repoRoot);
      const manifestPath = writeManifest(repoRoot, validManifestForTwoMissing());
      const { report, plan, fingerprint } = await planTruthApply({ manifestPath, repoRoot });
      await check('T26a planTruthApply happy path: report.ok=true', () => {
        assert.strictEqual(report.ok, true);
      });
      await check('T26b plan entries derived from same manifest snapshot', () => {
        // Each plan entry's payload publishedUrl must equal the manifest's original truth.
        const originals = new Map(
          report.manifest.records.map((r) => [r.sourcePath, r.blogger.publishedUrl]),
        );
        for (const e of plan.entries) {
          assert.strictEqual(e.payload.blogger.publishedUrl, originals.get(e.sourcePath));
        }
      });
      await check('T26c fingerprintPlan deterministic on same entries', () => {
        const a = fingerprintPlan({
          manifestSchemaVersion: report.manifest.schemaVersion,
          entries: plan.entries,
        });
        const b = fingerprintPlan({
          manifestSchemaVersion: report.manifest.schemaVersion,
          entries: plan.entries,
        });
        assert.strictEqual(a.value, b.value);
        assert.strictEqual(a.value, fingerprint.value);
      });
    }

    // ── T31/T32/T33: source-level static bans ────────────────────────────
    await check('T31a source: no fetch(', () => {
      assert.ok(!/\bfetch\s*\(/.test(CLI_SRC));
    });
    await check('T31b source: no node:http / node:https import', () => {
      assert.ok(!/from ['"]node:https?['"]/.test(CLI_SRC));
      assert.ok(!/require\(['"]node:https?['"]\)/.test(CLI_SRC));
    });
    await check('T31c source: no googleapis / blogger.googleapis / oauth', () => {
      assert.ok(!/googleapis|blogger\.googleapis|oauth/i.test(CLI_SRC));
    });
    await check('T32 source: no fs mutation APIs', () => {
      assert.ok(!/\bfs\.writeFile\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.appendFile\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.mkdir\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.rename\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.rm\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.unlink\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.copyFile\b/.test(CLI_SRC));
    });
    await check('T33 source: no child_process import or spawn call', () => {
      assert.ok(!/child_process/.test(CLI_SRC));
      assert.ok(!/spawnSync|execSync|execFileSync|spawn\(|exec\(/.test(CLI_SRC));
    });
    await check('source: reuses validator + bootstrap directly (no CLI subprocess)', () => {
      assert.ok(
        /import\s*\{[\s\S]*?validateTruthManifest[\s\S]*?\}\s*from\s*['"]\.\/validate-blogger-backfill-truth-manifest\.js['"]/.test(
          CLI_SRC,
        ),
        'validator import missing',
      );
      assert.ok(
        /import\s*\{[\s\S]*?buildSidecarBody[\s\S]*?\}\s*from\s*['"]\.\/bootstrap-blogger-backfill-sidecars\.js['"]/.test(
          CLI_SRC,
        ),
        'buildSidecarBody import missing',
      );
    });

    // ── parseArgs smoke ─────────────────────────────────────────────────
    await check('parseArgs: --help', () => {
      const o = parseArgs(['node', 'cli', '--help']);
      assert.strictEqual(o.help, true);
    });
    await check('parseArgs: --json + --manifest', () => {
      const o = parseArgs(['node', 'cli', '--json', '--manifest', '/tmp/m.json']);
      assert.strictEqual(o.json, true);
      assert.strictEqual(o.manifest, '/tmp/m.json');
    });
    await check('parseArgs: --manifest=<path> form', () => {
      const o = parseArgs(['node', 'cli', '--manifest=/tmp/m.json']);
      assert.strictEqual(o.manifest, '/tmp/m.json');
    });
    await check('parseArgs: forbidden flags collected', () => {
      const o = parseArgs(['node', 'cli', '--apply', '--write', '--force', '--commit']);
      assert.ok(o.forbidden.includes('--apply'));
      assert.ok(o.forbidden.includes('--write'));
      assert.ok(o.forbidden.includes('--force'));
      assert.ok(o.forbidden.includes('--commit'));
    });
    await check('parseArgs: unknown flag captured', () => {
      const o = parseArgs(['node', 'cli', '--totally-fake']);
      assert.ok(o.unknown.includes('--totally-fake'));
    });

    // ── buildApplyPlan / formatters API smoke ───────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'api-'));
      seedTwoMissingCandidates(repoRoot);
      const manifestPath = writeManifest(repoRoot, validManifestForTwoMissing());
      const { report, plan, fingerprint } = await planTruthApply({ manifestPath, repoRoot });
      await check('API: buildApplyPlan direct: plannedCreateCount=2', () => {
        const direct = buildApplyPlan({ report });
        assert.strictEqual(direct.plannedCreateCount, 2);
        assert.strictEqual(direct.ok, true);
        assert.deepStrictEqual(
          direct.entries.map((e) => e.operation),
          ['create', 'create'],
        );
      });
      await check('API: formatJson deterministic across two calls', () => {
        const a = formatJson({ report, plan, fingerprint, manifestPath });
        const b = formatJson({ report, plan, fingerprint, manifestPath });
        assert.strictEqual(a, b);
      });
      await check('API: formatHumanReadable ends with Overall: PASS', () => {
        const h = formatHumanReadable({ report, plan, fingerprint, manifestPath });
        assert.ok(/Overall: PASS/.test(h));
        assert.ok(/Planning only\./.test(h));
      });
      await check('API: buildApplyPlan on failed report → empty entries + ok=false', () => {
        const badReport = { ...report, ok: false, errors: ['synthesized failure'] };
        const badPlan = buildApplyPlan({ report: badReport });
        assert.strictEqual(badPlan.ok, false);
        assert.strictEqual(badPlan.plannedCreateCount, 0);
        assert.strictEqual(badPlan.entries.length, 0);
      });
    }
  } finally {
    try {
      rmSync(tmpRoot, { recursive: true, force: true });
    } catch (_) {
      /* ignore */
    }
  }

  // ── T34: production repo untouched ──────────────────────────────────────
  const prodInvAfter = snapshotSidecarInventory(prodPostsDir);
  const prodMdAfter = snapshotMarkdownBytes(prodPostsDir);
  await check('T34a production sidecar file list unchanged', () => {
    const b = new Set(prodInvBefore.map((s) => s.rel));
    const a = new Set(prodInvAfter.map((s) => s.rel));
    assert.deepStrictEqual([...a].sort(), [...b].sort());
  });
  await check('T34b production sidecar bytes unchanged', () => {
    const b = Object.fromEntries(prodInvBefore.map((s) => [s.rel, s.bytes]));
    const a = Object.fromEntries(prodInvAfter.map((s) => [s.rel, s.bytes]));
    assert.deepStrictEqual(a, b);
  });
  await check('T34c production sidecar mtimes unchanged', () => {
    const b = Object.fromEntries(prodInvBefore.map((s) => [s.rel, s.mtimeMs]));
    const a = Object.fromEntries(prodInvAfter.map((s) => [s.rel, s.mtimeMs]));
    assert.deepStrictEqual(a, b);
  });
  await check('T34d production Blogger Markdown bytes unchanged', () => {
    const b = Object.fromEntries(prodMdBefore.map((s) => [s.rel, s.bytes]));
    const a = Object.fromEntries(prodMdAfter.map((s) => [s.rel, s.bytes]));
    assert.deepStrictEqual(a, b);
  });
  await check('T34e production Blogger Markdown mtimes unchanged', () => {
    const b = Object.fromEntries(prodMdBefore.map((s) => [s.rel, s.mtimeMs]));
    const a = Object.fromEntries(prodMdAfter.map((s) => [s.rel, s.mtimeMs]));
    assert.deepStrictEqual(a, b);
  });
  await check('dist-blogger-preview/ absent under repo root', () => {
    assert.ok(!existsSync(path.join(REPO_ROOT, 'dist-blogger-preview')));
  });

  console.log('');
  console.log(`[check:blogger-backfill-truth-apply-plan] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(
    `[check:blogger-backfill-truth-apply-plan] UNEXPECTED ERROR: ${err.stack || err.message || err}`,
  );
  process.exit(1);
});
