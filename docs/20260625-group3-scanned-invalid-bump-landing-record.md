# downloadFunnel `.md` fixture — Group 3 landing (scanned INVALID, explicit baseline bump)

- Phase id：`20260625-group3-scanned-invalid-bump-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**scanned invalid fixture + explicit baseline bump**（首個 downloadFunnel scanned invalid `.md`；validate:content 0/133/105 → 0/134/106）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、C（內容 fixture）、L（validation harness）
- 授權：Dean explicit approval（§3a baseline-bump 紀律：§3a snapshot + `check-validation-report` BASELINE + Dean approval 三者齊備）

---

## 1. Baseline verify（進場）

`d271dc5`；latest subject `docs(state): sync funnel deferred fixture baseline`；working tree clean；ahead/behind 0/0；index.lock absent。進場 baseline：`validate:content` 0/133/105；`report:validation` 0/133/105；overlay 0/140/106；`check-page-type-validator` 103/0；`check:validation-report` 26/0；production downloadFunnel trigger 0。

read-only 檢視：closeout / group2 landing / group1 valid-entry & dangling fixtures、`src/scripts/check-validation-report.js`（BASELINE / B5 / B6）、`src/scripts/validate-content.js`（required-combo block 12 / `check-page-type-validator.js` line 431-432 in-memory 既有覆蓋）。

---

## 2. 為何選 required-combo missing-target 作為 scanned invalid case

| 條件 | 本 case |
| --- | --- |
| 觸發**恰 1** warning | ✅ role=entry 缺 targetGatedPage → 僅 `downloadFunnel-entry-missing-target-gated-page` |
| no-value-echo | ✅ message 只述「targetGatedPage is missing」，不含任何 value |
| 不依賴 corpus（單篇可判定） | ✅ 單篇 required-combo（block 12 / §5.2），非 bidirectional cross-file |
| in-memory harness 已證實單一 code | ✅ `check-page-type-validator.js` line 431-432：`{ role: 'entry' }` → `['downloadFunnel-entry-missing-target-gated-page']` |
| 非 private-value / 非 robots / 非 role-policy | ✅ 無 targetGatedPage value、role≠gated_page → 不觸發其餘分支 |

→ 最單純、最可審計之 scanned invalid 增量，bump delta 完全可預測（+1 warning / +1 issue post）。

---

## 3. 新增 fixture（scanned invalid，刻意觸發 1 warning）

| 檔案 | downloadFunnel | 觸發 |
| --- | --- | --- |
| `content/validation-fixtures/github/posts/_test-download-funnel-invalid-entry.md` | role=entry（**無** targetGatedPage） | `downloadFunnel-entry-missing-target-gated-page`（warning-only、no-value-echo）×1 |

frontmatter 其餘欄位 mirror group 1 `_test-download-funnel-valid-entry.md`（valid category `tech-note` / tag `github` / cover / 短 title 49 字 ≤60 / 短 description ≤160）→ 無 long-title / long-description / missing-* / taxonomy 等其他 warning。`validate:content` 逐行確認該 fixture **僅** 1 warning。

---

## 4. Baseline bump（前 → 後）

| 指令 | 進場 | landing 後 | Δ |
| --- | --- | --- | --- |
| `npm run validate:content` | 0 / 133 / 105 | **0 / 134 / 106** | +1 warning / +1 issue-post |
| `npm run report:validation` | 0 / 133 / 105 | **0 / 134 / 106** | +1 / +1 |
| overlay（`--registry-overlay …commerce-c4-c9-overlay.json`） | 0 / 140 / 106 | **0 / 141 / 107** | +1 / +1 |
| `node src/scripts/check-page-type-validator.js`（單篇 harness） | 103 / 0 | **103 / 0** | 不變（未動單篇 harness） |
| `npm run check:validation-report`（corpus/report harness） | 26 / 0 | **27 / 0** | +1（B7 斷言） |
| production `downloadFunnel` 觸發數 | 0 | **0** | 不變 |

→ **bump = YES**，唯一來源為本 scanned invalid fixture（fixture-derived，非 production）。errorCount 恆 0（warning-only）。

---

## 5. 變更內容（changed files）

| 檔案 | 變更 |
| --- | --- |
| `content/validation-fixtures/github/posts/_test-download-funnel-invalid-entry.md` | 新增 scanned invalid fixture（恰 1 required-combo warning） |
| `src/scripts/check-validation-report.js` | BASELINE 133/105→134/106；B2 comment 0/133/105→0/134/106；+B7 斷言（該 fixture 端對端恰 1 warning、kind=fixture、code 精確） |
| `CLAUDE.md` | §3a validation baseline 表 4 列 + frozen-baseline 段落 inline 26/0→27/0 + group 3 bump 紀錄（極小 sync，未壓縮歷史） |
| `docs/20260625-group3-scanned-invalid-bump-landing-record.md` | 本檔 |

**未動**：`validate-content.js` 邏輯 / `report-validation.js` / `check-page-type-validator.js`、production content `.md`、settings、package/lockfile、MEMORY.md、dist / dist-blogger / dist-promotion / gh-pages / .cache / generated HTML。（`dist-reports/*.json` 為 gitignore 產物，未進 commit。）

---

## 6. Fake data safety

- ❌ 未用真實 Drive ID / Google Form URL / response URL / token / respondent data / 真實 URL / Dean 私有資料。
- ✅ 全 placeholder：fixture 僅 `role: entry`（無任何 value field）；slug `test-download-funnel-invalid-entry`。
- ✅ no-value-echo：warning message 不含 targetGatedPage value（本 case 本就無 value）。

---

## 7. 未觸碰紅線（明確聲明）

- ❌ 未改 `validate-content.js` 驗證邏輯 / `report-validation.js` / `check-page-type-validator.js`。
- ❌ 未碰 production content / settings / package / lockfile / MEMORY.md。
- ❌ 未碰 dist / dist-blogger / dist-promotion / gh-pages / .cache / generated HTML。
- ❌ 未 build / deploy / dev server。
- ❌ 未碰 Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path。

---

## 8. Deferred（各須獨立 bump phase + Dean explicit approval）

- required-combo 其他分支 scanned invalid（gated-page-missing-entry-pages / wrong-role / invalid-type / too-many / duplicate）
- role-policy scanned invalid（sitemap-safety / listings-default / pageType-mismatch）
- robots-safety scanned invalid
- bidirectional-inconsistent scanned invalid（須 2 篇 corpus pair）
- private-value scanned invalid（須 placeholder Drive/Form/token-like value，no-value-echo 紀律）
- dangling / missing-post warning source implementation
- absolute URL matching / host-mismatch / bare opaque ID / `.html` normalization
- ctaEventName / GA4 normalization
- production content migration / live funnel / Google Form / Drive integration / GA4 backend write / Admin write path
- generated HTML / deployed robots verification / Blogger robots dimension
- build / deploy / repost

---

## 9. Cross-links

- `docs/20260625-download-funnel-validator-series-closeout.md`（F2–F8；§6 deferred 表）
- `docs/20260625-download-funnel-md-fixture-landing-record.md`（group 1 valid pair）
- `docs/20260625-download-funnel-md-fixture-group2-landing-record.md`（group 2 deferred-cases）
- `src/scripts/check-validation-report.js`（B5 / B6 / B7 assertions；BASELINE）
- `src/scripts/validate-content.js`（required-combo block 12 / §5.2）
- `CLAUDE.md` §3a（frozen baseline + validation baseline 表）

（本文件結束）
