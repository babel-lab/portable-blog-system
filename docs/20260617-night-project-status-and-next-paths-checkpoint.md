# Project status & next paths checkpoint（docs-only）

> Phase: `20260617-night-project-status-and-next-paths-checkpoint-docs-only-a`
> Date: 2026-06-17（Asia/Taipei；evening, 22:43+）
> Type: **docs-only checkpoint**（唯一 mutation = 本 doc 新增；不改 source / content / settings / views / scripts / package.json / lockfile / dist* / gh-pages / `.cache` / CLAUDE.md / MEMORY.md）
> Scope: 把截至目前的 BLOG / ADMIN / Phase 1 收尾狀態整理為單一 snapshot，作為下一輪「保守 vs 推進」決策入口。
>
> ⚠️ 本 checkpoint **不是**新的 Phase 1 final 宣告，亦**不**改寫 / 不降級 / 不重新封存 2026-05-18 之 Phase 1 final history（`docs/phase-1-completion-report.md`）。

---

## 1. Baseline（phase 開始前）

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `537e7d9601eeec0d41171149e93d556dec77cc1d`（short `537e7d9`） |
| origin/main | `537e7d9601eeec0d41171149e93d556dec77cc1d` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean（`git status --short` 為空） |
| latest subject | `docs(admin): record static payload preview browser pass` |

→ Baseline 與 phase prompt §A 預期一致。未 pull / merge / reset / rebase / amend / force-push。

---

## 2. Scope summary

| 動作 | 範圍 |
| --- | --- |
| 新增 | `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（本檔） |
| 修改 | **無** |
| 未動 | `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `.cache` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md / docs README |
| 未跑 | build / build:github / build:blogger / build:promotion / build:sitemap / deploy / preview / dev server / `safe-write:test` / `admin:write` / `admin-write-cli` / `--apply` / `dryRun:false` / Blogger / GA4 / AdSense 後台 / npm install |
| 已跑（read-only） | baseline git 7 件、`npm run validate:content`、docs 只讀 inspect |

---

## 3. Current accepted baseline（截至 HEAD `537e7d9`）

### 3.1 Validation carry-forward

| 指令 | 本輪結果 | CLAUDE.md §3a baseline | 對照 |
| --- | --- | --- | --- |
| `npm run validate:content` | 0 errors / 94 warnings / 84 issue-posts | 0 / 94 / 84 | ✅ 一致；無 regression |

production-post warnings = 0；94 warnings 全來自 `content/validation-fixtures/`（mirror baseline）。其他 guards（overlay / adsense-resolver / adsense-article-block / adsense-anchor-wiring / blogger-adsense-output / commerce-affiliate-resolver / admin-governance-aggregation / report-validation / check-validation-report / admin-validation-consume）本輪**未重跑**；以 CLAUDE.md §3a baseline 表 carry-forward。

### 3.2 Recent commit chain（context）

```
537e7d9 docs(admin): record static payload preview browser pass
2917f59 docs(admin): record static payload preview inspection pending
f873ec2 feat(admin): add static payload preview
add4f98 fix(admin): clarify phase wording copy
e402ed7 docs(admin): plan static payload preview implementation
```

---

## 4. Completed lines（recent + standing）

### 4.1 Admin static payload preview 切片（recent）

| # | 項目 | 證據 | 結論 |
| --- | --- | --- | --- |
| A1 | Source landed | `f873ec2` `feat(admin): add static payload preview` + `docs/20260617-night-phase2-admin-ui-static-payload-preview-implementation-a.md` | ✅ |
| A2 | Source-level inspection PASS | `2917f59` + `docs/20260617-night-admin-static-payload-preview-browser-pass-record-a.md`（loader +5 行 additive；admin view +82 行 additive；guardrail grep 全 0 matches） | ✅ |
| A3 | Browser-level acceptance PASS | `537e7d9` + `docs/20260617-night-admin-static-payload-preview-browser-pass-record-b.md`（user-provided Chrome screenshots 2026-06-17 22:17；phase §B 16 項 evidence 全 PASS；record-a B1–B10 全升 browser PASS 或維持 source-deterministic） | ✅ |
| A4 | Browser PASS record 已落地 | `537e7d9` | ✅ |
| A5 | Apply 仍為 disabled（preview-only） | record-b §5.1 #13；`aria-disabled="true"` | ✅ 維持 |
| A6 | 無 middleware / API / Admin Apply 啟用 | record-b §7 / §8；guardrail grep 全 0 | ✅ dormant |
| A7 | 無 `admin-write-cli` 真執行 | record-b §7；本輪同維持 | ✅ dormant |
| A8 | 無 `--apply` / `dryRun:false` | record-b §5.1 #11–#12；本輪同維持 | ✅ dormant |
| A9 | 無 payload files / 第三次 write | record-b §7 / §8；本輪同維持 | ✅ dormant |

→ Admin static payload preview 切片於本 checkpoint 時點為 **source + browser 全 PASS、Apply 永遠 disabled、實際寫入仍維持 terminal-only 且須 Dean explicit approval**。

### 4.2 BLOG / Blogger 發文線（standing + recent）

| # | 項目 | 證據 | 狀態 |
| --- | --- | --- | --- |
| B-live-1 | `we-media-myself2`（首篇真實 ready Blogger post） | Phase 1 final + 端對端 PASS（`docs/phase-1-completion-report.md`） | ✅ live verified（pre-Phase-1 final） |
| B-live-2 | Blogger AdSense Batch 1 minimum completion（6 篇 articleAd6 / beforeRelatedLinks live PASS） | `docs/20260612-blogger-adsense-batch-*` + guard `check:blogger-adsense-output` 85/0 | ✅ live verified；超 72h |
| B-live-3 | P3 `blog-restart-steady-rhythm-notes` content landed | `57d9491` `content(blogger): land steady rhythm restart note`；validate 0 觸發 | ✅ landed |
| B-live-4 | P3 generated HTML verification | `c105880` + `docs/20260617-blogger-p3-generated-html-verification-record.md`（articleAd6×1；0 EJS leak；guard 85-0 no-regression） | ✅ PASS |
| B-live-5 | P3 live published（Dean 手動發布全新 Blogger 文章） | live URL `https://babel-lab.blogspot.com/2026/06/blog-restart-steady-rhythm-notes.html`；publishedAt approx 2026-06-17 12:14 台灣時間 | ✅ Dean-evidence-based PASS |
| B-live-6 | P3 user-evidence live verification record | `0c19824` + `docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`（live page opens / title / body / `#self-growth` / articleAd6 位於 body 後 hashtags 前 + 本次有可見 ad fill / 無明顯 EJS leak） | ✅ user-evidence PASS |

→ P3 全鏈：content landing → generated HTML verification → repost packet（docs-only）→ Dean 手動 live publish → live verification record，**已至 live verified**。

### 4.3 GitHub Pages / Phase 1 範圍（standing）

| # | 項目 | 狀態 |
| --- | --- | --- |
| G1 | GitHub Pages live baseline | ✅ live；最近 deploy = N9e（2026-06-11；gh-pages `2acb5a5→c15e514`） |
| G2 | sitemap + robots + JSON-LD | ✅ Phase 9-g-g-c 已補（10 url entries）；BlogPosting + WebSite + isPartOf + mentions + Book mainEntity 兩端 landed |
| G3 | 6/6 conditional article block parity | ✅ Blogger ↔ GitHub |
| G4 | GA4 P1 article_bottom_nav report-verified | ✅ 2026-06-15 17:35 |
| G5 | Phase 1 final 宣告（2026-05-18） | ✅ history-frozen；本 checkpoint 不改寫不降級 |
| G6 | BLOG Phase 1 functionally complete（2026-06-17 snapshot） | ✅ per `docs/20260617-blog-phase1-closure-checkpoint.md` |

### 4.4 Commerce / AdSense / GA4 / ADMIN 已 landed lines（carry-forward；本輪未動）

- Commerce links L1 seed（10 active；通路王）+ resolver + smoke 23/0 + we-media dual-block content
- Blogger AdSense `articleAd6` / `beforeRelatedLinks` 6 篇 live PASS + guard 85/0
- GitHub Pages article ads（N9e）LIVE since 2026-06-11
- GA4 P1 article_bottom_nav report-verified
- ADMIN dev-mode-only read-only dashboard 全套（含 R3 / R4 / SEO Dry-run 收合 / validator warning badge / state filter）

詳：CLAUDE.md §3a current state snapshot + `docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md`。

---

## 5. Pending / not yet executed（截至本 checkpoint）

### 5.1 P3 / Blogger 發文線

| # | 項目 | 等待條件 / 阻塞點 |
| --- | --- | --- |
| P-1 | P3 metadata backfill（`blogger.publishedUrl` / `blogger.publishedAt` / `blogger.bloggerPostId`） | 等 Dean 提供 `bloggerPostId` + precise `publishedAt`；屬 content edit phase |
| P-2 | Browser / live-source independent verification（machine-read live HTML 比對 generated `post.html`） | 須另獨立 phase；Claude 端需登入 Blogger 或以 WebFetch 抓 live source（目前**未做**） |
| P-3 | GA4 / live behavior observation（P3 跨站導流 / `click_other_link` + `click_area=article_bottom_nav` 雙條件 / Blogger surface 比對） | 須 Dean 後台 evidence；Claude 端 docs-only 記錄 |
| P-4 | AdSense backend observation（policy center / site status / earning / invalid traffic / ad serving limited 等；含本 P3 與既有 6 篇） | 須 Dean 後台 evidence；Claude 端 docs-only 記錄 |
| P-5 | Blogger live theme CSS 狀態確認（`.lab-affiliate-box` / `blogger-full-style.css`） | 須 Dean 後台 check；source bundle 自 2026-05-06 已含 |
| P-6 | Batch 2 P2 `ai-tools-simplify-daily-workflow` live repost | content landed；packet docs-only；🔴 BLOCKED at user packet inputs + explicit approval + 手動重貼 + 驗收 |
| P-7 | 第 8 / 第 9 篇 Blogger 內容線（next post chain） | 純內容路徑；待 Dean 排程 |
| P-8 | Dormant article blocks 啟用（Cover / Affiliate top / Download Box / Book Photo） | 純內容路徑；多數 ready post 未填 |
| P-9 | `phonics-practice-sheet-download` draft → ready | draft；`download.fileUrl` 未填 |

### 5.2 GitHub Pages / Phase 1 收尾

| # | 項目 | 狀態 |
| --- | --- | --- |
| GH-1 | Custom domain 啟用 | **未啟用**；前置 docs 已備（`docs/custom-domain-root-files-strategy.md`）；屬 future setup；不阻擋 Phase 1 final |
| GH-2 | Search Console / Rich Results 持續驗證 | author SOP；持續適用；不阻擋 final |
| GH-3 | Reverse UTM Blogger→GitHub deploy（pm-26 deploy gate） | source landed un-deployed（pm-24a/b/c；2026-05-23；commits `7e1d356` / `e2309e9` / `7c769fe`）；live dormant；🔴 BLOCKED（缺 positive GitHub cross-link fixture + Blogger 手動重貼 + GA4 Realtime 驗收） |

### 5.3 GA4 / ADMIN 後續

| # | 項目 | 狀態 |
| --- | --- | --- |
| GA-1 | GA4 P2 / P3 dimension expansion（hashtag / affiliate / download / category / tag click 等） | ⏸ deferred；多數已 instrumented；待 GA4 後台註冊 + Dean approval |
| AD-1 | Admin Copy buttons（mirror commerce snippet helper） | 候選；docs-only plan §6 optional；未啟動 |
| AD-2 | Admin field auto-switching（以目前 dry-run diff 結果中變更欄位自動切換） | 候選；未啟動 |
| AD-3 | Admin multi-click deterministic smoke 截圖（B8 補強） | 候選；非阻塞；未啟動 |
| AD-4 | Admin detail panel readability / R2 overview consolidation / R5 nav inline-style 收斂 | deferred until explicit approval；本輪不啟動 |
| AD-5 | Admin write path（Apply / Save / Auto-fix / browser write / per-post prescription） | dormant；受 §29 紅線約束；不主動啟動 |
| AD-6 | FB sidecar 真實寫入 | dormant；待 8 項 preflight checklist（`docs/fb-sidecar-write-preflight-decision.md` §7） |

### 5.4 Phase 1 「是否已接近可發佈、可檢視、可手動回填」狀態判斷

| 維度 | 狀態 |
| --- | --- |
| 可發佈（Blogger） | ✅ 已穩定；we-media-myself2 + 6 篇 AdSense Batch 1 + P3 全 live verified |
| 可發佈（GitHub Pages） | ✅ 已穩定；最近 deploy N9e 2026-06-11 |
| 可檢視（GitHub Pages 本機） | ✅ `npm run dev` 可用 |
| 可檢視（Admin read-only） | ✅ posts index + detail + governance + aggregation + validation consume + R3 / R4 / SEO Dry-run 收合 + validator badge + filter + static payload preview |
| 可手動回填（Blogger URL / postId / publishedAt） | ✅ schema 已備（per CLAUDE.md §24 + `docs/publish-json-schema.md`）；P3 待 Dean 提供 postId / precise timestamp 即可回填 |

→ Phase 1 **已實質可發佈、可檢視、可手動回填**。剩餘缺口 = Dean 端 evidence-driven follow-up（postId / GA4 / AdSense / theme CSS / custom domain），**非**系統能力缺口。

---

## 6. Recommended next paths

各 path 皆**須 user explicit approval 才啟動**；Claude 端**不自動執行**。

### Path A — 最保守：idle / observe

- 內容：本 checkpoint 落地後，**零 mutation**；維持 BLOG / ADMIN 雙線 idle freeze。
- 適用：Dean 暫無新內容 / 無 deploy 需求 / 等待後台 evidence 累積。
- risk: **low**（read-only）
- 需 source / build / deploy: **否 / 否 / 否**
- 需 user approval: 不需要進一步動作即可進入 idle
- 禁止自動執行: 預設行為，無需阻擋

### Path B — BLOG metadata / live verification

候選 B 系列，皆 docs-only 或 content-edit-only；不 build / 不 deploy。

| sub | 內容 | risk | 需 source | 需 build·deploy | 需 user evidence | 禁止自動執行 |
| --- | --- | --- | --- | --- | --- | --- |
| B.1 | P3 metadata backfill（`blogger.publishedUrl` / `publishedAt` / `bloggerPostId`） | low | 否（純 content frontmatter edit） | 否（後續 build 另議） | **是**（Dean 須提供 postId + precise timestamp） | 必須等 Dean 提供 evidence |
| B.2 | Blogger AdSense 6 篇 + P3 dashboard observation record（docs-only） | low | 否 | 否 | **是**（Dean 後台截圖 / 文字回報） | 必須等 Dean evidence |
| B.3 | GA4 P1 觀察 + P2/P3 dimension expansion preanalysis（docs-only） | low | 否（preanalysis）；後續若加 data-attr=是 | 否 | **是**（GA4 後台 evidence） | 必須等 Dean evidence |
| B.4 | Browser / live-source independent verification preanalysis（machine-read live HTML） | low | 否（preanalysis） | 否 | 是（live URL 已有） | preanalysis 階段不執行 fetch |

### Path C — Admin small UX helper（小切片 / 不啟用 write path）

候選 C 系列，**全屬 read-only / preview-only UI 強化**；Apply / middleware / admin-write-cli 仍維持 dormant。

| sub | 內容 | risk | 需 source | 需 build·deploy | 禁止自動執行 |
| --- | --- | --- | --- | --- | --- |
| C.1 | Copy buttons（payload JSON / command preview 一鍵複製；mirror commerce snippet helper） | low | 是（admin view additive） | 否（dev-only / noindex / 不進 prod build） | 必須先獨立 phase preanalysis + Dean approval |
| C.2 | Field auto-switching（依 dry-run diff 之變更欄位自動切換 selector） | low | 是（admin view additive） | 否 | 同上 |
| C.3 | B8 multi-click deterministic smoke 截圖補強 | low | 否（純驗收） | 否 | 須 Dean 提供截圖；不啟動 dev server 取截圖 |

### Path D — Phase 1 acceptance checklist 收尾

候選 D 系列，皆 docs-only。

| sub | 內容 | risk | 需 source | 需 build·deploy | 禁止自動執行 |
| --- | --- | --- | --- | --- | --- |
| D.1 | Phase 1 acceptance checklist 重新比對（MVP 17 條 + 12 項不做 + Phase 0–9 主軸 + parity 6/6） | low | 否 | 否 | 不啟動 Phase 1 final 重做 / 降級 / 重新封存 |
| D.2 | Custom domain readiness preanalysis（不啟用；只把 `custom-domain-root-files-strategy.md` 已備項目整理為 checklist） | low | 否（preanalysis） | 否 | 不購域名 / 不設 DNS / 不改 CNAME |
| D.3 | Reverse UTM positive fixture preanalysis（pm-26 deploy gate 不解除） | low | 否（preanalysis） | 否 | 不 deploy / 不重貼 Blogger / 不解除 pm-26 gate |

### 6.x 路徑風險彙整 + approval / 自動執行政策

| Path | 風險 | 預設自動執行政策 |
| --- | --- | --- |
| A. idle / observe | low | ✅ 預設可進入（無 mutation） |
| B.1 P3 metadata backfill | low | ❌ 不自動；等 Dean evidence + approval |
| B.2 / B.3 後台 observation | low | ❌ 不自動；等 Dean evidence |
| B.4 live-source verification preanalysis | low | ❌ 不自動；獨立 phase |
| C.1 / C.2 Admin UX | low | ❌ 不自動；獨立 phase + approval |
| C.3 B8 smoke 補強 | low | ❌ 不自動 |
| D.1–D.3 Phase 1 acceptance / custom domain / reverse UTM preanalysis | low | ❌ 不自動；獨立 phase |
| **任何** build / deploy / Blogger repost / Admin Apply / `admin-write-cli` / `--apply` / `dryRun:false` / dev server start / Blogger·GA4·AdSense·Google Drive·Search Console 後台 / Phase 1 重做 / ADMIN R2+ / write path / npm install / 動 package·lockfile / merge·rebase·reset·amend·force-push | **高** | **❌ 永遠不自動；各須獨立 phase + user explicit approval** |

---

## 7. Final recommendation

**建議下一輪採 Path A（idle / observe）。**

理由：

1. Admin static payload preview 切片於本 checkpoint 時點為 source + browser 全 PASS；Apply 永遠 disabled；已無「尚未完成」項目。
2. P3 全鏈已至 live verified；剩餘缺口（postId / precise timestamp / GA4 / AdSense / theme CSS）**全屬 Dean 端 evidence-driven follow-up**，Claude 端無法在無 evidence 下推進。
3. Phase 1 已實質「可發佈、可檢視、可手動回填」；無系統能力缺口。
4. 當 Dean 取得 evidence 或決定推進特定 path 時，再以獨立 phase + explicit approval 進入 B / C / D 任一切片。

**若 Dean 已有 evidence 想推進**：建議優先序 = **B.1（P3 metadata backfill）** → **B.2（AdSense observation record）** → **B.3（GA4 dimension expansion preanalysis）**。三者皆 low risk + docs-only / content-edit-only + 無 build·deploy。

**禁止自動執行（重申）**：build / deploy / Blogger repost / Admin Apply / middleware / `admin-write-cli` / `--apply` / `dryRun:false` / dev server / Blogger·GA4·AdSense·Google Drive·Search Console·GitHub Pages 後台 / Phase 1 重做 / ADMIN R2+ / write path / FB sidecar 真實寫入 / reverse UTM deploy / npm install / 動 dependency / merge·rebase·reset·amend·force-push / 把巨型 ledger 又寫回 CLAUDE.md。

---

## 8. Explicit no-touch confirmation（本 phase）

本 phase **未**：

- 動 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- 改 `package.json` / lockfile / `vite.config.js` / `.cache`
- 改 CLAUDE.md / MEMORY.md / `memory/` / `docs/README.md`
- 改既有 docs record
- 啟動 dev server / build / build:github / build:blogger / build:promotion / build:sitemap / deploy / preview / Blogger repost
- 啟用 Admin Apply / middleware / API / POST endpoint
- 執行 `admin-write-cli` / `safe-write:test` / `admin:write` / production dry-run / 任何 admin write
- 加 `--apply` / `dryRun:false` / `dryRun: false`
- 產生 payload files / 第三次 write
- 加 `fetch` / `XMLHttpRequest` / form submit / auto-copy / auto-submit
- amend / rebase / merge / reset / cherry-pick / force-push / `git push --force` / `--no-verify`
- npm install / 動 dependency
- 動 Blogger / GA4 / AdSense / Google Drive / Search Console / GitHub Pages 後台
- 動 Phase 1 final 宣告之降級或重新封存
- 把巨型 ledger 又寫回 CLAUDE.md（per §3a discipline）

唯一執行：baseline git read（7 commands）+ `npm run validate:content` read-only + docs 只讀 inspect + 本檔新增。

---

## 9. Cross-links

- `docs/20260617-night-admin-static-payload-preview-browser-pass-record-b.md`（本輪 admin static payload preview browser PASS 紀錄；HEAD `537e7d9`）
- `docs/20260617-night-admin-static-payload-preview-browser-pass-record-a.md`（前一輪 source-only inspection；HEAD `2917f59`）
- `docs/20260617-night-phase2-admin-ui-static-payload-preview-implementation-a.md`（source landed ledger；HEAD `f873ec2`）
- `docs/20260617-phase2-admin-ui-static-payload-preview-implementation-plan.md`
- `docs/20260617-phase2-admin-ui-copyable-payload-panel-preanalysis.md`
- `docs/20260617-phase2-admin-ui-integration-preanalysis.md`
- `docs/20260617-blog-phase1-closure-checkpoint.md`（2026-06-17 BLOG Phase 1 closure snapshot；HEAD `0c19824`）
- `docs/20260617-blog-phase1-wrapup-status-map.md`（BLOG 收尾路線圖 A–E 五線）
- `docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`（P3 user-evidence live verification；HEAD `0c19824`）
- `docs/20260617-blogger-p3-generated-html-verification-record.md`（P3 generated HTML verification；HEAD `c105880`）
- `docs/20260617-blogger-p3-steady-rhythm-repost-packet.md`（P3 repost packet；HEAD `fb623fa`）
- `docs/20260617-blogger-p3-steady-rhythm-review-packet.md`（P3 審稿包）
- `docs/phase-1-completion-report.md`（2026-05-18 Phase 1 final 宣告；history-frozen）
- `docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md`（完整 current state + pointer 索引）
- CLAUDE.md §3a Core operating rules / §3a Red lines / §28 / §29 / §30

---

（本文件結束）
