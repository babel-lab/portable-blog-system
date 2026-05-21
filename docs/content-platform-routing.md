# Content platform routing + GA impact 規格

本文件為 **Phase 20260521-pm-49** 之 docs-only 落地；定義內容平台分發、分類 / 標籤 taxonomy、Admin read-only 欄位、GA 設定 impact。屬規格參考；後續實作對齊由獨立 phase 啟動。

⚠️ **本文件不修改 source code / content / build / dist / deploy**；分類仍未定案；不進入硬性規則。

對應上層：
- `CLAUDE.md` §2（兩平台定位）/ §11（contentKind 列舉值）/ §14-§15（標籤 / 分類管理規則）/ §16.4（cross-link UTM）
- `docs/ga4-parameter-naming-registry.md`（GA4 / UTM / hostname / event registry；本文件補充其 platform routing 維度）
- `docs/ga4-enable-preflight.md` / `docs/20260521-end-of-day-report.md` §15-§16（GA4 啟用流程）
- `content/settings/categories.json` / `content/settings/tags.json`（既有 taxonomy 設定；本文件不改）
- `content/settings/site.config.json` `githubSiteUrl`（per `siteBasePath()` 推導鏈）

---

## §1 Platform routing 概念

### 1.1 平台角色

| 平台 | hostname | 角色 | 流量現況 |
|---|---|---|---|
| **Blogger** | `babel-lab.blogspot.com` | 既有公開站；AdSense 收益來源；生活 / 書評 / 教育下載 / 漫畫主站 | 既有流量；GA4 已接 |
| **GitHub Pages**（當前）| `babel-lab.github.io/portable-blog-system/` | 技術 / 心得 / 經營筆記主站；可本機 build / preview | pm-45 起 GA4 已啟用；流量待累積 |
| **GitHub Pages**（未來 custom domain）| _未定_ | 正式公開站（AdSense 申請 + 廣告主機）| 屬 5 月底 / 6 月初 migration |

### 1.2 frontmatter 平台相關欄位

per `.md` frontmatter / `CLAUDE.md` §3.1 範例：

| 欄位 | 用途 | 取值 |
|---|---|---|
| `site` | 文章「**所在**」資料夾來源 | `github` / `blogger`（per `content/{site}/posts/`）|
| `primaryPlatform` | 此文章之 **canonical 平台**；SEO canonical URL 對齊 | `github` / `blogger` |
| `publishTargets.blogger.enabled` | 是否輸出到 Blogger（含 full / summary / redirect-card mode）| true / false |
| `publishTargets.blogger.mode` | Blogger 輸出形式 | `full` / `summary` / `redirect-card` |
| `publishTargets.github.enabled` | 是否輸出到 GitHub Pages | true / false |
| `publishTargets.github.mode` | GitHub 輸出形式 | `full`（目前唯一）|
| `canonical` | canonical URL（per `seo.config.json` 推導；可手填 override）| `"auto"` / 絕對 URL |

### 1.3 平台分發決策範例（**建議；非強制**）

| contentKind | 預設 primary | 預設 publishTargets | 備註 |
|---|---|---|---|
| `tech-note` | github | github only（或 + blogger summary）| 技術筆記主站於 GitHub |
| `book-review` | blogger | blogger + github summary | Blogger 為 AdSense 主站；GitHub 可加摘要導流 |
| `download` | blogger | blogger only | 教具下載；Blogger 為主 |
| `comic` | blogger | blogger only | 四格漫畫；Blogger 為主 |
| `life-note` | blogger | blogger + github summary | 生活文章；可 GitHub 加技術視角 summary |
| `page` | 視內容 | 視內容 | 固定頁；如 About / 工具索引 |
| `post`（通用）| 視內容 | 視內容 | 預設留作者決定 |

### 1.4 不把分類永久綁死到某平台之原則

| 原則 | 說明 |
|---|---|
| **每篇文章獨立配置** | `primaryPlatform` + `publishTargets` 為 per-post；不由 category / tags 自動推導 |
| **平台 migration 不影響 frontmatter** | 即使將 `tech-note` 從 GitHub 搬到 Blogger，只需改該文之 `primaryPlatform` 與 `publishTargets`；無需改 categories.json / tags.json |
| **migration 軌跡保留** | 透過 `platformMigrationNote` 欄位（**未來 schema 候選**；尚未引入）記錄遷移歷史；不破壞既有 publishedUrl |
| **Cross-post 不重複內容**| 即使雙平台都 enabled，summary mode 可只放摘要 + 導流；避免 Google duplicate content penalty |

### 1.5 platformMigrationNote 候選欄位（未來 schema）

⚠️ **尚未引入 frontmatter schema**；屬 future candidate；不在本批 scope。

候選結構：
```yaml
platformMigrationNote:
  movedFrom: "github"             # 從哪個平台搬過來
  movedAt: "2026-06-15"           # 遷移日期
  originalPublishedUrl: "https://babel-lab.github.io/.../"   # 舊 URL（保留供 redirect 或 audit）
  reason: "blogger-traffic-focus" # 遷移理由（短字串）
```

---

## §2 Category / tag taxonomy 管理

### 2.1 原則

| 維度 | 規則 |
|---|---|
| `category` | 主分類；**單一字串**；per 文章 1 個 |
| `tags` | 多標籤；**array of string**；per 文章 0~N 個 |
| 集中管理檔 | `content/settings/categories.json` + `content/settings/tags.json`（per `CLAUDE.md` §14 / §15）|
| 與 publish platform 之關係 | 可有 **default suggestion**（per §1.3）；但允許 per-post override |
| 平台綁定 | ❌ **不綁死**（per §1.4）|

### 2.2 建議分類（草案；**未定案**）

⚠️ 本批不寫入 `categories.json`；僅為 routing 推論參考：

| category（建議）| 預設 primary | 預設 publishTargets | 性質 |
|---|---|---|---|
| `tech-note` | github | github only | 技術筆記 / 開發筆記 |
| `design` | github | github + blogger summary | 設計筆記（Figma / SCSS / DS）|
| `book-review` | blogger | blogger + github summary | 書評；含心得 + 引用 |
| `download` | blogger | blogger only | 教具下載 |
| `life-note` | blogger | blogger | 生活文章 |
| `life-comic` | blogger | blogger | 四格漫畫 |
| `creator-note` | blogger | blogger + github | 創作 / 經營筆記 |

### 2.3 建議標籤命名

per `CLAUDE.md` §14 + `content/settings/tags.json`：
- lowercase（per pm-48 §3）
- 單字或 kebab-case（`github-pages` / `book-review` / `vite`）
- 集中管理；frontmatter `tags` 須使用已存在之 tag id 或 slug

### 2.4 目前分類仍未定案

⚠️ **本文件之分類建議屬 routing 參考**；不進入硬性規則。實際 `categories.json` 內容由 user 後續決定；本批不修改該檔。

---

## §3 Admin read-only 欄位建議

未來 Admin overview detail panel 應顯示之 platform / routing 相關欄位（read-only；不寫入）：

| 欄位 | 來源 | 顯示位置建議 |
|---|---|---|
| `category` | `.md` frontmatter | identity / classification section |
| `tags` | `.md` frontmatter | 同上 |
| `primaryPlatform` | `.md` frontmatter | platform routing section（新）|
| `publishTargets.blogger.enabled / .mode` | `.md` frontmatter | platform routing section |
| `publishTargets.github.enabled / .mode` | `.md` frontmatter | 同上 |
| `canonicalTarget` | derived（per primaryPlatform + publishedUrl）| SEO section |
| `bloggerStatus` | `.publish.json` 之 `blogger.status` | platform routing section |
| `githubStatus` | derived（推測：build success / sitemap 入列）| 同上 |
| `finalUrl` / `platformUrl` | derived（per primary platform + publishedUrl）| platform routing section |
| `gaHostname` | derived（per primary platform → `babel-lab.blogspot.com` / `babel-lab.github.io` / future custom domain）| GA section（新）|
| `utmPreviewUrl` | derived（per `promotion.config.json` UTM rules + slug）| FB promotion section |
| `platformMigrationNote` | `.md` frontmatter（**未來 schema**；尚未引入）| platform routing section |

### 3.1 與既有 Admin overview 之關係

per `docs/admin-1-completion-report.md` §13 / pm-31 fixture：

| 既有顯示 | 本批建議擴充 |
|---|---|
| Identity / Dates / SEO / Blogger channel / GitHub channel / FB promotion / FB Post (read-only metadata) / Related / other links / Completeness | 加 **Platform Routing** section（含 §3 之 12 欄位）|

→ 屬未來 Admin extension；不在本批 scope。

### 3.2 read-only 原則

當前所有 platform / routing / GA / UTM 相關欄位**僅 read-only 顯示**；user 編輯仍需用 VS Code 手改 `.md` frontmatter / `.publish.json`；不開放 Admin write。

---

## §4 未來 Admin write 候選

⚠️ 屬未來；阻擋條件多；本批不啟動。

### 4.1 啟動條件

| 條件 | 說明 |
|---|---|
| 分類成熟後 | `categories.json` 內容定案；不再頻繁變動 |
| Schema validation 就位 | `validate-content.js` 須驗證 category / tags / primaryPlatform / publishTargets 合法性 |
| Drift 防護機制 | 編輯 Blogger / GitHub URL 或 canonical 時須避免 publishedUrl drift（per `docs/admin-2-write-pre-analysis.md`）|
| User 表態 | user 明示需要 Admin write 介面（取代純 VS Code 編輯）|

### 4.2 Admin write 候選範圍

| 範圍 | 性質 | 風險 |
|---|---|---|
| 編輯 category | source（`.md` frontmatter）| 🟡 中（需 categories.json 對齊）|
| 編輯 tags | source | 🟡 中 |
| 編輯 publishTargets | source | 🟡 中 |
| 編輯 primaryPlatform | source | 🟡 中（影響 canonical / SEO）|
| 編輯 platformMigrationNote | source | 🟢 低（純註記；不影響 build）|
| 編輯 publishedUrl | source | 🔴 高（per `CLAUDE.md` §24；屬高敏感；建議仍人工編輯）|

### 4.3 對齊既有 Admin SEO write 之 pattern

per `docs/admin-2-write-pre-analysis.md` / `docs/admin-2b1-completion-report.md`：
- 採 temp+rename atomic write
- 採 dry-run default + Apply button
- 採 pre-write + post-write validate
- 屬 future phase；非本批

---

## §5 GA 值是否需要改

### 5.1 measurementId 不變

`G-C77SMPF8VD`（per pm-43 / `ga4.config.json`）**永久不變**（per pm-48 §1）。

custom domain migration / hostname 變更 / Data Stream URL 更新等皆**不**觸發 measurementId 更換。

### 5.2 custom domain migration 須處理之 GA / SEO 相關事項

per pm-46 §16.6 之 future migration checklist；本批補充細節：

| 項目 | 觸發時機 | 處理層級 | 預估動作 |
|---|---|---|---|
| **`content/settings/site.config.json` `githubSiteUrl`** | custom domain 上線 | source | 改 1 處欄位；rebuild 自動帶動下游推導 |
| **siteUrl 推導鏈** | 同上 | derived（無源頭改動）| canonical / og:url / JSON-LD url / sitemap `<loc>` / robots.txt Sitemap reference 皆自動沿用 `githubSiteUrl`；只需 rebuild |
| `dist/sitemap.xml` | rebuild | 自動 | `<loc>` 全部更新；entry 數視 noindex / draft 過濾 |
| `dist/robots.txt` | rebuild | 自動 | Sitemap reference 自動更新 |
| `siteBasePath()` 推導 | rebuild | 自動 | 若 custom domain 為 root mount（`https://blog.example.com/`）→ basePath = `''`；若仍 sub-path → 保持當前 `/portable-blog-system` |
| **GA4 Data Stream Website URL** | custom domain 上線 | GA4 後台（外部）| user 至 GA4 → Admin → Data Stream → 編輯 Website URL；measurementId 不變 |
| **Google Search Console**（GSC）| custom domain 上線 | GSC 後台（外部）| 新增 custom domain property；verify ownership（DNS TXT / HTML meta tag）；submit 新 sitemap |
| **Google AdSense 申請** | custom domain + HTTPS Enforce 完成 | AdSense 後台 + 程式碼 | 等 GitHub Pages DNS check + TLS provisioning + Enforce HTTPS 完成；申請 AdSense；通過後加入 AdSense script + slot HTML |
| **`ads.txt`** | AdSense 通過 | source（`public/ads.txt` 或 dist root）| AdSense 通過後於網站 root 放 `ads.txt`；無 ad fraud 才需 |
| **Blogger AdSense** | 不變動 | n/a | Blogger 既有 AdSense 設定不受 custom domain migration 影響 |

### 5.3 不需處理之項目

| 項目 | 理由 |
|---|---|
| **measurementId** | per pm-48 §1；permanent |
| **GA4 property / Data Stream 本體** | 不需重建；只需更新 Website URL metadata |
| **GA4 events / params** | per pm-48 §6 既有 9 events + 擴充建議；不因 hostname 變更而改 |
| **既有 Blogger UTM** | Blogger 端 cross-link / FB promotion UTM 不受 GitHub custom domain 影響 |
| **既有 sitemap 內容**（除 URL prefix）| sitemap 之 lastmod / 結構 / changefreq 等規格不變 |

### 5.4 hostname allowlist 是否同批啟動

❌ **否**。per pm-39 §5：
- 當前 `isProdBuild=true` gating 已涵蓋 dev / build 主要 split
- preview mode 邊界當前可接受
- 觀察 1-2 週 GA4 資料；若發現 preview hostname event 污染嚴重 → 另啟 phase
- custom domain migration 期間若混入 staging hostname → 可由 GA4 後台 hostname filter 排除（無需 source 改動）

---

## §6 與 pm-48 ga4-parameter-naming-registry 之關係

| 維度 | pm-48 registry 主管 | 本文件補充 |
|---|---|---|
| measurementId | ✅ §1（永久共用）| §5.1 重申不變 |
| hostname 規範 | ✅ §2 | §1.1 補充 platform 角色對應 hostname |
| UTM source / medium / campaign / content | ✅ §3 ~ §4 | §3 之 `utmPreviewUrl` 預設帶 UTM |
| GA4 event | ✅ §6 | 不擴增；引用既有 9 events |
| **Platform routing**（primaryPlatform / publishTargets / canonicalTarget）| ❌ 不涵蓋 | ✅ **本文件 §1 主管** |
| **Category / tag taxonomy 與 platform 之 default suggestion**| ❌ 不涵蓋 | ✅ **本文件 §2 主管** |
| **Admin read-only 欄位（platform routing 維度）**| ❌ 不涵蓋 | ✅ **本文件 §3 主管** |
| GA setting impact under custom domain migration | 部分 §1 / §2 | ✅ **本文件 §5 詳細列**|

### 6.1 兩文件分工

| 文件 | 主管範疇 |
|---|---|
| **`docs/ga4-parameter-naming-registry.md`**（pm-48）| GA4 measurementId / UTM 命名 / hostname / event / FB metadata UTM 派生 — **single source of truth for analytics naming** |
| **`docs/content-platform-routing.md`**（本文件 pm-49）| content type × platform 分發 / category & tag default suggestion / Admin read-only 欄位 / GA setting impact under custom domain migration — **single source of truth for content × platform routing** |

兩文件 cross-reference；不重複內容；以 `Cross-links` section 互引。

---

## §7 邊界聲明

- ✅ 本文件**僅為規格參考 / 規劃文件**；不改 source code / settings / build / dist / deploy
- ✅ 本文件**不**啟動 Admin write（屬 §4 候選；未來 phase）
- ✅ 本文件**不**啟動 custom domain migration（屬 5 月底 / 6 月初 phase；per pm-46 §16.6）
- ✅ 本文件**不**修改 categories.json / tags.json（分類仍未定案；per §2.4）
- ✅ 本文件**不**改 GA4 measurementId（永久共用 `G-C77SMPF8VD`）
- ✅ 本文件**不**啟動 AdSense / `ads.txt`（屬 custom domain 後 phase）
- ✅ 本文件**不**啟動 hostname allowlist（per §5.4）
- ✅ 不 push gh-pages；不 deploy

---

## §8 Cross-links

- `docs/ga4-parameter-naming-registry.md`（pm-48）— GA4 / UTM / hostname / event 命名 single source of truth
- `docs/ga4-enable-preflight.md`（pm-10 / pm-39）— GA4 啟用流程 + 既有設定盤點
- `docs/20260521-end-of-day-report.md` §15-§16 — GA4 enable execution series 紀錄
- `docs/admin-1-completion-report.md` §13 / `docs/admin-2-write-pre-analysis.md` — Admin overview 既有顯示 + 未來 write 設計
- `CLAUDE.md` §2（兩平台定位）/ §11（contentKind）/ §14（標籤管理）/ §15（分類管理）/ §16.4（cross-link UTM）/ §24（Blogger 發布 URL 回填）
- `content/settings/categories.json` / `content/settings/tags.json` — 既有 taxonomy（本批不改）
- `content/settings/site.config.json` `githubSiteUrl` — siteUrl 推導源
- `content/settings/ga4.config.json` — measurementId + events 列表
- `content/settings/promotion.config.json` — FB UTM 派生規則

---

（本文件結束）
