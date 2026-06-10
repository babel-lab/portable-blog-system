// Phase 20260610-am-6 commerce renderer ref resolver（R1 source implementation）
//
// 目的：把 post 之 affiliate.links[] 解析為 renderer（GitHub post-detail.ejs / Blogger
//   blogger-post-full.ejs）可直接使用之 normalized links，支援文章端未來改用
//   affiliate.links[].ref 指向 commerce-links registry（settings.commerceLinks）。
//
// 設計原則（per docs/20260610-commerce-renderer-ref-migration-preanalysis.md §B +
//   本 phase R1 spec）：
//   - side-effect-free pure module（不 import build script / 不跑 main）；GitHub 與
//     Blogger 兩條 render path 共用同一套邏輯，避免邏輯分裂。
//   - **url-backward-compatible-first**：link 若已有非空 url → 逐字保留既有 url，
//     不因 ref 存在而改寫、不 canonicalize、不重組、不刪 uid1=blog。
//   - ref-only（無 url）且 ref 命中 **active** registry entry → url = entry.targetUrl
//     （逐字；保留 affiliate redirect 與 uid1=blog）。
//   - ref missing / not-found / inactive / malformed / targetUrl 缺 → **omit** 該 link
//     （不 fabricate URL，避免 href="undefined"）。inactive（active:false）與 KOBO
//     excluded（根本不在 registry）皆不可解析 → 必 omit。
//   - **label safety**：文章端已有 label → 用文章端 label；否則僅在 registry 有安全
//     公開 displayLabel 時 fallback；無安全公開 label → omit（**絕不**輸出 internalLabel
//     / targetUrl 以外之 registry audit-only 欄位 / tracking token 到 HTML）。
//   - 回傳 array（永不 null）；每個 element 至少含 EJS 需要之 { label, network, url }，
//     且 url 保證為非空 string（EJS 無需 per-link 防呆）。

// buildActiveCommerceLinkEntryMap：linkId → entry map，**只含可供 render 解析之 active entry**。
//   - 非 array → 空 Map。
//   - 忽略非 plain object entry / linkId 非 string / trim 後空 linkId（mirror validator
//     buildCommerceLinkIdSet / buildCommerceLinkEntryMap 之 registry gate 語意）。
//   - active === false → 排除（inactive 不可供 render 解析；ref 指向 inactive → omit）。
//   - first-wins（duplicate linkId 取首筆；mirror validator）。
//   - KOBO / 金石堂電子書 excluded candidate 根本不在 registry → 永不出現於 map。
export function buildActiveCommerceLinkEntryMap(commerceLinks) {
  const map = new Map();
  if (!Array.isArray(commerceLinks)) return map;
  for (const entry of commerceLinks) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    if (typeof entry.linkId !== 'string') continue;
    const key = entry.linkId.trim();
    if (key === '') continue;
    if (entry.active === false) continue;
    if (!map.has(key)) map.set(key, entry);
  }
  return map;
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// deriveRenderedAffiliateLinks：post.affiliate + settings.commerceLinks → normalized links[]。
//   - 不檢查 affiliate.enabled / position（render guard 仍由 EJS 依 post.affiliate 判斷）；
//     本 helper 只負責 link-level resolve / omit / label safety。
//   - 對「無 affiliate / links 非 array」回傳 []（EJS guard 會因 length 0 不渲染）。
export function deriveRenderedAffiliateLinks(affiliate, commerceLinks) {
  if (!affiliate || typeof affiliate !== 'object' || Array.isArray(affiliate)) return [];
  const links = affiliate.links;
  if (!Array.isArray(links)) return [];

  const entryMap = buildActiveCommerceLinkEntryMap(commerceLinks);
  const rendered = [];

  for (const link of links) {
    if (!link || typeof link !== 'object' || Array.isArray(link)) continue;

    // (1) url-backward-compatible-first：既有非空 url 逐字保留，ref 不改寫 url。
    //     pass-through label / network 維持與既有輸出 byte-identical。
    if (isNonEmptyString(link.url)) {
      rendered.push({ label: link.label, network: link.network, url: link.url });
      continue;
    }

    // (2) ref-only path：無可用 url，嘗試以 ref 解析 registry。
    const ref = link.ref;
    if (typeof ref !== 'string') continue; // 非字串 / undefined → omit
    const trimmed = ref.trim();
    if (trimmed === '') continue; // 空 → omit
    const entry = entryMap.get(trimmed); // not-found 或 inactive → undefined → omit
    if (!entry) continue;
    if (!isNonEmptyString(entry.targetUrl)) continue; // registry 無可用 targetUrl → omit（不 fabricate）

    // label safety：文章端 label 優先；否則安全公開 displayLabel；皆無 → omit（不洩 internalLabel）。
    let label;
    if (isNonEmptyString(link.label)) {
      label = link.label;
    } else if (isNonEmptyString(entry.displayLabel)) {
      label = entry.displayLabel;
    } else {
      continue;
    }

    // network badge：僅用文章端 network（公開顯示文字）；無則省略 badge。
    //   不從 networkKey / merchant / internalLabel 等 registry 欄位派生（避免 audit-only 欄位洩漏）。
    const network = isNonEmptyString(link.network) ? link.network : undefined;

    // url 逐字採 registry targetUrl（保留 affiliate redirect + uid1=blog，不 canonicalize）。
    rendered.push({ label, network, url: entry.targetUrl });
  }

  return rendered;
}

// deriveRenderedAffiliateBlocks：Blogger dual-block affiliate.blocks[] → renderer-ready per-block 物件[]。
//   - Phase 20260610-pm-11；per docs/20260610-affiliate-blocks-frontmatter-convention.md §2/§3/§6 + pm-10 §8。
//   - **additive**：完全不改 deriveRenderedAffiliateLinks（GitHub Pages + legacy Blogger 依賴其 backward-compat）。
//   - 僅供 **Blogger** surface；本 phase pages surface 一律不 render（surfaces 不含 'blogger' → 跳過該 block）。
//   - 每 block 之 links resolution **委派既有** deriveRenderedAffiliateLinks（reuse url-backward-compat /
//     ref→targetUrl 逐字含 uid1=blog / omit missing·not-found·inactive·malformed·KOBO / label safety 不洩 internalLabel）。
//   - block renderable 條件（全 AND；任一不符 → 跳過，不輸出空殼）：
//       (a) plain object；(b) enabled !== false（省略視為 enabled）；
//       (c) surfaces 含 'blogger'（省略預設 ['blogger']；非 array → 不 render）；
//       (d) position ∈ {top, bottom}；(e) 解析後 links 至少 1 筆。
//   - 回傳 per-block { id, position, heading, disclosure, links }（僅 renderer 需要欄位；不含 surfaces / enabled /
//     tracking）。id / heading / disclosure 僅在非空 string 時帶入，否則 undefined（fallback 由 renderer 處理）。
//   - 不實作 tracking / GA4 / reverse UTM；不改 affiliate URL policy；不 canonicalize。
export function deriveRenderedAffiliateBlocks(affiliate, commerceLinks) {
  if (!affiliate || typeof affiliate !== 'object' || Array.isArray(affiliate)) return [];
  const blocks = affiliate.blocks;
  if (!Array.isArray(blocks)) return [];

  const rendered = [];
  for (const block of blocks) {
    // (a) plain object
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue;
    // (b) enabled !== false（省略 = enabled）
    if (block.enabled === false) continue;

    // (c) surface gate：省略 surfaces → 預設 ['blogger']；array 須含 'blogger'；非 array → 不 render
    const surfaces = block.surfaces;
    let includesBlogger;
    if (surfaces === undefined) {
      includesBlogger = true;
    } else if (Array.isArray(surfaces)) {
      includesBlogger = surfaces.includes('blogger');
    } else {
      includesBlogger = false;
    }
    if (!includesBlogger) continue;

    // (d) position gate
    const position = block.position;
    if (position !== 'top' && position !== 'bottom') continue;

    // (e) links：委派既有 per-link resolver（omit / label-safety / url 逐字全部沿用）；至少 1 筆才 render
    const links = deriveRenderedAffiliateLinks({ links: block.links }, commerceLinks);
    if (!Array.isArray(links) || links.length === 0) continue;

    rendered.push({
      id: isNonEmptyString(block.id) ? block.id : undefined,
      position,
      heading: isNonEmptyString(block.heading) ? block.heading : undefined,
      disclosure: isNonEmptyString(block.disclosure) ? block.disclosure : undefined,
      links,
    });
  }
  return rendered;
}
