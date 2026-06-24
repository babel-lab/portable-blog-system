# GA4 D4 Data-Flow Window-Complete Evidence Record (docs-only)

- Phase name: `20260624-ga4-d4-data-flow-window-complete-evidence-record-docs-only-a`
- Date of record: 2026-06-24 (Asia/Taipei)
- Author of record: Dean (operator; produced the GA4 Explore report + read the GA4 stream/admin screens and provided observations) / Claude Code (docs drafting only)
- Type: **EVIDENCE RECORD ONLY — docs-only ledger of user-provided GA4 observations**

---

## 0. Critical disclaimers (read first)

This document is an **evidence record** — a docs-only ledger of GA4 observations that
**Dean** produced and read manually, outside Claude. It records only what Dean's
screenshots / observations show. It is the **window-complete** companion to the prior
**early** data-flow evidence record (`docs/20260623-ga4-d4-data-flow-early-evidence-record.md`),
which recorded an early PASS inside an incomplete ~24h window.

The following statements are true for this phase and must be stated clearly:

1. **This record is docs-ONLY.** Its only mutation is the addition of this single Markdown
   file under `docs/`. Nothing here changes GA4 backend state, source, settings, build
   output, or any deploy artifact.
2. **Dean produced the GA4 reports / read the GA4 screens; Claude did not.** Claude is not
   logged in to any Google / GA4 / AdSense / Search Console / Blogger / Drive account,
   accessed no dashboard, page, or API in this phase, and did **not** query, build, or run
   any GA4 Explore / Realtime / DebugView report.
3. **No build, deploy, Blogger repost, dev server, source change, generated HTML change, or
   live verification was done.** No `npm run build*`, no `preview`, no `gh-pages` action,
   no Blogger repost, no GA4 / Search Console / Drive action by Claude.
4. **All values below come from user-provided manual evidence** (Dean's GA4 screenshots /
   observations, 2026-06-24). Claude did not independently confirm any GA4 backend value,
   did not fetch or render the GA4 dashboard, and records every value as
   **"user-provided manual evidence reports X"**.
5. **Measurement IDs are masked.** Per the standing masking discipline (operator packet
   `docs/20260622-ga4-d4-manual-registration-operator-packet.md` §F; early record §B), the
   full GA4 measurement ID is **never** written to docs / any ledger — only a masked tail4.
   Both streams are referenced below by masked tail4 (`…PF8VD` / `…HLELH`). The full IDs
   live in Dean's GA4 backend (and the Blogger one in `content/settings/ga4.config.json`),
   not in this record.
6. **Deferred / do-not-register fields stay deferred.** `target_url` / `link_url` /
   `outbound` / any raw full URL were **not** registered as custom dimensions and were
   **not** added in this phase. See §E for the important caveat: *not registered* ≠ *not
   transmitted*.

### 0.1 Purpose

To record, in a single docs-only ledger, Dean's 2026-06-24 manual GA4 observations that
(a) the GA4 property has **two** Web data streams (Blogger and GitHub) with **different**
measurement IDs, (b) the **D4 first-batch event-scope custom dimensions** (`link_type`,
`provider`, `placement`, `link_label`) appear in an Explore report as selectable dimensions
with populated, non-`(not set)` values, and (c) the deferred raw-URL fields remain
**unregistered** as custom dimensions. Because the GitHub stream itself showed **no** data
in the past 48h on the stream detail/list screen, the overall data-flow verdict is recorded
as **PASS with WATCH**, not unrestricted PASS. Authoritative parameter naming remains
`docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1) §5.

---

## A. Baseline and scope

### A.1 Baseline observed (this session, entry)

| Check | Expected | Observed |
| --- | --- | --- |
| `pwd` | `…/portable-blog-system` | `/d/github/blog-new/portable-blog-system` ✅ |
| branch | `main` | `main` ✅ |
| `HEAD` | `199353a` | `199353ac1895451e47787ef537e4f9119f15ebbe` ✅ |
| `origin/main` | `199353a` | `199353ac1895451e47787ef537e4f9119f15ebbe` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `feat(blogger): show sp9d operator policy guidance` | match ✅ |
| working tree | clean | clean ✅ |
| `.git/index.lock` | absent | absent ✅ |

Baseline matched on entry; no repair was needed or attempted. Inspection was read-only
(`Read` / `Bash` for git checks); no controlled file was touched before the single docs add.

### A.2 In scope

- Add exactly **one** docs-only evidence-record file (this file).

### A.3 Out of scope (not touched)

- `src/`, `views/`, `scripts/`, `content/`, `settings/`, `templates/`, `public/`,
  `package.json`, lockfile, `vite.config.js`, `dist*/`, `gh-pages`, `.cache/`,
  `CLAUDE.md`, `MEMORY.md`.
- **No** build / deploy / preview / repost. **No** dev server.
- **No** GA4 / AdSense / Search Console / Blogger / Drive / Google Form backend login or
  action by Claude.
- **No** admin write / middleware / `admin-write-cli` / Apply / `--apply` / `dryRun:false`.
- **No** Blogger repost; Reverse UTM stays **dormant**; pm-26 deploy gate stays
  **BLOCKED**; ADMIN line stays **closed / idle freeze**.

---

## B. Evidence source

All recorded values below derive from a single source class: **user-provided manual
evidence** (Dean, 2026-06-24 GA4 screenshots / observations). The screenshots are **not**
committed to the repo (described textually only). Claude has not independently fetched or
rendered the GA4 dashboard; all values are recorded as **"user-provided manual evidence
reports X"**.

Masking applied (per operator packet §F): no GA4 property ID, account ID, email, or full
measurement ID is recorded; measurement IDs appear only as masked tail4. No publisher ID /
AdSense client / slot / affiliate token / personal data is recorded.

---

## C. Two-stream clarification (user-provided manual evidence)

> Dean reports the GA4 property has **two** Web data streams with **different** measurement
> IDs. This is a material clarification for interpreting D4 Explore rows (see §F).

| Stream | Stream name | Stream URL | Measurement ID (masked tail4) | Stream ID | Past-48h traffic (per Dean) |
| --- | --- | --- | --- | --- | --- |
| Blogger | (Blogger blog) | `https://babel-lab.blogspot.com/` | `…PF8VD` | `5006869775` | **receiving traffic in past 48h** ✅ |
| GitHub | `GitHub 學習紀錄站` | `https://babel-lab.github.io` | `…HLELH` | `11320799256` | **no data in past 48h** (stream detail/list screen) 🟡 |

Notes:
- The two measurement IDs are **distinct** (`…PF8VD` ≠ `…HLELH`) → two separate Web data
  streams in the same GA4 property.
- Full measurement IDs are intentionally **not** written here (§0 disclaimer 5 / §F masking).
- The GitHub stream showing **no past-48h data** on the stream screen is the basis for the
  **WATCH** qualifier in §G — current GitHub stream live traffic is **not** over-claimed.

---

## D. D4 Explore evidence (what Dean's report shows)

> All values below are **user-provided manual evidence** transcribed by Dean from the GA4
> Explore report dated 2026-06-24. Claude did not query GA4.

### D.1 Report frame

- Date range: **2026-06-22 … to 2026-06-24** (per Dean's GA4 Explore screenshot;
  start date confirmed in a 2026-06-24 follow-up correction).
- Columns/dimensions visible in the report: `event name`, `link_type`, `provider`,
  `placement`, `link_label`, `event count`, `active users`.

### D.2 D4 custom dimensions selectable + populated

All four D4 first-batch **event-scope** custom dimensions are **selectable in Explore** and
carry **populated, non-`(not set)`** row values:

| Dimension | Class | D4 relevance |
| --- | --- | --- |
| `link_type` | D4 custom dimension | ✅ registered + populated |
| `provider` | D4 custom dimension | ✅ registered + populated |
| `placement` | D4 custom dimension | ✅ registered + populated |
| `link_label` | D4 custom dimension | ✅ registered + populated |

### D.3 Example rows (user-reported, non-exhaustive)

| Example | Observed values |
| --- | --- |
| Cross-site link row | `link_type = cross_site`, `placement = related_links` (event name not captured in observation) |
| Affiliate CTA row | `event name = click_affiliate_cta`, `link_type = affiliate`, `provider = 通路王`, `placement = article_bottom`, `link_label = 博客來：實體書` |

- Multiple distinct `link_label` values were observed (human anchor text; high-cardinality
  by design — an analysis-quality caveat, not a privacy concern).
- Dimension keys observed match D1 §5 verbatim (`link_type` / `provider` / `placement` /
  `link_label`); no abbreviation, no deferred field appeared as a dimension.

---

## E. Deferred-field registration discipline (PASS) + important caveat

### E.1 PASS — deferred fields NOT registered as custom dimensions

The following are **not** registered as GA4 custom dimensions (per Dean's observation +
prior D4 §6 / operator packet §C.5):

- `link_url`
- `target_url`
- `outbound`
- any raw-URL-class field

→ **Custom-dimension registration discipline = PASS.** Only the intended 4 low-risk
event-scope dimensions are registered; no raw-URL / token-bearing field was promoted to a
dimension.

### E.2 ⚠️ Caveat — *not registered* ≠ *not transmitted*

This record must **not** claim that `link_url` / `target_url` / `outbound` are **not
transmitted** to GA4. The prior source preflight
(`docs/20260623-ga4-d4-data-flow-early-evidence-record.md` context + the read-only source
preflight that preceded it) found these may still be sent as **raw GA4 event params**:

- `src/views/pages/post-detail.ejs` emits `data-ga4-param-link_url` / `data-ga4-param-outbound`.
- `src/views/layout/article-bottom-nav.ejs` emits `data-ga4-param-target_url`.
- `src/js/modules/link-tracker.js` forwards **every** `data-ga4-param-*` attribute verbatim
  to `gtag`; there is **no allowlist / filter**. *(2026-06-24 follow-up: this is no longer
  true in source — the Route B central allowlist filter landed/frozen at `bb56ea6`; see §M.
  The transmission caveat below still holds for the **live** site until a separately approved
  build/deploy, because templates were not changed and no deploy was done.)*

So the evidence here supports only: **these fields are not registered as custom
dimensions.** It does **not** establish that they are absent from the event payload. As of
this observation, no user identifier / email / personal data is among the emitted params;
the affiliate redirect token field (`link_url` with `uid1=…`, currently a fixed `uid1=blog`)
is the main raw-URL-class concern. Actually stopping transmission of raw-URL / deferred
params requires a **separate GA4 param allowlist source phase** (see §H.B) — **not** done in
this docs-only phase.

---

## F. Stream-distinction caveat (interpreting D4 rows)

- D4 custom dimensions are **property-level, event-scope** definitions. Explore may show
  event data **across both streams** unless the report is explicitly filtered by stream.
- Because the **GitHub stream** (`…HLELH`) showed **no** past-48h data on the stream screen,
  while the **Blogger stream** (`…PF8VD`) **is** receiving traffic, the D4 rows visible in
  Explore **cannot be assumed** to originate from the GitHub Pages emit surface alone.
- ⚠️ Architectural note: per the source preflight, the GitHub click-tracking D4 events
  (`click_affiliate_cta` / `click_related_link` / `click_other_link`) are emitted by the
  **GitHub Pages** templates; the **Blogger** templates do **not** emit this D4 click set.
  This is current architecture state, **not** a bug. Reconciling "Blogger stream has
  traffic but does not emit D4 click events" vs "GitHub stream emits D4 but shows no 48h
  data on the stream screen" is exactly why a **stream / hostname / page_location filter**
  is the recommended next manual check (§H.A) before drawing stream-attribution
  conclusions.

---

## G. Interpretation and verdict

- ✅ **D4 custom dimensions populated in Explore = PASS.** All four D4 dimensions are
  selectable with populated, non-`(not set)` values per Dean's user-provided evidence.
- ✅ **Deferred-field registration discipline = PASS.** No raw-URL / token-bearing field is
  registered as a custom dimension.
- 🟡 **GitHub stream current-48h status = WATCH.** The GitHub stream (`…HLELH`) showed no
  past-48h data on the stream screen; current GitHub stream live traffic is not claimed.
- 🟡 **Raw-params allowlist = source landed/frozen at `bb56ea6`; live verification still
  WATCH.** The Route B central forwarding filter is now in source (see §M, 2026-06-24
  follow-up), so `link-tracker.js` no longer forwards non-allowlisted `data-ga4-param-*`
  values. But **live production verification remains WATCH**: no build/deploy was done, the
  static HTML still carries the `data-ga4-param-link_url` / `target_url` attrs (templates
  unchanged), the live GitHub Pages bundle is **not** proven to contain the new JS, and the
  GA4 backend has **not** been re-observed. `link_url` / `target_url` / `outbound` therefore
  stay WATCH until a separately approved build/deploy + live GA4 observation.
- 🟡 **Overall D4 data-flow = PASS with WATCH** (not unrestricted PASS), pending a
  stream-filtered confirmation of which stream produced the D4 rows.
- ✅ **Naming integrity preserved.** All four keys match D1 §5 verbatim.
- ✅ **All red lines held.** No GA4 backend access by Claude, no source change, no build /
  deploy / repost, no admin write; no full measurement ID / AdSense / affiliate token / PII
  written to this record.

---

## H. Next recommendations

- **A. Stream / hostname / page_location filtered follow-up (recommended next manual
  check).** In a future manual GA4 session, Dean adds a **data stream name / stream ID /
  page location / hostname** dimension or filter in Explore to confirm **which stream**
  produced the D4 rows, and to reconcile the Blogger-has-traffic / GitHub-no-48h-data
  observation. Resolves the WATCH in §G.
- **B. Separate GA4 param allowlist source phase** for `link_url` / `target_url` /
  `outbound` (and any future raw-URL-class param). Would introduce an explicit allowlist /
  filter in the emit path (`link-tracker.js` and/or the inline `data-ga4-param-*` attrs) so
  deferred fields are not transmitted as raw event params. **Requires its own phase +
  explicit Dean approval + build/verify;** not done here.
- **C. No immediate source change in this docs-only evidence phase.** This phase adds only
  this record; source, settings, build, and backend are untouched.

---

## I. Deferred / do-not-register fields (reaffirmed)

The following remain **do-NOT-register** as custom dimensions and were **not** added,
registered, or promoted to a dimension in this phase (per D4 §6 / operator packet §C.5):

- `target_url` / `link_url` / `outbound` / any raw full URL
- any user identifier / any personal data
- any high-cardinality raw value beyond the by-design `link_label` anchor text

This record makes no change to the registered dimension set; it only ledgers Dean's
observation that the already-registered four are flowing and the deferred fields stay
unregistered (with the §E.2 transmission caveat).

---

## J. Cross-links

- `docs/20260623-ga4-d4-data-flow-early-evidence-record.md` (early data-flow record — this
  record is its window-complete companion)
- `docs/20260622-ga4-d4-registration-evidence-record.md` (registration evidence record)
- `docs/20260622-ga4-d4-manual-registration-operator-packet.md` (operator packet — §C
  per-dimension authority, §C.5 deferred fields, §F masking, §G conservative interpretation)
- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` (D4 first-batch
  checklist — §5 4-dimension table, §6 deferred fields)
- `docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1 — authoritative parameter key /
  display name / scope §5; all 4 D4 keys match verbatim)
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` (P1 registration record)
- `docs/ga4-parameter-naming-registry.md` (P1 naming + UTM registry)
- `content/settings/ga4.config.json` (Blogger measurement ID lives here; not modified in
  this phase)
- `CLAUDE.md` §3a Core operating rules / §3a Red lines / §29

---

## K. Blocked actions (not performed; not auto-allowed later)

Each of the following was **not** done in this phase and is **not** auto-allowed later —
each, if ever wanted, requires its **own phase + explicit Dean approval** (several stay
permanently forbidden per CLAUDE.md §29 / §3a red lines):

- 🔴 Claude logging in to / accessing / operating / querying GA4, AdSense, Search Console,
  Blogger, Drive, or Google Form (no credentials; will not).
- 🔴 Calling the GA4 Admin API / Reporting API / Data API (permanently forbidden for this
  repo).
- 🔴 Claude building / running / exporting any GA4 Explore / Realtime / DebugView report.
- 🔴 Editing `content/settings/ga4.config.json` (`measurementId` / `enabled` / `events[]`).
- 🔴 Any source change to add / remove / filter `data-ga4-param-*` attributes (the §H.B
  allowlist phase — separately approved).
- 🔴 `npm run build*` / `preview` / dev server / any deploy / `gh-pages` push.
- 🔴 Blogger repost (stays BLOCKED).
- 🔴 Reverse UTM live activation (pm-26 deploy gate stays BLOCKED; source dormant).
- 🔴 Reopening ADMIN or any write path (Apply / Save / middleware / `admin-write-cli` /
  `--apply` / `dryRun:false`).
- 🔴 Registering any deferred field from §I.
- 🔴 Writing a full `measurementId` / real AdSense client / slot / affiliate token /
  property ID / account ID / email / personal data into `docs/`, `CLAUDE.md`, `MEMORY.md`,
  `src/`, commits, or chat.

---

## L. Record verdict

- ✅ Baseline matched on entry (`199353a`); no repair attempted; `.git/index.lock` absent.
- ✅ This phase adds exactly **one** docs file (this evidence record) and nothing else.
- ✅ **docs-ONLY**; Claude did **not** access GA4; Claude did **not** query / build / run
  any GA4 report. Dean produced the GA4 reports / read the GA4 screens; this record only
  ledgers the user-provided evidence.
- ✅ **Two-stream clarification recorded** (Blogger `…PF8VD` vs GitHub `…HLELH`; distinct
  measurement IDs; measurement IDs masked to tail4 per §F).
- ✅ **D4 custom dimensions populated = PASS** (all 4 selectable + populated in Explore per
  user-provided evidence; keys match D1 §5 verbatim).
- ✅ **Deferred-field registration discipline = PASS** (raw-URL / token fields not
  registered as dimensions), with the §E.2 caveat that *not registered* ≠ *not transmitted*.
- 🟡 **GitHub stream current-48h status = WATCH** (no past-48h data on the stream screen).
- 🟡 **Raw-params allowlist = source landed/frozen at `bb56ea6`; live verification WATCH**
  (Route B central filter in source; build/deploy + live GA4 observation not done — see §M).
- 🟡 **Overall D4 data-flow = PASS with WATCH** pending stream-filtered confirmation (§H.A).
- ✅ No build / deploy / Blogger repost / dev server / source change / generated HTML change
  / backend action was done in this phase.
- ✅ ADMIN stays closed / idle freeze; write path dormant; Reverse UTM dormant; pm-26 gate
  BLOCKED.

---

## M. 2026-06-24 follow-up: Route B source allowlist landed

> **Status delta only.** This subsection records that the GA4 param allowlist source work
> (previously listed as the §H.B "separate GA4 param allowlist source phase" / WATCH /
> future phase) has since **landed and frozen in source**. It changes **no** evidence
> verdict in §G / §L except to refine the raw-params allowlist line from
> *"WATCH / future phase"* to *"source landed/frozen at `bb56ea6`; live verification still
> WATCH"*. This follow-up is itself **docs-only**: no source, build, deploy, or backend
> action was taken to write it.

### M.1 Follow-up edit baseline

| Check | Expected | Observed |
| --- | --- | --- |
| branch | `main` | `main` ✅ |
| `HEAD` | `bb56ea6` | `bb56ea6e809f92cb840ce4b2a1e47cfd61072d13` ✅ |
| `origin/main` | `bb56ea6` | `bb56ea6e809f92cb840ce4b2a1e47cfd61072d13` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `feat(ga4): allowlist-filter forwarded event params (drop raw url fields)` | match ✅ |
| working tree (entry) | clean | clean ✅ |
| `.git/index.lock` | absent | absent ✅ |

(The §A.1 baseline above records the **original** creation entry at `199353a`; this M.1
table records the **follow-up** edit entry at `bb56ea6`.)

### M.2 What landed (source allowlist — Route B)

- **Commit:** `bb56ea6` — `feat(ga4): allowlist-filter forwarded event params (drop raw url fields)`.
- **Changed files (source):**
  - `src/js/modules/link-tracker.js` — central forwarding filter (the only behavioural change).
  - `src/scripts/check-ga4-param-allowlist.js` — smoke check for the allowlist.
- **Central filter only.** No EJS template changes; no generated HTML changes.
- **Allowlisted params (still forwarded by `link-tracker.js`):**
  `link_type`, `provider`, `placement`, `link_label`, `post_slug`, `surface`,
  `click_area`, `nav_direction`, `target_slug`.
- **Dropped by `link-tracker.js` (no longer forwarded):**
  `link_url`, `target_url`, `outbound`, `link_source_key`, and any other
  non-allowlisted `data-ga4-param-*`.

### M.3 Precise scope — what this does and does NOT establish

- ✅ The filter **now prevents `link-tracker.js` from forwarding** non-allowlisted
  `data-ga4-param-*` values to `gtag` (source behaviour).
- ❌ It does **not** remove the `data-ga4-param-link_url` / `data-ga4-param-target_url`
  attributes from the **static HTML** — Route B did **not** modify the EJS templates, so the
  attributes are still emitted in markup (they are simply no longer forwarded by the JS).
- ❌ It does **not** prove the **current live GitHub Pages** site carries the new JS bundle:
  **no build/deploy was done** in this source landing, so the deployed bundle is unproven.
- ❌ It does **not** independently confirm GA4 backend behaviour. Dean would need to
  **independently verify the GA4 backend** after a future live deployment.

### M.4 Checks run (read-only; this follow-up)

| Check | Result |
| --- | --- |
| `node src/scripts/check-ga4-param-allowlist.js` | **13/13 passed** ✅ |
| `node src/scripts/check-blogger-operator-guidance.js` | **11 / 0** ✅ |
| `node src/scripts/check-platform-policy-effective.js` | **40 / 0** ✅ |

No build / deploy / dev / preview / backend action was taken to run these — they are
read-only `node` smoke checks.

### M.5 Future verification (separately approved; not done here)

- Future **build / deploy / live observation** if/when Dean wants the live GitHub Pages site
  to actually serve the new JS bundle.
- Future **GA4 DebugView / Realtime** check to verify that `link_url` / `target_url` /
  `outbound` **no longer appear** in the raw event params after a live deployment.
- The deferred params stay **dropped in source only**; nothing is re-enabled, and any change
  to the allowlist (add/remove a param) requires **separate re-approval**.

### M.6 Evidence status after this follow-up (refined)

- ✅ **D4 custom dimensions populated in Explore = PASS** (unchanged).
- ✅ **Deferred-field registration discipline = PASS** (unchanged; raw-URL / token fields
  still not registered as custom dimensions).
- 🟡 **GitHub stream current-48h status = WATCH** (unchanged).
- 🟢→🟡 **Raw-params allowlist = source landed/frozen at `bb56ea6`; live deployment / GA4
  backend verification remains WATCH.**
- 🟡 **Overall D4 data-flow = PASS with WATCH** (unchanged).

---

（本文件結束 / end of document）
