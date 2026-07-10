# Blogger backfill WP-02 true-value intake packet（docs-only；WP-02 pre-phase 空白填寫包）

- 建立日期：2026-07-10（Asia/Taipei；本 session 為當日晚間 slice）
- 類型：docs-only **WP-02 true-value intake packet**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md` / `memory/`）
- 對應 work package：`docs/20260710-phase2-next-work-scope-preanalysis.md` §4 **WP-01 → WP-02 bridging artifact**。前置 slice：
  - `docs/20260710-blogger-backfill-write-rehearsal-template.md`（WP-01；全 7 篇空白 rehearsal 表 + 3 rollback drill）
  - `docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md`（WP-01 follow-up；單篇 dry-run worksheet + 5 rollback drill）
  - `docs/20260710-blogger-backfill-wp02-intake-template.md`（WP-02 pre-phase intake template；rule 面）
  - `docs/20260710-blogger-backfill-seven-candidate-one-post-dry-run-report.md`（WP-01 follow-up；7 篇 dry-run report + missing metadata matrix）
- 目的：把「WP-02 intake template §D.1 之單篇 intake item 模板」擴展為 **7 篇具名空白填寫包**，讓 Dean 之後可以逐篇填入 Blogger 真值。本 doc 為 **未來 WP-02 approval 之對照工具 + 空白 intake source**，**不代 Dean 填任何真值**、**不代 Dean 決策啟動 WP-02**、**不新增 write script**、**不改任何 guard 語意**。
- 本輪界線（docs-only）：**不** build / **不** preview / **不** deploy / **不**碰 deploy clone 寫入 / **不**改任何 frontmatter / **不**改任何 sidecar `.publish.json` / **不**動 `check:blogger-backfill` guard 語意（維持 report-only / warning-only / exit 0）/ **不**動 `check:blogger-backfill:one-post` guard 語意 / **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / **不**碰 Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 / **不**動 `CLAUDE.md` / `MEMORY.md` / `memory/` / **不**新增 npm script / preview helper script / **不**動 `package.json` / `package-lock.json` / **不**把任何新 script 加進 `phase1-readiness` umbrella / **不**進入 WP-02 真實寫入。
- 本輪允許 mutation：新增本檔（唯一）+ 對應 commit + push origin/main。

---

## 0. Boot baseline（本 session 已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `79dec13` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full hash 補正 = `79dec137c8eae4de0282d7fe1500f01bb12f0c55`；subject `docs(blogger): report seven-candidate backfill dry run`（前一 slice 落地之 seven-candidate one-post dry-run report；`docs/20260710-blogger-backfill-seven-candidate-one-post-dry-run-report.md` 為當時唯一 mutation）。

Deploy HEAD full hash = `1170e7e14aaa7f3449999bf92b9c8586719a76b4`（read-only 驗證；本 session **未寫入** deploy clone；subject `deploy(github): publish first verified github pages scope`）。

Readiness / guard checks 本輪已跑（read-only；exit 0；詳 §9 verification snapshot）：`npm run check:blogger-backfill`（pre-mutation baseline snapshot）+ `npm run check:blogger-backfill:one-post -- --slug=we-media-myself2`（pre-mutation sanity）。

判定：baseline 完全一致；readiness 未 drift；backfill guard 維持 report-only；deploy clone 未動；`.git/index.lock` 皆 absent。

---

## A. Frozen baseline

### A.1 Source baseline（本 doc landing 前）

```
full hash: 79dec137c8eae4de0282d7fe1500f01bb12f0c55
short:     79dec13
subject:   docs(blogger): report seven-candidate backfill dry run
branch:    main == origin/main
tree:      clean
ahead/behind: 0 / 0
index.lock: absent
```

### A.2 Deploy baseline（read-only；本 session 未寫入）

```
full hash: 1170e7e14aaa7f3449999bf92b9c8586719a76b4
short:     1170e7e
subject:   deploy(github): publish first verified github pages scope
branch:    gh-pages == origin/gh-pages
tree:      clean
ahead/behind: 0 / 0
index.lock: absent
```

### A.3 Next frozen baseline（本 doc landing 後）

本 doc landing 後之 next frozen source baseline = 本 doc commit hash（於 §12 final report 中補正回報）；deploy 不動。

### A.4 Recent related slice chain（近期相關 slice；不含全部 phase）

```
79dec13  docs(blogger): report seven-candidate backfill dry run    ← 前一 slice（docs-only；7 篇 dry-run report + missing metadata matrix）
631ba5c  docs(blogger): add wp02 backfill intake template          ← WP-02 pre-phase intake template（rule 面）
b0b0488  chore(blogger): add one-post backfill dry-run script      ← source-only slice（one-post dry-run CLI + package.json 註冊）
5c92d15  docs(blogger): add one-post dry-run worksheet             ← WP-01 follow-up docs-only（單篇 dry-run worksheet + 5 rollback drill）
f1aec08  docs(blogger): add backfill rehearsal template            ← WP-01 docs-only（全 7 篇 rehearsal 空白表 + 3 rollback drill）
```

---

## B. Purpose

本 doc 為 **未來 WP-02 approval 之空白填寫包**（intake packet）：

- ✅ 讓 Dean 之後**人工填入** Blogger 真值（可於未來 approval message inline 引用本 doc 各 intake item 之填寫格式）
- ✅ 作為未來 WP-02 write phase 前之 **intake source**（Dean 可將本 doc 之空白 template 內容複製到 chat approval 中補值）
- ✅ 本文件本身 **不代表可寫入**（本 doc landing 不觸發任何 sidecar write / build / deploy）
- ✅ 本文件 **不能拿來推導、猜測、補造 Blogger metadata**（違反即 abort；per §F）
- ✅ Placeholder 值全為 space-only 或空字串（`""`）；本 doc **不填任何真值**

**明確聲明**：本 doc landing 後，WP-02 write phase 仍 **dormant / blocked**；本 doc **不是** write approval；不代 Dean 決策啟動 WP-02。

---

## C. Candidate source

本 §C 之 7 篇 candidate list = 本 session `npm run check:blogger-backfill` 之實測結果（§9.1 pre-mutation snapshot；與前 slice `seven-candidate one-post dry-run report` §D.8 summary 一致；未動）：

| # | slug | markdown path | expected sidecar path | sidecar status | matched by |
| --- | --- | --- | --- | --- | --- |
| 1 | `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.md` | `content/blogger/posts/20260515-we-media-myself2.publish.json` | present | frontmatter.slug |
| 2 | `after-work-writing-time-blocking` | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | `content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json` | absent | frontmatter.slug |
| 3 | `ai-tools-simplify-daily-workflow` | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.publish.json` | absent | frontmatter.slug |
| 4 | `blog-as-personal-knowledge-base` | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.publish.json` | absent | frontmatter.slug |
| 5 | `blog-restart-steady-rhythm-notes` | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json` | absent | frontmatter.slug |
| 6 | `daily-reading-habit-notes` | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | `content/blogger/posts/20260612-daily-reading-habit-notes.publish.json` | absent | frontmatter.slug |
| 7 | `reading-notes-three-questions` | `content/blogger/posts/20260612-reading-notes-three-questions.md` | `content/blogger/posts/20260612-reading-notes-three-questions.publish.json` | absent | frontmatter.slug |

**Guard baseline 對照**：`scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5`；本 session 實測；未動。

---

## D. Required / optional / not-Dean-required 分類

本 §D 明列各欄位之 required 分類；適用於本 §E 全部 7 個 intake item。

### D.1 Required if available（Dean 需提供）

以下欄位為 Dean **需從 Blogger 後台複製** 之真值；若 Dean 於未來 approval 中無法提供其中任一欄位，**不可** guess，**不可** 從其他來源推導；未提供者需明確標註「目前不可得」或 abort。

- **Blogger published URL**（`blogger.publishedUrl`）
  - 逐字元一致 with Blogger 後台顯示之正式網址
  - 含 `https://` / 大小寫 / `.html`
  - 不含 UTM / query string（純 canonical URL）
  - 符合 `docs/publish-json-schema.md` §5.3 契約（post case: `https://<blog-domain>/<yyyy>/<mm>/<permalink>.html`；page case: `https://<blog-domain>/p/<permalink>.html`）
- **Blogger publishedAt**（`blogger.publishedAt`）
  - ISO 8601 或 `YYYY-MM-DD`；逐字元一致 with 後台顯示之發布 / 更新時間戳
  - 可與 GitHub markdown frontmatter `date` 欄位**不同**（不視為錯誤；不視為 warning；不觸發 guard failure）
  - 若 Dean 明確標註「目前不可得」→ sidecar 欄位保持空字串 `""`；WP-02 write 仍可進行；`check:blogger-backfill` 仍會 warn（預期行為）

### D.2 Not Dean-required（系統欄位；一律留 `""`）

- **Blogger postId**（`blogger.bloggerPostId`）
  - API-only；Dean 手動於 Blogger 後台**不易取得**（UI 不直接顯示 postId；需查看 HTML source / URL query param / API dashboard）
  - **不列 Dean 必填**；一律留 `""`
  - 未來若系統 / Blogger API integration flow 落地（獨立 phase；未規劃）可由系統於 API response 自動補入
  - **絕不**從 publishedUrl / slug / date / title / GitHub metadata / CLAUDE.md 記載反推

### D.3 Optional（可選）

以下欄位為 optional metadata；Dean approval 中可附註（不進 sidecar schema；僅供 audit）：

- **evidence / screenshot / admin source**：Dean 可附後台截圖 URL / 描述（不進 sidecar；僅供 audit trail）
- **notes**：Dean 可附備註（例：Blogger URL 有特殊字元轉譯 / 該篇 publishedAt 落後 GitHub markdown date N 天 / 該篇 permalink 為 Dean 手動指定 / ...）

### D.4 Rules 摘要

```text
Required if available:
- Blogger published URL
- Blogger publishedAt

Not Dean-required:
- bloggerPostId

Optional:
- evidence / screenshot / admin source
- notes
```

**規則**：

- 若 Dean 無法取得 `bloggerPostId`，**不可**要求 Dean 手動提供
- 若未來系統 / API 能取得 `postId`，才可補入（獨立 phase）
- **不可**從 URL、日期、slug、title 反推 `postId`
- `publishedAt` 可以與 GitHub markdown `date` 不同，不是錯誤
- 沒有 `publishedUrl` / `publishedAt` 的 candidate **不可** write

---

## E. Intake items（7 篇具名空白填寫包；Dean 未來填值前**皆保持空白**）

以下 7 個 intake item 為本 §E 之核心內容。**本 doc 不填任何真值**；Dean 於未來 WP-02 approval 中 inline 使用（或以本 doc 之填寫格式為對照）；`Fixed identifiers` 區塊由 dry-run 實測填入；`Dean-provided Blogger true values` 區塊**保持空白**；`Review checklist before any future write` 區塊皆為 `[ ]` unchecked（Dean 未來手動勾選）。

**特別註記**（per §5 prompt）：`we-media-myself2` 之 `Fixed identifiers.current metadata status` 中，`publishedUrl` / `publishedAt` 為 **present from sidecar**（現有 sidecar 已有真值；由 dry-run 之 `PRESENT (from sidecar)` 標記識別），`bloggerPostId` 為 `MISSING`（API-only）。其他 6 篇之全部 3 欄皆為 `MISSING`。**不填任何 Blogger 真值於其他六篇**。

---

### E.1 Intake item 01 — `we-media-myself2`

#### Fixed identifiers

- markdown path: `content/blogger/posts/20260515-we-media-myself2.md`
- slug/id: `we-media-myself2`
- matched by: `frontmatter.slug`
- expected sidecar path: `content/blogger/posts/20260515-we-media-myself2.publish.json`
- current sidecar status: `[sidecar-present]`
- current metadata status:
  - publishedUrl: **PRESENT** (from sidecar)
  - publishedAt: **PRESENT** (from sidecar)
  - bloggerPostId: **MISSING**（API-only；一律留 `""`）
- current ready-for-write: **NO**
- reason: sidecar-present；`publishedUrl` / `publishedAt` 已由既有 sidecar 提供；`bloggerPostId` 屬 API-only（Dean 無法手動提供；不可猜）；WP-02 於本 slice = **recorded no-op**；**不建議** 作為 first slice

#### Dean-provided Blogger true values

- Blogger published URL: 
- Blogger publishedAt: 
- Blogger postId: `""`（一律留空；API-only；per §D.2）
- evidence / screenshot / admin source: 
- notes: 

#### Review checklist before any future write

- [ ] Dean explicitly selected this item for WP-02 write phase.
- [ ] Blogger published URL is copied from actual Blogger published page.
- [ ] Blogger publishedAt is copied from Blogger/admin evidence, or explicitly marked unavailable.
- [ ] bloggerPostId is not guessed.
- [ ] Expected sidecar path is confirmed.
- [ ] One-post dry-run was executed immediately before write.
- [ ] Future write session is separately authorized.

---

### E.2 Intake item 02 — `after-work-writing-time-blocking`

#### Fixed identifiers

- markdown path: `content/blogger/posts/20260612-after-work-writing-time-blocking.md`
- slug/id: `after-work-writing-time-blocking`
- matched by: `frontmatter.slug`
- expected sidecar path: `content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json`
- current sidecar status: `[sidecar-absent]`
- current metadata status:
  - publishedUrl: **MISSING**
  - publishedAt: **MISSING**
  - bloggerPostId: **MISSING**（API-only；一律留 `""`）
- current ready-for-write: **NO**
- reason: sidecar-absent；三值全缺；`create` case；Dean 尚未提供任何真值；blocked 直到 Dean approval 中明列 `publishedUrl` + `publishedAt` 真值

#### Dean-provided Blogger true values

- Blogger published URL: 
- Blogger publishedAt: 
- Blogger postId: `""`（一律留空；API-only；per §D.2）
- evidence / screenshot / admin source: 
- notes: 

#### Review checklist before any future write

- [ ] Dean explicitly selected this item for WP-02 write phase.
- [ ] Blogger published URL is copied from actual Blogger published page.
- [ ] Blogger publishedAt is copied from Blogger/admin evidence, or explicitly marked unavailable.
- [ ] bloggerPostId is not guessed.
- [ ] Expected sidecar path is confirmed.
- [ ] One-post dry-run was executed immediately before write.
- [ ] Future write session is separately authorized.

---

### E.3 Intake item 03 — `ai-tools-simplify-daily-workflow`

#### Fixed identifiers

- markdown path: `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md`
- slug/id: `ai-tools-simplify-daily-workflow`
- matched by: `frontmatter.slug`
- expected sidecar path: `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.publish.json`
- current sidecar status: `[sidecar-absent]`
- current metadata status:
  - publishedUrl: **MISSING**
  - publishedAt: **MISSING**
  - bloggerPostId: **MISSING**（API-only；一律留 `""`）
- current ready-for-write: **NO**
- reason: sidecar-absent；三值全缺；`create` case；Dean 尚未提供任何真值

#### Dean-provided Blogger true values

- Blogger published URL: 
- Blogger publishedAt: 
- Blogger postId: `""`（一律留空；API-only；per §D.2）
- evidence / screenshot / admin source: 
- notes: 

#### Review checklist before any future write

- [ ] Dean explicitly selected this item for WP-02 write phase.
- [ ] Blogger published URL is copied from actual Blogger published page.
- [ ] Blogger publishedAt is copied from Blogger/admin evidence, or explicitly marked unavailable.
- [ ] bloggerPostId is not guessed.
- [ ] Expected sidecar path is confirmed.
- [ ] One-post dry-run was executed immediately before write.
- [ ] Future write session is separately authorized.

---

### E.4 Intake item 04 — `blog-as-personal-knowledge-base`

#### Fixed identifiers

- markdown path: `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md`
- slug/id: `blog-as-personal-knowledge-base`
- matched by: `frontmatter.slug`
- expected sidecar path: `content/blogger/posts/20260612-blog-as-personal-knowledge-base.publish.json`
- current sidecar status: `[sidecar-absent]`
- current metadata status:
  - publishedUrl: **MISSING**
  - publishedAt: **MISSING**
  - bloggerPostId: **MISSING**（API-only；一律留 `""`）
- current ready-for-write: **NO**
- reason: sidecar-absent；三值全缺；`create` case；Dean 尚未提供任何真值

#### Dean-provided Blogger true values

- Blogger published URL: 
- Blogger publishedAt: 
- Blogger postId: `""`（一律留空；API-only；per §D.2）
- evidence / screenshot / admin source: 
- notes: 

#### Review checklist before any future write

- [ ] Dean explicitly selected this item for WP-02 write phase.
- [ ] Blogger published URL is copied from actual Blogger published page.
- [ ] Blogger publishedAt is copied from Blogger/admin evidence, or explicitly marked unavailable.
- [ ] bloggerPostId is not guessed.
- [ ] Expected sidecar path is confirmed.
- [ ] One-post dry-run was executed immediately before write.
- [ ] Future write session is separately authorized.

---

### E.5 Intake item 05 — `blog-restart-steady-rhythm-notes`

#### Fixed identifiers

- markdown path: `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`
- slug/id: `blog-restart-steady-rhythm-notes`
- matched by: `frontmatter.slug`
- expected sidecar path: `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json`
- current sidecar status: `[sidecar-absent]`
- current metadata status:
  - publishedUrl: **MISSING**
  - publishedAt: **MISSING**
  - bloggerPostId: **MISSING**（API-only；一律留 `""`）
- current ready-for-write: **NO**
- reason: sidecar-absent；三值全缺；`create` case；Dean 尚未提供任何真值；**caveat**：該篇 Blogger LIVE 於 2026-06-17（Dean 截圖佐證；per CLAUDE.md §3a A1 內容線 / `docs/20260617-blogger-p3-*`）；LIVE 狀態**不代表**可推導真值；backfill 真值仍待 Dean 從後台複製

#### Dean-provided Blogger true values

- Blogger published URL: 
- Blogger publishedAt: 
- Blogger postId: `""`（一律留空；API-only；per §D.2）
- evidence / screenshot / admin source: 
- notes: 

#### Review checklist before any future write

- [ ] Dean explicitly selected this item for WP-02 write phase.
- [ ] Blogger published URL is copied from actual Blogger published page.
- [ ] Blogger publishedAt is copied from Blogger/admin evidence, or explicitly marked unavailable.
- [ ] bloggerPostId is not guessed.
- [ ] Expected sidecar path is confirmed.
- [ ] One-post dry-run was executed immediately before write.
- [ ] Future write session is separately authorized.

---

### E.6 Intake item 06 — `daily-reading-habit-notes`

#### Fixed identifiers

- markdown path: `content/blogger/posts/20260612-daily-reading-habit-notes.md`
- slug/id: `daily-reading-habit-notes`
- matched by: `frontmatter.slug`
- expected sidecar path: `content/blogger/posts/20260612-daily-reading-habit-notes.publish.json`
- current sidecar status: `[sidecar-absent]`
- current metadata status:
  - publishedUrl: **MISSING**
  - publishedAt: **MISSING**
  - bloggerPostId: **MISSING**（API-only；一律留 `""`）
- current ready-for-write: **NO**
- reason: sidecar-absent；三值全缺；`create` case；Dean 尚未提供任何真值

#### Dean-provided Blogger true values

- Blogger published URL: 
- Blogger publishedAt: 
- Blogger postId: `""`（一律留空；API-only；per §D.2）
- evidence / screenshot / admin source: 
- notes: 

#### Review checklist before any future write

- [ ] Dean explicitly selected this item for WP-02 write phase.
- [ ] Blogger published URL is copied from actual Blogger published page.
- [ ] Blogger publishedAt is copied from Blogger/admin evidence, or explicitly marked unavailable.
- [ ] bloggerPostId is not guessed.
- [ ] Expected sidecar path is confirmed.
- [ ] One-post dry-run was executed immediately before write.
- [ ] Future write session is separately authorized.

---

### E.7 Intake item 07 — `reading-notes-three-questions`

#### Fixed identifiers

- markdown path: `content/blogger/posts/20260612-reading-notes-three-questions.md`
- slug/id: `reading-notes-three-questions`
- matched by: `frontmatter.slug`
- expected sidecar path: `content/blogger/posts/20260612-reading-notes-three-questions.publish.json`
- current sidecar status: `[sidecar-absent]`
- current metadata status:
  - publishedUrl: **MISSING**
  - publishedAt: **MISSING**
  - bloggerPostId: **MISSING**（API-only；一律留 `""`）
- current ready-for-write: **NO**
- reason: sidecar-absent；三值全缺；`create` case；Dean 尚未提供任何真值

#### Dean-provided Blogger true values

- Blogger published URL: 
- Blogger publishedAt: 
- Blogger postId: `""`（一律留空；API-only；per §D.2）
- evidence / screenshot / admin source: 
- notes: 

#### Review checklist before any future write

- [ ] Dean explicitly selected this item for WP-02 write phase.
- [ ] Blogger published URL is copied from actual Blogger published page.
- [ ] Blogger publishedAt is copied from Blogger/admin evidence, or explicitly marked unavailable.
- [ ] bloggerPostId is not guessed.
- [ ] Expected sidecar path is confirmed.
- [ ] One-post dry-run was executed immediately before write.
- [ ] Future write session is separately authorized.

---

## F. Ready-for-write 判斷規則

以下規則明列「單篇 intake item 何時 = ready for write」；本 doc landing 時 **7 / 7 皆 not ready**（Dean 尚未提供任何真值）。

### F.1 Ready for write = yes only when

1. Dean explicitly selects the item.
2. Blogger published URL is provided from a real source.
3. Blogger publishedAt is provided or explicitly marked unavailable with rationale.
4. Expected sidecar path is confirmed.
5. One-post dry-run passes immediately before write.
6. A separate write-phase session is opened and authorized.

### F.2 Ready for write = no when

- URL missing
- publishedAt missing without explanation
- item not explicitly selected
- value appears inferred or guessed
- sidecar path uncertain

### F.3 目前 ready-for-write 現況（本 doc landing 時）

| # | slug | ready for write? | reason |
| --- | --- | --- | --- |
| 1 | `we-media-myself2` | **NO** | sidecar-present；WP-02 = recorded no-op；不建議 first slice |
| 2 | `after-work-writing-time-blocking` | **NO** | 三值全缺；Dean 尚未提供 |
| 3 | `ai-tools-simplify-daily-workflow` | **NO** | 三值全缺；Dean 尚未提供 |
| 4 | `blog-as-personal-knowledge-base` | **NO** | 三值全缺；Dean 尚未提供 |
| 5 | `blog-restart-steady-rhythm-notes` | **NO** | 三值全缺；Dean 尚未提供（LIVE ≠ 可推導） |
| 6 | `daily-reading-habit-notes` | **NO** | 三值全缺；Dean 尚未提供 |
| 7 | `reading-notes-three-questions` | **NO** | 三值全缺；Dean 尚未提供 |

**Ready for write: 0 / 7**

**重申**：除非現有 sidecar 已經有真值（本 doc landing 時 = 僅 `we-media-myself2` 之 `publishedUrl` / `publishedAt` 為 sidecar-present；但 `bloggerPostId` 仍缺；WP-02 於該篇為 recorded no-op），也仍**不得自行標成 write-approved**。Ready-for-write 判定 = Dean 明列選擇 + Dean 提供真值 + 全部 6 條 §F.1 gate 通過。

---

## G. Forbidden actions

重申（cumulative；違反即 abort）：

- ❌ **不可** 從 Blogger URL 反推 `bloggerPostId`
- ❌ **不可** 用日期 / slug / title 假造 `bloggerPostId`
- ❌ **不可** 從 Blogger URL 反推 `publishedAt`（即使 URL 含 yyyy/mm；月份≠日期）
- ❌ **不可** 從 GitHub markdown frontmatter `date` 推導 Blogger `publishedAt`
- ❌ **不可** 從 slug 反推 Blogger `permalink`（雖然 `publishedUrl` 之 `<permalink>` 部分可拆解，但 Dean approval 中明列為準）
- ❌ **不可** 從 `we-media-myself2` sidecar 已有的 URL pattern 反推其他 6 篇的 URL
- ❌ **不可** 從 CLAUDE.md §3a 記載（例：P3 於 2026-06-17 Blogger LIVE published）反推 backfill 真值
- ❌ **不可** 寫 markdown frontmatter（Blogger metadata 一律寫入 `.publish.json` sidecar；per `docs/20260706-blogger-backfill-write-target-inventory.md`）
- ❌ **不可** 建立或修改 `.publish.json`（本 doc landing 不觸發任何 sidecar mutation）
- ❌ **不可** 大量批次寫入（首次 slice 一次最多 1 篇；per intake template §E.8）
- ❌ **不可** 觸發 deploy（`build:github` / `build:blogger` / `preview` / deploy / push gh-pages / 動 `dist/` / `dist-blogger/` / `.cache/` / deploy clone）
- ❌ **不可** 把本 intake packet 視為 write approval（本 doc = 空白填寫包；**不是** write phase approval；不代 Dean 決策）
- ❌ **不可** 新增 write script（本 doc landing 後 `blogger-backfill:one-post:write` **不存在**）
- ❌ **不可** 動 Blogger / AdSense / GA4 / Google Search Console / Google Drive / DNS / domain 後台
- ❌ **不可** 呼叫 Blogger API / Google API（未來 API flow 屬獨立 phase）
- ❌ **不可** 在未驗證前把 `check:blogger-backfill:one-post` 加進 `check:phase1-readiness` umbrella
- ❌ **不可** 動 `check:blogger-backfill` / `check:blogger-backfill:one-post` guard 語意
- ❌ **不可** 動 `check:phase1-readiness-contract` 之 forbidden token list

---

## H. Non-goals（本 doc 明確不做）

- ❌ **不代 Dean 選** first WP-02 candidate（§E 表為工具，非決策）
- ❌ **不代 Dean 填** 任何 Blogger 真值（`publishedUrl` / `publishedAt` / `bloggerPostId`）
- ❌ **不啟動** WP-02 write phase
- ❌ **不設計** WP-02 write script 之 CLI / behavior
- ❌ **不新增** `blogger-backfill:one-post:write` script
- ❌ **不新增** intake file schema
- ❌ **不改** `check:blogger-backfill` / `check:blogger-backfill:one-post` guard 語意
- ❌ **不改** `check:phase1-readiness-contract` 之 forbidden token list
- ❌ **不加** `check:blogger-backfill:one-post` 到 `phase1-readiness` umbrella
- ❌ **不改** `check:phase1-readiness` composition
- ❌ **不改** 任何 `.publish.json` sidecar
- ❌ **不改** 任何 markdown frontmatter
- ❌ **不觸發** build / preview / deploy
- ❌ **不動** deploy clone
- ❌ **不動** `CLAUDE.md` / `MEMORY.md` / `memory/`
- ❌ **不動** `docs/20260710-blogger-backfill-wp02-intake-template.md`（rule 面 intake template；已 landed；本 doc **不覆寫** / **不 downgrade**）
- ❌ **不動** `docs/20260710-blogger-backfill-seven-candidate-one-post-dry-run-report.md`（7 篇 dry-run report；已 landed；本 doc **不覆寫** / **不 downgrade**）

---

## 9. 本輪 verification snapshot（本 session 已跑；exit code 逐項記錄）

### 9.1 Pre-mutation snapshot

| # | 指令 | Exit | 結果摘要 |
| --- | --- | --- | --- |
| C-1 | `npm run check:blogger-backfill` | 0 | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5；PASS report completed（warning-only） |
| C-2 | `npm run check:blogger-backfill:one-post -- --slug=we-media-myself2` | 0 | matched via frontmatter.slug；sidecar-present；1/3 missing（bloggerPostId only；publishedUrl / publishedAt from sidecar） |

（本 doc 為 docs-only；本 session 於 doc 撰寫階段先跑 C-1 / C-2 作為 candidate list 及 metadata status 之來源；不動任何檔。）

### 9.2 Post-mutation snapshot（本 doc landing 後；於 commit 前逐項跑並回報 chat）

- `npm run check:blogger-backfill`
- `npm run check:blogger-backfill:one-post -- --slug=we-media-myself2`
- `npm run check:blogger-backfill:one-post -- --slug=blog-restart-steady-rhythm-notes`
- `npm run validate:content`
- `npm run check:phase1-readiness-contract`
- `npm run check:phase1-readiness`（if cost-acceptable）

期望：所有指令 exit 0；guard 數字未 drift；contract 22/22 PASS；readiness umbrella 16/16 PASS + smoke 8/8 PASS。

---

## 10. Recommendation

**本 doc landing 後之建議下一步**：

1. **Idle-freeze**（保守路徑；recommended）：本 doc landing 後，Dean 於未來 approval 時可依 §E 之空白 intake item 提供 first slice；不主動觸發。
2. **若 Dean 未來想擴充 rehearsal 系列**（各自為 docs-only follow-up slice；不代啟動）：
   - 補其他 candidate 之單篇 dry-run worksheet（per WP-01 follow-up 定位）
   - 補其他 rollback drill 情境（例：sidecar-present partial update mock）
   - 補 URL 格式 edge case 分析（例：Blogger 自訂 permalink 含特殊字元 / URL 轉譯）
   - 補 permalink 拆解對照表（sidecar `publishedUrl` 與 `permalink` / `publishYear` / `publishMonth` 之對應）
3. **若 Dean 未來想啟動 WP-02**（新 session；per intake template §E.7）：
   - 另開 session
   - 明列 first slice slug（per intake template §E.8 一次 1 篇）
   - 提供 §E.x 之 `Dean-provided Blogger true values` 真值（per §D.1 / §F.1）
   - 走 intake template §E.5 dry-run（`npm run check:blogger-backfill:one-post -- --slug=<slug>`）
   - 通過 intake template §E.1–§E.8 全部 gate + 本 doc §F 全部條件
   - 才進入 filesystem write

**Claude 於本 doc landing 後**：進入 **idle-freeze**；**不主動** 觸發任何 WP-02 動作、**不主動** 建議 Dean 選 first slice、**不主動** 補其他 rehearsal doc。

---

## 11. See also

- `docs/20260710-blogger-backfill-wp02-intake-template.md` — WP-02 pre-phase intake template（rule 面；§B 邊界 / §D.1 intake item 模板 / §E pre-write checklist / §F forbidden actions / §G suggested future command shape）
- `docs/20260710-blogger-backfill-seven-candidate-one-post-dry-run-report.md` — 7 篇 candidate 逐篇 dry-run report + missing metadata matrix + WP-02 implication
- `docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md` — WP-01 follow-up one-post dry-run worksheet（§8 dry-run command checklist / §9 diff review / §10 abort conditions / §11 future apply / §12 post-write verification / §13 5 rollback drill 情境）
- `docs/20260710-blogger-backfill-write-rehearsal-template.md` — WP-01 rehearsal template（全 7 篇空白 rehearsal 表 + 3 rollback drill 情境）
- `docs/20260710-phase2-next-work-scope-preanalysis.md` — Phase 2 next work scope preanalysis（WP-01/02/03/04 拆分）
- `docs/20260710-blogger-backfill-write-phase-preflight.md` — Blogger backfill write phase preflight（rules 面 / gate / dry-run / validation / rollback proposed）
- `docs/20260706-blogger-backfill-write-target-inventory.md` — canonical write target = `.publish.json` sidecar（不寫 markdown frontmatter）
- `docs/20260706-blogger-identity-and-backfill-strategy.md` — identity policy（`bloggerPostId` API-only；publishedAt vs GitHub markdown date 語意分離）
- `docs/20260706-blogger-backfill-report-only-baseline.md` — `check:blogger-backfill` guard 契約（report-only / warning-only / exit 0）
- `docs/publish-json-schema.md` — sidecar JSON schema（`_sample.publish.json` 為權威範本）
- `content/blogger/posts/_sample.publish.json` — sidecar 樣本檔（權威預設值）
- `content/blogger/posts/20260515-we-media-myself2.publish.json` — 唯一 sidecar-present 之 candidate 樣本
- `CLAUDE.md` §16.4 / §24 — Blogger 發布 URL 回填規則
- `CLAUDE.md` §3a Blogger backfill red lines — 不猜 URL / postId / publishedAt

---

## 12. Change log

| 日期 | 動作 | 檔案 | 說明 |
| --- | --- | --- | --- |
| 2026-07-10 | 新增（唯一 mutation） | `docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md` | 本 doc |

---

## 13. Final report（本 doc landing 收尾；於 commit + push 完成後於 chat 中輸出）

- 本輪做了什麼：docs-only；新增 WP-02 true-value intake packet（本 doc；7 篇具名空白填寫包 + required/optional/not-Dean-required 分類 + ready-for-write 判斷規則）
- 修改檔案清單：**新增** `docs/20260710-blogger-backfill-wp02-true-value-intake-packet.md`（僅此一檔）
- 7 篇 intake item 摘要：見 §E.1–§E.7；1 篇 sidecar-present（`we-media-myself2`；publishedUrl / publishedAt 已於既有 sidecar；bloggerPostId 一律留空）+ 6 篇 sidecar-absent（全 3 欄 MISSING；Dean 未提供任何真值；全保持空白）；ready-for-write = 0 / 7
- 驗證指令與 exit code：見 §9.2；於 commit 前逐項跑並回報 chat
- 新 source baseline：本 doc commit hash（於 chat 中回報 full hash / short hash / subject）
- deploy 是否未變：✅ 未變（`1170e7e14aaa7f3449999bf92b9c8586719a76b4`；本 session 未寫入）
- git status / ahead-behind / index.lock：commit + push 後 clean / 0 0 / absent
- BLOCKED / deferred：
  - WP-02 write phase 尚未開始（本 doc landing 不代啟動）
  - 7 / 7 candidates = NOT READY for write（Dean 尚未提供任何真值）
  - `blogger-backfill:one-post:write` script 未實作、不新增
  - Umbrella 未加新 script（維持 `phase1-readiness` 現況）
  - 其他 rehearsal follow-up（rollback drill 擴充 / URL edge case / permalink 拆解對照）未補（Dean 未來若需要，屬 WP-01 後續 slice）

**本 doc landing 後 Claude 進入 idle-freeze；不主動改動任何檔。**
