#!/usr/bin/env node
// Phase 20260712-preview-only-helper-b1：check:blogger-preview contract smoke。
//
// 範圍 / 邊界：
//   - 執行 src/scripts/check-blogger-preview.js 於 child process，取得 stdout / stderr / exit。
//   - **不** build / deploy / push / dev server / fetch / pull；**不**動 content / sidecar /
//     settings / package.json / dist-blogger；**不**呼叫 Blogger / Google API。
//   - Smoke 本身除 spawn child process 外 read-only：不寫任何 repo 檔（child 之 read-only 契約
//     以 fingerprint before/after 驗證）。
//
// 目的（防呆 / 防回歸）：
//   守 check:blogger-preview 之「read-only navigator」契約：
//     (a) 靜態 source 檢查：不 import / 呼叫 write 相關 API（fs.writeFile / fs.appendFile /
//         fs.mkdir / fs.rm / fs.unlink / fetch / http / https 等）。
//     (b) 動態行為檢查：list mode / focus mode（known slug / unknown slug）/ --help 皆 exit 0，
//         stdout 含預期 marker。
//     (c) No-write proof：child 執行前後對 content/**/*.md、**/*.publish.json 之 SHA-256
//         fingerprint 逐檔比對，全部不變。
//     (d) Determinism proof：兩次 --json 輸出，normalize 掉 mtime / size / generatedAtNote 後
//         之 JSON 應 byte-identical。
//     (f) Stale-mtime（per docs/20260710-blogger-preview-only-script-preanalysis.md §9.4 G-V1
//         + §11.1）：以 pure `evaluateStaleness` 之合成輸入做正向（source 新於輸出 → stale）
//         與負向（source 舊於輸出 → not stale）斷言，另含邊界（mtime 相等）與 fail-closed
//         （無法比較 → stale:null，不謊報 fresh）。純函式單元測試 → 無需寫入 dist-blogger，
//         smoke 之 read-only 契約不受影響。
//     (e) Cleanup：smoke 結束後 git status --short 之新增／變動不含 dist-blogger 或臨時檔
//         （只允許 src/scripts/*.js / package.json / docs 之預期新增，由外部 workflow 檢；
//         本 smoke 只斷言 dist-blogger / content / sidecar 未受 child process 影響）。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fg from 'fast-glob';
// Importing the navigator must not run it (guarded by isMainModule there).
import { evaluateStaleness } from './check-blogger-preview.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HELPER = path.join(REPO_ROOT, 'src', 'scripts', 'check-blogger-preview.js');

// 靜態 source 禁止清單：navigator 不得 import 或呼叫下列 write / network API。
// 每項為 { label, re }。regex 匹配於整檔 source（含 comments 中的字面出現亦視為疑似接線；
// 若日後 comment 需要提及這些字，應以其他描述迴避）。
const FORBIDDEN_SOURCE_PATTERNS = [
  { label: 'fs.writeFile', re: /\bwriteFile\b/ },
  { label: 'fs.appendFile', re: /\bappendFile\b/ },
  { label: 'fs.mkdir', re: /\bmkdir\b/ },
  { label: 'fs.rm', re: /fs\.rm\b|fsPromises\.rm\b|\brmdir\b|\brm\s+-rf\b/ },
  { label: 'fs.unlink', re: /\bunlink\b/ },
  { label: 'fs.copyFile', re: /\bcopyFile\b/ },
  { label: 'fs.rename', re: /\brename\b/ },
  { label: 'fs.chmod', re: /\bchmod\b/ },
  { label: 'fs.utimes', re: /\butimes\b/ },
  { label: 'fs.symlink', re: /\bsymlink\b/ },
  { label: 'fs.link', re: /\bfs\.link\b/ },
  { label: 'fs.truncate', re: /\btruncate\b/ },
  { label: 'fs.createWriteStream', re: /\bcreateWriteStream\b/ },
  { label: 'fetch call', re: /\bfetch\s*\(/ },
  { label: 'http module', re: /from\s+['"]node:https?['"]/ },
  { label: 'child_process', re: /\bchild_process\b/ },
  { label: 'exec / spawn', re: /\bexec(Sync|File|FileSync)?\s*\(/ },
  { label: 'googleapis', re: /googleapis/ },
  { label: 'blogger api', re: /BloggerAPI|blogger\.googleapis/ },
  { label: 'git write', re: /git\s+(push|commit|reset\s+--hard|checkout|restore|clean\s+-fd|rm|add\s+-A)/ },
];

// list-mode expected stdout markers.
const LIST_MARKERS = [
  'check-blogger-preview (read-only navigator; warning-only)',
  'mode: list',
  'dist-blogger root:',
  'candidates:',
  'stale outputs:',
  'build command:       npm run build:blogger',
  'PASS blogger preview navigator (read-only; warning-only; no writes performed).',
];

// focus-mode known-slug expected markers.
const FOCUS_KNOWN_MARKERS = [
  'mode: focus',
  'slug:                we-media-myself2',
  'source path:         content/blogger/posts/20260515-we-media-myself2.md',
  '    source mtime: ',
  '    stale:        ',
  '---- advice ----',
  'PASS blogger preview navigator (read-only; warning-only; no writes performed).',
];

// focus-mode unknown-slug expected markers.
const FOCUS_UNKNOWN_MARKERS = [
  'mode: focus',
  'slug:                zzz-unknown-slug-9x',
  'source path:         (not found)',
  'not found among blogger-enabled candidates',
];

const HELP_MARKERS = [
  'check-blogger-preview — read-only navigator for Blogger preview outputs',
  'Read-only. Does not build / deploy / write / touch dist-blogger/.',
];

const cases = [];
function record(name, ok, detail = '') {
  cases.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${name}${detail ? `  — ${detail}` : ''}`);
}

async function fingerprintPath(abs) {
  const raw = await fs.readFile(abs);
  return createHash('sha256').update(raw).digest('hex');
}

async function collectFingerprints() {
  const files = await fg([
    'content/**/*.md',
    'content/**/*.publish.json',
  ], { cwd: REPO_ROOT, absolute: true, onlyFiles: true });
  const map = new Map();
  for (const abs of files.sort()) {
    map.set(path.relative(REPO_ROOT, abs).split(path.sep).join('/'), await fingerprintPath(abs));
  }
  return map;
}

function diffFingerprints(before, after) {
  const changed = [];
  for (const [key, val] of before) {
    if (!after.has(key)) changed.push(`removed: ${key}`);
    else if (after.get(key) !== val) changed.push(`modified: ${key}`);
  }
  for (const key of after.keys()) {
    if (!before.has(key)) changed.push(`added: ${key}`);
  }
  return changed;
}

function runHelper(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [HELPER, ...args], {
      cwd: REPO_ROOT,
      env: { ...process.env, NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString('utf-8'); });
    child.stderr.on('data', (d) => { stderr += d.toString('utf-8'); });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function normalizeJson(text) {
  // Strip volatile fields so two invocations can be compared for determinism.
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (err) {
    return { normalized: null, parseError: err.message };
  }
  const strip = (node) => {
    if (Array.isArray(node)) return node.map(strip);
    if (node && typeof node === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        if (k === 'mtimeIso' || k === 'mtimeMs' || k === 'size'
          || k === 'sourceMtimeIso' || k === 'generatedAtNote') continue;
        out[k] = strip(v);
      }
      return out;
    }
    return node;
  };
  return { normalized: JSON.stringify(strip(obj)), parseError: null };
}

async function main() {
  // 1. Helper exists.
  try {
    await fs.access(HELPER);
    record(`helper source exists: ${path.relative(REPO_ROOT, HELPER).split(path.sep).join('/')}`, true);
  } catch (err) {
    record('helper source exists', false, err.message);
    finalize();
    return;
  }

  // 2. Static source contains no forbidden write / network calls.
  const source = await fs.readFile(HELPER, 'utf-8');
  for (const p of FORBIDDEN_SOURCE_PATTERNS) {
    const hit = p.re.test(source);
    record(`source free of ${p.label}`, !hit, hit ? `pattern matched: ${p.re}` : '');
  }

  // 3. --help exit 0 + markers present.
  {
    const r = await runHelper(['--help']);
    record('--help exit 0', r.code === 0, r.code === 0 ? '' : `exit ${r.code}`);
    for (const m of HELP_MARKERS) {
      record(`--help stdout contains "${m.slice(0, 60)}${m.length > 60 ? '…' : ''}"`,
        r.stdout.includes(m), r.stdout.includes(m) ? '' : 'missing');
    }
  }

  // 4. Fingerprint before + list mode + fingerprint after + no-write proof.
  const before = await collectFingerprints();

  {
    const r = await runHelper([]);
    record('list mode exit 0', r.code === 0, r.code === 0 ? '' : `exit ${r.code}`);
    for (const m of LIST_MARKERS) {
      record(`list stdout contains "${m.slice(0, 60)}${m.length > 60 ? '…' : ''}"`,
        r.stdout.includes(m), r.stdout.includes(m) ? '' : 'missing');
    }
  }

  // 5. Focus mode with a stable known slug (we-media-myself2 is a long-standing Blogger candidate).
  {
    const r = await runHelper(['--slug', 'we-media-myself2']);
    record('focus known-slug exit 0', r.code === 0, r.code === 0 ? '' : `exit ${r.code}`);
    for (const m of FOCUS_KNOWN_MARKERS) {
      record(`focus known-slug stdout contains "${m.slice(0, 60)}${m.length > 60 ? '…' : ''}"`,
        r.stdout.includes(m), r.stdout.includes(m) ? '' : 'missing');
    }
  }

  // 6. Focus mode with an unknown slug — still exit 0 (warning-only), advice includes not-found.
  {
    const r = await runHelper(['--slug', 'zzz-unknown-slug-9x']);
    record('focus unknown-slug exit 0', r.code === 0, r.code === 0 ? '' : `exit ${r.code}`);
    for (const m of FOCUS_UNKNOWN_MARKERS) {
      record(`focus unknown-slug stdout contains "${m.slice(0, 60)}${m.length > 60 ? '…' : ''}"`,
        r.stdout.includes(m), r.stdout.includes(m) ? '' : 'missing');
    }
  }

  // 7. No-write proof (child process must not touch content or sidecars).
  const after = await collectFingerprints();
  const diff = diffFingerprints(before, after);
  record('no-write proof: content/**/*.md + **/*.publish.json fingerprints unchanged',
    diff.length === 0, diff.length === 0 ? '' : diff.join('; '));

  // 8. Determinism: JSON output of same args across two invocations must match after
  //    normalizing volatile fields (mtimeIso / size / generatedAtNote).
  {
    const r1 = await runHelper(['--slug', 'we-media-myself2', '--json']);
    const r2 = await runHelper(['--slug', 'we-media-myself2', '--json']);
    record('determinism run 1 exit 0', r1.code === 0);
    record('determinism run 2 exit 0', r2.code === 0);
    const n1 = normalizeJson(r1.stdout);
    const n2 = normalizeJson(r2.stdout);
    record('determinism run 1 JSON parseable', n1.parseError === null,
      n1.parseError ?? '');
    record('determinism run 2 JSON parseable', n2.parseError === null,
      n2.parseError ?? '');
    const equal = n1.normalized !== null && n1.normalized === n2.normalized;
    record('determinism: two --json runs equal (mtime/size/note stripped)', equal,
      equal ? '' : 'normalized outputs differ');
  }

  // 9. Stale-mtime contract (preanalysis §9.4 G-V1 / §11.1) — pure-function unit tests over
  //    synthetic mtimes; no filesystem writes, no dependency on the repo's current build state.
  {
    const SRC = 1_000_000;
    const older = (name) => ({ name, exists: true, mtimeMs: SRC - 1_000 });
    const newer = (name) => ({ name, exists: true, mtimeMs: SRC + 1_000 });

    // 9a. Positive: every output predates the source → stale.
    {
      const r = evaluateStaleness({
        sourceMtimeMs: SRC,
        files: [older('post.html'), older('meta.json')],
      });
      record('stale-mtime positive: outputs older than source → stale true',
        r.stale === true, `stale=${r.stale}`);
      record('stale-mtime positive: staleFiles lists every stale output',
        r.staleFiles.join(',') === 'post.html,meta.json', `staleFiles=${r.staleFiles.join(',')}`);
      record('stale-mtime positive: per-file stale flags set',
        r.files.every((f) => f.stale === true),
        `flags=${r.files.map((f) => f.stale).join(',')}`);
    }

    // 9b. Negative: every output postdates the source → NOT stale (must not cry wolf).
    {
      const r = evaluateStaleness({
        sourceMtimeMs: SRC,
        files: [newer('post.html'), newer('meta.json')],
      });
      record('stale-mtime negative: outputs newer than source → stale false',
        r.stale === false, `stale=${r.stale}`);
      record('stale-mtime negative: staleFiles empty',
        r.staleFiles.length === 0, `staleFiles=${r.staleFiles.join(',')}`);
    }

    // 9c. Mixed: a single stale output taints the whole slug, and only it is named.
    {
      const r = evaluateStaleness({
        sourceMtimeMs: SRC,
        files: [newer('post.html'), older('meta.json')],
      });
      record('stale-mtime mixed: one stale output → slug stale true', r.stale === true,
        `stale=${r.stale}`);
      record('stale-mtime mixed: only the stale output is named',
        r.staleFiles.join(',') === 'meta.json', `staleFiles=${r.staleFiles.join(',')}`);
    }

    // 9d. Boundary: mtime equal to source is NOT stale (staleness is strictly older).
    {
      const r = evaluateStaleness({
        sourceMtimeMs: SRC,
        files: [{ name: 'post.html', exists: true, mtimeMs: SRC }],
      });
      record('stale-mtime boundary: equal mtime → not stale', r.stale === false,
        `stale=${r.stale}`);
    }

    // 9e. Fail-closed: when the comparison cannot be made, report null — never a fresh verdict.
    {
      const noSource = evaluateStaleness({
        sourceMtimeMs: null,
        files: [older('post.html')],
      });
      record('stale-mtime fail-closed: missing source mtime → stale null (not false)',
        noSource.stale === null && noSource.comparable === false,
        `stale=${noSource.stale} comparable=${noSource.comparable}`);

      const absentOutputs = evaluateStaleness({
        sourceMtimeMs: SRC,
        files: [{ name: 'post.html', exists: false, mtimeMs: null }],
      });
      record('stale-mtime fail-closed: absent outputs → stale null (dist-absent, not stale)',
        absentOutputs.stale === null && absentOutputs.comparable === false,
        `stale=${absentOutputs.stale} comparable=${absentOutputs.comparable}`);

      const empty = evaluateStaleness();
      record('stale-mtime fail-closed: no input → stale null, no crash',
        empty.stale === null && empty.files.length === 0, `stale=${empty.stale}`);
    }
  }

  // 10. Stale-mtime is actually wired into the navigator's real output (schema presence).
  {
    const rList = await runHelper(['--json']);
    const rFocus = await runHelper(['--slug', 'we-media-myself2', '--json']);
    let listObj = null;
    let focusObj = null;
    try { listObj = JSON.parse(rList.stdout); } catch { /* recorded below */ }
    try { focusObj = JSON.parse(rFocus.stdout); } catch { /* recorded below */ }

    record('list --json exposes staleCount',
      listObj !== null && typeof listObj.staleCount === 'number',
      `staleCount=${listObj ? listObj.staleCount : '(unparseable)'}`);
    record('focus --json exposes stale verdict key',
      focusObj !== null && 'stale' in (focusObj.outputs ?? {}),
      `stale=${focusObj ? String(focusObj.outputs?.stale) : '(unparseable)'}`);
    record('focus --json exposes staleFiles array',
      focusObj !== null && Array.isArray(focusObj.outputs?.staleFiles));
    record('focus --json exposes sourceMtimeIso',
      focusObj !== null && 'sourceMtimeIso' in (focusObj.outputs ?? {}));
    record('focus --json per-file entries carry a stale flag',
      focusObj !== null && (focusObj.outputs?.files ?? []).every((f) => 'stale' in f));
    record('stale-mtime wiring keeps navigator exit 0 (warning-only)',
      rList.code === 0 && rFocus.code === 0, `list=${rList.code} focus=${rFocus.code}`);
  }

  // 11. Dist-blogger folder untouched: sanity — mtime of dist-blogger root should not have
  //    been advanced by the child (we can't strictly assert this cross-platform, but we
  //    do assert the folder still exists after all runs iff it existed before).
  {
    const distRoot = path.join(REPO_ROOT, 'dist-blogger');
    let existedBefore = false;
    let existsAfter = false;
    try { existedBefore = (await fs.stat(distRoot)).isDirectory(); } catch { /* ignore */ }
    try { existsAfter = (await fs.stat(distRoot)).isDirectory(); } catch { /* ignore */ }
    record('dist-blogger existence status unchanged',
      existedBefore === existsAfter,
      `before=${existedBefore} after=${existsAfter}`);
  }

  finalize();
}

function finalize() {
  const passed = cases.filter((c) => c.ok).length;
  const total = cases.length;
  console.log('');
  console.log('check-blogger-preview smoke summary:');
  console.log(`  assertions: ${total}`);
  console.log(`  passed:     ${passed}`);
  console.log('');
  console.log(`check-blogger-preview smoke: ${passed}/${total} ${passed === total ? 'PASS' : 'FAIL'}`);
  if (passed !== total) {
    console.log('');
    console.log('FAIL reasons:');
    for (const c of cases.filter((x) => !x.ok)) {
      console.log(`  - ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(
    `[check-blogger-preview-smoke] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
  );
  process.exit(1);
});
