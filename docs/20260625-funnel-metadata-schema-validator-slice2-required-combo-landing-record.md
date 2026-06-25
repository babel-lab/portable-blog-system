# Funnel metadata schema validator — Slice 2（F1 §5.2 required-combo）source landing record

- Phase id：`20260625-funnel-metadata-schema-validator-slice2-required-combo-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**minimal source landing**（validator + harness only；warning-only；additive；純 validation 層）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / 索引 metadata 之 validation；**不**改 robots / sitemap / listings 行為）、L（build script / validator）
- 前序：
  - `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 schema preflight；本 slice 落地 §5.2）
  - `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（Slice 1：§5.1 結構 / enum / 未知 key）

---

## 1. Baseline（read-only verify；本 phase 開始時）

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD == origin/main | `755d195d02bd6a6d954e92d5556aba65e1ed0ab8` |
| short | `755d195` |
| latest subject | `docs(state): sync download validator slice baseline` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

baseline 符合預期 frozen state。

read-only 檢視：`docs/20260625-funnel-metadata-schema-preflight-a.md`、`docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`、`docs/20260624-gated-download-funnel-spec-lock.md`、`src/scripts/validate-content.js`、`src/scripts/check-page-type-validator.js`、`CLAUDE.md`。

---

## 2. F1 §5.2 是否明確 → ✅ 明確可落地

F1 §5.2「必填組合類」列出 8 條 code，每條觸發條件明確，並由 §3.2.2 / §3.2.3 / §3.3 必填組合摘要佐證。無需猜測。本 slice 全數落地：

| # | code | 觸發條件（per §5.2 / §3.3） | 對應實作 (block 12) |
| --- | --- | --- | --- |
| 1 | `downloadFunnel-entry-missing-target-gated-page` | `role: entry` 但 `targetGatedPage` 缺省 | (e) |
| 2 | `downloadFunnel-gated-page-missing-entry-pages` | `role: gated_page` 但 `entryPages` 缺省或 length=0 | (f) |
| 3 | `downloadFunnel-target-gated-page-wrong-role` | `role: gated_page` 但 `targetGatedPage` 出現 | (g) |
| 4 | `downloadFunnel-entry-pages-wrong-role` | `role: entry` 但 `entryPages` 出現 | (h) |
| 5 | `downloadFunnel-target-gated-page-invalid-type` | `targetGatedPage` 非 string | (i) |
| 6 | `downloadFunnel-entry-pages-invalid-type` | `entryPages` 非 array / 含非 string 元素 | (j) |
| 7 | `downloadFunnel-entry-pages-too-many` | `entryPages` length > 10 | (j) |
| 8 | `downloadFunnel-entry-pages-duplicate` | `entryPages` 含重複 | (j) |

### Cascade / 噪音控制

- role-combo（(e)–(h)）只在 `role` 為合法 enum（`entry` / `gated_page`）時評估；role 缺省 / 非法時已由 slice-1 (b)/(c) 報，combo 不重複觸發。
- field-shape（(i)/(j)）依欄位 present 與否獨立評估（與 role 合法性無關；mirror F2 之獨立 warning 慣例）。
- missing 與 invalid-type 互斥：欄位 present 但型別錯 → 只報 invalid-type，不報 missing。

### 🔴 value 不外洩（red line 落實）

block 12 之所有 warning message **只輸出「欄位名 / typeof / index / count」，絕不 echo value**：
- wrong-role / missing：無 value。
- invalid-type：只報 `typeof=` 或 `[index] typeof=`。
- too-many：只報 length 數字。
- duplicate：只報重複「數量」，不報重複「內容」。

任何可能像 URL / token / respondent data 的字串都不會進 message（value-based secret heuristic 屬 §5.3，deferred）。harness test 67 / 68 以 `example.com` placeholder 鎖定「message 不含 value」。

---

## 3. 變更內容（changed files）

### 3.1 `src/scripts/validate-content.js`

- 新增常數 `DOWNLOAD_FUNNEL_MAX_ENTRY_PAGES = 10`（§3.2.3 建議上限；warning-only，非 hard cap）。
- `validatePageTypeMetadata()` funnel object 分支內，slice-1 (a)–(d) 之後新增 **block 12**（(e)–(j) 共 8 規則，全 `severity: 'warning'`）。
- slice-1 comment 之 deferred 註記微調：標示 §5.2 已於 block 12（slice 2）落地。

### 3.2 `src/scripts/check-page-type-validator.js`

- 更新既有 case 54 / 55（slice-2 combo 語意使其原斷言需隔離）：
  - 54：gated_page suspicious-field 樣本補 `entryPages` 以隔離 (f) missing-entry-pages。
  - 55：role=entry 合法欄位組合移除 `entryPages`（entryPages 屬 gated_page，per §3.3）。
- 新增 case 57–71（15 條）：8 規則各自觸發 + 互斥 / 邊界（empty / 10 boundary / 11 too-many / non-array / non-string element）+ 獨立性（too-many + duplicate）+ value 不外洩（67 / 68）+ invalid-role × field-shape 獨立（69）。

### 3.3 `docs/20260625-funnel-metadata-schema-validator-slice2-required-combo-landing-record.md`（本檔）

---

## 4. 測試 / 驗證結果

| 指令 | F2 baseline | F3 後 |
| --- | --- | --- |
| `node src/scripts/check-page-type-validator.js` | 56 / 0 | **71 passed / 0 failed** |
| `npm run validate:content` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| overlay（`validate-content.js --registry-overlay …`） | 0 / 140 / 106 | **0 / 140 / 106**（不變） |
| `validate:content` 中 `downloadFunnel` 觸發數 | 0 | **0** |

→ warning-only / no production trigger / no live service：production warning 數 **0 變動**（無 production / fixture post 含 `downloadFunnel`），完全 additive。harness pass 數增（56→71），failed 維持 0。

---

## 5. Deferred（後續各須獨立 phase + Dean explicit approval）

- F1 §5.3 value-based secret heuristic（Drive folder / Form response / token query string 偵測）
- F1 §5.4 cross-field 一致性（bidirectional / robots / sitemap / listings 矛盾偵測）
- `.md` fixture 補齊（本 slice 比照 SP-8 / slice-1 採 harness-only）
- live funnel / Google Form / Google Drive / GA4 backend 串接
- F2 template preflight / F8 Admin read-only funnel fields

---

## 6. 未觸碰紅線（明確聲明）

- ❌ 未改 content `.md` / 未新增 production fixture / 未改 settings。
- ❌ 未改 `package.json` / lockfile / CLAUDE.md / MEMORY.md / `dist*` / gh-pages / `.cache` / generated HTML。
- ❌ 未碰 Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path。
- ❌ 未 build / deploy / repost / dev server。
- ❌ 未輸出任何 response URL / token / Drive ID / respondent data 到 warning message；harness sample 全 placeholder / fake（`example.com` / `zhuyin-intro` / `entry-N`）。
- ❌ 未鬆動 listings / robots / noindex / download / special pageType safety；`downloadFunnel` 為純 metadata，不參與 indexing decision。

---

## 7. Cross-links

- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5.2 來源）
- `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（Slice 1）
- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）
- `CLAUDE.md` §7 / §11 / §13 / §16

（本文件結束）
