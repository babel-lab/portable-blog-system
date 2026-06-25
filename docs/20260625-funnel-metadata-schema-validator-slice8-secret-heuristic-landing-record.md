# Funnel metadata validator — Slice 8（F7 §5.3 value-based secret heuristic）source landing record

- Phase id：`20260625-funnel-metadata-schema-validator-slice8-secret-heuristic-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**minimal source landing**（validator + harness only；warning-only；additive；純 validation 層）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / secret hygiene 之 validation）、L（build script / validator）；**不**改任何 indexing decision
- 前序：
  - `docs/20260625-funnel-metadata-schema-validator-slice7-secret-heuristic-preflight.md`（F7 preflight；§4 建議 / §5 truth table）
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5.3 / §6 red lines）
  - `docs/20260624-gated-download-funnel-spec-lock.md`（§3.2 / §6：targetGatedPage / entryPages 不得填 Drive/Form/token）

---

## 1. Baseline（read-only verify；本 phase 開始時）

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD == origin/main | `a44127e0c9f63e21640b3b300d3e16fb6dca7aca` |
| short | `a44127e` |
| latest subject | `docs(download): preflight funnel secret heuristic validator` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

read-only 檢視：slice7（F7 preflight）/ slice6 / preflight-a / spec-lock docs、`src/scripts/validate-content.js`、`src/scripts/check-page-type-validator.js`、`CLAUDE.md`。

---

## 2. F7 preflight 如何導向本 source landing

F7 preflight（slice7）§2 將 §5.3 三 candidate 分類：`suspicious-field-secret-like`（key-name）已由 F2 覆蓋 → 不另開 code；`target-gated-page-private-secret` / `entry-pages-private-secret`（value）未覆蓋 → **可做 value-based heuristic**。§4.1 建議 **2 個 per-field warning code（共用 `looksLikePrivateLink` helper）**，採 `-private-value` 後綴。§5 truth table 鎖定 SAFE / WARNING / DEFERRED 邊界。本 F7 即依此落地。

明確性判定：**明確可落地**（§5 truth table 完整，含 query key 清單與 placeholder 規範）；未自行發明規則。

---

## 3. 新增 2 個 warning code

| code | 觸發欄位 | 觸發條件 | 不觸發條件 | warning-only | 不 echo value |
| --- | --- | --- | --- | --- | --- |
| `downloadFunnel-target-gated-page-private-value` | `targetGatedPage`（string） | `looksLikePrivateFunnelLink(value)` 命中 | simple slug / relative path / 一般 public absolute URL；非 string（→ invalid-type）；缺省 | ✅ | ✅（固定字串 + reason，無 value） |
| `downloadFunnel-entry-pages-private-value` | `entryPages[]`（任一 string 元素） | 任一 entry 命中 heuristic | 全 safe；非 array / 元素非 string（→ invalid-type） | ✅ | ✅（不報 index / 不報 value） |

實作位置：`validate-content.js` `validatePageTypeMetadata()` 之 **block 14**（funnel object 分支內、gated_page block 之後；**與 role 無關**，欄位 present 即掃）。新增純函式 `looksLikePrivateFunnelLink(value)` + `FUNNEL_SECRET_QUERY_KEY_RE`。

---

## 4. Heuristic 判斷範圍與 truth table（只 targetGatedPage / entryPages[]）

`looksLikePrivateFunnelLink(value)` 回傳 true（WARNING）僅當：
- **Google Drive-like**：host label 以 `drive.` 開頭，或 path 含 `/drive/folders/` 或 `/file/d/`
- **Google Form-like**：host label 以 `forms.` 開頭，或 path 含 `/forms/` 且帶 `edit` / `formResponse` / `prefill` / `viewform`
- **token-like secret query key**：querystring 含 key 名 `token` / `key` / `auth` / `email` / `respondent`（精確比對 key 名）

| value 形態 | 範例（placeholder） | 判定 |
| --- | --- | --- |
| simple slug | `gated-zhuyin-download` | SAFE |
| relative path | `/posts/gated-zhuyin-download/` | SAFE |
| 一般 public absolute URL | `https://example.github.io/posts/x/` | SAFE（host-mismatch 校驗 deferred） |
| Drive-like | `https://drive.example.com/drive/folders/FAKE` | **WARNING** |
| Form-like | `https://forms.example.com/forms/d/FAKE/edit` | **WARNING** |
| token query key | `https://example.com/x?token=FAKE`（token/key/auth/email/respondent） | **WARNING** |
| bare long opaque ID | `1AbC...0123456789` | DEFERRED（不告警） |
| 一般 querystring | `?utm_source=fb&utm_medium=social` | 不告警（false-positive guard） |
| `ctaEventName` | 任意 | DEFERRED（不掃描） |

### 不掃 ctaEventName / 不掃全 frontmatter / 不處理 opaque ID 的原因（mirror preflight §3）
- **不掃 ctaEventName**：屬 GA4 event 名 enum、非連結欄位；其處理綁定 GA4 normalization（另開 phase）。
- **不掃全 frontmatter**：多數欄位合法含 URL/ID（canonical / cover / images / affiliate …）→ 全掃會大量 false positive + 增加 echo/誤判風險；secret red line 本就限定 funnel 欄位。
- **不處理 bare opaque ID**：無 scheme/host 之裸長字串太模糊、高 false-positive（可能為合法 slug 片段）→ deferred。
- **不以「含數字 / 很長 / 一般 querystring」為訊號**：避免把合法 slug / public URL / utm 連結誤判（test 103 鎖定）。

---

## 5. 變更內容（changed files）

### 5.1 `src/scripts/validate-content.js`
- 新增純函式 `looksLikePrivateFunnelLink(value)` + 常數 `FUNNEL_SECRET_QUERY_KEY_RE`（只回 boolean；不 echo）。
- block 14（funnel object 分支）：targetGatedPage（string）與 entryPages[]（string 元素）命中 heuristic → 各自 push warning（warning-only）。
- **未改** robots / sitemap / listings / indexing 任何行為。

### 5.2 `src/scripts/check-page-type-validator.js`
- **新增 case 90–103**（14 條）：target safe（slug / relative / absolute）、target Drive/Form/token warning、entryPages safe / Drive / Form / token warning、no-echo（100）、ctaEventName 不掃（101）、bare opaque ID deferred（102）、utm querystring false-positive guard（103）。
- 既有 case 全數不受影響（既有 funnel 樣本之 targetGatedPage / entryPages 皆為 slug / `entry-N` / 一般 `https://example.com/p`，**無** Drive/Form/token pattern → 0 新觸發）。

### 5.3 `docs/20260625-funnel-metadata-schema-validator-slice8-secret-heuristic-landing-record.md`（本檔）

---

## 6. 測試 / 驗證結果

| 指令 | F7 preflight baseline | F7 landing 後 |
| --- | --- | --- |
| `node src/scripts/check-page-type-validator.js` | 89 / 0 | **103 passed / 0 failed** |
| `npm run validate:content` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| `npm run report:validation` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| overlay | 0 / 140 / 106 | **0 / 140 / 106**（不變） |
| `validate:content` 中 `downloadFunnel` 觸發數 | 0 | **0** |

→ harness pass 89→103（+14）、failed 維持 0；production / report / overlay 全部 byte-identical 不變。

---

## 7. warning-only / no value echo / no production trigger（聲明）

- **warning-only**：兩 rule severity `'warning'`（harness `pageIssues` 對所有 `downloadFunnel-*` 斷言 warning）。
- **no value echo**：message 為固定字串 + reason，不含 value / host / index；harness test 100 以 `SECRET-FAKE-ID` / `drive.example.com` 鎖定。
- **no production trigger**：無 production / fixture post 含 `downloadFunnel` → 0 觸發；validate:content 維持 0/133/105。
- **no indexing change**：純 validation 層；不讀 live 服務、不改 robots / sitemap / listings。

---

## 8. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- ctaEventName / GA4 normalization
- bidirectional cross-file consistency
- bare long opaque ID-like / host-mismatch absolute URL 判定
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

## 9. 未觸碰紅線（明確聲明）

- ❌ 未改 content `.md` / 未新增 production fixture / 未改 settings。
- ❌ 未改 `package.json` / lockfile / CLAUDE.md / MEMORY.md / `dist*` / gh-pages / `.cache` / generated HTML。
- ❌ 未碰 Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path。
- ❌ 未 build / deploy / repost / dev server。
- ❌ warning message 未 echo 任何 URL / slug / token / Drive ID / Form URL / respondent data；harness sample 全 fake / placeholder（`drive.example.com` / `forms.example.com` / `FAKE-*`），未使用真實 Drive ID / Form URL / response URL / token。
- ❌ 未讀 live Blogger / Form / Drive / GA4 backend；未掃 funnel 以外欄位、未掃 ctaEventName、未處理 bare opaque ID、未做 host-mismatch。
- ❌ 未改 indexing decision、未鬆動 noindex / sitemap / listings safety。

---

## 10. Cross-links

- `docs/20260625-funnel-metadata-schema-validator-slice7-secret-heuristic-preflight.md`（F7 preflight；建議來源）
- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5.3 / §6）
- `docs/20260624-gated-download-funnel-spec-lock.md`（§3.2 / §6 red lines）
- `docs/20260625-funnel-metadata-schema-validator-slice6-robots-safety-landing-record.md`（前一 source slice）
- `CLAUDE.md` §7 / §13 / §16 / §29

（本文件結束）
