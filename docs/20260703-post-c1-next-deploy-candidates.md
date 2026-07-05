# Post-C1 Next-Deploy Candidates（GitHub Pages）

- 日期：2026-07-03
- 類型：docs-only read-only 盤點
- source repo HEAD（本盤點時）：`485401b`（`docs(state): compact claude state headroom`）
- deploy clone baseline：`1170e7e`（`deploy(github): publish first verified github pages scope`），read-only 驗證，本 session 未修改 deploy clone

> ⚠️ **本文件不是 deploy 指令，不能自動 publish / deploy。**
> 這只是一份「首次 GitHub Pages deploy 之後，下一批可由 Dean gate 決定是否 deploy 的候選盤點」。
> 任何實際 deploy 都必須另開 phase + Dean explicit approval，並經過 prepublish check + build + online 驗收。

---

## 1. 目前 first GitHub Pages deploy 已完成範圍

first deploy（C1 line，deploy commit `1170e7e`，live `https://babel-lab.github.io/portable-blog-system`）已上線範圍：

### 3 篇 github-native

| slug | filename | title | status | github.enabled |
| --- | --- | --- | --- | --- |
| `what-is-design-token` | `content/github/posts/2026-06-30-what-is-design-token.md` | 什麼是Design Token? | ready | true |
| `github-pages-build-preview-workflow` | `content/github/posts/2026-07-01-github-pages-build-preview-workflow.md` | GitHub Pages 本機建置與預覽流程筆記 | published | true |
| `portable-blog-system-mvp` | `content/github/posts/20260504-portable-blog-system-mvp.md` | Portable Blog System MVP 開發筆記 | ready | true |

### 1 篇 blogger-cross mirror

| slug | filename | site | status | github.enabled |
| --- | --- | --- | --- | --- |
| `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.md` | blogger | ready | true |

### Quarantine（刻意留 draft，online 404 by design）

| slug | filename | status | 說明 |
| --- | --- | --- | --- |
| `github-pages-blog-planning` | `content/github/posts/20260504-github-pages-blog-planning.md` | draft（`94385b1` flip） | C1 scaffold 隔離；build 排除 → online 404，非候選（見 §4） |

> 觀察：**目前所有 `status: ready`/`published` 且 `publishTargets.github.enabled: true` 的文章，皆已在 C1 上線。**
> 因此「立即可直接 deploy」的 low-risk 候選為 **0**；下一批候選一律需要先由 Dean 動狀態或動 publishTargets。

---

## 2. 下一波 GitHub Pages deploy 候選（read-only 盤點，不新增/不修改 content）

判斷「是否適合 GitHub Pages 下一波 deploy」的門檻：
`publishTargets.github.enabled: true` **且** `status ∈ {ready, published}`（draft 一律被 build 排除）。

### 2.1 github-native 文章（site: github）

| slug | filename | category | status | github.enabled | 適合下一波？ | prepublish 缺口 / 注意事項 | Dean gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `what-is-design-token` | `2026-06-30-what-is-design-token.md` | tech-note | ready | true | 已 live | — | 已 deploy |
| `github-pages-build-preview-workflow` | `2026-07-01-...workflow.md` | tech-note | published | true | 已 live | — | 已 deploy |
| `portable-blog-system-mvp` | `20260504-...mvp.md` | tech-note | ready | true | 已 live | contentKind=download，legacy download listing intentional hold（唯一 production warning `page-noindex-in-listings`） | 已 deploy |
| `admin-ui-draft-generator-first-test` | `2026-06-29-admin-ui-draft-generator-first-test.md` | tech-note | **draft** | true | 需先動狀態 | ① status draft→ready 由 Dean 決定；② `tags:` 目前為空，需補既有 tag id；③ `cover:""` 為空（非硬性阻擋，但建議補）；④ 內容為 admin 實測紀錄，需 Dean 確認是否對外 | ✅ 需 |
| `github-pages-blog-planning` | `20260504-...blog-planning.md` | tech-note | **draft（quarantined）** | true | 否（刻意 hold） | C1 已刻意隔離為 draft、online 404；解除須 Dean explicit un-hold（見 §4） | ✅ 需 |

### 2.2 blogger 文章之 GitHub Pages cross-mirror 候選

| slug | filename | status | github.enabled | 適合下一波？ | 注意事項 |
| --- | --- | --- | --- | --- | --- |
| `we-media-myself2` | `20260515-we-media-myself2.md` | ready | true | 已 live | 已為 C1 cross-mirror |
| `after-work-writing-time-blocking` | `20260612-...md` | ready | **false** | 否 | github.enabled=false → 非 GH Pages 候選；要納入須先改 publishTargets（content edit + Dean 決定） |
| `ai-tools-simplify-daily-workflow` | `20260612-...md` | ready | **false** | 否 | 同上 |
| `blog-as-personal-knowledge-base` | `20260612-...md` | ready | **false** | 否 | 同上 |
| `blog-restart-steady-rhythm-notes` | `20260612-...md` | ready | **false** | 否 | 同上（已於 Blogger LIVE） |
| `daily-reading-habit-notes` | `20260612-...md` | ready | **false** | 否 | 同上 |
| `reading-notes-three-questions` | `20260612-...md` | ready | **false** | 否 | 同上 |
| `sample-book-review` | `20260504-...md` | draft | (blogger only) | 否 | draft |
| `draft-book-review` | `20260525-...md` | draft | false | 否 | draft + github disabled |
| `phonics-practice-sheet-download` | `20260529-...md` | draft | false | 否 | draft + github disabled |
| `bopomofo-practice-cards-entry` | `20260626-...md` | draft | false | 否 | draft placeholder title |
| `bopomofo-practice-cards-access` | `20260626-...md` | draft | false | 否 | draft placeholder title + gated |

---

## 3. 風險分級

### low risk（可直接進 prepublish check 的候選）
- **0 個。** 所有 ready/published + github-enabled 文章皆已 live。

### medium risk（需先補 metadata / slug / cover / cross-link / 狀態才可考慮 deploy）
- **1 個：** `admin-ui-draft-generator-first-test`
  - 需：status draft→ready（Dean 決定是否對外）、補 `tags`、（建議）補 `cover`、內容對外性確認。
  - 之後才進 `check:github-pages-prepublish` + build + online 驗收。
  - **See also（2026-07-05 cross-link）**：`docs/20260705-admin-ui-draft-generator-first-test-readiness-note.md`（20260705-C 新增之 decision note only；已把此篇 medium candidate 之 readiness / blockers / Dean questions 集中登錄；該 note 未動 content / frontmatter，未 flip `status`/`draft`/`publishTargets`，未 build / preview / deploy；亦校正本節「`tags:` 目前為空」之描述——實測 `tags` 已填 `[github, vite, static-site]`，不再是 blocker。仍為 Dean-gated medium candidate）。

### blocked / 暫不 deploy 的候選
- `github-pages-blog-planning`：C1 刻意 quarantine，online 404 by design。解除須 Dean explicit un-hold + prepublish 重跑。
- 6 篇 blogger ready 文章（`after-work-...` / `ai-tools-...` / `blog-as-...` / `blog-restart-...` / `daily-reading-...` / `reading-notes-...`）：`github.enabled: false`，非 GitHub Pages 候選；要納入須先改 publishTargets（content edit + Dean 決定），屬另一條決策線。
- 其餘 blogger draft（`sample-book-review` / `draft-book-review` / `phonics-...` / `bopomofo-*`）：draft 且多為 github disabled，非候選。

**小計：low 0 / medium 1 / blocked（含非候選）：quarantine 1 + blogger-cross-disabled 6 + blogger-draft 5。**

---

## 4. 下一步建議

### 最小安全下一步
- **維持 idle freeze。** 目前沒有 low-risk「拿了就能 deploy」的候選；唯一 medium 候選（`admin-ui-draft-generator-first-test`）需要 Dean 先決定「這篇 admin 實測紀錄是否要對外」與是否 draft→ready，屬內容/發布決策，不由本盤點推動。

### 交由 Dean 決定的岔路（每條都需另開 phase + explicit approval）
1. **admin 實測紀錄對外化**：若 Dean 要 deploy `admin-ui-draft-generator-first-test`，先補 tags/cover + status flip + prepublish + build + online 驗收。
2. **解除 `github-pages-blog-planning` quarantine**：若要讓其上線，需 Dean explicit un-hold（推翻 C1 隔離決定）+ 重跑 prepublish。
3. **blogger ready 文章跨鏡到 GitHub Pages**：若要把某篇 blogger ready 文章（如 `blog-restart-steady-rhythm-notes`）也放上 GitHub Pages，需先改該篇 `publishTargets.github.enabled: false→true`（content edit）+ 跑 prepublish；屬跨平台策略決定。

### 明確界線
- 本文件僅為 read-only 盤點，**不 publish、不 deploy、不改 content 正文、不動 publishTargets、不動狀態**。
- 任何實際 deploy 皆須：Dean explicit approval → prepublish check → build → deploy clone → online 驗收，逐篇 gate。
