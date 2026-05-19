# Admin MVP Pre-Analysis：本機 Admin 頁面 MVP 規劃

本文件為**本機 Admin 頁面 MVP** 之**詳細規劃前置分析**。與 `docs/admin-local-boundary-pre-analysis.md`（邊界政策 / 三方案目錄策略）互補：本文件聚焦於 **MVP 應做什麼欄位 / 資料流 / 階段切分 / 風險**。

對應上層文件：
- `docs/admin-local-boundary-pre-analysis.md`（邊界規範 + GA4/Ads/UTM placement policy + 三方案目錄策略）
- `docs/system-direction.md`（BLOG 系統整體方向；說明為何不綁單一平台）
- `CLAUDE.md` §29（第一版不做清單；Admin UI 屬第二階段）
- `docs/publish-bundle.md`（sidecar 三檔結構）
- `docs/content-schema.md`（frontmatter 欄位字典）

---

## §1 為什麼需要 Admin

### 1.1 當前痛點

長期手動編輯 JSON / `.publish.json` / frontmatter / sidecar metadata 帶來下列風險：

- 打錯 YAML 縮排 → build 失敗或 silent broken
- 漏填必要欄位（如 slug / category / tags）→ validate warning 累積
- 寫錯欄位名（如 legacy `type` vs `contentKind`）→ legacy fallback 已退場（per Phase 8-h）→ 直接 break
- 不同 sidecar 間之 slug 對不齊 → cross-source mirror / FB promotion 連結錯
- 文章狀態誤標 `ready` 而 metadata 不全 → 進入 build 後輸出殘缺
- relatedLinks / otherLinks 之 `platform` 與 `title` 混填（per Phase 9-g schema 限制：platform 不應併入 title）
- 圖片 URL 之 size suffix 不一致（如 /s320/ vs /s1200/ 混用，per 今日 image-size fix）
- sitemap / robots 漏跑（per Phase deploy-workflow-defense 已用 postbuild 防呆）

### 1.2 Admin 目標

**降低手動改檔風險**；提供結構化欄位編輯介面；自動保持 schema 一致性；同時保留「**本機 only / source 留本機**」之核心紀律（per Phase 10 雙 repo 分離設計）。

### 1.3 Admin 範疇之邊界（per admin-local-boundary §3）

- **本機 only**：不對外暴露；不上 GitHub Pages；不進 deploy repo
- **不替代 git 版控**：Admin 寫入後仍需 `git commit` 紀錄
- **不接 Blogger / GA4 / Google API**：仍走人工手動發布 / 接入流程

---

## §2 MVP 目標

### 2.1 MVP 必做（per user 需求）

1. 新增 / 編輯文章 metadata
2. 選擇發布通路 Blogger / GitHub
3. 編輯 SEO 欄位
4. 編輯 FB 推廣欄位
5. 編輯相關連結 / 其他連結
6. 管理 slug / permalink / category / tags / contentKind
7. 預覽輸出結果
8. 降低手動改檔風險

### 2.2 MVP 成功標準

| # | 指標 | 目標 |
|---|---|---|
| 1 | 作者新增 1 篇文章不需手動開 .md / .publish.json / .fb.md | ✅ 三檔皆由 Admin 寫 |
| 2 | YAML / JSON 格式錯誤率 | ≈ 0%（schema-validated 寫入）|
| 3 | validate baseline 不退步 | 維持 `0/22/17`（per Phase 1 final）|
| 4 | dist build 不 regression | per 既有 sanity check |
| 5 | Blogger 後台手動貼上 SOP 不變 | per `docs/publish-workflow.md` §11 |
| 6 | postbuild auto-sitemap 仍生效 | per Phase deploy-workflow-defense |

---

## §3 MVP 不做什麼

| # | 不做項 | 理由 |
|---|---|---|
| 1 | 完整 CMS（含 user / role / permission）| MVP 屬本機 only；無需 auth |
| 2 | 線上化 / 雲端部署 | per admin-local-boundary §3 之硬性禁則 |
| 3 | 直接寫入 Blogger 後台 / Google Drive API | per CLAUDE.md §29 第一版不做 |
| 4 | 文章內文 WYSIWYG 編輯器 | MVP 聚焦 metadata；內文仍 Markdown 編輯（VS Code）|
| 5 | 即時 build / hot reload | dev mode 跑 `npm run dev` 已可預覽 |
| 6 | 多人協作 / 衝突解決 | 單機單人 |
| 7 | 文章自動翻譯 / SEO 自動生成 | 屬未來 AI 功能候選 |
| 8 | GA4 / AdSense 之 measurementId / client ID 管理 UI | 直接編 `content/settings/*.json` |
| 9 | 圖片上傳 / CDN 整合 | 圖片仍走 Blogger / Google Drive 手動上傳（per CLAUDE.md §22）|
| 10 | git commit / push 整合 | Admin 不替代 git；作者於 terminal 操作 |

---

## §4 欄位分區

Admin MVP 應將 metadata 編輯介面分成下列 7 個邏輯區（per user 規格）：

### 4.1 a. 基本文章資料

對應 `{slug}.md` frontmatter 之 identity 與 lifecycle：

| 欄位 | 必填 | 型態 | 備註 |
|---|---|---|---|
| `id` | ✅ | string | 推薦 `YYYYMMDD-{slug}` |
| `site` | ✅ | enum: github / blogger | 主歸屬 |
| `primaryPlatform` | ✅ | enum: github / blogger | canonical 來源 |
| `contentKind` | ✅ | enum: post / tech-note / book-review / download / comic / life-note / page | per CLAUDE.md §11 |
| `slug` | ✅ | string | URL 末段 |
| `title` | ✅ | string | 中文標題 |
| `titleEn` | 選 | string | 英文標題 |
| `date` | ✅ | ISO date | 創作日期 |
| `updated` | 選 | ISO date | 更新日期 |
| `author` | ✅ | string | 預設 settings.site.author |
| `status` | ✅ | enum: draft / ready / published / archived | |
| `draft` | ✅ | boolean | per legacy schema |
| `category` | ✅ | string | 必須存在於 `content/settings/categories.json` |
| `tags` | 選 | array of string | 必須存在於 `content/settings/tags.json` |
| `cover` | 選 | URL | 封面圖 |
| `coverAlt` | 選 | string | 封面 alt |

### 4.2 b. SEO 資料

對應 `.publish.json` `seo.*` + frontmatter `description` / `searchDescription` / `canonical`：

| 欄位 | 必填 | 來源 | 備註 |
|---|---|---|---|
| `description` | ✅ | frontmatter | 短摘要 |
| `searchDescription` | ✅ | frontmatter | SEO meta description |
| `canonical` | ✅ | frontmatter | `"auto"` 或絕對 URL |
| `seo.metaTitle` | 選 | .publish.json | 覆寫 title 用於 SEO |
| `seo.metaDescription` | 選 | .publish.json | 覆寫 searchDescription |
| `seo.ogImage.url` / `.alt` | 選 | .publish.json | OG image 自訂 |

### 4.3 c. Blogger 發布資料

對應 `.publish.json` `blogger.*` + frontmatter `publishTargets.blogger.*`：

| 欄位 | 必填 | 來源 | 備註 |
|---|---|---|---|
| `publishTargets.blogger.enabled` | ✅ | frontmatter | 是否輸出至 Blogger |
| `publishTargets.blogger.mode` | ✅ | frontmatter | enum: full / summary / redirect-card |
| `blogger.type` | ✅ | .publish.json | enum: post / page（per `docs/publish-json-schema.md` §5.6）|
| `blogger.permalink` | ✅ | .publish.json | Blogger 自訂網址 slug |
| `blogger.status` | ✅ | .publish.json | enum: draft / published |
| `blogger.publishedUrl` | published 後填 | .publish.json | 發布後手動回填（per Phase 9-c `backfill:url`）|
| `blogger.publishedAt` | published 後填 | .publish.json | ISO 8601 |
| `blogger.bloggerPostId` | published 後填 | .publish.json | Blogger 內部 ID |

### 4.4 d. GitHub Pages 發布資料

對應 `.publish.json` `github.*` + frontmatter `publishTargets.github.*`：

| 欄位 | 必填 | 來源 | 備註 |
|---|---|---|---|
| `publishTargets.github.enabled` | ✅ | frontmatter | 是否輸出至 GitHub Pages |
| `publishTargets.github.mode` | ✅ | frontmatter | enum: full（Blogger summary / redirect-card 不適用 GitHub）|
| `github.enabled` | ✅ | .publish.json | cross-source mirror 觸發旗標 |
| `github.path` | ✅ | .publish.json | 預期 URL path |
| `github.publishedUrl` | 自動 | .publish.json | 由 `site.config.json.githubSiteUrl` + path 推導 |

### 4.5 e. FB 推廣資料

對應 `.fb.md` sidecar（per `docs/fb-sidecar-schema.md`）：

| 欄位 | 必填 | 備註 |
|---|---|---|
| `enabled` | ✅ | 是否產出 FB 推廣 txt |
| `page` | 選 | FB 粉絲頁識別 |
| `title` | 選 | FB 標題（fallback 至 frontmatter title）|
| `titleEn` | 選 | 英文標題（per Phase 8-e-2）|
| `hashtags` | 選 | array of string with `#` |
| `target` | 選 | enum: auto / 絕對 URL |
| `message` | 選 | FB body 短訊 |
| body（.fb.md 內文）| 選 | 完整 FB 貼文文字 |
| UTM（per settings.promotion.facebook.utm）| — | source / medium / campaign / **audience（建議新增 gap，per §9）** |

### 4.6 f. 相關連結 / 其他連結

對應 frontmatter `relatedLinks[]` / `otherLinks[]`（per `docs/related-links-schema.md`）：

| 欄位 per item | 必填 | 備註 |
|---|---|---|
| `kind` | ✅ | enum: internal / external |
| `platform` | ✅ | string；如 `blogger` / `youtube` / `台北市立圖書館` |
| `title` | ✅ | 顯示標題（**不含** platform 前綴）|
| `url` | ✅ | internal 應為已發布之真實 URL |
| `description` | 選 | string |
| `order` | 選 | number（當前 ignore；未來排序用）|

Admin 應提供：
- 動態增刪 link entry
- `platform` autocomplete（基於 site.config + 既有歷史）
- internal URL 連結至本系統其他文章之 `publishedUrl`（避免手 typo）
- Blogger cross-link 自動 UTM 預覽（per Phase related-links-ga4-audit 落地之 `applyCrossSiteUtm`；render 時自動生效）

### 4.7 g. GA4 / AdSense 插入設定

對應 frontmatter `blocks.*`（per CLAUDE.md §17）：

| 欄位 | 預設 | 備註 |
|---|---|---|
| `blocks.adsenseTop` | true | post 頂端 AdSense |
| `blocks.adsenseMiddle` | false | 內文中 AdSense |
| `blocks.adsenseBottom` | true | post 底部 AdSense |
| `blocks.hashtags` | true | 顯示 hashtag 區塊 |
| `blocks.socialFollow` | true | Social follow 區塊 |
| `blocks.relatedPosts` | true | Related Posts 自動推薦（per Phase 9-h-f 未實作）|
| `blocks.sidebar` | true | 顯示 sidebar |
| `blocks.toc` | false | 目錄（per CLAUDE.md §20 第二階段）|

Admin 應提供 per-post toggles；**不應提供** GA4 measurementId / AdSense client ID 編輯（per §3 #8）。

---

## §5 可能資料流

### 5.1 新增文章

```
作者於 Admin → 填寫基本資料 + 選發布通路
   ↓
Admin write 3 檔（atomic）：
   - content/{site}/posts/{YYYYMMDD-slug}.md
   - content/{site}/posts/{YYYYMMDD-slug}.publish.json
   - content/{site}/posts/{YYYYMMDD-slug}.fb.md（若 FB enabled）
   ↓
Admin 觸發 npm run validate:content（背景）
   ↓
Admin 顯示 validate 結果 + 建議下一步（編輯 / 預覽 / build）
   ↓
作者於 Admin 點「預覽 GitHub Pages 輸出」
   ↓
Admin 跑 npm run build（含 postbuild auto sitemap，per Phase deploy-workflow-defense）
   ↓
Admin 開瀏覽器至 dist/posts/{slug}/index.html
```

### 5.2 編輯既有文章

```
作者於 Admin → 列出 ready / draft 文章清單
   ↓
作者選文章 → Admin 讀取 3 檔
   ↓
Admin 顯示 form（per §4 7 區）
   ↓
作者編輯 → Admin 寫回對應 sidecar
   ↓
（同 5.1 之 validate + 預覽流程）
```

### 5.3 發布到 Blogger（人工輔助）

```
作者於 Admin → 預覽 Blogger HTML（讀 dist-blogger/posts/{slug}/post.html）
   ↓
Admin 顯示 copy-helper.txt 之 13 區塊 + publish-checklist.txt
   ↓
作者手動操作 Blogger 後台（複製 HTML + 貼上 / 填欄位 / 發布）
   ↓
作者於 Admin 填回 publishedUrl
   ↓
Admin 觸發 npm run backfill:url（或直接寫 .publish.json）
   ↓
Admin 重 build:promotion → FB 推廣 txt 含正式 URL
```

### 5.4 發布到 GitHub Pages

```
作者於 Admin 確認 build 成功
   ↓
作者手動 git commit（Admin 不替代 git）
   ↓
作者手動跑 deploy 流程（per docs/github-deploy.md §5.4）
   或 Admin 提供 1 個按鈕跑既有 deploy script（屬 Phase Admin-4 候選）
```

---

## §6 風險

| # | 風險 | 等級 | 緩解 |
|---|---|---|---|
| 1 | Admin 寫入 sidecar 與既有 schema 不一致 | 🔴 高 | 嚴格依 `docs/publish-bundle.md` + `docs/fb-sidecar-schema.md` + `docs/publish-json-schema.md` 之 schema 驗證 |
| 2 | Admin 誤覆蓋作者既有手寫內容 | 🔴 高 | 寫入前 diff preview + git status check（提示作者先 commit）|
| 3 | Admin 與 git 雙寫衝突 | 🟡 中 | Admin 不替代 git；提示作者每次寫入後 commit |
| 4 | Admin 寫入觸發隱式 build / sitemap regression | 🟡 中 | 寫入 source 後**不自動 build**；由作者明示觸發 |
| 5 | Admin 引入額外 npm dependencies 膨脹 source repo | 🟡 中 | 採 admin-local-boundary §6 Plan B（獨立 tools 目錄 + 獨立 package.json）|
| 6 | Admin 線上化誤上線 | 🔴 高 | 嚴格 local-only；per admin-local-boundary §3 + boundary docs |
| 7 | Admin 暴露 GA4 measurementId / AdSense client ID 於 source repo | 🟡 中 | settings JSON 已 gitignored / 或留空字串待部署時填 |
| 8 | Admin 變更 settings categories / tags 後既有文章變 broken | 🟡 中 | Admin 提供「rename category 同步更新文章」操作 |
| 9 | Admin 之 form 過度設計 → 學習曲線高 | 🟢 低 | MVP 限制 7 區基本欄位；高階欄位（如 series / book / affiliate）後續加 |
| 10 | Admin write atomicity 失敗（寫了 .md 但 .publish.json 失敗）| 🟡 中 | write 採 try-commit + rollback；或先寫 temp + rename atomic |

---

## §7 建議分階段實作

### Phase Admin-0：規劃 + 邊界 docs（**本批已落地**）

- ✅ `docs/admin-local-boundary-pre-analysis.md`（per 2026-05-19 commit `1c82c43`）
- ✅ `docs/admin-mvp-pre-analysis.md`（本文件；本批）
- ✅ `docs/system-direction.md`（本批）

### Phase Admin-1：MVP read-only（read + preview only） ✅ **landed 2026-05-19**

實作 sub-batches（per `docs/admin-1-completion-report.md`）：

- Admin-1-a：preflight + Plan B 選定 — commit `f876e9e`
- Admin-1-b：dev-mode-only Admin page MVP — commit `7f9c6b7`
- Admin-1-c：enhanced read-only（search / filter / detail / completeness）— commit `11ba32e`
- Admin-1-wrap：completion report 收尾 — `docs/admin-1-completion-report.md`

原規劃條目達成狀況：

- ✅ 列出 source repo 既有文章（`load-admin-posts.js` direct glob）
- ✅ 顯示文章 metadata（read-only；含 7 sections detail panel）
- ✅ dist HTML preview connect（admin URL list 連至 publishedUrl / previewUrl）
- ⏸ 顯示 validate warning per post（**未在 Admin-1-a/b/c 範圍**；列為 Admin-1-d / post-MVP 候選）
- ✅ **不寫入**任何檔案
- ✅ read / parse / display 邏輯驗證完成（本機 `npm run dev` → `http://localhost:5173/admin/`）

### Phase Admin-2：MVP write（新增 / 編輯）

- 新增文章 → 寫 3 檔
- 編輯文章 → 重寫 sidecar
- 寫入前 diff preview + git status check
- 寫入後不自動 build；提示作者手動觸發

### Phase Admin-3：MVP 整合 build / preview

- Admin 內按鈕觸發 `npm run validate:content` + 顯示結果
- Admin 內按鈕觸發 `npm run build`（含 postbuild auto sitemap）+ 顯示 build log
- 預覽改為 inline iframe 動態 reload
- 預覽 Blogger output / FB promotion txt

### Phase Admin-4：MVP 整合發布輔助

- 顯示 Blogger copy-helper.txt + publish-checklist.txt（讀 dist-blogger/）
- 提供 publishedUrl 回填 form → 觸發 `backfill:url`
- 提供「重 build:blogger + build:promotion」按鈕
- （可選）提供「跑 deploy gh-pages 流程」按鈕

### Phase Admin-5+（post-MVP）：富 metadata + 進階功能

- 書評 metadata（book.*）/ 教具下載（download.*）/ 聯盟連結（affiliate.*）編輯
- relatedLinks 之 internal URL autocomplete（從本系統其他 published post 拉清單）
- 系列文章（series.*）管理
- 圖片 metadata 管理（不上傳；只記錄）
- 多 FB page 推廣支援

### 建議順序判定

| 順序 | Phase | 觸發條件 |
|---|---|---|
| 1 | Admin-0（**已完成**）| 規劃文件落地 |
| 2 | （可選）schema 擴充批：UTM `audience` 等 | 在 Admin-2 之前先補 schema gap（per §9）|
| 3 | Admin-1 read-only（**已完成 2026-05-19**）| per `docs/admin-1-completion-report.md`；3 commits（`f876e9e` + `7f9c6b7` + `11ba32e`）|
| 4 | Admin-2 write | Admin-1 穩定後；**強烈建議**先做 Admin-2-a write pre-analysis + safety plan |
| 5 | Admin-3 build 整合 | Admin-2 穩定後 |
| 6 | Admin-4 發布輔助 | Admin-3 穩定後 |
| 7 | Admin-5+ 富 metadata | MVP 流程 user 驗證可用後 |

---

## §8 對目前系統之影響

本批（Phase Admin-0 規劃文件）：

| 維度 | 狀態 |
|---|---|
| source code | ❌ 未動 |
| build scripts | ❌ 未動 |
| EJS templates | ❌ 未動 |
| content 既有文章 | ❌ 未動 |
| dist / deploy repo | ❌ 未動 |
| Blogger output | ❌ 未動 |
| GA4 / AdSense 程式碼 | ❌ 未動 |
| 既有 stable snapshot | ✅ 維持 |

---

## §9 Metadata Gap 摘要

當前 schema 已涵蓋 §4 大部分需求；下列為**潛在 gap**（屬未來 schema 擴充候選；本批不啟動）：

| Gap | 影響 | 建議處理時機 |
|---|---|---|
| FB UTM 之 `utm_audience` 欄位 | 當前 promotion.config 含 source / medium / campaign / content；無 audience | Admin Phase 1 之前評估補入 `promotion.config.json` + `.fb.md` schema |
| 中文 / 英文**摘要**（per user §4 提及）| 當前有 description / searchDescription；無明確 zh/en 分流 | 可採新欄位 `descriptionEn` / `searchDescriptionEn` 或由 i18n 機制解決 |
| series 系列文章 metadata（既有 series.json）| Admin 是否提供系列管理 UI | Admin Phase 5+ |
| 多 FB page per 一文章之 cross-post | 當前 .fb.md 為 single page 設計 | Admin Phase 5+ |
| 圖片 metadata（sourceAssets / images[]）| 當前部分支援（per CLAUDE.md §22）；無系統化欄位 | Admin Phase 5+ |
| GA4 per-event customization | 當前 events 為全站清單 | post-MVP；非 MVP scope |
| Blogger → GitHub Pages 反向 UTM | 當前未實作（per Phase related-links-ga4-docs-sync §16.4）| 反向 UTM 實作批次 |

---

## §10 邊界聲明

- ✅ 本文件**僅為 pre-analysis / 規劃文件**；**不**啟動 Admin 實作
- ✅ 本文件**不**修改 source code / build script / content / dist / deploy
- ✅ 本文件**不**新增 npm dependencies / package script
- ✅ 本文件**不**改變既有 frontmatter / publish.json / fb.md schema
- ✅ 本文件**不**等同 Admin 設計規格書（屬高階規劃；技術選型留下批）

---

## §11 Cross-links

- `docs/admin-local-boundary-pre-analysis.md`（Admin 邊界政策 + 3 方案目錄策略 + GA4/Ads/UTM placement）
- `docs/system-direction.md`（BLOG 系統整體方向）
- `CLAUDE.md` §11（contentKind enum）/ §17（article block 設計）/ §22（圖片素材）/ §29（第一版不做清單）
- `docs/publish-bundle.md`（sidecar 三檔結構）
- `docs/content-schema.md`（frontmatter 欄位字典）
- `docs/publish-json-schema.md`（.publish.json schema）
- `docs/fb-sidecar-schema.md`（.fb.md schema）
- `docs/related-links-schema.md`（相關連結 schema；含 cross-link auto UTM）
- `docs/seo-ga4-adsense.md`（SEO / GA4 / AdSense 設定）
- `docs/publish-workflow.md`（作者既有發布 SOP；含 postbuild auto sitemap 防呆）

---

（本文件結束）
