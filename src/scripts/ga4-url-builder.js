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

// Phase related-links-ga4-audit：判斷 url 是否為指向 Blogger cross-site host 之連結。
//   依據 settings.site.bloggerSiteUrl 之 hostname 比對；忽略 kind 欄位。
//   用於 GitHub Pages 端 relatedLinks / otherLinks 之 attribution 處理。
export function isBloggerCrossLink(rawUrl, settings) {
  if (typeof rawUrl !== 'string' || !rawUrl) return false;
  const bloggerSiteUrl = settings?.site?.bloggerSiteUrl;
  if (!bloggerSiteUrl) return false;
  try {
    const u = new URL(rawUrl);
    const bloggerHost = new URL(bloggerSiteUrl).hostname;
    return u.hostname === bloggerHost;
  } catch {
    return false;
  }
}

// Phase 20260523-pm-24-reverse-utm-step2-impl-related-other-a：mirror isBloggerCrossLink。
//   判斷 url 是否為指向 GitHub Pages cross-site host 之連結。
//   依據 settings.site.githubSiteUrl 之 hostname 比對；忽略 kind 欄位。
//   用於 Blogger 端 relatedLinks / otherLinks 之 reverse UTM 處理（per docs/blogger-to-github-reverse-utm-plan.md §7.1.1）。
export function isGithubCrossLink(rawUrl, settings) {
  if (typeof rawUrl !== 'string' || !rawUrl) return false;
  const githubSiteUrl = settings?.site?.githubSiteUrl;
  if (!githubSiteUrl) return false;
  try {
    const u = new URL(rawUrl);
    const githubHost = new URL(githubSiteUrl).hostname;
    return u.hostname === githubHost;
  } catch {
    return false;
  }
}

// mergeRel：合併 rel token strings；保留原順序 + 不重複 token。
//   primary 為既有 rel string；additions 為要加入之 token array。
export function mergeRel(primary, additions) {
  const existing = typeof primary === 'string' && primary.trim() !== ''
    ? primary.trim().split(/\s+/).filter(Boolean)
    : [];
  const adds = Array.isArray(additions) ? additions : [];
  const seen = new Set(existing);
  const result = [...existing];
  for (const token of adds) {
    if (typeof token === 'string' && token !== '' && !seen.has(token)) {
      result.push(token);
      seen.add(token);
    }
  }
  return result.join(' ');
}

// applyCrossSiteUtm：對 cross-site link 之 UTM 注入 + target/rel 標記。
//   direction（Phase 20260523-pm-24-reverse-utm-step2-impl-related-other-a 新增）：
//     - 'to_blogger'（default；backward compat；既有 GitHub Pages → Blogger caller 不需改）：
//         hostname 比對 settings.site.bloggerSiteUrl；注入 utm_source=github_pages
//     - 'to_github'（新增；Blogger → GitHub Pages reverse UTM）：
//         hostname 比對 settings.site.githubSiteUrl；注入 utm_source=blogger
//   兩方向同：utm_medium=referral / utm_campaign=portable_blog_system / utm_content=<slot>
//   per docs/blogger-to-github-reverse-utm-plan.md §5（命名）+ §7.1.2 方案 A（參數化方向）
//   - 非 cross-link（hostname 不 match）→ 回傳 { url, target: null, rel: null, applied: false }（不改動）
//   - 已含任一 utm_source / utm_medium / utm_campaign / utm_content → 策略 A：保留 author intent，
//     不覆寫 UTM；但仍套 target=_blank + rel merge（per Phase related-links-ga4-audit spec 點 10）
//   - 否則注入 4 個 UTM + 設 target=_blank + 合併 rel ['nofollow', 'noopener', 'noreferrer']
//   slot：'related_links' | 'other_links'（決定 utm_content）
export function applyCrossSiteUtm({ url, settings, slot, existingRel = '', direction = 'to_blogger' }) {
  const isCrossLink =
    direction === 'to_github'
      ? isGithubCrossLink(url, settings)
      : isBloggerCrossLink(url, settings);
  if (!isCrossLink) {
    return { url, target: null, rel: null, applied: false };
  }
  let u;
  try {
    u = new URL(url);
  } catch {
    return { url, target: null, rel: null, applied: false };
  }
  const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
    .some((key) => u.searchParams.has(key));
  const mergedRel = mergeRel(existingRel, ['nofollow', 'noopener', 'noreferrer']);
  if (hasUtm) {
    return { url, target: '_blank', rel: mergedRel, applied: false };
  }
  const utmSource = direction === 'to_github' ? 'blogger' : 'github_pages';
  u.searchParams.set('utm_source', utmSource);
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', 'portable_blog_system');
  u.searchParams.set('utm_content', slot);
  return { url: u.toString(), target: '_blank', rel: mergedRel, applied: true };
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
