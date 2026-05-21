# 20260521 End-of-Day Report

本文件為 **Phase 20260521-pm-2** 之本日成果稽核 + 收尾報告。屬純 docs 性質；**本批不修改任何 source / loader / Admin UI / build / dist / deploy / validate**。

對應上層：
- `docs/README.md`（docs 入口；§7 baseline；已於 `pm-1` 同步至本日）
- `docs/20260520-end-of-day-report.md`（昨日 EOD report；本日報告 mirror 其結構）
- `CLAUDE.md`（專案規範）

---

## 1. Executive Summary

5-8 條本日成果摘要：

- ✅ **Admin overview 顯示一致性改善**（empty state 統一 / stat-card tooltip 白話化 / URL linkify / display audit doc 落地）
- ✅ **fbPublished P3 conditional rule Admin-only 落地**（loader + EJS tooltip + 4 docs sync；validate-level rule 仍 deferred）
- ✅ **dev route 404 修正**（basePath dev/build 分流；對齊 vite.config 既有 mode-aware 原則）
- ✅ **user 手測 localhost links 通過**（Ctrl+C → 重跑 `npm run dev` → 5 個 URL 皆 200 OK）
- ✅ **production sanity check 通過**（build 成功；production links / canonical / og:url / JSON-LD / sitemap 14 entries 全部正確）
- ✅ **README baseline 已同步**（§7 從 20260520 snapshot 推進至 20260521；HEAD ref + 11 commits 摘要 + 5 個 pending 全對齊）
- ⚠️ **deploy repo 未動**（凍結於 `4ecd92d`；GitHub Pages 線上未動；屬刻意保留）
- ⚠️ **尚未 push / deploy**（本日 12 commits 全部於本機 main 線性堆疊；屬刻意保留；需 user 明示啟動）

---

## 2. Final Baseline

| 維度 | 值 |
|---|---|
| **HEAD** | `e51f402 docs(project): sync README baseline after production sanity check` |
| **working tree** | clean |
| **branch** | `main` |
| **upstream** | 無（無 tracking）|
| **是否 push** | ❌ 未 push |
| **deploy repo HEAD** | `4ecd92d deploy: publish Blogger cross-link GA4 UTM update`（未動）|
| **dist/.gitkeep** | tracked & clean（mid-5-b 已 restore；vite emptyOutDir side effect 已處理）|
| **build sanity** | ✅ mid-5 曾跑 `npm run build` 成功；無 error / warning |
| **sitemap url entries** | 14（mid-5 production build 確認；與既有 baseline 一致）|
| **validate baseline** | `0 error(s) / 38 warning(s) on 33 issue-post(s)`（沿用既有；本日未跑 validate；mid-4-b / mid-5 邏輯改動不在 validate 範圍）|
| **今日 commits 總計** | **12**（線性堆疊；無 amend / rebase / force / push）|

---

## 3. Commit Timeline

本日 12 commits 完整時序：

| # | 時段 | phase | hash | commit message | 性質 | 主要修改範圍 | 驗證 |
|---|---|---|---|---|---|---|---|
| 1 | 上午 | `am-2 / C-1` | `45ba3d9` | `docs(project): sync README baseline to current HEAD` | docs | `docs/README.md` §7 baseline 2 行 | git diff 對齊 |
| 2 | 上午 | `am-3 / C-4` | `2d5d879` | `docs(admin): audit overview display consistency` | docs (audit) | 新增 `docs/20260521-admin-overview-display-audit.md`（541 行）| diff 量對齊 |
| 3 | 上午 | `am-4 / S-1` | `f3c7ee8` | `fix(admin): normalize overview empty states` | source fix | `src/views/admin/index.ejs` 5 處 plain-text fallback 統一 | diff 範圍對齊 |
| 4 | 上午 | `am-5 / S-4` | `bd0d6e8` | `fix(admin): clarify stat card tooltips` | source fix | `src/views/admin/index.ejs` 4 張 stat-card tooltip 白話化 | diff 範圍對齊 |
| 5 | 上午 | `am-6 / S-2` | `da00f53` | `fix(admin): linkify overview URLs` | source fix | `src/views/admin/index.ejs` 4 處絕對 URL linkify | diff 範圍對齊 |
| 6 | 上午 | `am-7 / S-5` | `818e135` | `docs(admin): sync overview small fixes` | docs | `docs/admin-1-completion-report.md` §13 追加 67 行 | diff 範圍對齊 |
| 7 | 中午 | `mid-2 / C-3-a` | `edbf6d0` | `fix(admin): apply fbPublished P3 conditional rule` | source fix | `src/scripts/load-admin-posts.js` + `src/views/admin/index.ejs`（loader 邏輯 + tooltip）| diff 範圍對齊 |
| 8 | 中午 | `mid-3 / C-3-c` | `022d8bd` | `docs(admin): sync fbPublished P3 rule` | docs | 4 docs（fb-sidecar-schema / admin-1 / audit / roadmap）+51 / -5 | diff 範圍對齊 |
| 9 | mid-4 | `mid-4-b` | `7c9f7ea` | `fix(build): scope basePath to production mode` | build fix | `src/scripts/build-github.js`（siteBasePath + makeBaseData + caller）+9 / -4 | mid-4-c user 手測通過 |
| 10 | mid-4 | `mid-4-c` | `3f97890` | `docs(build): record dev route verification` | docs | 新增 `docs/20260521-dev-route-fix-verification.md`（217 行）| diff 對齊 |
| 11 | mid-5 | `mid-5-b` | `1be2a38` | `docs(build): record production basePath sanity check` | docs | `docs/20260521-dev-route-fix-verification.md` 追加 §10（+87）| mid-5 build 通過 |
| 12 | pm-1 | `pm-1` | `e51f402` | `docs(project): sync README baseline after production sanity check` | docs | `docs/README.md` §7 baseline 12 行 | diff 範圍對齊 |

**統計**：
- docs：8 commits
- source fix：4 commits（admin × 3 + build × 1）
- 上午 6 + 中午 2 + mid-4 系列 2 + mid-5 1 + pm-1 1 = **12**
- 5 個 `fix(...)` + 7 個 `docs(...)`

**read-only phase（無 commit）**：
- `am-1` 早盤盤點 + 候選排序
- `mid-1 / C-3` FB completeness pre-analysis
- `mid-4-a` local dev route 404 diagnosis
- `mid-5` production sanity check（含跑 build 之 read-only 驗證；commit 後續於 mid-5-b 落地）
- 多次 idle freeze 確認

---

## 4. Completed Workstreams

### 4.1 Admin overview polish

| 階段 | commit | 內容 |
|---|---|---|
| **C-4** audit | `2d5d879` | 新增 `docs/20260521-admin-overview-display-audit.md`（541 行）；盤點 stat-cards 12 / 列表 7 欄 / detail 10 sections；識別 7 個 drift（D-1 ~ D-7）；分類 🟢/🟡/🔴 候選 |
| **S-1** empty state | `f3c7ee8` | `src/views/admin/index.ejs` 5 處 plain-text fallback 統一為 `(empty)`；保留 badge 內狀態文字（`no kind` / `no status` / `no category` / `no tags` / `no URL`；皆 b-missing badge）|
| **S-4** stat-card tooltip | `bd0d6e8` | 4 張 stat-card tooltip 改寫為非工程師友善文案（blogger / github source / enabled 各兩張）|
| **S-2** URL linkify | `da00f53` | 4 處絕對 URL 加 `<a target="_blank" rel="noopener noreferrer">` 包覆（列表 URLs 欄 + detail panel）；保守 skip 相對路徑（`blogger.permalink` / `github.path`）|
| **S-5** docs sync | `818e135` | `docs/admin-1-completion-report.md` 追加 §13 後續小修紀錄（67 行；append-only）|

**範圍**：全部 `src/views/admin/index.ejs` 之 EJS 文案 / 屬性 / 標籤級調整；零 loader / data 邏輯 / class name / HTML 結構動到；零 form / fetch / write path 新增；Admin 仍 read-only / dry-run safe。

### 4.2 fbPublished P3 conditional rule

| 階段 | commit | 內容 |
|---|---|---|
| **C-3** pre-analysis（無 commit）| n/a | mid-1 phase；read-only 確認 fbPublished 只在 Admin loader / view 使用；validate-content.js 無 fbPublished 規則；38 warnings baseline 不受影響；推薦 Option A（Admin-only） |
| **C-3-a** Admin-only source fix | `edbf6d0` | `src/scripts/load-admin-posts.js` 新增 `isPostPublished` / `hasFbPostUrl` / `fbPublishedMissing` 三個 helper；fbPublished 規則 = `enabled=true && status==='published' && !fbPostUrl → missing`；不再要求 `fbPostedAt`；`src/views/admin/index.ejs` 2 處 tooltip 同步 |
| **C-3-c** docs sync | `022d8bd` | 4 docs（`fb-sidecar-schema.md` P3 status 標 ✅ / `admin-1-completion-report.md` §13.6 新增 / `audit doc` M-3 標 ✅ / `roadmap` §1.3 標 ✅）|
| **validate-level rule** | deferred | Option B；需 user 決定 severity（warning / error）+ fixture 設計 |

**範圍**：邏輯改動侷限於 Admin loader 計算層；EJS 顯示同步；docs 同步 4 處引用點；零 validate / build / dist 改動。

### 4.3 dev route 404 fix

| 階段 | commit | 內容 |
|---|---|---|
| **mid-4-a** read-only diagnosis（無 commit）| n/a | 確認 `/portable-blog-system/` prefix 來源（`siteBasePath()` 不分 mode）+ 對齊 vite.config.js mode-aware 既有原則 + 3 個修正 option 比較；推薦 Option A |
| **mid-4-b** dev-route-fix | `7c9f7ea` | `src/scripts/build-github.js` 單檔 +9 / -4；`siteBasePath(settings, mode)` 接 mode 參數；`mode === 'dev'` early return `''`；其他 mode 保留 production 推導；`makeBaseData` + caller 同步傳遞 mode |
| **mid-4-c** user 手測 + docs verification | `3f97890` | 新增 `docs/20260521-dev-route-fix-verification.md`（217 行）；記錄問題 / 根因 / 修正 / user 5 個 URL 手測通過 / 邊界 / 後續 |

**問題回顧**：
- 現象：localhost 點 `/portable-blog-system/...` 全部 404
- 根因：basePath dev/build 未分流；EJS 注入 production prefix；vite dev serve 從 `/` namespace 提供 → 不對齊
- 修正：dev basePath = `''`；build basePath = `/portable-blog-system`
- user 手測：Ctrl+C → `npm run dev` → predev 重產 .cache/pages → 5 個 URL 皆 200 OK

### 4.4 production sanity check

| 階段 | commit | 內容 |
|---|---|---|
| **mid-5** read-only sanity check（無 commit；跑 build）| n/a | `npm run build` 成功（prebuild 208ms + vite build 1.01s + postbuild 49ms；無 error）；25 個 dist 檔產出；發現 dist/.gitkeep 被 vite emptyOutDir 刪除（build side effect）|
| **mid-5-b** restore + docs sync | `1be2a38` | `git restore dist/.gitkeep` 還原；`docs/20260521-dev-route-fix-verification.md` 追加 §10 production sanity check 紀錄（+87 行）|

**驗證項目**：
- ✅ production links 仍含 `/portable-blog-system/`（header / nav / post card / mobile drawer；首頁 + post detail）
- ✅ canonical / og:url / JSON-LD url 仍絕對 `https://babel-lab.github.io/portable-blog-system/...`
- ✅ sitemap 14 url entries；全部以 production URL 開頭；0 localhost 污染
- ✅ dist/.gitkeep side effect 已處理（restore；不 commit dist）

### 4.5 README baseline sync

| 階段 | commit | 內容 |
|---|---|---|
| **am-2 / C-1** | `45ba3d9` | `docs/README.md` §7 之 HEAD ref `b2c20c3` → `8b16b01` + commits 36 → 40（修正昨日 EOD 之 snapshot drift）|
| **pm-1** | `e51f402` | `docs/README.md` §7 從 20260520 snapshot 推進至 20260521（HEAD ref + 11 commits 摘要 + 4 個今日重點 + 5 個 pending）|

**注意**：README baseline commit 本身天然會落後 1 commit（因為 commit 之 hash 在 commit 後才產生）；不需反覆 cleanup；下次再做 baseline sync 時自然會同步。

---

## 5. Safety / No-go Boundaries

| 維度 | 狀態 |
|---|---|
| 未 push | ✅（branch main 無 upstream；今日 12 commits 全部於本機）|
| 未 deploy | ✅ |
| deploy repo 未動 | ✅（凍結於 `4ecd92d`）|
| 未改 GA4 真實啟用 | ✅（`ga4.config.json` 仍 `enabled: false / measurementId: ""`）|
| 未進 FB write path | ✅（FB-P5-c / S-3 fixture 皆未啟動）|
| 未改 content（含 .md / .fb.md / settings）| ✅ |
| 未改 Blogger pipeline（`build-blogger.js` / dist-blogger / blogger theme）| ✅ |
| 未新增 `<form>` / `submit` / `fetch` / `XHR` / `localStorage` / `fs` write | ✅ |
| 未新增 JS event handler | ✅ |
| Admin 仍 read-only / dry-run safe | ✅（banner / robots noindex / dev-mode-only 設計皆未動）|
| 未跑 `validate:content` | ✅ |
| 未啟動 FB Graph API / 自動社群發文 | ✅（per `CLAUDE.md` §29 永不清單）|

---

## 6. Known Deferred Items

| # | 候選 | 阻擋條件 |
|---|---|---|
| 1 | **C-2** GA4 prod-only gating | 等待 user 決定 Option A/B/C（per `docs/ga4-enable-preflight.md` §2.4）|
| 2 | **S-3** fixture 補 FB metadata | 等待 user 決定 placeholder / 真實 URL / 日期策略 |
| 3 | **Option B** validate-level fbPublished rule | deferred；需 user 決定 severity（warning vs error）+ fixture 設計 |
| 4 | **`.gitkeep` emptyOutDir 長期策略** | 可選；現況採每次 build 後手動 restore；需 user 決定方向（移除 .gitkeep / 改 vite.config / 持續手動 restore）|
| 5 | **push / deploy 前總盤點** | 尚未啟動；需 user 明示 |
| 6 | **push / deploy** | 尚未啟動 |

---

## 7. Push / Deploy Readiness

| 項目 | 狀態 |
|---|---|
| 本機 source repo | ✅ clean；working tree 無 dirty |
| 今日 commits | ✅ 12 個皆於本機 main 線性堆疊；無 amend / rebase / force |
| upstream | ❌ 無 tracking（branch main 尚未 set-upstream）|
| 是否需要 push 才能 deploy | ✅ 是；deploy 機制依賴 GitHub remote 之 main 分支（per 既有 deploy pipeline）|
| deploy repo（`D:/github/blog-new/portable-blog-deploy`）| 凍結於 `4ecd92d`；本日未動 |
| GitHub Pages 線上 | 未動；對應 deploy repo `gh-pages` 分支 |

**若 user 想啟動 push / deploy，建議下一 phase 先做 read-only preflight**（即下方 §8 之 `pm-3 push/deploy preflight read-only`）：

| preflight 項目 | 動作 |
|---|---|
| commit 訊息規範性 | `git log --oneline main` 檢查 12 個 commit message 語氣 / 前綴一致性 |
| 是否含敏感資料 | grep 全部 12 commits 之 diff 範圍是否含 API key / token / .env / credentials |
| working tree state | `git status` 重新確認 clean |
| build sanity 是否需重跑 | 評估：本日 mid-5 已跑成功；是否需在 push 前再跑一次 fresh build？|
| deploy repo 狀態 | `git -C deploy-repo status` + `git log --oneline -5` 確認 deploy repo 之 base |
| GitHub Pages 目標分支 | 確認 deploy pipeline 之目標分支（`gh-pages` 或 main subdir）；確認 base path 對齊 prod 設定 |
| 是否需要 set-upstream | `git push -u origin main`（首次 push）vs `git push`（已有 upstream）|

⚠️ push 屬高敏感操作；任何 phase 啟動前須 user 明示。

---

## 8. Recommended Next Phases

| 候選 | 性質 | 阻擋 / 啟動條件 |
|---|---|---|
| **pm-3** push/deploy preflight read-only | read-only | 需 user 明示要做 push/deploy；本批屬 read-only 評估；無 commit |
| **C-2** GA4 prod-only gating preflight | preflight + 後續實作 | 需 user 表態 Option A/B/C 後啟動 |
| **S-3** fixture metadata strategy decision | pre-analysis | 需 user 表態 placeholder / 真實 URL / 日期策略 |
| **`.gitkeep` long-term strategy read-only** | read-only | 評估方案（移除 .gitkeep / 改 vite.config / 持續 restore）；屬可選 |
| **idle freeze** | freeze | 預設選項；若不啟動任何後續 |

⚠️ assistant 不擅自啟動任何下一 phase；user 明示後方可進。

---

## 9. Appendix

### 9.1 今日 12 commits（hash 完整清單）

```
e51f402 docs(project): sync README baseline after production sanity check  ← pm-1
1be2a38 docs(build): record production basePath sanity check                ← mid-5-b
3f97890 docs(build): record dev route verification                          ← mid-4-c
7c9f7ea fix(build): scope basePath to production mode                       ← mid-4-b
022d8bd docs(admin): sync fbPublished P3 rule                               ← mid-3 (C-3-c)
edbf6d0 fix(admin): apply fbPublished P3 conditional rule                   ← mid-2 (C-3-a)
818e135 docs(admin): sync overview small fixes                              ← am-7 (S-5)
da00f53 fix(admin): linkify overview URLs                                   ← am-6 (S-2)
bd0d6e8 fix(admin): clarify stat card tooltips                              ← am-5 (S-4)
f3c7ee8 fix(admin): normalize overview empty states                         ← am-4 (S-1)
2d5d879 docs(admin): audit overview display consistency                     ← am-3 (C-4)
45ba3d9 docs(project): sync README baseline to current HEAD                 ← am-2 (C-1)
```

### 9.2 今日所有 docs 報告 / 新增檔案清單

| 檔名 | 性質 | 行數 | 落地 commit |
|---|---|---|---|
| `docs/20260521-admin-overview-display-audit.md` | 新增（audit）| 541 + 1（M-3 status update）| `2d5d879` 新增；`022d8bd` 更新 M-3 row |
| `docs/20260521-dev-route-fix-verification.md` | 新增 + append | 217 → 304（+87 §10）| `3f97890` 新增；`1be2a38` 追加 §10 |
| `docs/20260521-end-of-day-report.md` | 新增（本批 pm-2）| 本批落地 | 本批 commit |

**已動之既有 docs**：

| 檔 | 更新性質 | commit |
|---|---|---|
| `docs/README.md` | §7 baseline drift cleanup（2 次：am-2 + pm-1）| `45ba3d9` + `e51f402` |
| `docs/admin-1-completion-report.md` | 追加 §13 後續小修紀錄 + §13.6 mid-2 C-3-a 紀錄 | `818e135` + `022d8bd` |
| `docs/fb-sidecar-schema.md` | §3.5.5 P3 row status 🟡 → ✅ | `022d8bd` |
| `docs/phase-2-candidate-roadmap.md` | §1.3 + §7 推薦順序 + §7 checklist 三處 P3 標完成 | `022d8bd` |

### 9.3 user 手測通過項目

| 系列 | 測試項 |
|---|---|
| dev route 404 fix | Ctrl+C 停舊 dev → `npm run dev` 重啟 → 訪問 5 個 URL（首頁 / posts / categories / posts/{slug}/ / admin）皆 200 OK；internal links 已改為 dev root path（無 `/portable-blog-system/` prefix）|

### 9.4 build sanity check 摘要（per mid-5 → docs/20260521-dev-route-fix-verification.md §10）

| 階段 | 結果 |
|---|---|
| `prebuild`（build-github.js --mode=build）| ✅ done in 208ms |
| `vite build` | ✅ built in 1.01s；35 modules transformed；無 error |
| `postbuild`（build-sitemap.js）| ✅ done in 49ms |
| dist 產出 | 25 檔（HTML pages + CSS + JS + sitemap.xml + robots.txt）|
| production links | ✅ 全部含 `/portable-blog-system/` prefix |
| SEO absolute URLs | ✅ canonical / og:url / JSON-LD 全對 |
| sitemap | ✅ 14 url entries；0 localhost |
| dist/.gitkeep | mid-5-b restore；clean |

---

## 10. Online Smoke Test Result（Phase 20260521-pm-8）

本章節記錄 pm-6 deploy 完成後之線上 GitHub Pages smoke test 結果；今日工作流之最終閉環。

### 10.1 Deploy 狀態

| 項目 | 值 |
|---|---|
| source HEAD | `68cfddb`（pm-4 已 push `origin/main`）|
| deploy HEAD | `06e26ae deploy: 68cfddb snapshot (SEO noindex + DS-3 CSS + admin overview polish)`（pm-6 已 push `origin/gh-pages`）|
| 線上 GitHub Pages | ✅ 已 serve 至此 deploy hash |

### 10.2 User 手動 smoke test 通過項目

| # | URL | 結果 |
|---|---|---|
| 1 | https://babel-lab.github.io/portable-blog-system/ | ✅ homepage 通過 |
| 2 | https://babel-lab.github.io/portable-blog-system/posts/ | ✅ posts list 通過 |
| 3 | https://babel-lab.github.io/portable-blog-system/categories/ | ✅ categories list 通過 |
| 4 | https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/ | ✅ post detail 通過 |
| 5 | https://babel-lab.github.io/portable-blog-system/sitemap.xml | ✅ sitemap.xml 可讀 |

### 10.3 線上狀態確認

| 項目 | 狀態 |
|---|---|
| GitHub Pages 已正常 serve | ✅ |
| sitemap 可讀（14 url entries；prod absolute URL；不含 noindex 之 `portable-blog-system-mvp`）| ✅ |
| production links 正常（含 `/portable-blog-system/` prefix；對齊 mid-5 build sanity 預期）| ✅ |
| canonical / og:url / JSON-LD | ✅（雙重確認：mid-5 build sanity + 線上 smoke test）|
| `/portable-blog-system/` base path 在 prod 端正確生效 | ✅（mid-4-b basePath dev/build 分流；build mode 端保留 production 推導）|

### 10.4 今日完整工作流總結

今日節奏**完整封閉**：13 source commits（本機 main 線性堆疊）→ source push 至 `origin/main` → deploy phase B 標準 deploy 推進 gh-pages 至 `06e26ae` → 線上 GitHub Pages serve → user 手動 smoke test 通過。

### 10.5 邊界

- 本 phase 不再 push / 不再 deploy / 不再操作 gh-pages
- 兩個 repo 維持 clean
- 不啟動 C-2 / S-3 / Option B / .gitkeep 長期策略
- source main 凍結於 `68cfddb`（tracking `origin/main`）
- deploy gh-pages 凍結於 `06e26ae`（tracking `origin/gh-pages`）

### 10.6 尚未啟動項目（confirmed deferred；pm-8 snapshot；C-2 已於 §11 解除）

| # | 候選 | 阻擋條件 |
|---|---|---|
| 1 | **C-2** GA4 prod-only gating | 等待 user 決定 Option A/B/C |
| 2 | **S-3** fixture 補 FB metadata | 等待 user 決定 placeholder / 真實 URL / 日期策略 |
| 3 | **Option B** validate-level fbPublished rule | deferred；需 user 決定 severity（warning vs error）|
| 4 | **`.gitkeep` emptyOutDir 長期策略** | 可選；需 user 決定方向 |

---

## 11. Afternoon GA4 gating series（Phase 20260521-pm-10 → pm-13）

本章節記錄今日午後 GA4 prod-only gating 之 4 個 phases（1 read-only preflight + 1 implementation + 1 push + 1 deploy decision preflight）。屬 §10.6 之「C-2 GA4 prod-only gating」之**解除**；其餘 3 個 deferred items 仍維持。

### 11.1 pm-10 / C-2 GA4 prod-only gating read-only preflight

- **性質**：read-only；無 commit
- **盤點**：6 個 GA4 相關檔案（`ga4.config.json` / `ga4.ejs` / `ga4-events-helper.ejs` / `ga4-events.js` / `ga4-url-builder.js` / `build-github.js` HEAD_PARTIALS injection point）
- **現況確認**：
  - GA4 機制已存在但未啟用（`ga4.enabled=false` / `measurementId=""`）
  - Blogger pipeline 不接 GA4（`build-blogger.js` grep 0 match）
  - Admin pipeline 不接 GA4（Admin EJS 無 ga4 partial）
  - UTM 純函式生成（`ga4-url-builder.js`）；獨立於 GA4 enabled / measurementId / gating
- **Option 評估**：採 **user-defined Option A**（build-mode gating；對齊 vite + build-github 既有 mode-aware 架構；風險最低）
- **命名差異**：user-defined Option A/B/C ≠ `docs/ga4-enable-preflight.md` §2.4 既有 Option A/B/C；user Option A = doc Option B_docs（build-mode gating）

### 11.2 pm-11 / C-2 GA4 prod-only gating Option A implementation

- **commit**：`92f4f07 fix(analytics): scope ga4 script to production build mode`
- **修改範圍**（4 個檔；+28 / -14）：
  - `src/scripts/build-github.js`：`makeBaseData` 新增 `isProdBuild = mode === 'build'` flag（+6）
  - `src/views/tracking/ga4.ejs`：EJS 條件擴為 4 條 AND（+2 / -1）
  - `docs/ga4-enable-preflight.md`：§2.4 更新含 Option 命名差異 + §2.6 行為表加 `isProdBuild` 欄位（+18 / -12）
  - `docs/phase-2-candidate-roadmap.md` §1.2：標 ✅ gating 完成；GA4 啟用 deferred（+1 / -1）
- **最終 GA4 script 輸出條件**：
  ```
  ga4 存在 && ga4.enabled === true && ga4.measurementId 非空 && isProdBuild === true
  ```
- **各環境行為**：
  - `npm run dev`（mode=dev / isProdBuild=false）：❌ 永遠不輸出 gtag
  - `npm run build`（mode=build / isProdBuild=true）：仍由既有雙條件（enabled + measurementId）決定
- **GA4 啟用狀態**：**未啟用**；本批僅機制就位；**未填 measurementId** / **未改 enabled=true**
- **preview mode 邊界**：仍可能輸出（vite preview 通常被視為 build mode）；屬 Option A 既知 trade-off；當前 enabled=false 故無實際影響

### 11.3 pm-12 / push pm-11 commit 至 origin/main

- **動作**：`git push origin main`
- **結果**：fast-forward `15cea56..92f4f07  main -> main`
- **post-push**：source main 與 origin/main **同步**（無 ahead/behind）
- **未動**：deploy repo / gh-pages（per spec 禁止）

### 11.4 pm-13 / GA4 gating commit deploy decision preflight

- **性質**：read-only；無 commit
- **方法**：`diff -rq dist/ deploy-repo/`（read-only）
- **發現**：除 `.git` / `.gitkeep` / `.nojekyll` 之結構檔，dist 與 deploy repo 之 production 內容（HTML / CSS / JS / sitemap / robots / assets）**byte-equivalent**
- **結論**：✅ **不 deploy** commit `92f4f07`
- **理由**：
  - GA4 當前未啟用；gating 改動為 future-proof
  - 舊 gating（3-AND）與新 gating（4-AND）在 `enabled=false` 下皆產生相同 HTML 輸出
  - production-visible output 不變
- **後續**：未來啟用 GA4 時必須 deploy（屆時 `enabled=true` 才真改變 HTML）；自然帶上 `92f4f07` 之 gating；無需獨立 deploy phase
- **deploy repo 維持** `06e26ae`

### 11.5 GA4 啟用 deferred（不在本批 scope）

未來啟用 GA4 之預估流程（屬獨立 phase 系列）：

| 步驟 | 動作 |
|---|---|
| 1 | user 至 GA4 後台取得 `G-XXXXXXXXXX` |
| 2 | 更新 `content/settings/ga4.config.json`（`measurementId` + `enabled: true`）|
| 3 | source commit + push origin/main |
| 4 | `npm run build` 確認 dist HTML 含 gtag.js script tag（dev mode 仍不輸出，per `isProdBuild` gating）|
| 5 | deploy phase B 標準 deploy |
| 6 | 線上 smoke test（GA4 Real-time 報表確認 event 進入）|

### 11.6 deferred items 狀態更新（pm-13 後）

| # | 候選 | 狀態 |
|---|---|---|
| 1 | ~~C-2 GA4 prod-only gating~~ | ✅ **gating 完成**（pm-11 commit `92f4f07`；pm-12 已 push origin/main；pm-13 確認不需立即 deploy）|
| 2 | S-3 fixture 補 FB metadata | deferred |
| 3 | Option B validate-level fbPublished rule | deferred |
| 4 | `.gitkeep` emptyOutDir 長期策略 | deferred |
| 5（新）| **GA4 真實啟用**（measurementId + enabled=true）| deferred；需 user 取得 GA4 ID + 走 §11.5 流程 |
| 6（新）| **hostname allowlist**（user-Option B/C）| 可選；若未來啟用 GA4 後發現 preview mode event 污染再啟動 |

### 11.7 今日 commits 統計（pm-14 補記時點）

- **source commits**：15（原 §3 列之 13 + pm-8 docs `15cea56` + pm-11 source `92f4f07`；pm-14 本批 commit 為第 16 個）
- **deploy commits**：1（pm-6 `06e26ae`；pm-13 確認 `92f4f07` 不 deploy）
- **push 狀態**：source main 全部已 push origin/main；deploy gh-pages 已 push origin/gh-pages
- **deploy 凍結**：`06e26ae`（含昨日 SEO noindex + DS-3 CSS + admin overview polish）

---

## 12. Evening dist .gitkeep resolution series（Phase 20260521-pm-19 → pm-21）

本章節記錄今日傍晚解決 `dist/.gitkeep` 反覆 drift 問題之 3 個 phases（1 read-only review + 1 implementation + 1 push）。屬 §10.6 / §11.6 之「`.gitkeep` emptyOutDir 長期策略」之**解除**；其餘 deferred items 仍維持。

### 12.1 pm-19 / .gitkeep emptyOutDir long-term strategy read-only review

- **性質**：read-only；無 commit
- **問題盤點**：
  - `dist/.gitkeep` 為 git tracked placeholder（0 bytes；首次引入於 initial commit `0bf59cc`）
  - `vite.config.js` line 45 `emptyOutDir: true` 造成每次 `npm run build` 清空 dist/ 含 .gitkeep
  - 今日 mid-5 / pm-11 兩次跑 build 皆觸發 ` D dist/.gitkeep` drift；user 即時 `git restore` 解決
  - 屬 friction：每次 build 後須記得 restore；對 CI/CD 不友善
- **Option 比較**：
  - **A.1** 移除 `dist/.gitkeep`（只動 dist；保留其他 3 個 dist-* placeholder）
  - **A.2** 移除全部 4 個 .gitkeep（dist / dist-blogger / dist-promotion / dist-reports）
  - **B** 改 `vite.config.js emptyOutDir=false`（stale asset 累積風險）
  - **C** 維持現況（手動 restore）
- **推薦**：採 **Option A.1**（最小改動；最低風險；對齊「gitignored 資料夾不需 placeholder」業界慣例；不擴展至其他 dist-*）

### 12.2 pm-20 / dist .gitkeep Option A.1 implementation

- **commit**：`3917526 chore(build): remove dist gitkeep placeholder`
- **修改範圍**（2 個變動；`2 files changed, 1 deletion(-)`）：
  - `dist/.gitkeep` deleted（`git rm`；`delete mode 100644`）
  - `.gitignore` 移除 `!dist/.gitkeep` 一行（避免 stale reference；其他 3 行 `!dist-*/.gitkeep` exception 保留）
- **未動**：
  - 其他 dist-* placeholder（`dist-blogger/.gitkeep` / `dist-promotion/.gitkeep` / `dist-reports/.gitkeep`）
  - `vite.config.js`（`emptyOutDir: true` 保留）
  - build scripts（`src/scripts/build-*.js`）
  - `src/**` / `content/**` / `deploy repo`
- **build 驗證**：
  - `npm run build` 成功（prebuild + vite build + postbuild 完整 pipeline）
  - dist/ 正常產出（index.html / sitemap.xml / posts / categories / tags / design-system 等）
  - sitemap.xml 仍 14 url entries
  - **不再出現** ` D dist/.gitkeep` drift（drift 從根源消除；vite emptyOutDir 對未追蹤檔無影響）
  - 其他 dist 產物皆 gitignored（`dist/*`）；未混入 commit

### 12.3 pm-21 / push pm-20 commit 至 origin/main

- **動作**：`git push origin main`
- **結果**：fast-forward `ef915b8..3917526  main -> main`
- **post-push**：source main 與 origin/main **同步**（無 ahead/behind）
- **deploy repo 維持 `06e26ae`**（per pm-19 評估：`.gitkeep` 為 source repo placeholder；不在 deploy 路徑；pm-6 deploy 之 `find + cp` 本就跳過 dotfile；gh-pages 服務內容完全不變）
- **未動**：deploy repo / gh-pages

### 12.4 不 deploy 決策

| 維度 | 結果 |
|---|---|
| commit `3917526` 對線上 GitHub Pages | ❌ 無影響（`.gitkeep` 為 source-only placeholder；非 deploy artifact）|
| dist 產出之 production 內容（HTML / CSS / JS / sitemap）| ❌ 不變 |
| 是否需要 deploy phase | ❌ **不需** |
| deploy repo 凍結 | `06e26ae`（pm-6 deploy；未動）|

### 12.5 deferred items 狀態更新（pm-21 後）

| # | 候選 | 狀態 |
|---|---|---|
| 1 | ~~C-2 GA4 prod-only gating~~ | ✅ gating 完成（per §11.6；GA4 啟用仍 deferred）|
| 2 | S-3 fixture 補 FB metadata | deferred |
| 3 | Option B validate-level fbPublished rule | deferred |
| 4 | ~~`.gitkeep` emptyOutDir 長期策略~~ | ✅ **已解決**（pm-20 commit `3917526` Option A.1；pm-21 已 push）|
| 5 | GA4 真實啟用（measurementId + enabled=true）| deferred；需 user 取得 GA4 ID |
| 6 | hostname allowlist（user-Option B/C）| 可選；若未來啟用 GA4 後發現 preview mode event 污染再啟動 |

### 12.6 今日 commits 統計（pm-22 補記時點）

- **source commits**：18（pm-14 時點 16 + pm-17 README baseline `ef915b8` + pm-20 dist gitkeep `3917526`；pm-22 本批 commit 為第 19 個）
- **deploy commits**：1（pm-6 `06e26ae`；pm-13 / pm-19 / pm-21 皆確認本日無需再 deploy）
- **push 狀態**：source main 全部已 push origin/main（含 pm-15 / pm-18 / pm-21）；deploy gh-pages 已 push origin/gh-pages
- **deploy 凍結**：`06e26ae`（含昨日 SEO noindex + DS-3 CSS + admin overview polish）
- **剩餘 deferred items 數**：4（S-3 / Option B validate-level / GA4 真實啟用 / hostname allowlist）；今日 2 個原 deferred items 已解除（C-2 gating + `.gitkeep` 長期策略）

---

## 13. Remaining deferred items review（Phase 20260521-pm-24）

本章節記錄今日傍晚之 deferred items 整理 read-only review；屬純 read-only 評估；未修改任何檔案；無 commit。產出明日建議工作順序與第一批 phase 指令草案。

### 13.1 pm-24 性質

- **Read-only review**；無 commit / 無 push / 無 deploy / 無 build / 無 validate
- 純 `git status` / `git log` / read docs / grep；source repo + deploy repo 皆 clean
- 產出：4 個 deferred items 評估表 + 明日 Path A / Path B 工作順序 + 明天第一批 phase 指令草案

### 13.2 今日已完成 deferred items（2 項解除）

| # | 項目 | 完成方式 | commit hash |
|---|---|---|---|
| 1 | **C-2 GA4 prod-only gating** | gating 機制就位（user-defined Option A = build-mode gating；4-AND condition）；**GA4 啟用仍 deferred** | `92f4f07`（pm-11 implementation）；pm-12 已 push；pm-13 確認不需 deploy |
| 2 | **`.gitkeep` emptyOutDir 長期策略**（Option A.1）| 移除 `dist/.gitkeep` + `.gitignore` 對應 exception line；build 後 drift 從根源消除 | `3917526`（pm-20 implementation）；pm-21 已 push；不 deploy |

### 13.3 剩餘 deferred items 評估表（4 項）

| # | 項目 | 性質 | 阻擋條件 | 風險 | 適合明天優先 | 推薦順序 |
|---|---|---|---|---|---|---|
| 1 | **GA4 真實啟用**（`measurementId` + `enabled=true`）| source（`ga4.config.json`）+ deploy | user 須取得 `G-XXXXXXXXXX` measurementId（GA4 後台 property + data stream）| 🟡 中（首次正式 production 分析；線上 user 行為將被追蹤）| ✅ 高（一旦 user 取得 ID，流程已就位；機制已驗證）| **1**（若 user 已取得 ID）|
| 2 | **S-3 fixture 補 FB metadata 真實樣本** | source（動 `content/**/*.fb.md` 或 `validation-fixtures/`）| user 須決定 placeholder vs 真實 URL / 日期策略 / 動何處 / 數量 | 🟡 中（動 content；可能影響 build-promotion / validate）| 🟡 中度 | **2** |
| 3 | **Option B validate-level fbPublished rule** | source（`validate-content.js`）+ fixture | user 須決定 severity（warning vs error）+ fixture 設計；38 warnings baseline 將變動 | 🟡 中（首次動 validate baseline）| 🟡 中度（建議於 S-3 之後啟動以複用 fixture）| **3** |
| 4 | **hostname allowlist / GA4 runtime gating 細化**（user Option B/C）| source（`ga4.ejs`）| 前置依賴 #1（GA4 真實啟用）+ user 須觀察 1-2 週是否真有 preview mode event 污染 | 🟡 中（runtime gating；inline JS 維護成本）| 🔴 不適合（依賴 #1 啟用 + 觀察期）| **4（最後；未來；不在明日範圍）**|

**額外候選**（非 deferred；屬遞迴）：**README §7 baseline drift cleanup**（docs-only；最自然第一批；零風險）→ 明日推薦作為 `am-1`。

### 13.4 明日建議工作順序

依 user 是否已取得 GA4 measurementId 而有兩條 Path：

#### Path A（user **已**取得 GA4 ID）

| 順序 | Phase 名 | 推薦理由 | 是否需 user 提供資料 | build / validate / deploy |
|---|---|---|---|---|
| 1 | **am-1 README §7 baseline drift cleanup** | 最自然恢復節奏；對齊 pm-23 final state；零風險；5-10 行修改 | ❌ 否 | ❌ 都不需 |
| 2 | **am-2 GA4 enable preflight read-only** | 在啟用前 review 設定流程 / dev 驗證 / build 預期 / deploy 步驟 | ✅ measurementId 字面值 `G-XXX` | ❌ 純 read-only |
| 3 | **am-3 GA4-enable-1 configure & local verify** | 動 `ga4.config.json`；本機 `npm run build` 驗證 dist 含 gtag script；commit | ✅ 依賴 am-2 確認 | ✅ build；不 validate；不 deploy（留 am-4）|

#### Path B（user **未**取得 GA4 ID）

| 順序 | Phase 名 | 推薦理由 | 是否需 user 提供資料 | build / validate / deploy |
|---|---|---|---|---|
| 1 | **am-1 README §7 baseline drift cleanup** | 同 Path A | ❌ 否 | ❌ 都不需 |
| 2 | **am-2 S-3 fixture metadata strategy pre-analysis** | 評估 placeholder vs 真實 URL / 日期 / 動 content 或 fixtures；產出實作建議 | 🟡 user 須提供策略偏好 | ❌ 純 read-only |
| 3 | **am-3 S-3 fixture implementation**（若 am-2 已對齊策略）| 動 1-2 個 sidecar；觀察 Admin overview populated state；可能跑 build / validate | ❌ 若 am-2 已對齊 | 🟡 可能跑 validate / build |

### 13.5 明天第一批 phase 指令草案參考

詳見 pm-24 §4 之完整草案；摘要：

```text
Phase 20260522-am-1：README §7 baseline drift cleanup
- 只允許修改 docs/README.md（§7 baseline section）
- HEAD ref 更新為：ce2097e
- 補記 19 source + 1 deploy + 2 已解除 deferred + 4 剩餘 deferred
- commit message 建議：docs(project): sync README baseline to pm-23 final state
```

⚠️ user 可調整時點命名 / 限制 / 補記內容後再下達；assistant 不自行啟動。

### 13.6 不啟動實作之原因

| 項目 | 原因 |
|---|---|
| 不啟動 GA4 真實啟用 | 等待 user 取得 measurementId；無 ID 無法 commit |
| 不啟動 S-3 fixture | 等待 user 表態 placeholder / 真實 URL / 日期策略 |
| 不啟動 Option B validate-level | 等待 user 表態 severity（warning vs error）|
| 不啟動 hostname allowlist | 等待 GA4 啟用 + 觀察期完成 |
| 不啟動 README §7 baseline cleanup | 屬可選；本日節奏已封閉；建議留明日作為 am-1 |

### 13.7 今日 commits 統計（pm-25 補記時點）

- **source commits**：19（pm-22 時點 18 + pm-23 push（無新 commit；僅 push）+ pm-24 read-only review（無 commit）+ pm-25 本批 commit 為第 20 個）
- **deploy commits**：1（pm-6 `06e26ae`；今日所有後續 phase 皆確認無需再 deploy）
- **push 狀態**：source main 已 push origin/main 至 `ce2097e`；pm-25 本批 commit 將為新 [ahead 1]
- **deploy 凍結**：`06e26ae`
- **deferred items 數**：4（S-3 / Option B validate-level / GA4 真實啟用 / hostname allowlist）；今日累計解除 2 項

---

## 14. Evening S-3 fixture + Option B validate-level rule series（Phase 20260521-pm-30 → pm-35）

本章節記錄今日晚段 S-3 fixture metadata 樣本 + Option B validate-level rule 之 6 個 phases（pm-30 pre-analysis / pm-31 populated fixture / pm-32 push / pm-33 rule pre-analysis / pm-34 rule implementation + negative fixture / pm-35 push）。屬 §11.6 / §13.6 之 S-3 + Option B 兩個 deferred items 之**解除**；其餘 GA4 真實啟用 + hostname allowlist 仍維持。

### 14.1 pm-30 / S-3 fixture metadata strategy pre-analysis
- 性質：read-only；無 commit
- 4 個既有 sidecar 盤點（全 0 個有 fbPost* 欄位）
- 4 個 Option（A 動正式 content placeholder / B 真實 URL / C validation-fixtures placeholder / D 只動 docs）
- 推薦 **Option C**（不污染正式 content；專供 Admin / validate / unit test）

### 14.2 pm-31 / S-3 populated fixture implementation
- commit：`0d4d821 test(content): add fb post url metadata fixture`
- 新增 2 個 fixture：
  - `content/validation-fixtures/github/posts/_test-fb-post-url-populated.md`（minimal post；status=published）
  - `content/validation-fixtures/github/posts/_test-fb-post-url-populated.fb.md`（enabled=true；fbPostUrl + fbPostedAt + fbPostId + fbCampaign 皆 schema-valid placeholder）
- validate 結果：`0/38/33` 維持（縮短 description 後對齊 baseline）
- 不動正式 content / src / docs / deploy

### 14.3 pm-32 / push populated fixture
- 動作：`git push origin main`
- 結果：fast-forward `52ed1da..0d4d821`
- post-push sync；deploy 維持 `06e26ae`

### 14.4 pm-33 / Option B validate-level fbPublished rule pre-analysis
- 性質：read-only；無 commit
- 4 個 Option（A 只檢查 fbPostUrl / B 加 fbPostedAt / C 4 欄位完整 / D 不做）
- 推薦 **Option A**（對齊 Admin loader P3 規則 DRY；最小 spec；零 false-positive）
- severity 推薦 **warning**（保留升級空間）
- rule name 推薦 **`fb-post-url-missing`**（mirror `fb-md-content-missing` 命名）
- baseline 預估：`0/38/33` → `0/39/34`（+1 from negative fixture）

### 14.5 pm-34 / fb-post-url-missing rule implementation + negative fixture
- commit：`13e38ba feat(validate): add fb-post-url-missing rule for published posts`
- 修改範圍（3 個檔案；+49 行）：
  - `src/scripts/validate-content.js`（+19 行；新增 rule + comment block）
  - `content/validation-fixtures/github/posts/_test-fb-post-url-missing.md`（新；status=published）
  - `content/validation-fixtures/github/posts/_test-fb-post-url-missing.fb.md`（新；enabled=true；故意省略 fbPostUrl）
- rule 觸發條件（4 條 AND）：
  - `.fb.md` 存在 + `enabled === true`
  - 對應 `.md` `status === 'published'`
  - `fbPostUrl` 為空字串或非 string 型別
- rule 不觸發條件：
  - `.fb.md` 不存在 / `enabled === false` / `status !== 'published'` / `fbPostUrl` 非空
- severity：**`warning`**（per pm-33 推薦）
- validate 結果：**`0/39/34`** ✅（對齊 pm-33 §5 預期）
  - 唯一新 warning 來自 `_test-fb-post-url-missing.md`
  - 4 個 real `.fb.md` 對應之 `.md` `status` 皆為 `ready`；未觸發
  - pm-31 populated fixture 未觸發（hasFbPostUrl=true）

### 14.6 pm-35 / push pm-34 rule + fixture commit
- 動作：`git push origin main`
- 結果：fast-forward `0d4d821..13e38ba`
- post-push sync；deploy 維持 `06e26ae`

### 14.7 不 deploy 決策

| 維度 | 結果 |
|---|---|
| commit `0d4d821` / `13e38ba` 對線上 GitHub Pages | ❌ 無影響（validation-fixtures 不出 dist；validate rule 為 source-level 規則）|
| dist 之 production 內容 | ❌ 不變 |
| 是否需要 deploy | ❌ **不需** |
| deploy repo 凍結 | `06e26ae`（pm-6 deploy；未動）|

### 14.8 deferred items 狀態更新（pm-35 後）

| # | 候選 | 狀態 |
|---|---|---|
| 1 | ~~C-2 GA4 prod-only gating~~ | ✅ gating 完成（per §11.6；GA4 啟用仍 deferred）|
| 2 | ~~`.gitkeep` emptyOutDir 長期策略~~ | ✅ Option A.1 完成（per §12.5）|
| 3 | ~~S-3 fixture 補 FB metadata 真實樣本~~ | ✅ **populated + missing case 皆完成**（pm-31 + pm-34 fixtures；commits `0d4d821` + `13e38ba`）|
| 4 | ~~Option B validate-level fbPublished rule~~ | ✅ **完成**（rule `fb-post-url-missing`；severity=warning；commit `13e38ba`）|
| 5 | GA4 真實啟用（measurementId + enabled=true）| deferred；需 user 取得 `G-XXXXXXXXXX` |
| 6 | hostname allowlist / GA4 runtime gating 細化 | deferred；依賴 #5 + 觀察期 |

### 14.9 今日 commits 統計（pm-36 補記時點）

- **source commits**：23（pm-25 時點 19 + pm-28 README baseline `52ed1da` + pm-31 fixture `0d4d821` + pm-34 rule `13e38ba` + pm-36 本批 commit 為第 24 個）
- **deploy commits**：1（pm-6 `06e26ae`；pm-13 / pm-19 / pm-21 / pm-23 / pm-26 / pm-29 / pm-32 / pm-35 皆確認本日後續 commits 不需 deploy）
- **push 狀態**：source main 全部已 push origin/main 至 `13e38ba`（含 pm-29 / pm-32 / pm-35）；pm-36 本批 commit 將為新 [ahead 1]
- **deploy 凍結**：`06e26ae`
- **deferred items 數**：2（GA4 真實啟用 + hostname allowlist）；今日累計解除 **4 項**（C-2 gating / `.gitkeep` / S-3 fixture / Option B rule）
- **validate baseline**：`0 error / 39 warning / 34 posts`（pm-34 起；+1 warning from negative fixture；變動合理）

---

## 15. GA4 enable preflight read-only（Phase 20260521-pm-39）

本章節記錄今日傍晚之 GA4 enable preflight read-only review；屬純 read-only 評估；未修改任何檔案；無 commit。產出未來 GA4 真實啟用之完整 phase plan + user checklist + hostname allowlist 延後決策。

### 15.1 pm-39 性質

- **Read-only review**；無 commit / 無 push / 無 deploy / 無 build / 無 validate
- 純 `git status` / `git log` / read settings + source + docs / WebFetch line health check（接續 pm-38）
- 產出：GA4 機制盤點 + user checklist + 5 個 GA4-enable phases 拆批 + hostname allowlist 判斷

### 15.2 GA4 目前狀態

| 項目 | 值 |
|---|---|
| `content/settings/ga4.config.json` `enabled` | `false` |
| `content/settings/ga4.config.json` `measurementId` | `""` |
| `content/settings/ga4.config.json` `events` | 9 個預定義 event（`page_view` / `internal_link_click` / `tag_click` / `category_click` / `affiliate_click` / `download_click` / `social_click` / `blogger_to_github_click` / `github_to_blogger_click`）|
| 線上 GitHub Pages 是否輸出 gtag.js | ❌ 否（4-AND gating 全部 fail）|

### 15.3 GA4 gating 現況（4-AND condition；per pm-11）

`src/views/tracking/ga4.ejs` 內 EJS 條件：

```
ga4 存在 && ga4.enabled === true && ga4.measurementId 非空 && isProdBuild === true
```

| Pipeline | 是否接 GA4 partial | 是否實際輸出 gtag（即使 user 啟用）|
|---|---|---|
| GitHub Pages build（dist）| ✅ 接（HEAD_PARTIALS 含 ga4）| 通過 4-AND 後輸出 |
| `build-blogger.js`（dist-blogger）| ❌ 不接 | 永遠不輸出 |
| `build-promotion.js`（dist-promotion）| ❌ 不接 | 永遠不輸出 |
| Admin（dev-mode-only）| ❌ Admin EJS 無 ga4 partial | 永遠不輸出 |
| `npm run dev`（mode=dev / isProdBuild=false）| ✅ 接 | ❌ **永遠不輸出**（4-AND 之 isProdBuild=false fail）|

### 15.4 GA4 啟用前 user checklist

user 須先於 GA4 後台完成：

| # | 動作 | 取得 / 決定 |
|---|---|---|
| 1 | 登入 Google Analytics 4 | n/a |
| 2 | 建立 GA4 **property**（推薦命名：`Portable Blog System` 或類似）| property ID（內部）|
| 3 | 建立 **Data Stream**（類型：Web；URL：`https://babel-lab.github.io/portable-blog-system/`）| stream ID（內部）|
| 4 | 從 Data Stream 詳細頁取得 **measurementId** | **`G-XXXXXXXXXX`**（10 位英數；以 `G-` 開頭；UA- 舊版不可用）|
| 5 | 決定 **Data Retention** 期 | 預設 14 個月；個人 blog 建議 2 月即可 |
| 6 | 決定 **Enhanced measurement** 是否全啟用 | 建議全啟用（自動追蹤 scrolls / outbound clicks 等；無需 source 改動）|
| 7 | 評估 **cookie banner / consent banner** 是否需要 | 本系統當前無內建 consent；視 user 訪客來源決定（EU / 加州 → 建議加；純 TW → 可暫不加）|

### 15.5 未來 GA4 enable 5-phase plan

| Phase | 內容 | commit 性質 | 風險 | rollback |
|---|---|---|---|---|
| **GA4-enable-1** configure & local verify | 改 `ga4.config.json`（`enabled: true` + `measurementId: "G-XXX"`）+ `npm run build` 驗證 dist 含 gtag script + `npm run dev` 驗證 dev 不輸出 + commit | source（`feat(analytics): enable GA4 with production measurement id`）| 🟡 中 | `git revert` 或 `git restore` |
| **GA4-enable-2** push source | `git push origin main` | push only | 🟢 低 | `git revert + push` |
| **GA4-enable-3** deploy gh-pages | 同 pm-6 deploy phase B：dist → deploy repo → push gh-pages | deploy | 🟡 中 | `git reset --hard 06e26ae && git push --force origin gh-pages`（謹慎）或 disable + re-deploy |
| **GA4-enable-4** online realtime smoke test | 訪問線上 + GA4 後台 Realtime 報表確認 event 進入；DevTools 確認 gtag.js 載入 | n/a（純驗證）| 🟢 低 | 若 Realtime 無資料 → 檢查 measurementId 拼字 → 必要時 GA4-enable-1 修正 |
| **GA4-enable-5** docs sync | 更新 `docs/ga4-enable-preflight.md` 之 user checklist 標 ✅ / `docs/phase-2-candidate-roadmap.md` / `docs/README.md` §7 / EOD report | docs | 🟢 極低 | `git revert` |

**預估總時間**：~75-100 分（含等待 GA4 Realtime 顯示資料）

### 15.6 hostname allowlist 延後原因

| 維度 | 評估 |
|---|---|
| **目前是否需要** | ❌ **不需要**（pm-11 之 `isProdBuild` gating 已涵蓋 dev / build / preview 主要 split；當前 enabled=false 無實際污染）|
| **不做之風險** | 🟡 `npm run preview`（vite preview）mode 通常被視為 build → 仍輸出 gtag；若 user 啟用 GA4 後跑 preview 訪問本機 4173 port，GA4 會收到本機 hostname event |
| **線上實際影響** | 🟢 低（preview port 4173 通常少跑；GA4 後台可用 hostname filter 排除）|
| **建議何時做** | ✅ **GA4 啟用後觀察 1-2 週**；若發現 preview hostname event 污染嚴重 → 再啟動 hostname allowlist 實作 |
| **若觀察期內無污染** | ✅ 可永久延後；當前 pm-11 之 Option A gating 已足夠 |

### 15.7 user 決策點

1. user 是否已準備建立 GA4 property + 取得 measurementId？
2. Data Retention 偏好（14 個月預設 vs 2 個月精簡）
3. Enhanced measurement 是否全啟用
4. Cookie banner / consent 機制是否需要先建
5. 若已決定要啟用 → 是否啟動 GA4-enable-1 phase（assistant 等 user 提供 measurementId）

### 15.8 今日 commits 統計（pm-40 補記時點）

- **source commits**：24（pm-36 時點 23 + pm-40 本批 commit 為第 25 個）
- **deploy commits**：1（pm-6 `06e26ae`）
- **push 狀態**：source main 全部已 push origin/main 至 `f7c8cce`；pm-40 本批 commit 將為新 `[ahead 1]`
- **deploy 凍結**：`06e26ae`
- **deferred items 數**：2（GA4 真實啟用 + hostname allowlist）；今日累計解除 4 項

### 15.9 pm-39 不啟動實作之原因

| 項目 | 原因 |
|---|---|
| 不啟動 GA4-enable-1 | 等 user 取得 `G-XXXXXXXXXX` measurementId + 表態 4 個決策點 |
| 不啟動 hostname allowlist 實作 | 依賴 GA4 啟用 + 1-2 週觀察期；屬未來 |

---

## 16. GA4 enable execution series（Phase 20260521-pm-43 → pm-46）

本章節記錄今日下午 15:00 ~ 15:07 之 GA4 真實啟用 4-phase 執行（pm-43 configure / pm-44 push / pm-45 deploy / pm-46 smoke test；本批為 pm-46）。屬 §13.6 / §15 之「GA4 真實啟用」deferred 之**解除**；剩餘 deferred 縮為 1 項（hostname allowlist）。

### 16.1 pm-43 / GA4-enable-1 configure & local verify

- commit：`09b9a67 feat(analytics): enable GA4 with production measurement id`
- 修改：`content/settings/ga4.config.json`（`enabled: false → true`；`measurementId: "" → "G-C77SMPF8VD"`）；events 列表保留
- 驗證：
  - `node src/scripts/build-github.js --mode=dev` → `.cache/pages/` 0 gtag match（isProdBuild=false 正確阻擋）
  - `npm run build` → dist 所有 HTML 含 `<script async src="https://www.googletagmanager.com/gtag/js?id=G-C77SMPF8VD">`
  - `git status` 僅 `M content/settings/ga4.config.json`（dist gitignored；pm-20 `.gitkeep` 移除後無 build drift）

### 16.2 pm-44 / GA4-enable-2 push source

- 動作：`git push origin main`
- 結果：fast-forward `8a915b6..09b9a67`
- post-push sync；deploy 維持 `06e26ae`（線上仍未啟用）

### 16.3 pm-45 / GA4-enable-3 deploy gh-pages

- deploy commit：`f32f7d3 deploy: 09b9a67 snapshot (GA4 enabled)`
- 流程（mirror pm-6 deploy phase B）：find 清空 deploy repo（保留 `.git` + `.nojekyll`）→ `cp -r dist/*` → commit + push gh-pages
- diff：23 HTML 各 +7 行（gtag script block）；161 insertions / 0 deletions
- `assets/` / `sitemap.xml` / `robots.txt` 未動（byte-equivalent）
- push 結果：fast-forward `06e26ae..f32f7d3  gh-pages -> gh-pages`

### 16.4 pm-46 / GA4-enable-4 realtime smoke test（本批）

- 性質：純 read-only smoke test + docs note；本 phase 含 docs-only commit；未 push（per spec 限制）
- **線上原始 HTML 驗證**（`curl -s`；非 WebFetch 之 markdown 轉換）：
  - `https://babel-lab.github.io/portable-blog-system/` ✅ HTTP 200；Content-Length 6024；含 `<script async src="...?id=G-C77SMPF8VD">` + `gtag('config', 'G-C77SMPF8VD')`
  - `https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/` ✅ 同上
  - Last-Modified `Thu, 21 May 2026 07:11:54 GMT` ← 對齊本批 deploy 時間
  - Strict-Transport-Security ✅ HSTS（GitHub Pages 原生 HTTPS）
- **gtag.js endpoint 驗證**：
  - `https://www.googletagmanager.com/gtag/js?id=G-C77SMPF8VD` ✅ 返回有效 minified JavaScript（Google Tag Manager 程式碼）
  - 確認 measurementId `G-C77SMPF8VD` 被 Google 端**識別**（GA4 property 存在 + ID 格式正確）

### 16.5 GA4 ID 共用註記（重要）

| 項目 | 內容 |
|---|---|
| **目前 GA4 measurementId** | `G-C77SMPF8VD` |
| **Blogger（`babel-lab.blogspot.com`）** | ✅ 既有；使用同一 measurementId（user 確認）|
| **GitHub Pages（`babel-lab.github.io/portable-blog-system/`）** | ✅ 本批 pm-45 啟用；同一 measurementId |
| **未來 custom domain** | ✅ **沿用同一 measurementId**（per user 規劃；GA4 property 不綁 hostname；Data Stream 之 Website URL 為 metadata 識別用，可後續更新）|
| **資料分離方式** | 後續可於 GA4 後台用 hostname filter / segment 分析 Blogger vs GitHub vs custom domain 之來源 |

### 16.6 Future migration checklist（不在本 phase scope）

⚠️ 以下項目**不**在 GA4-enable 系列之 scope；列為 future migration 之 reminder：

| 項目 | 狀態 | 觸發時機 |
|---|---|---|
| **Custom domain** for GitHub Pages | deferred；預計 5 月底 / 6 月初啟動 | user 申請 domain 後 |
| **GitHub Pages DNS check** + TLS certificate provisioning | deferred | custom domain 設定後 |
| **GitHub Pages Enforce HTTPS** | deferred | TLS provisioning 完成後 |
| **`content/settings/site.config.json` `githubSiteUrl`** | 當前 `https://babel-lab.github.io/portable-blog-system` | custom domain 上線後更新 |
| **siteUrl 推導鏈**（canonical / og:url / JSON-LD url / sitemap `<loc>`）| 自動沿用 `githubSiteUrl`；改 1 處 settings 即可 | 同上 |
| **`dist/sitemap.xml`** 新 domain | rebuild 後自動帶 | 同上 |
| **`dist/robots.txt`** Sitemap reference | 同上 | 同上 |
| **GA4 Data Stream Website URL** | 當前 `https://babel-lab.github.io/portable-blog-system/`；measurementId 不變 | custom domain 上線後於 GA4 後台更新 |
| **Google Search Console** | 需新增 custom domain property + verify ownership + submit 新 sitemap | custom domain 上線後 |
| **Google AdSense** | deferred；user 目標於 custom domain 後送審 + 放廣告 | custom domain + HTTPS Enforce 完成後 |
| **`ads.txt`** | deferred；AdSense 啟用後需於網站根放此檔 | AdSense 審核通過後 |
| **`hostname allowlist / GA4 hostname 觀察`** | deferred；現有 `isProdBuild` gating 已涵蓋 dev/build；preview mode 邊界當前可接受 | 觀察 1-2 週 GA4 資料；若有 hostname 污染再啟動 |
| **Blogger 與 GitHub Pages 流量分離分析設定**（GA4 後台 filter / segment）| deferred；可選 | user 想分析時 |

### 16.7 user 端 GA4 Realtime 驗收 checklist（**user 須親自執行**）

assistant 無法登入 GA4 後台；以下 7 步驟由 user 親自完成：

| # | 動作 | 預期結果 |
|---|---|---|
| 1 | 登入 [Google Analytics](https://analytics.google.com/) 並選 `G-C77SMPF8VD` 對應 property | 進入 GA4 後台 |
| 2 | 至 **Reports → Realtime（即時）** 報表 | 進入即時報表頁 |
| 3 | 開新分頁訪問 `https://babel-lab.github.io/portable-blog-system/`（hard refresh Ctrl+F5）| 載入首頁 |
| 4 | 等待 30 秒 ~ 2 分鐘 + 切回 GA4 Realtime | Active users（前 30 分鐘）顯示 `>= 1` |
| 5 | 確認「Event count by Event name」含 `page_view` | page_view event 進入 |
| 6 | 訪問另一 URL（如 `/posts/github-pages-blog-planning/`）→ 等 30 秒 | Realtime 顯示 2+ pageviews / 2+ unique pages |
| 7 | （可選）DevTools → Network → 篩 `gtag.js` | HTTP 200 + URL `https://www.googletagmanager.com/gtag/js?id=G-C77SMPF8VD` |

**若 step 4 無資料**：
- 等 5-10 分鐘（GA4 後台 propagation 可能略慢）
- 檢查 GA4 後台 property + Data Stream 是否啟用（status: Active）
- 檢查 measurementId 是否拼字正確（`G-C77SMPF8VD`；10 位英數）
- 若 GA4 端 Data Stream 之 Enhanced Measurement 未開 → 仍應有 page_view event；但其他 event（scroll / outbound clicks）不發

### 16.8 commit / push 狀態

- 本批 commit：docs-only（本 §16 append）；commit message 預定 `docs(analytics): record ga4 realtime smoke test result`
- **本批不 push**（per spec 限制：先回報修改內容；user 明示後另開 push phase）

### 16.9 deferred items 狀態更新（pm-46 後）

| # | 候選 | 狀態 |
|---|---|---|
| 1 | ~~C-2 GA4 prod-only gating~~ | ✅ 完成（per §11.6）|
| 2 | ~~`.gitkeep` emptyOutDir 長期策略~~ | ✅ 完成（per §12.5）|
| 3 | ~~S-3 fixture 補 FB metadata~~ | ✅ 完成（per §14.8）|
| 4 | ~~Option B validate-level fbPublished rule~~ | ✅ 完成（per §14.8）|
| 5 | ~~GA4 真實啟用~~ | ✅ **完成**（pm-43 ~ pm-46；commits `09b9a67` + deploy `f32f7d3`）|
| 6 | hostname allowlist | deferred；等 GA4 啟用後觀察 1-2 週再評估 |

**剩餘 deferred items 數**：**1**（hostname allowlist；觀察期）

### 16.10 今日 commits 統計（pm-46 補記時點）

- **source commits**：26（pm-40 時點 25 + pm-43 GA4 enable `09b9a67` + pm-46 本批 commit 為第 27 個）
- **deploy commits**：2（pm-6 `06e26ae` + pm-45 `f32f7d3`）
- **push 狀態**：source main 已 push origin/main 至 `09b9a67`（pm-44）；deploy gh-pages 已 push origin/gh-pages 至 `f32f7d3`（pm-45）；pm-46 本批 commit 將為新 `[ahead 1]`
- **validate baseline**：`0 error / 39 warning / 34 posts`（pm-34 起）
- **GA4 status**：✅ **production live**（measurementId `G-C77SMPF8VD`；Blogger + GitHub Pages 共用；user 待自跑 Realtime 驗收）

---

## 17. Admin Platform Routing extension series（Phase 20260521-pm-54 → pm-62）

本章節記錄今日傍晚 Admin overview 之 Platform Routing read-only display 擴充全鏈（pm-54 pre-analysis → pm-55 plan → pm-57 loader → pm-58 push → pm-59 EJS section → pm-60 push → pm-61 verification guide → pm-62 user 驗收 + docs note）。屬 pm-49 `docs/content-platform-routing.md` §3 之 12 候選欄位之**首批 read-only 落地**（10 欄位中 7 個就位；utmPreviewUrl + list badge + platformMigrationNote 延後）。

### 17.1 pm-54 / Admin platform routing read-only pre-analysis
- 性質：read-only；無 commit
- 盤點：1 個 Admin EJS 檔（759 行；含 inline style + EJS + JS）+ 1 loader（251 行）
- 12 個 read-only 候選欄位可行性 matrix；4 個已 loader 含 / 5 個可純 derive / 1 個需 schema（platformMigrationNote 延後）
- 推薦 Option A → Option B 拆批

### 17.2 pm-55 / docs-only Admin platform routing read-only extension plan
- commit：`21cfa06 docs(admin): plan platform routing read-only display extension`
- 新增 `docs/admin-platform-routing-extension-plan.md`（291 行；9 章節）
- 拆批：pm-56 loader cheap derived → pm-57 EJS section → pm-58 utmPreviewUrl → pm-59 list badge（可選）
- 後續實際執行順序為 pm-57 (loader) → pm-58 (push) → pm-59 (EJS) → pm-60 (push)（plan 中之 pm-58 utmPreviewUrl 已暫緩）

### 17.3 pm-56 / push pm-55 docs commit
- 動作：`git push origin main`；fast-forward `ebfe254..21cfa06`

### 17.4 pm-57 / Admin loader cheap derived fields read-only implementation
- commit：`a34e909 feat(admin): add cheap derived platform routing fields to loader`
- 修改 `src/scripts/load-admin-posts.js`（+48 / -1）
- 新增 module-level `deriveHostname()` helper
- toAdminView 內新增 `primaryPlatform` local const + 4 derived fields：
  - `canonicalTarget`：per primaryPlatform → blogger.publishedUrl / github.previewUrl
  - `platformUrl`：同 canonicalTarget；其他情況 fallback
  - `gaHostname`：per primaryPlatform → URL hostname / settings host
  - `githubStatus`：disabled / rendered / pending
- sanity：`node --check` + `build-github.js --mode=dev` 皆 pass

### 17.5 pm-58 / push pm-57 source commit
- 動作：`git push origin main`；fast-forward `21cfa06..a34e909`

### 17.6 pm-59 / Admin detail Platform Routing section read-only UI
- commit：`a285183 feat(admin): add Platform Routing read-only detail section`
- 修改 `src/views/admin/index.ejs`（+43 / -0；append-only）
- 放置：Identity section 之後 / Dates section 之前
- 7 欄位顯示：primaryPlatform / publishTargets / canonicalTarget / platformUrl / gaHostname / bloggerStatus / githubStatus
- reuse 既有 badge class（b-info / b-ok / b-missing / b-published / b-draft / text-muted / mono）；無新 CSS
- 嚴格 read-only（無 form / 無 fetch / 無 fs write / 無 Apply button）
- sanity：`build-github.js --mode=dev` 後 `.cache/pages/admin/index.html` 增至 117636 bytes；grep `Platform Routing|primaryPlatform|canonicalTarget` 命中 16 次

### 17.7 pm-60 / push pm-59 source commit
- 動作：`git push origin main`；fast-forward `a34e909..a285183`

### 17.8 pm-61 / Admin Platform Routing manual verification guide
- 性質：read-only；無 commit；無檔案改動
- 純口頭提供 user 驗收步驟（9 章節）：dev server 啟動 / Admin URL / row click / 7 欄位預期值 / 4 篇 real posts 對照表 / 排查 8 步驟 / 截圖建議

### 17.9 pm-62 / user 手動驗收結果（本批）

| 維度 | 結果 |
|---|---|
| `npm run dev` 啟動 | ✅ 通過 |
| `http://localhost:5173/admin/` 開啟 | ✅ 通過 |
| 文章 row click 展開 detail panel | ✅ 通過 |
| Platform Routing section 位置（Identity 後 / Dates 前）| ✅ 通過 |
| 7 欄位皆出現 | ✅ 通過 |

#### 第一篇 blogger 文章（user 截圖確認）

| 欄位 | 顯示值 |
|---|---|
| primaryPlatform | `blogger` |
| publishTargets | `blogger / full` + `github / full` |
| canonicalTarget | Blogger URL |
| platformUrl | Blogger URL |
| gaHostname | `babel-lab.blogspot.com` |
| bloggerStatus | `published` |
| githubStatus | `rendered` |

→ 7 欄位之 derived 邏輯（per pm-57）+ EJS render（per pm-59）皆按設計正確運作。

### 17.10 utmPreviewUrl 暫緩決策

| 維度 | 內容 |
|---|---|
| 原始 plan | per pm-55 §3.2 + §4.1 之 `<details>` 收合 UI；屬 B2 子 phase |
| 暫緩理由 | **Admin detail panel 資訊已偏長**（含 Identity / Platform Routing / Dates / SEO / Blogger channel / GitHub channel / FB promotion / FB Post / FB Sidecar Dry-run Editor / Related links / Completeness summary / Missing fields / SEO Dry-run viewer / Source path 等 14 sections）→ 再加 utmPreviewUrl 會讓畫面更雜 |
| 後續可能性 | 🟡 延後；若 user 仍需 → 可獨立 phase 啟動（如 future pm-XX）；或考慮整合至 FB promotion section 內（共用既有 FB metadata 區塊；節省垂直空間）|
| list platform indicator badge（pm-55 §4.2 B4）| 同樣暫緩；屬 nice-to-have UI polish |
| platformMigrationNote schema | 仍暫緩；schema 未定 |

### 17.11 Admin Platform Routing extension 完成度

| 項目 | 狀態 |
|---|---|
| B1 loader cheap derived（4 欄位）| ✅ 完成（pm-57 `a34e909`）|
| B2 EJS Platform Routing section（7 欄位）| ✅ 完成（pm-59 `a285183`）|
| B3 utmPreviewUrl loader + UI | 🟡 **暫緩**（per §17.10）|
| B4 list platform indicator badge | 🟡 **暫緩**（per §17.10）|
| platformMigrationNote schema | 🔴 不在 scope（schema 未引入）|

✅ **read-only 主功能完成**；user 已驗收通過。

### 17.12 今日 commits 統計（pm-62 補記時點）

- **source commits**：32（pm-46 時點 27 + pm-48 `d1e5858` + pm-49 `023227e` + pm-52 `ebfe254` + pm-55 `21cfa06` + pm-57 `a34e909` + pm-59 `a285183`；pm-62 本批 commit 將為第 33 個）
- **deploy commits**：2（pm-6 + pm-45；皆已 push）
- **push 狀態**：source main 已 push origin/main 至 `a285183`（pm-60）；pm-62 本批 commit 將為新 `[ahead 1]`
- **deploy 凍結**：`f32f7d3`（pm-45 GA4 enable deploy）
- **解除 deferred items**：**6**（C-2 gating / `.gitkeep` / S-3 fixture / Option B rule / GA4 真實啟用 / UTM naming reconciliation）
- **新增功能就位 + 暫緩**：Admin Platform Routing extension（B1 + B2 完成；B3 + B4 暫緩）
- **剩餘 deferred items**：1（hostname allowlist；觀察期）
- **GA4 status**：✅ production live（measurementId `G-C77SMPF8VD`）

---

## 18. Final stable state / next-day handoff（Phase 20260521-pm-66）

本章節為今日（2026-05-21）最終穩定狀態封存；明日工作起點參考。

### 18.1 最終狀態

| 維度 | 值 |
|---|---|
| **source HEAD** | `42c7359 docs(project): sync README baseline to pm-64 final state` |
| **deploy HEAD** | `f32f7d3 deploy: 09b9a67 snapshot (GA4 enabled)` |
| **source main / origin/main** | sync（無 ahead/behind）|
| **deploy gh-pages / origin/gh-pages** | sync（無 ahead/behind）|
| **兩 repo working tree** | clean |
| **線上 GitHub Pages** | ✅ 服務於 `f32f7d3`（含 GA4 production）|
| **GA4 production** | ✅ live；measurementId `G-C77SMPF8VD`；Realtime 驗收通過 |
| **validate baseline** | `0 error(s) / 39 warning(s) on 34 post(s)` |
| **dist/sitemap.xml** | 14 url entries |

### 18.2 今日完成 5 大成果

1. ✅ **GA4 production enabled + Realtime 驗收通過**
   - source commit `09b9a67`（pm-43；configure `enabled=true` + `measurementId=G-C77SMPF8VD`）
   - deploy commit `f32f7d3`（pm-45；gh-pages 上線）
   - user 於 pm-46 手動驗收 Realtime 報表：active user 1 / 30 分鐘內 4 pageviews / `/portable-blog-system/` 路徑

2. ✅ **UTM registry 對齊 production snake_case convention**
   - pm-48 新增 `docs/ga4-parameter-naming-registry.md`（299 行 → pm-52 對齊既有後 ~340 行）
   - pm-52 commit `ebfe254`：採 user 決議「改 registry 對齊既有 implementation」；採 `github_pages` / `portable_blog_system` / `related_links` / `other_links` snake_case；保留 fbCampaign 個別命名空間之 kebab-case；0 remaining drift

3. ✅ **content platform routing spec 完成**
   - pm-49 新增 `docs/content-platform-routing.md`（280 行）
   - 涵蓋 platform routing 概念 / category & tag taxonomy / Admin read-only 12 候選欄位 / 未來 Admin write / GA setting impact / pm-48 registry 之分工

4. ✅ **Admin Platform Routing read-only loader + UI 完成並手動驗收**
   - pm-55 plan：`docs/admin-platform-routing-extension-plan.md`（291 行）
   - pm-57 loader：commit `a34e909`；4 個 cheap derived fields（canonicalTarget / platformUrl / gaHostname / githubStatus）+ `deriveHostname()` helper
   - pm-59 EJS：commit `a285183`；Admin detail panel 新增 Platform Routing section（7 欄位；放置 Identity 後 / Dates 前）
   - pm-62 user 手動驗收通過（第一篇 blogger 文章 7 欄位皆按設計顯示）

5. ✅ **README baseline sync 完成**
   - pm-1 / pm-17 / pm-28 / pm-64 共 4 次同步；最新 pm-64 commit `42c7359` 已對齊 fc02a56 之 final state

### 18.3 今日暫緩項

| 項目 | 暫緩理由 |
|---|---|
| **utmPreviewUrl** | per pm-62 §17.10：Admin detail panel 資訊已偏長（14 sections）；再加會更雜 |
| **list platform indicator badge** | 同上 |
| **platformMigrationNote schema** | schema 未定；屬未來獨立 phase |
| **hostname allowlist** | 等 GA4 啟用後觀察 1-2 週；當前 isProdBuild gating 已涵蓋 dev/build 主要 split |
| **custom domain migration** | 預計 5 月底 / 6 月初啟動；屬獨立 phase 系列 |
| **AdSense / `ads.txt` / 廣告碼** | 依賴 custom domain + HTTPS Enforce 完成 |

### 18.4 明日候選工作（**只列；不執行**）

| 候選 | 性質 | 阻擋 |
|---|---|---|
| Admin utmPreviewUrl preflight | read-only preflight | user 須表態（pm-62 暫緩可恢復評估）|
| Admin list badge UI polish | source（EJS）| user 表態 |
| platformMigrationNote schema design | docs + schema | user 表態 |
| custom domain migration plan / preflight | read-only preflight | 等 user 取得 domain |
| AdSense readiness preflight | read-only | 等 custom domain + HTTPS |
| hostname allowlist 觀察 review | read-only | 等 GA4 累積 1-2 週資料 |
| GA4 hostname observation review | read-only | 同上 |
| README baseline sync × N（自然遞迴）| docs-only | 隨後續 commits 累積 |

### 18.5 今日工作邊界封存

🛑 **今日不再建議 source 改動**。維持以下狀態：
- source / deploy 兩 repo working tree clean
- 兩 repo 與 remote 完全同步（無 ahead / 無 behind / 無 dirty）
- 不再啟動任何 source 改動 / build / validate / deploy / push
- 不啟動 §18.3 之任何暫緩項
- 線上 GitHub Pages 維持 `f32f7d3` 之 GA4 production live state

明日工作起點：source HEAD `42c7359`；deploy HEAD `f32f7d3`；皆 sync remote。

---

（本文件結束）
