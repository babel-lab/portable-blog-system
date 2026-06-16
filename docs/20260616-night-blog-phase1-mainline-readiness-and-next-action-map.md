# BLOG Phase 1 mainline readiness & next action map（docs-only）

> Phase: `20260616-night-blog-phase1-mainline-readiness-and-next-action-map-docs-only-a`
> Date: 2026-06-16 22:12+
> Type: docs-only checkpoint + next action map（不實作；不改 src / views / scripts / content / settings / package / dist / gh-pages；只從 ADMIN idle freeze 切回 BLOG 系統主線；對齊 BLOG Phase 1 完成度與下一階段建議）
> Scope: 接續 `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md` 之 ADMIN idle freeze 後，把焦點轉回 BLOG 系統第一階段主線；盤點 BLOG Phase 1 已完成 / 尚未完成 / Blogger / GitHub Pages / AdSense / GA4 / content / publishing / FB sidecar 狀態 + 下一步保守 / 候選 phase 建議。

---

## A. Baseline 狀態

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `2de35e96dd6c717737611f6110c0cf2356fab8c2` |
| short HEAD | `2de35e9` |
| latest commit subject | `docs(admin): checkpoint admin stage progress` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| 最近 5 commits | `2de35e9` admin checkpoint · `3628fcb` browser pass · `df0c02f` accept collapsible · `f89ad09` collapse detail panel sections · `a1a3132` plan readability ia |

Baseline carry-forward acceptance numbers（**未於本 docs-only phase 重跑**；以最近 source / settings / dist 未變動為前提沿用）：
- `validate:content` = **0 errors / 94 warnings / 84 issue-posts**
- overlay `validate-content --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json` = **0 errors / 101 warnings / 85 issue-posts**
- `check:adsense-resolver` 34/0 · `check:adsense-article-block` 13/0 · `check:adsense-anchor-wiring` 14/0
- `check:blogger-adsense-output` 85/0（6 targets：we-media-myself2 / github-pages-blog-planning / daily-reading-habit-notes / reading-notes-three-questions / after-work-writing-time-blocking / blog-as-personal-knowledge-base）
- `check-commerce-affiliate-resolver` 23/0
- ADMIN smokes：`check:admin-governance-aggregation` 16/0 · `check:validation-report` 14/0 · `check:admin-validation-consume` 12/0

---

## B. 為什麼 ADMIN 現在應該 idle freeze

依 `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md` §F / §G / §K：

1. ADMIN 已**超過** Phase 1 BLOG 系統 MVP 之最小必要能力（read-only 觀察 / 驗證輔助 / 治理可視化）
2. R1 readability（4 低頻 detail section native `<details>` 收合）= rendered + browser 雙重 PASS
3. validator-warning 線完整閉環：reporter（`report:validation`）→ smoke（`check:validation-report` 14/0）→ detail-panel read-only consume（四態 no-report / status-excluded / matched / clean）→ governance footnote sync → System-checks line sync → rendered-artifact acceptance PASS
4. governance 線完整閉環：governanceSignals 5 欄派生 → governanceAggregation 純函式 + smoke → detail panel UI（read-only + same-source 註）→ Categories & Tags governance summary card → browser PASS
5. Posts table `<td>` 7/7 結構閉合修復已 acceptance PASS
6. ADMIN 屬 dev-mode-only / noindex / 不進 prod build / 不進 dist / 不 deploy；不阻擋任何 BLOG MVP 17 項輸出
7. R2 / R3 / R4 / R5 / SEO 收合 / validator count badge / filter chip / write path / per-post prescription 一律須**獨立 phase + user explicit approval**；非 Phase 1 必做
8. CLAUDE.md §29 第一版不做清單明示：不做真正後台 / 登入 / 視覺化編輯器 / 寫入

→ **結論：ADMIN 進入 idle freeze 為保守且合理選擇；BLOG 主線重心應回 content / publishing / 後續強化**。

---

## C. BLOG 系統第一階段目前已完成能力

依 `docs/phase-1-completion-report.md`（Phase 9-z-d 升正式 final，2026-05-18）+ `docs/phase-1-completion-checklist.md` + CLAUDE.md §28 / §30：

### C.1 系統能力（A 層）

- CLAUDE.md §28 17 條 MVP 必做項目**全 ✅**（per `docs/phase-1-completion-checklist.md` §3）
- CLAUDE.md §29 12 項第一版不做清單**全維持不做**（per 同檔 §4）
- Phase 0 ~ 7 主軸**全 ✅**（建立 / Vite 預覽 / Design System / Blogger 匯出 / FB Promotion / SEO+GA4+AdSense / RWD / 發布備份檢查 7 個主軸）
- Phase 8-a ~ 8-h 主軸**全 ✅**（sidecar bundle / normalize / placeholder resolver / series / 8-h legacy 退場 15/15 positions retired-or-migrated）
- Phase 9 主軸**全 ✅**：9-b（author SOP）/ 9-c（backfill URL CLI）/ 9-e（book schema）/ 9-f-c（book copy-helper [12] + publish-checklist）/ 9-f-g（Book mainEntity JSON-LD）/ 9-g（relatedLinks / otherLinks 全套）/ 9-g-g（JSON-LD isPartOf + mentions）/ 9-h（6/6 article block parity）/ 9-i（3/3 known blockers fix）/ 9-j（JSON-LD landing verification）
- Article block parity 100%（Blogger ↔ GitHub）達成
- 輸出產物 9 大類**全可產出**；`dist/sitemap.xml` / `dist/robots.txt` 已於 Phase 9-g-g-c 補檔（2026-05-19 09:49；10 url entries）

### C.2 真實作者使用流程（B 層）

- 首篇真實 ready Blogger post **`20260515-we-media-myself2`** 通過完整 build × 5 pipeline；canonical 正確指向 Blogger publishedUrl；兩端 BlogPosting JSON-LD `@id` 一致；copy-helper [12] book metadata + [13] relatedLinks 區塊正確輸出；publish-checklist book-review / magazine + relatedLinks / otherLinks 5 條 checkbox；FB promotion txt 含正式 URL；example.com placeholder 全域 0 殘留
- **relatedLinks live activation** 達成（we-media-myself2 dist post.html 含 6 個 relatedLinks 命中；GitHub 端 cross-source mirror 同步）
- **Hashtag live activation** 達成（既有 ready GitHub posts dist 含 hashtag 區塊）

### C.3 Phase 1 final 後新增之 post-Phase-1 能力（截至 2026-06-16）

per CLAUDE.md ledger（Phase 1 final 後逐步擴充，**不**改變 Phase 1 final 宣告）：

- **AdSense N7–N9 整套** landed + LIVE：
  - `src/scripts/resolve-adsense-blocks.js`（resolver）+ `adsense-article-block.ejs` partial + `adsense-anchor.ejs` partial + post-detail.ejs 14 v1 anchor 插入點 + 6-block default 解析（articleAd1→afterHeader / articleAd2→afterCover / articleAd3→afterBookPhoto / articleAd4→afterAffiliateTop / articleAd5→beforeAffiliateBottom / articleAd6→beforeRelatedLinks）
  - **GitHub Pages article ads LIVE**（N9e；2026-06-11 commit `3e1f4e3`；deploy `2acb5a5→c15e514`）
  - **Blogger article-bottom ad（articleAd6 / beforeRelatedLinks）LIVE on 6 篇**（we-media-myself2 / github-pages-blog-planning / daily-reading-habit-notes / reading-notes-three-questions / after-work-writing-time-blocking / blog-as-personal-knowledge-base；guard 85/0；其他 articleAd1–5 維持 pages-only）
- **GA4 P1 article_bottom_nav custom dimensions** 註冊 + report-verified（2026-06-15 17:35；`click_area=article_bottom_nav` + `event_name=click_other_link`；Click Area / Nav Direction / Source Post Slug / Target Slug 全方向有資料）
- **Commerce links L1 seed**：registry 10 active entries（全 `networkKey: books` / 通路王）；R1 resolver `resolve-affiliate-links.js`；R2 smoke 23/23；R3 production migration `we-media-myself2.md` 2 筆 url→ref；pm-12 Blogger affiliate.blocks[] renderer wiring；pm-13 we-media-myself2 dual-block content（2 Blogger-only blocks：top / bottom；legacy `links[]`+`position` 保留以保 GitHub byte-identical）
- **Reverse UTM Blogger→GitHub source landed but un-deployed**（pm-24a/b/c；2026-05-23；`ga4-url-builder.js` 加 `direction`、`build-blogger.js` 加 `deriveRenderedCrossLinks`、`blogger-post-full.ejs` 讀 rendered；live 狀態 dormant；pm-26 deploy gate BLOCKED）
- **ADMIN dev-mode-only read-only 後台**全套（per `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md`；不進 prod；不阻擋 BLOG 主線）

### C.4 內容狀態快照（截至 2026-06-16）

| 站台 | ready posts | drafts | 備註 |
|---|---|---|---|
| Blogger（production） | **7 篇**：we-media-myself2 / github-pages-blog-planning（cross-source full-flip）/ daily-reading-habit-notes / reading-notes-three-questions / after-work-writing-time-blocking / blog-as-personal-knowledge-base / ai-tools-simplify-daily-workflow（**剛 landed；未 live**） | 3 篇：sample-book-review / draft-book-review / phonics-practice-sheet-download | 6 篇 live PASS + 1 篇 pending repost；P3 blog-restart-steady-rhythm-notes 仍為 docs draft（未落 content） |
| GitHub Pages（production） | 2 篇：github-pages-blog-planning / portable-blog-system-mvp（noindex-follow） | — | + 1 篇 cross-source mirror `we-media-myself2` |
| Validation fixtures | 84 issue-posts（normal baseline）；合計 ~94+ fixture md 檔 | — | 由 fixture-driven validator coverage（AdSense / commerce / FB / book / series 等系列） |

---

## D. BLOG 系統第一階段尚未完成能力

依 Phase 1 final 宣告（per `docs/phase-1-completion-report.md` §4 / §12）：**Phase 1 內已無「尚未完成」項目**；下列皆屬 post-Phase-1 強化，**不阻擋** Phase 1 final。

### D.1 屬 post-Phase-1 強化（不阻擋 Phase 1，可延後）

| 項目 | 狀態 | trigger condition |
|---|---|---|
| Phase 9-h-f：兩端 Related Posts auto block（自動推薦） | ⏸ future candidate | 作者 ≥ 5 篇 ready post（當前 Blogger 端 7 篇 / GitHub 端 2 篇；跨兩端各 ≥ 5 仍未達） |
| Phase 9-f-g2：Periodical / magazine structured data（JSON-LD） | ⏸ deferred | 首篇 ready magazine post + Google Rich Results Test 驗證 |
| Phase 8-g-1：fixture / sample end-to-end 驗證 | ⏸ deferred | 作者人工確認部署能隔離 `_sample-` 內容 |
| Phase 8-g candidate 6：first article `.fb.md` hashtags fallback | ⏸ nice-to-have | — |
| Google Rich Results Test 驗證 | ⏸ author SOP | 作者持續執行；屬 post-Phase-1 持續適用 |
| FB sidecar **真實寫入** | ⏸ 待 user 勾選 preflight checklist | `docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項 user 勾選 |
| Reverse UTM Blogger→GitHub deploy verify | 🔴 BLOCKED | per `docs/reverse-utm-fixture-plan.md` §6（缺 positive GitHub cross-link fixture） |
| Blogger AdSense Batch 2 expansion 實際 live | 🔴 BLOCKED per-post | 須 user 完成 repost packet inputs + explicit approval 始可手動重貼 |

### D.2 Dormant article blocks（infrastructure ready；屬作者內容路徑；不阻擋 Phase 1）

per `docs/phase-1-completion-report.md` §7.3 / §8.5：

- Cover（既有 ready posts `cover` 多為空字串）
- Affiliate Box top / bottom（需 book-review ready post 含 `affiliate.links[]` 啟用；we-media-myself2 已啟用 Blogger 端 dual-block，GitHub 端 legacy）
- Download Box（需 download ready post 含 `download.fileUrl` 啟用；phonics-practice-sheet-download 仍為 draft）
- Book Photo（we-media-myself2 為 book-review 但 `book.showBookPhoto` 未啟用）

---

## E. Blogger 發文 / repost / AdSense / GA4 目前狀態

### E.1 Blogger publishing

- 手動發布流程（per CLAUDE.md §2.1）；不接 Blogger API（CLAUDE.md §29 永禁）
- runbook：`docs/20260524-blogger-github-publishing-runbook.md`（5/24 落地之 operator-facing 整合 SOP；canonical 詳本仍為 `docs/20260524-blogger-repost-checklist.md`）
- 已 live PASS 6 篇 Blogger AdSense article post（per CLAUDE.md ledger）
- ai-tools-simplify-daily-workflow（Batch 2 P2 candidate）= **content landed pm-26；repost packet pm-27 docs-only；live repost 🔴 BLOCKED**（須 user 勾選 packet §D inputs + explicit approval）
- P3 blog-restart-steady-rhythm-notes 仍為 docs draft（pm-28；docs/ 內未落 content/）

### E.2 Blogger AdSense

- `articleAd6` / `beforeRelatedLinks` **LIVE on 6 篇**（surface gating 通過；filled 觀察為單一 time-point；fill ≠ earning ≠ policy approval）
- guard `check:blogger-adsense-output` **85/0**（1 settings invariant + 14×6 target）
- `articleAd1–5` 維持 pages-only（GitHub Pages 端，Blogger 不展開）
- real id 僅存 `ads.config.json`；docs / source / EJS / tests / package / 任何 frontmatter / ledger / 本文件 皆無 real id 字面值
- Phase F Batch 2 候選池：P2 ai-tools-simplify-daily-workflow（content landed but not live）/ P3 blog-restart-steady-rhythm-notes（仍 draft）
- 監控 cadence：same-day 前台目視 / 24–72h dashboard policy / 3–7d 穩定觀察才考慮再擴

### E.3 GA4 article_bottom_nav P1（report-verified）

- production live measurementId `G-C77SMPF8VD`（2026-05-21 起）
- P1 custom dimensions（click_area / nav_direction / source_post_slug / target_slug）**註冊完成 + report-verified**（2026-06-15 17:35；user 於 GA4 後台 Explore 確認資料可查；三方向 next / previous / home 皆有資料）
- 紅線：篩文章底部導覽必須 `event_name=click_other_link` **加** `click_area=article_bottom_nav` 雙條件，**不可單看 `click_other_link`**（會混入 otherLinks aside 等點擊）
- **GA4 P1 wait blocker resolved**；ADMIN 線 idle freeze 後此處亦進入觀察階段

---

## F. GitHub Pages 發佈 / custom domain / deploy 目前狀態

### F.1 Deploy 流程

- 透過獨立 `portable-blog-deploy` repo（runbook：`docs/github-deploy.md` §4 + §5.4）
- 最近一次已知 deploy = AdSense N9e GitHub Pages article ads LIVE（2026-06-11；gh-pages `2acb5a5→c15e514`）
- live URL 範例：`https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/`
- source repo（本 repo）與 deploy repo 嚴格分離；不在本 repo 直接 push gh-pages

### F.2 Sitemap / robots / SEO

- `dist/sitemap.xml` + `dist/robots.txt` 已於 Phase 9-g-g-c 補檔（2026-05-19；10 url entries；dist 受 `.gitignore` 管理）
- `seo.indexing` 7-batch policy 全 ✅（per `docs/seo-indexing-rules.md` SEO-2-z）
- JSON-LD Phase 9-j 兩端 BlogPosting + WebSite + isPartOf + mentions + Book mainEntity 全 landed
- canonical 雙站對齊（per Phase 9-i-b2 / 9-j）

### F.3 Custom domain

- **尚未啟用**；屬未來 migration 之 candidate
- 前置 docs：`docs/custom-domain-root-files-strategy.md`（5/21 落地；定義 robots / sitemap / ads.txt / CNAME / .nojekyll / favicon 等根目錄檔案策略）

### F.4 AdSense GitHub Pages

- LIVE since N9e（2026-06-11）；6 article block anchors 全 functional；generated post HTML 含 adsbygoogle / data-ad-client / data-ad-slot

---

## G. content / publishing / validation 主線目前狀態

### G.1 Validate baseline

- normal `validate:content` = **0 errors / 94 warnings / 84 issue-posts**
- overlay = **0 errors / 101 warnings / 85 issue-posts**
- **production-post warnings = 0**（94 / 101 全來自 `content/validation-fixtures/` fixture posts；production 0 觸發）
- 此屬 Phase 1 final 後逐步擴張之 fixture-driven validator coverage（download R rules / commerce C rules / affiliate.blocks[] / adsense.blocks[] 多系列）

### G.2 Publishing pipeline

- build × 5：`build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `build:blogger-theme`
- per-post sidecar：`.md` + `.publish.json` + 可選 `.fb.md`
- normalize-post-output（Phase 8-d 起）+ canonical resolver（Phase 9-i-b2 後）= 兩端 SOP 已穩定
- Phase 8-h legacy 退場 15/15 positions 已 retired-or-migrated（source 層相容性已清乾淨）

### G.3 7 個 report scripts

- `report:build` / `report:drafts` / `report:urls` / `report:series` / `report:book` / `check:links` / `check:images`
- 額外（Phase 1 final 後新增）：`report:validation`（reporter；產 git-ignored `.cache/data/validation-report.json`）/ `check:validation-report`（ADMIN smoke 14/0）

---

## H. FB sidecar / social publishing 目前狀態 + blocker

### H.1 已落地能力

- `.fb.md` schema（per `docs/fb-sidecar-schema.md`）
- sidecar load + normalize（Phase 8-d-4-b / 8-f-7-b / 8-g-19-c / 9-i-d-b sidecar-first fallback chain）
- `build:promotion` 產 `dist-promotion/facebook/{site}/{slug}.txt` + `all-posts-index.txt`
- UTM 集中管理（`content/settings/promotion.config.json`）
- ADMIN **read-only** display + **dry-run** editor（client-side preview；Apply 永遠 disabled；per `docs/admin-2b1-completion-report.md` + R1 collapsible）

### H.2 Blocker：FB sidecar 真實寫入仍 dormant

- 文件：`docs/fb-sidecar-write-safety.md` + `docs/fb-sidecar-write-preflight-decision.md` §7
- 條件：user 須勾選 8 項 preflight checklist
- 目前狀態：**ADMIN Apply / Save / Auto-fix 永遠 disabled**；middleware write / admin-write-cli 存在但 dormant；FB sidecar 寫入屬未來 phase
- CLAUDE.md §29 永禁：FB Graph API / 自動社群發文

### H.3 FB promotion 發布流程

- 手動：`dist-promotion/facebook/blogger/{slug}.txt` → user copy → FB 粉絲頁手動貼上 / 發文
- 不接 FB API（CLAUDE.md §29 永禁）

---

## I. Phase 1 MVP 最小完成判斷

### I.1 已達標（per `docs/phase-1-completion-report.md` §4 / §12）

- ✅ A 層系統能力（17 條 MVP 全 ✅；不做清單 12 項全維持）
- ✅ B 層真實作者使用流程（we-media-myself2 端對端 PASS）
- ✅ JSON-LD 兩端基礎 landed + verified（Phase 9-j）
- ✅ 6/6 conditional article block 兩端 parity
- ✅ Phase 9-i known blockers 3/3 全清
- ✅ Phase 1 final / completion snapshot 已宣告（2026-05-18 升正式 final）

### I.2 還缺（屬 post-Phase-1，不阻擋 Phase 1）

- 嚴格定義下：**Phase 1 內無「還缺」項目**
- post-Phase-1 強化（per §D.1）：Phase 9-h-f / Phase 9-f-g2 Periodical / Phase 8-g-1 / Google Rich Results Test 驗證 / FB sidecar 真實寫入 / Reverse UTM deploy verify / Blogger AdSense Batch 2 expansion live
- Dormant article blocks 4 個（per §D.2）：屬作者內容路徑；無系統缺漏

### I.3 可延後到 Phase 2（per CLAUDE.md §8 / §20 / §29）

- Phase 9-h-f Related Posts auto block（≥ 5 篇 ready post 後考慮）
- 全文搜尋（`src/js/modules/search.js` 預落地不啟用）
- toc.js / copy-code.js（CLAUDE.md §20 第二階段）
- 視覺化文章編輯器 / 真正後台登入 / 留言 / View 數 / 會員 / 資料庫後端（CLAUDE.md §29 永禁第一版做）
- FB / Blogger / Google Drive API 自動化（永禁第一版做）
- Custom domain migration（前置 docs 已備）

---

## J. 下一個最保守建議 phase

**保守 idle freeze / Phase 1 mainline handoff confirmation**：

- Phase 1 已 final；ADMIN 線 idle freeze；GA4 P1 report-verified；Blogger AdSense Batch 0+1+P1 共 6 篇 live PASS + guard 85/0；reverse UTM source landed but un-deployed；FB sidecar write dormant 等 user preflight
- working tree clean / ahead-behind 0/0 / 所有 smoke 通過
- 目前**無**緊急 source / settings / publishing blocker

**保守候選 phase（推薦）**：

`20260617-XX-blog-phase1-mainline-idle-freeze-handoff-confirmation-docs-only-a`
- docs-only：確認 Phase 1 mainline 進入 idle freeze；記錄已可進入下一階段（post-Phase-1 強化 / Phase 2 候選）；不啟動任何 source / build / deploy / Blogger / GA4 操作

紅線：保守階段**不**啟動任何 D.1 BLOCKED 項、**不**啟動 ADMIN R2–R5 / SEO 收合 / write path / count badge / filter chip、**不**重做已完成項目。

---

## K. 下一個可實作候選 phase

若 user 仍想推進 BLOG 主線，列**低風險 → 中-高風險**候選（皆須獨立 phase + user explicit approval）：

### K.1 P3 blog-restart-steady-rhythm-notes 草稿審稿 + 落地（低風險 / 內容線）

- 動機：pm-28 已落 docs draft（`docs/20260612-blogger-p3-steady-rhythm-article-draft.md`）；user 仍未審稿
- 範圍：(1) 人工 review 草稿（docs-only），或 (2) approval 後 single new file 落地至 `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`
- 風險：低（life-note 形態；zero-drift；mirror P1 / P2 pattern）
- Phase 命名建議：`20260617-XX-blogger-p3-steady-rhythm-article-draft-review-docs-only-a`（純審稿）或 `20260617-XX-blogger-p3-steady-rhythm-content-landing-a`（落地，須 approval）

### K.2 Blogger AdSense Batch 2 P2 ai-tools-simplify-daily-workflow live repost + verification（中風險 / 流量線）

- 動機：pm-26 content landed + pm-27 repost packet docs-only；**actual live repost BLOCKED**
- 範圍：(1) user 依 packet 完成手動重貼（須完成 §D 6 項 pre-repost inputs + explicit approval）→ verification record（docs-only）→ guard expand 加第 7 個 target（NOT docs-only）
- 風險：中（AI 工具文章；非工具推薦定位；首載 AdSense fill 屬正常變動；sanitizer strip 風險已 packet 標示）
- Phase 命名建議：`20260617-XX-blogger-adsense-batch-2-ai-workflow-manual-repost-execution-and-verification-record-docs-only-a`（verification 為 docs-only；guard expand 為獨立 phase）

### K.3 Blogger AdSense 後台 dashboard / policy monitoring observation record（低風險 / 觀察線）

- 動機：6 篇 live PASS 已超 72h；可進入 §H stable observation phase
- 範圍：docs-only；user 登入 AdSense 後台 → 記錄 policy center / site status / earning availability / invalid traffic / ad serving limited / 任何 warning
- 風險：低（純 observation；不改任何資料）
- Phase 命名建議：`20260617-XX-blogger-adsense-six-posts-dashboard-observation-record-docs-only-a`

### K.4 GA4 P2 / P3 dimension expansion preanalysis（低風險 / 觀察線）

- 動機：P1 article_bottom_nav 已 report-verified；P2 / P3（例如 hashtag click / affiliate click / download click）為自然延伸
- 範圍：docs-only preanalysis；列出哪些 events / parameters 已 instrumented 但未在 GA4 後台註冊為 custom dimension
- 風險：低（preanalysis；無 source / GA4 後台 mutation）
- Phase 命名建議：`20260617-XX-ga4-p2-p3-custom-dimensions-expansion-preanalysis-docs-only-a`

### K.5 Reverse UTM positive fixture 設計 + pm-26 deploy verify unblock（中-高風險 / 跨站 attribution 線）

- 動機：pm-24a/b/c source landed but un-deployed（2026-05-23）；pm-26 deploy gate 仍 BLOCKED
- 範圍：先 docs-only fixture 設計 preanalysis（per `docs/reverse-utm-fixture-plan.md` §6），再考慮 fixture landing → deploy verify
- 風險：中-高（涉跨站 deploy / Blogger 後台 / GA4 Realtime 驗收；多步協調）
- Phase 命名建議：`20260617-XX-reverse-utm-positive-fixture-design-preanalysis-docs-only-a`

### K.6 不推薦（紅線）

- ❌ FB sidecar 真實寫入啟動（須 user 8 項 preflight 全勾後另開）
- ❌ FB / Blogger / Google Drive / AdSense API 自動化（CLAUDE.md §29 永禁第一版）
- ❌ 真正後台登入 / 留言 / View 數 / 會員 / 資料庫後端（CLAUDE.md §29 永禁第一版）
- ❌ Phase 9-h-f Related Posts auto block（≥ 5 篇 ready post 後再啟動；當前 GitHub 端僅 2 篇）
- ❌ Custom domain migration（屬未來；前置 docs 雖備但無迫切性）
- ❌ ADMIN R2 / R3 / R4 / R5 / SEO 收合 / count badge / filter chip / write path（per ADMIN checkpoint 紅線）

---

## L. Non-actions（本 phase 明確不做）

- ❌ 不改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / `package-lock.json` / `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache/`
- ❌ 不執行任何 K.1–K.5 候選 phase
- ❌ 不啟動 ADMIN R2 / R3 / R4 / R5 / SEO 收合 / write path / Apply / Save / Auto-fix / filter chip / validator count badge / per-post prescription
- ❌ 不啟動 FB sidecar 真實寫入 / FB / Blogger / Google Drive / AdSense API 自動化
- ❌ 不 `npm install` / 不 build / 不 deploy / 不 push gh-pages / 不重貼 Blogger / 不開 Blogger 編輯器 / 不開 AdSense 後台 / 不改 GA4 後台
- ❌ 不 merge / rebase / reset / amend / force push
- ❌ 不重跑 validate / check guards（baseline carry-forward；未碰 source / settings）
- ❌ 不壓縮 / 重排 `CLAUDE.md`（僅允許極小 ledger sync ≤5 行）
- ❌ 不重做已完成項目（見 §M）
- ❌ 不啟動 reverse UTM deploy / pm-26 deploy gate
- ❌ 不對 Phase 1 final 宣告做任何降級或重新封存
- ❌ 不啟動 P3 草稿 content landing（須獨立 phase + user approval）
- ❌ 不對 ai-tools-simplify-daily-workflow 執行 live repost
- ❌ 不對 GA4 後台執行任何 dimension / event 新增
- ❌ 不對 AdSense 後台執行任何 ad unit / slot 新增
- ❌ 不把 VIEW count 增加 / data-ad-status filled 詮釋為流量 / 真實收益 / AdSense policy approval

---

## M. 不應重做的已完成項目

### M.1 Phase 1 final 範圍

| 項目 | 來源 |
|---|---|
| CLAUDE.md §28 17 條 MVP 必做 | `docs/phase-1-completion-checklist.md` §3 |
| Phase 0 ~ 9 主軸全 ✅ | `docs/phase-1-completion-report.md` §5 / §7 |
| 6/6 article block parity | `docs/phase-9h-completion-report.md` §4 |
| Phase 8-h legacy 退場 15/15 | `docs/phase-8h-completion-report.md` |
| Phase 9-g relatedLinks / otherLinks 全套 | `docs/phase-9g-completion-report.md` |
| Phase 9-g-g JSON-LD isPartOf + mentions | `docs/phase-9g-g-completion-report.md` |
| Phase 9-f-g Book mainEntity JSON-LD | `docs/phase-9f-g-completion-report.md` |
| Phase 9-i known blockers 3/3 | `docs/phase-9h-known-blockers.md` §7.1 |
| Phase 9-j JSON-LD landing verification | `docs/phase-9j-jsonld-landing-verification.md` |
| we-media-myself2 端對端 PASS | `docs/phase-1-completion-report.md` §3.4 |
| dist/sitemap.xml + dist/robots.txt 補檔（Phase 9-g-g-c）| `docs/phase-1-completion-report.md` §8.9 |

### M.2 Phase 1 final 後 post-Phase-1 已完成項目

| 項目 | 大致時間 / 來源 |
|---|---|
| Reverse UTM Blogger→GitHub **source** landing（pm-24a/b/c） | 2026-05-23；source landed but un-deployed（live dormant） |
| AdSense N7 resolver + N8 article-block + anchor wiring + 14 v1 anchors + N8 default blocks | 2026-06-11；CLAUDE.md ledger night-1 → am-9 |
| AdSense N9e GitHub Pages article ads LIVE + deploy | 2026-06-11；commits `3e1f4e3` → gh-pages `c15e514` |
| AdSense N9f resolver guard update（case 21 post-N9e invariant） | 2026-06-11；commit `e955f19` |
| Blogger AdSense Phase B/C/D（dual-block；we-media-myself2 single-post live） | 2026-06-11 pm-8 → night-1；live PASS |
| Blogger AdSense output guard `check:blogger-adsense-output` | landed + 6-target expansion；85/0 |
| Blogger AdSense Batch 0+1 6 篇 live PASS | 2026-06-11 night-1 → 2026-06-12 pm-17（6 篇）|
| Commerce links L1 seed 10 active + R1 resolver + R2 smoke + R3 we-media migration | 2026-06-10 |
| Commerce pm-12 Blogger affiliate.blocks[] renderer wiring + pm-13 dual-block content | 2026-06-10 |
| GA4 P1 article_bottom_nav custom dimensions 註冊 + report-verified | 2026-06-15 17:35 |
| ADMIN dev-mode-only read-only 後台全套（per ADMIN checkpoint §J） | 2026-06-15 → 2026-06-16 |
| Posts table `<td>` closure source fix + acceptance | 2026-06-16 pm-11 / pm-12 |
| Validation reporter（`report:validation`）+ smoke + detail-panel consume + footnote + system-checks line sync | 2026-06-16 pm-16 → pm-21 |
| ADMIN R1 detail panel collapsible sections（4 低頻區段） + browser PASS | 2026-06-16 pm-23 → pm-25 |
| ADMIN stage progress checkpoint（idle freeze） | 2026-06-16 night-1（HEAD `2de35e9`） |

→ 上述項目**任一**不得在後續 session 被重新「實作 / 重做 / 重新規劃」；若收到看似要求重做之指令，請停止並回報，不要猜。

---

## N. Exit / handoff note

- BLOG 系統第一階段 = **final / completion snapshot 已宣告**（per `docs/phase-1-completion-report.md` 2026-05-18）
- Phase 1 final 後逐步擴張之 post-Phase-1 能力（AdSense / commerce / Blogger AdSense Batch / GA4 P1 / reverse UTM source / ADMIN read-only 後台）= **皆不阻擋 Phase 1 final，亦不改變宣告**
- ADMIN 線 = idle freeze（per `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md`）
- 下次 session cold-start 建議：
  - 先 baseline verify（branch=main / HEAD==origin/main / ahead-behind 0/0 / clean）
  - 確認 latest commit 仍為本 phase 之 docs-only commit（或其後 docs-only 後繼）
  - 讀本文件 §C / §D（已完成 / 尚未完成）+ §J（保守）+ §K（候選）
  - 不重做 §M 任一項
- 接續可能方向：
  - 保守 = §J idle freeze handoff confirmation
  - 內容線 = §K.1 P3 草稿審稿 / 落地
  - 流量線 = §K.2 Batch 2 P2 live repost + verification
  - 觀察線 = §K.3 AdSense dashboard observation record / §K.4 GA4 P2/P3 dimension expansion preanalysis
  - 跨站 attribution 線 = §K.5 reverse UTM positive fixture 設計 preanalysis
- 紅線：任何 source / settings / build / deploy / Blogger / GA4 / AdSense 後台動作 → 須獨立 phase + user explicit approval

---

## O. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `2de35e9` / 0/0 / clean |
| 唯一 file change | `docs/20260616-night-blog-phase1-mainline-readiness-and-next-action-map.md`（新增）+ `CLAUDE.md` 極小 ledger sync |
| 未碰 src / views / scripts / content / settings / package / dist / gh-pages / `.cache` | ✅ |
| 未重做 §M 任一已完成項目 | ✅ |
| 未啟動 K.1–K.5 任一候選 phase | ✅ |
| 未啟動 FB sidecar write / Reverse UTM deploy / Blogger repost / GA4 / AdSense 後台 mutation | ✅ |
| 未 npm install / build / deploy / merge / rebase / reset / amend / force push | ✅ |
| 未壓縮 / 重排 CLAUDE.md（僅 ledger 極小 sync） | ✅ |
| 未對 Phase 1 final 宣告做任何降級或重新封存 | ✅ |

→ docs-only checkpoint，read-only acceptance trivially PASS。

---

（本文件結束）
