// Phase Admin-1-b：dev-mode-only Admin read-only loader
//   - 直接 glob content/{github,blogger}/posts/*.md（排除 .fb.md）
//   - 不沿用 load-posts.js 之 status filter（admin 需顯示 draft 含其他狀態）
//   - 不寫入任何檔案；不修改既有資料
//   - 不複製 build-blogger / build-github 之渲染邏輯
//   - 同時讀對應 .publish.json 與 .fb.md 之存在狀態（不解析 .fb.md 內文）

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
// Phase 20260608 commerce-admin-selector-readonly-preview-implementation-a
//   - read-only helper for commerce selector / registry preview UI（per docs/20260608-commerce-admin-selector-*.md）
//   - 只讀 production settings.commerceLinks；只輸出 safe 欄位；不啟用 Admin Apply / middleware / admin-write-cli
import { buildCommerceLinkPreviewOptions, ALLOWED_COMMERCE_ROLES } from './active-commerce-links.js';
// Phase 20260615-night-3-admin-posts-index-readonly-derive-fields-a
//   - 重用既有 AdSense resolver 推導 per-post 可解析 block 數（pages / blogger 各一）
//   - 純函式；nullable input 一律回 {}；不 mutate post / settings；不打外部 API
//   - 不修改 resolver 本身；不改 ads.config.json；不改 GA4 設定
import { deriveRenderedAdsenseBlocks } from './resolve-adsense-blocks.js';
// Phase 20260623-pm-sp7a-admin-readonly-page-metadata-summary-a
//   - read-only special page-type / indexing metadata 投影（SP-7a；per docs/20260623-pm-sp7-*.md §E/§G）
//   - 純函式；委派既有 SP-3/4a/5a helper + mirror SP-2 validator warning；不啟用 write path
//   - 只投影 gatedDownload / platformPolicy 之 safe 欄位；不洩 secret / token / 表單回覆 / 私有 URL
import { derivePageMetadataView } from './page-metadata-summary.js';

const SITES = ['github', 'blogger'];

// Phase 20260616-admin-validation-report-detail-panel-readonly-consume-implementation-a：
//   read-only consume of the git-ignored validation report cache produced by
//   report-validation.js (`npm run report:validation`). Join contract per pm-14 §D.
//   - PROJECT_ROOT derived from this file location → admin absolute sourcePath normalises
//     to the SAME repo-relative posix key the validator emits (load-posts.js toRelative).
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const VALIDATION_REPORT_PATH = path.join(PROJECT_ROOT, '.cache', 'data', 'validation-report.json');

// Phase 20260615-night-1-admin-ia-shell-implementation-a
//   - read-only systemSummary：把分散在 settings.* 之全站狀態彙整成可在 ADMIN dashboard 顯示的 read-only 摘要
//   - 不暴露 AdSense real client / slot id 全值（呼叫端可以 last4 mask；本 helper 只回 4-char tail）
//   - 不暴露任何 commerce token / credential / merchant secret
//   - 純 derived；不寫檔；不打外部 API；不算 cross-post resolver；不 mutate settings
function safeTail4(s) {
  if (typeof s !== 'string' || s.length === 0) return '';
  return s.slice(-4);
}

function buildSystemSummary(settings) {
  const site = settings?.site || {};
  const categories = Array.isArray(settings?.categories) ? settings.categories : [];
  const tags = Array.isArray(settings?.tags) ? settings.tags : [];
  const ads = settings?.ads || {};
  const ga4 = settings?.ga4 || {};
  const commerceLinks = Array.isArray(settings?.commerceLinks) ? settings.commerceLinks : [];
  const affiliateNetworks = Array.isArray(settings?.affiliateNetworks) ? settings.affiliateNetworks : [];
  const linkSources = Array.isArray(settings?.linkSources?.sources) ? settings.linkSources.sources : [];
  const downloadAssets = Array.isArray(settings?.downloadAssets?.assets) ? settings.downloadAssets.assets : [];
  const downloadForms = Array.isArray(settings?.downloadForms?.forms) ? settings.downloadForms.forms : [];

  const adsSlots = ads?.slots || {};
  const defaultBlocks = Array.isArray(ads?.defaults?.blocks) ? ads.defaults.blocks : [];
  const nonEmptySlotCount = Object.values(adsSlots).filter((v) => typeof v === 'string' && v !== '').length;

  // category / tag site usage counts（純 derive，不對 site 寫死順序；只列 github / blogger 兩 surface）
  function countBySite(arr) {
    let g = 0, b = 0;
    for (const it of arr) {
      const s = Array.isArray(it?.site) ? it.site : [];
      if (s.includes('github')) g++;
      if (s.includes('blogger')) b++;
    }
    return { github: g, blogger: b };
  }

  return {
    site: {
      siteName: typeof site.siteName === 'string' ? site.siteName : '',
      author: typeof site.author === 'string' ? site.author : '',
      language: typeof site.language === 'string' ? site.language : '',
      description: typeof site.description === 'string' ? site.description : '',
      githubSiteUrl: typeof site.githubSiteUrl === 'string' ? site.githubSiteUrl : '',
      bloggerSiteUrl: typeof site.bloggerSiteUrl === 'string' ? site.bloggerSiteUrl : '',
    },
    categories: {
      total: categories.length,
      bySite: countBySite(categories),
      list: categories.map((c) => ({
        id: typeof c.id === 'string' ? c.id : '',
        name: typeof c.name === 'string' ? c.name : '',
        slug: typeof c.slug === 'string' ? c.slug : '',
        site: Array.isArray(c.site) ? c.site : [],
      })),
    },
    tags: {
      total: tags.length,
      bySite: countBySite(tags),
    },
    ads: {
      enabled: ads.enabled === true,
      hasClient: typeof ads.adsenseClient === 'string' && ads.adsenseClient !== '',
      clientTail4: safeTail4(typeof ads.adsenseClient === 'string' ? ads.adsenseClient : ''),
      nonEmptySlotCount,
      defaultBlocksCount: defaultBlocks.length,
      defaultBlocksEnabledCount: defaultBlocks.filter((b) => b && b.enabled === true).length,
      loaderPages: typeof ads?.loader?.pages === 'string' ? ads.loader.pages : '',
      loaderBlogger: typeof ads?.loader?.blogger === 'string' ? ads.loader.blogger : '',
    },
    ga4: {
      enabled: ga4.enabled === true,
      hasMeasurementId: typeof ga4.measurementId === 'string' && ga4.measurementId !== '',
      measurementIdTail4: safeTail4(typeof ga4.measurementId === 'string' ? ga4.measurementId : ''),
      eventsCount: Array.isArray(ga4.events) ? ga4.events.length : 0,
      events: Array.isArray(ga4.events) ? ga4.events.slice(0) : [],
    },
    commerce: {
      registrySize: commerceLinks.length,
      activeCount: commerceLinks.filter((c) => c && c.active !== false).length,
      affiliateNetworksCount: affiliateNetworks.length,
    },
    downloads: {
      assetsCount: downloadAssets.length,
      formsCount: downloadForms.length,
    },
    linkSourcesCount: linkSources.length,
  };
}

// Phase 20260615-night-5-admin-categories-readonly-usage-counts-a
//   - read-only category usage aggregator：把每個 categories.json 已定義之 category 對映到目前使用該分類之文章清單摘要
//   - 同時收集 uncategorized（無 category）與 unknown（使用了未在 categories.json 之 category）兩個 bucket
//   - 純 derive；不寫檔；不改 frontmatter / settings；不打 API
//   - 與 validate-content 之 unknown-category / category-site-mismatch warning 為兩個獨立 surface（admin 只摘要分類使用狀態，
//     不取代 validator；validator 仍是 ready/published 篇之 sourcePath 維度 ground truth）
//   - sample posts 限額（per-category 10 / unknown 5）避免頁面變得太長；超出時 truncated=true
//   - sample 中之 status / sourceSite / slug / title 皆來自 admin loader 既有欄位（不另讀檔）
//
//   Status breakdown：mirror 既有 admin stats 用之 normalize（ready / draft / published / archived / other）
//   Cross-site mismatch：當 category.site 為陣列且 post.sourceSite 不在其中時計入
//                       （與 validator §category-site-mismatch 同概念但 admin 用 sourceSite，不用 post.site
//                        — admin loader 沒有獨立 site 欄位，sourceSite 為 content/{site}/posts/ 之 site；
//                        實務上 sourceSite 即為作者意圖之主寫站台）
const CATEGORY_SAMPLE_LIMIT = 10;
const UNKNOWN_CATEGORY_SAMPLE_LIMIT = 5;
const UNCATEGORIZED_SAMPLE_LIMIT = 10;

function normalizeStatusBucket(status) {
  if (status === 'ready' || status === 'draft' || status === 'published' || status === 'archived') return status;
  return 'other';
}

function buildEmptyStatusBreakdown() {
  return { ready: 0, draft: 0, published: 0, archived: 0, other: 0 };
}

function toSamplePostEntry(p, opts) {
  const isMismatch = opts && opts.isMismatch === true;
  return {
    slug: typeof p.slug === 'string' ? p.slug : '',
    title: typeof p.title === 'string' ? p.title : '',
    status: typeof p.status === 'string' ? p.status : '',
    sourceSite: typeof p.sourceSite === 'string' ? p.sourceSite : '',
    draft: p.draft === true,
    isMismatch,
  };
}

function buildCategoryUsage(posts, categoriesArr) {
  const categories = Array.isArray(categoriesArr) ? categoriesArr : [];
  // 同一 category entry 可被 post.category 用 id 或 slug 參照；驗證器與 admin 兩處皆採 id-or-slug match
  const entryMap = new Map();
  const keyToEntry = new Map(); // 'id:tech-note' / 'slug:tech-note' → entry
  for (const c of categories) {
    if (!c || typeof c !== 'object') continue;
    const id = typeof c.id === 'string' ? c.id : '';
    const slug = typeof c.slug === 'string' ? c.slug : '';
    const name = typeof c.name === 'string' ? c.name : '';
    const site = Array.isArray(c.site) ? c.site.slice(0) : [];
    if (!id && !slug) continue;
    const entry = {
      id, name, slug, site,
      postCount: 0,
      statusBreakdown: buildEmptyStatusBreakdown(),
      siteBreakdown: { github: 0, blogger: 0 },
      crossSiteMismatchCount: 0,
      samplePosts: [],
      truncated: false,
    };
    entryMap.set(id || slug, entry);
    if (id) keyToEntry.set('id:' + id, entry);
    if (slug) keyToEntry.set('slug:' + slug, entry);
  }

  // unknown buckets：以原始字串 key 分組（不 normalize；保持作者填寫之原貌）
  const unknownMap = new Map();
  let uncategorizedCount = 0;
  const uncategorizedSamples = [];
  let uncategorizedTruncated = false;

  let categorizedCount = 0;
  let unknownCount = 0;

  const arr = Array.isArray(posts) ? posts : [];
  for (const p of arr) {
    const raw = typeof p?.category === 'string' ? p.category : '';
    const cat = raw.trim();
    if (!cat) {
      uncategorizedCount++;
      if (uncategorizedSamples.length < UNCATEGORIZED_SAMPLE_LIMIT) {
        uncategorizedSamples.push(toSamplePostEntry(p));
      } else {
        uncategorizedTruncated = true;
      }
      continue;
    }
    const entry = keyToEntry.get('id:' + cat) || keyToEntry.get('slug:' + cat);
    if (entry) {
      categorizedCount++;
      entry.postCount += 1;
      const bucket = normalizeStatusBucket(p.status);
      entry.statusBreakdown[bucket] += 1;
      const ss = typeof p.sourceSite === 'string' ? p.sourceSite : '';
      if (ss === 'github') entry.siteBreakdown.github += 1;
      else if (ss === 'blogger') entry.siteBreakdown.blogger += 1;
      const isMismatch = Array.isArray(entry.site) && entry.site.length > 0 && ss && !entry.site.includes(ss);
      if (isMismatch) entry.crossSiteMismatchCount += 1;
      if (entry.samplePosts.length < CATEGORY_SAMPLE_LIMIT) {
        entry.samplePosts.push(toSamplePostEntry(p, { isMismatch }));
      } else {
        entry.truncated = true;
      }
    } else {
      unknownCount++;
      let bucket = unknownMap.get(cat);
      if (!bucket) {
        bucket = {
          key: cat,
          postCount: 0,
          statusBreakdown: buildEmptyStatusBreakdown(),
          samplePosts: [],
          truncated: false,
        };
        unknownMap.set(cat, bucket);
      }
      bucket.postCount += 1;
      bucket.statusBreakdown[normalizeStatusBucket(p.status)] += 1;
      if (bucket.samplePosts.length < UNKNOWN_CATEGORY_SAMPLE_LIMIT) {
        bucket.samplePosts.push(toSamplePostEntry(p));
      } else {
        bucket.truncated = true;
      }
    }
  }

  const perCategory = Array.from(entryMap.values());
  // 排序：使用篇數多者前；同數量時以 id 字典序
  perCategory.sort((a, b) => {
    if (b.postCount !== a.postCount) return b.postCount - a.postCount;
    return (a.id || a.slug).localeCompare(b.id || b.slug);
  });
  const unusedCategories = perCategory.filter((e) => e.postCount === 0);

  const unknownCategoriesList = Array.from(unknownMap.values()).sort((a, b) => {
    if (b.postCount !== a.postCount) return b.postCount - a.postCount;
    return a.key.localeCompare(b.key);
  });

  return {
    perCategory,
    unusedCategories,
    unknownCategories: unknownCategoriesList,
    uncategorized: {
      count: uncategorizedCount,
      samplePosts: uncategorizedSamples,
      truncated: uncategorizedTruncated,
    },
    totals: {
      totalPosts: arr.length,
      categorizedPosts: categorizedCount,
      uncategorizedPosts: uncategorizedCount,
      unknownCategoryPosts: unknownCount,
      definedCategoryCount: perCategory.length,
      unusedCategoryCount: unusedCategories.length,
      unknownCategoryKeyCount: unknownCategoriesList.length,
    },
  };
}

// Phase 20260615-night-7-admin-tags-readonly-usage-counts-a
//   - read-only tag usage aggregator：把每個 tags.json 已定義之 tag 對映到目前使用該 tag 之文章清單摘要
//   - mirror buildCategoryUsage 之結構，差異：
//       * tag 為 array（一篇文章可有多個 tag），同篇文章對同 tag 不重複計（per-post 內 dedupe）
//       * untagged = 文章 frontmatter.tags 為空陣列或缺欄位
//       * unknown tag = 文章使用了未在 tags.json 之 tag key
//       * 一篇文章若同時用了 known + unknown tag，會同時出現在 known tag 之 sample 與 unknown bucket 之 sample
//   - 純 derive；不寫檔；不改 frontmatter / settings；不打 API
//   - 與 validate-content 之 unknown-tag / tag-site-mismatch warning 為兩個獨立 surface（admin 只摘要使用狀態，
//     不取代 validator；validator 仍為 ground truth）
//   - 共用 CATEGORY_SAMPLE_LIMIT / UNKNOWN_CATEGORY_SAMPLE_LIMIT / UNCATEGORIZED_SAMPLE_LIMIT 常數
//     （tag 與 category 一致，避免 admin 頁面變得過長）
function buildTagUsage(posts, tagsArr) {
  const tags = Array.isArray(tagsArr) ? tagsArr : [];
  const entryMap = new Map();
  const keyToEntry = new Map();
  for (const t of tags) {
    if (!t || typeof t !== 'object') continue;
    const id = typeof t.id === 'string' ? t.id : '';
    const slug = typeof t.slug === 'string' ? t.slug : '';
    const name = typeof t.name === 'string' ? t.name : '';
    const site = Array.isArray(t.site) ? t.site.slice(0) : [];
    if (!id && !slug) continue;
    const entry = {
      id, name, slug, site,
      postCount: 0,
      statusBreakdown: buildEmptyStatusBreakdown(),
      siteBreakdown: { github: 0, blogger: 0 },
      crossSiteMismatchCount: 0,
      samplePosts: [],
      truncated: false,
    };
    entryMap.set(id || slug, entry);
    if (id) keyToEntry.set('id:' + id, entry);
    if (slug) keyToEntry.set('slug:' + slug, entry);
  }

  const unknownMap = new Map();
  let untaggedCount = 0;
  const untaggedSamples = [];
  let untaggedTruncated = false;
  let postWithUnknownTagCount = 0;

  const arr = Array.isArray(posts) ? posts : [];
  for (const p of arr) {
    const rawTags = Array.isArray(p?.tags) ? p.tags : [];
    if (rawTags.length === 0) {
      untaggedCount++;
      if (untaggedSamples.length < UNCATEGORIZED_SAMPLE_LIMIT) {
        untaggedSamples.push(toSamplePostEntry(p));
      } else {
        untaggedTruncated = true;
      }
      continue;
    }

    // per-post dedupe：同篇若意外重複列同 tag，只計一次
    const seen = new Set();
    let hasUnknown = false;
    for (const tRaw of rawTags) {
      if (typeof tRaw !== 'string') continue;
      const tag = tRaw.trim();
      if (!tag || seen.has(tag)) continue;
      seen.add(tag);
      const entry = keyToEntry.get('id:' + tag) || keyToEntry.get('slug:' + tag);
      if (entry) {
        entry.postCount += 1;
        const bucket = normalizeStatusBucket(p.status);
        entry.statusBreakdown[bucket] += 1;
        const ss = typeof p.sourceSite === 'string' ? p.sourceSite : '';
        if (ss === 'github') entry.siteBreakdown.github += 1;
        else if (ss === 'blogger') entry.siteBreakdown.blogger += 1;
        const isMismatch = Array.isArray(entry.site) && entry.site.length > 0 && ss && !entry.site.includes(ss);
        if (isMismatch) entry.crossSiteMismatchCount += 1;
        if (entry.samplePosts.length < CATEGORY_SAMPLE_LIMIT) {
          entry.samplePosts.push(toSamplePostEntry(p, { isMismatch }));
        } else {
          entry.truncated = true;
        }
      } else {
        hasUnknown = true;
        let bucket = unknownMap.get(tag);
        if (!bucket) {
          bucket = {
            key: tag,
            postCount: 0,
            statusBreakdown: buildEmptyStatusBreakdown(),
            samplePosts: [],
            truncated: false,
          };
          unknownMap.set(tag, bucket);
        }
        bucket.postCount += 1;
        bucket.statusBreakdown[normalizeStatusBucket(p.status)] += 1;
        if (bucket.samplePosts.length < UNKNOWN_CATEGORY_SAMPLE_LIMIT) {
          bucket.samplePosts.push(toSamplePostEntry(p));
        } else {
          bucket.truncated = true;
        }
      }
    }
    if (hasUnknown) postWithUnknownTagCount++;
  }

  const perTag = Array.from(entryMap.values());
  perTag.sort((a, b) => {
    if (b.postCount !== a.postCount) return b.postCount - a.postCount;
    return (a.id || a.slug).localeCompare(b.id || b.slug);
  });
  const unusedTags = perTag.filter((e) => e.postCount === 0);

  const unknownTagsList = Array.from(unknownMap.values()).sort((a, b) => {
    if (b.postCount !== a.postCount) return b.postCount - a.postCount;
    return a.key.localeCompare(b.key);
  });

  const taggedPostCount = arr.length - untaggedCount;
  return {
    perTag,
    unusedTags,
    unknownTags: unknownTagsList,
    untagged: {
      count: untaggedCount,
      samplePosts: untaggedSamples,
      truncated: untaggedTruncated,
    },
    totals: {
      totalPosts: arr.length,
      taggedPosts: taggedPostCount,
      untaggedPosts: untaggedCount,
      postWithUnknownTagCount,
      definedTagCount: perTag.length,
      unusedTagCount: unusedTags.length,
      unknownTagKeyCount: unknownTagsList.length,
    },
  };
}

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

// Phase 20260615-night-3-admin-posts-index-readonly-derive-fields-a
//   - 依 fm.seo.indexing 判斷該文章對搜尋引擎之 indexable 狀態（純 derive；不打 robots.txt / sitemap）
//   - VALID_SEO_INDEXING（mirror validate-content.js §33 之 enum）：'index' | 'noindex-follow' | 'noindex-nofollow'
//   - 缺欄位或非 string → 視為 'unknown'（不假設預設值；UI 顯示 unknown 而非「indexable」以免誤導）
//   - 不重新實作 build-github.js §293 之 robots meta precedence；admin 只摘要 source-of-truth 結果
function deriveSeoIndexingStatus(fm) {
  if (!fm || typeof fm !== 'object') return { value: '', indexable: null, source: 'no-frontmatter' };
  const seo = fm.seo;
  if (!seo || typeof seo !== 'object' || Array.isArray(seo)) {
    // 無 seo block → 採 build-github 之 default 行為（per docs/seo-indexing-rules.md §3 fallback）
    return { value: '', indexable: true, source: 'default' };
  }
  const v = typeof seo.indexing === 'string' ? seo.indexing : '';
  if (v === 'index') return { value: v, indexable: true, source: 'frontmatter.seo.indexing' };
  if (v === 'noindex-follow' || v === 'noindex-nofollow') {
    return { value: v, indexable: false, source: 'frontmatter.seo.indexing' };
  }
  if (v === '') return { value: '', indexable: true, source: 'default' };
  // 不合法值 → 不猜；validator 會以 invalid-seo-indexing warning 提示作者
  return { value: v, indexable: null, source: 'frontmatter.seo.indexing (invalid value)' };
}

// Phase 20260615-night-3-admin-posts-index-readonly-derive-fields-a
//   - 純 derive；呼叫既有 deriveRenderedAdsenseBlocks 對單 post + surface 算可解析 block 數
//   - resolver 對 null / wrong shape 一律回 {}；本 helper 只回 number（block count）
//   - 不 leak slot id / client id；只回 count
//   - resolver 全域 gate：settings.ads.enabled 必須為 true；否則回 {} → count = 0
function countResolvedAdsenseBlocks(post, adsSettings, surface) {
  try {
    const map = deriveRenderedAdsenseBlocks(post, adsSettings, surface);
    if (!map || typeof map !== 'object') return 0;
    let n = 0;
    for (const key of Object.keys(map)) {
      const arr = map[key];
      if (Array.isArray(arr)) n += arr.length;
    }
    return n;
  } catch {
    return 0;
  }
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

  // Phase 20260615-night-3-admin-posts-index-readonly-derive-fields-a
  //   - 6 組 readiness derive（content / nav / GA4 / AdSense / validation / timestamp）
  //   - 全部 read-only；不寫檔；不打 API；不抓 GA4 / AdSense 後台；不重寫 validator
  //   - source 一律明示（'frontmatter' / 'frontmatter.seo.indexing' / 'settings.ads' / 'settings.ga4'
  //     / 'resolve-adsense-blocks.js' / 'template-level' / 'deferred'）
  //   - 不在此處硬編 real id；ID 從 settings 讀，render 端遮罩
  //   - SEO indexable 判斷見 deriveSeoIndexingStatus（mirror build-github 之 robots precedence）
  const seoIndexing = deriveSeoIndexingStatus(fm);
  const adsSettings = settings?.ads || {};
  const ga4Settings = settings?.ga4 || {};

  // content readiness（純摘要既有欄位；不新增 schema）
  const contentReadiness = {
    titleExists: typeof fm.title === 'string' && fm.title.trim() !== '',
    slugExists: slug !== '',
    contentKindExists: contentKind !== '',
    statusValue: typeof fm.status === 'string' ? fm.status : '',
    draftFlag: fm.draft === true,
    categoryExists: category !== '',
    tagCount: tags.length,
  };

  // navigation readiness（明示只能保證模板層級；無 live GA4 點擊驗證來源）
  //   - 模板層級 ready：build-github.js post-detail.ejs 已含 prev / next / home / GA4 attr（N8 anchor wiring landed）
  //   - perPostLiveVerified：除非有既有文件支持，否則一律 false（不偽稱已驗）
  //   - eligibleForNav：post.publishTargets.github.enabled === true（有 GitHub Pages 渲染目標）才可能被
  //     列為 prev / next 候選；其他情況顯示「not eligible」
  const navReadiness = {
    templateLevel: 'ready',
    perPostLiveVerified: false,
    eligibleForNav: github.enabled === true,
    source: 'template-level (build-github.js post-detail.ejs)',
    note: 'GA4 點擊事件實際送達須以 GA4 後台 / DebugView / Exploration 驗證；admin 不抓 GA4 報表',
  };

  // GA4 readiness（純 static config / markup 層級；不打 GA4 API；不抓報表）
  //   - configEnabled / hasMeasurementId / measurementIdTail4 來自 settings.ga4（已 systemSummary 暴露 tail4）
  //   - surfaceIndexable：seo.indexing != 'noindex-*' && publishTargets.github.enabled
  //     （noindex 文章仍可載 GA4 tracker；此欄純粹標示「是否被搜尋引擎收錄」之 readiness）
  //   - eventsRegistered：events 註冊清單長度
  //   - perPostEventReceived：'unknown'（不查 GA4；不假設）
  const ga4Readiness = {
    configEnabled: ga4Settings.enabled === true,
    hasMeasurementId: typeof ga4Settings.measurementId === 'string' && ga4Settings.measurementId !== '',
    measurementIdTail4: safeTail4(typeof ga4Settings.measurementId === 'string' ? ga4Settings.measurementId : ''),
    eventsRegistered: Array.isArray(ga4Settings.events) ? ga4Settings.events.length : 0,
    surfaceIndexable: seoIndexing.indexable,
    seoIndexingValue: seoIndexing.value,
    seoIndexingSource: seoIndexing.source,
    perPostEventReceived: 'unknown',
    source: 'static-config (settings.ga4 + frontmatter.seo.indexing)',
    note: 'ADMIN 不打 GA4 API、不抓報表；GA4 P1 article bottom nav 已於 docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md 驗證',
  };

  // AdSense readiness（per-post）
  //   - 呼叫 deriveRenderedAdsenseBlocks(post-shape, settings.ads, surface) 算每 surface 可解析 block 數
  //   - resolver 全域 gate（per resolve-adsense-blocks.js）：
  //       ads.enabled !== true / adsenseClient 空 / slots 非 plain object / surface 非 'pages'|'blogger'
  //         → 全部回 {}，count = 0
  //   - post-shape 只需 { adsense: fm.adsense }；resolver 不依賴其他欄位
  //   - 不暴露 client / slot id；只回 number
  const postShapeForResolver = { adsense: fm?.adsense };
  const adsenseReadiness = {
    configEnabled: adsSettings.enabled === true,
    hasClient: typeof adsSettings.adsenseClient === 'string' && adsSettings.adsenseClient !== '',
    pagesBlockCount: countResolvedAdsenseBlocks(postShapeForResolver, adsSettings, 'pages'),
    bloggerBlockCount: countResolvedAdsenseBlocks(postShapeForResolver, adsSettings, 'blogger'),
    postLevelEnabled: !(fm?.adsense && fm.adsense.enabled === false),
    overrideSource: (fm?.adsense && Array.isArray(fm.adsense.blocks) && fm.adsense.blocks.length > 0)
      ? 'post.adsense.blocks'
      : (Array.isArray(adsSettings?.defaults?.blocks) && adsSettings.defaults.blocks.length > 0
        ? 'settings.ads.defaults.blocks'
        : 'none'),
    source: 'resolve-adsense-blocks.js (read-only; not deploying)',
    note: '此為 build-time resolver 之預期結果；live 廣告是否填充屬 AdSense 端，admin 不抓後台',
  };

  // Validation per-post warning aggregation：deferred
  //   - 原因：validate:content 主入口走 src/scripts/load-posts.js 之 post-shape；
  //     admin 之 loadAdminPosts 為獨立 loader（含 draft / fixture / 全 status）；
  //     兩 loader 路徑表示法不同（loadAdminPosts 用 path.resolve(mdPath) 絕對路徑；
  //     validateContent 內部 issue.sourcePath 為相對路徑）；
  //     對齊兩端 / 改 validator 為 per-post API 屬獨立 phase，不在本 phase 範圍。
  //   - 不在 admin 內 re-run validator（避免 double-run、loader-drift、效能、誤差）。
  //   - UI 顯示 'deferred'；docs 紀錄理由。
  const validationReadiness = {
    perPostWarningCount: 'deferred',
    reason: 'validate-content uses load-posts.js post-shape with relative sourcePath; admin loader uses absolute path; cross-loader join deferred',
    source: 'deferred',
    aggregateCommand: 'npm run validate:content',
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

  // Phase 20260623-pm-sp7a-admin-readonly-page-metadata-summary-a
  //   - additive read-only special page-type / indexing metadata 投影（SP-7a）
  //   - 委派既有 SP-3/4a/5a helper（robots / listing / sitemap）+ mirror SP-2 validator warning
  //   - 缺省欄位 → default / current behavior（非 error）；gatedDownload / platformPolicy 只投影 safe 欄位
  //   - 既有 view 忽略本欄位 → backout cost = 0（mirror governanceSignals 之 additive 慣例）
  //   - 不啟用 write path；不改 frontmatter；validator（validate:content）仍為 ground truth
  const pageMetadata = derivePageMetadataView(fm);

  return {
    sourceSite: siteName,
    sourcePath: mdPath,
    // Phase 20260617-night-phase2-admin-ui-static-payload-preview-implementation-a:
    //   - additive read-only repo-relative posix path（mirror toNormalizedKey 之 pm-14 §D.1 慣例）
    //   - 用途：Admin UI static payload preview 之 targetRel 來源（server-side derive；不可 client 端字串拼湊）
    //   - 不啟用任何寫入；preview-only；deterministic（pure 函式 + absolute path normalisation）
    sourceRel: toNormalizedKey(mdPath),
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
    // Phase 20260615-night-3-admin-posts-index-readonly-derive-fields-a
    //   - 6 組 readiness 物件（每組附 source / note 欄位明示限制）
    //   - 不在 EJS 端組裝；不暴露 real id；不偽稱已驗證
    contentReadiness,
    navReadiness,
    ga4Readiness,
    adsenseReadiness,
    validationReadiness,
    // Phase 20260623-pm-sp7a-admin-readonly-page-metadata-summary-a
    //   - read-only special page-type / indexing metadata 投影（pure derive；§E/§G）
    pageMetadata,
  };
}

// Phase 20260520-b-2: sort helper；不可解析或空值回傳 0；不 throw
function getSortTime(value) {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

// Phase 20260616-am-5-admin-suggested-fix-loader-derive-implementation-a：
//   - additive read-only governance lookup helper
//   - 建構 registry → { id / slug / site[] } Map（'id:KEY' / 'slug:KEY' 二鍵）
//   - 純函式；不寫檔；不打 API；不改 settings；mirror buildCategoryUsage / buildTagUsage 之 admin 慣例
function buildTaxonomyLookup(arr) {
  const map = new Map();
  if (!Array.isArray(arr)) return map;
  for (const e of arr) {
    if (!e || typeof e !== 'object') continue;
    const id = typeof e.id === 'string' ? e.id : '';
    const slug = typeof e.slug === 'string' ? e.slug : '';
    const site = Array.isArray(e.site) ? e.site.slice(0) : [];
    if (!id && !slug) continue;
    const entry = { id, slug, site };
    if (id) map.set('id:' + id, entry);
    if (slug) map.set('slug:' + slug, entry);
  }
  return map;
}

// Phase 20260616-am-5-admin-suggested-fix-loader-derive-implementation-a：
//   - additive read-only post.governanceSignals 純函式 derive
//   - 五欄位 contract（count / boolean 純值）：
//       unknownTagCount: number               — registry 找不到對應 id / slug 之 tag 數
//       unknownCategoryFlag: boolean          — registry 找不到對應 id / slug 之 category（非空時）
//       crossSiteMismatchTagCount: number     — tag.site 不含本文 sourceSite 之 tag 數
//       crossSiteMismatchCategoryFlag: boolean — category.site 不含本文 sourceSite
//       signalSum: number                     — 上四項合計（boolean 算 1）
//   - 本切片只新增 derive 欄位；不改 EJS / view；既有 view 忽略本欄位 → backout cost = 0
//   - 不寫檔；不打 API；不改 frontmatter / registry / settings；不引入修法建議或 per-post prescription
//   - sourceSite-based mismatch（同 buildCategoryUsage / buildTagUsage 之 admin 慣例；非 validator 之 post.site）
//   - uncategorized（post.category 空）/ untagged（post.tags 空）不計入本欄位（屬既有 bucket 計數責任）
function derivePostGovernanceSignals(post, catLookup, tagLookup) {
  const sourceSite = typeof post?.sourceSite === 'string' ? post.sourceSite : '';

  // category signals
  const rawCat = typeof post?.category === 'string' ? post.category.trim() : '';
  let unknownCategoryFlag = false;
  let crossSiteMismatchCategoryFlag = false;
  if (rawCat) {
    const ce = catLookup.get('id:' + rawCat) || catLookup.get('slug:' + rawCat);
    if (!ce) {
      unknownCategoryFlag = true;
    } else if (sourceSite && Array.isArray(ce.site) && ce.site.length > 0 && !ce.site.includes(sourceSite)) {
      crossSiteMismatchCategoryFlag = true;
    }
  }

  // tag signals
  let unknownTagCount = 0;
  let crossSiteMismatchTagCount = 0;
  const tagsArr = Array.isArray(post?.tags) ? post.tags : [];
  for (const t of tagsArr) {
    const raw = typeof t === 'string' ? t.trim() : '';
    if (!raw) continue;
    const te = tagLookup.get('id:' + raw) || tagLookup.get('slug:' + raw);
    if (!te) {
      unknownTagCount += 1;
    } else if (sourceSite && Array.isArray(te.site) && te.site.length > 0 && !te.site.includes(sourceSite)) {
      crossSiteMismatchTagCount += 1;
    }
  }

  const signalSum = unknownTagCount
    + (unknownCategoryFlag ? 1 : 0)
    + crossSiteMismatchTagCount
    + (crossSiteMismatchCategoryFlag ? 1 : 0);

  return {
    unknownTagCount,
    unknownCategoryFlag,
    crossSiteMismatchTagCount,
    crossSiteMismatchCategoryFlag,
    signalSum,
  };
}

// Phase 20260616-admin-validator-per-post-aggregation-implementation-a：
//   - additive read-only per-post governance signal aggregation（純函式）
//   - 把既有 derivePostGovernanceSignals 之 5 欄位 governanceSignals 整理成「可被 Admin
//     read-only UI 直接列舉」之 deterministic 結構（signals[] + byClass + total）
//   - 資料來源僅 = 既有 per-post governanceSignals（taxonomy 概念：unknown tag / category +
//     cross-site mismatch tag / category）。不重新定義規則、不重跑 validator、不 join validator warnings。
//     per-post validator warning aggregation 仍 deferred（見 toAdminView validationReadiness）；
//     本欄位呈現的是 governance signal（admin universe，含 draft），不可誤稱為 validator warning count。
//   - 不寫檔；不打 API；不改 frontmatter / settings；不引入 per-post 修法建議（prescription）；warning-only / read-only。
//   - Deterministic 保證：
//       * signal 列舉順序固定（GOVERNANCE_SIGNAL_ORDER 常數；與 post 順序、Map 走訪順序無關）
//       * count 由既有欄位直接取值（純值；無隨機 / 無時間依賴 / 無外部 I/O）
//       * 只列 count > 0 之 signal（穩定過濾）；totalSignalCount 由各 count 相加（不依賴 signalSum，交叉檢核用）
const GOVERNANCE_SIGNAL_ORDER = [
  { type: 'unknown-tag', class: 'taxonomy', field: 'unknownTagCount', kind: 'count' },
  { type: 'unknown-category', class: 'taxonomy', field: 'unknownCategoryFlag', kind: 'flag' },
  { type: 'cross-site-mismatch-tag', class: 'taxonomy', field: 'crossSiteMismatchTagCount', kind: 'count' },
  { type: 'cross-site-mismatch-category', class: 'taxonomy', field: 'crossSiteMismatchCategoryFlag', kind: 'flag' },
];

export function aggregatePostGovernanceSignals(signals) {
  const s = signals && typeof signals === 'object' ? signals : {};
  const list = [];
  const byClass = {};
  let total = 0;
  for (const def of GOVERNANCE_SIGNAL_ORDER) {
    const rawVal = s[def.field];
    let count;
    if (def.kind === 'flag') {
      count = rawVal === true ? 1 : 0;
    } else {
      count = (typeof rawVal === 'number' && Number.isFinite(rawVal) && rawVal > 0) ? Math.floor(rawVal) : 0;
    }
    if (count > 0) {
      list.push({ type: def.type, class: def.class, count });
      byClass[def.class] = (byClass[def.class] || 0) + count;
      total += count;
    }
  }
  return {
    hasSignals: total > 0,
    totalSignalCount: total,
    byClass,
    signals: list,
  };
}

// Phase 20260616-admin-validation-report-detail-panel-readonly-consume-implementation-a：
//   read-only load of the git-ignored validation report cache. Missing / unreadable /
//   malformed → { available:false } so the Admin page NEVER crashes (per requirement 2).
//   Does NOT re-run the validator and does NOT change the reporter schema.
async function loadValidationReportContext() {
  try {
    const raw = await fs.readFile(VALIDATION_REPORT_PATH, 'utf8');
    const report = JSON.parse(raw);
    const byKey = new Map();
    if (Array.isArray(report?.bySourcePath)) {
      for (const entry of report.bySourcePath) {
        if (entry && typeof entry.normalizedKey === 'string') byKey.set(entry.normalizedKey, entry);
      }
    }
    return {
      available: true,
      asOf: typeof report?.asOf === 'string' ? report.asOf : null,
      byKey,
    };
  } catch {
    // ENOENT (report not generated) or parse error → graceful unavailable; no crash.
    return { available: false, asOf: null, byKey: new Map() };
  }
}

// admin absolute sourcePath → repo-relative posix join key (mirror load-posts.js toRelative; pm-14 §D.1).
function toNormalizedKey(absPath) {
  return path.relative(PROJECT_ROOT, absPath).split(path.sep).join('/');
}

// Pure: decide the per-post validation display state from the report context + post status (pm-14 §D.2).
//   Exported for the smoke guard. Read-only / additive; never mutates inputs.
//   - report unavailable                          → 'no-report'      (UI: 尚未產生 report)
//   - status outside validator universe (ready/published) → 'status-excluded' (UI: 未驗證；NOT 0 warnings)
//   - matched report entry                         → 'matched'        (counts / byClass / brief issues)
//   - ready/published, no entry, report present    → 'clean'          (0 warnings as of report.asOf)
export function derivePostValidationReport(ctx, status) {
  const available = !!(ctx && ctx.available);
  const asOf = ctx && typeof ctx.asOf === 'string' ? ctx.asOf : null;
  const entry = ctx ? ctx.entry : null;
  if (!available) {
    return { reportAvailable: false, state: 'no-report', asOf: null };
  }
  const isVisible = status === 'ready' || status === 'published';
  if (!isVisible) {
    return { reportAvailable: true, state: 'status-excluded', asOf, status: typeof status === 'string' ? status : '' };
  }
  if (entry) {
    const wc = typeof entry.warningCount === 'number' && Number.isFinite(entry.warningCount) ? entry.warningCount : 0;
    const ec = typeof entry.errorCount === 'number' && Number.isFinite(entry.errorCount) ? entry.errorCount : 0;
    const byClass = entry.byClass && typeof entry.byClass === 'object' ? entry.byClass : {};
    const issues = Array.isArray(entry.issues)
      ? entry.issues.map((i) => ({
          type: typeof i.type === 'string' ? i.type : '',
          class: typeof i.class === 'string' ? i.class : 'unknown',
          severity: i.severity === 'error' ? 'error' : 'warning',
        }))
      : [];
    return {
      reportAvailable: true,
      state: 'matched',
      asOf,
      warningCount: wc,
      errorCount: ec,
      byClass,
      issueCount: issues.length,
      issues,
    };
  }
  return { reportAvailable: true, state: 'clean', asOf, warningCount: 0, errorCount: 0 };
}

export async function loadAdminPosts({ settings }) {
  const posts = [];
  // Phase 20260601-am-3 sourceKey Admin selector source implementation
  //   - 建構一次共享 reference；不每 post 重算；不每 post 複製
  //   - settings.linkSources.sources 缺檔時 → 空陣列；selector UI 仍能 render（只顯示「未指定」option）
  const sourceOptions = buildActiveSourceOptions(settings);
  // Phase 20260608 commerce-admin-selector-readonly-preview-implementation-a
  //   - registry-global read-only preview（非 per-post）；建構一次，於 loadAdminPosts return 暴露
  //   - production registry empty → { rows: [], count: 0 } → UI 顯示 empty-state
  //   - 只含 safe 欄位（linkId / displayLabel / active / hasReplacementTarget）；不含 targetUrl / internalLabel / networkKey
  const commerceLinksPreview = buildCommerceLinkPreviewOptions(settings);
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
  // Phase 20260616-am-5-admin-suggested-fix-loader-derive-implementation-a：
  //   - additive read-only post.governanceSignals derive（5 欄位純函式；每 post 1 物件）
  //   - 用既有 settings.categories / settings.tags registry；不打 API；不寫檔
  //   - 不改 EJS / view；既有 view 忽略本欄位 → backout cost = 0
  //   - 不引入修法建議、不引入 per-post prescription、不引入 write hint
  //   - sourceSite-based mismatch（同 buildCategoryUsage / buildTagUsage 之 admin 慣例）
  const catGovernanceLookup = buildTaxonomyLookup(settings?.categories);
  const tagGovernanceLookup = buildTaxonomyLookup(settings?.tags);
  // Phase 20260616-admin-validation-report-detail-panel-readonly-consume-implementation-a：
  //   - 載入一次 validation report context（read-only；缺檔 graceful unavailable，不 crash）
  //   - per-post join：admin 絕對 sourcePath → repo-relative posix key → report entry（pm-14 §D）
  const validationReportCtx = await loadValidationReportContext();
  for (const p of posts) {
    p.governanceSignals = derivePostGovernanceSignals(p, catGovernanceLookup, tagGovernanceLookup);
    // Phase 20260616-admin-validator-per-post-aggregation-implementation-a：
    //   - additive read-only per-post governanceAggregation（純函式 derive；每 post 1 物件）
    //   - 僅整理上方 governanceSignals（既有 derived signal），不重跑 validator / 不 join validator warnings
    //   - 既有 view 忽略本欄位 → backout cost = 0
    p.governanceAggregation = aggregatePostGovernanceSignals(p.governanceSignals);
    // Phase 20260616 validation report read-only consume：additive per-post validationReport
    //   - 僅 join 既有 report cache；不重跑 validator / 不改 reporter schema / 不修法
    p.validationReport = derivePostValidationReport(
      {
        available: validationReportCtx.available,
        asOf: validationReportCtx.asOf,
        entry: validationReportCtx.byKey.get(toNormalizedKey(p.sourcePath)) || null,
      },
      p.status,
    );
  }
  // Phase 20260608 commerce-admin-selector-readonly-preview-implementation-a
  //   - additive read-only context；既有 { posts } consumer 不受影響
  //   - allowedCommerceRoles = C8 enum mirror（authoring guidance；role 仍 recommended-but-optional；C7 deferred）
  // Phase 20260615-night-1-admin-ia-shell-implementation-a
  //   - additive read-only systemSummary（site / categories / tags / ads / ga4 / commerce / downloads）
  //   - AdSense client / GA4 measurementId 只回 tail4；render 端遮罩，不暴露全值
  //   - 不啟用 Admin Apply / middleware / write route；不寫檔
  const systemSummary = buildSystemSummary(settings);
  // Phase 20260615-night-5-admin-categories-readonly-usage-counts-a
  //   - additive read-only categoryUsage（per-category 文章使用統計 + uncategorized / unknown / unused buckets）
  //   - 依 loadAdminPosts return 之 posts（admin view shape；含 draft / 各 status）derive
  //   - 不寫檔；不改 frontmatter / settings；不打 API；不取代 validator
  const categoryUsage = buildCategoryUsage(posts, settings?.categories);
  // Phase 20260615-night-7-admin-tags-readonly-usage-counts-a
  //   - additive read-only tagUsage（per-tag 文章使用統計 + untagged / unknown / unused buckets）
  //   - 依 loadAdminPosts return 之 posts（admin view shape；含 draft / 各 status）derive
  //   - 不寫檔；不改 frontmatter / settings；不打 API；不取代 validator
  const tagUsage = buildTagUsage(posts, settings?.tags);
  return { posts, commerceLinksPreview, allowedCommerceRoles: ALLOWED_COMMERCE_ROLES, systemSummary, categoryUsage, tagUsage };
}
