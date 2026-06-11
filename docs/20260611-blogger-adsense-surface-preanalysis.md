# Blogger AdSense Surface Preanalysis

Phase: `20260611-pm-3-blogger-adsense-surface-preanalysis-docs-a`
Status: **docs-only preanalysis / no implementation**
Date: 2026-06-11 12:37 +0800

> ⚠️ 本文件**不含** real AdSense client / slot id。一律以 masked（如 client `ca-pub-…3759`）、`slotKey`、`anchor`、`articleAd1`..`articleAd6` 表述。real id **僅**存於 `content/settings/ads.config.json`。
>
> 本文件為**純分析**：不改任何 source / config / content / template / src，不 build / deploy / push / 重貼 Blogger，不碰 AdSense 後台，不啟動任何 implementation。唯一變更 = 新增本檔。

---

## 1. Title / phase

- title：Blogger AdSense Surface Preanalysis
- phase：`20260611-pm-3-blogger-adsense-surface-preanalysis-docs-a`
- status：docs-only preanalysis / no implementation

---

## 2. Current baseline

| 項目 | 值 |
|---|---|
| HEAD at start | `258d305` |
| origin/main | `258d305` |
| branch | `main` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(readme): sync post-n9 baseline` |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts** |
| `npm run check:adsense-resolver` | **33 passed / 0 failed** |
| AdSense N9 GitHub Pages | **repo-side CLOSED / PASS**；GitHub Pages article ads 已 live |
| Blogger AdSense surface | **尚未進入**（dormant；本文件僅分析，未啟動） |

baseline 數值於本 phase 實跑取得。

---

## 3. Current AdSense architecture summary

僅根據本 phase 實際讀到之 source / config / test 記錄，不捏造。

### 3.1 `content/settings/ads.config.json` 現況

- `enabled: true`（master switch；N9e 起正式 enable）。
- `adsenseClient`：present 非空（masked `ca-pub-…3759`；real id 僅存 config）。
- `loader`：`{ blogger: "theme", pages: "head" }`。**pages** 走 per-page `<head>` loader 注入；**blogger** 走 `"theme"`（loader 由 Blogger 主題端負責，非 per-post head 注入）。
- `slots`：11 keys —— 5 retained legacy（`postTop` / `postMiddle` / `postBottom` / `sidebar` / `homeInline`，目前皆空字串）+ 6 article slots（`articleAd1`..`articleAd6`，real id present，本文件不列印）。
- `defaults.blocks[]`：**6 blocks**，每 block `surfaces: ["pages"]`、`enabled: true`、`order` 1–6，slotKey→anchor 對映（N9d policy，top→bottom）：
  - `articleAd1` → `afterHeader`
  - `articleAd2` → `afterCover`
  - `articleAd3` → `afterBookPhoto`
  - `articleAd4` → `afterAffiliateTop`
  - `articleAd5` → `beforeAffiliateBottom`
  - `articleAd6` → `beforeRelatedLinks`
- **關鍵：6 個 default blocks 之 `surfaces` 全部僅含 `"pages"`，不含 `"blogger"`。**

### 3.2 resolver（`src/scripts/resolve-adsense-blocks.js`）行為

pure side-effect-free module，`deriveRenderedAdsenseBlocks(post, adsSettings, surface)` → grouped-by-anchor map（或 `{}`）。gating chain（任一不過 → no-op / 跳過該 block）：

1. **全域 gate**：`surface` 須為 `'blogger'` | `'pages'`（其他 → `{}`）→ `adsSettings` 須 plain object → `adsSettings.enabled === true`（嚴格）→ `adsenseClient` 非空 string → `slots` 須 plain object → `post` 須 plain object。
2. **post 全關**：`post.adsense.enabled === false` → `{}`（連 site default 也壓制）。
3. **block source 優先序**：`post.adsense.blocks`（非空 array）→ 否則 `adsSettings.defaults.blocks[]` → 否則 `{}`。
4. **per-block gate**：block 須 object → `enabled !== false` → **surface gate**（`surfaces` 省略＝兩端都 render；array＝須含當前 surface；非 array＝跳過）→ `anchor` 須在 v1 enum（14 個 block-edge anchor）→ `slotKey` 非空且存在於 `slots` → `slots[slotKey]` 非空（safe-mode：未發 slot id 之版位不 render）。
5. **輸出**：`{ id?, anchor, slotKey, slotId, client, order? }`；**不**輸出 `surfaces` / `enabled` / `note` / `displayName` / `purpose` / `notes` 等 internal 欄位。
6. legacy `blocks.adsenseTop` / `adsenseBottom` flag 路徑為**獨立既有 EJS 機制**，resolver 完全不涉入。

**對 Blogger surface 之直接後果**：production `defaults.blocks[]` 全 `surfaces: ["pages"]` → 對 `surface='blogger'` 之 surface gate 不過 → 全部跳過 → resolver 對任何 post 回 **`{}`**（resolver test case 21f 已鎖此 invariant）。

### 3.3 build / wiring 現況

- **GitHub Pages**：`build-github.js` 注入 `adsenseBlocksRendered = deriveRenderedAdsenseBlocks(post, settings.ads, 'pages')`；`post-detail.ejs` 14 個 v1 anchor 插入點委派 `adsense-anchor.ejs` → `adsense-article-block.ejs` → `adsense-slot.ejs`。已 live。
- **Blogger**：`build-blogger.js` **完全未 wire adsense resolver**（本 phase grep `deriveRenderedAdsenseBlocks` / `adsenseBlocksRendered` / `adsense` 於 `build-blogger.js` → **無任何 match**）。亦即 Blogger build path 從不呼叫 resolver。
- **結論**：Blogger surface 為「**雙重 dormant**」——（a）`build-blogger.js` 無 resolver 呼叫，且（b）即便呼叫，production policy `surfaces:["pages"]` 仍使 blogger surface 回 `{}`。要啟用須**同時**補上 wiring 與 surface policy 兩者。

### 3.4 現有 test coverage（`src/scripts/check-adsense-resolver.js`，33 cases）

- **Section 1（cases 1–20）**：in-memory deterministic locks —— enabled/client/slot gating、surface gate（9 surfaces 省略＝兩端、10 `['blogger']`、11 `['pages']`、12 `['blogger','pages']`）、anchor enum、unknown slotKey、order 排序、legacy flag 忽略、internal 欄位不洩漏、defensive null/scalar。**注意：多數 case 以 `'blogger'` 作為測試 surface，但餵的是 synthetic settings；非 production Blogger live 路徑。**
- **Section 2（cases 21–22）**：settings-coupled invariants（讀 production `ads.config.json`）。case 21 post-N9e enabled invariant 含 **(f) Blogger surface → `{}`**（pages-only default policy）。case 22 = 11-slot shape。
- **Section 3（case 23）**：14 v1 anchors 全可 resolve。
- **Section 4（cases 24–32）**：default-block resolution（N9b）—— 用 synthetic client/slot 套 production policy 結構，驗證 6 default blocks resolve、post override、post opt-out、empty slot 略過、internal 欄位不洩漏。
- **缺口**：**無**針對「Blogger surface 啟用後」之 production 路徑測試（因尚未存在）；**無** Blogger build wiring 測試（resolver 未接 build-blogger.js）。

---

## 4. Blogger-specific problem statement

為何 Blogger **不能**直接沿用 GitHub Pages 的上線方式：

1. **out-of-repo 操作不可由 repo commit 取代**：GitHub Pages 是 `build → deploy → gh-pages push` 全自動化；Blogger 文章是**手動貼 HTML 到 Blogger 後台**。repo 端改 config / template **不會**自動反映到 Blogger 已發布文章，必須 user 手動重貼，repo commit 無法代勞。
2. **Blogger backend repost 風險**：重貼會覆蓋 Blogger 後台現有文章 HTML。若無備份，原內容（含手動微調 / 既有區塊）可能遺失，且 Blogger 無自動 rollback。
3. **Blogger theme CSS / layout 差異**：Blogger 廣告 loader 走 `loader.blogger:"theme"`（主題端負責 adsbygoogle 載入），與 GitHub Pages 的 per-page head 注入機制不同；Blogger 主題版型、欄寬、既有 CSS 可能與 article ad 區塊衝突或破版，須在 Blogger 平台實貼預覽才能確認（本系統不模擬 Blogger 平台）。
4. **既有 Blogger 區塊共存風險**：Blogger 端已有 legacy top/bottom ad 區塊（EJS legacy `blocks.adsenseTop` / `adsenseBottom` 路徑），且 commerce/affiliate 採「上+下雙區塊」刻意策略。新增 article ads anchor 區塊可能與既有區塊**版位打架 / 重複曝光 / 違反版面密度**。
5. **AdSense policy / crawler / blank inventory 觀察期**：新版位上線後可能出現 blank inventory（無填充）、crawler 延遲、或 policy review。須觀察窗口，不能假設一上線即穩定。
6. **GA4 / 追蹤維度**：Blogger 端 ad 追蹤（若需要）屬新 GA4 dimension，須獨立 phase，不混入 surface 啟用。

---

## 5. Required decisions before implementation

未來若要做實作，**必須由 user 先決定**（本 phase 不替 user 決定）：

1. **是否啟用 Blogger AdSense surface**（go / no-go；Blogger 已有 AdSense 收益，需評估是否值得動既有版面）。
2. **Blogger 使用哪些 `slotKey` / `anchor`**：沿用 GitHub Pages 的 6 個 `articleAd1..6` / N9d anchor，還是 Blogger 採子集 / 不同 anchor（Blogger 版型不同）；是否需要新的 Blogger 專屬 slot。
3. **是否與既有 Blogger legacy top/bottom block + 雙 commerce 區塊共存**，或取代 / 調整版位避免重複。
4. **是否需要先備份 Blogger 文章 / theme**（重貼前的備份策略 + 備份位置）。
5. **試貼範圍**：先選 **1 篇文章 single-post 試貼**，還是全量重貼（強烈傾向 single-post 先行）。
6. **是否需要 GA4 / AdSense 後台觀察窗口**（觀察期長度、判讀 blank inventory / policy warning 的準則）。

---

## 6. Possible implementation phases（僅建議，不執行）

未來若 user 決定啟用，建議拆成數個小 phase，逐步、可回退。**本文件不執行任一。**

### Phase A — repo-only policy/test preanalysis acceptance
- scope：接受本 preanalysis；確認 baseline；不改 source/config。
- files likely touched：docs only（acceptance checkpoint）。
- risk：🟢 無（docs-only）。
- acceptance：`validate:content` 0/94/84 + `check:adsense-resolver` 33/0 不變。
- STOP condition：baseline 不符即停。

### Phase B — ads.config surface policy change + resolver guard update
- scope：在 config 加入 Blogger-surface block policy（例如為選定 block 設 `surfaces` 含 `"blogger"`，或新增 blogger-specific default blocks）；同步更新 resolver smoke（新增 Blogger production-path case）。
- files likely touched：`content/settings/ads.config.json`、`src/scripts/check-adsense-resolver.js`、可能 docs。
- risk：🟡 中（改 production config；但若 Blogger build 尚未 wire resolver〔Phase C 前〕，config 改動本身不產生 Blogger 輸出）。
- acceptance：`check:adsense-resolver` 全綠（含新 Blogger case）；GitHub Pages `pages` surface 輸出**不得改變**（byte-identical）。
- STOP condition：GitHub Pages 輸出有非預期 diff，或 resolver case 失敗。

### Phase C — Blogger export/build dry-run only
- scope：把 resolver wire 進 `build-blogger.js` + Blogger EJS anchor 插入點；**僅本機 build dry-run**，檢查 generated Blogger HTML，不重貼。
- files likely touched：`src/scripts/build-blogger.js`、`src/views/blogger/*.ejs`、可能新增 `check-adsense-blogger-wiring` smoke。
- risk：🟡 中（改 build + template；但限本機 dry-run，不 deploy / 不重貼）。
- acceptance：build:blogger 成功；generated Blogger HTML 出現預期 article ad markup（masked id 檢查）；無 template leak；既有 legacy/commerce 區塊未被破壞；無 real id 進入 docs。
- STOP condition：破版 / 重複區塊 / template leak / 輸出含非預期內容。

### Phase D — single-post Blogger repost with backup and user approval
- scope：選 **1 篇**文章，user 先備份 Blogger 後台原 HTML + theme，再手動重貼新 HTML，Blogger 平台預覽。
- files likely touched：**無 repo 變更**（純 out-of-repo 手動操作）；可能 docs 記錄 published URL。
- risk：🔴 高（out-of-repo；覆蓋 live 文章；無自動 rollback）。
- acceptance：user 在 Blogger 桌機 + 手機預覽確認無破版、廣告區塊正常、既有區塊保留；AdSense 後台無立即 policy 錯誤。
- STOP condition：破版 / 既有內容遺失 / policy 警告 → 立即用備份還原。

### Phase E — observation / rollback checklist
- scope：single-post 上線後觀察窗口；定義 rollback 準則與步驟；判讀是否擴大到更多文章。
- files likely touched：docs only（observation log）。
- risk：🟢 低（觀察 + docs）。
- acceptance：觀察期內無 policy / 破版 / blank-inventory 異常 → 才考慮下一篇；否則 rollback。
- STOP condition：出現 policy / inventory / 破版異常 → rollback + 不擴大。

---

## 7. Red lines

- ❌ **No Blogger repost without explicit user approval**。
- ❌ **No deploy / gh-pages push** in any preanalysis / config phase。
- ❌ **No AdSense backend mutation**（不碰 AdSense 後台設定）。
- ❌ **No real AdSense client / slot id in docs**（一律 masked / `slotKey` / `anchor` / `articleAd1`..`articleAd6`）。
- ❌ **No source / config change in this preanalysis phase**（本 phase 僅新增本 doc）。
- ❌ **No bulk Blogger repost before single-post dry-run / backup**（必須 single-post 先行 + 備份）。
- ❌ **No GA4 new dimension in this phase**（ad 追蹤維度屬另案）。
- ❌ **GitHub Pages `pages` surface 輸出不得因 Blogger 啟用而改變**（任何 Blogger phase 須保 GitHub Pages byte-identical）。

---

## 8. Acceptance checklist for future implementation

未來實作各 phase 之 acceptance（依該 phase 是否動 source / build / repost 取用）：

- `npm run validate:content`（須維持 baseline，當前 0/94/84）。
- `npm run check:adsense-resolver`（須全綠；Phase B 後含新 Blogger production-path case）。
- existing article block / anchor checks（若 package script 存在）：`npm run check:adsense-article-block`、`npm run check:adsense-anchor-wiring`（本 phase 確認兩 script 檔案存在）。
- Blogger build byte/diff checks（Phase C；若有 dry-run diff script）：generated Blogger HTML 對 pre-change snapshot 之 diff 僅限預期 article ad markup；GitHub Pages 輸出 byte-identical。
- single-post generated output inspection（Phase C/D）：masked id 出現、anchor 順序正確、無 template leak、無 real id 入 docs。
- rollback plan（Phase D/E）：備份還原步驟可執行；`ads.config.json` 層級 rollback = surface policy 改回（或 `enabled` 路徑）後 rebuild。
- **live check only after user approval**（Phase D 後）：Blogger 桌機 + 手機預覽，由 user 人工確認。

---

## 9. Final verdict

- 本 phase 為 **docs-only preanalysis**；一經接受即 **PASS**。
- **No repo implementation started**。
- **Blogger AdSense surface remains deferred / user-gated**（雙重 dormant：build-blogger.js 未 wire resolver + production policy `surfaces:["pages"]`）。
- **Recommended next step after this doc**：由 user 決定是否推進 Blogger surface（Phase A→E ladder），或切換到 commerce L2（須 user YAML + approval）/ download migration（須 real safe URL）—— 三者皆 user-gated，不自行啟動。

---

（本文件結束）
