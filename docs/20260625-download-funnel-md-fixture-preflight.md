# downloadFunnel `.md` fixture preflight (fixture strategy only)

- Phase id：`20260625-download-funnel-md-fixture-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only fixture preflight**（規劃 fixture strategy；**不新增任何 fixture**；不改 source）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）
- 允許範圍：**只**新增本 docs preflight record；不改 src / scripts / content `.md` / `content/validation-fixtures` / production fixture / settings / package / lockfile / CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML。
- 前序：
  - `docs/20260625-download-funnel-validator-series-closeout.md`（F2–F8 closeout；§7 建議下一步＝fixture preflight）
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5 validator candidate 總表）
  - `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）

---

## 1. Current baseline 摘要

| 項目 | 值 |
| --- | --- |
| baseline | `717f4ad` |
| latest subject | `docs(download): close out funnel validator series` |
| F2–F8 validator series | ✅ **已 closeout**（20 warning codes landed；docs-only closeout commit = `717f4ad`） |
| working tree / ahead-behind / index.lock | clean / 0-0 / absent |

current validation baseline（本 phase 量測）：

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js` | 103 passed / 0 failed |
| `node src/scripts/check-validation-report.js` | 22 passed / 0 failed |
| `npm run validate:content` | 0 / 133 / 105 |
| `npm run report:validation` | 0 / 133 / 105 |
| overlay | 0 / 140 / 106 |
| production `downloadFunnel` 觸發數 | **0** |

> 重要事實：`validate:content` 之 **133 warnings 全來自 `content/validation-fixtures/`**（production-post warnings = 0）。故未來新增 funnel fixture 會**有意識地**改動 133/105 之數值（僅 fixture 維度），production posts 仍 0。

---

## 2. Fixture 目標與非目標

### 目標
- 以真實 `.md` frontmatter 驗證 downloadFunnel metadata validator 行為（補足至今 harness-only、無 `.md` fixture 之缺口）。
- 驗證 **warning-only**（fixture 觸發後 severity 全 warning、validate:content errorCount 維持 0）。
- 驗證 **no value echo**（private-value / bidirectional fixture 之 report 輸出不含原始可疑 value）。
- 驗證 **production baseline 不受影響**（production posts 仍 0 funnel trigger；fixture 變動隔離於 `kind: fixture`）。

### 非目標（本 series 一律不做）
- 不新增 production content / 真實下載頁。
- 不新增真實 Google Form / Drive URL（一律 placeholder）。
- 不部署、不改 live Blogger、不改 GA4 backend。

---

## 3. Fixture 類型盤點（**規劃；本 Session 不新增 fixture**）

對應 F2–F8 之 20 codes，未來 fixture 分組：

| 群組 | 對應 codes（slice） | 樣本意圖 | 預期 warning |
| --- | --- | --- | --- |
| **valid entry page** | — | role=entry + targetGatedPage（slug）+ 無 entryPages | 0 funnel warning |
| **valid gated_page** | — | role=gated_page + entryPages + pageType gated_download + seo noindex-follow + includeIn* false | 0 funnel warning |
| **valid funnel pair**（reciprocate） | bidirectional positive（slice 10） | entry ↔ gated 互相 reciprocate | 0 funnel warning（正向確認 reciprocity 通過） |
| structure / enum / suspicious invalid | slice 1（4 codes） | invalid-type / role-missing / role-invalid-enum / suspicious-field 各一 | 各 1 warning |
| required-combo invalid | slice 2（8 codes） | missing-target / missing-entry-pages / wrong-role / invalid-type / too-many / duplicate | 各 1 warning |
| role↔policy invalid | slice 4（3 codes） | gated_page + includeInSitemap/Listings true / pageType mismatch | 各 1 warning |
| robots-safety invalid | slice 6（1 code） | gated_page + 可索引 effective robots | 1 warning |
| private-value invalid | slice 8（2 codes） | targetGatedPage / entryPages 命中 drive.example.com / forms.example.com / token query | 各 1 warning |
| bidirectional inconsistent | slice 10（2 codes） | entry→gated 但 gated 未列回 / gated 列 entry 但 entry 未指回（corpus pair） | 各 1 warning |
| **no-value-echo** | private-value / bidirectional | 故意放 fake 可疑 value，斷言 report 輸出**不含**該 value | 觸發 warning，但 message 不 echo |
| **deferred cases**（負向 lock） | — | dangling / absolute URL / bare opaque ID / .html ref → 確認**保持 0 warning** | 0 warning（鎖「deferred 維持靜默」） |

→ **deferred cases fixture 應新增**（價值：把「dangling / absolute URL 等 deferred 案例保持 0 warning」釘成 regression lock），但建議放在 valid + private-value 之後的後續 slice，不在最小第一片。

---

## 4. Fixture 命名與位置建議（依現有慣例；本 Session 不新增檔）

現有慣例（read-only 確認 `content/validation-fixtures/github/posts/_test-page-type-gated-download-valid.md` 等）：

- **位置**：`content/validation-fixtures/github/posts/`（與既有 page-type / gated_download fixtures 同處；`blogger/posts/` 亦為合法慣例，但 funnel = 平台無關 metadata，建議統一放 `github/posts/`）。
- **檔名 pattern**：`_test-download-funnel-<case>.md`（`_test-` 前綴 = 既有 fixture 慣例；`download-funnel` 對齊欄位名）。
  - 例：`_test-download-funnel-valid-entry.md` / `_test-download-funnel-valid-gated-page.md` / `_test-download-funnel-private-value.md` / `_test-download-funnel-bidirectional-inconsistent-entry.md` …
- **frontmatter 慣例**（mirror 既有 fixture）：`title: "[validation-fixture] downloadFunnel …"`、`slug: "test-download-funnel-…"`（unique，避免 duplicate-slug）、`status: ready`、`date`、`contentKind`、`category`（**用既有合法 category，如 `tech-note`**）、`tags`（**用既有合法 tag，如 `github`**）、`cover`、`description`（說明 fixture 意圖 + 預期 validator 行為），再加 `downloadFunnel` 欄位。其餘欄位需齊全以**隔離**只觸發 funnel 規則（避免 missing-* 噪音）。

---

## 5. Fake data safety（強制規範）

未來 fixture **一律**：
- ❌ 不用真實 Drive ID / 真實 Form URL / 真實 response URL / 真實 token / respondent data / Dean 私有資料。
- ❌ warning message 測試**不得期待輸出原始 value**（no-echo fixture 斷言 report 之 `issue.value` **不含** fake URL／slug）。
- ✅ 可用明確假資料：`example.com` / `drive.example.com` / `forms.example.com` / `FAKE-*` / `test-download-funnel-*` slug。
- ✅ 與既有慣例一致（既有 gated_download fixture 之 `formEmbedUrl` 用 `…/forms/d/e/EXAMPLE/viewform` placeholder）。

---

## 6. Fixture landing 最小切片建議（下一個 phase；本 Session 不實作）

**建議最小第一片 = 3 個 fixture files**（同意 Dean 偏好：harness/fixture-only、不碰 production content）：

| # | 檔名 | 內容 | 預期 |
| --- | --- | --- | --- |
| 1 | `_test-download-funnel-valid-entry.md` | role=entry + `targetGatedPage: "test-download-funnel-valid-gated-page"` | 與 #2 reciprocate → **0 funnel warning** |
| 2 | `_test-download-funnel-valid-gated-page.md` | role=gated_page + `entryPages: ["test-download-funnel-valid-entry"]` + pageType gated_download + seo noindex-follow + includeInListings/Sitemap false | 與 #1 reciprocate → **0 funnel warning** |
| 3 | `_test-download-funnel-private-value.md` | role=entry + `targetGatedPage: "https://drive.example.com/drive/folders/FAKE"` | **1 warning** `downloadFunnel-target-gated-page-private-value`；no-echo |

說明（下一個 phase 之預期）：

- **新增 fixture 數**：3（valid pair 2 + invalid private-value 1）。
- **validate:content baseline 是否變動**：**會**。valid pair（#1/#2）觸發 **0** warning → 不改 count；invalid #3 觸發 **+1** warning + **+1** issue-post → `0/133/105` → **`0/134/106`**。overlay 同步 `0/140/106` → `0/141/107`。
- **如何隔離、不影響 production baseline**：fixture 全部位於 `content/validation-fixtures/`（`report-validation.js` 分類為 `kind: fixture`，**非** `post`）→ production-post warnings 仍 **0**；變動純屬 fixture 維度，屬「有意識 baseline 更新」（mirror Slice 1 `download-in-listings-default` +21 之先例）。
- **是否需要新增專用 checker**：**不需要**。沿用既有 harness —— `validate:content` 已自動掃 `content/validation-fixtures/`、`report:validation` 已聚合、`check-validation-report.js` 已驗 report 形狀與 totals。no-echo 之 `.md`-based 驗證可於 fixture landing 時在 `check-validation-report.js` 之 real-report B 段**加 1 條斷言**（private-value fixture 之 `issue.value` 不含 `drive.example.com`）。
- **是否需更新 `check-validation-report.js` baseline**：**需要**。其 `BASELINE = { errorCount: 0, warningCount: 133, issuePostCount: 105 }` 常數須隨 invalid fixture 同步更新（如 → 134/106），並同步更新 CLAUDE.md §3a validation baseline 表（`validate:content` / `report:validation` / overlay 三列 + 任何 harness 數）。此為**有意識** baseline bump，非 regression。

> 為何不先做 bidirectional-inconsistent / 全 20-code fixture：第一片只證「valid 不誤報 + 一個 invalid 正確報且不外洩」即足以建立 fixture 基礎設施與 baseline-bump 流程；其餘群組（required-combo / role-policy / robots / bidirectional-inconsistent / deferred-cases）逐片擴充，每片各自 conscious baseline bump，風險最小。

---

## 7. Production migration gate（content migration 前必過）

production content migration（真實 gated/entry `.md`）**前**之 gate（全部 ✅ 才可啟動 migration，且須 Dean explicit approval）：

1. fixture preflight 完成（本檔）。
2. fixture landing 完成（≥ 最小第一片；valid + invalid 已落地）。
3. validation baseline 明確（fixture-bump 後之 validate:content / report:validation / overlay / harness 數值已釘定並同步 CLAUDE.md §3a + `check-validation-report` BASELINE）。
4. no-value-echo 測試通過（private-value / bidirectional fixture 之 report 不含原始可疑 value）。
5. no real URL / token / Drive ID / Form URL / respondent data（fixture 全 placeholder）。
6. no build / deploy（migration 規劃階段不部署）。
7. Dean 明確核可。
8. live Form / Drive / GA4 backend 仍 **deferred**（migration 只放 `.md` metadata + placeholder，不接真實後端）。

---

## 8. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- dangling / missing-post warning（source）
- absolute URL matching（source）
- host-mismatch（source）
- bare opaque ID（source）
- .html / last-segment normalization（source）
- ctaEventName / GA4 normalization（preflight → source；綁 GA4 phase）
- production content migration（content；gate per §7）
- live funnel / Google Form / Drive integration / GA4 backend write（integration；CLAUDE.md §29 第一版永禁）
- Admin write path（governance）
- generated HTML / deployed robots verification（manual verification）
- Blogger robots dimension（manual；SP-9c）
- build / deploy / repost

---

## 9. 本 phase 非動作（non-actions）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 新增 / 改 `content/validation-fixtures/` 任何 fixture | ✅ 未動 |
| 2 | 改 src / scripts / content `.md` / production fixture / settings / package / lockfile | ✅ 未動 |
| 3 | 改 CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML | ✅ 未動 |
| 4 | build / deploy / repost / dev server | ✅ 未執行 |
| 5 | Blogger live / Form / Drive / GA4 backend / AdSense / Search Console / Admin write path | ✅ 未動 |
| 6 | 輸出 / 記錄真實 URL / token / Drive ID / Form URL / respondent data | ✅ 未動（範例全 placeholder） |
| 7 | 推進 dangling / absolute-URL / host-mismatch / ctaEventName / production migration 之 source | ✅ 僅規劃 |
| 8 | 僅新增本 1 個 docs preflight record | ✅ |

---

## 10. Cross-links

- `docs/20260625-download-funnel-validator-series-closeout.md`（F2–F8 closeout；建議來源）
- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5 validator candidate）
- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）
- `content/validation-fixtures/github/posts/_test-page-type-gated-download-valid.md`（既有 fixture 慣例範本）
- `src/scripts/check-validation-report.js`（`BASELINE` 常數；fixture landing 時須更新）
- `CLAUDE.md` §3a（validation baseline 表）/ §7 / §13 / §29

（本文件結束）
