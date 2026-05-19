# Phase 10 Completion Report：GitHub Pages Deployment 系列收尾

本文件封存 **Phase 10 GitHub Pages deployment 系列**之完整 completion 紀錄。Phase 10 為 Phase 1 final 封存後之首次正式對外部署批，目的為將 BLOG 系統 GitHub Pages 站點實際上線，並建立**「source 留本機 / public repo 純 deploy-only」**之雙 repo 分離架構。

對應之上層紀錄：
- `docs/phase-1-completion-report.md`（Phase 1 final；Phase 10 屬 post-Phase-1 範疇；不修改 Phase 1 final 本身）
- `docs/github-deploy.md`（GitHub Pages 部署 runbook；本系列之操作手冊基準）
- `docs/checklists/github-deploy-checklist.md` §7 部署完成紀錄（本系列首批 deploy log entries）
- `docs/future-roadmap.md` §8.8（本系列於 cross-phase 路線總覽之 landed 紀錄）

---

## §1 Phase 10 目標摘要

### 1.1 高階目標

1. **GitHub Pages 上線**：將 BLOG 系統 GitHub site 之 `dist/` 內容部署至 `https://babel-lab.github.io/portable-blog-system/`
2. **雙 repo 分離架構**：source 留本機之 `D:\github\blog-new\portable-blog-system\` / deploy 走獨立 `D:\github\blog-new\portable-blog-deploy\` 之 `gh-pages` branch
3. **source 永遠不 push 至 public**：所有 commit 留本機 main；唯一 push 為 deploy repo 之 gh-pages branch
4. **subpath URL 一致性**：`site.config.json.githubSiteUrl` / sitemap / canonical / JSON-LD / 內部 nav links 全鏈對齊 `/portable-blog-system/` subpath

### 1.2 範圍區分

| 範圍 | 屬性 |
|---|---|
| **in-scope** | 部署策略決策 / runbook 撰寫 / githubSiteUrl subpath 調整 / repo 建立與遠端設定 / gh-pages branch 部署 / 2 個 production-only fixes（internal-link / back-to-top）|
| **out-of-scope** | Phase 1 系統能力（已 final）/ Blogger output（不變）/ Google Rich Results Test（屬作者 SOP）/ Phase 9-h-f Related Posts auto / Phase 9-f-g2 Periodical / 內容擴充 |

### 1.3 設計原則

- **conservative landing**：每子批風險分級；user 端決策點明確列出；不自動進入下一批
- **source 留本機 unalterable**：Phase 10-c 一次誤推後即建立「不 push main」之硬性紀律；Phase 10-c-fix-a/b 後 main 無 upstream tracking 作為保護
- **deploy-only public repo**：public repo 僅作 GitHub Pages 部署目的地；不含 source / docs / config
- **single design / dual implementation point**：internal-link fix 用 `siteBasePath()` helper 從 `githubSiteUrl` 自動推導；user site / project site 部署模式同程式碼

---

## §2 子批列表 + commit hash

Phase 10 系列共 **11 個子批次** + 收尾批 1。

| # | Sub-batch | 範圍 | commit |
|---|---|---|---|
| 1 | **Phase 10-a** | GitHub Pages deploy preflight inventory；純讀取盤點；提出 3 方案（A/B/C）| —（純對話分析；無 commit）|
| 2 | **Phase 10-b** | GitHub Pages deploy runbook docs；重寫 `docs/github-deploy.md`（4 → 297 行）+ `docs/checklists/github-deploy-checklist.md`（9 → 144 行）| `5073661 docs(deploy): add GitHub Pages deployment runbook` |
| 3 | **Phase 10-b-2** | GitHub repo strategy decision note；分析 user site / project site / 雙 repo 三方案；推薦方案 B（project site + deploy-only public repo）| —（純對話分析；無 commit）|
| 4 | **Phase 10-b-3** | switch githubSiteUrl to project site subpath and rebuild；`site.config.json.githubSiteUrl` 改為 `https://babel-lab.github.io/portable-blog-system`；build × 2 重產 dist + sitemap | `eb24097 chore(deploy): switch githubSiteUrl to project site subpath` |
| 5 | **Phase 10-c** | remote setup + first push main；**⚠️ 誤推 source main 至 public repo**；後立即策略修正 | —（push 動作；無新 commit；HEAD `eb24097` 被 push）|
| 6 | **Phase 10-c-fix-a** | remove local origin remote + clear upstream tracking | —（純 git 操作；無檔案 commit）|
| 7 | **Phase 10-c-fix-b** | add deploy-only remote without pushing main（user 刪舊 repo + 重建 public empty repo 後）| —（純 git 操作；無檔案 commit）|
| 8 | **Phase 10-d** | deploy-only gh-pages branch deployment（initial）| `720a349 deploy: initial gh-pages content from dist eb24097`（**於 deploy repo gh-pages branch**）|
| 9 | **Phase 10-e**（discovery） | live verification 發現 blocker：GitHub project site 內部連結錯誤（root-absolute `/posts/` 等漏 subpath）| — |
| 10 | **Phase 10-e-fix-a** | fix GitHub project-site internal links；新增 `siteBasePath()` helper + 13 個 EJS templates 改 `<%= basePath %>` 前置；build × 2 重產 dist | `bc4340f fix(deploy): correct GitHub project-site internal links` |
| 11 | **Phase 10-d-redeploy**（第 1 次） | redeploy gh-pages with internal-link fix | `fbfc691 deploy: bc4340f snapshot (internal-link fix)`（**於 deploy repo gh-pages branch**）|
| 12 | **Phase 10-e-v** | live verification + back-to-top button issue 盤點；確認 JS / SCSS / init 全 landed，僅 production 頁缺 markup | —（純讀取；無 commit）|
| 13 | **Phase 10-e-v-fix** | add back-to-top button to base layout；`src/views/layout/base.ejs` 新增 1 行 button markup（class + data-back-to-top + aria-label） | `ab9e305 fix(ui): add back-to-top button to base layout` |
| 14 | **Phase 10-d-redeploy**（第 2 次） | redeploy gh-pages with back-to-top fix | `02d9d7b deploy: back-to-top button fix`（**於 deploy repo gh-pages branch**）|
| 15 | **Phase 10-e-v-close**（本批） | Phase 10 GitHub Pages deployment completion report + future-roadmap + checklist deploy log sync | 見本批 git log |

### 2.1 commit 分布

| 類型 | 數量 | 位置 |
|---|---|---|
| source repo `main` commits（已 commit；**未 push**）| 4 | `5073661` / `eb24097` / `bc4340f` / `ab9e305` + 本批 |
| deploy repo `gh-pages` commits（已 push）| 3 | `720a349` / `fbfc691` / `02d9d7b` |
| 純對話分析 / 純 git 操作（無 commit）| 7 | 10-a / 10-b-2 / 10-c / 10-c-fix-a / 10-c-fix-b / 10-e（discovery）/ 10-e-v |

---

## §3 最終狀態

### 3.1 Source repo

| 項目 | 值 |
|---|---|
| 位置 | `D:\github\blog-new\portable-blog-system\` |
| HEAD（Phase 10-e-v-close 前）| `ab9e305 fix(ui): add back-to-top button to base layout` |
| branch | `main` |
| upstream tracking | **無**（`branch -vv` 不顯示 `[origin/main]`；屬硬性紀律）|
| origin remote | `https://github.com/babel-lab/portable-blog-system.git` |
| working tree | clean |
| local commits 累計 | 含 4 個 Phase 10 source commits + 既有 Phase 1-9 history |

### 3.2 Deploy repo

| 項目 | 值 |
|---|---|
| 位置 | `D:\github\blog-new\portable-blog-deploy\`（sibling）|
| HEAD | `02d9d7b deploy: back-to-top button fix` |
| branch | `gh-pages`（orphan branch；無 main）|
| upstream tracking | `[origin/gh-pages]` |
| origin remote | 同 source repo origin（`https://github.com/babel-lab/portable-blog-system.git`）|
| 累計 commits（gh-pages）| 3（`720a349` → `fbfc691` → `02d9d7b`）|

### 3.3 GitHub Pages 線上

| 項目 | 值 |
|---|---|
| 部署位址 | `https://babel-lab.github.io/portable-blog-system/` |
| Visibility | Public |
| Source | Deploy from a branch（`gh-pages` / root）|
| Pages 啟用時間 | Phase 10-d 後 user 端設定 |
| 線上實際內容版本 | `02d9d7b`（含 internal-link fix + back-to-top button）|

---

## §4 部署架構

### 4.1 雙 repo 分離設計

```
source repo（本機，未 push）              deploy repo（本機 clone）
─────────────────                       ─────────────────
D:\github\blog-new\                     D:\github\blog-new\
  portable-blog-system\                   portable-blog-deploy\
  ├─ main branch                          └─ gh-pages branch
  ├─ src / content / docs / public        └─ dist 內容 + .nojekyll
  ├─ dist / dist-blogger /                
  │  dist-promotion / dist-reports        
  └─ origin: …/portable-blog-system.git   origin: 同左
                                              ↓
                              GitHub public repo: babel-lab/portable-blog-system
                              （僅含 gh-pages branch + dist 內容；無 source / main）
                                              ↓
                              GitHub Pages: https://babel-lab.github.io/portable-blog-system/
```

### 4.2 為何選方案 B（project site）

per `Phase 10-b-2` 決策：

- user 明確標示「先把 BLOG 系統第一階段放上 GitHub Pages **測試**」→ 測試屬性高，可逆性優先
- project site **刪 repo 即可重來**；user site 一旦佔用 `babel-lab.github.io` root，未來想退回需重建 user 之 root repo
- 當前 ready post 僅 3 篇，內容量還未到「正式主站」門檻

### 4.3 為何選方案 deploy-only public repo

per `Phase 10-c-fix` 系列：

- Phase 10-c 之 source main 誤推暴露 strategy 缺陷：public source repo 與 deploy 目的 conflate
- 修正後策略：source 留本機 / public repo 僅作 deploy artifact
- 既有 source 內容雖無敏感資料（per Phase 10-c-fix §1.2 grep 確認），但屬「策略意願」非「資安事件」
- 拆分後若未來想備份 source，可另建 private repo（如 `portable-blog-system-source`）；不混用

---

## §5 兩個 Production-only Fixes 詳述

### 5.1 GitHub project-site internal links（Phase 10-e-fix-a）

**問題**：

GitHub Pages project site 部署於 `/portable-blog-system/` subpath，但 EJS 模板硬編 `href="/"` / `href="/posts/"` / `href="/categories/"` 等 root-absolute 路徑；瀏覽器解析為根網域 `https://babel-lab.github.io/posts/...`，漏掉 `/portable-blog-system/` subpath → 全站內部導覽 404。

**根因**：

- 11 個 EJS 直接硬編 root-absolute href
- nav / mobile-drawer 透過 `navigation.json` 之 4 個 item.href 間接帶入
- vite `base='./'` 配置只影響 asset URL，**不**自動 rewrite EJS render 之 `<a href>` 屬性

**修正**：

`siteBasePath(settings)` helper（`src/scripts/build-github.js`）：

- 從 `settings.site.githubSiteUrl` 解析 URL pathname
- user site（`https://babel-lab.github.io`）→ `''`
- project site（`https://babel-lab.github.io/portable-blog-system`）→ `'/portable-blog-system'`
- 注入 `basePath` 至 `makeBaseData()`；EJS 用 `<%= basePath %>{原 root-relative href}` 渲染
- 兩種部署模式同程式碼自動正確；零硬編

**範圍**：13 個檔案（1 build script + 12 templates）；零硬編 URL；不影響 Blogger templates。

**driveby**：sitemap / canonical / JSON-LD 之 absolute URL 已對齊（Phase 10-b-3 已驗證）；本批僅修內部 nav/post-card hrefs。

**完成事實**：

| 維度 | 值 |
|---|---|
| **internal links subpath 修正完成** | ✅ |
| **source commit** | `bc4340f fix(deploy): correct GitHub project-site internal links` |
| **deploy commit** | `fbfc691 deploy: bc4340f snapshot (internal-link fix)` |
| **dist sanity check** | dist/index.html / posts/{slug}/ / 404.html / categories/ / tags/ / design-system/ 全部 0 root-absolute href 殘留；正確 subpath href 全鏈 |
| **canonical / JSON-LD 不被改壞** | we-media-myself2 canonical 仍 → Blogger publishedUrl（cross-source mirror 設計）；github-pages-blog-planning canonical → subpath GitHub URL |

### 5.2 Back-to-top button（Phase 10-e-v-fix）

**問題**：

GitHub Pages 線上頁面下滾時右下角無「回上方」按鈕。

**根因**：

per `Phase 10-e-v` 盤點：infrastructure 完整（JS module / SCSS / main.js init / z-index token / print hide / Blogger mirror SCSS 全 landed），但 **production 頁面無 button markup**。
- JS selector 為 `[data-back-to-top]`，但無任何 production 頁面元素帶此 attribute
- 唯一 markup 在 `src/views/design-system/article-components.ejs:138` 之 design-system demo，且 demo 缺 `data-back-to-top` attribute，JS 也不會接管

**修正**：

`src/views/layout/base.ejs` 於 mobile-drawer include 之後、`<script>` 之前插入 1 行：

```html
<button class="lab-back-to-top" data-back-to-top type="button" aria-label="回到頁面上方">↑</button>
```

- class 對齊 `_back-to-top.scss` 選擇器
- `data-back-to-top` 對齊 JS module selector
- `aria-label` 對齊 CLAUDE.md §6 規範與 design-system demo
- 因 base.ejs 為**所有 GitHub pages 共用 layout**，1 處改動 → 8/8 production 頁全帶 button

**範圍**：1 個檔案 / +1 行；不影響 Blogger templates；threshold 維持既有 `scrollY > 240`。

**完成事實**：

| 維度 | 值 |
|---|---|
| **back-to-top button 修正完成** | ✅ |
| **source commit** | `ab9e305 fix(ui): add back-to-top button to base layout` |
| **deploy commit** | `02d9d7b deploy: back-to-top button fix` |
| **dist sanity check** | dist/index.html / posts/{slug}/ × 3 / 404.html / posts/index.html / categories/index.html / tags/index.html 共 8/8 含 `lab-back-to-top` + `data-back-to-top` |
| **Blogger output 不變** | dist-blogger/posts/we-media-myself2/post.html mtime 維持 2026-05-18 17:06 |

---

## §6 Phase 10-c Strategy Reversal 紀錄

### 6.1 失誤事件

Phase 10-c（`remote setup and first push main`）執行 `git push -u origin main` 將 source repo HEAD `eb24097` 連帶 8 個歷史 commits 推至 public repo `https://github.com/babel-lab/portable-blog-system`。

### 6.2 user 策略修正

push 後 user 立即指出：「不把目前這個 repo 當正式 source repo；SOURCE 先留本機；之後會刪除並重建為 public deploy-only repo」。

### 6.3 補救路徑（Phase 10-c-fix）

| Step | 動作者 | 動作 | 動機 |
|---|---|---|---|
| 1 | user | 立即將 GitHub repo 改 Private | stop-bleed（最快可逆動作） |
| 2 | Claude（10-c-fix-a） | `git remote remove origin` + 清 upstream tracking | 避免未來誤 push |
| 3 | user | 於 GitHub 刪除 repo + 重建同名 public empty repo | 清掉已暴露 source 之 commit history |
| 4 | Claude（10-c-fix-b） | `git remote add origin <new-url>`（**不 push main**）| 重設 origin 至全新 empty repo |
| 5 | Claude（10-d）| gh-pages orphan branch + dist push | 首次正式 deploy（僅 gh-pages；無 main）|

### 6.4 學到的事

per `feedback_conservative_landing.md`：

- 大方向變動（如 source 是否公開）應在**初次設定 remote 前**明確決策；不應依賴 push 後再 revert
- public 部署目的應與 source code visibility 分離決策
- 即使 source 無敏感資料，「策略意願」也是合理 strategy 維度
- Phase 10-b-2 之 3 方案分析應在 user 仔細評估後再進 10-c；本系列實質 trade-off 為「快速啟動」vs「決策正確性」

### 6.5 防再犯機制

- **本地 main 永遠無 upstream tracking**（`branch -vv` 不顯示 `[origin/main]`）→ 即使誤觸 `git push` 也會回報 `fatal: The current branch main has no upstream branch` 拒推
- **唯一 push 路徑**：deploy repo 之 `git push -u origin gh-pages`（明確指定 branch；不可省略 args）
- **Phase 10-d / Phase 10-d-redeploy 全程**：不曾於 source repo 內執行 push 動作

---

## §7 端對端驗收結果

### 7.1 §6 internal-link 驗收（Phase 10-d-redeploy 第 1 次部署後）

| # | 測試項 | 結果 |
|---|---|---|
| 1 | 首頁 nav 4 條 link 全部能正確導向 `/portable-blog-system/*` | ✅ 通過 |
| 2 | 首頁文章卡片點擊導向 `/portable-blog-system/posts/{slug}/` | ✅ 通過 |
| 3 | 手機選單（mobile drawer）連結同 desktop nav 效果 | ✅ 通過 |
| 4 | 404 頁「回首頁」導向 `/portable-blog-system/`（subpath） | ✅ 通過 |

**user 回覆**：「§6 四項都通過，全部正確導向 /portable-blog-system/ subpath」

### 7.2 §7 back-to-top 驗收（Phase 10-d-redeploy 第 2 次部署後）

| # | 測試項 | 結果 |
|---|---|---|
| 1-9 | 滾動 > 240px button 出現 / 平滑回頂 / 滾回頂消失 / 手機尺寸位置正常 / design-system 雙按鈕 / console 無 error / print preview 隱藏 等 9 項全套驗收 | ✅ 9/9 通過 |

**user 回覆**：「我手動測試 §7 各項都通過」

### 7.3 驗收結論

✅ **Phase 10 GitHub Pages 線上實際運作正確**：internal nav + back-to-top 兩個 production-only fixes 已通過真人手動驗證；GitHub Pages 線上版本（commit `02d9d7b`）為功能完整之第一個正式版。

---

## §8 不在本系列 scope 之延伸候選

| 項目 | 狀態 |
|---|---|
| Google Rich Results Test 驗證 | ⏸ author SOP；屬作者持續工作 |
| Phase 9-h-f 兩端 Related Posts auto | ⏸ future candidate；需 ≥ 5 篇 ready post（當前 3 篇）|
| Phase 9-f-g2 Periodical / magazine structured data | ⏸ deferred；需 ready magazine post |
| GA4 measurementId / AdSense client ID 設定 | ⏸ author 端設定（`content/settings/ga4.config.json` / `ads.config.json` 當前 `enabled: false` + 空 ID）|
| 內容擴充（撰寫更多 ready post）| 屬作者持續工作；累積至 ≥ 5 篇可解鎖 Related Posts auto trigger |
| 自訂網域 / CNAME | ⏸ 未來；當前用 GitHub 預設 subdomain |
| sitemap 提交 Google Search Console | ⏸ author SOP；屬 SEO 後續 |

---

## §9 邊界聲明

- ✅ 本系列**不**動 `docs/phase-1-completion-report.md`（Phase 1 final 維持 frozen）
- ✅ 本系列**不**動任何 Blogger templates（`src/views/blogger/`）；dist-blogger mtime 全程維持 2026-05-18 17:06
- ✅ 本系列**不**動 `docs/github-deploy.md` runbook（runbook 應保持 generic / re-runnable；具體 deploy 結果記錄於 `docs/checklists/github-deploy-checklist.md` §7）
- ✅ 本系列**不**動 `docs/phase-10-a-b-sitemap-robots-baseline.md`（不同 scope；命名巧合）
- ✅ source repo `main` 永遠未 push；無 upstream tracking
- ✅ Phase 10 全 4 個 source commits 線性堆疊；無 amend / rebase / force-push
- ✅ Phase 10 全 3 個 deploy commits 線性堆疊；fast-forward push only
- ✅ 本系列**不**啟動 Phase 9-h-f / 9-f-g2 / Rich Results Test 等 post-Phase-1 強化批

---

## §10 Cross-links

### 10.1 Phase 10 系列文件

- `docs/github-deploy.md`（GitHub Pages 部署 runbook；本系列操作手冊基準；Phase 10-b 落地）
- `docs/checklists/github-deploy-checklist.md`（部署勾選清單；§7 部署完成紀錄含本系列首批 deploy log）

### 10.2 上層紀錄

- `docs/phase-1-completion-report.md`（Phase 1 final；Phase 10 為其後續路線之第一批正式部署）
- `docs/phase-9g-g-final-stable-snapshot.md`（2026-05-19 早晨 idle freeze snapshot；其後啟動本 Phase 10 系列）
- `docs/future-roadmap.md` §8.8（本系列於 cross-phase 路線總覽之 landed 紀錄）

### 10.3 設計參考

- `CLAUDE.md` §6（Phase 6 RWD 與前台互動規範；back-to-top button HTML markup spec）
- `CLAUDE.md` §28 #17（sitemap + robots）
- `CLAUDE.md` §25（備份搬家；source 留本機呼應）

---

（本文件結束）
