#!/usr/bin/env node
// Phase 20260718：`bootstrap-blogger-backfill-sidecars` writer contract guard / tests。
//
// 範圍 / 邊界：
//   - 所有 fixture 斷言在 **OS temp 目錄** 之 synthetic tree 上跑；**絕不**碰 production content /
//     dist / settings / gh-pages / deploy clone；temp 目錄於 finally{} 清除。
//   - 只 import 被測模組（bootstrap-blogger-backfill-sidecars.js）之唯讀 API + node 讀取 API；
//     實際 mutation 走 CLI subprocess，only against temp fixtures。
//   - 不呼叫 Blogger / Google API；不需網路；不需 credential。
//   - 執行前後 production repo 之 `.publish.json` inventory 完全不變。
//
// 覆蓋（依 Session prompt §七 hard assertions 逐項對應）：
//   1. --help 成功且不 mutation
//   2. 缺少 --input fail closed
//   3. 無效 JSON fail closed
//   4. 空 manifest 之明確行為
//   5. 未知欄位 / 錯誤 shape
//   6. 重複 source
//   7. source Markdown 不存在
//   8. source 不屬於 Blogger candidate
//   9. target sidecar 已存在
//   10. 無效 publishedUrl
//   11. 無效或非 strict ISO publishedAt
//   12. timezone boundary 不被 UTC/local getter 改變月份
//   13. 不 fabricate bloggerPostId
//   14. dry-run 不建立任何檔案
//   15. dry-run 不修改 bytes / mtime / 目錄 entry list
//   16. --json 輸出可解析且 deterministic
//   17. apply 可在 temp fixture 建立預期 sidecar
//   18. apply 只建立預定目標
//   19. apply 不修改 Markdown
//   20. apply 不修改既有 sidecar
//   21. 第二次執行不覆寫第一次建立之 sidecar
//   22. 多筆中任一筆 invalid 時，零 mutation
//   23. 拒絕 --force / --overwrite / --replace / --merge / --yes
//   24. 不 network / Blogger API / Google API（source-level）
//   25. 不 child_process 執行外部 mutation（source-level）
//   26. 正式 repo .publish.json inventory 前後一致
//   27. 正式六篇 20260612-* 仍為 MISSING_SIDECAR
//   28. deploy repo 完全不變（skipped — deploy clone 不在同 repo 內；額外 hoop guard 不在本 slice 範圍）
//
// 執行：`npm run check:blogger-backfill-sidecar-bootstrap`
//       或 `node src/scripts/check-blogger-backfill-sidecar-bootstrap.js`

import assert from 'node:assert';
import fs from 'node:fs/promises';
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
  buildSidecarBody,
  loadManifest,
  planBootstrap,
  ALLOWED_SOURCE_PREFIX,
  MANIFEST_SCHEMA_VERSION,
} from './bootstrap-blogger-backfill-sidecars.js';

import { planMissingSidecars } from './plan-blogger-backfill-sidecars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(REPO_ROOT, 'src', 'scripts', 'bootstrap-blogger-backfill-sidecars.js');
const CLI_SRC = readFileSync(CLI, 'utf-8');

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
    'body — writer must not read this.',
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

function runCli(args, extraEnv) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    shell: false,
    windowsHide: true,
    env: { ...process.env, ...(extraEnv || {}) },
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// Build a canonical minimal fixture tree with two candidates (alpha, bravo) and
// one non-candidate (charlie: draft=true). No sidecars.
function seedBaseFixture(repoRoot) {
  const postsDir = path.join(repoRoot, 'content', 'blogger', 'posts');
  writeFileSyncMk(
    path.join(postsDir, '20260101-alpha.md'),
    fmMd({ id: '20260101-alpha', slug: 'alpha' }),
  );
  writeFileSyncMk(
    path.join(postsDir, '20260102-bravo.md'),
    fmMd({ id: '20260102-bravo', slug: 'bravo' }),
  );
  writeFileSyncMk(
    path.join(postsDir, '20260103-charlie.md'),
    fmMd({ id: '20260103-charlie', slug: 'charlie', status: 'draft', draft: true }),
  );
  return postsDir;
}

function writeManifest(repoRoot, name, body) {
  const p = path.join(repoRoot, name);
  writeFileSync(p, JSON.stringify(body, null, 2), 'utf-8');
  return p;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  // ── Real-repo baseline snapshot (production sidecars must not change) ─────
  const prodPostsDir = path.join(REPO_ROOT, 'content', 'blogger', 'posts');
  const prodInvBefore = snapshotSidecarInventory(prodPostsDir);

  // Real-repo planner: capture 20260612-* posts must be MISSING_SIDECAR at start.
  const prodPlanBefore = await planMissingSidecars({ repoRoot: REPO_ROOT });
  const missing2026_0612Before = prodPlanBefore.candidates
    .filter((c) => c.sourcePath.includes('/20260612-'))
    .filter((c) => c.sidecarStatus === 'MISSING_SIDECAR')
    .map((c) => c.sourcePath);

  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'bootstrap-blogger-backfill-'));
  try {
    // ─── T1 --help: exit 0 + create nothing + never-overwrites clause ──────
    {
      const before = snapshotTree(tmpRoot);
      const r = runCli(['--help']);
      await check('T1a --help: exit 0', () => {
        assert.strictEqual(r.status, 0);
      });
      await check('T1b --help: mentions create-only', () => {
        assert.ok(/create-only/i.test(r.stdout));
      });
      await check('T1c --help: mentions dry-run default', () => {
        assert.ok(/defaults to dry-run/i.test(r.stdout));
      });
      const after = snapshotTree(tmpRoot);
      await check('T1d --help: fixture tree unchanged', () => {
        assert.deepStrictEqual(after, before);
      });
    }

    // ─── T2 missing --input fail closed ───────────────────────────────────
    {
      const r = runCli([]);
      await check('T2 no --input: exit 1 with required-flag message', () => {
        assert.strictEqual(r.status, 1);
        assert.ok(/--input.*required/i.test(r.stderr));
      });
    }

    // ─── T3 invalid manifest JSON fail closed ─────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'invalid-json-'));
      seedBaseFixture(repoRoot);
      const badPath = path.join(repoRoot, 'bad.json');
      writeFileSync(badPath, '{ not valid ', 'utf-8');
      const before = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
      const r = runCli(['--input', badPath, '--repo-root', repoRoot]);
      await check('T3a invalid JSON: exit 1', () => {
        assert.strictEqual(r.status, 1, `stderr=${r.stderr}`);
      });
      await check('T3b invalid JSON: message mentions parse error', () => {
        assert.ok(/parse error/i.test(r.stderr));
      });
      const after = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
      await check('T3c invalid JSON: no sidecar created', () => {
        assert.deepStrictEqual(after, before);
      });
    }

    // ─── T4 empty records array: dry-run OK, 0 records; apply OK, 0 writes ─
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'empty-manifest-'));
      seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'empty.json', { schemaVersion: 1, records: [] });
      const before = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
      const r = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T4a empty manifest --json dry-run: exit 0', () => {
        assert.strictEqual(r.status, 0, r.stderr);
      });
      await check('T4b empty manifest: mutationPerformed=false', () => {
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.mutationPerformed, false);
        assert.strictEqual(j.summary.manifestRecordCount, 0);
        assert.strictEqual(j.summary.readyCount, 0);
        assert.strictEqual(j.summary.blockedCount, 0);
        assert.strictEqual(j.entries.length, 0);
      });
      const rApply = runCli(['--input', p, '--json', '--apply', '--repo-root', repoRoot]);
      await check('T4c empty manifest --apply: exit 0 + created=0', () => {
        assert.strictEqual(rApply.status, 0, rApply.stderr);
        const j = JSON.parse(rApply.stdout);
        assert.strictEqual(j.apply.ok, true);
        assert.strictEqual(j.apply.created.length, 0);
      });
      const after = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
      await check('T4d empty manifest: no sidecar created (bytes/mtime unchanged)', () => {
        assert.deepStrictEqual(after, before);
      });
    }

    // ─── T5 unknown field / wrong shape fail closed ───────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'unknown-field-'));
      seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'unknown.json', {
        schemaVersion: 1,
        wibble: 'nope',
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
              bloggerPostId: '999999',
            },
          },
        ],
      });
      const before = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
      const r = runCli(['--input', p, '--repo-root', repoRoot]);
      await check('T5a unknown top-level field: exit 1', () => {
        assert.strictEqual(r.status, 1);
        assert.ok(/unknown top-level/i.test(r.stderr) || /unknown top-level/i.test(r.stdout));
      });

      // per-record bloggerPostId key must be rejected too.
      const rApply = runCli(['--input', p, '--apply', '--repo-root', repoRoot]);
      await check('T5b unknown top-level + apply: still exit 1, no mutation', () => {
        assert.strictEqual(rApply.status, 1);
        const after = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
        assert.deepStrictEqual(after, before);
      });

      const p2 = writeManifest(repoRoot, 'unknown-record.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
              bloggerPostId: '999999',
            },
          },
        ],
      });
      const r2 = runCli(['--input', p2, '--json', '--repo-root', repoRoot]);
      await check('T5c blogger.bloggerPostId rejected (never fabricated)', () => {
        assert.strictEqual(r2.status, 1);
        const j = JSON.parse(r2.stdout);
        assert.strictEqual(j.entries[0].readiness, 'INVALID_RECORD');
        assert.ok(
          j.entries[0].reasons.some((s) => /bloggerPostId/.test(s) || /unknown field/i.test(s)),
        );
      });
    }

    // ─── T6 duplicate source path fail closed ─────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'duplicate-source-'));
      seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'dup.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const before = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
      const r = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T6a duplicate source: dry-run exit 1', () => {
        assert.strictEqual(r.status, 1);
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.summary.byReadiness.DUPLICATE_SOURCE, 1);
      });
      const rApply = runCli(['--input', p, '--apply', '--repo-root', repoRoot]);
      await check('T6b duplicate source + apply: exit 1 and no mutation', () => {
        assert.strictEqual(rApply.status, 1);
        const after = snapshotSidecarInventory(path.join(repoRoot, 'content', 'blogger', 'posts'));
        assert.deepStrictEqual(after, before);
      });
    }

    // ─── T7 source Markdown missing fail closed ───────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'source-missing-'));
      seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'nope.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-nowhere.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/nowhere.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const r = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T7 source not found: SOURCE_NOT_FOUND + exit 1', () => {
        assert.strictEqual(r.status, 1);
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.entries[0].readiness, 'SOURCE_NOT_FOUND');
      });
    }

    // ─── T8 source not a Blogger candidate fail closed ────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'not-candidate-'));
      seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'draft.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260103-charlie.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/charlie.html',
              publishedAt: '2026-01-03',
            },
          },
        ],
      });
      const r = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T8 source not candidate (draft:true): SOURCE_NOT_CANDIDATE + exit 1', () => {
        assert.strictEqual(r.status, 1);
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.entries[0].readiness, 'SOURCE_NOT_CANDIDATE');
      });
    }

    // ─── T8b source outside allowed prefix fail closed ────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'wrong-prefix-'));
      seedBaseFixture(repoRoot);
      writeFileSyncMk(
        path.join(repoRoot, 'content', 'github', 'posts', '20260101-gh.md'),
        fmMd({ id: '20260101-gh', slug: 'gh' }),
      );
      const p = writeManifest(repoRoot, 'gh.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/github/posts/20260101-gh.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/gh.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const r = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T8b source outside content/blogger/posts/: exit 1', () => {
        assert.strictEqual(r.status, 1);
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.entries[0].readiness, 'INVALID_RECORD');
        assert.ok(j.entries[0].reasons.some((s) => new RegExp(ALLOWED_SOURCE_PREFIX).test(s)));
      });
    }

    // ─── T9 target sidecar already exists fail closed ─────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'target-exists-'));
      const postsDir = seedBaseFixture(repoRoot);
      // Seed pre-existing sidecar for alpha.
      writeFileSyncMk(
        path.join(postsDir, '20260101-alpha.publish.json'),
        JSON.stringify({ schemaVersion: 1, note: 'pre-existing' }, null, 2) + '\n',
      );
      const p = writeManifest(repoRoot, 'exists.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const before = snapshotSidecarInventory(postsDir);
      const r = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T9a target exists: exit 1 + SIDECAR_ALREADY_EXISTS', () => {
        assert.strictEqual(r.status, 1);
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.entries[0].readiness, 'SIDECAR_ALREADY_EXISTS');
      });
      const rApply = runCli(['--input', p, '--apply', '--repo-root', repoRoot]);
      await check('T9b target exists + apply: exit 1 and no bytes changed', () => {
        assert.strictEqual(rApply.status, 1);
        const after = snapshotSidecarInventory(postsDir);
        assert.deepStrictEqual(after, before);
      });
    }

    // ─── T10 invalid publishedUrl fail closed ─────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'bad-url-'));
      seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'badurl.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'ftp://not-http.example.com/alpha',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const r = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T10 invalid publishedUrl: INVALID_RECORD + exit 1', () => {
        assert.strictEqual(r.status, 1);
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.entries[0].readiness, 'INVALID_RECORD');
        assert.ok(j.entries[0].reasons.some((s) => /publishedUrl/i.test(s)));
      });

      const p2 = writeManifest(repoRoot, 'padded-url.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: ' https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const r2 = runCli(['--input', p2, '--json', '--repo-root', repoRoot]);
      await check('T10b publishedUrl with leading whitespace: exit 1', () => {
        assert.strictEqual(r2.status, 1);
      });
    }

    // ─── T11 invalid publishedAt fail closed ──────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'bad-at-'));
      seedBaseFixture(repoRoot);
      for (const [name, val] of [
        ['space', '2026-01-01 10:00'],
        ['padded', ' 2026-01-01'],
        ['not-iso', 'Jan 1, 2026'],
        ['empty', ''],
      ]) {
        const p = writeManifest(repoRoot, `at-${name}.json`, {
          schemaVersion: 1,
          records: [
            {
              sourcePath: 'content/blogger/posts/20260101-alpha.md',
              blogger: {
                publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
                publishedAt: val,
              },
            },
          ],
        });
        const r = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
        await check(`T11 publishedAt "${name}" rejected + exit 1`, () => {
          assert.strictEqual(r.status, 1);
          const j = JSON.parse(r.stdout);
          assert.strictEqual(j.entries[0].readiness, 'INVALID_RECORD');
          assert.ok(j.entries[0].reasons.some((s) => /publishedAt/i.test(s)));
        });
      }
    }

    // ─── T12 timezone boundary: buildSidecarBody preserves original month ─
    {
      const bodyA = buildSidecarBody({
        publishedUrl: 'https://example.blogspot.com/2026/08/x.html',
        publishedAt: '2026-08-01T00:30:00+08:00',
      });
      await check('T12a offset +08 near boundary preserves month "08"', () => {
        assert.strictEqual(bodyA.blogger.publishYear, '2026');
        assert.strictEqual(bodyA.blogger.publishMonth, '08');
      });
      const bodyB = buildSidecarBody({
        publishedUrl: 'https://example.blogspot.com/2026/12/x.html',
        publishedAt: '2026-12-31T23:30:00-05:00',
      });
      await check('T12b offset -05 near year boundary preserves 2026/12', () => {
        assert.strictEqual(bodyB.blogger.publishYear, '2026');
        assert.strictEqual(bodyB.blogger.publishMonth, '12');
      });
    }

    // ─── T13 bloggerPostId never fabricated ───────────────────────────────
    {
      const body = buildSidecarBody({
        publishedUrl: 'https://example.blogspot.com/2026/01/x.html',
        publishedAt: '2026-01-01',
      });
      await check('T13a buildSidecarBody: bloggerPostId is empty string', () => {
        assert.strictEqual(body.blogger.bloggerPostId, '');
      });
      // Coverage note: manifest-side rejection of bloggerPostId is verified by T5c;
      // T13a proves the writer never fabricates it. No source-scan needed.
    }

    // ─── T14/T15 dry-run creates no files, no bytes/mtime/entry list change ─
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'dry-run-'));
      const postsDir = seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'ok.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const beforeAll = snapshotTree(postsDir);
      const beforeInv = snapshotSidecarInventory(postsDir);
      // First a human-readable dry-run.
      const r1 = runCli(['--input', p, '--repo-root', repoRoot]);
      await check('T14a dry-run human: exit 0, READY_FOR_WRITE reported', () => {
        assert.strictEqual(r1.status, 0, r1.stderr);
        assert.ok(/READY_FOR_WRITE/.test(r1.stdout));
        assert.ok(/Mutation performed:\s+NO/.test(r1.stdout));
      });
      // Then a JSON dry-run.
      const r2 = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T14b dry-run --json: mutationPerformed=false', () => {
        assert.strictEqual(r2.status, 0, r2.stderr);
        const j = JSON.parse(r2.stdout);
        assert.strictEqual(j.mutationPerformed, false);
        assert.strictEqual(j.summary.readyCount, 1);
      });
      const afterAll = snapshotTree(postsDir);
      const afterInv = snapshotSidecarInventory(postsDir);
      await check('T15a dry-run: no new .publish.json created', () => {
        assert.deepStrictEqual(
          afterInv.map((s) => s.rel).sort(),
          beforeInv.map((s) => s.rel).sort(),
        );
      });
      await check('T15b dry-run: fixture bytes unchanged', () => {
        const beforeMap = Object.fromEntries(beforeAll.map((f) => [f.rel, f.bytes]));
        const afterMap = Object.fromEntries(afterAll.map((f) => [f.rel, f.bytes]));
        assert.deepStrictEqual(afterMap, beforeMap);
      });
      await check('T15c dry-run: fixture mtimes unchanged', () => {
        const beforeMt = Object.fromEntries(beforeAll.map((f) => [f.rel, f.mtimeMs]));
        const afterMt = Object.fromEntries(afterAll.map((f) => [f.rel, f.mtimeMs]));
        assert.deepStrictEqual(afterMt, beforeMt);
      });
      await check('T15d dry-run: directory entry list unchanged', () => {
        const beforeRel = beforeAll.map((f) => f.rel).sort();
        const afterRel = afterAll.map((f) => f.rel).sort();
        assert.deepStrictEqual(afterRel, beforeRel);
      });
    }

    // ─── T16 --json parseable + deterministic across two runs ────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'json-det-'));
      seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'ok.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260102-bravo.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/bravo.html',
              publishedAt: '2026-01-02',
            },
          },
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const r1 = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      const r2 = runCli(['--input', p, '--json', '--repo-root', repoRoot]);
      await check('T16a --json output parseable', () => {
        JSON.parse(r1.stdout);
      });
      await check('T16b --json output deterministic across two dry-runs', () => {
        assert.strictEqual(r1.stdout, r2.stdout);
      });
      await check('T16c --json ordering: sourcePath ascending', () => {
        const j = JSON.parse(r1.stdout);
        const paths = j.entries.map((e) => e.sourcePath);
        assert.deepStrictEqual(paths, [...paths].sort());
      });
      await check('T16d --json contains no timestamp / fixture-root leak', () => {
        assert.ok(!/"generatedAt"/.test(r1.stdout));
        assert.ok(!/"timestamp"/.test(r1.stdout));
        // The fixture repo root path must not appear anywhere in the JSON.
        // (URLs like https://... are legitimate; a naive drive-letter regex would false-positive.)
        const rootPosix = repoRoot.split(path.sep).join('/');
        const rootNative = repoRoot;
        assert.ok(!r1.stdout.includes(rootPosix), `fixture root leaked (posix): ${rootPosix}`);
        assert.ok(!r1.stdout.includes(rootNative), `fixture root leaked (native): ${rootNative}`);
      });
    }

    // ─── T17/T18/T19/T20 apply writes expected sidecars, only planned targets,
    //     leaves Markdown and existing sidecars untouched ────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'apply-happy-'));
      const postsDir = seedBaseFixture(repoRoot);
      // Pre-existing unrelated sidecar (bravo already has one) — writer must not touch it.
      writeFileSyncMk(
        path.join(postsDir, '20260102-bravo.publish.json'),
        JSON.stringify({ schemaVersion: 1, keep: 'me' }, null, 2) + '\n',
      );
      const p = writeManifest(repoRoot, 'ok.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const treeBefore = snapshotTree(postsDir);
      const bravoSidecarBefore = readFileSync(
        path.join(postsDir, '20260102-bravo.publish.json'),
        'utf-8',
      );
      const alphaMdBefore = readFileSync(path.join(postsDir, '20260101-alpha.md'), 'utf-8');

      const r = runCli(['--input', p, '--apply', '--json', '--repo-root', repoRoot]);
      await check('T17a apply exit 0 + mutationPerformed=true + created=1', () => {
        assert.strictEqual(r.status, 0, r.stderr);
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.mutationPerformed, true);
        assert.strictEqual(j.apply.ok, true);
        assert.deepStrictEqual(j.apply.created, [
          'content/blogger/posts/20260101-alpha.publish.json',
        ]);
      });
      const created = path.join(postsDir, '20260101-alpha.publish.json');
      await check('T17b apply: alpha sidecar exists on disk', () => {
        assert.ok(existsSync(created));
      });
      await check('T17c apply: written content contains supplied truth', () => {
        const parsed = JSON.parse(readFileSync(created, 'utf-8'));
        assert.strictEqual(parsed.schemaVersion, 1);
        assert.strictEqual(
          parsed.blogger.publishedUrl,
          'https://example.blogspot.com/2026/01/alpha.html',
        );
        assert.strictEqual(parsed.blogger.publishedAt, '2026-01-01');
        assert.strictEqual(parsed.blogger.publishYear, '2026');
        assert.strictEqual(parsed.blogger.publishMonth, '01');
        assert.strictEqual(parsed.blogger.bloggerPostId, '');
        assert.strictEqual(parsed.blogger.status, 'published');
        assert.strictEqual(parsed.canonical.source, 'auto');
        assert.strictEqual(parsed.github.status, 'draft');
      });
      await check('T18 apply: only planned targets created (charlie/bravo new sidecars absent)', () => {
        assert.ok(!existsSync(path.join(postsDir, '20260103-charlie.publish.json')));
      });
      await check('T19 apply: alpha Markdown byte-identical (unchanged)', () => {
        const md = readFileSync(path.join(postsDir, '20260101-alpha.md'), 'utf-8');
        assert.strictEqual(md, alphaMdBefore);
      });
      await check('T20 apply: existing bravo sidecar untouched', () => {
        const now = readFileSync(path.join(postsDir, '20260102-bravo.publish.json'), 'utf-8');
        assert.strictEqual(now, bravoSidecarBefore);
      });
      await check('T17d apply: no .tmp left behind', () => {
        for (const name of readdirSync(postsDir)) {
          assert.ok(!name.endsWith('.tmp'), `leftover tmp: ${name}`);
        }
      });
      await check('T17e apply: tree grew by exactly one file (the new sidecar)', () => {
        const treeAfter = snapshotTree(postsDir);
        const beforeRel = new Set(treeBefore.map((f) => f.rel));
        const afterRel = new Set(treeAfter.map((f) => f.rel));
        const added = [...afterRel].filter((r) => !beforeRel.has(r));
        assert.deepStrictEqual(added, ['20260101-alpha.publish.json']);
      });
    }

    // ─── T21 second run does not overwrite ────────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'second-run-'));
      const postsDir = seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'ok.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const r1 = runCli(['--input', p, '--apply', '--repo-root', repoRoot]);
      assert.strictEqual(r1.status, 0, r1.stderr);
      const created = path.join(postsDir, '20260101-alpha.publish.json');
      const firstBytes = readFileSync(created, 'utf-8');
      // Second attempt with a different manifest URL — must NOT overwrite.
      const p2 = writeManifest(repoRoot, 'ok2.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/attempted-overwrite.html',
              publishedAt: '2026-06-06',
            },
          },
        ],
      });
      const r2 = runCli(['--input', p2, '--apply', '--repo-root', repoRoot]);
      await check('T21a second apply: exit 1 (target exists; create-only)', () => {
        assert.strictEqual(r2.status, 1);
      });
      await check('T21b second apply: bytes unchanged (no overwrite)', () => {
        const now = readFileSync(created, 'utf-8');
        assert.strictEqual(now, firstBytes);
      });
    }

    // ─── T22 multi-record: any invalid → zero mutation ────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'partial-invalid-'));
      const postsDir = seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'mix.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
          {
            // Second record has an invalid publishedAt.
            sourcePath: 'content/blogger/posts/20260102-bravo.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/bravo.html',
              publishedAt: 'not-iso',
            },
          },
        ],
      });
      const beforeInv = snapshotSidecarInventory(postsDir);
      const r = runCli(['--input', p, '--apply', '--json', '--repo-root', repoRoot]);
      await check('T22a apply refused: exit 1', () => {
        assert.strictEqual(r.status, 1);
      });
      await check('T22b apply refused: mutationPerformed=false in report', () => {
        const j = JSON.parse(r.stdout);
        assert.strictEqual(j.mutationPerformed, false);
      });
      await check('T22c zero mutation: no new sidecar created for alpha', () => {
        const afterInv = snapshotSidecarInventory(postsDir);
        const beforeRel = new Set(beforeInv.map((s) => s.rel));
        const afterRel = new Set(afterInv.map((s) => s.rel));
        assert.deepStrictEqual([...afterRel].sort(), [...beforeRel].sort());
      });
    }

    // ─── T23 forbidden flags rejected ─────────────────────────────────────
    for (const flag of ['--force', '--overwrite', '--replace', '--merge', '--yes', '-y']) {
      await check(`T23 forbidden flag ${flag} rejected + exit 1`, () => {
        // With a bogus --input path we don't care about input handling; forbidden must be
        // caught before that step.
        const r = runCli([flag, '--input', 'not-a-real-path.json']);
        assert.strictEqual(r.status, 1);
        assert.ok(/forbidden flag/i.test(r.stderr), `stderr=${r.stderr}`);
      });
    }

    // ─── T24 source-level: no network / no Blogger API import ─────────────
    await check('T24a source: no fetch(', () => {
      assert.ok(!/\bfetch\s*\(/.test(CLI_SRC));
    });
    await check('T24b source: no node:http / node:https import', () => {
      assert.ok(!/from ['"]node:https?['"]/.test(CLI_SRC));
      assert.ok(!/require\(['"]node:https?['"]\)/.test(CLI_SRC));
    });
    await check('T24c source: no googleapis / blogger.googleapis / oauth mention', () => {
      assert.ok(!/googleapis|blogger\.googleapis|oauth/i.test(CLI_SRC));
    });

    // ─── T25 source-level: no child_process ───────────────────────────────
    await check('T25 source: no child_process import or spawn call', () => {
      assert.ok(!/child_process/.test(CLI_SRC));
      assert.ok(!/spawnSync|execSync|execFileSync|spawn\(/.test(CLI_SRC));
    });

    // ─── T26/T27 production repo untouched ────────────────────────────────
    const prodInvAfter = snapshotSidecarInventory(prodPostsDir);
    await check('T26a production sidecar file list unchanged', () => {
      const beforeSet = new Set(prodInvBefore.map((s) => s.rel));
      const afterSet = new Set(prodInvAfter.map((s) => s.rel));
      assert.deepStrictEqual([...afterSet].sort(), [...beforeSet].sort());
    });
    await check('T26b production sidecar bytes unchanged', () => {
      const b = Object.fromEntries(prodInvBefore.map((s) => [s.rel, s.bytes]));
      const a = Object.fromEntries(prodInvAfter.map((s) => [s.rel, s.bytes]));
      assert.deepStrictEqual(a, b);
    });
    await check('T26c production sidecar mtimes unchanged', () => {
      const b = Object.fromEntries(prodInvBefore.map((s) => [s.rel, s.mtimeMs]));
      const a = Object.fromEntries(prodInvAfter.map((s) => [s.rel, s.mtimeMs]));
      assert.deepStrictEqual(a, b);
    });

    const prodPlanAfter = await planMissingSidecars({ repoRoot: REPO_ROOT });
    const missing2026_0612After = prodPlanAfter.candidates
      .filter((c) => c.sourcePath.includes('/20260612-'))
      .filter((c) => c.sidecarStatus === 'MISSING_SIDECAR')
      .map((c) => c.sourcePath);
    await check('T27 six 20260612-* posts remain MISSING_SIDECAR after guard', () => {
      assert.deepStrictEqual(missing2026_0612After.sort(), missing2026_0612Before.sort());
    });

    // ─── loadManifest / planBootstrap smoke ───────────────────────────────
    {
      const repoRoot = mkdtempSync(path.join(tmpRoot, 'api-smoke-'));
      seedBaseFixture(repoRoot);
      const p = writeManifest(repoRoot, 'smoke.json', {
        schemaVersion: 1,
        records: [
          {
            sourcePath: 'content/blogger/posts/20260101-alpha.md',
            blogger: {
              publishedUrl: 'https://example.blogspot.com/2026/01/alpha.html',
              publishedAt: '2026-01-01',
            },
          },
        ],
      });
      const loaded = await loadManifest(p);
      await check('API: loadManifest ok', () => {
        assert.strictEqual(loaded.ok, true);
        assert.strictEqual(loaded.manifest.schemaVersion, MANIFEST_SCHEMA_VERSION);
      });
      const plan = await planBootstrap({ manifest: loaded.manifest, repoRoot });
      await check('API: planBootstrap ok + READY_FOR_WRITE=1', () => {
        assert.strictEqual(plan.ok, true);
        assert.strictEqual(plan.summary.byReadiness.READY_FOR_WRITE, 1);
      });
    }

    // ─── parseArgs smoke ──────────────────────────────────────────────────
    await check('parseArgs: --help sets help=true', () => {
      const o = parseArgs(['node', 'cli', '--help']);
      assert.strictEqual(o.help, true);
    });
    await check('parseArgs: --input <val> assigns', () => {
      const o = parseArgs(['node', 'cli', '--input', 'x.json']);
      assert.strictEqual(o.input, 'x.json');
    });
    await check('parseArgs: --input=<val> assigns', () => {
      const o = parseArgs(['node', 'cli', '--input=x.json']);
      assert.strictEqual(o.input, 'x.json');
    });
    await check('parseArgs: --apply sets apply=true', () => {
      const o = parseArgs(['node', 'cli', '--apply']);
      assert.strictEqual(o.apply, true);
    });
    await check('parseArgs: forbidden --force captured', () => {
      const o = parseArgs(['node', 'cli', '--force']);
      assert.ok(o.forbidden.includes('--force'));
    });
    await check('parseArgs: forbidden --force=1 captured', () => {
      const o = parseArgs(['node', 'cli', '--force=1']);
      assert.ok(o.forbidden.includes('--force'));
    });
    await check('parseArgs: unknown flag captured', () => {
      const o = parseArgs(['node', 'cli', '--totally-fake-flag']);
      assert.ok(o.unknown.includes('--totally-fake-flag'));
    });
  } finally {
    try {
      rmSync(tmpRoot, { recursive: true, force: true });
    } catch (_) {
      /* ignore */
    }
  }

  console.log('');
  console.log(`[check:blogger-backfill-sidecar-bootstrap] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(
    `[check:blogger-backfill-sidecar-bootstrap] UNEXPECTED ERROR: ${err.stack || err.message || err}`,
  );
  process.exit(1);
});
