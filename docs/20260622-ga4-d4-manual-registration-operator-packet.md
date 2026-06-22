# GA4 D4 — Manual Registration Operator Packet (docs-only)

- Phase name: `20260622-pm-ga4-d4-manual-registration-operator-packet-docs-only-a`
- Date: 2026-06-22 (Asia/Taipei; ~18:02)
- Author of record: Dean (operator) / Claude Code (docs drafting only)
- Type: **OPERATOR PACKET ONLY — not a GA4 setup completion**

---

## 0. Critical disclaimers (read first)

This document is an **operator packet** — a step-by-step manual action list and evidence
template that Dean *may* follow later, **outside Claude**, **only if Dean chooses to
proceed**. It records **no** GA4 backend state and authorizes **no** action.

The following statements are true for this phase and must be stated clearly:

1. **This packet is docs-ONLY.** Its only mutation is the addition of this single
   Markdown file under `docs/`. Nothing here means a GA4 dimension exists, is registered,
   or is collecting data.
2. **Claude did not access GA4.** Claude is not logged in to any Google / GA4 / AdSense /
   Search Console / Blogger / Drive account, and fetched no dashboard, page, or API in
   this phase.
3. **Claude did not create, edit, register, or verify any GA4 custom dimension.** No
   Admin → Custom definitions action was taken; no parameter was registered, renamed,
   deleted, or confirmed.
4. **No build, deploy, Blogger repost, dev server, source change, generated HTML change,
   or live verification was done.** No `npm run build*`, no `preview`, no `gh-pages`
   action, no Blogger repost, no GA4 / Search Console / Drive action.
5. **The packet is for Dean to manually perform later, outside Claude, only if Dean
   chooses to proceed.** This file's existence is not proof that any step was performed.

### 0.1 Purpose

To give Dean a single, self-contained, copy-and-follow checklist for manually registering
the **D4 first-batch** of 4 GA4 event-scoped custom dimensions in the GA4 web UI, plus an
evidence template Dean can fill in afterward. Authority for parameter key / display name /
scope remains **`docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1) §5**; this
packet introduces **no** new names and must not create drift.

---

## A. Baseline and scope

### A.1 Baseline observed (this session)

| Check | Expected | Observed |
| --- | --- | --- |
| `pwd` | `…/portable-blog-system` | `/d/github/blog-new/portable-blog-system` ✅ |
| branch | `main` | `main` ✅ |
| `HEAD` | `e3869ba` | `e3869baf5a8f09fd459891a04afbd51e38d17f4e` ✅ |
| `origin/main` | `e3869ba` | `e3869baf5a8f09fd459891a04afbd51e38d17f4e` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `docs(project): checkpoint k3 k4 k5 planning closure` | match ✅ |
| working tree | clean | clean ✅ |

Baseline matched on entry; no repair was needed or attempted. Inspection was read-only
(`Read` / `Glob`); no controlled file was touched.

### A.2 In scope

- Add exactly **one** docs-only operator-packet file (this file).

### A.3 Out of scope (not touched)

- `src/`, `views/`, `scripts/`, `content/`, `settings/`, `templates/`, `public/`,
  `package.json`, lockfile, `vite.config.js`, `dist*/`, `gh-pages`, `.cache/`,
  `CLAUDE.md`, `MEMORY.md`.
- **No** build / deploy / preview / repost. **No** dev server.
- **No** GA4 / AdSense / Search Console / Blogger / Drive backend login or action.
- **No** admin write / middleware / `admin-write-cli` / Apply / `--apply` / `dryRun:false`.
- **No** Blogger repost; Reverse UTM stays **dormant**; pm-26 deploy gate stays
  **BLOCKED**; ADMIN line stays **closed / idle freeze** (K7 / K8 / K9 / R4 post-K chain
  remains closed — this phase does **not** reopen ADMIN).

---

## B. Source: first-batch checklist and K.4 preanalysis

This packet is a **consolidation** of two already-landed docs-only artifacts and does
**not** supersede them or D1:

| Source doc | Role |
| --- | --- |
| `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` | D4 first-batch checklist (§4 GA4 UI path, §5 the 4-dimension table, §6 deferred/forbidden) — the authoritative checklist this packet restates for operator convenience |
| `docs/20260622-k4-ga4-p2-p3-dimension-expansion-preanalysis.md` | K.4 preanalysis (§C planned set, §E candidates, §F deferred, §G privacy notes) — the risk view this packet's "low-risk vs raw URL" rationale mirrors |
| `docs/20260617-night-ga4-d1-parameter-naming-spec.md` | D1 — **authoritative** parameter key / display name / scope (§5). On any naming conflict, **D1 wins.** |

The D4 checklist remains **docs-only and frozen**; Dean has **not yet** registered it in
the GA4 backend. This packet does not modify, re-open, or expand it — it only restates it
in operator form and adds an evidence template.

---

## C. Four dimensions Dean may manually register

> ⚠️ **Naming-conflict note (D1 authority).** The operator brief listed dimension #1 as
> "type". D1 §5 / D4 §5 define its **exact event-parameter key** as **`link_type`**. Per
> the standing rule that **D1 remains authority for exact naming if there is any
> conflict**, the parameter key below is `link_type`, not `type`. The other three keys
> (`provider`, `placement`, `link_label`) match D1 exactly. Display names below are
> human-readable; if they conflict with D1, **D1 wins** and Dean should copy the key
> verbatim from D1 §5.

All four are **event-scope** dimensions, all are already **LIVE** on GitHub Pages today,
and each is **low risk relative to raw URL fields** (see the per-dimension rationale).

### C.1 Dimension 1 — `link_type`

- **Scope:** Event
- **Event parameter name:** `link_type` *(D1-authoritative; brief shorthand was "type")*
- **Display name (suggested):** `Link Type` *(D1 §5.1 is authority if conflict)*
- **Description (short purpose):** Link category: affiliate / cross_site / internal /
  external.
- **Why it is low risk vs raw URL fields:** It is a small, closed enum (≈4 stable values),
  not a free-form string. Unlike `target_url` / `link_url`, it cannot leak an affiliate
  tracking token (`uid1=…`) or a personal identifier, and it will never explode GA4
  cardinality into `(other)` bucketing.

### C.2 Dimension 2 — `provider`

- **Scope:** Event
- **Event parameter name:** `provider`
- **Display name (suggested):** `Link Provider` *(D1 §5.1 is authority if conflict)*
- **Description (short purpose):** Affiliate channel display name (e.g. 通路王).
- **Why it is low risk vs raw URL fields:** It carries only a channel display name, not a
  URL or query string. Cardinality is currently single-valued (`通路王`) and bounded by the
  channel list; it exposes no token, ID, or personal data that a raw URL would.

### C.3 Dimension 3 — `placement`

- **Scope:** Event
- **Event parameter name:** `placement`
- **Display name (suggested):** `Link Placement` *(D1 §5.1 is authority if conflict)*
- **Description (short purpose):** Link position: article_top / article_bottom /
  related_links / other_links.
- **Why it is low risk vs raw URL fields:** It is a small, closed enum (≈4 values)
  describing *where on the page* a link sits, not *where it points*. It contains no URL,
  no token, and no personal data.

### C.4 Dimension 4 — `link_label`

- **Scope:** Event
- **Event parameter name:** `link_label`
- **Display name (suggested):** `Link Label` *(D1 §5.1 is authority if conflict)*
- **Description (short purpose):** Visible link text (often a title or a fixed string).
- **Why it is low risk vs raw URL fields:** It is the human-visible anchor text, not the
  destination URL — so it cannot carry an affiliate tracking token or query parameters.
  **Caution:** its cardinality is *high* (it tracks titles), so GA4 may aggregate rare
  values into `(other)`; that is an analysis-quality caveat, **not** a privacy or leakage
  risk. `target_slug` (already registered in P1) is a lower-cardinality alternative if the
  `(other)` bucketing later proves unhelpful.

### C.5 Deferred fields — do NOT register

The following are explicitly **deferred / not to be registered** as custom dimensions in
this batch (per D4 §6 and K.4 §F):

- `target_url`
- `link_url`
- `outbound`
- any raw full URL
- any user identifier
- any personal data
- any high-cardinality value

Rationale: raw URLs (`target_url` / `link_url`) are high/very-high cardinality and
`link_url` can contain an affiliate redirect token (`uid1=…`); `outbound` overlaps
`link_type=external`. Query raw URLs only via GA4 Explore `event_params` (unregistered);
prefer the slug / type / provider proxies above. **Event-scope only** — no user-scope or
item-scope dimension is in scope (this system has no membership / no DB; per CLAUDE.md §29).

---

## D. Step-by-step manual GA4 UI checklist for Dean

> Dean performs all of these **manually, in the GA4 web UI, only if choosing to proceed.**
> Claude performs none of them. Register one dimension at a time; repeat steps 3–9 for
> each of the four.

GA4 navigation path (English UI; Chinese-UI equivalents in parentheses):

```
GA4
  → Admin (管理)
    → Data display (資料顯示)
      → Custom definitions (自訂定義)
        → Custom dimensions tab (自訂維度)
          → Create custom dimensions (建立自訂維度)
```

Per-dimension manual checklist:

- [ ] 1. Open GA4 and confirm you are in the **correct property** (verify before any
      change; note: the property/account IDs will be masked in evidence — see §F).
- [ ] 2. Go to **Admin → Data display → Custom definitions → Custom dimensions**.
- [ ] 3. Click **Create custom dimensions**.
- [ ] 4. Set **Scope = Event** (never User, never Item).
- [ ] 5. Set **Dimension name** = the suggested display name from §C for this dimension
      (e.g. `Link Type`). If unsure, defer to D1 §5.1.
- [ ] 6. Set **Event parameter** = the exact key from §C, copied verbatim:
      `link_type` / `provider` / `placement` / `link_label`. Do **not** abbreviate
      `link_type` to `type`.
- [ ] 7. Set **Description** = the short purpose from §C (keep ≤ 50 chars; GA4 field limit).
- [ ] 8. Click **Save**.
- [ ] 9. Confirm the new row appears in the Custom dimensions list with the correct
      **parameter name** and **Scope = Event**.
- [ ] 10. Repeat steps 3–9 for the next dimension until all four are created.
- [ ] 11. Note if GA4 displays any "processing may take time" / data-latency message; this
      is expected and is **not** a failure.

⚠️ Reminders while operating:
- Fix **Scope = Event** for all four.
- Copy the **exact parameter key** from §C; a typo (e.g. `link_typ`, `Provider`,
  `placment`) silently produces a dimension that never matches a live event.
- Do **not** register any deferred field from §C.5.

---

## E. Evidence Dean should capture

If Dean proceeds and wants a later docs-only evidence record, capture the following
(masked — see §F) and hand it to Claude strictly as **user-provided manual evidence**:

| Item | Form | Note |
| --- | --- | --- |
| GA4 property context | masked screenshot or text | property / account IDs **masked** (see §F) |
| Date and local time | text | exact date + Asia/Taipei local time of the action |
| Each custom dimension row after creation | masked screenshot or text | one per dimension; show the saved row |
| Scope = Event (per dimension) | screenshot or text | confirm Scope reads **Event**, not User/Item |
| Parameter name matches expected key | text | exact key `link_type` / `provider` / `placement` / `link_label` |
| Display name (per dimension) | text | the name as actually saved |
| Optional latency note | text | whether GA4 says processing may take time |

Per-dimension capture checklist:

- [ ] `link_type` — row screenshot/text + Scope=Event + parameter key + display name
- [ ] `provider` — row screenshot/text + Scope=Event + parameter key + display name
- [ ] `placement` — row screenshot/text + Scope=Event + parameter key + display name
- [ ] `link_label` — row screenshot/text + Scope=Event + parameter key + display name
- [ ] Date + Asia/Taipei local time recorded
- [ ] Optional GA4 latency/processing note recorded
- [ ] Mark any field that is not visible as `not visible` — **do not guess**

---

## F. Masking and privacy rules

Before saving or sharing **any** screenshot or note, Dean must mask:

- GA4 **property ID**
- **account ID**
- **email**
- **measurement ID** if visible (only a masked tail4 such as `…PF8VD` may ever be written
  to docs / `MEMORY.md` / any ledger — never the full ID)
- any **publisher ID** or **AdSense ID** if visible (`pub-…` / `ca-pub-…`)
- any **personal identifiers**, names, phone numbers, or **address information**

Additional standing red lines (per CLAUDE.md §3a / D4 §6.5):

- Real AdSense `client id` / `slot id` live **only** in `content/settings/ads.config.json`
  and must never appear in `docs/`, commits, chat, `CLAUDE.md`, or `MEMORY.md`.
- Affiliate dashboard credentials / tokens / commission / payout figures must never be
  captured.
- Affiliate tracking tokens (`uid1=<personal-id>` inside a URL) must never be registered
  as a dimension or written to docs.
- Google Forms responses (email / name / phone / school / answers) are never in scope.
- Blogger `postId` / precise `publishedAt` must never be guessed.

---

## G. Conservative interpretation rules

- **A docs-only checklist is not proof of registration.** This packet existing ≠ any
  dimension exists.
- **GA4 does not backfill history.** A newly registered dimension only populates from new
  events forward; historical events will show `(not set)` for it. That is expected.
- **Empty reports right after registration = pending, not failure.** Allow **24–72h**
  after registration *and* a fresh click before reading reports; record interim state as
  **pending**, never FAIL.
- **`(not set)` is often structural, not a bug.** Emit surfaces are asymmetric (nav anchors
  do not inject `placement`; CTA/related/other anchors do not inject every nav param).
  Filter by `event_name` (+ the relevant `click_area` / `placement`) before reading a
  dimension; per-dimension `(not set)` for non-emitting events is normal.
- **GitHub Pages is the only emit surface today.** Blogger `click_*` events are not landed
  (Blogger listener is a future, separately-approved phase). Blogger having no values is a
  known gap, not a failure.
- **High-cardinality `(other)` bucketing (esp. `link_label`) is a known caveat,** not a
  data error.
- **Any figure needs an exact date range + source screen** to be quoted at all, and even
  then only as "user-provided manual evidence reports X".

---

## H. Common mistakes to avoid

- ❌ Setting **Scope = User or Item** instead of Event.
- ❌ Abbreviating `link_type` to `type` in the Event parameter field (the brief's
  shorthand; the live key is `link_type`).
- ❌ Typos in the parameter key (`Provider`, `placment`, `link_lable`) — case- and
  spelling-sensitive; a typo yields a dimension that never matches a live event.
- ❌ Registering a deferred field (`target_url` / `link_url` / `outbound` / any raw URL /
  any high-cardinality or personal field) from §C.5.
- ❌ Renaming an already-live parameter key later — GA4 does not rename history; treat D1
  §5 keys as immutable once live.
- ❌ Reading reports immediately and declaring failure when they are empty (it is pending).
- ❌ Saving or sharing an unmasked screenshot (property ID / account ID / email /
  measurement ID / publisher ID / personal data — see §F).
- ❌ Writing a full `measurementId` or real AdSense client/slot into any doc, commit, or
  chat.

---

## I. Do-not-claim list

Claude must **not** state any of the following (now or after receiving evidence) unless
Dean supplies dated, sourced, masked evidence that directly shows it — and even then only
as "user-provided manual evidence reports X":

- ❌ Do **not** say GA4 registration is complete until Dean provides evidence.
- ❌ Do **not** say data is flowing.
- ❌ Do **not** say reports are populated.
- ❌ Do **not** say historical data is available.
- ❌ Do **not** say tracking is verified.
- ❌ Do **not** say any routes / pages were retested.
- ❌ Do **not** say any backend metric was observed by Claude.

All future GA4 backend / live evidence = **user-provided manual evidence only**; Claude
confirms no dashboard metric itself.

---

## J. Follow-up evidence record template

> Template for a *future* docs-only evidence record (suggested filename:
> `docs/2026XXXX-ga4-d4-first-batch-evidence-record.md`), to be filled in **only** from
> Dean's masked, dated, source-labeled manual evidence. Reproduced here so Dean can copy
> it; this packet itself records no values.

```
# GA4 D4 first-batch evidence record (docs-only)

- Phase: 2026XXXX-...-evidence-record-docs-only-a
- Date observed (Asia/Taipei): <date + local time, Dean-provided>
- Property context: <masked — property/account IDs masked per §F>
- Measurement ID (masked tail4 only): …PF8VD   # full ID forbidden
- Source: user-provided manual evidence (screenshots/notes); Claude accessed no backend

## Per-dimension verdict
| # | Parameter key | Display name | Scope=Event? | Registered (per evidence) | Realtime non-(not set)? | Verdict |
| - | ------------- | ------------ | ------------ | ------------------------- | ----------------------- | ------- |
| 1 | link_type     | Link Type    | <Y/N>        | <Y/N>                     | <Y/N/pending>           | PASS/PARTIAL/FAIL/pending |
| 2 | provider      | Link Provider| <Y/N>        | <Y/N>                     | <Y/N/pending>           | PASS/PARTIAL/FAIL/pending |
| 3 | placement     | Link Placement| <Y/N>       | <Y/N>                     | <Y/N/pending>           | PASS/PARTIAL/FAIL/pending |
| 4 | link_label    | Link Label   | <Y/N>        | <Y/N>                     | <Y/N/pending>           | PASS/PARTIAL/FAIL/pending |

## Notes
- Latency window respected (24–72h)? <Y/N>
- (not set) explained by emit-surface asymmetry where applicable? <Y/N>
- Any field not visible marked "not visible" (not guessed)? <Y/N>
- Masking applied to all screenshots? <Y/N>
```

---

## K. Blocked actions (not performed; not auto-allowed later)

Each of the following was **not** done in this phase and is **not** auto-allowed later —
each, if ever wanted, requires its **own phase + explicit Dean approval** (and several
stay permanently forbidden per CLAUDE.md §29 / red lines):

- 🔴 Logging in to / accessing / operating / modifying GA4, AdSense, Search Console,
  Blogger, or Drive (no credentials; will not).
- 🔴 Calling the GA4 Admin API / Reporting API (permanently forbidden for this repo).
- 🔴 Registering / editing / deleting / verifying any GA4 custom dimension.
- 🔴 Editing `content/settings/ga4.config.json` (`measurementId` / `enabled` / `events[]`).
- 🔴 Any source change to inject new `data-ga4-param-*` attributes (a future D2 source
  phase, separately approved).
- 🔴 `npm run build*` / `preview` / dev server / any deploy / `gh-pages` push.
- 🔴 Blogger repost (Batch 2 P2 / P3 live repost stays BLOCKED).
- 🔴 Reverse UTM live activation (pm-26 deploy gate stays BLOCKED; source dormant).
- 🔴 Reopening ADMIN or any write path (Apply / Save / middleware / `admin-write-cli` /
  `--apply` / `dryRun:false`).
- 🔴 Writing a full `measurementId` / real AdSense client / slot / affiliate token into
  `docs/`, `CLAUDE.md`, `MEMORY.md`, `src/`, commits, or chat.

---

## L. Packet verdict

- ✅ Baseline matched on entry (`e3869ba`); no repair attempted.
- ✅ This phase adds exactly **one** docs file (this packet) and nothing else.
- ✅ **docs-ONLY**; Claude did **not** access GA4; Claude did **not** create / edit /
  register / verify any GA4 custom dimension.
- ✅ No build / deploy / Blogger repost / dev server / source change / generated HTML
  change / live verification was done.
- ✅ ADMIN stays closed / idle freeze; write path dormant; Reverse UTM dormant; pm-26 gate
  BLOCKED.
- ⏸ This packet is **for Dean to manually perform later, outside Claude, only if Dean
  chooses to proceed.** No GA4 dimension is registered, no data is flowing, no report is
  populated. Awaiting Dean's manual action + explicit approval before any further step.

---

## M. Cross-links

- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` (D4 first-batch
  checklist — authoritative checklist this packet restates)
- `docs/20260622-k4-ga4-p2-p3-dimension-expansion-preanalysis.md` (K.4 risk preanalysis)
- `docs/20260617-night-ga4-d1-parameter-naming-spec.md` (D1 — authoritative naming §5)
- `docs/20260622-k3-k4-k5-docs-only-closure-checkpoint.md` (K-line closure checkpoint)
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` (P1 registration record)
- `docs/ga4-parameter-naming-registry.md` (P1 naming + UTM registry)
- `content/settings/ga4.config.json` (masked tail4 `…PF8VD`; events declaration)
- `CLAUDE.md` §3a Core operating rules / §3a Red lines / §29

---

（本文件結束 / end of document）
