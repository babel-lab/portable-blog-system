# 20260531 Download Landing Page / Asset Registry / Form Registry Preanalysis

> Phase: `20260531-am-2-download-landing-asset-form-registry-preanalysis-docs-only-a`
> Date: 2026-05-31 09:23 +0800
> Scope: **docs-only**（無 source / content / settings / templates / fixture / package / dist / gh-pages 變更）

---

## 1. Executive Summary

- 本文件**只**做 docs-only preanalysis：為未來 **download landing page** / **DownloadAsset registry** / **FormConfig registry** 三個 entity 描繪整體架構邊界，並提出第一份草案 schema。
- 本文件**不**建立任何 registry：
  - ❌ 不新增 `content/settings/*.json` 之 registry 實體檔
  - ❌ 不新增 landing page renderer / template / EJS partial
  - ❌ 不改 `src/scripts/validate-content.js`
  - ❌ 不新增 fixture（`content/validation-fixtures/` 不動）
  - ❌ 不改 frontmatter schema（`assetRefs[]` / `formRef` / `landingPageRef` 仍**未**進 schema）
  - ❌ 不改 production / draft post
  - ❌ 不 build / deploy / Blogger repost / GA4 validation
  - ❌ 不啟用 Admin Apply / middleware write / `admin-write-cli` dry-run / apply
  - ❌ 不解除 reverse UTM dormant 狀態；不解除 pm-26 deploy gate
- 目標：把 future download landing page / asset registry / form registry 之**設計邊界**先用 docs 固化，讓未來 docs-only acceptance / settings registry decision / fixture / validator source 等子 phase 可在同一張地圖上展開，避免 schema 反覆。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔。

### 1.1 一句話裁決

> **未來 download 生態須**由三個解耦 entity 共同承擔（DownloadAsset / FormConfig / DownloadLandingPage）；**respondent data 永不進 repo**；**raw `download.fileUrl` 不**承擔多檔案 / 表單流 / preview risk / canonical URL 等語意；**post frontmatter 維持薄參考**（`assetRefs[]` / `formRef` / `landingPageRef`），不內嵌 registry payload。

---

## 2. Current State

### 2.1 已 landed 之 download / SEO validation

| 規則 | warning id | severity | 觸發範圍 | 狀態 | 落地 phase |
|------|-----------|---------|---------|------|----------|
| D1 | `download-enabled-fileurl-empty` | warning | ready / published（contentKind=download + enabled=true + fileUrl 空 / whitespace） | ✅ landed | am-7 |
| D2 | `download-fileurl-invalid-type` | warning | ready / published（fileUrl 非 undefined 且非 string） | ✅ landed | am-7 |
| D3 | `download-fileurl-invalid-format` | warning | ready / published（fileUrl non-empty trimmed string + 不符 `^https?://`） | ✅ landed | am-13 |
| S（S1/S2 merged） | `download-content-should-be-noindex` | warning | ready / published（contentKind=download + `seo.indexing` undefined 或 `index`） | ✅ landed | night-5 |

baseline：**0 errors / 47 warnings / 42 posts**（per `npm run validate:content` at 2026-05-31 09:23）。

### 2.2 preview-url-risk 為 docs-only policy

per `docs/20260530-download-fileurl-preview-url-risk-policy.md`（night-7）：

- preview-url-risk **不**為 validator rule；**不**為 fixture；**不**為 baseline 變動。
- 純 docs-only authoring policy；validator 永不對 Google Drive `/view` / `/preview` / `/uc?export=download` 等 URL 形式做 regex 或 reachability check。
- 未來若要升級為 validator / Admin warning，**必須先**有 DownloadAsset registry 落地（per night-7 §F）。即：preview-url-risk 之升級**等同**於 registry 之啟動。
- 此政策**未被本 phase 鬆綁**；本 phase 沿用 night-7 §F 之 future implementation gate。

### 2.3 現有 `download.fileUrl` 之欄位限制

per `content/templates/blogger-download-template.md` + `content/blogger/posts/20260529-phonics-practice-sheet-download.md`（唯一 draft download post）：

- `download.enabled: boolean`
- `download.title: string`
- `download.description: string`
- `download.fileUrl: string`（單一 URL；D1 / D2 / D3 已守 syntax）
- `download.fileType: string`（`PDF` / `ZIP` 等）
- `download.licenseNote: string`

未支援之欄位：

- ❌ `download.assetRefs[]`（多檔案參照）
- ❌ `download.formRef`（gated form 參照）
- ❌ `download.landingPageRef`（中繼頁參照）
- ❌ `download.fileCount` / `isBundle` / `accessLevel` 等 metadata

### 2.4 Google Form respondent data 之邊界

per `CLAUDE.md` §29 + `docs/20260530-download-fileurl-preview-url-risk-policy.md` §E.5 + pm-20 §4 紅線 R1：

- Google Form **填表結果**保留在 Google Forms / Sheets；分析時另外匯出。
- **不**進 BLOG 系統 / repo / Admin 靜態檔案。
- 本 phase **不**鬆綁此紅線；本 phase 提出之 FormConfig 僅承載**公開設定**（title / publicFormUrl / embedUrl 等），**不**承載任何 respondent data。

### 2.5 既有 build 端 fallback（與本 phase 解耦）

per `src/scripts/build-github.js` L290–L308 + `src/scripts/build-sitemap.js` L125–L131：

- robots meta：`contentKind === 'download'` fallback → `noindex, follow`。
- sitemap：`seoIndexing !== 'index' && contentKind === 'download'` → 排除。

→ 行為層之 noindex / sitemap 排除已固化；本 phase 之 landing page 設計**不**改變該 fallback。

---

## 3. Problem Statement

### 3.1 未來下載型文章之多樣性

下表為**未來可能落地**之下載型內容類別與其 schema 需求（**僅為設計輸入**；本 phase 不裁決哪些必做、何時做）：

| 內容類別 | 範例 | schema 需求 |
|---------|------|-----------|
| 注音卡 | 「ㄅㄆㄇ 注音卡 PDF」 | 單一 PDF（或 ZIP）+ optional 表單 gate |
| 數字卡 | 「1-100 數字認讀卡」 | 多 PDF（10 張一組）+ ZIP bundle |
| 節慶下載 | 「中秋月餅 DIY 教具包」 | 多 PDF + 多圖檔 + 印製說明 |
| 多 PDF 打包 ZIP | 「親子桌遊 5 種組合包」 | ZIP（含 metadata：檔案數、總大小） |
| 暫時性單張 JPG / Drive share link | 草稿期之 placeholder | Drive `/file/d/.../view?usp=sharing` |
| 內嵌表單下載頁 | 「填寫 email 後寄送 PDF」 | Google Form 內嵌 + 表單 submit 後配發 |

### 3.2 需要區分之四類資料

未來 download 生態須清楚分層下列**四類資料**之 source of truth：

| 資料類別 | 範疇 | 落點 | 紅線 |
|---------|------|------|------|
| 使用者填表資料（respondent data） | email / 姓名 / 學校 / 答覆內容 | **Google Forms / Sheets / 其他外部系統**；**永不**進 repo | 🔴 R1（per pm-20 §4） |
| 表單設定（FormConfig） | publicFormUrl / embedUrl / purpose / 連結之 asset | `content/settings/forms.json`（未來；本 phase 不建檔） | 🟢 |
| 下載資產 metadata（DownloadAsset） | assetId / title / publicUrl / fileFormat / fileCount | `content/settings/download-assets.json`（未來；本 phase 不建檔） | 🟢 |
| 文章 metadata | title / slug / category / tags / contentKind / status | `.md` frontmatter | 🟢 |

### 3.3 使用者填表資料不可進 repo

- 即使作者想記錄「某 PDF 有 N 人下載」之統計，**不**得在 registry 內塞入 raw 統計或 raw response。
- 統計分析應走 Google Forms / Sheets / GA4 / 外部 BI 工具；本系統**永不**承擔 respondent data 儲存。
- FormConfig 僅承載「**表單之公開設定**」（title / URL / 表單用途說明）；不承載「**表單之填寫內容**」。

### 3.4 下載資產 metadata 可被系統管理

- DownloadAsset 為「**可公開**或**可發布**」之資產描述；不含個資；可進 git。
- 例：assetId `phonics-cards-zip-v1` / title `注音卡 PDF 打包 v1` / publicUrl `https://drive.google.com/uc?export=download&id=<id>` / fileCount `10` / fileFormat `["pdf"]` / isBundle `true`。
- 不混入 respondent data；不混入 access log；不混入 download count（後者屬 GA4 / 分析範圍）。

---

## 4. Design Principles

### 4.1 Privacy first

- **R1 紅線恪守**：respondent data 永不進 repo / Admin 靜態檔案。
- FormConfig 僅承載公開設定；私密設定（如 form owner 之 Google Account email）一律不寫入。
- DownloadAsset 不承載 access log / download count / user IP / referrer。

### 4.2 Source of truth 清楚分層

- 文章 metadata → `.md` frontmatter（既有）
- 下載資產 metadata → `content/settings/download-assets.json`（未來）
- 表單公開設定 → `content/settings/forms.json`（未來）
- landing page 結構 → `.md` frontmatter `contentKind: download` + 新欄位 `landingPageRef` 或 `assetRefs[]` / `formRef`（未來）
- respondent data → **不在 repo**（Google Forms / Sheets / 外部系統）

### 4.3 Blogger / GitHub 發文系統只管理可公開或可發布的 metadata

- 發文系統之資料皆預設可進 public repo（gh-pages 為 public）。
- 任何 sensitive 資料（form owner 帳號、access token、私人 Drive folder ID）皆**不**寫入 registry。
- 即使 registry file 本身為 `content/settings/*.json`（per CLAUDE.md §3.2），**仍須**遵守可公開之原則。

### 4.4 Raw download URL 不應承擔所有語意

- 現行 `download.fileUrl` 僅為**單一 raw URL**；無法承載多檔案、表單流、access level、bundle metadata、preview vs direct download 區分。
- 未來 registry 落地後，`fileUrl` 之地位降為「**legacy / shortcut**」，主要新內容走 `assetRefs[]` / `formRef` / `landingPageRef`。
- 但 raw `fileUrl` **不**強制 deprecate；屬 grandfather 範疇（per §11 migration strategy）。

### 4.5 Future validator 應依 registry 欄位判斷

- 未來 validator 對 download 之深層檢查（如 preview risk、bundle consistency、form-asset linkage）應依**registry entry 之 explicit 欄位**判斷，**不**依 URL regex 猜測 Drive preview/direct。
- 例：preview-url-risk 升級為 registry-based warning 時，validator 只檢查 `DownloadAsset.deliveryMode === 'google-drive-preview'`；不再做 URL pattern parsing。
- 此對齊 night-7 §D.1 之「不走 raw URL regex 路徑」原則。

### 4.6 Draft workflow 允許暫存 share URL

- 草稿期作者可暫填 Drive share URL（per night-7 §E.2 acceptable workflow）。
- `ready` / `published` 階段應有更清楚 gate：未來可在 ready/published 時要求 `assetRefs[]` 非空 OR `download.fileUrl` 符合 direct download URL pattern OR 至少在 docs 內標明 transitional state。
- 此 gate **不**在本 phase 落地；屬未來 source phase。

---

## 5. Entity Boundary Proposal

下表為**草案**；非裁決；屬未來 settings registry schema docs-only decision phase 之輸入。

| Entity | 主要責任 | source of truth | 不應承載 |
|--------|---------|----------------|---------|
| **Post frontmatter** | 文章本身之 metadata（title / slug / date / tags / contentKind / status / publishTargets） | `.md` frontmatter | ❌ 不內嵌完整 DownloadAsset payload；❌ 不內嵌 FormConfig payload；❌ 不存 respondent data |
| **DownloadAsset** | 一個可下載之**檔案 / 檔案組**之 metadata（title / publicUrl / fileFormat / fileCount / isBundle / deliveryMode） | `content/settings/download-assets.json`（未來；本 phase 不建檔） | ❌ 不存 respondent data；❌ 不存 access log；❌ 不存 download count；❌ 不存 form-only flow |
| **FormConfig** | 一個**表單**之公開設定（publicFormUrl / embedUrl / purpose / linkedAssetIds） | `content/settings/forms.json`（未來；本 phase 不建檔） | ❌ 不存 respondent data；❌ 不存 form owner email；❌ 不存 access token；❌ 不存 fields' actual values |
| **DownloadLandingPage** | 文章層之**中繼頁結構**（noindex、嵌入 form、列出 assets、GA4 event） | `.md` frontmatter `contentKind: download` + 新欄位 `landingPageRef` / `assetRefs[]` / `formRef`（未來；本 phase 不擴張 schema） | ❌ 不內嵌完整 asset payload（用 ref）；❌ 不內嵌完整 form payload（用 ref） |
| **External form respondent data** | 表單之**實際填寫內容** | Google Forms / Sheets / 其他外部系統 | ❌ **永不**進 repo（R1） |
| **Runtime / analytics event** | 下載按鈕 click / form submit / asset download 之 GA4 event | GA4 / Google Tag Manager（runtime） | ❌ 不存 PII；❌ 不存 raw URL 之 query string 內 sensitive token |

### 5.1 邊界圖（語意，不為 ER diagram）

```text
Post (.md frontmatter)
  ├─ landingPageRef → DownloadLandingPage（未來；可能與 post 一對一）
  ├─ assetRefs[] → DownloadAsset[]（未來；多對多）
  └─ formRef → FormConfig（未來；一對一或不存在）

DownloadAsset (content/settings/download-assets.json)
  ├─ assetId（unique）
  └─ publicUrl / canonicalDownloadUrl / previewUrl（依 deliveryMode）

FormConfig (content/settings/forms.json)
  ├─ formId（unique）
  ├─ publicFormUrl / embedUrl
  └─ linkedAssetIds[] → DownloadAsset[]（多對多）

External form respondent data ★ 永不進 repo
  ↑ Google Forms / Sheets / 外部系統
```

### 5.2 多對多關係之處置

- DownloadAsset ↔ FormConfig 為**多對多**：
  - 一個 form 可配發多個 asset（如「填完表單寄送 5 個 PDF」）。
  - 一個 asset 可由多個 form 配發（如同一 PDF 在「家長報名表」與「老師索取表」皆配發）。
- Post ↔ DownloadAsset 為**多對多**：
  - 一篇文章可列多個 asset（教具包文章列 10 個 PDF）。
  - 一個 asset 可被多篇文章引用（同一 PDF 在「教具下載」與「節慶教材」皆引用）。
- Post ↔ FormConfig 為**一對一或不存在**：
  - 多數文章無 form gate；有 form gate 之文章一般綁一個 form。
  - **不**設計「一篇文章兩個 form」之 case；若需要，建議拆兩篇文章。

---

## 6. Proposed DownloadAsset Registry Shape

下表為**草案 schema**；非裁決；未來 settings registry schema phase 之輸入。

### 6.1 欄位草案

| 欄位 | 型別 | 必填 | 用途 | future source 可用 | Admin 顯示 | 不應存在 |
|------|------|-----|------|-------------------|----------|---------|
| `assetId` | string（kebab-case；unique） | ✅ | registry primary key；assetRefs[] 之 ref target | ✅ | ✅ | — |
| `title` | string | ✅ | 顯示用標題 | ✅ | ✅ | — |
| `assetType` | enum: `pdf` / `zip` / `jpg` / `png` / `google-drive-folder` / `google-drive-file` / `external-url` | ✅ | 資產類型 | ✅ | ✅ | — |
| `deliveryMode` | enum: `direct-download` / `landing-page` / `google-drive-preview` / `google-drive-share` / `gated-form` / `manual` | ✅ | 配發方式；preview-url-risk 升級後之主判定欄位 | ✅ | ✅ | — |
| `publicUrl` | string（URL） | ✅ | 對外可公開連結（可能為 preview / share / direct，依 deliveryMode） | ✅ | ✅ | — |
| `canonicalDownloadUrl` | string（URL）或 `null` | ❌ | 真正觸發下載之 URL（如有；對 `google-drive-share` 可填 direct download URL 為 canonical） | ✅ | ✅ | — |
| `previewUrl` | string（URL）或 `null` | ❌ | 預覽用 URL（如 Drive `/preview`）；非下載入口 | ✅ | ✅ | — |
| `fileCount` | number（integer ≥ 0） | ❌ | 檔案數（bundle 用） | ✅ | ✅ | — |
| `fileFormat` | string[] | ❌ | 副檔名清單（如 `["pdf", "png"]`） | ✅ | ✅ | — |
| `isBundle` | boolean | ❌ | 是否為打包（ZIP / 多檔組） | ✅ | ✅ | — |
| `accessLevel` | enum: `public` / `form-gated` / `unlisted` / `draft` | ❌ | 可見性；validator / Admin 可作為發布前 gate | ✅ | ✅ | — |
| `owner` | string（free text） | ❌ | 內部記錄（如「我的 Drive」） | ✅ | ✅ | ❌ 不放 email / Google account |
| `status` | enum: `draft` / `ready` / `published` / `archived` | ✅ | 與 post status lifecycle 對齊 | ✅ | ✅ | — |
| `notes` | string | ❌ | 維運備忘 | ✅ | ✅ | ❌ 不放 access token / 私人 Drive folder ID |

### 6.2 哪些欄位 future source 可用

- `assetId` / `title` / `assetType` / `deliveryMode` / `publicUrl` / `canonicalDownloadUrl` / `fileCount` / `fileFormat` / `isBundle` / `accessLevel` / `status`：未來 build / render / validator 皆可讀。
- 對 build：landing page render 可依 `assetType` / `deliveryMode` 決定按鈕 label（「下載 PDF」 vs 「開啟 Drive 預覽」）。
- 對 validator：未來 A1 / A2 / A3 / preview-url-risk 升級皆依此 schema 判斷。

### 6.3 哪些欄位只供 Admin 顯示

- `owner` / `notes`：僅供作者於 Admin UI 內維護；不影響 build / render；不進 dist HTML。
- `previewUrl`：可僅供 Admin 顯示「另存預覽 URL」之輔助欄位；render 端可選擇 fallback 至 `publicUrl`。

### 6.4 哪些欄位不應存在

- ❌ `respondentEmails[]` / `respondentNames[]` / `formResponses[]` —— 屬 R1 紅線。
- ❌ `accessLog[]` / `downloadCount` —— 屬 analytics 範疇；走 GA4 / 外部系統。
- ❌ `userPhone` / `userIp` / `userAgent` —— PII；永不進 repo。
- ❌ `accessToken` / `privateDriveFolderId` —— 秘密；永不進 git。
- ❌ `googleAccountEmail` —— 帳號識別資訊。

---

## 7. Proposed FormConfig Registry Shape

下表為**草案 schema**；非裁決；未來 settings registry schema phase 之輸入。

### 7.1 欄位草案

| 欄位 | 型別 | 必填 | 用途 |
|------|------|-----|------|
| `formId` | string（kebab-case；unique） | ✅ | registry primary key；formRef 之 ref target |
| `title` | string | ✅ | 顯示用標題（如「家長索取注音卡表單」） |
| `provider` | enum: `google-forms` / `custom-landing-page` / `other` | ✅ | 表單後端 |
| `publicFormUrl` | string（URL） | ✅ | 表單之公開填寫頁 URL |
| `embedUrl` | string（URL）或 `null` | ❌ | iframe 嵌入用 URL（如 Google Form 之 `?embedded=true`） |
| `purpose` | string | ✅ | 表單用途說明（如「收集教師索取教具之申請」） |
| `linkedAssetIds` | string[] | ❌ | 對應 DownloadAsset[]；多對多 |
| `requiredFieldsSummary` | string | ❌ | 概述表單會問哪些欄位（**不**列實際使用者答覆；僅 schema 描述） |
| `privacyNote` | string | ❌ | 隱私說明（呈現在 landing page 提示使用者填表前） |
| `status` | enum: `draft` / `ready` / `published` / `archived` | ✅ | lifecycle |
| `notes` | string | ❌ | 維運備忘 |

### 7.2 FormConfig 只存表單公開設定與連結

- ✅ 存：表單之 public URL、embed URL、用途、連結之 asset 清單、隱私說明文字。
- ❌ 不存：
  - 表單之**實際填寫結果**（respondent data） —— Google Forms / Sheets 保管。
  - 表單之 owner 帳號 email / Google account。
  - 表單之 access token / OAuth secret。
  - 表單 field 之預設值或 hidden value（若涉及 utm tracking 內嵌，屬另案）。
- Google Form 回覆資料仍留在 Google Forms / Sheets；BLOG 系統**不**匯入。

### 7.3 `requiredFieldsSummary` 僅描述 schema

- 例（acceptable）：「Email / 姓名 / 學校 / 對教具的回饋」。
- 例（NOT acceptable）：「使用者 A 填寫 a@b.com / 王小明」—— 屬 respondent data。
- 此欄位之目的：讓作者於 landing page 預先告知使用者「會被問哪些欄位」，符合隱私揭露原則。

---

## 8. Proposed DownloadLandingPage Shape

DownloadLandingPage **不**作為獨立 registry entity；而是 post frontmatter 之衍生 view。

### 8.1 設計形狀

DownloadLandingPage 可由 post frontmatter 連接：

- `post`：landing page 之文章本體（`.md` post；`contentKind === 'download'`）。
- `assetRefs[]`：對 DownloadAsset registry 之多筆 reference。
- `formRef`：對 FormConfig registry 之單筆 reference（可選；無 form gate 則為 null / 未設）。
- SEO noindex：landing page render 端強制 `<meta name="robots" content="noindex, follow">`（沿用既有 build-github.js fallback）。
- GA4 event：button click 時送 `click_download_asset`（含 `asset_id` / `delivery_mode` / `placement` 等 params；命名草案見 §12）。
- download button：依 `DownloadAsset.deliveryMode` decide label / target / rel。
- form embed：若 `formRef` 存在 → render iframe embed（或 link）。
- future renderer：屬 P4 / P5 / P6 phase（未來；本 phase 不實作）。

### 8.2 此 phase 不實作 renderer

- ❌ 不新增 `src/views/pages/post-detail-download.ejs` 或類似 partial。
- ❌ 不新增 `src/views/blogger/blogger-post-download-full.ejs`。
- ❌ 不改既有 `src/views/pages/post-detail.ejs`。
- ❌ 不改 `src/scripts/build-github.js` / `build-blogger.js`。
- 本 phase 僅做設計；renderer 之啟動須另開 source phase + user explicit approval。

### 8.3 與 reverse UTM 之關係

- DownloadLandingPage 屬 GitHub Pages-only 候選（per §12 推薦；Blogger 仍以導流文章為主）。
- 若 landing page 內含 GitHub → Blogger / Blogger → GitHub cross-link → 沿用 CLAUDE.md §16.4 既有 reverse UTM 規則；不另立 UTM 規格。
- 本 phase 不解除 pm-26 deploy gate；reverse UTM remains dormant。

---

## 9. Relationship Model

下列三種關聯方式為**候選**；本 phase **不**最終裁決哪一種落地（裁決留待未來 settings registry schema docs-only decision phase）。

### 9.1 Option A：`post.download.fileUrl` only（現狀）

```yaml
download:
  enabled: true
  title: "注音卡 PDF 下載"
  fileUrl: "https://drive.google.com/uc?export=download&id=<id>"
  fileType: "PDF"
```

| 維度 | 評估 |
|------|------|
| 簡單度 | 🟢 極簡；單欄位 |
| 可驗證性 | 🟡 中；D1 / D2 / D3 / S 已 cover syntax；無法 cover 多檔案 / 表單流 / preview risk |
| Admin 管理難度 | 🟢 低；單檔輸入 |
| 多檔案 / ZIP | 🔴 不支援（ZIP 仍只能填一個 URL，無 metadata） |
| Drive 多形式 | 🔴 不區分 preview / share / direct |
| Gated form | 🔴 完全不支援 |
| existing posts migration risk | 🟢 零（無 migration） |
| 推薦 | 🟢 **作為現狀保留**；不主動 deprecate；屬 grandfather 對象 |

### 9.2 Option B：`post.download.assetRefs[]`

```yaml
download:
  enabled: true
  title: "注音卡 PDF 下載"
  assetRefs:
    - phonics-cards-zip-v1
    - phonics-flashcards-pdf-v1
```

| 維度 | 評估 |
|------|------|
| 簡單度 | 🟡 中；需 registry lookup |
| 可驗證性 | 🟢 高；可檢查 ref 存在、deliveryMode 一致、access level 與 post status 對齊 |
| Admin 管理難度 | 🟡 中；需 dropdown / autocomplete 從 registry 選取 |
| 多檔案 / ZIP | 🟢 支援；`assetRefs[]` 可列多個 |
| Drive 多形式 | 🟢 支援；asset 之 `deliveryMode` 明示 |
| Gated form | 🟡 部分；form 需另立 `formRef` 欄位（屬 Option C） |
| existing posts migration risk | 🟡 中；現有 `fileUrl` 文章需逐篇 migrate（或保留為 grandfather） |
| 推薦 | 🟡 **可作為 Option C 之 subset**；單獨採用會缺 form gate |

### 9.3 Option C：`landingPageRef + assetRefs[] + formRef`

```yaml
contentKind: download
download:
  enabled: true
  title: "教師索取注音卡"
  landingPageRef: phonics-teacher-landing-v1   # 可選；對應 landing page id
  assetRefs:
    - phonics-cards-zip-v1
    - phonics-flashcards-pdf-v1
  formRef: phonics-teacher-form-v1
```

| 維度 | 評估 |
|------|------|
| 簡單度 | 🔴 較複雜；三欄位 + registry lookup |
| 可驗證性 | 🟢 最高；可檢查 form-asset linkage / landing page noindex / GA4 event 完整性 |
| Admin 管理難度 | 🔴 較高；需 form selector + multi-asset selector |
| 多檔案 / ZIP | 🟢 完整支援 |
| Drive 多形式 | 🟢 完整支援 |
| Gated form | 🟢 完整支援 |
| existing posts migration risk | 🔴 較高；現有 `fileUrl` 文章需逐篇 migrate（或保留為 grandfather + 新 schema 共存） |
| 推薦 | 🟢 **推薦為長期目標**；短期維持 Option A 為 grandfather；Option C 之子集（B）可作為中繼形態 |

### 9.4 推薦組合

- 短期（next 1–2 phase）：Option A 保留；不主動拆 schema。
- 中期（registry schema docs-only decision phase + fixture-only phase + validator source phase 之後）：Option B / C 共存；新文章採 Option C；既有 `fileUrl` 文章 grandfather。
- 長期（renderer / deploy / Blogger repost 之後）：Option C 為新文章 default；`fileUrl` 仍可用，但不再為唯一形態。

### 9.5 詳細比較表

| 維度 | A `fileUrl` only | B `assetRefs[]` | C `landingPageRef + assetRefs[] + formRef` |
|------|------------------|-----------------|------------------------------------------|
| frontmatter 欄位數 | 1 | 1 | 3 |
| 是否需 registry | ❌ | ✅ | ✅ |
| 多檔案 | ❌ | ✅ | ✅ |
| ZIP | 🟡 單 URL | ✅ | ✅ |
| Drive preview/direct 區分 | ❌ | ✅ | ✅ |
| Gated form | ❌ | ❌ | ✅ |
| landing page noindex | 🟡 build fallback | 🟡 build fallback | ✅ explicit + render contract |
| existing posts migration | 🟢 零 | 🟡 逐篇 migrate（或 grandfather） | 🔴 逐篇 migrate（或 grandfather） |
| 對 preview-url-risk 升級 | ❌ 仍需 raw URL regex | ✅ 走 registry | ✅ 走 registry |
| 推薦 | 🟢 short-term grandfather | 🟡 mid-term subset | 🟢 long-term target |

---

## 10. Future Validation Implications

未來可如何支援（**但本 phase 不新增任何 validation rule**）：

### 10.1 F1 / F2（form-related）

- F1 `download-formref-missing`：若 `download.requireFormGate === true` 但 `download.formRef` 未設 → warning。
- F2 `download-formref-not-found`：若 `download.formRef` 已設但 registry 內無對應 `formId` → warning。
- 前置：FormConfig registry schema 已 docs-accepted + registry JSON 已建檔 + loader 已串接。

### 10.2 A1 / A2 / A3（asset-related）

- A1 `download-assetrefs-invalid-type`：`download.assetRefs` 非 array → warning。
- A2 `download-assetrefs-empty`：若採 Option B / C 且 `assetRefs` 為空陣列（且無 form-only flow）→ warning。
- A3 `download-assetref-not-found`：`assetRefs[i]` 已設但 registry 內無對應 `assetId` → warning。
- 前置：DownloadAsset registry schema 已 docs-accepted + registry JSON 已建檔 + loader 已串接。

### 10.3 preview-url-risk 之 registry-based warning

- 升級條件：DownloadAsset registry 落地。
- 升級後：validator 對 `download.assetRefs[]` 中之 asset 檢查 `deliveryMode === 'google-drive-preview'` → warning。
- 對 raw `download.fileUrl`：**仍不**做 URL regex（per night-7 §D 既定立場）；改提示「未來建議走 registry」。

### 10.4 Noindex requirement for landing page

- 若 `contentKind === 'download'` 且 landing page renderer 已落地 → 強制 `seo.indexing: noindex-follow` 為前提（屬未來 S' rule）。
- 目前由 build-github.js fallback 已 cover；validator 端有 S（merged）已守 frontmatter 顯式宣告。

### 10.5 Ready/published gate

- 若 `status === 'ready'` 或 `'published'` 且 `download.requireFormGate === true` 但 `formRef` 未設 → block 上線（屬 future gate）。
- 若 `status === 'ready'` 或 `'published'` 且 `assetRefs[]` 中任一 asset 之 `accessLevel === 'draft'` → warning。

### 10.6 本 phase 不新增任何 validation rule

- ❌ 不改 `src/scripts/validate-content.js`。
- ❌ 不新增 fixture。
- ❌ 不改 baseline。
- 上述 F / A / preview-risk / noindex gate / ready gate 皆屬**未來** validator source phase 之 input；任一啟動須 user explicit approval。

---

## 11. Migration Strategy

從現有 `download.fileUrl` 過渡到 `assetRefs[]` / `formRef` 之**保守策略**（六階段；每階段獨立 phase + user explicit approval）：

| Phase | 性質 | 範圍 | 預期 baseline |
|-------|------|------|------------|
| **P1** | docs-only | 本 phase；docs-only preanalysis；提出 schema 草案 | 不變 |
| **P2** | docs-only | settings registry schema docs-only decision；裁決 DownloadAsset / FormConfig 欄位字典 + relationship model（B vs C） | 不變 |
| **P3** | fixture-only | 建立 registry JSON sample（`download-assets.json` / `forms.json`）但**無** consumer；無 renderer / validator 接入 | 不變 |
| **P4** | validator source | 新增 F1 / F2 / A1 / A2 / A3 / preview-risk-via-registry warning + fixture | +N warnings / +N posts（estimate later） |
| **P5** | Admin read-only display | Admin 顯示 registry 內容 + post 之 ref 連結；不寫入 | 不變 |
| **P6** | renderer / deploy / Blogger repost / GA4 validation | landing page renderer + build + deploy；需 user explicit approval | 行為層變動；不變 validate baseline |

### 11.1 既有 `fileUrl` 文章之 grandfather 策略

- 既有 `content/blogger/posts/20260529-phonics-practice-sheet-download.md`（唯一 draft download）保持原樣；不強制 migrate。
- 未來新 download 文章採 Option C；既有採 Option A grandfather。
- 即使 Option C 落地，validator 對 raw `fileUrl` 之 D1 / D2 / D3 / S 規則**繼續有效**；不 deprecate。

### 11.2 各 phase 啟動條件

- P2 啟動條件：P1 docs landed + user explicit approval。
- P3 啟動條件：P2 schema decision landed + user explicit approval。
- P4 啟動條件：P3 fixture landed + 至少有 1 個 ready/published 之 fixture 可驗 validator + user explicit approval。
- P5 啟動條件：P4 validator landed + Admin-2 write 系列已落地（per `docs/admin-2-write-pre-analysis.md`）+ user explicit approval。
- P6 啟動條件：P5 Admin landed + reverse UTM pm-26 deploy gate 處置策略確認（不一定要解除；但 P6 涉 Blogger repost / GA4 validation 須與 reverse UTM 之 dormant 狀態協調）+ user explicit approval。

---

## 12. Open Questions

下列為**待裁決**問題；本 phase **不**裁決；屬未來 settings registry schema phase 之輸入。

1. **Asset registry 是否放 `content/settings/`？**
   - 候選 A：`content/settings/download-assets.json` —— 與既有 categories / tags / promotion / ga4 / ads 同層；對齊 CLAUDE.md §3.2 之 settings 集中管理原則。
   - 候選 B：`content/registries/download-assets.json` —— 另立 registry 目錄；與 settings 區分（settings 為全站 config；registry 為 entity registry）。
   - 候選 C：分散於 `content/{site}/assets/` —— 與 post 並列；按 site 拆分。
   - 推薦傾向：**A**（簡單；對齊既有 cadence）；未來如 entity 數量爆增可考慮 B。

2. **Landing page 是否為 GitHub Pages only？**
   - 候選 A：landing page 僅 render 於 GitHub Pages；Blogger 端仍以「導流文章 summary」承擔（per CLAUDE.md §2.1）。
   - 候選 B：Blogger 與 GitHub 皆 render landing page。
   - 推薦傾向：**A**；Blogger 之 AdSense / 既有 SEO 入口角色與 landing page 之 noindex 中繼角色語意衝突。

3. **Blogger 是否只放導流文章？**
   - 候選 A：Blogger download 系列只放 summary + 導流至 GitHub landing page。
   - 候選 B：Blogger 可放 full content + 自身 landing page。
   - 推薦傾向：**A**（與第 2 題 A 配套）。

4. **Google Drive share link 是否允許作為 draft-only？**
   - 候選 A：草稿期允許 share link（per night-7 §E.2 既定立場）；ready/published 須 promote 至 direct download URL 或 registry 之 explicit asset。
   - 候選 B：share link 完全不允許；草稿期亦不允許。
   - 推薦傾向：**A**（與既有 docs 一致；不擴張限制）。

5. **ZIP / multi-PDF 之 canonical 下載 URL 如何表示？**
   - 候選 A：`DownloadAsset.canonicalDownloadUrl` 為 ZIP 之 direct download URL；`assetType: zip`；`fileCount: <N>`；`fileFormat: ["pdf"]`。
   - 候選 B：`assetRefs[]` 列每個 PDF；無 ZIP；render 端動態打包（不可行；無 backend）。
   - 推薦傾向：**A**；BLOG 系統無 runtime 打包能力；ZIP 預先製作上傳。

6. **表單與下載資產是否一對多 / 多對多？**
   - 候選 A：一對多（form → assets）。
   - 候選 B：多對多（form ↔ assets）—— per §5.2 推薦。
   - 推薦傾向：**B**（per §5.2）。

7. **GA4 事件欄位如何命名？**
   - 候選 event names：
     - `click_download_asset`（按下載按鈕）
     - `submit_download_form`（送出 gated form）
     - `view_download_landing`（landing page 載入）
   - 候選 params：
     - `asset_id` / `delivery_mode` / `placement`（top / middle / bottom / inline）
     - `form_id` / `provider`
     - `landing_page_ref`
   - 推薦傾向：與既有 GA4 命名 cadence（per `docs/seo-ga4-adsense.md` / `docs/ga4-link-tracking-spec.md`）對齊；待未來 GA4 schema phase 確認。

8. **是否需要 Admin 管理 registry？**
   - 候選 A：需要；Admin-2 之擴張 phase 提供 DownloadAsset / FormConfig 編輯 UI。
   - 候選 B：不需要；作者直接編輯 JSON。
   - 推薦傾向：**A**（中長期）；但啟動須等 Admin-2 SEO write / FB write 系列穩定後。

---

## 13. Recommendation

### 13.1 下一個最保守 phase 推薦

**推薦：read-only acceptance cross-check**

phase name 候選：`20260601-download-landing-asset-form-registry-preanalysis-acceptance-read-only`

性質：

- 🟢 **read-only**：純驗 baseline + 驗本 docs 內部一致性 + 驗與既有 docs（night-7 / night-3 / am-9 / pm-16 / pm-20）之 boundary 對齊。
- ❌ 不改 source / content / settings / templates / fixture。
- ❌ 不啟動 P2（settings registry schema docs-only decision）。
- ❌ 不啟動任何 validator / fixture / renderer / build / deploy。

理由：

1. 本 phase 為三 entity 之**第一份**整體 preanalysis；落地後須有 read-only acceptance 確認設計邊界內部一致 + 與既有 docs cadence 對齊，避免下一 phase（P2 schema decision）建立在未驗證之設計上。
2. mirror 既有 cadence（am-5 → am-6 / am-7 → am-8 / am-11 / am-13 → am-14 / night-3 → night-4 / night-5 → night-6）：docs-only → acceptance read-only → 下一階段。
3. 與 night-7 §J Recommended Next Step 第 1 項對齊（read-only acceptance）。

### 13.2 不推薦下一步

- ❌ **不推薦**直接 source implementation（registry JSON 建檔 / validator rule / renderer）。
- ❌ **不推薦**直接 fixture creation。
- ❌ **不推薦**跳過 acceptance 直接進 P2 schema decision phase。
- ❌ **不推薦**啟動 Blogger repost / GA4 validation / pm-26 deploy gate 解除。

### 13.3 替代次保守選項

若 user 認為 read-only acceptance 過保守，可考慮：

- **settings registry schema docs-only decision**（即 §11 之 P2）：對 DownloadAsset / FormConfig 欄位字典做 docs-only 裁決（不建 JSON 檔；不改 source）。
- 此選項仍為 docs-only；不啟動 source / fixture / renderer / build / deploy。
- 但 cadence 上跳過 acceptance；風險為：本 phase 之設計若有內部不一致，可能影響 P2 之裁決品質。

→ **首推**仍為 read-only acceptance；P2 schema decision 為**次保守**之 backup。

---

## 14. Explicit Non-Actions

本 phase 明確**未做**：

- ❌ **no source change**：`src/scripts/validate-content.js` / `build-github.js` / `build-blogger.js` / `load-posts.js` / `load-settings.js` 等 source 一行不動。
- ❌ **no content change**：`content/blogger/posts/` / `content/github/posts/` / `content/drafts/` / `content/archive/` 一檔不動。
- ❌ **no settings change**：`content/settings/*.json` 一檔不動。
- ❌ **no templates change**：`content/templates/*.md` 一檔不動。
- ❌ **no package change**：`package.json` / `package-lock.json` / `vite.config.js` 不動；無 `npm install`。
- ❌ **no fixture creation**：`content/validation-fixtures/` 一檔不動。
- ❌ **no registry JSON creation**：不新增 `content/settings/download-assets.json` / `content/settings/forms.json` / `content/registries/*.json`。
- ❌ **no renderer**：不新增 `src/views/pages/post-detail-download.ejs` / `src/views/blogger/blogger-post-download-*.ejs` 等。
- ❌ **no validator rule**：不新增 F1 / F2 / A1 / A2 / A3 / preview-risk-via-registry / landing-page-noindex / ready-gate 等規則。
- ❌ **no build**：不 `npm run build:*`；不 `npm run dev`。
- ❌ **no deploy**：不 push gh-pages；不改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`。
- ❌ **no Blogger repost**：Blogger 後台不動。
- ❌ **no GA4 validation**：不做 GA4 Realtime / DebugView。
- ❌ **no Admin Apply**：Admin Apply 仍 dormant。
- ❌ **no middleware**：不新增 middleware write route；不啟動既有 middleware。
- ❌ **no admin-write-cli dry-run / apply**：`admin-write-cli` 完全不動。
- ❌ **no respondent data import**：Google Forms / Sheets 之 respondent data 完全不進 repo（R1 紅線恪守）。
- ❌ **no reverse UTM activation**：reverse UTM remains **landed but dormant**。
- ❌ **no pm-26 deploy gate unblock**：pm-26 remains **BLOCKED**。
- ❌ **no `download.fileUrl` 與 Google Form URL 混淆**：R2 紅線恪守。
- ❌ **no other SEO pipeline**：R3 紅線恪守。
- ❌ **no am-7 / am-13 / night-5 / night-7 implementation 變更**：D1 / D2 / D3 / S / preview-url-risk policy 全保持 frozen。
- ❌ **no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`**：唯一 git 操作為 add + commit + push（單檔 docs）。
- ❌ **no docs revision**：本 phase 不改既有 docs（night-7 / night-3 / am-9 / am-13 / am-11 / pm-16 / pm-20 / am-5 / am-3 / am-1 等）；僅新增本 phase 之新 docs 檔。

### 14.1 Governance frozen state

- reverse UTM remains **landed but dormant**。
- pm-26 deploy gate remains **BLOCKED**。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守。
- D1 / D2 / D3 / S / preview-url-risk 全保持 frozen；本 phase 不重做、不調整、不退化。

---

（本文件結束）
