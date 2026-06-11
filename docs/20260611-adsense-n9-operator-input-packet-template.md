# AdSense N9 Operator Input Packet — Template

> ⚠️ **本文件是 template，不是 N9 execution。** 不含真實 AdSense id，不 deploy，不改 Blogger。
> operator / 維護者未來會在此填入 real client id 與 slot id —— 但**填寫真實值時不得 commit 真實值進 repo**（見 §I Red lines）。
> 本 phase（`9-operator-input-packet-docs-only-a`）只建立空白 template，**所有欄位皆 placeholder**。

---

## A. Purpose

- 整理「真正啟用 AdSense 六區塊（N9）前，人需要提供哪些資訊、填在哪裡、依什麼順序驗收、出錯如何 rollback」。
- 作為 operator 填寫的**輸入包 template**：先把決策與 placeholder 欄位列清楚，未來啟用時照表填 + 照 §F 順序執行。
- **不是** N9 execution：本文件不含真實 AdSense publisher / client / slot id，不觸發 deploy，不改 Blogger。

---

## B. Current Accepted Baseline

- accepted N8 commit：`b6dfb9b`（`docs(adsense): accept n8 anchor wiring readiness`；其驗收對象為 source commit `4b332d7 feat(adsense): wire six article ad anchors`）
- normal validate baseline：`0 errors / 94 warnings / 84 posts`
- `content/settings/ads.config.json` 現況（**全 placeholder / disabled**）：
  - `enabled: false`
  - `adsenseClient: ""`
  - `loader.blogger: "theme"`、`loader.pages: "head"`
  - `slots`: `postTop` / `postMiddle` / `postBottom` / `sidebar` / `homeInline` / `articleAd1`..`articleAd6` 皆 `""`
  - `defaults.blocks: []`

### N8 source path summary（GitHub Pages，surface=`pages`；已 live-accepted）

```
adsense.blocks[]（post frontmatter）+ ads.config.json（enabled / adsenseClient / slots）
  -> resolve-adsense-blocks.js : deriveRenderedAdsenseBlocks(post, settings.ads, 'pages')
  -> build-github.js : adsenseBlocksRendered
  -> post-detail.ejs : 14 anchor include points（_adsAnchors[anchor]）
  -> adsense-anchor.ejs（per anchor，逐 block）
  -> adsense-article-block.ejs（per block，有 slotKey 才委派）
  -> adsense-slot.ejs（3-gate：enabled + adsenseClient + slots[slotKey] → <ins class="adsbygoogle lab-ad-slot lab-ad-slot--<slotKey>"> + push script）
```

### Disabled / missing-config no-op safety gates

| 條件 | 行為 |
|---|---|
| `ads.enabled !== true` | resolver 回 `{}` → 全 anchor 零輸出 |
| `ads.adsenseClient` 空 | resolver 回 `{}` → 全 anchor 零輸出 |
| `ads.slots[slotKey]` 空 | resolver omit 該 block → 該 anchor 零輸出（其餘 slot 不受影響） |
| post 無 `adsense` / `blocks` 非陣列或空 | resolver 回 `{}` → 全 anchor 零輸出 |
| block `enabled === false` / `surfaces` 不含當前 surface / `anchor` 不在 14 enum | resolver skip 該 block |
| blocks 非陣列 / 空 傳入 partial | `adsense-anchor.ejs` 整檔零輸出 |

current production（`enabled:false`）→ 第一列 → 所有 post 之所有 anchor 永遠零輸出（zero-byte / byte-identical）。

---

## C. Required Operator Inputs

> 填寫規則：**只填 placeholder 或決策值；真實 client / slot id 不得寫進本文件、不得 commit。** 真實值的安全存放見 §F step 1 與 §I。

| # | 輸入項 | 值（placeholder / 決策） | 備註 |
|---|---|---|---|
| C1 | `ads.enabled` 啟用決策 | `true` / `false`（待填） | N9 啟用時改 `true`；rollback 時改回 `false` |
| C2 | AdSense client id | `ca-pub-XXXXXXXXXXXXXXXX`（placeholder） | **真實值不入 repo**；安全注入見 §F1 |
| C3 | `articleAd1` slot id | `<ARTICLE_AD1_SLOT_ID>`（placeholder） | AdSense 後台 ad unit slot id |
| C4 | `articleAd2` slot id | `<ARTICLE_AD2_SLOT_ID>`（placeholder） | 同上 |
| C5 | `articleAd3` slot id | `<ARTICLE_AD3_SLOT_ID>`（placeholder） | 同上 |
| C6 | `articleAd4` slot id | `<ARTICLE_AD4_SLOT_ID>`（placeholder） | 同上 |
| C7 | `articleAd5` slot id | `<ARTICLE_AD5_SLOT_ID>`（placeholder） | 同上 |
| C8 | `articleAd6` slot id | `<ARTICLE_AD6_SLOT_ID>`（placeholder） | 同上 |
| C9 | 每個 slot displayName / purpose | 待填（見 §D 表 placement meaning 欄） | 例：文章頂部 / 書評後 / 內文末 等 |
| C10 | 每個 slot anchor policy | 待填（見 §D 表 intended anchor 欄） | 須取自 §E 之 14 v1 anchor enum，不得自創 |
| C11 | 是否先 staging / local preview | `yes` / `no`（待填） | 建議 `yes`：local 先驗 markup 結構 |
| C12 | deploy approver | 待填（人名 / 角色） | 核可 GitHub Pages deploy 之人 |
| C13 | rollback approver | 待填（人名 / 角色） | 核可 rollback 之人（可同 C12） |

附帶決策（非 slot 專屬，但 N9 須確認）：

- `loader.blogger` 三選一（`theme` / `article` / `none`）：現為 `theme`。須確認 Blogger 後台 theme 是否已含 `adsbygoogle.js` loader（避免重複載入違規）。**屬 N9-Blogger 範圍，GitHub Pages N9 不需要。**
- `loader.pages`：現為 `head`（GitHub Pages head loader 已 wired）。
- `defaults.blocks[]`：現為 `[]`。是否啟用全站預設組合（N6b deferred）或一律 per-article 手填 `adsense.blocks[]`，待 C10 policy 決定。

---

## D. Six Slot Policy Table

> `slotKey` 必須是 `articleAd1`..`articleAd6`（對齊 `ads.config.json` 既有 key，不得自創）。
> `intended anchor` 必須取自 §E 之 14 v1 anchor enum。
> 以下 `intended anchor` / `placement meaning` / `default enabled?` 為**待 operator 決策之 placeholder**；下表填的是「建議起點」，最終以 operator 決策為準（參考 night-4 §7.5 建議組合，屬建議非定案）。

| slotKey | intended anchor（待決策） | placement meaning（待決策） | required slot id（placeholder） | default enabled?（待決策） | notes / risk |
|---|---|---|---|---|---|
| `articleAd1` | `afterHeader`（建議） | 文章標題 / meta 後、正文前 | `<ARTICLE_AD1_SLOT_ID>` | 待填 | 最高曝光位；注意勿與既有 legacy `adsenseTop` 重疊 |
| `articleAd2` | `afterCover` 或 `afterBookPhoto`（待決策） | 封面 / 書照後 | `<ARTICLE_AD2_SLOT_ID>` | 待填 | `afterCover` 為 Pages-only；書評文用 `afterBookPhoto` |
| `articleAd3` | `afterAffiliateTop` 或 `afterDownloadBox`（待決策） | 上方販售 / 下載框後 | `<ARTICLE_AD3_SLOT_ID>` | 待填 | 視 contentKind（書評 vs 教具下載）而異 |
| `articleAd4` | `beforeAffiliateBottom` 或 `beforeRelatedLinks`（待決策） | 內文末、相關連結前 | `<ARTICLE_AD4_SLOT_ID>` | 待填 | 勿與 affiliate bottom box 視覺打架 |
| `articleAd5` | `beforeRelatedLinks` 或 `beforeOtherLinks`（待決策） | 相關 / 其他連結前 | `<ARTICLE_AD5_SLOT_ID>` | 待填 | 與 C/articleAd4 anchor 勿重複 |
| `articleAd6` | `beforeHashtags`（建議） | hashtags 前、文章底部 | `<ARTICLE_AD6_SLOT_ID>` | 待填 | 注意勿與既有 legacy `adsenseBottom` 重疊 |

> 風險共通項：6 個版位同時開啟可能過密（AdSense 政策對廣告/內容比例有要求）；建議 operator 評估 per-contentKind 開啟子集，而非一律 6 個全開。

---

## E. 14 v1 Anchors Reference

> 取自 `src/scripts/resolve-adsense-blocks.js` 之 `VALID_ADSENSE_ANCHOR`（與 `validate-content.js` 之 enum 同源）+ `src/views/pages/post-detail.ejs` 之 include 順序。**不得自創新 anchor。** mid-body anchor（`afterIntro` / `inArticle` 等）per night-4 §7.3 為 v2 deferred，不在此列。

post-detail.ejs document order（= resolver enum 內容，順序對齊區塊流）：

| # | anchor | 位置 |
|---|---|---|
| 1 | `afterHeader` | article header 後 |
| 2 | `afterCover` | cover image 後（Pages-only） |
| 3 | `afterBookPhoto` | book photo 後 |
| 4 | `afterAffiliateTop` | affiliate top box 後 |
| 5 | `beforeDownloadBox` | body 後 / download box 前 |
| 6 | `afterDownloadBox` | download box 後 |
| 7 | `beforeAffiliateBottom` | download landing 後 / affiliate bottom 前 |
| 8 | `afterAffiliateBottom` | affiliate bottom box 後 |
| 9 | `beforeRelatedLinks` | related links 前 |
| 10 | `afterRelatedLinks` | related links 後 |
| 11 | `beforeOtherLinks` | other links 前 |
| 12 | `afterOtherLinks` | other links 後 |
| 13 | `beforeHashtags` | hashtags 前 |
| 14 | `afterHashtags` | hashtags 後 |

---

## F. Proposed N9 Execution Order（計畫，不執行）

> 本 phase **不執行**以下任何一步；僅記錄順序。

1. **填寫 real client / slot id 到安全的 settings 路徑**
   - 真實值**不得**直接寫入 committed `ads.config.json` 後 push。安全機制三選一（待 operator 選定）：
     (a) build 時環境變數注入；(b) git-ignored local override settings 檔；(c) deploy 前於 working tree 暫填 `ads.config.json`、build/deploy 後立即還原為 placeholder（不 commit 真實值）。
2. **local validate**：`npm run validate:content`（須維持 0 errors）
3. **smoke check**：`npm run check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring`（全綠）
4. **build**：`npm run build:github`
5. **grep 確認只出現預期 client / slot**：build output 應僅含本次 operator 填入之 client / slot id，無其他 / 無殘留 placeholder leak
6. **local preview**（若 C11 = yes）：`npm run dev` 檢視實際版位 markup / 不破版
7. **commit production config**：僅在採安全機制允許時 commit（若採 (a)/(b)，committed config 仍為 placeholder；真實值不入 repo）
8. **deploy GitHub Pages**：依既有 deploy 流程 push gh-pages（須 C12 approver 核可；不得繞過既有 pm-26 deploy gate）
9. **Blogger update / repost decision**：屬 N9-Blogger（須先完成 N9 Blogger source wiring + `loader.blogger` 決策）；本 GitHub Pages N9 可不含
10. **post-deploy verification**：線上 GA4 / AdSense 後台確認版位載入；§G commands 線上抽查
11. **rollback plan**：見 §H（若任一步失敗）

---

## G. N9 Acceptance Commands

> 本 phase 只跑 `npm run validate:content`；以下為**未來 N9** 應跑清單（記錄用）。

- `npm run validate:content`
- `npm run check:adsense-resolver`
- `npm run check:adsense-article-block`
- `npm run check:adsense-anchor-wiring`
- `npm run build:github`
- build output grep：確認 `adsbygoogle` / `ca-pub` / `data-ad-slot` / `data-ad-client`
  - **disabled 時**應為 0 matches
  - **enabled 時**應僅出現本次 operator 填入之 client / slot id（無未預期值）

---

## H. Rollback Plan

1. **revert production config**：
   - 最快：`ads.config.json` `enabled` 改回 `false`（無需 revert source；下次 build 全 anchor 即回 zero-byte）。
   - 若曾誤 commit 真實值：`git revert` 該 config commit，並依 §I 處理洩漏（視為 secret 洩漏，須輪換 AdSense slot / 評估影響）。
2. **rebuild**：`npm run build:github`
3. **redeploy**：重新 push gh-pages（須 C13 rollback approver 核可）
4. **Blogger rollback / repost policy**（若已重貼 Blogger）：Blogger 無自動 rollback；須手動把文章 HTML 還原為重貼前版本 → **重貼前務必備份原文章 HTML**（mirror commerce repost preflight 之備份要求）。
5. **verify no ad markup remains if disabled**：rollback 後 build output grep `adsbygoogle` / `ca-pub` / `data-ad-slot` / `data-ad-client` → 應為 0 matches。

---

## I. Red Lines

- ❌ 不在 docs（含本文件）保存 real slot id / real client id。
- ❌ 不在 CLAUDE.md 保存 real slot id / real client id。
- ❌ 不把 secret / private note（AdSense 帳號 email / 密碼 / OAuth secret / API key / 後台統計）commit 進 repo。
- ❌ 不在 source hardcode real id（client / slot id 一律走 `ads.config.json` settings，且真實值依 §F1 安全機制注入）。
- ❌ 不跳過 disabled no-op check（每次變更須確認 disabled 時 build output 0 ad markup）。
- ❌ 不直接 deploy 未驗證 output（須先 §F2~§F6 通過）。
- ❌ 不用 URL / pattern 自動推斷 client / slot id；全部由 operator 明示填寫。

---

## J. 明確聲明

- 本文件 = **N9 operator input packet template**，非 N9 execution。
- 所有欄位皆 placeholder；**不含真實 AdSense id**。
- 不 deploy、不 push gh-pages、不改 Blogger、不改 source / settings / post frontmatter / production content。
- N9 須待 §C 輸入由 operator 填齊 + §F 順序逐步驗收後另開 phase。
