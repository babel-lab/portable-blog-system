# AdSense N9c — Real-Enable Preview Dry-Run（no-commit）

> ⚠️ 本文件記錄一次**本機 dry-run**：暫時把 `ads.enabled` 設 `true` 以預覽 generated AdSense markup，檢查後立即還原 `false`。
> **未** commit enabled=true、**未** deploy、**未** push gh-pages、**未**改 Blogger。正式 N9 enable+deploy 仍 **BLOCKED**。
> 本文件**不含** real full client id / slot id；一律 masked（如 client `ca-pub-…3759`、slot `…677`）。

---

## A. Baseline

- baseline commit：`5995531`（`feat(adsense): resolve default article ad blocks`）
- branch：`main`；working tree clean；HEAD = origin/main
- normal validate baseline：`0 errors / 94 warnings / 84 posts`
- dry-run 前 `content/settings/ads.config.json`：`enabled:false`、6 slots（`articleAd1`..`articleAd6`，real ids present）、`defaults.blocks[]` 6 blocks（surfaces `["pages"]`）

## B. Dry-run method

1. 確認 safe config（`enabled:false` / 6 slots / 6 default blocks）。
2. **暫時**把 `ads.enabled` 改 `true`（working tree only，不 commit）。
3. 跑 `validate:content` / `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `build:github`。
4. inspect generated post HTML（`.cache/pages/posts/*/index.html`）。
5. **還原** config（`git checkout -- content/settings/ads.config.json` → byte-identical，`enabled:false`），rerun validate + build，verify 0 ad markup。
6. final containment：working tree clean、`ads.config.json` 無 final diff、real ids 僅存於 `ads.config.json`。

## C. Temporary enable + restore

- temporary enable 已使用（`enabled:true`，working tree only）。
- 還原採 `git checkout`，產生 **byte-identical** 結果；`git diff content/settings/ads.config.json` 為空，`enabled` 回到 `false`。
- repo **不留** enabled=true：working tree clean，無任何 `ads.config.json` final diff。

## D. Enabled build result（masked ids）

跑 `build:github`（`enabled:true`）後 generated post-detail HTML：

- `adsbygoogle`：出現（head loader script + 每 slot `<ins class="adsbygoogle">` + `push()`）。
- `data-ad-client`：出現；client = `ca-pub-…3759`。
- `data-ad-slot`：出現。
- 3 篇 post-detail 各渲染 **6** 個 article ad block（site-wide `defaults.blocks[]` 套用）：`data-ad-slot` / `data-ad-client` 各 6×3 = 18；每個 real slot id 各出現 3 次（每篇 1 次），6 個 slot id **全數**至少出現一次。
- **anchor 順序（top→bottom，符合 intended editorial order）**：

  | 次序 | slotKey | anchor | slot（masked） |
  |---|---|---|---|
  | 1 | articleAd1 | `afterHeader` | `…677` |
  | 2 | articleAd2 | `afterCover` | `…194` |
  | 3 | articleAd3 | `afterBookPhoto` | `…373` |
  | 4 | articleAd4 | `afterAffiliateTop` | `…397` |
  | 5 | articleAd5 | `beforeAffiliateBottom` | `…302` |
  | 6 | articleAd6 | `beforeRelatedLinks` | `…977` |

- **loader 非重複**：每篇 post 之 `adsbygoogle.js` loader script 僅出現 **1** 次（`loader.pages:"head"` 單獨控制 head loader），與 6 個 `<ins>`/`push()` slot markup 分離，無 duplicate loader 問題。
- checks：validate `0/94/84`；article-block `13/13`；anchor-wiring `14/14`；resolver `32/33` —— 唯一 fail = case 21 self-guard（斷言 production 須 `enabled:false`），dry-run 期間 enable 故意觸發，還原後回 `33/33`（預期行為，非缺陷）。

## E. Restored disabled build result

還原 `enabled:false` 後 rerun `build:github`，generated post HTML grep：`adsbygoogle` / `ca-pub` / `data-ad-slot` / `data-ad-client` / 6 real slot id 全部 **0 matches**。回到 zero ad markup。

## F. Status / next operator decision

- 正式 **N9 enable / deploy 尚未執行**；本 phase 僅 dry-run 驗證 + docs 記錄。
- repo 維持 `enabled:false`；GitHub Pages / Blogger 線上**未變**。
- **next operator decision**：是否正式 commit `enabled:true` 並 deploy GitHub Pages（須走既有 deploy gate + approver；Blogger 端另屬 N9-Blogger，須 `loader.blogger` 決策 + 後台重貼 + 備份）。在 operator 明示核可前，維持 disabled。

## G. Red lines（維持）

- ❌ 不在 docs / CLAUDE.md 保存 real full client / slot id（本文件一律 masked）。
- ❌ 不 source hardcode real id（一律走 `ads.config.json`）。
- ❌ 未 operator 核可前不 commit enabled=true、不 deploy、不 push gh-pages、不改 Blogger。
