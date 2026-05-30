# 20260530 Download fileUrl Preview URL Risk Policy

> Phase: `20260530-night-7-download-fileurl-preview-url-risk-policy-docs-only-a`
> Date: 2026-05-30 22:05 +0800
> Scope: **docs-only**（無 source / content / settings / templates / package / fixture / dist / gh-pages 變更）

---

## A. Executive Summary

- 本文件**只**記錄 `download.fileUrl` 之 **preview URL risk policy**。
- 本文件**不**做 source implementation：
  - ❌ `src/scripts/validate-content.js` 一行不動
  - ❌ 不新增 validator rule
  - ❌ 不新增 fixture（`content/validation-fixtures/` 不動）
  - ❌ 不改 validate baseline
  - ❌ 不改任何 production post / draft fixture
  - ❌ 不碰 `formRef` / `assetRefs[]` / settings registry / Google Form / download landing page renderer
- **Google Form respondent data 不進 repo / Admin static files**（紅線 R1，per pm-20 §4；本文件不變動此紅線）。
- 本檔落地後 production state drift = 0；唯一變更為新增本 docs 檔。

### A.1 裁決一句話

> **preview-url-risk 為 docs-only authoring policy；validator 永不對其做 regex 或 reachability check。未來若要升級為 validator / Admin warning，必須先有 DownloadAsset registry 落地（per §F）。**

---

## B. Current Baseline

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `9aa790ea34adc2a87a3618ca9f9d2626b3fefafd` |
| origin/main | `9aa790ea34adc2a87a3618ca9f9d2626b3fefafd` |
| short hash | `9aa790e` |
| latest subject | `feat(validate): warn when download content is not noindex` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `validate:content` | **0 error(s) / 47 warning(s) on 42 post(s)** |

### B.1 已 landed download / SEO validation 規則

| 規則 | warning id | severity | 觸發範圍 | 狀態 |
|------|-----------|---------|---------|------|
| D1 | `download-enabled-fileurl-empty` | warning | ready / published（contentKind=download + enabled=true + fileUrl 空 / whitespace） | ✅ landed（am-7） |
| D2 | `download-fileurl-invalid-type` | warning | ready / published（fileUrl 非 undefined 且非 string） | ✅ landed（am-7） |
| D3 | `download-fileurl-invalid-format` | warning | ready / published（fileUrl non-empty trimmed string + 不符 `^https?://`） | ✅ landed（am-13） |
| S（S1/S2 merged） | `download-content-should-be-noindex` | warning | ready / published（contentKind=download + `seo.indexing` undefined 或 `index`） | ✅ landed（night-5） |

### B.2 尚未實作

- **preview-url-risk**：尚未實作 validator；本文件即裁決**暫不**實作，定位為 docs-only authoring policy。
- **F1 / F2 / A1 / A2 / A3**（formRef / assetRefs）：blocked by FormConfig / DownloadAsset registry schema 尚未定稿（per am-1 §5 / pm-20 §10）。

---

## C. Problem Statement

### C.1 `download.fileUrl` 目前 validator 涵蓋面

per `src/scripts/validate-content.js` 既有實作：

- D1：catch fileUrl 缺失 / 空字串 / whitespace-only。
- D2：catch fileUrl 型別非 string。
- D3：catch fileUrl 為 non-empty string 但**不**符合 `^https?://` 之 syntax。
- D4（non-rule，per am-1 §3）：validator **永不**做 reachability / network 檢查。

→ 目前 validator **不**檢查 fileUrl 之**語意**（是否為「使用者按下後可立即取得檔案」之穩定下載 URL）。

### C.2 preview URL 之風險面

Google Drive 提供多種公開 URL 形式，常見如：

```text
https://drive.google.com/file/d/<id>/view?usp=sharing
https://drive.google.com/file/d/<id>/preview
https://drive.google.com/open?id=<id>
https://docs.google.com/document/d/<id>/edit?usp=sharing
https://drive.google.com/uc?export=download&id=<id>
```

其中部分為「**預覽頁**」（如 `/view` / `/preview`）—— 使用者按下後抵達的是 Google Drive 嵌入式預覽介面，並**非**直接觸發檔案下載。

對於 download CTA 之 UX 預期（per CLAUDE.md §13 / pm-11 §3 之下載流程）：

- 使用者按下 download CTA 後應**直接取得檔案**或**抵達填表流程**。
- 若 fileUrl 指向預覽頁，使用者體驗會落到「先看到 Drive 預覽 UI、再手動按下載」之多步驟流程。
- 對於 **未來** download landing page 之表單 → 檔案配發流程，preview URL 屬語意上之風險（可能與表單後配發資產 URL 混淆）。

### C.3 為何**不**用 regex / validator 解決

- **Drive URL pattern 易變**：`/view?usp=sharing` / `/view?usp=share_link` / `/preview` / `/open?id=` / `/uc?export=download` 等變體繁多；validator regex 維護成本高、容易過嚴或過寬。
- **Google Drive 並非唯一語意風險來源**：Dropbox preview / OneDrive share / iCloud share / WeTransfer 等皆有類似 preview vs direct 區分；validator 無法窮舉所有第三方雲端服務之 URL pattern。
- **過嚴 regex 容易誤擋合法暫存做法**：作者可能於草稿期 intentionally 填入 Drive share URL 作為**暫存 placeholder**，待正式 release 前再換為 direct download URL；validator regex 若直接 warn 會干擾此暫存流程。
- **語意層判斷應靠 registry，非 URL pattern**：未來若 DownloadAsset registry 落地（per pm-16 §5 / pm-20 §13），registry entry 可 explicit 記錄 `deliveryMode`（如 `drive-direct` / `drive-share` / `drive-preview` / `external-cdn` / `internal`），validator 可改檢查 registry consistency，**不**需 reverse-engineer URL pattern。

---

## D. Policy Decision

### D.1 裁決

- **`download-fileurl-preview-url-risk` 暫不作為 validator warning rule。**
- **不**在 `src/scripts/validate-content.js` 實作 Google Drive / preview URL pattern check。
- **不**做 URL reachability check（沿用 am-1 §3 D4 non-rule 宣告：validator 永遠不做網路檢查）。
- **D3 維持 strict `^https?://` syntax check**（per am-11 §14.2）；preview URL 仍命中 D3 regex，故 D3 對 preview URL **pass**（屬語意層風險，不屬 syntax 範疇）。
- **preview URL 風險目前定位為 docs-only authoring policy**（即本文件）。
- 之後若要強化，應**優先**在 **DownloadAsset registry / `assetRefs[]` / `assetId`** model 落地後再討論，**不**回到 raw URL regex 路徑。
- **Google Drive HTTPS URL** 目前通過 D3 syntax，**不代表它一定是正式下載 URL**；只是 validator 不判斷語意。

### D.2 推薦理由

1. **與 am-9 §6.5 / am-11 §14 / night-5 §F 之既有 cadence 對齊**：preview-url-risk 早於 am-9 即被識別為「不應由 D3 regex 處理」，本文件將該方向固化為 docs-only policy。
2. **與 R2 紅線（per pm-20 §4）一致**：`download.fileUrl` 不混為 Google Form URL；R2 之機械化檢測同樣不在 D3 處理；preview-url-risk 與 form URL misuse 屬同類「語意層風險，待 registry 後處理」之問題。
3. **不破壞 baseline / 不擴張 cadence**：本決策不新增任何 validator rule，baseline 保持 0 errors / 47 warnings / 42 posts。
4. **保留 author 暫存 Drive share URL 之合法做法**：草稿期之 Drive share URL 為 acceptable workflow；validator 不干涉。
5. **避免 regex 維護負擔**：Drive URL pattern 易變；regex-based 檢查長期維護成本不成比例。

---

## E. Authoring Guidance

給未來內容維護 / Admin（若實作）/ 作者之建議：

### E.1 fileUrl 填寫原則

- `download.fileUrl` **應優先填**「使用者按下後可取得檔案」之穩定 URL。
- 推薦形式（依穩定性排序）：
  1. Google Drive direct download URL：`https://drive.google.com/uc?export=download&id=<id>`
  2. 外部 CDN / 託管直連 URL（如 GitHub Releases、Cloudflare R2、自架 S3）。
  3. （暫存 / 草稿期）Drive share URL：`https://drive.google.com/file/d/<id>/view?usp=sharing` —— 須於內容或管理文件**標記為 temporary / transitional**。
- **不推薦**：
  - Drive preview URL（`/preview`） —— 對 download CTA UX 不直觀。
  - Drive Office editor URL（`/edit`） —— 通常為文件編輯介面，非下載入口。
  - 純文字 / 無 scheme 之 URL —— D3 已 warn。

### E.2 暫存做法

- 草稿期若僅有 Drive share URL，可於：
  - 文章 body 內以 markdown comment / inline note 標記 `<!-- TODO: replace share URL with direct download URL before release -->`；或
  - 內容管理 issue tracker / 個人備忘錄記錄。
- 草稿期 fileUrl 為 share URL **不**觸發 validator warning（屬 acceptable workflow）。
- **promote 至 ready / published 前**應人工檢查 fileUrl 是否仍為 share URL；若是，視內容性質決定是否替換。

### E.3 多檔案下載

- 多檔案下載應**優先包 ZIP**，而不是多個散落 preview links。
- 單一 `download.fileUrl` 欄位語意為「**一個**下載入口」；多檔案放多個 URL 屬資料模型誤用。
- 未來若 DownloadAsset registry 落地，多檔案場景可由 registry 之 `assetRefs[]` 表達（per pm-16 §5），但**目前 frontmatter schema 不支援**；現階段以 ZIP 單檔包裝為標準作法。

### E.4 未來正式 download landing page

- 未來正式 download landing page **應導向**「內含表單的下載中繼頁」（per pm-11 §3 / pm-16 §4），**而非**把 Google Form public URL 直接塞進 `download.fileUrl`。
- 中繼頁負責：noindex、SEO 排除、嵌入 Google Form、表單 submit 後再導向實際資產。
- 本決策**不**改變上述 flow；preview-url-risk 與 landing page renderer 完全解耦。

### E.5 Google Form respondent data 之邊界

- Google Form respondent data 保留在 **Google Forms / Sheets**；分析時另外匯出，**不進 BLOG 系統 / repo / Admin 靜態檔案**（紅線 R1）。
- 本決策**不**鬆綁 R1。

### E.6 `download.fileUrl` 不等於以下三者

明確區分：

- ❌ `download.fileUrl` ≠ **Google Form public URL**（屬表單入口，非檔案資產；混用違反 R2 紅線）。
- ❌ `download.fileUrl` ≠ **未來 FormConfig URL**（FormConfig 為 registry-side 設定，per pm-16 §5 / pm-20 §10；本文件不裁決 FormConfig schema）。
- ❌ `download.fileUrl` ≠ **未來 DownloadAsset registry 的完整替代品**（registry 為 named reference + structured metadata；fileUrl 為 raw URL；兩者語意層級不同）。

---

## F. Future Implementation Gates

若未來要把 preview-url-risk 從 **docs-only policy** 升級為 **validator** 或 **Admin warning**，必須**全部滿足**以下條件：

- [ ] **DownloadAsset / `assetRefs[]` / `assetId` schema decision** 已 docs-accepted（欄位字典定稿）。
- [ ] **FormConfig / formRef boundary decision** 已 docs-accepted（與 DownloadAsset 之邊界釐清）。
- [ ] **download landing page renderer decision** 已 docs-accepted（包含中繼頁之 SEO / 嵌入 Form / 配發資產三段流程）。
- [ ] **明確定義哪些 URL pattern 要 warn**，而不是只靠粗糙 regex：
  - 建議改採 **registry-side `deliveryMode` 欄位** 驅動，validator 對 registry-linked download 改檢查 registry consistency。
  - 對非 registry-linked download（即仍用 raw `fileUrl`）→ 由文件 / Admin 提示，不在 `validate-content.js` 做 URL pattern regex。
- [ ] **對現有 draft / temporary Google Drive links 的 migration plan**：
  - 既有 draft download fixture（`content/blogger/posts/20260529-phonics-practice-sheet-download.md`）目前 `fileUrl: ""`，無 Drive URL；屬 zero-migration case。
  - 未來若有新 draft 採 Drive share URL，須有 grandfather 策略或顯式 migration（如 `seo.indexing` audit 之 pattern）。
- [ ] **validate baseline impact estimate**：未來 source phase 之 preanalysis 須先 read-only 估算「升級後 baseline 變動 N」並寫入 docs。
- [ ] **read-only preanalysis phase**（mirror am-5 / am-9 / am-11 之 docs-only cadence）。
- [ ] **source implementation phase**（mirror am-7 / am-13 / night-5 之 warning-only additive cadence）。
- [ ] **read-only acceptance cross-check phase**（mirror am-8 / am-14 之 acceptance cadence）。
- [ ] **user explicit approval per phase**。

任一 unmet → preview-url-risk **保持 docs-only**；不啟動 validator / Admin warning。

---

## G. Explicit Non-goals

本 phase 明確**不做**：

- ❌ no source implementation
- ❌ no `src/scripts/validate-content.js` change
- ❌ no fixture creation（`content/validation-fixtures/` 不動）
- ❌ no production content edit（不改任何 `content/` 下既有檔案）
- ❌ no settings edit（不改 `content/settings/`）
- ❌ no templates change（不改 `content/templates/`）
- ❌ no package change（不改 `package.json`、不 `npm install`）
- ❌ no build（不 `npm run build:*`）
- ❌ no deploy（不 push gh-pages、不改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`）
- ❌ no Blogger repost
- ❌ no GA4 validation
- ❌ no Admin Apply enable
- ❌ no middleware route enable
- ❌ no `admin-write-cli` dry-run / apply
- ❌ no form registry creation（FormConfig schema 未動）
- ❌ no asset registry creation（DownloadAsset schema 未動）
- ❌ no landing page renderer source / template
- ❌ no Google Form respondent data import / handling
- ❌ no reverse UTM activation（remains landed but dormant）
- ❌ no pm-26 deploy gate unblock（remains BLOCKED）
- ❌ no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`
- ❌ no am-7 D1 / D2 implementation 變更
- ❌ no am-13 D3 implementation 變更
- ❌ no night-5 S implementation 變更
- ❌ no am-9 / am-11 / night-3 docs 變更

### G.1 Governance frozen state

- reverse UTM remains **landed but dormant**。
- pm-26 deploy gate remains **BLOCKED**。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守：本 phase 不引入任何 respondent data 通路、不把 `download.fileUrl` 與 Google Form URL 混為一談、不另造 SEO pipeline。
- am-7 D1 / D2 + am-13 D3 + night-5 S implementation 保持 frozen；本 phase 不重做、不調整、不退化。

---

## H. Relationship to Existing Rules

| 規則 | 狀態 | 本文件之影響 |
|------|------|------------|
| D1 `download-enabled-fileurl-empty` | ✅ landed（am-7） | 不變 |
| D2 `download-fileurl-invalid-type` | ✅ landed（am-7） | 不變 |
| D3 `download-fileurl-invalid-format` | ✅ landed（am-13） | 不變；維持 strict `^https?://` regex；preview URL 命中 regex，**不**由 D3 接住 |
| D4（non-rule：no reachability） | ✅ docs-only declaration（am-1 §3） | 不變；本文件再次確認 validator 不做 reachability |
| S `download-content-should-be-noindex` | ✅ landed（night-5） | 不變 |
| F1 / F2 / A1 / A2 / A3（formRef / assetRefs） | 🔒 blocked by registry gate | 不變；本文件不解鎖 registry gate |
| preview-url-risk | 🟡 **docs-only policy（本文件）** | **本文件即裁決**；不升級為 validator |

### H.1 preview-url-risk 是 future policy candidate，**不是** landed validator

- 本文件不宣稱已實作。
- 本文件不宣稱已新增 fixture。
- 本文件不宣稱已改變 baseline。
- 本文件不宣稱 production content 已修正。
- 本文件不宣稱 Google Drive URL 已被 validator 禁止。
- 本文件不宣稱 DownloadAsset registry / FormConfig registry / landing page renderer 已存在。
- 本文件不宣稱 Blogger / GitHub 已 deploy。
- 本文件不宣稱 reverse UTM / pm-26 gate 已解鎖。

---

## I. Docs Consistency Check

本 docs 與既有狀態之一致性檢查：

- ❌ 本 doc **不**宣稱 preview-url-risk 已 implemented。
- ❌ 本 doc **不**宣稱 validate baseline 已變更（仍為 0 errors / 47 warnings / 42 posts）。
- ❌ 本 doc **不**宣稱 production content 已修正。
- ❌ 本 doc **不**宣稱 Google Drive URL 已被 validator 禁止。
- ❌ 本 doc **不**宣稱 DownloadAsset registry 已存在。
- ❌ 本 doc **不**宣稱 FormConfig registry 已存在。
- ❌ 本 doc **不**宣稱 landing page renderer 已存在。
- ❌ 本 doc **不**宣稱 Blogger / GitHub 已 deploy。
- ❌ 本 doc **不**宣稱 reverse UTM / pm-26 gate 已解鎖。
- ❌ 本 doc **不**改 am-1 / am-5 / am-7 / am-9 / am-11 / am-13 / night-3 / night-5 任一前序 docs；僅針對 preview-url-risk 單題做 docs-only policy 固化。

---

## J. Recommended Next Step

完成本 phase（新增單一 docs 檔 + commit + push + final verify）後，**建議 Final Idle Freeze / EXIT**。

不要本 session 自動開始下一個 implementation phase。

若 user 明確要求繼續，可選之安全階段為（依保守度排序，皆 docs-only / read-only；任一啟動需 user explicit approval）：

| 序 | 候選 phase | 性質 |
|---|-----------|------|
| 1 | `download-fileurl-preview-url-risk-policy-acceptance-read-only`（本 doc 之 read-only acceptance cross-check） | read-only |
| 2 | `download-asset-registry-schema-acceptance` 系列（接受 DownloadAsset / FormConfig 欄位字典之 docs-only preanalysis） | docs-only |

**不**建議直接推薦 source implementation；亦**不**建議在 docs-only acceptance 前直接跳 registry 落地 phase。

---

（本文件結束）
