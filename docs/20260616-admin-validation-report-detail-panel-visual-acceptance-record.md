# ADMIN — Validation Report Detail-Panel Rendered / Visual Acceptance Record

- **Phase**：`20260616-admin-validation-report-detail-panel-visual-acceptance-docs-only-a`
- **日期**：2026-06-16（新 session）
- **性質**：docs-only acceptance（rendered / visual acceptance against generated `.cache/pages/admin/index.html`）。**不**改 UI source / loader / validator / reporter / content / settings；**不**做 L1100 comment tidy；**不**新增 Posts-index badge / summary-card 欄位 / filter chip / write path / per-post prescription / validator `--report-json`。唯一 mutation = 本 record doc + CLAUDE.md 極小 ledger sync。
- **承接**：pm-16 reporter（`docs/20260616-admin-validation-report-schema-and-join-contract-preanalysis.md` §G.2）→ pm-17 smoke guard → pm-18 detail-panel read-only consume → pm-19 governance footnote sync → pm-20 System-checks line sync。本 phase 對整條 validator-warning 線之 rendered 結果做 acceptance。

---

## A. Baseline

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
HEAD           : feed1f2 == origin/main
working tree   : clean
ahead / behind : 0 / 0
latest commit  : feed1f2 fix(admin): sync system-checks validator line
```

→ baseline 完全符合 phase 指示。未執行 merge / rebase / reset / amend / force push。

---

## B. 驗證方法

本 acceptance 為 **rendered-artifact acceptance**：以 read-only / generated-cache 指令重建 report 與 admin 頁，並對 generated `.cache/pages/admin/index.html` 做結構檢查（grep / count）。**未** deploy、未 push gh-pages、未開 Blogger / AdSense 後台、未改任何 source。

report 為 git-ignored cache（`.cache/data/validation-report.json`，`asOf: 2026-06-16T08:37:36.070Z`，totals `0/94/84`），admin 頁為 dev-mode-only render（`build-github.js --mode=dev` → `.cache/pages/admin/index.html`；prod build 不產出 admin）。

---

## C. Acceptance（逐項，10/10 PASS）

| # | 要求 | rendered 證據 | 結果 |
|---|---|---|---|
| 1 | Validation warnings 區塊**不再是 deferred placeholder** | 11 個區塊 header 皆為「Validation warnings (read-only · validate:content report)」；舊「(deferred)」placeholder count = **0** | ✅ |
| 2 | report exists → 顯示 report-backed 狀態 + asOf / generated report 提示 | 每個 detail panel footer 有「report asOf：…（git-ignored cache，可能過時；validator 為 ground truth）」+「重跑 `npm run report:validation`」，asOf footer **×11** | ✅ |
| 3 | report missing → 不 crash，顯示「尚未產生 report」fallback | 設計：`loadValidationReportContext()` `try/catch` → 缺檔/parse error 回 `{available:false}` → `derivePostValidationReport` 回 `state:'no-report'` → EJS 顯「尚未產生」+ 指令提示；由 `check:admin-validation-consume` case 1/2 鎖定。本次 report 存在 → rendered no-report count = **0**（預期；graceful fallback 為 by-design + smoke-covered，非本次 render 觸發） | ✅ |
| 4 | status-excluded draft → 顯「未驗證 / status-excluded」**非 0 warnings** | rendered「未驗證」badge **×3**（= 3 篇 draft：`phonics-practice-sheet-download` / `sample-book-review` / `draft-book-review`）；文案「status=…（draft/archived 不在 validator universe；非 0 warnings）」 | ✅ |
| 5 | ready/published 且無 production warning → clean / 0 warnings | rendered「0 warnings ✓」**×8**（= 11 − 3 draft）；文案「此文章未列於 report（ready/published 且無 issue）」 | ✅ |
| 6 | governance footnote 已從 deferred 改成 report-backed | per-post「Aggregation summary」footnote「validator warnings 改由上方 Validation warnings 區段讀取 `validate:content` 之 generated report」**×11**；stale「validator warnings 仍 deferred」**×0** | ✅ |
| 7 | System-checks validator line 已改為「per-post detail panel 已 report-backed；index/summary 層尚未實作」 | rendered「per-post detail panel 已由 generated validation report read-only consume 呈現；index / 彙總層尚未實作」**×1**；stale「per-post 計數仍 deferred」**×0** | ✅ |
| 8 | rendered HTML 無 undefined / null leak | `>undefined<` **×0**、`>null<` **×0** | ✅ |
| 9 | 不要求看到 matched production warnings（production warnings = 0，84 warnings 全在 fixtures） | report kind 分布 **post 0 / fixture 84 / settings 0**；rendered matched（「errors / warnings」dt）**×0**。**合理現況**：admin loader universe = production posts（不含 fixtures），validator 之 84 issue-post 全為 `content/validation-fixtures/**`，且 production posts 0 warning → admin 無任何 post 命中 report entry → matched 必為 0。印證 pm-14 universe insight | ✅ 合理 |
| 10 | 不把 validation warning count 加到 Posts-index / summary card | 本 phase 未動 Posts-index / summary card；計數彙總**仍屬未來獨立 phase**（System-checks line 已誠實標示「index / 彙總層尚未實作」） | ✅ 明確記錄 |

**Verdict = PASS（10/10）**。

---

## D. Commands run and results

| Command | Result |
|---|---|
| `npm run validate:content` | `0 error(s) / 94 warning(s) on 84 post(s)` |
| `npm run report:validation` | `0/94/84`；bySourcePath=84 / settings=0 / fixtures=84 / crossPost=2 |
| `npm run check:validation-report` | **14 / 0** |
| `npm run check:admin-validation-consume` | **12 / 0** |
| `node src/scripts/build-github.js --mode=dev` | admin (dev-mode) rendered: **11 posts**，無 EJS error |

rendered `.cache/pages/admin/index.html`：11 validation sections / 3 未驗證 / 8 clean / 0 no-report / 0 matched / 11 asOf footer / footnote report-backed ×11（stale ×0）/ system-checks new wording ×1（stale ×0）/ undefined·null leak ×0。

carry（admin dev-only，不在 build:blogger 路徑，未 re-run）：`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check-commerce-affiliate-resolver` 23/0、`check:blogger-adsense-output` 85/0、`check:admin-governance-aggregation` 16/0。

---

## E. L1100 non-rendered EJS comment（未處理；說明）

`src/views/admin/index.ejs` L1100 位於 governance aggregation section 之 EJS **comment block**（`<%# … -%>`，L1096–1102），仍寫「非 validator warning count；validator warnings 仍 deferred（見上方 Validation warnings 區段）」。

- **未處理原因**：它是**原始碼註解、不 render**（rendered HTML 無此字串），**不造成任何 UI 文案不一致**；屬 **cosmetic-only / out-of-scope**（本 phase 為 docs-only acceptance，且明令「不做 L1100 comment tidy」）。
- 如要 tidy，可另開極小單檔 EJS-comment phase；不影響任何 rendered 行為。

---

## F. Caveats

- 本 record 為 **rendered-artifact acceptance**（對 generated `.cache/pages/admin/index.html` 之結構 grep / count），**非** browser screenshot / DOM 互動驗收；如需人眼 browser 視覺確認可另開 record。
- report 為 git-ignored cache（`asOf` 時點快照）；admin 只讀不重跑 validator，validator（`npm run validate:content`）仍為 ground truth。
- matched state 在 production warnings = 0 之現況下不出現；其顯示正確性由 `check:admin-validation-consume`（synthetic input）case 5/6/9/10 鎖定。

---

## G. Non-actions（本 phase）

- ❌ 改 validator rule / reporter schema / content / settings / loader 邏輯 / `src/views/admin/index.ejs` / governanceAggregation·suggested-fix
- ❌ L1100 comment tidy
- ❌ Posts-index 計數 badge / summary-card 統計欄位 / filter chip / write path / per-post prescription / validator `--report-json`
- ❌ deploy / gh-pages / Blogger repost / npm install / reset·rebase·amend·force push / unrelated cleanup / CLAUDE.md 壓縮·重排
- ✅ 唯一 mutation = 本 record doc + CLAUDE.md 極小 ledger sync

---

## H. Recommended next phase

- 保守 idle freeze（validator-warning 線 reporter → smoke → detail consume → footnote → system-checks 文案已全程一致且 rendered-accepted）。
- 或 optional：browser 人眼 visual acceptance record（screenshot）；或 L1100 EJS-comment tidy（cosmetic 單檔，須 approval）。
- 紅線：Posts-index 計數 badge / summary-card 補欄 / filter chip / write path / per-post prescription / validator `--report-json` 一律獨立 phase + user explicit approval。

---

（本紀錄結束）
