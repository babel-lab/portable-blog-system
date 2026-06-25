# downloadFunnel `.md` fixture landing — minimal first slice

- Phase id：`20260625-download-funnel-md-fixture-landing-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**minimal fixture landing**（2 valid `.md` fixtures + isolated harness assertions + docs）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、C（內容 fixture）、L（validation harness）
- 前序：`docs/20260625-download-funnel-md-fixture-preflight.md`（fixture strategy preflight；建議來源）

---

## 1. cf325bb audit 結果（stage 1，read-only）

| 確認項 | 結果 |
| --- | --- |
| HEAD == `cf325bb` | ✅ |
| latest subject = `docs(download): preflight funnel md fixtures` | ✅ |
| docs-only fixture preflight commit | ✅（`A docs/20260625-download-funnel-md-fixture-preflight.md`，1 file +175） |
| working tree clean / ahead-behind 0/0 / index.lock absent | ✅ |

→ audit PASS，進入 stage 2。

---

## 2. Baseline verify（stage 2 進場）

`cf325bb`；working tree clean；ahead/behind 0/0；index.lock absent。current validation baseline：`check-page-type-validator` 103/0；`check-validation-report` 22/0；`validate:content` 0/133/105；`report:validation` 0/133/105；overlay 0/140/106；production downloadFunnel trigger 0。

---

## 3. Fixture preflight 如何導向本 landing + 一個 reconciliation

preflight §6 建議最小第一片＝valid entry + valid gated_page + one invalid private-value。

**Reconciliation（必說明）**：preflight §6 曾預期 invalid fixture 會把 `validate:content` 由 133 → 134（有意識 bump）。但 stage 2 **硬約束** = `validate:content` / `report:validation` / overlay **必須維持 0/133/105 · 0/133/105 · 0/140/106**。經 read-only 確認 `validate-content.js` 之 runner（line ~3363）以 `loadPosts({site:'validation-fixtures/github'})` 把 **`content/validation-fixtures/{github,blogger}/posts/` 全納入同一 corpus** → 任何 scanned invalid fixture 都會 +1 warning，與硬約束衝突。

故依 preflight §6「**除非 fixture harness 有獨立 baseline 且明確隔離**」之逃生條款：
- **valid** 兩端 → 真正 `.md` fixture（0 warning，scanned，133 不變）。
- **invalid private-value + no-value-echo** → 改以 **isolated in-memory harness assertion**（`check-validation-report.js`，獨立 passed-count baseline；**不**經 global validate:content）。

---

## 4. 新增 fixture files（2 個 valid `.md`）

| 檔案 | 角色 | 關鍵 frontmatter | 預期 |
| --- | --- | --- | --- |
| `content/validation-fixtures/github/posts/_test-download-funnel-valid-entry.md` | valid entry | `downloadFunnel.role: entry` + `targetGatedPage: "test-download-funnel-valid-gated-page"`（simple slug） | 0 funnel warning |
| `content/validation-fixtures/github/posts/_test-download-funnel-valid-gated-page.md` | valid gated_page | `role: gated_page` + `entryPages: ["test-download-funnel-valid-entry"]` + `pageType: gated_download` + `seo.indexing: noindex-follow` + `includeInListings/Sitemap: false` | 0 funnel warning |

兩端 **reciprocate**（entry→gated 且 gated 列回 entry）→ bidirectional 一致 → 0 warning；gated noindex + includeIn* false → robots-safety / role↔policy 0 觸發。命名/位置依既有慣例（`content/validation-fixtures/github/posts/_test-*.md`，full valid frontmatter + category `tech-note` / tag `github`）。

（craft 註：初版 description 長度 164/206 觸發 `long-description`〔DESCRIPTION_MAX 160〕，已縮短至 < 160 → 0 warning。)

---

## 5. Fake data safety

- ❌ 未用真實 Drive ID / Google Form URL / response URL / token / respondent data / Dean 私有資料。
- ✅ 全 placeholder：`test-download-funnel-*` slug、`drive.example.com`（harness D1）、`FAKE`。
- ❌ valid fixtures 不含任何 URL（targetGatedPage / entryPages 全為 internal slug）。
- ✅ warning message 測試（D1）斷言 **不** echo `drive.example.com` / `FAKE`。

---

## 6. No-value-echo coverage

- **D1**（isolated in-memory）：invalid private-value（targetGatedPage = `https://drive.example.com/drive/folders/FAKE`）→ 只產生 `downloadFunnel-target-gated-page-private-value`，且斷言 `issue.value` **不含** `drive.example.com` 與 `FAKE`。
- 既有 single-post harness（case 100，103/0，未改動）亦覆蓋 private-value no-echo；本 landing 之 no-echo 驗證放於 fixture/report harness。

---

## 7. Production baseline 是否不變 → ✅ 不變

| 指令 | 進場 | landing 後 |
| --- | --- | --- |
| `node src/scripts/check-page-type-validator.js` | 103/0 | **103/0**（未動單篇 harness） |
| `node src/scripts/check-validation-report.js` | 22/0 | **25/0**（+3：B5 + D1 + D2） |
| `npm run validate:content` | 0/133/105 | **0/133/105**（valid fixtures 0 warning） |
| `npm run report:validation` | 0/133/105 | **0/133/105** |
| overlay | 0/140/106 | **0/140/106** |
| production `downloadFunnel` 觸發數 | 0 | **0** |

valid fixtures 屬 `kind: fixture`（path 在 `content/validation-fixtures/`）且 0 warning → production-post warnings 仍 0、totals 不變；invalid case 隔離於 in-memory harness → 不影響 validate:content。

---

## 8. 變更內容（changed files）

| 檔案 | 變更 |
| --- | --- |
| `content/validation-fixtures/github/posts/_test-download-funnel-valid-entry.md` | 新增 valid entry fixture |
| `content/validation-fixtures/github/posts/_test-download-funnel-valid-gated-page.md` | 新增 valid gated_page fixture |
| `src/scripts/check-validation-report.js` | +B5（valid `.md` fixtures 端對端 0 issue）+D1（isolated invalid private-value no-echo）+D2（isolated valid pair 0 funnel warning） |
| `docs/20260625-download-funnel-md-fixture-landing-record.md` | 本檔 |

**未動**：`check-page-type-validator.js`（單篇 harness）、production content `.md`、settings、package/lockfile、CLAUDE.md/MEMORY.md、dist/gh-pages/.cache/generated HTML。

---

## 9. validation results

`check-page-type-validator` **103/0** · `check-validation-report` **25/0** · `validate:content` **0/133/105** · `report:validation` **0/133/105** · overlay **0/140/106** · production downloadFunnel trigger **0**。全部符合硬約束。

---

## 10. Deferred items（各須獨立 phase + Dean explicit approval）

- dangling / missing-post warning
- absolute URL matching
- host-mismatch
- bare opaque ID
- .html / last-segment normalization
- ctaEventName / GA4 normalization
- production content migration
- live funnel
- Google Form / Drive integration
- GA4 backend write
- Admin write path
- generated HTML / deployed robots verification
- Blogger robots dimension
- build / deploy / repost
- 後續 fixture 群組（required-combo / role-policy / robots-safety / bidirectional-inconsistent / deferred-cases）：逐片擴充；scanned invalid fixture 須有意識 baseline bump（CLAUDE.md §3a + `check-validation-report` BASELINE），或同採 isolated harness。

---

## 11. Cross-links

- `docs/20260625-download-funnel-md-fixture-preflight.md`（fixture strategy preflight）
- `docs/20260625-download-funnel-validator-series-closeout.md`（F2–F8 closeout）
- `content/validation-fixtures/github/posts/_test-page-type-gated-download-valid.md`（既有 fixture 慣例範本）
- `src/scripts/validate-content.js`（runner line ~3363：fixtures 納入 corpus）
- `CLAUDE.md` §3a / §7 / §13

（本文件結束）
