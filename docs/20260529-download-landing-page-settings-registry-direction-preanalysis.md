# Download Landing Page Settings Registry Direction Preanalysis — 2026-05-29

> Phase: `20260529-pm-20-download-landing-page-settings-registry-direction-preanalysis-docs-only-a`
> Scope: **docs-only**（無 source / content / settings / templates / package / dist / gh-pages 變更）

---

## 1. Phase Scope

本 phase 是 **docs-only preanalysis**，延續：

- `docs/20260529-download-landing-page-schema-preanalysis.md`（pm-16；schema record model 草案 + §11 registry 選項 A–D）
- `docs/20260529-download-landing-page-admin-model-preanalysis.md`（pm-12 + pm-18 supersession appendix；admin ownership boundary）

本 phase **唯一產出**：一份方向性文件，評估「download landing page / form config / download asset」未來 settings / data registry 應如何設計，用以決定**未來實作前** registry 的形狀與檔案邊界。

本 phase **明確不做**（詳 §16 / §19）：

- ❌ 不建立任何 settings JSON
- ❌ 不建立 landing page content
- ❌ 不修改 renderer / template / source / Admin UI
- ❌ 不碰既有 content / settings / templates / package / dist / gh-pages
- ❌ 不建立 fixture、不 draft-to-ready、不填 `download.fileUrl`
- ❌ 不啟動 reverse UTM、不解除 pm-26 deploy gate、不 build / deploy / Blogger repost / GA4 validation

所有 record shape、欄位命名、檔案路徑皆為 **proposal only / 草案**，正式命名一律未定，留待未來獨立 source phase（須該次 user explicit approval）。

---

## 2. Current Baseline

本 phase 第一件事即重新驗證 baseline，結果完全相符：

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `0e1807946c646c061a0b4e3310907f00354b6520` |
| origin/main | `0e1807946c646c061a0b4e3310907f00354b6520` |
| short hash | `0e18079` |
| latest subject | `docs(download): clarify landing page schema supersession` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 error(s) / 42 warning(s) on 37 post(s)** |

> 42 warnings 全屬 `content/validation-fixtures/`（validator 預期錯誤樣本，by design），非 regression。

### 2.1 目前狀態（明確）

- **Download landing page 目前仍只有 docs / preanalysis。**
- **尚無 source implementation。**
- **尚無 settings JSON。**
- **尚無 renderer。**
- **尚無 Admin UI 實作。**
- **尚無真正 landing page content。**
- **DownloadLandingPage / FormConfig / DownloadAsset 仍是設計方向，不是已落地 schema。**

唯一已存在之相關物件：

- 一篇 **draft fixture**：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`（`contentKind: download` / `status: draft` / `draft: true`；`download.fileUrl` 仍空；含一筆指向 GitHub 技術筆記之 `relatedLinks` internal cross-link）。本 phase **只讀、不碰**（詳 §10.3）。
- 一個模板：`content/templates/blogger-download-template.md`（未被 `build:*` 掃描）。

---

## 3. Inputs Reviewed

| 來源 | 角色 | 重點 |
|------|------|------|
| `docs/20260529-download-landing-page-schema-preanalysis.md`（pm-16）| **資料結構方向來源** | normalized model（DownloadLandingPage + `formRef` + `assetRefs[]` + FormConfig + DownloadAsset）；§11 registry 選項 A–D；§10 SEO reuse 原則。 |
| `docs/20260529-download-landing-page-admin-model-preanalysis.md`（pm-12 + pm-18 appendix）| **管理脈絡來源** | §5 Admin ownership boundary；pm-18 appendix 確認以 pm-16 normalized 方向為準，pm-12 embedded shape 不再視為最終結構。 |
| `docs/phase-2-candidate-roadmap.md` | roadmap 定位 | download landing page 系列屬 Phase 2 候選；任一啟動須 user 明示；reverse UTM dormant / pm-26 blocked 狀態。 |
| `docs/README.md` | docs 入口 | §2 已完成能力（SEO indexing 控制 / `seo.indexing` / sitemap 排除已存在）；§5 不可做操作。 |
| `docs/20260529-reverse-utm-fixture-candidate-preanalysis.md`（輔助）| fixture 脈絡 | Pairing 1 候選（Blogger download draft → GitHub note reuse）；relatedLinks `sourceKey: github` 設計；fixture 為 draft、`url` 真實回填待未來 phase。 |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md`（輔助）| reference fixture | draft download 文章；`download.fileUrl` 空；relatedLinks github cross-link 已存在。 |
| `docs/admin-2-write-pre-analysis.md`（輔助）| Admin write governance | allowed write scope 保守（`download.*` / relatedLinks 皆在禁止清單）；Admin Apply 不啟用；CLI dormant；reverse UTM dormant；pm-26 blocked。 |

> 所有檔案皆存在；無 not-found。

---

## 4. Problem Statement

未來若要實作 download landing page，系統需要一個地方存放**結構化下載設定**：

1. **landing page 設定**：slug / title / display copy / status / SEO flags。
2. **form config metadata**：Google Form embed URL / public URL / provider / 隱私與所有權註記。
3. **download asset metadata**：label / type（zip/pdf/jpg/folder/other）/ storage provider / delivery mode / file count。
4. **article → landing page 之 CTA / reference 關係**。

核心待決問題：**這些結構化設定該放哪裡？** 候選空間為「集中式 settings JSON」「分檔式 settings JSON」「content post frontmatter 內嵌」「hybrid」。本文件之任務即評估此空間、選出建議方向、並提出未來檔案邊界 proposal。

附帶必須守住之三條紅線（貫穿全文）：

- **R1：使用者填表資料留在 Google Forms / Google Sheets，不進 repo，也不進 Admin static files。**
- **R2：`download.fileUrl` 代表實際下載資產 URL，不是 Google Form 表單 URL；兩者不可混為一談。**
- **R3：未來 download landing page 應 reuse 既有 noindex / sitemap pipeline，不另開一套 SEO 機制。**

---

## 5. Data Ownership Boundaries

沿用 pm-12 §5 / pm-16 §7.3 之 ownership boundary，於 registry 設計語境下再固化：

### 5.1 Blog repo / Admin **可以**管理

- landing page 設定（slug / title / display copy / status）
- form config metadata（embed URL / public URL / provider；**URL 本身為站方自有 form 之指標，非 respondent data**）
- download asset metadata（label / type / storage provider / delivery mode / file count / drive file id 或 url）
- article CTA / related link / download landing page references（文章 → 下載頁指向）
- SEO / noindex / sitemap exclusion 設定

### 5.2 Blog repo / Admin **不**管理

- 使用者填表資料（form submissions）
- Google Form respondent records
- Google Sheets 回覆資料
- 個資 / analytics 分析資料

### 5.3 紅線（明確）

> **使用者填表資料留在 Google Forms / Google Sheets，不進 repo，也不進 Admin static files。** 若未來需要分析回覆，屬 repo / Admin 之外的一次性離線匯出作業，不回流任何 registry 檔。

此邊界對 registry 設計之直接含意：**registry 只存「設定與 metadata」，永不存「回覆與個資」**；任何選項若使其更容易誤把 respondent data 放進 repo，即視為扣分項（詳 §7）。

---

## 6. Candidate Registry Options

> 本節依 **pm-16 §11 原始 A–D 命名**整理（忠實沿用，不自行假造）。pm-16 §11 原文之選項如下，本節補上 registry-direction 語境之展開。

| 代號 | pm-16 §11 原始定義 | 對應一般化方向 |
|------|-------------------|----------------|
| **A** | `content/settings/download-pages.json`（單一 registry 集中所有下載頁設定）| **集中式 registry** |
| **B** | `content/settings/download-assets.json` + `forms.json`（資產 / 表單 / 頁面分檔）| **分檔式 registry** |
| **C** | landing page as content post/page（以 frontmatter 承載）| **content post frontmatter 內嵌** |
| **D** | hybrid（registry 管 form/asset metadata + content markdown 管頁面正文）| **hybrid approach** |

### 6.1 Option A — 集中式 registry

單一檔（如 `content/settings/download-pages.json`）集中所有下載頁設定，form / asset metadata 一併內嵌於同檔之 record（或巢狀於各 landing page entry）。與既有 settings JSON 模式（categories / tags / ads.config 等）一致。

### 6.2 Option B — 分檔式 registry

關注點分離為多檔：landing pages / forms / assets 各自一檔（如 `download-landing-pages.json` + `download-forms.json` + `download-assets.json`），彼此以 ref（`formRef` / `assetRefs[]`）交叉參照。對齊 pm-16 normalized model。

### 6.3 Option C — content post frontmatter 內嵌

下載頁本身即一篇 content post / page，slug / title / body / SEO flags / form / asset metadata 全塞 frontmatter。直接 reuse 既有 content pipeline 與 `seo.indexing`（§13）。

### 6.4 Option D — hybrid approach

landing page **正文與 SEO flags** 走 content（reuse §13 noindex / sitemap pipeline），**結構化 form / asset metadata** 走 settings registry（split 檔，被 content frontmatter 以 ref 參照）。兼顧 §13 reuse 與關注點分離。

---

## 7. Option Comparison

每個 option 依以下九維度評估：優點 / 缺點 / validation 難度 / Admin 編輯難度 / 未來擴充性 / 是否易誤放 respondent data / 是否易與 `download.fileUrl` 混淆 / 是否影響 build/deploy / 是否適合目前階段。

### 7.1 Option A — 集中式 registry

| 維度 | 評估 |
|------|------|
| 優點 | 單檔即全貌；易盤點；與既有 settings JSON 模式一致；新增一個 settings 檔即可，source 改動面小。 |
| 缺點 | 頁面 / 表單 / 資產混在一檔，檔案隨下載頁增加而膨脹；form / asset 無法跨頁乾淨複用；schema 變更牽動整檔。 |
| validation 難度 | 🟡 中：單檔好讀，但巢狀結構深，error path 指引較長；enum / 必填檢查集中於一處。 |
| Admin 編輯難度 | 🟡 中：單檔好定位，但巨大 nested object 不利逐欄編輯；array-of-object 寫入屬高複雜度（per `admin-2-write-pre-analysis.md` §729 不適合作基礎設施驗證載體）。 |
| 未來擴充性 | 🟡 中：新增資產類型容易；但跨頁複用 form/asset 需複製貼上，DRY 較差。 |
| 易誤放 respondent data？ | 🟢 低：settings 檔語境清楚為「設定」；只要 §5 紅線寫進 schema doc，誤放風險低。 |
| 易與 `download.fileUrl` 混淆？ | 🟡 中：asset 之 driveUrl 與文章 `download.fileUrl` 同檔域外但語意鄰近；需 §12 明確區隔。 |
| 影響 build/deploy？ | 🟢 低（純設定，無 consumer 即無 dist 影響）；一旦接 renderer 才有影響。 |
| 適合目前階段？ | 🟡 部分：若只重「集中管理」最單純；但與 §13 SEO reuse 串接不自然（settings 檔不在 content pipeline）。 |

### 7.2 Option B — 分檔式 registry

| 維度 | 評估 |
|------|------|
| 優點 | 關注點分離；form / asset 可獨立複用、跨頁共享；對齊 pm-16 normalized model；單檔變更影響面小。 |
| 缺點 | 多檔交叉參照（ref 解析）；維護面增加；ref 不一致風險（assetRefs / formRef 對不上 → dangling ref）。 |
| validation 難度 | 🔴 較高：需跨檔 ref resolution 檢查（dangling ref / orphan asset / orphan form）；錯誤訊息須指明「哪個 page 的哪個 ref 解不到」。 |
| Admin 編輯難度 | 🔴 較高：編輯一個下載頁需同時碰 3 檔；selector UI 需先載入 forms / assets registry 供選；array-of-object + registry lookup 屬最高 write 複雜度。 |
| 未來擴充性 | 🟢 高：新增 asset / form 不動 landing page；多頁共用同一 asset / form 乾淨。 |
| 易誤放 respondent data？ | 🟢 低：與 A 同，settings 語境清楚。 |
| 易與 `download.fileUrl` 混淆？ | 🟡 中：`download-assets.json` 之 driveUrl 與 `download-forms.json` 之 publicUrl 並存，反而**有助**釐清「asset URL ≠ form URL」（兩檔分離強化語意），但需 §12 文件把關不要把 form publicUrl 填進 article `download.fileUrl`。 |
| 影響 build/deploy？ | 🟢 低（無 consumer 前）；接 renderer 後須驗 byte-identical-modulo-builtAt。 |
| 適合目前階段？ | 🟡 部分：結構最乾淨，但實作 / validation / Admin 成本最高；對「現階段只做方向文件、未來最小落地」而言，一次到位 B 略重。 |

### 7.3 Option C — content post frontmatter 內嵌

| 維度 | 評估 |
|------|------|
| 優點 | 直接 reuse 既有 content pipeline 與 `seo.indexing`（§13）；天然吃 noindex / sitemap 排除；無需新增 settings 檔、無需新 consumer；reuse 既有 frontmatter validation。 |
| 缺點 | 下載頁與一般文章混在 content 樹；form / asset metadata 塞 frontmatter 較笨重；跨頁複用 form/asset 困難（每頁各自抄）。 |
| validation 難度 | 🟢 較低：reuse 既有 `validate-content.js` frontmatter 規則框架；新增規則屬 additive（mirror 既有 download.* / seo.indexing 檢查 pattern）。 |
| Admin 編輯難度 | 🟡 中：reuse 既有 .md frontmatter 編輯路徑，但 form / asset 為 nested object，仍非單一 string；與既有 `download.*` 同屬高 schema 複雜度欄位（per `admin-2-write-pre-analysis.md` §119 / §914 禁寫清單）。 |
| 未來擴充性 | 🟡 中：新增下載頁 = 新增一篇 content；但 form/asset 無 registry 複用，DRY 差；多種下載素材（注音 / 數字 / 節慶）各自重複 metadata。 |
| 易誤放 respondent data？ | 🟢 低：content frontmatter 語境為「文章設定」；respondent data 本就無欄位可放。 |
| 易與 `download.fileUrl` 混淆？ | 🔴 較高：既有 `download.fileUrl` 就在同一 frontmatter；若 form embed/public URL 也塞 frontmatter，極易誤把 form URL 填進 `download.fileUrl`（正是 pm-10 / pm-11 已警示之坑）。 |
| 影響 build/deploy？ | 🟡 中：下載頁直接進 content pipeline，**一落地即影響 build / sitemap**（不像 settings registry 可先 dormant）；須嚴格 noindex + sitemap 排除驗證。 |
| 適合目前階段？ | 🟢 較適合「最小新基礎設施」：reuse 最多既有機制；但 §12 混淆風險與「下載頁一落地即進 build」之耦合須留意。 |

### 7.4 Option D — hybrid approach

| 維度 | 評估 |
|------|------|
| 優點 | landing page 正文 / SEO flags 走 content → reuse §13 noindex / sitemap pipeline；form / asset metadata 走 split registry → 關注點分離 + 跨頁複用；結構化資料與正文各得其所。 |
| 缺點 | 兩處來源需同步；實作最複雜；content frontmatter 之 ref 與 registry entry 須一致（雙來源一致性最難維護）。 |
| validation 難度 | 🔴 較高：須同時驗 content frontmatter（reuse 既有）+ registry ref resolution（新增）；跨「content ↔ settings」邊界檢查最複雜。 |
| Admin 編輯難度 | 🔴 較高：編輯一個下載頁可能同時碰 content .md（正文 / SEO）與 settings registry（form / asset）；UI 需橋接兩來源。 |
| 未來擴充性 | 🟢 高：form / asset registry 可跨頁複用；正文走 content 自然吃 SEO pipeline；最能支援多素材類型。 |
| 易誤放 respondent data？ | 🟢 低：form 設定在 settings registry（清楚「設定」語境）；正文在 content；皆無 respondent 欄位。 |
| 易與 `download.fileUrl` 混淆？ | 🟢 低：form publicUrl 在 `download-forms.json`、asset driveUrl 在 `download-assets.json`、article `download.fileUrl` 在文章 frontmatter —— **三者物理分離**，最不易混淆（前提是文件明確界定各自語意）。 |
| 影響 build/deploy？ | 🟡 中：正文進 content pipeline 即影響 build；registry 部分可先 dormant；分階段落地可控。 |
| 適合目前階段？ | 🟡 作為**目標架構**最佳；但若一次到位實作成本最高 → 建議分階段（詳 §8 staged path）。 |

### 7.5 比較摘要

| 維度 | A 集中 | B 分檔 | C 內嵌 | D hybrid |
|------|--------|--------|--------|----------|
| SEO pipeline reuse（§13）| ❌ 弱 | ❌ 弱 | ✅ 強 | ✅ 強 |
| 關注點分離 / 複用 | 🟡 | ✅ | ❌ | ✅ |
| validation 成本 | 🟡 | 🔴 | 🟢 | 🔴 |
| Admin 編輯成本 | 🟡 | 🔴 | 🟡 | 🔴 |
| 新基礎設施量（現階段） | 🟡 | 🔴 | 🟢 | 🔴 |
| 與 `download.fileUrl` 混淆風險 | 🟡 | 🟡 | 🔴 | 🟢 |
| respondent data 誤放風險 | 🟢 | 🟢 | 🟢 | 🟢 |
| 一落地即影響 build | 🟢 否 | 🟢 否 | 🔴 是 | 🟡 部分 |

---

## 8. Recommended Direction

### 8.1 建議：以 Option D（hybrid）為**目標架構**，並採 **C → D 分階段落地路徑**

**目標架構 = Option D（hybrid）**：

- landing page **正文 + SEO flags（`seo.indexing`）** 由 content 承載 → 直接 reuse 既有 noindex / sitemap pipeline（§13），不另造 SEO 機制（守 R3）。
- **FormConfig 與 DownloadAsset 為 split registry**（被 content frontmatter 以 `formRef` / `assetRefs[]` 參照）→ 關注點分離、跨頁複用、且 form publicUrl 與 asset driveUrl 與 article `download.fileUrl` **物理分離**，最不易混淆（守 R2）。

**落地路徑 = 分階段，保守先行（C → D）**：

1. **未來 MVP 起點傾向 Option C 的最小子集**：先讓下載頁以 content + 既有 `seo.indexing` 落地（noindex / sitemap 排除自動生效，零新 SEO 機制），form / asset 先以最小欄位內嵌或留 placeholder。此步新基礎設施最少、最易驗、最符合保守落地原則。
2. **待跨頁複用需求真實出現**（如注音 / 數字 / 節慶多素材共用同一 form 或 asset）**再把 form / asset 拆出為 split registry**，演進為完整 Option D。

> 此「先 C、後拆 D」之路徑，使每一步皆為 additive、可先 dormant、可單步驗證，貼合 [[feedback_conservative_landing]] 之保守落地偏好。本文件僅記錄方向，**不**在本 phase 落地任何一步。

### 8.2 建議所依之原則（明確）

- **不把使用者填表資料放進 repo**（守 R1 / §5.3）。
- **不把 Google Sheets respondent data 當成系統資料**。
- **不把 Google Form public URL 混成 `download.fileUrl`**（守 R2）；`download.fileUrl` 仍代表**實際下載資產 URL**，不是表單 URL。
- **download landing page 可以引用 form config 與 asset metadata**（透過 ref）。
- **設計須能支援未來多種下載**：
  - 注音卡 ZIP / PDF
  - 數字卡 JPG / ZIP / PDF
  - 節慶教材
  - 其他 teaching material downloads
- **現階段只做方向文件，不落地任何 registry file。**

### 8.3 為何不直接選 A / B / 純 C

- **A（集中）**：與 §13 SEO pipeline 串接不自然（settings 檔不在 content pipeline），且巨型 nested 檔不利 Admin 逐欄編輯。
- **B（分檔，純 registry 無 content body）**：結構乾淨但與既有 noindex / sitemap pipeline 串接需額外把 landing page entity 接進 build（等於另造一套），違 R3 reuse 原則。
- **純 C（全內嵌）**：reuse 最多，但 form / asset metadata 與 `download.fileUrl` 同處 frontmatter，混淆風險最高（§7.3），且 DRY 差。
- **D（hybrid）兼取 C 的 SEO reuse 與 B 的關注點分離**，並以「先 C 後拆」降低一次到位的實作 / validation / Admin 成本。

---

## 9. Proposed Future File Boundaries

> ⚠️ **PROPOSAL ONLY**：以下檔名與路徑皆為**未來** source phase 之候選，本 phase **不建立任何一個檔案**。命名暫定，最終由未來 source phase 決定。

對應 §8 之 hybrid 目標架構，未來可能之檔案邊界：

| 候選檔 / 位置 | 角色 | 對應 record | 備註（proposal only） |
|---------------|------|-------------|----------------------|
| `content/settings/download-forms.json` | FormConfig registry | FormConfig（pm-16 §7）| Google Form embed / public URL / provider / 隱私 / 所有權註記；**不**存 respondent data。 |
| `content/settings/download-assets.json` | DownloadAsset registry | DownloadAsset（pm-16 §8）| label / type / storage / delivery mode / file count / driveFileId 或 driveUrl。 |
| content 內之 landing page（位置候選）| landing page 正文 + SEO flags | DownloadLandingPage（pm-16 §6）正文部分 | 候選位置：`content/blogger/posts/`（draft）或未來專屬 `content/landing/`；以 `formRef` / `assetRefs[]` 參照上兩檔。 |

替代 / 對照候選（亦 proposal only）：

- `content/settings/download-landing-pages.json` —— 若改採 **Option A / B（純 registry）**，landing page 設定亦集中於 settings 檔；但此路徑與 §13 SEO pipeline reuse 較不自然（見 §8.3），故在 hybrid 目標下**不**為首選。
- 「或其他更適合的命名」—— 命名最終由未來 source phase 統一裁定（例如是否用 `download-page-registry.json` 等）。

> **本 phase 不建立上述任一檔案。** 列出僅為固化未來檔案邊界之討論基準。

---

## 10. Relationship to Existing Content Fields

### 10.1 既有 `download.*` frontmatter

既有 download 文章（CLAUDE.md §13）已有：

```yaml
download:
  enabled: true
  title: ""
  description: ""
  fileUrl: ""        # 實際下載資產 URL；非表單 URL（守 R2）
  fileType: "PDF"
  licenseNote: "..."
```

未來 registry 與此既有欄位之關係：

- 未來 landing page registry / content **不取代** article 層級之 `download.*`；兩者為不同層級（文章 CTA metadata vs 下載頁設定）。
- article CTA target 指向 landing page 之欄位命名**仍未定**（pm-16 §9 候選：`download.landingPageRef` / `download.ctaTarget` / 沿用 `download.fileUrl` 承載下載頁 URL（語意不直觀，不建議）/ 透過 `relatedLinks` `kind: internal`）。本 phase **不**裁決。
- **`download.fileUrl` 維持「實際下載資產 URL」語意**，不得被改填為 Google Form URL（守 R2）。

### 10.2 既有 `relatedLinks` / `otherLinks`

- 既有 `relatedLinks` / `otherLinks`（CLAUDE.md §16.5；`docs/related-links-schema.md`）為作者手填之連結分區，與 Related Posts 自動推薦為兩套獨立機制。
- 未來 article → landing page 之指向**可能**借用 `relatedLinks` `kind: internal`，亦可能新增專屬欄位；命名留待未來 source phase。

### 10.3 reference fixture（只讀描述，不修改）

- `content/blogger/posts/20260529-phonics-practice-sheet-download.md` 目前是 **draft fixture**。
- 它可作為 future download article / landing page linkage 的**參考案例**（已含 `download.*` 區塊 + 一筆 `relatedLinks` github internal cross-link）。
- 它的 **`download.fileUrl` 仍空**。
- **本 phase 不在此檔填入 fileUrl。**
- **本 phase 不 draft-to-ready。**
- **本 phase 不 deploy / 不 Blogger repost / 不 GA4。**

---

## 11. Relationship to Google Forms / Google Sheets

- 下載流程（pm-16 §4 / pm-12 §3）：article CTA → internal noindex landing page → embedded Google Form → Google Forms / Sheets respondent storage → Google Drive asset delivery。
- **Google Form embed URL / public URL 屬 FormConfig registry 管理之「設定」**（站方自有 form 之指標），可進 repo / Admin。
- **使用者填表資料（form submissions）/ Google Form respondent records / Google Sheets 回覆資料 / 個資 / analytics 永遠留在 Google Forms / Sheets**，**不進 repo、不進 Admin static files**（守 R1 / §5.3）。
- registry 設計**不得**提供任何承載 respondent data 之欄位；若未來需分析回覆，屬 repo / Admin 之外之一次性離線匯出，不回流 registry。
- placeholder 政策（pm-16 §7 / §8.3）：上線前 `embedUrl` / `publicUrl` / `driveFileId` / `driveUrl` 一律保持**空字串 placeholder**，不填猜測 / 假 URL。

---

## 12. Relationship to Download Assets

- **DownloadAsset 之 `driveUrl` / `driveFileId` 代表實際下載資產**（Google Drive 託管之 ZIP / PDF / JPG / folder / other）。
- **article 之 `download.fileUrl` 亦代表實際下載資產 URL**——與 asset 概念同類，但**不是 Google Form URL**（守 R2）。
- **三個 URL 概念須嚴格區隔**：

  | URL | 屬於 | 語意 |
  |-----|------|------|
  | `download.fileUrl`（article frontmatter）| 文章層級 | 實際下載資產 URL（或未來指向 landing page，命名待定）；**非表單 URL** |
  | FormConfig `embedUrl` / `publicUrl`（registry）| 表單設定 | Google Form 內嵌 / 公開填寫 URL；**非資產 URL** |
  | DownloadAsset `driveUrl` / `driveFileId`（registry）| 資產設定 | Google Drive 實際檔案；**非表單 URL** |

- 設計須能支援未來多素材類型，沿用同一 DownloadAsset 模型：
  - 注音卡（phonics）：ZIP（內含多 PDF）
  - 數字卡（number cards）：JPG / ZIP / PDF（未來統一進 landing page + form flow）
  - 節慶教材（festival material）：類型未定，沿用同模型
  - 其他 teaching material downloads
- **本 phase 不處理任何實際 PDF / JPG / ZIP 資產；不填 `download.fileUrl`；不填任何 driveUrl。**

---

## 13. SEO / noindex / sitemap Considerations

對齊既有系統能力（pm-15 / pm-16 §10 finding；`docs/seo-indexing-rules.md`）：

- **noindex page renderer 已存在** —— `build-github.js` 依 `post.seo.indexing` 輸出 robots meta（`index, follow` / `noindex, follow` / `noindex, nofollow`）。
- **sitemap exclusion 已存在** —— `build-sitemap.js` 對 `seo.indexing === 'noindex-follow' | 'noindex-nofollow'` 之 post 直接排除。
- **`seo.indexing` validation 已存在** —— 規則出處 `docs/seo-indexing-rules.md` §3 / §6 SEO-2。

**含意（建議，非實作）：**

- 未來 download landing page 應 **reuse 既有 noindex / sitemap pipeline**（沿用 `seo.indexing` 語彙 + build-github / build-sitemap 既有分支），**而不是另開一套 SEO 機制**（守 R3）。
- 此原則正是 §8 推薦 hybrid（landing page 正文 / SEO flags 走 content）之主因：content-based landing page 天然接入既有 pipeline，noindex meta 與 sitemap 排除自動生效。
- 下載頁固定 `noindex: true` / `includeInSitemap: false`（pm-16 §6）；一致性由未來 validation 把關（§15）。

---

## 14. Admin Management Model

沿用 pm-12 §5 ownership boundary，於 registry 語境再固化：

Admin **應**管理：

- landing page metadata（slug / title / display copy / status）
- form config（embed URL / public URL / provider）
- asset metadata（label / type / storage / delivery mode / file count）
- article CTA relation（文章 → 下載頁指向）
- noindex / sitemap flags

Admin **不**管理：

- respondent records / exported spreadsheet / 使用者個資 / analytics 輸出（永遠留在 Google Forms / Sheets，repo / Admin 之外；守 R1）

目前 Admin write 狀態（明確；per `admin-2-write-pre-analysis.md`）：

- **Admin Apply 不啟用。**
- **middleware write route 不啟用。**
- **admin-write-cli dry-run / apply 不執行。**
- 既有 allowed write scope 保守（僅 `description` / `searchDescription`）；`download.*` / `relatedLinks` / settings 皆在**禁寫**清單。
- 未來若 Admin 要管理 download registry，須**獨立 Admin fields preanalysis + write preflight**，非本 phase 範圍。

> 註：array-of-object + registry lookup（如 split registry 之 form/asset selector）屬最高 write 複雜度（per `admin-2-write-pre-analysis.md` §729），不適合作為首個 write feature 之基礎設施驗證載體；未來落地須單獨評估。

---

## 15. Validation Considerations

> 僅草擬未來需要之 validation 方向；**本 phase 不改 `validate-content.js`**。

未來 download landing page registry 之 validation 可能需要（sketch，severity 留待未來 validation rules preanalysis）：

- ready landing page **must have** `slug` / `title` / form ref / asset ref（非空）。
- 下載頁 `noindex` **must be true**；`includeInSitemap` **must be false**（一致性檢查）。
- form `publicUrl` / `embedUrl` **must be non-empty only when status === ready**（draft 允許空 placeholder）。
- asset `type` / `storageProvider` / `deliveryMode` 必須為合法 enum。
- **ref resolution**（若採 split registry / hybrid）：`formRef` / `assetRefs[]` 必須能在對應 registry 解析到實體（避免 dangling ref）；`sourceArticleRefs[]` 應對應實際存在文章。
- **R2 守門候選**：article `download.fileUrl` 不應等於任何 FormConfig 之 `publicUrl` / `embedUrl`（防止把表單 URL 誤填成資產 URL）——此為**建議檢查方向**，最終是否實作留待未來。
- reuse 既有 `seo.indexing` validation（§13），不另造。

> 嚴重度（error vs warning）、實作位置與精確訊息留待未來 validation rules preanalysis（pm-16 §15 候選 E）。建議沿用既有 `related-links-*` / `source-key-*` 之 warning-only additive pattern，符合保守落地原則。

---

## 16. Non-goals

本 phase 明確**不做**：

- ❌ 不實作 registry
- ❌ 不建立 settings JSON
- ❌ 不建立 landing page
- ❌ 不修改 renderer
- ❌ 不修改 Admin UI
- ❌ 不收集或匯入 Google Form respondent data
- ❌ 不處理實際 PDF / JPG / ZIP 資產
- ❌ 不改 `download.fileUrl`
- ❌ 不觸發 reverse UTM
- ❌ 不推進 pm-26 deploy gate
- ❌ 不做 build / deploy / Blogger repost / GA4

---

## 17. Acceptance Gate for Future Implementation

未來若要從本方向文件進入**實作**，至少須滿足（本 phase **皆不**執行；列為未來 gate）：

1. **獨立 phase + 該次 user explicit approval**（本文件不預授權任何實作步驟）。
2. 先過對應之 **schema acceptance / registry detail preanalysis**（細化欄位字典、命名定稿）。
3. **一次一步、additive、可先 dormant**：先 settings-only / content-only，再 renderer，再 validation，再 Admin（mirror 既有 link-sources registry 之 7-step 漸進落地節奏）。
4. **守 R1 / R2 / R3**：respondent data 不進 repo；`download.fileUrl` 不混成 form URL；SEO reuse 既有 pipeline。
5. **不解除既有凍結**：reverse UTM 仍 dormant；pm-26 deploy gate 仍 BLOCKED，除非另開獨立 phase 處理。
6. 每步須 `validate:content` 0 errors 不退步 + （若涉 renderer）byte-identical-modulo-builtAt 驗證。

---

## 18. Recommended Next Phase

> 建議流向（非承諾；任一啟動皆須獨立 phase + user explicit approval）：

| 序 | 候選 phase | 性質 | 是否本 phase 啟動 |
|---|-----------|------|-----------------|
| 1 | registry direction acceptance（read-only：接受 / 細化本文件 §8 建議方向）| read-only | ❌ 不啟動 |
| 2 | registry schema detail preanalysis（定稿 FormConfig / DownloadAsset 欄位字典 + 命名）| docs-only | ❌ 不啟動 |
| 3 | renderer / noindex landing page source preanalysis（對齊 §13 reuse）| docs-only | ❌ 不啟動 |
| 4 | validation rules preanalysis（細化 §15）| docs-only | ❌ 不啟動 |
| 5 | Admin fields preanalysis（對應 §14）| docs-only | ❌ 不啟動 |
| 6+ | 實際 settings / content / renderer 落地 | **僅在 explicit approval 後** | ❌ 不啟動 |

**本 phase 完成後建議：Final Idle Freeze / EXIT。不直接啟動下一 phase。**

---

## 19. Explicit Non-execution Declarations

本 phase 明確未執行：

- no source change
- no content change
- no settings change
- no templates change
- no package change
- no dist change
- no build
- no deploy
- no Blogger repost
- no GA4 validation
- no reverse UTM activation
- no pm-26 gate unblock
- no draft-to-ready
- no download.fileUrl fill
- no admin-write-cli (dry-run / apply)
- no Admin Apply enable
- no middleware route
- no npm install
- no fixture creation
- no Google Form respondent data import

本檔落地後 production state drift = 0；屬純 docs entry。唯一變更為新增本 docs 檔。

---

（本文件結束）
