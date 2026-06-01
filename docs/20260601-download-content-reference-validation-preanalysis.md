# 20260601 Download Content Reference Validation Preanalysis

> Phase: `20260601-pm-23-download-content-reference-validation-preanalysis-docs-only-a`
> Date: 2026-06-01 17:58 +0800
> Scope: **docs-only**（無 source / content / settings / templates / fixture / package / dist / gh-pages / CLAUDE.md 變更）

---

## 1. Executive Summary

- 本文件**只規劃**未來 download **content reference validation**（`download.assetRefs[]` / `download.formRef` 之 type / empty / not-found 檢查），為 download loader（pm-11 `ac38ea9`）+ download validator Option A registry shape/uniqueness（pm-17 `5452149`）+ fixture strategy（pm-21 `7a595f3`）皆 landed + accepted 後之下一階段安全邊界裁決。
- 本文件**不修改** `src/scripts/validate-content.js`。
- 本文件**不修改** `src/scripts/load-settings.js` 或任何 `src/` source。
- 本文件**不新增 fixture**（`content/validation-fixtures/` 一檔不動）。
- 本文件**不改 registries**（`content/settings/download-assets.json` / `download-forms.json` 一檔不動）。
- 本文件**不改 content / templates**（既有 production post / draft / archive / template 一檔不動）。
- 本文件**不啟動** Admin picker / renderer / landing page / content migration。
- 目標：為未來 `assetRefs[]` / `formRef` **source phase** 定義安全邊界——明確哪些規則純 frontmatter 可表達（不牽涉 registry overlay）、哪些需要 non-empty registry positive case、哪些會動 baseline、哪些須先 fixture batch design。
- 本檔落地後 production state drift = 0；唯一變更為新增本 docs 檔。

### 1.1 一句話裁決

> **content reference validation 之第一個 source phase 應採最小安全集：優先做純 frontmatter 可表達之 `assetRefs[]` / `formRef` **type / empty-ref** 檢查（Recommended Option A），全 warning-only、不需 registry overlay、目前 0 production 命中（無文章用 ref）→ 但需同批新增 committed negative fixtures（content-level，純 frontmatter）才有測試覆蓋，故會動 baseline post/warning count；`*-ref-not-found` 之 positive case（ref 存在 → 不報）牽涉 non-empty registry overlay，延後至 overlay 機制定案。預設仍為 Final Idle Freeze / EXIT；任何 source / fixture / baseline 變更須 user 明示才啟動。在進 source 前，最保守下一步為「先做 content-reference fixture batch design docs-only」。**

---

## 2. Current Baseline

| 項目 | 值 |
|------|----|
| repo | `D:\github\blog-new\portable-blog-system` |
| HEAD | `7a595f3161cdb2dab77032343bcce9b152a695d6`（short `7a595f3`） |
| origin/main | `7a595f3`（HEAD = origin/main；ahead/behind 0/0） |
| working tree | clean |
| latest subject | `docs(download): plan validator fixture strategy` |
| validate baseline | **0 errors / 47 warnings / 42 posts** |
| download loader | ✅ landed + accepted（`load-settings.js:57-58` exposes `downloadAssets` / `downloadForms`；pm-11 `ac38ea9`） |
| download validator Option A | ✅ landed + accepted（`validate-content.js:288-372` `validateDownloadRegistry`；registry-level；warning-only；pm-17 `5452149`） |
| fixture strategy | ✅ landed + accepted（`docs/20260601-download-validator-fixture-strategy-preanalysis.md`；pm-21 `7a595f3`） |
| registries 狀態 | empty and clean（`assets: []` / `forms: []`；`schemaVersion: 1`） |
| download-registry warnings（real baseline） | **0**（empty registry → 不觸發 invalid-shape / duplicate-key） |
| `assetRefs[]` current usage count | **0**（content / fixtures / template 全無；grep 0 命中） |
| `formRef` current usage count | **0**（同上） |
| legacy `download.fileUrl` current usage count | **production posts: 1**（`content/blogger/posts/20260529-phonics-practice-sheet-download.md`，**`status: draft` → 被 loadPosts 過濾，不入 validate baseline**）；**template: 1**（`content/templates/blogger-download-template.md`，不掃描）；**fixtures: 5**（`_test-download-*`，含 D1/D2/D3/S 命中，已計入 47） |
| content reference validation（A1/A2/A3/F1/F2…） | ❌ 尚未實作 |
| reverse UTM | dormant |
| pm-26 deploy gate | BLOCKED |

> 補充：`contentKind: "download"` 之非 fixture 文章共 2 篇——phonics（blogger，draft）與 `20260504-portable-blog-system-mvp.md`（github，ready，作 SEO-1/SEO-2 樣本用，**無** download 區塊、**無** fileUrl、設 `seo.indexing: noindex-follow` 故不觸發 S）。兩篇皆**不**使用 `assetRefs[]` / `formRef`。

---

## 3. Current Content / Registry Model

### 3.1 current download frontmatter shape（from `blogger-download-template.md`）

template 採 **legacy single-URL** 形態：

```yaml
contentKind: "download"
download:
  enabled: true
  title: ""
  description: ""
  fileUrl: ""          # ← 唯一連結欄位（legacy）
  fileType: "PDF"
  licenseNote: "本素材僅供個人、家庭與教學使用，請勿轉售或大量散布。"
```

- 目前 template **無** `assetRefs[]` / `formRef` 欄位。
- 既有 production download 文章（phonics）同樣只有 `download.fileUrl`。

### 3.2 current legacy `download.fileUrl` behavior（已實作；frozen）

讀自 `validate-content.js`（Phase 20260530 am-7 / am-13 / night-5；ready/published only）：

| 代號 | rule id | severity | 觸發條件 |
|------|---------|----------|----------|
| D2 | `download-fileurl-invalid-type` | warning | `download.fileUrl !== undefined` 且非 string |
| D1 | `download-enabled-fileurl-empty` | warning | `contentKind==='download'` 且 `download.enabled===true` 且 fileUrl 空/whitespace |
| D3 | `download-fileurl-invalid-format` | warning | fileUrl 為 non-empty trimmed string 但不符 `^https?://`（B-strict；不允許 relative path） |
| S | `download-content-should-be-noindex` | warning | `contentKind==='download'` 且 `seo.indexing ∉ {noindex-follow, noindex-nofollow}`，且無 D1/D2/D3 warning（fix-first 階層） |

- 全部 **warning-only**；D1/D2/D3 互斥；S 受 `hasDownloadFileUrlWarning` 抑制。
- 全部僅針對 **legacy `download.fileUrl`**；**無**任何規則讀 `assetRefs[]` / `formRef`。

### 3.3 proposed / documented `assetRefs[]` model（per schema-decision §9.2）

長期推薦 shape = **B + C 並存（無 landingPageRef）**：

```yaml
download:
  enabled: true
  assetRefs:                       # 多 asset；每筆對應 DownloadAsset.assetId
    - phonics-cards-zip-v1
    - phonics-flashcards-pdf-v1
  formRef: phonics-teacher-form-v1 # 單一 form；對應 FormConfig.formId（可選）
  fileType: "PDF"                  # 過渡相容；未來可從 assetRefs 推導
  licenseNote: "..."
```

- `assetRefs[]`：**陣列**，每筆為 kebab-case `assetId`（lookup key 對應 `downloadAssets.assets[].assetId`）。
- `download.fileUrl` 與 `assetRefs[]` / `formRef` **可共存**（grandfather；未來可加「擇一」hint warning，屬 migration 階段，本批不做）。

### 3.4 proposed / documented `formRef` model（per schema-decision §9.2 / §6）

- `formRef`：**單一字串**，對應 `downloadForms.forms[].formId`（kebab-case primary key）。
- optional：無 gate 之 download 可省略 `formRef`。

### 3.5 registry key fields（per schema-decision §5.1 / §6.1）

| registry | array | primary key field | 約束 |
|----------|-------|-------------------|------|
| `download-assets.json` | `assets[]` | **`assetId`** | `^[a-z0-9]+(-[a-z0-9]+)*$`；non-empty；registry-unique |
| `download-forms.json` | `forms[]` | **`formId`** | 同上 |

> 即：asset key field = **`assetId`**；form key field = **`formId`**。Option A 已用此兩 key 做 duplicate 檢查（`validate-content.js:362-371`）。

### 3.6 empty registry implications

- 目前兩 registry 皆 `assets: []` / `forms: []`。
- **任何** `assetRefs[i]` / `formRef` 對空 registry 之 lookup 皆 **not-found**（空集合 → `!has()` 恆真）。
- 故 `*-ref-not-found` 規則在 empty registry 下，只要有文章設了 ref 就必然觸發 → 適合測 **negative**（容易命中），但無法測 **positive**（ref 存在 → 不報），除非 registry 內有真實 entry（牽涉 §7 overlay）。

### 3.7 governance（registry 治理紅線；per schema-decision §8 + CLAUDE.md §3.2）

content reference validation 僅**讀取** registry 之 `assetId` / `formId`（kebab-case slug，無 PII）；registry **永不**含：

- ❌ respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）。
- ❌ access token / API key / OAuth secret / 帳號 email。
- ❌ private Drive folder ID / 私人 permission / 內部路徑。
- Google Forms responses **remain in Google Forms / Sheets**，不進 repo。

---

## 4. Candidate Reference Validation Rules

> 以下全部為**未來** source phase 之設計輸入；本 phase **不**實作任一條。lookup pattern 直接 mirror 既有 `related-links-source-key-not-found`（`validate-content.js:230-237`，以 Set `!has()` → warning）與 `related-links-source-key-invalid-type` / `-empty` 之三條互斥 pattern（`:212-238`）。

### A. `assetRefs` type validation

- **`download.assetRefs` 是否須為 array**：是。`assetRefs !== undefined` 且非 array → warning。
- **invalid type warning name**：`download-assetrefs-invalid-type`（mirror `related-links-not-array`）。
- **empty array behavior**：`assetRefs: []` 視為「無 ref」→ **不**觸發 type warning（與 relatedLinks 空陣列不觸發一致）。是否對 ready/published download 之空陣列另發 `download-assetrefs-empty`（A2）為**獨立**規則，見下表，本批傾向**第一批不做 A2**（避免命中既有只用 fileUrl 之文章語意；A2 須先確定「formRef-only flow」豁免邏輯）。
- **draft / ready 行為**：沿用既有 download 規則範圍——僅 ready/published（loadPosts 已過濾 draft/archived）。type 檢查屬結構性，建議與 D2 對齊（ready/published）。
- **fixture needs**：純 frontmatter negative fixture（`assetRefs` 設成 string / object）；**不需** registry。
- **baseline impact**：目前 0 文章用 `assetRefs` → 規則本身 0 production 命中；但需 negative fixture 驗證 → fixture +1 post +1 warning（動 baseline）。

### B. `assetRefs` item validation

- **item 是否須為 string**：是。`assetRefs[i]` 非 string → warning（`download-assetref-invalid-type`）。
- **trim empty string behavior**：`assetRefs[i]` 為 `""` / whitespace-only → warning（`download-assetref-empty`）。mirror `related-links-source-key-empty`。
- **duplicate `assetRefs` within same post**：同一 post 之 `assetRefs` 出現重複 id → warning（`download-assetref-duplicate`）。屬 hint（非結構錯誤）；**第一批可暫緩**（重複 ref render 端可去重；優先級低於 type/empty）。
- **invalid item warning name**：`download-assetref-invalid-type`（非 string）/ `download-assetref-empty`（空字串）/ `download-assetref-duplicate`（重複）。
- **互斥**：item 非 string → invalid-type；string 但空 → empty；其餘非空 string 才進 not-found（C）。mirror sourceKey 三條互斥鏈。
- **baseline impact**：0 production 命中；需 negative fixture → 動 baseline。

### C. `assetRefs` not-found validation

- **lookup 對象**：`assetRefs[i]`（non-empty trimmed string）須存在於 `downloadAssets.assets[].assetId`。
- **warning name**：`download-asset-ref-not-found`。
- **是否對 draft posts 執行**：否（沿用 ready/published only；loadPosts 過濾 draft）。
- **是否僅在 `assetRefs[]` 存在時執行**：是。`assetRefs === undefined` → 不檢查（保留 optional 欄位語意；不強制 download 文章使用 ref）。
- **empty registry effect**：⚠ 空 registry 下，任一 non-empty ref 必 not-found → 若有 fixture 設了有效格式但不存在的 ref，必觸發；**positive case（ref 存在 → 不報）無法在 empty registry 下驗證** → 需 non-empty registry overlay（§7 Option C）。
- **baseline impact**：0 production 命中；negative fixture 必觸發 → 動 baseline。

### D. `formRef` type validation

- **`download.formRef` 是否須為 string**：是。`formRef !== undefined` 且非 string → warning（`download-formref-invalid-type`）。
- **empty string behavior**：`formRef` 為 `""` / whitespace → warning（`download-formref-empty`）。
- **warning name**：`download-formref-invalid-type`（非 string）/ `download-formref-empty`（空字串）。互斥。
- **draft / ready 行為**：ready/published only。
- **baseline impact**：0 production 命中；需 negative fixture → 動 baseline。

### E. `formRef` not-found validation

- **lookup 對象**：`formRef`（non-empty trimmed string）須存在於 `downloadForms.forms[].formId`。
- **warning name**：`download-form-ref-not-found`。
- **empty registry effect**：同 C——空 registry 下任一 non-empty `formRef` 必 not-found；positive case 需 overlay。
- **draft / ready behavior**：ready/published only；`formRef === undefined` → 不檢查（optional）。
- **baseline impact**：0 production 命中；negative fixture 必觸發 → 動 baseline。

### F. fileUrl coexistence / migration interaction

- **legacy `download.fileUrl` 是否可與 `assetRefs[]` / `formRef` 共存**：✅ 可（grandfather；schema-decision §9.3）。
- **是否應 warning**：可選候選 `download-fileurl-with-registry-refs`（兩種模式並存 → 提示擇一）。⚠ **第一批不建議**：屬 migration 階段 hint，且需先盤點 production；不在 type/empty 最小批內。
- **是否留到 migration phase**：✅ 是。coexistence warning + 任何 fileUrl→ref 遷移屬未來 migration（schema-decision P7），逐篇 user 明示。
- **避免第一批破壞 baseline**：第一批**只**做 ref 結構檢查（type/empty），**不**碰 legacy fileUrl 之任何新規則 → 不直接命中既有 fileUrl 文章 → 不污染既有 D1/D2/D3/S 計數。

### G. contentKind gating

- **是否只在 `contentKind === 'download'` 檢查 / 或任何 post 有 `download.assetRefs`/`formRef` 都檢查**：
  - **建議：以「`download` 區塊存在且含 `assetRefs`/`formRef` 欄位」為觸發前提，而非綁死 `contentKind`。** 理由：mirror 既有 D2（`download-fileurl-invalid-type` 不要求 contentKind，只要 `download.fileUrl` 存在）；type/empty 屬結構性，任何誤填 ref 的 post 都該被接住。
  - **例外（語意層）**：D1（`download-enabled-fileurl-empty`）有 `contentKind==='download'` gate；若未來加 A2「ready download 但 assetRefs 空且無 formRef」之語意規則，則該語意規則應 gate `contentKind==='download'`（與 D1 對齊）。但 type/empty（A/B/D）**不**需 contentKind gate。
- **Blogger / GitHub 是否一致**：✅ 一致。`validate-content.js` main 同時掃 github + blogger + fixtures（`:1236-1255`）；規則對兩站套用相同邏輯，**不分站**。download 內容雖以 Blogger 為主（template `primaryPlatform: blogger`），但 validator 不因 site 改變 ref 規則。

---

## 5. Rule Severity / Naming Proposal

| candidate rule id | severity | fixture suitability | baseline impact | fixture need | 是否會命中 production content |
|-------------------|----------|---------------------|-----------------|--------------|------------------------------|
| `download-assetrefs-invalid-type` | warning | content-level negative（純 frontmatter；`assetRefs` 非 array） | 動（+1 post +1 warning/fixture） | ✅ 需 negative fixture | ❌ 否（0 文章用 `assetRefs`） |
| `download-assetref-invalid-type` | warning | content-level negative（`assetRefs[i]` 非 string） | 動 | ✅ 需 | ❌ 否 |
| `download-assetref-empty` | warning | content-level negative（`assetRefs[i]` 空字串） | 動 | ✅ 需 | ❌ 否 |
| `download-asset-ref-not-found` | warning | negative 易（empty registry 必命中）；positive 需 non-empty registry overlay | 動 | ✅ negative 需；positive 需 overlay | ❌ 否（0 文章用 ref） |
| `download-formref-invalid-type` | warning | content-level negative（`formRef` 非 string） | 動 | ✅ 需 | ❌ 否 |
| `download-formref-empty` | warning | content-level negative（`formRef` 空字串） | 動 | ✅ 需 | ❌ 否 |
| `download-form-ref-not-found` | warning | 同 not-found（negative 易；positive 需 overlay） | 動 | ✅ negative 需；positive 需 overlay | ❌ 否 |
| `download-fileurl-with-registry-refs` | warning | content-level（fileUrl + ref 並存） | ⚠ 視盤點；若命中既有 fileUrl+ref 文章則動（目前 0 篇有 ref → 0 命中，但屬 migration 範疇） | 需（共存 fixture） | ❌ 目前否（無文章同時有 ref） |
| `download-assetref-duplicate` | warning | content-level negative（同 post 重複 ref） | 動 | ✅ 需 | ❌ 否 |

命名原則：

- 沿用 `download-*` kebab-case prefix，與既有 D1/D2/D3/S 一致。
- **複數欄位本身**（`assetRefs` array 結構）→ `download-assetrefs-*`（如 `download-assetrefs-invalid-type`）。
- **單筆 item**（`assetRefs[i]`）→ `download-assetref-*`（單數；如 `download-assetref-invalid-type` / `-empty` / `-duplicate`）。
- **not-found** 採 `-ref-not-found` 後綴，mirror `related-links-source-key-not-found`（注意：not-found 用 `download-asset-ref-not-found` / `download-form-ref-not-found`，與 spec 一致）。
- 全部 **warning**（無 error）；與既有 download validation 全 warning-only 一致；duplicate / coexistence 屬 hint，更不應 error。

---

## 6. Recommended First Reference Validation Batch

| Option | 內容 | risk | baseline impact | fixture need | value / 評估 |
|--------|------|------|-----------------|--------------|--------------|
| **A** | 只做 **type / empty** checks（A/B/D：`assetRefs` array type、item type、item empty、`formRef` type、`formRef` empty），**不**做 not-found | 🟢 低（純 frontmatter；不讀 registry；不碰 legacy fileUrl） | 🟡 動（需 negative fixture 才有覆蓋 → +N post +N warning），但**不**命中 production（0 篇用 ref） | content-level only；**不需** registry overlay | 🟢 高 CP 值：建立 ref 結構檢查地基；最乾淨邊界；不依賴 overlay |
| **B** | 做 **not-found** checks，但**不**新增 fixture | 🔴 高（規則無測試覆蓋；empty registry effect 使任一 ref 必 not-found，但無 fixture → 無法證明觸發 / 不觸發） | 🟢 0（無 fixture → 0 命中，但等於 dead rule） | 不加（→ 無覆蓋） | 🔴 低：規則存在但無回歸；empty registry 下 positive 無法驗 |
| **C** | not-found checks **+ committed negative fixtures** | 🟡 中（negative fixture 易造；但 positive case 需 non-empty registry overlay，現行架構無） | 🔴 動（+N post +N warning）；且 positive 缺口仍在 | negative 需；positive 需 overlay（現行無機制） | 🟡 中：有 negative 回歸，但 positive 缺口 + overlay 依賴未解 |
| **D** | 先不 source，**先做 fixture batch design docs-only** | 🟢 0 | 🟢 0 | — | 🟢 高：在 source 前定 fixture 命名 / 放置 / batch 切分 / expected baseline，符合保守 cadence |
| **E** | 先做 **content schema / migration preanalysis docs-only**（post frontmatter 加 `assetRefs[]`/`formRef` 之 schema 追加 + fileUrl 共存/migration 邊界） | 🟢 0 | 🟢 0 | — | 🟢 中-高：固化 post schema 追加形態，為 source 提供 schema 前置 |

### 6.1 推薦最小安全方案

**推薦：預設 Final Idle Freeze / EXIT；若要推進但不動 source → Option D（fixture batch design docs-only）；若 user 明示要進 source → Option A（type/empty 最小集）。**

理由（對齊原則）：

1. **不破壞 0/47/42 baseline**：Option D / E 為 docs-only，0 影響。Option A 雖需 fixture（動 baseline），但**不**命中 production（0 篇用 ref），且 type/empty 屬純 frontmatter，不碰 legacy fileUrl。
2. **不直接碰 legacy fileUrl**：Option A 排除任何 fileUrl 新規則（coexistence 留 migration）。
3. **不同時處理 migration**：fileUrl→ref migration 屬 schema-decision P7，逐篇 user 明示，不在第一批。
4. **不混入 Admin / renderer**：本批與 §10 non-goals 一致，全部排除。
5. **若 source phase 會需要 fixture，應先做 fixture batch design**：Option A 之 type/empty 規則需 committed negative fixtures → 故 source 前**應先** Option D（fixture batch design）定案命名 / expected baseline，再進 Option A source。此與 pm-21 fixture strategy §6.1「先 fixture batch design，後 source preflight」一致。

明確**排除**第一批：

- ❌ B（not-found 無 fixture → dead rule）。
- ❌ not-found 之 positive case（需 non-empty registry overlay；機制未定）。
- ❌ `download-fileurl-with-registry-refs`（migration hint；須先盤點）。
- ❌ `download-assetref-duplicate`（hint；優先級低）。
- ❌ A2 `download-assetrefs-empty`（語意層；須先定 formRef-only 豁免）。

---

## 7. Fixture Requirements

### 7.1 哪些 rules 一定需要 committed fixtures

| rule | fixture 需求 | 類型 |
|------|--------------|------|
| `download-assetrefs-invalid-type` | ✅ 需 | content-level negative（純 frontmatter；`assetRefs` 設 string/object） |
| `download-assetref-invalid-type` | ✅ 需 | content-level negative（`assetRefs: [123]` 之非 string item） |
| `download-assetref-empty` | ✅ 需 | content-level negative（`assetRefs: [""]`） |
| `download-formref-invalid-type` | ✅ 需 | content-level negative（`formRef: 123`） |
| `download-formref-empty` | ✅ 需 | content-level negative（`formRef: ""`） |
| `download-asset-ref-not-found`（negative） | ✅ 需 | content-level negative（`assetRefs: ["nonexistent"]` + empty registry → 必命中） |
| `download-form-ref-not-found`（negative） | ✅ 需 | content-level negative（`formRef: "nonexistent"`） |

### 7.2 哪些 rules 可用 synthetic / no-op acceptance

- **not-found 之 positive case**（ref 存在 → 不報）：無法以 committed content-level fixture 表達（需 non-empty registry）→ 宜用 **synthetic in-memory acceptance**（直接構造含真實 entry 的 mock registry + mock post 呼叫 `validateContent`），或延後至 §7 overlay 機制（Option C of pm-21）定案後再造 positive committed fixture。
- **registry-level（Option A，已 landed）**：維持 synthetic in-memory（per pm-21 §4.A）；本批不補 committed fixture。

### 7.3 是否應先測 invalid type / empty ref，再測 not-found

✅ **是。** 順序建議：

1. **第一批**：type / empty（純 frontmatter；不依賴 registry 狀態）。
2. **第二批**：not-found negative（依賴 empty registry → 任一 ref 必命中）。
3. **第三批（延後）**：not-found positive（依賴 non-empty registry overlay）。

理由：type/empty 與 registry 內容無關，最穩定、最不受未來 registry 變動干擾；not-found 命中與否取決於 registry entry，耦合度較高。

### 7.4 是否需要 Blogger / GitHub 各一組

- **type / empty**：規則對兩站一致（§4.G），**理論上一站一 fixture 即可覆蓋規則邏輯**。但既有 download fixtures 全在 `blogger/posts/`（download 內容以 Blogger 為主）→ 建議 ref negative fixtures 亦**放 blogger** 為主，符合既有慣例。
- **若要驗證「規則確實不分站」**：可選擇性在 github 補 1 組對照（非必須）。本批傾向 **blogger 為主，github 對照可選**，避免無謂膨脹 post count。

### 7.5 expected post count / warning count 如何變動

- 每新增 1 個 `_test-*.md` fixture → **post count +1**。
- 每個 negative fixture 命中其目標規則 → **warning count +1**（若單檔觸發多條則 +N）。
- 範例（第一批 type/empty 共 5 條，各 1 negative fixture，各命中 1 warning）：`0/47/42 → 0/52/47`。實際 expected 計數須於 source/fixture phase 之 acceptance 文件**預寫**並 cross-check `validate:content` 實測。

### 7.6 是否需要 positive fixtures

- **type/empty 規則**：positive（valid `assetRefs: ["valid-id"]` 不報 type/empty warning）可由「正常 ready download 文章」自然覆蓋，但因 registry 為空，該 valid-format ref 會觸發 not-found（若 not-found 規則同批落地）→ 故 type/empty 之 positive 不宜與 not-found 混在同一 fixture。建議 type/empty positive 用「ref 格式正確且**暫不啟用 not-found**」或 synthetic 驗證。
- **not-found 規則**：positive（ref 存在 → 不報）**需 non-empty registry** → 延後至 overlay 機制。
- 結論：**第一批不強制 committed positive fixture**；positive 覆蓋以 synthetic in-memory 為主，待 overlay 機制定案再評估 committed positive。

---

## 8. Baseline Impact Estimate

- **若目前無 `assetRefs`/`formRef` production usage，type-only source 是否 0 baseline impact**：
  - **規則本身對 production = 0 命中**（0 篇用 ref；template/draft 不入 validate）。
  - **但若同批加 committed negative fixtures**（為取得測試覆蓋）→ baseline **會動**（post/warning +N）。
  - 若採「source 落地但**不**加 fixture」（Option B 式）→ baseline 0 但規則無覆蓋（不建議）。
  - ⇒ **「type-only source + committed negative fixtures」會動 baseline；「type-only source 無 fixture」0 baseline 但無回歸。** 兩者擇一須在 acceptance 預寫 expected。
- **warning count 如何更新**：每 negative fixture +1（或 +N）；於 acceptance 預寫 `0/47/42 → 0/(47+N)/(42+M)` 並 cross-check。
- **若 not-found 遇到 empty registry，是否容易大量 warning**：
  - ⚠ **是，但僅限「有設 ref 的文章/fixture」。** empty registry 下，**任一** non-empty `assetRefs[i]` / `formRef` 必 not-found。目前 0 production 文章用 ref → production 0 命中；但**若未來作者開始用 ref 而 registry 仍空** → 每個 ref 都會 not-found 大量 warning。⇒ not-found 規則之啟動，宜與「registry 已有對應 entry」之 workflow 協調（先填 registry，再用 ref），否則噪音偏高。此為 not-found 延後於 type/empty 的另一理由。
- **legacy fileUrl 共存 warning 可能是否命中現有 production**：
  - `download-fileurl-with-registry-refs` 需「同一 post **同時**有 fileUrl 與 ref」。目前 0 篇有 ref → **0 命中**。但此規則屬 migration hint，本批不做。
  - 既有 D1/D2/D3/S 對 fileUrl 之命中**不變**（本批不碰 fileUrl）。
- **哪個方案最能維持 baseline**：
  - 🟢 Option D（fixture batch design docs-only）/ E（schema/migration preanalysis docs-only）→ **0 影響**。
  - 🟡 Option A（type/empty source + fixture）→ 動 baseline（但不命中 production）。
  - 🔴 Option C（not-found + fixture）→ 動 baseline + positive 缺口 + overlay 依賴。

---

## 9. Implementation Scope For Future Source Phase

未來若 content reference validation 進 source，可能涉及：

- `src/scripts/validate-content.js`（新增 ref type / empty / not-found 規則；mirror `validateRelatedLinksField` 之 helper + Set lookup pattern）。
- `content/validation-fixtures/{blogger,github}/posts/_test-download-*.md`（若 co-landed committed negative fixtures）。
- docs acceptance（read-only cross-check 驗收 commit；預寫 expected baseline）。

明確邊界：

- **本 phase 不修改上述任何檔案。** 本 phase 僅新增本 docs 檔；`validate-content.js` / `load-settings.js` / fixtures / registries / templates / content 一行不動。
- **第一個 source phase 應避免修改 `load-settings.js` / registries / content templates**：ref validation 只需既有 `settings.downloadAssets` / `settings.downloadForms`（loader 已暴露）+ post frontmatter；**不**需擴張 loader、**不**需改 registry、**不**需改 template。
- post frontmatter schema 之 `assetRefs[]` / `formRef` 欄位**追加**（如要寫進 template）屬另一獨立決策（schema/migration preanalysis，Option E）；validator 規則可在「欄位存在才檢查」前提下先落地，不強制 template 同步。

---

## 10. Governance / Non-goals

本 phase **明確不做**（per schema-decision §8 R1 + pm-21 §9 + CLAUDE.md §3 紅線）：

- ❌ registry mutation（不寫 `download-assets.json` / `download-forms.json`）。
- ❌ respondent data（不引入任何個資欄位 / 不放真實 Google Form submission）。
- ❌ token / private Drive info（不引入秘密 / 私人路徑 / 帳號 email）。
- ❌ content migration（不遷 `download.fileUrl` → `assetRefs[]` / `formRef`）。
- ❌ Admin picker。
- ❌ renderer / landing page。
- ❌ build / deploy（不 `npm run build:*` / 不 push gh-pages / 不改 dist）。
- ❌ Blogger repost。
- ❌ GA4 validation（不做 GA4 Realtime / DebugView）。
- ❌ reverse UTM activation（remains landed but dormant）。
- ❌ pm-26 unblock（remains BLOCKED）。
- ❌ Admin Apply / middleware write route / `admin-write-cli` dry-run / apply / real write（全 dormant）。
- ❌ registry malformed JSON hardening（屬 loader robustness 範疇；非本批）。
- ❌ 修改 `validate-content.js` / `load-settings.js` / 任何 source。
- ❌ 新增 fixture / 新增 warning / 實作任一 ref validation 規則。

---

## 11. Candidate Next Phases

| 候選 | 性質 | 啟動條件 |
|------|------|---------|
| **Final Idle Freeze / EXIT** | — | ✅ 預設；本 phase 結束即 freeze |
| content reference validation preanalysis **acceptance read-only**（驗收本 docs commit） | read-only | 保守 next；cross-check 本 docs 內部一致性 + baseline 不變 |
| content reference **fixture batch design** docs-only（Option D） | docs-only | source 前先定 fixture 命名 / 放置 / batch 切分 / expected baseline |
| content reference **source preflight** read-only | read-only | 進 source 前最後 read-only 盤點 |
| content reference **source implementation**（Option A type/empty 最小集） | source（動 baseline） | ⚠ future only；**需 user 明示** |
| content **schema / migration preanalysis** docs-only（Option E） | docs-only | post frontmatter `assetRefs[]`/`formRef` 追加 + fileUrl 共存/migration 邊界 |
| Admin picker preanalysis | docs-only | dormant；保守可提議（但非優先） |
| renderer / landing page preanalysis | docs-only | dormant；保守可提議（但非優先） |

---

## 12. Final Recommendation

- **本 docs 後是否要直接 source implementation**：**否**（預設）。目前 registry empty、0 篇用 `assetRefs`/`formRef`、legacy/SEO 已覆蓋，無迫切觸發樣本；維持 docs-first cadence。
- **若不建議，下一步是 acceptance 還是 freeze**：預設 **Final Idle Freeze / EXIT**；若需保守驗收，下一步為 **read-only acceptance cross-check**（驗收本 docs commit，不改任何檔）。
- **若未來要 source，最小安全 batch 是什麼**：**Option A**——`assetRefs[]` / `formRef` 之 **type / empty** 檢查（純 frontmatter，全 warning-only，不讀 registry、不碰 legacy fileUrl、不碰 migration）。明確排除 not-found 之 positive case（需 overlay）、coexistence hint、duplicate、A2 empty 語意規則於第一批。
- **是否需要先做 fixture batch design**：✅ **是。** Option A 之 type/empty 規則需 committed negative fixtures → source 前**應先** content-reference **fixture batch design docs-only**（Option D），定案 fixture 命名 / 放置 / batch 切分 / expected baseline，再進 Option A source。此與 pm-21 §6.1「先 fixture batch design，後 source preflight」一致。
- **預設結論**：**Final Idle Freeze / EXIT**；不自動啟動下一 phase；下一步若要保守，應做 read-only acceptance cross-check 驗收此 docs commit。

---

（本文件結束）
