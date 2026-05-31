# 2026-06-01 Download Loader Preanalysis

> Phase: `20260531-night-4-download-loader-preanalysis-docs-only-a`
> Date: 2026-05-31 22:03 +0800（於 night-3 `f137457` next-work roadmap landed 後之 cold-start session）
> Scope: **docs-only**（單檔新增；無 source / content / settings / templates / fixture / package / dist / gh-pages / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `f137457ee992ffcbf8346538051bdb1b778dd087`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **docs-only preanalysis**：在已 landed 之 download empty registry（commit `466e471`；`content/settings/download-assets.json` + `content/settings/download-forms.json`）之上，為未來 download loader 與 registry lookup 之 source phase 做設計輸入；**不**啟動任何 implementation。
- 本 phase **不**授權任何 loader / source / settings / content / fixture / build / deploy 變動：
  - ❌ 不改 `src/scripts/load-settings.js`；不新建 `src/scripts/load-download-registry.js`。
  - ❌ 不改 `src/scripts/validate-content.js` 任一行。
  - ❌ 不改 `content/settings/download-assets.json` / `content/settings/download-forms.json` 之內容。
  - ❌ 不改 build script / renderer / Admin source。
  - ❌ 不 build / deploy / Blogger repost / GA4 validation。
  - ❌ 不啟用 Admin Apply / middleware write / admin-write-cli dry-run / apply。
  - ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate。
  - ❌ 不新增 fixture；不 promote draft fixture。
  - ❌ 不主動 migration 既有 `download.fileUrl` post。
- 本 phase 之目標為：在 night-3 next-work roadmap（`f137457`）已標示之「Candidate B — Download loader preanalysis docs-only」候選方向中落地單一 docs 檔；推進 download cadence 之**上游規劃**而不觸碰 source。
- Baseline `f137457`：HEAD = origin/main；working tree clean；ahead/behind = 0/0；validate `0 / 47 / 42`。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔；validate baseline 預期維持不變。

### 1.1 一句話裁決

> **未來 download loader source phase 之啟動條件、檔案邊界、行為合約、registry lookup 模型、與既有 `download.fileUrl` 之共存原則於本文件內固化為設計輸入；本 phase 不啟動任何 source / settings / fixture / build / deploy 動作；download loader / validator-via-registry / Admin picker / renderer / content migration 全保持 dormant。**

---

## 2. Frozen Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `f137457ee992ffcbf8346538051bdb1b778dd087` |
| origin/main（本 phase 啟動時） | `f137457ee992ffcbf8346538051bdb1b778dd087` |
| short | `f137457` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `docs(operations): plan next work after eod freeze` |

### 2.1 Governance dormancy snapshot

| Gate / Surface | 狀態 |
|---|---|
| Reverse UTM source（pm-24a / b / c at `7e1d356` / `e2309e9` / `7c769fe`） | ✅ landed origin/main（2026-05-23） |
| Reverse UTM live | ❄ **dormant**（未 deploy；Blogger 後台未重貼；GA4 Realtime validation 未啟動） |
| pm-26 deploy gate | ❄ **BLOCKED**（positive fixture 仍 `status: draft`） |
| Download empty registry（`content/settings/download-assets.json` + `content/settings/download-forms.json`） | ✅ landed at `466e471`；shape = empty `{ schemaVersion: 1, updatedAt: "", assets\|forms: [], notes: "" }` |
| Download loader source | ❄ **dormant**（`src/scripts/load-settings.js` 未串接此兩 registry） |
| Download validator-via-registry rules（unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry） | ❄ **全 dormant** |
| Download Admin picker | ❄ **dormant** |
| Download landing page renderer | ❄ **dormant** |
| Download content migration（`fileUrl` → `assetRefs[]` / `formRef`） | ❄ **dormant**（既有 fileUrl post 未遷移） |
| Admin Apply enable flag | ❄ **disabled / dormant** |
| Middleware write route | ❄ **absent**（無 route handler；無 server-side write） |
| admin-write-cli dry-run / apply | ❄ **dormant** |

---

## 3. Current Download Registry Artifacts

### 3.1 Files landed at `466e471`

| Path | 性質 | 當前內容 |
|---|---|---|
| `content/settings/download-assets.json` | settings registry；單檔；empty registry landing point | `{ "schemaVersion": 1, "updatedAt": "", "assets": [], "notes": "" }` |
| `content/settings/download-forms.json` | settings registry；單檔；empty registry landing point | `{ "schemaVersion": 1, "updatedAt": "", "forms": [], "notes": "" }` |

### 3.2 Expected empty shape（per am-8 §5）

兩檔 top-level 欄位：

| 欄位 | 型別 | 必填 | 當前值 | 說明 |
|---|---|---|---|---|
| `schemaVersion` | integer | ✅ | `1` | 初版固定 `1`；breaking change 須走 schemaVersion bump |
| `updatedAt` | string（ISO 8601 或空字串） | ✅ | `""` | 空字串為合法 placeholder；mirror pm-16 §8.3 cadence |
| `assets` / `forms` | array | ✅ | `[]` | 空陣列為合法初始狀態 |
| `notes` | string | optional | `""` | 空字串合法；亦可省略 key；不存 PII / token / secret |

### 3.3 Registry R1 紅線（per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4 R1）

兩 registry 檔**永不**承載：

- ❌ respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）
- ❌ access token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID / 私人 permission grant
- ❌ Google Form responses（必須留在 Google Forms / Sheets；不得進 repo）

empty registry 為 R1 紅線之**最強防護狀態**：無 entry → 天然無 PII / token / secret。

### 3.4 Consumer state（per `CLAUDE.md` §3.2）

當前所有 consumer 皆 **dormant**：

- ❌ loader source 未串接（`src/scripts/load-settings.js` 之 `SETTINGS_FILES` 不含 download registry）
- ❌ validator rule 未實作（unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry 全無）
- ❌ Admin picker 未實作
- ❌ landing page renderer 未實作
- ❌ content migration 未啟動（既有 `download.fileUrl` post 未遷移至 `assetRefs[]` / `formRef`）

empty registry settings 已 landed；但 download management 並未啟用；兩檔僅為 future loader / validator / Admin / renderer 之穩定落點。

---

## 4. Loader Integration Surface Inventory

### 4.1 當前 settings loading 機制（read-only inspection）

`src/scripts/load-settings.js` 為 settings loader 之唯一入口：

- `loadSettings()` 為 async function；回傳統一 `result` object。
- `SETTINGS_FILES` 為 hard-coded array；列出 15 個必載 settings（site / themes / categories / tags / series / ads / socialLinks / promotion / affiliateNetworks / linkRules / seo / ga4 / navigation / sidebar / footer）。
- `readJson(filename)`：必載；missing file 或 parse error 皆 throw（fail-fast）。
- `readJsonOptional(filename, fallback)`：optional；missing file 或 parse error 皆 return fallback（silent fallback）。
- 既有 optional registry 範例：`linkSources = await readJsonOptional('link-sources.json', { sources: [] })`（per Phase `20260527-am-2` step-4 renderer fallback chain）。

### 4.2 Download registry 在當前 loader 中之狀態

- ❌ `download-assets.json` / `download-forms.json` **不**出現於 `SETTINGS_FILES`。
- ❌ `download-assets.json` / `download-forms.json` **不**透過 `readJsonOptional` 載入。
- ✅ 兩檔實體存在於 `content/settings/`（per `466e471`），但無任何 loader call 觀察。
- ✅ 對 validate / build / render pipeline 而言，兩檔為「**透明檔**」；新增 / empty / 刪除三狀態對 baseline 之影響皆為零。

### 4.3 既有 validator 與 download 相關之觀察

`src/scripts/validate-content.js` 之 D 系列規則（per `20260530-am-7` / am-13）：

- D1（`download-enabled-fileurl-empty`）：`contentKind === 'download'` 且 `download.enabled === true` 且 `download.fileUrl` missing/empty → warning。
- D2（`download-fileurl-invalid-type`）：`download.fileUrl !== undefined` 且非 string → warning。
- D3（`download-fileurl-invalid-format`）：`download.fileUrl` 不符合 `^https?://` → warning。
- S（SEO 階層式 fix-first）：D1 / D2 / D3 任一觸發時 S 不再 push。

D / S 規則完全**僅基於 post frontmatter 之 `download.fileUrl`**；與 registry 完全解耦。registry 未被任何 validator rule 引用。

### 4.4 未來可能之 loader integration 候選檔案

下列為**設計輸入**；本 phase **不**修改任一檔：

| 候選路徑 | 性質 | 設計取捨 |
|---|---|---|
| **A: 擴張 `src/scripts/load-settings.js`** | 在既有 `SETTINGS_FILES` 或 `readJsonOptional` 機制下新增 download registry 兩檔 | ✅ 集中於既有 loader；mirror `linkSources` 之 optional 模式；無新檔；維護面小 |
| **B: 新建 `src/scripts/load-download-registry.js`** | 為 download registry 建立獨立 loader module | ⚠️ 新 source file；長期擴張空間大（如未來支援 schemaVersion bump 之多版本共存）；但分散於兩 module |
| **C: 內聯於既有 consumer**（如 validate-content.js / build-github.js） | 各 consumer 自行讀檔 | ❌ 不推薦；違反 CLAUDE.md §3.2 settings 集中管理原則；重複 IO |

候選 A 與 B 之最終裁決屬未來 docs-only sub-phase 範疇（per `docs/20260531-download-empty-registry-implementation-plan.md` §12.4）；本文件**不**裁決。

### 4.5 為何本 phase 不修改任何 loader 檔案

- 本 phase scope 限為 docs-only 單檔新增（per phase prompt）。
- 任何 loader 串接屬 source phase；須走獨立 phase + user explicit approval。
- 對齊 `CLAUDE.md` §27 之 Claude Code 修改規則：須先說明影響範圍、不擅自實作。
- 對齊 night-3 next-work roadmap（`f137457`）§4.2 之 Candidate B explicit exclusions：「不改 `src/scripts/load-settings.js` 任一行」。

---

## 5. Proposed Future Loader Behavior

**本節僅為設計輸入；本 phase 不實作。** 下列為未來 download loader source phase 之 contract 提案。

### 5.1 Missing registry files

- 對 missing `content/settings/download-assets.json` / `content/settings/download-forms.json`：**silent fallback**。
- 預期 fallback value：`{ schemaVersion: 0, updatedAt: '', assets|forms: [], notes: '' }`。
  - `schemaVersion: 0`：以 `0` 標示「未建檔 / 未啟用」；與 `1` 之「已建檔之 empty」可區分。
- 不 throw；不主動 warn；不阻擋 build。
- 對齊 am-6 §7.1：missing file 採 silent fallback。

### 5.2 Empty registries（`assets|forms: []`）

- 視為 **acceptable shape**；不 warn；不阻擋 build。
- 對齊 am-6 §5：empty registry 為合法初始狀態。
- 與 missing file 之 baseline 影響**同義**（皆不 warn；皆不影響 validate baseline）。

### 5.3 Malformed JSON

- 採 **fail-closed**：throw with file path + parse error message。
- 不 silent fallback；不允許 silent drift。
- 對齊 am-6 §7.1：parse error 不可靜默吞掉。
- throw 後 build / validate 應 **abort**；由作者修正後再次執行。

### 5.4 Unsupported schemaVersion

- 對 `schemaVersion` 非預期值（如 `2` / `999` / null / 字串 `"1"`）：
  - **fail-closed**：throw with file path + 實際 schemaVersion 值 + 支援之 version range。
  - 不 fallback；不靜默忽略。
- 對齊 am-6 §5.2：schemaVersion 為 contract；不符版號為 breaking change 提示。
- 未來若需多版本共存，採 schemaVersion bump path（per am-4 §4.2 + am-6 §5.2）；屬獨立 phase。

### 5.5 Unknown top-level fields

- 對 top-level 出現未定義 key（除 `schemaVersion` / `updatedAt` / `assets|forms` / `notes` 外）：
  - **warn-and-continue**：產生 warning（如 `download-registry-unknown-field`）；不 abort。
  - warning 屬未來 validator-via-registry 範疇（per am-6 §11）；非 loader 自身 throw。
- 對齊 am-6 §11.1：未定義欄位採 warn；不採 fail-closed（避免新增欄位即破壞向後相容）。

### 5.6 Missing required top-level fields

- 對 missing `schemaVersion` / `updatedAt` / `assets|forms`：
  - **fail-closed**：throw with file path + missing field list。
- 對 missing `notes`：
  - 視為 optional；不 throw；視為 `""`。
- 對齊 am-6 §5.2：`schemaVersion` / `updatedAt` / `assets|forms` 為必填；`notes` 為 optional。

### 5.7 Duplicate asset / form IDs

- 對 `assets[]` / `forms[]` 內出現重複 `id`：
  - **warn**（屬未來 validator-via-registry 範疇）：產生 warning `download-asset-duplicate-id` / `download-form-duplicate-id`。
  - 不 abort；後續 ref lookup 取「**第一筆出現**」之 entry（或統一規則；屬未來 docs 化裁決）。
- 對齊 am-6 §11.2：duplicate-id 採 warn-and-continue。

### 5.8 Non-array `assets` / `forms`

- 對 `assets` / `forms` 之值非 array（如 string / number / object / null）：
  - **fail-closed**：throw with file path + 實際 typeof。
- 對齊 am-6 §11.3：top-level shape 違反 array contract 為 schema 違規；採 fail-closed。

### 5.9 Empty `updatedAt`

- 對 `updatedAt: ""` 或缺失：
  - 視為 acceptable placeholder；不 warn；不 throw。
  - loader 須**明示**「空字串 = 未填」之處理；不可隱式轉為 Date object / epoch 0 / `Invalid Date`。
- 對齊 am-4 §4.2 + am-6 §5.5 + am-8 §10.3。

### 5.10 `notes` field handling

- 對 `notes: ""` / 缺失 / 任意字串：
  - 視為 free-text；loader 不解讀；不 warn。
  - 但**禁止**包含 token / secret / PII（屬 R1 紅線；未來 validator-via-registry 可加 `download-registry-notes-token-like-pattern` 規則）。
- 對齊 am-4 §8 + am-6 §11.5。

### 5.11 為何採「missing silent / parse fail-closed」二分法

- missing 為「**未啟用**」之合法狀態；不阻擋 build。
- parse error 為「**作者誤改**」之 unrecoverable 狀態；不可靜默吞掉，否則作者可能誤以為「已生效」。
- 對齊既有 cadence：`readJson` fail-fast vs `readJsonOptional` silent fallback；本 loader 採「optional + parse-error-throw」之中間態。

---

## 6. Registry Lookup Model

**本節僅為設計輸入；本 phase 不實作。** 下列為未來 registry lookup 之 model 提案。

### 6.1 Asset lookup by `assetId`

- 未來 post frontmatter 可宣告 `assetRefs[]`，每個 ref 為 string id。
- Lookup pseudo-contract（未實作）：

  ```text
  function findAsset(assetId, registry):
    return registry.assets.find(entry => entry.id === assetId)
  ```

- 命中 → return entry；未命中 → return `undefined`。

### 6.2 Form lookup by `formId`

- 未來 post frontmatter 可宣告 `formRef`，為 single string id。
- Lookup pseudo-contract（未實作）：

  ```text
  function findForm(formId, registry):
    return registry.forms.find(entry => entry.id === formId)
  ```

- 命中 → return entry；未命中 → return `undefined`。

### 6.3 Kebab-case ID expectation

- `assetId` / `formId` 建議採 **kebab-case**（如 `phonics-practice-sheet-vol-1` / `bookshelf-download-form`）。
- ✅ 允許 ASCII lowercase letters / digits / hyphen。
- ✅ 建議於同一 site 內保持 prefix 一致（如 `phonics-*` / `bookshelf-*`）。

### 6.4 No date prefix requirement

- ❌ **不**強制 ID 須含 date prefix（如 `20260529-`）。
- 理由：registry entry 之 ID 屬「**身分識別**」而非「**時序紀錄**」；應穩定不變；不應隨日期 churn。
- 對齊既有 settings cadence：`categories.json` / `tags.json` / `series.json` 之 ID 皆無 date prefix。

### 6.5 No Chinese ID recommendation

- ❌ **不**建議 ID 採中文字元。
- 理由：URL-friendliness / file-system-friendliness / cross-platform consistency / future API path 相容性。
- 對齊既有 settings cadence：`categories.json` / `tags.json` 之 ID 皆採 ASCII。

### 6.6 `assetRefs[]` 與 `formRef` 之關係（未來 post frontmatter schema 擴張）

- `assetRefs[]`：array of string id；可空陣列；可省略；多筆代表「**一篇 post 可下載多檔**」。
- `formRef`：single string id；可省略；代表「**取得下載前須填表**」之 gate。
- 兩欄位**不互斥**；可共存。共存 semantics：
  - `formRef` 命中 → 顯示 gate UI（form）。
  - gate 通過後 → 透過 `assetRefs[]` 提供下載 link 列表。
  - 兩者皆省略 → 屬 fallback path（如保留既有 `download.fileUrl`）。
- bundle consistency（如 `assetRefs[]` 全部為同一 deliveryMode）屬未來獨立 validator rule（per am-6 §11.6）；本文件不裁決。

### 6.7 Not-found behavior

- ref id 在 registry 中未命中：
  - **loader 層**：不 throw；不 warn（loader 不知 ref 從何來）。
  - **validator-via-registry 層**：產生 warning（如 `download-asset-ref-not-found` / `download-form-ref-not-found`）；severity 為 warning。
  - **renderer 層**：渲染時略過該 ref；不 throw；不阻擋 build。
- 對齊 am-6 §7.4 / §8.1：by-demand ref lookup 才 warn；mirror 既有 D / S 之 by-post pattern。

### 6.8 Inactive / unavailable future handling

- 未來 registry entry 可能含 `active: false` 或 `status: 'inactive'` / `'archived'` 等 flag（per am-6 §10）：
  - **validator-via-registry 層**：產生 warning（如 `download-asset-inactive` / `download-form-inactive`）；不 abort。
  - **renderer 層**：可選擇略過 / 顯示「暫時下架」訊息；屬未來 UX 裁決。
- 本文件**不**裁決 inactive entry 之最終語意；屬未來 docs-only sub-phase。

### 6.9 Why lookup model 不採 nested / namespaced ID

- ❌ 不採 `asset:phonics-practice-sheet-vol-1` 之 namespace prefix。
- ❌ 不採 `assets/phonics-practice-sheet-vol-1` 之 path-style。
- 理由：簡化 ID syntax；mirror 既有 `categories[].id` / `tags[].id` 之 flat naming；ref 與 entry id 一致。

---

## 7. Backward Compatibility With Legacy `download.fileUrl`

### 7.1 Grandfather rule

- 既有 `content/blogger/posts/20260529-phonics-practice-sheet-download.md` 之 `download.fileUrl` **保留**；不主動 migration。
- 既有 D1 / D2 / D3 / S 對 fileUrl 之既有 validator rule **繼續有效**；不退化、不重做。
- 對齊 am-4 §9.3 + am-6 §15 + am-8 §3.8。

### 7.2 No content migration authorized in this phase

- ❌ 本 phase **不**遷移任何 post 之 `download.fileUrl` 至 `assetRefs[]` / `formRef`。
- ❌ 本 phase **不**新增 `assetRefs[]` / `formRef` 至任何 post frontmatter。
- ❌ 本 phase **不**修改任何 `content/{site}/posts/**.md` / `content/drafts/**` / `content/archive/**` 檔案。

### 7.3 No fixture promotion authorized in this phase

- ❌ 本 phase **不** promote 任何 draft fixture 至 ready / published。
- ❌ 本 phase **不**新增 `content/validation-fixtures/**` 之任一檔。
- 對齊 night-3 next-work roadmap（`f137457`）§10 之 fixture creation / promotion 不授權。

### 7.4 Registry lookup 不得 break 既有 posts

- 未來 loader / validator-via-registry / renderer 之 implementation 須**確保**：
  - 對既有未引用 `assetRefs[]` / `formRef` 之 post：行為**完全不變**；既有 D1 / D2 / D3 / S 結果不變。
  - 對既有引用 `download.fileUrl` 之 post：fileUrl 路徑**繼續有效**；不被 registry lookup 取代或干擾。
  - validate baseline 之 D / S warning 不被新增規則重複觸發；不 double-warn。
- 對齊 am-6 §15 之 fileUrl grandfather；對齊 am-7 / am-13 之既有 D / S 不退化。

### 7.5 A / B+C 共存

- A（`download.fileUrl`）與 B+C（`assetRefs[]` + `formRef`）**可共存**於同一 post。
- 共存時之優先順序、語意、validator warning 屬未來獨立 docs-only sub-phase 裁決（per am-6 §15.3）；本文件**不**裁決。

### 7.6 Future migration 屬獨立 explicit phase

- 既有 `download.fileUrl` post 之 migration 屬 P7（per am-6 §18 / am-8 §12.6）；逐篇 user explicit approval。
- ❌ 不可在 loader source phase 內順便 migration。
- ❌ 不可在 validator source phase 內順便 migration。
- ❌ 不可在 renderer source phase 內順便 migration。
- migration phase 須單獨啟動；單獨 commit；單獨 acceptance。

---

## 8. Validation Relationship

### 8.1 本 docs-only phase 之 validate 預期

- 本 phase **不**改 source / settings / content / fixture；validate pipeline 之 input 不變。
- 預期 baseline 維持 **0 errors / 47 warnings / 42 posts**。
- 本 phase commit 後 baseline 若 drift → 視為意外影響；應 STOP（per phase prompt task 4 / task 8）。

### 8.2 Loader implementation 與 validator-via-registry 屬獨立 phase

- loader source phase（暫稱 `am-2-download-loader-source-implementation`；per §11 / §13）：
  - 僅串接 loader；不新增 validator rule。
  - 預期對 baseline 影響：零（loader 為 read-only；不產生 warning）。
- validator-via-registry source phase（暫稱 `am-2-download-validator-via-registry-source-implementation`；per `docs/20260531-download-empty-registry-implementation-plan.md` §12.3）：
  - 新增 validator rule；可能對 baseline 產生影響。
  - 影響估算須於該 phase 之 preanalysis 完成；本 phase **不**估算。

### 8.3 D1 / D2 / D3 / S1 / S2 / F1 / F2 / A1 / A2 / A3 之治理

- D1 / D2 / D3（per `20260530-am-7` / am-13）：既有 frozen；本 phase 不退化、不擴張、不重做。
- S1 / S2（per `20260530-am-7` / night-5）：既有 frozen；本 phase 不退化、不擴張、不重做。
- F1 / F2 / A1 / A2 / A3：屬未來 validator-via-registry 範疇；本 phase 不裁決、不啟動、不命名 final rule code。
- 對齊 night-3 next-work roadmap（`f137457`）§5.2 之 D1/D2/D3 / S1-S2 / F1-F2 / A1-A3 governance。

### 8.4 preview-url-risk policy 之治理

- preview-url-risk policy（per `docs/20260530-download-fileurl-preview-url-risk-policy.md`）：當前 frozen 於 raw URL regex policy 階段；本 phase **不**改 policy；**不**升級至 registry-based。
- 未來若升級至 registry-based：屬獨立 docs-only sub-phase + source phase；不在本 phase 內裁決。

### 8.5 D1/D2/D3/S1-S2/F1-F2/A1-A3 / preview-url-risk 全 governed by later decisions

- 本 phase 為 loader preanalysis；**不**涉及上述 rule 之 source。
- 上述 rule 之具體實作裁決屬未來各自獨立 phase；本文件僅作 context reference。

---

## 9. Consumer Boundary

下列 consumer **全保持 dormant**；本 phase **不**啟動任何一者：

### 9.1 Renderer / landing page

- ❌ 不新增 `src/views/pages/post-detail-download.ejs`。
- ❌ 不新增 `src/views/blogger/blogger-post-download-*.ejs`。
- ❌ 不改 `src/views/pages/post-detail.ejs` 之 download block 渲染。
- ❌ 不改 `src/views/blogger/blogger-post-full.ejs` 之 download block 渲染。
- ❌ 不新增 landing page route / data flow。

### 9.2 Admin picker

- ❌ 不新增 Admin UI component。
- ❌ 不改 Admin source（mirror admin-2-write-pre-analysis.md 之 allowed write scope 不擴張）。
- ❌ 不啟用 Admin Apply。
- ❌ 不啟用 middleware write。
- ❌ 不執行 admin-write-cli dry-run / apply。

### 9.3 validate-content registry lookup

- ❌ 不在 `src/scripts/validate-content.js` 新增任何 registry lookup 邏輯。
- ❌ 不新增 `download-asset-ref-not-found` / `download-form-ref-not-found` / `download-asset-duplicate-id` / `download-form-duplicate-id` / `download-asset-inactive` / `download-form-inactive` / `download-registry-unknown-field` / `download-registry-notes-token-like-pattern` 等任一 rule。

### 9.4 Article CTA / download flow

- ❌ 不改 article-level download CTA 行為。
- ❌ 不改 affiliate / book / download / related-posts 等 block 之渲染順序。
- ❌ 不改 GA4 event 之 download_click attribute。

### 9.5 GitHub / Blogger build outputs

- ❌ 不 `npm run build:github` / `npm run build:blogger`。
- ❌ 不 push gh-pages。
- ❌ 不影響 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`。

### 9.6 Explicit consumer dormancy

所有 consumer 在本 phase 完成後**仍維持 dormant**：

| Consumer | 本 phase 狀態 | 未來啟動條件 |
|---|---|---|
| Loader source | ❄ dormant | 須走獨立 source phase + user explicit approval |
| Validator-via-registry source | ❄ dormant | 須走獨立 source phase + user explicit approval |
| Admin picker source | ❄ dormant | 須走獨立 source phase + user explicit approval |
| Renderer source | ❄ dormant | 須走獨立 source phase + user explicit approval |
| Content migration | ❄ dormant | 須走逐篇 explicit phase + user explicit approval |
| Build / deploy | ❄ dormant | pm-26 deploy gate unblock + user explicit approval |

---

## 10. Risk Matrix

| # | 風險 | 風險等級 | 緩解 | 本 phase 是否允許 |
|---|---|---|---|---|
| R10.1 | 意外觸發 source implementation（修改 `load-settings.js` / `validate-content.js` 等） | 🔴 高 | phase prompt hard rules 明示禁止；commit pre-check 限為單一 docs 檔；`git diff --stat` 須顯示 exactly 1 new file | ❌ 不允許 |
| R10.2 | 意外修改 `content/settings/download-assets.json` / `download-forms.json` | 🔴 高 | phase prompt 明示「不可修改 settings」；commit 須驗 settings 兩檔 git status 為 unchanged | ❌ 不允許 |
| R10.3 | 意外觸發 content migration（修改既有 post frontmatter 之 `download.fileUrl` / 新增 `assetRefs[]` / `formRef`） | 🔴 高 | phase prompt 明示「不可修改 content」；mirror am-8 §13.6 之 grandfather rule | ❌ 不允許 |
| R10.4 | 未來 loader 對 malformed JSON 行為設計不一致（如 silent swallow） | 🟡 中 | 本文件 §5.3 明示 fail-closed；docs 化此 contract 於 loader source phase 之 preanalysis | 不適用（屬未來 phase） |
| R10.5 | 未來 registry lookup 串接後改變 validate baseline | 🟡 中 | 本文件 §8.2 明示 loader 與 validator-via-registry 分階段；loader 階段預期 baseline 影響為零；validator 階段須單獨估算 | 不適用（屬未來 phase） |
| R10.6 | Admin Apply 被意外啟用 | 🔴 高 | phase prompt 明示「不可啟用 Admin Apply」；本 phase 無 Admin 變動；admin-2-write-pre-analysis.md allowed write scope 不擴張 | ❌ 不允許 |
| R10.7 | Renderer 輸出 drift（如 dist-blogger 或 gh-pages 意外變動） | 🟡 中 | 本 phase 不 build / 不 deploy；renderer 不變動；dist 目錄不受影響 | ❌ 不允許 build |
| R10.8 | Build / deploy 被意外觸發（`npm run build:*` / gh-pages push） | 🔴 高 | phase prompt 明示「不可 build / deploy」；本 phase 僅 docs commit + push origin/main；無 dist 變動 | ❌ 不允許 |
| R10.9 | reverse UTM 被意外啟用 / pm-26 deploy gate 被解除 | 🔴 高 | 兩 gate 與 download registry 完全解耦；本 phase 不觸及 reverse UTM source / Blogger 後台 / GA4 | ❌ 不允許 |
| R10.10 | Middleware write route 被意外新增 / admin-write-cli 被意外執行 | 🔴 高 | 兩 surface 與 download registry 完全解耦；本 phase 不觸及 middleware source / cli script | ❌ 不允許 |

---

## 11. Future Source Implementation Candidate

### 11.1 候選 phase name

未來若 user 明示授權啟動 download loader source phase，建議命名：

```text
20260601-am-2-download-loader-source-implementation-a
```

**本文件不授權該 phase；僅為設計輸入。**

### 11.2 該 phase 之候選 acceptance gates

未來 source phase 落地時建議滿足之 acceptance：

- ✅ **Exact source file scope**：
  - 候選 A（擴張）：僅修改 `src/scripts/load-settings.js`；新增兩行 `readJsonOptional` call。
  - 候選 B（新建）：僅新增 `src/scripts/load-download-registry.js`；可能涉及 `src/scripts/load-settings.js` 之 minimal re-export。
  - 兩候選之最終裁決屬該 phase 之 preanalysis 範疇。
- ✅ **No content changes**：`content/{site}/posts/**` / `content/drafts/**` / `content/archive/**` / `content/templates/**` / `content/validation-fixtures/**` 不動。
- ✅ **No settings changes**：`content/settings/download-assets.json` / `download-forms.json` 之內容不動；其他 settings 不動。
- ✅ **No build / deploy**：不 `npm run build:*`；不 push gh-pages。
- ✅ **Validate baseline expectation**：預期維持 `0 / 47 / 42`（因 loader 為 read-only；不產生 warning）。
- ✅ **Tests / read-only assertions**：若有 unit test 框架，建議覆蓋 missing / empty / parse-error 三狀態之 loader 行為；本文件不假設測試框架已存在。
- ✅ **Post-implementation docs sync**：若 source phase 落地後改變既有 docs 之裁決（如 `docs/20260531-download-empty-registry-implementation-plan.md` §12.4 之候選 A / B 二選一），須走獨立 docs sync sub-phase；不在 source commit 內順便處理。
- ✅ **Acceptance cross-check required**：source phase 落地後須有獨立 read-only acceptance phase（mirror am-3 / am-5 / am-7 cadence）；不 commit；驗 source diff + validate baseline + git 狀態。

### 11.3 為何該 phase **不**在本 phase 內啟動

- phase prompt 明示「不可開始 download loader source implementation」。
- mirror `CLAUDE.md` §27 之 Claude Code 修改規則：須先說明 + user 明示授權方可實作。
- mirror night-3 next-work roadmap（`f137457`）§11 之 entry point 命名提示：未來 phase 須由 user explicit instruction 啟動。

---

## 12. Non-goals / Red Lines

本文件**明確不**授權下列任一動作：

| 項目 | 授權狀態 |
|---|---|
| source implementation（任何 `src/**` 變動，包括 `src/scripts/load-settings.js` / `src/scripts/validate-content.js` / `src/scripts/build-github.js` / `src/scripts/build-blogger.js` / `src/views/**` 等） | ❌ 不授權 |
| settings 變動（`content/settings/download-assets.json` / `download-forms.json` 內容變更；其他 settings 變更） | ❌ 不授權 |
| content migration（任何 `content/{site}/posts/**.md` / `content/drafts/**` / `content/archive/**` 變動） | ❌ 不授權 |
| fixture creation（任何 `content/validation-fixtures/**` 新增） | ❌ 不授權 |
| fixture promotion（draft → ready / published） | ❌ 不授權 |
| build（`npm run build:*` / `npm run dev`） | ❌ 不授權 |
| deploy（gh-pages push / `dist/` 變動） | ❌ 不授權 |
| Blogger repost（後台貼 HTML） | ❌ 不授權 |
| GA4 validation（Realtime / DebugView 操作） | ❌ 不授權 |
| reverse UTM activation（pm-24a / b / c live 切換） | ❌ 不授權 |
| pm-26 deploy gate unblock | ❌ 不授權 |
| Admin Apply enable | ❌ 不授權 |
| middleware write route 新建 | ❌ 不授權 |
| admin-write-cli dry-run / apply 執行 | ❌ 不授權 |
| renderer 輸出變動（dist / dist-blogger / dist-promotion / dist-reports） | ❌ 不授權 |
| validator-via-registry rule 實作（A1 / A2 / A3 / F1 / F2 / unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry / notes-token-like-pattern 等任一） | ❌ 不授權 |
| npm install / package.json / package-lock.json / vite.config.js 變動 | ❌ 不授權 |
| amend / rebase / reset / stash / force-push / `--no-verify` / `--no-gpg-sign` | ❌ 不授權 |

### 12.1 R1 / R2 / R3 紅線

- **R1**（per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4 R1）：registry 永不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID；本文件亦不授權任何違反 R1 之動作。
- **R2**（per pm-20 §4 R2）：`download.fileUrl` 與 Google Form URL 不可混淆；本文件不主動 migration；A / B+C 共存合法。
- **R3**（per pm-20 §4 R3）：landing page 之 noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline；本文件不變動 SEO pipeline。

---

## 13. Suggested Next Session Entry Points

下列為 6/1 起若 user 明示授權之候選 phase name（**僅命名提示；不含完整 prompt；不在本文件啟動**）：

- `20260601-am-2-download-loader-source-implementation-preflight-readonly-a`
- `20260601-am-2-download-loader-source-implementation-a`
- `20260601-am-2-download-loader-docs-sync-after-source-a`

### 13.1 每一 phase 之啟動條件

1. **user explicit approval**（明示 phase name 與 scope）。
2. **baseline 仍為本文件之 commit 之延伸**（HEAD 包含本文件 commit）。
3. **scope 限為單一目的**：
   - preflight-readonly：純 read-only context review；不 commit；不改檔。
   - source-implementation：唯一 source 變動範圍須符合 §11.2；不夾帶 docs / settings / content / fixture / build。
   - docs-sync：唯一 docs 變動範圍須符合 source 之裁決；不夾帶 source / settings / content / fixture / build。
4. **完成後須有獨立 read-only acceptance cross-check**（mirror am-3 / am-5 / am-7 cadence）。

### 13.2 三 phase 之相對優先順序

- preflight-readonly：**先**啟動；驗 source phase 之 acceptance gates 是否齊備；不 commit。
- source-implementation：**第二**啟動；唯一 source phase；commit + push。
- docs-sync：**第三**啟動；對齊 docs 與 source 之裁決；commit + push。

### 13.3 三 phase 均**須**由 user 明示啟動

本文件**不**自動啟動任一 phase；mirror `CLAUDE.md` §27 之 Claude Code 修改規則。

---

## 14. Final Recommendation

### 14.1 推薦

**Final Idle Freeze / EXIT after this phase commit + push.**

理由：

1. 本 phase 已為 download loader cadence 提供完整設計輸入；無 in-flight 待落地之 source / content / settings change。
2. 所有 consumer（loader / validator-via-registry / Admin picker / renderer / content migration）保持 dormant；無被動到期事項；無時間壓力。
3. 本 phase commit 完成後新 cold-start baseline 為本 phase 之 commit hash；下次 session 可直接讀本文件 + night-3 next-work roadmap（`f137457`）作雙入口。
4. user 對 6/1 起之具體計畫尚未明示；在無明示前不啟動任何下游 phase 為**最低風險**選擇。
5. 對齊 `CLAUDE.md` §1 / §29 / §30 之「**不過度工程化**」原則。

### 14.2 下一個最安全步驟

**read-only acceptance cross-check of this new commit**（mirror am-3 / am-5 / am-7 cadence）：

- 性質：read-only；不 commit；不改任何檔。
- 範圍：驗本文件之內部一致性 + 與既有 docs（night-3 roadmap / am-8 implementation plan / am-6 registry JSON preanalysis）cadence 對齊 + 驗 baseline 不變。
- 啟動條件：user explicit approval。
- 此為**比立即進入 source implementation 更保守之選項**。

### 14.3 不推薦立即執行

- ❌ **不推薦**立即進入 `20260601-am-2-download-loader-source-implementation-a`（屬下游 source phase；須先有 preflight-readonly）。
- ❌ **不推薦**立即進入任何 validator-via-registry / Admin picker / renderer / content migration source phase（屬更下游；須先有 loader landed）。
- ❌ **不推薦**立即進入 deploy / Blogger repost / GA4 validation（屬 P8；pm-26 deploy gate 仍 BLOCKED）。
- ❌ **不推薦**立即進入 reverse UTM activation / pm-26 unblock（屬獨立 fixture publish-readiness track）。
- ❌ **不推薦**立即進入 Admin Apply enable / middleware write route 新建 / admin-write-cli execution（屬獨立 Admin write track）。

---

## Cross-references

- `docs/20260601-next-work-roadmap-preanalysis.md`（night-3 next-work roadmap；landed `f137457`）
- `docs/20260531-end-of-day-report.md`（2026-05-31 EOD checkpoint；landed `b028eae`）
- `docs/20260531-download-empty-registry-implementation-plan.md`（am-8 implementation plan；landed `7aa0342`）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（am-4 schema decision；landed `b6f5c59`）
- `docs/20260531-download-asset-form-registry-json-preanalysis.md`（am-6 registry JSON preanalysis；landed `ae14476`）
- `docs/20260530-download-fileurl-preview-url-risk-policy.md`（preview-url-risk policy；frozen at raw URL regex stage）
- `docs/related-links-schema.md`（relatedLinks / otherLinks metadata schema）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 設計原則 / 類型 / 啟動條件）
- `docs/README.md`（docs 入口）
- `CLAUDE.md` §3.2（settings 集中管理）
- `CLAUDE.md` §13（教具下載文章規則）
- `CLAUDE.md` §27（Claude Code 修改規則）
- `CLAUDE.md` §29 / §30（第一版不做清單 / 專案最終樣貌）

---

End of preanalysis.
