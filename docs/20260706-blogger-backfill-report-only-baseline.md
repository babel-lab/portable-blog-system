# 20260706-P Blogger backfill report-only baseline

- **Date**: 2026-07-06 (Asia/Taipei)
- **Type**: docs-only baseline note（**不** 修改 content / frontmatter / status / draft / publishTargets；**不** 補 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt` backfill；**不** 猜測任何 Blogger metadata；**不** build / preview / deploy；**不** 碰 gh-pages / deploy clone；**不** 把 warning-only guard 改成 blocking；**不** 修改 `MEMORY.md` / `memory/`；**不** 動 Blogger / GA4 / AdSense / Search Console / Google Drive 後台）
- **Guard**: `src/scripts/check-blogger-backfill.js`（npm script `check:blogger-backfill`；上一輪 `c0ce545` landed）
- **Predecessor docs (context sources)**:
  - `docs/20260705-blogger-continuation-next-line-inventory.md`（`20260705-O`；Blogger 線盤點；recommended future first phase = Blogger backfill only）
  - `docs/20260617-night-blogger-p3-metadata-backfill-preflight.md`（P3 metadata backfill preflight；backfill 仍 Dean-gated）

---

## 1. Scope

本檔僅**登錄** `check:blogger-backfill` guard 在 `c0ce545` 之後、`2026-07-06` cold-start 場景下之 report-only baseline，作為未來 session 進入時之對照點，避免重跑盤點或誤判 guard 行為。

本 slice **唯一 mutation = 新增本 docs file**（單一 additive commit）。**不** 修改 guard、content、frontmatter、`CLAUDE.md`。

## 2. Guard 行為契約（verified 2026-07-06）

`check:blogger-backfill` 為 **report-only / warning-only** guard，經本輪逐項覆核確認：

1. 正常路徑 `return 0` → **exit 0**；唯 script crash / IO error 才 exit 1。
2. 即使有 candidate 缺 backfill，**不 fail**（warning-only）。
3. 全程只 `console.log`，**不寫任何檔**（僅 `fs.readFile`；無 write / mkdir）。
4. **不修改 frontmatter**（`gray-matter` 只 parse，從不 re-serialize 回寫）。
5. **不猜測** `publishedUrl` / `bloggerPostId` / `publishedAt`（`resolveBackfillValue` 只讀既有值：sidecar `.publish.json` > `.md` frontmatter fallback）。
6. output 清楚列出每筆 missing candidate（含 sidecar-present / sidecar-absent、status、缺哪些欄位、已 present 欄位來源）。

## 3. Report baseline snapshot（2026-07-06）

```
scanned:    12 .md file(s) under content/blogger/posts/
candidates: 7 (publishTargets.blogger.enabled === true AND status in [ready, published] AND draft !== true)
complete:   0
missing:    7
skipped:    5 non-candidate .md file(s)
exit code:  0
```

Candidates（全 missing backfill）：

| file | sidecar | status | missing |
| --- | --- | --- | --- |
| `content/blogger/posts/20260515-we-media-myself2.md` | present | ready | `bloggerPostId`（`publishedUrl` / `publishedAt` 已由 sidecar present） |
| `content/blogger/posts/20260612-after-work-writing-time-blocking.md` | absent | ready | `publishedUrl` / `bloggerPostId` / `publishedAt` |
| `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md` | absent | ready | 同上 3 欄 |
| `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md` | absent | ready | 同上 3 欄 |
| `content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md` | absent | ready | 同上 3 欄 |
| `content/blogger/posts/20260612-daily-reading-habit-notes.md` | absent | ready | 同上 3 欄 |
| `content/blogger/posts/20260612-reading-notes-three-questions.md` | absent | ready | 同上 3 欄 |

> backfill 值仍待 Dean 於 Blogger 後台實際發布後手動提供；本系統 **不猜測**、guard **不 fail**。此 baseline 為 report-only 觀測，非 blocking gate。

## 4. 未來若要推進 backfill（各須 Dean explicit approval）

- 補 backfill 值須由 Dean 提供**真實** Blogger published URL / postId / publishedAt（Claude 未登入 Blogger、不得推測）。
- 寫入位置慣例：`.publish.json` sidecar 優先（見 guard fallback 順序）。
- guard 維持 warning-only；**不**升級為 blocking，除非另開 phase + explicit approval。
