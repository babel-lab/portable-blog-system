# SP-4a — `includeInListings` selector + GitHub Pages listing wiring（output-preserving）

> Phase：`20260623-pm-sp4a-include-in-listings-selector-github-wiring-a`（2026-06-23）
> Baseline：`main @ 0053e30`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：
> - `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1，架構 preanalysis §2.4 / §6.4）
> - `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2，schema lock + validator）
> - `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3，post-detail robots precedence）
> - `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory + binding decision §H.3）

本 phase 落地 preanalysis §6.4 之 **SP-4a**：新增純函式 `shouldIncludeInListings(post)`
selector 並接入 GitHub Pages listing surfaces，**預設一律 include → 既有 listing 輸出 byte-identical**。
**只動 GitHub Pages listing**；不接 sitemap（SP-5）/ Blogger / Admin / feed（SP-9）/ pageType-derived
listing defaults（SP-4c）。

---

## A. Phase name

`20260623-pm-sp4a-include-in-listings-selector-github-wiring-a`

## B. Baseline observed

| 項目 | 值 |
|---|---|
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `0053e30` |
| origin/main | `0053e30` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(content): inventory include-in-listings impact` |

baseline 與 phase 預期完全一致。

## C. Files changed

| 檔案 | 變更 |
|---|---|
| `src/scripts/include-in-listings.js` | **新增** 純函式 selector：`resolveIncludeInListings(post)`（lower-level，回傳 strict boolean）+ `shouldIncludeInListings(post)`（薄包裝，供 `.filter()`）。零依賴、無 side effect。 |
| `src/scripts/check-include-in-listings.js` | **新增** SP-4a regression smoke（16 case）。只 import 純 helper；node:assert、zero new dependency；未加 package.json script。 |
| `src/scripts/build-github.js` | listing surfaces wiring：新增 import；計算 `listingPosts = githubPosts.posts.filter(shouldIncludeInListings)`；home / post-list 改用 `listingPosts`；prev/next 改由 `listingNavByPost`（以 listingPosts、post 物件 reference 為 key）推導，detail loop 改跑全量 `githubPosts.posts`（確保未列入 listing 之頁仍生成 detail）；category / tag map 改 iterate `listingPosts`。 |
| `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md` | 本 ledger。 |

## D. Selector behavior（SP-4a）

```
post.includeInListings === false → false
post.includeInListings === true  → true
缺省（undefined / 缺欄位）          → true（預設保底，byte-identical 保證）
非 boolean（string/number/null/object）→ true（runtime safety；validator 已 warn，此處不重複解讀）
```

❌ **不**由 `contentKind` / `pageType` / `seo.indexing` / `includeInSitemap` / `includeInFeeds` /
`platformPolicy` / `gatedDownload` 推導 listing 排除（legacy download 自動隱藏屬另開之
content migration / policy phase，非 SP-4a 範圍）。

## E. GitHub listing surfaces wired

| surface | 改動 |
|---|---|
| home（`pages/home.ejs`） | `posts: listingPosts` |
| post-list / archive（`pages/post-list.ejs`） | `posts: listingPosts` |
| category（`pages/category.ejs` + category-list 索引） | 分組由 `listingPosts` 派生 |
| tag（`pages/tag.ejs` + tag-list 索引） | 分組由 `listingPosts` 派生 |
| prev/next 文章底部導覽 | 由 `listingNavByPost`（listingPosts 鏈）推導 |
| **post-detail 生成** | **不**過濾——仍對全量 `githubPosts.posts` 生成（未列入 listing 之頁仍可訪問） |
| `posts.json`（資料匯出） | **不**過濾——維持全量（非 listing surface） |
| cross-site loader（`load-github-posts.js`） | **未動**——過濾在 build listing 層，不在 loader 層（避免影響 detail / posts.json / Blogger） |

## F. Tests / smokes added

`node src/scripts/check-include-in-listings.js` —— 16 case，涵蓋 spec 必測 1–10 + 補強
（explicit false 覆蓋正常 contentKind、resolve/should 一致、null post 防呆）。

## G. Validation results

| 量測 | 結果 | baseline |
|---|---|---|
| `node src/scripts/check-include-in-listings.js`（新） | **16 / 0 PASS** | — |
| `node src/scripts/check-page-type-validator.js`（SP-2） | **20 / 0 PASS** | 20 / 0 |
| `node src/scripts/check-page-type-robots.js`（SP-3） | **29 / 0 PASS** | 29 / 0 |
| `npm run validate:content` | **0 error / 104 warning / 94 post** | 0 / 104 / 94 |

## H. Output-preservation confirmation（byte-identical by construction）

- **無任何 production post 使用 `includeInListings`**（grep `content/{github,blogger}/posts` = 0；
  6 命中全在 `content/validation-fixtures/`，不被 build loader 讀取）。
- `shouldIncludeInListings` 對所有 production post 回 `true` → `listingPosts` 與 `githubPosts.posts`
  **等長、同序、同物件 reference**（filter 不 clone）。
- home / post-list / category / tag：輸入清單內容與順序不變 → render 逐字相同。
- prev/next：`listingNavByPost` 以 post 物件 reference 為 key（避免 slug 衝突誤判），SP-4a 下每篇
  post 之 prev/next 與原 positional（`orderedPosts[index±1]`）推導逐字相同；detail loop 改跑
  `githubPosts.posts`（與原 `orderedPosts = githubPosts.posts` 同序）→ 生成的 detail 頁集合與順序不變。
- `posts.json` 維持全量輸出。
- **未動** `build-sitemap.js`（sitemap / robots.txt 行為不變，與 listing 正交）、`build-blogger.js`、
  任何 EJS template、Admin、GA4、AdSense、validator、settings、content、`package.json` / lockfile、
  `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`、`CLAUDE.md` / `MEMORY.md`。
- **未執行** build / deploy / preview / repost / dev server；未 stage 任何 generated HTML / cache / dist / gh-pages。
- **未碰** Blogger / AdSense / GA4 / Search Console / Drive 後台。

## I. Download confirmation

- `portable-blog-system-mvp`（github, ready；唯一 visible download，無 `includeInListings`）→
  selector 回 `true` → **保留**入 home / post-list / 其 category / 其 tag / prev-next（per inventory §H.3 binding）。
- legacy `contentKind: download` **無**自動隱藏（selector 不讀 contentKind）。
- sitemap 對 download 之排除維持不變（與 listing 正交，未動 `build-sitemap.js`）。

## J. What was NOT done（本 phase 邊界）

- ❌ SP-4b：讓 explicit `includeInListings: false` 之 production post 實際隱藏（無此類 post，本 phase 僅備路徑）。
- ❌ SP-4c：`pageType` / `contentKind` 推導 listing 排除預設（須另開 content migration / policy phase）。
- ❌ SP-5：`includeInSitemap` 接 build-sitemap。
- ❌ 改 sitemap / Blogger / Admin / GA4 / AdSense 行為。
- ❌ 改 content posts / settings / EJS / validator / `package.json`。
- ❌ build / deploy / preview / repost / dev server；stage dist / cache / gh-pages。
- ❌ 改 `CLAUDE.md` / `MEMORY.md`。

## K. Final git state

- 新增 3 檔（`include-in-listings.js` / `check-include-in-listings.js` / 本 ledger）+ 修改 1 檔（`build-github.js`）。
- commit subject：`feat(github): add include-in-listings selector`。

## L. Next recommended phase

- **SP-5**：`includeInSitemap` 接 `build-sitemap.js`（override + 推導；維持與 listing 正交之獨立 code path）。
- 或 **SP-6**：Blogger guidance（copy-helper / checklist）擴充 pageType 文案（🟢 純 additive）。
- legacy download 自動隱藏 / SP-4c 須**另開** content migration / policy phase，先確認 live impact。

## M. Exit / idle freeze recommendation

- SP-4a 為純 additive + byte-identical wiring，落地後建議 **idle freeze**。
- 不主動推進 SP-4b/4c/5；不主動 build / deploy / repost / 動 Google 後台 / 改 CLAUDE.md / MEMORY.md。

---

## Cross-links
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3）
- `docs/20260623-sp4-include-in-listings-inventory-preflight.md`（SP-4 inventory）
- `CLAUDE.md` §15–§17 / §21 / §23

（本文件結束）
