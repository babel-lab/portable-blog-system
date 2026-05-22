# 20260522 Phase 1 Baseline Confirmation

本文件為 BLOG / GitHub Pages 靜態發布系統之 **Phase 1 baseline confirmation snapshot**；屬 docs-only；正式宣告 Phase 1「基礎可運行」並收斂今日（2026-05-22）3 個 docs commits。

對應上層：
- `docs/20260522-day-1-readonly-a-report.md`（5/22 read-only audit；commit `775cec2`）
- `docs/click-tracking-governance.md`（5/22 GA4 click 治理；commit `aabc082`）
- `docs/ad-affiliate-schema-proposal.md`（5/22 ad-affiliate schema proposal；commit `318f4b0`）
- `docs/phase-1-completion-report.md`（既有 Phase 9-z-d final completion report）
- `docs/phase-1-completion-checklist.md`（既有 Phase 9-z-b 逐項對照清單）
- `CLAUDE.md` §28 / §29 / §30（第一版 MVP 必做 / 不做 / 最終樣貌）

---

## 1. Confirmation Summary

### 1.1 正式宣告

| 項目 | 狀態 |
|---|---|
| **Phase 1 基礎可運行** | ✅ **已可視為「基礎可運行」** |
| **Source-level must fix** | ✅ **目前無**（per `docs/20260522-day-1-readonly-a-report.md` §3）|
| **剩餘工作性質** | 屬 **Phase 2 governance / implementation candidates** |
| **本文件性質** | **Phase 1 baseline snapshot**；**不**代表 custom domain / Admin write / AdSense 啟用已完成 |

### 1.2 不代表事項

- ❌ **不**代表 custom domain 已啟用
- ❌ **不**代表 Admin write surface 已啟動
- ❌ **不**代表 AdSense 已正式申請 / 已上線
- ❌ **不**代表 GA4 click listener / `data-ga4-*` attr 已實作
- ❌ **不**代表 Blogger → GitHub 反向 UTM 已實作
- ❌ **不**代表 affiliate CTA click event 已落地

上述項目皆屬 Phase 2 範疇（per §5 + §6）。

---

## 2. Repo Baseline

### 2.1 本批 phase 啟動前

| 項目 | 值 |
|---|---|
| **source HEAD before this phase** | `318f4b0 docs(ads): add ad affiliate schema proposal` |
| **source working tree before this phase** | clean |
| **source ahead origin/main** | 3 commits（`775cec2` + `aabc082` + `318f4b0`）|
| **deploy HEAD** | `f32f7d3 deploy: 09b9a67 snapshot (GA4 enabled)` |
| **deploy repo** | 未動（自 5/21 pm-45 起凍結）|
| **push** | 尚未執行（本批不 push）|
| **deploy** | 尚未執行（本批不 deploy）|

### 2.2 本批 phase 完成後

| 項目 | 值 |
|---|---|
| **source HEAD after this phase** | 待回報補上（per 完成後 `git log -1 --oneline`）|
| **source working tree after this phase** | clean（per 規格）|
| **source ahead origin/main after** | 4 commits |
| **deploy HEAD after** | `f32f7d3`（未動）|
| **push after** | 仍未執行 |
| **deploy after** | 仍未執行 |

---

## 3. Phase 1 Completed Capabilities

8 個模組之 baseline confirmation table：

| # | module | status | evidence | risk | Phase 1 conclusion |
|---|---|---|---|---|---|
| 1 | **Blogger 貼文產出** | ✅ 完成 | `src/scripts/build-blogger.js` + 3 mode templates（full / summary / redirect-card）+ copy-helper [13 區塊] + publish-checklist；首篇 ready post `20260515-we-media-myself2` 通過 build × 5；relatedLinks / otherLinks / AdSense partial / hashtag / affiliate-box 全 conditional render | 🟢 低 | ✅ Phase 1 通過 |
| 2 | **GitHub Pages 文章產出** | ✅ 完成 | `src/scripts/build-github.js` + vite mpa；`dist/` 含 index / posts/{slug}/ / categories / tags / 404 / design-system / sitemap.xml / robots.txt；basePath dev/build 分流（pm-mid-4-b `7c9f7ea`）；cross-source mirror（Phase 9-i-f-b）；線上 smoke test 5 URL 全 200 | 🟢 低 | ✅ Phase 1 通過 |
| 3 | **GA4 production gating** | ✅ 完成 + ✅ live | `content/settings/ga4.config.json` enabled=true / measurementId=`G-C77SMPF8VD`；4-AND gating（ga4 存在 && enabled && measurementId 非空 && isProdBuild）；user 於 5/21 pm-46 手動 Realtime 驗收通過；deploy `f32f7d3` 已上線 | 🟢 低 | ✅ Phase 1 通過 |
| 4 | **GitHub → Blogger cross-link UTM** | ✅ 完成 | `src/scripts/ga4-url-builder.js` 之 `isBloggerCrossLink` / `mergeRel` / `applyCrossSiteUtm`；utm_source=`github_pages` / utm_medium=`referral` / utm_campaign=`portable_blog_system` / utm_content=`related_links` \| `other_links`；策略 A（已含 UTM 保留 author intent） | 🟢 低 | ✅ Phase 1 通過（反向 Blogger → GitHub 未實作；屬 Phase 2，per §5）|
| 5 | **Admin read-only overview** | ✅ 完成 | `src/views/admin/index.ejs` — 12 stat-cards / 7 列表欄 / 10 detail sections；fbPostUrl / fbPostedAt / fbPostId / fbCampaign 四欄位皆於 detail panel 顯示；banner / robots noindex / dev-mode-only；dry-run editor exists but **no write path** | 🟢 低 | ✅ Phase 1 通過（write 啟動屬 Phase 2，per §5）|
| 6 | **Design Token baseline** | ✅ 完成（含 2 個 documented exemption）| `src/styles/abstracts/{tokens,themes,spacing,typography,breakpoints,mixins,z-index}.scss` 完整；DS-3-c resolved（10 fixes + 2 exemptions：`.lab-hero` `#eff6ff` + `#fff`）；DS-3-b platform theme 採保守 Option A 已落地 | 🟢 低 | ✅ Phase 1 通過 |
| 7 | **SEO baseline** | ✅ 完成 | `dist/sitemap.xml` 14 entries（含 noindex 過濾）；`dist/robots.txt` 含 Disallow + Sitemap；canonical / og / JSON-LD 兩端對齊；JSON-LD：BlogPosting + WebSite + isPartOf + mentions + Book mainEntity（Phase 9-g-g + 9-f-g landed）；`docs/seo-indexing-rules.md`（SEO-2-z 7 batches checkpoint） | 🟢 低 | ✅ Phase 1 通過 |
| 8 | **Documentation baseline** | ✅ 完成（含今日 3 個 governance docs）| `docs/README.md` 為入口；`phase-1-completion-report.md` + `phase-1-completion-checklist.md` + `phase-2-candidate-roadmap.md` 為核心；今日新增 3 個 governance docs（per §4）；README §7 baseline drift cleanup 已落地（commit `775cec2`） | 🟢 低 | ✅ Phase 1 通過 |

### 3.1 模組 conclusion 摘要

- **8 / 8 模組通過 Phase 1**
- **0 個 source-level must fix**
- **未完成但屬 Phase 2 範疇**：模組 4 反向 UTM / 模組 5 Admin write（兩項皆有對應未來 phase 規劃）

---

## 4. GA4 / Tracking Governance Added Today

今日（2026-05-22）3 個 docs commits 已落地：

### 4.1 Read-only audit report

| 維度 | 值 |
|---|---|
| 文件 | `docs/20260522-day-1-readonly-a-report.md` |
| commit | `775cec2 docs(project): sync phase 1 baseline audit` |
| 用途 | Phase 1 完成度盤點與 docs drift cleanup（含 README §7 baseline cleanup + EOD §19 custom-domain phase 補記） |
| 主要內容 | §1 Repo 狀態 / §2 Phase 1 完成度表（8 模組）/ §3 Must fix today / §4 Should document today / §5 Defer to Phase 2 / §6 建議下一批動作 / §7 邊界聲明 |

### 4.2 Click tracking governance

| 維度 | 值 |
|---|---|
| 文件 | `docs/click-tracking-governance.md` |
| commit | `aabc082 docs(ga4): add click tracking governance` |
| 用途 | 定義 **UTM layer** / **GA4 event layer** / **content metadata layer** 三層追蹤治理 |
| 涵蓋 click sources（9 類）| FB → Blogger / FB → GitHub / Blogger → GitHub / GitHub → Blogger / relatedLinks / otherLinks / hashtag / affiliate CTA top / affiliate CTA bottom |
| 涵蓋 GA4 events | `click_cross_site_link` / `click_related_link` / `click_other_link` / `click_hashtag` / `click_affiliate_cta` / `click_fb_promotion_link` |
| 涵蓋 GA4 params | 13 個（platform / source_platform / target_platform / post_slug / post_title / link_type / link_label / link_url / placement / provider / campaign / content_group / outbound）|
| data attribute convention | 14 個 `data-ga4-*` attr（proposal；不實作）|

### 4.3 Ad / affiliate schema proposal

| 維度 | 值 |
|---|---|
| 文件 | `docs/ad-affiliate-schema-proposal.md` |
| commit | `318f4b0 docs(ads): add ad affiliate schema proposal` |
| 用途 | 定義 **AdSense / 通路王 / 聯盟網 / custom provider** 之統一 metadata schema proposal |
| 重點（六層 / 區） | **provider layer** / **placement layer** / **campaign-content layer** / **unified schema**（15 欄位 + field dictionary）/ **GA4 / UTM relationship** / **Blogger / GitHub rendering implication** |
| Provider 列舉 | `google_adsense` / `tongluwang` / `affiliate_network` / `custom_direct` / `future_provider` |
| Placement 列舉 | `article_top` / `article_bottom` / `article_inline` / `sidebar` / `related_area` / `footer` |

### 4.4 今日 3 commits 收斂

| # | commit | 性質 | LOC |
|---|---|---|---|
| 1 | `775cec2 docs(project): sync phase 1 baseline audit` | docs（README cleanup + EOD §19 + audit report）| +203 / -4 |
| 2 | `aabc082 docs(ga4): add click tracking governance` | docs（new file）| +465 |
| 3 | `318f4b0 docs(ads): add ad affiliate schema proposal` | docs（new file）| +436 |

✅ 今日 3 個 commits **皆 docs-only**；**無**任何 source / content / build / validate / deploy / push 變動。

---

## 5. Not Completed / Explicitly Deferred

以下項目明確**尚未完成**，不得誤認為已完成：

| # | 項目 | 狀態 | 對應 phase / docs |
|---|---|---|---|
| 1 | **Custom domain 尚未啟用** | 🔴 deferred | `docs/custom-domain-root-files-strategy.md`（5/21 夜 commit `6593e4c`；docs proposal only）|
| 2 | **DNS 尚未設定** | 🔴 deferred | 同上 §4.1 user 端動作；本機完全未動 |
| 3 | **Custom domain DNS / GitHub Pages settings migration 尚未啟動** | 🔴 deferred | 同上 §4.2 / §4.3 |
| 4 | **AdSense 尚未正式申請 / 啟用於 GitHub 新站** | 🔴 deferred | 依賴 #1 #2 #3 完成；per `docs/custom-domain-root-files-strategy.md` §4.5 + `docs/ad-affiliate-schema-proposal.md` §6.1 |
| 5 | **Admin write surface 尚未啟動** | 🔴 deferred | `docs/fb-sidecar-write-preflight-decision.md` §7（8 項 user 勾選）+ `docs/admin-2-write-pre-analysis.md` §7.2 |
| 6 | **GA4 click listener 尚未實作** | 🔴 deferred | `docs/click-tracking-governance.md` §10 順序 1（Phase 2-a-listener）|
| 7 | **EJS `data-ga4-*` attributes 尚未實作** | 🔴 deferred | `docs/click-tracking-governance.md` §6 + §10 順序 2-4 |
| 8 | **Blogger → GitHub 反向 UTM 尚未實作** | 🔴 deferred | `CLAUDE.md` §16.4 列為 future；`docs/click-tracking-governance.md` §10 順序 5 |
| 9 | **Affiliate CTA click event 尚未落地** | 🔴 deferred | `docs/click-tracking-governance.md` §10 順序 2（Phase 2-a-affiliate）|
| 10 | **目前 docs 為 governance / proposal，不是 implementation** | ⚠️ 性質聲明 | 今日 3 docs（per §4）皆屬 proposal；落地需獨立 phase |

### 5.1 性質聲明

- 上述 deferred items **不阻擋** Phase 1 baseline confirmation
- Phase 1「基礎可運行」之認定**不**依賴上述項目完成
- 上述項目**屬 Phase 2 範疇**（per §6）

---

## 6. Phase 2 Candidate Order

建議 Phase 2 順序（**proposal；非承諾**）：

| 順序 | Phase 候選 | 性質 |
|---|---|---|
| 1 | **push-readiness-a** | Read-only preflight；檢查今日 3 commits message / 敏感資料 / build sanity / deploy repo 狀態 |
| 2 | **push source docs commits to origin/main** | 將今日 3 commits（`775cec2` / `aabc082` / `318f4b0`）+ 本批 commit 推送至 `origin/main`；含 set-upstream（若需要）|
| 3 | **Phase 2 implementation planning** | 整體 Phase 2 路線 / 拆批 / 阻擋條件評估 doc（補強 `phase-2-candidate-roadmap.md`） |
| 4 | **GA4 data attribute convention implementation** | EJS partials 加 `data-ga4-*` attr（per `click-tracking-governance.md` §6 + §10 順序 1）|
| 5 | **GA4 click listener** | `src/js/modules/ga4-click-listener.js`（per `click-tracking-governance.md` §10 順序 1）|
| 6 | **Affiliate CTA top / bottom tracking** | 對接 `click_affiliate_cta` event 至 affiliate-box（per `click-tracking-governance.md` §10 順序 2 + `ad-affiliate-schema-proposal.md` §10 順序 2）|
| 7 | **relatedLinks / otherLinks tracking** | 對接 `click_related_link` / `click_other_link`（per `click-tracking-governance.md` §10 順序 3）|
| 8 | **hashtag tracking** | 對接 `click_hashtag`（per `click-tracking-governance.md` §10 順序 4）|
| 9 | **Blogger → GitHub reverse UTM** | Blogger build pipeline 對 GitHub 連結 UTM injection（per `CLAUDE.md` §16.4 + `click-tracking-governance.md` §10 順序 5）|
| 10 | **Custom domain preparation** | per `docs/custom-domain-root-files-strategy.md` §4.1-§4.6 |
| 11 | **Admin write preflight** | per `docs/fb-sidecar-write-preflight-decision.md` §7 8 項 checklist |
| 12 | **AdSense / affiliate block real production strategy** | per `docs/ad-affiliate-schema-proposal.md` §10 + 依賴 #10 完成 |

### 6.1 性質聲明

- ✅ **今天不實作上述項目**
- ✅ **本批只做 Phase 1 baseline confirmation**
- ✅ 上述順序**非承諾**；每一順序啟動前需 user 明示
- ✅ assistant **不**自行啟動上述任一項

---

## 7. Acceptance Criteria（本文件完成條件）

| # | 條件 | 滿足 |
|---|---|---|
| 1 | 明確宣告 Phase 1 基礎可運行 | ✅ §1.1 第一列 |
| 2 | 明確宣告無 source-level must fix | ✅ §1.1 第二列 + §3.1 結論 |
| 3 | 明確列出今日 3 個 docs commits | ✅ §4.1 / §4.2 / §4.3 / §4.4 收斂表 |
| 4 | 明確列出 Phase 1 已完成能力 | ✅ §3 8 模組 confirmation table |
| 5 | 明確列出 deferred items | ✅ §5 10 項 deferred table |
| 6 | 明確列出 Phase 2 candidate order | ✅ §6 12 順序 |
| 7 | 明確標示本文件為 docs-only，不修改程式 | ✅ 開頭聲明 + §6.1 |

---

## 8. Boundary（本批 phase 鎖定項）

- ❌ 不修改 `src/`
- ❌ 不修改 `content/`
- ❌ 不修改 `dist/`
- ❌ 不修改 deploy repo
- ❌ 不跑 `npm run build`
- ❌ 不跑 `npm run validate:content`
- ❌ 不 push
- ❌ 不 deploy
- ❌ 不實作 GA4 listener
- ❌ 不實作 `data-ga4-*` attributes
- ❌ 不改 `ads.config.json` / `affiliate-networks.json`
- ❌ 不改任何 EJS template

---

## 9. Cross-links

### 9.1 今日 3 個 docs commits

- `docs/20260522-day-1-readonly-a-report.md`（commit `775cec2`）
- `docs/click-tracking-governance.md`（commit `aabc082`）
- `docs/ad-affiliate-schema-proposal.md`（commit `318f4b0`）

### 9.2 既有 Phase 1 完成基準

- `docs/phase-1-completion-report.md`（Phase 9-z-d final completion report）
- `docs/phase-1-completion-checklist.md`(Phase 9-z-b 逐項對照清單)
- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選 roadmap）

### 9.3 規範來源

- `CLAUDE.md` §28（第一版 MVP 必做）/ §29（第一版不做）/ §30（最終樣貌）
- `docs/system-direction.md`（BLOG 系統整體方向）

### 9.4 5/21 EOD + 5/22 day-1 baseline

- `docs/20260521-end-of-day-report.md` §19（custom-domain-root-files-safety-a 補記）
- `docs/README.md` §7（5/22 day-1 docs-cleanup-a 後快照）

---

（本文件結束）
