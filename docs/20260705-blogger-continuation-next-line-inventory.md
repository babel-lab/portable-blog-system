# 20260705-O Blogger continuation next-line inventory

- **Date**: 2026-07-05 (Asia/Taipei)
- **Type**: docs-only inventory note（**不** 修改 content / frontmatter / status / draft / publishTargets / cover / body / canonical / primaryPlatform / date / updated / tags；**不** 補 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt` backfill；**不** build / preview / deploy；**不** 碰 gh-pages / deploy clone；**不** 修改 `CLAUDE.md` / `MEMORY.md` / `memory/`；**不** 動 Blogger / GA4 / AdSense / Search Console / Google Drive 後台）
- **Predecessor session**: `20260705-N Blogger continuation next-line inventory + final idle-freeze`（read-only inventory；未動任何檔案；未新增 docs；未 commit；default next action remains idle-freeze-hold；recommended future first phase remains `Blogger backfill only`）
- **Predecessor docs (context sources)**:
  - `docs/20260705-blog-restart-steady-rhythm-notes-readiness-note.md`（`20260705-M`；single-candidate readiness；候選 = `blog-restart-steady-rhythm-notes`；仍非 low-risk；仍 Dean-gated；最保守未來第一 phase = Blogger backfill only）
  - `docs/20260705-blogger-github-cross-mirror-candidate-comparison.md`（`20260705-K`；6 篇 Blogger ready 候選共同狀態；low-risk immediate-deploy = 0；recommended first future candidate = `blog-restart-steady-rhythm-notes`）
  - `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`（`20260705-G`；post-E next-line inventory；§6.1 B Blogger ready → GitHub cross-mirror flip 候選；§8 default = idle-freeze-hold）
  - `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`（`github-pages-blog-planning` 維持 quarantined / draft；本 slice 亦不解除）
  - `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`（`admin-ui-draft-generator-first-test` 維持 draft / excluded；本 slice 亦不推進）
  - `docs/20260703-post-c1-next-deploy-candidates.md` §3（low-risk immediate-deploy candidates = 0；權威來源）
  - `docs/20260704-c1-c1-verify-only-result.md`（verify-only frozen baseline；build-readiness guards 全 PASS）
  - `CLAUDE.md` §3a Current state snapshot / first GitHub Pages deploy milestone / A1 內容線 P3 登錄 / Red lines / Recommended next paths

---

## 1. Scope

本文件 **只是一份 inventory note**，把 `20260705-N` session（Blogger continuation next-line inventory + final idle-freeze）之 Blogger 線盤點結論，於 cold-start 場景下集中登錄，讓後續 session 進入時可直接讀本檔，不需重跑 `20260705-K` / `20260705-M` / `20260705-G` 之各前置盤點，也不需自行掃 `content/blogger/posts/**` 或 Blogger 相關 docs。

本檔聚焦 **Blogger 線**（含 Blogger 端 render / 已 landed AdSense / operator guidance / commerce affiliate renderer / Blogger → GitHub cross-mirror source / Blogger backfill 待補），並明確標示：

- 已完成 surfaces（source-level / build-level / online-verified level 分別列示）
- 仍為 blocked / dormant / forbidden 之路徑
- 未來 Dean 若要推進，各安全候選之最小 scope

本 slice **唯一 mutation = 新增本檔一個 docs file**（透過單一 additive commit 記錄）。

本 slice **不推動、不批准、不執行**：

- content / frontmatter 修改
- `status` / `draft` / `publishTargets` / `cover` / body / canonical / primaryPlatform / date / updated / tags 修改
- Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` backfill
- prepublish check / build / preview / deploy / gh-pages / dev server
- Blogger / GA4 / AdSense / Search Console / Google Drive / Blogger API / FB Graph / Google Drive API 後台動作
- Admin write path / Apply / middleware / admin-write-cli
- Reverse UTM pm-26 deploy / FB sidecar 真實寫入
- `CLAUDE.md` / `MEMORY.md` / `memory/` 修改
- `github-pages-blog-planning` quarantine 解除
- `admin-ui-draft-generator-first-test` 推進
- Blogger AdSense Batch 2 P2 / P3 live repost

所有實際 flip / backfill / cover 補圖 / cross-mirror / publish 決策 **完全在 Dean**。

**本檔不是 action plan、不是 ranking、不是 priority list、不是 checklist、不是 runbook。** 本檔是 inventory-only，**不排優先序、不排時程、不推薦哪條路徑最急**。

---

## 2. Frozen baseline used

Source repo（`/d/github/blog-new/portable-blog-system`；entry-of-session；本 slice 未動 baseline 值，只新增本檔一個 docs file）：

| 欄位 | 值 |
|---|---|
| branch | `main` |
| HEAD == origin/main | `0b5821ca38c852389f63dbe5ce7e9152aea9c09b` |
| short | `0b5821c` |
| subject | `docs(publish): record blog restart cross-mirror readiness` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |
| `CLAUDE.md wc -m` | 38328 |
| `CLAUDE.md wc -c` | 49967 |

Deploy clone（`/d/github/blog-new/portable-blog-deploy`；read-only preflight；本 slice 未觸碰）：

| 欄位 | 值 |
|---|---|
| branch | `gh-pages` |
| HEAD == origin/gh-pages | `1170e7e14aaa7f3449999bf92b9c8586719a76b4` |
| short | `1170e7e` |
| subject | `deploy(github): publish first verified github pages scope` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

Baseline **matched** on entry；`CLAUDE.md` 仍在 40000 chars 管控線內。

---

## 3. Why this note exists

`20260705-N` 已在該 session 內把 Blogger 線之 continuation next-line inventory 盤點完成並選擇 idle-freeze（未新增 docs、未 commit）。本檔的存在目的：

1. **Cold-start Blogger-line anchor**：讓下一個新開 session 進入時，不需重掃 `content/blogger/posts/**` / `docs/20260612-blogger-*` / `docs/20260617-blogger-p3-*` / `docs/20260624-sp9c-*` / `docs/20260605-*` 等大量 Blogger 相關 docs，即可掌握 Blogger 線目前已完成 surfaces 與剩下路徑。
2. **明確拆分「已完成 / blocked / dormant / forbidden / safe future」四類**：讓後續 session 讀本檔即能判斷「這件事已做 / 這件事永禁 / 這件事需 Dean 提供資料 / 這件事需另開 phase」。
3. **統一 idle-freeze-hold 立場**：明確標示 Claude 對 Blogger 後台一律 NO-GO；Blogger URL / postId / publishedAt 一律不 guess；default next action = idle-freeze-hold unless Dean explicit approval opens a separate phase。
4. **配合 CLAUDE.md 40000 chars 管控線**：本 inventory 集中於 docs，不回寫 CLAUDE.md；per `CLAUDE.md` §3a Historical ledger replacement rule。

本檔 **不** 是 action plan。**不** 排優先序、**不** 排時程、**不** 推薦哪條路徑最急、**不** 代 Dean 決定要 backfill 哪一篇。

---

## 4. Completed Blogger line surfaces

以下為 Blogger 線目前 **已完成 / 已 landed** 之 surfaces；讀值以 `CLAUDE.md` §3a Current state snapshot / first GitHub Pages deploy milestone / Validation baseline / A1 內容線 P3 登錄 / Blogger AdSense 段 / Commerce 段 / Reverse UTM 段為權威來源。本 slice 未重測、未重跑 guards、carry-forward 上述來源。

### 4.1 Phase 1 final

- ✅ **Phase 1 final 宣告（2026-05-18）** — MVP 17 條 / 12 條不做 / Phase 0–9 主軸 / article block parity 6/6（Blogger ↔ GitHub）/ we-media-myself2 端對端 / sitemap + robots + JSON-LD 全 PASS。Phase 1 已無未完成項。
- ✅ **Phase 1 manual E2E PASS（2026-07-02）** — runbook `docs/20260702-phase1-manual-e2e-runbook.md`；dual-repo snapshot `docs/20260702-session-start-dual-repo-baseline-snapshot.md`。
- ✅ **Phase 1 降級 / 重新封存 = 永禁** — per `CLAUDE.md` §3a Core operating rules。

### 4.2 Blogger build / renderer surface

- ✅ **Blogger build / renderer**（`src/scripts/build-blogger.js` + `src/views/blogger/blogger-post-full.ejs` + Blogger theme CSS export / copy-helper / meta.json / publish-checklist）— 於 Phase 1 主軸內 landed；`build:blogger` PASS（carry-forward）。
- ✅ **Blogger 三種輸出模式**（`full` / `summary` / `redirect-card`）— 皆 landed；`redirect-card` 亦支援 index / category 場景。
- ✅ **Blogger article block parity 6/6**（相對 GitHub）— per Phase 1 final。
- ✅ **Blogger design token CSS export**（`dist-blogger/theme/blogger-tokens.css` / `blogger-components.css` / `blogger-article.css` / `blogger-full-style.css`）— per `CLAUDE.md` §10 / Phase 3 主軸 landed。
- ✅ **Blogger copy-helper 第 [12] block（book metadata）**— per `docs/phase-9f-c-completion-report.md`；book-review / magazine 內容檢查區塊亦落地。

### 4.3 Blogger AdSense line

- ✅ **Blogger AdSense `articleAd6` / `beforeRelatedLinks`** — 6 篇 live PASS；guard `check:blogger-adsense-output` **85 / 0（6 targets）**（carry-forward）。
- ✅ **6-post monitoring record** — `docs/20260612-blogger-adsense-six-live-posts-monitoring-record.md` landed。
- ✅ **Blogger AdSense Batch 1 rollout** — `docs/20260612-blogger-adsense-batch-1-completion-record.md`；per-post packet / manual verification record 全 landed（`after-work-writing` / `daily-reading` / `reading-notes` / 其餘 batch 1 targets）。
- ✅ **Blogger AdSense Batch 2 P1（`blog-as-personal-knowledge-base`）** — content landed + Blogger manual repost completion record landed（`docs/20260612-blogger-p1-knowledge-base-manual-repost-completion-record.md`）。
- ✅ **Blogger AdSense Batch 2 P2（`ai-tools-simplify-daily-workflow`）** — content landed（`docs/20260612-blogger-p2-ai-workflow-content-landing-record.md`）；live repost = 🔴 BLOCKED（見 §5）。
- ✅ **Blogger AdSense Batch 2 P3（`blog-restart-steady-rhythm-notes`）** — content landed；Blogger LIVE published（2026-06-17）；live verification PASS（`docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`；Dean 截圖佐證；`bloggerPostId` 尚未回填、Claude 未登入 Blogger）。
- ✅ **N9 anchor wiring / resolver / article-block** — guard `check:adsense-resolver` **34 / 0** + `check:adsense-article-block` **13 / 0** + `check:adsense-anchor-wiring` **14 / 0**（carry-forward）。
- ✅ **N9e AdSense article ads on GitHub Pages** — LIVE（2026-06-11；14 v1 anchors）；此為 GitHub Pages 端登錄，Blogger 端另有 `articleAd6` / `beforeRelatedLinks` 專案。
- ⚠️ **N9-derived AdSense secret / real client id / real slot id** — 只存於 `content/settings/ads.config.json`；不外流；per `CLAUDE.md` §3a Red lines。

### 4.4 Blogger operator guidance / platform-policy line

- ✅ **SP-6 Blogger page-type guidance copy** — `docs/20260623-sp6-blogger-page-type-guidance-copy.md` landed。
- ✅ **SP-9a / SP-9c documented** — GitHub precedence + Blogger operator display-only wiring source closed；per `CLAUDE.md` §3a Validation baseline SP-9 line。
- ✅ **`check-blogger-operator-guidance` direct-node smoke** — 11 / 0（carry-forward；非 package script、非 validation-report baseline 成員）。
- ✅ **`check-platform-policy-effective` direct-node smoke** — 40 / 0（carry-forward）。
- ❌ **SP-9e validation / report decision** = **no landing**（by design；per `CLAUDE.md` §3a）。

### 4.5 Blogger commerce affiliate renderer

- ✅ **Blogger `affiliate.blocks[]` renderer + we-media dual-block** — landed（per `CLAUDE.md` §3a commerce 段）。
- ✅ **Blogger repost dual-block content model preanalysis** — `docs/20260610-blogger-dual-block-content-model-preanalysis.md`；設計完成，實作已 landed。
- ✅ **Blogger repost commerce affiliate box preflight** — `docs/20260610-blogger-repost-commerce-affiliate-box-preflight.md` landed。
- ✅ **Commerce links registry L1 seed** — 10 entries（全 `networkKey: books` 通路王）；resolver smoke **23 / 0**（carry-forward）。
- ✅ **Commerce validator C1–C6 / C8 / C4 / C9（warning-only）** — landed。
- ✅ **`check:blogger-adsense-output` 85 / 0（6 targets）** — carry-forward；不含 pixel-level regression（`build:blogger` 產物）。
- ⏸ **GitHub Pages affiliate dual-block** — deferred（單區塊 legacy byte-identical）；non-Blogger 線；本 inventory 不推進。

### 4.6 Blogger → GitHub Pages cross-mirror source

- ✅ **`we-media-myself2` Blogger → GitHub Pages cross-mirror** — 已在 first GitHub Pages deploy（`1170e7e`）scope；Blogger 端 manual paste PASS（per `memory/project_blogger_repost_acceptance_we_media_myself2.md`）；GitHub Pages 端 online verified。
- ✅ **Blogger → GitHub reverse UTM source（pm-24a / b / c；2026-05-23）** — source landed；未 deploy；live 為 dormant（見 §5）。
- ✅ **`ga4-url-builder.js` `isGithubCrossLink` + `applyCrossSiteUtm` `direction='to_github'`** — source landed（pm-24a `7e1d356`）。
- ✅ **`build-blogger.js` `deriveRenderedCrossLinks`（`direction:'to_github'`）** — source landed（pm-24b `e2309e9`）。
- ✅ **`blogger-post-full.ejs` 讀 `relatedLinksRendered` / `otherLinksRendered` + fallback raw** — source landed（pm-24c `7c769fe`）。
- ✅ **Build verify（pm-24d）** — `dist-blogger/` ready posts byte-identical-modulo-builtAt；無 GitHub cross-link 之 post 無新 UTM。

### 4.7 Blogger backfill tooling presence

- ✅ **`docs/publish-json-schema.md` §5.3 / §5.6** — Blogger URL 規則（post yyyy/mm 與 page URL 分支）+ `blogger.type` schema 已 landed。
- ✅ **`docs/20260617-night-blogger-p3-metadata-backfill-preflight.md`** — Blogger metadata backfill preflight 已 landed（本 slice 不執行）。
- ✅ **`docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`** — live verification record 已 landed。
- ⚠️ **Blogger backfill 實作** = **未動**；6 篇 Blogger ready 候選之 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt` **均未回填**；`blog-restart-steady-rhythm-notes` 之 Blogger LIVE published `bloggerPostId` 亦尚未回填（per `CLAUDE.md` §3a A1 內容線 P3 註記）。**Claude 不 guess**（per `CLAUDE.md` §3a Red lines）。

### 4.8 Prior 20260705 inventory anchors

- ✅ **`docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`** — post-E next-line inventory（排除 admin-ui）landed。
- ✅ **`docs/20260705-blogger-github-cross-mirror-candidate-comparison.md`** — 6 篇 Blogger ready 候選 comparison landed。
- ✅ **`docs/20260705-blog-restart-steady-rhythm-notes-readiness-note.md`** — single-candidate readiness landed。
- ✅ **`docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`** — `github-pages-blog-planning` quarantine decision landed。
- ✅ **`docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`** — admin-ui readiness landed（本 inventory 明確排除該篇之推進）。

---

## 5. Blocked / dormant / forbidden paths

以下路徑 **明確標示為 blocked / dormant / forbidden**，本 inventory **不列入** §7 safe future candidates；每項均需 **獨立 phase + explicit Dean approval + 專屬 preflight** 才能考慮啟動。Claude 在 idle-freeze-hold 期間不主動觸發任一項。

| 路徑 | 狀態 | 說明 |
|---|---|---|
| Blogger 後台 login / post / repost / update / delete / draft flip / template edit / theme edit / URL 設定 / 標籤設定 / 圖片上傳 | 🔴 forbidden（by Claude） | Claude 一律 NO-GO；per `CLAUDE.md` §3a Red lines / §29；只有 Dean 手動於 Blogger 後台操作 |
| Guess Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` | 🔴 forbidden（by Claude） | 永禁；per `CLAUDE.md` §3a Red lines；必須由 Dean 明確提供，不從 URL pattern / date pattern / slug pattern 推斷 |
| Blogger AdSense Batch 2 P2 live repost（`ai-tools-simplify-daily-workflow`） | 🔴 BLOCKED | 至 explicit Dean approval；per `CLAUDE.md` §3a；content landed 但 live 未動 |
| Blogger AdSense Batch 2 P3 live repost（若 Dean 未來要對 P3 做進一步 live 動作） | 🔴 BLOCKED | 至 explicit Dean approval；P3 已 Blogger LIVE published（2026-06-17）；未來若需重新 live repost / metadata backfill / cover 補圖，均需獨立 phase |
| Reverse UTM Blogger → GitHub deploy（pm-26 gate） | 🔴 BLOCKED / dormant | source 已 landed（pm-24a / b / c；2026-05-23）；live 為 dormant；deploy 需獨立 phase + Blogger 後台手動重貼 + GA4 Realtime 驗收；per `CLAUDE.md` §3a Red lines / `docs/reverse-utm-fixture-plan.md` §6 |
| FB sidecar 真實寫入（Apply / write to Blogger / write to FB） | ⏸ dormant | 待 Dean 勾選 8 項 preflight；schema + ADMIN read-only dry-run 已 landed（Apply 永久 disabled） |
| Admin write path（Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`） | 🔴 dormant | per `memory/project_admin_write_path_status.md`；Admin dev-mode-only read-only 已 landed；write path 需獨立 phase + explicit approval |
| Blogger API / FB Graph / Google Drive API / Search Console API / 自動社群發文 / 留言系統 / View 數 / 讚數 / 會員 / 資料庫後端 / 真正後台登入 / 視覺化編輯器 | 🔴 第一版永禁 | per `CLAUDE.md` §29 |
| GA4 / AdSense dashboard 後台任何動作 | 🔴 forbidden（by Claude） | Claude 一律 NO-GO；只有 Dean-provided masked evidence 可 docs 化 |
| Search Console 後台任何動作 | 🔴 forbidden（by Claude） | 同上 |
| Google Drive 後台任何動作 | 🔴 forbidden（by Claude） | 同上 |
| Guess GA4 measurement ID / AdSense client id / slot id 於 public docs | 🔴 forbidden | real values only in `content/settings/ads.config.json` / `content/settings/ga4.config.json`；不寫入 docs / `CLAUDE.md` / `src/` / frontmatter |
| Phase 1 final 之降級 / 重新封存 | 🔴 永禁 | per `CLAUDE.md` §3a Core operating rules |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | 🔴 永禁 | per `CLAUDE.md` §3a Historical ledger replacement rule |
| Solo 修改 `content/**` / `src/**` / `views/**` / `settings/**` / `package.json` / `package-lock.json` 於 idle-freeze session | 🔴 forbidden | per `CLAUDE.md` §3a Core operating rules 下列預設一律禁止 |
| Solo 執行 `npm run build*` / `preview` / `dev` / deploy script / gh-pages push 於 idle-freeze session | 🔴 forbidden | 同上 |
| `github-pages-blog-planning` quarantine 解除 | 🔴 hold（by design） | per `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`；本 slice 不解除 |
| `admin-ui-draft-generator-first-test` 推進 | 🔴 excluded（本 inventory 明確排除） | per `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`；仍 draft / excluded |

---

## 6. Data Dean must provide before backfill

Blogger backfill 之最小資料集（**Claude 不 guess、不從 slug / date / URL pattern 推斷；per `CLAUDE.md` §3a Red lines**）：

對於每一篇要 backfill 之 Blogger post（例如 recommended first candidate = `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`；或其餘 5 篇 Blogger ready 候選之任一），Dean 需**明確提供**下列三項：

1. **`blogger.publishedUrl`** — 從 Blogger 後台複製之已發布 URL（完整 URL；含 `https://` 與網域）。**Claude 不從 slug + date 拼裝**（per `docs/publish-json-schema.md` §5.3 Blogger URL 規則不可預測）。
2. **`blogger.bloggerPostId`** — 從 Blogger 後台文章 URL 或 API 對應之 postId（純數字字串）。**Claude 不從其他來源推斷**。
3. **`blogger.publishedAt`** — Blogger 端實際發布時間（ISO 8601 時區明確格式；建議 `+08:00`）。**Claude 不從 frontmatter `date` / `updated` 推斷**（可能與 Blogger 端實際發布時間不同）。

**建議附加**（若 Dean 願意提供，可提升 backfill 完整度；非硬性必要）：

- `blogger.status: "published"` — 若 Dean 未提供，Claude 於 backfill phase 可依 §5.3 schema 之 published 語意補此欄位（此為 schema-derived，非 Blogger 後台推斷）。
- `blogger.type` — `post` 或 `page`；per `docs/publish-json-schema.md` §5.6；若 Dean 未提供，Claude 可依 `contentKind` fallback（life-note → `post`），但建議 Dean 明確標示。

**Claude 不需要之資料**（避免 Dean 誤送）：

- ❌ Blogger 後台之 dashboard credentials / cookies / OAuth tokens
- ❌ Blogger admin URL（如 `blogger.com/blog/post/edit/...`）
- ❌ Blogger 之 Post ID 前綴 / 後綴修飾（僅需純 postId 字串）
- ❌ Blogger 之 view count / like count / 留言數（第一版不記錄；per `CLAUDE.md` §29）

---

## 7. Safe future candidates

以下候選為 **safe future candidates**；**均為 Dean-gated**；Claude 不主動推進任一項。每項均需另開 phase + Dean explicit approval。**本節不排優先序、不排時程、不推薦哪條路徑最急。**

### 7.1 Docs-only Blogger line note

- **Scope**：僅新增 docs（inventory / preanalysis / cross-link）；不改 content / src / build / deploy。
- **範例**：
  - Blogger AdSense Batch 2 P2 live repost preflight docs（若 Dean 未來要 unblock P2 之前的 docs 準備）
  - Blogger metadata backfill preflight follow-up（若 Dean 未來要對 P3 以外之 5 篇亦記錄 backfill 需求）
  - Blogger commerce affiliate box preflight follow-up（若 Dean 未來要對某篇 Blogger post 新增 commerce block 之 docs 準備）
  - Blogger operator guidance follow-up（若 Dean 未來要對 SP-6 / SP-9a / SP-9c 之 operator guidance 補 docs）
- **風險面**：極小；不改 render 行為；不影響 Blogger 端 live；不影響 GitHub Pages 端未上線之狀態。

### 7.2 Blogger backfill only

- **Scope**：對於 Dean 選定之 1 篇 Blogger post，僅補 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`（及 optional `blogger.status: "published"` / `blogger.type`）；在 frontmatter 中新增 `blogger:` 區塊。
- **前提**：Dean 必須明確提供 §6 之 3 項 backfill 資料。
- **不做**：
  - ❌ **不** flip `publishTargets.github.enabled`（維持 `false`）
  - ❌ **不** 改 `cover`（維持 placeholder）
  - ❌ **不** 改 `canonical` / `primaryPlatform`
  - ❌ **不** 改 body / title / description / tags / date / updated
  - ❌ **不** build / preview / deploy
  - ❌ **不** 碰 gh-pages / deploy clone
  - ❌ **不** 動 Blogger / GA4 / AdSense / Search Console 後台
- **風險面**：極小；僅補三個由 Dean 明確提供之欄位；不改變任何 render / build / deploy 行為；不影響 Blogger 端已 live 之狀態；不影響 GitHub Pages 端未上線之狀態。
- **註**：本檔認定此為 **最保守之未來第一 phase**（承 `docs/20260705-blog-restart-steady-rhythm-notes-readiness-note.md` §9 一致；此處僅為 inventory 重述、非新推薦）。

### 7.3 Cover polish only

- **Scope**：對於 Dean 選定之 1 篇 Blogger post，僅補真實 cover 圖（取代 `/images/placeholders/cover-placeholder.svg`）；同時 optional 更新 `coverAlt`。
- **前提**：Dean 需決定圖片存放位置（`public/images/**` 或 Google Drive 或其他外部空間）與檔名規則。
- **不做**：
  - ❌ **不** flip `publishTargets.github.enabled`
  - ❌ **不** 改 `canonical` / `primaryPlatform`
  - ❌ **不** 改 body / title / description / tags / date / updated
  - ❌ **不** 補 Blogger backfill（若同時要補，另開 §7.2 phase）
  - ❌ **不** build / preview / deploy
  - ❌ **不** 動 Blogger / Google Drive 後台
- **風險面**：小；僅補圖 + optional alt；不改變 publish 行為；不影響 live 狀態。
- **註**：若 Dean 決定將圖放 `public/images/**`，Claude 於該 phase 內可協助檔名 / 路徑 / frontmatter 對齊；若放外部空間，Claude 僅協助 frontmatter `cover` URL 更新。

### 7.4 Blogger validation / guard improvement

- **Scope**：Blogger 相關 validator / guard 之 read-only 補強或 preanalysis docs；不改 render / 不改 build。
- **範例**：
  - Blogger AdSense guard 之額外 target 覆蓋（若 Dean 未來要對第 7 篇 Blogger AdSense post 補 guard target）
  - Blogger operator guidance guard 之覆蓋擴充
  - `check-blogger-operator-guidance` direct-node smoke 提升為 first-class npm script（若 Dean 未來決定；per `CLAUDE.md` §3a Validation baseline direct-node smoke 說明）
  - Blogger commerce affiliate block validator 之 warning-only 擴充（承 C1–C9 現況；non-mutation to registry）
- **前提**：Dean 需選定具體 guard / validator + scope。
- **風險面**：中；若涉及 `src/scripts/**` 修改，需經 Dean explicit approval；validator 本身之 output 變動不得改變 baseline（0 / 135 / 107）之語意。

### 7.5 GitHub Pages cross-mirror publish pipeline

- **Scope**：對於 Dean 選定之 1 篇 Blogger ready 候選，走完 `docs/20260705-blogger-github-cross-mirror-candidate-comparison.md` §10 之 Phase A–I 保守分階段路徑（cover / backfill / canonical / cross-mirror flip / prepublish / build / preview / deploy / online verification）。
- **前提**：
  - Dean 需先完成 §7.2 Blogger backfill only 與 §7.3 Cover polish only（或於 comparison note §10 Phase A/B 決策時說明例外）。
  - Dean 需明確授權 canonical / primaryPlatform / cross-mirror strategy 決策（per `docs/20260705-blog-restart-steady-rhythm-notes-readiness-note.md` §8）。
  - Dean 需明確授權 `publishTargets.github.enabled: false → true` flip。
  - Dean 需執行 online verification（Claude 不代為驗收）。
- **不做**：
  - ❌ **不** 動 Blogger 後台
  - ❌ **不** 動 reverse UTM pm-26 deploy（獨立 BLOCKED；per §5）
  - ❌ **不** 同時 flip 6 篇候選（per comparison note §10 建議逐篇獨立 phase）
- **風險面**：**最高**；涉及 second GitHub Pages deploy scope；涉及 gh-pages push；涉及 Blogger 端與 GitHub Pages 端同時可索引之 canonical / duplicate content 決策。**每一 phase 步驟均需 Dean explicit approval；Claude 不代為任一步驟。**
- **註**：此 candidate 之推進**必然分多個 phase**；不得單一 session 全做完。

---

## 8. Recommended default path

**Default = idle-freeze-hold.**

理由：

1. 所有 §5 之 blocked / dormant / forbidden 路徑 **不在** idle-freeze 期間可觸發。
2. 所有 §7 之 safe future candidates **均為 Dean-gated**；每項均需另開 phase + Dean explicit approval；Claude 不主動推進任一項。
3. Blogger 線之 already-landed surfaces（§4）於 idle-freeze 下處於一致狀態；`check:blogger-adsense-output` 85 / 0（6 targets）+ `check-blogger-operator-guidance` 11 / 0 + `check-platform-policy-effective` 40 / 0 + `check:admin-markdown-export` 256 / 256 + Phase 1 manual E2E PASS + first GitHub Pages deploy `1170e7e` clean + 4 篇 live 皆 online verified — **沒有** 需要立即修復的破口。
4. `20260705-M` / `20260705-K` / `20260705-G` 已把 Blogger ready → GitHub cross-mirror candidate surface + single-candidate readiness + post-E next-line inventory 集中登錄；本檔（`20260705-O`）已把 Blogger 線 continuation next-line 之完成 / blocked / safe future 集中登錄。**下一個 session cold-start 讀本檔即可掌握立場**。
5. `CLAUDE.md` 於 38328 chars / 49967 bytes，仍在 40000 chars 管控線內；不需 compaction；不需 ledger 回寫。

**若 Dean 開啟下一個 phase**，可能的最小起點（由 Dean 選；本檔不排優先序）：

- §7.1 Docs-only Blogger line note（風險最小）
- §7.2 Blogger backfill only（Dean 需提供 §6 3 項資料）
- §7.3 Cover polish only（Dean 需決定圖片存放位置）
- §7.4 Blogger validation / guard improvement（Dean 需選定 guard + scope）
- §7.5 GitHub Pages cross-mirror publish pipeline（風險最高；必然分多 phase；不得單 session 全做完）

以上皆為**選項**，非**推薦**；本 inventory 不排優先序、不排時程、不代 Dean 決定要 backfill 哪一篇。

---

## 9. What this slice intentionally does not change

本 slice 唯一 mutation = 新增本檔 `docs/20260705-blogger-continuation-next-line-inventory.md`（透過單一 additive commit 記錄）。

明確 **未變更 / 未執行** 之清單：

- ❌ 未修改 `content/blogger/posts/**` 任一檔案（含 6 篇 Blogger ready 候選 / `we-media-myself2` / Blogger AdSense batch / older posts / `.publish.json` / `.fb.md` sidecar）
- ❌ 未修改 `content/github/posts/**` 任一檔案（含 `github-pages-blog-planning` / `admin-ui-draft-generator-first-test` / 已 live 4 篇之任一）
- ❌ 未修改 `content/settings/**` 任一檔案
- ❌ 未修改 `content/templates/**` / `content/validation-fixtures/**` / `content/drafts/**` / `content/archive/**` / `content/shared/**`
- ❌ 未 flip 任何文章之 `status` / `draft` / `publishTargets` / `blogger.status` / `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`
- ❌ 未補任何文章之 `cover` / `coverAlt`
- ❌ 未修改任何文章之 `canonical` / `primaryPlatform` / `date` / `updated` / `tags` / `description` / `searchDescription` / body / title / titleEn
- ❌ 未修改 `src/**`（含 `src/scripts/**` / `src/js/**` / `src/views/**` / `src/styles/**`）
- ❌ 未修改 `views/**` / `public/**`
- ❌ 未修改 `package.json` / `package-lock.json`
- ❌ 未修改 `CLAUDE.md`（保持 38328 chars / 49967 bytes；遵守 40000 chars 管控線）
- ❌ 未修改 `MEMORY.md` / `memory/**`
- ❌ 未修改 `docs/20260705-blog-restart-steady-rhythm-notes-readiness-note.md`
- ❌ 未修改 `docs/20260705-blogger-github-cross-mirror-candidate-comparison.md`
- ❌ 未修改 `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`
- ❌ 未修改 `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`
- ❌ 未修改 `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`
- ❌ 未修改 `docs/20260703-post-c1-next-deploy-candidates.md`
- ❌ 未修改 `docs/20260704-c1-c1-verify-only-result.md`
- ❌ 未修改 `docs/20260703-post-k5-next-line-readiness-inventory.md`
- ❌ 未修改任何其他既有 docs file
- ❌ 未執行 `npm run dev` / `preview`
- ❌ 未執行 `npm run build*` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`
- ❌ 未執行 `npm run validate:content` 或任何 check guard（carry-forward `CLAUDE.md` §3a Validation baseline）
- ❌ 未觸碰 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/`
- ❌ 未觸碰 deploy clone `/d/github/blog-new/portable-blog-deploy`（仍 `1170e7e` / clean / 0/0）
- ❌ 未 push gh-pages / 未 deploy
- ❌ 未動 Blogger 後台 / GA4 / AdSense / Search Console / Google Drive / Blogger API / FB Graph
- ❌ 未 `npm install` / 未動 dependency / 未動 lockfile
- ❌ 未新增 devDependency（無 Playwright / 無測試框架變更）
- ❌ 未解除 `github-pages-blog-planning` quarantine
- ❌ 未推進 `admin-ui-draft-generator-first-test`
- ❌ 未推進 Blogger AdSense Batch 2 P2 / P3 live repost
- ❌ 未推進 Reverse UTM pm-26 deploy / Admin write path / FB sidecar 真實寫入
- ❌ 未補 Blogger backfill（任一篇之 `publishedUrl` / `bloggerPostId` / `publishedAt`）
- ❌ 未 guess Blogger URL / postId / publishedAt / GA4 measurement ID / AdSense client id / slot id
- ❌ 未推薦時程、未推薦優先序、未推薦 flip 順序、未代 Dean 決定要 backfill 哪一篇

---

## 10. Final status

**Inventory note only.** 本檔記錄 `20260705-N` Blogger continuation next-line inventory 之結論：

- Blogger 線已完成 surfaces = **多項**（詳 §4；含 Phase 1 final / Blogger build / renderer / Blogger AdSense line / operator guidance / commerce affiliate renderer / Blogger → GitHub cross-mirror source / Blogger backfill tooling / prior 20260705 inventory anchors）
- Blocked / dormant / forbidden 路徑 = **多項**（詳 §5；含 Blogger 後台 login / post / repost 一律 NO-GO / Blogger AdSense Batch 2 P2 live BLOCKED / Reverse UTM pm-26 dormant / FB sidecar dormant / GA4 / AdSense / Search Console / Google Drive 後台 forbidden / Guess Blogger URL / postId / publishedAt forbidden 等）
- Data Dean must provide before backfill = **3 項**（詳 §6；`publishedUrl` / `bloggerPostId` / `publishedAt`；不 guess）
- Safe future candidates = **5 類**（詳 §7；docs-only note / Blogger backfill only / cover polish only / Blogger validation / guard improvement / GitHub Pages cross-mirror publish pipeline）
- Future first phase 認定 = **`Blogger backfill only`**（承 `docs/20260705-blog-restart-steady-rhythm-notes-readiness-note.md` §9；此處 inventory 重述、非新推薦）
- 本 slice 不代 Dean 選擇路徑、不代 Dean 決定 backfill 哪一篇

**Default next action = idle-freeze-hold**，除非 Dean 另行 explicit approve 開啟一個獨立 phase（例如 §7.1–§7.5 任一）。Claude 不代為選擇路徑、不代為 flip、不代為 backfill、不代為 build、不代為 deploy、不代為 online 驗收、不代為 Blogger 後台任何動作。

本檔於下一個 Dean-gated phase 啟動前，**不需要再更新**；若 Dean 開啟推進 phase（Blogger backfill / cover / canonical / cross-mirror flip / build / preview / deploy），該 phase 會產出自己的 ledger doc，本檔僅於 cross-links 被引用即可。

---

## 11. Cross-links

- `docs/20260705-blog-restart-steady-rhythm-notes-readiness-note.md`（`20260705-M`；single-candidate readiness；本檔 §7.2 / §7.5 引用）
- `docs/20260705-blogger-github-cross-mirror-candidate-comparison.md`（`20260705-K`；6 篇候選 comparison；本檔 §7.5 引用 Phase A–I 順序）
- `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`（`20260705-G`；post-E next-line inventory；本檔 §7 承接候選 surface）
- `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`（`github-pages-blog-planning` 維持 quarantined；本 slice 亦不解除）
- `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`（admin-ui readiness；本 slice 明確排除該篇之推進）
- `docs/20260703-post-c1-next-deploy-candidates.md` §3（low-risk immediate-deploy candidates = 0；權威來源）
- `docs/20260704-c1-c1-verify-only-result.md`（verify-only frozen baseline；build-readiness guards 全 PASS）
- `docs/20260703-post-k5-next-line-readiness-inventory.md`（K.1–K.5 candidate map）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（若 Dean 開啟推進，§4 pre-publish gate 為權威）
- `docs/20260617-night-blogger-p3-metadata-backfill-preflight.md`（Blogger metadata backfill preflight；本檔 §4.7 引用）
- `docs/20260617-blogger-p3-steady-rhythm-live-verification-record.md`（Blogger P3 live verification；本檔 §4.3 引用）
- `docs/20260612-blogger-adsense-batch-1-completion-record.md`（Blogger AdSense Batch 1 rollout；本檔 §4.3 引用）
- `docs/20260612-blogger-adsense-six-live-posts-monitoring-record.md`（6-post monitoring；本檔 §4.3 引用）
- `docs/20260612-blogger-p1-knowledge-base-manual-repost-completion-record.md`（Batch 2 P1 completion；本檔 §4.3 引用）
- `docs/20260612-blogger-p2-ai-workflow-content-landing-record.md`（Batch 2 P2 content landed；live BLOCKED；本檔 §4.3 / §5 引用）
- `docs/20260610-blogger-repost-commerce-affiliate-box-preflight.md`（Blogger commerce affiliate box preflight；本檔 §4.5 引用）
- `docs/20260610-blogger-dual-block-content-model-preanalysis.md`（Blogger dual-block content model；本檔 §4.5 引用）
- `docs/20260623-sp6-blogger-page-type-guidance-copy.md`（SP-6 Blogger page-type guidance；本檔 §4.4 引用）
- `docs/20260624-sp9c-blogger-platform-policy-operator-guidance.md`（SP-9c Blogger platform-policy operator guidance；本檔 §4.4 引用）
- `docs/reverse-utm-fixture-plan.md` §6（reverse UTM pm-26 deploy gate；BLOCKED；本檔 §5 引用）
- `docs/github-deploy.md`（F-01 deploy runbook；若 Dean 未來執行 §7.5 GitHub Pages cross-mirror publish pipeline 使用）
- `docs/publish-workflow.md` §3–§4（build order authority）
- `docs/publish-json-schema.md` §5.3 / §5.6（Blogger URL 規則 / `blogger.type`；本檔 §6 引用）
- `CLAUDE.md` §3a Current state snapshot / Core operating rules / Validation baseline / Red lines / first GitHub Pages deploy milestone / A1 內容線 P3 登錄 / Recommended next paths
- `CLAUDE.md` §2.1 / §2.2（Blogger 站定位 / GitHub Pages 站定位）
- `CLAUDE.md` §16.4（Blogger ↔ GitHub 互導；GitHub → Blogger 已 landed；Blogger → GitHub source landed un-deployed）
- `CLAUDE.md` §24（Blogger 發布 URL 回填）
- `CLAUDE.md` §29（第一版永禁清單）
- `memory/project_blogger_repost_acceptance_we_media_myself2.md`（Blogger repost 驗收面 forward priorities；本檔 §4.6 引用）
- `memory/feedback_no_per_article_html_decorations.md`（no per-article HTML decorations policy）
- `memory/project_reverse_utm_status.md`（pm-24a/b/c source landed；pm-26 deploy BLOCKED；本檔 §4.6 / §5 引用）
- `memory/project_admin_write_path_status.md`（Admin write path dormant；本檔 §5 引用）
- `memory/project_baseline.md`（frozen source / deploy baseline）

---

（本文件結束 / end of document）
