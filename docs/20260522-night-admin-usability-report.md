# 20260522 Night Admin Usability Report

本文件記錄 **2026-05-22 night session** 之 Admin usability small fixes 5 commits 驗收 / 交接內容；屬 docs-only；本批 phase `20260522-night-6` **不**修改任何 source / template / settings / build / deploy；**不**啟動 Admin / GA4 / custom domain 任何後續實作。

對應上層：
- `docs/20260522-eod-report.md`（5/22 day session 收尾 EOD；本文件補上 night session 段）
- `docs/20260522-pm-phase-2-batch-plan.md`（Phase 2 batch plan；今晚 fixes 屬其 §4 順序 #3-#5 之 Admin usability 範疇）
- `docs/20260522-day-1-readonly-a-report.md` §4 #1（Admin usability small fixes 候選）

---

## 1. Purpose

### 1.1 本文件用途

- 記錄 **2026-05-22 night session** 之 **Admin usability small fixes** 5 個 commits 之驗收 / 交接內容
- 提供明日（或之後）**本機手動 QA** 之 checklist（per §6）
- 明示 night session 之 **Known Limits**（per §7）+ **Freeze State**（per §9）

### 1.2 本文件**不是**

- ❌ **不是新 spec**（規格屬 `docs/20260522-pm-phase-2-batch-plan.md` / day-2-d analysis）
- ❌ **不是 roadmap**（候選路線屬 `docs/phase-2-candidate-roadmap.md`）
- ❌ **不啟動**任何 Admin functional 改動 / GA4 implementation / Admin write flow / custom domain
- ❌ **不取代** `docs/20260522-eod-report.md`（day session EOD）

### 1.3 本文件定位

**驗收 / 交接 doc**：今晚 Admin 小修系列之**單一可勾選 checklist** + freeze state；屬 night session 收尾紀錄。

---

## 2. Summary

### 2.1 完成項目

✅ **5 個 Admin small fixes** 全套落地並 push 至 `origin/main`：

| # | 主題 | commit |
|---|---|---|
| A | Summary stats 補 2 missing direct count | `0814c05` |
| B | Default recent N = 30 + show-all toggle 重用 | `2597f44` |
| C | Category / Series filter | `8f23b9c` |
| D | Sort dropdown（3 選項）| `884437c` |
| E | Missing metadata warning banner | `745c48d` |

### 2.2 範圍邊界

- ✅ 範圍僅 `src/views/admin/index.ejs`（單一檔案；跨 5 commits 累計 +124 / -9）
- ✅ **不影響** production GitHub Pages output（admin/index.ejs 為 **dev-mode-only**；per `docs/admin-1-completion-report.md` Plan B）
- ✅ **不涉及** Admin write / save flow（仍 read-only / dry-run；per `docs/fb-sidecar-write-preflight-decision.md` §7 未啟動）
- ✅ **不涉及** content / schema / loader / GA4 / build script / production template / deploy repo 任何改動

---

## 3. Completed Admin Fixes

### A. Summary stats（commit `0814c05`；night-3-a）

✅ 補 2 個 missing direct count（避免從 OK 數反推）：

- **Missing FB URL** = `total - fbPublishedOk`
- **Missing Output URL** = `total - urlOk`

採 subtraction approach（per night-3-a §4.1 spec primary instruction）；無新 forEach counter；無 loader 改動。Tooltip 明示「不等於 FB enabled / Blogger/GitHub enabled 數」避免混淆。

### B. Default recent N = 30（commit `2597f44`；night-3-b）

✅ 將既有 `SHOW_LIMIT` 從 20 → **30**；完全重用 Phase 20260520-b-4 既有 show-all toggle 架構。

新增 `isFilterActive` 邏輯：
- ✅ **search / filter active 時不被 SHOW_LIMIT 截斷**（per night-3-b spec 「最小可行做法」）
- ✅ **show-all toggle 在 search/filter active 時自動隱藏**（已全顯；無需 toggle）
- ✅ 取消 filter 時恢復 default recent 30 + show-all toggle 邏輯

### C. Category / Series filter（commit `8f23b9c`；night-3-c）

✅ 兩個 filter optgroup 動態派生：

- **Category filter**：來源**posts 中實際出現之 `p.category` 值**（既存於 loader）；options 動態生成；命中對應 `data-category="<slug>"`
- **Series filter**：架構就位（含 `data-series` attr + matchesFilter() case + optgroup template）；**但目前無 series data 不顯示**（per §7 known limits；loader 未處理 series；series.json 為空；無 frontmatter `series:`）

兩 filter 完全整合 night-3-b 之 `isFilterActive` 邏輯。

### D. Sort dropdown（commit `884437c`；night-3-d）

✅ 3 個 sort options（per spec）：

- **publishedAt desc**（default；對齊 loader 初始排序）
- **updatedAt desc**（updatedAt 缺值 fallback to publishedAt；EJS render 端已 fallback）
- **title asc**（localeCompare；無 NaN / Invalid Date 風險）

實作細節：
- ✅ `applySort()` 客戶端 JS：reorder DOM pairs（row + detail）+ reassign rows/details arrays + 觸發 `applyFilters()` 重套
- ✅ **Click listener refactor** 為 `rowDetail` by reference closure（解決 reorder 後 closured index 失效問題）
- ✅ 不破壞 search / filter / SHOW_LIMIT / show-all toggle / detail panel

### E. Missing metadata warning banner（commit `745c48d`；night-3-e）

✅ Detail panel 內部顯示該文章之 missing metadata warning：

- **位置**：detail panel `<td>` 內部開頭；展開 row 即見
- **顯示條件**：`missingList.length > 0` 才渲染（per spec「無缺漏時不顯示，避免畫面太吵」）
- **涵蓋 7 completeness fields**（per row markup 既有；含 spec 例 5 + blogger/github config 兩補）：
  - `seo` → "SEO"
  - `fb` → "FB metadata"
  - `blogger` → "Blogger config"
  - `github` → "GitHub config"
  - `url` → "Output URL"
  - `categoryTags` → "Category / Tags"
  - `fbPublished` → "FB Published URL"
- **UI**：inline style；對齊既有 `.dry-run-warning` 黃色 warning 美學；無新 CSS class

---

## 4. Commits

5 個 source commits（按時序由舊至新；全 push origin/main）：

| # | commit | message | phase |
|---|---|---|---|
| 1 | `0814c05` | `admin: add missing url summary stats` | night-3-a |
| 2 | `2597f44` | `admin: limit overview to recent posts by default` | night-3-b |
| 3 | `8f23b9c` | `admin: add category and series filters` | night-3-c |
| 4 | `884437c` | `admin: add overview sort dropdown` | night-3-d |
| 5 | `745c48d` | `admin: show missing metadata warnings` | night-3-e |

### 4.1 Push 狀態

✅ **5/5 commits 已全部 push origin/main**（night-5；fast-forward `19cc837..745c48d`；無 force / rebase / amend）

### 4.2 累計變動

```
src/views/admin/index.ejs | 133 ++++++++++++++++++++
1 file changed, 124 insertions(+), 9 deletions(-)
```

✅ **單一檔案**；跨 5 commits 累計 +124 / -9 = 133 lines；零跨檔依賴。

---

## 5. Validation

| 項目 | 狀態 |
|---|---|
| **每一批 `npm run build` 皆通過** | ✅ 5 次 build 全 ✓（night-3-a 885ms / night-3-b 553ms / night-3-c 508ms / night-3-d 509ms / night-3-e 580ms）|
| **無 build error / warning** | ✅ 5 次皆無 |
| **sitemap 仍為 14 url entries** | ✅ 每次 postbuild 確認 |
| **admin/index.ejs 不進 dist** | ✅ 每次 build 輸出之 dist HTML 不含 admin/（admin dev-mode-only）|
| **production output 不變** | ✅ 線上 GitHub Pages 完全不變（仍服務 `f32f7d3`）|
| **deploy repo 未動** | ✅ 自 5/21 pm-45 起凍結；night session 全程未動 |
| **dist/.gitkeep drift** | ✅ 無（自 pm-20 root cleanup 後消除）|

---

## 6. Manual QA Checklist

⚠️ **本機手動驗收項目**（明日 / 之後本機跑 `npm run dev` 後逐項勾選）：

### 6.1 Stats / 基本顯示

- [ ] 開啟 `http://localhost:5173/admin/`（或 vite 自動配置之 port）
- [ ] 檢查 stat cards 是否出現 **Missing FB URL**（per night-3-a）
- [ ] 檢查 stat cards 是否出現 **Missing Output URL**（per night-3-a）
- [ ] 既有 12 cards 仍顯示（total / ready / draft / published / blogger source / github source / blogger enabled / github enabled / has .fb.md / SEO ok / URL ok / fb published ok）

### 6.2 Search

- [ ] 搜尋文章 title（如 `we-media-myself2`）
- [ ] 搜尋 slug（如 `portable-blog-system-mvp`）
- [ ] 搜尋 category（如 `tech-note`）

### 6.3 Filter

- [ ] 使用 **status** filter（ready / draft / published）
- [ ] 使用 **channel** filter（Blogger / GitHub enabled / disabled）
- [ ] 使用 **completeness** filter（SEO / FB / URL / categoryTags / fbPublished missing）
- [ ] 使用 **contentKind** filter（post / page / tech-note / book-review / download）
- [ ] 使用 **category filter**（per night-3-c；應顯示 posts 中實際出現之 category options）
- [ ] **未來補入 series data 後**，再驗 **series filter**（當前 series.json 為空；optgroup 不渲染）

### 6.4 Sort（per night-3-d）

- [ ] 切換 sort dropdown 至 `publishedAt desc`（default；應對齊 loader 初始順序）
- [ ] 切換至 `updatedAt desc`（觀察 row 順序變動）
- [ ] 切換至 `title asc`（觀察按標題字母排序）
- [ ] sort 切換後 search / filter 狀態保留
- [ ] sort 切換後 detail panel click 展開仍指向正確 row（rowDetail closure 驗證）

### 6.5 Detail panel + warning banner（per night-3-e）

- [ ] 點 row 展開 detail panel
- [ ] 確認 **missing metadata warning banner** 顯示（如該 post 有缺漏項）
- [ ] 確認 warning 列出 human-readable 名稱（SEO / FB metadata / Output URL / Category / Tags / FB Published URL / Blogger config / GitHub config）
- [ ] 確認 OK 無缺漏之 post 之 detail panel **不顯示** warning banner（避免畫面太吵）
- [ ] 再點 row 收合 detail panel

### 6.6 Default recent N + show-all toggle（per night-3-b）

⚠️ 當前文章數 6 篇 < 30；無法直接驗證 N=30 截斷。建議：

- [ ] 確認 show-all toggle 在當前文章數 6 < 30 時**不顯示**（hidden）
- [ ] **若未來文章數 > 30**：
  - [ ] 確認預設只顯示前 30 篇
  - [ ] 確認 show-all toggle 出現「Show all」
  - [ ] 點 toggle → 顯示全部
  - [ ] 再點 toggle → 文字切換「Show latest 30」，回到 30 篇
- [ ] search / filter active 時：toggle 隱藏；不被 30 篇截斷（顯示所有 matched）

---

## 7. Known Limits

⚠️ 以下為**本次完成範圍之已知限制**；屬 future / out-of-scope；不視為 bug：

| # | 限制 | 原因 |
|---|---|---|
| 1 | **目前文章數只有 6 篇** | recent 30 / show-all toggle 不會真的顯示（需 > 30 篇才觸發）；屬未來防範 |
| 2 | **`series.json` 目前為空** | series filter 不會渲染 optgroup（per night-3-c 動態 conditional render）；當前架構就位，未來 series data 補入後自動 surface |
| 3 | **Admin 仍不是正式 write / save flow** | 仍 read-only / dry-run；FB-P5-c / Admin-2-b-2 屬 Phase 2 future；per `docs/fb-sidecar-write-preflight-decision.md` §7 |
| 4 | **不含 full pagination** | 採 default recent N + show-all toggle 涵蓋；≥ 100 posts 時再評估 full pagination |
| 5 | **不含 bulk edit** | 屬 write path；違反 Admin read-only / dry-run 邊界 |
| 6 | **不含 GA4 click event implementation** | 屬 Phase 2 click tracking rollout；per `docs/click-tracking-governance.md` + `docs/20260522-pm-phase-2-batch-plan.md` §4 順序 #3+ |
| 7 | **不含 deploy** | admin/index.ejs dev-mode-only；不進 dist；不需 deploy；deploy repo 全 night session 未動 |

---

## 8. Next Candidate Work（僅列；不啟動）

| # | 候選 | 性質 |
|---|---|---|
| 1 | **Admin manual QA** | 本機跑 `npm run dev` 驗收 §6 checklist；可立即執行；無依賴 |
| 2 | **Admin usability follow-up polish** | 後續微調（如 sort indicator / filter combo / column header sort 等）；屬 Phase 2 candidate |
| 3 | **GA4 click tracking implementation** | per `docs/20260522-pm-phase-2-batch-plan.md` §4 順序 #3-#5（affiliate CTA → relatedLinks / otherLinks → hashtag）|
| 4 | **Blogger → GitHub UTM implementation** | per `CLAUDE.md` §16.4 future；batch plan §10 |
| 5 | **`campaign` metadata schema** | per `docs/ga4-link-tracking-spec.md` §6 + `docs/ad-affiliate-schema-proposal.md` §4 |
| 6 | **Affiliate top / bottom click tracking** | per `docs/click-tracking-governance.md` §7 + batch plan §5 |
| 7 | **docs / roadmap sync** | README §7 baseline drift cleanup（自 5/22 day-1 起又進多次 push；屬遞迴 drift）|

⚠️ **本批不啟動**任一候選；皆屬 user 表態後之獨立 phase。

---

## 9. Freeze State

### 9.1 Source repo

| 項目 | 值 |
|---|---|
| **source HEAD** | `745c48d admin: show missing metadata warnings`（本批 EOD doc commit 後將變動）|
| **source origin/main sync** | ✅ **sync**（per night-5 push；ahead = 0）|
| **working tree** | clean |

### 9.2 Deploy repo

| 項目 | 值 |
|---|---|
| **deploy HEAD** | `f32f7d3 deploy: 09b9a67 snapshot (GA4 enabled)`（自 5/21 pm-45 起未動）|
| **deploy working tree** | clean |
| **deploy tracking** | `gh-pages` → `[origin/gh-pages]`（sync）|

### 9.3 Push / deploy 狀態

| 維度 | 狀態 |
|---|---|
| **是否 deploy** | ❌ **否**（admin/index.ejs dev-mode-only；無 dist 變動；無需 deploy）|
| **是否 push** | ✅ **5 Admin commits 已 push source main**（per night-5；fast-forward `19cc837..745c48d`）|
| 本批 night-6 之 doc commit | 待 commit 後 push 屬獨立 phase（night-7 候選）|

### 9.4 5/22 全日累計 push 摘要

| 段 | push event | range | commits |
|---|---|---|---|
| 上午 | day-1 push-docs-commits-a | `6593e4c..2971c1c` | 4 docs |
| 下午 | pm push-docs-pm-commits-a | `2971c1c..3433d87` | 2 docs |
| 晚間 night-2 | night docs push | `3433d87..19cc837` | 3 docs |
| 晚間 night-5 | Admin source push | `19cc837..745c48d` | 5 source |

**5/22 全日 push 總計**：**14 commits**（9 docs + 5 source；全 docs-only 之 source 改動限於 admin dev-mode-only）；deploy 全日凍結 `f32f7d3`。

---

## 10. Cross-links

- `docs/20260522-eod-report.md`（5/22 day session 收尾）
- `docs/20260522-pm-phase-2-batch-plan.md`（Phase 2 batch plan；今晚 fixes 屬 Admin usability 範疇）
- `docs/20260522-day-1-readonly-a-report.md` §4 #1（Admin usability small fixes 推薦來源）
- `docs/admin-1-completion-report.md`（Admin Phase 1 完成報告；dev-mode-only Plan B 規範）
- `docs/admin-2b1-completion-report.md`（Admin dry-run editor 規範）
- `docs/fb-sidecar-write-preflight-decision.md`（Admin write 之 user preflight checklist；本次未啟動）
- `docs/click-tracking-governance.md`（GA4 click 治理；future tracking 對齊）
- `docs/ga4-link-tracking-spec.md`（GA4 / link tracking spec）
- `src/views/admin/index.ejs`（本次唯一改動之檔案）
- `src/scripts/load-admin-posts.js`（loader；本次未動；future series field 候選）
- `CLAUDE.md` §29（第一版不做清單；Admin write / Blogger API / 等屬 Z 類）

---

（本文件結束）
