# 20260630 — Admin Markdown output boundary guard slice-a

Test-only slice ledger（external，**不**寫回 `CLAUDE.md`）。

## Baseline before ledger

- `3f6779d test(admin): lock markdown output frontmatter/body boundary`
- smoke：`npm run check:admin-markdown-export` = **163/163 PASS**
- previous slice touched source：`src/scripts/check-admin-markdown-export.js`（test-only，+74 行）

## Cases added

- **#162** — buildPostMarkdown output frontmatter/body boundary
- **#163** — UI helper / registry hint copy never leaks into exported markdown

## Policy locked

- exported markdown starts with frontmatter `---`
- closing frontmatter fence exists
- body content starts after the closing frontmatter fence
- expected metadata（`title` / `slug` / `date` / `category` / `tags`）stays in frontmatter region
- UI helper copy / registry hint copy 不得 leak into markdown output
- helper copy / registry JSON 檔名（`categories.json` / `tags.json` 等）remain UI/test context only，**not** exported content

斷言以 controlled fixtures（default body + explicit body）產生 export output 判斷，**非**全 source 掃描，合法文章 body 不誤傷。

## Reason for external ledger

`CLAUDE.md` already exceeds 40k（`wc -m 40421 / wc -c 52884`），此 sync 刻意避免編輯 `CLAUDE.md`。
