# GA4 Backend Event Receipt Record — Article Bottom Nav

- **Phase**：`20260615-am-6-ga4-bottom-nav-backend-event-receipt-record-docs-only-a`
- **日期**：2026-06-15
- **性質**：**docs-only**（不改 source / 不 build / 不 deploy）
- **baseline**：`main` HEAD == origin/main == `feca894`（`docs(ga4): record live bottom nav dom verification`）；working tree clean
- **deploy 對應**：gh-pages deploy commit `48c03d0`（am-4；source snapshot `d326c60`）

> 本記錄確認 **GA4 backend 已收到 `click_other_link` 事件**（Realtime 可見）。
> **不宣稱**所有 custom parameters 皆已完整逐項驗證——參數檢查狀態為 **PENDING / PARTIAL**（見 §4 / §5 / §8）。

---

## 1. Purpose / scope

### 1.1 範圍

- ✅ 記錄 GitHub Pages article bottom nav click 已於 **GA4 Realtime** 出現 `click_other_link`（backend event_name receipt）。

### 1.2 明確不在範圍

- ❌ **不宣稱**所有 custom parameters 已完整驗證（PENDING / PARTIAL）。
- ❌ **不驗證 Blogger**（無 listener；不適用）。
- ❌ **不驗證 AdSense iframe click**（政策；不追蹤 / 不包覆 / 不攔截）。
- ❌ **不驗證 Auto Ads**。
- ❌ **不驗證 affiliate revenue**（以聯盟 / AdSense 後台報表為準）。
- ❌ **不對 content_script.js 之 console warning 做 source fix**（見 §6）。

---

## 2. Prior state carried forward

| 項目 | 值 |
|---|---|
| source `main` HEAD | `feca894` |
| deploy commit（沿用前次 deploy）| `48c03d0`（source snapshot `d326c60`）|
| Live DOM observation（am-5）| article bottom nav visible；anchor data attributes present（DevTools 確認）|
| 當前階段 | **backend event receipt check** |

---

## 3. Live test context

| 項目 | 值 |
|---|---|
| URL | `https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/` |
| page type | **middle article** |
| 使用者操作 | 點擊文章底部 nav（上一篇 / 下一篇）連結 |
| GA4 property / Realtime | 畫面出現 `click_other_link` |
| observed count | **5** |

---

## 4. Backend event receipt result

| 項目 | 狀態 |
|---|---|
| article bottom nav visible | ✅ **PASS** |
| `data-ga4-*` attributes present（DOM）| ✅ **PASS** |
| GA4 Realtime `event_name = click_other_link` visible | ✅ **PASS** |
| GA4 Realtime count observed | **5** |
| parameter inspection（surface / click_area / nav_direction / post_slug / target_slug / target_url / link_label）| 🟡 **PENDING / PARTIAL** |

→ **GA4 backend event receipt：PASS**（event_name 已確認抵達 GA4 property）。
→ **GA4 parameter inspection：PENDING / PARTIAL**（尚未逐項展開核對每個 param 值）。

---

## 5. Expected event / params still to inspect

下一步使用者於 GA4 DebugView / Realtime event detail 應逐項確認（目前僅 event_name 已確認）：

| 參數 | 預期值 |
|---|---|
| `event_name` | `click_other_link`（✅ 已確認）|
| `surface` | `github_pages` |
| `click_area` | `article_bottom_nav` |
| `nav_direction` | `previous` / `next` / `home` |
| `post_slug` | 當前文章 slug（source）|
| `target_slug` | 目標文章 slug，或 `home` |
| `target_url` | rendered href（production 帶 `/portable-blog-system` 前綴）|
| `link_label` | 可見目標連結文字 |

> 逐項對照 matrix 見 `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md` §4 / §5。

---

## 6. Chrome Console warning observation

| 項目 | 記錄 |
|---|---|
| Observed messages | `ObjectMultiplex - orphaned data for stream "app-init-liveness"`；`ObjectMultiplex - orphaned data for stream "background-liveness"`；`ObjectMultiplex - malformed chunk without name "[object Object]"` |
| source | `content_script.js` |
| Interpretation | 很可能為**瀏覽器擴充功能之 content-script noise**（`ObjectMultiplex` 為常見錢包 / 擴充注入腳本之 messaging layer）；**未對映**到 portable-blog-system 任何 source 檔；**不阻擋** nav click，也**不阻擋** GA4 event receipt（event count 5 已證實事件正常送達）|
| Recommended handling | **不做 source-fix**，除非於 **clean profile / 無痕模式 + 停用擴充**下仍能重現；若日後需要，請在停用擴充後重測 Console 並比對；本階段**只記錄**不修 |

⚠️ 明確：本 warning **不視為** portable-blog-system source failure；不針對 `content_script.js` 做任何修改。

---

## 7. AdSense status carried forward

| 項目 | 記錄 |
|---|---|
| AdSense slot / iframe | rendered |
| 視覺內容 | blank / unfilled（沿用 am-5 觀察）|
| 判定 | **不視為 source failure**（unfilled 為 AdSense 端正常狀態）|
| 不做事項 | 不 wrap / 不 intercept / 不 track iframe clicks |
| 收益 / fill 診斷 | deferred 至 AdSense 報表 / 未來獨立 checklist |

---

## 8. Remaining verification

1. 用 **GA4 DebugView 或 Realtime event detail** 展開 `click_other_link` 之 event parameters。
2. 逐項核對 §5 之預期值（surface / click_area / nav_direction / post_slug / target_slug / target_url / link_label）。
3. 若參數可見且與預期一致 → 建立 **final PASS record**（docs-only）。
4. ⚠️ 僅在**有實證**（參數不符 / 缺漏）後，才啟動 source micro-fix phase；無證據不預先改 source。

---

## 9. Recommended next phase

| Option | 內容 | 性質 |
|---|---|---|
| **A. GA4 parameter detail verification record** | 使用者於 GA4 event detail 逐項確認 params 後，建立 final parameter PASS record（docs-only）| docs-only（前提：使用者完成參數檢查）|
| **B. GA4 custom dimensions registration checklist** | docs-only：規劃在 GA4 後台註冊哪些 event param 為 custom dimensions（`nav_direction` / `click_area` / `surface` / `target_slug` / `link_label`）使報表可長期切片，per am-1 taxonomy D8 | docs-only |
| **C. Clean-browser console sanity check** | docs-only：規劃在無痕 / 停用擴充環境重測 Console，確認 §6 warning 為擴充來源 | docs-only |

**建議**：先走 **Option B 或 A**，**不要 source change**。B 使 backend 報表可切片（為後續分析價值）；A 為本記錄之直接後續（參數逐項閉環）。

---

## 10. Cross-links

- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（am-3 手動驗證 SOP；§4 matrix / §5 params）
- `docs/20260615-github-pages-live-dom-ga4-nav-observation-record.md`（am-5 front-end DOM observation）
- `docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`（am-1 taxonomy / custom dimension 候選 D8）
- `src/views/layout/article-bottom-nav.ejs`（nav partial）
- `src/js/modules/link-tracker.js`（delegated listener）

---

（本文件結束）
