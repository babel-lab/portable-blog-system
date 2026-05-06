import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const VISIBLE_STATUS = new Set(['ready', 'published']);

function classify(data) {
  if (data.draft === true) return { include: false, reason: 'draft:true' };
  const status = data.status ?? 'draft';
  if (!VISIBLE_STATUS.has(status)) return { include: false, reason: `status:${status}` };
  return { include: true, reason: 'ok' };
}

function toRelative(absPath) {
  return path.relative(PROJECT_ROOT, absPath).split(path.sep).join('/');
}

export async function loadPosts({ site = 'github' } = {}) {
  const baseDir = path.join(PROJECT_ROOT, 'content', site, 'posts');
  const pattern = path.join(baseDir, '**/*.md').split(path.sep).join('/');

  const files = await fg(pattern, { absolute: true, onlyFiles: true });

  const posts = [];
  const filteredOut = [];

  for (const absPath of files) {
    const raw = await fs.readFile(absPath, 'utf-8');
    const { data, content } = matter(raw);

    const sourcePath = toRelative(absPath);
    const verdict = classify(data);

    if (!verdict.include) {
      filteredOut.push({
        sourcePath,
        id: data.id ?? null,
        slug: data.slug ?? null,
        status: data.status ?? null,
        draft: data.draft ?? null,
        reason: verdict.reason,
      });
      continue;
    }

    posts.push({
      ...data,
      sourcePath,
      bodyLength: content.length,
      body: content,
    });
  }

  posts.sort((a, b) => {
    const ad = a.date ?? '';
    const bd = b.date ?? '';
    if (ad === bd) return (a.slug ?? '').localeCompare(b.slug ?? '');
    return bd.localeCompare(ad);
  });

  return {
    site,
    totalScanned: files.length,
    totalReady: posts.length,
    totalFiltered: filteredOut.length,
    posts,
    filteredOut,
  };
}
