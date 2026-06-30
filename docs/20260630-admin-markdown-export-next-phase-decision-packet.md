# Admin Markdown Export — Next-Phase Decision Packet（2026-06-30）

date: 2026-06-30
type: docs-only decision packet（不做決策；僅整理選項供 Dean 挑選）
scope: Admin UI Markdown draft export（dev-mode-only, export-only）

本文件在 Phase 1 Admin Markdown export manual acceptance **PASS** 後，整理 Dean 下一步可走的路線。
docs-only，不動 source / content / settings / package / dist / gh-pages，不碰 `CLAUDE.md`，不啟動任何 option。

---

## A. Current state

- baseline：
  - `73d38e9 docs(admin): close markdown export manual acceptance`
  - branch = `main`、HEAD = origin/main、working tree clean、ahead/behind = `0/0`、`.git/index.lock` absent
- smoke：
  - `npm run check:admin-markdown-export` = `163/163 PASS`
- Phase 1 Admin Markdown export manual acceptance：**PASS**
  - result ledger：`docs/20260630-admin-markdown-export-manual-acceptance-result.md`
  - checklist：`docs/20260630-admin-markdown-export-manual-acceptance-checklist.md`
  - closeout ledger：`docs/20260630-admin-markdown-export-phase1-closeout.md`
- `CLAUDE.md`：
  - `wc -m 40421 / wc -c 52884`
  - not edited because it exceeds 40k（本 session 刻意不碰 `CLAUDE.md`）

---

## B. What is now safe / ready

- Admin UI 可用來填新文章草稿欄位（title / titleEn / slug / date / category / tags / description / searchDescription / body）
- Markdown export output 的 frontmatter/body boundary 已被 smoke + manual acceptance 雙重驗證
  - 開頭 `---`、frontmatter 後再 `---` 才接 body
- filename / target path = date + slug（`YYYY-MM-DD-<slug>.md`）
- title 不進 filename
- category 仍是 registry-bound `<select>`（只能挑 registry 或留空）
- tags 是 manual input / datalist-assisted（datalist 僅輔助提示；新 tag 不會自動寫入 `tags.json`）
- registry remains user-owned / read-only（無 persist UI、無 repo write path）
- no publish / no deploy path was activated（export-only；無 Apply / Save / auto-fix）

---

## C. Important constraint learned from manual acceptance

- 手測「下載 / 另存」的 `.md` 可能被瀏覽器放進 `content/github/posts/`
- 若只是測試 artifact，不能留在正式 content tree（Admin Markdown panel 設計為 export-only / 無 repo write path）
- 本次已做 exact-path cleanup：
  - `content/github/posts/2026-06-30-test-again.md`（exact path only；未用 `git clean`；working tree 已回 clean）
- 由 Dean 決定：實際要寫的正式 draft，要不要明確標記後再放入 content tree 並另開最小 slice commit（見 Option A）

---

## D. Next phase options（只列選項，不做決策）

1. **Option A：正式 draft production flow**
   - 用 Admin UI 產正式 draft Markdown
   - 人工確認後放入 `content/github/posts/`
   - 另開最小 slice commit 正式 draft（`status: draft` / `draft: true`）

2. **Option B：manual export hygiene improvement**
   - 補 docs / checklist 或 UI copy，提醒「測試匯出」不要直接落在 formal content tree
   - 不改核心 export flow（仍 export-only / 無 write path）

3. **Option C：category UX redesign**
   - 將 category 從 registry-bound `<select>` 改成 free-text / datalist
   - 需要 explicit approval + separate design phase
   - **目前不啟動**

4. **Option D：inbound Markdown import / restore-draft**
   - 新功能，不存在於目前 Admin Markdown panel（目前 export-only）
   - 需要 explicit approval + separate feature phase
   - **目前不啟動**

5. **Option E：Blogger / deployment path**
   - 仍不碰 live Blogger / deploy / Google services（GA4 / AdSense / Search Console / Drive / Form）
   - 各須獨立 phase + explicit approval
   - **目前不啟動**（維持安全邊界）

---

## E. Recommended next action

- 建議 Dean 先在 **Option A** 或 **Option B** 之間選：
  - 若只是想開始產正式內容 → 選 **Option A**
  - 若擔心測試 artifact 再污染 content tree → 先選 **Option B**
- 不要自動啟動 C / D / E（各須 explicit approval + 另開 phase）
- 本 session 維持 idle freeze，等 Dean 明確指定 option 後才推進
