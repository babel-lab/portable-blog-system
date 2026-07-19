#!/usr/bin/env node
// Phase 20260719：`validate-blogger-backfill-truth-manifest` intake validator contract guard / tests。
//
// 範圍 / 邊界：
//   - 所有 fixture 斷言在 **OS temp 目錄** 之 synthetic content tree 上跑；**絕不**碰 production
//     content / dist / settings / gh-pages / deploy clone；temp 目錄於 finally{} 清除。
//   - 只 import 被測模組（validate-blogger-backfill-truth-manifest.js）之唯讀 API + node 讀取 API；
//     CLI 邊界透過 subprocess 執行；本 guard 全程 read-only（validator 本身無 mutation channel）。
//   - 不呼叫 Blogger / Google API；不需網路；不需 credential。
//   - 執行前後 production repo 之 `.publish.json` inventory + Blogger Markdown bytes 完全不變。
//
// 覆蓋（依 Session prompt §6 逐項對應）：
//   1  valid synthetic manifest → PASS
//   2  missing --manifest → exit 1
//   3  missing file → exit 1
//   4  invalid JSON → exit 1
//   5  wrong schema / version → exit 1
//   6  missing candidate (coverage) → exit 1
//   7  unknown candidate (coverage) → exit 1
//   8  duplicate sourcePath / slug → exit 1
//   9  n/a (bloggerPostId not in template schema)
//  10  duplicate publishedUrl → exit 1
//  11  blank truth field → exit 1
//  12  whitespace-only truth field → exit 1
//  13  placeholder / sentinel truth → exit 1
//  14  n/a (bloggerPostId not in template schema)
//  15  invalid strict ISO publishedAt → exit 1
//  16  invalid calendar date → exit 1
//  17  timezone / month boundary case → PASS when consistent
//  18  invalid publishedUrl → exit 1
//  19  URL / month mismatch → exit 1
//  20  deterministic human output across two runs
//  21  deterministic JSON output across two runs
//  22  help contract
//  23  validator does not modify input manifest
//  24  validator does not modify repository files (fixture tree bytes/mtime unchanged)
//  25  no network / Blogger API path (source-level static assertions)
//
// 加上：
//  - forbidden flag hard-fail（--apply / --write / --output / --out / --force / --overwrite /
//    --replace / --merge / --yes / -y / --fix；及 --flag=value 形）
//  - unknown flag hard-fail
//  - --json JSON stdout envelope shape（top-level fields present）
//  - Direct-node smoke: node src/scripts/validate-blogger-backfill-truth-manifest.js 可執行
//  - Real-repo dry-run smoke: 對 prepare-truth-manifest 產出之未填 template 執行本 validator 應 fail-closed
//    （coverage 過關 + sentinel 不觸發 + shape 失敗於 empty URL / empty publishedAt）
//  - production side-effect check: production 檔案 bytes / mtime 執行前後一致；prepare-truth-manifest
//    產出之六篇 MISSING_SIDECAR 前後不變
//  - dist-blogger-preview/ absent
//
// 執行：`npm run check:blogger-backfill-truth-manifest-validator`
//       或 `node src/scripts/check-blogger-backfill-truth-manifest-validator.js`

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
  validateTruthManifest,
  formatHumanReadable,
  formatJson,
  TRUTH_SENTINELS,
  MANIFEST_SCHEMA_VERSION,
} from './validate-blogger-backfill-truth-manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(REPO_ROOT, 'src', 'scripts', 'validate-blogger-backfill-truth-manifest.js');
const PREPARE_CLI = path.join(REPO_ROOT, 'src', 'scripts', 'prepare-blogger-backfill-truth-manifest.js');
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
    'body — validator must not read this.',
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

function runCli(args, cliPath = CLI) {
  const r = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    shell: false,
    windowsHide: true,
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// Seed a fixture with two MISSING_SIDECAR candidates (first, second) so that
// bootstrap / validator have a stable "known good" candidate set.
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
    schemaVersion: MANIFEST_SCHEMA_VERSION,
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
  // Real-repo baseline snapshots — validator must be side-effect-free.
  const prodPostsDir = path.join(REPO_ROOT, 'content', 'blogger', 'posts');
  const prodInvBefore = snapshotSidecarInventory(prodPostsDir);
  const prodMdBefore = snapshotMarkdownBytes(prodPostsDir);

  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'validate-truth-manifest-'));
  try {
    // ── T22: --help contract ─────────────────────────────────────────────
    {
      const before = snapshotTree(tmpRoot);
      const r = runCli(['--help']);
      await check('T22a --help: exit 0', () => {
        assert.strictEqual(r.status, 0, r.stderr);
      });
      await check('T22b --help: mentions read-only / never modifies', () => {
        assert.ok(
          /read-only|NEVER modifies|NEVER creates/i.test(r.stdout),
          `help missing no-mutation clause: ${r.stdout.slice(0, 200)}`,
        );
      });
      await check('T22c --help: mentions --manifest as required', () => {
        assert.ok(/--manifest\s+<path>/.test(r.stdout));
        assert.ok(/Required/i.test(r.stdout));
      });
      await check('T22d --help: mentions --json and --repo-root options', () => {
        assert.ok(/--json/.test(r.stdout));
        assert.ok(/--repo-root/.test(r.stdout));
      });
      await check('T22e --help: fixture root unchanged', () => {
        const after = snapshotTree(tmpRoot);
        assert.deepStrictEqual(after, before);
      });
    }

    // ── T2: missing --manifest → exit 1 ────────────────────────────────
    await check('T2 missing --manifest: exit 1', () => {
      const r = runCli([]);
      assert.strictEqual(r.status, 1);
      assert.ok(/--manifest.*is required/i.test(r.stderr));
    });

    // ── forbidden flags → exit 1 ─────────────────────────────────────────
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
      await check('unknown flag: exit 1', () => {
        const r = runCli(['--totally-fake', '--manifest', manifestPath, '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/unknown argument/i.test(r.stderr));
      });
      await check('non-absolute --repo-root: exit 1', () => {
        const r = runCli(['--manifest', manifestPath, '--repo-root', 'relative/path']);
        assert.strictEqual(r.status, 1);
        assert.ok(/must be an absolute path/i.test(r.stderr));
      });
      await check('forbidden / unknown / repo-root fail runs did not create files in fixture', () => {
        const after = snapshotTree(repoRoot);
        assert.deepStrictEqual(after, before);
      });
    }

    // ── T3: missing manifest file → exit 1 ────────────────────────────────
    await check('T3 missing manifest file: exit 1', () => {
      const nonexistent = path.join(tmpRoot, 'does-not-exist.json');
      const r = runCli(['--manifest', nonexistent]);
      assert.strictEqual(r.status, 1);
      assert.ok(/manifest read failed/i.test(r.stdout + r.stderr) || /ENOENT/i.test(r.stdout + r.stderr),
        `expected read-failure diagnostic; got stdout=${r.stdout} stderr=${r.stderr}`);
    });

    // ── T4: invalid JSON → exit 1 ─────────────────────────────────────────
    await check('T4 invalid JSON: exit 1', () => {
      const p = path.join(tmpRoot, 'invalid.json');
      writeFileSync(p, '{ this is not json', 'utf-8');
      const r = runCli(['--manifest', p]);
      assert.strictEqual(r.status, 1);
      assert.ok(/JSON parse error/i.test(r.stdout + r.stderr));
    });

    // ── T5: wrong schema version + wrong top-level shape → exit 1 ────────
    {
      const p1 = path.join(tmpRoot, 'wrong-version.json');
      writeFileSync(p1, JSON.stringify({ schemaVersion: 42, records: [] }) + '\n', 'utf-8');
      await check('T5a wrong schemaVersion: exit 1', () => {
        const r = runCli(['--manifest', p1]);
        assert.strictEqual(r.status, 1);
        assert.ok(/schemaVersion must be 1/i.test(r.stdout + r.stderr));
      });
      const p2 = path.join(tmpRoot, 'unknown-top.json');
      writeFileSync(p2, JSON.stringify({ schemaVersion: 1, records: [], attacker: 'x' }) + '\n', 'utf-8');
      await check('T5b unknown top-level field: exit 1', () => {
        const r = runCli(['--manifest', p2]);
        assert.strictEqual(r.status, 1);
        assert.ok(/unknown top-level field/i.test(r.stdout + r.stderr));
      });
      const p3 = path.join(tmpRoot, 'not-object.json');
      writeFileSync(p3, JSON.stringify([1, 2, 3]) + '\n', 'utf-8');
      await check('T5c non-object top-level: exit 1', () => {
        const r = runCli(['--manifest', p3]);
        assert.strictEqual(r.status, 1);
        assert.ok(/must be a JSON object/i.test(r.stdout + r.stderr));
      });
      const p4 = path.join(tmpRoot, 'records-not-array.json');
      writeFileSync(p4, JSON.stringify({ schemaVersion: 1, records: {} }) + '\n', 'utf-8');
      await check('T5d records not array: exit 1', () => {
        const r = runCli(['--manifest', p4]);
        assert.strictEqual(r.status, 1);
        assert.ok(/records must be an array/i.test(r.stdout + r.stderr));
      });
    }

    // ── T1: valid synthetic manifest → PASS (exit 0) ──────────────────────
    // ── T20-21: deterministic output ─────────────────────────────────────
    // ── T23-24: validator does not modify input manifest or fixture ──────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'happy-'));
      const postsDir = seedTwoMissingCandidates(repoRoot);
      const manifestPath = writeManifest(repoRoot, validManifestForTwoMissing());
      const manifestBefore = readFileSync(manifestPath, 'utf-8');
      const manifestStBefore = statSync(manifestPath);
      const treeBefore = snapshotTree(repoRoot);
      const invBefore = snapshotSidecarInventory(postsDir);

      const r1 = runCli(['--manifest', manifestPath, '--repo-root', repoRoot]);
      const r2 = runCli(['--manifest', manifestPath, '--repo-root', repoRoot]);
      await check('T1 valid synthetic manifest → exit 0', () => {
        assert.strictEqual(r1.status, 0, r1.stderr);
      });
      await check('T1 human-readable ends with Overall: PASS', () => {
        assert.ok(/Overall: PASS/.test(r1.stdout));
        assert.ok(/valid entries:\s+2/.test(r1.stdout));
        assert.ok(/invalid entries:\s+0/.test(r1.stdout));
        assert.ok(/missing candidates.*?:\s*0/.test(r1.stdout));
        assert.ok(/unknown candidates.*?:\s*0/.test(r1.stdout));
      });
      await check('T20 human-readable deterministic across two runs', () => {
        assert.strictEqual(r1.stdout, r2.stdout);
      });

      const j1 = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      const j2 = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T1 --json valid manifest → exit 0', () => {
        assert.strictEqual(j1.status, 0, j1.stderr);
      });
      await check('T1 --json envelope: ok=true + mode=validate + mutationPerformed=false', () => {
        const obj = JSON.parse(j1.stdout);
        assert.strictEqual(obj.ok, true);
        assert.strictEqual(obj.mode, 'validate');
        assert.strictEqual(obj.mutationPerformed, false);
        assert.strictEqual(obj.schemaVersion, 1);
        assert.ok(obj.summary);
        assert.strictEqual(obj.summary.recordCount, 2);
        assert.strictEqual(obj.summary.validCount, 2);
        assert.strictEqual(obj.summary.invalidCount, 0);
        assert.strictEqual(obj.summary.missingCandidateCount, 0);
        assert.strictEqual(obj.summary.unknownCandidateCount, 0);
        assert.deepStrictEqual(obj.errors, []);
      });
      await check('T21 --json deterministic across two runs', () => {
        assert.strictEqual(j1.stdout, j2.stdout);
      });
      await check('T1 --json entries sorted by sourcePath', () => {
        const obj = JSON.parse(j1.stdout);
        const paths = obj.entries.map((e) => e.sourcePath);
        assert.deepStrictEqual(paths, [...paths].sort());
      });
      await check('T1 --json: no timestamp / generatedAt / asOf leaked', () => {
        assert.ok(!/"generatedAt"/.test(j1.stdout));
        assert.ok(!/"timestamp"/.test(j1.stdout));
        assert.ok(!/"asOf"/.test(j1.stdout));
      });

      await check('T23 validator did not modify input manifest bytes', () => {
        const after = readFileSync(manifestPath, 'utf-8');
        assert.strictEqual(after, manifestBefore);
      });
      await check('T23b validator did not modify input manifest mtime', () => {
        const stAfter = statSync(manifestPath);
        assert.strictEqual(stAfter.mtimeMs, manifestStBefore.mtimeMs);
      });
      await check('T24 validator did not modify fixture tree (bytes + mtime)', () => {
        const after = snapshotTree(repoRoot);
        // Filter out the manifest file we just wrote from the diff comparison —
        // we already asserted its stability above.
        const beforeMap = Object.fromEntries(treeBefore.map((f) => [f.rel, f]));
        const afterMap = Object.fromEntries(after.map((f) => [f.rel, f]));
        assert.deepStrictEqual(Object.keys(afterMap).sort(), Object.keys(beforeMap).sort());
        for (const rel of Object.keys(beforeMap)) {
          assert.strictEqual(afterMap[rel].bytes, beforeMap[rel].bytes, `bytes drift: ${rel}`);
          assert.strictEqual(afterMap[rel].mtimeMs, beforeMap[rel].mtimeMs, `mtime drift: ${rel}`);
        }
      });
      await check('T24 validator did not create any sidecar in fixture', () => {
        const invAfter = snapshotSidecarInventory(postsDir);
        assert.deepStrictEqual(invAfter, invBefore);
      });
    }

    // ── T6: missing candidate (coverage) → exit 1 ─────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't6-missing-cand-'));
      seedTwoMissingCandidates(repoRoot);
      // Only include the first candidate; second is missing coverage.
      const manifest = {
        schemaVersion: 1,
        records: [validManifestForTwoMissing().records[0]],
      };
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T6a missing candidate: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
      });
      await check('T6b missing candidate: coverage.missingCandidates lists the omitted post', () => {
        const obj = JSON.parse(r.stdout);
        assert.strictEqual(obj.summary.missingCandidateCount, 1);
        assert.deepStrictEqual(obj.coverage.missingCandidates, [
          'content/blogger/posts/20260302-second.md',
        ]);
      });
    }

    // ── T7: unknown candidate (coverage) → exit 1 ─────────────────────────
    // 加一個 sourcePath 對應到不存在（或非 candidate）的 .md，會被 bootstrap 之 shape 層
    // 標記 SOURCE_NOT_FOUND / SOURCE_NOT_CANDIDATE；同時 coverage 層把它列為 unknown。
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't7-unknown-cand-'));
      seedTwoMissingCandidates(repoRoot);
      const manifest = {
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
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T7a unknown candidate: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
      });
      await check('T7b unknown candidate: coverage.unknownCandidates lists the ghost post', () => {
        const obj = JSON.parse(r.stdout);
        assert.strictEqual(obj.summary.unknownCandidateCount, 1);
        assert.deepStrictEqual(obj.coverage.unknownCandidates, [
          'content/blogger/posts/20260303-ghost.md',
        ]);
      });
    }

    // Additional coverage variant: PRESENT_COMPLETE sidecar already exists →
    // manifest entry becomes "unknown_candidate" AND shape layer trips
    // SIDECAR_ALREADY_EXISTS. Belt-and-suspenders defense.
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't7c-existing-sidecar-'));
      const postsDir = seedTwoMissingCandidates(repoRoot);
      // Complete the first candidate's sidecar so it becomes PRESENT_COMPLETE.
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
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T7c existing sidecar → exit 1 (SIDECAR_ALREADY_EXISTS or coverage)', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        assert.ok(obj.summary.invalidCount > 0 || obj.summary.unknownCandidateCount > 0);
      });
    }

    // ── T8: duplicate sourcePath / slug → exit 1 ──────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't8-dup-source-'));
      seedTwoMissingCandidates(repoRoot);
      const manifest = {
        schemaVersion: 1,
        records: [
          validManifestForTwoMissing().records[0],
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/first-alt.html',
              publishedAt: '2026-03-01',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T8 duplicate sourcePath: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        const hasDupSource = obj.entries.some((e) => e.readiness === 'DUPLICATE_SOURCE');
        assert.ok(hasDupSource, `expected a DUPLICATE_SOURCE entry; got ${JSON.stringify(obj.entries.map((e) => e.readiness))}`);
      });
    }

    // ── T10: duplicate publishedUrl → exit 1 ──────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't10-dup-url-'));
      seedTwoMissingCandidates(repoRoot);
      // Both entries point at the same URL — should trip layer E even though
      // sourcePath and target sidecar are distinct.
      const manifest = {
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
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T10 duplicate publishedUrl: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        assert.strictEqual(obj.summary.duplicateUrlCount, 1);
        assert.strictEqual(obj.duplicateUrls[0].url, 'https://example.blogspot.com/2026/03/shared.html');
        assert.deepStrictEqual(obj.duplicateUrls[0].recordIndexes, [0, 1]);
      });
    }

    // ── T11: blank truth field → exit 1 ───────────────────────────────────
    // ── T12: whitespace-only truth field → exit 1 ─────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't11-12-blank-'));
      seedTwoMissingCandidates(repoRoot);
      const blankUrl = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: { publishedUrl: '', publishedAt: '2026-03-01' },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const p1 = writeManifest(repoRoot, blankUrl, 'blank-url.json');
      await check('T11a blank publishedUrl: exit 1 (via strict URL)', () => {
        const r = runCli(['--manifest', p1, '--json', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        const obj = JSON.parse(r.stdout);
        assert.ok(
          obj.errors.some((e) => /publishedUrl must be a? ?strict http/i.test(e)),
          `expected publishedUrl strict-http diagnostic; got ${JSON.stringify(obj.errors)}`,
        );
      });
      const blankAt = {
        schemaVersion: 1,
        records: [
          validManifestForTwoMissing().records[0],
          {
            sourcePath: 'content/blogger/posts/20260302-second.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/second.html',
              publishedAt: '',
            },
          },
        ],
      };
      const p2 = writeManifest(repoRoot, blankAt, 'blank-at.json');
      await check('T11b blank publishedAt: exit 1 (via strict ISO)', () => {
        const r = runCli(['--manifest', p2, '--json', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        const obj = JSON.parse(r.stdout);
        assert.ok(obj.errors.some((e) => /publishedAt is invalid/i.test(e)));
      });
      const wsUrl = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: '  https://example.blogspot.com/2026/03/first.html  ',
              publishedAt: '2026-03-01',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const p3 = writeManifest(repoRoot, wsUrl, 'ws-url.json');
      await check('T12a whitespace-padded publishedUrl: exit 1', () => {
        const r = runCli(['--manifest', p3, '--json', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        const obj = JSON.parse(r.stdout);
        assert.ok(
          obj.errors.some((e) => /publishedUrl must be a? ?strict http/i.test(e)),
          `expected publishedUrl strict-http diagnostic; got ${JSON.stringify(obj.errors)}`,
        );
      });
      const wsAt = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/first.html',
              publishedAt: ' 2026-03-01 ',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const p4 = writeManifest(repoRoot, wsAt, 'ws-at.json');
      await check('T12b whitespace-padded publishedAt: exit 1', () => {
        const r = runCli(['--manifest', p4, '--json', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        const obj = JSON.parse(r.stdout);
        assert.ok(obj.errors.some((e) => /publishedAt is invalid/i.test(e)));
      });
    }

    // ── T13: placeholder / sentinel → exit 1 ──────────────────────────────
    // 每個 sentinel（TODO / TBD / UNKNOWN / N/A / NA）與 case-insensitive 變體都 hard-fail。
    for (const sentinel of TRUTH_SENTINELS) {
      const repoRoot = mkdtempSync(path.join(tmpRoot, `t13-sentinel-${sentinel.replace(/[^a-z0-9]/gi, '')}-`));
      seedTwoMissingCandidates(repoRoot);
      // Case variation: alternate upper / lower so we exercise case-insensitive match.
      const flipped = sentinel
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join('');
      const manifest = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: `  ${flipped}  `,
              publishedAt: '2026-03-01',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const manifestPath = writeManifest(repoRoot, manifest, `sentinel-${sentinel.replace(/[^a-z0-9]/gi, '')}.json`);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check(`T13 sentinel ${JSON.stringify(sentinel)} in publishedUrl: exit 1 + sentinelHit reported`, () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        assert.ok(
          obj.summary.sentinelHitCount >= 1,
          `expected sentinel hit; sentinelHits=${JSON.stringify(obj.sentinelHits)}`,
        );
        const hit = obj.sentinelHits.find((h) => h.field === 'blogger.publishedUrl');
        assert.ok(hit, 'expected a publishedUrl sentinel hit');
        assert.strictEqual(hit.sentinel, sentinel);
      });
    }
    // Sentinel in publishedAt.
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't13-sentinel-at-'));
      seedTwoMissingCandidates(repoRoot);
      const manifest = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/first.html',
              publishedAt: 'TODO',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T13 sentinel in publishedAt: exit 1 + hit under publishedAt', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        const hit = obj.sentinelHits.find((h) => h.field === 'blogger.publishedAt');
        assert.ok(hit, `expected publishedAt sentinel hit; got ${JSON.stringify(obj.sentinelHits)}`);
        assert.strictEqual(hit.sentinel, 'TODO');
      });
    }

    // ── T15: invalid strict ISO publishedAt → exit 1 ──────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't15-non-iso-'));
      seedTwoMissingCandidates(repoRoot);
      // "2026-03-01 10:00" is Date-parseable via legacy V8 parser but not strict ISO
      // → deriveYearMonth returns empty → resolvePublishedAt fails with not-strict-iso.
      const manifest = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/03/first.html',
              publishedAt: '2026-03-01 10:00',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T15 non-strict-ISO publishedAt: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        assert.ok(obj.errors.some((e) => /publishedAt is invalid/i.test(e)));
      });
    }

    // ── T16: invalid calendar date → exit 1 ───────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't16-bad-date-'));
      seedTwoMissingCandidates(repoRoot);
      // 2026-02-30 doesn't exist.
      const manifest = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/02/first.html',
              publishedAt: '2026-02-30',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T16 invalid calendar date: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        assert.ok(obj.errors.some((e) => /publishedAt is invalid/i.test(e)));
      });
    }

    // ── T17: timezone / month boundary case → PASS when URL yyyy/mm matches
    // the offset-local month per §5.3.1 (derived from publishedAt string, not UTC).
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't17-tz-boundary-'));
      seedTwoMissingCandidates(repoRoot);
      // 2026-08-01T00:30:00+08:00 is 2026-08-01 local (offset), 2026-07-31 UTC.
      // deriveYearMonth uses string year/month → 2026-08 → URL must be /2026/08/.
      const manifest = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/08/first.html',
              publishedAt: '2026-08-01T00:30:00+08:00',
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
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T17 tz boundary with matching URL month: exit 0 (string year/month, not UTC)', () => {
        assert.strictEqual(r.status, 0, r.stderr + r.stdout);
        const obj = JSON.parse(r.stdout);
        assert.strictEqual(obj.summary.monthMismatchCount, 0);
      });
    }

    // ── T18: invalid publishedUrl → exit 1 ────────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't18-bad-url-'));
      seedTwoMissingCandidates(repoRoot);
      const manifest = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'javascript:alert(1)',
              publishedAt: '2026-03-01',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T18 non-http(s) publishedUrl: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        assert.ok(
          obj.errors.some((e) => /publishedUrl must be a? ?strict http/i.test(e)),
          `expected publishedUrl strict-http diagnostic; got ${JSON.stringify(obj.errors)}`,
        );
      });
    }

    // ── T19: URL /YYYY/MM/ ↔ publishedAt YYYY-MM month mismatch → exit 1 ──
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't19-month-mismatch-'));
      seedTwoMissingCandidates(repoRoot);
      const manifest = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/05/first.html',
              publishedAt: '2026-03-01',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T19 URL /YYYY/MM/ vs publishedAt YYYY-MM mismatch: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        assert.strictEqual(obj.summary.monthMismatchCount, 1);
        const mm = obj.monthMismatches[0];
        assert.strictEqual(mm.reason, 'url_month_mismatch');
        assert.deepStrictEqual(mm.urlYearMonth, { year: '2026', month: '05' });
        assert.deepStrictEqual(mm.publishedAtYearMonth, { year: '2026', month: '03' });
      });
    }
    // Missing yyyy/mm segment in URL (e.g., page-style URL used with post sourcePath)
    // should also be a cross-field failure.
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't19b-url-no-yyyymm-'));
      seedTwoMissingCandidates(repoRoot);
      const manifest = {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260301-first.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/p/first.html',
              publishedAt: '2026-03-01',
            },
          },
          validManifestForTwoMissing().records[1],
        ],
      };
      const manifestPath = writeManifest(repoRoot, manifest);
      const r = runCli(['--manifest', manifestPath, '--json', '--repo-root', repoRoot]);
      await check('T19b post URL missing /YYYY/MM/: exit 1', () => {
        assert.strictEqual(r.status, 1, r.stderr);
        const obj = JSON.parse(r.stdout);
        assert.strictEqual(obj.summary.monthMismatchCount, 1);
        assert.strictEqual(obj.monthMismatches[0].reason, 'url_missing_yyyy_mm');
      });
    }

    // ── T25: source-level static assertions (no network / no Blogger API) ─
    await check('T25a source: no fetch(', () => {
      assert.ok(!/\bfetch\s*\(/.test(CLI_SRC));
    });
    await check('T25b source: no node:http / node:https import', () => {
      assert.ok(!/from ['"]node:https?['"]/.test(CLI_SRC));
      assert.ok(!/require\(['"]node:https?['"]\)/.test(CLI_SRC));
    });
    await check('T25c source: no googleapis / blogger.googleapis / oauth', () => {
      assert.ok(!/googleapis|blogger\.googleapis|oauth/i.test(CLI_SRC));
    });
    await check('T25d source: no child_process / spawn / exec', () => {
      assert.ok(!/child_process/.test(CLI_SRC));
      assert.ok(!/spawnSync|execSync|execFileSync|spawn\(|exec\(/.test(CLI_SRC));
    });
    await check('T25e source: no fs mutation APIs (writeFile / mkdir / rm / rename / unlink / copyFile / appendFile)', () => {
      assert.ok(!/\bfs\.writeFile\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.appendFile\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.mkdir\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.rename\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.rm\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.unlink\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.copyFile\b/.test(CLI_SRC));
    });
    await check('T25f source: reuses bootstrap + planner + backfill-published-url modules directly (no CLI subprocess)', () => {
      assert.ok(/import\s*\{[^}]*loadManifest[^}]*planBootstrap[^}]*\}\s*from\s*['"]\.\/bootstrap-blogger-backfill-sidecars\.js['"]/.test(CLI_SRC));
      assert.ok(/import\s*\{[^}]*planMissingSidecars[^}]*\}\s*from\s*['"]\.\/plan-blogger-backfill-sidecars\.js['"]/.test(CLI_SRC));
      assert.ok(/import\s*\{[^}]*deriveYearMonth[^}]*\}\s*from\s*['"]\.\/backfill-published-url\.js['"]/.test(CLI_SRC));
    });

    // ── parseArgs smoke ───────────────────────────────────────────────────
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
      const o = parseArgs(['node', 'cli', '--apply', '--write', '--force', '--overwrite']);
      assert.ok(o.forbidden.includes('--apply'));
      assert.ok(o.forbidden.includes('--write'));
      assert.ok(o.forbidden.includes('--force'));
      assert.ok(o.forbidden.includes('--overwrite'));
    });
    await check('parseArgs: unknown flag captured', () => {
      const o = parseArgs(['node', 'cli', '--totally-fake']);
      assert.ok(o.unknown.includes('--totally-fake'));
    });

    // ── in-process API smoke: validateTruthManifest returns deterministic report on empty template ─
    // 這裡 exercise 直接 API 路徑（不透過 subprocess CLI），使 planBootstrap 之 error surface
    // 也能在 report 中看到；未填 template 之 shape 錯誤應被列在 errors。
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'api-empty-'));
      seedTwoMissingCandidates(repoRoot);
      // Produce the empty template from the sibling generator and hand it to the validator API.
      const p = runCli(['--manifest-only', '--repo-root', repoRoot], PREPARE_CLI);
      assert.strictEqual(p.status, 0, p.stderr);
      const manifestPath = path.join(repoRoot, 'template-empty.json');
      writeFileSync(manifestPath, p.stdout, 'utf-8');
      const report = await validateTruthManifest({ manifestPath, repoRoot });
      await check('API empty template → ok=false', () => {
        assert.strictEqual(report.ok, false);
        assert.ok(report.errors.length > 0);
      });
      await check('API empty template → coverage.coverageOk=true (paths match)', () => {
        assert.strictEqual(report.coverage.coverageOk, true);
        assert.strictEqual(report.summary.missingCandidateCount, 0);
        assert.strictEqual(report.summary.unknownCandidateCount, 0);
      });
      await check('API empty template → shape layer flags empty URL + empty publishedAt', () => {
        const hasUrlErr = report.errors.some((e) => /publishedUrl must be a? ?strict http/i.test(e));
        const hasAtErr = report.errors.some((e) => /publishedAt is invalid/i.test(e));
        assert.ok(hasUrlErr, `expected empty-URL diagnostic; got ${JSON.stringify(report.errors)}`);
        assert.ok(hasAtErr, `expected empty-publishedAt diagnostic; got ${JSON.stringify(report.errors)}`);
      });
      await check('API empty template → sentinelHitCount=0 (empty ≠ sentinel)', () => {
        assert.strictEqual(report.summary.sentinelHitCount, 0);
      });
      await check('API empty template → formatJson deterministic across two calls', () => {
        const a = formatJson(report);
        const b = formatJson(report);
        assert.strictEqual(a, b);
        // envelope shape
        const obj = JSON.parse(a);
        assert.strictEqual(obj.mode, 'validate');
        assert.strictEqual(obj.mutationPerformed, false);
      });
      await check('API empty template → formatHumanReadable ends with Overall: FAIL', () => {
        const h = formatHumanReadable(report);
        assert.ok(/Overall: FAIL/.test(h));
      });
    }
  } finally {
    try {
      rmSync(tmpRoot, { recursive: true, force: true });
    } catch (_) {
      /* ignore */
    }
  }

  // ── Production side-effect audit ────────────────────────────────────────
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
  await check('dist-blogger-preview/ absent under repo root', () => {
    assert.ok(!existsSync(path.join(REPO_ROOT, 'dist-blogger-preview')));
  });

  console.log('');
  console.log(`[check:blogger-backfill-truth-manifest-validator] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(
    `[check:blogger-backfill-truth-manifest-validator] UNEXPECTED ERROR: ${err.stack || err.message || err}`,
  );
  process.exit(1);
});
