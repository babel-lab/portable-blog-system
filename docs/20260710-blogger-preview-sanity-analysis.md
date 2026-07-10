# Blogger preview sanity analysis + checklist（docs-only）

- 建立日期：2026-07-10（Asia/Taipei）
- 類型：docs-only **audit + sanity checklist**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 觸發：Phase 1 RC handoff 後續小切片；第二次人工 E2E（`docs/20260708-phase1-second-manual-e2e-result.md` §D Attempt notes）Attempt 1 失敗（raw MD 貼 Blogger）→ Attempt 2 成功（`build:blogger` HTML → Blogger HTML 模式）之教訓，需一份**集中式 post-paste sanity checklist**，避免下一輪手動 E2E 重蹈覆轍。
- 本輪界線（docs-only）：**不**改程式 / **不**新 guard / **不**新 npm script / **不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 Blogger backfill 語意（`check:blogger-backfill` 維持 report-only）/ **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/`。

---

## 0. Boot baseline（read-only 驗證）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `d73492b` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

判定：boot baseline 完全符合 `docs/20260710-phase1-rc-handoff-operating-readout.md` §1 frozen baseline + `docs/20260710-blogger-admin-export-workflow-alignment.md` §0。Deploy clone 僅 read-only 驗證，未寫入。

Readiness checks 本輪跑（read-only）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| C-1 | `npm run check:phase1-readiness` | 0 | validate 0/135/107、npm-script-targets 48/48、adsense-mode 0 warn、blogger-backfill 7 missing report-only、prepublish 16/16、smoke 8/8 |
| C-2 | `npm run check:phase1-readiness-contract` | 0 | 22/22 PASS（6/6 required、6/6 ordered、13 forbidden absent） |

---

## 1. 結論（先講結果）

**A. 現有 docs 對「Blogger preview 該貼哪個檔案」已多處覆蓋、描述互相一致。**
- Admin `#blogger-export` `be-notice`（`src/views/admin/index.ejs:2944-2949`）+ per-post 5 顆 Copy 按鈕（folder / `post.html` / `copy-helper.txt` / `publish-checklist.txt` / `meta.json`）
- Blogger draft-preview runbook（`docs/20260708-blogger-draft-preview-runbook.md` §D-7 / §E first bullet）：明示複製 `post.html` 之 HTML → Blogger **HTML 模式**貼上；raw MD 會顯示 `##` / `[text](url)`
- Admin export workflow alignment doc（`docs/20260710-blogger-admin-export-workflow-alignment.md` §3）：明示 4 步 workflow（Admin → build → dist → 手動貼）+ §5 觸點盤點 7 個入口
- Second manual E2E result（`docs/20260708-phase1-second-manual-e2e-result.md` §D）：Attempt 1 / Attempt 2 對照
- `CLAUDE.md` §26（`build:blogger` 列名）

**B. 現有 docs 對「Blogger preview 不需 deploy GitHub Pages」已明示。**
- runbook §B（適用 / 不適用界線）：「❌ 不 deploy GitHub Pages（不碰 deploy clone、不 push gh-pages）」
- runbook §G（不可做事項）明列同上
- runbook §D-8：「用 Blogger 的儲存草稿 / 預覽看外觀」（獨立於 GitHub Pages live）

**C. 差異點：現有 docs 沒有一份「post-paste sanity checklist」讓 Dean 一項一項勾。**
- runbook §D-9 只驗「raw MD 語法消失 + 元素正常渲染」；未涵蓋 cover alt / canonical / JSON-LD / cross-link UTM / RWD 具體項 / CTA / hashtag / affiliate / AdSense slot 版面驗證
- runbook §H 為泛用結果紀錄模板；未逐項勾
- second E2E §C 為 D-1..D-10 步驟表；未逐項勾
- `dist-blogger/posts/<slug>/publish-checklist.txt` 為 build 產出的 per-post artifact；本 doc 之 §5 checklist 為 **paste-preview 階段** sanity 檢查（與 publish-checklist.txt 屬互補、非取代）

**判定**：現有 workflow guidance 已足；補一份**單頁 sanity checklist**（§5）作為下次手動 E2E 之 paste-preview 階段的操作表即可。**不新增 guard、不新增 script、不改程式**；backfill 行為維持 report-only、不猜 Blogger 值（`CLAUDE.md` §3a Red lines）。

---

## 2. 為什麼需要 sanity checklist（背景）

第二次人工 E2E 之 Attempt 1 失敗原因並非 workflow 文件缺失，而是**檢查點分散在多份 doc / 多個入口**。下一輪 tester 若跳過 runbook §D-4 / §D-7 的細節、直接嘗試「複製 Admin 匯出內容貼 Blogger」，仍會踩到相同坑（Admin 匯出恆為 markdown / `status:"draft"` + `draft:true`）。集中式 sanity checklist 之角色：

1. **paste 前**：Dean 已知該貼 `dist-blogger/posts/<slug>/post.html`；本 checklist 之 §5.0 前置僅一句 recap，不重講 workflow。
2. **paste 後 preview 時**：一項一項勾，避免遺漏 cover alt / canonical / JSON-LD / cross-link UTM / RWD / CTA 等**視覺 + metadata + 連結**類檢查。
3. **preview 結束前**：以 §5.9 清單確認未越界（不發布 / 不 deploy / 不 commit test artifact）。

---

## 3. Audit：現有 docs 對 Blogger preview 驗證重點是否覆蓋

以「Blogger preview 應驗什麼」為 audit 面（本 checklist 目標涵蓋範圍）：

| 驗證面 | 現有 docs 位置 | 覆蓋狀態 |
| --- | --- | --- |
| Raw MD 語法消失 | runbook §D-9 / §E first bullet | ✅ 明示 |
| 元素正常渲染（`h2` / `p` / `ul` / `a` / `blockquote` / `code`）| runbook §D-9 | ✅ 明示 |
| 標題 / 段落完整 | second E2E §D | 隱含（未逐項） |
| Cover / img 顯示 + broken image icon | runbook §E third bullet（假 cover 警告）| 部分（僅假 cover 提醒）|
| Cover alt 屬性 | 無明示 | ❌ 未涵蓋 |
| 內文圖片 alt 屬性 | 無明示 | ❌ 未涵蓋 |
| 內部連結 URL 正確（Blogger → GitHub Pages）| §16.4 / `docs/publish-json-schema.md` §5.3 | 隱含（`blogger.publishedUrl` policy）|
| Cross-link UTM 附加（本階段 source landed / un-deployed）| `CLAUDE.md` §16.4 / `memory/project_reverse_utm_status.md` | ✅ 提醒（但未列入 preview checklist） |
| 外部連結目標網址 | 無明示 | ❌ 未涵蓋 |
| Canonical / JSON-LD 對照 `meta.json` | Blogger `publish-checklist.txt` per-post 產出 | 部分（Blogger publish-checklist 是**發布時**檢查表，非 preview 階段）|
| 桌機 viewport 版面 | runbook §D-8 | ✅ 明示（籠統）|
| 手機 viewport 版面 | runbook §D-8 / §F | ✅ 明示（籠統）|
| 手機水平捲軸 debug | runbook §F | ✅ 專節 |
| Post CTA 顯示位置 | 無明示 | ❌ 未涵蓋 |
| Hashtag 顯示 | 無明示 | ❌ 未涵蓋 |
| Affiliate box（若有）| 無明示 | ❌ 未涵蓋 |
| AdSense slot 版面（若 `ads.adsenseMode: enabled`）| `check:blogger-adsense-output` 為 build 產出檢查、非 preview | 部分 |
| 不發布 Blogger / 不 deploy / 不 commit test artifact | runbook §B / §G | ✅ 多處明示 |

**判定**：8 項 ✅ 明示 / 4 項部分 / 6 項未涵蓋。§5 sanity checklist 補齊未涵蓋項；已明示者於 checklist 內以精簡條列 recap，避免與 runbook 重複。

---

## 4. 使用本 checklist 的時機與界線

- **使用時機**：Blogger draft-preview 階段（runbook §D-8 之後、§D-10 改回 draft 之前）。**每篇** blogger-enabled 文章 preview 時皆可用。
- **不用於**：
  - 正式發布後之 Blogger 後台 QA（正式發布另有 `CLAUDE.md` §7 checklist + `dist-blogger/posts/<slug>/publish-checklist.txt`）
  - Admin `#new-post-draft` 之 markdown 匯出階段（Admin 輸出 raw markdown、非 Blogger HTML；`docs/20260710-blogger-admin-export-workflow-alignment.md` §3）
  - GitHub Pages readonly 檢視（`docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`）
- **界線**：
  - Blogger 僅 draft / preview，**不按發布**（runbook §D-8）
  - **不** deploy GitHub Pages / **不** push gh-pages / **不** commit 測試文章 / dist-blogger（runbook §B / §D-11 / §G）
  - **不**猜 Blogger URL / postId / publishedAt（`CLAUDE.md` §3a Red lines）

---

## 5. Blogger preview sanity checklist（本 doc 交付物）

貼 HTML 到 Blogger draft、按 preview 之後，依序勾（先易後難；Fail 之項回頭修測試檔或依 runbook §E / §F 排除）：

> 前置 recap（僅一句）：已依 runbook §D-1..§D-7 產生 `dist-blogger/posts/<slug>/post.html`、以 Blogger **HTML 模式**貼上。若不確定，回讀 runbook §D-7 + §E first bullet；若還在 Attempt 1（貼 raw MD），停止並回 runbook §D-4/§D-5 產 HTML。

### 5.1 內容完整性（Content parity）

- [ ] 標題與 frontmatter `title` 一致；無 leftover raw MD（沒有可見 `##` / `###`）
- [ ] 內文段落順序與原 markdown 一致；無段落遺失
- [ ] 沒有可見 `[text](url)` / `_italic_` / `**bold**` / `` `code` `` 等 raw MD 語法
- [ ] `<blockquote>` / `<pre><code>` / `<ul>` / `<ol>` 渲染正常
- [ ] 中文標點無變成亂碼

### 5.2 圖片（Images / alt）

- [ ] 若 frontmatter 有 `cover`，cover img 於 Blogger preview 正常顯示（無 broken image icon）
- [ ] Cover alt 屬性正確（DevTools → Elements 檢查 `<img alt="...">`，對應 frontmatter `coverAlt`）
- [ ] 內文所有 img 均正常顯示；無 broken image icon
- [ ] 內文 img alt 屬性存在（無 alt 為缺陷；不需與內文完全相同，但需有意義描述）
- [ ] 圖片 URL 為 absolute（Blogger 需 absolute；relative path 會 broken）

### 5.3 連結（Links / cross-link UTM）

- [ ] 內部連結（Blogger → GitHub Pages）URL 為 absolute（不是 `/posts/xxx` 或 `../xxx`）
- [ ] 外部連結目標網址與原 markdown 一致
- [ ] Cross-link（Blogger → GitHub Pages）UTM 附加狀態符合本階段設計：
  - `CLAUDE.md` §16.4 之 Blogger→GitHub source **已 landed（pm-24a/b/c）但 un-deployed**；本階段 preview 觀察到 UTM 之來源為 build-time 注入（`applyCrossSiteUtm` `direction:'to_github'`），已含 UTM
  - Live 端 UTM 生效仍待 pm-26 deploy gate；preview 階段不視為 live 驗收
- [ ] 站內連結（若 primaryPlatform 為 Blogger 之本站 GitHub cross-mirror）之 UTM 已於 build-time 注入
- [ ] 聯盟連結（若有 `affiliate.blocks[]` / legacy `affiliate.links[]`）rel 包含 `sponsored nofollow noopener noreferrer`

### 5.4 Metadata（canonical / JSON-LD / meta.json）

- [ ] 打開 `dist-blogger/posts/<slug>/meta.json` 對照：
  - `canonical` 符合 frontmatter `canonical`（若 `"auto"` 則對應 `primaryPlatform` 之對應 URL 規則）
  - `primaryPlatform` 符合 frontmatter
  - `bloggerMode` 符合 frontmatter `publishTargets.blogger.mode`（`full` / `summary` / `redirect-card`）
- [ ] 打開 `dist-blogger/posts/<slug>/publish-checklist.txt` 快速看過（避免遺漏發布前檢查項）
- [ ] Blogger post.html 內嵌 JSON-LD（若有）之 `@type` / `headline` / `author` / `datePublished` 與 frontmatter 一致
- [ ] **不需**打開 GitHub Pages live URL 對照（Blogger preview 為獨立驗證管道；`CLAUDE.md` §21 primaryPlatform / canonical 兩維度屬 build-time 決定，preview 只驗渲染結果）

### 5.5 版面 / RWD（Desktop + Mobile viewport）

- [ ] 桌機 viewport（≥ 1024px）版面正常：Article Header / Article Body / CTA / Hashtag / Affiliate / AdSense placeholder / Related links 等區塊順序符合 `CLAUDE.md` §17
- [ ] 手機 viewport（375px / 414px）版面正常：無明顯破版
- [ ] 手機 viewport 無水平捲軸；若有，走 runbook §F overflow debug 流程（**不**逕自判 P0 / 也**不**逕自判 external Blogger artifact；先定位 offender element）
- [ ] Sticky Header / Mobile Drawer（Blogger 主題外殼、非本專案 `.lab-blogger-article` 輸出）不影響 preview 判定

### 5.6 CTA / hashtag / affiliate / adsense（optional blocks）

僅在 frontmatter `blocks:` 對應項為 true 時檢查：

- [ ] Post CTA 區塊（若 `blocks.postCta` 或等價開關）顯示位置與樣式正確
- [ ] Hashtag 區塊（若 `blocks.hashtags`）顯示於文末；hashtag 與 `tags` frontmatter 一致
- [ ] Social Follow 區塊（若 `blocks.socialFollow`）顯示位置符合 Blogger theme 預期
- [ ] Affiliate box（若 `affiliate.blocks[]` / legacy `affiliate.enabled`）top / bottom position 顯示、rel 已含 sponsored（見 §5.3）
- [ ] AdSense article ad anchors（若 `ads.adsenseMode` 啟用）預留 placeholder 位置正確；本階段 preview **不**驗 live serving（`docs/20260708-adsense-source-evidence-audit.md` §6 blocked）
- [ ] Book photo / affiliate box（若 `book:` 有 `showBookPhoto: true`）顯示、cover 圖不空白區塊

### 5.7 Console / 404 / broken assets（DevTools）

- [ ] Blogger preview iframe 內開 DevTools（若 preview 在 iframe，Console 上方 context 切至 preview iframe）
- [ ] 無 broken image 404
- [ ] 無 script 404
- [ ] Chrome extension `contentscript.js` orphaned background-liveness 警告可忽略（非本專案輸出；runbook §E 已註明）

### 5.8 交叉驗證（optional，只在懷疑輸出來源時做）

- [ ] 若懷疑水平捲軸 / 版面 offender 屬本專案 `.lab-blogger-article` 內部，用 runbook §F-5 於 GitHub Pages readonly 頁面對照
- [ ] 若 GitHub Pages 也復現同一 offender → 系統輸出來源假說；記入 §H 結果紀錄
- [ ] 若 GitHub Pages **不**復現、只 Blogger 復現 → 指向 Blogger 主題 / preview 外殼

### 5.9 界線 recap（preview 結束前必勾）

- [ ] Blogger 僅 draft / preview，**未按發布**
- [ ] **未** deploy GitHub Pages / **未** push gh-pages / **未**動 deploy clone
- [ ] **未** commit 測試文章 / dist-blogger 到 repo（`git status --short` 於 §D-11 清理後回到 clean）
- [ ] **未**猜任何 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`（`CLAUDE.md` §3a Red lines）
- [ ] **未**登入 Blogger / AdSense / GA4 / Google Drive / Search Console 後台（Claude 從未；Dean 若有需求屬另一獨立 phase）

---

## 6. 使用建議

- **與 runbook 的關係**：本 checklist 為 runbook §D-8..§D-9 之**細化**；runbook 為 workflow-oriented（10 步 + F overflow debug），本 checklist 為 verification-oriented（40 項勾選）。兩者互補。
- **與 `publish-checklist.txt` 的關係**：本 checklist 用於 **preview 階段**（draft、未發布）；build 產出的 `publish-checklist.txt` 用於**發布階段**（Blogger 後台實按發布前）。兩者屬**不同時機**、不重疊。
- **與第二次人工 E2E `docs/20260708-phase1-second-manual-e2e-test-packet.md` 的關係**：packet §D 為 10 步 workflow（含 D-4 build:blogger、D-6 貼 Blogger draft、D-7 Blogger 預覽外觀）；本 checklist 精確對應 packet D-7 之細化。
- **與 Admin `#blogger-export` be-notice 的關係**：Admin 只提供**路徑字串**；本 checklist 不重複 Admin 界線描述，只補 preview 階段的驗證項。

---

## 7. 不做 / 不建議事項（本輪 red-line）

| 項目 | 狀態 |
| --- | --- |
| 動 `src/views/admin/index.ejs` / `src/scripts/build-blogger.js` / `check-blogger-*.js` | ❌ 不動 |
| 動 `content/**/*.md` frontmatter | ❌ 不動 |
| 動 `.publish.json` sidecar | ❌ 不動 |
| 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 不動 |
| 動 `package.json` / `package-lock.json` | ❌ 不動 |
| 新增 npm script / guard / preview-only script | ❌ 不做 |
| 跑 `npm run build:blogger` / `build:*` | ❌ 未跑 |
| 跑 `npm run dev` / `preview` | ❌ 未跑 |
| deploy / push gh-pages / 動 `dist/` / `dist-blogger/` / `dist-promotion/` | ❌ 未動 |
| Blogger 後台任何操作 / repost / draft flip / URL 設定 | ❌ 未動 |
| 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` | ❌ 不猜 |
| Admin write path / Apply / middleware / admin-write-cli | ❌ 未動 |
| AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| Phase 1 final 之降級 / 重新封存 | ❌ 未動 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | ❌ 不做 |

---

## 8. 下一 session 建議入口（sub-slice 候選）

**保守路徑 = idle freeze**（`CLAUDE.md` §3a Recommended next paths；`docs/20260710-phase1-rc-handoff-operating-readout.md` §8）。

若 Dean 判斷需推進 Phase 1 RC 後續 / Phase 2：

- 候選 A（原 packet 候選 2）— Phase 1 RC → next-phase 決策入口 preanalysis（docs-only）
- 候選 B（原 packet 候選 3）— Blogger backfill write phase preflight（docs-only，不實寫）
- 候選 C — Blogger 實機發布頁 overflow 觀察 docs-only（僅在觸發條件命中時）
- 候選 D — Blogger preview-only script Option B preanalysis（docs-only）
- 候選 E — custom domain / AdSense 觸發條件 checklist（docs-only）

以上皆須 Dean explicit approval 啟動；不主動執行。

實際使用本 checklist 之最短反饋路徑：**下一輪手動 E2E 時**，開 runbook + 本 checklist 對照勾選；若發現 checklist 條目不足或誤導，回寫本 doc 之 §5（docs-only 微調），**不**動程式。

---

## 9. 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script / preview-only script；不改 CSS；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages；未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense / GA4 / Blogger / GSC 後台；未寫回任何 Phase 1 status 宣告至 `CLAUDE.md`；未猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`。§0 boot baseline 為 read-only 驗證；§1 結論、§2 背景、§3 audit 皆基於現有 docs（runbook / alignment / second E2E result / Admin `#blogger-export` `be-notice`）之 read-only 整理；§5 checklist 之條目來源均為 `CLAUDE.md` §14–§17 / §21 / §23 之既有規則、Blogger 匯出既有輸出檔（`meta.json` / `publish-checklist.txt`）、runbook §F overflow debug 之既有規則；未新增系統規則、未加程式契約；§7 red-line 沿用 `CLAUDE.md` §3a + RC handoff §7；§8 候選複述 RC handoff §6，不代 Dean 決策。

---

## See also

- `docs/20260710-blogger-admin-export-workflow-alignment.md`（前一份 alignment audit；本 doc 為其 §3 workflow 之 paste-preview 階段細化 checklist）
- `docs/20260710-phase1-rc-handoff-operating-readout.md`（Phase 1 RC handoff readout；本 doc 為 §6 候選外之細目補充；未動 §6 候選狀態）
- `docs/20260708-blogger-draft-preview-runbook.md`（Blogger draft-preview 6 步可重複流程；本 checklist 對應 §D-8..§D-9 之細化；§F overflow debug 由本 checklist §5.5 / §5.8 引用）
- `docs/20260708-phase1-second-manual-e2e-result.md`（§D Attempt notes 之 raw-Markdown vs HTML 教訓；本 doc 之觸發背景）
- `docs/20260708-phase1-second-manual-e2e-test-packet.md`（測試包 §D 10 步 workflow；本 checklist 對應 D-7 之細化）
- `docs/20260708-phase1-third-manual-smoke-result.md`（第三次小型 smoke；§C-3 `build:blogger` PASS 為前置）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（P1-2 build eligibility 盤點 / Option A/B/C 決策）
- `docs/20260708-blogger-mobile-horizontal-scrollbar-audit.md`（Blogger mobile 水平捲軸 audit；§7 Option B；本 doc §5.5 / §5.8 之依據）
- `docs/20260630-admin-markdown-export-phase1-closeout.md`（Admin markdown export Phase 1 MVP closeout；Admin 恆 `status:"draft"` + `draft:true` 契約）
- `docs/20260706-blogger-identity-and-backfill-strategy.md`（Blogger identity 分層 policy；不猜 ID）
- `docs/20260706-blogger-backfill-write-target-inventory.md`（Blogger backfill sidecar canonical location）
- `docs/publish-json-schema.md` §5.3（Blogger URL 規則）/ §5.6（`blogger.type`）
- `CLAUDE.md` §7（Blogger 發布 checklist；發布階段、非 preview 階段）、§14（tags registry）、§15（categories registry）、§16.4（cross-link UTM）、§17（文章頁基本版型）、§21（SEO / canonical / primaryPlatform）、§23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）
- `MEMORY.md` + `memory/project_baseline.md`（frozen source / deploy baseline）
- `memory/project_report_only_metadata_guards.md`（8 warning-only guards + release-readiness umbrella）
- `memory/project_reverse_utm_status.md`（Blogger→GitHub source landed / un-deployed；pm-26 deploy BLOCKED）
- `memory/feedback_phase_discipline.md`（memory-sync-only / docs-only / source-only phases 不重疊）
- `memory/feedback_no_per_article_html_decorations.md`（keep posting simple）

---

（本文件結束 / end of document）
