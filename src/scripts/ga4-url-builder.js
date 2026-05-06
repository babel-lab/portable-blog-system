// Phase 4-c：URL / UTM 純函式 helper
// 約束：no I/O、no console.log、no 直接讀檔
// 提供 promotion + 未來 GA4 連結組裝共用

// expandPattern：將 "{key}" placeholder 以 vars 內對應值替換。
// 未知 placeholder 維持原樣，呼叫者可自行偵測殘留 {} 是否合理。
export function expandPattern(pattern, vars = {}) {
  if (typeof pattern !== 'string') return '';
  return pattern.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null) {
      return String(vars[key]);
    }
    return match;
  });
}

// applyUtm：對 rawUrl 套上 utm_source / utm_medium / utm_campaign / utm_content。
// rawUrl 不合法回傳 null；空值 utm 跳過。
export function applyUtm(rawUrl, utmParams = {}) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  for (const key of ['source', 'medium', 'campaign', 'content']) {
    const v = utmParams[key];
    if (v != null && v !== '') {
      url.searchParams.set(`utm_${key}`, String(v));
    }
  }
  return url.toString();
}

// resolvePostBaseUrl：依 post.promotion.facebook.target 與 post.site / settings 解析 baseUrl。
// 不套 UTM。回傳 { baseUrl, urlSource, urlReason }；失敗時 baseUrl 為 null。
export function resolvePostBaseUrl({ post, settings }) {
  const target = post?.promotion?.facebook?.target;

  // 絕對 URL 覆寫
  if (typeof target === 'string' && /^https?:\/\//.test(target)) {
    return { baseUrl: target, urlSource: 'absolute', urlReason: null };
  }

  // 不合法 target（非空、非 auto、非絕對 URL）
  if (typeof target === 'string' && target !== '' && target !== 'auto') {
    return { baseUrl: null, urlSource: null, urlReason: `invalid-target:${target}` };
  }

  // auto / 空 / null / undefined → 依 site 解析
  const site = post?.site;
  const slug = post?.slug;
  if (!slug) {
    return { baseUrl: null, urlSource: null, urlReason: 'slug-missing' };
  }

  const siteCfg = settings?.site ?? {};

  if (site === 'github') {
    const base = (siteCfg.githubSiteUrl || '').replace(/\/+$/, '');
    if (!base) {
      return { baseUrl: null, urlSource: null, urlReason: 'github-site-url-missing' };
    }
    return {
      baseUrl: `${base}/posts/${slug}/`,
      urlSource: 'github-site',
      urlReason: null,
    };
  }

  if (site === 'blogger') {
    const published = post?.blogger?.publishedUrl;
    if (typeof published === 'string' && published) {
      return { baseUrl: published, urlSource: 'blogger-published', urlReason: null };
    }
    const fallback = (siteCfg.bloggerSiteUrl || '').replace(/\/+$/, '');
    if (fallback) {
      return {
        baseUrl: `${fallback}/${slug}.html`,
        urlSource: 'blogger-fallback',
        urlReason: null,
      };
    }
    return { baseUrl: null, urlSource: null, urlReason: 'blogger-url-missing' };
  }

  return { baseUrl: null, urlSource: null, urlReason: `unknown-site:${site}` };
}

// buildFacebookUrl：一站式組合。回傳 { baseUrl, finalUrl, urlSource, urlReason }。
// utm 設定來自 settings.promotion.facebook.utm；page / slug 用於 pattern 展開。
export function buildFacebookUrl({ post, fb, page, settings }) {
  const { baseUrl, urlSource, urlReason } = resolvePostBaseUrl({ post, settings });

  if (!baseUrl) {
    return { baseUrl: null, finalUrl: null, urlSource, urlReason };
  }

  const utmCfg = settings?.promotion?.facebook?.utm ?? {};
  const vars = { page: page ?? '', slug: post?.slug ?? '' };

  const utm = {
    source: utmCfg.source,
    medium: utmCfg.medium,
    campaign: expandPattern(utmCfg.campaignPattern || '', vars),
    content: expandPattern(utmCfg.contentPattern || '', vars),
  };

  const finalUrl = applyUtm(baseUrl, utm);

  return { baseUrl, finalUrl, urlSource, urlReason: null };
}
