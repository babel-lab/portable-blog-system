// Phase 8-f-4-b：series.titleTemplate placeholder resolver（pure function helper）
//
// 設計原則：
//   - 純函式：不讀檔、不寫檔、不 throw、不 process.exit
//   - 不修改 input（template / context）；返回新物件
//   - 零外部 import
//   - 相同輸入永遠相同輸出
//   - 與 docs/series-schema.md §2.4 之 titleTemplate placeholder 規格對齊
//   - 與 resolve-placeholders.js（雙大括號 .fb.md body 用）獨立；syntax 不互通
//   - 與 ga4-url-builder.js expandPattern（單大括號純 word；無 dot）獨立
//
// 語法：
//   - 單大括號：{series.name}
//   - 支援 dot notation：{series.subtitle}
//   - 容忍左右空白：{ series.name } / {  series.name  }
//   - placeholder key 首字必為 letter 或 _；後續可含 word 字元；可選 dot-prefixed 段
//   - 不容忍 `{` 與 `}` 之間出現換行
//
// 不支援（屬未來批次規格）：
//   - 條件式 placeholder（如 {?series.subtitle}）
//   - fallback chain（如 {series.name|post.title}）
//   - 巢狀 placeholder（如 {outer.{inner}}）
//   - subtitle 缺值時之智慧括號移除（`...()` 仍輸出空括號）

// ─────────────────────────────────────────────────────────────
// 支援之 placeholder 清單
// ─────────────────────────────────────────────────────────────

const SUPPORTED_PLACEHOLDERS = new Set([
  'series.name',
  'series.nameEn',
  'series.number',
  'series.subtitle',
  'series.id',
  'post.title',
  'post.titleEn',
]);

// 比對 placeholder pattern：單大括號 + dot notation + 左右空白容忍
//   例：{series.name} / { series.name } / {  series.name  }
//   key 首字必為 letter 或 _；後續可含 word 字元；可選 dot-prefixed 段
//   使用 matchAll / per-call new RegExp；不依賴 lastIndex state
const PLACEHOLDER_RE = /\{\s*([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)*)\s*\}/g;

// ─────────────────────────────────────────────────────────────
// 內部工具
// ─────────────────────────────────────────────────────────────

// dot path 取值；中途為 null/undefined 或非物件時返回 undefined；不 throw
function getNestedValue(source, path) {
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

// 判斷 placeholder 之解析值是否「有實際值」
//   - null / undefined → false（unresolved）
//   - 空字串 → true（視為已解析；替換為空字串）
//   - 數字 0 / boolean false → true（嚴格 missing 才 unresolved）
function hasResolvedValue(value) {
  return value !== null && value !== undefined;
}

// regex escape（僅針對 dot；其他特殊字元在 SUPPORTED_PLACEHOLDERS 之名稱集合內不出現）
function escapeForRegex(name) {
  return name.replace(/\./g, '\\.');
}

// ─────────────────────────────────────────────────────────────
// extractTitlePlaceholders(template)
//   抽出 template 內所有 placeholder name（依首次出現順序去重）
//   - template 非字串或空字串 → 返回空 array
// ─────────────────────────────────────────────────────────────

export function extractTitlePlaceholders(template) {
  if (typeof template !== 'string' || template === '') return [];
  const seen = new Set();
  const ordered = [];
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      ordered.push(name);
    }
  }
  return ordered;
}

// ─────────────────────────────────────────────────────────────
// resolveTitlePlaceholderValue(name, context)
//   解析單一 placeholder 之值
//   返回：{ resolved: boolean, value: string | null, reason: string | null }
//     - resolved=true：value 為已轉換之 string；reason=null
//     - resolved=false：value=null；reason ∈ { 'missing-value', 'unsupported-placeholder' }
// ─────────────────────────────────────────────────────────────

export function resolveTitlePlaceholderValue(name, context = {}) {
  if (typeof name !== 'string' || name === '') {
    return { resolved: false, value: null, reason: 'unsupported-placeholder' };
  }
  if (!SUPPORTED_PLACEHOLDERS.has(name)) {
    return { resolved: false, value: null, reason: 'unsupported-placeholder' };
  }
  const raw = getNestedValue(context, name);
  if (!hasResolvedValue(raw)) {
    return { resolved: false, value: null, reason: 'missing-value' };
  }
  return { resolved: true, value: String(raw), reason: null };
}

// ─────────────────────────────────────────────────────────────
// resolveTitleTemplate(template, context)
//   對整段 template 做 placeholder 替換
//   返回：{ resolvedText, placeholders, replacements, unresolvedPlaceholders }
//     - resolvedText：替換後字串；unresolved 保留原 `{X.Y}` 字串
//     - placeholders：依首次出現順序去重之 name array
//     - replacements：array of { name, value }（僅含 resolved）
//     - unresolvedPlaceholders：array of { name, reason }
// ─────────────────────────────────────────────────────────────

export function resolveTitleTemplate(template, context = {}) {
  if (typeof template !== 'string' || template === '') {
    return {
      resolvedText: typeof template === 'string' ? template : '',
      placeholders: [],
      replacements: [],
      unresolvedPlaceholders: [],
    };
  }

  const placeholders = extractTitlePlaceholders(template);
  const replacements = [];
  const unresolvedPlaceholders = [];

  let resolvedText = template;
  for (const name of placeholders) {
    const resolution = resolveTitlePlaceholderValue(name, context);
    // 對該 name 之所有空白變體（{X} / { X } / {  X  }）一次全域替換
    const regex = new RegExp(`\\{\\s*${escapeForRegex(name)}\\s*\\}`, 'g');
    if (resolution.resolved) {
      resolvedText = resolvedText.replace(regex, resolution.value);
      replacements.push({ name, value: resolution.value });
    } else {
      // unresolved：保留原文（不替換）；記入 unresolvedPlaceholders
      unresolvedPlaceholders.push({ name, reason: resolution.reason });
    }
  }

  return {
    resolvedText,
    placeholders,
    replacements,
    unresolvedPlaceholders,
  };
}
