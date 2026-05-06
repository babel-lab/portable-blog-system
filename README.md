# Portable Blog System

依 `CLAUDE.md` 建立的「可搬家的本機資料夾型內容管理系統」。
Phase 1 收尾版本：GitHub Pages 站可在本機完整預覽，文章來自 Markdown + frontmatter，設定來自 JSON。

## 專案定位

- VS Code 管理 Markdown 文章與 JSON 設定，內容不綁死在 Blogger
- Vite + EJS + SCSS + Vanilla JS 建立 GitHub Pages 靜態站
- Blogger 作為既有流量入口與 AdSense 內容站（Phase 3 才做匯出）
- 第一版不做登入後台、會員、資料庫、留言、View 數、Like 數

## 第一次使用

```bash
npm install
npm run dev
```

`npm run dev` 透過 `predev` 先跑 build，再啟 Vite。
瀏覽器自動開首頁（port 5173 起跳，被佔用會自動往上）。

## 主要 npm 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 本機預覽（自動先跑 build:data） |
| `npm run build` | Vite production build 到 `dist/`（自動先跑 build:data） |
| `npm run preview` | 預覽 `dist/` |
| `npm run build:data` | 讀 Markdown + settings → 渲染 EJS → 寫 `.cache/pages/`、`.cache/data/posts.json`、`site.json`、`build-manifest.json` |
| `npm run build:github` | 同 `build:data` 的 alias |
| `npm run validate:content` | 獨立驗證文章 frontmatter 的 category / tags 是否在 settings 中存在（僅 warn） |
| `npm run build:blogger` | 占位（Phase 3） |
| `npm run build:promotion` | 占位（Phase 4） |
| `npm run build:sitemap` | 占位（Phase 5） |
| `npm run build:blogger-theme` | 占位（Phase 3） |

## 可用頁面與 URL（Phase 1 完工狀態）

| 路徑 | 說明 | HTTP |
|---|---|---|
| `/` | 首頁，列出 ready 文章卡片 | 200 |
| `/posts/` | 文章列表頁 | 200 |
| `/posts/{slug}/` | 文章詳細頁（render markdown body） | 200 |
| `/categories/` | 分類索引（只列有 ready 文章引用的分類） | 200 |
| `/categories/{slug}/` | 該分類文章清單 | 200（有引用才生成） |
| `/tags/` | 標籤索引（只列有 ready 文章引用的標籤） | 200 |
| `/tags/{slug}/` | 該標籤文章清單 | 200（有引用才生成） |
| `/404.html` | 自訂 404（GitHub Pages 部署後會自動 fallback） | 200（手動瀏覽） |
| `/design-system/` | Design System 占位（Phase 2 才填內容） | 200 |
| 不存在路徑 | Vite mpa 預設 404 | 404 |
| draft 文章的 `/posts/{slug}/` | 不產生 HTML | 404 |
| 無 ready 文章的分類 / 標籤 | 不產生 HTML | 404 |

## 內容資料夾

```
content/
├── github/posts/        # GitHub 站 Markdown 文章
├── blogger/posts/       # Blogger 站 Markdown 文章（Phase 3 才匯出）
├── shared/posts/        # 跨站文章
├── drafts/、archive/    # 暫存與封存
├── templates/           # frontmatter 範本
└── settings/            # 14 個 JSON 設定檔
```

詳細結構與各檔案用途見 `CLAUDE.md` §3 與 §8。

## Frontmatter 必填欄位（簡要）

依現有 ready 範例 `content/github/posts/20260504-portable-blog-system-mvp.md`：

```yaml
---
id: "20260504-portable-blog-system-mvp"   # 唯一識別
site: "github"                              # 目前 build 流程只讀 site=github
type: "tech-note"
title: "Portable Blog System MVP 開發筆記"
slug: "portable-blog-system-mvp"            # 決定 /posts/{slug}/
date: "2026-05-04"
category: "tech-note"                       # 必須存在於 settings/categories.json
tags: [github, vite, static-site]           # 每項必須存在於 settings/tags.json
status: "ready"                             # ready / published 才會產生 HTML
draft: false                                # true 直接排除
---

# 文章正文（Markdown）
```

完整 schema 見 `CLAUDE.md` §3.1。

## 發布狀態與 draft 過濾

`load-posts.js` 的過濾規則：

- `draft: true` → 排除
- `status: "draft"` 或 `"archived"` 或缺值 → 排除
- `status: "ready"` 或 `"published"` → 列入 `posts.json` 的 `posts[]`，會產生 HTML

被排除的文章會列在 `.cache/data/posts.json` 的 `filteredOut[]`，方便除錯。

## Phase 1 已完成項目

### Phase 1-A（資料管線）
- 1-A-1：Markdown frontmatter 讀取、draft 過濾、輸出 `posts.json`
- 1-A-2：`load-settings` 讀全 14 個 JSON、`validate-content` 警告未知 tag/category、輸出 `site.json` 與 `build-manifest.json`

### Phase 1-B（頁面渲染）
- 1-B-1：Vite root 切到 `.cache/pages`、`base/head/header/footer.ejs` 最小實作、首頁
- 1-B-2：文章詳細頁，markdown body 透過 `markdown-it` render
- 1-B-3：文章列表頁 `/posts/`

### Phase 1-C（收尾）
- 1-C-1：分類頁 `/categories/{slug}/`、標籤頁 `/tags/{slug}/`
- 1-C-2：404 頁、Design System 首頁占位、`nav.ejs` + Header 整合、分類索引 `/categories/`、標籤索引 `/tags/`
- 1-C-3：本檔 README + Phase 1 全面收尾驗收

## 目前限制

- **Markdown body 起首 `# 標題` 與 article header `<h1>` 重複**：1-B-2 已知限制，留 Phase 2 統一處理
- **無 SCSS 精緻樣式**：Phase 0 SCSS partial 為最小可顯示，Phase 2 才精緻化
- **Header 無 sticky 行為、無 Mobile Drawer、無 Back to Top 互動**：JS 模組存在但 HTML 未掛 data attribute → Phase 6
- **`vite.config.js` 採 `appType: 'mpa'`**：dev 階段不存在路徑回 Vite 預設 404，**不**自動載入 `/404.html`；GitHub Pages 部署後才會自動 fallback
- **無連結處理器**：外部連結未自動加 `nofollow`、聯盟連結未加 `sponsored`、Blogger↔GitHub 互導未加 UTM → Phase 5
- **目前不是 git repo**：尚未 `git init`。日後若初始化 git，`.gitignore` 已涵蓋 `.cache/`、`dist*/`、`node_modules/` 等
- **GitHub Pages 部署**：尚未配置 deploy workflow、未綁自訂網域 → Phase 5+

## Phase 2 及後續待辦（依 CLAUDE.md §6）

- **Phase 2** Design System 子頁與 SCSS 精緻化（Colors / Spacing / Typography / Buttons / Cards / Article Components）
- **Phase 3** Blogger 匯出：full / summary / redirect-card、copy-helper、publish-checklist、Blogger 主題 CSS
- **Phase 4** FB Promotion 匯出（每篇文章 → 可貼粉絲頁文案 txt）
- **Phase 5** SEO / GA4 / AdSense / sitemap / robots / 連結處理器
- **Phase 6** RWD / Sticky Header / Mobile Drawer / Back to Top JS / 圖片 lazy
- **Phase 7** 發布 checklist / 備份策略 / build report
- **Phase 8（暫緩）** View 數、Like、留言、會員、後端、Blogger API、Drive API

## 修改本專案

任何 source 變更前請先閱讀 `CLAUDE.md`，並依 §27 流程：

1. 列出修改目標、影響分類編號、不會修改的檔案、預計新增 / 修改檔案
2. 取得確認後動工
3. 完成後回報新增 / 修改 / 備份 / 驗收結果

`docs/` 內含 Phase 0 規劃文件，可作為 Phase 2-7 細節參考。
