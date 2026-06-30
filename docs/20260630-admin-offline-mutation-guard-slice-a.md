# Admin offline mutation + credential guard — slice A (2026-06-30)

Docs-only ledger. CLAUDE.md is intentionally **not** edited here — it already
exceeds 40k chars, so this state sync lives in `docs/` instead.

## Baseline

- Before this ledger: `f452d37 test(admin): lock offline mutation + credential guard`
- Smoke: `npm run check:admin-markdown-export` = **161/161 PASS**
- Touched source from the previous slice (`f452d37`):
  - `src/scripts/check-admin-markdown-export.js` (test-only; +68 lines)

## Smoke cases added (previous slice)

- **#160** — Admin source ships no external mutation transport. Neither
  `src/views/admin/index.ejs` nor `src/scripts/admin-markdown-export.js`
  contains `fetch` / `XMLHttpRequest` / `axios` / `sendBeacon` / `WebSocket` /
  `EventSource`; `index.ejs` additionally carries no `<form>` submit and no
  `POST`/`PUT`/`PATCH`/`DELETE` request-method literal. First guard pinning
  `index.ejs`'s whole-file transport (#159 only scoped the registry panel).
- **#161** — Admin source embeds no service credential constant. Neither file
  contains `client_secret` / `access_token` / `refresh_token` / `private_key` /
  `Authorization:` / `Bearer <token>`. Specific literals only — bare
  `token` / `secret` / `credential` are left unscoped so the legitimate
  red-line prose and design-token mentions never false-trip.

## Policy locked

- Admin UI + Markdown export remain an **offline / static** local helper.
- No external mutation transport in `src/views/admin/index.ejs` or
  `src/scripts/admin-markdown-export.js`.
- No embedded service-credential constants in those two files.
- Registry (`categories.json` / `tags.json`) remains **user-owned / read-only**
  as previously locked by #158 / #159.
- Category UI redesign (`<select>` → free-text / datalist) remains **not
  approved** and must be a separate phase + explicit approval.

## Reason for external ledger

`CLAUDE.md` already exceeds 40k chars, so this sync intentionally avoids
editing `CLAUDE.md`.
