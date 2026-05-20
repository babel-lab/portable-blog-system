# SEO Indexing Rules

本文件為 **SEO indexing policy**（搜尋引擎收錄規則）之集中規範。屬規則 / 規範性文件；**本批僅記錄規則，未實作 sitemap.xml / robots.txt / robots meta 之 source 變動**。實作落地拆批留待後續 phase。

對應上層文件：
- `CLAUDE.md` §21 SEO 規則（既有 SEO 高階要求）
- `docs/seo-ga4-adsense.md` §3.4 noindex 規則（既有 noindex 實作；目前 `pages/404` + `design-system/*` 已加 `noindex,nofollow`）
- `docs/seo-ga4-adsense.md` §4 sitemap.xml / robots.txt（既有實作；sitemap 由 `npm run build:sitemap` 產出；robots 含 `Disallow:` + `Sitemap:` 行）
- `docs/promotion-export.md`（FB 推廣文案；漏斗前段相關）
- `docs/publish-workflow.md`（發布流程）

---

## §1 背景與範圍

### 1.1 為何需要 indexing policy

部分頁面是「**特定拿來導流的漏斗後段頁**」，例如教具下載頁。使用者期望流程：

```
搜尋 / 社群 → 進入介紹頁 / 文章頁 / 活動頁（前導頁）
            → 跳轉到下載頁 / 資源領取頁（後段頁）
```

若 Google 直接收錄**下載頁**（後段頁），使用者可能：
- 跳過前導頁 → 失去內容脈絡 / 流量漏斗損失
- 看不到 affiliate / AdSense / 社群引導等 monetization 與成長機制
- 直接拿走資源後不認識作者 / 沒留下 GA4 funnel 軌跡

因此這類「**漏斗後段頁**」需要支援 **`noindex,follow`**：頁面對使用者可公開訪問，但對搜尋引擎宣示「不要收錄此頁面」。

### 1.2 本批範圍

- ✅ 集中記錄 indexing policy 之核心原則
- ✅ 提供 page type × indexing 對照表
- ✅ 說明 robots.txt 與 robots meta 之分工
- ✅ 預告後續實作 phase（不在本批落地）
- ❌ **不**實作 sitemap.xml / robots.txt / robots meta（屬未來 phase）
- ❌ **不**動 source / EJS / build script / admin / dist / deploy

---

## §2 核心原則（7 條）

### 2.1 規則總列

| # | 規則 |
|---|---|
| 1 | **頁面可公開訪問，不代表一定要被搜尋引擎 index**。可訪問性（HTTP 200 + 無 auth）與可收錄性（robots meta `index,follow`）為**兩個獨立決策**。 |
| 2 | **導流漏斗後段頁，例如教具下載頁，應支援 `noindex`**。使用者可透過前導頁正常進入；搜尋引擎不直接列入結果。 |
| 3 | 後段頁建議 metadata 語意：**`robots: noindex,follow`** + **sitemap exclude**。`follow` 保留讓爬蟲跟著出向連結（保住內外連結之 PageRank flow），但本頁不被索引。 |
| 4 | **前導頁 / 介紹頁 / 正式文章頁仍應 `index,follow`，並進 sitemap**。屬主要 SEO 入口；保有完整 organic 搜尋價值。 |
| 5 | **Admin / preview / test / draft / private 類頁面應 `noindex,nofollow`，且不進 sitemap**。屬內部 / 開發 / 草稿狀態；對外部使用者與爬蟲皆無 SEO 價值。 |
| 6 | **`robots.txt` 不應作為單頁 `noindex` 的主要方法**。`robots.txt` 之 `Disallow:` 僅阻止爬取，**不**阻止索引（Google 仍可能因外部連結收錄 URL 但顯示「無 description」）；正確的單頁 `noindex` 應用 HTML `<meta name="robots" content="noindex,...">`。 |
| 7 | **sitemap.xml / robots.txt 平台分流與匯總規則留待後續 phase 設計**，不在本批實作。包含 Blogger / GitHub Pages 之多平台 sitemap 拆分、跨平台 canonical 一致性、多 host 之 `Sitemap:` 行設計等。 |

### 2.2 規則邏輯關係

- 規則 1 為總則（可訪問 ≠ 可收錄）
- 規則 2-5 為 page type × indexing 對照之四種主要分類
- 規則 6 為 mechanism 釐清（避免 robots.txt 誤用）
- 規則 7 為未來範圍預告

---

## §3 Page type × indexing policy 對照表

| Page type | robots meta | sitemap inclusion | purpose / note |
|---|---|---|---|
| **正式文章頁**（article post；`status: published`；`contentKind` 為 `post` / `tech-note` / `book-review` / `comic` / `life-note`）| `index,follow` | ✅ include | 主要 SEO 入口；保有完整 organic 搜尋價值；對應 `docs/seo-ga4-adsense.md` §4.2 之 sitemap loc |
| **導流前導頁**（介紹頁 / 活動頁 / 主題目錄頁；屬使用者搜尋目標之入口）| `index,follow` | ✅ include | 同正式文章頁；屬 funnel 前段；提供脈絡 + monetization + 引導至後段頁 |
| **教具下載頁 / 資源領取頁**（funnel 後段；`contentKind: download` 或具明顯 download / 領取 CTA 之 page）| **`noindex,follow`** | ❌ exclude | 漏斗後段；使用者應透過前導頁進入；搜尋引擎不直接收錄；`follow` 保留出向連結之 PageRank flow |
| **Admin / preview / test**（如 `/admin/`；dev-mode-only 頁；測試頁；preview iframe）| **`noindex,nofollow`** | ❌ exclude | 內部工具；不對外公開；目前 `/admin/` 已透過 dev-mode-only render + early cleanup 機制天然不入 prod dist（per `docs/admin-1-completion-report.md` §5），無需 robots meta；但若未來有部分 admin / preview 頁進 prod，應加 `noindex,nofollow` |
| **draft / private**（`status: draft` 之文章；未發布之 sidecar；私人頁面）| **`noindex,nofollow`** | ❌ exclude | 草稿 / 私人；對外無 SEO 價值；目前 draft 透過 status filter 不入 dist（per `CLAUDE.md` §23）；若未來有 share preview link 機制，需確保該 link 加 `noindex,nofollow` |
| **404 / error 頁** | `noindex,nofollow` | ❌ exclude | 既已實作（per `docs/seo-ga4-adsense.md` §3.4）|
| **design-system / 工具頁**（如 `/design-system/`）| `noindex,nofollow` | ❌ exclude | 既已實作（per `docs/seo-ga4-adsense.md` §3.4 + §4 之 robots.txt `Disallow: /design-system/`）|

---

## §4 robots.txt 與 robots meta 之分工

依規則 6，二者**不可互相替代**：

| 機制 | 作用 | 限制 |
|---|---|---|
| `robots.txt` `Disallow:` | 阻止爬蟲**爬取**該路徑 | **不**阻止索引；Google 仍可能因外部連結收錄 URL，但因無爬取無法顯示 description，會顯示「網頁無法提供描述」之搜尋結果片段 |
| HTML `<meta name="robots" content="noindex,...">` | 阻止爬蟲**索引**該頁面 | 需要爬蟲能爬取到該頁面才能看到 meta；故與 `robots.txt` `Disallow:` 不可同時用於同一路徑（會抵消） |

### 4.1 漏斗後段頁之正確姿勢

- ✅ 使用 HTML `<meta name="robots" content="noindex,follow">`
- ❌ 不應在 `robots.txt` 加 `Disallow:`（會阻止爬取 → meta 無從生效）
- ❌ 不應僅靠 sitemap exclusion（sitemap 只是「主動提交」，不在 sitemap 不代表不會被收錄）

### 4.2 既有實作對照

per `docs/seo-ga4-adsense.md` §3.4 + §4：

- `/404.html`：robots.txt `Disallow:` + EJS head `noindex,nofollow` meta（雙保險；404 本來爬不到 description 無妨）
- `/design-system/`：robots.txt `Disallow: /design-system/` + EJS head `noindex,nofollow` meta（同上）
- `/admin/`：天然不入 prod dist（dev-mode-only render + early cleanup）；無需 robots.txt / meta（per `docs/admin-1-completion-report.md` §5）

→ 既有實作之模式**對等於本 §3 對照表之「Admin / preview / test」與「404 / design-system」rows**；未來新增「漏斗後段頁」之 `noindex,follow` 屬**新增之第三類模式**（meta only，不加 `Disallow:`）。

---

## §5 與既有實作之對照

| 既有實作 | 對應本文件規則 |
|---|---|
| `pages/404` / `design-system/*` 已加 `noindex,nofollow` meta（per `docs/seo-ga4-adsense.md` §3.4） | ✅ 對齊規則 5（admin / preview / test）+ §3 對照表之 404 / design-system rows |
| `robots.txt` 含 `Disallow: /design-system/` + `Disallow: /404.html`（per §4） | ✅ 對齊 §4.2 既有實作對照 |
| `sitemap.xml` 不含 admin（per `docs/admin-1-completion-report.md` §6）| ✅ 對齊規則 5 |
| draft 文章透過 status filter 不入 dist（per `CLAUDE.md` §23）| ✅ 對齊規則 5（draft / private）|
| 正式文章頁（`status: published` 或 `ready`）含 `index,follow`（_tokens default；無顯式 noindex）| ✅ 對齊規則 4 |
| **漏斗後段頁 / 教具下載頁之 `noindex,follow` 機制** | ❌ **尚未實作**；屬未來 phase（per §6） |

---

## §6 後續實作 phase（preview；不在本批）

依本 indexing policy 之實作需求，建議未來拆批：

| Phase 候選 | 範圍 | 風險 |
|---|---|---|
| **SEO-1** ✅ **已落地（Phase 20260520-seo-1）** | `contentKind: download` post 透過 `buildSeoForPostDetail` 在 spread `commonSeo` 後覆寫 `seo.robots = 'noindex, follow'`（per `meta-tags.ejs` 既有 `seo.robots` override 機制）；`build-sitemap.js` `buildEntries()` for-loop 內 skip `contentKind === 'download'` 之 post；測試樣本：`content/github/posts/20260504-portable-blog-system-mvp.md` contentKind 由 `tech-note` 改為 `download`；sitemap entries 由 15 減至 14 | 🟢 低（純 additive；不影響既有 indexed 文章） |
| **SEO-2** ✅ **已落地（Phase 20260520-seo-2）** | frontmatter 新增 nested `seo.indexing` 欄位（合法值：`index` / `noindex-follow` / `noindex-nofollow`）；`buildSeoForPostDetail` 與 `build-sitemap.js` 同採 precedence：(1) `post.seo.indexing` explicit (2) `contentKind === 'download'` fallback (SEO-1) (3) default `index, follow` + sitemap include；`validate-content.js` 新增 `invalid-seo-indexing` warning 規則（對齊 `invalid-content-kind` 之 warning severity 慣例）；測試樣本：`content/github/posts/20260504-portable-blog-system-mvp.md` 加 `seo.indexing: noindex-follow`（與既有 SEO-1 contentKind=download 同向但走 SEO-2 路徑） | 🟡 中（schema additive；validate baseline 0/22/17 不退步 — 無既有 post 含 invalid seo.indexing）|
| **SEO-3** ✅ **已落地（Phase 20260520-seo-3）** | `src/views/blogger/blogger-copy-helper.ejs` 新增 [14] **SEO indexing guidance** 區塊；讀取 SEO-2 precedence 解析後之 indexing 值（`post.seo?.indexing` → `contentKind=download` → default `index, follow`），顯示對應 Blogger 端 robots meta 建議文案 + 來源 + 用途說明；**明確標示「manual check；非自動套用」**（因 Blogger 平台之 head robots meta 由 Blogger 主題層 / 後台「搜尋設定 → 自訂 robots 標頭標記」控制，本系統不能直接 inject）；測試樣本：`content/github/posts/20260504-portable-blog-system-mvp.md` 之 `publishTargets.blogger.enabled` false → true 以啟用 Blogger 端 build；本批未動 build-blogger.js / Blogger sitemap / robots.txt | 🟡 中（Blogger 後台需作者 manual 對應設定；本系統提供 read-only guidance） |
| **SEO-3-b** ✅ **已落地（Phase 20260520-seo-3-b）** | `src/views/blogger/blogger-publish-checklist.ejs` SEO 檢查 § 內新增 indexing manual check rows：(1) 必出：「SEO indexing guidance 已對照」+ 建議值 + 來源；(2) 條件出（僅 noindex 類）：「Blogger 後台『搜尋設定 → 自訂 robots 標頭標記』已對應設定」+ 用途說明；(3) 必出：「詳細 guidance 對照 copy-helper [14] / docs/seo-indexing-rules.md」；採與 copy-helper [14] 同套 SEO-2 precedence 但文案更短適合勾選；不誤導「已自動套用」；本批不改 build-blogger.js / copy-helper / SEO 判斷邏輯 / sitemap / robots.txt | 🟢 低（純 EJS template additive；不影響 build 邏輯） |
| **SEO-4**（提案）| 多平台 sitemap 拆分 / 跨平台 canonical 一致性（per 規則 7）| 🔴 高（涉 cross-platform 設計）|

**本 docs-only batch 不啟動任一 SEO-N 實作**；待 user 對 indexing 規則確認後再拆批。

---

## §7 本批不做事項

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 src / | ✅ `src/**` 完全未動 |
| 2 | 不改 content / | ✅ `content/**` 完全未動 |
| 3 | 不改 dist / | ✅ `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` 未動 |
| 4 | 不改 `.fb.md` | ✅ 未動 |
| 5 | 不改 sitemap.xml | ✅ 未動 |
| 6 | 不改 robots.txt | ✅ 未動 |
| 7 | 不改 robots meta（EJS head）| ✅ 未動 |
| 8 | 不改 build scripts | ✅ 未動 |
| 9 | 不改 admin UI | ✅ 未動 |
| 10 | 不改 package / config | ✅ 未動 |
| 11 | 不改 deploy repo | ✅ 未動 |
| 12 | 不 push | ✅ 未 push |
| 13 | 不啟動 SEO-1 / SEO-2 / SEO-3 / SEO-4 任一實作 | ✅ 僅 §6 預告 |

---

## §8 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/**` | ❌ 未動 |
| `content/**` | ❌ 未動 |
| `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` | ❌ 未動 |
| sitemap.xml / robots.txt（線上效果）| ❌ 未動 |
| robots meta（EJS head）| ❌ 未動 |
| Deploy repo | ❌ 未動 |
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台 | ❌ 未動 |
| Admin 既有功能 | ❌ 未動 |
| validate baseline `0/22/17` | ❌ 預期未動（本批未動 validate rules 或 content）|

---

## §9 邊界聲明

- ✅ 本文件**僅為 indexing policy 規範**；不改任何 source / build / dist / deploy
- ✅ 本文件**不**啟動 SEO-N 任一實作 phase
- ✅ 本文件**不**裁決 frontmatter 之 `seo.indexing` 欄位 schema（屬 SEO-2）
- ✅ 本文件**不**動 Blogger SEO 處理（屬 SEO-3）
- ✅ 本文件**不**動 sitemap.xml 既有產出 / robots.txt 既有內容 / EJS head 既有 noindex meta
- ✅ 本文件**不** push

---

## §10 Cross-links

- `CLAUDE.md` §21 SEO 規則（既有高階要求）
- `docs/seo-ga4-adsense.md` §3.4 noindex 規則 / §4 sitemap & robots / §10 相關檔案
- `docs/admin-1-completion-report.md` §5 admin dev-mode-only 邊界 / §6 isolation 驗證
- `docs/promotion-export.md` FB 推廣文案（漏斗前段相關）
- `docs/publish-workflow.md` 發布流程
- `CLAUDE.md` §23 發布狀態規則（draft / ready / published / archived）

---

（本文件結束）
