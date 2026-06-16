# ADMIN — Per-Post Governance Aggregation Read-Only UI Preanalysis Acceptance Record

- **Phase**：`20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-acceptance-readonly-a`
- **日期**：2026-06-16（14:00 起；pm session）
- **性質**：read-only acceptance record（**不**做 source implementation；**不**改 src / views / content / settings / package / tests；**不**改 Admin UI；**不**做 EJS implementation；**不**做 filter chip；**不**做 Posts-index count badge；**不**做 suggested fix / prescription；**不**做 validator-warning join；**不**做 Admin write/apply/fix；**不** build/deploy；**不** npm install）。唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync。
- **Reviewed commit**：`453442a docs(admin): plan governance aggregation read-only UI`
- **承接**：
  - `docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis.md`（pm-6；被接受對象）
  - `docs/20260616-admin-validator-per-post-aggregation-implementation-acceptance-record.md`（pm-5；commit `08edc53` 之 implementation acceptance）

---

## A. Baseline

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : 453442a == origin/main
working tree   : clean
ahead / behind : 0 / 0
latest commit  : 453442a docs(admin): plan governance aggregation read-only UI
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## B. Files reviewed（read-only）

- `docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis.md`（pm-6；被接受對象）
- `docs/20260616-admin-validator-per-post-aggregation-implementation-acceptance-record.md`（pm-5）
- `src/scripts/load-admin-posts.js`（確認 `governanceAggregation` 由 loader attach）
- `src/views/admin/index.ejs`（確認既有 governance UI 落點 + EJS 尚未 reference `governanceAggregation`）
- `package.json`
- `CLAUDE.md`（ledger 現況）
- `git diff-tree 453442a` / read-only grep（commit scope + claim verification）

---

## C. Reviewed commit scope（`git diff-tree --name-status 453442a`）

```
M  CLAUDE.md
A  docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis.md
```

→ 2 檔（CLAUDE.md ledger + 1 新 preanalysis doc）。**無**任何 src / views / content / settings / package / tests 變更 → 證實 pm-6 為純 docs-only preanalysis。

---

## D. Acceptance verdict

**PASS（read-only acceptance）。**

理由：pm-6 preanalysis 全程僅規劃 **read-only UI 顯示**，未授權任何 write / apply / fix / filter chip / Posts-index count badge source / suggested-fix / prescription / validator-warning join / build / deploy / content 變更；current-state 三項關鍵發現（loader 已 attach `governanceAggregation`、既有 raw governance signals detail section、EJS 尚未 reference `governanceAggregation`、same-source 非 validator warning count）經本 acceptance 之 source grep 逐一證實正確；四個 option 完整且推薦 Option A（單檔 `index.ejs` additive、無 loader 改動、無 CSS 擴張、無 write、無 validator-join、最低風險）合理。可作為後續 Option A detail panel read-only UI implementation 之依據。

---

## E. Scope acceptance（逐項）

| 檢查 | 結果 | 證據 |
|---|---|---|
| preanalysis 只規劃 read-only UI | ✅ | §D/§E Option A「read-only」；§G「L1 allowed = 只讀顯示」 |
| 未授權 write / apply / fix | ✅ | §E.A non-actions「不連 write」；§G「write/apply/fix → must be separate phase」；§J |
| 未授權 validator-warning join | ✅ | §G「validator-warning join → separate phase」；§J；維持 `validationReadiness` deferred |
| 未授權 filter chip | ✅ | §E.B 明文「不做 filter chip」；§G separate phase；§J |
| 未授權 Posts-index count badge source | ✅ | §E.B 明文「不做 count badge implementation」；§G separate phase；§J |
| 未授權 suggested fix / prescription | ✅ | §D「不做 per-post prescription」；§G separate phase；§J |
| 未授權 build / deploy | ✅ | §J non-actions「未 build/deploy」 |
| 未要求改 content / frontmatter | ✅ | §J「未改 content/frontmatter/markdown」 |

---

## F. Current-state findings acceptance（經 source grep 證實）

| 發現 | 是否正確 | 驗證 |
|---|---|---|
| `governanceAggregation` 已由 loader attach 在 post data | ✅ | `load-admin-posts.js` L1063 `p.governanceAggregation = aggregatePostGovernanceSignals(p.governanceSignals)` |
| Admin UI 目前已有 raw governance signals detail section | ✅ | `index.ejs` L1017 `<h3>Governance signals …>`（L1016–1056 raw 4-signal dl）+ Posts index badge L760 |
| EJS 目前尚未 reference `governanceAggregation` | ✅ | `grep governanceAggregation src/views/admin/index.ejs` → 0 命中（exit 1） |
| 此資料與既有 raw governance signals 為 same-source、非 validator warning count | ✅ | pm-6 §B.3 / §D 明示同源；§B.2 保留「Validation warnings (deferred)」分區；`governanceAggregation` 源自 `governanceSignals`（非 validator output） |

---

## G. Option analysis acceptance

四個 option **完整**（皆含 scope / future files / benefits / risks / validation / non-actions / recommended）：

- **Option A**：detail panel only，read-only byClass + signals[] summary → **推薦**。
- **Option B**：posts index minimal indicator，但**無** filter chip / count badge implementation → L1 不建議。
- **Option C**：separate per-post governance section → 與既有 raw section 重複，不建議。
- **Option D**：no UI implementation yet → 保守次選。

**推薦 Option A 合理**：
- single-file future implementation（`src/views/admin/index.ejs` only）✅
- additive block ✅
- no loader change（資料已在 render context）✅
- no CSS expansion unless necessary（沿用 `.detail-section`/`.detail-grid`/`.badge`/`.b-warn`/`.b-ok`/`.text-muted`/`.section-tag`）✅
- no write path ✅
- no validator-warning join ✅
- lowest risk（backout = 移除單一 block）✅

---

## H. Future implementation boundary（下一階段 Option A implementation 可做 / 不可做）

**可做（L1，單一 NOT-docs-only phase，須 user approval）**：
- 只動 `src/views/admin/index.ejs`，於既有「Governance signals」detail section additive 一段 read-only 區塊。
- render `byClass` summary（目前僅 `taxonomy: N`）。
- render `signals[]` 固定順序 type / count 列舉。
- 加 same-source 註（與既有 raw 4 訊號同源、非 validator warning count）。
- **保留**既有 raw 4-signal dl（不移除、不重構）。
- 沿用既有 CSS classes（無 CSS 擴張除非必要）。

**不可做（各須獨立 phase + approval）**：
- 動 Posts index / 改 readiness cell。
- filter chip。
- count badge 元件 / 數值 badge 升級。
- suggested fix / per-post prescription。
- write / apply / fix。
- validator-warning join / validation report schema。
- cross-post loader aggregation migration。

---

## I. Validation / checks（本 acceptance 實際執行；皆 read-only）

- `git diff-tree --no-commit-id --name-status -r 453442a` → `M CLAUDE.md` + `A docs/...preanalysis.md`（commit scope 確認 docs-only）。
- `grep -n governanceAggregation src/scripts/load-admin-posts.js` → L1060 / L1063（loader attach 確認）。
- `grep -n governanceAggregation src/views/admin/index.ejs` → 0 命中（EJS 未引用確認）。
- `grep -n "Governance signals\|governanceSignals" src/views/admin/index.ejs` → L757/759/760/1011/1017（既有 raw section / posts index badge 確認）。
- **未跑 `npm run validate:content`**：本 acceptance 為 docs-only，未改 source / settings / content；preanalysis commit 已確認為 docs-only（baseline `validate:content` 0/94/84 carry）；無 repo-convention 影響 → 無需重跑。**未** build / deploy。

---

## J. Explicit non-actions

- ❌ source implementation
- ❌ UI / EJS / views source change
- ❌ content / frontmatter mutation
- ❌ Admin write / apply / fix
- ❌ filter chip
- ❌ Posts-index count badge
- ❌ suggested fix / prescription
- ❌ validator-warning join
- ❌ Blogger repost
- ❌ GitHub Pages build / deploy
- ❌ ads / commerce unrelated change
- ❌ npm install
- ❌ merge / rebase / reset / amend / force push / unrelated cleanup
- ❌ CLAUDE.md compression / reorder
- ✅ 唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync

---

## K. Next recommended phase

- **`20260616-admin-governance-aggregation-detail-panel-readonly-ui-implementation-a`**（Option A；**NOT docs-only**；單檔 `src/views/admin/index.ejs` additive read-only block；render `byClass` + `signals[]` 固定順序列舉 + same-source 註；保留既有 raw dl；沿用既有 CSS；**須 user explicit approval**）。
- 紅線：Posts-index count badge / filter chip / suggested-fix / per-post prescription / validator-warning join / validation report schema / write path / cross-post loader aggregation migration 一律獨立 phase + user explicit approval。

---

（本紀錄結束）
