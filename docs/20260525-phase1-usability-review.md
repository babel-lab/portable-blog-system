# 2026-05-25 Phase 1 Usability Review

> Phase: `20260525-am-3-phase1-usability-review-doc-a`
> 模式：docs-only
> 來源：本文件為 Phase `20260525-am-2-phase1-usability-review-a` 之 read-only inspection 結果整理成正式 markdown 文件。

---

## §1 文件目的與範圍

### 1.1 目的

本文件為 BLOG / portable-blog-system 之 **2026-05-25 上午 Phase 1 基礎運行與「好不好用」盤點**。屬 docs-only / planning 性質；**不**啟動任何 implementation；**不取代** `docs/phase-1-completion-report.md` 之既有 Phase 1 final 角色。

本文件之目的：

1. 在 NB → PC 接手後（per `docs/20260525-pc-handoff-baseline.md`），對 Phase 1 既有能力做一次當前 snapshot
2. 對 7 個能力維度（Blogger / GitHub / FB promotion / GA4 / Ads & affiliate / Admin / Design token）做「已支援 vs 待補」對齊
3. 對 13 個主要使用流程做「好不好用」表格化評估
4. 識別「可運行但不好用」之痛點、文件補強候選、Phase 2 待處理項
5. 提出下一批可即時啟動之 3 個小任務（皆 docs-only / read-only 優先）

### 1.2 範圍

| 項目 | 涵蓋 |
|------|------|
| **時點** | 2026-05-25 上午（HEAD `65145a8 docs(handoff): add 2026-05-25 PC handoff baseline report`）|
| **本機 PC** | source repo `D:\github\blog-new\portable-blog-system\` |
| **檢視對象** | source / content / settings / templates / dist / docs 之 read-only inspection |
| **不涵蓋** | Blogger 後台 / GA4 後台 / FB 後台 / GitHub Pages production live 之外部系統 read |
| **本批是否 build / install / deploy** | ❌ 全否 |
| **本批是否 commit / push** | ❌ 全否（待 user 確認） |

### 1.3 對應上層文件

- `CLAUDE.md` §28 / §29 / §30（第一版 MVP 必做 / 不做 / 最終樣貌）
- `docs/phase-1-completion-report.md`（Phase 9-z-d 正式 final report）
- `docs/phase-1-completion-checklist.md`（Phase 9-z-b 逐項對照清單）
- `docs/phase-1-user-operation-guide.md`（非工程師操作手冊草稿）
- `docs/phase-status-20260523.md`（5/23 Phase 1 完成度盤點）
- `docs/20260524-eod-report.md`（昨日全日收尾 + §15 docs trail）
- `docs/20260525-pc-handoff-baseline.md`（本日上午 NB→PC 接手 baseline）

---

## §2 結構 inspection 摘要

### 2.1 package.json scripts

`package.json` 定義 **17 個 npm scripts**，依用途歸為 5 類：

| 類別 | scripts |
|------|---------|
| **dev / build / preview** | `dev` / `predev` / `build` / `prebuild` / `postbuild` / `preview` |
| **build:*** | `build:data` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `build:blogger-theme` |
| **validate / new / backfill** | `validate:content` / `new:post` / `backfill:url` |
| **report:*** | `report:build` / `report:drafts` / `report:missing-tags` / `report:urls` / `report:series` / `report:book` |
| **check:*** | `check:links` / `check:images` |

備註：

- `predev` 與 `prebuild` 皆呼叫 `build-github.js`（分別帶 `--mode=dev` / `--mode=build`）→ dev / build 啟動前自動產 data
- `postbuild` 自動串 `build:sitemap` → sitemap.xml 永遠隨 `npm run build` 重產
- 依套件：Vite + EJS + SCSS + Markdown-it + gray-matter + fast-glob + @vitejs/plugin-basic-ssl + vite-plugin-ejs（無 React / Vue / Tailwind / 後端套件；對齊 `CLAUDE.md` §4）

### 2.2 主要資料夾

| 路徑 | 摘要 |
|------|------|
| `content/settings/` | 17 個 JSON 設定檔（site / themes / categories / tags / ads / social-links / promotion / affiliate-networks / link-rules / seo / ga4 / navigation / sidebar / footer / series + 2 samples） |
| `content/github/posts/` | 2 篇 ready post（`20260504-github-pages-blog-planning.md` + `20260504-portable-blog-system-mvp.md`）+ 1 個 `.fb.md` sidecar |
| `content/blogger/posts/` | 1 篇 ready post（`20260515-we-media-myself2.md` + `.publish.json` + `.fb.md`）+ 1 篇 draft sample（`20260504-sample-book-review.md`） |
| `content/templates/` | 6 個內容模板（post / github-tech-note / blogger-book-review / blogger-magazine-review / blogger-download / blogger-summary）+ 4 個 sample / series 範本 |
| `content/validation-fixtures/` | 28 個 `_test-*` fixture（series / book / fb / relatedLinks / seo-indexing；**不**入 build 掃描，per Phase 8-e-6-b-1） |
| `content/{drafts,archive,shared}/` | 預留資料夾（`.gitkeep` 佔位；目前無內容） |
| `src/scripts/` | 31 個 build / loader / parser / validator / reporter / GA4 / link processor / cross-source mirror script |
| `src/views/` | 50+ 個 EJS（layout 9 / pages 11 / blogger 8 / design-system 9 / ads 7 / seo 4 / tracking 2 / promotion 3 / admin 1） |
| `src/styles/` | 完整 SCSS 結構（abstracts / base / layout / components 四層；BEM + `lab-` prefix） |
| `src/js/` | 主入口 `main.js` + modules（sticky-header / mobile-drawer / back-to-top / ga4-events / link-tracker / active-nav / lazy-image / search / toc / copy-code） |
| `dist/` | GitHub Pages build artifact（`.gitignore`；不入 commit；現存於本機） |
| `dist-blogger/posts/` | 3 篇 ready post dist；每篇 4 檔（post.html / copy-helper.txt / meta.json / publish-checklist.txt） |
| `dist-blogger/theme/` | 4 個 Blogger CSS（tokens / components / article / full-style） |
| `dist-blogger/index/` | Blogger 首頁 / 目錄 index HTML（home + 2 category index） |
| `dist-promotion/facebook/` | 2 個 FB promotion txt（blogger / github 各 1 篇 enabled）+ all-posts-index.txt |
| `dist-reports/` | 8 類 × 2 格式報告（build / drafts / missing-tags / urls / series / book / check-broken-links / check-image-links） |

### 2.3 Phase 1 / Blogger / GitHub / FB / GA4 / UTM / Admin 相關文件

`docs/` 下約 90+ 個 markdown 文件，依主題精選分類（非完整列表）：

| 類別 | 代表文件 |
|------|---------|
| **Phase 1 收尾** | `phase-1-completion-report.md`（正式 final report）/ `phase-1-completion-checklist.md`（13 主節 / 525 行）/ `phase-1-user-operation-guide.md`（非工程師操作手冊草稿） |
| **Blogger 流程** | `blogger-export.md` / `blogger-listener-strategy.md` / `20260524-blogger-repost-checklist.md`（canonical SOP）/ `20260524-blogger-github-publishing-runbook.md`（operator-facing entry runbook 715 行） |
| **GitHub Pages 流程** | `github-deploy.md` / `architecture.md` / `requirements.md` |
| **FB / promotion** | `promotion-export.md` / `fb-sidecar-schema.md` / `fb-sidecar-metadata-pre-analysis.md` / `fb-sidecar-write-preflight-decision.md` / `fb-sidecar-write-safety.md` / `fb-post-url-metadata-proposal.md` |
| **GA4 / UTM / click tracking** | `ga4-link-tracking-spec.md`（canonical 規則 §4.5）/ `click-tracking-governance.md` / `ga4-parameter-naming-registry.md` / `ga4-enable-preflight.md` / `ga4-click-tracking-coverage-audit-20260524.md` / `20260524-ga4-reverse-utm-observation.md`（canonical 觀察 SOP）/ `blogger-to-github-reverse-utm-plan.md` / `reverse-utm-fixture-plan.md`（含 §10 addendum） |
| **Admin** | `admin-1-completion-report.md`（dev-mode-only Plan B）/ `admin-1-readonly-preflight.md` / `admin-2b1-completion-report.md` / `admin-2-write-pre-analysis.md` / `admin-overview-audit-20260523.md`（5/23 完整 audit）/ `20260521-admin-overview-display-audit.md` / `20260522-night-admin-usability-report.md` / `admin-overview-b-series-decision-prep.md` |
| **Phase / EOD status** | `phase-status-20260523.md`（5/23 Phase 1 盤點）/ `20260520-end-of-day-report.md` ~ `20260524-eod-report.md`（含 5/24 §15 docs trail map）/ `20260525-pc-handoff-baseline.md`（5/25 NB→PC 接手） |
| **Schema** | `content-schema.md` / `publish-bundle.md` / `publish-json-schema.md` / `book-schema.md` / `series-schema.md` / `related-links-schema.md` / `migration-from-frontmatter.md` / `fb-sidecar-schema.md` |
| **設計系統 / token** | `design-system.md` / `css-design-system-policy.md` / `design-system-ds1-audit.md` / `design-system-ds2-token-naming.md` / `design-system-ds3b-theme-overrides-proposal.md` / `design-system-ds3c-hardcoded-color-pre-analysis.md` / `design-token-audit-20260523.md` |
| **Phase 完成報告** | `phase-8b-completion-report.md` ~ `phase-8h-completion-report.md` / `phase-9e-completion-report.md` / `phase-9f-c-completion-report.md` / `phase-9f-g-completion-report.md` / `phase-9g-completion-report.md` / `phase-9g-g-completion-report.md` / `phase-9h-completion-report.md` / `phase-9j-jsonld-landing-verification.md` |
| **下一階段** | `phase-2-candidate-roadmap.md` / `20260522-pm-phase-2-batch-plan.md` / `future-roadmap.md` |

---

## §3 Phase 1 已完成能力盤點（7 維度）

| 維度 | 狀態 | 已落地能力 | 不可做 / 待補 | 上層文件 |
|------|------|-----------|--------------|---------|
| **3.1 Blogger 貼文產出流程** | ✅ 可運行 | `npm run build:blogger` → 每篇 4 檔 dist（`post.html` / `copy-helper.txt` 13 區塊 / `meta.json` / `publish-checklist.txt`）；3 模式 full / summary / redirect-card；首頁 + category index；`we-media-myself2` 已通過完整 build × 5 pipeline 端對端驗證 | Blogger API auto-publish 永不做（per `CLAUDE.md` §29）；100% 手動貼文是唯一路徑 | `blogger-export.md` / `20260524-blogger-github-publishing-runbook.md` |
| **3.2 GitHub 文章產出流程** | ✅ 可運行（production live） | `npm run dev / build / preview`；完整頁面（首頁 / 列表 / 詳細 / 分類 / 標籤 / 404 / Design System）；`sitemap.xml` + `robots.txt`；cross-source mirror（Blogger 文章透過 `publishTargets.github.enabled: true` 同步輸出至 GitHub dist；per Phase 9-i-f-b）；deploy gh-pages 當前 HEAD `960f234`（5/24 am-7b 結果） | 自動 deploy CI 未做（cp dist + git rm + commit + push 為手動）；custom domain 未啟用 | `github-deploy.md` / `phase-1-completion-report.md` |
| **3.3 FB promotion metadata / UTM 管理** | ✅ 可運行 | `.fb.md` sidecar 12 read-only 欄位 schema（per `fb-sidecar-schema.md`）；`npm run build:promotion` 輸出 `dist-promotion/facebook/{site}/{slug}.txt`；UTM 集中於 `promotion.config.json`（source=facebook / medium=social / campaignPattern / contentPattern）；`fbPostUrl` / `fbPostedAt` / `fbPostId` 可手動填回 sidecar；Admin overview detail panel §7 顯示 14 row FB Post metadata read-only | FB Graph API 永不做（per `CLAUDE.md` §29）；Admin 寫入 `.fb.md` 待 FB-P5-c 啟動（blocked on user 8+6 preflight；per `fb-sidecar-write-preflight-decision.md` §7） | `promotion-export.md` / `fb-sidecar-schema.md` / `fb-sidecar-write-preflight-decision.md` |
| **3.4 GA4 click tracking** | ✅ live（GitHub 端）/ 🟡 partial / 🔴 Blogger 端不做 | measurementId `G-C77SMPF8VD` production live；4-AND gating（`ga4` 存在 && `enabled === true` && measurementId 非空 && `isProdBuild`）；click attrs 落地（affiliate top / bottom / relatedLinks / otherLinks + placement params）；5/24 G2 link_type cross-site fix 已 deploy（per am-6 / am-7b）；user manual validation passed（5/24） | Blogger 端 click 不做（設計層決議；per `blogger-listener-strategy.md` §5.1）；hashtag click 未對接（仍 `<span>` 非 `<a>`；屬 Phase 2 `hashtag-slug-decision.md`）；G4-G8 次要 gaps deferred（per `ga4-click-tracking-coverage-audit-20260524.md` §7.2）；Reverse UTM Blogger→GitHub **source live but dormant**（pm-24a/b/c source landed；無 fixture；Blogger 後台未重貼） | `ga4-link-tracking-spec.md` §4.5 / `ga4-click-tracking-coverage-audit-20260524.md` / `20260524-eod-report.md` §5 |
| **3.5 AdSense / affiliate 區塊支援** | 🟡 partial | AdSense 6 個 partial 結構就位（`adsense-post-top` / middle / bottom / sidebar / home-inline / head；`enabled=false`）；`affiliate-networks.json` 含 2 providers（通路王 / 聯盟網）+ auto-rel `sponsored nofollow noopener noreferrer`；affiliate-box top / bottom render 就位；`click_affiliate_cta` event 已 landed | AdSense 申請 blocked on custom domain（依賴 root domain + HTTPS Enforce + 審核）；affiliate **dormant**（無 ready post 設 `affiliate.enabled=true`；無真實 fire `click_affiliate_cta` event）；統一 schema proposal 在 `ad-affiliate-schema-proposal.md` 但未實作 | `ad-affiliate-schema-proposal.md` / `custom-domain-root-files-strategy.md` |
| **3.6 Admin 新增 / 修改文章能力** | 🟡 read-only / dry-run（**無寫入**） | dev-mode-only Plan B（prod build 不產出 admin；per `admin-1-completion-report.md`）；14 stat-cards / 6 filter optgroups / 3 sort options / search input / detail panel 10 sections / missing metadata warning banner / robots noindex；SEO dry-run viewer（4 欄位）+ FB sidecar dry-run editor（12 欄位）— 純 client-side preview only | 🔴 **無法新增 / 修改文章**（無 form submit / fetch / fs.writeFile）；任何 metadata 變動必須 VS Code 手動編輯 `.md` / `.fb.md`；FB-P5-c（FB 寫入）+ Admin-2-b-2（SEO 寫入）blocked on user preflight；無 Blogger / FB Graph API 接入（per `CLAUDE.md` §29） | `admin-1-completion-report.md` / `admin-overview-audit-20260523.md` §1 |
| **3.7 Design token / 主色副色 / 樣式管理** | ✅ 基本可用 | tokens / themes / spacing / typography / breakpoints / mixins / z-index 完整；Option A 保守版（`--lab-color-primary` + secondary alias + link 沿用 primary；其餘 reserved）；BEM + `lab-` prefix 一致；DS-3 hardcoded color resolved（10 fixes + 2 documented exemptions：`.lab-hero` gradient `#eff6ff` + `#fff`） | DS-3-b platform theme Option B（user 設計師決方案 + 平台品牌色 hex）blocked；DS-3-b-blogger-entry（重貼 Blogger 後台 CSS）deferred；Visual regression test（DS-5）未啟動 | `design-system.md` / `design-system-ds3b-theme-overrides-proposal.md` / `design-token-audit-20260523.md` |

---

## §4 Phase 1 好不好用表格

針對 13 個主要使用流程，依「使用流程 / 已支援 / 已有文件 / 需人工手動 / 風險 / 建議下一步」6 欄位評估：

| # | 使用流程 | 已支援 | 已有文件 | 需人工手動 | 風險 | 建議下一步 |
|---|---------|--------|---------|----------|------|----------|
| **1** | 寫新文章（GitHub Pages 端） | ✅ template + frontmatter schema + validate | ✅ `content-schema.md` / `phase-1-user-operation-guide.md` §5.1 | ✅ VS Code 編輯 `.md` / `.fb.md` | 🟢 低（schema 穩定 from Phase 8 series） | 維持現狀；user-guide §5.1 已足 |
| **2** | 寫新文章（Blogger 端） | ✅ 同上 + `.publish.json` sidecar | ✅ `publish-bundle.md` / `publish-json-schema.md` / `migration-from-frontmatter.md` | ✅ VS Code 編輯 `.md` + `.publish.json` + 可選 `.fb.md` | 🟢 低 | 維持；schema 三件 bundle 已穩定 |
| **3** | 本機預覽 GitHub 站 | ✅ `npm run dev`（自動 inject data + EJS hot reload） | ✅ user-guide §5.1 步驟 6 / `architecture.md` | ❌ 純自動 | 🟢 低 | 維持 |
| **4** | build GitHub dist | ✅ `npm run build`（含 `postbuild` 自動 `build:sitemap`） | ✅ `github-deploy.md` | ❌ 純自動 | 🟢 低 | 維持 |
| **5** | deploy GitHub Pages | ✅（手動 push gh-pages） | ✅ `github-deploy.md` / `20260524-blogger-github-publishing-runbook.md` §3-§4 | ✅ user 手動：`cp -r dist/*` + `git rm` stale bundles + commit + push gh-pages | 🟡 中（步驟多；易遺漏 sitemap lastmod / bundle hash refresh） | 評估是否加 deploy 自動 script（屬 Phase 2；不急） |
| **6** | build Blogger artefacts | ✅ `npm run build:blogger` 一鍵 → 4 檔 dist | ✅ `blogger-export.md` | ❌ 純自動 | 🟢 低 | 維持 |
| **7** | 手動貼 Blogger 後台 | ✅ copy-helper.txt 13 區塊逐區複製輔助 | ✅ `20260524-blogger-repost-checklist.md`（canonical SOP）+ runbook | ✅ 100% 手動（複製 HTML + 標題 + 搜尋說明 + slug + 標籤 + 預覽桌機 / 手機 + 發布） | 🟡 中（單篇 5-10 min；漏貼某 copy-helper 區塊不易發現） | publish-checklist.txt 內容檢查段對齊已做；維持 |
| **8** | 回填 Blogger publishedUrl | ✅ `npm run backfill:url --slug={slug}` | ✅ `publish-workflow.md` | ✅ 發布後 user 手動跑 backfill；或 VS Code 編輯 `.publish.json` | 🟢 低 | 維持 |
| **9** | build FB promotion txt | ✅ `npm run build:promotion` | ✅ `promotion-export.md` | ❌ 純自動（前提：對應 `.fb.md` sidecar 已存在且 `enabled=true`） | 🟢 低 | 維持 |
| **10** | 手動貼 FB + 回填 fbPostUrl | 🟡 partial（手動貼 OK；回填要 VS Code） | ✅ `phase-1-user-operation-guide.md` §8 / Q2 | ✅ 100% 手動（FB 後台貼 + 取得 URL + VS Code 編輯 `.fb.md` 填 `fbPostUrl` / `fbPostedAt` / `fbPostId` / `fbCampaign`） | 🟡 中（流程單純但易忘） | FB-P5-c-a / -b 落地（blocked on 8+6 preflight） |
| **11** | Admin 查看狀態 | ✅ read-only 完整（14 stat-cards / 6 filter / 3 sort / 10 detail sections / warning banner） | ✅ `admin-1-completion-report.md` / `admin-overview-audit-20260523.md` | ❌ 純查看；無寫入按鈕 | 🟢 低 | 維持（B 系列 stat-card 待 user 表態；per `admin-overview-b-series-decision-prep.md`） |
| **12** | 驗證文章 metadata | ✅ `npm run validate:content` | ✅ `seo-indexing-rules.md` §11 baseline 規則 / `phase-1-user-operation-guide.md` §6.1 | ❌ 純自動 | 🟢 低 | 維持（baseline drift 須在 commit message 明示） |
| **13** | 啟動 GA4 / 啟動 affiliate | 🟡 GA4 已 production live；affiliate dormant | ✅ `ga4-enable-preflight.md` / `ad-affiliate-schema-proposal.md` | ✅ GA4 啟用後維持自動；affiliate 需在 ready post 設 `affiliate.enabled=true` + 填 `affiliate.links[]` | 🟡 中（affiliate 第一篇啟用後需驗 `click_affiliate_cta` event 真實 fire） | 待 user 決定哪篇 book-review post 啟用 affiliate |

---

## §5 Phase 1 特別判斷

### §5.1 Phase 1 是否「基礎可運行」

✅ **是**（且已正式 final）。

依據 `docs/phase-1-completion-report.md`（Phase 9-z-d；commit `4d68f50` 後升正式 final）：

- CLAUDE.md §28 17 條 MVP 必做項目**全 ✅ 系統落地**
- CLAUDE.md §29 12 項第一版不做清單**全維持不做**
- Phase 0 ~ 9 主軸**全 ✅**
- 6/6 conditional article blocks 達成 100% Blogger ↔ GitHub parity
- Phase 9-i 系列 known blockers **3/3 全清**
- Phase 9-j JSON-LD landing verification 已封存
- 首篇 ready Blogger post `we-media-myself2` 通過完整 build × 5 pipeline 端對端驗證
- GitHub Pages production live + GA4 production live（measurementId `G-C77SMPF8VD`，自 5/21 pm-46 起持續）
- sitemap.xml + robots.txt dist landed（Phase 9-g-g-c）
- 5/24 G2 GA4 link_type cross-site fix 已 deploy（commit `960f234`）；user manual validation passed

### §5.2 可運行但「不好用」之痛點（8 項）

| # | 痛點 | 影響 | 性質 |
|---|------|------|------|
| 1 | Admin 無法寫入；任何 metadata 修改必須 VS Code | user 操作有切換成本；3 sections 名為 "dry-run editor" 但僅 preview | 由 FB-P5-c / Admin-2-b-2 解決；blocked on user 8+6 preflight |
| 2 | Blogger 發文 100% 手動貼 + 回填 publishedUrl | 單篇 5-10 min；漏貼某 copy-helper 區塊不易發現 | 由 `CLAUDE.md` §29「Blogger API 不做」限制決定；本質如此；publish-checklist.txt 已盡力輔助 |
| 3 | Reverse UTM Blogger→GitHub **source live but dormant** | source pm-24a/b/c 已 push origin/main；但 fixture 未建、Blogger 後台未重貼、GA4 reverse direction 無 production traffic | 由 pm-26 fixture readiness 階段啟動；user 自決時機（per `docs/reverse-utm-fixture-plan.md` §10） |
| 4 | hashtag 仍為 `<span>` 非 `<a>`；無 click target | hashtag click event 不存在；GA4 報表缺 `click_hashtag` | 屬 `docs/hashtag-slug-decision.md` Phase 2 範疇；DOM 結構變動屬中風險 |
| 5 | Blogger 端無 click tracking | Blogger 後台 GA4 缺 event；GA4 報表 Blogger 側只有 page_view | 設計層決議**不做**（per `blogger-listener-strategy.md` §5.1）；屬本質決議 |
| 6 | affiliate dormant（無 content 啟用） | `click_affiliate_cta` event 雖 landed 但無真實 fire；無收益 | 待 user 在 book-review post 設 `affiliate.enabled=true` + 填 links；可立即啟動，無 source 改動 |
| 7 | deploy GitHub Pages 多步手動 | `cp dist + git rm stale + commit + push gh-pages` 易漏；sitemap lastmod / bundle hash 需驗證 | Phase 2 可考慮 deploy script；不急（per `github-deploy.md`） |
| 8 | docs 過多（90+），cold-start onboarding 易迷路 | 5/24 已建 §15 docs trail map 緩解；新 session 仍須讀多入口檔 | 5/24 runbook + trail map 已就；維持；5/25 docs 應對齊同型結構 |

### §5.3 需要文件補強的項目（4 項）

| # | 文件 | 補強需求 |
|---|------|---------|
| 1 | `docs/phase-1-user-operation-guide.md` | §6.1 / §6.2 之 baseline 數字（`0 error / 38 warning / 33 issue-post` / sitemap 14 entries）與 `phase-status-20260523.md`（`0 error / 22 warning on 17 post(s)`）有 drift；需以**實際當前** `npm run validate:content` + `dist/sitemap.xml` `<url>` count 結果對齊（屬 read-only audit；非 source 修改） |
| 2 | Reverse UTM pm-26 deploy verify 階段 SOP | source live but dormant；待 fixture 建立後實際 deploy verify 之 step-by-step 仍未完全明確化（fixture-plan §10.5 有 Phase 1-6 切分，但 deploy verify 之 GA4 Realtime 驗收步驟細節未完全串接到 `ga4-reverse-utm-observation.md` §4-§6） |
| 3 | GA4 G4-G8 deferred items triage doc | `ga4-click-tracking-coverage-audit-20260524.md` §7.2 已列 G4-G8 候選；但 user 表態優先序之決策 doc 尚未建立（hashtag click / download click / social click / provider id mapping / article body inline link） |
| 4 | Affiliate 第一篇啟用之 walkthrough | 何時、選哪篇 book-review、如何驗 `click_affiliate_cta` 真實 fire（DevTools Network + GA4 DebugView）之 1-pager 尚未建立 |

### §5.4 需要 Phase 2 處理的項目（10 項）

| # | 項目 | 阻擋條件 |
|---|------|---------|
| 1 | Custom domain 啟用 | user 取得 domain + DNS provider access |
| 2 | AdSense 申請 / 啟用 | 依賴 #1 + AdSense 審核 |
| 3 | Admin write surface（FB-P5-c / Admin-2-b-2） | user 勾 `fb-sidecar-write-preflight-decision.md` §7 之 8+6 項 preflight |
| 4 | DS-3-b platform theme Option B | user 設計師決方案 + 平台品牌色 hex |
| 5 | DS-3-b-blogger-entry（重貼 Blogger 後台 CSS） | user 排程一次性貼 CSS（per `20260524-blogger-repost-checklist.md` §3） |
| 6 | Blogger listener implementation | 短期推薦不做；待 1-2 週觀察 GitHub click event 流量（per `blogger-listener-strategy.md`） |
| 7 | Hashtag `<span>` → `<a>` + `click_hashtag` 對接 | DOM 結構變動；屬 Phase 2 中風險（per `hashtag-slug-decision.md`） |
| 8 | Related Posts auto block（兩端 mirror） | 需 ≥ 5 ready post（當前 3 篇；per `phase-9h-completion-report.md` §8.1） |
| 9 | Full-text search | per `CLAUDE.md` §29 第一版不做；屬第二階段 |
| 10 | Pagination / virtual scroll for Admin | 文章 ≥ 100 篇才需（當前 6 篇，遠未需） |

---

## §6 建議下一批 3 個小任務

條件：低風險 / 可驗證 / docs-only 或 read-only 優先 / 不一開始就大改架構。

| Task | 名稱 | 性質 | 風險 | 可驗證方式 | 預估 |
|------|------|------|------|-----------|------|
| **T1** | **落地本 phase usability review 文件** → `docs/20260525-phase1-usability-review.md`（即本文件） | docs-only 新檔 | 🟢 低 | `git status` 後 `?? docs/20260525-phase1-usability-review.md` + 文件內容對照本回報 | ~20 min |
| **T2** | **phase-1-user-operation-guide drift sync read-only audit** → 跑 `npm run validate:content` + 數 `dist/sitemap.xml` 之 `<url>` count（皆 read-only）；read-only 比對 user-guide §6.1 / §6.2 寫的 baseline 數字是否仍 current；產出 `docs/20260525-phase1-user-guide-drift-check.md`（或 inline addendum） | read-only audit + docs-only 新檔 | 🟢 低（validate 為 read-only；不改 source） | 報告中明列 expected vs actual baseline，無 source 修改 | ~30 min |
| **T3** | **Reverse UTM 5/25 fixture readiness snapshot 1-pager** → 對齊 `docs/reverse-utm-fixture-plan.md` §10 addendum；read-only 確認 pm-24 source live but dormant 狀態未漂移；產出 `docs/20260525-reverse-utm-readiness-snapshot.md`（或 append `reverse-utm-fixture-plan.md` §11） | read-only check + docs-only append / 新檔 | 🟢 低 | 報告中明列「source landed / fixture not built / Blogger 後台未重貼 / GA4 reverse direction 無 production traffic」狀態未變 | ~20 min |

三任務皆：

- 不動 `src/` / `content/` / `templates/` / `settings/` / build script / `dist/*` / `deploy repo`
- 不 build / install / deploy / push gh-pages / Blogger 後台 / GA4 後台
- 可串成同一 session 連續執行（皆 docs-only），亦可分次

T1 為本文件落地本身；本文件落地後 T1 即達成。

---

## §7 本 phase 邊界保證

本 phase `20260525-am-3-phase1-usability-review-doc-a` 嚴格遵守 docs-only 邊界：

| 項目 | 狀態 |
|------|------|
| 修改 `src/` | ❌ 無 |
| 修改 `content/`（posts / settings / templates / fixtures） | ❌ 無 |
| 修改 build scripts（`src/scripts/`） | ❌ 無 |
| 修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 無 |
| 修改 deploy repo | ❌ 無 |
| 修改 `README.md` / `CLAUDE.md` / `package.json` / `vite.config.js` | ❌ 無 |
| 修改 docs index（`docs/README.md`） | ❌ 無 |
| 修改 5/24 既有 docs（runbook / repost-checklist / reverse-utm-observation / phase-1-* / EOD report 等） | ❌ 無 |
| 執行 `npm install` | ❌ 無 |
| 執行 `npm run build*` / `npm run dev` / `npm run validate*` | ❌ 無 |
| 執行 git commit / push | ❌ 無（待 user 確認後另行決定） |
| 觸碰 Blogger 後台 | ❌ 無 |
| 觸碰 GA4 後台 / FB 後台 | ❌ 無 |
| 啟動任何 deferred items（FB-P5-c / Admin-2-b-2 / hashtag a / reverse UTM deploy verify / 等） | ❌ 無 |
| **唯一允許** | ✅ 新增 `docs/20260525-phase1-usability-review.md`（本檔；單一檔案） |

本文件落地後**不**改變任何 production state；屬純 docs / planning 工具。

---

## §8 Cross-links

### 8.1 規範來源

- `CLAUDE.md` §1（系統目的）/ §4（第一版技術限制）/ §28（第一版 MVP 必做）/ §29（第一版不做清單）/ §30（最終樣貌）

### 8.2 Phase 1 收尾基準

- `docs/phase-1-completion-report.md`（Phase 9-z-d 正式 final report）
- `docs/phase-1-completion-checklist.md`（Phase 9-z-b 逐項對照清單；13 主節 / 525 行）
- `docs/phase-1-user-operation-guide.md`（非工程師操作手冊草稿）
- `docs/phase-status-20260523.md`（5/23 Phase 1 完成度盤點 snapshot）

### 8.3 本日（5/25）docs trail

- `docs/20260525-pc-handoff-baseline.md`（本日上午 NB→PC 接手 baseline；commit `65145a8`）
- `docs/20260525-phase1-usability-review.md`（本檔）
- T2 候選：`docs/20260525-phase1-user-guide-drift-check.md`（未啟動）
- T3 候選：`docs/20260525-reverse-utm-readiness-snapshot.md` 或 `reverse-utm-fixture-plan.md` §11 addendum（未啟動）

### 8.4 昨日（5/24）docs trail 入口

- `docs/20260524-eod-report.md`（含 §15 docs trail / cross-reference map；canonical 5/24 全日紀錄）
- `docs/20260524-blogger-github-publishing-runbook.md`（operator-facing entry runbook）
- `docs/20260524-blogger-repost-checklist.md`（canonical Blogger 後台手動重貼 SOP）
- `docs/20260524-ga4-reverse-utm-observation.md`（canonical GA4 reverse UTM 觀察 SOP）
- `docs/20260524-ga4-reverse-utm-observation.md` / `docs/reverse-utm-fixture-plan.md` §10（canonical fixture readiness review）
- `docs/ga4-click-tracking-coverage-audit-20260524.md`（G1-G8 coverage gaps；G1 / G2 / G3 fully resolved；G4-G8 deferred）

### 8.5 7 能力維度上層 docs

| 維度 | canonical 文件 |
|------|---------------|
| Blogger 流程 | `blogger-export.md` / `20260524-blogger-github-publishing-runbook.md` |
| GitHub Pages 流程 | `github-deploy.md` / `architecture.md` |
| FB / promotion | `promotion-export.md` / `fb-sidecar-schema.md` / `fb-sidecar-write-preflight-decision.md` |
| GA4 / click tracking / UTM | `ga4-link-tracking-spec.md` §4.5 / `click-tracking-governance.md` / `ga4-parameter-naming-registry.md` / `ga4-enable-preflight.md` |
| AdSense / affiliate | `ad-affiliate-schema-proposal.md` / `custom-domain-root-files-strategy.md` |
| Admin | `admin-1-completion-report.md` / `admin-2-write-pre-analysis.md` / `admin-overview-audit-20260523.md` / `admin-overview-b-series-decision-prep.md` |
| Design token | `design-system.md` / `design-system-ds3b-theme-overrides-proposal.md` / `design-token-audit-20260523.md` |

### 8.6 下一階段 roadmap

- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選 roadmap）
- `docs/20260522-pm-phase-2-batch-plan.md`（Phase 2 拆批）
- `docs/future-roadmap.md`（跨 phase 路線總覽）

---

（本文件結束）
