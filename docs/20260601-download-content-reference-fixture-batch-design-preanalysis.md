# 20260601 Download Content Reference Fixture Batch Design Preanalysis

> Phase: `20260601-night-1-download-content-reference-fixture-batch-design-preanalysis-docs-only-a`
> Date: 2026-06-01 22:03 +0800
> Scope: **docs-only**（單檔新增；無 source / content / settings / templates / fixture / registry / package / dist / gh-pages / CLAUDE.md 變更）

---

## 1. Executive Summary

- 本文件為 **docs-only fixture batch design preanalysis**：承接已完成並驗收通過的 pm-23 download content reference validation preanalysis（`dcf44c5`）與 pm-21 download validator fixture strategy preanalysis（`7a595f3`），進一步把未來 `download.assetRefs[]` / `download.formRef` 之 **content-reference fixtures** 之命名、放置、batch 切分、expected baseline 移動量、與其他治理紅線**設計成案**。
- 本文件**不修改** `src/scripts/validate-content.js`。
- 本文件**不修改** `src/scripts/load-settings.js` 或任何 `src/` source。
- 本文件**不新增 fixture**（`content/validation-fixtures/` 一檔不動）。
- 本文件**不改 registries**（`content/settings/download-assets.json` / `download-forms.json` 一檔不動）。
- 本文件**不改 content / templates / drafts / archive**。
- 本文件**不啟動** Admin picker / renderer / landing page / content migration / Admin Apply / middleware write / admin-write-cli / reverse UTM / pm-26 unblock。
- 目標：為**未來 fixture creation 階段**定型「該造哪些 fixtures、各 fixture 的 frontmatter shape、期待觸發的 warning code、acceptance 該預寫的 baseline 數字」。**fixture creation 本身、validator source、registry 移動，皆延後至獨立、明示授權的後續 phase**。
- 本檔落地後 production state drift = 0；唯一變更為新增本 docs 檔。

### 1.1 一句話裁決

> **Future content reference fixture creation 應採「最小型別/空值集」**：對 `assetRefs` array-type、`assetRefs[i]` item-type / empty-string、`formRef` string-type / empty-string 之 negative fixtures 給出固定命名與 frontmatter 模板；**全部留在 `content/validation-fixtures/blogger/posts/`、無 github 對照、無 positive fixture、無 not-found、無 duplicate、無 coexistence、無 registry mutation**。fixture creation 本身**必須 user 明示**才啟動；本 docs 落地後預設 Final Idle Freeze / EXIT。

---

## 2. Accepted Prior Baseline

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| HEAD | `dcf44c5d182fba004262fc857a7baf3fc6f6bd9d`（short `dcf44c5`） |
| origin/main | `dcf44c5`（HEAD = origin/main；ahead/behind 0/0） |
| latest subject | `docs(download): plan content reference validation` |
| working tree | clean |
| validate baseline | **0 errors / 47 warnings / 42 posts** |
| download loader | ✅ landed + accepted（pm-11 `ac38ea9`；`load-settings.js:57-58` 暴露 `downloadAssets` / `downloadForms`） |
| download validator Option A（registry shape / duplicate-key） | ✅ landed + accepted（pm-17 `5452149`；warning-only；registry-level） |
| fixture strategy preanalysis | ✅ landed + accepted（pm-21 `7a595f3`） |
| content reference validation preanalysis | ✅ landed + accepted（pm-23 `dcf44c5`） |
| registries 狀態 | empty and clean（`assets: []` / `forms: []`；`schemaVersion: 1`） |
| `assetRefs[]` current usage（content + fixtures + template） | **0** |
| `formRef` current usage（content + fixtures + template） | **0** |
| legacy `download.fileUrl` 使用情形 | production 1（phonics；`status: draft` → 不入 baseline）；template 1；fixtures 5（D1/D2/D3/S，計入 47） |
| content reference validation rules | ❌ 尚未實作（none of A/B/C/D/E from pm-23 §4） |
| reverse UTM | landed but dormant |
| pm-26 deploy gate | BLOCKED |

> **本 phase 不重新證明 baseline 細節**；上述為承接 pm-23 / pm-21 已驗收狀態之要點重述。本 phase 開始時 `git rev-parse HEAD` / `git rev-parse origin/main` / `git rev-list --left-right --count` / `git status` / `git log -1` / `npm run validate:content` 已逐項對齊上述值。

---

## 3. Current Validator / Fixture Inventory（read-only summary）

### 3.1 既有 download 相關 validator rules（已 landed；本 phase 不動）

| 代號 | rule id | severity | 觸發條件 | source 位置 |
|------|---------|----------|----------|-------------|
| D1 | `download-enabled-fileurl-empty` | warning | `contentKind==='download'` 且 `download.enabled===true` 且 fileUrl 空/whitespace | `validate-content.js:574-580` |
| D2 | `download-fileurl-invalid-type` | warning | `download.fileUrl !== undefined` 且非 string | `validate-content.js:554-560` |
| D3 | `download-fileurl-invalid-format` | warning | fileUrl 為 non-empty trimmed string 但不符 `^https?://` | `validate-content.js:586-592` |
| S | `download-content-should-be-noindex` | warning | `contentKind==='download'` 且 `seo.indexing ∉ {noindex-follow, noindex-nofollow}`，且無 D1/D2/D3 warning（fix-first 階層） | `validate-content.js:625-631` |
| — | `download-registry-invalid-shape` | warning | top-level 非 object / `assets`(`forms`) 非 array | `validate-content.js:292-299` |
| — | `download-registry-duplicate-key` | warning | 同 registry 內 `assetId` / `formId` 重複 | `validate-content.js:312-321` |

### 3.2 既有 download 相關 fixtures（5 檔；非本批；本 phase 不動）

| 檔案 | 覆蓋規則 |
|------|----------|
| `content/validation-fixtures/blogger/posts/_test-download-enabled-fileurl-empty.md` | D1 |
| `content/validation-fixtures/blogger/posts/_test-download-fileurl-invalid-type.md` | D2 |
| `content/validation-fixtures/blogger/posts/_test-download-fileurl-invalid-format.md` | D3 |
| `content/validation-fixtures/blogger/posts/_test-download-content-should-be-noindex-index.md` | S（seo.indexing=index） |
| `content/validation-fixtures/blogger/posts/_test-download-content-should-be-noindex-missing.md` | S（seo.indexing 缺） |

### 3.3 既有 fixture 數量（合計 29 blogger + 28 github = 57；47 warnings 已包含此 57 檔之 negative 命中總和）

### 3.4 目前**沒有**任何 `assetRefs[]` / `formRef` fixture（grep 全 repo 0 命中於 content/）。

---

## 4. Candidate Content Reference Fields

承接 pm-23 §3.3 / §3.4。本文件**只是 fixture design**，不改 schema、不改 template。

| 欄位 | 預期型別 | 預期語意 | optional |
|------|----------|----------|----------|
| `download.assetRefs` | **array of string** | 每筆為 kebab-case `assetId`，對應 `downloadAssets.assets[].assetId` | ✅ optional（可省略；可 `[]` 視為「無 ref」） |
| `download.formRef` | **string** | kebab-case `formId`，對應 `downloadForms.forms[].formId` | ✅ optional（可省略；本 phase 暫不裁決「empty string 是否視為 absent」之語意，由 fixture E2 / E3 留作 source phase 議題） |

備註：

- `assetRefs: []`（空陣列）視為「無 ref」，**不**為型別錯誤；本批 fixture 設計**不**為「empty array」造 fixture（語意層留 source phase 決策）。
- `formRef` 之 empty string 是否該 warn 屬政策邊界，本 phase 暫**保留**為候選 fixture（見 §5 fixture E2），但 expected warning code 待 source phase 微調命名後對齊。
- 本 phase 不改 `content/templates/blogger-download-template.md`；任何 schema 追加屬另一獨立 schema/migration preanalysis（pm-23 §11 Option E），與本 fixture batch design **分離**。

---

## 5. Proposed First Fixture Batch — Type / Empty Checks Only

> ⚠ 本節僅**設計**未來 fixture；不建立任何檔案。所有 expected warning code 為**草案**，可在 source phase 微調命名（見 §6）。expected delta 為 +1 post / +1 warning per fixture，前提是「目標規則同批落地、且互斥階層成立」。

### 5.1 候選 fixture 一覽

| ID | proposed filename | purpose | expected warning code（草案） | expected warning delta | requires registry read | post count delta | rollback simplicity |
|----|-------------------|---------|------------------------------|------------------------|----------------------|------------------|--------------------|
| **A1** | `_test-download-asset-refs-invalid-type-string.md` | `download.assetRefs` 為 string → 觸發 type warning | `download-asset-refs-invalid-type` | +1 | ❌（純 frontmatter） | +1 | 🟢 單檔 `git rm` 即還原 |
| **A2** | `_test-download-asset-refs-invalid-type-object.md` | `download.assetRefs` 為 object → 觸發 type warning | `download-asset-refs-invalid-type` | +1 | ❌ | +1 | 🟢 |
| **B1** | `_test-download-asset-ref-invalid-type.md` | `assetRefs` 為 array，但 `[0]` 為 number / boolean / object → item type warning | `download-asset-ref-invalid-type` | +1 | ❌ | +1 | 🟢 |
| **B2** | `_test-download-asset-ref-empty.md` | `assetRefs: [""]` → item empty warning | `download-asset-ref-empty` | +1 | ❌ | +1 | 🟢 |
| **D1** | `_test-download-form-ref-invalid-type-array.md` | `download.formRef` 為 array → type warning | `download-form-ref-invalid-type` | +1 | ❌ | +1 | 🟢 |
| **D2** | `_test-download-form-ref-invalid-type-object.md` | `download.formRef` 為 object → type warning | `download-form-ref-invalid-type` | +1 | ❌ | +1 | 🟢 |
| **E1** | `_test-download-form-ref-empty.md` | `download.formRef: ""` → empty warning（**前提：policy 決定 empty string 應 warn**；若 policy 採「empty string ≡ absent」則本 fixture 不造） | `download-form-ref-empty` | +1（policy 決定後）/ 0（若視 absent） | ❌ | +1 | 🟢 |
| **E2** | `_test-download-form-ref-whitespace-only.md` | `download.formRef: "   "` → trim → empty warning（**前提：policy 決定 trim 後空字串應 warn**） | `download-form-ref-empty` | +1（policy 決定後） | ❌ | +1 | 🟢 |

> **policy decision needed before E1/E2 land**：pm-23 §4.D 之命名 `download-formref-empty` 與本批 `download-form-ref-empty` 為**草案差異**（前者單詞、後者連字符；見 §6 命名提案）。實際 rule id 於 source phase 拍板；本批僅標示「該不該造」與「frontmatter shape」。

### 5.2 各 fixture frontmatter shape（template；不建立檔案）

#### A1 — `assetRefs` is string

```yaml
---
title: "[validation-fixture] download.assetRefs is string"
slug: "test-download-asset-refs-invalid-type-string"
status: "ready"
draft: false
date: "2026-06-01"
description: "Future fixture: download.assetRefs invalid type (string) → assetRefs-invalid-type warning."
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"   # 避免同時觸發 S
download:
  enabled: true
  fileUrl: "https://example.com/placeholder.pdf"   # 避免同時觸發 D1
  assetRefs: "phonics-cards-zip-v1"   # ← intentional invalid type
---
```

#### A2 — `assetRefs` is object

```yaml
download:
  enabled: true
  fileUrl: "https://example.com/placeholder.pdf"
  assetRefs:
    assetId: "phonics-cards-zip-v1"   # ← intentional object，not array
```

（其餘 frontmatter 同 A1）

#### B1 — `assetRefs[i]` is non-string

```yaml
download:
  enabled: true
  fileUrl: "https://example.com/placeholder.pdf"
  assetRefs:
    - 12345   # ← intentional non-string item
```

#### B2 — `assetRefs[i]` empty string

```yaml
download:
  enabled: true
  fileUrl: "https://example.com/placeholder.pdf"
  assetRefs:
    - ""   # ← intentional empty
```

#### D1 — `formRef` is array

```yaml
download:
  enabled: true
  fileUrl: "https://example.com/placeholder.pdf"
  formRef:
    - "phonics-teacher-form-v1"   # ← intentional array
```

#### D2 — `formRef` is object

```yaml
download:
  enabled: true
  fileUrl: "https://example.com/placeholder.pdf"
  formRef:
    formId: "phonics-teacher-form-v1"   # ← intentional object
```

#### E1 — `formRef` is empty string（policy-conditional）

```yaml
download:
  enabled: true
  fileUrl: "https://example.com/placeholder.pdf"
  formRef: ""   # ← intentional empty
```

#### E2 — `formRef` whitespace-only string（policy-conditional）

```yaml
download:
  enabled: true
  fileUrl: "https://example.com/placeholder.pdf"
  formRef: "   "   # ← intentional whitespace-only
```

### 5.3 為什麼每個 fixture 都填了 `fileUrl: "https://example.com/placeholder.pdf"` 與 `seo.indexing: "noindex-follow"`

避免 fixture 同時觸發 D1（fileUrl 空）與 S（download 無 noindex），讓**單一 fixture 命中單一目標 warning**，便於 acceptance cross-check「+1 post +1 warning」之 delta 表達式。**不是真實 URL**，僅為 placeholder（D3 因為以 `https://` 開頭 → 不觸發 invalid-format）。

### 5.4 fixture 之間是否互斥（重要）

| pair | 互斥邏輯 | 結論 |
|------|----------|------|
| A1/A2 vs B1/B2 | `assetRefs` 非 array → 不進入 item loop → B 不應被誤觸 | ✅ 互斥保留：A 觸發時 B 不觸發；B 觸發時 A 不觸發 |
| D1/D2 vs E1/E2 | `formRef` 非 string → 不進入 string trim 檢查 → E 不應被誤觸 | ✅ 互斥保留 |
| B1 vs B2 | `assetRefs[i]` 非 string → invalid-type；string 但 trim 空 → empty | ✅ 互斥（mirror sourceKey 三條互斥鏈） |

> 本互斥約束需由 source phase 之 validator 實作保證；fixture 之 frontmatter shape 已預期此互斥。source 落地前若互斥邏輯有變，本批 expected count 須在 acceptance phase 預寫時調整。

### 5.5 排除於第一批之 fixture（明確 NOT in scope）

- ❌ `assetRefs[]` **not-found** negative（需 source phase 落地 §C 規則 + 接受 empty registry 必觸發語意）→ 留**第二批**。
- ❌ `formRef` **not-found** negative → 留第二批。
- ❌ not-found **positive** case（ref 存在 → 不報）→ 需 non-empty registry overlay（pm-21 §5 Option C），延後至 overlay 機制定案。
- ❌ `download-assetref-duplicate` → 第一批不做（pm-23 §6.1）。
- ❌ `download-assetrefs-empty`（語意層）→ 須先定 formRef-only 豁免；第一批不做（pm-23 §6.1）。
- ❌ `download-fileurl-with-registry-refs`（migration hint）→ 須先 production impact scan；第一批不做。
- ❌ GitHub 對照 fixture → 第一批**不**造；download 內容以 Blogger 為主，blogger 一份即可覆蓋規則邏輯。
- ❌ positive fixture（valid ref 不報 warning）→ 第一批不造；正常 ready download 文章為 0 篇用 ref，無自然 positive 樣本，且 valid-format ref 在空 registry 下會觸發未來 not-found，混淆 fixture 純度。

---

## 6. Warning Rule Naming Proposal

本批 fixture 之 expected warning code **草案**（沿用 §3.1 既有 `download-*` kebab-case prefix；命名仍可在 source phase 微調）：

| 規則層級 | 草案 rule id | 對應 fixture | 命名依據 |
|---------|-------------|------------|----------|
| array 結構（`assetRefs` 本身非 array） | `download-asset-refs-invalid-type` | A1 / A2 | mirror `related-links-not-array`；複數欄位用複數 `asset-refs` |
| item 型別（`assetRefs[i]` 非 string） | `download-asset-ref-invalid-type` | B1 | 單筆 item 用單數 `asset-ref` |
| item empty（`assetRefs[i]` 為 trim 後空字串） | `download-asset-ref-empty` | B2 | mirror `related-links-source-key-empty` |
| string 型別（`formRef` 非 string） | `download-form-ref-invalid-type` | D1 / D2 | 同 item-type pattern |
| string empty（`formRef` 為 trim 後空字串） | `download-form-ref-empty` | E1 / E2 | 同 item-empty pattern |

命名張力：

- pm-23 §4 / §5 草案使用 `download-assetrefs-invalid-type`（無連字符；單詞 `assetrefs`）；本批改用 `download-asset-refs-invalid-type`（連字符；雙詞 `asset-refs`），以對齊既有 kebab-case 慣例（如 `related-links-source-key-not-found`）。
- pm-23 §4.D 使用 `download-formref-*`（單詞）；本批改 `download-form-ref-*`（連字符；雙詞）。
- **命名拍板權留給 source phase。** 本批 expected 草案以「連字符雙詞」呈現；若 source phase 採「無連字符單詞」，本批 fixture 之 expected code 與 fixture filename 同步調整即可，不影響 fixture 本身 frontmatter shape。
- 全部 **warning**（無 error）；與既有 D1/D2/D3/S/registry-shape/duplicate-key 全 warning-only 對齊。

---

## 7. Baseline Impact Estimate

### 7.1 若**第一批全造**（A1, A2, B1, B2, D1, D2, E1, E2 — 8 檔）+ 對應規則同批 source 落地

| 項目 | 變動前 | 變動後 |
|------|--------|--------|
| posts | 42 | **50** |
| warnings | 47 | **55** |
| errors | 0 | 0 |

公式：`42 + 8 = 50` posts；`47 + 8 = 55` warnings（每 fixture 命中 1 warning）。

### 7.2 若**第一批僅造非 policy-conditional 部分**（A1, A2, B1, B2, D1, D2 — 6 檔；E1/E2 延後至 policy 拍板）

| 項目 | 變動前 | 變動後 |
|------|--------|--------|
| posts | 42 | **48** |
| warnings | 47 | **53** |
| errors | 0 | 0 |

### 7.3 為什麼 baseline 會移動

- fixture 與 production posts 同被 `validate-content` 掃描（per 既有 `validate:content` 架構；fixture path = `content/validation-fixtures/{blogger,github}/posts/`）→ 每 fixture +1 post。
- 每 negative fixture 命中 1 condition → +1 warning。
- 8 個 fixture 之間互斥（§5.4）→ 各只貢獻 1 warning（不會交叉觸發既有 D1/D2/D3/S；fixture 已預設 fileUrl + seo.indexing 避免污染）。

### 7.4 為什麼 source phase 前**應先**接受 fixture baseline movement

- 若 source 規則先落地、fixture 後造 → 規則無回歸覆蓋，且 production 0 篇用 ref → validator 規則為 dead rule（pm-23 §6 Option B 之缺陷）。
- 若 fixture 先造、source 後落地 → fixture 之 expected warning 無 rule 命中，validator 反而報「fixture 內 frontmatter 不影響任何 warning」→ posts +8 / warnings +0 → 偏離 §7.1 預期 → acceptance 失敗。
- 故 source + fixture **必須同 phase 落地**（mirror pm-21 §6.1 結論 + am-7 D1+D2 同 phase landing 之前例：am-7 commit 同時加 2 fixture + 2 rule）。
- 本 fixture batch design **預先**把 fixture shape / expected count / filename 固化，使未來 source+fixture 同 phase 之 acceptance 文件可直接引用本表，不再臨時設計。

---

## 8. Deferred Rules — Not-found / Inactive / Registry Cross-check

明確延後（**不**在本批 fixture batch 範圍；亦**不**在第一個 source phase 範圍）：

| 規則 | 為什麼延後 |
|------|-----------|
| `download-asset-ref-not-found` | 需「ref 指向 registry 不存在的 id」之 negative 與「ref 存在 → 不報」之 positive；current registry 為空 → positive 無法以 committed fixture 表達（需 non-empty registry overlay） |
| `download-form-ref-not-found` | 同上 |
| `download-asset-ref-inactive`（若 asset 有 `active: false`） | inactive 標記之 schema 尚未定型；registry 為空無對應 entry |
| `download-form-ref-inactive` | 同上 |
| `download-preview-url-risk`（registry-aware 版本） | 現政策為 docs-only（`docs/20260530-download-fileurl-preview-url-risk-policy.md`）；不在 validator 內做 URL reachability check |
| any registry-aware lookup（require non-empty registry） | 需先決定 overlay 機制（pm-21 §5 Option C）；不應污染 production registry |

延後原因之共同點：

- **current registries are empty**：not-found 在空 registry 下 trivially 必命中（任一非空 ref 皆 not-found），positive case 無法以 committed `.md` fixture 驗證。
- **not-found checks need a controlled non-empty registry or overlay strategy**：本專案目前無「test-only registry overlay」機制；引入此機制屬 source / test harness 級改動，超出本批與第一個 ref source phase 邊界。
- **不應污染 production registry**：若把 fixture-only `assetId` / `formId` 加進 `content/settings/download-assets.json` / `download-forms.json` → 違反 §3.7 治理紅線 + pm-23 §10。
- **不應在 validate-content 內做 reachability check**：preview-url-risk 屬政策建議，且涉及 Google Drive URL 形態判斷（誤判風險高）；validator 不做 HTTP / Drive API 查詢。

---

## 9. Fixture Placement Strategy

### 9.1 未來 fixture **必須**放置於

```
content/validation-fixtures/blogger/posts/
```

理由：

- 沿用既有 5 個 download-related fixtures 之放置慣例（§3.2）。
- download 內容以 Blogger 為主（`blogger-download-template.md` 之 `primaryPlatform: blogger`）。
- 第一批**不**對 `content/validation-fixtures/github/posts/` 補對照 fixture（§5.5）。

### 9.2 必須避免之放置位置（明確紅線）

- ❌ `content/blogger/posts/` / `content/github/posts/`（production posts；fixture 不得污染正式內容區）。
- ❌ 既有 `_test-*.md`（不得改既有 fixture 之 frontmatter；每個新規則用獨立 fixture）。
- ❌ `content/drafts/` / `content/archive/`（草稿區不掃描；fixture 改用 production draft 會違反 loadPosts 過濾語意）。
- ❌ `content/templates/`（template 不掃描；fixture 改 template 會誤導未來新文章）。

### 9.3 必須避免之內容（明確紅線；per CLAUDE.md §3 registry 治理紅線 + pm-23 §10）

- ❌ **真實 Google Form respondent data**（email / 姓名 / 電話 / 學校 / 答覆內容 / Sheet response rows）。
- ❌ **下載者個資**（真實使用者下載記錄）。
- ❌ Google Form 回覆資料**不得**匯入 repo / fixture / Admin。
- ❌ access token / API key / OAuth secret / 帳號 email。
- ❌ private Drive folder ID / 私人 permission。
- ❌ 真實 Drive 連結（fixture 用 `https://example.com/...` placeholder；不指真實檔）。
- ❌ 真實 `assetId` / `formId`（即使是 kebab-case slug）→ 用 `phonics-cards-zip-v1` / `phonics-teacher-form-v1` 等**示意 slug**；不暗示對應任何真實 asset/form/file。

### 9.4 fixture **filename prefix** 必須以 `_test-` 開頭

承接既有慣例（57 fixture 全部 `_test-` 前綴；pm-21 §8.2）。本批草案 filename 全部 `_test-download-*`，與既有 `_test-download-enabled-fileurl-empty.md` 等命名一致。

---

## 10. Recommended Future Implementation Sequence

| 階段 | 性質 | 是否需 user 明示 | 動 baseline |
|------|------|------------------|-------------|
| **A.** 本文件 acceptance read-only cross-check | read-only | 保守可自動 | ❌ 0 |
| **B.** 本批 fixture batch design 後**再做一次** read-only acceptance（驗收本 docs commit） | read-only | 保守可自動 | ❌ 0 |
| **C.** explicit user approval 才**新增 fixtures**（fixture creation phase） | 動 content | ✅ **必須** user 明示 | ✅ +N posts |
| **D.** read-only acceptance of **fixture baseline movement**（驗收 fixture commit 之 expected delta） | read-only | 保守可自動 | ❌ 0（驗收期不再動） |
| **E.** explicit user approval 才做 **validate-content source implementation** | 動 source | ✅ **必須** user 明示 | ⚠ 需與 fixture 同 phase 落地以避免 dead rule |
| **F.** source implementation acceptance（cross-check `validate:content` 實測 vs expected baseline） | read-only | 保守可自動 | ❌ 0 |
| **G.** registry-aware rules（not-found / inactive / overlay）**deferred** | — | — | — |

### 10.1 為什麼要 A→B 兩次 read-only

- A：驗收本 docs 之**內部一致性**（檔名草案、§4 欄位描述、§5 fixture 表、§6 命名提案、§7 baseline 數字、§8 延後清單、§9 放置紅線、§10 sequence）。
- B：在進 C（fixture creation）前**再次** read-only cross-check baseline + working tree，避免在已 drift 的 baseline 上 commit fixture。
- A 與 B 之間若有 user 對命名 / fixture 範圍之調整 → 本 docs 可由獨立 docs-only edit phase 修訂；不直接進 C。

### 10.2 為什麼 C 與 E **應同 phase 落地**

- 若 C（fixture）先 commit 而 E（source）未 commit → fixture 內 frontmatter 不觸發任何規則 → posts +N / warnings +0 → 偏離本 docs §7.1 預期 → acceptance 失敗。
- 若 E（source）先 commit 而 C（fixture）未 commit → 規則無回歸覆蓋；且 production 0 篇用 ref → validator 規則為 dead rule。
- 故 **C + E 必須同 phase 落地**（fixture + source 同 commit 或同 phase 多 commit），mirror am-7（D1+D2 + 2 fixtures 同 phase）前例。
- 本 docs §7.1 / §7.2 已預寫**兩種 batch 規模**之 expected baseline，便於 C+E phase 之 acceptance 引用。

### 10.3 為什麼 G 延後

- 詳見 §8。
- G 之 source phase 必須等：(a) registry overlay 機制決策 → (b) overlay mechanism preanalysis docs-only → (c) overlay source + non-empty fixture registry → (d) not-found rule source。
- 任何試圖在 C/E 階段同步推進 G 之意圖 → 違反本 docs 之保守 cadence；明確拒絕。

---

## 11. Risk Matrix

| 風險 | 描述 | 緩解 |
|------|------|------|
| **warning baseline drift（未預期）** | source / fixture phase 之 acceptance 文件未預寫 expected delta → `validate:content` 實測 vs expected 不符 | §7.1 / §7.2 預寫 8-檔 / 6-檔兩種 expected baseline；C+E phase acceptance 必須引用其一並 cross-check |
| **production registry pollution** | 為造 positive fixture 而把 `phonics-cards-zip-v1` 寫進 `content/settings/download-assets.json` | §9.3 + pm-23 §10 + CLAUDE.md §3 紅線；本批 positive case **延後** |
| **fixture overfitting**（fixture 形態固化過早 → 規則微調時 fixture 大量改名） | §6 命名草案在 source phase 拍板；本 docs 已標示「命名可微調」 | §6 命名拍板權留 source phase；fixture filename 與 expected code 同步調整即可 |
| **premature source implementation**（在 fixture 未造前 source 落地 → dead rule） | source 命中 0 次（production 無 ref + fixture 未造） | §10.2 強制 C+E 同 phase 落地 |
| **mixing legacy fileUrl with new reference model**（既有 fileUrl 文章誤被新規則命中） | 本批所有規則只檢查 `assetRefs` / `formRef`，**不**碰 fileUrl；既有 D1/D2/D3/S 計數不變 | §5.3 + pm-23 §4.G + §6.1；coexistence 規則延後至 migration phase |
| **accidentally importing respondent data** | 真實 Google Form / Drive 內容洩漏入 repo | §9.3 紅線；fixture 使用 `https://example.com/...` placeholder + 示意 slug |
| **reverse UTM / pm-26 unrelated activation** | 本 docs 落地過程意外觸動 deploy gate | §1 / §13 明確聲明 dormant；本 docs commit 不碰 Blogger / GA4 / dist / gh-pages |
| **github 對照 fixture 衝動**（誤以為「規則不分站」需證明 → 多造一倍 fixture） | post count 翻倍 / 邊際價值低 | §5.5 明確排除；blogger 一份覆蓋規則邏輯已足夠 |
| **fixture creation phase 之 commit 同時改 docs** | fixture + docs 混 commit → 難審查 | C phase 之 commit 範圍**僅** `content/validation-fixtures/blogger/posts/_test-download-*.md` + validator source；docs 若需更新另起 docs-only phase |

---

## 12. Non-goals / Red Lines

本 phase **明確不做**：

- ❌ no source implementation（不改 `src/scripts/validate-content.js`；不改 `src/scripts/load-settings.js`；不改 `src/` 任何檔）。
- ❌ no fixture creation（不新增 / 不修改 / 不刪除 `content/validation-fixtures/**` 任一檔）。
- ❌ no registry mutation（不改 `content/settings/download-assets.json` / `download-forms.json`；不引入 test-only registry overlay）。
- ❌ no content migration（不遷 `download.fileUrl` → `assetRefs[]` / `formRef`；不改 `content/blogger/posts/**` / `content/github/posts/**`）。
- ❌ no build / deploy（不 `npm run build:*`；不 push gh-pages；不改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`）。
- ❌ no Blogger repost（不碰 Blogger 後台；不改既有貼上之 post.html）。
- ❌ no GA4 validation（不做 GA4 Realtime / DebugView；不啟動 reverse UTM live）。
- ❌ no Admin picker / renderer / landing page implementation。
- ❌ no Admin Apply / middleware write route / `admin-write-cli` dry-run / apply。
- ❌ no reverse UTM activation（remains landed but dormant）。
- ❌ no pm-26 unblock（remains BLOCKED）。
- ❌ no template change（不改 `content/templates/blogger-download-template.md`；不引入 `assetRefs[]` / `formRef` 於 template）。
- ❌ no schema docs change（不改 `docs/publish-bundle.md` / `docs/related-links-schema.md` / `docs/book-schema.md` 等既有 schema docs；schema 追加屬獨立 schema/migration preanalysis）。
- ❌ no `npm install`（不動 `package.json` / `package-lock.json`）。
- ❌ no rebase / amend / force-push（本 docs commit 為新增 commit，push 至 origin/main fast-forward only）。

---

## 13. Final Recommendation

- **本 docs 後是否要直接 fixture creation**：**否**（預設）。fixture creation 屬 §10 C 階段，需 user 明示。
- **本 docs 後是否要直接 source implementation**：**否**（預設）。source 屬 §10 E 階段，需 user 明示，且須與 C 同 phase 落地。
- **下一步是 acceptance 還是 freeze**：預設 **Final Idle Freeze / EXIT**；若需保守驗收，下一步為 **read-only acceptance cross-check**（驗收本 docs commit；不改任何檔）。
- **若未來要進 C+E phase，最小安全 batch 是什麼**：**§7.2 之 6-檔批**（A1, A2, B1, B2, D1, D2；對應 4 條草案 rule：`download-asset-refs-invalid-type` / `download-asset-ref-invalid-type` / `download-asset-ref-empty` / `download-form-ref-invalid-type`），預期 baseline `0/47/42 → 0/53/48`。E1/E2 之 `download-form-ref-empty` 待 empty-string-policy 拍板再決定是否同批落地（若同批 → 改回 §7.1 之 8-檔批 `0/47/42 → 0/55/50`）。
- **預設結論**：**Final Idle Freeze / EXIT**；不自動啟動下一 phase；下一階段建議僅做 read-only acceptance cross-check 驗收此 docs commit；不進 fixture creation 或 source implementation。

---

（本文件結束）
