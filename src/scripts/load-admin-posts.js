// Phase Admin-1-b：dev-mode-only Admin read-only loader
//   - 直接 glob content/{github,blogger}/posts/*.md（排除 .fb.md）
//   - 不沿用 load-posts.js 之 status filter（admin 需顯示 draft 含其他狀態）
//   - 不寫入任何檔案；不修改既有資料
//   - 不複製 build-blogger / build-github 之渲染邏輯
//   - 同時讀對應 .publish.json 與 .fb.md 之存在狀態（不解析 .fb.md 內文）

import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';

const SITES = ['github', 'blogger'];

async function readJsonSafe(jsonPath) {
  try {
    const txt = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function readFbSidecarMeta(fbPath) {
  try {
    const txt = await fs.readFile(fbPath, 'utf-8');
    const { data } = matter(txt);
    return { exists: true, enabled: Boolean(data?.enabled) };
  } catch {
    return { exists: false, enabled: false };
  }
}

async function loadOnePost(siteName, mdPath) {
  const md = await fs.readFile(mdPath, 'utf-8');
  const { data: fm } = matter(md);
  const baseNoExt = mdPath.replace(/\.md$/, '');
  const publishJson = await readJsonSafe(`${baseNoExt}.publish.json`);
  const fb = await readFbSidecarMeta(`${baseNoExt}.fb.md`);
  return { siteName, mdPath, fm: fm || {}, publishJson, fb };
}

function toAdminView({ siteName, mdPath, fm, publishJson, fb }, settings) {
  const slug = typeof fm.slug === 'string' ? fm.slug : '';
  const githubBase = (settings?.site?.githubSiteUrl || '').replace(/\/+$/, '');
  return {
    sourceSite: siteName,
    sourcePath: mdPath,
    id: typeof fm.id === 'string' ? fm.id : '',
    title: typeof fm.title === 'string' ? fm.title : '',
    titleEn: typeof fm.titleEn === 'string' ? fm.titleEn : '',
    slug,
    contentKind: typeof fm.contentKind === 'string' ? fm.contentKind : '',
    primaryPlatform: typeof fm.primaryPlatform === 'string' ? fm.primaryPlatform : '',
    status: typeof fm.status === 'string' ? fm.status : '',
    draft: fm.draft === true,
    category: typeof fm.category === 'string' ? fm.category : '',
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    descriptionExists:
      typeof fm.description === 'string' && fm.description.trim() !== '',
    searchDescriptionExists:
      typeof fm.searchDescription === 'string' && fm.searchDescription.trim() !== '',
    fbExists: fb.exists,
    fbEnabled: fb.enabled,
    blogger: {
      enabled: Boolean(fm?.publishTargets?.blogger?.enabled),
      mode: fm?.publishTargets?.blogger?.mode || '',
      type: publishJson?.blogger?.type || '',
      status: publishJson?.blogger?.status || '',
      permalink: publishJson?.blogger?.permalink || '',
      publishedUrl: publishJson?.blogger?.publishedUrl || '',
    },
    github: {
      enabled: Boolean(fm?.publishTargets?.github?.enabled),
      mode: fm?.publishTargets?.github?.mode || '',
      path: publishJson?.github?.path || (slug ? `/posts/${slug}/` : ''),
      previewUrl: githubBase && slug ? `${githubBase}/posts/${slug}/` : '',
    },
  };
}

export async function loadAdminPosts({ settings }) {
  const posts = [];
  for (const site of SITES) {
    const pattern = `content/${site}/posts/*.md`;
    const mdFiles = await fg(pattern, { ignore: ['**/*.fb.md'], absolute: false });
    for (const mdPath of mdFiles) {
      const raw = await loadOnePost(site, path.resolve(mdPath));
      posts.push(toAdminView(raw, settings));
    }
  }
  // Sort by id descending（推測為 YYYYMMDD-slug；新文章在前）
  posts.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
  return { posts };
}
