# GA4 Article Bottom Nav — P1 Report Verified / Resume BLOG Build

- **Phase**：`20260615-pm-1-ga4-article-bottom-nav-p1-report-verified-resume-blog-build-docs-only-a`
- **驗證時間**：**20260615 17:35**（使用者於 GA4 後台出資料後，人工肉眼確認）
- **性質**：**docs-only**（不改 source / content / templates·views / dist / package.json·lockfile / GA4 設定程式碼 / Blogger 已輸出 post HTML；不 build / 不 deploy / 不產文 / 不重貼 Blogger）
- **baseline**：`main` HEAD == origin/main == `95430d1`（`docs(ga4): record p1 custom dimensions registration`）；working tree clean（`git status -sb`）

> 本記錄正式收斂 **GA4 Priority 1 自訂維度 / event parameters / `article_bottom_nav` click reporting 已通過人工驗證**，
> 並**解除**先前「等待 GA4 報表資料」之 idle freeze / pause 狀態，恢復 BLOG 系統建置。
> 本 phase **僅紀錄** GA4 通過與解除暫停，**不開始實作 ADMIN / 不改前台 / 不改 GA4 設定程式碼**。

---

## 1. Purpose / scope

- ✅ 記錄 GA4 P1 報表（Explore）已出現 **有效資料**，且維度 / 事件參數可於報表中被查詢、人工肉眼確認。
- ✅ 解除先前 GA4 P1「等待報表資料」之 idle freeze / pause（wait blocker resolved）。
- ✅ 整理下一階段 BLOG 系統建置建議（以回到 BLOG ADMIN 管理後台完整化為主線）。
- ❌ **不**實作 ADMIN；❌ **不**改前台 / source / GA4 設定程式碼。
- ❌ **不**驗證 Blogger 端 JS listener（Blogger nav GA4 屬未來手動回補 / 另開需求）。
- ❌ **不**驗證 AdSense iframe click / Auto Ads / affiliate revenue（各以對應後台報表為準）。

---

## 2. Prior state carried forward

| 項目 | 狀態 | 來源 |
|---|---|---|
| GitHub Pages article bottom nav deployed | ✅ | am-4（gh-pages `48c03d0`；source snapshot `d326c60`）|
| DOM `data-ga4-*` attributes verified | ✅ | am-5（DevTools）|
| GA4 Realtime `event_name = click_other_link` observed | ✅ | am-6（count 5）|
| cross-surface parameter spec completed | ✅ | am-8（`e45e847`）|
| custom dimensions checklist completed | ✅ | am-7（`e958a03`）|
| P1 custom dimensions registered | ✅ | am-9（`95430d1`）|
| **P1 Explore report populated（資料）** | 🟡 PENDING → ✅ **本 phase PASS** | 本記錄（20260615 17:35）|

→ am-9 當時 Explore「no data / PENDING」之唯一缺口，已於 **20260615 17:35** 由使用者出資料補齊。

---

## 3. GA4 report evidence summary（人工肉眼確認）

| 項目 | 值 |
|---|---|
| 驗證方式 | GA4 Exploration 報表，**人工肉眼確認** |
| Property / surface（報表畫面） | `https://babel-lab.blogspot.com/` GA4 property |
| Exploration name（類似） | `BLOG｜文章底部導覽點擊率…` |
| 日期區間 | 6月14日 ～ 2026年6月15日 |
| event_name / 事件名稱 | `click_other_link` |
| 核心辨識條件（Click Area） | `article_bottom_nav` |
| 維度已可見 | Click Area、Nav Direction、Source Post Slug、Target Slug、事件名稱 |
| Nav Direction 已出資料 | `next` / `previous` / `home`（三種方向皆有資料）|

### 3.1 Source Post Slug → Target Slug 已見有效資料樣本

| Source Post Slug | Target Slug | Nav Direction（推定）|
|---|---|---|
| `github-pages-blog-planning` | `we-media-myself2` | next / previous |
| `we-media-myself2` | `github-pages-blog-planning` | next / previous |
| `github-pages-blog-planning` | `home` | home |
| `portable-blog-system-mvp` | `home` | home |
| `portable-blog-system-mvp` | `github-pages-blog-planning` | next / previous |
| `github-pages-blog-planning` | `portable-blog-system-mvp` | next / previous |

→ source post slug 與 target slug 已可用於 **文章上下篇導覽** 與 **回首頁導覽** 之分析。

---

## 4. Verdict

- ✅ **GA4 P1 自訂維度 / event parameters / `article_bottom_nav` click reporting：PASS（人工驗證通過）**。
- ✅ **GA4 P1 wait blocker resolved**：先前「等待 GA4 報表資料」之 idle freeze / pause **解除**，可恢復 BLOG 系統建置。
- 維度可查詢：Click Area、Nav Direction、Source Post Slug、Target Slug、事件名稱皆可於報表切片。

---

## 5. 後續報表分析注意事項（重要）

- ⚠️ **篩選文章底部導覽時，須用 `event_name = click_other_link` **加上** `click_area = article_bottom_nav` 兩個條件**。
- ⚠️ **不要單看 `click_other_link`**：`click_other_link` 亦涵蓋 otherLinks aside 等其他「其他連結」點擊；單看會混入非底部導覽之點擊。
- 跨平台分析時再用 `surface`（`github_pages` / `blogger`）維度拆分（per am-8 §2 cross-surface principle）。
- Blogger 端文章底部導覽之 GA4 data attributes 為**未來手動回補 / 另開需求**，本 phase 不實作。

---

## 6. Idle freeze / pause 狀態

| 項目 | before | after（本 phase）|
|---|---|---|
| GA4 P1 report 等待資料 | 🟡 idle freeze / pause | ✅ **解除（resolved）** |
| BLOG 系統建置 | ⏸ 暫停（等 GA4 驗收）| ▶️ **可恢復** |
| 下一階段方向 | — | 回到 **BLOG ADMIN 管理後台完整化**（見 §7；本 phase 不實作）|

---

## 7. Recommended next phase（下一階段 BLOG 系統建置建議）

**主線建議：回到 BLOG ADMIN 管理後台完整化。**

- 現況：ADMIN 為「管理總覽頁雛形」階段。
- 目標：升級為可管理以下面向之系統：
  - 文章（list / 狀態 / draft·ready·published·archived）
  - 分類（categories.json）與標籤（tags.json）
  - slug / permalink
  - Blogger / GitHub Pages **surface**（per-post publishTargets / mode）
  - GA4 / AdSense / commerce **狀態**之總覽顯示
- ⚠️ **本 phase 僅紀錄 GA4 通過與解除暫停，不開始實作 ADMIN**。ADMIN 升級須另開 phase + 規格 preanalysis（先 docs-only 規劃 admin 資訊架構與唯讀總覽，再談可寫操作）。
- 並行可選（docs-only，不阻擋主線）：GA4 P2/P3 維度規劃、Blogger nav GA4 手動回補 copy-helper preanalysis。

---

## 8. Non-actions（本 phase 未做）

- 未改 `src` / `content` / `templates`·`views` / `dist` / `package.json`·lockfile / GA4 設定程式碼 / Blogger 已輸出 post HTML。
- 未 build / 未 deploy / 未 push gh-pages / 未產文 / 未重貼 Blogger / 未開 Blogger / 未開 GA4 後台操作（僅記錄使用者提供之報表結果）。
- 未實作 ADMIN / 未改前台功能 / 未動 GA4 event 程式碼。
- 未做 CLAUDE.md 壓縮·重排（僅最小必要 ledger 追加）。
- 唯一變更 = 本 doc + CLAUDE.md 極小 ledger sync。

---

## 9. Cross-links

- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md`（am-9；P1 維度註冊，本 phase 之直接前置）
- `docs/20260615-ga4-cross-surface-parameter-management.md`（am-8；cross-surface 命名 / `surface` 切分 / 報表 model）
- `docs/20260615-ga4-custom-dimensions-registration-checklist.md`（am-7；§8 註冊表 / §5 命名）
- `docs/20260615-ga4-bottom-nav-backend-event-receipt-record.md`（am-6；Realtime receipt）
- `docs/20260615-github-pages-live-dom-ga4-nav-observation-record.md`（am-5；DOM observation）
- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（am-3；§4 matrix / §5 params）
- `docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`（am-1；taxonomy）
- `content/settings/ga4.config.json`（measurementId `G-C77SMPF8VD`）

---

（本文件結束）
