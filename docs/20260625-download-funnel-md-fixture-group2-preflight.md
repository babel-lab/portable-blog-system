# downloadFunnel `.md` fixture — Group 2 expansion preflight (strategy only)

- Phase id：`20260625-download-funnel-md-fixture-group2-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only fixture strategy preflight**（規劃 group 2；**不新增 fixture**；不改 source）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）
- 允許範圍：**只**新增本 docs preflight record；不改 src / scripts / content `.md` / `content/validation-fixtures` / production fixture / settings / package / lockfile / CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML。
- 前序：
  - `docs/20260625-download-funnel-md-fixture-landing-record.md`（group 1 landing）
  - `docs/20260625-download-funnel-md-fixture-preflight.md`（fixture strategy preflight）
  - `docs/20260625-download-funnel-validator-series-closeout.md`（F2–F8 closeout）

---

## 1. Current baseline 摘要

| 項目 | 值 |
| --- | --- |
| baseline | `a34c8b0` |
| latest subject | `docs(state): sync funnel fixture baseline` |
| working tree / ahead-behind / index.lock | clean / 0-0 / absent |

current validation baseline（本 phase 量測）：

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js` | 103 passed / 0 failed |
| `node src/scripts/check-validation-report.js` | 25 passed / 0 failed |
| `npm run validate:content` | 0 / 133 / 105 |
| `npm run report:validation` | 0 / 133 / 105 |
| overlay | 0 / 140 / 106 |
| production `downloadFunnel` 觸發數 | **0** |

---

## 2. Group 1 已完成狀態

- ✅ valid entry fixture（`_test-download-funnel-valid-entry.md`）。
- ✅ valid gated_page fixture（`_test-download-funnel-valid-gated-page.md`）。
- ✅ valid reciprocating pair → **0 funnel warning**（validate:content 仍 0/133/105）。
- ✅ invalid private-value / no-value-echo → **isolated in-memory harness**（`check-validation-report.js` D1），**非** scanned global fixture。
- **為何 scanned invalid fixture 會 133→134**：`validate-content.js` runner（line ~3363）以 `loadPosts({site:'validation-fixtures/github'})` 把 `content/validation-fixtures/{github,blogger}/posts/` 全納入同一 corpus；任何**會觸發 warning** 之 scanned fixture 都 +1 warning（+1 issue-post）→ validate:content 由 133/105 → 134/106。
- **governance rule（已入 CLAUDE.md §3a）**：future scanned invalid fixture 須 **explicit baseline-bump phase**（CLAUDE.md §3a update + `check-validation-report` BASELINE update if applicable + Dean explicit approval）；否則採 **isolated in-memory harness**。

> **關鍵 nuance（本 preflight 補強）**：「scanned ≠ 必然 bump」。只有**會觸發 warning** 的 scanned fixture 才 bump。**0-warning** 的 scanned fixture（valid / deferred-silence 案例）**不 bump**（group 1 valid pair 即為例）。

---

## 3. Group 2 候選盤點

圖例：scanned＝放 `content/validation-fixtures/` 由 validate:content 掃；isolated＝in-memory harness（`check-validation-report.js`）。

| 候選 | 性質 | 適合層 | 改 validate:content 0/133/105？ | 改 check-validation-report baseline？ | 需 baseline-bump phase？ | value-echo / fake-data 風險 | 預期 warnings | 是否拆更小 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **required-combo invalid** | invalid（觸發 warning） | **isolated**（避免 bump）；scanned 須 bump phase | scanned: **YES（+N bump）**；isolated: **NO** | isolated: passed +N；scanned: BASELINE 須更新 | scanned: **YES**；isolated: NO | low（message 只 typeof/index/count，無 value echo） | 每案 1 | 已由 `check-page-type-validator` cases 57–71 覆蓋（單篇）→ isolated 重測 corpus 層價值低 |
| **role-policy invalid** | invalid | **isolated**；scanned 須 bump | scanned YES；isolated NO | 同上 | scanned YES | low（enum/boolean，無 value） | 每案 1 | 已由 cases 72–82 覆蓋 |
| **robots-safety invalid** | invalid | **isolated**；scanned 須 bump | scanned YES；isolated NO | 同上 | scanned YES | low（robots enum，無 value） | 1 | 已由 cases 83–89 覆蓋 |
| **bidirectional-inconsistent** | invalid（corpus cross-post） | **isolated**（in-memory corpus pair）；scanned 須 bump | scanned YES；isolated NO | isolated passed +N；scanned bump | scanned YES | low（只用 own-slug + sourcePath，無 raw value） | 每方向 1 | 已由 `check-validation-report` C1–C7 覆蓋（corpus） |
| **no-value-echo fixture extension** | invalid（private-value / bidirectional） | **isolated**（必須斷言不 echo） | isolated NO | passed +N | NO | **HIGH**（必用 fake；斷言 message 不含 sample value） | 視案 | 已由 case 100 / D1 / `bidir()` 不變式覆蓋 |
| **deferred-cases fixture** | **0-warning**（dangling / absolute-URL ref → deferred silence） | **scanned `.md`（0 bump）** 或 isolated | **NO（0 warning）** | scanned: 可加 B-section absent 斷言（passed +1）；isolated: passed +N | **NO** | low（placeholder slug / `example.github.io`；無 Drive/Form/token） | **0** | 可單片（dangling + absolute-URL 兩 `.md`） |

### 結論
- **所有 INVALID 候選**：scanned → bump（須 baseline-bump phase）；isolated → 不 bump，但**多與既有單篇 / corpus harness 覆蓋重疊**（required-combo / role-policy / robots-safety 屬單篇規則，已 100% 由 `check-page-type-validator` 覆蓋；bidirectional 已由 C1–C7 覆蓋）。
- **deferred-cases 候選**：0-warning → **scanned `.md` 不 bump** → 唯一能提供「真 `.md` 端對端 deferred-silence lock」之新覆蓋面，且不 bump。

---

## 4. 建議下一個最小 fixture landing（只選一個；本 session 不實作）

**建議 = deferred-cases scanned `.md` 最小片（2 個 0-warning fixture）**：

| # | 檔名（建議） | 內容 | 預期 |
| --- | --- | --- | --- |
| 1 | `_test-download-funnel-dangling-target.md` | role=entry + `targetGatedPage: "nonexistent-gated-slug"`（corpus 內無此 slug） | **0 warning**（dangling → deferred → silent） |
| 2 | `_test-download-funnel-absolute-url-target.md` | role=entry + `targetGatedPage: "https://example.github.io/posts/some-gated/"` | **0 warning**（absolute URL → deferred → silent；general public URL 非 Drive/Form/token） |

理由（為何優於 isolated-harness-for-invalid）：
- **不 bump**：兩者 0-warning → validate:content 維持 0/133/105（呼應 Dean「優先不 bump」偏好）。
- **真正新增覆蓋**：end-to-end 經 loadPosts 解析真 `.md` → 鎖住「dangling / absolute-URL 在真實 pipeline 維持 deferred-silence」，這是 in-memory harness **無法**完全替代的（in-memory 不走 `.md` 解析）。
- INVALID 候選改放 isolated harness 多與既有 `check-page-type-validator`（103/0）/ C1–C7 重疊 → 增量價值低。

> **Dean 偏好對照**：Dean「優先選不會 bump 的 isolated harness slice；scanned fixture 須規劃 baseline bump」。本建議之 deferred-cases 雖為 **scanned**，但屬 **0-warning** → **不 bump**（§2 nuance）→ 不需 baseline-bump phase。若 Dean 仍偏好嚴格 isolated，替代方案＝把上述兩案放 `check-validation-report.js` in-memory 斷言（亦不 bump，但喪失 `.md` 端對端覆蓋）。**最終由 Dean 擇定；本 preflight 僅建議。**

### 預期（下一個 landing phase）
- 建議新增/修改檔案：2 個 deferred-case `.md`（scanned）+ `check-validation-report.js`（B-section 斷言兩 fixture 端對端 0 issue，absent from report）+ landing record doc。
- `check-validation-report.js` passed 數：**增加**（+1～2）。
- `validate:content`：**維持 0/133/105**（0-warning fixture）。
- `report:validation`：**維持 0/133/105**。
- overlay：**維持 0/140/106**。
- baseline sync：因不 bump validate:content，僅需更新 CLAUDE.md §3a 之 `check:validation-report` 數（如 25→27）；**無** validate:content / report / overlay baseline bump。

---

## 5. Fake data / no-value-echo rules（group 2 一律遵守）

- ❌ 不用真實 Drive ID / Google Form URL / response URL / token / respondent data / Dean 私有資料。
- ✅ 可用 `example.com` / `drive.example.com` / `forms.example.com` / `example.github.io` / `FAKE-*` / `*-slug` 等明確假資料。
- ✅ warning message 測試**不得期待輸出原始 value**（no-echo 斷言只檢查 message **不含** fake sample）。
- ✅ deferred-cases fixture 之 targetGatedPage 用 placeholder slug / public-looking URL，**不**含任何 Drive/Form/token pattern。

---

## 6. Production migration gate（更新）

production content migration **前**之 gate（全 ✅ 且 Dean explicit approval 才可啟動）：

1. ✅ validator F2–F8 completed（closeout `717f4ad`）。
2. ✅ fixture group 1 completed（`2f8fd79`）。
3. ✅ group 2 strategy completed（本 preflight）。
4. scanned invalid fixture 若要進 repo → **須 baseline-bump phase**（§2 governance rule）。
5. no-value-echo tests passing（case 100 / D1 / bidir 不變式）。
6. no real URL / token / Drive ID（全 fixture 維持 placeholder）。
7. no build / deploy。
8. Dean 明確核可。
9. live Form / Drive / GA4 backend **still deferred**。

---

## 7. Deferred items（各須獨立 phase + Dean explicit approval）

- required-combo fixture landing
- role-policy fixture landing
- robots-safety fixture landing
- bidirectional-inconsistent fixture landing
- scanned invalid fixture baseline bump
- dangling / missing-post warning
- absolute URL matching
- host-mismatch
- bare opaque ID
- .html / last-segment normalization
- ctaEventName / GA4 normalization
- production content migration
- live funnel
- GA4 backend write
- Admin write path
- generated HTML / deployed robots verification
- Blogger robots dimension
- build / deploy / repost

---

## 8. 本 phase 非動作（non-actions）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 新增 / 改 `content/validation-fixtures/` fixture | ✅ 未動 |
| 2 | 改 src / scripts / content `.md` / settings / package / lockfile | ✅ 未動 |
| 3 | 改 CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML | ✅ 未動 |
| 4 | build / deploy / repost / dev server | ✅ 未執行 |
| 5 | Blogger live / Form / Drive / GA4 backend / AdSense / Search Console / Admin write path | ✅ 未動 |
| 6 | 加入真實 secrets / Drive IDs / Form response URLs / tokens / respondent data | ✅ 未動 |
| 7 | 推進任一 group 2 fixture landing / baseline bump | ✅ 僅規劃 |
| 8 | 僅新增本 1 個 docs preflight record | ✅ |

---

## 9. Cross-links

- `docs/20260625-download-funnel-md-fixture-landing-record.md`（group 1 landing）
- `docs/20260625-download-funnel-md-fixture-preflight.md`（fixture strategy preflight）
- `docs/20260625-download-funnel-validator-series-closeout.md`（F2–F8 closeout）
- `src/scripts/check-validation-report.js`（isolated harness；B/C/D sections）
- `src/scripts/validate-content.js`（runner line ~3363：fixtures 納入 corpus）
- `CLAUDE.md` §3a（frozen baseline + validation baseline 表 + governance rule）

（本文件結束）
