# Funnel metadata validator — Slice 5 preflight（F6 robots-safety 盤點與下一階段鎖定）

- Phase id：`20260625-funnel-metadata-schema-validator-slice5-robots-safety-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only preflight**（盤點 + 鎖定 F6 規則；**不**做 source implementation）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / robots / indexing 之 validation 規劃；**不**改任何 indexing decision）
- 允許範圍（本 Session）：**只**新增本 docs preflight record；**不**改 `validate-content.js` / `check-page-type-validator.js` / content / settings / package / lockfile / CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML。
- 前序：
  - `docs/20260625-funnel-metadata-schema-validator-slice4-role-policy-landing-record.md`（F5：§5.4 role↔policy 三規則）
  - `docs/20260625-funnel-metadata-schema-validator-slice3-preflight.md`（F4 preflight；§3.4 將 robots-safety 標為 (c) → F6）
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1；§5.4 / §4.3 / §4.7）
  - `docs/20260625-funnel-metadata-schema-validator-slice2-required-combo-landing-record.md`（Slice 2）
  - `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（Slice 1）

---

## 1. Baseline 摘要

| 項目 | 值 |
| --- | --- |
| baseline | `1058709`（HEAD == origin/main；ahead/behind 0/0；working tree clean；`.git/index.lock` absent） |
| F2（slice 1） | §5.1 structural / enum / suspicious-field |
| F3（slice 2） | §5.2 required-combo |
| F5（slice 4） | §5.4 單篇 role↔policy（sitemap-safety / listings-default / pageType-mismatch） |

current validation baseline（本 phase 開始時量測；docs-only，未改 source）：

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js` | 82 passed / 0 failed |
| `npm run validate:content` | 0 / 133 / 105 |
| `npm run report:validation` | 0 / 133 / 105 |
| overlay（`validate-content.js --registry-overlay …commerce-c4-c9-overlay.json`） | 0 / 140 / 106 |

production `downloadFunnel` 觸發數 = 0。

---

## 2. 既有 robots / indexing 邏輯盤點（read-only）

### 2.1 `validate-content.js`（`validatePageTypeMetadata`）目前對 indexing 的處理

- 只從 `post.seo.indexing` 取 `seoIndexing`（string），並以 `PAGE_NOINDEX_INDEXING = {noindex-follow, noindex-nofollow}` 判 `isNoindex`。
- 既有 SP-2 正交規則：rule 5（`pageType:gated_download` + `seo.indexing:index` → `page-gated-download-indexed`）、rule 7（noindex × `includeInSitemap:true`）、rule 8（noindex × `includeInListings:true`）。
- **限制**：validator 內之 `isNoindex` **只看 `seo.indexing`**，**不**含 `contentKind:download` / `pageType` 推導之 noindex；故 validator 自身**不**等於「effective robots」。直接用 `isNoindex` 做 robots-safety 會**誤判**（false-positive：例如 gated_page + `contentKind:download` 但無 `seo.indexing` → 真實 robots 為 noindex,follow，但 validator `isNoindex=false`）。

### 2.2 可安全重用之 helper（關鍵發現）

`src/scripts/page-type-robots.js` 匯出 **純函式、零 side-effect**：

| export | 行為 | 對 F6 之用途 |
| --- | --- | --- |
| `derivePageTypeRobots(metadataPageType)` | `download` / `gated_download` → `'noindex, follow'`；`redirect_canonical` → `'noindex, follow'`；`utility_hidden` → `'noindex, nofollow'`；其餘 / 缺省 / 未知 → `null` | 單看 pageType 是否天生 noindex |
| **`resolvePostDetailRobots(post, defaultRobots='index, follow')`** | **完整 effective robots precedence**：① explicit `seo.indexing` → ② legacy `contentKind:'download'` → ③ `pageType` 推導 → ④ default → ⑤ SP-9b `platformPolicy.github.indexing` tighten-only。回傳 `'index, follow'` / `'noindex, follow'` / `'noindex, nofollow'` 之一 | **F6 應重用此函式作為「effective GitHub robots」之唯一真相來源** |

**重用安全性**：
- 純函式、無 side effect；`page-type-robots.js` 只 import `platform-policy-effective.js`（亦純函式）。
- **無 circular dependency**：`page-type-robots.js` / `platform-policy-effective.js` 皆**不** import `validate-content.js`（grep 確認，唯一 "validate-content" 出現為註解）。故 `validate-content.js` 於 F6 `import { resolvePostDetailRobots }` 安全。
- 不 import `build-github.js`（避免 build side effect）；mirror `check-page-type-robots.js` 既有測試慣例。

### 2.3 effective robots 推導所依賴的欄位

`resolvePostDetailRobots(post)` 讀取：`post.seo.indexing`、`post.contentKind`、`post.pageType`、`post.platformPolicy.github.indexing`（經 `resolvePlatformPolicyValue`）。F6 只需把整個 `post` 餵進去，**不**自行重寫 robots 邏輯（避免與 build 輸出脫鉤而誤判）。

### 2.4 sitemap / listings selector（F5 已涵蓋，F6 不重做）

- `include-in-sitemap.js`（`resolveIncludeInSitemap` / `isSitemapEligible`）：safety 永遠優先；F5 已加 `role-conflicts-sitemap-safety`。
- `include-in-listings.js`：F5 已加 `role-conflicts-listings-default`。
- → F6 **不**碰 sitemap / listings（§3 deferred）。

### 2.5 可作 pattern 的既有測試

- `src/scripts/check-page-type-robots.js`：純函式 robots precedence smoke（`derivePageTypeRobots` / `resolvePostDetailRobots`），可作為「如何構造 post 餵 robots 推導」之範本。
- `src/scripts/check-page-type-validator.js`：`pageIssues()` in-memory harness，F6 新 case 應加於此（沿用 cases 46–82 之 funnel 慣例）。

---

## 3. F6 robots-safety truth table（**只**針對 `downloadFunnel.role === 'gated_page'`）

設 `R = resolvePostDetailRobots(post)`（effective GitHub robots）。

### 3.1 SAFE（不應 warning）

| 狀態 | R | 理由 |
| --- | --- | --- |
| `seo.indexing: noindex-follow` / `noindex-nofollow` | `noindex, *` | explicit noindex（最高優先） |
| `pageType: gated_download` / `download`（且無 `seo.indexing:index`） | `noindex, follow` | pageType 天生 noindex |
| `contentKind: download`（且無 `seo.indexing:index`、無 pageType 放寬） | `noindex, follow` | legacy download safety |
| `pageType: utility_hidden` / `redirect_canonical` | `noindex, *` | 既有 special pageType noindex（少見於 gated_page，但仍 safe） |
| `platformPolicy.github.indexing` tighten 至 noindex | `noindex, *` | SP-9b tighten-only |

→ 凡 `R` 為任一 `noindex, *` → **safe，不 warning**（這正是用 `resolvePostDetailRobots` 而非 `isNoindex` 的原因：避免 false-positive）。

### 3.2 WARNING（`role:'gated_page'` 但 effective robots 可能被索引）

| 狀態 | R | 風險 |
| --- | --- | --- |
| `seo.indexing: index`（明示 index-follow） | `index, follow` | 最高風險：作者顯式把閘門頁設為可索引 |
| 無 noindex 之 `seo.indexing` + `pageType` 非 download/gated/special + `contentKind` 非 download（即組合不足以保證 noindex） | `index, follow`（default） | gated_page 落在預設可索引 → 應補 noindex |

→ 唯一觸發條件：`role:'gated_page'` **且** `R === 'index, follow'`。

### 3.3 DEFERRED（不在 F6 source slice 判斷）

- cross-file consistency（bidirectional）
- sitemap / listings（F5 已處理）
- §5.3 secret value heuristic
- live URL / Form / Drive availability
- actual deployed robots meta（線上實際 `<meta robots>`）
- generated HTML verification
- **Blogger robots**：Blogger noindex 屬作者後台手動（SP-9c），**無法**由系統推導；F6 之 effective robots **只**涵蓋 **GitHub Pages**；Blogger 維度 deferred（可於 message 提醒作者手動 NO INDEX，但不 hard-check）。

---

## 4. 建議 F6 source landing 最小 slice

### 4.1 建議：**只新增 1 個 warning code**

| 項目 | 建議 |
| --- | --- |
| warning code 數 | **1**（不拆 2 個）。§3.2 兩種狀態（explicit index / 組合不足）本質同一風險「gated 頁可索引」，且皆收斂為 `R === 'index, follow'`；單碼即可，拆 2 碼徒增噪音 |
| warning code 名稱 | `downloadFunnel-role-conflicts-robots-safety`（沿用 F1 §5.4 命名） |
| 觸發條件 | `downloadFunnel.role === 'gated_page'` **且** `resolvePostDetailRobots(post) === 'index, follow'` |
| 實作位置 | `validate-content.js` block 14（funnel object 分支內，緊接 block 13）；新增 `import { resolvePostDetailRobots } from './page-type-robots.js'` |
| message | 固定字串，例：`downloadFunnel.role="gated_page" but effective GitHub robots is indexable ("index, follow"); set seo.indexing: noindex-follow or use pageType gated_download/download to keep the gated page out of the index`（**不含任何 value**） |

### 4.2 如何避免 false-positive

- **重用 `resolvePostDetailRobots`**（而非 validator 內 `isNoindex`）：只在 effective robots **確定**為 `'index, follow'` 時 warning；任何 noindex 路徑（seo.indexing noindex / contentKind download / pageType download·gated_download·utility_hidden·redirect_canonical / platformPolicy tighten）→ 自動視為 safe。這保證 validator 的「可索引」判定與實際 build 輸出 **byte-identical 對齊**。
- 只評估 `role === 'gated_page'`（entry / 缺省 / 非法 role 不進此 rule）。
- 純比較，**不** echo `targetGatedPage` / `entryPages` / URL / slug / token。

### 4.3 已知 overlap（須在 F6 landing doc 標註）

- `role:'gated_page'` + `pageType:'gated_download'` + `seo.indexing:'index'`：F6 會 warning（effective robots = index, follow），同時既有 SP-2 rule 5 `page-gated-download-indexed` 亦會 warning。兩者屬獨立維度（一為 pageType×seo、一為 downloadFunnel.role×effective-robots），雙 warning 可接受（mirror 既有獨立 warning 慣例），F6 landing 須在 harness 標明此 overlap。

### 4.4 harness case 數量

建議約 **8–9**：
- gated_page + `seo.indexing:index` → warning
- gated_page + 無 seo / 無 pageType / contentKind post（default 可索引）→ warning
- gated_page + `pageType:gated_download` → no warning
- gated_page + `pageType:download` → no warning
- gated_page + `seo.indexing:noindex-follow` → no warning
- gated_page + `contentKind:download`（無 pageType）→ no warning（contentKind noindex；false-positive 防線）
- gated_page + `pageType:gated_download` + `seo.indexing:index` → warning（explicit index 勝；標 overlap）
- role=entry + `seo.indexing:index` → no F6 warning（rule 只對 gated_page）
- no-echo lock（message 不含 sample value）

### 4.5 production validate:content 應維持

- **應維持 `0 / 133 / 105`**：無 production / fixture post 含 `downloadFunnel` → F6 rule 0 觸發；overlay 維持 `0 / 140 / 106`、report 維持 `0 / 133 / 105`。
- F6 landing 時若 production / report 數字變動 → 停下回報、不 commit。

---

## 5. Safety rule（F6 未來 source landing MUST 遵守）

1. **warning-only**（`severity: 'warning'`；無 error / hard gate）。
2. **不得改 indexing decision**：F6 只**讀** `resolvePostDetailRobots` 之結果做告警，**不**改 `page-type-robots.js` / `include-in-sitemap.js` / `include-in-listings.js` / build 任何 effective 行為。
3. **不得鬆動** noindex / sitemap / listings safety 與 §4.7 安全優先順序；F6 方向為**告警 gated 頁可能被索引**（強化 noindex 意圖），不放寬。
4. **不得 echo** URL / slug / token / Drive ID / Form URL / respondent data；message 只含固定字串 + robots enum。
5. harness sample 只能 **placeholder / fake**（如 `gated-zhuyin-download` / `zhuyin-intro`）。
6. 不接 live funnel / Google Form / Drive / GA4 backend。

---

## 6. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- §5.3 secret value heuristic（`target-gated-page-private-secret` / `entry-pages-private-secret`）
- bidirectional cross-file consistency
- ctaEventName / GA4 normalization
- `.md` fixture 補齊
- production content migration（既有 post 加 `downloadFunnel`）
- live funnel
- Google Form / Drive integration
- GA4 backend write
- Admin write path
- build / deploy / repost
- Blogger robots 維度（後台手動 NO INDEX；無法系統推導）

---

## 7. 本 phase 非動作（non-actions）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 改 `src/scripts/validate-content.js` / `check-page-type-validator.js` | ✅ 未動 |
| 2 | 改 content `.md` / 新增 production fixture / settings / package / lockfile | ✅ 未動 |
| 3 | 改 CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML | ✅ 未動 |
| 4 | build / deploy / repost / dev server | ✅ 未執行 |
| 5 | Blogger live / Google Form / Drive / GA4 backend / AdSense / Search Console / Admin write path | ✅ 未動 |
| 6 | 加入 secrets / Drive IDs / Form response URLs / tokens / respondent data | ✅ 未動 |
| 7 | 推進 F6 robots-safety / §5.3 secret heuristic / bidirectional / ctaEventName / .md fixture 之 source | ✅ 僅盤點，未實作 |
| 8 | 僅新增本 1 個 docs preflight record | ✅ |

---

## 8. Cross-links

- `docs/20260625-funnel-metadata-schema-validator-slice4-role-policy-landing-record.md`（F5）
- `docs/20260625-funnel-metadata-schema-validator-slice3-preflight.md`（F4 preflight；§3.4 robots-safety→F6）
- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5.4 / §4.3 / §4.7）
- `src/scripts/page-type-robots.js`（`resolvePostDetailRobots` 重用來源）
- `src/scripts/check-page-type-robots.js`（robots smoke pattern）
- `docs/seo-indexing-rules.md`（SEO indexing 規則總則）
- `CLAUDE.md` §7 / §11 / §13 / §16 / §21

（本文件結束）
