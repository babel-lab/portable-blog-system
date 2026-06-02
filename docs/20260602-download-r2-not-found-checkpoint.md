# 2026-06-02 Download R2 Not-found Checkpoint

Phase: `20260602-night-11-download-r2-not-found-docs-sync-docs-only-a`
Scope: docs-only sync（CLAUDE.md §3.2 狀態同步 + 本 checkpoint 文件）
Source landing commit（R2 implementation；本 phase 不變動）: `145a548` — `feat(download): validate ref not-found against registry`

---

## 1. Executive Summary

R2（registry-aware not-found validation 第一批）已完成 source landing 並通過 read-only acceptance：

- 新增 2 條 validator rule，皆為 **warning-only**：
  - `download-asset-ref-not-found`
  - `download-form-ref-not-found`
- 兩條 rule **registry-aware but read-only**：以 `settings.downloadAssets` / `settings.downloadForms` registry 為 lookup source；**不**寫入、**不**改 registry JSON、**不**動 loader。
- **no registry mutation**：`content/settings/download-assets.json` / `download-forms.json` 仍為 empty registry（`assets: []` / `forms: []`），R2 commit 未修改任何 registry JSON。
- 新增 2 個 validation fixture（位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描）。
- baseline movement: +2 warnings / +2 posts；production posts **零** not-found warnings。

本 phase 僅做文件狀態同步，**不**動 source / fixtures / registry / loader / production content。

---

## 2. Final Accepted Baseline

R2 source 已落地、accepted 之 baseline（本 docs-only phase 開始前的 repo 狀態）：

- branch = `main`
- HEAD = `origin/main`（ahead/behind = 0/0）
- HEAD full hash = `145a548da005fa5b5aabddf44921914b621ab684`
- HEAD short hash = `145a548`
- latest subject = `feat(download): validate ref not-found against registry`
- working tree = clean
- `npm run validate:content` = **0 errors / 57 warnings / 52 posts**

---

## 3. Implemented R2 Rules

### 3.1 `download-asset-ref-not-found`

- 觸發條件：`download.assetRefs` 為 array、`assetRefs[i]` 為非空 trimmed string，但 trimmed value **未登錄於** `settings.downloadAssets.assets[].assetId`。
- severity = `warning`（warning-only）。
- value 樣式：`assetRefs[i]="<id>" not found in downloadAssets registry`。
- 位於 invalid-type / empty 之後（互斥分支 cascade）：
  1. `download-asset-refs-invalid-type`（assetRefs 非 array）
  2. `download-asset-ref-invalid-type`（item 非 string）
  3. `download-asset-ref-empty`（item trim 後為空）
  4. **`download-asset-ref-not-found`（item shape 合法，但 registry 找不到）** ← R2 新增
- registry-shape gate：`assetKeySet === null`（buildDownloadKeySet 因 registry shape 不合法 / disabled / parse-error 而 fallback 到 null）時 lookup **跳過**，避免 cascade warnings。

### 3.2 `download-form-ref-not-found`

- 觸發條件：`download.formRef` 為非空 trimmed string，但 trimmed value **未登錄於** `settings.downloadForms.forms[].formId`。
- severity = `warning`（warning-only）。
- value 樣式：`formRef="<id>" not found in downloadForms registry`。
- 位於 invalid-type / empty 之後（互斥分支 cascade）：
  1. `download-form-ref-invalid-type`（formRef 非 string）
  2. `download-form-ref-empty`（formRef trim 後為空）
  3. **`download-form-ref-not-found`（formRef shape 合法，但 registry 找不到）** ← R2 新增
- registry-shape gate：`formKeySet === null` 時 lookup 跳過，避免 cascade warnings。

### 3.3 Cascade ordering recap

```
download.assetRefs  → invalid-type → invalid-type(item) → empty → not-found
download.formRef    → invalid-type → empty → not-found
```

shape 合法的 ref 才會進入 registry-aware lookup；registry 本身 shape 不合法時直接跳過 lookup（避免每個 ref 都 cascade 報錯）。

### 3.4 R2 的明確邊界

R2 第一批 **不**處理：

- inactive 過濾（registry entry 標記為 inactive 時的行為）
- intra-post duplicate（同一 post 內 `assetRefs[]` 含重複 ref）
- assetRefs / formRef 與 `download.fileUrl` 之 coexistence policy
- registry 之 inactive metadata 設計（屬 R4a 之前的 data strategy decision）

---

## 4. Fixtures Added

R2 commit 新增 2 個 fixture（皆位於 `content/validation-fixtures/blogger/posts/`，由 `validate-content` 掃描，**不會**被 `build:github` / `build:blogger` / `build:promotion` 掃到）：

- `content/validation-fixtures/blogger/posts/_test-download-asset-ref-not-found.md`
  - `download.assetRefs: ["nonexistent-asset-id"]`
  - 預期觸發 **exactly one** warning：`download-asset-ref-not-found`
- `content/validation-fixtures/blogger/posts/_test-download-form-ref-not-found.md`
  - `download.formRef: "nonexistent-form-id"`
  - 預期觸發 **exactly one** warning：`download-form-ref-not-found`

兩個 fixture 都設定 `seo.indexing: "noindex-follow"` + 合法 `download.fileUrl`，避免同時觸發 D1 / D2 / D3 / S 等其他 rule，確保 acceptance 可精準比對「單一 R2 warning」。

production posts **零** R2 not-found warnings：production 內容若使用 `assetRefs` / `formRef` 必須是 registry 內登錄之 id（目前 registry 為 empty，production 文章亦未使用 assetRefs / formRef，故無觸發）。

---

## 5. Validation Baseline Movement

| 階段 | errors | warnings | posts |
|---|---|---|---|
| before R2 | 0 | 55 | 50 |
| after R2（本 phase 開始時） | 0 | 57 | 52 |
| movement | 0 | **+2** | **+2** |

+2 warnings / +2 posts 完全來自 2 個新 fixture；production 內容無變動。

---

## 6. Explicit Non-goals / Not Started

R2 並未涵蓋以下項目；本 docs-only phase 亦未啟動：

- ❌ inactive rule：`download-asset-ref-inactive` / `download-form-ref-inactive`（R4 範圍）
- ❌ inactive registry data strategy decision（R4a docs-only）
- ❌ duplicate rule / intra-post duplicate rule：`download-asset-ref-duplicate`（R5 範圍）
- ❌ coexistence policy / rule（`download.fileUrl` vs `assetRefs` / `formRef`；R6 範圍）
- ❌ registry mutation（registry JSON 仍為 empty registry）
- ❌ loader extension（`src/scripts/load-settings.js` 未變更）
- ❌ Admin picker（settings registry 之 consumer 尚未存在）
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

## 7. Current Next Candidates

下列項目皆為 candidate，**不**於本 phase 啟動；後續 phase 須各自獨立評估：

- R4a — inactive registry data strategy decision（docs-only）：決定 inactive 標記設計（schema、metadata、deactivation semantics）
- R5 — duplicate preanalysis：intra-post duplicate `assetRefs[]` cascade ordering 與 mutually-exclusive 設計
- R6 — coexistence policy decision：`download.fileUrl` vs `assetRefs` / `formRef` 之共存規則
- Admin picker preanalysis：settings registry 的 consumer 雛形（Admin Apply remains dormant 前提下）
- renderer / landing page preanalysis：user-facing 下載落地頁設計（無 Google Forms 串接 / 無 respondent data 收集前提下）
- Final Idle Freeze：若短期內不再啟動下一個 phase，可進入 idle freeze

---

## 8. Recommendation

**Final Idle Freeze / EXIT.**

R2 not-found 已落地、accepted、文件已同步；下一個 phase（R4a / R5 / R6 / Admin / renderer / loader extension 等）皆屬獨立啟動範圍，須各自 preflight + preanalysis 後再決定是否進入。本 docs-only phase 結束後不自動啟動任何 follow-up phase。
