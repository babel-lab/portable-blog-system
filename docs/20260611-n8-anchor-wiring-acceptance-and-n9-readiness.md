# Phase 20260611 — N8 Anchor Wiring Acceptance + N9 Readiness Checkpoint

Status: **docs-only acceptance / N9 readiness**。本文件**不是 N9 執行**，**不含 real slot id**，**不含 deployment**。

本 phase 僅做 read-only / source acceptance + 文件；不改 source / EJS / JS / settings；不 deploy；不碰 Blogger；不填真實 AdSense slot。

---

## 1. Phase / Baseline / Accepted Commit

- Phase name：`n8-anchor-wiring-acceptance-and-n9-readiness-docs-only-a`
- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- accepted commit：`4b332d7 — feat(adsense): wire six article ad anchors`
- HEAD == origin/main == `4b332d7`（`git rev-list --left-right --count HEAD...origin/main` = `0 0`）
- working tree：clean
- normal validate baseline：**0 errors / 94 warnings / 84 posts**（不變）

前序鏈：
- `9218e03` docs（night-4 N4 convention 鎖定 Option B）
- `e832f9f` N5 frontmatter validator（warning-only）
- `5174c2e` N6a settings shape validator
- `a03c659` N7 resolver（`resolve-adsense-blocks.js` + smoke 24/24）
- `9607c4b` N8a wrapper partial（`adsense-article-block.ejs` + smoke 13/13）
- `4b332d7` **N8 anchor wiring（本文件驗收對象）**

---

## 2. N8 Accepted Scope

`4b332d7` 落地內容（已驗收合格）：

1. `src/views/ads/adsense-anchor.ejs`（new）：render 單一 anchor 之全部 resolved block；對每 block 委派 `adsense-article-block.ejs`。zero-byte / default-safe（blocks 非陣列或空 → 整檔零輸出）。comment 無 EJS delimiter 字符。
2. `src/scripts/build-github.js`：import `deriveRenderedAdsenseBlocks`；每篇 post 計算 `adsenseBlocksRendered = deriveRenderedAdsenseBlocks(post, settings.ads, 'pages')` 並傳入 post-detail render data。legacy `blocks.adsenseTop` / `adsenseBottom` path 不變。
3. `src/views/pages/post-detail.ejs`：新增 `_adsAnchors` local（fallback `{}`）+ **14 個 v1 anchor include point**（document order，每個為 column-0 之 `<%- ... -%>` 單行）。
4. `src/scripts/check-adsense-anchor-wiring.js`（new）：render-path smoke，14/14。
5. `package.json`：`check:adsense-anchor-wiring` script。
6. `CLAUDE.md`：N8 ledger note。

**未變更**：`ads.config.json`（`enabled` 仍 `false`）、post frontmatter、production content、Blogger 模板（N9 dormant）、deploy / gh-pages。

---

## 3. Six-Slot Path Summary

完整 article AdSense 解析 / 渲染鏈（GitHub Pages，surface=`pages`）：

```
content/blogger/posts/*.md frontmatter: adsense.blocks[]
        （per-block: id / enabled / surfaces / slotKey / anchor / order）
   +
content/settings/ads.config.json: ads.enabled / ads.adsenseClient / ads.slots[slotKey]
        │
        ▼
src/scripts/resolve-adsense-blocks.js  →  deriveRenderedAdsenseBlocks(post, settings.ads, 'pages')
        │  （6-stage gate；回傳 { [anchor]: ResolvedBlock[] }；空 anchor 不出現）
        ▼
src/scripts/build-github.js  →  const adsenseBlocksRendered = ... ；注入 post-detail render data
        │
        ▼
src/views/pages/post-detail.ejs  →  _adsAnchors[anchor] 之 14 個 anchor include point
        │  <%- await include('../ads/adsense-anchor', { blocks: _adsAnchors['<anchor>'], ads }) -%>
        ▼
src/views/ads/adsense-anchor.ejs  →  for each block：<div class="lab-container"> + 委派
        ▼
src/views/ads/adsense-article-block.ejs  →  接 { block, ads }；有 slotKey 才委派
        ▼
src/views/ads/adsense-slot.ejs  →  3-gate（enabled + adsenseClient + slots[slotKey]）→ <ins class="adsbygoogle lab-ad-slot lab-ad-slot--<slotKey>"> + push script
```

`articleAd1..6`：六個 convention slot key 透過 `adsense.blocks[]` entry（`slotKey: "articleAdN"` + `anchor: <14 v1 anchor 之一>`）進入上述 path。slot key 與 anchor 為正交兩維度：slot key 決定送 Google 之版位識別，anchor 決定文章內位置。

---

## 4. 14 v1 Anchor Include Points（順序符合 convention）

post-detail.ejs 之 document order（對齊 night-4 §2.5 區塊順序 + §7.2 v1 anchor 表）：

| # | anchor | 位置（相對既有區塊） |
|---|---|---|
| 1 | `afterHeader` | article header 後 |
| 2 | `afterCover` | cover image 後（Pages-only 區塊） |
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

驗收：`grep -o "_adsAnchors\['...'\]" post-detail.ejs` 回傳上表 14 項且順序一致；`grep -c adsense-anchor` = 14。

注：mid-body anchor（`afterIntro` / `inArticle` 等）per night-4 §7.3 為 v2 deferred，不在本 14 之列。

---

## 5. No-op Safety Gates

| 條件 | 行為 |
|---|---|
| `ads.enabled !== true` | resolver 回 `{}` → 每 anchor blocks=undefined → `adsense-anchor.ejs` 零輸出 |
| `ads.adsenseClient` 空 | resolver 回 `{}` → 全 anchor 零輸出 |
| `ads.slots[slotKey]` 空 | resolver omit 該 block → 該 anchor 零輸出（其餘 slot 不受影響） |
| post 無 `adsense` / `adsense.blocks` 非陣列或空 | resolver 回 `{}` → 全 anchor 零輸出 |
| block `enabled === false` | resolver skip 該 block |
| block `surfaces` 不含 `pages` | resolver skip 該 block（surfaces 省略 = 兩端，per night-4 §6.1） |
| anchor 不在 14 v1 enum | resolver skip 該 block |
| blocks 非陣列 / 空 傳入 partial | `adsense-anchor.ejs` 整檔零輸出 |

current production：`ads.enabled = false` → 上表第一列 → **所有 post 之所有 anchor 永遠零輸出**。zero-byte 由每行 `-%>` slurp + column-0 控制標籤保證；3 篇 post detail HTML 對 pre-change build byte-identical（night-2 已驗，本 phase build 後 grep 再確認無 ad markup）。

---

## 6. Acceptance Results（本 phase 實跑）

| 項目 | 結果 |
|---|---|
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts** ✅（baseline 不變） |
| `npm run check:adsense-article-block` | **13 / 13** ✅ |
| `npm run check:adsense-anchor-wiring` | **14 / 14** ✅ |
| `npm run check:adsense-resolver` | **24 / 24** ✅ |
| `npm run build:github` | success ✅ |
| post-detail 14 anchor include point | present，順序符合 convention ✅ |
| built `.cache/pages/` grep `adsbygoogle` / `ca-pub` / `data-ad-slot` / `data-ad-client` | **0 matches** ✅ |
| source + `ads.config.json` 之 `ca-pub-<digits>` hardcode 掃描 | **0 found** ✅ |
| working tree（build 後） | clean（build 僅寫 gitignored `.cache`）✅ |

**N8 acceptance verdict：✅ PASS**（read-only / source acceptance）。articleAd1..6 可透過 resolver block + anchor path 進入 post-detail render；14 anchor 存在且順序正確；disabled / missing config 為 no-op 且不破版；目前 build output 無真實 ad markup；無 hardcoded publisher / slot id。

---

## 7. N9 Readiness Checklist

N9 = Blogger EJS anchor wiring + `loader.blogger` emit（per night-4 §10 N9 / §8.3）。

- [ ] Blogger 端 anchor 對應表：`blogger-post-full.ejs` 之區塊順序（night-4 §2.6）與 14 v1 anchor 之 Blogger 欄位（§7.2 Blogger 欄；`afterCover` 為 Pages-only，Blogger 不接）對齊
- [ ] Blogger 端注入 `adsenseBlocksRendered`（`build-blogger.js`，surface=`'blogger'`）—— resolver 已支援 surface 參數，無需改 resolver
- [ ] `loader.blogger` 三選一（`theme` / `article` / `none`）決策 + emit 邏輯（night-4 §5.3）
- [ ] Blogger 端 zero-byte / byte-identical 驗收（mirror N8 之 stash-diff 方法）
- [ ] Blogger 端 smoke（mirror `check-adsense-anchor-wiring.js`，surface=`'blogger'`）
- [ ] enabled=false 下 Blogger build output 不含 ad markup（mirror N8 grep）
- [ ] reuse `adsense-anchor.ejs` / `adsense-article-block.ejs` / `adsense-slot.ejs`（已 surface-agnostic，預期可重用，零修改）

---

## 8. N9 Hard Blockers / Required Inputs（須 user 決策 / 提供）

1. **是否先在 staging / local preview 測試**
   - GitHub Pages 有 `npm run dev` / `build:github` local preview；Blogger **無本機完整模擬**（per CLAUDE.md §2.1），只能輸出 HTML 貼到 Blogger 後台預覽。
   - 待決：enabled=true 之測試是否先在 local（暫填 placeholder 以外之 test client）或直接在 Blogger 後台草稿預覽？建議 local 先驗 markup 結構，Blogger 後台驗實際載入。

2. **真實 AdSense client id 如何安全填入**
   - 紅線：`ca-pub-XXXXXXXXXXXXXXXX` 真實值**不得 commit**（CLAUDE.md AdSense 紅線 + night-4 §5.4）。
   - 待決：採（a）build 時環境變數注入、（b）git-ignored local override settings、或（c）user 手動於 deploy 前暫填 `ads.config.json` 後立即還原？需 user 選定安全機制。

3. **六個 slot id 是否已在 AdSense 後台建立**
   - 待 user 確認：`articleAd1..6`（或實際採用之 slot key 名稱）對應之 6 個 ad unit 是否已於 AdSense 後台建立並取得 slot id？尚未建立則 N9 enabled=true 無法驗收（resolver 會 omit 空 slot id）。

4. **每個 articleAd1..6 對應哪個 anchor 的 production policy**
   - night-4 §7.5 提供建議組合（書評類 vs 技術筆記類各一套），但屬**建議非定案**。
   - 待 user 確認：採單一全站預設組合、或 per-contentKind 不同組合、或 per-article 手填 `adsense.blocks[]`？另需確認 `settings.ads.defaults.blocks[]` 是否啟用（目前為 empty `[]`，N6b deferred）。

5. **deploy / Blogger 更新順序**
   - 待 user 確認順序，例如：N9 source land → local/staging 驗收 → enabled=true + 真實 id（安全機制）→ `build:github` + `build:blogger` → GitHub Pages deploy（gh-pages）→ Blogger 後台重貼。
   - 注意 reverse UTM / Blogger repost 既有 deploy gate（pm-26）仍 BLOCKED；AdSense 上線不得繞過既有 deploy gate。

6. **rollback plan**
   - 最快 rollback：將 `ads.config.json` `enabled` 改回 `false` → 下次 build 全 anchor 即回 zero-byte（無需 revert source）。
   - source rollback：`git revert` N8 / N9 commit（anchor include 為 additive，revert 安全）。
   - Blogger 端：已重貼之文章 HTML 需手動回退（Blogger 無自動 rollback）；建議重貼前備份原文章 HTML（mirror commerce repost preflight 之備份要求）。
   - 待 user 確認：Blogger 端 rollback 由誰執行 / 備份存放位置。

---

## 9. 明確聲明

- 本文件 = **N8 acceptance + N9 readiness 文件**，**非 N9 執行**。
- 不含 real AdSense publisher id / slot id。
- 不含 deployment 動作（未 deploy、未 push gh-pages、未碰 Blogger）。
- 不改 source / EJS / JS / settings / post frontmatter / production content。
- N9 須待 §8 六項 blocker / input 由 user 決策後另開 phase。
