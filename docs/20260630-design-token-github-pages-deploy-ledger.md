# Design Token GitHub Pages Deploy Ledger

Date: 2026-06-30
Scope: Design Token article GitHub Pages deployment record
Type: docs-only ledger

## Source baseline

- Repo: `/d/github/blog-new/portable-blog-system`
- Branch: `main`
- Source commit: `f3fe1f84281786a97e5029b4592edbce141592e7`
- Subject: `content(github): mark design token draft ready`
- Working tree: clean
- Ahead/behind: 0/0
- `.git/index.lock`: absent
- `CLAUDE.md`: unchanged at `wc -m 40421 / wc -c 52884`

## Article

- Source file: `content/github/posts/2026-06-30-what-is-design-token.md`
- Title: `什麼是Design Token?`
- Slug: `what-is-design-token`
- Category: `tech-note`
- Tag: `static-site`
- Status: `ready`
- Draft: `false`
- GitHub target: enabled / full
- Blogger target: disabled / summary

## Validation and preview

- `check:admin-markdown-export`: 163/163 PASS
- `validate:content`: 0 error / 135 warning / 107 post
- Missing cover: warning-only / non-blocking
- Manual local preview: PASS
- Local preview URL checked: `http://localhost:5173/posts/what-is-design-token/`

## Deployment

- Deploy clone: `/d/github/blog-new/portable-blog-deploy`
- Deploy branch: `gh-pages`
- Deploy commit: `977ebc6`
- Deploy subject: `deploy(github): publish what-is-design-token article`
- Build: `npm run build` PASS
- Generated article: `dist/posts/what-is-design-token/index.html`

## Live verification

- Live URL: `https://babel-lab.github.io/portable-blog-system/posts/what-is-design-token/`
- Live check: HTTP 200, title correct, homepage list shows the article

## Blogger / Google boundary

- No `build:blogger`
- No `build:blogger-theme`
- No Blogger backend action
- No Google services action
- Blogger target remains disabled for this article

## Notes

- This ledger intentionally does not modify `CLAUDE.md` because it already exceeds 40k.
- Further changes such as cover metadata, Blogger publishing, or additional article edits require separate explicit slices.
