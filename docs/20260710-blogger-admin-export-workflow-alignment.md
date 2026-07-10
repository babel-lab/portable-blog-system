# Blogger Admin export workflow alignment（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **alignment note**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 觸發：Phase 1 RC 後續小切片；第二次人工 E2E（`docs/20260708-phase1-second-manual-e2e-result.md` §D Attempt notes）觀察到 Attempt 1（貼 raw MD 失敗）→ Attempt 2（跑 `build:blogger` 後貼 HTML 成功）。需 audit：
  1. Admin `#blogger-export` 是否為 regression（初始未見 Blogger Export 按鈕）？
  2. Admin 匯出 Blogger HTML 的入口、按鈕、資料來源、build 前置條件？
  3. `build:blogger` / `validate:content` / Phase 1 readiness / manual E2E docs 描述是否一致？
  4. 是否有任何 doc 或 guard 明示：要先跑哪些指令 Admin 才能正確取得 Blogger export HTML？
- 本輪界線（docs-only）：**不**改程式 / **不**新 guard / **不**新 npm script / **不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/`。

---

## 0. Boot baseline（read-only 驗證）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `4e34d20` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

判定：boot baseline 完全符合 `docs/20260710-phase1-rc-handoff-operating-readout.md` §1 frozen baseline。Deploy clone 僅 read-only 驗證，未寫入。

---

## 1. 結論（先講結果）

**A. Admin `#blogger-export` 按鈕 = NOT a regression。**

- 目前 source（HEAD `4e34d20`）之 Admin `#blogger-export` per-post Copy 按鈕在 blogger-enabled 文章存在時**恆常 render**；render 條件與 `dist-blogger/` 是否存在**無關**。
- 第二次 E2E 之「Admin 初始未見 Blogger Export 按鈕」對應之 P1-1 於當時尚未 landed 之 fix（commit `38a4e98`，see `docs/20260708-phase1-p1-followup-closeout-inventory.md` §B P1-1）；該 fix 之後（含本輪 baseline `4e34d20`），Admin `#blogger-export` per-post 按鈕已恆常可見。
- 第二次 E2E Attempt 1（貼 raw MD 失敗）→ Attempt 2（`build:blogger` 後貼 HTML 成功）之經驗，屬**設計預期的 workflow**：Admin 提供**路徑字串**，實際 HTML 檔內容位於 `dist-blogger/posts/<slug>/post.html`，該檔案只在跑過 `npm run build:blogger` 之後才存在（見 §3）。

**B. 資料來源與 build 前置條件已多處明示；四份 docs 之描述互相一致。**

- Admin `#blogger-export` `be-notice`（`src/views/admin/index.ejs` 2944–2949）已明示 2 步流程：`build:blogger` → 依路徑手動開檔貼 Blogger。
- 2nd E2E result §D Attempt notes 已明示 Attempt 1 vs Attempt 2 差異。
- 3rd smoke §C-3 已明示 `build:blogger` PASS 為前置。
- Blogger draft-preview runbook（`docs/20260708-blogger-draft-preview-runbook.md`）已明示 6 步。

**C. 本 alignment doc 不新增 guard、不新增 script、不改任何程式；backfill 行為維持 report-only、不猜 Blogger 值**（`CLAUDE.md` §3a Red lines 與 `docs/20260706-blogger-identity-and-backfill-strategy.md`）。

---

## 2. Admin `#blogger-export` 資料來源 audit

**位置**：`src/views/admin/index.ejs`

| Layer | 事實 | 檔案 / 行 |
| --- | --- | --- |
| Nav anchor | `<a href="#blogger-export">Blogger Export</a>` | `src/views/admin/index.ejs:225` |
| Section header | `<h2 id="blogger-export">Blogger Export</h2>` + `read-only` tag | `src/views/admin/index.ejs:2912–2913` |
| Data source | `posts` array（Admin 既有）＋`p.blogger.enabled === true` filter | `src/views/admin/index.ejs:2956–2958` |
| Path 組出 | `'dist-blogger/posts/' + beSlug + '/'`（client-side 字串組合） | `src/views/admin/index.ejs:2967–2977` |
| Per-post buttons | 5 顆 Copy 按鈕（folder / post.html / copy-helper.txt / publish-checklist.txt / meta.json） | `src/views/admin/index.ejs:2989–2996` |
| 全區 build command | Copy `npm run build:blogger`（clipboard-only） | `src/views/admin/index.ejs:2950–2954` |
| 缺 slug 處理 | 該篇不組路徑，顯示 disabled reason | `src/views/admin/index.ejs:2986–2988` |
| Clipboard 契約 | navigator.clipboard.writeText 優先；fallback off-DOM `execCommand('copy')`；無 fetch / XHR / form submit / fs write / middleware ping | `src/views/admin/index.ejs:3015–3072` |

**Key facts**：

1. Section 之**渲染條件**：`bloggerEnabledPosts.length > 0`。不看 `dist-blogger/`。
2. **按鈕之啟用條件**：post 有 `slug` 且 `p.blogger.enabled === true`。不看檔案是否存在。
3. Admin 產出**皆為路徑字串**，**不讀 dist-blogger、不開檔、不 build、不寫 repo**（Admin `be-notice` + 註解區塊 2938–2942 均明示）。

**推論**：Admin `#blogger-export` 為 **source-driven**（source of truth = `content/**/*.md` frontmatter）。**Not dist-driven**。

---

## 3. Workflow：Admin → build → dist → Blogger 後台

以「Dean 想把 A 篇 blogger-enabled 文章的 HTML 貼到 Blogger 後台」為情境：

```
Step 1  在 Admin 頁面找到 A 篇的 per-post output 路徑
        Admin 頁面 → #blogger-export section → per-post card of A
        → Copy 「output folder」/「post.html」/「copy-helper.txt」等路徑
        
Step 2  在 terminal 跑 build
        npm run build:blogger
        （Admin 全區有 "Copy build command" 按鈕；文字內容也在 be-notice）
        
Step 3  build 產出 dist-blogger 內容（本機檔案系統）
        dist-blogger/posts/<slug>/post.html
        dist-blogger/posts/<slug>/copy-helper.txt
        dist-blogger/posts/<slug>/publish-checklist.txt
        dist-blogger/posts/<slug>/meta.json
        
Step 4  手動開檔 → 依 copy-helper 貼到 Blogger 後台（HTML 模式）
        （Admin 不代開檔；Claude 不代登入 Blogger）
```

**為何 Attempt 1（貼 raw MD）失敗**：Blogger 的 preview / HTML 模式不 render Markdown 語法；`##` / MD link 等會直接顯示為 raw 文字。

**為何 Attempt 2（`build:blogger` 產 HTML → 貼 HTML 模式）成功**：build 產出已為完整 HTML，符合 Blogger HTML 模式預期。

**為何 Admin 不代跑 build**：Admin 維持 read-only / dev-only 契約；不寫 repo、不觸發 build、不動 dist（`CLAUDE.md` §3a Admin idle freeze + `docs/20260630-admin-markdown-export-phase1-closeout.md`）。使用者必須自己在 terminal 跑 `npm run build:blogger`。

**是否需先跑 `validate:content`？**：**不強制**。`build:blogger` 不依賴 `validate:content` 前置；validator 為獨立 warning-only quality gate（`docs/20260710-phase1-rc-handoff-operating-readout.md` §2.3 baseline 0 error / 135 warning / 107 post）。第二次 E2E `docs/20260708-phase1-second-manual-e2e-result.md` §A C-1 / C-2 / C-3 順序（readiness → validate → build）為 Dean 之保守測試順序，非強制依賴。

---

## 4. 描述一致性 audit（build:blogger / validate:content / Phase 1 readiness / manual E2E）

四類 docs 對本 workflow 之描述交叉比對：

| Doc / 位置 | 提及 `build:blogger` 為前置？ | 提及 Admin 不代跑？ | 提及 validate:content 為 optional？ |
| --- | --- | --- | --- |
| `src/views/admin/index.ejs` `be-notice`（2944–2949）| ✅ 步驟 1 明示「先在 terminal 跑 `npm run build:blogger`」 | ✅「ADMIN 不會產生 `dist-blogger`」 | 未明示（不衝突） |
| `docs/20260708-phase1-second-manual-e2e-result.md` §D Attempt notes | ✅ Attempt 2 明示 | ✅ Attempt 2 明示 | Dean 執行順序含 validate:content，屬保守測試順序 |
| `docs/20260708-phase1-third-manual-smoke-result.md` §C | ✅ C-3 PASS | 隱含（未跑 build 就沒 dist） | ✅ C-2 PASS（Dean 執行；warning 為 expected artifact） |
| `docs/20260708-blogger-draft-preview-runbook.md`（6 步） | ✅ 明示 | ✅ 明示 | 未列入必要步驟 |
| `docs/20260708-phase1-p1-followup-closeout-inventory.md` §B P1-1 | ✅ | ✅（Admin 契約） | 未列入必要步驟 |
| `docs/20260710-phase1-rc-handoff-operating-readout.md` §2.1 items 8–9 | ✅ 指 `build:blogger` + `dist-blogger/posts/<slug>/` | ✅（透過 §7 red-line 排除 Admin write path） | 隱含（validate 屬 §2.3 warning-only） |
| `CLAUDE.md` §3a Phase 1 current state / §26 package.json 指令 | ✅ `build:blogger` 列名 | ✅（Admin 契約 / ADMIN idle freeze） | 未明示（validate 為獨立 quality gate） |

**判定：四類 docs 描述互相一致**。無矛盾。**唯一差異點** = validate:content 是否列為必要前置 —— 目前實作**非**必要前置（build:blogger 不依賴 validate:content 之 exit code），Dean 之保守測試順序將其含入不影響流程正確性。

---

## 5. 使用者已可從哪些管道知道「Admin 前需先跑 build:blogger」

實際觸點盤點（避免遺漏）：

1. **Admin `#blogger-export` `be-notice`（黃底 notice block）**：`src/views/admin/index.ejs:2944-2949`。使用者只要開 Admin 進入 `#blogger-export` section 即會看到 2 步流程。
2. **Admin 全區 "Copy build command" 按鈕**：`src/views/admin/index.ejs:2950-2954`。使用者可直接複製 `npm run build:blogger`。
3. **每篇 per-post card 之 disabled reason（缺 slug 時）**：明示「請先於 frontmatter 補 `slug` 後再 build」。
4. **`docs/20260708-blogger-draft-preview-runbook.md`**：6 步可重複流程；session cold-start 若讀過 RC handoff readout §8 See also 即會導入本 runbook。
5. **`docs/20260708-phase1-second-manual-e2e-result.md` §D Attempt notes**：真實 E2E 場景記錄；下一 tester 讀過即知 Attempt 1 為何失敗。
6. **`docs/20260708-phase1-p1-followup-closeout-inventory.md` §B P1-1**：landing record；記錄 fix commit `38a4e98` + Admin 契約。
7. **`CLAUDE.md` §26 package.json 指令**：列出 `npm run build:blogger`（含相關 build script family）。

**結論**：多入口皆已覆蓋。本 alignment doc 之角色 = 把 §1–§5 整合為單一 audit / summary，作為 Phase 1 RC 後續 handoff 時的**單點 lookup**（避免下一 tester 需跨 5 份 doc 拼湊）。

---

## 6. 是否需要 guard / 新增 doc / 新增 script？

| 選項 | 判定 | 理由 |
| --- | --- | --- |
| 新增 guard 強制 Admin 讀 `dist-blogger/` 判斷檔案是否存在 | ❌ **不做** | 破壞 Admin read-only / 不讀 dist 契約（`src/views/admin/index.ejs:2938-2942`、`docs/20260630-admin-markdown-export-phase1-closeout.md`） |
| 新增 guard 強制 `build:blogger` 為 Phase 1 readiness 前置 | ❌ **不做** | 破壞 `check:phase1-readiness` 之 checks-only 契約（forbidden token 含 `build` / `deploy` / `gh-pages`；contract 22/22 PASS） |
| 新增 script 觸發 Admin 自動 build | ❌ **不做** | Admin 恆為 read-only（不寫 repo、不 build、不 deploy） |
| 新增 doc 明示 workflow / 資料來源 / 一致性 | ✅ **本 doc** | docs-only；docs family 已有 5 份分散提及，補一份單點 lookup 屬合理小切片 |
| 動 Admin `be-notice` 內容 / 版面 | ❌ **本輪不做** | 本輪為 docs-only 對齊；如需擴充 Admin UI 屬另一獨立 phase + explicit approval |

**判定：本 alignment doc（唯一新增檔）即為最小 patch**。無 guard 新增、無 script 新增、無程式改動。

---

## 7. Backfill 行為不動之明示

**Blogger backfill 相關 guard `check:blogger-backfill` 維持 report-only、warning-only、exit 0**（`CLAUDE.md` §3a Validation baseline + `memory/project_baseline.md` §Validation snapshot）：

- `check:blogger-backfill` scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5（carry-forward from RC handoff §2.3）
- **不猜** Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`（`docs/20260706-blogger-identity-and-backfill-strategy.md` policy）
- 本 alignment doc **未動** guard 語意、**未動** frontmatter、**未動** sidecar `.publish.json`、**未動** `content/**`
- Blogger backfill write phase 仍屬 `docs/20260710-phase1-rc-handoff-operating-readout.md` §6 候選 B（preflight docs-only，若 Dean 未來 explicit approval 才啟動）

---

## 8. 明確不執行清單（本輪 red-line）

| 項目 | 狀態 |
| --- | --- |
| 動 `src/views/admin/index.ejs` | ❌ 不動 |
| 動 `src/scripts/build-blogger.js` / `check-blogger-backfill.js` / `check-blogger-adsense-output.js` | ❌ 不動 |
| 動 `content/**/*.md` frontmatter | ❌ 不動 |
| 動 `.publish.json` sidecar | ❌ 不動 |
| 動 `CLAUDE.md` | ❌ 不動 |
| 動 `MEMORY.md` / `memory/**` | ❌ 不動 |
| 動 `package.json` / `package-lock.json` | ❌ 不動 |
| 新增 npm script / guard | ❌ 不做 |
| 跑 `npm run build:blogger` | ❌ 未跑（本輪 docs-only） |
| 跑 `npm run build:*` | ❌ 未跑 |
| 跑 `npm run dev` / `preview` | ❌ 未跑 |
| 跑 `npm run validate:content` | ❌ 未跑（本輪 docs-only；last baseline = 0 err / 135 warn / 107 post，carry-forward） |
| 跑其他 `check:*` guard（除 §0 及 boot readiness） | ❌ 未跑 |
| deploy / push gh-pages / 動 `dist/` / `dist-blogger/` / `dist-promotion/` | ❌ 未動 |
| Blogger 後台任何操作 / repost / draft flip / URL 設定 | ❌ 未動 |
| 猜任何 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` | ❌ 不猜 |
| 動 Admin write path / Apply / middleware / admin-write-cli | ❌ 未動 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| 動 `github-pages-blog-planning` quarantine 狀態 | ❌ 未動 |

---

## 9. 下一 session 建議入口（sub-slice 候選）

**保守路徑 = idle freeze**（`CLAUDE.md` §3a Recommended next paths）。

若 Dean 判斷需推進 Phase 1 RC 後續：

- 候選 A（原 packet 候選 2）— Phase 1 RC → next-phase 決策入口 preanalysis（docs-only）
- 候選 B（原 packet 候選 3）— Blogger backfill write phase preflight（docs-only，不實寫）
- 候選 C — Blogger 實機發布頁 overflow 觀察 docs-only（僅在觸發條件命中時）
- 候選 D — Blogger preview-only script Option B preanalysis（docs-only）
- 候選 E — custom domain / AdSense 觸發條件 checklist（docs-only）

以上皆須 Dean explicit approval 啟動；不主動執行。

---

## 10. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script；不改 CSS；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`。§0 boot baseline 為 read-only 驗證；§1 結論、§2 資料來源 audit、§3 workflow 皆基於現有 source 檔案（`src/views/admin/index.ejs` HEAD `4e34d20`）之 read-only 觀察；§4 一致性 audit 引用既有 docs 與 CLAUDE.md 未新增新宣告；§5 觸點盤點為既有實作 / docs 之整理；§6 判定為對現有契約之複述；§7 backfill 語意不動；§8 red-line 沿用 CLAUDE.md §3a + RC handoff §7；§9 候選複述 RC handoff §6，不代 Dean 決策。

---

## See also

- `src/views/admin/index.ejs`（`#blogger-export` section 2911–3073；`be-notice` 2944–2949；per-post cards 2960–3002；clipboard helper 3015–3072）
- `docs/20260708-phase1-second-manual-e2e-result.md`（第二次人工 E2E；§D Attempt notes 為本 doc 之觸發背景）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型 smoke；§D P1-1 fix verified resolved）
- `docs/20260708-phase1-p1-followup-closeout-inventory.md`（§B P1-1 fix landing record；commit `38a4e98`）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft preview 6 步可重複流程）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（P1-2 build eligibility 盤點）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff readout；本 doc 為其 §6 之外一份細目對齊 note）
- `docs/20260709-blog-phase2-next-work-packet.md`（Phase 2 next-work packet）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；不猜 ID）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill sidecar canonical location）
- `docs/20260706-blogger-backfill-report-only-baseline.md`（Blogger backfill report-only baseline）
- `docs/20260630-admin-markdown-export-phase1-closeout.md`（Admin markdown export Phase 1 MVP closeout）
- `CLAUDE.md` §3a Current state snapshot（含 Admin idle freeze / Red lines / Recommended next paths）
- `CLAUDE.md` §5（分階段）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§28（MVP 必做）、§29（第一版不做）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）

---

（本文件結束 / end of document）
