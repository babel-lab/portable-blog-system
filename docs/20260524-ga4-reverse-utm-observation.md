# GA4 Reverse UTM 觀察指引（Blogger → GitHub Pages）

本文件為 **Reverse UTM Blogger → GitHub Pages 之 GA4 後台觀察 SOP**；屬 docs-only / 操作支援；於 phase `20260524-am-8c-ga4-reverse-utm-observation-doc-a` 落地。

本文件**不是**啟動指令、**不是**新 spec、**不是**實作 plan；屬「reverse UTM 進入 production 後，user 在 GA4 後台應該何時、去哪裡、看什麼資料」之**長期觀察指引**。本文件之落地**不**觸發任何 content / src / build / deploy / Blogger 後台 / GA4 後台行為。

對應上層：

- `CLAUDE.md` §16.4（Blogger ↔ GitHub cross-site UTM 規則；reverse 方向 source landed but dormant）
- `docs/ga4-enable-preflight.md` §1（GA4 機制盤點；measurementId `G-C77SMPF8VD`；4-AND gating）
- `docs/ga4-link-tracking-spec.md`（既有 9 個 events 規格）
- `docs/ga4-parameter-naming-registry.md` §1 / §3 / §4.2（measurementId 共用、UTM 命名規則、reverse UTM 規格）
- `docs/blogger-to-github-reverse-utm-plan.md` §0（reverse UTM status snapshot；step 1-7 對照）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 建立 SOP）
- `docs/20260522-ga4-click-tracking-manual-validation.md`（5/22 GA4 deploy 驗收紀錄；DOM attrs 已就位）
- `docs/20260524-blogger-repost-checklist.md` §4 / §5.3（Blogger 後台重貼 + GA4 Realtime 驗收 short-form）

---

## §0 Status Snapshot（2026-05-24 am-8c）

| 項目 | 狀態 |
|---|---|
| reverse UTM source（pm-24a/b/c）| ✅ landed origin/main `058ebce` 之前 commits |
| reverse UTM build 結構驗證 | ✅ pm-26a（`dist-blogger/` 3 ready posts byte-identical-modulo-builtAt；無 GitHub cross-link 之 ready post 無新 UTM 注入）|
| reverse UTM fixture（具 GitHub cross-link 之 full-mode Blogger post）| ❌ 尚無 |
| Blogger 後台重貼 | ❌ 尚未；live 狀態 dormant |
| GA4 後台是否已接收 reverse UTM session | ❌ 尚未（dormant 之必然結果）|
| live 狀態 | 🟡 dormant |

**結論**：本文件為**前置觀察指引**；觀察條件實際成立需先完成 fixture 建立 + Blogger 後台重貼（per `docs/20260524-blogger-repost-checklist.md` §4.2 三條件）。

---

## §1 目前狀態定義

### 1.1 「reverse UTM Blogger → GitHub Pages 已 live」是什麼意思

source 端**已實作完成**並 push origin/main：

| 階段 | commit | 變動 |
|---|---|---|
| pm-24a | `7e1d356` | `src/scripts/ga4-url-builder.js`：新增 `isGithubCrossLink` + `applyCrossSiteUtm` 加 `direction` 參數 |
| pm-24b | `e2309e9` | `src/scripts/build-blogger.js`：新增 `deriveRenderedCrossLinks` mirror；`direction: 'to_github'` |
| pm-24c | `7c769fe` | `src/views/blogger/blogger-post-full.ejs`：讀 `relatedLinksRendered` / `otherLinksRendered` |

執行 `npm run build:blogger` 後，若有 Blogger full-mode post 之 `relatedLinks` / `otherLinks` 含 GitHub Pages cross-link，產出之 `dist-blogger/posts/{slug}/post.html` **會自動注入 reverse UTM**。

### 1.2 「但目前 dormant」的原因

`dormant` 為「source live 但 production 端未生效」狀態：

| 條件 | 狀態 | 對 dormant 之影響 |
|---|---|---|
| source 已 push origin/main | ✅ | — |
| `build:blogger` 可產出含 reverse UTM 之 post.html | ✅ | — |
| Blogger full-mode post 存在 | ✅（1 篇 `we-media-myself2`）| — |
| 該 post 之 `relatedLinks` / `otherLinks` 含 GitHub Pages cross-link | ❌ | **dormant 因素 1**：無 fixture 觸發 reverse UTM 注入 |
| Blogger 後台重貼新 post.html | ❌ | **dormant 因素 2**：即便有 fixture，Blogger 端 production HTML 仍為舊版本 |

→ 必須**兩個 dormant 因素同時解除**，reverse UTM 才能進入 production。

### 1.3 何時會開始有觀察資料

依序需完成：

1. **建立 fixture**：依 `docs/reverse-utm-fixture-plan.md` §3 / §4 設計原則建立至少 1 篇含 GitHub cross-link 之 full-mode Blogger ready post
2. **`build:blogger`**：產出 `dist-blogger/posts/{slug}/post.html`；確認含 `?utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links`（或 `other_links`）
3. **user 手動重貼**：依 `docs/20260524-blogger-repost-checklist.md` §3 / §4 將 post.html 重貼至 Blogger 後台
4. **等待 Blogger CDN cache 重新整理**：~5-10 分鐘
5. **首次觀察**：user 自己（或邀請其他人）開啟 Blogger 重貼後文章 → 點擊 GitHub cross-link → GA4 Realtime 開始接收 session

⚠️ **若僅 user 自己點擊**：可觀察 1-2 個 session；長期觀察資料需等待自然讀者流量（依 Blogger 文章日常曝光量決定）。

---

## §2 GA4 可觀察項目

### 2.1 GA4 後台路徑與用途對照

| 區域 | GA4 路徑 | 延遲 | 適用場景 |
|---|---|---|---|
| **Realtime** | 報表 → 即時 | < 30 秒 | 重貼後立即驗收；確認 tag 已觸發 |
| **DebugView** | 管理 → DebugView | < 30 秒 | 開啟 GA Debug Mode chrome extension 後可看到 event-level 細節（含所有 params）|
| **Reports → Acquisition → Traffic acquisition** | 報表 → 客戶開發 → 流量開發 | 24-48 小時 | 長期觀察 source / medium / campaign 分布 |
| **Reports → Engagement → Events** | 報表 → 參與 → 事件 | 24-48 小時 | 長期觀察各 GA4 event 觸發次數 |
| **Reports → Engagement → Pages and screens** | 報表 → 參與 → 網頁和畫面 | 24-48 小時 | 確認 GitHub Pages landing page 受到 Blogger referral |
| **Explore（自訂探索）** | 探索 → 任一 template | 24-48 小時 | 自訂維度交叉；如 `source × content × landing_page` |

### 2.2 Realtime 可觀察項目

| 項目 | 預期值 |
|---|---|
| **使用者** | ≥ 1（user 自己點擊 + 任何其他人）|
| **頁面標題與畫面名稱** | 對應重貼 Blogger 文章內被點擊之 GitHub Pages landing page title |
| **使用者位置（地圖）** | 對應點擊者地理位置 |
| **事件數**（30 分鐘內）| ≥ 1（`page_view` + 後續 cross-site click 之 `click_related_link` / `click_other_link`）|
| **使用者來源**（dropdown）| `blogger` / `referral`（若 GA4 設定支援 Realtime 維度切換）|

### 2.3 DebugView 可觀察項目

DebugView 比 Realtime 更詳細，每個 event 可展開查看所有 params：

| Event | 必看 params |
|---|---|
| `page_view`（GitHub Pages landing page）| `page_location`（含 UTM query string）/ `page_referrer`（應為 Blogger 對應文章 URL）|
| `session_start` | `source` / `medium` / `campaign` / `content`（reverse UTM 應反映於此）|
| 後續 click events（若 user 在 GitHub 站繼續點擊）| 對應 GA4 link tracking spec 之 9 個 events |

⚠️ DebugView 需以下準備：
- 安裝 [GA Debug Mode Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)（user 自行下載）
- 在啟用 GA Debug Mode 之 browser 中點擊 Blogger 文章內 GitHub cross-link
- GA4 後台 DebugView 應在 ~30 秒內顯示 stream

### 2.4 Traffic Acquisition Report

長期觀察用；24-48 小時延遲：

| dimension 切法 | 預期觀察 |
|---|---|
| `Session source` | `blogger` 應出現於 list（與既有 `(direct)` / `google` / `facebook` 並列）|
| `Session medium` | `referral` 應對應 `blogger` source |
| `Session campaign` | `portable_blog_system` 應對應 `blogger` source |
| Cross-reference: `source / medium / campaign` 三維交叉 | `blogger / referral / portable_blog_system` row 應有 ≥ 1 session |

---

## §3 建議觀察參數

### 3.1 reverse UTM 期望參數對照

per `docs/ga4-parameter-naming-registry.md` §4.2 + `CLAUDE.md` §16.4 之 reverse 段：

| Query string param | 預期值 | 對應 GA4 dimension |
|---|---|---|
| `utm_source` | `blogger` | Session source |
| `utm_medium` | `referral` | Session medium |
| `utm_campaign` | `portable_blog_system` | Session campaign |
| `utm_content` | `related_links` 或 `other_links` | Session manual ad content |

⚠️ **重要**：reverse UTM 之 `utm_content` 為 **「在 Blogger 文章哪個 aside 區塊被點擊」之 placement 來源**；不是「文章 slug」。

### 3.2 點擊來源 placement 對照（同 GitHub→Blogger 方向之鏡像）

| 連結出現位置 | 期望 `utm_content` |
|---|---|
| Blogger 文章內 `relatedLinks` aside 列表項 → GitHub Pages cross-link | `related_links` |
| Blogger 文章內 `otherLinks` aside 列表項 → GitHub Pages cross-link | `other_links` |
| Blogger 文章正文 body 內手寫 GitHub link | ❌ **不會**自動注入 reverse UTM（per `CLAUDE.md` §16.4 + reverse 實作範圍限制；僅 `relatedLinks` / `otherLinks` 兩 aside 區塊被處理）|

### 3.3 與其他 medium 之區別

| `utm_medium` 值 | 用途 | 是否為 reverse UTM |
|---|---|---|
| `social` | FB / IG / Twitter 等社群平台 promotion（per `content/settings/promotion.config.json`）| ❌ |
| `referral` | 自家跨站 cross-link（Blogger ↔ GitHub）| ✅ reverse UTM **採此值** |
| `internal` | 同站內部點擊（per `ga4-parameter-naming-registry.md` §3.2，內部不加 UTM）| ❌（reverse UTM 不會用）|
| `email` | newsletter / email 行銷 | ❌（未啟用）|

---

## §4 Blogger → GitHub 觀察流程（驗收 SOP）

### 4.1 觸發流程（驗收日）

```
[Blogger 重貼後文章] → user 點擊文章內 GitHub Pages cross-link
                    → URL 自動帶 ?utm_source=blogger&utm_medium=referral...
                    → 跳轉至 GitHub Pages landing page
                    → GitHub Pages 端 GA4 接收：
                       - page_view event（page_location 含 UTM）
                       - session_start event（source/medium/campaign/content 已歸因）
```

### 4.2 步驟驗收（首次）

1. **Pre-check**：確認 §0 / §1.3 所述 5 條件已齊備
2. **打開 GA4 Realtime + DebugView 並排視窗**（建議用兩個 monitor 或兩個 tab）
3. **在隔離環境開啟 Blogger 重貼後文章**：建議用 **無痕 / Incognito 模式**或**未登入 GA4 之 browser**；避免 user 自己 session 被 GA4 自動排除（若有設 internal traffic filter）
4. **記錄點擊前的 GA4 「使用者」計數**（Realtime 區）
5. **點擊 Blogger 文章內任一 GitHub Pages cross-link**（建議分別測 `relatedLinks` 與 `otherLinks` 兩種 aside）
6. **觀察 < 30 秒內**：
   - Realtime 使用者計數 +1
   - DebugView 出現 `page_view` event；展開 → `page_location` 含 `?utm_source=blogger&utm_medium=referral...`
7. **記錄觀察結果**至本文件 §7 或新增單獨 validation log

### 4.3 GA4 Realtime 預期看到的細節

| 元素 | 預期 |
|---|---|
| 使用者地圖 | 標示 user 位置（或代理 IP 位置）|
| 過去 30 分鐘事件數 | 至少 1 個 `page_view` + 可能含 `session_start` |
| 「依事件名稱顯示的事件數」list | `page_view` 列入第一位 |
| 「使用者依來源 / 媒介顯示」（若可切）| `blogger / referral` row 存在 |
| 頁面標題 | 對應 GitHub Pages landing page 標題 |

---

## §5 live but dormant 的驗收條件

### 5.1 沒有流量 ≠ tracking 壞掉

dormant 是 **expected default state**，不是異常：

| 情境 | dormant 是否預期 |
|---|---|
| Blogger 後台尚未重貼 | ✅ **預期 dormant**；GA4 無 reverse UTM session 為正確結果 |
| Blogger 後台已重貼但無讀者流量 | ✅ **預期 dormant**；reverse UTM 須讀者點擊才觸發 |
| Blogger 後台已重貼且有讀者瀏覽，但讀者未點擊 GitHub cross-link | ✅ **預期 dormant**；只觀察 Blogger 端流量會看不到 reverse UTM |

### 5.2 「真正生效」之三條件

reverse UTM 從 dormant 轉為 **observable** 需同時：

1. **fixture + 重貼**：Blogger 端 production HTML 含 reverse UTM 注入之 cross-link
2. **讀者點擊**：實際有人（user 自己或自然讀者）在 Blogger 文章內點擊 GitHub cross-link
3. **GA4 報表延遲已過**：Realtime / DebugView 即時可見；Reports 需等 24-48 小時

### 5.3 觀察期建議

| 階段 | 持續時間 | 預期觀察強度 |
|---|---|---|
| 首次重貼後 0-30 分鐘 | 30 分鐘 | user 自測點擊；Realtime / DebugView 可見 |
| 重貼後 1-24 小時 | 1 天 | 自然讀者偶發點擊（依文章曝光量）|
| 重貼後 24-48 小時 | 2 天 | Reports 開始反映；可看 Traffic Acquisition |
| 重貼後 1-2 週 | 2 週 | 長期樣本累積；可評估 reverse UTM 是否進入 stable observation 階段 |

---

## §6 常見誤判

### 6.1 「Realtime 沒看到」不等於 tracking 壞

| 看似異常 | 實際可能原因 | 排查方向 |
|---|---|---|
| Realtime 0 使用者 | (a) user 自己被 GA4 internal traffic filter 排除（若有設）<br>(b) 等待時間 < 30 秒<br>(c) Blogger 重貼後 cache 未刷新 | (a) 用無痕 / 不同 IP / 不同 device 測；(b) 多等 30 秒；(c) Blogger CDN cache 需 5-10 分鐘 |
| DebugView 無 stream | (a) GA Debug Mode extension 未啟動<br>(b) 未在啟用 extension 之 browser 點擊 | (a) 確認 extension icon 為 "ON" 狀態<br>(b) 重新點擊 |
| page_view 有但 source/medium 不對 | (a) URL UTM query string 未完整保留（如 Blogger 後台 sanitize）<br>(b) 點擊時 fragment / redirector 攔截 | (a) 瀏覽器網址列檢查 GitHub Pages landing page URL 是否含 UTM<br>(b) 檢查 Blogger 文章 HTML 是否含完整 UTM string |
| `utm_content` 為 `(not set)` | 該連結未屬 `relatedLinks` / `otherLinks` aside，可能為文章 body 內手寫 link（不在 reverse UTM 注入範圍）| 確認連結 source；reverse UTM **僅**處理 aside 之 cross-link |

### 6.2 Ad blocker / browser privacy 影響

| 因素 | 影響 |
|---|---|
| uBlock Origin / AdGuard 等廣告封鎖 | 可能封鎖 GA4 endpoint（`google-analytics.com` / `googletagmanager.com`）；event 完全不發送 |
| Brave Browser 預設 Shields | 預設封鎖 GA4 |
| Firefox Enhanced Tracking Protection | 嚴格模式下可能封鎖 |
| Safari ITP / Intelligent Tracking Prevention | 第三方 cookie 受限；page_view 仍會發送，但 cross-session 識別受影響 |
| GDPR Cookie Consent banner 未同意 | 若有設 GTM consent gating，event 不發送 |

→ **驗收建議**：用 **Chrome 無痕 + 無 extension** 環境驗收；自然讀者流量則接受 ~30-50% adblock 損耗為常態。

### 6.3 Blogger 後台未重貼或文章未更新時無資料

最常見誤判：source push origin/main 完成後即預期 GA4 立即有 reverse UTM 資料 → **錯誤**。

正確心智模型：

```
source push → GA4 立即有資料？❌ 否

source push → npm run build:blogger → 含 reverse UTM 之 post.html 產出 → GA4 立即有資料？❌ 否

→ post.html 重貼 Blogger 後台 → 等 5-10 分鐘 cache → user 開啟並點擊 cross-link → GA4 才開始有資料 ✅
```

### 6.4 GA4 Standard Report 延遲

| 報表類型 | 延遲 |
|---|---|
| Realtime | < 30 秒 |
| DebugView | < 30 秒 |
| Reports（Acquisition / Engagement / Events）| 24-48 小時 |
| Explore（自訂探索）| 24-48 小時（同 Reports）|

→ 重貼後 1 小時 Reports 看不到資料屬正常；24 小時後仍看不到才需排查。

---

## §7 不做事項（本批 observation guide 明文範圍外）

| 動作 | 原因 |
|---|---|
| ❌ 改 GA4 後台設定（Property / Data Stream / Custom Definitions / Filters） | 屬獨立 GA4 admin 操作；本 guide 僅描述觀察，不修改 |
| ❌ 改 Blogger 後台（HTML / CSS / theme）| 屬 `docs/20260524-blogger-repost-checklist.md` 範圍；非本 guide |
| ❌ 改 GitHub Pages production（gh-pages branch / source code）| 本 guide 不觸碰 production code |
| ❌ 新增 tracking code（額外 GA4 event / custom event / measurement protocol）| 屬 spec 變更；非本 guide |
| ❌ 啟動新 build / deploy / push | 本 guide 為觀察指引，不執行任何 build pipeline |
| ❌ 修改 `content/settings/ga4.config.json` | measurementId / enabled 狀態目前正確，不動 |
| ❌ 修改 `src/scripts/ga4-url-builder.js` | reverse UTM source 已落地 pm-24a；本 guide 不重改 |
| ❌ 自動建立 fixture | fixture 建立屬 `docs/reverse-utm-fixture-plan.md` 範圍；user 主動決定 |
| ❌ 自動執行重貼 / 點擊驗收 | Blogger 後台操作 + browser 點擊皆為 user 行為；本 guide 僅描述 |

---

## §8 本文件邊界（落地保證）

| 項目 | 狀態 |
|---|---|
| 修改 source（`src/`）| ❌ 無 |
| 修改 content（`content/`）| ❌ 無 |
| 修改 settings（`content/settings/`）| ❌ 無 |
| 修改 template（`src/views/`）| ❌ 無 |
| 修改 dist / dist-blogger / dist-promotion / dist-reports | ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`）| ❌ 無 |
| 執行 `npm run build*` | ❌ 無 |
| 執行 git push | ❌ 無 |
| 觸碰 Blogger 後台 | ❌ 無 |
| 觸碰 GA4 後台 | ❌ 無 |

本 guide 為**操作支援文件**，落地後**不**改變任何 production state；只在 user 主動啟動 GA4 後台觀察時被讀取參考。

---

## §9 後續調整空間

本文件為**第一版觀察指引**，可後續調整：

- 首次重貼 + 點擊驗收後，§4.2 步驟可依實際操作經驗細化
- 觀察 1-2 週後可新增 §10「實際觀察樣本紀錄」章節（如 session 數 / 主要 referrer Blogger 文章 / 主要 landing page 等）
- 若 reverse UTM 增加新 placement（如 body 內手寫 link 也注入）→ §3.2 表需更新
- 若 GA4 後台介面改版（GA4 持續演進）→ §2.1 路徑表需更新
- 若新增其他跨站 referral 方向（如 future custom domain ↔ Blogger）→ 新增對應 §x 章節
