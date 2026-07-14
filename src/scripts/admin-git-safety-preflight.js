#!/usr/bin/env node
// Phase 20260714-C-pre：Admin lifecycle write-path 之 repository safety preflight（唯讀）。
//
// 背景 / 上位契約：
//   docs/20260714-admin-github-redraft-write-path-preflight.md §10 明列，未來 Phase C（local
//   apply, no Git automation）在寫回 status/draft 前，必須先通過 git-safety preflight：branch ==
//   main、main == origin/main（ahead/behind 0/0）、`.git/index.lock` 不存在（既有 write infra 只
//   查 clean-tree，缺這三項）。本檔即該 preflight 的 **reusable、read-only** 實作 —— 不寫檔、
//   不 mutation、不 fetch、不自動修復、不刪 lock、不 apply。
//
// 硬邊界（zero-write / zero-mutation；違反即設計錯誤）：
//   - 只跑明確的 read-only git 子命令（rev-parse / branch / rev-list / status）；**不** fetch /
//     pull / push / add / commit / reset / checkout / switch / restore / stash / clean / gc / rm /
//     merge / rebase / update-index / update-ref / init / apply / tag / remote / config。
//   - **不**寫 Markdown / sidecar / 任何檔；**不** build / deploy / 碰 gh-pages；**不** Blogger /
//     Google / GA4 / AdSense API；**不**啟用 `--apply`。
//   - `.git/index.lock` 若存在只回報 hard-fail，**絕不**刪除 / rename / truncate / 讀取內容。
//   - **不**執行 network fetch；origin/main 反映的是「目前本機 remote-tracking ref」，非遠端伺服器
//     即時最新狀態（human/json 皆明示 networkFetchPerformed:false）。
//
// 通過 preflight ≠ 已授權寫入。actual local apply（Phase C）/ commit-push（D）/ deploy（E）皆
// 未實作、皆 Dean-gated、各須另開 phase。
//
// 執行：
//   node src/scripts/admin-git-safety-preflight.js [--json]
//   （npm：`npm run admin:check-git-safety`）

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA_VERSION = 1;

// ── read-only git 子命令 allowlist（防禦性；所有 call site 皆內部固定）──────────────────
const ALLOWED_GIT_SUBCOMMANDS = new Set(['rev-parse', 'branch', 'rev-list', 'status']);
// 明確禁止的 mutation / network 子命令（僅作 defense-in-depth；正常不會被呼叫）。
const FORBIDDEN_GIT_SUBCOMMANDS = new Set([
  'fetch', 'pull', 'push', 'add', 'commit', 'reset', 'checkout', 'switch',
  'restore', 'stash', 'clean', 'gc', 'rm', 'mv', 'merge', 'rebase',
  'update-index', 'update-ref', 'init', 'apply', 'tag', 'remote', 'config',
  'cherry-pick', 'revert', 'am', 'format-patch', 'worktree', 'notes', 'reflog',
]);

// ── CLI 明確拒絕的危險參數（write / mutation / repair）────────────────────────────────
export const DANGEROUS_CLI_FLAGS = new Set([
  '--apply', '--write', '--fix', '--repair', '--unlock', '--delete-lock',
  '--reset', '--checkout', '--stash', '--clean', '--fetch', '--pull',
  '--push', '--commit', '--deploy',
]);

// ── 穩定的 failure → exit code 對照（deterministic；由 contract guard 鎖住）──────────────
export const FAILURE_EXIT = {
  'unsupported-argument': 2,
  'invalid-project-root': 10,
  'not-git-repository': 11,
  'repo-root-mismatch': 12,
  'wrong-branch': 13,
  'detached-head': 14,
  'unresolvable-head': 14,
  'missing-main-ref': 15,
  'missing-origin-main-ref': 16,
  'ahead-of-origin': 17,
  'behind-origin': 18,
  'diverged': 19,
  'dirty-working-tree': 20,
  'index-lock-present': 21,
  'git-command-failed': 22,
};

// failure 排序優先序（決定 exit code 選取與輸出順序；deterministic）。
const FAILURE_PRIORITY = {
  'invalid-project-root': 0,
  'not-git-repository': 1,
  'repo-root-mismatch': 2,
  'wrong-branch': 3,
  'detached-head': 4,
  'unresolvable-head': 5,
  'missing-main-ref': 6,
  'missing-origin-main-ref': 7,
  'diverged': 8,
  'ahead-of-origin': 9,
  'behind-origin': 10,
  'dirty-working-tree': 11,
  'index-lock-present': 12,
  'git-command-failed': 13,
  'unsupported-argument': 14,
};

// 執行單一 read-only git 命令。回 { ok, code, stdout, stderr }。
// 只允許 allowlist 內子命令；否則直接 refuse（不 spawn）。
export function runGit(args, cwd) {
  const sub = Array.isArray(args) ? args[0] : undefined;
  if (typeof sub !== 'string' || !ALLOWED_GIT_SUBCOMMANDS.has(sub) || FORBIDDEN_GIT_SUBCOMMANDS.has(sub)) {
    return { ok: false, code: -1, stdout: '', stderr: `refused non-read-only git subcommand: ${sub}` };
  }
  let res;
  try {
    res = spawnSync('git', args, {
      cwd,
      encoding: 'utf-8',
      shell: false,
      windowsHide: true,
      timeout: 10000,
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (err) {
    return { ok: false, code: -1, stdout: '', stderr: String(err && err.message ? err.message : err) };
  }
  if (res.error) return { ok: false, code: -1, stdout: '', stderr: String(res.error.message || res.error) };
  return { ok: res.status === 0, code: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

// 平台感知的路徑相等（win32 大小寫不敏感 + 分隔符正規化）。
export function samePath(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const na = path.resolve(a);
  const nb = path.resolve(b);
  if (process.platform === 'win32') return na.toLowerCase() === nb.toLowerCase();
  return na === nb;
}

// 解析 `git status --porcelain=v1 -z --untracked-files=all` 輸出。
// -z 以 NUL 分隔；rename/copy（XY 含 R/C）會多帶一個 source-path token（需跳過）。
// 回 [{ xy, path }]，path 為 repo-relative（git porcelain 恆為 repo-relative）。
export function parsePorcelainZ(out) {
  if (typeof out !== 'string' || out === '') return [];
  const tokens = out.split('\0');
  const entries = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (typeof tok !== 'string' || tok.length < 3) { i += 1; continue; }
    const xy = tok.slice(0, 2);
    const p = tok.slice(3);
    entries.push({ xy, path: p });
    // rename / copy 記錄的下一 token 為 source path（無 XY 前綴）→ 跳過。
    if (xy.includes('R') || xy.includes('C')) i += 2;
    else i += 1;
  }
  return entries;
}

// 依 FAILURE_PRIORITY 排序並定案 eligible。
function finalize(report) {
  report.failures.sort(
    (a, b) => (FAILURE_PRIORITY[a.code] ?? 99) - (FAILURE_PRIORITY[b.code] ?? 99),
  );
  report.eligible = report.failures.length === 0;
  return report;
}

function baseReport(projectRoot) {
  return {
    schemaVersion: SCHEMA_VERSION,
    mode: 'read-only-preflight',
    repositoryRoot: null,
    projectRoot: typeof projectRoot === 'string' ? projectRoot : null,
    branch: null,
    head: null,
    mainHead: null,
    originMainHead: null,
    ahead: null,
    behind: null,
    workingTreeClean: null,
    dirtyEntryCount: null,
    dirtyPaths: [],
    indexLockPresent: null,
    eligible: false,
    failures: [],
    warnings: [],
    networkFetchPerformed: false,
    writePerformed: false,
  };
}

// ── 核心：唯讀 repository safety 評估 ─────────────────────────────────────────────────
// 回固定 shape 的 report（見 baseReport）。純唯讀；無任何寫入 / mutation / network。
export function evaluatePreflight({ projectRoot } = {}) {
  const report = baseReport(projectRoot);
  const addFail = (code, message) => report.failures.push({ code, message });

  // 1. project root 合法性
  if (typeof projectRoot !== 'string' || projectRoot === '' || !path.isAbsolute(projectRoot)) {
    addFail('invalid-project-root', 'projectRoot 必須為非空絕對路徑');
    return finalize(report);
  }
  const normProjectRoot = path.resolve(projectRoot);
  report.projectRoot = normProjectRoot;
  if (!existsSync(normProjectRoot)) {
    addFail('invalid-project-root', `projectRoot 不存在：${normProjectRoot}`);
    return finalize(report);
  }

  // 2. 是否位於 git worktree（top-level 可解析）
  const top = runGit(['rev-parse', '--show-toplevel'], normProjectRoot);
  if (!top.ok || top.stdout.trim() === '') {
    addFail('not-git-repository', 'git rev-parse --show-toplevel 失敗：projectRoot 不在 git worktree 內');
    return finalize(report);
  }
  const repoRoot = path.resolve(top.stdout.trim());
  report.repositoryRoot = repoRoot;

  // 3. repository top-level 必須等於傳入 project root（不接受任意外部 / 上層 repository）
  if (!samePath(repoRoot, normProjectRoot)) {
    addFail(
      'repo-root-mismatch',
      `repository root (${repoRoot}) 與 project root (${normProjectRoot}) 不一致；不接受外部 / 上層 repository`,
    );
    return finalize(report);
  }

  // ── 收集 branch / refs（best-effort；null = 無法解析）─────────────────────────────
  const branchRes = runGit(['branch', '--show-current'], repoRoot);
  report.branch = branchRes.ok ? branchRes.stdout.trim() : null;

  const headRes = runGit(['rev-parse', '--verify', 'HEAD'], repoRoot);
  report.head = headRes.ok && headRes.stdout.trim() !== '' ? headRes.stdout.trim() : null;

  const mainRes = runGit(['rev-parse', '--verify', 'refs/heads/main'], repoRoot);
  report.mainHead = mainRes.ok && mainRes.stdout.trim() !== '' ? mainRes.stdout.trim() : null;

  const originRes = runGit(['rev-parse', '--verify', 'refs/remotes/origin/main'], repoRoot);
  report.originMainHead = originRes.ok && originRes.stdout.trim() !== '' ? originRes.stdout.trim() : null;

  // 4. branch gate（只允許 main；不自動 checkout）
  if (report.branch === 'main') {
    // eligible on this axis
  } else if (report.branch === '' || report.branch === null) {
    addFail('detached-head', 'HEAD 為 detached 或空 branch（git branch --show-current 無輸出）；不自動 checkout main');
  } else {
    addFail('wrong-branch', `目前 branch = ${report.branch}（僅允許 main）；不自動 checkout main`);
  }
  if (report.head === null) {
    addFail('unresolvable-head', 'HEAD 無法解析（可能為 unborn / 空 repository）');
  }

  // 5. main / origin/main refs 必須存在（本 session 不 fetch；檢查的是本機 remote-tracking ref）
  if (report.mainHead === null) {
    addFail('missing-main-ref', 'refs/heads/main 不存在');
  }
  if (report.originMainHead === null) {
    addFail('missing-origin-main-ref', 'refs/remotes/origin/main 不存在（未執行 network fetch）');
  }

  // 6. ahead / behind 必須 0 / 0（僅在兩 refs 皆存在時才有意義）
  if (report.mainHead && report.originMainHead) {
    const rl = runGit(['rev-list', '--left-right', '--count', 'main...origin/main'], repoRoot);
    if (!rl.ok) {
      addFail('git-command-failed', 'git rev-list --left-right --count main...origin/main 失敗');
    } else {
      const parts = rl.stdout.trim().split(/\s+/);
      const ahead = Number.parseInt(parts[0], 10);
      const behind = Number.parseInt(parts[1], 10);
      if (Number.isNaN(ahead) || Number.isNaN(behind)) {
        addFail('git-command-failed', `rev-list 輸出無法解析：${JSON.stringify(rl.stdout.trim())}`);
      } else {
        report.ahead = ahead;
        report.behind = behind;
        if (ahead > 0 && behind > 0) {
          addFail('diverged', `main 與 origin/main 已分岔（ahead ${ahead} / behind ${behind}）；不自動 pull / merge / reset`);
        } else if (ahead > 0) {
          addFail('ahead-of-origin', `main 領先 origin/main ${ahead} commit；不自動 push`);
        } else if (behind > 0) {
          addFail('behind-origin', `main 落後 origin/main ${behind} commit；不自動 pull / merge / reset`);
        }
      }
    }
  }

  // 7. working tree clean（涵蓋 staged / unstaged / untracked / deleted / renamed / conflicted）
  //    只採 git status 真實結果；.gitignore 排除者不視為 dirty（未加 --ignored）。
  const st = runGit(['status', '--porcelain=v1', '-z', '--untracked-files=all'], repoRoot);
  if (!st.ok) {
    addFail('git-command-failed', 'git status --porcelain=v1 -z 失敗');
  } else {
    const entries = parsePorcelainZ(st.stdout);
    report.dirtyEntryCount = entries.length;
    report.dirtyPaths = entries.map((e) => e.path); // repo-relative，非檔案內容
    report.workingTreeClean = entries.length === 0;
    if (entries.length > 0) {
      addFail('dirty-working-tree', `working tree 有 ${entries.length} 項未提交變更；不覆蓋 / 不 stash / 不 clean`);
    }
  }

  // 8. .git/index.lock 不存在（Git-aware 路徑解析；不假設固定位置）
  const lp = runGit(['rev-parse', '--git-path', 'index.lock'], repoRoot);
  if (!lp.ok) {
    addFail('git-command-failed', 'git rev-parse --git-path index.lock 失敗');
  } else {
    let lockPath = lp.stdout.trim();
    if (lockPath !== '' && !path.isAbsolute(lockPath)) lockPath = path.resolve(repoRoot, lockPath);
    const present = lockPath !== '' && existsSync(lockPath);
    report.indexLockPresent = present;
    if (present) {
      addFail(
        'index-lock-present',
        '.git/index.lock 存在（可能有 git 程序進行中）；請人工確認無 git process 後再處理，本工具不刪除 / 不修改 lock',
      );
    }
  }

  return finalize(report);
}

// exit code：eligible → 0；否則取排序後第一個 failure 的 exit code。
export function exitCodeFor(report) {
  if (report.eligible) return 0;
  const first = report.failures[0];
  if (!first) return 1;
  return FAILURE_EXIT[first.code] ?? 1;
}

// ── 輸出（human / json；deterministic；無 secrets / 無檔案內容 / 無 repo 外部絕對路徑）──
export function formatReport(report, { json = false } = {}) {
  if (json) {
    // 固定 key 順序。
    const ordered = {
      schemaVersion: report.schemaVersion,
      mode: report.mode,
      repositoryRoot: report.repositoryRoot,
      projectRoot: report.projectRoot,
      branch: report.branch,
      head: report.head,
      mainHead: report.mainHead,
      originMainHead: report.originMainHead,
      ahead: report.ahead,
      behind: report.behind,
      workingTreeClean: report.workingTreeClean,
      dirtyEntryCount: report.dirtyEntryCount,
      dirtyPaths: report.dirtyPaths,
      indexLockPresent: report.indexLockPresent,
      eligible: report.eligible,
      failures: report.failures,
      warnings: report.warnings,
      networkFetchPerformed: report.networkFetchPerformed,
      writePerformed: report.writePerformed,
    };
    return JSON.stringify(ordered, null, 2);
  }

  const short = (h) => (h ? h.slice(0, 7) : '—');
  const lines = [];
  lines.push('repository apply-safety preflight (read-only)');
  lines.push(`  repository root : ${report.repositoryRoot ?? '—'}`);
  lines.push(`  branch          : ${report.branch === null ? '—' : (report.branch === '' ? '(detached)' : report.branch)}`);
  lines.push(`  HEAD            : ${short(report.head)}`);
  lines.push(`  main            : ${short(report.mainHead)}`);
  lines.push(`  origin/main     : ${short(report.originMainHead)}`);
  lines.push(`  ahead / behind  : ${report.ahead ?? '—'} / ${report.behind ?? '—'}`);
  lines.push(`  working tree    : ${report.workingTreeClean === null ? '—' : (report.workingTreeClean ? 'clean' : 'dirty')}`);
  lines.push(`  dirty entries   : ${report.dirtyEntryCount ?? '—'}`);
  lines.push(`  .git/index.lock : ${report.indexLockPresent === null ? '—' : (report.indexLockPresent ? 'present' : 'absent')}`);
  lines.push(`  eligible        : ${report.eligible ? 'YES' : 'NO'}`);
  if (report.failures.length) {
    lines.push('  failure reasons :');
    for (const f of report.failures) lines.push(`    ✗ ${f.code} — ${f.message}`);
  }
  if (report.warnings.length) {
    lines.push('  warnings        :');
    for (const w of report.warnings) lines.push(`    ⚠ ${w.code ? `${w.code} — ` : ''}${w.message ?? ''}`);
  }
  lines.push('  network fetch performed : no');
  lines.push('  write performed         : no');
  lines.push('  note: 通過 preflight ≠ 已授權寫入；此工具唯讀、不自動修復、不刪除 index.lock、不 apply。');
  lines.push('  note: origin/main 為本機 remote-tracking ref（未執行 network fetch），非遠端伺服器即時最新狀態。');
  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────
function parseArgv(argv) {
  let json = false;
  for (const raw of Array.isArray(argv) ? argv : []) {
    if (typeof raw !== 'string') continue;
    const bare = raw.includes('=') ? raw.slice(0, raw.indexOf('=')) : raw;
    if (DANGEROUS_CLI_FLAGS.has(bare)) {
      return { ok: false, error: 'unsupported-argument', flag: bare };
    }
    if (raw === '--json') { json = true; continue; }
    if (raw === '--human') { json = false; continue; }
    return { ok: false, error: 'unsupported-argument', flag: raw };
  }
  return { ok: true, json };
}

export function runCli({ argv, projectRoot } = {}) {
  const parsed = parseArgv(argv);
  if (!parsed.ok) {
    const report = baseReport(projectRoot);
    report.failures.push({
      code: 'unsupported-argument',
      message: `不支援的參數：${parsed.flag}（此工具唯讀，不接受任何 write / apply / mutation / repair 參數）`,
    });
    report.eligible = false;
    return { exit: 2, stdout: formatReport(report, { json: parsed.json === true }), report };
  }
  const report = evaluatePreflight({ projectRoot });
  return { exit: exitCodeFor(report), stdout: formatReport(report, { json: parsed.json }), report };
}

function isMainModule() {
  if (!process.argv[1]) return false;
  const argvUrl = new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;
  return import.meta.url === argvUrl;
}

if (isMainModule()) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
  const { exit, stdout } = runCli({ argv: process.argv.slice(2), projectRoot: PROJECT_ROOT });
  process.stdout.write(stdout + '\n');
  process.exit(exit);
}
