# Blogger AdSense — Second Post Readiness Packet

Phase: `20260611-night-3-blogger-adsense-second-post-readiness-docs-only-a`

## 1. Status

- **docs-only readiness packet**
- 本 phase **不** repost / paste / publish / build mutation / deploy / Blogger 後台 / AdSense 後台 / template / source / config / package / check script 變更。
- 目的：為「第二篇」Blogger AdSense 候選文章建立 readiness 框架，**未開放**實際重貼；未來實際重貼仍須另行 explicit approval。
- 重要結論預告（§4）：**截至本 phase，repo 內無第二篇可直接重貼的 full-mode ready Blogger post**；本 packet 同時記錄 **gap + 候選決策** 兩部分。

> ⚠️ 本文件不含 real AdSense client / slot id；一律 `slotKey`（`articleAd6`）/ `ca-pub-…****` masked。real id 僅存於 `content/settings/ads.config.json`。

---

## 2. Baseline

| 項目 | 值 |
|---|---|
| HEAD / origin/main | `0adc053` |
| latest subject | `test(adsense): guard blogger bottom article ad output` |
| working tree | clean |
| `npm run validate:content` | 0 errors / 94 warnings / 84 posts |
| `npm run check:adsense-resolver` | 34 passed / 0 failed |
| `npm run check:adsense-article-block` | 13 passed / 0 failed |
| `npm run check:adsense-anchor-wiring` | 14 passed / 0 failed |
| `npm run build:blogger` | success（3 ready posts） |
| `npm run check:blogger-adsense-output` | 14 passed / 0 failed（target = `we-media-myself2` 單篇） |

See also：
- `docs/20260611-blogger-adsense-phase-d-single-post-repost-plan.md`（pm-11 計畫）
- `docs/20260611-blogger-adsense-phase-d-readiness-packet-handoff.md`（pm-13 handoff packet）
- `docs/20260611-blogger-adsense-phase-d-manual-post-verification-record.md`（night-1 verification PASS）
- `src/scripts/check-blogger-adsense-output.js`（night-2 Phase E guard，單篇）

---

## 3. 為什麼要選第二篇

1. Phase D 已單篇驗收（`we-media-myself2`）；live AdSense 觀察到至少一次成功 fill。
2. Phase E 之 repo-side guard（`check:blogger-adsense-output`）**僅檢查** `we-media-myself2`；長期 staticscheck 需要更廣覆蓋面。
3. 第二篇 Blogger AdSense 文章重貼可：
   - 驗證 articleAd6 / beforeRelatedLinks anchor 在不同內容形態（非書評）下仍正確輸出。
   - 為未來 guard 參數化（讓 `check-blogger-adsense-output.js` 接受多 slug / 多 HTML path）提供第二個樣本。
   - 累積跨文章 fill rate 觀察。

**不**為下列原因：
- 不是為了批次重貼（本 phase 仍只討論「第二篇」單篇）。
- 不是為了擴大 anchor 啟用範圍（`articleAd1`–`5` 仍 pages-only；Blogger surface 仍僅 `articleAd6` / `beforeRelatedLinks`）。

---

## 4. Current ready Blogger post landscape（dist-blogger 實況）

`npm run build:blogger`（`build-manifest.json`，HEAD `0adc053`）回報之 3 篇 ready post：

| # | slug | sourceSite | bloggerMode | 用 EJS template | dist `lab-ad-slot--articleAd6` count | dist `articleAd1..5` count |
|---|------|-----------|-------------|----------------|--------------------------------------|---------------------------|
| 1 | `we-media-myself2` | `blogger` | **full** | `blogger-post-full.ejs` | **1**（Phase D） | 0 |
| 2 | `github-pages-blog-planning` | `github-cross` | summary | `blogger-post-summary.ejs` | 0 | 0 |
| 3 | `portable-blog-system-mvp` | `github-cross` | summary | `blogger-post-summary.ejs` | 0 | 0 |

實測 grep（本 phase read-only）：
- `dist-blogger/posts/we-media-myself2/post.html`：1 個 `lab-ad-slot--articleAd6`、0 個 articleAd1–5（與 Phase E guard 一致）
- `dist-blogger/posts/github-pages-blog-planning/post.html`：0 個 articleAd6、0 個 articleAd1–5
- `dist-blogger/posts/portable-blog-system-mvp/post.html`：0 個 articleAd6、0 個 articleAd1–5

### 4.1 為什麼 summary-mode post 沒有 articleAd6

- `build-blogger.js` 之 `renderFullPost(...)` 是唯一接收 `settings` 並計算 `adsenseBlocksRendered = deriveRenderedAdsenseBlocks(post, settings.ads, 'blogger')` 的 path（Phase 20260611-pm-10，commit `2b1f166`）。
- `renderSummaryPost(...)` 與 `renderRedirectCardPost(...)` **不**接 `settings` / **不**計算 `adsenseBlocksRendered`；對應 `blogger-post-summary.ejs` 模板也**沒有** AdSense anchor 注入點。
- → 任何 `publishTargets.blogger.mode: "summary"` 的 post **by construction 不會** render Blogger AdSense block。
- 設計如此正確（per CLAUDE.md §2.1：summary = 摘要導流 + redirect-card，不是主內容）。

### 4.2 Filtered-out（非 ready；不在本 phase 範圍）

`build-manifest.json` 之 `filteredOut[]`（6 筆，全部 `status:draft` 或 `draft:true`）：
- `content/blogger/posts/20260504-sample-book-review.md`（draft）
- `content/blogger/posts/20260525-draft-book-review.md`（draft）
- `content/blogger/posts/20260529-phonics-practice-sheet-download.md`（draft）
- 三個 `.fb.md`（promotion sidecar；非主文章）

→ 這些不屬「目前 build:blogger 會輸出的 ready post」；不列為候選。

---

## 5. 候選分析

### 5.1 不選 `we-media-myself2`

Phase D 已用過此篇（live repost + manual verification PASS at 20260611 22:59）。第二篇按定義須不同文章。

### 5.2 不選 `portable-blog-system-mvp`

- 雖為 ready，但 `seo.indexing: "noindex-follow"`（per content frontmatter §`seo`）→ Google 不會 index。
- Blogger AdSense 政策上仍可顯示廣告於 noindex 頁，但站方 SEO 意圖明顯為「不希望此頁被搜尋曝光」→ 與「累積 AdSense 觀察樣本」之 readiness 目的不符。
- → **不**推薦此篇作為第二篇候選。

### 5.3 推薦候選：`github-pages-blog-planning`（含 prerequisite）

| 屬性 | 值 |
|---|---|
| slug | `github-pages-blog-planning` |
| title | GitHub Pages 免費空間限制與部落格規劃 |
| source markdown | `content/github/posts/20260504-github-pages-blog-planning.md` |
| dist HTML（current） | `dist-blogger/posts/github-pages-blog-planning/post.html` |
| sourceSite | `github-cross`（GitHub 主寫、cross-publish 至 Blogger） |
| current `bloggerMode` | **summary**（per frontmatter `publishTargets.blogger.mode: "summary"`） |
| contentKind | `tech-note` |
| primaryPlatform | `github` |
| category | `tech-note` |
| seo.indexing | （無顯式 noindex；走 SEO-1 fallback；應可 index） |
| 目前 dist 是否含 articleAd6 | **否**（summary mode；§4.1） |

**Why（為什麼推薦）**：
- Ready 狀態，build:blogger 已輸出 stub。
- 非書評，與 Phase D 之 book-review 內容形態不同 → 廣覆蓋 AdSense surface 驗證價值。
- 沒有 noindex-follow 旗標。

**🔴 Prerequisite（重貼前必要 content-change phase）**：
1. **Frontmatter flip**：`publishTargets.blogger.mode: "summary"` → `"full"`（content change；本 phase 範圍外）。
2. 重新 `npm run build:blogger` 後，dist HTML 才會經 `blogger-post-full.ejs` 渲染並注入 `articleAd6` / `beforeRelatedLinks`。
3. 同時須評估：原 cross-publish 意圖是「導流回 GitHub Pages」。改為 full 後，內容會完整同時存在於 Blogger 與 GitHub Pages → 須處理 `canonical`（已 auto，預期指向 GitHub Pages，per `build-blogger.js` `resolveCanonicalUrl`）+ 內容重複問題。

**Phase D-equivalent acceptance prerequisite**：
- Blogger theme CSS readiness（per Phase D §6）：`.lab-affiliate-box` / `.adsbygoogle` / `.lab-ad-slot--articleAd6` / `.lab-related-links*` — 應與 Phase D PASS 後一致。
- 但此篇 GitHub-source post **可能無 affiliate / commerce block**（須讀取完整 markdown 再判斷），與 we-media-myself2 不完全同形 → guard 之「affiliate-box 存在」斷言若沿用本 slug 會 fail。

### 5.4 替代候選：先 promote 一篇 draft full-mode post

- `content/blogger/posts/20260504-sample-book-review.md`（draft）
- `content/blogger/posts/20260525-draft-book-review.md`（draft）

任一切為 ready 後即為 full-mode（書評）→ 與 Phase D 同形態，guard 參數化最容易。但內容是否值得發布、live Blogger 是否要新增文章 = user 決策，**非** docs-only 範疇。

---

## 6. 檢查項目 / readiness evidence summary

對 `github-pages-blog-planning` current dist HTML（即重貼前現況）：

- ✅ `build:blogger` 確實輸出該 post（`dist-blogger/posts/github-pages-blog-planning/post.html`，本 session 已 build；manifest 列為 ready）。
- ❌ output HTML 目前 **無** `articleAd6` / `beforeRelatedLinks` 相關 evidence（summary mode；§4.1）。
- ✅ output HTML 目前 **無** `articleAd1`–`articleAd5`（summary mode 完全不注入 AdSense）。
- ✅ 不需要真實 ID 寫入本 packet 或測試（本文件全文無 real id；guard 與 settings 一致機制延用 §7）。
- 🔴 → **重貼前必須先做 frontmatter mode flip（summary → full）並重新 build**，否則第二篇貼出去仍是 summary 摘要卡片，無 AdSense。

---

## 7. 後續手動 Blogger 重貼步驟草案（**僅草案；本 phase 不執行**）

### 7.1 貼哪篇

`github-pages-blog-planning`（候選；prerequisite：先 frontmatter flip 至 full 模式 + rebuild）。

### 7.2 重貼流程（mirror Phase D readiness packet §5；本 phase 不執行）

1. （prerequisite phase）將 `publishTargets.blogger.mode` 改為 `"full"` 並 `npm run build:blogger`。
2. `npm run check:blogger-adsense-output` 仍會驗 `we-media-myself2`（**預期，不代表第二篇已通過**；參 §8）。
3. 手動 grep `dist-blogger/posts/github-pages-blog-planning/post.html` 確認：
   - 1 個 `lab-ad-slot--articleAd6`
   - 0 個 articleAd1–5
   - 位置在 article body 結束後、related-links 之前（注意：此篇可能無 affiliate-box；position 斷言改為「在 body 後、related-links 前」）
4. 確認 live Blogger 目標文章 URL（user 須持有）+ 帳號 / blog + 編輯器 HTML 模式。
5. **備份**現有 live HTML（必須），記錄檔名 / timestamp / 位置。
6. 貼上生成的完整 HTML（只換 body，不動主題）。
7. 預覽：桌機 + 手機。
8. 通過才 publish / update。
9. 不碰其他文章。

### 7.3 貼完前台要看什麼

- live page source 含 `<ins class="adsbygoogle lab-ad-slot lab-ad-slot--articleAd6" ...>`（masked client / slot）。
- inline `(adsbygoogle = window.adsbygoogle || []).push({});` 存在。
- AdSense loader script 出現於 page head。
- 位置在文章 body 結束後、related-links 之前。
- 內文 / related-links / 主題視覺無破版。

### 7.4 若沒有顯示廣告時的判斷流程

mirror Phase D night-1 record §6 interpretation chain：

1. 先確認 DOM 內 `<ins>` element 與 `data-ad-client` / `data-ad-slot` 屬性存在 → 若存在但 visual blank：屬 AdSense no-fill / 暫時 serving 結果，**非實作失敗**（per Phase D §9 / night-1 §6.5）。等待 / reload / 換瀏覽器再觀察。
2. 若 DOM 內缺 `<ins>` → 檢查 Blogger 編輯器是否 strip 掉 markup（過去 Phase D 已驗證 Blogger 不 strip）；若被 strip → 排查是否 visual editor 改寫。
3. 若 `<ins>` 存在但 `data-ad-client` / `data-ad-slot` 值為空字串 / `undefined` → 本機 `npm run check:blogger-adsense-output` 應該已先 fail；表示貼了過時 build。
4. console 中 `api.pub.affiliates.one` / `aria-hidden` 屬另案（per Phase D night-1 §6.6–§6.7），與 AdSense slot 本體無關。
5. **數小時** 後 fill rate 仍 0 → 屬 AdSense 後台監控範疇，**不**在 repo-side 處理。

---

## 8. 後續 guard 參數化建議

### 8.1 本 phase 不動 guard 之原則

- `src/scripts/check-blogger-adsense-output.js` 目前 hardcode `TARGET_SLUG = 'we-media-myself2'`。
- 本 phase **保留** 該 hardcode，理由：
  1. Phase D / Phase E 之 single-target 設計 = 縮窄 surface，能精準守護「已 live-accepted 之 we-media-myself2」shape。
  2. 第二篇 prerequisite（frontmatter mode flip + rebuild）**尚未發生**；現在 hardcode 第二 slug 會在後續 build 之前 fail。
  3. multi-slug 介面（CLI 接 `--slug=` / `--html=` / config registry）的最小 design 須另獨立思考，避免「為了支援第二篇而 rushed」。

### 8.2 下一階段才考慮的 guard 參數化方向（**非**本 phase）

可能的設計選項（docs-only）：
- **Option A**：CLI 接 `--slug=<slug>` 或 `--html=<path>`；單次只跑一篇；保留 default = `we-media-myself2`。
- **Option B**：建立 `content/blogger-adsense-targets.json` registry（{slugs:[...]}），guard 跑 registry 所有 entry。
- **Option C**：擴展為遍歷所有 `bloggerMode: full` ready post，但每篇可能有條件差異（affiliate-box 不一定都有），須 per-post 斷言調整。

決策應於下一 phase 進行，且須 **第二篇 ready full-mode post 確實存在**之後。

---

## 9. 不選 `we-media-myself2` 之第二篇候選 — 重申理由

- Phase D 已使用此篇做 single-post repost。
- 若再選此篇 → 無「第二篇」之獨立樣本價值；無法擴大 guard surface；不符合 §3 目的。

---

## 10. 本 session non-actions（明確列出）

本 phase **未** 進行以下任一行為：

- ❌ 未改 source（`src/` 任何檔）
- ❌ 未改 `content/settings/ads.config.json`
- ❌ 未改 `package.json`
- ❌ 未改 `src/scripts/check-blogger-adsense-output.js`
- ❌ 未改 任何 EJS template
- ❌ 未改 任何 post markdown frontmatter
- ❌ 未操作 Blogger 後台 / 編輯器 / 預覽
- ❌ 未碰 AdSense 後台
- ❌ 未 deploy / 未 push gh-pages
- ❌ 未新增或 hardcode 真實 AdSense ID 至任何檔
- ❌ 未開啟「實際第二篇重貼」流程
- ❌ 未碰 commerce / Admin / renderer / GitHub Pages 任何流程

唯一 mutation：本 doc 自身 + `CLAUDE.md` 之 night-3 ledger sync。

---

## 11. Validation results（本 session 跑）

| 指令 | 結果 |
|---|---|
| `npm run validate:content` | 0 errors / 94 warnings / 84 posts |
| `npm run check:adsense-resolver` | 34 passed / 0 failed |
| `npm run build:blogger` | success（3 ready posts；2 summary / 1 full） |
| `npm run check:blogger-adsense-output` | 14 passed / 0 failed（**僅** target `we-media-myself2`） |

> ⚠️ `check:blogger-adsense-output` **目前僅驗 `we-media-myself2`**。本 phase **不**代表 `github-pages-blog-planning`（或任何第二篇候選）已通過 guard；guard 對第二篇候選之適用性 = §8 之未來 phase 範圍。

---

## 12. Recommended next phase

**`20260611-night-4-blogger-adsense-second-post-frontmatter-flip-and-rebuild-content-change-a`** —
content-change phase：將 `content/github/posts/20260504-github-pages-blog-planning.md` 之 `publishTargets.blogger.mode` 由 `"summary"` 改為 `"full"`，rebuild blogger，read-only 觀察 `dist-blogger/posts/github-pages-blog-planning/post.html` 是否注入 `articleAd6`；不重貼、不 deploy；本 phase 之後才可考慮 §8 guard 參數化或實際 repost。

🔴 仍須 user explicit approval：是否願意將 cross-publish summary 改為 full（內容會完整出現在 Blogger 與 GitHub Pages，須評估 SEO / canonical 互動）。

---

（本文件結束）
