# 20260601 Download Content Reference Fixture Creation Preflight

> Phase: `20260601-night-5-download-content-reference-fixture-creation-preflight-docs-only-a`
> Date: 2026-06-01 22:47 +0800
> Scope: **docs-only**（單檔新增；無 source / content / settings / templates / fixture / registry / package / dist / gh-pages / CLAUDE.md 變更）

---

## 1. Executive Summary

- 本文件為 **docs-only preflight**：承接已驗收完成之 pm-24 fixture batch design preanalysis（`67c6213`）與其上層 pm-23 content reference validation preanalysis、pm-21 fixture strategy preanalysis、pm-17 registry validator landed、pm-11 download loader landed，作為**未來 fixture creation + validator source implementation 同 phase 啟動前的最後前置定案**。
- 本 preflight 之目的**不是**新增 fixture，**不是**改 source，**不是**改 registry / content / settings；目的是**鎖定**：
  1. 未來 fixture batch 是採 6-fixture（Option 6）或 8-fixture（Option 8）？
  2. fixture filename 與 warning code 命名？
  3. fixture placement、registry 紅線、empty policy 邊界？
  4. source + fixture 是否必須同 phase 落地？
  5. expected baseline movement 數字？
- 本 preflight **不移動** validate baseline；**不**啟動任何 fixture creation / source implementation / loader extension / Admin / renderer / build / deploy / Blogger repost / GA4 validation / reverse UTM / pm-26。
- 本 preflight 落地後預設下一步為 **Final Idle Freeze / EXIT**；若要進入 fixture creation + source phase，需 user **明示授權**。

### 1.1 一句話裁決

> **未來 fixture creation + source implementation phase 應以 Option 6（6-fixture batch；A1/A2/B1/B2/D1/D2）啟動**；E1/E2 之 formRef empty / whitespace 政策仍模糊（與 absent / optional 邊界混淆），**延後**至獨立 empty-policy 拍板 phase 後再決定是否補入。本 preflight commit 不移動 baseline；fixture + source 同 phase 落地仍為硬性要求。

---

## 2. Current Accepted Baseline

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `67c6213c9ad6f675d7a6f9b6a4e326b9970424ad` |
| short HEAD | `67c6213` |
| origin/main | `67c6213c9ad6f675d7a6f9b6a4e326b9970424ad`（HEAD = origin/main） |
| ahead/behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(download): design content reference fixtures` |
| validate baseline | **0 errors / 47 warnings / 42 posts** |
| download loader | ✅ landed + accepted（pm-11；`load-settings.js` 暴露 `downloadAssets` / `downloadForms`） |
| download registry validator | ✅ landed + accepted（pm-17 `5452149`；shape + duplicate-key；warning-only） |
| fixture strategy preanalysis | ✅ landed + accepted（pm-21 `7a595f3`） |
| content reference validation preanalysis | ✅ landed + accepted（pm-23 `dcf44c5`） |
| content reference fixture batch design | ✅ landed + accepted（pm-24 `67c6213`） |
| registries | `assets: []` / `forms: []`（empty；clean） |
| `assetRefs[]` production usage | **0** |
| `formRef` production usage | **0** |
| legacy `download.fileUrl` | production 1（phonics；draft → 不入 baseline）；template 1；fixtures 5（D1/D2/D3/S 計入 47） |
| content reference validation rules | ❌ 尚未實作 |
| reverse UTM | landed but dormant（source 已 push；live dormant） |
| pm-26 deploy gate | BLOCKED |
| download content management | ❌ 尚未啟動（landing point only） |

> 本 phase 不重新證明 baseline 細節；上述為承接 pm-24 已驗收狀態之要點。phase 開始時 `git rev-parse HEAD` / `git rev-parse origin/main` / `git rev-list --left-right --count` / `git status` / `git log -1` / `npm run validate:content` 已逐項對齊上述值。

---

## 3. Prior Fixture Batch Design Summary

pm-24 docs（`67c6213` — `docs/20260601-download-content-reference-fixture-batch-design-preanalysis.md`）已**設計出**未來 8 個候選 fixture（皆未建立）。要點摘述：

### 3.1 候選 fixture 一覽（pm-24 §5.1）

| ID | proposed filename | purpose | expected warning code（草案） |
|----|-------------------|---------|------------------------------|
| **A1** | `_test-download-asset-refs-invalid-type-string.md` | `assetRefs` 為 string | `download-asset-refs-invalid-type` |
| **A2** | `_test-download-asset-refs-invalid-type-object.md` | `assetRefs` 為 object | `download-asset-refs-invalid-type` |
| **B1** | `_test-download-asset-ref-invalid-type.md` | `assetRefs[i]` 非 string | `download-asset-ref-invalid-type` |
| **B2** | `_test-download-asset-ref-empty.md` | `assetRefs: [""]` | `download-asset-ref-empty` |
| **D1** | `_test-download-form-ref-invalid-type-array.md` | `formRef` 為 array | `download-form-ref-invalid-type` |
| **D2** | `_test-download-form-ref-invalid-type-object.md` | `formRef` 為 object | `download-form-ref-invalid-type` |
| **E1** | `_test-download-form-ref-empty.md` | `formRef: ""`（policy-conditional） | `download-form-ref-empty` |
| **E2** | `_test-download-form-ref-whitespace-only.md` | `formRef: "   "`（policy-conditional） | `download-form-ref-empty` |

### 3.2 pm-24 已明確排除（不在第一批；本 preflight 亦不重新議）

- ❌ not-found rules（assetRef / formRef）→ 需 non-empty registry overlay 機制
- ❌ inactive rules → 需先定 `active: false` schema
- ❌ duplicate rules（`assetRefs` 內重複 id）
- ❌ `assetRefs: []` empty array 語意層
- ❌ coexistence with legacy `fileUrl`
- ❌ preview-url-risk registry-aware 版本
- ❌ positive fixtures（valid ref → 不報）
- ❌ GitHub 對照 fixtures
- ❌ template / production content migration
- ❌ Admin picker / renderer / landing page

### 3.3 pm-24 已預寫之 expected baseline movement

| Batch | posts | warnings | errors |
|-------|-------|----------|--------|
| current | 42 | 47 | 0 |
| 8-檔批（全造） | 50 | 55 | 0 |
| 6-檔批（A1/A2/B1/B2/D1/D2；E1/E2 延後） | 48 | 53 | 0 |

---

## 4. Six-fixture vs Eight-fixture Decision

本 preflight 之核心決策：未來 source + fixture 同 phase 啟動時，應採 Option 6 或 Option 8？

### 4.1 Option 6 — A1 / A2 / B1 / B2 / D1 / D2（6 檔）

對應 rule（草案）：
- `download-asset-refs-invalid-type`
- `download-asset-ref-invalid-type`
- `download-asset-ref-empty`
- `download-form-ref-invalid-type`

expected baseline after implementation: **0 errors / 53 warnings / 48 posts**

涵蓋：
- `assetRefs` 本身型別檢查（A1/A2 → 1 rule）
- `assetRefs[i]` 型別檢查（B1 → 1 rule）
- `assetRefs[i]` empty 檢查（B2 → 1 rule）
- `formRef` 本身型別檢查（D1/D2 → 1 rule）
- `formRef` empty 檢查 → **不**涵蓋

### 4.2 Option 8 — A1 / A2 / B1 / B2 / D1 / D2 / E1 / E2（8 檔）

對應 rule（草案）：
- Option 6 之 4 條 + `download-form-ref-empty`（覆蓋 E1/E2）

expected baseline after implementation: **0 errors / 55 warnings / 50 posts**

涵蓋：
- Option 6 全部
- `formRef` empty / whitespace-only 檢查（E1/E2 → 1 rule）

### 4.3 比較矩陣

| 維度 | Option 6 | Option 8 | 評析 |
|------|----------|----------|------|
| **規則明確性** | 🟢 高 — type/array/item 之 invalid 結構是客觀型別錯誤，無語意模糊 | 🟡 中 — `formRef` empty 是否視為「absent / optional」屬政策邊界；未拍板前 rule 可能與 user 預期不符 | Option 6 勝 |
| **是否需先拍板 empty policy** | ❌ 不需要 | ✅ 需要 — empty string / whitespace 與 absent 之 semantics 必須先決 | Option 6 勝 |
| **過度驗證風險** | 🟢 低 — 4 條 rule 皆為純型別檢查 | 🟡 中 — empty string warning 可能引發「為何 `formRef: ""` 要警告但 `formRef` 完全省略不警告」之質疑（亦即 `relatedLinks` 已踩過 source-key 之 empty / not-found 邊界，pm-24 §6 已預示命名張力） | Option 6 勝 |
| **是否可延後** | ❌ 不應延 — type 檢查是 ref 系列規則之最小基石；延後等於不做 | ✅ 可延 — empty policy 可獨立成案；E1/E2 fixture 待 policy phase 後補造即可 | Option 6 勝 |
| **rollback simplicity** | 🟢 6 fixture `git rm` + revert source = single phase rollback | 🟢 8 fixture 同 simplicity | 平手 |
| **source implementation complexity** | 🟢 低 — 4 條 rule，每條約 5-10 行；無 trim policy 分支 | 🟡 中 — 多 1 條 rule + trim 後 empty 判斷；需與 E1/E2 fixture 互斥邏輯對齊（pm-24 §5.4） | Option 6 勝 |
| **baseline movement clarity** | 🟢 +6 posts / +6 warnings；公式 `42+6=48` / `47+6=53` | 🟢 +8 posts / +8 warnings；公式 `42+8=50` / `47+8=55` | 兩者皆清楚 |
| **未來補造 E1/E2 之成本** | 🟡 需獨立 phase（policy + fixture + source） | 🟢 已含；無補造成本 | Option 8 勝 |
| **與既有 `relatedLinks` 命名張力對齊** | 🟢 對齊範圍小（不引入新 empty rule） | 🟡 引入 `download-form-ref-empty` 須與 pm-24 §6 命名張力一併拍板（連字符雙詞 vs 單詞） | Option 6 勝 |
| **registry 連動風險** | 🟢 純 frontmatter 檢查；不讀 registry | 🟢 同 — empty 檢查亦不讀 registry | 平手 |

### 4.4 Option 6 vs 8 — 風險加總

- **Option 6** 風險：未來如 E1/E2 補造，需獨立 phase；但補造成本低（6→8 fixture 為 +2 fixture / +1 rule；可 share existing rule 之 trim 函式）。**主要風險：分段引入兩次 baseline movement，acceptance 文件需寫兩次 expected delta。**
- **Option 8** 風險：empty policy 未拍板即 land → rule 行為可能與 user 預期不符 → 後續可能需 rule rename / fixture rename / acceptance 重寫。**主要風險：未拍板的政策變成 source 預設行為。**

---

## 5. Recommended Fixture Batch

### 5.1 建議：**Option 6**

- **採 A1 / A2 / B1 / B2 / D1 / D2（6 檔）**
- E1 / E2 暫**延後**，等 empty string / whitespace policy 明確拍板後（獨立 docs-only phase），再決定是否補造
- expected baseline after implementation: **0 errors / 53 warnings / 48 posts**

### 5.2 理由

1. **type/array/item 檢查為客觀型別錯誤**：A1/A2（`assetRefs` 必須是 array）、B1（item 必須是 string）、D1/D2（`formRef` 必須是 string）皆為「無爭議的型別檢查」，無 policy 邊界，source 可直接寫；validator 命中後 user 無理由質疑。
2. **`assetRefs[i]` empty（B2）與 `formRef` empty（E1/E2）語意不對稱**：B2 之 array item 為 `""` 屬「有 placeholder 但沒值」，client / Admin picker 在未來必然視為 invalid（picker 不會 emit empty item）；E1/E2 之 string 為 `""` 則可能被理解為「明示無 ref」（與 `formRef` 完全省略等價）。**B2 屬型別/結構錯誤；E1/E2 屬語意邊界**。本 preflight 主張只 land 前者。
3. **`formRef` empty policy 可延後拍板**：當前 production 用量 = 0；template 未引入 `formRef`；Admin picker / renderer 未實作 → 沒有 caller 對 empty `formRef` 有期待。延後 policy 拍板**不**造成任何 user-facing impact。反之，若提早 land empty rule，未來 user 要求「`formRef: ""` 視為 absent」時需 rule rollback。
4. **pm-24 §13 之 final recommendation 已明示**：「下一階段最小安全 batch 為 6-檔批」。本 preflight 承接此結論。
5. **與 `relatedLinks` 既有命名張力對齊**：`related-links-source-key-empty` 與 `related-links-source-key-not-found` 之引入歷經多輪 preanalysis；download 系列宜採類似分段節奏，避免一次性把所有 empty / not-found rule 全塞同 phase。

### 5.3 Option 8 不是否決，只是延後

- Option 8 仍為**可接受方案**；若 user 同時拍板 empty string policy（明確表態「`formRef: ""` 應警告」或「等同 absent」），可直接升至 Option 8。
- 升至 Option 8 之決策應由獨立 docs-only phase 紀錄；不應在 fixture creation 當下臨時決定。

---

## 6. Proposed Future Fixture Files

> ⚠ 本節僅**列出**未來 Option 6 之 6 個 fixture 之 metadata；本 preflight **不**建立檔案。

### 6.1 A1 — `_test-download-asset-refs-invalid-type-string.md`

| 項目 | 值 |
|------|-----|
| target field | `download.assetRefs` |
| bad value shape | string（e.g. `"phonics-cards-zip-v1"`） |
| expected warning code | `download-asset-refs-invalid-type` |
| expected warning count | 1（per fixture） |
| expected post count delta | +1 |
| requires registry read? | **no** |
| source rule required | array type check on `download.assetRefs`（若非 array 且非 undefined → warn） |
| notes | 須同時填 `fileUrl: "https://example.com/placeholder.pdf"` + `seo.indexing: "noindex-follow"` 以避免同時觸發既有 D1/S；非真實 URL；非真實 assetId |

### 6.2 A2 — `_test-download-asset-refs-invalid-type-object.md`

| 項目 | 值 |
|------|-----|
| target field | `download.assetRefs` |
| bad value shape | object（e.g. `{ assetId: "..." }`） |
| expected warning code | `download-asset-refs-invalid-type` |
| expected warning count | 1 |
| expected post count delta | +1 |
| requires registry read? | **no** |
| source rule required | 同 A1 |
| notes | 同 A1 |

### 6.3 B1 — `_test-download-asset-ref-invalid-type-item.md`

| 項目 | 值 |
|------|-----|
| target field | `download.assetRefs[0]` |
| bad value shape | non-string item（e.g. number `12345`） |
| expected warning code | `download-asset-ref-invalid-type` |
| expected warning count | 1 |
| expected post count delta | +1 |
| requires registry read? | **no** |
| source rule required | array.forEach item type check；item 非 string → warn |
| notes | `assetRefs` 本身為 array（避免觸發 A1/A2）；item 非 string 故不進入 B2 之 trim 檢查（互斥保證；pm-24 §5.4） |

> Filename 微調：pm-24 §5.1 原列 `_test-download-asset-ref-invalid-type.md`；為與 §6.4 B2（`_test-download-asset-ref-empty-item.md`）對稱命名，本 preflight 建議改為 `_test-download-asset-ref-invalid-type-item.md`。**命名仍可在 source phase 微調**。

### 6.4 B2 — `_test-download-asset-ref-empty-item.md`

| 項目 | 值 |
|------|-----|
| target field | `download.assetRefs[0]` |
| bad value shape | string `""`（trim 後為 empty） |
| expected warning code | `download-asset-ref-empty` |
| expected warning count | 1 |
| expected post count delta | +1 |
| requires registry read? | **no** |
| source rule required | item 為 string 且 trim 後 empty → warn（與 B1 互斥：non-string item 走 B1，不進 B2） |
| notes | 同 B1 — `assetRefs` 為 array；item type 通過後檢查 trim |

> Filename 微調：pm-24 §5.1 原列 `_test-download-asset-ref-empty.md`；為與 B1 對稱命名，本 preflight 建議改為 `_test-download-asset-ref-empty-item.md`。

### 6.5 D1 — `_test-download-form-ref-invalid-type-array.md`

| 項目 | 值 |
|------|-----|
| target field | `download.formRef` |
| bad value shape | array（e.g. `["phonics-teacher-form-v1"]`） |
| expected warning code | `download-form-ref-invalid-type` |
| expected warning count | 1 |
| expected post count delta | +1 |
| requires registry read? | **no** |
| source rule required | string type check on `download.formRef`（若非 string 且非 undefined → warn） |
| notes | 同 A1 之 fileUrl + seo.indexing 設定 |

### 6.6 D2 — `_test-download-form-ref-invalid-type-object.md`

| 項目 | 值 |
|------|-----|
| target field | `download.formRef` |
| bad value shape | object（e.g. `{ formId: "..." }`） |
| expected warning code | `download-form-ref-invalid-type` |
| expected warning count | 1 |
| expected post count delta | +1 |
| requires registry read? | **no** |
| source rule required | 同 D1 |
| notes | 同 D1 |

### 6.7 6 檔合計

| 項目 | 變動 |
|------|------|
| posts | 42 → **48** |
| warnings | 47 → **53** |
| errors | 0 → **0** |
| new source rules | 4 條 |
| new fixtures | 6 檔（皆放 `content/validation-fixtures/blogger/posts/`） |
| new registry entries | 0 |
| new template fields | 0 |
| new content fields | 0 |

---

## 7. Warning Code Final Proposal

本 preflight 建議未來 Option 6 source phase 採用以下 warning code（皆為 **warning** severity；與既有 download-* warning-only 對齊）：

| 規則層級 | 建議 rule id | 對應 fixture |
|---------|-------------|------------|
| array 結構（`assetRefs` 本身非 array） | `download-asset-refs-invalid-type` | A1 / A2 |
| item 型別（`assetRefs[i]` 非 string） | `download-asset-ref-invalid-type` | B1 |
| item empty（`assetRefs[i]` 為 trim 後空字串） | `download-asset-ref-empty` | B2 |
| string 型別（`formRef` 非 string） | `download-form-ref-invalid-type` | D1 / D2 |

### 7.1 命名規則

- 採 **kebab-case 連字符雙詞**（`asset-refs`、`asset-ref`、`form-ref`），與既有 `related-links-source-key-not-found`、`related-links-source-key-empty` 等命名一致。
- 複數欄位（`assetRefs`）用複數 `asset-refs`；單筆 item（`assetRefs[i]`）用單數 `asset-ref`。
- `form-ref` 為單一欄位（非 array），統一用單數。

### 7.2 E1 / E2 之 `download-form-ref-empty` 之命名

- 若未來 empty policy 拍板採「empty string warning」→ 引入 `download-form-ref-empty`（與 `download-asset-ref-empty` 對稱命名）。
- 若 policy 採「empty string ≡ absent」→ **不引入** `download-form-ref-empty`，E1/E2 fixture 不造。
- 命名仍可在 policy phase 微調；本 preflight 不作命名拍板。

### 7.3 命名仍可在 source phase 微調

- 本 preflight 為**草案基準**；若 source phase 對 `assetRefs` 改採 `asset-refs-not-array`（mirror `related-links-not-array`）或其他命名，filename / expected code 同步調整即可。
- 命名拍板權留給 **source phase**；本 preflight 不阻止微調。

---

## 8. Source + Fixture Same-phase Requirement

本 preflight **明確要求**未來 C/D phase 必須：

### 8.1 fixtures + validate-content source 同 phase 落地

- **最理想**：fixture + source 同一 commit（mirror am-7 之 D1+D2 + 2 fixtures 同 commit 前例）。
- **次理想**：同一 phase 內連續多 commit（fixture commit + source commit），但**phase 結束時** baseline 必須移動至 expected `0/53/48`；不可留下 dead fixture 或 dead rule。
- **嚴禁**：fixture 與 source 分屬不同 phase / 不同 push。

### 8.2 若只新增 fixtures 而不改 source

- fixture 內 frontmatter 不觸發任何規則 → `posts +6` / `warnings +0` → baseline 移至 `0/47/48` → 偏離 §6.7 預期 `0/53/48` → acceptance **必失敗**。
- 結果：未來 source phase acceptance 文件之 expected delta 引用失效。

### 8.3 若只改 source 而不新增 fixtures

- 規則命中 0 次（production 0 篇用 ref；fixtures 未造）→ validator 規則為 **dead rule** → 無回歸覆蓋。
- 結果：規則之正確性無 fixture 證明；未來 refactor / rename 時無安全網。

### 8.4 source phase 前必須先明確接受 baseline movement

- 進 C+D phase 前，user 必須**明示**接受「baseline 將從 `0/47/42` 移至 `0/53/48`」。
- 若 user 對此 baseline movement 有保留 → 不啟動 C+D phase；改回 read-only freeze。
- baseline movement 接受**不**等同 source 實作授權；兩者為兩個獨立明示步驟（mirror pm-24 §10.1 之 A→B→C→E sequence）。

---

## 9. Expected Future Baseline Movement

| 階段 | posts | warnings | errors | 說明 |
|------|-------|----------|--------|------|
| 當前 baseline（67c6213） | 42 | 47 | 0 | 本 preflight 起始 |
| 本 preflight commit 後 | 42 | 47 | 0 | docs-only；**不移動** |
| Option 6 source+fixture phase 後 | **48** | **53** | 0 | +6 posts / +6 warnings |
| Option 8 source+fixture phase 後（若採） | **50** | **55** | 0 | +8 posts / +8 warnings |

### 9.1 本 preflight 不移動 baseline 之保證

- 本 preflight 僅新增 `docs/20260601-download-content-reference-fixture-creation-preflight.md` 一檔。
- `docs/**` 不在 `validate:content` 之 scan path（per `src/scripts/load-posts.js` / `validate-content.js`；scan path 為 `content/{blogger,github}/posts/` 與 `content/validation-fixtures/{blogger,github}/posts/`）。
- 故本 preflight commit 之 `npm run validate:content` 結果 **必須**仍為 `0 errors / 47 warnings / 42 posts`；若不符，立即停止並回報。

### 9.2 未來 source+fixture phase 必須在 final report 明確驗證 movement

- C+D phase 之 final acceptance 必須跑 `npm run validate:content` 並 quote 完整 tail（含 `0 error(s) / 53 warning(s) on 48 post(s)` 一行）。
- 若實測 ≠ expected → phase **失敗**；rollback fixture + source 至本 preflight 之 baseline。
- 不接受「baseline 接近 expected 即可」之容忍。

---

## 10. Fixture Placement and Governance

### 10.1 fixture 只能放在

```
content/validation-fixtures/blogger/posts/
```

理由：
- 沿用既有 5 個 download-related fixtures 之放置慣例（pm-24 §9.1）
- download 內容以 Blogger 為主（`blogger-download-template.md` 之 `primaryPlatform: blogger`）
- Option 6 **不**對 `content/validation-fixtures/github/posts/` 補對照 fixture

### 10.2 不放 production posts

- ❌ `content/blogger/posts/` / `content/github/posts/`：fixture 不得污染正式內容區
- ❌ 既有 production `.md`：不得改既有文章之 frontmatter；不得在既有文章插入 `assetRefs` / `formRef` 試圖觸發 rule

### 10.3 不改現有 draft

- ❌ 既有 production draft（如 `phonics-*.md`）：不得改其 frontmatter
- ❌ 不得新增 production draft 作為 fixture
- ❌ `content/drafts/` / `content/archive/`：草稿區不掃描；fixture 改用此區會違反 loadPosts 過濾語意

### 10.4 不用真實 Google Form respondent data

- ❌ 真實 email / 姓名 / 電話 / 學校 / 答覆內容 / Sheet response rows
- ❌ 下載者個資（真實使用者下載記錄）
- ❌ Google Form 回覆資料**不得**匯入 repo / fixture / Admin

### 10.5 不匯入下載者資料

- ❌ 任何來自 Google Drive download log / Sheet response 之 raw data
- ❌ 任何指向真實 user 之識別資訊

### 10.6 不使用真實 Google Drive private links

- ❌ 真實私人 Drive 連結（不指真實檔；fixture 用 `https://example.com/placeholder.pdf` placeholder）
- ❌ 私人 Drive folder ID / 私人 permission

### 10.7 不污染 download registry JSON

- ❌ 為造 positive fixture 而把 fixture-only `assetId` / `formId` 寫進 `content/settings/download-assets.json` / `download-forms.json`
- ❌ Option 6 之 6 fixture 均**不**改 registry（pure frontmatter 檢查）
- ❌ Option 6 source rules 均**不**讀 registry（per §6 `requires registry read? no`）

### 10.8 filename prefix 與 frontmatter

- 所有 fixture filename 以 `_test-` 開頭（沿用既有 57 fixture 慣例）
- `status: ready`（避免被 draft 過濾掉）
- `draft: false`
- `contentKind: download`（觸發 download rule 之先決條件）
- `site: blogger`、`primaryPlatform: blogger`
- 示意 slug（`phonics-cards-zip-v1` / `phonics-teacher-form-v1`），不指真實 asset/form

### 10.9 治理紅線交叉引用

- per `CLAUDE.md` §3 registry 治理紅線
- per `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8
- per pm-24 §9.3

---

## 11. Deferred Items

本 preflight **明確延後**以下項目（不在 Option 6 source phase 範圍；亦不在後續任一短期 phase）：

| 項目 | 為何延後 |
|------|---------|
| **E1 / E2 formRef empty / whitespace policy** | empty string 是否視為 absent 屬政策邊界；未拍板前不引入 rule |
| **`assetRefs[i]` not found**（ref 指向 registry 不存在 id） | registry 為空 → 空 registry 下任何 ref 必命中 not-found；無法區分 positive case；需 non-empty registry overlay 機制 |
| **`formRef` not found** | 同上 |
| **inactive registry references**（`active: false` ref） | inactive schema 尚未定型；registry 為空無對應 entry |
| **duplicate reference checks**（`assetRefs` 內重複 id） | 屬語意層；type check 通過後才有意義；延後至 type check rule 穩定後 |
| **coexistence with legacy `fileUrl`** | `fileUrl + assetRefs` 共存規則屬 migration 政策；需 production impact scan |
| **registry-aware lookup**（require non-empty registry） | 需先決定 overlay 機制（pm-21 §5 Option C） |
| **`preview-url-risk`（registry-aware 版本）** | 現政策為 docs-only（`docs/20260530-download-fileurl-preview-url-risk-policy.md`）；validator 不做 HTTP / Drive API 查詢 |
| **GitHub counterpart fixtures** | 規則邏輯不分站；blogger 一份已覆蓋；GitHub 對照延後或永不造 |
| **production content migration**（`download.fileUrl` → `assetRefs[]` / `formRef`） | 屬 schema/migration phase；不可與 validator 落地 phase 混 |
| **Admin picker / renderer / landing page** | landing page renderer 未實作；Admin picker / Admin Apply / middleware write / admin-write-cli remain dormant |
| **template change**（`blogger-download-template.md` 加 `assetRefs` / `formRef`） | 屬 schema/template 追加 phase；與 validator 落地 phase 分離 |

---

## 12. Future Implementation Sketch

> ⚠ 本節僅以**文字**描述未來流程；不寫 code、不下指令、不啟動任何 phase。

### Step A — explicit user approval for Option 6 source+fixture phase

- user 明示「接受 baseline 從 `0/47/42` 移至 `0/53/48`」
- user 明示「啟動 Option 6 source+fixture implementation phase」
- 若 user 未明示 → 維持 Final Idle Freeze；不進 Step B

### Step B — add 6 fixtures

- 在 `content/validation-fixtures/blogger/posts/` 新增 6 個 `_test-download-*.md`
- 每個 fixture 之 frontmatter shape 對齊 §6.1–§6.6
- 不改 production posts；不改 template；不改 registry；不改既有 fixture
- 此 step 結束時若 commit → `validate:content` 應為 `0 errors / 47 warnings / 48 posts`（+6 posts / +0 warnings）；**僅作中途檢查**，不作為 phase 終態

### Step C — add validate-content warning-only rules

- 在 `src/scripts/validate-content.js` 之 download section 新增 4 條 warning-only rule：
  - `download-asset-refs-invalid-type`（A1/A2）
  - `download-asset-ref-invalid-type`（B1）
  - `download-asset-ref-empty`（B2）
  - `download-form-ref-invalid-type`（D1/D2）
- rules 均**不**讀 registry
- rules 之互斥邏輯（pm-24 §5.4）必須由 source 保證

### Step D — run validate and expect 0/53/48

- 跑 `npm run validate:content`
- expected tail：`0 error(s) / 53 warning(s) on 48 post(s)`
- 若實測 ≠ expected → phase **失敗**；rollback fixture + source 至 67c6213

### Step E — commit + push

- commit message: `feat(download): validate content reference fixtures`（或 user 拍板之命名）
- commit 範圍：6 fixture + `validate-content.js`；**不**含 docs（docs 另起 docs-only phase）
- push origin/main fast-forward only

### Step F — read-only acceptance cross-check

- 獨立 docs-only acceptance phase
- 驗證 HEAD = origin/main、ahead/behind 0/0、working tree clean
- 驗證 validate baseline = `0/53/48`
- 寫 acceptance 文件並 commit + push

### Step G — Final Idle Freeze

- Step F 結束後預設 Final Idle Freeze / EXIT
- E1/E2 / not-found / inactive / coexistence 等延後項目 remain deferred
- 任何下一步須 user 明示

---

## 13. Risk Matrix

| 風險 | 描述 | 緩解 |
|------|------|------|
| **baseline movement**（本 preflight 意外動 baseline） | 本 preflight commit 後 `validate:content` 不再是 `0/47/42` | docs-only；唯一檔案 `docs/20260601-download-content-reference-fixture-creation-preflight.md`；docs 路徑不在 scan path；commit 後立即跑 `validate:content` 驗證仍為 `0/47/42` |
| **dead fixture**（fixture 無 rule 命中） | source 未同 phase 落地 → fixture 內 frontmatter 不觸發 warning → posts +6 / warnings +0 | §8 強制 fixture + source 同 phase；若分 commit 也須 phase 結束時 baseline 達 expected |
| **dead rule**（rule 無 fixture 命中） | fixture 未同 phase 落地 → rule 永遠不命中 → 無回歸覆蓋 | §8 強制 fixture + source 同 phase；production 0 篇用 ref，fixture 為唯一回歸來源 |
| **ambiguous empty policy** | E1/E2 提早 land → `formRef: ""` 之 semantics 未拍板 → 後續可能 rollback | §5 推薦 Option 6；E1/E2 延後至獨立 policy phase；本 preflight 不替 user 拍板 |
| **registry pollution** | 為造 positive fixture 而改 registry | §10.7 明確紅線；Option 6 全部 rule 不讀 registry；fixture 全為 negative |
| **production content mutation** | 為觸發 rule 而改 production posts | §10.2 明確紅線；fixture 全放 validation-fixtures path |
| **over-documentation** | 本 preflight 過長 / 重複 pm-24 內容 | 本 preflight 為 fixture creation 前**最後**前置；非循環 docs；commit 後即進 Final Idle Freeze |
| **premature Admin / renderer / deploy** | 本 preflight 後意外啟動 Admin picker / renderer / build / deploy | §14 明確紅線；本 preflight 結束後 Final Idle Freeze |
| **reverse UTM / pm-26 unrelated activation** | 本 preflight 意外觸動 deploy gate | §14 明確紅線；本 preflight 不碰 dist / gh-pages / Blogger / GA4 |
| **fixture naming drift**（與 pm-24 §5.1 之 filename 不一致） | §6.3 / §6.4 微調 filename（加 `-item` 後綴）→ pm-24 reader 困惑 | 本 preflight §6.3 / §6.4 明確標註「微調」；source phase 可採此微調或回到 pm-24 原命名；命名拍板權留 source phase |
| **expected baseline 數字寫錯**（acceptance phase 引用本 docs 失敗） | §6.7 / §9 / Step D 之 `0/53/48` 公式錯誤 | 公式 `42+6=48` / `47+6=53` 來自 6 fixture 各命中 1 warning 之假設（pm-24 §5.4 互斥保證）；source phase 必須在 acceptance 時 quote 完整 tail |
| **github fixture 衝動** | 誤以為「規則不分站」需證明 → 多造 github 對照 fixture | §10.1 / pm-24 §5.5 明確排除；blogger 一份覆蓋規則邏輯已足夠 |

---

## 14. Non-goals / Red Lines

本 preflight 明確**不做**：

- ❌ **no fixture creation in this phase**（不新增 / 不修改 / 不刪除 `content/validation-fixtures/**` 任一檔）
- ❌ **no source implementation in this phase**（不改 `src/scripts/validate-content.js`；不改 `src/scripts/load-settings.js`；不改 `src/` 任何檔）
- ❌ **no registry mutation**（不改 `content/settings/download-assets.json` / `download-forms.json`；不引入 test-only registry overlay）
- ❌ **no content migration**（不遷 `download.fileUrl` → `assetRefs[]` / `formRef`；不改 `content/blogger/posts/**` / `content/github/posts/**`）
- ❌ **no build / deploy**（不 `npm run build:*`；不 push gh-pages；不改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`）
- ❌ **no Blogger repost**（不碰 Blogger 後台；不改既有貼上之 post.html）
- ❌ **no GA4 validation**（不做 GA4 Realtime / DebugView；不啟動 reverse UTM live）
- ❌ **no Admin picker / renderer / landing page implementation**
- ❌ **no Admin Apply / middleware / `admin-write-cli`**（dry-run / apply 皆不啟動）
- ❌ **no reverse UTM activation**（remains landed but dormant）
- ❌ **no pm-26 unblock**（remains BLOCKED）
- ❌ **no template change**（不改 `content/templates/blogger-download-template.md`；不引入 `assetRefs[]` / `formRef` 於 template）
- ❌ **no schema docs change**（不改 `docs/publish-bundle.md` / `docs/related-links-schema.md` / `docs/book-schema.md` 等既有 schema docs；schema 追加屬獨立 phase）
- ❌ **no `npm install`**（不動 `package.json` / `package-lock.json`）
- ❌ **no rebase / amend / force-push**（本 preflight commit 為新增 commit；push 至 origin/main fast-forward only）
- ❌ **no automatic next phase**（本 preflight 落地後預設 Final Idle Freeze；不自動啟動 fixture creation / source implementation）

---

## 15. Final Recommendation

- **Recommended after this docs-only preflight**: **Final Idle Freeze / EXIT**
- **If user later explicitly approves**, next actionable phase is **Option 6 source+fixture implementation**（A1/A2/B1/B2/D1/D2 + 4 條 warning-only rule；expected baseline `0/47/42 → 0/53/48`）
- **Do not automatically start source+fixture phase**
- **E1 / E2 / not-found / inactive / coexistence / Admin / renderer / build / deploy 等延後項目** remain deferred
- **本 preflight commit 本身 baseline 不移動**；commit 後 `validate:content` 必須仍為 `0 errors / 47 warnings / 42 posts`
- 若 user 對 Option 6 / Option 8 之選擇有不同看法 → 再起獨立 docs-only edit phase 修訂本 preflight；不直接進 fixture creation

---

（本文件結束）
