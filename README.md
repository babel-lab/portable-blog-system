# Portable Blog System

依 `CLAUDE.md` 建立的「可搬家的本機資料夾型內容管理系統」。
Phase 1 範圍涵蓋 Phase 0~9-z-d，**靜態發布系統可基礎運行**（per `docs/phase-1-completion-report.md`；commit `4d68f50`）：GitHub Pages 站、Blogger 匯出（HTML / 貼文素材 / metadata）、FB promotion（含 titleEn / hashtags / UTM）、GA4 click tracking、sitemap / robots、Design System、sidecar bundle、book / series / relatedLinks schema 等基礎能力已就位。系統仍持續改善 **usability、內容流程、SEO、GA4、廣告 / 聯盟區塊**；目前部分能力為 dormant（AdSense、affiliate block、Blogger→GitHub reverse UTM），待自然觸發或外部條件就位後再啟動。

## 專案定位

- VS Code 管理 Markdown 文章與 JSON 設定，內容不綁死在 Blogger
- Vite + EJS + SCSS + Vanilla JS 建立 GitHub Pages 靜態站（production live since 2026-05-21）
- Blogger 作為既有流量入口與 AdSense 內容站；本機可一鍵產 Blogger 可貼用 HTML / theme CSS / copy-helper / publish-checklist（per `docs/blogger-export.md`）
- 第一版不做登入後台、會員、資料庫、留言、View 數、Like 數（per `CLAUDE.md` §29）

## 第一次使用

```bash
npm install
npm run dev
```

`npm run dev` 透過 `predev` 先跑 build，再啟 Vite。
瀏覽器自動開首頁（port 5173 起跳，被佔用會自動往上）。

## 主要 npm 指令

| 分組 | 指令 | 用途 |
|---|---|---|
| dev / build / preview | `npm run dev` | 本機預覽（自動先跑 build:data） |
|  | `npm run build` | Vite production build 到 `dist/`（自動先跑 build:data；postbuild 自動串 `build:sitemap`） |
|  | `npm run preview` | 預覽 `dist/` |
| build:* | `npm run build:data` | 讀 Markdown + settings → 渲染 EJS → 寫 `.cache/pages/`、`.cache/data/posts.json`、`site.json`、`build-manifest.json` |
|  | `npm run build:github` | 同 `build:data` 的 alias |
|  | `npm run build:blogger` | 產 Blogger 匯出 dist：每篇 4 檔（post.html / copy-helper.txt 13 區塊 / meta.json / publish-checklist.txt）+ Blogger home + category index。**ready-only**（draft 不進正式 dist）|
|  | `npm run build:blogger-preview -- --slug=<slug>` | **本機 preview only**：draft-aware 單篇預覽產出至 `dist-blogger-preview/posts/<slug>/`（post.html / copy-helper.txt / meta.json，皆帶 `PREVIEW-ONLY / NOT FOR DEPLOY`）。不改 frontmatter、不動正式 `dist-blogger/`、不 deploy、零網路 |
|  | `npm run build:blogger-theme` | 產 Blogger 主題 CSS 4 檔（tokens / components / article / full-style）|
|  | `npm run build:promotion` | 產 FB 粉絲頁推廣文案 txt（`dist-promotion/facebook/{blogger,github}/{slug}.txt`）|
|  | `npm run build:sitemap` | 產 `dist/sitemap.xml`（filter noindex）+ `robots.txt`；postbuild 自動串接 |
| validate / new / backfill | `npm run validate:content` | 驗證文章 frontmatter（category / tags / series / book / relatedLinks 等規則；僅 warn）|
|  | `npm run new:post` | 互動式新文章 helper（含 series CLI flags） |
|  | `npm run backfill:url` | 發布後將 Blogger `publishedUrl` 回填 `.publish.json` |
| report:* | `npm run report:build` | build report dump |
|  | `npm run report:drafts` | 列出 draft posts |
|  | `npm run report:missing-tags` | 列出引用未定義 tag 的 posts |
|  | `npm run report:urls` | 列出 published URLs |
|  | `npm run report:series` | series 結構 / 序號 / 標題 resolution 報表 |
|  | `npm run report:book` | book / magazine metadata 報表 |
| check / smoke | `npm run check:links` | 檢查 broken links |
|  | `npm run check:images` | 檢查 image links |
|  | `npm run smoke:reverse-utm` | reverse UTM L1 pure-function smoke（fixture-free） |

## 可用頁面與 URL

| 路徑 | 說明 | HTTP |
|---|---|---|
| `/` | 首頁，列出 ready 文章卡片 | 200 |
| `/posts/` | 文章列表頁 | 200 |
| `/posts/{slug}/` | 文章詳細頁（render markdown body） | 200 |
| `/categories/` | 分類索引（只列有 ready 文章引用的分類） | 200 |
| `/categories/{slug}/` | 該分類文章清單 | 200（有引用才生成） |
| `/tags/` | 標籤索引（只列有 ready 文章引用的標籤） | 200 |
| `/tags/{slug}/` | 該標籤文章清單 | 200（有引用才生成） |
| `/404.html` | 自訂 404（GitHub Pages 部署後會自動 fallback） | 200（手動瀏覽） |
| `/design-system/` | Design System 索引 + 子頁（colors / spacing / typography / buttons / cards / article-components）| 200 |
| `/sitemap.xml` | sitemap（filter noindex） | 200 |
| `/robots.txt` | robots（含 Disallow + Sitemap） | 200 |
| 不存在路徑 | Vite mpa 預設 404 | 404 |
| draft 文章的 `/posts/{slug}/` | 不產生 HTML | 404 |
| 無 ready 文章的分類 / 標籤 | 不產生 HTML | 404 |

## 內容資料夾

```
content/
├── github/posts/        # GitHub 站 Markdown 文章
├── blogger/posts/       # Blogger 站 Markdown 文章
├── shared/posts/        # 跨站文章
├── drafts/、archive/    # 暫存與封存
├── templates/           # 6 個內容模板（post / github-tech-note / blogger-book-review / blogger-magazine-review / blogger-download / blogger-summary）
├── validation-fixtures/ # validator 錯誤樣本（不入 build）
└── settings/            # 16+ 個 JSON 設定檔（site / themes / categories / tags / ads / social-links / promotion / affiliate-networks / link-rules / seo / ga4 / navigation / sidebar / footer / series 等）
```

詳細結構與各檔案用途見 `CLAUDE.md` §3 與 §8。

## Frontmatter 必填欄位（簡要）

依現有 ready 範例 `content/github/posts/20260504-portable-blog-system-mvp.md`：

```yaml
---
id: "20260504-portable-blog-system-mvp"           # 唯一識別
site: "github"                                     # github / blogger（決定走哪條 build pipeline）
contentKind: "tech-note"                           # post / tech-note / book-review / download / page 等
primaryPlatform: "github"                          # canonical / cross-platform 主屬
title: "Portable Blog System MVP 開發筆記"
slug: "portable-blog-system-mvp"                   # 決定 /posts/{slug}/
date: "2026-05-04"
updated: "2026-05-04"
author: "Dean"
category: "tech-note"                              # 必須存在於 settings/categories.json
tags: [github, vite, static-site]                  # 每項必須存在於 settings/tags.json
description: "..."
status: "ready"                                    # ready / published 才會產生 HTML
draft: false                                       # true 直接排除

publishTargets:                                    # 兩平台輸出開關 + 模式
  github:
    enabled: true
    mode: "full"
  blogger:
    enabled: true
    mode: "summary"                                # full / summary / redirect-card

blocks:                                            # 條件式 article block
  adsenseTop: true
  adsenseBottom: true
  hashtags: true
  relatedPosts: true

# 視文章類型可選填：
# book:           書評 / 雜誌 metadata（per docs/book-schema.md）
# series:         系列 metadata（per docs/series-schema.md）
# affiliate:      聯盟連結（per CLAUDE.md §12）
# download:       下載素材（per CLAUDE.md §13）
# relatedLinks:   relatedLinks aside（per docs/related-links-schema.md）
# otherLinks:     otherLinks aside
# promotion:      FB 推廣 metadata
# seo:            indexing / 顯式 SEO 欄位（per docs/seo-indexing-rules.md）
---
```

完整 schema 見：

- `CLAUDE.md` §3.1（總則）/ §11（contentKind）/ §12（書評）/ §13（下載）/ §14（標籤）/ §16.5（relatedLinks）
- `docs/content-schema.md` / `docs/publish-bundle.md` / `docs/publish-json-schema.md`
- `docs/book-schema.md` / `docs/series-schema.md` / `docs/related-links-schema.md`
- `docs/migration-from-frontmatter.md`（舊 `type` → `contentKind` 對照）

## 發布狀態與 draft 過濾

`load-posts.js` 的過濾規則：

- `draft: true` → 排除
- `status: "draft"` 或 `"archived"` 或缺值 → 排除
- `status: "ready"` 或 `"published"` → 列入 `posts.json` 的 `posts[]`，會產生 HTML

被排除的文章會列在 `.cache/data/posts.json` 的 `filteredOut[]`，方便除錯。

Blogger 文章另有 sidecar：

- `{slug}.publish.json` — Blogger 平台 metadata（type / permalink / status / publishedUrl / publishedAt / bloggerPostId 等；per `docs/publish-json-schema.md`）
- `{slug}.fb.md` — FB 粉絲頁 metadata（12 read-only 欄位；per `docs/fb-sidecar-schema.md`）

## Phase 1 已完成能力（摘要）

Phase 1 範圍涵蓋 Phase 0~9-z-d；完整逐項對照見 `docs/phase-1-completion-checklist.md`（13 主節 / 525 行）+ 正式收尾報告 `docs/phase-1-completion-report.md`。主要能力：

- **GitHub Pages 站**：production live（measurementId `G-C77SMPF8VD`，自 2026-05-21 起；最近 deploy `960f234`，2026-05-24）；首頁 / 列表 / 詳細 / 分類 / 標籤 / 404 / sitemap.xml（filter noindex）/ robots.txt / Design System 子頁全部 live；作為新網站之主要內容輸出
- **Blogger 匯出**：full / summary / redirect-card 三模式；每篇產 4 檔貼文素材（post.html / 13 區塊 copy-helper / meta.json / publish-checklist）供手動貼至 Blogger 後台；Blogger theme CSS 4 檔；首頁 / category index；cross-source mirror（Blogger 文章可同步輸出至 GitHub dist）
- **FB promotion**：`.fb.md` sidecar 12 欄位 schema（含 titleEn / hashtags / 推廣文案 / target page / UTM 等）；`build:promotion` 產 FB 文案 txt（UTM 自 `promotion.config.json` 注入）；Admin detail panel 顯示 14 row FB metadata
- **GA4 / click tracking**：4-AND gating；click event 涵蓋 **affiliate block placement（top / bottom + placement params）**、**relatedLinks**、**otherLinks** 之 click attrs 全 landed；**hashtag 仍為 `<span>` 無 `click_hashtag` event**（屬 Phase 2 候選）；GitHub→Blogger forward UTM live；**Blogger→GitHub reverse UTM 為 landed but dormant — 尚未經 true production validation**（per `CLAUDE.md` §16.4）
- **Design System**：tokens / themes / spacing / typography / breakpoints / mixins / z-index 完整；BEM + `lab-` prefix 一致；DS-3 hardcoded color resolved（10 fixes + 2 documented exemptions）
- **連結處理**：外部連結自動 `target="_blank" rel="nofollow noopener noreferrer"`；聯盟連結自動 `sponsored`；站內連結不加 UTM；策略 A skip if author UTM exists
- **Schema / validate / report**：sidecar bundle + book + series + relatedLinks 4 大 schema；`validate:content` 0 error baseline；report / check / smoke 共 9 個 helper script
- **Admin overview**：dev-mode-only Plan B；14 stat-cards / 6 filter optgroups / 3 sort options / 10 detail sections / missing metadata warning；read-only / dry-run（無寫入）
- **JS 互動**：Sticky Header / Mobile Drawer / Back to Top / lazy-image 全部 live

## 目前限制

- **Admin 無寫入**：任何 metadata 修改必須 VS Code 編輯；FB-P5-c / Admin-2-b-2 寫入路徑 blocked on user 勾 8+6 preflight（per `docs/fb-sidecar-write-preflight-decision.md` §7）
- **Blogger 100% 手動貼文**：per `CLAUDE.md` §29「Blogger API 不做」；每篇貼文 5-10 min；`publish-checklist.txt` + `docs/20260524-blogger-repost-checklist.md` 為 SOP
- **GitHub Pages deploy 為手動**：採 `cp -r dist/* ../portable-blog-deploy/` + `git rm` stale + commit + push gh-pages；per `docs/github-deploy.md` + `docs/20260524-blogger-github-publishing-runbook.md` §3-§4
- **`vite.config.js` 採 `appType: 'mpa'`**：dev 階段不存在路徑回 Vite 預設 404，**不**自動載入 `/404.html`；GitHub Pages 部署後才會自動 fallback
- **廣告 / 變現雙通路皆 dormant**：本專案變現非單一倚賴 Google AdSense；另有 affiliate block 通路（書評 / 教具下載文章內嵌聯盟連結）。兩通路 schema 均已就位但目前 dormant：
  - **AdSense dormant**：`ads.config.json` 結構就位但 `enabled=false`；申請 blocked on custom domain + HTTPS Enforce + AdSense 審核
  - **Affiliate dormant**：schema / providers（**通路王 / 聯盟網**；per `content/settings/affiliate-networks.json`）/ `click_affiliate_cta` event 全就位；無 ready post 設 `affiliate.enabled=true`；待自然書評觸發（per `docs/20260525-affiliate-first-activation-readiness.md`）
- **Reverse UTM dormant（landed but not validated）**：pm-24a/b/c source 已 push origin/main；fixture 未建；Blogger 未重貼；GA4 reverse direction 0 traffic；**尚未經 true production validation**（未經 user 手動重貼 Blogger 後台 + GA4 Realtime 驗收）；維持 dormant 至自然 fixture 出現（per `docs/reverse-utm-fixture-plan.md` §10）
- **hashtag 仍為 `<span>`**：無 click target / `click_hashtag` event；屬 Phase 2 候選（per `docs/hashtag-slug-decision.md`）
- **Blogger 端不對接 click tracking**：設計層決議（per `docs/blogger-listener-strategy.md` §5.1）；Blogger 後台 GA4 僅有 page_view
- **Custom domain 未綁**：仍用 GitHub Pages 預設 `babel-lab.github.io/portable-blog-system`（per `docs/custom-domain-root-files-strategy.md`）

## Phase 2 及後續候選

Phase 2 候選與後續方向見 `docs/phase-2-candidate-roadmap.md` + `docs/20260522-pm-phase-2-batch-plan.md` + `docs/future-roadmap.md`。主要 deferred / blocked 項：

- Custom domain 啟用（blocked on user 取得 domain + DNS provider access）
- AdSense 申請 / 啟用（依賴 custom domain）
- Admin write surface（FB-P5-c / Admin-2-b-2；blocked on user 勾 preflight）
- DS-3-b platform theme Option B 平台品牌色（blocked on user 設計師決方案）
- DS-3-b-blogger-entry（重貼 Blogger 後台 CSS；屬一次性手動操作）
- Blogger listener implementation（短期推薦不做；觀察 GitHub click event 流量後再評估）
- Hashtag `<span>` → `<a>` + `click_hashtag` 對接（DOM 結構變動；屬中風險）
- Related Posts auto block 兩端 mirror（需 ≥ 5 ready post；當前 3 篇）
- Reverse UTM L2 fixture phase（採 C 路線；等自然書評自然引用 GitHub 站技術文）

**Phase 8（暫緩）** 永不做清單：View 數、Like、留言、會員、後端、Blogger API、Drive API（per `CLAUDE.md` §29）。

## 修改本專案

任何 source 變更前請先閱讀 `CLAUDE.md`，並依 §27 流程：

1. 列出修改目標、影響分類編號、不會修改的檔案、預計新增 / 修改檔案
2. 取得確認後動工
3. 完成後回報新增 / 修改 / 備份 / 驗收結果

`docs/` 含 100+ 文件（Phase 0~9-z-d 完成報告 + schemas + EOD reports + handoff baselines + audits）。Cold-start 入口建議讀取順序：

- `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook 715 行）
- `docs/20260524-eod-report.md` §15（docs trail / cross-reference map）
- `docs/phase-1-completion-report.md`（Phase 1 正式 final 範圍）
- `docs/20260525-phase1-usability-review.md`（7 維度 + 13 流程 usability 盤點）
