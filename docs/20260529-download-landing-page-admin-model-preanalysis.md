# 2026-05-29 Download Landing Page Admin Model Preanalysis

> Phase: `20260529-pm-12-download-landing-page-admin-model-preanalysis-docs-only-a`
> Scope: **docs-only**（無 content / source / template / settings / package / dist / gh-pages 變更）

---

## 1. Phase Summary

- 本 phase 是 **docs-only preanalysis**。
- 目標：固化「教具下載文章 → 內部 noindex 下載頁 → 內嵌 Google Form → Google Drive 檔案」的 **Admin 管理模型與資料邊界**。
- 本 phase **不**建立實際下載頁 content、**不**改 fixture、**不** deploy。
- 本 phase **不**新增 schema / settings / template / source；所有 record model 與欄位皆為**草案 pseudo schema**，僅供未來 source phase 參考。
- 本 phase 延續並深化前一份決策文件（pm-11）對下載流程的結論，聚焦於「Admin 該管什麼、不該管什麼」與「結構化紀錄模型草案」。

---

## 2. Current Baseline

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `4e241de08d1b6ab6c9577ad41e5b09517ba6c781` |
| origin/main | `4e241de08d1b6ab6c9577ad41e5b09517ba6c781` |
| short hash | `4e241de` |
| latest subject | `docs(reverse-utm): record download landing page flow decision` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 error(s) / 42 warning(s) on 37 post(s)** |

Baseline 與預期完全相符（42 warnings 全屬既有 validation-fixtures 之預期警示，非 regression）。

**引用前一份文件：** `docs/20260529-reverse-utm-download-landing-page-flow-decision.md`（pm-11）—— 該文件確立了正確下載流程、SEO noindex 決策、`download.fileUrl` 語意修正、promote-to-ready gates 與 governance。本 phase 在其之上補上 **Admin ownership boundary** 與 **structured record model 草案**。

---

## 3. Confirmed Flow

確認之下載流程（沿用 pm-11 §3，並標註資產類型一般化）：

```text
Search / social / internal traffic
  → article page                          (indexable，SEO 入口)
    → article page download CTA
      → internal download landing page     (noindex，不進 sitemap)
        → download landing page embeds Google Form
          → user submits form
            → user receives / sees Google Drive hosted asset
              → asset = JPG / PDF / ZIP (依素材而定)
```

確認要點：

- **article page download CTA** —— 文章頁的下載入口，導向站內下載頁，不直連 Google Form、不直連檔案。
- **internal download landing page** —— 站內中繼頁，noindex、不進 sitemap。
- **embedded Google Form** —— 下載頁內嵌 Google Form，使用者於此填表。
- **Google Forms / Sheets respondent storage** —— 使用者填表資料留在 Google Forms / Sheets，**不進 repo、不進 Admin 靜態檔案**；僅日後分析時才匯出。
- **Google Drive hosted asset** —— 真正檔案託管於 Google Drive。
- **ZIP when multiple PDFs** —— 若超過 1 個 PDF，包成 ZIP（目前注音卡為 ZIP，內含 3 個 PDF）。
- **JPG / PDF / ZIP asset types all supported as future cases** —— 資產類型須一般化支援：
  - 注音卡（phonics）：目前 **ZIP**（多 PDF）。
  - 數字卡（number cards）：目前暫為 **Google Drive JPG 連結**，未來統一進表單式下載流程。
  - 節慶素材（festival material）：未來可能新增，類型未定。

---

## 4. SEO / Indexing Boundary

- **article page remains indexable** —— 文章頁維持可被搜尋索引，是唯一 SEO 入口。
- **download landing page must be noindex** —— 下載頁必須 noindex（meta robots noindex 機制，非僅 robots.txt disallow；後者只阻抓取、不保證不索引，見 pm-11 §4）。
- **download landing page excluded from sitemap** —— 下載頁不得進入 sitemap。
- **landing page should not become a search entry point** —— 下載頁不應成為搜尋直達入口，以免使用者跳過文章頁、流失文章頁流量與導流脈絡。

---

## 5. Admin Ownership Boundary

### Admin should manage（Admin 應管理）

- landing page **title / slug / display copy**（下載頁標題、slug、顯示文案）。
- **article-to-landing-page CTA target**（文章頁 → 下載頁的 CTA 指向）。
- **Google Form embed URL / public URL / form config**（內嵌表單 URL、公開填寫 URL 與表單設定參照）。
- **asset metadata**（下載資產 metadata：標籤、類型、檔案數量等）。
- **Google Drive delivery link metadata**（Google Drive 交付連結之 metadata / 參照）。
- **noindex / sitemap exclusion flags**（noindex 與 sitemap 排除旗標）。
- **status: draft / ready / archived**（下載頁設定之發布狀態）。

### Admin should NOT manage（Admin 不應管理）

- **respondent records**（填表者個別紀錄）。
- **exported spreadsheet data**（自 Google Sheets 匯出之試算表資料）。
- **user personal information collected by the form**（表單蒐集之使用者個資）。
- **analytics analysis output**（分析輸出結果）。

> 核心邊界：Admin / Blog 系統只管理「下載頁設定 + 表單 embed 設定 + 資產 metadata / link」；**respondent records 永遠留在 Google Forms / Sheets**，不進 repo、不進 Admin 靜態檔案，僅日後分析時才另行匯出。

---

## 6. Proposed Structured Record Model

> ⚠️ 本節為 **草案（draft）**，僅作為未來 source phase 參考。**本 phase 不新增任何 JSON、不落地任何 schema。** 欄位命名為暫定，正式命名須未來 source phase 再定。

### 6.1 Pseudo JSON 草案

```jsonc
{
  "id": "phonics-practice-sheet",          // 穩定識別子（kebab-case）
  "status": "draft",                       // draft / ready / archived
  "slug": "phonics-practice-sheet-download",
  "title": "注音練習卡下載",
  "description": "填寫表單後取得內含 3 份 PDF 的 ZIP 檔。",
  "noindex": true,                         // 下載頁必須 noindex
  "includeInSitemap": false,               // 下載頁不進 sitemap
  "sourceArticleRefs": [                   // 哪些文章的 CTA 指向此下載頁
    "20260529-phonics-practice-sheet-download"
  ],
  "form": {
    "provider": "googleForms",
    "embedUrl": "",                        // Google Form embed URL (placeholder)
    "publicUrl": "",                       // Google Form 公開填寫 URL (placeholder)
    "responseStorageNote": "Responses stored in Google Forms / Sheets only; never imported into repo or Admin static files."
  },
  "assets": [
    {
      "assetId": "phonics-zip",
      "label": "注音練習卡（3 PDF 合輯）",
      "type": "zip",                       // zip / pdf / jpg / folder / other
      "storageProvider": "googleDrive",
      "deliveryMode": "afterFormSubmit",   // afterFormSubmit / manual / external
      "driveUrl": "",                      // or driveFileId placeholder (見 6.3)
      "notes": "ZIP 內含 3 個 PDF。"
    }
  ],
  "updatedAt": "",                         // ISO 日期；本 phase 不填真值
  "adminNotes": "Preanalysis 草案；尚未建立實際下載頁。"
}
```

### 6.2 欄位字典（schema table 草案）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | string | 穩定識別子（kebab-case），不隨 slug / title 變動。 |
| `status` | enum | `draft` / `ready` / `archived`。下載頁設定之發布狀態。 |
| `slug` | string | 下載頁 URL slug。 |
| `title` | string | 下載頁標題。 |
| `description` | string | 下載頁顯示文案 / 摘要。 |
| `noindex` | boolean | 是否 noindex；下載頁固定 `true`。 |
| `includeInSitemap` | boolean | 是否進 sitemap；下載頁固定 `false`。 |
| `sourceArticleRefs` | string[] | 指向此下載頁之文章 id 清單（多對一）。 |
| `form.provider` | enum | 表單供應商，目前 `googleForms`。 |
| `form.embedUrl` | string | Google Form 內嵌 URL（placeholder 政策見 6.3）。 |
| `form.publicUrl` | string | Google Form 公開填寫 URL。 |
| `form.responseStorageNote` | string | 註記：回應只存於 Google Forms / Sheets，不進 repo / Admin。 |
| `assets[]` | object[] | 下載資產清單（見下）。 |
| `assets[].assetId` | string | 資產識別子。 |
| `assets[].label` | string | 資產顯示標籤。 |
| `assets[].type` | enum | `zip` / `pdf` / `jpg` / `folder` / `other`。 |
| `assets[].storageProvider` | enum | 目前 `googleDrive`。 |
| `assets[].deliveryMode` | enum | `afterFormSubmit` / `manual` / `external`。 |
| `assets[].driveUrl` \| `assets[].driveFileId` | string | Google Drive 連結或檔案 ID（placeholder 政策見 6.3）。 |
| `assets[].notes` | string | 資產備註。 |
| `updatedAt` | string (ISO) | 最後更新時間；本 phase 不填真值。 |
| `adminNotes` | string | Admin 內部備註，不對外顯示。 |

### 6.3 driveUrl / driveFileId placeholder 政策（草案）

- 在下載頁實際上線前，`form.embedUrl` / `form.publicUrl` / `assets[].driveUrl` / `assets[].driveFileId` 一律保持 **空字串 placeholder**，**不**填入猜測或假 URL。
- `driveUrl` 與 `driveFileId` 二擇一即可（未來 source phase 決定主鍵）；本 phase 不裁決。
- 真值回填須等到對應 Google Form / Drive 資產實際就緒，並由獨立 source / content phase 處理（對應 §9 候選 F）。

---

## 7. Relation to Existing `download.fileUrl`

- 目前 `download.fileUrl` 之語意需要**重新釐清**（沿用 pm-11 §5 之修正：既非 direct PDF/ZIP URL，亦非 Google Form URL）。
- **短期不要**直接把 `fileUrl` 填成 Google Form。
- 較合理方向是：文章 CTA target 指向 **internal noindex download landing page**（而非直連檔案或表單）。
- 但**正式欄位命名與 renderer 行為需未來 source phase 再決定**（例如是否沿用 `download.fileUrl` 承載下載頁 URL，或改用語意更明確的新欄位如 `landingPageUrl` —— 見 pm-11 §7 Option A vs Option B）。
- **本 phase 不做 schema / source change**；僅記錄語意待釐清狀態。
- 現有 draft fixture `content/blogger/posts/20260529-phonics-practice-sheet-download.md` 之 `download.fileUrl` 維持 **empty**（本 phase 不碰）。

---

## 8. Reverse UTM / pm-26 Gate Impact

- **reverse UTM remains landed but dormant** —— source 已 landed（pm-24a/b/c），但未 deploy、未重貼 Blogger，live 狀態 dormant。
- positive GitHub cross-link fixture 雖已是 **draft**，但 **promotion readiness 仍未完成**。
- **pm-26 deploy gate remains BLOCKED** —— 本 phase **不** unblock deploy gate。
- 本 phase 為 docs-only，對 reverse UTM 與 pm-26 gate **零影響、零變動**。

---

## 9. Future Implementation Candidates

後續可拆 phase（順序為建議流向，非強制）：

| 代號 | 候選 phase | 說明 |
|------|-----------|------|
| **A** | download landing page schema preanalysis acceptance | 接受 / 細化 §6 record model 草案，定稿欄位字典。 |
| **B** | settings-only registry proposal | 提案以 settings-only registry（如 `content/settings/download-pages.json`）集中管理下載頁設定，不動 source。 |
| **C** | template / renderer noindex landing page source preanalysis | 下載頁 template / renderer 與 per-page noindex metadata 之 source preanalysis。 |
| **D** | Admin form fields preanalysis | Admin 端可編輯欄位之 preanalysis（對應 §5 ownership boundary）。 |
| **E** | draft landing page fixture creation | 建立 draft 下載頁 fixture（仍 draft，不上線）。 |
| **F** | real asset / Google Form URL decision | 決定並回填真實 Google Drive 資產 / Google Form URL。 |
| **G** | promote fixture readiness only after gates pass | 僅在 pm-11 §8 gates 全數通過後，才 promote fixture readiness。 |
| **H** | deploy / Blogger repost / GA4 validation | deploy / Blogger repost / GA4 validation 維持獨立、明確、另開之 phase，不混入上述任一。 |

---

## 10. Acceptance Criteria

- [x] 只新增這份 docs 檔案（`docs/20260529-download-landing-page-admin-model-preanalysis.md`）。
- [x] validate:content 維持 **0 errors**。
- [x] working tree clean after commit/push。
- [x] HEAD = origin/main after push。
- [x] no forbidden actions occurred。

---

## 11. Explicit Non-Actions

本 phase 明確未做：

- no source changes
- no content changes
- no settings / templates / package / dist changes
- no npm install
- no build / deploy
- no Blogger repost
- no GA4 validation
- no reverse UTM activation
- no pm-26 gate unblock
- no fixture promotion
- no `download.fileUrl` fill
- no admin-write-cli dry-run / apply
- no Admin Apply enable
- no middleware write route
