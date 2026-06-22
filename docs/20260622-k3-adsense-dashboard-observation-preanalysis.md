# K.3 — AdSense Dashboard Observation Preanalysis (docs-only)

- Phase name: `20260622-pm-k3-adsense-dashboard-observation-preanalysis-docs-only-a`
- Date: 2026-06-22
- Author of record: Dean (operator) / Claude Code (docs drafting only)
- Type: **PREANALYSIS ONLY — not an observation result**

---

## 0. Critical disclaimers (read first)

This document is a **planning / preanalysis** artifact. It defines *what Dean should
manually observe later* in the Google AdSense dashboard, and *how that evidence should
be captured and masked*. It records **no** dashboard data.

Explicitly, for this phase:

1. **This is PREANALYSIS ONLY, not an observation result.** No numbers, statuses, or
   trends in this document represent anything actually seen in a dashboard.
2. **No Google / AdSense dashboard was accessed by Claude.** Claude is not logged in to
   any Google / AdSense / Search Console / Blogger account and did not fetch any
   dashboard page.
3. **No settings were changed.** No file under `content/settings/` (including
   `ads.config.json`) was read-for-edit, modified, or re-keyed.
4. **No repost / build / deploy was run.** No `npm run build*`, no `preview`, no
   `gh-pages` action, no Blogger repost, no GA4 / Search Console / Drive action.

All future dashboard evidence referenced here is to be treated as **user-provided
manual evidence only** (screenshots / notes Dean supplies later). Claude will not, and
cannot, independently confirm any dashboard metric.

---

## A. Baseline and scope

### A.1 Baseline observed (this session)

| Check | Expected | Observed |
| --- | --- | --- |
| `pwd` | `…/portable-blog-system` | `/d/github/blog-new/portable-blog-system` ✅ |
| branch | `main` | `main` ✅ |
| `HEAD` | `64a7d3a` | `64a7d3a008c5144df6b6f55c8df6cc04f9c88ae7` ✅ |
| `origin/main` | `64a7d3a` | `64a7d3a008c5144df6b6f55c8df6cc04f9c88ae7` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `docs(admin): record post-k browser evidence` | match ✅ |
| working tree | clean | clean ✅ |

Baseline matched on entry; no repair was needed or attempted.

### A.2 Scope

- **In scope:** add exactly **one** docs-only preanalysis file (this file).
- **Out of scope (not touched):** `src/`, `views/`, `scripts/`, `content/`,
  `settings/`, `package.json`, lockfile, `dist*/`, `gh-pages`, `.cache/`, `CLAUDE.md`,
  `MEMORY.md`.
- **No** build / deploy / preview / repost. **No** dev server started.
- **ADMIN line stays closed / idle freeze** — this phase does **not** reopen ADMIN
  (K7 / K8 / K9 / R4 post-K chain remains closed).

---

## B. Why K.3 is safe after ADMIN post-K closure

1. The ADMIN post-K chain (K7 copy buttons, K8 field auto-switch, K9 multi-click
   determinism, R4 read-only state) is **closed and browser-PASS recorded**. K.3 does
   not touch ADMIN code, dashboards, or write paths, so it cannot regress that closure.
2. K.3 is **purely a documentation deliverable**. It produces a single Markdown file
   under `docs/` and nothing else — no executable surface, no config, no rendered
   output.
3. K.3 **does not perform** any account-side action. It only *prescribes* what Dean may
   later observe manually. The actual observation (if any) happens outside this repo, by
   a human, with no Claude credentials involved.
4. Because it is additive docs-only and the AdSense real `client id` / `slot id` live
   **only** in `content/settings/ads.config.json` (which is untouched), there is **no
   secret-leak surface**: this file intentionally contains **no** publisher ID, slot
   ID, or account identifier.

Net: K.3 is a safe, reversible, low-risk planning step that leaves the codebase
byte-identical except for one new doc.

---

## C. Manual AdSense dashboard observation goals

These are goals **for Dean to perform manually later**, not results.

- G1. Establish a **point-in-time snapshot** of AdSense account health for the sites in
  scope (Blogger `babel-lab.blogspot.com` and, where applicable, GitHub Pages project
  site), so future changes can be compared against a known reference.
- G2. Confirm **whether any policy / serving issues are surfaced** by the dashboard
  (without Claude interpreting them as pass/fail — see §F / §G).
- G3. Capture a **recent earnings / traffic trend** purely as raw observed figures, with
  the exact date range and source screen, for Dean's own records.
- G4. Build a **repeatable evidence-capture habit** (masked screenshots + short notes)
  that can feed later phases if Dean chooses to act on what the dashboard shows.

These goals are deliberately observational. None of them authorizes a config change,
repost, or deploy as a consequence.

---

## D. Suggested observation fields

If visible in Dean's dashboard, the following fields **may** be recorded. Any field not
visible should be marked `not visible` rather than guessed.

| Field | Notes |
| --- | --- |
| AdSense **policy center** status | Whether any policy items / notices are shown. Record verbatim wording; do not interpret. |
| **Sites** status | Per-site status (e.g. "Ready" / "Getting ready" / "Needs attention") exactly as shown. |
| **Crawler / coverage**-style indicators | Any crawl / indexing / coverage style messages, if visible. |
| **Recent estimated earnings** trend | Estimated earnings figures with the exact date range. "Estimated" must stay labeled as estimated. |
| **Page views / impressions / clicks / CTR / RPM** | Record only those actually visible; mark the rest `not visible`. |
| **Ad serving limitations** | Whether any "ad serving has been limited" or similar banner is shown. |
| **Date range used** | The exact range the dashboard was set to for the captured numbers (mandatory for any metric). |
| Sensitive-ID presence check | Whether the screenshot contains account IDs that must be masked before sharing. |

Every metric is meaningless without its **date range** and **source screen** — both must
accompany any figure.

---

## E. Evidence capture checklist for Dean

When (and only if) Dean chooses to capture evidence later:

- [ ] Note the **exact date range** shown on the screen before screenshotting.
- [ ] Note **which dashboard screen** each figure came from (Overview / Reports / Sites /
      Policy center).
- [ ] Mark non-visible fields as `not visible` rather than estimating.
- [ ] **Mask** the following before saving or sharing any screenshot:
  - [ ] **publisher ID** (e.g. `pub-…` / `ca-pub-…`)
  - [ ] **slot / ad-unit ID**
  - [ ] **bank / tax / payment** data
  - [ ] **email / account identity**
  - [ ] **any other personal identifiers** (name, address, phone)
- [ ] Save masked screenshots + a short plain-text note (figures + date range + source
      screen).
- [ ] Hand the masked evidence to Claude **as user-provided manual evidence** if a
      follow-up phase is wanted.

Reminder: real `client id` / `slot id` must **never** be pasted into `docs/`, commits,
or chat. Keep them only in `content/settings/ads.config.json`.

---

## F. Interpretation rules

- F1. Any captured figure is a **snapshot only** — valid for its stated date range and
  the moment it was viewed, nothing more.
- F2. **Dashboard delays are normal.** Estimated earnings and metrics lag and revise;
  same-day figures are provisional.
- F3. **No metric is final** without an explicit date range **and** a source screen.
- F4. A single snapshot is **not a trend**. Comparing requires at least two dated
  captures of the same screen and range.
- F5. Absence of a banner is **not** proof of compliance; presence of a banner is **not**
  interpreted by Claude as a verdict — wording is recorded verbatim and left to Dean.
- F6. Observation **never** implies a config change. Any action that would follow from
  what the dashboard shows requires its own separate phase + explicit approval.

---

## G. Do-not-claim list

Claude must **not** state (now or after receiving evidence) any of the following unless
Dean supplies dated, sourced, masked evidence that directly shows it — and even then only
as "user-provided manual evidence reports X":

- ❌ Do **not** say revenue / earnings **improved** (or declined).
- ❌ Do **not** say metrics / impressions / serving are **stable**.
- ❌ Do **not** say policy status is **confirmed** (clean or otherwise).
- ❌ Do **not** say crawler / coverage status is **confirmed**.
- ❌ Do **not** say **any dashboard metric was observed** by Claude.
- ❌ Do **not** treat estimated figures as final or audited.
- ❌ Do **not** infer cause/effect linking any repo change to a dashboard number.

All future dashboard evidence = **user-provided manual evidence only**.

---

## H. Blocked actions (not performed in this phase, and not auto-allowed later)

- 🔴 Logging in to Google / AdSense / Search Console / Blogger / Drive (Claude has no
  credentials and will not).
- 🔴 Fetching or scraping any dashboard page.
- 🔴 Editing `content/settings/ads.config.json` or any settings file.
- 🔴 `npm run build*` / `preview` / any deploy / `gh-pages` push.
- 🔴 Blogger repost (Batch 2 P2 / P3 live repost stays BLOCKED).
- 🔴 Reopening the ADMIN line or any write path (Apply / middleware / CLI write).
- 🔴 Writing real `client id` / `slot id` / publisher ID into `docs/`, `CLAUDE.md`,
  `src/`, commits, or chat.

Each of the above, if ever wanted, requires its **own phase + explicit Dean approval**.

---

## I. Next possible follow-up (only after Dean provides screenshots / notes)

If Dean later supplies **masked, dated, source-labeled** evidence, a possible (separate,
approval-gated) follow-up could:

1. Transcribe the user-provided figures into a **docs-only observation record**, framed
   strictly as "user-provided manual evidence reports …".
2. Note any **wording** shown in policy center / sites status verbatim, without verdict.
3. Identify, as a **proposal only**, whether anything *might* warrant a future action
   phase (e.g. theme CSS recheck, repost readiness) — without executing it.

No follow-up is started in this phase. This document ends at planning.

---

## J. Phase status

- ✅ docs-only preanalysis file created (this file).
- ✅ Baseline matched; no source / settings / build / deploy / dashboard action.
- ⏸ Awaiting Dean approval before any further step.
