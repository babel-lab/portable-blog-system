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

（本文件結束）
