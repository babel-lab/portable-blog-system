# Phase 1 Completion Checklist：第 1 階段完整使用與測試總驗收清單

本文件為 BLOG 系統第 1 階段（Phase 0 ~ Phase 9-h 收尾止；含 Phase 8 sidecar 系列與 Phase 9 book / relatedLinks / GitHub article block parity 系列）之**總驗收清單**。

對應之上層文件：
- `CLAUDE.md` §28（第一版 MVP 必做清單）+ §29（第一版不做清單）+ §30（專案最終樣貌）
- `docs/future-roadmap.md` §2（Phase 8 / 9 跨 phase 路線總覽）
- `docs/phase-9g-completion-report.md` / `docs/phase-9h-completion-report.md`（最近兩個收尾報告）
- `docs/phase-9e-completion-report.md` / `docs/phase-9f-c-completion-report.md` / `docs/phase-8g-completion-report.md`（Phase 8 / 9 主要 milestone 收尾報告）

---

## §1 文件目的

### 1.1 為什麼需要一份「完整使用與測試總驗收清單」

CLAUDE.md §1 第 1 條規定：第一版的目標是「可長期維護、可備份、可搬家、可輸出到 Blogger 與 GitHub Pages 的內容系統」，而**不是只把 build 跑通**。

至本文件建立時，從個別 Phase 完成報告（8-b / 8-c / 8-d / 8-e / 8-f / 8-g / 9-e / 9-f-c / 9-g / 9-h）來看，系統能力已**接近 Phase 1 收尾**；但個別 phase 報告只記錄該批次之 deliverable，並未對 **CLAUDE.md §28 MVP 必做清單 × 系統實際輸出 × 作者真實使用流程** 三者進行交叉驗收。

本文件補上此空白：以**單一清單**對照系統能力與作者使用流程之完成度。

### 1.2 兩層完成度區分

第 1 階段完成度分**兩層**，本文件嚴格區分：

| 層級 | 定義 | 驗收方式 |
|---|---|---|
| **系統能力完成度** | 程式碼、模板、設定、文件、build 流程、validate 規則皆已 landed | 對照各 Phase 收尾報告 + grep / glob 驗證檔案存在 |
| **完整使用與測試完成度** | 作者已**真實建立** 1 篇以上 ready post，完整跑過 build:github / build:blogger / build:promotion / validate / 貼到 Blogger / 回填 publishedUrl 全流程，所有區塊在 dist 中達**預期啟用狀態**而非 dormant render | 對照 §10 真實作者使用流程 checklist 之逐項勾選結果 |

**第 1 階段不是只看 build 成功**：build 成功代表系統能力 OK，但 article block 全 dormant（如書評區塊 / 教具下載 / affiliate 從未經作者 ready post 啟用）代表作者流程尚未跑過。完整使用與測試完成度不等於系統能力完成度。

### 1.3 本文件之使用方式

1. 系統能力欄位（§3 / §5 / §6 / §7）對照各 phase report；標 ✅ / 🟡 / ⏸ / ❌
2. 真實使用欄位（§8 之「是否已有 ready post 實際啟用」/ §10 全表）由作者於完成 1 篇試寫文章後手動勾選
3. §12 完成判定由作者於 §10 勾選完成後填寫；本文件**不預先宣告 Phase 1 100% 完成**

### 1.4 狀態符號定義

| 符號 | 意義 |
|---|---|
| ✅ | 已完成（系統能力或真實啟用皆達成） |
| 🟡 | 系統完成但待真實內容驗證（infrastructure ready，作者 ready post 未啟用 / dormant render） |
| ⏸ | deferred（決策性延後；已有明確 deferred 理由與 trigger condition） |
| ❌ | 未完成（既無系統也無內容） |

---

## §2 當前 snapshot

### 2.1 Git 狀態

- **HEAD**：`6950e20 docs(phase-9): add phase-9h completion report`
- **working tree**：clean
- **本文件建立批次**：Phase 9-z-b（純 docs；單檔新增）

### 2.2 Baseline 指標

| 指標 | 數值 | 來源 |
|---|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)`（簡稱 `0/22/17`） | `docs/phase-9g-completion-report.md` §5.1 / `docs/phase-9h-completion-report.md` §6.1 |
| Ready posts 數量 | 2 篇 GitHub（`20260504-github-pages-blog-planning` + `20260504-portable-blog-system-mvp`）+ 0 篇 Blogger（`20260504-sample-book-review` 仍為 draft） | `content/{github,blogger}/posts/*.md` grep `status:` 結果 |
| Validation fixtures | 15 個（涵蓋 series / book / fb / relatedLinks-otherLinks rules） | `content/validation-fixtures/{github,blogger}/posts/_test-*.md` |
| Article block parity（Blogger ↔ GitHub） | 6/6 conditional blocks 達成（`docs/phase-9h-completion-report.md` §4） | Phase 9-g-f-b / 9-h-b-b / 9-h-c-b / 9-h-d-b / 9-h-e-b |

### 2.3 最近一波 milestone 摘要

| Milestone | 狀態 |
|---|---|
| Phase 9-g 收尾（relatedLinks / otherLinks 系列）| ✅ 已收尾 |
| Phase 9-h 收尾（GitHub article block parity）| ✅ 已收尾（GitHub article block parity completed snapshot；Related Posts auto deferred） |
| Phase 9-g-g（relatedLinks JSON-LD `mentions` / `isPartOf`）| ⏸ deferred |
| Phase 9-f-g（Book / Periodical JSON-LD）| ⏸ deferred |
| Phase 8-h（legacy 欄位退場）| ⏸ pending |
| 第 1 階段 final completion report | ❌ 缺；候選為 Phase 9-z-c |
| 真實作者使用流程驗證 | ❌ 未執行；候選為 §10 之 manual checklist |

---

## §3 MVP 必做清單對照（CLAUDE.md §28）

CLAUDE.md §28 列 17 條第一版必做事項。逐條對照：

| # | MVP 必做項目 | 狀態 | 對應 phase / 主要檔案 | 驗收方式 |
|---|---|---|---|---|
| 1 | 建立專案資料夾結構 | ✅ | CLAUDE.md §8 結構 / 全 repo 目錄 | 對照 CLAUDE.md §8 預期路徑與實際 `ls -R` 之 top-level |
| 2 | 建立 README.md | ✅ | `README.md`（repo 根） | 檔案存在 |
| 3 | 建立 CLAUDE.md | ✅ | `CLAUDE.md`（repo 根；30 節）| 檔案存在 |
| 4 | 建立 docs 文件 | ✅ | `docs/*.md`（40+ 檔；含 architecture / content-schema / publish-bundle / book-schema / related-links-schema 等） | `ls docs/` 比對 CLAUDE.md §8 docs 預期清單 |
| 5 | 建立 settings JSON | ✅ | `content/settings/*.json`（14 個；含 ads / categories / tags / promotion / link-rules / seo / ga4 / navigation / sidebar / footer / themes / social-links / affiliate-networks / site.config + Phase 8-f `series.json`）| `ls content/settings/` 對照 CLAUDE.md §3.2 |
| 6 | 建立 Markdown 範例文章 | ✅（系統能力）/ 🟡（真實 ready 內容覆蓋）| `content/github/posts/` 2 篇 ready + `content/blogger/posts/` 1 篇 draft + `content/templates/*.md` 5 篇 + `content/validation-fixtures/**/*.md` 15 篇 | 範例齊；ready 內容僅涵蓋 tech-note；book-review / download / comic / life-note / page 種類**尚無 ready 內容**（per §8） |
| 7 | 建立 GitHub 首頁、列表、文章頁、分類頁、標籤頁 | ✅ | `src/views/pages/{home,post-list,post-detail,category,tag,category-list,tag-list,404,search,about}.ejs` | EJS 模板齊；`npm run build` 產出 `dist/index.html` / `dist/posts/{slug}/` / `dist/categories/` / `dist/tags/` |
| 8 | 建立 Blogger full / summary 匯出 | ✅ | `src/views/blogger/blogger-post-full.ejs` + `blogger-post-summary.ejs` + `blogger-redirect-card.ejs` | `npm run build:blogger` 產出 `dist-blogger/posts/{slug}/post.html` |
| 9 | 建立 Blogger copy-helper 與 checklist | ✅ | `src/views/blogger/blogger-copy-helper.ejs`（13 個區塊；含 9-f-c-b `[12]` book + 9-g-d-c `[13]` relatedLinks）+ `blogger-publish-checklist.ejs`（含 9-f-c-c book + 9-g-e-b relatedLinks 區塊） | `npm run build:blogger` 產出 `dist-blogger/posts/{slug}/copy-helper.txt` + `publish-checklist.txt` |
| 10 | 建立 Blogger design token CSS 匯出 | ✅ | `src/scripts/build-blogger-theme-css.js` + `src/styles/blogger/` | `npm run build:blogger-theme` 產出 `dist-blogger/theme/blogger-{tokens,components,article,full-style}.css` |
| 11 | 建立 FB promotion txt 匯出 | ✅ | `src/scripts/build-promotion.js` + `src/views/promotion/facebook-{post,summary,hashtags}.ejs` | `npm run build:promotion` 產出 `dist-promotion/facebook/{site}/{slug}.txt` + `all-posts-index.txt` |
| 12 | 建立 Design System 基礎頁 | ✅ | `src/views/design-system/{index,colors,spacing,typography,buttons,cards,article-components,layouts,forms-search}.ejs` | `npm run dev` → `/design-system/` 路徑可瀏覽 |
| 13 | 建立 SCSS tokens / themes / components | ✅ | `src/styles/abstracts/_{tokens,themes,spacing,typography,breakpoints,mixins,z-index}.scss` + `src/styles/components/_*.scss`（含 9-g-d-b `_related-links.scss`、Phase 2-2-g `_hashtag.scss`、2-2-o `_download-box.scss`、2-2-p `_affiliate-box.scss`、`_book-photo.scss`、`_post-card.scss`、`_card.scss`、`_button.scss` 等 16+ 元件）| `src/styles/main.scss` import 鏈完整 |
| 14 | 建立 Sticky Header、Mobile Drawer、Back to Top | ✅ | `src/js/modules/{sticky-header,mobile-drawer,back-to-top,active-nav,ga4-events,link-tracker,lazy-image}.js`（第一版 7 模組齊；`search.js` / `toc.js` / `copy-code.js` 屬第二階段已預落地） | `npm run build` 後 `dist/assets/*.js` 含對應 module；瀏覽器互動驗證屬 §10 之 author flow |
| 15 | 建立 link processor | ✅ | `src/scripts/link-processor.js` + `content/settings/link-rules.json` | 既有實作覆蓋 CLAUDE.md §16 外部 / 聯盟 / 站內 / Blogger↔GitHub 互導四種規則 |
| 16 | 建立 GA4 event data attributes | ✅ | `src/views/tracking/{ga4,ga4-events-helper}.ejs` + `src/js/modules/{ga4-events,link-tracker}.js` + `content/settings/ga4.config.json` + `src/scripts/ga4-url-builder.js` | EJS partials 與 JS module 齊；events 涵蓋 CLAUDE.md §5 之 GA4 event 列表（page_view / internal_link_click / tag_click / category_click / affiliate_click / download_click / social_click / blogger_to_github_click / github_to_blogger_click）|
| 17 | 建立 sitemap.xml、robots.txt | ✅（系統能力）| `src/scripts/build-sitemap.js`（Phase 5-c 落地；輸出 `dist/sitemap.xml` + `dist/robots.txt`；robots 引用 sitemap + 封鎖 `/design-system/` + `/404.html`）| **注意**：當前 `dist/` 不含 `sitemap.xml` / `robots.txt`，因最近一波 build 未跑 `npm run build:sitemap`；屬 §10 author flow 之手動執行項，**非系統缺漏** |

**§3 小結**：17 條 MVP 必做項目**全數系統 ✅**；其中 #6（範例文章）受限於 ready 內容種類僅涵蓋 tech-note，故同時標 🟡（待真實內容覆蓋）；#17（sitemap / robots）系統 ready，但**當前 dist 缺檔**屬流程未跑而非系統缺漏。

---

## §4 第一版不做清單對照（CLAUDE.md §29）

CLAUDE.md §29 列 12 項第一版不得主動實作之功能。逐條確認**未被誤實作**：

| # | 第一版不做項目 | 維持不做 | 是否被誤納入 | 是否轉入 future-roadmap |
|---|---|---|---|---|
| 1 | 真正後台登入管理 | ✅ 維持 | ❌ 未誤納入 | 未轉入；屬第二階段範疇（CLAUDE.md §8） |
| 2 | 視覺化文章編輯器 | ✅ 維持 | ❌ 未誤納入 | 未轉入；屬第二階段範疇 |
| 3 | Blogger API 自動發文 | ✅ 維持 | ❌ 未誤納入 | 未轉入；CLAUDE.md §27 明確禁止 |
| 4 | Google Drive API 圖片上傳 | ✅ 維持 | ❌ 未誤納入 | 未轉入；CLAUDE.md §27 明確禁止 |
| 5 | 前台 View 數 | ✅ 維持 | ❌ 未誤納入 | 未轉入；CLAUDE.md §5 / §29 明確 |
| 6 | 讚數 / Like | ✅ 維持 | ❌ 未誤納入 | 未轉入 |
| 7 | 留言系統 | ✅ 維持 | ❌ 未誤納入 | 未轉入 |
| 8 | 熱門文章自動統計 | ✅ 維持 | ❌ 未誤納入 | 未轉入；GA4 觀察為唯一指標來源（CLAUDE.md §5）|
| 9 | 全文搜尋 | ✅ 維持 | ⚠️ 預落地（不啟用）| `src/js/modules/search.js` 存在但**不啟用**；屬第二階段 placeholder（CLAUDE.md §20 列為第二階段）|
| 10 | 會員系統 | ✅ 維持 | ❌ 未誤納入 | 未轉入 |
| 11 | 資料庫後端 | ✅ 維持 | ❌ 未誤納入 | 未轉入；所有資料以 Markdown + JSON 管理 |
| 12 | 自動社群發文 | ✅ 維持 | ❌ 未誤納入 | 未轉入；FB 推廣採手動貼上 `dist-promotion/facebook/*.txt`（CLAUDE.md §4） |

**§4 小結**：12 項第一版不做清單**全數維持不做**。`search.js` 預落地但不啟用、不接 caller，不算誤實作（屬 Phase 6 第二階段 placeholder，per CLAUDE.md §20）。

---

## §5 Phase 0 至 Phase 7 完成對照

| Phase | 主題 | 狀態 | 主要文件 / report | 是否仍有 deferred |
|---|---|---|---|---|
| Phase 0 | 專案骨架與文件 | ✅ 完成 | `CLAUDE.md` §6 / 全 repo 目錄結構 + `docs/` 文件群 | 無 |
| Phase 1 | GitHub 本機可預覽 MVP | ✅ 完成 | `src/views/` 全套 + `vite.config.js` + `npm run dev` 可跑 | 無 |
| Phase 2 | Design System 與共用樣式（含 2-2-g hashtag / 2-2-o download-box / 2-2-p affiliate-box / 9-g-d-b related-links / book-photo / post-card 等元件落地）| ✅ 完成 | `src/styles/` 全套 + `src/views/design-system/` 9 子頁 + 各 phase 元件落地紀錄散見於 commit log | 無 |
| Phase 3 | Blogger 匯出系統 | ✅ 完成 | `src/scripts/build-blogger.js` + `src/views/blogger/` 全套 + `src/scripts/build-blogger-theme-css.js` | 無 |
| Phase 4 | FB Promotion 匯出 | ✅ 完成 | `src/scripts/build-promotion.js` + `src/views/promotion/facebook-{post,summary,hashtags}.ejs` + `content/settings/promotion.config.json` + Phase 8-g-19 site default hashtags | 無 |
| Phase 5 | SEO / GA4 / AdSense | ✅ 完成（5-a ~ 5-h 全 ✅；per `docs/seo-ga4-adsense.md` Phase 5 進度摘要）| `src/views/seo/{meta-tags,open-graph,canonical,json-ld}.ejs` + `src/views/tracking/{ga4,ga4-events-helper}.ejs` + `src/views/ads/adsense-{slot,post-top,post-middle,post-bottom,sidebar,home-inline,head}.ejs` + `src/scripts/build-sitemap.js` | ⚠️ 進階 JSON-LD（Book / Periodical structured data + relatedLinks `mentions` / `isPartOf`）屬 Phase 5 完成後新增需求，**不在 Phase 5 原 scope**；列為 Phase 9-f-g / 9-g-g deferred（per §11）|
| Phase 6 | RWD 與前台互動 | ✅ 完成（核心 7 模組落地：sticky-header / mobile-drawer / back-to-top / active-nav / ga4-events / link-tracker / lazy-image）| `src/js/modules/*.js` | search.js / toc.js / copy-code.js 預落地但不啟用，屬 CLAUDE.md §20 第二階段 |
| Phase 7 | 發布、檢查與備份流程 | ✅ 完成 | `docs/checklists/{blogger-publish,github-deploy,fb-promotion,image-upload,seo,backup,sidecar-migration}-checklist.md` + `src/scripts/{export-build-report,check-broken-links,check-image-links,report-{draft-posts,missing-tags,published-urls,series,book}}.js` | 無 |

**§5 小結**：Phase 0 ~ 7 系統能力**全 ✅**；Phase 5 之進階 JSON-LD 為事後新增需求，列為 Phase 9-f-g / 9-g-g deferred（不算 Phase 5 缺口）；Phase 6 之 search / toc / copy-code 屬 CLAUDE.md §20 明示之第二階段，預落地不啟用為合理保守。

---

## §6 Phase 8 完成對照

Phase 8 為 sidecar bundle 系列（`.md` / `.publish.json` / `.fb.md` 三檔結構）+ normalized post output + series metadata。

| Sub-phase | 範圍 | 狀態 | 主要 commit / report |
|---|---|---|---|
| Phase 8-a | publish bundle / fb-sidecar / publish.json / migration schemas 規範文件先行 | ✅ 完成 | `docs/publish-bundle.md` / `docs/publish-json-schema.md` / `docs/fb-sidecar-schema.md` / `docs/migration-from-frontmatter.md` |
| Phase 8-b | sidecar I/O 整合 + load-posts + contentKind 相容 + pages 路徑支援 | ✅ 完成 | `docs/phase-8b-completion-report.md`（commit `3a3ebab`）|
| Phase 8-c | placeholder resolver（三層接入）| ✅ 完成 | `docs/phase-8c-completion-report.md`（commit `7960fbf`）|
| Phase 8-d | normalized post output helper + load-posts 掛入 + build pipeline normalized 優先 / legacy fallback | ✅ 完成 | `docs/phase-8d-completion-report.md`（commit `12919cf`）|
| Phase 8-e | series metadata schema + `.fb.md` `titleEn` + sample/template/validate warning + fixtures | ✅ 完成 | `docs/phase-8e-completion-report.md`（commit `e5677dd`）|
| Phase 8-f | series metadata 接入 build pipeline（含 `series.hashtags` inheritance、copy-helper [11]、promotion manifest 4 欄位）| ✅ 完成 | `docs/phase-8f-completion-report.md`（commit `b1679d1`）|
| Phase 8-g | Phase 8-f 後候選分析與排程（含 8-g-2 new-post.js prompt、8-g-2-d series warnings、8-g-4 docs cross-link、8-g-5/6 sample/template 對齊、8-g-12 series-title-unresolved、8-g-14 publish-bundle §7 對齊、8-g-17 series report、8-g-18 series.tags inheritance、8-g-19 site default hashtags、8-g-20 candidate 6 deferred）| ✅ 完成（除 candidate 6 / Phase 8-g-1 fixture end-to-end 兩項 deferred）| `docs/phase-8g-completion-report.md`（commit `7bc5e12`）+ `docs/future-roadmap.md` §3 |
| **Phase 8-g-1** | fixture / sample end-to-end 驗證 | ⏸ deferred | `docs/future-roadmap.md` §4；觸發條件為「作者人工確認部署流程能隔離 `_sample-` 內容」或「在作者正式建立第一篇系列文章之前不執行」 |
| **Phase 8-g candidate 6** | first article `.fb.md` hashtags fallback | ⏸ deferred（nice-to-have / Phase 8-h+）| `docs/phase-8g-completion-report.md` §3.14 / §5.5 / §8.8 |
| **Phase 8-h** | legacy 欄位退場 | ⏸ pending | 未啟動；scope 涵蓋 8 個 script + validate / normalize / build 三層；詳見 §6.2 |

### 6.1 已 landed normalized 欄位（normalized 優先）

由 `src/scripts/normalize-post-output.js` 落地（Phase 8-d 起手 + 8-f / 8-g-18 / 8-g-19 補強）：

- `normalized.identity.contentKind`（含 legacy `type` fallback；觸發 `deprecated-legacy-type-fallback` 註記）
- `normalized.publish.canonical.{url,source}`（sidecar 勝 + legacy frontmatter fallback）
- `normalized.publish.blogger.tags`（fallback chain：`post.tags` → `series.tags` → `[]`，per 8-g-18-c）
- `normalized.promotion.facebook.{enabled,target,title,message,body,hashtags,finalUrl}`（sidecar 勝 + legacy frontmatter fallback；per 8-d-4-b / 8-f-7-b / 8-g-19-c 之多源整合）
- `normalized.series.{id,number,subtitle,resolvedTitle}`（per 8-f-2-b plumbing + resolve-series-title.js）

### 6.2 仍保留之 source code 層 legacy fallback（Phase 8-h 退場範圍）

當前 source code 仍持有下列 legacy fallback / deprecated 規則（**屬 Phase 8-h scope，未退場**）：

| 位置 | legacy 殘留 |
|---|---|
| `src/scripts/validate-content.js:329` | `frontmatter-uses-deprecated-type` warning 規則 |
| `src/scripts/normalize-post-output.js:179-195` | `contentKind ?? type` fallback + `deprecated-legacy-type-fallback` 註記 |
| `src/scripts/normalize-post-output.js:122 / 715 / 729 / 763 / 783 / 798 / 812 / 822` | `legacyFb` FB sidecar 多處 fallback（enabled / target / message / body / hashtags / finalUrl） |
| `src/scripts/normalize-post-output.js:674-688` | legacy frontmatter canonical fallback |
| `src/scripts/parse-markdown.js` | body H1 → H2 自動降級 |
| `src/scripts/build-blogger.js:231-237` | `normalized.publish.blogger.tags` normalized 優先 + `post.tags` legacy fallback |
| `src/scripts/build-promotion.js:151` | 4 個欄位 normalized 優先 + legacy fallback |
| `src/scripts/resolve-placeholders.js:91 / 112 / 116` | legacy `publishedUrl` / `github.publishedUrl` / `githubUrl` fallback |

**§6 小結**：Phase 8-a ~ 8-g 主軸**全 ✅**；唯一未啟動之退場批為 Phase 8-h（legacy 欄位退場），預計拆 6 子批落地（per 盤點批建議）；sample / template 來源層已於 Phase 8-g-5 / 8-g-6 清乾淨，**source code 層相容層全數保留**，等待 Phase 8-h 退場。

---

## §7 Phase 9 完成對照

Phase 9 為 Phase 8-g pause-state 後之 Direction A + D 起手系列。

| Sub-phase | 範圍 | 狀態 | 主要 commit / report |
|---|---|---|---|
| Phase 9-b | author SOP（`docs/publish-workflow.md` §8-§16）| ✅ 完成 | commit `a7a467b` |
| Phase 9-c | `backfill-published-url.js` CLI helper + `npm run backfill:url` + docs §13 / §16 cross-link | ✅ 完成 | commit `f5f71b4` + `68c418e` + `9712d8d` |
| Phase 9-e | book / source metadata schema 系列（含 book.mediaType / titleEn / volume / issue / authors[] / publishedYear + 7 條 validate warnings + 7 個 fixtures） | ✅ 完成 | `docs/phase-9e-completion-report.md`（commit `208617d`）|
| Phase 9-f-b | `report-book.js` + `npm run report:book` visibility helper | ✅ 完成 | commit `de6071a` + `40d33d4` |
| Phase 9-f-c | book metadata output（copy-helper [12] 11 欄位 + publish-checklist book-review / magazine 區塊；含 sample post backfill）| ✅ 完成 | `docs/phase-9f-c-completion-report.md`（含 commits `fac693a` / `ff3367d` / `f9e518a` 等）|
| **Phase 9-f-e** | Blogger render book card | ⏸ deferred | per Phase 9-f-a A.2 保守路線；待 ready book review post 後評估 |
| **Phase 9-f-f** | GitHub render book card | ⏸ deferred | 同上 |
| **Phase 9-f-g** | JSON-LD Book / Periodical structured data | ⏸ deferred | 詳見 §11.1 |
| Phase 9-g | relatedLinks / otherLinks metadata schema 系列（含 schema doc + 5 templates 補入 + 4 條 validate warnings + 4 個 fixtures + Blogger render + Blogger copy-helper [13] + publish-checklist 區塊 + GitHub render）| ✅ 完成 | `docs/phase-9g-completion-report.md`（commit `a44ace8` overall；含 9-g-b ~ 9-g-f-c 共 13 commits + 7 純分析）|
| **Phase 9-g-g** | JSON-LD `mentions` / `isPartOf` structured data | ⏸ deferred | 詳見 §11.1 |
| Phase 9-h | GitHub article block parity（含 GitHub Affiliate Box top/bottom / Download Box / Hashtag / Book Photo render；共 6 個 conditional article blocks 達成 100% Blogger parity） | ✅ 完成（GitHub article block parity completed snapshot；per `docs/phase-9h-completion-report.md`）| commit `6950e20`（9-h-r overall report）+ 9-h-b ~ 9-h-e 共 8 commits + 5 純分析 |
| **Phase 9-h-f** | 兩端 Related Posts auto block | ⏸ future candidate | 未啟動；屬未來批次（per `docs/phase-9h-completion-report.md` §8.1）|

### 7.1 GitHub / Blogger / copy-helper / publish-checklist parity 狀態（per Phase 9-h-r snapshot）

| 區塊 | Blogger post.html | GitHub index.html | Blogger copy-helper | Blogger publish-checklist |
|---|---|---|---|---|
| Cover | ✅ | ✅ | — | — |
| Article Body | ✅ | ✅ | ✅（[5] 引用 postFile）| — |
| Hero | ✅ | ✅ | — | — |
| relatedLinks / otherLinks | ✅ aside（9-g-d-b）| ✅ aside（9-g-f-b）| ✅ [13] 純文字（9-g-d-c + b97c57a fix）| ✅ 5 條 checkbox（9-g-e-b）|
| Affiliate Box top | ✅（pre-9-h existing）| ✅（9-h-b-b）| —（屬 author SOP）| —（屬 author SOP）|
| Affiliate Box bottom | ✅（pre-9-h existing）| ✅（9-h-b-b）| — | — |
| Download Box | ✅（pre-9-h existing）| ✅（9-h-c-b）| — | — |
| Hashtag | ✅（pre-9-h existing）| ✅（9-h-d-b）| — | — |
| Book Photo | ✅（pre-9-h existing）| ✅（9-h-e-b；dormant render）| ✅ [12] 11 欄位（9-f-c-b；book-review / magazine 區塊）| ✅ book-review / magazine 區塊（9-f-c-c-b）|

**§7 小結**：Phase 9-b / 9-c / 9-e / 9-f-c / 9-g / 9-h 主軸**全 ✅**；GitHub article block parity 100%（per `docs/phase-9h-completion-report.md` §4）；唯一 live activated 為 Hashtag，其餘 5 個區塊屬 dormant render（等真實 ready post 啟用），詳見 §8。

---

## §8 Article Blocks 驗收清單

第 1 階段之文章詳細頁版型應涵蓋 CLAUDE.md §17 列出之所有區塊。本表逐一對照。

**Blogger 支援欄**：是否於 `src/views/blogger/blogger-post-full.ejs` 有 conditional render
**GitHub 支援欄**：是否於 `src/views/pages/post-detail.ejs` 有 conditional render
**copy-helper 支援欄**：是否於 `blogger-copy-helper.ejs` 有對應確認區塊（Blogger 端輔助；GitHub 不適用）
**publish-checklist 支援欄**：是否於 `blogger-publish-checklist.ejs` 有對應內容確認區塊（Blogger 端輔助；GitHub 不適用）
**啟用狀態欄**：是否已有 ready post 在 dist 中**實際輸出**該區塊（不是 dormant render）

| 區塊 | Blogger | GitHub | copy-helper | publish-checklist | 是否已有 ready post 實際啟用 | 驗收方式 |
|---|---|---|---|---|---|---|
| Hero | ✅ | ✅ | — | — | 🟢 live（2 篇 ready GitHub posts 之 dist/posts/{slug}/index.html 含 hero） | `npm run build` 後 grep dist 對應 markup |
| Cover | ✅ | ✅ | — | — | 🟡 dormant（既有 ready posts `cover` 多為空字串；無對應圖片）| frontmatter `cover` 填值並準備圖片後重 build 驗證 |
| Article Body | ✅ | ✅ | ✅（[5]）| — | 🟢 live（兩端皆有）| 對照 `dist-blogger/posts/{slug}/post.html` 與 `dist/posts/{slug}/index.html` body markup |
| relatedLinks / otherLinks | ✅（9-g-d-b）| ✅（9-g-f-b）| ✅（[13]；9-g-d-c）| ✅（9-g-e-b）| 🟡 **dormant（既有 2 篇 ready GitHub posts 之 frontmatter 無此兩欄位）**| §10 試寫文章 frontmatter 填入 `relatedLinks[]` / `otherLinks[]` 後重 build；驗證 dist 含 `<aside class="lab-related-links">` / `<aside class="lab-other-links">` |
| Affiliate Box top | ✅ | ✅（9-h-b-b）| — | — | 🟡 dormant（既有 ready posts 無 `affiliate.enabled === true`）| 試寫 book-review 文章填入 `affiliate.links[]` + `affiliate.position.top: true` 後重 build |
| Affiliate Box bottom | ✅ | ✅（9-h-b-b）| — | — | 🟡 dormant | 同上但 `affiliate.position.bottom: true` |
| Download Box | ✅ | ✅（9-h-c-b）| — | — | 🟡 dormant（既有 ready posts 無 `download.enabled === true`）| 試寫 download 文章填入 `download.fileUrl` + `download.enabled: true` 後重 build |
| Hashtag | ✅ | ✅（9-h-d-b）| — | — | 🟢 **live activated**（2 篇既有 ready GitHub posts frontmatter 含 `blocks.hashtags: true` + `tags: ["github","vite","static-site"]`，dist 已含 hashtag 區塊；per Phase 9-h-d-c 驗證）| `dist/posts/{slug}/index.html` grep `lab-hashtags` |
| Book Photo | ✅ | ✅（9-h-e-b；dormant render）| ✅（[12] 11 欄位；9-f-c-b）| ✅（9-f-c-c-b）| 🟡 dormant（無 ready book-review GitHub post；`content/blogger/posts/20260504-sample-book-review.md` 仍為 draft）| 將 sample-book-review 改 ready，或撰寫新 GitHub book-review post 後重 build |
| Hashtag 區塊 | （見 Hashtag）| | | | | |
| Post CTA | ✅ | ✅ | — | — | 🟢 live（layout / footer 之 social follow）| dist 含對應 markup |
| Social Follow | ✅ | ✅ | — | — | 🟢 live | dist 含對應 markup |
| TOC（CLAUDE.md §17 Optional）| 預落地 `src/js/modules/toc.js` 不啟用 | 預落地不啟用 | — | — | ⏸ 第二階段（CLAUDE.md §20）| 第二階段再啟用 |
| **Related Posts auto block**（系統自動推薦；CLAUDE.md §17）| **未實作**（仍屬 `blocks.relatedPosts: true/false` 設定值，但 Blogger / GitHub render 端**尚未實作**推薦邏輯）| **未實作** | — | — | ❌ / ⏸ future（Phase 9-h-f 候選；per `docs/phase-9h-completion-report.md` §8.1）| 屬未來批次；不阻擋 Phase 1 |
| Sidebar | ✅ `src/views/layout/sidebar.ejs` | ✅ | — | — | 🟢 live | dist 含對應 markup |
| Footer | ✅ | ✅ | — | — | 🟢 live | dist 含對應 markup |
| Back to Top | ✅ | ✅（`src/js/modules/back-to-top.js`）| — | — | 🟢 live | dist 含對應 markup + JS module |
| Breadcrumb | ✅ | ✅（`src/views/layout/breadcrumb.ejs`）| — | — | 🟢 live | dist 含對應 markup |
| AdSense Top | ✅ | ✅ | — | — | 🟢 live（placeholder；待真實 AdSense ID）| dist 含對應 markup |
| AdSense Middle | ✅（per `blocks.adsenseMiddle`）| ✅ | — | — | 🟡 dormant（既有 ready posts `blocks.adsenseMiddle: false`）| frontmatter 切 true 後重 build |
| AdSense Bottom | ✅ | ✅ | — | — | 🟢 live | dist 含對應 markup |

### 8.1 Article Blocks 驗收結論

- **9 個 article block parity 完成度**：6/6 conditional article blocks 100% 達成 GitHub parity（per Phase 9-h；relatedLinks / otherLinks + Affiliate Box top/bottom + Download Box + Hashtag + Book Photo）
- **唯一 live activated**：Hashtag
- **5 個 dormant render**：relatedLinks / otherLinks / Affiliate Box / Download Box / Book Photo — 系統 ready，等真實 ready post 啟用
- **1 個 future candidate**：Related Posts auto block（Phase 9-h-f；尚未實作系統推薦邏輯）

**第 1 階段「article blocks 完整使用驗證」需於 §10 試寫流程後達成**，當前 dormant 比例高代表系統能力 ready 而作者流程未跑。

---

## §9 輸出產物驗收清單

第 1 階段需可產出以下產物。本表逐項對照當前 dist 內容。

| 產物路徑 | 來源 script / 模板 | 當前狀態 | 驗收方式 |
|---|---|---|---|
| `dist/index.html` | `vite build` + `src/views/pages/home.ejs` | ✅ 存在 | `npm run build` 後檢視 |
| `dist/posts/{slug}/index.html` | `src/views/pages/post-detail.ejs` | ✅ 存在（2 篇 ready post）| dist 含 |
| `dist/categories/`、`dist/tags/` | `src/views/pages/{category,tag,category-list,tag-list}.ejs` | ✅ 存在 | dist 含 |
| `dist/design-system/` | `src/views/design-system/*.ejs` + `src/scripts/build-design-system.js` | ✅ 存在 | dist 含 |
| `dist/404.html` | `src/views/pages/404.ejs` | ✅ 存在 | dist 含 |
| `dist/assets/*` | vite bundle | ✅ 存在 | dist 含 |
| `dist/sitemap.xml` | `src/scripts/build-sitemap.js` | ❌ **不存在**（系統 ready；最近 build 未跑 `build:sitemap`）| 跑 `npm run build:sitemap` 後重新檢視 |
| `dist/robots.txt` | 同上 | ❌ 不存在（同上原因） | 同上 |
| `dist-blogger/posts/{slug}/post.html` | `src/views/blogger/blogger-post-full.ejs` | ✅ 存在 | `npm run build:blogger` 後檢視 |
| `dist-blogger/posts/{slug}/copy-helper.txt` | `blogger-copy-helper.ejs` | ✅ 存在 | dist 含 |
| `dist-blogger/posts/{slug}/meta.json` | `blogger-meta-json.ejs` | ✅ 存在 | dist 含 |
| `dist-blogger/posts/{slug}/publish-checklist.txt` | `blogger-publish-checklist.ejs` | ✅ 存在 | dist 含 |
| `dist-blogger/index/blogger-home.html` | `blogger-home-index.ejs` | ✅ 存在 | dist 含 |
| `dist-blogger/theme/blogger-{tokens,components,article,full-style}.css` | `src/scripts/build-blogger-theme-css.js` | ✅ 存在 | `npm run build:blogger-theme` 後檢視 |
| `dist-blogger/build-manifest.json` | `build-blogger.js` | ✅ 存在 | dist 含 |
| `dist-promotion/facebook/{site}/{slug}.txt` | `src/views/promotion/facebook-post.ejs` | ✅ 存在（依 ready post 啟用 `.fb.md` 之 `enabled: true`）| `npm run build:promotion` 後檢視 |
| `dist-promotion/facebook/all-posts-index.txt` | `build-promotion.js` | ✅ 存在 | dist 含 |
| `dist-reports/build-report.{txt,json}` | `src/scripts/export-build-report.js` | ✅ 存在 | `npm run report:build` |
| `dist-reports/draft-posts-report.{txt,json}` | `report-draft-posts.js` | ✅ 存在 | `npm run report:drafts` |
| `dist-reports/missing-tags-report.{txt,json}` | `report-missing-tags.js` | ✅ 存在 | `npm run report:missing-tags` |
| `dist-reports/published-urls-report.{txt,json}` | `report-published-urls.js` | ✅ 存在 | `npm run report:urls` |
| `dist-reports/series-report.{txt,json}` | `report-series.js`（Phase 8-g-17-b）| ✅ 存在 | `npm run report:series` |
| `dist-reports/book-report.{txt,json}` | `report-book.js`（Phase 9-f-b-1）| ✅ 存在 | `npm run report:book` |
| `dist-reports/check-broken-links-report.{txt,json}` | `check-broken-links.js` | ✅ 存在 | `npm run check:links` |
| `dist-reports/check-image-links-report.{txt,json}` | `check-image-links.js` | ✅ 存在 | `npm run check:images` |

### 9.1 需要人工貼到 Blogger 的項目（per CLAUDE.md §2.1）

第 1 階段採手動貼上流程，不接 Blogger API。每篇 Blogger 發布需手動完成：

- 貼 `dist-blogger/posts/{slug}/post.html` 之 HTML body 至 Blogger 文章編輯器之 HTML 檢視
- 貼 `meta.json` 之 `title` 至 Blogger 標題欄位
- 貼 `meta.json` 之 `searchDescription` 至 Blogger 搜尋說明欄位
- 貼 `meta.json` 之 `slug` 至 Blogger 自訂網址欄位
- 貼 `meta.json` 之 `tags` 逗號分隔字串至 Blogger 標籤欄位
- 依 `copy-helper.txt` 之 13 個區塊逐項對照
- 依 `publish-checklist.txt` 逐項勾選
- 發布後手動回填 `publishedUrl` 至 `{slug}.publish.json`（可用 `npm run backfill:url`）
- 貼 `dist-promotion/facebook/blogger/{slug}.txt` 至 FB 粉絲頁

**§9 小結**：除 `sitemap.xml` / `robots.txt` 當前缺檔（屬流程未跑非系統缺漏）外，其他輸出產物**全 ✅**。

---

## §10 真實作者使用流程驗收 checklist

以下為**作者必須親自跑過一次**之 end-to-end 流程，用以驗證系統能力與作者流程整合可用。

### 10.1 內容建立階段

- [ ] **10.1.1** 使用 `npm run new:post` 建立 1 篇新 GitHub 文章（試寫 tech-note 或 life-note 或 page；建議 tech-note 以降低 ready 內容種類偏食）
- [ ] **10.1.2** 使用 `npm run new:post` 建立 1 篇新 Blogger 文章（試寫 book-review 或 download 之一；觸發 dormant article blocks）
- [ ] **10.1.3** 填寫 `.md` frontmatter，至少涵蓋：`id` / `site` / `contentKind` / `title` / `slug` / `date` / `category` / `tags` / `description` / `searchDescription` / `status` / `publishTargets`
- [ ] **10.1.4** 試寫一個 `relatedLinks[]` entry（含 `kind: external` / `platform: "Youtube"` / `title` / `url`）+ 一個 `otherLinks[]` entry，**驗證 relatedLinks / otherLinks live activation**
- [ ] **10.1.5** 若為 book-review：填 `book.*` 完整欄位（per `docs/book-schema.md`）+ `affiliate.links[]` + `affiliate.position.top: true` / `bottom: true`，**驗證 Affiliate Box + Book Photo live activation**
- [ ] **10.1.6** 若為 download：填 `download.enabled: true` + `download.fileUrl` + `download.title` + `download.licenseNote`，**驗證 Download Box live activation**
- [ ] **10.1.7** 建立對應 `.publish.json`（自 `content/templates/_sample.publish.json` 複製，刪除 `$comment`）
- [ ] **10.1.8** 建立對應 `.fb.md`（若有 FB 推廣需求；frontmatter `enabled: true` + body 為 FB 貼文文案）
- [ ] **10.1.9** 將 `status` 切為 `"ready"`、`draft: false`

### 10.2 Validate 階段

- [ ] **10.2.1** 執行 `npm run validate:content` → 預期 `0 error`；warning 數應 ≥ 22（baseline 22 + 試寫文章新增之 warning 或無增加）
- [ ] **10.2.2** 確認新文章本身**無 error**；warning 若有，逐條確認是 expected 或需修
- [ ] **10.2.3** 跑 `npm run report:drafts` 確認新文章是否還在 draft 清單
- [ ] **10.2.4** 跑 `npm run report:missing-tags` 確認 tag 命中 `content/settings/tags.json`
- [ ] **10.2.5** 若為 series：跑 `npm run report:series` 確認系列狀態
- [ ] **10.2.6** 若為 book-review：跑 `npm run report:book` 確認 book schema 完整

### 10.3 Build 階段

- [ ] **10.3.1** 執行 `npm run build:github` → 預期成功；新文章出現於 `dist/posts/{slug}/index.html`
- [ ] **10.3.2** 執行 `npm run build:blogger` → 預期成功；新 Blogger 文章出現於 `dist-blogger/posts/{slug}/`
- [ ] **10.3.3** 執行 `npm run build:promotion` → 預期成功；FB 推廣文案出現於 `dist-promotion/facebook/{site}/{slug}.txt`（若 `.fb.md` enabled）
- [ ] **10.3.4** 執行 `npm run build:sitemap` → 預期產出 `dist/sitemap.xml` + `dist/robots.txt`
- [ ] **10.3.5** 執行 `npm run build:blogger-theme` → 預期產出 `dist-blogger/theme/blogger-full-style.css`
- [ ] **10.3.6** 執行 `npm run build` → vite build 整合預期成功

### 10.4 GitHub article detail 檢查

- [ ] **10.4.1** `npm run dev` 啟動本機伺服器 + 開啟新 GitHub 文章 URL（`/posts/{slug}/`）
- [ ] **10.4.2** 確認 header / nav / breadcrumb / cover / hero / article body / hashtag / relatedLinks aside / otherLinks aside（若有）/ AdSense Top / Middle / Bottom（若 frontmatter 開）/ social follow / footer / back to top **全部正確渲染**
- [ ] **10.4.3** 確認 RWD 桌面 + 手機 + 平板皆正確（per CLAUDE.md §6）
- [ ] **10.4.4** 確認 sticky header + mobile drawer + back to top JS 互動正常
- [ ] **10.4.5** 確認 `meta-tags` / `open-graph` / `canonical` / `json-ld` 於 `<head>` 正確輸出（view source 檢查）
- [ ] **10.4.6** 確認 link processor 對外部 / 聯盟 / 站內 / Blogger↔GitHub 互導四種連結處理符合 CLAUDE.md §16

### 10.5 Blogger HTML 檢查

- [ ] **10.5.1** 開啟 `dist-blogger/posts/{slug}/post.html` 預覽結構（注意：不必本機完整模擬 Blogger 平台；per CLAUDE.md §2.1）
- [ ] **10.5.2** 確認 `<div class="lab-blogger-article">` 外層包覆存在
- [ ] **10.5.3** 確認 affiliate / download / book photo / hashtag / relatedLinks / otherLinks（依文章內容）conditional 區塊正確輸出
- [ ] **10.5.4** **手動貼至 Blogger 後台**之 HTML 檢視：先預覽桌面版 + 手機版；確認圖片可顯示、AdSense 區塊未破版、樣式不被 Blogger 主題覆蓋
- [ ] **10.5.5** 確認 `dist-blogger/theme/blogger-full-style.css` 已於 Blogger 主題 CSS 區貼過一次（per CLAUDE.md §10）

### 10.6 copy-helper.txt 檢查

- [ ] **10.6.1** 開啟 `dist-blogger/posts/{slug}/copy-helper.txt`
- [ ] **10.6.2** 確認 [1] ~ [13] 共 13 個區塊**對應內容皆有**（依文章類型；book-review 應有 [12]、含 relatedLinks 應有 [13]）
- [ ] **10.6.3** 確認**無 EJS comment delimiter leak**（grep `trim-newline` 應 0 命中；per 9-g-d-c-fix / 9-g-e-b 之既有預防）

### 10.7 publish-checklist.txt 檢查

- [ ] **10.7.1** 開啟 `dist-blogger/posts/{slug}/publish-checklist.txt`
- [ ] **10.7.2** 依 publish-checklist 條目逐項勾選（含基礎 checklist + book-review/magazine 檢查區塊 + relatedLinks / otherLinks 檢查區塊）
- [ ] **10.7.3** 對照 `docs/checklists/blogger-publish-checklist.md`（人工檢查 master list）

### 10.8 JSON-LD 檢查（若適用）

- [ ] **10.8.1** GitHub 端 view source 檢查 `<script type="application/ld+json">` 之 JSON 內容
- [ ] **10.8.2** Blogger 端不接 JSON-LD（Phase 5 SEO 設計）
- [ ] **10.8.3** （可選）將 JSON 貼至 [Google Rich Results Test](https://search.google.com/test/rich-results) 驗證 schema 合法性
- [ ] **10.8.4** **注意**：Book / Periodical structured data + relatedLinks `mentions` / `isPartOf` 屬 Phase 9-f-g / 9-g-g deferred，當前**不輸出**；本檢查只驗 Phase 5 基本 BlogPosting / WebSite / BreadcrumbList 等既有 schema（per Phase 5 落地範圍）

### 10.9 Blogger 實際發布

- [ ] **10.9.1** 完成 §10.5 + §10.6 + §10.7 後，於 Blogger 後台正式發布
- [ ] **10.9.2** 取得 Blogger 正式 URL（含 `yyyy/mm/`）
- [ ] **10.9.3** 執行 `npm run backfill:url --slug={slug}` 回填至 `.publish.json` 之 `blogger.publishedUrl` 與 `blogger.publishedAt`
- [ ] **10.9.4** 重 build:blogger / build:promotion，確認 FB 推廣 txt 之 URL 改為正式 URL（不再是 placeholder）
- [ ] **10.9.5** 將 `dist-promotion/facebook/blogger/{slug}.txt` 貼至 FB 粉絲頁手動發文

### 10.10 流程結束驗收

- [ ] **10.10.1** 至少完成 1 篇 GitHub ready post + 1 篇 Blogger ready post 之上述全流程
- [ ] **10.10.2** 至少觸發 1 個 dormant article block 之 live activation（relatedLinks / Affiliate Box / Download Box / Book Photo 任一）
- [ ] **10.10.3** 將上述真實流程紀錄寫入 Phase 9-z-c 之 final completion report

**§10 完成條件**：所有勾選項皆 ✅ 後，視為「完整使用與測試完成度」達成。

---

## §11 deferred / pending 清單

### 11.1 Phase 9-g-g：JSON-LD `mentions` / `isPartOf` structured data（deferred）

- **範圍**：為 relatedLinks / otherLinks 之 internal links 補 schema.org `mentions` / `relatedLink` / `isPartOf` 屬性
- **理由**：(1) 無真實 ready post 可做 Google Rich Results Test；(2) schema.org 嚴格性（錯誤 schema 會被 Google 標 invalid）；(3) byte-identical 驗證對 schema 結構正確性不足夠
- **trigger condition**：作者完成 §10 試寫 + Blogger 發布 + 回填 publishedUrl 後，有 1 篇含 relatedLinks 之 ready post 可用 Rich Results Test 驗證
- **來源**：`docs/phase-9g-completion-report.md` §8.3 / `docs/related-links-schema.md` §9.2

### 11.2 Phase 9-f-g：Book / Periodical structured data（deferred）

- **範圍**：為 book-review / magazine 文章補 `Book` / `Periodical` JSON-LD
- **理由**：同 §11.1（無真實 ready book-review post）
- **trigger condition**：作者完成 1 篇 ready book-review post + Blogger 發布
- **來源**：`docs/future-roadmap.md` Phase 9-f 系列補述（per Phase 9-f-a A.2 保守路線）

### 11.3 Phase 8-h：legacy 欄位退場（pending）

- **範圍**：詳見 §6.2 之 8 個 source code 位置
- **建議拆批**（per Phase 9-z-a 盤點批建議）：
  - 8-h-a：純讀取盤點
  - 8-h-b：new-post / template 邊界確認
  - 8-h-c：validate `frontmatter-uses-deprecated-type` warning 升級 error（或維持 warning 但加 trigger 條件）
  - 8-h-d：normalize-post-output legacy fallback 退場
  - 8-h-e：build-blogger / build-promotion legacy fallback 退場
  - 8-h-f：docs sync + completion report
- **trigger condition**：第 1 階段 final completion report 已寫（Phase 9-z-c 完成）；作者已熟悉 Phase 8-a normalized 結構

### 11.4 Phase 9-h-f：兩端 Related Posts auto block（future candidate）

- **範圍**：跨兩端（GitHub + Blogger）之**自動**相關文章推薦邏輯（依 tags / category / contentKind / series.id 計算）
- **與 relatedLinks / otherLinks 之關係**：屬 two-track 獨立機制（per `docs/related-links-schema.md` §2.2 / §7）；不互相 fallback
- **trigger condition**：第 1 階段 final completion report 已寫 + 作者有 ≥ 5 篇 ready post（推薦演算法需多文章樣本才有意義）

### 11.5 Phase 8-g-1：fixture / sample end-to-end 驗證（deferred）

- **範圍**：`content/{site}/posts/_sample-*.md` end-to-end 驗證流程
- **理由**：ready fixture 會進入正式 dist / sitemap / promotion；本系統無 noindex / staging dist 機制可隔離
- **trigger condition**：作者人工確認部署流程能隔離 `_sample-` 內容，或在作者正式建立第一篇系列文章之前不執行
- **來源**：`docs/future-roadmap.md` §4

### 11.6 Phase 8-g candidate 6：first article `.fb.md` hashtags fallback（deferred / nice-to-have）

- **範圍**：系列首篇 `.fb.md` hashtags fallback（屬「跨文章查找邏輯」之 implicit ergonomic shortcut）
- **狀態**：⏸ deferred / nice-to-have / Phase 8-h+
- **理由**：既有 explicit FB hashtags fallback chain（`series.hashtags` / `defaultHashtags` / `series.tags`）已覆蓋主要使用情境
- **來源**：`docs/phase-8g-completion-report.md` §3.14 / §8.8

### 11.7 Dormant article blocks 尚未以 ready post 驗證

- **範圍**：relatedLinks / otherLinks / Affiliate Box top/bottom / Download Box / Book Photo 共 5 個區塊
- **理由**：既有 2 篇 ready GitHub posts 之 frontmatter 無此 5 種欄位；既有 1 篇 Blogger sample 仍為 draft
- **trigger condition**：作者依 §10 試寫流程啟用
- **驗收方式**：§10.10.2

---

## §12 第 1 階段完成判定

### 12.1 系統能力完成度

**狀態：✅ 已接近 Phase 1 收尾**

- CLAUDE.md §28 17 條 MVP 必做項目**全 ✅**（per §3）
- CLAUDE.md §29 12 項第一版不做清單**全維持不做**（per §4）
- Phase 0 ~ 7 主軸**全 ✅**（per §5）
- Phase 8-a ~ 8-g 主軸**全 ✅**（per §6）；Phase 8-h legacy 退場 pending 屬清理工作，非新功能缺漏
- Phase 9-b / 9-c / 9-e / 9-f-c / 9-g / 9-h 主軸**全 ✅**（per §7）
- Article block parity 100%（Blogger ↔ GitHub）達成（per §8）
- 輸出產物 9 大類**全可產出**（per §9）；`sitemap.xml` / `robots.txt` 缺檔屬流程未跑

### 12.2 完整使用與測試完成度

**狀態：❌ 未達成**

- §10 真實作者使用流程 checklist **0 條已勾選**
- §8 article blocks 之 5 個 dormant render 未經 ready post 啟用驗證
- Phase 9-g 系列之 relatedLinks / otherLinks 系統 ready 但**零個 ready post 使用**
- Phase 9-f-c 系列之 book metadata output 系統 ready 但**零個 ready book-review post**
- `sitemap.xml` / `robots.txt` 缺檔代表 `build:sitemap` 未在當前流程跑過

### 12.3 保守判定

不直接宣告第 1 階段 100% 完成。當前狀態建議用以下保守 wording：

> **「BLOG 系統第 1 階段之系統能力已接近 Phase 1 收尾；MVP 必做清單 17 條全數系統落地，CLAUDE.md §29 第一版不做清單 12 項全維持不做。然而第 1 階段定義包含『完整使用與測試完成』，當前真實作者使用流程（§10 共 ~50 條 checklist）尚未啟動，且 5/6 conditional article blocks 屬 dormant render 狀態（infrastructure ready；零個 ready post 啟用）。**
>
> **建議：第 1 階段 final completion report（Phase 9-z-c）應待 §10 至少完成一輪 end-to-end 流程後再寫，並以該輪流程之實際輸出作為驗證依據。**」

---

## §13 下一步建議

完成本 checklist（Phase 9-z-b）後之**建議順序**：

| 順序 | 批次 | 範圍 | 觸發條件 |
|---|---|---|---|
| **1** | **§10 真實作者試寫流程**（不屬獨立 phase；屬作者個人工作）| 至少完成 1 篇 GitHub ready post + 1 篇 Blogger ready post 之 end-to-end 流程；觸發 ≥ 1 個 dormant article block live activation | 本 checklist landed 後立即可做 |
| **2** | **Phase 9-z-c：第 1 階段 final completion report** | 新增 `docs/phase-1-completion-report.md`；引用本 checklist + §10 試寫之實際結果；正式封存第 1 階段 | §10 至少完成一輪 end-to-end 流程後 |
| **3** | **Phase 8-h：legacy 欄位退場**（拆 6 子批；per §11.3）| 退場 `validate-content` / `normalize-post-output` / `parse-markdown` / `build-blogger` / `build-promotion` / `resolve-placeholders` 之 legacy fallback / deprecated warning | Phase 9-z-c 完成 + 作者熟悉 Phase 8-a normalized 結構後 |
| **4** | **Phase 9-g-g：JSON-LD relatedLinks structured data** | 為 relatedLinks / otherLinks 補 `mentions` / `isPartOf` | §10 試寫文章已含 relatedLinks 且已用 Rich Results Test 驗證可行後 |
| **5** | **Phase 9-f-g：JSON-LD Book / Periodical structured data** | 為 book-review / magazine 補 `Book` / `Periodical` schema | §10 試寫文章已含 book-review 且已用 Rich Results Test 驗證可行後 |
| **6** | **Phase 9-h-f：兩端 Related Posts auto block** | 跨兩端 auto 推薦邏輯 | 作者 ≥ 5 篇 ready post 後 |
| **7** | **Phase 8-g-1：fixture / sample end-to-end 驗證** | `_sample-*.md` end-to-end | 作者人工確認 dist 隔離流程後 |

**保守原則**：每候選獨立批次；本 checklist 不混入任何 source code 變動 / dist 變動 / build / validate 執行。

---

（本文件結束）
