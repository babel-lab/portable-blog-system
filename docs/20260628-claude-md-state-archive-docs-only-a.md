# 20260628 CLAUDE.md state archive（docs-only-a）

本檔案保存從 `CLAUDE.md` §3a 「Current state snapshot」中搬出的歷史敘事，避免 CLAUDE.md 超過 40k char 影響 Claude Code session 效能。

- 任務性質：docs-only housekeeping；無 source / content / package / settings 變動
- 觸發原因：新 session 顯示 `⚠ Large CLAUDE.md will impact performance (43.3k chars > 40.0k)`
- 來源 baseline：branch `main`、HEAD = origin/main = `8505604`（full `8505604d29d10e2d0bcbd5407cc00225e4328208`）、subject `test(admin): lock markdown clipboard helper contract`、2026-06-28、ahead/behind 0/0、working tree clean、index.lock absent
- 搬出範圍：詳述 phase commit 列表 / prior baseline chain / Admin Markdown 8-layer 100/100 smoke milestone 逐項列舉
- 保留範圍（仍在 CLAUDE.md）：latest baseline / red lines / validation baseline table / phase status 表 / next safe slice direction / 最近 10 個 commits

---

## 1. 完整 "Recent phase commits"（截至 `a546ae9` 時之 reverse chronological 全文）

> 來源段落為 CLAUDE.md §3a 第二段（pre-archive 時 line 210）。CLAUDE.md 現在只保留最近 10 條；以下為搬出時的完整序列。

`a546ae9` lock markdown flow status display contract（smoke #100 + CLAUDE.md baseline sync — 達成 100/100 milestone）/ `aaae8ef` sync admin markdown status display baseline（docs-only state sync）/ `4fba96a` lock markdown status display contract（smoke #99 + CLAUDE.md baseline sync）/ `eea351d` sync admin markdown missing reason baseline（docs-only state sync）/ `b8c758d` lock markdown missing reason copy（smoke #98 + CLAUDE.md baseline sync）/ `fda290b` sync admin markdown event wiring baseline（docs-only state sync）/ `38bd891` lock markdown recompute event wiring（smoke #97 + CLAUDE.md baseline sync）/ `6b13576` sync admin markdown runtime gating baseline（docs-only state sync）/ `d1e5db5` lock markdown runtime button gating（smoke #96 + CLAUDE.md baseline sync）/ `0457bf9` lock markdown import flow button gating（smoke #95 + CLAUDE.md baseline sync）/ `ad06097` sync admin markdown client mirror baseline（docs-only state sync）/ `c0fee31` lock markdown export client mirror（smoke #94 + EJS comment + CLAUDE.md baseline sync）/ `4a8328f` align markdown export import flow comment（smoke #93 + EJS 4→5 step comment）/ `a10d38a` record markdown export browser smoke / `80285e2` clarify markdown export preflight / `a50a43b` expand markdown export smoke cases / `d808863` sync admin markdown baseline / `821ec38` record draft markdown browser smoke（docs-only；**source-level/static + helper-driven evidence only，非完整 browser-run smoke**；無 Vite dev server；無 screenshot）/ `cdf521f` improve draft markdown output usability / `5520724` add category tag registry hints / `c48d80d` record seo cover fields smoke / `54233df` add seo cover draft fields / `2d5c54b` add ready preflight panel / `cd02087` ready mode validator preanalysis / `c1884a8` markdown import checklist / `529ff5c` Blogger build template close mismatch / `d2c6103` markdown draft export。

---

## 2. "Prior frozen baseline chain"（壓縮替代全文）

> 來源段落為 CLAUDE.md §3a 第三段（pre-archive 時 line 212）。CLAUDE.md 現在只留 archive pointer。

`33ce754`（2026-06-26）Blogger gated form iframe renderer（policy lock `6c0125f` + source `77561d1`，strict allowlist `isAllowedGoogleFormEmbedUrl`）→ `6687f06`（2026-06-26）validator hardening `page-gated-download-has-direct-file-url`，page-type-validator 110/0 → `f3a9b66` / `36a8523`（2026-06-26）Blogger gated download safe placeholder（OR / metadata-based）→ `97f8e3d` / `102afe8` / `6ab4749`（2026-06-26）gated form policy packet / renderer scan / GitHub direct-file guard → `e172ecf`（2026-06-25 night）funnel spec lock（docs-only）→ `5f9e42e`（2026-06-25）funnel metadata schema validator slice 1/2/4/6/8/10 + group 3 baseline-bump（validate:content **0/134/106**；overlay **0/141/107**；check:validation-report **27/0**；單篇 harness 103/0；warning-only）。更早 ledger pointer 索引：`docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md`（§5–§10）+ `docs/claude-md-ledger-archive/README.md`。

---

## 3. Admin Markdown export/import 8-layer regression net（100/100 milestone）詳述

> 來源段落為 CLAUDE.md §3a "ADMIN current state" 內第 7 個 bullet 之長段落（pre-archive 時 line 301）。CLAUDE.md 現在只保留一句概述 + pointer。

Manual import flow **8-layer regression net @ 100/100 smoke milestone**（5-step hygiene + client mirror lock + button gating lock (initial + runtime) + event wiring lock + missing-reason copy lock + status display contract lock × 2）：

- `4a8328f` smoke **#93** 鎖 EJS 5-step `<ol>` + 禁 stale "4 步" wording
- `c0fee31` smoke **#94** 鎖 EJS 內 `TARGET_FOLDERS` / `VALIDATION_COMMAND` 對齊 server-side `admin-markdown-export.js`
- `0457bf9` smoke **#95** 鎖 4 顆按鈕 **initial HTML attributes** — `#npd-copy` / `#npd-download` / `#npd-copy-path` MUST start `disabled` + `aria-disabled="true"`，`#npd-copy-cmd` MUST NOT carry `disabled`
- `d1e5db5` smoke **#96** 鎖 `recompute()` **runtime re-gating** — 3 顆 gated 按鈕 runtime `.disabled = disable` + paired `setAttribute('aria-disabled', disable ? 'true' : 'false')`，`COPY_CMD_BTN.disabled` MUST NOT appear in `recompute()`
- `38bd891` smoke **#97** 鎖 **event wiring symmetry** — change-event `[SITE_EL, KIND_EL, PRIM_EL, CAT_EL]` → `addEventListener('change', recompute)`、input-event `[TITLE_EL, SLUG_EL, DATE_EL, TAGS_EL, DESC_EL, SEARCH_DESC_EL, COVER_EL, COVER_ALT_EL, BODY_EL]` → `addEventListener('input', debounceRecompute)`、trailing initial-paint `recompute();` 三段不可 silent drift
- `b8c758d` smoke **#98** 鎖 `missingReason()` **validation hint output strings** — empty/no-missing → `''`、label literals `title: 'title'` / `slug: 'slug (僅 a-z 0-9 -)'` / `date: 'date (YYYY-MM-DD)'`、Chinese prefix `'請補上：'`、fullwidth comma join separator `'、'`
- `4fba96a` smoke **#99** 鎖 `showStatus()` / `STATUS_EL` **display contract**（markdown-preview status；markdown-export IIFE 版本，以 `function missingReason(` 為 disambiguation anchor 區分另外兩個 IIFE 同名 helper）— target `STATUS_EL`、error color `'#a00'`、success color `'#080'`、`setTimeout(..., 2000)` auto-clear、clear-only-if-unchanged guard `STATUS_EL.textContent === msg`
- `a546ae9` smoke **#100** 鎖 `showFlowStatus()` / `FLOW_STATUS_EL` **display contract**（manual-import-flow status；anchor `function showFlowStatus(` 為 unique，extractor 內含 duplicate-check assertion 防未來分裂為多 IIFE 副本）— target `FLOW_STATUS_EL`、error `'#a00'`、success `'#080'`、`setTimeout(..., 2000)` auto-clear、clear-only-if-unchanged guard `FLOW_STATUS_EL.textContent === msg`

**達成 100/100 milestone**：8 層由 markup（#93）→ contract（#94）→ button state（#95/#96）→ event hook（#97）→ user-facing copy（#98）→ status display × 2（#99/#100）逐層收緊，新一輪 source/test slice 才考慮 `copyTextToClipboard()` clipboard-side contract（隨後於 `8505604` smoke **#101** 落地，超出本檔搬出時之 frozen-net 範圍）。

---

## 4. 搬移 / 保留對照

| 段落 | 搬出（本檔） | 保留（CLAUDE.md §3a） |
| --- | --- | --- |
| Latest frozen baseline | — | ✅ 保留（compact 化、改寫至 `8505604`） |
| Recent phase commits 全文（25 條） | ✅ 本檔 §1 | 只留 top 10（含本日 `8505604` / `da5cfcc`） |
| Prior frozen baseline chain | ✅ 本檔 §2 | 改成一句 pointer 至本檔 §2 |
| ADMIN 100/100 milestone 8-layer 列舉 | ✅ 本檔 §3 | 改成一句概述 + pointer |
| Core operating rules | — | ✅ 保留全文 |
| Validation baseline table | — | ✅ 保留全文 |
| Red lines | — | ✅ 保留全文 |
| Historical ledger replacement rule | — | ✅ 保留全文 |
| Recommended next paths | — | ✅ 保留全文 |

---

## 5. 任務紀律守則

- 本檔為單純 archive，**不**含新增的事實聲明
- 不得從本檔反向推導 source-level 行為（請以 repo source / git log 為準）
- 未來 CLAUDE.md 若需再壓縮，請延續同樣模式：新 archive 檔放在 `docs/<YYYYMMDD>-claude-md-state-archive-docs-only-<seq>.md` 或 `docs/claude-md-ledger-archive/<seq>-*.md`
- 本檔誕生時 **未**動 source / content / settings / package / dist；**未** 跑 build / dev server / npm install；**未** 操作 Blogger / GA4 / AdSense / Search Console / Google Form / Drive

---

## 6. 20260629 後續 slice history（smoke #101–#126；接續 §3 之 100/100 milestone）

> 來源：CLAUDE.md §3a "ADMIN current state" line 300 之 #101–#105 逐 commit 敘事，及第二段 "Recent phase commits" 之 #113–#126 條目。CLAUDE.md 現只保留最新 baseline + 最近數條 pointer。docs baseline = `561f59e`（2026-06-29，`docs(state): sync titleEn summary baseline`）。

8-layer net（§3）後之持續加固（clipboard / copy-buttons / import-export hint / empty-state 系列）：

- `8505604` smoke **#101** — `copyTextToClipboard()` clipboard-side contract
- `c6a5fa5` smoke **#102** — copy buttons caller okMsg
- `41534c0` — markdown import / export hint 加固
- `61b6e98` smoke **#104** — filename empty-state hint
- `5b31879` smoke **#105** — summary target empty-state 色彩一致性（targetPath 空時與 filename/slug 同套 pending/red empty-state）

registry-hint + titleEn 三刀（#113–#126）：

- `cd60531` smoke **#113–114** — empty site registry hints；`entry.site=[]` 視為 no-constraint（category-only + mixed category+tag branch）
- `96c4542` smoke **#115–118** — titleEn direct-through field（filled→`titleEn:"..."`/blank→`titleEn:""`；server+client `buildPostMarkdown` parity；case 110 由 static scaffold 改 interpolated、case 97 input-event array +`TITLE_EN_EL`）
- `681263e` smoke **#119–122** — titleEn 長度 soft-warning（>80 warning-only / never blocking / never required；`READY_MAX_TITLE_EN_LEN=80`；`analyzeReadyGap` warning 分支 + generic panel renderer 自動顯示）
- `d37ad0b` smoke **#123–126** — titleEn summary count（`buildExportSummary`+client mirror 加 `counts.titleEn`；blank/missing/whitespace→0；不影響 `counts.title`；表單加 1:1 live counter n/80）

各刀皆獨立 commit + docs-only state sync；export 維持 `status:"draft"`+`draft:true`；**無** ready option / **無** repo write path / **無** build / deploy / dev server / **無** Blogger·Google·GA4·AdSense·Search Console 後台動作。
