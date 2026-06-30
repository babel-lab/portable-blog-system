# Admin Markdown Export — 手動驗收結果（2026-06-30）

本文件簡短記錄 Dean 實際打開 Admin UI、填資料、匯出 Markdown 的手動驗收結果。
這是 `docs/20260630-admin-markdown-export-manual-acceptance-checklist.md` 的對應結果記錄，docs-only，不修改 `CLAUDE.md` / src / content / settings / package。

## A. Baseline

- checklist baseline：`09a26a1 docs(admin): add markdown export manual acceptance checklist`
- smoke baseline：`npm run check:admin-markdown-export` = `163/163 PASS`
- acceptance status：**PASS**
- external ledger 理由：`CLAUDE.md` already exceeds 40k，本結果刻意不編輯 `CLAUDE.md`

## B. Test artifact cleanup

- removed untracked manual-test artifact `content/github/posts/2026-06-30-test-again.md`
- 該檔為手動驗收時下載 / 另存產生，不應留在正式 content tree（Admin Markdown panel 設計為 export-only / 無 repo write path）
- 刪除限定該 exact path；未使用 `git clean`；未動其他 content / 正式文章
- 刪除後 working tree 回到 clean

## C. Manual test context

- route：`localhost:5173/admin/#new-post-draft`
- Dean reported：實際手測 OK
- screenshots reviewed by Dean / user supplied in chat
- console note：observed `contentscript.js` malformed chunk warnings appear to be browser extension warnings, not a project-source blocker, unless reproduced from project source later

## D. Input values used

- title：`test-again再測試`
- titleEn：`test-again`
- slug：`test-again`
- date UI：`2026/06/30`
- exported date：`2026-06-30`
- category：`tech-note`
- tags：`static-site`
- description：`test for UI again`
- searchDescription：`NONE`
- body：`NONE`

## E. Output confirmed

- preview / filename：`2026-06-30-test-again.md`
- exported frontmatter includes：
  - id：`20260630-test-again`
  - site：`github`
  - contentKind：`tech-note`
  - primaryPlatform：`github`
  - date / updated：`2026-06-30`
  - author：`Dean`
  - category：`tech-note`
  - tags：`static-site`
  - status：`draft`
  - draft：`true`
  - canonical：`auto`
  - blogger publish target disabled
- body after closing frontmatter fence：`NONE`

## F. Pass signals

- filename = date + slug + `.md`
- title does not enter filename
- category remains registry-bound select
- tags remain manual input / datalist-assisted
- Markdown starts with `---`
- body starts after closing `---`
- UI helper / registry copy did not leak into Markdown
- `categories.json` / `tags.json` did not appear in exported Markdown
- copy / download area appeared functional；copied status appeared

## G. Not covered / not changed

- no publish
- no deploy
- no gh-pages / dist publish
- no Blogger / GA4 / AdSense / Search Console / Drive / Form changes
- no inbound Markdown import / restore-draft tested（current Admin Markdown panel is export-only）
- no category UI redesign
