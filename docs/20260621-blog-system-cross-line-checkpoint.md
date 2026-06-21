# BLOG system cross-line checkpoint（docs-only）

- **Phase**：`20260621-blog-system-cross-line-checkpoint-update-docs-only-a`
- **Date**：2026-06-21（Asia/Taipei；morning, 07:58+）
- **Type**：**docs-only checkpoint**（唯一 mutation = 本檔新增；CLAUDE.md / MEMORY.md / source / settings / content / build / dist 皆不動）
- **Verdict**：**SNAPSHOT ONLY — no backend / source / settings / content changes**
- **Baseline**：`main` HEAD == origin/main == `0816044`（subject `docs(ga4): add d4 registration packet`）；ahead/behind = 0/0；working tree clean。
- **Predecessor checkpoint**：`docs/20260617-night-project-status-and-next-paths-checkpoint.md`（at HEAD `746ed71`；相距 9 commits）
- **Scope flag**：**不**改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md；**不** build / 不 deploy / 不 dev / 不 Blogger repost / 不 admin write / 不 safe-write:test / 不 --apply / 不 dryRun:false / 不打 GA4 / AdSense / Blogger / Google Drive / Search Console 後台。

---

## 1. Purpose

| 項 | 值 |
| --- | --- |
| 本檔屬性 | **2026-06-21 cross-line checkpoint snapshot**（補充 / 取代 2026-06-17 之前 checkpoint 之最新視圖） |
| 本檔不屬性 | ❌ 不是 implementation phase；不重開任何已關閉項目 |
| 本檔不屬性 | ❌ 不是 evidence record（不為 E1 / E2 / P3 metadata backfill / live verification 收集 evidence） |
| 本檔不屬性 | ❌ 不是 Phase 1 final 重新宣告 / 降級 / 重新封存 |
| 本檔不屬性 | ❌ 不是 source / backend 改動之入口；不啟動任何 build / deploy / dev server |
| 適用對象 | Dean（決策入口；後續 phase 選擇之參考） |
| 適用時機 | Dean 想知道「目前各條線到哪、blocked 矩陣、下一步可做什麼」之單一視圖 |

本 checkpoint 目的 = **單檔讀懂目前狀態**；不取代 §5 各候選 phase 各自之 preanalysis / preflight。

---

## 2. Frozen baseline

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `0816044` |
| origin/main | `0816044` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean（`git status --short` 為空） |
| latest subject | `docs(ga4): add d4 registration packet` |

本 checkpoint **基於上述 frozen baseline**。本輪未跑 `npm run validate:content`（per CLAUDE.md §3a carry-forward；無 regression 風險，因不動 source / content / settings）。CLAUDE.md §3a 之 validation baseline 表 carry-forward：

| 指令 | 結果（carry-forward） |
| --- | --- |
| `npm run validate:content` | 0 errors / 94 warnings / 84 issue-posts |
| overlay variant | 0 / 101 / 85 |
| `check:adsense-resolver` | 34 / 0 |
| `check:adsense-article-block` | 13 / 0 |
| `check:adsense-anchor-wiring` | 14 / 0 |
| `check:blogger-adsense-output` | 85 / 0（6 targets） |
| `check-commerce-affiliate-resolver` | 23 / 0 |
| `check:admin-governance-aggregation` | 16 / 0 |
| `report:validation` | 0 / 94 / 84 |
| `check:validation-report` | 14 / 0 |
| `check:admin-validation-consume` | 12 / 0 |

production-post warnings = 0；94 warnings 全來自 `content/validation-fixtures/`。

---

## 3. Closed / accepted items（截至 HEAD `0816044`）

### 3.1 GA4 D-series（最近一輪重點）

| # | 項目 | 證據 commit | 狀態 |
| --- | --- | --- | --- |
| GA-1 | GA4 P2/P3 dimension expansion preanalysis（pre-D；docs-only） | `e95950e` `docs(ga4): preanalysis dimension expansion` | ✅ closed |
| GA-2 | GA4 D1 parameter naming spec | `4c799a5` `docs(ga4): specify parameter naming` | ✅ closed（single-source naming；本檔不重述） |
| GA-3 | GA4 D4 first-batch registration checklist（docs-only） | `a39d51c` `docs(ga4): add d4 registration checklist` | ✅ closed |
| GA-4 | GA4 P2/P3 dimension expansion continuation preanalysis | `260d407` `docs(ga4): plan p2 p3 dimension expansion` | ✅ closed |
| GA-5 | GA4 D4 manual registration packet（docs-only；packet for Dean） | `0816044` `docs(ga4): add d4 registration packet` | ✅ closed at current HEAD |

→ GA4 D-series 至本 checkpoint 為止已完成「pre-D → D1 spec → D4 checklist → P2/P3 continuation preanalysis → D4 packet」5 個 docs-only 階段；**全部**屬 docs-only；**全部**未 register dimension；**全部**未打 GA4 後台。

### 3.2 ADMIN K / R series（K7 → K8 → K9 + R4）

| # | 項目 | 證據 commit | 狀態 |
| --- | --- | --- | --- |
| AD-K7-a | K7 copy buttons static payload preview 切片 preflight | `d9d2fc7` `docs(admin): record static payload preview preflight` | ✅ closed |
| AD-K7-b | K7 copy buttons source（clipboard-only；no write path） | `efaa774` `feat(admin): add static payload preview copy buttons` | ✅ closed |
| AD-K7-c | K7 copy buttons acceptance record | `7dcb0b4` `docs(admin): record k7 copy buttons acceptance` | ✅ closed |
| AD-K7-d | K7 copy buttons browser PASS record | `c443d31` `docs(admin): record k7 copy buttons browser pass` | ✅ closed（user-evidence；Dean 本機 2026-06-18 10:48–11:04） |
| AD-K7-e | K7 evidence source note | `99e69d5` `docs(admin): note k7 browser-pass evidence source` | ✅ closed |
| AD-K8-a | K8 field auto-switch / auto-follow source（dry-run compute；preview-only；no write path） | `0a89983` `feat(admin): auto-follow payload preview field` | ✅ closed |
| AD-K8-b | K8 browser PASS record | `d311108` `docs(admin): record k8 browser pass` | ✅ closed（user-evidence；Dean 本機 2026-06-18 12:11） |
| AD-K9 | K9 multi-click determinism smoke browser PASS（docs-only；no source change） | `50b1536` `docs(admin): record k9 browser pass` | ✅ closed（user-evidence；Dean 本機 2026-06-18 17:50） |
| AD-R4 | R4 Categories / Tags collapsible split browser PASS | `docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md`（per CLAUDE.md §3a snapshot；carry-forward） | ✅ closed |

→ ADMIN K7 / K8 / K9 / R4 全 closed。Apply 仍 disabled；middleware / API / `admin-write-cli` / `--apply` / `dryRun:false` 全維持 dormant。

### 3.3 Blogger / P3 line（carry-forward；本 checkpoint 不重述全部歷史）

| # | 項目 | 證據 | 狀態 |
| --- | --- | --- | --- |
| BL-1 | `we-media-myself2` 首篇真實 ready Blogger post live verified | `docs/phase-1-completion-report.md`（Phase 1 final；history-frozen） | ✅ pre-Phase-1 final |
| BL-2 | Blogger AdSense Batch 1 minimum completion（6 篇 `articleAd6` / `beforeRelatedLinks` live PASS） | `docs/20260612-blogger-adsense-batch-*` + guard `check:blogger-adsense-output` 85/0 | ✅ live verified |
| BL-3 | P3 `blog-restart-steady-rhythm-notes` content landed | per CLAUDE.md §3a snapshot；`content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | ✅ landed |
| BL-4 | P3 generated HTML verification | `docs/20260617-blogger-p3-generated-html-verification-record.md`（articleAd6×1；0 EJS leak；guard 85-0 no-regression） | ✅ PASS |
| BL-5 | P3 live published（Dean 手動發布全新 Blogger 文章） | live URL `https://babel-lab.blogspot.com/2026/06/blog-restart-steady-rhythm-notes.html`；publishedAt approx 2026-06-17 ~12:14 台灣時間（Dean 截圖佐證） | ✅ Dean-evidence-based |
| BL-6 | P3 user-evidence live verification record | `docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md` | ✅ user-evidence PASS |
| BL-7 | P3 metadata backfill preflight（docs-only；不回填） | `9a0f9f6` `docs(blogger): preflight p3 metadata backfill` | ✅ preflight closed；backfill 本身仍 PENDING（per §4 P3-1） |

### 3.4 GitHub Pages / Phase 1（high-level；carry-forward）

| # | 項目 | 狀態 |
| --- | --- | --- |
| GH-1 | GitHub Pages live baseline；最近 deploy = N9e（2026-06-11） | ✅ live |
| GH-2 | sitemap + robots + JSON-LD（BlogPosting / WebSite / isPartOf / mentions / Book mainEntity 兩端 landed） | ✅ |
| GH-3 | 6/6 conditional article block parity（Blogger ↔ GitHub Pages） | ✅ |
| GH-4 | GA4 P1 article_bottom_nav report-verified（2026-06-15 17:35） | ✅ |
| GH-5 | Phase 1 final 宣告（2026-05-18） | ✅ history-frozen；本 checkpoint 不改寫不降級 |
| GH-6 | BLOG Phase 1 functionally complete | ✅ per `docs/20260617-blog-phase1-closure-checkpoint.md` |

### 3.5 Commerce / AdSense / GA4 LIVE / ADMIN（high-level；carry-forward；本 checkpoint 不重寫歷史）

詳：CLAUDE.md §3a current state snapshot + `docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md` §5–§10。摘要：

- Commerce links L1 seed 10 active（通路王）+ resolver + smoke 23/0；we-media dual-block content landed
- Blogger AdSense Batch 1 minimum completion；guard 85/0 no-regression
- GitHub Pages article ads（N9e）LIVE since 2026-06-11
- GA4 production LIVE since 2026-05-21；measurementId masked tail4 `…PF8VD`；4-AND gating；P1 5 dimensions registered；2026-06-15 P1 報表 PASS
- ADMIN dev-mode-only read-only dashboard 全套（含 R3 / R4 / SEO Dry-run 收合 / validator warning badge / state filter / static payload preview / K7 copy buttons / K8 auto-follow field / K9 multi-click smoke）

---

## 4. Blocked / dormant / red-line matrix

| Item | Line | Status | Blocker | What Dean must provide, if any | Next allowable phase |
| --- | --- | --- | --- | --- | --- |
| **E1** GA4 D4 first-batch registration evidence record | GA4 | 🔴 BLOCKED | Dean 尚未手動於 GA4 後台註冊 4 個 Event-scoped dimensions（`link_type` / `provider` / `placement` / `link_label`） | (a) GA4 後台 Custom dimensions tab 列表截圖（masked tail4 only），顯示 4 個 dimensions；(b) per-dimension Admin 頁面截圖；(c) Realtime 30 分內事件 param 值截圖（新點擊後）；(d) Explore Free-form dimension dropdown 截圖 | `docs/2026XXXX-ga4-d4-first-batch-evidence-record.md`（docs-only） |
| **E2** P2/P3 live GA4 observation record | GA4 | 🔴 BLOCKED | E1 PASS + ≥ 7d / 30d 資料累積期 | GA4 Reports → Engagement / Realtime / Explore 截圖（P2 `ai-tools-simplify-daily-workflow` + P3 `blog-restart-steady-rhythm-notes` 之 page_view / click_other_link + article_bottom_nav 雙條件 / click_affiliate_cta 30d aggregate） | `docs/2026XXXX-ga4-p2-p3-live-observation-record.md`（docs-only） |
| **E3** D2 source-level event parameter preflight | GA4 / Source | ⏸ OPTIONAL ONLY | E2 結論為「ROI 不足」+ Dean explicit approval | E1 + E2 已 land 之後之 ROI 評估結論 | `docs/2026XXXX-ga4-d2-pages-source-preflight.md`（docs-only preflight；不實作） |
| **P3 metadata backfill** | Blogger | 🔴 BLOCKED | Dean 尚未提供 Blogger 後台 evidence；猜測會違反 CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3 / §5.4 | (a) `bloggerPostId`（19 位數字；來源 Blogger 編輯頁 URL `postID=...`）；(b) precise `publishedAt`（ISO 8601 含時區，如 `2026-06-17T12:14:00+08:00`）；(c) optional：Blogger 編輯頁截圖 | content-edit-only phase（新建 `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json`；per `docs/20260617-night-blogger-p3-metadata-backfill-preflight.md` §5） |
| **P2 live repost** `ai-tools-simplify-daily-workflow` | Blogger / AdSense | 🔴 BLOCKED | Dean packet inputs 未完成；尚未手動重貼 Blogger 後台 | (a) Blogger 後台備份；(b) theme CSS readiness 確認；(c) 重貼步驟執行；(d) live verification 截圖；(e) Dean explicit approval | live verification record docs-only phase（Dean 提供截圖後啟動） |
| **Reverse UTM** Blogger → GitHub Pages deploy（pm-26 gate） | Blogger / GA4 | 🔴 BLOCKED dormant | Source landed un-deployed（pm-24a/b/c；2026-05-23；commits `7e1d356` / `e2309e9` / `7c769fe`）；live dormant | (a) positive GitHub cross-link fixture；(b) Dean 手動重貼 Blogger；(c) GA4 Realtime 驗收 | positive fixture preanalysis docs-only（D.3）；deploy gate 仍維持 |
| **Admin write path**（Apply / middleware / `admin-write-cli` / `--apply` / `dryRun:false` / payload file write） | ADMIN | ⏸ DORMANT | CLAUDE.md §3a Red lines；各須獨立 phase + Dean explicit approval | Dean explicit approval per item | 獨立 phase；不在本 checkpoint 推薦 |
| **FB sidecar 真實寫入** | FB sidecar | ⏸ DORMANT | `docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項 preflight 未完成；Apply 永久 disabled | 8 項 preflight checklist 全 satisfied | 8 項 preflight 確認 phase；目前 dormant |
| **Commerce L2+ candidates** | Commerce | 🔴 BLOCKED | 無 user-provided YAML | Dean 提供 candidate YAML + explicit approval（per `docs/20260608-commerce-l1-seed-candidate-intake-template.md`） | L2 intake content-edit phase（須 Dean 提供 candidates） |
| **Commerce C7 / C9 broader expansion** | Commerce | ❌ NOT implemented | 須獨立 phase | 需求釐清 | 獨立 phase；本 checkpoint 不推薦 |
| **Download production migration** | Download | ⏸ deferred | empty registry；R-rules + R5b validator landed；無 Dean approval 啟動 migration | (a) `download-assets.json` / `download-forms.json` candidates；(b) Dean approval | content-edit phase；本 checkpoint 不推薦 |
| **Custom domain 啟用** | Other | ⏸ deferred | 不阻擋 Phase 1 final；前置 docs 已備（`docs/custom-domain-root-files-strategy.md`） | (a) 域名購買；(b) DNS 設定；(c) CNAME 設定 | Custom domain readiness preanalysis docs-only（D.2） |
| **Browser / live-source independent verification** | Blogger | 🔴 BLOCKED | 須獨立 phase；Claude 端尚未做過；live URL 已有但無 fetch 行動；fetch 政策待釐清 | (a) 對 fetch live HTML 之政策（per CLAUDE.md §3a Red lines 不含 live public HTML，但須 Dean 確認）；(b) Dean explicit approval | live-source verification preanalysis docs-only |
| **AdSense / commerce real id emit** | AdSense / Commerce | ❌ RED-LINE 永禁 | CLAUDE.md §3a Red lines | n/a | 不啟動 |
| **完整 `measurementId` / AdSense client / slot 寫入 docs / `MEMORY.md` / ledger** | GA4 / AdSense | ❌ RED-LINE 永禁 | per D1 §7 / D4 §6.5 / CLAUDE.md §3a Red lines | n/a | 不啟動 |
| **Blogger `postId` / `publishedAt` 猜測** | Blogger | ❌ RED-LINE 永禁 | CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3 / §5.4 | n/a；須等 Dean 後台 evidence | 不啟動（除非 Dean evidence） |
| **GA4 Admin API / Reporting API 連線** | GA4 | ❌ RED-LINE 永禁 | 本 repo 永禁；per D1 §9 / D4 §6.5 | n/a | 不啟動 |
| **Blogger API / Google Drive API / FB Graph API** | Backend | ❌ RED-LINE 永禁 | CLAUDE.md §29 第一版永禁 | n/a | 不啟動 |
| **留言 / View 數 / Like / 會員 / 資料庫後端 / 真正後台登入 / 視覺化編輯器** | Backend | ❌ RED-LINE 永禁 | CLAUDE.md §29 第一版永禁 | n/a | 不啟動 |
| **affiliate credentials / token / dashboard 統計 / Forms responses 寫入 repo** | Commerce / Download | ❌ RED-LINE 永禁 | CLAUDE.md §3a Red lines | n/a | 不啟動 |
| **Phase 1 final 之降級 / 重新封存** | Phase 1 | ❌ RED-LINE 永禁 | CLAUDE.md §3a Core operating rules | n/a | 不啟動 |
| **重開 K7 / K8 / K9 / R4** | ADMIN | ❌ 不重開 | 全已 closed + browser-PASS + user-evidence | n/a | 不啟動 |

---

## 5. Candidate next paths

各 path **須 Dean explicit approval 才啟動**；Claude 端**不自動執行**。

### 5.1 E1：GA4 D4 first-batch registration evidence record（docs-only）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-ga4-d4-first-batch-evidence-record-docs-only-a` |
| Type | docs-only evidence record |
| Risk | low |
| Blocker | 🔴 Dean 須先 (a) 手動 GA4 後台註冊 4 個 Event-scoped dimensions；(b) 重新點擊 GitHub Pages article 之 4 個 anchor classes；(c) 提供 §4 E1 之 evidence |
| Dean approval needed? | ✅ 是（須先 evidence；evidence 本身即包含 Dean 後台動作） |
| Why / why not now | ❌ 本 checkpoint 時點**不**推薦立即啟動；E1 之啟動先決條件為 Dean evidence；若 Dean 尚未進行後台註冊，E1 record 仍視為 BLOCKED |

### 5.2 P3 metadata backfill（content-edit-only）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-blogger-p3-metadata-backfill-content-edit-a` |
| Type | content edit（新建 `.publish.json` sidecar；不改 `.md` frontmatter） |
| Risk | low |
| Blocker | 🔴 Dean 須提供 `bloggerPostId` + precise `publishedAt`（ISO 8601 含時區） |
| Dean approval needed? | ✅ 是 |
| Why / why not now | ❌ 本 checkpoint 時點**不**推薦立即啟動；猜測會違反 `docs/publish-json-schema.md` §5.4 source-of-truth；preflight 已 land（`docs/20260617-night-blogger-p3-metadata-backfill-preflight.md`） |

### 5.3 P2 Blogger repost packet / verification（docs-only）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-blogger-p2-ai-workflow-live-verification-record-docs-only-a` |
| Type | docs-only evidence record |
| Risk | low |
| Blocker | 🔴 Dean 須先 (a) 完成 packet inputs；(b) 手動重貼 Blogger；(c) 提供 live verification 截圖；(d) explicit approval |
| Dean approval needed? | ✅ 是 |
| Why / why not now | ❌ 本 checkpoint 時點**不**推薦立即啟動；live repost 屬 Dean 後台動作；Claude 端無法在無 evidence 下推進 |

### 5.4 Admin UI / readability next-slice preflight（docs-only preflight）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-admin-ui-readability-next-slice-preflight-docs-only-a` |
| Type | docs-only preflight（不 implement；定義下一個 R-series / K-series 切片之範圍 / 風險 / acceptance） |
| Risk | low |
| Blocker | 無外部 evidence 阻擋；本身可立即啟動 |
| Dean approval needed? | ✅ 是（任何 admin 後續切片皆須獨立 phase + Dean approval） |
| Why / why not now | ⚠️ 候選；但 ADMIN stage 目前為 idle freeze（CLAUDE.md §3a 明示「ADMIN 線目前 idle freeze。後續 session 不主動推進」）；建議由 Dean 主動點名 |

### 5.5 Reverse UTM positive fixture preanalysis（docs-only）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-blogger-reverse-utm-positive-fixture-preanalysis-docs-only-a` |
| Type | docs-only preanalysis（pm-26 deploy gate 不解除；定義 positive fixture 內容 + 採集步驟） |
| Risk | low |
| Blocker | 無外部 evidence 阻擋（preanalysis 本身）；pm-26 deploy 仍 BLOCKED；不 deploy / 不重貼 Blogger / 不解除 gate |
| Dean approval needed? | ✅ 是 |
| Why / why not now | ⚠️ 候選；可立即啟動；但價值偏低（reverse UTM live deploy 仍 dormant；fixture preanalysis 之 ROI 在 Dean 決定推進 deploy 之前不高） |

### 5.6 Custom domain readiness preanalysis（docs-only）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-github-pages-custom-domain-readiness-preanalysis-docs-only-a` |
| Type | docs-only preanalysis（不啟用；只把 `docs/custom-domain-root-files-strategy.md` 已備項目整理為 checklist） |
| Risk | low |
| Blocker | 無外部 evidence 阻擋（preanalysis 本身）；不購域名 / 不設 DNS / 不改 CNAME |
| Dean approval needed? | ✅ 是 |
| Why / why not now | ⚠️ 候選；可立即啟動；屬 future setup；不阻擋任何 closed item |

### 5.7 Idle freeze（noop）

| 項 | 值 |
| --- | --- |
| Suggested phase name | `2026XXXX-blog-system-cross-line-idle-freeze-noop-a` |
| Type | docs-only（純宣告 idle freeze；最小落地） |
| Risk | low |
| Blocker | 無 |
| Dean approval needed? | 不需要進一步動作即可進入 idle |
| Why / why not now | ✅ 預設可進入；當所有有價值候選皆 blocked 或屬「等 Dean 主動點名」時，idle 為最保守選擇 |

### 5.8 候選優先序總覽

| 候選 | 是否 blocked by Dean evidence | 立即可啟動 | 建議 |
| --- | --- | --- | --- |
| E1 | ✅ 是 | ❌ 否 | 等 Dean evidence |
| P3 metadata backfill | ✅ 是 | ❌ 否 | 等 Dean evidence |
| P2 live verification | ✅ 是 | ❌ 否 | 等 Dean evidence |
| Admin UI next-slice preflight | ❌ 否 | ⚠️ 可，但 stage idle | 等 Dean 主動點名 |
| Reverse UTM positive fixture preanalysis | ❌ 否 | ⚠️ 可，但 ROI 偏低 | 等 Dean 啟動 deploy 意願 |
| Custom domain readiness preanalysis | ❌ 否 | ⚠️ 可，但屬 future setup | 等 Dean 啟動 custom domain 意願 |
| Idle freeze | n/a | ✅ 是 | 預設 |

---

## 6. Recommended next action

**建議下一輪採 idle freeze（§5.7）。**

理由：

1. 受 Dean evidence 阻擋之高價值候選（E1 / P3 metadata backfill / P2 live verification）皆**不**可在無 Dean evidence 下啟動；E1 立即啟動會違反 §4 之 BLOCKED 約束。
2. 不受 Dean evidence 阻擋之候選（Admin next-slice preflight / Reverse UTM positive fixture / Custom domain readiness）**全屬「等 Dean 主動點名」**：
   - Admin stage 目前明示為 idle freeze（CLAUDE.md §3a「ADMIN 線目前 idle freeze。後續 session 不主動推進」）；
   - Reverse UTM positive fixture preanalysis 之 ROI 在 Dean 未啟動 deploy 意願前偏低；
   - Custom domain readiness preanalysis 屬 future setup，不阻擋 Phase 1 final。
3. 本 checkpoint 本身已完成「目前狀態單一視圖」之核心價值；Dean 可從本檔讀懂 closed / blocked / candidate 矩陣後再點名下一個切片。
4. 對齊 prompt 之第 6 條原則：「如果所有有價值項目都 blocked，推薦 idle freeze」。

**若 Dean 已有 evidence 想推進**：建議優先序 = **E1（GA4 evidence record）** → **P3 metadata backfill** → **P2 live verification**。三者皆 low risk + docs-only / content-edit-only + 無 build / deploy。

**若 Dean 想推進不依賴 evidence 之 preflight**：建議優先序 = **Admin UI next-slice preflight**（須 Dean 先點名要做哪一個切片）→ **Custom domain readiness preanalysis** → **Reverse UTM positive fixture preanalysis**。

**禁止自動執行（重申）**：build / deploy / Blogger repost / Admin Apply / middleware / `admin-write-cli` / `--apply` / `dryRun:false` / dev server / Blogger / GA4 / AdSense / Google Drive / Search Console / GitHub Pages 後台 / Phase 1 重做 / ADMIN R2+ / write path / FB sidecar 真實寫入 / reverse UTM deploy / npm install / 動 dependency / merge / rebase / reset / amend / force-push / 把巨型 ledger 又寫回 CLAUDE.md。

---

## 7. Explicit non-actions（本 checkpoint）

本 phase 之 **唯一 mutation = 本檔新增**。本 phase **未**：

| 類 | 範圍 |
| --- | --- |
| Source change | `src/views/` / `src/scripts/` / `src/js/` / `src/styles/` 全未動 |
| Content change | `content/settings/` / `content/github/` / `content/blogger/` / `content/templates/` / `content/drafts/` / `content/archive/` / `content/validation-fixtures/` 全未動 |
| Settings / package change | `content/settings/ga4.config.json` / `ads.config.json` / `affiliate-networks.json` / `commerce-links.json` / `promotion.config.json` / `download-assets.json` / `download-forms.json` / `package.json` / lockfile / `vite.config.js` 全未動 |
| Validation / build / deploy / dev server | `npm run validate:content` / `check:*` guards / `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `npm run preview` / dev server 全未跑 |
| Blogger repost | Blogger 後台未登入；未重貼；未動 P2 / P3 / 既有 6 篇 |
| GA4 / AdSense / Blogger backend operation | GA4 / AdSense / Blogger / Google Drive / Search Console / GitHub Pages 後台未登入；未操作；未打 GA4 Admin / Reporting API |
| Admin write | Admin Apply / middleware / API / `admin-write-cli` / `safe-write:test` / `--apply` / `dryRun:false` / payload file write 全未啟動 |
| CLAUDE.md / MEMORY.md change | CLAUDE.md / MEMORY.md / `memory/` / `docs/README.md` 全未動 |
| Evidence fabrication | 未為 E1 / E2 / P3 / P2 / reverse UTM 建立 evidence；未推導 / 未猜測 / 未填 Blogger `postId` / `publishedAt` |
| Live verification claim | 未 claim live verification；本檔對 BL-5 / BL-6 / GH-1 / GH-4 之引用皆 carry-forward 自既有 docs，**不**為任何新 live 行為背書 |
| Git destructive operation | npm install / amend / rebase / merge / cherry-pick / force-push / `--no-verify` / `--no-gpg-sign` 全未做 |
| K7 / K8 / K9 / R4 重開 | 未重開；全 carry-forward closed |
| E2 / E3 啟動 | 未啟動；E3 維持 OPTIONAL ONLY |
| Phase 1 final 重做 / 降級 / 重新封存 | 未做 |

---

## 8. Acceptance criteria

### 8.1 PASS 條件

1. baseline verify observed 與 phase prompt §Baseline verify 一致（HEAD = origin/main = `0816044`；clean；0/0）
2. 本檔（`docs/20260621-blog-system-cross-line-checkpoint.md`）新增成功
3. 內容涵蓋 prompt §1–§8 所要求之 8 個 section
4. baseline / closed / blocked / candidate next paths 清楚可讀
5. E1 / E2 / E3 之 blocked / optional 狀態**不**被改寫
6. K7 / K8 / K9 / R4 **不**被重開
7. 無 source / content / settings / package / build / deploy / backend / admin-write mutation
8. commit + push 成功；post-push working tree clean；ahead/behind = 0/0
9. 本檔 land 後 working tree 回到 clean（除本檔新增以外無 untracked）

### 8.2 FAIL 條件

任一發生 → FAIL：

- baseline verify 不符 → 立即停止；不修正；不 commit
- 本檔誤觸 `src/` / `content/` / `settings/` / `package.json` / lockfile / dist
- 本檔含完整 `measurementId`（非 masked tail4）/ AdSense 真實 client / slot / affiliate token / Forms responses / 猜測之 Blogger `postId` / `publishedAt`
- 本檔誤建議「立即啟動 E1 / E2 / E3 / P3 metadata backfill / P2 live repost」（per §6 應建議 idle freeze 或等 Dean evidence）
- 本檔重開 K7 / K8 / K9 / R4
- 本檔取代 Phase 1 final 宣告 / 降級 / 重新封存
- 本檔建立 evidence record（屬 E1 phase；本 phase 不啟動）
- 本檔 claim live verification（本檔不 fetch live URL；不打 backend）
- 本檔改 CLAUDE.md / MEMORY.md

---

## 9. Cross-links

- `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（前一輪 cross-line checkpoint；at HEAD `746ed71`；本檔為其後續視圖）
- `docs/20260621-ga4-d4-first-batch-manual-registration-packet.md`（D4 packet；at HEAD `0816044`；本 checkpoint baseline）
- `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md`（P2/P3 continuation preanalysis；at `260d407`）
- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md`（D4 checklist；at `a39d51c`）
- `docs/20260617-night-ga4-d1-parameter-naming-spec.md`（D1 naming spec；at `4c799a5`）
- `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md`（pre-D preanalysis；at `e95950e`）
- `docs/20260617-night-blogger-p3-metadata-backfill-preflight.md`（P3 metadata backfill preflight；at `9a0f9f6`）
- `docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`（P3 user-evidence live verification）
- `docs/20260617-blogger-p3-generated-html-verification-record.md`（P3 generated HTML verification）
- `docs/20260617-admin-categories-tags-collapsible-split-browser-pass-record.md`（R4 browser PASS）
- `docs/20260618-am-admin-k7-copy-buttons-acceptance-record.md`（K7 acceptance；at `7dcb0b4`）
- `docs/20260618-am-admin-k7-copy-buttons-browser-pass-record.md`（K7 browser PASS；at `c443d31`）
- `docs/20260618-admin-k8-field-auto-switch-browser-pass-record.md`（K8 browser PASS；at `d311108`）
- `docs/20260618-admin-k9-multiclick-determinism-browser-pass-record.md`（K9 browser PASS；at `50b1536`）
- `docs/phase-1-completion-report.md`（2026-05-18 Phase 1 final；history-frozen）
- `docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md`（完整 current state + pointer 索引）
- `docs/publish-json-schema.md` §5（Blogger `.publish.json` 區塊 schema；P3 metadata backfill 之 source-of-truth）
- `docs/fb-sidecar-write-preflight-decision.md`（FB sidecar 8 項 preflight；dormant）
- CLAUDE.md §3a Core operating rules / §3a Red lines / §24 / §28 / §29 / §30

---

（本文件結束）
