# GA4 Custom Dimensions Registration Checklist

- **Phase**：`20260615-am-7-ga4-custom-dimensions-registration-checklist-docs-only-a`
- **日期**：2026-06-15
- **性質**：**docs-only**（不改 source / 不改 GA config / 不 build / 不 deploy）
- **baseline**：`main` HEAD == origin/main == `33571ee`（`docs(ga4): record bottom nav realtime receipt`）；working tree clean

> 目的：把目前 BLOG 系統 GA4 click tracking 實際送出的 event parameters 整理清楚，規劃哪些應在 **GA4 後台註冊為 event-scoped custom dimensions**，使其可在 GA4 Reports / Explore 使用。
> 本文件**不**改 source、**不**改 `content/settings/ga4.config.json`、**不** deploy；GA4 後台之實際註冊由使用者手動執行。

---

## 1. Purpose / scope

- ✅ 讓目前送出的 GA4 click parameters 可在 GA4 Reports / Explore 中作為維度使用。
- ✅ 範圍：**event-scoped custom dimensions**（非 user-scoped / item-scoped）。
- ❌ **不改 source**；❌ **不改 GA config**；❌ **不 deploy**。
- ❌ **不驗證 Blogger**（Blogger 無 listener；本 checklist 之 surface 僅 `github_pages`）。
- ❌ **不驗證 AdSense iframe click**；❌ **不驗證 Auto Ads**；❌ **不驗證 affiliate revenue**。

---

## 2. Current GA4 tracking state

| 項目 | 狀態 |
|---|---|
| `click_other_link` 已在 GA4 Realtime 出現 | ✅（am-6；count 5）|
| GitHub Pages article bottom nav DOM attributes | ✅ 已確認（am-5 DevTools）|
| parameter detail inspection | 🟡 pending / partial（僅 event_name 已確認）|
| Blogger listener | ❌ 未完成 → **不納入**本 checklist 實作範圍 |
| measurementId | `G-C77SMPF8VD`（`content/settings/ga4.config.json`）|

⚠️ 重要區分：`content/settings/ga4.config.json` 之 `events[]`（`internal_link_click` / `tag_click` / `category_click` / `affiliate_click` / ...）為**宣告清單，目前未 wire**；實際 fire 之 event 為 source 端 inline attrs 之 `click_*`（family B）。custom dimension 註冊以**實際送出之 parameter**為準，不以 config 宣告為準。

---

## 3. Parameter inventory

下表盤點 GA4 click tracking 之 event parameters。**「current source / origin」誠實標示是否為目前實際送出**（LIVE）或僅為提案 / 未 wire（PROPOSED）。

| parameter_name | current source / origin | example value | used by which event | surface | register as CD? | recommended display name | scope | priority | risk / notes |
|---|---|---|---|---|---|---|---|---|---|
| `surface` | **LIVE** — `article-bottom-nav.ejs` | `github_pages` | `click_other_link`(nav) | github_pages | **yes** | Surface | Event | **P1** | 低基數；穩定；跨 surface 分析關鍵 |
| `click_area` | **LIVE** — `article-bottom-nav.ejs` | `article_bottom_nav` | `click_other_link`(nav) | github_pages | **yes** | Click Area | Event | **P1** | 低基數；穩定；區分 nav vs otherLinks aside |
| `nav_direction` | **LIVE** — `article-bottom-nav.ejs` | `previous` / `next` / `home` | `click_other_link`(nav) | github_pages | **yes** | Nav Direction | Event | **P1** | 3 值；極穩定；本批核心維度 |
| `post_slug` | **LIVE** — nav + affiliate + related/other | `github-pages-blog-planning` | 全 click_* | github_pages | **yes** | Source Post Slug | Event | **P1** | 隨文章數成長（中基數）；分析來源頁必需 |
| `target_slug` | **LIVE** — `article-bottom-nav.ejs` | `portable-blog-system-mvp` / `home` | `click_other_link`(nav) | github_pages | **yes** | Target Slug | Event | **P1** | 隨文章數成長；`home` 為固定字串 |
| `target_url` | **LIVE** — `article-bottom-nav.ejs` | `/portable-blog-system/posts/portable-blog-system-mvp/` | `click_other_link`(nav) | github_pages | **later** | Target URL | Event | **P2** | ⚠️ cardinality 較高；多數資訊已含於 target_slug；可只註 slug |
| `link_label` | **LIVE** — nav + affiliate + related/other | `Portable Blog System MVP 開發筆記` / `回首頁` | 全 click_* | github_pages | **later** | Link Label | Event | **P2** | ⚠️ cardinality 高（= 標題文字）；與 link_text 命名待統一（§10）|
| `link_type` | **LIVE** — affiliate + related/other | `affiliate` / `cross_site` / `internal` / `external` | click_affiliate_cta / related / other | github_pages | **yes** | Link Type | Event | **P1/P2** | 低基數；穩定；建議一併註冊 |
| `placement` | **LIVE** — affiliate + related/other | `article_top` / `article_bottom` / `related_links` / `other_links` | click_affiliate_cta / related / other | github_pages | **later** | Placement | Event | **P2** | 低基數；與 click_area 概念鄰近（§10 評估是否合併語意）|
| `outbound` | **LIVE** — affiliate + related/other | `true` / `false`（字串）| click_affiliate_cta / related / other | github_pages | **later** | Outbound | Event | **P3** | boolean；分析價值低；可用 filter 取代 |
| `provider` | **LIVE** — affiliate CTA（= `link.network`）| `通路王` | click_affiliate_cta | github_pages | **later** | Affiliate Network | Event | **P2** | 即 §3 之「affiliate_network」概念；**目前 param 名為 `provider`**（命名待統一，§10）|
| `link_url` | **LIVE** — affiliate + related/other | `https://...?uid1=blog` | click_affiliate_cta / related / other | github_pages | **no/later** | Link URL | Event | **P3** | ⚠️ 高 cardinality；含 affiliate redirect；不建議當維度，需要時用 link_type + provider |
| `link_source_key` | **LIVE（conditional）** — related/other（僅 entry 有 sourceKey）| `taipei-library` | click_related_link / click_other_link | github_pages | **later** | Link Source Key | Event | **P3** | 條件性出現；視 sourceKey 採用率再評估 |
| `link_text` | **PROPOSED（未 emit）** | — | — | — | **no** | （同 Link Label）| Event | — | 與 `link_label` 重複概念；**二擇一**，建議統一用 `link_label`（§10）|
| `affiliate_network` | **PROPOSED（未 emit；現以 `provider` 表達）** | `通路王` / `聯盟網` | （未來 commerce）| github_pages | **later** | Affiliate Network | Event | **P2** | 若未來把 `provider` 改名 `affiliate_network` 須 source phase；本批不改 |
| `commerce_link_id` | **PROPOSED（未 emit；taxonomy optional）** | `bg-myself2-books` | （未來 commerce ref）| github_pages | **later** | Commerce Link ID | Event | **P2** | 等實際 commerce click 量再註冊；現 0 emit |
| `outbound_domain` | **PROPOSED（未 emit；taxonomy = destination_domain）** | `youtube.com` | （未來 external link）| github_pages | **later** | Outbound Domain | Event | **P2** | 低～中基數；待 external link tracking 落地再註 |
| `category` | **PROPOSED（config 宣告 `category_click`，未 wire）** | `tech-note` | （未來）| github_pages | **later** | Category | Event | **P3** | 文章分類；可由 post_slug 間接得；低急迫 |
| `page_type` | **PROPOSED（未 emit）** | `post_detail` / `home` | （未來）| github_pages | **later** | Page Type | Event | **P3** | 規劃中；待 nav/card tracking 擴大再評估 |
| `block_id` | **PROPOSED（未 emit；taxonomy ads/nav）** | `article-bottom-nav` | （未來）| github_pages | **later** | Block ID | Event | **P3** | 高細碎；現以 click_area 已足；不急 |

> ⚠️ 註：`tag` / `tag_click` 僅出現在 `src/views/tracking/ga4-events-helper.ejs` 之**註解範例**（該 helper 當前未被使用）；production 之 hashtag 為 display-only `<span>`，**不** emit；故不列入需註冊維度。

---

## 4. Recommended custom dimensions（保守優先順序）

**Priority 1（建議現在就註冊；皆為 LIVE + 低～中基數）**
- `click_area`
- `nav_direction`
- `post_slug`
- `target_slug`
- `surface`
- （建議一併）`link_type`（LIVE、低基數、跨多 event 有分析價值）

**Priority 2（次要；含 cardinality / 命名待決）**
- `link_label`（高基數；與 `link_text` 命名待統一 → §10）
- `target_url`（⚠️ cardinality 風險；多數資訊已含於 `target_slug`，可只註 slug）
- `placement`（LIVE；與 click_area 概念鄰近）
- `provider`（= affiliate network；命名待統一 → §10）
- `outbound_domain`（未 emit；待 external link tracking）
- `commerce_link_id`（未 emit；待實際 commerce click 量）

**Priority 3 / later（高變動或未 emit；暫不註冊）**
- `block_id`、`page_type`、`category`、`link_url`（高基數）、`outbound`、`link_source_key`

---

## 5. Naming recommendation（display name ↔ event parameter ↔ scope）

| display name | event parameter | scope |
|---|---|---|
| Click Area | `click_area` | Event |
| Nav Direction | `nav_direction` | Event |
| Source Post Slug | `post_slug` | Event |
| Target Slug | `target_slug` | Event |
| Surface | `surface` | Event |
| Link Type | `link_type` | Event |
| Link Label | `link_label` | Event |
| Placement | `placement` | Event |
| Target URL | `target_url` | Event |
| Affiliate Network | `provider`（現行；未來或改 `affiliate_network`，§10）| Event |
| Outbound Domain | `outbound_domain`（未 emit；future）| Event |
| Commerce Link ID | `commerce_link_id`（未 emit；future）| Event |

⚠️ event parameter 名以 **source 實際送出的 key 為準**（snake_case）；display name 為 GA4 後台顯示用，可加空格 / 大寫。**註冊時務必填對 parameter key**，否則維度抓不到值。

---

## 6. Manual GA4 registration steps（可操作 checklist）

對每一個要註冊的維度，於 GA4 後台執行：

1. GA4 **Admin**（管理）
2. **Data display** → **Custom definitions**（自訂定義）
3. **Create custom dimensions**（建立自訂維度）
4. **Dimension name** = §5 之 display name（如 `Nav Direction`）
5. **Scope** = **Event**
6. **Event parameter** = §5 之 parameter key（如 `nav_direction`）
7. **Description** = 簡述（如「文章底部導覽方向 previous/next/home」）
8. **Save**
9. 等待資料處理（通常數小時～24h；Realtime 可較快看到 event 但維度報表需處理時間）
10. 到 **Explore** 或 **Reports** 測試該維度是否可選用、有值

---

## 7. Cardinality / data-quality caution

- ⚠️ `target_url` / `link_label` / `link_url` 可能有**較多不同值**（高 cardinality）→ 維度報表易出現 "(other)" 聚合；非必要不註冊。
- ⚠️ `post_slug` / `target_slug` 隨**文章數增加而成長**（中基數）；仍值得註冊（分析必需），但需知會持續增長。
- ✅ `click_area` / `nav_direction` / `surface` / `link_type` **較穩定**（低基數）→ **優先註冊**。
- ❌ **不要**把每個過度細碎或臨時參數（`block_id` / `outbound` / `link_url`）都註冊；GA4 event-scoped custom dimensions 雖上限寬（標準資源約 50 個），但維度越多越難維護、報表越雜。
- 📊 若後續要做 **Looker Studio**：優先**保持命名穩定**（display name + parameter key 不要事後改），避免報表 / 資料來源斷裂。

---

## 8. Suggested registration table（照此在 GA4 後台建立）

| create order | dimension name | scope | event parameter | description | priority | required now? |
|---|---|---|---|---|---|---|
| 1 | Surface | Event | `surface` | 點擊來源平台（github_pages）| P1 | **yes** |
| 2 | Click Area | Event | `click_area` | 點擊區塊（article_bottom_nav 等）| P1 | **yes** |
| 3 | Nav Direction | Event | `nav_direction` | 底部導覽方向 previous/next/home | P1 | **yes** |
| 4 | Source Post Slug | Event | `post_slug` | 當前（來源）文章 slug | P1 | **yes** |
| 5 | Target Slug | Event | `target_slug` | 目標文章 slug 或 home | P1 | **yes** |
| 6 | Link Type | Event | `link_type` | internal/cross_site/external/affiliate | P1 | yes（建議）|
| 7 | Link Label | Event | `link_label` | 連結可見文字（高基數注意）| P2 | no |
| 8 | Placement | Event | `placement` | article_top/bottom/related_links/... | P2 | no |
| 9 | Target URL | Event | `target_url` | 目標 href（高基數；可略）| P2 | no |
| 10 | Affiliate Network | Event | `provider` | 聯盟通路（通路王 等）| P2 | no |

> **最小起手**：先建 order 1–5（P1，全 required now）；6 建議一併；7–10 視分析需求再加。未 emit 之 `outbound_domain` / `commerce_link_id` / `block_id` / `page_type` / `category` **等實際送出後**再註冊。

---

## 9. Verification after registration

- Realtime 可能**先**看到 `event_name`（事件本身）；維度報表需資料處理時間。
- **Explore / Reports** 套用新維度可能需等待資料處理（數小時～24h）。
- ⚠️ 新註冊之 custom dimensions **通常不回填歷史資料** → 以**註冊後的新事件**為準（註冊前的點擊不會有維度值）。
- 註冊後**重新點擊** article bottom nav（previous / next / home），再到 Explore 確認該維度可被選用且有值。
- 逐項對照 am-3 checklist §4 matrix 之預期值。

---

## 10. Open decisions（需人決策）

| # | 決策 | 說明 / 傾向 |
|---|---|---|
| D1 | `link_label` vs `link_text` 是否統一 | 目前 source 一律 emit `link_label`；`link_text` 僅為提案。**建議統一用 `link_label`**，不另立 `link_text` |
| D2 | `target_url` 是否註冊，或只註 `target_slug` / `outbound_domain` | 傾向**只註 `target_slug`**（低基數、足以分析）；`target_url` 高基數可略 |
| D3 | Blogger listener 完成後是否沿用同一組 dimensions | **建議沿用**（跨 surface 一致；`surface` 維度區分 blogger vs github_pages）；但 Blogger listener 尚未做 |
| D4 | commerce / affiliate 參數先註冊或等實際 click 量 | 傾向**等實際 commerce click 量**再註 `commerce_link_id`；`provider` 已 LIVE 可較早註 |
| D5 | `provider` 是否改名 `affiliate_network` | 命名一致性 vs source churn；改名須 source phase + 既有 dimension 連續性評估；**本批不改** |
| D6 | 是否建立 Looker Studio dashboard | 視分析需求；前提：先穩定 P1 維度命名 |

---

## 11. Recommended next phase

| Option | 內容 | 性質 |
|---|---|---|
| **A. Priority 1 registration record** | 使用者於 GA4 後台手動註冊 P1 維度（§8 order 1–5/6）後，建立 registration record（docs-only）| docs-only（前提：使用者完成註冊）|
| **B. GA4 parameter detail verification record** | 使用者於 DebugView / Explore 逐項確認 params 後，建立 parameter PASS record（docs-only）| docs-only |
| **C. `link_label` vs `link_text` naming cleanup preanalysis** | docs-only：釐清 D1 命名統一 | docs-only |
| **D. Blogger listener decision preanalysis** | docs-only：Blogger 端 listener strategy（per `blogger-listener-strategy.md`）| docs-only |

**建議**：先 **Option A**（註冊 P1 維度並記錄），再接 **Option B**（參數逐項閉環）。皆 docs-only，**不 source change**。

---

## 12. Cross-links

- `docs/ga4-link-tracking-spec.md`（event design / param union / placement enum）
- `docs/ga4-parameter-naming-registry.md`（命名 registry；event/param naming）
- `docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`（am-1 taxonomy；custom dimension 候選 D8）
- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（am-3 SOP；§4 matrix）
- `docs/20260615-github-pages-live-dom-ga4-nav-observation-record.md`（am-5 DOM observation）
- `docs/20260615-ga4-bottom-nav-backend-event-receipt-record.md`（am-6 backend receipt）
- `src/js/modules/ga4-events.js` / `src/js/modules/link-tracker.js`（trackEvent / delegated listener）
- `src/views/layout/article-bottom-nav.ejs`（nav param 來源）
- `content/settings/ga4.config.json`（measurementId；events 宣告清單）

---

（本文件結束）
