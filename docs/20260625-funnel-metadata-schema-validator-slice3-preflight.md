# Funnel metadata validator — Slice 3 preflight（F1 §5.3 / §5.4 盤點與下一階段鎖定）

- Phase id：`20260625-funnel-metadata-schema-validator-slice3-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only preflight**（盤點 + 鎖定下一階段規則；**不**做 source implementation）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / 索引 metadata 之 validation 規劃；**不**改任何 indexing decision）
- 允許範圍（本 Session）：**只**新增本 docs preflight record；**不**改 `validate-content.js` / `check-page-type-validator.js` / content / settings / package / lockfile / CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML。
- 前序：
  - `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 schema preflight；§5 validator candidate 來源）
  - `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（Slice 1：§5.1 結構 / enum / suspicious-field）
  - `docs/20260625-funnel-metadata-schema-validator-slice2-required-combo-landing-record.md`（Slice 2：§5.2 required-combo）

---

## 1. F3 baseline 摘要

| 項目 | 值 |
| --- | --- |
| baseline | `069df43`（HEAD == origin/main；ahead/behind 0/0；working tree clean；`.git/index.lock` absent） |
| F2（slice 1）已完成 | §5.1 structural / enum / suspicious-field checks（`downloadFunnel-invalid-type` / `-role-missing` / `-role-invalid-enum` / `-suspicious-field`） |
| F3（slice 2）已完成 | §5.2 required-combo / field-combination checks（8 條：entry-missing-target / gated-page-missing-entry-pages / target-wrong-role / entry-pages-wrong-role / target-invalid-type / entry-pages-invalid-type / too-many / duplicate） |

current validation baseline（本 phase 開始時已知值）：

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js` | 71 passed / 0 failed |
| `npm run validate:content` | 0 / 133 / 105 |
| `npm run report:validation` | 0 / 133 / 105 |
| overlay（`validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json`） | 0 / 140 / 106 |

production `downloadFunnel` 觸發數 = 0（無 production / fixture post 含 `downloadFunnel`）。

---

## 2. F1 §5.3 / §5.4 規則逐條盤點

分類圖例：
- **(a)** 已由 F2/F3 covered
- **(b)** 可在下一個 source slice 落地（low risk）
- **(c)** 需要再拆更小 slice（中複雜度 / 需額外推導）
- **(d)** 應 deferred
- **(e)** 不應實作（含原因）

### 2.1 §5.3 安全 / secret 類

| Code | 觸發條件（§5.3 原文意圖） | 分類 | 理由 |
| --- | --- | --- | --- |
| `downloadFunnel-target-gated-page-private-secret` | `targetGatedPage` 命中 Drive folder/file ID / Form edit/response/prefill URL / token / respondent / email / private token query string（啟發式 pattern） | **(c)** | F2 之 suspicious-field 只攔「未授權 key 名」，**不**掃 allowed key 的 **value**；此為全新 value-based heuristic，屬高風險（false-positive + 嚴格不可 echo value），應自成獨立 slice + 充分 placeholder fixture，**不**併入最小 slice |
| `downloadFunnel-entry-pages-private-secret` | `entryPages` 內任一 entry 命中同上 secret pattern | **(c)** | 同上；與 target-gated-page-private-secret 同族，建議同一獨立 secret-heuristic slice 一起落地 |
| `downloadFunnel-suspicious-field-secret-like` | `suspicious-field` 之 key name 命中 secret 命名（token / apiKey / respondent / formResponse / editUrl / driveFolderId） | **(a)（功能上）** | F2 之 `downloadFunnel-suspicious-field` 已對**任何**非 allowed-4 key（含 token / driveFolderId）觸發 warning 且不 echo value（slice-1 harness case 54 證實）；本碼僅為「再加 secret-like 子標籤 + 移除提示」之**強化**，價值低，建議 **(d) deferred**（不另開 code，避免雙重 warning 噪音） |

### 2.2 §5.4 跨欄位一致性類

| Code | 觸發條件（§5.4 原文意圖） | 分類 | 理由 |
| --- | --- | --- | --- |
| `downloadFunnel-role-conflicts-sitemap-safety` | `role: gated_page` 但 `includeInSitemap: true`（或 `platformPolicy.github.includeInSitemap: true`） | **(b)** | 純單篇欄位比較（role × includeInSitemap 布林）；無 value 處理→零 secret 風險；mirror 既有 SP-2 rule 7（noindex × includeInSitemap）模式 |
| `downloadFunnel-role-conflicts-listings-default` | `role: gated_page` 但 `includeInListings: true` | **(b)** | 同上；純 role × includeInListings 布林比較；mirror SP-2 rule 6 / 8 |
| `downloadFunnel-gated-page-pageType-mismatch` | `role: gated_page` 但 `pageType` 非 `gated_download` / `download` | **(b)** | 純 role × pageType enum 比較；無 value；mirror §4.1 強制配對 |
| `downloadFunnel-role-conflicts-robots-safety` | `role: entry` 但 effective robots = noindex；或 `role: gated_page` 但 effective robots = index | **(c)** | 需推導 **effective robots**（須結合 `seo.indexing` **與** `pageType→noindex`，即 `page-type-robots.js` 之衍生邏輯）；validator 現僅有 `seo.indexing`-based `isNoindex`，正確實作須重用 robots 衍生→耦合較高，宜自成一 slice（建議在 (b) 組之後） |
| `downloadFunnel-bidirectional-inconsistent` | gated page `entryPages` 列 X 但 X 之 `targetGatedPage` 未指回；或 entry `targetGatedPage` 指 Y 但 Y 之 `entryPages` 未含本頁 | **(d)** | cross-file check（需全 corpus 交叉比對）；§5.4 原文已標「未來實作可選」；最複雜，最後做或長期 deferred |

### 2.3 §5.1 殘留（非 §5.3/§5.4，但盤點完整性附記）

| Code | 分類 | 理由 |
| --- | --- | --- |
| `downloadFunnel-cta-event-name-invalid-enum` | **(d)** | §3.2.4 明示 `ctaEventName` enum 待 **F7 GA4 normalization** 才裁定唯一值；現不實作 |
| `downloadFunnel-cta-event-name-not-normalized` | **(d)** | 同上；與 F7 綁定 |

---

## 3. 下一階段（F5）最小 source slice 建議

### 3.1 建議：§5.4 「單篇 role ↔ policy 一致性」三規則

**只選這一組最小 slice**：

| # | warning code | 觸發條件 |
| --- | --- | --- |
| 1 | `downloadFunnel-role-conflicts-sitemap-safety` | `role: gated_page` 且（top-level `includeInSitemap: true` **或** `platformPolicy.github.includeInSitemap: true`） |
| 2 | `downloadFunnel-role-conflicts-listings-default` | `role: gated_page` 且 top-level `includeInListings: true` |
| 3 | `downloadFunnel-gated-page-pageType-mismatch` | `role: gated_page` 且 `pageType` 非 `gated_download` / `download`（含缺省以外之非法值；缺省 `pageType` 不觸發） |

### 3.2 為何這組風險最低、最不影響 production baseline

1. **純單篇欄位比較、零 value 處理**：三規則只比對 `role`（enum）× `includeInSitemap` / `includeInListings`（布林）× `pageType`（enum）；message 只含欄位名 + 布林 / enum 字串，**完全不碰** `targetGatedPage` / `entryPages` 之 value → **零 secret-leak 風險**（與 §5.3 value-heuristic 形成對比）。
2. **mirror 既有成熟 pattern**：與 SP-2 rules 5/6/7/8（`pageType` × `seo.indexing` × `includeIn*` 正交組合）幾乎同形；validator 內已有同型程式碼可比照，回歸風險低。
3. **warning-only，不改 indexing decision**：三規則**只**新增 warning，**不**改 `page-type-robots.js` / `include-in-sitemap.js` / `include-in-listings.js` 任何 effective 行為；既有 noindex / download / special pageType safety 與 §4.7 安全優先順序**完全不變**。實際上這些 warning 是在**作者試圖以 `includeIn*: true` 鬆動 gated-page safety 時提出告警**，方向為**強化**安全，絕不放寬。
4. **0 production trigger**：無 production post 含 `downloadFunnel` → `npm run validate:content` 預期**維持 `0 / 133 / 105`**；overlay 預期維持 `0 / 140 / 106`。

### 3.3 預期規模

- 新增 warning code：**3**
- 新增 harness case：約 **9–11**（每規則 trigger + valid-non-trigger；sitemap 規則含 `platformPolicy.github.includeInSitemap` 變體；pageType-mismatch 含 `pageType=download` 合法 / `pageType=article` mismatch / 缺省不觸發 三態）
- production `validate:content`：**應維持 `0 / 133 / 105`**（若變動則停下回報，不 commit）
- 影響檔案（F5 實作時）：僅 `src/scripts/validate-content.js`（block 13）+ `src/scripts/check-page-type-validator.js`（harness）+ F5 landing doc

### 3.4 F5 之後的排序建議（不在本 slice）

1. **F6** = `downloadFunnel-role-conflicts-robots-safety`（需 effective-robots 衍生；自成一 slice）
2. **F7-secret** = §5.3 `target-gated-page-private-secret` + `entry-pages-private-secret`（value-based heuristic；獨立 slice + 充分 placeholder fixture）
3. **F-bidirectional** = `downloadFunnel-bidirectional-inconsistent`（cross-file；最後做或長期 deferred）
4. `cta-event-name-*` 兩碼隨 **F7 GA4 normalization** 一起裁定

---

## 4. 安全規則（所有未來 funnel validator slice MUST 遵守）

1. 所有未來 warning 必須 **warning-only**（`severity: 'warning'`；無 error / hard gate）。
2. **不可 echo sensitive value**：message 只允許輸出 欄位名 / typeof / index / count / 布林 / enum 字串。
3. **不可輸出真實** URL / Drive ID / Form URL / token / respondent data；所有 harness / fixture sample 一律 **placeholder / fake**（如 `example.com` / `zhuyin-intro` / `entry-N`）。
4. **不可改 indexing decision**：`downloadFunnel` 為純 metadata（§4.7 最低層）；robots / sitemap / listings 之 effective 結果**永遠**由 `seo.indexing` / `pageType` / `contentKind` / `platformPolicy` / top-level `includeIn*` safety 決定。
5. **不可鬆動** noindex / sitemap / listings 之安全優先順序（§4.7）；funnel warning 只能**告警矛盾**，不能成為放寬 safety 的 escape hatch。

---

## 5. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- `.md` fixture 補齊（funnel validator 至今採 harness-only；fixture 可後補）
- live funnel（前導頁 → gated download page 實際串接）
- Google Form / Google Drive integration（embed / response / file 真實串接）
- GA4 backend write（`ctaEventName` wiring 屬 F7）
- Admin write path（funnel 欄位 Apply / dryRun:false）
- 真實下載頁內容（gated download page `.md` 內容）
- production content migration（既有 production post 加 `downloadFunnel`）
- deploy / repost（GitHub Pages build / gh-pages push / Blogger 後台重貼）
- §5.3 value-based secret heuristic、§5.4 robots-safety / bidirectional（見 §3.4 排序）

---

## 6. 本 phase 非動作（non-actions）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 改 `src/scripts/validate-content.js` | ✅ 未動 |
| 2 | 改 `src/scripts/check-page-type-validator.js` | ✅ 未動 |
| 3 | 改 content `.md` / 新增 production fixture | ✅ 未動 |
| 4 | 改 settings / package / lockfile | ✅ 未動 |
| 5 | 改 CLAUDE.md / MEMORY.md | ✅ 未動 |
| 6 | 改 dist / gh-pages / .cache / generated HTML | ✅ 未動 |
| 7 | build / deploy / repost / dev server | ✅ 未執行 |
| 8 | Blogger live / Google Form / Drive / GA4 backend / AdSense / Search Console / Admin write path | ✅ 未動 |
| 9 | 加入 secrets / Drive IDs / Form response URLs / tokens / respondent data | ✅ 未動 |
| 10 | 改 indexing decision / 鬆動 noindex / sitemap / listings safety | ✅ 未動 |
| 11 | 推進 F1 §5.3 / §5.4 之 source | ✅ 僅盤點，未實作 |
| 12 | 僅新增本 1 個 docs preflight record | ✅ |

---

## 7. Cross-links

- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5.3 / §5.4 / §4.7 來源）
- `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（Slice 1）
- `docs/20260625-funnel-metadata-schema-validator-slice2-required-combo-landing-record.md`（Slice 2）
- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）
- `CLAUDE.md` §7 / §11 / §13 / §16 / §21

（本文件結束）
