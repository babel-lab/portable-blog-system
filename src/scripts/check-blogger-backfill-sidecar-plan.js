#!/usr/bin/env node
// Phase 20260718：`plan-blogger-backfill-sidecars` contract guard / tests。
//
// 範圍 / 邊界：
//   - 全部 fixture 斷言在 **OS temp 目錄** 之 synthetic content tree 上跑；**絕不**碰 production
//     content / dist / settings / gh-pages / deploy clone；temp 目錄於 finally{} 清除。
//   - 只 import 被測模組（plan-blogger-backfill-sidecars.js）之唯讀 API + node 讀取 API；**不**
//     build / deploy / commit / push / 寫 production 檔。唯一 write = 自己的 temp fixtures。
//   - 不呼叫 Blogger / Google API；不需網路；不需 credential。
//
// 覆蓋：
//   - MISSING_SIDECAR / PRESENT_INCOMPLETE / PRESENT_COMPLETE / INVALID_SIDECAR classification
//   - readiness BLOCKED / NO_ACTION_REQUIRED / INVALID_SOURCE state
//   - deterministic ordering + stable JSON keys（無 timestamp / absolute path / locale date）
//   - --json 語法合法 + top-level contract 固定
//   - --help 提及 "never creates or modifies" 與 "explicit authorization"
//   - --write / --apply / --force / --yes / --create-sidecar / --output / --out / --fix 皆 hard-fail
//   - no-write guarantee：fixture tree bytes / mtime + entry list 執行前後不變；planner 不建立 .publish.json
//   - real-repo smoke：planMissingSidecars 於現 repo 之候選 = 至少 1；不硬編碼精確 slug list
//   - source-level：planner 原始碼不得含 writeFile / mkdir / rm / rename 等 write API
//   - CLI real-repo：human 與 JSON 兩種模式跑完後，真實 repo 之 `.publish.json` 檔案清單不變
//
// 執行：`npm run check:blogger-backfill-sidecar-plan`
//       或 `node src/scripts/check-blogger-backfill-sidecar-plan.js`

import assert from 'node:assert';
import fs from 'node:fs/promises';
import { readFileSync, statSync, existsSync, readdirSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseArgs,
  planMissingSidecars,
  formatHumanReadable,
  formatJson,
  REQUIRED_TRUTH_FIELDS,
  SIDECAR_STATUSES,
  READINESS_STATES,
} from './plan-blogger-backfill-sidecars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(REPO_ROOT, 'src', 'scripts', 'plan-blogger-backfill-sidecars.js');
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

function fmMd({ id, slug, status, draft, bloggerEnabled }) {
  const lines = [
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
  ];
  return lines.join('\n');
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
  // Recursively list every .publish.json under root, plus their bytes.
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

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'plan-blogger-backfill-sidecars-'));
  const contentRoot = path.join(tmpRoot, 'content', 'blogger', 'posts');
  try {
    // Fixture layout:
    //   A: MISSING_SIDECAR + BLOCKED (no .publish.json)
    //   B: PRESENT_INCOMPLETE + BLOCKED (sidecar w/ empty publishedUrl)
    //   C: PRESENT_COMPLETE + NO_ACTION_REQUIRED (publishedUrl + publishedAt set; bloggerPostId empty)
    //   D: INVALID_SIDECAR + BLOCKED (malformed JSON)
    //   E: non-candidate (draft: true) → excluded
    //   F: non-candidate (blogger.enabled: false) → excluded
    //   G: non-candidate (status: draft) → excluded
    //   H: MISSING_SIDECAR (a second candidate to test deterministic ordering)

    const aMd = path.join(contentRoot, '20260101-alpha.md');
    writeFileSyncMk(aMd, fmMd({
      id: '20260101-alpha', slug: 'alpha',
      status: 'ready', draft: false, bloggerEnabled: 'true',
    }));

    const bMd = path.join(contentRoot, '20260102-bravo.md');
    writeFileSyncMk(bMd, fmMd({
      id: '20260102-bravo', slug: 'bravo',
      status: 'ready', draft: false, bloggerEnabled: 'true',
    }));
    const bJson = path.join(contentRoot, '20260102-bravo.publish.json');
    writeFileSyncMk(bJson, JSON.stringify({
      schemaVersion: 1,
      blogger: {
        type: 'post',
        permalink: 'bravo',
        status: 'draft',
        publishedUrl: '',
        publishedAt: '',
        bloggerPostId: '',
      },
    }, null, 2) + '\n');

    const cMd = path.join(contentRoot, '20260103-charlie.md');
    writeFileSyncMk(cMd, fmMd({
      id: '20260103-charlie', slug: 'charlie',
      status: 'ready', draft: false, bloggerEnabled: 'true',
    }));
    const cJson = path.join(contentRoot, '20260103-charlie.publish.json');
    writeFileSyncMk(cJson, JSON.stringify({
      schemaVersion: 1,
      blogger: {
        type: 'post',
        permalink: 'charlie',
        status: 'published',
        publishedUrl: 'https://example.blogspot.com/2026/01/charlie.html',
        publishedAt: '2026-01-03',
        bloggerPostId: '',
      },
    }, null, 2) + '\n');

    const dMd = path.join(contentRoot, '20260104-delta.md');
    writeFileSyncMk(dMd, fmMd({
      id: '20260104-delta', slug: 'delta',
      status: 'ready', draft: false, bloggerEnabled: 'true',
    }));
    const dJson = path.join(contentRoot, '20260104-delta.publish.json');
    writeFileSyncMk(dJson, '{ this is not valid json ');

    const eMd = path.join(contentRoot, '20260105-echo.md');
    writeFileSyncMk(eMd, fmMd({
      id: '20260105-echo', slug: 'echo',
      status: 'ready', draft: true, bloggerEnabled: 'true',
    }));

    const fMd = path.join(contentRoot, '20260106-foxtrot.md');
    writeFileSyncMk(fMd, fmMd({
      id: '20260106-foxtrot', slug: 'foxtrot',
      status: 'ready', draft: false, bloggerEnabled: 'false',
    }));

    const gMd = path.join(contentRoot, '20260107-golf.md');
    writeFileSyncMk(gMd, fmMd({
      id: '20260107-golf', slug: 'golf',
      status: 'draft', draft: true, bloggerEnabled: 'true',
    }));

    const hMd = path.join(contentRoot, '20260108-hotel.md');
    writeFileSyncMk(hMd, fmMd({
      id: '20260108-hotel', slug: 'hotel',
      status: 'published', draft: false, bloggerEnabled: 'true',
    }));

    // ── Snapshot before planner ─────────────────────────────────────────────
    const before = snapshotTree(contentRoot);
    const beforeInv = snapshotSidecarInventory(contentRoot);

    // ── planMissingSidecars() classification ────────────────────────────────
    const plan = await planMissingSidecars({
      repoRoot: tmpRoot,
      contentRoot,
    });

    await check('scanned = 8', () => {
      assert.strictEqual(plan.scanned, 8);
    });
    await check('candidateCount = 5 (A, B, C, D, H)', () => {
      assert.strictEqual(plan.candidateCount, 5);
    });
    await check('candidate ordering deterministic (sourcePath ascending)', () => {
      const paths = plan.candidates.map((c) => c.sourcePath);
      const sorted = [...paths].sort();
      assert.deepStrictEqual(paths, sorted);
    });
    await check('sidecarStatus MISSING_SIDECAR = 2', () => {
      assert.strictEqual(plan.summary.sidecarStatus.MISSING_SIDECAR, 2);
    });
    await check('sidecarStatus PRESENT_INCOMPLETE = 1', () => {
      assert.strictEqual(plan.summary.sidecarStatus.PRESENT_INCOMPLETE, 1);
    });
    await check('sidecarStatus PRESENT_COMPLETE = 1', () => {
      assert.strictEqual(plan.summary.sidecarStatus.PRESENT_COMPLETE, 1);
    });
    await check('sidecarStatus INVALID_SIDECAR = 1', () => {
      assert.strictEqual(plan.summary.sidecarStatus.INVALID_SIDECAR, 1);
    });
    await check('readiness BLOCKED = 4 (A, B, D, H)', () => {
      assert.strictEqual(plan.summary.readiness.BLOCKED, 4);
    });
    await check('readiness NO_ACTION_REQUIRED = 1 (C)', () => {
      assert.strictEqual(plan.summary.readiness.NO_ACTION_REQUIRED, 1);
    });
    await check('readiness READY_FOR_FUTURE_BOOTSTRAP = 0 (never emitted)', () => {
      assert.strictEqual(plan.summary.readiness.READY_FOR_FUTURE_BOOTSTRAP, 0);
    });
    await check('mutationPerformed = false', () => {
      assert.strictEqual(plan.summary.mutationPerformed, false);
    });

    // Per-candidate classification / expected sidecar / missing fields
    const byName = Object.fromEntries(plan.candidates.map((c) => [c.slug, c]));

    await check('A: MISSING_SIDECAR + BLOCKED + expected sidecar path derived', () => {
      const c = byName.alpha;
      assert.strictEqual(c.sidecarStatus, 'MISSING_SIDECAR');
      assert.strictEqual(c.readiness, 'BLOCKED');
      assert.strictEqual(c.expectedSidecarPath, 'content/blogger/posts/20260101-alpha.publish.json');
      assert.ok(c.missingTruthFields.includes('blogger.publishedUrl'));
      assert.ok(c.missingTruthFields.includes('blogger.publishedAt'));
      assert.ok(c.missingTruthFields.includes('blogger.bloggerPostId'));
      assert.deepStrictEqual(c.knownTruthFields, []);
      assert.ok(c.blockingReasons.includes('sidecar file does not exist'));
      assert.ok(c.blockingReasons.some((r) => /human-supplied truth missing: blogger.publishedUrl/.test(r)));
    });

    await check('B: PRESENT_INCOMPLETE + BLOCKED (partial truth not treated as complete)', () => {
      const c = byName.bravo;
      assert.strictEqual(c.sidecarStatus, 'PRESENT_INCOMPLETE');
      assert.strictEqual(c.readiness, 'BLOCKED');
      assert.ok(c.missingTruthFields.includes('blogger.publishedUrl'));
      assert.ok(c.missingTruthFields.includes('blogger.publishedAt'));
      // sidecar-exists reason should NOT list "does not exist"
      assert.ok(!c.blockingReasons.some((r) => /does not exist/.test(r)));
    });

    await check('C: PRESENT_COMPLETE + NO_ACTION_REQUIRED (system-supplied gap only)', () => {
      const c = byName.charlie;
      assert.strictEqual(c.sidecarStatus, 'PRESENT_COMPLETE');
      assert.strictEqual(c.readiness, 'NO_ACTION_REQUIRED');
      // Human-supplied fields present
      assert.ok(c.knownTruthFields.includes('blogger.publishedUrl'));
      assert.ok(c.knownTruthFields.includes('blogger.publishedAt'));
      // System-supplied field still missing — informational
      assert.ok(c.missingTruthFields.includes('blogger.bloggerPostId'));
      assert.deepStrictEqual(c.blockingReasons, []);
    });

    await check('D: INVALID_SIDECAR + BLOCKED (JSON parse failure classified)', () => {
      const c = byName.delta;
      assert.strictEqual(c.sidecarStatus, 'INVALID_SIDECAR');
      assert.strictEqual(c.readiness, 'BLOCKED');
      assert.ok(c.blockingReasons.some((r) => /sidecar JSON parse error/.test(r)));
    });

    await check('H: second MISSING_SIDECAR candidate present (deterministic sort)', () => {
      const c = byName.hotel;
      assert.strictEqual(c.sidecarStatus, 'MISSING_SIDECAR');
      assert.strictEqual(c.readiness, 'BLOCKED');
    });

    await check('non-candidates E/F/G excluded', () => {
      const slugs = plan.candidates.map((c) => c.slug);
      assert.ok(!slugs.includes('echo'));
      assert.ok(!slugs.includes('foxtrot'));
      assert.ok(!slugs.includes('golf'));
    });

    await check('required truth fields ordering fixed for all candidates', () => {
      const expectedOrder = REQUIRED_TRUTH_FIELDS.map((s) => s.field);
      for (const c of plan.candidates) {
        const seenOrder = c.requiredTruthFields.map((s) => s.field);
        assert.deepStrictEqual(seenOrder, expectedOrder);
      }
    });

    await check('every truth field has a role of human-supplied or system-supplied', () => {
      const validRoles = new Set(['human-supplied', 'system-supplied']);
      for (const c of plan.candidates) {
        for (const t of c.requiredTruthFields) {
          assert.ok(validRoles.has(t.role), `bad role ${t.role} on ${c.slug}/${t.field}`);
        }
      }
    });

    await check('bloggerPostId classified system-supplied (never human backfill)', () => {
      const spec = REQUIRED_TRUTH_FIELDS.find((s) => s.field === 'blogger.bloggerPostId');
      assert.strictEqual(spec.role, 'system-supplied');
    });

    await check('planner produces stable output on repeated calls (determinism)', async () => {
      const p1 = await planMissingSidecars({ repoRoot: tmpRoot, contentRoot });
      const p2 = await planMissingSidecars({ repoRoot: tmpRoot, contentRoot });
      assert.strictEqual(formatJson(p1), formatJson(p2));
    });

    // ── JSON contract ───────────────────────────────────────────────────────
    const jsonStr = formatJson(plan);
    await check('JSON output is valid JSON', () => {
      assert.ok(typeof JSON.parse(jsonStr) === 'object');
    });
    await check('JSON top-level has schemaVersion === 1', () => {
      const j = JSON.parse(jsonStr);
      assert.strictEqual(j.schemaVersion, 1);
    });
    await check('JSON top-level has mode === "report-only"', () => {
      const j = JSON.parse(jsonStr);
      assert.strictEqual(j.mode, 'report-only');
    });
    await check('JSON contains no generatedAt / timestamp fields', () => {
      assert.ok(!/"generatedAt"/.test(jsonStr));
      assert.ok(!/"timestamp"/.test(jsonStr));
      assert.ok(!/"asOf"/.test(jsonStr));
    });
    await check('JSON contains no absolute machine path', () => {
      // Windows drive letters like "D:\\" or POSIX "/tmp/..." style absolute paths
      assert.ok(!/[A-Za-z]:[\\/]/i.test(jsonStr), `JSON contains drive-letter absolute path: ${jsonStr}`);
      // POSIX-style rooted paths in sourcePath/expectedSidecarPath values:
      const j = JSON.parse(jsonStr);
      for (const c of j.candidates) {
        assert.ok(!c.sourcePath.startsWith('/'), `sourcePath absolute: ${c.sourcePath}`);
        assert.ok(!c.expectedSidecarPath.startsWith('/'), `expectedSidecarPath absolute: ${c.expectedSidecarPath}`);
      }
    });
    await check('JSON contains no guessed publication truth (no https:// blogspot URLs beyond fixture C)', () => {
      // Only fixture C (charlie) legitimately has a published URL; A/B/D/H must not include invented URLs.
      const j = JSON.parse(jsonStr);
      for (const c of j.candidates) {
        if (c.slug === 'charlie') continue;
        assert.ok(
          !/https?:\/\//.test(JSON.stringify(c)),
          `${c.slug} entry contains an unexpected URL: ${JSON.stringify(c)}`,
        );
      }
    });

    // ── No-write guarantee ───────────────────────────────────────────────────
    const after = snapshotTree(contentRoot);
    await check('no-write: fixture file list unchanged', () => {
      const beforeRel = before.map((f) => f.rel);
      const afterRel = after.map((f) => f.rel);
      assert.deepStrictEqual(afterRel, beforeRel);
    });
    await check('no-write: fixture file bytes unchanged', () => {
      const beforeByRel = Object.fromEntries(before.map((f) => [f.rel, f.bytes]));
      const afterByRel = Object.fromEntries(after.map((f) => [f.rel, f.bytes]));
      assert.deepStrictEqual(afterByRel, beforeByRel);
    });
    await check('no-write: fixture mtimes unchanged', () => {
      const beforeMt = Object.fromEntries(before.map((f) => [f.rel, f.mtimeMs]));
      const afterMt = Object.fromEntries(after.map((f) => [f.rel, f.mtimeMs]));
      assert.deepStrictEqual(afterMt, beforeMt);
    });
    await check('no-write: planner did not create any new .publish.json', () => {
      const afterInv = snapshotSidecarInventory(contentRoot);
      const beforeSet = new Set(beforeInv.map((s) => s.rel));
      const afterSet = new Set(afterInv.map((s) => s.rel));
      assert.deepStrictEqual([...afterSet].sort(), [...beforeSet].sort());
    });
    await check('no-write: no dist-blogger-preview/ under fixture root', () => {
      assert.ok(!existsSync(path.join(tmpRoot, 'dist-blogger-preview')));
    });

    // ── parseArgs contract ──────────────────────────────────────────────────
    await check('parseArgs: --help sets help=true', () => {
      const o = parseArgs(['node', 'cli', '--help']);
      assert.strictEqual(o.help, true);
    });
    await check('parseArgs: --json sets json=true', () => {
      const o = parseArgs(['node', 'cli', '--json']);
      assert.strictEqual(o.json, true);
    });
    await check('parseArgs: --write collected into forbidden', () => {
      const o = parseArgs(['node', 'cli', '--write']);
      assert.ok(o.forbidden.includes('--write'));
    });
    await check('parseArgs: --apply collected into forbidden', () => {
      const o = parseArgs(['node', 'cli', '--apply']);
      assert.ok(o.forbidden.includes('--apply'));
    });
    await check('parseArgs: --force collected into forbidden', () => {
      const o = parseArgs(['node', 'cli', '--force']);
      assert.ok(o.forbidden.includes('--force'));
    });
    await check('parseArgs: --yes / --create-sidecar / --output / --out / --fix all forbidden', () => {
      const o = parseArgs(['node', 'cli', '--yes', '--create-sidecar', '--output', '--out', '--fix']);
      assert.ok(o.forbidden.includes('--yes'));
      assert.ok(o.forbidden.includes('--create-sidecar'));
      assert.ok(o.forbidden.includes('--output'));
      assert.ok(o.forbidden.includes('--out'));
      assert.ok(o.forbidden.includes('--fix'));
    });
    await check('parseArgs: forbidden also caught in --flag=value form', () => {
      const o = parseArgs(['node', 'cli', '--write=1']);
      assert.ok(o.forbidden.includes('--write'));
    });
    await check('parseArgs: unknown flag captured (not silently accepted)', () => {
      const o = parseArgs(['node', 'cli', '--totally-fake-flag']);
      assert.ok(o.unknown.includes('--totally-fake-flag'));
    });

    // ── CLI subprocess: --help / --json / forbidden ─────────────────────────
    function runCli(args) {
      const r = spawnSync(process.execPath, [CLI, ...args], {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        shell: false,
        windowsHide: true,
      });
      return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
    }

    await check('CLI --help: exit 0 + mentions "never creates or modifies"', () => {
      const r = runCli(['--help']);
      assert.strictEqual(r.status, 0);
      assert.ok(/never creates or modifies/i.test(r.stdout), `help missing no-write clause: ${r.stdout}`);
    });
    await check('CLI --help: mentions "explicit authorization"', () => {
      const r = runCli(['--help']);
      assert.ok(/explicit(ly)? authoriz/i.test(r.stdout), `help missing auth clause: ${r.stdout}`);
    });

    for (const flag of ['--write', '--apply', '--force', '--yes', '--create-sidecar', '--output', '--out', '--fix']) {
      await check(`CLI ${flag}: hard-fail exit 1 (never silently accepted)`, () => {
        const r = runCli([flag]);
        assert.strictEqual(r.status, 1, `flag=${flag} unexpected exit ${r.status}: ${r.stdout}${r.stderr}`);
        assert.ok(/forbidden write flag/i.test(r.stderr), `flag=${flag} stderr: ${r.stderr}`);
      });
    }

    // ── CLI real-repo smoke (read-only against production repo) ─────────────
    // Snapshot production sidecar bytes/mtime + directory listing; re-check after both runs.
    const prodPostsDir = path.join(REPO_ROOT, 'content', 'blogger', 'posts');
    const prodInvBefore = snapshotSidecarInventory(prodPostsDir);

    await check('CLI real-repo human-readable: exit 0 + non-empty stdout', () => {
      const r = runCli([]);
      assert.strictEqual(r.status, 0, `stderr: ${r.stderr}`);
      assert.ok(/plan-blogger-backfill-sidecars/.test(r.stdout));
      assert.ok(/Mutation performed:\s+NO/.test(r.stdout));
    });
    await check('CLI real-repo --json: exit 0 + parseable JSON', () => {
      const r = runCli(['--json']);
      assert.strictEqual(r.status, 0, `stderr: ${r.stderr}`);
      const j = JSON.parse(r.stdout);
      assert.strictEqual(j.schemaVersion, 1);
      assert.strictEqual(j.mode, 'report-only');
      assert.ok(j.candidateCount >= 1, `expected at least 1 real-repo candidate, got ${j.candidateCount}`);
    });
    await check('CLI real-repo: production sidecar inventory unchanged after both runs', () => {
      const prodInvAfter = snapshotSidecarInventory(prodPostsDir);
      const beforeMap = Object.fromEntries(prodInvBefore.map((s) => [s.rel, s.bytes]));
      const afterMap = Object.fromEntries(prodInvAfter.map((s) => [s.rel, s.bytes]));
      assert.deepStrictEqual(Object.keys(afterMap).sort(), Object.keys(beforeMap).sort());
      for (const rel of Object.keys(beforeMap)) {
        assert.strictEqual(afterMap[rel], beforeMap[rel], `bytes changed for ${rel}`);
      }
    });
    await check('CLI real-repo: production sidecar mtimes unchanged after both runs', () => {
      const prodInvAfter = snapshotSidecarInventory(prodPostsDir);
      const beforeMt = Object.fromEntries(prodInvBefore.map((s) => [s.rel, s.mtimeMs]));
      const afterMt = Object.fromEntries(prodInvAfter.map((s) => [s.rel, s.mtimeMs]));
      assert.deepStrictEqual(afterMt, beforeMt);
    });

    // ── Source-level: planner has no write API ──────────────────────────────
    await check('source: planner does not import write APIs from node:fs', () => {
      assert.ok(!/\bfs\.writeFile\b/.test(CLI_SRC), 'planner must not use fs.writeFile');
      assert.ok(!/\bfs\.appendFile\b/.test(CLI_SRC), 'planner must not use fs.appendFile');
      assert.ok(!/\bfs\.mkdir\b/.test(CLI_SRC), 'planner must not use fs.mkdir');
      assert.ok(!/\bfs\.rename\b/.test(CLI_SRC), 'planner must not use fs.rename');
      assert.ok(!/\bfs\.rm\b/.test(CLI_SRC), 'planner must not use fs.rm');
      assert.ok(!/\bfs\.unlink\b/.test(CLI_SRC), 'planner must not use fs.unlink');
      assert.ok(!/\bfs\.copyFile\b/.test(CLI_SRC), 'planner must not use fs.copyFile');
    });
    await check('source: planner does not spawn child processes', () => {
      assert.ok(!/child_process/.test(CLI_SRC), 'planner must not import child_process');
      assert.ok(!/spawnSync|execSync|execFileSync/.test(CLI_SRC), 'planner must not spawn');
    });
    await check('source: planner does not perform network I/O', () => {
      assert.ok(!/\bfetch\s*\(/.test(CLI_SRC), 'planner must not call fetch()');
      assert.ok(!/https?:\/\//.test(CLI_SRC.replace(/https?:\/\/\{blogspot-domain\}/g, '')) ||
        /docs\//.test(CLI_SRC), 'planner must not embed live URLs beyond doc references');
      assert.ok(!/require\(['"]node:https?['"]\)/.test(CLI_SRC));
      assert.ok(!/from ['"]node:https?['"]/.test(CLI_SRC));
    });
    await check('source: planner does not import backfill CLI or Blogger API modules', () => {
      assert.ok(!/backfill-published-url/.test(CLI_SRC));
      assert.ok(!/googleapis|blogger\.googleapis|oauth/i.test(CLI_SRC));
    });
    await check('source: planner exposes fixed enums (SIDECAR_STATUSES / READINESS_STATES)', () => {
      assert.ok(SIDECAR_STATUSES.includes('MISSING_SIDECAR'));
      assert.ok(SIDECAR_STATUSES.includes('PRESENT_INCOMPLETE'));
      assert.ok(SIDECAR_STATUSES.includes('PRESENT_COMPLETE'));
      assert.ok(SIDECAR_STATUSES.includes('INVALID_SIDECAR'));
      assert.strictEqual(SIDECAR_STATUSES.length, 4);
      assert.ok(READINESS_STATES.includes('BLOCKED'));
      assert.ok(READINESS_STATES.includes('READY_FOR_FUTURE_BOOTSTRAP'));
      assert.ok(READINESS_STATES.includes('NO_ACTION_REQUIRED'));
      assert.ok(READINESS_STATES.includes('INVALID_SOURCE'));
      assert.strictEqual(READINESS_STATES.length, 4);
    });

    // ── formatHumanReadable smoke ───────────────────────────────────────────
    await check('human-readable output includes "Mutation performed: NO"', () => {
      const s = formatHumanReadable(plan);
      assert.ok(/Mutation performed:\s+NO/.test(s));
    });
    await check('human-readable output does not embed absolute paths', () => {
      const s = formatHumanReadable(plan);
      // Fixture temp dir absolute path must NOT leak (tmpRoot begins with drive letter or /)
      const tmpPrefix = tmpRoot.split(path.sep).join('/').split('/')[0];
      // Only fail if a full path segment like "content/blogger/posts/..." is absolute-ish; sourcePath is relative → OK
      for (const line of s.split('\n')) {
        assert.ok(!line.includes(tmpRoot.replace(/\\/g, '/')), `absolute fixture path leaked: ${line}`);
      }
    });

  } finally {
    try { rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  }

  console.log('');
  console.log(`[check:blogger-backfill-sidecar-plan] ${pass}/${pass + fail} PASS`);
  if (fail > 0) {
    console.error('\nFailures:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[check:blogger-backfill-sidecar-plan] UNEXPECTED ERROR: ${err.stack || err.message || err}`);
  process.exit(1);
});
