# AdSense N9d — Pre-Deploy Go / No-Go Checklist

> ⚠️ 本文件是 **docs-only checklist**，**不**啟用廣告、**不** deploy、**不**改 Blogger、**不**改 `ads.config.json`。
> 供 operator 在正式 commit `ads.enabled=true` + deploy 前，明確確認風險、部署範圍、rollback 方式。
> 全文一律 **masked ids**（client `ca-pub-…3759`、slot 如 `…677`），不含 real full id。

---

## A. Purpose

- 本文件是正式 **N9 enable / deploy 前**的 go / no-go checklist。
- 目的：讓 operator 在把 `ads.enabled` 由 `false` 改 `true` 並 deploy 之前，逐項確認「是否接受目前廣告版位策略、部署範圍、rollback 路徑」。
- 本 phase **不**啟用廣告、**不** deploy、**不** push gh-pages、**不**改 Blogger。所有勾選與決策由 operator 於正式 N9 phase 執行。

## B. Current safe baseline

- baseline commit：`d5f1545`（`docs(adsense): record n9c enable preview dry run`）
- `ads.enabled` 維持 **false**（production / repo 皆未啟用廣告）
- real client / six slot ids **僅**存於 `content/settings/ads.config.json`；docs / CLAUDE.md / source / EJS 皆無 real id
- N9c dry-run **已通過**（masked ids only；見 `docs/20260611-adsense-n9c-real-enable-preview-dry-run.md`）
- normal validate baseline：`0 errors / 94 warnings / 84 posts`

## C. Dry-run evidence summary（N9c）

- 本機暫設 `ads.enabled=true` 時，`build:github` 後 generated post HTML 出現預期 AdSense markup（`adsbygoogle` / `data-ad-client` / `data-ad-slot` / client `ca-pub-…3759`）。
- 3 posts × 6 blocks = **18** article ad slots；六個 real slot id 全數至少各出現一次（每篇各 1 次）。
- 還原 `ads.enabled=false` 後 rebuild，generated post HTML 回到 **0** ad markup。
- **無 duplicate loader 問題**：每篇 post 之 `adsbygoogle.js` loader 僅 1 次（head loader 由 `loader.pages:"head"` 單獨控制），與 6 個 `<ins>`/`push()` 分離。
- **anchor 順序 top→bottom**：articleAd1 → articleAd2 → articleAd3 → articleAd4 → articleAd5 → articleAd6。

## D. Operator go / no-go decisions

> 由 operator 逐項勾選；任一項 No-Go 即不得進入正式 enable / deploy。

- [ ] 接受每篇文章預設出現 **6** 個 AdSense article blocks（site-wide `defaults.blocks[]`）
- [ ] 接受目前 anchor policy：
  - [ ] articleAd1 `afterHeader`（slot `…677`）
  - [ ] articleAd2 `afterCover`（slot `…194`）
  - [ ] articleAd3 `afterBookPhoto`（slot `…373`）
  - [ ] articleAd4 `afterAffiliateTop`（slot `…397`）
  - [ ] articleAd5 `beforeAffiliateBottom`（slot `…302`）
  - [ ] articleAd6 `beforeRelatedLinks`（slot `…977`）
- [ ] 接受先在 **GitHub Pages** 上線測試（Blogger 暫不動）
- [ ] 決定是否同步更新 **Blogger**（預設：另案處理，不在本次 enable 內）
- [ ] 接受 rollback 方式：將 `ads.enabled` 改回 `false` 後 rebuild / redeploy
- [ ] 確認正式 enable commit **只應**改 `content/settings/ads.config.json` 的 `enabled` `false`→`true`（不混入其他變更）
- [ ] 確認 deploy 前要重跑 validate / check / build / grep
- [ ] 確認 deploy 後要檢查實際頁面是否載入正常（版位 / 不破版 / console 無錯）

> ⚠️ 風險提醒：6 個版位同時開啟可能過密；AdSense 政策對廣告 / 內容比例有要求。operator 可考慮 per-contentKind 啟用子集（須另開 phase 調整 `defaults.blocks[]` 或改用 per-article `adsense.blocks[]`）。

## E. Proposed formal N9 enable / deploy sequence（計畫，不執行）

1. baseline verify at latest docs checkpoint
2. edit `content/settings/ads.config.json` `enabled` `false`→`true`（**only** this change）
3. run `npm run validate:content` / `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `build:github`
4. grep generated output for expected **masked** client（`ca-pub-…3759`）+ six slots；確認無未預期值
5. commit `chore(adsense): enable article ads`（單一 config 變更，不混 unrelated）
6. deploy GitHub Pages（走既有 deploy 流程 + approver；不繞 pm-26 deploy gate）
7. inspect live GitHub Pages post-detail pages（版位 / loader / 不破版）
8. decide Blogger update / repost **separately**（屬 N9-Blogger；須 `loader.blogger` 決策 + 備份 + 後台重貼）
9. monitor AdSense / layout / console errors
10. rollback if needed（見 §F）

## F. Rollback checklist

- [ ] set `ads.enabled=false`
- [ ] run `npm run validate:content` / checks / `build:github`
- [ ] grep generated output → **0** ad markup（`adsbygoogle` / `ca-pub` / `data-ad-slot` / `data-ad-client` / six slot ids）
- [ ] commit rollback（單一 config 變更）
- [ ] redeploy GitHub Pages
- [ ] 若 Blogger 曾更新：restore / repost 無廣告版本（Blogger 無自動 rollback，須先備份原文章 HTML）
- [ ] verify live pages have **0** ad markup

## G. Red lines

- ❌ 不在 docs / CLAUDE.md 寫 full real client / slot id（一律 masked）。
- ❌ 不在 source / EJS hardcode ids。
- ❌ 不 deploy 未通過 build / grep 的 output。
- ❌ 不把 enable commit 與 unrelated source changes 混在一起。
- ❌ 不在未決定 Blogger policy 前自動改 Blogger。
- ❌ 未 operator 核可前不 commit `enabled=true`、不 deploy、不 push gh-pages。
