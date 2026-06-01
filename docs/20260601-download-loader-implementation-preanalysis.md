# 2026-06-01 Download Loader Implementation Preanalysis

> Phase: `20260601-pm-8-download-loader-implementation-preanalysis-docs-only-a`
> Date: 2026-06-01 15:32 +0800（於 project-wide status checkpoint 已 frozen at `fec86aa` 後之 cold-start session）
> Scope: **docs-only**（單檔新增；無 source / content / settings / templates / fixture / package / dist / gh-pages / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `fec86aaa64a6585b501d79c0aba3d21509b9842d`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **docs-only implementation preanalysis**：在 night-5 loader preanalysis（`docs/20260601-download-loader-preanalysis.md`，已凍結 loader **行為合約** 與 **registry lookup model**）與 noon-3 next-step preanalysis（`docs/20260601-download-workflow-next-step-preanalysis.md`，將「loader source implementation preanalysis（仍 docs-only）」標為 **Option D — 推進 download workflow 之最保守第一步**）之上，把未來 download loader source phase 之 **candidate A vs B 二選一裁決**、**exact file scope**、**acceptance gates** 固化為設計輸入。
- 本文件**只規劃 download loader implementation**；**不**實作 loader、**不**實作 validator、**不**實作 Admin picker、**不**實作 renderer、**不**做 content migration、**不**新增 fixture。
- 本文件之目標是**決定未來 source phase 的最小範圍**；落地後 **Final Idle Freeze / EXIT**。
- 本 phase **不**授權任何 source / settings / content / fixture / build / deploy 變動：
  - ❌ 不改 `src/scripts/load-settings.js`；不新建任何 loader module。
  - ❌ 不改 `src/scripts/validate-content.js` / `src/scripts/build-*.js` / 任一 `src/**`。
  - ❌ 不改 `content/settings/download-assets.json` / `download-forms.json` / `link-sources.json` 之內容。
  - ❌ 不改 `content/**`（posts / drafts / archive / templates / validation-fixtures）。
  - ❌ 不 build / deploy / Blogger repost / GA4 validation。
  - ❌ 不啟用 Admin Apply / middleware write / admin-write-cli（dry-run / apply / real write）。
  - ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate。
- Baseline `fec86aa`：HEAD = origin/main；working tree clean；ahead/behind = 0/0；validate `0 / 47 / 42`。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔；validate baseline 預期維持不變。

### 1.1 一句話裁決

> **未來 download loader source phase 應採 candidate A（擴張 `src/scripts/load-settings.js` 之既有 `readJsonOptional` 機制，mirror `linkSources`），以「兩行新增 + 兩鍵 optional registry」為唯一 source 變動；loader 全程 read-only、不改 registry、不產生 warning、預期 validate baseline 不變；本 phase 不啟動任何 source / settings / fixture / build / deploy；loader / validator-via-registry / Admin picker / renderer / content migration 全保持 dormant；本 phase 完成後 Final Idle Freeze / EXIT。**

---

## 2. Current Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `fec86aaa64a6585b501d79c0aba3d21509b9842d` |
| origin/main（本 phase 啟動時） | `fec86aaa64a6585b501d79c0aba3d21509b9842d` |
| short | `fec86aa` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `docs(operations): record project-wide status checkpoint` |

裁決要點：

- **download workflow 仍 dormant**：empty registries（`466e471`）已存在；loader / validator-via-registry / Admin picker / renderer / content migration 全未實作。
- **loader registry lookup 尚未實作**：`src/scripts/load-settings.js` 之 `SETTINGS_FILES` 不含 download registry；亦無 `readJsonOptional('download-*.json')`。
- **reverse UTM / pm-26 / Admin write infra 仍 dormant 或 blocked**。

### 2.1 Governance dormancy snapshot

| Gate / Surface | 狀態 |
|---|---|
| Reverse UTM source（pm-24a / b / c at `7e1d356` / `e2309e9` / `7c769fe`） | ✅ landed origin/main（2026-05-23） |
| Reverse UTM live | ❄ **dormant**（未 deploy；Blogger 後台未重貼；GA4 Realtime validation 未啟動） |
| pm-26 deploy gate | ❄ **BLOCKED**（positive fixture 仍 `status: draft`） |
| Download empty registry（`download-assets.json` + `download-forms.json`） | ✅ landed at `466e471`；shape = empty `{ schemaVersion: 1, updatedAt: "", assets\|forms: [], notes: "" }` |
| Download loader source | ❄ **dormant**（`src/scripts/load-settings.js` 未串接） |
| Download validator-via-registry rules | ❄ **全 dormant** |
| Download Admin picker | ❄ **dormant** |
| Download landing page renderer | ❄ **dormant** |
| Download content migration（`fileUrl` → `assetRefs[]` / `formRef`） | ❄ **dormant** |
| Admin Apply enable flag | ❄ **disabled / dormant** |
| Middleware write route | ❄ **absent** |
| admin-write-cli dry-run / apply | ❄ **dormant** |

---

## 3. Current Registry State

### 3.1 `download-assets.json`（read-only inspection）

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "assets": [],
  "notes": ""
}
```

- shape = **empty registry**；`assets: []` 為合法初始狀態。

### 3.2 `download-forms.json`（read-only inspection）

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "forms": [],
  "notes": ""
}
```

- shape = **empty registry**；`forms: []` 為合法初始狀態。

### 3.3 Registry 目前 empty，不需要改 registry

- 兩檔已於 `466e471` landed 為 empty registry；shape 已正確、已合法。
- 本 phase **不**修改 registry；未來 loader source phase 亦**不**修改 registry（loader 只讀）。
- empty registry 為「未啟用」之合法穩定落點；loader 串接後對 empty registry 之行為與 missing file 之 baseline 影響**同義**（皆不 warn；皆不影響 validate baseline；per night-5 §5.2）。

### 3.4 R1 紅線重申（registry must be legal）

兩 registry **永不**承載（per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4 R1）：

- ❌ respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）
- ❌ access token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID / 私人 permission grant
- ❌ Google Form responses（必須留在 Google Forms / Sheets；不得進 repo）

empty registry 為 R1 紅線之**最強防護狀態**：無 entry → 天然無 PII / token / secret。loader 只讀此兩檔之公開 metadata；不引入任何新資料來源。

---

## 4. Current Loader / Build State

### 4.1 `load-settings.js` 目前是否讀取 download registry

- ❌ **否**。`src/scripts/load-settings.js` 之 `SETTINGS_FILES`（hard-coded 15 項：site / themes / categories / tags / series / ads / socialLinks / promotion / affiliateNetworks / linkRules / seo / ga4 / navigation / sidebar / footer）**不含** download registry。
- ❌ `download-assets.json` / `download-forms.json` 亦**不**透過既有 `readJsonOptional` 載入。
- ✅ 兩檔實體存在於 `content/settings/`（per `466e471`），但無任何 loader call 觀察。

### 4.2 既有 loader 機制（read-only inspection）

`src/scripts/load-settings.js` 為 settings loading 之唯一入口：

- `loadSettings()` 為 async function；回傳統一 `result` object。
- `readJson(filename)`：必載；missing file 或 parse error 皆 throw（fail-fast）。
- `readJsonOptional(filename, fallback)`：optional；missing file 或 parse error 皆 return fallback（silent fallback）。
- **既有 optional registry 先例**：`result.linkSources = await readJsonOptional('link-sources.json', { sources: [] })`（per Phase `20260527-am-2` step-4 renderer fallback chain）。此先例證明 loader 已具「additive optional registry」之穩定 pattern；download registry 可直接 mirror。

### 4.3 build / content pipeline 目前如何讀 settings

- `loadSettings()` 之 `result` object 為**唯一 settings carrier**，被以下 consumer 直接消費：
  - `src/scripts/validate-content.js:1154`（`const settings = await loadSettings()`）→ 經 `settings.categories` / `settings.tags` / `settings.series` / `settings.linkSources` 等讀取。
  - `src/scripts/build-github.js:456`（`const settings = await loadSettings()`）→ 經 loadPosts 轉發至 render pipeline。
  - `src/scripts/build-blogger.js` / `build-sitemap.js` / `build-promotion.js` 等亦經同一 `loadSettings()` 取得 settings。
- 因此**唯一可插入點**為 `load-settings.js` 之 `loadSettings()` return object：在該處新增 `result.downloadAssets` / `result.downloadForms` 兩鍵，即可讓所有下游 consumer 在未來需要時透過 `settings.downloadAssets` / `settings.downloadForms` 取得 registry，**無需各 consumer 各自讀檔**（mirror `CLAUDE.md` §3.2 settings 集中管理原則）。

### 4.4 download registry consumer 是否不存在

- ✅ **確認不存在**。`grep download src/scripts/load-settings.js` 無命中；`validate-content.js` 之 download 相關規則（D1 / D2 / D3 / S）**僅基於 post frontmatter 之 `download.fileUrl`**，與 registry 完全解耦（per night-5 §4.3）。
- 對 validate / build / render pipeline 而言，兩 registry 檔為「**透明檔**」；新增 / empty / 刪除三狀態對 baseline 之影響皆為零。

### 4.5 本 phase 不修改 source

- 本 phase scope 限為 docs-only 單檔新增。
- 任何 loader 串接屬 source phase；須走獨立 phase + user explicit approval（per `CLAUDE.md` §27）。
- 對齊 night-5 §4.5 / noon-3 §8 之「絕不直接寫 source」紅線。

---

## 5. Loader Implementation Options

比較三種 loader 落地方式。每項列：source scope / coupling risk / testability / future validator-Admin-renderer compatibility / backward compatibility / recommendation。

### Option A — 擴張現有 `src/scripts/load-settings.js`

在既有 `readJsonOptional` 機制下，於 `loadSettings()` 新增兩鍵 download registry（mirror `linkSources`）。

- **source scope**：🟢 最小。僅 `load-settings.js` 一檔；新增約兩行 `readJsonOptional` call（`result.downloadAssets` / `result.downloadForms`）。
- **coupling risk**：🟢 低。沿用既有 `result` object carrier；下游 consumer 無需改動即可在未來透過 `settings.downloadAssets` / `settings.downloadForms` 取用；符合 `CLAUDE.md` §3.2 settings 集中管理。
- **testability**：🟡 中。`load-settings.js` 目前無獨立 unit test 框架；missing / empty / parse-error 三狀態可在未來以 read-only assertion / 手動驗證涵蓋（與既有 `linkSources` 同等成熟度）。
- **future compat（validator / Admin / renderer）**：🟢 高。所有下游 surface 統一從 `settings.*` 取 registry，無第二資料來源；validator-via-registry / Admin picker / renderer 皆可直接消費同一 carrier。
- **backward compat**：🟢 完全相容。additive；既有 15 項 settings 與 `linkSources` 不受影響；missing / empty registry 採 silent fallback；不改變既有 D1/D2/D3/S 行為；預期 validate baseline 不變。
- **recommendation**：✅ **推薦**（保守、最小、有既有 `linkSources` 先例）。

### Option B — 新增專用 loader（如 `src/scripts/load-download-registries.js`）

為 download registry 建立獨立 loader module。

- **source scope**：🟡 中。新增一個 source file；可能涉及 `load-settings.js` 之 minimal re-export 或各 consumer 之 import 改動。
- **coupling risk**：🟡 中。registry 載入邏輯分散於兩 module；consumer 取用路徑可能不一致（部分走 `settings.*`、部分走獨立 loader），違反集中管理原則之精神。
- **testability**：🟢 高。獨立 module 易於單獨測試 missing / empty / parse-error / schemaVersion / duplicate-id 等行為。
- **future compat**：🟡 中-高。長期擴張空間大（如未來支援 schemaVersion bump 之多版本共存 / registry-specific 載入策略）；但短期對 empty registry 屬 over-engineering。
- **backward compat**：🟢 相容（新檔不影響既有）；但 consumer wiring 較 Option A 複雜。
- **recommendation**：🟡 可選；僅在未來 registry 載入邏輯顯著複雜化（多版本共存 / 大量 entry-level 預處理）時才有增量價值；當前 empty registry 不需要。

### Option C — 暫不實作，維持 dormant

不串接 loader；維持 registry 為透明檔。

- **source scope**：🟢 無。
- **coupling risk**：🟢 無。
- **testability**：不適用。
- **future compat**：🟡 不阻擋未來；但 download workflow 之下游（validator-via-registry / Admin / renderer）無法啟動（缺 data source）。
- **backward compat**：🟢 完全（現狀）。
- **recommendation**：✅ **本 phase 採此狀態**（本 phase 為 docs-only；不啟動 source）。若 user 未明示推進 download workflow，C 為預設。

### 5.1 三選項對照表

| 維度 | A 擴張 load-settings | B 新建 loader module | C 維持 dormant |
|---|---|---|---|
| source scope | 🟢 最小（~2 行） | 🟡 新檔 + wiring | 🟢 無 |
| coupling risk | 🟢 低（集中） | 🟡 中（分散） | 🟢 無 |
| testability | 🟡 中（同 linkSources） | 🟢 高 | n/a |
| future compat | 🟢 高（統一 carrier） | 🟡 中-高（擴張空間大） | 🟡 不阻擋但無法啟動下游 |
| backward compat | 🟢 完全 | 🟢 相容（wiring 較雜） | 🟢 完全 |
| 既有先例 | ✅ `linkSources` | ❌ 無 | ✅ 現狀 |
| 本 phase 採用 | ❌（未來 source phase 推薦） | ❌ | ✅ |

---

## 6. Recommended Loader Design

**本節僅為設計輸入；本 phase 不寫 code。** 下列為未來 download loader source phase 之推薦設計。

### 6.1 推薦 Option A（擴張 `load-settings.js`）

依實際掃描結果（§4.2 已存在 `linkSources` additive optional registry 先例；§4.3 唯一插入點為 `loadSettings()` return object），**推薦 candidate A**：

- 理由：最小 source scope、最低 coupling、有既有先例、完全向後相容、統一 carrier 利於未來下游 compat。
- 對齊 user 偏好「保守落地」（warning-only / additive / helper-first / 最小變動優先）。

### 6.2 loader 只讀 registry，不改 registry

- loader 全程 **read-only**：僅 `fs.readFile` + `JSON.parse`；**不** write、**不** mutate、**不** normalize 回寫 registry 檔。
- registry 之 `updatedAt` / `notes` / entry 內容由作者 / 未來 Admin write track 維護；loader 不碰。

### 6.3 行為合約（沿用 night-5 §5，不重新裁決）

未來 loader 之 missing / empty / parse-error / schemaVersion / unknown-field / duplicate-id / non-array / updatedAt / notes 行為**已於 night-5 `docs/20260601-download-loader-preanalysis.md` §5 完整凍結**；本文件不重複、不修改、不覆寫該裁決。要點摘錄（以 night-5 為準）：

- missing file → silent fallback（不 throw / 不 warn）。
- empty `assets|forms: []` → acceptable；不 warn。
- malformed JSON → fail-closed（throw with path + parse error）。
- unsupported schemaVersion → fail-closed。
- unknown / duplicate / inactive → 屬未來 **validator-via-registry** 範疇（warn-and-continue）；非 loader 自身職責。

> 註：night-5 §5.1 之 fallback 提案為 `schemaVersion: 0`（區分「未建檔」與「已建檔之 empty」）；而既有 `linkSources` 先例之 fallback 為 `{ sources: [] }`（無 schemaVersion）。candidate A 落地時，fallback shape 之最終形（`{ schemaVersion: 0, updatedAt: '', assets|forms: [], notes: '' }` vs 簡化 `{ assets|forms: [] }`）屬該 source phase 之 preflight 細節；本文件**不**最終裁決，僅標示為 source phase 待決點。

### 6.4 registry must be legal

- loader 不引入任何新資料來源；只讀既有兩 empty registry。
- loader 不得將 registry 內容寫入 log / report / dist（避免未來 entry 含敏感欄位時意外外洩）；屬 R1 紅線之 loader-level 防護建議（per source phase preflight 細化）。

### 6.5 預期 baseline 影響

- loader 為 read-only；對 empty registry 不產生任何 warning。
- 預期 source phase 落地後 validate baseline **維持 `0 / 47 / 42`**（須於該 phase 實測驗證）。

---

## 7. Future Source File Scope

下列為**未來若實作 loader（candidate A）可能修改之檔案**；**本 phase 不修改這些檔案**。

| 候選路徑 | 性質 | 未來變動範圍（若 candidate A） |
|---|---|---|
| `src/scripts/load-settings.js` | settings loader 唯一入口 | 新增約兩行 `readJsonOptional('download-assets.json', fallback)` / `readJsonOptional('download-forms.json', fallback)`；新增 `result.downloadAssets` / `result.downloadForms` 兩鍵 |
| （test file，若有框架） | loader 行為驗證 | missing / empty / parse-error 三狀態 read-only assertion；當前 repo 無 loader unit test 框架，故可能僅以手動 read-only 驗證 |
| （validation fixture，若需要） | loader 本身**不需** fixture | loader 為 read-only；不產生 warning；**不**新增 fixture（fixture 屬 validator-via-registry phase 範疇） |
| （docs acceptance） | source phase 後之 docs sync | 若 source 落地改變既有裁決（如 fallback shape），須走獨立 docs sync sub-phase |

### 7.1 本 phase 明確不修改上述檔案

- ❌ 不改 `src/scripts/load-settings.js`。
- ❌ 不新增任何 test file。
- ❌ 不新增任何 validation fixture。
- ❌ 不新增 / 不修改任何 docs acceptance 檔（除本 docs 檔外）。

### 7.2 test file / validation fixture strategy（設計輸入）

- **loader test**：建議覆蓋 missing file / empty registry / malformed JSON / unsupported schemaVersion 四狀態之 loader 行為；但須先確認 repo 是否引入 test runner（當前無觀察到 loader unit test 框架）；若無框架，採手動 read-only 驗證 + validate baseline 不變作為 acceptance。
- **validation fixture**：loader phase **不需** fixture（loader read-only；不產生 warning）。fixture 屬 validator-via-registry phase（屆時須走獨立 docs-only fixture design → source phase；per night-6 remaining-rules preanalysis）。

### 7.3 docs acceptance（設計輸入）

- source phase 落地後須有獨立 **read-only acceptance phase**（mirror am-3 / am-5 / am-7 cadence）：驗 source diff + validate baseline + git 狀態；不 commit。

---

## 8. Relationship To Downstream Consumers

loader 為 download workflow 之**依賴根**；下列 consumer 皆**依賴 loader landed 後始能啟動**，但本 phase **不啟動任一**。

### 8.1 Validator-via-registry

- registry-aware rules（ref-not-found / inactive / duplicate-id / unknown-field / notes-token-like-pattern / preview-risk-via-registry）需 loader 提供 data source。
- family-level 設計已於 `docs/20260601-download-validation-remaining-rules-preanalysis.md` 完成。
- **狀態**：❄ dormant。**本 phase 不啟動**。

### 8.2 Admin picker

- Admin UI 消費 registry，供作者選取 asset / form。
- 另需 Admin write infra（當前 Admin Apply / middleware / admin-write-cli 全 dormant）。
- **狀態**：❄ dormant。**本 phase 不啟動**。

### 8.3 Renderer / landing page

- post-detail / blogger-post-full 之 download block 改讀 registry，或新增 landing page renderer；需 frontmatter schema 擴張（`assetRefs[]` / `formRef`）。
- **狀態**：❄ dormant。**本 phase 不啟動**。

### 8.4 Content migration

- 既有 `download.fileUrl` post（目前僅 `content/blogger/posts/20260529-phonics-practice-sheet-download.md`）遷移至 `assetRefs[]` / `formRef`。
- legacy `download.fileUrl` **grandfather 保留**（per night-5 §7）；逐篇 explicit phase + user explicit approval。
- **狀態**：❄ dormant。**本 phase 不啟動**。

### 8.5 GA4 / analytics

- download_click GA4 event 與 landing page flow 之 GA4 Realtime / DebugView 驗收；需 renderer landed + deploy（pm-26 deploy gate 仍 BLOCKED）。
- **狀態**：❄ dormant。**本 phase 不啟動**。

### 8.6 依賴鏈

```text
empty registry（✅ landed at 466e471）
  → loader source（candidate A；本文件規劃；尚未授權）
    → registry-aware validator（§8.1）
    → Admin picker（§8.2）         ← 另需 Admin write infra
    → renderer / landing page（§8.3）
      → content migration（§8.4）   ← 逐篇 explicit
        → GA4 / analytics（§8.5）   ← 須 deploy（pm-26 BLOCKED）
```

- 任一下游 surface **不得**先於 loader landed；否則落入「無 data source / 死碼」狀態。
- **本 phase 明確不啟動任一 downstream consumer。**

---

## 9. Governance Red Lines

本文件**明確不**授權下列任一動作：

- ❌ 不改 registry（`download-assets.json` / `download-forms.json` / `link-sources.json` / 任一 settings 內容）。
- ❌ 不放 respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）進 repo。
- ❌ 不放 access token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID 進 registry / docs。
- ❌ 不實作 download loader。
- ❌ 不實作 validator。
- ❌ 不實作 Admin picker。
- ❌ 不實作 renderer。
- ❌ 不做 content migration。
- ❌ 不新增 fixture。
- ❌ 不 build / deploy。
- ❌ 不 Blogger repost。
- ❌ 不 GA4 validation。
- ❌ 不執行 admin-write-cli dry-run / apply / real write。
- ❌ 不啟用 Admin Apply。
- ❌ 不新增 middleware write route。
- ❌ 不啟動 reverse UTM 或 pm-26 deploy gate。
- ❌ 不 npm install / 不改 package.json / package-lock.json / vite.config.js。
- ❌ 不 fetch / pull / merge / rebase / reset / stash / amend / force-push。

### 9.1 R1 / R2 / R3 紅線

- **R1**（per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4 R1）：registry 永不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID；loader 不引入新資料來源。
- **R2**（per pm-20 §4 R2）：`download.fileUrl` 與 Google Form URL 不可混淆；本文件不主動 migration；A / B+C 共存合法。
- **R3**（per pm-20 §4 R3）：landing page 之 noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline；本文件不變動 SEO pipeline。

---

## 10. Future Phase Candidates

下列為若 user 明示授權之候選 phase（**僅命名提示；不含完整 prompt；不在本文件啟動**）：

1. **download loader implementation preanalysis acceptance（read-only）**
   - 性質：read-only acceptance；不 commit；不改檔。
   - 範圍：cross-check 本文件 + night-5 loader preanalysis + noon-3 next-step preanalysis 之內部一致性與 cadence 對齊；驗 baseline 不變。
   - 候選名：`20260601-download-loader-implementation-preanalysis-acceptance-readonly-a`

2. **download loader source implementation preflight（read-only）**
   - 性質：read-only preflight；不 commit；不改檔。
   - 範圍：驗 candidate A 之 exact diff 草案 / fallback shape 待決點 / acceptance gates 是否齊備；確認 `load-settings.js` 插入點未漂移。
   - 候選名：`20260601-download-loader-source-implementation-preflight-readonly-a`

3. **download loader source implementation（future only；需 user 明示）**
   - 性質：source change（candidate A：僅改 `src/scripts/load-settings.js`）。
   - 範圍：§7 之 exact file scope；§6 之 read-only loader 合約；預期 baseline 維持 `0 / 47 / 42`。
   - 候選名：`20260601-download-loader-source-implementation-a`
   - ⚠️ **不推薦直接做**；須先 1 + 2，且須 user explicit approval。

4. **（更下游）validator-via-registry / Admin picker / renderer / content migration preanalysis（docs-only）**
   - 各為獨立 docs-only 裁決 → source phase；皆須 loader landed 為前置（schema-only validator rule 可旁路 loader，per noon-3 §6.2）。

### 10.1 候選 phase 之啟動條件

1. **user explicit approval**（明示 phase name 與 scope）。
2. **baseline 仍為本文件 commit 之延伸**（HEAD 包含本文件 commit）。
3. **scope 限為單一目的**；不夾帶 source / settings / content / fixture / build。
4. **完成後須有獨立 read-only acceptance cross-check**。

### 10.2 候選 phase 均**須**由 user 明示啟動

本文件**不**自動啟動任一 phase；mirror `CLAUDE.md` §27。

---

## 11. Risk Matrix

| # | 風險 | 等級 | 緩解 | 本 phase 允許 |
|---|---|---|---|---|
| R11.1 | 意外觸發 source implementation（改 `load-settings.js` / `validate-content.js` / 任一 `src/**`） | 🔴 高 | commit pre-check 限為單一 docs 檔；`git status` 須顯示 exactly 1 new file | ❌ 不允許 |
| R11.2 | 意外修改 registry（empty shape 被填值） | 🔴 高 | commit 須驗 `download-assets.json` / `download-forms.json` git status unchanged | ❌ 不允許 |
| R11.3 | 意外觸發 content migration（改 post frontmatter / template） | 🔴 高 | grandfather rule；commit pre-check 限為單一 docs 檔 | ❌ 不允許 |
| R11.4 | 意外新增 fixture | 🔴 高 | loader phase 不需 fixture；commit pre-check 限為單一 docs 檔 | ❌ 不允許 |
| R11.5 | 推薦直接做 source implementation（跳階） | 🟡 中 | §10 明示先 acceptance / preflight；source phase 標 future only / 需 user 明示 | ❌ 不允許跳階 |
| R11.6 | privacy leak（registry / docs 意外含 respondent data / token） | 🔴 高（R1） | §3.4 / §9.1 重申 R1；本文件不含任何真實 token / PII | ❌ 永不允許 |
| R11.7 | build / deploy / Blogger repost / GA4 validation 意外觸發 | 🔴 高 | 本 phase 僅 docs commit + push origin/main；無 dist 變動 | ❌ 不允許 |
| R11.8 | reverse UTM / pm-26 / Admin write 意外解鎖 | 🔴 高 | 三 surface 與 download loader 解耦；本 phase 不觸及 | ❌ 不允許 |

---

## 12. Final Recommendation

### 12.1 推薦

- **本 phase 完成後 Final Idle Freeze / EXIT。**
- **不**直接接 loader source implementation。
- 若要實作 loader，**下一階段需獨立明示 phase**，且**先做 acceptance（§10 候選 1）或 preflight（§10 候選 2），不直接寫 source**。
- 未來 source phase 採 **candidate A**（擴張 `load-settings.js`；§5 / §6 / §7）。

### 12.2 理由

1. 本文件已將 loader source phase 之 candidate A vs B 裁決、exact file scope、acceptance gates 固化為設計輸入；download loader 之上游規劃至此完整。
2. 所有 consumer（loader / validator-via-registry / Admin picker / renderer / content migration / GA4）保持 dormant；無被動到期事項；無時間壓力。
3. 本 phase commit 後新 cold-start baseline 為本文件之 commit hash；下次 session 可讀本文件 + night-5 loader preanalysis + noon-3 next-step preanalysis 作三入口。
4. reverse UTM / pm-26 / Admin write infra 仍 dormant 或 blocked；在無 user 明示前不啟動任何下游 phase 為最低風險選擇。
5. 對齊 `CLAUDE.md` §1 / §27 / §29 / §30 之「不過度工程化」與「先說明 + user 明示授權方可實作」原則。

### 12.3 不推薦立即執行

- ❌ 不推薦立即進入 `20260601-download-loader-source-implementation-a`（屬下游 source phase；須先 acceptance / preflight）。
- ❌ 不推薦立即進入任一 validator-via-registry / Admin picker / renderer / content migration source phase。
- ❌ 不推薦立即進入 deploy / Blogger repost / GA4 validation（pm-26 deploy gate 仍 BLOCKED）。
- ❌ 不推薦立即進入 reverse UTM activation / pm-26 unblock / Admin Apply enable。

---

## Cross-references

- `docs/20260601-download-loader-preanalysis.md`（night-5 loader 行為合約 + registry lookup model preanalysis）
- `docs/20260601-download-workflow-next-step-preanalysis.md`（noon-3 next-step 排序；本文件對應其 Option D）
- `docs/20260601-download-validation-remaining-rules-preanalysis.md`（night-6 validator remaining-rules preanalysis）
- `docs/20260601-project-wide-status-checkpoint.md`（project-wide status checkpoint；frozen at `fec86aa` 前後之 checkpoint）
- `docs/20260531-download-empty-registry-implementation-plan.md`（am-8 empty registry implementation plan；landed `466e471` 對應）
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`（am-4 schema decision + R1 §8）
- `docs/20260531-download-asset-form-registry-json-preanalysis.md`（am-6 registry JSON preanalysis）
- `docs/20260530-download-fileurl-preview-url-risk-policy.md`（preview-url-risk policy；frozen at raw URL regex stage）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 設計原則 / 啟動條件）
- `CLAUDE.md` §3.2（settings 集中管理 + download empty registry governance）
- `CLAUDE.md` §13（教具下載文章規則）
- `CLAUDE.md` §27（Claude Code 修改規則）
- `CLAUDE.md` §29 / §30（第一版不做清單 / 專案最終樣貌）

---

End of preanalysis.
