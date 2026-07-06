# Blogger backfill value intake template（2026-07-06）

docs-only 真值收集模板。供 Dean 之後從 Blogger 後台複製真實值後填入。

## 這份文件是什麼 / 不是什麼

- ✅ 只是一份**真值收集表**：Dean 手動從 Blogger 後台複製 `publishedUrl` / `bloggerPostId` / `publishedAt` 貼入此表。
- ✅ 資料來源 = **Blogger 後台**（各篇文章之已發布 URL / Post ID / 發布時間），由 Dean 提供。
- ❌ 本文件**不會**觸發 build。
- ❌ 本文件**不會**觸發 deploy。
- ❌ 本文件**不含**任何推測值；三個 backfill 欄位一律留白，標示 `Dean to provide`。
- ❌ 填表本身**不等於** backfill 寫入；實際把值寫入 frontmatter / sidecar 屬另一個 phase，**須 Dean explicit approval** 才可執行。

## Guard baseline（2026-07-06，`npm run check:blogger-backfill`）

- exit 0（report-only / warning-only）
- scanned: 12
- candidates: 7（`publishTargets.blogger.enabled === true` AND status ∈ [ready, published] AND `draft !== true`）
- complete: 0
- missing: 7
- skipped: 5（non-candidate）

Guard 檢查的三個 frontmatter 欄位（authoritative 名稱）：

- `blogger.publishedUrl`
- `blogger.bloggerPostId`
- `blogger.publishedAt`

## 7 篇 missing candidate

| # | source markdown path | sidecar | status | missing fields |
| --- | --- | --- | --- | --- |
| 1 | `content/blogger/posts/20260515-we-media-myself2.md` | present（`content/blogger/posts/20260515-we-media-myself2.publish.json`） | ready | `blogger.bloggerPostId` |
| 2 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | absent | ready | `blogger.publishedUrl`, `blogger.bloggerPostId`, `blogger.publishedAt` |
| 3 | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | absent | ready | `blogger.publishedUrl`, `blogger.bloggerPostId`, `blogger.publishedAt` |
| 4 | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | absent | ready | `blogger.publishedUrl`, `blogger.bloggerPostId`, `blogger.publishedAt` |
| 5 | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | absent | ready | `blogger.publishedUrl`, `blogger.bloggerPostId`, `blogger.publishedAt` |
| 6 | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | absent | ready | `blogger.publishedUrl`, `blogger.bloggerPostId`, `blogger.publishedAt` |
| 7 | `content/blogger/posts/20260612-reading-notes-three-questions.md` | absent | ready | `blogger.publishedUrl`, `blogger.bloggerPostId`, `blogger.publishedAt` |

## 真值收集區（Dean to provide）

> 規則：每格只填 Blogger 後台的**真實值**。不確定就留 `Dean to provide`，不要猜。

### 1. `20260515-we-media-myself2`

- source markdown: `content/blogger/posts/20260515-we-media-myself2.md`
- sidecar: `content/blogger/posts/20260515-we-media-myself2.publish.json`
- `blogger.publishedUrl`: （已存在於 sidecar，本輪不動）
- `blogger.bloggerPostId`: `Dean to provide`
- `blogger.publishedAt`: （已存在於 sidecar，本輪不動）
- note: 只缺 `bloggerPostId`。`publishedUrl` / `publishedAt` 已由 sidecar 提供。

### 2. `20260612-after-work-writing-time-blocking`

- source markdown: `content/blogger/posts/20260612-after-work-writing-time-blocking.md`
- sidecar: absent
- `blogger.publishedUrl`: `Dean to provide`
- `blogger.bloggerPostId`: `Dean to provide`
- `blogger.publishedAt`: `Dean to provide`
- note: sidecar 尚未建立；三值全缺。

### 3. `20260612-ai-tools-simplify-daily-workflow`

- source markdown: `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md`
- sidecar: absent
- `blogger.publishedUrl`: `Dean to provide`
- `blogger.bloggerPostId`: `Dean to provide`
- `blogger.publishedAt`: `Dean to provide`
- note: sidecar 尚未建立；三值全缺。

### 4. `20260612-blog-as-personal-knowledge-base`

- source markdown: `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md`
- sidecar: absent
- `blogger.publishedUrl`: `Dean to provide`
- `blogger.bloggerPostId`: `Dean to provide`
- `blogger.publishedAt`: `Dean to provide`
- note: sidecar 尚未建立；三值全缺。

### 5. `20260612-blog-restart-steady-rhythm-notes`

- source markdown: `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md`
- sidecar: absent
- `blogger.publishedUrl`: `Dean to provide`
- `blogger.bloggerPostId`: `Dean to provide`
- `blogger.publishedAt`: `Dean to provide`
- note: sidecar 尚未建立；三值全缺。（此篇 CLAUDE.md A1 內容線標記為 Blogger LIVE published 2026-06-17，但 backfill 三值仍待 Dean 從後台回填，本表不預填。）

### 6. `20260612-daily-reading-habit-notes`

- source markdown: `content/blogger/posts/20260612-daily-reading-habit-notes.md`
- sidecar: absent
- `blogger.publishedUrl`: `Dean to provide`
- `blogger.bloggerPostId`: `Dean to provide`
- `blogger.publishedAt`: `Dean to provide`
- note: sidecar 尚未建立；三值全缺。

### 7. `20260612-reading-notes-three-questions`

- source markdown: `content/blogger/posts/20260612-reading-notes-three-questions.md`
- sidecar: absent
- `blogger.publishedUrl`: `Dean to provide`
- `blogger.bloggerPostId`: `Dean to provide`
- `blogger.publishedAt`: `Dean to provide`
- note: sidecar 尚未建立；三值全缺。

## 下一步（各須 Dean explicit approval，本輪不執行）

1. Dean 填入上表真實值。
2. 另開 backfill 寫入 phase，把值寫進 frontmatter / 建立 sidecar。
3. 重跑 `npm run check:blogger-backfill` 驗證 complete 上升。
