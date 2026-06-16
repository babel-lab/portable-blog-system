# ADMIN detail panel collapsible sections (R1) — human / rendered-artifact acceptance record（docs-only）

> Phase: `20260616-admin-detail-panel-collapsible-sections-human-acceptance-docs-only-a`
> Date: 2026-06-16 17:27
> Type: docs-only / read-only acceptance（不實作；不改 src / details / summary / CSS / JS）
> Reviewed implementation: pm-23 `feat(admin): collapse detail panel sections`（commit `f89ad09`）

---

## A. Phase name

`20260616-admin-detail-panel-collapsible-sections-human-acceptance-docs-only-a`

對 pm-23 落地之 R1（detail panel 4 個低頻區段改 native `<details>`/`<summary>` 預設收合）做 acceptance：以可由 repo 端確認之 **rendered-artifact / 結構驗證**（grep / count）為主，並列出**必須由 user 在瀏覽器人眼確認**之 checklist（Claude 未開瀏覽器、未看 screenshot，不冒充已看過畫面）。

---

## B. Baseline verify

- branch: `main`
- HEAD == origin/main == `f89ad09`（`feat(admin): collapse detail panel sections`）
- working tree: clean / ahead-behind 0/0
- committed scope of `f89ad09`：`CLAUDE.md`（+2 ledger）+ `src/views/admin/index.ejs`（+18/−12），無 unrelated。
- rendered artifact：`.cache/pages/admin/index.html`（git-ignored；mtime 17:25，由 pm-23 dev render 於 `f89ad09` clean state 產生；本 acceptance 以 read-only grep 複核，未重新 build / 未改 source）。

---

## C. Files read

- `src/views/admin/index.ejs`（committed diff 複核，read-only；未改）
- `.cache/pages/admin/index.html`（rendered artifact，read-only grep）
- `CLAUDE.md`（pm-23 ledger）
- `docs/20260616-admin-readability-ia-refinement-preanalysis.md`（R1 spec §G / §I 對照）

---

## D. Rendered-artifact acceptance result（repo 端可確認）

對 `.cache/pages/admin/index.html` 之 read-only grep（11 post detail panels）：

| 檢查 | 結果 | 判定 |
| --- | --- | --- |
| `<details>` open / `</details>` close / `<summary>` | **46 / 46 / 46** | ✅ 平衡 |
| collapsed-by-default（`<details … open>` 數量） | **0** | ✅ 4 區段皆預設收合 |
| 低頻 summary：FB Sidecar Dry-run Editor | 11（全 post） | ✅ |
| 低頻 summary：sourceKey selector preview | 2（僅有 related/other links 之 post；受 `<% if %>` guard） | ✅ |
| 低頻 summary：Future write readiness checklist | 11 | ✅ |
| 低頻 summary：Source path | 11 | ✅ |
| 高頻區段文字仍在：Identity / Platform Routing / Readiness | 11 / 11 / 11 | ✅ 直接可見 |
| 高頻：Validation warnings | 22（每 post 標題 + footer） | ✅ |
| 高頻：Governance signals / Aggregation summary / Completeness summary | 12 / 11 / 11 | ✅ |
| 高頻：Related / other links（仍為 `<div>`，未收合） | 11 | ✅ 未誤收 |
| 高頻標題**未**被包進 `<summary>`（Completeness summary / Governance signals） | 0 / 0 | ✅ 維持直接可見 |
| EJS leak（`<%` / `%>`） | **0** | ✅ |
| undefined / null leak（`>undefined<` / `>null<`） | **0** | ✅ |

count 數學自洽：per post 固定 4 個 `<details>`（FB editor + 既有 nested「Show simulated frontmatter」+ future-write + source-path）+ sourceKey（2 posts）= 11×4 + 2 = **46**，open == close == summary。

**結論（rendered-artifact）= PASS**：R1 達成設計目標 —— 4 個低頻區段預設收合以降低單篇 detail panel 展開高度；高頻資訊（identity / routing / readiness / validation / governance / completeness）維持直接可見；無 nesting 失衡、無 EJS / undefined / null leak；屬純 readability presentation，未見資料語意改變（heading 文字逐字保留、count 由既有 loader 欄位推導未變）。

---

## E. Acceptance target 對照

| Acceptance target（user 指定） | repo 端證據 | 狀態 |
| --- | --- | --- |
| 展開 detail panel 後高頻資訊仍直接可見 | 高頻 8 區段文字 present 且未入 `<summary>` | ✅ rendered-confirmed |
| 4 個低頻 sections 預設 collapsed | `<details open>` = 0；4 summary 各 render | ✅ rendered-confirmed |
| summary click 可展開 | native `<details>/<summary>`（無 JS 攔截 default action；row-toggle 在 sibling `tr.post-row`） | ⏳ **須 browser 人眼確認**（見 §F） |
| detail panel 無明顯 nesting / layout / EJS leak | open/close 平衡 46/46/46；EJS leak 0 | ✅ rendered-confirmed（layout 視覺須 §F） |
| governance / validation / completeness 主要資訊仍可讀 | 各區段文字 present | ✅ rendered-confirmed |
| 只是 readability，無資料語意改變 | diff +18/−12 純 tag/wrap；validate 0/94/84 不變；admin smoke 16/0·12/0 | ✅ confirmed |

---

## F. Human / browser checklist（須 user 在瀏覽器人眼確認；Claude 未看畫面）

> ⚠️ 以下為 native `<details>` 互動與視覺項目，無法由 repo grep 證明，**須 user 於 dev server `/admin/` 親眼確認**。Claude 未開瀏覽器、未取得 screenshot，不冒充已驗證。

於 `npm run dev` 後開 `/admin/`，展開任一 post row 之 detail panel，逐項確認：

1. [ ] 展開 detail panel 後，**4 個低頻區段預設為收合狀態**（只見 ▸ 三角 + 標題：FB Sidecar Dry-run Editor / sourceKey selector preview / Future write readiness checklist / Source path）。
2. [ ] 點任一低頻區段之 **summary（標題）可展開**內容；再點可收合。
3. [ ] 展開低頻區段時，內容（FB dry-run 表單 / sourceKey selector / checklist / source path）**完整顯示、無破版**。
4. [ ] 點低頻 summary **不會**意外收合整個 post detail panel（row 應維持展開）。
5. [ ] 高頻區段（Identity / Platform Routing / Readiness + Validation warnings / Governance signals + Aggregation summary / Completeness summary / Related links 等）**仍直接可見、不需額外點擊**。
6. [ ] disclosure 三角 + 標題**同行**對齊（h3 `display:inline`），無多餘全寬底線、無錯位。
7. [ ] 整體無明顯 layout overlap / 文字溢出 / 巢狀錯亂。
8. [ ] 未出現任何 Apply / Save / 寫入按鈕之新行為（仍 read-only；既有 FB / SEO dry-run 之 disabled Apply 不變）。

> 完成後可回填本 checklist，或另開極小 docs 補記 browser PASS；本 record 之 rendered-artifact 結論不依賴此步即已成立，但「summary click 展開」「實際 layout」最終以 §F 人眼為準。

---

## G. Verdict

- **Rendered-artifact / 結構 acceptance = PASS**（§D 全綠；§E 中 5/6 項 rendered-confirmed）。
- **Browser 人眼 acceptance = PENDING user**（§F；「summary click 展開」與「實際視覺 layout」須 user 確認；Claude 未看畫面）。
- 整體：R1 在 repo 端證據上符合設計目標且無資料語意改變；待 user 完成 §F browser checklist 即為完整 human visual PASS。

---

## H. Caveats

- 本 record 為 **rendered-artifact acceptance**（對 generated `.cache/pages/admin/index.html` 之 grep / count），**非** browser screenshot / DOM 互動測試。
- 「summary click 可展開」「disclosure 視覺對齊」「layout 無破版」屬 native `<details>` runtime / 視覺行為，repo grep 無法證明，已列入 §F 由 user 人眼確認。
- 未新增 automated UI smoke guard（pm-23 已述：純 presentation，既有資料層 smoke〔governance-aggregation 16/0、validation-consume 12/0〕已覆蓋；structure-lock 對 cosmetic 反覆微調脆且高成本）。

---

## I. Non-actions（本 phase 實際未做）

docs-only / read-only —— 未改 `src` / `views` / `index.ejs` / `scripts` / loader / validator / reporter / content / settings / `package` / dist / gh-pages / `.cache`（未重新 build）；未新增或調整 `<details>` / `<summary>` / CSS / JS；未進 R2 overview consolidation；未新增 count badge / summary-card warning 欄 / write path / prescription；未 npm install；未 build prod / deploy / Blogger repost；未 merge / rebase / reset / amend / force push；未壓縮·重排 CLAUDE.md。唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync。

---

## J. Recommended next phase

- 主線：user 完成 §F browser checklist → 回填或極小補記 browser PASS（docs-only）。
- 或保守 idle freeze（R1 rendered-artifact 已 PASS）。
- 或下一 readability 切片 **R2**（頁首 overview 整併 `.stats` 15-card vs Dashboard 6 surface-card；**須 user explicit approval；NOT docs-only**）。

紅線：R2 / write path / filter chip / Posts-index 計數 badge / summary-card 補欄 / per-post prescription 一律獨立 phase + user explicit approval。
