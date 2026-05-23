# Blogger Listener Strategy

本文件為 **Blogger 端 GA4 click tracking listener 之策略決議**；屬 docs-only proposal；**本批 phase `20260522-blogger-listener-strategy-doc-a` 不修改任何 source / template / content / settings / build / dist / deploy**。

對應上層：
- `CLAUDE.md` §2.1（Blogger 站定位：既有流量 + AdSense 收益；手動發布流程）/ §5（既有 GA4 events）/ §17（文章頁版型）
- `docs/click-tracking-governance.md` §9.3（Phase 2 Rollout：GitHub vs Blogger listener 不對稱）
- `docs/20260522-pm-phase-2-batch-plan.md` §9（Blogger Strategy 三 candidate plan）/ §10（Reverse UTM Plan）
- `docs/ga4-link-tracking-spec.md` §3.5（Blogger to GitHub UTM；source landed pm-24a/b/c；un-deployed；dormant）
- `docs/hashtag-slug-decision.md`（hashtag span→a + tag_slug 之另一前置 spec；本 doc 與其平行）
- `docs/blogger-export.md`（Blogger 匯出系統；HTML / theme CSS / copy-helper pipeline）

---

## §1 背景

### 1.1 GitHub Pages 端 click tracking 架構已就位

per `docs/click-tracking-governance.md` §2.1 + 2026-05-22 之既有 commits：

| 元件 | 路徑 | 狀態 |
|---|---|---|
| `trackEvent` helper | `src/js/modules/ga4-events.js` | ✅ 既有；wrap `gtag('event', name, params)`；無 gtag 時 silent no-op |
| Delegated click listener | `src/js/modules/link-tracker.js` | ✅ 既有；document-level `click` listener；掃 `[data-ga4-event]` + 讀 `data-ga4-param-<key>` |
| EJS attr helper partial | `src/views/tracking/ga4-events-helper.ejs` | ✅ 既有；2026-05-22 latent parser bug 已根治（commit `aa7b594`）|
| main.js wiring | `src/js/main.js` line 14 `initLinkTracker()` | ✅ 已 wire；每頁載入即生效 |
| `data-ga4-*` attr 注入 | `src/views/pages/post-detail.ejs`（affiliate top/bottom + relatedLinks + otherLinks）| ✅ source 已落地（待 deploy）|

→ GitHub Pages 端為 **complete click tracking pipeline**：attr 由 EJS render → Vite bundle 之 listener 自動 fire → GA4 production property 接收。

### 1.2 Blogger 端 full export template 無 Vite bundle

per `docs/blogger-export.md` + `src/views/blogger/blogger-post-full.ejs`：

```text
Markdown 文章
→ build:blogger 產 dist-blogger/posts/{slug}/post.html
→ user 手動複製 post.html 到 Blogger 後台
→ Blogger 平台 render 為文章頁
```

**Blogger 文章頁之 JavaScript 來源**：
- Blogger 主題層級 `<head>` 之 `<script>`（含 GA4 gtag.js；user 於 pm-45 已手動貼）
- Blogger 主題層級之 widget / footer JS
- **不**含本系統之 `src/js/main.js` Vite bundle
- **不**含 `link-tracker.js` / `ga4-events.js`

→ Blogger 端 **post HTML 為 `<div class="lab-blogger-article">...</div>` 之 standalone fragment**；無對應 listener。

### 1.3 Blogger template 即使輸出 `data-ga4-*` attr，無 listener 不會 fire

關鍵事實：
- 即使在 `blogger-post-full.ejs` 之 `<a>` 加 `data-ga4-event="click_..."` + `data-ga4-param-*`
- 沒有對應 `document.addEventListener('click', ...)` 在 Blogger 文章頁載入
- 點擊時 **無 GA4 event 送出**
- 訪客點擊只會走 native anchor behavior（含 UTM URL 之 referrer attribution + GA4 自動 `page_view` 於 destination）

⚠️ 此為 **GitHub vs Blogger 之根本不對稱**（per `docs/click-tracking-governance.md` §9.3）；本 doc 之主要決議題。

---

## §2 現況

### 2.1 GitHub 端已完成 / 已規劃 events

| event name | 狀態 | 落地 commit / phase |
|---|---|---|
| `click_affiliate_cta`（top/bottom）| ✅ source 已落地 | `6785bb6` / `221a87c`（5/21 night）|
| `click_related_link` | ✅ source 已落地 | `aa7b594`（5/22 pm）|
| `click_other_link` | ✅ source 已落地 | `aa7b594`（同上）|
| `click_hashtag` | ⏸ 未來；前置 spec `docs/hashtag-slug-decision.md` 已落地 `f61f58d` | 屬 Phase 2 hashtag rollout（tags.json → span→a → attr）|

⚠️ **deploy 狀態**：以上 source 皆**尚未** deploy 至 GitHub Pages 線上版本；GA4 production 尚無對應 event 流量資料。

### 2.2 Blogger 端目前狀態

| 維度 | 狀態 |
|---|---|
| `blogger-post-full.ejs` HTML 渲染 | ✅ 完整（含 affiliate / relatedLinks / otherLinks / hashtag 區塊）|
| `data-ga4-*` attr 注入 | 🔴 **無**；template 未加任何 attr |
| Listener strategy | 🔴 **無**（本 doc 之決議目標）|
| Blogger → GitHub Pages reverse UTM | 🟡 **source landed pm-24a/b/c（`7e1d356` / `e2309e9` / `7c769fe`；2026-05-23）；un-deployed；dormant**（per `CLAUDE.md` §16.4；pm-26 deploy verify 才 user 手動重貼 + GA4 Realtime 驗收）|
| Blogger 端 GA4 gtag.js | ✅ 主題級已貼（pm-45 `f32f7d3` deploy；user Realtime 驗收通過）|
| Blogger 端 GA4 自動 `page_view` event | ✅ 自動 fire（gtag.js 內建）|

### 2.3 跨平台 GA4 attribution 之現狀

| 訪客路徑 | GA4 attribution 機制 | 狀態 |
|---|---|---|
| FB → Blogger | `utm_source=facebook&utm_medium=social&utm_campaign={page}_post&utm_content={slug}` + `page_view` | ✅ 已實作 |
| FB → GitHub | 同上 | ✅ 已實作 |
| GitHub → Blogger（cross-link）| `utm_source=github_pages&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links\|other_links` + `page_view` | ✅ 已實作（`ga4-url-builder.js` `applyCrossSiteUtm`）|
| **Blogger → GitHub（cross-link）** | reverse UTM **source landed pm-24a/b/c**（`utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links\|other_links` + `target="_blank"` + `rel` 合併 `nofollow noopener noreferrer`）；un-deployed；dormant | 🟡 source live；deploy 待 pm-26 |
| Blogger 內部 click（affiliate / related / other / hashtag）| **無 click event**；僅 `page_view` 之 referrer 可看出 source | 🔴 無 listener |

---

## §3 問題定義

### 3.1 Blogger 是否應該支援與 GitHub 同一套 `data-ga4-*` attribute convention

**選項**：
- (a) **應該支援**：未來若 Blogger listener 落地，attr 可直接複用；schema 跨平台一致
- (b) **不應該**：Blogger 無 listener；attr 上線變成 dead code 與誤導；增加 template 複雜度

### 3.2 Blogger 是否應該內嵌一段最小化 JS listener

**選項**：
- (a) **應該內嵌**：每篇 post.html 帶 ~20-30 LOC `<script>`；自含 listener；不依賴 Blogger 主題
- (b) **應該主題級**：listener 一次性貼於 Blogger 主題 footer / template；post HTML 不重複嵌入
- (c) **不應該做**：依靠 UTM + auto `page_view` 已足；不必須 click event

### 3.3 Blogger 是否允許 gtag / GA4 event 送出

**事實核查**：
- ✅ Blogger 允許 `<script>` 標籤（主題級 + post HTML 皆可；某些版本有 sanitize 規則需測）
- ✅ `gtag.js` 已於 Blogger 主題級載入（pm-45）→ `window.gtag` 全域可用
- ✅ `gtag('event', name, params)` 在 Blogger 文章頁可正常呼叫
- ⚠️ Blogger 之 `<script>` policy 可能因主題 / 模板 / Blogger 後台設定而異；屬未來 listener 落地時之 testing item

### 3.4 Blogger 與 GitHub 之 event name / params 是否要一致

**強烈推薦：一致**

per `docs/click-tracking-governance.md` §3.2（GA4 Event Layer）+ `docs/ga4-parameter-naming-registry.md` §6.1（snake_case event name）：

- GA4 後台之 events 列表 / dimension 切片應跨平台統一
- 否則 GitHub 端之 `click_related_link` 與 Blogger 端之 `click_related_link_blogger`（假設）會切碎 dimension
- 不一致會造成跨平台 attribution 困難

→ 若 Blogger listener 落地，**必**對齊 GitHub 之 event name + params。

### 3.5 Blogger template 匯出內容是否適合加入 `<script>`

**考量**：
- ✅ user 自行貼到 Blogger 後台時，文章 HTML 含 `<script>` 不會被 Blogger 預設 strip（依 user 主題 / 編輯模式）
- ⚠️ user 須以 **HTML 模式**貼（非 Compose 模式）；Compose 模式可能濾除 `<script>`
- ⚠️ `<script>` 在每篇 post HTML 重複 → ~20-30 LOC × N 篇 = 累積（雖小但顯眼）
- ⚠️ listener 修正時 → 所有舊文章 post HTML 須重貼

**結論**：可行但**維護成本中等**；主題級貼一次（per §4 方案 B-thematic）為更好之長期解法。

### 3.6 後續維護成本與風險

| 維度 | inline-per-post（4-B-inline）| theme-level（4-B-theme）| no listener（4-A / 4-D）|
|---|---|---|---|
| 初次 setup | per-post template 改造 + N 篇重貼 | 主題級 user 動作 1 次 | 0 |
| listener 修正 | 所有舊文章重貼 | 主題級重貼 1 次 | n/a |
| Blogger HTML 大小 | +20-30 LOC × N | 無變動 | 無變動 |
| 跨主題 portability | 文章 HTML 自含；換主題 OK | 換主題須重貼 listener | 無依賴 |
| 風險 | Blogger script policy；重貼成本 | 主題級 setup（user manual） | 無 |

---

## §4 候選方案

### 方案 A — Blogger 不接 listener / GitHub-only click tracking

**作法**：
- Blogger template **不**加任何 `data-ga4-*` attr
- Blogger template **不**加任何 click listener
- GA4 click event 僅在 GitHub Pages 端完整實作
- Blogger 端僅靠：
  - UTM URL 之 referrer attribution（含 FB → Blogger / GitHub → Blogger 既有 UTM）
  - GA4 auto `page_view` event
  - 訪客之離站動作不被本站追蹤

**優點**：
- ✅ **零 implementation cost**
- ✅ **零維護成本**
- ✅ Blogger HTML 結構簡潔
- ✅ 無 Blogger script policy 風險
- ✅ 對齊「Blogger 為過渡 / 既有流量入口」之保守定位（per `CLAUDE.md` §2.1）

**缺點**：
- ⚠️ Blogger 端之 affiliate CTA / relatedLinks / otherLinks / hashtag 點擊**完全無 event 資料**
- ⚠️ 跨平台 dimension 不完整（GitHub 有 / Blogger 無）

**適用條件**：
- Blogger 之 click 行為**不在分析優先順序**
- GitHub Pages 為主要分析對象
- 願意接受 Blogger 端「黑盒」狀態（僅 page_view 可見）

### 方案 B — Blogger Template Inline Minimal Listener

**作法**：
- 在 `blogger-post-full.ejs` 之輸出 HTML 內嵌 `<script>` block（~20-30 LOC）
- listener 為 document-level delegated click listener
- 讀 `data-ga4-event` + `data-ga4-param-*`
- 呼叫 `window.gtag('event', eventName, params)`（`gtag` 已於 Blogger 主題級載入）
- Blogger template 同步加 `data-ga4-*` attr 至 affiliate / relatedLinks / otherLinks / hashtag anchors

**示意 listener 結構**：

```js
(function() {
  document.addEventListener('click', function(e) {
    var t = e.target.closest('[data-ga4-event]');
    if (!t) return;
    var eventName = t.getAttribute('data-ga4-event');
    if (!eventName || typeof window.gtag !== 'function') return;
    var params = {};
    for (var i = 0; i < t.attributes.length; i++) {
      var a = t.attributes[i];
      if (a.name.indexOf('data-ga4-param-') === 0) {
        params[a.name.slice('data-ga4-param-'.length)] = a.value;
      }
    }
    window.gtag('event', eventName, params);
  });
})();
```

**優點**：
- ✅ Blogger 端 click event 完整追蹤
- ✅ 文章 HTML 自含 listener；user 換 Blogger 主題不受影響
- ✅ 跨平台 event dimension 完整

**缺點**：
- ⚠️ 每篇 post HTML 重複嵌入 listener（~20-30 LOC × N 篇）
- ⚠️ Blogger 對 `<script>` 之 sanitize 行為需測試（依主題 / 編輯模式）
- ⚠️ user 須以 **HTML 模式**貼（非 Compose 模式）
- ⚠️ listener 修正時所有舊文章須重貼 Blogger 後台
- ⚠️ template 複雜度增加

**適用條件**：
- Blogger 端 click 行為**屬高優先**
- 願意承擔 per-post 重貼維護成本
- Blogger 主題對 `<script>` 友善

### 方案 C — Blogger 同 `data-ga4-*` Attr，Listener 延後（**不推薦**）

**作法**：
- 在 `blogger-post-full.ejs` 加 `data-ga4-*` attr（mirror GitHub 端）
- listener 另案處理；當前不實作

**理論優點**：
- attr 資料結構先一致
- 未來 listener 落地時直接生效

**實際缺點 / 為何不推薦**：
- 🔴 **attr 上線但永遠不會 fire** → 訪客 click → 無 GA4 event
- 🔴 **造成誤判**：GA4 後台之 events 列表會被 GitHub 端流量誤推為「全平台」涵蓋
- 🔴 **technical debt**：attr 存在但無對應 listener；後續 maintainer 易誤解為「Blogger 已接 click tracking」
- 🔴 **無 ROI**：增加 template 複雜度 + 文章 HTML 體積；換不到任何 event 資料

→ **明確拒絕**。除非已決定後續會做 listener，否則不建議先做 attr。

### 方案 D — Blogger 完全不做 Click Event；UTM Only（最保守）

**作法**：
- Blogger 端**完全不做** click event 追蹤
- Blogger → GitHub 之 cross-link 靠 **reverse UTM**（per `CLAUDE.md` §16.4 之 future spec）
- Blogger 內部點擊（含 affiliate / hashtag / 一般文章內連結）**不**追蹤
- 訪客行為僅靠 `page_view` event + URL referrer

**reverse UTM 規格**（per `docs/click-tracking-governance.md` §4 row 3 + `docs/ga4-link-tracking-spec.md` §3.5）：

```
utm_source=blogger
utm_medium=referral
utm_campaign=portable_blog_system
utm_content=related_links | other_links
```

**優點**：
- ✅ **最保守、最簡單**
- ✅ Blogger 端零 JS 改動 + 零 attr 改動
- ✅ 對齊既有「Blogger 為發布平台；非主要分析對象」定位
- ✅ 與既有 GitHub → Blogger UTM 對稱（mirror `applyCrossSiteUtm` pattern）

**缺點**：
- ⚠️ Blogger 內部 click 行為**完全不可見**（同 A）
- ⚠️ reverse UTM 僅追 cross-link；不追其他 internal Blogger interactions

**適用條件**：
- 想推進 Blogger → GitHub attribution（reverse UTM）
- 不打算做 Blogger 端 click event
- 短期 / 中期不打算上 Blogger listener

⚠️ **本方案與方案 A 之差別**：
- A：完全不做（含不做 reverse UTM）
- D：不做 click event；**做 reverse UTM**（cross-link 完整 attribution）

---

## §5 推薦方案

### 5.1 短期推薦：方案 D（reverse UTM；不急 Blogger listener）

**理由**：

1. ✅ **保守落地**：不動 Blogger template；不引入 `<script>`；風險最低
2. ✅ **完整 cross-link attribution**：Blogger → GitHub 之 UTM 補齊；對稱 GitHub → Blogger 既有實作
3. ✅ **對齊 `CLAUDE.md` §16.4 future spec**：reverse UTM 已列為待實作項
4. ✅ **無 ROI 假設**：可先 deploy GitHub click tracking 觀察實際流量資料；若 GitHub 端事件確認有價值，再評估 Blogger listener
5. ✅ **獨立於 listener decision**：reverse UTM 為 build 階段邏輯改動（mirror `applyCrossSiteUtm`）；不需 Blogger 端 JS

### 5.2 中長期評估：方案 A 為最低維護策略

**理由**：

- 若 user 評估後發現 Blogger click 行為**不必要**進入 GA4 dimension（例如：訪客多從 Blogger 跳到 GitHub 後才有互動 / Blogger 主要為 AdSense 收益而非 attribution 對象）
- 則方案 A 為**永久決議**；不上 listener；無維護負擔
- 對齊 Blogger 為「過渡 / 既有流量入口 / AdSense 收益站」定位（per `CLAUDE.md` §2.1）

### 5.3 中長期評估：方案 B-theme（主題級 listener）為 listener 落地路徑

**理由**：

若 user 後續決定**要做** Blogger click tracking：

- **不推薦 inline-per-post**（B-inline）：每篇 ~20-30 LOC × N 篇；listener 修正需重貼所有舊文章
- **推薦 theme-level**（B-theme）：listener JS 貼於 Blogger 主題級別（一次性 user 動作；對齊 pm-45 之 GA4 gtag 主題級貼法）
- **配合 source 改動**：`blogger-post-full.ejs` 加 `data-ga4-*` attr（mirror GitHub 端命名）；listener 另獨立檔案（如 `dist-blogger/theme/blogger-listener.js`）由 user 手動貼

### 5.4 明確拒絕：方案 C（attr 存在但 listener 延後）

**理由**：

- ⚠️ attr 上線但 click 不會 fire → **造成 GA4 後台誤判**
- ⚠️ Technical debt：attr 與 listener 之 binding 斷裂
- ⚠️ 維護成本沒減反增

→ **任何時候**都不建議：
- 若決定**不做** listener → 走方案 A 或 D（不加 attr）
- 若決定**要做** listener → attr + listener 同一 phase 落地（不拆開）

### 5.5 推薦序列總結

| 階段 | 推薦方案 |
|---|---|
| **短期**（本週 / 下週）| **方案 D**：先做 reverse UTM；不動 Blogger template 之 click 結構 |
| **中期**（GitHub deploy 後 1-2 週觀察）| 評估 Blogger 端 click 是否必要；若不必要 → 永久採方案 A；若必要 → 進入方案 B-theme planning |
| **長期**（若做 listener）| **方案 B-theme**：主題級 listener + 文章 attr；獨立 phase 完整實作 |
| **永不採用** | **方案 C**：attr 存在但 listener 延後 |

---

## §6 建議 Event / Params 一致性

若未來 Blogger listener 落地，event name + params **必**與 GitHub 一致（per §3.4）。

### 6.1 Event Name 對齊（per `docs/click-tracking-governance.md` §5）

| GitHub 端 event（既有 source）| Blogger 端建議 event（未來）|
|---|---|
| `click_affiliate_cta` | `click_affiliate_cta`（同名）|
| `click_related_link` | `click_related_link`（同名）|
| `click_other_link` | `click_other_link`（同名）|
| `click_hashtag`（未來；per `docs/hashtag-slug-decision.md`）| `click_hashtag`（同名；前提：hashtag span→a 同 GitHub 完成）|
| `click_cross_site_link`（reserved）| 同名；用於 source/target 區分 |

### 6.2 Params 對齊

| Param | GitHub 既有 | Blogger 對應 |
|---|---|---|
| `post_slug` | ✅ | 同 |
| `link_label` | ✅ | 同 |
| `link_type` | ✅（`internal` / `cross_site` / `external` / `affiliate`）| 同 |
| `link_url` | ✅ | 同 |
| `outbound` | ✅（`'true'` / `'false'` 字串）| 同 |
| `placement` | ✅（affiliate `article_top` / `article_bottom`）| 同 |
| `provider` | ✅（affiliate `link.network`）| 同 |
| `tag_slug` | ⏸ 未來 | 同 |
| `tag_label` | ⏸ 未來 | 同 |
| `platform` | optional | 建議加；`'blogger'` vs `'github_pages'` 區分 |
| `source_platform` / `target_platform` | optional | cross-site click 用 |

### 6.3 命名規則對齊

- ✅ snake_case event name + snake_case param key（per `docs/ga4-parameter-naming-registry.md` §6.1 + §6.4）
- ✅ Value 為 string（boolean 轉 `'true'` / `'false'`；對齊既有 helper convention）
- ✅ Param key 符合 `/^[a-zA-Z0-9_-]+$/`（per `src/views/tracking/ga4-events-helper.ejs` regex）

### 6.4 reverse UTM 命名（方案 D 之 implementation 規格）

per `docs/click-tracking-governance.md` §4 row 3 + `docs/ga4-parameter-naming-registry.md` §4.2：

```
utm_source=blogger
utm_medium=referral
utm_campaign=portable_blog_system
utm_content=related_links | other_links
```

snake_case；對稱 GitHub → Blogger 既有實作（`utm_source=github_pages`）。

---

## §7 未來實作順序建議

**本 doc 不啟動任何實作**；以下為**未來實作 phase 之建議順序**：

| # | 階段 | 範圍 | 阻擋 |
|---|---|---|---|
| 1 | **Deploy GitHub Pages**（含本日已 commit 之 relatedLinks / otherLinks attr）| deploy 既有 `dist/` | user 意願 |
| 2 | **GA4 Realtime / DebugView 驗收**（GitHub 端 `click_related_link` / `click_other_link` / `click_affiliate_cta`）| docs + user 操作 | #1 完成 |
| 3 | **Blogger → GitHub reverse UTM read-only plan**（純 plan；不實作）| docs only | 無 |
| 4 | **Blogger → GitHub reverse UTM implementation**（per §6.4 + mirror `applyCrossSiteUtm`）| `src/scripts/ga4-url-builder.js`（新增 `isGithubCrossLink` / `applyCrossSiteUtm` source 端擴展）+ `src/scripts/build-blogger.js`（新增 `deriveRenderedCrossLinks` mirror）| #3 完成 |
| 5 | **觀察期**（GitHub click event + reverse UTM 上線後 1-2 週 GA4 後台觀察）| user 操作 | #2 + #4 完成 |
| 6 | **Decision check-in**：Blogger 端 click event 是否必要？| docs / discussion | #5 觀察結果 |
| 7 | **（若必要）Blogger listener strategy decision**：A 永久 / B-theme implementation | docs | #6 結論 |
| 8 | **（若 B-theme）Blogger listener implementation**：主題級 listener JS + post template attr 同 phase 落地 | source（blogger-post-full.ejs + 新增 `dist-blogger/theme/blogger-listener.js` 等）+ user 主題級貼 listener | #7 結論為 B |
| 9 | **（若 B）Blogger hashtag click（per `docs/hashtag-slug-decision.md`）**：hashtag span→a + tag_slug + attr | source | #8 + tags.json 建立 |

### 7.1 拆批原則（per memory + `docs/20260522-pm-phase-2-batch-plan.md` §4.1）

- ✅ 每階段獨立 commit
- ✅ source 與 docs 分批
- ✅ GitHub 端先 / Blogger 端後（per `docs/20260522-pm-phase-2-batch-plan.md` §4.1 既有原則）
- ✅ 觀察期之後再決定 Blogger 端 ROI

### 7.2 與 `docs/click-tracking-governance.md` §10 + `docs/hashtag-slug-decision.md` §7 之對齊

| 文件 §10 / §7 | 本 doc §7 |
|---|---|
| governance §10 順序 5（Blogger → GitHub reverse UTM）| 本 doc #3 / #4 |
| governance §10 順序 6（GA4 DebugView SOP）| 本 doc #2 |
| hashtag-slug-decision §7 #1-#5（tags.json → span→a → attr）| 本 doc #9（前提：Blogger 端先決議 listener strategy）|

---

## §8 風險與 Rollback

### 8.1 Blogger Template Script 風險

| 風險 | 嚴重度 | 緩解 |
|---|---|---|
| Blogger 對 `<script>` 之 sanitize | 🟡 中（依主題 / 編輯模式）| user 須 HTML 模式貼；testing item |
| Blogger Compose 模式自動 strip `<script>` | 🟡 中 | user 教學 + checklist |
| Blogger 主題級 listener 之載入時機 | 🟢 低 | DOMContentLoaded vs document-ready；可測試 |

→ 方案 B 才有此風險；方案 A / D 無。

### 8.2 Blogger 平台限制

| 風險 | 嚴重度 | 緩解 |
|---|---|---|
| Blogger 後台貼 HTML 模式之 sanitize | 🟡 中 | 主題級 listener 避免（B-theme）|
| Blogger 主題級 JS 載入順序 | 🟢 低 | listener 依賴 `window.gtag` 已存在；可加 polling 或 retry |
| Blogger 平台 deprecation / 改版 | 🟡 中（外部因素）| 屬不可控；不影響本決議 |

### 8.3 GA4 Event 重複計數

| 風險 | 嚴重度 | 緩解 |
|---|---|---|
| 同一連結同時 fire GitHub event + Blogger event（不可能；訪客只在一個平台）| 🟢 無 | n/a |
| 同一頁同時有 GitHub listener + Blogger listener 啟動 | 🟢 無（兩平台環境互斥）| n/a |
| Blogger listener 對 `[data-ga4-event]` 之 click 過度 match | 🟡 中 | listener 加 platform-specific guard（如 `closest('.lab-blogger-article')`）|

### 8.4 與 GitHub Tracking 不一致風險

| 風險 | 嚴重度 | 緩解 |
|---|---|---|
| event name drift（GitHub `click_affiliate_cta` vs Blogger `click_affiliate_cta_blogger`）| 🟡 中 | 命名 governance；本 doc §6 明示一致 |
| param schema drift | 🟡 中 | 同上；參數對齊 §6.2 |
| 命名違反 GA4 reserved event | 🟢 低（已避開）| GA4 reserved events 不含 `click_*` |

### 8.5 維護成本

| 維度 | 方案 A | 方案 D | 方案 B-inline | 方案 B-theme |
|---|---|---|---|---|
| 初始 setup | 0 | 改 `ga4-url-builder.js` + `build-blogger.js`（中型）| template 改 + N 篇重貼（大）| 主題級 1 次貼（小）+ template attr 改（中）|
| listener 修正 | n/a | n/a | 所有文章重貼 | 主題級重貼 1 次 |
| user 體驗 | 無 | 無感 | 須 HTML 模式 + 重貼 | 一次性 setup |
| 長期 risk | 0 | 0（屬 source 邏輯）| 中（per-post technical debt）| 低 |

### 8.6 Rollback 方式

| 階段 | rollback |
|---|---|
| 本 doc | revert single commit（純 docs；無 source 影響）|
| reverse UTM implementation（方案 D 之 #4）| revert source commits；既有 Blogger build 不影響（attr append-only at build URL）|
| Blogger listener inline（方案 B-inline）| revert template；N 篇須重貼新版（無 listener） |
| Blogger listener theme-level（方案 B-theme）| user 主題級拔 listener 程式 + revert template attr |
| Blogger hashtag click | 同 hashtag-slug-decision §8.6 |

---

## §9 本批不做事項

per spec 之「禁止事項」+ docs-only 性質：

| 項目 | 不做 |
|---|---|
| 改 Blogger template（`blogger-post-full.ejs`）| ✅ 不做 |
| 加 Blogger listener（任何形式）| ✅ 不做 |
| 加 `data-ga4-*` attr 至 Blogger template | ✅ 不做 |
| 做 Blogger → GitHub reverse UTM | ✅ 不做（屬獨立 phase）|
| 改 `src/scripts/ga4-url-builder.js` | ✅ 不做 |
| 改 `src/scripts/build-blogger.js` | ✅ 不做 |
| 改 `ga4.config.json` | ✅ 不做 |
| 改 GitHub `post-detail.ejs` | ✅ 不做 |
| 改 `build-github.js` | ✅ 不做 |
| build / validate | ✅ 不做 |
| deploy | ✅ 不做 |
| 動 gh-pages / deploy repo | ✅ 不做 |
| GA4 production 驗收 | ✅ 不做 |
| 建立 `content/settings/tags.json` | ✅ 不做（屬 hashtag rollout 之獨立 phase）|

---

## §10 Acceptance Criteria（本文件完成條件）

| # | 條件 | 滿足 |
|---|---|---|
| 1 | 文件清楚列出 A/B/C/D 方案 | ✅ §4 四方案各自獨立章節 + 優缺點對照 |
| 2 | 明確標出短期推薦策略 | ✅ §5.1：**短期方案 D**（reverse UTM；不急 listener）|
| 3 | 明確說明為什麼 Blogger attr 沒 listener 不會 fire | ✅ §1.3 + §4 方案 C 明確說明 + §5.4 顯式拒絕 |
| 4 | 明確列出 deferred 實作順序 | ✅ §7 之 9 步順序 |
| 5 | 完全 docs-only | ✅ §9 列 13 項不做事項 |

---

## §11 Cross-links

- `CLAUDE.md` §2.1（Blogger 站定位）/ §5（既有 GA4 events）/ §16.4（cross-link UTM；含 future Blogger → GitHub）/ §17（文章頁版型）
- `docs/click-tracking-governance.md` §4 row 3（reverse UTM 規格）/ §5（GA4 event name 對照）/ §9.3（GitHub vs Blogger listener 不對稱）/ §10（Phase 2 rollout 順序）
- `docs/ga4-link-tracking-spec.md` §3.5（Blogger → GitHub UTM；source landed pm-24a/b/c；un-deployed；dormant）
- `docs/ga4-parameter-naming-registry.md` §4.2（Blogger → GitHub UTM 既建議規格）/ §6.1（event name 命名規則）/ §6.4（param 命名規則）
- `docs/20260522-pm-phase-2-batch-plan.md` §9（Blogger Strategy 三 candidate plan：A/B/C 對應本 doc 之 B-inline/B-theme/A）/ §10（Reverse UTM Plan）
- `docs/hashtag-slug-decision.md`（hashtag span→a + tag_slug；本 doc §7 #9 之前置）
- `docs/blogger-export.md`（Blogger 匯出系統；HTML / theme CSS / copy-helper pipeline）
- `src/views/blogger/blogger-post-full.ejs`（Blogger HTML 結構 reference）
- `src/scripts/ga4-url-builder.js`（既有 `applyCrossSiteUtm`；reverse UTM 之 mirror 目標）
- `src/scripts/build-blogger.js`（reverse UTM implementation 目標檔之一）
- `src/views/tracking/ga4-events-helper.ejs`（GitHub 端 attr helper；event/param naming 對齊參考）

---

（本文件結束）
