# 2026-06-03 Download R6 Coexistence Rule Preanalysis

Phase name: `20260603-am-6-download-r6-coexistence-rule-preanalysis-docs-only-a`
Date: 2026-06-03 07:35 +0800
Mode: **docs-only preanalysis**（no source / no fixture / no registry mutation / no loader / no renderer / no templates / no Admin / no middleware / no CLAUDE.md / no package / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM / no pm-26 unblock / no admin-write-cli / no Admin Apply）

---

## 1. Executive Summary

R6（registry-aware **coexistence** validation）為 R-series 中尚未啟動的最後一條 candidate rule family，目的在於決定：當一個 post 之 `download.*` block 同時或部分缺漏地擁有
`download.fileUrl` / `download.assetRefs[]` / `download.formRef` 三類欄位時，validator 應如何反應（pass / warning / error / skip）。

本 phase **只做** docs-only preanalysis：

- ❌ 不實作任何 R6 rule。
- ❌ 不新增 / 不修改 fixture。
- ❌ 不動 `src/scripts/validate-content.js`、`load-settings.js`。
- ❌ 不動 `content/settings/download-assets.json` / `download-forms.json`（registries remain empty）。
- ❌ 不動 production content、不動 templates、不動 CLAUDE.md。
- ❌ 不動 build / deploy / Blogger / GA4 / reverse UTM / pm-26 / Admin / middleware / admin-write-cli。

輸出僅為本檔，作為下一階段是否啟動 R6 之**裁決前置文件**。

關鍵立場（先給 spoiler，詳見 §8 / §12）：

- **建議：選 Option E — defer R6**。在 internal noindex download landing page renderer、Admin picker、production content migration 都未成熟前，R6 沒有實作的價值，反而會誤判
  long-term 正確的 `assetRefs + formRef` 共存模型。
- 若未來啟動 R6b 實作，rule severity 應為 **warning**；rule id 建議
  `download-ref-coexistence-*` family（per §8）；只該覆蓋**明確的 user-facing harm 情境**，不該對所有「兩個以上欄位同時存在」一律警告。
- R6 **不**得在 landing page renderer 落地前強迫 production migration；**不**得讓
  `assetRefs + formRef` 共存被判為錯誤；**不**得讓使用者填表資料進入 repo；**不**得解除 reverse UTM / pm-26 / Admin write freeze。

See also：

- `docs/20260603-download-r5b-duplicate-checkpoint.md`（R5b intra-post duplicate landed；本 phase baseline）
- `docs/20260602-download-r5-duplicate-rule-preanalysis.md`（R5 preanalysis；§8.9 提及 R6 forward-compat 影響）
- `docs/20260602-download-r2-not-found-checkpoint.md`（R2 not-found landed；coexistence cascade 基礎）
- `docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`（R4a — Option A keep registries empty；R4b NO-GO）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series plan；R6 列於 §5.5 與 §9）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（registry schema decision 與紅線）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty-registry landing plan）
- `docs/20260530-download-fileurl-preview-url-risk-policy.md`（preview-url-risk = docs-only authoring policy；不轉成 validator rule）
- `docs/20260529-reverse-utm-download-landing-page-flow-decision.md`（landing page → embedded Google Form → Google Drive ZIP 流程；
  關鍵：article CTA **不直接**指 Google Form，**不直接**指 Drive 檔案）
- CLAUDE.md §3.2（download registry red lines + 當前 loader / validator 狀態）
- CLAUDE.md §13（`download.fileUrl` warning policy）
- CLAUDE.md §16.4（reverse UTM dormancy；pm-26 BLOCKED）

---

## 2. Current Baseline

Baseline confirmed at start of this phase (2026-06-03 07:35 local)：

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD：`a25be4a19cfe1179d60d84827a7b45b8400b6ab6`（short `a25be4a`）
- `HEAD == origin/main`：yes（ahead / behind = `0 / 0`）
- working tree：clean
- latest commit subject：`docs(download): record r5b duplicate checkpoint`
- `npm run validate:content` → **0 errors / 60 warnings / 53 posts**

### 2.1 Recent commit chain（top of this phase window）

```text
a25be4a docs(download): record r5b duplicate checkpoint
077c3d1 feat(download): warn on duplicate asset refs
bd94220 docs(download): plan asset ref duplicate validation
d2b04ff docs(download): decide inactive registry strategy
7e513e8 docs(download): record r2 not-found checkpoint
```

### 2.2 Landed in the R-series

| Rule family | Rule id | Phase | Status |
| --- | --- | --- | --- |
| R1（shape）| `download-registry-invalid-shape` | 20260601-pm-17 | ✅ landed（warning-only）|
| R1（shape）| `download-registry-duplicate-key` | 20260601-pm-17 | ✅ landed（warning-only；registry-level）|
| R2（not-found）| `download-asset-ref-not-found` | 20260602-night-9 (`145a548`) | ✅ landed（warning-only）|
| R2（not-found）| `download-form-ref-not-found` | 20260602-night-9 (`145a548`) | ✅ landed（warning-only）|
| R4a（inactive strategy）| n/a — docs-only decision | 20260602-night-14 | ✅ Option A — keep registries empty |
| R4b（inactive impl）| `download-asset-ref-inactive` / `download-form-ref-inactive` | — | ❌ NO-GO（R4a Option A 不需要實作）|
| R5b（duplicate）| `download-asset-ref-duplicate` | 20260603-am-2 (`077c3d1`) | ✅ landed（warning-only；intra-post `assetRefs[]` only）|
| R6（coexistence）| —（pending）| —（this phase = R6 preanalysis）| ❌ **尚未實作；本 phase 只做 preanalysis** |

### 2.3 Empty-registry state preserved

```json
content/settings/download-assets.json
{ "schemaVersion": 1, "updatedAt": "", "assets": [], "notes": "" }

content/settings/download-forms.json
{ "schemaVersion": 1, "updatedAt": "", "forms":  [], "notes": "" }
```

兩 registry 自 commit `466e471` 起均維持 empty。本 phase 不改動。

### 2.4 What R6 must coexist with（dormant rails）

- reverse UTM remains **landed but dormant**（per CLAUDE.md §16.4）。
- pm-26 deploy gate remains **BLOCKED**（per CLAUDE.md §3.2）。
- Admin Apply / middleware write / admin-write-cli remain **dormant**。
- 下載 landing page renderer **尚未實作**。
- Admin picker **尚未實作**。
- production content **尚未** migration（zero usage of `assetRefs[]` / `formRef`）。

---

## 3. Current Download Field Model

### 3.1 三個欄位之語意（current code-level shape）

`download.*` block 目前由以下三個 reference / target 欄位構成（外加 metadata 如 `enabled` / `title` / `description` / `fileType` / `licenseNote`）：

| 欄位 | 型別 | 語意（current）| 語意（long-term per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md`）|
| --- | --- | --- | --- |
| `download.fileUrl` | string（optional）| 文章 download CTA 之 target URL（legacy；可指任意 URL）| **過渡語意**：指向**站內 noindex download landing page**；**不**直接指 Google Form / Google Drive 檔案 |
| `download.assetRefs` | string[]（optional）| 對應 `settings.downloadAssets[].assetId`；目前 read-only registry 為 empty | **新模型**：可下載資產 reference（ZIP / PDF / JPG）；landing page renderer 透過 registry resolve 出真正的 Google Drive URL |
| `download.formRef` | string（optional）| 對應 `settings.downloadForms[].formId`；目前 read-only registry 為 empty | **新模型**：表單 reference；landing page renderer 透過 registry resolve 出 Google Form embed URL |

### 3.2 文章 → landing page → form → asset 之長期流程

```text
Search / social / internal traffic
  → article page                                         (indexable，SEO 入口)
    → article page CTA                                   (uses download.fileUrl OR derived from download.assetRefs[] / formRef via renderer)
      → internal download landing page                   (noindex；不進 sitemap；不被 robots indexed)
        → landing page embeds Google Form                (formRef → registry → embed URL)
          → user submits form
            → user receives or sees Google Drive asset   (assetRefs[] → registry → Drive URL；可能是 ZIP，內含多個 PDF / JPG)
```

**關鍵不變式**：

- article page CTA **不**直接指 Google Form。
- article page CTA **不**直接指 Google Drive 檔案。
- 真正能對外提供 ZIP / PDF / JPG 的中介是 **internal noindex download landing page**。
- 使用者填表資料留在 Google Forms / Sheets；**不**進 repo / Admin static files / settings registry。

### 3.3 三個欄位的真正資料來源

- `download.fileUrl`：文章 frontmatter（內容屬性）。長期意義為 landing page URL，**不是**檔案 URL。
- `download.assetRefs[]`：文章 frontmatter（內容屬性）；解析需 `settings.downloadAssets` registry。Google Drive 檔案 URL 由 registry 提供。
- `download.formRef`：文章 frontmatter（內容屬性）；解析需 `settings.downloadForms` registry。Google Form embed URL 由 registry 提供。

三者**不重疊**，可能合理共存：

- `fileUrl` 直接告訴**文章 CTA**該連去哪裡。
- `assetRefs[]` 告訴**landing page renderer**有哪些可下載資產。
- `formRef` 告訴**landing page renderer**要嵌入哪個表單。

### 3.4 為何「`assetRefs + formRef` 共存」是正常而非錯誤

per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §5 之 long-term modeling：

```text
download.deliveryMethod = embedded-google-form
download.landingPageUrl = internal noindex download page
download.fileType       = ZIP
download.fileCount      = 3
download.buttonLabel    = 前往下載頁
download.description    = 填寫表單後取得內含 3 份 PDF 的 ZIP 檔
```

並且：

```text
downloadPage.formEmbedUrl = Google Form embed URL
downloadPage.assetHost    = Google Drive
downloadPage.noindex      = true
downloadPage.sitemap      = false
```

換言之：**一篇下載文章的 landing page 需要同時知道「哪些檔案可下載（assetRefs）」與「哪個表單做 gating（formRef）」**。
兩者並非二選一，而是構成完整下載流程之兩個正交資訊。R6 若把
`assetRefs + formRef` 視為衝突，會直接違反 long-term model。

---

## 4. Existing Validation Rules

### 4.1 Frontmatter shape（D1 / D2 / D3）

| Rule id | Condition |
| --- | --- |
| `download-fileurl-invalid-type` | `download.fileUrl !== undefined && typeof !== 'string'` |
| `download-enabled-fileurl-empty` | `contentKind === 'download' && download.enabled === true && fileUrl missing/empty/whitespace` |
| `download-fileurl-invalid-format` | non-empty `fileUrl` not matching `^https?://` |

### 4.2 SEO interlock

| Rule id | Condition |
| --- | --- |
| `download-content-should-be-noindex` | `contentKind === 'download'` 且 `seo.indexing ∉ { 'noindex-follow', 'noindex-nofollow' }` 且 D1 / D2 / D3 都沒觸發 |

### 4.3 assetRefs / formRef shape（Option 6 + Option A）

| Rule id | Condition |
| --- | --- |
| `download-asset-refs-invalid-type` | `assetRefs !== undefined && !Array.isArray(assetRefs)` |
| `download-asset-ref-invalid-type` | `assetRefs` 為 array 但 item 非 string |
| `download-asset-ref-empty` | array item 為 string、trim 後為空 |
| `download-form-ref-invalid-type` | `formRef !== undefined && typeof formRef !== 'string'` |
| `download-form-ref-empty` | `typeof formRef === 'string' && formRef.trim() === ''` |

### 4.4 Registry-level（R1）

| Rule id | Condition |
| --- | --- |
| `download-registry-invalid-shape` | downloadAssets / downloadForms 非 plain object，或 `assets` / `forms` 非 array |
| `download-registry-duplicate-key` | 同一 `assetId`（或 `formId`）trim 後出現 ≥ 2 次 |

### 4.5 R2（not-found）

| Rule id | Condition |
| --- | --- |
| `download-asset-ref-not-found` | `assetRefs[i]` shape 合法但不在 registry |
| `download-form-ref-not-found` | `formRef` shape 合法但不在 registry |

Registry shape 不合法時跳過 lookup（`assetKeySet === null` / `formKeySet === null` gate）。

### 4.6 R5b（intra-post duplicate）

| Rule id | Condition |
| --- | --- |
| `download-asset-ref-duplicate` | 單一 post `download.assetRefs[]` 內 trim 後 case-sensitive 相同 |

與 R2 為 **orthogonal cascade**：同一 key 可同時觸發 not-found 與 duplicate。

### 4.7 目前**沒有**覆蓋的 coexistence 情境

| 情境 | 目前 validator 反應 |
| --- | --- |
| 只有 `fileUrl`，沒有 `assetRefs` / `formRef` | 不檢查（只看 D1 / D2 / D3）|
| 只有 `assetRefs[]`，沒有 `fileUrl` / `formRef` | 不檢查 |
| 只有 `formRef`，沒有 `fileUrl` / `assetRefs[]` | 不檢查 |
| `assetRefs[] + formRef`，無 `fileUrl` | 不檢查 |
| `fileUrl + assetRefs[]` | 不檢查（兩者各自走自己的 shape rule，互不關聯）|
| `fileUrl + formRef` | 不檢查（同上）|
| `fileUrl + assetRefs[] + formRef` | 不檢查（同上）|
| `download.enabled: false`，但 `assetRefs[]` / `formRef` 仍填值 | 不檢查 |
| `download.enabled: true`，但三個欄位皆無 | 對 `contentKind === 'download'` 而言：D1 觸發；對非 `download` contentKind：不檢查 |

R6 的 candidate scope 即上述所有 ❌ 未覆蓋情境之**選擇性子集**。

---

## 5. Production / Fixture Usage Inventory

### 5.1 Production posts（`content/blogger/posts/` + `content/github/posts/` + `content/shared/posts/`）

對所有 production posts 掃描 `download:` block 與 `assetRefs` / `formRef` token：

| Post | download block? | enabled | fileUrl | assetRefs | formRef | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | ✅ | `true` | `""`（empty）| 無 | 無 | status = `draft`；validator 不 run（per `loadPosts` filter）；長期 candidate for landing page migration |
| 其餘所有 production posts | ❌（無 `download:` block）| — | — | — | — | — |

對 `assetRefs` / `formRef` 之 production 使用率：

- `content/blogger/posts/` 全部 posts：**zero** `assetRefs` / `formRef` 使用。
- `content/github/posts/` 全部 posts：**zero**。
- `content/shared/posts/` 全部 posts：**zero**。

### 5.2 Templates

| Template | download block? | enabled | fileUrl | assetRefs | formRef |
| --- | --- | --- | --- | --- | --- |
| `content/templates/blogger-download-template.md` | ✅ | `true` | `""` | 無 | 無 |
| `content/templates/post-template.md` | ❌ | — | — | — | — |
| 其餘 templates（book-review / magazine-review / summary / tech-note）| ❌ | — | — | — | — |

Templates 與 production 一致——尚無任何 template 採用 `assetRefs[]` / `formRef`。

### 5.3 Validation fixtures（`content/validation-fixtures/blogger/posts/`）

16 個 download-related fixture，依共存組合分類：

| Combination | Count | Fixtures | Risk note |
| --- | --- | --- | --- |
| `fileUrl` only（含 invalid-type / invalid-format / enabled-empty / SEO 變體）| 5 | `_test-download-fileurl-invalid-type.md`、`_test-download-fileurl-invalid-format.md`、`_test-download-enabled-fileurl-empty.md`、`_test-download-content-should-be-noindex-index.md`、`_test-download-content-should-be-noindex-missing.md` | 既有 D1 / D2 / D3 / S 個別覆蓋；R6 不影響 |
| `fileUrl + assetRefs`（assetRefs 觸發 shape / not-found / dup）| 7 | `_test-download-asset-refs-invalid-type-string.md`、`_test-download-asset-refs-invalid-type-object.md`、`_test-download-asset-ref-invalid-type-item.md`、`_test-download-asset-ref-empty-item.md`、`_test-download-asset-ref-not-found.md`、`_test-download-asset-ref-duplicate.md` | 全數已含 fileUrl 以**避開 D1**（合法 https URL）；R6 若把 `fileUrl + assetRefs` 視為衝突，會**全數新增 warning**，污染 fixture 預期值 |
| `fileUrl + formRef`（formRef 觸發 shape / not-found） | 5 | `_test-download-form-ref-invalid-type-object.md`、`_test-download-form-ref-invalid-type-array.md`、`_test-download-form-ref-empty.md`、`_test-download-form-ref-whitespace.md`、`_test-download-form-ref-not-found.md` | 全數已含 fileUrl 以**避開 D1**；R6 若把 `fileUrl + formRef` 視為衝突，會**全數新增 warning** |
| `fileUrl + assetRefs + formRef` | 0 | — | 目前無 fixture 同時包含三者 |
| `assetRefs` only（無 fileUrl） | 0 | — | 既有 fixture 設計**特意避開**這組合（per `docs/20260601-download-content-reference-fixture-creation-preflight.md`），以維持單一 rule 觸發 |
| `formRef` only（無 fileUrl） | 0 | — | 同上 |
| `assetRefs + formRef`（無 fileUrl） | 0 | — | 同上；但這正是 long-term **正確**的下載文章模型 |
| `enabled: false + references present` | 0 | — | 既有 fixture 皆設 `enabled: true` |
| `enabled: true + 全部 references 缺失` | 1 | `_test-download-enabled-fileurl-empty.md`（D1 變體）| 已由 D1 覆蓋 |

### 5.4 重要觀察

1. **production 對 R6 完全免疫**：production 沒有任何 post 使用 `assetRefs[]` / `formRef`；唯一含 `download:` block 的 post（phonics practice）是 draft，不進 validator。
2. **R6 一旦對 `fileUrl + assetRefs` 或 `fileUrl + formRef` 任一發出 warning，會直接污染 12 個既有 fixture**（7 + 5 = 12）。這 12 個 fixture 為了避開 D1，幾乎都帶有合法 fileUrl。R6 設計若不慎，會迫使整批 fixture 重寫或新增 warning。
3. **目前沒有任何 fixture 測試 long-term 正確模型**（`assetRefs + formRef`、可選 `fileUrl` 指向 landing page），因為 R6 還沒設計、landing page renderer 還沒實作。

---

## 6. Coexistence Matrix

逐一分析以下 9 種主要 download field 組合，標註 **建議** R6 反應（pass / warning / error / skip）並給出理由。所有分析以 `contentKind === 'download'`、`status: ready | published`、`download.enabled: true` 為前提；非 `download` contentKind 之 download block 屬另一獨立議題（不在本 matrix 內）。

| # | Combination | Long-term 正當性 | 短期 production 觀察 | R6 反應建議 |
| --- | --- | --- | --- | --- |
| C1 | **fileUrl only**（無 assetRefs、無 formRef） | 過渡期允許：`fileUrl` 指向 internal noindex landing page，landing page 自己內嵌 form 與 asset。亦可作為純外部下載 URL（legacy） | production 唯一活 draft 採此形 | ✅ **pass / no warning**（保留 legacy 行為；D1 / D2 / D3 / S 已覆蓋 shape）|
| C2 | **assetRefs only**（無 fileUrl、無 formRef） | 部分合理：landing page renderer 可從 assetRefs[0] 推導 CTA target；無 form gating 之純 asset 下載（如直接公開的 PDF link 由 renderer 產生）| 目前 production = 0；fixture = 0 | ⚠️ **gray zone**：建議**先 skip / 不警告**；若 renderer 落地後仍無 CTA fallback，才於 renderer 端錯誤訊息引導；R6 暫時不擔 |
| C3 | **formRef only**（無 fileUrl、無 assetRefs） | 部分合理但少見：使用者填表後**不**取得檔案？或檔案藏在 form thank-you page？這已偏離 long-term model。仍可能用於 newsletter signup 類非下載 form。但**這類非下載 form 不該住在 contentKind = 'download'** | 目前 production = 0；fixture = 0 | ⚠️ **gray zone**：可考慮 future warning「download content 應同時含 assetRefs」，但門檻高；R6 暫時不擔 |
| C4 | **assetRefs + formRef**（無 fileUrl） | ✅ **long-term 正確模型**：landing page renderer 透過 formRef → form embed；assetRefs → 表單後送出之檔案 reference；article CTA 由 renderer 從 site config 之 landing page route 自動產生 | 目前 production = 0；fixture = 0 | ✅ **pass / no warning**（這是目標形態；R6 **必須**允許）|
| C5 | **fileUrl + assetRefs**（無 formRef） | 短期允許：legacy + 新模型 partial migration；fileUrl 可能指向 landing page，assetRefs 提供 renderer 額外資訊；亦可能為純 legacy fileUrl + 試填 assetRefs | production = 0；fixture = 7（皆為 assetRefs shape / R2 / R5b 之 host fixture）| ⚠️ **預設 pass / no warning**；若有強烈 user-facing harm 證據，未來可考慮 hybrid 警告，但**現在不該擔** |
| C6 | **fileUrl + formRef**（無 assetRefs） | 短期允許：fileUrl 指向 landing page；formRef 給 renderer；尚未 link 到具體 asset | production = 0；fixture = 5（皆為 formRef shape / R2 之 host fixture）| ⚠️ **預設 pass / no warning**；reasoning 同 C5 |
| C7 | **fileUrl + assetRefs + formRef** | ✅ **過渡期最完整資料**：legacy fileUrl + 新模型 assetRefs + formRef 都齊；renderer 可挑用其一 | production = 0；fixture = 0 | ✅ **pass / no warning**；R6 **不**該因為「三個都有」就警告 |
| C8 | `enabled: false` + references present（任一）| ⚠️ 邏輯異常：download disabled 卻填了 references；可能是 author 把 `enabled: false` 當作「下線標記」 | production = 0；fixture = 0 | ⚠️ **可考慮 future warning**「`download.enabled === false` 但 references 仍存在」；非首批 R6 必要 |
| C9 | `enabled: true` + 三個欄位皆空 / 缺 | ❌ 邏輯錯誤：宣告 download 但無 source | production = 0（既有 phonics draft 屬此情境但為 draft 不進 validator）| ✅ **已被 D1 覆蓋**（`download-enabled-fileurl-empty`）。R6 **可選擇**延伸 D1 至「也包含 assetRefs / formRef」；但這實際上是 D1 的擴張而非 R6 的新規則 |

### 6.1 共識結論

- **C1 / C4 / C5 / C6 / C7 都應 pass**——這些是 long-term model 之合法狀態或過渡期合理狀態。
- **C2 / C3 / C8 屬 gray zone**：R6 首批不必涵蓋；保留為未來擴張。
- **C9 已由 D1 涵蓋**：R6 若擴張需考慮 D1 互斥。

**R6 真正的 candidate space 非常小**：實際上首批 R6 沒有任何「必擔」之衝突情境。

---

## 7. Rule Candidate Options

### Option A：不做 R6，維持現狀

- **內容**：完全不新增 R6 family。R-series 在 R5b 後永久 freeze。
- **Pros**：
  - 零實作成本。
  - 零 baseline 移動。
  - 零 fixture 污染風險。
  - 零 production migration 風險。
  - 完全符合 long-term model（assetRefs + formRef 共存）。
- **Cons**：
  - C8 / C9 邊界情境永遠不會被 R6 family 捕捉（但 C9 已由 D1 覆蓋；C8 production = 0）。
  - 若未來真有 user-facing harm 情境出現，需另開 R6 family（成本與本選項零差）。
- **適用情境**：landing page renderer 尚未落地時的最保守選擇。

### Option B：只針對明顯衝突給 warning

- **內容**：只擔 C9（enabled + 無任何 reference）之 D1 擴張（更名 / 涵蓋擴張），其餘共存組合一律 pass。
- **Pros**：
  - 最小 rule diff。
  - 覆蓋唯一在 production 真正會出錯的情境（C9）。
  - 不影響既有 fixture（C9 已由 D1 覆蓋）。
- **Cons**：
  - 實質上是 D1 的修飾，並非「coexistence」rule；命名上會誤導 R6 之 family scope。
  - 若實作為 D1 擴張，建議走 D-series 命名（如 `download-enabled-no-source`），不該叫 R6。
- **適用情境**：若 user 認為 D1 太窄、不涵蓋 assetRefs / formRef 場景，可作為 R6 之 minimal first batch。
- **本 phase 仍建議列為候選但不立即實作**。

### Option C：新模型下 assetRefs + formRef 可共存，fileUrl 視為 landing URL，**不**視為衝突

- **內容**：明文宣告 C4 / C5 / C6 / C7 **不**警告；只擔 C2 / C3 / C8 / C9 之 future warning。
- **Pros**：
  - 與 long-term model 一致。
  - 不污染既有 fixture。
- **Cons**：
  - C2 / C3 / C8 屬 gray zone，未必能裁決出有意義的 warning condition。
  - 實質上仍只是 Option B 的擴張版；rule space 仍小。
- **適用情境**：當 user 同時要求「保留長期模型」且「擔某些 edge case」時可用。

### Option D：嚴格禁止 legacy fileUrl 與 registry refs 共存

- **內容**：對 C5 / C6 / C7 一律警告（要求 author 二選一）。
- **Pros**：
  - 過渡期可用來推 author migration。
- **Cons**：
  - **直接違反 long-term model**：C7 是 hybrid 過渡之最完整資料形態。
  - **污染 12 個既有 fixture**（7 + 5；皆為避 D1 而帶 fileUrl 的 assetRefs / formRef shape fixture）。一旦 D 啟動，必須重寫整批 fixture 或顯式 expected-set 增列 R6 warning。
  - 強迫 production 在 landing page renderer 落地前就 migrate，與 §10 紅線衝突。
- **適用情境**：landing page renderer 與 Admin picker **皆已成熟、production 已準備 migration** 時，可考慮以此推遲 final cleanup。本 phase 強烈**不**建議。

### Option E：先等 landing page renderer / Admin picker 成熟後再做

- **內容**：本 phase 不啟動任何 R6 source；等到下列條件至少滿足兩項時再開 R6 preanalysis 二輪：
  1. landing page renderer 已實作（至少 single-post 可 render landing page）。
  2. Admin picker 已實作（可由 registry 挑 assetRefs / formRef）。
  3. production 至少有 1 篇 post 採 long-term model（含 assetRefs + formRef + landing page URL）成功跑通。
- **Pros**：
  - 等實際資料形態穩定後再裁決 R6，避免裁錯。
  - 與 R4a Option A（keep registries empty）保持哲學一致：在 consumer 落地前不擴張 validator surface。
  - 0 baseline 移動；0 fixture 污染。
- **Cons**：
  - R6 family 暫時無 rule，gray zone（C8 / C9 之 reference 變體）短期不被擔。
- **適用情境**：當前狀態下的**最保守且最相容**選擇。

### Option comparison summary

| Option | Implementation cost | Baseline movement | Fixture pollution | Long-term model alignment | Production migration pressure | Recommend? |
| --- | --- | --- | --- | --- | --- | --- |
| A | 0 | 0 | 0 | ✅ | 0 | ✅ acceptable |
| B | low | +1 fixture / +1 warning（若新 rule）| 0 | ✅ | 0 | ⚠️ optional |
| C | medium | small | possibly 0 | ✅ | 0 | ⚠️ optional |
| D | medium-high | +12 warnings minimum | ❌ heavy | ❌ violates long-term | ❌ premature | ❌ reject |
| E | 0 | 0 | 0 | ✅ | 0 | ✅ **recommended** |

---

## 8. Recommended R6 Semantics

### 8.1 是否現在需要 R6？

**No.** 不建議現在做 R6。

理由（per §6 / §7）：

1. production 對所有 coexistence 情境完全 immune（zero `assetRefs` / `formRef` usage）。
2. 唯一活 production download draft（phonics practice）為 draft，validator 不 run；遷移時程未定。
3. landing page renderer 未實作 → R6 預期之 long-term model 無法 ground truth verify。
4. Admin picker 未實作 → R6 reference 變體之 author input failure mode 還沒形成。
5. R6 若擔錯（如 Option D），會直接違反 long-term model 並污染 12 個既有 fixture。
6. R6 若擔對（如 Option A / E），現在跟未來零差別。

### 8.2 若未來啟動 R6b（hypothetical；本 phase **不**授權）

以下為 R6b 啟動時的**建議**設計，非本 phase 落地：

#### 8.2.1 Rule id family 建議

- `download-ref-coexistence-*` family（rule id prefix），避免與既有 `download-asset-ref-*` / `download-form-ref-*` 之 per-ref family 混淆。
- 或對 D1 之 enabled-no-source 擴張採 `download-enabled-no-source` 並標為 D-family 擴張，非 R6。

| 若採 | 建議 rule id |
| --- | --- |
| Option B（D1 擴張）| `download-enabled-no-source`（D-family 擴張；replace D1 in scope）|
| Option C（明定共存允許 + 擔 C8）| `download-ref-without-enabled`（C8 候選）|
| Option D（**不**建議）| `download-fileurl-and-refs-conflict`（拒絕之候選；列出僅為負面記錄）|

#### 8.2.2 Severity

**warning**（一律）。與整個 download family 一致；project policy 從不 block build（CLAUDE.md §13 / §27）。

#### 8.2.3 在 `validate-content.js` 的順序

建議排在 R5b 之後、SEO interlock 之前：

```text
download.fileUrl shape       (D1 / D2 / D3)
download.assetRefs shape     (Option 6)
download.formRef shape       (Option A)
R2 not-found                 (assetRefs / formRef)
R5b duplicate                (assetRefs)
R6 coexistence               ← 新位置（若實作）
SEO interlock                (S)
```

理由：R6 應在所有 per-field shape rule 通過後才嘗試共存判讀；shape 失敗時 R6 直接跳過。

#### 8.2.4 是否需要 invalid-type / empty 值之 gating

**Yes.** R6 必須在以下任一前提失敗時直接跳過：

- `download` block 非 plain object。
- `download.fileUrl` invalid-type（D2）。
- `download.assetRefs` invalid-type（Option 6 §1）。
- `download.formRef` invalid-type（Option A §1）。

R6 不 evaluate 上述前提失敗時之欄位語意；交由 shape rule 處理。

#### 8.2.5 是否需要 registry lookup

**No（首批不需要）。** R6 多數候選 rule 為純 frontmatter 共存形狀，**不**需要 registry。  
若未來擴張至「assetRefs 已 resolve 為 inactive entry + formRef 已 resolve」之類深度判讀，再另開 R6c 處理。

#### 8.2.6 對 R2 / R5b 的影響

**Zero（如 orthogonal 設計）：** R6 不變更 R2 not-found 與 R5b duplicate 行為。
若 R6 採 Option D（不建議），R6 會與 R2 / R5b 共觸發於同一 post，造成 N + R5b dup + R6 conflict 之多重 warning；除非 R6b 明文設計成 R2 / R5b 失敗時 short-circuit R6，否則 cascade 會放大。

**建議**：R6 與 R2 / R5b 採與 R5b ↔ R2 相同的 **orthogonal cascade**（不互 suppress）。

#### 8.2.7 對既有 production content 的影響

- 若採 Option A / B / C / E：production 零影響（production 無 `assetRefs` / `formRef`）。
- 若採 Option D：production 之 phonics practice（一旦 promote 至 ready）可能命中 R6 warning；但這應由 promote-to-ready gate（per `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §8）先擋下。仍應視為 D 之 reject 理由之一。

### 8.3 預設裁決

**Option E — defer R6 entirely.** 等到 landing page renderer / Admin picker / production migration 至少其中兩項落地後，再開 R6 二輪 preanalysis。

---

## 9. Fixture Strategy

本節**規劃** R6 假設啟動時所需之 fixture；本 phase **不**新增、**不**修改任何 fixture。

### 9.1 若 R6 採 Option A / E：fixture 數量

**0.** 不需要任何新 fixture。

### 9.2 若 R6 採 Option B（D1 擴張至 ref 變體）：fixture 數量

預估 **1** 個新 fixture：

- `_test-download-enabled-no-source.md`：`contentKind = 'download'`、`download.enabled = true`、無 `fileUrl`、無 `assetRefs`、無 `formRef`。
- 預期 baseline 移動：+1 post / +1 warning。

但這實際上和 D1 之變體形式相同；可能與既有 `_test-download-enabled-fileurl-empty.md` 合併或共用。若合併，新 fixture 0。

### 9.3 若 R6 採 Option C（gray zone 擔）：fixture 數量

預估 **2–3** 個新 fixture（per C2 / C3 / C8 各一）。Multi-rule fixture 可接受但建議單一 rule 隔離，per `docs/20260601-download-content-reference-fixture-creation-preflight.md` §4。

### 9.4 若 R6 採 Option D（不建議）：fixture **與既有 fixture 互動**

- 12 個既有 fixture（assetRefs shape / R2 / R5b 之 host fixture 共 7；formRef shape / R2 之 host fixture 共 5）皆已含 fileUrl 以避 D1。R6 Option D 會對這 12 個 fixture 全數新增 1 個 R6 warning。
- 預估 baseline 移動：**+12 warnings**（最壞情形）。
- 須全數重寫 fixture 之 expected-set，或顯式接受 multi-rule 並更新 expected-set 為 R6 + R2 + R5b 等共觸發。
- **本 phase 強烈不建議**。

### 9.5 是否可接受 multi-rule fixture

可。R5b 之 `_test-download-asset-ref-duplicate.md` 已建立 multi-rule precedent（per `docs/20260603-download-r5b-duplicate-checkpoint.md` §5.2，2× not-found + 1× duplicate）。
但 multi-rule 設計成本高，建議首批 R6 仍以 single-rule fixture 為主。

### 9.6 是否需要 production content migration

**No.** 任何 R6 設計不該觸發 production migration。R6 是 validator-only defensive layer。  
production migration 屬獨立的 phase；前置條件詳見 `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §8 之 promote-to-ready gates。

---

## 10. Risks / Red Lines

R6 不論採哪個 Option，**必須**遵守以下紅線：

### 10.1 文章 CTA 不得直接變成 Google Form

- 即使 `formRef` registry-resolved 已有 form embed URL，**article CTA 仍不該**直接連向該 Google Form。
- article CTA 之 target 必須是 internal noindex download landing page。
- R6 若擔「`formRef` only 而無 fileUrl / landing page 推導」應指向 author 修正為「補上 landing page URL 或 assetRefs[]」；不該指向「補上 Google Form URL」。

### 10.2 使用者填表資料不得進 repo

- Google Forms responses **remain in Google Forms / Sheets**（per CLAUDE.md §3.2 / pm-20 §4 R1）。
- R6 不該設計成需要讀取 form response data 之 rule。
- registry 不該因為 R6 需求被擴張為儲存 respondent data 之容器。

### 10.3 不得誤判 `assetRefs + formRef` 為錯誤

- C4 是 long-term **正確**模型。R6 若視為錯誤，違反 `docs/20260529-reverse-utm-download-landing-page-flow-decision.md` §5 之 long-term modeling。
- Option D 因此被本 phase **拒絕**。

### 10.4 不得在 landing page renderer 尚未成熟前強迫 production migration

- production 唯一活 download draft（phonics practice）目前 `fileUrl: ""`、無 ref；待 promote 至 ready 之前置條件包括「internal download landing page URL exists」與「Google Form is embedded and publicly usable」。
- R6 不得繞過 promote-to-ready gates 而直接以 warning / error 推 author 改動。
- R6 必須允許 legacy fileUrl 在 long-term migration 完成前繼續存在。

### 10.5 不得解除 reverse UTM / pm-26 / Admin write 相關 freeze

- reverse UTM remains **dormant**（per CLAUDE.md §16.4）。
- pm-26 deploy gate remains **BLOCKED**。
- Admin Apply / middleware write / admin-write-cli remain **dormant**。
- R6 為 validator-only 設計，**不**涉及 deploy、Blogger repost、GA4、reverse UTM、pm-26、Admin write 任一鏈條。
- R6 preanalysis（本 phase）與假設未來之 R6b implementation 皆**不**得 trigger 上述 freeze 解除。

### 10.6 不得污染 fixture expected-set

- 12 個既有 fixture（per §5.3 / §9.4）已依「single-rule isolation」原則設計。R6 必須避免讓這些 fixture 額外觸發 R6 warning。
- 若 R6 不可避免地擔到既有 fixture，必須在 R6b preflight 階段明文列出影響 fixture 與重寫計畫，並由 user 顯式 acknowledge。

### 10.7 不得替代 D1 / D2 / D3 / S 之既有覆蓋

- R6 不該重覆 D1 之 `download-enabled-fileurl-empty` 觸發條件。若 R6 採 Option B 擴張，應與 D1 **互斥**（mutual exclusion；先擴張 D1，R6 跳過），或直接 rename D1 至更廣語意，而非新增獨立 R6 rule。

---

## 11. Next Possible Phases

下列為**候選**後續 phase；本 phase **不**啟動任何項。是否啟動由 user 各自獨立 prompt 決定：

1. **R6b source implementation preflight**（docs-only）  
   - 條件：landing page renderer / Admin picker / production migration **至少其中兩項**已完成；或 user 明文要求 Option B 之 D1 擴張作為短期防護。
   - 範圍：規劃 R6 source 修改邊界、severity / ordering / gating、預期 fixture diff。
   - 不啟動本 phase。

2. **R6b source + fixture implementation**（source + fixture single commit）  
   - 條件：R6b preflight 已 land、user 已 acknowledge fixture 計畫。
   - 範圍：實作 R6 rule + 對應 fixture。
   - **不**啟動本 phase。

3. **R4a Option C preflight**（docs-only）  
   - 條件：user 決定改變 R4a 之 Option A 立場（不建議現在動）。
   - 範圍：test-only registry fixture override 之 loader / validator architecture preanalysis。

4. **Landing page renderer preanalysis**（docs-only）  
   - 條件：user 決定下一步往 user-facing landing page 推進。
   - 範圍：landing page render pipeline / noindex meta / sitemap exclusion / per-page route 設計。

5. **Admin picker preanalysis**（docs-only）  
   - 條件：user 決定下一步往 Admin UI 推進。
   - 範圍：Admin 端 registry consumer 雛形；Admin Apply remains dormant 前提下。

6. **Production migration preanalysis**（docs-only）  
   - 條件：landing page renderer 已 land；Google Form 已 embedded；ZIP 已備齊。
   - 範圍：phonics practice draft 之 promote-to-ready 計畫；assetRefs / formRef 回填策略。

7. **Final Idle Freeze / EXIT**  
   - 條件：本 phase 後 user 無下一步指示。
   - 範圍：repo 不再變動，等下次 user prompt。

---

## 12. Recommendation

**Final Idle Freeze / EXIT.**

理由：

1. **R6 不必要現在啟動.** Production zero usage、fixture 無 coexistence 漏洞、long-term model 之主要正確形（C4 / C7）已被 §6 確認，且現有 D1 / D2 / D3 / S / R1 / R2 / R5b 已涵蓋所有 production 可能命中的 download failure mode。
2. **R6 過早啟動有負面風險.** Option D 會違反 long-term model 並污染 12 個既有 fixture；Option B / C 對 user-facing harm 之改善有限；唯一無風險的選擇（A / E）為「不啟動」。
3. **landing page renderer / Admin picker / production migration 尚未成熟.** 等 long-term model 之 ground truth 出現後再裁決，避免設計裁錯。
4. **保留所有 dormant rails.** reverse UTM / pm-26 / Admin Apply / middleware write / admin-write-cli 均不需要因為 R6 而動。本 phase 維持所有現有 freeze。

下一個合理 phase（由 user 主動 prompt 才啟動）：

- 若想推進 user-facing 體驗：**landing page renderer preanalysis**。
- 若想推進 Admin UI 體驗：**Admin picker preanalysis**。
- 若都不推進：**Final Idle Freeze / EXIT**（本 phase 結束後預設狀態）。

本 phase 對 source / fixture / registry / loader / templates / CLAUDE.md / package / dist / gh-pages 均**零**動作；唯一變動為新增本 docs 檔。

---

## Appendix A — Cross-reference index

- R5b checkpoint：`docs/20260603-download-r5b-duplicate-checkpoint.md`
- R5a preanalysis：`docs/20260602-download-r5-duplicate-rule-preanalysis.md`（§8.9 forward-compat note 提及 R6）
- R2 checkpoint：`docs/20260602-download-r2-not-found-checkpoint.md`
- R4a strategy：`docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`
- R-series plan：`docs/20260602-download-registry-aware-validation-preanalysis.md`（§5.5 coexistence candidates；§9 R6）
- Schema decision：`docs/20260531-download-asset-form-settings-registry-schema-decision.md`
- Empty-registry plan：`docs/20260531-download-empty-registry-implementation-plan.md`
- Landing page flow：`docs/20260529-reverse-utm-download-landing-page-flow-decision.md`（§3 流程；§5 long-term model；§8 promote-to-ready gates）
- preview-url-risk policy：`docs/20260530-download-fileurl-preview-url-risk-policy.md`（§A.1：preview-url-risk = docs-only authoring policy；不轉成 validator rule；R6 同樣保持 validator-only conservativeness）
- Governing policy：CLAUDE.md §3.2 / §13 / §16.4 / §27 / §29
- Source of truth at HEAD `a25be4a`：
  - `src/scripts/validate-content.js`（D1 / D2 / D3 / S / Option 6 / Option A / R1 / R2 / R5b cascade）
  - `src/scripts/load-settings.js`（registry read-only loader，Phase 20260601-pm-11）
  - `content/settings/download-assets.json` / `download-forms.json`（empty registries since commit `466e471`）
- R5b fixture：`content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md`
- R2 fixtures：
  - `content/validation-fixtures/blogger/posts/_test-download-asset-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-download-form-ref-not-found.md`
- Active production download draft：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`（status = draft；不進 validator）
- Download template：`content/templates/blogger-download-template.md`
