// Phase 20260527-night-2 Admin Write Infra §15.D.1
//   - reusable atomic write helper
//   - 流程：whitelist → git-status-check (caller 提供結果) → validators → tmp write → rename
//   - 失敗時清掉 .tmp；不留 partial write
//   - 不 spawn git；不寫 log file；caller 自行 console 輸出
//   - 不直接綁 Admin UI；CLI / future middleware 皆可 caller
//
// 預期 caller 用法（pseudo）：
//   const gitStatus = await checkGitStatus({ cwd: projectRoot });
//   const r = await safeWrite({
//     targetPath: absPath,
//     newContent: '...',
//     projectRoot,
//     validators: [(c) => fieldValidator(c)],
//     gitStatus,
//     enforceCleanGit: true,
//   });
//   if (!r.ok) { /* show reason / errors / dirtyFiles to user */ }

import fs from 'node:fs/promises';
import path from 'node:path';
import { isWriteAllowed } from './admin-write-whitelist.js';

export async function safeWrite({
  targetPath,
  newContent,
  projectRoot,
  validators = [],
  gitStatus = null,
  enforceCleanGit = true,
} = {}) {
  // 1. param sanity
  if (typeof targetPath !== 'string' || targetPath === '') {
    return { ok: false, reason: 'invalid-target-path' };
  }
  if (typeof newContent !== 'string') {
    return { ok: false, reason: 'new-content-must-be-string' };
  }
  if (typeof projectRoot !== 'string' || projectRoot === '') {
    return { ok: false, reason: 'invalid-project-root' };
  }
  if (!path.isAbsolute(projectRoot)) {
    return { ok: false, reason: 'project-root-must-be-absolute' };
  }

  // 2. whitelist
  const wl = isWriteAllowed(targetPath, projectRoot);
  if (!wl.ok) {
    return { ok: false, reason: 'whitelist-rejected', detail: wl.reason };
  }

  // 3. git status (caller-supplied; helper 不 spawn git per §15.D.1)
  if (enforceCleanGit) {
    if (!gitStatus || typeof gitStatus !== 'object') {
      return { ok: false, reason: 'git-status-required' };
    }
    if (gitStatus.ok === false) {
      return { ok: false, reason: 'git-status-not-ok', detail: gitStatus.reason };
    }
    if (gitStatus.clean !== true) {
      return {
        ok: false,
        reason: 'git-dirty',
        dirtyFiles: Array.isArray(gitStatus.dirtyFiles) ? gitStatus.dirtyFiles : [],
        untracked: Array.isArray(gitStatus.untracked) ? gitStatus.untracked : [],
      };
    }
  }

  // 4. validators
  if (!Array.isArray(validators)) {
    return { ok: false, reason: 'validators-must-be-array' };
  }
  const validatorErrors = [];
  for (const v of validators) {
    if (typeof v !== 'function') continue;
    let r;
    try {
      r = await v(newContent);
    } catch (err) {
      validatorErrors.push({ message: 'validator-threw', detail: err.message });
      break;
    }
    if (!r || r.ok !== true) {
      const errs = (r && Array.isArray(r.errors)) ? r.errors : (r && r.error ? [r.error] : ['unknown']);
      for (const e of errs) validatorErrors.push(e);
      break;
    }
  }
  if (validatorErrors.length > 0) {
    return { ok: false, reason: 'validator-failed', errors: validatorErrors };
  }

  // 5. atomic write (tmp + rename)
  const resolved = path.resolve(targetPath);
  const tmpPath = resolved + '.tmp';
  try {
    await fs.writeFile(tmpPath, newContent, 'utf-8');
    await fs.rename(tmpPath, resolved);
  } catch (err) {
    try { await fs.unlink(tmpPath); } catch (_) { /* ignore cleanup failure */ }
    return { ok: false, reason: 'write-failed', error: err.message };
  }

  return { ok: true, writtenPath: resolved, normalizedRel: wl.normalizedRel, kind: wl.kind };
}
