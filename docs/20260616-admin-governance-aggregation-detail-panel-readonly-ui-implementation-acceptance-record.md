# ADMIN — Governance Aggregation Detail Panel Read-Only UI Implementation Acceptance Record

- **Phase**：`20260616-admin-governance-aggregation-detail-panel-readonly-ui-implementation-acceptance-readonly-a`
- **日期**：2026-06-16（14:22 起；pm session）
- **性質**：read-only acceptance record（**不**做新的 source implementation；**不**改 src / views / content / settings / package / tests；**不**改 Admin UI；**不**做 filter chip / Posts-index count badge / suggested-fix / prescription / validator-warning join / Admin write·apply·fix；**不** Blogger repost / GitHub Pages build·deploy / npm install / amend·rebase·reset·force push）。唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync。
- **Reviewed commit**：`a52bed3 feat(admin): show governance aggregation in detail panel`
- **承接**：
  - `docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis.md`（pm-6；Option A 規劃）
  - `docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-acceptance-record.md`（pm-7；Option A accepted）

---

## A. Baseline

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : a52bed3 == origin/main
working tree   : clean
ahead / behind : 0 / 0
latest commit  : a52bed3 feat(admin): show governance aggregation in detail panel
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## B. Files reviewed（read-only）

- `docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis.md`（pm-6）
- `docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-acceptance-record.md`（pm-7）
- `docs/20260616-admin-validator-per-post-aggregation-implementation-acceptance-record.md`（pm-5）
- `src/views/admin/index.ejs`（committed block）
- `src/scripts/load-admin-posts.js`（確認 loader 未被本 commit 更動）
- `package.json`
- `CLAUDE.md`
- `git diff-tree a52bed3` / `git show a52bed3` / read-only grep + dev render

---

## C. Reviewed commit scope（`git diff-tree --name-status a52bed3`）

```
M  CLAUDE.md
M  src/views/admin/index.ejs
```

→ 2 檔（唯一 source change `src/views/admin/index.ejs` +35/−0；CLAUDE.md ledger +2）。**無** loader / settings / package / lockfile / content / frontmatter / build-deploy artifact。

---

## D. Acceptance verdict

**PASS（read-only acceptance）。**

理由：commit `a52bed3` 之唯一 source change 為授權檔案 `src/views/admin/index.ejs`，新增區塊嚴格落在 pm-7 接受之 Option A 範圍內（detail-panel-only additive read-only block；保留 raw dl；顯示 `governanceAggregation` 之 hasSignals / totalSignalCount / byClass / signals[] + same-source note；沿用既有 class 零新 CSS）；UI boundary 經 grep 證實無任何 write path / handler / interactive element（唯一 forbidden-word 命中為 harmless descriptive 註解）；dev admin render 可重現、無 EJS error、無 undefined/null leak；validate baseline 不變。

---

## E. Commit scope acceptance（逐項）

| 檢查 | 結果 | 證據 |
|---|---|---|
| 只有授權 source change `src/views/admin/index.ejs` | ✅ | diff-tree 僅 `index.ejs` + `CLAUDE.md` |
| CLAUDE.md 僅極小 ledger sync 作為輔助 | ✅ | CLAUDE.md +2（append pm-8 entry） |
| 無 content / frontmatter mutation | ✅ | diff-tree 無 `content/**` / `*.md`（除 CLAUDE.md） |
| 無 loader / source data change | ✅ | `load-admin-posts.js` 不在 diff（`p.governanceAggregation` 仍由 loader pm-4 提供） |
| 無 settings / package / lockfile change | ✅ | diff-tree 無 `content/settings/**` / `package.json` / lockfile |
| 無 build / deploy artifact 進 git | ✅ | `.cache/` git-ignored；untracked = 空；無 dist 變更 |

---

## F. UI implementation acceptance（committed block，`index.ejs` L1046–1080）

| 檢查 | 結果 | 說明 |
|---|---|---|
| 位於既有 detail panel「Governance signals」section 內 | ✅ | 緊接 raw 4-signal dl `</dl>` 之後、source-note `<p>` 之前 |
| 保留既有 raw governance signals dl，不刪、不改語意 | ✅ | raw dl（unknown tag/category + cross-site mismatch ×2）完整保留 |
| 新增者為 additive read-only block | ✅ | 純 `<h4>` + `<dl>` + `<p>` + `<span class="badge">`；無互動元素 |
| 顯示 `hasSignals` | ✅ | yes/no badge（warn/ok）|
| 顯示 `totalSignalCount` | ✅ | 數值 badge |
| 顯示 byClass taxonomy / cross-site subtotal | ✅ | `byClass · taxonomy` badge + 「其中 cross-site mismatch：N」（view 端由 signals[] 之 cross-site-mismatch-* 加總，純 presentation） |
| 顯示 signals[] fixed-order type/class/count list | ✅ | `gaSignals.forEach` 渲染 `type · class × count` badge（順序即 loader 之固定 `GOVERNANCE_SIGNAL_ORDER`）|
| empty fallback（不因 undefined/null render error）| ✅ | `ga` / `gaSignals` / `gaByClass` 皆有 type-guard 預設；`signals[]` 空 → 「無治理訊號」正向 fallback |
| same-source note | ✅ | 明示來源 = 既有 `governanceSignals`/`governanceAggregation`、**非 validator warning count**、不代表 `validationReadiness` completed、validator warnings 仍 **deferred** |

---

## G. UI boundary acceptance

確認**無**（committed block grep L1046–1080）：

- posts index change ✅ 無（只動 detail panel section）
- filter chip ✅ 無
- count badge（Posts-index）✅ 無
- `<button` / `<input` / `<form` / `<select` / `<textarea` ✅ 無
- `onclick` / `onchange` / `fetch(` ✅ 無
- write / mutate / apply / save / autofix handler ✅ 無
- suggested fix / prescription（「應改為 X」）✅ 無
- validator-warning join ✅ 無（`validationReadiness` 仍 deferred）

**Harmless descriptive comment 標示**：grep 唯一命中為 EJS 註解行 `<%# … 純唯讀：無 button / input / form / onclick / handler / filter / badge-link / write path -%>`，屬**描述性註解**（說明本 block 不含哪些東西），**非**實際 UI handler / element。判斷：harmless，**不需**強制 future cleanup（如未來嫌混淆可在他 phase 微調措辭）；**本 phase 不改 source**。

---

## H. Render / validation results（本 acceptance 重跑）

| command | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts**（不變） |
| `node src/scripts/build-github.js --mode=dev` | exit **0**；`admin (dev-mode) rendered: 11 posts`；`wrote .cache/pages/admin/index.html`；無 EJS error |
| `grep -c "Aggregation summary" .cache/pages/admin/index.html` | **11**（每篇 detail panel 各 1） |
| `grep ">undefined<\|>null<" .cache/pages/admin/index.html` | 空（**無 leak**） |

carry（admin dev-only，不在 build:blogger 路徑，未 re-run）：`check:admin-governance-aggregation` 16/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check-commerce-affiliate-resolver` 23/0、`check:blogger-adsense-output` 85/0。未跑 GitHub Pages deploy / Blogger repost / npm install。

---

## I. Explicit non-actions

- ❌ new source implementation
- ❌ UI / EJS / views source change（本 acceptance phase）
- ❌ content / frontmatter mutation
- ❌ loader / source data change
- ❌ settings / package / lockfile change
- ❌ Admin write / apply / fix
- ❌ filter chip
- ❌ Posts-index count badge
- ❌ suggested fix / prescription
- ❌ validator-warning join
- ❌ validation report schema
- ❌ cross-post loader aggregation migration
- ❌ Blogger repost
- ❌ GitHub Pages build / deploy
- ❌ ads / commerce unrelated change
- ❌ npm install
- ❌ merge / rebase / reset / amend / force push / unrelated cleanup
- ❌ CLAUDE.md compression / reorder
- ✅ 唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync

---

## J. Next recommended phase（擇一；皆不在本 phase 開始）

1. **human visual acceptance at `/admin/`**：人眼於展開之 detail panel 目視「Aggregation summary」顯示（hasSignals / totalSignalCount / byClass / signals[] / same-source note）、確認無破版、與下方 raw dl 同源無混淆。
2. `20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a`（docs-only；validator-warning per-post join 路線之前置）。
3. `20260616-admin-suggested-fix-l2-readonly-ui-preanalysis-docs-only-a`（docs-only）。

**紅線**：Posts-index count badge / filter chip / suggested-fix / prescription / validator-warning join / validation report schema / write path / cross-post loader aggregation migration 一律獨立 phase + user explicit approval。

---

（本紀錄結束）
