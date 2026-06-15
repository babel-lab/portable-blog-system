# GitHub Pages 正式前台 DOM 觀察記錄 — Article Bottom Nav GA4 Wiring

- **Phase**：`20260615-am-5-github-pages-live-dom-ga4-nav-observation-record-docs-only-a`
- **日期**：2026-06-15
- **性質**：**docs-only**（不改 source / 不 build / 不 deploy）
- **baseline**：`main` HEAD == origin/main == `d326c60`（`docs(ga4): add article bottom nav debug checklist`）；working tree clean
- **deploy 對應**：gh-pages deploy commit `48c03d0`（am-4；source snapshot `d326c60`）

> 本記錄只代表 **front-end DOM wiring verified**（正式前台已出現 nav，且 anchor 具備 GA4 data attributes，由使用者以 DevTools 確認）。
> **不代表** GA4 backend（DebugView / Realtime）已收到事件——後端收訖仍須使用者另行手動驗證（見 §7）。

---

## 1. Purpose / scope

### 1.1 範圍

- ✅ 記錄 **GitHub Pages 正式前台**之 article bottom nav DOM 觀察。
- ✅ 只驗證 **DOM / data attributes / live rendering**（前台確實渲染、anchor 屬性正確）。

### 1.2 明確不宣稱 / 不在範圍

- ❌ **不宣稱** GA4 backend DebugView / Realtime 已 PASS（屬 PENDING；見 §7 / §8）。
- ❌ **不驗證 Blogger**（Blogger 無 Vite listener；本記錄不適用 Blogger）。
- ❌ **不驗證 AdSense 收益或廣告點擊**（收益以 AdSense 報表為準；不追蹤 / 不包覆 / 不攔截 AdSense iframe click）。

---

## 2. Current state carried forward

| 項目 | 值 |
|---|---|
| source `main` HEAD | `d326c60` |
| gh-pages deploy commit | `48c03d0`（`deploy: d326c60 snapshot (article bottom nav + ga4)`）|
| GitHub Pages URL | 已可開啟（project site `https://babel-lab.github.io/portable-blog-system/`）|
| article bottom nav | ✅ 已在正式前台出現 |
| validate:content（am-4 record）| 0 / 94 / 84 |

---

## 3. Live page observed

| 項目 | 值 |
|---|---|
| URL | `https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/` |
| page type | **middle article**（排序 index 1）|
| expected nav | 上一篇 + 下一篇 + 回首頁 |
| user observed | **nav visible**（前台確實顯示「上一篇 / 下一篇 / 回首頁」）|
| 觀察方式 | 使用者開啟正式 URL + Chrome DevTools 檢查 anchor |

---

## 4. Observed anchor attributes（使用者 DevTools 確認）

觀察之 anchor 為該頁「上一篇」連結，使用者於 DevTools Elements 取得之 HTML：

```html
<a class="lab-prev-next__prev lab-article-bottom-nav__link lab-article-bottom-nav__link--prev"
   href="/portable-blog-system/posts/portable-blog-system-mvp/"
   data-ga4-event="click_other_link"
   data-ga4-param-surface="github_pages"
   data-ga4-param-click_area="article_bottom_nav"
   data-ga4-param-nav_direction="previous"
   data-ga4-param-post_slug="github-pages-blog-planning"
   data-ga4-param-target_slug="portable-blog-system-mvp"
   data-ga4-param-target_url="/portable-blog-system/posts/portable-blog-system-mvp/"
   data-ga4-param-link_label="Portable Blog System MVP 開發筆記">
  <span class="lab-prev-next__label">上一篇</span>
  <span class="lab-prev-next__title">Portable Blog System MVP 開發筆記</span>
</a>
```

逐項記錄：

| 屬性 | 觀察值 |
|---|---|
| `event_name`（`data-ga4-event`）| `click_other_link` |
| `surface` | `github_pages` |
| `click_area` | `article_bottom_nav` |
| `nav_direction` | `previous` |
| `post_slug`（source）| `github-pages-blog-planning` |
| `target_slug` | `portable-blog-system-mvp` |
| `target_url` | `/portable-blog-system/posts/portable-blog-system-mvp/` |
| `link_label` | `Portable Blog System MVP 開發筆記` |
| visible label text | 上一篇 / Portable Blog System MVP 開發筆記 |

✅ 與 am-3 checklist §4 之 middle-article「上一篇」列**完全一致**（含 production basePath `/portable-blog-system` 前綴）。`target_url` / `target_slug` / `link_label` 皆非 `undefined`。

---

## 5. Interpretation

- **Front-end DOM wiring：PASS** — 正式前台已渲染 nav，anchor 具備完整 `data-ga4-event` + `data-ga4-param-*`。
- 既有 delegated link-tracker（`src/js/modules/link-tracker.js`）**應能讀取此 anchor**：它監聽 document-level click，掃 `[data-ga4-event]` 並剝除 `data-ga4-param-` prefix 組成 params，再呼叫 `trackEvent`（`ga4-events.js`）。本 anchor 完全符合該 convention（event 名 + param 前綴）。
- ⚠️ **此觀察尚不證明 GA4 backend 已收到事件**。DOM attr 正確 + listener 可讀 ≠ 事件已抵達 GA4 property。
- **GA4 backend receipt 仍需** GA4 Realtime / DebugView 手動驗證（見 §7）；在此之前後端收訖標 **PENDING**，不可標 PASS。

---

## 6. AdSense observation handling

| 項目 | 記錄 |
|---|---|
| AdSense block / iframe | 頁面上**已 render** `<ins class="adsbygoogle">` / iframe 區塊 |
| 目前視覺內容 | **空白 / unfilled**（DevTools 可見類似 `data-ad-status="unfilled"`）|
| 判定 | ⚠️ **不視為程式錯誤** — unfilled 為 AdSense 端正常狀態（無填充 / 低流量 / 新版位 / 投放時機）；屬廣告投放層面，非 source / render failure |
| 不做事項 | ❌ 不新增任何 click tracking；❌ 不包覆 AdSense iframe；❌ 不做 click interception；❌ 不把 unfilled 當作需修的 bug |
| 收益分析來源 | 一律以 **AdSense 報表 / 自訂渠道**為準；如未來要觀察 ad 曝光屬另開獨立 checklist phase（self-owned wrapper impression，非 ad click）|

---

## 7. Remaining manual GA4 verification（使用者下一步）

1. 開 GA4 後台 → **Reports → Realtime** 或 **Admin → DebugView**。
2. 開正式文章頁（newest / middle / oldest 三型，見 am-3 checklist §3）。
3. 點擊文章底部 nav 之 **previous / next / home** 各 link。
4. 回 GA4 確認 `click_other_link` event 進來。
5. 展開 event parameters，逐項檢查：
   - `surface`
   - `click_area`
   - `nav_direction`
   - `post_slug`
   - `target_slug`
   - `target_url`
   - `link_label`
6. 依 am-3 checklist §4 matrix（7 列）勾稽；negative checks：newest 無 next、oldest 無 previous。

> 完整操作步驟 + 異常分流見 `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md` §6–§8。

---

## 8. Pass / fail status table

| 項目 | 狀態 |
|---|---|
| GitHub Pages deploy visible | ✅ **PASS** |
| article bottom nav visible（前台）| ✅ **PASS** |
| GA4 data attributes present in DOM | ✅ **PASS**（使用者 DevTools 確認）|
| delegated listener backend event receipt | 🟡 **PENDING**（待 GA4 後端確認）|
| GA4 Realtime / DebugView | 🟡 **PENDING**（待使用者手動驗證）|
| AdSense block render | ✅ **OBSERVED**（rendered；目前 unfilled，非錯誤）|
| AdSense fill / 收益 | ⏭ **OBSERVED unfilled**（以 AdSense 報表為準；不在本記錄範圍）|

---

## 9. Recommended next phase

| Option | 內容 | 性質 |
|---|---|---|
| **A. GA4 backend verification record** | 使用者實際操作 GA4 Realtime / DebugView 後，建立 backend verification record（docs-only），把 §8 之兩項 PENDING 收斂為 PASS / FAIL | docs-only（前提：使用者完成手動驗證）|
| **B. GA4 custom dimensions registration checklist** | docs-only：規劃在 GA4 後台註冊哪些 event param 為 custom dimensions（`nav_direction` / `click_area` / `surface` / `target_slug` / `link_label`）使報表可切片，per am-1 taxonomy D8 | docs-only |
| **C. Blogger bottom nav / listener decision preanalysis** | docs-only：評估是否為 Blogger 端提供 prev/next/home + listener strategy（A 永久不追 vs B-theme），per `blogger-listener-strategy.md` §5 | docs-only |

**建議**：先走 **Option A 或 B**，**不要立刻 source-change**。A 為本記錄之直接後續（閉環 GA4 後端確認）；B 為使後端報表可切片之前置。

---

## 10. Cross-links

- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（am-3 手動驗證 SOP）
- `docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`（am-1 taxonomy / event family 決策）
- `src/views/layout/article-bottom-nav.ejs`（被觀察之 nav partial）
- `src/js/modules/link-tracker.js`（delegated listener；讀 `data-ga4-event` + `data-ga4-param-*`）
- `docs/github-deploy.md`（deploy runbook §5.4）

---

（本文件結束）
