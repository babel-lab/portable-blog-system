# 20260523 Phase 1 Status Audit

本文件為 BLOG / portable-blog-system 之 **2026-05-23 Phase 1 完成度盤點 snapshot**；屬 docs-only / 純 read-only；不修改 src / content / templates / dist；不 build / 不 deploy / 不 push。

本文件**不是**新規格；**不**啟動任何 implementation；**不取代** `phase-1-completion-report.md` / `20260522-phase-1-baseline-confirmation.md` / `20260522-phase-1-done-criteria.md` 之既有角色；屬 5/22 baseline 後再經 ~10 commits 後之**狀態盤點 + 排序建議**。

對應上層：
- `docs/20260522-phase-1-baseline-confirmation.md`（5/22 基礎可運行宣告 baseline）
- `docs/20260522-phase-1-done-criteria.md`（驗收口徑）
- `docs/20260522-eod-report.md`（5/22 日終態）
- `docs/20260522-night-admin-usability-report.md`（5/22 晚 admin 小修系列）
- `docs/20260522-ga4-click-tracking-manual-validation.md`（5/22 GA4 click 驗收）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 規格）
- `CLAUDE.md` §28 / §29 / §30

---

## 1. Audit Context

### 1.1 日期 / 範圍

| 項目 | 值 |
|---|---|
| **日期** | 2026-05-23 |
| **本批 phase** | `20260523-day-1-batch-1`（docs-only）|
| **盤點對象** | portable-blog-system Phase 1 是否仍為「靜態發布系統基礎可運行」|
| **盤點性質** | 5/22 baseline 後 +10 commits 之**差異重判** |
| **本批限制** | 僅產出 docs；不改 src / content / templates / dist；不 build / 不 deploy / 不 push |

### 1.2 與 5/22 baseline 之差異

自 `20260522-phase-1-baseline-confirmation.md`（commit `2971c1c`）後落地 10 commits（含 GA4 click attrs / Admin usability / reverse UTM plan 等）：

| 區段 | commit | 性質 |
|---|---|---|
| Admin 小修 5 連 | `0814c05` / `2597f44` / `8f23b9c` / `884437c` / `745c48d` | source（src/views/admin/index.ejs）|
| Admin night report | `4f985c1` | docs |
| GA4 affiliate top attr | `6785bb6` | source（post-detail.ejs）|
| GA4 affiliate bottom attr | `221a87c` | source（post-detail.ejs）|
| GA4 related/other links attr | `aa7b594` | source（post-detail.ejs + build-github.js）|
| Hashtag slug decision | `f61f58d` / `88d714f` | docs |
| Blogger listener strategy | `82400c7` / `735a308` | docs |
| Blogger→GitHub reverse UTM plan | `beff309` / `4924e85` | docs |
| GA4 inline attrs（helper await 議題繞開）| `1bbedc4` | source（post-detail.ejs）|
| GA4 click 手動驗收紀錄 | `81551ee` | docs |
| GA4 placement params for related/other links | `b94cf77` | source |

→ Phase 1 範圍**已被 5/22 + 22 night session 拉得更紮實**；5/22 baseline 表中標 deferred 之數項今日已部分落地。

### 1.3 Repo state

| 項目 | 值 |
|---|---|
| **source HEAD** | `b94cf77 fix(ga4): add placement params to related and other links` |
| **source branch** | `main`；up-to-date with `origin/main` |
| **working tree** | clean（僅 `.claude/` untracked，屬本機 harness 設定）|
| **deploy HEAD**（依 5/22 manual validation doc）| `bc5e6fd deploy: 1bbedc4 snapshot`（GA4 click tracking inline attrs）|
| **本批是否 build** | ❌ 不 build |
| **本批是否 deploy** | ❌ 不 deploy |

---

## 2. 維度 1：Blogger 發文流程

### 2.1 結論

✅ **基礎可運行**；屬手動貼文流程；自 Phase 9-f-c 系列收尾後穩定。

### 2.2 可產出之 Blogger artefact

| Artefact | 路徑 | 狀態 |
|---|---|---|
| Blogger post HTML | `dist-blogger/posts/{slug}/post.html` | ✅ 可產出（3 mode：full / summary / redirect-card）|
| copy-helper.txt | `dist-blogger/posts/{slug}/copy-helper.txt` | ✅ 13 個區塊完整輸出（含 book metadata、relatedLinks / otherLinks copy 段） |
| publish-checklist.txt | `dist-blogger/posts/{slug}/publish-checklist.txt` | ✅ 含 book-review / magazine + relatedLinks / otherLinks 內容檢查段 |
| meta.json | `dist-blogger/posts/{slug}/meta.json` | ✅ 可產出 |
| Blogger theme CSS | `dist-blogger/theme/blogger-{tokens,components,article,full-style}.css` | ✅ 可產出 |
| Blogger 首頁 / 目錄 HTML | `dist-blogger/index/` | ✅ 結構就位 |

→ per `phase-1-completion-report.md` §3 / §5；至少 1 篇 ready post（`we-media-myself2`）已通過 build × 5 pipeline。

### 2.3 手動貼文流程

當前流程仍為手動：

```
Markdown source
  ↓ (build:blogger)
dist-blogger/posts/{slug}/post.html
  ↓ (user 手動複製)
Blogger 後台 → 貼上 HTML / 標題 / 搜尋說明 / 標籤 / 自訂網址
  ↓ (user 預覽 + 發布)
publishedUrl 回填至 .publish.json
```

✅ 對齊 `CLAUDE.md` §2.1 之第一版策略（手動貼文；無 Blogger API auto publish）。

### 2.4 條件式區塊

per `phase-1-completion-report.md` §7.1，6 個 article block 兩端 parity 完成：

| Block | Blogger | GitHub | 條件式 render |
|---|---|---|---|
| affiliate-box top | ✅ | ✅ | `affiliate.enabled && top` |
| affiliate-box bottom | ✅ | ✅ | `affiliate.enabled && bottom` |
| download-box | ✅ | ✅ | `download.enabled && fileUrl` |
| book-photo | ✅ | ✅ | `book.coverImage && showBookPhoto` |
| hashtag | ✅ | ✅ | `tags.length > 0`（仍為 `<span>`；非 `<a>`）|
| relatedLinks / otherLinks | ✅ | ✅ | array 非空時 render |

### 2.5 連結 / 圖片 / hashtag 現況

| 維度 | 狀態 |
|---|---|
| **inline image** | ❌ 不自動上傳；user 手動上傳至 Blogger / Google Drive / 外部圖床；frontmatter `images[]` 可記錄 ref，per `CLAUDE.md` §22 |
| **relatedLinks / otherLinks 顯示前綴** | ✅ `[Youtube]` / `[台北市立圖書館]` 等已拆入 `platform` 欄位（per `docs/related-links-schema.md`）|
| **hashtag** | ⚠️ 仍為 `<span>`；非 `<a>`；無 click target；屬 Phase 2 `hashtag-slug-decision.md` 範疇 |
| **連結處理（rel / target）** | ✅ GitHub→Blogger 已套 `applyCrossSiteUtm`；Blogger→GitHub 反向 UTM 仍未實作（per `blogger-to-github-reverse-utm-plan.md` §1.2）|
| **XML / RSS** | N/A；Blogger 站不維護 RSS（Blogger 平台自有）|
| **AdSense 區塊** | partial 結構就位（schema ready；enabled=false）|

### 2.6 仍需手動之動作

| 動作 | 性質 |
|---|---|
| 圖片上傳 | user 手動（Blogger / Google Drive / 外部）|
| 貼文 | user 手動（複製 HTML + 標題 + 搜尋說明 + slug + 標籤）|
| 發布後 URL 回填 | user 手動執行 `npm run backfill:url` 或編輯 .publish.json |
| FB 推廣 | user 手動（fb sidecar 已含 metadata 結構；無 auto-post）|

---

## 3. 維度 2：GitHub Pages 靜態站

### 3.1 結論

✅ **production-readable**；已 deploy（HEAD `bc5e6fd`；GA4 click tracking inline attrs）；自 5/21 pm-46 GA4 enable 起持續上線。

### 3.2 結構

| 項目 | 狀態 | 路徑 |
|---|---|---|
| 首頁 | ✅ | `dist/index.html` |
| 文章詳細頁 | ✅ | `dist/posts/{slug}/index.html` |
| 分類頁 | ✅ | `dist/categories/{slug}/index.html` |
| 標籤頁 | ✅ | `dist/tags/{slug}/index.html` |
| 404 | ✅ | `dist/404.html`（GitHub Pages 自動 fallback）|
| sitemap | ✅ | `dist/sitemap.xml`（14 entries；過濾 noindex）|
| robots.txt | ✅ | 含 Disallow + Sitemap |
| Design System 頁 | ✅ | `dist/design-system/` |
| Back to Top | ✅ | per `src/js/modules/back-to-top.js` |
| Sticky Header | ✅ | per `src/js/modules/sticky-header.js` |
| Mobile Drawer | ✅ | per `src/js/modules/mobile-drawer.js` |
| basePath dev/build 分流 | ✅ | per `7c9f7ea`（pm-mid-4-b）|
| Cross-source mirror | ✅ | per Phase 9-i-f-b |

### 3.3 連結處理（GitHub 端）

| 連結類型 | 處理 |
|---|---|
| 外部連結 | ✅ `target="_blank" rel="nofollow noopener noreferrer"` |
| 聯盟連結 | ✅ 自動含 `sponsored`；rel 合併 |
| 站內連結 | ✅ 不加 UTM；不加 nofollow |
| GitHub→Blogger cross-link | ✅ 自動 UTM + target/rel；含策略 A（已含 UTM 保留 author intent）|
| Blogger→GitHub cross-link | 🔴 未實作（per `docs/blogger-to-github-reverse-utm-plan.md`）|

### 3.4 線上 production state

- ✅ HTTPS（GitHub Pages 預設 + 自動 cert）
- ✅ GA4 production live（measurementId `G-C77SMPF8VD`；5/21 pm-46 user 驗收通過）
- ⚠️ Custom domain 尚未啟用（per `docs/custom-domain-root-files-strategy.md`）
- ⚠️ AdSense 尚未申請 / 上線（依賴 custom domain）

---

## 4. 維度 3：GA4 / UTM

### 4.1 結論

✅ **GA4 production live + GitHub 端 click tracking 已落地**；🟡 event-level 驗收 partial；🟡 reverse UTM 規劃完成但未實作。

### 4.2 GA4 measurement

| 項目 | 狀態 |
|---|---|
| measurementId | ✅ `G-C77SMPF8VD`（per `ga4.config.json`）|
| enabled | ✅ `true` |
| 4-AND gating | ✅（ga4 存在 && enabled && measurementId 非空 && isProdBuild）|
| Realtime 驗收 | ✅（5/21 pm-46 user 手動驗收通過）|
| 線上 page_view fire | ✅（GitHub Pages 端 + Blogger 端兩 page paths；per 5/22 manual validation doc §2.3）|

### 4.3 Click tracking

| 項目 | 狀態 | 對應 commit |
|---|---|---|
| `link-tracker.js` document-level listener | ✅ 已 wire；自 main.js init | 既有 |
| `ga4-events.js` `trackEvent` helper | ✅ 既有 | 既有 |
| `ga4-events-helper.ejs` partial | ✅ 既有；當前 production 改採 **inline attrs** 繞開 await 議題 | `1bbedc4` |
| affiliate CTA top attr（GitHub）| ✅ landed | `6785bb6` |
| affiliate CTA bottom attr（GitHub）| ✅ landed | `221a87c` |
| relatedLinks attr（GitHub）| ✅ landed | `aa7b594` |
| otherLinks attr（GitHub）| ✅ landed | `aa7b594` |
| placement params for related / other | ✅ landed | `b94cf77` |
| hashtag click | ❌ 未落地（仍 `<span>`；屬 Phase 2 `hashtag-slug-decision.md`）| — |
| Blogger 端 click event | ❌ 不存在（無 Vite bundle；屬 `blogger-listener-strategy.md` 之 deferred）| — |

### 4.4 GA4 event-level 驗收

| 維度 | 狀態 |
|---|---|
| DOM attr 渲染（DevTools Elements）| ✅ 通過（6 attrs 全部渲染 per 5/22 manual validation §2.2）|
| page_view（兩平台 cross-site flow）| ✅ 通過 |
| `click_related_link` event 明細（DebugView）| 🟡 **pending** — user 尚未提供 DebugView 截圖；待補完 |
| `click_other_link` / `click_affiliate_cta` event 明細 | 🟡 pending；同上 |

→ 整體屬「80% 驗收」；event-level 後台確認尚未完成。

### 4.5 UTM 規則

| 方向 | 狀態 | UTM 規則 |
|---|---|---|
| GitHub → Blogger | ✅ 已實作 | `utm_source=github_pages` / `utm_medium=referral` / `utm_campaign=portable_blog_system` / `utm_content=related_links \| other_links` |
| Blogger → GitHub | 🟡 規劃完成；未實作 | per `blogger-to-github-reverse-utm-plan.md` §5；推薦 `utm_source=blogger` / `utm_medium=referral` / `utm_campaign=portable_blog_system` / `utm_content=related_links \| other_links` |
| FB → Blogger / GitHub | ✅ 既有實作 | per `promotion.config.json` UTM pattern |
| 內部站連 | ✅ 不加 UTM；避免污染 GA4 |
| affiliate URL | ✅ 不主動加 UTM（per `click-tracking-governance.md` §7.3）|

### 4.6 已知 governance gap

| Gap | 對應 |
|---|---|
| GA4 event 命名（CLAUDE.md §5 既有 9 個 vs governance doc 建議 `click_*` 前綴）reconcile | 屬 Phase 2 governance；未決 |
| utm_content plural / singular 對齊 | 已採 plural（`related_links` / `other_links`；對稱既有實作）|
| `campaign` per-post / per-series 欄位 | 未落地；當前 hard-code `portable_blog_system` |
| `tag_click` vs `click_hashtag` event name | 未 reconcile；無 user 表態 |

---

## 5. 維度 4：Admin

### 5.1 結論

✅ **read-only / dry-run 完整可用**；🔴 **無 write path**（依規格）；當前 6 ready posts 痛點低；結構已預防 ≥ 30 posts 之 UX 退化。

### 5.2 當前 Admin 能力

per `src/views/admin/index.ejs`（5/22 night session 後 +124 / -9）：

| 能力 | 狀態 | 對應 commit |
|---|---|---|
| 12 stat-cards 統計區（含 missing FB URL / missing output URL）| ✅ | `0814c05` |
| 列表 7 欄表頭 | ✅ |（既有）|
| 10 detail sections | ✅ |（既有）|
| Default recent N = 30 | ✅ | `2597f44` |
| Show-all toggle | ✅ |（既有 + night-3-b 重用）|
| Search bar | ✅ |（既有）|
| Category filter（從 posts 派生）| ✅ | `8f23b9c` |
| Series filter（架構就位；當前無 series data）| ✅ struct ready | `8f23b9c` |
| Sort dropdown（publishedAt desc / updatedAt desc / title asc）| ✅ | `884437c` |
| Missing metadata warning banner（detail panel）| ✅ | `745c48d` |
| FB sidecar metadata 顯示（fbPostUrl / fbPostedAt / fbPostId / fbCampaign / publishedAt）| ✅ |（既有；line 397-409）|
| Dry-run editor（preview only）| ✅ |（既有）|
| dev-mode-only（prod build 不產出）| ✅ |（既有 Plan B）|
| Banner / robots noindex | ✅ |（既有）|

### 5.3 不能做事項

| 動作 | 狀態 | 理由 |
|---|---|---|
| 寫 .fb.md sidecar | ❌ | FB-P5-c 未啟動；per `fb-sidecar-write-preflight-decision.md` §7 之 8 項 user checklist 未勾 |
| 寫 .md frontmatter（含 SEO description 等）| ❌ | Admin-2-b-2 未啟動；per `admin-2-write-pre-analysis.md` §7.2 |
| 新建 .fb.md | ❌ | FB-P5-e 未啟動 |
| 任何 fs.writeFile | ❌ | 仍 read-only / dry-run |
| Blogger / FB API 接入 | ❌ | 屬 `CLAUDE.md` §29 永不清單 |

### 5.4 文章多時之 UX 痛點預判

| 痛點 | 當前狀態 | 觸發條件 |
|---|---|---|
| 列表過長 | ✅ default recent 30 + show-all toggle | < 30 posts 時 default 全顯；≥ 30 時 toggle 啟動 |
| Filter 不足 | ✅ Category filter 已就位；Series filter 架構就位 | 待 series data 填入後 series filter 自動啟用 |
| 排序需求 | ✅ 3 sort options（publishedAt / updatedAt / title）| — |
| Missing metadata 不易發現 | ✅ detail panel warning banner | — |
| Pagination | ⚠️ 無；採 default recent N + toggle approach；≥ 100 posts 時可能仍卡 | ≥ 100 posts |

當前 6 posts 痛點：低；結構未來防範：足以撐到 ≥ 30 posts。

### 5.5 FB URL / FB metadata 回填規劃

| 維度 | 狀態 |
|---|---|
| FB sidecar schema（12 read-only 欄位）| ✅ 已定義（per `fb-sidecar-schema.md`）|
| Admin detail panel 顯示 4 FB 欄位 | ✅（fbPostUrl / fbPostedAt / fbPostId / fbCampaign）|
| `fb-post-url-missing` validate rule | ✅（severity=warning；per Phase 20260521-pm-34）|
| fbPublished completeness rule | ✅（fb.enabled=false 或 fbPostUrl/fbPostedAt 有值）|
| FB metadata write surface（FB-P5-c）| ❌ 未啟動；需 user 勾 preflight checklist |
| FB-P5-e（new sidecar create）| ❌ 未啟動；依賴 FB-P5-c |

→ 規劃**完整**；write surface 啟動需 user 表態。

---

## 6. 維度 5：Content source / metadata

### 6.1 結論

✅ Source of truth 完全本機；對齊 `CLAUDE.md` §1 / §3。

### 6.2 各維度 source of truth

| 維度 | Source | 性質 |
|---|---|---|
| **文章 markdown + frontmatter** | `content/{github,blogger}/posts/*.md` | ✅ 本機 source；可備份 / 搬家 |
| **.publish.json**（Blogger 平台 metadata；含 publishedUrl 等）| `content/{blogger}/posts/*.publish.json` | ✅ 本機 source；per `publish-json-schema.md` |
| **.fb.md**（FB 平台 metadata sidecar）| `content/{github,blogger}/posts/*.fb.md` | ✅ 本機 source；per `fb-sidecar-schema.md` |
| **站台設定 / 分類 / 標籤 / 廣告 / 社群 / promotion 等**| `content/settings/*.json` | ✅ 16 個 JSON 設定檔 |
| **GitHub Pages 線上**| build / deploy 結果（`gh-pages` branch）| derived；可重建 |
| **Blogger 線上**| user 手動貼文結果 | derived；URL 回填 .publish.json |
| **FB 粉絲頁線上**| user 手動貼文結果 | derived；URL / 時間 / postId 回填 .fb.md |

### 6.3 metadata 回填鏈

```
Blogger 發布
  → publishedUrl 回填至 .publish.json
  → relatedLinks / otherLinks 之 internal cross-link 才能引用真實 URL

FB 發布
  → fbPostUrl / fbPostedAt / fbPostId 手動填至 .fb.md
  → Admin completeness rule 判定 fbPublished=ok
```

✅ 兩條 metadata 回填鏈皆已**結構就位**；當前為 user 手動填入；future Admin write 啟動後可由 dry-run editor 寫入。

### 6.4 內容 sample

| Sample | 路徑 | 狀態 |
|---|---|---|
| Blogger ready post | `content/blogger/posts/20260515-we-media-myself2.md` | ✅ status=ready；通過 build × 5 |
| Blogger sample book review | `content/blogger/posts/20260504-sample-book-review.md` | ✅ |
| GitHub draft | `content/github/posts/20260504-github-pages-blog-planning.md` | ✅ |
| GitHub draft mvp | `content/github/posts/20260504-portable-blog-system-mvp.md` | ✅ |

---

## 7. 維度 6：Ads / monetization

### 7.1 結論

🟡 **AdSense 暫不可申請**（依賴 custom domain）；🟢 **affiliate block 可立即啟用**（schema ready；providers ready）。

### 7.2 AdSense

| 項目 | 狀態 |
|---|---|
| `content/settings/ads.config.json` | ✅ 結構就位；`enabled=false`；`adsenseClient=""`；slots 全 empty |
| 6 個 AdSense partial（post-top / middle / bottom / sidebar / home-inline / head）| ✅ 既有 |
| AdSense 申請 | 🔴 未申請；建議於 custom domain 啟用 + HTTPS Enforce 後申請 |
| GitHub Pages 上 AdSense 啟用 | 🔴 deferred；依賴 custom domain |
| Blogger AdSense | ✅ 既有；Blogger 平台已啟用（不在本系統管理範圍）|

### 7.3 Affiliate

| 項目 | 狀態 |
|---|---|
| `content/settings/affiliate-networks.json` | ✅ 含 2 providers（通路王 / 聯盟網）；rel auto-applied `sponsored nofollow noopener noreferrer` |
| Affiliate-box conditional render（top / bottom）| ✅ 兩端 partial 完整 |
| Affiliate CTA click event（`click_affiliate_cta`）| ✅ landed at GitHub end（top + bottom；per `6785bb6` + `221a87c`）|
| 統一 schema proposal | ✅ docs（per `ad-affiliate-schema-proposal.md`；15 欄位 + 4 provider）|
| 啟用某 book review post 之 `affiliate.enabled=true` | ⚠️ 當前 sample book review 之 affiliate.enabled 狀態待確認；可作為 Phase 2 first content batch 觸發 affiliate render + GA4 event 真實驗收 |

### 7.4 GitHub Pages 申請 AdSense 前之 affiliate strategy

per `ad-affiliate-schema-proposal.md` §6.1 + `custom-domain-root-files-strategy.md` §4.5：

- ✅ **GitHub Pages 端目前無 AdSense；可先放 affiliate 區塊**
- 路徑：book review post 之 `affiliate.enabled=true` + `affiliate.links[]` 填入通路王 / 聯盟網 URL
- 觸發 affiliate-box top / bottom 兩 partial render
- 對接 `click_affiliate_cta` event（已 landed）

→ **affiliate 為當前 GitHub 端唯一可立即啟用之 monetization 路徑**。

---

## 8. 維度 7：Design system

### 8.1 結論

✅ **基本可用**；DS-3 系列 resolved（10 fixes + 2 documented exemptions）；🟡 platform theme tokens 採保守 Option A 落地。

### 8.2 Token / 主色副色

| 維度 | 狀態 |
|---|---|
| `src/styles/abstracts/_tokens.scss` | ✅ 完整 |
| `_themes.scss` | ✅；Option A 保守版（`--lab-color-primary` + secondary alias + link 沿用 primary；其餘 reserved）|
| `_spacing.scss` / `_typography.scss` / `_breakpoints.scss` / `_mixins.scss` / `_z-index.scss` | ✅ 完整 |
| Blogger / GitHub theme class | ✅（`lab-site--blogger` / `lab-site--github`）|

### 8.3 Component / Layout

| 維度 | 狀態 |
|---|---|
| `src/styles/components/`（button / card / post-card / tag / hashtag / breadcrumb / adsense / social-follow / affiliate-box / book-photo / download-box / related-posts / prev-next / back-to-top / toc / code-block）| ✅ 完整 |
| `src/styles/layout/`（header / nav / mobile-drawer / footer / sidebar / grid）| ✅ 完整 |
| Hard-coded color | ✅ DS-3-c resolved（10 fixes + 2 exemptions `.lab-hero` gradient `#eff6ff` + `#fff`；屬 documented exemption）|
| BEM 命名 + `lab-` prefix | ✅ 一致 |
| Flexbox 優先 | ✅ 對齊 `CLAUDE.md` §9.4 |

### 8.4 仍可優化

per `phase-2-candidate-roadmap.md` §2.4 / §2.5：

| 項目 | 性質 | 阻擋 |
|---|---|---|
| DS-3-b platform theme 完整化（Option B 平台品牌色）| Phase 2 視覺優化 | user 設計師決方案 + 色票 hex |
| DS-3-b-blogger-entry（讓 themes 真進 Blogger CSS）| Phase 2 | user 需重貼 Blogger 後台 CSS |
| Visual regression test（DS-5）| 未啟動 | — |

---

## 9. 維度 8：Phase 1 結論

### 9.1 Phase 1 是否「基礎可運行」

✅ **是**；自 5/22 baseline 起持續通過；5/22 + night session +10 commits 進一步**縮小 Phase 2 範圍**：

| 5/22 baseline 列為 Phase 2 deferred | 5/23 狀態 |
|---|---|
| GA4 click listener 對接至 EJS templates | ✅ landed（affiliate top/bottom + relatedLinks + otherLinks）|
| EJS `data-ga4-*` attributes 注入 | ✅ landed（inline attrs；繞開 helper await 議題）|
| Affiliate CTA click event 對接 | ✅ landed |
| Admin usability small fixes（pagination / default recent / filter / sort / warning）| ✅ landed（5 commits）|
| Blogger → GitHub reverse UTM | 🟡 規格 docs 完成；未實作（per `blogger-to-github-reverse-utm-plan.md`）|
| Hashtag span→a + click_hashtag | ⚠️ slug decision docs 完成；未實作 |
| Blogger listener strategy | ⚠️ strategy docs 完成；短期推薦不做 |

### 9.2 Must Fix before Phase 1 close

🟢 **無 source-level must fix**。

唯一 pending：
- 🟡 **GA4 event-level 後台驗收**（user 於 GA4 DebugView 確認 `click_related_link` event 明細；屬 user 操作；非 source 改動）

### 9.3 Should Improve after Phase 1 close

| # | 項目 | 性質 |
|---|---|---|
| 1 | GA4 DebugView event 明細驗收 SOP 補完 | user 操作 + docs |
| 2 | Reverse UTM 落地（per `blogger-to-github-reverse-utm-plan.md` §10 之 7 步）| source（ga4-url-builder.js + build-blogger.js + blogger-post-full.ejs）|
| 3 | 啟用某 book review post 之 affiliate.enabled=true | content；驗收 `click_affiliate_cta` 實際 fire |
| 4 | Hashtag span→a + click_hashtag 對接 | source（DOM 結構變動）|
| 5 | GA4 event 命名 reconcile（CLAUDE.md §5 9 個 vs governance `click_*` 前綴）| governance decision |
| 6 | `campaign` per-post / per-series metadata | schema |

### 9.4 可延後至 Phase 2+

| # | 項目 | 阻擋 |
|---|---|---|
| 1 | Custom domain 啟用 | user 取得 domain + DNS provider access |
| 2 | AdSense 申請 / 啟用 | 依賴 #1 + AdSense 審核 |
| 3 | Admin write surface（FB-P5-c / Admin-2-b-2）| user 勾 preflight checklist |
| 4 | DS-3-b platform theme Option B | user 設計師決方案 + 色票 hex |
| 5 | DS-3-b-blogger-entry（重貼 Blogger 後台 CSS）| user 排程 + 一次性貼 CSS |
| 6 | Blogger listener implementation | 短期推薦不做；待 1-2 週觀察 GitHub click event 流量 |
| 7 | FB-P5-e（new sidecar create）| 依賴 FB-P5-c 落地 |

### 9.5 整體判定

✅ **Phase 1 達 Done 條件**；可正式視為「靜態發布系統可基礎運行」；**無阻擋 Phase 1 close 之 source-level item**。

---

## 10. 後續排序建議

### 10.1 今日剩餘時間建議順序

| Batch | 主題 | 性質 | 預估 | 推薦度 |
|---|---|---|---|---|
| **Batch 1**（已啟動）| Phase 1 完成度盤點文件（本文件）| docs | ~30 min | ⭐ 進行中 |
| **Batch 2** | GA4 click tracking spec 固化 | docs；補完 manual validation §5.1 之 SOP / DebugView 截圖路徑 / `click_other_link` 與 `click_affiliate_cta` 對應規格 | ~30-45 min | ⭐⭐ 高（直接強化 Phase 1 收尾證據鏈）|
| **Batch 3** | Admin overview audit | docs；對 5/22 night 5 fixes 落地後之**Admin 整體 read-only audit**（mirror `20260521-admin-overview-display-audit.md` 風格；補上新 filter / sort / warning 之檢視）| ~30-45 min | ⭐ 中（推 Admin 規格穩定化；非 source 修改）|
| **Batch 4** | 發布 workflow 文件 | docs；對 Blogger 手動貼文 + GitHub deploy + FB 推廣 + URL 回填之**端到端發布流程文件**（補強 `phase-1-user-operation-guide.md`）| ~45-60 min | ⭐ 中（Phase 1 user-facing SOP；長期維運價值高）|
| **Batch 5** | Design token audit | docs；對 DS-3 後之 token 完整盤點（Option A 保守版落地後之 readme / DS audit 更新）| ~30-45 min | ⭐ 低（DS-3 已 resolved；audit 屬補強性質；非阻擋 Phase 1）|

### 10.2 推薦順序

**推薦序：Batch 2 → Batch 3 → Batch 4 → Batch 5**

理由：
1. **Batch 2** 直接補強 GA4 driver-level 之證據鏈（manual validation 之 SOP 補完）；解決 5/22 留下的「event-level pending」尾巴；最 actionable
2. **Batch 3** 對 5/22 night 5 fixes 落地後之 Admin 做整體 audit；自然延續 night-6 report；風險最低
3. **Batch 4** 端到端 SOP 文件；user-facing 價值最高；可與 Batch 2 / 3 結果 cross-reference
4. **Batch 5** DS audit 屬補強；DS-3 已 resolved；非阻擋；可放最後

### 10.3 不建議今日啟動

| 項目 | 不建議理由 |
|---|---|
| Reverse UTM implementation | 規格已完整；落地屬獨立 phase；需 build + validate + deploy + user 重貼 Blogger；不適合在 docs batch 之間插入 |
| Affiliate.enabled=true 之 content batch | 屬 content 改動；非本日 docs-only 範疇 |
| Hashtag span→a 對接 | DOM 結構變動；屬 Phase 2 中風險批；不適合與 docs batch 混作 |
| Admin write surface 啟動 | 需 user 勾 preflight checklist；屬 user-blocking |
| Custom domain 啟動 | 需 user 取得 domain；屬 user-blocking |

---

## 11. 不做事項（本批 phase 鎖定項）

per spec：

- ❌ 不修改 `src/`
- ❌ 不修改 `content/`
- ❌ 不修改 `dist/`
- ❌ 不修改 deploy repo
- ❌ 不跑 `npm run build`
- ❌ 不跑 `npm run validate:content`
- ❌ 不 push
- ❌ 不 deploy
- ❌ 不實作 reverse UTM
- ❌ 不啟動 hashtag span→a
- ❌ 不啟動 Admin write
- ❌ 不啟動 custom domain
- ❌ 不啟動 AdSense 申請

---

## 12. Cross-links

- `CLAUDE.md` §28 / §29 / §30（規範來源）
- `docs/20260522-phase-1-baseline-confirmation.md`（5/22 baseline 宣告）
- `docs/20260522-phase-1-done-criteria.md`（驗收口徑）
- `docs/20260522-eod-report.md`（5/22 日終態）
- `docs/20260522-night-admin-usability-report.md`（5/22 night admin 5 fixes 收尾）
- `docs/20260522-ga4-click-tracking-manual-validation.md`（5/22 GA4 click 80% 驗收紀錄）
- `docs/click-tracking-governance.md`（GA4 click 治理 spec）
- `docs/ga4-link-tracking-spec.md`（GA4 / Link tracking 規格）
- `docs/ga4-parameter-naming-registry.md`（snake_case naming registry）
- `docs/ad-affiliate-schema-proposal.md`（ad / affiliate 統一 schema）
- `docs/blogger-listener-strategy.md`（Blogger 端 listener strategy）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 規格）
- `docs/hashtag-slug-decision.md`（hashtag slug 派生策略）
- `docs/phase-1-completion-report.md`（final completion report）
- `docs/phase-1-completion-checklist.md`（逐項對照）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選 roadmap）
- `docs/20260522-pm-phase-2-batch-plan.md`（Phase 2 拆批）
- `docs/custom-domain-root-files-strategy.md`（custom domain 策略）
- `docs/fb-sidecar-schema.md` / `docs/fb-sidecar-write-preflight-decision.md` / `docs/admin-2-write-pre-analysis.md`（Admin write 系列前置）
- `docs/system-direction.md`（BLOG 系統整體方向）

---

（本文件結束）
