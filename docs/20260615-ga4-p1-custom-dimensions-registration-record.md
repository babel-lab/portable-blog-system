# GA4 Priority 1 Custom Dimensions — Registration Record

- **Phase**：`20260615-am-9-ga4-p1-custom-dimensions-registration-record-docs-only-a`
- **日期**：2026-06-15
- **性質**：**docs-only**（記錄人工操作結果；不改 source / 不改 GA config / 不 build / 不 deploy）
- **baseline**：`main` HEAD == origin/main == `e45e847`（`docs(ga4): define cross-surface parameters`）；working tree clean

> 記錄使用者已於 GA4 後台手動建立 **Priority 1 event-scoped custom dimensions**，並已建立 Explore 報表雛形。
> **不**宣稱 Explore 已有資料；**不**宣稱所有 parameters 已驗證 PASS（參數值驗證仍 PENDING）。

---

## 1. Purpose / scope

- ✅ 記錄 GA4 Priority 1 event-scoped custom dimensions 已由使用者手動建立（per am-7 §8 §4）。
- ✅ 記錄 GA4 Explore 報表雛形已建立。
- ❌ **不**宣稱 Explore 已有資料（目前 no data → PENDING）。
- ❌ **不**宣稱所有 parameters 已驗證 PASS（參數值驗證另階段）。
- ❌ **不**驗證 Blogger；❌ **不**驗證 AdSense iframe click；❌ **不**驗證 Auto Ads / affiliate revenue。
- ❌ **不**改 source / GA config；❌ **不** deploy；❌ **不**實作 Blogger JS listener。

---

## 2. Prior state carried forward

| 項目 | 狀態 | 來源 |
|---|---|---|
| GitHub Pages article bottom nav deployed | ✅ | am-4（gh-pages `48c03d0`）|
| DOM data attributes verified | ✅ | am-5（DevTools）|
| GA4 Realtime `event_name = click_other_link` observed | ✅ | am-6（count 5）|
| backend event receipt recorded | ✅ | am-6 |
| cross-surface parameter spec completed | ✅ | am-8（`e45e847`）|
| custom dimensions checklist completed | ✅ | am-7（`e958a03`）|

---

## 3. Registered custom dimensions

使用者已於 GA4 後台 **Admin → Data display → Custom definitions** 建立以下 5 個 event-scoped 維度：

| order | dimension name | event parameter | scope | priority | status | notes |
|---|---|---|---|---|---|---|
| 1 | Click Area | `click_area` | Event | P1 | ✅ **REGISTERED** | 低基數；穩定；區分 article_bottom_nav vs otherLinks aside |
| 2 | Nav Direction | `nav_direction` | Event | P1 | ✅ **REGISTERED** | 3 值（previous/next/home）；極穩定 |
| 3 | Source Post Slug | `post_slug` | Event | P1 | ✅ **REGISTERED** | 來源文章 slug；隨文章數成長（中基數）|
| 4 | Target Slug | `target_slug` | Event | P1 | ✅ **REGISTERED** | 目標文章 slug 或 `home` |
| 5 | Surface | `surface` | Event | P1 | ✅ **REGISTERED** | 區分 github_pages / blogger（跨平台分析關鍵）|

> 與 am-7 §8 之 P1 註冊建議（order 1–5）完全一致。`link_type`（建議一併）與 P2/P3 維度尚未註冊（屬後續視需求）。

---

## 4. Explore report setup

| 項目 | 值 |
|---|---|
| suggested report name | `BLOG｜文章底部導覽點擊｜GitHub Pages` |
| rows（列）| Event name / Click Area / Nav Direction / Source Post Slug / Target Slug / Surface |
| values（值）| Event count（事件計數）|
| filter（篩選）| Event name **exactly matches** `click_other_link` |
| current Explore result | **no data currently shown** |
| status | 🟡 **PENDING, not FAIL**（維度剛註冊，需註冊後新事件 / 資料處理時間）|

---

## 5. Current status table

| 項目 | 狀態 |
|---|---|
| GA4 Realtime `click_other_link` observed | ✅ **PASS** |
| P1 custom dimensions registered | ✅ **PASS** |
| Explore report created | ✅ **PASS** |
| Explore data populated | 🟡 **PENDING** |
| parameter detail values confirmed in Explore | 🟡 **PENDING** |
| parameter detail values confirmed in DebugView | 🟡 **PENDING** |
| source change needed now | ❌ **NO** |

---

## 6. Interpretation

- ✅ 本記錄**收斂 P1 維度之手動註冊步驟**（registration step complete）。
- ⚠️ 本記錄**不**收斂 parameter-value verification（各參數值是否正確進入維度，仍待驗）。
- ⚠️ **註冊後產生的新事件**才應用於驗證（custom dimensions 通常不回填歷史資料）。
- ⚠️ Explore 在註冊後**立即無資料**屬 **waiting / pending**，**不**視為 source failure（資料處理需時間，且需註冊後之新點擊事件）。

---

## 7. Next manual verification checklist（使用者下一步）

1. 開 GitHub Pages **middle article**：`https://babel-lab.github.io/portable-blog-system/posts/github-pages-blog-planning/`
2. 維度註冊後**重新點擊** previous / next / home。
3. 確認 GA4 Realtime 仍看到 `click_other_link`。
4. **稍後**再看 Explore 報表（資料處理需時間，數小時～24h）。
5. 驗證維度之預期值：
   - **Click Area** = `article_bottom_nav`
   - **Nav Direction** = `previous` / `next` / `home`
   - **Source Post Slug** = `github-pages-blog-planning`（或當前文章 slug）
   - **Target Slug** = `portable-blog-system-mvp` / `we-media-myself2` / `home`
   - **Surface** = `github_pages`

> 逐項對照 am-3 checklist §4 matrix 與 am-8 §7 reporting model。

---

## 8. Recommended next phase

| Option | 內容 | 性質 |
|---|---|---|
| **A. GA4 Explore parameter detail verification record** | 待 Explore 出現資料後，逐項確認維度值並建立 verification record（docs-only）| docs-only（前提：Explore 有資料）|
| **B. GA4 DebugView parameter detail verification record** | 若使用者可於 DebugView 即時展開 event params 逐項確認，建立 record（docs-only）| docs-only（較不需等待）|
| **C. Blogger listener preanalysis** | 若使用者之後需要 Blogger 端 JS（theme-level delegated listener）| docs-only |
| **D. Blogger manual GA4 snippet copy-helper preanalysis** | 規劃由系統（build:blogger）產生 per-post nav snippet copy helper（填好 slug/url/label）| docs-only preanalysis |

**建議**：先 **Option A 或 B**（參數值逐項閉環）；**不 source change**。B 較快（DebugView 即時），A 需等 Explore 資料處理。

---

## 9. Cross-links

- `docs/20260615-ga4-custom-dimensions-registration-checklist.md`（am-7；§8 註冊表 / §5 命名）
- `docs/20260615-ga4-cross-surface-parameter-management.md`（am-8；§7 reporting model）
- `docs/20260615-ga4-bottom-nav-backend-event-receipt-record.md`（am-6；Realtime receipt）
- `docs/20260615-github-pages-live-dom-ga4-nav-observation-record.md`（am-5；DOM observation）
- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（am-3；§4 matrix / §6 DebugView steps）
- `content/settings/ga4.config.json`（measurementId `G-C77SMPF8VD`）

---

（本文件結束）
