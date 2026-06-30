# Admin Markdown Export — Artifact Hygiene Workflow（2026-06-30）

> docs-only / 操作流程備忘。本文件**不**重複 manual acceptance checklist 與 result 的內容，
> 只補「**測試匯出 vs 正式 draft**」的操作分流，避免測試 artifact 污染正式 `content/` tree。
>
> See also（不重複，僅指路）：
> - `docs/20260630-admin-markdown-export-manual-acceptance-checklist.md`
> - `docs/20260630-admin-markdown-export-manual-acceptance-result.md`
> - `docs/20260630-admin-markdown-export-next-phase-decision-packet.md`

---

## A. Purpose

- Phase 1 Admin Markdown export 的 **manual acceptance 已 PASS**。
- 手測過程發現：測試匯出的 `.md` 檔有可能被**誤放進** `content/github/posts/`。
- 本 workflow 的目的：**避免測試 artifact 污染正式 content tree**，
  並把「測試匯出」與「正式 draft」兩種情境的操作步驟明確分流。

---

## B. Current baseline

- baseline：
  - `c00093f docs(admin): add markdown export next phase decision packet`
- smoke：
  - `npm run check:admin-markdown-export` = `163/163 PASS`
- `CLAUDE.md`：
  - unchanged at `wc -m 40421 / wc -c 52884`
  - ⚠️ `CLAUDE.md` 已超過 40k；本 workflow 為 **docs-only**，
    **不**回寫 `CLAUDE.md`（避免再撐大；歷史 ledger 一律進 `docs/`）。

---

## C. Two export modes

匯出的 `.md` 一定要先判斷屬於哪一種模式，兩者**去處不同**。

### 1. Test export mode（測試匯出）

- 用於 UI smoke / manual acceptance / trial data。
- 下載檔應放在 **repo 外**，例如 Desktop / Downloads / temp folder。
- **不**放進 `content/github/posts/`（或任何 `content/` 子目錄）。
- **不** commit。
- 測完即可刪除。

### 2. Real draft mode（正式草稿）

- 用於 Dean 確認**要保留**的正式草稿。
- 匯出後**才**可以放進 `content/github/posts/`。
- 放入前需逐項確認：filename、frontmatter / body、category、tags、draft status。
- 應**另開最小 content commit slice**（不與其他變更混在一起）。

---

## D. Pre-save checklist

每次要把匯出的 `.md` 存進 repo 前，先過一遍：

- [ ] 這是**測試 artifact** 還是**正式 draft**？
- [ ] 若是測試：**不要**存進 repo content tree。
- [ ] 若是正式：確認檔名 = `date + slug + .md`。
- [ ] 確認 **title 沒有**進 filename。
- [ ] 確認 body 在 closing `---` **之後**。
- [ ] 確認檔案內**沒有** `NPD_REGISTRY` / helper copy / `categories.json` / `tags.json` 等 UI 殘留。
- [ ] 確認 category / tags 是否符合 registry policy。
- [ ] 確認 status / draft 是否符合預期（export 維持 `status: "draft"` + `draft: true`）。

---

## E. If a test artifact lands in content tree

萬一測試 artifact 不小心落進 content tree，處理原則：

- 停止，**不要** commit。
- 先確認 `git status --short`，看清楚到底多了哪個檔。
- **僅在 Dean 明確批准時**，刪除 exact artifact path。
- **不**使用 `git clean`。
- **不**刪其他 content。
- cleanup 後重新確認 working tree clean。

---

## F. Not included（本 workflow 範圍外）

明確排除，**不**在本 session / 本 workflow 啟動：

- 不啟動 category UI redesign。
- 不啟動 inbound Markdown import / restore-draft 功能。
- 不啟動 build / deploy / dev server。
- 不改 Admin source。
- 不碰 Blogger live 後台 / Google Form / Drive / GA4 / AdSense / Search Console。
