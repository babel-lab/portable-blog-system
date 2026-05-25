# 第一階段操作手冊（草稿）

本文件以**繁體中文**撰寫，適合**非工程師**之系統擁有者閱讀。

> ⚠️ **重要提醒**：以下任何標示「⏳ 尚未啟用」「⏳ 待下一階段」「不可」之功能，**請勿擅自啟用或操作**。所有 write / push / 啟用 GA4 等動作必須先過對應之 preflight checklist。

對應上層文件：
- `docs/README.md` — docs 入口
- `CLAUDE.md` — 專案規範
- `docs/phase-2-candidate-roadmap.md` — 下一階段候選

---

## 1. 系統目前能做什麼

### ✅ 已可做

| 動作 | 怎麼做 | 詳細 |
|---|---|---|
| 用 VS Code 編輯 Markdown 文章 | 在 `content/{github,blogger}/posts/` 內新增或編輯 `.md` 檔 | `docs/content-schema.md` |
| 本機預覽 GitHub Pages 站 | `npm run dev` | `docs/architecture.md` |
| 產 GitHub Pages 部署檔 | `npm run build` → 輸出 `dist/` | `docs/github-deploy.md` |
| 產 Blogger 可貼用 HTML | `npm run build:blogger` → 輸出 `dist-blogger/posts/{slug}/post.html` | `docs/blogger-export.md` |
| 產 Blogger 主題 CSS | `npm run build:blogger-theme` → 輸出 `dist-blogger/theme/*.css`（貼到 Blogger 主題一次） | 同上 |
| 產 FB 推廣文案 | `npm run build:promotion` → 輸出 `dist-promotion/facebook/{site}/{slug}.txt`（手動複製到 FB） | `docs/promotion-export.md` |
| 驗證文章 metadata | `npm run validate:content`（最近一次已知 baseline `0 error / 39 warning / 34 post(s)`，2026-05-25；baseline 隨 fixture / ready post 自然漂移，以當次結果為準） | `docs/seo-ga4-adsense.md` |
| 用 Admin 總覽看文章狀態 | `npm run dev` 後開 `http://localhost:5173/admin/` | `docs/admin-1-completion-report.md` |
| 設定文章 indexing（GitHub Pages）| `.md` frontmatter 加 `seo: indexing: noindex-follow`；或 `contentKind: download` 自動 noindex | `docs/seo-indexing-rules.md` |
| 觀察 GA4 click event / page_view | GA4 已啟用（measurementId `G-C77SMPF8VD`；自 2026-05-21 production live）；用 GA4 後台 DebugView / Realtime / Reports 觀察 | `docs/20260524-ga4-reverse-utm-observation.md` §4-§6 |

### ⏳ 機制就位但**尚未啟用**

| 動作 | 為何尚未啟用 |
|---|---|
| Admin 真實寫入 `.fb.md` | 需 user 勾選 `docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項；目前只是 dry-run preview |
| Admin 真實寫入 SEO 欄位 | 需 Admin-2-b-2 phase；目前只是 dry-run preview |

### ❌ 第一版**不做**（per `CLAUDE.md` §29）

- 真正後台登入管理 / 視覺化文章編輯器
- Blogger API 自動發文 / Google Drive API 圖片上傳
- 留言系統 / View 數 / 讚數 / 會員系統
- 全文搜尋（純前端 search 留第二階段）
- 自動社群發文

---

## 2. 本機 source repo 與 GitHub Pages deploy repo 的差異

| 維度 | source repo（本機）| deploy repo（GitHub Pages） |
|---|---|---|
| 路徑 | `D:\github\blog-new\portable-blog-system\` | `D:\github\blog-new\portable-blog-deploy\` |
| 用途 | 寫文章 / build / 開發 | 部署檔（`dist/` 之輸出）|
| 編輯對象 | `content/` / `src/` / `docs/` | **只接受 build 後之 dist 內容** |
| Git 角色 | branch main → origin/main；push 屬常規 source 同步流程 | branch gh-pages；推到 GitHub 觸發部署 |
| 操作 | `npm run dev` / `npm run build` / `git commit` | **本批不碰**；deploy pipeline 屬獨立操作 |
| 當前 HEAD | 隨開發進展 | 最近一次已知 deploy 為 `960f234`（2026-05-24；`deploy: update ga4 link_type and hashtag wrap`）；實際 deploy repo HEAD 仍以本機 deploy repo 檢查為準 |

**重要**：source 改完 + commit ≠ 部署到 GitHub Pages。部署需另外把 `dist/` 內容推到 deploy repo 之 gh-pages branch。source repo 與 deploy repo 是獨立流程；GitHub Pages 是否更新需以 gh-pages deploy repo HEAD / production 驗證為準。

---

## 3. Blogger 文章資料與 GitHub 靜態頁的概念差異

| 維度 | GitHub 靜態頁 | Blogger 文章 |
|---|---|---|
| 文章源頭 | `.md` frontmatter + body | **同一份** `.md`（資料源不分裂） |
| 輸出位置 | `dist/posts/{slug}/index.html`（完整網頁）| `dist-blogger/posts/{slug}/post.html`（**只 body fragment**；不含 head；要貼到 Blogger 後台內文） |
| 發布動作 | `npm run build` + 部署 dist 至 GitHub Pages | `npm run build:blogger` + 手動複製 `post.html` 內容 + 貼到 Blogger 後台 + Blogger 後台發布 |
| URL | `https://babel-lab.github.io/portable-blog-system/posts/{slug}/`（自動）| `https://babel-lab.blogspot.com/{year}/{month}/{permalink}.html`（**發布後由 Blogger 平台決定**；需作者手動回填到 `.publish.json`）|
| CSS | 內建於 dist | Blogger 主題一次性貼 `blogger-full-style.css`（per `docs/blogger-export.md` §10）|
| SEO meta | 自動 inject（per `src/views/seo/*.ejs`）| Blogger 主題自動產 / 後台「搜尋設定」管 |
| sitemap | 本系統 `dist/sitemap.xml`（14 url entries）| Blogger 平台自帶 sitemap |
| GA4 | 本系統 `ga4.ejs` 四條件 gating 注入（① `ga4` config 存在；② `enabled === true`；③ `measurementId` 非空；④ `isProdBuild === true`） | **不插**；由 Blogger 主題層 / 後台 GA 設定管 |

**重點**：Blogger 之主動配置（標題 / 搜尋說明 / 標籤 / 自訂網址 / 發布 / robots meta）**仍由作者手動到 Blogger 後台操作**；本系統用 `copy-helper.txt` + `publish-checklist.txt` 提供逐區複製輔助。

---

## 4. Admin 總覽目前是 read-only / dry-run

Admin overview（`http://localhost:5173/admin/`；**dev-mode-only**；prod build 不產出）：

| 區段 | 可做 |
|---|---|
| 列表 + 篩選 + 搜尋 + show-all toggle | ✅ 純查看；可篩 status / channel / completeness / contentKind / FB published |
| 排序（publishedAt desc → id desc fallback）| ✅ 自動；不可改 |
| Detail panel | ✅ 點 row 展開；含 Identity / SEO / Dates / Blogger channel / GitHub channel / FB promotion / FB Post / Completeness summary / Missing fields 等 sections |
| **SEO dry-run editor**（4 欄位：description / searchDescription / titleEn / coverAlt）| ⚠️ **只能 preview 不能 Apply**；計算 diff 後顯示「Dry-run only. No file will be written.」|
| **FB sidecar dry-run editor**（12 欄位）| ⚠️ 同上；client-side preview only；無 fs.write / 無 fetch / 無 form submit |

→ Admin 任何按鈕都**不會寫檔**；如需實際變動必須**用 VS Code 手動編輯**對應 `.md` / `.fb.md`。

### 4.1 Admin 範圍與替代流程

| 操作 | Admin 是否可做 | 正式流程 |
|---|---|---|
| 新增文章 | ❌ 不可 | `npm run new:post`（產生 `.md` template）→ VS Code 編輯 frontmatter / body |
| 修改既有文章 metadata（含 SEO / FB / sidecar 欄位）| ❌ 不可（僅 dry-run preview）| VS Code 編輯對應 `.md` / `.fb.md` / `.publish.json` → `git diff` 檢查 |
| 回填 Blogger publishedUrl | ❌ 不可 | `npm run backfill:url --slug={slug}` 或 VS Code 編輯 `.publish.json` |
| FB promotion 文案產出 | ❌ 不可（無 Admin 按鈕觸發 build）| VS Code 編輯 `.fb.md` → `npm run build:promotion` 產 `dist-promotion/` txt |

⚠️ Admin 目前定位為 **local-only / read-only / dry-run** 工具；任何「真實寫入」皆**不在 Phase 1 範圍**。未來若要啟動 Admin write，需另開 phase（per `docs/admin-2-write-pre-analysis.md` / `docs/fb-sidecar-write-preflight-decision.md`），並過對應 preflight checklist；**不可視為當前 Phase 1 已啟用**。

---

## 5. 如何新增文章的概念流程

### 5.0 `npm run new:post` 使用邊界與替代流程

`npm run new:post [slug]` 目前**只輸出範本文字到 terminal stdout**，**不會自動建立檔案**。使用者必須手動複製 stdout 內容到目標路徑：

| 場景 | new:post 是否適用 | 正式流程 |
|---|---|---|
| GitHub Pages tech-note draft | ✅ 適用 | `npm run new:post my-slug` → 複製 stdout → 手動建檔 `content/github/posts/YYYYMMDD-my-slug.md` → VS Code 編輯 frontmatter / body |
| Blogger 書評 / 雜誌 / 下載 / summary 類文章 | ❌ 不建議 | 直接從 `content/templates/blogger-{book-review,magazine-review,download,summary}-template.md` 手動複製範本 → 改 slug / 日期 / 內容 |
| FB promotion 推廣 | ❌ 不處理 | 另行從 `content/templates/_sample.fb.md` 複製為 `content/{site}/posts/{slug}.fb.md` 並改 `enabled: true`（per `docs/fb-sidecar-schema.md`）|
| Blogger publishedUrl 回填 | ❌ 不處理 | 另行建立 `.publish.json`（per `docs/publish-bundle.md`）；發布後跑 `npm run backfill:url --slug={slug}` 或 VS Code 手動填 `blogger.publishedUrl` |

⚠️ **使用 `new:post` 時注意**：

- stdout 中之 `title: "請填寫文章標題..."` 與 `description: "請填寫 60 字內..."` 為 placeholder 文字；**必須手動替換為實際內容**，不可保留「請填寫...」文字（否則會被當成正式標題 / 摘要 render 並進入 SEO meta）
- `new:post` 預設 `status: "draft"` + `draft: true`；新增後須手動切為 `ready` / `published` 才會進入 build 範圍
- `new:post` template hardcoded 為 GitHub tech-note：`site: "github"` / `contentKind: "tech-note"` / `primaryPlatform: "github"` / `publishTargets.github.enabled: true` / `publishTargets.blogger.enabled: false`；文章類型不符時請改用 `content/templates/*.md` 對應範本
- `blogger-summary-template.md` 是 **GitHub full + Blogger summary 之雙平台摘要模式範本**（與 `post-template.md` / `github-tech-note-template.md` 同屬 GitHub primary）；Blogger primary 之書評 / 雜誌 / 下載類文章請改用 `blogger-book-review-template.md` / `blogger-magazine-review-template.md` / `blogger-download-template.md`
- 檔名建議維持既有 `YYYYMMDD-slug.md` 格式（對齊 `content/{github,blogger}/posts/` 既有檔案命名）；勿用 stdout 註解之 `YYYY-MM-DD-slug.md` 含連字版

### 5.1 GitHub Pages 文章

1. 複製 `content/templates/{post-template,github-tech-note-template}.md` 至 `content/github/posts/{YYYYMMDD-slug}.md`
2. VS Code 編輯 frontmatter（title / slug / category / tags / publishTargets 等；schema 參見 `docs/content-schema.md`）
3. 撰寫 body markdown
4. （可選）建對應 `.fb.md` sidecar：`{YYYYMMDD-slug}.fb.md`（schema 參見 `docs/fb-sidecar-schema.md`）
5. `npm run validate:content` → 確認 `0 error` + 預期 warning
6. `npm run dev` → 本機預覽
7. `npm run build` → 產 dist
8. （可選）`npm run build:promotion` → 產 FB 推廣文字檔
9. `git add` + `git commit`
10. 部署至 GitHub Pages（屬獨立 pipeline；本機 source 不直接 push 至 gh-pages）

### 5.2 Blogger 文章

1-6 同上（status / contentKind / book / affiliate 等依文章類型調整；per `docs/content-schema.md` + `docs/book-schema.md`）
7. `npm run build:blogger` → 產 `dist-blogger/posts/{slug}/` 4 個檔
8. 開 `dist-blogger/posts/{slug}/copy-helper.txt`，依 [1] - [14] 逐區複製到 Blogger 後台對應欄位
9. Blogger 後台預覽 → 確認桌機 + 手機版 → 發布
10. 回填 `blogger.publishedUrl` 至 `.publish.json`（per `npm run backfill:url` 之 CLI helper）
11. （可選）`npm run build:promotion` → 產 FB 推廣文字檔（用發布後正式 URL）
12. `git add` + `git commit`

---

## 6. 如何驗證文章與 sitemap

### 6.1 文章驗證

```bash
npm run validate:content
```

預期：`0 error(s) / 39 warning(s) on 34 post(s)`（最近一次已知 baseline；2026-05-25）

baseline 會隨新 fixture / ready post 自然漂移；operator 應以當次 `validate:content` 結果為準。如出現 error 必須先修；如新 warning 數異常上升需檢查改動。詳見 `docs/seo-indexing-rules.md` §11 之 baseline 計算說明。

### 6.2 sitemap 驗證

```bash
npm run build              # 含 postbuild build:sitemap
grep -c "<url>" dist/sitemap.xml   # 預期 14（本日 baseline）
```

`noindex` 頁面（`contentKind=download` 或 `seo.indexing=noindex-*`）會自動排除於 sitemap；詳見 `docs/seo-indexing-rules.md` §3.

### 6.3 Admin isolation 驗證

```bash
test -d dist/admin && echo FAIL || echo OK
grep -c admin dist/sitemap.xml   # 預期 0
```

Admin 不會進 prod dist / 不會進 sitemap（per `docs/admin-1-completion-report.md` §5）。

---

## 7. GA4 目前狀態

**GA4 已啟用**：production live since 2026-05-21。

- ✅ `content/settings/ga4.config.json`：`enabled: true` + `measurementId: "G-C77SMPF8VD"`
- ✅ `src/views/tracking/ga4.ejs` 四條件 gating（① `ga4` config 存在；② `enabled === true`；③ `measurementId` 非空；④ `isProdBuild === true`）→ dev mode 不送 event；prod build 才注入 gtag script
- ✅ `build-github.js` 已將 `tracking/ga4` partial inject 至 head
- ✅ GitHub Pages production 線上含 GA4 script；`page_view` 自動發送
- ✅ 2026-05-24 G2 click tracking source fix 已 deploy（最近一次已知 deploy `960f234`）；user manual validation passed
- ❌ Blogger 端**不插** GA4 script（由 Blogger 主題 / 後台管；避免重複；per `docs/blogger-listener-strategy.md`）
- 🟡 Reverse UTM Blogger → GitHub：source live but dormant；source 已 push（pm-24a/b/c）但 fixture 未建、Blogger 後台未重貼、GA4 reverse direction 無 production traffic；待 pm-26 階段啟動（per `docs/reverse-utm-fixture-plan.md` §10）

### 7.1 觀察方式

- **Realtime / DebugView**：在 GA4 後台觀察 `page_view` 與 `click_*` event 即時 fire
- **Reports**：GA4 後台 Reports 看 7 天 / 28 天累計
- **詳細 SOP**：`docs/20260524-ga4-reverse-utm-observation.md` §4-§6

### 7.2 歷史註記 / 未來重設時參考

- 2026-05-21 pm-46 完成 8 項必勾 preflight + 啟用 + 驗收（per `docs/ga4-enable-preflight.md` §3.1）
- 若未來需重設 / 換 measurementId / 切站 / 啟用 dev/prod 分流：請先回看 `docs/ga4-enable-preflight.md`

---

## 8. FB sidecar metadata 目前狀態

**已有規劃 + read-only 顯示 + dry-run editor；尚未真實寫入**。

### 已完成

- ✅ `.fb.md` schema（per `docs/fb-sidecar-schema.md`；SEO-2-c 收編 4 個 fb post 欄位）
- ✅ Admin overview FB status badge（`FB: none` / `disabled` / `ready` / `posted` 等）
- ✅ Admin detail FB Post section 14 row read-only display（含 postUrl / postedAt / campaign / audience / hashtags 等）
- ✅ Admin FB Sidecar Dry-run Editor（12 個欄位；client-side preview only；**完全不寫檔**）
- ✅ Blogger copy-helper [14] SEO indexing guidance + publish-checklist indexing manual check row

### 尚未啟用

- ⏳ **FB-P5-c 真實寫入**：必須先過 `docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項 user 勾選 + safety doc 6 項前置確認；當前 Claude 強烈建議拆 P5-c-a（server dry-run validation）+ P5-c-b（真實寫入）兩批，安全收益 > 1 個 commit 之成本
- ⏳ FB Graph API 整合：永禁（per `CLAUDE.md` §29）

⚠️ **手動填 `.fb.md`**：當前唯一可靠之寫入方式是 VS Code 直接編輯 `content/{github,blogger}/posts/{slug}.fb.md`；不要試圖透過 Admin UI 之 Apply / Save 按鈕（不存在）寫入。

---

## 9. 常見問題 FAQ

### Q1：我可以直接在 Admin 改 description 並按 Save 嗎？

❌ **不可以**。Admin SEO dry-run viewer 與 FB Sidecar Dry-run Editor 都是 **client-side preview only**；無 Save / Apply 按鈕；按 "Show Dry-run Diff" 只計算 + 顯示差異；**任何變動皆在瀏覽器 memory；關掉頁面即消失**。如需實際修改，必須用 VS Code 編輯對應 `.md` / `.fb.md` 後 `npm run validate:content` + commit。

### Q2：我發了 Blogger 文章，要怎麼把 FB 貼文 URL 紀錄起來？

**目前流程**：手動編輯 `content/{site}/posts/{slug}.fb.md` 加 `fbPostUrl: "https://www.facebook.com/..."`；之後 `npm run validate:content` + commit。Admin overview 重新整理後會在 detail panel 之 FB Post section 看到該 URL（read-only）。

未來 FB-P5-c 落地後可在 Admin 直接 dry-run editor 編輯 + Apply（但**仍需 user 先過 8 項 preflight checklist**）。

### Q3：我可以啟用 GA4 嗎？

可以，但須**先看 `docs/ga4-enable-preflight.md` 之 §3.1 必勾 checklist**。流程：
1. Google Analytics 4 後台建 property + data stream
2. 取得 measurementId（格式 `G-XXXXXXXXXX`）
3. 編輯 `content/settings/ga4.config.json`：填 measurementId + 切 `enabled: true`
4. `npm run build` 確認 dist head 含 gtag script
5. commit + 部署至 GitHub Pages
6. GA4 realtime report 驗證

⚠️ 啟用後 dev mode 也會送 event 至 GA4（除非另開 prod-only gating phase）；可於 GA4 端設 filter 排除自己 IP。

### Q4：sitemap 為什麼有 14 個 URL？該怎麼調整？

14 個由：home (1) + post-list (1) + post-detail (2 ready posts) + category-list (1) + per-category (2) + tag-list (1) + per-tag (6)。

排除規則：draft / `contentKind=download` / `seo.indexing=noindex-*` 之 post 不入。詳見 `docs/seo-indexing-rules.md` §3 + `docs/seo-sitemap-split-pre-analysis.md`。

如需新增 post 入 sitemap：在 `.md` frontmatter 設 `status: ready` + 不設 noindex；下次 `npm run build` 自動加入。

### Q5：我可以隨便改 .md 之 contentKind 嗎？

合法 contentKind 列舉值（per `CLAUDE.md` §11）：`post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page`。改 contentKind 屬合法操作，但注意：
- `contentKind: download` 自動觸發 noindex + sitemap exclude（per SEO-1）
- `contentKind: book-review` 啟動 book photo + affiliate box 等 conditional render
- 若 frontmatter 之 `book` / `affiliate` / `download` 區塊與 contentKind 不符，可能 warning（per `docs/content-schema.md`）

### Q6：我可以 push 到 GitHub 嗎？

**目前不 push**。本日所有 commits 都只在本機 source repo 之 main branch；branch 無 upstream。如需 push，須先 user 明示「我要 push」+ 設定 upstream + 確認 push target（main 或 release branch）。

deploy repo 之 gh-pages branch 屬完全獨立 pipeline；本機 source 不直接 push 至 gh-pages。

### Q7：Admin 用了之後文章顯示變雜該怎麼辦？

當文章數 > 20 時，Admin overview 預設只顯示最新 20 筆 + 顯示「Show all」toggle 按鈕（per Phase 20260520-b-4；當前 4 筆 < 20 故 toggle 隱藏）。可用既有 search / filter / completeness 篩選輔助。

### Q8：validate baseline 數字變了怎麼辦？

優先**先分析原因**：
1. 若你新增了 fixture（如 `_test-*.md`）→ 預期會增加 warning / issue-post
2. 若你改了 ready post 之 frontmatter → 可能觸發新 warning
3. 若 validator 規則變了 → 全 baseline 重算

baseline 不應「默默漂移」；應在 commit message + docs 明示變動原因（per `docs/seo-indexing-rules.md` §11 之 SEO-2 系列 commit 範例）。

### Q9：第一版要不要做留言 / View 數 / 全文搜尋？

❌ **不做**（per `CLAUDE.md` §29）。屬第二階段 Z 類暫緩。若要做須另開全新 phase 且重評估架構（如要引入後端資料庫 / 留言服務 / search 索引）。

### Q10：CLAUDE.md 看不懂的命名規則怎麼辦？

`CLAUDE.md` §7 採分類編號（A = 專案文件 / B = 設定資料 / C = 內容 / D = 前台模板 / E = Blogger 匯出 / F = GitHub 靜態 / G = 設計系統 / H = SCSS / I = JavaScript / J = SEO / K = Promotion / L = Build / M = 素材 / N = 發布 / Z = 第二階段）。Claude 修改時會盡量說明影響哪些分類；user 可用此編號快速定位範圍。

---

## 10. 第一階段完成前仍需人工確認的項目

以下屬「機制就位但 user 必須親自操作 / 決策」之事項：

| # | 項目 | 文件 |
|---|---|---|
| 1 | FB-P5-c 真實寫入啟動（8 項必勾 + 6 項前置確認） | `docs/fb-sidecar-write-preflight-decision.md` §7 + `docs/fb-sidecar-write-safety.md` §13.1 |
| 2 | sitemap 拆分（不建議當前實作；user 可永遠不做）| `docs/seo-sitemap-split-pre-analysis.md` §7.7 |
| 3 | DS-3-b platform theme 色票（user 設計師確認） | `docs/design-system-ds3b-theme-overrides-proposal.md` §5 |
| 4 | DS-3-c hex 違規修正之視覺差確認（hero gradient）| `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §5.2 |
| 5 | mirror partial 整合（屬 🔴 高風險；user 評估維護痛點再啟動）| `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §7.2 / DS-3-e |
| 6 | Blogger 後台 CSS 重貼時機（若做 DS-3-b-blogger-entry） | `docs/design-system-ds3b-theme-overrides-proposal.md` §5.6 / §7.2 |
| 7 | Blogger 文章發布後回填 publishedUrl（per `npm run backfill:url`） | `docs/publish-workflow.md` |
| 8 | `vite host` 設定（0.0.0.0 vs localhost；影響 FB-P5-c write API 範圍） | `docs/fb-sidecar-write-preflight-decision.md` §3.2 |
| 9 | YAML serializer 策略（A gray-matter / B raw text precise） | `docs/fb-sidecar-write-preflight-decision.md` §3.3 |
| 10 | invalid URL severity（warning / error）| `docs/fb-sidecar-write-preflight-decision.md` §3.4 |
| 11 | rollback automation level（Option A spawn / Option B manual）| `docs/fb-sidecar-write-preflight-decision.md` §3.5 |
| 12 | 新 sidecar 建立流程（屬 FB-P5-e；FB-P5-c v1 不自動建立） | `docs/fb-sidecar-write-preflight-decision.md` §3.6 |
| 13 | deploy repo push 時機與責任分工 | （目前手動操作；無自動化 CI） |

### 歷史註記

- 原 #1「GA4 measurementId 啟用」：✅ 已完成（2026-05-21 起 production live，measurementId `G-C77SMPF8VD`；2026-05-24 G2 click tracking source fix deploy 後再次驗收通過）。`docs/ga4-enable-preflight.md` 僅保留作為未來重設 / 換 measurementId / 新站啟用時之參考。

---

## 11. 邊界聲明

- ✅ 本文件**僅為操作手冊草稿**；不改任何 source / settings / template / dist / deploy
- ✅ 任何「⏳ 尚未啟用」之功能必須先過對應 preflight；不可擅自啟用
- ✅ 任何「❌ 第一版不做」之功能屬 `CLAUDE.md` §29 範圍；要做必須另開全新 phase
- ✅ 本文件之資訊以 `CLAUDE.md` 為準；若衝突以 CLAUDE.md 為主

---

（本文件結束）
