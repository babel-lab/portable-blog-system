# GA4 DebugView / Realtime 手動驗證 Checklist — Article Bottom Nav

- **Phase**：`20260615-am-3-ga4-debugview-article-bottom-nav-manual-checklist-docs-only-a`
- **日期**：2026-06-15
- **性質**：**docs-only**（不改 source / 不 build / 不 deploy）
- **baseline**：`main` HEAD == origin/main == `20ada1a`（`feat(ga4): add article bottom nav tracking`）；working tree clean
- **驗證對象**：am-2 落地之 GitHub Pages 文章底部導覽（上一篇 / 下一篇 / 回首頁）GA4 tracking
- **實作位置**：`src/views/layout/article-bottom-nav.ejs`（partial）+ `src/views/pages/post-detail.ejs`（include）+ `src/scripts/build-github.js`（prev/next 推導）

> 本文件是**部署後**之人工驗證 SOP。請先完成 GitHub Pages deploy（本 phase **不** deploy），再依本 checklist 逐項點擊驗證。

---

## 1. Purpose / scope

### 1.1 驗證範圍

- ✅ **只驗證 GitHub Pages 文章詳細頁之 article bottom nav**（`lab-article-bottom-nav`：上一篇 / 下一篇 / 回首頁）。
- ✅ 確認點擊後 GA4 收到 `click_other_link` event，且 `nav_direction` / `source_slug` / `target_slug` / `target_url` / `link_label` 等參數正確。

### 1.2 明確不在範圍

- ❌ **不驗證 Blogger**（Blogger 文章頁無 Vite listener；`data-ga4-*` attr 不會 fire；per `docs/blogger-listener-strategy.md` §1.3 / §5.1）。
- ❌ **不驗證 AdSense iframe 廣告點擊**（政策；廣告點擊由 AdSense 原生處理，本系統無法、也不應追蹤）。
- ❌ **不驗證 Auto Ads**（未啟用；且 Auto Ads 點擊不得被當成自有 click）。
- ❌ **不驗證 affiliate / commerce 收益**（收益以 AdSense / 聯盟平台後台報表為準，不用 GA 偽造）。

---

## 2. Preconditions（前置條件）

| # | 條件 |
|---|---|
| 1 | 已完成 **GitHub Pages deploy**（本 phase 不 deploy；deploy 後 commit `20ada1a` 之 nav 才會上線）|
| 2 | 可開啟 **GA4 後台 → Admin → DebugView**，或 **Reports → Realtime** |
| 3 | 使用**正式網址**（`https://babel-lab.github.io/portable-blog-system/...`）或其他可實際載入 gtag.js 的環境（GA4 gating = enabled + measurementId + isProdBuild）|
| 4 | 瀏覽器**未封鎖** GA script（gtag.js / `google-analytics.com/g/collect`）|
| 5 | ⚠️ 若使用 **ad blocker / privacy blocker / 隱私瀏覽**，可能攔截 GA → DebugView 看不到事件；驗證時請暫時關閉 |
| 6 | measurementId = `G-C77SMPF8VD`（`content/settings/ga4.config.json`）；DebugView 建議搭配 GA Debugger Chrome 擴充 |

---

## 3. Test pages（三種測試頁型）

文章排序為 **date desc, slug asc**（`src/scripts/load-github-posts.js`）；index 0 為最新。導覽推導：**上一篇 = 較舊一篇（index+1）／下一篇 = 較新一篇（index−1）／回首頁恆在**。

| 頁型 | 文章 slug | 預期 nav | 缺少 |
|---|---|---|---|
| **newest article**（最新；index 0）| `we-media-myself2` | 上一篇 + 回首頁 | **無下一篇** |
| **middle article**（中間；index 1）| `github-pages-blog-planning` | 上一篇 + 下一篇 + 回首頁 | — |
| **oldest article**（最舊；index 2）| `portable-blog-system-mvp` | 下一篇 + 回首頁 | **無上一篇** |

> 以上三篇為 am-2 已實際 build 驗證之頁面（generated `.cache/pages/posts/<slug>/index.html`；0 個 `undefined`）。

正式網址：
- `https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/`
- `https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/`
- `https://babel-lab.github.io/portable-blog-system/posts/portable-blog-system-mvp/`

---

## 4. Click test matrix（逐項點擊驗證）

所有列共通：`event_name = click_other_link`、`surface = github_pages`、`click_area = article_bottom_nav`。
`target_url` 為**正式環境**（production basePath = `/portable-blog-system`）之 rendered href；dev / `vite preview` 會是無前綴形式（`/posts/...` 與 `/`）。

| # | page type | link text | expected href type | nav_direction | source_slug | target_slug | target_url（production）| link_label | expected result |
|---|---|---|---|---|---|---|---|---|---|
| 1 | newest（we-media-myself2）| **上一篇** | internal post | `previous` | `we-media-myself2` | `github-pages-blog-planning` | `/portable-blog-system/posts/github-pages-blog-planning/` | `GitHub Pages 免費空間限制與部落格規劃` | DebugView 收到 `click_other_link` + 上列 params；跳轉至該文 |
| 2 | newest（we-media-myself2）| **回首頁** | internal home | `home` | `we-media-myself2` | `home` | `/portable-blog-system/` | `回首頁` | 收到 event；跳轉首頁 |
| 3 | middle（github-pages-blog-planning）| **上一篇** | internal post | `previous` | `github-pages-blog-planning` | `portable-blog-system-mvp` | `/portable-blog-system/posts/portable-blog-system-mvp/` | `Portable Blog System MVP 開發筆記` | 收到 event；跳轉 |
| 4 | middle（github-pages-blog-planning）| **下一篇** | internal post | `next` | `github-pages-blog-planning` | `we-media-myself2` | `/portable-blog-system/posts/we-media-myself2/` | `貝果書屋-AI玩轉自媒體的52個商業思維#2(提問筆記書)` | 收到 event；跳轉 |
| 5 | middle（github-pages-blog-planning）| **回首頁** | internal home | `home` | `github-pages-blog-planning` | `home` | `/portable-blog-system/` | `回首頁` | 收到 event；跳轉首頁 |
| 6 | oldest（portable-blog-system-mvp）| **下一篇** | internal post | `next` | `portable-blog-system-mvp` | `github-pages-blog-planning` | `/portable-blog-system/posts/github-pages-blog-planning/` | `GitHub Pages 免費空間限制與部落格規劃` | 收到 event；跳轉 |
| 7 | oldest（portable-blog-system-mvp）| **回首頁** | internal home | `home` | `portable-blog-system-mvp` | `home` | `/portable-blog-system/` | `回首頁` | 收到 event；跳轉首頁 |

**negative checks（不應出現）**：
- newest 頁**不應**有「下一篇」link（無 `nav_direction="next"`）。
- oldest 頁**不應**有「上一篇」link（無 `nav_direction="previous"`）。
- 任一 link 之 `target_url` / `target_slug` / `link_label` **不應**為 `undefined` 或空字串。

> 點擊驗證建議：每點一個 link 會跳頁 → 用瀏覽器「上一頁」返回測試頁，或在新分頁開啟測試頁，再測下一個 link（見 §6）。

---

## 5. Expected GA4 event（明確口徑）

點擊 article bottom nav 任一 link 應送出：

```
event_name    = click_other_link
parameters:
  surface       = github_pages
  click_area    = article_bottom_nav
  nav_direction = previous | next | home
  post_slug     = <current post slug>        # 即 source_slug（當前文章）
  target_slug   = <target post slug | home>  # home link 為字串 "home"
  target_url    = <rendered href>            # production 帶 /portable-blog-system 前綴
  link_label    = <visible link text>        # prev/next 為目標文章標題；home 為「回首頁」
```

對照欄位語意：
- `source_slug`（規格用語）＝ event 之 `post_slug` 參數（當前文章 slug）。
- `target_slug` ＝ 目標文章 slug；回首頁固定 `home`。
- `link_label` ＝ 連結可見文字：prev/next 為目標文章標題、home 為「回首頁」。

⚠️ 命名說明：本 nav **重用既有 family B event `click_other_link`**（不新增第三套 event family；per am-1 taxonomy 決策 D2）；靠 `click_area=article_bottom_nav` + `nav_direction` 與既有 otherLinks aside 之 `click_other_link`（`placement=other_links`）區分。GA4 後台可用 `click_area` 維度切分兩者。

---

## 6. DebugView 操作步驟

1. 開 **GA4 後台 → Admin → DebugView**（或 **Reports → Realtime**）。建議同時開 GA Debugger 擴充使本機 session 進入 debug。
2. 新分頁開啟測試頁（如 newest：`https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/`）。
3. 確認頁面正常 render、底部出現「上一篇 / 下一篇 / 回首頁」導覽（依頁型應有/缺的 link，見 §3）。
4. 點擊文章底部 nav 的某一 link（例：上一篇）。
5. 回 GA4 DebugView，1–30 秒內應出現 `click_other_link` event。
6. 點開該 event → 展開 **event parameters**。
7. 逐項核對：`surface` / `click_area` / `nav_direction` / `post_slug`(source) / `target_slug` / `target_url` / `link_label` 是否符合 §4 對應列。
8. 用瀏覽器「上一頁」返回測試頁（或重開測試頁分頁），測下一個 link。
9. 依 §4 matrix 1→7 逐列完成；勾稽 negative checks（newest 無 next、oldest 無 previous）。

---

## 7. Browser console fallback（DebugView 沒看到事件時）

若 DebugView / Realtime 未出現 event，在測試頁開 DevTools 依序檢查：

| # | 檢查 | 方法 | 預期 |
|---|---|---|---|
| 1 | gtag 是否存在 | Console 輸入 `typeof window.gtag` | `"function"`（若 `undefined` → GA 未載入 / 被擋 / 非 prod gating）|
| 2 | link-tracker 是否載入 | Console 輸入 `typeof window` 後檢查 main bundle 是否載入；或在 nav link 上點擊看是否觸發 | bundle（`assets/entry.js` / main）已載入；`initLinkTracker()` 已 wire（`src/js/main.js`）|
| 3 | anchor 是否有 attr | DevTools Elements 選 nav `<a>` | 含 `data-ga4-event="click_other_link"` + `data-ga4-param-*`（surface / click_area / nav_direction / post_slug / target_slug / target_url / link_label）|
| 4 | Console 是否有 JS error | DevTools Console | 無紅色 error（若有 → 可能 bundle 載入失敗 / listener 未綁）|
| 5 | Network 是否有 collect request | DevTools Network 過濾 `collect` | 點擊後出現 `https://www.google-analytics.com/g/collect?...`（含 `en=click_other_link` 與 params）|

> listener 為 document-level delegated（`src/js/modules/link-tracker.js`）：讀 `[data-ga4-event]` + 剝 `data-ga4-param-` prefix → `trackEvent`（`ga4-events.js`，無 `gtag` 時 silent no-op）。因此 attr 正確 + gtag 存在 + 無 JS error → event 必送。

---

## 8. Failure modes / troubleshooting（異常分流）

| 症狀 | 可能原因 | 排查 |
|---|---|---|
| **event 不進 GA4** | GA 被 ad/privacy blocker 擋 / 非 prod gating / gtag 未載 / bundle 未載 | §7 #1/#2/#4/#5；關 blocker；確認用正式網址 |
| **nav_direction 錯**（如 newest 出現 next）| build 端 prev/next 推導或排序異常 | 檢視 `build-github.js` prev/next 推導（`index+1`=older→previous、`index−1`=newer→next）；重 build 比對 `.cache` 輸出 |
| **target_slug 錯** | 排序來源變動 / 推導 off-by-one | 對照 §4 matrix；確認 `load-github-posts.js` 排序未改 |
| **target_url undefined** | partial 未 guard 缺值 / slug 缺漏 | 應不會發生（partial 以 `if (prevPost && prevPost.slug)` guard；home 永遠由 basePath 推導）；若出現 → 檢視 partial guard 與 build prevPost/nextPost |
| **AdSense iframe 被當成 self click 事件** | listener 誤捕廣告點擊 | 不會：listener 只綁 `[data-ga4-event]`；AdSense iframe 無此 attr → 天然不捕；若出現異常 event 名請回報，**不得**包覆/攔截廣告 |
| **broken link**（404）| target slug 對應文章未發布 / basePath 前綴錯 | 確認目標文章已 deploy；production href 應含 `/portable-blog-system` 前綴；dev/preview 無前綴屬正常 |

---

## 9. Known limitations

- ⏱ **GA4 DebugView / Realtime 有延遲**（數秒～數十秒）；事件未即時出現不一定是失敗，稍候再看。
- 🖥 **local build / dev / preview 若無正式 GA gating**（isProdBuild=false 或無 measurementId）→ gtag 不送 event → 無法以本機驗證；須 deploy 後於正式環境驗。
- 🚫 **Blogger 沒有 listener** → 本 checklist **不適用 Blogger**（Blogger 文章頁之 `data-ga4-*` 不會 fire；如要追 Blogger 端 click 須另開 listener phase，per `blogger-listener-strategy.md`）。
- 💰 **AdSense 收益與廣告點擊**仍以 **AdSense 報表 / 自訂渠道**為準；GA 僅追自有導覽 click，不作 ad 收益替身。
- 🔢 本 checklist 之 slug / title / URL 反映 commit `20ada1a` 當下之三篇 GitHub posts；未來新增 / 刪文後排序與鄰篇會變動，matrix 須對照當時 build 輸出。

---

## 10. Recommended next phase

| Option | 內容 | 性質 |
|---|---|---|
| **A. GitHub Pages deploy + manual GA4 verification** | 依既有 deploy runbook（`docs/github-deploy.md`）部署 → 依本 checklist §4–§8 人工驗 DebugView → 產出 verification record（docs-only）| deploy + user manual；**推薦主線**（本 checklist 的直接後續）|
| **B. Blogger article bottom nav preanalysis / listener decision** | docs-only：評估是否為 Blogger 端也提供 prev/next/home（含 listener strategy A 永久不追 vs B-theme），per `blogger-listener-strategy.md` §5 | docs-only preanalysis |
| **C. GA4 custom dimensions registration checklist** | docs-only：規劃在 GA4 後台註冊哪些 event param 為 custom dimensions（`nav_direction` / `click_area` / `surface` / `target_slug` / `link_label` 等）使報表可切片，per am-1 taxonomy D8 | docs-only |

**建議**：先走 **Option A**（deploy 後實際驗證本 nav，閉環確認 GA 流量），再視結果決定 B / C。

---

## 11. Cross-links

- `docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`（am-1 taxonomy；event family 決策 / placement enum）
- `docs/ga4-link-tracking-spec.md` §12（既有 manual validation SOP）
- `docs/ga4-parameter-naming-registry.md`（event / param 命名 registry）
- `docs/blogger-listener-strategy.md`（Blogger 端無 listener 之根本不對稱）
- `src/views/layout/article-bottom-nav.ejs`（被驗證之 nav partial）
- `src/views/pages/post-detail.ejs`（include 位置：`</article>` 之後）
- `src/js/modules/link-tracker.js` / `ga4-events.js`（listener / trackEvent）
- `content/settings/ga4.config.json`（measurementId `G-C77SMPF8VD`）

---

（本文件結束）
