# K.4 — GA4 P2 / P3 Dimension Expansion Preanalysis (docs-only)

- Phase name: `20260622-pm-k4-ga4-p2-p3-dimension-expansion-preanalysis-docs-only-a`
- Date: 2026-06-22 (Asia/Taipei)
- Author of record: Dean (operator) / Claude Code (docs drafting only)
- Type: **PREANALYSIS ONLY — not a GA4 setup completion**

---

## 0. Critical disclaimers (read first)

This document is a **planning / preanalysis** artifact for *future* GA4 custom-dimension
expansion. It records **no** GA4 backend state and authorizes **no** action.

Explicitly, for this phase:

1. **This is PREANALYSIS ONLY, not GA4 setup completion.** Nothing here means a
   dimension exists, is registered, or is collecting data.
2. **Claude did not access GA4.** Claude is not logged in to any Google / GA4 /
   AdSense / Search Console / Blogger account and fetched no dashboard or API.
3. **No GA4 custom dimension was created, edited, or registered.** No Admin → Custom
   definitions action was taken; no parameter was registered, renamed, or deleted.
4. **No repost / build / deploy was run.** No `npm run build*`, no `preview`, no dev
   server, no `gh-pages` action, no Blogger repost, no GA4 / Search Console / Drive
   action.
5. **No template code / source code / generated HTML was changed.** `src/`, `views/`,
   `scripts/`, `content/`, `settings/`, `package.json`, lockfile, `dist*/`, `gh-pages`,
   `.cache/`, `CLAUDE.md`, `MEMORY.md` are all untouched. The only mutation in this
   phase is the addition of this single docs file.

### 0.1 Purpose

This preanalysis exists to let Dean later, *if and only if explicitly approved*:

- add additional GA4 dimensions **later** (not now);
- define a small set of **safe candidate dimensions**;
- define **what should remain deferred** because of cardinality / privacy / noise;
- hold a **registration plan** that can be acted on if approved later.

It deliberately stops at planning. Authority for parameter key / display name / scope
remains **`docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1) §5** — this file
does not redefine names and must not introduce drift.

---

## A. Phase name and scope

### A.1 Phase

`20260622-pm-k4-ga4-p2-p3-dimension-expansion-preanalysis-docs-only-a`

### A.2 In scope

- Add exactly **one** docs-only preanalysis file (this file).

### A.3 Out of scope (not touched)

- `src/`, `views/`, `scripts/`, `content/`, `settings/`, `package.json`, lockfile,
  `dist*/`, `gh-pages`, `.cache/`, `CLAUDE.md`, `MEMORY.md`.
- **No** build / deploy / preview / repost. **No** dev server.
- **No** GA4 / AdSense / Search Console / Blogger / Drive backend login or action.
- **No** admin write / middleware / `admin-write-cli` / `--apply` / `dryRun:false`.
- **No** Blogger repost; Reverse UTM stays dormant; ADMIN line stays closed (K7 / K8 /
  K9 / R4 post-K chain remains closed — this phase does not reopen ADMIN).

### A.4 Relationship to predecessors

This file is a **continuation** of two prior docs-only preanalyses and does **not**
supersede them or D1:

- `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md` (pre-D series)
- `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md` (continuation)
- `docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1 — authoritative naming)
- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` (D4 first batch)

K.4's added value is a **single consolidated English-language decision view** that sits
beside the K.3 AdSense preanalysis, for Dean to scan before deciding whether to touch
GA4. The risk classification mirrors D4 §6 and the 20260621 doc §5; no new parameter
names are coined.

---

## B. Baseline observed and first-batch registration checklist reference

### B.1 Baseline observed (this session)

| Check | Expected | Observed |
| --- | --- | --- |
| `pwd` | `…/portable-blog-system` | `/d/github/blog-new/portable-blog-system` ✅ |
| branch | `main` | `main` ✅ |
| `HEAD` | `36877eb` | `36877eb4e6fccb2a79821cb9ad259d7b4cb19013` ✅ |
| `origin/main` | `36877eb` | `36877eb4e6fccb2a79821cb9ad259d7b4cb19013` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `docs(adsense): add dashboard observation preanalysis` | match ✅ |
| working tree | clean | clean ✅ |

Baseline matched on entry; no repair was needed or attempted.

### B.2 First-batch registration checklist reference (D4)

The **first batch** of 4 GA4 event-scoped custom dimensions is already specified in
`docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` §5. That checklist is
**docs-only and frozen**; Dean has **not yet** registered it in the GA4 backend. K.4
does **not** modify, re-open, or expand that checklist. The 4 first-batch dimensions are:

| # | Display name | Parameter | Scope | LIVE? | Cardinality | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Link Type | `link_type` | Event | ✅ | low (4 values) | P1-strict backfill |
| 2 | Link Provider | `provider` | Event | ✅ (affiliate CTA) | low (single `通路王`) | P2 |
| 3 | Link Placement | `placement` | Event | ✅ (aside 4 anchors; nav none) | low (4 values) | P2 |
| 4 | Link Label | `link_label` | Event | ✅ (all 5 anchor classes) | high (≈ title) | P2 (caution) |

> Source of truth for these names remains D1 §5. The table above is a reference copy.

---

## C. Dimensions already planned / accepted

| Tier | Dimensions | Status | Where defined |
| --- | --- | --- | --- |
| P1 (already registered) | `click_area` / `nav_direction` / `post_slug` / `target_slug` / `surface` | ✅ Registered in GA4 (per Dean) | `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` |
| D4 first batch (planned, not yet registered) | `link_type` / `provider` / `placement` / `link_label` | 📝 Checklist landed (docs-only); GA4 backend not yet done | D4 §5 |

Running registered count if Dean executes D4: **P1 (5) + D4 first batch (4) = ≤ 9**,
well under the GA4 event-scoped soft ceiling (~50). K.4 proposes **no** new registration
beyond this; it only classifies what *might* come **after** D4, should ROI justify it.

---

## D. Expansion goals (P2 / P3)

These are goals for **future, approval-gated** work — not actions in this phase.

- D-G1. Keep the dimension set **small and high-signal**: only register a parameter when
  it answers a question P1 + D4 cannot, and only when its cardinality is bounded.
- D-G2. Treat **P2 / P3 article context conservatively.** P2 (`ai-tools-simplify-daily-workflow`)
  and P3 (`blog-restart-steady-rhythm-notes`) are live-content posts; any article-context
  dimension (content kind, category) should be evaluated for ROI *before* a source change,
  not pre-emptively wired.
- D-G3. **Prefer event-scope only.** Avoid user-level dimensions entirely — this BLOG
  system has no membership / no user identity / no DB backend (per CLAUDE.md §29), so
  user-scoped dimensions are both unnecessary and a privacy risk.
- D-G4. **Avoid high cardinality and personal-data exposure.** Do not register raw URLs
  as custom dimensions unless a future explicit decision reverses this. Prefer slug-based
  low-cardinality proxies already available (e.g. `target_slug` over `target_url`).
- D-G5. Preserve **dimension-name continuity**: never rename a registered parameter key;
  renames break historical continuity in GA4.

---

## E. Candidate dimensions table

> Risk roadmap only. Parameter key / display name / scope authority remains D1 §5.
> "LIVE?" = whether the parameter is already emitted on GitHub Pages today.

### E.1 Safe / low-cardinality (event-scope; within D4 first batch)

| Display name | Parameter | LIVE? | Cardinality | When to register | Note |
| --- | --- | --- | --- | --- | --- |
| Link Type | `link_type` | ✅ | low (4) | D4 first batch | affiliate / cross_site / internal / external |
| Link Provider | `provider` | ✅ (affiliate CTA) | low (single `通路王`) | D4 first batch | → medium if commerce L2 adds networks |
| Link Placement | `placement` | ✅ (aside 4 anchors) | low (4) | D4 first batch | nav placement carried by `click_area` |

### E.2 Safe but caution (event-scope; accept `(other)` aggregation)

| Display name | Parameter | LIVE? | Cardinality | When to register | Caution |
| --- | --- | --- | --- | --- | --- |
| Link Label | `link_label` | ✅ (all 5 anchors) | high (≈ title) | D4 first batch | title edits break continuity; `target_slug` is an alternative |

### E.3 Medium risk (needs D2 source change before it can emit)

| Display name | Parameter | LIVE? | Cardinality | When to register | Blocker |
| --- | --- | --- | --- | --- | --- |
| Content Kind | `content_kind` | ❌ | low (≤ 7) | D4 second batch | D2 source preflight + additive source + redeploy + Dean approval |
| Category | `category` | ❌ | low–medium (per `categories.json`) | D4 second batch | same as above |
| Commerce Link ID | `commerce_link_id` | ❌ | medium (per `commerce-links.json`) | D4 second batch | D2 preflight + commerce L2 dependency |
| Link Source Key | `link_source_key` | ✅ (conditional) | low–medium | later batch | `sourceKey` adoption rate must rise first |

### E.4 Future planned (needs D2 + source; low urgency; defer)

| Display name | Parameter | Cardinality | Recommendation | Blocker |
| --- | --- | --- | --- | --- |
| Tag Count | `tag_count` | low (0–~20) | P3; low ROI; defer | D2 source phase |
| Series Key | `series_key` | low | P3; defer until ≥ 2 series | D2 source phase |
| Merchant Key | `merchant_key` | low | P3; defer until multi-network | D2 source + commerce L2 |
| Label Override Present | `label_override_present` | low (bool) | P3; defer | D2 source phase |
| Surface Ads Enabled | `surface_ads_enabled` | low (bool) | P3; pair with AdSense ramp | D2 source phase |

---

## F. Deferred / do-not-register dimensions

These parameters may be **LIVE** but are explicitly **not** recommended for registration.

| Parameter | Status | Reason | Alternative | Unblock condition |
| --- | --- | --- | --- | --- |
| `target_url` | LIVE (nav only) | high cardinality; info already in registered `target_slug` | use `target_slug`; query raw URL via Explore `event_params` (unregistered) | re-evaluate only if Explore event_params querying proves impractical |
| `link_url` | LIVE | very high cardinality; contains affiliate redirect `uid1` token; overlaps `target_url` | `link_type=affiliate` + `provider` filter; per-link ROI via `commerce_link_id` (future) | **not recommended to unblock** |
| `outbound` | LIVE | overlaps `link_type` (`link_type=external` already implies it) | `link_type=external` filter | **not recommended to unblock** (quota waste) |
| `link_source_key` | LIVE (conditional) | emits only when entry supplies `sourceKey`; report easily `(not set)` | wait for adoption rate to rise | adoption ≥ ~50% of ready posts |

> **Raw URLs (`target_url`, `link_url`) must not be registered as custom dimensions**
> unless a future explicit decision reverses this. The default is: use slug / type /
> provider proxies and keep raw URLs queryable only via Explore event_params.

---

## G. Cardinality and privacy risk notes

- G1. **Event-scope only.** No user-scoped or item-scoped custom dimension is proposed.
  User-scope would imply tracking identity, which contradicts CLAUDE.md §29 (no member /
  no DB). Item-scope needs e-commerce events (`view_item` / `add_to_cart` / `purchase`)
  this system does not emit.
- G2. **High-cardinality fields create noise + `(other)` bucketing.** `link_label`,
  `target_url`, and `link_url` all scale with content; GA4 silently buckets high-card
  dimensions into `(other)`, which degrades the very analysis they were registered for.
- G3. **Privacy / personal-data avoidance.** No dimension may carry personal data. In
  particular:
  - affiliate tracking tokens (`uid1=<personal-id>` inside `link_url`) must **not** be
    registered;
  - Google Forms responses (email / name / phone / school / answers) are **never** in
    scope;
  - Blogger `postId` / precise `publishedAt` must **not** be guessed or registered;
  - full `measurementId` / AdSense real `client id` / `slot id` must **never** appear in
    docs, `MEMORY.md`, or any ledger (this file uses only masked tail4 `…PF8VD`).
- G4. **Quota discipline.** Keep the registered set lean (target ≤ ~10 after D4 first
  batch) so future commerce / Blogger-listener dimensions have headroom under GA4's ~50
  event-scoped ceiling.
- G5. **Continuity risk.** Renaming a registered parameter key (e.g. switching display
  names mid-stream) does not rename history; treat D1 §5 keys as immutable once live.

---

## H. Manual GA4 registration checklist for Dean

> For Dean to perform manually **later, only after explicit approval**. Claude performs
> none of these. This restates the safe SOP; it does not register anything.

- [ ] Register dimensions **manually only after explicit approval** (per dimension).
- [ ] Use **Event-scope** custom dimensions (never User / Item scope).
- [ ] Keep **exact parameter names stable** — copy the key verbatim from D1 §5; do not
      rename a key that is already live.
- [ ] Path: GA4 → Admin → Data display → Custom definitions → Custom dimensions →
      Create custom dimensions.
- [ ] For each dimension, record: **parameter name**, **display name**, and a
      **screenshot** of the saved definition.
- [ ] **Mask before sharing any screenshot**: property ID / account ID / publisher ID
      (`pub-…` / `ca-pub-…`) / email / and any other personal identifiers.
- [ ] Do **not** register raw URLs (`target_url` / `link_url`) — see §F.
- [ ] After registration + a fresh click, allow 24–72h before reading reports; an empty
      report immediately after registration is **pending**, not a failure.

---

## I. Evidence Dean should capture

If (and only if) Dean later registers dimensions and wants a follow-up evidence record:

| Item | Form | Note |
| --- | --- | --- |
| Custom definition saved screen | masked screenshot or text | confirms display name + parameter key + Scope = Event |
| Realtime → Events (within ~30 min of a click) | screenshot or text | shows the parameter value is non-`(not set)` |
| Explore → Free form with the new dimension | screenshot or text | confirms it is selectable and has values |
| Exact date range + source screen | text | mandatory for any figure |

- [ ] Capture parameter name + display name + screenshot for each dimension.
- [ ] Mask property ID / account ID / email / personal identifiers before sharing.
- [ ] Mark non-visible fields `not visible`; do not guess.
- [ ] Hand masked, dated, source-labeled evidence to Claude **as user-provided manual
      evidence** if a follow-up phase is wanted.

---

## J. Do-not-claim list

Claude must **not** state (now or after receiving evidence) any of the following unless
Dean supplies dated, sourced, masked evidence that directly shows it — and even then only
as "user-provided manual evidence reports X":

- ❌ Do **not** say GA4 registration is complete.
- ❌ Do **not** say data is flowing.
- ❌ Do **not** say reports are populated.
- ❌ Do **not** say P2 / P3 tracking is verified.
- ❌ Do **not** say any GA4 dashboard value was observed by Claude.
- ❌ Do **not** treat a docs-only checklist as proof a dimension exists.
- ❌ Do **not** infer that any repo change caused any GA4 number.

All future GA4 backend evidence = **user-provided manual evidence only**.

---

## K. Blocked actions (not performed; not auto-allowed later)

- 🔴 Logging in to GA4 / AdSense / Search Console / Blogger / Drive (no credentials; will
  not).
- 🔴 Calling GA4 Admin API / Reporting API (permanently forbidden for this repo).
- 🔴 Registering / editing / deleting any GA4 custom dimension.
- 🔴 Editing `content/settings/ga4.config.json` (`measurementId` / `enabled` / `events[]`).
- 🔴 Any source change to inject new `data-ga4-param-*` attributes (that is a future D2
  source phase, separately approved).
- 🔴 `npm run build*` / `preview` / dev server / any deploy / `gh-pages` push.
- 🔴 Blogger repost (Batch 2 P2 / P3 live repost stays BLOCKED); Reverse UTM stays
  dormant (pm-26 gate BLOCKED).
- 🔴 Reopening ADMIN or any write path (Apply / middleware / `admin-write-cli` /
  `--apply` / `dryRun:false`).
- 🔴 Writing full `measurementId` / AdSense real client / slot / affiliate token into
  `docs/`, `CLAUDE.md`, `MEMORY.md`, `src/`, commits, or chat.

Each of the above, if ever wanted, requires its **own phase + explicit Dean approval**.

---

## L. Recommended next follow-up

All options are **docs-only to start**, require Dean explicit approval, and start no
source / build / deploy / repost. Priority order:

| Priority | Follow-up | Nature | Blocker |
| --- | --- | --- | --- |
| 1 | **D4 first-batch GA4 backend registration** (Dean manual, outside repo) then a docs-only **evidence record** | Dean backend action + docs-only record | Dean decides to register the 4 D4 dimensions |
| 2 | **P2 / P3 live observation record** (docs-only; needs Dean masked screenshots) | docs-only | first batch registered + ≥ 7–30d data |
| 3 | **D2 source-level preflight** for `content_kind` / `category` / `commerce_link_id` (docs-only preflight; no source change) | docs-only | only if Dean judges first-batch ROI insufficient |

Conservative default: **idle freeze** — keep the GA4 line at D4 docs-only until Dean
chooses to register. Nothing here auto-advances.

**Not** candidates (per CLAUDE.md §29 / red lines): Blogger listener landing, Blogger
reverse UTM deploy, Admin write path, FB sidecar real write, Blogger AdSense Batch 2 live
repost, AdSense / commerce real-id emit, full `measurementId` / AdSense id in any ledger,
Blogger `postId` guessing, GA4 Admin / Reporting API.

---

## M. Phase status

- ✅ docs-only preanalysis file created (this file).
- ✅ Baseline matched (`36877eb`); no source / settings / build / deploy / GA4 action.
- ✅ No GA4 dimension created / edited / registered; Claude did not access GA4.
- ⏸ Awaiting Dean approval before any further step.

---

## N. Cross-links

- `docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1 — authoritative naming §5)
- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` (D4 first batch)
- `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md` (pre-D series)
- `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md` (continuation §5 risk view)
- `docs/20260621-ga4-d4-first-batch-manual-registration-packet.md` (D4 manual packet)
- `docs/20260622-k3-adsense-dashboard-observation-preanalysis.md` (sibling K.3 preanalysis)
- `docs/ga4-parameter-naming-registry.md` (P1 naming + UTM registry)
- `docs/ga4-link-tracking-spec.md` (event design / param union / placement enum)
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` (P1 registration record)
- `docs/blogger-listener-strategy.md` (Blogger listener asymmetry; D3 preparation)
- `content/settings/ga4.config.json` (masked tail4 `…PF8VD`; events declaration)
- CLAUDE.md §3a Core operating rules / §3a Red lines / §29

---

（本文件結束 / end of document）
