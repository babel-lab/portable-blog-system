# 2026-05-25 Phase 1 User Guide Drift Check

> Phase: `20260525-am-5-user-guide-drift-check-doc-a`
> 模式：docs-only（純 audit 落地；**不**修改 `docs/phase-1-user-operation-guide.md`）
> 來源：本文件為 Phase `20260525-am-4-user-guide-drift-readonly-a` 之 read-only drift audit 結果整理。

---

## §1 文件目的與範圍

### 1.1 目的

本文件為對 `docs/phase-1-user-operation-guide.md` 之 **read-only drift audit** 結果落地。針對 user guide 中涉及 baseline 數字、warning 數、issue 數、sitemap entries、ready posts、build output、GA4 / Blogger / GitHub / FB / Admin 狀態之段落，比對目前 PC 端實際 source / settings / dist 狀態與較新文件依據，識別出 drift 點。

### 1.2 範圍

| 項目 | 涵蓋 |
|------|------|
| **時間點** | 2026-05-25 上午 |
| **audit 對象** | `docs/phase-1-user-operation-guide.md`（293 行）|
| **比對對象** | 當前 PC 端 source / settings / dist + 較新 docs（per §2.4） |
| **本 phase 是否修改 user guide** | ❌ 否 — 本 phase **僅記錄** drift；**不**改 user guide 本身 |
| **是否觸及其他 source** | ❌ 否 — 純 docs-only 新增本 audit 檔 |

### 1.3 為何拆兩批

本 phase 為 audit doc 落地；user guide 之實際 rewrite 屬另一批。理由詳見 §6。

---

## §2 Audit baseline

### 2.1 git baseline（audit 啟動時）

| 項目 | 值 |
|------|---|
| repo | `portable-blog-system` |
| working directory | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `d13174fee2b405e2c2283922a184fa55062de126`（short `d13174f`；上一 phase `20260525-am-3` commit）|
| origin/main | `d13174fee2b405e2c2283922a184fa55062de126` |
| ahead / behind | `0 / 0` |
| working tree | clean |

### 2.2 本批允許之 read-only 檢查

per spec 限制：

- ✅ 允許跑：`validate:content` / `report:build` / `report:urls` / `report:missing-tags` / `report:series` / `report:book` / `check:links` / `check:images`
- ⚠️ 但 spec 加注「若任何 script 會改寫 dist-reports 或其他檔案，請先停止」
- 本 phase 採保守判斷：`report:*` 與 `check:*` 之輸出名稱（`dist-reports/{name}-report.{json,txt}`）暗示會寫檔 → **不執行**
- `validate:content` 經 source 檢查（`grep writeFile/mkdir/appendFile src/scripts/validate-content.js` 無命中；script header 註明僅 stdout 輸出 + exit code） → **判定為純 read-only，安全執行**

### 2.3 validate:content 是否執行 + side-effect

| 項目 | 結果 |
|------|------|
| 是否執行 | ✅ 是（1 次，audit 過程中） |
| 是否有 side-effect | ❌ 無（執行後 `git status --short --branch` 仍為 `## main...origin/main` clean；無 untracked / modified） |
| 執行結果 | `0 error(s) / 39 warning(s) on 34 post(s)` |
| 來源 | 本 audit run；非引用他 docs |

### 2.4 相關參考文件

本 audit 之比對依據：

- `docs/20260525-phase1-usability-review.md`（本日 am-3 commit `d13174f` 落地；7 維度能力盤點 + 13 流程 usability 表）
- `docs/phase-1-completion-report.md`（Phase 9-z-d 正式 final report；§3.2 / §3.3 / §3.4 baseline + dist 統計）
- `docs/phase-status-20260523.md`（5/23 Phase 1 完成度盤點；§1.3 / §4.2 GA4 4-AND gating + measurementId）
- `docs/20260524-eod-report.md`（5/24 全日收尾；§5 GA2 fix + §7.1 / §7.2 / §7.3 final baseline + §8 settings 未動清單）
- `docs/20260525-pc-handoff-baseline.md`（5/25 NB→PC 接手 baseline；commit `65145a8`）

---

## §3 Drift summary

### 3.1 總計

| 嚴重度 | 數量 | drift id |
|--------|------|---------|
| 🔴 HIGH | 4 | D1 / D2 / D5 / D6 |
| 🟡 MEDIUM | 2 | D3 / D4 |
| 🟡 LOW | 1 | D7 |
| 🔵 INFO | 1 | D8 |
| **總計** | **8** | — |

### 3.2 主因

`docs/phase-1-user-operation-guide.md` 寫成於 **GA4 啟用之前**（即 2026-05-21 pm-46 之前）。其後 5/21 ~ 5/24 跨度發生多項 production state 變動，user guide **未隨之同步**：

| 時點 | 事件 | 影響 user guide 段落 |
|------|------|---------------------|
| 5/21 pm-46 | GA4 measurementId `G-C77SMPF8VD` 填入 + `enabled: true` + production deploy + user 驗收通過 | §1 / §3 GA4 row / §7 / §10 #1 |
| 5/22 night | Admin 5 fixes + push origin/main（branch 已有 upstream） | §3 Git 角色 row |
| 5/23 | phase-status audit 落地；GA4 gating 描述為「4-AND」 | §3 GA4 row |
| 5/24 | GA4 click tracking spec + G2 link_type cross-site source fix（commit `e6f0a5f`）+ deploy `960f234`（含 GA4 + DT-A2 hashtag wrap） | §3 deploy HEAD row / §2 commit wording / §7 |
| 5/24 起累計 fixtures | validation-fixtures 累計增加 → validate baseline 漂移 | §1 / §6.1 baseline 數字 |

---

## §4 Drift details

### D1 — 🔴 HIGH

| 維度 | 內容 |
|------|------|
| **drift id** | D1 |
| **位置** | §1「⏳ 機制就位但尚未啟用」表，GA4 行 |
| **原文件寫法** | `GA4 收 event \| 需 user 填 content/settings/ga4.config.json 之 measurementId + 切 enabled: true（per docs/ga4-enable-preflight.md §3.1 必勾 checklist）` |
| **目前實際狀態** | ❌ 主張錯誤：`content/settings/ga4.config.json` 當前 `enabled: true` + `measurementId: "G-C77SMPF8VD"`（PC 端 read 確認）；GA4 production live 自 2026-05-21 pm-46 起持續（per `phase-status-20260523.md` §4.2 + `20260524-eod-report.md` §7.3） |
| **風險等級** | 🔴 HIGH |
| **影響** | operator 讀此會以為 GA4 尚未啟用；可能誤跑 preflight checklist / 重設 config / 重複啟用流程 |
| **建議處理** | 將該 row 移出「尚未啟用」table；改入「✅ 已啟用」段；保留 `ga4-enable-preflight.md` 連結作為未來「切站 / 換 measurementId / 重設」時參考 |

### D2 — 🔴 HIGH

| 維度 | 內容 |
|------|------|
| **drift id** | D2 |
| **位置** | §3 表 deploy repo「當前 HEAD」row |
| **原文件寫法** | `當前 HEAD \| 固定於 4ecd92d（今日未動）` |
| **目前實際狀態** | deploy repo HEAD = `960f234 deploy: update ga4 link_type and hashtag wrap`（5/24 am-7b 結果；per `20260524-eod-report.md` §7.2） |
| **風險等級** | 🔴 HIGH |
| **影響** | operator 對齊 deploy 基準時會誤判 deploy HEAD；可能誤觸 reset / re-deploy 比對 |
| **建議處理** | 改為「最近 deploy 為 `960f234`（2026-05-24）」或註記「此 commit hash 隨 deploy 變動；以 deploy repo 實際 HEAD 為準（per `20260524-blogger-github-publishing-runbook.md` §4）」 |

### D3 — 🟡 MEDIUM

| 維度 | 內容 |
|------|------|
| **drift id** | D3 |
| **位置** | §3 表 source repo「Git 角色」row |
| **原文件寫法** | `branch main；本機開發；當前無 upstream 不 push` |
| **目前實際狀態** | source repo `origin/main` upstream 已設定（`https://github.com/babel-lab/portable-blog-system.git`）；本日 5/25 已 push 2 次（`65145a8` pc-handoff-baseline + `d13174f` phase1-usability-review；per `20260525-pc-handoff-baseline.md` §2 + 本 audit 啟動 baseline §2.1） |
| **風險等級** | 🟡 MEDIUM |
| **影響** | operator 對 push 邊界之理解錯位；可能誤以為「不允許 push」而觸發其他 workaround |
| **建議處理** | 改為「branch main → origin/main；push 屬常規動作；gh-pages deploy 屬獨立分支且為手動」 |

### D4 — 🟡 MEDIUM

| 維度 | 內容 |
|------|------|
| **drift id** | D4 |
| **位置** | §3 表「GA4」row gating 描述 |
| **原文件寫法** | `本系統 ga4.ejs 雙條件 gating 注入` |
| **目前實際狀態** | 現為 **4-AND gating**：`ga4` 存在 && `enabled === true` && `measurementId` 非空 && `isProdBuild`（per `phase-status-20260523.md` §4.2） |
| **風險等級** | 🟡 MEDIUM |
| **影響** | 技術描述失準；不影響日常操作，但影響對 dev/prod 分流之理解 |
| **建議處理** | 「雙條件」改「四條件」並列出 4 個 AND 條件；連結 `phase-status-20260523.md` §4.2 為 canonical |

### D5 — 🔴 HIGH

| 維度 | 內容 |
|------|------|
| **drift id** | D5 |
| **位置** | §7「GA4 目前狀態」整節 |
| **原文件寫法** | （多處）「✅ `content/settings/ga4.config.json` 已含 measurementId 欄位（**目前空字串**）+ enabled: false」 / 「❌ **measurementId 未填**；**enabled 仍 false** → GitHub Pages 線上 **無 GA4 script**（grep 證實）」 / 「**機制完整就位；尚未啟用**」之整節定位 |
| **目前實際狀態** | `ga4.config.json` 當前 `enabled: true` + `measurementId: "G-C77SMPF8VD"`；GitHub Pages production 線上含 GA4 script；5/24 G2 click tracking fix 已 deploy；user manual validation 已通過（per `20260524-eod-report.md` §5.6 + §7.3） |
| **風險等級** | 🔴 HIGH |
| **影響** | **整節定位完全錯誤**；operator 讀此會以為 GA4 還沒啟用；最容易誤觸 preflight 流程之段落 |
| **建議處理** | 整節 rewrite：改為「✅ 已啟用」現況描述（measurementId / enabled 狀態 / 自何日 live / GitHub Pages production 含 gtag script）+ 觀察 SOP（連結 `20260524-ga4-reverse-utm-observation.md` §4-§6 之 Realtime / DebugView / Reports 操作）；preflight doc 改作為「未來重設 / 切 measurementId / 啟用 dev/prod 分流時參考」（per D1 處理一致原則） |

### D6 — 🔴 HIGH

| 維度 | 內容 |
|------|------|
| **drift id** | D6 |
| **位置** | §10 表「第一階段完成前仍需人工確認的項目」#1 |
| **原文件寫法** | `# 1 \| GA4 measurementId 啟用（8 項必勾 checklist） \| docs/ga4-enable-preflight.md §3.1` |
| **目前實際狀態** | ✅ 已啟用；8 項 preflight 已過（per 2026-05-21 pm-46 user 驗收 + 5/24 G2 deploy 後再次 manual validation；per `20260524-eod-report.md` §5.6） |
| **風險等級** | 🔴 HIGH |
| **影響** | 列為「仍需人工確認」會誤導；operator 可能重複跑 preflight |
| **建議處理** | 移出 §10 表；或改寫為「✅ 已完成（2026-05-21 pm-46；measurementId `G-C77SMPF8VD`；5/24 G2 fix manual validation 再次通過）」作為歷史紀錄保留；§10 編號重排 |

### D7 — 🟡 LOW

| 維度 | 內容 |
|------|------|
| **drift id** | D7 |
| **位置** | §6.1 與 §1「驗證文章 metadata」table row |
| **原文件寫法** | 「預期：`0 error(s) / 38 warning(s) on 33 issue-post(s)`（本日 baseline）」 |
| **目前實際狀態** | 本 audit 跑 `npm run validate:content` 實測：**`0 error(s) / 39 warning(s) on 34 post(s)`** |
| **風險等級** | 🟡 LOW |
| **影響** | drift 僅 +1 warning / +1 post；推測為某新 validation-fixture 自 user-guide 寫成後新增；不阻擋操作但 baseline 數字不對齊則 commit 時無法判斷漂移原因 |
| **建議處理** | 改為 `0 error / 39 warning on 34 post(s)`；註記 baseline 隨新 fixture / ready post 自然漂移；提示 operator commit message 須明示變動原因（per `seo-indexing-rules.md` §11 SEO-2 commit 範例） |

### D8 — 🔵 INFO

| 維度 | 內容 |
|------|------|
| **drift id** | D8 |
| **位置** | §2 表「本機 source repo 與 GitHub Pages deploy repo 的差異」末段 |
| **原文件寫法** | 「**重要**：source 改完 + commit ≠ 部署到 GitHub Pages。部署需另外把 `dist/` 內容推到 deploy repo 之 gh-pages branch。**今日所有 commits 都只在 source repo；GitHub Pages 線上版未變**。」 |
| **目前實際狀態** | 該句以「今日」為時間錨；user guide 寫成日之「今日」非當前日；當前 5/24 GA4 + G2 fix 已 deploy（`960f234`）；GitHub Pages 線上版已更新 |
| **風險等級** | 🔵 INFO |
| **影響** | 屬時間相對描述；reader 易誤解為「source commit 永遠不會 deploy」 |
| **建議處理** | 去掉時間錨；改為「source commits 與 deploy 為獨立流程；deploy 屬另行手動操作（per `20260524-blogger-github-publishing-runbook.md` §3）；source 端 push 不會自動觸發 gh-pages deploy」 |

---

## §5 未漂移確認

以下 user guide 段落經本 audit 比對後**確認仍對齊當前狀態**，不需修改：

| # | 段落 | 確認結果 | 比對依據 |
|---|------|---------|---------|
| 1 | §3 表 sitemap 「14 url entries」 | ✅ 對齊；當前 `dist/sitemap.xml` 實測 14 entries；lastmod `2026-05-24` | `dist/sitemap.xml` 直接 read |
| 2 | §6.2 sitemap breakdown「home (1) + post-list (1) + post-detail (2) + category-list (1) + per-category (2) + tag-list (1) + per-tag (6)」 | ✅ 完全對齊；6 個 tag 為 book-review / reading-notes / self-growth / github / vite / static-site | `dist/sitemap.xml` 直接 read 之 14 個 `<loc>` 行 |
| 3 | §3 表 source repo 路徑 `D:\github\blog-new\portable-blog-system\` | ✅ 對齊 | PC 端 `pwd` 確認 |
| 4 | §4 Admin section（read-only / dry-run 狀態 / 14 stat-cards / 6 filter / 3 sort / 10 detail sections / dry-run editor preview only / 無 fs.write） | ✅ 對齊 | `admin-overview-audit-20260523.md` §1 / §2 / `20260525-phase1-usability-review.md` §3.6 |
| 5 | §5 新增文章流程（GitHub + Blogger 兩端 10 / 12 步） | ✅ 對齊；schema 自 Phase 8 系列穩定 | `phase-1-completion-report.md` §5.1 / `publish-workflow.md` |
| 6 | §8 FB sidecar 寫入規則（仍需 VS Code 手動編輯；FB-P5-c 未啟動） | ✅ 對齊；FB-P5-c 仍 blocked on user 8+6 preflight | `fb-sidecar-write-preflight-decision.md` §7 / `20260525-phase1-usability-review.md` §3.3 |
| 7 | §9 FAQ Q3 GA4 啟用步驟 | ⚠️ **可保留作未來重設參考**；技術上 user 已啟用（per D1），但 wording「可以但須先看 preflight」對未來重設 / 切站 / 換 measurementId 仍有效；建議保留並加註「目前已啟用」前綴即可 | `ga4-enable-preflight.md` §3.1 仍為 canonical |

備註：以上 7 項為 audit 過程中**主動驗證**之未漂移段落；非完整 user guide 章節清單。其餘段落（§1 ✅ 已可做 表上半 / §3 其他 row / §5 流程細節 / §6 其他 / §7 / §11）若未列入 §4 drift detail，本 audit 視為「未驗證但未發現明顯衝突」；若需 100% line-by-line 確認，可另開更深 audit phase。

---

## §6 是否建議直接修改 user guide

### 6.1 結論

❌ **不建議在本 phase 直接改 user guide**。

### 6.2 原因

| # | 原因 |
|---|------|
| 1 | **本 phase 為 audit doc**；scope 為「記錄 drift」；改 user guide 屬 write 動作，超出 audit batch 邊界 |
| 2 | **D5 需要整節 rewrite**；§7「GA4 目前狀態」之 GA4 enabled / disabled 段需重組為單一「✅ 已啟用 + 觀察 SOP」段；不適合與 audit report 同 batch |
| 3 | **D1 / D6 需 user 決定保留方式**：preflight 內容（8 項必勾 checklist）是「完全移除」還是「移為歷史紀錄保留 + 加註已完成日」需 user 表態 |
| 4 | 拆兩批安全：先 commit audit doc → user 看完 → 再開 user-guide rewrite phase（單檔 source 修改；可分多 commit 或一次完成） |

### 6.3 建議拆批

| Phase | 性質 | 範圍 |
|-------|------|------|
| 本 phase（am-5）| docs-only 新增 | 落地本 audit 為 `docs/20260525-phase1-user-guide-drift-check.md`（即本文件） |
| 下一批（建議命名 `20260525-am-6-phase1-user-guide-rewrite-a` 或類似）| docs-only 修改 | `docs/phase-1-user-operation-guide.md`（依 D1-D8 逐項修；可分多 commit） |

---

## §7 建議下一步

| 候選 | 性質 | 描述 | 推薦度 |
|------|------|------|-------|
| **A** | docs-only commit / push | 本 audit 文件 commit + push origin/main（如同 am-1 / am-3 pattern） | ⭐⭐ 高 |
| **B** | docs-only 改既有檔 | 另開 phase 依 D1-D8 修改 `docs/phase-1-user-operation-guide.md`；可一次 commit 或拆多批 | ⭐⭐ 中（需先 A） |
| **C** | docs-only 新檔 | T3 — Reverse UTM 5/25 fixture readiness snapshot（per `20260525-phase1-usability-review.md` §6） | ⭐ 中（獨立任務；可後做或另日） |

### 7.1 建議順序

**A → B → C**：

- A 先 land：保留 audit 紀錄；對齊 5/25 docs trail；後續 B 之 commit message 可引用此 audit 作為依據
- B 再做：依 audit 修 user guide；可一次 commit「sync drift D1-D8 to phase-1-user-operation-guide」或拆 HIGH / MEDIUM / LOW 三批
- C 後做：與 user guide drift 議題無依賴；可獨立調度

### 7.2 不建議今日同時推進

| 不推薦並行項 | 原因 |
|--------------|------|
| 在本 audit phase 內直接改 user guide | 跨 batch 邊界；違反「本 phase 不修改 user guide」spec |
| 啟動 reverse UTM deploy verify（pm-26 系列） | 需 Blogger 後台 / GA4 後台 / fixture 建立；非 docs-only |
| 啟動 FB-P5-c 寫入 | blocked on user 8+6 preflight |
| 啟動 Admin B 系列 stat-card | blocked on user 表態（per `admin-overview-b-series-decision-prep.md`） |

---

## §8 本 phase 邊界保證

本 phase `20260525-am-5-user-guide-drift-check-doc-a` 嚴格遵守 docs-only 邊界：

| 項目 | 狀態 |
|------|------|
| 修改 `docs/phase-1-user-operation-guide.md`（本 audit 對象） | ❌ 無 |
| 修改 `README.md` / `CLAUDE.md` | ❌ 無 |
| 修改 docs index（`docs/README.md`） | ❌ 無 |
| 修改 `src/`（views / styles / js / scripts） | ❌ 無 |
| 修改 `content/`（posts / settings / templates / fixtures） | ❌ 無 |
| 修改 build scripts（`src/scripts/`） | ❌ 無 |
| 修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 無 |
| 修改 deploy repo | ❌ 無 |
| 執行 `npm install` | ❌ 無 |
| 執行 `npm run build*` / `npm run dev` | ❌ 無 |
| 執行 `npm run report:*` / `npm run check:*` | ❌ 無（per §2.2 保守判斷） |
| 執行 `npm run validate:content` | ✅ 1 次（per §2.3；經 source 確認無 write side-effect；audit 後 `git status` 仍 clean） |
| 執行 git commit / push | ❌ 無（待 user 確認後另行決定） |
| 觸碰 Blogger 後台 / GA4 後台 / FB 後台 | ❌ 無 |
| 啟動任何 deferred items | ❌ 無 |
| **唯一允許** | ✅ 新增 `docs/20260525-phase1-user-guide-drift-check.md`（本檔；單一檔案） |

本文件落地後**不**改變任何 production state；屬純 audit / planning 工具。

---

（本文件結束）
