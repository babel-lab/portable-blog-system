# 2026-05-29 Reverse UTM Download Landing Page Flow Decision

> Phase: `20260529-pm-11-reverse-utm-download-landing-page-flow-correction-docs-only-a`
> Scope: **docs-only**（無 content / source / template / settings / package / dist / gh-pages 變更）

---

## 1. Executive Summary

本文件修正 pm-9 / pm-10 對 `download.fileUrl` 的產品語意理解，並記錄正確的下載流程設計決策。

- 修正 pm-9 / pm-10 的 `fileUrl` decision。
- 正確流程是：**article CTA → internal download landing page → embedded Google Form → Google Drive ZIP**。
- `download.fileUrl` **不應**直接視為 Google Form URL。
- `download.fileUrl` **也不應**直接視為 PDF / ZIP direct URL。
- 若短期沿用現有欄位，`download.fileUrl` 可指向「站內 noindex 下載頁」。
- Google Form URL 應屬於**下載頁設定**，而非文章層級的 `download.fileUrl`。
- 實際檔案是 Google Drive ZIP，內含 **3 個 PDF**。
- 下載頁**不應收入 Google Search**，避免使用者跳過文章頁直接進入下載頁、流失文章頁流量與上下文。
- reverse UTM remains **landed but dormant**。
- pm-26 deploy gate remains **BLOCKED**。

---

## 2. Baseline

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `6a1f12ccfd2425fa41bc5dd65d17bec9bf6036cb` |
| origin/main | `6a1f12ccfd2425fa41bc5dd65d17bec9bf6036cb` |
| short hash | `6a1f12c` |
| latest subject | `docs(reverse-utm): record download fileurl decision preanalysis` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 error(s) / 42 warning(s) on 37 post(s)** |

Baseline 與預期完全相符。

---

## 3. Correct Download Flow

正確下載流程明確記錄如下：

```text
Search / social / internal traffic
  → article page                          (indexable，SEO 入口)
    → article page download CTA
      → internal download landing page    (noindex，不進 sitemap)
        → download landing page embeds Google Form
          → user submits form
            → user receives or sees Google Drive ZIP download
              → ZIP contains 3 PDFs
```

重點：

- 真正的 SEO 入口是**文章頁**，不是下載頁。
- 下載頁是文章頁之後的一個站內中繼頁（landing page）。
- 下載頁內嵌 Google Form，使用者填表後才取得 / 看到 Google Drive ZIP 下載。
- 實際下載檔是 **ZIP，內含 3 個 PDF**。

---

## 4. SEO Decision

- Article page should be **indexable**。
- Download landing page should be **noindex**。
- Download landing page should **not be included in sitemap**。
- Download landing page should **not be the SEO entry page**。
- Reason: avoid losing article page traffic and context —— 若下載頁可被搜尋直達，使用者可能跳過文章頁，造成文章頁流量與導流脈絡流失。
- **noindex is the intended mechanism**, not simply robots.txt blocking。（robots.txt disallow 只阻止抓取，無法保證不被索引；noindex meta 才是正確機制。）
- Future build / template should support **per-page noindex metadata** for download landing pages。

---

## 5. Field Semantics Correction

記錄舊理解與正確對應：

- **Old interpretation A**: `fileUrl` = direct PDF / ZIP URL → **not accurate** for this flow。
- **Old interpretation B**: `fileUrl` = Google Form URL → **also not accurate**。
- **Correct short-term mapping**: `fileUrl` = internal download landing page URL。

正確的長期建模（long-term modeling，僅記錄、本 phase 不落地）：

文章層級（`download.*`）：

```text
download.deliveryMethod = embedded-google-form
download.landingPageUrl = internal noindex download page
download.fileType       = ZIP
download.fileCount      = 3
download.buttonLabel    = 前往下載頁
download.description    = 填寫表單後取得內含 3 份 PDF 的 ZIP 檔
```

下載頁層級（`downloadPage.*`）：

```text
downloadPage.formEmbedUrl = Google Form embed URL
downloadPage.assetHost    = Google Drive
downloadPage.noindex      = true
downloadPage.sitemap      = false
```

關鍵分離原則：**Google Form URL 屬於下載頁設定（`downloadPage.formEmbedUrl`），不屬於文章 `download.fileUrl`。**

---

## 6. Impact on Current Draft Fixture

對現有 draft fixture 之影響記錄（本 phase 不變更該檔）：

- `content/blogger/posts/20260529-phonics-practice-sheet-download.md` remains **draft**。
- `download.fileUrl` remains **empty**。
- `fileType` should likely become **ZIP** later, not PDF。
- wording should change from **direct PDF download** to **form-gated ZIP download**。
- must **not promote** until the internal download landing page and embedded Google Form decision are **implemented or at least modeled**。
- **no content mutation in this phase**。

---

## 7. Future Implementation Options

| 項目 | Option A | Option B | Option C | Option D |
|------|----------|----------|----------|----------|
| 說明 | 沿用既有 `download.fileUrl` 指向站內 noindex 下載頁 | 新增語意欄位 `landingPageUrl` / `deliveryMethod` / `buttonLabel` / `formEmbedUrl` | 建立獨立的 download landing page content type / template | 保持 fixture draft，直到下載頁模型設計完成 |
| implementation cost | 低（只回填欄位語意） | 中（需擴充 schema / validator / template） | 高（需新 content type、新 template、build pipeline） | 最低（不動程式） |
| schema / template impact | 幾乎無（語意改變，欄位不變） | schema 需新增欄位、template 需讀新欄位 | content-schema 與 build / template 皆需新增 | 無 |
| SEO clarity | 中（fileUrl 隱含指向 noindex 頁，語意不直觀） | 高（landingPageUrl + noindex 明確分離） | 高（下載頁為一級實體，noindex / sitemap 控制清楚） | n/a（尚未實作） |
| risk of misleading users | 中（fileUrl 字面易被誤解為直連檔案） | 低（欄位名稱自我說明） | 低 | 無（未上線） |
| suitability for many future teaching-material downloads | 低（每篇都要手工指向下載頁，難規模化） | 中（欄位齊備，但下載頁仍須各別建立） | 高（可重複套用的下載頁模型，最適合大量教具） | 低（無法規模化） |
| recommendation | 短期過渡可接受 | 中期建模方向 | 長期理想終局 | 設計期最安全 |

**推薦路線（保守、分階段）：**

1. **現在**：採 **Option D** —— fixture 保持 draft，先做 download landing page model 的 preanalysis，不急著回填欄位。
2. **中期**：採 **Option B** —— 在 schema 層加入 `landingPageUrl` / `deliveryMethod` / `formEmbedUrl` / `fileCount` 等語意欄位，並支援 per-page noindex。
3. **長期**：視教具下載數量規模，評估 **Option C** —— 將下載頁升為獨立 content type / template，使大量教具下載可重複套用同一模型。

> Option A 僅作為「真的必須短期上線」時的過渡 fallback，不建議作為終局設計。

---

## 8. Revised Promote-to-Ready Gates

draft → ready 之前須全部滿足（任一未達成即不得 promote）：

- [ ] internal download landing page URL exists（站內 noindex 下載頁已建立並有真實 URL）。
- [ ] download landing page is noindex and excluded from sitemap。
- [ ] Google Form is embedded and publicly usable。
- [ ] form submission path exposes / delivers Google Drive ZIP。
- [ ] ZIP exists and contains the intended **3 PDFs**。
- [ ] article CTA wording says 「前往下載頁」/「填寫表單取得下載」。
- [ ] `fileType` / `description` reflect **ZIP**, not direct PDF。
- [ ] manual click test passes（文章 CTA → 下載頁 → 表單 → ZIP 全鏈路人工點測通過）。
- [ ] only after these should **draft → ready** be considered。

---

## 9. Governance

- reverse UTM remains **landed but dormant**。
- pm-26 deploy gate remains **BLOCKED**。
- draft fixture remains **draft**。
- `download.fileUrl` remains **empty**。
- **no deploy / no Blogger repost / no GA4 validation**。

---

## 10. Explicit Non-Actions

本 phase 明確未做：

- no content changes
- no source / template / settings / package changes
- no build / deploy
- no Blogger repost
- no GA4 validation
- no reverse UTM activation
- no pm-26 gate unblock
- no draft-to-ready
- no `fileUrl` fill
- no fake URL
