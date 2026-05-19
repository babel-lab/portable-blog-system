# F-01 github deploy

GitHub Pages 部署 runbook。本機 `npm run build` 產出 `dist/`，再透過手動 / CI / branch push 部署至 GitHub Pages。

> **本 runbook scope**：第一版採**最小風險**之手動部署流程；當部署穩定後可演進至 CI 自動化。
>
> **配套 checklist**：`docs/checklists/github-deploy-checklist.md` 為操作型勾選清單；本文件為策略 + 步驟說明。

---

## 1. 部署策略總覽

| 方案 | 描述 | 優點 | 缺點 | 推薦度 |
|---|---|---|---|---|
| **A** | GitHub Actions CI 自動 build + deploy | 全自動化；零人工 | source repo 通常需 public（Pro/Team 才能 private Pages）；需 workflow yml 學習與 debug | 進階；非第一版 |
| **B** | source repo private + 另建 public dist repo | source 隱私性高 | 兩 repo 同步漂移風險高；管理成本高 | 不推薦 |
| **C**（推薦）| 同 repo + gh-pages branch 手動部署 | 與既有 build workflow 一致；無新增依賴；人工驗證每次部署 | 每次部署需人工跑 build + push gh-pages | ✅ **第一版採用** |

**為何推薦方案 C**：

- 與 `npm run build` + `npm run build:sitemap` 既有流程完全相容
- 無新增 CI yml / 第二 repo / 同步機制
- 人工驗證每次部署 → 部署過程透明、易回溯
- 穩定後可往方案 A 遷移，無需重建 repo 結構

---

## 2. 部署前 user 必須決策

部署前 user 需先決定以下 6 項：

| # | 決策 | 影響 | 建議 |
|---|---|---|---|
| 1 | **GitHub repo 名稱** | 決定 user site（必須 `<username>.github.io`）或 project site（任意名稱）| 視 §2.1 表決定 |
| 2 | **repo public / private** | private + Pages 啟用需 GitHub Pro / Team plan；public 為免費 plan 預設可用 | 多數情境 public |
| 3 | **是否啟用 GitHub Pages** | 若否，repo 為純 source 託管；無需 §6 後續步驟 | 本 runbook 假設啟用 |
| 4 | **source 與 dist 是否同 repo** | 同 repo + gh-pages branch（方案 C）/ 分 repo（方案 B）| 推薦同 repo |
| 5 | **GitHub Pages URL 形式** | user site `https://<username>.github.io/` 或 project site `https://<username>.github.io/<repo>/` | 視 §2.1 |
| 6 | **`site.config.json.githubSiteUrl` 是否需要調整** | 影響 sitemap.xml 之 absolute URL 與 canonical | 視 §2.1 |

### 2.1 user site vs project site 對照

| 維度 | User site | Project site |
|---|---|---|
| **repo 名稱** | 必須 `<username>.github.io` | 任意（如 `portable-blog-system`）|
| **Pages URL** | `https://<username>.github.io/` | `https://<username>.github.io/<repo>/` |
| **`site.config.json.githubSiteUrl`** | `https://<username>.github.io`（當前值；無需改）| 必須改為 `https://<username>.github.io/<repo>`（含 subpath）|
| **`sitemap.xml` 內 absolute URL** | root domain；無需重 build | 需重 build:sitemap 以反映 subpath |
| **vite.config.js `base`** | 當前 `'./'`（build 模式）即可 | 當前 `'./'`（relative）也適用；可考慮改 `/<repo>/` 但非必要 |
| **適合情境** | 主站 / 永久站 | 多專案站 / 實驗站 |

**當前 `site.config.json.githubSiteUrl = "https://babel-lab.github.io"`** → 預設假設 user site；repo 名應為 `babel-lab.github.io`。

⚠️ 若採 project site，**必須先**調整 `content/settings/site.config.json` 之 `githubSiteUrl` 為含 subpath 之 URL，並重跑 `npm run build` + `npm run build:sitemap`，否則 `dist/sitemap.xml` 內之 absolute URL 與 canonical 會錯。

---

## 3. 建立 GitHub repo + 設定 remote + 首次 push

### 3.1 在 GitHub 建立 repo

於 https://github.com/new 建立 repo：

- **Repository name**：依 §2.1 決策（user site → `<username>.github.io`；project site → 自訂）
- **Public / Private**：依 §2 decision 2
- ⚠️ **不勾選** Initialize this repository with：
  - [ ] Add a README file
  - [ ] Add .gitignore
  - [ ] Choose a license

**理由**：本地 repo 已有 `README.md` / `.gitignore`；GitHub 端勾選會產生衝突 commit，首次 push 需 force / merge，徒增風險。

### 3.2 設定 remote

```bash
git remote add origin <repo-url>
git remote -v
```

預期輸出：

```
origin  <repo-url> (fetch)
origin  <repo-url> (push)
```

### 3.3 首次 push main

```bash
git status                # 確認 working tree clean
git log --oneline -5      # 確認 HEAD 為預期 commit
git push -u origin main
```

`-u` 設 upstream tracking，後續 `git push` / `git pull` 可省略 `origin main`。

**push 前必確認**：

- ✅ working tree clean（不要 push 髒狀態）
- ✅ HEAD 為穩定 snapshot（建議搭配 Phase X-z 之 final stable snapshot commit）
- ✅ branch 為 `main`（不要在 feature branch push 為 main）

---

## 4. build 與 dist 產出流程

部署前必跑完整 build 順序（per `docs/publish-workflow.md` §3）：

```bash
npm run validate:content     # 預期 0 error
npm run build                # vite build + prebuild（自動跑 build-github）
npm run build:sitemap        # ⚠️ 必須在 build 之後（vite emptyOutDir 會清掉）
```

build 完成後確認 `dist/` 內容齊全：

| 路徑 | 預期狀態 |
|---|---|
| `dist/index.html` | ✅ 存在 |
| `dist/posts/{slug}/index.html` × N（每篇 ready post 各 1 個）| ✅ 存在 |
| `dist/categories/` + `dist/tags/` | ✅ 存在 |
| `dist/design-system/` | ✅ 存在（內部 noindex）|
| `dist/404.html` | ✅ 存在 |
| `dist/sitemap.xml` | ✅ 存在 |
| `dist/robots.txt` | ✅ 存在 |
| `dist/assets/entry-*.js` + `dist/assets/entry-*.css` | ✅ 存在 |
| `dist/favicon/` + `dist/icons/` + `dist/images/` + `dist/downloads/` | ✅ 存在（`public/` 經 vite copy）|

若任一缺失，請回頭檢查 build script 是否完整跑過。

---

## 5. gh-pages branch 手動部署流程

### 5.1 為何 dist 不入 main 之設計

`dist/*` 受 `.gitignore` 覆蓋（per `.gitignore` line 2-3）；**main branch 永遠不應 commit dist**。理由：

- main branch 為 source code + docs 之 single source of truth
- dist 為 build artifact，每次 build 結果可能不同（含 builtAt 時戳）
- main 混入 dist 會讓 source diff 被 dist 變動淹沒

⚠️ **不要** `git add -f dist/` 強加入 main；若不小心做了，請 `git rm --cached -r dist/` 並重 commit 清除。

### 5.2 gh-pages branch 部署三種路徑

| 路徑 | 描述 | 適合情境 |
|---|---|---|
| **5.2.A 手動 copy**（推薦最小風險）| 用第二個 clone / 本地目錄管理 gh-pages branch；手動 copy dist 內容 | 第一次部署；想完全控制每一步 |
| **5.2.B `git worktree`** | 用 `git worktree add` 在另一目錄 checkout gh-pages；同 repo 兩 worktree 並行 | 熟悉 git 後續迭代 |
| **5.2.C `git subtree`** | 用 `git subtree push --prefix dist origin gh-pages` 自動推送 dist 子樹至 gh-pages | 流程穩定後 |

### 5.3 推薦最小風險路徑（5.2.A 手動 copy）

```bash
# 1. 確認本地 main 部署準備完成
git status                   # clean
ls dist/                     # 確認 §4 表所有產物齊全

# 2. 在另一目錄 clone repo + checkout gh-pages
cd ..
git clone <repo-url> portable-blog-deploy
cd portable-blog-deploy
git checkout --orphan gh-pages
git rm -rf .                 # 清掉預設 main 內容

# 3. 從原 repo 之 dist copy 內容
cp -r ../portable-blog-system/dist/* .

# 4. 確認 .nojekyll（避免 GitHub Pages 預設 Jekyll 處理）
touch .nojekyll              # 必要：避免 _ 開頭資料夾被 Jekyll 忽略

# 5. commit + push
git add .
git commit -m "deploy: initial gh-pages content from dist <commit-hash>"
git push -u origin gh-pages
```

⚠️ **`.nojekyll` 是必要的**：GitHub Pages 預設用 Jekyll 處理；若 dist 含 `_` 開頭資料夾或 file，會被忽略。空檔 `.nojekyll` 告訴 GitHub Pages 跳過 Jekyll。

### 5.4 後續部署（增量更新）

```bash
# 在 portable-blog-deploy 目錄
cd ../portable-blog-deploy
rm -rf ./*                   # 清舊內容；保留 .git
cp -r ../portable-blog-system/dist/* .
touch .nojekyll              # 必要
git add .
git commit -m "deploy: <commit-hash> snapshot"
git push origin gh-pages
```

---

## 6. GitHub Pages 設定

push gh-pages branch 後，於 GitHub repo 啟用 Pages：

1. 進入 repo 之 **Settings** → **Pages**
2. **Source**：選 `Deploy from a branch`
3. **Branch**：選 `gh-pages`
4. **Folder**：選 `/ (root)`
5. 按 **Save**
6. 等候 1-5 分鐘 GitHub 部署完成
7. 頁面頂端會顯示 `Your site is live at <Pages URL>`
8. **記錄產生的 Pages URL**（建議寫入 deploy log 或本 repo 之 README）

---

## 7. 上線後驗證 checklist

> 操作型勾選見 `docs/checklists/github-deploy-checklist.md` §6；以下為說明。

### 7.1 Functional

- 首頁 `<Pages URL>/` 可開啟，無 404
- `/posts/{slug}/` 可開啟（含 we-media-myself2 / github-pages-blog-planning / portable-blog-system-mvp 三篇 ready post）
- `/sitemap.xml` 可開啟，內容含預期 url entries（per `npm run build:sitemap` stdout 之 url count）
- `/robots.txt` 可開啟，含 `Sitemap:` 引用 + `Disallow: /design-system/` + `Disallow: /404.html`
- `/404.html` 可開啟（或瀏覽不存在路徑會 fallback 至 404）
- `/categories/` + `/tags/` 可開啟

### 7.2 Assets

- CSS 載入正常（首頁樣式渲染完整）
- JS 載入正常（無 console 紅字）
- images 載入正常（首頁 / post detail 之 cover / inline 圖）
- favicon 正常顯示

### 7.3 Mobile / Responsive

- 手機版首頁基本檢查（hamburger / drawer / 字級）
- 手機版 post detail 基本檢查
- 手機版 sticky header / back to top 互動正常

### 7.4 Console

- 瀏覽器 console 無明顯 404
- 瀏覽器 console 無 JS error
- Network tab 確認 assets 路徑正確（依 §2.1 user / project site 判定）

### 7.5 SEO / 進階驗證（非阻擋，屬 SOP）

- Google Rich Results Test 手動測首頁 / 1 篇 post detail 之 JSON-LD（含 BlogPosting / mentions / isPartOf / Book mainEntity）
- sitemap 提交 Google Search Console（可選；屬內容上線後 SEO）
- GA4 / UTM 若尚未正式接入，標為後續檢查（屬作者 SOP）

---

## 8. Blocker / Warning / Nice-to-have 判定

| # | 項目 | 分類 | 階段 |
|---|---|---|---|
| 1 | remote 未設定 | 🔴 blocker | §3.2 |
| 2 | repo 未建立 | 🔴 blocker | §3.1 |
| 3 | GitHub Pages 未啟用 | 🔴 blocker | §6 |
| 4 | `site.config.json.githubSiteUrl` 不符 user / project site 決策 | 🔴 blocker（會造成 sitemap absolute URL 錯）| §2 |
| 5 | dist 不入版控 | 🟡 warning（屬設計）| §5.1 |
| 6 | sitemap.xml / robots.txt 每次 build 後需重跑 | 🟡 warning（per `docs/publish-workflow.md` §3.1）| §4 |
| 7 | Google Rich Results Test 未測 | 🟡 warning / SOP | §7.5 |
| 8 | ready post 數量少（當前 3 篇）| 🟢 nice-to-have | 內容層 |
| 9 | Related Posts auto（Phase 9-h-f）| 🟢 nice-to-have | post-Phase-1 |
| 10 | Periodical / magazine structured data（Phase 9-f-g2）| 🟢 nice-to-have | post-Phase-1 |

---

## 9. Phase 10-c 啟動條件

下一批 Phase 10-c（實際 remote 設定 + 首次 push）啟動前，user 需先完成：

- [ ] §2 6 項決策已完成（含 repo 名 / public-private / Pages / user 或 project site）
- [ ] GitHub 端 repo 已建立（per §3.1；未勾 README / .gitignore / license）
- [ ] user 已提供 repo URL 給 Claude Code
- [ ] user 已確認是否使用 gh-pages branch（或其他部署 branch）
- [ ] user 已確認是否要在 Phase 10-c 同步 push main（建議是）
- [ ] working tree clean
- [ ] HEAD 為穩定 snapshot（建議搭配 Phase 9-g-g-z 或更新之 stable snapshot）

若以上任一未滿足，建議 Phase 10-c 暫不啟動，先補齊。

---

## 相關文件

- 操作型勾選清單：`docs/checklists/github-deploy-checklist.md`
- 整體發布流程：`docs/publish-workflow.md` §3 / §4.1
- 規範來源：`CLAUDE.md` §28 #17（sitemap + robots）+ §25（備份搬家）
- Phase 9-g-g-c sitemap 補檔紀錄：`docs/phase-9g-g-final-stable-snapshot.md` §5
- Phase 1 final 報告：`docs/phase-1-completion-report.md`（系統能力對照基準）

---

（本文件結束）
