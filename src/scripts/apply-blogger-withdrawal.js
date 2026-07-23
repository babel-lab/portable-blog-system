#!/usr/bin/env node
// Phase 20260723-publish-target-stage Slice 4I：Blogger withdrawal — production apply CLI.
//
// 上位契約：
//   - docs/20260723-blogger-withdrawal-production-apply.md（本 Slice 契約）
//
// 目的：
//   Single-record production apply CLI wrapper。硬綁 project root
//   (/d/github/blog-new/portable-blog-system) 之實際 discovery 路徑；不接受任何 test root /
//   scratch root / dependency injection / hook 參數。所有 apply 邏輯位於
//   blogger-withdrawal-apply.js；本檔僅解析 argv、驗證 confirmation phrase、呼叫 API、
//   輸出 report、選擇 exit code。
//
// 安全契約（fail-closed；hard-coded）：
//   - CLI 必要 flags：--authorization / --apply / --confirm。
//   - --confirm 必須 verbatim 匹配 APPLY_CONFIRMATION_PHRASE（case-sensitive）；no yes / y / true。
//   - 禁止 flags（任一出現即 exit 2）：詳見 FORBIDDEN_FLAGS。
//   - --help exit 0；不執行 preflight / 不讀 authorization / 不寫檔。
//   - 重複 flag、未知 flag、位置參數、空 authorization path → exit 2。
//   - Redaction：stderr 不回顯 raw authorization path 內容；只顯示固定安全短碼。

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyBloggerWithdrawal,
  formatJson,
  formatHumanReadable,
  APPLY_CONFIRMATION_PHRASE,
  PROJECT_ROOT,
} from './blogger-withdrawal-apply.js';

const __filename = fileURLToPath(import.meta.url);

// forbidden flags：任一出現即 exit 2；含所有 test root / repo root / bypass / skip / hidden hook
//   / dependency injection / hook name / simulation / fault flag。
const FORBIDDEN_FLAGS = new Set([
  '--project-root', '--repo-root', '--test-root', '--scratch-root', '--temp-root',
  '--source', '--source-path', '--sidecar', '--sidecar-path',
  '--skip-preflight', '--skip-authorization', '--skip-validation', '--skip-fingerprint',
  '--force', '--yes', '-y', '--no-verify', '--ignore-dirty', '--ignore-head',
  '--ignore-hash', '--allow-remote-live', '--allow-live',
  '--hook', '--hooks', '--fault', '--simulate', '--test-mode',
  '--write', '--output', '--out', '--save', '--dry-run',
  '--commit', '--push', '--deploy', '--publish', '--restore', '--republish',
  '--api', '--approve', '--auto-approve',
]);

const USAGE = `Usage: apply-blogger-withdrawal \\
  --authorization <path-to-authorization.json> \\
  --apply \\
  --confirm "${APPLY_CONFIRMATION_PHRASE}" \\
  [--json] [--help]

Single-record Blogger withdrawal production apply. Given an operator-authored,
approved, apply-ready authorization document, mutates ONE Blogger sidecar
(\`content/blogger/posts/<slug>.publish.json\`) in place from status
"published" to "withdrawn". Uses raw-byte authorization binding, same-buffer
source/sidecar binding, in-directory sibling temp file, atomic rename,
read-back verification, rollback on read-back mismatch, and unconditional
cleanup with a redacted report.

Required:
  --authorization <path>      Path to the withdrawal authorization JSON.
  --apply                     Explicit gate; without it, the CLI refuses.
  --confirm "<phrase>"        Exact confirmation phrase. Must equal:
                              ${APPLY_CONFIRMATION_PHRASE}
                              (case-sensitive; yes/y/true are NOT accepted).

Options:
  --json                      Emit deterministic JSON report to stdout.
  --help / -h                 Print this usage.

This CLI:
  - performs a single-record apply only
  - never runs commit, push, build, deploy, or preview
  - never calls the Blogger / Google / GA4 / AdSense API
  - never touches the deploy repository
  - never modifies Markdown or any sidecar other than the authorized one
  - never accepts a project root / test root / dependency injection / hook

Forbidden flags (any occurrence → exit 2):
  --project-root, --repo-root, --test-root, --scratch-root, --temp-root,
  --source, --source-path, --sidecar, --sidecar-path,
  --skip-preflight, --skip-authorization, --skip-validation, --skip-fingerprint,
  --force, --yes, -y, --no-verify, --ignore-dirty, --ignore-head, --ignore-hash,
  --allow-remote-live, --allow-live,
  --hook, --hooks, --fault, --simulate, --test-mode,
  --write, --output, --out, --save, --dry-run,
  --commit, --push, --deploy, --publish, --restore, --republish,
  --api, --approve, --auto-approve

Exit codes:
  0   apply succeeded (ok:true / applyPerformed:true / productionMutationPerformed:true)
  1   apply refused / failed (blockers reported; sidecar either untouched or rolled back)
  2   CLI misuse (unknown / forbidden / duplicate / missing required flag)
`;

// ── argv parsing ─────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    help: false,
    json: false,
    authorization: null,
    authorizationCount: 0,
    apply: false,
    applyCount: 0,
    confirm: null,
    confirmCount: 0,
    forbidden: [],
    unknown: [],
    positional: [],
  };
  const take = (a, i) => (a.includes('=') ? a.slice(a.indexOf('=') + 1) : args[i + 1]);
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--help' || a === '-h') { opts.help = true; continue; }
    const bare = a.includes('=') ? a.slice(0, a.indexOf('=')) : a;
    if (a === '--json' || bare === '--json') { opts.json = true; continue; }
    if (bare === '--authorization') {
      opts.authorization = take(a, i);
      opts.authorizationCount += 1;
      if (!a.includes('=')) i += 1;
      continue;
    }
    if (bare === '--apply') {
      // --apply cannot take a value.
      if (a.includes('=')) { opts.unknown.push(a); continue; }
      opts.apply = true;
      opts.applyCount += 1;
      continue;
    }
    if (bare === '--confirm') {
      opts.confirm = take(a, i);
      opts.confirmCount += 1;
      if (!a.includes('=')) i += 1;
      continue;
    }
    if (FORBIDDEN_FLAGS.has(bare)) { opts.forbidden.push(bare); continue; }
    if (a.startsWith('-')) { opts.unknown.push(a); continue; }
    opts.positional.push(a);
  }
  return opts;
}

// ── CLI entry ────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (opts.forbidden.length > 0) {
    process.stderr.write(
      `[apply-blogger-withdrawal] ERROR: forbidden flag(s): ${opts.forbidden.join(', ')}\n`,
    );
    process.stderr.write('  This CLI has no test / bypass / injection surface.\n');
    return 2;
  }
  if (opts.unknown.length > 0) {
    process.stderr.write(
      `[apply-blogger-withdrawal] ERROR: unknown argument(s): ${opts.unknown.join(', ')}\n`,
    );
    process.stderr.write(USAGE);
    return 2;
  }
  if (opts.positional.length > 0) {
    process.stderr.write(
      `[apply-blogger-withdrawal] ERROR: positional argument(s) rejected: ${opts.positional.length}\n`,
    );
    process.stderr.write(USAGE);
    return 2;
  }
  if (opts.authorizationCount > 1) {
    process.stderr.write('[apply-blogger-withdrawal] ERROR: --authorization may appear at most once\n');
    return 2;
  }
  if (opts.applyCount > 1) {
    process.stderr.write('[apply-blogger-withdrawal] ERROR: --apply may appear at most once\n');
    return 2;
  }
  if (opts.confirmCount > 1) {
    process.stderr.write('[apply-blogger-withdrawal] ERROR: --confirm may appear at most once\n');
    return 2;
  }
  if (!opts.apply) {
    process.stderr.write('[apply-blogger-withdrawal] ERROR: --apply is required\n');
    process.stderr.write(USAGE);
    return 2;
  }
  if (opts.confirm === null || opts.confirm === undefined) {
    process.stderr.write('[apply-blogger-withdrawal] ERROR: --confirm <phrase> is required\n');
    process.stderr.write(USAGE);
    return 2;
  }
  if (opts.confirm !== APPLY_CONFIRMATION_PHRASE) {
    process.stderr.write('[apply-blogger-withdrawal] ERROR: confirmation phrase mismatch\n');
    return 2;
  }
  if (typeof opts.authorization !== 'string' || opts.authorization === '') {
    process.stderr.write('[apply-blogger-withdrawal] ERROR: --authorization <path> is required\n');
    process.stderr.write(USAGE);
    return 2;
  }

  const authorizationPath = path.isAbsolute(opts.authorization)
    ? opts.authorization
    : path.resolve(process.cwd(), opts.authorization);

  const result = await applyBloggerWithdrawal({
    projectRoot: PROJECT_ROOT,
    authorizationPath,
  });

  if (opts.json) {
    process.stdout.write(formatJson(result));
  } else {
    process.stdout.write(formatHumanReadable(result));
  }
  return result.ok ? 0 : 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main()
    .then((code) => process.exit(typeof code === 'number' ? code : 0))
    .catch(() => {
      process.stderr.write('[apply-blogger-withdrawal] ERROR: unexpected-internal-error\n');
      process.exit(1);
    });
}
