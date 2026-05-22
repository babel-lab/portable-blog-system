# Phase 20260522-day-1-readonly-a Report

本文件為 **Phase 20260522-day-1-readonly-a** 之 read-only audit 落地版；屬純 docs 性質；本批不修改任何 source / loader / Admin UI / build / dist / deploy / validate。對應之後續 phase `20260522-day-1-docs-cleanup-a` 同批落地，將本 audit 結果與 README §7 / EOD §19 之 baseline drift cleanup 一起 commit。

對應上層：
- `docs/README.md` §7（5/22 day-1-docs-cleanup-a 後快照；本批同期更新）
- `docs/20260521-end-of-day-report.md` §19（custom-domain-root-files-safety-a 補記；本批同期更新）
- `CLAUDE.md` §28 / §29 / §30（第一版 MVP 必做 / 不做 / 最終樣貌）
- `docs/phase-1-completion-report.md`（Phase 1 final completion report；本 audit 之引用基準）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選 roadmap；本 audit §5 之去向）

---

## §1 Repo 狀態

| 項目 | 值 |
|---|---|
| **source HEAD**（audit 起點） | `6593e4c docs(project): add custom domain root files safety strategy` |
| **source working tree** | clean |
| **source branch** | `main` |
| **source tracking** | `origin/main`（up-to-date；無 ahead / behind） |
| **deploy repo** | `D:/github/blog-new/portable-blog-deploy/`（本機已存在） |
| **deploy HEAD** | `f32f7d3 deploy: 09b9a67 snapshot (GA4 enabled)` |
| **deploy working tree** | clean |
| **deploy branch** | `gh-pages` |
| **deploy tracking** | `origin/gh-pages`（up-to-date） |

✅ 兩個 repo 皆 clean；皆已 sync remote。安全可進行 read-only audit。

---

## §2 Phase 1 完成度表

| 模組 | 狀態 | 證據 | 風險 | 建議 |
|---|---|---|---|---|
| **1. Blogger 貼文產出** | ✅ 完成 | `src/scripts/build-blogger.js` + 3 mode templates（full / summary / redirect-card）+ copy-helper [13 區塊] + publish-checklist；首篇 ready post `20260515-we-media-myself2` 通過 build × 5；relatedLinks / otherLinks / AdSense partial / hashtag / affiliate 全 conditional render | 🟢 低 | 不動 |
| **2. GitHub Pages 文章產出** | ✅ 完成 | `src/scripts/build-github.js` + vite mpa；`dist/` 含 index / posts/{slug}/ / categories / tags / 404 / design-system / sitemap.xml / robots.txt；basePath dev/build 分流（pm-mid-4-b `7c9f7ea`）；cross-source mirror（Phase 9-i-f-b）；線上 smoke test 5 URL 全 200 | 🟢 低 | 不動 |
| **3. GA4 production gating** | ✅ 完成 + ✅ live | `content/settings/ga4.config.json` enabled=true / measurementId=`G-C77SMPF8VD`；4-AND gating（ga4 存在 && enabled && measurementId 非空 && isProdBuild）；user 於 pm-46 手動 Realtime 驗收通過；deploy `f32f7d3` 已上線 | 🟢 低 | 不動 |
| **3a. Cross-link UTM（GitHub→Blogger）** | ✅ 完成 | `src/scripts/ga4-url-builder.js` 之 `isBloggerCrossLink` / `mergeRel` / `applyCrossSiteUtm`；`utm_source=github_pages` / `utm_medium=referral` / `utm_campaign=portable_blog_system` / `utm_content=related_links\|other_links`；策略 A（已含 UTM 保留 author intent） | 🟢 低 | 不動 |
| **3b. Cross-link UTM（Blogger→GitHub 反向）** | 🟡 部分（CLAUDE.md §16.4 列為 future） | docs 已記載建議 spec；未實作於 build pipeline | 🟡 中 | docs-only 提案，今天不實作（屬 §4 候選） |
| **3c. FB / 點擊治理集中文件** | 🟡 部分 | `content/settings/promotion.config.json` campaignPattern / contentPattern 已落；`docs/ga4-parameter-naming-registry.md`（pm-48 + pm-52）對齊 snake_case；但**集中治理 doc**（涵蓋 8 個 click source：FB→Blogger / FB→GitHub / Blogger→GitHub / GitHub→Blogger / relatedLinks / otherLinks / hashtag / affiliate CTA top+bottom）**尚未存在** | 🟡 中 | 寫一份 `click-tracking-governance.md`（docs-only；屬 §4 候選） |
| **4. AdSense / 聯盟區塊結構彈性** | 🟡 部分 | `content/settings/ads.config.json`（Google AdSense 為唯一假設；`enabled=false` / slots 全空）；`content/settings/affiliate-networks.json`（通路王 / 聯盟網；含 `rel="sponsored nofollow noopener noreferrer"`）；`src/views/ads/adsense-*.ejs` 6 partials；affiliate-box render 已實作；但**跨 adProvider / placement / campaign / linkUrl / displayText / trackingId / GA event name 之統一 schema doc** 尚未存在 | 🟡 中 | 寫 ad-affiliate-schema 提案 doc（docs-only；屬 §4 候選） |
| **5. Admin 總覽（read-only）** | ✅ 完成 | `src/views/admin/index.ejs` — 12 stat-cards / 7 列表欄 / 10 detail sections；fbPostUrl / fbPostedAt / fbPostId / fbCampaign 四欄位**皆於 detail panel 顯示**（line 397-409）；blogger.publishedAt 等 publish 狀態欄位亦顯示；banner / robots noindex / dev-mode-only；dry-run editor exists but **no write path** | 🟢 低 | 不動；現況 doc 可於 Phase 2 補強 |
| **6. Design Token** | ✅ 完成（含 2 個 documented exemption） | `src/styles/abstracts/{tokens,themes,spacing,typography,breakpoints,mixins,z-index}.scss` 完整；DS-3-c 已 resolved（10 fixes + 2 exemptions：`.lab-hero` `#eff6ff` + `#fff`）；DS-3-b platform theme 採保守 Option A 已落地 | 🟢 低 | Phase 1 驗收項；不再大改；Phase 2 視需要再清 |
| **7. SEO 基礎** | ✅ 完成 | `dist/sitemap.xml` 14 entries（含 noindex 過濾）；`dist/robots.txt` 含 Disallow + Sitemap；canonical / og / JSON-LD 兩端對齊；JSON-LD：BlogPosting + WebSite + isPartOf + mentions + Book mainEntity（Phase 9-g-g + 9-f-g landed）；`docs/seo-indexing-rules.md`（SEO-2-z 7 batches checkpoint） | 🟢 低 | Phase 1 已過關；Google Rich Results Test 屬作者持續 SOP |
| **8. 文件狀態** | 🟡 部分 drift | README.md §7 baseline 標 `fc02a56` / pm-64；HEAD 為 `6593e4c`（custom-domain-root-files-safety-a；新增 1 docs）；EOD report §17 已含 pm-64；但 §18 「明日工作起點」snapshot 之 HEAD 已 stale；phase-1-completion-report.md / phase-2-candidate-roadmap.md 已對齊既有 ✅ 標示 | 🟡 中 | README §7 + EOD §19 drift cleanup（5/22 day-1-docs-cleanup-a 本批處理） |

### 2.1 測試缺口（read-only 觀察）

- 無正式 unit / integration tests for `ga4-url-builder.js` / `normalize-post-output.js` / `resolve-placeholders.js` 等純函式 helpers
- 依賴 15 個 validation-fixtures（間接測試）+ `validate:content` baseline（`0 / 39 / 34`）+ manual smoke test
- 屬刻意低工程化（per `CLAUDE.md` §4 第一版限制）；**不建議**今天補測試框架

### 2.2 結論

✅ **Phase 1 已可視為「基礎可運行」**：

- 系統能力 17 條 MVP 必做全 ✅（per `CLAUDE.md` §28 + `docs/phase-1-completion-report.md` §4.1）
- 首篇 ready Blogger post `20260515-we-media-myself2` 通過 end-to-end build × 5
- 線上 GitHub Pages smoke test + GA4 production Realtime 雙重驗收通過
- 剩餘 drift 屬 **docs-side only**；無 source-level 阻擋驗收項

---

## §3 Must fix today（最多 3 項）

| # | 項目 | 性質 | LOC 估 | 是否影響 Phase 1 驗收 |
|---|---|---|---|---|
| 1 | **README.md §7 baseline drift cleanup**：HEAD ref `fc02a56` → `6593e4c`；commits 統計 37→39；補記 custom-domain-root-files-safety-a 已落地 | docs-only | ~10 行 | 🟡 中（影響「Phase 1 已完成」聲明之 baseline 一致性）|
| 2 | **docs/20260521-end-of-day-report.md §19 補記** custom-domain-root-files-safety-a phase（commit `6593e4c`） | docs-only | ~60 行（new section） | 🟢 低（純歷史紀錄收尾） |
| 3 | **20260522-day-1-readonly-a audit report 落地**：本文件 | docs-only | ~200 行 new file | 🟢 低（屬本批工作 deliverable） |

✅ **無任何 source-level「Must fix」項目**；Phase 1 系統能力面**無發現阻擋驗收之 drift**。

📝 本三項皆由 `20260522-day-1-docs-cleanup-a` 同批落地。

---

## §4 Should document today（最多 5 項；待 user 明示啟動）

| # | 項目 | 為何今天做 | 文件預估位置 |
|---|---|---|---|
| 1 | **click-tracking governance doc**（8 個 click source 集中盤點：FB→Blogger / FB→GitHub / Blogger→GitHub / GitHub→Blogger / relatedLinks / otherLinks / hashtag / affiliate CTA top+bottom）；每 source 標 event name + GA4 parameter convention + data-attr binding（建議）+ 是否含 UTM injection | 8 個 click source 散落於多個 doc / partial；缺中央視野 | `docs/click-tracking-governance.md`（new） |
| 2 | **ad-affiliate schema proposal doc**：定義 adProvider / placement / campaign / linkUrl / displayText / trackingId / GA event name 之共用 metadata 結構；含 AdSense / 通路王 / 聯盟網 / 未來其他 ad provider 之 mapping 範例 | 當前 ads.config.json / affiliate-networks.json / post-level affiliate.* / ads partial 各自獨立；缺統一抽象 | `docs/ad-affiliate-schema-proposal.md`（new；屬 proposal，不落地實作） |
| 3 | **FB sidecar metadata admin display 規範**：fbPostUrl / fbPostedAt / fbPostId / fbCampaign 4 欄位之 admin display rule + dry-run editor governance；散落於 4 個既有 docs 之 consolidated reference | 4 個 doc 之引用需多跳；缺單一入口 | `docs/admin-fb-sidecar-display-reference.md`（new；屬 cross-link 入口）或 `admin-1-completion-report.md` §14 append |
| 4 | **Blogger → GitHub Pages 反向 UTM 提案 doc**：CLAUDE.md §16.4 列為 future phase；補一份建議 spec（`utm_source=blogger` / `utm_medium=referral` / `utm_campaign=portable_blog_system` / `utm_content=related_links\|other_links`），含 Blogger build pipeline 接入評估 | 既有 GitHub→Blogger 方向已實作；反向尚未；屬對稱性補完之分析 doc | `docs/blogger-to-github-cross-link-utm-proposal.md`（new；不實作） |
| 5 | **Phase 1「基礎可運行」驗收 baseline snapshot**：本批 §2 8 項 audit + GA4 live + we-media-myself2 end-to-end + 線上 smoke test 之 consolidated 結論 doc | 既有 `phase-1-completion-report.md` 已存在；但今日新增 GA4 production live + Admin Platform Routing extension 等項目需 explicit 收錄 | `docs/20260522-phase-1-baseline-confirmation.md`（new；屬本日 audit 之 follow-up deliverable） |

⚠️ 以上 5 項皆 docs-only；user 須挑選優先順序；assistant 不擅自啟動。

---

## §5 Defer to Phase 2（最多 5 項）

| # | 項目 | 為何 defer |
|---|---|---|
| 1 | **Custom domain migration**（per `docs/custom-domain-root-files-strategy.md` §4） | 依賴 user 取得新 domain + DNS provider access + AdSense 申請；屬 Phase 2+ 之 prep series |
| 2 | **Admin write surface 啟動**（FB-P5-c / Admin-2-b-2 SEO write） | 依賴 user 勾完 8 項 preflight checklist + 6 項前置確認；屬高敏感操作 |
| 3 | **SEO 大型擴充**：sitemap multi-platform split / hreflang / News sitemap / Image sitemap | `docs/seo-sitemap-split-pre-analysis.md` 已結論「當前規模未到拆分必要；不建議實作」 |
| 4 | **GA4 click event rollout to EJS templates**（per `docs/phase-2-candidate-roadmap.md` §3.5；8 個 event type 之 `data-ga4-event` / `data-ga4-param-*` attr 落地） | 依賴 §4 之 #1 click-tracking governance doc 先對齊；屬 Phase 2 多 batch |
| 5 | **AdSense 真實啟用**（含 ads.txt placement / AdSense script + slot HTML 整合） | 依賴 custom domain + HTTPS Enforce + AdSense 申請通過；per `docs/custom-domain-root-files-strategy.md` §4.5 |

---

## §6 建議下一批動作（2-3 個候選 phase；本批 `docs-cleanup-a` 落地後）

| 候選 | phase 名 | 修改範圍 | 風險 | docs-only? | build / validate? |
|---|---|---|---|---|---|
| **A** | **20260522-day-1-click-tracking-governance-a** | 新增 `docs/click-tracking-governance.md`（8 個 click source 集中盤點 + event name + parameter convention + data-attr binding；屬 governance proposal） | 🟢 低 | ✅ docs-only | ❌ 不需 build / validate |
| **B** | **20260522-day-1-ad-affiliate-schema-proposal-a** | 新增 `docs/ad-affiliate-schema-proposal.md`（統一 schema 提案；不動既有 ads.config.json / affiliate-networks.json / post-level affiliate.* / partial template） | 🟢 低 | ✅ docs-only | ❌ 不需 build / validate |
| **C** | **20260522-day-1-phase-1-baseline-confirmation-a** | 新增 `docs/20260522-phase-1-baseline-confirmation.md`（本批 §2 audit 結論 + 8 項 module 證據 + GA4 live + we-media-myself2 end-to-end + 線上 smoke test consolidated 結論） | 🟢 低 | ✅ docs-only | ❌ 不需 build / validate |

⚠️ 任一批啟動前需 user 明示；assistant 不自行動工。

---

## §7 邊界聲明

- ✅ 本文件**僅為 read-only audit 落地版**；不啟動任何 source / build / validate / deploy / push
- ✅ 本文件**不**啟動 §4 任何 should document 項目
- ✅ 本文件**不**啟動 §5 任何 defer 項目
- ✅ 本文件**不**啟動 §6 任何下一批候選
- ✅ 不改 production GA4 id / build output / deploy branch
- ✅ 不新增大型功能 / 不改 Blogger / GitHub template 主要結構 / 不動 Admin write
- ✅ 不啟動 custom domain migration / 不啟動 AdSense
- ✅ 本批 `20260522-day-1-docs-cleanup-a` 僅做 README §7 + EOD §19 drift cleanup + 本 audit report 落地；其後停下等待

### 7.1 結論摘要（per user 明示要求之三條 wording）

1. ✅ **Phase 1 已可視為「基礎可運行」**（per §2.2；17 條 MVP 必做全 ✅；首篇 ready post end-to-end 通過；線上 + GA4 雙重驗收通過）
2. ✅ **目前無 source-level must fix**（per §3；3 項 must fix 皆 docs-only）
3. ✅ **剩餘工作主要為 docs-side governance / Phase 2 candidate planning**（per §4 + §5 + §6；皆 docs-only proposals 或 Phase 2 defer）

---

（本文件結束）
