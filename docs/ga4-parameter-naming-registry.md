# GA4 / UTM / hostname / event 命名管理規格（Naming Registry）

本文件為 **Phase 20260521-pm-48** 之 docs-only 落地；屬「統一命名規格」型 registry；後續 GA4 / UTM / cross-link / FB promotion / 文章 metadata 之產製皆以本文件為**單一權威來源**（single source of truth）。

對應上層：
- `docs/ga4-enable-preflight.md`（GA4 啟用流程 + 既有設定盤點）
- `docs/seo-ga4-adsense.md`（GA4 event spec；既有 9 個 events）
- `CLAUDE.md` §16.4（既有 Blogger / GitHub cross-link UTM 規則；pm-52 後 registry 已對齊；見 §9）
- `content/settings/promotion.config.json`（既有 FB UTM；本 registry 有部分 drift；見 §9）

⚠️ **本文件不修改 source code / settings / build / dist / deploy**；屬規格參考；後續實作對齊由獨立 phase 啟動。

---

## §1 GA4 measurementId 管理

| 項目 | 值 |
|---|---|
| **production measurementId** | `G-C77SMPF8VD` |
| 啟用日期 | 2026-05-21（Phase pm-43 / commit `09b9a67`；pm-45 deploy `f32f7d3`；pm-46 user 手測 Realtime 驗收通過）|
| **共用 hosts**（同一 measurementId） | Blogger（`babel-lab.blogspot.com`）+ GitHub Pages（`babel-lab.github.io/portable-blog-system/`）+ 未來 custom domain |
| 是否因 custom domain 更換 | ❌ **否**。GA4 property 不綁 hostname；measurementId 永久共用 |
| Data Stream Website URL | custom domain 上線後於 GA4 後台 Data Stream 設定頁更新 URL（**measurementId 不變**）|
| Settings 位置 | `content/settings/ga4.config.json` 之 `measurementId` 欄位 |
| Gating 機制 | 4-AND（per Phase pm-11；`ga4 存在 && ga4.enabled === true && ga4.measurementId 非空 && isProdBuild === true`）|

**規則**：
- 本系統長期 **僅維護 1 個 measurementId**；不採 dev / prod 雙 ID 設計
- dev mode 之 GA4 event 由 `isProdBuild=false` gating 阻擋（per pm-11）；無需另立 dev measurementId
- 後續任何新增 hostname（如 custom domain / Blogger 子網址 / 等）皆共用 `G-C77SMPF8VD`

---

## §2 hostname 管理

| Hostname | 用途 | 狀態 |
|---|---|---|
| `babel-lab.blogspot.com` | Blogger（既有流量 + AdSense 收益）| ✅ 既有；GA4 已接（per user 確認）|
| `babel-lab.github.io` | GitHub Pages staging / current public host | ✅ 自 2026-05-21 pm-45 起啟用 GA4 |
| _custom domain_（5 月底 / 6 月初預計）| AdSense 申請 + 正式 public host | 🟡 deferred；屬未來 migration phase |

**規則**：
- 後續觀察 1-2 週 GA4 後台之 hostname 分佈（用 `hostname` dimension filter）
- 若發現 preview mode（`vite preview`；本機 localhost）event 污染嚴重 → 啟動 hostname allowlist phase
- 當前 `isProdBuild=true` gating 已涵蓋 dev / build 主要 split；preview mode 邊界屬可接受 trade-off
- 暫**不**啟動 hostname allowlist（per pm-39 §5）

---

## §3 UTM 命名規則（authoritative）

| 欄位 | 命名規則 | 範例 |
|---|---|---|
| `utm_source` | **小寫**；允許 `_` 連字（per cross-link UTM 既有實作）| `facebook` / `blogger` / `github_pages` |
| `utm_medium` | **小寫**；單一 token | `social` / `referral` / `email` / `internal` |
| `utm_campaign` | **小寫**；cross-link / FB promotion UTM 採 **snake_case**（對齊既有 production）；個別主題 campaign 名（如 `fbCampaign` / Admin 顯示之手填 campaign）可用 **kebab-case** | cross-link: `portable_blog_system`；FB pattern: `{page}_post`；fbCampaign 範例: `book-review-2026q2` / `life-comic-parenting` |
| `utm_content` | **小寫**；cross-link UTM 採 **snake_case** slot（`related_links` / `other_links`）；個別 slug / variant 可用 **kebab-case** | cross-link slot: `related_links` / `other_links`；slug 範例: `we-media-myself2`；variant: `cta-bottom` |
| `utm_term` | **小寫**；通常用於 keyword 追蹤；本系統不主動使用 | n/a（保留）|

**雙 case 策略說明**：cross-link 與 FB promotion 之 UTM slot 為**自動生成**之系統 token（per `src/scripts/ga4-url-builder.js` + `content/settings/promotion.config.json`）；採 snake_case 對齊現有 production output（per pm-9 章節既有實作）。個別「主題 campaign」名（如 `fbCampaign` 由作者手填）為使用者命名空間；可採 kebab-case；屬可分流之 naming convention。

### 3.1 禁止之 case drift

| 錯誤 | 正確 |
|---|---|
| `FB` / `Facebook` / `fb` | **`facebook`** |
| `Blogger` / `BLOG` | **`blogger`** |
| `GitHub` / `GH` / `github` | **`github_pages`**（cross-link UTM 採此既有 snake_case 雙 token；per `CLAUDE.md` §16.4 + `src/scripts/ga4-url-builder.js`；對齊 production）|
| `FAN1` / `Fan1` | **`fan1`** |
| `Book_Review` / `BookReview` | **`book-review`**（kebab；屬個別 fbCampaign 命名空間）|
| `2026Q2` | **`2026q2`** |

### 3.2 不加 UTM 之情境

| 情境 | 是否加 UTM | 理由 |
|---|---|---|
| 同站 internal link（如 GitHub 站內文章 → 另一篇 GitHub 文章）| ❌ **不加** | 同站 referrer 已可識別；加 UTM 會污染 GA4 直接流量分析 |
| 同站 nav / footer / breadcrumb | ❌ 不加 | 同上 |
| Blogger ↔ GitHub cross-link | ✅ 加（屬跨站 referral；per CLAUDE.md §16.4）| 跨站需 UTM 才能識別 source |
| FB promotion txt 之 article URL | ✅ 加（per `promotion.config.json` 之 UTM block）| FB 之 referrer 為 facebook.com；UTM 提供更精細之 page / campaign 追蹤 |
| Email signature / blog comment 等外部觸點 | ✅ 加 | 同上 |

---

## §4 建議預設值

### 4.1 Facebook 推廣

| 欄位 | 值 |
|---|---|
| `utm_source` | `facebook` |
| `utm_medium` | `social` |
| `utm_campaign` | `{page}_post`（per `content/settings/promotion.config.json` 之 `campaignPattern` 既有設定；snake_case；對齊 production）|
| `utm_content` | `{slug}`（即 post slug；per `contentPattern`）|

### 4.2 Blogger → GitHub Pages cross-link（**future phase；尚未實作**）

per `CLAUDE.md` §16.4：當 Blogger 端 cross-link 自動化實作時，**對齊 GitHub→Blogger 既有命名 convention 之 mirror**：

| 欄位 | 值 |
|---|---|
| `utm_source` | `blogger` |
| `utm_medium` | `referral` |
| `utm_campaign` | `portable_blog_system`（snake_case；mirror §4.3）|
| `utm_content` | `related_links` / `other_links`（snake_case；mirror §4.3）|

### 4.3 GitHub Pages → Blogger cross-link（**已實作；production live**）

per `CLAUDE.md` §16.4 + `src/scripts/ga4-url-builder.js`：自 pm-6 / pm-45 deploy 起 production live；對齊既有 snake_case convention：

| 欄位 | 值 |
|---|---|
| `utm_source` | `github_pages`（snake_case；雙 token；對齊既有實作）|
| `utm_medium` | `referral` |
| `utm_campaign` | `portable_blog_system`（snake_case；對齊既有實作）|
| `utm_content` | `related_links` / `other_links`（snake_case slot；對齊既有實作）|

### 4.4 Internal cross-link（同站）

**建議**：**不加 UTM**。

理由：
- 同站 referrer 已可由 GA4 之 `previous_page_location` dimension 識別
- 加 UTM 會把直接流量誤判為 referral（影響 acquisition 報表）
- GA4 之 internal_link_click event（per `seo-ga4-adsense.md`）已涵蓋同站 click 追蹤
- 若仍需區分 → 用 GA4 event params（如 `data-ga4-event="internal_link_click"`）；**不**用 UTM

例外：若 user 想刻意分析特定 internal campaign（如「年度回顧 series 之相互推薦」），可加 `utm_medium=internal` + `utm_campaign={name}`；但屬例外。

---

## §5 campaign / audience 命名

### 5.1 FAN1 大小寫

| 既有 | 對齊建議 |
|---|---|
| `promotion.config.json` `pages.fan1.name` | ✅ 保留 lowercase `fan1`（已對齊）|
| `utm_campaign={page}_post` → `fan1_post` | ✅ snake_case；對齊 production；per pm-52 決策維持既有 |
| `fb.md` 之 `page: "fan1"` | ✅ lowercase（已對齊）|

### 5.2 系列文章 campaign 命名

| 系列類型 | 建議 |
|---|---|
| 書評系列 | `book-review-{slug-fragment}`；如 `book-review-we-media-myself2` |
| 季度書評 batch | `book-review-{YYYY}q{N}`；如 `book-review-2026q2`（per S-3 fixture 之 fbCampaign）|
| 生活四格 | `life-comic-{topic}`；如 `life-comic-parenting` |
| 教具下載 | `download-{material}`；如 `download-flashcards` |
| GitHub 技術筆記 | `tech-note-{topic}`；如 `tech-note-vite-build` |
| 講座 / 活動 | `event-{name}-{YYYYMM}`；如 `event-figma-workshop-202607` |
| 跨站 cross-link 通用（自動生成 UTM slot）| `portable_blog_system`（per §4.2 / §4.3 既有實作）；個別 cross-link campaign 標記則用作者命名空間 |

### 5.3 audience 命名（per `.fb.md` 之 `audience` 欄位）

| 受眾類型 | 建議值 |
|---|---|
| 開發者 | `developers` |
| 家長 | `parents` |
| 教師 | `educators` |
| 自媒體經營者 | `creators` |
| 一般讀者 | `general` |
| 設計師 | `designers` |

**規則**：lowercase；單一 token；無連字（除非語意需要）；可多選用 `+` 連接（`parents+educators`）。

---

## §6 GA4 event 命名規則

### 6.1 event name 規則

- **snake_case**（GA4 官方推薦；對齊 GA4 既有 `page_view` 等 reserved events）
- 全 lowercase；無底線之開頭 / 結尾
- 動詞或動作描述為主（`click` / `view` / `download` / `copy`）

### 6.2 既有 9 個 event（per `seo-ga4-adsense.md` / `ga4.config.json`）

| event name | 觸發時機 | 對應 GA4 規格 |
|---|---|---|
| `page_view` | GA4 自動 | reserved（auto-emit）|
| `internal_link_click` | 同站連結 click | custom |
| `tag_click` | hashtag click | custom |
| `category_click` | 分類連結 click | custom |
| `affiliate_click` | 聯盟連結 click | custom |
| `download_click` | 教具下載 button click | custom |
| `social_click` | 社群圖示 click | custom |
| `blogger_to_github_click` | Blogger 內連到 GitHub | custom |
| `github_to_blogger_click` | GitHub 內連到 Blogger | custom |

### 6.3 建議擴充 event（未來）

| event name | 用途 |
|---|---|
| `external_link_click` | 一般外連（非 affiliate / 非 cross-link）|
| `hashtag_click` | （與 tag_click 同義；建議二擇一統一）|
| `fb_link_click` | 點 FB 推廣文案內 article link 來訪（如 FB 連到 article）|
| `copy_blogger_html` | Admin 端複製 Blogger 匯出 HTML 之 button click |
| `back_to_top_click` | back-to-top button |
| `scroll_75` | 滾動至 75%（內容讀完之 proxy）|

### 6.4 event parameter 命名

- **snake_case**
- 短而具體
- 對齊 GA4 之 reserved param（如 `page_title` / `page_location`）

| param | 用途 |
|---|---|
| `link_url` | 點擊之 URL（external_link_click）|
| `link_text` | 連結文字（可選；隱私性低）|
| `tag` | hashtag 值（tag_click）|
| `category` | 分類值（category_click）|
| `target_post_slug` | cross-link 目標 post（cross-link events）|
| `source_post_slug` | cross-link 來源 post |
| `position` | 連結位置（`header` / `nav` / `inline` / `related-links` / `other-links` / `footer`）|
| `campaign` | 對應 utm_campaign（若由 cross-link 觸發）|

---

## §7 與現有系統 metadata 之關係

### 7.1 Blogger / FB metadata 預設帶出 UTM

| metadata 來源 | UTM 自動產出機制 |
|---|---|
| `.fb.md` 之 `page`（如 `fan1`）→ FB promotion txt | `promotion.config.json` 之 `utm.campaignPattern` 展開（`{page}-post`；建議從 `{page}_post` 改 per §9）|
| `.md` frontmatter 之 `slug` → FB promotion txt 之 article URL | `promotion.config.json` 之 `utm.contentPattern` 展開（`{slug}`）|
| GitHub Pages 之 cross-link to Blogger | per CLAUDE.md §16.4 之自動 UTM 注入（已實作 ga4-url-builder.js）|
| Blogger → GitHub cross-link | per CLAUDE.md §16.4 之 future phase；尚未實作 |

### 7.2 FB promotion posts 之 UTM 從 article metadata 產生

- `build-promotion.js` 讀 `.md` frontmatter `slug` + `.fb.md` `page` + `promotion.config.json` `utm` block 組合
- 產出 FB promotion txt 之 article URL 含完整 UTM

### 7.3 override 機制

- 每篇文章之 `.fb.md` 可加 `customUrl` 欄位（既有 schema；per `_sample.fb.md`）→ 直接覆寫 UTM 邏輯
- 每篇 `.md` 可加 `relatedLinks` / `otherLinks` 之 `url` 欄位內手填 UTM（per `link-rules.md` §16.4 策略 A：手填 UTM 不被覆蓋）

---

## §8 未來實作候選

| # | 候選 phase | 性質 | 阻擋條件 |
|---|---|---|---|
| 1 | **UTM naming consistency reconciliation**（對齊本 registry vs CLAUDE.md §16.4 / `promotion.config.json` 之 drift；per §9）| source + docs | 需 user 表態：以本 registry 為準 vs 維持 CLAUDE.md 既有；屬中型 |
| 2 | **UTM build helper**（centralized UTM builder util；對齊本 registry；deprecate 各處硬編碼）| source | 屬 refactor；中型 |
| 3 | **GA4 event registry**（具體實作既有 9 events + 擴充 events 之 client-side trigger；per `seo-ga4-adsense.md` §5.3）| source | 屬 medium-large；需 user 表態 event 優先順序 |
| 4 | **Admin read-only preview UTM URL**（Admin overview 之 detail panel 顯示「對應 FB 推廣 URL（已含 UTM）」preview）| source（Admin EJS）| 屬 polish；low |
| 5 | **FB post URL + UTM URL 對照**（`.fb.md` 之 `fbPostUrl` vs `finalUrl`（含 UTM）vs source post URL 三者對照表）| docs + Admin source | 屬 polish；low |
| 6 | **hostname allowlist phase**（per pm-39 §5；觀察 1-2 週後啟動）| source | 依賴 GA4 啟用後觀察期 |
| 7 | **GA4 cross-platform analysis setup**（GA4 後台 filter / segment 設定文件；分離 Blogger / GitHub / custom domain 流量）| docs only | 依賴 GA4 後台手動操作 |

---

## §9 已決策：registry 對齊既有 implementation（pm-52 後）

pm-51 preflight 識別 5 個 drift；pm-52（本 batch）user 決議**改 registry 對齊既有 implementation**，**不改 source / production output**。

### 9.1 決策摘要

| # | 維度 | 既有實作（保留） | pm-52 後 registry |
|---|---|---|---|
| 1 | cross-link `utm_source` | `github_pages`（snake；雙 token；per `src/scripts/ga4-url-builder.js:147`）| ✅ 對齊既有 `github_pages` |
| 2 | cross-link `utm_campaign` | `portable_blog_system`（snake；per `ga4-url-builder.js:149`）| ✅ 對齊既有 `portable_blog_system` |
| 3 | cross-link `utm_content` | `related_links` / `other_links`（snake slot；per `ga4-url-builder.js:130, 150` + `build-github.js:480-481`）| ✅ 對齊既有 snake_case slot |
| 4 | FB `campaignPattern` | `{page}_post`（snake；per `promotion.config.json:14`）| ✅ 對齊既有 `{page}_post` |
| 5 | FB `fbCampaign` 等個別 campaign 名（作者命名空間）| 範例：`book-review-fixture-2026q2`（kebab；user 命名）| ✅ 保留 **kebab-case**（屬作者個別 campaign，不等同 cross-link UTM slot；雙 case 策略合理）|

### 9.2 決策理由

- ✅ 線上 cross-link UTM 已 deploy（pm-6 / pm-45）；Google 已索引
- ✅ GA4 Realtime 已 user 手測驗收通過（pm-46）；不破壞 dimension 連續性
- ✅ Blogger 既有 share URL 已散佈外部；無法統一改
- ✅ 內部一致性比命名漂亮更重要
- ✅ pm-48 registry 為新建文件；尚可修正為對齊既有

### 9.3 雙 case 策略對齊

| 場景 | case style | 來源 |
|---|---|---|
| cross-link UTM（自動生成；系統 token）| **snake_case** | `ga4-url-builder.js` + `build-github.js` 既有實作 |
| FB promotion 之 `campaignPattern: "{page}_post"`（自動生成）| **snake_case** | `promotion.config.json` 既有設定 |
| `fbCampaign` 等個別 campaign 名（作者手填）| **kebab-case**（可選；屬 user namespace）| `.fb.md` `fbCampaign` 欄位；如 `book-review-fixture-2026q2` |
| FB promotion `{slug}` 帶入 `utm_content` | 沿 slug 本身格式（通常 kebab；如 `we-media-myself2`）| `.md` frontmatter `slug` |

→ 此雙 case 策略對齊**現實邊界**：系統自動生成之 token 維持 snake_case（一致性 + 對齊既有 production）；作者命名空間允許 kebab-case（語意豐富）。

### 9.4 ⚠️ 未來若要改 kebab-case 之警告

若 user 未來決定全 cross-link UTM 改 kebab-case，**必須另開 breaking-change migration phase**，並包含：

- 改 `src/scripts/ga4-url-builder.js`（3 處硬編碼字串）
- 改 `src/scripts/build-github.js`（2 處 slot 字串）
- 改 `content/settings/promotion.config.json` `campaignPattern`
- 改 `CLAUDE.md` §16.4 規範
- 改 `docs/related-links-schema.md:212` 規格
- 改 `src/views/pages/post-detail.ejs:183` 註解
- **GA4 後台**設定 segment / filter 處理過渡期之新舊 source/campaign/content dimension 並存
- 重 build + deploy → 線上 cross-link URL 變
- 監控 GA4 報表之 source/campaign continuity 1-2 週
- 評估 Google SEO 之 utm query 變動影響

⚠️ 屬 **breaking change**；不在本 registry scope；需 user 明示啟動。

### 9.5 remaining drift

🟢 **0 個 remaining drift**（pm-52 後 registry 完整對齊既有實作）。

---

## §10 邊界聲明

- ✅ 本文件**僅為命名 registry**；不改 source code / settings / build / dist / deploy
- ✅ 本文件**不啟動**任何 reconciliation phase（屬 §8 候選）
- ✅ 本文件**不啟動** custom domain migration / AdSense / hostname allowlist / GA4 event registry 等實作
- ✅ 本文件 single source of truth：後續產製（FB promotion / cross-link / GA4 event）皆對齊本 registry；既有 drift 由 §9 列出但暫不解決
- ✅ 不 push gh-pages；不 deploy

---

## §11 Cross-links

- `docs/ga4-enable-preflight.md` — GA4 啟用流程 + 既有設定盤點
- `docs/seo-ga4-adsense.md` — GA4 event 規格（既有 9 events）
- `docs/20260521-end-of-day-report.md` §16 — GA4 enable execution series（pm-43 ~ pm-47）
- `CLAUDE.md` §16.4 — 既有 Blogger / GitHub cross-link UTM 規則（與本 registry 有 §9 drift）
- `content/settings/promotion.config.json` — 既有 FB UTM 設定（與本 registry 有 §9 drift）
- `content/settings/ga4.config.json` — measurementId + events 列表（per §1 + §6.2）
- `src/scripts/ga4-url-builder.js` — 既有 UTM build helper

---

（本文件結束）
