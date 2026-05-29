# 20260530 Download Validation Warning / Fixture Design Preanalysis

> Phase: `20260530-am-3-download-validation-warning-fixture-design-preanalysis-docs-only-a`
> Date: 2026-05-30 07:22 +0800
> Scope: **docs-only**（無 source / content / settings / templates / package / dist / gh-pages 變更）

---

## 1. Executive Summary

- 本 phase 是 **docs-only preanalysis**，**不**改 `src/scripts/validate-content.js`、**不**新增 fixture、**不**改 content、**不**新增 settings registry、**不**建立 download landing page source。
- 目標：在進入「download validation 規則之 source implementation」前，**先固化**規則設計的決策面，包括：
  1. warning / error / skip-now 之邊界
  2. 每條規則之觸發條件
  3. 建議 warning id / message copy
  4. 是否需要 fixture / 採用何種 fixture 策略
  5. fixture 對 `validate:content` baseline 之預期影響
  6. rollout order（保守、additive、可分階段）
  7. 哪些規則必須等 settings registry / download landing page source 落地後才能實作
- 本文件延續並收斂：
  - `docs/20260530-download-validation-rules-preanalysis.md`（rule candidate inventory，命名與分類）
  - `docs/20260529-download-landing-page-schema-preanalysis.md`（schema / SEO reuse / registry options）
  - `docs/20260529-download-landing-page-admin-model-preanalysis.md`（admin ownership boundary）
  - `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md`（hybrid 推薦方向 + R1 / R2 / R3 紅線）
  - `docs/20260529-reverse-utm-download-fileurl-decision-preanalysis.md`（`download.fileUrl` 為空之 hard gate；不假造 URL）
  - `docs/20260529-reverse-utm-fixture-publish-readiness-preanalysis.md`（draft fixture 不可 promote；reverse UTM dormant）
- **規則命名以 `docs/20260530-download-validation-rules-preanalysis.md` 為準**（D1 / D2 / D3 / S1 / S2 / F1 / F2 / A1 / A2 / A3 / D4 non-rule 宣告），本文件**不**重新命名、**不**重新分類。
- 本 phase **不**啟用任何規則、**不**修改 validator source、**不**承諾啟用時機；**不**改變 baseline `0 errors / 42 warnings / 37 posts`。

---

## 2. Baseline Snapshot

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `c08d9a2d6985e93c35581f4187363ee427de1a73` |
| origin/main | `c08d9a2d6985e93c35581f4187363ee427de1a73` |
| short hash | `c08d9a2` |
| latest subject | `docs(download): plan validation rules for download landing pages` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`，無 untracked） |
| `validate:content` | **0 error(s) / 42 warning(s) on 37 post(s)** |

> 42 warnings 全屬 `content/validation-fixtures/`（validator 預期錯誤樣本，by design），非 regression。Baseline 與 phase 起始預期完全相符。

本 phase 落地後預期 baseline 不變（純新增一份 docs 檔，無 content / source / fixture 改動）。

---

## 3. Source Documents Reviewed

| 文件 | 角色 | 狀態 |
|------|------|------|
| `docs/20260530-download-validation-rules-preanalysis.md` | rule candidate inventory（D1 / D2 / D3 / S1 / S2 / F1 / F2 / A1 / A2 / A3 + D4 non-rule） | ✅ 已讀 |
| `docs/20260529-download-landing-page-admin-model-preanalysis.md` | Admin ownership boundary（pm-12 + pm-18 appendix）；§4 SEO indexing boundary | ✅ 已讀 |
| `docs/20260529-download-landing-page-schema-preanalysis.md` | DownloadLandingPage / FormConfig / DownloadAsset record 草案；§10 SEO reuse；§11 registry options A–D；§13 validation gates 草擬 | ✅ 已讀 |
| `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md` | hybrid（C → D 落地路徑）推薦；R1 / R2 / R3 紅線；§9 future file boundaries；§15 validation considerations | ✅ 已讀 |
| `docs/20260529-reverse-utm-download-fileurl-decision-preanalysis.md` | `download.fileUrl` 空值 hard gate；不假造 URL；fileUrl Options A–E | ✅ 已讀（實際檔名為 `20260529-reverse-utm-download-fileurl-decision-preanalysis.md`；指示文中之 `20260529-download-fileurl-decision-preanalysis.md` 為簡寫，**actual file exists**） |
| `docs/20260529-reverse-utm-fixture-publish-readiness-preanalysis.md` | fixture 仍 draft；不 promote；reverse UTM dormant；pm-26 blocked | ✅ 已讀 |

### 3.1 missing-but-non-blocking

- 指示文提及之 `docs/20260529-download-fileurl-decision-preanalysis.md` 在 `docs/` 下**不**存在；實際對應檔為 `docs/20260529-reverse-utm-download-fileurl-decision-preanalysis.md`。屬命名簡寫差異，**非**檔案缺失；不阻擋本 phase。

### 3.2 cross-referenced（read for grounding，非清單明列來源）

| 檔案 | 用途 |
|------|------|
| `src/scripts/validate-content.js`（read-only） | 確認既有 warning id 命名慣例（kebab-case、`download-*` / `book-*` / `related-links-*` 之 prefix-noun-状態 pattern；`severity: 'warning'` + `type: '...'` + `sourcePath` + optional `value`）；確認 ready/published vs 所有 status 之觸發範圍 pattern。 |
| `content/validation-fixtures/blogger/posts/_test-book-mediatype-invalid.md`（範例） | 確認既有 fixture 命名慣例（`_test-*.md`）、frontmatter 結構（`title: "[validation-fixture] ..."` / `status: "ready"`）、與 by-design warning 之 baseline 共存模式。 |

---

## 4. Existing Validation Baseline

當前 `validate:content` baseline：

```
0 error(s) / 42 warning(s) on 37 post(s)
```

- 42 warnings 全屬 `content/validation-fixtures/blogger/posts/_test-*.md`（validator 預期錯誤樣本，by design）。
- 37 posts 含正式內容 + validation-fixtures。
- 本 phase **不**新增任何 fixture、**不**改任何既有檔案 → 純新增 1 個 docs 檔 → **baseline 不變**。
- 任何後續落地（無論 source 或 fixture）皆需保持 `0 errors`；warnings 數變化僅在新增 fixture 或 warning rule 同步啟動時才允許，且須事先在文件中**預告 expected baseline change**（per `docs/20260530-download-validation-rules-preanalysis.md` §8.2 防退步原則）。

本 phase **明確**不應改變 baseline。

---

## 5. Rule Candidate Matrix

> 規則代號與命名以 `docs/20260530-download-validation-rules-preanalysis.md` 為準；本文件**不**自行造新代號。

| Rule id | Rule purpose | Trigger condition | Severity recommendation | Blocking dependency | Fixture needed? | Expected baseline impact | Implementation readiness |
|--------|--------------|-------------------|------------------------|---------------------|-----------------|--------------------------|--------------------------|
| **D1** `download-enabled-fileurl-empty` | 提示 `download.enabled=true` 但 `download.fileUrl` 為空之矛盾 | `contentKind === 'download'` 且 `download.enabled === true` 且 `download.fileUrl` 為 `""` / `undefined` / 非字串 | **warning**（first pass；不直接 error）；建議**選項 A**：僅 ready / published 觸發 | 無上游 dep（純 frontmatter 檢查） | 🟢 positive + negative 皆建議 | ready/published only：**+0**（目前唯一 download 文章為 draft）；負 fixture（ready + enabled + empty fileUrl）：**+1** | ✅ ready to implement（不需 registry） |
| **D2** `download-fileurl-invalid-type` | 型別錯誤（非字串） | `download.fileUrl !== undefined` 且 `typeof !== 'string'` | **warning**；所有 status（mirror `book-volume-invalid-type` pattern） | 無 | 🟡 negative only（型別錯例）；positive 為一般有效 string | **+1**（負 fixture） | ✅ ready to implement |
| **D3** `download-fileurl-invalid-format` | URL 形式不合法（非 http(s)，或不符允許之相對路徑形式） | `download.fileUrl` 為 non-empty string 但不符允許形式 | **warning**；所有 status（mirror `invalid-canonical` pattern） | 🟡 中：是否允許相對路徑（如 `/downloads/foo.zip`）未裁決，影響 regex；裁決可在 implementation phase 內同步 | 🟡 negative only（一筆典型錯誤形式） | **+1**（負 fixture） | 🟡 ready with 1 outstanding decision（相對路徑允許 / 不允許） |
| **D4** `download-fileurl-reachability-not-checked` | **非規則**：明確宣告 validator 不做網路 reachability check | n/a（governance statement） | n/a | n/a | n/a（不可用 fixture 強制 network check） | 0 | ✅ docs-only governance；無 source 改動 |
| **S1** `download-content-should-be-noindex` | 提示 `contentKind=download` 但 `seo.indexing` 未顯式設或設為 `index`；行為層已 fallback `noindex-follow`，warning 提示作者顯式宣告 | `contentKind === 'download'` 且（`seo.indexing` undefined 或 `=== 'index'`） | **warning**；ready / published | 🟡 中：與 S2 是否合併未裁決 | 🟢 negative（ready + download + 未設 indexing；ready + download + indexing=index） | **+1 ~ +2**（每筆負 fixture +1） | 🟡 ready with 1 outstanding decision（S1 / S2 合併與否） |
| **S2**（候選）`download-content-marked-index` | 作者顯式把 download content 設成 `seo.indexing=index`，與「下載頁不應為搜尋直達入口」原則相違 | `contentKind === 'download'` 且 `seo.indexing === 'index'` | **warning**；ready / published | 🟡 中：可能與 S1 合併為一條 | 🟡 negative（若獨立規則） | **+1**（若獨立負 fixture） | 🟡 同 S1 |
| **F1** `download-formref-missing` | ready / published download 文章未指定 `formRef` | `contentKind === 'download'` 且 status 為 ready/published 且 `formRef` undefined / `""` | **warning**；ready / published | 🔴 **registry-dependent**：`formRef` 欄位 / FormConfig registry 尚未存在 | 🔴 fixture 不可獨立先做（需先有 registry + frontmatter 欄位定義） | **skip-now**（無 schema 可觸發） | ❌ **NOT ready**（gated） |
| **F2** `download-formref-not-found` | `formRef` 指向 FormConfig registry 不存在之 entry | `formRef` non-empty string 但 registry lookup miss | **warning**；mirror `series-id-not-in-settings` / `related-links-source-key-not-found` pattern | 🔴 **registry-dependent**：需 FormConfig registry + `loadSettings()` 串接 | 🔴 同上 | **skip-now** | ❌ **NOT ready**（gated） |
| **A1** `download-assetrefs-invalid-type` | `assetRefs` 存在但非 array | `assetRefs !== undefined` 且非 array | **warning**；mirror `related-links-not-array` pattern | 🔴 **registry-dependent**：`assetRefs[]` 欄位尚未定義 | 🔴 同 F1 / F2 | **skip-now** | ❌ **NOT ready**（gated） |
| **A2** `download-assetrefs-empty` | ready / published download 文章 `assetRefs` 為空 array 或未設 | `contentKind === 'download'` 且 ready/published 且 assetRefs 空 / 未設 | **warning**；ready / published | 🔴 **registry-dependent** + 🟡 是否允許「純表單流（無 asset，後續 email 寄送）」未裁決 | 🔴 同 F1 | **skip-now** | ❌ **NOT ready**（gated + 1 outstanding decision） |
| **A3** `download-assetref-not-found` | `assetRefs[i]` 指向 DownloadAsset registry 不存在之 entry；逐 entry push | `assetRefs[i]` non-empty string 但 registry lookup miss | **warning**；mirror `related-links-source-key-not-found` pattern | 🔴 **registry-dependent**：需 DownloadAsset registry + `loadSettings()` 串接 | 🔴 同 F1 | **skip-now** | ❌ **NOT ready**（gated） |

### 5.1 Matrix 摘要

- **可在「無 registry」前提下實作**：D1 / D2 / D3 / S1 / S2（純 frontmatter 結構檢查）；D4 為 non-rule 宣告，無 source 改動。
- **必須等 registry 落地後才能實作**：F1 / F2 / A1 / A2 / A3（ref-resolution 類）。
- **outstanding decisions**（implementation phase 同步裁決即可，不必在本 phase 解）：
  1. D1 觸發範圍：選項 A（ready/published only）vs 選項 B（所有 status）—— 推薦 A。
  2. D3 是否允許相對路徑形式。
  3. S1 與 S2 是否合併為一條。
  4. A2 是否允許「純表單流（無 asset）」之 download。

---

## 6. Suggested Warning IDs and Message Copy

> **本節為 implementation 前之命名 / copy 建議**；正式訊息由 implementation phase 同步裁決。`sourcePath` 為現有 validator 慣例（per `src/scripts/validate-content.js`），會自動附在每個 issue object，故下表「是否含 file path」皆為 ✅。

格式建議（與既有 `invalid-canonical` / `book-volume-invalid-type` / `related-links-entry-missing-url` 對齊）：
- 訊息 **核心為英文短句**（與既有 warning id / value pattern 對齊；renderer 印出時為 `[WARNING] <type>: <value or composed text>`）。
- 中文解釋只放於本 docs 文件 / future fixture 內 body，**不**進 validator output。
- 修補提示（remediation hint）為「給作者的下一步建議」，由 docs / output formatter 附加；validator 本身可不印，由 console renderer / docs 文件補。

### 6.1 D1 — `download-enabled-fileurl-empty`

- **warning id**：`download-enabled-fileurl-empty`
- **concise English message**（建議 `value` 字串）：`download.enabled=true but download.fileUrl is empty (typeof=${typeof fileUrl})`
- **Traditional Chinese explanation**（給 docs / 作者）：本文已標記為下載文（`contentKind=download`）且 `download.enabled=true`，但 `download.fileUrl` 仍為空字串 / 未設。ready / published 後文章內 download box 會因 falsy fileUrl 被靜默省略，產出「下載文沒有下載按鈕」之內容品質缺陷。
- **recommended remediation hint**：取得真實下載資產 URL 後填入；或在資產未就緒前維持 `status: draft`，或將 `download.enabled` 改為 `false`。**不**得填入假 URL / Google Form URL（per R2 紅線）。
- **是否包含 file path / post title / field path**：✅ file path（`sourcePath`，validator 慣例）；🟡 post title 由 console renderer 依情境附加（既有 warning 多以 `sourcePath` + `type` + `value` 為主，title 非必要）；✅ field path（`download.fileUrl`，在 `value` 內或單獨 `field` 欄位）。

### 6.2 D2 — `download-fileurl-invalid-type`

- **warning id**：`download-fileurl-invalid-type`
- **concise English message**（建議 `value`）：`typeof=${typeof download.fileUrl}`
- **Traditional Chinese explanation**：`download.fileUrl` 須為字串；目前型別非字串（可能為 null / number / object / array）。
- **recommended remediation hint**：把 `download.fileUrl` 改為合法字串（或上線前維持空字串 placeholder）。
- **是否含 file path / title / field path**：✅ file path；🟡 title 非必要；✅ field path（隱含於 type id）。

### 6.3 D3 — `download-fileurl-invalid-format`

- **warning id**：`download-fileurl-invalid-format`
- **concise English message**（建議 `value`）：`download.fileUrl="${url}" is not a valid http(s) URL`（若 implementation phase 裁決允許相對路徑，可改為 `not a valid http(s) URL or allowed relative path`）。
- **Traditional Chinese explanation**：`download.fileUrl` 不符合允許之 URL 形式（http(s):// 或 implementation phase 裁決之相對路徑形式）。
- **recommended remediation hint**：確認 URL 開頭為 `http://` 或 `https://`；若採相對路徑，須符合 implementation phase 定義之 prefix（命名待定）。
- **是否含 file path / title / field path**：✅ file path；🟡 title 非必要；✅ field path。

### 6.4 D4 — non-rule 宣告（reachability）

- **warning id**：n/a（無 warning，無 source 改動）。
- **Traditional Chinese explanation**：validator **永遠不**做網路 reachability check（不發 HEAD / GET 驗 fileUrl 可達）。理由：(1) validator 須 deterministic / offline-safe；(2) CI / pre-commit 不應因網路抖動失敗；(3) reachability 屬 manual gate 或獨立 `check-broken-links.js` pipeline，與 `validate-content` 分離。
- **是否含 file path / title / field path**：n/a。

### 6.5 S1 — `download-content-should-be-noindex`

- **warning id**：`download-content-should-be-noindex`（若與 S2 合併，可沿用此 id 並擴充條件）
- **concise English message**（建議 `value`）：`contentKind=download but seo.indexing not explicitly set (fallback noindex-follow applies)` 或 `contentKind=download but seo.indexing="${value}"`
- **Traditional Chinese explanation**：本文 `contentKind=download`，行為層 `build-github.js` / `build-sitemap.js` 已對 download 文章 fallback 套 `noindex, follow` + 排除 sitemap；但 frontmatter 之 `seo.indexing` 未顯式設定（或顯式設為 `'index'`），未來 fallback 變更時可能造成 SEO 行為意外飄移。
- **recommended remediation hint**：在 frontmatter 顯式設 `seo.indexing: noindex-follow`，使「download 為 noindex」成為文件層顯式宣告而非 fallback；或若確實要可索引，請改 `contentKind` 並評估是否要照 download landing page 規格（pm-16 §10 / pm-20 §13）。
- **是否含 file path / title / field path**：✅ file path；🟡 title 非必要；✅ field path（`seo.indexing`）。

### 6.6 S2 — `download-content-marked-index`（若獨立於 S1）

- **warning id**：`download-content-marked-index`
- **concise English message**（建議 `value`）：`contentKind=download but seo.indexing="index" (download content should not be a search entry point)`
- **Traditional Chinese explanation**：作者顯式把 download content 設為 `seo.indexing=index`，與「下載頁 / 下載文不應成為搜尋直達入口」原則（per pm-12 §4）相違。
- **recommended remediation hint**：改為 `noindex-follow`；若意圖讓**文章頁**（非下載頁）保持可索引，請確認此筆內容是 article 而非 download landing page，並重新檢視 `contentKind`。
- **是否含 file path / title / field path**：✅ file path；🟡 title 非必要；✅ field path。

### 6.7 F1 / F2 / A1 / A2 / A3 — registry-dependent

> 以下命名與 copy 為**草案**；待 registry schema 定稿後始能精確化，本 phase **不**最終裁決。

| 規則 | warning id 建議 | concise English message 建議 | 中文解釋 | remediation hint | 包含 path / title / field |
|------|----------------|------------------------------|---------|------------------|--------------------------|
| F1 | `download-formref-missing` | `formRef missing for ready/published download content` | ready / published 之 download 文章未指定 `formRef`，無法掛上對應 Google Form 設定 | 在 frontmatter 加 `formRef: <formId>`，或維持 draft 直到 FormConfig 就緒 | ✅ path / 🟡 title / ✅ field（`formRef`） |
| F2 | `download-formref-not-found` | `formRef="${value}" not found in FormConfig registry` | `formRef` 指向之 entry 在 FormConfig registry 不存在（dangling ref） | 確認 registry 中是否存在對應 formId；或修正 `formRef` 拼字 | ✅ path / 🟡 title / ✅ field |
| A1 | `download-assetrefs-invalid-type` | `assetRefs typeof=${typeof value} (expected array)` | `assetRefs` 應為 string array，但型別錯誤 | 改為 `assetRefs: [<assetId>, ...]` 形式 | ✅ path / 🟡 title / ✅ field（`assetRefs`） |
| A2 | `download-assetrefs-empty` | `assetRefs empty for ready/published download content` | ready / published 之 download 文章未掛任何 asset | 加入至少 1 個 `assetRefs[]` entry；或（若 implementation phase 裁決允許）以「純表單流」標記 | ✅ path / 🟡 title / ✅ field |
| A3 | `download-assetref-not-found` | `assetRefs[${i}]="${value}" not found in DownloadAsset registry` | 第 i 個 assetRef 在 DownloadAsset registry 不存在（dangling ref） | 確認 registry 中是否存在對應 assetId；或修正 entry 拼字 | ✅ path / 🟡 title / ✅ field |

### 6.8 命名慣例摘要

- 全部採 kebab-case，與既有 `download-*` / `book-*` / `related-links-*` / `series-*` warning id pattern 一致。
- 不使用 `error-` / `warn-` 等前綴；severity 由 issue object `severity` 欄位承載，非 id 一部分。
- `value` 欄位承載作者輸入之實際違規值（per `book-mediatype-invalid` / `invalid-canonical` 既有 pattern），便於 console output 一眼定位。
- file path 由現有 `sourcePath` 機制自動附加，**不**需在 id / message 內重複。

---

## 7. Error vs Warning Boundary

### 7.1 現階段**只能 warning** 之項目（first pass，warning-only additive）

- D1 / D2 / D3：所有 fileUrl 結構檢查。
- S1 / S2：SEO consistency 提示型 warning。
- F1 / F2 / A1 / A2 / A3：所有 ref-resolution 類規則（即使未來 registry 落地，first pass 仍建議 warning）。

理由（per `docs/20260530-download-validation-rules-preanalysis.md` §3 / §8.2）：
- 既有 `related-links-*` / `series-*` / `book-*` 全為 warning-only 開頭；download 系列規則應**保持一致 cadence**。
- baseline `0 errors` 為 hard contract；任何新 error gate 需獨立 phase 與 explicit approval。
- 直接 error 風險：draft fixture / template / 過渡狀態文章可能立刻 fail，破壞 baseline。

### 7.2 未來**可升級 error** 之項目（需獨立 phase + explicit approval）

| 規則 | 升級 error 之觸發條件假設 | 評估 |
|------|-------------------------|------|
| D1（ready/published only） | ready/published download 文章必須有非空 `download.fileUrl`（hard publish gate）| 🟡 候選；可在 source registry / landing page 完整落地後評估，避免一次升太多。 |
| D3（無效 URL 形式） | ready/published 文章之 `download.fileUrl` 形式必須合法 | 🟡 候選；同 D1 cadence。 |
| S1 / S2 | ready/published download content 必須顯式 `seo.indexing=noindex-follow` | 🟡 候選；可待 download landing page source 落地後評估。 |
| F1 / A2 | ready/published download 必須有 `formRef` / `assetRefs[]` | 🟡 候選；依「純表單流 vs 必含 asset」裁決而定。 |
| F2 / A3 | dangling ref（registry 找不到對應 entry）一律 error | 🟢 較合理升級候選（dangling ref 屬 hard data integrity 錯誤）；但仍須獨立 phase。 |

### 7.3 必須等 registry / source 落地後**才可判斷 severity** 之項目

- F1 / F2 / A1 / A2 / A3：依賴 FormConfig / DownloadAsset registry 之 schema 與 loader 串接，**未落地前 severity 為 N/A**（無 source 可觸發；無 fixture 可驗證）。

### 7.4 **不**應由 `validate-content.js` 負責之項目

- 外部 URL reachability（D4 已明示）：屬 `check-broken-links.js` pipeline 或 manual gate。
- Google Form response data：屬 Google Forms / Sheets 平台，**永遠**不進 repo（per R1 紅線）。
- GA4 實測：屬部署後驗收（manual / Realtime），非 validator 範圍。
- Google Drive 檔案是否真的可下載：屬 manual gate。
- Blogger 後台貼上後之渲染：屬 Blogger 平台預覽，非 validator 範圍。
- Admin write feature：完全獨立之 governance pipeline（per `admin-2-write-pre-analysis.md`），與 validation 無關。

---

## 8. Fixture Strategy

> **本 phase 不新增任何 fixture**。本節為**未來** fixture 設計之預先記錄，僅供下一 fixture-add phase 直接讀取，避免重新盤點。

### 8.1 是否需要 positive / negative fixture

| 規則 | positive fixture | negative fixture | 備註 |
|------|------------------|------------------|------|
| D1 | 🟡 部分需要：可借用既有 `content/blogger/posts/20260529-phonics-practice-sheet-download.md`（draft、enabled=true、empty fileUrl）作為「draft 不觸發」之 implicit positive；不必另建 ready positive（會立刻違反 baseline） | 🟢 需要：`_test-download-enabled-fileurl-empty.md`（ready + enabled=true + fileUrl=""）→ 必觸發 D1 | draft 不算 fixture，僅為 baseline reference |
| D2 | 🟡 不必要：一般有效 string 即為 positive；現有任何 download 文章皆隱含 positive case | 🟢 需要：`_test-download-fileurl-invalid-type.md`（ready + fileUrl 設為 number / null） | mirror `book-volume-invalid-type` |
| D3 | 🟡 不必要：合法 http(s) URL 即為 positive | 🟢 需要：`_test-download-fileurl-invalid-format.md`（ready + fileUrl 為 `"not-a-url"` 或 `"ftp://..."`） | mirror `invalid-canonical` |
| S1 | 🟡 不必要：明確設 `seo.indexing: noindex-follow` 之 download 文章為 implicit positive | 🟢 需要：`_test-download-content-no-seo-indexing.md`（ready + contentKind=download + seo.indexing 未設） | |
| S2 | 同 S1 positive | 🟢 需要（若獨立於 S1）：`_test-download-content-marked-index.md`（ready + contentKind=download + seo.indexing=index） | 若 S1 / S2 合併，此 fixture 併入 S1 negative |
| F1 / F2 / A1 / A2 / A3 | ❌ 不可現在做 | ❌ 不可現在做（registry / 欄位 schema 未定稿） | 規則啟用同 phase 同步建 fixture |

### 8.2 每個 fixture 的最小 frontmatter / body 需求

> mirror 既有 `_test-book-mediatype-invalid.md` pattern；位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描，**不**會被 `build:github` / `build:blogger` / `build:promotion` 掃到。

**通用 frontmatter 最小集**（所有 fixture）：

```yaml
title: "[validation-fixture] <rule descriptor>"
slug: "test-<kebab-rule-id>"
status: "ready"             # 為觸發 ready/published-only 規則
draft: false
date: "2026-MM-DD"
description: "<phase> fixture：故意觸發 <warning-id> warning。"
contentKind: "download"     # D1 / S1 / S2 必設；D2 / D3 可選
site: "blogger"             # 或 github，依規則 / 既有慣例
primaryPlatform: "blogger"
category: "<existing-category-id>"
tags: ["download"]
cover: "/images/placeholders/cover.png"
```

**規則特定欄位**：

- D1：`download: { enabled: true, fileUrl: "" }`
- D2：`download: { enabled: true, fileUrl: 123 }`（或其他非字串）
- D3：`download: { enabled: true, fileUrl: "not-a-url" }`
- S1：**不設** `seo.indexing`（or `seo` 整個 block 缺）
- S2：`seo: { indexing: "index" }`

**body 最小集**（mirror `_test-book-mediatype-invalid.md`）：

```markdown
本 fixture 故意設計 <field> 為 <value>（非合法值）→ 觸發 `<warning-id>`。

本檔位於 `content/validation-fixtures/blogger/posts/`，僅供 `validate-content` 掃描；
不會被 `build:github` / `build:blogger` / `build:promotion` 掃到。
```

### 8.3 fixture 是否會增加 posts count

- 是。每個 fixture 為一篇 .md，會讓 `validate:content` 之 posts count 從 37 → 37 + N（N 為新 fixture 數）。
- 既有 baseline message：`37 post(s)` → 新 baseline message：`(37 + N) post(s)`。
- 此屬「**expected baseline change**」，非 regression；落地該 phase 須事先在 commit message / docs 中明示。

### 8.4 fixture 是否會增加 warning count

- 是。每個 negative fixture 預計 +1 warning（與規則一一對應）。
- 若 S1 / S2 合併為一條規則，且採用兩個 fixture（一個 undefined、一個 index），則合併規則之 fixture +2 warnings（共觸發兩次同 id）；若僅留一個 fixture，+1 warning。
- 此屬「**expected baseline change**」，落地該 phase 須事先在 commit message / docs 中明示「baseline 42 → 42 + N」。

### 8.5 如何避免污染 formal content

- **目錄隔離**：所有 fixture 一律放 `content/validation-fixtures/blogger/posts/` 或 `content/validation-fixtures/github/posts/`，依規則影響 site 而定。
- **檔名 prefix**：一律 `_test-*.md`（沿用既有慣例）；`build:github` / `build:blogger` / `build:promotion` 已隔離此目錄。
- **frontmatter 標題前綴**：`title: "[validation-fixture] ..."`，使其在任何意外渲染情境中亦可一眼識別為 fixture。
- **不**填真實 URL / 真實 form ID / 真實 asset ID（守 R1 / R2 紅線）；fixture 之 URL 應為明顯虛假值（如 `not-a-url`、`example.invalid` 等）。
- **不**填真實 Drive ID / Form ID；F2 / A3 之 ref-not-found fixture 應使用明顯不存在之 id（如 `nonexistent-form-id` / `nonexistent-asset-id`）。

### 8.6 是否使用 `_test-*` 命名慣例

- ✅ 是。已是既有 validation fixture 之 universal convention（per `content/validation-fixtures/blogger/posts/` 全部 24 個檔案）。
- 命名公式：`_test-<warning-id-with-or-without-shortening>.md`，例如 `_test-download-enabled-fileurl-empty.md`、`_test-download-fileurl-invalid-type.md`。

---

## 9. Baseline Impact Forecast

> 三種未來落地方式之 baseline 影響評估。本 phase 只是文件記錄；任一方案啟動皆須獨立 phase + explicit approval。

### Option A — source warning only, no fixture

啟用 D1 / D2 / D3 / S1（/ S2）source rules，**不**新增任何 fixture。

| 維度 | 評估 |
|------|------|
| validate errors | 預期維持 **0** |
| validate warnings | 預期 +0 ~ 少數（依現有 download 文章狀態）：D1 ready/published only → 目前 0；D2 → 0；D3 → 0（既有 fileUrl 為空字串不觸發）；S1 → 可能 +1（若既有 draft download fixture 未設 `seo.indexing`，但目前為 draft 應不觸發 ready/published-only 規則）→ 實際很可能 **+0** |
| posts count | 不變（37） |
| risk | 🟢 低：baseline 幾乎不變；但**驗證力弱**——無 negative fixture 表示後續 regression（rule 退化）將無法被 `validate:content` 直接接住 |
| recommended? | ❌ **not recommended as final landing**：缺乏 regression protection；可作為 source PR 之**中繼步**（同 PR 接續加 fixture） |

### Option B — source + fixture with expected new warnings

啟用 D1 / D2 / D3 / S1（/ S2）source rules **同時**新增對應 negative fixture。

| 維度 | 評估 |
|------|------|
| validate errors | 預期維持 **0** |
| validate warnings | 預期 **+N**（N = 啟用之 rule 數，每條對應 1 negative fixture）→ baseline 42 → 42 + N |
| posts count | **+N**（37 → 37 + N） |
| risk | 🟡 中：baseline 變動須事先 docs 明示為「expected change」；commit message 須清楚註記新 baseline；長期維護更穩（regression 被接住） |
| recommended? | 🟢 **recommended**：與既有 `book-*` / `related-links-*` / `series-*` 落地 cadence 一致；source + fixture 同 PR 落地是專案已成熟之 pattern |

### Option C — source + fixture but keep baseline stable by using isolated test fixture pattern

啟用 source rules，並把 fixture 放置於 **不被 validate:content 掃描** 之 isolated 位置（如 `tests/fixtures/` 或 spec 內 inline）。

| 維度 | 評估 |
|------|------|
| validate errors | 預期維持 **0** |
| validate warnings | 預期 **+0**（baseline 不變） |
| posts count | 不變（37） |
| risk | 🔴 較高：需新增獨立 test runner / spec runner 來消費 isolated fixture，否則 fixture 完全無 enforcement；本 repo 目前**無**獨立 spec runner（既有 fixture 皆透過 validate:content 全量掃描接住）；引入新 runner = 新基礎設施 = 違反「保守先行 / 最少新基礎設施」原則 |
| recommended? | ❌ **not recommended**：違反既有 fixture cadence；新增 test infra 成本不成比例 |

### 9.1 推薦選擇

**Option B**：source + fixture（同 PR / 同 phase 落地），明示 baseline `42 → 42 + N` 為 expected change。此選擇與專案既有落地 cadence 一致，且最能保住未來 regression 防護力。

---

## 10. Dependency Gates

> 下列為各規則啟用之前置條件；任一未滿足，該規則**不**啟用。

| 項目 | 受影響規則 | 狀態 |
|------|-----------|------|
| **settings registry**（FormConfig / DownloadAsset schema 接受 + 實際 file 建立 + `loadSettings()` 串接） | F1 / F2 / A1 / A2 / A3 | ❌ 未落地（per pm-20 §2.1：仍只有 docs / preanalysis） |
| **download landing page source**（renderer / template） | S1 / S2 之未來 error 升級評估；F1 / A2 之 ready/published gate 假設 | ❌ 未落地 |
| **asset registry**（DownloadAsset 之 file 建立） | A1 / A2 / A3 | ❌ 未落地 |
| **form registry**（FormConfig 之 file 建立） | F1 / F2 | ❌ 未落地 |
| **real `download.fileUrl` policy**（fileUrl 是「資產 URL」還是「landing page URL」之最終裁決；per pm-10 / pm-16 §9）| D1 / D3 之觸發語意可能需要微調（若改為 landing page URL，D3 regex 須改） | 🟡 半落地：pm-10 / pm-16 已固化「不是 form URL」紅線，但「是 asset URL 還是 landing page URL」之語意未終裁 |
| **Admin management model**（Admin write feature 是否啟用 / 涵蓋範圍） | 與 validation 解耦；validation 規則本身**不**依賴 Admin；但若未來 Admin 走 selector UI 需 lookup FormConfig / DownloadAsset，會間接催生 F2 / A3 之 error 升級需求 | ❌ Admin Apply 未啟用；middleware write route 未啟用；admin-write-cli dormant |
| **deploy / Blogger repost / GA4 validation** | 與本 validation 規則設計**完全解耦** | n/a（本 phase 不啟動任何部署相關動作） |
| **reverse UTM activation / pm-26 gate unblock** | 與本 validation 規則設計**完全解耦**；但 reverse UTM dormant 是當前 publish-readiness gate 的一部分，需確保 validation rule 啟動不誤觸 unblock | ❌ reverse UTM dormant；pm-26 BLOCKED |

### 10.1 Gate summary

- **可在「無外部 gate」之前提下實作**：D1 / D2 / D3 / S1 / S2（純 frontmatter 結構檢查）+ D4 governance 宣告。
- **必須等 registry gate 全部滿足才可實作**：F1 / F2 / A1 / A2 / A3（per `docs/20260530-download-validation-rules-preanalysis.md` §6）。

---

## 11. Recommended Rollout Order

> **保守排序**；每步皆 additive、可獨立驗證、可 dormant；任一步皆須**獨立 phase + user explicit approval**。**不**建議在本 phase 直接做 source implementation。

| 序 | 內容 | 性質 | 對應規則 | 是否本 phase 啟動 |
|---|------|------|---------|-----------------|
| **1** | **本 docs（warning message / fixture design）acceptance** | docs-only | n/a（本 phase 交付） | 🟡 本 phase **完成新增**；acceptance 為下一 read-only phase 之事 |
| **2** | **Download validation warning source implementation preanalysis** — 在 source implementation 開始**前**之最後一份 docs-only 草案：精確訊息 / 觸發範圍最終裁決 / fixture 拼字 / outstanding decisions（D1 範圍、D3 相對路徑、S1/S2 合併、A2 純表單流）逐一裁決 | docs-only | D1 / D2 / D3 / S1 / S2 | ❌ 不啟動 |
| **3** | **Minimal source implementation for non-registry rules**（D1 / D2 / D3 / S1 [/ S2]）+ 對應 negative fixture（Option B per §9）；同 PR / 同 phase 落地；明示 baseline change | source change（warning-only additive） | D1 / D2 / D3 / S1 / S2 | ❌ 不啟動 |
| **4** | **Fixture-only add phase**（如 step 3 採 Option A 中繼，補上之 fixture-add）| fixture-only | D1 / D2 / D3 / S1 / S2 | ❌ 不啟動 |
| **5** | **Docs sync**（CLAUDE.md §13 補上「`download.enabled=true` 但無 `fileUrl` 應警告」之實作狀態；本系列 docs 補 implementation landed 註記）| docs-only | n/a | ❌ 不啟動 |
| **6** | **Registry schema acceptance**（FormConfig / DownloadAsset 欄位字典定稿） | docs-only | gating F1 / F2 / A1 / A2 / A3 | ❌ 不啟動 |
| **7** | **Registry file creation**（`content/settings/download-forms.json` / `download-assets.json`；命名待定） | settings creation source phase | gating | ❌ 不啟動 |
| **8** | **`formRef` / `assetRefs[]` frontmatter schema 落地**（download content 之新欄位定義） | source / docs sync | gating | ❌ 不啟動 |
| **9** | **Registry-dependent validation rule implementation**（F1 / F2 / A1 / A2 / A3）+ 對應 fixture | source change + fixture | F1 / F2 / A1 / A2 / A3 | ❌ 不啟動 |
| **10** | **Separate manual gate / independent `check-broken-links` phase for actual `download.fileUrl` reachability**（D4 對應之獨立 pipeline） | 獨立 pipeline；非 `validate-content` | n/a | ❌ 不啟動 |

明確：**本文件僅完成 step 1（docs 草案新增）**，**不**承諾 step 2 以後之啟動時機。step 3 起即須**獨立 phase + user explicit approval**。

---

## 12. Non-goals

本 phase 明確**不做**：

- ❌ no source implementation
- ❌ no fixture（包含 positive / negative）
- ❌ no content publish / no `draft → ready`
- ❌ no `download.fileUrl` fill
- ❌ no deploy（不 `npm run build:*`、不 push gh-pages、不改 dist）
- ❌ no Blogger repost
- ❌ no GA4 validation（不做 Realtime / DebugView）
- ❌ no reverse UTM activation（reverse UTM 仍 dormant）
- ❌ no pm-26 deploy gate unblock
- ❌ no Admin Apply enable
- ❌ no middleware write route enable
- ❌ no admin-write-cli dry-run / apply
- ❌ no fourth SEO write（既有 allowed write scope 不擴張）
- ❌ no settings registry file creation（不建 `download-forms.json` / `download-assets.json` / `download-pages.json`）
- ❌ no download landing page source（不建 template / renderer / landing page content）
- ❌ no frontmatter schema 擴張（不加 `formRef` / `assetRefs[]` 欄位定義）
- ❌ no template 改動（不改 `content/templates/blogger-download-template.md`）
- ❌ no validator source change（不改 `src/scripts/validate-content.js`）
- ❌ no `npm install`
- ❌ no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`

本檔落地後 production state drift = 0；屬純 docs entry。唯一變更為新增本 docs 檔。

---

## 13. Final Recommendation

### 13.1 本 phase 完成後之建議下一步

- **若完成本 docs-only phase**，下一步應為**read-only acceptance cross-check**：另開獨立 phase，read-only 重新驗 baseline、read-only 確認本文件 §5 matrix / §6 message copy / §8 fixture strategy / §11 rollout order 之內部一致性，與 source / fixture **不**衝突。
- **不**建議在 acceptance cross-check 前直接跳 source implementation。
- **不**建議在本 session 直接做 source implementation。

### 13.2 source implementation 須另開 phase 之原因

- baseline 變動須事先 docs 明示；source 與 fixture 須同 PR 落地（Option B），否則 regression 防護力不足。
- D1 / D3 / S1 / S2 之 outstanding decisions（per §5.1）須先在 implementation preanalysis 階段定稿，避免 implementation phase 內反覆。
- 與本 phase 混做會破壞 docs-only scope，且難以保住 phase boundary。

### 13.3 本 phase 與其他凍結之關係

- reverse UTM remains **dormant**；本 phase 不啟動。
- pm-26 deploy gate remains **BLOCKED**；本 phase 不解除。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**；本 phase 不啟動。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守：本 phase 不引入任何 respondent data 通路、不把 `download.fileUrl` 與 Google Form URL 混為一談、不另造 SEO pipeline。

### 13.4 Final Idle Freeze / EXIT

完成本 phase（新增單一 docs 檔 + commit + push + final verify）後，**建議 Final Idle Freeze / EXIT**，不啟動任何 follow-on phase。

---

（本文件結束）
