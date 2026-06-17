# BLOG 第一階段收尾狀態與路線圖（docs-only status map）

> Phase: `20260617-am-blog-phase1-wrapup-reentry-status-map-docs-only-a`
> Date: 2026-06-17 11:23+
> Type: docs-only checkpoint（不實作 source；不 build；不 deploy；不重貼 Blogger；不開 AdSense / GA4 後台；僅新增本 docs + 必要時 CLAUDE.md 極小 ledger pointer sync）
> Scope: BLOG 第一階段收尾 re-entry。承接 `docs/20260616-night-blog-phase1-mainline-readiness-and-next-action-map.md`（仍為完整 reference）；本文件以 Dean 決策視角重整為「收尾路線圖」——把待收尾項目分成 A–E 五線，逐項標 current status / risk / 是否需 source / 是否需 build·deploy / 是否需 Dean 手動，最後給 recommended next 3 phases。

---

## 0. Baseline anchor

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `d0183fe` |
| origin/main | `d0183fe` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(admin): record r3 browser pass` |

→ Baseline 完全符合 expected。未 pull / merge / reset / rebase / amend / force-push。

---

## 1. 今日 ADMIN readability line 已收線（本 checkpoint 不重開）

今日（2026-06-17 上午）ADMIN readability 系列已逐項收線並各自 browser human-eye PASS：

- SEO Dry-run 收合（`20260617-admin-seo-dryrun-collapse-browser-pass-record`）
- Validator warning badge + state filter chip（`...validator-warning-badge` / `...validator-state-filter` browser pass）
- Categories / Tags collapsible split（`...categories-tags-collapsible-split-browser-pass-record`）
- R3 health legend + missing fields dedup（commit `63057af` → browser PASS `d0183fe`）

**狀態：今日 ADMIN readability line CLOSED。**

本 checkpoint **明確不重開 ADMIN 線**：

- ❌ 不碰 ADMIN readability source（`src/views/admin/`）
- ❌ 不推進 R2（頁首 overview 整併）/ R5（nav 對齊 + inline-style 收斂）—— 兩者維持 deferred until explicit approval
- ❌ 不推進 write path / Apply / Save / Auto-fix / per-post prescription / loader aggregation migration
- ADMIN 整線維持 **idle freeze**（per `docs/20260616-night-admin-stage-progress-checkpoint-and-next-action-map.md`）

ADMIN 屬 dev-mode-only / noindex / 不進 prod build / 不 deploy，**不阻擋任何 BLOG MVP 輸出**；其後續項目於 §E 列為「後續但非本輪」。

---

## 2. BLOG 第一階段「已完成 / 已驗收」整理

權威來源：`docs/phase-1-completion-report.md`（2026-05-18 升正式 final）+ `docs/phase-1-completion-checklist.md` + CLAUDE.md §28 / §30 + 前一份 mainline map §C / §M。

### 2.1 系統能力（已驗收）

- CLAUDE.md §28 **17 條 MVP 必做全 ✅**；§29 **12 項第一版不做全維持**。
- Phase 0 ~ 9 主軸全 ✅（骨架 / Vite 預覽 / Design System / Blogger 匯出 / FB Promotion / SEO+GA4+AdSense / RWD / 發布備份檢查 / 8-x sidecar·legacy 退場 / 9-x book·relatedLinks·JSON-LD）。
- **6/6 conditional article block 兩端 parity**（Blogger ↔ GitHub）。
- Phase 8-h legacy 退場 **15/15** positions retired-or-migrated。
- JSON-LD 兩端 BlogPosting + WebSite + isPartOf + mentions + Book mainEntity 全 landed + verified（Phase 9-j）；canonical 雙站對齊。
- `dist/sitemap.xml` + `dist/robots.txt` 已補檔（Phase 9-g-g-c；10 url entries）。

### 2.2 真實作者端對端（已驗收）

- 首篇真實 ready Blogger post `we-media-myself2` 通過 build × 5 pipeline；canonical 指向 Blogger publishedUrl；兩端 JSON-LD `@id` 一致；copy-helper + publish-checklist + FB promotion txt 正確；example.com placeholder 全域 0 殘留。
- relatedLinks live activation + Hashtag live activation 達成。

### 2.3 Phase 1 final 後已 landed 之 post-Phase-1 能力（已驗收，不改變 final 宣告）

- **AdSense N7–N9 整套** landed；**GitHub Pages article ads LIVE**（N9e；2026-06-11）；**Blogger articleAd6 / beforeRelatedLinks LIVE on 6 篇**；guard `check:blogger-adsense-output` 85/0。
- **Commerce links L1 seed**（10 active；通路王）+ resolver + smoke 23/0 + we-media dual-block content（Blogger-only blocks；GitHub legacy byte-identical）。
- **GA4 P1 article_bottom_nav custom dimensions** 註冊 + report-verified（2026-06-15 17:35）。
- **ADMIN dev-mode-only read-only 後台**全套（含今日 readability 收線）。

baseline carry-forward validation（本輪未重跑）：normal `validate:content` 0/94/84；overlay 0/101/85；production-post warnings = 0（94/101 全來自 `content/validation-fixtures/`）；AdSense / commerce / ADMIN smokes 全綠（per CLAUDE.md §3a validation baseline 表）。

→ **嚴格定義下：Phase 1 內已無「尚未完成」項目。** 以下 §3 之待收尾皆屬 post-Phase-1 強化 / 營運線，不阻擋 Phase 1 final。

---

## 3. BLOG 第一階段「仍待收尾」整理（A–E 五線）

每項標：current status / risk（low/medium/high）/ 需 source 實作? / 需 build·deploy? / 需 Dean 手動操作或回饋?

### A. 發文 / 內容線

| # | 項目 | current status | risk | 需 source | 需 build·deploy | 需 Dean 手動 |
|---|---|---|---|---|---|---|
| A1 | P3 `blog-restart-steady-rhythm-notes` 草稿審稿 | docs draft only（`docs/20260612-blogger-p3-steady-rhythm-article-draft.md`）；未落 content；user 未審稿 | low | 審稿=否；落地=是（single new md） | 否（審稿）；落地後另 build | 是（審稿 / approval） |
| A2 | Dormant article blocks 啟用（Cover / Affiliate top / Download Box / Book Photo） | infrastructure ready；屬作者內容路徑；多數 ready post 未填對應欄位 | low | 否（純內容欄位） | 啟用後需 build 驗證 | 是（提供內容 / 啟用旗標） |
| A3 | phonics-practice-sheet-download draft → ready | draft；`download.fileUrl` 未填 | low | 否 | 啟用後 build | 是（提供下載連結 / 內容定稿） |
| A4 | 新文章持續產出（GitHub 技術站 / Blogger 內容站） | 營運線；Blogger 7 ready / GitHub 2 ready | low | 否（走既有 SOP） | 每篇 build·deploy | 是（撰稿 / 發布） |

### B. Blogger / AdSense repost 與驗證線

| # | 項目 | current status | risk | 需 source | 需 build·deploy | 需 Dean 手動 |
|---|---|---|---|---|---|---|
| B1 | Batch 2 P2 `ai-tools-simplify-daily-workflow` live repost | content landed；repost packet docs-only；**live repost 🔴 BLOCKED** | medium | 否（content 已 landed）；guard expand 第 7 target=是（另 phase） | 需 build:blogger 產 post.html（已可產）；重貼=手動 | 是（packet §D 6 項 inputs + explicit approval + 手動重貼 + 驗收） |
| B2 | Blogger AdSense 6 篇 dashboard / policy 觀察 record | 6 篇 live PASS 已超 72h；可進 stable observation | low | 否 | 否 | 是（登入 AdSense 後台 → 回報 policy / site status / earning / invalid traffic） |
| B3 | Blogger repost theme CSS 確認（`.lab-affiliate-box` / blogger-full-style.css live 狀態 UNKNOWN） | source bundle 自 2026-05-06 已含；Blogger 後台 live theme 狀態未確認 | medium | 否 | build:blogger-theme 可產 CSS；貼上=手動 | 是（確認 Blogger 後台是否已貼最新 theme CSS） |
| B4 | P3 落地後之 Blogger 發布 | 依 A1；尚未落 content | low→medium | 否 | build:blogger | 是（重貼 + 驗收） |

### C. GitHub Pages / custom domain 準備線

| # | 項目 | current status | risk | 需 source | 需 build·deploy | 需 Dean 手動 |
|---|---|---|---|---|---|---|
| C1 | GitHub Pages 內容持續 deploy（透過獨立 `portable-blog-deploy` repo） | 最近 deploy = N9e（2026-06-11；gh-pages `2acb5a5→c15e514`）；流程穩定 | low | 否 | 是（build + push gh-pages via deploy repo） | 是（授權 deploy） |
| C2 | Custom domain 啟用 | **尚未啟用**；前置 docs 已備（`docs/custom-domain-root-files-strategy.md`） | medium | 是（CNAME / .nojekyll / ads.txt / robots / sitemap 根檔策略落地） | 是（deploy + DNS） | 是（購域名 / 設 DNS / 決策時機） |
| C3 | sitemap / robots / SEO indexing | `dist/sitemap.xml` + `robots.txt` 已補；indexing 7-batch policy 全 ✅ | low | 否（已 landed） | 隨內容 build 自動更新 | 否（持續觀察 Search Console 為 author SOP） |
| C4 | Google Rich Results / Search Console 驗證 | author SOP；持續適用 | low | 否 | 否 | 是（Dean 持續執行驗證） |

### D. GA4 / 站內點擊行為追蹤線

| # | 項目 | current status | risk | 需 source | 需 build·deploy | 需 Dean 手動 |
|---|---|---|---|---|---|---|
| D1 | GA4 P1 article_bottom_nav | **report-verified**（2026-06-15 17:35）；進入觀察階段 | low | 否 | 否 | 是（持續 GA4 後台觀察；紅線：`click_other_link` + `click_area=article_bottom_nav` 雙條件） |
| D2 | GA4 P2 / P3 dimension expansion（hashtag / affiliate / download / category / tag click 等） | ⏸ deferred；事件多已 instrumented，未在 GA4 後台註冊為 custom dimension | low | preanalysis=否；若需新 data-attr=是 | 否（後台註冊不需 build） | 是（GA4 後台註冊 custom dimension） |
| D3 | Reverse UTM Blogger→GitHub deploy verify（pm-26 gate） | **source landed but un-deployed**（pm-24a/b/c；2026-05-23）；live dormant；🔴 BLOCKED（缺 positive GitHub cross-link fixture） | high | fixture 設計=是（後續）；source 已 landed | 是（deploy + Blogger 重貼） | 是（Blogger 後台重貼 + GA4 Realtime 驗收） |
| D4 | 站內點擊事件整體覆蓋率盤點 | 既有 link-tracker / ga4-events landed；覆蓋率未系統化盤點 | low | preanalysis=否 | 否 | 是（回饋哪些行為想優先追蹤） |

### E. Admin 後台後續（非本輪）

| # | 項目 | current status | risk | 需 source | 需 build·deploy | 需 Dean 手動 |
|---|---|---|---|---|---|---|
| E1 | R2 頁首 overview 整併 | deferred until explicit approval | low | 是 | 否（dev-only；不 deploy） | 是（approval） |
| E2 | R5 nav 對齊 + inline-style 收斂 | deferred until explicit approval | low | 是 | 否 | 是（approval） |
| E3 | per-post prescription（「應改為 X」規則引擎） | not started | medium | 是 | 否 | 是（approval） |
| E4 | write path（Apply / Save / Auto-fix / browser write） | **dormant（§29 紅線）**；middleware / admin-write-cli 存在但 disabled | high | 是 | 否 | 是（須獨立 phase + 多項 preflight） |
| E5 | loader aggregation migration / validator `--report-json` source-side | not started | low | 是 | 否 | 是（approval） |
| E6 | FB sidecar 真實寫入 | **dormant**；待 user 勾選 8 項 preflight（`docs/fb-sidecar-write-preflight-decision.md` §7） | high | 是 | 否（社群發文手動） | 是（8 項 preflight 全勾） |

→ **§E 全線本輪不推進**；各須獨立 phase + user explicit approval。E4 / E6 另受 CLAUDE.md §29 第一版永禁約束。

---

## 4. Recommended next 3 phases（本輪不開始）

### 4.1 最保守下一步

**`20260617-XX-blog-phase1-mainline-idle-freeze-handoff-confirmation-docs-only-a`**

- docs-only：確認 Phase 1 mainline + ADMIN 線同時 idle freeze；不啟動任何 source / build / deploy / Blogger / GA4 / AdSense 後台動作。
- 適用情境：Dean 暫無新內容 / 無 deploy 需求，先封存今日狀態。
- risk: low；需 source: 否；需 build·deploy: 否；需 Dean 手動: 否。

### 4.2 最能推進第一階段完成度的下一步

**`20260617-XX-blogger-p3-steady-rhythm-content-landing-a`（內容線 A1）**

- 把 P3 草稿從 docs 落地為 `content/blogger/posts/...md`（single new file；mirror P1/P2 pattern）→ 補上第 8 篇 ready Blogger content，直接提升內容線完成度。
- 前置：先做純審稿子步驟（docs-only）再 approval 落地，避免一次跨太多。
- risk: low；需 source: 否（純內容）；需 build·deploy: 落地後需 build:blogger（deploy 另議）；需 Dean 手動: 是（審稿 + approval）。
- 替代（同屬推進但偏流量）：B1 P2 live repost——但 risk medium 且須 packet inputs，故推進完成度首選 A1。

### 4.3 最適合等 Dean 手動驗證 / 回饋後才做的下一步

**`20260617-XX-blogger-adsense-six-posts-dashboard-observation-record-docs-only-a`（B2 + D1 觀察線）**

- 須 Dean 先登入 AdSense 後台（6 篇 live 已超 72h）+ GA4 後台（P1 已 report-verified），回報 policy center / site status / earning availability / invalid traffic / ad serving limited 等；Claude 端僅 docs-only 記錄。
- 同類可併：D2 GA4 P2/P3 dimension expansion preanalysis（docs-only；列已 instrumented 未註冊的 dimension）。
- risk: low；需 source: 否；需 build·deploy: 否；需 Dean 手動: 是（後台觀察 + 回報）。

---

## 5. Non-actions（本 phase 明確不做）

- ❌ 不改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / lockfile / `dist*` / `gh-pages` / `.cache/`
- ❌ 不碰 ADMIN readability source；不重開 ADMIN 線
- ❌ 不 build-blogger / 不 build / 不 deploy GitHub Pages / 不 push gh-pages
- ❌ 不改 Blogger / AdSense resolver 或 templates；不重貼 Blogger；不開 AdSense 後台
- ❌ 不修改 content posts；不啟動 P3 content landing（須另 phase + approval）
- ❌ 不 npm install / 不動 package / lockfile
- ❌ 不啟動 §3 任一 A–E 待收尾項目之實作
- ❌ 不啟動 FB sidecar 真實寫入 / FB / Blogger / Google Drive / AdSense API 自動化
- ❌ 不啟動 reverse UTM deploy / pm-26 deploy gate
- ❌ 不 merge / rebase / reset / amend / force push
- ❌ 不重跑 validate / check guards（baseline carry-forward）
- ❌ 不壓縮 / 重排 CLAUDE.md（僅允許極小 ledger pointer sync）
- ❌ 不對 Phase 1 final 宣告做任何降級或重新封存
- ❌ 不自行開下一個 phase

---

## 6. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `d0183fe` / 0/0 / clean |
| 唯一 file change | `docs/20260617-blog-phase1-wrapup-status-map.md`（新增）；CLAUDE.md 視需要極小 ledger pointer sync |
| 未碰 src / views / scripts / content / settings / package / dist / gh-pages / `.cache` | ✅ |
| 未重開 ADMIN 線 / 未碰 ADMIN source | ✅ |
| 未啟動 §3 A–E 任一待收尾項目實作 | ✅ |
| 未 build / deploy / repost / npm install / merge / rebase / reset / amend / force push | ✅ |
| 未對 Phase 1 final 宣告做任何降級或重新封存 | ✅ |

→ docs-only checkpoint，read-only acceptance trivially PASS。

---

（本文件結束）
