# SP-3 — GitHub Pages post detail robots precedence 接 `pageType` 推導

> Phase：`pm-sp3-github-page-type-robots-precedence-a`（2026-06-23）
> Baseline：`main @ 3b0dc2d`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：`docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1）
>      + `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 schema lock + validator）

本 phase 落地 preanalysis §6.4 之 **SP-3**：讓 GitHub Pages post detail 之 robots meta 可消費
optional frontmatter `pageType`，但**缺省輸出 byte-identical**（無 `pageType` 之既有 post robots
不變）。**只動 GitHub post detail robots**；不接 sitemap / listing / category / tag / Blogger /
Admin / feed（各屬 SP-4..SP-9）。

---

## 1. Goal

- GitHub post detail SEO robots 由 optional frontmatter `pageType` 推導。
- 所有不使用 `pageType` 之既有 post 維持原 robots 行為。

## 2. Precedence implemented（高 → 低）

1. **explicit `post.seo.indexing`**（`index` / `noindex-follow` / `noindex-nofollow`）—— 最高優先（SEO-2）
2. **legacy `contentKind === 'download'`** safety fallback → `noindex, follow`（SEO-1；不可被 `pageType` 放寬）
3. **`pageType` 推導**（SP-3 新增；缺省 / 未知值 → 不推導）
4. **既有 default**（沿用 `commonSeo` spread 之 `seo.robots = 'index, follow'`）

關鍵安全保證：
- explicit `seo.indexing` **永遠**覆蓋 `pageType` 推導與 download fallback。
- `contentKind: download` 在 `pageType` **之前**判定 → download 之 `noindex, follow` **不會**被任何
  `pageType`（含 `article` / `landing`）放寬。
- 無 `seo.indexing` + 非 download + 無 / 未知 `pageType` → 回傳呼叫端既有 default → 既有輸出不變。

## 3. `pageType` → robots mapping（SP-3 本批）

| `pageType` | 推導 robots |
|---|---|
| `download` | `noindex, follow` |
| `gated_download` | `noindex, follow` |
| `redirect_canonical` | `noindex, follow`（canonical-必-explicit 之檢查屬 SP-2 validator，SP-3 不改 canonical 行為） |
| `utility_hidden` | `noindex, nofollow` |
| `article` / `static_page` / `landing` / `platform_special` | 不推導（沿用既有 default / explicit `seo.indexing`） |
| 未知值 / 缺省 | 不推導 |

robots 字串格式刻意對齊 build-github.js 既有輸出（含空格：`noindex, follow`），確保 byte-identical。

## 4. Files changed

| 檔案 | 變更 |
|---|---|
| `src/scripts/page-type-robots.js` | **新增**純函式 helper：`derivePageTypeRobots(metadataPageType)`（pageType→robots map）+ `resolvePostDetailRobots(post, defaultRobots)`（完整 precedence）。零依賴、無 side effect；可供未來 SP-4 / SP-5 sitemap·listing 重用，本 phase 僅 GitHub post detail 消費。 |
| `src/scripts/build-github.js` | `buildSeoForPostDetail()` 之 inline robots if/else block 改 delegate `resolvePostDetailRobots(post, seo.robots)`；新增 import。命名以 helper 內 `metadataPageType` 區隔 build-github 既有 render-time 區域變數 `pageType`（home/post-detail/404/design-system）。 |
| `src/scripts/check-page-type-robots.js` | **新增** SP-3 regression smoke（29 case）。只 import 純 helper（**不** import build-github.js —— 其 import 即觸發 `main()` build side effect）；node:assert，zero new dependency；未加 package.json script。 |

## 5. Tests / validation

| 量測 | 結果 |
|---|---|
| `node src/scripts/check-page-type-robots.js`（新） | **29 / 0 PASS** |
| `node src/scripts/check-page-type-validator.js`（SP-2） | **20 / 0 PASS**（未受影響） |
| `npm run validate:content` | **0 error / 104 warning / 94 post**（與 SP-2 後 baseline 一致，無漂移） |

smoke 涵蓋全部 spec test cases：explicit 覆蓋、download legacy 保留、各 `pageType` 推導、
`article/static_page/landing/platform_special` 不推導、缺省 default、unknown→default、
以及 safety（download + pageType article/landing 不放寬）。

## 6. Output-preservation confirmation

- **無任何 production post 使用 `pageType`**（grep `content/{github,blogger}/posts` + `content/shared` = 0 命中）
  → `derivePageTypeRobots` 對所有 production post 回 `null` → robots 由 step 1/2/4 決定，與 SP-3 前完全相同。
- 重構後 explicit `seo.indexing` 三值、`contentKind=download` fallback、malformed `seo.indexing`
  fall-through、default 路徑之 robots 字串與順序**逐字等價**；default 路徑回傳 `seo.robots`
  （= commonSeo `'index, follow'`）→ byte-identical。
- 未動 `build-sitemap.js` / `build-blogger.js` / 任何 EJS / Admin / validator / settings / content。
- **未消費** `seoSettings` / `includeInSitemap` / `includeInFeeds` / `platformPolicy` / `gatedDownload`
  於任何 build / list / sitemap 邏輯（本 phase 範圍外）。
- 未使 download 頁離開列表（SP-4 範圍）；未改 sitemap 行為（SP-5 範圍）。
- 未動 `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/` / `package.json` / lockfile
  / `CLAUDE.md` / `MEMORY.md`。
- 未碰 Blogger / AdSense / GA4 / Search Console / Drive 後台。

## 7. 不做事項（本 phase 邊界）

- ❌ 不接 `includeInListings` / `includeInSitemap` / `includeInFeeds` / `platformPolicy` / `gatedDownload`
  於 build / list / sitemap（SP-4..SP-9）。
- ❌ 不改 sitemap / listing / category / tag / Blogger / Admin / GA4 / AdSense 行為。
- ❌ 不新增 Google Form 頁為 content file；不改 production content posts。
- ❌ 不執行 build / deploy / preview / repost / dev server；不 stage 任何 generated HTML / cache / dist / gh-pages。
- ❌ 不啟動 SP-4..SP-9。

## 8. Follow-up（deferred；非本 phase）

- SP-4：`includeInListings` 接 listing / category / tag loader（download / gated opt-in 先行）。
- SP-5：build-sitemap 接 `includeInSitemap` 推導 + override。
- `report:validation` + `check:validation-report` baseline 仍 pin `{ 0, 94, 84 }` 對 stale `.cache`；
  下次在 PC regenerate report 後須同步改 `{ 0, 104, 94 }`（per SP-2 ledger §6.1；本 phase 未碰 `.cache`）。
