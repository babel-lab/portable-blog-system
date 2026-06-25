# Funnel metadata schema validator — Slice 1 source landing record

- Phase id：`20260625-funnel-metadata-schema-validator-slice1-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**minimal source landing**（validator + harness only；warning-only；additive；純 validation 層）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / 索引 metadata 之 validation；**不**改 robots / sitemap / listings 行為）、L（build script / validator）
- 前序：
  - `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 schema preflight；本 slice 直接落地對象）

---

## 0. 本 phase A/B 判斷

Dean 本 session 指示「a 的下一個最小安全步」，優先方向＝「建立或補齊 gated download / download funnel metadata schema 的 **source-level 支援與驗證基礎**」，並要求保守。

判斷採 **B（最小 source implementation landing）**，理由：

1. F1（`20260625-funnel-metadata-schema-preflight-a.md`）§3 / §5.1 已完整鎖定 4 欄位、enum、allowed keys、validator code 命名 → 文件足夠明確。
2. Dean session priority 明示要 source-level 驗證基礎。
3. 既有 pattern（SP-2 / SP-8 / Slice 1）使本變更可做到 **additive / warning-only / 零 production trigger / 零 fixture**。
4. 全部紅線可守（無 backend、無 secret、不碰 robots / sitemap / listings effective 行為）。

只落地 F1 §5.1 之 **結構 / role enum / 未知 key** 三層（最小切片）；§5.2 required-combo、§5.3 value-based secret heuristic、§5.4 cross-field 一律 **deferred** 至後續 slice。

---

## 1. Baseline（read-only verify；本 phase 開始時）

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD == origin/main | `4a45f82115f1ec679707779d03f8beffff34616b` |
| short | `4a45f82` |
| latest subject | `docs(download): lock funnel metadata schema preflight` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

baseline 符合預期 frozen state。

---

## 2. 變更內容（changed files）

### 2.1 `src/scripts/validate-content.js`（+ 常數 + validator block）

- 新增常數（緊接 `GATED_DOWNLOAD_DISALLOWED_KEYS` 之後）：
  - `VALID_DOWNLOAD_FUNNEL_ROLE = new Set(['entry', 'gated_page'])`（`post_submit` 不列入，per F1 §3.2.1）
  - `DOWNLOAD_FUNNEL_ALLOWED_KEYS = new Set(['role', 'targetGatedPage', 'entryPages', 'ctaEventName'])`
- 於 `validatePageTypeMetadata()` 新增 rule 11（接在 gatedDownload suspicious-field block 之後、cross-rules 之前），四檢查皆 `severity: 'warning'`：

  | code | 觸發條件 |
  | --- | --- |
  | `downloadFunnel-invalid-type` | `downloadFunnel` present 但非 plain object |
  | `downloadFunnel-role-missing` | object 但 `role` 缺省 |
  | `downloadFunnel-role-invalid-enum` | `role` 非 `entry` / `gated_page`（含非 string / 大小寫變體 / `post_submit`） |
  | `downloadFunnel-suspicious-field` | 任一 key 不在 allowed 4 key 內（只報欄位名，**不** echo value） |

- 安全：`downloadFunnel` 屬純 metadata；effective robots / sitemap / listings 完全不受影響（F1 §4.7 安全優先順序最低層）。本 block 不讀寫任何 indexing decision。

### 2.2 `src/scripts/check-page-type-validator.js`（+ harness 認列 + 11 test cases）

- `isSpRuleType()` 擴充：認列 `downloadFunnel-` 前綴（沿用既有 severity invariant 斷言）。
- 新增 case 46–56（11 條）：absent / valid entry / valid gated_page / invalid-type / role-missing / role enum（post_submit、non-string、大小寫）/ suspicious-field（value 不外洩）/ all-4-allowed / 複合獨立兩 warning。

### 2.3 `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（本檔）

---

## 3. 測試 / 驗證結果

| 指令 | 結果 |
| --- | --- |
| `node src/scripts/check-page-type-validator.js` | **56 passed / 0 failed**（前 45 + 新 11；exit 0） |
| `npm run validate:content` | **0 error / 133 warning / 105 post**（與前序 spec-lock §10 baseline byte-identical；**未變**） |
| `validate:content` 中 `downloadFunnel` 觸發數 | **0**（無 production / fixture post 含 `downloadFunnel`） |

→ 完全 additive：production warning 數 0 變動；無新 fixture；無內容遷移。

---

## 4. 未觸碰紅線（明確聲明）

- ❌ 未碰 Blogger live / Google Form / Google Drive 後台。
- ❌ 未寫入 GA4 / AdSense / Search Console / Admin backend / write path。
- ❌ 未加入任何 secret / Drive ID / Form response URL / token / respondent data。
- ❌ 未 build / deploy / repost；未啟 dev server；未動 `dist*` / gh-pages / `.cache` / generated HTML。
- ❌ 未改 `package.json` / lockfile。
- ❌ 未改 CLAUDE.md / MEMORY.md / memory/。
- ❌ 未新增真實下載頁內容 / 真實 Google Drive URL；harness 用 placeholder slug only。
- ❌ 未鬆動 listings / robots / noindex / download / special pageType 既有 safety；page indexing 規則維持：
  - indexed entry page：index-follow / sitemap true / listings true
  - gated download page：noindex-follow / sitemap false / listings false
  - 本 slice 為純 metadata validation 層，**不參與** 上述 decision。

---

## 5. Deferred（後續各須獨立 phase + Dean explicit approval）

- F1 §5.2 required-combo（entry↔targetGatedPage / gated_page↔entryPages 必填 / wrong-role）
- F1 §5.3 value-based secret heuristic（Drive folder / Form response / token query string 偵測）
- F1 §5.4 cross-field 一致性（bidirectional / robots / sitemap / listings 矛盾偵測）
- F1 §3.2.4 `ctaEventName` enum 驗證（待 F7 GA4 normalization 裁定唯一值）
- `.md` fixture 補齊（本 slice 比照 SP-8 採 harness-only；fixture 可後補）
- F2 template preflight / F8 Admin read-only funnel fields

---

## 6. Cross-links

- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 schema preflight；本 slice 落地對象）
- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 validator pattern 先例）
- `docs/20260623-pm-sp8-platform-policy-shape-validator.md`（SP-8 harness-only 先例）
- `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 warning 先例）
- `CLAUDE.md` §7 / §11 / §13 / §15–§17 / §21 / §23

（本文件結束）
