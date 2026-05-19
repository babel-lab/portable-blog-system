# github-deploy-checklist

GitHub Pages 部署操作勾選清單。配套詳細說明見 `docs/github-deploy.md`。

> **使用方式**：每次部署皆對照本 checklist 逐項勾選。首次部署需走 §1-§5；後續增量部署可從 §2 開始（跳過 §3 / §5 之首次設定）。

---

## §1 部署前 user 決策

僅首次部署需執行；後續部署若 §1.1-§1.6 未變，跳過。

- [ ] §1.1 GitHub repo 名稱已決定（依 user site / project site 路線）
- [ ] §1.2 repo public / private 已決定
- [ ] §1.3 是否啟用 GitHub Pages 已決定
- [ ] §1.4 source / dist 同 repo（gh-pages branch）已決定
- [ ] §1.5 GitHub Pages URL 形式（user / project site）已決定
- [ ] §1.6 `content/settings/site.config.json.githubSiteUrl` 已確認符合 §1.5 路線

對應 runbook §2 / §2.1。

---

## §2 本地 build 準備

每次部署皆須執行。

- [ ] §2.1 `git status` clean
- [ ] §2.2 `git log` HEAD 為預期 stable snapshot
- [ ] §2.3 `npm run validate:content` 通過（0 error）
- [ ] §2.4 `npm run build` 成功
- [ ] §2.5 `npm run build:sitemap` 成功（**必須在 `npm run build` 之後**）
- [ ] §2.6 dist 內容齊全：
  - [ ] `dist/index.html`
  - [ ] `dist/posts/{slug}/index.html`（含所有 ready post 之 slug）
  - [ ] `dist/categories/` + `dist/tags/` + `dist/design-system/` + `dist/404.html`
  - [ ] `dist/sitemap.xml`
  - [ ] `dist/robots.txt`
  - [ ] `dist/assets/` + `dist/favicon/` + `dist/icons/` + `dist/images/` + `dist/downloads/`

對應 runbook §4。

---

## §3 GitHub repo 建立 + remote 設定 + main push

僅首次部署需執行；後續部署跳過。

- [ ] §3.1 GitHub 端 repo 已建立
  - [ ] 未勾選 Add README
  - [ ] 未勾選 Add .gitignore
  - [ ] 未勾選 Choose a license
- [ ] §3.2 `git remote add origin <repo-url>` 已執行
- [ ] §3.3 `git remote -v` 顯示 origin（含 fetch / push）
- [ ] §3.4 `git push -u origin main` 成功

對應 runbook §3。

---

## §4 gh-pages branch 部署

每次部署皆須執行（首次採 `--orphan`；後續為增量更新）。

- [ ] §4.1 已決定採用 §5.2.A 手動 copy / 5.2.B git worktree / 5.2.C git subtree 之一
- [ ] §4.2 第二 clone / worktree 目錄已建立並 checkout gh-pages（首次採 `--orphan`）
- [ ] §4.3 dist 內容已 copy / sync 至 gh-pages 目錄
- [ ] §4.4 `.nojekyll` 空檔已建立（避免 Jekyll 預設處理）
- [ ] §4.5 `git add .` / `git commit` / `git push origin gh-pages` 已執行

對應 runbook §5。

---

## §5 GitHub Pages 啟用

僅首次部署需執行；後續部署 GitHub Pages 會自動跟 gh-pages branch。

- [ ] §5.1 Settings → Pages 已開啟
- [ ] §5.2 Source 選 `Deploy from a branch`
- [ ] §5.3 Branch 選 `gh-pages`，Folder 選 `/ (root)`
- [ ] §5.4 已 Save，等候部署完成
- [ ] §5.5 Pages URL 已記錄

對應 runbook §6。

---

## §6 上線後驗證

每次部署皆須執行（重點檢查近期變動之 post / 區塊）。

### Functional

- [ ] 首頁可開啟
- [ ] `/posts/we-media-myself2/` 可開啟
- [ ] `/posts/github-pages-blog-planning/` 可開啟
- [ ] `/posts/portable-blog-system-mvp/` 可開啟
- [ ] `/sitemap.xml` 可開啟（含預期 url entries）
- [ ] `/robots.txt` 可開啟
- [ ] `/404.html`（或不存在路徑 fallback 至 404）
- [ ] `/categories/` + `/tags/` 可開啟

### Assets

- [ ] CSS 載入正常
- [ ] JS 載入正常
- [ ] images 載入正常
- [ ] favicon 正常顯示

### Mobile

- [ ] 手機版首頁基本檢查
- [ ] 手機版 post detail 基本檢查
- [ ] 手機版 sticky header / drawer / back to top 互動正常

### Console / SEO（可選）

- [ ] Browser console 無 404 / JS error
- [ ] Google Rich Results Test 手動測 1-2 篇 post detail 之 JSON-LD（含 BlogPosting / mentions / isPartOf / Book mainEntity）
- [ ] sitemap 提交 Google Search Console（可選；首次部署後做一次）
- [ ] GA4 / UTM 接入確認（若已啟用）

對應 runbook §7。

---

## §7 部署完成紀錄

每次部署可在此 append 一行紀錄：

| 日期 | HEAD（main）| Pages URL | 備註 |
|---|---|---|---|
| 2026-05-19 | `eb24097` | https://babel-lab.github.io/portable-blog-system/ | initial deploy（deploy commit `720a349`；含 root-absolute internal links bug；發現 blocker 後 redeploy）|
| 2026-05-19 | `bc4340f` | 同上 | internal-link fix redeploy（deploy commit `fbfc691`；basePath helper + 13 templates；§6 4/4 驗收通過）|
| 2026-05-19 | `ab9e305` | 同上 | back-to-top button fix redeploy（deploy commit `02d9d7b`；base.ejs +1 line；§7 9/9 驗收通過）|
