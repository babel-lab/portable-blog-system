// Phase 8-c-2：placeholder resolver helper（純函式）
//
// 設計依據：docs/placeholder-resolver-design.md
//
// 職責：
//   - extractPlaceholders(text)：從字串抽出所有 {{ ... }} placeholder 名稱（去重）
//   - resolvePlaceholderValue(name, context, options)：解析單一 placeholder 之值
//   - resolvePlaceholders(text, context, options)：對整段字串做 placeholder 替換
//
// 設計原則：
//   - 純函式：不讀檔、不寫檔、不執行 build、不依賴 process.cwd() 或環境變數
//   - 不修改傳入之 post / context / options（input 視為 immutable）
//   - 不 throw 作為一般 unresolved 控制流程（unresolved 透過回傳結構表達）
//   - 不接入 load-posts / validate-content / build-promotion / build-github / build-blogger
//   - 不實作 status × severity 矩陣（屬 8-c-3 validate-content 接入範圍）
//   - 不實作 schema 深度驗證
//   - **永遠不預測 Blogger URL**（沿用 docs/publish-json-schema.md §5.3 強制規則）
//   - GitHub URL 推導本批不實作；無明確值即 unresolved

// ─────────────────────────────────────────────────────────────
// 常數
// ─────────────────────────────────────────────────────────────

// 第一批支援之 4 個 URL placeholder
const SUPPORTED_PLACEHOLDERS = new Set([
  'articleUrl',
  'blogger.publishedUrl',
  'github.publishedUrl',
  'canonicalUrl',
]);

// 暫不支援清單（屬第二批，本批不解析；列入 unresolvedPlaceholders 並標記 reason）
const KNOWN_UNSUPPORTED_PLACEHOLDERS = new Set([
  'title',
  'description',
  'excerpt',
  'tags',
  'hashtags',
  'slug',
  'publishedAt',
  'siteName',
  'category',
]);

// placeholder 比對規則（沿用 docs/fb-sidecar-schema.md §5.2）：
//   {{ KEY }} 容忍前後空白；不容忍跨行；KEY 首字元不可為 } 或空白
const PLACEHOLDER_RE_SOURCE = '\\{\\{\\s*([^}\\s][^}]*?)\\s*\\}\\}';

// ─────────────────────────────────────────────────────────────
// 內部工具
// ─────────────────────────────────────────────────────────────

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// ─────────────────────────────────────────────────────────────
// extractPlaceholders(text)
// ─────────────────────────────────────────────────────────────

export function extractPlaceholders(text) {
  if (typeof text !== 'string' || text === '') return [];
  const re = new RegExp(PLACEHOLDER_RE_SOURCE, 'g');
  const seen = new Set();
  const result = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (!seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// 取值 helper：Blogger publishedUrl
//   嚴格沿用既有欄位；不推導；不從 yyyy/mm/slug 組 URL；不從 bloggerSiteUrl + slug 組 URL
// ─────────────────────────────────────────────────────────────

function getBloggerPublishedUrl(post, publish) {
  // (1) post.publish.blogger.publishedUrl
  if (publish && publish.blogger && isNonEmptyString(publish.blogger.publishedUrl)) {
    return { value: publish.blogger.publishedUrl, source: 'post.publish.blogger.publishedUrl' };
  }
  // (2) post.publish.publishedUrl（flat fallback）
  if (publish && isNonEmptyString(publish.publishedUrl)) {
    return { value: publish.publishedUrl, source: 'post.publish.publishedUrl' };
  }
  // Phase 8-h-d-4：移除 (3) post.publishedUrl legacy frontmatter top-level fallback（per docs/phase-8h-c-pre-plan.md §3.2 位置 #14）
  return null;
}

// ─────────────────────────────────────────────────────────────
// 取值 helper：GitHub publishedUrl
//   本批不實作 siteUrl + path 推導；若沒有明確值即 null
// ─────────────────────────────────────────────────────────────

function getGithubPublishedUrl(post, publish) {
  // (1) post.publish.github.publishedUrl
  if (publish && publish.github && isNonEmptyString(publish.github.publishedUrl)) {
    return { value: publish.github.publishedUrl, source: 'post.publish.github.publishedUrl' };
  }
  // (2) post.publish.github.url
  if (publish && publish.github && isNonEmptyString(publish.github.url)) {
    return { value: publish.github.url, source: 'post.publish.github.url' };
  }
  // Phase 8-h-d-4：移除 (3) post.github.publishedUrl + (4) post.githubUrl legacy frontmatter fallback（per docs/phase-8h-c-pre-plan.md §3.2 位置 #15 + #16）
  return null;
}

// ─────────────────────────────────────────────────────────────
// 取值 helper：canonical URL
//   articleUrlResolver 為函式或 null；null 時跳過 articleUrl fallback（避免遞迴）
// ─────────────────────────────────────────────────────────────

function getCanonicalUrl(post, publish, articleUrlResolver) {
  // (1) post.publish.canonical.url（schema-defined nested form，依 publish-json-schema.md §3）
  if (publish && publish.canonical && isNonEmptyString(publish.canonical.url)) {
    return { value: publish.canonical.url, source: 'post.publish.canonical.url' };
  }
  // (2) post.publish.canonicalUrl（flat alias，相容 frontmatter 風格）
  if (publish && isNonEmptyString(publish.canonicalUrl)) {
    return { value: publish.canonicalUrl, source: 'post.publish.canonicalUrl' };
  }
  // Phase 8-h-d-4：移除 (3) post.canonicalUrl legacy frontmatter top-level fallback（per docs/phase-8h-c-pre-plan.md §3.2 位置 #17）
  // (3) articleUrl 解析結果（若 resolver 提供且非 null）
  if (typeof articleUrlResolver === 'function') {
    const r = articleUrlResolver();
    if (r && isNonEmptyString(r.value)) {
      return { value: r.value, source: 'articleUrl' };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// 取值 helper：articleUrl
//   依 target / primaryPlatform 動態選擇來源；遞迴控制：
//     articleUrl → canonical 時，canonical 之 articleUrlResolver 設為 null
//     避免 articleUrl ↔ canonical 互相遞迴
// ─────────────────────────────────────────────────────────────

function getArticleUrl(post, publish, facebook, target, primaryPlatform) {
  // canonicalResolver：對 canonical 解析時不再 fallback 至 articleUrl（防遞迴）
  const canonicalResolver = () => getCanonicalUrl(post, publish, null);

  function tryBlogger() {
    const r = getBloggerPublishedUrl(post, publish);
    if (r) return r;
    return canonicalResolver();
  }

  function tryGithub() {
    const r = getGithubPublishedUrl(post, publish);
    if (r) return r;
    return canonicalResolver();
  }

  switch (target) {
    case 'blogger':
      return tryBlogger();
    case 'github':
      return tryGithub();
    case 'canonical':
      return canonicalResolver();
    case 'custom': {
      // 順序：context.facebook.customUrl → context.facebook.url
      //      → context.facebook.articleUrl → post.articleUrl
      if (facebook && isNonEmptyString(facebook.customUrl)) {
        return { value: facebook.customUrl, source: 'context.facebook.customUrl' };
      }
      if (facebook && isNonEmptyString(facebook.url)) {
        return { value: facebook.url, source: 'context.facebook.url' };
      }
      if (facebook && isNonEmptyString(facebook.articleUrl)) {
        return { value: facebook.articleUrl, source: 'context.facebook.articleUrl' };
      }
      if (post && isNonEmptyString(post.articleUrl)) {
        return { value: post.articleUrl, source: 'post.articleUrl' };
      }
      return null;
    }
    case 'auto':
    default: {
      // primaryPlatform === 'github' → 優先 GitHub；否則優先 Blogger
      if (primaryPlatform === 'github') return tryGithub();
      return tryBlogger();
    }
  }
}

// ─────────────────────────────────────────────────────────────
// resolvePlaceholderValue(name, context, options)
//
//   回傳：{ name, value, resolved, source, reason }
//     resolved=true 時：source 為取值路徑、reason=null
//     resolved=false 時：source 與 reason 為 sentinel 字串
//       'unsupported-placeholder' / 'unresolved'
// ─────────────────────────────────────────────────────────────

export function resolvePlaceholderValue(name, context = {}, options = {}) {
  const post = context.post ?? null;
  // publish fallback：context.publish > post.publish
  const publish = context.publish ?? (post ? post.publish ?? null : null);
  // facebook fallback：context.facebook > post.sidecars.facebook.data
  const facebook =
    context.facebook ??
    (post && post.sidecars && post.sidecars.facebook ? post.sidecars.facebook.data ?? null : null);

  // target / primaryPlatform：options 為主，否則由 facebook / post 取得；最後預設
  const target =
    options.target ??
    (facebook && typeof facebook.target === 'string' ? facebook.target : null) ??
    'auto';
  const primaryPlatform =
    options.primaryPlatform ??
    (post && typeof post.primaryPlatform === 'string' ? post.primaryPlatform : null) ??
    'blogger';

  // 暫不支援之第二批 placeholder：不解析、列為 unresolved
  if (KNOWN_UNSUPPORTED_PLACEHOLDERS.has(name)) {
    return {
      name,
      value: null,
      resolved: false,
      source: 'unsupported-placeholder',
      reason: 'unsupported-placeholder',
    };
  }

  // 不在第一批支援清單之未知 placeholder（typo / 自訂名）：同樣不解析
  if (!SUPPORTED_PLACEHOLDERS.has(name)) {
    return {
      name,
      value: null,
      resolved: false,
      source: 'unsupported-placeholder',
      reason: 'unsupported-placeholder',
    };
  }

  // 第一批支援之 4 個 URL placeholder
  let result = null;
  switch (name) {
    case 'blogger.publishedUrl':
      result = getBloggerPublishedUrl(post, publish);
      break;
    case 'github.publishedUrl':
      result = getGithubPublishedUrl(post, publish);
      break;
    case 'canonicalUrl':
      // canonical 可 fallback 至 articleUrl 解析結果
      result = getCanonicalUrl(post, publish, () =>
        getArticleUrl(post, publish, facebook, target, primaryPlatform),
      );
      break;
    case 'articleUrl':
      result = getArticleUrl(post, publish, facebook, target, primaryPlatform);
      break;
  }

  if (result && isNonEmptyString(result.value)) {
    return {
      name,
      value: result.value,
      resolved: true,
      source: result.source,
      reason: null,
    };
  }

  return {
    name,
    value: null,
    resolved: false,
    source: 'unresolved',
    reason: 'unresolved',
  };
}

// ─────────────────────────────────────────────────────────────
// resolvePlaceholders(text, context, options)
//
//   回傳：{ originalText, resolvedText, placeholders, replacements,
//          unresolvedPlaceholders, issues }
//
//   行為：
//     - 對 text 中所有 {{ ... }} placeholder 做替換
//     - 僅替換 resolved=true 之 placeholder
//     - unresolved 之 placeholder 保留原文（如 {{ articleUrl }}），不替換為空字串
//     - 不修改傳入之 text
// ─────────────────────────────────────────────────────────────

export function resolvePlaceholders(text, context = {}, options = {}) {
  const originalText = typeof text === 'string' ? text : '';

  if (originalText === '') {
    return {
      originalText: '',
      resolvedText: '',
      placeholders: [],
      replacements: [],
      unresolvedPlaceholders: [],
      issues: [],
    };
  }

  const placeholders = extractPlaceholders(originalText);
  // 每個 unique placeholder 解析一次（避免重複呼叫）
  const resolutions = new Map();
  for (const name of placeholders) {
    resolutions.set(name, resolvePlaceholderValue(name, context, options));
  }

  // 替換：僅 resolved=true 才替換；其餘保留原文
  const re = new RegExp(PLACEHOLDER_RE_SOURCE, 'g');
  const resolvedText = originalText.replace(re, (match, captured) => {
    const name = captured.trim();
    const r = resolutions.get(name);
    if (r && r.resolved && isNonEmptyString(r.value)) {
      return r.value;
    }
    return match; // 保留原始 {{ ... }} 字串
  });

  const replacements = [];
  const unresolvedPlaceholders = [];
  const issues = [];

  for (const name of placeholders) {
    const r = resolutions.get(name);
    if (r.resolved) {
      replacements.push({
        name,
        value: r.value,
        source: r.source,
      });
    } else {
      unresolvedPlaceholders.push({
        name,
        reason: r.reason,
      });
      // 一般 issue 物件；不採 validate-content 之 severity 格式（屬 8-c-3 範圍）
      issues.push({
        type: 'placeholder-unresolved',
        placeholder: name,
        reason: r.reason,
      });
    }
  }

  return {
    originalText,
    resolvedText,
    placeholders,
    replacements,
    unresolvedPlaceholders,
    issues,
  };
}
