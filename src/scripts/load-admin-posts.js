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
// Phase 20260527-night-9 Admin Write Infra Phase 3b dry-run-only UI（per docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md §6.2 方案 A）
//   - server-side pre-compute SEO + FB sidecar 之 validation 結果
//   - 直接重用 Phase 2 之 admin-field-validators.js（同個 ESM module；避免 client-side drift）
//   - 結果以 { ok, error? } 形式 attach 至 toAdminView return；render 端純 display
//   - 不寫入任何檔案；不呼叫 safe-write；不接 actual write path
//   - LIMITS 常數本 phase 不暴露至 EJS（build-github.js 之 render context 只含 { posts, builtAt }；
//     不擴張 render context 即可避免 build-github.js 動到 admin allow-list 外）
//     error code（e.g. 'description-too-long'）本身已能傳達 max 違規；length counter 留待 future phase
import {
  validateDescription,
  validateSearchDescription,
  validateTitleEn,
  validateCoverAlt,
  validateRelatedLinkUrl,
} from './admin-field-validators.js';
// Phase 20260601-am-3 sourceKey Admin selector source implementation
//   - read-only helper for selector preview UI（per docs/20260601-sourcekey-admin-selector-preanalysis.md §4）
//   - 不啟用 Admin Apply / middleware write / admin-write-cli；不寫回 .md frontmatter
import { buildActiveSourceOptions } from './active-source-keys.js';

const SITES = ['github', 'blogger'];

async function readJsonSafe(jsonPath) {
  try {
    const txt = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

// Phase 20260521-pm-57：純函式 URL hostname helper
//   - 用於 Admin platform routing derived 欄位（gaHostname）
//   - 非 string 或無法 parse → null（不 throw）
//   - 不寫入任何檔案；不影響 build / dist / deploy
function deriveHostname(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    return new URL(url).hostname;
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

// Phase 20260601-am-3 sourceKey Admin selector source implementation
//   - 將 relatedLinks / otherLinks 之 frontmatter 條目 normalize 成 admin selector preview UI 所需之最小 metadata（5 欄）
//   - 純 read-only；不寫回 frontmatter；不變動 renderer fallback chain；不變動 GA4 attr
//   - 缺欄位 / 非預期 type → 空字串；不 throw
//   - 不暴露 description / labelOverride 等其他欄位（picker UI 只需 sourceKey / kind / platform / title / url 即可定位）
function extractLinkItemsForAdmin(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((it, idx) => {
    if (!it || typeof it !== 'object' || Array.isArray(it)) {
      return { index: idx, sourceKey: '', platform: '', kind: '', url: '', title: '' };
    }
    return {
      index: idx,
      sourceKey: typeof it.sourceKey === 'string' ? it.sourceKey : '',
      platform: typeof it.platform === 'string' ? it.platform : '',
      kind: typeof it.kind === 'string' ? it.kind : '',
      url: typeof it.url === 'string' ? it.url : '',
      title: typeof it.title === 'string' ? it.title : '',
    };
  });
}

function toAdminView({ siteName, mdPath, fm, publishJson, fb }, settings, sourceOptions) {
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
  const primaryPlatform = typeof fm.primaryPlatform === 'string' ? fm.primaryPlatform : '';
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
  // Phase 20260601-am-3 sourceKey Admin selector source implementation
  //   - per-item metadata 供 admin selector preview render（min subset；不含 description / labelOverride）
  //   - 不影響 relatedLinksCount / otherLinksCount 之既有 consumers
  const relatedLinksItems = extractLinkItemsForAdmin(fm.relatedLinks);
  const otherLinksItems = extractLinkItemsForAdmin(fm.otherLinks);

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

  // Phase 20260527-night-9 Admin Write Infra Phase 3b dry-run-only UI（per docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md §4.5 + §6.1）
  //   - SEO 4 fields：直接重用 Phase 2 validator；render 端純 display ok / error
  //   - FB sidecar：保守處理；只跑欄位定義明確 + Phase 2 已有 validator 之 4 個 string 欄位
  //     （fbPostUrl / fbNote 採 validateRelatedLinkUrl / validateDescription 之 generic shape；
  //      semantic mismatch 風險低；FB-專用 validator 留待 future phase）
  //   - 其餘 fb 8 欄位（enabled / status / postedAt / postId / campaign / audience / hashtags / imageUrl）
  //     本 phase 不接 validator；render 端顯示 "Phase 3 preview only" 提示
  const seoValidation = {
    description: validateDescription(description),
    searchDescription: validateSearchDescription(searchDescription),
    titleEn: validateTitleEn(titleEn),
    coverAlt: validateCoverAlt(coverAlt),
  };
  const fbValidation = {
    title: validateTitleEn(typeof fb.title === 'string' ? fb.title : ''),
    titleEn: validateTitleEn(typeof fb.titleEn === 'string' ? fb.titleEn : ''),
    postUrl: typeof fb.postUrl === 'string' && fb.postUrl !== ''
      ? validateRelatedLinkUrl(fb.postUrl)
      : { ok: true },
    note: validateDescription(typeof fb.note === 'string' ? fb.note : ''),
  };

  // Phase 20260521-pm-57: Admin platform routing read-only derived 欄位
  //   per docs/admin-platform-routing-extension-plan.md §3.1 之 B1 cheap derived
  //   - canonicalTarget / platformUrl / gaHostname / githubStatus
  //   - 純 derived；不新增 frontmatter schema；不影響 build / dist / deploy / validate baseline
  //   - 不含 utmPreviewUrl（屬 pm-58 B2；需 import ga4-url-builder helper + 讀 promotion.config）
  //   - 不含 platformMigrationNote（schema 未定；屬未來 phase）
  const canonicalTarget =
    primaryPlatform === 'blogger' ? (blogger.publishedUrl || '')
    : primaryPlatform === 'github' ? (github.previewUrl || '')
    : '';
  const platformUrl =
    primaryPlatform === 'blogger' ? (blogger.publishedUrl || '')
    : primaryPlatform === 'github' ? (github.previewUrl || '')
    : (blogger.publishedUrl || github.previewUrl || '');
  const gaHostname =
    primaryPlatform === 'blogger'
      ? (deriveHostname(blogger.publishedUrl) || deriveHostname(settings?.site?.bloggerSiteUrl) || null)
      : primaryPlatform === 'github'
        ? (deriveHostname(github.previewUrl) || deriveHostname(settings?.site?.githubSiteUrl) || null)
        : null;
  // githubStatus: Admin read-only derived；不代表 sitemap / build / deploy 之實際審核結果
  //   - github.enabled === false → 'disabled'
  //   - github.enabled === true && previewUrl 非空 → 'rendered'
  //   - github.enabled === true && previewUrl 空 → 'pending'
  const githubStatus = !github.enabled
    ? 'disabled'
    : (github.previewUrl ? 'rendered' : 'pending');

  return {
    sourceSite: siteName,
    sourcePath: mdPath,
    id: typeof fm.id === 'string' ? fm.id : '',
    title: typeof fm.title === 'string' ? fm.title : '',
    titleEn,
    slug,
    contentKind,
    primaryPlatform,
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
    // Phase 20260521-pm-57: Admin platform routing read-only derived 欄位
    canonicalTarget,
    platformUrl,
    gaHostname,
    githubStatus,
    relatedLinksCount,
    otherLinksCount,
    // Phase 20260601-am-3 sourceKey Admin selector source implementation
    //   - per-post relatedLinks / otherLinks 條目 metadata（read-only display only）
    //   - sourceOptions：active sources 排序後完整列表；shared reference across posts（同陣列實例）
    //   - 不啟用 Admin Apply；不接 safeWrite / middleware；selector UI 為 disabled <select>
    relatedLinksItems,
    otherLinksItems,
    sourceOptions: Array.isArray(sourceOptions) ? sourceOptions : [],
    completeness,
    missingFields,
    // Phase 20260527-night-9 Admin Write Infra Phase 3b dry-run-only UI
    //   - server-side pre-computed validation 結果；render 端純 display
    //   - 不啟用 actual write path；本 phase 僅 preview
    seoValidation,
    fbValidation,
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
  // Phase 20260601-am-3 sourceKey Admin selector source implementation
  //   - 建構一次共享 reference；不每 post 重算；不每 post 複製
  //   - settings.linkSources.sources 缺檔時 → 空陣列；selector UI 仍能 render（只顯示「未指定」option）
  const sourceOptions = buildActiveSourceOptions(settings);
  for (const site of SITES) {
    const pattern = `content/${site}/posts/*.md`;
    const mdFiles = await fg(pattern, { ignore: ['**/*.fb.md'], absolute: false });
    for (const mdPath of mdFiles) {
      const raw = await loadOnePost(site, path.resolve(mdPath));
      posts.push(toAdminView(raw, settings, sourceOptions));
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
