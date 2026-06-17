# ADMIN validator state filter chip — browser human-eye PASS record（docs-only）

> Phase: `20260617-am-admin-validator-state-filter-browser-pass-record-docs-only-a`
> Date: 2026-06-17 08:33+
> Type: docs-only acceptance record（不改 source / view / scripts / loader / reporter / validator / content / settings / package / dist / gh-pages / cache；不 build / 不 deploy / 不 repost）
> Scope: 記錄 `c7b36ee`（`feat(admin): add validation state filter`）之 browser human-eye PASS，並收尾 Phase B（filter chip）全鏈。Phase C（list-level asOf banner）+ per-post prescription / summary card 補欄 / loader cross-post aggregation migration / validator `--report-json` flag 維持紅線 deferred until explicit approval。

---

## 1. Phase name

`20260617-am-admin-validator-state-filter-browser-pass-record-docs-only-a`

承接：
- `20260617-am-admin-validator-count-badge-filter-chip-preanalysis-docs-only-a`（commit `d17648d`；docs-only preanalysis；§6.2 / §9.2 Phase B 路線）
- `20260617-am-admin-validator-warning-badge-list-implementation-a`（commit `7e4d9cf`；Phase A source landed）
- `20260617-am-admin-validator-warning-badge-render-preflight-readonly-a`（read-only preflight；Phase A）
- `20260617-am-admin-validator-warning-badge-browser-pass-record-docs-only-a`（commit `5793bf6`；Phase A docs acceptance）
- `20260617-am-admin-validator-state-filter-chip-list-implementation-a`（commit `c7b36ee`；Phase B source landed；`src/views/admin/index.ejs` +27/−0）

---

## 2. Accepted commit

| 項目 | 值 |
|---|---|
| commit | `c7b36ee` |
| subject | `feat(admin): add validation state filter` |
| 變更檔 | `src/views/admin/index.ejs`（+27 / −0） |
| 範圍 | 3 處最小編輯：(1) `<optgroup label="validation">` + 4 個 option（issues / clean / excluded / no-report；放在 `</select>` 前最後 1 組）；(2) `validationStateAttr` derive 於 `posts.forEach` 開頭（純消費 `p.validationReport.state`；defensive `unknown` fallback）+ `data-validation-state` 屬性於每 `<tr.post-row>`；(3) `case 'validation':` 分支於 `matchesFilter` switch（dataset 純比對） |
| 不變 | loader（`load-admin-posts.js`）、reporter（`report-validation.js`）、validator（`validate-content.js`）、reporter schema、`p.validationReport` shape、CSS、`applyFilters` 排序 / 搜尋 / show-all toggle、其它既有 filter case（status / channel / sourceSite / completeness / fbBadge / contentKind / category / series）、validator warning badge、governance badge（`gov ✓` / `gov: N`）、detail panel `Validation warnings` section、其它任何 view 檔 |

---

## 3. Browser URL

- `http://localhost:5175/admin/#posts`
  - ⚠️ 預期 port 5173 + 5174 因 user environment 有先前殘留 Node 占用，Vite 自動換 5175；不影響功能
  - 不影響 acceptance；本記錄沿用 5175 為實際 user-tested URL
- Server start：`npm run dev`（auto-trigger `predev` → `node src/scripts/build-github.js --mode=dev` → 寫 `.cache/pages/admin/index.html`）
- Browser：Chrome on Windows
- Session：vite dev `v8.0.10` ready in 520 ms at port 5175；無 startup error

---

## 4. Human-eye PASS checklist

| # | 項目 | 結果 |
|---|---|---|
| 1 | ADMIN Posts list 可正常顯示 | ✅ PASS |
| 2 | filter 下拉選單出現 validation optgroup | ✅ PASS |
| 3 | 選 `validation: clean` 後，可正常篩出 clean rows | ✅ PASS |
| 4 | 選 `validation: excluded` 後，可正常篩出 excluded rows | ✅ PASS |
| 5 | 選 `validation: issues` 後，顯示 0 row，empty state 正常 | ✅ PASS |
| 6 | 選 `validation: no report` 後，顯示 0 row，empty state 正常 | ✅ PASS |
| 7 | 切回 `all` 後，可回到 11 row | ✅ PASS |
| 8 | validator badge / governance badge 仍正常，可見 `warn ✓` 與 `gov ✓` | ✅ PASS |
| 9 | 點開 row 後，detail panel 仍正常，Validation warnings 區段仍正常 | ✅ PASS |
| 10 | 沒有明顯表格斷裂、欄位跑版或 JS console error | ✅ PASS |

→ User 提供 visual check screenshots；user 主動檢查 Chrome console 無錯誤；10/10 全 PASS。

---

## 5. Visual evidence summary

User-reported observations（recorded as-stated）：

- **Posts list opened**：ADMIN Posts list 正常 render；11 row 全可見
- **validation optgroup visible**：filter 下拉選單最後 1 組為 `validation` optgroup，含 4 個 option（issues / clean / excluded / no report）
- **validation: clean works**：篩出 clean rows（ready/published 且 0 warnings；預期 8 row）
- **validation: excluded works**：篩出 excluded rows（draft / archived；預期 3 row）
- **validation: issues → 0 row empty state works**：production baseline 0 issue；empty-filter-state UI 正常觸發
- **validation: no report → 0 row empty state works**：reporter cache 仍 fresh（report present 全篇）；empty-filter-state UI 正常觸發
- **all → 11 row works**：切回 `all` 回到全 11 row；計數 / row 數恢復
- **validator badge / gov badge still visible**：`warn ✓`、`gov ✓` 顯示與 Phase A 結果一致；本 phase 未動 badge
- **detail panel still opens normally**：點 row 展開後 Validation warnings 區段（pm-18 四態）、FB sidecar / sourceKey selector / future write checklist / source path / SEO dry-run 5 個 collapsible 區段、Aggregation summary 全照舊
- **no obvious layout break**：表格高度、欄位寬度、badge 排列、filter 下拉、count display 全無 regression

---

## 6. Console note

- **Chrome console checked by user**：user explicit「Chrome console 沒錯誤」
- **No console errors observed**：切換 filter / open detail panel / 切回 all 全程未觸發 JS error
- **Record as visual PASS + user console PASS**：本 acceptance 同時涵蓋 human visual + user-confirmed console；比前面幾個 phase 之 acceptance 更完整一階（前者僅 visual + user explicit「我沒有觀察到畫面異常」，本次另含 user explicit「console 沒錯誤」）
- 若日後 DevTools 浮現 filter switch 之 edge-case warning，可獨立 phase 補做 console capture record；本 phase 不擴 scope

---

## 7. Validation / render carry-forward（自 implementation phase）

### 7.1 smoke / validation guards

| guard | 結果 | 備註 |
|---|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts** | baseline match；production-post warnings = 0；94 全來自 `content/validation-fixtures/` |
| `npm run check:admin-governance-aggregation` | **16 passed / 0 failed** | baseline match |
| `npm run check:validation-report` | **14 passed / 0 failed** | baseline match；B2「totals match validate:content baseline (0/94/84)」PASS |
| `npm run check:admin-validation-consume` | **12 passed / 0 failed** | baseline match |
| `git diff --check` | no whitespace errors | source clean |

### 7.2 Rendered HTML counts（`.cache/pages/admin/index.html` 自 predev 295 ms 寫入）

| 檢查 | 預期 | 觀察 | 結果 |
|---|---|---|---|
| `<optgroup label="validation">` | 1 | **1** | ✅ |
| `value="validation:"` options | 4 | **4** | ✅ |
| `data-validation-state` 屬性 | 11（一 row 一個） | **11** | ✅ |
| `clean`（ready/published 且 0 warnings） | 8 | **8** | ✅ |
| `excluded`（draft / archived） | 3 | **3** | ✅ |
| `issues`（matched + counts > 0） | 0（production baseline 0） | **0** | ✅ |
| `no-report` | 0（reporter cache 已產生） | **0** | ✅ |
| `unknown`（defensive） | 0（never reached in normal state） | **0** | ✅ |
| `warn def.` 舊 placeholder（carry from Phase A） | 0 | **0** | ✅ |
| `warn ✓` count（carry from Phase A） | 8 | **8** | ✅ |
| `warn n/a` count（carry from Phase A） | 3 | **3** | ✅ |
| `gov ✓` count（universe untouched） | 10 | **10** | ✅ |
| `gov: N` count（universe untouched） | 1 | **1** | ✅ |

→ 結果：Phase B filter 對 11 篇之 5-bucket 分類（clean / excluded / issues / no-report / unknown）= 8 + 3 + 0 + 0 + 0；與 Phase A validator warning badge 對 5-state 分類（`warn ✓` / `warn n/a` / `warn N` / `err M warn N` / `warn ?`）= 8 + 3 + 0 + 0 + 0 **內部一致**；governance badge 對 universe（all-status taxonomy）之 10 `gov ✓` + 1 `gov: N` 並排但不混。

---

## 8. Explicit non-actions

- ❌ 未改 `src/` / `views/` / `scripts/` / `loader/reporter/validator` / `content/` / `settings/` / `package.json` / `package-lock.json` / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`（本 docs-only acceptance phase 範圍；`.cache/` 屬 predev 寫入之 build artifact，非 source mutation）
- ❌ 未啟動 write path（Admin Apply / Save / Auto-fix / admin-write-cli / middleware / FB sidecar 真實寫入）
- ❌ 未做 per-post prescription（「應改為 X」「應加 tag Y」規則引擎）
- ❌ 未推進 Phase C（list-level asOf banner）；preanalysis §6.3 / §9.3 維持 deferred
- ❌ 未推進 summary card 補 validator 欄（preanalysis §9.4 / pm-2 §5 priority 4 紅線）
- ❌ 未碰 validator `--report-json` flag（Option B；動 ground truth）
- ❌ 未動 loader cross-post aggregation migration
- ❌ 未自動跑 `npm run report:validation` / view-side 重算 validator rule
- ❌ 未動 detail panel `Validation warnings` section（pm-18 既有四態維持）
- ❌ 未動 validator warning badge（Phase A `7e4d9cf` 五態維持）
- ❌ 未動 governance badge / governance summary card / Aggregation summary（universe 維持）
- ❌ 未動既有 status / channel / sourceSite / completeness / fbBadge / contentKind / category / series filter；未動 sort / search / show-all toggle
- ❌ 未 build / deploy / push gh-pages / Blogger 重貼 / 任何 publishing pipeline 動作
- ❌ 未啟動 GA4 / AdSense / Search Console / Google Drive / Blogger 後台動作
- ❌ 未啟動 reverse UTM deploy（pm-26 gate 維持 BLOCKED）
- ❌ 未 `npm install` / 動 dependencies / lockfile
- ❌ 未 merge / rebase / reset / amend / cherry-pick / force-push / 跳 hooks
- ❌ 未對 Phase 1 final 宣告做任何降級或重新封存
- ❌ 未重做 ADMIN checkpoint / BLOG Phase 1 mainline checkpoint 任一已完成項目
- ❌ 未壓縮 / 重排 CLAUDE.md
- ❌ 未試圖 kill 5173 / 5174 user-environment leftover Node processes（已於本 chain 多次明示；user 自行處理）

---

## 9. Final verdict

- ✅ **Browser visual PASS**：10/10 human-eye checklist item passed；user explicit confirmation
- ✅ **User console PASS**：user 主動 Chrome console 檢查；無錯誤；本記錄 record as visual + user console PASS（比前 phase acceptance 完整一階）
- ✅ **Validator filter Phase B accepted**：`docs/20260617-admin-validator-count-badge-filter-chip-preanalysis.md` §6.2 / §9.2 之 Phase B 路線（filter chip；4 個 read-only option；動 Posts index search/filter/sort JS 1 個分支；pm-2 §9 紅線之**唯一**保留 Posts index JS 變更紅線 - 已 explicit approval 解鎖並完成）implementation 全鏈完成全閉環：preanalysis（`d17648d`）→ Phase A implementation（`7e4d9cf`）→ Phase A render-preflight → Phase A browser PASS（`5793bf6`）→ **Phase B implementation（`c7b36ee`）** → Phase B render-preflight → Phase B browser PASS（本記錄）
- ✅ **ADMIN Posts list validation visibility chain complete**：
  - **badge-only Phase A accepted**（commit `5793bf6`）：5 態 honest badge；驅動於 pm-18 既有 loader derive
  - **filter Phase B accepted**（本記錄）：4 個 honest filter；驅動於相同 `p.validationReport.state`；row dataset 純比對；零 loader 變更
  - **Phase A + Phase B universe boundary 一致**：8 clean + 3 excluded + 0 issues + 0 no-report；與 validator warning badge 之 5-state 同源；不混 governance；不混 draft/no-report 為 clean
- ⏸ **Further work remains deferred until explicit approval**：
  - Phase C（list-level asOf banner；preanalysis §6.3 / §9.3）
  - Per-post prescription rule engine（preanalysis §9.4 / pm-2 §6 紅線）
  - Summary card 補 validator 欄（preanalysis §9.4 / pm-2 §5 priority 4 紅線）
  - Validator `--report-json` flag（Option B；pm-14 §G 紅線）
  - Loader cross-post aggregation migration（pm-22 §F.2 排除清單）
  - ADMIN R2 / R3 / R4 / R5 readability（須個別 phase + user approval）
  - 任何 Blogger / GA4 / AdSense / Google Drive / Search Console 後台動作

---

## 10. Phase chain summary

| Phase | 類型 | Commit | 範圍 |
|---|---|---|---|
| `20260617-am-admin-continuation-triage-after-claude-md-warning-resolved-readonly-a` | docs-only triage | `da03c0d` | E.1 / E.2 候選清單 |
| `20260617-am-admin-seo-dryrun-details-collapse-implementation-a` | implementation | `b0a21ad` | SEO dryrun `<details>` 收合 |
| `20260617-am-admin-seo-dryrun-collapse-render-preflight-readonly-a` | read-only verify | （無 commit） | smokes + structure check |
| `20260617-am-admin-seo-dryrun-collapse-browser-pass-record-docs-only-a` | docs-only acceptance | `48baabf` | SEO dryrun browser PASS |
| `20260617-am-admin-validator-count-badge-filter-chip-preanalysis-docs-only-a` | docs-only preanalysis | `d17648d` | Phase A / B / C 拆分 |
| `20260617-am-admin-validator-warning-badge-list-implementation-a` | implementation | `7e4d9cf` | Phase A：5 態 validator warning badge |
| `20260617-am-admin-validator-warning-badge-render-preflight-readonly-a` | read-only verify | （無 commit） | Phase A：smokes + 13 項 structure check |
| `20260617-am-admin-validator-warning-badge-browser-pass-record-docs-only-a` | docs-only acceptance | `5793bf6` | Phase A：browser PASS |
| `20260617-am-admin-validator-state-filter-chip-list-implementation-a` | implementation | **`c7b36ee`** | Phase B：4 個 read-only validation filter option |
| `20260617-am-admin-validator-state-filter-browser-pass-record-docs-only-a` | docs-only acceptance | （本 phase） | Phase B：browser PASS + user console PASS |

→ 全鏈無 source second pass；無 hot-fix；無 backout；mirror pm-2 §5 priority order 與 pm-18 既有四態 ground truth 一致。

---

（本文件結束）
