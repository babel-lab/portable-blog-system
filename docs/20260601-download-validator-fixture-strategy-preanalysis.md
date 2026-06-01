# 20260601 Download Validator Fixture Strategy Preanalysis

> Phase: `20260601-pm-21-download-validator-fixture-strategy-preanalysis-docs-only-a`
> Date: 2026-06-01 17:42 +0800
> Scope: **docs-only**（無 source / content / settings / templates / fixture / package / dist / gh-pages / CLAUDE.md 變更）

---

## 1. Executive Summary

- 本文件**只規劃** download validator fixture strategy，為 download loader（pm-11 `ac38ea9`）+ download validator Option A（pm-17 `5452149`）皆 landed + accepted 後之下一階段 fixture 設計邊界裁決。
- 本文件**不新增 fixture**（`content/validation-fixtures/` 一檔不動）。
- 本文件**不修改** `src/scripts/validate-content.js`。
- 本文件**不修改** `src/scripts/load-settings.js` 或任何 `src/` source。
- 本文件**不改 registries**（`content/settings/download-assets.json` / `download-forms.json` 一檔不動）。
- 本文件**不改 baseline**（維持 0 errors / 47 warnings / 42 posts）。
- 目標：在未來 validator source phases 啟動前，先建立 **fixture 設計原則**，使下一個保守 phase 可在固定 fixture 策略草案上展開。
- 本檔落地後 production state drift = 0；唯一變更為新增本 docs 檔。

### 1.1 一句話裁決

> **目前不新增 fixture 可接受。已 landed 的 Option A（registry shape / key uniqueness）屬 registry-level 檢查，synthetic in-memory acceptance 已足夠；committed settings-level fixture 在現行 `validate:content`（per-post loop + 全域 registry 各檢一次）架構下不易乾淨表達，且會污染 baseline 計數，因此不建議現在新增。未來 content reference validation（`assetRefs[]` / `formRef`）一旦實作，則應同批新增 content-level committed negative fixtures（mirror 既有 `_test-download-*` pattern）。預設仍為 Final Idle Freeze / EXIT，任何 fixture / source 變更需 user 明示才啟動。**

---

## 2. Current Baseline

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| HEAD | `5452149d6290b8fdd7e78aad39e16317b967ec31`（short `5452149`） |
| origin/main | `5452149`（HEAD = origin/main；ahead/behind 0/0） |
| latest subject | `feat(download): validate download registries` |
| working tree | clean |
| validate baseline | **0 errors / 47 warnings / 42 posts** |
| current download-registry warnings | **0**（empty registry → 不觸發 invalid-shape / duplicate-key） |
| loader 狀態 | ✅ landed + accepted（`load-settings.js:57-58` exposes `downloadAssets` / `downloadForms`） |
| validator Option A 狀態 | ✅ landed + accepted（`validate-content.js:288-371` `validateDownloadRegistry`；registry-level；warning-only） |
| registries 狀態 | empty and clean（`assets: []` / `forms: []`；`schemaVersion: 1`） |
| download fixture（settings-level） | ❌ 目前沒有 committed settings-level fixture |
| download fixture（content-level） | ✅ 既有 5 個 `_test-download-*`（fileUrl D1/D2/D3 + noindex S；非本批新增） |
| content reference validation（`assetRefs[]` / `formRef`） | ❌ 尚未啟動 |
| loader malformed JSON hardening | ❌ 尚未啟動 |
| Admin picker / renderer / landing page / content migration | dormant（全未實作） |
| reverse UTM | dormant |
| pm-26 deploy gate | BLOCKED |

---

## 3. Current Fixture Landscape

### 3.1 總覽

| 維度 | 數量 |
|------|------|
| `content/validation-fixtures/blogger/posts/` | 29 檔 |
| `content/validation-fixtures/github/posts/` | 28 檔 |
| 合計 | 57 檔 |

所有 fixture 均以 `_test-` 為檔名 prefix；validate-content.js 將其與正式 content posts 一同掃描，故每個 fixture **計入 post count**，其觸發之 warning **計入 warning count**。當前 baseline 之 47 warnings / 42 posts 已包含這 57 個 fixture 的貢獻（部分 fixture 為 valid positive，不貢獻 warning）。

### 3.2 既有 download-related content-level fixtures（5 檔；非本批新增）

| 檔案 | 覆蓋規則 |
|------|----------|
| `blogger/posts/_test-download-enabled-fileurl-empty.md` | D1 `download-enabled-fileurl-empty` |
| `blogger/posts/_test-download-fileurl-invalid-type.md` | D2 `download-fileurl-invalid-type` |
| `blogger/posts/_test-download-fileurl-invalid-format.md` | D3 `download-fileurl-invalid-format` |
| `blogger/posts/_test-download-content-should-be-noindex-index.md` | S `download-content-should-be-noindex`（seo.indexing=index） |
| `blogger/posts/_test-download-content-should-be-noindex-missing.md` | S `download-content-should-be-noindex`（seo.indexing 缺） |

> 上述為 **content-level**（`.md` frontmatter 內 `download` / `seo` 區塊）fixtures，驗的是 post loop 內的規則，與 Option A 之 registry-level 規則屬不同層次。

### 3.3 settings-level fixture pattern：目前沒有

- **目前沒有任何 settings-level fixture**（不存在 test-only registry overlay / test-only `download-assets.json` 變體 / test-only settings 注入機制）。
- 既有 fixture 機制**只覆蓋 content-level**（每個 fixture 是一個 `_test-*.md` post），透過「fixture 也被 post loop 掃描」自然觸發 per-post warning。
- Option A 之 registry shape / duplicate-key 屬 **registry-level**（post loop 外，全域各檢一次；讀 `settings.downloadAssets` / `settings.downloadForms`），現行 fixture 機制**無法以一個 `.md` post 表達**。其驗收方式為 **synthetic in-memory**（直接構造 mock registry object 呼叫 `validateDownloadRegistry` / `validateContent({ posts, settings })`），不留 committed artifact。

---

## 4. Download Validator Rules Needing Fixtures

### 4.A 已 landed Option A（registry shape / key uniqueness）

| 規則 | 現況 | 驗證方式 |
|------|------|----------|
| `download-registry-invalid-shape` | ✅ landed（warning-only） | synthetic in-memory（非 committed fixture） |
| `download-registry-duplicate-key` | ✅ landed（warning-only） | synthetic in-memory（非 committed fixture） |

**目前沒有 committed fixture**，僅 synthetic in-memory 已驗證。

是否需要 committed fixture？優缺點：

| | 優點 | 缺點 |
|---|------|------|
| 不加 committed fixture（現狀） | baseline 不變；不污染 settings registry；不需 test harness | regression 保護僅靠人工 synthetic；CI 無自動回歸 |
| 加 committed fixture | 自動回歸；可重現 | 需 settings-level overlay 機制（現行架構無）；若直接改真 registry 會污染 production registry + baseline + 違反 governance |

> 裁決：**不建議現在為 Option A 補 committed fixture**。Option A 屬 registry-level，committed fixture 需引入新的 settings overlay / test harness（見 §5 Option C / E），風險與工程量不成比例；synthetic in-memory acceptance 對 registry-level shape / uniqueness 已足夠。

### 4.B 未來 content reference validation（尚未實作；需 fixture）

未來規則（per `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §11 A3 / F2）：

| 規則（草案 id） | 觸發條件 | 適合 fixture 類型 |
|-----------------|----------|-------------------|
| `download-asset-ref-not-found` | `assetRefs[i]` 已設但 registry 無對應 `assetId` | content-level negative fixture（需配 non-empty registry，故牽涉 settings overlay） |
| `download-form-ref-not-found` | `formRef` 已設但 registry 無對應 `formId` | 同上 |
| invalid `assetRefs[]` type | `assetRefs` 非 array / entry 非 string | content-level negative fixture（純 frontmatter；不需 registry） |
| invalid `formRef` type | `formRef` 非 string | content-level negative fixture（純 frontmatter；不需 registry） |
| empty ref | `assetRefs[i]` / `formRef` 空字串或 whitespace | content-level negative fixture（純 frontmatter） |
| draft / ready 差異 | ref 規則是否套用於 draft（draft 通常不輸出，可能 skip） | 需 fixture 對照 draft vs ready 行為 |
| Blogger / GitHub 差異 | 兩平台 publishTargets 對 ref 驗證是否一致 | 需 blogger + github 各一 fixture |

> 關鍵張力：`*-ref-not-found` 規則需要「ref 指向一個 registry 內**不存在**的 id」。若 registry 為空，任何 ref 皆 not-found（容易測 negative），但若要測「ref **存在** → 不報 warning」之 positive case，則需 non-empty registry → 又回到 settings overlay 問題。因此 **ref-not-found 規則的 committed fixture 設計，須與 §5 settings overlay 機制決策綁定**，不宜在 overlay 機制未定前先造 fixture。

### 4.C Legacy / migration rules

| 規則 | 現況 | fixture 需求 |
|------|------|--------------|
| `download-fileurl-legacy`（草案） | ❌ 未實作 | 若實作，需 negative fixture（`download.fileUrl` 存在而被視為 legacy） |
| `fileUrl` 與 `assetRefs[]` / `formRef` 共存或互斥 | ❌ 未實作 | 需 fixture 表達「同時存在」之衝突或共存政策 |

是否會命中 production content？

- 既有 production 文章可能仍使用 `download.fileUrl`（grandfather；per schema-decision §7.4「不立即 migration」）。
- 若 `download-fileurl-legacy` 採 warning-only 且套用於 production，**可能改變 baseline warning count**（命中真實文章）。
- 因此此類 legacy 規則**必須先做 docs-only impact scan**（盤點有多少 production 文章含 `download.fileUrl`）再決定 severity 與是否套用，**不可**在未盤點前直接實作。本批不裁決 legacy 規則之 fixture，僅標記為「需先 impact scan」。

### 4.D URL / preview risk rules

| 規則 | 現況 | fixture 需求 |
|------|------|--------------|
| Google Drive `preview-url-risk` | ❌ 未實作；現政策為 **docs-only**（per `docs/20260530-download-fileurl-preview-url-risk-policy.md`） | 維持 docs-only；**暫不需 fixture** |

是否應保持 docs-only？**是**。preview-url-risk 屬「政策建議」而非硬性結構錯誤，且涉及 Google Drive URL 形態判斷（誤判風險高）。保持 docs-only，待政策升級為 validator rule 時再評估 fixture。

### 4.E SEO / noindex rules

| 規則 | 現況 | fixture 覆蓋 |
|------|------|--------------|
| `download-content-should-be-noindex`（S） | ✅ landed（warning-only） | ✅ 已有 2 個 committed fixture（`-index` / `-missing`；見 §3.2） |

是否需要新增 download-specific fixture？**不需要**。S 規則已被既有 2 個 content-level fixture 覆蓋（seo.indexing=index 與 seo.indexing 缺失兩種命中情境）。本批不新增。

---

## 5. Fixture Strategy Options

### Option A：不新增 fixture，只保留 synthetic in-memory acceptance

- baseline 不變（0/47/42）。
- regression 保護不完整（無 committed 回歸；靠人工 synthetic）。
- **適合已 landed Option A 嗎？適合。** registry-level shape / uniqueness 屬純結構檢查，synthetic mock object 即可完整覆蓋分支；committed fixture 的邊際價值低於其機制成本。

### Option B：新增 committed negative fixtures（content-level）

- 可驗證 warning fires（針對 content-level 規則，如未來 `assetRefs[]` type 錯誤）。
- 會增加 post count（每 fixture +1 post）與 warning count（每命中 +1 warning）。
- 需 acceptance 更新 baseline（0/47/42 → 0/4?/4?）。
- **僅適用 content-level 規則**（純 frontmatter 可表達者）；對 registry-level（Option A）與 ref-not-found（需 non-empty registry positive case）不完整。

### Option C：建立 settings-level fixture mechanism（test-only registry overlay）

- 例如 test-only settings registry overlay，使 validator 可在「注入的非空 / 含重複 / 結構錯誤 registry」下執行。
- 可測 registry invalid-shape / duplicate-key 之 committed 回歸，亦可測 ref-not-found 之 positive（ref 存在）case。
- **可能需 source / test harness 改動**（validate-content.js 需接受 overlay 參數，或新增獨立 test entrypoint）→ **風險較高**，超出 docs-only 與「不改 source」邊界。
- 不建議在本批或近期保守 phase 內啟動；需 user 明示 + 獨立 source phase。

### Option D：只做 content-level fixtures for future `assetRefs` / `formRef`

- 等 schema / content reference rules 決定後再新增。
- 不急於現在做。
- 與 Option B 同質但**範圍限定於未來 ref 規則**；是 §4.B 規則落地時的自然 fixture 路徑（純 frontmatter type / empty ref 部分可不需 registry overlay）。

### Option E：建立 non-production test harness（unit test / 獨立 test script）

- 不走 `validate:content` post count（fixture 不混入 content 掃描）。
- 另開 test script 或 unit test（如 `node --test` / 獨立 `*.test.js`）。
- 需 package / test infra 評估（新增 devDependency 或 test runner），**非本 phase**。
- 對 registry-level（Option A）與 synthetic case 最乾淨（不污染 baseline），但需 package.json / test infra 變更 → 需獨立 docs-only preanalysis 評估後再議。

---

## 6. Recommended Strategy

明確建議：

1. **目前不新增 fixture 是否可接受？** 可接受。baseline 應維持 0/47/42 不變。
2. **對已 landed Option A，synthetic acceptance 是否足夠？** 足夠。registry-level shape / uniqueness 之分支已由 synthetic in-memory acceptance 完整覆蓋；committed fixture 需引入 overlay / harness 機制，成本 > 邊際價值。
3. **未來 ref validation 是否需要 committed fixtures？** 需要——但**僅限其 source 規則同批落地時**。`assetRefs[]` / `formRef` 之 type / empty-ref 子規則可用純 content-level fixture（Option B/D，不需 registry overlay）；`*-ref-not-found` 之 positive case 則需先決定 §5 Option C overlay 機制。
4. **下一個保守 phase 應做什麼？** 應為 **fixture batch design docs-only**（在 ref 規則 source 啟動前，先把 §8 命名 / 放置 / batch 切分定案），或 **content reference validation preanalysis docs-only**（先定 A3/F2 規則邊界）。**不**直接做 source preflight；source 需 user 明示。

### 6.1 「先 fixture batch design，還是先 source preflight？」

> 建議 **先 fixture batch design docs-only**（再加 content-reference-validation 規則 preanalysis），**後** source preflight。理由：fixture 設計與規則邊界互為前提；在規則 id / severity / 平台差異未定前做 source preflight 會反覆。且 fixture batch design 屬 docs-only，零 production drift，符合保守落地路線。

---

## 6.5 Future Fixture Batch — 應測 / 不應測

**應測（適合 committed content-level fixture）：**

- `assetRefs[]` 非 array / entry 非 string（純 frontmatter type 錯誤）。
- `formRef` 非 string（純 frontmatter type 錯誤）。
- `assetRefs[i]` / `formRef` 為空字串 / whitespace（empty ref）。
- ref-not-found 之 **negative case**（empty registry 下 ref 必 not-found；不需 overlay）。
- Blogger / GitHub 各一份對照（若規則有平台差異）。

**不應測（本批 / 近期保守 phase 不納入 fixture）：**

- registry-level shape / duplicate-key（Option A）——保留 synthetic in-memory，不造 committed fixture。
- ref-not-found 之 **positive case**（ref 存在 → 不報 warning）——需 non-empty registry overlay（Option C），延後至 overlay 機制定案。
- legacy `download.fileUrl` 規則——須先 production impact scan，未盤點前不造 fixture。
- preview-url-risk——維持 docs-only，不造 fixture。
- 任何需真實 Google Form / Drive 資料之情境（governance 紅線；見 §9）。

---

## 7. Baseline Impact Model

- **新增 fixture 會如何改變 post count？** 每新增一個 `_test-*.md` fixture → post count +1（fixture 與 content 同被掃描）。
- **新增 negative fixture 會如何改變 warning count？** 每個命中目標規則之 negative fixture → warning count +1（若該 fixture 同時觸發多條規則則 +N）。positive / valid fixture 不貢獻 warning。
- **如何命名 expected baseline？** 例如新增 4 個 negative fixture（各命中 1 warning）→ `0 errors / 47 warnings / 42 posts` 變為 `0 errors / 51 warnings / 46 posts`，即 `0/47/42 → 0/51/46`。每批 fixture 落地前須在 acceptance 文件預先寫出 expected 計數，並 cross-check 實際 `validate:content` 輸出。
- **是否每個 fixture source phase 都需要 acceptance cross-check？** 是。任何改變 fixture / warning / post 計數之 phase，acceptance 必須以 `validate:content` 實測輸出對照 expected baseline（errors / warnings / posts 三數皆需符合）。
- **是否避免一次加入太多 fixture？** 是。建議每批 ≤ 一組相關規則的 fixture（如「ref type 錯誤」一批、「ref-not-found negative」一批），逐批 acceptance，避免一次大量加入導致 baseline diff 難以審查。

---

## 8. Fixture Naming / Placement Proposal

### 8.1 路徑

| 平台 | 路徑 |
|------|------|
| blogger | `content/validation-fixtures/blogger/posts/` |
| github | `content/validation-fixtures/github/posts/` |

沿用既有 57 fixture 之放置慣例；不新增目錄。

### 8.2 命名慣例（沿用既有 `_test-<rule-id>[-<variant>].md`）

未來 ref 規則 fixture 命名草案（**本批不建立，僅命名提案**）：

```text
_test-download-asset-ref-not-found.md
_test-download-form-ref-not-found.md
_test-download-asset-refs-invalid-type.md
_test-download-form-ref-invalid-type.md
_test-download-asset-ref-empty.md
```

legacy 規則（須先 impact scan，命名提案）：

```text
_test-download-fileurl-legacy.md
```

### 8.3 positive / negative fixtures

- 需區分 positive（valid → 不報 warning）/ negative（命中 → 報 warning）。
- 命名以 variant suffix 區分，mirror 既有 SEO indexing fixture 慣例（如 `-valid-` / `-invalid-`）：
  - negative：`_test-download-asset-ref-not-found.md`
  - positive：若需，`_test-download-asset-ref-valid.md`（但 positive ref 存在 case 需 registry overlay，故延後）。

### 8.4 是否應避免使用正式 content posts？

**是，必須避免。** fixture 一律使用 `_test-` 前綴之專用 fixture 檔，**不得**改動或挪用任何正式 content post（`content/github/posts/` / `content/blogger/posts/` / drafts / archive）來製造 warning。正式內容須保持 production-clean。

---

## 9. Governance / Red Lines

本批與未來 fixture batch 一律不做（per `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 R1 + CLAUDE.md §3 registry 治理紅線 + pm-20 §4 R1/R2/R3）：

- ❌ 不放真實使用者資料。
- ❌ 不放 respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）。
- ❌ 不放 access token / API key / OAuth secret。
- ❌ 不放 private Drive folder ID / 私人 permission。
- ❌ 不用真實 Google Form submission data；Google Forms responses remain in Google Forms / Sheets，不進 repo。
- ❌ 不新增 production content（fixture 一律 `_test-` 前綴，與正式內容物理隔離）。
- ❌ 不 deploy / 不 Blogger repost / 不 GA4 validation。
- ❌ 不碰 Admin Apply / middleware write route / admin-write-cli（remain dormant）。
- ❌ 不解鎖 pm-26 deploy gate（remain BLOCKED）。
- ❌ 不啟動 reverse UTM（remain dormant）。

---

## 10. Candidate Next Phases

| 候選 | 性質 | 是否需 user 明示 |
|------|------|------------------|
| Final Idle Freeze / EXIT | 無變更（預設） | — |
| acceptance read-only cross-check（驗收本 docs commit） | read-only | 保守可自動 |
| content reference validation preanalysis | docs-only | 保守可提議 |
| fixture batch design | docs-only | 保守可提議 |
| fixture source implementation（造 committed fixture） | content / baseline 變更 | **需 user 明示** |
| registry hardening / malformed JSON | docs-only（preanalysis） | 保守可提議 |
| non-production test harness preanalysis | docs-only | 保守可提議 |

> 上述「source implementation」屬唯一會改 baseline 之選項，**必須** user 明示才啟動；其餘 docs-only / read-only 選項屬保守範疇。

---

## 11. Final Recommendation

- **是否立刻新增 fixture？** 否。目前不新增 fixture；baseline 維持 0/47/42。
- **若不建議，下一步是 acceptance 還是 freeze？** 預設 **Final Idle Freeze / EXIT**；若需保守驗收，下一步應為 **read-only acceptance cross-check**（驗收本 docs commit，不改任何檔）。
- **若未來要新增 fixture，最小安全 batch 是什麼？** 最小安全 batch = **content-level、純 frontmatter 可表達、不需 registry overlay 的 ref type / empty-ref negative fixtures**（如 `_test-download-asset-refs-invalid-type.md` 一檔），且須與其 source 規則同批落地、acceptance 預寫 expected baseline 並 cross-check。registry-level（Option A）保留 synthetic；ref-not-found positive case 延後至 overlay 機制定案。
- **預設結論：Final Idle Freeze / EXIT。** 不自動啟動下一 phase；任何 fixture / source / baseline 變更需 user 明示。
