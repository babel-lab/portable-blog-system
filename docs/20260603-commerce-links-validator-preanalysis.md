# 2026-06-03 Commerce Links Validator — Preanalysis (docs-only)

Phase name: `20260603-night-22-commerce-links-validator-preanalysis-docs-only-a`
Date: 2026-06-03 23:15 +0800
Mode: **docs-only validator preanalysis**（no source / no content / no settings registry mutation / no templates / no fixtures / no loader change / no validator rule landing / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-1 `3cbb2fd` | commerce affiliate link registry preanalysis | problem statement / Option A/B/C |
| night-17 `794a9ce` | commerce affiliate link registry identifier preanalysis | 三軸模型（`linkId` / `internalLabel` / `displayLabel`）+ 反查維度 |
| night-18 `c420408` | commerce affiliate link registry schema decision | near-term C → long-term D；linkId 命名 convention；v0 23 欄位；validator V1–V15 規劃清單 |
| night-19 `e40a278` | commerce affiliate link empty registry preanalysis | 檔名 / 路徑 / 空 JSON shape / loader 與 validator cadence |
| night-20 `c1a6974` | empty registry implementation（settings-only） | 新增 `content/settings/commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure（source-only） | `load-settings.js` 暴露 `settings.commerceLinks = []`；無 consumer |
| **night-22（本 phase）** `（本 commit）` | **commerce-links validator preanalysis（docs-only）** | 設計 registry-level + content-reference warning-only validator rule contract；不實作 source；不新增 fixture |

night-22 **不**重啟 schema 裁決；本階段唯一目的為：

> 在實際開始 commerceLinks validator source 之前，先把「未來 registry-level validator」與「未來 content-reference validator」之 **rule id 命名 / 觸發條件 / message shape / fixture cadence / empty registry R1-clean 條件 / 紅線** 一次性凍結，為下一個 source-only phase 提供可直接執行的 contract。

本階段為純文件；**不**改 `src/scripts/validate-content.js`、**不**改 `src/scripts/load-settings.js`、**不**改 `content/settings/commerce-links.json`、**不**改任何 content / templates / fixtures / package。

---

## 1. Executive Summary

### 1.1 一句話結論

> **建議下一個 commerceLinks validator source phase 只做 registry-level shape + dup-key 兩條 rule（mirror download R1 cadence）**；**不**同時做 fixture；**不**同時做 content-reference rules；validate baseline 須維持 **0 errors / 60 warnings / 53 posts**。

### 1.2 本 phase 範圍

- 摘要既有 validate-content.js 之 warning-only rule pattern（download R-series / related-links / book / series 已落地經驗）。
- 將 commerce validator 切分為兩層：**registry-level**（自我 shape / dup-key / referential integrity） + **content-reference**（文章引用 commerce link 之 shape / not-found / inactive / coexistence）。
- 為兩層各設計 warning-only rule 候選清單，逐 rule 寫 trigger condition / severity / message shape / empty registry 觸發判定 / fixture 需求。
- 凍結 empty registry **R1-clean 決定**：本階段之 commerce-links.json `[]` registry 不得改變 validate baseline；未來 registry-level source phase 若不新增 fixture，baseline 仍維持 0/60/53。
- 凍結 merchant / network / source key 之**邊界**：commerce validator 不混 `link-sources.json` / `affiliate-networks.json` 之命名空間。
- 凍結 secret / token safety 紅線：commerce-links registry 永不承載 affiliate dashboard credentials / API key / OAuth token / 帳號 email / 結算 / 表單 respondent data。
- 凍結 fixture cadence：未來 fixture 屬獨立 phase；本階段不建立任何 fixture。
- 凍結 source implementation 之 phase ladder（A → E）。
- 凍結 GA4 / build / deploy boundary：validator 不改 GA4；不啟動 Admin picker / renderer。
- **不**自動啟動下一階段。

### 1.3 本 phase 不做的事

- ❌ 不改 `src/scripts/validate-content.js`
- ❌ 不改 `src/scripts/load-settings.js`
- ❌ 不改 `content/settings/commerce-links.json`
- ❌ 不改任何 content / templates / fixtures
- ❌ 不改 `package.json` / `package-lock.json`
- ❌ 不執行 `npm install` / `npm run build` / `npm run dev`
- ❌ 不新增 fixture（registry malformed / dup-key / not-found / inactive / replacement-target / content-ref 全部不建）
- ❌ 不啟動 Admin picker / renderer / GA4 / build / deploy
- ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate

---

## 2. Current Baseline

### 2.1 git / validate baseline（pre-commit）

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `78f1e9a3cddaf29e47ea457be17f2f5546da9a03`（short `78f1e9a`）|
| `HEAD == origin/main`（pre-commit）| yes（ahead / behind = `0 / 0`）|
| working tree（pre-commit）| clean |
| 最新 commit subject（pre-commit）| `feat(settings): expose commerce links registry` |
| `npm run validate:content`（pre-commit）| **0 errors / 60 warnings / 53 posts** |

### 2.2 commerce-links registry 之既有狀態

`content/settings/commerce-links.json`（per night-20 落地，commit `c1a6974`）：

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "commerceLinks": [],
  "notes": ""
}
```

### 2.3 loader 暴露之既有狀態

`src/scripts/load-settings.js`（per night-21 落地，commit `78f1e9a`）：

```js
const commerceLinksRegistry = await readJsonOptional('commerce-links.json', { commerceLinks: [] });
result.commerceLinks = Array.isArray(commerceLinksRegistry?.commerceLinks) ? commerceLinksRegistry.commerceLinks : [];
```

→ `settings.commerceLinks` 為 `[]`（empty array）；metadata 欄位（`schemaVersion` / `updatedAt` / `notes`）**不**暴露至 in-memory settings（per night-19 §6.3 / night-21 spec）。

### 2.4 validator 未啟動之事實

- `src/scripts/validate-content.js` 目前**完全沒有** `commerceLinks` 之 reference / warning rule。
- 無 fixture 引用 commerce ref / commerce linkId。
- 無 production post 引用 `affiliate.links[].ref` 或 `affiliate.commerceLinks[]`。
- validate baseline 之 60 warnings 全由既有 fixture（download / related-links / book / series / publish / fb-md 等）驅動；無一條與 commerce 相關。

### 2.5 本 phase 不改變之既有 baseline

- 本 phase 純 docs-only；新增 1 個 docs 檔。
- validate baseline 預期 post-commit 仍為 **0 / 60 / 53**。

---

## 3. Existing Validator Pattern Survey

### 3.1 既有 warning-only rule 設計骨架

per `src/scripts/validate-content.js` 之 download / related-links / book / series / publish overlap 已落地經驗：

| 維度 | 既有慣例 |
| --- | --- |
| severity 預設 | `'warning'`（error 僅留給 status / slug / date / duplicate-slug 等阻擋性 ERROR）|
| issue shape | `{ severity, type, sourcePath, value }`；可選 `site` |
| rule id 命名 | kebab-case；前綴對齊**主題群**（如 `download-` / `related-links-` / `book-` / `series-` / `fb-md-` / `promotion-` / `sidecar-` / `commerce-link-` 預留）|
| message value shape | 自由文字；建議攜帶**欄位路徑** + **觸發值**（如 `assetRefs[0]="foo" not found in downloadAssets registry`）|
| 觸發範圍 | post loop 內部僅 `ready` / `published` 文章；`draft` / `archived` 由 loadPosts 過濾 |
| registry-level rules | post loop **外**單獨呼叫（per `validateDownloadRegistry`）；message sourcePath 為 `content/settings/<file>.json` |
| sub-helper | 各主題封裝為單一 helper（如 `validateRelatedLinksField` / `validateDownloadRegistry` / `buildDownloadKeySet`）|
| 互斥規則 | 同一欄位多種 invalid 採 **mutually exclusive cascade**（如 `download-asset-ref-invalid-type` → `download-asset-ref-empty` → `download-asset-ref-not-found`） |
| registry usable gate | `buildDownloadKeySet` 在 registry shape invalid 時回傳 `null`，content-ref lookup 跳過以避免 cascade noise |

### 3.2 既有 download R-series cadence（範本）

per CLAUDE.md §3.2 + `docs/20260601-pm-17` / `docs/20260602-night-9` / `docs/20260603-am-2`：

| step | rule | 觸發範圍 | fixture 是否新增 |
| --- | --- | --- | --- |
| R1 | `download-registry-invalid-shape` | registry 非 plain object / `assets`/`forms` 非 array | 視需求；empty 不觸發 |
| R1 | `download-registry-duplicate-key` | `assetId` / `formId` 重複 | dup fixture |
| R2 | `download-asset-ref-not-found` / `download-form-ref-not-found` | 文章 ref 不在 registry | not-found fixture |
| R5b | `download-asset-ref-duplicate` | intra-post `assetRefs[]` 重複 | duplicate fixture |
| 其餘 D-rules | `download-asset-refs-invalid-type` / `download-asset-ref-invalid-type` / `download-asset-ref-empty` / `download-form-ref-invalid-type` / `download-form-ref-empty` | shape 互斥 cascade | per-rule fixture |

**R1 落地時 baseline 不變**（empty registry → 0 warnings）；後續 R2 / R5b fixture 才補 warnings；production 不受影響。

### 3.3 production content warning 與 validation fixture warning 之區分

per CLAUDE.md §3.2 + 既有 fixtures 之約定：

- **production posts**（`content/{github,blogger}/posts/`）：偶爾觸發 warning（如 `body-leading-h1` / `empty-tags`）但須在合理範圍內。
- **validation fixtures**（`content/validation-fixtures/{github,blogger}/posts/`）：故意觸發特定 rule，檔名以 `_test-<rule-id>.md` 前綴；每個 rule 至少 1 個 positive fixture。
- 60 warnings baseline 大部分由 fixtures 驅動；production warnings 為少數。

### 3.4 既有 registry 中性處理

| registry | empty 狀態 baseline 影響 | usable gate 模式 |
| --- | --- | --- |
| `download-assets.json` | empty `assets: []` → 0 warnings | `buildDownloadKeySet` 回傳 `null` 時 not-found 檢查跳過 |
| `download-forms.json` | empty `forms: []` → 0 warnings | 同上 |
| `link-sources.json` | non-empty | `buildActiveSourceKeySet` 過濾 `isActive !== false` |
| `affiliate-networks.json` | non-empty（2 entries） | 尚未被 validator 引用 |
| `commerce-links.json` | empty `commerceLinks: []` → **預期 0 warnings**（本 phase 凍結）| 未來須仿 download，shape invalid → null skip |

---

## 4. Commerce Validator Scope

本階段明確界定未來 commerce validator 應檢查**兩層**；本階段只規劃，不實作。

### 4.1 Registry-level Layer

對象：`settings.commerceLinks` 與 raw `content/settings/commerce-links.json`（loader 暴露之 array + 必要時讀 metadata）。

責任：

- 檢查 registry 自身 shape 是否合法
- 檢查 entry-level required fields 是否齊全
- 檢查 entry-level key uniqueness（`linkId` 全 registry 唯一）
- 檢查 entry-level referential integrity（`networkKey` 對齊 `affiliate-networks.json` / `replacementTarget` 指向 known `linkId`）
- 檢查 entry-level 內容紅線（如 secret / token 表面 detection）

觸發時機：post loop **外**單獨呼叫；rule sourcePath 為 `content/settings/commerce-links.json`。

mirror `validateDownloadRegistry` 之 pattern。

### 4.2 Content-reference Layer

對象：文章 frontmatter 之 commerce ref 欄位（per night-18 §6 候選 schema：`affiliate.links[].ref` near-term C / `affiliate.commerceLinks[].ref` long-term D）。

責任：

- 檢查文章 ref 是否為合法 string
- 檢查文章 ref 是否命中 registry 已知 `linkId`
- 檢查命中之 entry 是否 `active: true`
- 檢查 intra-post duplicate ref（mirror download R5b）
- 檢查文章 ref 是否與 raw URL coexist（near-term C 過渡期 vs long-term D 紅線）
- 檢查文章 ref 之顯示屬性 override（如 `labelOverride` / `role`）是否合法

觸發時機：post loop **內**（僅 ready / published）；rule sourcePath 為 post 之 `.md` 路徑。

mirror `validateRelatedLinksField` 之 pattern + `download-asset-ref-*` 之 cascade。

### 4.3 兩層 cascade 原則

| 情境 | 處理 |
| --- | --- |
| registry shape invalid（V1 觸發） | content-reference 之 not-found / inactive lookup **跳過**（mirror `assetKeySet === null` 模式）|
| registry shape valid + 個別 entry invalid | 個別 entry 影響該 entry 之 `linkId`；其餘 entry 仍可用 |
| 文章 ref empty / wrong type | 不進入 lookup（mirror `download-asset-ref-empty` / `-invalid-type` 互斥 cascade）|

### 4.4 不在本 phase 範圍之 layer

- ❌ **renderer-level 檢查**（如 dist HTML 不含 `internalLabel`）：屬未來 acceptance；屬 V14 `commerce-link-internal-label-render-risk`；不在本 phase 與下一 phase 範圍
- ❌ **build-time URL reachability**（curl / DNS 驗證）：超出 validator scope
- ❌ **GA4 dimension correctness**：屬 GA4 phase
- ❌ **Admin picker correctness**：屬 Admin phase

---

## 5. Registry-level Candidate Rules

⚠️ **以下全為 warning-only**；無一條 error；無一條於 empty registry 觸發；本 phase 不實作。

### 5.1 Rule catalog overview

| # | rule id | sourcePath | empty registry 觸發？ | fixture 需求 |
| --- | --- | --- | --- | --- |
| R1 | `commerce-links-invalid-shape` | `content/settings/commerce-links.json` | ❌ no | 需 registry malformed fixture（可選；屬 hardening） |
| R2 | `commerce-links-not-array` | 同上 | ❌ no | 同上 |
| R3 | `commerce-link-invalid-entry-type` | 同上 | ❌ no | 需 non-object entry fixture |
| R4 | `commerce-link-missing-link-id` | 同上 | ❌ no | 需 missing linkId entry fixture |
| R5 | `commerce-link-duplicate-link-id` | 同上 | ❌ no | 需 dup linkId fixture |
| R6 | `commerce-link-missing-target-url` | 同上 | ❌ no | 需 active=true + targetUrl 空 fixture |
| R7 | `commerce-link-invalid-target-url` | 同上 | ❌ no | 需 targetUrl 不符 `^https?://` fixture |
| R8 | `commerce-link-missing-internal-label` | 同上 | ❌ no | 需 missing internalLabel fixture |
| R9 | `commerce-link-internal-label-empty` | 同上 | ❌ no | 需 empty trimmed internalLabel fixture |
| R10 | `commerce-link-invalid-merchant-key` | 同上 | ❌ no | 需 invalid merchantKey shape fixture |
| R11 | `commerce-link-invalid-network-key` | 同上 | ❌ no | 需 networkKey 不在 affiliate-networks.json 之 id 列表 fixture |
| R12 | `commerce-link-replacement-target-not-found` | 同上 | ❌ no | 需 replacementTarget 指向不存在 linkId fixture |
| R13 | `commerce-link-replacement-target-self` | 同上 | ❌ no | 需 replacementTarget === self linkId fixture |
| R14 | `commerce-link-inactive-missing-replacement` | 同上 | ❌ no | 需 active=false + replacementTarget 空 fixture |
| R15 | `commerce-link-suspicious-secret-token` | 同上 | ❌ no | 不建議建立真實 fixture（紅線）；僅以 synthetic placeholder 串 |

### 5.2 Per-rule design

#### R1 — `commerce-links-invalid-shape`

| 屬性 | 值 |
| --- | --- |
| trigger | `settings.commerceLinks`（或 raw registry root）非 plain object（含 null / array / scalar） |
| severity | `warning` |
| message shape | `commerce-links registry root must be a plain object` |
| empty 觸發 | ❌ no（empty registry root 是 plain object）|
| fixture 需求 | 屬 hardening；初期可不建立（mirror download R1 之選擇）|
| 備註 | 因 loader 已 fallback 為 `{ commerceLinks: [] }`，validator 若直接讀 `settings.commerceLinks` 而非 raw root，本條可能不可觸發；可改名為 `commerce-links-loader-fallback-active` 之 informational，或於 settings 層額外暴露 `commerceLinksRaw` 以保留檢查能力；本 phase 不裁決 |

#### R2 — `commerce-links-not-array`

| 屬性 | 值 |
| --- | --- |
| trigger | `commerceLinks` 欄位存在但非 array（含 null / object / scalar） |
| severity | `warning` |
| message shape | `commerceLinks typeof=<type> (must be array)` |
| empty 觸發 | ❌ no（empty `[]` 為合法 array）|
| fixture 需求 | 需 fixture（registry 內 `commerceLinks` 改為 string / object）|
| 備註 | 因 loader Array.isArray gate 已過濾，需於 settings 層暴露 raw registry 才能在 validator 端觀察；mirror `validateDownloadRegistry` 之做法 |

#### R3 — `commerce-link-invalid-entry-type`

| 屬性 | 值 |
| --- | --- |
| trigger | `commerceLinks[i]` 非 plain object（含 null / array / scalar） |
| severity | `warning` |
| message shape | `commerceLinks[<i>] typeof=<type> (must be plain object)` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |

#### R4 — `commerce-link-missing-link-id`

| 屬性 | 值 |
| --- | --- |
| trigger | entry 為 plain object 但 `linkId` 缺漏 / 非 string / trim 後空 |
| severity | `warning` |
| message shape | `commerceLinks[<i>].linkId missing or empty` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |
| 備註 | linkId 為**永不改名**之 machine key；缺漏會破壞下游 lookup |

#### R5 — `commerce-link-duplicate-link-id`

| 屬性 | 值 |
| --- | --- |
| trigger | 同一 trimmed `linkId` 在 registry 內出現 ≥ 2 次（mirror `download-registry-duplicate-key`）|
| severity | `warning` |
| message shape | `commerceLinks[<i1>,<i2>,...].linkId="<linkId>"` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |
| 備註 | 每個 dup key 只報 1 條（避免噪音）；mirror download R1 之 `reported` set |

#### R6 — `commerce-link-missing-target-url`

| 屬性 | 值 |
| --- | --- |
| trigger | entry 為 `active === true`（或 `active` 未指定 defaulting to true）且 `targetUrl` 缺漏 / 非 string / trim 後空 |
| severity | `warning` |
| message shape | `commerceLinks[<i>].targetUrl missing or empty (linkId="<linkId>")` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |
| 備註 | `active: false` 之 entry **不**觸發 R6（容許 entry 已停用且暫無 URL）|

#### R7 — `commerce-link-invalid-target-url`

| 屬性 | 值 |
| --- | --- |
| trigger | `targetUrl` 為 non-empty trimmed string 但不符 `^https?://` |
| severity | `warning` |
| message shape | `commerceLinks[<i>].targetUrl="<url>" does not match ^https?://` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture（mirror `download-fileurl-invalid-format`）|
| 備註 | 與 R6 互斥 cascade |

#### R8 — `commerce-link-missing-internal-label`

| 屬性 | 值 |
| --- | --- |
| trigger | `internalLabel` 缺漏（undefined） |
| severity | `warning` |
| message shape | `commerceLinks[<i>].internalLabel missing (linkId="<linkId>")` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |
| 備註 | per night-18 §5.2 #2：internalLabel **required**；missing 為 author hygiene warning |

#### R9 — `commerce-link-internal-label-empty`

| 屬性 | 值 |
| --- | --- |
| trigger | `internalLabel` 為 string 但 trim 後為空 |
| severity | `warning` |
| message shape | `commerceLinks[<i>].internalLabel is empty or whitespace-only (linkId="<linkId>")` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture（mirror `download-asset-ref-empty`）|
| 備註 | 與 R8 互斥 cascade（undefined → R8；string trim 空 → R9）|

#### R10 — `commerce-link-invalid-merchant-key`

| 屬性 | 值 |
| --- | --- |
| trigger | `merchantKey` 缺漏 / 非 string / 含非 `[a-z0-9-]` 字元 / 非 kebab-case |
| severity | `warning` |
| message shape | `commerceLinks[<i>].merchantKey="<key>" must be lowercase kebab-case (a-z0-9-)` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |
| 備註 | **syntax-only** 檢查；不檢查 against future merchant registry（per §8.1 boundary）|

#### R11 — `commerce-link-invalid-network-key`

| 屬性 | 值 |
| --- | --- |
| trigger | `networkKey` 為 non-empty string 但不在 `affiliate-networks.json` 之 `id` 列表 |
| severity | `warning` |
| message shape | `commerceLinks[<i>].networkKey="<key>" not found in affiliate-networks registry (linkId="<linkId>")` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |
| 備註 | `networkKey` 為 optional 欄位；undefined 不觸發；需先 build active id set（mirror `buildActiveSourceKeySet` pattern）|

#### R12 — `commerce-link-replacement-target-not-found`

| 屬性 | 值 |
| --- | --- |
| trigger | `replacementTarget` 為 non-empty trimmed string 但不在 registry 之任一 `linkId` |
| severity | `warning` |
| message shape | `commerceLinks[<i>].replacementTarget="<id>" not found in commerce-links registry (linkId="<linkId>")` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |
| 備註 | 需先 build linkId set；單 pass collect-then-validate |

#### R13 — `commerce-link-replacement-target-self`

| 屬性 | 值 |
| --- | --- |
| trigger | `replacementTarget` 為 non-empty string 但等於 entry 自身 `linkId` |
| severity | `warning` |
| message shape | `commerceLinks[<i>].replacementTarget="<id>" points to itself (linkId="<linkId>")` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |

#### R14 — `commerce-link-inactive-missing-replacement`

| 屬性 | 值 |
| --- | --- |
| trigger | `active === false` 且 `replacementTarget` 缺漏 / 非 string / trim 後空 |
| severity | `warning` |
| message shape | `commerceLinks[<i>] active=false but replacementTarget is missing (linkId="<linkId>")` |
| empty 觸發 | ❌ no |
| fixture 需求 | 需 fixture |
| 備註 | per night-18 §7.5：renderer 對 active=false 不輸出；validator 提示作者補 replacementTarget；但不強制（warning）|

#### R15 — `commerce-link-suspicious-secret-token`

| 屬性 | 值 |
| --- | --- |
| trigger | entry 之任一 string 欄位（`targetUrl` / `internalLabel` / `notes` / `displayLabel` / `merchant` 等）含可疑 secret token 樣式 |
| severity | `warning` |
| message shape | `commerceLinks[<i>].<field> may contain a secret token (linkId="<linkId>")`（**不**回貼具體 token）|
| empty 觸發 | ❌ no |
| fixture 需求 | ⚠️ **不**建立真實 fixture；可用 synthetic 之 obvious 非 secret placeholder（如 `bearer_PLACEHOLDER_DO_NOT_USE`）；本 phase 不規劃實作 detection 之 regex |
| 紅線 | 不輸出真實 token；不掃描 frontmatter；不存 grep 結果；以保守 heuristic 為主（如 `bearer ` / `token=` / `apikey=` / `Authorization:` 字串） |
| 備註 | 屬 long-tail；R15 為提示，不取代 R1 紅線（secret 永不進 repo）|

### 5.3 Rule ordering（cascade）

建議 cascade（mirror download R-series 之 fix-first pattern）：

```
R1 (root invalid shape)
└─ skip R2..R15
R2 (commerceLinks not array)
└─ skip R3..R15
R3 (entry not object)
└─ skip R4..R15 for that entry
R4 (missing linkId)
└─ skip R5..R15 for that entry（linkId 缺，dup-key / replacement-target / not-found 無意義）
R5 (dup linkId)（continues with later rules; dup is informational）
R6 / R7 (targetUrl missing / invalid) — mutually exclusive
R8 / R9 (internalLabel missing / empty) — mutually exclusive
R10 (merchantKey invalid syntax)
R11 (networkKey not in affiliate-networks)
R12 / R13 (replacementTarget not-found / self) — mutually exclusive
R14 (inactive + missing replacement)
R15 (suspicious secret token) — orthogonal
```

### 5.4 Registry usable gate（mirror download pattern）

未來 source phase 應提供 helper：

```
buildCommerceLinkIdSet(registry) → Set<string> | null
```

語意：

- registry root 非 plain object 或 `commerceLinks` 非 array → 回傳 `null`
- 否則回傳 `linkId` set（忽略 entry 非 object / linkId 非 string / linkId trim 空）
- caller（content-reference layer）以 `linkIdSet === null` 判定 skip lookup

### 5.5 Empty registry 預期 0 warnings 驗證

current commerce-links.json 為 empty registry，且：

- root 為 plain object ✅
- `commerceLinks` 為 `[]` ✅
- 無 entry → R3..R14 不適用 ✅
- 無字串欄位 → R15 不適用 ✅

→ **registry-level source phase（只加 R1..R14 source；無 fixture）後 validate baseline 預期仍為 0/60/53**。

---

## 6. Content-reference Candidate Rules

⚠️ **以下全為 warning-only**；無一條 error；本 phase 不實作；本 phase 不裁決 frontmatter 之 ref 欄位最終位置（per night-18 §6.1 之 (a) / (b) / (c) / (d) 候選；長期收斂至 D 之 `affiliate.commerceLinks[]`）。

### 6.1 假設 frontmatter shape（per night-18 §6.2 過渡期）

```yaml
affiliate:
  links:
    - ref: "book-atomic-habits-books-com-tw"
      role: "primary"
      order: 10
      labelOverride: ""
    - label: "金石堂：實體書"      # raw（過渡期保留）
      network: "聯盟網"
      url: "https://..."
```

本 phase 規則設計**支援**過渡期之 ref + raw 混用。

### 6.2 Rule catalog overview

| # | rule id | trigger 位置 | empty registry 觸發？ | fixture 需求 |
| --- | --- | --- | --- | --- |
| C1 | `commerce-ref-invalid-type` | `affiliate.links[].ref` 非 string | ❌ no | 需 fixture |
| C2 | `commerce-ref-empty` | `ref` 為 string 但 trim 空 | ❌ no | 需 fixture |
| C3 | `commerce-ref-not-found` | `ref` 為 non-empty trimmed string 但不在 registry | ❌ no（前提：registry empty 時 lookup set 為空 → 任何 non-empty ref 都 not-found）；目前 0 篇 production 文章用 ref → 0 觸發 | 需 fixture |
| C4 | `commerce-ref-inactive` | ref 命中但 entry `active: false` | ❌ no（前提：registry 無 entry → 不可能命中）| 需 fixture |
| C5 | `commerce-ref-duplicate-in-post` | 同 post 之 `affiliate.links[]` 內 trimmed ref 重複（mirror download R5b）| ❌ no | 需 fixture |
| C6 | `commerce-ref-local-url-coexistence-warning` | 同 entry 內 ref 與 raw url 同時非空 | ❌ no | **本 phase 不立即啟用**（per §6.5）|
| C7 | `commerce-ref-missing-role` | ref 存在但 `role` 缺漏 | ❌ no | 屬 long-tail；本 phase **不**建議啟用 |
| C8 | `commerce-ref-invalid-role` | `role` 不在預定義列舉（如 `primary` / `alternate` / `official` / `price-check` / `library` / `direct`）| ❌ no | 需先凍 role 列舉；屬 long-tail |
| C9 | `commerce-ref-display-override-risk` | `labelOverride` 為 string 但等於 entry 之 `internalLabel`（潛在洩漏 internalLabel 至前台）| ❌ no | 需 registry entry + fixture；屬 long-tail；本 phase 不啟用 |

### 6.3 Per-rule design

#### C1 — `commerce-ref-invalid-type`

| 屬性 | 值 |
| --- | --- |
| trigger | `affiliate.links[i].ref !== undefined` 且 typeof !== 'string' |
| severity | `warning` |
| message shape | `affiliate.links[<i>].ref typeof=<type> (must be string)` |
| empty registry 觸發 | ❌ no |
| 備註 | mirror `download-asset-ref-invalid-type` |

#### C2 — `commerce-ref-empty`

| 屬性 | 值 |
| --- | --- |
| trigger | `ref` 為 string 但 trim 後空 |
| severity | `warning` |
| message shape | `affiliate.links[<i>].ref is empty or whitespace-only` |
| empty registry 觸發 | ❌ no |
| 備註 | mirror `download-asset-ref-empty`；與 C1 互斥 |

#### C3 — `commerce-ref-not-found`

| 屬性 | 值 |
| --- | --- |
| trigger | `ref` 為 non-empty trimmed string；linkIdSet !== null；ref 不在 linkIdSet |
| severity | `warning` |
| message shape | `affiliate.links[<i>].ref="<ref>" not found in commerce-links registry` |
| empty registry 觸發 | ❌ no（無 production post 用 ref；fixture 才會觸發）|
| 備註 | mirror `download-asset-ref-not-found`；C1 / C2 / C3 互斥 cascade |
| registry usable gate | `linkIdSet === null` → 跳過 C3 |

#### C4 — `commerce-ref-inactive`

| 屬性 | 值 |
| --- | --- |
| trigger | ref 命中 registry；entry `active === false` |
| severity | `warning` |
| message shape | `affiliate.links[<i>].ref="<ref>" matched but entry is inactive (replacementTarget="<target>" if any)` |
| empty registry 觸發 | ❌ no |
| 備註 | 與 C3 互斥（not-found vs inactive 是兩條獨立路徑）；不向使用者透露 replacementTarget 之內部 URL，僅暴露 id |

#### C5 — `commerce-ref-duplicate-in-post`

| 屬性 | 值 |
| --- | --- |
| trigger | 同 post 之 `affiliate.links[]` 內 trimmed ref（非 empty）出現 ≥ 2 次 |
| severity | `warning` |
| message shape | `affiliate.links[<i1>,<i2>,...] duplicate ref="<ref>"` |
| empty registry 觸發 | ❌ no |
| 備註 | mirror download R5b `download-asset-ref-duplicate`；intra-post only；與 C3 / C4 orthogonal cascade |

#### C6 — `commerce-ref-local-url-coexistence-warning`

| 屬性 | 值 |
| --- | --- |
| trigger | 同 entry 內 `ref` 非空且 `url`（raw）非空 |
| severity | `warning` |
| message shape | `affiliate.links[<i>] ref and url coexist (migration mode); remove url once renderer landed` |
| empty registry 觸發 | ❌ no |
| **本 phase 凍結：near-term C 之 raw URL coexist 不應立即觸發 production warning** | per §6.5 詳述 |
| 啟動條件 | 進入明確 migration phase（per §11 phase E / phase F）後才啟用；屬 long-term D 之 nudge |

#### C7 — `commerce-ref-missing-role`

| 屬性 | 值 |
| --- | --- |
| trigger | `ref` 為 valid string + 在 registry；`role` 缺漏 |
| severity | `warning` |
| message shape | `affiliate.links[<i>] ref="<ref>" missing role (suggested: primary / alternate / official)` |
| 備註 | role 為 per-instance 顯示屬性；缺漏不阻擋；屬 long-tail；本 phase 不建議啟用 |

#### C8 — `commerce-ref-invalid-role`

| 屬性 | 值 |
| --- | --- |
| trigger | `role` 不在預定義列舉 |
| severity | `warning` |
| message shape | `affiliate.links[<i>].role="<role>" not in {primary, alternate, official, price-check, library, direct}` |
| 備註 | 需先**凍結** role 列舉；屬 long-tail；本 phase 不啟用 |

#### C9 — `commerce-ref-display-override-risk`

| 屬性 | 值 |
| --- | --- |
| trigger | `labelOverride` 為 string 且 trim 後等於 entry 之 `internalLabel` |
| severity | `warning` |
| message shape | `affiliate.links[<i>].labelOverride may leak internalLabel to public render (linkId="<ref>")` |
| 備註 | 屬 V14 之 author-side mirror；屬 long-tail；本 phase 不啟用 |

### 6.4 Cascade ordering（content-reference）

```
C1 (invalid type)
└─ skip C2..C9 for that entry
C2 (empty trim)
└─ skip C3..C9 for that entry
C3 / C4 (not-found / inactive) — mutually exclusive（cannot be both）
C5 (duplicate-in-post) — orthogonal（與 C3 / C4 共存）
C6 (coexistence warning) — gated by phase（near-term C 不啟用）
C7 / C8 (role missing / invalid) — orthogonal；C7 / C8 互斥
C9 (display override risk) — orthogonal
```

### 6.5 Strategy C mixed coexistence 之 production raw URL coexist 政策

per night-18 §3.3 + §6.2 + §6.6 + §6.7 + §11.1：

- **near-term C 過渡期內**，`ref` + raw `url` coexist **不**應立即觸發 production warning。
- 原因：
  - production 文章遷移**永遠須作者明示**；批次 warn 會推作者匆忙改 frontmatter，違反「不自動替換 raw URL」紅線。
  - renderer 尚未落地 ref lookup → 即使 author 全改 ref，front-end 仍走 raw URL fallback；warn 無資訊量。
  - mirror download R1 R2 之經驗：先 land empty registry + shape rules，再 fixture-first 補 content-reference；不在 production 文章未準備好之前噴 warn。
- C6 啟動條件：
  1. renderer fallback phase 完成（per night-18 §3.8 / §12 step 9）
  2. user explicit approval 啟動 migration phase
  3. C6 fixture 先建（fixture-first）；確認 warning 不會殃及 production post
  4. C6 啟動後仍為 warning-only；不阻擋 build
- 在此期間，作者**可**自由混用 ref + raw URL；validator 容忍。
- 本 phase 凍結：**未來 commerce validator source phase 不啟動 C6**；C6 屬獨立 migration-phase rule。

---

## 7. Empty Registry R1-clean Decision

### 7.1 凍結結論

> **current empty `content/settings/commerce-links.json` 必須維持 R1-clean**。
>
> 未來 commerce validator source phase（即使只加 registry-level R1..R14 source code）若**不**同時新增 fixture，`npm run validate:content` baseline **必須**維持 **0 errors / 60 warnings / 53 posts**。
>
> 只有當未來新增 negative fixture（per §10）才允許 baseline warnings 數字增加；fixture-driven warnings 不視為 baseline 退化。

### 7.2 R1-clean 之七條條件（mirror night-19 §7.3）

未來 commerce validator source phase 若不破壞以下條件，則 baseline 必維持 0/60/53：

1. `commerce-links.json` 可 parse（無 syntax error）
2. registry root 為 plain object（非 null / array / scalar）
3. `schemaVersion === 1`（integer）
4. `updatedAt === ""`（string，empty）
5. `commerceLinks === []`（empty array）
6. `notes === ""`（string，empty）
7. **無**其他 top-level keys

任一條不滿足 → 屬 R1 觸發；屬 fixture 而非 production baseline 變動。

### 7.3 為什麼是 R1-clean

- empty registry 之全 7 條 R1-clean 條件已在 night-19 §7.3 凍結。
- night-20 commit `c1a6974` 落地之 commerce-links.json **完全符合** R1-clean。
- night-21 commit `78f1e9a` 之 loader 暴露**不**改變 registry shape；R1-clean 仍成立。
- 未來 validator source 若加入 R1 source code 但**不**動 registry 本身 → R1 source 之 trigger 在 empty registry 上**永不**觸發（per §5.1）→ 0 warnings 新增。

### 7.4 違反 R1-clean 之 alt 場景（明確排除）

不允許之做法：

- ❌ 在 commerce-links.json 內預塞 sample / TODO entry → 違反 night-19 §4.3
- ❌ 修改 schemaVersion 為非 integer
- ❌ 把 commerceLinks 改為 object / null / string
- ❌ 新增 unknown top-level keys（如 `metadata` / `links` / `entries`）

若未來 source phase 須測 R1 / R2 / R3 / R4 / R5 source code，**fixture** 應放於 `content/validation-fixtures/` 或專屬 settings fixture 路徑；**不**動 production registry。

---

## 8. Merchant / Network / Source Boundary

### 8.1 merchantKey 邊界

| 維度 | 決策 |
| --- | --- |
| 是否檢查 against 未來 merchant registry | ❌ **不**；本 phase 不規劃 merchant registry；merchantKey 為 free-form syntax-checked key |
| 檢查層級 | syntax-only：`^[a-z0-9-]+$` + 非空 + 不以 hyphen 起始 / 結尾 |
| validator rule | R10 `commerce-link-invalid-merchant-key`（syntax-only）|
| 未來 long-tail | 若日後加 `merchants.json`，可改為 against registry 之 referential check；本 phase **不**承諾 |

🔑 **不**用 URL pattern 反推 merchantKey（per night-18 §11.1）。merchantKey 由作者明示填寫；validator 不嘗試從 URL 推斷正確 merchant。

### 8.2 networkKey 邊界

| 維度 | 決策 |
| --- | --- |
| 是否檢查 against 未來 network registry | ✅ **是**；可立即 against `content/settings/affiliate-networks.json` 之 `id` 列表 |
| 來源 | `affiliate-networks.json` 已 ship 且為 production 載入；可 build set |
| validator rule | R11 `commerce-link-invalid-network-key` |
| 例外 | `networkKey` 為 optional；undefined 不觸發；空 string 視為 R11（或 skip；屬 source 階段決策）|
| 命名規則 | 期待 lowercase kebab-case；mirror affiliate-networks.json 之 `id` 慣例 |
| 未來新增 network | 須先 update `affiliate-networks.json`；commerce entry 才可引用 |

### 8.3 sourceKey 邊界

| 維度 | 決策 |
| --- | --- |
| 是否屬於 commerce validator scope | ❌ **不**；sourceKey 屬 `link-sources.json` 之命名空間 |
| 在 commerce entry 出現之情境 | commerce entry 可有 optional `sourceKey` hint（per night-18 §5.2 #8），但 commerce validator **不**為其做 against-link-sources 之 referential check |
| 既有 validator | `validateRelatedLinksField` 已對 `relatedLinks[].sourceKey` / `otherLinks[].sourceKey` 做 against `link-sources.json` 之 `buildActiveSourceKeySet` 檢查 |
| 不混用原則 | commerce validator **不**重複實作 sourceKey not-found 檢查；若未來 commerce entry 之 `sourceKey` 須被檢查，應抽出 `buildActiveSourceKeySet` 成 module-level helper，commerce validator 引用之；本 phase 不規劃 |

### 8.4 不用 URL pattern 自動推斷

🔑 **絕對紅線**：

- ❌ 不用 hostname 推 `merchantKey`（如 `books.com.tw` → `books-com-tw`）
- ❌ 不用 redirect domain 推 `networkKey`（如 `whitehippo.net` → `books`）
- ❌ 不用 query token 推 `linkId`（如 `?sid=xxx` → `xxx`）
- 所有 commerce entry 之 key 欄位**由作者明示填寫**；validator 只 syntax-check

理由 per night-18 §3.1 + §11.1：URL token 不可逆向；regex 派生會在 platform 變動時破裂。

---

## 9. Secret / Token Safety Rules

### 9.1 紅線（永遠 enforced）

per night-18 §5.4 + night-19 §5.3 + CLAUDE.md §3.2 download R1 精神：

- ❌ **affiliate dashboard credentials**（email / password / OAuth client secret / API key）**永不**進 commerce-links.json
- ❌ **存取 token**（bearer token / refresh token / session id）**永不**進 commerce-links.json
- ❌ **使用者表單資料**（respondent email / 姓名 / 答覆）**永不**進 commerce-links.json
- ❌ **commission / payout / clickCount**（屬 affiliate dashboard / GA4）**永不**進 commerce-links.json
- ❌ **帳號 email / 結算密碼 / 私人 Drive folder id**（屬隱私 / 安全）**永不**進 commerce-links.json

### 9.2 R15 — suspicious-secret-token 規劃

| 屬性 | 值 |
| --- | --- |
| trigger | entry 任一 string 欄位含 obvious heuristic（如 `bearer ` 開頭 / `apikey=` / `token=` / `authorization:` / `secret=`） |
| severity | `warning` |
| message shape | **僅**提示欄位路徑與 linkId；**不**回貼具體 token 字串 |
| 紅線 | 不掃描 frontmatter；不存 grep 結果；不寫真實 token 至 fixture |
| 啟動 | 屬 long-tail；本 phase 不規劃實作 detection 之 regex；建議延後 |
| 誤判緩衝 | 一般 URL query parameter（如 `?utm_source=` / `?id=` / `?sid=`）**不**得觸發；heuristic 須謹慎 |

### 9.3 避免誤判 query parameter

| 不應觸發之合法情境 | 範例 |
| --- | --- |
| UTM 參數 | `?utm_source=blog&utm_campaign=portable_blog_system` |
| 產品 SKU | `?id=0010987654` |
| 通路 affiliate redirect | `?sid=xxx&uid1=blog` |
| 廣告 campaign | `?gclid=xxx` |
| 一般 search query | `?q=atomic+habits` |

→ R15 heuristic 須對 `bearer ` / `Authorization:` / 等 **顯式 token 樣式**檢測，**不**對「URL 含 query string」一般化。

### 9.4 本 phase 不掃描 / 不檢測

本 phase 純文件；**不**掃描 commerce-links.json；**不**輸出任何 grep 結果；**不**對既有 settings JSON 做 secret detection 之 dry run。

---

## 10. Fixture Strategy

⚠️ **本 phase 不建立任何 fixture**。以下為未來 fixture phase 之規劃。

### 10.1 候選 fixture 清單

| # | fixture purpose | 觸發 rule | 是否新增 posts count | 是否新增 warning count |
| --- | --- | --- | --- | --- |
| F1 | registry malformed shape（root 非 object 或 commerceLinks 非 array）| R1 / R2 | ❌（屬 settings fixture，不算 post）| ✅ +1 / +2 |
| F2 | dup linkId | R5 | ❌ | ✅ +1（per dup key 1 warning）|
| F3 | invalid targetUrl format | R7 | ❌ | ✅ +1 |
| F4 | missing targetUrl (active=true) | R6 | ❌ | ✅ +1 |
| F5 | missing / empty internalLabel | R8 / R9 | ❌ | ✅ +2（dual fixture）|
| F6 | unknown networkKey | R11 | ❌ | ✅ +1 |
| F7 | inactive entry referenced from post | C4（需 registry + post fixture）| ✅ +1 post | ✅ +1 |
| F8 | replacementTarget not found | R12 | ❌ | ✅ +1 |
| F9 | replacementTarget self | R13 | ❌ | ✅ +1 |
| F10 | inactive missing replacement | R14 | ❌ | ✅ +1 |
| F11 | content ref not-found | C3 | ✅ +1 post | ✅ +1 |
| F12 | content ref invalid-type / empty | C1 / C2 | ✅ +1~2 posts | ✅ +1~2 |
| F13 | intra-post duplicate ref | C5 | ✅ +1 post | ✅ +1 |

### 10.2 Fixture 落地順序建議

```
Phase A：registry-level source only（no fixture）           baseline: 0/60/53 (unchanged)
Phase B：registry-level fixtures（F1..F6 / F8..F10）        baseline: 0/(60+N)/53（N depends on fixture count；posts count unchanged 若用 settings fixture）
Phase C：content-reference source only（no fixture）       baseline: unchanged from Phase B
Phase D：content-reference fixtures（F7 / F11..F13）       baseline: 0/(60+N+M)/(53+K)
Phase E：Admin picker / renderer fallback                  （out of scope；屬獨立 phase）
```

### 10.3 Settings fixture 之邊界

⚠️ **不**動 production `content/settings/commerce-links.json`；fixture 須放於：

- 候選 1：`content/validation-fixtures/settings/commerce-links-malformed.json`（mirror future hardening pattern；目前無此路徑）
- 候選 2：透過 mock injection（validator 接受 `settings` 參數，fixture phase 將 mock object 注入）
- 候選 3：跳過 settings-level fixture（如同 download R1 之選擇），只測 source code in CI；本 phase 不裁決

本 phase 不裁決候選方案；屬 fixture phase 之獨立決策。

### 10.4 預期 baseline 變動

| stage | posts count | warnings count |
| --- | --- | --- |
| current（pre-validator）| 53 | 60 |
| Phase A 後（registry-level source only）| 53 | 60 |
| Phase B 後（registry-level fixtures，假設 +6 warnings）| 53 | 66 |
| Phase C 後（content-reference source only）| 53 | 66 |
| Phase D 後（content-reference fixtures，假設 +4 warnings + 3 posts）| 56 | 70 |

僅為估算；實際 fixture 數量於 fixture phase 才裁決。

### 10.5 本 phase 不動 fixture 之原因

- 本 phase 為 docs-only；不允許動 fixture（per spec §11 紅線）
- fixture 設計屬獨立階段；應在 source contract 凍結後才設計（fixture 必須對齊 rule trigger condition / message shape）
- 過早建立 fixture 會使後續 rule 修正困難

---

## 11. Source Implementation Plan

### 11.1 Phase ladder

⚠️ **僅為建議**；本 phase 不自動啟動下一階段。

| Phase | 範圍 | source 變動 | fixture 變動 | baseline 變動 |
| --- | --- | --- | --- | --- |
| **A** | registry-level validator source only（R1..R14；不含 R15）| `src/scripts/validate-content.js`（新增 helper + registry loop call）| ❌ 不新增 | ❌ 維持 0/60/53 |
| **B** | registry-level negative fixtures（F1..F6 / F8..F10）| ❌ 不改 source | ✅ 新增 fixtures | ⚠️ 預期 +N warnings；posts count 不變或 +N |
| **C** | content-reference validator source only（C1..C5；不含 C6/C7/C8/C9）| `src/scripts/validate-content.js`（新增 helper + post loop call）| ❌ 不新增 | ⚠️ baseline 視 production 文章是否已用 ref；現況 0 篇 → 不變 |
| **D** | content-reference validator source 之 fixtures（F7 / F11..F13）| ❌ 不改 source | ✅ 新增 fixtures | ⚠️ 預期 +N warnings + posts count +K |
| **E** | Admin picker read-only preview / renderer fallback / R15 / C6..C9 long-tail | 屬獨立 phase；不在本 ladder | n/a | n/a |

### 11.2 Phase A 之 source scope

- 新增 helper：`validateCommerceLinkRegistry(registry, sourcePath, issues, affiliateNetworkIdSet)`
- 新增 helper：`buildCommerceLinkIdSet(registry)` → Set | null
- 新增 helper：`buildActiveAffiliateNetworkIdSet(settings)` → Set
- 新增 call site：post loop **外**（mirror `validateDownloadRegistry` 之 call site）
- 新增 rules：R1..R14（R15 留到 phase E）
- source 邊界：
  - **不**改 loader（loader 已暴露 `settings.commerceLinks`；若 R1 / R2 需 raw registry，須先擴 loader；屬 phase A 之 prerequisite 決策；可選擇 skip R1 / R2 並只實作 R3..R14）
  - **不**改 fixture
  - **不**改 content
  - **不**改 renderer / Admin
  - **不**改 GA4

### 11.3 Phase A 之 baseline expectation

- pre: 0/60/53
- post: 0/60/53（empty registry 不觸發任何 R1..R14）

### 11.4 Phase B 之 fixture scope（不在本 phase）

- 設計 settings fixture 之路徑（per §10.3）
- 設計 fixture 之 schema（每個 fixture 對應 1 個 rule；mirror download `_test-<rule-id>.md`）
- 預期 baseline warnings 變動
- 屬 phase B 獨立決策

### 11.5 Phase C 之 source scope（不在本 phase）

- 新增 helper：`validateAffiliateCommerceRefs(post, linkIdSet, registryEntryById, sourcePath, issues)`
- 新增 call site：post loop 內（僅 ready / published）
- 新增 rules：C1..C5

### 11.6 Phase D / E 之 scope（不在本 phase）

per §11.1。

---

## 12. GA4 / Click Tracking Boundary

### 12.1 validator 不改 GA4

| 維度 | 決策 |
| --- | --- |
| GA4 source code | ❌ 不改 `src/views/tracking/ga4.ejs` / `src/js/modules/ga4-events.js` / `src/js/modules/link-tracker.js` / `src/views/tracking/ga4-events-helper.ejs` |
| GA4 spec | ❌ 不改 `docs/ga4-link-tracking-spec.md` / `docs/click-tracking-governance.md` |
| GA4 config | ❌ 不改 `content/settings/ga4.config.json` |
| GA4 validation | ❌ 不啟動 GA4 Realtime 驗收；不解除 pm-26 deploy gate |
| reverse UTM | ❌ 不解除 dormant；source 仍 landed but un-deployed |

### 12.2 commerce 命名空間之未來保留

per night-18 §8.1 + night-19 §10.2：

| 候選 future GA4 param | 來源 |
| --- | --- |
| `commerce_link_id` | commerce entry `linkId`（registry-level） |
| `merchant_key` | commerce entry `merchantKey`（registry-level） |
| `network_key` | commerce entry `networkKey` 或 `affiliate-networks.json[].id`（registry-level） |

🔑 commerce validator phase A..D **不**啟動上列 GA4 param；屬獨立 GA4 phase；屬 phase E 之後。

### 12.3 不 build / deploy / Blogger repost

- ❌ 不執行 `npm run build` / `npm run build:github` / `npm run build:blogger`
- ❌ 不執行 `npm run dev` / `npm run preview`
- ❌ 不執行 `npm install`
- ❌ 不執行 Blogger 手動重貼 / GitHub Pages deploy
- ❌ 不執行 GA4 Realtime 驗收

---

## 13. Risk / Red Lines

### 13.1 本 phase 紅線（必須 enforced）

- ❌ **不**修改 `src/scripts/validate-content.js`
- ❌ **不**修改 `src/scripts/load-settings.js`
- ❌ **不**修改 `content/settings/commerce-links.json`
- ❌ **不**修改任何 content（`content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` / `content/drafts/` / `content/archive/`）
- ❌ **不**修改任何 templates（`content/templates/`）
- ❌ **不**修改任何 fixtures（`content/validation-fixtures/`）
- ❌ **不**修改任何既有 settings（`affiliate-networks.json` / `link-rules.json` / `link-sources.json` / `download-assets.json` / `download-forms.json` 等）
- ❌ **不**修改 `package.json` / `package-lock.json` / `vite.config.js`
- ❌ **不**新增 validator rules（純文件規劃）
- ❌ **不**新增 fixtures（registry malformed / dup-key / not-found / inactive / replacement-target / content-ref 全不建）
- ❌ **不**自動替換 production raw affiliate URL（mirror night-18 §7.6）
- ❌ **不**用 URL pattern 推斷商品 / 平台（mirror night-18 §11.1）
- ❌ **不**放 affiliate token / OAuth secret / API key / dashboard credentials / 結算數據（mirror night-18 §5.4 / §11.1）
- ❌ **不**放使用者表單資料進 repo（mirror download R1）
- ❌ **不**渲染 `internalLabel` 前台（mirror night-18 §9.3）
- ❌ **不**執行 `npm install` / `npm run build` / `npm run dev` / `npm run preview`
- ❌ **不**build / deploy / Blogger repost / GA4 validation
- ❌ **不**啟動 Admin Apply / middleware write / admin-write-cli
- ❌ **不**解除 reverse UTM dormant
- ❌ **不**解除 pm-26 deploy gate
- ❌ **不**修改 MEMORY / project memory 檔
- ❌ **不**自動開始下一階段
- ❌ **不**在本 docs 內貼真實 affiliate token / URL 內含 token

### 13.2 設計風險（識別並標記）

| 風險 | 說明 | 緩衝 |
| --- | --- | --- |
| **R1 / R2 觀察能力受限** | 因 loader Array.isArray gate 已過濾，validator 端可能無法觀察 root 非 object 之情形 | 屬 phase A 內部決策；可選 (a) 擴 loader 暴露 raw registry；(b) 不實作 R1 / R2；(c) 在 loader fallback 路徑寫 informational warning |
| **content-reference rule 與既有 affiliate.links 結構衝突** | 既有 `affiliate.links[].label/network/url` 為 raw model；新加 `.ref` 須兼容；validator 必須**只**對 `ref` 為非空 string 之 entry 做 ref check | per §6.1 / §6.2 / §6.5 已凍結兼容語意；C1..C5 trigger condition 明確要求 ref 非 undefined |
| **C6 過早啟用造成 production 噪音** | 若 C6 在 near-term C 期間啟用，所有 ref + raw coexist entries 都會 warn | per §6.5 明確凍結：C6 啟動條件為 renderer landed + user explicit approval；本 phase 不啟用 |
| **R10 syntax-check 過嚴** | merchantKey 可能因 author 偶然填大寫 / underscore 觸發 warn | warning-only；不阻擋；author 可改正；R10 屬 long-tail；可延後啟用 |
| **R11 雙向耦合** | commerce entry 之 networkKey 對齊 affiliate-networks.json 之 id；若 affiliate-networks 改名會殃及 commerce | affiliate-networks.json 之 id 為 long-term stable；本 phase 不規劃 networks 改名；屬 future risk |
| **fixture 設計風險** | 未來 fixture phase 須對齊 rule trigger / message shape；fixture 不同步會破裂 | fixture phase 須在 source phase 之後；本 phase 已凍結 rule contract |
| **R15 secret detection 誤判** | heuristic 不準會打擾作者 | 屬 long-tail；本 phase 不啟動；屬 phase E |

### 13.3 acceptance 風險（識別並標記）

- **下一 phase 偏離本決策**：若下一 phase 加入 R15 / C6..C9 而 source phase A 只規劃 R1..R14 + C1..C5 → 違反本決策。緩衝：phase A / C source 之 acceptance criteria 明確列出**只**實作 R1..R14 / C1..C5。
- **未來 validator 衝突**：若 R1 / R2 對 empty registry 之認定不同 → empty registry 之 R1-clean 條件可能被誤判。緩衝：§7.2 已明確凍結 R1-clean 7 條條件。
- **R10 / R11 對 production data 之意外影響**：因 production registry 為 empty，不會觸發；屬 fixture-phase 風險。
- **C3 未來文章 ref 落地時意外觸發**：若 production post 加 ref 但 registry 尚無對應 entry → C3 觸發。緩衝：production migration 為 explicit approval per post（per night-18 §12 step 12）；warn 為預期行為，非 noise。

---

## 14. Acceptance Criteria For Future Source Phase

### 14.1 Phase A acceptance（registry-level validator source-only）

| # | 條件 | 驗證方式 |
| --- | --- | --- |
| 1 | 唯一改動：`src/scripts/validate-content.js`（+ optional `src/scripts/load-settings.js` 若擴 raw registry）| `git diff --name-only` 列表 |
| 2 | **不**改 `content/settings/commerce-links.json` | `git diff content/settings/commerce-links.json` 為空 |
| 3 | **不**改 `content/`（任何 post / template / fixture）| `git diff content/` 為空 |
| 4 | **不**改 renderer（`src/views/`）/ Admin / build scripts（除 validate-content.js）| `git diff` 限縮在指定檔案 |
| 5 | **不**新增 fixture | `git status` 不顯示新檔於 `content/validation-fixtures/` |
| 6 | empty registry 不觸發任何 warning | `npm run validate:content` 結果 = **0 / 60 / 53**（未變動）|
| 7 | rule id 名稱穩定（per §5.2 命名）| 人工檢視 |
| 8 | warning message shape 一致（per §5.2）| 人工檢視 |
| 9 | helper 命名與既有 download / related-links pattern 一致 | code review |
| 10 | HEAD == origin/main（after push）| `git rev-parse HEAD == origin/main` |
| 11 | ahead / behind = 0 / 0 | `git rev-list --left-right --count` |
| 12 | working tree clean | `git status --porcelain` 空 |
| 13 | commit message 不含 Claude 標記 | 人工檢視 |
| 14 | 無 `npm install` / `package.json` 變動 | `git diff` |

### 14.2 Phase C acceptance（content-reference validator source-only）

mirror §14.1，唯一差異：

- 唯一改動：`src/scripts/validate-content.js`（新增 content-reference helper + post loop call）
- 仍**不**新增 fixture
- empty registry + 無 production post 含 ref → 不觸發任何 C1..C5 warning
- baseline 維持 0/60/53

### 14.3 Phase B / D acceptance（fixture phase）

- 唯一改動：`content/validation-fixtures/` 或新建 settings fixture 路徑
- **不**改 source（validate-content.js 已 land）
- **不**改 production registry
- baseline warnings count 預期增加（per §10.4 估算）
- posts count 預期增加（per §10.4）

### 14.4 違反任一條 → 不可 land

下一 phase 執行者若發現任一條無法滿足，須**停止 land**，回報問題；不得繞過。

---

## 15. Final Recommendation

### 15.1 本階段 single conclusion

> **Commerce links validator preanalysis 已 landed**：
>
> - **registry-level rules**：R1..R15 候選（R1..R14 in scope；R15 long-tail；命名 `commerce-links-*` / `commerce-link-*` 兩前綴）
> - **content-reference rules**：C1..C9 候選（C1..C5 in scope；C6 為 migration-phase；C7..C9 long-tail）
> - **empty registry R1-clean 凍結**：current empty registry 不可觸發任何 warning；未來 phase A source-only 後 baseline 必維持 **0 / 60 / 53**
> - **merchant / network / source boundary 凍結**：merchantKey syntax-only；networkKey against `affiliate-networks.json`；sourceKey 屬 `link-sources.json` 命名空間，不混用
> - **不**用 URL pattern 推斷 commerce metadata（紅線）
> - **secret / token safety**：不放 dashboard credentials / token / API key / respondent data；R15 為 long-tail heuristic
> - **fixture cadence**：source phase A 先 land；fixture phase B 後續；content-reference source phase C；content-reference fixture phase D；Admin / renderer phase E（out of scope）
> - **GA4 / build / deploy boundary**：validator phase 不改 GA4；不 build / deploy / Blogger repost；reverse UTM 維持 dormant；pm-26 維持 BLOCKED

### 15.2 本階段結束後預設狀態

**Final Idle Freeze / EXIT**。

唯一輸出為本檔；不動 source / content / settings / templates / fixtures / package / dist / gh-pages / memory；validate baseline 維持 **0 errors / 60 warnings / 53 posts**；所有 dormant gates 維持 dormant；所有紅線維持 enforced。

### 15.3 不自動推進下一階段

若 user 決定推進，**不**建議直接做 source implementation + fixtures 混合。建議下一步（依風險由低至高）：

1. **read-only acceptance**（docs-only；認可本決策；可省略）
2. **registry-level validator source-only preflight**（即 phase A 前置 docs：凍結 helper 命名 / call site / parameter shape；可選）
3. **registry-level validator source only**（phase A；只改 validate-content.js；不新增 fixture；baseline 維持 0/60/53）

⚠️ **不**建議：

- ❌ 同時做 phase A + phase B（source + fixtures 混做）→ 風險過高
- ❌ 同時做 phase A + phase C（registry + content-reference 混做）→ rule cascade 設計風險高
- ❌ 跳過 phase A 直接做 phase B / phase D → fixture 無 source 對齊
- ❌ 任何牽涉 renderer / Admin / GA4 / build / deploy / Blogger repost 之 phase（屬 phase E 及以後）

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-preanalysis.md`（night-1；problem statement + Option A/B/C）
- `docs/20260603-commerce-affiliate-link-registry-identifier-preanalysis.md`（night-17；三軸模型）
- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（night-18；schema decision + v0 23 欄位 + linkId 命名 convention + validator V1–V15 規劃清單）
- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`（night-19；檔名 / shape / loader cadence）
- `docs/related-links-schema.md`（sourceKey vs displayLabel 分離原則；fallback chain；validator `validateRelatedLinksField` 範本）
- `docs/click-tracking-governance.md`（GA4 event 列表；data attr convention；不擴張原則）
- `docs/ga4-link-tracking-spec.md`（link_type 派生規則；link_source_key conditional emit）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（download registry R1 紅線；commerce mirror 之 token / respondent data 邊界範本）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty registry landing pattern；download cadence 範本）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series cadence 範本；R2 not-found / R5b duplicate）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（settings 列表 + download registry R1 精神 + R5b duplicate）/ §12（書評 affiliate.links schema）/ §16（連結處理）/ §16.4（reverse UTM dormant）/ §27 / §29 / §30
- `content/settings/affiliate-networks.json`（既有 network registry；2 entries：`books` / `affiliate-network`；R11 之 referential check target）
- `content/settings/link-sources.json`（既有 sourceKey registry；獨立命名空間；不混用）
- `content/settings/link-rules.json`（既有 external / affiliate / internal rel 規則）
- `content/settings/commerce-links.json`（empty registry；本 phase 不動）
- `content/settings/download-assets.json` / `download-forms.json`（empty registry shape 參考；R-series cadence 範本）
- `src/scripts/load-settings.js`（既有 `readJsonOptional` pattern；commerce loader 已落地）
- `src/scripts/validate-content.js`（既有 R-series cadence；validateDownloadRegistry / buildDownloadKeySet / validateRelatedLinksField / buildActiveSourceKeySet 為 commerce validator 之範本；本 phase 不動）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`78f1e9a3cddaf29e47ea457be17f2f5546da9a03`（short `78f1e9a`）
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`feat(settings): expose commerce links registry`
- `npm run validate:content`（pre-commit）→ **0 errors / 60 warnings / 53 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260603-commerce-links-validator-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content`（post-commit）預期維持 **0 / 60 / 53**

---

（本文件結束）
