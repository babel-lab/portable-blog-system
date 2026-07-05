# 20260705-K Blogger to GitHub cross-mirror candidate comparison

- **Date**: 2026-07-05 (Asia/Taipei)
- **Type**: docs-only comparison note（**不** 修改 content / frontmatter / status / draft / publishTargets / cover / body、**不** build / preview / deploy、**不** 碰 gh-pages、**不** 修改 `CLAUDE.md` / `MEMORY.md` / `memory/`）
- **Predecessor session**: `20260705-J blogger-ready github-cross-mirror decision gate + final idle-freeze`（read-only decision gate；未動任何檔案；6 candidates confirmed；low-risk immediate-deploy candidates = 0；recommended first future candidate = `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` 但仍非 low-risk / 仍 Dean-gated）
- **Predecessor docs (context sources)**:
  - `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md` §6.1 B（Blogger ready → GitHub cross-mirror flip；每篇獨立決定；本 inventory 不代為判斷哪篇適合）
  - `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` §4（`github-pages-blog-planning` 維持 quarantined / draft；本 slice 亦不解除）
  - `docs/20260703-post-c1-next-deploy-candidates.md` §3（low-risk immediate-deploy candidates = 0；權威來源）
  - `docs/20260704-c1-c1-verify-only-result.md`（verify-only 之 frozen baseline；build-readiness guards 全 PASS；deploy clone 未動）
  - `CLAUDE.md` §3a first GitHub Pages deploy milestone（deploy scope = 3 github-native + 1 blogger-cross mirror `we-media-myself2`；後續 deploy 逐篇 Dean-gated）

---

## 1. Scope

本文件 **只是一份 comparison note**，用來把 `20260705-J` session（read-only Blogger ready → GitHub cross-mirror decision gate）之候選面（option surface）落地為 cold-start 可讀之單一參考點：

- 明確列出 6 篇 Blogger ready 之 GitHub cross-mirror **候選**。
- 明確列出 6 篇候選 **共同狀態**（status / draft / publishTargets / cover / canonical / Blogger backfill）。
- 明確登錄 low-risk immediate-deploy candidates = **0**。
- 明確登錄 recommended first future candidate = `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`，但 **仍非 low-risk / 仍 Dean-gated**。
- 明確登錄若 Dean 未來要推進，必須逐項另開 phase。

本 slice **唯一 mutation = 新增本檔一個 docs file**（透過單一 additive commit 記錄）。

本 slice **不推動、不批准、不執行**：

- content / frontmatter 修改
- `status` / `draft` / `publishTargets` / `cover` / body / canonical / date / updated / tags 修改
- Blogger `publishedUrl` / `bloggerPostId` / `publishedAt` backfill
- prepublish check / build / preview / deploy / gh-pages / dev server
- Blogger / GA4 / AdSense / Search Console / Google Drive 後台動作
- Admin write path / Apply / middleware / admin-write-cli
- Reverse UTM pm-26 / FB sidecar 真實寫入
- `CLAUDE.md` / `MEMORY.md` / `memory/` 修改
- `github-pages-blog-planning` quarantine 解除
- `admin-ui-draft-generator-first-test` 推進

所有實際 flip / cross-mirror / publish 決策 **完全在 Dean**。

**本檔不是 action plan、不是 ranking、不是 priority list、不是 checklist、不是 runbook。**

---

## 2. Frozen baseline used

Source repo（`/d/github/blog-new/portable-blog-system`；entry-of-session；本 slice 未動 baseline 值，只新增本檔）：

| 欄位 | 值 |
|---|---|
| branch | `main` |
| HEAD == origin/main | `f1cf2d7ac4e8aa49d69c38c048a8f42e15dd20d5` |
| short | `f1cf2d7` |
| subject | `docs(publish): record blog planning quarantine decision` |
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

`20260705-J` 已在該 session 內把 Blogger ready → GitHub cross-mirror decision gate 之候選面盤點完成並選擇 idle-freeze。本檔的存在目的：

1. **Cold-start anchor**：讓下一個新開 session 進入時，不需重掃 `content/blogger/posts/**` 或猜測「有哪幾篇」「共同狀態如何」「哪篇最適合當第一篇 cross-mirror test」，即可掌握 `20260705-J` 定案之 option surface。
2. **不代 Dean 決策**：明確標示 6 篇候選之共同狀態、差異點（tags / cover 檔名 / description），以及 recommended first future candidate 之 caveat，但不代 Dean 選、也不代 Dean 排序。
3. **明確保留 quarantine 立場**：`github-pages-blog-planning`（native github post；C1 quarantine）**不在** 本檔候選之列；該篇由 `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` 專文處理，本檔僅指向該文件、不重複推進。
4. **統一 idle-freeze-hold 立場**：明確標示所有候選皆為 Dean-gated；default next action 為 keep no-op / idle-freeze-hold，不推薦時程、不推薦優先序。

---

## 4. Selection criteria

「Blogger ready → GitHub cross-mirror 候選」之判定條件（**與 `20260705-J` 一致**）：

- `site: "blogger"`（承載於 `content/blogger/posts/**`）
- `status: "ready"`
- `draft: false`
- `publishTargets.blogger.enabled: true`
- `publishTargets.github.enabled: false`（**若為 `true` 且已 live，則已納入 first GitHub Pages deploy scope；不是「候選」，而是「已上線」**）

**已排除**（不列入本檔 6 篇候選之列）：

| 對象 | 排除原因 |
|---|---|
| `content/blogger/posts/20260515-we-media-myself2.md` | `publishTargets.github.enabled: true` + `status: ready`；已在 first GitHub Pages deploy（`1170e7e`）scope；per CLAUDE.md §3a milestone；已上線，非候選 |
| `content/github/posts/20260504-github-pages-blog-planning.md` | native github post；C1 quarantine（`status: draft` + `draft: true`）；per `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` §4；不在本檔 cross-mirror 候選之列 |
| `content/github/posts/2026-06-30-what-is-design-token.md` | native github post；`status: ready` + `github.enabled: true`；已在 first deploy scope；已上線 |
| `content/github/posts/2026-07-01-github-pages-build-preview-workflow.md` | native github post；`status: published` + `github.enabled: true`；已在 first deploy scope；已上線 |
| `content/github/posts/20260504-portable-blog-system-mvp.md` | native github post；`status: ready` + `github.enabled: true`；已在 first deploy scope；已上線 |
| `content/blogger/posts/**` 其餘 Blogger AdSense batch / older posts | 若 `status ≠ ready` 或 `draft: true`，一律排除；本 slice 不逐篇列舉 |
| `admin-ui-draft-generator-first-test` | native github post；`status: draft` + `draft: true`；per `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`；本檔明確排除 |

---

## 5. Candidate summary

**Candidate count = 6**（與 `20260705-J` 一致；與 `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md` §6.1 B 一致）。

**Low-risk immediate-deploy candidates = 0**（承 `docs/20260703-post-c1-next-deploy-candidates.md` §3 / `docs/20260704-c1-c1-verify-only-result.md` §5 結論；於本 slice 再次確認）。

6 篇候選 **共同狀態**（本 slice 未動任一欄位；讀值為 entry-of-session frontmatter）：

| 欄位 | 共同值 | 備註 |
|---|---|---|
| `site` | `blogger` | 全數承載於 `content/blogger/posts/**` |
| `contentKind` | `life-note` | 全數為生活筆記 |
| `primaryPlatform` | `blogger` | Canonical intent 目前指向 Blogger |
| `date` | `2026-06-12` | 全數為 2026-06-12 |
| `updated` | `2026-06-12` | 全數為 2026-06-12 |
| `author` | `Dean` | — |
| `category` | `life-note` | 全數屬 life-note 分類（registry-valid） |
| `status` | `ready` | 全數 ready |
| `draft` | `false` | 全數非 draft |
| `canonical` | `auto` | 全數 auto |
| `publishTargets.blogger.enabled` | `true` | 全數 Blogger 端 enabled |
| `publishTargets.blogger.mode` | `full` | 全數 Blogger full |
| `publishTargets.github.enabled` | `false` | **全數 GitHub 端未 flip**；為 cross-mirror 候選之核心欄位 |
| `publishTargets.github.mode` | `full`（僅存於 frontmatter；因 `enabled: false` 不生效） | — |
| `cover` | `/images/placeholders/cover-placeholder.svg` | **全數 placeholder**；非最終圖 |
| `coverAlt` | `<title> cover placeholder` | 全數 placeholder alt |
| `blocks.hashtags` | `true` | — |
| `blocks.socialFollow` | `true` | — |
| `blocks.sidebar` | `true` | — |
| `blocks.toc` / `adsenseTop` / `adsenseMiddle` / `adsenseBottom` / `relatedPosts` | `false` | — |
| `blogger.publishedUrl` / `bloggerPostId` / `publishedAt` | **未回填** | 6 篇之 frontmatter 均**無** `blogger:` 區塊之 backfill；本 slice 未查 Blogger 後台實際發布狀態 |
| author-manual sections（CTA / FAQ / hashtag / affiliate blocks / AdSense article-block） | 依 `memory/feedback_no_per_article_html_decorations.md` 政策 = 保持簡潔；本 slice 未修改 body | — |

---

## 6. Candidate comparison table

以下 6 篇候選之逐篇速覽（**本 slice 未修改任一篇**；表格為 read-only 讀值）：

| # | filename | slug | title | tags | description（節略） |
|---|---|---|---|---|---|
| 1 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | `after-work-writing-time-blocking` | 下班後，我用一小段時間整理自己的想法 | `reading-notes`, `self-growth` | 下班後不一定要安排很大的自我提升計畫，只要留一小段時間，把今天卡住的想法寫下來... |
| 2 | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | `ai-tools-simplify-daily-workflow` | AI 工具很多，真正有用的是把日常流程變簡單 | `self-growth` | AI 工具一波接一波，我用過一輪後發現，真正留下來的不是最酷的那些，而是默默把日常... |
| 3 | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | `blog-as-personal-knowledge-base` | 為什麼我開始把部落格當成自己的知識倉庫 | `self-growth`, `reading-notes` | 我一開始把部落格當成寫給別人看的東西，後來慢慢把它當成自己的知識倉庫... |
| 4 | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | `blog-restart-steady-rhythm-notes` | 個人部落格重啟筆記：先求穩定，再求流量 | `self-growth` | 隔了一段時間沒更新，這次重啟部落格我決定先不急著追什麼，而是先把穩定更新... |
| 5 | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | `daily-reading-habit-notes` | 我這一年養成每天閱讀的 5 個小方法 | `reading-notes`, `self-growth` | 分享我這一年真正養成每天閱讀的 5 個小方法... |
| 6 | `content/blogger/posts/20260612-reading-notes-three-questions.md` | `reading-notes-three-questions` | 讀完一本書後，我會問自己的 3 個問題 | `reading-notes`, `self-growth` | 讀完一本書不一定要寫長篇心得，但可以問自己 3 個問題... |

**表格說明**：

- 6 篇之 frontmatter 差異點 = 僅 `id` / `slug` / `title` / `description` / `searchDescription` / `coverAlt` / `tags` 之集合成員（`reading-notes` 是否納入）；其餘欄位 §5 已列為共同狀態。
- 6 篇均為 `contentKind: life-note`；無書評 / 無教具下載 / 無 tech-note；因此無 `book` / `download` / `affiliate` 區塊之依賴。
- 6 篇之 body 均已完稿（非 scaffold placeholder），與 `github-pages-blog-planning` 之 1 行 scaffold 之情況**顯著不同**。
- 6 篇之 body 已在 Blogger 端 ready；`blog-restart-steady-rhythm-notes`（#4）於 CLAUDE.md §3a 註記為「P3 content landed + Blogger LIVE published（2026-06-17）；live verification PASS」，其餘 5 篇之 Blogger live 狀態本 slice 未查（`memory/project_blogger_repost_acceptance_we_media_myself2.md` 僅覆蓋 `we-media-myself2`）。

---

## 7. Recommended first future candidate

**Candidate**: `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`

**理由**（與 `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md` §8「若 Dean 開啟下一個 phase」條列相同，本檔在此重述，僅為 cold-start 讀取方便）：

1. **本篇為 6 篇候選中，Blogger live 狀態最明確者**：CLAUDE.md §3a A1 內容線註記本篇於 2026-06-17 Blogger LIVE published + live verification PASS；其餘 5 篇之 Blogger live 狀態未於 CLAUDE.md 明確登錄，本 slice 亦未查 Blogger 後台。
2. **本篇主題「重啟部落格 / 先求穩定」與 GitHub Pages 站台（技術筆記 + 心得 + 經營筆記主站；per CLAUDE.md §2.2）之定位相容**：即使跨到 GitHub 站，與該站現有 3 篇 native tech-note + 1 篇 blogger-cross-mirror `we-media-myself2` 之基調不衝突。
3. **本篇 body 已完稿、非 scaffold**：與 `github-pages-blog-planning`（1 行 scaffold placeholder）之情境**顯著不同**；不會有 title 承諾 vs body 內容嚴重不符之對外品質風險。

**明確 caveat**：本篇被記為 recommended first future candidate，**不代表** 本檔推薦 Dean 現在推進；**不代表** 本篇為 low-risk；**不代表** deploy 可立即執行。詳 §8。

---

## 8. Why no candidate is low-risk yet

即使選擇上述 recommended first future candidate（或 6 篇任一），下列 **每一項** 均為未解決之 non-trivial blocker，導致「low-risk immediate-deploy」**不成立**：

1. 🔴 **Cover 仍為 placeholder**：6 篇之 `cover` 均為 `/images/placeholders/cover-placeholder.svg`；若跨 GitHub Pages 上線，站台首頁 / 列表 / 分類 / 標籤 / 文章詳細頁之 cover 呈現皆為 placeholder。與 GitHub Pages 站現有 4 篇 live post 之 cover 狀態不一致；建議先補真實 cover 再上線（advisory，非硬性阻擋）。
2. 🔴 **Blogger backfill 未回填**：6 篇之 frontmatter 均無 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`。若跨 GitHub Pages 上線，Blogger → GitHub cross-mirror 之 canonical 決策（primary Blogger vs primary GitHub）、cross-link 導流方向、GA4 UTM 之來源標記皆會受影響。**Claude 不 guess Blogger URL / postId**（per CLAUDE.md §3a Red lines）。
3. 🟡 **Canonical 決策未定**：6 篇之 `canonical: "auto"` + `primaryPlatform: "blogger"`；若 GitHub `enabled: true` flip 後，`canonical` 是否維持 auto？是否維持 primary Blogger？是否 flip primary GitHub？需 Dean explicit approval。
4. 🟡 **Cross-mirror strategy 未定**：Blogger → GitHub cross-mirror 策略之細節（是否每篇 GitHub Pages 端也開 relatedLinks 反向指回 Blogger？是否使用 reverse UTM Blogger → GitHub source？是否對 6 篇同時 flip 或逐篇 flip？）皆未由任何 docs 定案。目前 Blogger → GitHub reverse UTM 之 source 已 landed（pm-24a/b/c）但**未 deploy**（per CLAUDE.md §3a Red lines：Reverse UTM Blogger→GitHub deploy = dormant；pm-26 deploy gate = BLOCKED）。
5. 🟡 **life-note cross-mirror 未被充分驗證**：first GitHub Pages deploy 之 4 篇 scope 中，3 篇為 tech-note、1 篇為 blogger-cross-mirror `we-media-myself2`（`memory/project_blogger_repost_acceptance_we_media_myself2.md` 覆蓋 Blogger 端 manual paste PASS，但 GitHub 端 cross-mirror 之 online 驗收專屬本篇；per CLAUDE.md §3a）。GitHub Pages 端**尚無** `contentKind: life-note` 之 blogger-cross-mirror 已被驗證之先例；此外 life-note 之 cover / hashtag / socialFollow / sidebar block 於 GitHub Pages 端之 render 表現亦未有專屬 online 驗收記錄。
6. 🟡 **`we-media-myself2` 驗收面之 forward priorities 尚未展開**：per `memory/project_blogger_repost_acceptance_we_media_myself2.md` = 7 forward priorities recorded；AdSense / hashtag / CTA / FAQ / otherLinks 全 deferred；本檔不代為判斷這些 deferred 項是否影響下一篇 cross-mirror 之驗收。
7. 🟡 **6 篇候選數量本身之風險**：若 Dean 決定同時 flip 6 篇，會擴大 second GitHub Pages deploy 之 scope；逐篇獨立 phase 為較保守做法（per CLAUDE.md §3a first deploy milestone 之逐篇 Dean-gated 精神）；本檔不推薦「同時 flip 6 篇」或「先 flip 哪 X 篇」，僅列示 trade-off。

**上述任一項 blocker** 皆使「Low-risk immediate-deploy candidates = 0」之判定成立；未來若 Dean 逐項解決，才可能有候選晉升為 low-risk。

---

## 9. Dean decisions required before any flip

若 Dean 未來要考慮 flip 上述任一候選（含 recommended first future candidate 或其餘 5 篇），以下為 **每項均需 Dean explicit approval** 之獨立決策（依先後順序建議）：

1. **候選選擇決策**：先 flip 哪 1 篇（或幾篇）？逐篇 flip 或同時 flip？（Claude 不代為選擇；建議逐篇 flip 以保持 second deploy scope 保守）
2. **Cover 決策**：是否補真實 cover 圖？若補，圖片存放位置（`public/images/**` 或 Google Drive 或其他外部空間）與檔名規則？
3. **Blogger backfill 決策**：是否先由 Dean 於 Blogger 後台取得已發布之 `publishedUrl` + `bloggerPostId` + `publishedAt`，並手動回填 frontmatter？（Claude 不 guess；per CLAUDE.md §3a Red lines）
4. **Canonical 決策**：`canonical` 維持 `auto`？`primaryPlatform` 維持 `blogger`？或 flip 為 `github`？
5. **Cross-mirror strategy 決策**：跨 GitHub 後之 relatedLinks / otherLinks 是否新增 Blogger 反向指回？是否使用 reverse UTM？（reverse UTM deploy 目前 BLOCKED）
6. **`publishTargets.github.enabled` flip 決策**：`false → true`？此為 cross-mirror flip 之核心動作；未 Dean 明確授權前不執行。
7. **Prepublish guard 決策**：是否重跑 `npm run check:github-pages-prepublish`（16/16 期望）+ `check:github-pages-prepublish-smoke`（8/8 期望）+ `validate:content`（0/135/107 期望）？
8. **Build 決策**：是否執行 `npm run build:github`（含 `build:blogger` / `build:sitemap` 視 Blogger cross-mirror 決策而定）？
9. **Preview 決策**：是否執行 `npm run preview` 本機檢視？
10. **Deploy 決策**：是否進入 deploy clone（`/d/github/blog-new/portable-blog-deploy`）+ push gh-pages？
11. **Online 驗收決策**：是否 Dean 手動開啟對應 GitHub Pages URL 確認 online 200 + 內容正確 + cover 正確 + hashtag / socialFollow / sidebar render 正確？

以上每一步 **均需 Dean explicit approval**；Claude 不代為選擇、不代為 flip、不代為 backfill、不代為 build、不代為 deploy、不代為 online 驗收。

---

## 10. If Dean later wants to proceed

若 Dean 未來決定推進，**必須另開 phase**，且 phase 需嚴格分離（避免混搭）；以下為建議之最保守分階段順序（**單篇** 版本；若逐篇 flip 則每篇重跑此路徑，不同篇之 phase 不合併）：

- **Phase A（cover / blogger backfill / canonical / cross-mirror strategy 決策 docs-only）**：僅 docs 記錄 Dean 對本篇之 4 類決策；不改 content / 不 flip publishTargets / 不 build。
- **Phase B（cover 補上 + optional body 微調）**：只補 cover（若 Dean 決定補）；可含小幅 body 微調（如首段插入 GitHub Pages 讀者 context）；不 flip publishTargets / 不 build。
- **Phase C（Blogger backfill）**：只補 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`（若 Dean 決定補；資料由 Dean 從 Blogger 後台提供；Claude 不 guess）；不 flip publishTargets / 不 build。
- **Phase D（frontmatter cross-mirror flip）**：只 flip `publishTargets.github.enabled: false → true`；視 §9 canonical / primaryPlatform 決策同步調整（若有）；不 build。
- **Phase E（prepublish guard only）**：只跑 read-only prepublish guards；不 build / 不 deploy。
- **Phase F（build only）**：只跑 `npm run build:github`（視 Blogger cross-mirror 決策決定是否含 `build:blogger` / `build:sitemap`）；不 preview / 不 deploy。
- **Phase G（preview only）**：只跑 `npm run preview`；不 deploy。
- **Phase H（deploy / gh-pages）**：進入 deploy clone；push gh-pages；per `docs/github-deploy.md` F-01 runbook。
- **Phase I（online verification）**：Dean 手動 online 驗收。

**上述順序為建議最保守之分階段路徑；不代表 Dean 必須全走完；不代表 Claude 可代為推進。** 每 phase 均需 Dean explicit approval。

**本檔 §10 不是 action plan、不是 checklist、不是 runbook；僅為 comparison-note 之未來路徑提醒。**

---

## 11. What this slice intentionally does not change

本 slice 唯一 mutation = 新增本檔 `docs/20260705-blogger-github-cross-mirror-candidate-comparison.md`（透過單一 additive commit 記錄）。

明確 **未變更 / 未執行** 之清單：

- ❌ 未修改 `content/blogger/posts/20260612-after-work-writing-time-blocking.md`（含 frontmatter / body / cover / status / draft / publishTargets / canonical / date / updated / tags / description / searchDescription）
- ❌ 未修改 `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md`（同上）
- ❌ 未修改 `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md`（同上）
- ❌ 未修改 `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`（同上；即使為 recommended first future candidate 亦未改動）
- ❌ 未修改 `content/blogger/posts/20260612-daily-reading-habit-notes.md`（同上）
- ❌ 未修改 `content/blogger/posts/20260612-reading-notes-three-questions.md`（同上）
- ❌ 未修改上述 6 篇之 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`（未 backfill）
- ❌ 未修改上述 6 篇之 `.fb.md` sidecar（若存在）
- ❌ 未修改 `content/github/posts/20260504-github-pages-blog-planning.md`（維持 quarantined / draft；per `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`）
- ❌ 未修改 `content/github/posts/**` 之任何其他檔案
- ❌ 未修改 `content/blogger/posts/**` 之任何其他檔案
- ❌ 未修改 `content/settings/**`
- ❌ 未 flip 任何文章之 `status` / `draft` / `publishTargets` / `blogger.status` / `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`
- ❌ 未修改 `src/**`（含 `src/scripts/**` / `src/js/**` / `src/views/**` / `src/styles/**`）
- ❌ 未修改 `views/**` / `public/**`
- ❌ 未修改 `package.json` / `package-lock.json`
- ❌ 未修改 `CLAUDE.md`（保持 38328 chars / 49967 bytes；遵守 40000 chars 管控線）
- ❌ 未修改 `MEMORY.md` / `memory/**`
- ❌ 未修改 `docs/20260703-post-c1-next-deploy-candidates.md`
- ❌ 未修改 `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md`
- ❌ 未修改 `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md`
- ❌ 未修改 `docs/20260704-c1-c1-verify-only-result.md`
- ❌ 未修改任何其他既有 docs file
- ❌ 未執行 `npm run dev` / `preview`
- ❌ 未執行 `npm run build*` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`
- ❌ 未執行 `npm run validate:content` 或任何 check guard（carry-forward `CLAUDE.md` §3a Validation baseline）
- ❌ 未觸碰 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/`
- ❌ 未觸碰 deploy clone `/d/github/blog-new/portable-blog-deploy`（仍 `1170e7e` / clean / 0/0）
- ❌ 未 push gh-pages / 未 deploy
- ❌ 未動 Blogger 後台 / GA4 / AdSense / Search Console / Google Drive
- ❌ 未 `npm install` / 未動 dependency / 未動 lockfile
- ❌ 未新增 devDependency（無 Playwright / 無測試框架變更）
- ❌ 未解除 `github-pages-blog-planning` quarantine
- ❌ 未推進 `admin-ui-draft-generator-first-test`
- ❌ 未推進 Admin write path / Reverse UTM pm-26 / FB sidecar 真實寫入
- ❌ 未推薦時程、未推薦優先序、未推薦 flip 順序

---

## 12. Final status

**Comparison note only.** 本檔記錄 `20260705-J` read-only Blogger ready → GitHub cross-mirror decision gate 之候選面：

- Candidate count = **6**
- Low-risk immediate-deploy candidates = **0**
- Recommended first future candidate = `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`
- 該 candidate **仍非 low-risk**（詳 §8）；**仍 Dean-gated**（詳 §9 / §10）

**Default next action = keep no-op / idle-freeze-hold**，除非 Dean 另行 explicit approve 開啟一個獨立 phase（例如 docs-only comparison follow-up / single-article publishTargets flip phase / cover-補圖 phase / Blogger backfill phase）。Claude 不代為選擇路徑、不代為 flip、不代為 backfill、不代為 build、不代為 deploy。

本檔於下一個 Dean-gated phase 啟動前，**不需要再更新**；若 Dean 開啟推進 phase（cover / backfill / canonical / cross-mirror flip / build / preview / deploy），該 phase 會產出自己的 ledger doc，本檔僅於 cross-links 被引用即可。

---

## 13. Cross-links

- `docs/20260705-post-e-next-line-inventory-excluding-admin-ui.md` §6.1 B / §8（Blogger ready → GitHub cross-mirror flip；每篇獨立決定）
- `docs/20260705-github-pages-blog-planning-quarantine-decision-note.md` §4（`github-pages-blog-planning` 維持 quarantined / draft；本 slice 亦不解除）
- `docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`（`admin-ui-draft-generator-first-test` readiness；本 slice 明確排除）
- `docs/20260703-post-c1-next-deploy-candidates.md` §3（low-risk immediate-deploy candidates = 0；權威來源）
- `docs/20260704-c1-c1-verify-only-result.md`（verify-only 之 frozen baseline；build-readiness guards 全 PASS）
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（若 Dean 開啟推進，§4 pre-publish gate 為權威）
- `docs/reverse-utm-fixture-plan.md` §6（reverse UTM pm-26 deploy gate；BLOCKED）
- `docs/github-deploy.md`（F-01 deploy runbook；若 Dean 未來執行 §10 Phase H 使用）
- `docs/publish-workflow.md` §3–§4（build order authority）
- `CLAUDE.md` §3a Current state snapshot / Core operating rules / Validation baseline / Red lines / first GitHub Pages deploy milestone / Recommended next paths
- `memory/project_blogger_repost_acceptance_we_media_myself2.md`（Blogger repost 驗收面 forward priorities；本檔 §8-6 引用）
- `memory/feedback_no_per_article_html_decorations.md`（no per-article HTML decorations policy；本檔 §5 引用）
- `memory/project_reverse_utm_status.md`（pm-24a/b/c source landed；pm-26 deploy BLOCKED；本檔 §8-4 引用）
- `memory/project_admin_write_path_status.md`（Admin write path dormant；本檔 §11 引用）

---

（本文件結束 / end of document）
