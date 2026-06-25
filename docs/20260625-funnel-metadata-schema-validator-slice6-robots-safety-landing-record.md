# Funnel metadata validator — Slice 6（F6 robots-safety）source landing record

- Phase id：`20260625-funnel-metadata-schema-validator-slice6-robots-safety-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**minimal source landing**（validator + harness only；warning-only；additive；純 validation 層）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / robots 之 validation；**不**改 robots / sitemap / listings 行為）、L（build script / validator）
- 前序：
  - `docs/20260625-funnel-metadata-schema-validator-slice5-robots-safety-preflight.md`（F6 preflight；§3 truth table / §4 建議）
  - `docs/20260625-funnel-metadata-schema-validator-slice4-role-policy-landing-record.md`（F5：§5.4 role↔policy 三規則）
  - `docs/20260625-funnel-metadata-schema-preflight-a.md`（F1；§5.4 / §4.3 / §4.7）

---

## 1. Baseline（read-only verify；本 phase 開始時）

| 項目 | 值 |
| --- | --- |
| branch | `main` |
| HEAD == origin/main | `69001d398df256f77a0006f1deab55676b7979f0` |
| short | `69001d3` |
| latest subject | `docs(download): preflight funnel robots-safety validator slice` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

read-only 檢視：slice5（F6 preflight）/ slice4 / slice3 / preflight-a / spec-lock docs、`src/scripts/validate-content.js`、`src/scripts/check-page-type-validator.js`、`CLAUDE.md`；另確認 `src/scripts/page-type-robots.js`（`resolvePostDetailRobots`）。

---

## 2. F6 preflight 如何導向本 source landing

F6 preflight（slice5）§4.1 明確建議：**只新增 1 個 warning code** `downloadFunnel-role-conflicts-robots-safety`，**重用純函式 `resolvePostDetailRobots(post)`**（page-type-robots.js）作為 effective GitHub robots 之唯一真相來源，**只在** effective robots === `'index, follow'` 時告警（§3.2 truth table），任何 noindex 路徑視為 safe（§3.1）。preflight §2.2 已驗證該 helper 純函式、零 side-effect、**無 circular import** → 可安全重用。

三條規則明確性判定：**明確可落地**（§3 truth table 完整，含 safe/warning/deferred 三段邊界）；未自行發明規則。

---

## 3. 新增 warning code 與實際觸發條件

| code | 觸發條件 | warning-only | 不 echo value |
| --- | --- | --- | --- |
| `downloadFunnel-role-conflicts-robots-safety` | `downloadFunnel.role === 'gated_page'` **且** `resolvePostDetailRobots(post) === 'index, follow'` | ✅ | ✅（固定字串 + robots enum，無 value） |

實作位置：`validate-content.js` `validatePageTypeMetadata()` 之 block 13 內（`funnelRole === 'gated_page'` 守衛內，接在 (k)/(l)/(m) 之後，標 (n)）。新增 `import { resolvePostDetailRobots } from './page-type-robots.js'`。

### 3.1 safe cases（不告警）

`resolvePostDetailRobots(post)` 回傳任一 `noindex, *` → safe：
- `seo.indexing: noindex-follow` / `noindex-nofollow`（explicit，最高優先）
- `contentKind: 'download'`（legacy download safety；無 `seo.indexing:index`）
- `pageType: gated_download` / `download` / `utility_hidden` / `redirect_canonical`
- `platformPolicy.github.indexing` tighten 至 noindex

→ 重用 `resolvePostDetailRobots`（而非 validator 內 `isNoindex`，後者只看 `seo.indexing`）是**避免 false-positive 的關鍵**：validator 的「可索引」判定與 build 輸出 byte-identical 對齊。

### 3.2 warning cases（告警）

`role:'gated_page'` 且 effective robots = `index, follow`：
- `seo.indexing: index`（明示可索引；最高風險）
- 無 noindex 之 `seo.indexing` + `pageType` 非 download/gated/special + `contentKind` 非 download（組合不足以保證 noindex → 落在 default `index, follow`）

### 3.3 deferred cases（不在本 slice 判斷）

cross-file consistency / sitemap·listings（F5 已處理）/ §5.3 secret value heuristic / live URL·Form·Drive availability / actual deployed robots meta / generated HTML verification / **Blogger robots**（後台手動 SP-9c，無法系統推導）。

### 3.4 已知 overlap（記錄）

`role:'gated_page'` + `pageType:'gated_download'` + `seo.indexing:'index'`：本 rule 告警（effective robots = index, follow，explicit seo 勝），同時既有 SP-2 rule 5 `page-gated-download-indexed` 亦告警。兩者屬獨立維度（downloadFunnel.role×effective-robots vs pageType×seo），雙 warning 可接受；harness case 89 鎖定此 overlap。

---

## 4. 變更內容（changed files）

### 4.1 `src/scripts/validate-content.js`

- 新增 `import { resolvePostDetailRobots } from './page-type-robots.js'`（純函式重用；無 circular import）。
- block 13 `gated_page` 守衛內新增 (n)：`resolvePostDetailRobots(post) === 'index, follow'` → `downloadFunnel-role-conflicts-robots-safety`（warning-only）。
- **未改** `page-type-robots.js` / sitemap / listings / build 任何 effective 行為（只讀）。

### 4.2 `src/scripts/check-page-type-validator.js`

- **新增 case 83–89**（7 條）：explicit index（83）/ default-indexable 組合不足（84）/ seo noindex-follow safe（85）/ contentKind download safe，false-positive 防線（86）/ 非 gated_page role 不觸發（87）/ message 不 echo value（88）/ pageType gated_download + seo index overlap（89）。
- **更新既有 19 個 gated_page case**：因新 rule 對「default-indexable gated_page」告警，既有 gated_page 樣本需補 robots-safe 訊號以隔離原斷言：
  - 13 個 plain case（48/54/58/59/60/63/64/65/66/67/70/71/78）：補 `seo: { indexing: 'noindex-follow' }`（無 includeIn* → 不觸發 rule 7/8；斷言不變）。
  - sitemap case（72/73/81）：補 `pageType: 'gated_download', includeInListings: false`（pageType→robots-safe；不觸發 rule 7 / Slice-1；斷言不變）。
  - listings case（74）：補 `contentKind: 'download'`（contentKind→robots-safe；斷言不變）。
  - pageType-mismatch case（75）：補 `seo: { indexing: 'noindex-follow' }`（斷言不變）。
  - all-conflicts case（82）：此頁 indexable，robots-safety 合理並存 → 預期由 3 → **4 warnings**（展示四 funnel 規則獨立）。
- 既有非 gated_page case（entry / role-missing / role-invalid / non-object）不受影響（rule 受 `gated_page` 守衛）。

### 4.3 `docs/20260625-funnel-metadata-schema-validator-slice6-robots-safety-landing-record.md`（本檔）

---

## 5. 測試 / 驗證結果

| 指令 | F6 preflight baseline | F6 landing 後 |
| --- | --- | --- |
| `node src/scripts/check-page-type-validator.js` | 82 / 0 | **89 passed / 0 failed** |
| `npm run validate:content` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| `npm run report:validation` | 0 / 133 / 105 | **0 / 133 / 105**（不變） |
| overlay（`validate-content.js --registry-overlay …`） | 0 / 140 / 106 | **0 / 140 / 106**（不變） |
| `validate:content` 中 `downloadFunnel` 觸發數 | 0 | **0** |

→ harness pass 82→89（+7 新；19 既有 case 補 robots-safe 訊號以維持斷言）、failed 維持 0；production / report / overlay 全部 byte-identical 不變。

---

## 6. warning-only / no value echo / no production trigger（聲明）

- **warning-only**：rule severity `'warning'`（harness `pageIssues` 對所有 `downloadFunnel-*` issue 斷言 warning）。
- **no value echo**：message 為固定字串 + robots enum（`index, follow`），不含 `targetGatedPage` / `entryPages` / URL / slug / token / Drive ID / Form URL / respondent data；harness test 88 以 `example.com` placeholder 鎖定。
- **no production trigger**：無 production / fixture post 含 `downloadFunnel` → rule 0 觸發；validate:content 維持 0/133/105。
- **no indexing decision change**：rule 只**讀** `resolvePostDetailRobots` 結果告警，**不**改 robots / sitemap / listings / build 行為，§4.7 安全優先順序不變。

---

## 7. Deferred items（本 phase 不做；各須獨立 phase + Dean explicit approval）

- §5.3 secret heuristic（`target-gated-page-private-secret` / `entry-pages-private-secret`）
- bidirectional cross-file consistency
- ctaEventName / GA4 normalization
- `.md` fixture 補齊
- live funnel
- Google Form / Drive integration
- GA4 backend write
- Admin write path
- deployed robots verification（線上 `<meta robots>` / generated HTML）
- build / deploy / repost
- Blogger robots 維度（後台手動）

---

## 8. 未觸碰紅線（明確聲明）

- ❌ 未改 content `.md` / 未新增 production fixture / 未改 settings。
- ❌ 未改 `package.json` / lockfile / CLAUDE.md / MEMORY.md / `dist*` / gh-pages / `.cache` / generated HTML。
- ❌ 未碰 Blogger live / Google Form / Google Drive / GA4 backend / AdSense / Search Console / Admin write path。
- ❌ 未 build / deploy / repost / dev server。
- ❌ warning message 未 echo 任何 URL / slug / token / Drive ID / Form URL / respondent data；harness sample 全 placeholder。
- ❌ 未改 indexing decision、未鬆動 noindex / sitemap / listings safety；rule 只讀 effective robots 告警。
- ❌ 未讀取 live Blogger / Form / Drive / GA4 backend；未做 deployed HTML / live robots meta 檢查。
- ❌ 未推進 §5.3 secret heuristic / bidirectional / ctaEventName / .md fixture。

---

## 9. Cross-links

- `docs/20260625-funnel-metadata-schema-validator-slice5-robots-safety-preflight.md`（F6 preflight；建議來源）
- `docs/20260625-funnel-metadata-schema-validator-slice4-role-policy-landing-record.md`（F5）
- `src/scripts/page-type-robots.js`（`resolvePostDetailRobots` 重用來源）
- `src/scripts/check-page-type-robots.js`（robots smoke pattern）
- `docs/seo-indexing-rules.md`（SEO indexing 規則總則）
- `CLAUDE.md` §7 / §11 / §13 / §16 / §21

（本文件結束）
