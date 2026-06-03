# 2026-06-04 Commerce Links Registry Fixture Mechanism — Preanalysis (docs-only)

Phase name: `20260604-am-2-commerce-links-registry-fixture-mechanism-preanalysis-docs-only-a`
Date: 2026-06-04 07:xx +0800
Mode: **docs-only preanalysis**（no source / no content / no settings registry mutation / no templates / no fixtures / no loader change / no validator rule landing / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / no `npm install`）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-19 `e40a278` | commerce affiliate link empty registry preanalysis | 檔名 / 路徑 / 空 JSON shape / loader 與 validator cadence |
| night-20 `c1a6974` | empty registry implementation（settings-only） | 新增 `content/settings/commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure（source-only） | `load-settings.js` 暴露 `settings.commerceLinks = []`；無 consumer |
| night-22 `d5cfcd0` | commerce-links validator preanalysis（docs-only） | 凍結 registry-level R1..R15 + content-reference C1..C9 之 rule contract |
| night-25 `94a1d47` | commerce links registry-level validator source-only landing | `src/scripts/validate-content.js` 新增 `validateCommerceLinkRegistry` + `buildCommerceLinkIdSet` + `buildActiveAffiliateNetworkIdSet`；11 條 safe registry-level rule（R3..R9 / R11..R14）；明確 defer R1 / R2 / R10 / R15；empty registry baseline 維持 0/60/53 |
| **am-2（本 phase）** `（本 commit）` | **commerce-links registry fixture mechanism preanalysis（docs-only）** | 設計「未來如何安全測 registry-level commerce warnings」之 fixture / harness 機制；不實作 source；不建立 fixture；不動 production registry |

am-2 **不**重啟 schema / rule 裁決；亦**不**啟動 source。本階段唯一目的為：

> 在 commerce registry-level validator 11 條 rule 已 landed 但**零 fixture 覆蓋**之現況下，先決定「未來要如何安全地建立 fixture 或 harness 機制」之候選方案；凍結 settings-fixture path naming convention / 紅線 / baseline 期望變動；為下一個 fixture-phase 或 harness-phase 提供可直接執行之 contract。

本階段為純文件；**不**改 `src/scripts/validate-content.js`、**不**改 `src/scripts/load-settings.js`、**不**改 `content/settings/commerce-links.json`、**不**改任何 content / templates / fixtures / package。

---

## 1. Executive Summary

### 1.1 一句話結論

> **建議採 Option D（skip settings-level fixtures；沿用 download R1-style source-only acceptance）作為近期路線**；同時凍結 Option A 之 `content/validation-fixtures/settings/commerce-links/<scenario>.json` path naming convention 供未來必要時啟用；**不**做 Option B（source harness / mock injection）；**不**做 Option C（temporary local mutation）。

### 1.2 推薦理由摘要

- **與既有 download R-series cadence 完全對齊**：`download-registry-invalid-shape` / `download-registry-duplicate-key` 兩條 download registry-level rule 已 landed >1 個月，從未建立 fixture；coverage 倚賴 source review + helper unit-shape inspection；validate baseline 從未為其而擾動。commerce R3..R14 mirror 之即可。
- **最低 baseline 擾動**：保持 0/60/53 baseline 不變，無需新增 settings fixture 路徑、loader 改造、validator signature 變更。
- **最低治理成本**：不需引入新 fixture-routing 機制、不需第二份 loader code path、不需 mock 框架。
- **不違反任一紅線**：production `content/settings/commerce-links.json` 維持 R1-clean empty registry；無 secret / token / respondent data 風險；reverse UTM 與 pm-26 維持 dormant / BLOCKED。
- **保留 future escape hatch**：若日後 R10 / R15 / merchant registry / 大量複雜 entry-level 規則陸續 land 且 source review 無法充分覆蓋時，可依本 doc §10 凍結之 Option A path naming convention 升級啟用 fixture loader；屆時為**獨立 phase**，不在本 phase 範圍。

### 1.3 本 phase 範圍

- 摘要當前 commerce validator + fixture architecture。
- 凍結「為何**現在**沒有 registry-level fixture 機制」之 problem statement。
- 列出 4 個候選機制 A / B / C / D；逐項比較 safety / complexity / production-pollution risk / future maintainability / baseline impact。
- 推薦 Option D 為近期路線；同時凍結 Option A 之 path naming convention 供 future 啟用之 escape hatch。
- 列 rule coverage matrix（11 條 landed rules + 4 條 deferred rules）。
- 凍結 fixture naming / path proposal（供 Option A 未來啟用時直接套用）。
- 凍結 validate baseline 期望變動 = 0（本 phase + 推薦路線下，baseline 永遠維持 0/60/53）。
- 凍結紅線：不動 production registry；不動 source；不動 fixtures；不啟動 reverse UTM / pm-26 / Admin Apply。
- 列 candidate next phases（純資訊；不自動啟動）。
- **不**自動啟動下一階段。

### 1.4 本 phase 不做的事

- ❌ 不改 `src/scripts/validate-content.js`
- ❌ 不改 `src/scripts/load-settings.js`
- ❌ 不改 `content/settings/commerce-links.json`
- ❌ 不改任何 content / templates / fixtures
- ❌ 不建立新的 fixture（包含 settings-level 與 post-level）
- ❌ 不建立新的 directory（`content/validation-fixtures/settings/` 不新增）
- ❌ 不改 `package.json` / `package-lock.json`
- ❌ 不執行 `npm install` / `npm run build` / `npm run dev`
- ❌ 不啟動 Admin picker / renderer / GA4 / build / deploy
- ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate
- ❌ 不裁決 Option A 之具體實作（仍屬未來獨立 phase）
- ❌ 不裁決 R1 / R2 / R10 / R15 之啟動順序

---

## 2. Current Baseline

### 2.1 git / validate baseline（pre-commit）

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `94a1d47ee3d98764b66b61f58b21e22bed8b190c`（short `94a1d47`）|
| `HEAD == origin/main`（pre-commit）| yes（ahead / behind = `0 / 0`）|
| working tree（pre-commit）| clean |
| 最新 commit subject（pre-commit）| `feat(commerce): validate commerce link registry entries` |
| `npm run validate:content`（pre-commit）| **0 errors / 60 warnings / 53 posts** |

### 2.2 commerce-links registry 之既有狀態

`content/settings/commerce-links.json`（per night-20 `c1a6974`）：

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "commerceLinks": [],
  "notes": ""
}
```

R1-clean condition 七條全部滿足（per night-22 §7.2）。

### 2.3 loader 暴露之既有狀態

`src/scripts/load-settings.js`（per night-21 `78f1e9a`）：

```js
const commerceLinksRegistry = await readJsonOptional('commerce-links.json', { commerceLinks: [] });
result.commerceLinks = Array.isArray(commerceLinksRegistry?.commerceLinks) ? commerceLinksRegistry.commerceLinks : [];
```

→ `settings.commerceLinks` 為 `[]`（empty array）；metadata 欄位（`schemaVersion` / `updatedAt` / `notes`）**不**暴露至 in-memory settings。
→ loader 已將 raw registry shape unwrap 為 plain array；validator 端看不到 root object 或 `commerceLinks` 之 raw shape。

### 2.4 validator 已 landed 之狀態（per night-25 `94a1d47`）

`src/scripts/validate-content.js` 已 land 之 commerce helpers：

- `buildActiveAffiliateNetworkIdSet(settings)` → 從 `settings.affiliateNetworks` 建 Set；非 array → null
- `buildCommerceLinkIdSet(commerceLinks)` → 從 array build linkId Set；非 array → null
- `validateCommerceLinkRegistry(commerceLinks, sourcePath, issues, affiliateNetworkIdSet)` → 跑 11 條 rule

call site（registry-level；post loop 外）：

```js
const affiliateNetworkIdSet = buildActiveAffiliateNetworkIdSet(settings);
validateCommerceLinkRegistry(
  settings.commerceLinks,
  'content/settings/commerce-links.json',
  issues,
  affiliateNetworkIdSet,
);
```

已 land 之 11 條 rule（warning-only）：

```
commerce-link-invalid-entry-type            (R3)
commerce-link-missing-link-id               (R4)
commerce-link-duplicate-link-id             (R5)
commerce-link-missing-target-url            (R6)
commerce-link-invalid-target-url            (R7)
commerce-link-missing-internal-label        (R8)
commerce-link-internal-label-empty          (R9)
commerce-link-invalid-network-key           (R11)
commerce-link-replacement-target-not-found  (R12)
commerce-link-replacement-target-self       (R13)
commerce-link-inactive-missing-replacement  (R14)
```

明確 deferred（per night-25 註解）：

- R1 / R2（registry root / array shape）：loader unwrap 後不可觀察
- R10（merchant key syntax）：merchant registry 未存在；syntax-only 規格未凍
- R15（suspicious secret token）：誤判風險大

content-reference rules（C1..C9）：尚未啟動；屬 future content-reference source phase。

### 2.5 既有 fixture architecture 之觀察

`content/validation-fixtures/` 之結構：

```
content/validation-fixtures/
├── blogger/posts/   ← 40 files；皆為 _test-<rule-id>.md
└── github/posts/    ← 28 files；皆為 _test-<rule-id>.md
```

關鍵觀察：

- ✅ **唯一 fixture 型態為 post `.md` frontmatter**（與 production `.md` 完全同型；由 `load-posts` 載入）。
- ❌ **無 `content/validation-fixtures/settings/` 子目錄**；無 settings-level fixture pattern。
- ❌ **download R1 兩條 registry-level rule 完全無 fixture**（`download-registry-invalid-shape` / `download-registry-duplicate-key`）；coverage 倚賴 source review。
- ❌ **無 commerce-* 相關 fixture**（無論 post-level 或 settings-level）。

→ 既有 fixture pattern**根本不支援 registry-level test**；download R-series 已先建立先例（registry-level rules 不建 fixture）。

### 2.6 本 phase 不改變之既有 baseline

- 本 phase 純 docs-only；新增 1 個 docs 檔。
- validate baseline 預期 post-commit 仍為 **0 / 60 / 53**。
- 唯一檔案異動 = `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（新增）

---

## 3. Current Validator Architecture

### 3.1 Validator 之 settings 來源

唯一 settings 載入入口為 `src/scripts/load-settings.js` `loadSettings()`：

```js
export async function loadSettings() {
  const result = {};
  for (const [key, file] of SETTINGS_FILES) {
    result[key] = await readJson(file);   // fail-fast
  }
  result.linkSources    = await readJsonOptional(...);   // empty fallback
  result.downloadAssets = await readJsonOptional(...);
  result.downloadForms  = await readJsonOptional(...);
  result.commerceLinks  = Array.isArray(...) ? ... : [];  // unwrapped array
  return result;
}
```

特性：

- 唯一從 `content/settings/` 讀取，**無**參數化路徑。
- `commerceLinks` 已 **unwrap** 成 array；metadata 欄位丟棄。
- `validate-content.js` `validateContent({ posts, settings })` 接受 settings object，但**全部生產路徑**均經由 `loadSettings()` 提供。

### 3.2 Validator 之 entry point

```js
// validate-content.js（main）
const settings = await loadSettings();
const posts = await loadPosts(settings);
const result = validateContent({ posts, settings });
```

兩條路徑：

- **CLI `npm run validate:content`** → fixed `loadSettings()` → 永遠讀 production `content/settings/*.json`
- **`build-github` / `build-blogger` 內部 call** → 同一 `loadSettings()` → 同樣 production registry

⚠️ 目前**無**第二條 path 接受 alternate settings root；fixture mechanism Option A 若要 work 必須擴展此 path。

### 3.3 Commerce validator 之 callable surface

`validateCommerceLinkRegistry` 為**純函式**：接受 `commerceLinks` array + `affiliateNetworkIdSet`；不讀檔；不副作用。

→ **Pure function 已足以支援未來 source-level unit harness**（Option B 之 subset）；唯一缺口是「如何把 malformed registry 餵進這個 pure function 並斷言 issues output」。

### 3.4 Validator 之 baseline source

`validate baseline = 0 / 60 / 53` 之 3 個分子：

| 來源 | post / settings | 影響面 |
| --- | --- | --- |
| production posts（`content/{github,blogger}/posts/`）| posts | 53 - fixture 數量 = production posts；其中少數觸發 warning |
| validation-fixtures posts（`content/validation-fixtures/{github,blogger}/posts/`）| posts | 多數 warnings 來源 |
| settings registry warnings | settings | **目前 = 0**（所有 registry-level rules 在 empty registry 下不觸發；commerce R3..R14 mirror 同理） |

→ 任何 settings-level fixture 機制若被啟用，必然改變第三來源；本 phase 推薦路線（Option D）保留此分子為 0。

---

## 4. Current Fixture Architecture

### 4.1 Fixture 之 layout

```
content/validation-fixtures/{site}/posts/_test-<rule-id>.md
```

範例（blogger）：

```
_test-download-asset-ref-duplicate.md
_test-download-asset-ref-empty-item.md
_test-download-asset-ref-invalid-type-item.md
_test-download-asset-ref-not-found.md
_test-download-asset-refs-invalid-type-object.md
_test-related-links-entry-kind-invalid.md
_test-related-links-not-array.md
...
```

每個 fixture **一對一**對應一條 rule 之 positive trigger。

### 4.2 Fixture 之 loading 機制

`src/scripts/load-posts.js`（推測）負責掃描 `content/{github,blogger,validation-fixtures/{github,blogger}}/posts/**/*.md`，套 frontmatter parse + 載入。fixture 與 production post **同 pipeline**；驗證器無從區分。

→ Fixture 屬「post 維度」之 test data；schema 為 post frontmatter；無 settings 維度之等價物。

### 4.3 Registry-level rules 之 fixture 空白

| Rule | 觸發 layer | 是否有 fixture | coverage source |
| --- | --- | --- | --- |
| `download-registry-invalid-shape` | registry | ❌ 無 | source review only |
| `download-registry-duplicate-key` | registry | ❌ 無 | source review only |
| `related-links-source-key-not-found` | post（registry-aware） | ❌ 無（需 link-sources.json 變動配合）| source review + active production data |
| `commerce-link-invalid-entry-type` (R3) | registry | ❌ 無 | source review only |
| `commerce-link-missing-link-id` (R4) | registry | ❌ 無 | source review only |
| `commerce-link-duplicate-link-id` (R5) | registry | ❌ 無 | source review only |
| `commerce-link-missing-target-url` (R6) | registry | ❌ 無 | source review only |
| `commerce-link-invalid-target-url` (R7) | registry | ❌ 無 | source review only |
| `commerce-link-missing-internal-label` (R8) | registry | ❌ 無 | source review only |
| `commerce-link-internal-label-empty` (R9) | registry | ❌ 無 | source review only |
| `commerce-link-invalid-network-key` (R11) | registry | ❌ 無 | source review only |
| `commerce-link-replacement-target-not-found` (R12) | registry | ❌ 無 | source review only |
| `commerce-link-replacement-target-self` (R13) | registry | ❌ 無 | source review only |
| `commerce-link-inactive-missing-replacement` (R14) | registry | ❌ 無 | source review only |

→ Registry-level rule 整層**完全沒有** runnable fixture；commerce rules 並非例外，而是與既有 download R1 cadence **完全對齊**。

### 4.4 Post-level rules 之 fixture cadence（範本）

per 既有 download R2 / R5b / book / related-links：

- fixture 為 `_test-<rule-id>.md`
- 每條 rule ≥ 1 個 positive fixture
- fixture 觸發 warning 計入 baseline（part of expected 60）
- 不對 production post 產生 false positive

→ 對 commerce **content-reference layer**（C1..C9）若啟動，可沿用此 cadence。**對 registry-level layer**（R3..R14）此 cadence 不適用。

---

## 5. Problem Statement

### 5.1 核心問題

> **commerce registry-level validator 11 條 rule 已 landed 於 production validate-content.js，但 production `content/settings/commerce-links.json` 為 empty registry（必須維持 R1-clean），因此這 11 條 rule 在當前 baseline 下 0 觸發 → 無法在不修改 production registry 的前提下，於 `npm run validate:content` runtime 確認任一條 rule 是否確實 active / 行為是否符合 spec。**

具體子問題：

| # | 子問題 |
| --- | --- |
| 5.1.1 | 沒有任何方式可在 `validate:content` 之 runtime 證明 `commerce-link-duplicate-link-id` 規則確實會在 dup-key 出現時 fire 一條 warning |
| 5.1.2 | 沒有任何方式可在 runtime 證明 R12 / R13 互斥 cascade 正確（self 比對優先於 not-found） |
| 5.1.3 | 沒有任何方式可在 runtime 證明 R11 在 `affiliateNetworkIdSet === null` 時 skip（避免 false positive） |
| 5.1.4 | 沒有任何方式可在 runtime 證明 R14 與 R12 / R13 之並存語意（per spec：可並存） |
| 5.1.5 | 沒有任何方式可在 runtime 驗證 future C1..C9 之 cascade（mirror C3 / C4 互斥 + C5 orthogonal） |
| 5.1.6 | 未來若 commerce registry 開始 land 真實 affiliate entries，warnings 若意外被觸發無法在「fixture-driven baseline 變動」與「production data 異常」之間清楚區分 |

### 5.2 為什麼不修改 production registry

per night-19 §4.3 / night-22 §7.4：

- ❌ 預塞 sample / TODO entry → 違反 R1-clean
- ❌ 預塞 dummy entry → 違反 R1 紅線（不放 secret / token；雖然 dummy 不含 secret，但治理上引入 noise）
- ❌ 預塞 malformed shape → 違反 night-19 §7.3 條件 7（無 unknown top-level keys）

→ production registry 須保持 R1-clean；測試手段必須在 production 之外。

### 5.3 為什麼這個問題目前可暫緩

- **download R-series 先例**：download `download-registry-invalid-shape` / `download-registry-duplicate-key` 兩條 rule landed >1 個月，從未建立 fixture，亦無觀察到 production 故障（empty registry → 0 觸發）。
- **commerce R3..R14 rule 內容簡單**：cascade 邏輯經 night-22 spec 已凍結；source 已 land 並通過 manual review。
- **commerce registry 短期內仍為 empty**：reverse UTM dormant / pm-26 BLOCKED / Admin Apply dormant；無 production data 啟動驅力。

→ 問題雖然存在，但**短期內不阻擋任何 production 行為**；本 phase 為**前瞻規劃**而非緊急修補。

### 5.4 為什麼這個問題長期需要決策

- commerce registry-level rules 數量（11 條 landed + 4 條 deferred）已**超過** download R1（2 條）；source review 之認知負荷顯著上升。
- 未來 phase 若 land R10（merchant syntax）或 R15（secret token heuristic），rule 複雜度進一步升高。
- 未來 phase 若 land content-reference C1..C5（per night-22 §6），content-reference rule 之 fixture 將出現（post-level）；屆時 registry-level rule 之 fixture 真空會更顯眼。
- 若日後 commerce registry 開始 land 真實 entries（需獨立 phase）→ 一旦 baseline 出現 commerce warning，必須能可靠區分「rule 設計改動」vs「entry 不合 spec」。

→ 本 phase 凍結之 Option A path naming convention 為「長期 escape hatch」；本 phase 不啟用，但凍結 contract。

---

## 6. Candidate Mechanisms

### 6.1 Option A — Settings fixture path（額外 settings root for fixtures）

**機制**：新增獨立目錄 `content/validation-fixtures/settings/commerce-links/<scenario>.json`，每個 scenario 為一份完整 commerce-links.json shape；驗證器啟動「fixture mode」時逐一讀取、各自呼叫 `validateCommerceLinkRegistry`、合併 warnings 至 baseline。

**所需 source 變動**：

1. `load-settings.js` 新增 `loadSettingsForFixture(commerceLinksRegistry)` 或 `loadSettings({ commerceLinksOverride })`
2. `validate-content.js` 新增 fixture-mode loop：掃描 `content/validation-fixtures/settings/commerce-links/*.json`；逐一 build `affiliateNetworkIdSet`（沿用 production `affiliate-networks.json`）→ 呼叫 `validateCommerceLinkRegistry`；warnings 之 sourcePath 改寫為 fixture path
3. baseline warnings 數字將增加 N（N = scenarios × rules per scenario）

**路徑命名 convention（本 phase 凍結；供未來啟用）**：

```
content/validation-fixtures/settings/commerce-links/
├── _test-commerce-link-invalid-entry-type.json         (R3)
├── _test-commerce-link-missing-link-id.json            (R4)
├── _test-commerce-link-duplicate-link-id.json          (R5)
├── _test-commerce-link-missing-target-url.json         (R6)
├── _test-commerce-link-invalid-target-url.json         (R7)
├── _test-commerce-link-missing-internal-label.json     (R8)
├── _test-commerce-link-internal-label-empty.json       (R9)
├── _test-commerce-link-invalid-network-key.json        (R11)
├── _test-commerce-link-replacement-target-not-found.json (R12)
├── _test-commerce-link-replacement-target-self.json    (R13)
└── _test-commerce-link-inactive-missing-replacement.json (R14)
```

每份 JSON 結構（範例 R5）：

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-06-04",
  "commerceLinks": [
    { "linkId": "fixture-dup-001", "internalLabel": "fx", "targetUrl": "https://example.com/" },
    { "linkId": "fixture-dup-001", "internalLabel": "fx2", "targetUrl": "https://example.com/2" }
  ],
  "notes": "fixture for commerce-link-duplicate-link-id (R5)"
}
```

**Pros**：

- ✅ runtime evidence：可在 `npm run validate:content` 看到每條 rule 之 positive trigger
- ✅ mirror 既有 post-level fixture cadence（`_test-<rule-id>` 命名一致）
- ✅ 不污染 production registry
- ✅ 提供 future C1..C9 之 reverse reference（content-reference fixture 可指向 fixture registry 之 linkId）

**Cons**：

- ❌ 需新增 `load-settings.js` + `validate-content.js` 之 fixture-mode code path（dual code path 永久化）
- ❌ 引入新的 directory layout（`content/validation-fixtures/settings/`）；既有 fixture pattern 全為 `.md`
- ❌ baseline warnings 增加 N（每加一條 rule 之 fixture，baseline drift 一次；變動風險面增大）
- ❌ fixture registry 與 production registry 對 `affiliate-networks.json` 之共用會建立耦合（fixture 若用未 land 之 networkKey → 觸發額外 R11 warning，造成設計噪音）
- ❌ 需先實作 sourcePath 改寫（不能僅顯示 `content/settings/commerce-links.json`，否則錯置 fixture 來源）
- ❌ 大幅偏離 download R1 cadence；建立新先例後 download R1 rules 是否需 retrofit 將成為新議題

**估算 baseline 變動**：+11 warnings（11 fixture × 1 rule each）；若一個 fixture 觸發多條 cascade 則更多。

### 6.2 Option B — Source harness / mock injection seam（測試用 settings object）

**機制**：在 `validate-content.js` 新增 export `validateCommerceLinkRegistry` 為 module-level 公開 API（已是 internal pure function）；另寫獨立 harness script（如 `src/scripts/test-commerce-registry-validator.js`）直接 import 並注入 mock `commerceLinks` array + mock `affiliateNetworkIdSet`；on-demand 執行；warnings 印至 stdout 但**不**併入 `validate:content` baseline。

**所需 source 變動**：

1. `validate-content.js` export `validateCommerceLinkRegistry` / `buildCommerceLinkIdSet` / `buildActiveAffiliateNetworkIdSet`（目前為 module-local）
2. 新增 `src/scripts/test-commerce-registry-validator.js`（或類似命名）作為 harness
3. 新增 `package.json` script（如 `npm run test:commerce-validator`）
4. 可選：新增 fixture JSON 於 `content/validation-fixtures/settings/commerce-links/`（與 Option A 共用 path convention）

**Pros**：

- ✅ 不污染 production validate baseline（warnings 不進 0/60/53）
- ✅ 完全 isolated harness；無 production runtime 行為改變
- ✅ Pure function 已具備 testable surface；改動最小
- ✅ 為未來 unit-test framework（若 user 願意引入）保留 forward path

**Cons**：

- ❌ 需新 script + 新 npm script；治理介面複雜化
- ❌ 引入「測試專屬」code path；與既有「validate 為唯一 source-of-truth」治理慣例衝突
- ❌ 仍須處理 fixture data（若 inline 在 harness 內，hardcoded data 與 spec drift 風險高；若獨立檔，與 Option A 重疊）
- ❌ 與本專案「不過度工程化」（CLAUDE.md §1）原則衝突；引入 test framework 雛形是項目第一版明確避免之事
- ❌ 無法在 CI / `validate:content` 中被 enforce；測試效果倚賴執行者主動 run
- ❌ 屬「test infrastructure」雛形；本專案第一版未規劃 test 框架

### 6.3 Option C — Temporary local mutation smoke test then cleanup

**機制**：手動暫時編輯 `content/settings/commerce-links.json` 加入 malformed entry → 跑 `npm run validate:content` 觀察 → 立即 restore（`git restore` 或手動撤回）；不 commit。

**所需 source 變動**：無。

**Pros**：

- ✅ 零 source 變動
- ✅ 零 fixture 變動
- ✅ 立即可行；無預備工作

**Cons**：

- ❌ 違反「working tree clean」治理（暫時性）；風險：unintended commit / push
- ❌ 違反本專案紅線：「修改 production registry 之 R1-clean 條件」（雖暫時性，仍是 disallowed mutation）
- ❌ 無 repeatability；每次驗證須手動執行；測試結果不可審計
- ❌ 高人為錯誤風險：若 commit / push 意外 land malformed registry，會觸發 dist build 故障或 downstream Admin 行為異常
- ❌ 違反 CLAUDE.md §27「不得自動 git push」+ §29「不主動實作後台」治理精神
- ❌ 違反本 phase 硬性限制 #4 / #11（不得修改 production registry）

⚠️ Option C **在本 phase 範圍內為紅線 violation**；列出僅為完整性。

### 6.4 Option D — Skip settings-level fixtures (沿用 download R1-style source-only acceptance)

**機制**：**不**建立任何 fixture / harness；commerce R3..R14 之 coverage 完全倚賴 source review + spec doc（night-22 §5）；mirror 既有 `download-registry-invalid-shape` / `download-registry-duplicate-key` 之 zero-fixture cadence。

**所需 source 變動**：無。

**所需 doc 變動**：本 phase 之 docs（即本文件）凍結此決策；未來若需升級則啟動 Option A。

**Pros**：

- ✅ 零 source 變動
- ✅ 零 fixture 變動
- ✅ 零 baseline 變動（永遠 0/60/53）
- ✅ 零 production registry 風險
- ✅ 與既有 download R-series cadence 完全一致；無治理斷裂
- ✅ 符合 CLAUDE.md §1「不過度工程化」原則
- ✅ 符合本 phase 硬性限制（不動 source / fixture / settings / package）
- ✅ 保留 Option A 之 path naming convention 供未來升級啟用（escape hatch frozen）

**Cons**：

- ❌ 無 runtime evidence：rule 行為 correctness 倚賴 source review；無 baseline 變動可審計
- ❌ 若未來 R10 / R15 / merchant registry 啟動，cumulative rule complexity 升高；source review 之認知負荷將不可持續
- ❌ 若未來 commerce registry 開始 land 真實 entries，rule 行為改動造成的 baseline 異動無法立刻識別（雜訊源無法區分）

### 6.5 Options summary table

| # | 名稱 | 簡述 |
| --- | --- | --- |
| A | Settings fixture path | 新 directory + dual code path；runtime evidence；+N baseline drift |
| B | Source harness / mock | 新 script + 新 npm command；isolated；test infrastructure 雛形 |
| C | Temp mutation | 手動暫改 production；違反紅線 |
| D | Skip（source-only acceptance）| 零變動；沿用 download R1-style cadence |

---

## 7. Option Comparison

### 7.1 Safety（破壞 production registry / baseline 之風險）

| 維度 | A | B | C | D |
| --- | --- | --- | --- | --- |
| 動 production `commerce-links.json` | ❌ no | ❌ no | ⚠️ **yes** (暫時) | ❌ no |
| 影響 `validate:content` baseline | ⚠️ +N | ❌ no | ❌ no | ❌ no |
| 影響 production posts | ❌ no | ❌ no | ❌ no | ❌ no |
| 違反 R1-clean 紅線 | ❌ no | ❌ no | ⚠️ **yes** (暫時) | ❌ no |
| 違反本 phase 硬性限制 | ⚠️ (若實作) | ⚠️ (若實作) | ❌ **yes** | ✅ pass |
| 違反 CLAUDE.md §1 / §29 | ⚠️ (新增 directory + dual code path) | ⚠️ (test infrastructure 雛形) | ❌ no | ✅ no |

→ **D 最安全；C 紅線 violation；A / B 需未來獨立 phase 確認 safety budget**。

### 7.2 Implementation Complexity

| 維度 | A | B | C | D |
| --- | --- | --- | --- | --- |
| 新 directory | ✅ +1 (`content/validation-fixtures/settings/`) | optional | ❌ no | ❌ no |
| 新 source code path | ✅ +2 (`load-settings.js` + `validate-content.js`) | ✅ +1 (`test-*.js`) | ❌ no | ❌ no |
| 新 package script | optional | ✅ +1 | ❌ no | ❌ no |
| 新 fixture file 數 | ✅ +11 (per landed rule) | optional | ❌ no | ❌ no |
| 新 sourcePath 改寫邏輯 | ✅ yes | ✅ partial | ❌ no | ❌ no |
| total LOC delta（估算）| ~150–300 | ~80–150 | 0 | 0 |

→ **D / C 最簡單；A 最重；B 中等**。

### 7.3 Production Registry Pollution Risk

| 維度 | A | B | C | D |
| --- | --- | --- | --- | --- |
| 直接動 production registry | ❌ no | ❌ no | ⚠️ **yes** | ❌ no |
| 直接動 production posts | ❌ no | ❌ no | ❌ no | ❌ no |
| 透過 build pipeline 影響 dist | ⚠️ 若 build pipeline 誤讀 fixture | ❌ no | ⚠️ 若忘記 restore | ❌ no |
| 對 GA4 / commerce live 之風險 | ❌ no | ❌ no | ⚠️ 若 push | ❌ no |

→ **D / B 風險最低；A 需明確 fixture/production 隔離；C 風險最高**。

### 7.4 Future Maintainability

| 維度 | A | B | C | D |
| --- | --- | --- | --- | --- |
| 與既有 download R-series cadence 對齊 | ❌ 偏離（建立 settings fixture 新先例） | ❌ 偏離（test 框架雛形） | n/a | ✅ 對齊 |
| 與既有 post-level fixture 模式對齊 | ⚠️ 部分（fixture-by-rule 對齊；但檔型不同）| ❌ 不對齊 | n/a | ✅ 對齊 |
| 與 CLAUDE.md §1 / §29「不過度工程化」對齊 | ⚠️ 引入 dual code path | ⚠️ 引入 test infrastructure | n/a | ✅ 對齊 |
| 未來新增 rule 之邊際成本 | ⚠️ 每加 1 條 → 加 1 fixture + 維護 cascade | ⚠️ 每加 1 條 → harness 內加 case | n/a | ✅ 0（mirror source review only） |
| 與 future content-reference fixture（C1..C5）之整合 | ✅ 可被引用（post fixture 之 ref 可指向 settings fixture 之 linkId）| ⚠️ harness 與 post fixture 為兩套不同機制 | n/a | ✅ content-reference fixture 仍可獨立進行（post-level） |

→ **D 最一致；A 中期需追加 retrofit download R1；B 引入 dead-end 結構**。

### 7.5 Baseline Impact

| 維度 | A | B | C | D |
| --- | --- | --- | --- | --- |
| 本 phase 結束時 baseline | 0/60/53 | 0/60/53 | 0/60/53（restore 後）| 0/60/53 |
| 未來啟用後 baseline | 0/(60+N)/53 | 0/60/53 | 0/60/53 | 0/60/53 |
| Drift attribution 可審計性 | ✅ 清楚（每 fixture 1 條）| ✅ 清楚（harness 不入 baseline）| ❌ 無紀錄 | ✅ 無 drift 永不需審計 |

→ **D / B 零 drift；A 可控 drift；C 無紀錄**。

### 7.6 Cumulative Verdict

| Option | safety | complexity | pollution risk | maintainability | baseline impact | overall |
| --- | --- | --- | --- | --- | --- | --- |
| A | medium | high | low | medium | medium | **defer** |
| B | medium | medium | low | low | low | **reject for v1** |
| C | low | n/a | high | n/a | low | **red-line violation** |
| D | high | low | none | high | none | **recommended** |

---

## 8. Recommended Mechanism

### 8.1 Recommendation

> **採 Option D**（skip settings-level fixtures；沿用 download R1-style source-only acceptance）作為近期路線。

### 8.2 理由

1. **與既有 download R-series cadence 完全對齊**：`download-registry-invalid-shape` / `download-registry-duplicate-key` 之 zero-fixture cadence 已建立超過 1 個月之先例；commerce mirror 之即可，無治理斷裂。
2. **零 baseline drift**：永遠維持 `0 / 60 / 53`，任何未來變動皆可被即時識別為意外，而非預期之 fixture noise。
3. **零紅線觸碰**：不動 production registry / 不動 fixture / 不動 source / 不動 package；本 phase 硬性限制全部滿足；reverse UTM dormant / pm-26 BLOCKED / Admin Apply dormant 全部保留。
4. **零工程化成本**：無新 directory / 無新 npm script / 無 dual code path；符合 CLAUDE.md §1 與 §29 之治理精神。
5. **保留 future escape hatch**：本 phase 同時凍結 Option A 之 path naming convention（per §6.1）供未來升級啟用；屆時為**獨立 phase**，由 user 明確啟動。
6. **commerce rule 複雜度尚在 source review 容量內**：當前 11 條 rule cascade 已於 night-22 §5 spec 完整凍結；helper 為 pure function；call site 為 post loop 外單一呼叫；review 之認知負荷可承擔。
7. **production registry 維持 R1-clean 之治理優先級高於 rule runtime evidence**：commerce live data landing 需要 explicit phase（reverse UTM unblock + pm-26 + Admin Apply 都未啟動）；在此之前無 production driver 要求 runtime evidence。

### 8.3 推薦本 phase 不做之事

- ❌ **不**實作 Option A 之 fixture loader（屬未來獨立 phase；本 phase 僅凍結 path naming convention）
- ❌ **不**實作 Option B 之 source harness（本專案第一版未規劃 test 框架；引入會違反 CLAUDE.md §29）
- ❌ **不**實作 Option C 之 temp mutation（紅線 violation）
- ❌ **不**自動觸發 Option A 之未來啟動條件
- ❌ **不**改 source / fixture / settings / package

### 8.4 推薦下一個 commerce-related phase 之候選順序

候選順序如下（**不**在本 phase 範圍；僅供參考）：

1. **content-reference source phase**（per night-22 §11.1 Phase C；C1..C5 source-only；baseline 預期維持 0/60/53）— 較低 marginal cost；可立即推進。
2. **content-reference fixture phase**（per night-22 §11.1 Phase D；F11..F13 post-level fixtures；baseline 預期 +K warnings + posts）— 與既有 post-level fixture cadence 一致。
3. **Option A 啟動 phase**（若 user 明確要求 registry-level runtime evidence；屬獨立 phase）— 在本 phase 凍結之 path naming convention 上實作 loader + 11 fixture。

⚠️ 本 phase **不**裁決上列順序；屬未來 phase 之獨立 decision。

---

## 9. Rule Coverage Matrix

### 9.1 已 landed registry-level rules（per night-25 `94a1d47`）

| Rule ID | landed | source line（近似） | Option D coverage | Option A future fixture path |
| --- | --- | --- | --- | --- |
| `commerce-link-invalid-entry-type` (R3) | ✅ | validate-content.js ~445 | source review only | `_test-commerce-link-invalid-entry-type.json` |
| `commerce-link-missing-link-id` (R4) | ✅ | validate-content.js ~458 | source review only | `_test-commerce-link-missing-link-id.json` |
| `commerce-link-duplicate-link-id` (R5) | ✅ | validate-content.js ~429 | source review only | `_test-commerce-link-duplicate-link-id.json` |
| `commerce-link-missing-target-url` (R6) | ✅ | validate-content.js ~474 | source review only | `_test-commerce-link-missing-target-url.json` |
| `commerce-link-invalid-target-url` (R7) | ✅ | validate-content.js ~482 | source review only | `_test-commerce-link-invalid-target-url.json` |
| `commerce-link-missing-internal-label` (R8) | ✅ | validate-content.js ~492 | source review only | `_test-commerce-link-missing-internal-label.json` |
| `commerce-link-internal-label-empty` (R9) | ✅ | validate-content.js ~500 | source review only | `_test-commerce-link-internal-label-empty.json` |
| `commerce-link-invalid-network-key` (R11) | ✅ | validate-content.js ~519 | source review only | `_test-commerce-link-invalid-network-key.json` |
| `commerce-link-replacement-target-not-found` (R12) | ✅ | validate-content.js ~542 | source review only | `_test-commerce-link-replacement-target-not-found.json` |
| `commerce-link-replacement-target-self` (R13) | ✅ | validate-content.js ~534 | source review only | `_test-commerce-link-replacement-target-self.json` |
| `commerce-link-inactive-missing-replacement` (R14) | ✅ | validate-content.js ~557 | source review only | `_test-commerce-link-inactive-missing-replacement.json` |

### 9.2 已 deferred registry-level rules（per night-25 註解 + night-22 §5）

| Rule ID | 狀態 | 原因 | 未來 fixture 啟用條件 |
| --- | --- | --- | --- |
| `commerce-links-invalid-shape` (R1) | deferred | loader unwrap 後不可觀察 | 需先擴 loader 暴露 raw registry |
| `commerce-links-not-array` (R2) | deferred | loader Array.isArray gate 已過濾 | 同 R1 |
| `commerce-link-invalid-merchant-key` (R10) | deferred | merchant registry 未存在 | 需先 land merchant registry + syntax 規格凍結 |
| `commerce-link-suspicious-secret-token` (R15) | deferred | heuristic 誤判風險 | 需先凍結 detection regex 與 false-positive policy |

### 9.3 未 landed content-reference rules（per night-22 §6；屬未來 source phase C）

| Rule ID | 狀態 | Option D 適用？ | 對 fixture phase 之要求 |
| --- | --- | --- | --- |
| `commerce-ref-invalid-type` (C1) | not landed | ⚠️ 部分（content-reference 屬 post-level；可用 post-level fixture）| 屬 post-level cadence；mirror `download-asset-ref-invalid-type` |
| `commerce-ref-empty` (C2) | not landed | ⚠️ 部分 | post-level fixture |
| `commerce-ref-not-found` (C3) | not landed | ⚠️ 部分 | post-level fixture（但需 registry 有對應 linkId）|
| `commerce-ref-inactive` (C4) | not landed | ⚠️ 部分 | post-level fixture + fixture registry entry |
| `commerce-ref-duplicate-in-post` (C5) | not landed | ⚠️ 部分 | post-level fixture（純 frontmatter array 重複） |

⚠️ C3 / C4 之 fixture 需要 registry 端有對應 linkId entry → **將強迫 Option A 啟動**或 fixture 使用「故意不存在的 ref」（C3 配 not-found 為自然搭配）；C4（inactive）則需 registry 端必有 `active: false` entry → 強迫 Option A。

→ 本 phase 凍結之 Option D 路線**短期**可涵蓋 C1 / C2 / C3 / C5（post-level；C3 fixture 為 not-found 場景，registry 為 empty 即可）；**C4 必須等 Option A 啟動**或延後。

### 9.4 Coverage matrix summary

| Layer | Rules count | Option D coverage | 若需 runtime fixture 須升級至 Option A |
| --- | --- | --- | --- |
| registry-level（landed）| 11 | source review only | yes |
| registry-level（deferred）| 4 | n/a（尚未 land） | yes |
| content-reference（C1 / C2 / C3 / C5）| 4 | post-level fixture（不需 Option A） | no |
| content-reference（C4）| 1 | n/a 短期 | yes |
| content-reference（C6 / C7 / C8 / C9）| 4 | long-tail；本 phase 不考慮 | n/a |

---

## 10. Fixture Naming / Path Convention Proposal

⚠️ **以下 convention 為「Option A 未來啟用」之凍結版本；本 phase 不建立任何檔案 / 目錄；本 phase 不啟動 Option A**。

### 10.1 Directory layout proposal

```
content/validation-fixtures/
├── blogger/posts/                          ← 既有；post-level fixtures
├── github/posts/                           ← 既有；post-level fixtures
└── settings/                               ← 預留（Option A 啟用時新增）
    └── commerce-links/                     ← 預留（Option A 啟用時新增）
        ├── _test-commerce-link-invalid-entry-type.json         (R3)
        ├── _test-commerce-link-missing-link-id.json            (R4)
        ├── _test-commerce-link-duplicate-link-id.json          (R5)
        ├── _test-commerce-link-missing-target-url.json         (R6)
        ├── _test-commerce-link-invalid-target-url.json         (R7)
        ├── _test-commerce-link-missing-internal-label.json     (R8)
        ├── _test-commerce-link-internal-label-empty.json       (R9)
        ├── _test-commerce-link-invalid-network-key.json        (R11)
        ├── _test-commerce-link-replacement-target-not-found.json (R12)
        ├── _test-commerce-link-replacement-target-self.json    (R13)
        └── _test-commerce-link-inactive-missing-replacement.json (R14)
```

### 10.2 Naming rules（per fixture）

- 檔名：`_test-<rule-id>.json`（mirror post-level `_test-<rule-id>.md` cadence）
- 一檔對應一條 rule 之 positive trigger（不混合）
- linkId 命名：`fixture-<rule-suffix>-<seq>` 之 kebab-case；如 `fixture-dup-001` / `fixture-self-001`；明確區別 production linkId 之命名空間
- internalLabel / targetUrl 使用 `example.com` / `example.org` placeholder；**禁用**真實 affiliate URL
- 禁用真實 networkKey；R11 fixture 使用 `__nonexistent-network-fixture__` 之顯式 placeholder
- 禁止任何 secret token / OAuth credential / API key / 個資（per CLAUDE.md §3.2 download R1 紅線）

### 10.3 JSON schema（per fixture）

```json
{
  "schemaVersion": 1,
  "updatedAt": "YYYY-MM-DD",
  "commerceLinks": [
    /* fixture-specific entries */
  ],
  "notes": "fixture for <rule-id>"
}
```

Top-level keys 維持 R1-clean 同樣 4 鍵（per night-19 §7.3）；不引入 unknown keys。

### 10.4 sourcePath 改寫 rule

未來啟用 Option A 時，warnings 之 sourcePath 須改寫為：

```
content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json
```

而非 production registry path（`content/settings/commerce-links.json`）；避免錯置歸屬。

### 10.5 Cascade fixture 設計

每個 fixture 預期觸發**單一**主規則；輔助 noise 須最小化。範例：

- R5 fixture：兩 entry 同 linkId → 觸發 1 條 R5；不觸發 R6 / R8（須補 valid targetUrl / internalLabel）
- R13 fixture：一個 entry 之 replacementTarget === self → 觸發 1 條 R13；其餘欄位 valid
- R14 fixture：active=false + 無 replacementTarget → 觸發 1 條 R14；其餘欄位 valid

⚠️ Cascade 設計屬未來 fixture phase 之獨立決策；本 phase 僅凍結 naming / path / schema。

### 10.6 affiliate-networks.json 之配套

R11 fixture（invalid network key）若使用 `__nonexistent-network-fixture__` 作 networkKey，則 **production `affiliate-networks.json` 不需任何變動**（保持現有 2 entries：`books` / `affiliate-network`）。

⚠️ **禁止**為 fixture 修改 production `affiliate-networks.json`；fixture 必須採「網路 id 故意不存在」之設計而非「臨時加 network」。

---

## 11. Expected Validate Baseline Delta

### 11.1 本 phase 之 baseline 變動

- **本 phase（docs-only）→ baseline 維持 0 errors / 60 warnings / 53 posts**
- 唯一檔案異動 = 1 個新 docs 檔
- 不動 source / content / settings / package / fixture
- post-commit `npm run validate:content` 預期結果 = pre-commit 結果 = **0 / 60 / 53**

### 11.2 推薦路線下之 future baseline 期望

| 階段 | source 變動 | fixture 變動 | baseline |
| --- | --- | --- | --- |
| 本 phase 結束 | none | none | 0/60/53（不變） |
| 未來 content-reference source-only phase（C1..C5）| validate-content.js +helper +post-loop call | none | 0/60/53（unchanged；無 production post 用 ref；無 fixture） |
| 未來 content-reference fixture phase（C1 / C2 / C3 / C5 post-level）| none | 4 個 `.md` fixtures | 0/(60+~5)/(53+4)（per fixture 觸發數估算） |
| 未來 Option A 啟用 phase（registry fixture loader + 11 fixtures）| load-settings.js + validate-content.js dual code path | 11 個 `.json` fixtures | 0/(60+~11+~5)/(53+4)（兩 phase 累計） |

### 11.3 Drift attribution rule

- 任何 commerce-related warning 出現於 production warnings → 視為**意外**，須立即診斷
- 任何 commerce-related warning 出現於 fixture-driven warnings → 視為**預期**，計入 baseline
- production `content/settings/commerce-links.json` 維持 R1-clean → 不應產生任何 commerce-* warning

### 11.4 本 phase 之 acceptance

- `git diff -- docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md` → 唯一新增
- `git status --short` → 唯一新增 file 為本 docs
- `npm run validate:content` → **0 / 60 / 53**（與 pre-commit 一致）
- `git diff -- src/` → 空
- `git diff -- content/` → 空
- `git diff -- package.json` → 空

---

## 12. Red Lines / Non-goals

### 12.1 本 phase 紅線（必須 enforced）

- ❌ **不**修改 `src/scripts/validate-content.js`
- ❌ **不**修改 `src/scripts/load-settings.js`
- ❌ **不**修改 `content/settings/commerce-links.json`
- ❌ **不**修改 `content/settings/affiliate-networks.json` / `link-sources.json` / `link-rules.json` / `download-assets.json` / `download-forms.json` / 任一 settings JSON
- ❌ **不**修改任何 content（`content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` / `content/drafts/` / `content/archive/`）
- ❌ **不**修改任何 templates（`content/templates/`）
- ❌ **不**修改任何 fixtures（`content/validation-fixtures/blogger/posts/` / `content/validation-fixtures/github/posts/`）
- ❌ **不**新增任何 fixture（包含 `.md` / `.json`）
- ❌ **不**新增 `content/validation-fixtures/settings/` 目錄
- ❌ **不**修改 `package.json` / `package-lock.json` / `vite.config.js`
- ❌ **不**執行 `npm install` / `npm run build` / `npm run dev` / `npm run preview`
- ❌ **不**啟動 Admin Apply / middleware write / admin-write-cli
- ❌ **不**解除 reverse UTM dormant；不解除 pm-26 deploy gate
- ❌ **不**重貼 Blogger / 觸發 GA4 Realtime 驗收
- ❌ **不**裁決 Option A 之實作細節（schema 內容 / loader 介面 / sourcePath 改寫具體實作）
- ❌ **不**裁決 R1 / R2 / R10 / R15 之啟動順序
- ❌ **不**裁決 content-reference C1..C9 之 source phase 啟動條件
- ❌ **不**修改 MEMORY / project memory 檔
- ❌ **不**自動啟動下一階段
- ❌ **不**在本 docs 內貼真實 affiliate token / URL 內含 token / production linkId

### 12.2 Non-goals

- ❌ 不替代 night-22 之 rule contract 凍結；本 phase 不重啟 rule schema 裁決
- ❌ 不替代 night-25 之 source landing；本 phase 不修正 validator source
- ❌ 不替代 future fixture phase 之 schema 細節；本 phase 僅凍結 path + naming convention 之 outline
- ❌ 不替代 future content-reference source phase 之 design；本 phase 僅在 §9.3 / §11.2 標註與 fixture mechanism 之 coupling
- ❌ 不引入 unit-test framework；本專案第一版未規劃
- ❌ 不引入 CI test runner；本專案第一版未規劃
- ❌ 不引入 Snapshot / fixture diff tool；本專案第一版未規劃
- ❌ 不裁決 Blogger live data landing 順序；屬獨立 commerce go-live phase

---

## 13. Candidate Next Phases

⚠️ **本 phase 不自動啟動下一階段**；下列為供 user 評估之候選順序，按 marginal cost 由低至高排列。

### 13.1 Candidate sequence A — 推進 content-reference source

| Phase | 範圍 | 預期 baseline | 風險 |
| --- | --- | --- | --- |
| `commerce-content-reference-source-only-a` | C1..C5 source-only；無 fixture | 0/60/53（不變） | low |
| `commerce-content-reference-fixture-c1-c2-c3-c5` | post-level fixture（4 個 `.md`）| 0/(60+~5)/(53+4) | low（不觸碰 Option A）|

→ 推薦理由：與 night-22 §11.1 之 Phase C / D 順序對齊；C4（inactive）延後等待 Option A。

### 13.2 Candidate sequence B — 啟動 Option A

| Phase | 範圍 | 預期 baseline | 風險 |
| --- | --- | --- | --- |
| `commerce-registry-fixture-mechanism-source-only-a` | 實作 fixture loader（dual code path）；無 fixture | 0/60/53（不變） | medium（dual code path） |
| `commerce-registry-fixture-batch-1` | 5–6 個 fixture（R3..R9 subset） | 0/(60+~6)/53 | medium |
| `commerce-registry-fixture-batch-2` | 剩餘 fixture（R11..R14） | 0/(60+~11)/53 | medium |

→ 推薦理由：當 user 明確要求 registry-level runtime evidence 時啟動；屬高代價 escape hatch。

### 13.3 Candidate sequence C — 推進 deferred registry-level rules

| Phase | 範圍 | 預期 baseline | 風險 |
| --- | --- | --- | --- |
| `commerce-r1-r2-loader-exposure-preanalysis` | 凍結 loader 是否暴露 raw registry | 0/60/53（docs-only） | low |
| `commerce-r10-merchant-syntax-preanalysis` | 凍結 merchantKey 規格 + 是否需 merchant registry | 0/60/53（docs-only） | low |
| `commerce-r15-secret-token-heuristic-preanalysis` | 凍結 detection regex + false-positive policy | 0/60/53（docs-only） | low |

→ 推薦理由：在大量 rule landing 前先凍結規格；屬 docs-only preflight。

### 13.4 Non-recommended next phases

- ❌ 直接做 Option B（source harness）→ 引入 test infrastructure 雛形；違反 CLAUDE.md §1 / §29
- ❌ 直接做 commerce live data landing → 需先解除 reverse UTM / pm-26 dormant；屬獨立 governance phase
- ❌ 直接做 Admin picker / renderer for commerce → 屬 night-22 §11.1 Phase E；本決策樹外

⚠️ 本 phase **不**裁決上列順序；屬 user 決策。

---

## 14. Final Recommendation

### 14.1 本階段 single conclusion

> **採 Option D（skip settings-level fixtures；沿用 download R1-style source-only acceptance）作為近期路線**。
>
> 同時凍結 Option A 之 path naming convention（`content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json`）供未來必要時啟用之 escape hatch；**不**做 Option B（source harness / mock injection）；**不**做 Option C（temporary local mutation；紅線 violation）。
>
> 本 phase 結束後 commerce registry-level validator 之 11 條 rule 仍**無** runtime fixture 覆蓋；coverage 完全倚賴 night-25 source landing + night-22 rule contract spec + source review；mirror 既有 download R1（landed >1 個月仍無 fixture）之治理 cadence。
>
> 本 phase 同時：
>
> - 凍結 fixture path naming convention（per §10）供未來啟用
> - 凍結 baseline delta expectation = 0（per §11；推薦路線下永遠 0/60/53）
> - 凍結紅線：不動 production registry / 不動 fixture / 不動 source / 不動 package（per §12）
> - 凍結 candidate next phase sequence A / B / C（per §13；不自動啟動）

### 14.2 本階段結束後預設狀態

**Final Idle Freeze / EXIT**。

唯一輸出為本檔；不動 source / content / settings / templates / fixtures / package / dist / gh-pages / memory；validate baseline 維持 **0 errors / 60 warnings / 53 posts**；所有 dormant gates 維持 dormant；所有紅線維持 enforced。

### 14.3 不自動推進下一階段

若 user 決定推進，可從 §13 之候選順序中選擇。推薦先行 sequence A（content-reference source-only）或 sequence C（deferred rules preflight），兩者皆為低風險 docs-only / source-only 啟動；sequence B（Option A 啟動）建議延後至 commerce live data landing 排程明確後再評估。

⚠️ **不**建議：

- ❌ 在本 phase 直接 follow up 一個 source-changing phase（風險集中）
- ❌ 同時啟動 sequence A 與 sequence B（fixture mechanism 與 content-reference source 混做 → 設計 dependency 風險）
- ❌ 跳過 Option A 之 path naming convention 凍結直接做 ad-hoc fixture（治理一致性風險）

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-preanalysis.md`（night-1；problem statement）
- `docs/20260603-commerce-affiliate-link-registry-identifier-preanalysis.md`（night-17；三軸模型）
- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（night-18；schema decision + v0 23 欄位）
- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`（night-19；R1-clean 7 條件）
- `docs/20260603-commerce-links-validator-preanalysis.md`（night-22；rule contract 凍結；R1..R15 / C1..C9 候選）
- `docs/related-links-schema.md`（sourceKey vs displayLabel 分離；fallback chain）
- `docs/click-tracking-governance.md`（GA4 event 列表；不擴張原則）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（download registry R1 紅線；commerce mirror 之 token / respondent data 邊界範本）
- `docs/20260531-download-empty-registry-implementation-plan.md`（empty registry landing pattern；download cadence 範本）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（R-series cadence 範本；R2 not-found / R5b duplicate）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（settings 列表 + download registry R1 精神）/ §16（連結處理）/ §27 / §29 / §30
- `content/settings/commerce-links.json`（empty registry；本 phase 不動）
- `content/settings/affiliate-networks.json`（既有 2 entries；R11 之 referential check target；本 phase 不動）
- `src/scripts/load-settings.js`（既有 `readJsonOptional` pattern；commerce loader 已落地；本 phase 不動）
- `src/scripts/validate-content.js`（既有 R-series cadence；validateCommerceLinkRegistry / buildCommerceLinkIdSet / buildActiveAffiliateNetworkIdSet 為已 landed helper；本 phase 不動）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`94a1d47ee3d98764b66b61f58b21e22bed8b190c`（short `94a1d47`）
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`feat(commerce): validate commerce link registry entries`
- `npm run validate:content`（pre-commit）→ **0 errors / 60 warnings / 53 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content`（post-commit）預期維持 **0 / 60 / 53**

---

（本文件結束）
