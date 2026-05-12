// Phase 8-d-1：normalize-post-output helper（純函式）
//
// 設計依據：docs/phase-8d-field-mapping-design.md
//   §5  統一物件形狀
//   §6  26 欄位映射表
//   §7  Blogger URL 規則
//   §8  GitHub URL 規則
//   §9  Facebook promotion 規則
//   §10 Legacy compatibility 策略
//
// 職責：
//   - 將 post 之多層資料來源（.md frontmatter / .publish.json / .fb.md / settings）依優先序攤平
//   - 產出統一形狀 { identity, display, seo, publish, promotion, validationMeta }
//   - 記錄 fieldSource / fallbackUsed / warnings 提供 traceability
//
// 設計原則：
//   - 純函式：不讀檔、不寫檔、不執行 build
//   - 不 mutate post / settings / options
//   - 不 throw 作為一般欄位缺失之控制流程
//   - 零 import（避免外部相依）
//   - 不依賴 Node 專屬 API
//   - 不接入任何 caller（屬 8-d-2 之後）
//   - 永遠不預測 Blogger URL（沿用 docs/publish-json-schema.md §5.3 強制規則）
//   - GitHub URL 預設不推導；僅 options.deriveGithubUrl === true 時嘗試保守推導

// ─────────────────────────────────────────────────────────────
// 內部工具（亦 export 供測試 / 共用）
// ─────────────────────────────────────────────────────────────

/**
 * 判斷值是否為「有效值」。
 *   - null / undefined → false
 *   - 空字串或 trim 後空字串 → false
 *   - 空陣列 → false
 *   - 空物件 → false
 *   - boolean false → true（如 facebook.enabled 明確為 false 屬有效值）
 *   - 數字 0 → true
 */
export function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * 以 dot notation 路徑取值；中途為 null/undefined 或非物件時回傳 undefined；不 throw。
 *   getNestedValue({ a: { b: 1 } }, 'a.b') === 1
 *   getNestedValue({ a: null }, 'a.b') === undefined
 *   getNestedValue(null, 'a') === undefined
 */
export function getNestedValue(source, path) {
  if (source === null || source === undefined) return undefined;
  if (typeof path !== 'string' || path === '') return undefined;
  const parts = path.split('.');
  let cur = source;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * 從候選清單依序取第一個 hasValue=true 之值。
 *   candidates: Array<{ value, source }>
 *   回傳：{ value, source, fallbackUsed }
 *     value: 命中候選之 value；皆無則為 fallbackValue
 *     source: 命中候選之 source 標籤；皆無則為 'fallback'
 *     fallbackUsed: 是否非第一候選命中（第一候選 → false；其他候選 / 全無命中 → true）
 */
export function getFieldValue(candidates, fallbackValue = null) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { value: fallbackValue, source: 'fallback', fallbackUsed: true };
  }
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i] || {};
    if (hasValue(c.value)) {
      return {
        value: c.value,
        source: c.source != null ? c.source : `candidate[${i}]`,
        fallbackUsed: i > 0,
      };
    }
  }
  return { value: fallbackValue, source: 'fallback', fallbackUsed: true };
}

// ─────────────────────────────────────────────────────────────
// validationMeta 記錄工具（內部）
// ─────────────────────────────────────────────────────────────

function recordField(meta, fieldPath, source) {
  meta.fieldSource[fieldPath] = source;
}

function recordFallback(meta, fieldPath, fromSource, reason) {
  meta.fallbackUsed.push({ field: fieldPath, from: fromSource, reason });
}

function recordWarning(meta, type, field, message) {
  meta.warnings.push({ type, field, message });
}

// ─────────────────────────────────────────────────────────────
// 主 export：normalizePostOutput
// ─────────────────────────────────────────────────────────────

export function normalizePostOutput(post = {}, settings = {}, options = {}) {
  // 防禦性處理：post 為 null/undefined 或非物件時，視為空物件
  const p = post && typeof post === 'object' ? post : {};

  // 多層資料來源（依優先序）
  const publish = p.publish && typeof p.publish === 'object' ? p.publish : null;
  const fbSidecar = p.sidecars && p.sidecars.facebook ? p.sidecars.facebook : null;
  const fbExists = !!(fbSidecar && fbSidecar.exists === true);
  const fbData =
    fbSidecar && fbSidecar.data && typeof fbSidecar.data === 'object' ? fbSidecar.data : null;
  const fbBody = fbSidecar && typeof fbSidecar.body === 'string' ? fbSidecar.body : null;
  const legacyFb =
    p.promotion &&
    typeof p.promotion === 'object' &&
    p.promotion.facebook &&
    typeof p.promotion.facebook === 'object'
      ? p.promotion.facebook
      : null;

  // validationMeta accumulator
  const meta = {
    fieldSource: {},
    fallbackUsed: [],
    warnings: [],
    unresolvedPlaceholders: [], // helper 不執行 placeholder 解析；保留欄位供 caller 填入
  };

  // ─── identity ─────────────────────────────────────────────

  const identity = {};

  // identity.site
  {
    const r = getFieldValue([{ value: p.site, source: 'frontmatter.site' }]);
    identity.site = r.value;
    recordField(meta, 'identity.site', r.source);
    if (r.fallbackUsed) recordFallback(meta, 'identity.site', r.source, 'site missing on post');
  }

  // identity.sourceCollection
  {
    const r = getFieldValue(
      [{ value: p.sourceCollection, source: 'frontmatter.sourceCollection' }],
      'posts',
    );
    identity.sourceCollection = r.value;
    recordField(meta, 'identity.sourceCollection', r.source);
    if (r.fallbackUsed)
      recordFallback(
        meta,
        'identity.sourceCollection',
        r.source,
        'sourceCollection missing; defaulted to posts',
      );
  }

  // identity.slug
  {
    const r = getFieldValue([
      { value: p.slug, source: 'frontmatter.slug' },
      { value: getNestedValue(publish, 'blogger.permalink'), source: 'publish.blogger.permalink' },
      { value: getNestedValue(publish, 'github.slug'), source: 'publish.github.slug' },
    ]);
    identity.slug = r.value;
    recordField(meta, 'identity.slug', r.source);
    if (r.fallbackUsed) recordFallback(meta, 'identity.slug', r.source, 'frontmatter.slug missing');
  }

  // identity.contentKind（含 legacy type fallback）
  {
    if (hasValue(p.contentKind)) {
      identity.contentKind = p.contentKind;
      recordField(meta, 'identity.contentKind', 'frontmatter.contentKind');
    } else if (hasValue(p.type)) {
      identity.contentKind = p.type;
      recordField(meta, 'identity.contentKind', 'frontmatter.type');
      recordFallback(
        meta,
        'identity.contentKind',
        'frontmatter.type',
        'contentKind missing; legacy type used as fallback',
      );
      recordWarning(
        meta,
        'deprecated-legacy-type-fallback',
        'identity.contentKind',
        'frontmatter.type is deprecated; please rename to contentKind',
      );
    } else {
      identity.contentKind = 'post';
      recordField(meta, 'identity.contentKind', 'fallback');
      recordFallback(
        meta,
        'identity.contentKind',
        'fallback',
        'contentKind and type both missing; defaulted to post',
      );
    }
  }

  // identity.status
  {
    if (hasValue(p.status)) {
      identity.status = p.status;
      recordField(meta, 'identity.status', 'frontmatter.status');
    } else if (p.draft === true) {
      identity.status = 'draft';
      recordField(meta, 'identity.status', 'frontmatter.draft');
      recordFallback(
        meta,
        'identity.status',
        'frontmatter.draft',
        'status missing; draft:true used to infer draft',
      );
    } else {
      identity.status = 'draft';
      recordField(meta, 'identity.status', 'fallback');
      recordFallback(meta, 'identity.status', 'fallback', 'status missing; defaulted to draft');
    }
  }

  // ─── display ──────────────────────────────────────────────

  const display = {};

  // display.title
  {
    const r = getFieldValue([
      { value: getNestedValue(publish, 'seo.metaTitle'), source: 'publish.seo.metaTitle' },
      { value: p.title, source: 'frontmatter.title' },
    ]);
    display.title = r.value;
    recordField(meta, 'display.title', r.source);
    if (r.fallbackUsed)
      recordFallback(meta, 'display.title', r.source, 'sidecar metaTitle empty');
  }

  // display.subtitle（保留欄位；schema 無嚴格對應）
  {
    const r = getFieldValue([
      { value: p.subtitle, source: 'frontmatter.subtitle' },
      { value: p.titleEn, source: 'frontmatter.titleEn' },
    ]);
    display.subtitle = r.value;
    recordField(meta, 'display.subtitle', r.source);
  }

  // display.description
  {
    const r = getFieldValue([
      {
        value: getNestedValue(publish, 'seo.metaDescription'),
        source: 'publish.seo.metaDescription',
      },
      { value: p.description, source: 'frontmatter.description' },
    ]);
    display.description = r.value;
    recordField(meta, 'display.description', r.source);
    if (r.fallbackUsed)
      recordFallback(meta, 'display.description', r.source, 'sidecar metaDescription empty');
  }

  // display.excerpt
  {
    const r = getFieldValue([
      { value: p.excerpt, source: 'frontmatter.excerpt' },
      { value: p.description, source: 'frontmatter.description' },
    ]);
    display.excerpt = r.value;
    recordField(meta, 'display.excerpt', r.source);
    if (r.fallbackUsed)
      recordFallback(
        meta,
        'display.excerpt',
        r.source,
        'excerpt missing; description used as fallback',
      );
  }

  // display.cover
  {
    const r = getFieldValue([
      { value: getNestedValue(publish, 'cover'), source: 'publish.cover' },
      { value: getNestedValue(publish, 'coverImage'), source: 'publish.coverImage' },
      { value: getNestedValue(publish, 'ogImage.url'), source: 'publish.ogImage.url' },
      { value: p.cover, source: 'frontmatter.cover' },
      { value: p.coverImage, source: 'frontmatter.coverImage' },
      { value: p.image, source: 'frontmatter.image' },
    ]);
    display.cover = r.value;
    recordField(meta, 'display.cover', r.source);
  }

  // display.coverAlt
  {
    const r = getFieldValue([
      { value: getNestedValue(publish, 'coverAlt'), source: 'publish.coverAlt' },
      { value: getNestedValue(publish, 'coverImageAlt'), source: 'publish.coverImageAlt' },
      { value: getNestedValue(publish, 'ogImage.alt'), source: 'publish.ogImage.alt' },
      { value: p.coverAlt, source: 'frontmatter.coverAlt' },
      { value: p.coverImageAlt, source: 'frontmatter.coverImageAlt' },
      { value: p.title, source: 'frontmatter.title' },
    ]);
    display.coverAlt = r.value;
    recordField(meta, 'display.coverAlt', r.source);
    if (r.source === 'frontmatter.title') {
      recordFallback(
        meta,
        'display.coverAlt',
        r.source,
        'no explicit alt; using post.title as fallback',
      );
    }
  }

  // ─── seo（canonicalUrl 留至 publish 區塊計算後處理）────────

  const seo = {};

  // seo.metaTitle
  {
    const explicit = getFieldValue([
      { value: getNestedValue(publish, 'seo.metaTitle'), source: 'publish.seo.metaTitle' },
    ]);
    if (hasValue(explicit.value)) {
      seo.metaTitle = explicit.value;
      recordField(meta, 'seo.metaTitle', explicit.source);
    } else {
      seo.metaTitle = display.title;
      recordField(meta, 'seo.metaTitle', 'computed:display.title');
      recordFallback(meta, 'seo.metaTitle', 'display.title', 'sidecar metaTitle empty');
    }
  }

  // seo.metaDescription
  {
    const explicit = getFieldValue([
      {
        value: getNestedValue(publish, 'seo.metaDescription'),
        source: 'publish.seo.metaDescription',
      },
    ]);
    if (hasValue(explicit.value)) {
      seo.metaDescription = explicit.value;
      recordField(meta, 'seo.metaDescription', explicit.source);
    } else {
      seo.metaDescription = display.description;
      recordField(meta, 'seo.metaDescription', 'computed:display.description');
      recordFallback(
        meta,
        'seo.metaDescription',
        'display.description',
        'sidecar metaDescription empty',
      );
    }
  }

  // seo.ogTitle
  {
    const explicit = getFieldValue([
      { value: getNestedValue(publish, 'seo.ogTitle'), source: 'publish.seo.ogTitle' },
    ]);
    if (hasValue(explicit.value)) {
      seo.ogTitle = explicit.value;
      recordField(meta, 'seo.ogTitle', explicit.source);
    } else {
      seo.ogTitle = seo.metaTitle;
      recordField(meta, 'seo.ogTitle', 'computed:seo.metaTitle');
      recordFallback(meta, 'seo.ogTitle', 'seo.metaTitle', 'no explicit ogTitle');
    }
  }

  // seo.ogDescription
  {
    const explicit = getFieldValue([
      {
        value: getNestedValue(publish, 'seo.ogDescription'),
        source: 'publish.seo.ogDescription',
      },
    ]);
    if (hasValue(explicit.value)) {
      seo.ogDescription = explicit.value;
      recordField(meta, 'seo.ogDescription', explicit.source);
    } else {
      seo.ogDescription = seo.metaDescription;
      recordField(meta, 'seo.ogDescription', 'computed:seo.metaDescription');
      recordFallback(
        meta,
        'seo.ogDescription',
        'seo.metaDescription',
        'no explicit ogDescription',
      );
    }
  }

  // seo.ogImage
  {
    const explicit = getFieldValue([
      { value: getNestedValue(publish, 'ogImage.url'), source: 'publish.ogImage.url' },
    ]);
    if (hasValue(explicit.value)) {
      seo.ogImage = explicit.value;
      recordField(meta, 'seo.ogImage', explicit.source);
    } else {
      seo.ogImage = display.cover;
      recordField(meta, 'seo.ogImage', 'computed:display.cover');
      if (hasValue(display.cover)) {
        recordFallback(meta, 'seo.ogImage', 'display.cover', 'no explicit ogImage; using cover');
      }
    }
  }

  // seo.canonicalUrl 暫保留；待 publish 計算後再處理
  seo.canonicalUrl = null;

  // ─── publish ──────────────────────────────────────────────

  const publishOut = {};

  // publish.primaryPlatform
  {
    const r = getFieldValue(
      [{ value: p.primaryPlatform, source: 'frontmatter.primaryPlatform' }],
      'blogger',
    );
    publishOut.primaryPlatform = r.value;
    recordField(meta, 'publish.primaryPlatform', r.source);
    if (r.fallbackUsed)
      recordFallback(
        meta,
        'publish.primaryPlatform',
        r.source,
        'primaryPlatform missing; defaulted to blogger',
      );
  }

  // publish.targetPlatforms
  {
    const targets = [];
    const pt = p.publishTargets || {};
    for (const platform of ['github', 'blogger']) {
      const t = pt[platform];
      if (t && t.enabled === true) targets.push(platform);
    }
    if (targets.length === 0) {
      targets.push(publishOut.primaryPlatform);
      recordField(meta, 'publish.targetPlatforms', 'computed:primaryPlatform');
      recordFallback(
        meta,
        'publish.targetPlatforms',
        'computed:primaryPlatform',
        'publishTargets empty; using primaryPlatform',
      );
    } else {
      recordField(meta, 'publish.targetPlatforms', 'frontmatter.publishTargets');
    }
    publishOut.targetPlatforms = targets;
  }

  // publish.publishedAt（依 primaryPlatform 分流）
  {
    const isBlogger = publishOut.primaryPlatform === 'blogger';
    const candidates = isBlogger
      ? [
          {
            value: getNestedValue(publish, 'blogger.publishedAt'),
            source: 'publish.blogger.publishedAt',
          },
          {
            value: getNestedValue(publish, 'github.publishedAt'),
            source: 'publish.github.publishedAt',
          },
          { value: p.publishedAt, source: 'frontmatter.publishedAt' },
          { value: p.date, source: 'frontmatter.date' },
        ]
      : [
          {
            value: getNestedValue(publish, 'github.publishedAt'),
            source: 'publish.github.publishedAt',
          },
          {
            value: getNestedValue(publish, 'blogger.publishedAt'),
            source: 'publish.blogger.publishedAt',
          },
          { value: p.publishedAt, source: 'frontmatter.publishedAt' },
          { value: p.date, source: 'frontmatter.date' },
        ];
    const r = getFieldValue(candidates);
    publishOut.publishedAt = r.value;
    recordField(meta, 'publish.publishedAt', r.source);
    if (r.fallbackUsed)
      recordFallback(
        meta,
        'publish.publishedAt',
        r.source,
        'primary platform publishedAt missing',
      );
  }

  // publish.updatedAt
  {
    const r = getFieldValue([
      { value: p.updated, source: 'frontmatter.updated' },
      { value: p.updatedAt, source: 'frontmatter.updatedAt' },
      { value: publishOut.publishedAt, source: 'computed:publish.publishedAt' },
    ]);
    publishOut.updatedAt = r.value;
    recordField(meta, 'publish.updatedAt', r.source);
    if (r.fallbackUsed)
      recordFallback(meta, 'publish.updatedAt', r.source, 'updatedAt missing; using publishedAt');
  }

  // publish.canonicalPlatform
  {
    const canonicalSource = getNestedValue(publish, 'canonical.source');
    if (
      canonicalSource === 'blogger' ||
      canonicalSource === 'github' ||
      canonicalSource === 'manual'
    ) {
      publishOut.canonicalPlatform = canonicalSource;
      recordField(meta, 'publish.canonicalPlatform', 'publish.canonical.source');
    } else if (canonicalSource === 'auto') {
      publishOut.canonicalPlatform = publishOut.primaryPlatform;
      recordField(meta, 'publish.canonicalPlatform', 'computed:primaryPlatform');
      recordFallback(
        meta,
        'publish.canonicalPlatform',
        'computed:primaryPlatform',
        'canonical.source=auto; using primaryPlatform',
      );
    } else {
      publishOut.canonicalPlatform = publishOut.primaryPlatform;
      recordField(meta, 'publish.canonicalPlatform', 'fallback:primaryPlatform');
      if (canonicalSource !== undefined) {
        recordFallback(
          meta,
          'publish.canonicalPlatform',
          'fallback:primaryPlatform',
          `unknown canonical.source=${canonicalSource}`,
        );
      } else {
        recordFallback(
          meta,
          'publish.canonicalPlatform',
          'fallback:primaryPlatform',
          'canonical.source missing',
        );
      }
    }
  }

  // publish.blogger.publishedUrl（嚴格規則：永不預測 Blogger URL）
  publishOut.blogger = {};
  {
    const r = getFieldValue([
      {
        value: getNestedValue(publish, 'blogger.publishedUrl'),
        source: 'publish.blogger.publishedUrl',
      },
      { value: getNestedValue(publish, 'publishedUrl'), source: 'publish.publishedUrl' },
      { value: p.publishedUrl, source: 'frontmatter.publishedUrl' },
    ]);
    publishOut.blogger.publishedUrl = hasValue(r.value) ? r.value : null;
    recordField(meta, 'publish.blogger.publishedUrl', r.source);
    if (!hasValue(r.value) && publishOut.primaryPlatform === 'blogger') {
      recordWarning(
        meta,
        'blogger-published-url-missing',
        'publish.blogger.publishedUrl',
        'primaryPlatform is blogger but blogger.publishedUrl is empty (Blogger URL is never predicted; awaits manual backfill)',
      );
    }
  }

  // publish.github.url（預設不推導；options.deriveGithubUrl === true 時才嘗試保守推導）
  publishOut.github = {};
  {
    const explicit = getFieldValue([
      {
        value: getNestedValue(publish, 'github.publishedUrl'),
        source: 'publish.github.publishedUrl',
      },
      { value: getNestedValue(publish, 'github.url'), source: 'publish.github.url' },
      {
        value: getNestedValue(p, 'github.publishedUrl'),
        source: 'frontmatter.github.publishedUrl',
      },
      { value: p.githubUrl, source: 'frontmatter.githubUrl' },
    ]);
    if (hasValue(explicit.value)) {
      publishOut.github.url = explicit.value;
      recordField(meta, 'publish.github.url', explicit.source);
    } else if (options && options.deriveGithubUrl === true) {
      const siteUrl =
        (settings && (settings.siteUrl || settings.githubBaseUrl || settings.githubSiteUrl)) ||
        null;
      if (hasValue(siteUrl) && hasValue(identity.slug)) {
        const path = getNestedValue(publish, 'github.path');
        const segment = hasValue(path) ? String(path) : `/posts/${identity.slug}/`;
        const trimmed = String(siteUrl).replace(/\/+$/, '');
        const normalized = trimmed + (segment.startsWith('/') ? segment : `/${segment}`);
        publishOut.github.url = normalized;
        recordField(meta, 'publish.github.url', 'computed:siteUrl+slug');
        recordFallback(
          meta,
          'publish.github.url',
          'computed:siteUrl+slug',
          'no explicit github URL; derived via options.deriveGithubUrl',
        );
      } else {
        publishOut.github.url = null;
        recordField(meta, 'publish.github.url', 'fallback:null');
        recordWarning(
          meta,
          'github-url-derivation-skipped',
          'publish.github.url',
          'options.deriveGithubUrl=true but settings.siteUrl or slug is missing; left as null (non-blocking)',
        );
      }
    } else {
      publishOut.github.url = null;
      recordField(meta, 'publish.github.url', 'fallback:null');
      recordWarning(
        meta,
        'github-url-derivation-disabled',
        'publish.github.url',
        'github URL not explicitly provided; derivation disabled by default (options.deriveGithubUrl !== true) — non-blocking',
      );
    }
  }

  // ─── seo.canonicalUrl（依 canonicalPlatform 計算）─────────

  {
    const explicit = getFieldValue([
      { value: getNestedValue(publish, 'canonical.url'), source: 'publish.canonical.url' },
      { value: getNestedValue(publish, 'canonicalUrl'), source: 'publish.canonicalUrl' },
    ]);
    if (hasValue(explicit.value)) {
      seo.canonicalUrl = explicit.value;
      recordField(meta, 'seo.canonicalUrl', explicit.source);
    } else {
      let computed = null;
      let computedSource = null;
      if (publishOut.canonicalPlatform === 'blogger') {
        computed = publishOut.blogger.publishedUrl;
        computedSource = 'computed:publish.blogger.publishedUrl';
      } else if (publishOut.canonicalPlatform === 'github') {
        computed = publishOut.github.url;
        computedSource = 'computed:publish.github.url';
      }

      if (hasValue(computed)) {
        seo.canonicalUrl = computed;
        recordField(meta, 'seo.canonicalUrl', computedSource);
        recordFallback(
          meta,
          'seo.canonicalUrl',
          computedSource,
          'explicit canonical.url empty; computed from canonicalPlatform',
        );
      } else {
        // 再 fallback：legacy frontmatter canonical（若為 URL 字串非 'auto'）
        const fmCanonical = p.canonical;
        if (
          typeof fmCanonical === 'string' &&
          fmCanonical !== '' &&
          fmCanonical !== 'auto' &&
          /^https?:\/\//.test(fmCanonical)
        ) {
          seo.canonicalUrl = fmCanonical;
          recordField(meta, 'seo.canonicalUrl', 'frontmatter.canonical');
          recordFallback(
            meta,
            'seo.canonicalUrl',
            'frontmatter.canonical',
            'no sidecar canonical; using legacy frontmatter',
          );
        } else {
          seo.canonicalUrl = null;
          recordField(meta, 'seo.canonicalUrl', 'fallback:null');
          recordWarning(
            meta,
            'canonical-url-missing',
            'seo.canonicalUrl',
            `canonical URL could not be resolved (canonicalPlatform=${publishOut.canonicalPlatform}; sidecar / computed / frontmatter all empty) — non-blocking`,
          );
        }
      }
    }
  }

  // ─── promotion.facebook ──────────────────────────────────

  const promotion = { facebook: {} };

  // promotion.facebook.enabled（明確 false 不可被 fallback 蓋掉）
  {
    let resolved = null;
    let source = null;
    if (fbData && typeof fbData.enabled === 'boolean') {
      resolved = fbData.enabled;
      source = 'fb.md.enabled';
    } else if (legacyFb && typeof legacyFb.enabled === 'boolean') {
      resolved = legacyFb.enabled;
      source = 'frontmatter.promotion.facebook.enabled';
    } else {
      resolved = false;
      source = 'fallback';
    }
    promotion.facebook.enabled = resolved;
    recordField(meta, 'promotion.facebook.enabled', source);
    if (source === 'frontmatter.promotion.facebook.enabled') {
      recordFallback(
        meta,
        'promotion.facebook.enabled',
        source,
        'fb.md.enabled missing; using legacy frontmatter',
      );
    } else if (source === 'fallback') {
      recordFallback(
        meta,
        'promotion.facebook.enabled',
        'fallback',
        'enabled missing on both sidecar and frontmatter; defaulted to false',
      );
    }
  }

  // promotion.facebook.target
  {
    const r = getFieldValue(
      [
        { value: fbData ? fbData.target : undefined, source: 'fb.md.target' },
        {
          value: legacyFb ? legacyFb.target : undefined,
          source: 'frontmatter.promotion.facebook.target',
        },
      ],
      'auto',
    );
    promotion.facebook.target = r.value;
    recordField(meta, 'promotion.facebook.target', r.source);
    if (r.fallbackUsed)
      recordFallback(meta, 'promotion.facebook.target', r.source, 'sidecar target missing');
  }

  // promotion.facebook.message（legacy fallback；保留欄位即使空亦不視為錯誤）
  {
    const r = getFieldValue([
      {
        value: legacyFb ? legacyFb.message : undefined,
        source: 'frontmatter.promotion.facebook.message',
      },
    ]);
    promotion.facebook.message = r.value;
    recordField(meta, 'promotion.facebook.message', r.source);
  }

  // promotion.facebook.body（sidecar body 優先；legacy message 為 fallback）
  {
    if (fbExists && hasValue(fbBody)) {
      promotion.facebook.body = fbBody;
      recordField(meta, 'promotion.facebook.body', 'fb.md.body');
    } else if (hasValue(promotion.facebook.message)) {
      promotion.facebook.body = promotion.facebook.message;
      recordField(meta, 'promotion.facebook.body', 'computed:promotion.facebook.message');
      recordFallback(
        meta,
        'promotion.facebook.body',
        'computed:promotion.facebook.message',
        'fb.md body missing; using legacy frontmatter message',
      );
    } else {
      promotion.facebook.body = null;
      recordField(meta, 'promotion.facebook.body', 'fallback:null');
    }
  }

  // promotion.facebook.hashtags（保持陣列）
  {
    let value = null;
    let source = null;
    if (fbData && Array.isArray(fbData.hashtags) && fbData.hashtags.length > 0) {
      value = fbData.hashtags;
      source = 'fb.md.hashtags';
    } else if (legacyFb && Array.isArray(legacyFb.hashtags) && legacyFb.hashtags.length > 0) {
      value = legacyFb.hashtags;
      source = 'frontmatter.promotion.facebook.hashtags';
    } else {
      value = [];
      source = 'fallback';
    }
    promotion.facebook.hashtags = value;
    recordField(meta, 'promotion.facebook.hashtags', source);
    if (source === 'frontmatter.promotion.facebook.hashtags') {
      recordFallback(
        meta,
        'promotion.facebook.hashtags',
        source,
        'sidecar hashtags missing; using legacy frontmatter',
      );
    }
  }

  // promotion.facebook.finalUrl（依設計 §9.4 順序）
  {
    const r = getFieldValue([
      { value: fbData ? fbData.finalUrl : undefined, source: 'fb.md.finalUrl' },
      {
        value: legacyFb ? legacyFb.finalUrl : undefined,
        source: 'frontmatter.promotion.facebook.finalUrl',
      },
      { value: seo.canonicalUrl, source: 'computed:seo.canonicalUrl' },
      {
        value: publishOut.blogger.publishedUrl,
        source: 'computed:publish.blogger.publishedUrl',
      },
      { value: publishOut.github.url, source: 'computed:publish.github.url' },
    ]);
    promotion.facebook.finalUrl = r.value;
    recordField(meta, 'promotion.facebook.finalUrl', r.source);
    if (r.fallbackUsed)
      recordFallback(meta, 'promotion.facebook.finalUrl', r.source, 'explicit finalUrl missing');
    if (!hasValue(r.value) && promotion.facebook.enabled === true) {
      recordWarning(
        meta,
        'facebook-final-url-missing',
        'promotion.facebook.finalUrl',
        'facebook.enabled=true but finalUrl could not be resolved (canonical / blogger / github URLs all empty) — non-blocking',
      );
    }
  }

  // promotion.facebook.utm.{source,medium,campaign}
  {
    const utm = {};
    const utmConfig = getNestedValue(settings, 'promotion.facebook.utm') || {};

    {
      const r = getFieldValue(
        [{ value: utmConfig.source, source: 'settings.promotion.facebook.utm.source' }],
        'facebook',
      );
      utm.source = r.value;
      recordField(meta, 'promotion.facebook.utm.source', r.source);
      if (r.fallbackUsed)
        recordFallback(
          meta,
          'promotion.facebook.utm.source',
          r.source,
          'settings utm.source missing; defaulted to facebook',
        );
    }

    {
      const r = getFieldValue(
        [{ value: utmConfig.medium, source: 'settings.promotion.facebook.utm.medium' }],
        'social',
      );
      utm.medium = r.value;
      recordField(meta, 'promotion.facebook.utm.medium', r.source);
      if (r.fallbackUsed)
        recordFallback(
          meta,
          'promotion.facebook.utm.medium',
          r.source,
          'settings utm.medium missing; defaulted to social',
        );
    }

    {
      const r = getFieldValue(
        [
          {
            value: utmConfig.campaignPattern,
            source: 'settings.promotion.facebook.utm.campaignPattern',
          },
        ],
        '{page}_post',
      );
      // 注意：本批不展開 {page}/{slug} placeholder；保留 pattern 字串供 caller 進一步處理
      utm.campaign = r.value;
      recordField(meta, 'promotion.facebook.utm.campaign', r.source);
      if (r.fallbackUsed)
        recordFallback(
          meta,
          'promotion.facebook.utm.campaign',
          r.source,
          'settings utm.campaignPattern missing; defaulted to {page}_post',
        );
    }

    promotion.facebook.utm = utm;
  }

  // ─── series ───────────────────────────────────────────────
  //
  // Phase 8-f-3-b：normalized.series 解析（pure function；不修改 post / settings）
  //   - 設計依據：docs/series-schema.md §2 / §6 / §8 / §11.2 + Phase 8-f-3-a 分析
  //   - 形狀：null（無 series / 無可用 series）/ object resolved:false（id 找不到 settings）/ object resolved:true（完整解析）
  //   - 合併優先序：frontmatter.series.* override → settings.series[id].* → fallback
  //   - hashtags 採「完整覆寫」非合併（per series-schema.md §8.4）
  //   - 不新增 validate-content user-visible warning；invalid 情境寫入 validationMeta.warnings 作 helper-internal traceability
  //   - 不實作 series.titleTemplate placeholder 解析（屬後續批次）
  //   - 不影響 build output（EJS / build scripts 暫不讀 normalized.series）

  let seriesOut = null;
  {
    const rawSeries = p.series;

    if (rawSeries === undefined || rawSeries === null) {
      // 狀態 1 / 2：無 series 區塊；seriesOut = null（不記 warning）
    } else if (typeof rawSeries !== 'object' || Array.isArray(rawSeries)) {
      // 狀態 3：series 非 plain object（string / array / number / boolean）
      recordWarning(
        meta,
        'series-invalid-shape',
        'series',
        `series is not a plain object (typeof=${Array.isArray(rawSeries) ? 'array' : typeof rawSeries})`,
      );
    } else {
      const id = rawSeries.id;
      const isValidId = typeof id === 'string' && id.trim() !== '';

      if (!isValidId) {
        // 狀態 4：id 空字串或非 string；seriesOut = null
        recordWarning(
          meta,
          'series-id-empty',
          'series.id',
          'series.id is empty or non-string; treated as no usable series',
        );
      } else {
        // 狀態 5/6/7：id 有值；查 settings.series（結構為 { series: [...] } 含 wrap）
        const seriesDefs =
          settings && settings.series && Array.isArray(settings.series.series)
            ? settings.series.series
            : [];
        const def = seriesDefs.find((s) => s && s.id === id) ?? null;
        const resolved = def !== null;

        const number = rawSeries.number;
        const subtitle = hasValue(rawSeries.subtitle) ? rawSeries.subtitle : null;

        // 系列層欄位：frontmatter override → settings → fallback:null
        let name = null;
        let nameSource = 'fallback:null';
        if (hasValue(rawSeries.name)) {
          name = rawSeries.name;
          nameSource = 'frontmatter.series.name';
        } else if (def && hasValue(def.name)) {
          name = def.name;
          nameSource = 'settings.series[id].name';
        }

        let nameEn = null;
        let nameEnSource = 'fallback:null';
        if (hasValue(rawSeries.nameEn)) {
          nameEn = rawSeries.nameEn;
          nameEnSource = 'frontmatter.series.nameEn';
        } else if (def && hasValue(def.nameEn)) {
          nameEn = def.nameEn;
          nameEnSource = 'settings.series[id].nameEn';
        }

        let titleTemplate = null;
        let titleTemplateSource = 'fallback:null';
        if (hasValue(rawSeries.titleTemplate)) {
          titleTemplate = rawSeries.titleTemplate;
          titleTemplateSource = 'frontmatter.series.titleTemplate';
        } else if (def && hasValue(def.titleTemplate)) {
          titleTemplate = def.titleTemplate;
          titleTemplateSource = 'settings.series[id].titleTemplate';
        }

        // hashtags：frontmatter 完整覆寫（非合併；per series-schema.md §8.4）→ settings → fallback:empty-array
        let hashtags = [];
        let hashtagsSource = 'fallback:empty-array';
        if (Array.isArray(rawSeries.hashtags)) {
          hashtags = rawSeries.hashtags;
          hashtagsSource = 'frontmatter.series.hashtags';
        } else if (def && Array.isArray(def.hashtags)) {
          hashtags = def.hashtags;
          hashtagsSource = 'settings.series[id].hashtags';
        }

        // tags：frontmatter override → settings → fallback:empty-array
        //   - 設計依據：docs/series-schema.md §22 candidate 7 規格
        //   - 短 slug 格式（per §22.2）；不含 #；與 hashtags 分離（per §22.5）
        //   - 空陣列視同未設定（per §22.2）；非陣列亦回退至 empty
        //   - 不新增 validate-content warning（per §22.6）
        let tags = [];
        let tagsSource = 'fallback:empty-array';
        if (Array.isArray(rawSeries.tags)) {
          tags = rawSeries.tags;
          tagsSource = 'frontmatter.series.tags';
        } else if (def && Array.isArray(def.tags)) {
          tags = def.tags;
          tagsSource = 'settings.series[id].tags';
        }

        seriesOut = {
          id,
          number,
          subtitle,
          name,
          nameEn,
          titleTemplate,
          hashtags,
          tags,
          resolved,
        };

        recordField(meta, 'series.id', 'frontmatter.series.id');
        recordField(meta, 'series.number', 'frontmatter.series.number');
        recordField(
          meta,
          'series.subtitle',
          subtitle !== null ? 'frontmatter.series.subtitle' : 'fallback:null',
        );
        recordField(meta, 'series.name', nameSource);
        recordField(meta, 'series.nameEn', nameEnSource);
        recordField(meta, 'series.titleTemplate', titleTemplateSource);
        recordField(meta, 'series.hashtags', hashtagsSource);
        recordField(meta, 'series.tags', tagsSource);
        recordField(meta, 'series.resolved', 'computed:settings-lookup');

        if (!resolved) {
          recordWarning(
            meta,
            'series-id-not-resolved',
            'series.id',
            `series.id="${id}" not found in settings.series; per-post fields preserved, settings-level fields null`,
          );
        }
      }
    }
  }

  // ─── promotion.facebook.hashtags inheritance backfill ──
  //
  // Phase 8-f-7-b：series.hashtags 繼承到 normalized.promotion.facebook.hashtags
  //   - 沿 docs/series-schema.md §8.2 規範：series.hashtags 為 fallback（fb.md / legacy 之後）
  //   - 觸發條件保守：promotion.facebook.hashtags 為空 array AND seriesOut.hashtags 非空 array
  //   - 既有優先序維持：.fb.md.hashtags > legacy frontmatter.promotion.facebook.hashtags > series.hashtags > []
  //   - 不取代非空之 .fb.md / legacy hashtags（不破壞單篇 override 設計）
  //   - 不做 array 合併；採完整 fallback（替換空陣列為 series.hashtags）
  //   - 不影響 Blogger post.tags（不同概念；不跨界）
  //   - 不支援 site default hashtags / first-article fallback（本批不做）
  //   - 既有 fixture（已有 fb hashtags）輸出完全不變
  //   - fieldSource 更新為 'computed:series.hashtags'；fallbackUsed 新增對應記錄
  if (
    Array.isArray(promotion.facebook.hashtags) &&
    promotion.facebook.hashtags.length === 0 &&
    seriesOut &&
    Array.isArray(seriesOut.hashtags) &&
    seriesOut.hashtags.length > 0
  ) {
    promotion.facebook.hashtags = seriesOut.hashtags;
    recordField(meta, 'promotion.facebook.hashtags', 'computed:series.hashtags');
    recordFallback(
      meta,
      'promotion.facebook.hashtags',
      'computed:series.hashtags',
      'inherited from series.hashtags',
    );
  }

  // ─── promotion.facebook.hashtags site-default backfill ─
  //
  // Phase 8-g-19-c：site default hashtags 接入為 FB hashtags fallback chain step 4
  //   - 設計依據：docs/promotion-export.md §11 candidate 5 規格
  //   - 完整 chain（接入後）：
  //       1. .fb.md.hashtags（sidecar-first；非空 array）
  //       2. legacy frontmatter.promotion.facebook.hashtags（非空 array）
  //       3. series.hashtags（Phase 8-f-7-b post-pass backfill；非空 array）
  //       4. settings.promotion.facebook.defaultHashtags（本批新增；非空 array）
  //       5. []（最終 fallback）
  //   - mirror Phase 8-f-7-b series.hashtags backfill pattern（上一 block）
  //   - 觸發條件保守：promotion.facebook.hashtags 為空 array AND settings.promotion.facebook.defaultHashtags 為非空 array
  //   - 既有優先序維持：step 1/2/3 命中後不會 fall-through 至本 backfill
  //   - 不合併；採完整 fallback（per docs/promotion-export.md §11.4 「完整覆蓋；不合併」）
  //   - 不自動補 #（per §11.2「自動補 # ❌；必須由作者於 settings 明確填入 #」）
  //   - 不寫入 Blogger tags / GitHub tags / sidecar data（per §11.5 分離原則 / §11.6 scope 邊界）
  //   - 既有 fixture / dist-promotion：若 settings 預設 [] 或既有 post 已在 step 1/2/3 命中 → byte-identical
  //   - fieldSource 更新為 'settings.promotion.facebook.defaultHashtags'；fallbackUsed 新增對應記錄
  {
    const siteDefaultHashtags = getNestedValue(settings, 'promotion.facebook.defaultHashtags');
    if (
      Array.isArray(promotion.facebook.hashtags) &&
      promotion.facebook.hashtags.length === 0 &&
      Array.isArray(siteDefaultHashtags) &&
      siteDefaultHashtags.length > 0
    ) {
      promotion.facebook.hashtags = siteDefaultHashtags;
      recordField(
        meta,
        'promotion.facebook.hashtags',
        'settings.promotion.facebook.defaultHashtags',
      );
      recordFallback(
        meta,
        'promotion.facebook.hashtags',
        'settings.promotion.facebook.defaultHashtags',
        'inherited from site default hashtags',
      );
    }
  }

  // ─── publish.blogger.tags 寫入 ──────────────────────────
  //
  // Phase 8-g-18-c：將 post.tags / series.tags 寫入 normalized.publish.blogger.tags
  //   - 設計依據：docs/series-schema.md §22 candidate 7 規格
  //   - fallback chain：post.tags (non-empty) → seriesOut.tags (non-empty) → []
  //     1. frontmatter.tags 為文章層最高優先（per §22.4；維持作者單篇控制）
  //     2. seriesOut.tags 為系列繼承（已於 series 區塊解析 frontmatter.series.tags / settings.series[id].tags）
  //     3. 兩者皆無 → []
  //   - mirror Phase 8-f-7-b promotion.facebook.hashtags backfill pattern
  //   - 與 promotion.facebook.hashtags 嚴格分離（per §22.5）：本欄不讀 series.hashtags；series.hashtags 不讀本欄
  //   - 本批不影響 build-blogger.js（仍讀 post.tags；屬 Phase 8-g-18-d 接入）
  //   - 既有無 post.tags / 無 series 之 posts → []；對 dist 無影響（build-blogger 未接）
  //   - 不接 GitHub tags / promotion / FB sidecar / .publish.json schema / .fb.md schema
  //   - 不新增 validate rule / fixture / sample（per §22.6 / §22.8）
  {
    let value = [];
    let source = 'fallback:empty-array';
    if (Array.isArray(p.tags) && p.tags.length > 0) {
      value = p.tags;
      source = 'frontmatter.tags';
    } else if (seriesOut && Array.isArray(seriesOut.tags) && seriesOut.tags.length > 0) {
      value = seriesOut.tags;
      source = 'computed:series.tags';
    }
    publishOut.blogger.tags = value;
    recordField(meta, 'publish.blogger.tags', source);
    if (source === 'computed:series.tags') {
      recordFallback(
        meta,
        'publish.blogger.tags',
        'computed:series.tags',
        'inherited from series.tags (post.tags empty)',
      );
    }
  }

  // ─── 組裝最終物件 ────────────────────────────────────────

  return {
    identity,
    display,
    seo,
    publish: publishOut,
    promotion,
    series: seriesOut,
    validationMeta: meta,
  };
}
