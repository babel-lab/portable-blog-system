#!/usr/bin/env node
// Phase 3-e-1：Blogger build 骨架
// 範圍：讀取兩個 source、過濾、建立 dist-blogger/posts/{slug}/ + post.html placeholder
// 不實作 full / summary / redirect-card HTML 模板內容（屬 3-e-2 起）
// 不寫 meta.json / copy-helper.txt / publish-checklist.txt（屬 3-e-4 / 3-e-5）

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

import { loadSettings } from './load-settings.js';
import { loadBloggerPosts } from './load-blogger-posts.js';
import { validateContent, printWarnings } from './validate-content.js';
import { renderBody } from './parse-markdown.js';
// Phase 8-f-5-b：series.titleTemplate placeholder resolver（純函式 helper；Phase 8-f-4-b 落地）
//   - 僅用於 copy-helper 之「系列組合標題」輔助區塊預計算
//   - 不取代 post.title / fbTitle / Blogger 主標題；不修改其他 EJS 或 dist 路徑
import { resolveTitleTemplate } from './resolve-series-title.js';
// Phase 20260523-pm-24b-reverse-utm-step2-build-blogger-preprocess-a：
//   Blogger→GitHub cross-site UTM helper（24a 落地；commit 7e1d356）。
//   本批僅用於預處理 relatedLinks / otherLinks 之 GitHub cross-link → reverse UTM；
//   不動 buildBloggerToGithubUrl / canonicalUrl / JSON-LD / summary CTA / redirect CTA / index CTA。
import { applyCrossSiteUtm } from './ga4-url-builder.js';
// Phase 20260610-am-6：commerce renderer ref resolver（R1）；Blogger 與 GitHub 共用同一 helper。
import { deriveRenderedAffiliateLinks, deriveRenderedAffiliateBlocks } from './resolve-affiliate-links.js';
// Phase 20260611-pm-10（Phase C）：AdSense article-block resolver（Blogger surface dry-run wiring）。
//   - 與 GitHub Pages 共用同一 pure resolver；surface='blogger' → 僅 articleAd6/beforeRelatedLinks（pm-8 policy）resolve。
//   - articleAd1..5 為 pages-only → blogger surface 回空；ads.enabled=false 時全 {}。
//   - 本批僅本機 build dry-run wiring，不 deploy / 不重貼 Blogger。
import { deriveRenderedAdsenseBlocks } from './resolve-adsense-blocks.js';
// Phase 20260624-sp9d：platformPolicy secret-safe / inherit-aware projection helper（SP-9a 落地）。
//   - 僅用於 copy-helper / publish-checklist 之 display-only operator guidance 區塊預計算。
//   - **不**接入 post.html / robots / sitemap / listing / metadata selector；不改 post object。
//   - suspicious nested key 之 value 永不被讀取（resolvePlatformPolicyValue 回 source='secret'）。
import { resolvePlatformPolicyValue } from './platform-policy-effective.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist-blogger');
const POSTS_DIR = path.join(DIST_DIR, 'posts');
const VIEWS_DIR = path.join(PROJECT_ROOT, 'src', 'views');
const MANIFEST_FILE = path.join(DIST_DIR, 'build-manifest.json');

const rel = (p) => path.relative(PROJECT_ROOT, p).split(path.sep).join('/');

function parseMode(argv) {
  const flag = argv.find((a) => a.startsWith('--mode='));
  if (!flag) return 'build';
  return flag.split('=')[1] || 'build';
}

async function writeText(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf-8');
}

async function writeJson(file, data) {
  await writeText(file, JSON.stringify(data, null, 2) + '\n');
}

function placeholderHtml(post) {
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

// Phase 20260523-pm-24b-reverse-utm-step2-build-blogger-preprocess-a：
//   mirror build-github.js deriveRenderedCrossLinks pattern；唯一 diff 為 direction: 'to_github'。
//   - 對 GitHub Pages cross-link 注入 reverse UTM + 設 target=_blank + 合併 rel
//   - 非 GitHub cross-link / 同站連結 / 非 object item / 缺 url 之 item 維持原樣
//   - 既有 utm_* 套用策略 A：跳過 UTM 注入但仍套 target=_blank + rel merge（per applyCrossSiteUtm）
//   - 本批暫不串接 blogger-post-full.ejs；template 仍讀 post.relatedLinks / post.otherLinks raw（24c 接線）
// Phase 20260527-am-2 step-4：sourceKey → registry.displayLabel 解析；fallback 至 item.platform（mirror build-github.js）
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

function deriveRenderedCrossLinks(rawLinks, settings, slot) {
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

// Phase 20260626-blogger-gated-download-safe-placeholder-renderer-source-a：
//   Blogger-only gated download **safe placeholder** render object（Option A / Option C，per
//   docs/20260626-blogger-gated-form-renderer-implementation-scan-record-docs-only-a.md §10–§11）。
//   - 安全過渡版本：只供 EJS render placeholder，**永不** render iframe、**永不**直出 Form / Drive / download 連結。
//   - gated page 判定（三條件 AND）：
//       post.pageType === 'gated_download'
//       post.downloadFunnel.role === 'gated_page'
//       post.gatedDownload.enabled === true
//     現有 access.md 草稿無 gatedDownload.enabled（gatedDownload only-allowed keys =
//     mechanism / formEmbedUrl / postSubmitResource，per decision packet §3）→ enabled 缺 →
//     回 { enabled:false } → EJS 不渲染 → 既有 ready post post.html byte-identical。
//     未來由 Dean 於 content 加 enabled:true 啟用，本 session 不改 content。
//   - 紅線：回傳 object **不得**含 raw formEmbedUrl；是否有 URL 只以 boolean hasFormEmbedUrl 表示。
//     Google Form URL / Drive URL / response URL / respondent data **一律不**進 template context。
//   - title / message 為 build 端 safe 常數文案（**不**讀 gatedDownload.*，避免 suspicious-field）。
//   - 不消費於 robots / sitemap / listing / metadata selector；純 render-time placeholder。
function deriveRenderedGatedDownload(post) {
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
  const isEnabled = !!gated && gated.enabled === true;

  if (!(isGatedPageType && isGatedRole && isEnabled)) {
    return { enabled: false };
  }

  // mechanism：safe enum string only（非 URL）；缺 / 非字串 → null。
  const mechanism =
    typeof gated.mechanism === 'string' && gated.mechanism.trim() !== '' ? gated.mechanism.trim() : null;

  // hasFormEmbedUrl：boolean ONLY。**永不**回傳 formEmbedUrl 本身；即使非空，本 session 亦不 render iframe。
  const hasFormEmbedUrl = typeof gated.formEmbedUrl === 'string' && gated.formEmbedUrl.trim() !== '';

  return {
    enabled: true,
    mechanism,
    renderMode: 'placeholder',
    hasFormEmbedUrl,
    title: '表單閘門下載',
    message: '此頁為表單閘門下載頁；正式 Google Form 嵌入尚未啟用，等待設定中。',
  };
}

async function renderFullPost(post, canonicalUrl, jsonLd, settings) {
  const bodyHtml = renderBody(post.body || '');
  // Phase 8-d-3b：additive alias for EJS ergonomics；指向 8-d-2 掛載之 post.normalized。
  //   - 不重新呼叫 normalizePostOutput；不啟用 deriveGithubUrl；不預測 Blogger URL
  //   - EJS template 本批不改讀 normalized；屬 8-d-3c 之後範圍
  //   - 既有 EJS 仍讀 post.X；本欄位 additive，不影響輸出
  //   - 同樣 pattern 套用於 renderSummaryPost / renderRedirectCardPost / renderCopyHelper / renderPublishChecklist
  // Phase 20260523-pm-24b：additive context relatedLinksRendered / otherLinksRendered；
  //   - blogger-post-full.ejs 本批仍讀 post.relatedLinks / post.otherLinks raw（不串接）
  //   - 屬資料 prep 階段；24c 將切換 template 端讀法 + 加 target/rel fallback
  //   - 對無 GitHub cross-link 之 ready post：rendered 與 raw 結構等價（item 同物件 reference）→ EJS 仍讀 raw → post.html byte-identical
  const relatedLinksRendered = deriveRenderedCrossLinks(post.relatedLinks, settings, 'related_links');
  const otherLinksRendered = deriveRenderedCrossLinks(post.otherLinks, settings, 'other_links');
  // Phase 20260610-am-6：commerce affiliate ref → registry targetUrl 解析（R1；與 GitHub 共用同一 helper）。
  //   url-backward-compatible-first → 既有 raw url ready post 之 post.html byte-identical（modulo builtAt）。
  const affiliateLinksRendered = deriveRenderedAffiliateLinks(post.affiliate, settings.commerceLinks);
  // Phase 20260610-pm-12：Blogger-only dual-block；resolved per-block { id, position, heading, disclosure, links }。
  //   legacy affiliateLinksRendered wiring 不變；template 在 blocks 非空時改走 blocks 並抑制 legacy box（避免重複）。
  //   GitHub build（build-github.js）不呼叫此 helper → GitHub 端 by construction 維持 legacy-only。
  const affiliateBlocksRendered = deriveRenderedAffiliateBlocks(post.affiliate, settings.commerceLinks);
  // Phase 20260611-pm-10（Phase C）：Blogger surface AdSense blocks 解析（surface='blogger'）。
  //   - pm-8 policy：blogger surface 僅 articleAd6/beforeRelatedLinks resolve；其餘 anchor 回空。
  //   - pure resolver；不洩 internal 欄位；template 端僅在 beforeRelatedLinks anchor 插入。
  const adsenseBlocksRendered = deriveRenderedAdsenseBlocks(post, settings.ads, 'blogger');
  // Phase 20260626-blogger-gated-download-safe-placeholder-renderer-source-a：
  //   gated download safe placeholder render object（無 raw formEmbedUrl / Form / Drive URL）。
  //   非 gated page → { enabled:false } → EJS 不渲染 → 既有 post.html byte-identical。
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
function buildBloggerToGithubUrl(rawUrl, slug) {
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

// Phase 3-e-3：canonical URL 解析（含 fallback）
// Phase 9-i-b2：當 primaryPlatform=blogger + canonical auto/缺 + 有 Blogger publishedUrl 時，
//   直接使用 Blogger publishedUrl（不 cross-link GitHub；不加 UTM）
//   per docs/phase-9h-known-blockers.md §4（Blocker #2 根因 2）
function resolveCanonicalUrl(post, settings) {
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
function absolutizeBloggerCover(post, settings) {
  const url = post.cover;
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const base = (settings.site?.bloggerSiteUrl || '').replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/${url.replace(/^\/+/, '')}`;
}

// Phase 9-f-g-c: BlogPosting.mainEntity = Book（per docs/phase-9f-g-pre-plan.md §4-§5）
//   - 條件式：post.book object + (mediaType 缺省 OR === "book") + book.title non-empty
//   - 採 author fallback chain：authors[].displayName → localName → originalName → legacy book.author
//   - 不接 Periodical / DVD / YouTube / Netflix specific @type / library sameAs / @graph / Person.sameAs
//   - 與 build-github.js buildSeoForPostDetail() 兩端 mirror
function buildBookMainEntity(post) {
  const book = post.book;
  if (!book || typeof book !== 'object' || Array.isArray(book)) return null;
  if (book.mediaType && book.mediaType !== 'book') return null;
  if (typeof book.title !== 'string' || book.title.trim() === '') return null;
  const entity = { '@type': 'Book', name: book.title };
  // alternateName: non-empty titleEn / originalTitle; 1 → string；2 → array
  const altNames = [book.titleEn, book.originalTitle].filter(
    (v) => typeof v === 'string' && v.trim() !== '',
  );
  if (altNames.length === 1) entity.alternateName = altNames[0];
  else if (altNames.length > 1) entity.alternateName = altNames;
  // author: 優先 authors[] role 缺省或 === "author"；fallback chain name
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
  // publisher: Organization
  if (typeof book.publisher === 'string' && book.publisher.trim() !== '') {
    entity.publisher = { '@type': 'Organization', name: book.publisher };
  }
  // datePublished: book.publishedYear → "YYYY"
  if (typeof book.publishedYear === 'number' && Number.isFinite(book.publishedYear)) {
    const year = Math.trunc(book.publishedYear);
    if (year >= 1000 && year <= 9999) entity.datePublished = String(year);
  }
  // isbn / image / bookEdition：non-empty 才出
  if (typeof book.isbn === 'string' && book.isbn.trim() !== '') entity.isbn = book.isbn;
  if (typeof book.coverImage === 'string' && book.coverImage.trim() !== '')
    entity.image = book.coverImage;
  if (typeof book.volumeLabel === 'string' && book.volumeLabel.trim() !== '')
    entity.bookEdition = book.volumeLabel;
  return entity;
}

// Phase 5-f-2：BlogPosting JSON-LD（in-body）；canonicalUrl 缺則 null
// Phase 9-g-g-c：新增 isPartOf 欄位（per docs/phase-9g-g-pre-plan.md §5）；與 build-github.js buildSeoForPostDetail() 兩端結構 mirror
// Phase 9-f-g-c：新增 mainEntity = Book 條件式（per docs/phase-9f-g-pre-plan.md §5）；同上 mirror
function buildBloggerJsonLd(post, canonicalUrl, settings, ogImage) {
  if (!canonicalUrl) return null;
  const cat = (settings.categories || []).find(
    (c) => c.id === post.category || c.slug === post.category,
  );
  // Phase 9-g-g-c: isPartOf 採最保守 site/blog 層級（@type=Blog；依 post.primaryPlatform 選擇對應平台 blog 首頁）
  //   - 不使用 book / series / category 當 isPartOf
  //   - 與 build-github.js 兩端 mirror
  const blogSiteUrl =
    post.primaryPlatform === 'blogger'
      ? `${settings.site.bloggerSiteUrl}/`
      : `${settings.site.githubSiteUrl}/`;
  // Phase 9-g-g-d: mentions 接 relatedLinks + otherLinks（per docs/phase-9g-g-pre-plan.md §6）
  //   - 嚴格 pre-filter：array only + title non-empty + url non-empty
  //   - item @type 固定 WebPage；只輸出 @type / name / url 三欄位
  //   - 不映射 platform / kind / description / order / target / rel
  //   - 不臆造 specific subType（VideoObject / Book / Periodical 等）
  //   - 與 build-github.js buildSeoForPostDetail() 兩端 mirror
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

// Phase 5-f-2：OG 欄位（5-f-3 才會被 copy-helper 使用；本階段先建立）
function buildOgFields(post, canonicalUrl, ogImage) {
  return {
    title: post.fbTitle || post.title || '',
    description: post.description || '',
    url: canonicalUrl || '',
    image: ogImage || '',
    alt: post.coverAlt || '',
  };
}

async function renderSummaryPost(post, canonicalUrl, jsonLd) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-post-summary.ejs'),
    // Phase 8-d-3b：additive alias `normalized`（見 renderFullPost 之說明）
    { post, normalized: post.normalized, canonicalUrl, jsonLd },
    { async: true },
  );
}

async function renderRedirectCardPost(post, canonicalUrl) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-redirect-card.ejs'),
    // Phase 8-d-3b：additive alias `normalized`（見 renderFullPost 之說明）
    { post, normalized: post.normalized, canonicalUrl },
    { async: true },
  );
}

// Phase 3-e-6：blogger-home.html（全站索引、依分類分組）
async function renderHomeIndex(data) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-home-index.ejs'),
    data,
    { async: true },
  );
}

// Phase 3-e-6：category-{slug}.html（每分類一份）
async function renderCategoryIndex(data) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-category-index.ejs'),
    data,
    { async: true },
  );
}

// Phase 20260624-sp9d：Blogger operator guidance 投影（display-only；audit metadata only）。
//   - 讀 post.pageType（SP-2 封閉列舉）+ platformPolicy.blogger.{indexing,includeInListings,includeInSitemap}。
//   - platformPolicy 值一律經 resolvePlatformPolicyValue（SP-9a）→ secret-safe + inherit-aware；
//     **不**在 EJS 重寫 secret filtering；suspicious nested key 之 value 永不進投影（source='secret'）。
//   - 純函式；不消費於任何 build 輸出（post.html / robots / sitemap / listing 皆不受影響）。
//   - present=false（無 pageType 且無 platformPolicy.blogger）→ EJS 不渲染 [15] / checklist 區塊
//     → 既有 posts 之 copy-helper.txt / publish-checklist.txt byte-identical。
function deriveBloggerOperatorGuidance(post) {
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
      // 僅保留 value + source；suspicious nested key → value=null / source='secret'（不 echo）。
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

// Phase 3-e-5：copy-helper.txt（純文字、可逐區複製到 Blogger 後台）
// Phase 5-f-3：擴充傳入 ogFields / jsonLd 給 SEO 區段 [7]-[10]
// Phase 20260624-sp9d：additive prop bloggerOperatorGuidance（display-only [15] 區塊）
async function renderCopyHelper(
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
    // Phase 8-d-3b：additive alias `normalized`（見 renderFullPost 之說明）
    // Phase 8-f-5-b：additive props `copyHelperSeriesTitle` / `copyHelperSeriesTitleUnresolvedPlaceholders`
    //   - 由 main loop 預計算（呼叫 resolveTitleTemplate）；helper 與 EJS 自身保持純函式 / 純模板
    //   - 不修改 post.title / post.normalized.display.title / buildMeta() 輸出 / 其他 EJS
    //   - copy-helper.ejs 內僅作為新增「系列組合標題」輔助區塊；不取代原 [1] Blogger 標題
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
// Phase 20260624-sp9d：additive prop bloggerOperatorGuidance（display-only manual-check rows）
async function renderPublishChecklist(post, canonical, meta, bloggerOperatorGuidance) {
  return await ejs.renderFile(
    path.join(VIEWS_DIR, 'blogger', 'blogger-publish-checklist.ejs'),
    // Phase 8-d-3b：additive alias `normalized`（見 renderFullPost 之說明）
    { post, normalized: post.normalized, canonical, meta, bloggerOperatorGuidance },
    { async: true },
  );
}

// Phase 3-e-4：每篇 post 對應 meta.json（uniform schema、缺漏填 null）
function buildMeta(post, { renderedKind, canonical, builtAt, outputDir }) {
  // Phase 8-g-18-d：Blogger tags 輸出來源為 normalized.publish.blogger.tags
  //   - 設計依據：docs/series-schema.md §22 candidate 7 + Phase 8-d normalized-priority pattern
  //   - normalize-post-output.js（Phase 8-g-18-c）已於 normalized.publish.blogger.tags 封裝
  //     fallback chain：post.tags (non-empty) → series.tags (non-empty) → []
  //   - 本欄不直接讀 series.tags / series.hashtags（per §22.5 分離原則）；series.tags 之繼承走 normalize 已封裝
  //   - Phase 8-h-e-1：移除 legacy post.tags fallback（per docs/phase-8h-c-pre-plan.md §3.2 位置 #11；defensive-only，0 active caller across content/）
  const normalizedBloggerTags = post.normalized?.publish?.blogger?.tags;
  const bloggerTags = Array.isArray(normalizedBloggerTags) ? normalizedBloggerTags : [];

  return {
    id: post.id ?? null,
    slug: post.slug,
    title: post.title ?? null,
    titleEn: post.titleEn ?? null,
    // Phase 8-h-e-2-a：meta.json type 欄位來源由 post.type 遷移至 post.normalized.identity.contentKind（per docs/phase-8h-c-pre-plan.md §3.2 位置 #12 第一步；type 欄位本身保留以維持 schema 相容性）
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

async function main() {
  const startedAt = new Date();
  const mode = parseMode(process.argv.slice(2));

  console.log(`[build-blogger] mode=${mode}`);

  const settings = await loadSettings();
  // Phase 8-f-2-b：plumbing — settings 經 loadBloggerPosts 轉發至內部 loadPosts → processMarkdownEntry / normalizePostOutput
  const blogger = await loadBloggerPosts({ settings });

  console.log(
    `[build-blogger] sources scanned: blogger=${blogger.bySource.blogger.scanned}, github-cross=${blogger.bySource.githubCross.scanned}`,
  );
  console.log(
    `[build-blogger]   blogger source: ${blogger.bySource.blogger.ready} ready / ${blogger.bySource.blogger.filtered} filtered`,
  );
  console.log(
    `[build-blogger]   github-cross source: ${blogger.bySource.githubCross.ready} ready / ${blogger.bySource.githubCross.filtered} filtered`,
  );
  console.log(
    `[build-blogger] total ready: ${blogger.totalReady} / total filtered: ${blogger.totalFiltered}`,
  );

  for (const f of blogger.filteredOut) {
    console.log(`[build-blogger]   filtered: ${f.sourcePath} (${f.reason})`);
  }

  const validate = validateContent({ posts: blogger.posts, settings });
  printWarnings(validate.warnings);

  const builtAtIso = startedAt.toISOString();
  const postsManifest = [];
  const indexPosts = [];
  for (const post of blogger.posts) {
    const outputDir = path.join(POSTS_DIR, post.slug);
    const outputFile = path.join(outputDir, 'post.html');
    const metaFile = path.join(outputDir, 'meta.json');

    // Phase 3-e-4：每篇 post 一次性解析 canonical，結果共用於渲染與 meta.json
    const canonical = resolveCanonicalUrl(post, settings);
    if (canonical.warning) blogger.warnings.push(canonical.warning);

    // Phase 5-f-2：SEO helper 預先計算（cover 絕對化 / BlogPosting JSON-LD / OG 欄位）
    // ogFields 5-f-3 才會被 copy-helper 使用；此處先建立避免 5-f-3 再動 build-blogger.js
    const ogImage = absolutizeBloggerCover(post, settings);
    const jsonLd = buildBloggerJsonLd(post, canonical.url, settings, ogImage);
    const ogFields = buildOgFields(post, canonical.url, ogImage);

    let html;
    let renderedKind;
    if (post.bloggerMode === 'full') {
      // Phase 20260523-pm-24b：renderFullPost 新增 settings 參數，用於預處理 relatedLinks / otherLinks reverse UTM。
      //   summary / redirect-card caller 不受影響（其 render function 不需 settings；本批不動）。
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

    await writeText(outputFile, html);
    console.log(`[build-blogger] wrote ${rel(outputFile)} (${renderedKind})`);

    const meta = buildMeta(post, {
      renderedKind,
      canonical,
      builtAt: builtAtIso,
      outputDir,
    });
    await writeJson(metaFile, meta);
    console.log(`[build-blogger] wrote ${rel(metaFile)}`);

    // Phase 3-e-5：copy-helper.txt + publish-checklist.txt
    const copyHelperFile = path.join(outputDir, 'copy-helper.txt');
    const publishChecklistFile = path.join(outputDir, 'publish-checklist.txt');

    // Phase 8-f-5-b：預計算 series.titleTemplate 解析結果，作為 copy-helper 「系列組合標題」輔助區塊
    //   - 僅當 post.normalized.series 存在且 titleTemplate 非空字串時觸發解析
    //   - resolveTitleTemplate 為純函式；不 throw / 不 process.exit；unresolved 保留原文
    //   - 不修改 post.title / post.normalized.display.title / buildMeta 輸出 / 其他 EJS / 其他 dist 路徑
    //   - 現有 fixture 無 series 區塊 → copyHelperSeriesTitle 為 null → EJS 不顯示 [11] 區塊 → copy-helper.txt byte-identical
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
    //   - secret-safe / inherit-aware projection（委派 SP-9a resolvePlatformPolicyValue）
    //   - 不改 post object / post.html / robots / sitemap / listing；無 pageType & 無 platformPolicy.blogger
    //     → present=false → EJS 不渲染 → copy-helper.txt / publish-checklist.txt byte-identical
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
    await writeText(copyHelperFile, copyHelperText);
    await writeText(publishChecklistFile, publishChecklistText);
    console.log(`[build-blogger] wrote ${rel(copyHelperFile)}`);
    console.log(`[build-blogger] wrote ${rel(publishChecklistFile)}`);

    postsManifest.push({
      slug: post.slug,
      title: post.title ?? null,
      bloggerMode: post.bloggerMode,
      sourceSite: post.sourceSite,
      sourcePath: post.sourcePath,
      outputDir: rel(outputDir).replace(/\\/g, '/') + '/',
      rendered: renderedKind,
      metaFile: rel(metaFile).replace(/\\/g, '/'),
      copyHelperFile: rel(copyHelperFile).replace(/\\/g, '/'),
      publishChecklistFile: rel(publishChecklistFile).replace(/\\/g, '/'),
    });

    // Phase 3-e-6：收集索引資料（in-memory）
    // Phase 8-d-3c-8-a：additive 加入 normalized 投影；指向 8-d-2 掛載之 post.normalized。
    //   - 不重新呼叫 normalizePostOutput；不修改既有 8 個投影欄位之語意
    //   - 配合 blogger-category-index.ejs 之 per-item view-model 改造
    //   - blogger-home-index.ejs 之 EJS 改造留待 8-d-3c-8-b（本批先把資料投影備好；blogger-home-index 本批仍不讀 normalized）
    indexPosts.push({
      slug: post.slug,
      title: post.title ?? null,
      description: post.description ?? null,
      category: post.category ?? null,
      date: post.date ?? null,
      bloggerMode: post.bloggerMode,
      canonicalResolved: canonical.url,
      bloggerPublishedUrl: post.blogger?.publishedUrl || null,
      normalized: post.normalized ?? null,
    });
  }

  // Phase 3-e-6：依分類分組（用 settings.categories 解析名稱）
  const findCategory = (ref) =>
    settings.categories?.find((c) => c.id === ref) ||
    settings.categories?.find((c) => c.slug === ref) ||
    null;

  const groupedByCategory = {};
  for (const p of indexPosts) {
    const cat = findCategory(p.category) || {
      slug: p.category || 'uncategorized',
      name: p.category || 'Uncategorized',
    };
    if (!groupedByCategory[cat.slug]) {
      groupedByCategory[cat.slug] = { categoryName: cat.name, slug: cat.slug, posts: [] };
    }
    groupedByCategory[cat.slug].posts.push(p);
  }

  // Phase 3-e-6：產出 blogger-home.html（即使 0 ready post 仍輸出空狀態）
  const homeFile = path.join(DIST_DIR, 'index', 'blogger-home.html');
  const homeHtml = await renderHomeIndex({
    siteName: settings.site?.siteName ?? 'Portable Blog System',
    posts: indexPosts,
    groupedByCategory,
    builtAt: builtAtIso,
  });
  await writeText(homeFile, homeHtml);
  console.log(`[build-blogger] wrote ${rel(homeFile)}`);

  // Phase 3-e-6：產出每個有 ready post 的分類索引
  const categoryFiles = [];
  for (const slug of Object.keys(groupedByCategory)) {
    const group = groupedByCategory[slug];
    const file = path.join(DIST_DIR, 'index', `category-${slug}.html`);
    const html = await renderCategoryIndex({
      categoryName: group.categoryName,
      slug,
      posts: group.posts,
      builtAt: builtAtIso,
    });
    await writeText(file, html);
    console.log(`[build-blogger] wrote ${rel(file)}`);
    categoryFiles.push({
      slug,
      name: group.categoryName,
      file: rel(file).replace(/\\/g, '/'),
      count: group.posts.length,
    });
  }

  for (const w of blogger.warnings) {
    console.log(`[build-blogger]   warning: ${w}`);
  }

  const manifest = {
    buildAt: startedAt.toISOString(),
    mode,
    site: 'blogger',
    totals: {
      scanned: blogger.totalScanned,
      ready: blogger.totalReady,
      filtered: blogger.totalFiltered,
      warnings: blogger.warnings.length + validate.warnings.length,
    },
    bySource: blogger.bySource,
    posts: postsManifest,
    filteredOut: blogger.filteredOut,
    warnings: blogger.warnings,
    indexFiles: {
      home: rel(homeFile).replace(/\\/g, '/'),
      categories: categoryFiles,
    },
  };
  await writeJson(MANIFEST_FILE, manifest);
  console.log(`[build-blogger] wrote ${rel(MANIFEST_FILE)}`);

  const elapsed = Date.now() - startedAt.getTime();
  console.log(`[build-blogger] done in ${elapsed}ms`);
}

main().catch((err) => {
  console.error('[build-blogger] failed:', err);
  process.exit(1);
});
