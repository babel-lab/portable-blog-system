# SP download / noindex / listing opt-in preanalysis（docs-only）

- Phase id：`20260624-sp-download-include-in-listings-opt-in-preanalysis-docs-only-a`
- 日期：2026-06-24（Asia/Taipei）
- 類型：**preanalysis only**（docs-only；不改 source / content / build / deploy）
- frozen baseline：main `fca76f6`（HEAD = origin/main，ahead/behind 0/0，working tree clean，`.git/index.lock` absent）
- 影響分類編號（CLAUDE.md §7）：J（SEO / 索引）、F（GitHub 靜態站 listing / sitemap）、A（規範文件）

---

## 0. 本文目的與非目的

目的：盤點 `contentKind: download` / noindex / special pageType / `includeInListings` /
`includeInSitemap` / `platformPolicy` / robots 之間**現況實際關係**，並評估「未來是否需要『download
頁預設不入站內列表、但可 `includeInListings: true` opt-in 放回』」之策略，以及該 source change
**現在做還是 defer**。

非目的（本 phase 一律不做）：

- ❌ 不改 `include-in-listings.js` / `include-in-sitemap.js` / `page-type-robots.js` / 任何 selector / validator / build
- ❌ 不改任何 post frontmatter
- ❌ 不 build / deploy / dev / preview / `--apply` / `dryRun:false`
- ❌ 不動 validation baseline / 不 sync CLAUDE.md / MEMORY.md
- ❌ 不宣稱 live behavior 改變、不宣稱 Blogger / GitHub 後台已驗證

---

## 1. 現況 source behavior（read-only 盤點，三條 selector）

三條 selector 皆為純函式、零依賴（除同目錄 `platform-policy-effective.js`），互不推導。

### 1.1 `src/scripts/include-in-listings.js`（站內列表）

供 surfaces：`build-github.js` 之 `listingPosts`（home `index.html` / post-list `posts/index.html` /
category / tag / prev-next 鏈）。`resolveIncludeInListings(post)` precedence：

| 條件 | 結果 |
| --- | --- |
| top-level `includeInListings === false` | **exclude**（最高優先；policy true 不放寬） |
| `platformPolicy.github.includeInListings === false`（source==='override'） | **exclude** |
| true / 缺省 / 非 boolean / inherit / invalid / secret / absent | **include（預設）** |

🔑 **關鍵**：listing selector **不**由 `contentKind` / `pageType` / `seo.indexing` /
`includeInSitemap` / `includeInFeeds` / gatedDownload 推導排除。原始碼 §邊界（L13–L19）明文：
「legacy download 自動隱藏屬另開之 content migration / policy phase，非 SP-4a / SP-9b 範圍」。

→ 因此 **`contentKind: download` 之 post 目前預設仍會出現在站內列表**。

### 1.2 `src/scripts/include-in-sitemap.js`（sitemap）

供 `build-sitemap.js`（L134：`if (!shouldIncludeInSitemap(post)) continue;`）。

`isSitemapEligible(post)`（既有 SEO-1 / SEO-2 safety，**永遠優先**）：

1. `seo.indexing ∈ {noindex-follow, noindex-nofollow}` → **exclude**
2. `seo.indexing !== 'index'` 且 `contentKind === 'download'` → **exclude（legacy）**
3. 其餘 → eligible

eligible 之後：top-level `includeInSitemap === false` 或 `platformPolicy.github.includeInSitemap === false`
→ exclude。safety exclusion 不可被任何 override 放寬。

→ 因此 **`contentKind: download`（未顯式 `seo.indexing: index`）目前預設即自動排除於 sitemap**。

### 1.3 `src/scripts/page-type-robots.js`（robots meta）

供 `build-github.js`（L306：`seo.robots = resolvePostDetailRobots(post, seo.robots)`）。
`resolvePostDetailRobots` precedence（高→低）：

1. explicit `seo.indexing`（index / noindex-follow / noindex-nofollow）
2. legacy `contentKind === 'download'` → **`noindex, follow`**（SEO-1 fallback，不可被 pageType 放寬）
3. `pageType` 推導：`download` / `gated_download` → `noindex, follow`；`utility_hidden` → `noindex, nofollow`；`redirect_canonical` → `noindex, follow`
4. 既有 default（通常 `index, follow`）
5. `platformPolicy.github.indexing` **tighten-only** override（永不放寬）

→ 因此 **`contentKind: download` 之 post 目前預設即自動 `noindex, follow`**。

### 1.4 核心 asymmetry（本 preanalysis 的根本問題）

| 面向 | `contentKind: download` 預設行為 | 來源 |
| --- | --- | --- |
| robots meta | **noindex, follow（自動）** | page-type-robots §2 |
| sitemap | **排除（自動）** | include-in-sitemap `isSitemapEligible` §2 |
| 站內列表 listing | **仍納入（不自動排除）** | include-in-listings（不讀 contentKind） |
| post-detail 頁 | 仍生成、仍可訪問 | build-github L639 全量 loop |

即：download 頁「對搜尋引擎隱藏（noindex + 不入 sitemap）」，但「對站內訪客仍會在列表出現」。
這個不對稱是 **SP-4a 刻意設計**（listing selector 保守，不由 contentKind 推導），非 bug。
本 preanalysis 即評估是否要把此不對稱收斂。

---

## 2. 現況 validator behavior（warning-only，已 landed）

`validate-content.js` 已有以下 warning-only 規則（皆不改 build 行為）：

| rule id | 觸發條件 | 備註 |
| --- | --- | --- |
| `download-content-should-be-noindex` | `contentKind==='download'` 且 `seo.indexing ∉ {noindex-follow, noindex-nofollow}` | ready/published only；S1/S2 merge |
| `page-gated-download-indexed` | `pageType==='gated_download'` 且 `seo.indexing==='index'` | |
| `page-gated-download-in-listings` | `pageType==='gated_download'` 且 **`includeInListings === true`（顯式）** | 只看顯式 true |
| `page-noindex-in-sitemap` | `seo.indexing` noindex-* 且 **`includeInSitemap === true`（顯式）** | 正交危險組合 |
| `page-noindex-in-listings` | `seo.indexing` noindex-* 且 **`includeInListings === true`（顯式）** | 正交危險組合 |

🔑 **重要 nuance**：`page-gated-download-in-listings` 與 `page-noindex-in-listings` **只在作者
顯式寫 `includeInListings: true` 時觸發**；對「預設（缺欄位）被納入列表」之 download / noindex 頁
**不**觸發任何 warning。

→ 意涵：今日一篇 noindex 的 download 頁靠預設留在列表中，**validator 完全靜默**；validator
只在有人「明示把 noindex / gated 頁 opt-in 進列表」時才警告。這與 §3 inventory 結論一致
（目前 0 個 production post 顯式設 `includeInListings`，故 0 觸發）。

---

## 3. 現況 content inventory（production，排除 validation-fixtures）

### 3.1 `contentKind: download`（production 共 3 檔）

| 檔案 | site | status / draft | seo.indexing | loader 是否載入 | listing | sitemap | robots |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | blogger | draft / `draft:true` | （無） | ❌ 不載入（draft 過濾；且 blogger 非 GitHub listing 來源） | — | — | — |
| `content/github/posts/20260504-portable-blog-system-mvp.md` | github | ready / `draft:false` | `noindex-follow`（顯式） | ✅ 載入 | **納入** | **排除** | `noindex, follow` |
| `content/templates/blogger-download-template.md` | （template） | draft | （無） | ❌ 不載入（`content/templates/` 不在 loader glob） | — | — | — |

loader（`load-posts.js`）只掃 `content/{site}/posts/**` 與 `content/{site}/pages/**`，且
`draft===true` 或 `status ∉ {ready, published}` 即排除。→ **唯一進入 GitHub build 的 production
download post = `portable-blog-system-mvp.md`**。

### 3.2 其餘欄位（production）

| 搜尋目標 | production 命中 |
| --- | --- |
| `pageType:`（任何值，含 download / gated_download / utility_hidden） | **0** |
| `robots: noindex` | **0** |
| `indexing: false` | **0** |
| `seo.indexing` noindex-* | 1（`portable-blog-system-mvp.md`，noindex-follow） |
| `includeInListings:` | **0** |
| `includeInSitemap:` | **0** |
| `platformPolicy:` | **0** |

→ 所有 production post 之三條 selector 均跑「預設路徑」；無任何 post 顯式 opt-in / opt-out
listing / sitemap / policy。`pageType` 在 production 完全未使用（僅存在於 fixtures）。

### 3.3 唯一受影響 live post 的完整現況（`portable-blog-system-mvp.md`）

- 性質：GitHub 技術站「開發筆記」（`category: tech-note`），卻標 `contentKind: download`，並
  **刻意**顯式 `seo.indexing: noindex-follow`（frontmatter 註解自陳：同時走 SEO-1 fallback 與
  SEO-2 explicit 兩路徑作測試/示範）。
- listing：**目前在列表中**（home / post-list / category=tech-note / tag / prev-next）。
- sitemap：**目前排除**（noindex-follow → not eligible）。
- robots：**`noindex, follow`**（contentKind fallback 與 explicit 一致）。
- detail 頁：仍生成、可訪問。
- validator：**0 觸發**（seo.indexing 已是 noindex-follow → `download-content-should-be-noindex`
  不觸發；未顯式 `includeInListings: true` → `page-noindex-in-listings` 不觸發）。

→ 此 post 的「意圖」本身曖昧：它是技術 dev-note，被標 download 主要為示範 SEO-1/SEO-2 路徑，
**並非**典型教具下載漏斗頁。它要不要留在站內列表，是**內容意圖判斷**，不是純技術問題（見 §5）。

---

## 4. 若未來規則改為「`contentKind: download` 預設不入列表」之影響評估

假設未來 `resolveIncludeInListings` 改為：`contentKind === 'download'`（與/或 pageType
download / gated_download）預設 **exclude**，須顯式 `includeInListings: true` 才放回。

### 4.1 對 live posts 的實際 diff

| post | 現況 listing | 規則改後 listing | 須 opt-in 才能保現狀？ |
| --- | --- | --- | --- |
| `portable-blog-system-mvp.md` | 納入 | **移除** | ✅ 須補 `includeInListings: true` 才維持現狀 |
| phonics（blogger / draft） | 不載入 | 不載入 | 無差異（未 live） |
| template | 不載入 | 不載入 | 無差異 |

→ **唯一行為變化的 live post = `portable-blog-system-mvp.md`**：會自 home / post-list /
category(tech-note) / tag / prev-next 移除（detail 頁仍生成、仍可訪問）。

### 4.2 是否須 explicit opt-in 以保留現狀

是 —— 若要維持 `portable-blog-system-mvp.md` 現有「在列表中」的行為，**必須**在其 frontmatter
補 `includeInListings: true`。但「是否真的要它留在列表」本身未定（§3.3 / §5）。

### 4.3 對 sitemap / robots 的影響

**無**。本假設規則只動 listing selector；sitemap（已自動排除 download）與 robots（已自動 noindex）
不受影響、維持現狀。三維度正交。

### 4.4 對 validation baseline 的影響

行為層 selector 改動本身不改 validator 數值；但若同步新增「download 預設在列表」warning（§6 slice 1），
或 backfill `includeInListings: true`，則 fixtures / baseline 須重量測（本 phase 不做、不預測數值）。

---

## 5. 建議：source change 現在做還是 defer

### 結論：**DEFER（現在不改 source）**

理由：

1. **影響面極小且意圖曖昧**：唯一受影響 live post 是技術 dev-note（非教具下載漏斗頁），
   自動把它隱出列表可能是錯的；缺乏明確內容需求驅動。
2. **破壞 SP 線核心不變式**：SP-4a / SP-9b 全線建立在「預設 byte-identical，只有顯式 flag 才改變」
   之上（selector 註解多處明文不由 contentKind 推導）。改預設＝打破此 invariant，影響 home /
   post-list / category / tag / prev-next 全列表面，須重 baseline + byte-diff dist，成本與風險不對稱。
3. **無真實教具下載內容 live**：唯一真正的教具下載頁（phonics）仍 draft / blogger，未進 GitHub build；
   在沒有真實 download 內容上線前改預設，是為假想需求預先工程化（違反 CLAUDE.md §1「避免過度工程化」）。
4. **已有 warning-only 路徑可先用**：若只是想「讓人注意到 download 頁留在列表」，更便宜的第一步是
   validator warning（§6 slice 1），而非行為變更。
5. **保守落地偏好**（per `memory/feedback_conservative_landing.md`）：warning-only / additive /
   opt-in 路線優先於改既有預設行為。

### Trigger 條件（何時 defer 應解除）

當以下任一成立，再開實作 phase 評估：

- 真實教具下載 / gated 頁（如 phonics）要 live 上 GitHub 站，且作者明示「不要進列表」；
- 作者明確決定 `portable-blog-system-mvp.md` 不應在列表中；
- download / gated 頁數量成長到「預設納入列表」造成實際 SEO / UX 問題。

---

## 6. 未來 implementation slices（若 defer 解除，建議順序）

採 opt-in 模型（download 預設 exclude、顯式 `includeInListings: true` 放回），分三薄片，逐片可獨立 acceptance：

1. **Slice 1（validator，warning-only，最保守）**
   新增 warning（暫名 `download-in-listings-default`）：`contentKind==='download'`（與/或
   pageType download / gated_download）且 `includeInListings` **缺省（非顯式 false/true）** → warning，
   提示「download 頁預設仍在列表，請顯式宣告 includeInListings 意圖」。
   - 補既有 gap：現有 `page-noindex-in-listings` / `page-gated-download-in-listings` 只看顯式 true，
     不覆蓋「靠預設留在列表」之情況；本 slice 補上 default-case 可見性，且**不改 build 行為**。
   - 須新增 fixtures、重量測 baseline。

2. **Slice 2（selector，opt-in 行為變更）**
   改 `resolveIncludeInListings`：`contentKind==='download'`（與/或 pageType download / gated_download）
   預設 exclude，顯式 `includeInListings: true` 放回。
   - 前置：對「要留在列表」之 download post backfill `includeInListings: true`
     （今日唯一候選 = `portable-blog-system-mvp.md`，待作者決定）。
   - 須 byte-diff `dist/`、重量測 baseline、更新 SP selector 註解之邊界宣告。
   - top-level 顯式 false 與 `platformPolicy.github.includeInListings === false` precedence 不變。

3. **Slice 3（content migration）**
   當真實教具下載 / gated 頁 live 時，逐篇顯式宣告 `includeInListings` 意圖（in / out）。

### 未來建議 phase title（若日後實作）

- Slice 1：`20260XXX-sp-download-in-listings-default-warning-validator-a`
- Slice 2：`20260XXX-sp-download-default-exclude-listings-opt-in-selector-a`

（實際日期前綴以落地當日為準；本 preanalysis 不預先佔位、不啟動。）

---

## 7. ambiguity / 未決事項（記錄，不臆測）

- `portable-blog-system-mvp.md` 是否「應」留在站內列表 = **未定**（內容意圖，須作者裁定；本文不替決）。
- Slice 2 的觸發集合要否含 `pageType ∈ {download, gated_download}`（而非只 `contentKind: download`）=
  **未定**（pageType 在 production 目前 0 使用；待真實內容出現再定）。
- 是否同時把 `utility_hidden` / `redirect_canonical` 納入「預設不入列表」= **未定**（超出本 phase 範圍）。

以上未決項不在本 docs-only phase 解決；如需推進，各自另開 phase + explicit approval。

---

## 8. 本 phase 明確非動作（non-actions）

- no source changes（`include-in-listings.js` / `include-in-sitemap.js` / `page-type-robots.js` /
  `validate-content.js` / `build-*.js` 一律未動）
- no content changes（無 frontmatter 改動）
- no existing docs changes（僅新增本檔一份）
- no CLAUDE.md / MEMORY.md changes
- no package / lockfile changes
- no build / deploy / dev / preview
- no validation baseline sync（§3a 數值未變動）
- no generated output（dist / dist-blogger / dist-promotion / gh-pages / .cache 未動）
- no Admin write path / `--apply` / `dryRun:false`
- no Blogger / GA4 / AdSense / Search Console / Drive / Google Form backend action
- no force-push / amend / rebase
