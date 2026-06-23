# SP-5a — `includeInSitemap` selector + build-sitemap wiring（output-preserving）

> Phase：`20260623-pm-sp5a-include-in-sitemap-selector-wiring-a`（2026-06-23）
> Baseline：`main @ c9e89da`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：
> - `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，架構 preanalysis §2.3 / §6.4）
> - `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，schema lock + validator）
> - `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3，post-detail robots precedence）
> - `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory）
> - `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a，listing selector + GitHub wiring）

本 phase 落地 preanalysis §6.4 之 **SP-5a**：新增純函式 `shouldIncludeInSitemap(post)`
selector 並接入 `build-sitemap.js`，**預設輸出 byte-identical**（既有 production sitemap 不變）。
**只動 GitHub Pages sitemap 生成**；不接 listing（SP-4 線）/ Blogger / Admin / feed（SP-9）/
pageType-derived sitemap defaults。

---

## A. Phase name

`20260623-pm-sp5a-include-in-sitemap-selector-wiring-a`

## B. Baseline observed

| 項目 | 值 |
|---|---|
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `c9e89da` |
| origin/main | `c9e89da` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `feat(github): add include-in-listings selector` |

baseline 與 phase 預期完全一致。

## C. Files changed

| 檔案 | 變更 |
|---|---|
| `src/scripts/include-in-sitemap.js` | **新增** 純函式 selector：`isSitemapEligible(post)`（逐字封裝既有 build-sitemap safety precedence）+ `resolveIncludeInSitemap(post)`（lower-level，完整 precedence，回 strict boolean）+ `shouldIncludeInSitemap(post)`（薄包裝，供迴圈 / `.filter()`）。零依賴、無 side effect。 |
| `src/scripts/build-sitemap.js` | post-detail 迴圈之 inline inclusion if/else 改 delegate `shouldIncludeInSitemap(post)`；新增 import。lastmod 計算 / entry push / 其餘 entries（home / post-list / category / tag）**未動**。 |
| `src/scripts/check-include-in-sitemap.js` | **新增** SP-5a regression smoke（19 case）。只 import 純 helper（**不** import build-sitemap.js —— 其 import 即觸發 `main()` build side effect）；node:assert，zero new dependency；未加 package.json script。 |
| `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md` | 本 ledger。 |

## D. Selector behavior（SP-5a）

`isSitemapEligible(post)`（既有 build-sitemap safety，逐字對齊）：

```
seo.indexing === 'noindex-follow' | 'noindex-nofollow' → false（不入 sitemap）
seo.indexing !== 'index' 且 contentKind === 'download'  → false（legacy SEO-1）
其餘                                                    → true（eligible）
```

`resolveIncludeInSitemap(post)` / `shouldIncludeInSitemap(post)`：

```
1. !isSitemapEligible(post)            → false（safety 永遠優先，override 不放寬）
2. eligible 且 includeInSitemap === false → false
3. eligible 且 includeInSitemap === true  → true（顯式 opt-in，但僅在已 eligible 時）
4. eligible 且缺省（undefined / 缺欄位）   → true（既有行為）
5. eligible 且非 boolean（string/number/null/object）→ true（runtime safety；validator 已 warn）
```

❌ **不**由 `includeInListings` / `includeInFeeds` / `platformPolicy` / `gatedDownload` / `pageType`
推導 sitemap 排除。本 phase **不新增 pageType sitemap 預設**（現行 build-sitemap 不消費 pageType；
維持 SP-3「不碰 sitemap」之語意）。

## E. Wiring / precedence

| 項目 | 處理 |
|---|---|
| post-detail inclusion（`build-sitemap.js` `buildEntries()`） | `if (!shouldIncludeInSitemap(post)) continue;` 取代原 2 個 inline `continue` 條件；lastmod / push 不變 |
| home / post-list / categories / tags entries | **未動**（非 post-detail；不過 selector） |
| robots.txt（`buildRobotsTxt`） | **未動** |
| safety vs override 優先序 | safety（noindex-* / legacy download）**永遠**先判；`includeInSitemap === true` 不得把 noindex / download 頁強塞進 sitemap |
| listing ↔ sitemap | **正交**：`build-sitemap.js` 只讀 `includeInSitemap`；`build-github.js` listing 只讀 `includeInListings`（grep 證實互不交叉） |

## F. Tests / smokes added

`node src/scripts/check-include-in-sitemap.js` —— 19 case，涵蓋 spec 必測 1–12 + 補強
（explicit index 覆蓋 download、`isSitemapEligible` 對齊 legacy precedence、resolve/should 一致、
null/undefined post 防呆）。

## G. Validation results

| 量測 | 結果 | baseline |
|---|---|---|
| `node src/scripts/check-include-in-sitemap.js`（新） | **19 / 0 PASS** | — |
| `node src/scripts/check-include-in-listings.js`（SP-4a） | **16 / 0 PASS** | 16 / 0 |
| `node src/scripts/check-page-type-robots.js`（SP-3） | **29 / 0 PASS** | 29 / 0 |
| `npm run validate:content` | **0 error / 104 warning / 94 post** | 0 / 104 / 94 |

## H. Output-preservation confirmation（byte-identical by construction）

- **無任何 production post 使用 `includeInSitemap`**（grep `content/{github,blogger}/posts` = 0；
  命中全在 `content/validation-fixtures/`、`docs/`、`src/scripts/`，不影響 sitemap loader 結果）。
- `shouldIncludeInSitemap` 對所有無 `includeInSitemap` 之 post 回傳 == `isSitemapEligible`，
  而 `isSitemapEligible` 逐字複現原 inline 兩個 `continue` 條件 → 每篇 post 之 include/exclude
  決策與 SP-5a 前**逐字相同**；lastmod / loc / entry 順序未動。
- 未產生 / 未 stage 任何 `dist/sitemap.xml` / `dist/robots.txt` / `.cache` / gh-pages（未執行 build）。
- **未動** `build-github.js` listing / `build-blogger.js` / 任何 EJS / Admin / validator / settings /
  content / `package.json` / lockfile / `dist*` / `gh-pages` / `.cache/` / `CLAUDE.md` / `MEMORY.md`。
- **未執行** build / deploy / preview / repost / dev server。
- **未碰** Blogger / AdSense / GA4 / Search Console / Drive 後台。

## I. MVP download sitemap confirmation

- `portable-blog-system-mvp`（github, ready；唯一 visible download，`contentKind: download`，無 `includeInSitemap`）→
  `isSitemapEligible` = false（download 且非 explicit index）→ `shouldIncludeInSitemap` = **false** →
  **維持排除於 sitemap**（與 SP-5a 前相同）。
- 同時：該頁 listing inclusion 由 SP-4a `shouldIncludeInListings` 回 `true` → **仍留在站內列表**。
  → 證實 sitemap inclusion 與 listing inclusion **正交**（smoke case 11 亦鎖此契約）。
- legacy `contentKind: download` 之 sitemap 排除**完整保留**；`includeInSitemap: true` 不得放寬。

## J. Orthogonality confirmation

- `build-sitemap.js`：只消費 `includeInSitemap`（grep 無 `includeInListings`，僅註解說明正交）。
- `build-github.js` listing：只消費 `includeInListings`（grep 無 `includeInSitemap`）。
- selector 不讀 `includeInListings` / `includeInFeeds` / `platformPolicy` / `gatedDownload` / `pageType`。

## K. What was NOT done（本 phase 邊界）

- ❌ 不新增 `pageType` sitemap 預設（gated_download 等不 auto-exclude；維持現行行為）。
- ❌ 不改 listing / category / tag / Blogger / Admin / GA4 / AdSense 行為。
- ❌ 不改 content posts / settings / EJS / validator / `package.json` / lockfile。
- ❌ 不執行 build / deploy / preview / repost / dev server；不 stage dist / cache / gh-pages / sitemap.xml。
- ❌ 不改 `CLAUDE.md` / `MEMORY.md`。

## L. Final git state

- 新增 3 檔（`include-in-sitemap.js` / `check-include-in-sitemap.js` / 本 ledger）+ 修改 1 檔（`build-sitemap.js`）。
- commit subject：`feat(sitemap): add include-in-sitemap selector`。

## M. Next recommended phase

- **SP-6**：Blogger guidance（copy-helper / checklist）擴充 pageType 文案（🟢 純 additive）。
- 或 **SP-5b**：當有 production post 需 explicit `includeInSitemap` override 時實際驗證（目前無此 post，本 phase 僅備路徑）。
- legacy download 自動隱藏 / `pageType`-derived sitemap defaults 須**另開** content migration / policy phase，先確認 live impact。

## N. Exit / idle freeze recommendation

- SP-5a 為純 additive + byte-identical wiring，落地後建議 **idle freeze**。
- 不主動推進 SP-5b/6/7+；不主動 build / deploy / repost / 動 Google 後台 / 改 CLAUDE.md / MEMORY.md。

---

## Cross-links
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1 §2.3 / §4 / §6.4）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3）
- `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a）
- `docs/seo-indexing-rules.md`（SEO-1/2 indexing policy）
- `CLAUDE.md` §21 SEO / §23 發布狀態

（本文件結束）
