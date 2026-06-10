# Commerce Ref / Renderer Resolver — R2 Regression Fixture Checkpoint

> **Phase**: `20260610-pm-1-commerce-ref-renderer-regression-fixture-a`
> **Mode**: **R2 regression fixture only**。新增持久 smoke script 鎖住 R1 resolver 行為 + 驗證 validator C1–C9 與 resolver 不矛盾。**不**做 production content migration、**不**改 registry、**不** deploy、**不**啟用 KOBO excluded entry、**不**自行開始 R3/R4。
> **Created**: 2026-06-10 +0800（12:01 起始）
> **Baseline**: HEAD = origin/main = `c8578dc` / clean / normal 0/69/59 / overlay direct-node 0/70/59 / registry 10 active / 0 held / 1 excluded（KOBO）/ R1 resolver live but production 0 用 ref / 0 render affiliate box。
> **Predecessor**: `docs/20260610-commerce-renderer-ref-resolver-implementation.md`（R1）、`docs/20260610-commerce-renderer-ref-migration-preanalysis.md`（R1–R4 切分）。

---

## 1. Implementation approach

採 **Option A（持久 smoke script）**。repo 既有慣例佐證：`src/scripts/smoke-reverse-utm.js`（`node:assert` strict、in-memory、`node <script>` 執行、exit≠0 = 失敗）+ `src/scripts/check-broken-links.js` / `check-image-links.js`（check-* 讀 content 慣例）。

| 檔案 | 變更 | 說明 |
| --- | --- | --- |
| `src/scripts/check-commerce-affiliate-resolver.js` | **新增** | deterministic smoke harness；import `deriveRenderedAffiliateLinks` + `buildActiveCommerceLinkEntryMap`（from `resolve-affiliate-links.js`）；zero new dependency（`node:assert` / `node:fs` / `node:url`）；exit 0 全 pass / exit 1 任一 fail。 |
| `docs/20260610-commerce-ref-renderer-regression-fixture.md` | **新增** | 本 checkpoint。 |

**未改**：`resolve-affiliate-links.js`（smoke 未暴露 bug）、`build-github.js` / `build-blogger.js` / 2 EJS（未暴露 R1 bug）、`validate-content.js`（預設不改；validator 未 export commerce helper，本 harness 以 inline 重建 C3/C4 linkId-gate）、`content/settings/commerce-links.json`、production posts、`content/validation-fixtures/**`（無新增 validation fixture → normal/overlay baseline 不漂移）、`package.json` / lockfile、`dist` / gh-pages。

> **採 Option A 而非 C（validation fixture）之理由**：smoke script 可直接 assert resolver function 之回傳值（url 逐字 / omit / no-leak），比 content fixture 經 validator 間接觀察更精準，且**完全不動 normal/overlay baseline**（維持 0/69/59 + 0/70/59），符合「預設不要新增 validator rule / 不讓 baseline 漂移」。

---

## 2. Smoke cases and results（`node src/scripts/check-commerce-affiliate-resolver.js` → **14 passed / 0 failed / exit 0**）

### Section 1 — in-memory deterministic locks（registry-independent）

| # | case | 鎖住行為 | 結果 |
| --- | --- | --- | --- |
| 1 | raw-url-only | url 原樣輸出（label/network pass-through） | ✅ |
| 2 | url + ref 並存 | **url wins**（ref 不改寫既有 url） | ✅ |
| 3 | ref-only active | url = `targetUrl` **逐字**（含 `uid1=blog`）；label fallback = `displayLabel`；無 internalLabel 洩漏 | ✅ |
| 3b | ref + 文章端 label | 文章端 label 勝；url 仍 targetUrl | ✅ |
| 4a | not-found ref | omit（不 fabricate） | ✅ |
| 4b | inactive ref（`active:false`） | omit | ✅ |
| 4c | malformed ref（非字串 / 空 / null / 空白） | omit | ✅ |
| 5 | 無安全 label（只有 internalLabel） | omit + **無 internalLabel 洩漏** | ✅ |
| 6 | empty links | `[]` | ✅ |
| 7 | active entry 缺 targetUrl | omit | ✅ |
| 8 | mixed batch（raw + invalid-ref + active-ref） | 保留 raw + active（順序維持），omit invalid | ✅ |

### Section 2 — registry-coupled invariants（讀真實 `commerce-links.json`，read-only）

| # | case | 鎖住行為 | 結果 |
| --- | --- | --- | --- |
| 9 | 每個 active registry entry | ref → 恰 1 link，url === entry.`targetUrl` 逐字（uid1=blog 保留），url 非空 | ✅（10 active 全通過）|
| 10 | validator C3/C4 gate ↔ resolver | clean active ref → render；inactive ref（C4）→ omit | ✅ |
| 11 | KOBO 金石堂電子書 excluded | `book-rouhou-time-kingstone-ebook-books` 不在 registry idSet / 不在 active map → ref → omit（validator C3 not-found） | ✅ |

**safety assertions（貫穿所有 case）**：每個 output link 之 `url` 為非空 string、**絕不** `"undefined"` / `""`、**絕不**等於 ref 字串（ref 不被當 href）；output JSON **絕不**含 internalLabel。

---

## 3. Validator / resolver consistency result

validator（`validate-content.js`）C1–C9 content-ref rules 與 R1 resolver（`resolve-affiliate-links.js`）之分類契約**一致、不矛盾**：

| ref 情境 | validator C-rule（warning-only） | resolver 行為 | 一致？ |
| --- | --- | --- | --- |
| ref 命中 **active** entry | 無 C3 / 無 C4（clean）| render（url = targetUrl）| ✅ case 9/10 |
| ref 命中 **inactive** entry（active:false）| C4 commerce-ref-inactive | omit | ✅ case 4b/10 |
| ref **not-found**（含 KOBO excluded）| C3 commerce-ref-not-found | omit | ✅ case 4a/11 |
| ref 非字串 | C1 commerce-ref-invalid-type | omit | ✅ case 4c |
| ref 空 / 空白 | C2 commerce-ref-empty | omit | ✅ case 4c |
| ref + raw url 並存 | C6 commerce-ref-direct-url-coexist（提示移除 url）| url wins（backward-compatible）| ✅ case 2/8（C6 為過渡提示，warning-only；resolver 保留 url 不破壞既有輸出）|

> validator C3/C4 之 linkId-gate（idSet 含 inactive；C3 = 不在 idSet；C4 = 在 idSet 但 active:false）於 harness 以 inline 重建（validator 未 export helper；**未改** validator）。harness 對真實 registry 之每個 entry 交叉驗證 validator 分類 ↔ resolver 行為。

**結論**：validator 允許之 ref-only active entry，renderer 必能安全 render；validator warning 之 invalid / not-found / inactive ref，renderer 必 omit。**無矛盾；R1 未暴露 bug**（resolver / build / EJS / validator 皆未改）。

---

## 4. Mutation scope / 紅線

- ✅ 僅新增 1 smoke script + 1 docs checkpoint。
- ❌ 零 registry / production posts / templates / validation-fixtures / resolver / build / EJS / validator / package / lockfile / dist / gh-pages 變更。
- ❌ normal validate **0/69/59** + overlay **0/70/59** 不漂移（未新增 validation fixture）。
- ❌ 未做 raw URL → ref migration（R3）；未 build/deploy/Blogger repost（R4）。
- ❌ KOBO / 金石堂電子書 excluded entry 未啟用（case 11 鎖住其不可 resolve）。
- ❌ reverse UTM dormant / pm-26 deploy gate BLOCKED。

---

## 5. Next safe phase（**不自動啟動**；各須 explicit approval）

- **R3**：production content migration（raw url → ref；前置 gate = R1 + R2 accepted；首批 `we-media-myself2.md` 2 筆；href 逐字 = registry targetUrl 含 `uid1=blog`；migration 後 re-run 本 smoke + validate）。
- **R4**：build / deploy / Blogger repost gate（前置 = R1+R2+R3 + user deploy 核准；涉外不可逆，mirror pm-26）。

---

*（本文件結束 — R2 regression fixture；持久 smoke script 14/14 PASS；validator C1–C9 ↔ resolver 一致；normal 0/69/59 + overlay 0/70/59 不變；無 posts / registry / deploy 變更；KOBO excluded 鎖住不可 resolve。）*
