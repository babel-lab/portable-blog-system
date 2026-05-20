# SEO-4 Sitemap Split Pre-Analysis

本文件為 **Phase SEO-4 多平台 sitemap 拆分**之事前盤點與規劃。屬純 docs / 純規劃；**本批不修改 build script / sitemap 輸出 / 任何 source；不跑 build；不新增功能**。實作落地拆批留待 user 批准後之 SEO-4-a ~ SEO-4-e 系列。

對應上層文件：
- `docs/seo-indexing-rules.md`（SEO-2 indexing policy；SEO-2 系列已完整收尾，per §11）
- `docs/seo-ga4-adsense.md` §3.4 noindex 規則 / §4 sitemap.xml & robots.txt（既有實作）
- `CLAUDE.md` §21（SEO 規則高階要求）

---

## §1 背景與範圍

### 1.1 為何需要 SEO-4

當前 sitemap 設計（per `src/scripts/build-sitemap.js`）為**單一檔 `dist/sitemap.xml`**，只涵蓋 GitHub Pages 端之 URL。隨內容增長與多平台需求，可能出現：

- **URL 數量爆量**（Google 建議單一 sitemap 上限 50,000 URL / 50 MB；遠未到但可預先設計）
- **多平台 sitemap 不一致**（Blogger 後台自帶 sitemap.xml；本系統未對 Blogger 提交 sitemap，可能 cross-platform 內容 SEO 角色模糊）
- **多 content-type 混雜**（posts / categories / tags / 未來 download 頁 / 未來其他 page type）
- **未來新 host / 子域名**（如自訂網域 + Blogger 主機 + 其他）需 sitemap index 統籌
- **cross-source mirror 之 canonical 歸屬**（per 既有 `loadGithubPosts` 之 cross-source aggregator；Blogger-primary 文章鏡射至 GitHub 端 sitemap，但 canonical 仍指 Blogger → 可能 SEO 訊號分散）

### 1.2 本批範圍

- 盤點現況（sitemap 來源 / 內容 / 數量推測）
- 列拆分候選方案（單一 / sitemap index / per-platform / per-content-type）
- 列收錄規則（per-field decision matrix）
- 明確邊界（哪些頁進 / 不進 sitemap）
- 風險點 + 風險分級
- 最小實作 phase 拆批（SEO-4-a ~ SEO-4-e）
- 未來實作後之驗證方案

### 1.3 不在本批

- 任何 source / SCSS / EJS / build / dist / deploy 修改
- 跑 build（per spec）
- 新增 fixtures
- 動 validator
- 裁決 user 設計師之色票 / canonical 細節 / robots.txt 多 host 結構

---

## §2 現況盤點

### 2.1 sitemap 由哪個 script 產生

**`src/scripts/build-sitemap.js`**（per package.json `build:sitemap` script；含於 `postbuild`）：

- 從 `loadGithubPosts({ settings })` 取 posts（含 GitHub-native + Blogger-primary cross-source mirror posts；per Phase 10-sitemap-cross-source-fix-a 註解）
- 透過 `collectCategoryMap()` / `collectTagMap()` 收集有 post 之 category / tag
- 在 `buildEntries()` 內按以下順序加 entries：
  1. home（`{base}/`）
  2. post-list（`{base}/posts/`）
  3. post-detail（per post；含 SEO-1/SEO-2 之 contentKind=download / seo.indexing=noindex-* 排除邏輯）
  4. category-list（若有 category 有 post）+ per-category
  5. tag-list（若有 tag 有 post）+ per-tag

`build-sitemap.js` 寫入 `dist/sitemap.xml` + `dist/robots.txt`。

### 2.2 目前 dist/sitemap.xml 收錄哪些類型 URL

per SEO-3 後最後一次 build 之 14 url entries（推測組成）：

| Entry 類型 | 估計數量 | 來源 |
|---|---|---|
| home | 1 | `/` |
| post-list | 1 | `/posts/` |
| post-detail | 2 | `/posts/we-media-myself2/` + `/posts/github-pages-blog-planning/`（`portable-blog-system-mvp` 因 SEO-1 contentKind=download / SEO-2 seo.indexing=noindex-follow 已排除；`sample-book-review` 因 draft 已排除）|
| category-list | 1 | `/categories/` |
| per-category | 2 | `/categories/book-review/` + `/categories/tech-note/` |
| tag-list | 1 | `/tags/` |
| per-tag | 6 | `/tags/book-review/` / `/tags/reading-notes/` / `/tags/self-growth/` / `/tags/github/` / `/tags/vite/` / `/tags/static-site/` |
| **總計** | **14** | |

### 2.3 url count 為 14 之來源推測

合計 `1 + 1 + 2 + 1 + 2 + 1 + 6 = 14` ✅ 對齊既有 build log 之 `14 url entries`。

### 2.4 GitHub Pages 線上讀者入口與 sitemap 之關係

- `dist/robots.txt` 含 `Sitemap: {githubSiteUrl}/sitemap.xml` 行 → 爬蟲透過 robots 入口找到 sitemap
- Google Search Console / Bing Webmaster Tools 可手動 submit sitemap URL
- 讀者本身不直接訪 sitemap；sitemap 為**爬蟲 only**之 SEO 元件
- 既有 GitHub Pages 已部署於 `https://babel-lab.github.io/portable-blog-system/`（per settings.site.githubSiteUrl 推測）

### 2.5 Blogger 端 sitemap 現況

- Blogger 平台**自帶** sitemap（Blogger 後台 `/sitemap.xml`）；由 Blogger 平台自動產出
- 本系統**未對 Blogger 提交額外 sitemap**；也**不可能**（Blogger HTML 之 head 由 Blogger 主題層控制；本系統無法 inject 自製 sitemap reference）
- 本系統之 `dist-blogger/posts/{slug}/*.html` 為作者貼到 Blogger 後台之 body fragment；不參與 Blogger 平台之 sitemap

---

## §3 多平台 sitemap 拆分候選

### 3.1 拆分維度（可能組合）

| 維度 | 拆分依據 | 範例 |
|---|---|---|
| 按 content type | post-detail / pages / category-list / tag-list / download | sitemap-posts / sitemap-pages / sitemap-taxonomy |
| 按 source platform | GitHub-native / Blogger-mirror / Blogger-only | sitemap-github / sitemap-blogger |
| 按 contentKind | post / tech-note / book-review / download / page | sitemap-articles / sitemap-downloads |
| 按 sitemap index | 主 sitemap-index 引用所有 sub-sitemap | sitemap-index.xml + 子 sitemaps |

### 3.2 候選方案 A：維持單一 sitemap.xml

- **內容**：同當前；單一檔 14 entries（含 home / list / post-detail / category / tag）
- **優點**：最簡；無 cross-file 同步成本
- **缺點**：未來 URL 增多無分流；多 content-type 混雜；無 sitemap index 之 future-proof
- **適用**：post 總數 < 1000；無 cross-platform sitemap 需求
- **風險**：🟢 低（保留現狀）

### 3.3 候選方案 B：sitemap index + per-content-type

```
dist/sitemap.xml                 ← sitemap index
dist/sitemap-pages.xml           ← home / post-list / category-list / tag-list（靜態 entry-page 類）
dist/sitemap-posts.xml           ← per-post post-detail（含 cross-source mirror）
dist/sitemap-taxonomy.xml        ← per-category + per-tag
（dist/sitemap-downloads.xml）    ← 若 download 不 noindex 則獨立；當前已 noindex 故不需此 sitemap
```

- **優點**：結構清楚；爬蟲可分段拉取；單一 sitemap 大小受控
- **缺點**：build script 需重構；robots.txt 改指 sitemap index；需驗證 Google / Bing 認得 sitemap index
- **風險**：🟡 中（build / robots 變動；需驗 Search Console reads）

### 3.4 候選方案 C：sitemap index + per-platform

```
dist/sitemap.xml                 ← sitemap index
dist/sitemap-github.xml          ← GitHub-native posts + GitHub-only pages
dist/sitemap-blogger-mirror.xml  ← Blogger-primary cross-source mirror 之 GitHub-mirrored URL（仍指 GitHub Pages 之 URL，因 Blogger 端 sitemap 由 Blogger 平台自管）
```

- **優點**：cross-source 分流明確；future-proof 多 host
- **缺點**：「Blogger-mirror sitemap」名稱易混淆（其實仍是 GitHub Pages URL）；對 canonical 指 Blogger 之文章是否該入 GitHub sitemap 屬 SEO 策略決策
- **風險**：🟡 中-高（cross-source 邏輯細節易出錯；canonical 與 sitemap 不一致風險）

### 3.5 候選方案 D：sitemap index + per-content-type + per-platform 混合

- 兩維拆分（sitemap-github-posts / sitemap-github-pages / sitemap-blogger-mirror / sitemap-taxonomy）
- **優點**：最精細
- **缺點**：複雜度高；多 sitemap 互引；維護成本爆增；當前內容量遠未需此複雜度
- **風險**：🔴 高（屬過度工程化；不推薦短期落地）

### 3.6 「sitemap-blogger.xml」之質疑

spec 列「sitemap-blogger.xml：Blogger mirror / cross-link 類頁面是否應收錄」— 此 sitemap **概念上有歧義**：

- 若指「**指向 Blogger 後台 URL 之 sitemap**」：本系統不應產此（Blogger 平台自管其 sitemap；本系統重複提交反而可能 conflict）
- 若指「**指向 GitHub Pages 之 Blogger-primary 文章 mirror URL**」：屬方案 C 之 sitemap-blogger-mirror
- 若指「**Blogger 後台之 sitemap reference**」：本系統不能 inject Blogger head（per SEO-3 之 limitation）

→ 建議**避免**「sitemap-blogger.xml」之命名（語意模糊）；若採方案 C，用 `sitemap-blogger-mirror.xml` 並明寫「指向 GitHub Pages 之 Blogger-primary mirror posts」。

### 3.7 「sitemap-downloads.xml」之分析

- 當前 SEO-1 / SEO-2 已將 contentKind=download 與 seo.indexing=noindex-* 排除於 sitemap（per `build-sitemap.js` 內 for-loop 之 continue 邏輯）
- 若未來 download 頁需要被收錄（例：podcast 下載 / 公開資源），可獨立 `sitemap-downloads.xml`
- **本批不建議** sitemap-downloads.xml；維持 download 頁 noindex 邏輯（per SEO indexing policy §2.2 規則 2）

---

## §4 收錄規則（per-field decision matrix）

對 SEO-4 落地時，per-post / per-page entry 之 sitemap inclusion 應依以下欄位決定：

| 欄位 | 值 | 是否進 sitemap | 既有實作對應 |
|---|---|---|---|
| `status` | `draft` | ❌ exclude | 既有 loadGithubPosts 之 status filter |
| `status` | `ready` | ✅ include | 同上 |
| `status` | `published` | ✅ include | 同上 |
| `status` | `archived` | ❌ exclude（建議；本批無對應 sample；未來 archive policy 決定） | TBD |
| `seo.indexing` | `index` | ✅ include | SEO-2 commit `0867ca2` |
| `seo.indexing` | `noindex-follow` | ❌ exclude | SEO-2 |
| `seo.indexing` | `noindex-nofollow` | ❌ exclude | SEO-2 |
| `seo.indexing` | unset + `contentKind === 'download'` | ❌ exclude（fallback path）| SEO-1 commit `49162f5` |
| `seo.indexing` | unset + 非 download | ✅ include（default）| 既有 default |
| `primaryPlatform` | `github` | ✅ include（GitHub Pages 為 canonical host） | 既有 |
| `primaryPlatform` | `blogger` | ⚠️ 視策略（A：仍 include cross-mirror URL；B：exclude；屬方案 C 之決策） | per Phase 10-sitemap-cross-source-fix-a |
| `site` | `github` | ✅ include（與 primaryPlatform 一致時）| 既有 |
| `site` | `blogger` | ⚠️ 視 publishTargets.github.enabled；若 enabled 則 cross-mirror entry | per 既有 cross-source |
| `contentKind` | `download` | ❌ exclude（per SEO-1）| SEO-1 |
| `contentKind` | `page` | ✅ include（建議；page 屬靜態頁；應有 SEO 價值）| TBD（當前無 ready page sample）|
| `contentKind` | 其他（post / tech-note / book-review / comic / life-note） | ✅ include | 既有 default |
| `draft` (boolean) | `true` | ❌ exclude | 既有 status filter |
| `published date / date` | 有值 | sitemap `<lastmod>` 採此 | 既有 `lastmod: post.updated \|\| post.date` |
| `published date / date` | 無 | `<lastmod>` 缺；entry 仍 include | 既有 |
| **未來新欄位 `seo.sitemap.exclude: true`** | true | ❌ exclude | 建議 SEO-4 之 future field（讓作者 override 預設） |

### 4.1 規則優先序

對單一 post entry 之 sitemap 決策應採以下 cascade：

```
1. status === 'draft' → exclude（最高優先；既有）
2. seo.indexing === 'noindex-*' → exclude（per SEO-2）
3. seo.indexing === 'index' → include（per SEO-2；override 4）
4. contentKind === 'download' → exclude（per SEO-1 fallback）
5. primaryPlatform 之 cross-source 策略（per SEO-4 方案選定）
6. default → include
```

---

## §5 明確邊界

| 頁面類型 | 是否進 sitemap | 理由 |
|---|---|---|
| noindex 頁面（含 SEO-2 之 noindex-* + SEO-1 之 download） | ❌ **絕對不應**進 sitemap | sitemap 暗示「主動提交收錄」；與 noindex 矛盾；per `docs/seo-indexing-rules.md` §2.1 規則 3 |
| Blogger copy-helper（`dist-blogger/posts/*/copy-helper.txt`） | ❌ 不應進 sitemap | 屬作者貼文輔助；非對外 URL；非 HTML page |
| Blogger publish-checklist（`dist-blogger/posts/*/publish-checklist.txt`） | ❌ 不應進 sitemap | 同上；非對外 URL |
| Blogger meta.json | ❌ 不應進 sitemap | 屬內部 metadata；非對外 URL |
| Blogger article fragment（`dist-blogger/posts/*/post.html`） | ❌ 不應進 GitHub sitemap | 屬 Blogger 後台之貼用 body fragment；非 GitHub Pages 上可訪問之 URL |
| Blogger 後台已發布文章（`https://babel-lab.blogspot.com/...`） | ❌ 不應進 GitHub sitemap | 屬 Blogger 平台之 URL；由 Blogger 平台自管 sitemap |
| Admin / preview / test page（`/admin/` 等） | ❌ **絕對不應**進 sitemap | per Admin-1-c 之 dev-mode-only render；既有 `.cache/pages/admin/` early cleanup + 不入 dist；sitemap 也應無 admin entry（grep `admin dist/sitemap.xml` = 0 已驗） |
| design-system 工具頁（`/design-system/*`） | ❌ 不應進 sitemap | 既有 `_themes.scss` / `_tokens.scss` / Design System 頁屬內部工具；既有 robots.txt `Disallow: /design-system/` + meta noindex |
| 404 / error 頁 | ❌ 不應進 sitemap | 既有 noindex |
| validation fixtures（`content/validation-fixtures/**`） | ❌ **永遠不應**進 sitemap | 屬 validate-content 內部 fixtures；既有 `loadGithubPosts` / `loadBloggerPosts` 不掃 validation-fixtures dir |
| `dist-blogger/` 整體 | ❌ 與 `dist/sitemap.xml` 分開處理 | `dist-blogger/` 屬 Blogger 後台貼用輔助檔；不是對外可訪問之 GitHub Pages 站；不應與 GitHub 端 sitemap 混淆 |

### 5.1 「dist-blogger 是否與 dist sitemap 分開處理」明確結論

✅ **必須分開**。理由：

- `dist/` 之 sitemap.xml 屬 GitHub Pages 部署檔；爬蟲透過 `https://babel-lab.github.io/.../sitemap.xml` 訪問
- `dist-blogger/` 屬作者本機產出之 Blogger 貼用輔助；**不部署**；作者手動複製 HTML 至 Blogger 後台
- 兩者 base host / 訪問機制 / 部署 pipeline 完全不同
- 若硬要為 `dist-blogger/` 產 sitemap，那會是「Blogger 後台 URL 之 sitemap」，但這應由 Blogger 平台自管（per §3.6）；本系統不應重複提交

→ **SEO-4 任一方案皆只動 `dist/sitemap*.xml`；`dist-blogger/` 不涉**。

---

## §6 風險點與分級

| # | 風險 | 等級 | 說明 / 緩解 |
|---|---|---|---|
| 1 | cross-source 重複 URL（GitHub-native + Blogger-mirror 同 slug 出現於兩 sitemap）| 🔴 高 | 既有 `loadGithubPosts` 之 cross-source mirror 已存在；若拆 per-platform sitemap 需明確 dedup 邏輯；應在單一 sitemap 內列一次（base 為 GitHub Pages URL）|
| 2 | noindex 頁誤收錄 | 🔴 高 | 與 robots meta noindex 矛盾 → Google 警告或忽略 sitemap；需嚴格 cascade（per §4.1）；test 確保所有 noindex 頁不在 sitemap |
| 3 | Blogger / GitHub duplicate URL（per CLAUDE.md §16.4 cross-link UTM）| 🟡 中 | Blogger 平台之 URL 與 GitHub Pages 之 URL 為不同 host；canonical 設計決定哪個算 primary；sitemap 不應含 cross-host URL |
| 4 | canonical / cross-link / sitemap 三者不一致 | 🟡 中 | canonical 指 A / sitemap 列 B / cross-link 從 C 指 D；SEO 訊號分散；需 single source of truth（建議：canonical 為主；sitemap 列 canonical URL；cross-link 用於導流）|
| 5 | robots.txt 指向錯誤 sitemap（如 sitemap index 改名後 robots 未同步）| 🟡 中 | SEO-4-d 之 robots sync 階段；test grep `robots.txt` 對 `Sitemap:` 行驗證 |
| 6 | build 後 `dist/.gitkeep` 副作用 | 🟢 低 | 既有 vite emptyOutDir 之已知問題；SEO 系列各 batch 已 git restore；屬處理流程 SOP |
| 7 | GitHub Pages 部署後 sitemap 快取 / 反映延遲 | 🟡 中 | GitHub Pages CDN 快取可達 10 分鐘；Google Search Console fetch 之頻率為小時級；SEO-4 落地後需等 ~24 hr 觀察 Search Console reports |
| 8 | sitemap index 之 `<lastmod>` 同步問題 | 🟡 中 | sub-sitemap 之 lastmod 應 reflect 內含 URL 之最大 lastmod；計算成本 + 同步成本 |
| 9 | 多 sub-sitemap build 順序（vite emptyOutDir 仍適用）| 🟡 中 | 既有 `npm run build` 之 vite build 會清 dist；postbuild 之 build:sitemap 必須在 vite build 後；多 sitemap 之 build 順序需驗 |
| 10 | future content（如新增 page / podcast / 外部資源）之 sitemap 歸屬決策 | 🟡 中 | 屬未來決策；本批列入 §7 後續 phase 範圍 |
| 11 | Search Console 對 sitemap index 之支援 | 🟢 低 | Google / Bing / Yandex 皆認得 sitemap index；風險低 |
| 12 | 中文 URL encoding 一致性（如 `/posts/` 與 `/posts`）| 🟢 低 | 既有實作已加 trailing slash；風險低 |

---

## §7 最小實作方案（SEO-4-a ~ SEO-4-e）

依**最小破壞性 + 拆批驗證**原則：

### 7.1 Phase SEO-4-a：盤點與測試（不改輸出）

| 項目 | 內容 |
|---|---|
| 範圍 | 新增 docs / 補 fixtures / 補 test scripts；驗證既有 `build-sitemap.js` 之 cross-source 邏輯之正確性（含 SEO-1 / SEO-2 之 exclude path）|
| 改檔 | 0 個 source；可選 docs + fixtures |
| 預期 sitemap url count | 不變（14） |
| 風險 | 🟢 低（純讀 + docs）|

### 7.2 Phase SEO-4-b：調整 build-sitemap.js

| 項目 | 內容 |
|---|---|
| 範圍 | 依 user 選定方案（A / B / C / D），重構 `build-sitemap.js` 之 entries 組裝邏輯；若採 sitemap index 方案，新增 sub-sitemap 之 write 邏輯 |
| 改檔 | `src/scripts/build-sitemap.js` 主要 |
| 預期 sitemap url count | 視方案而定（A 不變 / B-D 拆多檔但合計 url 數仍 14） |
| 風險 | 🟡 中（build 邏輯變動；需單測 / 整測） |

### 7.3 Phase SEO-4-c：跑 build 並驗證 sitemap url count

| 項目 | 內容 |
|---|---|
| 範圍 | 跑 `npm run build`；驗證 sitemap 結構 / url count / `<lastmod>` 正確 / noindex 頁不在 |
| 改檔 | 0 個 source；屬驗證 batch |
| 風險 | 🟢 低（屬驗證；若失敗 rollback SEO-4-b） |

### 7.4 Phase SEO-4-d：robots.txt / docs sync

| 項目 | 內容 |
|---|---|
| 範圍 | 更新 `build-sitemap.js` 之 `buildRobotsTxt()`（若 robots `Sitemap:` 行需指向 sitemap index）；同步 `docs/seo-ga4-adsense.md` §4 sitemap 章節；同步 `docs/seo-indexing-rules.md` §11 之 baseline 引用 |
| 改檔 | `build-sitemap.js`（robots 部分）+ docs |
| 風險 | 🟢 低（純配置同步） |

### 7.5 Phase SEO-4-e：deploy repo 同步候選

| 項目 | 內容 |
|---|---|
| 範圍 | 評估是否需動 deploy repo（`portable-blog-deploy`）之 sitemap.xml / robots.txt 部署檔；通常 vite build → dist 之自動 sync 已足，但需確認 sub-sitemap 不在 .gitignore |
| 改檔 | 視 deploy repo 結構而定；通常無需動 |
| 風險 | 🟡 中（涉 deploy pipeline；GitHub Pages 部署後需驗線上） |

### 7.6 推薦執行順序

依保守原則：**SEO-4-a → user 批准 → SEO-4-b → SEO-4-c → user 視覺 / Search Console 驗證 → SEO-4-d → SEO-4-e**。每批之間 stop point。

**強烈不建議**：跳過 SEO-4-a 直接進 SEO-4-b（會錯失現況盤點之 baseline）。

### 7.7 推薦方案

**Phase SEO-4 整體推薦採方案 A（維持單一 sitemap.xml）**，理由：

- 當前 post 數量極少（17 fixtures + 4 ready posts；issue-posts 33）；遠未到拆分必要規模
- SEO-1 / SEO-2 / SEO-3 之 indexing / exclude 邏輯已就位；無 cross-source 紊亂
- 拆分為 sitemap index 之 build 改動 + robots sync + Search Console resubmit 之成本，當前無對應收益
- Future-proof 留待 post 數量 >100 或需多 host 時再評估

→ **本 pre-analysis 結論：建議當前不啟動 SEO-4 實作**；本 doc 作為「未來若啟動時之決策依據」即可。

---

## §8 驗證方案（未來 SEO-4 實作後）

### 8.1 必跑指令

```bash
npm run validate:content    # baseline 不退步
npm run build               # GitHub prod build（含 vite build + postbuild sitemap）
npm run build:blogger       # Blogger CSS / dist-blogger 不受影響
```

### 8.2 sanity check 清單

| # | 檢查項 | 方法 |
|---|---|---|
| 1 | sitemap url count（或 sub-sitemap 合計）| `grep -c "<url>" dist/sitemap*.xml` |
| 2 | noindex 頁誤入 sitemap 檢查 | `grep -E "portable-blog-system-mvp\|admin\|design-system\|404" dist/sitemap*.xml` 應 0 |
| 3 | validation-fixtures 誤入 sitemap 檢查 | `grep -E "_test-\|validation-fixture" dist/sitemap*.xml` 應 0 |
| 4 | GitHub Pages 線上 sitemap 是否可讀 | `curl https://babel-lab.github.io/.../sitemap.xml` 應 200 |
| 5 | robots.txt 是否指向正確 sitemap | `grep Sitemap dist/robots.txt` |
| 6 | sitemap index 結構（若採方案 B-D）| `grep -E "<sitemap>\|<sitemapindex>" dist/sitemap.xml` |
| 7 | admin isolation 不受影響 | `.cache/pages/admin` ABSENT / `dist/admin` ABSENT |
| 8 | Search Console submit | 手動於 Search Console 重 submit sitemap；觀察 24-72hr fetch 結果 |
| 9 | Bing Webmaster Tools submit | 同上 |
| 10 | sample crawl test | 用第三方爬蟲（如 Screaming Frog）爬 sitemap；檢驗 URL accessibility |

---

## §9 本批不做事項

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 source（`src/**`） | ✅ |
| 2 | 不改 build scripts | ✅ |
| 3 | 不改 sitemap 輸出 | ✅ |
| 4 | 不跑 npm run build | ✅ |
| 5 | 不新增 fixtures | ✅ |
| 6 | 不動 validator | ✅ |
| 7 | 不改 content | ✅ |
| 8 | 不改 dist | ✅ |
| 9 | 不改 deploy repo | ✅ |
| 10 | 不 push | ✅ |
| 11 | 不啟動 SEO-4-a / SEO-4-b / SEO-4-c / SEO-4-d / SEO-4-e | ✅ |
| 12 | 不裁決方案 A / B / C / D winner | ⚠️ §7.7 推薦方案 A 但留待 user 最終決定 |
| 13 | 不裁決具體 sitemap-* 子檔命名 | ✅ |

---

## §10 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/**` | ❌ 未動 |
| `content/**` / `content/validation-fixtures/**` | ❌ 未動 |
| `dist/sitemap.xml` / `dist/robots.txt` | ❌ 未動 |
| `dist/**` / `dist-blogger/**` | ❌ 未動 |
| Deploy repo | ❌ 未動（HEAD 仍 `4ecd92d`） |
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台 | ❌ 未動 |
| validate baseline `0/38/33` | ❌ 預期未動（純 docs 編輯）|
| SEO-2 系列既有 fixtures / validator rules | ❌ 未動 |

---

## §11 邊界聲明

- ✅ 本文件**僅為 SEO-4 pre-analysis**；不改任何 source / build / dist / deploy
- ✅ 本文件**不**啟動 SEO-4-a / SEO-4-b / SEO-4-c / SEO-4-d / SEO-4-e 任一 sub-batch
- ✅ 本文件**不**裁決方案 A / B / C / D winner（§7.7 推薦方案 A 但留 user 決定）
- ✅ 本文件**不**裁決具體 sitemap-* 子檔命名 / `<lastmod>` 計算策略 / sitemap index XML schema 細節
- ✅ 本文件**不**動 Blogger 端 sitemap（per §3.5 - §3.6 - §5.1 之分離原則）
- ✅ 本文件**不** push

---

## §12 Cross-links

- `docs/seo-indexing-rules.md` §1 ~ §11（SEO-0 ~ SEO-2-z 系列完整收尾；本 SEO-4 pre-analysis 沿用其 indexing policy 與 baseline 約定）
- `docs/seo-ga4-adsense.md` §3.4 noindex 規則 / §4 sitemap.xml & robots.txt 既有實作
- `CLAUDE.md` §21（SEO 高階要求）
- `CLAUDE.md` §16.4（Blogger ↔ GitHub cross-link UTM；與 sitemap 之 cross-source 設計相關）
- Phase 10-sitemap-cross-source-fix-a（既有 cross-source mirror 邏輯）
- SEO 系列 commits：`1f987f5` SEO-0 / `49162f5` SEO-1 / `0867ca2` SEO-2 / `a8a136d` SEO-3 / `daa354c` SEO-3-b / `7588f67`-`fd2d8fc` SEO-2-b ~ SEO-2-z

---

（本文件結束）
