# Click Tracking Governance

本文件為 BLOG / GitHub Pages / Blogger / FB promotion / Affiliate CTA 之**點擊追蹤治理 proposal**；**屬 docs-only governance spec**，**不**代表已全部實作；**本批 phase `20260522-day-1-click-tracking-governance-a` 不修改任何 source / template / JS / GA4 config / build / deploy**。

對應上層：
- `CLAUDE.md` §16（連結處理規則；含 §16.4 GitHub→Blogger 已實作 / Blogger→GitHub 未實作）
- `docs/ga4-parameter-naming-registry.md`（既有 GA4 / UTM naming registry；snake_case convention）
- `docs/seo-ga4-adsense.md`（GA4 / AdSense 整體報告；§5.3 9 個預定義 event）
- `docs/related-links-schema.md`（relatedLinks / otherLinks schema；§9 GA4 attribution）
- `docs/20260522-day-1-readonly-a-report.md` §2 模組 3c + 模組 4（識別此 governance gap）

---

## 1. Purpose

### 1.1 文件目的

- 統一 **GA4 event / UTM / data-attribute** 命名規則，避免後續實作 drift
- 區分「**跨平台流量來源**」（UTM layer）與「**站內互動**」（GA4 event layer）
- 涵蓋 Blogger / GitHub Pages / FB promotion / Affiliate CTA 四種發布 / 推廣脈絡
- 建立 9 類 click source 之集中規格，供未來 Phase 2 rollout 對照

### 1.2 文件性質

- **Docs-only proposal**；不代表任何規格已實作
- 不規範**何時**實作；只規範**實作時應採何種命名 / 結構**
- 任何未來實作 phase 應引用本文件之 click source ID 與命名

### 1.3 不做事項

- ❌ 不修改 EJS template
- ❌ 不新增 JS listener
- ❌ 不改 GA4 config / measurementId / events 清單
- ❌ 不改 Blogger / GitHub build scripts
- ❌ 不改 content schema
- ❌ 不改 affiliate-networks.json
- ❌ 不跑 build / validate
- ❌ 不 deploy / push（push 屬獨立 phase）

---

## 2. Current State（2026-05-22 day-1 盤點）

| 項目 | 狀態 | 證據 |
|---|---|---|
| GA4 production gating | ✅ live | `content/settings/ga4.config.json` enabled=true / measurementId=`G-C77SMPF8VD`；4-AND gating（ga4 + enabled + measurementId + isProdBuild）|
| GitHub → Blogger cross-link UTM | ✅ 已實作 | `src/scripts/ga4-url-builder.js` 之 `isBloggerCrossLink` / `mergeRel` / `applyCrossSiteUtm`；utm_source=`github_pages` / utm_medium=`referral` / utm_campaign=`portable_blog_system` / utm_content=`related_links` \| `other_links`；策略 A（已含 UTM 保留 author intent） |
| FB UTM 基礎 | ✅ 已實作 | `content/settings/promotion.config.json` 之 `campaignPattern` / `contentPattern`；`docs/ga4-parameter-naming-registry.md`（pm-48 + pm-52）對齊 snake_case convention |
| Blogger → GitHub 反向 UTM | 🔴 **尚未實作** | per `CLAUDE.md` §16.4 列為 future phase；Blogger build pipeline 對 GitHub Pages 連結不自動加 UTM；作者可手動於 frontmatter url 帶 UTM |
| GA4 click event rollout to templates | 🔴 **尚未實作** | `content/settings/ga4.config.json` 已預定義 9 個 event 名（per `CLAUDE.md` §5；page_view / internal_link_click / tag_click / category_click / affiliate_click / download_click / social_click / blogger_to_github_click / github_to_blogger_click）；但 EJS templates 尚未統一注入 `data-ga4-*` attr；JS listener 尚未掃描；Phase 2 多 batch rollout |
| Affiliate CTA top / bottom 集中 event governance | 🔴 **尚未實作** | `src/styles/components/_affiliate-box.scss` 已存在；`src/views/blogger/blogger-post-full.ejs` 兩個 conditional `<aside>` 已 render；但**provider / placement / campaign / link_url / link_label** 等 metadata 未從 frontmatter / settings 集中標 GA4 event；ad-affiliate schema proposal 屬 `20260522-day-1-readonly-a-report.md` §4 #2 候選 |
| hashtag 點擊治理 | 🟡 partial | hashtag 區塊兩端 render 已完成；但 click event 治理尚未集中 |
| relatedLinks / otherLinks click event 治理 | 🟡 partial | render 已完成；UTM 已實作（GitHub→Blogger 方向）；但 internal link / cross-site / external 三類 click event 區分尚未集中 |

### 2.1 Phase 5-d 既有 click tracking 基礎設施（既有；template 未對接）

⚠️ **重要補記**（per `20260522-pm-click-tracking-governance-reconcile-a`）：本治理 doc 首版（commit `aabc082`）落地時**未充分盤點既有基礎設施**；本批 reconcile 補上以下事實 + 對齊既有 attr 命名 convention（**不**動既有 src code）：

| 元件 | 路徑 | 狀態 |
|---|---|---|
| **trackEvent helper** | `src/js/modules/ga4-events.js` | ✅ 已存在；wrap `gtag('event', name, params)`；無 `gtag` 時 silent no-op |
| **Delegated click listener** | `src/js/modules/link-tracker.js` | ✅ 已存在；document-level `click` listener；掃 `[data-ga4-event]` + 讀 `data-ga4-param-<key>` attr → dispatch via `trackEvent` |
| **EJS attr helper partial** | `src/views/tracking/ga4-events-helper.ejs` | ✅ 已存在；輸出 `data-ga4-event="..."` + `data-ga4-param-<key>="..."` |
| **main.js 已 wire** | `src/js/main.js` line 14 `initLinkTracker()` | ✅ 已 wire；每頁載入即生效 |
| **實際 EJS click point template include helper** | — | ❌ **無**；helper 自述「本階段未在頁面模板實際 include；留給後續整合階段」|

🔑 **影響**：
- Phase 2 click tracking 框架**4 / 4 已就位**；缺的只是**在 click point EJS 加 1 行 `<%- include('../tracking/ga4-events-helper', {...}) %>`**
- 本治理 doc 之 §6 Data Attribute Convention 首版採扁平 `data-ga4-<key>` 命名；**與既有 listener / helper 採用之 `data-ga4-param-<key>` 不一致**；本批已 reconcile（per §6 attr 表已更新）

---

## 3. Tracking Layers

本文件之治理採**三層分離**：UTM layer / GA4 event layer / content metadata layer。三層**獨立但可組合**。

### 3.1 UTM Layer

**用途**：跨平台流量**來源**辨識；於 GA4 之 Acquisition / Traffic source 報表使用。

| Click source | utm_source | utm_medium | utm_campaign | utm_content |
|---|---|---|---|---|
| FB → Blogger | `facebook` | `social` | per post（如 `book_review` / `tech_note_<slug>`）| `fb_post_<YYYYMMDD>` |
| FB → GitHub | `facebook` | `social` | per post | `fb_post_<YYYYMMDD>` |
| Blogger → GitHub | `blogger` | `referral` | `portable_blog_system` | `related_links` \| `other_links` |
| GitHub → Blogger | `github_pages` | `referral` | `portable_blog_system` | `related_links` \| `other_links` |

⚠️ FB UTM 之具體 pattern 由 `content/settings/promotion.config.json` 之 `campaignPattern` / `contentPattern` 動態生成（per `docs/ga4-parameter-naming-registry.md` §3）。

### 3.2 GA4 Event Layer

**用途**：站內**互動**辨識；於 GA4 之 Events / Engagement 報表使用。

| Event name | 觸發時機 |
|---|---|
| `click_cross_site_link` | 使用者點擊 Blogger ↔ GitHub Pages 互連連結 |
| `click_related_link` | 使用者點擊 relatedLinks aside 內之連結 |
| `click_other_link` | 使用者點擊 otherLinks aside 內之連結 |
| `click_hashtag` | 使用者點擊文章底部 hashtag |
| `click_affiliate_cta` | 使用者點擊 affiliate-box CTA（top / bottom）|
| `click_fb_promotion_link` | 使用者點擊 FB promotion 內文連結（reserved；FB 平台外連時 GA4 未必能 fire）|

⚠️ Event name 採 `click_*` snake_case；對齊 GA4 recommended event naming convention。

### 3.3 Content Metadata Layer

**用途**：在 frontmatter / sidecar / settings JSON 中標記**內容屬性**，供 build 階段組裝 UTM / GA4 params。

| Metadata 維度 | 範例值 | 來源檔案 |
|---|---|---|
| campaign | `book_review_atomic_habits` / `portable_blog_system` | `content/settings/promotion.config.json` / frontmatter |
| post slug | `we-media-myself2` / `portable-blog-system-mvp` | `.md` frontmatter `slug` |
| platform | `blogger` / `github_pages` | `.md` frontmatter `site` / `primaryPlatform` |
| placement | `top` / `bottom` / `inline` / `sidebar` | frontmatter `affiliate.position.*` / future ad block schema |
| link_type | `internal` / `cross_site` / `external` / `affiliate` | frontmatter `relatedLinks[].kind` / 派生 |
| affiliate provider | `通路王` / `聯盟網` | `content/settings/affiliate-networks.json` `id` |

⚠️ Metadata layer 為 build 階段之**輸入**；UTM 與 GA4 event params 為**輸出**。實作時 build script 讀 metadata 派生 UTM / params。

---

## 4. Click Source Matrix

9 類 click source 集中表（含建議命名 + 當前狀態 + 實作 phase）：

| # | click source | description | utm_source | utm_medium | utm_campaign | utm_content | GA4 event | key GA4 params | current status | implementation phase |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | FB → Blogger | 使用者從 FB 粉絲頁貼文進入 Blogger 文章 | `facebook` | `social` | per post（如 `book_review`）| `fb_post_<YYYYMMDD>` | `page_view`（自動）| `source_platform`=`facebook` / `target_platform`=`blogger` / `post_slug` | ✅ UTM 已 by promotion.config.json | Phase 1 已完成 UTM；無 GA4 event 額外實作 |
| 2 | FB → GitHub | 使用者從 FB 粉絲頁貼文進入 GitHub Pages 文章 | `facebook` | `social` | per post | `fb_post_<YYYYMMDD>` | `page_view`（自動）| `source_platform`=`facebook` / `target_platform`=`github_pages` / `post_slug` | ✅ UTM 已 by promotion.config.json | 同上 |
| 3 | Blogger → GitHub | 使用者於 Blogger 文章內點擊指向 GitHub Pages 之連結 | `blogger` | `referral` | `portable_blog_system` | `related_links` \| `other_links` | `click_cross_site_link` | `source_platform`=`blogger` / `target_platform`=`github_pages` / `link_url` / `link_label` / `post_slug` | 🔴 UTM 未實作（CLAUDE.md §16.4 future）；event 未實作 | Phase 2-d（per §10 順序 6）|
| 4 | GitHub → Blogger | 使用者於 GitHub Pages 文章內點擊指向 Blogger 之連結 | `github_pages` | `referral` | `portable_blog_system` | `related_links` \| `other_links` | `click_cross_site_link` | `source_platform`=`github_pages` / `target_platform`=`blogger` / `link_url` / `link_label` / `post_slug` | ✅ UTM 已實作（ga4-url-builder.js）；event 未實作 | UTM Phase 1 ✅；event Phase 2-a |
| 5 | relatedLinks | 使用者點擊文章 `relatedLinks` aside 內連結（語意相關之延伸閱讀）| —（看 link_type）| —（看 link_type）| —（看 link_type）| `related_links`（若跨站；其餘 N/A）| `click_related_link` | `link_type` / `link_url` / `link_label` / `post_slug` / `outbound`（true if external）| 🟡 UTM partial（僅跨 Blogger 方向）；event 未實作 | Phase 2-b（per §10 順序 4）|
| 6 | otherLinks | 使用者點擊文章 `otherLinks` aside 內連結（補充外部資源）| —（看 link_type）| —（看 link_type）| —（看 link_type）| `other_links`（若跨站；其餘 N/A）| `click_other_link` | 同上 | 同上 | 同上 |
| 7 | hashtag | 使用者點擊文章底部 hashtag chip | N/A（站內導向）| N/A | N/A | N/A | `click_hashtag` | `tag_slug` / `tag_label` / `post_slug` / `platform` | 🔴 event 未實作 | Phase 2-c（per §10 順序 5）|
| 8 | affiliate CTA top | 使用者點擊文章上方 affiliate-box 之 CTA | N/A（聯盟網址不一定加 UTM）| N/A | N/A | N/A | `click_affiliate_cta` | `provider` / `placement`=`top` / `campaign` / `link_url` / `link_label` / `post_slug` / `outbound`=`true` | 🔴 event 未實作 | Phase 2-a（per §10 順序 3；最高優先）|
| 9 | affiliate CTA bottom | 使用者點擊文章下方 affiliate-box 之 CTA | N/A | N/A | N/A | N/A | `click_affiliate_cta` | `provider` / `placement`=`bottom` / `campaign` / `link_url` / `link_label` / `post_slug` / `outbound`=`true` | 🔴 event 未實作 | 同上 |

### 4.1 命名原則

#### utm_source — 使用平台來源

- `facebook`
- `blogger`
- `github_pages`

#### utm_medium — 使用流量型態

- `social`（社群平台貼文）
- `referral`（網頁互連；含 cross-site）
- `internal`（站內導引；目前不主動加 UTM）
- `affiliate`（聯盟導購；目前不主動加於聯盟 URL；per §7）

#### utm_campaign — snake_case；per 文章 / 活動

- `portable_blog_system`（cross-link 預設）
- `book_review_<slug>`
- `tech_note_<slug>`
- `reasons_for_travel` 等活動

#### utm_content — 區分位置 / 元件

- `fb_post_<YYYYMMDD>`（FB post）
- `related_links`（aside relatedLinks）
- `other_links`（aside otherLinks）
- `hashtag`
- `affiliate_top`
- `affiliate_bottom`

⚠️ 全部 utm_* 值採 **snake_case**；對齊 `docs/ga4-parameter-naming-registry.md` §2。

---

## 5. Recommended GA4 Event Names

6 個事件名（避免過度複雜）：

### 5.1 `click_cross_site_link`

- **When to fire**：使用者點擊 Blogger ↔ GitHub Pages 互連連結
- **Required params**：`source_platform`（`blogger` \| `github_pages`）/ `target_platform`（同上）/ `link_url` / `post_slug`
- **Optional params**：`link_label` / `link_type`（`related_links` \| `other_links`）
- **Example**：使用者於 GitHub 文章 `we-media-myself2` 點擊 relatedLinks 內指向 Blogger 之連結 → `click_cross_site_link` with `source_platform=github_pages, target_platform=blogger, link_type=related_links, post_slug=we-media-myself2`

### 5.2 `click_related_link`

- **When to fire**：使用者點擊文章 `relatedLinks` aside 內任一連結（不限是否跨站）
- **Required params**：`link_url` / `link_type`（`internal` \| `cross_site` \| `external`）/ `post_slug`
- **Optional params**：`link_label` / `platform`（當前頁面所在平台）/ `outbound`（boolean）
- **Example**：使用者於 Blogger 文章點擊 relatedLinks 內 YouTube 連結 → `click_related_link` with `link_type=external, link_url=https://youtube.com/..., outbound=true`

### 5.3 `click_other_link`

- **When to fire**：使用者點擊 `otherLinks` aside 內連結
- **Required params**：同 §5.2
- **Optional params**：同 §5.2
- **Example**：使用者於 GitHub 文章點擊 otherLinks 內台北市立圖書館連結 → `click_other_link` with `link_type=external, outbound=true`

### 5.4 `click_hashtag`

- **When to fire**：使用者點擊文章底部 hashtag chip
- **Required params**：`tag_slug` / `post_slug`
- **Optional params**：`tag_label`（顯示文字）/ `platform`
- **Example**：使用者於 Blogger 文章點擊 `#自媒體` hashtag → `click_hashtag` with `tag_slug=self-media, post_slug=we-media-myself2`

### 5.5 `click_affiliate_cta`

- **When to fire**：使用者點擊 affiliate-box CTA 連結（不論 top / bottom）；對應 §7 詳細規格
- **Required params**：`provider` / `placement`（`top` \| `bottom`）/ `link_url` / `post_slug` / `outbound=true`
- **Optional params**：`campaign` / `link_label` / `network_id`（per affiliate-networks.json `id`）
- **Example**：使用者於書評文章點擊上方「博客來」連結（通路王）→ `click_affiliate_cta` with `provider=通路王, placement=top, outbound=true`

### 5.6 `click_fb_promotion_link`（reserved）

- **When to fire**：使用者於 FB 貼文外連時觸發（**FB 平台限制**：FB feed 內點擊離站 GA4 通常無法 fire；屬 reserved 命名）
- **Required params**：`source_platform=facebook` / `target_platform` / `post_slug`
- **Optional params**：`campaign`
- **Example**：reserved；當前實際追蹤靠 UTM layer + GA4 `page_view` 自動 attribute

### 5.7 建議 GA4 params 字典

| param | 用途 | 範例值 |
|---|---|---|
| `platform` | 當前頁面所在平台 | `blogger` / `github_pages` |
| `source_platform` | 流量來源平台（cross-site）| `blogger` / `github_pages` / `facebook` |
| `target_platform` | 跨站目標平台 | 同上 |
| `post_slug` | 當前文章 slug | `we-media-myself2` |
| `post_title` | 當前文章標題 | （optional）|
| `link_type` | 連結類型 | `internal` / `cross_site` / `external` / `affiliate` |
| `link_label` | 連結顯示文字 | `去博客來` |
| `link_url` | 連結 URL（已含 UTM 之版本）| `https://...` |
| `placement` | 區塊位置 | `top` / `bottom` / `inline` / `sidebar` |
| `provider` | 聯盟 / ad provider | `通路王` / `聯盟網` |
| `campaign` | 活動 / 文章 campaign | `book_review_<slug>` |
| `content_group` | 文章類型（content grouping）| `tech-note` / `book-review` |
| `outbound` | 是否離站 | `true` / `false` |

---

## 6. Data Attribute Convention（對齊既有 helper / listener；未來 template 對接時直接採用）

EJS template 與 JS listener 之 contract，**對齊既有 `link-tracker.js` + `ga4-events-helper.ejs`（per §2.1）之命名**：

| Attribute | 用途 |
|---|---|
| `data-ga4-event` | event name（如 `click_affiliate_cta`）；**listener 識別 anchor**；不含 `param-` 前綴 |
| `data-ga4-param-platform` | 當前平台（`blogger` / `github_pages`）|
| `data-ga4-param-source_platform` | cross-site source（snake_case；非 kebab）|
| `data-ga4-param-target_platform` | cross-site target |
| `data-ga4-param-post_slug` | post slug |
| `data-ga4-param-post_title` | post title |
| `data-ga4-param-link_type` | `internal` / `cross_site` / `external` / `affiliate` |
| `data-ga4-param-link_label` | 顯示文字 |
| `data-ga4-param-link_url` | URL（與 `href` 可能含 UTM 之版本一致）|
| `data-ga4-param-placement` | `top` / `bottom` / `inline` / `sidebar` |
| `data-ga4-param-provider` | affiliate / ad provider |
| `data-ga4-param-campaign` | campaign |
| `data-ga4-param-content_group` | content group |
| `data-ga4-param-outbound` | `true` / `false`（字串形式；helper 不轉型）|

⚠️ **命名變更紀錄**：本治理 doc 首版（commit `aabc082`）採扁平 `data-ga4-<key>`（如 `data-ga4-platform` / `data-ga4-source-platform`）；本批 reconcile 對齊既有 helper / listener 採用之 `data-ga4-param-<key>` 前綴 + snake_case key（如 `data-ga4-param-platform` / `data-ga4-param-source_platform`）。**`data-ga4-event` 不變**（仍為扁平；listener anchor）。

### 6.1 設計原則

- **EJS template 未來只負責輸出 data-ga4-* attributes**；不寫 inline JS
- **JS listener 未來統一掃描 `[data-ga4-event]`**（document-level delegated listener；於 click 事件讀其餘 `data-ga4-*` 組裝 `gtag('event', ...)`）
- **單一 listener 涵蓋全站**；新增 click source 只需於 template 加 attr，不需碰 JS
- **degraded path**：GA4 未 enable 時（dev mode / `enabled=false` / `measurementId` 空）listener 為 no-op；不污染 console

### 6.2 本批邊界

- ❌ 本批不改任何 EJS template
- ❌ 本批不新增任何 JS listener
- ❌ 本批不改 GA4 config

Phase 2 rollout 時，第一個落地 phase 應為**將既有 `ga4-events-helper.ejs` partial include 至首個 click point**（per §2.1：listener / helper / wiring 4/4 已就位；無需重建框架）。

### 6.3 命名規則（per `link-tracker.js` + `ga4-events-helper.ejs`）

- **`data-ga4-event`**：放**事件名稱**（如 `click_affiliate_cta`）；listener 用此 attr 識別 click target
- **`data-ga4-param-<key>`**：放**事件參數**；listener 將 `<key>` 之 attr 值轉為 GA4 event params
- **param key 建議使用 `snake_case`**（如 `source_platform` / `post_slug` / `link_type`）；對齊 `docs/ga4-parameter-naming-registry.md` snake_case convention + GA4 recommended param naming
- **既有 helper 之 key 驗證**（per `src/views/tracking/ga4-events-helper.ejs:6`）：
  ```js
  /^[a-zA-Z0-9_-]+$/.test(k)
  ```
  → 含 `.` / `:` / 空白等之 key 會被 helper **silent drop**；不會輸出 attr
- **不要使用 dot notation**：如 `tracking.ga4Event` **不應**直接變成 `data-ga4-param-tracking.ga4Event`（含 `.` 會被 helper 過濾）；應拆為 `event=tracking_ga4_event` 或重新對齊 key naming

### 6.4 EJS include 範例（首注入時參考）

於 click point 之 `<a>` 開始 tag 內 include helper partial：

```ejs
<a class="lab-affiliate-box__link"
   href="<%= link.url %>"
   rel="sponsored nofollow noopener noreferrer"
   target="_blank"
   <%- include('../tracking/ga4-events-helper', {
     event: 'click_affiliate_cta',
     params: {
       provider,
       placement: 'article_top',
       post_slug: post.slug,
       link_label: link.label,
       outbound: 'true'
     }
   }) %>>
  <%= link.label %>
</a>
```

⚠️ 注意：
- include path 為相對路徑；`src/views/blogger/blogger-post-full.ejs` 與 `src/views/pages/post-detail.ejs` 兩端皆採 `'../tracking/ga4-events-helper'`
- `params` 物件之 key 須 snake_case 且符合 §6.3 之 regex
- value 為 string 即可；listener `trackEvent` 直接傳給 `gtag('event', ...)`
- `outbound` 採 string `'true'`（非 boolean `true`）；對齊既有 helper 之字串輸出 convention

### 6.5 Helper key validation 一致性

由於 `ga4-events-helper.ejs` 之 regex 為 `/^[a-zA-Z0-9_-]+$/`：
- ✅ `post_slug` / `link_type` / `source_platform` 合法
- ✅ `placement` / `provider` / `campaign` 合法
- ❌ `tracking.ga4Event`（含 `.`）非法 → silent drop
- ❌ `params:key`（含 `:`）非法 → silent drop
- ❌ `param key`（含空白）非法 → silent drop

設計範例 params 時，請事先確認 key 通過此 regex；否則 listener 無法接收。

---

## 7. Affiliate CTA Tracking

聯盟區塊（affiliate-box）為高敏感追蹤點；以下為**集中規格**。

### 7.1 維度

| 維度 | 來源 |
|---|---|
| **provider** | `content/settings/affiliate-networks.json` 之 `id`（如 `books` = 通路王 / `affiliate-network` = 聯盟網；future provider 可擴充）|
| **placement** | `top` / `bottom` / `inline` / `sidebar`（per frontmatter `affiliate.position.*`）|
| **campaign** | per 文章；可派生自 frontmatter `slug` 或 `book.title` |
| **link_url** | 實際導購連結（per frontmatter `affiliate.links[].url`）|
| **link_label** | 顯示文案（per frontmatter `affiliate.links[].label`，如「博客來」）|
| **post_slug** | 文章 slug |

### 7.2 建議 GA4 event

```
event: click_affiliate_cta
required params:
  - provider
  - placement      ('top' | 'bottom')
  - link_url
  - post_slug
  - outbound       ('true')
optional params:
  - campaign
  - link_label
  - network_id     (per affiliate-networks.json `id`)
```

### 7.3 ⚠️ 聯盟網址 UTM 政策

**核心原則**：**不主動將 GA4 UTM 加到聯盟導購連結上**。

理由：

1. **通路王 / 聯盟網等不一定吃我方 GA4 參數**；額外 query string 可能被聯盟平台 strip / 影響歸因
2. **避免污染導購 URL**；某些聯盟平台對 URL 內額外參數會視為非標準入口而拒絕計入分潤
3. **我方追蹤靠站內 GA4 event 記錄「點出前」之點擊**；不需要對導購 URL 動手腳
4. **若聯盟平台未來支援子帳號 / sub_id**，可採各平台自定義機制（如 `epc` / `sub_id` / `aff_sub`）；屬聯盟平台特性，不混入 GA4 utm

### 7.4 站內 + 聯盟分軌

- **站內 GA4 event**（`click_affiliate_cta`）：永遠 fire；含 provider / placement / link_url / outbound=true
- **聯盟 URL 本身**：**不加 utm_***；保留 author 提供之原始導購 URL（含聯盟自己之 affiliate ID / tracking code）
- **後續歸因**：GA4 端可看 `click_affiliate_cta` 之 placement 維度（top / bottom）+ provider；聯盟平台後台可看分潤紀錄；兩端**不**互相強迫對齊

### 7.5 link rel / target

per `CLAUDE.md` §16.2：

```html
target="_blank" rel="sponsored nofollow noopener noreferrer"
```

由 `affiliate-networks.json` 之 `rel` 欄位提供（既有；通路王 / 聯盟網皆已標）。

### 7.6 與 §3.1 UTM Layer 之關係

- §3.1 之 UTM 規格**不適用於聯盟導購 URL**
- 聯盟區塊純走 GA4 event layer（§5.5）
- 不要把聯盟 CTA 點擊**併到 §5.1 `click_cross_site_link`**；兩者語意不同（cross-site 為自家平台互連；affiliate 為導購）

---

## 8. Related Links / Other Links / Hashtag Tracking

### 8.1 語意分工

| 區塊 | 語意 | 建議 event |
|---|---|---|
| `relatedLinks` | 文章**語意相關**之延伸閱讀（如 YouTube 同主題 / 同作者其他文章 / 同系列）| `click_related_link` |
| `otherLinks` | **補充外部資源**（如圖書館借閱頁 / 官方資料）| `click_other_link` |
| hashtag | **分類探索**（同 tag 文章探索）| `click_hashtag` |

### 8.2 outbound / cross_site / internal 判斷

| 情境 | `link_type` | `outbound` | `cross_site` |
|---|---|---|---|
| 連同站內部頁面 | `internal` | `false` | `false` |
| 連 Blogger ↔ GitHub Pages（自家另一平台）| `cross_site` | `false`（per 本治理視為自家流量 retained）| `true` |
| 連外部網站（YouTube / 圖書館 / 其他）| `external` | `true` | `false` |
| 連聯盟導購連結 | `affiliate` | `true` | `false` |

⚠️ `cross_site` 視同自家流量；GA4 reporting 時可選擇是否計入 outbound（建議**不**計入，因為仍在自家內容生態圈）。

### 8.3 與 cross-site UTM 之組合

當 `link_type=cross_site` 時：

- URL 端：build pipeline 注入 UTM（per §3.1 / §4 row 3 + 4）
- Event 端：fire `click_related_link` 或 `click_other_link`（with `link_type=cross_site` + 對應 `link_url`）
- **可選**：同步 fire `click_cross_site_link`（per §5.1）—— 為避免雙計，建議**擇一**；推薦只 fire `click_related_link` / `click_other_link`，並用 `link_type` 區分 cross_site

### 8.4 hashtag 特性

- hashtag 永遠站內導向（連到 `/tags/{slug}/`）→ `outbound=false`
- 不需要 UTM
- 純 GA4 event；tracking 維度為 `tag_slug` + `post_slug`

---

## 9. Implementation Boundary

### 9.1 本批 phase 不做

| 項目 | 理由 |
|---|---|
| 改 EJS template | 屬 Phase 2 rollout；需先決 listener 框架 |
| 改 JS listener | 同上 |
| 改 GA4 config | 9 個既有 event 名為 CLAUDE.md §5 規範；本治理建議擴展但**不**動 config |
| 改 Blogger / GitHub build script | 屬 Phase 2 |
| 改 content schema | ad-affiliate schema 屬另一 proposal（per `docs/20260522-day-1-readonly-a-report.md` §4 #2）|
| 改 affiliate-networks.json | 同上 |
| 跑 build / validate | 本批純 docs |
| deploy / push | 本批僅 source commit；push 屬獨立 phase |

### 9.2 與 CLAUDE.md §5 既有 event 清單對齊

CLAUDE.md §5 列出 9 個預定義 event：

```
page_view
internal_link_click
tag_click
category_click
affiliate_click
download_click
social_click
blogger_to_github_click
github_to_blogger_click
```

本治理建議之 event name（per §5）為「補完命名」：

| CLAUDE.md §5 既有 | 本治理建議命名 | 對應關係 |
|---|---|---|
| `page_view` | （沿用）| 自動 fire；不重複規範 |
| `tag_click` | `click_hashtag` | 同義；建議統一採 `click_hashtag`（與 affiliate / related / other 對齊 `click_*` 前綴）|
| `affiliate_click` | `click_affiliate_cta` | 同義；建議統一採 `click_affiliate_cta`（加 `_cta` 區別未來可能之 `affiliate_view` / `affiliate_impression`）|
| `blogger_to_github_click` | `click_cross_site_link` with `source_platform=blogger` | 收斂為單一 event + 區分 params；GA4 後台可 filter；避免 event 數爆炸 |
| `github_to_blogger_click` | `click_cross_site_link` with `source_platform=github_pages` | 同上 |
| `internal_link_click` | （沿用）| 站內一般連結；不在本治理 9 類 click source |
| `category_click` | （沿用）| 不在本治理；屬 navigation；可保留 |
| `download_click` | （沿用）| 不在本治理；屬下載 event |
| `social_click` | （沿用）| 不在本治理；屬 social follow 連結 |

⚠️ 實際 Phase 2 rollout 時須**user 表態**是否：
- (a) 採本治理之 `click_*` 統一命名 → 需更新 CLAUDE.md §5 + ga4.config.json events
- (b) 維持 CLAUDE.md §5 既有命名 → 本治理之 `click_*` 為 alias / 不採用

本文件**不**強制 (a) 或 (b)；屬未來 governance decision。

### 9.3 Phase 2 Rollout 考量：GitHub vs Blogger listener 不對稱

本批 reconcile 補記：

- ✅ **本批只修 governance doc**；對齊 §2.1 之既有 helper / listener attr 命名 convention
- ❌ **不**代表已在 affiliate CTA / relatedLinks / otherLinks / hashtag 之 EJS template 實作 click tracking attr
- ✅ **GitHub 端**：因 `src/js/main.js` 已 `import` 並呼叫 `initLinkTracker()`（per §2.1）；未來只要於 GitHub 端 EJS template（如 `src/views/pages/post-detail.ejs`）掛上 `data-ga4-event` + `data-ga4-param-*` attr → **listener 立即生效**；不需新增 src code
- ❌ **Blogger 端**：因 Blogger 後台貼上之 post HTML（`dist-blogger/posts/{slug}/post.html`）**不含 Vite `main.js` bundle**；attr 即使輸出，listener 也不會載入 → **無法 fire GA4 event**
- ⚠️ **Blogger 端 listener 策略 deferred**：需獨立 phase 評估解法（candidate options：A 將 listener inline 至 blogger-post-full.ejs `<script>` / B 由 user 於 Blogger 主題級別貼一次性 listener 程式 / C Blogger 端不做 click event，只靠 UTM + 自動 page_view 歸因）；屬 Phase 2 之 future decision

---

## 10. Recommended Phase 2 Rollout

建議實作順序（**非承諾；屬 proposal**）：

| 順序 | Phase 名 | 範圍 | 阻擋條件 |
|---|---|---|---|
| 1 | **listener 框架就位**（Phase 2-a-listener）| 新增 `src/js/modules/ga4-click-listener.js`；document-level delegated listener；掃描 `[data-ga4-event]`；組裝 `gtag('event', name, params)`；無對接 template | GA4 已 live ✅；listener 為 no-op fallback（GA4 未 enable 時不污染 console）|
| 2 | **`click_affiliate_cta` 對接**（Phase 2-a-affiliate）| affiliate-box template 注入 `data-ga4-*` attr；含 provider / placement / link_url / post_slug | 順序 1 完成 |
| 3 | **`click_related_link` / `click_other_link` 對接**（Phase 2-b-related-other）| relatedLinks / otherLinks aside template 注入 attr；含 link_type / link_url / post_slug | 順序 1 完成；建議與順序 2 拆批 |
| 4 | **`click_hashtag` 對接**（Phase 2-c-hashtag）| hashtag chip template 注入 attr | 順序 1 完成 |
| 5 | **Blogger → GitHub 反向 UTM 實作**（Phase 2-d-blogger-to-github-utm）| Blogger build pipeline 對 GitHub 連結之 UTM injection（per `CLAUDE.md` §16.4 future spec）| 獨立於 GA4 event；可與順序 1-4 並行 |
| 6 | **GA4 DebugView / Realtime 驗收 SOP**（Phase 2-e-verify）| docs；含 GA4 DebugView 啟用 / Realtime 觀察 step；含每 click source 之驗收項 | 順序 1-5 完成；屬最終 sign-off |

⚠️ 每順序皆**獨立 commit**；不混入跨類變動；不為趕進度合併。

---

## 11. Acceptance Criteria（本文件完成條件）

| # | 條件 | 滿足 |
|---|---|---|
| 1 | 至少涵蓋 9 類 click source | ✅ §4 表列 9 類（含 affiliate CTA top + bottom 拆開計）|
| 2 | 明確區分 UTM layer / GA4 event layer / metadata layer | ✅ §3 三層獨立章節 |
| 3 | 明確定義 affiliate CTA top / bottom | ✅ §7 + §4 #8 #9 拆 placement |
| 4 | 明確說明聯盟網址不一定加 UTM | ✅ §7.3「不主動將 GA4 UTM 加到聯盟導購連結上」|
| 5 | 明確說明可用 GA4 event 記錄「點出前」之點擊 | ✅ §7.3 #3 + §7.4「站內 GA4 event：永遠 fire；含 provider / placement / link_url / outbound=true」|
| 6 | 明確列出本批不實作，只做 docs-only proposal | ✅ §1.3 + §6.2 + §9.1 |
| 7 | 明確列出 Phase 2 rollout 順序 | ✅ §10 6 順序 |
| 8 | 與既有 CLAUDE.md §5 event 清單對齊 | ✅ §9.2 對照表 + 標明 governance decision deferred |

---

## 12. Cross-links

- `CLAUDE.md` §5（既有 9 個 GA4 event 清單）/ §16（連結處理規則；含 §16.4 cross-link UTM）
- `docs/ga4-parameter-naming-registry.md`（既有 GA4 / UTM naming registry；本文件之 base）
- `docs/seo-ga4-adsense.md` §5（GA4 整體報告）
- `docs/related-links-schema.md` §9（relatedLinks GA4 attribution）
- `docs/content-platform-routing.md`（platform routing 規範）
- `docs/20260522-day-1-readonly-a-report.md` §2 模組 3c + 模組 4（識別此 governance gap）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選 roadmap；本治理屬 §3.5 GA4 event attr rollout 之前置）
- `src/scripts/ga4-url-builder.js`（既有 cross-link UTM 實作；本治理對齊其 convention）
- `content/settings/ga4.config.json`（既有 9 個 event 清單）
- `content/settings/promotion.config.json`（FB UTM 來源）
- `content/settings/affiliate-networks.json`（聯盟 provider id 來源）

---

（本文件結束）
