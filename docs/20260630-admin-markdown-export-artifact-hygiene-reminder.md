# Admin Markdown Export Artifact Hygiene Reminder

date: 2026-06-30
type: docs-only user-facing reminder（短版；非 spec lock，非 phase report）
scope: Admin UI Markdown draft export（dev-mode-only, export-only）

> docs-only。本文件是 **短版 reminder**，不是 spec / workflow / phase report。
>
> 完整操作流程請看：
> - `docs/20260630-admin-markdown-export-artifact-hygiene-workflow.md`（test vs real draft 兩模式分流、pre-save checklist、artifact 落地後處理）
> - `docs/20260630-admin-formal-draft-intake-template.md`（正式 draft 欄位準備清單）
> - `docs/20260630-admin-markdown-export-next-phase-decision-packet.md`（Phase 1 之後可走路線）

---

## Purpose

Admin UI Markdown export / dogfood / manual smoke 產出的 `.md` 預設都是 **test artifact**，不是正式內容。

reminder 的用途：避免把 test artifact 直接丟進 production content tree 或 deploy clone，污染正式內容來源、validate baseline、或 gh-pages 部署輸出。

---

## Do not put test artifacts in production content trees

以下位置 **禁止** 直接放 test artifact：

- `content/github/posts/`
- `content/blogger/posts/`
- `content/settings/`
- 任何 `content/` 子目錄
- deploy clone（`/d/github/blog-new/portable-blog-deploy/`，含 `gh-pages` 任何路徑）

理由：

- `content/` 是 production 內容來源；任何 `.md` 進去都會被 validator / build / list / sitemap 認為是正式文章或 page。
- `content/settings/` 是 registry source-of-truth；test artifact 進去會被當成正式 settings change。
- deploy clone 是 `gh-pages` 已 build 結果；任何手動丟檔進去都會在下次 deploy slice 被當成衝突或殘留。

---

## Safe places for manual export testing

dogfood / manual smoke 產出的 `.md` 建議放：

- 系統 Desktop / Downloads（repo 外）
- 任何 `.gitignore` 已涵蓋之 temp folder
- repo 外之 external scratch folder（例如 `D:/BlogScratch/`）

操作原則：

- 測完即可刪除，不必保留。
- **不要** `git add` test artifact。
- **不要** 為 test artifact 跑 `npm run validate:content`（它不在 production set）。
- **不要** 把 test artifact 拿來練習 commit message。

---

## When a test artifact becomes a real draft

當 Dean 明確判斷一份 export 是「要保留的正式 draft」：

- 必須先過 `docs/20260630-admin-formal-draft-intake-template.md` §C 欄位清單。
- 必須 **另開最小 content commit slice**（單檔；不混入 docs / settings / source 變更）。
- 檔名必須 = `YYYY-MM-DD-<slug>.md`（title 不進 filename）。
- 維持 `status: "draft"` + `draft: true`（除非 Dean 明確要升 ready）。
- commit 前跑 `npm run validate:content` 確認 baseline 不退步。
- 仍 **不 deploy**，除非 Dean 另開 deploy phase。

---

## Pre-commit checklist

每次要 `git add` 或 commit 與 Admin Markdown export 相關之變更前，先過一遍：

- [ ] 這次 commit 是 **docs / source / content / settings** 哪一類？四者不可混。
- [ ] `git status --short` 列出之檔案是否都是本 slice 預期內？
- [ ] 是否有 test artifact `.md` 不小心 staged？若有，立即 unstage。
- [ ] 是否誤改 `CLAUDE.md`？（已 40421 chars，docs-only slice 不可動）
- [ ] 是否誤改 `MEMORY.md` / `memory/`？（除非是 memory-sync phase，不可動）
- [ ] 是否誤改 `content/settings/`？（registry 改動需獨立 phase）
- [ ] 是否誤改 deploy clone？（gh-pages 改動需獨立 deploy phase）
- [ ] commit message 是否反映實際 slice 類型（`docs(...)` / `content(...)` / `feat(...)` / 等）？

若任一項不確定 → 停止，不要 commit，回報 Dean 確認。

---

## Not included（本 reminder 範圍外）

本 reminder **不**啟動下列任何項目：

- 不改 Admin UI source。
- 不改 validator / smoke / guard。
- 不改 build / deploy。
- 不啟動 inbound Markdown import / restore-draft 功能。
- 不啟動 category UI redesign。
- 不碰 Blogger live / Google Form / Drive / GA4 / AdSense / Search Console。
