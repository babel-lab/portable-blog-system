// Phase 20260527-night-2 Admin Write Infra §15.D.4
//   - 保守白名單：只允許 content/{github,blogger}/posts/*.{md,publish.json,fb.md}
//   - 拒絕 dist / dist-blogger / gh-pages / settings / pages / validation-fixtures / package
//   - 拒絕相對路徑 / 跨 drive / .. traversal
//   - 字串比對 + path.resolve 雙層；不接受 client-supplied raw path
//
// Helper 屬純 path inspection；不 stat / 不 readlink；symlink 解析責任在 caller
// （未來 safe-write 可額外加 lstat 檢查；本批 scope 不含）。

import path from 'node:path';

const SITE_DIRS = new Set(['github', 'blogger']);

function classifyFilename(filename) {
  if (typeof filename !== 'string' || filename === '') return null;
  if (filename.includes('\0')) return null;
  if (filename.includes('..')) return null;
  if (filename.endsWith('.fb.md')) return 'fb-sidecar';
  if (filename.endsWith('.publish.json')) return 'publish-json';
  if (filename.endsWith('.md')) return 'post-md';
  return null;
}

export function isWriteAllowed(targetPath, projectRoot) {
  if (typeof targetPath !== 'string' || targetPath === '') {
    return { ok: false, reason: 'invalid-target-path' };
  }
  if (typeof projectRoot !== 'string' || projectRoot === '') {
    return { ok: false, reason: 'invalid-project-root' };
  }
  if (!path.isAbsolute(targetPath)) {
    return { ok: false, reason: 'target-must-be-absolute' };
  }
  if (!path.isAbsolute(projectRoot)) {
    return { ok: false, reason: 'project-root-must-be-absolute' };
  }

  const resolved = path.resolve(targetPath);
  const normalizedRoot = path.resolve(projectRoot);
  const rel = path.relative(normalizedRoot, resolved);

  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    return { ok: false, reason: 'outside-project-root' };
  }

  const parts = rel.split(/[\\/]/);
  if (parts.length !== 4) {
    return { ok: false, reason: 'not-in-posts-folder' };
  }
  if (parts[0] !== 'content') {
    return { ok: false, reason: 'not-in-content-folder' };
  }
  if (!SITE_DIRS.has(parts[1])) {
    return { ok: false, reason: 'site-folder-not-allowed' };
  }
  if (parts[2] !== 'posts') {
    return { ok: false, reason: 'not-in-posts-folder' };
  }

  const kind = classifyFilename(parts[3]);
  if (!kind) {
    return { ok: false, reason: 'filename-extension-not-allowed' };
  }

  return {
    ok: true,
    normalizedRel: rel,
    site: parts[1],
    filename: parts[3],
    kind,
  };
}
