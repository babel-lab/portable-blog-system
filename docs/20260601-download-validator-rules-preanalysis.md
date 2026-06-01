# 20260601 Download Validator Rules Preanalysis

> Phase: `20260601-pm-14-download-validator-rules-preanalysis-docs-only-a`
> Date: 2026-06-01 16:37 +0800
> Scope: **docs-only**（無 source / content / settings / templates / fixture / package / dist / gh-pages / CLAUDE.md 變更）

---

## 1. Executive Summary

- 本文件**只規劃** download validator rules，為 download loader source 落地（pm-11/pm-12 acceptance PASS、pm-13 final idle freeze PASS）後之下一階段安全邊界裁決。
- 本文件**不修改** `src/scripts/validate-content.js`。
- 本文件**不新增 fixture**（`content/validation-fixtures/` 一檔不動）。
- 本文件**不改 registry**（`content/settings/download-assets.json` / `download-forms.json` 一檔不動）。
- 本文件**不啟動** Admin picker / renderer / landing page / content migration。
- 目標：**決定未來 validator source phase 的安全邊界**，使下一個保守 phase（acceptance read-only 或 validator source preflight）可在固定規則草案上展開。
- 本檔落地後 production state drift = 0；唯一變更為新增本 docs 檔。

### 1.1 一句話裁決

> **download validator 之第一批 source phase 應採最小安全集：優先做「registry shape / key uniqueness 之 read-only checks」（Option A），全部 warning-only，不引入需新增 fixture 的 content-reference 規則；legacy `fileUrl` 既有 D1/D2/D3/S 保持不變；noindex / preview-url-risk / migration 維持各自既有政策不在本批處理。預設仍為 Final Idle Freeze / EXIT，validator source 需 user 明示才啟動。**

---

## 2. Current Baseline

| 項目 | 值 |
|------|----|
| HEAD | `ac38ea955dd93704cef4b2ca82aed04d16bfbde4`（short `ac38ea9`） |
| origin/main | `ac38ea9`（HEAD = origin/main；ahead/behind 0/0） |
| latest subject | `feat(download): load optional download registries` |
| working tree | clean |
| validate baseline | **0 errors / 47 warnings / 42 posts** |
| loader 狀態 | ✅ landed：`loadSettings()` exposes `downloadAssets` / `downloadForms`（`src/scripts/load-settings.js:57-58`） |
| registries 狀態 | empty and clean（`assets: []` / `forms: []`；`schemaVersion: 1`） |
| validator-via-registry | ❌ 尚未實作（`validate-content.js` 不讀 `downloadAssets` / `downloadForms`） |
| Admin picker / renderer / landing page / migration | dormant（全未實作） |
| reverse UTM | dormant |
| pm-26 deploy gate | BLOCKED |

---

## 3. Current Download Registry State

### 3.1 `download-assets.json` current schema / empty state

```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "",      // ISO 8601 placeholder（空字串）
  "assets": [],         // 空陣列；empty registry acceptable
  "notes": ""
}
```

### 3.2 `download-forms.json` current schema / empty state

```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "",
  "forms": [],          // 空陣列；empty registry acceptable
  "notes": ""
}
```

- loader default（檔案不存在時）為 `{ schemaVersion: 0, updatedAt: '', assets|forms: [], notes: '' }`（`load-settings.js:57-58` `readJsonOptional` fallback）；目前實體檔 `schemaVersion: 1`，故 loader 讀到真實檔。
- 兩檔同層於 `content/settings/`，對齊 CLAUDE.md §3.2 settings 集中管理原則（per `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §3.3 Option A）。

### 3.3 R1 red lines（registry 治理紅線）

registry **永不**含以下（per `docs/20260531-...-schema-decision.md` §8 + CLAUDE.md §3.2）：

- ❌ respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）
- ❌ access token / API key / OAuth secret
- ❌ account email（form owner email / 帳號 email）
- ❌ private Drive folder ID / 私人 permission / 內部路徑

### 3.4 registry mutation 不屬 validator phase

- validator 僅**讀取** registry（read-only）；**不**寫入、**不**新增 / 刪除 entry、**不**改 `updatedAt`。
- registry mutation 屬未來 Admin Apply / `admin-write-cli` 範疇，與 validator phase 完全解耦；本文件不觸及。

---

## 4. Current Validation Baseline

### 4.1 現有 download 相關 validation（已實作）

讀自 `src/scripts/validate-content.js`（Phase 20260530 am-7 / am-13 / night-5）：

| 代號 | rule id | severity | 觸發條件 | 位置 |
|------|---------|----------|----------|------|
| D2 | `download-fileurl-invalid-type` | warning | `download.fileUrl !== undefined` 且非 string | `:482` |
| D1 | `download-enabled-fileurl-empty` | warning | `contentKind==='download'` 且 `download.enabled===true` 且 fileUrl 空/whitespace | `:502` |
| D3 | `download-fileurl-invalid-format` | warning | fileUrl 為 non-empty trimmed string 但不符 `^https?://`（B-strict；不允許 relative path） | `:514` |
| S | `download-content-should-be-noindex` | warning | `contentKind==='download'` 且 `seo.indexing ∉ {noindex-follow, noindex-nofollow}`，且無 D1/D2/D3 warning | `:553` |

關鍵語意：

- 全部 **warning-only**；無 error。
- D1 / D2 / D3 **互斥**（fileUrl 非 string 由 D2 接住；string 但空由 D1 接住限 download 文章；非空但格式錯由 D3 接住）。
- S 為 **fix-first 階層**：若 D1/D2/D3 任一觸發（`hasDownloadFileUrlWarning`）→ 不重複報 S（per `docs/20260530-download-validation-s1-s2-merge-decision.md` §G.1）。
- 現有 download validation **全部針對 `post.download.fileUrl`（legacy 形態）與 `contentKind==='download'`**；**無**任何規則讀 `downloadAssets` / `downloadForms` registry。

### 4.2 現有 rule ordering style

- 規則以 `issues.push({ severity, type, sourcePath, value })` 形態累加（如 `:482` / `:502` / `:514` / `:553`）。
- 互斥規則採 `if / else if` 鏈，避免同欄位重複噪音（mirror `related-links-source-key-*` 三條互斥 pattern，`:212-238`）。
- 階層式 fix-first：上游結構性 warning 觸發時，下游語意 warning 抑制（mirror S 對 D1/D2/D3 之抑制）。
- registry lookup pattern 之既有先例：`related-links-source-key-not-found`（`:235`）——以 `activeSourceKeys` Set 做 `!has()` 判斷 → warning。此為未來 `download-asset-ref-not-found` / `download-form-ref-not-found` 之直接 model。

---

## 5. Candidate Validator Rule Groups

### A. Registry shape validation

分析對象：`downloadAssets` / `downloadForms` 之頂層結構。

- `downloadAssets`：`schemaVersion`（number）/ `assets`（array）/ `notes`（string）。
- `downloadForms`：`schemaVersion`（number）/ `forms`（array）/ `notes`（string）。
- **empty registry 是否合法**：✅ 合法。`assets: []` / `forms: []` 為 acceptable（per schema-decision §4.4 + 4.5）。empty registry **不得**觸發任何 warning，否則破壞 baseline（0/47/42）。
- **malformed registry（schemaVersion 缺失 / assets 非陣列 / JSON 解析失敗）應 fail / warn / defer**：
  - JSON parse 失敗：目前 `readJsonOptional` 之行為決定（loader 層）；validator 層宜 **defer**（不重複報；屬 loader robustness 範疇）。
  - shape 異常（`assets` typeof !== array）：建議 **warning**（`download-registry-invalid-shape`），不 error，避免阻擋 production。
- **適合在 `validate-content.js` 做，或未來另開 settings validator**：
  - 短期建議在 `validate-content.js` 做（mirror 既有 settings-driven validation 如 sourceKey registry），避免新增 entrypoint。
  - 長期若 settings 驗證規則增多，可考慮另開 settings validator；本文件**不**裁決拆分，僅標記為 future option。

### B. Registry key uniqueness

- **asset key/id 是否唯一**：`assetId` 為 primary key，須 kebab-case 且 unique（per schema-decision §5.1）。
- **form key/id 是否唯一**：`formId` 同上（§6.1）。
- **duplicate 應 error 還是 warning**：
  - 保守建議 **warning**（`download-registry-duplicate-key`）。理由：與既有 download validation 全 warning-only 一致；duplicate 在 empty/小型 registry 風險低，不需阻擋 build。
  - 若未來 Admin picker / renderer 依賴 unique key 做 lookup，可考慮升級為 error；本批不升級。
- **empty registry baseline 影響**：empty registry 無 entry → uniqueness check 自然 0 命中 → baseline 不變（0/47/42）。

### C. Content reference validation（未來文章使用 `assetRefs[]` / `formRef` 時）

未來若文章使用 `post.download.assetRefs[]`（多 asset ref）/ `post.download.formRef`（單 form ref，per schema-decision §9.1）：

- 應檢查：
  - referenced asset exists（ref ∈ `downloadAssets.assets[].assetId`）。
  - referenced form exists（ref ∈ `downloadForms.forms[].formId`）。
  - unknown ref → warning（命名見 §6）。
  - empty ref / invalid type（ref 為空字串 / 非 string / 非陣列）→ warning。
- lookup 直接 mirror `related-links-source-key-not-found`（建立 `assetIds` / `formIds` Set，`!has()` → warning）。
- **draft / ready 行為差異**：
  - 與既有 D1（限 `download.enabled===true`）對齊：建議 ref-not-found 對所有 status 報 warning；但「ref 指向 draft asset 而 post 為 ready」之 cross-status warning 屬進階規則，本批不做。
- **Blogger / GitHub content 差異**：download 內容以 Blogger 為主（template `primaryPlatform: blogger`）；validator 統一掃兩站 posts（`validate-content.js` main 同時掃 github + blogger + fixtures），規則對兩站一致，不分站。
- ⚠ **此規則群目前 0 文章使用 `assetRefs[]` / `formRef`**（既有 download 文章仍用 legacy `fileUrl`）；若現在實作，須新增 negative fixture 才能驗證觸發路徑 → 會動 baseline（見 §8 / §10）。

### D. Legacy `download.fileUrl` validation

- 現況：至少仍有文章 / template 使用 `download.fileUrl`（`content/templates/blogger-download-template.md` 即用 `download.fileUrl: ""`）。
- **是否保留 legacy fileUrl**：✅ 保留（grandfather；per schema-decision §2.1 / §9）。不立即 deprecate。
- **是否 warning 提醒 future migration**：可選。候選 `download-fileurl-legacy`（warning，提醒未來遷往 `assetRefs[]`）。⚠ 風險：現有使用 fileUrl 的文章會新增 warning → 動 baseline。**本批不建議實作**（避免污染 47 warnings baseline）。
- **是否不應立刻阻擋 production**：✅ 不阻擋。legacy fileUrl 維持 D1/D2/D3 既有 warning-only 行為。
- **與 `assetRefs[]` / `formRef` 互斥或共存策略**：
  - 過渡期 **共存**：文章可同時有 legacy `fileUrl` 與新 `assetRefs[]`。
  - 未來可加「同時存在 → 提示優先用 ref」之 warning；屬 migration 階段規則，本批不做。

### E. URL format validation

- **fileUrl 是否只允許 http/https**：✅ 既有 D3（`^https?://`，B-strict）已實作；維持不變。
- **是否允許 relative path**：❌ 不允許（per `docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md` §6.1 Option D；D3 已涵蓋）。
- **Google Drive / Google Form URL 是否只做格式，不做 reachability**：✅ 只做格式（`^https?://`）；**不**做網路 reachability 檢查（無前例做網路 I/O；違反 build 純本機原則）。
- **preview-url-risk 是否維持 docs-only policy**：✅ 維持。per `docs/20260530-download-fileurl-preview-url-risk-policy.md` §F：preview-url-risk **不**透過 raw URL regex 在 validator 做；該政策升級依賴 registry 落地後之專屬欄位，**不**在本批處理，**不**做網路檢查。

### F. Download content SEO / noindex rule

- **download 類頁面是否應 noindex**：建議應 noindex（既有 S 已實作此語意）。
- **S1 / S2 是否合併**：✅ 已合併為單一 `download-content-should-be-noindex`（per `docs/20260530-download-validation-s1-s2-merge-decision.md` §F.1 Option Beta；night-5 source landed）。`download-content-marked-index`（S2 獨立 id）保留為 deprecated candidate name，不實作。
- **對現有 47 warnings 可能影響**：S 已是 baseline 一部分（已計入 47）；本批**不**改 S，故 SEO/noindex 對 baseline 無新增影響。

---

## 6. Rule Severity / Naming Proposal

| candidate rule id | severity | production baseline 影響 | 需要 fixture | 是否第一批 |
|-------------------|----------|------------------------|-------------|-----------|
| `download-registry-invalid-shape` | warning | 無（empty registry 合法 → 0 命中） | 否（shape 異常需 malformed registry；但不改 registry → 0 命中；fixture 屬 settings-level，非 post fixture） | ✅ 候選第一批（read-only，0 baseline 影響） |
| `download-registry-duplicate-key` | warning | 無（empty registry → 0 entry → 0 duplicate） | 否（同上；需 malformed registry 才觸發） | ✅ 候選第一批 |
| `download-asset-ref-not-found` | warning | **有風險**（需文章用 `assetRefs[]`；目前 0 篇 → 0 命中，但無觸發樣本 → 須新增 negative fixture 驗證 → 動 baseline） | ✅ 需 negative fixture | ❌ 暫緩（等 `assetRefs[]` 出現） |
| `download-form-ref-not-found` | warning | 同上 | ✅ 需 fixture | ❌ 暫緩 |
| `download-fileurl-invalid-format` | warning | **已存在**（D3；已計入 47） | 已有 | — 已實作；不重複 |
| `download-fileurl-legacy` | warning | **有風險**（現有 fileUrl 文章會新增 warning → 動 baseline） | 否（直接命中現有文章 → 即破壞 baseline） | ❌ 不建議（migration 階段再議） |
| `download-content-should-be-noindex` | warning | **已存在**（S；已計入 47） | 已有 | — 已實作；不重複 |

命名原則：沿用 `download-*` kebab-case prefix，與既有 D1/D2/D3/S 命名一致；ref 類 mirror `related-links-source-key-not-found` 之 `-not-found` 後綴。

---

## 7. Recommended First Validator Batch

要求：不貪多、優先不改 production baseline、優先支援未來 registry-based workflow、避免同時處理 SEO/noindex / preview risk / migration。

| Option | 內容 | baseline 影響 | fixture 需求 | 評估 |
|--------|------|--------------|-------------|------|
| **A** | 只做 registry key uniqueness / shape read-only checks | 🟢 0（empty registry → 0 命中） | settings-level only；post fixture 不需 | 🟢 最安全；支援未來 registry workflow 之第一塊地基 |
| **B** | 只做 content reference validation（`assetRefs`/`formRef`），等 ref 出現再 warn | 🟡 若加 fixture 驗證則動 baseline；若純「等出現」則 0 但無覆蓋 | ✅ 需 fixture 才有測試覆蓋 | 🟡 過早（目前 0 篇用 ref） |
| **C** | legacy fileUrl format validation | 🔴 D3 已存在；新增 `download-fileurl-legacy` 會動 baseline | — | 🔴 重複 / 破壞 baseline |
| **D** | noindex / SEO rule | 🔴 S 已存在 | — | 🔴 重複 |
| **E** | 暫不實作 validator，先做 fixtures or content schema decision | 🟢 0 | — | 🟢 最保守（docs / fixture preanalysis 先行） |

### 7.1 推薦

**推薦：Option E（預設）→ 若 user 明示要進 source，則 Option A 為最小安全集。**

理由：

1. **Option E（預設保守）**：目前 registry empty、0 篇用 ref、legacy/SEO 已覆蓋 → validator source **尚無迫切觸發樣本**；先做 acceptance / fixture preanalysis docs-only 最符合既有 cadence（每步先 docs-only 裁決再 source）。
2. **Option A（若要動 source）**：registry shape / key uniqueness 為 read-only、0 baseline 影響、且為未來 registry-based workflow（Admin picker / renderer / ref 驗證）之必要前置；不碰 legacy fileUrl、不碰 SEO、不碰 preview risk、不碰 migration，邊界最乾淨。
3. 明確**排除** B（過早；需 fixture）/ C（破壞 baseline）/ D（重複）於第一批。

---

## 8. Fixture Strategy（本階段不可新增 fixture）

- **哪些 warning 需要 fixture**：
  - `download-asset-ref-not-found` / `download-form-ref-not-found` → 需 **negative fixture**（含一個指向不存在 assetId/formId 的 `assetRefs[]`/`formRef`）才能驗證觸發。
  - `download-registry-invalid-shape` / `download-registry-duplicate-key` → 屬 **settings-level**，需 malformed registry 才觸發；但本系統不改 registry，故無 post fixture；若要測試須另設 fixture-registry 或 unit-level harness（目前無此 pattern）。
- **fixture 是否會增加 post count**：✅ 會。`validate-content.js` main 會掃 `content/validation-fixtures/{github,blogger}/posts/`；每新增一個 fixture post → post count +1（目前 42 含既有 fixtures）。
- **baseline warning count 可能如何變動**：每個 negative fixture 觸發其目標 warning → warning count +N（每 fixture 至少 +1）。故引入 ref 規則 + fixture → baseline 從 47 上升。
- **fixture 應放哪裡**：`content/validation-fixtures/{github,blogger}/posts/_test-*.md`（沿用既有命名，如 `_test-related-links-*`）。
- **是否要先做 fixture preanalysis**：✅ 建議。ref 規則之 fixture 設計（negative / positive 分開、命名、預期 warning 數）宜先獨立 docs-only fixture preanalysis（mirror `docs/20260530-download-validation-warning-fixture-design-preanalysis.md` 之先例）。
- **是否需要 negative / positive fixture 分開**：✅ 建議分開。negative（ref 指向不存在 → 觸發 warning）+ positive（ref 指向 registry 內存在 entry → 不觸發），以同時驗證「該報時報、不該報時不報」；但 positive fixture 需 registry 內有真實 entry → 牽動 registry，複雜度較高，宜於 fixture preanalysis 階段裁決。

---

## 9. Implementation Scope For Future Source Phase

未來若實作 validator rules，可能涉及：

- `src/scripts/validate-content.js`（新增 registry shape / uniqueness / ref lookup 規則）。
- `content/validation-fixtures/{github,blogger}/posts/_test-*.md`（negative / positive fixtures）。
- docs acceptance（read-only cross-check 驗收 commit）。

> **本 phase 不修改上述任何檔案。** 本 phase 僅新增本 docs 檔；`validate-content.js` / fixtures / registry / template 一行不動。

---

## 10. Baseline Impact Estimate

- **若只讀空 registry（Option A，read-only shape/uniqueness）**：empty registry → 0 entry → shape 合法、0 duplicate → baseline **維持 0 / 47 / 42**。
- **若新增 fixture（Option B ref 規則 + negative fixture）**：
  - post count：42 → 42 + N（每 fixture +1）。
  - warning count：47 → 47 + M（每 negative fixture 觸發目標 warning +1 起）。
- **warning 可能增加**：`download-asset-ref-not-found` / `download-form-ref-not-found` 之 negative fixture；`download-fileurl-legacy` 若實作會直接命中現有 fileUrl 文章（即破壞 baseline，不建議）。
- **哪些方案最不影響現有 baseline**：
  - 🟢 Option E（不動 source）→ 0 影響。
  - 🟢 Option A（read-only shape/uniqueness on empty registry）→ 0 影響。
  - 🔴 Option B（ref + fixture）/ C（legacy warning）→ 動 baseline。

---

## 11. Scope / Non-goals

本 phase **明確不做**：

- ❌ registry mutation（不寫 `download-assets.json` / `download-forms.json`）
- ❌ respondent data（不引入任何個資欄位）
- ❌ token / private Drive info（不引入秘密 / 私人路徑）
- ❌ content migration（不遷 `download.fileUrl` → `assetRefs[]`）
- ❌ Admin picker
- ❌ renderer / landing page
- ❌ build / deploy
- ❌ Blogger repost
- ❌ GA4 validation
- ❌ reverse UTM activation
- ❌ pm-26 unblock
- ❌ Admin Apply / middleware write route / `admin-write-cli` dry-run / apply / real write
- ❌ 修改 `validate-content.js` / `load-settings.js` / 任何 source
- ❌ 新增 fixture / 新增 warning / 實作任何 validator rule

---

## 12. Candidate Next Phases

| 候選 | 性質 | 啟動條件 |
|------|------|---------|
| **Final Idle Freeze / EXIT** | — | ✅ 預設；本 phase 結束即 freeze |
| download validator rules preanalysis **acceptance read-only** | docs-only / read-only | 保守 next；cross-check 驗收本 docs commit |
| download validator source **preflight** read-only | read-only | 進 source 前之最後 read-only 盤點 |
| download validator **source implementation**（Option A 最小集） | source | ⚠ future only；**需 user 明示** |
| download validator **fixture strategy** docs-only | docs-only | ref 規則 fixture 設計先行（mirror warning-fixture-design 先例） |
| download **registry hardening / malformed JSON behavior** docs-only | docs-only | registry robustness 規劃（shape / parse-fail 行為裁決） |

---

## 13. Final Recommendation

- **是否要進 validator source implementation**：**否**（預設）。目前 registry empty、0 篇用 ref、legacy/SEO 已覆蓋，無迫切觸發樣本；維持 docs-first cadence。
- **若要進（user 明示）第一批只做哪個最小 rule group**：**Option A** —— registry shape / key uniqueness 之 read-only checks，全 warning-only，0 baseline 影響，且為未來 registry-based workflow 之乾淨地基；明確排除 ref（B）/ legacy warning（C）/ SEO（D）。
- **是否需要先做 acceptance**：✅ 建議。進 source 前先做本 docs commit 之 read-only acceptance cross-check，符合既有保守節奏。
- **預設**：**Final Idle Freeze / EXIT**；不自動啟動下一 phase；下一步若要保守，應做 read-only acceptance cross-check 驗收此 docs commit。
