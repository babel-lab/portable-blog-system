// Phase 20260717-B2-c：Blogger **可重用 renderer**（正式 build 與 preview builder 共用之單一實作）。
//
// 為何存在：
//   build-blogger.js 原為 913 行、**零 export**、且 top-level 直接呼叫 main() —— import 即觸發整包
//   正式 build（建立 / 覆寫 dist-blogger/）。故 blogger-preview-plan.js（Phase A）只能停在 planner，
//   無法 render draft。本檔把「單篇 post → 產出字串」之純邏輯自 build-blogger.js **原樣搬出**，
//   使正式 build 與 draft-aware preview builder 共用同一份 render implementation，避免第二套
//   容易漂移的 Blogger HTML renderer（per docs/20260710-blogger-preview-only-script-preanalysis.md §6.2）。
//
// 邊界（import-time 契約；違反即設計錯誤）：
//   - 本檔 **無 top-level side effect**：不執行 build、不建立 / 刪除任何目錄、不寫任何檔、
//     不讀 production content、不讀 environment secret、不呼叫 network。
//   - 本檔所有 export 皆 **回傳字串 / 物件**；**不**碰 filesystem 寫入（唯一 I/O = ejs 讀 template）。
//   - 輸出路徑由 caller 決定（outputDir / projectRoot 為參數）；本檔**不**硬編 dist-blogger/
//     或 dist-blogger-preview/，故不可能由本檔污染正式 dist。
//   - **不**改變內容選擇規則：classify / load-posts.js / loadBloggerPosts 之 ready-only 過濾
//     仍完全屬 caller（正式 build）之責任；本檔對「誰該被 render」無意見。
//   - **不**猜 Blogger bloggerPostId / publishedUrl / publishedAt；**不**呼叫 Blogger API。
//
// 搬移來源與等價性：
//   以下函式自 build-blogger.js **逐字搬移**（僅 buildMeta 之 rel() 由硬編 PROJECT_ROOT 改為
//   顯式 projectRoot 參數，計算結果相同）。正式 build 之 dist-blogger/ 輸出經 pre/post 快照比對，
//   byte-identical modulo builtAt（見 docs/20260717-blogger-preview-artifact-builder-b2-phase-c.md §7）。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

import { renderBody } from './parse-markdown.js';
// Phase 8-f-5-b：series.titleTemplate placeholder resolver（純函式 helper；Phase 8-f-4-b 落地）
import { resolveTitleTemplate } from './resolve-series-title.js';
// Phase 20260523-pm-24b：Blogger→GitHub cross-site UTM helper（24a 落地；commit 7e1d356）。
import { applyCrossSiteUtm } from './ga4-url-builder.js';
// Phase 20260610-am-6：commerce renderer ref resolver（R1）；Blogger 與 GitHub 共用同一 helper。
import { deriveRenderedAffiliateLinks, deriveRenderedAffiliateBlocks } from './resolve-affiliate-links.js';
// Phase 20260611-pm-10（Phase C）：AdSense article-block resolver（Blogger surface wiring）。
import { deriveRenderedAdsenseBlocks } from './resolve-adsense-blocks.js';
// Phase 20260624-sp9d：platformPolicy secret-safe / inherit-aware projection helper（SP-9a 落地）。
import { resolvePlatformPolicyValue } from './platform-policy-effective.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 本檔位於 src/scripts/ → 與 build-blogger.js 同層 → PROJECT_ROOT / VIEWS_DIR 解析結果相同。
// 注意：此為 **路徑字串計算**，不觸碰 filesystem（無 mkdir / readdir / stat）。
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
export const VIEWS_DIR = path.join(PROJECT_ROOT, 'src', 'views');

// 供 caller 對照之 render 模式列舉（正式 build 與 preview 共用同一 dispatch）。
export const RENDERED_KINDS = Object.freeze(['full', 'summary', 'redirect-card', 'placeholder']);

const relFrom = (projectRoot, p) => path.relative(projectRoot, p).split(path.sep).join('/');

export function placeholderHtml(post) {
  return `<!--
  Portable Blog System - Blogger Post (placeholder)
  Phase 3-e-1: 骨架階段；HTML 模板內容將於 Phase 3-e-2 起依 mode 補齊
  slug: ${post.slug}
  title: ${post.title ?? '(no title)'}
  mode: ${post.bloggerMode}
  sourceSite: ${post.sourceSite}
  sourcePath: ${post.sourcePath}
-->
`;
}

// Phase 20260527-am-2 step-4：sourceKey → registry.displayLabel 解析；fallback 至 item.platform
function buildSourcesByKey(settings) {
  const map = new Map();
  const sources = settings && settings.linkSources && settings.linkSources.sources;
  if (!Array.isArray(sources)) return map;
  for (const s of sources) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
    if (s.isActive === false) continue;
    if (typeof s.sourceKey !== 'string' || s.sourceKey === '') continue;
    if (typeof s.displayLabel !== 'string' || s.displayLabel === '') continue;
    map.set(s.sourceKey, s.displayLabel);
  }
  return map;
}

function resolveSourceLabel(item, sourcesByKey) {
  if (!item || typeof item.sourceKey !== 'string' || item.sourceKey === '') return null;
  return sourcesByKey.has(item.sourceKey) ? sourcesByKey.get(item.sourceKey) : null;
}

// Phase 20260523-pm-24b：mirror build-github.js deriveRenderedCrossLinks pattern；
//   唯一 diff 為 direction: 'to_github'（Blogger→GitHub reverse UTM）。
export function deriveRenderedCrossLinks(rawLinks, settings, slot) {
  const arr = Array.isArray(rawLinks) ? rawLinks : [];
  const sourcesByKey = buildSourcesByKey(settings);
  return arr.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    if (typeof item.url !== 'string' || item.url.trim() === '') return item;
    const resolvedLabel = resolveSourceLabel(item, sourcesByKey);
    const xs = applyCrossSiteUtm({
      url: item.url,
      settings,
      slot,
      existingRel: typeof item.rel === 'string' ? item.rel : '',
      direction: 'to_github',
    });
    if (xs.target === null) {
      return resolvedLabel === null ? item : { ...item, resolvedLabel };
    }
    const base = { ...item, url: xs.url, target: xs.target, rel: xs.rel };
    if (resolvedLabel !== null) base.resolvedLabel = resolvedLabel;
    return base;
  });
}

// Phase 20260626-blogger-gated-form-iframe-renderer-source-a：
//   strict allowlist validator —— 判斷字串是否為「可安全嵌入 iframe 的 Google Forms public embed URL」。
//   純函式；回 **boolean only**；**永不** echo / log / return 被拒絕的 URL 字串（no-echo policy）。
export function isAllowedGoogleFormEmbedUrl(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return false;
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  if (url.host !== 'docs.google.com') return false;
  const pathname = url.pathname;
  if (!pathname.includes('/forms/')) return false;
  if (!pathname.endsWith('/viewform')) return false;
  // 雙重保險：即使結尾為 /viewform，亦明確拒絕 edit / response 形態 path segment。
  if (/\/(edit|formResponse)(\/|$)/.test(pathname)) return false;
  // query 必含 embedded=true。
  if (url.searchParams.get('embedded') !== 'true') return false;
  // 拒絕 token-like / respondent-like / prefilled-private query key（prefilled entry.* 帶值亦拒）。
  for (const key of url.searchParams.keys()) {
    const k = key.toLowerCase();
    if (k === 'embedded') continue;
    if (k.startsWith('entry.')) return false;
    if (/(token|response|respondent|edit|prefill|email)/.test(k)) return false;
  }
  return true;
}

// Phase 20260626-blogger-gated-download-safe-placeholder-renderer-source-a：
//   Blogger-only gated download **safe placeholder** render object。
//   紅線：回傳 object **不得**含 raw formEmbedUrl；是否有 URL 只以 boolean hasFormEmbedUrl 表示。
export function deriveRenderedGatedDownload(post) {
  const isGatedPageType = !!post && post.pageType === 'gated_download';

  const funnel =
    post && typeof post.downloadFunnel === 'object' && post.downloadFunnel && !Array.isArray(post.downloadFunnel)
      ? post.downloadFunnel
      : null;
  const isGatedRole = !!funnel && funnel.role === 'gated_page';

  const gated =
    post && typeof post.gatedDownload === 'object' && post.gatedDownload && !Array.isArray(post.gatedDownload)
      ? post.gatedDownload
      : null;
  const hasGatedSignal =
    !!gated &&
    (typeof gated.mechanism !== 'undefined' ||
      typeof gated.formEmbedUrl !== 'undefined' ||
      typeof gated.postSubmitResource !== 'undefined' ||
      gated.enabled === true);

  const isGatedDownloadPage = isGatedPageType || isGatedRole || hasGatedSignal;

  if (!isGatedDownloadPage) {
    return { enabled: false };
  }

  const mechanism =
    !!gated && typeof gated.mechanism === 'string' && gated.mechanism.trim() !== ''
      ? gated.mechanism.trim()
      : null;

  // rawFormEmbedUrl：僅供本地 allowlist 驗證；**不**進 return object（no-echo）。
  const rawFormEmbedUrl =
    !!gated && typeof gated.formEmbedUrl === 'string' ? gated.formEmbedUrl.trim() : '';
  const hasFormEmbedUrl = rawFormEmbedUrl !== '';

  const iframeSrc = isAllowedGoogleFormEmbedUrl(rawFormEmbedUrl) ? rawFormEmbedUrl : null;

  if (iframeSrc) {
    return {
      enabled: true,
      mechanism,
      renderMode: 'iframe',
      hasFormEmbedUrl: true,
      iframe: {
        src: iframeSrc,
        title: '下載申請表單',
        height: 720,
      },
      title: '表單閘門下載',
      message: '請於下方表單填寫並送出，依表單指示取得下載資源。',
    };
  }

  return {
    enabled: true,
    mechanism,
    renderMode: 'placeholder',
    hasFormEmbedUrl,
    title: '表單閘門下載',
    message: '此頁為表單閘門下載頁；正式 Google Form 嵌入尚未啟用，等待設定中。',
  };
}

export async function renderFullPost(post, canonicalUrl, jsonLd, settings) {
  const bodyHtml = renderBody(post.body || '');
  const relatedLinksRendered = deriveRenderedCrossLinks(post.relatedLinks, settings, 'related_links');
  const otherLinksRendered = deriveRenderedCrossLinks(post.otherLinks, settings, 'other_links');
  const affiliateLinksRendered = deriveRenderedAffiliateLinks(post.affiliate, settings.commerceLinks);
  const affiliateBlocksRendered = deriveRenderedAffiliateBlocks(post.affiliate, settings.commerceLinks);
  const adsenseBlocksRendered = deriveRenderedAdsenseBlocks(post, settings.ads, 'blogger');
  const gatedDownloadRendered = deriveRenderedGatedDownload(post);
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-post-full.ejs'),
    {
      post: { ...post, bodyHtml },
      normalized: post.normalized,
      canonicalUrl,
      jsonLd,
      relatedLinksRendered,
      otherLinksRendered,
      affiliateLinksRendered,
      affiliateBlocksRendered,
      adsenseBlocksRendered,
      gatedDownloadRendered,
      ads: settings.ads,
    },
    { async: true },
  );
}

// Phase 3-e-3：UTM helper（CLAUDE.md §16.4 blogger→github 導流）
export function buildBloggerToGithubUrl(rawUrl, slug) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('utm_source', 'blogger');
    url.searchParams.set('utm_medium', 'internal_referral');
    url.searchParams.set('utm_campaign', 'blogger_to_github');
    url.searchParams.set('utm_content', slug);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

// Phase 3-e-3 / 9-i-b2：canonical URL 解析（含 fallback）。
//   **不**預測 Blogger URL：僅在 sidecar 已回填 publishedUrl 時採用該真值。
export function resolveCanonicalUrl(post, settings) {
  const raw = post.canonical;
  // sidecar publish data 由 load-posts.js attach 至 post.publish；不從 legacy post.blogger 讀
  const bloggerPublishedUrl = post.publish?.blogger?.publishedUrl;
  if (
    post.primaryPlatform === 'blogger' &&
    (!raw || raw === 'auto') &&
    typeof bloggerPublishedUrl === 'string' &&
    bloggerPublishedUrl !== ''
  ) {
    return { url: bloggerPublishedUrl, warning: null };
  }
  let absolute = null;
  if (raw && raw !== 'auto') {
    absolute = raw;
  } else if (settings.site?.githubSiteUrl) {
    const base = settings.site.githubSiteUrl.replace(/\/$/, '');
    absolute = `${base}/posts/${post.slug}/`;
  }
  if (!absolute) {
    return {
      url: null,
      warning: `post slug="${post.slug}": 無法解析 canonical URL（frontmatter canonical 缺漏且 site.githubSiteUrl 未設）`,
    };
  }
  return { url: buildBloggerToGithubUrl(absolute, post.slug), warning: null };
}

// Phase 5-f-2：cover 絕對化（用 bloggerSiteUrl 為 base；cover 已 absolute 直接返回）
export function absolutizeBloggerCover(post, settings) {
  const url = post.cover;
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const base = (settings.site?.bloggerSiteUrl || '').replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/${url.replace(/^\/+/, '')}`;
}

// Phase 9-f-g-c: BlogPosting.mainEntity = Book（per docs/phase-9f-g-pre-plan.md §4-§5）
export function buildBookMainEntity(post) {
  const book = post.book;
  if (!book || typeof book !== 'object' || Array.isArray(book)) return null;
  if (book.mediaType && book.mediaType !== 'book') return null;
  if (typeof book.title !== 'string' || book.title.trim() === '') return null;
  const entity = { '@type': 'Book', name: book.title };
  const altNames = [book.titleEn, book.originalTitle].filter(
    (v) => typeof v === 'string' && v.trim() !== '',
  );
  if (altNames.length === 1) entity.alternateName = altNames[0];
  else if (altNames.length > 1) entity.alternateName = altNames;
  const authorPersons = (Array.isArray(book.authors) ? book.authors : [])
    .filter((a) => a && typeof a === 'object' && !Array.isArray(a))
    .filter((a) => !a.role || a.role === 'author')
    .map((a) => {
      const name = [a.displayName, a.localName, a.originalName].find(
        (v) => typeof v === 'string' && v.trim() !== '',
      );
      return name ? { '@type': 'Person', name } : null;
    })
    .filter(Boolean);
  if (authorPersons.length > 0) {
    entity.author = authorPersons;
  } else if (typeof book.author === 'string' && book.author.trim() !== '') {
    entity.author = [{ '@type': 'Person', name: book.author }];
  }
  if (typeof book.publisher === 'string' && book.publisher.trim() !== '') {
    entity.publisher = { '@type': 'Organization', name: book.publisher };
  }
  if (typeof book.publishedYear === 'number' && Number.isFinite(book.publishedYear)) {
    const year = Math.trunc(book.publishedYear);
    if (year >= 1000 && year <= 9999) entity.datePublished = String(year);
  }
  if (typeof book.isbn === 'string' && book.isbn.trim() !== '') entity.isbn = book.isbn;
  if (typeof book.coverImage === 'string' && book.coverImage.trim() !== '')
    entity.image = book.coverImage;
  if (typeof book.volumeLabel === 'string' && book.volumeLabel.trim() !== '')
    entity.bookEdition = book.volumeLabel;
  return entity;
}

// Phase 5-f-2 / 9-g-g-c / 9-f-g-c：BlogPosting JSON-LD（in-body）；canonicalUrl 缺則 null
export function buildBloggerJsonLd(post, canonicalUrl, settings, ogImage) {
  if (!canonicalUrl) return null;
  const cat = (settings.categories || []).find(
    (c) => c.id === post.category || c.slug === post.category,
  );
  const blogSiteUrl =
    post.primaryPlatform === 'blogger'
      ? `${settings.site.bloggerSiteUrl}/`
      : `${settings.site.githubSiteUrl}/`;
  const mentionsItems = [
    ...(Array.isArray(post.relatedLinks) ? post.relatedLinks : []),
    ...(Array.isArray(post.otherLinks) ? post.otherLinks : []),
  ]
    .filter(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        !Array.isArray(entry) &&
        typeof entry.title === 'string' &&
        entry.title.trim() !== '' &&
        typeof entry.url === 'string' &&
        entry.url.trim() !== '',
    )
    .map((entry) => ({ '@type': 'WebPage', name: entry.title, url: entry.url }));
  const bookMainEntity = buildBookMainEntity(post);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': canonicalUrl,
    headline: post.title,
    description: post.description || settings.site.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@type': 'Person', name: post.author || settings.site.author },
    mainEntityOfPage: canonicalUrl,
    inLanguage: settings.site.language,
    articleSection: cat?.name || post.category,
    isPartOf: {
      '@type': 'Blog',
      '@id': blogSiteUrl,
      name: settings.site.siteName,
      url: blogSiteUrl,
      inLanguage: settings.site.language,
    },
    ...(mentionsItems.length > 0 ? { mentions: mentionsItems } : {}),
    ...(bookMainEntity ? { mainEntity: bookMainEntity } : {}),
  };
  if (ogImage) jsonLd.image = ogImage;
  return jsonLd;
}

// Phase 5-f-2：OG 欄位
export function buildOgFields(post, canonicalUrl, ogImage) {
  return {
    title: post.fbTitle || post.title || '',
    description: post.description || '',
    url: canonicalUrl || '',
    image: ogImage || '',
    alt: post.coverAlt || '',
  };
}

export async function renderSummaryPost(post, canonicalUrl, jsonLd) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-post-summary.ejs'),
    { post, normalized: post.normalized, canonicalUrl, jsonLd },
    { async: true },
  );
}

export async function renderRedirectCardPost(post, canonicalUrl) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-redirect-card.ejs'),
    { post, normalized: post.normalized, canonicalUrl },
    { async: true },
  );
}

// Phase 3-e-6：blogger-home.html（全站索引、依分類分組）——**正式 build 專用**（preview 不產索引）
export async function renderHomeIndex(data) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-home-index.ejs'),
    data,
    { async: true },
  );
}

// Phase 3-e-6：category-{slug}.html——**正式 build 專用**（preview 不產索引）
export async function renderCategoryIndex(data) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-category-index.ejs'),
    data,
    { async: true },
  );
}

// Phase 20260624-sp9d：Blogger operator guidance 投影（display-only；audit metadata only）。
export function deriveBloggerOperatorGuidance(post) {
  const pageType =
    post && typeof post.pageType === 'string' && post.pageType.trim() !== ''
      ? post.pageType.trim()
      : null;

  const policy = post && typeof post === 'object' ? post.platformPolicy : undefined;
  const hasBloggerPolicy = !!(
    policy &&
    typeof policy === 'object' &&
    !Array.isArray(policy) &&
    policy.blogger &&
    typeof policy.blogger === 'object' &&
    !Array.isArray(policy.blogger)
  );

  let blogger = null;
  if (hasBloggerPolicy) {
    blogger = {};
    for (const field of ['indexing', 'includeInListings', 'includeInSitemap']) {
      const r = resolvePlatformPolicyValue(post, 'blogger', field);
      blogger[field] = { value: r.value, source: r.source };
    }
  }

  return {
    present: pageType !== null || hasBloggerPolicy,
    pageType,
    hasBloggerPolicy,
    blogger,
  };
}

// Phase 3-e-5 / 5-f-3 / 20260624-sp9d：copy-helper.txt
export async function renderCopyHelper(
  post,
  canonical,
  meta,
  ogFields,
  jsonLd,
  copyHelperSeriesTitle,
  copyHelperSeriesTitleUnresolvedPlaceholders,
  bloggerOperatorGuidance,
) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-copy-helper.ejs'),
    {
      post,
      normalized: post.normalized,
      canonical,
      meta,
      ogFields,
      jsonLd,
      copyHelperSeriesTitle,
      copyHelperSeriesTitleUnresolvedPlaceholders,
      bloggerOperatorGuidance,
    },
    { async: true },
  );
}

// Phase 3-e-5：publish-checklist.txt（mode-aware checkbox 清單）
//   **正式 build 專用**：preview 刻意不產此檔（不誘導以 preview 產物走正式發布流程）。
export async function renderPublishChecklist(post, canonical, meta, bloggerOperatorGuidance) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-publish-checklist.ejs'),
    { post, normalized: post.normalized, canonical, meta, bloggerOperatorGuidance },
    { async: true },
  );
}

// Phase 3-e-4：每篇 post 對應 meta.json（uniform schema、缺漏填 null）
//   projectRoot 為顯式參數（原 build-blogger.js 硬編 PROJECT_ROOT）；計算結果相同。
export function buildMeta(post, { renderedKind, canonical, builtAt, outputDir, projectRoot = PROJECT_ROOT }) {
  // Phase 8-g-18-d：Blogger tags 輸出來源為 normalized.publish.blogger.tags
  const normalizedBloggerTags = post.normalized?.publish?.blogger?.tags;
  const bloggerTags = Array.isArray(normalizedBloggerTags) ? normalizedBloggerTags : [];

  const rel = (p) => relFrom(projectRoot, p);

  return {
    id: post.id ?? null,
    slug: post.slug,
    title: post.title ?? null,
    titleEn: post.titleEn ?? null,
    // Phase 8-h-e-2-a：meta.json type 欄位來源為 post.normalized.identity.contentKind
    type: post.normalized?.identity?.contentKind ?? null,
    primaryPlatform: post.primaryPlatform ?? null,

    sourceSite: post.sourceSite,
    sourcePath: post.sourcePath,

    date: post.date ?? null,
    updated: post.updated ?? null,
    author: post.author ?? null,

    category: post.category ?? null,
    tags: bloggerTags,
    description: post.description ?? null,
    searchDescription: post.searchDescription ?? null,

    cover: post.cover ?? null,
    coverAlt: post.coverAlt ?? null,

    status: post.status ?? null,
    draft: post.draft ?? null,

    bloggerMode: post.bloggerMode,
    rendered: renderedKind,

    publishTargets: post.publishTargets ?? null,

    canonical: {
      raw: post.canonical ?? null,
      resolved: canonical.url,
      warning: canonical.warning,
    },

    blocks: post.blocks ?? null,
    book: post.book ?? null,
    affiliate: post.affiliate ?? null,
    download: post.download ?? null,

    bloggerPublish: post.blogger ?? null,

    build: {
      builtAt,
      outputDir: rel(outputDir).replace(/\\/g, '/') + '/',
      postFile: rel(path.join(outputDir, 'post.html')).replace(/\\/g, '/'),
      metaFile: rel(path.join(outputDir, 'meta.json')).replace(/\\/g, '/'),
    },
  };
}

// ── 共用單篇 render pipeline ───────────────────────────────────────────────────────
// 正式 build（build-blogger.js main()）與 preview builder（build-blogger-preview.js）之
// **唯一** 核心 render 實作。回傳字串；**不寫任何檔**（寫檔為 caller 之責）。
//
// 對「誰該被 render」無意見 —— 內容選擇（classify / ready-only 過濾）完全屬 caller。
// 故本函式可 render draft，而正式 build 仍因其 loader 過濾而永不收 draft（CLAUDE.md §23）。
export async function renderBloggerPost(post, settings, { builtAt, outputDir, projectRoot = PROJECT_ROOT } = {}) {
  // Phase 3-e-4：每篇 post 一次性解析 canonical，結果共用於渲染與 meta.json
  const canonical = resolveCanonicalUrl(post, settings);

  // Phase 5-f-2：SEO helper 預先計算（cover 絕對化 / BlogPosting JSON-LD / OG 欄位）
  const ogImage = absolutizeBloggerCover(post, settings);
  const jsonLd = buildBloggerJsonLd(post, canonical.url, settings, ogImage);
  const ogFields = buildOgFields(post, canonical.url, ogImage);

  let html;
  let renderedKind;
  if (post.bloggerMode === 'full') {
    html = await renderFullPost(post, canonical.url, jsonLd, settings);
    renderedKind = 'full';
  } else if (post.bloggerMode === 'summary') {
    html = await renderSummaryPost(post, canonical.url, jsonLd);
    renderedKind = 'summary';
  } else if (post.bloggerMode === 'redirect-card') {
    html = await renderRedirectCardPost(post, canonical.url);
    renderedKind = 'redirect-card';
  } else {
    html = placeholderHtml(post);
    renderedKind = 'placeholder';
  }

  const meta = buildMeta(post, { renderedKind, canonical, builtAt, outputDir, projectRoot });

  // Phase 8-f-5-b：預計算 series.titleTemplate 解析結果，作為 copy-helper 「系列組合標題」輔助區塊
  let copyHelperSeriesTitle = null;
  let copyHelperSeriesTitleUnresolvedPlaceholders = [];
  {
    const series = post.normalized?.series;
    if (series && typeof series.titleTemplate === 'string' && series.titleTemplate !== '') {
      const result = resolveTitleTemplate(series.titleTemplate, {
        series,
        post: { title: post.title, titleEn: post.titleEn },
      });
      copyHelperSeriesTitle = result.resolvedText;
      copyHelperSeriesTitleUnresolvedPlaceholders = result.unresolvedPlaceholders;
    }
  }

  // Phase 20260624-sp9d：預計算 Blogger operator guidance（display-only；audit metadata only）
  const bloggerOperatorGuidance = deriveBloggerOperatorGuidance(post);

  const copyHelperText = await renderCopyHelper(
    post,
    canonical,
    meta,
    ogFields,
    jsonLd,
    copyHelperSeriesTitle,
    copyHelperSeriesTitleUnresolvedPlaceholders,
    bloggerOperatorGuidance,
  );
  const publishChecklistText = await renderPublishChecklist(
    post,
    canonical,
    meta,
    bloggerOperatorGuidance,
  );

  return { canonical, html, renderedKind, meta, ogFields, jsonLd, copyHelperText, publishChecklistText };
}
