# Funnel metadata validator — Slice 7 preflight（F7 §5.3 value-based secret heuristic 盤點與鎖定）

- Phase id：`20260625-funnel-metadata-schema-validator-slice7-secret-heuristic-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only preflight**（盤點 + 鎖定 F7 規則；**不**做 source implementation）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）；不改任何 indexing / validation 行為
- 允許範圍（本 Session）：**只**新增本 docs preflight record；**不**改 `validate-content.js` / `check-page-type-validator.js` / content / settings / package / lockfile / CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML。
- 前序：
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1；§5.3 secret 類 / §6 red lines）
  - `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（Slice 1：§5.1 含 `downloadFunnel-suspicious-field` key-name check）
  - `docs/20260625-funnel-metadata-schema-validator-slice2/4/6-*.md`（required-combo / role↔policy / robots-safety）
  - `docs/20260624-gated-download-funnel-spec-lock.md`（§3.2 / §6 red lines：targetGatedPage / entryPages 不得填 Drive/Form/token）

---

## 1. Baseline 摘要

| 項目 | 值 |
| --- | --- |
| baseline | `caf880e`（HEAD == origin/main；ahead/behind 0/0；working tree clean；`.git/index.lock` absent） |
| F2（slice 1） | §5.1 structural / enum / **suspicious-field（key-name check）** |
| F3（slice 2） | §5.2 required-combo |
| F5（slice 4） | §5.4 role↔policy |
| F6（slice 6） | §5.4 role↔robots-safety |

current validation baseline（本 phase 開始時量測；docs-only）：

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js` | 89 passed / 0 failed |
| `npm run validate:content` | 0 / 133 / 105 |
| `npm run report:validation` | 0 / 133 / 105 |
| overlay | 0 / 140 / 106 |

production `downloadFunnel` 觸發數 = 0。

---

## 2. §5.3 規則盤點

F1 §5.3 列 3 條 candidate。分類：

| F1 §5.3 code | 對象 | 是否已 covered | 分類 / 結論 |
| --- | --- | --- | --- |
| `downloadFunnel-suspicious-field-secret-like` | **key name**（token / apiKey / driveFolderId / formResponse / editUrl / respondent …） | ✅ **已由 F2 `downloadFunnel-suspicious-field` 功能覆蓋**（任何非 allowed-4 key 已 warning 且不 echo value；slice-1 harness case 54 證實 driveFolderId key 被攔） | **不另開 code**（避免雙重 warning 噪音）；F7 不實作 |
| `downloadFunnel-target-gated-page-private-secret` | **targetGatedPage 之 value** | ❌ 未覆蓋（F2 只查 key 名，不查 allowed key 的 value） | **可做 value-based heuristic** → F7 落地候選（§4） |
| `downloadFunnel-entry-pages-private-secret` | **entryPages[] 之 value** | ❌ 未覆蓋 | **可做 value-based heuristic** → F7 落地候選（§4） |

→ F7 之**新**覆蓋面 = 「allowed value field（targetGatedPage / entryPages[]）的 value 看起來像 Drive / Form / token / respondent 私密連結」。key-name 維度已由 F2 覆蓋。

**不應實作的項目**：
- 對 `ctaEventName` 做 secret-scan → **deferred**（ctaEventName 為 GA4 event 名 enum，非連結欄位；其 enum 檢查綁定 F-GA4 normalization；不在 F7）。
- 掃描 `downloadFunnel` 以外的 frontmatter 欄位 → **不應實作**（§3 風險分析）。

---

## 3. Value-based heuristic 風險分析

### 3.1 False positive 風險
- 合法 public URL 可能含 querystring（如 `?utm_source=...`）→ 若 heuristic 對「任何 querystring」告警會誤判。**對策**：只對 **secret-意味** 的 query key（`token` / `key` / `auth` / `email` / `respondent` / `prefill`）與 **Drive/Form host** 告警，不對一般 querystring 告警。
- 合法 slug 可能含數字 / 連字號 → 若用「含長數字串」當訊號會誤判。**對策**：不以「含數字」為訊號；只以明確 host / query-key pattern。
- 因 false positive 不可避免 → 規則**必 warning-only**（非 hard gate），由作者最終判斷。

### 3.2 False negative 風險
- 經混淆 / 短網址 / 自訂網域包裝的 Drive/Form 連結無法被 pattern 命中。
- 因此 heuristic 是**安全網**而非保證；**作者責任**仍為主（spec-lock §6 red line：不得把 Drive/Form/token 填進 funnel 欄位）。

### 3.3 不可 echo value 的原因
- 觸發值**可能本身就是真實 secret**（Drive ID / Form response URL / token / respondent email）。把它 echo 進 warning message 會將 secret 洩漏到 stdout / CI log / `report:validation` 輸出 / dist-reports → 與防護目的相反。
- 故 message **只能**輸出 field name / type / reason，**絕不** echo value（mirror F2/F3/F6 慣例）。

### 3.4 為什麼不能掃描所有 frontmatter 欄位
- 多數欄位合法含 URL / ID（`canonical` / `cover` / `images[].url` / `affiliate` / publishedUrl …）→ 全欄位掃描會產生大量 false positive。
- 全欄位掃描需處理不相關的敏感欄位，增加 echo / 誤判風險與 scope creep。
- spec-lock §6 之 secret red line **本就限定於 funnel 欄位**；維持 scope 一致。

### 3.5 為什麼只能限制在 downloadFunnel allowed value fields
- `targetGatedPage` / `entryPages[]` 有**狹窄契約**（只應為 slug 或自家 public page URL，per F1 §3.2.2 / §3.2.3）；偏離成 Drive/Form/token 是**強訊號**、低 false-positive。
- 其他欄位契約寬鬆，同樣 pattern 在那裡多為合法。

### 3.6 placeholder / sample 安全
- 如何避免把合法 slug 誤判成 secret：heuristic 視 **simple slug / relative path**（無 scheme、無 querystring、無 Drive/Form host）為 safe（§5 truth table）。
- 如何避免 placeholder sample 變成實際敏感格式：harness / fixture **只用** 明顯假值 —— host 用 `example.com` / `drive.example.com`（非真實 `drive.google.com` 之真實 ID）、token 用 `FAKE-TOKEN` / `PLACEHOLDER`（非真實長度 base64）；**不**構造看似真實的 Drive file ID（如真實 33 字元）或真實 Form `1FAIpQLS...` 字串。

---

## 4. 建議 F7 source landing 最小 slice

### 4.1 建議：**2 個 warning code（per-field；共用一個 heuristic helper）**

理由：既有 slices 對 targetGatedPage / entryPages 一向採**分欄位 code**（invalid-type / wrong-role 皆分開）；分 2 code 可精準指出作者該修哪個欄位，並 mirror F1 §5.3 之兩條設計。內部以單一純函式 `looksLikePrivateLink(value)` 共用，避免重複。

> 命名採用者建議之 `-private-value` 後綴（取代 F1 §5.3 草案之 `-private-secret`）：語意為「看起來像私密 / 敏感值」，不預設已確認為 secret，且呼應「不 echo value」。

| code | 觸發欄位 | 觸發條件 | 不觸發條件 | warning-only | message 如何避免 echo | harness case 估計 | production validate:content |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `downloadFunnel-target-gated-page-private-value` | `targetGatedPage`（string） | value 命中 private-link heuristic（§5 WARNING 列）：Drive host / Form edit·response·prefill / querystring 含 token·key·auth·email·respondent | simple slug / relative path / 一般 public 絕對 URL；非 string（由 invalid-type 處理）；缺省 | ✅ | message 只含 `downloadFunnel.targetGatedPage` + reason（如「looks like a private Drive/Form/token link; use a public slug or page URL — value not shown」），**不** echo value | ~6–8 | **維持 0 / 133 / 105** |
| `downloadFunnel-entry-pages-private-value` | `entryPages[]`（每個 string entry） | 任一 entry 命中同一 heuristic | 全為 simple slug / relative / 一般 public URL；非 array / 非 string（由 invalid-type 處理） | ✅ | message 只含 `downloadFunnel.entryPages`（必要時加 index）+ reason，**不** echo value | ~5–7 | **維持 0 / 133 / 105** |

合計 harness case 估計 ~12–15（含兩 code 之 trigger / safe / no-echo / 與既有 invalid-type 互斥）。

### 4.2 為何不建議 1 個合併 code
- 1 個 `downloadFunnel-private-value` 雖更簡，但喪失「哪個欄位」之精準指引；與既有 per-field 慣例不一致。若 Dean 偏好極簡，仍可選 1 code，但本 preflight **建議 2 code**。

### 4.3 cascade / 互斥
- private-value 只在欄位為 **string**（target）/ **array-of-string 之 string 元素**（entryPages）時評估；非 string → 既有 invalid-type 處理，private-value 不重複報。
- 與 robots / sitemap / listings / required-combo 規則**正交**（不同維度，可獨立並存）。

---

## 5. Heuristic truth table 草案（**只**針對 downloadFunnel allowed value fields）

對象：`targetGatedPage`（單一 string）、`entryPages[]`（每個 string entry）。`ctaEventName` → **deferred**（GA4 normalization；非連結欄位）。

| value 形態 | 範例（**全 placeholder**） | 判定 | 備註 |
| --- | --- | --- | --- |
| simple slug | `gated-zhuyin-download` | **SAFE**（不告警） | 合法主要形態 |
| relative slug / path | `/posts/gated-zhuyin-download/` | **SAFE** | 合法 |
| 一般 public 絕對 URL（自家站） | `https://example.github.io/posts/x/`、`https://example.blogspot.com/p/x.html` | **SAFE**（不告警） | 合法 public page URL；host-mismatch（非自家 host）之校驗 = **deferred**（屬 cross-host / bidirectional，不在 F7） |
| Google Drive-like | `https://drive.example.com/drive/folders/FAKE`、`.../file/d/FAKE/view`（pattern：`drive.google.com` host 或 `/drive/folders/` `/file/d/`） | **WARNING** | private link |
| Google Form-like | `https://docs.example.com/forms/d/FAKE/edit`、`.../formResponse`、`...viewform?...prefill=...`（pattern：`docs.google.com/forms` + `edit`/`formResponse`/`prefill`） | **WARNING** | private / response / prefill |
| token-like / querystring-like | `https://example.com/x?token=FAKE`、`?key=FAKE`、`?auth=FAKE`、`?email=FAKE`、`?respondent=FAKE` | **WARNING** | secret query key |
| long opaque ID-like（裸 ID，無 scheme/host） | `1AbCdEf...`（30+ 字元 base64-ish） | **DEFERRED** | 太模糊、高 false-positive（可能為合法 slug 片段）；F7 不判，留待後續更精確設計 |

判定原則：**只**對「明確 Drive/Form host pattern」或「secret 意味 query key」告警；不對「含數字 / 長度 / 一般 querystring」告警（避免 false positive）。

---

## 6. Safety rules（F7 未來 source landing MUST 遵守）

1. **warning-only**（severity `'warning'`；無 error / hard gate；因 heuristic 必有 false positive）。
2. **不得 echo sensitive value**：message 只能說明 field name / type / reason，**不得**輸出 value。
3. harness sample **只能 fake / placeholder**（`example.com` / `drive.example.com` / `FAKE-TOKEN`）；**不得**使用真實 Drive ID / Form URL / response URL / token / respondent data。
4. **不得掃描** production live source 以外的外部服務；**不**讀 Blogger live / Form / Drive / GA4 backend。
5. **不得改 indexing decision**；**不得鬆動** noindex / sitemap / listings safety（§4.7）。
6. 只掃描 `downloadFunnel` allowed value fields（targetGatedPage / entryPages[]）；**不**全欄位掃描。

---

## 7. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- `ctaEventName` secret-scan / enum normalization（GA4 normalization phase；F7 明確判定 **deferred**）
- bidirectional cross-file consistency
- long opaque ID-like / host-mismatch absolute URL 之判定（§5 DEFERRED 列）
- `.md` fixture 補齊
- production content migration
- live funnel
- Google Form / Drive integration
- GA4 backend write
- Admin write path
- generated HTML / deployed robots verification
- Blogger robots dimension
- build / deploy / repost

---

## 8. 本 phase 非動作（non-actions）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 改 `validate-content.js` / `check-page-type-validator.js` | ✅ 未動 |
| 2 | 改 content `.md` / 新增 production fixture / settings / package / lockfile | ✅ 未動 |
| 3 | 改 CLAUDE.md / MEMORY.md / dist / gh-pages / .cache / generated HTML | ✅ 未動 |
| 4 | build / deploy / repost / dev server | ✅ 未執行 |
| 5 | Blogger live / Google Form / Drive / GA4 backend / AdSense / Search Console / Admin write path | ✅ 未動 |
| 6 | 加入 secrets / Drive IDs / Form response URLs / tokens / respondent data | ✅ 未動（含本檔範例全 placeholder） |
| 7 | 改 indexing decision | ✅ 未動 |
| 8 | 推進 §5.3 secret heuristic / bidirectional / ctaEventName / .md fixture 之 source | ✅ 僅盤點 |
| 9 | 僅新增本 1 個 docs preflight record | ✅ |

---

## 9. Cross-links

- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5.3 / §6 red lines）
- `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（F2 suspicious-field key-name check）
- `docs/20260624-gated-download-funnel-spec-lock.md`（§3.2 / §6：targetGatedPage / entryPages 不得填 Drive/Form/token）
- `docs/20260625-funnel-metadata-schema-validator-slice6-robots-safety-landing-record.md`（前一 source slice）
- `CLAUDE.md` §7 / §13 / §16 / §29（red lines）

（本文件結束）
