# ADMIN — Posts Table `<td>` Closure Source Fix Acceptance Record

- **Phase**：`20260616-admin-posts-table-td-closure-source-fix-acceptance-readonly-a`
- **日期**：2026-06-16（15:05 起；pm session）
- **性質**：read-only acceptance record（**不**做新的 source implementation；**不**改 src / views / content / settings / package / tests；**不**改 Admin UI / Aggregation summary；**不**做 filter chip / Posts-index count badge / suggested-fix / prescription / validator-warning join / Admin write·apply·fix；**不** Blogger repost / GitHub Pages build·deploy / npm install / amend·rebase·reset·force push）。唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync。
- **Reviewed commit**：`7dd4fe2 fix(admin): close posts table completeness cell`
- **承接**：
  - `docs/20260616-admin-posts-table-td-closure-fix-preanalysis.md`（pm-10；最小修復規劃）
  - structural audit phase（pm-10 audit；confirmed issue）

---

## A. Baseline

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : 7dd4fe2 == origin/main
working tree   : clean
ahead / behind : 0 / 0
latest commit  : 7dd4fe2 fix(admin): close posts table completeness cell
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## B. Files reviewed（read-only）

- `docs/20260616-admin-posts-table-td-closure-fix-preanalysis.md`（pm-10）
- `src/views/admin/index.ejs`（committed fix）
- `package.json`
- `CLAUDE.md`
- `git diff-tree --name-status 7dd4fe2` / `git show 7dd4fe2` / dev render + grep/awk

---

## C. Reviewed commit scope（`git diff-tree --name-status 7dd4fe2`）

```
M  CLAUDE.md
M  src/views/admin/index.ejs
```

source diff（`git show 7dd4fe2 -- src/views/admin/index.ejs`）：`@@ -759,6 +759,7 @@` 之單一 `+        </td>`（+1/−0）。

---

## D. Acceptance verdict

**PASS（read-only acceptance）。**

理由：commit `7dd4fe2` 之唯一 source change = `src/views/admin/index.ejs` **+1 行 `</td>`**（精準補在 governance badge `</span>` 後、`<td class="col-urls">` 前，閉合 Completeness `<td class="col-narrow">`）；無文字 / badge / title / class / JS / CSS / loader / Aggregation summary 變更；template main post-row 現 7 `<td>` open / 7 explicit `</td>` close；rendered HTML `<td>`/`</td>` 已平衡（817/817）；11 post-row 不再有 Completeness 流入 col-urls 之結構；header 仍 7 欄；Aggregation summary / gov badge regression 全 intact；validate baseline 不變。

---

## E. Commit scope acceptance（逐項）

| 檢查 | 結果 | 證據 |
|---|---|---|
| 只有授權 source change `src/views/admin/index.ejs` +1 line | ✅ | `git show` diff = 單一 `+ </td>`（+1/−0） |
| CLAUDE.md 僅極小 ledger sync | ✅ | CLAUDE.md +2（append pm-11 entry） |
| 無 content / frontmatter mutation | ✅ | diff-tree 僅 index.ejs + CLAUDE.md |
| 無 settings / package / lockfile change | ✅ | diff-tree 無 settings / package.json / lockfile |
| 無 loader / source data change | ✅ | `load-admin-posts.js` 不在 diff |
| 無 `.cache/` / build-deploy artifact 進 git | ✅ | `.cache/` git-ignored；working tree clean；untracked 空 |

---

## F. Source fix acceptance（逐項）

| 檢查 | 結果 | 說明 |
|---|---|---|
| 只新增一個 closing `</td>` | ✅ | diff = 單一 `+ </td>` |
| 位於 governance badge block 後、`<td class="col-urls">` 前 | ✅ | committed L761 `</span>` → L762 `</td>` → L763 `<td class="col-urls">` |
| 明確關閉 Completeness `<td class="col-narrow">` | ✅ | Completeness cell（opened L733）現於 col-urls 前明確閉合 |
| 未改文字 / badge / title / class / JS / CSS / loader | ✅ | diff 僅 closing tag；無其他 token 變動 |
| 未改 Aggregation summary wording / layout | ✅ | detail-panel block 不在 diff |

---

## G. Structural acceptance

- **template main post-row**：4 `<td>` + 2 `<td class="col-narrow">` + 1 `<td class="col-urls">` = **7 `<td>` opens / 7 explicit `</td>` closes** ✓
- **col-narrow closes before col-urls**：committed 序列 `</span>` → `</td>` → `<td class="col-urls">` ✓
- **rendered `.cache/pages/admin/index.html`**：`<td>` **817** / `</td>` **817 — balanced** ✓（修正前 817/806）
- **11 post-row**：Completeness cell 不再流入 col-urls（col-narrow=22 = 2/row × 11）✓
- **table header**：仍 **7 columns**（`<th>` ×7，排除 `<thead>` 行）✓
- **browser auto-repair**：此 issue 不再需要 auto-repair（source 已合法）✓

---

## H. Regression validation（本 acceptance 重跑）

| check | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（不變） |
| `node src/scripts/build-github.js --mode=dev` | exit 0；`admin (dev-mode) rendered: 11 posts`；無 EJS error |
| `Aggregation summary` render 次數 | **11** ✓ |
| governance badge `gov ✓` / `gov: N` 次數 | **11** ✓ |
| undefined / null leak | 空（**無**） ✓ |
| posts-index feature change | 無（只補 closing tag）✓ |
| filter chip / count badge feature expansion | 無 ✓ |
| write / apply / fix behavior introduced | 無 ✓ |
| `.cache/` committed | 否（git-ignored；working tree clean）✓ |

carry（未 re-run；不受影響）：`check:admin-governance-aggregation` 16/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check-commerce-affiliate-resolver` 23/0、`check:blogger-adsense-output` 85/0。未跑 GitHub Pages deploy / Blogger repost / npm install。

---

## I. Explicit non-actions

- ❌ new source implementation
- ❌ UI / EJS / views source change（本 acceptance phase）
- ❌ content / frontmatter mutation
- ❌ settings / package / lockfile change
- ❌ loader / source data change
- ❌ Admin write / apply / fix
- ❌ filter chip
- ❌ Posts-index count badge feature change
- ❌ suggested fix / prescription
- ❌ validator-warning join
- ❌ validation report schema
- ❌ Blogger repost
- ❌ GitHub Pages build / deploy
- ❌ ads / commerce unrelated change
- ❌ npm install
- ❌ merge / rebase / reset / amend / force push / unrelated cleanup
- ❌ CLAUDE.md compression / reorder
- ✅ 唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync

---

## J. Next recommended phase

- **`20260616-admin-governance-aggregation-detail-panel-human-visual-acceptance-record-docs-only-a`**（td closure fix 已 acceptance PASS → 解除暫緩，恢復 Aggregation summary 之 human visual acceptance record；docs-only）。
- 紅線：Posts-index feature / filter chip / count badge / write path / suggested-fix / prescription / validator-warning join 一律獨立 phase + user explicit approval。

---

（本紀錄結束）
