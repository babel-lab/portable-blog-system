# 20260522 PM Phase 2 Batch Plan

本文件為 **Phase 2 GA4 click tracking / affiliate tracking** 之拆批計畫；屬 docs-only proposal；**本批 phase `20260522-pm-phase-2-batch-plan-doc-a` 不修改任何 source / template / settings / build / deploy / push**。

對應上層：
- `docs/click-tracking-governance.md`（5/22 落地 commit `aabc082`；5/22 pm reconcile commit `413ca5b`；本計畫之命名 / 規格 ground truth）
- `docs/ad-affiliate-schema-proposal.md`（5/22 落地 commit `318f4b0`；本計畫之 affiliate schema 字典）
- `docs/20260522-phase-1-baseline-confirmation.md`（5/22 落地 commit `2971c1c`；Phase 1 已宣告基礎可運行）
- `CLAUDE.md` §5（既有 9 個 GA4 event）/ §16（連結處理）/ §17（文章頁版型）

---

## 1. Purpose

### 1.1 文件目的

- 將 **Phase 2 GA4 click tracking / affiliate tracking 拆成小批次**
- 避免一次大改 Blogger / GitHub / GA4 / template
- 以 **GitHub 端可驗收的最小 click point 先落地**
- **Blogger 端策略先 deferred**；不混在第一批
- **本文件僅為 planning proposal**；不實作

### 1.2 文件性質

- **Docs-only planning doc**；不代表任何批次已啟動
- 每批啟動前須 **user 明示**
- 各批之順序為**建議**；user 可調整 / 跳過 / 合批

### 1.3 不做事項

- ❌ 不修改 `src/`
- ❌ 不修改 `content/`
- ❌ 不修改 `dist/`
- ❌ 不修改 deploy repo
- ❌ 不跑 build / validate
- ❌ 不 push / 不 deploy
- ❌ 不實作任何 click tracking attribute

---

## 2. Current Infrastructure

### 2.1 既有基礎設施盤點

per `docs/click-tracking-governance.md` §2.1（pm reconcile 後補記）：

| 元件 | 路徑 | 狀態 |
|---|---|---|
| **trackEvent helper** | `src/js/modules/ga4-events.js` | ✅ 已存在；wrap `gtag('event', name, params)`；無 gtag 時 silent no-op |
| **Delegated click listener** | `src/js/modules/link-tracker.js` | ✅ 已存在；document-level click listener；掃 `[data-ga4-event]` + 讀 `data-ga4-param-<key>` |
| **EJS helper partial** | `src/views/tracking/ga4-events-helper.ejs` | ✅ 已存在；輸出 `data-ga4-event` + `data-ga4-param-<key>` |
| **main.js wiring** | `src/js/main.js` line 14 `initLinkTracker()` | ✅ 已 wire；每頁載入即生效 |
| **Governance doc attr 命名** | `docs/click-tracking-governance.md` §6 | ✅ 已對齊 `data-ga4-event` + `data-ga4-param-<key>`（commit `413ca5b`）|
| **Production click points include helper** | — | ❌ **無**；任何 EJS template 尚未 include helper |

### 2.2 核心結論

🔑 **Phase 2 不需要先做 listener framework**；**listener / helper / wiring 已存在 4/4**。

實際 gap 為：**將既有 `ga4-events-helper.ejs` partial include 至 production click point EJS templates**。

---

## 3. Key Constraints

### 3.1 GitHub side

- GitHub Pages 端有 **Vite `main.js` bundle**；含 `initLinkTracker()` 已 wire
- EJS click point 一旦加上 `data-ga4-event` / `data-ga4-param-*`，listener **即生效**；不需新增 src code
- 需要 **build + validate + deploy** 才會上線（dist HTML 多出 attr；屬 production-visible 變動）
- 驗收方式：GA4 DebugView / Realtime 觀察 event；或本機 dev console 觀察 trackEvent params

### 3.2 Blogger side

- Blogger 後台貼上之 post HTML（`dist-blogger/posts/{slug}/post.html`）**不含 Vite `main.js` bundle**
- 只加 `data-ga4-*` attr **不會 fire event**（listener 不存在於該 HTML scope）
- Blogger 端需另決定 listener 策略（per §9 三個 candidate）：
  - **A. inline listener** 至 Blogger post HTML（per article render）
  - **B. Blogger 主題層級** 加入 listener（一次性貼於 Blogger 主題 footer）
  - **C. Blogger 端暫不做 click event**；只靠 UTM + 自動 page_view 歸因

### 3.3 Hashtag side

- 目前 hashtag render 為 `<span class="lab-hashtag">`（per `src/views/blogger/blogger-post-full.ejs:179` + `src/views/pages/post-detail.ejs` mirror）
- ❌ **不是 `<a>`**；非 click target；目前無法直接掛 `data-ga4-*` attr
- 需要**前置處理**：
  - 決定 `tagSlug` 來源：
    - 選項 a：`content/settings/tags.json` 之 mapping（推薦；既有設定來源）
    - 選項 b：`slugify(tag)` runtime 函式（簡單但需處理中文）
  - 處理 span → a 之 UX / SEO / URL 規則（target page `/tags/{slug}/` 已存在 per Phase 1）
- ⚠️ 屬獨立批；**不**建議與 affiliate CTA 第一批混作

### 3.4 Reverse UTM side

- GitHub → Blogger UTM **已存在**（per `src/scripts/ga4-url-builder.js applyCrossSiteUtm`）
- Blogger → GitHub reverse UTM **尚未實作**（per `CLAUDE.md` §16.4 future）
- 需要 **user 表態是否值得做**：
  - 已發布 Blogger 文章（如 `we-media-myself2`）可能需要**重貼**才會帶反向 UTM
  - 是否真有 attribution 價值（GA4 後台 referrer 觀察是否已足夠？）

---

## 4. Recommended Batch Order

12 批之 Phase 2 推薦順序：

| # | batch | scope | files likely touched | build needed? | validate needed? | deploy needed? | risk | blocking condition |
|---|---|---|---|---|---|---|---|---|
| **1** | **Docs: click-tracking-governance reconcile** | ✅ **已完成**（commit `413ca5b`）| `docs/click-tracking-governance.md` | ❌ | ❌ | ❌ | 🟢 | 無 |
| **2** | **Docs: Phase 2 batch plan**（本文件）| 新增本 doc | `docs/20260522-pm-phase-2-batch-plan.md` | ❌ | ❌ | ❌ | 🟢 | 無 |
| **3** | **Source: GitHub affiliate CTA top attr** | 改 1 個 click point；首注入 | `src/views/pages/post-detail.ejs`（affiliate-box top）| ✅ | ✅ | ✅ | 🟢 低 | 順序 1+2 已完成 ✅ |
| **4** | **Source: GitHub affiliate CTA bottom attr** | 與 #3 同 pattern；placement=article_bottom | 同上（bottom 段）| ✅ | ✅ | ✅ | 🟢 低 | #3 已 deploy 通過驗收 |
| **5** | **Source: GitHub relatedLinks / otherLinks attr** | 兩 aside 之 `<a>` 加 attr；可合批 | `src/views/pages/post-detail.ejs` 之 relatedLinks + otherLinks 段；可能順手調整 `deriveRenderedCrossLinks` | ✅ | ✅ | ✅ | 🟢 低 | #4 已 deploy 通過 |
| **6** | **Source: hashtag span → a planning / slug decision** | docs+planning；無 src 改動 | `docs/`（新增 hashtag-slug-decision doc）| ❌ | ❌ | ❌ | 🟢 docs | 順序 5 已 deploy（資源獨立；可早做）|
| **7** | **Source: GitHub hashtag attr** | span 轉 `<a>` + 加 attr；含 slug 派生邏輯 | `src/views/blogger/blogger-post-full.ejs:179` + `src/views/pages/post-detail.ejs` + 可能 `src/scripts/build-github.js`（slug 派生）| ✅ | ✅ | ✅ | 🟡 中（DOM 結構變動）| #6 slug 策略確定 |
| **8** | **Docs: Blogger listener strategy decision** | docs；user 決議 A/B/C | `docs/`（新增 blogger-listener-strategy doc）| ❌ | ❌ | ❌ | 🟢 docs | 順序 3-5 GitHub 端已驗收（有實際資料佐證 ROI）|
| **9** | **Source or manual: Blogger listener strategy implementation** | 依 #8 之決議；可能改 EJS（A）/ 主題級別 user 手動（B）/ 不做（C） | per #8 決議 | 視 | 視 | 視 | 🟡 中（首次動 Blogger render 結構）| #8 已決議 |
| **10** | **Source: Blogger click point attr** | 改 `blogger-post-full.ejs` 加 affiliate / relatedLinks / otherLinks / hashtag attr | `src/views/blogger/blogger-post-full.ejs` 多處 | ✅ | ✅ | 🟡 deploy 至 dist-blogger；user 重貼 Blogger | 🟡 中 | #9 已落地 |
| **11** | **Source: Blogger → GitHub reverse UTM** | mirror `applyCrossSiteUtm`；新增 `isGithubCrossLink`；改 `build-blogger.js` | `src/scripts/ga4-url-builder.js` + `src/scripts/build-blogger.js`；可能 `blogger-post-full.ejs` | ✅ | ✅ | 🟡 user 重貼 | 🟡 中 | user 表態值得做 |
| **12** | **Docs: GA4 DebugView / Realtime SOP** | docs；每 click source 之驗收項清單 | `docs/`（新增 ga4-debugview-sop doc）| ❌ | ❌ | ❌ | 🟢 docs | 順序 3-11 已落地（有實際 event 流量可觀察）|

### 4.1 拆批原則

- ✅ **每批獨立 commit**；不混入跨類變動
- ✅ **每批 LOC 小**（多數 < 50 行）；大批拆分
- ✅ **每批單一驗收項**；避免「不知道是哪一改造成 event 漏 / 重複」
- ✅ **GitHub 端先 / Blogger 端後**；Blogger 牽涉 listener 策略 + user 重貼成本

---

## 5. First Source Batch Recommendation

### 5.1 推薦 Phase name

```
20260522-pm-affiliate-cta-top-github-attr-a
```

### 5.2 範圍

- **只改** `src/views/pages/post-detail.ejs`
- **只針對 GitHub 端 affiliate CTA top**
- 在 `<a class="lab-affiliate-box__link">` 開始 tag 內加入 `<%- include('../tracking/ga4-events-helper', {...}) %>`

### 5.3 Event + params

```ejs
event: 'click_affiliate_cta'
params:
  - provider                  (link.network 或派生)
  - placement: 'article_top'
  - post_slug                 (post.slug)
  - link_label                (link.label)
  - outbound: 'true'          (string，非 boolean)
```

### 5.4 邊界聲明

- ✅ 這是**最小 source 變更**（~6 LOC 增量）
- ✅ **不**碰 Blogger 端
- ✅ **不**碰 relatedLinks / otherLinks
- ✅ **不**碰 hashtag
- ✅ **不**改 listener / helper（既有；不動）
- ✅ **不**改 GA4 config
- ✅ **不**改 settings JSON
- ✅ **不**改 affiliate-networks.json
- ✅ **不**改 content schema
- ⚠️ 需要 `npm run build` + `npm run validate:content`（雖 schema 不變；屬 sanity）
- ⚠️ 需要 **deploy**（dist HTML 多出 attr；屬 production-visible 變動；首次 click event 落地）

### 5.5 驗收方式

- GA4 DebugView 啟用後 → 開啟瀏覽器 → 點 affiliate CTA top → 觀察 `click_affiliate_cta` event 出現
- 或本機 dev：開 console，在 `link-tracker.js` 之 `trackEvent` 加 console.log（不 commit）→ 觀察 params object
- 或 GA4 Realtime → Events → 找 `click_affiliate_cta`

### 5.6 可逆性

✅ 完全可逆（revert 1 commit；listener 不關心 attr 是否存在；no-op fallback）

---

## 6. Affiliate CTA Full Rollout Plan

### 6.1 GitHub top（首注入；single point）

- **Phase**：`20260522-pm-affiliate-cta-top-github-attr-a`（per §5）
- **性質**：**第一個 validation batch**；驗證既有 listener / helper / wiring 鏈路通
- **單點**：避免一次 4 點全注入；若有問題易追溯

### 6.2 GitHub bottom（與 #6.1 同 pattern）

- **Phase**：`20260522-pm-affiliate-cta-bottom-github-attr-a`（或合併至 top 同批）
- **Event**：同 `click_affiliate_cta`
- **Placement**：`article_bottom`
- **Files**：同 `src/views/pages/post-detail.ejs`（affiliate-box bottom 段）

### 6.3 Blogger top / bottom（deferred）

- **狀態**：⏸ **deferred until listener strategy resolved**（per §9）
- **理由**：Blogger HTML 無 Vite bundle；attr 即使輸出 listener 不會 fire；先做 GitHub 端有實際 ROI 後再決議

### 6.4 ⚠️ Top / Bottom 區分 placement 之重要性

即使 top / bottom 之 `linkUrl` 相同（同一導購連結放兩處），仍須**靠 `placement` param 區分 GA4 event**：

- `placement=article_top` vs `placement=article_bottom`
- GA4 後台可依 `placement` 維度切分；觀察上方 / 下方 CTA 之點擊比
- 業界共識：top vs bottom click-through 通常差異顯著

---

## 7. relatedLinks / otherLinks Plan

### 7.1 GitHub 端可合批

- **Phase**：`20260522-pm-related-other-links-github-attr-a`
- **可合批理由**：兩 aside 之 render pattern 相同（皆 `<a class="lab-{related,other}-links__link">`）；attr 注入 pattern 一致
- **Files**：`src/views/pages/post-detail.ejs`（relatedLinks 段 + otherLinks 段）

### 7.2 Event

- **relatedLinks**：`click_related_link`
- **otherLinks**：`click_other_link`

### 7.3 Params（至少含）

| param | 來源 |
|---|---|
| `post_slug` | `post.slug` |
| `link_type` | `relatedLinks[i].kind`（`internal` / `cross_site` / `external`）|
| `link_label` | `relatedLinks[i].title` |
| `link_url` | `relatedLinks[i].url` |
| `outbound` | `'true'` if external；`'false'` otherwise（per `docs/click-tracking-governance.md` §8.2）|

### 7.4 與 cross-site UTM 之共生

- Cross-site link（指向 Blogger）已含 UTM（per `applyCrossSiteUtm`）
- 加 `data-ga4-*` attr 後不衝突；兩層獨立機制（per `docs/click-tracking-governance.md` §3）：
  - URL 端：UTM 用於 Blogger 端 referrer attribution
  - Event 端：本站 GA4 fire `click_related_link` with `link_type=cross_site`
- 不雙計 page_view

---

## 8. Hashtag Plan

### 8.1 前置狀態

- 目前 hashtag 為 `<span class="lab-hashtag">#<%= tag %></span>`（per `blogger-post-full.ejs:179` + `post-detail.ejs` mirror）
- ❌ 不是 `<a>` → 無 click target → 無法直接掛 `data-ga4-*`

### 8.2 需先決定 tagSlug 來源

| 選項 | 來源 | 優點 | 缺點 |
|---|---|---|---|
| **a** | `content/settings/tags.json`（lookup）| 既有設定來源；穩定；中文友善 | 需確認所有 tag 皆有對應 entry；缺項時 fallback 策略 |
| **b** | `slugify(tag)` runtime 函式 | 簡單；無需查表 | 中文 tag 之 slug 轉換需 library / 規則；可能與 settings/tags.json 不一致 |

⚠️ 推薦 **選項 a**（對齊既有 tags.json）；屬獨立 phase 決議。

### 8.3 span → a 改動

```ejs
<%# 現況 %>
<li><span class="lab-hashtag">#<%= tag %></span></li>

<%# 改後 %>
<li><a class="lab-hashtag" href="<%= basePath %>/tags/<%= tagSlug %>/"
   <%- include('../tracking/ga4-events-helper', {
     event: 'click_hashtag',
     params: { tag_slug: tagSlug, post_slug: post.slug }
   }) %>>#<%= tag %></a></li>
```

⚠️ 需處理：
- `basePath` 之 dev / build 分流（per `vite.config.js` mode-aware）
- `tagSlug` 之 lookup 邏輯（如選項 a；需在 EJS data 派生或 build 階段預派生）
- CSS：`.lab-hashtag` 既有樣式可能含 `color` / `text-decoration` 偏 chip；`<a>` 預設藍底線會破版 → 需確認 SCSS

### 8.4 不建議合批

- ❌ **不建議**與 affiliate CTA 第一批混作
- ✅ **應**單獨 phase；含前置 slug 決議 + span→a 轉換 + attr 注入
- ✅ 為**獨立 phase**；風險中等（涉 DOM 結構變動）

---

## 9. Blogger Strategy Plan

Blogger 端 listener 三種 candidate：

### 9.1 A. inline listener in Blogger post HTML

- **作法**：將 listener JS 直接寫入 `blogger-post-full.ejs` 之 `<script>` block；每篇文章 HTML 內含 listener
- **優點**：
  - 自動隨文章 HTML 走；user 貼到 Blogger 後立即生效
  - 不需 user 動 Blogger 主題級別設定
- **缺點**：
  - 每篇文章 HTML 重複嵌入 listener（~25 LOC × N 篇）
  - Blogger 對 `<script>` 有時 sanitize / 移除（需測試）
  - Listener 修正時所有舊文章需重貼
- **風險**：🟡 中（Blogger script 政策 + 重貼成本）

### 9.2 B. Blogger theme-level listener

- **作法**：將 listener JS 一次性貼到 Blogger 主題層級（主題 HTML / 主題 footer / 主題自訂 CSS+JS）；對應 5/21 pm-45 GA4 主題級別貼法
- **優點**：
  - **一次性** user 動作；對齊既有 GA4 主題貼法
  - 文章 HTML 不重複嵌入 listener
  - Listener 修正時只動主題一處
- **缺點**：
  - 需 user 手動於 Blogger 後台貼主題級別 JS（屬一次性 setup work）
  - 主題層級之 script 載入時機需確認（DOMContentLoaded vs 立即）
- **風險**：🟢 低（一次性 setup；對齊既有 GA4 模式）

### 9.3 C. Blogger no click event for now

- **作法**：Blogger 端**不**做 click event；只靠 UTM + GA4 自動 page_view 歸因
- **優點**：
  - 零 implementation cost
  - 對齊保守落地原則
  - GitHub 端有 event；Blogger 端純看 page_view + UTM
- **缺點**：
  - Blogger 端 affiliate CTA 之 placement（top vs bottom）無法區分
  - relatedLinks / otherLinks 點擊行為無 event 資料
  - 觀察維度受限
- **風險**：🟢 最低（無變動）

### 9.4 建議

- **目前先採 C 或 B planning**
- **不要在第一個 source batch 處理 Blogger click event**
- 待 GitHub 端 §6.1 / §6.2 / §7 / §8 落地並驗收後（有實際 GitHub 流量資料）→ 評估 Blogger 端是否值得做 / 採 A vs B

---

## 10. Reverse UTM Plan

### 10.1 方向

- **Blogger → GitHub**（per `CLAUDE.md` §16.4 future）

### 10.2 建議 UTM

```
utm_source=blogger
utm_medium=referral
utm_campaign=portable_blog_system
utm_content=related_links | other_links
```

### 10.3 評估項

| 項目 | 評估 |
|---|---|
| **build-blogger.js 是否新增 deriveRenderedCrossLinks** | ✅ 需要；mirror `src/scripts/build-github.js` 之既有實作 |
| **ga4-url-builder.js 是否支援 `isGithubCrossLink`** | ✅ 需要；mirror 既有 `isBloggerCrossLink`；~10 LOC |
| **`applyCrossSiteUtm` 簽名是否需擴展** | ✅ 需要；增 `source` 參數或拆 helper；保 backward-compat |
| **已發布 Blogger 文章是否需要重貼** | ✅ 是；`we-media-myself2` 若加入反向 UTM 後須重貼至 Blogger 後台；屬一次性 user 動作 |
| **是否真的有商業價值** | ⚠️ **需 user 表態**；可能單向（GitHub→Blogger）UTM 已足夠 attribution；GA4 後台之 referrer 維度可觀察 Blogger→GitHub 流量 |

### 10.4 推薦順序

- ⏸ **deferred until user 表態值得做**
- 屬獨立 phase；不依賴 §6-§9 之 GitHub 端 click event rollout
- 可於 GitHub 端 click event 已落地後再評估（屆時可看 Blogger→GitHub referral 之 GA4 page_view 流量是否需要更精細 attribution）

---

## 11. Acceptance Criteria（本文件完成條件）

| # | 條件 | 滿足 |
|---|---|---|
| 1 | 明確寫出 listener / helper 已存在 | ✅ §2.1 + §2.2 核心結論 |
| 2 | 明確寫出第一批 source 建議是 GitHub affiliate CTA top | ✅ §5（含 phase name / scope / params / 邊界 / 驗收）|
| 3 | 明確拆出 top / bottom / related / other / hashtag / Blogger / reverse UTM | ✅ §6 / §7 / §8 / §9 / §10 |
| 4 | 明確標示 Blogger listener 策略 deferred | ✅ §6.3 + §9.4 |
| 5 | 明確標示本文件不實作 | ✅ §1.2 / §1.3 + 每節邊界聲明 |

---

## 12. Cross-links

- `docs/click-tracking-governance.md`（attr 命名 + event 規格；5/22 落地 + reconcile）
- `docs/ad-affiliate-schema-proposal.md`（affiliate metadata schema proposal）
- `docs/20260522-day-1-readonly-a-report.md`（5/22 day-1 read-only audit）
- `docs/20260522-phase-1-baseline-confirmation.md`（Phase 1 基礎可運行宣告）
- `docs/ga4-parameter-naming-registry.md`（既有 GA4 / UTM naming registry）
- `src/js/modules/ga4-events.js`（trackEvent helper；既有）
- `src/js/modules/link-tracker.js`（delegated click listener；既有）
- `src/views/tracking/ga4-events-helper.ejs`（EJS attr partial；既有）
- `src/views/pages/post-detail.ejs`（GitHub post detail；首注入目標）
- `src/views/blogger/blogger-post-full.ejs`（Blogger post full；deferred）
- `src/scripts/ga4-url-builder.js`（cross-link UTM；既有 GitHub→Blogger；反向 deferred）
- `CLAUDE.md` §5（既有 9 個 GA4 event）/ §16（連結處理；含 §16.4 cross-link UTM）

---

（本文件結束）
