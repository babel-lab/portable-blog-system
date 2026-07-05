# 20260705-G post-E next-line inventory excluding admin-ui

- **Date**: 2026-07-05 (Asia/Taipei)
- **Type**: docs-only inventory note (no content / no src / no build / no preview / no deploy)
- **Predecessor session**: `20260705-F post-E next-line inventory excluding admin-ui draft + final idle-freeze`
- **Predecessor docs (context sources)**:
  - `docs/20260703-post-c1-next-deploy-candidates.md`（post-first-deploy candidate roster；low=0 / medium=1 / blocked=12）
  - `docs/20260704-c1-c1-verify-only-result.md`（C1-C1 verify-only frozen baseline；guards 全 PASS）
  - `docs/20260703-post-k5-next-line-readiness-inventory.md`（K.1–K.5 candidate map）
  - `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`（20260705-C admin-ui readiness note；本 inventory 之 excluded 對象）

---

## 1. Scope

本文件 **只是一份 inventory note**，用來把 `20260705-F` session（post-E next-line inventory excluding admin-ui draft + final idle-freeze）之盤點結論，於 cold-start 場景下集中登錄，讓後續 session 進入時可直接讀本檔，不需重跑各前置 inventory 或猜測。

明確排除範圍：本文件 **不涵蓋** `admin-ui-draft-generator-first-test` 之後續推進。該篇之 readiness / blockers / Dean questions 已由 `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md` 完整登錄，本檔僅指向該文件，**不重複推進、不新增決策、不 flip 狀態**。

本 slice **不推動、不批准、不執行** 任何：

- content / frontmatter 修改
- status flip（draft → ready / published）
- publishTargets 修改
- build / preview / deploy / gh-pages / dev server
- Blogger / GA4 / AdSense / Search Console / Google Drive 後台動作
- Admin write path / Apply / middleware / admin-write-cli
- Reverse UTM pm-26 / FB sidecar 真實寫入
- CLAUDE.md 修改 / MEMORY.md / memory/ 修改

決策仍然完全在 Dean。

---

## 2. Frozen baseline used

Source repo (`/d/github/blog-new/portable-blog-system`; entry-of-session；本 slice 未改動 baseline 值，只新增本檔一個 docs file）：

| 欄位 | 值 |
|---|---|
| branch | `main` |
| HEAD == origin/main | `39c67729c1a7e96234e517dbd5c99739d25bf253` |
| short | `39c6772` |
| subject | `docs(publish): cross-link admin ui readiness note` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |
| `CLAUDE.md wc -m` | 38328 |
| `CLAUDE.md wc -c` | 49967 |

Deploy clone (`/d/github/blog-new/portable-blog-deploy`; read-only preflight；本 slice 未觸碰)：

| 欄位 | 值 |
|---|---|
| branch | `gh-pages` |
| HEAD == origin/gh-pages | `1170e7e14aaa7f3449999bf92b9c8586719a76b4` |
| short | `1170e7e` |
| subject | `deploy(github): publish first verified github pages scope` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `.git/index.lock` | absent |

Baseline 與 `20260704-c1-c1-verify-only-result.md` §2 之 deploy clone 完全一致；source repo HEAD 相較 `20260705-C readiness note` 之 baseline（`5bee02d`）再進 3 commits（`543e2b1` → `8cdbde5` → `39c6772`），皆為 docs / npm script guard registration slice，未動 content / src / settings / deploy clone。CLAUDE.md 字元數不變（38328 / 49967），仍在 40000 chars 管控線內。

---

## 3. Why this note exists

`20260705-F` 已在該 session 內把 post-E next-line inventory（排除 admin-ui draft）盤點完成並選擇 idle-freeze。本檔的存在目的：

1. **Cold-start anchor**：讓下一個新開 session 進入時，不需重跑 §2.1 candidate 表格、不需重讀多份前置 inventory，即可掌握 20260705-F 定案之 next-line 選項面（option surface）。
2. **明確排除 admin-ui 線**：admin-ui readiness 已由 `20260705-C` 專文登錄，避免本 inventory 又重複整理該篇之 questions（Q1–Q6）與 blockers。
3. **統一 idle-freeze-hold 立場**：明確標示所有剩下路徑均為 Dean-gated / dormant / blocked，避免下一個 session 誤讀為「可自主推進」。

本文件 **不** 是 action plan。**不** 排優先序、**不** 排時程、**不** 推薦哪條路徑最急。

---

## 4. Excluded path: admin-ui-draft-generator-first-test

**明確排除**。本文件不再處理下列項目，全部指向 `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`：

- 該篇之 content / frontmatter 檢視
- Public-readiness Q1–Q6（對外性、status flip、cover、date、洩漏風險、Blogger cross-mirror）
- Blockers（status flip 未授權、對外公開性未確認）
- Unknown（cover、date/updated、Blogger cross-mirror）
- 推進路徑 §8.1（Content flip / Prepublish / Build-only / Preview-only / Deploy / Online 驗收 6 步）

**本檔 §5–§7 之盤點皆假設此篇維持現況**：

- `status: draft` + `draft: true`
- `publishTargets.github.enabled: true`（但因 draft 一律被 build 排除）
- `publishTargets.blogger.enabled: false`
- 不在已 live 的 first GitHub Pages deploy（`1170e7e`）scope 內
- 不在 C1 刻意 quarantine 名單（該名單為 `github-pages-blog-planning`）

若 Dean 未來 explicit approve 推進該篇，會**另**開 phase，並產出獨立 ledger docs（content flip ledger / prepublish result / build ledger / deploy ledger）；本檔**不需**更新以配合該推進。

---

## 5. Low-risk immediate-deploy candidates

**Count = 0**（承 `docs/20260703-post-c1-next-deploy-candidates.md` §3 / `docs/20260704-c1-c1-verify-only-result.md` §5 結論）。

理由：目前所有 `status ∈ {ready, published}` **且** `publishTargets.github.enabled: true` 之文章皆已在 first GitHub Pages deploy（`1170e7e`）上線：

| slug | filename | site | status | github.enabled | live? |
|---|---|---|---|---|---|
| `what-is-design-token` | `content/github/posts/2026-06-30-what-is-design-token.md` | github | ready | true | ✅ |
| `github-pages-build-preview-workflow` | `content/github/posts/2026-07-01-github-pages-build-preview-workflow.md` | github | published | true | ✅ |
| `portable-blog-system-mvp` | `content/github/posts/20260504-portable-blog-system-mvp.md` | github | ready | true | ✅ |
| `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.md` | blogger（cross-mirror） | ready | true | ✅ |

因此下一批 GitHub Pages deploy 候選 **一律需要先由 Dean 動狀態 / 動 publishTargets / 解除 quarantine**；沒有「拿了就能 deploy」的低風險候選。

---

## 6. Remaining Dean-gated candidates

**所有候選項均為 Dean-gated**，Claude 不主動推進任一項。分為五類。

### 6.1 Content/frontmatter candidates

需先動 content edit（status flip / publishTargets flip / metadata 補齊）方能成為 deploy 候選；每項均需獨立 phase + explicit approval。

| ID | 對象 | 動作 | 目前狀態 |
|---|---|---|---|
| A | `github-pages-blog-planning`（C1 quarantine reversal） | 解除 C1 隔離；status draft → ready + `draft:false`；重跑 prepublish | 🔴 Dean-gated；C1 刻意 hold（online 404 by design） |
| B | Blogger ready article 之 GitHub Pages cross-mirror flip | 將 6 篇 blogger ready 文章（`after-work-writing-time-blocking` / `ai-tools-simplify-daily-workflow` / `blog-as-personal-knowledge-base` / `blog-restart-steady-rhythm-notes` / `daily-reading-habit-notes` / `reading-notes-three-questions`）之 `publishTargets.github.enabled: false → true`；各篇獨立決定；補 tags / cover / cross-link 亦獨立 | 🟡 Dean-gated；跨平台策略決定；本 inventory 不代為判斷哪篇適合 |

**不列入本類**（已由 `20260705-C` 專文處理）：`admin-ui-draft-generator-first-test`。

### 6.2 Docs-only candidates

不動 content / src / build / deploy；僅新增 docs 檔案。

| ID | 對象 | 動作 | 目前狀態 |
|---|---|---|---|
| C1-C | Read-only build readiness audit | 檢查 `build:github` script path + dist product mapping；不執行 build | 🟡 Dean-gated；per `docs/20260703-post-k5-next-line-readiness-inventory.md` §4.2 |
| K.3 | AdSense dashboard observation record | Dean-provided masked screenshot 才可 docs 化 | 🟡 Dean-gated；需 Dean-provided masked evidence |
| K.4 | GA4 P2 / P3 dimension expansion preanalysis 續作 | Dean-provided masked evidence 才可 docs 化 | 🟡 Dean-gated；per `docs/20260622-k4-ga4-p2-p3-dimension-expansion-preanalysis.md` |
| K.5 | Reverse UTM positive fixture reopen | K.5 已於 planning 階段 closed（C6 candidate-only）；只有 `docs/20260702-k5-reverse-utm-docs-index-note.md` §8 定義之 reopen path 可觸發 | ⏸ closed；reopen 需獨立 phase |

### 6.3 Src/Admin UI candidates

需動 `src/` / `views/` / `scripts/` / admin route；本 slice 未涵蓋。

| ID | 對象 | 動作 | 目前狀態 |
|---|---|---|---|
| Admin-R2+ | ADMIN R2+ 面板擴充 | dev-mode-only；不進 prod build | 🟡 Dean-gated；per CLAUDE.md §3a ADMIN idle freeze 條款 |
| Admin richer fields | New post draft form 擴欄位（description / searchDescription / cover / tags 多選等） | dev-mode-only | 🟡 Dean-gated；per `docs/20260630-*` idle-freeze bullets |
| Admin ready option | 新增 `status: ready` 選項於 New post draft form | 目前 export contract 固定 `status:"draft"` + `draft:true` | 🟡 Dean-gated；改動須通過 `check:admin-markdown-export` 256/256 regression |
| Admin write path activation | Apply / middleware / admin-write-cli / `--apply` / `dryRun:false` | 動作為 repo 寫入 | 🔴 dormant；per `memory/project_admin_write_path_status.md` |
| Loader migration | Post loader 相關 migration | 未定義 | 🟡 Dean-gated |

### 6.4 Build / preview candidates

需執行 `npm run build*` / `preview`；本 slice 未涵蓋。

| ID | 對象 | 動作 | 目前狀態 |
|---|---|---|---|
| Build-only run | `npm run build:github` / `build:blogger` / `build:promotion` / `build:sitemap` | 寫入 `dist/` / `dist-blogger/` / `dist-promotion/` | 🟡 Dean-gated；per CLAUDE.md §3a core operating rules（build 禁令） |
| Preview-only run | `npm run preview` | read-only 本機檢視 | 🟡 Dean-gated；per CLAUDE.md §3a |

### 6.5 Deploy / gh-pages candidates

需進入 deploy clone / push gh-pages；本 slice 未涵蓋。

| ID | 對象 | 動作 | 目前狀態 |
|---|---|---|---|
| Second GitHub Pages deploy | 任何新一批文章 deploy | 進入 `/d/github/blog-new/portable-blog-deploy` + push gh-pages | 🟡 Dean-gated；需先有 §6.1 或 §5 產生新的 low-risk 候選；per `docs/github-deploy.md` F-01 runbook |
| Reverse UTM pm-26 deploy | Blogger→GitHub 反向 UTM deploy + Blogger 後台重貼 + GA4 Realtime 驗收 | source 已 landed 未 deploy | 🔴 BLOCKED；per CLAUDE.md §3a red lines / `docs/reverse-utm-fixture-plan.md` §6 |

---

## 7. Blocked / dormant paths

以下路徑 **明確標示為 blocked / dormant**，本 inventory **不列入** §6 Dean-gated candidates；每項均需 **獨立 phase + explicit approval + 專屬 preflight** 才能考慮啟動。

| 路徑 | 狀態 | 說明 |
|---|---|---|
| Reverse UTM Blogger→GitHub deploy (pm-26 gate) | 🔴 BLOCKED / dormant | source 已 landed（`7e1d356` / `e2309e9` / `7c769fe`, 2026-05-23）；live 為 dormant；deploy 需獨立 phase + Blogger 後台手動重貼 + GA4 Realtime 驗收 |
| Admin write path (Apply / middleware / admin-write-cli / `--apply` / `dryRun:false`) | 🔴 dormant | per `memory/project_admin_write_path_status.md`；Admin dev-mode-only read-only 已 landed；write path 需獨立 phase + explicit approval |
| FB sidecar 真實寫入 | ⏸ dormant | 待 user 勾選 8 項 preflight；schema + ADMIN read-only dry-run 已 landed（Apply 永久 disabled） |
| Blogger AdSense Batch 2 P2 / P3 live repost | 🔴 BLOCKED | 至 explicit approval；per `docs/20260612-blogger-p2-ai-workflow-content-landing-record.md` |
| Blogger / GA4 / AdSense / Search Console / Google Drive 後台任何動作 | 🔴 永禁（by Claude） | per CLAUDE.md §29；只有 Dean-provided masked evidence 可 docs 化 |
| FB Graph / Blogger API / Google Drive API / 自動社群發文 / 留言 / View 數 / 讚數 / 會員 / 資料庫後端 / 真正後台登入 / 視覺化編輯器 | 🔴 第一版永禁 | per CLAUDE.md §29 |
| CLAUDE.md 大型 ledger 回寫 / 逐 phase 戰史回填 | 🔴 永禁 | per CLAUDE.md §3a Historical ledger replacement rule |
| Phase 1 final 之降級 / 重新封存 | 🔴 永禁 | per CLAUDE.md §3a Core operating rules |

---

## 8. Recommended default path

**Default = idle-freeze-hold.**

理由：

1. Low-risk immediate-deploy candidates = 0（§5）。任何 GitHub Pages 下一批 deploy 皆需先由 Dean 動狀態 / 動 publishTargets / 解除 quarantine。
2. 所有 §6 之候選皆為 Dean-gated；每項均需另開 phase + explicit approval，Claude 不主動推進。
3. 所有 §7 之路徑皆為 blocked / dormant / 永禁；不在 idle-freeze 期間可觸發。
4. 前置 verify-only baseline（`20260704-c1-c1-verify-only-result.md`）確認 build-readiness guards 全 PASS、無回歸；deploy clone 仍 `1170e7e` clean。系統於 idle-freeze 下處於一致狀態，**沒有** 需要立即修復的破口。
5. `20260705-C` 已把 admin-ui readiness 集中登錄，該篇維持 excluded / draft，本 inventory 無需再推進。

**若 Dean 開啟下一個 phase**，可能的最小起點（由 Dean 選）：

- `20260705-C` 之 §8.1（若 Dean 決定 admin-ui 對外，走 6 步 gated 推進）
- §6.1 A（`github-pages-blog-planning` quarantine reversal）
- §6.1 B（挑一篇 blogger ready 文章開 GitHub cross-mirror flip；例如 `blog-restart-steady-rhythm-notes`）
- §6.2 C1-C（read-only build readiness audit；docs-only）
- §6.2 K.3 / K.4（Dean-provided masked evidence 才可）

以上皆為**選項**，非**推薦**；本 inventory 不排優先序。

---

## 9. What this slice intentionally does not change

本 slice 唯一 mutation = 新增本檔 `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`（透過單一 additive commit 記錄）。

明確 **未變更 / 未執行** 之清單：

- ❌ 未修改 `content/**`（含 `content/github/posts/**` / `content/blogger/posts/**` / `content/settings/**` / `content/templates/**` / `content/validation-fixtures/**` / `content/drafts/**` / `content/archive/**` / `content/shared/**`）
- ❌ 未 flip 任何文章之 `status` / `draft` / `publishTargets` / `blogger.status` / `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`
- ❌ 未修改 `src/**`（含 `src/scripts/**` / `src/js/**` / `src/views/**` / `src/styles/**`）
- ❌ 未修改 `views/**` / `public/**`
- ❌ 未修改 `package.json` / `package-lock.json`
- ❌ 未修改 `CLAUDE.md`（保持在 38328 chars / 49967 bytes，遵守 40000 chars 管控線）
- ❌ 未修改 `MEMORY.md` / `memory/**`
- ❌ 未修改 `docs/20260703-post-c1-next-deploy-candidates.md`
- ❌ 未修改 `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`
- ❌ 未修改 `docs/20260704-c1-c1-verify-only-result.md`
- ❌ 未修改 `docs/20260703-post-k5-next-line-readiness-inventory.md`
- ❌ 未修改任何其他既有 docs file
- ❌ 未執行 `npm run dev` / `preview`
- ❌ 未執行 `npm run build*` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`
- ❌ 未執行 `npm run validate:content` 或任何 check guard（carry-forward CLAUDE.md §3a Validation baseline）
- ❌ 未觸碰 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/`
- ❌ 未觸碰 deploy clone `/d/github/blog-new/portable-blog-deploy`（仍 `1170e7e` / clean / 0/0）
- ❌ 未 push gh-pages / 未 deploy
- ❌ 未動 Blogger 後台 / GA4 / AdSense / Search Console / Google Drive
- ❌ 未 `npm install` / 未動 dependency
- ❌ 未新增 devDependency（無 Playwright / 無測試框架變更）
- ❌ 未推進 `admin-ui-draft-generator-first-test`（依 §4 明確 excluded）
- ❌ 未推進 Reverse UTM pm-26 / Admin write path / FB sidecar 真實寫入

---

## 10. Final status

**Inventory note only.** 本檔記錄 `20260705-F` 之 post-E next-line inventory 結論；低風險立即 deploy 候選 = 0；剩下路徑全部 Dean-gated 或 blocked / dormant；`admin-ui-draft-generator-first-test` 由 `20260705-C` 專文處理，本檔明確排除且維持 excluded / draft。

**Default next action = idle-freeze-hold**，除非 Dean 另行 explicit approve 開啟一個獨立 phase。Claude 不代為選擇路徑、不代為 flip、不代為 build、不代為 deploy。

本檔於下一個 Dean-gated phase 啟動前，**不需要再更新**；若 Dean 開啟下一個 phase，該 phase 會產出自己的 doc，本檔於 cross-links 被引用即可。

---

## 11. Cross-links

- `docs/20260703-post-c1-next-deploy-candidates.md` §2 / §3 / §4（candidate roster 權威來源）
- `docs/20260704-c1-c1-verify-only-result.md`（frozen verify-only baseline；本檔 §2 承接）
- `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`（20260705-C；本檔 §4 明確排除對象）
- `docs/20260703-post-k5-next-line-readiness-inventory.md`（K.1–K.5 candidate map；本檔 §6.2 承接）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（若 Dean 開啟推進，§4 pre-publish gate 為權威）
- `docs/20260702-k5-reverse-utm-docs-index-note.md`（K.5 reopen path §8）
- `docs/20260702-k5-c6-reverse-utm-fixture-role-decision-memo.md`（C6 = candidate-only）
- `docs/20260702-k5-c6-manual-verification-checklist.md`（future manual checklist）
- `docs/github-deploy.md`（F-01 deploy runbook）
- `docs/publish-workflow.md` §3–§4（build order authority）
- `CLAUDE.md` §3a Current state snapshot / Core operating rules / Validation baseline / Red lines / Recommended next paths
- `memory/project_admin_write_path_status.md`（Admin write path dormant 狀態）
- `memory/project_reverse_utm_status.md`（Reverse UTM pm-26 BLOCKED 狀態）

---

（本文件結束 / end of document）
