# 20260530 Download Validation D3 / S1 / S2 Decision Preanalysis

> Phase: `20260530-am-9-download-validation-d3-s1-s2-decision-preanalysis-docs-only-a`
> Date: 2026-05-30 09:29 +0800
> Scope: **docs-only**（無 source / content / settings / templates / package / dist / gh-pages 變更）

---

## 1. Executive Summary

- 本 phase 是 **docs-only decision preanalysis**：
  - ❌ 不實作 D3 / S1 / S2 validator（`src/scripts/validate-content.js` 一行不動）
  - ❌ 不新增 fixture（`content/validation-fixtures/` 不動）
  - ❌ 不改 content / settings / templates / package / dist / gh-pages
  - ❌ 不 build / deploy / Blogger repost / GA4 validate / reverse UTM activate / pm-26 unblock
  - ❌ 不建立 settings registry；不建立 download landing page source
  - ❌ 不改既有 am-7 D1 / D2 implementation
- 目標：在進入 D3 / S1 / S2 之 source implementation 前，**先把以下 5 個問題裁決固化**：
  1. D3 `download.fileUrl` invalid format 要不要做？格式邊界是什麼？（§5）
  2. Google Drive preview / share / download URL 風險要不要納入 D3，還是另列 future rule？（§6）
  3. S1 downloadable content should be noindex 要怎麼判斷？（§7）
  4. S2 downloadable content marked index 是否需要獨立 warning，或併入 S1？（§7）
  5. 若未來要 source implementation，應分成幾個 phase？是否仍需要 source + fixture 同 phase？（§11）
- 本文件**不改**前序 docs（am-1 rules / am-3 fixture-design / am-5 source-implementation）之 D1 / D2 / D3 / S1 / S2 / F1 / F2 / A1 / A2 / A3 之命名、語意、分類；僅做 implementation decision 之再裁決。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔。

---

## 2. Baseline Snapshot

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `40499d8d5c19254d81032df73abb1413fb34d2b5` |
| origin/main | `40499d8d5c19254d81032df73abb1413fb34d2b5` |
| short hash | `40499d8` |
| latest subject | `feat(validate): warn on invalid download fileUrl` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`，無 untracked） |
| `validate:content` | **0 error(s) / 44 warning(s) on 39 post(s)** |

### 2.1 am-7 / am-8 已落地之 baseline 變更

| Phase | 規則 | fixture | baseline 變動 |
|-------|------|---------|-------------|
| am-5 | D1 / D2 implementation preanalysis（docs-only） | n/a | 37 / 42（無變動） |
| am-6 | D1 / D2 implementation preanalysis acceptance（read-only） | n/a | 37 / 42（無變動） |
| am-7 | D1 + D2 source + 2 fixtures（`_test-download-enabled-fileurl-empty.md` / `_test-download-fileurl-invalid-type.md`） | +2 | 37 → 39 / 42 → 44 |
| am-8 | am-7 acceptance cross-check（read-only） | n/a | 39 / 44（無變動） |

- D1 / D2 之 baseline 變動已固化於 origin/main（HEAD = 40499d8）。
- 本 phase 不改 source 不加 fixture → baseline 預期維持 `0 / 44 / 39`。

---

## 3. Current Implemented State

### 3.1 已落地

- **D1** `download-enabled-fileurl-empty`：✅ 已實作（`src/scripts/validate-content.js` L482–L494）；ready/published only；觸發條件 = `contentKind === 'download'` 且 `download.enabled === true` 且 `fileUrl` 為 `undefined` / empty string / whitespace-only string。
- **D2** `download-fileurl-invalid-type`：✅ 已實作（同檔 L468–L481）；ready/published only；觸發條件 = `download` 為 plain object 且 `download.fileUrl !== undefined` 且非 string。
- D1 / D2 **互斥**：fileUrl 非 string 由 D2 接住，不再被 D1 視為 empty string（per validate-content.js 內註釋 L461–L463）。
- 對應 negative fixtures：
  - `content/validation-fixtures/blogger/posts/_test-download-enabled-fileurl-empty.md` → 觸發 D1
  - `content/validation-fixtures/blogger/posts/_test-download-fileurl-invalid-type.md` → 觸發 D2

### 3.2 尚未實作

- **D3** `download-fileurl-invalid-format`：❌ 未實作（validate-content.js L464 註釋明示「不檢查 URL format / preview URL risk」屬 am-9+ 範圍）。
- **S1** `download-content-should-be-noindex`：❌ 未實作。
- **S2** `download-content-marked-index`：❌ 未實作。

### 3.3 持續 deferred（registry-gated）

- **F1** `download-formref-missing`：❌ deferred；`formRef` 欄位 schema 未定義；FormConfig registry 未建立。
- **F2** `download-formref-not-found`：❌ deferred；同 F1。
- **A1** `download-assetrefs-invalid-type`：❌ deferred；`assetRefs[]` schema 未定義。
- **A2** `download-assetrefs-empty`：❌ deferred；同 A1 + outstanding decision「是否允許純表單流」未裁決。
- **A3** `download-assetref-not-found`：❌ deferred；同 A1。
- **D4** `download-fileurl-reachability-not-checked`：non-rule 宣告；validator 永遠不做網路 reachability check（per am-1 §3）。

---

## 4. Source / Content Evidence Reviewed

read-only 讀取（per 指示文允許範圍）：

| 檔案 | 狀態 | 用途 |
|------|------|------|
| `src/scripts/validate-content.js` | ✅ 已讀（1118 行） | 確認 D1 / D2 既落地 pattern；確認 `READY_STATUS` / `VALID_SEO_INDEXING` / `invalid-seo-block` / `invalid-seo-indexing` 既有檢查；確認 sourcePath / value 之 issue object shape |
| `content/templates/blogger-download-template.md` | ✅ 已讀（87 行） | 確認 template 仍以 `download.fileUrl: ""` 為 placeholder；`seo` 區塊**未**出現於 template；`status: "draft"` 預設 |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | ✅ 已讀（70 行） | 唯一 download 文章（draft）；`download.fileUrl: ""`；**未**設 `seo.indexing`；status=draft → 不進 ready/published-only validation |
| `content/validation-fixtures/blogger/posts/_test-download-enabled-fileurl-empty.md` | ✅ 已讀（22 行） | D1 negative fixture；status=ready；觸發 `download-enabled-fileurl-empty` |
| `content/validation-fixtures/blogger/posts/_test-download-fileurl-invalid-type.md` | ✅ 已讀（24 行） | D2 negative fixture；status=ready；觸發 `download-fileurl-invalid-type` |
| `docs/20260530-download-validation-warning-source-implementation-preanalysis.md`（am-5） | ✅ 已讀（510 行） | 引用 D3 / S1 / S2 implementation pseudo；§7.1 / §7.2 |
| `docs/20260530-download-validation-warning-fixture-design-preanalysis.md`（am-3） | ✅ 已讀（464 行） | 引用 §6 warning id / message copy；§7 error vs warning boundary；§8 fixture strategy |
| `docs/20260530-download-validation-rules-preanalysis.md`（am-1） | ✅ 已讀（320 行） | 引用 §3 D1–D4 / §4 S1–S2 / §5 F-A regstry-dependent / §7 rollout |
| `docs/20260529-download-landing-page-schema-preanalysis.md`（pm-16） | ✅ 部份讀（前 100 行） | §4 確認下載流程；landing page 為 noindex 中繼頁；fileUrl 非 form URL |
| `docs/20260529-reverse-utm-fixture-publish-readiness-preanalysis.md` | ✅ 確認存在（檔名解 ambiguity） | 屬 reverse UTM dormant context；本 phase 不啟動 |
| `src/scripts/build-github.js` L280–L308 | ✅ 部份讀 | 確認 robots meta precedence：(1) `post.seo.indexing` explicit → (2) `contentKind === 'download'` fallback `noindex, follow` → (3) default `index, follow` |
| `src/scripts/build-sitemap.js` L125–L131 | ✅ grep 確認 | `seoIndexing !== 'index' && contentKind === 'download'` → exclude from sitemap（SEO-1 fallback） |
| `package.json` | ✅ 已讀（46 行） | `validate:content` script；既有依賴；無 npm install 需求 |

### 4.1 missing-but-non-blocking

- 無。本 phase 所列檔案皆存在且可讀。
- 指示文中之 `docs/20260529-download-landing-page-schema-preanalysis.md` 全文較長，僅讀前 100 行（足以確認 §4 flow 與 noindex 設計），未影響本 phase 決策。

---

## 5. D3 Decision: `download.fileUrl` Format Scope

### 5.1 問題重述

D3 之目的：當 `download.fileUrl` 為非空字串但格式不合 URL 期望時，發出 warning 提示作者。

### 5.2 與 D1 / D2 之邊界

| 情境 | 由哪條規則接住 |
|------|--------------|
| `download.fileUrl === undefined` 且 D1 觸發條件全滿足（contentKind=download / enabled=true / ready or published） | ✅ D1 接住 |
| `download.fileUrl === ""` / whitespace-only string + D1 觸發條件全滿足 | ✅ D1 接住 |
| `download.fileUrl !== undefined` 且非 string（number / null / array / object / boolean） | ✅ D2 接住 |
| `download.fileUrl` 為 non-empty trimmed string 但格式不符 URL | ❌ **無 rule 接住**（本節討論之 D3 範圍） |

確認結論：
- **empty string 已由 D1 處理**（contentKind=download + enabled=true + ready/published）；D3 不重做。
- **non-string 已由 D2 處理**；D3 不重做。
- **D3 唯一新增涵蓋面 = non-empty trimmed string + 格式不合 URL**。

### 5.3 URL 形式邊界（候選 regex）

下表為候選格式邊界與其風險評估：

| 候選邊界 | 範例「合法」字串 | 範例「不合法」字串 | 風險 |
|---------|----------------|------------------|------|
| **B-strict**：僅 `^https?://`（http / https） | `https://drive.google.com/...` / `http://example.com/foo.pdf` | `not-a-url` / `ftp://x` / `/downloads/foo.zip` / `mailto:a@b` | 🟢 簡單；但**誤殺**未來相對路徑（如 `/downloads/foo.zip`） |
| **B-strict+rel**：`^https?://` **OR** `^/[^/]` （站內相對路徑，以單一斜線開頭） | 上 + `/downloads/foo.zip` / `/assets/practice.pdf` | `not-a-url` / `mailto:a@b` / `tel:1234` / `javascript:...` / `data:...` / `ftp://x` / `./relative` | 🟡 較寬；相對路徑允許性尚未在 docs 中正式裁決 |
| **B-loose**：`^https?://` **OR** `^/[^/]` **OR** `^[a-z][a-z0-9.+-]*:` | 上 + `mailto:` / `tel:` / `magnet:` 等 | `not-a-url` / `./relative` / `../foo` / 純文字 | 🔴 過寬；無提示力；`mailto:` / `tel:` 不應作為下載 URL |
| **B-very-loose**：放棄格式檢查，只檢查 non-empty | 任意 non-empty | 純空白 | 🔴 D3 失去語意；退化為 D1 subset |

### 5.4 outstanding 子問題逐一裁決

- **是否允許 `http` / `https`？** → ✅ 應允許（為實際下載 URL 之主要形式）。
- **是否允許 Google Drive share URL？**（`https://drive.google.com/file/d/<id>/view?usp=sharing`）
  - **格式層面**：✅ 允許（為 `https://` 開頭，符合 B-strict）。
  - **語意層面**：share URL 通常為 preview / view 頁，非 direct download；屬下節 §6 之 preview URL risk 範圍，不在 D3 處理。
- **是否允許 Google Drive direct download URL？**（`https://drive.google.com/uc?export=download&id=<id>`）
  - **格式層面**：✅ 允許（`https://` 開頭）。
  - **語意層面**：✅ 較理想；validator 不主動「強迫」採此形式（無 share-url-prefer-direct rule）。
- **是否允許 relative path？**（`/downloads/foo.zip`）
  - **格式層面 + 語意層面**：🟡 **未在 docs 中正式裁決**。am-1 §3 D3 註記「未決問題：是否允許相對路徑（如 `/downloads/foo.zip`）。本 phase **不**裁決；留待規則實作 phase 同時定稿」。本 docs 仍**不**最終裁決；建議 D3 推遲到此項裁決完成後再實作。
- **是否允許 Blogger / GitHub 內部路徑？**
  - **狀態**：repo 目前**無**將 fileUrl 解作站內路徑之 production case；既有 draft post 與 template 全為 `""`。
  - **建議**：與 relative path 同處理；推遲。
- **是否允許 `mailto:` / `tel:` / `javascript:` / `data:` URL？**
  - **mailto:** / **tel:**：語意上不適合作為下載 URL（為通訊協定，無 download asset 概念）。
  - **javascript:**：明確不可（XSS / 安全紅線）；validator 應警告。
  - **data:**：語意上可承載 inline asset，但極不適合 frontmatter（base64 過長；違反 schema 簡潔）。
  - **建議**：B-strict 之 regex 即可自然排除（不命中 `^https?://`）；不需為這些 scheme 各自寫獨立 warning。

### 5.5 是否只對 ready / published 生效？

- **建議**：D3 採與 D2 一致之觸發範圍 = **ready / published only**（per validate-content.js 既有 D1 / D2 限定 `READY_STATUS` block）。
- 理由：
  - D2 已限定 ready/published；D3 為 D2 之後續欄位檢查，範圍應一致。
  - draft 文章作者可能尚在 typing；對 draft 發 format warning 屬 noise。
  - 既有 baseline 中 draft download post（`20260529-phonics-practice-sheet-download.md`）`fileUrl: ""` → 不觸發 D3（D3 要求 non-empty）。

### 5.6 是否應對 validation fixtures 生效？

- 既有 D1 / D2 fixtures 已 `status: "ready"` → 會被 validator 掃。
- D3 若實作 → 需 1 個 negative fixture（per §10）：`fileUrl` 為 `"not-a-url"` 之 ready download post。
- 既有 D1 / D2 fixtures **不會**被 D3 額外觸發（D1 fixture fileUrl=`""` 不命中 D3 non-empty；D2 fixture fileUrl=`123` 非 string 由 D2 接走 → D3 條件本身要求 string；mutually exclusive）。

### 5.7 是否需要先有 real fileUrl policy 才能實作？

- **需要部分裁決**：相對路徑 / 站內路徑允許性影響 regex 範圍。但**無需**等 download landing page source 落地（D3 純 frontmatter 結構檢查，不依賴 build / render）。
- **建議**：在 D3 source phase 啟動前**獨立**裁決「relative path 允許性」一題；其他子問題（http / https / drive URL）已於 §5.4 內裁決。

### 5.8 conservative recommendation

| 子建議 | 內容 |
|--------|------|
| 是否實作 D3 | 🟡 **defer**（推遲至下一個 docs-only phase 把 relative path 允許性裁決後，再進 source phase） |
| 若實作，採用之 regex 邊界 | **B-strict（僅 `^https?://`）** —— 最保守；風險「相對路徑被誤殺」由 docs 裁決後再升級至 B-strict+rel |
| 觸發範圍 | ready / published only |
| fixture | 1 個 negative（`_test-download-fileurl-invalid-format.md`；fileUrl=`"not-a-url"`） |
| source + fixture 是否同 PR | ✅ 同 PR（Option B per am-5 §10.6） |

---

## 6. Preview URL / Google Drive Risk Decision

### 6.1 問題重述

Google Drive 之多種 URL 形式：

| URL 形式 | 範例 | 用途 |
|---------|------|------|
| **share URL** | `https://drive.google.com/file/d/<id>/view?usp=sharing` | 開啟 Drive 預覽頁；使用者需點按 "Download" 才取得檔案 |
| **preview embed URL** | `https://drive.google.com/file/d/<id>/preview` | iframe 內嵌預覽；不直接下載 |
| **direct download URL** | `https://drive.google.com/uc?export=download&id=<id>` | 直接觸發下載（可能仍跳 confirm 頁，視檔案大小） |
| **folder URL** | `https://drive.google.com/drive/folders/<id>` | 開啟資料夾頁；非單檔下載 |

### 6.2 各 URL 之語意問題

| URL 類型 | 是否適合作為 `download.fileUrl` | 風險 |
|---------|--------------------------------|------|
| share URL | 🟡 可作為「使用者導向 Drive 自行下載」之 URL；但**不是**直接下載入口 | 🟡 中：使用者體驗從 article CTA → Drive view 頁 → click Download → 取得檔案，多 1 步；行為層不易區分 |
| preview embed URL | ❌ **不適合**作為單檔下載 URL（內嵌預覽用） | 🔴 高：作者可能誤填，導致 download box link 開啟 iframe 預覽而非下載 |
| direct download URL | ✅ 較理想；單擊即下載 | 🟢 低 |
| folder URL | 🟡 可作為「多檔包」之入口，但語意接近 landing page，非單檔資產 | 🟡 中 |

### 6.3 是否應由 `validate:content` 負責 preview URL 偵測？

- **不應**。理由：
  - validate-content 之既有定位為 **deterministic / offline-safe 結構檢查**；URL semantic class 屬語意分析，本質上需要 external knowledge（Google Drive URL pattern 並非 W3C 標準）。
  - Google Drive URL 規則可能隨時間變動；validator regex 維護成本高、易誤報。
  - 既有 `D4` non-rule 宣告（per am-1 §3）已明示 validator 不做 reachability；preview vs direct download 與 reachability 性質類似，皆屬「需驗證行為」而非「驗證 schema」。
- **外部 reachability check** 必要嗎？
  - 若要區分 preview vs direct download，仍需 external HTTP HEAD 才能確認（且 Drive 通常會 redirect）；validate-content 永不做此檢查。
  - 屬獨立 `check-broken-links.js` 或 manual gate 範疇。

### 6.4 是否需要等 fileUrl policy / asset registry / form flow 決定後再做？

- **是**。理由：
  - 若未來 DownloadAsset registry 落地（per pm-16 §5），asset 之 `storage` / `delivery mode` 將 explicit 記錄；validator 可改採「asset registry lookup → 由 registry 之 `delivery mode` 欄位提示 preview risk」之路徑，**不**再走 URL regex。
  - 在 registry 落地前自造 Google Drive URL 規則屬 throwaway code；維護負擔高。

### 6.5 conservative recommendation

| 選項 | 推薦度 |
|------|--------|
| ❌ 不做（不納入 D3，不另列 future warning） | ❌ 過保守；忽略已知 risk |
| 🟡 併入 D3（D3 regex 額外排除 `/preview` 後綴） | ❌ 不推薦；D3 為「格式不合」面向，preview risk 為「semantic class」面向；混做會讓 D3 規則語意不清 |
| ✅ **另列 future rule**（如 `download-fileurl-preview-url-risk`）+ **僅 docs-only policy 段**，**不**實作 validator | ✅ **推薦** |
| 🟡 只做 docs policy（記錄「不應用 preview URL」），完全不做 validator | 🟡 可接受；可作為 future rule 啟動前之中繼狀態 |

**最終建議**：
- **本 phase 不裁決最終形式**；僅記錄為 future warning 候選（命名草案 `download-fileurl-preview-url-risk`）。
- 候選實作時機：DownloadAsset registry 落地後，改以 registry lookup 判斷，**不**走 URL regex。
- 在 registry 落地前，記錄為 docs-only policy（per CLAUDE.md §13 或新增 docs/download-fileurl-policy.md，命名待定），**不**在 validator 落地。

---

## 7. S1 / S2 Decision: noindex Rule Scope

### 7.1 既有行為層（build 端 fallback）盤點

- `src/scripts/build-github.js` L290–L308：
  - 優先序：(1) `post.seo.indexing` explicit → (2) `contentKind === 'download'` fallback `noindex, follow` → (3) default `index, follow`
  - `post.seo.indexing === 'index'` → `index, follow`
  - `post.seo.indexing === 'noindex-follow'` → `noindex, follow`
  - `post.seo.indexing === 'noindex-nofollow'` → `noindex, nofollow`
- `src/scripts/build-sitemap.js` L125–L131：
  - `seoIndexing !== 'index' && contentKind === 'download'` → 排除於 sitemap
  - 即：download content 若 explicit `seo.indexing: index` → **進** sitemap（與 robots meta `index, follow` 一致）；若任何其他狀態 → **排除**
- 既有 `validate-content.js` 已有：
  - `invalid-seo-block`：`post.seo` 存在但非 plain object → warning
  - `invalid-seo-indexing`：`post.seo.indexing` 存在但非 string / 不在 `VALID_SEO_INDEXING = { 'index', 'noindex-follow', 'noindex-nofollow' }` → warning

### 7.2 S1 / S2 之候選觸發條件

| 規則 | 觸發條件草案 | 與既有規則互動 |
|------|------------|-------------|
| S1 (option α) `download-content-should-be-noindex` | `contentKind === 'download'` 且 `seo.indexing` undefined（既有 fallback 雖 cover；但 frontmatter 未顯式宣告） | 與 `invalid-seo-block` / `invalid-seo-indexing` 互斥（既有規則優先；不重複） |
| S1 (option β) | `contentKind === 'download'` 且 (`seo.indexing` undefined 或 `seo.indexing === 'index'`)；即 **S1 ∪ S2 合併** | 同上 |
| S2 `download-content-marked-index` | `contentKind === 'download'` 且 `seo.indexing === 'index'` | 同上；若 S1 採 option β → S2 取消（合併） |

### 7.3 outstanding 子問題逐一裁決

- **download content 是否預設應 noindex？**
  - ✅ **是**。per pm-12 §4 / pm-16 §4 / am-1 §4：download landing page 為 noindex 中繼頁；download content（即使非 landing page）通常不應作為搜尋直達入口。
  - 行為層已 fallback：build-github.js + build-sitemap.js 對 `contentKind=download` 採 noindex + 排除 sitemap。
- **判斷欄位是什麼？**
  - `post.seo.indexing`（per validate-content.js `VALID_SEO_INDEXING`）。
  - **不**使用 `seo.noindex`、`robots`、template / build fallback 欄位（後者為行為層 fallback，**不**屬 frontmatter 欄位）。
- **現有 repo 實際欄位狀態？**
  - template `blogger-download-template.md`：**未**設 `seo.indexing` 與 `seo` block。
  - draft post `20260529-phonics-practice-sheet-download.md`：**未**設 `seo.indexing`。
  - 既有 baseline 中**無**任何 ready/published download post → S1 / S2 對既有 production content **皆不觸發**（status 過濾）。
- **S1 與 S2 是否需要分開？**
  - 看分開的「語意是否實質不同」：
    - S1（undefined）→「請顯式宣告 noindex，不要依賴 fallback」
    - S2（index）→「download 不應為搜尋直達入口；請改 noindex 或重新確認 contentKind」
  - 兩者 remediation hint 不同；分開可提供更精確之提示文字。
  - 但兩者皆為「download SEO consistency」之同一面向，合併（option β）也可接受。
- **S1 觸發條件**：見表格（兩 option）。
- **S2 觸發條件**：見表格。
- **若 seo.indexing missing，是否 warning？**
  - **建議**：✅ warning（S1 觸發）—— 讓 frontmatter 顯式宣告 noindex，降低未來 build fallback 行為被誤改之風險。
- **若 seo.indexing = index，是否 warning？**
  - **建議**：✅ warning（S2 觸發或 S1 ∪ S2 合併觸發）。download content 顯式 index 屬語意衝突。
- **若 seo.indexing = noindex-follow / noindex-nofollow，是否 pass？**
  - **建議**：✅ pass。作者顯式宣告 noindex 屬正確意圖。
- **是否只對 ready / published 生效？**
  - **建議**：✅ ready / published only（mirror 既有 SEO-related warning pattern；如 `missing-description`）。
  - 對 draft / fixture：loadPosts 已過濾 draft；fixture 之 status=ready 會被掃。
- **是否與 build-sitemap / robots meta 行為一致？**
  - ✅ 一致：
    - S1 / S2 採 `contentKind=download` 為觸發前提 → 與 build-github / build-sitemap 之 `contentKind=download` fallback 條件一致。
    - S1 / S2 之 `seo.indexing` 列舉值與 `VALID_SEO_INDEXING` 一致 → 不會出現「validator pass 但 build 端 fallback」之 mismatch。
    - 若 build 端 fallback 未來變更（如改為 `noindex-nofollow`），S1 之 remediation message 之「fallback noindex-follow applies」字串需同步更新（per am-5 §11.4 risk）。

### 7.4 與既有 `invalid-seo-block` / `invalid-seo-indexing` 之互斥策略

- **既有規則優先**：若 `invalid-seo-block` 或 `invalid-seo-indexing` 已觸發（`seo` 非 plain object 或 `seo.indexing` 為列舉外值）→ S1 / S2 不再 push，避免重複噪音。
- 此策略已於 am-5 §7.2 pseudo 中標明；本 phase 沿用。

### 7.5 conservative recommendation

| 子建議 | 內容 |
|--------|------|
| 是否實作 S1 / S2 | 🟡 **defer** 至 D3 之後；S1 / S2 之 outstanding decision（合併與否）建議在獨立 docs-only 子 phase 再裁決 |
| S1 / S2 是否合併 | 🟢 **建議合併**（option β）：一條規則涵蓋「undefined 或 index」；message copy 動態根據實際值；fixture 用 2 個（covers undefined 與 index 兩 case）；但 baseline 變動可預測 |
| 若不合併之替代方案 | S1（undefined）+ S2（index）各自獨立；fixture 各 1 個；baseline +2 |
| 觸發範圍 | ready / published only |
| 與既有規則互斥策略 | 既有 `invalid-seo-block` / `invalid-seo-indexing` 優先 |
| fixture 是否需要 | ✅ negative fixture（合併 → 1~2 個；不合併 → 2 個各對應一條） |
| source + fixture 是否同 PR | ✅ 同 PR（Option B per am-5 §10.6） |

---

## 8. Candidate Rule Matrix

| Rule | purpose | trigger condition | status gate | dependencies | risk | fixture required | expected baseline impact | implementation readiness | recommendation |
|------|---------|-------------------|-------------|--------------|------|-----------------|------------------------|------------------------|---------------|
| **D3** `download-fileurl-invalid-format` | 提示 `download.fileUrl` 非空但格式不合 URL | `download` 為 plain object 且 `download.fileUrl` 為 non-empty trimmed string 且不符 B-strict regex（`^https?://`） | ready / published only | outstanding decision：relative path 允許性未裁決 → 影響 regex 邊界 | 🟡 中：regex 過嚴誤殺未來合法相對路徑 | ✅ 1 個 negative（`_test-download-fileurl-invalid-format.md`） | **+1**（44 → 45 / 39 → 40） | 🟡 **half-ready**（需先裁決 relative path） | **defer at minimum 1 docs phase**；建議先做「relative path allowance decision docs-only」後再啟動 D3 source |
| **preview-url-risk** `download-fileurl-preview-url-risk`（命名草案） | 提示 Google Drive preview URL 不適合作為下載入口 | `download.fileUrl` 命中 Drive preview URL pattern（`/file/d/.../preview` 或類似） | ready / published only | 🔴 **registry-dependent**：DownloadAsset registry 落地後改以 registry lookup；regex 為 throwaway | 🔴 高：Drive URL pattern 易變；regex 維護成本高 | 🟡 暫不需要 fixture；若 docs-only policy 則完全不需 fixture | 0（若不實作 validator） | ❌ **NOT ready** | **不實作 validator**；改為 **docs-only policy**（記錄於 CLAUDE.md §13 或新 docs）；future rule 候選 |
| **S1** `download-content-should-be-noindex`（option α）或合併 option β | 提示 download content 未顯式 noindex；可選擴張至 index 之情境 | option α：`contentKind === 'download'` 且 `seo.indexing === undefined`；option β：`contentKind === 'download'` 且（`seo.indexing === undefined` 或 `seo.indexing === 'index'`） | ready / published only | 與 `invalid-seo-block` / `invalid-seo-indexing` 互斥（既有規則優先） | 🟡 中：build 端 fallback 行為若改，S1 message 須同步 | ✅ negative：option α 1 個（covers undefined）；option β 2 個（covers undefined + index） | option α：**+1**；option β：**+2** | 🟡 **half-ready**（需先裁決合併與否） | **defer 至 D3 source 之後或同 phase 一併裁決** |
| **S2** `download-content-marked-index`（若獨立於 S1） | 提示作者顯式把 download content 設成 `seo.indexing=index` | `contentKind === 'download'` 且 `seo.indexing === 'index'` | ready / published only | 同 S1；若 S1 採 option β → S2 取消 | 🟡 中（同 S1） | ✅ negative 1 個（覆蓋 index case） | **+1**（若獨立） | 🟡 同 S1 | **建議併入 S1 option β**；不獨立 |

---

## 9. Warning ID / Message Copy Draft

> 僅草擬，不實作；正式字串由 implementation phase 同步裁決。

### 9.1 D3 — `download-fileurl-invalid-format`

| 項目 | 內容 |
|------|------|
| warning id | `download-fileurl-invalid-format` |
| concise English message（建議 `value`） | `download.fileUrl="${url}" is not a valid http(s) URL` |
| 中文解釋 | `download.fileUrl` 不符合允許之 URL 形式（B-strict regex：`^https?://`）；目前作者填入 `${url}`，validator 視為非合法格式 |
| remediation hint | 確認 URL 開頭為 `http://` 或 `https://`；若日後接受相對路徑，須符合 implementation phase 定義之 prefix（命名待定） |
| 是否輸出 `sourcePath` / `value` / field path | ✅ `sourcePath`；✅ `value`（含實際 URL）；🟡 field path（`download.fileUrl`）隱含於 type id 與 value 字串 |
| 是否保留至後續 phase 才裁決 | ✅ 是（待 relative path 允許性裁決） |

### 9.2 preview-url-risk — `download-fileurl-preview-url-risk`（命名草案）

| 項目 | 內容 |
|------|------|
| warning id | `download-fileurl-preview-url-risk`（候選；或 `download-fileurl-drive-preview-warning` / 待議） |
| concise English message（建議 `value`） | `download.fileUrl appears to be a Google Drive preview URL (e.g. /file/d/<id>/preview); consider direct download URL` |
| 中文解釋 | `download.fileUrl` 命中 Google Drive preview URL 模式；preview URL 用於 iframe 內嵌，不直接觸發下載；建議改用 direct download URL（`https://drive.google.com/uc?export=download&id=<id>`） |
| remediation hint | 將 Drive URL 改為 direct download 形式；或維持 share URL（`/view?usp=sharing`），讓使用者於 Drive 自行 click Download |
| 是否輸出 sourcePath / value / field path | ✅ sourcePath；✅ value；🟡 field path |
| 是否保留至後續 phase 才裁決 | ✅ 是；**不實作 validator**；改為 docs-only policy |

### 9.3 S1 — `download-content-should-be-noindex`

| 項目 | 內容（option β 合併版） |
|------|----------------------|
| warning id | `download-content-should-be-noindex` |
| concise English message（建議 `value`，動態根據實際 indexing 值） | undefined case：`contentKind=download but seo.indexing not explicitly set (fallback noindex-follow applies; please declare explicitly)`；index case：`contentKind=download but seo.indexing="index" (download content should not be a search entry point)` |
| 中文解釋 | 本文 `contentKind=download`，行為層已 fallback `noindex, follow` + 排除 sitemap；但 frontmatter 之 `seo.indexing` 未顯式設定（或顯式設為 `'index'`），未來 fallback 變更時可能造成 SEO 行為意外飄移 |
| remediation hint | 在 frontmatter 顯式設 `seo.indexing: noindex-follow`；或若確實要可索引，請改 `contentKind` 並評估是否要照 download landing page 規格 |
| 是否輸出 sourcePath / value / field path | ✅ sourcePath；✅ value（含實際 indexing 值或 `(missing)`）；🟡 field path（`seo.indexing`） |
| 是否保留至後續 phase 才裁決 | ✅ 是；merge vs split 待裁決 |

### 9.4 S2 — `download-content-marked-index`（若獨立）

| 項目 | 內容 |
|------|------|
| warning id | `download-content-marked-index` |
| concise English message（建議 `value`） | `contentKind=download but seo.indexing="index" (download content should not be a search entry point)` |
| 中文解釋 | 作者顯式把 download content 設為 `seo.indexing=index`，與「下載文 / 下載頁不應成為搜尋直達入口」原則相違 |
| remediation hint | 改為 `noindex-follow`；若意圖讓**文章頁**保持可索引，請確認此筆內容是 article 而非 download landing page，並重新檢視 `contentKind` |
| 是否輸出 sourcePath / value / field path | ✅ sourcePath；✅ value；🟡 field path |
| 是否保留至後續 phase 才裁決 | ✅ 是；建議併入 S1（option β）→ 本規則取消 |

---

## 10. Fixture Strategy for Future Implementation

> **本 phase 不新增任何 fixture**。本節為**未來** fixture-add 之預先記錄。

### 10.1 各規則 fixture 需求

| 規則 | negative fixture 是否需要 | positive fixture 是否需要 | 建議路徑 | 建議 filename |
|------|-------------------------|-------------------------|---------|--------------|
| D3 | ✅ 是 | ❌（合法 https URL 為 implicit positive） | `content/validation-fixtures/blogger/posts/` | `_test-download-fileurl-invalid-format.md` |
| preview-url-risk | ❌ 不實作 validator → 不需要 fixture | n/a | n/a | n/a |
| S1（option α，undefined） | ✅ 是 | ❌ | 同 | `_test-download-content-no-seo-indexing.md` |
| S1 ∪ S2（option β 合併） | ✅ 2 個（undefined + index 各 1） | ❌ | 同 | `_test-download-content-no-seo-indexing.md` + `_test-download-content-marked-index.md` |
| S2（若獨立） | ✅ 是 | ❌ | 同 | `_test-download-content-marked-index.md` |

### 10.2 最小 frontmatter（mirror am-3 §8.2 + 既有 D1 / D2 fixture pattern）

通用最小集：

```yaml
title: "[validation-fixture] <rule descriptor>"
slug: "test-<kebab-rule-id>"
status: "ready"
draft: false
date: "2026-MM-DD"
description: "<phase> fixture：故意觸發 <warning-id> warning。"
contentKind: "download"
site: "blogger"
primaryPlatform: "blogger"
category: "download"
tags: ["download"]
cover: "/images/placeholders/cover.png"
```

規則特定欄位：

- D3：`download: { enabled: true, fileUrl: "not-a-url" }`
- S1（undefined）：**不**設 `seo` block（or 設 `seo: {}` 但 `seo.indexing` undefined）；download: { enabled: true, fileUrl: "https://example.com/foo.pdf" }（為避免同時觸發 D1）
- S2（index）：`seo: { indexing: "index" }`；download: { enabled: true, fileUrl: "https://example.com/foo.pdf" }

### 10.3 baseline 預期變化

| 落地組合 | posts +N | warnings +N | baseline（從 44/39） |
|---------|---------|------------|----------------------|
| 僅 D3 | +1 | +1 | **45 / 40** |
| 僅 S1（option α，undefined-only） | +1 | +1 | **45 / 40** |
| 僅 S1 + S2（合併 option β，2 fixtures） | +2 | +2 | **46 / 41** |
| 僅 S1 + S2（分離，2 fixtures） | +2 | +2 | **46 / 41** |
| D3 + S1 + S2（全合併 option β） | +3 | +3 | **47 / 42** |
| D3 + S1（option α）+ S2（獨立） | +3 | +3 | **47 / 42** |
| 僅 preview-url-risk（不實作 validator） | 0 | 0 | 44 / 39（不變） |

> 注意：S1 之 undefined-case fixture 的 `download.fileUrl` 須填合法 URL（如 `"https://example.com/foo.pdf"`），避免同時觸發 D1（D1 條件：enabled=true 且 fileUrl 為空）。若**未**設 download.enabled 或設 false，可避開 D1，但 S1 之觸發前提（contentKind=download）仍成立。實作時建議顯式設 `download.enabled: false` 或填合法 URL，二擇一即可。

### 10.4 是否需要 source + fixture 同 phase

- ✅ **是**。沿用 am-5 §10.6 / am-3 §8 / am-7 既有 cadence：source 與 fixture 必須同 PR 落地（Option B）。
- 若 D3 / S1 / S2 分多 phase 實作，每 phase 自己之 source + fixture 必須同 PR。

---

## 11. Recommended Implementation Split

> **保守 phase split**；每步皆 additive、可獨立驗證、可 dormant；任一步皆須**獨立 phase + user explicit approval**。

| 序 | 候選 phase | 性質 | 涵蓋規則 | 是否本 phase 啟動 | 預期 baseline |
|---|-----------|------|---------|-----------------|---------------|
| am-9（本 phase） | `download-validation-d3-s1-s2-decision-preanalysis-docs-only` | docs-only | n/a（本 phase 交付決策） | 🟡 **本 phase 完成新增** | 44 / 39 不變 |
| am-10（建議下一 phase） | `download-validation-d3-s1-s2-decision-preanalysis-acceptance-read-only` | read-only | n/a（驗證 am-9 docs 內部一致性、與 D1 / D2 implementation 不衝突） | ❌ 不啟動 | 44 / 39 不變 |
| am-11 | `download-validation-d3-relative-path-allowance-decision-docs-only` | docs-only | D3 之 relative path 允許性裁決 | ❌ 不啟動 | 44 / 39 不變 |
| am-12 | `download-validation-d3-source-implementation` | source change（warning-only additive）+ fixture | D3 only | ❌ 不啟動 | 預期 **45 / 40** |
| am-13 | `download-validation-d3-source-implementation-acceptance-cross-check` | read-only | n/a | ❌ 不啟動 | 45 / 40 不變 |
| am-14 | `download-validation-s1-s2-merge-decision-docs-only` | docs-only | S1 / S2 合併與否裁決 | ❌ 不啟動 | 45 / 40 不變 |
| am-15 | `download-validation-s1-s2-source-implementation` | source change（warning-only additive）+ fixture | S1（合併版）或 S1 + S2（分離版） | ❌ 不啟動 | 預期 **46 / 41**（合併版）或 **47 / 42**（分離版） |
| am-16 | `download-validation-s1-s2-source-implementation-acceptance-cross-check` | read-only | n/a | ❌ 不啟動 | 46 / 41 或 47 / 42 不變 |
| later | `download-fileurl-preview-url-risk-docs-policy` | docs-only policy（不實作 validator） | preview-url-risk | ❌ 不啟動 | 不變 |
| later | registry-dependent F / A rules | source change + registry | F1 / F2 / A1 / A2 / A3 | ❌ 不啟動 | TBD |

### 11.1 明確聲明

- **不建議下一 session 直接一次實作 D3 + preview-url-risk + S1 + S2**。
- 理由：
  1. D3 之 relative path 允許性 outstanding decision 未裁決；若混做會把 decision risk 塞進 implementation PR。
  2. preview-url-risk 涉及 Google Drive URL pattern 與 registry-dependent 設計；若以 regex 路徑落地會產生 throwaway code。
  3. S1 / S2 之合併與否 outstanding decision 未裁決；分多次 source phase 會破壞 reviewer 容易核對之 baseline 變動原因單一性。
  4. 既有 cadence（am-5 → am-6 → am-7 → am-8）已驗證「docs-only → acceptance → source + fixture → acceptance」之四步式為穩定 pattern；本系列保持一致。
- **若要 source implementation，必須另開 phase 並取得 explicit approval。**

### 11.2 推薦 next phase

**am-10**（read-only acceptance cross-check）→ 確認本 docs 內部一致 + 與 D1 / D2 source / docs / fixture 不衝突 → 再進 am-11 之 D3 relative path 裁決。

---

## 12. Risk Analysis

### 12.1 URL format 過嚴造成有效下載連結被誤報

- 風險：D3 採 B-strict（僅 `^https?://`）→ 未來合法相對路徑（如 `/downloads/foo.zip`）被誤判為 invalid。
- 緩解：D3 啟動前先在 am-11 裁決 relative path 允許性；若允許，採 B-strict+rel；若不允許（採 B-strict），則於 docs 明示 fileUrl 必須為 http(s) 絕對 URL。

### 12.2 URL format 過寬造成 preview / 不可下載 URL 放行

- 風險：D3 採 B-loose 或更寬 → 喪失提示力；preview URL / mailto: / javascript: 等明顯不合適值放行。
- 緩解：採 B-strict 為 default；preview risk 由獨立 future rule 或 docs policy 處理（per §6）。

### 12.3 Google Drive 權限 / reachability 不是 validate:content 可驗證

- 風險：作者填的 Drive URL 可能私人權限或失效 → 使用者無法下載；validator 無從偵測。
- 緩解：D4 non-rule 宣告已明示 validator 不做 reachability；屬 manual gate 或 `check-broken-links.js` 範疇。

### 12.4 relative path policy 未定

- 風險：D3 落地之 regex 邊界與未來 relative path 規則不一致。
- 緩解：am-11 docs-only 先裁決；不在本 phase 內裁決。

### 12.5 noindex 欄位來源不一致

- 風險：S1 / S2 採 `seo.indexing` 為判斷欄位；但作者可能誤以為 `seo.noindex` / `robots` 是欄位 → S1 / S2 不會觸發即使作者意圖 noindex。
- 緩解：在 am-15 source phase 之 docs（commit message / S1 fixture body）明示 `seo.indexing` 為唯一欄位；不接受 alias 欄位。

### 12.6 build sitemap / robots meta 與 validator 判斷不一致

- 風險：S1 message 寫「fallback noindex-follow applies」假設 build 行為不變；若 build 端 fallback 改為 noindex-nofollow，message 須同步。
- 緩解：S1 source phase 之 commit message 須註明 build 端 fallback 來源；future build 端變更必須同步更新 S1 message（屬 docs cadence）。

### 12.7 fixture warning baseline 變動

- 風險：S1 之 undefined-case fixture 若不慎同時觸發 D1（contentKind=download + enabled=true + 空 fileUrl）→ baseline +2 而非 +1。
- 緩解：fixture 之 `download.enabled` 設 false 或填合法 URL（per §10.3 注意事項）；落地前以 `validate:content` 確認實際 baseline 變動。

### 12.8 D3 / S1 / S2 一次混做造成 regression 定位困難

- 風險：若一個 PR 一次落地三條規則 → baseline 變動 +3，若實際與預期不符（如 +2 / +4），難以回溯到單一規則之 bug。
- 緩解：分 am-12（D3）/ am-15（S1 / S2）兩個 source phase；每 phase 落地後 acceptance cross-check 再進下一 phase。

---

## 13. Non-goals

本 phase 明確**不做**：

- ❌ no source implementation
- ❌ no `src/scripts/validate-content.js` change
- ❌ no fixture（不新增 `_test-*.md`）
- ❌ no content publish / no `draft → ready`
- ❌ no `download.fileUrl` fill
- ❌ no settings registry file creation
- ❌ no download landing page source
- ❌ no template 改動
- ❌ no deploy（不 `npm run build:*`、不 push gh-pages、不改 dist）
- ❌ no Blogger repost
- ❌ no GA4 validation
- ❌ no reverse UTM activation
- ❌ no pm-26 deploy gate unblock
- ❌ no Admin Apply enable
- ❌ no middleware write route enable
- ❌ no admin-write-cli dry-run / apply
- ❌ no fourth SEO write
- ❌ no `npm install`
- ❌ no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`
- ❌ no am-7 D1 / D2 implementation 變更

本檔落地後 production state drift = 0；屬純 docs entry。唯一變更為新增本 docs 檔。

---

## 14. Final Recommendation

### 14.1 各規則最終建議

| 規則 | 最終建議 |
|------|---------|
| **D3** `download-fileurl-invalid-format` | 🟡 **defer**：先做 am-11 「relative path 允許性裁決 docs-only」phase；再做 am-12 「D3 source + fixture」phase。建議採 B-strict（`^https?://`）為 default；若 am-11 裁決允許 relative path → 升級至 B-strict+rel |
| **preview-url-risk** `download-fileurl-preview-url-risk` | ❌ **不實作 validator**；改為 **docs-only policy**（記錄於 CLAUDE.md §13 或新 docs/download-fileurl-policy.md，命名待定）。理由：(1) validator 不適合做 semantic class；(2) Google Drive URL pattern 易變；(3) DownloadAsset registry 落地後改用 registry lookup，URL regex 為 throwaway |
| **S1 / S2** | 🟢 **建議合併**（option β）：一條規則 `download-content-should-be-noindex` 涵蓋 `seo.indexing` undefined 或 `'index'`；message 動態根據實際值。若 user 偏好分離 → 接受 option α（S1 undefined-only）+ S2（index）獨立。defer 至 am-15 source phase；先在 am-14 docs-only 裁決合併與否 |

### 14.2 是否應先做 read-only acceptance cross-check？

- ✅ **應先做**。建議下一 phase 為 **am-10 read-only acceptance cross-check**：另開獨立 phase，read-only 驗 baseline、read-only 確認本文件 §5 / §6 / §7 / §8 / §11 之內部一致性，且與 D1 / D2 之既有 source / fixture / docs **不**衝突。
- **不**建議在 acceptance cross-check 前直接跳 source implementation。

### 14.3 不得本 session 直接做 source implementation

- ✅ 本 phase 屬 docs-only decision preanalysis；嚴禁本 session 內修改 `src/scripts/validate-content.js` / 新增 fixture / 改 content / 改 settings。
- am-11 / am-12 / am-14 / am-15 / am-16 等後續 phase 之啟動須由 user 明確 approve；本 phase 僅完成決策固化。

### 14.4 本 phase 與其他凍結之關係

- reverse UTM remains **dormant**；本 phase 不啟動。
- pm-26 deploy gate remains **BLOCKED**；本 phase 不解除。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**；本 phase 不啟動。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守：本 phase 不引入任何 respondent data 通路、不把 `download.fileUrl` 與 Google Form URL 混為一談、不另造 SEO pipeline。
- am-7 D1 / D2 implementation 保持 frozen；本 phase 不重做、不調整、不退化。

### 14.5 Final Idle Freeze / EXIT

完成本 phase（新增單一 docs 檔 + commit + push + final verify）後，**建議 Final Idle Freeze / EXIT**，不啟動任何 follow-on phase。

---

（本文件結束）
