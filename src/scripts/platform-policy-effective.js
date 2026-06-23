// Phase 20260624-am-sp9a-platform-policy-effective-derive-helper-a：
//   platformPolicy per-platform effective lookup（SP-9a，source-light / display-only）。
//   per docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md
//   + docs/20260623-pm-sp8-platform-policy-shape-validator.md（SP-8 shape lock）
//   + docs/20260623-special-page-types-indexing-metadata-preanalysis.md §2.7
//
// 純函式、零依賴、無 side effect：供 page-metadata-summary.js（SP-9a）顯示 effective hint；
//   **永不**消費於 build / render / listing / sitemap / Blogger / GitHub Pages output。
//
// 🔴 SP-9a binding（per Dean approval）：
//   - display-only / no build consumption：呼叫端只能在 Admin read-only summary 使用，
//     **不得**接入 build-github.js / build-blogger.js / build-sitemap.js / page-type-robots.js /
//     include-in-listings.js / include-in-sitemap.js / src/views/blogger/** / src/views/seo/**。
//   - 真正讓 platformPolicy 影響 robots / listing / sitemap / canonical / Blogger guidance 屬
//     SP-9b / SP-9c，當前 dormant（須 Dean 另行批准）。
//
// 🔴 secret-safety（mirror SP-8 validator + SP-7a Admin projection 慣例）：
//   - suspicious platform key 或 nested key（命中 SUSPICIOUS_KEYS）→ 回 null 並標 secretLike，
//     **永不**讀其 value、**永不** echo value。
//   - non-recommended platform key / nested key → 回 null（不讀 value；deferred）。
//   - nested value 為 object / array（巢狀超出 shallow）→ 回 null（SP-8 已標 nested-object-deferred）。
//
// inherit semantics（單一語義中心）：
//   - leaf 值 === 'inherit'（字串）→ inherited → 回 { value: null, source: 'inherit' }
//   - leaf 值 為合法 enum / boolean → override → 回 { value: <as-is>, source: 'override' }
//   - 其餘（不合法 leaf / 缺省 / shape 不對）→ 回 null（呼叫端應 fallback 至 top-level / default）

// SP-8 鎖定之列舉（mirror validate-content.js PLATFORM_POLICY_*）
const PLATFORM_POLICY_PLATFORM_KEYS = new Set(['github', 'blogger', 'future']);
const PLATFORM_POLICY_NESTED_KEYS = new Set([
  'indexing',
  'includeInListings',
  'includeInSitemap',
  'includeInFeeds',
  'canonical',
  'note',
]);
const PLATFORM_POLICY_INDEXING_VALUES = new Set([
  'index',
  'noindex-follow',
  'noindex-nofollow',
]);
const PLATFORM_POLICY_FLAG_KEYS = new Set(['includeInListings', 'includeInSitemap', 'includeInFeeds']);

// mirror SP-8 GATED_DOWNLOAD_DISALLOWED_KEYS（key 名比對 only；不讀 value）
const SUSPICIOUS_KEYS = new Set([
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'secret',
  'clientsecret',
  'client_secret',
  'password',
  'passwd',
  'apikey',
  'api_key',
  'authorization',
  'bearer',
  'sessionid',
  'session_id',
  'drivefolderid',
  'drive_folder_id',
  'folderid',
  'responses',
  'responsedata',
  'response_data',
  'respondents',
]);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isSuspiciousKey(name) {
  return typeof name === 'string' && SUSPICIOUS_KEYS.has(name.toLowerCase());
}

/**
 * 解析 platformPolicy 之 per-platform per-field effective lookup（純函式；display-only）。
 *
 * 回傳 { value, source }：
 *   - source = 'override'  → 該 leaf 為明確合法值（indexing enum / boolean / canonical non-empty string / note string）；
 *                            value 為原值（caller 直接顯示）。
 *   - source = 'inherit'   → leaf 為字串 'inherit'；value = null（caller 應 fallback 至 top-level）。
 *   - source = 'secret'    → 該 platform 或 leaf key 命中 SUSPICIOUS_KEYS；value = null（**不**讀 value）。
 *   - source = 'invalid'   → leaf 存在但 shape / 型別不合（SP-8 已對應 warn）；value = null。
 *   - source = 'absent'    → platformPolicy 缺省 / 非 object / platform 缺省 / nested 缺省。
 *
 * @param {*} fm post frontmatter（已解析）
 * @param {string} platform 'github' | 'blogger' | 'future'
 * @param {string} field 'indexing' | 'includeInListings' | 'includeInSitemap' | 'includeInFeeds' | 'canonical' | 'note'
 * @returns {{ value: (string|boolean|null), source: string }}
 */
export function resolvePlatformPolicyValue(fm, platform, field) {
  if (!fm || typeof fm !== 'object') return { value: null, source: 'absent' };
  const policy = fm.platformPolicy;
  if (!isPlainObject(policy)) return { value: null, source: 'absent' };

  // 不接受未在 PLATFORM_POLICY_PLATFORM_KEYS 之 platform 參數（caller bug 防呆）
  if (typeof platform !== 'string' || !PLATFORM_POLICY_PLATFORM_KEYS.has(platform)) {
    return { value: null, source: 'absent' };
  }
  // 不接受未在 PLATFORM_POLICY_NESTED_KEYS 之 field 參數
  if (typeof field !== 'string' || !PLATFORM_POLICY_NESTED_KEYS.has(field)) {
    return { value: null, source: 'absent' };
  }

  // suspicious top-level platform key → 不讀 entry
  if (isSuspiciousKey(platform)) return { value: null, source: 'secret' };

  const platformEntry = policy[platform];
  if (platformEntry === undefined) return { value: null, source: 'absent' };
  if (!isPlainObject(platformEntry)) return { value: null, source: 'invalid' };

  // suspicious nested key 命中 → 不讀 value
  if (isSuspiciousKey(field)) return { value: null, source: 'secret' };

  const leaf = platformEntry[field];
  if (leaf === undefined) return { value: null, source: 'absent' };

  // 'inherit' 字串 → fallback 至 top-level（caller 自行 fallback）
  if (leaf === 'inherit') return { value: null, source: 'inherit' };

  // nested object / array → SP-8 deferred；視為 invalid（不 recurse / 不讀 value）
  if (leaf !== null && typeof leaf === 'object') return { value: null, source: 'invalid' };

  // 依 field 型別判定 override / invalid
  if (field === 'indexing') {
    if (typeof leaf === 'string' && PLATFORM_POLICY_INDEXING_VALUES.has(leaf)) {
      return { value: leaf, source: 'override' };
    }
    return { value: null, source: 'invalid' };
  }
  if (PLATFORM_POLICY_FLAG_KEYS.has(field)) {
    if (leaf === true || leaf === false) return { value: leaf, source: 'override' };
    return { value: null, source: 'invalid' };
  }
  if (field === 'canonical') {
    if (typeof leaf === 'string' && leaf.trim() !== '') return { value: leaf, source: 'override' };
    return { value: null, source: 'invalid' };
  }
  if (field === 'note') {
    if (typeof leaf === 'string') return { value: leaf, source: 'override' };
    return { value: null, source: 'invalid' };
  }

  // 不該到此（field 已被 PLATFORM_POLICY_NESTED_KEYS 守門）
  return { value: null, source: 'invalid' };
}

/**
 * 為 Admin read-only summary 投影 platformPolicy 之 per-platform effective hint（純函式）。
 *
 * 對輸入 fm 中之 platformPolicy 巢狀結構，逐 platform 投影 effective indexing / includeInListings
 * 兩個常見欄位（mirror SP-7a derivePlatformPolicySafe 已投影之 raw 兩欄）。
 *
 * 回傳每個 platform entry：
 *   {
 *     name: 'github' | 'blogger' | 'future' | <unknown>,
 *     recognized: boolean,              // 是否為 PLATFORM_POLICY_PLATFORM_KEYS
 *     isObject: boolean,                // platform value 是否為 plain object
 *     secretLike: boolean,              // platform key 是否命中 SUSPICIOUS_KEYS
 *     indexing: { raw, effective, source },
 *     includeInListings: { raw, effective, source },
 *   }
 *
 * raw = 原始 leaf 顯示用（'inherit' / enum / 'true' / 'false' / '' / 'invalid (typeof=…)'）；
 * effective = 解 inherit / 解 override 後之顯示值；inherited 之 effective 由 caller 提供 top-level
 *   fallback（本函式不知道 top-level，故 inherit 時 effective = null）。
 * source = 'override' / 'inherit' / 'secret' / 'invalid' / 'absent'。
 *
 * **永不**回傳 secret value；suspicious key 之 raw / effective 一律為空字串 + secretLike = true。
 *
 * @param {*} fm post frontmatter
 * @returns {{ present: boolean, isObject: boolean, platforms: Array<object> }}
 */
export function derivePlatformPolicyEffective(fm) {
  const policy = fm && typeof fm === 'object' ? fm.platformPolicy : undefined;
  const out = { present: policy !== undefined, isObject: false, platforms: [] };
  if (!isPlainObject(policy)) return out;
  out.isObject = true;

  for (const name of Object.keys(policy)) {
    const recognized = PLATFORM_POLICY_PLATFORM_KEYS.has(name);
    const secretLike = isSuspiciousKey(name);
    const sub = policy[name];
    const isObj = isPlainObject(sub);

    const entry = {
      name,
      recognized,
      isObject: isObj,
      secretLike,
      indexing: { raw: '', effective: null, source: 'absent' },
      includeInListings: { raw: '', effective: null, source: 'absent' },
    };

    if (secretLike) {
      // 不讀 sub；raw / effective 維持空（display-only 仍可顯示 platform 名 + secretLike badge）
      entry.indexing.source = 'secret';
      entry.includeInListings.source = 'secret';
      out.platforms.push(entry);
      continue;
    }
    if (!isObj) {
      entry.indexing.source = 'invalid';
      entry.includeInListings.source = 'invalid';
      out.platforms.push(entry);
      continue;
    }

    // unrecognized platform key → 仍嘗試 lookup，但因 resolvePlatformPolicyValue 之 platform 守門
    //   會直接回 'absent'。這裡為了 Admin 顯示，仍直接讀 leaf raw（只取已 SP-8 過篩之欄位名稱）。
    //   suspicious nested key 仍須走 isSuspiciousKey 檢查不讀 value。
    for (const field of ['indexing', 'includeInListings']) {
      const target = entry[field];

      if (isSuspiciousKey(field)) {
        target.source = 'secret';
        continue;
      }

      // recognized platform → 走 resolvePlatformPolicyValue（語義單一中心）
      if (recognized) {
        const r = resolvePlatformPolicyValue(fm, name, field);
        target.source = r.source;
        // raw 顯示
        const leafRaw = sub[field];
        target.raw = renderLeafRaw(leafRaw, field);
        // effective：override 即 r.value；inherit / 其他 → null（caller fallback）
        target.effective = r.source === 'override' ? r.value : null;
        continue;
      }

      // unrecognized platform：read leaf 但僅顯示 raw label，effective = null（不推導）
      const leafRaw = sub[field];
      target.raw = renderLeafRaw(leafRaw, field);
      target.effective = null;
      target.source = leafRaw === undefined ? 'absent' : 'unrecognized-platform';
    }

    out.platforms.push(entry);
  }
  return out;
}

/**
 * 顯示用 leaf raw label（不 echo secret value；caller 已先過 isSuspiciousKey）。
 */
function renderLeafRaw(leaf, field) {
  if (leaf === undefined) return '';
  if (leaf === 'inherit') return 'inherit';
  if (leaf === true) return 'true';
  if (leaf === false) return 'false';
  if (leaf === null) return 'null';
  if (Array.isArray(leaf)) return 'invalid (typeof=array)';
  if (typeof leaf === 'object') return 'invalid (typeof=object)';
  if (typeof leaf === 'string') {
    if (field === 'indexing' && !PLATFORM_POLICY_INDEXING_VALUES.has(leaf)) {
      return `invalid ("${leaf}")`;
    }
    if (PLATFORM_POLICY_FLAG_KEYS.has(field)) {
      // string 對 flag 屬非法（boolean / 'inherit' 才合法；'inherit' 已 early return）
      return `invalid ("${leaf}")`;
    }
    return leaf;
  }
  return `invalid (typeof=${typeof leaf})`;
}
