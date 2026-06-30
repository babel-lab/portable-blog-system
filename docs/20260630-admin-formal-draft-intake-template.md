# Admin — Formal Draft Intake Template（2026-06-30）

date: 2026-06-30
type: docs-only intake template（不建立正式 content；僅整理欄位準備清單）
scope: Admin UI Markdown draft export（dev-mode-only, export-only）

> docs-only。本文件**不**重複以下既有文件，只補「**產第一篇正式 draft 前，Dean 要先準備哪些欄位與確認點**」。
>
> See also（不重複，僅指路）：
> - `docs/20260630-admin-markdown-export-phase1-closeout.md`
> - `docs/20260630-admin-markdown-export-artifact-hygiene-workflow.md`
> - `docs/20260630-admin-markdown-export-next-phase-decision-packet.md`

---

## A. Purpose

- Phase 1 Admin Markdown export manual acceptance 已 **PASS**。
- artifact hygiene workflow 已落地（測試匯出 vs 正式 draft 分流）。
- 本 template 目的：讓 Dean 在產第一篇正式 draft 前，**先準備完整欄位**，
  避免把測試 artifact 當成正式 content commit，也避免欄位缺漏後反覆重匯。

---

## B. Current baseline

- baseline：
  - `cd3d084 docs(admin): add export artifact hygiene workflow`
- smoke：
  - `npm run check:admin-markdown-export` = `163/163 PASS`
- `CLAUDE.md`：
  - unchanged at `wc -m 40421 / wc -c 52884`
  - not edited because it exceeds 40k（本 session 刻意不碰 `CLAUDE.md`）

---

## C. Required draft inputs

產正式 draft 前，Dean 先把以下欄位準備好（或在 Admin UI 內確認）：

- site：`github`
- contentKind：`post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page`
- title
- titleEn
- slug
- date（`YYYY-MM-DD`）
- updated（`YYYY-MM-DD`）
- author：`Dean`
- category（必須存在於 `categories.json`，由 registry-bound `<select>` 選）
- tags（必須是 `tags.json` 既有 tag id；新 tag 不會自動寫入）
- description
- searchDescription
- cover / coverAlt
- status / draft（export 維持 `status: "draft"` + `draft: true`）
- canonical
- publishTargets.github
- publishTargets.blogger
- blocks settings（toc / adsense / hashtags / socialFollow / relatedPosts / sidebar 等）
- body Markdown content

---

## D. Registry checks before export

- category 必須從 **registry-bound `<select>`** 選（只能挑 registry 或留空）。
- tags 可手動輸入（datalist 僅輔助提示），但**不會自動寫入** `tags.json`。
- 若要新增正式 category / tag registry entry，必須**另開 settings / content policy slice**。
- **不**在 formal draft production slice 順手改 registry，除非 Dean 明確指定。

---

## E. Production workflow

1. Dean 先填好 C 欄位。
2. Dean 用 Admin UI 產 Markdown。
3. 先把輸出存 **repo 外或暫存位置**。
4. 人工確認 filename = date + slug + `.md`。
5. 人工確認 frontmatter / body boundary（body 在 closing `---` 之後）。
6. 人工確認無 helper / registry UI copy leak。
7. Dean 明確確認這是正式 draft。
8. 另開**最小 content commit slice**，才把檔案放入 `content/github/posts/`。
9. content commit slice 必須跑必要 validation。
10. 仍**不 deploy**，除非 Dean 另開 deploy phase。

---

## F. Stop conditions

遇到下列任一情況，停止，不要 commit：

- working tree 不乾淨。
- `.git/index.lock` 存在。
- smoke 失敗。
- filename 不符（非 date + slug + `.md`）。
- title 進 filename。
- helper copy 進 Markdown。
- `NPD_REGISTRY` / `categories.json` / `tags.json` 等 UI 殘留進 Markdown。
- category / tag registry 需要新增但尚未批准。
- Dean 尚未確認這是正式 draft。

---

## G. Not included

明確排除，**不**在本 session / 本 template 啟動：

- 不建立正式 content。
- 不啟動 category UI redesign。
- 不啟動 inbound Markdown import / restore-draft。
- 不啟動 Blogger live publish。
- 不啟動 deploy。
- 不改 Admin source。
