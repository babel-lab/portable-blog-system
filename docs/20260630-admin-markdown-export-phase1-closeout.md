# Admin Markdown Export — Phase 1 Closeout

date: 2026-06-30
type: docs-only closeout ledger
scope: Admin UI Markdown draft export (dev-mode-only, export-only)

本 ledger 收尾 Admin Markdown export 之 Phase 1 manual acceptance，並記錄下一階段決策由 Dean 明確指定。docs-only，不動 source / content / settings / package / dist / gh-pages。

---

## A. Baseline

- closeout baseline：`cfe68ef docs(admin): record markdown export manual acceptance`
- smoke baseline：`npm run check:admin-markdown-export` = `163/163 PASS`
- `CLAUDE.md`：`wc -m 40421 / wc -c 52884`
  - not edited because it exceeds 40k（本 session 不碰 `CLAUDE.md`）

---

## B. Manual acceptance status

- manual acceptance result：**PASS**
- manual acceptance checklist：`docs/20260630-admin-markdown-export-manual-acceptance-checklist.md`
- manual acceptance result ledger：`docs/20260630-admin-markdown-export-manual-acceptance-result.md`
- test route used：`localhost:5173/admin/#new-post-draft`
- test filename confirmed：`2026-06-30-test-again.md`
- Markdown confirmed：OK
  - filename = date + slug（user enter filename 流程）
  - helper / registry UI copy did **not** leak into exported Markdown
  - category remained registry-bound `<select>`（非 free-text input / datalist-assisted）

---

## C. Cleanup status

- exact untracked manual-test artifact removed：`content/github/posts/2026-06-30-test-again.md`
- cleanup was exact-path only
- no `git clean`
- no formal content kept or committed from the manual test

---

## D. Current locked guard baseline

- `check:admin-markdown-export` = `163/163 PASS`
- recent guard areas:
  - slug helper
  - date helper
  - tags helper
  - category registry-bound guard
  - registry ownership guard
  - offline mutation + credential guard
  - Markdown output frontmatter/body boundary
  - UI helper / registry copy no-leak guard
- filename / export target inspected and already covered
- inbound Markdown import not applicable because current panel is export-only

---

## E. Next phase decision notes（僅列選項，不做決策）

- Option 1：Dean 開始用 Admin UI 產正式 draft Markdown，再人工放入 content tree
- Option 2：若要降低測試 artifact 誤入 content tree，可另開 docs/checklist 或 UI copy 小 slice
- Option 3：若要 category free-text / datalist，需另開 explicit design phase
- Option 4：若未來要 inbound Markdown import / restore draft，需另開功能 phase

本 closeout **不啟動**以上任一 option。下一步須由 Dean 明確指定。
