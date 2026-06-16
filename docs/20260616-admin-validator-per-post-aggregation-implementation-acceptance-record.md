# ADMIN — Validator Per-Post Aggregation Implementation Acceptance Record

- **Phase**：`20260616-admin-validator-per-post-aggregation-implementation-acceptance-readonly-a`
- **日期**：2026-06-16（13:37 起；pm session）
- **性質**：read-only acceptance record（**不**做新的 source implementation；**不**改 src / views / content / settings / package / tests；**不**做 UI；**不**做 validator-warning join；**不**做 Admin write/apply/fix；**不** build/deploy；**不** npm install）。唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync。
- **Reviewed commit**：`08edc53 feat(admin): aggregate validator signals per post`
- **承接**：
  - `docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`（pm-2；授權範圍依據）
  - `docs/20260616-admin-validator-per-post-aggregation-preanalysis-acceptance-record.md`（pm-3；接受 Option C+D 現狀、列前置條件）

---

## A. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : 08edc53 == origin/main
working tree   : clean
ahead / behind : 0 / 0
latest commit  : 08edc53 feat(admin): aggregate validator signals per post
```

→ baseline 完全符合 phase 指示。未執行任何 merge / rebase / reset / amend / force push。

---

## B. Files reviewed（read-only）

- `docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`（pm-2）
- `docs/20260616-admin-validator-per-post-aggregation-preanalysis-acceptance-record.md`（pm-3）
- `src/scripts/load-admin-posts.js`（committed state；helper + attach）
- `src/scripts/check-admin-governance-aggregation.js`（committed smoke）
- `package.json`（committed script entry）
- `CLAUDE.md`（ledger 現況）
- `git show 08edc53`（實際 commit scope + diff）

---

## C. Reviewed commit scope（`git show --stat 08edc53`）

```
 CLAUDE.md                                         |  2 +
 package.json                                      |  1 +
 src/scripts/check-admin-governance-aggregation.js | 194 +++++++++++++++++
 src/scripts/load-admin-posts.js                   | 52 +++++
 4 files changed, 249 insertions(+)
```

→ 4 檔、純 insertions（0 deletions）。`load-admin-posts.js` 之兩個 hunk = (1) 新增 `GOVERNANCE_SIGNAL_ORDER` + `aggregatePostGovernanceSignals` 純函式；(2) 既有 governanceSignals 迴圈內 attach `p.governanceAggregation`。**無**任何 content/frontmatter、views/EJS、settings、validator rule 變更。

---

## D. Acceptance verdict

**PASS（read-only acceptance）。**

理由：commit `08edc53` 完全落在 pm-2 preanalysis 之 Option D（從既有 per-post `governanceSignals` 派生，不接 validator warnings）授權範圍內；pm-3 接受紀錄要求的 validator-warning join 前置（schema+join-contract preanalysis）並未被跳過——本實作刻意**不**碰 validator-warning join，`validationReadiness` 維持 `deferred`。實作為 additive、deterministic、read-only、純函式，並附 synthetic-input smoke（16/0）。validate baseline 不變（0/94/84）。

---

## E. Scope acceptance（逐項）

| 項目 | 結果 | 證據 |
|---|---|---|
| commit 只含授權範圍內 admin data-layer aggregation | ✅ | 4 檔 = loader helper + smoke + npm script + ledger；無其他 |
| 無 content / frontmatter mutation | ✅ | diff 無 `content/**` / `*.md`（除 docs/CLAUDE.md）|
| 無 UI / EJS / view 變更 | ✅ | diff 無 `src/views/**`；helper 只 attach derived 欄位，view 忽略則 backout=0 |
| 無 settings / tags.json / categories.json 變更 | ✅ | diff 無 `content/settings/**` |
| 無 validator rule semantic change | ✅ | diff 無 `validate-content.js`；helper 不重定義 rule |
| 無 Admin write / apply / fix path | ✅ | 無 `<form>`/`<button>`/`fetch`/`onclick`；無 safe-write / middleware wiring |

---

## F. Implementation acceptance（逐項）

| 檢查 | 結果 | 說明 |
|---|---|---|
| `aggregatePostGovernanceSignals(signals)` 只從既有 `governanceSignals` 派生 | ✅ | 只讀入參 `signals` 之 5 欄；無 validator 呼叫、無檔案 I/O、無 settings 讀取 |
| 沒有重新定義 validator rules | ✅ | 僅 map 既有 derived 欄位 → 列舉結構；rule 判定仍在 `derivePostGovernanceSignals` / validator |
| deterministic | ✅ | 純值；無 `Date`/`Math.random`/I-O；smoke case 15「repeated calls deep-equal」+「欄位宣告順序無關」 |
| 固定 signal order | ✅ | `GOVERNANCE_SIGNAL_ORDER` 常數（unknown-tag → unknown-category → cross-site-mismatch-tag → cross-site-mismatch-category）；smoke case 9 鎖順序 |
| 不 mutate input | ✅ | 不寫回 `s`；新建 `list`/`byClass`；smoke case 16 驗 JSON 快照不變 |
| 只輸出 read-only derived data | ✅ | 回傳 `{ hasSignals, totalSignalCount, byClass, signals[] }` 純資料；無 prescription / 無「應改為 X」 |
| `validationReadiness` 維持 deferred / untouched | ✅ | diff 未觸及 `validationReadiness`（仍 `perPostWarningCount:'deferred'`）|
| validator-warning join 仍未實作 | ✅ | 無相對⇄絕對 sourcePath join；無 validator JSON output；無 reporter script |

補充防呆（smoke 涵蓋）：flag 嚴格 `=== true`（非 true 不計）；count 對負數 / NaN / 非 number → 0；小數 count → `Math.floor`；只列 count>0；`totalSignalCount` 與既有 `signalSum` 交叉檢核一致。

---

## G. Test acceptance

- **synthetic input only**：✅ smoke 只用 `makeSignals()` 合成物件；不讀 content / settings；不打 API；不寫檔。
- **覆蓋項目**：
  - empty / null / invalid input → cases 1–4（null / undefined / 非 object / 全零）✅
  - strict true flag → case 12（非 true flag 不計）✅
  - count normalization → cases 13（負數 / NaN / 非 number → 0）、14（小數 floor）✅
  - canonical order → case 9（四訊號固定順序）+ case 15（欄位順序無關）✅
  - non-mutation → case 16 ✅
  - byClass / totalSignalCount / hasSignals → cases 5 / 9 / 10（含 totalSignalCount == signalSum 交叉檢核）✅
- **package.json**：只新增 `check:admin-governance-aggregation` 一條 smoke command；無其他 script / 無 dependency 變動。✅

---

## H. Validation / checks（本 acceptance 重跑）

| check | 結果 | 備註 |
|---|---|---|
| `npm run check:admin-governance-aggregation` | **16 / 0** | re-run，全 pass |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts** | baseline 不變 |

未重跑（carry-forward；本 acceptance 未動 source/settings/dist，且非相關路徑）：
- `check:adsense-resolver` 34/0 · `check:adsense-article-block` 13/0 · `check:adsense-anchor-wiring` 14/0 · `check-commerce-affiliate-resolver` 23/0（implementation phase 已驗，本 acceptance 無變更）
- `check:blogger-adsense-output` 85/0 —— 需 `build:blogger` 產物；admin loader 為 dev-only 不在 build:blogger 路徑；本 acceptance 不 build，故 by construction 不受影響。

---

## I. Explicit non-actions

- ❌ source implementation beyond acceptance（未新增 / 未改 helper / loader / smoke）
- ❌ UI / EJS / views
- ❌ content / frontmatter / markdown mutation
- ❌ settings / tags.json / categories.json
- ❌ Admin write / apply / fix（無 Apply/Save/Auto-fix/Write/Mutate）
- ❌ per-post prescription（無「應改為 X」規則引擎）
- ❌ validator rule change / validator JSON output / reporter script / validator-warning join
- ❌ Blogger repost
- ❌ GitHub Pages build / deploy / push gh-pages
- ❌ ads / commerce unrelated change
- ❌ npm install / package dependency 變更
- ❌ merge / rebase / reset / amend / force push / unrelated cleanup
- ❌ CLAUDE.md compression / reorder（僅 append 極小 ledger 行）
- ✅ 唯一 mutation = 本 acceptance record doc + CLAUDE.md 極小 ledger sync

---

## J. Next recommended phase

- **`20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-docs-only-a`**（推薦；docs-only）：規劃如何把 `governanceAggregation` 接到 detail panel / Posts index 之 **read-only** 顯示（不做 write / filter chip / 跳轉 / per-post prescription）。
- 或 `20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a`（docs-only）：validator-warning per-post join 路線之前置（pm-3 已列為必經前置）。
- **紅線**：write path / per-post prescription / filter chip / Posts-index 計數 badge / loader 跨篇聚合搬遷 / validator-warning join 一律獨立 phase + user explicit approval。

---

（本紀錄結束）
