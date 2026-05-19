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
  const description = typeof fm.description === 'string' ? fm.description : '';
  const searchDescription = typeof fm.searchDescription === 'string' ? fm.searchDescription : '';
  const category = typeof fm.category === 'string' ? fm.category : '';
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  const descriptionExists = description.trim() !== '';
  const searchDescriptionExists = searchDescription.trim() !== '';
  const contentKind = typeof fm.contentKind === 'string' ? fm.contentKind : '';
  const cover = typeof fm.cover === 'string' ? fm.cover : '';
  const coverAlt = typeof fm.coverAlt === 'string' ? fm.coverAlt : '';
  const titleEn = typeof fm.titleEn === 'string' ? fm.titleEn : '';
  const blogger = {
    enabled: Boolean(fm?.publishTargets?.blogger?.enabled),
    mode: fm?.publishTargets?.blogger?.mode || '',
    type: publishJson?.blogger?.type || '',
    status: publishJson?.blogger?.status || '',
    permalink: publishJson?.blogger?.permalink || '',
    publishedUrl: publishJson?.blogger?.publishedUrl || '',
  };
  const github = {
    enabled: Boolean(fm?.publishTargets?.github?.enabled),
    mode: fm?.publishTargets?.github?.mode || '',
    path: publishJson?.github?.path || (slug ? `/posts/${slug}/` : ''),
    previewUrl: githubBase && slug ? `${githubBase}/posts/${slug}/` : '',
  };
  const relatedLinksCount = Array.isArray(fm.relatedLinks) ? fm.relatedLinks.length : 0;
  const otherLinksCount = Array.isArray(fm.otherLinks) ? fm.otherLinks.length : 0;

  // Phase Admin-1-c：metadata completeness checks（lenient；只標 "OK" 或 "missing"，不自動補值）
  //   - blogger OK：disabled 視為 OK；enabled 且有 publishedUrl 視為 OK；enabled 但無 publishedUrl 視為 missing
  //   - github OK：disabled 視為 OK；enabled 且 slug 推導出 previewUrl 視為 OK
  //   - url OK：至少一邊有 published / preview URL
  //   - categoryTags OK：category 存在 + 至少 1 個 tag
  const completeness = {
    seo: descriptionExists && searchDescriptionExists ? 'ok' : 'missing',
    fb: fb.exists ? 'ok' : 'missing',
    blogger: !blogger.enabled ? 'ok' : (blogger.publishedUrl ? 'ok' : 'missing'),
    github: !github.enabled ? 'ok' : (github.previewUrl ? 'ok' : 'missing'),
    url: (blogger.publishedUrl || github.previewUrl) ? 'ok' : 'missing',
    categoryTags: (category && tags.length > 0) ? 'ok' : 'missing',
  };

  const missingFields = [];
  if (!contentKind) missingFields.push('contentKind');
  if (!descriptionExists) missingFields.push('description');
  if (!searchDescriptionExists) missingFields.push('searchDescription');
  if (!category) missingFields.push('category');
  if (tags.length === 0) missingFields.push('tags');
  if (!cover) missingFields.push('cover');
  if (!coverAlt) missingFields.push('coverAlt');
  if (!titleEn) missingFields.push('titleEn');
  if (blogger.enabled && !blogger.publishedUrl) missingFields.push('blogger.publishedUrl');
  if (!fb.exists) missingFields.push('.fb.md sidecar');

  return {
    sourceSite: siteName,
    sourcePath: mdPath,
    id: typeof fm.id === 'string' ? fm.id : '',
    title: typeof fm.title === 'string' ? fm.title : '',
    titleEn,
    slug,
    contentKind,
    primaryPlatform: typeof fm.primaryPlatform === 'string' ? fm.primaryPlatform : '',
    status: typeof fm.status === 'string' ? fm.status : '',
    draft: fm.draft === true,
    category,
    tags,
    cover,
    coverAlt,
    description,
    searchDescription,
    descriptionExists,
    searchDescriptionExists,
    fbExists: fb.exists,
    fbEnabled: fb.enabled,
    blogger,
    github,
    relatedLinksCount,
    otherLinksCount,
    completeness,
    missingFields,
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
