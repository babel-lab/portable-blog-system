# 2026-06-03 Download R5b Duplicate Checkpoint

Phase: `20260603-am-4-download-r5b-duplicate-docs-claude-sync-docs-only-a`
Scope: docs-only sync（CLAUDE.md §3.2 狀態同步 + 本 checkpoint 文件）
Source landing commit（R5b implementation；本 phase 不變動）: `077c3d1` — `feat(download): warn on duplicate asset refs`

---

## 1. Executive Summary

R5b（intra-post duplicate validation 第二批 content-reference rule）已完成 source landing 並通過 read-only acceptance：

- 新增 1 條 validator rule，**warning-only**：
  - `download-asset-ref-duplicate`（單一 post 內 `download.assetRefs[]` 重複 ref）
- rule 為 **registry-independent**：不 consult / mutate `settings.downloadAssets` / `settings.downloadForms` key set；不改 registry JSON；不動 loader。
- 與 R2 not-found 為 **orthogonal cascade**：同一 key 可同時觸發 not-found 與 duplicate；duplicate **不** suppress not-found。
- 新增 1 個 validation fixture（`_test-download-asset-ref-duplicate.md`，位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描）。
- baseline movement: +3 warnings / +1 post；production posts **零** duplicate warnings。

本 phase 僅做文件狀態同步，**不**動 source / fixtures / registry / loader / production content。

See also:

- `docs/20260602-download-r2-not-found-checkpoint.md`（R2 freeze baseline；R5b 建立於 R2 `invalid-type → empty → not-found` cascade 之上）
- `docs/20260602-download-r5-duplicate-rule-preanalysis.md`（R5 preanalysis；S1 strategy = orthogonal cascade with not-found）
- `docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`（R4a — keep registries empty / defer inactive；R5b 為 R4b NO-GO 後選擇之 registry-independent 路線）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series plan；R5 為 §5.4）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty-registry landing plan；R5b 保留此 invariant）
- CLAUDE.md §3.2（download validation 當前狀態）
- CLAUDE.md §13（`download.fileUrl` warning policy）

---

## 2. Baseline Before / After

| 階段 | errors | warnings | posts |
|---|---|---|---|
| before R5b（HEAD = `d2b04ff`） | 0 | 57 | 52 |
| after R5b（HEAD = `077c3d1`，本 phase 開始時 / 結束時） | 0 | 60 | 53 |
| movement | 0 | **+3** | **+1** |

+3 warnings / +1 post 完全來自 R5b 新增 fixture（單一 fixture 觸發 2× `download-asset-ref-not-found` + 1× `download-asset-ref-duplicate`）；production 內容無變動。

Phase start baseline 與 phase end baseline 一致（本 docs-only phase 不動 validator / fixtures / production content）：

- branch = `main`
- HEAD = `origin/main`（ahead/behind = 0/0）
- HEAD full hash = `077c3d14ddb59caf20134553959f7a7b533e06ef`
- HEAD short hash = `077c3d1`
- latest subject = `feat(download): warn on duplicate asset refs`
- working tree = clean
- `npm run validate:content` = **0 errors / 60 warnings / 53 posts**

---

## 3. Commit Scope

R5b commit `077c3d14ddb59caf20134553959f7a7b533e06ef` 只動 2 個檔：

```text
M src/scripts/validate-content.js
A content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md
```

`+63 insertions / -0 deletions`。

未動：

- ❌ `src/scripts/load-settings.js`
- ❌ `content/settings/download-assets.json`
- ❌ `content/settings/download-forms.json`
- ❌ 任何 production posts（`content/github/posts/` / `content/blogger/posts/` / `content/shared/posts/`）
- ❌ 任何其他 validation fixtures
- ❌ templates / renderer / Admin / middleware
- ❌ `package.json` / lockfile

---

## 4. Rule Behavior

### 4.1 Rule id

`download-asset-ref-duplicate`

### 4.2 Severity

`warning`（warning-only；與 R2 / D1 / D2 / D3 / SEO interlock 一致）。

### 4.3 Target

**Intra-post `download.assetRefs[]` duplicate only**——單一 post 內 array 重複 ref。

### 4.4 Duplicate Semantics

- **trim**：以 `item.trim()` 為比對單位（前後空白不影響 duplicate 判定）。
- **case-sensitive**：trim 後字串原樣比對；`"asset-1"` 與 `"Asset-1"` 視為不同 key（不觸發 duplicate）。
- **non-empty string only**：只比對 `typeof item === 'string'` 且 `trim() !== ''` 之 item。
  - non-string item 由 `download-asset-ref-invalid-type` 處理，**不**參與 duplicate。
  - empty / whitespace-only item 由 `download-asset-ref-empty` 處理，**不**參與 duplicate。
- **one warning per duplicated key**：同一 key 不論出現幾次，只產生 1 個 warning（避免 per-occurrence 爆量）。
- warning value 樣式：`assetRefs[<idx1>,<idx2>,...] duplicate key="<key>"`（保留所有 occurrence 的 array index，方便定位）。

### 4.5 Cascade Ordering vs R2

R5b 與 R2 not-found 為 **orthogonal cascade**（per R5 preanalysis Strategy S1）：

```text
download.assetRefs
  → invalid-type (assetRefs 非 array)
  → invalid-type item (item 非 string；不參與 duplicate / not-found)
  → empty item (item trim 後為空；不參與 duplicate / not-found)
  → not-found (item shape 合法但 registry 找不到) ← R2
  → duplicate (intra-post 重複 ref) ← R5b，與 not-found 共存
```

關鍵性質：

- duplicate **不** suppress not-found：同一 key 在 empty registry 下會同時觸發 1× duplicate + N× not-found（N = 該 key 的 occurrence 數）。
- duplicate **不** consult registry key set：rule 純粹比對 `assetRefs[]` array 內字串重複；registry shape 不合法（`assetKeySet === null`）時仍會正常檢查 duplicate。
- duplicate **不**檢查 `formRef`：formRef 為 single value，無 intra-post duplicate 概念。

### 4.6 Distinction from Registry-level Duplicate Rule

R5b 與既存的 registry-level `download-registry-duplicate-key` 為**兩條獨立 rule**：

| 維度 | `download-registry-duplicate-key`（既存） | `download-asset-ref-duplicate`（R5b 新增） |
|---|---|---|
| 觸發層級 | registry-level（`settings.downloadAssets.assets[].assetId` 唯一性） | post-level（單一 post `download.assetRefs[]` 重複） |
| 觸發來源 | `content/settings/download-assets.json` / `download-forms.json` | 文章 frontmatter |
| Phase | 20260601-pm-17 | 20260603-am-2 |
| 嚴重度 | warning | warning |

兩條 rule 互不影響、互不 suppress。

---

## 5. Fixture Behavior

### 5.1 Fixture path

`content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md`

### 5.2 Designed warnings

| Warning rule id | Count | Reason |
|---|---|---|
| `download-asset-ref-not-found` | 2 | `assetRefs[0]="duplicate-asset-id"` 與 `assetRefs[1]="duplicate-asset-id"` 皆未登錄於 empty registry |
| `download-asset-ref-duplicate` | 1 | `assetRefs[0]` 與 `assetRefs[1]` trim 後相同 |
| **total** | **3** | per S1 orthogonal cascade design |

### 5.3 What the fixture does NOT trigger

- ❌ `download-fileUrl-*` (D1 / D2 / D3)：`download.fileUrl` 為合法 URL。
- ❌ `download-seo-interlock-*` (S)：設定 `seo.indexing: "noindex-follow"`，符合 SEO interlock 要求。
- ❌ `download-asset-refs-invalid-type`：`assetRefs` 為 array。
- ❌ `download-asset-ref-invalid-type`：兩個 item 皆為 string。
- ❌ `download-asset-ref-empty`：trim 後皆非空。

### 5.4 Scan scope

fixture 位於 `content/validation-fixtures/blogger/posts/`，**僅供** `npm run validate:content` 掃描；**不會**被 `build:github` / `build:blogger` / `build:promotion` 掃到，因此不會出現在 dist 或 production 部署中。

---

## 6. Validation Result

`npm run validate:content` 於 R5b accepted commit (`077c3d1`)：

```text
0 error(s) / 60 warning(s) on 53 post(s)
```

本 docs-only phase 結束時亦為相同結果（不動 validator / fixtures / production content）。

---

## 7. Production Impact

R5b commit 對 production 內容的影響：**零**。

- production posts **無**任何文章使用 `download.assetRefs[]`（registry 仍為 empty，consumer 尚未存在）。
- production posts **無**任何文章使用 `download.formRef`（同上）。
- 因此 production posts **零** `download-asset-ref-not-found` warnings、**零** `download-asset-ref-duplicate` warnings。
- 既存 production posts 之 `download.fileUrl`（D1/D2/D3）warning 行為不變。
- R5b commit 不動 registry JSON，不動 loader，不動 build / deploy / Blogger / GA4。

---

## 8. Preserved Behaviors

R5b commit **不**改變以下既有行為：

- ✅ `download.fileUrl` D1 / D2 / D3 shape warnings
- ✅ SEO noindex interlock（`download-seo-interlock-*`）
- ✅ registry-level shape rule（`download-registry-invalid-shape`）
- ✅ registry-level duplicate key rule（`download-registry-duplicate-key`）
- ✅ `download.assetRefs` invalid-type / item invalid-type / item empty warnings
- ✅ `download.formRef` invalid-type / empty / not-found warnings
- ✅ R2 `download-asset-ref-not-found` / `download-form-ref-not-found` cascade
- ✅ load-settings read-only registry exposure（`settings.downloadAssets` / `settings.downloadForms`）
- ✅ build：`build:github` / `build:blogger` / `build:promotion` / `build:sitemap` 行為不變
- ✅ Blogger reverse UTM 仍 **dormant**；pm-26 deploy gate 仍 **BLOCKED**
- ✅ Admin Apply / middleware write / admin-write-cli 仍 **dormant**

---

## 9. Non-goals / Not Started

R5b 並未涵蓋以下項目；本 docs-only phase 亦未啟動：

- ❌ inactive content-reference rules：`download-asset-ref-inactive` / `download-form-ref-inactive`（R4 範圍；R4a 已決定 keep registries empty / defer inactive，R4b 為 NO-GO）
- ❌ inactive registry data strategy 落地（Option C test-only fixture override）
- ❌ coexistence policy / rule（`download.fileUrl` vs `assetRefs` / `formRef`；R6 範圍）
- ❌ formRef duplicate rule（formRef 為 single value，**no need for** intra-post duplicate rule）
- ❌ registry mutation（registry JSON 仍為 empty registry）
- ❌ loader extension（`src/scripts/load-settings.js` 未變更）
- ❌ Admin picker（settings registry consumer 尚未存在）
- ❌ renderer / landing page（user-facing 下載落地頁未實作）
- ❌ production content migration（既有 `download.fileUrl` 文章未遷移至 `assetRefs[]` / `formRef`）
- ❌ build：本 phase 不執行 `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`
- ❌ deploy：不碰 gh-pages，不 push deploy artifact
- ❌ Blogger repost：不重貼任何 Blogger 後台文章
- ❌ GA4 validation：不做 Realtime / DebugView 驗收
- ❌ reverse UTM activation：reverse UTM remains **dormant**
- ❌ pm-26 deploy gate unblock：deploy gate remains **BLOCKED**
- ❌ Admin Apply / middleware write / admin-write-cli 啟動（remain **dormant**）

---

## 10. Next Possible Phases

下列項目皆為 candidate，**不**於本 phase 啟動；後續 phase 須各自獨立評估：

- **R5d acceptance cross-check**（read-only 二次驗收 R5b 落地後的 cascade orthogonality + production zero-impact + fixture-only baseline movement）
- **R5c / R5d preanalysis**（若決定擴張 duplicate rule，例如：cross-fixture / cross-post duplicate；目前無此需求）
- **R6 preanalysis**（coexistence policy decision：`download.fileUrl` 與 `assetRefs` / `formRef` 共存規則；可能涉及 mutually-exclusive enforcement 或 hybrid 顯示策略）
- **R4a Option C preflight**（test-only inactive registry fixture override；屬 loader / validator architecture 變更，需獨立 preanalysis）
- **Admin picker preanalysis**（settings registry consumer 雛形；Admin Apply remains dormant 前提下）
- **renderer / landing page preanalysis**（user-facing 下載落地頁設計；無 Google Forms 串接 / 無 respondent data 收集前提下）
- **Final Idle Freeze**：若短期內不再啟動下一個 phase，可進入 idle freeze

---

## 11. Final Recommendation

**Final Idle Freeze / EXIT.**

R5b intra-post duplicate 已落地、accepted、文件已同步；下一個 phase（R5d acceptance / R6 / R4a Option C / Admin / renderer / loader extension 等）皆屬獨立啟動範圍，須各自 preflight + preanalysis 後再決定是否進入。本 docs-only phase 結束後**不自動啟動**任何 follow-up phase。

Recommended next step（user 主動啟動）：

1. **R5d acceptance cross-check**（read-only；最小新增成本，可立刻確認 R5b 行為與 docs 一致）
2. 或暫時 idle，直到下次需要 R6 / Admin / renderer 啟動時再開新 phase。
