# Download Validation Rules Preanalysis — 2026-05-30

> Phase: `20260530-am-1-download-validation-rules-preanalysis-docs-only-a`
> Scope: **docs-only**（無 source / content / settings / templates / package / dist / gh-pages 變更）

---

## 1. Executive Summary

- 本文件是 **docs-only preanalysis**，**不**修改 `src/scripts/validate-content.js`，**不**新增 settings registry，**不**改 fixture / template / content。
- 目標：把未來 download landing page / `download.fileUrl` / formRef / assetRefs 之 validation rules 拆成「現在已有」/「缺口」/「建議規則」/「severity」/「導入順序」/「不做事項」，作為**未來** validation 規則 PR 的對話基準。
- 規則設計核心原則：**warning-only additive first**。沿用 `related-links-*` / `series-*` / `book-*` 既有 warning-only pattern（per `src/scripts/validate-content.js` 既有實作慣例），先以 warning 形式落地、觀察 baseline 影響，再視需要在另一獨立 phase 升級 error。**不應**從本文件直接跳到 error gate。
- 任何 ref-resolution 類規則（`formRef` / `assetRefs[]`）皆受「settings registry 尚未建立」之上游條件牽制；在 registry schema 接受並 source 落地之前，**不可**啟用。
- 本文件**不**啟用任何規則；**不**提交任何 validator source change；**不**承諾啟用時機；**不**改變 baseline `0 errors / 42 warnings / 37 posts`。

---

## 2. Current Validation Baseline

依 `src/scripts/validate-content.js` 實際盤點，目前已存在之 validation 規則（依檔內出現順序，摘錄）：

### 2.1 已存在規則（摘要）

| 面向 | 規則類型 | severity | 觸發範圍 |
|------|---------|---------|---------|
| status | `invalid-status` | error | 所有 status |
| ready/published 必填 | `missing-title` / `missing-slug` / `missing-date` / `invalid-date-format` | error | ready / published |
| SEO 內容品質 | `missing-description` / `missing-category` / `missing-cover` / `empty-tags` | warning | ready / published |
| SEO 長度 | `long-title` / `long-description` / `long-search-description` | warning | ready / published |
| body | `body-leading-h1` | warning | ready / published |
| schema 一致性 | `invalid-site` / `invalid-content-kind` / `contentkind-and-type-conflict` | warning | ready / published |
| **`seo` 區塊** | `invalid-seo-block` / `invalid-seo-indexing` | warning | ready / published |
| primary platform | `invalid-primary-platform` | warning | ready / published |
| canonical | `invalid-canonical` | warning | ready / published |
| publish target | `invalid-publish-target-mode` | warning | ready / published |
| **`relatedLinks` / `otherLinks`** | `related-links-not-array` / `related-links-entry-missing-kind` / `related-links-entry-kind-invalid` / `related-links-entry-missing-url` | warning | ready / published |
| **`sourceKey`**（relatedLinks / otherLinks 共用 helper） | `related-links-source-key-invalid-type` / `related-links-source-key-empty` / `related-links-source-key-not-found` | warning | ready / published |
| series | `series-not-object` / `series-id-invalid` / `series-id-not-in-settings` / `series-block-missing-number` / `series-number-invalid` / `series-subtitle-invalid-type` / `series-subtitle-without-id` / `series-title-unresolved` / `series-number-duplicate` | warning | ready / published |
| book | `book-mediatype-invalid` / `book-issue-without-magazine-mediatype` / `book-issn-without-magazine-mediatype` / `book-volume-invalid-type` / `book-published-year-invalid-type` / `book-authors-invalid-role` / `book-authors-entry-empty` | warning | ready / published |
| category / tag | `unknown-category` / `category-site-mismatch` / `unknown-tag` / `tag-site-mismatch` | warning | 所有 status |
| promotion.facebook | `promotion-message-missing` / `promotion-hashtags-empty` / `promotion-page-unknown` / `promotion-page-disabled` / `promotion-target-invalid` / `promotion-globally-disabled` | warning | 所有 status（fb.enabled=true 才觸發） |
| sidecar overlap | `sidecar-frontmatter-overlap`（含 `.publish.json` 與 `.fb.md` 兩來源） | warning | 所有 status |
| .fb.md placeholder / body | `fb-md-content-missing` / `fb-md-placeholder-unresolved` / `fb-md-titleEn-invalid-type` / `fb-post-url-missing` | warning / error（依 status × placeholder 矩陣） | 視情況 |
| 跨檔 | `duplicate-slug` | error | 所有 status |

### 2.2 與 download 相關之**已存在**保護

- `contentKind` 列舉值含 `download`（合法）。
- `seo.indexing` 列舉值（`index` / `noindex-follow` / `noindex-nofollow`）有 `invalid-seo-indexing` warning 把關。
- `build-sitemap.js` 對 `contentKind === 'download'` 已有 fallback **自動排除 sitemap**（SEO-1 fallback：`seo.indexing !== 'index'` 時排除）。
- `build-github.js` 對 `contentKind === 'download'` 已有 fallback 套用 `noindex, follow` robots meta（SEO-1 fallback）。

### 2.3 目前**尚未檢查**之 download 面向（明確盤點）

- ❌ `download.fileUrl` 是否為空。
- ❌ `download.enabled === true` 但 `download.fileUrl` 為空之矛盾狀態。
- ❌ `download.fileUrl` 之 URL **格式** / **型別**（是否字串、是否合法 http(s) / 相對路徑）。
- ❌ `download.fileUrl` 之 **reachability**（是否可達；validate-content 永遠不應做此檢查）。
- ❌ `formRef`（欄位尚未存在）。
- ❌ `assetRefs[]`（欄位尚未存在）。
- ❌ download landing page 之 schema（registry 尚未建立）。
- ❌ download 文章之 `seo.indexing` 與 contentKind 之**顯式 consistency**（目前由 fallback 自動補；validator 不對「未顯式設」做 warning）。

---

## 3. Download fileUrl Rule Candidates

> ⚠️ **本節為草案**：以下規則描述為文件提案，**本 phase 不**實作於 `validate-content.js`。

### Rule D1 — `download-enabled-fileurl-empty`

- 條件：`contentKind === 'download'` 且 `download.enabled === true` 且 `download.fileUrl` 為空字串 / `undefined` / 非字串。
- 建議 severity：**warning**（first pass；不直接 error）。
- 建議觸發範圍：可考慮兩種：
  - 選項 A：僅 `ready / published`（mirror 既有 missing-* warning pattern）—— 推薦。
  - 選項 B：所有 status —— 較嚴，draft fixture 會立刻出 warning。
- 理由：
  - 目前 template（`content/templates/blogger-download-template.md`）與 draft fixture（`content/blogger/posts/20260529-phonics-practice-sheet-download.md`）可能 intentionally empty；直接 error 會破壞 baseline `0 errors`。
  - 與 CLAUDE.md §13 既有設計（"若 `download.enabled: true` 但沒有 `fileUrl`，build 時應警告"）一致；本規則屬「把現有設計意圖補進 validator」之 missing piece。
- 範例 value 字串（草案）：`download.enabled=true but download.fileUrl is missing or empty`

### Rule D2 — `download-fileurl-invalid-type`

- 條件：`download.fileUrl !== undefined` 但 `typeof download.fileUrl !== 'string'`。
- 建議 severity：**warning**。
- 建議觸發範圍：所有 status（mirror `book-volume-invalid-type` 既有 pattern，型別檢查不分 status）。
- 理由：型別錯誤屬作者手滑；warning 即可，不需 error。
- 範例 value：`typeof=${typeof download.fileUrl}`

### Rule D3 — `download-fileurl-invalid-format`

- 條件：`download.fileUrl` 為 non-empty string，但不符合允許之 URL 形式（`http(s)://` 或 repo 允許之相對路徑格式，命名待定）。
- 建議 severity：**warning**。
- 建議觸發範圍：所有 status。
- 理由：mirror `invalid-canonical` 既有 pattern（也是 warning + regex 檢查）。
- **未決問題**：是否允許相對路徑（如 `/downloads/foo.zip`）。本 phase **不**裁決；留待規則實作 phase 同時定稿。
- 範例 value：`download.fileUrl="${url}" is not http(s) URL`

### Rule D4 — `download-fileurl-reachability-not-checked`

- 不是「規則」，是**明確之 non-rule 宣告**：
  - `validate-content.js` **永遠不**做 network reachability check（不發 HEAD / GET 請求驗 fileUrl 可達）。
  - 理由 1：validator 必須 deterministic / offline-safe（既有設計）；網路依賴會破壞此屬性。
  - 理由 2：CI / pre-commit 場景不應因網路抖動失敗。
  - 理由 3：reachability 屬「**manual gate**」或「**獨立 link-check phase**」（mirror `check-broken-links.js` 之 separate pipeline；當前 docs 未承諾此 phase 啟動時機）。
  - 與 CLAUDE.md §13 / 既有設計一致（既有沒承諾 reachability）。

---

## 4. Download SEO Consistency Rule Candidates

### Rule S1 — `download-content-should-be-noindex`

- 條件：`contentKind === 'download'` 且 `seo.indexing` **未顯式設**（`undefined`）或顯式設為 `'index'`。
- 建議 severity：**warning**。
- 建議觸發範圍：`ready / published`（mirror 既有 SEO-related warning pattern）。
- 理由：
  - 目前 `build-sitemap.js` / `build-github.js` 對 `contentKind === 'download'` 已有 **fallback**：自動套 `noindex, follow` + 自動排除 sitemap（SEO-1 fallback；per `src/scripts/build-sitemap.js` L125–L131 / `src/scripts/build-github.js` L293–L305）。
  - 故行為層級 download content 預設已 noindex。
  - 但 validator 目前**不**對「download content 之 `seo.indexing` 未顯式設」做提示；本規則可讓作者更清楚 noindex 是**有意設定**而非無意 fallback，降低未來 SEO meta 與 sitemap 行為被誤改之風險。
- **重要 note**：此規則屬「**提示型 warning**」，並非修補 SEO 行為；行為層已對；只是讓 frontmatter 更顯式。
- 範例 value：`contentKind=download but seo.indexing not explicitly set (fallback noindex-follow applies)`

### Rule S2（候選）— `download-content-marked-index`

- 條件：`contentKind === 'download'` 但 `seo.indexing === 'index'`。
- 建議 severity：**warning**。
- 建議觸發範圍：`ready / published`。
- 理由：作者顯式把 download content 設成可索引，通常與 download landing page 「應 noindex 不應成為搜尋直達入口」之原則（per `docs/20260529-download-landing-page-admin-model-preanalysis.md` §4）相違。warning 提示作者確認意圖。
- **未決問題**：是否與 S1 合併為一條（S1 涵蓋 undefined 與 index 兩種情況）。本 phase **不**裁決。

---

## 5. FormRef / AssetRefs Rule Candidates

> ⚠️ **本節所有規則皆 registry-dependent**：未來在 settings registry 接受 + source 落地（FormConfig / DownloadAsset 已存在）後**才能**啟用；當前**不可**實作。

### Rule F1 — `download-formref-missing`

- 條件：`contentKind === 'download'` 且 `status` 為 `ready / published` 且 `formRef` 為 `undefined` / 空字串。
- 建議 severity：**warning**（first pass）。
- 註：若未來 download landing page 改以「正文走 content + form/asset 走 registry」之 hybrid 落地（per `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md` §8 推薦 Option D），則 download landing page 之 frontmatter 將以 `formRef` 參照 FormConfig。

### Rule F2 — `download-formref-not-found`

- 條件：`formRef` 為 non-empty string，但在 FormConfig registry 中找不到對應 entry。
- 建議 severity：**warning**。
- mirror `series-id-not-in-settings` / `related-links-source-key-not-found` 既有 ref-resolution pattern。
- 註：本規則需要 `loadSettings()` 載入 FormConfig registry；source 改動面非零。

### Rule A1 — `download-assetrefs-invalid-type`

- 條件：`assetRefs !== undefined` 但非 array。
- 建議 severity：**warning**。
- mirror `related-links-not-array` 既有 pattern。

### Rule A2 — `download-assetrefs-empty`

- 條件：`contentKind === 'download'` 且 `status` 為 `ready / published` 且 `assetRefs` 為空 array 或未設。
- 建議 severity：**warning**。
- **未決問題**：是否允許 download content 不掛 asset（純表單流；後續用 email 寄送）。本 phase **不**裁決。

### Rule A3 — `download-assetref-not-found`

- 條件：`assetRefs[i]` 為 non-empty string，但在 DownloadAsset registry 中找不到對應 entry。
- 建議 severity：**warning**。
- mirror `related-links-source-key-not-found` 既有 pattern；逐 entry push，避免吞錯。

### 5.1 明確之**無法現在實作**理由

| 阻擋條件 | 狀態 |
|---------|------|
| FormConfig schema 是否定稿 | ❌ 尚未（仍 docs-only） |
| DownloadAsset schema 是否定稿 | ❌ 尚未（仍 docs-only） |
| FormConfig registry file 是否存在（如 `content/settings/download-forms.json`） | ❌ 尚未建立 |
| DownloadAsset registry file 是否存在（如 `content/settings/download-assets.json`） | ❌ 尚未建立 |
| `loadSettings()` 是否已載入上述 registry | ❌ 尚未串接 |
| `formRef` / `assetRefs[]` frontmatter 欄位是否落地 | ❌ 尚未定義 schema |
| user explicit approval | ❌ 尚未取得 |

→ 結論：F1 / F2 / A1 / A2 / A3 **皆鎖在 registry gate 之後**；本文件僅為設計草案，**不**可在 registry 啟動前實作。

---

## 6. Registry-dependent Rules Gate

任何 `formRef` / `assetRefs[]` 之 ref-resolution 類規則啟用前，必須**全部滿足**以下條件：

- [ ] FormConfig / DownloadAsset registry **schema docs 接受**（欄位字典定稿）。
- [ ] Registry **file naming 接受**（如 `content/settings/download-forms.json` / `content/settings/download-assets.json`，命名待定）。
- [ ] Settings loader 策略接受（`load-settings.js` 是否載入 / 如何 expose）。
- [ ] Validation fixture 策略接受（registry 之 invalid case 如何放進 `content/validation-fixtures/`）。
- [ ] **No production registry pollution**（registry 不含真實使用者 / 真實表單 / 真實資產 URL；ready vs draft 區隔清楚）。
- [ ] **R1 / R2 / R3 紅線**（per `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md` §4）成立：
  - R1：respondent data 不進 repo。
  - R2：`download.fileUrl` 不混成 Google Form URL。
  - R3：SEO reuse 既有 noindex / sitemap pipeline，不另造一套。
- [ ] User explicit approval（per phase）。

任一 unmet → registry-dependent rules **不**啟用。

---

## 7. Suggested Rollout Order

> 保守順序；每步都是 additive；任一步皆須 user explicit approval per phase。

| 步 | 內容 | 性質 | 是否本 phase 啟動 |
|---|------|------|-----------------|
| **Step 1** | docs-only **rule acceptance**（接受本文件 D1 / D2 / D3 / S1 / S2 / F1 / F2 / A1 / A2 / A3 之語意與 severity） | docs-only | ❌ 不啟動（本 phase 僅交付 docs） |
| **Step 2** | warning-only validation for `download.fileUrl` local structure（D1 / D2 / D3）| source 改動（warning-only additive） | ❌ 不啟動 |
| **Step 3** | SEO consistency warning（S1 / S2）| source 改動（warning-only additive） | ❌ 不啟動 |
| **Step 4** | Registry schema acceptance（FormConfig / DownloadAsset 欄位字典定稿）| docs-only | ❌ 不啟動 |
| **Step 5** | Registry file creation（`content/settings/download-forms.json` / `content/settings/download-assets.json` 等；命名待定）| settings creation source phase | ❌ 不啟動 |
| **Step 6** | `formRef` / `assetRefs[]` warning-only validation（F1 / F2 / A1 / A2 / A3）| source 改動（warning-only additive） | ❌ 不啟動 |
| **Step 7** | Separate manual gate OR `check-broken-links` phase for actual `download.fileUrl` reachability | 獨立 pipeline；非 `validate-content` | ❌ 不啟動 |

明確：**本文件僅完成 docs-only 草案**，**不**建議直接從本文件跳到 source implementation；Step 2 起即須**獨立 phase + user explicit approval**。

---

## 8. Baseline Impact Assessment

當前 `validate:content` baseline（per session 起始驗證）：

```
0 error(s) / 42 warning(s) on 37 post(s)
```

42 warnings 全屬 `content/validation-fixtures/`（validator 預期之錯誤樣本，by design）。

### 8.1 各規則啟用時對 baseline 之**推估**影響

> 推估僅依現有 content 結構觀察；實際數字以該 phase 啟用後 `validate:content` 為準。

| 規則 | 推估影響 | 備註 |
|------|---------|------|
| D1（`download-enabled-fileurl-empty`，ready/published only）| 0 ~ 少數 | 目前 download fixture 為 `status: draft`；不會立刻觸發。若選項 B（所有 status）→ draft fixture + template 可能各 +1。 |
| D2（型別）| 0 | 目前無已知 download.fileUrl 非字串案例。 |
| D3（格式）| 0 ~ 少數 | 目前 download.fileUrl 多為空字串；空字串不觸發 D3（D3 條件為 non-empty）。 |
| S1（noindex 未顯式設）| 可能 +1 ~ +數筆 | 既有 download 文章若未明確設 `seo.indexing` 將出 warning（行為層因 fallback 已 noindex，但 frontmatter 不顯式）。 |
| S2（顯式 index）| 0 | 目前無 download + `seo.indexing: index` 案例。 |
| F1 / F2 / A1 / A2 / A3 | rocked | 受 registry gate 阻擋；無法啟用故無 baseline 影響。 |

### 8.2 防止 baseline 退步之原則

- 任何新規則啟用前，先**文件接受** + **明確聲明** baseline `warning count` 將從 42 → N 變更為**預期變更**（不是 regression）。
- 啟用後實際 baseline 若與預期不符，須在該 phase 內回溯，並更新文件之 baseline expected value。
- **不應**在同一 phase 同時啟用多條新規則，避免 baseline 變動原因混淆。

---

## 9. Non-goals

本 phase 明確**不做**：

- ❌ 不修改 `src/scripts/validate-content.js`。
- ❌ 不新增任何 settings registry file。
- ❌ 不定稿 FormConfig / DownloadAsset schema。
- ❌ 不填 `download.fileUrl`。
- ❌ 不改 draft fixture（`content/blogger/posts/20260529-phonics-practice-sheet-download.md`）。
- ❌ 不改 template（`content/templates/blogger-download-template.md`）。
- ❌ 不 build / 不 deploy / 不 gh-pages。
- ❌ 不 Blogger repost。
- ❌ 不 GA4 validation。
- ❌ 不啟用 reverse UTM；不解除 pm-26 deploy gate。
- ❌ 不啟用 Admin Apply；不啟用 middleware write route。
- ❌ 不 dry-run / 不 apply `admin-write-cli`。
- ❌ 不 `npm install`；不 `git fetch / pull / merge / rebase / reset / stash / amend / force-push`。

---

## 10. Recommended Next Phase

建議下一階段為：**Final Idle Freeze / EXIT**。

若 user 明確要求繼續，可選之安全階段為（依保守度排序，皆 docs-only / read-only；任一啟動需 user explicit approval）：

| 序 | 候選 phase | 性質 |
|---|-----------|------|
| 1 | Download registry schema acceptance（接受 / 細化 FormConfig / DownloadAsset 欄位字典之 docs-only preanalysis） | docs-only |
| 2 | Download validation warning implementation **preanalysis**（針對 §3 D1 / D2 / D3 / §4 S1 / S2 之**實作前**最後 read-only 草案：精確訊息 / 觸發範圍最終裁決 / fixture 設計）| docs-only / read-only |

**不**建議直接推薦 source implementation；亦**不**建議直接跳 Step 2 ~ Step 6（per §7）。

---

## 11. Explicit Non-execution Declarations

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
- no `download.fileUrl` fill
- no `admin-write-cli` (dry-run / apply)
- no Admin Apply enable
- no middleware route
- no settings registry file creation
- no validation source implementation
- no npm install
- no fixture creation
- no Google Form respondent data import

本檔落地後 production state drift = 0；屬純 docs entry。唯一變更為新增本 docs 檔。

---

（本文件結束）
