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
  // Phase 20260520-c-1：additive 補讀 FB post metadata 4 個欄位
  //   - per docs/fb-post-url-metadata-proposal.md §3.1 之 proposal 欄位
  //   - 屬 read-only display；本批不做 write；不解析 body / finalUrl
  //   - 空值 / 缺檔 / 非 string 一律回 ""；不 throw
  //   - fbPostUrl = FB 貼文本身 URL；與 finalUrl（FB body 內導流文章 URL）為兩個不同概念，不可混用
  // Phase 20260520-fb-p5-a：additive 再補讀 7 個 read-only display 欄位
  //   - status / audience / title / titleEn / hashtags / imageUrl / note
  //   - 不做 aggressive normalization；不寫入；不解析 body
  //   - hashtags：array 保留；string 包成單元素 array；其他回空 array（loader return 型別一致便於 EJS render）
  //   - 同時 derive fbBadge（per docs/fb-sidecar-metadata-pre-analysis.md §6.2 + spec 規則）
  const strOrEmpty = (v) => (typeof v === 'string' ? v : '');
  const normHashtags = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v !== '') return [v];
    return [];
  };
  const deriveFbBadge = (fb) => {
    if (!fb.exists) return 'none';
    if (!fb.enabled) return 'disabled';
    if (fb.status === 'posted' || fb.postUrl) return 'posted';
    if (fb.status) return fb.status;
    return 'ready';
  };
  try {
    const txt = await fs.readFile(fbPath, 'utf-8');
    const { data } = matter(txt);
    const fb = {
      exists: true,
      enabled: Boolean(data?.enabled),
      postUrl: strOrEmpty(data?.fbPostUrl),
      postedAt: strOrEmpty(data?.fbPostedAt),
      postId: strOrEmpty(data?.fbPostId),
      campaign: strOrEmpty(data?.fbCampaign),
      status: strOrEmpty(data?.status),
      audience: strOrEmpty(data?.audience),
      title: strOrEmpty(data?.title),
      titleEn: strOrEmpty(data?.titleEn),
      hashtags: normHashtags(data?.hashtags),
      imageUrl: strOrEmpty(data?.imageUrl),
      note: strOrEmpty(data?.note),
    };
    fb.badge = deriveFbBadge(fb);
    return fb;
  } catch {
    const fb = {
      exists: false, enabled: false,
      postUrl: '', postedAt: '', postId: '', campaign: '',
      status: '', audience: '', title: '', titleEn: '', hashtags: [],
      imageUrl: '', note: '',
    };
    fb.badge = deriveFbBadge(fb);
    return fb;
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

  // Phase 20260520-b-2: publishedAt canonical fallback chain
  //   1. publishJson.blogger.publishedAt
  //   2. publishJson.github.publishedAt
  //   3. frontmatter.date（作者意圖日期）
  //   4. ""（無）
  // dateIntent 與 updatedAt 為原始欄位，方便 UI 細分顯示。
  const dateIntent = typeof fm.date === 'string' ? fm.date : '';
  const updatedAt = typeof fm.updated === 'string' ? fm.updated : '';
  let publishedAt = '';
  let publishedSource = '';
  if (typeof publishJson?.blogger?.publishedAt === 'string' && publishJson.blogger.publishedAt) {
    publishedAt = publishJson.blogger.publishedAt;
    publishedSource = 'blogger.publishedAt';
  } else if (typeof publishJson?.github?.publishedAt === 'string' && publishJson.github.publishedAt) {
    publishedAt = publishJson.github.publishedAt;
    publishedSource = 'github.publishedAt';
  } else if (dateIntent) {
    publishedAt = dateIntent;
    publishedSource = 'frontmatter.date';
  }

  // Phase Admin-1-c：metadata completeness checks（lenient；只標 "OK" 或 "missing"，不自動補值）
  //   - blogger OK：disabled 視為 OK；enabled 且有 publishedUrl 視為 OK；enabled 但無 publishedUrl 視為 missing
  //   - github OK：disabled 視為 OK；enabled 且 slug 推導出 previewUrl 視為 OK
  //   - url OK：至少一邊有 published / preview URL
  //   - categoryTags OK：category 存在 + 至少 1 個 tag
  // Phase 20260520-c-4 / 20260521-mid-2 C-3-a：fbPublished 維度套用 P3 canonical（per docs/fb-sidecar-schema.md §3.5.5）
  //   - isPostPublished：article frontmatter.status === 'published'
  //   - hasFbPostUrl：fb.postUrl 非空字串（fbPostedAt / fbPostId / fbCampaign 不單獨代表 published）
  //   - fbPublishedMissing：fb.enabled === true && isPostPublished === true && hasFbPostUrl === false
  //   - 其餘情形（disabled / 尚未 published / 已 published 且 hasFbPostUrl）皆視為 OK
  const isPostPublished = typeof fm.status === 'string' && fm.status === 'published';
  const hasFbPostUrl = typeof fb.postUrl === 'string' && fb.postUrl !== '';
  const fbPublishedMissing = fb.enabled === true && isPostPublished === true && hasFbPostUrl === false;
  const completeness = {
    seo: descriptionExists && searchDescriptionExists ? 'ok' : 'missing',
    fb: fb.exists ? 'ok' : 'missing',
    blogger: !blogger.enabled ? 'ok' : (blogger.publishedUrl ? 'ok' : 'missing'),
    github: !github.enabled ? 'ok' : (github.previewUrl ? 'ok' : 'missing'),
    url: (blogger.publishedUrl || github.previewUrl) ? 'ok' : 'missing',
    categoryTags: (category && tags.length > 0) ? 'ok' : 'missing',
    fbPublished: fbPublishedMissing ? 'missing' : 'ok',
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
  if (fbPublishedMissing) missingFields.push('fbPostUrl');

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
    publishedAt,
    publishedSource,
    dateIntent,
    updatedAt,
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
    fbPostUrl: fb.postUrl,
    fbPostedAt: fb.postedAt,
    fbPostId: fb.postId,
    fbCampaign: fb.campaign,
    // Phase 20260520-fb-p5-a: 7 個 additive read-only 欄位 + derive badge
    fbStatus: fb.status,
    fbAudience: fb.audience,
    fbTitle: fb.title,
    fbTitleEn: fb.titleEn,
    fbHashtags: fb.hashtags,
    fbImageUrl: fb.imageUrl,
    fbNote: fb.note,
    fbBadge: fb.badge,
    blogger,
    github,
    relatedLinksCount,
    otherLinksCount,
    completeness,
    missingFields,
  };
}

// Phase 20260520-b-2: sort helper；不可解析或空值回傳 0；不 throw
function getSortTime(value) {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
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
  // Phase 20260520-b-2: 主排序 publishedAt desc，fallback 至 id desc
  //   - 有 publishedAt 排前（較新在前；timestamp 大者前）
  //   - publishedAt 相同或都無 → 以 id desc 穩定 fallback
  //   - 日期解析失敗視為無日期（getSortTime 回 0；不 throw）
  posts.sort((a, b) => {
    const tb = getSortTime(b.publishedAt);
    const ta = getSortTime(a.publishedAt);
    if (tb !== ta) return tb - ta;
    return (b.id || '').localeCompare(a.id || '');
  });
  return { posts };
}
