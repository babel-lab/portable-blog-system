# 20260522 GA4 Click Tracking Manual Validation Record

本文件為 **2026-05-22 GA4 click tracking deploy 後之手動驗收紀錄**；屬今日工作之收斂 / 留檔；不啟動任何後續實作。

對應上層：
- 今日終態 phase：`20260522-ga4-inline-attrs-push-and-deploy-a`（push + deploy 完成）
- 今日 final idle：`20260522-final-idle-freeze-after-ga4-deploy-a`
- 對應規格 docs：`docs/click-tracking-governance.md` / `docs/ga4-link-tracking-spec.md` / `docs/ga4-parameter-naming-registry.md`

---

## §1 背景

### 1.1 Commits 對應

| 維度 | 值 |
|---|---|
| **Source commit** | `1bbedc4 fix(ga4): inline click tracking attrs in post detail` |
| **Deploy commit** | `bc5e6fd deploy: 1bbedc4 snapshot (GA4 click tracking inline attrs)` |
| **Source branch** | `main`（已 push 至 `origin/main`）|
| **Deploy branch** | `gh-pages`（已 push 至 `origin/gh-pages`）|
| **GA4 measurementId** | `G-C77SMPF8VD`（per 5/21 pm-45 enable；user 已 Realtime 驗收通過）|

### 1.2 主要驗收 URL

```
https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/
```

對應 Pages 形式為 **project site**（含 `/portable-blog-system/` subpath；per `dist/sitemap.xml` 之 absolute URL 結構）。

### 1.3 改動範圍摘要

- `src/views/pages/post-detail.ejs`：4 處 `<a>` 開始 tag 直接 inline 寫 GA4 attrs（取代原 `<%- include('../tracking/ga4-events-helper', ...) %>`）
- helper 本體 `src/views/tracking/ga4-events-helper.ejs` 保留為 future fallback；當前實際 render 不依賴
- attrs 共 4 位置（affiliate top / affiliate bottom / relatedLinks / otherLinks）；event 對應 3 種（`click_affiliate_cta` / `click_related_link` / `click_other_link`）
- helper / include / await EJS async 議題已繞開（per stop-and-report 系列 `20260522-deploy-ga4-validation-a` / `20260522-ga4-helper-include-await-fix-a` / `20260522-ga4-helper-include-await-fix-single-line-a` 之發現）

---

## §2 已確認項目

### 2.1 GitHub Pages 可開啟

| 項目 | 確認 |
|---|---|
| 主驗收 URL `https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/` 可正常開啟 | ✅ |
| 頁面 render 完整（無 SCSS / JS 載入錯誤）| ✅（per user 觀察）|
| `dist/sitemap.xml` absolute URL 對齊 project site 結構 | ✅（pre-deploy 確認）|

### 2.2 DOM Attr Validation（DevTools Elements 階段）

✅ **6 個預期 attrs 全部渲染**於 relatedLinks anchor：

| Attr | 預期值 | 確認 |
|---|---|---|
| `data-ga4-event` | `click_related_link` | ✅ |
| `data-ga4-param-post_slug` | `we-media-myself2` | ✅ |
| `data-ga4-param-link_label` | `貝果書屋-AI玩轉自媒體的52個商業思維` | ✅ |
| `data-ga4-param-link_type` | `internal` | ✅ |
| `data-ga4-param-link_url` | `<UTM-injected Blogger URL>` | ✅（截斷顯示）|
| `data-ga4-param-outbound` | `false` | ✅ |

→ inline attrs 渲染**完整**；無 `[object Promise]` 殘留；EJS escape 正常。

### 2.3 GA4 Realtime — Page Path（站內流量）

✅ GA4 即時頁面已觀察到 **2 個 page paths**：

| Page path | 含義 |
|---|---|
| `/portable-blog-system/posts/we-media-myself2/` | GitHub Pages 端文章頁載入 |
| `/2026/04/we-media-myself.html` | Blogger 端文章頁載入（user 點擊 relatedLinks anchor 後跳轉抵達；UTM 已透過既有 GitHub→Blogger cross-link UTM 機制注入）|

→ Cross-site flow（GitHub → Blogger）**初步通過**；兩平台 `gtag.js`（共用 `G-C77SMPF8VD`）皆已 fire `page_view` event。

---

## §3 尚待確認項目

⏸ **以下項目當前 pending；不視為驗收完全通過**。

### 3.1 GA4 DebugView / Events — `click_related_link` Event 明細

| 項目 | 狀態 |
|---|---|
| `event_name = click_related_link` 是否在 GA4 DebugView / Events report 出現 | 🟡 **pending**（user 尚未提供截圖或明細）|

### 3.2 GA4 Event Parameters 完整性

點擊 anchor 後，GA4 後台應收到 5 個 params：

| Param | 預期值 | 狀態 |
|---|---|---|
| `post_slug` | `we-media-myself2` | 🟡 pending |
| `link_label` | `貝果書屋-AI玩轉自媒體的52個商業思維` | 🟡 pending |
| `link_type` | `internal` | 🟡 pending |
| `link_url` | UTM-injected Blogger URL | 🟡 pending |
| `outbound` | `false` | 🟡 pending |

→ 5 params 之 GA4 後台接收狀態屬待驗證；需 user 於 DebugView 觀察事件明細後確認。

### 3.3 GA4 後台驗收 SOP（建議路徑）

| Step | 操作 |
|---|---|
| 1 | 安裝 [GA Debugger Chrome 擴充](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) → toggle ON |
| 2 | GA4 後台（`G-C77SMPF8VD`）→ Admin → DebugView 開啟 |
| 3 | 重訪 we-media-myself2 文章頁 |
| 4 | 點擊「貝果書屋」relatedLinks anchor |
| 5 | 切回 GA4 DebugView，1-3 秒內應看到 `click_related_link` event + 5 params 明細 |

⚠️ 若無 GA Debugger 擴充，可走 GA4 Realtime → Events report → filter `event_name=click_related_link`（資料延遲 30-60 秒）。

---

## §4 驗收判定

| 維度 | 判定 |
|---|---|
| **DOM attr validation**（DevTools Elements）| ✅ **通過**（6 attrs 全部渲染；EJS escape 正常；無 broken Promise）|
| **Page routing / cross-site flow**（GA4 Realtime page_view）| ✅ **初步通過**（GitHub Pages 端 + Blogger 端兩 page paths 皆觀察到 visit；既有 UTM 機制保持作用）|
| **GA4 event-level validation**（DebugView / Events `click_related_link`）| 🟡 **pending**（待 user 於 GA4 後台明細確認）|

### 4.1 整體判定

🟡 **部分驗收通過；不宣稱完全驗收**。

判定理由：
- DOM 端 attr 渲染確認 → source / build / deploy 鏈路 OK
- page_view 已從兩平台 fire → GA4 measurement 鏈路 OK
- 但 `click_related_link` event 本身之送達確認尚未完成 → listener fire + gtag dispatch + GA4 接收之最後一段未驗

→ 整體屬「**80% 驗收**」；event-level 驗收完成前不宣稱 GA4 click tracking 上線完整成功。

---

## §5 明日建議

### 5.1 優先：補 event-level validation

⭐ 明日（5/23 或之後）第一優先：
- user 於 GA4 DebugView 重點 we-media-myself2 之 relatedLinks anchor → 觀察 `click_related_link` event + 5 params 明細
- 若觀察到 ✅ → 整體驗收**完全通過**；GA4 click tracking 上線確認
- 若未觀察到 🔴 → 故障排除（per §6 之 rollback / debug 路徑）

### 5.2 若 click_related_link 成功

可考慮**依優先序**啟動下一批：

| # | 候選 | 性質 | risk | 推薦度 |
|---|---|---|---|---|
| 1 | **content metadata 補完**（補某文之 `otherLinks: [...]`） | content | 🟢 低 | ⭐ 最低成本擴大 GA4 event coverage（驗收 `click_other_link`）|
| 2 | **Blogger → GitHub reverse UTM implementation** | source（multi-file）+ deploy | 🟢 低 | 推薦；per `blogger-to-github-reverse-utm-plan.md` §10 之 7 步 |
| 3 | **`content/settings/tags.json` 建立**（hashtag click tracking 之第一步） | source | 🟡 中（schema 新增 + tag backfill）| 視 user 對 hashtag click 之優先序 |
| 4 | 啟用某 book review post 之 `affiliate.enabled=true` | content | 🟢 低 | 可順帶驗收 `click_affiliate_cta` event |

### 5.3 不建議立即啟動

| # | 項目 | 不建議理由 |
|---|---|---|
| 1 | **Blogger listener implementation** | per `blogger-listener-strategy.md` §5.1：短期推薦先採 reverse UTM；listener 等 1-2 週觀察 GitHub click event 流量後再評估 ROI |
| 2 | **Debug EJS async issue**（helper 之 await/include 議題）| 屬研究性質；當前 inline attrs 已繞開；非阻擋；非當前 ROI 重點 |
| 3 | **hashtag span→a + click_hashtag attr** | 屬 hashtag rollout 第 #3-#5 步；前置 #1（tags.json）未啟動；待 #1 完成後再評估 |
| 4 | **`tag_click` vs `click_hashtag` event name reconcile**（CLAUDE.md §5 / `ga4.config.json`）| 屬獨立 governance decision；無 user 表態前不啟動 |

---

## §6 Rollback Notes

⚠️ 若明日 event-level validation 失敗 / GA4 click tracking 出現 production 問題，可採以下 rollback：

### 6.1 Source Rollback

```bash
# source repo
git revert 1bbedc4    # revert inline attrs commit
# 或：git reset --hard 4924e85    （DANGER：force-equivalent；不建議）
git push origin main  # 同步 revert 至遠端
```

→ source HEAD 回 `4924e85`（before inline attrs）；GA4 attrs 自 dist 移除。

### 6.2 Deploy Rollback

```bash
# deploy repo
cd /d/github/blog-new/portable-blog-deploy
git revert bc5e6fd    # revert deploy snapshot
# 或：git reset --hard f32f7d3    （force-equivalent；需配合 force-push；不建議）
git push origin gh-pages
```

→ deploy HEAD 回 `f32f7d3`（5/21 pm-45 snapshot；GA4 enable 但無 click attrs）。

### 6.3 GitHub Pages 線上 Propagation

- Deploy rollback 後 1-5 分鐘 propagation；user 之瀏覽器可能 cache（需 hard-refresh）
- GA4 端 event 停止（attrs 移除 → listener 無法 fire）；既有 GA4 measurement 不受影響

### 6.4 何時應 rollback

| 症狀 | 處理 |
|---|---|
| GA4 出現大量錯誤 events / 污染 dimension | 立即 rollback（per §6.1 + §6.2）|
| `[object Promise]` 殘留於 dist（regression） | 立即 rollback；不應發生 |
| GitHub Pages 404 / 顯示錯誤 | 確認 GitHub Settings → Pages 設定；非 source 議題不需 rollback |
| event 未 fire（無流量但無錯誤） | 不 rollback；屬 listener / gtag 議題；先排查（per §3.3 SOP）|

⚠️ **預設不 rollback**；當前狀態已通過 DOM + page_view 兩層驗收；event-level 為待確認，非已知失敗。

---

## §7 完整 Commits 對照（今日 5/22）

### Source（origin/main HEAD = `1bbedc4`）

```
1bbedc4 fix(ga4): inline click tracking attrs in post detail   ← 本批驗收對象
4924e85 docs(readme): index blogger to github reverse utm plan
beff309 docs(ga4): plan blogger to github reverse utm
735a308 docs(readme): index blogger listener strategy
82400c7 docs(ga4): document blogger listener strategy
88d714f docs(readme): index hashtag slug decision
f61f58d docs(ga4): document hashtag slug decision
aa7b594 feat(ga4): track github related and other link clicks
```

### Deploy（origin/gh-pages HEAD = `bc5e6fd`）

```
bc5e6fd deploy: 1bbedc4 snapshot (GA4 click tracking inline attrs)   ← 本批驗收對象
f32f7d3 deploy: 09b9a67 snapshot (GA4 enabled)                       ← 上次 deploy（5/21）
```

---

## §8 Cross-links

- `docs/click-tracking-governance.md` — GA4 click tracking 治理 spec（attr / event / param 命名）
- `docs/ga4-link-tracking-spec.md` — GA4 / UTM / link tracking 規格
- `docs/ga4-parameter-naming-registry.md` — snake_case naming registry
- `docs/ga4-enable-preflight.md` — GA4 啟用 preflight + user checklist
- `docs/hashtag-slug-decision.md` — hashtag slug 派生策略（deferred 之 #3-#5）
- `docs/blogger-listener-strategy.md` — Blogger 端 listener strategy（短期推薦不做；長期評估）
- `docs/blogger-to-github-reverse-utm-plan.md` — Blogger → GitHub reverse UTM impl 計畫
- `docs/github-deploy.md` — GitHub Pages 部署 runbook（§5.4 即既有 deploy pattern）
- `CLAUDE.md` §2.2（GitHub Pages 站定位）/ §5（既有 GA4 events）/ §16.4（cross-link UTM）

---

（本文件結束）
