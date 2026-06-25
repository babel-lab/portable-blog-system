# downloadFunnel — page type / metadata / layout / cautious wording spec lock（docs-only）

- Phase id：`20260625-funnel-page-type-metadata-spec-lock-docs-only-a`
- 日期：2026-06-25（Asia/Taipei，晚場）
- 類型：**docs-only spec lock**（formalise concepts from input packet；**no source change** / **no fixture** / **no baseline bump** / **no production content** / **no live service** / **no Admin write path**）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）。**不**影響 B / C / E / F / J / K / L 任何 source 或 production content。
- 授權：Dean explicit approval（限定 docs-only spec lock，唯一新增本檔）
- 來源：`docs/20260627-funnel-production-content-input-packet-docs-only-a.md` §15 / §17 / §18 / §19 / §20 / §21
- 前置：`docs/20260626-funnel-production-migration-readiness-map-docs-only.md`、`docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`、`docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`、`docs/20260624-gated-download-funnel-spec-lock.md`

---

## 1. Purpose / Scope

本文件目的：

- 將 funnel production content input packet 已整理之概念，正式鎖定為**規格文件**（locked vocabulary + locked behaviour rules）。
- 對齊未來 funnel-related 設計討論之共同語言：page type、download target cardinality、resource access、layout policy、metadata concept fields、cautious wording register。

本文件**不是**：

- ❌ **不是** source implementation（不新增 / 不修改 `src/scripts/validate-content.js`、`src/scripts/check-validation-report.js`、任何 EJS / SCSS / JS / settings / fixtures）。
- ❌ **不是** schema 啟動（`pageType` / `downloadTargets[]` / `resourceAccess` / `layoutPolicy` 等欄位皆 conceptual-only，**未**進入 source schema、**未**進入 frontmatter contract）。
- ❌ **不是** content migration（不新增 / 不修改任何 production `.md`、不啟動任何 entry/gated pair landing）。
- ❌ **不**啟動 GitHub / new-domain download page；當前 funnel **僅**存在於 Blogger（與 input packet §16 一致：`future_possible_not_active`）。
- ❌ **不**驗證 Form / Drive 後端；本文件**不**碰 Blogger 後台 / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin write path。

scope 界線：

- ✅ 本檔僅作為**規格參考來源**，供未來 spec 討論 / docs-only 進一步整理 / 未來 source phase planning 引用。
- ✅ 本檔 additive；不影響任何既有 docs、不取代 spec-lock（`docs/20260624-gated-download-funnel-spec-lock.md`），僅作為其延伸詞彙集。
- ✅ 本檔**未**重複完整 input packet 內容；僅做 concept lock + 規格化措辭。

---

## 2. Locked page type model

正式鎖定下列五類 page type 詞彙與預設行為。**詞彙**為規範用語；**預設行為**為**規格鎖定**，**非** validator 已實作行為。

### 2.1 `standard_article`

- purpose：一般文章、漫畫、筆記、書評、教育類貼文（不屬於 download funnel）。
- default indexing：`index_follow`。
- sitemap inclusion：`true`（除非明確 override）。
- listings inclusion：`true`（除非明確 override）。
- expected layout behavior：regular article-like；header / body / footer / sidebar 沿用既有共用版型。
- download/resource behavior：none（不屬 download funnel）。
- Blogger / GitHub / future merged-site applicability：三者皆適用。
- validator implication：**目前僅規格鎖定**；validator 端**未**新增 `pageType=standard_article` 之檢核分支。

### 2.2 `standard_download_entry`

- purpose：public indexed 資源介紹 / download preface 頁；說明資源價值、預覽圖、更新紀錄、使用情境、相關資源、CTA，並導向 gated page。
- default indexing：`index_follow`。
- sitemap inclusion：`true`。
- listings inclusion：`true`。
- expected layout behavior：`regular_article_like`（與 standard article 共用版型基底；含 AdSense / hashtags / JS-DL · GA tracking 允許）。
- download/resource behavior：含一個或多個 `downloadTargets[]`（見 §3）；primary 必有，update 可選 / 條件性。
- Blogger / GitHub / future merged-site applicability：Blogger 已存在實例（input packet §14.1）；GitHub / future merged-site 為 `future_possible_not_active`。
- validator implication：**目前僅規格鎖定**；未來若導入 `pageType` enum，需另行 source phase（見 §8）。

### 2.3 `gated_download`

- purpose：Google Form 或 gated 機制存取頁；表單送出後始顯示 / 提供下載資源連結。
- default indexing：`noindex_follow`。
- sitemap inclusion：`false`。
- listings inclusion：`false`。
- expected layout behavior：`regular_article_like` 開場 + Form 嵌入 + 使用限制 / 回饋說明區塊；不得作為一般文章 / listing surface。
- download/resource behavior：實際下載連結可能僅於 Form 送出後始顯示；repo 端**僅**記 `postSubmitResource` 之列舉值（drive-link / external-after-submit / confirmation-only / inline-resource），**不**寫入 Drive ID / Form edit URL / Form response URL。
- Blogger / GitHub / future merged-site applicability：Blogger 已存在實例（input packet §14.2）；GitHub / future merged-site 為 `future_possible_not_active`。
- validator implication：**目前僅規格鎖定**；既有 funnel validator slices（F2 / F4 / F6 / F7 / F8）對 gated page 之 robots-safety / reciprocity / private-value 已 landed warning-only；本檔**不**新增 validator 行為。

### 2.4 `special_direct_download_resource`

- purpose：seasonal / campaign / 直接下載資源頁（例：聖誕節著色畫、活動性 A4 列印素材）。
- default indexing：`index_follow`（除非明確 override）。
- sitemap inclusion：`true`（除非明確 override）。
- listings inclusion：`true`（除非明確 override）。
- expected layout behavior：**not gated**；允許自訂 CSS / 卡片版面 / 直接 JPG / 圖檔下載按鈕；可含自訂互動 / SVG。
- download/resource behavior：直接公開下載；無 Form gate；無 entry→gated 兩段配對。
- Blogger / GitHub / future merged-site applicability：Blogger 已存在實例（input packet §17.4 範例：`🎄2025 聖誕節著色畫下載…`）；GitHub / future merged-site 為 `future_possible_not_active`。
- validator implication：**目前僅規格鎖定**；validator **不得**假設所有下載 / 資源頁皆為 entry→gated 模式；special_direct 為合法獨立分類。

### 2.5 `interactive_demo`

- purpose：互動展示 / pure CSS 小遊戲 / lab experiment article（例：pure CSS rocket game）。
- default indexing：`index_follow`（可 override）。
- sitemap inclusion：`true`（可 override）。
- listings inclusion：`true`（可 override）。
- expected layout behavior：article-like 開場 + 嵌入互動 block；允許自訂 CSS / 自訂 JS / SVG 互動；AdSense 區塊允許 present。
- download/resource behavior：**not** download funnel；**not** gated download；不歸入 download / resource 頁面類型。
- Blogger / GitHub / future merged-site applicability：Blogger 已存在實例（input packet §17.5 範例：`[PURE CSS GAME]小遊戲-火箭發射(無音效)`）；GitHub / future merged-site 為 `future_possible_not_active`；SEO / hashtags / tracking 補強為 `content_not_provided_yet`。
- validator implication：**目前僅規格鎖定**；validator **不得**將 interactive_demo 套用 download funnel 規則（不 require `downloadFunnel.role` / `entryPages[]` / `targetGatedPage`）。

---

## 3. Locked download target model

正式鎖定 `downloadTargets[]` 概念欄位之 role 列舉與 cardinality 規則。**所有規則為規格鎖定，validator 端未實作。**

### 3.1 role enum

- `primary_all_download`（亦稱 `primary download target`）
  - 用途：all-download ZIP / PDF / 主完整包下載。
  - 必要性：當 entry page 為 `standard_download_entry` 且資源可下載時為**正常 / 必要**。
- `optional_update_download`（亦稱 `update target`）
  - 用途：update-only / correction package；原為「先前已下載者」之更新管道。
  - 必要性：**optional / conditional**；僅當存在錯誤、修正、替換、新增資源或更新包時始出現。

### 3.2 cardinality 規則

- 一個 `standard_download_entry` 可包含**一個或多個** download targets。
- `primary_all_download`：在資源可下載時為**必要**（spec lock 層級規範；validator 未實作 enforcement）。
- `optional_update_download`：**non-required**；許多資源可能**永遠不需要** update target。

### 3.3 validator 未來行為禁區（規格鎖定）

未來 validator 若導入 `downloadTargets[]` 檢核，**必須**遵守以下規格：

- ❌ **不得**假設所有 downloadable resource 都必須有 `optional_update_download`。
- ❌ **不得**將「未宣告 update target」自動視為 error 或 missing。
- ❌ **不得**將 update target 與 primary target 之缺一視為對稱（不對稱：primary 條件性必要、update 全條件性可選）。
- ✅ gated page 與 update page 可存在**不同 life cycle**（update target 之 add / remove / replace 不應牽動 primary 之 deprecation 判定）。
- ✅ 未來若加入 update-target 行為 hint，須維持 **warning-only / conditional**，**不得** error-level enforcement。

---

## 4. Locked resource access model

正式鎖定 `resourceAccess` 概念欄位之列舉值。**所有列舉為規格鎖定，validator 端未實作。**

### 4.1 enum 列舉

- `normal_public`：一般 public indexed 內容（無 funnel / 無 gate）；對應 `standard_article` / `standard_download_entry`（後者 access 為 public，但 download payload 仍可指向 gated `targetGatedPage`）。
- `gated_by_form`：透過 Google Form 或同類 gating 機制存取；對應 `gated_download`。
- `direct_public_resource`：public 直接下載資源（無 Form）；對應 `special_direct_download_resource`。
- `embedded_interactive`：嵌入式互動內容；對應 `interactive_demo`；non-download。
- `future_possible_not_active`：未來可能新增之 access 模式（例：GitHub / new-domain download page）；**當前無 active instance**。

### 4.2 verification 紅線（規格鎖定）

- Form / Drive backend 狀態**只能**標為 `assumed` / `needs manual verification`（搭配 §7 cautious wording）。
- ❌ **不得**在任何 docs / spec / production `.md` 宣稱「Form 後端已驗證可收件」。
- ❌ **不得**在任何 docs / spec / production `.md` 揭露 Drive ID / Form edit URL / Form response URL / OAuth token / API key / respondent data（沿用 input packet §6 / §7 / §10 red lines）。
- ✅ 真實 post-submit 資源連結由 Dean 於 Google Form 端設定；repo 端**只**記 `postSubmitResource` 之列舉值。
- ✅ Form / Drive backend 之 manual verify 須由 Dean 親自執行；Claude **不**得獨自接觸 Blogger / Google Form / Google Drive 後台。

---

## 5. Locked layout policy

正式鎖定 `layoutPolicy` 概念設定。**所有規則為規格鎖定，validator / renderer 端未實作。**

### 5.1 default layout

- `default_layout`：`regular_article_like`（Blogger / GitHub / future merged-site 共用基底）。
- `special_layout_allowed`：`true`（special_direct_download_resource / interactive_demo 等可使用自訂 layout）。
- `regular_article_like` 包含：header / breadcrumb / article header / article body / optional ads / hashtags / social follow / related posts / prev-next / footer / back-to-top（沿用 CLAUDE.md §17 既有規範）。

### 5.2 AdSense preservation rule

- `preserve_adsense_slots`：`true`。
- 規格鎖定行為：**未經 Dean 明確核准**，**不得**因 funnel / page type / resource page 改版而：
  - ❌ 重排既有 AdSense placement（top / middle / bottom / sidebar / inline / before-related-links 等）。
  - ❌ 刪除既有 AdSense slot。
  - ❌ 重新設計（換 slot id / 換 client id / 換 anchor / 換 partial）既有 AdSense placement。
- 凡 AdSense 配置變更皆為獨立 phase + Dean explicit approval + warning-only-first（沿用 CLAUDE.md §3a red lines 與既有 `check:adsense-*` baseline 紀律）。

### 5.3 allow flags（規格鎖定，未實作）

- `allow_js_dl_tracking`：`true`（JS-DL · GA tracking onclick events 允許）。
- `allow_hashtags`：`true`。
- `allow_custom_css`：`true`（針對 special_direct_download_resource / interactive_demo）。
- `allow_custom_js`：`true`（同上；條件式）。
- `allow_svg_interaction`：`true`（interactive_demo 適用）。

### 5.4 live AdSense access 紅線

- ❌ **本 phase no live AdSense access**：不開 AdSense 後台、不動 ads.config.json、不變動 client id / slot id、不更新 `dist-blogger/` 或 `gh-pages/` AdSense HTML。
- ❌ 任何 AdSense 後台觀察（dashboard / earnings / inventory）皆須獨立 phase + Dean explicit approval（沿用 CLAUDE.md §3a Blogger / AdSense / GA4 / Google Drive / Search Console 後台操作禁區）。

---

## 6. Locked metadata concept model

正式鎖定下列概念欄位**詞彙與意涵**。**所有欄位 conceptual-only，明確標註 not yet source schema。**

### 6.1 conceptual field set

- `content_kind`
  - 列舉：`article` / `resource` / `interactive` / `utility_hidden`。
  - 意涵：內容性質之粗分類；獨立於 platform（Blogger / GitHub）與 page type。
- `page_type`
  - 列舉：`standard_article` / `standard_download_entry` / `gated_download` / `special_direct_download_resource` / `interactive_demo`（見 §2）。
- `download_targets`
  - 概念：`downloadTargets[]` 陣列；每項含 `role`（`primary_all_download` / `optional_update_download`）+ 對應 URL（public）或 slug 參照。
  - cardinality：`one_or_many`；`primary_required: true`；`update_target_optional: true`（見 §3）。
- `resource_access`
  - 列舉：`normal_public` / `gated_by_form` / `direct_public_resource` / `embedded_interactive` / `future_possible_not_active`（見 §4）。
- `resource_layout`
  - 列舉：`regular_article_like` / `form_download` / `special_campaign` / `interactive_custom`。
- `layout_policy`
  - 設定組：`default_layout` / `special_layout_allowed` / `preserve_adsense_slots` / `allow_js_dl_tracking` / `allow_hashtags` / `allow_custom_css` / `allow_custom_js` / `allow_svg_interaction`（見 §5）。
- `indexing` / `sitemap` / `listings`
  - 既有 frontmatter / settings 已部分對應；新概念列舉與 §2 各 page type 之 default 一致。
- `cautious verification status fields`
  - 用於 docs / spec 紀錄外部資源就緒狀態；列舉值見 §7。

### 6.2 not yet source schema（規格鎖定）

- ❌ 上列欄位**尚未**進入 `src/scripts/validate-content.js` 之 schema 檢核分支。
- ❌ 上列欄位**尚未**進入 `content/settings/` 任何設定檔。
- ❌ 上列欄位**尚未**進入任何 production `.md` frontmatter。
- ❌ 上列欄位**尚未**進入 fixture（`content/validation-fixtures/`）。
- ❌ 上列欄位**尚未**進入 EJS partial / renderer / Admin loader。
- ✅ 未來若導入 source 端任一欄位，須拆 phase（見 §8），且需 Dean explicit approval。

---

## 7. Cautious wording register

正式鎖定下列用語為 funnel docs / spec / future production `.md` 紀錄外部資源狀態之**規範用語**。

### 7.1 allowed cautious wording

- `existing_assumed_needs_manual_verify`
  - 用法：既有資源 / 連結 / Form / Drive 存在於現場（Blogger live），但 backend 流程未由 Claude 親自驗證，須 Dean 手動驗證。
- `yes_assumed_needs_manual_check`
  - 用法：依現場可見資訊推測 ready，但無 backend 驗證；須 Dean 手動 check。
- `content_not_provided_yet`
  - 用法：應有但 Dean 尚未提供之素材（例：interactive_demo 之 hashtags / SEO / tracking）。
- `future_possible_not_active`
  - 用法：未來可能啟動之模式 / 頁面 / 平台，但當前**非** active（例：GitHub / new-domain download page）。
- `deferred`
  - 用法：明確延後之 phase / 行為 / source landing。
- `optional`
  - 用法：non-required 欄位 / 行為 / target（例：`optional_update_download`）。
- `conditional`
  - 用法：依條件出現之欄位 / 行為（例：update target presence、interactive_demo 之 SEO 補強）。

### 7.2 禁止主張（紅線）

未來任何 docs / spec / production `.md` / commit message / phase report **不得**作下列主張：

- ❌ **不得**主張 Form backend 已驗證（含「Form 已測試可收件」/「表單流程已通過 end-to-end」）。
- ❌ **不得**主張 Drive download link 已由 Claude 人工驗證（任何 Drive 連結驗證必須由 Dean 手動執行並標註人工驗證者）。
- ❌ **不得**主張 GitHub / new-domain download page 已存在（當前狀態 = `future_possible_not_active`）。
- ❌ **不得**主張 `optional_update_download` 對所有下載資源都是必要（永遠 conditional）。
- ❌ **不得**主張 metadata model（§6）已進入 source schema（永遠 conceptual until §8 source phase landed）。
- ❌ **不得**主張任何 live / backend / write path 已啟動（含 Admin Apply / Save / middleware / admin-write-cli / FB sidecar 真實寫入 / reverse UTM deploy / Blogger AdSense batch 2 repost / GA4 後台 / AdSense 後台 / Search Console / Google Drive API / Google Form API）。

---

## 8. Source implementation guardrails

未來若要將本檔之 spec 進入 source implementation，**必須**拆下列 phase（每 phase 各自需 Dean explicit approval、各自獨立 baseline-bump phase 若觸發 production fixture，warning-only-first 不得 error-level enforcement）：

### 8.1 必拆 phase 清單

- `pageType enum validation slice`
  - 目標：在 `validate-content.js` 加入 `pageType` enum 認知（warning-only）。
  - 前置：須先有 settings / frontmatter contract 定義 `pageType` 欄位之歸屬。
  - 預期 baseline 影響：若僅加 warning-only 對未宣告 production post，可能 0 production trigger；若刻意對未宣告者 warn，須對應 baseline-bump phase。
- `downloadTargets[] cardinality slice`
  - 目標：加入 `downloadTargets[]` 之 role enum / cardinality 檢核（primary 條件性、update optional）。
  - 必守：**不得**將 update target 缺漏視為 error / missing。
- `resourceAccess / layoutPolicy slice`
  - 目標：加入 `resourceAccess` 與 `layoutPolicy` 之 enum 認知與規格化檢核。
  - 必守：AdSense preservation rule（§5.2）為硬約束；任何 layout change 須與既有 `check:adsense-*` baseline 一致。
- `fixture update slice`
  - 目標：為新欄位增加 fixture（valid / deferred-case / scanned invalid）。
  - 必守：scanned invalid fixture 須**獨立** baseline-bump phase + `check:validation-report` BASELINE 同步 + Dean approval；scanned valid / deferred-case 0-warning fixture 可直接加。
- `validation baseline sync slice`
  - 目標：當任何 slice landing 影響 validate:content / overlay / check:validation-report 數字時，sync §3a baseline snapshot。
  - 必守：每個 sync 為獨立 phase；CLAUDE.md §3a snapshot **極小** sync only（不寫戰史 ledger 全文）。

### 8.2 spec lock 與 source 之分離

- ✅ 本文件**僅為規格鎖定**：locked vocabulary + locked behaviour rules。
- ❌ 本文件**不**授權任何 source change。
- ❌ 本文件**不**授權任何 fixture / settings / frontmatter contract 變更。
- ❌ 本文件**不**授權任何 baseline bump。
- ✅ 未來若任何 source phase 引用本檔，須在該 phase 之 docs 明示「本 phase 依 `20260625-funnel-page-type-metadata-spec-lock-docs-only-a` §X 之規格實作 Y」，並由 Dean explicit approval。

---

## 9. Red lines（本 phase 通則）

- ✅ **docs-only**：唯一新增本檔，無其他檔案變動。
- ✅ **additive only**：未修改任何既有檔案；未刪除任何既有檔案。
- ❌ **no source**：未動 `src/` 任何檔案（含 `src/scripts/validate-content.js` / `src/scripts/check-validation-report.js` / 任何 EJS / SCSS / JS / Admin loader）。
- ❌ **no content/settings/package/lockfile**：未動 `content/` / `content/settings/` / `package.json` / `package-lock.json`。
- ❌ **no build**：未跑 `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `preview` / dev server。
- ❌ **no deploy**：未動 `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/` / 任何 generated HTML。
- ❌ **no validation baseline bump**：未跑 `validate:content` / `report:validation` / `check:*` / 任何 validation script；本檔 landing **不**改變 §3a baseline 數字。
- ❌ **no live/backend access**：未碰 Blogger 後台 / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin write path。
- ❌ **no Blogger / Form / Drive / GA4 / AdSense / Search Console / Admin access**：完整沿用 input packet §10 / §21 red lines。
- ❌ **no CLAUDE.md / MEMORY.md**：未動 `CLAUDE.md`（含 §3a prose snapshot）/ `MEMORY.md` / `memory/`。
- ❌ **no commit / push unless Dean explicitly asks after review**：本 phase 完成後 STOP，未 commit、未 push、未 rebase / amend / cherry-pick / merge / reset。
- ❌ **no slash command**：未執行任何 slash command。

---

## 10. Cross-links

- `docs/20260627-funnel-production-content-input-packet-docs-only-a.md`（input packet；§15 / §17 / §18 / §19 / §20 / §21 為本檔 spec lock 來源）
- `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（readiness map）
- `docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`（entry preflight，layer A）
- `docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`（gated preflight，layer B）
- `docs/20260624-gated-download-funnel-spec-lock.md`（既有 funnel spec lock；本檔為其延伸詞彙集）
- `docs/20260625-funnel-dangling-absolute-url-source-preflight-a.md`（dangling / absolute-URL deferred-silent 行為盤點）
- `src/scripts/validate-content.js`（既有 F2 / F4 / F6 / F7 / F8 slices；本檔**不**動）
- `src/scripts/check-validation-report.js`（既有 C5 / C6 / C7 / B6 / B7 locks；本檔**不**動）
- `CLAUDE.md` §3a / §7 / §11 / §13 / §16 / §17 / §21 / §22 / §24

---

`VERDICT: DOCS-ONLY SPEC LOCK LANDED`
`PAGE TYPE MODEL LOCKED (5 ENUMS)`
`DOWNLOAD TARGET MODEL LOCKED (PRIMARY REQUIRED / UPDATE OPTIONAL)`
`RESOURCE ACCESS MODEL LOCKED (5 ENUMS + FUTURE_POSSIBLE_NOT_ACTIVE)`
`LAYOUT POLICY LOCKED (ADSENSE PRESERVATION HARD)`
`METADATA CONCEPT MODEL DOCUMENTED (NOT YET SOURCE SCHEMA)`
`CAUTIOUS WORDING REGISTER LOCKED`
`SOURCE IMPLEMENTATION GUARDRAILS DEFINED (FUTURE PHASES MUST BE SPLIT)`
`NO SOURCE / FIXTURE / BASELINE / PRODUCTION CONTENT / LIVE SERVICE CHANGE`
`AWAITING DEAN REVIEW BEFORE COMMIT`

（本文件結束）
