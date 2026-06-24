# GA4 DebugView / Realtime 手動驗收 Checklist — Param Allowlist Filter

- **日期**：2026-06-24
- **性質**：**docs-only**（不改 source / 不 build / 不 deploy；本文件是**部署後**之人工驗收 SOP）
- **驗收對象**：`feat(ga4): allowlist-filter forwarded event params (drop raw url fields)`（commit `bb56ea6`）落地之 GA4 event param allowlist filter，於 **GitHub Pages live site** 之實際行為
- **實作位置**：`src/js/modules/link-tracker.js`（`GA4_PARAM_ALLOWLIST` + `filterGa4EventParams()` + listener 改 `trackEvent(eventName, filterGa4EventParams(params))`）
- **回歸 smoke**：`node src/scripts/check-ga4-param-allowlist.js`（純函式測試，已鎖 allowlist 常數 + 三種 emit payload）
- **measurementId**：`G-C77SMPF8VD`（`content/settings/ga4.config.json`）

> 本文件純驗收 SOP。GitHub Pages deploy 不在本 phase 範圍；請先確認新 allowlist bundle 已上線，再依本 checklist 逐項點擊驗收。

---

## 0. 目標（口徑）

確認 **GitHub Pages live site 已載入新 allowlist JS**，且 GA4 **不再收到** 以下 raw event params：

```
link_url
target_url
outbound
link_source_key
```

而 **D4 已註冊 4 維度** 與 **P1 報表依賴欄位** 仍正常 forward。

**Allowlist = 只 forward 這 9 個 key（無多無少）**：

| 群組 | keys |
|---|---|
| D4 registered custom dimensions | `link_type` / `provider` / `placement` / `link_label` |
| P1 / 既有報表依賴欄位 | `post_slug` / `surface` / `click_area` / `nav_direction` / `target_slug` |

**MUST DROP（非 allowlisted，一律不 forward）**：`link_url` / `target_url` / `outbound` / `link_source_key` / 任何未知 / email-like / user-id-like / token-like key。

> 機制說明：本 phase **不改** EJS template / generated HTML，raw `data-ga4-param-link-url` 等屬性**仍留在靜態 HTML**（等同 href，無新洩漏面）；filter 只阻止其**forward 到 GA4**。因此在 DOM 上仍看得到 raw attr 屬正常 —— 驗收看的是 **GA4 端收到什麼**，不是 HTML attr。

---

## 1. 前置（Preconditions）

| # | 條件 |
|---|---|
| 1 | 已完成 **GitHub Pages deploy**，新 allowlist bundle 已上線（本 phase 不 deploy）|
| 2 | 使用 **GitHub Pages live site**（`https://babel-lab.github.io/portable-blog-system/...`）——**不是 Blogger**（Blogger 文章頁無 Vite listener，`data-ga4-*` 不 fire，本 checklist 不適用）|
| 3 | 建議 **開無痕視窗** 或 **清 cache**，避免吃到舊 JS |
| 4 | 若可以，使用 **GA Debugger（Chrome 擴充）/ DebugView 模式**；或 GA4 後台 **Admin → DebugView**（或 **Reports → Realtime**）|
| 5 | **等 GitHub Pages propagation 幾分鐘** 後再測（CDN 邊緣節點更新有延遲）|
| 6 | 瀏覽器**未封鎖** GA script（gtag.js / `google-analytics.com/g/collect`）；ad / privacy blocker 請暫時關閉 |
| 7 | 確認 live page 載入新 entry bundle（本次預期檔名 `entry-CbKoAmjl.js`；⚠️ hash 為 build-specific，重 build 後會變，以 deploy 當下實際檔名為準）|

---

## 2. 逐項點擊驗收

> 共通：每點一個連結會跳頁 → 用瀏覽器「上一頁」返回，或在新分頁開測試頁，再測下一項。
> 「應該還要看到」= GA4 event parameters 內**必須出現**；「不應再看到」= filter 後**必須不存在**。

### 一、點 affiliate CTA

- **操作**：打開一篇 GitHub Pages 文章 → 點一個 affiliate CTA（例：博客來連結）。
- **GA4 期待 event**：`click_affiliate_cta`
- **應該還要看到**：

  | param | 說明 |
  |---|---|
  | `link_type` | D4 維度 |
  | `provider` | D4 維度（如「通路王」）|
  | `placement` | D4 維度（如 `article_bottom`）|
  | `link_label` | D4 維度（連結可見文字，如「博客來：實體書」）|
  | `post_slug` | P1 欄位（當前文章 slug）|

- **不應再看到**：`link_url`、`outbound`、`link_source_key`

### 二、點 related link

- **操作**：點文章內 related link。
- **GA4 期待 event**：`click_related_link`
- **應該還要看到**：`link_type`、`placement`、`link_label`、`post_slug`
- **不應再看到**：`link_url`（url）、`outbound`、`link_source_key`

### 三、點 article bottom nav

- **操作**：點文章底部「上一篇 / 下一篇 / 回首頁」nav。
- **GA4 期待 event**：`click_other_link`
- **應該還要看到**：`surface`、`click_area`、`nav_direction`、`post_slug`、`target_slug`、`link_label`
- **不應再看到**：`target_url`

> 篩文章底部導覽：用 `event_name = click_other_link` **加** `click_area = article_bottom_nav` 雙條件（per CLAUDE.md §3a GA4 紅線）；單看 `click_other_link` 會混入 otherLinks aside 之點擊。

### 四、確認 D4 四個維度仍正常

D4 custom dimensions 經 filter 後**仍可用**（在上述各 event 內可見且可被 GA4 報表切片）：

```
link_type
provider
placement
link_label
```

---

## 3. 預期 event payload（精確口徑，mirror smoke harness）

`src/scripts/check-ga4-param-allowlist.js` 已鎖以下 filter 後 key set（emit 端含 raw 欄位，filter 後只剩這些）：

| event | filter 後保留 key（sorted） | 被 drop |
|---|---|---|
| `click_affiliate_cta` | `link_label` / `link_type` / `placement` / `post_slug` / `provider` | `link_url` / `outbound` |
| `click_related_link` | `link_label` / `link_type` / `placement` / `post_slug` | `link_url` / `outbound` / `link_source_key` |
| `click_other_link`（bottom nav）| `click_area` / `link_label` / `nav_direction` / `post_slug` / `surface` / `target_slug` | `target_url` |

> 三項驗收觀察到的 GA4 parameters 應與此表一致。任一被 drop 欄位若出現在 GA4，先走 §5 分類，**不要先改 source**。

---

## 4. DebugView 操作步驟

1. 開 GA4 後台 → **Admin → DebugView**（或 **Reports → Realtime**）。建議同開 GA Debugger 擴充使本機 session 進 debug。
2. 無痕新分頁開測試文章（GitHub Pages live URL）。
3. 確認頁面正常 render，且載入新 entry bundle（§1 #7）。
4. 依 §2 一 / 二 / 三 各點一次。
5. 回 DebugView，1–30 秒內出現對應 event → 展開 **event parameters**。
6. 逐項核對 §3 表：**應保留的全在、應 drop 的全不在**。
7. 用「上一頁」返回測試頁，測下一項。

---

## 5. 若 raw params 還出現 —— 先分類，不要先改 source

⚠️ 看到 `link_url` / `target_url` / `outbound` / `link_source_key` 時，**先不要動 source**，先排除以下環境原因：

| 可能原因 | 判斷 / 處理 |
|---|---|
| **GitHub Pages propagation delay** | 等 5–15 分鐘後重測 |
| **browser cache 還吃到舊 JS** | 無痕視窗重測 / 強制重新整理（Ctrl+F5）|
| **deploy 前的舊事件** | DebugView 內可能殘留 deploy 前的舊 event；以 deploy 後時間戳之新事件為準 |
| **點到舊頁面或舊 asset** | 確認 live page 載入 `entry-CbKoAmjl.js`（或當下 deploy 實際 entry 檔名），非舊 hash bundle |
| **GA4 Realtime / DebugView 延遲** | 數秒～數十秒延遲屬正常，稍候再看 |

**建議處理流程**：

1. 等 5–15 分鐘
2. 無痕視窗重測
3. 強制重新整理
4. 確認 live page 載入 `entry-CbKoAmjl.js`（以 deploy 當下實際 entry 檔名為準）
5. 再重新點擊事件

> 上述全部排除、且確認載入的是新 bundle 後，raw param **仍** forward 到 GA4 —— 此時才視為真實 regression，另開 source phase 處理（先比對 `filterGa4EventParams()` 是否真的 wire 進 listener、smoke 是否 pass）。

---

## 6. 驗收結果記錄表（人工填寫）

| 項目 | event 是否出現 | 應保留 param 全在 | 應 drop param 全不在 | 結果 |
|---|---|---|---|---|
| 一、affiliate CTA（`click_affiliate_cta`）| ☐ | ☐ | ☐ | PASS / FAIL |
| 二、related link（`click_related_link`）| ☐ | ☐ | ☐ | PASS / FAIL |
| 三、bottom nav（`click_other_link` + `click_area=article_bottom_nav`）| ☐ | ☐ | ☐ | PASS / FAIL |
| 四、D4 四維度仍可用 | ☐ | — | — | PASS / FAIL |
| live page 載入新 entry bundle | ☐ | — | — | PASS / FAIL |

> 全 PASS → 產出 docs-only verification record（建議 `docs/20260624-ga4-param-allowlist-live-verification-record.md`），記錄 deploy 時間、實際 entry 檔名、各 event 觀察到的 param、驗收人 / 時間。

---

## 7. Known limitations

- ⏱ GA4 DebugView / Realtime 有延遲（數秒～數十秒）；未即時出現不一定是失敗。
- 🖥 local build / dev / preview 若無正式 GA gating（isProdBuild=false 或無 measurementId）→ gtag 不送 event → 無法本機驗收；須 deploy 後於正式環境驗。
- 🚫 **Blogger 沒有 listener** → 本 checklist 不適用 Blogger（per `docs/blogger-listener-strategy.md`）。
- 🔢 raw `data-ga4-param-*` 屬性**仍在靜態 HTML**（本 phase 不改 template）；DOM 上看得到屬正常，驗收口徑是「GA4 端收到什麼」。
- 🔐 entry bundle hash（`entry-CbKoAmjl.js`）為 build-specific；重 build 後變動，以 deploy 當下實際檔名為準。

---

## 8. Cross-links

- `src/js/modules/link-tracker.js`（`GA4_PARAM_ALLOWLIST` / `filterGa4EventParams()` / listener）
- `src/scripts/check-ga4-param-allowlist.js`（回歸 smoke；鎖 allowlist 常數 + 三 payload）
- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（既有 bottom-nav DebugView SOP）
- `docs/ga4-parameter-naming-registry.md`（event / param 命名 registry）
- `docs/20260624-ga4-d4-data-flow-window-complete-evidence-record.md`（D4 四維度 data-flow 證據）
- `content/settings/ga4.config.json`（measurementId `G-C77SMPF8VD`）

---

（本文件結束）
