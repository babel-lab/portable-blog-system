# System Direction：BLOG 系統整體方向

本文件為 BLOG 系統之**整體方向綱領**，補強 `CLAUDE.md` §1（系統目的）+ §2（兩平台定位）+ §3（核心資料來源）+ §11（contentKind）之既有描述，明示「本系統不是單一平台 site；而是**本機內容管理 / 內容產製系統**，發布出口可擴及多平台」。

對應上層文件：
- `CLAUDE.md` §1 / §2 / §3 / §11 / §16 / §17 / §29
- `docs/architecture.md`（整體架構）
- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界規劃）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃）
- `docs/publish-bundle.md`（sidecar 三檔結構）
- `docs/phase-10-completion-report.md`（GitHub Pages 部署系列收尾）

---

## §1 BLOG 系統定位

### 1.1 本系統是什麼

- **本機內容管理 / 內容產製系統**（local-first authoring / content management）
- 真正資料來源永遠是**本機** `content/` 目錄之 Markdown + frontmatter + sidecar JSON
- 不依賴任何單一平台後台（不綁 Blogger / 不綁 GitHub Pages / 不綁未來任何 CMS）

### 1.2 本系統不是什麼

- ❌ **不是**單純 Blogger 系統（Blogger 只是當前主要發布出口之一）
- ❌ **不是**單純 GitHub Pages 系統（GitHub Pages 只是另一個輸出通路）
- ❌ **不是**只能對應 2 個平台（未來可擴及自訂網域 / 第三方 CMS / 外租平台等）

### 1.3 為何採此定位

- **可搬家性**：per CLAUDE.md §1 第 1 條原則 — 內容不綁死任何平台
- **可備份性**：本機資料夾整包備份；不依賴任何雲端後台
- **可擴充性**：發布出口可逐步增加（不需 source data 重構）
- **抗單點失效**：任何單一平台帳號 / 服務停用，本機 source 永遠存在

---

## §2 與發布出口之關係

### 2.1 當前已實作之發布出口

| 出口 | 性質 | 實作位置 | 部署模式 |
|---|---|---|---|
| **Blogger** | 已有流量 + AdSense 收益之既有平台 | `src/scripts/build-blogger.js` + `dist-blogger/` | 人工複製 HTML 至 Blogger 後台 |
| **GitHub Pages** | 技術筆記 + 部分內容之新主站 | `src/scripts/build-github.js` + `dist/` + `gh-pages` branch（per Phase 10 部署系列）| `git push origin gh-pages`（deploy repo 獨立工作目錄）|
| **FB 推廣**（輔助）| 兩平台共用之社群引流 | `src/scripts/build-promotion.js` + `dist-promotion/facebook/` | 手動複製 .txt 至 FB 後台 |

### 2.2 未來可能之發布出口（規劃；非當前 scope）

- 自訂網域之獨立部署
- 第三方 CMS（如 WordPress / Ghost / Hugo / etc.）
- 外租平台之內容餵入（如 Medium / Substack / etc.）
- API-based 內容投遞（如未來自建後端）

→ **每新增 1 個出口，理論上只需新增 1 個 `build-{platform}.js` script**；source data 不需重構。

### 2.3 平台只是發布出口 / 前台通路

Blogger / GitHub Pages / 任何未來平台**皆屬發布出口**；不是 source of truth：

- 文章內容格式、metadata 結構、SEO 欄位、GA4、AdSense、FB 推廣資料 — 原則上**使用同一套資料模型**
- 每個出口之 build script 從同一份 source 讀取，依平台特性 render
- 出口之間之差異（如 Blogger 之 yyyy/mm URL、GitHub 之 subpath URL）由 build script 端處理

---

## §3 共用 metadata 原則

### 3.1 平台共用 vs 平台屬性

per Phase 8-a sidecar bundle 設計，metadata 已**三檔分離**：

| 檔案 | 內容性質 | 適用 |
|---|---|---|
| `{slug}.md` frontmatter | **內容屬性**（與平台無關之 metadata + Markdown 內文）| 全部出口共用 |
| `{slug}.publish.json` | **平台屬性**（per 出口之 publish 狀態、URL、SEO 覆寫）| 對應出口 |
| `{slug}.fb.md` | **FB 推廣專用屬性** | FB 出口 |

### 3.2 「Blogger 專屬」欄位應提升為共用 metadata

Blogger 麻煩之處（需額外處理之欄位）包括：

- 永久連結（permalink / slug）
- 搜尋說明（searchDescription / metaDescription）
- 分類 / 標籤
- 文章 / 網頁 型態（post / page）

**這些欄位不應視為 Blogger 專屬**。每個平台都需要：

| 欄位 | 為何全平台共用 |
|---|---|
| slug / permalink | 任何發布出口都需有穩定 URL |
| searchDescription | 任何發布出口都需 SEO meta description |
| 分類 / 標籤 | 任何發布出口都可分類索引 |
| `contentKind: post` / `page` | 任何發布出口都可有「文章 vs 固定頁面」之區分 |

**結論**：這些欄位**已在共用 metadata 之內**（per CLAUDE.md §3.1 frontmatter 範例）；未來新增出口不需重定義。

### 3.3 共用 metadata 之 source of truth

| 資料類別 | 來源檔 | 適用範圍 |
|---|---|---|
| 平台無關之內容屬性 | `{slug}.md` frontmatter | 全部出口 |
| 平台屬性（per 出口）| `{slug}.publish.json` | 對應出口 |
| FB 推廣專用 | `{slug}.fb.md` | FB 出口 |
| 全站 settings | `content/settings/*.json` | 全部出口共用 |

---

## §4 GA4 / AdSense 共用原則

### 4.1 GA4

- Blogger 與 GitHub Pages **兩邊都會放同一組 GA4**（共用 measurementId）
- GA4 事件追蹤之 event 列表（per CLAUDE.md §5）為兩平台共用
- 設定來源：`content/settings/ga4.config.json`
- 注入點：Blogger HTML render template + GitHub EJS layout
- Admin 預覽 / dev mode **不應觸發**正式 analytics（per `docs/admin-local-boundary-pre-analysis.md` §7）

### 4.2 AdSense

- Blogger 與 GitHub Pages 兩平台**都會使用 AdSense 廣告區塊**
- 一篇文章中**可能有數個 AdSense 區塊**（per CLAUDE.md §17 article block 設計：adsenseTop / adsenseMiddle / adsenseBottom / sidebar / homeInline）
- 透過 **EJS partial / include 插入**（既有 `src/views/ads/adsense-*.ejs`）
- **不應每篇文章手刻 AdSense 程式碼**；由 build script 依 frontmatter 之 `blocks.adsense*` 自動 render
- 設定來源：`content/settings/ads.config.json`

### 4.3 共用原則

- GA4 / AdSense 設定**集中於 settings JSON**；不散落於文章 frontmatter
- per-post 之啟用控制由 frontmatter `blocks.*` 開關
- per-post 之 ad slot ID 若需自訂可後續評估（當前共用全站 ID 已足）

---

## §5 FB Promotion Metadata 原則

### 5.1 兩平台之 FB 推廣需求

- Blogger 與 GitHub 之文章**都會有一個 FB 推廣貼文**
- FB 推廣產出於 `dist-promotion/facebook/{site}/{slug}.txt`
- 來源：`{slug}.fb.md` sidecar（per `docs/fb-sidecar-schema.md`）

### 5.2 FB 推廣 metadata 涵蓋範圍

per `.fb.md` sidecar + settings：

- **核心**：FB title / FB body / FB hashtags
- **UTM**：utm_source / utm_medium / utm_campaign（per `content/settings/promotion.config.json`）+ utm_audience（**未來候選 gap**；當前 schema 未含）
- **語言**：中文標題 / 英文標題（per Phase 8-e-2 之 titleEn）
- **摘要**：中文摘要 / 英文摘要（**未來候選 gap**；當前只有 description / searchDescription，無 zh/en 分流）

### 5.3 FB 推廣與其他出口之關係

- 同一篇文章可有不同 platform 之 FB 推廣文案（per `site` 屬性 + per FB page）
- UTM 集中於 `promotion.config.json` 之 site-level defaults；per-post 可 override

---

## §6 Blogger page/post 與 GitHub article 之關係

### 6.1 Blogger 分類

當前 Blogger 既有分類（per 現實狀況；**非系統強制**）：

- 我的老婆是米蟲（生活四格 / 家庭日常）
- 貝果書屋（書評）
- 教具下載（親子教具 / 下載素材）

⚠️ **教具下載**於 Blogger 可能為**網頁型態（page）**，不一定為文章型態（post）。

### 6.2 GitHub Pages 分類（暫定）

當前 GitHub Pages 暫定分類（**可調整**；當前內容較少）：

- 心得
- 技術

⚠️ **不應寫死**：當前暫定名稱屬 placeholder；隨 GitHub 內容累積會調整。Blogger 才是已有實際文章之主要來源。

→ 分類名稱集中管理於 `content/settings/categories.json`；隨需修改不影響系統設計。

### 6.3 contentKind 統一處理

per CLAUDE.md §11 既定 enum：

| `contentKind` | 描述 | Blogger 對應 | GitHub 對應 |
|---|---|---|---|
| `post` | 一般文章 | post | post |
| `tech-note` | 技術筆記 | post | post（主要） |
| `book-review` | 書評 | post | post |
| `download` | 教具下載 | **可能為 page** | post |
| `comic` | 四格漫畫 | post | post |
| `life-note` | 生活文章 | post | post |
| `page` | 固定頁 | page | post |

**contentKind 為 source of truth**；Blogger 之 `post / page` 型態為 platform-specific 屬性（per `.publish.json` 之 `blogger.type`），由 build-blogger 端依需要設定。

→ **內容資料結構應盡量跟文章一致**；page 型態之差異透過 `contentKind` + `blogger.type` 兩維度標示（per CLAUDE.md §11 + `docs/publish-bundle.md` §2.4 既定分離原則）。

### 6.4 平台分類之 source of truth

| 設定 | 檔案 | 範圍 |
|---|---|---|
| 全站可用分類 | `content/settings/categories.json` | 全部出口共用 |
| 全站可用標籤 | `content/settings/tags.json` | 全部出口共用 |
| Per-post 分類 / 標籤 | frontmatter `category` / `tags` | per-post |
| Blogger page/post 型態 | `.publish.json` `blogger.type` | Blogger 端 |

---

## §7 邊界聲明

- ✅ 本文件為**方向綱領**；不修改 source code / build script / content
- ✅ 本文件**不**取代 CLAUDE.md §1 / §2 / §3 / §11 / §17；屬補強說明
- ✅ 本文件**不**啟動 Admin UI 實作（per `docs/admin-local-boundary-pre-analysis.md` §3 + `docs/admin-mvp-pre-analysis.md` §7 之分階段規劃）
- ✅ 本文件**不**改變既有 frontmatter / publish.json / fb.md schema
- ✅ 本文件**不**改變 GA4 / AdSense / FB promotion 實作位置
- ✅ 本文件**不**規範未來新出口之 implementation；屬高階方向
- ✅ 本文件**不**破壞當前 stable snapshot

---

## §8 Cross-links

- `CLAUDE.md` §1 / §2 / §3 / §11 / §16 / §17 / §29（系統規範主檔）
- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界政策 + GA4/Ads/UTM placement）
- `docs/admin-mvp-pre-analysis.md`（Admin MVP 詳規劃）
- `docs/architecture.md`（整體架構）
- `docs/content-schema.md`（content 欄位字典）
- `docs/publish-bundle.md`（sidecar bundle 三檔結構）
- `docs/publish-json-schema.md`（.publish.json schema）
- `docs/fb-sidecar-schema.md`（FB sidecar 欄位）
- `docs/seo-ga4-adsense.md`（SEO / GA4 / AdSense 設定）
- `docs/related-links-schema.md`（相關連結 schema）
- `docs/promotion-export.md`（FB promotion export）
- `docs/phase-10-completion-report.md`（Phase 10 GitHub Pages 部署系列收尾）

---

（本文件結束）
