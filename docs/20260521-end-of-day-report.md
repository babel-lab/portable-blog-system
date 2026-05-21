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

（本文件結束）
