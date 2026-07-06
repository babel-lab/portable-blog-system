# Blogger backfill write-target inventory（2026-07-06）

Session：`260706-W / document blogger backfill write-target inventory`

本文件把上一輪 **read-only** Blogger backfill write-target inventory 的結論落成 docs-only 記錄。

> ⚠️ 本文件**不是** backfill data source，**不包含**任何 Blogger 真值。
> Claude 不得猜 `publishedUrl` / `bloggerPostId` / `publishedAt`。
> 真正的 backfill write phase 必須等 Dean 提供 Blogger 後台真值 + explicit approval 才啟動。

---

## 1. Baseline（本輪開局實測）

- source repo：`/d/github/blog-new/portable-blog-system`
- branch：`main`
- HEAD = origin/main：`0d2cc67`（subject `docs(state): sync blogger backfill intake baseline`）
- working tree：clean、ahead/behind 0/0、`.git/index.lock` absent
- `CLAUDE.md`：`wc -m` 38693 / `wc -c` 50376（target < 40000，仍有 headroom）

Backfill guard 實測（`npm run check:blogger-backfill`，report-only / warning-only）：

```text
exit 0
scanned:    12
candidates: 7
complete:   0
missing:    7
skipped:    5
```

candidate 判定 = `publishTargets.blogger.enabled === true` AND `status ∈ [ready, published]` AND `draft !== true`。

---

## 2. Write-target 結論（canonical metadata location）

| 項目 | 結論 |
| --- | --- |
| canonical metadata location | **`.publish.json` sidecar** |
| frontmatter `blogger` block | legacy fallback，**不建議寫入** |
| practical source of truth | sidecar |
| future backfill minimal write scope | **只動對應 `.publish.json` sidecar** |

Future backfill write phase 的邊界（write phase 才做，本文件不做）：

- ✅ 只動對應文章的 `.publish.json` sidecar
- ❌ 不碰 markdown frontmatter
- ❌ 不 build
- ❌ 不 deploy
- ❌ 不碰 deploy clone（`D:\github\blog-new\portable-blog-deploy`）

---

## 3. Sidecar schema 摘要

範本：`content/templates/_sample.publish.json`（`schemaVersion: 1`）。

top-level 欄位：`schemaVersion` / `canonical` / `ogImage` / `blogger` / `github` / `seo`。

Blogger backfill 相關欄位位於 `blogger` block：

- `publishedUrl`
- `bloggerPostId`
- `publishedAt`
- （相關欄位：`type` / `permalink` / `status` / `publishYear` / `publishMonth` / `history[]`）

---

## 4. 目前 7 篇缺口

### 4.1 已有 sidecar（只缺 1 欄）

| slug | sidecar | missing |
| --- | --- | --- |
| `we-media-myself2` | `content/blogger/posts/20260515-we-media-myself2.publish.json`（present） | `blogger.bloggerPostId` |

實測：該 sidecar `blogger.publishedUrl`（`https://babel-lab.blogspot.com/2026/05/we-media-myself2.html`）與 `blogger.publishedAt`（`2026-05-15`）已存在，`bloggerPostId` 為空字串。

### 4.2 sidecar absent（各缺三值）

以下 6 篇 `20260612-*` 目前 **sidecar absent**，各缺 `blogger.publishedUrl`、`blogger.bloggerPostId`、`blogger.publishedAt`。

---

## 5. 6 篇 `20260612-*` markdown → future sidecar target mapping

| # | markdown path | future sidecar target path | missing fields |
| --- | --- | --- | --- |
| 1 | `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | `content/blogger/posts/20260612-after-work-writing-time-blocking.publish.json` | publishedUrl, bloggerPostId, publishedAt |
| 2 | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.publish.json` | publishedUrl, bloggerPostId, publishedAt |
| 3 | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | `content/blogger/posts/20260612-blog-as-personal-knowledge-base.publish.json` | publishedUrl, bloggerPostId, publishedAt |
| 4 | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.publish.json` | publishedUrl, bloggerPostId, publishedAt |
| 5 | `content/blogger/posts/20260612-daily-reading-habit-notes.md` | `content/blogger/posts/20260612-daily-reading-habit-notes.publish.json` | publishedUrl, bloggerPostId, publishedAt |
| 6 | `content/blogger/posts/20260612-reading-notes-three-questions.md` | `content/blogger/posts/20260612-reading-notes-three-questions.publish.json` | publishedUrl, bloggerPostId, publishedAt |

（sidecar target path = markdown path 的 `.md` → `.publish.json`；建立為 write phase 動作，本文件不建立。）

---

## 6. 硬性聲明（不可違反）

- 本文件**不是** backfill data source。
- 本文件**不包含** Blogger 真值。
- Claude **不得猜** `publishedUrl` / `bloggerPostId` / `publishedAt`（亦不得猜 `bloggerUrl`）。
- 真正 write phase 必須等 **Dean 提供 Blogger 後台真值 + explicit approval** 才啟動。
- backfill 值的 intake 入口見 `docs/20260706-blogger-backfill-value-intake-template.md`（intake template 亦僅列缺口、未填任何推測值）。

---

## 7. 未來建議切片（各須 Dean explicit approval；本輪不執行）

- **Slice A**：只補 `we-media-myself2` 既有 sidecar 的 `blogger.bloggerPostId`（單欄、單檔）。
- **Slice B**：6 篇 `20260612-*` 新建 `.publish.json` sidecar（各檔填三值）。

每個 slice 的邊界：

- 只動對應 sidecar
- 不碰 frontmatter / `src` / `package.json` / lockfile / `CLAUDE.md` / deploy clone
- 不 build / 不 deploy
- 不填任何 `publishedUrl` / `bloggerPostId` / `publishedAt` 推測值

完成後回到 idle-freeze。
