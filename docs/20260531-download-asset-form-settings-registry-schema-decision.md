# 20260531 Download Asset / Form Settings Registry Schema Decision

> Phase: `20260531-am-4-download-asset-form-settings-registry-schema-decision-docs-only-a`
> Date: 2026-05-31 09:46 +0800
> Scope: **docs-only**（無 source / content / settings / templates / fixture / package / dist / gh-pages 變更）

---

## 1. Executive Summary

- 本文件是 **docs-only schema decision**：為未來 **DownloadAsset registry** 與 **FormConfig registry** 之欄位字典、檔案落點、版本欄位、enum 初版、禁止欄位、與 post frontmatter 之 reference 形態做**可實作前**之裁決，使下一個保守 phase（無論是 acceptance read-only 或 registry JSON preanalysis）可在固定 schema 上展開。
- 本文件**不**建立 registry JSON：
  - ❌ 不新增 `content/settings/download-assets.json`
  - ❌ 不新增 `content/settings/download-forms.json`
  - ❌ 不新增 `content/registries/*.json`
  - ❌ 不改 source（`src/scripts/validate-content.js` / `build-github.js` / `build-blogger.js` / `load-settings.js` / `load-posts.js` 一行不動）
  - ❌ 不改 content（既有 production post / draft post / template 一檔不動）
  - ❌ 不改 fixture（`content/validation-fixtures/` 一檔不動）
  - ❌ 不改 settings（既有 `content/settings/*.json` 一檔不動）
  - ❌ 不改 templates（`content/templates/*.md` 一檔不動）
  - ❌ 不改 package（不 `npm install`；不動 `package.json` / `package-lock.json` / `vite.config.js`）
  - ❌ 不 build / deploy / Blogger repost / GA4 validation
  - ❌ 不啟用 Admin Apply / middleware write / `admin-write-cli` dry-run / apply
  - ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate
- 本文件**不**為 source phase；亦**不**為 registry preanalysis（registry JSON preanalysis 仍應為下一獨立 docs-only phase，per §16 推薦）。
- 本文件**不**新增 validator rule；本 phase 不改 baseline，預期維持 **0 errors / 47 warnings / 42 posts**。
- 本文件之**唯一裁決對象**為「DownloadAsset / FormConfig 兩 entity 之 schema 形狀」與「post frontmatter 與此兩 registry 之 reference 形態」；不裁決 DownloadLandingPage 是否獨立 registry（保持 pm-16 / pm-20 / am-2 結論：landing page 由 content + ref 承載，不另立 registry）。
- 本檔落地後 production state drift = 0；唯一變更為新增本 docs 檔。

### 1.1 一句話裁決

> **DownloadAsset 與 FormConfig 各為一份 `content/settings/` 下之集中 JSON，採 `{ schemaVersion, updatedAt, assets|forms[] }` 結構；assetId / formId / title / status / publicUrl 為**核心必填**；respondent data 永不進 registry；既有 `download.fileUrl` grandfather 不立即 migration；P2 為「registry JSON fixture-like settings file preanalysis」之 docs-only phase。**

---

## 2. Decision Context

### 2.1 引用上一份 preanalysis 結論

per `docs/20260531-download-landing-asset-form-registry-preanalysis.md`（am-2）：

- **三 entity 解耦原則**：DownloadAsset / FormConfig / DownloadLandingPage 各自承擔不同責任，不互相內嵌完整 payload；landing page 不獨立 registry，由 post frontmatter + ref 承載（per am-2 §5 / §8）。
- **respondent data 永不進 repo**（R1 紅線；am-2 §4.1 / §6.4 / §7.2）。
- **FormConfig 只存公開設定與連結**：publicFormUrl / embedUrl / purpose / linkedAssetIds / privacy note；**不**存 form owner email / access token / 表單填寫結果（am-2 §7.2）。
- **DownloadAsset 只存可公開或可發布 metadata**：assetId / title / publicUrl / deliveryMode / fileFormat / fileCount / isBundle / accessLevel / status；**不**存 access log / download count / 私人 Drive folder ID（am-2 §6.4）。
- **post frontmatter 之未來 ref 形態**：`assetRefs[]` / `formRef` / `landingPageRef` 為候選；既有 `download.fileUrl` 維持 grandfather，不立即 deprecate（am-2 §9 / §11.1）。
- **raw `fileUrl` 不**承擔多檔案 / 表單流 / preview risk / canonical URL 等語意（am-2 §4.4）。
- **不**透過 raw URL regex 做 preview-url-risk；該政策升級依賴 registry 落地（per `docs/20260530-download-fileurl-preview-url-risk-policy.md` §F；本文件不變動）。

### 2.2 為何現在只做 schema decision，不做實作

- **am-2 §11 migration strategy** 列 P1 docs-only preanalysis → P2 settings registry schema docs-only decision → P3 fixture-only → P4 validator source → P5 Admin read-only → P6 renderer / deploy。本文件即位於 **P2** 之位置。
- 進入 P3（建立 registry JSON 實體檔）前須**先固化 schema**；若 schema 不固化即落地 JSON，未來 P4 validator 串接時 schema drift 風險高。
- 對齊既有 docs-only cadence：am-5（D1 / D2 rules preanalysis）→ am-7（source）/ am-9（D3 / S decision）→ am-11（detail preanalysis）→ am-13（source）/ night-3（S merge decision）→ night-5（source）/ night-7（preview-url-risk docs-only policy）—— 每一步先 docs-only 裁決，再考慮 source。
- 本 phase **不**啟動 P3；P3 啟動須 user explicit approval（per am-2 §11.2）。

### 2.3 本文件與既有 docs 之關係

| 既有 docs | 本文件之關係 |
|----------|------------|
| pm-16（landing page schema preanalysis） | 沿用 §6 / §7 / §8 之 record model 草案；§5（本文件）將 DownloadAsset 欄位字典裁決固化 |
| pm-20（settings registry direction preanalysis） | 沿用 §8 之 hybrid 方向（landing page 走 content；form/asset 走 split registry）；本文件對應 hybrid 之「form/asset split registry」部分 |
| am-2（landing/asset/form registry preanalysis） | 本文件為 am-2 §11 之 **P2 step**；§5 / §6 / §7 欄位字典與 am-2 §6 / §7 草案對齊並進一步固化 |
| night-7（preview-url-risk policy） | 本文件對齊 night-7 §F 之 future implementation gate；preview-url-risk 升級條件之第一條（DownloadAsset registry schema 已 docs-accepted）即由本文件提供 |
| am-13 / night-5 / am-7（D1 / D2 / D3 / S validator） | 不變；本文件**不**改 D1 / D2 / D3 / S 之語意、命名、實作 |

---

## 3. Registry File Location Decision

### 3.1 候選方案

| 代號 | 路徑 | 性質 |
|------|------|------|
| **A** | `content/settings/download-assets.json` + `content/settings/download-forms.json` | 平鋪於 settings；分檔；與既有 `content/settings/*.json` 同層 |
| **B** | `content/settings/download/asset-registry.json` + `content/settings/download/form-registry.json` | 集中於 settings 之子目錄；分檔；與既有 settings 不同層 |
| **C** | `content/download-assets/*.json` + `content/download-forms/*.json` | 每筆 entry 一檔；與 settings 解耦；多檔 fragment |

### 3.2 多維比較

| 維度 | A 平鋪 settings | B settings 子目錄 | C 每 entry 一檔 |
|------|---------------|-----------------|----------------|
| 與既有 settings 慣例一致性 | 🟢 高（categories / tags / promotion / ga4 / ads 皆為 `content/settings/*.json`） | 🟡 中（settings 樹首次出現子目錄；無前例） | 🔴 低（settings 樹下無此 pattern；偏離 §3.2 集中管理原則） |
| Admin 未來讀取難度 | 🟢 低（單一 JSON loader 即可） | 🟡 中（須遞迴掃 settings 子目錄；既有 `load-settings.js` 無此能力） | 🔴 高（須掃多檔 + 合併；近似 content loader 而非 settings loader） |
| validation script 未來讀取難度 | 🟢 低（mirror 既有 settings loader pattern；單檔讀取） | 🟡 中（需新增子目錄遞迴 helper；微擴張 load-settings.js） | 🔴 高（fragment merge；error path 指 ref 較長） |
| git diff 可讀性 | 🟢 高（每次新增 / 修改 asset 一筆 diff，集中於同檔） | 🟢 高（同 A） | 🟡 中（每筆獨立檔有助 review，但批量變更 diff 散落） |
| 是否適合多資產成長 | 🟡 中（單檔可能膨脹；100 筆以內 OK） | 🟡 中（同 A） | 🟢 高（fragment 不受單檔大小限制） |
| migration 風險 | 🟢 低（新增兩檔；無 schema 干擾） | 🟡 中（settings 樹首次分子目錄；可能影響未來 settings 遞迴 loader 之 backward compat） | 🔴 高（loader pattern 變更最大；與既有 settings cadence 偏離最遠） |
| 隱私邊界明確度 | 🟢 高（檔名顯示「download-assets」/「download-forms」一目了然） | 🟢 高（同 A） | 🟡 中（多檔可能被誤認為「資料夾」屬性；隱私邊界稍弱） |

### 3.3 推薦

**推薦 Option A：`content/settings/download-assets.json` + `content/settings/download-forms.json`**

理由：

1. **對齊 CLAUDE.md §3.2 settings 集中管理原則**：既有 settings 皆為 `content/settings/*.json`，本 registry 沿用同 pattern，作者 / Admin / validation script 之 mental model 一致。
2. **loader 改動最小**：未來 P4 validator 與 P5 Admin 可 mirror `load-settings.js` 既有 categories / tags loader pattern；無須新增子目錄遞迴 helper。
3. **檔案數量可控**：以本系統定位（個人部落格 + 教具下載），asset / form 數量短期內以「十位數」為估算上限；單檔可容納，無膨脹風險。
4. **git diff cadence 與既有 `categories.json` / `tags.json` 變更一致**：作者新增一個 asset entry 即為 single-file commit；review 容易。
5. **隱私邊界於檔名一目了然**：`download-assets.json` / `download-forms.json` 之檔名清楚標示「資產 metadata」/「表單設定」語意，避免與 respondent data 混淆。

不推薦 Option B 之理由：

- settings 樹首次出現子目錄會破壞既有 loader 之 backward compat；P5 Admin 與 P4 validator 都須額外處理「掃 settings 子目錄」之邏輯，增加不必要複雜度。
- 對「目前 entry 數量 ≤ 50 筆」場景無 measurable benefit。

不推薦 Option C 之理由：

- 與 settings 集中管理原則衝突；C pattern 比較像 content tree（per-post markdown）而非 settings tree（per-domain JSON）。
- loader pattern drift 最大；validation error path 須指明「哪個 fragment 之 assetId」而非「assets 陣列之 index」，error message readability 較差。
- git diff 散落於多 fragment；批量 schema migration 時 review 成本高。

### 3.4 本 phase 不建立檔案

- ❌ **不**建立 `content/settings/download-assets.json`。
- ❌ **不**建立 `content/settings/download-forms.json`。
- 本 phase 僅固化「**如果**未來建立，會放這兩個路徑」之 schema decision；實際建檔須等 P3（registry JSON fixture-like settings file preanalysis）+ user explicit approval。

---

## 4. Registry Versioning Decision

### 4.1 頂層結構草案

未來兩個 registry 之頂層 JSON 結構草案：

```jsonc
// content/settings/download-assets.json（未來；本 phase 不建立）
{
  "schemaVersion": 1,
  "updatedAt": "",                  // ISO 8601；空字串 placeholder（per pm-16 §8.3）
  "assets": [
    // DownloadAsset entry 陣列；空陣列 acceptable
  ],
  "notes": ""                       // 維運備忘；optional；不存 PII
}
```

```jsonc
// content/settings/download-forms.json（未來；本 phase 不建立）
{
  "schemaVersion": 1,
  "updatedAt": "",
  "forms": [
    // FormConfig entry 陣列；空陣列 acceptable
  ],
  "notes": ""
}
```

### 4.2 版本欄位裁決

| 欄位 | 裁決 | 理由 |
|------|------|------|
| `schemaVersion` | ✅ **必填**；integer；初始值 `1` | 預備未來 schema breaking change 時可 migration；mirror 既有 `link-sources.json` / `link-rules.json` 之 `version` 欄位 cadence |
| `updatedAt` | ✅ **必填欄位 / 值可為空字串**；ISO 8601 字串 | 與 pm-16 §6 / §7 / §8 之 placeholder 政策一致；未強制非空，作者 / Admin 可未來回填；validation 不對空值 warn |
| `assets[]` / `forms[]` | ✅ **必填欄位 / 值可為空陣列** | 允許 empty registry；P3 fixture-only phase 之 baseline 即為「empty array + schemaVersion: 1 + updatedAt: \"\"」 |
| `notes` | ❌ **optional**；string | 維運備忘；無 entry 時可省略；不存個資 |

### 4.3 schemaVersion vs version 命名選擇

採 **`schemaVersion`**（非 `version`）。理由：

- `version` 易與「entry 之版本」（如 asset 之 `v1` / `v2` 修訂）混淆。
- `schemaVersion` 語意明確：指 registry 檔本身之 schema shape，而非個別 entry 之版本。
- 與既有 docs 描述 `schema decision` 一致；與 CLAUDE.md §3.2 之 settings 慣例不衝突（既有 settings 多無顯式 version 欄位；本 registry 為首次明示，未來建議其他 settings 漸進補 `schemaVersion`）。

### 4.4 是否允許 disabled / archived entries

**允許**。entry 之 `status` 欄位（per §5 / §6）使用 enum `draft` / `ready` / `published` / `archived`：

- `archived` entry **保留**於陣列；validation / Admin 可 skip render，但 ref 解析仍可 lookup（避免歷史 ref 突然 dangling）。
- **不**設獨立 `disabled` enum value；`archived` 已 cover「不再使用但保留歷史紀錄」之需求。

### 4.5 本 phase 不建立實體 JSON

- ❌ **不**寫入任何 `content/settings/download-assets.json` / `download-forms.json`。
- 本節僅固化 schema **shape**；實際 JSON 建檔須等 P3。

---

## 5. DownloadAsset Field Dictionary

### 5.1 欄位 decision table

| 欄位 | required / optional | 型別 | allowed values | future validation usage | Admin display usage | 是否可空 | privacy risk |
|------|---------------------|------|----------------|------------------------|--------------------|---------|-------------|
| `assetId` | ✅ required | string（kebab-case；unique 於 registry） | 符合 `^[a-z0-9]+(-[a-z0-9]+)*$`；不得空 / 空白；不得重複 | 未來 A3 `download-assetref-not-found` 之 lookup key | ✅ 顯示於 asset picker；primary key | ❌ 不可空 | 🟢 低（kebab-case slug，無 PII） |
| `title` | ✅ required | string | non-empty trimmed | 未來 ready/published gate 可檢查空字串 | ✅ 顯示為 asset 顯示用標題 | ❌ 不可空 | 🟢 低（作者自命名） |
| `assetType` | ✅ required | enum string | 見 §7.1 | 未來 A 系列 / preview-risk-via-registry 之判斷依據 | ✅ 顯示為 type chip | ❌ 不可空 | 🟢 低 |
| `deliveryMode` | ✅ required | enum string | 見 §7.2 | 未來 preview-url-risk-via-registry 之主判斷欄位 | ✅ 顯示為 delivery chip + warning hint | ❌ 不可空 | 🟢 低 |
| `publicUrl` | ✅ required | string（URL） | 符合 `^https?://`（沿用 D3 syntax）；ready/published 時 non-empty；draft 時可空 | 未來可加 D3-like syntax check on registry | ✅ 顯示為對外公開 URL；可複製 | 🟡 可空（draft only） | 🟡 中（Drive share / preview URL 可能洩 file ID；屬可公開範疇，但建議 author 留意） |
| `canonicalDownloadUrl` | ❌ optional | string（URL）或 `null` | 若非 null 須符合 `^https?://` | 未來 landing page render 之 download button target；validator 可檢查與 `publicUrl` 一致性 | ✅ 顯示為「真正下載 URL」（次要欄位） | ✅ 可空 / null | 🟡 中（同 publicUrl） |
| `previewUrl` | ❌ optional | string（URL）或 `null` | 若非 null 須符合 `^https?://` | 未來不參與 render；僅 Admin 顯示 | 🟡 僅 Admin 顯示；render 端 fallback `publicUrl` | ✅ 可空 / null | 🟡 中（同 publicUrl） |
| `fileCount` | ❌ optional | number（integer ≥ 0） | ≥ 0；isBundle === true 時建議 > 1 | 未來 A2-like 可檢查 isBundle/fileCount 一致性 | ✅ 顯示為「N 個檔案」chip | ✅ 可空 | 🟢 低 |
| `fileFormat` | ❌ optional | string[] | 每個 entry 為小寫副檔名（如 `"pdf"` / `"png"` / `"zip"`） | 未來 landing page render 之 file type icon | ✅ 顯示為 format chips | ✅ 可空（空陣列 OK） | 🟢 低 |
| `isBundle` | ❌ optional | boolean | true / false | 與 fileCount 一致性；若 true 但 fileCount=1 → warn（未來） | ✅ 顯示為「是否打包」flag | ✅ 可空（預設 false） | 🟢 低 |
| `accessLevel` | ❌ optional | enum string | 見 §7.3 | 未來 ready/published gate：accessLevel='draft' + status='ready' → warn | ✅ 顯示為 access chip | ✅ 可空（預設 `public`） | 🟢 低 |
| `owner` | ❌ optional | string（free text） | non-PII 之內部記錄（如 `"我的 Drive"`） | — | 🟡 僅 Admin 內部顯示 | ✅ 可空 | 🔴 **高 risk**（禁存 Google account email / 帳號識別資訊；違反即扣分） |
| `status` | ✅ required | enum string | 見 §7.4 | 未來 P5 Admin 篩選；P6 renderer 之顯示 gate | ✅ 顯示為 status chip | ❌ 不可空 | 🟢 低 |
| `notes` | ❌ optional | string | 維運備忘 | — | 🟡 僅 Admin 內部顯示 | ✅ 可空 | 🔴 **高 risk**（禁存 access token / 私人 Drive folder ID / respondent 個資；違反即扣分） |

### 5.2 必填 vs 選填 之裁決原則

- **核心必填（assetId / title / assetType / deliveryMode / publicUrl / status）**：構成 registry entry 之最小可識別 / 可 render 集合；缺任一即無法被 lookup 或顯示。
- **語意輔助選填（canonicalDownloadUrl / previewUrl / fileCount / fileFormat / isBundle / accessLevel）**：屬「描述 asset 之配發細節」；未填時 render 端 fallback `publicUrl` / `assetType`，不致破壞功能。
- **維運選填（owner / notes）**：屬「Admin 內部備忘」；不影響 render；不對外顯示；不存個資。

### 5.3 為何 publicUrl 為必填而非可空

- 即使 draft 期允許 placeholder（per pm-16 §8.3），仍須**有欄位**承載 URL；draft 時 `publicUrl: ""` 為 acceptable shape。
- 「**必填欄位**」≠「**值不可空**」；本欄位裁決為「**必填欄位**，值在 ready/published 時須 non-empty」，與 D1 之「ready/published only」cadence 對齊。
- 未來 validation 可參考 D1 pattern：對 ready/published asset 之 `publicUrl` 做 non-empty check。

### 5.4 為何禁 owner / notes 存個資

- owner / notes 為 free-text 欄位；若放任作者填入「`xxx@gmail.com` 上傳」之 owner email，會違反 R1 紅線。
- 本文件明示**禁止**；P5 Admin UI 應加 placeholder 提示「不可填入帳號 / 個資」；P4 validator 不對 free-text 內容做 PII 偵測（成本不對等），靠 author awareness 守線。

---

## 6. FormConfig Field Dictionary

### 6.1 欄位 decision table

| 欄位 | required / optional | 型別 | allowed values | future validation usage | Admin display usage | 是否可空 | privacy risk |
|------|---------------------|------|----------------|------------------------|--------------------|---------|-------------|
| `formId` | ✅ required | string（kebab-case；unique 於 registry） | 符合 `^[a-z0-9]+(-[a-z0-9]+)*$`；不得空 / 空白；不得重複 | 未來 F2 `download-formref-not-found` 之 lookup key | ✅ 顯示於 form picker；primary key | ❌ 不可空 | 🟢 低 |
| `title` | ✅ required | string | non-empty trimmed | ready/published gate 可檢查空字串 | ✅ 顯示為 form 顯示用標題 | ❌ 不可空 | 🟢 低 |
| `provider` | ✅ required | enum string | 見 §7.5 | 未來 P5 Admin 篩選；P6 renderer 之嵌入策略 | ✅ 顯示為 provider chip | ❌ 不可空 | 🟢 低 |
| `publicFormUrl` | ✅ required | string（URL） | 符合 `^https?://`；ready/published 時 non-empty；draft 時可空 | 未來可加 syntax check；ready/published gate | ✅ 顯示為對外公開 URL；可複製 | 🟡 可空（draft only） | 🟡 中（站方自有 form 之 URL；屬可公開範疇） |
| `embedUrl` | ❌ optional | string（URL）或 `null` | 若非 null 須符合 `^https?://` | 未來 landing page render 之 iframe src | ✅ 顯示為「嵌入 URL」（次要欄位） | ✅ 可空 / null | 🟡 中（同 publicFormUrl） |
| `purpose` | ✅ required | string | non-empty trimmed | ready/published gate 可檢查空字串 | ✅ 顯示為 form 用途說明 | ❌ 不可空 | 🟢 低 |
| `linkedAssetIds` | ❌ optional | string[] | 每個 entry 為合法 assetId（kebab-case） | 未來 F3-like 可檢查 ref 解析 + cross-registry consistency | ✅ 顯示為 linked assets chips | ✅ 可空（空陣列 OK） | 🟢 低 |
| `requiredFieldsSummary` | ❌ optional | string | non-PII 之 schema 描述（如「Email / 姓名 / 學校」） | — | ✅ 顯示為「會被問哪些欄位」說明 | ✅ 可空 | 🔴 **高 risk**（禁列舉真實使用者答覆；必須僅描述 schema 字段，per pm-16 §7.3） |
| `privacyNote` | ❌ optional | string | 隱私揭露文字 | — | ✅ 顯示為 landing page 隱私提示 | ✅ 可空 | 🟢 低 |
| `status` | ✅ required | enum string | 見 §7.4 | 未來 P5 Admin 篩選；P6 renderer 之顯示 gate | ✅ 顯示為 status chip | ❌ 不可空 | 🟢 低 |
| `notes` | ❌ optional | string | 維運備忘 | — | 🟡 僅 Admin 內部顯示 | ✅ 可空 | 🔴 **高 risk**（禁存 form owner email / OAuth secret / respondent 個資；違反即扣分） |

### 6.2 為何不放 ownerEmail / accessToken

- form owner 之 Google account email / OAuth token / API credential **永不**進 repo（R1 紅線 + CLAUDE.md §29 不可建立會員系統 / 帳號識別之延伸）。
- form 之**所有權**註記若需要表達，可用 `notes` 之 free-text 寫「站方擁有」此類**非帳號識別**之說明（per pm-16 §7.1 `ownerNote` 草案，本文件併入 `notes`）。
- 任何 sensitive credential 屬秘密管理範疇，永不進 git history（即使 archived 狀態亦然）。

### 6.3 為何 linkedAssetIds 為 optional 而非 required

- 部分 form 可能無對應 asset（如純意見表單）；強制 required 會破壞此 use case。
- 對「form → asset 一對多」場景，作者可填多個 `assetIds`；無對應時填空陣列即可。
- 未來 validation 可檢查「`linkedAssetIds[i]` 存在於 DownloadAsset registry」之 cross-registry ref 解析；但**不**強制 non-empty。

### 6.4 為何 requiredFieldsSummary 為文字而非結構化欄位

- 結構化欄位（如 `requiredFields[]: { name, type, required }`）易誘導作者塞入「使用者答案」；text-only summary 強化「**僅描述 schema**」之邊界。
- 對 landing page render 之需求（讓 user 預先知道會被問哪些欄位）而言，free text 已充足。
- 未來若要結構化（如 GDPR 自動產生隱私揭露文），須另開 phase 重新評估；本文件不為其預留欄位空間。

---

## 7. Enum Decision

本節固化各 enum 之**初版允許值**。所有 enum 皆**可擴充**（未來 schemaVersion bump 後可新增 value），但**不**可任意 silent 擴充。

### 7.1 `assetType` 初版

允許值（kebab-case）：

```text
pdf
zip
jpg
png
google-drive-folder
google-drive-file
external-url
```

| value | 語意 | 典型 use case |
|-------|------|--------------|
| `pdf` | 單一 PDF 檔 | 注音卡單頁 |
| `zip` | 打包 ZIP | 多 PDF 教具包 |
| `jpg` / `png` | 單一圖片 | 暫存 placeholder / 海報 |
| `google-drive-folder` | Drive 資料夾分享 | 多檔案無 ZIP 之資料夾分享 |
| `google-drive-file` | Drive 單檔分享 | Drive preview / share URL 之單檔 |
| `external-url` | 第三方託管直連 | GitHub Releases / Cloudflare R2 |

可擴充值（未來；非本 phase 加入）：

- `mp3` / `mp4` / `mov`：音檔 / 影片
- `epub`：電子書
- `psd` / `ai` / `clip`：設計原檔（per CLAUDE.md §22 不建議放 public repo，故此類大概率不會出現於 registry）

不建議現在加入：

- 通用 `file` / `other`：模糊；validator / Admin 無法依此做有意義 dispatch。

### 7.2 `deliveryMode` 初版

允許值：

```text
direct-download
landing-page
google-drive-preview
google-drive-share
gated-form
manual
```

| value | 語意 | 典型 use case |
|-------|------|--------------|
| `direct-download` | URL 按下即下載 | `https://drive.google.com/uc?export=download&id=...` 或 GitHub Releases binary |
| `landing-page` | 透過站內 noindex landing page 配發 | 多檔案教具包 |
| `google-drive-preview` | Drive 預覽頁；非直下載 | `/preview` URL；preview-url-risk 升級後此值為 warn 判斷依據 |
| `google-drive-share` | Drive 分享 URL；非直下載 | `/view?usp=sharing`；同樣為 preview-url-risk 候選 warn |
| `gated-form` | 填表後配發（embed form） | 教師索取教具表單 |
| `manual` | 人工配發；非系統 URL | email / 私訊 / 線下 |

可擴充值：

- `email-delivery`：填表後寄 email
- `paid-download`：付費下載（per §16；未來付費功能；本 phase 不設計）

不建議現在加入：

- `auto-detect`：交給 URL pattern 推斷 deliveryMode → 違反 night-7 「不走 raw URL regex」原則。

### 7.3 `accessLevel` 初版

允許值：

```text
public
form-gated
unlisted
draft
```

| value | 語意 |
|-------|------|
| `public` | 對外公開；無 gate |
| `form-gated` | 須填表後配發 |
| `unlisted` | 不在 landing page list；僅作者 / Admin 知道 |
| `draft` | 草稿；尚未對外；若 post `status='ready'` 引用此 asset → warn |

可擴充值（未來）：

- `paid`：付費下載
- `member-only`：會員限定（本系統定位明示**不**做會員，per CLAUDE.md §29；故大概率不會加入）

不建議現在加入：

- `private`：模糊；與 `unlisted` 重疊；徒增 validator 複雜度。

### 7.4 `status` 初版

允許值（DownloadAsset 與 FormConfig 共用）：

```text
draft
ready
published
archived
```

| value | 語意 |
|-------|------|
| `draft` | 草稿；不對外；不被 ready/published post 引用 |
| `ready` | 準備好；可被 ready post 引用；但尚未正式發布 |
| `published` | 正式發布；可被 published post 引用 |
| `archived` | 封存；不再使用；保留歷史紀錄；ref 仍可解析 |

**與 post `status` 對齊**：post 之 status enum 為相同 4 值（per CLAUDE.md §23）；保持一致便於 cross-validation。

可擴充值：無計畫擴充。

不建議現在加入：

- `disabled`：與 `archived` 重疊；徒增複雜度。

### 7.5 `provider` 初版

允許值：

```text
google-forms
custom-landing-page
other
```

| value | 語意 |
|-------|------|
| `google-forms` | Google Forms（站方自有 form） |
| `custom-landing-page` | 自製 landing page 之 form（不嵌 Google Forms） |
| `other` | 其他 provider；目前無此 use case；保留 fallback |

可擴充值（未來）：

- `mailchimp` / `convertkit`：第三方 email subscription provider
- `typeform`：第三方 form provider

不建議現在加入：

- 任何**特定**第三方 provider name：除非實際 use case 出現，避免設計過度。

### 7.6 `fileFormat` 初版

不為 enum；為**自由 string[]**，每筆 entry 須符合：

- 小寫
- 副檔名 syntax（如 `"pdf"` / `"png"` / `"zip"` / `"docx"`）
- 不含 `.` 前綴

理由：

- fileFormat 為描述性欄位；可能組合非常多（pdf+png+docx 等）；不適合 enum。
- 但 syntax 必須一致；建議 future validator 對 fileFormat[i] 之 syntax 做檢查（warn level）。

### 7.7 為何不過度設計

- 本 registry 為**首次**落地；初版 enum 應**保守**，僅 cover 已知 use case + 1–2 個近期可預見之 future case。
- 過度設計會誘導 validator / Admin 寫 dead branch，且未來真正使用時 enum 已 drift；保守起步、依需求漸進擴充為更可持續策略。
- 「**寧少勿多**」之 enum 政策，對齊既有 link-rules / promotion / ga4 settings 之 cadence（per CLAUDE.md §3.2）。

---

## 8. Forbidden Fields Decision

registry **永遠不應**包含以下欄位 / 內容：

### 8.1 Respondent / 個資類（R1 紅線）

- ❌ `respondentEmails[]` / `respondentNames[]` / `respondentPhones[]`
- ❌ `formResponses[]` / `formAnswers{}`
- ❌ `userEmail` / `userPhone` / `userName` / `userId`
- ❌ `surveyResults` / `responseRows[]`

### 8.2 Google Sheet / Forms 後台類

- ❌ Google Sheet response rows
- ❌ Google Sheet sheetId（即使是「URL」形式）
- ❌ form 之**填寫內容**統計（如「N 人下載」之 raw count）

### 8.3 私人備註類

- ❌ private notes about individual respondents（如「使用者 A 表示...」）
- ❌ 任何將某 person identify 出來之 field

### 8.4 認證 / 秘密類

- ❌ `accessToken` / `apiKey` / `oauthSecret` / `bearerToken`
- ❌ `googleAccountEmail` / `ownerEmail`
- ❌ Google Drive folder 之**私人權限 ID**（即非公開分享之 folder）

### 8.5 內部路徑類

- ❌ non-public internal file path（如 `C:\Users\xxx\Downloads\xxx.pdf`）
- ❌ 私人雲端 path（如 OneDrive / Dropbox personal account path）
- ❌ git-internal hash / sensitive metadata

### 8.6 邊界宣告

> 上述 forbidden fields 屬 **R1 紅線**之延伸（per pm-20 §4 / am-2 §4.1）。
> 這些資料留在 **Google Forms / Google Sheets / 外部權限系統**，**不**進 BLOG repo（無論是 production / draft / archive 任一狀態）。
> 即使作者明示「我願意公開這個 email」，registry 之欄位設計**不**為其提供承載空間；若作者真有此需求，應放於 markdown 文字內（per `relatedLinks` 之作者揭露 cadence），由作者自行為文字內容負責，不為 schema 必欄。

### 8.7 P4 validator 對 forbidden fields 之處理（未來）

- P4 validator **不**主動偵測 forbidden fields 內容（成本不對等；PII 偵測為 ML / regex 雙難題）。
- P4 validator 可對「**unknown field**」warn（如 registry entry 出現非 schema 之 key → warn）；藉此**間接**降低作者塞入 PII 欄位之風險。
- P5 Admin UI 之 form input 應使用 **白名單 input**（僅顯示 schema 已定欄位）；free-text input 須加 placeholder 提示「不可填入個資」。

---

## 9. Relationship Decision

### 9.1 post frontmatter 之 reference 形態候選

per am-2 §9 之四候選：

| 代號 | 形態 | 描述 |
|------|------|------|
| **A** | `post.download.fileUrl` legacy | 既有單 URL 欄位 |
| **B** | `post.download.assetRefs[]` | 多 asset reference |
| **C** | `post.download.formRef` | 單一 form reference |
| **D** | `post.download.landingPageRef` | landing page id reference（per pm-16 §6） |

### 9.2 long-term recommended shape

**推薦長期目標：B + C 並存（無 D）**

```yaml
contentKind: download
download:
  enabled: true
  title: "教師索取注音卡"
  description: "..."
  assetRefs:                  # 多 asset；對應 DownloadAsset.assetId
    - phonics-cards-zip-v1
    - phonics-flashcards-pdf-v1
  formRef: phonics-teacher-form-v1   # 對應 FormConfig.formId（可選；無 gate 則省略）
  fileType: "PDF"             # 保留為過渡相容；未來可從 assetRefs 推導
  licenseNote: "..."
```

**不採用 D（`landingPageRef`）之理由**：

- per am-2 §5 / §8：DownloadLandingPage **不**為獨立 registry entity；landing page 由 post frontmatter 之 `contentKind === 'download'` + `assetRefs[]` / `formRef` 衍生。
- 增加 `landingPageRef` 等於再多一層 indirection（post → landingPageRef → landingPage → assetRefs/formRef），破壞 hybrid 簡潔性。
- 若未來真有「landing page 跨 post 共用」之需求，再開新 phase 評估 D；目前 use case 為「一 post = 一 landing page」，無共用需求。

### 9.3 existing fileUrl grandfather 策略

- **保留**既有 `download.fileUrl` 欄位語意；不 deprecate；不立即 migration。
- 對既有 production / draft posts（目前唯一 download fixture：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`）：
  - `download.fileUrl` 維持空字串 placeholder；不主動填值。
  - **不**強制改為 `assetRefs[]` / `formRef`。
  - D1 / D2 / D3 / S validator 對 fileUrl 之既有規則**繼續有效**；不退化。
- 未來新建 download post：**建議**直接採 B + C；不建議再採 A。
- 即使 P3+ phase 落地，A 與 B+C **可共存**：
  - 若 post 同時有 `fileUrl` 與 `assetRefs[]` → 未來 validator 可 warn「兩種模式並存；建議擇一」；但**不** error。
  - 若 post 僅有 `fileUrl` → D1 / D2 / D3 / S 沿用既有檢查。
  - 若 post 僅有 `assetRefs[]` → 未來 A 系列檢查接手。

### 9.4 為何短期不 migration

- migration 涉文章內容變更；屬 R3 紅線之相關範疇（per pm-20 §4 不另開 SEO pipeline 之延伸：不擾動既有 production 內容）。
- 目前僅一篇 draft download fixture；migration value 對等 cost 不成比例。
- 漸進策略對 author 之 mental model 衝擊最小；新 schema 學習曲線可隨新建文章吸收。

### 9.5 schema decision 對 post frontmatter schema 之影響

本文件**不**改 post frontmatter schema：

- ❌ 不新增 `download.assetRefs[]`
- ❌ 不新增 `download.formRef`
- ❌ 不新增 `download.landingPageRef`
- 上述欄位之 schema **追加**屬未來 source phase（P3 / P4）；本 phase 僅固化「**若**新增，會採何形態」之裁決。

---

## 10. Validation Implications

> 本節描述**未來** validator 可如何使用 registry。
> **本 phase 不新增任何 validation rule**；`src/scripts/validate-content.js` 一行不動；baseline 維持 0 errors / 47 warnings / 42 posts。

### 10.1 候選未來 validation rules

| 規則 | warning id | 觸發條件 | 前置條件 |
|------|-----------|---------|---------|
| A1 | `download-assetrefs-invalid-type` | `download.assetRefs` 存在但非 array | post schema 加 `assetRefs[]` 欄位 |
| A2 | `download-assetrefs-empty` | post status=ready/published + assetRefs 為空陣列（且無 formRef-only flow） | A1 已落地 |
| A3 | `download-assetref-not-found` | `assetRefs[i]` 已設但 registry 內無對應 `assetId` | DownloadAsset registry JSON 已落地 + A1 已落地 |
| F1 | `download-formref-missing` | post 須 form gate 但 `formRef` 未設 | post schema 加 `formRef` 欄位 + 對「須 form gate」之判斷邏輯定稿 |
| F2 | `download-formref-not-found` | `formRef` 已設但 registry 內無對應 `formId` | FormConfig registry JSON 已落地 + F1 已落地 |
| preview-risk-via-registry | `download-asset-preview-url-risk` | `assetRefs[i]` 之 asset 之 `deliveryMode === 'google-drive-preview'` | DownloadAsset registry JSON 已落地 + A3 已落地 |
| asset-inactive | `download-assetref-archived` | `assetRefs[i]` 之 asset 之 `status === 'archived'`，但 post status=ready/published | DownloadAsset registry JSON 已落地 + A3 已落地 |
| form-inactive | `download-formref-archived` | `formRef` 之 form 之 `status === 'archived'`，但 post status=ready/published | FormConfig registry JSON 已落地 + F2 已落地 |
| bundle-consistency | `download-asset-bundle-mismatch` | asset 之 `isBundle=true` 但 `fileCount=1`；或 `isBundle=false` 但 `fileCount>1` | DownloadAsset registry JSON 已落地 |
| gated-form-required | `download-deliverymode-gated-form-requires-formref` | asset 之 `deliveryMode='gated-form'` 被引用，但對應 post 無 `formRef` | A3 + F1 同時落地 |
| ready-noindex | `download-content-should-be-noindex`（既有 S） | ready/published download post + `seo.indexing` 為 `index` 或 undefined | ✅ 已落地（night-5） |

### 10.2 raw fileUrl legacy fallback

- 既有 D1 / D2 / D3 / S 規則對 `download.fileUrl` 之檢查**不變**。
- 若 post 同時有 `fileUrl` 與 `assetRefs[]` → 未來可加 warn `download-fileurl-and-assetrefs-coexist`（severity=warning，提示作者擇一）；屬非阻擋型 hint。
- 若 post 僅有 `fileUrl`（grandfather 文章） → D1 / D2 / D3 / S 沿用；不觸發任何 A / F 規則。

### 10.3 本 phase 不新增任何規則

- ❌ 不改 `src/scripts/validate-content.js`。
- ❌ 不新增 fixture（`content/validation-fixtures/` 不動）。
- ❌ 不改 baseline。
- 上述規則表為**設計輸入**；任一啟動須 P4（validator source phase）+ user explicit approval。

---

## 11. Admin Implications

> 本節描述**未來** Admin 可如何讀取 registry。
> **本 phase 不改 Admin**；Admin write infra 仍 dormant。

### 11.1 Admin 讀取場景

| 場景 | UI shape | 來源 |
|------|---------|------|
| asset picker | dropdown / autocomplete；顯示 assetId + title + status chip | `content/settings/download-assets.json`（read-only） |
| form picker | dropdown / autocomplete；顯示 formId + title + provider chip | `content/settings/download-forms.json`（read-only） |
| source of truth display | 顯示 asset / form 之完整欄位（read-only） | 同上 |
| status warning | asset / form 之 `status='archived'` 時顯示「已封存」hint | 同上 |
| privacy warning | `owner` / `notes` / `requiredFieldsSummary` 之 input 加 placeholder 提示「不可填個資」 | UI-only convention |
| ref consistency check | post 之 `assetRefs[]` / `formRef` 與 registry 之 ref 解析 | 跨 post frontmatter + registry |
| read-only preview first | Admin 落地 P5 階段先實作 read-only；P5 之後再評估 write | 本 phase 不裁決 P5 write 是否啟動 |

### 11.2 為何 P5 為 read-only

- per `docs/admin-2-write-pre-analysis.md` §119 / §914 / §729：array-of-object + registry lookup 屬最高 write 複雜度；不適合作為首個 write feature 之基礎設施驗證載體。
- Admin Apply 仍 dormant；middleware write route 未啟用；admin-write-cli dormant。
- P5 之目標**僅**為 read-only display；write feature 屬未來獨立 phase（per am-2 §11 之 P5 描述）。

### 11.3 本 phase 不改 Admin

- ❌ 不新增 Admin UI component。
- ❌ 不改 Admin source。
- ❌ 不改 `admin-2-write-pre-analysis.md` 之 allowed write scope。
- ❌ 不啟用 Admin Apply。
- ❌ 不啟用 middleware write。
- ❌ 不執行 admin-write-cli dry-run / apply。

---

## 12. Renderer / Landing Page Implications

> 本節描述**未來** renderer 可如何使用 registry。
> **本 phase 不新增 renderer**；不 build / 不 deploy。

### 12.1 Renderer 讀取場景

| 場景 | 行為 |
|------|------|
| landing page 讀 `assetRefs[]` / `formRef` | render 時 lookup registry；組合 download button list + 可選 form embed |
| form embed | 若 `formRef` 存在 → `<iframe src={form.embedUrl}>`；fallback link `form.publicFormUrl` |
| download button | 依 asset 之 `deliveryMode` + `assetType` 決定 button label + target / rel；`canonicalDownloadUrl` 優先於 `publicUrl` 作為 button href |
| GA4 event | button click → `click_download_asset`（含 `asset_id` / `delivery_mode` / `placement`）；form submit → `submit_download_form`（含 `form_id` / `provider`）；landing page view → `view_download_landing` |
| noindex | landing page render 端強制 `<meta name="robots" content="noindex, follow">`；沿用 build-github.js 既有 fallback + S validation |
| canonical / robots | post 之 `canonical: "auto"` → 由 build 決定（同既有 cadence）；landing page 之 robots = noindex 為 hard rule |

### 12.2 為何不在本 phase 設計 GA4 event param 細節

- GA4 event naming 屬獨立 surface（per `docs/seo-ga4-adsense.md` / `docs/ga4-link-tracking-spec.md`）；應與既有 GA4 event cadence 對齊。
- 本 phase 之裁決對 GA4 event 之依賴僅為「asset / form 有穩定 id」；event param 之精確命名留待 P6（renderer / GA4 phase）。

### 12.3 本 phase 不新增 renderer

- ❌ 不新增 `src/views/pages/post-detail-download.ejs` / `src/views/blogger/blogger-post-download-*.ejs`。
- ❌ 不改 `src/views/pages/post-detail.ejs`。
- ❌ 不改 `src/scripts/build-github.js` / `build-blogger.js`。
- ❌ 不 build；不 deploy；不 Blogger repost。

---

## 13. Migration Plan

採 am-2 §11 之 8 階段保守策略（本文件對應 P1 後之 P2）：

| Phase | 性質 | 範圍 | 預期 baseline 影響 | 啟動條件 |
|-------|------|------|------------------|---------|
| **P1** | docs-only preanalysis | am-2 之 schema 草案 + 邊界圖 | 不變 | ✅ 已 landed（HEAD `8709d0b`） |
| **P2** | **docs-only schema decision（本文件）** | DownloadAsset / FormConfig 欄位字典定稿 + enum 初版 + 落點裁決 | 不變 | ✅ 本 phase 即此 step |
| **P3** | docs-only registry preanalysis | registry JSON fixture-like settings file preanalysis（討論 empty registry 之 acceptable shape + loader 串接前置 docs） | 不變 | P2 landed + user explicit approval |
| **P4** | content / settings creation | 建立 empty / minimal `download-assets.json` / `download-forms.json`（schemaVersion + empty arrays） | 不變（無 consumer） | P3 landed + user explicit approval |
| **P5** | validator source phase | 新增 A1 / A2 / A3 / F1 / F2 + fixture | +N warnings / +N posts（estimate later） | P4 landed + 至少 1 個 ready/published fixture 可驗 + user explicit approval |
| **P6** | Admin read-only display | Admin 顯示 registry + post ref（read-only） | 不變 | P5 landed + Admin-2 SEO write 穩定 + user explicit approval |
| **P7** | content migration（真實內容） | 真實 download post 從 `fileUrl` 改採 `assetRefs[]` / `formRef`；逐篇 explicit approval | 不變 validate baseline（但 production post 變動） | P6 landed + user 對每篇明示 approval |
| **P8** | build / deploy / Blogger repost / GA4 validation | renderer 落地 + dist 變動 + GA4 event 驗收 | 行為層變動 | P7 landed + user explicit approval + reverse UTM pm-26 deploy gate 之處置策略確認 |

### 13.1 各 phase 之啟動 gate

- 任一 phase 之啟動必須 user explicit approval；本 phase**不**預授權任何下游 phase。
- 對 reverse UTM 之關係：P8 涉 Blogger repost / GA4 validation；其啟動須與 reverse UTM dormant 狀態協調（不一定要解除 pm-26 gate，但須明示協調策略）。

### 13.2 既有 fileUrl 文章之 grandfather

- per §9.3：既有 `content/blogger/posts/20260529-phonics-practice-sheet-download.md` 不強制 migration。
- 即使 P8 全部落地，author 仍可選擇保留 grandfather 文章；不強制改寫。
- 對 P7（真實內容 migration）：每篇必須 user 對該篇明示 approval；不批量 migration。

---

## 14. Acceptance Criteria for Future Implementation

未來若 P3+ 任一階段建立 registry JSON，須滿足以下 acceptance：

### 14.1 validate baseline 預期

- **P3 / P4**（empty / minimal registry JSON）：validate:content **0 errors**，warnings 不增加（因 P3 / P4 不串接 validator）。
- **P5**（validator source）：error 不增；warning 可增（受新規則 + 新 fixture 驅動）；增量在 preanalysis 中明確估算（mirror am-7 / am-13 / night-5 cadence）。
- **P6 / P7 / P8**：error 不增；warning 不退步。

### 14.2 fixtures 策略

- P5 之 validator rule 必須有對應 fixture（mirror 既有 D1 / D2 / D3 / S 之 fixture pattern）。
- fixture 命名沿用 `_test-<rule-id>.md` cadence。
- fixture 為**負面樣本**（intentional fail）；driven by validator 之預期 warn。
- positive fixture（即正常通過 validator 之 ready post）**不**作為 fixture；屬正常 content。

### 14.3 no respondent data scan

- P5 validator **不**對 free-text 欄位（owner / notes / requiredFieldsSummary）做 PII 偵測；屬 author awareness 範疇。
- P6 Admin 之 input 須加 placeholder hint，但**不**做 client-side regex blocking。

### 14.4 no private token

- registry JSON **不**含任何 access token / API key / OAuth secret；P5 validator 可對 `notes` / `owner` 之 free-text 偵測「token-like pattern」（如 `^[a-zA-Z0-9]{32,}` 之 long random string） → warn（**但本 phase 不裁決此 sub-rule**；屬 P5 preanalysis 範疇）。

### 14.5 backward compatible with fileUrl

- P3 / P4 之 registry JSON 不可破壞既有 D1 / D2 / D3 / S validator 行為。
- P5 新增之 A / F 規則必須 additive；不可改既有規則語意。
- P7 之 content migration 為**選擇性**；既有 fileUrl 文章可保留為 grandfather。

### 14.6 no impact to existing posts unless explicitly migrated

- P3 ~ P6 不改任何 production post / draft post / archive。
- P7 之 migration 為**逐篇**；每篇須 user explicit approval。
- 未被 migrate 之 post 維持 fileUrl 形態；validator 行為不變。

### 14.7 no deploy without gate

- P5 / P6 之變更**不**自動觸發 build / deploy。
- P8 啟動須通過 deploy gate（含 pm-26 之協調策略確認）；不可 silent unblock。

---

## 15. Open Questions

下列為**待裁決**問題；本 phase **不**裁決；屬未來 P3 / P5 / P6 phase 之輸入。

### 15.1 registry 檔名最後命名

- 本文件推薦 `download-assets.json` / `download-forms.json`（per §3.3）。
- alternative 候選：
  - `assets-registry.json` / `forms-registry.json`（更明示 registry 語意）
  - `download-pages.json`（per pm-16 §11 Option A 之集中式；本文件已不採此方向）
- 最終命名 P3 phase 定稿；本文件之推薦為 strong default。

### 15.2 assets / forms 是否同檔或分檔

- 本文件推薦**分檔**（per §3.3 Option A）。
- alternative 候選：合併為單檔 `download-registry.json`，內含 `assets[]` / `forms[]` 兩陣列。
- 分檔之好處：關注點分離；單檔變更 diff 較集中。
- 合併之好處：loader 一次讀取；Admin UI 一次顯示。
- 本文件保留**分檔**為 strong default；P3 可再檢視。

### 15.3 status 是否需要 draft / active / archived / disabled

- 本文件採 4 值 enum：`draft` / `ready` / `published` / `archived`（per §7.4）。
- alternative 候選：
  - 3 值（無 `archived`）：archived 改為刪除 entry；但會破壞 ref 解析（dangling ref）→ **不推薦**。
  - 5 值（加 `disabled`）：與 `archived` 重疊 → **不推薦**。
- 本文件採 4 值為定稿；P3 / P5 可再檢視，但短期內無調整動機。

### 15.4 Google Drive folder 與 file 是否分 assetType

- 本文件採**分**（`google-drive-folder` / `google-drive-file`，per §7.1）。
- alternative 候選：合併為 `google-drive`，由 `fileCount` 區分。
- 分之好處：render 端 dispatch 直觀（folder render 為「Drive folder link」；file render 為「Drive 單檔下載 / 預覽」）。
- 合併之好處：enum 較簡。
- 本文件採**分**為 strong default。

### 15.5 canonicalDownloadUrl 是否 required

- 本文件採 **optional**（per §5.1）。
- alternative 候選：required（強制 author 填「真正下載」URL）。
- optional 之好處：對 Drive preview / share 等場景，canonical 可缺；render 端 fallback `publicUrl`。
- required 之好處：對 P6 download button 之 target 解析最清楚。
- 本文件採 **optional**；P6 之 renderer phase 可再檢視是否升為 required。

### 15.6 previewUrl 是否只供 Admin

- 本文件採 **只供 Admin display**（per §5.1）；render 端 fallback `publicUrl`。
- alternative 候選：允許 render 端讀取 previewUrl（如「在 landing page 嵌入 Drive preview」）。
- 本文件採**只供 Admin**；P6 renderer phase 可再檢視。

### 15.7 landingPageRef 是否需要獨立 registry

- 本文件採**不需要**（per §9.2；landing page 由 post + assetRefs/formRef 衍生）。
- alternative 候選：landingPageRef 為獨立 registry（per pm-16 §6）。
- 本文件採**不需要**為 strong default；若未來 landing page 跨 post 共用之需求出現，再開新 phase。

### 15.8 GA4 event param 命名

- 本文件**不**裁決；屬 P6 / P8 GA4 phase 範圍。
- 候選 event names（per am-2 §12.7）：`click_download_asset` / `submit_download_form` / `view_download_landing`。
- 候選 params：`asset_id` / `delivery_mode` / `placement` / `form_id` / `provider` / `landing_page_ref`。

### 15.9 是否要支援多語 metadata

- 本文件**不**支援多語 metadata（如 `title.zh-TW` / `title.en`）。
- 既有系統定位（per CLAUDE.md §3.1）已有 `title` / `titleEn` 之雙語 cadence（post frontmatter）。
- 若 registry 需多語，未來可 mirror post frontmatter 之 cadence（如 `titleEn` 欄位）。
- 本文件採**單語 title**為 strong default；P3 可再檢視。

### 15.10 是否要支援未來付費 / 限定下載

- 本文件**不**支援付費 / 限定下載。
- per CLAUDE.md §29：第一版不做會員系統 / 留言 / 後端資料庫；付費 / 限定下載屬該禁止範疇之延伸。
- 若未來真有付費 use case，須另開獨立 Phase 2 候選評估（per `docs/phase-2-candidate-roadmap.md`）；本文件**不**為其預留欄位。
- `accessLevel` enum 之未來擴充值（`paid` / `member-only`，per §7.3）為 placeholder；目前不實作。

---

## 16. Recommendation

### 16.1 推薦下一個最保守 phase

**推薦：registry JSON preanalysis docs-only**

phase name 候選：`20260531-am-5-download-asset-form-registry-json-preanalysis-docs-only-a`（或 `20260601-...` 視當天時間）

性質：

- 🟢 **docs-only**：純新增 docs；無 source / content / settings / fixture / templates / package 變更。
- ❌ 不建立 registry JSON 實體檔（屬 P4，不屬 P3）。
- ❌ 不啟動任何 validator / fixture / renderer / build / deploy。

理由：

1. 本文件 §13 之 migration plan 明示 P2 之下一步為 **P3（registry JSON preanalysis）**；P3 仍為 docs-only，討論 empty / minimal registry JSON 之 acceptable shape + loader 串接前置 docs。
2. 跳過 P3 直接進 P4（建立實體 JSON）會破壞 docs-only → fixture-only → validator source → admin → renderer 之 7-step 漸進 cadence；風險：empty registry 之 loader behavior 未先 docs 化，未來串接時可能 schema drift。
3. 與既有 cadence 對齊（am-1 → am-3 → am-5 → am-7 → am-9 → am-11 → am-13 / night-3 → night-5 / night-7 → am-2 → 本 phase）：每一步 docs-only 推進；不跳級。
4. P3 之輸入即為本文件之 §3 / §4 / §5 / §6 / §7 / §8 之裁決；P3 之輸出為「未來實體 JSON 之 acceptable empty / minimal shape + loader read-only 行為」。

### 16.2 替代次保守選項

若 user 認為 P3 過保守，可考慮：

- **read-only acceptance cross-check**（mirror am-8 / am-14 / night-6 cadence）：純驗本文件之內部一致性 + 與既有 docs cadence 對齊；驗 baseline 不變。
- 此選項仍為 read-only；不啟動 P3。
- 但 cadence 上跳過 P3，下一步須直接面對 P4 / P5；輕度增加實作風險。

### 16.3 不推薦下一步

- ❌ **不推薦**直接 source implementation（registry JSON 建檔 / validator rule / renderer / Admin）。
- ❌ **不推薦**直接 fixture creation。
- ❌ **不推薦**跳過 P3 直接進 P4 / P5。
- ❌ **不推薦**啟動 Blogger repost / GA4 validation / pm-26 deploy gate 解除。
- ❌ **不推薦**啟動 reverse UTM activation。

---

## 17. Explicit Non-Actions

本 phase 明確**未做**：

- ❌ **no source change**：`src/scripts/validate-content.js` / `build-github.js` / `build-blogger.js` / `load-posts.js` / `load-settings.js` / `build-promotion.js` / `build-sitemap.js` / `parse-markdown.js` 等 source 一行不動。
- ❌ **no content change**：`content/blogger/posts/` / `content/github/posts/` / `content/drafts/` / `content/archive/` 一檔不動。
- ❌ **no settings change**：`content/settings/*.json` 一檔不動。
- ❌ **no templates change**：`content/templates/*.md` 一檔不動。
- ❌ **no package change**：`package.json` / `package-lock.json` / `vite.config.js` 不動；無 `npm install`。
- ❌ **no fixture creation**：`content/validation-fixtures/` 一檔不動。
- ❌ **no registry JSON creation**：不新增 `content/settings/download-assets.json` / `content/settings/download-forms.json` / `content/registries/*.json` / `content/settings/download/*.json`。
- ❌ **no renderer**：不新增 `src/views/pages/post-detail-download.ejs` / `src/views/blogger/blogger-post-download-*.ejs` / 其他 landing page template。
- ❌ **no validator rule**：不新增 A1 / A2 / A3 / F1 / F2 / preview-risk-via-registry / bundle-consistency / asset-inactive / form-inactive / gated-form-required / unknown-field / token-like-pattern 等任一規則。
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
- ❌ **no `download.fileUrl` 與 Google Form URL 混淆**：R2 紅線恪守；本文件之裁決明示三類 URL（article fileUrl / FormConfig publicFormUrl/embedUrl / DownloadAsset publicUrl/canonicalDownloadUrl/previewUrl）三者物理分離。
- ❌ **no other SEO pipeline**：R3 紅線恪守；landing page 之 noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline。
- ❌ **no am-7 / am-13 / night-5 / night-7 implementation 變更**：D1 / D2 / D3 / S / preview-url-risk policy 全保持 frozen。
- ❌ **no docs revision**：本 phase 不改既有 docs（am-1 / am-2 / am-3 / am-5 / am-7 / am-9 / am-11 / am-13 / night-3 / night-5 / night-7 / pm-12 / pm-15 / pm-16 / pm-18 / pm-20 等）；僅新增本 phase 之新 docs 檔。
- ❌ **no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`**：唯一 git 操作為 add + commit + push（單檔 docs）。

### 17.1 Governance frozen state

- reverse UTM remains **landed but dormant**。
- pm-26 deploy gate remains **BLOCKED**。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守。
- D1 / D2 / D3 / S / preview-url-risk 全保持 frozen；本 phase 不重做、不調整、不退化。

---

（本文件結束）
