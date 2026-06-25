# Funnel metadata validator — Slice 9 preflight（F8 bidirectional cross-file consistency 盤點與鎖定）

- Phase id：`20260625-funnel-metadata-schema-validator-slice9-bidirectional-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only preflight**（盤點 + 鎖定 F8 規則；**不**做 source implementation；**不**新增 harness / fixture）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）；不改任何 indexing / validation 行為
- 允許範圍（本 Session）：**只**新增本 docs preflight record；**不**改 `validate-content.js` / `check-validation-report.js` / `check-page-type-validator.js` / content / settings / package / lockfile / CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML。
- 前序：
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1；§5.4 `downloadFunnel-bidirectional-inconsistent` candidate）
  - `docs/20260625-funnel-metadata-schema-validator-slice{1,2,4,6,8}-*.md`（已 land slices）
  - `docs/20260624-gated-download-funnel-spec-lock.md`（§3.1 / §3.2：targetGatedPage 正向、entryPages 反向關聯）

---

## 1. Current baseline 摘要

| 項目 | 值 |
| --- | --- |
| baseline | `e25d733`（HEAD == origin/main；ahead/behind 0/0；working tree clean；`.git/index.lock` absent） |
| 已完成 slices | F2 structural / enum / suspicious-field（slice 1）；F3 required-combo（slice 2）；F5 role↔policy single-page（slice 4）；F6 robots-safety（slice 6）；F7 private-value heuristic（slice 8） |

current validation baseline（本 phase 開始時量測；docs-only）：

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js` | 103 passed / 0 failed |
| `npm run validate:content` | 0 / 133 / 105 |
| `npm run report:validation` | 0 / 133 / 105 |
| overlay | 0 / 140 / 106 |

production `downloadFunnel` 觸發數 = 0。

---

## 2. 既有 validator 架構盤點（read-only）

### 2.1 `validate-content.js`：單篇 vs 全 corpus

- `validatePageTypeMetadata(post, sourcePath, issues)`：**單篇**（只看一篇 post，無 corpus context）；F2–F7 funnel 規則皆在此 → **不適合**做 bidirectional。
- `validateContent({ posts, settings })`：**接收完整 `posts` array**，**已有全 corpus context**。其結構為「per-post 主迴圈（line ~2150）」+ **corpus-level 後段 cross-post passes（line ~3024 起）**。
- → validate-content.js **並非純單篇 validator**；它在 `validateContent` 末段已有 corpus 掃描層。

### 2.2 既有 cross-file 檢查 pattern（**關鍵 precedent**）

`validateContent` 末段已存在兩條 cross-post 規則（**正是 bidirectional 可 mirror 的範本**）：

| 規則 | severity | pattern | value（safe identifier） |
| --- | --- | --- | --- |
| `duplicate-slug`（line ~3024） | error | 建 `slugMap`（slug→sourcePath[]）；group ≥2 → 每篇各 push 一條，`sourcePath` 指該檔 | slug（safe） |
| `series-number-duplicate`（line ~3050） | warning | 建 `seriesNumberMap`（id::number→entries[]）；group ≥2 → 每篇各 push | `series.id` / `series.number`（safe） |

- pattern：**先建 Map（全 corpus）→ 再 group → 每個衝突檔各 push 一條 warning，`sourcePath` 指向該檔**；`value` 只用 **safe identifier**（slug / series id），**不** echo 任何敏感 value。

### 2.3 `report-validation.js` / `report:validation` / `check-validation-report.js`

- `report-validation.js`：**聚合 / 報表層**。定義 `CROSS_POST_TYPES = { duplicate-slug, series-number-duplicate }`，把這些 cross-post issue **額外**整理進 `buckets.crossPost` 聚合視圖。
- **重點**：report-validation **只聚合 / 分桶既有 issue，不自行計算 cross-file 邏輯**；cross-file **偵測**發生在 `validateContent`，report 只負責呈現。
- `check-validation-report.js`：report 結構之 regression guard。

### 2.4 最安全的落地層結論

| 候選層 | 評估 |
| --- | --- |
| validate-content.js **單篇內**（`validatePageTypeMetadata`） | ❌ 無 corpus context，做不到 cross-file |
| **validateContent 末段 corpus cross-post pass**（mirror duplicate-slug / series-number-duplicate） | ✅ **最安全**：corpus context 現成、pattern 既有、report-validation 可經 `CROSS_POST_TYPES` 自動分桶 |
| report:validation 聚合層 | ❌ 只聚合不計算；偵測邏輯不應放這 |
| 新增專用 checker script | ⚠️ 可行但**重複** validateContent 既有 corpus 載入；非必要 |
| harness only | ⚠️ 不足以讓 `validate:content` / `report:validation` 呈現；只適合 prototype |

→ **建議落地層 = `validateContent` 末段 corpus cross-post pass**（§4）。

---

## 3. Bidirectional truth table 草案（只 downloadFunnel；entry.targetGatedPage / gated_page.entryPages[]）

定義：對所有 ready/published posts（沿用 loadPosts 既有過濾），建立 `slug → post` 映射；只處理 **role 合法、ref 為可解析 slug** 之 post。

| # | 狀態 | 期望 | 不一致時 |
| --- | --- | --- | --- |
| 1 | entry E 之 `targetGatedPage` 解析到 gated_page G（G 存在於 corpus） | G 之 `entryPages` **應包含** E 之 slug | warning：「E 指向 G，但 G 未把 E 列入 entryPages」 |
| 2 | gated_page G 之 `entryPages` 含 E（E 存在於 corpus） | E 之 `targetGatedPage` **應指回** G | warning：「G 列入 E，但 E 未把 targetGatedPage 指向 G」 |

### 3.1 邊界 / 不重複告警（cascade）

| 情境 | 處理 |
| --- | --- |
| role missing / invalid（F2 已告警） | **跳過** bidirectional（不雙重告警） |
| targetGatedPage / entryPages 為非 string（F3 invalid-type 已告警） | **跳過**該 ref |
| ref value 命中 private-value（F7 已告警） | **跳過**（不對可疑值做 cross-file resolve；且其本非 slug） |
| ref 為 **absolute URL** | **DEFERRED**（解析絕對 URL → post 需 host + path→slug 邏輯＝host-mismatch 範疇；不在 F8 第一片） |
| ref slug **解析不到任何 post**（dangling reference） | **DEFERRED**（屬「missing-post」面向；§5 列為獨立後續 code，不在 reciprocity 第一片） |
| noindex / sitemap / listings / robots（F5/F6 已覆蓋） | **不重複告警**（bidirectional 與其正交，不同維度） |
| **multiple entries 指向同一 gated_page** | **合法**（多前導頁可導向同一 gated page）；不告警 |
| **one entry 指向多個 gated_page** | **schema 不可能**（`targetGatedPage` 為單值、非 array，per F1 §3.2.2）→ 若作者要多個須拆多 entry；視為 N/A / deferred |

---

## 4. Source landing 架構建議

從選項 A–E：

- **A（不應放 validate-content.js，因單篇）**：**前提不成立** —— validate-content.js 之 `validateContent` 已有 corpus cross-post 層。但「不應放在**單篇** `validatePageTypeMetadata`」這點正確。
- **B（新增專用 checker）**：可行但**重複** corpus 載入；非必要。
- **C（report:validation 聚合層）**：❌ 只聚合不計算。
- **D（harness-only prototype）**：不足以讓 `validate:content` / `report:validation` 呈現。
- **E（deferred）**：保守可選。

→ **建議：落地於 `validateContent` 末段 corpus cross-post pass**（mirror `duplicate-slug` / `series-number-duplicate`），並讓 `report-validation.js` 之 `CROSS_POST_TYPES` 納入新 type 以自動分桶。**這不是「放進單篇 validator」，而是放進 validateContent 既有的 corpus 掃描層**。屬 A 與 C 之外的既有第 6 條路徑（corpus pass）。若 Dean 偏保守，E（deferred）亦可接受。

---

## 5. 建議 warning code

bidirectional 本質為**兩個方向**之 reciprocity；單一合併 code 無法指出作者該修哪一側。建議 **2 個方向性 code** 作為**第一個最小 source slice**：

| code | 觸發 | 不觸發 |
| --- | --- | --- |
| `downloadFunnel-entry-page-not-listed-by-gated-page` | entry E 之 targetGatedPage 解析到存在的 gated_page G，但 G 之 entryPages 未含 E | G 含 E；G 不存在（dangling→deferred）；ref 非 slug / private / 非 string |
| `downloadFunnel-gated-page-not-targeted-by-entry` | gated_page G 之 entryPages 含存在的 entry E，但 E 之 targetGatedPage 未指回 G | E 指回 G；E 不存在（deferred）；ref 非 slug / private / 非 string |

理由（採 2 code 而非 1 合併）：
- bidirectional = 兩方向，各自獨立可修；2 code 精準指出「哪一側缺對應」。
- mirror 專案既有 per-direction / per-field 慣例（slice 2/4/7 皆 per-field code）。
- 單一 `downloadFunnel-bidirectional-inconsistent` 雖更簡，但喪失方向指引 → 不建議。

**後續（不在第一片，deferred）候選 code**：
- `downloadFunnel-funnel-reference-missing-post`（dangling reference：targetGatedPage / entryPages slug 解析不到任何 post）。屬另一面向（dangling vs reciprocity），且需先定義「解析不到」是否含 absolute URL / draft posts → **deferred** 至獨立子片。

---

## 6. Normalization / matching rules 草案（**設計，不實作**）

cross-file 比對只在「ref 為可解析 slug」時進行；以下為 ref → post.slug 之 normalize 設計：

| 規則 | 建議 | 備註 |
| --- | --- | --- |
| slug normalize | 取 ref 之最後一段非空 path segment 作 candidate；與 `post.slug` 比對 | 只處理 slug / relative path |
| leading slash | **strip**（`/posts/x` → 取 `x`） | |
| trailing slash | **strip**（`x/` → `x`） | |
| `.html` suffix | **strip 後比對**（`x.html` → `x`；Blogger 頁常帶 .html） | 設計選項；可於第一片納入或 defer |
| absolute URL | **same-site only 或 DEFERRED** → 第一片 **DEFERRED**（不解析 absolute URL；避免 host-mismatch 邏輯） | |
| querystring / hash | 比對前 **strip `?...` / `#...`**（`x?utm=1` → `x`） | secret query 由 F7 處理；此處只為取乾淨 slug |
| case sensitivity | **case-sensitive 精確比對** | 避免把 `Gated-X` 與 `gated-x` 兩個不同 slug 視為同一；slug 慣例為 lowercase |
| duplicates（entryPages 內重複） | F3 `entry-pages-duplicate` 已覆蓋；reciprocity 以 Set 去重後比對，不重複告警 | |
| non-string value | F3 invalid-type 已覆蓋 → **跳過**，不參與比對 | |

→ 第一片建議：**只比對 simple slug / relative path（strip 前後斜線 + querystring/hash，選配 .html）**；absolute URL / dangling / host-mismatch 一律 **DEFERRED**。

---

## 7. Safety rules（F8 未來 source landing MUST 遵守）

1. **warning-only**（severity `'warning'`；無 error / hard gate）。
2. **不得 echo** URL / slug-as-suspicious-value / token / Drive ID / Form URL / respondent data。
3. warning 若需指涉頁面，**只能用 safe post identifier 或 file path（`sourcePath`）**；**不**輸出可疑 raw ref value（mirror duplicate-slug / series 慣例：value 只放 safe identifier）。
4. **不得讀取** live Blogger / Form / Drive / GA4 backend。
5. **不得改 indexing decision**；**不得鬆動** noindex / sitemap / listings / robots safety（§4.7）。
6. **不得新增 production content / 真實 funnel content**；harness（未來實作時）只用 placeholder / fake slug。

---

## 8. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- ctaEventName / GA4 normalization
- `.md` fixture
- production content migration
- live funnel
- Google Form / Drive integration
- GA4 backend write
- Admin write path
- generated HTML / deployed robots verification
- Blogger robots dimension
- host-mismatch / absolute-URL cross-file resolution
- dangling-reference（missing-post）code（§5 後續候選）
- build / deploy / repost

---

## 9. 本 phase 非動作（non-actions）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 改 `validate-content.js` / `check-validation-report.js` / `check-page-type-validator.js` | ✅ 未動 |
| 2 | 新增 harness case / production fixture / content `.md` / settings / package / lockfile | ✅ 未動 |
| 3 | 改 CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML | ✅ 未動 |
| 4 | build / deploy / repost / dev server | ✅ 未執行 |
| 5 | Blogger live / Form / Drive / GA4 backend / AdSense / Search Console / Admin write path | ✅ 未動 |
| 6 | 輸出 / 記錄真實 secrets / Drive IDs / Form response URLs / tokens / respondent / 真實 URL | ✅ 未動（本檔範例全 placeholder slug，無真實值） |
| 7 | 改 indexing decision | ✅ 未動 |
| 8 | 推進 bidirectional / ctaEventName 之 source | ✅ 僅盤點 |
| 9 | 僅新增本 1 個 docs preflight record | ✅ |

---

## 10. Cross-links

- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5.4 bidirectional candidate）
- `docs/20260624-gated-download-funnel-spec-lock.md`（§3.1 / §3.2 正向 / 反向關聯）
- `src/scripts/validate-content.js`（`validateContent` 末段 cross-post pass：duplicate-slug / series-number-duplicate）
- `src/scripts/report-validation.js`（`CROSS_POST_TYPES` 聚合）
- `docs/20260625-funnel-metadata-schema-validator-slice8-secret-heuristic-landing-record.md`（前一 source slice）
- `CLAUDE.md` §7 / §13 / §16 / §29

（本文件結束）
