# Admin Markdown Export — 手動驗收 Checklist（2026-06-30）

本文件是給 Dean 實際打開 Admin UI、填資料、匯出 Markdown 前的一份可照做手動驗收清單。
這不是規格大文件，只是操作驗收步驟與 pass / stop 條件。

## A. Repo baseline

- repo baseline：`f8fe65c docs(state): record markdown output guard baseline`
- branch = `main`、HEAD = origin/main、working tree clean、ahead/behind = `0/0`、`.git/index.lock` absent
- pre-slice smoke：`npm run check:admin-markdown-export` = `163/163 PASS`
- 本 checklist 為 docs-only，**不**修改 `CLAUDE.md` / src / content / settings / package files

## B. Manual acceptance scope

這份 checklist **只驗**：

- Admin UI 新文章草稿欄位
- Markdown export output
- filename / target path preview
- registry hints / warnings
- copy-to-clipboard / manual import flow display

**不驗**（皆超出本 slice）：

- Blogger live 後台
- 正式 deploy / gh-pages / dist 發佈
- Google Form / Drive / GA4 / AdSense / Search Console
- category UI redesign
- inbound Markdown import / restore-draft（目前不存在；面板為 export-only）

## C. Suggested manual test steps

1. 啟動 dev server：**由 Dean 另行啟動**（本 checklist 不實際啟動 server）。
2. 打開 Admin UI（dev-mode-only route `/admin/#new-post-draft`）。
3. 新增一筆測試草稿。
4. 填 `title`。
5. 填 `titleEn`（或留空，確認非必填行為符合預期）。
6. 填 `slug`，確認 summary target 變成 date + slug `.md`。
7. 選 `category`，確認 category 是 registry-bound `<select>`（只能挑 registry 或留空）。
8. 填 `tags`，確認 tags 可手動輸入、datalist 僅為輔助提示、新 tag 不會自動寫入 `tags.json`。
9. 匯出 / copy Markdown。
10. 確認 Markdown frontmatter / body boundary（開頭 `---`、frontmatter 後再 `---` 才接 body）。
11. 確認 UI helper / registry copy 沒進 Markdown output。
12. 確認 filename / target path 與 summary target 一致（date + slug `.md`）。

## D. Pass signals

- smoke `163/163 PASS`
- export filename 是 date + slug
- title 不進 filename
- Markdown starts with `---`
- body after closing `---`
- exported markdown 中無 `NPD_REGISTRY` / helper copy / registry JSON 檔名
- registry 仍維持 user-owned / read-only（無 persist UI）

## E. Stop conditions

發現以下任一狀況就**停止，不要自行修**，直接回報：

- working tree 不乾淨
- `.git/index.lock` 存在
- smoke 失敗
- exported markdown 出現 helper copy
- filename 不符合 date + slug
- category UI 需求變成 free-text / datalist —— 這需要 user 明確批准 + 另開 phase，本 session 不做
