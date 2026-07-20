#!/usr/bin/env node
// Phase 20260718：`prepare-blogger-backfill-truth-manifest` generator contract guard / tests。
//
// 範圍 / 邊界：
//   - 所有 fixture 斷言在 **OS temp 目錄** 之 synthetic content tree 上跑；**絕不**碰 production
//     content / dist / settings / gh-pages / deploy clone；temp 目錄於 finally{} 清除。
//   - 只 import 被測模組（prepare-blogger-backfill-truth-manifest.js）之唯讀 API + node 讀取 API；
//     CLI 邊界透過 subprocess 執行（read-only 於本 guard；只有 bootstrap writer integration 段
//     以 --apply 觸發 mutation，且僅在 OS temp fixture 內）。
//   - 不呼叫 Blogger / Google API；不需網路；不需 credential。
//   - 執行前後 production repo 之 `.publish.json` inventory + Blogger Markdown bytes 完全不變。
//
// 覆蓋（依 Session prompt §九 逐項對應）：
//   1. --help 成功且零 mutation
//   2. 預設 human-readable 模式零 mutation
//   3. --json 可解析
//   4. --manifest-only 之純 manifest 可解析
//   5. 未知參數 fail closed
//   6. 拒絕 --apply
//   7. 拒絕 --output
//   8. 拒絕 --write
//   9. 拒絕 --force
//  10. Source-level：不使用 network
//  11. Source-level：不使用 child_process 呼叫 planner
//  12. Source-level：直接 import planner structured result
//  13. Template 只包含 MISSING_SIDECAR
//  14. 排除 PRESENT_COMPLETE
//  15. 排除 templates（planner scan 天然不含 content/templates）
//  16. 排除 non-candidates（draft / status=draft / blogger.enabled=false）
//  17. 真實 repo template record set == 目前 MISSING_SIDECAR candidate set
//  18. 每筆 source path 唯一
//  19. 每筆 target sidecar path 唯一
//  20. Template 不包含 bloggerPostId
//  21. Template 不包含 guessed URL
//  22. Template 不包含 guessed date
//  23. Template 不包含 generated timestamp
//  24. Template 不包含 absolute machine path
//  25. JSON output deterministic across two runs
//  26. record ordering deterministic (sourcePath ascending)
//  27. key ordering deterministic (sourcePath before blogger; publishedUrl before publishedAt)
//  28. 未填 truth 之 template → bootstrap writer dry-run fail-closed
//  29. 未填 template 經 writer 處理時 mutationPerformed=false
//  30. Temp fixture 填入有效 truth 後 → writer dry-run READY
//  31. Temp fixture 明確 --apply 後 → 建立預期 sidecar
//  32. Apply 只寫 temp fixture（產物 = 剛好一個新檔）
//  33. 真實 Blogger Markdown bytes / mtime 不變
//  34. 真實 `.publish.json` inventory 不變
//  35. 真實 MISSING_SIDECAR candidate set 前後不變（含 `20260612-*` 子集）
//  36. dist-blogger-preview/ 不存在
//  37. Prepare CLI 不接受 --overwrite / --replace / --merge / --yes / -y / --fix / --out
//
// 執行：`npm run check:blogger-backfill-truth-manifest`
//       或 `node src/scripts/check-blogger-backfill-truth-manifest.js`

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
  buildTemplateRecord,
  deriveTemplate,
  formatHumanReadable,
  formatJson,
  formatManifestOnly,
  INCLUDED_SIDECAR_STATUSES,
  EXCLUDED_SIDECAR_STATUSES,
  MANIFEST_SCHEMA_VERSION,
  REQUIRED_TRUTH_FIELDS,
  TEMPLATE_BLOGGER_KEY_ORDER,
  TEMPLATE_RECORD_KEY_ORDER,
} from './prepare-blogger-backfill-truth-manifest.js';

import { planMissingSidecars } from './plan-blogger-backfill-sidecars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(REPO_ROOT, 'src', 'scripts', 'prepare-blogger-backfill-truth-manifest.js');
const CLI_SRC_RAW = readFileSync(CLI, 'utf-8');
// Strip // line comments and /* … */ block comments so source-level bans do not
// false-positive on docblock text that intentionally names what the script does NOT do.
// The generator has no template literals containing "//" that we care about.
function stripComments(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
  return noBlock
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}
const CLI_SRC = stripComments(CLI_SRC_RAW);

const BOOTSTRAP_CLI = path.join(
  REPO_ROOT,
  'src',
  'scripts',
  'bootstrap-blogger-backfill-sidecars.js',
);

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
    'body — generator must not read this.',
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

// Seed a fixture repo with a variety of shapes:
//   alpha  — MISSING_SIDECAR + candidate  → included
//   bravo  — PRESENT_COMPLETE             → excluded (existing)
//   charlie — draft:true                  → excluded (non-candidate)
//   delta  — blogger.enabled:false        → excluded (non-candidate)
//   echo   — status:draft + draft:true    → excluded (non-candidate)
//   foxtrot — MISSING_SIDECAR + candidate → included (test deterministic ordering)
//   golf   — PRESENT_INCOMPLETE           → excluded (existing incomplete)
function seedRichFixture(repoRoot) {
  const postsDir = path.join(repoRoot, 'content', 'blogger', 'posts');
  writeFileSyncMk(
    path.join(postsDir, '20260201-alpha.md'),
    fmMd({ id: '20260201-alpha', slug: 'alpha' }),
  );

  writeFileSyncMk(
    path.join(postsDir, '20260202-bravo.md'),
    fmMd({ id: '20260202-bravo', slug: 'bravo' }),
  );
  writeFileSyncMk(
    path.join(postsDir, '20260202-bravo.publish.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        blogger: {
          type: 'post',
          permalink: 'bravo',
          status: 'published',
          publishedUrl: 'https://example.blogspot.com/2026/02/bravo.html',
          publishedAt: '2026-02-02',
          bloggerPostId: '',
        },
      },
      null,
      2,
    ) + '\n',
  );

  writeFileSyncMk(
    path.join(postsDir, '20260203-charlie.md'),
    fmMd({ id: '20260203-charlie', slug: 'charlie', draft: true }),
  );

  writeFileSyncMk(
    path.join(postsDir, '20260204-delta.md'),
    fmMd({ id: '20260204-delta', slug: 'delta', bloggerEnabled: 'false' }),
  );

  writeFileSyncMk(
    path.join(postsDir, '20260205-echo.md'),
    fmMd({ id: '20260205-echo', slug: 'echo', status: 'draft', draft: true }),
  );

  writeFileSyncMk(
    path.join(postsDir, '20260206-foxtrot.md'),
    fmMd({ id: '20260206-foxtrot', slug: 'foxtrot' }),
  );

  writeFileSyncMk(
    path.join(postsDir, '20260207-golf.md'),
    fmMd({ id: '20260207-golf', slug: 'golf' }),
  );
  writeFileSyncMk(
    path.join(postsDir, '20260207-golf.publish.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        blogger: {
          type: 'post',
          permalink: 'golf',
          status: 'draft',
          publishedUrl: '',
          publishedAt: '',
          bloggerPostId: '',
        },
      },
      null,
      2,
    ) + '\n',
  );
  return postsDir;
}

// ── main ────────────────────────────────────────────────────────────────────

// Repo-wide MISSING_SIDECAR candidate paths, derived from the planner itself.
// Never hardcode this count: it drops by one each time a backfill sidecar lands,
// so any fixed number goes stale the moment a real apply succeeds.
function missingSidecarPaths(plan) {
  return plan.candidates
    .filter((c) => c.sidecarStatus === 'MISSING_SIDECAR')
    .map((c) => c.sourcePath)
    .sort();
}

async function main() {
  // ── Real-repo baseline snapshots ─────────────────────────────────────────
  const prodPostsDir = path.join(REPO_ROOT, 'content', 'blogger', 'posts');
  const prodInvBefore = snapshotSidecarInventory(prodPostsDir);
  const prodMdBefore = snapshotMarkdownBytes(prodPostsDir);

  const prodPlanBefore = await planMissingSidecars({ repoRoot: REPO_ROOT });
  const missing2026_0612Before = prodPlanBefore.candidates
    .filter((c) => c.sourcePath.includes('/20260612-'))
    .filter((c) => c.sidecarStatus === 'MISSING_SIDECAR')
    .map((c) => c.sourcePath)
    .sort();
  const missingAllBefore = missingSidecarPaths(prodPlanBefore);
  const presentCompleteBefore = prodPlanBefore.candidates
    .filter((c) => c.sidecarStatus === 'PRESENT_COMPLETE')
    .map((c) => c.sourcePath)
    .sort();

  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'prepare-truth-manifest-'));
  try {
    // ── T1: --help exit 0, no mutation, mentions no-write clause ───────────
    {
      const before = snapshotTree(tmpRoot);
      const r = runCli(['--help']);
      await check('T1a --help: exit 0', () => {
        assert.strictEqual(r.status, 0);
      });
      await check('T1b --help: mentions "NEVER creates" or "never writes"', () => {
        assert.ok(
          /NEVER creates|never writes|read-only/i.test(r.stdout),
          `help missing no-write clause: ${r.stdout.slice(0, 200)}`,
        );
      });
      await check('T1c --help: mentions --manifest-only mode', () => {
        assert.ok(/--manifest-only/.test(r.stdout));
      });
      const after = snapshotTree(tmpRoot);
      await check('T1d --help: fixture root unchanged', () => {
        assert.deepStrictEqual(after, before);
      });
    }

    // ── T2: default human-readable exits 0 with zero mutation ──────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't2-default-'));
      const postsDir = seedRichFixture(repoRoot);
      const treeBefore = snapshotTree(postsDir);
      const invBefore = snapshotSidecarInventory(postsDir);
      const r = runCli(['--repo-root', repoRoot]);
      await check('T2a default mode: exit 0', () => {
        assert.strictEqual(r.status, 0, r.stderr);
      });
      await check('T2b default mode: stdout says "Mutation performed: NO"', () => {
        assert.ok(/Mutation performed:\s+NO/.test(r.stdout));
      });
      await check('T2c default mode: stdout summarises Template record count = 2', () => {
        assert.ok(/Template record count:\s+2/.test(r.stdout));
      });
      const treeAfter = snapshotTree(postsDir);
      const invAfter = snapshotSidecarInventory(postsDir);
      await check('T2d default mode: fixture tree unchanged', () => {
        assert.deepStrictEqual(treeAfter, treeBefore);
      });
      await check('T2e default mode: sidecar inventory unchanged', () => {
        assert.deepStrictEqual(invAfter, invBefore);
      });
    }

    // ── T3: --json parseable + envelope shape ───────────────────────────────
    // ── T4: --manifest-only parseable + pure manifest shape ────────────────
    // ── T25: --json output deterministic across two runs ──────────────────
    // ── T26: record ordering deterministic (sourcePath ascending) ─────────
    // ── T27: key ordering deterministic ──────────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't3-json-'));
      const postsDir = seedRichFixture(repoRoot);
      const invBefore = snapshotSidecarInventory(postsDir);

      const r1 = runCli(['--json', '--repo-root', repoRoot]);
      const r2 = runCli(['--json', '--repo-root', repoRoot]);
      await check('T3a --json: exit 0', () => {
        assert.strictEqual(r1.status, 0, r1.stderr);
      });
      await check('T3b --json: stdout parseable', () => {
        JSON.parse(r1.stdout);
      });
      await check('T3c --json envelope: mutationPerformed=false', () => {
        const j = JSON.parse(r1.stdout);
        assert.strictEqual(j.mutationPerformed, false);
      });
      await check('T3d --json envelope: schemaVersion=1 + mode="prepare"', () => {
        const j = JSON.parse(r1.stdout);
        assert.strictEqual(j.schemaVersion, MANIFEST_SCHEMA_VERSION);
        assert.strictEqual(j.mode, 'prepare');
      });
      await check('T3e --json envelope: contains manifest + summary + excluded', () => {
        const j = JSON.parse(r1.stdout);
        assert.ok(j.manifest);
        assert.ok(j.summary);
        assert.ok(Array.isArray(j.excluded));
      });
      await check('T25 --json: deterministic across two dry-runs', () => {
        assert.strictEqual(r1.stdout, r2.stdout);
      });
      await check('T26 --json: records sorted by sourcePath ascending', () => {
        const j = JSON.parse(r1.stdout);
        const paths = j.manifest.records.map((r) => r.sourcePath);
        assert.deepStrictEqual(paths, [...paths].sort());
      });
      await check('T27a --json: record key order = sourcePath, blogger', () => {
        const j = JSON.parse(r1.stdout);
        for (const rec of j.manifest.records) {
          assert.deepStrictEqual(Object.keys(rec), TEMPLATE_RECORD_KEY_ORDER);
        }
      });
      await check('T27b --json: blogger key order = publishedUrl, publishedAt', () => {
        const j = JSON.parse(r1.stdout);
        for (const rec of j.manifest.records) {
          assert.deepStrictEqual(Object.keys(rec.blogger), TEMPLATE_BLOGGER_KEY_ORDER);
        }
      });

      // T4 --manifest-only
      const r3 = runCli(['--manifest-only', '--repo-root', repoRoot]);
      const r4 = runCli(['--manifest-only', '--repo-root', repoRoot]);
      await check('T4a --manifest-only: exit 0', () => {
        assert.strictEqual(r3.status, 0, r3.stderr);
      });
      await check('T4b --manifest-only: stdout parseable', () => {
        JSON.parse(r3.stdout);
      });
      await check('T4c --manifest-only: top-level keys = schemaVersion + records', () => {
        const j = JSON.parse(r3.stdout);
        assert.deepStrictEqual(Object.keys(j).sort(), ['records', 'schemaVersion']);
        assert.strictEqual(j.schemaVersion, MANIFEST_SCHEMA_VERSION);
      });
      await check('T4d --manifest-only: deterministic across two runs', () => {
        assert.strictEqual(r3.stdout, r4.stdout);
      });

      // T5: fixture unchanged after all 4 CLI calls
      const invAfter = snapshotSidecarInventory(postsDir);
      await check('T3f fixture sidecars unchanged after --json runs', () => {
        assert.deepStrictEqual(invAfter, invBefore);
      });

      // T20-23 in fixture context
      await check('T20 fixture: no record contains bloggerPostId key', () => {
        const j = JSON.parse(r3.stdout);
        for (const rec of j.records) {
          assert.strictEqual(Object.prototype.hasOwnProperty.call(rec.blogger, 'bloggerPostId'), false);
        }
        assert.ok(!/bloggerPostId/.test(r3.stdout), 'manifest-only stdout must not mention bloggerPostId');
      });
      await check('T21 fixture: no record contains a URL value (all empty strings)', () => {
        const j = JSON.parse(r3.stdout);
        for (const rec of j.records) {
          assert.strictEqual(rec.blogger.publishedUrl, '');
        }
        // The literal https://example URLs used in the seeded PRESENT_COMPLETE bravo sidecar
        // must not leak into the emitted manifest (bravo is excluded).
        assert.ok(!/https?:\/\//.test(r3.stdout));
      });
      await check('T22 fixture: no record contains a date value (all empty strings)', () => {
        const j = JSON.parse(r3.stdout);
        for (const rec of j.records) {
          assert.strictEqual(rec.blogger.publishedAt, '');
        }
        assert.ok(!/\d{4}-\d{2}-\d{2}/.test(r3.stdout));
      });
      await check('T23 fixture: no timestamp / generatedAt / asOf in JSON envelope', () => {
        assert.ok(!/"generatedAt"/.test(r1.stdout));
        assert.ok(!/"timestamp"/.test(r1.stdout));
        assert.ok(!/"asOf"/.test(r1.stdout));
      });
      await check('T24 fixture: no fixture root leaked into --json output', () => {
        const posix = repoRoot.split(path.sep).join('/');
        assert.ok(!r1.stdout.includes(posix), `fixture root leaked (posix): ${posix}`);
        assert.ok(!r1.stdout.includes(repoRoot), `fixture root leaked (native): ${repoRoot}`);
      });
    }

    // ── T13-16: filter correctness in fixture ─────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 't13-filter-'));
      seedRichFixture(repoRoot);
      // Also seed a "templates/" dir which should never be scanned by planner (scan root is content/blogger/posts).
      writeFileSyncMk(
        path.join(repoRoot, 'content', 'templates', '_sample.md'),
        fmMd({ id: '_sample', slug: '_sample' }),
      );
      const r = runCli(['--manifest-only', '--repo-root', repoRoot]);
      const j = JSON.parse(r.stdout);
      const paths = j.records.map((rec) => rec.sourcePath);
      await check('T13 template: only MISSING_SIDECAR candidates (alpha, foxtrot)', () => {
        assert.deepStrictEqual(paths, [
          'content/blogger/posts/20260201-alpha.md',
          'content/blogger/posts/20260206-foxtrot.md',
        ]);
      });
      await check('T14 template: excludes PRESENT_COMPLETE (bravo)', () => {
        assert.ok(!paths.some((p) => p.includes('bravo')));
      });
      await check('T14b template: excludes PRESENT_INCOMPLETE (golf)', () => {
        assert.ok(!paths.some((p) => p.includes('golf')));
      });
      await check('T15 template: excludes templates/ tree', () => {
        assert.ok(!paths.some((p) => p.includes('/templates/')));
      });
      await check('T16 template: excludes non-candidates (charlie, delta, echo)', () => {
        assert.ok(!paths.some((p) => p.includes('charlie')));
        assert.ok(!paths.some((p) => p.includes('delta')));
        assert.ok(!paths.some((p) => p.includes('echo')));
      });
    }

    // ── SELECTED COVERAGE (Phase 20260720) ────────────────────────────────
    // seedRichFixture exposes exactly two MISSING_SIDECAR candidates: alpha, foxtrot.
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'selected-'));
      const postsDir = seedRichFixture(repoRoot);
      const invBefore = snapshotSidecarInventory(postsDir);
      const ALPHA = 'content/blogger/posts/20260201-alpha.md';
      const FOX = 'content/blogger/posts/20260206-foxtrot.md';

      // Full mode (no --source-path) still emits NO coverage field.
      await check('SEL full mode: manifest-only has no coverage field', () => {
        const r = runCli(['--manifest-only', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 0, r.stderr);
        const j = JSON.parse(r.stdout);
        assert.strictEqual(Object.prototype.hasOwnProperty.call(j, 'coverage'), false);
        assert.deepStrictEqual(Object.keys(j).sort(), ['records', 'schemaVersion']);
        assert.strictEqual(j.records.length, 2);
      });

      // Selected mode: one path → coverage block + single record.
      await check('SEL one path: coverage block + 1 record + unselected foxtrot', () => {
        const r = runCli(['--manifest-only', '--source-path', ALPHA, '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 0, r.stderr);
        const j = JSON.parse(r.stdout);
        assert.deepStrictEqual(Object.keys(j), ['schemaVersion', 'coverage', 'records']);
        assert.strictEqual(j.coverage.mode, 'selected');
        assert.deepStrictEqual(j.coverage.selectedSourcePaths, [ALPHA]);
        assert.strictEqual(j.records.length, 1);
        assert.strictEqual(j.records[0].sourcePath, ALPHA);
        // records carry only empty truth (no guessed URL/date/bloggerPostId).
        assert.strictEqual(j.records[0].blogger.publishedUrl, '');
        assert.strictEqual(j.records[0].blogger.publishedAt, '');
        assert.ok(!/bloggerPostId/.test(r.stdout));
      });

      // Selected mode: both paths → 2 records, records === selection.
      await check('SEL both paths: 2 records match selection, no unselected', () => {
        const r = runCli(['--manifest-only', '--source-path', ALPHA, '--source-path', FOX, '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 0, r.stderr);
        const j = JSON.parse(r.stdout);
        assert.deepStrictEqual(j.coverage.selectedSourcePaths, [ALPHA, FOX]);
        assert.deepStrictEqual(j.records.map((rec) => rec.sourcePath).sort(), [ALPHA, FOX]);
      });

      // Selected mode human output lists unselected candidate.
      await check('SEL human output: coverage mode + unselected section', () => {
        const r = runCli(['--source-path', ALPHA, '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 0, r.stderr);
        assert.ok(/Coverage mode:\s+selected/.test(r.stdout));
        assert.ok(/unselected MISSING_SIDECAR candidates/i.test(r.stdout));
        assert.ok(r.stdout.includes(FOX), 'unselected foxtrot must be listed');
      });

      // Deterministic across two runs.
      await check('SEL deterministic across two runs', () => {
        const a = runCli(['--manifest-only', '--source-path', FOX, '--source-path', ALPHA, '--repo-root', repoRoot]);
        const b = runCli(['--manifest-only', '--source-path', FOX, '--source-path', ALPHA, '--repo-root', repoRoot]);
        assert.strictEqual(a.stdout, b.stdout);
        // Order-independent selection: selectedSourcePaths is always sorted.
        const j = JSON.parse(a.stdout);
        assert.deepStrictEqual(j.coverage.selectedSourcePaths, [ALPHA, FOX]);
      });

      // Hard-fails: duplicate / unknown / non-candidate (draft) / already-sidecar.
      await check('SEL duplicate --source-path: exit 1, no output', () => {
        const r = runCli(['--manifest-only', '--source-path', ALPHA, '--source-path', ALPHA, '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/duplicate --source-path/i.test(r.stderr));
        assert.strictEqual(r.stdout, '');
      });
      await check('SEL unknown path: exit 1', () => {
        const r = runCli(['--manifest-only', '--source-path', 'content/blogger/posts/20260299-ghost.md', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/not a current MISSING_SIDECAR candidate/i.test(r.stderr));
        assert.strictEqual(r.stdout, '');
      });
      await check('SEL non-candidate (draft charlie): exit 1', () => {
        const r = runCli(['--manifest-only', '--source-path', 'content/blogger/posts/20260203-charlie.md', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/not a current MISSING_SIDECAR candidate/i.test(r.stderr));
      });
      await check('SEL already-sidecar (PRESENT_COMPLETE bravo): exit 1', () => {
        const r = runCli(['--manifest-only', '--source-path', 'content/blogger/posts/20260202-bravo.md', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/not a current MISSING_SIDECAR candidate/i.test(r.stderr));
      });
      await check('SEL bad shape (outside prefix): exit 1', () => {
        const r = runCli(['--manifest-only', '--source-path', 'content/github/posts/x.md', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/must be within content\/blogger\/posts\//i.test(r.stderr));
      });
      await check('SEL .fb.md rejected: exit 1', () => {
        const r = runCli(['--manifest-only', '--source-path', 'content/blogger/posts/20260201-alpha.fb.md', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/\.fb\.md/i.test(r.stderr));
      });
      await check('SEL no --all / --yes selection bypass exists (still forbidden)', () => {
        const rAll = runCli(['--manifest-only', '--all', '--repo-root', repoRoot]);
        assert.strictEqual(rAll.status, 1);
        const rYes = runCli(['--manifest-only', '--yes', '--repo-root', repoRoot]);
        assert.strictEqual(rYes.status, 1);
      });

      await check('SEL selected-mode runs created no sidecar in fixture', () => {
        const invAfter = snapshotSidecarInventory(postsDir);
        assert.deepStrictEqual(invAfter, invBefore);
      });
    }

    // ── parseArgs: --source-path repeatable ───────────────────────────────
    await check('parseArgs: --source-path repeatable + selectionRequested', () => {
      const o = parseArgs(['node', 'cli', '--source-path', 'a', '--source-path=b']);
      assert.strictEqual(o.selectionRequested, true);
      assert.deepStrictEqual(o.sourcePaths, ['a', 'b']);
    });
    await check('parseArgs: no --source-path → selectionRequested false', () => {
      const o = parseArgs(['node', 'cli', '--manifest-only']);
      assert.strictEqual(o.selectionRequested, false);
      assert.deepStrictEqual(o.sourcePaths, []);
    });

    // ── T5, T6-T9, T37: forbidden and unknown flags ─────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'forbidden-'));
      seedRichFixture(repoRoot);
      const before = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));

      await check('T5 unknown flag: exit 1 (fail closed)', () => {
        const r = runCli(['--totally-fake', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/unknown argument/i.test(r.stderr));
      });
      for (const flag of [
        '--apply',
        '--output',
        '--write',
        '--force',
        '--overwrite',
        '--replace',
        '--merge',
        '--yes',
        '-y',
        '--fix',
        '--out',
      ]) {
        await check(`T6-9/37 forbidden flag ${flag}: exit 1 + stderr mentions forbidden`, () => {
          const r = runCli([flag, '--repo-root', repoRoot]);
          assert.strictEqual(r.status, 1, `flag=${flag} unexpected exit ${r.status}: ${r.stdout}${r.stderr}`);
          assert.ok(/forbidden flag/i.test(r.stderr), `flag=${flag} stderr: ${r.stderr}`);
        });
      }
      await check('T6-9/37 forbidden also via --flag=value form (e.g. --apply=1)', () => {
        const r = runCli(['--apply=1', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/forbidden flag/i.test(r.stderr));
      });
      await check('forbidden runs did not create any sidecar in fixture', () => {
        const after = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
        assert.deepStrictEqual(after, before);
      });
      await check('mutually exclusive --json + --manifest-only: exit 1', () => {
        const r = runCli(['--json', '--manifest-only', '--repo-root', repoRoot]);
        assert.strictEqual(r.status, 1);
        assert.ok(/mutually exclusive/i.test(r.stderr));
      });
    }

    // ── T10-12: source-level static assertions ─────────────────────────────
    await check('T10a source: no fetch(', () => {
      assert.ok(!/\bfetch\s*\(/.test(CLI_SRC));
    });
    await check('T10b source: no node:http / node:https import', () => {
      assert.ok(!/from ['"]node:https?['"]/.test(CLI_SRC));
      assert.ok(!/require\(['"]node:https?['"]\)/.test(CLI_SRC));
    });
    await check('T10c source: no googleapis / blogger.googleapis / oauth mention', () => {
      assert.ok(!/googleapis|blogger\.googleapis|oauth/i.test(CLI_SRC));
    });
    await check('T11 source: no child_process / spawn / exec', () => {
      assert.ok(!/child_process/.test(CLI_SRC));
      assert.ok(!/spawnSync|execSync|execFileSync|spawn\(|exec\(/.test(CLI_SRC));
    });
    await check('T12 source: imports planMissingSidecars directly (structured reuse)', () => {
      assert.ok(/import\s*\{[^}]*planMissingSidecars[^}]*\}\s*from\s*['"]\.\/plan-blogger-backfill-sidecars\.js['"]/.test(CLI_SRC));
    });
    await check('source: generator does not import writer or write APIs', () => {
      assert.ok(!/\bfs\.writeFile\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.appendFile\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.mkdir\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.rename\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.rm\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.unlink\b/.test(CLI_SRC));
      assert.ok(!/\bfs\.copyFile\b/.test(CLI_SRC));
    });
    await check('source: enums exported (INCLUDED / EXCLUDED sidecar statuses)', () => {
      assert.ok(INCLUDED_SIDECAR_STATUSES.has('MISSING_SIDECAR'));
      assert.strictEqual(INCLUDED_SIDECAR_STATUSES.size, 1);
      assert.ok(EXCLUDED_SIDECAR_STATUSES.has('PRESENT_COMPLETE'));
      assert.ok(EXCLUDED_SIDECAR_STATUSES.has('PRESENT_INCOMPLETE'));
      assert.ok(EXCLUDED_SIDECAR_STATUSES.has('INVALID_SIDECAR'));
    });
    await check('source: REQUIRED_TRUTH_FIELDS matches human-supplied truth (no bloggerPostId)', () => {
      assert.deepStrictEqual(REQUIRED_TRUTH_FIELDS, ['blogger.publishedUrl', 'blogger.publishedAt']);
    });

    // ── T17-19: real-repo template contents ────────────────────────────────
    {
      const r = runCli(['--manifest-only']);
      await check('T17a real-repo --manifest-only: exit 0', () => {
        assert.strictEqual(r.status, 0, r.stderr);
      });
      const j = JSON.parse(r.stdout);
      await check('T17b real-repo template record count matches missing-sidecar inventory', () => {
        assert.strictEqual(j.records.length, missingAllBefore.length);
      });
      const paths = j.records.map((rec) => rec.sourcePath);
      await check('T17b2 real-repo template record set == missing-sidecar candidate set', () => {
        assert.deepStrictEqual([...paths].sort(), missingAllBefore);
      });
      await check('T17b3 real-repo template excludes already-landed sidecars', () => {
        assert.ok(
          presentCompleteBefore.length > 0,
          'expected at least one PRESENT_COMPLETE post so this exclusion is not vacuous',
        );
        for (const src of presentCompleteBefore) {
          assert.ok(!paths.includes(src), `PRESENT_COMPLETE ${src} must not appear in template`);
        }
      });
      await check('T17c real-repo template records: every 20260612-* missing candidate', () => {
        for (const src of missing2026_0612Before) {
          assert.ok(paths.includes(src), `expected ${src} in template`);
        }
      });
      await check('T18 real-repo template: source paths unique', () => {
        assert.strictEqual(new Set(paths).size, paths.length);
      });
      await check('T19 real-repo template: target sidecar paths unique', () => {
        const targets = paths.map((p) => p.replace(/\.md$/, '.publish.json'));
        assert.strictEqual(new Set(targets).size, targets.length);
      });
      await check('real-repo template: schemaVersion=1 + record shape matches writer', () => {
        assert.strictEqual(j.schemaVersion, MANIFEST_SCHEMA_VERSION);
        for (const rec of j.records) {
          assert.deepStrictEqual(Object.keys(rec), TEMPLATE_RECORD_KEY_ORDER);
          assert.deepStrictEqual(Object.keys(rec.blogger), TEMPLATE_BLOGGER_KEY_ORDER);
          assert.strictEqual(rec.blogger.publishedUrl, '');
          assert.strictEqual(rec.blogger.publishedAt, '');
        }
      });
      await check('real-repo template: no bloggerPostId anywhere in output', () => {
        assert.ok(!/bloggerPostId/.test(r.stdout));
      });
      await check('real-repo template: no https:// URLs (no guessed truth)', () => {
        assert.ok(!/https?:\/\//.test(r.stdout));
      });
      await check('real-repo template: no dates (no guessed publishedAt)', () => {
        assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(r.stdout));
      });
    }

    // ── T28-32: integration with bootstrap writer ─────────────────────────
    {
      // Build a synthetic fixture with two MISSING_SIDECAR candidates matching the
      // template shape; verify writer dry-run fail-close on empty template, then
      // populate and verify dry-run READY, then --apply and verify sidecar creation
      // only within the temp fixture.
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'integration-'));
      const postsDir = path.join(repoRoot, 'content', 'blogger', 'posts');
      writeFileSyncMk(
        path.join(postsDir, '20260301-first.md'),
        fmMd({ id: '20260301-first', slug: 'first' }),
      );
      writeFileSyncMk(
        path.join(postsDir, '20260302-second.md'),
        fmMd({ id: '20260302-second', slug: 'second' }),
      );
      const invBefore = snapshotSidecarInventory(postsDir);
      const mdBefore = snapshotMarkdownBytes(postsDir);

      // Step 1: prepare template
      const prepared = runCli(['--manifest-only', '--repo-root', repoRoot]);
      assert.strictEqual(prepared.status, 0, prepared.stderr);
      const emptyManifestPath = path.join(repoRoot, 'template-empty.json');
      writeFileSync(emptyManifestPath, prepared.stdout, 'utf-8');

      // Step 2: feed empty template to writer dry-run — must fail closed
      const drynRunEmpty = runCli(
        ['--input', emptyManifestPath, '--json', '--repo-root', repoRoot],
        BOOTSTRAP_CLI,
      );
      await check('T28 empty template → writer dry-run exit 1 (fail closed)', () => {
        assert.strictEqual(drynRunEmpty.status, 1, drynRunEmpty.stderr);
      });
      await check('T28b empty template → writer flags publishedUrl / publishedAt as INVALID_RECORD', () => {
        const j = JSON.parse(drynRunEmpty.stdout);
        assert.strictEqual(j.summary.byReadiness.INVALID_RECORD, 2);
        assert.ok(
          j.entries.every((e) =>
            e.reasons.some((r) => /publishedUrl/i.test(r)) &&
              e.reasons.some((r) => /publishedAt/i.test(r)),
          ),
        );
      });
      await check('T29 empty template → mutationPerformed=false', () => {
        const j = JSON.parse(drynRunEmpty.stdout);
        assert.strictEqual(j.mutationPerformed, false);
      });
      await check('T29b empty template dry-run: no sidecar created', () => {
        const invAfter = snapshotSidecarInventory(postsDir);
        assert.deepStrictEqual(invAfter, invBefore);
      });

      // Step 3: populate truth values in a copy of the template
      const populated = JSON.parse(prepared.stdout);
      populated.records[0].blogger.publishedUrl = 'https://example.blogspot.com/2026/03/first.html';
      populated.records[0].blogger.publishedAt = '2026-03-01';
      populated.records[1].blogger.publishedUrl = 'https://example.blogspot.com/2026/03/second.html';
      populated.records[1].blogger.publishedAt = '2026-03-02';
      const filledManifestPath = path.join(repoRoot, 'template-filled.json');
      writeFileSync(filledManifestPath, JSON.stringify(populated, null, 2) + '\n', 'utf-8');

      // Step 4: writer dry-run on populated manifest — must be READY (exit 0, all READY_FOR_WRITE)
      const dryRunFilled = runCli(
        ['--input', filledManifestPath, '--json', '--repo-root', repoRoot],
        BOOTSTRAP_CLI,
      );
      await check('T30 populated template → writer dry-run exit 0 (all READY_FOR_WRITE)', () => {
        assert.strictEqual(dryRunFilled.status, 0, dryRunFilled.stderr);
        const j = JSON.parse(dryRunFilled.stdout);
        assert.strictEqual(j.summary.byReadiness.READY_FOR_WRITE, 2);
        assert.strictEqual(j.mutationPerformed, false);
      });
      await check('T30b populated dry-run: still no sidecar written', () => {
        const invAfter = snapshotSidecarInventory(postsDir);
        assert.deepStrictEqual(invAfter, invBefore);
      });

      // Step 5: writer --apply on populated manifest, only against temp fixture
      const applied = runCli(
        ['--input', filledManifestPath, '--apply', '--json', '--repo-root', repoRoot],
        BOOTSTRAP_CLI,
      );
      await check('T31 populated template + --apply → exit 0 + 2 created', () => {
        assert.strictEqual(applied.status, 0, applied.stderr);
        const j = JSON.parse(applied.stdout);
        assert.strictEqual(j.mutationPerformed, true);
        assert.deepStrictEqual(
          [...j.apply.created].sort(),
          [
            'content/blogger/posts/20260301-first.publish.json',
            'content/blogger/posts/20260302-second.publish.json',
          ].sort(),
        );
      });
      await check('T32a apply: exactly two new sidecars appeared in fixture', () => {
        const invAfter = snapshotSidecarInventory(postsDir);
        const beforeSet = new Set(invBefore.map((s) => s.rel));
        const afterSet = new Set(invAfter.map((s) => s.rel));
        const added = [...afterSet].filter((rel) => !beforeSet.has(rel));
        assert.deepStrictEqual(added.sort(), [
          '20260301-first.publish.json',
          '20260302-second.publish.json',
        ]);
      });
      await check('T32b apply: Markdown bytes unchanged in fixture', () => {
        const mdAfter = snapshotMarkdownBytes(postsDir);
        const beforeMap = Object.fromEntries(mdBefore.map((s) => [s.rel, s.bytes]));
        const afterMap = Object.fromEntries(mdAfter.map((s) => [s.rel, s.bytes]));
        assert.deepStrictEqual(afterMap, beforeMap);
      });
      await check('T32c apply: no .tmp left behind in fixture posts dir', () => {
        for (const name of readdirSync(postsDir)) {
          assert.ok(!name.endsWith('.tmp'), `leftover tmp: ${name}`);
        }
      });
      await check('T32d apply: new sidecar contains supplied truth + empty bloggerPostId', () => {
        const first = JSON.parse(readFileSync(path.join(postsDir, '20260301-first.publish.json'), 'utf-8'));
        assert.strictEqual(first.blogger.publishedUrl, 'https://example.blogspot.com/2026/03/first.html');
        assert.strictEqual(first.blogger.publishedAt, '2026-03-01');
        assert.strictEqual(first.blogger.bloggerPostId, '');
      });
    }

    // ── deriveTemplate / buildTemplateRecord smoke ────────────────────────
    await check('API: buildTemplateRecord yields exact writer-compatible shape', () => {
      const rec = buildTemplateRecord('content/blogger/posts/x.md');
      assert.deepStrictEqual(Object.keys(rec), TEMPLATE_RECORD_KEY_ORDER);
      assert.deepStrictEqual(Object.keys(rec.blogger), TEMPLATE_BLOGGER_KEY_ORDER);
      assert.strictEqual(rec.blogger.publishedUrl, '');
      assert.strictEqual(rec.blogger.publishedAt, '');
    });
    await check('API: deriveTemplate on empty planner result → 0 records + 0 excluded', () => {
      const t = deriveTemplate({
        scanned: 0,
        candidateCount: 0,
        summary: { sidecarStatus: { MISSING_SIDECAR: 0 } },
        candidates: [],
        invalidSources: [],
      });
      assert.strictEqual(t.manifest.records.length, 0);
      assert.strictEqual(t.excluded.length, 0);
      assert.strictEqual(t.summary.templateRecordCount, 0);
    });
    await check('API: formatManifestOnly produces JSON with schemaVersion + records only', () => {
      const t = deriveTemplate({
        scanned: 0,
        candidateCount: 0,
        summary: { sidecarStatus: { MISSING_SIDECAR: 0 } },
        candidates: [],
        invalidSources: [],
      });
      const s = formatManifestOnly({ template: t });
      const j = JSON.parse(s);
      assert.deepStrictEqual(Object.keys(j).sort(), ['records', 'schemaVersion']);
    });
    await check('API: formatJson includes summary + manifest + excluded + mutationPerformed=false', () => {
      const t = deriveTemplate({
        scanned: 0,
        candidateCount: 0,
        summary: { sidecarStatus: { MISSING_SIDECAR: 0 } },
        candidates: [],
        invalidSources: [],
      });
      const s = formatJson({ template: t });
      const j = JSON.parse(s);
      assert.strictEqual(j.mutationPerformed, false);
      assert.strictEqual(j.mode, 'prepare');
      assert.ok(j.summary);
      assert.ok(j.manifest);
      assert.ok(Array.isArray(j.excluded));
    });
    await check('API: formatHumanReadable includes "Mutation performed: NO"', () => {
      const t = deriveTemplate({
        scanned: 0,
        candidateCount: 0,
        summary: { sidecarStatus: { MISSING_SIDECAR: 0 } },
        candidates: [],
        invalidSources: [],
      });
      const s = formatHumanReadable({
        plan: { invalidSources: [] },
        template: t,
      });
      assert.ok(/Mutation performed:\s+NO/.test(s));
    });

    // ── parseArgs smoke ────────────────────────────────────────────────────
    await check('parseArgs: --help', () => {
      const o = parseArgs(['node', 'cli', '--help']);
      assert.strictEqual(o.help, true);
    });
    await check('parseArgs: --json', () => {
      const o = parseArgs(['node', 'cli', '--json']);
      assert.strictEqual(o.json, true);
    });
    await check('parseArgs: --manifest-only', () => {
      const o = parseArgs(['node', 'cli', '--manifest-only']);
      assert.strictEqual(o.manifestOnly, true);
    });
    await check('parseArgs: --apply collected into forbidden', () => {
      const o = parseArgs(['node', 'cli', '--apply']);
      assert.ok(o.forbidden.includes('--apply'));
    });
    await check('parseArgs: --write / --output / --force / --overwrite forbidden', () => {
      const o = parseArgs(['node', 'cli', '--write', '--output', '--force', '--overwrite']);
      assert.ok(o.forbidden.includes('--write'));
      assert.ok(o.forbidden.includes('--output'));
      assert.ok(o.forbidden.includes('--force'));
      assert.ok(o.forbidden.includes('--overwrite'));
    });
    await check('parseArgs: unknown flag captured', () => {
      const o = parseArgs(['node', 'cli', '--totally-fake']);
      assert.ok(o.unknown.includes('--totally-fake'));
    });

    // ── T33/T34/T35: real repo untouched ──────────────────────────────────
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
    await check('T33a production Blogger Markdown bytes unchanged', () => {
      const b = Object.fromEntries(prodMdBefore.map((s) => [s.rel, s.bytes]));
      const a = Object.fromEntries(prodMdAfter.map((s) => [s.rel, s.bytes]));
      assert.deepStrictEqual(a, b);
    });
    await check('T33b production Blogger Markdown mtimes unchanged', () => {
      const b = Object.fromEntries(prodMdBefore.map((s) => [s.rel, s.mtimeMs]));
      const a = Object.fromEntries(prodMdAfter.map((s) => [s.rel, s.mtimeMs]));
      assert.deepStrictEqual(a, b);
    });

    const prodPlanAfter = await planMissingSidecars({ repoRoot: REPO_ROOT });
    const missing2026_0612After = prodPlanAfter.candidates
      .filter((c) => c.sourcePath.includes('/20260612-'))
      .filter((c) => c.sidecarStatus === 'MISSING_SIDECAR')
      .map((c) => c.sourcePath)
      .sort();
    const missingAllAfter = missingSidecarPaths(prodPlanAfter);
    await check('T35 real-repo missing-sidecar candidate set unchanged after guard', () => {
      assert.deepStrictEqual(missing2026_0612After, missing2026_0612Before);
      assert.deepStrictEqual(missingAllAfter, missingAllBefore);
    });
    await check('T35b real-repo planner reports no mutation (before + after)', () => {
      assert.strictEqual(prodPlanBefore.summary.mutationPerformed, false);
      assert.strictEqual(prodPlanAfter.summary.mutationPerformed, false);
    });

    // ── T36: dist-blogger-preview absent under repo root ──────────────────
    await check('T36 dist-blogger-preview/ absent under repo root', () => {
      assert.ok(!existsSync(path.join(REPO_ROOT, 'dist-blogger-preview')));
    });
  } finally {
    try {
      rmSync(tmpRoot, { recursive: true, force: true });
    } catch (_) {
      /* ignore */
    }
  }

  console.log('');
  console.log(`[check:blogger-backfill-truth-manifest] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(
    `[check:blogger-backfill-truth-manifest] UNEXPECTED ERROR: ${err.stack || err.message || err}`,
  );
  process.exit(1);
});
