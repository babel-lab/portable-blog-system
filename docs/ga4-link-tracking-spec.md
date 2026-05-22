# GA4 / Link Tracking Spec

本文件為 BLOG 系統之 **GA4 / UTM / link click tracking 規格文件**；屬 docs-only spec；本批 phase `20260522-day-2-c` **不**修改任何 source / template / settings / build / deploy / production GA4 code。

文件採 **cross-reference 模式**：與既有 `click-tracking-governance.md` / `ad-affiliate-schema-proposal.md` / `pm-phase-2-batch-plan.md` 等 governance / proposal docs 有重疊時，**指向**既有 doc；本 spec 提供**規格層之口徑**（principles / rules / naming convention），不重寫實作細節。

---

## 1. Purpose

### 1.1 文件用途

- 定義 BLOG 系統之 **GA4 event / UTM / link click tracking 規格**
- 提供**單一規格口徑**：哪些連結加 UTM / 哪些不加 / 哪些送 GA4 event / 三平台導流命名 / affiliate vs AdSense 差異
- 服務 **Phase 1 後續可用性修補** + **Phase 2 tracking implementation** 之前置 spec

### 1.2 文件不做之事

- ❌ **不直接實作 JS** event tracking
- ❌ **不修改** production GA4 code（`src/views/tracking/ga4.ejs` / `src/js/modules/ga4-events.js` / `src/js/modules/link-tracker.js`）
- ❌ **不改** `content/settings/ga4.config.json`
- ❌ **不取代** `docs/click-tracking-governance.md`（governance 為實作對接 spec）
- ❌ **不取代** `docs/20260522-phase-1-done-criteria.md`（Phase 1 驗收口徑）

### 1.3 文件之定位

**Tracking spec**（規格層）；與既有 governance doc 之關係：

- `click-tracking-governance.md`：偏 **implementation contract**（attr convention / event name / param dictionary）
- `ad-affiliate-schema-proposal.md`：偏 **schema proposal**（unified metadata schema 提案）
- 本文件：偏 **regulatory framework**（principles / rules / naming convention / open questions）

---

## 2. Tracking Principles

### 2.1 六項核心原則

| # | Principle | 說明 |
|---|---|---|
| **P1** | **UTM 用於「導流來源辨識」**；不是拿來追蹤 canonical URL | utm_* params 屬訪客來源 attribution；不是 link identifier |
| **P2** | **GA4 event 用於「站內使用者互動紀錄」** | event 為 client-side 主動 fire；目標為 GA4 property |
| **P3** | **canonical / sitemap / SEO URL 不應混入 UTM** | 搜尋引擎索引 URL 必須 clean；UTM URL **不**作為主要索引 URL |
| **P4** | **內部正式 URL 與分享 URL 要分離** | canonical = clean URL；分享版（FB / email / etc.）可帶 UTM |
| **P5** | **Affiliate click 可由本站送 GA4 event；但外部聯盟（通路王 / 聯盟網）不吃本站 GA4** | 本站 GA4 event 記錄「點出前」之站內行為；外部 attribution 走聯盟平台自有機制（subid / sid 等）|
| **P6** | **AdSense 不應用 UTM 追個別廣告點擊** | AdSense 內建 impression / click handling；自插 UTM / 自插 GA4 event 會干擾原生追蹤 + 違反政策風險 |

### 2.2 原則層 vs 既有 governance doc

本 §2 principles 為**原則層宣告**；具體實作對應 cross-ref：

- P2 / P5 之 event implementation → `click-tracking-governance.md` §3.2 / §5
- P1 / P4 之 UTM injection 點 → `click-tracking-governance.md` §3.1 / §4
- P6 之 AdSense vs affiliate 分軌 → `ad-affiliate-schema-proposal.md` §6.1 vs §6.2-§6.4

---

## 3. Tracking Targets（8 類）

### 3.1 Article external links（文章內一般外部連結）

- **範圍**：圖書館 / 出版社 / 作者網站 / YouTube / 一般引用連結等
- **GA4 event**：✅ **可送**（`link_click` with `link_type=external`；per §4）
- **UTM**：⚠️ **不一定加**；除非為我方可管理之導流目的；多數情況保留 author 原始 URL
- **rel / target**：依 `CLAUDE.md` §16.1 自動加 `target="_blank" rel="nofollow noopener noreferrer"`
- **Cross-ref**：`click-tracking-governance.md` §8.2

### 3.2 Related links（相關文章 / 相關資源連結）

- **範圍**：frontmatter `relatedLinks[]` aside 內之連結
- **若導向本站 Blogger / GitHub（cross-site）**：
  - GA4 event：✅ 可送 `link_click` with `link_type=cross_site`
  - UTM：✅ 可加（per §5；cross-site UTM injection 已存在於 GitHub→Blogger 方向）
  - canonical URL：clean；UTM 為 build 階段 derive
- **若導向外部網站**：同 §3.1 處理
- **canonical 規則**：本站 canonical URL **不**加 UTM；分享版 / promotion 版可加（per P3 / P4）
- **Cross-ref**：`click-tracking-governance.md` §8 / `related-links-schema.md`

### 3.3 Hashtag links（hashtag 點擊）

- **範圍**：文章底部 hashtag chip
- **GA4 event**：✅ 可送 `hashtag_click`（per §4）
- **必帶 params**：`link_type=hashtag` / `hashtag` / `post_slug` / `content_group`
- **UTM**：❌ **不加**（站內導向 `/tags/{slug}/`；no cross-platform attribution 需求）
- **前置改造**：當前 hashtag render 為 `<span>`；click event 對接前須 **span → a** 轉換（per `pm-phase-2-batch-plan.md` §8）
- **Cross-ref**：`click-tracking-governance.md` §5.4 / §8.4

### 3.4 FB to Blogger / GitHub UTM

- **方向**：FB 粉絲頁貼文 → Blogger article / GitHub Pages article
- **UTM**：
  - `utm_source=facebook`
  - `utm_medium=social`
  - `utm_campaign` = 由文章 campaign metadata 決定（per §6；如 `book_review_<slug>` / `tech_note_<slug>`）
  - `utm_content` = `fb_post_<YYYYMMDD>` 或 `post_<N>` / slot identifier
- **GA4 event**：UTM 落地後 GA4 自動 attribute；不需自送 event；可選 reserved `click_fb_promotion_link`
- **既有實作**：`content/settings/promotion.config.json` 之 `campaignPattern` / `contentPattern`
- **Cross-ref**：`click-tracking-governance.md` §3.1 / §4 row 1+2

### 3.5 Blogger to GitHub UTM（反向；尚未實作）

- **方向**：Blogger article → GitHub Pages article（relatedLinks / otherLinks 內 cross-site link）
- **UTM 建議**：
  - `utm_source=blogger`
  - `utm_medium` = **建議 `referral`**（standard analytics convention；GA4 後台之 Traffic source 報表預設識別）
    - 替代：`internal-crosslink`（語意上更精確；但 GA4 後台需自訂 channel grouping；增加維護成本）
    - **本 spec 推薦：`referral`**（per §9 Open Question Q1）
  - `utm_campaign` = 與文章 campaign metadata 對齊（如 `portable_blog_system` default）
  - `utm_content` = `related_links` | `other_links`（per cross-site link 區塊）
- **GA4 event**：可同步送 `cross_site_click` with `source_platform=blogger` / `target_platform=github_pages`
- **狀態**：🔴 **尚未實作**；per `CLAUDE.md` §16.4 future；implementation 屬 Phase 2（per `pm-phase-2-batch-plan.md` §10）
- **Cross-ref**：`click-tracking-governance.md` §4 row 3

### 3.6 GitHub to Blogger UTM（已實作）

- **方向**：GitHub Pages article → Blogger article（relatedLinks / otherLinks 內 cross-site link）
- **UTM 既有實作**（per `src/scripts/ga4-url-builder.js applyCrossSiteUtm`）：
  - `utm_source=github_pages`
  - `utm_medium=referral`（per current implementation；對齊 §3.5 建議）
  - `utm_campaign=portable_blog_system`
  - `utm_content=related_links | other_links`
- **GA4 event**：cross_site_click 對接屬 Phase 2（attr 注入 EJS template）
- **Cross-ref**：`click-tracking-governance.md` §4 row 4

### 3.7 Affiliate blocks（聯盟區塊）

- **範圍**：affiliate-box 之 CTA 連結；可有上下兩個區塊
- **placement enum**：`affiliate_top` / `affiliate_bottom`；未來可擴 `affiliate_inline` / `affiliate_sidebar`
- **未來可支援欄位**：`provider` / `campaign` / `slot` / `product_id` / `destination_domain`（per §6 affiliateBlocks[] schema）
- **⚠️ 同 linkUrl 之區分**：同一個銷售連結放在上下時，**必須**能用 GA4 event 之 `link_position` 或 `affiliate_slot` 參數區分點擊位置；不能只看 link_url
- **GA4 event**：`affiliate_click` with `link_type=affiliate` / `affiliate_provider` / `affiliate_slot=top|bottom` / `destination_domain` / `post_slug` 等
- **UTM**：⚠️ **不主動加 UTM 至 affiliate URL**（per P5 + `click-tracking-governance.md` §7.3）；聯盟平台不一定吃；可能影響 attribution
- **External attribution**：外部聯盟平台之 attribution 走自有 subid / sid / aff_sub（per §5.5）；不混入 GA4 utm
- **Cross-ref**：`click-tracking-governance.md` §7 / `ad-affiliate-schema-proposal.md` §6.2-§6.4 + §7

### 3.8 Google AdSense blocks

- **範圍**：AdSense slot；可有多 placement（如 `adsense_top` / `adsense_middle` / `adsense_bottom` / `adsense_sidebar`）
- **管理面**：可在 metadata 標明區塊位置；用於 conditional render
- **❌ 不追蹤個別廣告點擊**：
  - AdSense 內建 impression / click handling
  - 自插 GA4 event 會與 AdSense 後台報表不一致
  - 違反 AdSense 政策風險（不得干擾原生廣告點擊）
- **可考慮追蹤**：「**區塊是否曝光**於文章模板」（impression-level；非 ad click）；屬 future enhancement；不混入 affiliate click tracking
- **明確分軌**：AdSense tracking model（廣告平台自管）≠ affiliate tracking model（本站 GA4 + 聯盟平台 subid）；**不可混用**
- **Cross-ref**：`ad-affiliate-schema-proposal.md` §6.1 / `click-tracking-governance.md` §9.2

---

## 4. Recommended GA4 Event Design

### 4.1 Event name 命名策略選擇

**方案 A：統一 `link_click` event + `link_type` 區分**

```
event: link_click
params: { link_type: 'external' | 'cross_site' | 'hashtag' | 'affiliate' | 'related' | ... }
```

- **優點**：event 數少；GA4 後台 events 列表簡潔
- **缺點**：GA4 後台 filter by event name 喪失精度；需多步 filter by param

**方案 B：多 event name 各 specific（既有 governance 採用）**

```
click_cross_site_link
click_related_link
click_other_link
click_hashtag
click_affiliate_cta
（reserved: click_fb_promotion_link）
```

- **優點**：GA4 後台 events 列表清晰；可直接看每類點擊量
- **缺點**：event 種類多；需文件統一命名

**方案 C：混合（推薦於本 spec）**

- **specific events** for 高優先類別：`affiliate_click` / `hashtag_click` / `cross_site_click`
- **generic `link_click`** for 一般外部 / related external 連結
- 用 `link_type` 參數細分

### 4.2 ⚠️ 本 spec 之推薦：對齊既有 governance（方案 B）

本 spec **推薦沿用** `click-tracking-governance.md` §5 之既有命名（方案 B + 部分 generic）：

```
✅ click_cross_site_link       (Blogger ↔ GitHub 互連)
✅ click_related_link          (relatedLinks aside)
✅ click_other_link            (otherLinks aside)
✅ click_hashtag               (hashtag chip)
✅ click_affiliate_cta         (affiliate-box CTA)
✅ click_fb_promotion_link     (reserved)
```

**推薦理由**：
- 既有 governance doc 已 commit + push（commit `aabc082` + reconcile `413ca5b`）；改命名會造成已落地 spec 之 churn
- 既有 `link-tracker.js` listener / `ga4-events-helper.ejs` helper 不關心 event name；對 spec 端 friendly
- GA4 後台之 events 列表 6 個易讀

**外部一般連結**（per §3.1）建議**追加新 event** `click_external_link`（with `link_type=external` / `destination_domain` / `post_slug`），與既有 5 個 click_* 對齊命名 convention。

### 4.3 必含 params

以下 params 為**任何 click event 之 union schema**；per event 取對應子集：

| param | 用途 |
|---|---|
| `link_type` | `external` / `cross_site` / `hashtag` / `affiliate` / `related` / `other` |
| `link_position` | `top` / `bottom` / `inline` / `sidebar` / `aside` |
| `link_label` | UI 顯示文字 |
| `link_url` / `destination_url` | 目標 URL（含 UTM 之版本，若有）|
| `destination_domain` | 目標網域（如 `babel-lab.blogspot.com` / `youtube.com`）|
| `post_slug` | 當前文章 slug |
| `post_title` | 當前文章標題（optional）|
| `content_group` | 文章類型 grouping（如 `tech-note` / `book-review`）|
| `campaign` | 文章 / 活動 campaign（per §6 metadata）|
| `platform_context` | `blogger` / `github_pages` / `admin_preview` |
| `affiliate_provider` | per §3.7（如 `tongluwang` / `affiliate_network`）|
| `affiliate_slot` | per §3.7（`top` / `bottom`）|
| `hashtag` | per §3.3（hashtag 文字 / slug）|
| `series_id` / `series_no` | 系列文章；optional |

### 4.4 Cross-ref

- attr 命名 convention（`data-ga4-event` + `data-ga4-param-<key>` snake_case；helper key regex）→ `click-tracking-governance.md` §6
- helper / listener / wiring 既有 → `click-tracking-governance.md` §2.1
- 既有 `ga4.config.json` event 清單（CLAUDE.md §5）vs 本 spec 命名差異 → `click-tracking-governance.md` §9.2（governance decision deferred）

---

## 5. Recommended UTM Naming

### 5.1 utm_source 列舉

| source | 對應 |
|---|---|
| `facebook` | FB 粉絲頁 / 個人貼文 |
| `blogger` | Blogger 文章內 cross-site link |
| `github_pages` | GitHub Pages 文章內 cross-site link |
| `email` | （未來）email 推廣（如電子報）|
| `direct` | （特殊）直接訪問；通常 GA4 自動 attribute；不主動加 |

### 5.2 utm_medium 列舉

| medium | 用途 |
|---|---|
| `social` | 社群平台貼文（FB / 未來 Threads / X / etc.）|
| `referral` | 網頁互連（含 cross-site）；推薦此為 Blogger ↔ GitHub 互連預設值 |
| `email` | （未來）email 推廣 |
| `affiliate` | （**不建議用於聯盟導購 URL**；per P5；聯盟 URL 不主動加 UTM）|

### 5.3 utm_campaign 命名

- 採 **snake_case**
- per 文章：`book_review_<slug>` / `tech_note_<slug>` / `life_note_<slug>`
- per 活動：`reasons_for_travel` / `summer_reading_2026`
- per cross-link 預設：`portable_blog_system`（既有實作 default）
- 對齊 frontmatter `campaign` 欄位（per §6 metadata）

### 5.4 utm_content 命名

- 區分**位置 / 元件 / 系列編號**
- 範例：
  - `fb_post_20260522`（FB 貼文於 5/22 發出）
  - `fb_post_20260522_v2`（系列 #2；同 campaign 之第 2 篇 FB 貼文）
  - `fb_post_20260522_part2`（同 campaign 之第 2 部分）
  - `related_links`（aside relatedLinks）
  - `other_links`（aside otherLinks）
  - `affiliate_top` / `affiliate_bottom`
  - `hashtag`（暫保留；當前 hashtag 不加 UTM）

### 5.5 utm_term

- **本 spec 建議：暫不使用**
- 理由：個人 blog 規模小；utm_term 傳統用於 paid search keyword；當前無 paid 流量
- 保留未來支援：若未來上 Google Ads / Bing Ads，可加 `utm_term=<keyword>`

### 5.6 範例

| 方向 | 完整 UTM 範例 |
|---|---|
| **FB → Blogger** | `utm_source=facebook&utm_medium=social&utm_campaign=book_review_atomic_habits&utm_content=fb_post_20260522` |
| **FB → GitHub** | `utm_source=facebook&utm_medium=social&utm_campaign=tech_note_portable_blog_system&utm_content=fb_post_20260522` |
| **Blogger → GitHub**（per §3.5 建議）| `utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links` |
| **GitHub → Blogger**（既有實作）| `utm_source=github_pages&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links` |
| **FB 貼文系列 #2** | `utm_source=facebook&utm_medium=social&utm_campaign=reasons_for_travel&utm_content=fb_post_20260522_v2` |
| **FB 貼文系列 #3 part2** | `utm_source=facebook&utm_medium=social&utm_campaign=reasons_for_travel&utm_content=fb_post_20260523_part2` |

### 5.7 ⚠️ subid / sid / aff_sub（外部聯盟平台）

- **不混入 GA4 utm**；屬聯盟平台自有 attribution 機制
- 若聯盟平台支援（如 `epc` / `sub_id` / `aff_sub`），可於 affiliate URL 之原始 destination 加入；屬 author 手動 / 聯盟後台設定
- **本站 GA4 event** 之 `affiliate_provider` / `affiliate_slot` / `link_url` 仍可記錄；與 subid 為兩層獨立 attribution
- 不靠 utm 區分 affiliate top/bottom；**靠 GA4 event `affiliate_slot` 參數**區分

---

## 6. Metadata Fields Proposal

### 6.1 Content metadata（frontmatter / sidecar 建議欄位）

per 文章 metadata 應保留之欄位（未來可逐步落地至 schema）：

| field | 用途 |
|---|---|
| `campaign` | 文章對應 campaign（per §5.3 utm_campaign 派生）|
| `contentGroup` | 文章類型 grouping（per §4.3 `content_group`）|
| `fbPostUrl` | FB 推廣貼文 URL（既有 .fb.md sidecar）|
| `fbPostedAt` | FB 推廣貼文發布時間 |
| `fbPostId` | FB 推廣貼文 ID |
| `canonicalUrl` | 文章正式 canonical（clean URL；無 UTM）|
| `bloggerUrl` | Blogger 端 publishedUrl |
| `githubUrl` | GitHub 端 published URL |
| `links[]` | 文章內所有提及之連結（未來 metadata 化）|
| `relatedLinks[]` | aside relatedLinks（既有 schema；per `related-links-schema.md`）|
| `hashtags[]` | 文章 tags（既有；per `tags.json`）|
| `affiliateBlocks[]` | affiliate block 之 metadata；per §6.2 |
| `adBlocks[]` | AdSense block 之 metadata；per `ads.config.json` 擴充 |

### 6.2 affiliateBlocks[] 建議 schema

per `ad-affiliate-schema-proposal.md` §4 + §6.2-§6.4 + 本 spec 補強：

| field | required? | 用途 |
|---|---|---|
| `enabled` | ✅ | 是否啟用該 block |
| `provider` | ✅ | per §3.1 列舉（`google_adsense` / `tongluwang` / `affiliate_network` / `custom_direct`）|
| `slot` | ✅ | `top` / `bottom` / `inline`（per §3.7 enum）|
| `label` | ✅ | UI 顯示文案 |
| `url` | ✅ | 實際導購連結 |
| `campaign` | 🟡 | 文章 / 活動 campaign |
| `productId` | 🟡 | 商品 ID（per affiliate provider）|
| `trackingId` / `subId` | 🟡 | 若外部聯盟平台支援 subid / sid / aff_sub |
| `ga4EventEnabled` | 🟡 | 是否送 `click_affiliate_cta` event；default `true` |

### 6.3 Cross-ref

- `ad-affiliate-schema-proposal.md` §4 / §5 / §6（unified schema + provider mapping）
- `fb-sidecar-schema.md`（既有 .fb.md schema）
- `related-links-schema.md`（既有 relatedLinks schema）
- `book-schema.md`（既有 book metadata）

---

## 7. SEO / Canonical Safety Rules

### 7.1 七項安全規則

| # | Rule | 強度 |
|---|---|---|
| 1 | **`sitemap.xml` 使用 canonical clean URL，不加 UTM** | ✅ 必守 |
| 2 | **`<link rel="canonical">` 使用 clean URL，不加 UTM** | ✅ 必守 |
| 3 | **Open Graph URL（`og:url`）建議使用 clean URL** | ✅ 強烈建議 |
| 4 | **FB 分享手動貼文連結可以使用 UTM URL** | ✅ 允許（per §3.4）|
| 5 | **站內永久連結預設不加 UTM** | ✅ 必守 |
| 6 | **UTM URL 不應成為主要索引 URL** | ✅ 必守（GA4 referrer attribution OK；搜尋引擎索引必避免）|
| 7 | **不要 blind UTM 加在所有 external links** | ✅ 必守（per §3.1；只加在我方可管理之導流目的）|

### 7.2 既有實作對齊

- ✅ `dist/sitemap.xml`：使用 clean URL；過濾 noindex（per `build-sitemap.js`）
- ✅ canonical：兩端兩端 mirror；clean URL（per `phase-1-completion-report.md` §3.4）
- ✅ Open Graph：既有 `og:url` 對齊 canonical
- ✅ Cross-site UTM（GitHub→Blogger）：build 階段 derive；不污染 canonical / sitemap（per `ga4-url-builder.js` 設計）

### 7.3 Cross-ref

- `CLAUDE.md` §16（連結處理）/ §21（SEO）
- `docs/seo-indexing-rules.md`（noindex 規則）
- `docs/seo-ga4-adsense.md`（既有 SEO/GA4/AdSense 報告）

---

## 8. Implementation Notes for Future Phase

**本 spec 不實作**；以下為**未來實作方向**之 reference：

| 元件 | 既有 / 未來 | 對應 cross-ref |
|---|---|---|
| **Link builder helper**（URL + UTM 派生）| ✅ 已存在：`src/scripts/ga4-url-builder.js` | 含 `applyCrossSiteUtm` / `applyUtm` / `expandPattern` / `resolvePostBaseUrl` |
| **GA4 event helper**（client-side wrap）| ✅ 已存在：`src/js/modules/ga4-events.js` | trackEvent + 無 gtag 時 no-op |
| **Delegated click listener**（document-level）| ✅ 已存在：`src/js/modules/link-tracker.js` | per `click-tracking-governance.md` §2.1 |
| **EJS attr helper partial**（輸出 data-ga4-*）| ✅ 已存在：`src/views/tracking/ga4-events-helper.ejs` | 同上 |
| **Template data attributes**（per click point 注入）| ❌ **Phase 2** | per `click-tracking-governance.md` §6 + `pm-phase-2-batch-plan.md` §5 |
| **Affiliate block component metadata**（schema）| ❌ **Phase 2** | per `ad-affiliate-schema-proposal.md` §4 + 本 spec §6.2 |
| **Admin preview 顯示 tracking metadata** | ❌ **Phase 2**（Admin pagination/filter 評估後） | 屬 day-2-d 候選 |
| **Validator 檢查必要欄位**（如 affiliateBlocks[] schema）| ❌ **Phase 2** | per `validate-content.js` 既有 rule 擴充 |
| **Dry-run report 檢查連結追蹤設定** | ❌ **Phase 2** | per `report-*.js` 系列擴充 |

---

## 9. Open Questions（需 user 決策）

| # | Question | 本 spec 建議 | 阻擋條件 |
|---|---|---|---|
| **Q1** | Blogger ↔ GitHub 互導 medium 用 `referral` 還是 `internal-crosslink`？ | **`referral`**（per §3.5 / §3.6；standard analytics convention；GA4 後台原生識別）| user 決議是否採 |
| **Q2** | Affiliate 外部平台是否支援 subid / sid / aff_sub？ | 屬 per-provider research；通路王 / 聯盟網 / 其他各自有 API | author 查證後填 metadata |
| **Q3** | Hashtag click 是否**全部**追蹤？ | **是；建議全送 `click_hashtag`**（per §3.3；一致 + 簡單；GA4 後台可 filter 不需要的）| user 表態 |
| **Q4** | Related links 是否加 UTM 或只送 GA4 event？ | **cross-site link 加 UTM**（per §3.2 + §3.5/§3.6）；**純 external link 只送 GA4 event**（per §3.1）| user 表態 |
| **Q5** | Admin 是否要顯示 tracking completeness 狀態（如：affiliate block 有無 `productId` / FB campaign 有無 `campaign`）？ | 屬 Phase 2 候選；day-2-d Admin 可用性盤點時評估 | user 表態 |
| **Q6** | `click-tracking-governance.md` §9.2 之 event name reconcile decision（CLAUDE.md §5 既有 9 個 vs governance `click_*` 統一）| 仍 deferred；屬未來 governance decision | user 表態 |

---

## 10. Relationship to Existing Docs

本 spec **僅提供 tracking 規格層口徑**；不取代以下文件：

### 10.1 主要 cross-reference

| 既有文件 | 角色 | 本 spec 引用方式 |
|---|---|---|
| `docs/20260522-phase-1-done-criteria.md` | Phase 1 驗收口徑 | 本 spec **不**重述 Phase 1 完成條件；屬不同層 |
| `README.md` | 專案主說明 | 屬入口；本 spec 不修改 |
| `docs/README.md` | docs 入口 | 屬導覽；本 spec 不修改 |
| `CLAUDE.md` §16 / §21 | 連結處理 / SEO 規範 | 本 spec §2 / §7 引用 |
| `docs/click-tracking-governance.md` | GA4 click 治理（attr convention / event name / param dictionary）| 本 spec **多處 cross-ref**；governance 為實作 contract authoritative source |
| `docs/ad-affiliate-schema-proposal.md` | Ad / affiliate 統一 schema | 本 spec §3.7 / §6.2 cross-ref |
| `docs/20260522-pm-phase-2-batch-plan.md` | Phase 2 12 批拆批 | 本 spec §8 implementation roadmap cross-ref |
| `docs/ga4-parameter-naming-registry.md` | GA4 / UTM naming registry（snake_case）| 本 spec §5 naming convention 對齊 |
| `docs/ga4-enable-preflight.md` | GA4 production gating | 本 spec §1 / §8 cross-ref |
| `docs/seo-ga4-adsense.md` | 既有 GA4 / SEO / AdSense 報告 | 本 spec §7 cross-ref |
| `docs/seo-indexing-rules.md` | noindex 規則 | 本 spec §7 cross-ref |
| `docs/related-links-schema.md` | relatedLinks schema | 本 spec §3.2 cross-ref |
| `docs/fb-sidecar-schema.md` | .fb.md schema | 本 spec §6.1 cross-ref |

### 10.2 本 spec 之邊界

- ✅ 本 spec 為 **tracking 規格 framework**；不修改 governance / proposal / 既有 schema docs
- ❌ 本 spec **不取代** Phase 1 done criteria
- ❌ 本 spec **不取代** click tracking governance 之 implementation contract
- ❌ 本 spec **不刪除 / 不合併**任何既有文件

---

## 11. Cross-links（彙整）

- `docs/20260522-phase-1-done-criteria.md`（Phase 1 驗收口徑）
- `docs/click-tracking-governance.md`（GA4 click 治理；attr / event / param）
- `docs/ad-affiliate-schema-proposal.md`（Ad / affiliate schema proposal）
- `docs/20260522-pm-phase-2-batch-plan.md`（Phase 2 12 批拆批）
- `docs/ga4-parameter-naming-registry.md`（snake_case naming registry）
- `docs/ga4-enable-preflight.md`（GA4 production gating）
- `docs/seo-ga4-adsense.md`（既有 GA4 / SEO / AdSense 報告）
- `docs/seo-indexing-rules.md`（noindex 規則）
- `docs/related-links-schema.md`（relatedLinks schema）
- `docs/fb-sidecar-schema.md`（.fb.md schema）
- `docs/content-platform-routing.md`（platform routing）
- `CLAUDE.md` §5 / §16 / §17 / §21（GA4 events / link rules / 文章版型 / SEO）

---

（本文件結束）
