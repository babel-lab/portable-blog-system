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
| 驗證文章 metadata | `npm run validate:content`（目前 baseline `0 error / 38 warning / 33 issue-post`） | `docs/seo-ga4-adsense.md` |
| 用 Admin 總覽看文章狀態 | `npm run dev` 後開 `http://localhost:5173/admin/` | `docs/admin-1-completion-report.md` |
| 設定文章 indexing（GitHub Pages）| `.md` frontmatter 加 `seo: indexing: noindex-follow`；或 `contentKind: download` 自動 noindex | `docs/seo-indexing-rules.md` |

### ⏳ 機制就位但**尚未啟用**

| 動作 | 為何尚未啟用 |
|---|---|
| GA4 收 event | 需 user 填 `content/settings/ga4.config.json` 之 `measurementId` + 切 `enabled: true`（per `docs/ga4-enable-preflight.md` §3.1 必勾 checklist）|
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
| Git 角色 | branch main；本機開發；當前無 upstream 不 push | branch gh-pages；推到 GitHub 觸發部署 |
| 操作 | `npm run dev` / `npm run build` / `git commit` | **本批不碰**；deploy pipeline 屬獨立操作 |
| 當前 HEAD | 隨開發進展 | 固定於 `4ecd92d`（今日未動） |

**重要**：source 改完 + commit ≠ 部署到 GitHub Pages。部署需另外把 `dist/` 內容推到 deploy repo 之 gh-pages branch。**今日所有 commits 都只在 source repo；GitHub Pages 線上版未變**。

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
| GA4 | 本系統 `ga4.ejs` 雙條件 gating 注入 | **不插**；由 Blogger 主題層 / 後台 GA 設定管 |

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

---

## 5. 如何新增文章的概念流程

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

預期：`0 error(s) / 38 warning(s) on 33 issue-post(s)`（本日 baseline）

如出現 error 必須先修；如新 warning 數異常上升需檢查改動。詳見 `docs/seo-indexing-rules.md` §11 之 baseline 計算說明。

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

**機制完整就位；尚未啟用**。

- ✅ `content/settings/ga4.config.json` 已含 `measurementId` 欄位（**目前空字串**）+ `enabled: false`
- ✅ `src/views/tracking/ga4.ejs` 已實作雙條件 gating（只當 `enabled === true && measurementId 非空` 才輸出 gtag script）
- ✅ `build-github.js` 已將 `tracking/ga4` partial inject 至 head
- ❌ **measurementId 未填**；**enabled 仍 false** → GitHub Pages 線上 **無 GA4 script**（grep 證實）
- ❌ Blogger 端**不插** GA4（由 Blogger 主題 / 後台管；避免重複）

**啟用步驟**：詳見 `docs/ga4-enable-preflight.md` §3.1 之 8 項必勾 checklist（含 measurementId 來源 / dev/prod gating 決策 / Search Console 連結）。

⚠️ **不要擅自填 measurementId**；應先看 `ga4-enable-preflight.md` 之決策後再操作。

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
| 1 | GA4 measurementId 啟用（8 項必勾 checklist） | `docs/ga4-enable-preflight.md` §3.1 |
| 2 | FB-P5-c 真實寫入啟動（8 項必勾 + 6 項前置確認） | `docs/fb-sidecar-write-preflight-decision.md` §7 + `docs/fb-sidecar-write-safety.md` §13.1 |
| 3 | sitemap 拆分（不建議當前實作；user 可永遠不做）| `docs/seo-sitemap-split-pre-analysis.md` §7.7 |
| 4 | DS-3-b platform theme 色票（user 設計師確認） | `docs/design-system-ds3b-theme-overrides-proposal.md` §5 |
| 5 | DS-3-c hex 違規修正之視覺差確認（hero gradient）| `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §5.2 |
| 6 | mirror partial 整合（屬 🔴 高風險；user 評估維護痛點再啟動）| `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §7.2 / DS-3-e |
| 7 | Blogger 後台 CSS 重貼時機（若做 DS-3-b-blogger-entry） | `docs/design-system-ds3b-theme-overrides-proposal.md` §5.6 / §7.2 |
| 8 | Blogger 文章發布後回填 publishedUrl（per `npm run backfill:url`） | `docs/publish-workflow.md` |
| 9 | `vite host` 設定（0.0.0.0 vs localhost；影響 FB-P5-c write API 範圍） | `docs/fb-sidecar-write-preflight-decision.md` §3.2 |
| 10 | YAML serializer 策略（A gray-matter / B raw text precise） | `docs/fb-sidecar-write-preflight-decision.md` §3.3 |
| 11 | invalid URL severity（warning / error）| `docs/fb-sidecar-write-preflight-decision.md` §3.4 |
| 12 | rollback automation level（Option A spawn / Option B manual）| `docs/fb-sidecar-write-preflight-decision.md` §3.5 |
| 13 | 新 sidecar 建立流程（屬 FB-P5-e；FB-P5-c v1 不自動建立） | `docs/fb-sidecar-write-preflight-decision.md` §3.6 |
| 14 | deploy repo push 時機與責任分工 | （目前手動操作；無自動化 CI） |

---

## 11. 邊界聲明

- ✅ 本文件**僅為操作手冊草稿**；不改任何 source / settings / template / dist / deploy
- ✅ 任何「⏳ 尚未啟用」之功能必須先過對應 preflight；不可擅自啟用
- ✅ 任何「❌ 第一版不做」之功能屬 `CLAUDE.md` §29 範圍；要做必須另開全新 phase
- ✅ 本文件之資訊以 `CLAUDE.md` 為準；若衝突以 CLAUDE.md 為主

---

（本文件結束）
