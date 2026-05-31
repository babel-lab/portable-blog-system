# 20260531 Download Asset / Form Registry JSON Preanalysis

> Phase: `20260531-am-6-download-asset-form-registry-json-preanalysis-docs-only-a`
> Date: 2026-05-31 10:08 +0800
> Scope: **docs-only**（無 source / content / settings / templates / fixture / package / dist / gh-pages 變更）
> Baseline: HEAD = origin/main = `b6f5c59` —— `docs(download): decide asset form registry schema`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **docs-only registry JSON preanalysis**：在 am-4 schema decision 已 docs-accepted 之基礎上，為未來實際建立 `content/settings/download-assets.json` 與 `content/settings/download-forms.json` 兩個 registry JSON 之**空檔形狀**、**最小可用形狀**、**loader missing-file 行為**、**empty registry validation 行為** 等前置設計做 docs-only 裁決，使下一個保守 phase（registry JSON acceptance read-only 或實體建檔 docs-only implementation plan）可在固定行為契約上展開。
- 本文件**不**建立任何 registry JSON 實體檔；**不**改任何 source / content / settings / templates / fixture / renderer / Admin / package / dist / gh-pages。
- 本 phase **不**新增 validator rule；**不**改 baseline。預期維持 **0 errors / 47 warnings / 42 posts**。
- 本文件之**唯一裁決對象**為「未來 registry JSON 落地前須先固化之**空檔行為**、**loader 行為**、**validator interaction 行為**、**ID 命名策略**、**unknown / forbidden field 政策**」；不裁決 schema 欄位字典（已由 am-4 §5 / §6 / §7 定稿）。
- 本檔落地後 production state drift = 0；唯一變更為新增本 docs 檔。

### 1.1 一句話裁決

> **未來建立 registry JSON 須先固化 empty registry 形狀（`{ schemaVersion: 1, updatedAt: "", assets|forms: [], notes: "" }`）、loader missing-file 為 silent fallback、empty registry 不觸發 warning、ID 採 kebab-case + 不限定 prefix、unknown field 採 warn-only + 不做 PII regex、forbidden field 採 schema 設計面預防而非 runtime scan；任何實作步驟須等本 phase landed + user explicit approval 後另開獨立 phase。**

---

## 2. Decision Inputs

### 2.1 am-4 schema decision 已裁決內容

per `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（am-4；HEAD `b6f5c59`）：

| 範疇 | 裁決 | 本 phase 引用之段落 |
|------|------|------------------|
| registry location | `content/settings/download-assets.json` + `content/settings/download-forms.json`（Option A 平鋪 settings） | am-4 §3.3 |
| schemaVersion | 必填；integer；初版 `1` | am-4 §4.2 |
| updatedAt | 必填欄位 / 值可為空字串；ISO 8601 | am-4 §4.2 |
| assets[] / forms[] | 必填欄位 / 值可為空陣列 | am-4 §4.2 |
| notes | optional；string；不存 PII | am-4 §4.2 |
| DownloadAsset 欄位字典 | §5.1 表（13 欄；6 必填 + 7 選填） | am-4 §5.1 |
| FormConfig 欄位字典 | §6.1 表（11 欄；5 必填 + 6 選填） | am-4 §6.1 |
| forbidden fields | respondent data / Google Sheet rows / 私人備註 / 認證秘密 / 內部路徑（5 大類） | am-4 §8 |
| fileUrl grandfather | 既有 `download.fileUrl` 不立即 deprecate；A 與 B+C 可共存 | am-4 §9.3 / §9.4 |

### 2.2 am-5 acceptance 狀態

- am-5（registry schema decision acceptance read-only cross-check）已通過（per user 在本 phase 啟動時所述）。
- am-5 屬 read-only acceptance；不 commit；驗 am-4 之內部一致性 + 與既有 docs cadence 對齊 + baseline 不變。
- am-5 acceptance 結論：am-4 之 schema decision 可作為下一階段 docs-only preanalysis 之穩定 input。
- 本 phase（am-6）即為 am-5 acceptance 通過後之**下一個最保守 phase**，per am-4 §16.1 之推薦（「registry JSON preanalysis docs-only」）。

### 2.3 既有相關 docs 之關係

| 既有 docs | 本文件之關係 |
|----------|------------|
| am-2（landing/asset/form registry preanalysis） | 沿用 §5 之邊界圖；本文件聚焦於「**JSON 實體建檔前**」之 docs-only 設計 |
| am-4（schema decision） | 直接 input；本文件**不**重做欄位字典 / enum / forbidden 裁決；僅引用 |
| night-7（preview-url-risk policy） | 沿用 §F 之 future implementation gate；本文件之 registry-based preview-risk-rule 仍為**未來** validator 範疇 |
| am-7 / am-13 / night-5（D1 / D2 / D3 / S validator） | 不變；本文件**不**改 D1 / D2 / D3 / S 之語意、命名、實作 |
| `docs/admin-2-write-pre-analysis.md` | 沿用 read-only first / Admin Apply dormant 之 governance；本文件不擴張 Admin 範疇 |
| `docs/phase-2-candidate-roadmap.md` | 沿用「會員 / 留言 / 後端」不在第一版範圍之原則；本文件不為 paid / member-only 預留 schema |

---

## 3. Why This Phase Is Preanalysis Only

### 3.1 為何現在不直接建立 JSON

跳過本 phase 直接進「實體 JSON 建檔」會碰到下列**未裁決**問題：

| 未裁決問題 | 影響 |
|-----------|------|
| empty registry 之 acceptable shape 未定義 | 若 `assets: []` / `forms: []` 直接 commit，未來 loader / validator 是否視為「合法 empty」？是否 warn？schema validation 是否通過？ |
| loader missing-file 行為未定義 | 若兩 JSON 尚未建檔但 future loader 已落地，是否 fail closed？warn？silent fallback？對 baseline 之影響？ |
| empty registry 對 validate baseline 影響未估算 | empty registry 是否會「**單純存在**」即觸發 unknown rule warning？baseline +/- 多少？ |
| fixture 策略未定義 | 是否需要 negative fixture（duplicate id / forbidden field）？fixture 何時建立？是否與 validator source phase 同步？ |
| registry JSON 過早成為 source of truth 之風險 | 一旦 JSON 存在 git history，未來 schema 變更須走 schemaVersion bump；過早建檔等於凍結初版 schema |

### 3.2 為何 docs-only 在此 cadence 為正確選擇

- mirror 既有 am-2（entity preanalysis）→ am-4（schema decision）→ am-5（acceptance read-only）→ am-6（registry JSON preanalysis）之 4-step docs-only 推進。
- mirror night-3（D3+S1+S2 decision preanalysis）→ night-5（source）/ night-6（acceptance）/ night-7（preview-risk policy docs-only）之「先把 acceptable shape docs 化、再下一步 source」cadence。
- 本 phase 之輸出為「**未來 registry JSON 落地時須遵守之行為契約**」；validator source phase / loader source phase 之啟動須等本契約 docs-accepted。

### 3.3 本 phase 不裁決之事項

本 phase 不裁決下列事項；屬未來 docs-only 子 phase / source phase 範疇：

- ❌ 是否「先建 empty registry」還是「先建 minimal registry」（屬下一 docs-only phase；本文件僅提示 strong default 為 empty）
- ❌ 是否需要兩檔合併為單檔（已由 am-4 §3.3 裁決為**分檔**；本文件沿用）
- ❌ 是否需要 registry README（屬未來 docs-only 子 phase）
- ❌ unknown-field 之具體 warn id 命名（屬未來 validator source phase）
- ❌ forbidden-field 之 token-like-pattern regex（屬未來 validator source phase）
- ❌ ID 命名之最終 enforce 機制（kebab-case 規範由 am-4 §5.1 / §6.1 已定；validator enforce 屬未來 source phase）

---

## 4. Target Registry Files

### 4.1 Future target file paths

| Future file path | 性質 | 內容 |
|-----------------|------|------|
| `content/settings/download-assets.json` | settings registry；單檔 | DownloadAsset entry 陣列 + schemaVersion + updatedAt + notes |
| `content/settings/download-forms.json` | settings registry；單檔 | FormConfig entry 陣列 + schemaVersion + updatedAt + notes |

### 4.2 本 phase 不建立這兩個檔案

- ❌ **不**新增 `content/settings/download-assets.json`。
- ❌ **不**新增 `content/settings/download-forms.json`。
- ❌ **不**新增任何其他 registry candidate path（如 `content/registries/*.json` / `content/settings/download/*.json`）。
- 本 phase 僅 docs 化「**如果**未來建立，會放這兩個路徑」之行為契約；實際建檔須等下一獨立 phase + user explicit approval。

### 4.3 為何作為 settings registry 而非 content post

- 對齊 CLAUDE.md §3.2 settings 集中管理原則：既有 settings（categories / tags / promotion / ga4 / ads / link-rules）皆為 `content/settings/*.json`，本 registry 沿用同 pattern。
- registry 為**全站共用之 entity 資料表**；非個別文章內容；不適合放 `content/{site}/posts/`。
- registry 受 `load-settings.js`（未來擴張）讀取，而非 `load-posts.js`；二者 loader 為不同 surface。

### 4.4 兩檔不得包含 respondent data

per am-2 §4.1 / am-4 §8.1 / pm-20 §4 R1 紅線：

- ❌ 不得含 form 填寫者 email / 姓名 / 電話 / 學校等個資。
- ❌ 不得含 Google Sheet response rows / sheetId。
- ❌ 不得含「N 人下載」之 raw count。
- ❌ 不得含 form owner Google Account email / access token / OAuth secret。
- 即使作者明示願意公開個資，registry 之**欄位設計**不為其提供承載空間。

---

## 5. Empty Registry Shape

### 5.1 未來 empty registry 之可接受概念形狀

`content/settings/download-assets.json`（未來；本 phase 不建立）：

```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "",
  "assets": [],
  "notes": ""
}
```

`content/settings/download-forms.json`（未來；本 phase 不建立）：

```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "",
  "forms": [],
  "notes": ""
}
```

### 5.2 各欄位之 empty 可接受性裁決

| 欄位 | 是否可為空陣列 / 空字串 | 裁決理由 |
|------|---------------------|---------|
| `schemaVersion` | ❌ 不可空；不可缺 | 必填；為未來 migration gate；缺值會破壞 loader contract |
| `updatedAt` | ✅ 空字串可接受 | mirror pm-16 §8.3 之 placeholder 政策；作者 / Admin 可未來回填；validator 不對空值 warn |
| `assets[]` / `forms[]` | ✅ 空陣列可接受 | empty registry 即為 P3-like fixture-only phase 之 baseline；不應因「無 entry」而 warn |
| `notes` | ✅ 空字串可接受；亦可省略整個 key | optional 欄位；不存 PII；無 entry 時可省略 |

### 5.3 Empty registry 是否應觸發 validate warning

**裁決：empty registry 不應觸發 warning。**

理由：

- empty registry 之語意為「**系統已開出 registry 空間，但作者尚未填入任何 entry**」；屬合法初始狀態。
- 若 empty 即 warn，會在「registry JSON 建檔但無 entry」與「registry JSON 完全未建檔」兩狀態間造成 baseline 不穩定（每次切換差 1 warning）；非設計目的。
- 對 baseline 之影響：empty registry 不變 baseline；維持 0 errors / 47 warnings / 42 posts。

### 5.4 Empty registry 是否應視為「系統尚未啟用」

**裁決：是；但僅為 Admin display 之 hint，validator 不視為 warning 觸發條件。**

行為層：

- Admin（未來）可在 asset / form picker 顯示「目前 registry 尚無 entry；點此新增」之 placeholder UI。
- validator 不對 empty registry warn；不對「post 引用了 ref 但 registry empty」做特殊化處理（屬下一段 §8 之 ref-not-found 範疇）。
- Renderer（未來）對 empty registry 之行為：若 post 未引用任何 ref → render 不受影響；若 post 引用 ref 但 registry empty → render fallback（per §17 之 renderer 範疇）。

### 5.5 updatedAt 空字串是否可接受

**裁決：可接受（與 pm-16 §8.3 一致）。**

理由：

- mirror 既有 placeholder cadence；不為 author 增加 ceremony。
- 未來 Admin 可於 read-only 顯示「（未填）」之提示；不對外 render。
- validator 不對 `updatedAt: ""` warn；若未來想 enforce，須走 schemaVersion bump + 明示遷移 phase。

---

## 6. Minimal Registry Shape

### 6.1 未來 minimal registry 之可接受概念形狀

`content/settings/download-assets.json`（未來；本 phase 不建立）：

```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "2026-06-XX",
  "assets": [
    {
      "assetId": "<kebab-case-id>",
      "title": "<顯示用標題>",
      "assetType": "pdf",
      "deliveryMode": "direct-download",
      "publicUrl": "https://...",
      "status": "draft"
    }
  ],
  "notes": ""
}
```

`content/settings/download-forms.json`（未來；本 phase 不建立）：

```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "2026-06-XX",
  "forms": [
    {
      "formId": "<kebab-case-id>",
      "title": "<顯示用標題>",
      "provider": "google-forms",
      "publicFormUrl": "https://...",
      "purpose": "<表單用途說明>",
      "status": "draft"
    }
  ],
  "notes": ""
}
```

### 6.2 Required fields 之最小集合

per am-4 §5.1 / §6.1：

- DownloadAsset minimal required：`assetId` / `title` / `assetType` / `deliveryMode` / `publicUrl` / `status`（6 欄）。
- FormConfig minimal required：`formId` / `title` / `provider` / `publicFormUrl` / `purpose` / `status`（5 欄）。
- 本 phase 不擴張 / 不縮減 required 集合。

### 6.3 Optional fields 之空值策略

| 欄位類型 | 空值 strategy | 範例 |
|---------|--------------|------|
| optional string | `""` 或省略 key 皆可 | `notes`, `owner`, `privacyNote` |
| optional string[] | `[]` 或省略 key 皆可 | `fileFormat`, `linkedAssetIds` |
| optional nullable URL | `null` 或 `""` 或省略 key 皆可 | `canonicalDownloadUrl`, `previewUrl`, `embedUrl` |
| optional number | 省略 key 或填 `0` 皆可（但 `0` 與 isBundle=true 衝突屬 future validator 範疇） | `fileCount` |
| optional boolean | 省略 key（不顯式填 `false`） | `isBundle` |
| optional enum | 省略 key（會 fallback 至預設值） | `accessLevel`（預設 `public`） |

### 6.4 Status 初始值之 draft / active / archived 使用方式

per am-4 §7.4：

- 新建 entry 之 status **預設 `draft`**：避免被 ready/published post 引用前先確認資料完整性。
- entry 經作者驗證可用 → 切 `ready`：可被 ready post 引用；尚未正式對外。
- entry 對應到 published post + 公開 URL 可用 → 切 `published`。
- entry 不再使用 → 切 `archived`：保留歷史 ref 解析；不在 picker 顯示。
- ⚠️ **與 post status 對齊**：post status 為 `draft` / `ready` / `published` / `archived`（per CLAUDE.md §23），entry status 同 4 值；便於 cross-validation。

### 6.5 本 phase 只在 docs 中示意

- ❌ 不新增 JSON 實體檔。
- ❌ 不新增 fixture。
- ❌ 不新增 post 引用 assetRefs / formRef 之示意。
- 本節形狀僅作為「未來建檔時應達到之最小可用狀態」之 docs 化參考；不代表本 phase 已建檔。

---

## 7. Missing Registry File Behavior

### 7.1 Future loader 面對缺檔之行為裁決

| 情境 | Loader 行為 | Validator 行為 | Renderer 行為 |
|------|-----------|---------------|-------------|
| `download-assets.json` 不存在 | **silent fallback** → return `{ schemaVersion: 0, assets: [] }` 之 in-memory 結構 | **不**主動 warn；除非有 post 引用 `assetRefs[]` 而 loader 回傳 empty | 若 post 無引用 → render 不受影響；若 post 有引用 → fallback link to raw URL 或顯示 placeholder |
| `download-forms.json` 不存在 | **silent fallback** → return `{ schemaVersion: 0, forms: [] }` | 同上；除非有 post 引用 `formRef` | 同上 |
| 兩檔皆不存在 | 兩 loader 皆 silent fallback | 不 warn | render 不變 |
| 檔存在但 JSON parse 失敗 | **fail closed**：throw with file path + parse error | 不執行 validator；屬 build 階段 fatal error | 不執行 build |
| 檔存在但 top-level shape 不對（如缺 `assets` 欄位） | **warn at load**：`registry-shape-invalid` 之 future warn id | validator 視為 empty registry 處理 | render fallback as missing |

### 7.2 目前階段是否應 warn

**裁決：目前階段（即「兩 JSON 皆未建檔」之 baseline）不應 warn。**

理由：

- 目前 baseline 為 0 errors / 47 warnings / 42 posts；無 post 引用 `assetRefs[]` / `formRef`；無 loader source；無 validator rule。
- 對 missing file 直接 warn 等於要求作者「先建空檔」才能避免 warning；屬不必要 ceremony。
- am-4 §10.2 已明示「未來 P5（validator source）才會新增 A / F 規則」；本 phase 不改 baseline。

### 7.3 未來何時開始 warn

未來 warn 之啟動條件（屬未來 docs-only sub-phase 之裁決範疇；本 phase 僅列候選）：

| 候選 trigger | 是否合理 | 啟動條件 |
|------------|---------|---------|
| 一旦 loader source 落地 → 對 missing file warn | 🔴 不合理；會在「loader 落地」與「JSON 建檔」之間造成 baseline drift | 不採 |
| 一旦 post frontmatter 加入 `assetRefs[]` / `formRef` schema → 對 missing file warn | 🟡 可考慮；但須與 post schema 變更同步 | 屬 P5 validator source phase 之 sub-decision |
| **只有當** post 引用了 `assetRefs[]` / `formRef` 且 lookup 失敗 → warn `download-assetref-not-found` / `download-formref-not-found` | 🟢 推薦；對 baseline 之影響可預測 | 屬 P5 validator source phase |
| 強制要求「兩 JSON 至少建空檔」才能執行 build | 🔴 不合理；違反 grandfather 原則 | 不採 |

### 7.4 是否只有 post 引用時才檢查 registry

**裁決：是。**

行為層：

- validator 對 registry 之檢查須**by demand**：post 引用了 ref → 才 lookup → 才有可能 warn。
- 若無 post 引用 → registry 之 missing / empty / shape-invalid 皆不影響 baseline。
- 此 cadence 對齊既有 D1 / D2 / D3 / S 之「**by post**」檢查 cadence；mirror 既有 validator 之 per-post iteration pattern。

---

## 8. Empty Registry Validation Behavior

### 8.1 行為裁決

| 情境 | Validator 行為 | 理由 |
|------|---------------|------|
| registry 存在 + `assets: []` / `forms: []` | **不** warn | empty registry 為合法 acceptable shape；屬「系統開出空間但作者尚未填入」之初始狀態 |
| registry 存在 + 有 entry，但 post 引用之 assetId / formId 不在 registry 內 | **warn**（屬未來 `download-assetref-not-found` / `download-formref-not-found`） | ref 解析失敗為 actual integrity error；應 warn |
| registry 存在 + 有 entry，但 post 未引用任何 ref | **不** warn | registry 為 source of truth；post 不引用屬正常使用 case |
| registry 不存在 + post 未引用 ref | **不** warn | grandfather case；不擾動既有 baseline |
| registry 不存在 + post 引用 ref | **warn**（屬未來 `download-assetref-not-found` / `download-formref-not-found`） | 與 §7.1 之 silent fallback + lookup 失敗一致 |

### 8.2 為何 empty registry 不應 warn

- 對 baseline 之影響：empty registry 不變 baseline。
- 對 author cadence 之影響：作者建空檔後可逐步補 entry；不應因「無 entry」而被 warn 阻擋。
- 對 cross-phase consistency 之影響：empty registry 與 missing registry 在 baseline 上應為**同義**（皆不 warn），降低 baseline 不穩定。

### 8.3 未來導入 registry JSON 之 phase 須明確預告 baseline 影響

每個未來 docs-only / source phase 須在 preanalysis 內明示：

- 預期 baseline 增量（errors / warnings / posts）。
- 是否新增 fixture（對 posts 數量之影響）。
- 是否新增 warn rule（對 warnings 數量之影響）。
- 是否影響既有 D1 / D2 / D3 / S 之 warn count（應**不**影響；additive only）。

對齊既有 cadence（am-7 / am-13 / night-5 之每篇 preanalysis 皆明示 baseline 增量）。

---

## 9. ID Naming Strategy

### 9.1 ID 命名 syntax 裁決

per am-4 §5.1 / §6.1：

- `assetId` / `formId` 採 **kebab-case**：`^[a-z0-9]+(-[a-z0-9]+)*$`
- 不得空字串 / 空白 / 純空白。
- 不得重複（registry 內 unique）。

### 9.2 ID 命名建議格式

| 欄位 | 建議 pattern | 範例 |
|------|------------|------|
| `assetId` | `<topic-slug>-<format>-<version>` | `phonics-cards-zip-v1` / `number-flashcards-pdf-v2` |
| `formId` | `<purpose-slug>-<form>-<version>` | `phonics-teacher-form-v1` / `mooncake-diy-signup-v1` |

### 9.3 是否使用日期 prefix

**裁決：不強制；建議**不**用日期 prefix。**

理由：

- entry 在 registry 內為「**長期存活**」之資產 metadata；非單篇文章。
- 日期 prefix（如 `20260531-...`）會誘導作者把 entry 視為 dated event；不對應 entity 性質。
- 若需要追溯建檔時間，由 git history + `updatedAt` 欄位承擔。

### 9.4 是否使用 slug

**裁決：是；ID = 純 slug。**

理由：

- kebab-case slug 為 URL-safe / cli-safe / loader-safe；無 escape 風險。
- 與 post slug cadence 一致；作者 mental model 連貫。
- 若 entry 需多語顯示，由 `title` / `titleEn` 等顯示欄位承擔（per am-4 §15.9 之 single-language default；未來可擴張）。

### 9.5 是否允許中文

**裁決：不允許。**

理由：

- ID 為 lookup key；非顯示用；中文會增加 URL encoding / file path encoding 之 edge case。
- 中文 entry 描述由 `title` 欄位承擔；ID 維持 ASCII kebab-case。
- 對齊既有 categories.json / tags.json 之 ID cadence（皆為 ASCII slug）。

### 9.6 是否需要唯一性檢查

**裁決：是；屬未來 validator rule（候選 warn id：`download-registry-duplicate-id`）。**

範圍：

- registry 內 `assetId` unique。
- registry 內 `formId` unique。
- cross-registry 不要求 unique（asset 與 form 可同名，但建議避免，作者 mental model 較清楚）。

本 phase 不實作。

### 9.7 是否需要 case-sensitive

**裁決：case-sensitive；但 syntax 限制為 lowercase only。**

- 由於 kebab-case syntax 已要求 lowercase（per §9.1 之 regex `^[a-z0-9]+(-[a-z0-9]+)*$`），實務上 ID 必為 lowercase。
- loader / validator 之 lookup 為 case-sensitive；無需做 normalization。
- 若作者誤填 `PhonicsCards` 之 ID → syntax check 即拒絕；不會進入 lookup 階段。

### 9.8 是否禁止空白與特殊字元

**裁決：是；由 regex `^[a-z0-9]+(-[a-z0-9]+)*$` 強制。**

- 不允許：空白 / `_` / `.` / `/` / 中文 / emoji / Unicode 符號 / 大寫字母。
- 允許：`a-z` / `0-9` / `-`（hyphen，僅作為 word separator；不可開頭 / 結尾 / 連續兩個）。

### 9.9 ID enforce 機制

本 phase 不實作 enforce；屬未來 validator source phase 範疇。候選 warn id：

- `download-registry-asset-id-invalid-syntax`
- `download-registry-form-id-invalid-syntax`
- `download-registry-asset-id-duplicate`
- `download-registry-form-id-duplicate`

---

## 10. Unknown Field Policy

### 10.1 行為裁決

**裁決：unknown field 採 warn-only；不 fail；不忽略（記錄到 warning）。**

理由：

- unknown field warn 為「**schema drift 之 early warning**」；提示作者「填入欄位非 schema 已定義；可能是錯字或新欄位需求」。
- ignore 等於 silent acceptance；schema drift 風險高。
- fail 等於 reject；schema 演化過程中（新增欄位之過渡期）會誤拒合法輸入。
- warn-only 為三者之平衡：作者可見、可選擇處理、不阻擋。

### 10.2 unknown field 是否可能造成隱私風險

**裁決：是；高風險。**

理由：

- 若 schema 之 forbidden field 名（如 `respondentEmails`）被作者誤填，unknown-field warn 是**唯一**自動偵測機會。
- warn 不對 free-text 內容做 PII regex；僅對 field name 做 schema check；屬「**欄位名層級之間接防護**」。
- 對 R1 紅線之守護效果：⭐⭐⭐（schema 設計面 + 欄位名 warn 雙層）。

### 10.3 是否需要 allowlist

**裁決：是；以 am-4 §5.1 / §6.1 之欄位字典為 allowlist。**

allowlist scope：

- DownloadAsset entry：13 欄（per am-4 §5.1）。
- FormConfig entry：11 欄（per am-4 §6.1）。
- 頂層 registry shape：`schemaVersion` / `updatedAt` / `assets|forms` / `notes`（per am-4 §4.1）。

allowlist enforce 機制屬未來 validator source phase；本 phase 不實作。

### 10.4 是否需要 forbidden field scan

**裁決：不需要 runtime scan；改採「schema 設計面 + Admin UI 白名單 + unknown-field warn」三層防護。**

理由：

- runtime forbidden field name scan 易為 cat-and-mouse game（作者可改名繞過）；ROI 低。
- schema 設計面（am-4 §8）已明示禁止欄位；作者直接讀 schema 即知邊界。
- Admin UI（未來）白名單僅顯示 allowlist 欄位；作者不易塞入 forbidden field。
- unknown-field warn 自然 cover「作者誤填欄位」之 case；無需獨立 forbidden field scan。

### 10.5 本 phase 不實作

- ❌ 不新增 unknown-field warn rule。
- ❌ 不新增 forbidden field scan。
- ❌ 不擴張 `src/scripts/validate-content.js` 之欄位字典。
- 上述屬未來 validator source phase 範疇。

---

## 11. Forbidden Data Scan Strategy

### 11.1 防護目標

避免下列 forbidden 內容進入 registry JSON：

| 類別 | 範例 | 紅線 |
|------|------|------|
| Respondent data | email / 姓名 / 電話 / 學校 / 答覆內容 | 🔴 R1 |
| Google Sheet 後台類 | sheetId / response rows / 填寫統計 raw count | 🔴 R1 |
| 私人備註類 | 某 person identify 之自然語言 | 🔴 R1 |
| 認證秘密類 | access token / API key / OAuth secret / 帳號 email | 🔴 R1（延伸） |
| 內部路徑類 | 本機 Windows / macOS path / OneDrive personal path | 🟡 中（屬隱私延伸） |

### 11.2 防護策略

**裁決：採「**欄位名 allowlist + Admin UI 白名單 + unknown-field warn + schema 設計面預防**」四層；不採 runtime content scan。**

四層說明：

1. **欄位名 allowlist**（per §10.3）：unknown 欄位名觸發 warn；作者可見即修正。
2. **Admin UI 白名單**（未來）：input 只接受 allowlist 欄位；free-text 加 placeholder 提示「不可填個資」。
3. **schema 設計面預防**（am-4 §6.4）：`requiredFieldsSummary` 為文字 / 非結構化，避免誘導作者列舉真實 answer。
4. **unknown-field warn**（未來 validator source phase）：對 schema drift 提供 early warning。

### 11.3 不掃描自然語言個資

**裁決：不掃描。**

理由：

- runtime PII 偵測為 ML / regex 雙難題；偽陽 / 偽陰皆嚴重。
- registry 為 author-edited；作者本人對紅線負責；mirror 既有 markdown 內容之 PII 處理 cadence（系統不對文章內容做 PII scan）。
- ROI 不對等；不採。

### 11.4 不導入 Google Sheet rows

**裁決：永不導入。**

- 即使 author 明示「我想把這 100 筆下載統計放進 registry」也不採；屬 R1 紅線。
- 統計分析走 GA4 / Google Sheets / 外部 BI 工具；BLOG 系統永不承擔。

### 11.5 不保存 token / secret

**裁決：永不保存。**

- 即使加密儲存亦不採；secret management 屬秘密管理範疇（Vault / Secret Manager 等），不屬 git history。
- `notes` / `owner` 欄位之 free-text 由作者本人守線；schema 之欄位設計不為其提供承載空間（per am-4 §5.4 / §6.2）。

### 11.6 不保存私有 Drive 權限資訊

**裁決：永不保存。**

- 即使是 Drive folder ID 之**已分享**版本，亦不直接 commit；改以 `publicUrl` 形式表達。
- 私人權限 ID / 帳號 email / OAuth scope 等屬秘密；永不進 git。

### 11.7 Future validator 可以先做欄位名層級檢查

候選 future warn id（屬未來 validator source phase；本 phase 不實作）：

- `download-registry-unknown-field`：entry 出現不在 allowlist 之欄位。
- `download-registry-forbidden-field-name`：entry 出現屬 forbidden field name 黑名單之欄位（如 `respondentEmails` / `accessToken`）。

注意：

- 上述 rule 只做**欄位名**層級檢查；不做**內容**層級之 PII regex。
- forbidden field name 黑名單之**內容**屬未來 validator preanalysis 範疇；本 phase 不裁決完整黑名單清單。

---

## 12. Future Loader Design

### 12.1 Future loader 之 read / parse / validate / lookup 流程

未來 loader source 可遵守之行為契約（mirror 既有 `load-settings.js` cadence）：

```text
1. 嘗試 read JSON file
   ├─ file missing → silent fallback to { schemaVersion: 0, assets|forms: [] }
   └─ file exists → 進入 parse
2. parse JSON
   ├─ parse error → throw with file path + parse error（fail closed）
   └─ parse OK → 進入 top-level shape validate
3. validate top-level shape
   ├─ shape invalid（如缺 schemaVersion / assets / forms key） → warn `registry-shape-invalid`；視為 empty registry 處理
   └─ shape OK → 進入 index
4. index by assetId / formId
   ├─ duplicate id → warn `download-registry-asset-id-duplicate` / `download-registry-form-id-duplicate`
   └─ unique id → 建立 in-memory Map<id, entry>
5. provide lookup function
   ├─ getAssetById(id) → entry | null
   └─ getFormById(id) → entry | null
```

### 12.2 Fail closed vs warn-only

**裁決：**

| 情境 | 行為 |
|------|------|
| file missing | warn-only（silent fallback；不 fail） |
| parse error | **fail closed**；throw with file path |
| top-level shape invalid | warn-only；視為 empty registry |
| schemaVersion mismatch | warn-only；視為當前版本處理；未來 migration phase 才升級 |
| duplicate id | warn-only；lookup 取**第一個**為 winner（明示 deterministic） |
| invalid id syntax | warn-only；entry 仍進入 index（避免 lookup 失敗） |

### 12.3 Missing file fallback 之 in-memory shape

```jsonc
// 未來 loader 之 in-memory fallback（本 phase 不實作）
{
  "schemaVersion": 0,           // 0 = 「檔不存在」標記
  "updatedAt": "",
  "assets": [],                 // 或 forms: []
  "notes": "",
  "_source": "missing-file"     // optional metadata；非 schema 一部分
}
```

`schemaVersion: 0` 為 sentinel；表「檔不存在」；不與正式 `schemaVersion: 1` 衝突。

### 12.4 Loader 與既有 `load-settings.js` 之關係

- 既有 `load-settings.js` 讀取 categories / tags / promotion / ga4 / ads / link-rules 等 settings。
- 未來 registry loader 可**擴張** `load-settings.js`（mirror 既有 pattern），或新建獨立 `load-download-registry.js`。
- 選擇屬未來 source phase 之 implementation detail；本 phase 不裁決。

### 12.5 本 phase 不新增 loader source

- ❌ 不新增 `src/scripts/load-download-registry.js`。
- ❌ 不擴張 `src/scripts/load-settings.js`。
- ❌ 不改 `src/scripts/load-posts.js`。
- 本節為**未來** loader 之行為契約；任一 source 落地須等獨立 phase + user explicit approval。

---

## 13. Future Validation Rules

### 13.1 候選 future warn id 清單

| 候選 warn id | 觸發條件 | 前置條件 |
|-------------|---------|---------|
| `download-asset-registry-missing` | `download-assets.json` 不存在 + post 引用 `assetRefs[]` | 屬「missing file + by-demand」cadence；可能與 `download-assetref-not-found` 合併 |
| `download-form-registry-missing` | `download-forms.json` 不存在 + post 引用 `formRef` | 同上 |
| `download-asset-id-not-found` | `assetRefs[i]` 設值但 registry 內無對應 `assetId` | DownloadAsset registry JSON 已落地 + post schema 加 `assetRefs[]` |
| `download-form-id-not-found` | `formRef` 設值但 registry 內無對應 `formId` | FormConfig registry JSON 已落地 + post schema 加 `formRef` |
| `download-asset-inactive` | `assetRefs[i]` 之 asset `status === 'archived'` 且 post status=ready/published | DownloadAsset registry 落地 + ref 解析成功 |
| `download-form-inactive` | `formRef` 之 form `status === 'archived'` 且 post status=ready/published | FormConfig registry 落地 + ref 解析成功 |
| `download-registry-unknown-field` | registry entry 出現非 allowlist 欄位 | registry loader + allowlist 落地 |
| `download-registry-forbidden-field` | registry entry 出現 forbidden 欄位 name 黑名單 | registry loader + 黑名單 docs 化 |
| `download-registry-duplicate-id` | 同 registry 內 ID 重複 | registry loader 落地 |
| `download-preview-url-risk-via-delivery-mode` | `assetRefs[i]` 之 asset `deliveryMode === 'google-drive-preview'` | DownloadAsset registry 落地 + ref 解析成功 |

### 13.2 階段化規劃

| 階段 | 可實作之候選 | 啟動條件 |
|------|-----------|---------|
| **早期可實作**（registry 一落地即可） | `download-registry-unknown-field`、`download-registry-duplicate-id`、`download-registry-forbidden-field` | registry JSON 落地（含 empty）+ loader source 落地 |
| **需等 post frontmatter 支援 assetRefs/formRef** | `download-asset-registry-missing`、`download-form-registry-missing`、`download-asset-id-not-found`、`download-form-id-not-found`、`download-asset-inactive`、`download-form-inactive` | 上一行 + post schema 加 `assetRefs[]` / `formRef` |
| **需等 renderer / landing page** | （無；上述 rules 皆與 render 解耦） | — |
| **目前不應實作** | 所有上述 rule（本 phase 為 docs-only） | — |

### 13.3 已落地 D1 / D2 / D3 / S 規則不變

- 本 phase **不**改 `src/scripts/validate-content.js`。
- 既有 D1（`download-enabled-fileurl-empty`）/ D2（`download-fileurl-invalid-type`）/ D3（`download-fileurl-invalid-format`）/ S（`download-content-should-be-noindex`）規則對 `download.fileUrl` 之檢查**繼續有效**；未來 registry-based rules 為 **additive only**；不退化、不重做。

### 13.4 共存 case 之處理（fileUrl + assetRefs[]）

未來若 post 同時有 `fileUrl` 與 `assetRefs[]`：

- 候選 warn id：`download-fileurl-and-assetrefs-coexist`（severity=warning，提示作者擇一）。
- 屬非阻擋型 hint；不 error。
- 屬未來 validator source phase 之 sub-decision；本 phase 不裁決最終命名。

---

## 14. Fixture Strategy

### 14.1 未來 fixture 候選

| Fixture 類型 | 目的 | 候選 path（未來；本 phase 不建立） |
|------------|------|----------------------------------|
| Empty registry fixture | 驗 loader 對 empty registry 之 silent fallback | `content/validation-fixtures/settings/_test-download-assets-empty.json` |
| Minimal valid registry fixture | 驗 loader 對 minimal valid registry 之 lookup | `content/validation-fixtures/settings/_test-download-assets-minimal.json` |
| Duplicate id fixture | 驗 `download-registry-duplicate-id` warn | `content/validation-fixtures/settings/_test-download-assets-duplicate-id.json` |
| Forbidden field fixture | 驗 `download-registry-forbidden-field` warn | `content/validation-fixtures/settings/_test-download-assets-forbidden-field.json` |
| Missing id fixture（post 引用 + registry 無對應） | 驗 `download-asset-id-not-found` warn | `content/validation-fixtures/blogger/posts/_test-download-asset-id-not-found.md` |
| Inactive asset/form fixture | 驗 `download-asset-inactive` / `download-form-inactive` warn | `content/validation-fixtures/blogger/posts/_test-download-asset-archived.md` |
| Preview-url-risk via deliveryMode fixture | 驗 `download-preview-url-risk-via-delivery-mode` warn | `content/validation-fixtures/blogger/posts/_test-download-asset-preview-mode.md` |

### 14.2 Fixture 之 sub-cadence

- fixture 為**負面樣本**（intentional fail）；driven by validator 之預期 warn。
- positive fixture（即正常通過 validator 之 ready post）**不**作為 fixture；屬正常 content。
- mirror 既有 D1 / D2 / D3 / S fixture cadence（per `content/validation-fixtures/`）。
- fixture 命名沿用 `_test-<warn-id-related>.md` 或 `_test-<warn-id-related>.json` cadence。

### 14.3 Settings fixture 之新議題

既有 `content/validation-fixtures/` 僅有 `blogger/posts/`；無 `settings/` 子目錄。若未來引入 registry fixture，需先裁決：

- fixture settings 是否影響既有 settings loader？（理論上應隔離；不污染 production loader）
- validator 如何切換「測 settings 之 fixture」vs「測 production settings」？（mirror 既有 post fixture 之 `validation-fixtures/blogger/posts/` 隔離 pattern）

上述屬未來 fixture-only phase 之 docs-only 子裁決範疇；本 phase 不裁決。

### 14.4 本 phase 不建立 fixture

- ❌ 不新增任何 `content/validation-fixtures/*` 之檔。
- ❌ 不擴張 `content/validation-fixtures/` 目錄結構。
- ❌ 不改 `src/scripts/validate-content.js` 之 fixture loading 邏輯。
- 上述 fixture 候選為**未來** fixture-only phase 之 input；任一啟動須獨立 phase + user explicit approval。

---

## 15. Backward Compatibility With `download.fileUrl`

### 15.1 既有 `download.fileUrl` 之 grandfather

per am-4 §9.3 + am-2 §11.1：

- 既有 `content/blogger/posts/20260529-phonics-practice-sheet-download.md`（目前唯一 download fixture）之 `download.fileUrl` **保留**；不主動 migration。
- D1 / D2 / D3 / S 對 fileUrl 之既有規則**繼續有效**；不退化、不重做。

### 15.2 未來即使 registry JSON 存在，亦不應立即要求所有 post migration

理由：

- 對既有作者 mental model 衝擊應最小化。
- 漸進策略（per am-4 §13）：P7 之內容 migration 為**逐篇** + **user explicit approval**；不批量 migration。
- 即使所有未來 phase 全部 landed，author 仍可選擇保留 grandfather 文章；不強制改寫。

### 15.3 Legacy fileUrl rule D1 / D2 / D3 維持

- D1 `download-enabled-fileurl-empty`：維持。
- D2 `download-fileurl-invalid-type`：維持。
- D3 `download-fileurl-invalid-format`：維持。
- 不退化、不重做、不調整。

### 15.4 Registry-based rules 不應破壞既有 posts

- 未來新增之 A / F 系列 rules 為**additive only**；不影響無引用 `assetRefs[]` / `formRef` 之既有 post。
- 對既有 fileUrl-only post：D / S 規則照常；A / F 規則完全不觸發。
- baseline 不退步。

### 15.5 共存 case 之裁決

- 若 post 同時有 `fileUrl` 與 `assetRefs[]` → 未來可加 warn `download-fileurl-and-assetrefs-coexist`（hint level；非阻擋）。
- 屬 P5 / P7 之 sub-decision；本 phase 不裁決命名。

---

## 16. Admin Implications

### 16.1 Admin 讀取 registry 之未來場景

per am-4 §11 + `docs/admin-2-write-pre-analysis.md`：

| 場景 | UI shape | 來源 |
|------|---------|------|
| Asset picker | dropdown / autocomplete；顯示 assetId + title + status chip | `download-assets.json`（read-only） |
| Form picker | dropdown / autocomplete；顯示 formId + title + provider chip | `download-forms.json`（read-only） |
| Source of truth display | 顯示 asset / form 之完整欄位（read-only） | 同上 |
| Status warning | asset / form 之 `status === 'archived'` 顯示「已封存」hint | 同上 |
| Privacy warning | `owner` / `notes` / `requiredFieldsSummary` input 加 placeholder 提示「不可填個資」 | UI-only convention |
| Empty registry hint | registry 為空時顯示「目前 registry 尚無 entry；點此新增」 | 同上 |
| Missing file hint | registry 檔不存在時顯示「registry 尚未啟用；點此初始化」 | 同上 |

### 16.2 Read-only first；no write until Admin write infra approved

- per `docs/admin-2-write-pre-analysis.md` §119 / §914 / §729：array-of-object + registry lookup 屬最高 write 複雜度；不適合作為首個 write feature 之基礎設施驗證載體。
- Admin Apply 仍 dormant；middleware write route 未啟用；admin-write-cli dormant。
- Registry 之 Admin write 屬未來獨立 phase；不在本 phase 範圍。

### 16.3 本 phase 不改 Admin

- ❌ 不新增 Admin UI component。
- ❌ 不改 Admin source。
- ❌ 不改 `admin-2-write-pre-analysis.md` allowed write scope。
- ❌ 不啟用 Admin Apply。
- ❌ 不啟用 middleware write route。
- ❌ 不執行 admin-write-cli dry-run / apply。

---

## 17. Renderer / Landing Page Implications

### 17.1 Renderer 讀取 registry 之未來場景

per am-4 §12 + am-2 §8：

| 場景 | 行為 |
|------|------|
| Asset lookup | render 時 lookup registry；組合 download button list |
| Form lookup | render 時 lookup registry；組合 form embed / link |
| Download CTA | 依 asset 之 `deliveryMode` + `assetType` 決定 button label + target / rel；`canonicalDownloadUrl` 優先於 `publicUrl` 作為 button href |
| Embedded form | 若 `formRef` 存在 → `<iframe src={form.embedUrl}>`；fallback link `form.publicFormUrl` |
| Noindex landing page | 強制 `<meta name="robots" content="noindex, follow">`；沿用 build-github.js 既有 fallback + S validation |
| GA4 event params | button click → `click_download_asset`（含 `asset_id` / `delivery_mode` / `placement`）；form submit → `submit_download_form`（含 `form_id` / `provider`）；landing page view → `view_download_landing` |

### 17.2 為何不在本 phase 設計 GA4 event param 細節

- GA4 event naming 屬獨立 surface（per `docs/seo-ga4-adsense.md` / `docs/ga4-link-tracking-spec.md`）；應與既有 GA4 event cadence 對齊。
- 本 phase 之裁決對 GA4 event 之依賴僅為「asset / form 有穩定 id」；event param 之精確命名留待 P6（renderer / GA4 phase）。

### 17.3 本 phase 不改 renderer

- ❌ 不新增 `src/views/pages/post-detail-download.ejs` / `src/views/blogger/blogger-post-download-*.ejs`。
- ❌ 不改 `src/views/pages/post-detail.ejs`。
- ❌ 不改 `src/scripts/build-github.js` / `build-blogger.js`。
- ❌ 不 build；不 deploy；不 Blogger repost。

---

## 18. Migration Plan

採 am-4 §13 之 8 階段保守策略；本文件對應 **P1 step**（registry JSON preanalysis docs-only）。

| Phase | 性質 | 範圍 | 預期 baseline | 啟動條件 |
|-------|------|------|------------|---------|
| **P1（本 phase）** | docs-only registry JSON preanalysis | empty registry shape / loader missing-file 行為 / validation 行為 / ID 策略 / unknown / forbidden 政策 / fixture 策略 | 不變 | ✅ 本 phase 即此 step |
| **P2** | read-only acceptance cross-check | 驗本文件之內部一致性 + 與 am-4 / am-2 / night-7 cadence 對齊；驗 baseline 不變 | 不變 | P1 landed + user explicit approval |
| **P3** | docs-only empty registry implementation plan | 為實際建立 empty registry JSON 做最後一份 docs-only plan（如建檔順序、commit message 慣例、push 順序） | 不變 | P2 landed + user explicit approval |
| **P4** | content / settings creation | 建立 empty `download-assets.json` / `download-forms.json`（schemaVersion + empty arrays + empty updatedAt + empty notes） | 不變（無 consumer） | P3 landed + user explicit approval |
| **P5** | minimal fixture-only registry | 為 validator source phase 預備 fixture（含 duplicate / forbidden / missing 等 negative fixture） | 不變（無 consumer） | P4 landed + user explicit approval |
| **P6** | validator source phase | 新增 registry loader + A / F 系列 rules + fixture wiring | +N warnings / +N posts（estimate 屬該 phase preanalysis 範疇） | P5 landed + user explicit approval |
| **P7** | post frontmatter ref schema | 加 `assetRefs[]` / `formRef` 至 post frontmatter；新建 1 篇 ready/published fixture 之 minimal use | 可能 +1 ~ +N warnings（per ref validation） | P6 landed + user explicit approval |
| **P8** | Admin read-only picker / renderer / deploy / Blogger repost / GA4 | UI + landing page + 對外發布 + GA4 驗收 | 行為層變動 | P7 landed + 各 sub-phase 之 user explicit approval + reverse UTM pm-26 deploy gate 處置確認 |

### 18.1 各 phase 啟動條件

- 任一 phase 之啟動須 user explicit approval；本 phase **不**預授權任何下游 phase。
- 對 reverse UTM 之關係：P8 涉 Blogger repost / GA4 validation；其啟動須與 reverse UTM dormant 狀態協調（不一定要解除 pm-26 gate，但須明示協調策略）。

### 18.2 既有 fileUrl 文章之 grandfather

- per §15：既有 `content/blogger/posts/20260529-phonics-practice-sheet-download.md` 不強制 migration。
- 即使 P8 全部落地，author 仍可選擇保留 grandfather 文章；不強制改寫。
- 對 P7 sub-phase：每篇必須 user 對該篇明示 approval；不批量 migration。

---

## 19. Acceptance Criteria for Future JSON Creation

未來真正建立 registry JSON（即 P4）時，須滿足以下 acceptance：

### 19.1 檔案數量

- **裁決：exactly two settings JSON files**（`download-assets.json` + `download-forms.json`）。
- 若未來 user 想合併為單檔（如 `download-registry.json`），須**明示**為例外決策 + 獨立 docs-only phase + 更新本文件之相關裁決。
- 預設為 two files；one-file 為例外。

### 19.2 No posts modified

- P4 不改任何 production post / draft post / archive。
- 即使作者想「順便補一篇 minimal use 之 download post」，須留至 P7 phase；不在 P4 內進行。

### 19.3 No fixtures unless separately approved

- P4 不建立 fixture；fixture 屬 P5 範疇。
- 若 P4 與 P5 合併執行（不推薦），須明示 baseline 增量並有 user explicit approval。

### 19.4 Validate baseline expected and documented

- P4 之 preanalysis 須明示「empty registry JSON 落地後 baseline 預期維持 0 errors / 47 warnings / 42 posts」。
- 實際 commit 前後須 `npm run validate:content` 驗證 baseline 不變。
- 若有任何 baseline 變動，須在 commit message + preanalysis 內明示原因。

### 19.5 No respondent data

- empty registry JSON 不含任何 entry；天然無 respondent data。
- 即使是 placeholder entry（如示意用），亦不含 respondent data。

### 19.6 No token / secret

- 無任何 access token / API key / OAuth secret / 帳號 email 進 git。
- `notes` / `owner` 欄位即使空字串，亦明示「不可放秘密」之 inline comment 或 README 提示。

### 19.7 Backward compatible with fileUrl

- P4 之 registry JSON 不改 D1 / D2 / D3 / S 之行為。
- 既有 fileUrl post 不受影響。
- baseline 不退步。

### 19.8 No deploy

- P4 不 `npm run build:*`；不 push gh-pages；不 Blogger repost；不 GA4 validation。
- 屬純 settings 檔變更；行為層無變動。

### 19.9 Acceptance cross-check required

- P4 落地後須有 read-only acceptance cross-check phase（mirror am-5 / am-8 / am-14 / night-6 cadence）。
- acceptance 驗 baseline 不變 + 檔內容符合 P3 之 plan + git 狀態乾淨。

---

## 20. Open Questions

下列為**待裁決**問題；本 phase **不**裁決；屬未來 P2 / P3 / P4+ phase 之輸入。

### 20.1 是否先建立 empty registry 還是 minimal registry？

- 候選 A：先建 empty registry（`{ schemaVersion: 1, assets: [], notes: "" }`）；無 entry；無 consumer。
- 候選 B：先建 minimal registry（含 1 個 placeholder entry）；提供作者直接 reference 之 sample。
- 推薦傾向：**A**（empty）；理由：天然無 respondent data 風險；無「placeholder 是否該保留 / 該刪除」之 ambiguity；baseline 完全不變。
- 最終裁決留待 P3 phase。

### 20.2 Two files vs one file 是否仍有例外？

- 已由 am-4 §3.3 裁決為**分檔**；本文件 §19.1 沿用 two files。
- 例外候選：合併為單檔 `download-registry.json` 含 `assets[]` + `forms[]`。
- 例外條件：若未來 user 明示偏好單檔 + 提出充分理由 + 獨立 docs-only phase + 更新本文件相關裁決。
- 短期內無調整動機。

### 20.3 updatedAt 空字串是否可接受？

- 本文件 §5.5 已裁決：**可接受**（與 pm-16 §8.3 一致）。
- 例外候選：強制非空（如 build 時 auto-fill `new Date().toISOString()`）。
- 例外條件：屬未來 P6 / P8 之 sub-decision；本 phase 不裁決。

### 20.4 Notes 是否應為 array or string？

- 本文件 §5.1 採 **string**（與 am-4 §4.1 一致）。
- 候選 alternative：array of string（如 `["備忘 1", "備忘 2"]`）。
- 推薦傾向：保持 **string**；簡單；無 JSON shape 複雜度。
- 若未來 notes 內容變長 / 需多筆，可考慮 array；屬未來裁決範疇。

### 20.5 Status 初始值是否 draft or active？

- 本文件 §6.4 採 **draft**（與 am-4 §7.4 一致）。
- 候選 alternative：active（直接可被 ready/published post 引用）。
- 推薦傾向：**draft**；避免新 entry 直接被引用；提供作者驗證資料完整性之 buffer。
- 「active」非 enum value（per am-4 §7.4 之 4 值：draft / ready / published / archived）；若採 active 須擴張 enum。

### 20.6 publicUrl / canonicalDownloadUrl / previewUrl 的最小需求？

- 本文件 §6.1 採：`publicUrl` 為 required（draft 時可空）；`canonicalDownloadUrl` / `previewUrl` 為 optional。
- 候選 alternative：`canonicalDownloadUrl` 升為 required（強制 author 填「真正下載 URL」）。
- 推薦傾向：保持 **optional**；對 Drive preview / share 等場景，canonical 可缺；render 端 fallback `publicUrl`。
- 屬未來 P8 renderer phase 之 sub-decision；本 phase 不裁決。

### 20.7 Google Drive folder 與 file 是否需要獨立 validation？

- 本文件 §13.1 採：`google-drive-preview` / `google-drive-share` 兩 deliveryMode 屬 preview-risk 候選 warn。
- 候選 alternative：對 `assetType: google-drive-folder` 之 publicUrl 額外做 syntax check（如要求 `^https://drive.google.com/drive/folders/`）。
- 推薦傾向：**不**做 URL pattern 推斷（per night-7 §D「不走 raw URL regex」原則）；改靠 deliveryMode 之 explicit 欄位。
- 屬未來 P6 validator source phase；本 phase 不裁決。

### 20.8 是否需要 registry README？

- 候選 A：建立 `content/settings/README.md` 或 `content/settings/download/README.md`，說明 registry 用法、欄位字典、forbidden field 提示。
- 候選 B：不建 README；由 docs/ 目錄之 schema decision + json preanalysis 文件承擔。
- 推薦傾向：**B**；既有 settings（categories / tags 等）無 README cadence；保持一致。
- 若未來 README 為必要（如 Admin 之 inline help），屬未來獨立 phase。

### 20.9 是否需要 Admin picker 前先做 renderer？

- 候選 A：先做 Admin picker（read-only），讓作者 / Admin 先熟悉 registry；後做 renderer。
- 候選 B：先做 renderer，讓內容能對外發布；後做 Admin picker。
- 推薦傾向：**A**（per am-4 §13 之 P6 → P7 → P8 順序）；Admin 落地比 renderer 更早，因為 renderer 涉 build / deploy / Blogger repost 風險較高。
- 屬未來 P8 之 sub-decision；本 phase 不裁決。

### 20.10 是否需要 GA4 event naming decision 文件？

- 候選 A：在 P8 phase 前，獨立建立一份 `docs/download-landing-ga4-event-naming-decision.md` 之 docs-only 裁決。
- 候選 B：不獨立建檔；由 P8 之 preanalysis 內裁決。
- 推薦傾向：**A**；對齊既有 docs cadence（每個獨立 surface 一份 docs-only decision）；降低 P8 之 cognitive load。
- 屬未來獨立 phase；本 phase 不裁決命名 / 時程。

---

## 21. Recommendation

### 21.1 推薦下一個最保守 phase

**推薦：read-only acceptance cross-check**

phase name 候選：`20260531-am-7-download-asset-form-registry-json-preanalysis-acceptance-read-only`（或 `20260601-...` 視當天時間）

性質：

- 🟢 **read-only**：純驗 baseline + 驗本文件之內部一致性 + 驗與既有 docs cadence 對齊。
- ❌ 不改 source / content / settings / templates / fixture。
- ❌ 不啟動 P3（empty registry implementation plan）。
- ❌ 不啟動任何 validator / fixture / renderer / build / deploy。

理由：

1. mirror 既有 cadence（am-2 → am-4 → am-5 acceptance → am-6 → **am-7 acceptance** → ...）：docs-only → acceptance read-only → 下一階段 docs-only / source。
2. 本 phase 之內容包含 6 個關鍵行為裁決（empty shape / missing file / empty validation / unknown field / forbidden field / loader），有必要先做 read-only acceptance 驗內部一致性 + 與 am-4 之邊界對齊。
3. acceptance 之輸出為「**本 docs 可作為下一階段（P3 empty registry implementation plan）之穩定 input**」之確認。

### 21.2 替代次保守選項

若 user 認為 acceptance 過保守，可考慮：

**create empty registry JSON 的 docs-only implementation plan**

- phase name 候選：`20260531-am-7-download-asset-form-registry-json-empty-implementation-plan-docs-only-a`
- 性質：docs-only；為 P4 之實際建檔做最後一份 plan（如建檔順序、commit message 慣例、push 順序、baseline 預期）。
- ❌ 不建立 JSON 實體檔。
- ❌ 不啟動 source / fixture / renderer / build / deploy。
- cadence 上跳過 P2 acceptance；風險：本 docs 若有內部不一致，可能影響 P3 / P4 之裁決品質。

→ **首推**仍為 **read-only acceptance**；P3 plan 為次保守 backup。

### 21.3 不推薦下一步

- ❌ **不推薦**直接 source implementation（registry JSON 建檔 / validator rule / loader / renderer / Admin）。
- ❌ **不推薦**直接 fixture creation。
- ❌ **不推薦**跳過 P2 acceptance 直接進 P4 / P5 / P6。
- ❌ **不推薦**啟動 Blogger repost / GA4 validation / pm-26 deploy gate 解除。
- ❌ **不推薦**啟動 reverse UTM activation。

---

## 22. Explicit Non-Actions

本 phase 明確**未做**：

- ❌ **no source change**：`src/scripts/validate-content.js` / `build-github.js` / `build-blogger.js` / `load-posts.js` / `load-settings.js` / `build-promotion.js` / `build-sitemap.js` / `parse-markdown.js` 等 source 一行不動。
- ❌ **no content change**：`content/blogger/posts/` / `content/github/posts/` / `content/drafts/` / `content/archive/` 一檔不動。
- ❌ **no settings change**：`content/settings/*.json` 一檔不動。
- ❌ **no templates change**：`content/templates/*.md` 一檔不動。
- ❌ **no package change**：`package.json` / `package-lock.json` / `vite.config.js` 不動；無 `npm install`。
- ❌ **no fixture creation**：`content/validation-fixtures/` 一檔不動。
- ❌ **no registry JSON creation**：不新增 `content/settings/download-assets.json` / `content/settings/download-forms.json` / `content/registries/*.json` / `content/settings/download/*.json`。
- ❌ **no renderer**：不新增 `src/views/pages/post-detail-download.ejs` / `src/views/blogger/blogger-post-download-*.ejs` / 其他 landing page template。
- ❌ **no validator rule**：不新增 `download-asset-registry-missing` / `download-form-registry-missing` / `download-asset-id-not-found` / `download-form-id-not-found` / `download-asset-inactive` / `download-form-inactive` / `download-registry-unknown-field` / `download-registry-forbidden-field` / `download-registry-duplicate-id` / `download-preview-url-risk-via-delivery-mode` 等任一規則。
- ❌ **no loader source**：不新增 `src/scripts/load-download-registry.js`；不擴張 `src/scripts/load-settings.js`。
- ❌ **no landing page renderer**：不新增任何 landing page template / partial / EJS component。
- ❌ **no Admin change**：不新增 Admin UI component；不改 Admin source；不改 `admin-2-write-pre-analysis.md` allowed write scope。
- ❌ **no Admin Apply enable**：Admin Apply 仍 dormant。
- ❌ **no middleware**：不新增 middleware write route；不啟動既有 middleware。
- ❌ **no admin-write-cli dry-run / apply**：`admin-write-cli` 完全不動。
- ❌ **no build**：不 `npm run build:*`；不 `npm run dev`。
- ❌ **no deploy**：不 push gh-pages；不改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`。
- ❌ **no Blogger repost**：Blogger 後台不動。
- ❌ **no GA4 validation**：不做 GA4 Realtime / DebugView。
- ❌ **no reverse UTM activation**：reverse UTM remains **landed but dormant**。
- ❌ **no pm-26 gate unblock**：pm-26 remains **BLOCKED**。
- ❌ **no respondent data import**：Google Forms / Sheets 之 respondent data 完全不進 repo（R1 紅線恪守）。
- ❌ **no `download.fileUrl` 與 Google Form URL 混淆**：R2 紅線恪守；三類 URL 分離維持。
- ❌ **no other SEO pipeline**：R3 紅線恪守；landing page 之 noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline。
- ❌ **no am-7 / am-13 / night-5 / night-7 implementation 變更**：D1 / D2 / D3 / S / preview-url-risk policy 全保持 frozen。
- ❌ **no am-4 schema decision 變更**：欄位字典 / enum / forbidden 裁決全保持 frozen；本文件僅引用，不重做。
- ❌ **no docs revision**：本 phase 不改既有 docs（am-1 / am-2 / am-3 / am-4 / am-5 / am-7 / am-9 / am-11 / am-13 / night-3 / night-5 / night-7 / pm-12 / pm-15 / pm-16 / pm-18 / pm-20 等）；僅新增本 phase 之新 docs 檔。
- ❌ **no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`**：唯一 git 操作為 add + commit + push（單檔 docs）。

### 22.1 Governance frozen state

- reverse UTM remains **landed but dormant**。
- pm-26 deploy gate remains **BLOCKED**。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守。
- D1 / D2 / D3 / S / preview-url-risk 全保持 frozen；本 phase 不重做、不調整、不退化。
- am-4 schema decision 全保持 frozen；本 phase 不重做、不調整、不退化。

---

（本文件結束）
