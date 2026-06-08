// Phase 20260608 commerce-admin-selector-readonly-preview-implementation-a
//   - Additive read-only helper for Admin commerce selector / registry preview UI.
//   - per docs/20260608-commerce-admin-selector-preanalysis.md §6 / §8 / §10
//        + docs/20260608-commerce-admin-selector-ui-source-preanalysis.md §4 / §6 / §10
//   - mirror existing sourceKey selector precedent（active-source-keys.js buildActiveSourceOptions）：
//     純讀 settings registry → 整成 selector / preview UI 所需之最小 safe rows。
//   - DATA SOURCE = production settings.commerceLinks ONLY（loader 已 read-only unwrap 為 array）。
//        - 不讀 content/settings/_sample.commerce-links.json（sample blueprint；loader 白名單天然不載入）。
//        - 不讀 validation overlay / fixture。
//        - 不 auto-promote sample entries 成 production options。
//   - READ-ONLY：不寫 markdown / 不寫 registry / 不啟 Admin Apply / middleware / admin-write-cli。
//   - 只輸出 SAFE 欄位：linkId（ref machine key）/ displayLabel（safe public label）/ active / hasReplacementTarget。
//        - 永不輸出 targetUrl / 任何 tracking URL / internalLabel / networkKey(merchant) / token / credential。
//        - displayLabel safe fallback = linkId 本身（缺 displayLabel 時退回 ref machine key；
//          絕不 fallback 至 internalLabel / targetUrl，避免 C9 內部識別字串外洩）。
//   - graceful：missing / 非 array commerceLinks、invalid entry shape、缺 linkId → 自動排除；不 throw。

// Mirror of validate-content.js VALID_COMMERCE_LINK_ROLE（C8 commerce-ref-invalid-role enum）。
//   - validate-content.js 未 export 此常數，且本 phase 不得修改 validate-content.js，
//     故此處明確 mirror 該 enum 作為 Admin authoring guidance。
//   - FUTURE DEDUPE CANDIDATE：未來應抽到單一 shared module，使 C8 與此 Admin guidance enum
//     不會各自維護而漂移（single source of truth）。
//   - role 目前為 recommended-but-optional；此 enum 僅供 UI guidance，不代表 C7（missing-role required）已啟動。
export const ALLOWED_COMMERCE_ROLES = [
  'primary',
  'alternate',
  'official',
  'price-check',
  'library',
  'direct',
];

// 把 production settings.commerceLinks 整成 Admin preview UI 所需之 safe rows。
//   - 回傳 { rows, count }；rows 只含 safe 欄位（見檔頭）。
//   - 缺 / 非 array / invalid entry / 缺 linkId → 排除；registry empty → rows=[]、count=0（empty-state）。
export function buildCommerceLinkPreviewOptions(settings) {
  const commerceLinks = settings && settings.commerceLinks;
  const rows = [];
  if (!Array.isArray(commerceLinks)) {
    return { rows, count: 0 };
  }
  for (const entry of commerceLinks) {
    // invalid entry shape（null / array / 非 object）→ 無法安全引用，排除
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    // linkId = ref machine key；缺漏則此 entry 無可引用之安全 key → 排除（picker 無法選）
    const linkId = typeof entry.linkId === 'string' ? entry.linkId.trim() : '';
    if (linkId === '') continue;
    // active：mirror registry 語意（active === false 為 inactive；其餘 default true）
    const active = entry.active !== false;
    // displayLabel：safe public label；缺則退回 ref machine key 本身（絕不退回 internalLabel / targetUrl）
    const displayLabel =
      typeof entry.displayLabel === 'string' && entry.displayLabel.trim() !== ''
        ? entry.displayLabel
        : linkId;
    // replacementTarget：只輸出 presence boolean；不輸出其值
    const hasReplacementTarget =
      typeof entry.replacementTarget === 'string' && entry.replacementTarget.trim() !== '';
    rows.push({ linkId, active, displayLabel, hasReplacementTarget });
  }
  return { rows, count: rows.length };
}
