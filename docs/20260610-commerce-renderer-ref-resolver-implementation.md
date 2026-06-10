# Commerce Renderer Ref Resolver — R1 Source Implementation Checkpoint

> **Phase**: `20260610-am-6-commerce-renderer-ref-resolver-source-implementation-a`
> **Mode**: **R1 source implementation only**。新增 resolver helper + 接線 build pipeline + 2 EJS 改讀 resolved links。**不**改 production posts、**不**做 raw URL → ref migration、**不**改 registry、**不** deploy、**不**啟用 KOBO excluded entry、**不**自行開始 R2/R3/R4。
> **Created**: 2026-06-10 +0800（11:49 起始）
> **Baseline**: HEAD = origin/main = `e2c3eaa` / clean / normal 0/69/59 / overlay direct-node 0/70/59 / registry 10 active / 0 held / 1 excluded（KOBO）。
> **Predecessor**: `docs/20260610-commerce-renderer-ref-migration-preanalysis.md`（R1–R4 切分；本 phase = R1）。

---

## 1. Implementation summary

| 檔案 | 變更 | 說明 |
| --- | --- | --- |
| `src/scripts/resolve-affiliate-links.js` | **新增** | side-effect-free pure helper module；GitHub 與 Blogger 兩 render path 共用（避免邏輯分裂）。export `deriveRenderedAffiliateLinks(affiliate, commerceLinks)` + `buildActiveCommerceLinkEntryMap(commerceLinks)`。 |
| `src/scripts/build-github.js` | import + post loop 算 `affiliateLinksRendered` + 傳入 post-detail.ejs data | mirror 既有 `deriveRenderedDownloadLanding` / `deriveRenderedCrossLinks` 之 derived-data pattern。 |
| `src/scripts/build-blogger.js` | import + `renderFullPost` 算 `affiliateLinksRendered` + 傳入 blogger-post-full.ejs data | 同上；只 full post render path（summary / redirect-card / index 不渲染 affiliate）。 |
| `src/views/pages/post-detail.ejs` | top / bottom affiliate guard + `forEach` 改讀 `affiliateLinksRendered` | `enabled` / `position` guard 仍讀 `post.affiliate`；markup / class / GA4 inline attrs 不變。 |
| `src/views/blogger/blogger-post-full.ejs` | 同上 | markup / class 不變（Blogger 端無 GA4 inline attrs）。 |
| `docs/20260610-commerce-renderer-ref-resolver-implementation.md` | **新增** | 本 checkpoint。 |

**未改**：`content/settings/commerce-links.json`、`content/**/*.md`（含 production posts / templates / fixtures）、`src/scripts/validate-content.js`（validator 行為不變，未共用 helper）、`src/scripts/load-settings.js`、`package.json` / lockfile、`dist` / `dist-blogger` / gh-pages（build artifacts 皆 gitignored）。

---

## 2. Resolver behavior（`deriveRenderedAffiliateLinks`）

逐 link 解析（回傳 array，永不 null；每 element 至少 `{ label, network, url }`，`url` 保證非空 string）：

1. **url-backward-compatible-first**：link 若有非空 `url`（string）→ **逐字保留既有 url**（不因 ref 存在而改寫、不 canonicalize、不重組、不刪 `uid1=blog`）；`label` / `network` 原樣 pass-through → 既有 raw-url 輸出 byte-identical。
2. **ref-only**（無可用 url）：
   - `ref` 非 string / `undefined` → **omit**（malformed）。
   - `ref` trim 後空 → **omit**。
   - `ref` 命中 **active** registry entry（`buildActiveCommerceLinkEntryMap`：`active===false` 已排除；KOBO excluded 根本不在 registry）→ `url = entry.targetUrl`（**逐字**，保留 affiliate redirect 與 `uid1=blog`）。
   - 命中 entry 但 `targetUrl` 缺 / 空 → **omit**（不 fabricate）。
   - not-found / inactive → **omit**（`entryMap.get` 回 undefined）。
3. **label safety**：文章端 `label` 非空 → 用文章端 label；否則僅在 entry 有安全公開 `displayLabel` 時 fallback；**皆無 → omit**（**絕不**輸出 `internalLabel` / `targetUrl` 以外之 registry audit-only 欄位 / tracking token 到 HTML）。
4. **network badge**：僅用文章端 `network`（公開顯示）；無則省略 badge（**不**從 `networkKey` / `merchant` / `internalLabel` 派生）。

> **⚠️ 與 preanalysis §B.5 之 refinement**：preanalysis 原述 coexist（ref+url 並存）時「以 registry ref→targetUrl 為唯一真實來源（ignore raw url）」。本 R1 spec 明確採 **url-backward-compatible-first**（既有 url 優先、ref 不改寫 url），以保證既有文章輸出 byte-identical。validator C6 `commerce-ref-direct-url-coexist`（warning-only，**未改**）仍提示作者於 migration 完成後移除 raw url；resolver 在過渡期 url+ref 並存時保留 url。ref-priority 留待 R3 migration（移除 url 後文章自然走 ref path）。

EJS 端只做最小防呆：guard 用 `Array.isArray(affiliateLinksRendered)`（undefined 時安全回 false），`forEach` 僅在 guard 通過後執行（element 之 `url` 已保證非空）→ 不產生 `href="undefined"` / `href=""` / 不把 ref 字串當 href。

---

## 3. Acceptance results

### A. Validation
- `npm run validate:content` = **0 errors / 69 warnings / 59 posts**（baseline 不變）。
- `node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json` = **0 errors / 70 warnings / 59 posts**（baseline 不變）。

### B. Backward compatibility
- 既有 affiliate 行為不變：production **0 篇** render affiliate box（`we-media-myself2.md` `enabled:false`；sample / draft `links:[]`）→ 與改前一致。
- `we-media-myself2.md` **未被 migration**；`enabled:false` 現況**未改**為 true。
- 生成 `dist-blogger/posts/we-media-myself2/post.html` 含 **0** 個 `lab-affiliate-box`、**0** 個 raw affiliate url（enabled guard 擋下，同改前）。
- 全 build output（`dist-blogger` + `.cache`）`href="undefined"` = **0**。
- `lab-affiliate-box` 在 output 僅 3 處 = 2 CSS theme 檔（class 定義）+ design-system demo 頁（hardcoded，未經 resolver）→ 與本變更無關、未受影響。

### C. Ref smoke test（in-memory；**未改 production posts**）
臨時 `tmp-affiliate-smoke.mjs`（執行後刪除）以 helper + 真實 registry 跑 10 case，全 PASS：
1. raw-url-only → url 原樣輸出 ✅
2. ref（`book-rouhou-time-books-com-tw-physical-books`）→ `url === entry.targetUrl === https://whitehippo.net/3QWBP?uid1=blog`（含 `uid1=blog`），label fallback = `displayLabel` ✅
   2b. ref + 文章端 label → 文章端 label 勝，url 仍 targetUrl ✅
3. not-found ref → omit ✅；KOBO excluded（`book-rouhou-time-kingstone-ebook-books`）→ omit ✅；malformed（非字串 / 空 / null）→ omit ✅；inactive（in-memory `active:false`）→ omit ✅
4. 無安全 label（registry 只有 `internalLabel`）→ omit 且 output **無** internalLabel 洩漏 ✅
5. empty links → `[]` ✅
6. url+ref 並存 → url 勝（url-backward-compatible-first）✅

### D. Output diff
- build artifacts（`dist` / `dist-blogger` / `.cache`）皆 gitignored → `git status` 無 tracked drift。
- `git diff --name-status` 僅 allowed source / docs（見 §1）；無 registry / posts / package / lockfile / dist / gh-pages 變更。

---

## 4. Mutation scope / 紅線

- ✅ 僅 allowed source（4 檔）+ 1 新 helper + 1 docs checkpoint。
- ❌ 零 registry / production posts / templates / fixtures / validator / package / lockfile / dist / gh-pages 變更。
- ❌ 未做 raw URL → ref migration（R3）；未建 validator fixture（R2）；未 build/deploy/Blogger repost（R4）。
- ❌ KOBO / 金石堂電子書 excluded entry 未啟用（resolver 對其 ref 必 omit）。
- ❌ reverse UTM dormant / pm-26 deploy gate BLOCKED；GA4 event schema 未改。

---

## 5. Next safe phase（**不自動啟動**；各須 explicit approval）

- **R2**：validator rule 補強 / resolver-coupled fixture（證明 ref→targetUrl + inactive omit；預設不新增 rule）。
- **R3**：production content migration（raw url → ref；前置 gate = R1 accepted；首批 `we-media-myself2.md` 2 筆；href 逐字 = registry targetUrl 含 `uid1=blog`）。
- **R4**：build / deploy / Blogger repost gate（前置 = R1+R3 + user deploy 核准；涉外不可逆，mirror pm-26）。

---

*（本文件結束 — R1 renderer ref resolver source implementation；backward-compatible；validate 0/69/59 + overlay 0/70/59 不變；無 posts / registry / deploy 變更；KOBO excluded 未啟用。）*
