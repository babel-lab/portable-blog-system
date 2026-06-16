# ADMIN — Posts Table `<td>` Closure Fix Preanalysis

- **Phase**：`20260616-admin-posts-table-td-closure-fix-preanalysis-docs-only-a`
- **日期**：2026-06-16（14:51 起；pm session）
- **性質**：docs-only preanalysis（**不**改 src / views / content / settings / package / tests；**不**做 source fix；**不**改 UI / EJS source；**不**做 Admin write/apply/fix / filter chip / Posts-index count badge / suggested-fix / prescription / validator-warning join；**不** Blogger repost / GitHub Pages build·deploy / npm install / amend·rebase·reset·force push）。唯一 mutation = 本 preanalysis doc + CLAUDE.md 極小 ledger sync。
- **承接**：
  - structural audit phase `20260616-admin-posts-table-td-closure-structural-audit-readonly-a`（read-only；確認 issue）
  - `docs/20260616-admin-governance-aggregation-detail-panel-readonly-ui-implementation-acceptance-record.md`（pm-9；Aggregation summary 與本 issue 無關，已 accepted）

---

## A. Baseline

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : 3066c0f == origin/main
working tree   : clean
ahead / behind : 0 / 0
latest commit  : 3066c0f docs(admin): accept governance aggregation detail UI
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## B. Problem statement

**Admin Posts table 之 main post-row 有一個 `<td>` 未閉合（missing `</td>`）的 HTML 結構錯誤。**

- **header（thead）有 7 欄**（`src/views/admin/index.ejs` L644–654）：id/title、kind/status（`col-narrow`）、category/tags、Blogger、GitHub、Completeness（`col-narrow`）、URLs（`col-urls`）。
- **body main post-row**（`<tr class="post-row">` L660 → `</tr>` L767）**開 7 個 `<td>`**（L680、689、711、718、727、733、762）**但只明確關 6 個 `</td>`**（L688、710、717、726、732、766）。
- **Completeness `<td class="col-narrow">`（L733）缺 closing `</td>`**：在 governance badge（`gov ✓` / `gov: N`，L760–761）之 `</span>` 後，直接輸出 `<td class="col-urls">`（L762），其間**沒有** `</td>`。
- **rendered `.cache/pages/admin/index.html` 重現**：全頁 `<td>` 817 vs `</td>` 806 → **11 個未閉合 cell**（= 11 個 post-row × 1）；`col-narrow` td = 22（2/row）、`col-urls` td = 11（1/row）一致。**影響全部 11 個 post-row**（template-level pattern，非單一 row）。
- **瀏覽器 auto-repair**：browser 會在下一個 `<td>` 前自動補 implied `</td>`，故頁面**視覺上多半正常**——這也是 human visual acceptance 可能誤判 PASS 的原因；但**emitted source HTML 無效**，DOM/table 結構不乾淨。

---

## C. Root cause

- **由較早的 gov-badge 插入 commit `a46fff6` 引入**（am-1「ADMIN suggested-fix L2 read-only UI」，2026-06-16；該 commit `index.ejs` 為 `+58/−1`，其中的 `−1` 即把 Completeness cell 原本的 `</td>` 連同插入點覆蓋/刪掉，未補回）。
  - 證據：`git show a46fff6~1:src/views/admin/index.ejs` 之 post-row token 序列為 **7 `<td>` / 7 `</td>`（平衡）**；`git show c24f962:…`（pm-8 parent）為 **7 opens / 6 closes（失衡）** → 失衡發生於 `a46fff6`。
- **與 Aggregation summary（pm-8 `a52bed3`）無關**：pm-8 之 diff 僅單一 hunk `@@ -1043,… @@`（detail panel），**未觸及** post-row 區段（L660–767）。**Aggregation summary 位於 detail panel（`.post-detail` colspan=7 row），與本 post-row td closure issue 無直接關係，且 pm-9 已 accepted、維持有效。**

---

## D. Minimal fix option（建議；於下一個 source-fix phase 執行）

- **精準插入 1 個 `</td>`**：在 `src/views/admin/index.ejs` 之 governance badge block（L761 `</span>`）之後、`<td class="col-urls">`（L762）之前，補上單一 `</td>`（對齊既有縮排）。
- **No data change**（不改 loader / `governanceSignals` / `governanceAggregation`）。
- **No CSS change**（不動 `.col-narrow` / `.col-urls` / badge classes）。
- **No JS change**（不碰 search / filter / sort / detail toggle JS）。
- **No UI behavior change**（auto-repair 後的視覺與修正後一致；修正只是讓 source 合法，移除對 auto-repair 的依賴）。
- **No loader change**。
- 預期結果：post-row template **7 `<td>` opens / 7 explicit `</td>` closes**；rendered 全頁 `<td>` 與 `</td>` 對齊（post-row 不再貢獻 imbalance）。

> 註：本 preanalysis **不**執行 fix；fix 屬 `20260616-admin-posts-table-td-closure-source-fix-a`（NOT docs-only，須 user explicit approval）。

---

## E. Validation plan（for the next source-fix phase）

修正後至少執行 / 驗證：

1. `npm run validate:content` → 期望 **0/94/84 不變**（EJS 不在 validator scope；跑以確認 baseline）。
2. `node src/scripts/build-github.js --mode=dev` → exit 0、`admin (dev-mode) rendered: 11 posts`、無 EJS error；`.cache/` 維持 git-ignored、不 commit。
3. read / grep rendered `.cache/pages/admin/index.html`：
   - 全頁 `<td>` 與 `</td>` 數量**對齊**（post-row 不再造成 imbalance；預期 `<td>` 由 817 → 806、與 `</td>` 806 相等，淨差 0）。
   - 每個 post-row 之 `col-narrow` Completeness cell 在 `col-urls` 之前**明確閉合**（`</td>` 出現於 gov badge `</span>` 與 `<td class="col-urls">` 之間）。
   - rendered post-row 計數仍 **11 rows**。
4. EJS template 驗證：post-row 區段 **7 `<td>` opens / 7 explicit `</td>` closes**（手動 trace L660–767 token 序列）。
5. **Aggregation summary 仍正常 render**（detail panel「Aggregation summary」×11，不受影響；read-only same-source 行為不變）。
6. **不**跑 GitHub Pages deploy；**不** Blogger repost；**不** npm install。
7. fix-phase diff scope 應僅 `src/views/admin/index.ejs`（+1 行 `</td>`）+ 可選 CLAUDE.md ledger。

---

## F. Risk / rollback

- **Risk：低**——僅補 1 個 closing tag，無邏輯 / 資料 / CSS / JS / UI 行為變更。
- **Rollback**：移除插入的 `</td>` 即還原。
- **Benefit**：合法 HTML table 結構；移除對 browser auto-repair 的依賴；降低欄位對齊 edge case、CSS cell targeting、未來 JS selector / cell-index 邏輯、accessibility / screen-reader table 語意、HTML validator 之風險。

---

## G. Explicit non-actions

本 preanalysis **不授權**：

- ❌ Posts-index feature change（除單一 `</td>` 結構修正外，不動 Posts index 任何功能）
- ❌ filter chip
- ❌ count badge（Posts-index）
- ❌ write / apply / fix
- ❌ suggested fix / prescription
- ❌ validator-warning join
- ❌ content / frontmatter mutation
- ❌ build / deploy
- ❌ source fix（本 phase 為 docs-only；fix 屬下一 phase）
- ❌ UI / EJS source change
- ❌ loader / settings / package / lockfile change
- ❌ Blogger repost / GitHub Pages build·deploy / npm install
- ❌ merge / rebase / reset / amend / force push / unrelated cleanup
- ✅ 唯一 mutation = 本 preanalysis doc + CLAUDE.md 極小 ledger sync

---

## H. Recommended next phase

- **`20260616-admin-posts-table-td-closure-source-fix-a`**（**NOT docs-only**；單檔 `src/views/admin/index.ejs` 插入 1 個 `</td>`；依 §E validation plan 驗證；**須 user explicit approval**）。
- human visual acceptance record **暫緩**至 td closure fix 完成後再進行。
- 紅線：Posts-index feature / filter chip / count badge / write path / suggested-fix / prescription / validator-warning join 一律獨立 phase + user explicit approval。

---

（本紀錄結束）
