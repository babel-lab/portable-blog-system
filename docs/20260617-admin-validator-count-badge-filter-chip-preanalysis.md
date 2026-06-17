# ADMIN — Validator Warning Count Badge + Filter Chip Preanalysis（docs-only）

> Phase: `20260617-am-admin-validator-count-badge-filter-chip-preanalysis-docs-only-a`
> Date: 2026-06-17 07:59+
> Type: docs-only preanalysis（**不**改 source / view / scripts / loader / validator / content / settings / package；**不** build / deploy / repost / GA4 / AdSense / Search Console；**不**新增 write path / Apply / Save / Auto-fix；**不**改 MEMORY.md / memory/）
> Scope: 規劃 ADMIN Posts list 列表「validator warning count badge + filter chip」最小 read-only UI 升級。承接 `docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`（pm-2）§5 priority 3 / `docs/20260616-admin-validation-report-schema-and-join-contract-preanalysis.md`（pm-14） §D 之既有 join contract + 已 landed `p.validationReport` loader derive（pm-18）。

---

## A. Baseline

| 項目 | 值 |
|---|---|
| pwd | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `48baabf`（`docs(admin): record seo dry-run collapse browser pass`） |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |

→ baseline 完全符合 phase 指示。未做 source / merge / rebase / reset / amend / force push。

---

## 1. Phase summary

| 屬性 | 值 |
|---|---|
| 類型 | **read-only visibility improvement**（純 view-side 顯示升級） |
| 不屬於 | validator 規則變更 / severity 變更 / class 對映變更 / reporter schema 變更 / loader 重算 / auto-fix / 寫入 / per-post prescription |
| 變更性質 | view-side（badge 與 filter）；**0** validator rule 變更；**0** 新 loader 欄位（沿用既有 `p.validationReport`） |
| 同伴 phase（先決條件，皆已 landed） | pm-2 priority taxonomy + Option A2、pm-14 schema + join contract、pm-16 reporter（`report:validation`）、pm-17 reporter smoke（`check:validation-report` 14/0）、pm-18 detail panel four-state consume + smoke（`check:admin-validation-consume` 12/0） |
| Phase 1 完成度影響 | 0（Phase 1 已 final；ADMIN dev-mode-only；不進 prod build / dist / deploy） |

→ 等於把 detail panel 已展示之四態（`no-report` / `status-excluded` / `matched` / `clean`）**對齊**到 Posts list 之既有 `warn def.` placeholder（line 755）。

---

## 2. Current state（read-only intake）

### 2.1 Validation report 如何產生 / consume

| 步驟 | 路徑 | 來源 |
|---|---|---|
| 產生 | `npm run report:validation` → `src/scripts/report-validation.js` | pm-16；read-only reporter；`import { validateContent }` → 序列化 → `.cache/data/validation-report.json`（git-ignored）；**不改 validator rule** |
| Smoke（reporter 端） | `npm run check:validation-report` → `src/scripts/check-validation-report.js` | pm-17；14/0；synthetic + real-report assertions（含 B2 totals match `validate:content` 0/94/84） |
| Consume（loader 端） | `src/scripts/load-admin-posts.js` `loadValidationReportContext()` + `derivePostValidationReport(ctx, status)`（L1059–1098） | pm-18；per-post additive `p.validationReport`；4 態純函式；read-only / never mutates inputs |
| Smoke（consume 端） | `npm run check:admin-validation-consume` → `src/scripts/check-admin-validation-consume.js` | pm-18；12/0；synthetic-only |

Per pm-14 §C envelope + §D.2 universe reconciliation：

- **report = git-ignored cache**；缺檔不 crash（`reportAvailable: false`）。
- **join key** = repo-relative posix sourcePath；admin 端 `path.relative(PROJECT_ROOT, abs).split(path.sep).join('/')`（`load-admin-posts.js` L1055–1057 `toNormalizedKey`）↔ report `bySourcePath[].sourcePath`。
- **universe**：validator 僅掃 ready/published；draft/archived 在 report **不會出現**；admin 端以 `status` 判斷而顯「未驗證」**而非 0 warnings**（pm-2 §1.4 / pm-14 §B.4 核心紅線）。

### 2.2 Posts detail panel 目前如何顯示 Validation warnings

`src/views/admin/index.ejs` L999–1048 既有「Validation warnings」section（pm-18 landed；R1 collapsible browser PASS）：

| `vr.state` | UI 顯示 |
|---|---|
| `no-report` | 「尚未產生 report；請先執行 `npm run report:validation`」inline help（無計數） |
| `status-excluded` | 「未驗證（draft/archived；validator 不掃；non-visible status）」（無計數；不顯 0） |
| `matched`（has report entry） | `<badge> errorCount error / warningCount warning</badge>` + `byClass` enumeration + brief `issues[].type/class/severity` 列舉（最多 N 筆）+ asOf footer |
| `clean`（ready/published, no entry） | `<badge b-ok> 0 warnings (clean as of asOf)</badge>` + asOf footer |

`p.validationReport` shape（pm-18 stable）：

```js
{
  reportAvailable: boolean,                 // false → no-report
  state: 'no-report' | 'status-excluded' | 'matched' | 'clean',
  asOf: string | null,                       // ISO timestamp；缺 report 時 null
  // matched only:
  warningCount?: number,
  errorCount?: number,
  byClass?: object,
  issueCount?: number,
  issues?: Array<{ type, class, severity }>,
  // status-excluded only:
  status?: string,
}
```

### 2.3 Posts list 目前 `warn def.` placeholder 現況

`src/views/admin/index.ejs` L755（readiness 欄位內）：

```ejs
<span class="badge b-info" title="per-post validation aggregation deferred; run npm run validate:content">warn def.</span>
```

特性：

- 單一 placeholder；**所有** 11 篇 post 都顯 `warn def.`（全 row 一致）
- 無計數；無 state 區分；無 asOf；title 提示「run npm run validate:content」
- 緊接其下（L760–761）有獨立的 `gov: N / gov ✓` badge（governance signals；屬不同 universe，**含 draft**）

### 2.4 Validation report asOf / cache freshness 風險

- report cache 寫入時間由 reporter `asOf` field 標示；admin 端在 detail panel **已顯示 asOf footer**（pm-18）；list-level badge 受限空間只能放 title hover
- 若 user 改了 source content 但未重跑 `report:validation`，cache 會過時 → badge 顯示舊計數
- **不可** auto-refresh：reporter 屬 user-triggered；admin 不 double-run validator（per pm-2 §4 Option A1 rejected）
- 缺檔（user 沒跑過 reporter）→ `state: 'no-report'` → 全 11 篇都顯「無資料」狀態

---

## 3. Proposed UI behavior

### 3.1 Badge 升級（5 態，沿用既有 `p.validationReport.state`）

| `vr.state` | badge text | badge class | title（hover 說明） |
|---|---|---|---|
| `no-report` | `warn ?` | `b-info` | `validation report 尚未產生；請執行 npm run report:validation`（沿用既有 placeholder 措辭精神） |
| `status-excluded` | `warn n/a` | `b-info` | `validator 不掃 draft/archived；non-visible status; status=<status>` |
| `clean`（ready/published, 0 warn） | `warn ✓` | `b-ok` | `0 warnings; clean as of <asOf>; source: report-validation` |
| `matched` & `warningCount > 0` & `errorCount === 0` | `warn N`（N = warningCount） | `b-warn` | `<N> warnings; 0 errors; as of <asOf>; source: report-validation; 展開查看明細 / byClass` |
| `matched` & `errorCount > 0` | `err M warn N` | `b-missing` | `<M> errors / <N> warnings; as of <asOf>; production baseline = 0 errors → 請執行 npm run validate:content 修正` |

設計原則：

1. **誠實 4 + 1 態**：不把 `no-report` / `status-excluded` 偽裝成 `warn 0`；不把 draft 顯成 `warn 0`（pm-2 §1.4 / pm-14 §D.2 紅線）
2. **不 prescription**：title 只列「執行哪個指令查更多 / 為何沒資料」，**不**寫「應改為 X」「應加 Y tag」之類建議
3. **不取代 validator**：title 帶 `source: report-validation`；user 須記得這是 cache，不是 live 重跑
4. **不混 governance**：與 L760 之 `gov: N / gov ✓` badge 分開渲染；title 明示「per-post **validator warning** count（ready/published only）」；governance badge 明示「all-status taxonomy signals」
5. **位置**：替換 L755 既有 `warn def.` placeholder span；同行；不動 `gov: ...` badge 與其它 badge 順序

### 3.2 報表 asOf 顯示（list-level 限制）

- list badge **不顯 asOf 文字**（空間限制）；只放在 title hover
- ⚠️ 若 user 想知道哪些 row 之計數來自舊 report：
  - 方案 A（推薦）：在 stats area / dashboard 頂部加一條「Validation report asOf: <iso> · 11 posts joined · <ready/published>=3」單行 banner（屬補件，可放下一 phase 或併入本 phase view）
  - 方案 B：不顯，user 自行查 detail panel asOf footer
- 本 phase 推薦先做 A.B（只動 list badge，不加全頁 banner）；banner 留下一 phase（若 user 確有需求）

### 3.3 不在本 phase 動之 UI

- ❌ Stats area 15-card overview / Dashboard 6 surface-card
- ❌ Governance summary card（Categories & Tags section）
- ❌ Per-post Aggregation summary（detail panel；governance signals 不同 universe）
- ❌ System checks section（settings / fixtures bucket；獨立 phase per pm-2 §5 priority 2）
- ❌ summary card 補 validator 欄（pm-2 §5 priority 4；雙 universe 混用紅線）

---

## 4. Proposed filter behavior

### 4.1 既有 filter 機制（不動）

`src/views/admin/index.ejs` 既有 `<select>` 多 `<optgroup>` filter（line 575–605 範圍），透過 `<tr.post-row>` 之 `data-*` attribute 比對（data-search / status / blogger / github / seo / fb / url / cat-tags / fb-published / content-kind / source-site / fb-badge / category）。filter JS 於 `<script>` block（L2312 附近）以 `if (val === 'X-missing') return row.dataset.X === 'missing';` 形式處理。

本 phase 提議 **additive only**：新增 1 個 optgroup + 1 個 data-attr + filter JS 內 1 個 if 分支。

### 4.2 Filter chip 設計（5 態，full coverage）

新增 `<optgroup label="validation">`：

| option value | 篩出條件 | 預估命中數（11 production posts） |
|---|---|---|
| `validation:warnings` | `vr.state === 'matched'` && `vr.warningCount > 0` | 0（production baseline 0 warning） |
| `validation:errors` | `vr.state === 'matched'` && `vr.errorCount > 0` | 0（production baseline 0 error） |
| `validation:clean` | `vr.state === 'clean'` | 預估 3（ready/published count；per 預跑 predev log） |
| `validation:excluded` | `vr.state === 'status-excluded'` | 預估 8（draft/archived） |
| `validation:no-report` | `vr.state === 'no-report'` | 11（若 user 未跑 reporter）或 0（若已跑） |

### 4.3 推薦最小可行子集（v1）

| 推薦 v1 | 推薦理由 |
|---|---|
| `validation:warnings` | ✅ **核心 use case**（user 想快速找 warning post） |
| `validation:no-report` | ✅ 提醒「請先 run reporter」（缺資料時 11 篇全在這） |
| `validation:excluded` | ⚠️ **評估**：可能讓 user 誤以為 draft 也有 warning；title 須明示「validator 不掃 draft」 |
| `validation:clean` | ⚠️ **評估**：production 全 clean 時意義小；可考慮省 |
| `validation:errors` | ❌ production baseline 0 error；v1 不必要；未來若 error 出現可加 |

**最小 v1 推薦** = `validation:warnings` + `validation:no-report` 兩個（覆蓋 80% use case；不引入 universe 混淆風險）。
**完整 v1 候選** = `validation:warnings` + `validation:clean` + `validation:excluded` + `validation:no-report` 四個（與 detail-panel 四態完全對應；user 可任選一態檢視；excluded title 明示「validator 不掃 draft」以降誤解）。

### 4.4 既有 filters 不受影響

- search / status / blogger / github / seo / fb / url / cat-tags / fb-published / content-kind / source-site / fb-badge / category / sort / show-all toggle 全不動
- filter 邏輯為 AND（依 admin 既有 `applyFilter` JS 慣例）：選 `validation:warnings` 時若同時也選了 `category:foo`，須兩者皆命中
- 不引入 chip 跳轉 / 點數字篩 / cross-row aggregation（pm-2 §9 紅線）

---

## 5. Data contract

### 5.1 既有 loader-derived fields（**已存在**；本 phase **零** 新欄位）

| 欄位 | 來源 | 可用度 |
|---|---|---|
| `p.validationReport.state` | pm-18 `derivePostValidationReport()`（4 態） | ✅ 已 landed；smoke 12/0 |
| `p.validationReport.warningCount` | matched 態才存在 | ✅ |
| `p.validationReport.errorCount` | matched 態才存在 | ✅ |
| `p.validationReport.byClass` | matched 態才存在 | ✅（detail panel 已用） |
| `p.validationReport.asOf` | matched / clean / status-excluded 時為 ISO；no-report 為 null | ✅ |
| `p.validationReport.issues[]` | matched 態才存在 | ✅（detail panel 已用） |
| `p.validationReport.reportAvailable` | boolean | ✅ |
| `p.validationReport.status` | status-excluded 態才存在（mirror `p.status`） | ✅ |

→ 本 phase **不新增任何 loader 欄位**；不動 `derivePostValidationReport()`；不動 `loadValidationReportContext()`；不動 reporter schema；不動 validator。

### 5.2 view-side derive（render-time，純展示）

在 render row 階段，view-side 從 `p.validationReport.state` 推導 2 個展示用字串：

```ejs
<%
  var vr = p.validationReport || { reportAvailable: false, state: 'no-report' };
  var vState = vr.state;
  var vBadgeKey = (function() {
    if (vState === 'matched' && (vr.errorCount || 0) > 0) return 'matched-error';
    if (vState === 'matched' && (vr.warningCount || 0) > 0) return 'matched-warn';
    return vState; // 'clean' / 'status-excluded' / 'no-report'
  })();
%>
```

`vBadgeKey` 5 值之一：`matched-error` / `matched-warn` / `clean` / `status-excluded` / `no-report`。直接驅動 §3.1 5 態 badge render；同樣字串放入 `<tr data-validation-state="...">` 供 filter JS 用。

### 5.3 不能猜 / 不能新增假資料

- ❌ **不**把 `status-excluded` 推導成 `warn 0` / `clean`（pm-14 §D.2 紅線）
- ❌ **不**把 `no-report` 推導成 `warn 0`（user 沒跑 reporter ≠ source clean）
- ❌ **不**用 governance signal `signalSum` 當 validator warning count（universe 不同；pm-2 §1.4）
- ❌ **不**自動跑 `npm run report:validation`（避免 dev render 變重 / Option A1 rejected）
- ❌ **不**在 view-side 重算 rule（避免 logic drift；validator 仍是 ground truth）
- ❌ **不**洩 commerce internalLabel / real AdSense client/slot id（pm-14 §F；title 不含敏感值）

---

## 6. Implementation plan

### 6.1 Phase A — Badge only（最小可行；推薦）

**Scope**：替換 `src/views/admin/index.ejs` L755 既有 `<span class="badge b-info" title="...">warn def.</span>` 為 5 態 badge（per §3.1）。

**檔案**：
- `src/views/admin/index.ejs`（**單檔**；預估 +12 / −1 行）

**Edit shape**（示意，未必 byte-exact）：

```ejs
<%# Phase 20260617-XX-admin-validator-warning-badge-implementation-a：
    view-only 5 態 badge；零 loader 變更；驅動於既有 p.validationReport.state -%>
<% var vr = p.validationReport || { reportAvailable: false, state: 'no-report' }; %>
<% var vState = vr.state; %>
<% if (vState === 'no-report') { %>
  <span class="badge b-info" title="...">warn ?</span>
<% } else if (vState === 'status-excluded') { %>
  <span class="badge b-info" title="...">warn n/a</span>
<% } else if (vState === 'clean') { %>
  <span class="badge b-ok" title="...">warn ✓</span>
<% } else if (vState === 'matched' && (vr.errorCount || 0) > 0) { %>
  <span class="badge b-missing" title="...">err <%= vr.errorCount %> warn <%= vr.warningCount %></span>
<% } else if (vState === 'matched' && (vr.warningCount || 0) > 0) { %>
  <span class="badge b-warn" title="...">warn <%= vr.warningCount %></span>
<% } else { %>
  <%# defensive fallback；本應不會走到 %>
  <span class="badge b-info" title="unknown state">warn ?</span>
<% } %>
```

**驗證**：
- `npm run validate:content` 0/94/84 carry
- `npm run check:admin-governance-aggregation` 16/0
- `npm run check:validation-report` 14/0
- `npm run check:admin-validation-consume` 12/0
- predev render `.cache/pages/admin/index.html` 計數：5 態 badge 應出現於 11 row（每 row 恰 1 個 validation badge）
- 「warn def.」字面值在 rendered HTML 應 **0** 次（placeholder 已替換）

**風險**：極低（view-only；無 JS 變更；無 loader 變更；無 filter 變更）。

**Phase 命名建議**：`20260617-XX-admin-validator-warning-badge-list-implementation-a`

### 6.2 Phase B — Filter chip only（推薦於 Phase A browser PASS 後另開）

**Scope**：
1. `<tr.post-row>` 加 `data-validation-state="<vBadgeKey>"`（在 L660–676 既有 dataset block 之後追加 1 行；可能順帶 row 標籤微擴）
2. `<optgroup label="validation">` 加新 options（per §4.3）；位置建議放在既有 `completeness` 與 `fbBadge` optgroup 之後
3. filter JS（L2312 附近）加 `else if (val.startsWith('validation:')) return row.dataset.validationState === val.slice('validation:'.length);`（或 mirror 既有 helper 風格）

**檔案**：
- `src/views/admin/index.ejs`（**單檔**；預估 +15 / −0 行）

**驗證**：
- 同 Phase A 4 個 smoke + validate baseline
- 預跑 predev → rendered HTML：每 `<tr.post-row>` 含 `data-validation-state` 屬性（11/11）
- 選 `validation:no-report` → 篩出 11 行（若未跑 reporter）；選 `validation:warnings` → 篩出 0 行（production baseline）
- browser human-eye：filter 可正確 toggle row；不破壞既有 search / status / fbBadge / category 等 filter；show-all toggle 不受影響

**風險**：中（動 Posts index search/filter/sort JS；屬 pm-2 §9 紅線「filter chip / 點數字篩 / loader 聚合搬遷一律獨立 phase + approval；不跳階」之**唯一**保留 Posts index JS 變更紅線）。本 phase 推薦先做 A，A browser PASS 後**再評估** B；非自動推進。

**Phase 命名建議**：`20260617-XX-admin-validator-state-filter-chip-list-implementation-a`

### 6.3 Phase C — list-level asOf banner（optional；推薦延後）

**Scope**：stats area 頂部加 1 行 `Validation report asOf: <iso> · ready/published: <n> · joined: <n>` banner（若 `vr.reportAvailable=true`）

**檔案**：`src/views/admin/index.ejs`（單檔）+ 可能 loader 額外暴露 `validationReportContext.summary`

**風險**：低-中（取決於是否動 loader）；本 phase 不建議；併入 Phase A 亦可接受

---

## 7. Acceptance criteria

### 7.1 docs-only acceptance（本 phase）

| 項目 | 結果 |
|---|---|
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `48baabf` / 0/0 / clean |
| 唯一 file change | 本 preanalysis doc + （optional）CLAUDE.md 極小 ledger sync |
| 未碰 src / views / scripts / content / settings / package / dist / gh-pages / `.cache` | ✅ |
| 未啟動 dev server / build / deploy | ✅（本 phase 不需） |
| 未觸發 GA4 / AdSense / Search Console / Blogger / Google Drive 後台 | ✅ |
| 未啟動 write path | ✅ |

→ docs-only preanalysis，read-only acceptance trivially PASS。

### 7.2 Phase A future implementation acceptance（badge only）

- `npm run validate:content` 0/94/84 carry
- 3 ADMIN smokes 全 carry（16/0 + 14/0 + 12/0）
- predev render `.cache/pages/admin/index.html`：
  - `warn def.` 字面值出現次數 = 0（placeholder 完全替換）
  - 5 態 badge 總數出現於 11 row（依當前 state 分布）
  - 11 篇 post 每 row **恰 1** 個 validation badge
- detail panel 內 `Validation warnings` section 既有四態文案不變
- gov badge 仍正確 render（`gov: N / gov ✓`；不混淆）
- browser human-eye PASS：badge 顯示符合預期；title hover 帶 asOf；無 layout 破壞；無 console error

### 7.3 Phase B future implementation acceptance（filter chip；若推進）

- 同 Phase A 4 smokes + validate baseline
- `<tr.post-row>` 含 `data-validation-state` 屬性（11/11）
- 篩選 `validation:warnings` / `validation:no-report` / `validation:clean` / `validation:excluded` 各 toggle row 數合理
- 既有 search / status / fbBadge / category filter / sort / show-all 不受影響
- browser human-eye PASS：filter chip 可正常使用

### 7.4 Universal non-acceptance / 紅線

- ❌ **不接受** badge 把 `status-excluded` / `no-report` 顯成 `warn 0`
- ❌ **不接受** badge 混用 `governanceSignals.signalSum` 為 validator count
- ❌ **不接受** 自動跑 `npm run report:validation`（reporter 屬 user-triggered）
- ❌ **不接受** view-side 重算 validator rule（validator 仍是 ground truth）
- ❌ **不接受** prescription（「應改為 X」「應加 tag Y」）
- ❌ **不接受** filter chip 點數字跳轉 / cross-row 聚合 / loader-side filter
- ❌ **不接受** summary card 補 validator 欄（pm-2 §5 priority 4；雙 universe 混用；保留紅線）

---

## 8. Risks / non-goals

### 8.1 Cache stale 風險

- `.cache/data/validation-report.json` 由 `npm run report:validation` 寫入；user 不重跑 = cache 過時
- **緩解**：badge title 顯 `as of <asOf>; source: report-validation`；user 看 title 即知是 cache
- **不接受**：自動 background poll / auto-refresh / cache-invalidate（dev render 雙跑 / loader drift / 變重）
- **未來 enhancement**：list-level asOf banner（Phase C；本 phase 不做）

### 8.2 Validator warning ≠ governance signal（universe mismatch）

- validator 僅掃 ready/published（per `src/scripts/load-posts.js` `VISIBLE_STATUS`）
- governance signal `signalSum` 涵蓋全 status（含 draft）
- **緩解**：
  - badge title 明示「per-post **validator warning** count（ready/published only）」
  - gov badge title 已明示「all-status taxonomy signals」
  - 兩 badge 並排但**不**合計；不寫「總計 X」
- **不接受**：把 governance signal 計入 warning total

### 8.3 Draft 是否顯示 / 篩選

- Draft 在 `validation:excluded` filter 命中（state = `status-excluded`）
- Draft badge 顯 `warn n/a`（**不**顯 `warn 0`；**不**顯 `warn ?`）
- 篩 `validation:warnings` 時 draft 不會被誤篩入（因 draft state 不是 matched）
- **不接受**：自動把 draft 標 `warn 0`

### 8.4 Report 缺檔時 UI fallback

- `state: 'no-report'` → badge 顯 `warn ?`（title 提示「請執行 npm run report:validation」）
- 11 篇全顯 `warn ?`（state 統一）→ user 立即知道要跑 reporter
- 不 crash；不假裝 0；不 throw

### 8.5 與 R1 / SEO dryrun collapse 之 visual interaction

- 本 phase 不動 R1 / R2 / R3 / R4 / R5 / SEO dryrun collapse 任一已 landed 元素
- 5 態 badge 與既有 SEO / FB / URL / cat-tags / nav / idx / gov badge 同行；視覺 spacing 須保持
- Phase A 範圍即 1 個 placeholder span → 5 態 conditional；不引入新 CSS class（沿用既有 `b-info` / `b-ok` / `b-warn` / `b-missing`）

### 8.6 Phase 1 final 影響

- ADMIN 屬 dev-mode-only / noindex / 不進 prod build / 不進 dist / 不 deploy
- 本 phase 規劃**不**改變 Phase 1 final 宣告
- 本 phase 規劃**不**阻擋 BLOG content / publishing 主線

### 8.7 Non-goals

- ❌ 不做 auto-fix
- ❌ 不改 validator 規則 / severity / class 對映
- ❌ 不改 reporter schema / output
- ❌ 不改 loader 派生欄位（pm-18 stable）
- ❌ 不接 write path / Apply / Save / admin-write-cli / middleware / FB sidecar write
- ❌ 不啟動 reverse UTM deploy / Blogger repost / GA4 / AdSense / Search Console 後台動作
- ❌ 不做 summary card 補 validator 欄（pm-2 §5 priority 4 紅線）
- ❌ 不做 System checks bucket（pm-2 §5 priority 2；獨立 phase）
- ❌ 不做 cross-row aggregation / count badge 跳轉

---

## 9. Recommended next phase

### 9.1 推薦預設（保守路線）

**Phase A — Badge only**（view-only；最小可行；最低風險）

- Phase 命名：`20260617-XX-admin-validator-warning-badge-list-implementation-a`
- 變更：`src/views/admin/index.ejs` 單檔 +12 / −1 行（替換 L755 既有 placeholder 為 5 態 badge）
- Loader / reporter / validator / settings / package：**0 變更**
- 風險：極低（view-only；無 JS 變更）；可獨立 backout
- 預期 acceptance：§7.2

→ Phase A landed + browser PASS 後再評估 Phase B / C；本 phase 不主動推進 B 或 C。

### 9.2 Phase B（filter chip）evaluate-only；**不**自動跑

- Phase 命名建議：`20260617-XX-admin-validator-state-filter-chip-list-implementation-a`
- 動機：user 想用 filter 快速篩 warning post
- 風險：中（動 Posts index search/filter/sort JS；pm-2 §9 紅線「filter chip / 點數字篩 / loader 聚合搬遷一律獨立 phase + approval；不跳階」）
- 前置：Phase A browser PASS + user explicit approval
- 推薦最小 v1：`validation:warnings` + `validation:no-report`（per §4.3）

### 9.3 Phase C（list-level asOf banner）optional；推薦延後

- Phase 命名建議：`20260617-XX-admin-validation-report-asof-banner-list-implementation-a`
- 動機：list-level 顯示 cache asOf 與 join 摘要
- 風險：低-中（取決於是否動 loader）
- 推薦：Phase A + B 全 landed + browser PASS 後再評估；本 phase 不規劃實作步驟

### 9.4 紅線（**不**推薦推進）

- ❌ summary card 補 validator 欄（pm-2 §5 priority 4；雙 universe 混用紅線）
- ❌ `--report-json` validator flag（Option B；動 ground truth）
- ❌ loader cross-post aggregation migration
- ❌ per-post prescription rule engine
- ❌ ADMIN write path（Apply / Save / Auto-fix / admin-write-cli / middleware）
- ❌ 任何 Blogger / GA4 / AdSense / Google Drive / Search Console 後台動作

---

## 10. Phase chain context

| Phase | 類型 | Status | 角色 |
|---|---|---|---|
| pm-2（`docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`） | docs-only | ✅ accepted | 鎖 rule taxonomy / Option A2 / universe mismatch |
| pm-14（`docs/20260616-admin-validation-report-schema-and-join-contract-preanalysis.md`） | docs-only | ✅ accepted | 鎖 schema + join contract + class 對映 + staleness 模型 |
| pm-16（`report-validation.js` reporter） | source（new script） | ✅ landed | reporter；產生 `.cache/data/validation-report.json` |
| pm-17（`check:validation-report` smoke） | source（new script） | ✅ landed；14/0 | reporter 端 smoke |
| pm-18（loader consume + detail panel `Validation warnings` + smoke） | source + view | ✅ landed；12/0 + browser PASS | detail panel 4 態 consume；R1 之後 R1.5 |
| **本 phase（badge + filter 規劃）** | docs-only | 🔄 in progress | Posts list 列表升級（priority 3 per pm-2 §5） |
| 後續 Phase A（badge only） | view-only | ⏸ 提案 / 未實作 | 替換 L755 placeholder |
| 後續 Phase B（filter chip） | view（含 Posts index JS） | ⏸ 提案 / 未實作 | 動 Posts index search/filter/sort JS；獨立 phase |
| 後續 Phase C（asOf banner） | view 或 loader+view | ⏸ 提案 / 未實作 | list-level cache freshness 顯示 |
| 後續 System checks bucket 升級 | view | ⏸ 提案 / 未實作 | pm-2 §5 priority 2；settings/fixtures bucket |
| 紅線（永久 / 須 user 額外授權） | — | 🔴 不推進 | summary card 補欄 / validator `--report-json` / write path / per-post prescription |

→ 全鏈無 source second pass；無 hot-fix；無 backout；mirror pm-2 §5 priority order 與 pm-14 §G 路線一致。

---

（本文件結束）
