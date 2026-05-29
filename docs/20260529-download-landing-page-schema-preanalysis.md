# 2026-05-29 Download Landing Page Schema Preanalysis

> Phase: `20260529-pm-16-download-landing-page-schema-preanalysis-docs-only-a`
> Scope: **docs-only**（無 content / source / template / settings / package / dist / gh-pages 變更）

---

## 1. Phase Summary

- 本 phase 是 **docs-only schema preanalysis**。
- 目標：正式整理「download landing page / form config / asset metadata / article CTA relation / noindex-sitemap flags」之**未來資料模型草案**。
- 本 phase **不**建立實際 schema JSON、**不**改 renderer、**不**改 Admin、**不**新增 landing page。
- 本 phase **不**新增 settings JSON、**不**新增 template、**不**改 source、**不** deploy、**不**建立 fixture。
- 所有 record model 與欄位皆為 **草案 pseudo schema / schema table**，僅供未來 source phase 參考；正式欄位命名一律未定。
- 本 phase 延續並彙整 pm-10 / pm-11 / pm-12 既有決策，並納入 pm-15 read-only finding。

---

## 2. Baseline / Recovery From pm-15 Tool Outage

### 2.1 pm-15 中斷紀錄

- pm-15 因 **Claude Code / Anthropic command safety classifier outage**，未能完成 git baseline verify / `validate:content` / final git status。
- pm-15 之 read-only finding（noindex + sitemap exclusion 已存在於 `post.seo.indexing`）仍有效，已併入本 phase §10。
- pm-15 **未**對 repo 造成任何 drift（outage 發生於 read-only 驗證階段，未進入檔案修改）。

### 2.2 本 phase 重新確認 baseline

本 phase 第一件事即重新驗證 baseline，結果完全相符：

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `5c724d43778f5aa272bdc66346fbec499b585346` |
| origin/main | `5c724d43778f5aa272bdc66346fbec499b585346` |
| short hash | `5c724d4` |
| latest subject | `docs(download): clarify form public url ownership` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 error(s) / 42 warning(s) on 37 post(s)** |

> 42 warnings 全屬 `content/validation-fixtures/`（validator 預期錯誤樣本，by design），非 regression。

---

## 3. Inputs / Existing Decisions

本 phase 引用並彙整以下既有文件與 finding：

| 來源 | 重點 |
|------|------|
| `docs/20260529-download-landing-page-admin-model-preanalysis.md`（pm-12） | Admin ownership boundary；Admin 管 landing page 設定 / form embed / asset metadata，**不**管 respondent records / 個資 / exported spreadsheet；structured record model 草案（§6）。 |
| `docs/20260529-reverse-utm-download-landing-page-flow-decision.md`（pm-11） | 正確下載流程（article CTA → internal noindex landing page → embedded Google Form → Google Drive ZIP）；SEO noindex 決策；`download.fileUrl` 語意修正；promote-to-ready gates；governance。 |
| `docs/20260529-reverse-utm-download-fileurl-decision-preanalysis.md`（pm-10） | `download.fileUrl` 空值為 hard gate；不假造 URL；fileUrl 選項 A–E 比較；維持 draft 為最安全狀態。 |
| pm-15 read-only finding | **noindex + sitemap exclusion 已存在**，透過 `post.seo.indexing` 驅動（`build-github.js` robots meta + `build-sitemap.js` sitemap 排除）；惟目前 scoped to posts，尚無 dedicated download landing page content type。 |

---

## 4. Confirmed Flow

確認之下載流程（彙整 pm-11 §3 / pm-12 §3，資產類型一般化）：

```text
Search / social / internal traffic
  → article page                          (indexable，SEO 入口)
    → article page download CTA
      → internal download landing page     (noindex，不進 sitemap)
        → download landing page embeds Google Form
          → user submits form
            → Google Forms / Sheets respondent storage   (repo / Admin 之外)
              → Google Drive asset delivery
                → asset = ZIP / PDF / JPG / folder / other
```

確認要點：

- **indexable article page** —— 文章頁維持可被搜尋索引，是唯一 SEO 入口。
- **article CTA** —— 文章頁下載入口，導向站內下載頁，不直連 Google Form、不直連檔案。
- **internal noindex download landing page** —— 站內中繼頁，noindex、不進 sitemap，不應成為搜尋直達入口。
- **embedded Google Form** —— 下載頁內嵌 Google Form，使用者於此填表。
- **Google Forms / Sheets respondent storage** —— 填表資料留在 Google Forms / Sheets，不進 repo、不進 Admin 靜態檔。
- **Google Drive asset delivery** —— 真正檔案託管於 Google Drive。
- **asset types：ZIP / PDF / JPG / folder / other** —— 資產類型須一般化支援。

---

## 5. Data Model Concepts

> 本節僅定義概念，**不落地實作**。

| 概念 | 說明 |
|------|------|
| **DownloadLandingPage** | 站內 noindex 下載頁之設定實體；承載 slug / title / display copy / SEO flags / 關聯參照。 |
| **DownloadAsset** | 下載資產 metadata 實體（label / type / storage / delivery mode / file count）。 |
| **DownloadFormConfig** | Google Form 設定實體（embed URL / public URL / 儲存與隱私註記）。 |
| **SourceArticleRef** | 指向 landing page 之文章參照（多對一：多篇文章可共用一個下載頁）。 |
| **CTA relation** | 文章 → 下載頁之 CTA 指向關係（欄位命名未定）。 |
| **SEO / Indexing flags** | noindex / includeInSitemap / canonical 等索引控制旗標。 |
| **Status lifecycle** | `draft` / `ready` / `archived` 之發布狀態流轉。 |

---

## 6. Proposed DownloadLandingPage Record

> ⚠️ **草案**；欄位命名暫定，本 phase 不落地。

### 6.1 Pseudo JSON

```jsonc
{
  "id": "phonics-practice-sheet",          // 穩定識別子（kebab-case），不隨 slug/title 變動
  "status": "draft",                       // draft / ready / archived
  "slug": "phonics-practice-sheet-download",
  "title": "注音練習卡下載",
  "description": "填寫表單後取得內含 3 份 PDF 的 ZIP 檔。",
  "bodyIntro": "",                         // 下載頁正文 / 顯示文案（displayCopy）
  "displayCopy": "",                       // 可與 bodyIntro 合併，命名未定
  "sourceArticleRefs": [                   // 哪些文章 CTA 指向此下載頁（多對一）
    "20260529-phonics-practice-sheet-download"
  ],
  "formRef": "phonics-form",               // → FormConfig.formId（見 §7）
  "assetRefs": [                           // → DownloadAsset.assetId（見 §8）
    "phonics-zip"
  ],
  "seo": {
    "indexing": "noindex-follow"           // reuse 現有 post.seo.indexing 語彙（見 §10）
  },
  "noindex": true,                         // 下載頁固定 true
  "includeInSitemap": false,               // 下載頁固定 false
  "canonical": "auto",                     // canonical 策略；auto / explicit URL
  "updatedAt": "",                         // ISO 日期；本 phase 不填真值
  "adminNotes": "Preanalysis 草案；尚未建立實際下載頁。"
}
```

### 6.2 欄位字典

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | string | 穩定識別子（kebab-case）。 |
| `status` | enum | `draft` / `ready` / `archived`。 |
| `slug` | string | 下載頁 URL slug。 |
| `title` | string | 下載頁標題。 |
| `description` | string | 下載頁摘要。 |
| `bodyIntro` / `displayCopy` | string | 下載頁顯示文案；二者是否合併由未來 source phase 決定。 |
| `sourceArticleRefs` | string[] | 指向此下載頁之文章 id 清單（多對一）。 |
| `formRef` | string | 關聯 FormConfig（`formId`）。 |
| `assetRefs` | string[] | 關聯 DownloadAsset（`assetId`）清單。 |
| `seo.indexing` | enum | 沿用現有 `post.seo.indexing` 語彙（`index` / `noindex-follow` / `noindex-nofollow`）。 |
| `noindex` | boolean | 下載頁固定 `true`（與 `seo.indexing` 一致性由 validation 把關）。 |
| `includeInSitemap` | boolean | 下載頁固定 `false`。 |
| `canonical` | string | canonical 策略（`auto` 或顯式 URL）。 |
| `updatedAt` | string (ISO) | 最後更新；本 phase 不填真值。 |
| `adminNotes` | string | Admin 內部備註，不對外顯示。 |

> 註：`seo.indexing` 與 `noindex` 並存為「過渡相容」設計選項 —— 若未來統一沿用 `post.seo.indexing` 機制（§10 推薦），可只保留 `seo.indexing`，`noindex` 視為衍生值。最終取捨留待 source phase。

---

## 7. Proposed FormConfig Record

> ⚠️ **草案**；欄位命名暫定，本 phase 不落地。

### 7.1 Pseudo JSON

```jsonc
{
  "formId": "phonics-form",
  "provider": "googleForms",
  "embedUrl": "",                          // Google Form embed URL (placeholder)
  "publicUrl": "",                         // Google Form 公開填寫 URL (placeholder)
  "responseStorageNote": "Responses stored in Google Forms / Sheets only; never imported into repo or Admin static files.",
  "ownerNote": "Form 由站方（Admin）擁有；public URL 為站方 form，非第三方。",
  "privacyNote": "表單蒐集之使用者個資不進 repo / Admin；隱私處理屬 Google Forms 平台層。",
  "status": "draft",                       // draft / ready / archived
  "updatedAt": "",
  "adminNotes": "Preanalysis 草案；URL 待真實表單就緒回填。"
}
```

### 7.2 欄位字典

| 欄位 | 型別 | 說明 |
|------|------|------|
| `formId` | string | 表單識別子，被 `DownloadLandingPage.formRef` 參照。 |
| `provider` | enum | 目前 `googleForms`。 |
| `embedUrl` | string | Google Form 內嵌 URL（placeholder 政策：上線前保持空字串，不填假 URL）。 |
| `publicUrl` | string | Google Form 公開填寫 URL（站方擁有；見 ownerNote）。 |
| `responseStorageNote` | string | 回應只存於 Google Forms / Sheets。 |
| `ownerNote` | string | public URL 為站方 form 之所有權註記。 |
| `privacyNote` | string | 使用者個資不進 repo / Admin。 |
| `status` | enum | `draft` / `ready` / `archived`。 |
| `updatedAt` | string (ISO) | 最後更新；本 phase 不填真值。 |
| `adminNotes` | string | Admin 內部備註。 |

### 7.3 資料邊界（明確）

- **respondent records 不進 repo。**
- **exported spreadsheet 不進 repo。**
- **使用者個資不進 Admin 靜態檔。**
- **分析資料未來若匯出，也是 repo / Admin 之外的作業**（一次性匯出 + 離線分析，不回流系統靜態檔）。

---

## 8. Proposed DownloadAsset Record

> ⚠️ **草案**；欄位命名暫定，本 phase 不落地。

### 8.1 Pseudo JSON

```jsonc
{
  "assetId": "phonics-zip",
  "label": "注音練習卡（3 PDF 合輯）",
  "type": "zip",                           // zip / pdf / jpg / folder / other
  "storageProvider": "googleDrive",
  "driveFileId": "",                       // 或 driveUrl；二擇一（placeholder 政策見 8.3）
  "driveUrl": "",
  "deliveryMode": "afterFormSubmit",       // afterFormSubmit / manual / external
  "fileCount": 3,
  "fileFormatNotes": "ZIP 內含 3 個 PDF。",
  "status": "draft",                       // draft / ready / archived
  "updatedAt": "",
  "adminNotes": "Preanalysis 草案。"
}
```

### 8.2 欄位字典

| 欄位 | 型別 | 說明 |
|------|------|------|
| `assetId` | string | 資產識別子，被 `DownloadLandingPage.assetRefs[]` 參照。 |
| `label` | string | 資產顯示標籤。 |
| `type` | enum | `zip` / `pdf` / `jpg` / `folder` / `other`。 |
| `storageProvider` | enum | 目前 `googleDrive`。 |
| `driveFileId` \| `driveUrl` | string | Google Drive 檔案 ID 或連結（placeholder 政策見 8.3；主鍵由 source phase 決定）。 |
| `deliveryMode` | enum | `afterFormSubmit` / `manual` / `external`。 |
| `fileCount` | number | 檔案數量（如 ZIP 內 PDF 數）。 |
| `fileFormatNotes` | string | 檔案格式備註。 |
| `status` | enum | `draft` / `ready` / `archived`。 |
| `updatedAt` | string (ISO) | 最後更新；本 phase 不填真值。 |
| `adminNotes` | string | Admin 內部備註。 |

### 8.3 placeholder 政策

- 上線前，`driveFileId` / `driveUrl`（及 §7 之 `embedUrl` / `publicUrl`）一律保持 **空字串 placeholder**，**不**填猜測或假 URL。
- `driveFileId` 與 `driveUrl` 二擇一即可；本 phase 不裁決主鍵。
- 真值回填須等對應 Google Form / Drive 資產實際就緒，由獨立 source / content phase 處理。

### 8.4 資產類型現況與未來

- **多 PDF 可包 ZIP** —— 超過 1 個 PDF 時打包為 ZIP。
- **注音卡（phonics）目前是 ZIP** —— 內含 3 個 PDF。
- **數字卡（number cards）目前可能暫有 JPG links** —— 暫為 Google Drive JPG 連結，但**未來應統一進 landing page + form flow**。
- **未來可支援節慶素材（festival material）** —— 類型未定，沿用同一資產模型。

---

## 9. Article CTA Relation

說明 article 如何指向 download landing page，並保留既有決策：

- **不把 article `download.fileUrl` 直接填成 Google Form URL**（沿用 pm-11 §5 / pm-10）。Google Form URL 屬下載頁設定（`FormConfig`），非文章層級欄位。
- **`download.fileUrl` 語意仍待未來 source phase 釐清** —— 既非 direct PDF/ZIP URL，亦非 Google Form URL。
- **較合理方向是 article CTA target 指向 internal noindex download landing page**，而非直連檔案或表單。
- **正式欄位命名未定**，候選包括：
  - `download.landingPageRef`（指向 `DownloadLandingPage.id`）
  - `download.ctaTarget`（指向下載頁 URL / ref）
  - 沿用 `download.fileUrl` 承載下載頁 URL（過渡 fallback，語意不直觀）
  - 透過 `relatedLinks` 之 `kind: internal` 指向下載頁
- 最終命名與 renderer 行為留待未來 source phase 決定；本 phase 僅記錄選項。

---

## 10. SEO / Sitemap / Renderer Implications

整理 pm-15 finding（本 phase read-only 已複驗，2026-05-29）：

- **`post.seo.indexing` 已存在** —— 驅動索引控制之單一來源。
- **`build-github.js` 已有 robots meta 能力** —— `post.seo.indexing` → `seo.robots`（`index, follow` / `noindex, follow` / `noindex, nofollow`），見 `build-github.js` ~L290–307；design-system / 404 已硬編 `noindex, nofollow`（L441）。
- **`build-sitemap.js` 已有 noindex exclusion 能力** —— `seo.indexing === 'noindex-follow' | 'noindex-nofollow'` 之 post 直接 `continue` 排除出 sitemap，見 `build-sitemap.js` ~L123–130；`robots.txt` 亦封鎖 `/design-system/` 與 `/404.html`。
- 規則出處：`docs/seo-indexing-rules.md` §3 / §6 SEO-2。
- **但目前 scoped to posts** —— 上述機制讀的是 post frontmatter `seo.indexing`；**尚無 dedicated download landing page content type**，下載頁實體尚未納入此 pipeline。

**渲染含意（建議，非實作）：**

- 未來 source phase 應**優先 reuse 現有 noindex / sitemap exclusion pattern**（即沿用 `seo.indexing` 語彙 + build-github / build-sitemap 既有分支），**不要另造一套**獨立的 noindex 機制。
- 若 download landing page 成為獨立 content type，應讓其 record 之 `seo.indexing`（§6）能接入既有 build pipeline，使 noindex meta 與 sitemap 排除自動生效。

---

## 11. Settings Registry Options

> 僅討論選項，**不新增任何檔案**。

| 選項 | 說明 | Pros | Cons | Risk |
|------|------|------|------|------|
| **A** | `content/settings/download-pages.json`（單一 registry 集中所有下載頁設定） | 集中、易盤點、單檔即全貌；與既有 settings JSON 模式一致 | 表單 / 資產與頁面混在一檔，檔案可能膨脹 | 🟡 中：欄位耦合，schema 變更牽動整檔 |
| **B** | `content/settings/download-assets.json` + `forms.json`（資產 / 表單 / 頁面分檔） | 關注點分離；資產 / 表單可獨立複用、跨頁共享 | 多檔交叉參照（ref 解析）；維護面增加 | 🟡 中：ref 不一致風險（assetRefs / formRef 對不上） |
| **C** | landing page as content post/page（以 frontmatter 承載） | 直接 reuse 既有 content pipeline 與 `seo.indexing`（§10）；天然吃 noindex / sitemap | 下載頁與一般文章混在 content 樹；表單 / 資產 metadata 塞 frontmatter 較笨重 | 🟡 中：content 與「純設定」界線模糊 |
| **D** | hybrid（registry 管 form/asset metadata + content markdown 管頁面正文） | 兼顧 §10 reuse 與關注點分離；正文走 content、結構化 metadata 走 settings | 兩處來源需同步；實作最複雜 | 🔴 較高：雙來源一致性最難維護 |

> 本 phase **不做最終實作承諾**；上表僅供未來 settings registry preanalysis（§15 候選 B）細評。傾向觀察：若重視「reuse 現有 noindex/sitemap pipeline」（§10），Option C / D 在 SEO 串接上較自然；若重視「純設定集中管理」，Option A 最單純。

---

## 12. Admin Implications

記錄未來 Admin 可能需管理之項目（沿用 pm-12 §5 ownership boundary）：

Admin **應**管理：

- landing page metadata（slug / title / display copy / status）
- form embed URL / public URL / config（`FormConfig`）
- asset metadata（label / type / storage / delivery mode / file count）
- article CTA relation（文章 → 下載頁指向）
- noindex / sitemap flags

Admin **不**管理（沿用 pm-12 §5）：

- respondent records / exported spreadsheet / 使用者個資 / analytics 輸出（永遠留在 Google Forms / Sheets，repo / Admin 之外）。

目前狀態（明確）：

- **Admin Apply 不啟用。**
- **middleware write route 不啟用。**
- **admin-write-cli dry-run / apply 不執行。**
- 以上僅為未來 Admin fields preanalysis（§15 候選 D）之預備記錄，非本 phase 實作。

---

## 13. Validation / Readiness Gates（草擬，不改 validator）

> 僅草擬未來需要之 validation 規則；**本 phase 不改 `validate-content.js`**。

ready 之 download landing page 應滿足：

- ready landing page **must have** `slug` / `title` / `formRef` / `assetRefs`（非空）。
- `noindex` **must be true** for download landing pages。
- `includeInSitemap` **must be false**。
- form `publicUrl` / `embedUrl` **must be non-empty only when status === ready**（draft 階段允許空 placeholder）。
- asset `storageProvider` / `type` / `deliveryMode` 必須為合法 enum 值。
- source article relation checks：`sourceArticleRefs[]` 之每個 id 應對應實際存在文章；article CTA target（若採 ref 形式）應對應實際存在之 landing page。
- `formRef` / `assetRefs[]` 之 ref 必須能在對應 registry 解析到實體（避免 dangling ref）。

> 上述規則之嚴重度（error vs warning）、實作位置與精確訊息留待未來 validation rules preanalysis（§15 候選 E）。

---

## 14. Reverse UTM / pm-26 Gate Impact

- **reverse UTM remains landed but dormant** —— source 已 landed（pm-24a/b/c），未 deploy、未重貼 Blogger，live 狀態 dormant。
- **pm-26 deploy gate remains BLOCKED** —— 本 phase **不** unblock。
- 本 phase **不建立 positive fixture、不 promotion、不 deploy**。
- **download landing page schema planning ≠ deploy readiness** —— 本批為純資料模型草案，與 deploy / reverse UTM activation 完全脫鉤。
- 本 phase 為 docs-only，對 reverse UTM 與 pm-26 gate **零影響、零變動**。

---

## 15. Future Phase Candidates

> 後續可拆批（順序為建議流向，非強制）；任一候選之啟動皆須**獨立 phase + 該次 user explicit approval**。

| 代號 | 候選 phase | 性質 |
|------|-----------|------|
| **A** | schema preanalysis acceptance | read-only：接受 / 細化本文件 §6–§8 record model 草案。 |
| **B** | settings registry preanalysis | docs-only：細評 §11 registry 選項，選定方向。 |
| **C** | renderer / noindex source preanalysis | docs-only：下載頁 template / renderer 與 per-page noindex 之 source preanalysis（對齊 §10 reuse 原則）。 |
| **D** | Admin fields preanalysis | docs-only：Admin 可編輯欄位之 preanalysis（對應 §12）。 |
| **E** | validation rules preanalysis | docs-only：細化 §13 validation 規則。 |
| **F** | actual settings / content fixture creation | **僅在 explicit approval 後**才建立實際 settings / content fixture。 |
| **G** | build / deploy / Blogger repost / GA4 validation | 獨立、明確、另開之 phase，不混入上述任一；完成後始評估 pm-26 gate。 |

---

## 16. Acceptance Criteria

- [x] 只新增一份 docs 檔案（`docs/20260529-download-landing-page-schema-preanalysis.md`）。
- [x] validate:content 維持 **0 errors**。
- [x] working tree clean after commit/push。
- [x] HEAD = origin/main after push。
- [x] ahead / behind = 0 / 0。
- [x] no forbidden actions occurred。

---

## 17. Explicit Non-Actions

本 phase 明確未做：

- no source changes
- no content changes
- no settings / templates / package / dist changes
- no npm install
- no build / deploy
- no Blogger repost
- no GA4 validation
- no fixture creation / promotion
- no `download.fileUrl` fill
- no reverse UTM activation
- no pm-26 gate unblock
- no admin-write-cli dry-run / apply
- no Admin Apply enable
- no middleware route

本檔落地後 production state drift = 0；屬純 docs entry。

---

（本文件結束）
