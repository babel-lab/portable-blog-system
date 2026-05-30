# 20260530 Download Validation Warning Source Implementation Preanalysis

> Phase: `20260530-am-5-download-validation-warning-source-implementation-preanalysis-docs-only-a`
> Date: 2026-05-30 08:20 +0800
> Scope: **docs-only**（無 source / content / settings / templates / package / dist / gh-pages 變更）

---

## 1. Executive Summary

- 本 phase 是 **docs-only source implementation preanalysis**：
  - ❌ 不實作 validator（`src/scripts/validate-content.js` 一行不動）
  - ❌ 不新增 fixture（`content/validation-fixtures/` 不動）
  - ❌ 不改 content / settings / templates / package
  - ❌ 不 build / deploy / Blogger repost / GA4 validate / reverse UTM activate / pm-26 unblock
  - ❌ 不建立 settings registry；不建立 download landing page source
- 目標：在進入「download validation 規則之 source implementation」前，**先把實作面之決策固化**：
  1. **D1 / D2 / D3 / S1 / S2 哪些可以先做？** —— per §5 / §12 matrix
  2. **哪些必須等 registry / landing page source？** —— per §6
  3. **warning id 應如何接入既有 `validate-content.js` pattern？** —— per §7 / §9
  4. **fixture 應放在哪裡、如何命名、baseline 會如何變？** —— per §10
  5. **source implementation 應分幾個 phase，不要一次混做太多？** —— per §12
- 本文件**不改**前兩份 docs（`docs/20260530-download-validation-rules-preanalysis.md` / `docs/20260530-download-validation-warning-fixture-design-preanalysis.md`）之 D1 / D2 / D3 / D4 / S1 / S2 / F1 / F2 / A1 / A2 / A3 語意；**不**重新命名規則、**不**重新分類，僅做 implementation planning。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔。

---

## 2. Baseline Snapshot

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `bdd08f29a7b6097cf202dd21427ad82c31a2ea2e` |
| origin/main | `bdd08f29a7b6097cf202dd21427ad82c31a2ea2e` |
| short hash | `bdd08f2` |
| latest subject | `docs(download): plan validation warning fixture design` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`，無 untracked） |
| `validate:content` | **0 error(s) / 42 warning(s) on 37 post(s)** |

> 42 warnings 全屬 `content/validation-fixtures/`（validator 預期錯誤樣本，by design）。Baseline 與 phase 起始預期完全相符。

本 phase 落地後預期 baseline 不變（純新增一份 docs 檔；無 content / source / fixture 改動）。

---

## 3. Source / Fixture Pattern Review

read-only 讀取 `src/scripts/validate-content.js` + `content/validation-fixtures/` + `package.json` 之要點如下。**本文件不引用實作細節到須鎖死之程度**；僅整理 implementation 必須對齊之 pattern。

### 3.1 validator 既有 warning 結構

`validate-content.js` 以 `issues` 陣列承載 issue object，每筆統一形狀：

```text
{
  severity: 'warning' | 'error',
  type:     '<kebab-case-id>',
  sourcePath,           // 由 caller 已附在 post object 上之檔案絕對路徑
  value?:   <string>,   // 可選；承載作者輸入之違規值或描述句
  site?:    <string>,   // 僅 category/tag-site-mismatch 等規則使用
}
```

- `severity` 由 `validateContent()` 內 `errors` / `warnings` 兩個 filter 區分；對外輸出之 `errorCount` / `warningCount` 由此衍生。
- 既有 warning 之 `type` 全為 kebab-case；前綴採用「domain-noun-狀態」風格，例如：
  - `book-mediatype-invalid` / `book-volume-invalid-type` / `book-authors-entry-empty`
  - `series-id-not-in-settings` / `series-number-duplicate` / `series-block-missing-number`
  - `related-links-not-array` / `related-links-entry-missing-kind` / `related-links-source-key-not-found`
  - `invalid-canonical` / `invalid-content-kind` / `invalid-seo-block` / `invalid-seo-indexing`
  - `missing-description` / `missing-category` / `missing-cover` / `empty-tags`
- console renderer（`printIssues()`）格式：`[validate-content]   - [<SEV>] <type><value-suffix><site-suffix>`；`value` 直接拼到 type 後（以 `: ` 連接）。
- 觸發範圍：
  - ERROR 規則（`invalid-status` / `missing-title` / `missing-slug` / `missing-date` / `invalid-date-format` / `duplicate-slug`）：見 `validate-content.js` 內既有判斷。
  - WARNING 規則：絕大多數限定 `READY_STATUS = new Set(['ready', 'published'])`；少數（如 category / tag site-mismatch、promotion.facebook、sidecar overlap）對所有 status 觸發。
- 計數 pattern：
  - issue 一律 push 進統一 `issues`，最後分流 `errors` / `warnings`，再算 `errorCount` / `warningCount`。
  - cross-post 規則（`duplicate-slug` / `series-number-duplicate`）採「全集合掃描後再對每筆衝突文件 push 一條 warning」之 pattern。

### 3.2 fixture 命名與目錄 pattern

- 位置：`content/validation-fixtures/{blogger|github}/posts/_test-*.md`
  - blogger 端共 24 個 fixture（含 SEO / book / related-links / source-key 等系列）
  - github 端共 29 個 fixture（含 series / fb / seo-indexing 等系列）
- 命名公式：`_test-<warning-id-or-descriptor>.md`，與目標 warning id 對齊一字。
  - 例：`_test-book-mediatype-invalid.md` → 觸發 `book-mediatype-invalid`
  - 例：`_test-related-links-not-array.md` → 觸發 `related-links-not-array`
- frontmatter 最小集（mirror `_test-book-mediatype-invalid.md`）：
  - `title: "[validation-fixture] <descriptor>"`
  - `slug: "test-<kebab-id>"`
  - `status: "ready"` / `draft: false`
  - `date`、`description`、`contentKind`、`site`、`primaryPlatform`、`category`、`tags`、`cover: "/images/placeholders/cover.png"`
  - 規則特定欄位（如 `book.mediaType: "ebook"`、`download.fileUrl: ""`）放在最後。
- body：1–3 行說明本 fixture 故意觸發何條 warning，並聲明本檔位於 validation-fixtures 目錄、不會被 build:* 掃到。
- baseline 觀察：目前 42 warnings 全來自 fixture；37 posts 含正式 content + fixtures。每加 1 個 negative fixture 預計 +1 post + +1 warning（與規則一一對應）。

### 3.3 package.json 中之 validate script

- `"validate:content": "node src/scripts/validate-content.js"`
- main 模式（`process.argv[1]` 命中時）載入 `github` / `blogger` + `validation-fixtures/github` / `validation-fixtures/blogger` 之 posts，呼叫 `validateContent({ posts, settings })`，再 `printIssues()`。
- 退出語意：`errorCount > 0 → process.exit(1)`；warning-only 與無 issue 皆退出 0。

### 3.4 既有 warning id 命名風格小結（用於本系列規則對齊）

| 觀察點 | 既有慣例 | 本系列規則應遵循 |
|--------|----------|------------------|
| 字元 | kebab-case，全小寫 | ✅ |
| 前綴 | domain-noun（如 `book-` / `series-` / `related-links-` / `promotion-` / `fb-` / `download-`） | ✅ 用 `download-` 前綴 |
| 嚴重性前綴 | **不**用 `error-` / `warn-` 前綴；severity 由 object 欄位承載 | ✅ |
| value 內容 | 承載違規實際值或一句英文描述；中文解釋只在 docs / commit | ✅ |
| sourcePath | 自動附在每筆 issue；不需在 id / value 內重複 | ✅ |

---

## 4. Prior Docs Alignment

本文件與前兩份 docs 之關係：

| 文件 | 角色 | 本文件與其關係 |
|------|------|----------------|
| `docs/20260530-download-validation-rules-preanalysis.md`（am-1） | rule candidate inventory；定 D1 / D2 / D3 / D4 / S1 / S2 / F1 / F2 / A1 / A2 / A3 之命名與分類 | **遵循；不改名、不改分類、不改 severity 建議。** 本文件僅在「implementation 順序 / 觸發點 / fixture」層面深化。 |
| `docs/20260530-download-validation-warning-fixture-design-preanalysis.md`（am-3） | warning message copy / fixture 策略 / outstanding decisions / rollout order | **遵循；不改 §6 warning id / message 草案、不改 §8 fixture 策略、不改 §11 rollout order。** 本文件對 §11 step 3 之 source implementation 再細化（拆 D1/D2 與 D3/S1/S2）。 |

確認本文件 **不改** D1 / D2 / D3 / D4 / S1 / S2 / F1 / F2 / A1 / A2 / A3 之語意，只做 source implementation planning。outstanding decisions（D1 觸發範圍、D3 相對路徑、S1/S2 合併、A2 純表單流）保留至各規則之 implementation phase 同步裁決，本文件**不**裁決。

---

## 5. Implementable Rule Set for First Source Phase

評估「第一個 source implementation phase **最多**可以包含哪些規則」。原則：保守、additive、baseline 影響可預測、source 與 fixture 同 PR 落地（Option B per fixture-design §9.1）。

### 5.1 候選規則逐一評估

| Rule | can implement now? | source dep | content dep | registry dep | risk | test fixture required? | baseline impact 推估 | recommended phase |
|------|--------------------|-----------|-------------|--------------|------|------------------------|---------------------|------------------|
| **D1** `download-enabled-fileurl-empty` | ✅ 可 | 無；純 frontmatter 讀 `contentKind` / `download.enabled` / `download.fileUrl` | 無；既有 draft download 文章 `download.fileUrl=""` 但 status=draft，ready/published-only 規則不觸發 | 無 | 🟢 低；既有 CLAUDE.md §13 已預告應警告，補上即「補設計意圖」 | 🟢 是（1 個 negative：ready + enabled + 空 fileUrl） | ready/published only（選項 A）：**+0** 來自正式 content；**+1** 來自新 fixture | **am-7 minimal validator 第一階段（強烈推薦）** |
| **D2** `download-fileurl-invalid-type` | ✅ 可 | 無；型別檢查（非 string） | 無 | 無 | 🟢 低；mirror `book-volume-invalid-type` 既有 pattern | 🟢 是（1 個 negative：fileUrl 設為 number / null） | **+1**（新 fixture） | **am-7 第一階段（推薦與 D1 同 PR）** |
| **D3** `download-fileurl-invalid-format` | 🟡 半可 | 無；regex 檢查 | 無 | 無；但 outstanding decision「是否允許相對路徑」未裁決 → 影響 regex 範圍 | 🟡 中；regex 太嚴（如只接 `^https?://`）會誤殺未來合法相對路徑；regex 太寬會喪失提示力 | 🟢 是（1 個 negative：fileUrl 為 `"not-a-url"`） | **+1**（新 fixture） | **am-9 第二階段或更後**（待相對路徑裁決） |
| **S1** `download-content-should-be-noindex` | 🟡 半可 | 無；frontmatter 檢查 `contentKind` × `seo.indexing` | 🟡 既有 draft download fixture `seo.indexing` 未顯式設；因屬 draft 不觸發 ready/published-only 規則 → 不會誤觸正式 content；但若未來有 ready download 文章未顯式設 indexing，會多 1 warning | 無；但 outstanding decision「S1 / S2 是否合併」未裁決 | 🟡 中；需確保 S1 不誤觸 build-github / build-sitemap 既有 fallback 已 cover 之情境 | 🟢 是（1 個 negative：ready + download + seo.indexing 未設） | **+1**（新 fixture）；如未來有 ready download 正式文章未顯式 indexing 亦會多 1（屬 expected） | **am-9 第二階段（與 D3 一同評估）** |
| **S2** `download-content-marked-index`（若獨立於 S1） | 🟡 半可 | 同 S1 | 同 S1 | 同 S1（S1/S2 合併與否未裁決） | 🟡 中；同 S1 | 🟢 是（1 個 negative：ready + download + seo.indexing=index）| **+1**（若獨立規則 / 獨立 fixture） | **am-9 第二階段（與 S1 同 PR）** |

### 5.2 第一階段建議組合（強烈推薦）

**am-7 minimal validator source implementation 僅含 D1 + D2。**

理由：
- D1 / D2 皆**無 outstanding decision**（D1 觸發範圍已建議「選項 A：ready/published only」；D2 純型別檢查）。
- D1 對既有 draft download 文章不觸發（status=draft），對 template 不觸發（template 非 .md post，不被 loadPosts 掃）。
- D2 對既有 content 不觸發（無已知 download.fileUrl 非字串案例）。
- baseline 變動可控：source 加 2 條 rule + 2 個 negative fixture → baseline `42 → 44`、`37 → 39 posts`，預期變動 100% 可預測。
- D3 / S1 / S2 之 outstanding decision（相對路徑允許性、S1/S2 合併、SEO fallback 互動）會干擾 D1/D2 之 review focus；分開能讓每個 PR 之 baseline 變動原因單一、reviewer 易於核對。

### 5.3 第二階段建議組合

**am-9 D3 / S1 / S2 decision docs-only or implementation**：先把 outstanding decisions 在 docs 裁決（可能本身為一份 read-only / docs-only sub-phase），再決定是否同 PR 落地 D3 / S1 / S2 source + fixture。

---

## 6. Deferred Rule Set

| Rule | deferred reason |
|------|-----------------|
| **D4** `download-fileurl-reachability-not-checked` | **非規則**；屬 governance 宣告。validator 永遠不做網路 reachability check（per fixture-design §7.4 / rules §3 D4）。若未來要做 reachability，屬獨立 `check:links` / `check:images` 之 pipeline，與 `validate-content` 解耦。本系列 source implementation 任何階段皆**不**承擔 D4。 |
| **F1** `download-formref-missing` | **registry-dependent**：`formRef` 欄位 schema 未定義；FormConfig registry file 未建立；`loadSettings()` 未串接。必須等 registry gate（per rules §6）全部滿足才可實作。 |
| **F2** `download-formref-not-found` | 同 F1；ref-resolution 類規則需要 registry lookup。 |
| **A1** `download-assetrefs-invalid-type` | **registry-dependent**：`assetRefs[]` 欄位 schema 未定義；即使型別檢查不需 lookup，新增 fixture 與 frontmatter 欄位定義仍需 schema 接受才合理落地。 |
| **A2** `download-assetrefs-empty` | 同 A1 + outstanding decision「是否允許純表單流（無 asset）」未裁決。 |
| **A3** `download-assetref-not-found` | 同 F2；DownloadAsset registry lookup 必須先存在。 |
| **任何 registry / landing page source dependent 規則** | per `docs/20260529-download-landing-page-schema-preanalysis.md` / `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md`：registry schema 未定稿；hybrid Option D 落地路徑未啟動。本系列 source implementation 任何階段皆**不**承擔。 |

---

## 7. Proposed Validator Insertion Points

本節為 implementation 階段之 pseudo-flow 草案；**不**寫完整 code、**不**動 source。實作 phase（am-7 起）再依此 pseudo 與既有 validator pattern 寫實際 code。

### 7.1 D1 / D2 / D3（fileUrl 結構檢查）

**位置建議**：`validateContent()` 內 `for (const post of posts)` 主迴圈內。

**觸發範圍**：
- D1：limited to `READY_STATUS`（`ready` / `published`）內；mirror 既有 `missing-description` / `missing-category` 等 SEO 必填規則之 pattern。
- D2 / D3：所有 status 皆檢查（型別 / 格式錯誤本身與 status 無關；mirror `book-volume-invalid-type` / `invalid-canonical` 既有 pattern）。

**pseudo flow**（D1 / D2 / D3 共用前置判斷）：

```text
讀 post.contentKind
讀 post.download（可能 undefined / null / 非 plain object → 直接跳過全系列）
若 post.download 為 plain object：
  讀 download.fileUrl
  讀 download.enabled

D2（所有 status）：
  若 download.fileUrl !== undefined 且 typeof !== 'string' →
    push { severity: 'warning', type: 'download-fileurl-invalid-type', sourcePath,
           value: `typeof=${typeof download.fileUrl}` }

D3（所有 status；條件：fileUrl 為 non-empty trimmed string）：
  若 typeof download.fileUrl === 'string' 且 trim !== '' 且 不符 regex →
    push { severity: 'warning', type: 'download-fileurl-invalid-format', sourcePath,
           value: `download.fileUrl="${url}" is not a valid http(s) URL` }

D1（僅 READY_STATUS）：
  if status ∈ READY_STATUS 且 contentKind === 'download' 且 download.enabled === true 且 fileUrl 為空 / 非字串 →
    push { severity: 'warning', type: 'download-enabled-fileurl-empty', sourcePath,
           value: `download.enabled=true but download.fileUrl is empty (typeof=${typeof fileUrl})` }
```

### 7.2 S1 / S2（SEO consistency 提示）

**位置建議**：`validateContent()` 內 `for (const post of posts)` 主迴圈內、`if (READY_STATUS.has(status))` 區塊內，**位於既有 `invalid-seo-indexing` 判斷之後**（既有判斷已守 `seo` 為 plain object 並擋掉 `seo.indexing` 型別錯誤）。

**前置守門**：
- 必要：`contentKind === 'download'`。
- 既有 `invalid-seo-indexing` 已 cover「`seo` 存在且 plain object 且 `seo.indexing` 為非合法 string / 列舉外值」之檢查；S1 / S2 不重複觸發此情境（若 `seo.indexing` invalid，S1 / S2 都不應再 push，避免噪音）。

**pseudo flow**（S1 / S2，假設不合併）：

```text
if status ∈ READY_STATUS 且 contentKind === 'download':
  let indexing = post.seo?.indexing  (undefined-safe)
  // 若既有 invalid-seo-block / invalid-seo-indexing 已觸發 → skip 本系列
  if indexing 不為合法列舉值（含 undefined / 列舉外值），且不會被既有規則 cover：
    // 註：indexing === undefined → 既有規則不觸發 → 本系列負責
    if indexing === undefined →
      push S1（warning, type: 'download-content-should-be-noindex',
              value: 'contentKind=download but seo.indexing not explicitly set (fallback noindex-follow applies)')
    else if indexing === 'index' →
      push S2（warning, type: 'download-content-marked-index',
              value: 'contentKind=download but seo.indexing="index" (download content should not be a search entry point)')
```

### 7.3 如何避免 duplicate warning

- 每條 rule 在同一 post 內最多 push 1 條（D1 / D2 / D3 各自獨立；D2 / D3 互斥：型別錯則不再檢格式）。
- S1 / S2 互斥（同 post 只會走其中一個分支）。
- 若 `download` 區塊非 plain object（null / array / 非 object），所有 D1 / D2 / D3 規則一律跳過（不新增 `download-not-object` 規則；本批不擴張規則面）。
- S1 / S2 與既有 `invalid-seo-block` / `invalid-seo-indexing` 採「既有規則優先」策略：當既有規則已觸發 → 不再 push S1 / S2，避免噪音重複。

### 7.4 如何避免 formal content 被意外放大 warning

- D1 限定 ready/published → 既有 draft download 文章不觸發。
- D2 / D3 對所有 status 但條件嚴：D2 須 `fileUrl !== undefined && typeof !== 'string'`；D3 須 `non-empty trimmed string` → 既有 `fileUrl: ""` 不觸發 D3。
- S1 / S2 限定 ready/published → 既有 draft download 文章不觸發；template 不被 loadPosts 掃。
- 所有新規則於落地 commit 前須以**實際 baseline 比對**（落地 PR 須 run `validate:content`，並在 commit message 明示 baseline 變動）。

---

## 8. Proposed Field Path and Data Shape

| 欄位 | 是否已存在 frontmatter / template | 來源 | 是否確定 | 本系列 validator 應如何處理 |
|------|--------------------------------|------|---------|--------------------------------|
| `contentKind` | ✅ 已存在（template / post / validate-content.js VALID_CONTENT_KIND 含 `download`） | `.md` frontmatter | ✅ 確定 | D1 / S1 / S2 須讀 |
| `download.enabled` | ✅ 已存在（template + 既有 draft post 皆有） | `.md` frontmatter | ✅ 確定 | D1 須讀 |
| `download.fileUrl` | ✅ 已存在（template + 既有 draft post 皆為空字串） | `.md` frontmatter | ✅ 確定 | D1 / D2 / D3 須讀 |
| `download.title` / `download.description` / `download.fileType` / `download.licenseNote` | ✅ 已存在 | `.md` frontmatter | ✅ 確定 | 本系列**不**檢查（屬 future scope；本 phase 不擴張規則面） |
| `seo.indexing` | ✅ 已存在 schema（validate-content.js VALID_SEO_INDEXING） | `.md` frontmatter | ✅ 確定 | S1 / S2 須讀 |
| `seo`（整個 block） | ✅ 已存在 schema | `.md` frontmatter | ✅ 確定 | S1 / S2 前置守門：need plain object 或 undefined 才走本系列 |
| `status` | ✅ 已存在（VALID_STATUS） | `.md` frontmatter | ✅ 確定 | D1 / S1 / S2 須讀（限定 READY_STATUS） |
| `publishTargets.github.enabled` / `publishTargets.blogger.enabled` | ✅ 已存在 | `.md` frontmatter | ✅ 確定 | 本系列**不**檢查（D1 / D2 / D3 / S1 / S2 不依賴 publish target；屬 future scope） |
| `searchDescription` | ✅ 已存在 | `.md` frontmatter | ✅ 確定 | 本系列**不**檢查 |
| `draft` | ✅ 已存在；通常與 status 配對 | `.md` frontmatter | ✅ 確定 | 本系列**不**直接讀（loadPosts 已過濾 draft；本系列以 status 為準） |
| `formRef` | ❌ 尚未定義 | n/a | ❌ needs-confirmation（registry gate 後） | F1 / F2 deferred |
| `assetRefs[]` | ❌ 尚未定義 | n/a | ❌ needs-confirmation（registry gate 後） | A1 / A2 / A3 deferred |

確認結論：D1 / D2 / D3 / S1 / S2 須讀之 frontmatter 欄位**全部已存在**於現有 template 與 post，無 needs-confirmation 項目；可直接於 implementation phase 落地，不需先做 schema docs 變更。

---

## 9. Warning ID Integration Plan

### 9.1 候選 warning id 清單

| Rule | warning id | 對齊既有 pattern | 對齊已存在規則命名 |
|------|-----------|-----------------|------------------|
| D1 | `download-enabled-fileurl-empty` | ✅ `download-` 前綴；kebab-case | mirror `book-issue-without-magazine-mediatype` 之「描述條件」風格 |
| D2 | `download-fileurl-invalid-type` | ✅ | mirror `book-volume-invalid-type` / `book-published-year-invalid-type` |
| D3 | `download-fileurl-invalid-format` | ✅ | mirror `invalid-canonical`（格式檢查；但加 `download-` 前綴保持 namespace 清楚） |
| S1 | `download-content-should-be-noindex` | ✅ | 新 pattern；採提示型句法（`should-be-*`），與既有 `should-` 風格雖無前例但語意明確；可在 implementation 階段 review 是否改用 `download-seo-indexing-not-explicit` 之較中性命名 |
| S2 | `download-content-marked-index` | ✅ | 同 S1；可考慮合併為 S1（per outstanding decision） |

### 9.2 對齊既有 warning 結構

- `type` / `severity` / `sourcePath` 欄位完全沿用 `src/scripts/validate-content.js` 既有 issue object shape；不引入新欄位。
- 不新增 `field` 欄位（既有 warning 把欄位資訊放在 `value` 字串內；新規則沿用此 pattern）。
- 不新增 `remediation` 欄位（remediation hint 放在 docs / commit message / future console renderer enhancement；本系列**不**改 renderer）。

### 9.3 message copy 來源

- 沿用 `docs/20260530-download-validation-warning-fixture-design-preanalysis.md` §6 提出之 message 草案；本文件不重訂。
- 實際 `value` 字串於 implementation phase 之 PR 內最終定稿；本文件**不**鎖死字串。

### 9.4 remediation hint 處理

- **本 phase 與 implementation phase 皆不實作 remediation hint 之 console 輸出**。
- remediation hint 維持 docs-only（前 docs 已寫；本 docs 不重複）。
- 未來若要把 hint 印到 console，屬獨立 console renderer enhancement phase，與本系列 source implementation 解耦。

### 9.5 output 是否包含 sourcePath / title / field path

| 欄位 | 是否包含 | 來源 |
|------|---------|------|
| `sourcePath` | ✅ 包含 | 沿用既有 validator pattern（每筆 issue 自動附） |
| `title` | ❌ 不包含 | 既有所有 warning 皆未在 issue object 帶 title；console renderer 也不印 title。本系列保持一致。 |
| field path（如 `download.fileUrl` / `seo.indexing`） | 🟡 隱含於 `value` 字串內 | mirror `book-volume-invalid-type` 之 `value: "...book.volume..."` pattern；不新增 `field` 欄位 |

---

## 10. Fixture Implementation Plan

> **本 phase 不新增任何 fixture**。本節僅為**未來** fixture-add（與 source 同 PR 落地）之預先記錄。

### 10.1 fixture 路徑建議

- `content/validation-fixtures/blogger/posts/_test-download-*.md`
  - 理由：既有 download template / draft post 皆 `site: "blogger"`；fixture 與 production content 之 site 配對一致，方便未來 cross-platform 規則 review。
- 不放 `content/validation-fixtures/github/posts/`，除非未來新增「GitHub-side download 文章」之語境。

### 10.2 filename 建議

| Rule | filename 建議 |
|------|---------------|
| D1 | `_test-download-enabled-fileurl-empty.md` |
| D2 | `_test-download-fileurl-invalid-type.md` |
| D3 | `_test-download-fileurl-invalid-format.md` |
| S1 | `_test-download-content-no-seo-indexing.md`（或 `_test-download-content-should-be-noindex.md`） |
| S2 | `_test-download-content-marked-index.md` |

### 10.3 positive / negative fixture 最小集合

- **每個 rule 對應 1 個 negative fixture**（觸發該 warning）。
- **不**為每個 rule 另建 positive fixture：
  - 既有 draft download post（`20260529-phonics-practice-sheet-download.md`）為「draft + enabled=true + 空 fileUrl」之 implicit positive（draft → ready/published-only 規則不觸發）。
  - 一般有效字串 fileUrl 屬未來 ready download 文章之 implicit positive。
  - 與既有 `book-*` / `related-links-*` fixture 之策略一致（既有大多只放 negative，不為合法情境另建 positive）。

### 10.4 每個 fixture 預期觸發哪些 warning

| Fixture | 觸發 warning |
|---------|------------|
| `_test-download-enabled-fileurl-empty.md` | D1 → `download-enabled-fileurl-empty` |
| `_test-download-fileurl-invalid-type.md` | D2 → `download-fileurl-invalid-type` |
| `_test-download-fileurl-invalid-format.md` | D3 → `download-fileurl-invalid-format` |
| `_test-download-content-no-seo-indexing.md` | S1 → `download-content-should-be-noindex` |
| `_test-download-content-marked-index.md` | S2 → `download-content-marked-index` |

### 10.5 posts count 是否增加 / warning count 是否增加 / baseline 預期變化

| 落地組合 | posts count 變化 | warning count 變化 | baseline 預期 |
|---------|------------------|-------------------|---------------|
| 本 phase（純 docs） | +0 | +0 | 37 / 42 不變 |
| am-7（D1 + D2 + 2 fixtures） | +2 | +2 | **39 / 44** |
| am-9（D3 + S1 + S2 + 3 fixtures）| +3 | +3 | 若 am-7 已落地：**42 / 47**；若 S1/S2 合併為一條 + 1 fixture：**41 / 46** |
| 全部落地（D1+D2+D3+S1+S2） | +5（或 +4 若 S1/S2 合併） | +5（或 +4） | **42 / 47**（或 **41 / 46**） |

### 10.6 是否需要一次落地 source + fixture，避免 source-only 無回歸保護

✅ **是。每個規則之 source 與其 negative fixture 必須同 PR 落地**（Option B per fixture-design §9.1）。

理由：
- source-only 無 fixture → 未來 regression（rule 退化）無法被 `validate:content` 接住；違反「fixture 即 regression test」之既有 cadence。
- fixture-only 無 source → fixture 不會觸發任何 warning，文件意圖無法驗證；屬反向退化。
- 兩者同 PR 落地能讓 baseline 變動原因單一、reviewer 易於核對「source 改了什麼 + 觸發了哪些新 warning」。

---

## 11. Risk Analysis

### 11.1 baseline warning count 變動風險

- 風險：source 落地時 baseline 變動超出預期數字（多觸發 / 少觸發）→ reviewer 無法判斷是 source bug 還是 expected。
- 緩解：
  - 每 PR 限定一組規則（D1+D2 / D3+S1/S2），避免變動原因混雜。
  - commit message 明示 expected baseline change（如 `baseline: 42 warnings on 37 posts → 44 warnings on 39 posts`）。
  - 落地 PR 須 run `validate:content` 並把實際數字附在 commit body / PR description。

### 11.2 ready / published / draft scope 誤判風險

- 風險：D1 / S1 / S2 之 `READY_STATUS` 限定若實作時誤寫成「所有 status」→ 既有 draft download post / template 立刻觸發 → baseline 多 +1（屬 regression）。
- 緩解：implementation phase 必須以 `if (typeof status === 'string' && READY_STATUS.has(status))` 為前提；mirror 既有 `missing-description` / `invalid-content-kind` 之 pattern；落地前以 `validate:content` 跑既有 draft post 確認不觸發。
- 額外注意：loadPosts 已會把 `status: 'draft'` / `'archived'` 之 post **過濾出** posts pipeline（per validate-content.js 既有註釋）；故 D1 / S1 / S2 即使限定 READY_STATUS，draft post 也不會進入 validator 主迴圈。實作時只需與既有 ready/published 規則同 `READY_STATUS` block 內。

### 11.3 fileUrl 格式過嚴或過寬風險

- 風險（過嚴）：D3 regex 只接 `^https?://` → 未來合法相對路徑（如 `/downloads/foo.zip`）誤判為 invalid → 一旦正式 content 採用相對路徑會 regress。
- 風險（過寬）：D3 regex 接近任意字串 → 喪失提示力，幾乎不觸發。
- 緩解：D3 推遲至 am-9（第二階段），先在 docs 裁決「是否允許相對路徑」與其 prefix 約定。本文件**不**裁決。

### 11.4 noindex / index 判斷欄位不一致風險

- 風險：S1 / S2 與既有 `invalid-seo-block` / `invalid-seo-indexing` 之觸發條件重疊 → 同一 post 同時被多條 rule 報；噪音增加。
- 緩解：implementation pseudo 內已標明「既有規則優先」：當 `invalid-seo-block` 或 `invalid-seo-indexing` 觸發時，S1 / S2 不再 push。
- 風險（其二）：S1 之提示「fallback noindex-follow applies」假設 build-github.js / build-sitemap.js 之 fallback 行為不變；若未來 build 端 fallback 調整 → S1 message 須同步更新。
- 緩解：S1 落地 PR 須在 docs / commit 內標明此 message 之 build 端 fallback 來源（build-github.js / build-sitemap.js），便於未來追溯。

### 11.5 fixture 污染 formal content 風險

- 風險：fixture 誤放於 `content/blogger/posts/` 或 `content/github/posts/` → 被 build 掃進 dist → 污染正式網站 / Blogger。
- 緩解：
  - 嚴格路徑：fixture 一律放 `content/validation-fixtures/blogger/posts/`（per §10.1）。
  - 嚴格 prefix：`_test-*.md`；既有 build:github / build:blogger / build:promotion 路徑限定 `content/{site}/posts`，不掃 `validation-fixtures/`。
  - 嚴格 title：`title: "[validation-fixture] ..."` 便於意外掃出時一眼識別。
  - 嚴格內容：fixture URL 一律明顯虛假（如 `not-a-url` / `example.invalid`）；**不**填真實 fileUrl / 真實 Drive ID / 真實 Form ID（守 R1 / R2 紅線）。

### 11.6 registry 尚未存在導致 F / A rules 不可做風險

- 風險：implementation 過於積極一次納入 F1 / F2 / A1 / A2 / A3 → registry / `formRef` / `assetRefs[]` schema 尚未定義，無從觸發、無從 fixture → source 落地後變成 dead code。
- 緩解：本 phase 明確 deferred（per §6）；am-7 / am-9 source phase **不**碰 F / A 系列。F / A 系列規則必須等：
  - FormConfig / DownloadAsset registry schema docs 接受
  - registry file 建立
  - `loadSettings()` 串接
  - frontmatter 欄位 schema 定義
  - 全部完成後另開獨立 phase 與 explicit approval。

---

## 12. Recommended Phase Split

> **保守 phase split**；每步皆 additive、可獨立驗證、可 dormant；任一步皆須**獨立 phase + user explicit approval**。

| 序 | phase 候選名 | 性質 | 涵蓋規則 | 是否本 phase 啟動 | 預期 baseline |
|---|--------------|------|---------|-----------------|---------------|
| **am-5（本 phase）** | `download-validation-warning-source-implementation-preanalysis-docs-only` | docs-only | n/a（本 phase 交付規劃） | 🟡 **本 phase 完成新增** | 37 / 42 不變 |
| **am-6**（建議下一 phase） | `download-validation-warning-source-implementation-preanalysis-acceptance-read-only` | read-only | n/a（驗證 am-5 docs 內部一致性、與既有 source / fixture 不衝突） | ❌ 不啟動 | 37 / 42 不變 |
| **am-7** | `download-validation-warning-source-implementation-d1-d2-only` | source change（warning-only additive）+ fixture | D1 + D2 | ❌ 不啟動 | 預期 **39 / 44** |
| **am-8** | `download-validation-warning-source-implementation-d1-d2-acceptance-cross-check` | read-only | n/a（cross-check am-7 之 source + fixture + baseline + docs sync） | ❌ 不啟動 | 39 / 44 不變 |
| **am-9** | `download-validation-warning-source-implementation-d3-s1-s2-decision-docs-only` 或 `...-implementation` | docs-only（裁決相對路徑 / S1 S2 合併）或 source change | D3 + S1 + S2 | ❌ 不啟動 | docs-only → 不變；implementation → 預期 +1 ~ +3 |
| later | registry-dependent F / A rules | source change（warning-only additive，含 registry 串接） | F1 / F2 / A1 / A2 / A3 | ❌ 不啟動 | TBD（依 registry / fixture 落地評估） |

### 12.1 明確聲明

**不建議下一 session 直接一次做 D1/D2/D3/S1/S2 全部 source implementation**，除非另有 user explicit approval。理由：
- D3 / S1 / S2 有 outstanding decisions（per §5）；混做會把多個 decision risk 塞進同一 PR。
- baseline 變動原因混雜會增加 reviewer 負擔。
- 既有 cadence（如 `series-*` / `book-*` / `related-links-*` 系列）皆採分小批 PR 落地，本系列保持一致。
- 若一次落地多 rule 後 baseline 與預期不符，難以回溯到單一規則之 bug。

### 12.2 推薦 next phase

**am-6**（read-only acceptance cross-check）→ 確認 am-5 docs 內部一致 + 與既有 source / fixture / docs 不衝突 → 再進 am-7 之 source implementation。

---

## 13. Non-goals

本 phase 明確**不做**：

- ❌ no source implementation
- ❌ no `src/scripts/validate-content.js` change
- ❌ no fixture（不新增 `_test-*.md`）
- ❌ no content publish / no `draft → ready`
- ❌ no `download.fileUrl` fill
- ❌ no settings registry file creation（不建 `download-forms.json` / `download-assets.json` / `download-pages.json`）
- ❌ no download landing page source（不建 template / renderer / landing page content）
- ❌ no `formRef` / `assetRefs[]` frontmatter schema 擴張
- ❌ no template 改動
- ❌ no deploy（不 `npm run build:*`、不 push gh-pages、不改 dist）
- ❌ no Blogger repost
- ❌ no GA4 validation（不做 Realtime / DebugView）
- ❌ no reverse UTM activation（reverse UTM 仍 dormant）
- ❌ no pm-26 deploy gate unblock
- ❌ no Admin Apply enable
- ❌ no middleware write route enable
- ❌ no admin-write-cli dry-run / apply
- ❌ no fourth SEO write（既有 allowed write scope 不擴張）
- ❌ no `npm install`
- ❌ no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`

本檔落地後 production state drift = 0；屬純 docs entry。唯一變更為新增本 docs 檔。

---

## 14. Final Recommendation

### 14.1 本 phase 完成後之建議下一步

- **若完成本 docs-only phase**，下一步應為 **am-6 read-only acceptance cross-check**：另開獨立 phase，read-only 驗 baseline、read-only 確認本文件 §5 matrix / §7 insertion pseudo / §8 field path / §9 warning id / §10 fixture plan / §12 phase split 之內部一致性，且與既有 source / fixture / docs **不**衝突。
- **不**建議在 acceptance cross-check 前直接跳 source implementation。

### 14.2 source implementation 須另開 phase 之原因

- baseline 變動須事先 docs 明示；source 與 fixture 須同 PR 落地（Option B）。
- D3 / S1 / S2 之 outstanding decisions 須先在 implementation preanalysis 階段（am-9 docs-only 段）定稿，避免 implementation phase 內反覆。
- 與本 phase 混做會破壞 docs-only scope，且難以保住 phase boundary。

### 14.3 若要 source implementation，建議最小起手式

- 第一個 source implementation phase（**am-7**）只含 **D1 + D2**，搭配 2 個 negative fixture，預期 baseline `42 → 44` / `37 → 39`。
- **不**建議第一個 source implementation phase 一次包含 D1 / D2 / D3 / S1 / S2 全部規則。
- D3 / S1 / S2 留至 **am-9** 之後處理（先 docs-only 裁決 outstanding decisions，再決定是否同 PR 落地）。
- F / A 系列規則必須等 registry / landing page source 落地後另開 phase。

### 14.4 本 phase 與其他凍結之關係

- reverse UTM remains **dormant**；本 phase 不啟動。
- pm-26 deploy gate remains **BLOCKED**；本 phase 不解除。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**；本 phase 不啟動。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守：本 phase 不引入任何 respondent data 通路、不把 `download.fileUrl` 與 Google Form URL 混為一談、不另造 SEO pipeline。

### 14.5 Final Idle Freeze / EXIT

完成本 phase（新增單一 docs 檔 + commit + push + final verify）後，**建議 Final Idle Freeze / EXIT**，不啟動任何 follow-on phase。

---

（本文件結束）
