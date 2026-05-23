# 20260523 End-of-Day Report

本文件為 BLOG / portable-blog-system 之 **2026-05-23 全日收尾報告**；屬 docs-only；初版於 phase `20260523-pm-4-eod-report-a` 落地（commit `76872a5`），後經 phase `20260523-pm-6-eod-addendum-a` 補記 pm-5 Admin A2 完成 + final baseline 更新（本次補記亦為 docs-only；**不**修改 src / content / template / dist；不 build / 不 validate / 不 deploy / 不 push gh-pages / 不碰 Blogger 後台）。

本文件**不是** roadmap，**不是**新 spec，**不是**啟動指令；屬今日工作收尾紀錄，方便明日 cold-start 接續。

---

## 1. Date / Context

| 項目 | 值 |
|---|---|
| **日期** | 2026-05-23 |
| **工作範圍** | 5 個 docs-only 大批盤點（Phase 1 status / GA4 spec 固化 / Admin overview audit / Publishing workflow / Design token audit）+ 1 個 audit drift 補正 + 2 個 Admin source 小修（A1 sourceSite + A2 fbBadge）+ 1 EOD doc + 1 EOD addendum |
| **工作性質** | **穩定收斂為主**；5 docs-only + 1 docs 補正 + 2 單檔 source 小修（共 26 行）+ EOD 文件 / addendum；不啟動大型 Phase 2 / GA4 implementation / Blogger listener / custom domain / Admin write |
| **session 起點** | 10:48（day-1-batch-1：Phase 1 status audit）|
| **session 終點** | EOD addendum 落地後（pm-6；本次補記）|

---

## 2. Completed Today

| 段 | Phase | 性質 | 範圍 |
|---|---|---|---|
| **day-1**（上午）| `20260523-day-1-batch-1` | docs new（commit `939d97a`）| Phase 1 完成度 snapshot（8 area + 補做候選 + 邊界）|
| | `20260523-day-1-batch-2` | docs modify（commit `be44701`）| GA4 link tracking spec 固化（反映 5/22 inline attrs / placement params / affiliate top+bottom / related+other 落地後狀態）|
| | `20260523-day-1-batch-3` | docs new（commit `430ecb0`）| Admin overview audit（14 stat-cards / 6 optgroup filter / 10 detail sections + A/B/C/D 4 系列拆批）|
| | `20260523-day-1-batch-4` | docs new（commit `50a5b24`）| Publishing workflow 系統級盤點（content → build → Blogger / GitHub Pages → FB → 回填 → backup）|
| | `20260523-day-1-batch-5` | docs new（commit `e0c87b4`）| Design token / component style audit（DT-A/B/C 系列拆批）|
| **下午**（pm）| `20260523-pm-2-admin-audit-drift-fix-a` | docs modify（commit `90d81ce`）| 補正 admin-overview-audit-20260523.md：A3 URL linkify 已於 2026-05-21 `da00f53` 落地，audit 初版誤列為候選屬 stale info bug；4 處標 ✅ 已實作 |
| | `20260523-pm-3-admin-a1-source-site-filter-optgroup-a` | **source small fix**（commit `f7dd897`）| `src/views/admin/index.ejs` +11 行：新增 sourceSite filter optgroup（📘 blogger / 🐙 github）+ data-source-site row attr + matchesFilter case；per `admin-overview-audit-20260523.md` §10.1 A1 |
| | `20260523-pm-3-admin-a1-post-push-final-verify-a` | read-only verify（無 commit）| post-push final clean check |
| | `20260523-pm-4-eod-report-a` | docs new（commit `76872a5`）| EOD report 初版 |
| | `20260523-pm-5-admin-a2-fb-badge-filter-optgroup-a` | **source small fix**（commit `b9b76c6`）| `src/views/admin/index.ejs` +15 行：新增 fbBadge filter optgroup（4 well-known values：posted / ready / none / disabled）+ data-fb-badge row attr + matchesFilter case；per `admin-overview-audit-20260523.md` §10.1 A2 |
| | `20260523-pm-6-eod-addendum-a`（本次補記）| docs modify | 本文件補記 pm-5 完成 + final baseline 更新 |

### 2.1 統計

- **read-only / verify phases**：1（post-push final verify；無 commit）
- **docs commits**：7（5 大批 + 1 audit drift 補正 + 1 EOD 初版；本次 addendum 為第 8）
- **source commits**：2（Admin A1 sourceSite filter 11 行 + Admin A2 fbBadge filter 15 行；共 26 行；皆單檔 `src/views/admin/index.ejs`）
- **remote push 動作**：本日所有 commits 皆已 push origin/main（含 pm-4 之 `76872a5` + pm-5 之 `b9b76c6`；本次 addendum 為 9th push）
- **idle freeze phases**：2（post-push final verify 後 + pm-5 後 idle freeze；本次 addendum 後為第 3 次）
- **重點轉折**：上午 5 大 audit 完成後，下午發現 admin-audit 初版 A3 列為候選但實際已實作（drift fix）→ 接續 A1 落地 → EOD 初版 → 接續 A2 落地 → addendum 補正

---

## 3. Commits Today

9 個 commits（按時序由舊至新；不含本次 pm-6 addendum 自身之 commit，將為第 10）：

| # | commit | message | 段 | 類型 |
|---|---|---|---|---|
| 1 | `939d97a` | `docs(project): add 20260523 phase 1 status audit` | 上午 10:48 | docs new |
| 2 | `be44701` | `docs(ga4): stabilize link tracking spec for 20260523` | 上午 11:36 | docs modify |
| 3 | `430ecb0` | `docs(admin): add 20260523 overview audit` | 中午 12:32 | docs new |
| 4 | `50a5b24` | `docs(workflow): add 20260523 publishing workflow` | 中午 12:47 | docs new |
| 5 | `e0c87b4` | `docs(design): add 20260523 design token audit` | 下午 13:10 | docs new |
| 6 | `90d81ce` | `docs(admin): mark url linkify audit item completed` | 下午 13:31 | docs modify（audit drift fix）|
| 7 | `f7dd897` | `fix(admin): group source site filter options` | 下午 13:53 | source（Admin A1；單檔 EJS）|
| 8 | `76872a5` | `docs(report): add 20260523 eod summary` | 下午 EOD（pm-4）| docs new（EOD 初版）|
| 9 | `b9b76c6` | `fix(admin): group fb badge filter options` | 下午（pm-5）| source（Admin A2；單檔 EJS）|

### 3.1 Push 狀態

- **已 push origin/main**：✅ 全部 9 commits（含 EOD 初版 + Admin A2）；本次 pm-6 addendum 之 commit 也將 push
- main 與 origin/main 同步（pm-5 落地後）：`b9b76c69d724538fdd69cb18c2f7c81fe7c7ea0f`
- ahead/behind：`0 / 0`（pm-6 commit + push 後重新驗證）

### 3.2 變動類型分布

- `docs(project)`：1（phase-status-20260523）
- `docs(ga4)`：1（spec 固化）
- `docs(admin)`：2（overview audit + drift fix）
- `docs(workflow)`：1（publishing workflow）
- `docs(design)`：1（design token audit）
- `docs(report)`：1（EOD 初版；本次 addendum 為 docs(report) 之第 2 commit）
- `fix(admin)`：2（**唯二** source 變動；皆單檔 `src/views/admin/index.ejs`；A1 +11 行 + A2 +15 行 = 共 26 行）
- **無**：content / settings JSON / build script / template 其他檔 / SCSS / public assets 變動

---

## 4. Docs-only 五大批摘要

### 4.1 `939d97a` — Phase 1 status audit

- 檔案：`docs/phase-status-20260523.md`（+553 行）
- 性質：5/23 Phase 1 完成度 snapshot
- 涵蓋：8 area 完成度 light 驗證 + 補做候選 + Phase 1 邊界明示
- 對齊既有：`20260522-phase-1-done-criteria.md` / `20260522-phase-1-baseline-confirmation.md` / `20260522-eod-report.md`

### 4.2 `be44701` — GA4 link tracking spec 固化

- 檔案：`docs/ga4-link-tracking-spec.md`（+366 / -23）
- 性質：living spec 更新；反映 5/22 多項實作落地後之狀態
- 涵蓋：inline attrs / placement params（top / bottom）/ affiliate top+bottom / related+other 之 GA4 event 與 UTM 規格
- 屬 spec 固化；不重寫，係追補實作後之 spec 對齊

### 4.3 `430ecb0` — Admin overview audit

- 檔案：`docs/admin-overview-audit-20260523.md`（+638 行）
- 性質：Admin overview 5/23 audit + 後續 A/B/C/D 4 系列拆批
- 涵蓋：14 stat-cards / 6 optgroup filter / 10 detail sections / 規模壓力預估 / publishedDate 用途 / FB 回填需求 / 14 stat-card 擴展風險 / 不建議現在做事項
- **後續直接驅動本日下午 pm-2（drift fix）+ pm-3（A1 sourceSite filter）**

### 4.4 `50a5b24` — Publishing workflow snapshot

- 檔案：`docs/publishing-workflow-20260523.md`（+988 行）
- 性質：5/23 publishing workflow 系統級盤點
- 涵蓋：content → build → Blogger（手動貼文）/ GitHub Pages（手動 deploy）→ FB（手動貼文 + 回填）→ backup
- 屬 system-level workflow snapshot；對 cold-start 明日接續最有 onboarding 價值

### 4.5 `e0c87b4` — Design token audit

- 檔案：`docs/design-token-audit-20260523.md`（+559 行）
- 性質：Design System / token / 主色副色 / component style 盤點
- 涵蓋：當前 token landscape + theme overrides + hardcoded color 殘留 + DT-A/B/C 後續批次建議
- 對齊既有：`design-system-ds1-audit.md` / `design-system-ds2-token-naming.md` / `design-system-ds3b-theme-overrides-proposal.md` / `design-system-ds3c-hardcoded-color-pre-analysis.md`

---

## 5. Admin audit drift fix 摘要（pm-2）

### 5.1 背景

- 上午 `430ecb0` admin-overview-audit-20260523.md 初版**誤列 A3 URL linkify 為候選**
- 實際上 URL linkify 已於 2026-05-21 `da00f53 fix(admin): linkify overview URLs` 落地（list URLs 欄 + detail panel Blogger / GitHub channel 共 4 處 URL 皆 `<a target="_blank" rel="noopener noreferrer">`）
- 屬 stale info bug；不阻擋，但會誤導後續 batch 啟動順序

### 5.2 修正內容（commit `90d81ce`；+7 / -6）

- §7.2 Table：A3 標 ✅ **已實作**（含 commit hash + 落地日期）
- §8.2 Should improve soon 列表：第 3 項標刪除線 + ✅ 已實作（4 處 URL linkify）
- §10.1 推薦序 Table：A3 整列標刪除線 + ✅ no-op
- §10.2 推薦今日 / 近期可啟動：最高推薦從 A1+A3 改為 **A1**（A3 跳過；已 landed）

### 5.3 影響

- audit drift 已 closed；後續 A1 落地直接接續，不再受誤列影響
- 對 cold-start 影響：明日讀 audit 時不會誤把已實作項目當候選

---

## 6. Admin A1 source 小修摘要（pm-3）

### 6.1 範圍

- commit：`f7dd897 fix(admin): group source site filter options`
- 檔案：`src/views/admin/index.ejs`（+11 / -0；單檔）
- 對應 audit：`docs/admin-overview-audit-20260523.md` §10.1 A1

### 6.2 修改內容

1. **新增 optgroup**：`<optgroup label="sourceSite (來源)">` 含 2 options（📘 sourceSite: blogger / 🐙 sourceSite: github）
2. **新增 row data attribute**：`data-source-site="<%= p.sourceSite || '' %>"`
3. **新增 matchesFilter case**：`case 'sourceSite': return row.dataset.sourceSite === val;`

### 6.3 邊界遵守

- ✅ 不改 filter 既有 value
- ✅ 不改既有 matchesFilter 6 個 case（只 append 1 新 case）
- ✅ 不改 optgroup 排序（新 optgroup 插在 channel 與 completeness 之間）
- ✅ 不改 loader（`p.sourceSite` 既有；本 phase 只讀）
- ✅ 不改資料格式（無 schema / settings JSON / content / config 變動）
- ✅ emoji 對齊既有 URLs 欄之 📘 / 🐙 convention

### 6.4 驗證

- EJS compile：✅ OK（透過 `ejs.compile` 確認）
- `npm run validate:content`：0 errors / 39 warnings（全為既有 `validation-fixtures/` 既有 intentional 測試案例；與本批無關）
- 無 dist 變動（未 build）
- 無 deploy（未 push gh-pages）

---

## 6B. Admin A2 source 小修摘要（pm-5）

### 6B.1 範圍

- commit：`b9b76c6 fix(admin): group fb badge filter options`
- 檔案：`src/views/admin/index.ejs`（+15 / -0；單檔）
- 對應 audit：`docs/admin-overview-audit-20260523.md` §10.1 A2

### 6B.2 修改內容

1. **新增 optgroup**：`<optgroup label="fbBadge (FB 狀態)">` 含 4 well-known options（FB badge: posted / ready / none / disabled）；values 為 `fbBadge:posted` / `fbBadge:ready` / `fbBadge:none` / `fbBadge:disabled`
2. **新增 row data attribute**：`data-fb-badge="<%= p.fbBadge || '' %>"`
3. **新增 matchesFilter case**：`case 'fbBadge': return row.dataset.fbBadge === val;`

### 6B.3 邊界遵守

- ✅ 不改 filter 既有 value（A1 之 sourceSite 既有 value 完全不動）
- ✅ 不改既有 matchesFilter 既有 case（A1 後 7 個 case 完全不動；只 append 第 8 個新 case `'fbBadge'`）
- ✅ 不改 optgroup 排序（新 fbBadge optgroup 插在 completeness 與 contentKind 之間；理由：completeness 與 fbBadge 同屬「狀態 / 完成度」維度，相鄰提升 UX 連貫性）
- ✅ 不改 loader（`p.fbBadge` / `deriveFbBadge` 既有於 `src/scripts/load-admin-posts.js`；本 phase 只讀）
- ✅ 不改資料格式（無 schema / settings JSON / content / config 變動）
- ✅ 不使用 emoji（與既有 status / channel / completeness / contentKind optgroup options 之 text-only convention 一致；A1 使用 📘/🐙 emoji 是因 URLs 欄已有相同 emoji precedent，fbBadge 無對應 precedent 故不引入新 emoji）
- ⚠️ passthrough status values（draft / archived 等）user 仍可透過 search 或 completeness filter 觸及；本批不展開以維持 A2 zero-cost scope

### 6B.4 驗證

- EJS compile：✅ OK（透過 `ejs.compile` 確認）
- 不跑 `npm run build`（Admin 屬 dev-mode-only / Plan B / prod build 跳過）
- 不跑 `validate:content`（本批不動 content；pm-5 phase 之邊界已限制）
- 無 dist 變動（未 build）
- 無 deploy（未 push gh-pages）

---

## 7. 今日未動項目

per 本日所有 phases 之邊界遵守：

| 區塊 | 狀態 |
|---|---|
| **Blogger 後台** | ❌ 完全未動（手動發布 / 後台貼文 / Blogger CSS 無新動作）|
| **gh-pages branch / deploy repo** | ❌ 完全未動（無 deploy；無 dist push）|
| **dist / dist-blogger / dist-promotion / dist-reports** | ❌ 完全未動（無 build；當前 dist 為 5/21 production state）|
| **content/**（Markdown / .fb.md / .publish.json / settings JSON）| ❌ 完全未動 |
| **settings JSON**（site / themes / categories / tags / ads / promotion / link-rules / seo / ga4）| ❌ 完全未動 |
| **build scripts**（`src/scripts/`）| ❌ 完全未動 |
| **template 其他檔案**（src/views/{layout,pages,blogger,promotion,design-system,seo,tracking,ads}/）| ❌ 完全未動 |
| **SCSS**（src/styles/）| ❌ 完全未動 |
| **JS modules**（src/js/）| ❌ 完全未動 |
| **public/**（images / icons / downloads / favicon）| ❌ 完全未動 |
| **package.json / vite.config.js / .gitignore** | ❌ 完全未動 |
| **.claude/** | ❌ 不重新建立（per 既有 ignore policy）|

→ **唯二 source 變動**：皆於同檔 `src/views/admin/index.ejs`：
  - Admin A1 sourceSite filter（+11 行；commit `f7dd897`；pm-3）
  - Admin A2 fbBadge filter（+15 行；commit `b9b76c6`；pm-5）
  - 累積 +26 行；皆 dev-mode-only Admin EJS；不進入 prod build / 不進入 dist；對線上 production 零影響。

---

## 8. Final Baseline

### 8.1 Source repo（本機 = origin/main）

| 項目 | 值 |
|---|---|
| **HEAD**（pm-6 addendum 之 commit 落地前）| `b9b76c6 fix(admin): group fb badge filter options`（pm-5 結果；本次 addendum commit + push 後將變動）|
| **HEAD**（pm-6 addendum 之 commit 落地後預期）| 本次 addendum 之新 commit hash（pm-6 commit + push 後將 supersede `b9b76c6`）|
| **working tree** | pm-5 後驗證 clean；pm-6 addendum 落地 + push 後預期重新 clean |
| **branch tracking** | `main` → `[origin/main]`；ahead 0 / behind 0（pm-5 後驗證；pm-6 push 後再驗證）|
| **是否 push remote** | ✅ **全部 9 commits 已 push**（pm-3 / pm-4 / pm-5 皆已分別 push）；pm-6 addendum 之 commit 將為第 10 push |

### 8.2 Deploy repo / gh-pages

| 項目 | 值 |
|---|---|
| **gh-pages branch** | 自 5/21 pm-45 起未動；本日完全未動 |
| **deploy repo HEAD** | `f32f7d3 deploy: 09b9a67 snapshot (GA4 enabled)`（per `20260522-eod-report.md` §8.2；本日無 deploy）|
| **是否 deploy** | ❌ **未 deploy**（本日唯一 source 變動 = Admin EJS；Admin 屬 dev-mode-only / Plan B / prod build 跳過；不進入 dist；對線上 production 零影響）|

### 8.3 Build / Validate

| 項目 | 值 |
|---|---|
| **是否跑 build** | ❌ 未跑（pm-3 / pm-5 皆只跑 `ejs.compile` syntax check；pm-3 額外跑 `validate:content` 一次）|
| **是否跑 validate** | 🟡 跑過一次（pm-3 中；0 errors / 39 warnings 全為既有 fixtures；與本批無關）；pm-5 / pm-6 皆未跑 |
| **最後一次 production build** | 5/21 pm-43（per `20260522-eod-report.md` §8.3；本日未更新）|

### 8.4 線上 production state

- GitHub Pages 線上服務內容對應 deploy `f32f7d3`（自 5/21 pm-45 起未動）
- GA4 production：✅ live（自 5/21 pm-46 驗收通過後持續）
- 線上 sitemap.xml：14 url entries（per 5/21 build）
- 線上 robots.txt：含 Disallow + Sitemap
- **5/23 全日變更（5 docs + 1 audit drift + 2 Admin source 小修 + 1 EOD doc + 1 EOD addendum）對線上 production 完全無影響**（Admin 屬 dev-mode-only / Plan B / prod build 跳過）

---

## 9. 明日可接續候選

**僅列；不啟動**：

### ~~A. Admin A2 fbBadge filter optgroup~~ ✅ 已於 pm-5 落地（commit `b9b76c6`；非明日候選）

- ~~原列為明日第一順位候選；於 EOD 初版（pm-4 / `76872a5`）落地後接續啟動 pm-5 並完成~~
- 詳見本文件 §6B（Admin A2 source 小修摘要）
- 本批 pm-6 addendum 後，明日第一順位候選改為 **B. DT-A1 / DT-A2（Design token 小修系列）**

### B. ~~DT-A1 / DT-A2（Design token 小修系列）~~ ✅ **已於 5/23 pm-7 收斂**

> **後加註（20260523-pm-8-dt-audit-sync-a）**：本候選 B 已於同日 pm-7-dt-a2-polish-a 部分收斂。
> - **DT-A1**：偵察確認 stale / no-op（既有 `.mono` + `.detail-grid dd` 已具備 `word-break: break-all`；無 source 修改）
> - **DT-A2**：落地 commit `0f71d6e`（GitHub source `_hashtag.scss` + Blogger mirror `_blogger-components-rules.scss` 同步；+2 行 / 2 檔）
> - **Blogger 後台 CSS 重貼**：屬後續可選工作；本批未 `build:blogger-theme`；user 自決時機
>
> 以下原候選描述保留作歷史參考：

- **scope**（per `design-token-audit-20260523.md` DT-A 系列）：
  - **DT-A1**：Admin overview 長 URL word-break polish（避免 mono cell 撐爆畫面）
  - **DT-A2**：hashtag long-text wrap polish（避免單一長 hashtag 撐爆 badge container）
- **時間**：~30 min per 子修；可單批合做
- **變動**：`src/views/admin/index.ejs`（inline `<style>` 區塊）+ `src/styles/components/_hashtag.scss`
- **風險**：🟢 低（純 CSS）
- **理由**：屬 polish；不阻擋任何其他 batch

### C. Reverse UTM step 1（Blogger → GitHub）

- **scope**（per `blogger-to-github-reverse-utm-plan.md`）：
  - step 1：Blogger templates 端對 GitHub Pages 連結之 UTM / target / rel 自動處理規則設計
  - 屬 docs-only step；後續 step 2 才是 source implementation
- **時間**：~1-2h docs work
- **風險**：🟢 低（docs-only step）

### D. Custom domain prep

- **scope**：per `docs/custom-domain-root-files-strategy.md` §4 preflight
- **阻擋**：依賴 user 取得 domain + DNS provider access
- **風險**：🟡 中（涉 DNS / GitHub Pages settings / TLS）

### E. SEO polish（GitHub Pages）

- **scope**：meta tag tweaks / JSON-LD 細化 / OG image fallback
- **時間**：~1-2h
- **風險**：🟢 低

### F. Admin write flow（FB-P5-c / Admin-2-b-2）

- **scope**：per `fb-sidecar-write-preflight-decision.md` §7
- **阻擋**：user 8+6 項 preflight checklist 未勾
- **風險**：🟡 中（high-sensitivity write surface）

### G. Content expansion（新文章）

- **scope**：依日常內容創作節奏；無工程阻擋
- **變動**：`content/{github,blogger}/posts/*.md` + 對應 `.publish.json` / `.fb.md`
- **風險**：🟢 低（內容創作；不動 schema / build / settings）

### H. GA4 click event implementation（Phase 2 batch）

- **scope**：per `pm-phase-2-batch-plan.md` §5 / `ga4-link-tracking-spec.md`
- **時間**：~1h per source batch
- **風險**：🟡 需 build / validate / deploy 驗收（屬 first non-Admin source batch）

---

## 10. 明日建議優先順序

### 10.1 ~~推薦明日 第一個候選：**B. DT-A1 / DT-A2（Design token 小修系列）**~~ ✅ **已於 5/23 pm-7 收斂**（per pm-8-dt-audit-sync-a 補記）

**實際結果**（pm-7 同日落地）：DT-A1 偵察 stale；DT-A2 落地 commit `0f71d6e`；Blogger 後台 CSS 重貼 deferred 為後續可選。下一順位候選改為 **C. Reverse UTM step 1 docs**（per §10.2）。

**~~原推薦理由~~**（保留作歷史參考）：

- 🟢 風險低（純 CSS / inline style；零 loader / 零 schema / 零 settings JSON 變動）
- 對齊 `design-token-audit-20260523.md` 之 DT-A 高優先序
- 預估 ~30 min per 子修；可單批合做
- 不阻擋 C-H 任一其他批
- 完成後 Admin 系列（A1 / A2 + DT-A1 / A2）形成「Admin polish 收斂段」之自然結束

### 10.2 推薦第二：**C. Reverse UTM step 1 docs（Blogger → GitHub）**

**理由**：

- 📄 純 docs-only step；零 source / settings 變動
- 對齊 `blogger-to-github-reverse-utm-plan.md`；屬規則設計階段
- 後續 step 2 為 source implementation；本步驟先收斂規則
- 不阻擋任何其他批

### 10.3 更保守備選

若 user 希望再退一步：**先繼續 docs-only**（如 phase-2-candidate-roadmap.md 對齊 5/23 docs / README §7 baseline drift 補正）→ 零 source 變動 → 確認累積資訊一致後再啟動 B / DT polish。

### 10.4 不建議明日立即啟動

- ❌ F（Admin write flow）：阻擋於 user 8+6 項 preflight；不在當前推進序
- ❌ H（GA4 click event implementation）：屬 first non-Admin source batch；需 build / validate / deploy；不適合作為明日第一批
- ❌ 大規模 Phase 2 重構：本日已收尾；明日宜延續 polish / 小修 / docs 系列

---

## 11. Freeze Note

### 11.1 本批落地後預期狀態

- 本批 EOD doc commit 後，HEAD 將變為新 commit；main 與 origin/main 在 push 後再次同步
- 預期 working tree 重新 clean
- 預期 ahead / behind 重新 0 / 0

### 11.2 Cold-start 明日 onboarding 順序建議

1. 讀 `docs/20260523-eod-report.md`（本文件；含 pm-6 addendum + pm-8 補記）— 5 min 掌握今日全貌（注意：Admin A1 + A2 + DT-A2 皆已落地；DT-A1 stale；下一順位候選改為 **C. Reverse UTM step 1 docs** 或其他）
2. 讀 `docs/design-token-audit-20260523.md` 之 DT-A 段落 — 確認 DT-A1 stale 與 DT-A2 落地細節（含 commit `0f71d6e`）
3. 讀 `docs/phase-status-20260523.md` — 確認 Phase 1 整體 baseline
4. 若繼續 DT 系列：**DT-A3**（Admin stat-card density）為下一推薦；reference 仍為 `src/views/admin/index.ejs` 之 inline `<style>` 區塊

### 11.3 確認無 dirty / untracked

- 本批 EOD doc 落地後預期 `git status` clean
- 無任何意外 dirty 檔案
- `.claude/` 不重新建立

---

## 12. Cross-links

### 12.1 今日新增 / 修改 docs

- `docs/phase-status-20260523.md`（day-1-batch-1；`939d97a`）
- `docs/ga4-link-tracking-spec.md`（day-1-batch-2；`be44701`；spec 固化更新）
- `docs/admin-overview-audit-20260523.md`（day-1-batch-3；`430ecb0`；+ pm-2 drift fix `90d81ce`）
- `docs/publishing-workflow-20260523.md`（day-1-batch-4；`50a5b24`）
- `docs/design-token-audit-20260523.md`（day-1-batch-5；`e0c87b4`）
- `docs/20260523-eod-report.md`（本文件；pm-4 初版 `76872a5` + pm-6 addendum 本次補記）

### 12.2 今日 source 變動（共 2 個 commits；皆同檔）

- `src/views/admin/index.ejs`（pm-3；`f7dd897`；+11 行；Admin A1 sourceSite filter optgroup）
- `src/views/admin/index.ejs`（pm-5；`b9b76c6`；+15 行；Admin A2 fbBadge filter optgroup）

### 12.3 上層 / 對齊 docs

- `docs/20260522-eod-report.md`（昨日 EOD；本文件結構對齊）
- `docs/20260522-phase-1-done-criteria.md`（Phase 1 驗收口徑；5/23 audit 之 baseline）
- `docs/20260521-end-of-day-report.md`（5/21 EOD；GA4 production enable + Admin platform routing extension）
- `README.md`（baseline drift 屬已知；本批不處理）
- `CLAUDE.md` §28 / §29 / §30（規範來源）

### 12.4 明日候選對應 docs

- ~~A：`docs/admin-overview-audit-20260523.md` §10.1 A2~~ ✅ 已於 pm-5 落地（`b9b76c6`）；非明日候選
- ~~**B**：`docs/design-token-audit-20260523.md` DT-A1 / DT-A2（pm-6 addendum 後升為明日第一候選）~~ ✅ **已於 5/23 pm-7 收斂**（DT-A1 stale；DT-A2 commit `0f71d6e`；per pm-8-dt-audit-sync-a 補記）
- C：`docs/blogger-to-github-reverse-utm-plan.md`
- D：`docs/custom-domain-root-files-strategy.md`
- E：（無單一專屬 doc；散見於 `docs/seo-ga4-adsense.md` 等）
- F：`docs/fb-sidecar-write-preflight-decision.md` §7
- G：（無工程 doc 阻擋；user 直接於 VS Code 創作）
- H：`docs/20260522-pm-phase-2-batch-plan.md` §5 / `docs/ga4-link-tracking-spec.md`

---

## 13. Afternoon Progress（pm-7 ~ pm-17）— Addendum

本節為 EOD 初版（pm-4 `76872a5`）+ EOD addendum（pm-6）+ pm-8 部分前段 sync 後之**下午段追加成果補記**；屬 docs-only；單批落地（pm-18）；採 append-only；**不變動** §1-§12 既有結構與內容。

### 13.1 概覽

下午段（pm-7 起）原預期接續 admin-polish 收斂 + design token 小修；實際進度遠超 EOD 初版之「明日候選」估計：

- **8 個追加 batches 全部落地**（5 docs-only + 3 source 小修）
- **Admin overview A 系列 A1-A7 完整收斂**（A1 / A2 / A7 ✅ 落地 + A3 stale + A4 essentially done + A5 / A6 stale no-op）
- **B 系列首個非阻擋候選 B4 落地**（fbPostedAt sort option）
- **Design Token DT-A 系列收斂**（DT-A1 stale + DT-A2 落地）
- **未動**：deploy / gh-pages / Blogger 後台 / Blogger theme CSS 重貼 / loader / schema / content / `.fb.md` / settings JSON / build scripts / public assets；SCSS 例外為 pm-7 之 `_hashtag.scss` + Blogger mirror partial 2 檔（同步 +2 行 / 檔）

### 13.2 8 個下午追加 batches 一覽

| # | Phase | commit | 性質 | 範圍 |
|---|---|---|---|---|
| 1 | `20260523-pm-7-dt-a2-polish-a` | `0f71d6e` | **source small fix** | `src/styles/components/_hashtag.scss` + `src/styles/blogger/_blogger-components-rules.scss` mirror 同步；`.lab-hashtag` 加 `max-width: 100%` + `overflow-wrap: anywhere`；長字串防爆版 |
| 2 | `20260523-pm-8-dt-audit-sync-a` | `14f861e` | docs-only | DT-A1 stale / DT-A2 completed 同步至 `design-token-audit-20260523.md` + 本 EOD report 部分前段（§9 / §10.1 / §11.2 / §12.4） |
| 3 | `20260523-pm-10-admin-empty-filter-state-a` | `53bf60c` | **source small fix** | `src/views/admin/index.ejs` +13 行：filter / search 後 matchedCount === 0 之 fallback message；reuse 既有 `.empty` class；無 inline style |
| 4 | `20260523-pm-11-admin-audit-sync-a` | `b30f70b` | docs-only | A7 completed 同步至 `admin-overview-audit-20260523.md`（§7.2 / §8.2 / §10.1 / §10.4 共 4 處） |
| 5 | `20260523-pm-12-admin-a1-a2-audit-sync-a` | `16bc610` | docs-only | A1 / A2 pre-existing drift completed 同步（§3.2 / §8.2 / §10.1 / §10.2 / §10.4 共 7 處） |
| 6 | `20260523-pm-14-admin-a4-a6-audit-sync-a` | `c7522e2` | docs-only | A4 essentially done + A5 / A6 stale no-op；**Admin A 系列全收斂**（§7.2 / §8.2 / §10.1 / §10.2 / §10.4 共 9 處） |
| 7 | `20260523-pm-16-admin-fbpostedat-sort-a` | `2df85e2` | **source small fix** | `src/views/admin/index.ejs` +7 行：B4 fbPostedAt desc sort option + `data-fb-posted-at` row attr + applySort case |
| 8 | `20260523-pm-17-admin-b4-audit-sync-a` | `46ae0e9` | docs-only | B4 completed 同步（§5.3 / §8.3 / §10.1 / §10.2 / §10.4 共 5 處） |

註：未列 pm-9 / pm-13 / pm-15（皆為 read-only audit；無 commit；提供下午批次選擇之依據）。

### 13.3 統計

- **下午 commits**：8（3 source + 5 docs-only）
- **下午 pushes**：8（每 commit 落地後 user 明示 push origin/main；皆 fast-forward；無 force / rebase / amend）
- **下午 read-only audit phases**：3（pm-9 Admin usability / pm-13 A4-A6 / pm-15 B-series；無 commit）
- **下午 build runs**：3（pm-7 / pm-10 / pm-16 之 source batch；皆 pass；無 regression；皆驗證 EJS compile / SCSS bundle 正常）
- **下午 validate:content runs**：1（pm-7；`0 error / 39 warnings / 34 posts` 與 baseline 一致）
- **下午 deploy runs**：❌ 0
- **下午 Blogger 後台動作**：❌ 0
- **下午 Blogger theme CSS 重產 / 重貼**：❌ 0（pm-7 之 source 已 push origin/main；Blogger 後台 CSS 重貼 user 自決時機）

### 13.4 source 變動範圍（下午累計 +20 行 / 3 檔）

| 檔案 | 行數累計 | 觸及 Phases |
|---|---|---|
| `src/views/admin/index.ejs` | +20 行（pm-10 +13 + pm-16 +7） | pm-10 / pm-16 |
| `src/styles/components/_hashtag.scss` | +1 char on 1 line（property additive） | pm-7 |
| `src/styles/blogger/_blogger-components-rules.scss` | +1 char on 1 line（Blogger mirror sync） | pm-7 |

合 EOD 初版前（pm-3 `f7dd897` +11 行 + pm-5 `b9b76c6` +15 行 = 26 行）+ 下午（+20 行 / 3 檔）= **全日 source 累計 5 commits / 4 檔 / +46 行**。

### 13.5 docs 變動範圍（下午 5 commits）

| 檔案 | 主要更新 phases |
|---|---|
| `docs/admin-overview-audit-20260523.md` | pm-11 / pm-12 / pm-14 / pm-17（4 次 sync；累計覆蓋 A1-A7 + B4 status markers）|
| `docs/design-token-audit-20260523.md` | pm-8（DT-A1 / DT-A2 status sync）|
| `docs/20260523-eod-report.md` | pm-8（部分前段 sync）+ pm-18 本批（afternoon progress addendum）|

### 13.6 仍待 user 表態 / 後續處理

| 項目 | 狀態 |
|---|---|
| **Blogger 後台 CSS 重貼** | 🟡 **後續可選**；pm-7 之 source 已 push origin/main；user 自決重貼時機；可整合於下次 DT-B / DS-3-b-blogger-entry 批次 |
| **Admin B1**（FB posted ok stat-card）| 🟡 待 user 確認與既有 `fb published ok` 之語意區別 |
| **Admin B2**（affiliate enabled stat-card）| 🟡 待 user 確認展示需求；loader 需 +1 derived field `affiliateEnabled` |
| **Admin B3**（Missing Blogger URL / Missing GitHub URL 拆分 stat-card）| 🟡 待 user 確認 14→16 stat-card 展示密度 |
| **Admin B5**（Sort indicator ↑↓ icon）| 🟡 可啟動但屬純視覺 polish；既有 sort label 已含 asc/desc 文字；邊際價值低 |
| **Admin B6**（Relative time `5 days ago` 顯示）| 🟡 待 user 確認顯示格式（替換 vs 並排 absolute + relative） |
| **Admin C 系列**（tag 多選 filter / per-row action links / numeric pagination）| 🟡 屬 Phase 2 候選；當前無觸發需求 |
| **Admin D 系列**（FB write FB-P5-c-a / -c-b / Admin-2-b-2 SEO write / P5-e new sidecar）| 🔴 blocked；需 user 勾 8+6 項 preflight |
| **Admin A5 延伸**（7 個無 tooltip stat-card 補充）| 🔵 audit scope 外；optional future enhancement |

### 13.7 §8 Final Baseline 更新（pm-18 補記後）

| 項目 | 值 |
|---|---|
| **HEAD**（pm-18 commit 前）| `46ae0e9 docs(admin): sync b4 fbpostedat sort audit status`（pm-17 結果）|
| **HEAD**（pm-18 commit + push 後預期）| 本批 addendum 之新 commit hash（pm-18 commit + push 後將 supersede `46ae0e9`）|
| **branch tracking** | `main` → `[origin/main]`；ahead 0 / behind 0（pm-17 push 後驗證；pm-18 commit + push 後再驗證）|
| **working tree** | pm-17 push 後 clean；pm-18 addendum commit + push 後預期重新 clean |
| **下午 deploy / gh-pages 動作** | ❌ 0 |
| **下午 Blogger 後台動作** | ❌ 0 |
| **dist 狀態** | 本機 `dist/` 自 pm-16 build 後未重產；未推上線 |
| **dist-blogger 狀態** | 自 5/21 起未動 |
| **下午之線上 production impact** | ❌ **零**（Admin 屬 dev-mode-only / Plan B / prod build 跳過；DT-A2 `_hashtag.scss` 源已 push 但未 deploy；Blogger mirror 同步亦未重產 / 重貼後台 CSS）|

### 13.8 對 §9 / §10「明日候選」之效應

| 候選 | EOD 初版預估 | 下午實際 |
|---|---|---|
| ~~A. Admin A2 fbBadge filter~~ | ✅ 落地 pm-5（已記載於 §6B） | — |
| ~~B. DT-A1 / DT-A2~~ | EOD 初版列為明日第一 | ✅ 落地 pm-7（per pm-8 sync）|
| C. Reverse UTM step 1 docs | 第二推薦 | 🟡 未啟動；保留為後續候選 |
| D. Custom domain prep | 等 user DNS access | 🟡 未啟動；阻擋未解 |
| E. SEO polish | 第三候選 | 🟡 未啟動 |
| F. Admin write FB-P5-c | blocked（user 8+6 項 preflight）| 🟡 仍 blocked |
| G. Content expansion | 無工程阻擋 | 🟡 未啟動 |
| H. GA4 click event implementation | first non-Admin source batch | 🟡 未啟動 |

**下午實際走向**：超越 EOD 初版預估之 B（DT 系列），延伸至 Admin polish 連續 9 個 batches（pm-7 DT-A2 source + pm-8 docs sync + pm-9 audit + pm-10 source + pm-11 sync + pm-12 sync + pm-13 audit + pm-14 sync + pm-15 audit + pm-16 source + pm-17 sync），完整收斂 Admin A1-A7 + B4。

### 13.9 明日候選收斂後新狀態（pm-18 補記後）

| 候選 | 狀態 |
|---|---|
| ~~A. Admin A2~~ | ✅ 已落地 pm-5 |
| ~~B. DT-A1 / DT-A2~~ | ✅ 已落地 pm-7 |
| **C. Reverse UTM step 1 docs** | 🟡 未啟動；推薦明日第一候選（保守 docs-only step） |
| D. Custom domain prep | 🟡 阻擋於 user DNS |
| E. SEO polish | 🟡 未啟動 |
| F. Admin write FB-P5-c / Admin-2-b-2 | 🔴 blocked |
| G. Content expansion | 🟡 user 自由創作 |
| H. GA4 click event implementation | 🟡 first non-Admin source batch；屬 Phase 2 |
| **新增**：Admin B5（Sort indicator）| 🟡 純視覺 polish；邊際價值低 |
| **新增**：Admin B6（Relative time）| 🟡 待 user 確認顯示格式 |
| **新增**：Admin B1 / B2 / B3（stat-card 擴展）| 🟡 待 user 表態語意 + 展示密度 |
| **新增**：Blogger 後台 CSS 重貼（per pm-7 mirror sync）| 🟡 user 自決時機；可整合於 DT-B / DS-3-b-blogger-entry |

### 13.10 Cold-start 明日 onboarding 順序建議（pm-18 補記後）

1. 讀 `docs/20260523-eod-report.md`（本文件；含 pm-6 addendum + pm-8 partial sync + **pm-18 afternoon progress addendum**）— ~10 min 掌握全日 18 個 phases（含 8 個下午追加 batches）
2. 讀 `docs/admin-overview-audit-20260523.md` — 確認 Admin A1-A7 全收斂 + B4 完成；B1 / B2 / B3 / B5 / B6 待表態
3. 讀 `docs/design-token-audit-20260523.md` — 確認 DT-A1 / DT-A2 收斂；DT-B / DT-C 候選保留
4. 若選 C：讀 `docs/blogger-to-github-reverse-utm-plan.md` 啟動 Reverse UTM step 1 docs

### 13.11 邊界遵守

per 本批 pm-18 addendum 之邊界：

- ✅ 不修改 §1-§12 既有結構與內容（採 append-only 補入新 §13）
- ✅ 不重寫敘事 / 不變動既有 commits 描述
- ✅ 純 docs-only；零 src / content / settings / scripts / dist / dist-blogger 變動
- ✅ 不 build / 不 validate / 不 deploy / 不 push gh-pages
- ✅ 不碰 Blogger 後台 / 不重產 Blogger theme CSS
- ✅ 不碰 `.claude/`

### 13.12 後續批次補記（pm-19 / pm-20 / pm-21）

本子節為 pm-18 addendum 落地（commit `e874acc`；push 後 origin/main = `e874acc`）之後新增；屬 pm-21 batch（本批）；補記 pm-19 / pm-20 之 B5 sort indicator 處理。

#### 13.12.1 pm-19：read-only Admin B5 sort indicator 偵察

| 項目 | 值 |
|---|---|
| Phase | `20260523-pm-19-admin-b5-sort-indicator-readonly-a` |
| 性質 | read-only audit；無 commit |
| 偵察結論 | B5 sort indicator polish **不建議目前做 source change** |
| 主要依據 | 既有 4 個 sort label 已含明文 `desc` / `asc`（publishedAt desc / updatedAt desc / title asc / fbPostedAt desc）；替換為 ↑↓ 可能 downgrade accessibility；追加 ↑↓ 造成資訊冗餘與視覺噪音；ROI 邊際價值低 |
| 提出之 3 候選 | A 執行 source polish（不推薦）/ B 標記為 no-op / low priority 之 docs sync（**推薦並由 pm-20 執行**）/ C 暫不做 |

#### 13.12.2 pm-20：Admin B5 audit sync（B 候選落地）

| 項目 | 值 |
|---|---|
| Phase | `20260523-pm-20-admin-b5-audit-sync-a` |
| Commit | `b59a004 docs(admin): mark b5 sort indicator optional` |
| 性質 | docs-only |
| 修改檔 | `docs/admin-overview-audit-20260523.md`（+5 / -5）|
| 內容 | 5 處 in-place 替換（§7.2 / §8.3 row #6 / §10.1 B5 / §10.2 / §10.4 dependency table）皆標 🟡 **low priority / optional**；B5 阻擋欄改 `optional`；B5 從「候選 / 待 user 表態」reclassified 為 low priority |
| 未動之 audit references | B1 / B2 / B3 / B6 references 全部保留；仍標「待 user 表態」 |

#### 13.12.3 累計 Final Baseline 更新（pm-20 push 後 → pm-21 補記）

| 項目 | 值 |
|---|---|
| **HEAD**（pm-20 push 後）| `b59a004 docs(admin): mark b5 sort indicator optional` |
| **HEAD**（pm-21 commit + push 後預期）| 本批 mini addendum 之新 commit hash（pm-21 commit + push 後將 supersede `b59a004`）|
| **branch tracking** | `main` → `[origin/main]`；ahead 0 / behind 0（pm-20 push 後驗證；pm-21 commit + push 後再驗證）|
| **working tree** | pm-20 push 後 clean；pm-21 mini addendum commit + push 後預期重新 clean |
| **下午累計 commits**（含 pm-21 前）| **10**：pm-7 / pm-8 / pm-10 / pm-11 / pm-12 / pm-14 / pm-16 / pm-17 / pm-18 / pm-20（pm-9 / pm-13 / pm-15 / pm-19 為 read-only 無 commit）|
| **下午累計 pushes** | 10（皆 fast-forward；無 force / rebase / amend）|
| **下午 source commits** | 3（pm-7 / pm-10 / pm-16）|
| **下午 docs-only commits** | 7（pm-8 / pm-11 / pm-12 / pm-14 / pm-17 / pm-18 / pm-20）|
| **下午 read-only audit phases** | 4（pm-9 / pm-13 / pm-15 / pm-19；無 commit）|
| **下午 deploy** | ❌ 0 |
| **下午 gh-pages 動作** | ❌ 0 |
| **下午 Blogger 後台動作** | ❌ 0 |
| **下午 Blogger theme CSS 重產 / 重貼** | ❌ 0 |
| **下午 production impact** | ❌ 零（Admin 屬 dev-mode-only / Plan B / prod build 跳過；DT-A2 mirror source 已 push 但未 deploy / 未重貼）|

#### 13.12.4 Admin overview B 系列狀態（pm-20 後）

| 候選 | 狀態（pm-20 後）|
|---|---|
| **A1-A7** | ✅ 全收斂（per pm-14 sync）|
| **B4** | ✅ 落地（per pm-16 source + pm-17 sync）|
| **B5** | 🟡 **low priority / optional**（per pm-20 sync；非 completed；非 candidate；不建議目前做 source polish）|
| **B1 / B2 / B3 / B6** | 🟡 仍待 user 表態 |
| **C 系列**（tag 多選 / per-row action / pagination）| 🟡 屬 Phase 2 |
| **D 系列**（FB write / SEO write / new sidecar）| 🔴 blocked（user 8+6 項 preflight 未勾）|
| **Blogger 後台 CSS 重貼**（per pm-7 mirror sync）| 🟡 後續可選；user 自決時機 |

#### 13.12.5 邊界遵守（pm-19 / pm-20 / pm-21）

- ✅ pm-19：read-only；零修改 / 零 commit
- ✅ pm-20：docs-only；單檔 `docs/admin-overview-audit-20260523.md` +5 / -5；已 commit + push
- ✅ pm-21（本批）：docs-only；單檔 `docs/20260523-eod-report.md`；採 append-only 補入 §13.12；待 commit + push
- ✅ 三批皆 不 build / 不 validate / 不 deploy / 不 push gh-pages
- ✅ 三批皆 不碰 Blogger 後台 / 不重產 Blogger theme CSS / 不重貼 Blogger CSS
- ✅ 三批皆 不碰 `.claude/` / `src/` / `content/` / `dist/` / `dist-blogger/` / `dist-promotion/` / `settings JSON` / `scripts`

---

（本文件結束）
