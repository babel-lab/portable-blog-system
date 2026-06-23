# GA4 D4 Data-Flow Early Evidence Record (docs-only)

- Phase name: `20260623-pm-ga4-d4-data-flow-early-evidence-record-docs-only-a`
- Date of record: 2026-06-23 (Asia/Taipei; screenshot timestamp ~14:08)
- Author of record: Dean (operator; produced the GA4 Explore report and screenshot) / Claude Code (docs drafting only)
- Type: **EVIDENCE RECORD ONLY — docs-only ledger of user-provided GA4 Explore evidence**

---

## 0. Critical disclaimers (read first)

This document is an **evidence record** — a docs-only ledger of a GA4 Explore report that
**Dean** produced and screenshotted manually, outside Claude. It records only what Dean's
screenshot evidence shows. It is the **data-flow** companion to the prior **registration**
evidence record (`docs/20260622-ga4-d4-registration-evidence-record.md`), which had
explicitly deferred data-flow verification.

The following statements are true for this phase and must be stated clearly:

1. **This record is docs-ONLY.** Its only mutation is the addition of this single
   Markdown file under `docs/`. Nothing here changes GA4 backend state, source, settings,
   build output, or any deploy artifact.
2. **Dean produced the GA4 Explore report; Claude did not.** Claude is not logged in to any
   Google / GA4 / AdSense / Search Console / Blogger / Drive account, accessed no
   dashboard, page, or API in this phase, and did **not** query, build, or run any GA4
   Explore / Realtime / DebugView report. The GA4 report was produced manually by Dean in
   the GA4 web UI (Explore).
3. **No build, deploy, Blogger repost, dev server, source change, generated HTML change,
   or live verification was done.** No `npm run build*`, no `preview`, no `gh-pages`
   action, no Blogger repost, no GA4 / Search Console / Drive action by Claude.
4. **All values below come from user-provided manual evidence** (Dean's GA4 Explore
   screenshot, 2026-06-23 ~14:08). Claude did not independently confirm any GA4 backend
   value, did not fetch or render the GA4 dashboard, and records every value as
   **"user-provided manual evidence reports X"**.
5. **This is an early read inside an incomplete window.** The originally-planned check was
   ~24h after the D4 registration (per the registration record §H, GA4 typically needs a
   24–72h processing window). Dean's Explore screenshot confirms data is **already flowing
   earlier than expected**, so this record marks an **early PASS**, but keeps the overall
   status as **WATCH** because the 24h window is not yet fully complete. Additional later
   observation may add more samples but is **not blocking**.
6. **Deferred / do-not-register fields stay deferred.** `target_url` / `link_url` /
   `outbound` / any raw full URL / any user identifier / any personal data / any
   high-cardinality value were **not** registered and were **not** added in this phase; they
   remain **do-not-register** per D4 §6 / K.4 §F. This record reaffirms that.

### 0.1 Purpose

To record, in a single docs-only ledger, that Dean has manually produced a GA4 Explore
report on 2026-06-23 in which the **D4 first-batch event-scope custom dimensions**
(`link_type`, `provider`, `placement`, `link_label`) appear **as selectable Explore
dimensions with populated, non-`(not set)` row values**, confirming end-to-end data flow
from emit surface → GA4 ingestion → Explore reporting earlier than the originally-planned
~24h check. The record preserves the authoritative naming and deferred-field boundaries
from `docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1) and
`docs/20260622-ga4-d4-registration-evidence-record.md` (registration record).

---

## A. Baseline and scope

### A.1 Baseline observed (this session)

| Check | Expected | Observed |
| --- | --- | --- |
| `pwd` | `…/portable-blog-system` | `/d/github/blog-new/portable-blog-system` ✅ |
| branch | `main` | `main` ✅ |
| `HEAD` | `853b042` | `853b0429174995bae8ae05e8a5a7084f024ec2d3` ✅ |
| `origin/main` | `853b042` | `853b0429174995bae8ae05e8a5a7084f024ec2d3` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `docs(ga4): record d4 registration evidence` | match ✅ |
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
  **BLOCKED**; ADMIN line stays **closed / idle freeze**.

---

## B. Evidence source

All recorded values below derive from a single source class: **user-provided manual
evidence** (Dean, 2026-06-23 ~14:08).

| Source artifact | Form | Provenance |
| --- | --- | --- |
| GA4 Explore report (free-form / table) showing D4 dimensions and event rows | screenshot | Dean, in the GA4 web UI (Explore) |
| Dimension / metric / row values transcribed into this session | text | typed by Dean from the GA4 Explore UI |

The screenshot itself is **not** committed to the repo (no screenshot is stored unless
explicitly approved; described textually only). Claude has not independently fetched or
rendered the GA4 dashboard; all values are recorded as **"user-provided manual evidence
reports X"**.

Masking rule applied to this record (per D4 operator packet §F):
- No GA4 property ID, account ID, email, or full measurement ID is recorded here. (The
  measurement ID is referenced only as the masked tail4 `…PF8VD` where reproduced from
  `content/settings/ga4.config.json`.)
- No publisher ID / AdSense client / slot / affiliate tracking token / personal data is
  recorded here.

---

## C. Explore evidence (what Dean's screenshot shows)

> All values below are **user-provided manual evidence** transcribed by Dean from the GA4
> Explore screenshot dated 2026-06-23 (~14:08). Claude did not query GA4.

### C.1 Dimensions visible in the Explore report

| Dimension (as shown in Explore) | Class | D4 relevance |
| --- | --- | --- |
| event name | built-in | event filter axis |
| page title | built-in | context |
| page location | built-in | context |
| `link_type` | **D4 custom dimension** | ✅ registered + populated |
| `provider` | **D4 custom dimension** | ✅ registered + populated |
| `placement` | **D4 custom dimension** | ✅ registered + populated |
| `link_label` | **D4 custom dimension** | ✅ registered + populated |

All four D4 first-batch event-scope custom dimensions (`link_type`, `provider`,
`placement`, `link_label`) are **selectable in Explore** and carry **non-`(not set)` row
values**, which is the data-flow signal the registration record §H had deferred.

### C.2 Metrics visible

| Metric | Value (user-reported total) |
| --- | --- |
| Event count (total) | **20** |
| Total users | **10** |

These are small early-window totals, consistent with an early read before the full 24h
window has elapsed. They are sufficient to confirm flow, not to draw analytics conclusions.

### C.3 D4-relevant event rows present

| `event name` row | Notes |
| --- | --- |
| `click_all_download` | download CTA click event present |
| `click_other_link` | other-link click event present |
| `click_affiliate_cta` | affiliate CTA click event present |
| `click_related_link` | related-link click event present |
| `ad_click` | ad click event present |

### C.4 Parameter values observed on the D4 dimensions

| Dimension | Observed values (user-reported, non-exhaustive) |
| --- | --- |
| `link_type` | includes `affiliate`, `cross_site` |
| `provider` | includes `通路王` |
| `placement` | includes `article_bottom`, `related_links` |
| `link_label` | human-visible labels for article / download / related / affiliate links |

These value shapes match the D1 parameter-naming spec intent (lower-snake enumerations for
`link_type` / `placement`, provider display name for `provider`, human anchor text for
`link_label`). `link_label` remains a **high-cardinality** dimension by design — an
analysis-quality caveat, not a privacy or leakage concern.

---

## D. Interpretation

- ✅ **D4 first-batch custom dimensions are registered AND data is flowing.** The four D4
  dimensions appear in Explore with populated values, which converges the **data-flow
  verification** step that the registration record (`…20260622-ga4-d4-registration-evidence-record.md`
  §H) had explicitly left deferred.
- ✅ **Early confirmation.** Data is visible in Explore **earlier than** the originally
  planned ~24h check, so the data-flow check is an **early PASS**.
- 🟡 **Status = WATCH (not CLOSED).** The 24h processing window is not yet fully complete.
  Early Explore population is a strong positive signal but the window should be allowed to
  finish; optional later observation can add more samples. This later observation is
  **not blocking** — the system may continue.
- 🟡 **GitHub Pages is the emit surface** for these click parameters in the current build;
  Blogger `click_*` listeners are a future, separately-approved phase. Any Blogger-side
  absence of these dimension values is a **known gap**, not a failure.
- 🟡 **`(not set)` on a dimension for an event whose surface/placement does not emit that
  parameter is structural, not a bug** — filter by `event_name` (and the relevant
  `placement` / `click_area`) before reading a dimension.
- ✅ **Naming integrity preserved.** All four dimension keys observed in Explore match D1
  §5 verbatim (`link_type` / `provider` / `placement` / `link_label`); no abbreviation and
  no deferred field appeared.
- ✅ **All red lines held.** No GA4 backend access by Claude, no source change, no build /
  deploy / repost, no admin write, no measurement-ID / AdSense / affiliate-token / PII
  written to docs.

---

## E. Deferred / do-not-register fields (reaffirmed)

The following remain **do-NOT-register** and were **not** added, registered, or emitted in
this phase (per D4 §6 / K.4 §F):

- `target_url` / `link_url` / `outbound` / any raw full URL
- any user identifier / any personal data
- any high-cardinality raw value beyond the by-design `link_label` anchor text

This record makes no change to the registered dimension set; it only ledgers that the
already-registered four are now flowing.

---

## F. Cross-links

- `docs/20260622-ga4-d4-registration-evidence-record.md` (registration evidence record —
  §H deferred the data-flow verification that **this** record now converges as early PASS)
- `docs/20260622-ga4-d4-manual-registration-operator-packet.md` (D4 operator packet — §C
  per-dimension authority, §F masking rule, §G conservative-interpretation rule)
- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` (D4 first-batch
  checklist — §5 4-dimension table, §6 deferred fields)
- `docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1 — authoritative parameter key
  / display name / scope spec §5; all 4 D4 keys match verbatim)
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` (P1 registration record
  — the 5 prior P1 dimensions)
- `docs/ga4-parameter-naming-registry.md` (P1 naming + UTM registry — naming-source index)
- `content/settings/ga4.config.json` (masked tail4 `…PF8VD`; events declaration — not
  modified in this phase)
- `CLAUDE.md` §3a Core operating rules / §3a Red lines / §29

---

## G. Blocked actions (not performed; not auto-allowed later)

Each of the following was **not** done in this phase and is **not** auto-allowed later —
each, if ever wanted, requires its **own phase + explicit Dean approval** (several stay
permanently forbidden per CLAUDE.md §29 / §3a red lines):

- 🔴 Claude logging in to / accessing / operating / querying GA4, AdSense, Search Console,
  Blogger, or Drive (no credentials; will not).
- 🔴 Calling the GA4 Admin API / Reporting API / Data API (permanently forbidden for this
  repo).
- 🔴 Claude building / running / exporting any GA4 Explore / Realtime / DebugView report.
- 🔴 Editing `content/settings/ga4.config.json` (`measurementId` / `enabled` / `events[]`).
- 🔴 Any source change to inject new `data-ga4-param-*` attributes (a future D2 source
  phase, separately approved).
- 🔴 `npm run build*` / `preview` / dev server / any deploy / `gh-pages` push.
- 🔴 Blogger repost (Batch 2 P2 live repost stays BLOCKED).
- 🔴 Reverse UTM live activation (pm-26 deploy gate stays BLOCKED; source dormant).
- 🔴 Reopening ADMIN or any write path (Apply / Save / middleware / `admin-write-cli` /
  `--apply` / `dryRun:false`).
- 🔴 Registering any deferred field from §E.
- 🔴 Writing a full `measurementId` / real AdSense client / slot / affiliate token /
  property ID / account ID / email / personal data into `docs/`, `CLAUDE.md`, `MEMORY.md`,
  `src/`, commits, or chat.

---

## H. Record verdict

- ✅ Baseline matched on entry (`853b042`); no repair attempted.
- ✅ This phase adds exactly **one** docs file (this evidence record) and nothing else.
- ✅ **docs-ONLY**; Claude did **not** access GA4; Claude did **not** query / build / run
  any GA4 report. Dean produced the GA4 Explore report manually; this record only ledgers
  the user-provided screenshot evidence.
- ✅ All 4 D4 dimensions (`link_type`, `provider`, `placement`, `link_label`) are recorded
  as **visible in Explore with populated values** per Dean's user-provided manual evidence;
  dimension keys match D1 §5 verbatim.
- ✅ **D4 data-flow = early PASS** — data confirmed flowing into Explore earlier than the
  originally-planned ~24h check.
- 🟡 **Overall status = WATCH** — the 24h window is not yet fully complete; optional later
  observation may add samples but is **not blocking**. The system may continue after this
  record is committed and pushed.
- ✅ All deferred fields reaffirmed as **do-NOT-register**.
- ✅ No build / deploy / Blogger repost / dev server / source change / generated HTML
  change was done in this phase.
- ✅ ADMIN stays closed / idle freeze; write path dormant; Reverse UTM dormant; pm-26 gate
  BLOCKED.

---
