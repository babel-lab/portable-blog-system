// Phase 20260527-night-2 Admin Write Infra §15.D.5
//   - per-field type / format check；可重用；caller 為 safe-write 之 validators 陣列 或 Admin pre-write hook
//   - 每個 validator 簽名：(value, ...ctx) => { ok: boolean, error?: string }
//   - 失敗：回 ok:false + 簡短 error code（不格式化人類訊息；UI 端再 i18n）
//
// 不改 validate:content 行為；本檔屬 admin write 路徑專用 pre-write check。
// 規則嚴格度高於 validate:content（warning-only）→ admin write 阻擋寫入時用 error-level。

// Disallow ASCII control chars EXCEPT TAB (\t=0x09), LF (\n=0x0A), CR (\r=0x0D).
// Ranges: 0x00-0x08, 0x0B-0x0C, 0x0E-0x1F.
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
const MAX_DESCRIPTION = 1000;
const MAX_SEARCH_DESCRIPTION = 500;
const MAX_TITLE_EN = 200;
const MAX_COVER = 500;
const MAX_COVER_ALT = 500;

function isString(v) {
  return typeof v === 'string';
}

export function validateDescription(v) {
  if (!isString(v)) return { ok: false, error: 'description-must-be-string' };
  if (v.length > MAX_DESCRIPTION) return { ok: false, error: 'description-too-long' };
  if (CONTROL_CHAR_RE.test(v)) return { ok: false, error: 'description-has-control-chars' };
  return { ok: true };
}

export function validateSearchDescription(v) {
  if (!isString(v)) return { ok: false, error: 'search-description-must-be-string' };
  if (v.length > MAX_SEARCH_DESCRIPTION) return { ok: false, error: 'search-description-too-long' };
  if (CONTROL_CHAR_RE.test(v)) return { ok: false, error: 'search-description-has-control-chars' };
  return { ok: true };
}

export function validateTitleEn(v) {
  if (!isString(v)) return { ok: false, error: 'title-en-must-be-string' };
  if (v.length > MAX_TITLE_EN) return { ok: false, error: 'title-en-too-long' };
  if (CONTROL_CHAR_RE.test(v)) return { ok: false, error: 'title-en-has-control-chars' };
  return { ok: true };
}

export function validateCover(v) {
  if (!isString(v)) return { ok: false, error: 'cover-must-be-string' };
  if (v.length > MAX_COVER) return { ok: false, error: 'cover-too-long' };
  if (CONTROL_CHAR_RE.test(v)) return { ok: false, error: 'cover-has-control-chars' };
  return { ok: true };
}

export function validateCoverAlt(v) {
  if (!isString(v)) return { ok: false, error: 'cover-alt-must-be-string' };
  if (v.length > MAX_COVER_ALT) return { ok: false, error: 'cover-alt-too-long' };
  if (CONTROL_CHAR_RE.test(v)) return { ok: false, error: 'cover-alt-has-control-chars' };
  return { ok: true };
}

export function validateRelatedLinkKind(v) {
  if (v !== 'internal' && v !== 'external') {
    return { ok: false, error: 'kind-must-be-internal-or-external' };
  }
  return { ok: true };
}

export function validateRelatedLinkUrl(v) {
  if (!isString(v)) return { ok: false, error: 'url-must-be-string' };
  if (v.trim() === '') return { ok: false, error: 'url-empty' };
  if (CONTROL_CHAR_RE.test(v)) return { ok: false, error: 'url-has-control-chars' };
  return { ok: true };
}

// sourceKey 屬 optional 欄位（per docs/related-links-schema.md §11）
//   - undefined → ok:true（不寫入該欄位）
//   - 非 string → invalid-type
//   - empty / whitespace → empty
//   - non-empty 但不在 activeSourceKeys → not-found
// 規則順序 mirror validate-content.js Phase 20260527-pm-14（3 條互斥）。
export function validateRelatedLinkSourceKey(v, activeSourceKeys) {
  if (v === undefined) return { ok: true };
  if (!(activeSourceKeys instanceof Set)) {
    return { ok: false, error: 'active-source-keys-set-required' };
  }
  if (!isString(v)) return { ok: false, error: 'source-key-invalid-type' };
  if (v.trim() === '') return { ok: false, error: 'source-key-empty' };
  if (!activeSourceKeys.has(v)) return { ok: false, error: 'source-key-not-found' };
  return { ok: true };
}

export const LIMITS = Object.freeze({
  MAX_DESCRIPTION,
  MAX_SEARCH_DESCRIPTION,
  MAX_TITLE_EN,
  MAX_COVER,
  MAX_COVER_ALT,
});
