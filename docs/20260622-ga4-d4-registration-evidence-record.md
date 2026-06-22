# GA4 D4 Registration Evidence Record (docs-only)

- Phase name: `20260622-night-ga4-d4-registration-evidence-record-docs-only-a`
- Date of record: 2026-06-22 (Asia/Taipei; ~21:05)
- Author of record: Dean (operator; performed the GA4 backend action) / Claude Code (docs drafting only)
- Type: **EVIDENCE RECORD ONLY — docs-only ledger of a user-performed GA4 backend action**

---

## 0. Critical disclaimers (read first)

This document is an **evidence record** — a docs-only ledger of a GA4 backend
registration action that **Dean** performed manually, outside Claude, prior to this
phase. It records only what Dean's screenshot evidence shows, makes no claim about data
flow, and authorizes no further action.

The following statements are true for this phase and must be stated clearly:

1. **This record is docs-ONLY.** Its only mutation is the addition of this single
   Markdown file under `docs/`. Nothing here changes GA4 backend state, source, settings,
   build output, or any deploy artifact.
2. **Dean performed the GA4 registration; Claude did not.** Claude is not logged in to any
   Google / GA4 / AdSense / Search Console / Blogger / Drive account, accessed no
   dashboard, page, or API in this phase, and did **not** create / edit / register /
   verify any GA4 custom dimension. The GA4 backend action was performed manually by Dean
   in the GA4 web UI (Admin → Data display → Custom definitions → Custom dimensions).
3. **No build, deploy, Blogger repost, dev server, source change, generated HTML change,
   or live verification was done.** No `npm run build*`, no `preview`, no `gh-pages`
   action, no Blogger repost, no GA4 / Search Console / Drive action by Claude.
4. **All values below come from user-provided manual evidence** (Dean's screenshot of the
   GA4 Custom definitions list and Dean's transcribed dimension details in the operator
   brief). Claude did not independently confirm any GA4 backend value.
5. **Registration ≠ data flowing.** This record captures that the 4 D4 dimensions appear
   in the Custom dimensions list with `Scope = Event` and the expected parameter keys; it
   does **not** claim Realtime or Explore data is populated, does **not** claim the
   dimensions are verified end-to-end with live clicks, and does **not** claim historical
   data has been backfilled (GA4 does not backfill custom dimensions).
6. **Negative-evidence fields stay deferred.** `target_url` / `link_url` / `outbound` /
   any raw full URL / any user identifier / any personal data / any high-cardinality value
   were **not** registered in this batch and remain **do-not-register** per D4 §6 / K.4
   §F. This record reaffirms that.

### 0.1 Purpose

To record, in a single docs-only ledger, that Dean has manually completed the D4
first-batch registration of 4 GA4 event-scoped custom dimensions (`link_label`,
`link_type`, `placement`, `provider`) in the GA4 web UI on 2026-06-22, with the
parameter keys, scope, and descriptions transcribed from Dean's screenshot evidence. The
record preserves the authoritative naming and deferred-field boundaries from
`docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1) and
`docs/20260622-ga4-d4-manual-registration-operator-packet.md` (D4 operator packet).

---

## A. Baseline and scope

### A.1 Baseline observed (this session)

| Check | Expected | Observed |
| --- | --- | --- |
| `pwd` | `…/portable-blog-system` | `/d/github/blog-new/portable-blog-system` ✅ |
| branch | `main` | `main` ✅ |
| `HEAD` | `a25c383` | `a25c383ea2784de443b52d110241d9b2045f2c95` ✅ |
| `origin/main` | `a25c383` | `a25c383ea2784de443b52d110241d9b2045f2c95` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `docs(ga4): add d4 manual registration operator packet` | match ✅ |
| working tree | clean | clean ✅ |

Baseline matched on entry; no repair was needed or attempted. Inspection was read-only
(`Read` / `Bash` for git checks); no controlled file was touched.

### A.2 In scope

- Add exactly **one** docs-only evidence-record file (this file).

### A.3 Out of scope (not touched)

- `src/`, `views/`, `scripts/`, `content/`, `settings/`, `templates/`, `public/`,
  `package.json`, lockfile, `vite.config.js`, `dist*/`, `gh-pages`, `.cache/`,
  `CLAUDE.md`, `MEMORY.md`.
- **No** build / deploy / preview / repost. **No** dev server.
- **No** GA4 / AdSense / Search Console / Blogger / Drive backend login or action by
  Claude.
- **No** admin write / middleware / `admin-write-cli` / Apply / `--apply` /
  `dryRun:false`.
- **No** Blogger repost; Reverse UTM stays **dormant**; pm-26 deploy gate stays
  **BLOCKED**; ADMIN line stays **closed / idle freeze** (K7 / K8 / K9 / R4 post-K chain
  remains closed — this phase does **not** reopen ADMIN).

---

## B. Evidence source

All recorded values below derive from a single source class: **user-provided manual
evidence** (Dean, 2026-06-22).

| Source artifact | Form | Provenance |
| --- | --- | --- |
| GA4 Custom definitions list view (after the 4 D4 rows were saved) | screenshot | Dean, in the GA4 web UI |
| Per-dimension detail values (parameter key, scope, description, last-changed date) | Dean's transcription in the operator brief into this session | typed by Dean from the GA4 UI |

Screenshots themselves are **not** committed to the repo (per the task brief's §9 strict
scope — no screenshot is stored unless explicitly approved; described textually only).
Claude has not independently fetched or rendered the GA4 dashboard; all values are
recorded as **"user-provided manual evidence reports X"**.

Masking rule applied to this record per D4 operator packet §F:
- No GA4 property ID, account ID, email, or full measurement ID is recorded here. (The
  measurement ID is referenced only as the masked tail4 `…PF8VD` where reproduced from
  `content/settings/ga4.config.json`.)
- No publisher ID / AdSense client / slot / affiliate tracking token / personal data is
  recorded here.

---

## C. Per-dimension evidence (the 4 D4 dimensions Dean registered)

> All four are **Event-scope**. All four parameter keys match D1 §5 verbatim and match
> the D4 operator packet §C verbatim. The "Dimension name" column records the name string
> Dean actually saved in the GA4 UI (transcribed from Dean's screenshot evidence). All
> four show GA4 "Last changed" date = `2026/6/22` in Dean's screenshot.

### C.1 Dimension 1 — `link_type`

| Field | Recorded value (per Dean's evidence) |
| --- | --- |
| Dimension name (as saved) | `link_type` |
| Scope | Event |
| Event parameter | `link_type` |
| Description | `Link click type` |
| Last changed date (UI) | 2026/6/22 |
| Parameter key matches D1 §5 / D4 §C.1 | ✅ yes (`link_type`) |
| Scope = Event | ✅ yes |

### C.2 Dimension 2 — `provider`

| Field | Recorded value (per Dean's evidence) |
| --- | --- |
| Dimension name (as saved) | `provider` |
| Scope | Event |
| Event parameter | `provider` |
| Description | `Link provider` |
| Last changed date (UI) | 2026/6/22 |
| Parameter key matches D1 §5 / D4 §C.2 | ✅ yes (`provider`) |
| Scope = Event | ✅ yes |

### C.3 Dimension 3 — `placement`

| Field | Recorded value (per Dean's evidence) |
| --- | --- |
| Dimension name (as saved) | `placement` |
| Scope | Event |
| Event parameter | `placement` |
| Description | `Link placement` |
| Last changed date (UI) | 2026/6/22 |
| Parameter key matches D1 §5 / D4 §C.3 | ✅ yes (`placement`) |
| Scope = Event | ✅ yes |

### C.4 Dimension 4 — `link_label`

| Field | Recorded value (per Dean's evidence) |
| --- | --- |
| Dimension name (as saved) | `link_label` |
| Scope | Event |
| Event parameter | `link_label` |
| Description | `Link label` |
| Last changed date (UI) | 2026/6/22 |
| Parameter key matches D1 §5 / D4 §C.4 | ✅ yes (`link_label`) |
| Scope = Event | ✅ yes |

### C.5 Notes on display-name and description differences from D4 packet (descriptive, not defects)

Two minor differences vs the D4 operator packet's *suggested* values are worth recording
explicitly so future readers do not misread them as drift:

1. **Dimension name (display name).** The D4 packet suggested human-readable display
   names (`Link Type`, `Link Provider`, `Link Placement`, `Link Label`); Dean saved the
   dimension name equal to the parameter key (`link_type`, `provider`, `placement`,
   `link_label`). This is **acceptable**: parameter key = dimension name is a valid GA4
   convention and removes case ambiguity for future searching. The D4 packet's §C
   "Display name (suggested)" lines were explicitly **suggestions** ("D1 §5.1 is
   authority if conflict"), and D1's authority is over the **parameter key**, which
   matches verbatim in all four cases. **No naming drift.**
2. **Description.** Dean used short descriptions (`Link click type`, `Link provider`,
   `Link placement`, `Link label`) rather than the D4 packet's longer purpose strings
   (`Link category: affiliate / cross_site / internal / external.` etc.). GA4
   descriptions are **display-only metadata** in the Admin UI and do **not** affect data
   collection, parameter matching, or report behavior. **No data impact.**

Neither difference affects parameter matching, event routing, scope, or report behavior;
both are recorded here for evidentiary completeness, not as findings.

---

## D. Total-count cross-check (Custom dimensions list)

Dean's screenshot of the GA4 Custom definitions list shows **14 total custom
dimensions** after the D4 registration landed. Cross-checking against the prior
documented state:

| Source | Dimensions visible | Count |
| --- | --- | --- |
| Prior P1 registration record (`docs/20260615-ga4-p1-custom-dimensions-registration-record.md` §3) | `click_area`, `nav_direction`, `post_slug`, `target_slug`, `surface` | 5 |
| Additional dimensions present in Dean's screenshot but not in P1 record's table | `content_type`, `event_category`, `event_label`, `event_time`, `site_context` | 5 |
| Subtotal prior to this D4 batch | — | 10 |
| This D4 batch (recorded above) | `link_label`, `link_type`, `placement`, `provider` | 4 |
| **Total observed in Dean's screenshot** | — | **14** |

`10 + 4 = 14` ✅ — the post-D4 list count is internally consistent with the P1
record-of-registration plus this D4 record-of-registration plus the 5 prior dimensions
already visible in the list.

> Note on the 5 prior dimensions outside the P1 record's table (`content_type`,
> `event_category`, `event_label`, `event_time`, `site_context`): their provenance is
> **outside this docs ledger** — they may predate the P1 record or have been added by
> Dean in a separate, undocumented manual session. This evidence record does **not**
> claim them, validate them, or assign them to any phase; it only records that Dean's
> screenshot shows them present alongside the P1 and D4 rows. They are not subjects of
> this phase.

---

## E. Deferred / do-NOT-register fields (reaffirmed, per Dean's negative evidence)

Per the operator brief's "Important negative evidence" section, the following fields
were **explicitly NOT registered** in this D4 batch and remain **do-not-register** under
D4 §6 / K.4 §F / D4 operator packet §C.5:

- `target_url` — high cardinality (full URL); raw URLs not registered as a dimension
- `link_url` — high cardinality (full URL); may carry affiliate redirect token
  (`uid1=<personal-id>`); never registered
- `outbound` — overlaps `link_type=external`; not in this batch
- any **raw full URL** field
- any **user identifier**
- any **personal data**
- any **high-cardinality value**

Rationale (carried forward from D4 operator packet §C.5 and K.4 §F):
- Raw URLs (`target_url` / `link_url`) are high/very-high cardinality and `link_url` can
  contain an affiliate redirect token (`uid1=…`); registering them as custom dimensions
  would risk both `(other)` bucketing in GA4 and token-exposure in dashboard rows.
- `outbound` overlaps `link_type=external` and adds no new analytical resolution.
- Raw URLs are still **queryable** via GA4 Explore `event_params` without being
  registered; prefer the slug / type / provider proxies (`target_slug` already
  registered in P1; `link_type` / `provider` now registered in D4).
- **Event-scope only** — no user-scope or item-scope dimension is in scope (this system
  has no membership / no DB; per CLAUDE.md §29).

---

## F. Negative checks / actions NOT performed (this phase)

Recording explicitly that the following were **not** done in this phase, by either Dean
or Claude, beyond the GA4 backend registration itself:

- ❌ Claude did **not** access GA4 (no login; no Admin API; no Reporting API; no
  dashboard fetch; no Explore query; no DebugView; no Realtime).
- ❌ Claude did **not** create, edit, register, rename, delete, or verify any GA4
  custom dimension. (Dean performed the registration manually in the GA4 web UI.)
- ❌ No GA4 Realtime / DebugView / Explore data was observed or quoted (this is a
  **registration-evidence** record, not a data-flow verification record; data
  verification stays deferred to a future, separately-approved phase).
- ❌ No build / deploy / Blogger repost / dev server / `npm run *` / `preview` /
  `gh-pages` push / Blogger UI action / AdSense UI action / Search Console UI action /
  Drive UI action was performed.
- ❌ No source change (no `data-ga4-param-*` added or modified; no
  `content/settings/ga4.config.json` edit; no `events[]` change; no `measurementId`
  change).
- ❌ No deferred field from §E was registered.
- ❌ No display name in §C was renamed in the GA4 backend by Claude (Claude has no
  GA4 access; the descriptive difference noted in §C.5 was already as saved by Dean).
- ❌ ADMIN line stayed closed / idle freeze; K7 / K8 / K9 / R4 post-K chain stayed
  closed; no write-path action of any kind.
- ❌ Reverse UTM stayed dormant; pm-26 deploy gate stayed BLOCKED.
- ❌ Blogger Batch 2 P2 (`ai-tools-simplify-daily-workflow`) live repost stayed
  BLOCKED; Batch 2 P3 (`blog-restart-steady-rhythm-notes`) content was already landed
  (2026-06-17) but is **outside** this phase's scope.
- ❌ No full `measurementId` / real AdSense client / slot / affiliate token / property
  ID / account ID / email / personal data was written to this doc, to any commit, or to
  chat.

---

## G. Per-dimension verdict table

> Single source of truth: the 4 D4 rows visible in Dean's screenshot of the GA4 Custom
> definitions list (Last changed = 2026/6/22), plus Dean's transcribed dimension details.

| # | Parameter key | Dimension name (as saved) | Scope = Event? | Registered (per evidence) | Realtime/Explore data populated? | Verdict |
| - | ------------- | ------------------------- | -------------- | ------------------------- | -------------------------------- | ------- |
| 1 | `link_type`   | `link_type`               | ✅ yes         | ✅ yes (2026-06-22)       | not measured this phase          | **REGISTERED** (data verification pending, separate phase) |
| 2 | `provider`    | `provider`                | ✅ yes         | ✅ yes (2026-06-22)       | not measured this phase          | **REGISTERED** (data verification pending, separate phase) |
| 3 | `placement`   | `placement`               | ✅ yes         | ✅ yes (2026-06-22)       | not measured this phase          | **REGISTERED** (data verification pending, separate phase) |
| 4 | `link_label`  | `link_label`              | ✅ yes         | ✅ yes (2026-06-22)       | not measured this phase          | **REGISTERED** (data verification pending, separate phase) |

---

## H. Interpretation / conservative reading

- ✅ This record converges the **registration** step for the D4 first batch: 4
  event-scope dimensions appear in the GA4 Custom definitions list with the expected
  parameter keys (matching D1 §5 verbatim) and `Scope = Event`.
- 🟡 This record does **not** converge **data-flow verification**: it does not assert
  that Realtime or Explore reports populate these dimensions with non-`(not set)` values.
  GA4 typically requires a fresh emit *after* registration and a 24–72h processing
  window; any post-registration click that produced these parameters **before** the
  registration save will still appear as `(not set)` historically (GA4 does **not**
  backfill custom dimensions). Data verification is a separately-approved future phase.
- 🟡 Empty Realtime / Explore right after registration is **pending, not FAIL** — see
  D4 operator packet §G ("Conservative interpretation rules").
- 🟡 GitHub Pages is currently the only emit surface for these parameters; Blogger
  `click_*` events are not landed (Blogger listener is a future, separately-approved
  phase). Blogger having no values for these dimensions is a **known gap**, not a
  failure.
- 🟡 `(not set)` on a dimension for an event whose surface does not emit that parameter
  is **structural, not a bug** — filter by `event_name` (+ the relevant `click_area` /
  `placement`) before reading a dimension.
- 🟡 `link_label` is a **high-cardinality** dimension by design (it tracks human-visible
  anchor text, often titles); GA4 may aggregate rare values into `(other)`. That is an
  analysis-quality caveat, **not** a privacy or leakage risk. `target_slug` (already
  registered in P1) remains the lower-cardinality alternative when the `(other)`
  bucketing later proves unhelpful.
- ✅ Naming integrity preserved: all 4 parameter keys match D1 §5 verbatim; no
  abbreviation (e.g. `type` instead of `link_type`) was committed; no deferred field was
  registered.
- ✅ All red lines held: no GA4 backend access by Claude, no source change, no build /
  deploy / repost, no admin write, no measurement-ID / AdSense / affiliate-token / PII
  written to docs.

---

## I. Cross-links

- `docs/20260622-ga4-d4-manual-registration-operator-packet.md` (D4 operator packet —
  the checklist Dean followed for this manual GA4 backend action; §C is the
  per-dimension authority; §F is the masking rule; §G is the conservative-interpretation
  rule applied in §H above)
- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` (D4 first-batch
  checklist — original docs-only checklist consolidated by the operator packet; §5
  4-dimension table and §6 deferred fields are the authority cross-checked in §C and §E)
- `docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1 — authoritative parameter
  key / display name / scope spec §5; all 4 D4 keys match D1 verbatim)
- `docs/20260622-k4-ga4-p2-p3-dimension-expansion-preanalysis.md` (K.4 preanalysis —
  §F deferred fields cross-checked in §E above)
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` (P1 registration
  record — the 5 prior P1 dimensions cross-checked in the §D total-count math)
- `docs/ga4-parameter-naming-registry.md` (P1 naming + UTM registry — naming-source
  index)
- `docs/20260622-k3-k4-k5-docs-only-closure-checkpoint.md` (K-line closure checkpoint)
- `content/settings/ga4.config.json` (masked tail4 `…PF8VD`; events declaration — not
  modified in this phase)
- `CLAUDE.md` §3a Core operating rules / §3a Red lines / §29

---

## J. Blocked actions (not performed; not auto-allowed later)

Each of the following was **not** done in this phase and is **not** auto-allowed later —
each, if ever wanted, requires its **own phase + explicit Dean approval** (and several
stay permanently forbidden per CLAUDE.md §29 / §3a red lines):

- 🔴 Claude logging in to / accessing / operating / modifying GA4, AdSense, Search
  Console, Blogger, or Drive (no credentials; will not).
- 🔴 Calling the GA4 Admin API / Reporting API (permanently forbidden for this repo).
- 🔴 Claude creating / editing / deleting / verifying any GA4 custom dimension. (Dean
  performed this batch's registration manually; Claude only records evidence.)
- 🔴 Editing `content/settings/ga4.config.json` (`measurementId` / `enabled` /
  `events[]`).
- 🔴 Any source change to inject new `data-ga4-param-*` attributes (a future D2 source
  phase, separately approved).
- 🔴 `npm run build*` / `preview` / dev server / any deploy / `gh-pages` push.
- 🔴 Blogger repost (Batch 2 P2 live repost stays BLOCKED; Batch 2 P3 content already
  landed 2026-06-17 but **outside** this phase's scope).
- 🔴 Reverse UTM live activation (pm-26 deploy gate stays BLOCKED; source dormant).
- 🔴 Reopening ADMIN or any write path (Apply / Save / middleware / `admin-write-cli` /
  `--apply` / `dryRun:false`).
- 🔴 Registering any deferred field from §E (`target_url` / `link_url` / `outbound` /
  any raw URL / any user identifier / any personal data / any high-cardinality value).
- 🔴 Writing a full `measurementId` / real AdSense client / slot / affiliate token /
  property ID / account ID / email / personal data into `docs/`, `CLAUDE.md`,
  `MEMORY.md`, `src/`, commits, or chat.

---

## K. Record verdict

- ✅ Baseline matched on entry (`a25c383`); no repair attempted.
- ✅ This phase adds exactly **one** docs file (this evidence record) and nothing else.
- ✅ **docs-ONLY**; Claude did **not** access GA4; Claude did **not** create / edit /
  register / verify any GA4 custom dimension. Dean performed the GA4 backend action
  manually; this record only ledgers it.
- ✅ All 4 D4 dimensions (`link_type`, `provider`, `placement`, `link_label`) are
  recorded as **REGISTERED (Event scope)** per Dean's user-provided manual evidence,
  with parameter keys matching D1 §5 verbatim.
- ✅ All deferred fields (`target_url` / `link_url` / `outbound` / raw URLs / user
  identifiers / personal data / high-cardinality values) reaffirmed as
  **do-NOT-register**.
- ✅ Total-count cross-check passes: prior 10 + new 4 = 14, matching Dean's screenshot.
- ✅ No build / deploy / Blogger repost / dev server / source change / generated HTML
  change / live verification was done in this phase.
- ✅ ADMIN stays closed / idle freeze; write path dormant; Reverse UTM dormant; pm-26
  gate BLOCKED.
- 🟡 **Data-flow verification** (Realtime / DebugView / Explore non-`(not set)` values)
  is **deferred** to a future, separately-approved phase; GA4 typically needs 24–72h
  processing + a fresh emit after registration. This record makes **no** claim about
  data flow.

---

（本文件結束 / end of document）
