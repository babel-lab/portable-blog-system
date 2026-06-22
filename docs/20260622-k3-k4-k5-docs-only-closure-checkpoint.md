# K.3 / K.4 / K.5 — Docs-only Closure Checkpoint

- Phase name: `20260622-pm-k3-k4-k5-docs-only-closure-checkpoint-a`
- Date: 2026-06-22 (Asia/Taipei)
- Author of record: Dean (operator) / Claude Code (docs drafting only)
- Type: **CHECKPOINT — docs-only closure of the K.3 / K.4 / K.5 planning line**

---

## 0. Critical disclaimers (read first)

1. **This checkpoint is docs-only.** Its only mutation is the addition of this single
   Markdown file under `docs/`.
2. **K.3 / K.4 / K.5 are planning / preanalysis only.** None of them is an observation
   result, a GA4 setup completion, or a live verification.
3. **No backend dashboard was accessed.** Claude is not logged in to any Google / GA4 /
   AdSense / Search Console / Blogger / Drive account, and fetched no dashboard, page, or
   API in this phase or in K.3 / K.4 / K.5.
4. **No build, deploy, repost, dev server, or live verification was run.** No
   `npm run build*`, no `preview`, no `gh-pages` action, no Blogger repost, no GA4 /
   Search Console / Drive action, no dev server started.

### 0.1 Purpose

This checkpoint closes the K.3 / K.4 / K.5 docs-only planning line by recording, in one
place:

- the **current safe baseline** after the three sibling preanalyses landed;
- **what remains blocked** (and stays blocked);
- **what Dean must manually provide** before any future follow-up can start;
- the **next safe work candidates** (all docs-only / approval-gated).

It deliberately stops at planning. It coins no UTM keys, registers no GA4 dimension,
observes no dashboard, and authorizes no action.

---

## A. Baseline and scope

### A.1 Baseline observed (this session)

| Check | Expected | Observed |
| --- | --- | --- |
| `pwd` | `…/portable-blog-system` | `/d/github/blog-new/portable-blog-system` ✅ |
| branch | `main` | `main` ✅ |
| `HEAD` | `3fc9d05` | `3fc9d0507187bc39297587b3a0e67eb96150fb68` ✅ |
| `origin/main` | `3fc9d05` | `3fc9d0507187bc39297587b3a0e67eb96150fb68` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `docs(reverse-utm): add positive fixture preanalysis` | match ✅ |
| working tree | clean | clean ✅ |

Baseline matched on entry; no repair was needed or attempted.

### A.2 In scope

- Add exactly **one** docs-only checkpoint file (this file).

### A.3 Out of scope (not touched)

- `src/`, `views/`, `scripts/`, `content/`, `settings/`, `package.json`, lockfile,
  `dist*/`, `gh-pages`, `.cache/`, `CLAUDE.md`, `MEMORY.md`.
- **No** build / deploy / preview / repost. **No** dev server.
- **No** GA4 / AdSense / Search Console / Blogger / Drive backend login or action.
- **No** admin write / middleware / `admin-write-cli` / `--apply` / `dryRun:false`.
- **No** Blogger repost; Reverse UTM stays **dormant**; pm-26 deploy gate stays
  **BLOCKED**; ADMIN line stays **closed / idle freeze** (K7 / K8 / K9 / R4 post-K chain
  remains closed — this phase does **not** reopen ADMIN).

---

## B. K.3 — AdSense dashboard observation preanalysis status

- File: `docs/20260622-k3-adsense-dashboard-observation-preanalysis.md` (landed
  docs-only).
- **Status: preanalysis only.**
- **No AdSense dashboard was accessed** by Claude. The doc only *prescribes* what Dean
  may manually observe later (policy center status, sites status, recent estimated
  earnings/trend, ad-serving limitations) — it records **no** dashboard data.
- **Future evidence must be Dean-provided screenshots or notes**, treated strictly as
  "user-provided manual evidence reports X".
- **Sensitive IDs must be masked** before any screenshot is saved or shared: publisher ID
  (`pub-…` / `ca-pub-…`), slot / ad-unit ID, bank / tax / payment data, email / account
  identity, and any other personal identifiers. Real `client id` / `slot id` live **only**
  in `content/settings/ads.config.json` and must never appear in `docs/`, commits, or chat.

---

## C. K.4 — GA4 P2 / P3 dimension expansion preanalysis status

- File: `docs/20260622-k4-ga4-p2-p3-dimension-expansion-preanalysis.md` (landed
  docs-only).
- **Status: preanalysis only.**
- **No GA4 dimension was registered, edited, or deleted.** No GA4 backend / Admin / API
  was accessed. The doc only classifies what *might* be registered later.
- **Intended manual focus (the D4 first-batch, low-cardinality, event-scoped set):**
  - `link_type`
  - `provider`
  - `placement`
  - `link_label`
- **Raw URLs and high-cardinality dimensions remain deferred** — `target_url` / `link_url`
  must **not** be registered as custom dimensions; query raw URLs only via GA4 Explore
  `event_params`. Prefer slug / type / provider proxies. Event-scope only (no user / item
  scope). Authority for parameter key / display name / scope remains D1 §5.

---

## D. K.5 — reverse UTM positive fixture preanalysis status

- File: `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md` (landed
  docs-only).
- **Status: preanalysis only.**
- **Reverse UTM remains dormant.** Source landed `7e1d356` / `e2309e9` / `7c769fe`
  (2026-05-23) but is **un-deployed**; live state is dormant.
- **pm-26 deploy gate remains BLOCKED.** No fixture exists; no Blogger post was reposted;
  no GitHub cross-link went live with reverse UTM; no live traffic was generated.
- The negative invariant and L1 source smoke are already verified (pm-25); the **positive**
  invariant (a `full`-mode Blogger post with a GitHub cross-link emitting the 4 reverse-UTM
  keys end-to-end) is **still unverified end-to-end** because no production-grade fixture
  exists (the fixture-plan §10.2 deadlock). The doc only specifies the safe shape of an
  eventual fixture; it builds nothing.

---

## E. ADMIN closed state reminder

- **ADMIN line is closed and stays closed.** ADMIN remains **idle freeze**.
- The K7 (copy buttons) / K8 (field auto-switch) / K9 (multi-click determinism) / R4
  (read-only state) post-K chain is **closed and browser-PASS recorded**; this phase does
  **not** reopen it.
- **Write path remains dormant** — Apply / Save / auto-fix / middleware write /
  `admin-write-cli` / `--apply` / `dryRun:false` are all dormant and are **not** touched.
- This phase did not load, run, or modify any ADMIN code, dashboard, or write surface.

---

## F. Closed / landed items (this K-line)

| Item | State |
| --- | --- |
| K.3 AdSense dashboard observation preanalysis | ✅ docs-only landed |
| K.4 GA4 P2/P3 dimension expansion preanalysis | ✅ docs-only landed |
| K.5 reverse UTM positive fixture preanalysis | ✅ docs-only landed |
| K7 / K8 / K9 / R4 ADMIN post-K chain | ✅ closed (browser-PASS recorded); idle freeze |
| This checkpoint (K.3/K.4/K.5 closure) | ✅ docs-only (this file) |

Net: the K.3 / K.4 / K.5 planning line is **closed at the planning stage**. Everything
beyond planning is gated on Dean-provided manual evidence + explicit approval (§G–§I).

---

## G. Dean manual evidence needed later (before any future follow-up)

No follow-up can start until Dean manually supplies, **outside this repo**, the relevant
masked / dated / source-labeled evidence:

- **For K.3 (AdSense):** masked screenshots / notes of the AdSense dashboard (policy
  center, sites status, recent estimated earnings) — with exact **date range** + **source
  screen**, and all sensitive IDs masked.
- **For K.4 (GA4):** if Dean chooses to register the D4 first-batch dimensions manually,
  masked screenshots of each saved custom-definition screen (display name + parameter key
  + Scope = Event), plus (later) Realtime / Explore confirmation that the parameter value
  is non-`(not set)`.
- **For K.5 (reverse UTM):** first, a **natural** Blogger `full`-mode article that
  genuinely references a GitHub Pages article (no test post, no forced insertion); then,
  only if approved, build-side grep evidence + GA4 Realtime/DebugView evidence.

All such evidence is treated strictly as **user-provided manual evidence**; Claude
confirms no dashboard metric itself.

---

## H. Safe next-task candidates

All require Dean explicit approval and start **no** build / deploy / repost / GA4 /
AdSense action. Conservative default first:

1. **Idle freeze** (recommended default) — keep all three lines at docs-only; nothing
   auto-advances.
2. **Dean manual GA4 D4 registration** (Dean, outside repo) → then a **docs-only evidence
   record** transcribing the user-provided masked screenshots.
3. **Dean manual AdSense dashboard observation** (Dean, outside repo) → then a **docs-only
   evidence record** transcribing the user-provided masked screenshots / notes.
4. **Wait for a natural Blogger article that genuinely references GitHub Pages** before any
   reverse-UTM live fixture — let the positive fixture arise from real content rather than
   forcing one.

---

## I. Risky or blocked next-task candidates

These are **not** safe defaults; each needs its own separate phase + explicit Dean
approval (and several stay permanently forbidden per CLAUDE.md §29 / red lines):

- 🔴 `npm run build*` / `preview` / any deploy / `gh-pages` push.
- 🔴 Blogger repost (per-post HTML or Theme CSS); Blogger AdSense Batch 2 P2 / P3 live
  repost stays BLOCKED.
- 🔴 GA4 backend changes by Claude (registering / editing dimensions, measurement ID,
  channel grouping, audiences).
- 🔴 AdSense backend changes by Claude.
- 🔴 Reverse UTM live activation (pm-26 deploy gate stays BLOCKED).
- 🔴 ADMIN write path (Apply / middleware / `admin-write-cli` / `--apply` / `dryRun:false`).
- 🔴 Source implementation (`src/`, `views/`, `scripts/`, `content/`, `settings/`).
- 🔴 `CLAUDE.md` / `MEMORY.md` changes — unless separately approved.

---

## J. Recommended next smallest step

**Idle freeze.** The K.3 / K.4 / K.5 planning line is complete and self-consistent; there
is no further docs-only work that meaningfully advances it without new inputs. The next
genuine progress is **Dean-side and manual** (register GA4 D4 dimensions, observe the
AdSense dashboard, or write a natural dual-site article) — each followed only then by a
docs-only evidence record. Until Dean provides that manual evidence + explicit approval,
the smallest correct step is to hold.

---

## K. Do-not-claim list

Claude must **not** state any of the following (now or after receiving evidence) unless
Dean supplies dated, sourced, masked evidence that directly shows it — and even then only
as "user-provided manual evidence reports X":

- ❌ Do **not** say the AdSense dashboard status was observed.
- ❌ Do **not** say GA4 dimensions were registered.
- ❌ Do **not** say GA4 reports are populated.
- ❌ Do **not** say reverse UTM is live.
- ❌ Do **not** say attribution is verified.
- ❌ Do **not** say Blogger pages were retested.
- ❌ Do **not** say any backend dashboard metric was confirmed.

All future backend / live evidence = **user-provided manual evidence only**.

---

## L. Final checkpoint verdict

- ✅ Baseline matched on entry (`3fc9d05`); no repair attempted.
- ✅ K.3 / K.4 / K.5 confirmed **docs-only, preanalysis only**; no backend accessed.
- ✅ This checkpoint adds exactly **one** docs file and nothing else.
- ✅ ADMIN stays closed / idle freeze; write path dormant; reverse UTM dormant; pm-26
  gate BLOCKED.
- ✅ No build / deploy / repost / dev server / live verification was run.
- ⏸ The K.3 / K.4 / K.5 planning line is **closed at the planning stage**; awaiting Dean
  manual evidence + explicit approval before any further step.

---

## M. Cross-links

- `docs/20260622-k3-adsense-dashboard-observation-preanalysis.md` (K.3)
- `docs/20260622-k4-ga4-p2-p3-dimension-expansion-preanalysis.md` (K.4)
- `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md` (K.5)
- `docs/20260622-admin-post-k7-k8-k9-r4-readonly-state-browser-evidence-record.md`
  (ADMIN post-K chain closure)
- `CLAUDE.md` §3a Core operating rules / §3a Red lines / §16.4 (reverse UTM) / §29

---

（本文件結束 / end of document）
