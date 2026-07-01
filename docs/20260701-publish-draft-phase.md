# 20260701 Publish Draft Phase — GitHub Pages 首篇 draft 發布 + SEO meta follow-up

本文件記錄 2026-07-01 將指定 GitHub draft 發布上線的 phase ledger，以及後續 SEO meta「草稿」字樣的極小修正 slice。範圍嚴格限定於單一指定文章，未觸及其他 draft、其他平台或任何外部後台。

## 1. 範圍

- 目標文章（唯一）：`content/github/posts/2026-07-01-github-pages-build-preview-workflow.md`（slug `github-pages-build-preview-workflow`）
- 不觸及：`2026-06-29-admin-ui-draft-generator-first-test.md`（仍 draft）、任何其他 draft、Blogger / GA4 / AdSense / Search Console / Google Drive 後台
- CLAUDE.md、MEMORY.md / memory 未變動

## 2. Preflight（read-only）

- baseline：`main` HEAD == origin/main == `273ae26`、ahead/behind 0/0、working tree clean、`.git/index.lock` absent
- 目標 draft frontmatter 合法；`category: tech-note` 與 `tags: github/vite/static-site` 皆存在於 registry
- `validate:content` = 0 error / 134 warning / 106 posts（發布前 carry-forward baseline）
- `check:admin-markdown-export` = 174 / 174 PASS

## 3. Publish draft phase（commit `53b02e9` / deploy `9963dfe`）

內容修正（發布前移除 body 自我矛盾，surface 後最小修改）：

- 前言 L53：「這是一份草稿，用來記錄…」→「這篇筆記記錄…」
- 結論 L131：「這份草稿維持 draft 狀態，尚未進入正式輸出流程。…」→「這篇筆記整理了 GitHub Pages 本機 build 與 preview 的基本流程。…」

Frontmatter：

- `status: "draft"` → `"published"`
- `draft: true` → `false`

檢查與發布：

- `validate:content` 發布後 = 0 error / 135 warning / 107 posts（+1 post 為本文進入正式集合；+1 warning = 本文 `missing-cover`，warning-only、非 blocking）
- main commit `53b02e9`（`273ae26..53b02e9`，1 file 4+/4−）
- 全站 build 後對 live gh-pages 逐檔 diff：新增文章頁 1、listing/category/tag/prev-next/sitemap 新增本文項；其餘頁面僅 JS bundle 引用 hash（`entry-C5a2ojLk.js`→`entry-CS6SReMr.js`）變動；CSS byte-identical；0 刪除、`.nojekyll` 保留；**無其他文章 body 內容被改**
- gh-pages deploy commit `9963dfe`（`362f396..9963dfe`，29 files 457+/50−，含 1 add / 27 mod / 1 rename）
- live 驗證：`https://babel-lab.github.io/portable-blog-system/posts/github-pages-build-preview-workflow/` = HTTP 200、H1 正確、「維持 draft 狀態」字句已不存在

## 4. SEO meta follow-up（commit `b4b8ecc` / deploy `d0f37eb`）

只改目標文章 frontmatter 兩行 SEO 文案，移除「草稿」、改發布版語氣（body 不大改）：

- `description`：移除「工作流程草稿」與「測試內容」→「工作流程…並整理 Admin UI / Markdown 匯出流程的實作重點。」
- `searchDescription`：「預覽流程草稿」→「預覽流程筆記」

檢查與發布：

- `validate:content` = 0 error / 135 warning / 107 posts（目標僅 `missing-cover`，未新增 error/warning）
- `check:admin-markdown-export` = 174 / 174 PASS
- main commit `b4b8ecc`（`53b02e9..b4b8ecc`，1 file 2+/2−）
- build 後 dist diff：0 新增 / 0 刪除、JS bundle 未變；僅 7 個顯示本文 description 的頁面變動（文章頁 meta/OG/Twitter/JSON-LD 4 處 + 首頁/文章列表/tech-note 分類/github·vite·static-site 三 tag 頁卡片各 1 處）
- gh-pages deploy commit `d0f37eb`（`9963dfe..d0f37eb`，7 files 10+/10−，0 刪除）
- live 驗證：文章頁 `<meta name="description">` 已更新為含「實作重點」、無「草稿」

## 5. 已知非 blocking 項

- 目標文章 `missing-cover`（`cover: ""`）= warning-only；本文原無封面圖，維持現狀
- `admin-ui-draft-generator-first-test.md` 仍為 draft，未發布（刻意保留）

## 6. Freeze snapshot（2026-07-01）

- main：HEAD = origin/main = `b4b8ecc`、ahead/behind 0/0、working tree clean
- gh-pages（deploy clone）：HEAD = origin/gh-pages = `d0f37eb`、ahead/behind 0/0、working tree clean
- `.git/index.lock` absent（both）
- validation carry-forward：`validate:content` 0/135/107、`check:admin-markdown-export` 174/174
