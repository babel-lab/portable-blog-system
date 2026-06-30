# Admin registry ownership guard — baseline (2026-06-30)

Docs-only ledger. CLAUDE.md is intentionally **not** edited here — it already
exceeds 40k chars, so this state sync lives in `docs/` instead.

## Baseline

- Before this ledger: `44b7f4f test(admin): lock registry ownership guard`
- Smoke: `npm run check:admin-markdown-export` = **159/159 PASS**
- Touched source from the previous slice (`44b7f4f`):
  - `src/scripts/check-admin-markdown-export.js` (test-only; +68 lines)

## Smoke cases added (previous slice)

- **#158** — Admin source must not write registry JSON files
  (`admin-markdown-export.js` has no fs write / fetch / `POST`/`PUT`/`PATCH`
  paired with `categories.json` / `tags.json`).
- **#159** — Registry injection remains read-only / user-owned
  (`window.NPD_REGISTRY` read-only snapshot; no Add/Edit/Delete/Save/Apply UI;
  tags helper keeps the "新 tag 不會自動寫入 tags.json" caveat).

## Policy locked

- `categories.json` / `tags.json` remain **user-owned**.
- Admin Markdown export must **not** auto-write registry JSON.
- `window.NPD_REGISTRY` remains a **read-only snapshot / hint source**.
- Tags field keeps free-text + datalist (hint-only) behaviour.
- Category remains a `<select>` registry-bound control.
- Category UI redesign (`<select>` → free-text / datalist) is **not approved**
  and must be a separate phase + explicit approval.

## Reason for external ledger

`CLAUDE.md` already exceeds 40k chars, so this sync intentionally avoids
editing `CLAUDE.md`.
