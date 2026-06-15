# GA4 站內點擊行為統整 — Taxonomy Preanalysis

- **Phase**：`20260615-am-1-blogger-ga4-internal-click-taxonomy-preanalysis-docs-only-a`
- **日期**：2026-06-15
- **性質**：**docs-only**（preanalysis；不改任何 source / template / settings / content / build / deploy）
- **baseline**：`main` HEAD == origin/main == `0851076`（`docs(blogger): draft steady-rhythm life note`）；working tree clean
- **目標**：把「站內點擊行為 GA4 統整」整理成下一階段可直接實作的規格——事件分類、參數命名、EJS 放置位置、AdSense / 聯盟 / 上下篇導覽追蹤邊界。

> ⚠️ 本文件**不取代**既有 GA4 規格文件，而是**統整 + 補規格缺口**。既有權威文件：
> - `docs/ga4-link-tracking-spec.md`（living spec；event / UTM / placement enum / 驗收 SOP）
> - `docs/ga4-parameter-naming-registry.md`（命名 registry；single source of truth）
> - `docs/click-tracking-governance.md`（implementation contract）
> - `docs/blogger-listener-strategy.md`（Blogger 端 listener 決議）
> - `docs/seo-ga4-adsense.md`（既有 9 events）
> 本文件與其重疊處採 cross-reference，不重寫。

---

## 1. Current state audit（現況盤點）

### 1.1 既有 tracking pipeline（已就位）

| 元件 | 路徑 | 狀態 | 說明 |
|---|---|---|---|
| GA4 loader | `src/views/tracking/ga4.ejs` | ✅ live | gtag.js；4-AND gating（enabled + measurementId + isProdBuild）|
| measurementId | `content/settings/ga4.config.json` | ✅ `G-C77SMPF8VD` | Blogger + GitHub Pages 共用單一 ID |
| event helper | `src/js/modules/ga4-events.js` | ✅ live | `trackEvent(name, params)`；無 `window.gtag` 時 silent no-op |
| delegated listener | `src/js/modules/link-tracker.js` | ✅ live（GitHub only）| document-level click；掃 `[data-ga4-event]` + 讀 `data-ga4-param-*` → `trackEvent` |
| EJS attr helper | `src/views/tracking/ga4-events-helper.ejs` | 🟡 保留未用 | 因 async include 議題改採 inline attrs（per spec §4.2.1）|
| main.js wiring | `src/js/main.js` | ✅ live | `initLinkTracker()` 每頁載入即生效 |

**資料屬性 convention（已固化）**：
```
data-ga4-event="<event_name>"
data-ga4-param-<key>="<value>"     # snake_case key；value 一律 string；boolean→'true'/'false'
```
listener 讀 `data-ga4-event` 為 event name，剝除 `data-ga4-param-` prefix 後之 key 為 param key。

### 1.2 可點擊區塊 × GA 覆蓋 × surface 矩陣

| # | 可點擊區塊 | GitHub Pages（has Vite listener）| Blogger（no listener）| 模板 / 位置 | 目前 GA 狀態 |
|---|---|---|---|---|---|
| 1 | header brand / logo | ✅ surface | ❌ inert | `src/views/layout/header.ejs` | 🔴 無 GA |
| 2 | top nav 連結 | ✅ surface | ❌ inert | `src/views/layout/nav.ejs`（via header）| 🔴 無 GA |
| 3 | mobile drawer 連結 | ✅ surface | N/A | `src/views/layout/mobile-drawer.ejs` | 🔴 無 GA |
| 4 | breadcrumb 連結 | ✅ surface | ❌ inert | `src/views/layout/breadcrumb.ejs` | 🔴 無 GA |
| 5 | 文章卡片（首頁/列表/分類/標籤）| ✅ surface | N/A（GitHub-only 頁）| `home.ejs` / `post-list.ejs` / `category.ejs` / `tag.ejs`（`.lab-post-card__link`）| 🔴 無 GA |
| 6 | 列表分頁 / more | ✅ surface | N/A | （目前無分頁元件；list 為全量）| 🔴 不存在 |
| 7 | hashtag chip | ✅ surface（但目前為 `<span>` 不可點）| ❌ inert | `post-detail.ejs` L300-305（display-only `<span>`）| 🔴 無 GA（前置 span→a 未做）|
| 8 | related links（aside）| ✅ **已落地** `click_related_link` | ❌ inert | `post-detail.ejs` L237 | 🟢 GitHub 有 GA |
| 9 | other links（aside）| ✅ **已落地** `click_other_link` | ❌ inert | `post-detail.ejs` L279 | 🟢 GitHub 有 GA |
| 10 | affiliate CTA top | ✅ **已落地** `click_affiliate_cta` placement=`article_top` | ❌ inert | `post-detail.ejs` L93 | 🟢 GitHub 有 GA |
| 11 | affiliate CTA bottom | ✅ **已落地** `click_affiliate_cta` placement=`article_bottom` | ❌ inert | `post-detail.ejs` L194 | 🟢 GitHub 有 GA |
| 12 | 文章內 inline 外連 | ✅ surface | ❌ inert | markdown render 區 | 🔴 無 GA |
| 13 | 上一篇 / 下一篇 / 回首頁 導覽 | ✅ surface | ❌ inert | **元件 SCSS `_prev-next.scss` 存在，但 post-detail.ejs 未 render** | 🔴 **區塊不存在**（見 §3）|
| 14 | social follow / share | ✅ surface | ❌ inert | `_social-follow.scss` 存在；pages 未見 render | 🔴 無 GA |
| 15 | download box CTA | ✅ surface | ❌ inert | download box 區 | 🔴 無 GA |
| 16 | back-to-top button | ✅ surface | N/A | `src/js/modules/back-to-top.js` | 🔴 無 GA |
| 17 | footer | ✅ surface | ❌ inert | `src/views/layout/footer.ejs`（目前僅版權字，**無 nav 連結**）| 🔴 無連結可追 |
| 18 | AdSense 廣告點擊 | ⛔ **不可追蹤**（政策）| ⛔ 不可追蹤 | `adsense-*` partial（14 anchor）| ⛔ 邊界外（見 §4）|

### 1.3 shared template / partial vs surface-specific

| 類型 | 檔案 | 跨 surface |
|---|---|---|
| **GitHub-only 模板** | `pages/*.ejs`（home / post-list / post-detail / category / tag / about / 404 / search）| GitHub Pages only |
| **Blogger-only 模板** | `blogger/*.ejs`（blogger-post-full / summary / redirect-card / home-index / category-index）| Blogger only |
| **shared layout partial** | `layout/*.ejs`（header / nav / footer / breadcrumb / mobile-drawer / sidebar / head）| **僅 GitHub build 引用**；Blogger export 不引用 layout partial（Blogger 為 `<div class="lab-blogger-article">` fragment）|
| **shared ads partial** | `ads/adsense-anchor.ejs` → `adsense-article-block.ejs` → `adsense-slot.ejs` | GitHub（post-detail）+ Blogger（blogger-post-full）皆引用 |
| **shared tracking partial** | `tracking/ga4.ejs` / `ga4-events-helper.ejs` | helper 保留未用；ga4.ejs GitHub head 引用 |

⚠️ **關鍵不對稱**：layout partial（header/nav/footer 等）**不**進入 Blogger 輸出；Blogger 文章 HTML 為 standalone fragment，靠 Blogger 主題提供 header/nav/footer。因此 §1.2 之 header/nav/footer/breadcrumb/card 之「Blogger surface」一律標 ❌ inert / N/A——這些區塊在 Blogger 端由**主題**渲染，非本系統可注入 attr 之範圍。

### 1.4 既有 event 命名之**雙家族 drift**（重要）

目前 repo 內並存兩套 event 命名，**reader 必須知道**：

| 家族 | 形態 | 來源 | 是否實際 fire |
|---|---|---|---|
| **A. config-level（verb-last `*_click`）** | `internal_link_click` / `tag_click` / `category_click` / `affiliate_click` / `download_click` / `social_click` / `blogger_to_github_click` / `github_to_blogger_click` | `content/settings/ga4.config.json` `events[]` + `docs/seo-ga4-adsense.md` | ❌ **皆未 wire**（config 為宣告清單；無對應 `data-ga4-event` attr）|
| **B. landed source（verb-first `click_*`）** | `click_affiliate_cta` / `click_related_link` / `click_other_link`（+ reserved `click_hashtag` / `click_cross_site_link` / `click_external_link`）| `src/views/pages/post-detail.ejs` inline attrs | ✅ **實際 fire**（GitHub 端）|

→ config 之 9 events 與實際 source 落地之 click event **不一致**；此為已知 deferred governance decision（per `ga4-link-tracking-spec.md` §9 Q6 / `click-tracking-governance.md` §9.2）。**本 taxonomy 必須選一條主線並標明 backward-compat**（見 §5）。

---

## 2. GA4 event taxonomy proposal（事件分類提案）

> 下表為**提案**；採 backward-compatible 原則：**既有已落地之 family B（`click_*`）不改名**，新點擊點沿用同 family，避免 churn（per `feedback_conservative_landing`）。每列附「使用者提案名」對照欄，供 §8 決策。

| event_name（提案，family B）| 使用者提案名（對照）| surface | click_area | action | required params | optional params | example trigger | implementation location | risk / notes |
|---|---|---|---|---|---|---|---|---|
| `click_internal_nav`（新）| `site_internal_click` | GH | header / nav / drawer / breadcrumb / logo | navigate internal | `link_type=internal`, `link_label`, `link_url`, `placement` | `nav_group` | 點 top nav「技術筆記」| `layout/header.ejs` / `nav.ejs` / `mobile-drawer.ejs` / `breadcrumb.ejs` | layout partial GitHub-only；Blogger 由主題渲染不可追 |
| `click_post_card`（新）| `site_internal_click` | GH | card_list | navigate to post | `link_type=internal`, `post_slug`(目標), `placement=card_list`, `link_label` | `source_page`(home/category/tag) | 首頁卡片「閱讀文章」| `home.ejs` / `post-list.ejs` / `category.ejs` / `tag.ejs` | 卡片整塊 vs `__link` 擇一綁定；避免重複 fire |
| `click_hashtag`（reserved→啟用）| `tag_click` | GH（+Blogger 視 listener）| hashtag_list | navigate to tag page | `link_type=internal`, `post_slug`, `tag_slug`, `tag_label`, `placement=hashtag_list` | — | 點文章底部 `#self-growth` | `post-detail.ejs` hashtag 區 | **前置**：span→a 改造（per `hashtag-slug-decision.md`）|
| `click_related_link` ✅ | `related_post_click` | GH | related_links | navigate related | `link_type`, `post_slug`, `link_label`, `link_url`, `outbound`, `placement=related_links` | `link_source_key` | 點 relatedLinks aside | `post-detail.ejs` L237 | **已落地**；勿改名 |
| `click_other_link` ✅ | `related_post_click` | GH | other_links | navigate other resource | 同上 placement=`other_links` | `link_source_key` | 點 otherLinks aside | `post-detail.ejs` L279 | **已落地**；勿改名 |
| `click_affiliate_cta` ✅ | `commerce_link_click` | GH | article_top / article_bottom | outbound commerce | `link_type=affiliate`, `post_slug`, `provider`, `placement`, `link_label`, `link_url`, `outbound=true` | `commerce_link_id`(future) | 點聯盟 CTA | `post-detail.ejs` L93/L194 | **已落地**；prov 來自 `link.network`；不對 affiliate URL 加 UTM（P5）|
| `click_external_link`（reserved→啟用）| `outbound_link_click` | GH | article_body | outbound external | `link_type=external`, `post_slug`, `link_url`, `destination_domain`, `outbound=true`, `placement=article_body` | `link_label` | 點文章內外部引用連結 | markdown render 區 | 需 render-time 包 anchor；中型 |
| `click_article_nav`（新）| `article_bottom_nav_click` / `article_adjacent_click` | GH | article_bottom_nav | navigate prev/next/home | `link_type=internal`, `post_slug`(當前), `nav_direction`(prev/next/home), `placement=article_bottom_nav` | `target_slug`, `target_url`, `link_label` | 點文章底部「下一篇」| **新 partial**（見 §3）| **核心新增**；`nav_direction` 區分 prev/next/home |
| `click_social`（新）| `social_click` | GH | social_follow / social_share | social out | `link_type=external`, `social_platform`, `placement`, `link_url`, `outbound=true` | `post_slug` | 點 FB 追蹤鈕 | social-follow 區（待 render）| 元件存在 SCSS；render 未落地 |
| `click_download`（新）| `download_click` | GH | download_box | download asset | `link_type`, `post_slug`, `link_url`, `placement=download_box`, `outbound` | `file_type` | 點教具下載鈕 | download box 區 | download 線多 dormant；低優先 |
| `click_back_to_top`（新）| —（互動非導覽）| GH | back_to_top | scroll to top | `placement=back_to_top`, `post_slug` | — | 點 back-to-top | `back-to-top.js`（程式 fire，非 attr）| 非 anchor；由 JS 直接 `trackEvent`；可選 |
| `page_view` ✅ | `page_view` | GH+Blogger | — | auto | （GA4 reserved）| — | 任一頁載入 | gtag 自動 | 不需自送 |

**param union schema**（取自 `ga4-link-tracking-spec.md` §4.3，本表 required/optional 為其子集）：
`link_type` / `placement` / `link_label` / `link_url` / `destination_domain` / `post_slug` / `target_slug` / `nav_direction` / `outbound` / `provider` / `tag_slug` / `tag_label` / `social_platform` / `link_source_key` / `platform_context`。

**placement enum**（對齊 spec §11 + 本 phase 新增）：
`article_top` / `article_body` / `article_bottom` / `article_bottom_nav`（**新**）/ `related_links` / `other_links` / `hashtag_list` / `card_list` / `download_box`（**新**）/ `social_follow`（**新**）/ `back_to_top`（**新**）/ `header_nav`（**新**）/ `breadcrumb`（**新**）/ `homepage` / `post_detail`。全 snake_case；符合 `/^[a-zA-Z0-9_-]+$/`。

---

## 3. 文章底部 EJS 導覽規格（核心新增）

### 3.1 設計原則

1. **獨立 EJS 區塊**：上一篇 / 下一篇 / 回首頁 之導覽 **不**寫進文章正文 markdown / html，由獨立 partial 在文章正文之後渲染。
2. **元件現況**：`src/styles/components/_prev-next.scss` 之 `.lab-prev-next` BEM 已存在（prev/next 兩格 + label + title + hover/focus），但 **`post-detail.ejs` 目前未 render** 任何 `lab-prev-next`——即「**有樣式、無區塊**」。本 phase 確認此為待補缺口。
3. **GA4 可分辨來源**：使用者從 previous post / next post / home link / article bottom block 點出去，須能在 GA4 後台分辨。靠 `nav_direction` param + `placement=article_bottom_nav` 區分，**不**只看 `target_url`。

### 3.2 建議 partial 結構（提案；本 phase 不實作）

新檔（提案）：`src/views/partials/article-bottom-nav.ejs`（或沿用 `_prev-next.scss` 之 BEM 放 `partials/`），由 `post-detail.ejs` 在 hashtag 區之後、footer 之前 include。

```ejs
<%# 提案結構；prevPost / nextPost 由 build-github.js 依列表順序預先 derive 後傳入 %>
<nav class="lab-prev-next" aria-label="文章導覽">
  <% if (prevPost) { %>
  <a class="lab-prev-next__prev" href="<%= basePath %>/posts/<%= prevPost.slug %>/"
     data-ga-event="click_article_nav"
     data-ga-surface="github_pages"
     data-ga-click-area="article_bottom_nav"
     data-ga-action="navigate_prev"
     data-ga-block-id="article-bottom-nav"
     data-ga-slug="<%= post.slug %>"
     data-ga-target-slug="<%= prevPost.slug %>"
     data-ga-target-url="<%= basePath %>/posts/<%= prevPost.slug %>/"
     data-ga-label="<%= prevPost.title %>">
    <span class="lab-prev-next__label">上一篇</span>
    <span class="lab-prev-next__title"><%= prevPost.title %></span>
  </a>
  <% } %>
  <% if (nextPost) { %>
  <a class="lab-prev-next__next" href="<%= basePath %>/posts/<%= nextPost.slug %>/"
     data-ga-event="click_article_nav" data-ga-surface="github_pages"
     data-ga-click-area="article_bottom_nav" data-ga-action="navigate_next"
     data-ga-block-id="article-bottom-nav" data-ga-slug="<%= post.slug %>"
     data-ga-target-slug="<%= nextPost.slug %>"
     data-ga-target-url="<%= basePath %>/posts/<%= nextPost.slug %>/"
     data-ga-label="<%= nextPost.title %>">
    <span class="lab-prev-next__label">下一篇</span>
    <span class="lab-prev-next__title"><%= nextPost.title %></span>
  </a>
  <% } %>
  <a class="lab-prev-next__home" href="<%= basePath %>/"
     data-ga-event="click_article_nav" data-ga-surface="github_pages"
     data-ga-click-area="article_bottom_nav" data-ga-action="navigate_home"
     data-ga-block-id="article-bottom-nav" data-ga-slug="<%= post.slug %>"
     data-ga-target-url="<%= basePath %>/"
     data-ga-label="回首頁">回首頁</a>
</nav>
```

### 3.3 ⚠️ data attribute 命名議題：`data-ga-*` vs 既有 `data-ga4-param-*`

使用者建議使用 `data-ga-event` / `data-ga-surface` / `data-ga-click-area` / `data-ga-action` / `data-ga-block-id` / `data-ga-slug` / `data-ga-target-slug` / `data-ga-target-url` / `data-ga-label`。

**但既有 listener（`link-tracker.js`）只認 `data-ga4-event` + `data-ga4-param-<key>`**。兩者**不相容**：上面 `data-ga-*` 範例若直接上線，**現有 listener 不會 fire**（變成 dead attrs）。

兩條路（§8 待決策 D1）：
- **路 A（推薦，零 churn）**：沿用既有 `data-ga4-event` + `data-ga4-param-*`，把使用者語意映射為 params——`data-ga4-event="click_article_nav"` + `data-ga4-param-nav_direction="prev"` + `data-ga4-param-placement="article_bottom_nav"` + `data-ga4-param-target_slug` + `data-ga4-param-target_url` + `data-ga4-param-link_label` + `data-ga4-param-post_slug`。**不需改 listener**。
- **路 B**：採用新 `data-ga-*` 命名 → **必須同步擴充 `link-tracker.js`** 同時支援兩種 prefix（或遷移）。屬 source 改動，churn 較大。

> 本 preanalysis **建議路 A**：語意完全可由 param 表達，且不動已驗收之 listener。§3.2 範例之 `data-ga-*` 屬「使用者語意示意」，實作時轉為 `data-ga4-param-*`。

### 3.4 prev/next 資料來源

`prevPost` / `nextPost` 需由 `build-github.js` 在 render post-detail 前，依**已排序之 published 列表**（同 surface / 可選同 category）推導後傳入 template（mirror 既有 `relatedLinksRendered` 之 derive-then-pass pattern）。**邊界 case**：第一篇無 prev、最後一篇無 next → 對應 `<a>` 不渲染（per §17「無資料不輸出空白區塊」）。

---

## 4. AdSense / Auto Ads 邊界（明確紅線）

### 4.1 不可做

- ⛔ **不追蹤 AdSense iframe 內實際廣告點擊**——廣告點擊由 AdSense 原生處理；本系統無法、也不應讀取 iframe 內事件。
- ⛔ **不包覆 AdSense 廣告 / 不做誘導點擊 / 不做任何 click interception**——違反 AdSense 政策風險。
- ⛔ **不把 Auto Ads 自動插入之廣告視為自有 click**——GA event 命名不得讓 Auto Ads 點擊被算成 `click_internal_*` / `click_external_*`。
- ⛔ **不用 GA 偽造 ad click**——AdSense 收益分析一律以 **AdSense 報表 / 自訂渠道**為準。

### 4.2 可做（站內自有元素）

- ✅ 追蹤**自有連結 / 自有元素**：文章底部導覽（§3）、相關文章、commerce / affiliate 自有 CTA（已落地）、hashtag、nav、social——這些是本系統 render 的 anchor，非廣告。
- 🔵 **未來可另開 phase**（本 phase 不做）：
  - ad slot 是否 render / inserted（structural impression；非 ad click）；
  - ad wrapper viewport visibility / impression（IntersectionObserver）。
  - 兩者皆屬「**自有 wrapper 之曝光**」而非「廣告點擊」；若做須獨立 phase + 明確區分 event 命名（如 `ad_slot_rendered` / `ad_wrapper_visible`），**絕不**用 `click_*`。

### 4.3 現況 AdSense 結構（read-only 盤點）

- 14 個 anchor 插入點（`adsense-anchor.ejs` 委派鏈）：`afterHeader` / `afterCover` / `afterBookPhoto` / `afterAffiliateTop` / `beforeDownloadBox` / `afterDownloadBox` / `beforeAffiliateBottom` / `afterAffiliateBottom` / `beforeRelatedLinks` / `afterRelatedLinks` / `beforeOtherLinks` / `afterOtherLinks` / `beforeHashtags` / `afterHashtags`。
- manual 6 slot 對映（per ledger N9d policy）：`articleAd1→afterHeader` / `articleAd2→afterCover` / `articleAd3→afterBookPhoto` / `articleAd4→afterAffiliateTop` / `articleAd5→beforeAffiliateBottom` / `articleAd6→beforeRelatedLinks`。GitHub Pages enabled=true（live）；Blogger surface 僅 `articleAd6`/`beforeRelatedLinks`。

### 4.4 未來 Auto Ads 共存管理（若開啟）

| 議題 | 管理原則 |
|---|---|
| manual 6 slot 與 Auto Ads 版位衝突 | Auto Ads 會自行找空位插入；可能與 manual articleAd1–6 重疊／鄰接。開啟前須在 AdSense 後台排除已 manual 覆蓋之區域，或評估只留其一 |
| GA 事件命名 | Auto Ads 廣告**不得**被任何 `click_*` 自有 event 捕捉；§3.3 路 A 之 listener 只綁 `[data-ga4-event]`，Auto Ads iframe 無此 attr → 天然不會誤捕（已是安全設計）|
| 收益分析來源 | 一律 AdSense 報表 / 自訂渠道；GA 僅追自有導覽 / 導購 click，不作 ad 收益替身 |
| 版位密度政策 | Auto Ads + manual 6 slot 疊加可能過密 → 影響使用者體驗 + 政策風險；須另開 phase 評估 |

---

## 5. Recommended GA4 naming convention（命名建議）

### 5.1 主線選擇

- **沿用既有 family B（`click_*` verb-first）作為「站內 click event」主線**——因 `click_affiliate_cta` / `click_related_link` / `click_other_link` 已落地且 GitHub 端可 fire，改名會造成已驗收 spec churn（per spec §4.2 推薦理由 + `feedback_conservative_landing`）。
- 新點擊點一律 family B：`click_internal_nav` / `click_post_card` / `click_article_nav` / `click_hashtag` / `click_external_link` / `click_social` / `click_download`。
- **使用者提案名（`site_internal_click` / `article_adjacent_click` / `article_bottom_nav_click` / `related_post_click` / `commerce_link_click` / `outbound_link_click`）** 概念正確、語意清楚，但與 family B 形態不同（subject-first vs verb-first）。**建議不另立第三家族**，改以「概念 → family B event + param」映射收斂（見 §2 對照欄 + §8 D2）。

### 5.2 event name 規則（對齊 `ga4-parameter-naming-registry.md` §6.1）

- snake_case；全小寫；動作描述（`click` / `view` / `download`）。
- param key snake_case；value string；boolean→`'true'`/`'false'`；key 符合 `/^[a-zA-Z0-9_-]+$/`。

### 5.3 `hashtag_click` vs `tag_click` 之處置

- 現況：`ga4.config.json` 之 family A 用 `tag_click`；spec / governance 之 family B 用 `click_hashtag`；**兩者皆未實際 fire**（hashtag 仍為 `<span>`）。
- **建議**：hashtag click 落地時採 family B `click_hashtag`，與其他 `click_*` 一致；`tag_click`（family A）標 historical / config 宣告，未來在 `ga4.config.json` events 對齊時一併處理（屬 §8 D3 governance decision）。**目前無 backward-compat 包袱**（無既有 fire 之 hashtag event）→ 二擇一無遷移成本。

### 5.4 backward compatibility 原則

- **不改**已落地之 `click_affiliate_cta` / `click_related_link` / `click_other_link`（已可能有 GA4 dimension 連續性）。
- config-level family A 之 9 events 視為「宣告清單 / historical」；對齊由獨立 governance phase 處理，**不在本 taxonomy 強制 migration**。

---

## 6. Implementation plan for next phase（分階段）

> 本 phase **不實作**；以下為建議拆批，每批獨立 commit、source 與 docs 分批、GitHub 先 Blogger 後（per 既有原則）。

| Phase | 範圍 | 主要檔案 | 風險 | 前置 |
|---|---|---|---|---|
| **B. GA helper / listener** | 確認 `link-tracker.js` 支援所需 param；（若採 §3.3 路 B 才需擴充 prefix）；可選 `back-to-top.js` 程式 fire | `src/js/modules/link-tracker.js`（路 A 可不動）| 🟢 低（路 A）/ 🟡 中（路 B）| 無 |
| **C. 文章底部導覽 partial（GitHub）** | 新增 `partials/article-bottom-nav.ejs` + `build-github.js` derive `prevPost`/`nextPost` + `post-detail.ejs` include + `data-ga4-*` attrs | `post-detail.ejs` / `build-github.js` / 新 partial | 🟡 中（需 build + dist diff 驗證）| B |
| **C2. 其他點擊點補 attr（GitHub）** | header/nav/breadcrumb/post-card/social/download/hashtag(需 span→a) 補 `data-ga4-*` | layout/pages partial | 🟡 中（多檔；hashtag 需前置改造）| B |
| **D. output check（GitHub + Blogger）** | build 後驗 dist DOM attrs；確認 Blogger 輸出**未**誤帶 inert attrs（per blogger-listener-strategy）；新增 `check:ga4-*` smoke（可選）| build:github / build:blogger | 🟡 中 | C |
| **E. GA4 DebugView / Realtime manual checklist** | docs：人工點擊 → DebugView 驗 event + params（mirror spec §12 SOP）| docs only | 🟢 低 | D + deploy |
| **F.（optional）Auto Ads coexistence 管理 doc** | docs：manual 6 slot vs Auto Ads 版位 / 命名 / 收益分析邊界 | docs only | 🟢 低 | 視 user 是否開 Auto Ads |
| **G.（optional）Blogger listener** | 若決定追 Blogger 端 click：採方案 B-theme（主題級 listener + template attr 同 phase）| blogger-post-full.ejs + theme JS | 🟡 中 | 觀察期後 + user 決策（per blogger-listener-strategy §5）|

---

## 7. Acceptance criteria for this docs-only phase

| # | 條件 | 滿足 |
|---|---|---|
| 1 | 僅新增 1 個 docs 檔（`docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`）| ✅ |
| 2 | no source / config / content / settings / fixtures / template / view / build / dist mutation | ✅（唯一改動為本 docs + commit）|
| 3 | working tree clean after commit / push | ✅（見 §H final report）|
| 4 | baseline checks recorded（HEAD / validate / smoke）| ✅（§B / §G）|
| 5 | clear file targets + non-actions | ✅（§6 + 下方 Non-actions）|
| 6 | current state audit（哪些區塊 / 有無 GA / surface / shared）| ✅ §1 |
| 7 | event taxonomy 表（含 required/optional params 等 9 欄）| ✅ §2 |
| 8 | 文章底部導覽規格（獨立 EJS / nav_direction / data attrs）| ✅ §3 |
| 9 | AdSense / Auto Ads 邊界 | ✅ §4 |
| 10 | naming convention + hashtag_click/tag_click 處置 | ✅ §5 |
| 11 | implementation plan B–F | ✅ §6 |
| 12 | open questions / decisions | ✅ §8 |

### Non-actions（本 phase 不做）

未改 src / content / settings / fixtures / templates / views / package / lockfile / dist / gh-pages / `.cache`；未 build / validate（僅 read-only baseline）/ deploy / repost Blogger；未改 AdSense 真實 ID / commerce registry；未跑 Admin Apply / middleware / admin-write-cli；未 npm install / amend / rebase / force-push / `/memory`；未壓縮或重排 CLAUDE.md。

---

## 8. Open questions / decisions（需人決策；本 phase 不實作）

| # | 決策 | 選項 | 本 preanalysis 傾向 |
|---|---|---|---|
| **D1** | data attribute 命名：採新 `data-ga-*` 還是沿用既有 `data-ga4-event`+`data-ga4-param-*`？ | A 沿用既有（零 listener churn）／ B 新 prefix（須改 listener）| **A**（語意可由 param 表達；不動已驗收 listener）|
| **D2** | event_name 是否統一為使用者提案之 subject-first（`site_internal_click` 等 + parameters）？ | A 維持 family B `click_*`（已落地）／ B 改 subject-first（churn 已落地 event）| **A**（backward-compat；新點沿用 family B）|
| **D3** | `hashtag_click` 是否遷移為 `tag_click`／統一為 `click_hashtag`？ | A `click_hashtag`（family B 一致）／ B `tag_click`（family A config）| **A**（無既有 fire，無遷移成本；與其他 click_* 一致）|
| **D4** | 文章底部導覽（prev/next/home）之文案與排列？ | 「上一篇 / 下一篇 / 回首頁」順序與措辭 | 待 user 定稿（§3.2 為示意）|
| **D5** | prev/next 推導範圍：全站 published 順序 vs 同 category 順序？ | 全站／同分類／同 contentKind | 待 user 表態（影響 build-github derive）|
| **D6** | 未來是否開啟 Auto Ads？ | 開／不開／延後 | 待 user；若開須先做 §4.4 共存 doc（Phase F）|
| **D7** | Blogger 端 click 是否要追？ | A 永久不追（UTM only）／ B-theme listener | 短期維持不追（per blogger-listener-strategy §5.1）|
| **D8** | GA4 custom dimensions 要註冊哪些 param？ | `nav_direction` / `placement` / `link_type` / `provider` / `social_platform` / `tag_slug` 等 | 待 user 在 GA4 後台決定註冊清單（影響報表可切片性）|
| **D9** | post-card 綁定 anchor `__link` 還是整張卡片？ | `__link` only／整卡 delegated | `__link`（避免 meta/category 連結重複 fire）|

---

## 9. Cross-links

- `docs/ga4-link-tracking-spec.md`（§3 targets / §4 event design / §11 placement enum / §12 驗收 SOP）
- `docs/ga4-parameter-naming-registry.md`（§3 UTM / §6 event 命名）
- `docs/click-tracking-governance.md`（implementation contract / §9.2 event reconcile deferred）
- `docs/blogger-listener-strategy.md`（Blogger 端 listener A/B/C/D 方案；短期推薦 D）
- `docs/seo-ga4-adsense.md`（既有 9 events / AdSense 規格）
- `docs/hashtag-slug-decision.md`（hashtag span→a + tag_slug 前置）
- `content/settings/ga4.config.json`（measurementId + family A events 宣告）
- `src/js/modules/link-tracker.js` / `ga4-events.js`（既有 listener / helper）
- `src/views/pages/post-detail.ejs`（已落地 click_* attrs reference）
- `src/styles/components/_prev-next.scss`（已存在、待 render 之導覽元件樣式）

---

（本文件結束）
