// Phase 20260527-night-2 Admin Write Infra §15.D.2
//   - spawn `git status --porcelain` → parse → return { ok, clean, dirtyFiles[], untracked[] }
//   - 不自動 stash / reset / restore
//   - 不寫入；不修改 git 狀態
//   - timeout 預設 5 秒；超時回 ok:false reason:'git-timeout'
//   - 任何 spawn / exit 失敗 → ok:false；caller 應依 ok 判斷
//
// 注意：此 helper 不被 safe-write 內部呼叫；caller 須先 await checkGitStatus，
// 再把結果傳給 safeWrite({ gitStatus })。設計 per §15.D.1：
// 「safe-write 不 spawn git；git status check 由 caller 傳入結果」。

import { spawn } from 'node:child_process';

export function checkGitStatus({ cwd, timeoutMs = 5000 } = {}) {
  return new Promise((resolve) => {
    if (typeof cwd !== 'string' || cwd === '') {
      resolve({ ok: false, reason: 'invalid-cwd', clean: false, dirtyFiles: [], untracked: [] });
      return;
    }
    let proc;
    try {
      proc = spawn('git', ['status', '--porcelain'], { cwd, shell: false });
    } catch (err) {
      resolve({ ok: false, reason: 'git-spawn-throw', error: err.message, clean: false, dirtyFiles: [], untracked: [] });
      return;
    }

    let stdout = '';
    let stderr = '';
    let settled = false;
    const settle = (v) => { if (!settled) { settled = true; resolve(v); } };

    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) { /* ignore */ }
      settle({ ok: false, reason: 'git-timeout', clean: false, dirtyFiles: [], untracked: [] });
    }, timeoutMs);

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString('utf-8'); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString('utf-8'); });

    proc.on('error', (err) => {
      clearTimeout(timer);
      settle({ ok: false, reason: 'git-spawn-error', error: err.message, clean: false, dirtyFiles: [], untracked: [] });
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        settle({ ok: false, reason: 'git-exit-nonzero', code, stderr, clean: false, dirtyFiles: [], untracked: [] });
        return;
      }
      const lines = stdout.split('\n').filter((l) => l !== '');
      const dirtyFiles = [];
      const untracked = [];
      for (const line of lines) {
        if (line.startsWith('??')) {
          untracked.push(line.slice(3));
        } else {
          dirtyFiles.push(line.slice(3));
        }
      }
      const clean = dirtyFiles.length === 0 && untracked.length === 0;
      settle({ ok: true, clean, dirtyFiles, untracked });
    });
  });
}
