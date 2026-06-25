# Funnel metadata validator — Slice 4（F1 §5.4 role↔policy 一致性）source landing record

- Phase id：`20260625-funnel-metadata-schema-validator-slice4-role-policy-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**minimal source landing**（validator + harness only；warning-only；additive；純 validation 層）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / 索引 metadata 之 validation；**不**改 robots / sitemap / listings 行為）、L（build script / validator）
- 前序：
  - `docs/20260625-funnel-metadata-schema-validator-slice3-preflight.md`（F4 preflight；§3.1 建議本 slice）
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1；§5.4 / §4.4 / §4.5 / §4.1）
  - `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（Slice 1：§5.1）
  - `docs/20260625-funnel-metadata-schema-validator-slice2-required-combo-landing-record.md`（Slice 2：§5.2）

---

## 1. Baseline（read-only verify；本 phase 開始時）

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD == origin/main | `9d3e0341083231826683e7acd640ae698d9aa8a6` |
| short | `9d3e034` |
| latest subject | `docs(download): preflight next funnel metadata validator slice` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

read-only 檢視：`docs/20260625-funnel-metadata-schema-validator-slice3-preflight.md`、`docs/20260625-funnel-metadata-schema-preflight-a.md`、`docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`、`docs/20260625-funnel-metadata-schema-validator-slice2-required-combo-landing-record.md`、`docs/20260624-gated-download-funnel-spec-lock.md`、`src/scripts/validate-content.js`、`src/scripts/check-page-type-validator.js`、`CLAUDE.md`。

---

## 2. F4 preflight 如何導向本 F5

F4 preflight（slice3）§2.2 將 §5.4 五規則分類：
- `role-conflicts-sitemap-safety` / `role-conflicts-listings-default` / `gated-page-pageType-mismatch` → **(b) low risk，可在下一個 source slice 落地**
- `role-conflicts-robots-safety` → **(c)**（需 effective-robots 衍生）→ deferred 至 F6
- `bidirectional-inconsistent` → **(d)** cross-file → deferred

F4 §3.1 明確建議「只選這一組最小 slice」＝上述三條 (b) 規則，理由：純單篇欄位比較、零 value 處理→零 secret 風險、mirror SP-2 rules 5–8、warning-only 不改 indexing decision、0 production trigger。本 F5 即依此**逐字落地該三規則**。

三規則明確性判定：**明確可落地**（F4 §3.1 truth-table 完整，含 sitemap 之 `platformPolicy.github.includeInSitemap` 變體與 pageType-mismatch「缺省不觸發」邊界）；未自行發明規則。

---

## 3. 三條新增 warning code 與觸發條件

| code | 觸發條件（role 必為 `gated_page`） | warning-only | 不 echo value |
| --- | --- | --- | --- |
| `downloadFunnel-role-conflicts-sitemap-safety` | top-level `includeInSitemap === true` **或** `platformPolicy.github.includeInSitemap === true` | ✅ | ✅（無 value） |
| `downloadFunnel-role-conflicts-listings-default` | top-level `includeInListings === true` | ✅ | ✅（無 value） |
| `downloadFunnel-gated-page-pageType-mismatch` | `pageType` present 且 ∉ {`gated_download`, `download`}（`pageType` 缺省 **不**觸發） | ✅ | ✅（無 value） |

實作位置：`validate-content.js` `validatePageTypeMetadata()` 之 **block 13**，僅在 `funnel.role === 'gated_page'` 時評估。

### 安全性質

- **warning-only**：三規則 severity 一律 `'warning'`（harness `pageIssues` 已對所有 `downloadFunnel-*` issue 斷言 warning）。
- **no value echo**：三規則 message 皆為固定字串（role + 欄位名 + 布林 / enum 字串），**完全不含** `targetGatedPage` / `entryPages` / URL / slug / token / Drive ID / Form URL / respondent data；harness test 81 以 `example.com` placeholder 鎖定。
- **no production trigger**：無 production / fixture post 含 `downloadFunnel` → `validate:content` 觸發數 0。
- **單篇、不跨檔案、不推導 effective robots、不改 indexing decision**：三規則只讀本篇 `downloadFunnel.role` 與本篇 `includeInSitemap` / `includeInListings` / `pageType` / `platformPolicy.github.includeInSitemap`；**不**呼叫 `page-type-robots.js`、**不**改 `include-in-sitemap.js` / `include-in-listings.js` 行為。方向為**強化** safety（作者以 `includeIn*:true` 想把 gated_page 拉進 sitemap/listings 時告警），既有 §4.7 安全優先順序不變。

---

## 4. 變更內容（changed files）

### 4.1 `src/scripts/validate-content.js`

- `validatePageTypeMetadata()` funnel object 分支內、block 12 之後新增 **block 13**（(k)/(l)/(m) 三規則，全 warning-only，僅 `role==='gated_page'` 評估）。
- 無新增常數；無改既有規則。

### 4.2 `src/scripts/check-page-type-validator.js`

- 新增 case 72–82（11 條）：三規則各 positive case；`platformPolicy.github.includeInSitemap` 變體（73）；pageType-mismatch 三態（article=mismatch / download=valid / gated_download=valid / 缺省=no-fire，75–78）；role=entry 不觸發（79/80，鎖「只對 gated_page」）；no-echo（81）；三衝突獨立並存（82）。
- 既有 case 全數不受影響（既有 gated_page 樣本皆無 `includeInSitemap` / `includeInListings` / `pageType`，故不回溯觸發）。

### 4.3 `docs/20260625-funnel-metadata-schema-validator-slice4-role-policy-landing-record.md`（本檔）

---

## 5. 測試 / 驗證結果

| 指令 | F4 baseline | F5 後 |
| --- | --- | --- |
| `node src/scripts/check-page-type-validator.js` | 71 / 0 | **82 passed / 0 failed** |
| `npm run validate:content` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| `npm run report:validation` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| overlay（`validate-content.js --registry-overlay …`） | 0 / 140 / 106 | **0 / 140 / 106**（不變） |
| `validate:content` 中 `downloadFunnel` 觸發數 | 0 | **0** |

→ harness pass 71→82（+11）、failed 維持 0；production / report / overlay 全部 byte-identical 不變。

---

## 6. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- `downloadFunnel-role-conflicts-robots-safety`（需 effective-robots 衍生；F6）
- §5.3 secret / value heuristic（`target-gated-page-private-secret` / `entry-pages-private-secret`；F7-secret）
- `downloadFunnel-bidirectional-inconsistent`（cross-file consistency）
- `ctaEventName` normalization / GA4（隨 F7 GA4 normalization）
- `.md` fixture 補齊
- live funnel
- Google Form / Drive integration
- GA4 backend write
- Admin write path
- build / deploy / repost

---

## 7. 未觸碰紅線（明確聲明）

- ❌ 未改 content `.md` / 未新增 production fixture / 未改 settings。
- ❌ 未改 `package.json` / lockfile / CLAUDE.md / MEMORY.md / `dist*` / gh-pages / `.cache` / generated HTML。
- ❌ 未碰 Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path。
- ❌ 未 build / deploy / repost / dev server。
- ❌ warning message 未 echo 任何 URL / slug / token / Drive ID / Form URL / respondent data；harness sample 全 placeholder（`example.com` / `zhuyin-intro` / `gated-zhuyin-download`）。
- ❌ 未推導 effective robots、未改 indexing decision、未鬆動 noindex / sitemap / listings 之既有 safety；`downloadFunnel` 仍為純 metadata。
- ❌ 未推進 robots-safety / §5.3 secret heuristic / bidirectional / ctaEventName。

---

## 8. Cross-links

- `docs/20260625-funnel-metadata-schema-validator-slice3-preflight.md`（F4 preflight；建議來源）
- `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1 §5.4 / §4.4 / §4.5 / §4.1）
- `docs/20260625-funnel-metadata-schema-validator-slice1-landing-record.md`（Slice 1）
- `docs/20260625-funnel-metadata-schema-validator-slice2-required-combo-landing-record.md`（Slice 2）
- `CLAUDE.md` §7 / §11 / §13 / §16 / §21

（本文件結束）
