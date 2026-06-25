# Funnel metadata validator — Slice 10（F8 bidirectional cross-file consistency）source landing record

- Phase id：`20260625-funnel-metadata-schema-validator-slice10-bidirectional-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**minimal source landing**（corpus cross-post validator + corpus/report harness；warning-only；additive）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J / L（cross-file validation）；**不**改任何 indexing decision
- 前序：
  - `docs/20260625-funnel-metadata-schema-validator-slice9-bidirectional-preflight.md`（F8 preflight；§2 架構 / §3 truth table / §4 落地層 / §5 code / §6 normalization）
  - `docs/20260625-funnel-metadata-schema-validator-slice8-secret-heuristic-landing-record.md`（F7 private-value；本 slice 重用其 `looksLikePrivateFunnelLink`）

---

## 1. Baseline（read-only verify；本 phase 開始時）

| 項目 | 值 |
| --- | --- |
| branch / HEAD == origin/main | `main` / `3d36350f000ad8957d98b30bdf495302287a8c13`（short `3d36350`） |
| latest subject | `docs(download): preflight funnel bidirectional validator` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

read-only 檢視：slice9（F8 preflight）/ slice8 / preflight-a / spec-lock docs、`src/scripts/validate-content.js`、`src/scripts/report-validation.js`、`src/scripts/check-validation-report.js`、`src/scripts/check-page-type-validator.js`、`CLAUDE.md`。

---

## 2. F8 preflight 如何導向本 source landing + 為何落在 corpus pass

F8 preflight（slice9）§2 盤點：`validatePageTypeMetadata` 為**單篇** validator（無 corpus context）；`validateContent({posts,settings})` **已有全 corpus context**，末段已存在 cross-post passes（`duplicate-slug` / `series-number-duplicate`）；`report-validation.js` 經 `CROSS_POST_TYPES` 聚合。§4 建議落在 **`validateContent` 末段 corpus cross-post pass**；§5 建議 **2 個方向性 code**。本 slice 即依此落地。

**為何不放 `validatePageTypeMetadata`**：它每次只看一篇 post，無法查詢其他 post 之 slug / funnel；bidirectional 必須在全 corpus 層做。**為何落 `validateContent` 末段**：corpus context 現成、pattern 既有（mirror duplicate-slug：建 Map → 解析 → 每篇各 push、`sourcePath` 指該檔、`value` 只用 safe identifier）、`report-validation` 經 `CROSS_POST_TYPES` 自動分桶。

明確性判定：**明確可落地**（§3 truth table + §6 normalization 完整）；未自行發明規則。

---

## 3. 新增 2 個 warning code

| code | 觸發 | 掛載 post |
| --- | --- | --- |
| `downloadFunnel-entry-page-not-listed-by-gated-page` | entry E 之 `targetGatedPage` 解析到存在的 gated_page G，但 G 之 `entryPages` 未列回 E 之 slug | **E（entry）** |
| `downloadFunnel-gated-page-not-targeted-by-entry` | gated_page G 之 `entryPages` 列入存在的 entry E，但 E 之 `targetGatedPage` 解析後 ≠ G 之 slug（definitively 指向他處） | **G（gated_page）** |

掛載原則：各 post 對「自身 outgoing funnel ref 未被對向 reciprocate」負責 → entry 之正向 ref 掛 entry、gated 之反向 ref 掛 gated；兩方向不對同一斷鏈重複告警。

實作位置：`validate-content.js` `validateContent` 末段 corpus cross-post pass（緊接 `series-number-duplicate`）；新增純函式 `normalizeFunnelRef`，重用 `looksLikePrivateFunnelLink`（F7）。

---

## 4. Truth table（落地行為）

| 情境 | 行為 |
| --- | --- |
| entry→gated 存在但 gated 未列回 entry | warning `entry-page-not-listed-by-gated-page`（掛 entry） |
| gated 列 entry 但 entry 未指回 gated | warning `gated-page-not-targeted-by-entry`（掛 gated） |
| bidirectional 一致 | 無 warning |
| multiple entries 指同一 gated 且皆列回 | 無 warning（合法） |
| one entry 指 multiple gated | schema 不可能（targetGatedPage 單值）→ N/A |
| target / entry post missing（dangling） | **deferred**，不告警（解析不到 post → skip） |
| absolute URL ref（含 `://`） | **deferred**，不 cross-file resolve（normalize→null→skip） |
| private-looking value（F7 命中） | **skip**（不重複 / 不外洩；F7 另行告警 private-value） |
| non-string / invalid type（F3 覆蓋） | **skip**（不重複告警） |
| role missing / invalid（F2 覆蓋） | **skip** |
| noindex / sitemap / listings / robots（F5/F6） | 正交，不重複告警 |

### 為何 deferred / skip

- **dangling / missing post**：referenced slug 解析不到 corpus 內任何 post → 屬 missing-post 面向（§ deferred），本 slice 不告警，避免與未來 dangling code 重疊。
- **absolute URL**：解析絕對 URL → post 需 host + path→slug（host-mismatch 範疇）→ deferred；`normalizeFunnelRef` 對含 `://` 之值回 null。
- **private value**：由 F7 `looksLikePrivateFunnelLink` 命中者 skip → 不對可疑值做 cross-file resolve（避免重複告警與外洩）。
- **non-string / invalid type**：由 F3 invalid-type 覆蓋 → skip。

reciprocity 之 indeterminate 處理：方向 2 中，若被列入之 entry 其 `targetGatedPage` 不可解析（absent / private / absolute）→ **skip（不假設「未指回」）**，避免 absolute-URL / private 之 false positive（harness C6 / C7 鎖定）。

---

## 5. Normalization / matching（實作範圍）

`normalizeFunnelRef(value)`：strip querystring/hash → strip 前後斜線；含 `://` 或空 → null；**case-sensitive**；**不**做 `.html` strip（deferred）、**不**取 last-segment（保守；多段 path 不匹配＝deferred）。只比對 simple slug / 單段 relative path。private value 由 `looksLikePrivateFunnelLink` 先擋（不轉成可比對 slug）。

---

## 6. 變更內容（changed files）

### 6.1 `src/scripts/validate-content.js`
- 新增純函式 `normalizeFunnelRef`。
- `validateContent` 末段新增 corpus cross-post pass（建 `funnelPostBySlug` Map → 兩方向 reciprocity → push 2 type，warning-only，`sourcePath` 指該檔、`value` 只用 own-slug）。**未改**單篇 `validatePageTypeMetadata`。

### 6.2 `src/scripts/report-validation.js`（最小修改：正確聚合新 cross-post code）
- `CROSS_POST_TYPES` 加入 2 新 code（→ 進 `buckets.crossPost` 聚合）。
- `classifyRuleClass` frontmatter regex 加 `downloadFunnel-`（避免新/既有 funnel code 落入 `unknown` class；與 `duplicate-slug` / `series-*` 同列 frontmatter）。

### 6.3 `src/scripts/check-validation-report.js`（corpus/report harness）
- import `validateContent`。
- 新增 `A8b`（新 code classify=frontmatter + crossPost bucket）。
- B4 之 crossPost 允許 type 清單擴充 2 新 code（forward-compat；real report 仍 0 funnel）。
- 新增 corpus-logic `C1–C7`（直接餵 `validateContent`，覆蓋 entry-not-listed / gated-not-targeted / 雙向一致 / multiple-entries / dangling-deferred / absolute-URL-deferred / private-skip；含 no-echo 不變式）。
- **未動** `check-page-type-validator.js`（單篇 harness；cross-file case 不塞入）。

### 6.4 `docs/20260625-funnel-metadata-schema-validator-slice10-bidirectional-landing-record.md`（本檔）

---

## 7. warning-only / no value echo / no production trigger

- **warning-only**：兩 rule severity `'warning'`（harness `bidir()` 對所有 BIDIR issue 斷言 warning）。
- **no value echo**：`value` 只含 own post slug（safe identifier）+ 由 `sourcePath` 指檔；**絕不** echo raw `targetGatedPage` / `entryPages` value（harness `bidir()` 斷言 value 不含 `://`）。
- **no production trigger**：無 production post 含 `downloadFunnel` → 0 觸發；validate:content / report:validation / overlay 全部不變。

---

## 8. 測試 / 驗證結果

| 指令 | F8 preflight baseline | F8 landing 後 |
| --- | --- | --- |
| `node src/scripts/check-page-type-validator.js`（單篇） | 103 / 0 | **103 / 0**（不變；未動） |
| `node src/scripts/check-validation-report.js`（corpus/report） | 14 / 0 | **22 / 0**（+8：A8b + C1–C7） |
| `npm run validate:content` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| `npm run report:validation` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| overlay | 0 / 140 / 106 | **0 / 140 / 106**（不變） |
| production `downloadFunnel` 觸發數 | 0 | **0** |

---

## 9. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- dangling / missing post warning
- absolute URL matching
- host-mismatch 判定
- bare opaque ID 判定
- `.html` suffix / last-segment normalization
- ctaEventName / GA4 normalization
- `.md` fixture
- production content migration
- live funnel / Google Form / Drive integration / GA4 backend write
- Admin write path
- generated HTML / deployed robots verification
- Blogger robots dimension
- build / deploy / repost

---

## 10. 未觸碰紅線（明確聲明）

- ❌ 未改 content `.md` / 未新增 production fixture / 未改 settings / package / lockfile / CLAUDE.md / MEMORY.md / `dist*` / gh-pages / `.cache`（report:validation 生成之 cache 為 git-ignored generated artifact，非 source）/ generated HTML。
- ❌ 未動 `check-page-type-validator.js`（單篇 harness）。
- ❌ 未碰 Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path；未 build/deploy/repost/dev server。
- ❌ warning message 未 echo URL / 原始 ref value / token / Drive ID / Form URL / respondent data；harness sample 全 placeholder slug（`entry-e` / `gated-x` / `drive.example.com` / `FAKE`）。
- ❌ 未改 indexing decision、未鬆動 noindex / sitemap / listings / robots safety。
- ❌ 未推進 dangling / absolute URL / host-mismatch / ctaEventName 之 source。

---

## 11. Cross-links

- `docs/20260625-funnel-metadata-schema-validator-slice9-bidirectional-preflight.md`（F8 preflight）
- `docs/20260625-funnel-metadata-schema-validator-slice8-secret-heuristic-landing-record.md`（F7；`looksLikePrivateFunnelLink` 來源）
- `src/scripts/validate-content.js`（`validateContent` cross-post pass：duplicate-slug / series-number-duplicate / 本 slice）
- `src/scripts/report-validation.js`（`CROSS_POST_TYPES`）
- `CLAUDE.md` §7 / §13 / §16 / §29

（本文件結束）
