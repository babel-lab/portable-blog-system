# downloadFunnel `.md` fixture — Group 2 landing (deferred-cases, no baseline bump)

- Phase id：`20260625-download-funnel-md-fixture-group2-landing-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**minimal fixture landing**（2 scanned 0-warning deferred-case `.md` + 1 harness absent-assertion + docs）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、C（內容 fixture）、L（validation harness）
- 前序：`docs/20260625-download-funnel-md-fixture-group2-preflight.md`（group 2 strategy；§4 建議本 slice）

---

## 1. Baseline verify（進場）

`4ac6648`；latest subject `docs(download): preflight next funnel fixtures`；working tree clean；ahead/behind 0/0；index.lock absent。current baseline：`check-page-type-validator` 103/0；`check-validation-report` 25/0；`validate:content` 0/133/105；`report:validation` 0/133/105；overlay 0/140/106；production downloadFunnel trigger 0。

read-only 檢視：group2-preflight / group1 landing / fixture-preflight / closeout / slice10 / slice8 docs、`src/scripts/check-validation-report.js`、`src/scripts/validate-content.js`、`CLAUDE.md`。

---

## 2. Group 2 preflight 如何導向本 landing

group 2 preflight §4 建議下一個最小 slice ＝ **deferred-cases scanned `.md`**（dangling + absolute-URL，0-warning，**不** bump），理由：唯一能提供「真 `.md` 端對端 deferred-silence lock」且不 bump 之新覆蓋面（INVALID 候選已由 `check-page-type-validator` / C1–C7 in-memory 覆蓋）。本 landing 即依此落地。

明確性判定：**明確**（preflight §4 指定檔名 / targetGatedPage 形態 / 0-warning 預期 / 不 bump）；未猜路徑或 assertion。

---

## 3. 新增 2 個 scanned deferred-case fixtures（0-warning，no baseline bump）

| 檔案 | downloadFunnel | 為何 0 warning |
| --- | --- | --- |
| `content/validation-fixtures/github/posts/_test-download-funnel-dangling-target.md` | role=entry + `targetGatedPage: "fake-nonexistent-gated-download-slug"` | dangling（corpus 內無此 slug）→ missing-post **deferred** → 0；slug 非 Drive/Form/token → 非 private-value；role=entry + target present → 無 required-combo |
| `content/validation-fixtures/github/posts/_test-download-funnel-absolute-url-target.md` | role=entry + `targetGatedPage: "https://example.github.io/fake-gated-download"` | absolute URL（含 `://`）→ cross-file matching **deferred**（normalize→null）→ 0；`example.github.io` 非 Drive/Form/token → 非 private-value |

### 為何兩者預期 0 warning
- **dangling**：F8 bidirectional 只在 ref 解析到 corpus 內 post 時做 reciprocity；解析不到 → dangling → deferred → 不告警。
- **absolute URL**：`normalizeFunnelRef` 對含 `://` 之值回 null → cross-file skip（deferred）；且 `looksLikePrivateFunnelLink` 對 `example.github.io`（非 drive./forms./token query）回 false → 非 private-value。
- 兩者 role=entry + targetGatedPage present + 無 entryPages → 無 required-combo / role-policy / robots-safety（後二者僅 gated_page）。frontmatter 補齊 valid 必填欄位（category `tech-note` / tag `github` / cover / 短 title ≤60 / 短 description ≤160）→ 無 long-title / long-description / missing-* / taxonomy warning。

### 不 bump baseline（關鍵）
兩 fixture **0 warning** → 不進 issues → `validate:content` / `report:validation` / overlay totals **不變**（per group 2 preflight §2 nuance：scanned ≠ 必然 bump，只有觸發 warning 之 scanned fixture 才 bump）。本 landing **非** invalid scanned fixture baseline bump。

（craft 註：初版 title 長度 62/66 觸發 `long-title`〔TITLE_MAX 60〕，已縮短至 51/55 → 0 warning。description 87/102 < 160 無 `long-description`。)

---

## 4. Fake data safety

- ❌ 未用真實 Drive ID / Google Form URL / response URL / token / respondent data / Dean 私有資料 / 真實 URL。
- ✅ 全 placeholder：`fake-nonexistent-gated-download-slug`、`https://example.github.io/fake-gated-download`、`test-download-funnel-*` slug。
- ✅ 兩 fixture 之 targetGatedPage **不含** Drive-like / Form-like / token-like pattern → 不誤觸 F7 private-value。

---

## 5. 變更內容（changed files）

| 檔案 | 變更 |
| --- | --- |
| `content/validation-fixtures/github/posts/_test-download-funnel-dangling-target.md` | 新增 dangling deferred-case fixture（0 warning） |
| `content/validation-fixtures/github/posts/_test-download-funnel-absolute-url-target.md` | 新增 absolute-URL deferred-case fixture（0 warning） |
| `src/scripts/check-validation-report.js` | +B6（兩 deferred-case `.md` 端對端 0 issue，absent from report） |
| `docs/20260625-download-funnel-md-fixture-group2-landing-record.md` | 本檔 |

**未動**：`validate-content.js` / `report-validation.js` / `check-page-type-validator.js`、production content `.md`、settings、package/lockfile、CLAUDE.md/MEMORY.md、dist/gh-pages/.cache/generated HTML。

---

## 6. harness / fixture test 變化 + validation results

| 指令 | 進場 | landing 後 |
| --- | --- | --- |
| `node src/scripts/check-page-type-validator.js` | 103/0 | **103/0**（未動單篇 harness） |
| `node src/scripts/check-validation-report.js` | 25/0 | **26/0**（+1：B6） |
| `npm run validate:content` | 0/133/105 | **0/133/105**（deferred fixtures 0 warning） |
| `npm run report:validation` | 0/133/105 | **0/133/105** |
| overlay | 0/140/106 | **0/140/106** |
| production `downloadFunnel` 觸發數 | 0 | **0** |

→ **無 baseline bump**；harness passed +1，failed 0。

---

## 7. Deferred items（各須獨立 phase + Dean explicit approval）

- required-combo invalid fixture
- role-policy invalid fixture
- robots-safety invalid fixture
- bidirectional-inconsistent invalid fixture
- scanned invalid fixture baseline bump
- dangling / missing-post warning source implementation
- absolute URL matching source implementation
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

---

## 8. 未觸碰紅線（明確聲明）

- ❌ 未改 `validate-content.js` / `report-validation.js` / `check-page-type-validator.js` / production content `.md` / settings / package / lockfile / CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML。
- ❌ 未新增會觸發 warning 之 scanned invalid fixture；未做 baseline bump。
- ❌ 未推進 required-combo / role-policy / robots-safety / bidirectional-inconsistent invalid fixture、dangling / absolute-URL source implementation、host-mismatch、ctaEventName、production content migration 等。
- ❌ 未 build / deploy / repost / dev server；未碰 Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path。
- ❌ 未加入真實 secrets / Drive IDs / Form response URLs / tokens / respondent data / 真實 Google Form / Drive URL（全 placeholder）。

---

## 9. Cross-links

- `docs/20260625-download-funnel-md-fixture-group2-preflight.md`（group 2 strategy；建議來源）
- `docs/20260625-download-funnel-md-fixture-landing-record.md`（group 1 landing）
- `docs/20260625-funnel-metadata-schema-validator-slice10-bidirectional-landing-record.md`（dangling / absolute-URL deferred 之 source 行為）
- `src/scripts/check-validation-report.js`（B5 / B6 absent assertions）
- `CLAUDE.md` §3a

（本文件結束）
