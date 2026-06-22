# K.5 — Reverse UTM Positive Fixture Preanalysis (docs-only)

- Phase name: `20260622-pm-k5-reverse-utm-positive-fixture-preanalysis-docs-only-a`
- Date: 2026-06-22 (Asia/Taipei)
- Author of record: Dean (operator) / Claude Code (docs drafting only)
- Type: **PREANALYSIS ONLY — not a live verification**

---

## 0. Critical disclaimers (read first)

This document is a **planning / preanalysis** artifact for a *future* reverse-UTM
positive fixture. It records **no** live state and authorizes **no** action.

Explicitly, for this phase:

1. **This is PREANALYSIS ONLY, not a live verification.** Nothing here means a fixture
   exists, was deployed, was reposted, or produced any GA4 event.
2. **Claude did not deploy, build, repost, or access GA4.** Claude is not logged in to
   any Google / GA4 / AdSense / Search Console / Blogger / Drive account and fetched no
   dashboard, page, or API.
3. **No reverse UTM fixture was activated on live pages.** No Blogger post was reposted;
   no GitHub cross-link went live with reverse UTM; no live traffic was generated.
4. **No tracking source code or generated HTML was changed.** `src/`, `views/`,
   `scripts/`, `content/`, `settings/`, `package.json`, lockfile, `dist*/`, `gh-pages`,
   `.cache/`, `CLAUDE.md`, `MEMORY.md` are all untouched. The only mutation in this
   phase is the addition of this single docs file.

### 0.1 Purpose

This preanalysis exists to let Dean later, *if and only if explicitly approved*:

- define **what a future positive fixture should prove** (the positive invariant that is
  still unverified end-to-end);
- define **a safe, minimal fixture design** (one controlled test link concept only);
- define **what evidence Dean should capture later** (build-side grep + GA4 Realtime);
- define **acceptance and rollback criteria** before any live step is taken.

It deliberately stops at planning. The authoritative reverse-UTM spec remains
**`CLAUDE.md` §16.4**; the fixture SOP remains **`docs/reverse-utm-fixture-plan.md`**
(§0–§10) and **`docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`**. This
file does **not** redefine the spec, coin new UTM keys, or introduce drift — it is a
consolidated English-language decision view that sits beside K.3 (AdSense) and K.4 (GA4
dimensions).

---

## A. Baseline and scope

### A.1 Baseline observed (this session)

| Check | Expected | Observed |
| --- | --- | --- |
| `pwd` | `…/portable-blog-system` | `/d/github/blog-new/portable-blog-system` ✅ |
| branch | `main` | `main` ✅ |
| `HEAD` | `c0adb4f` | `c0adb4feddda25c318aa9308c79c78296eaafbb3` ✅ |
| `origin/main` | `c0adb4f` | `c0adb4feddda25c318aa9308c79c78296eaafbb3` ✅ |
| `HEAD == origin/main` | yes | yes ✅ |
| ahead / behind | `0 / 0` | `0 / 0` ✅ |
| latest subject | `docs(ga4): add p2 p3 dimension expansion preanalysis` | match ✅ |
| working tree | clean | clean ✅ |

Baseline matched on entry; no repair was needed or attempted.

### A.2 In scope

- Add exactly **one** docs-only preanalysis file (this file).

### A.3 Out of scope (not touched)

- `src/`, `views/`, `scripts/`, `content/`, `settings/`, `package.json`, lockfile,
  `dist*/`, `gh-pages`, `.cache/`, `CLAUDE.md`, `MEMORY.md`.
- **No** build / deploy / preview / repost. **No** dev server started.
- **No** GA4 / AdSense / Search Console / Blogger / Drive backend login or action.
- **No** admin write / middleware / `admin-write-cli` / `--apply` / `dryRun:false`.
- **No** new fixture post created; Reverse UTM stays **dormant**; pm-26 deploy gate stays
  **BLOCKED**; ADMIN line stays closed (K7 / K8 / K9 / R4 post-K chain remains closed —
  this phase does not reopen ADMIN).

---

## B. Relationship to K.3 and K.4

K.5 is the third of three sibling docs-only preanalyses landed on 2026-06-22, each a
consolidated English-language decision view Dean can scan before deciding whether to act:

| Sibling | Topic | What it plans (no action taken) |
| --- | --- | --- |
| K.3 | AdSense dashboard observation | what Dean should *manually observe* in AdSense; masking + evidence-capture habit |
| K.4 | GA4 P2 / P3 dimension expansion | which GA4 custom dimensions are safe to register *later*; cardinality / privacy classification |
| **K.5 (this file)** | Reverse UTM positive fixture | what a future Blogger→GitHub positive fixture should *prove*; safe minimal design; acceptance / rollback |

Dependencies and boundaries:

- K.5 **depends on K.4's discipline** for the GA4 side: any reverse-UTM acquisition signal
  is read through GA4 acquisition dimensions (source / medium / campaign / content), **not**
  through registering raw URLs as custom dimensions (per K.4 §F / §G). K.5 introduces **no**
  new GA4 dimension and registers nothing.
- K.5 is **independent of K.3**: AdSense observation and reverse-UTM attribution are
  unrelated surfaces. The only shared rule is "evidence = user-provided, masked, dated,
  source-labeled; Claude observes nothing itself."
- K.5 does **not** supersede the reverse-UTM canonical set; it is a continuation snapshot
  that consolidates `docs/reverse-utm-fixture-plan.md`, the pm-26 preflight checklist, and
  the 5/26 scan report into one acceptance-oriented English view.

---

## C. What "reverse UTM positive fixture" means

### C.1 The reverse-UTM mechanism (per `CLAUDE.md` §16.4 / `ga4-link-tracking-spec` §3.5)

Reverse UTM = the **Blogger → GitHub Pages** direction of cross-site UTM injection. When a
Blogger `full`-mode post's `relatedLinks` / `otherLinks` contains a link whose hostname
equals `settings.site.githubSiteUrl` (`babel-lab.github.io`), the build injects:

| Field | Value |
| --- | --- |
| `utm_source` | `blogger` |
| `utm_medium` | `referral` |
| `utm_campaign` | `portable_blog_system` |
| `utm_content` | `related_links` (from `relatedLinks`) / `other_links` (from `otherLinks`) |
| target | forced `_blank` |
| rel | merged `nofollow noopener noreferrer` (author tokens like `sponsored` preserved) |
| Strategy A | if the URL already carries any `utm_*`, it is left as-is (target/rel still applied) |

Source landed `7e1d356` / `e2309e9` / `7c769fe` (2026-05-23); **un-deployed; live state
dormant; pm-26 deploy gate BLOCKED**.

### C.2 Positive vs negative invariant

| Invariant | Meaning | Current status |
| --- | --- | --- |
| **Negative** | A `full`-mode post with **no** GitHub cross-link does **not** mis-inject reverse UTM; non-GitHub external / same-site links untouched; legacy summary CTA scheme (`internal_referral` / `blogger_to_github`) not confused; forward UTM unaffected | ✅ verified (pm-25 verify §G) |
| **L1 source** | `isGithubCrossLink` / `applyCrossSiteUtm({direction:'to_github'})` / `mergeRel` behave per spec | ✅ verified (L1 in-memory smoke) |
| **Positive** | A `full`-mode post **with** a GitHub cross-link correctly injects the 4 UTM keys + target/rel through build → dist → Blogger repost → GA4 receipt | ⚠️ **unverified end-to-end** — no production-grade fixture exists |

A "positive fixture" is therefore the **missing artifact** that would let the positive
invariant be exercised: at least one Blogger `full`-mode post whose `relatedLinks` /
`otherLinks` naturally references a GitHub Pages article.

### C.3 Why none exists today (deadlock, per fixture-plan §10.2)

The only ready `full`-mode Blogger post (`we-media-myself2`) has a single Blogger-internal
cross-link and `otherLinks: []`; a `content/blogger/` grep for `babel-lab.github.io`
returns **0**. Every existing candidate (forcing a cross-link onto a published book review,
or flipping a `summary` post to `full`) breaks at least one existing invariant — published-
content overwrite, SEO continuity, or a Phase-locked SEO fixture (`portable-blog-system-mvp`
seo-2/seo-3). Hence "can't edit existing + no new natural article" → deadlock. This
preanalysis does **not** break that deadlock; it only specifies the safe shape of an
eventual fixture.

---

## D. Positive fixture goals

These are goals for **future, approval-gated** work — not actions in this phase.

- D-G1. **Exercise the positive invariant once, cleanly.** Prove that a real Blogger
  `full`-mode post with a GitHub cross-link emits the 4 reverse-UTM keys + target/rel at the
  `dist-blogger` build layer, then (only if approved) end-to-end into GA4.
- D-G2. **Stay production-grade.** The fixture must be an article Dean would genuinely
  write; no "test post" titles, no lorem ipsum, no throwaway content (per fixture-plan §3.1
  / §4.4).
- D-G3. **Keep the cross-link reference natural.** The GitHub link must be a topically
  honest "further reading" reference, not a forced insertion (per fixture-plan §3.2).
- D-G4. **Change nothing already live.** No existing ready/published post's `mode`,
  `relatedLinks`, `primaryPlatform`, or SEO-fixture role may be altered (per fixture-plan §2
  / §3.4).
- D-G5. **Read attribution through acquisition dimensions only.** Verify GA4 receipt via
  source/medium/campaign/content — never by registering raw URLs as custom dimensions and
  never by introducing high-cardinality dimensions (per K.4 §F / §G).

---

## E. Minimal safe fixture proposal

> Design proposal only. **Not** landed; **not** authorized. Building it requires a separate
> phase + explicit Dean approval (the fixture-plan §10.5 Phase 1–6 split).

### E.1 Preferred: one natural article carrying one controlled test link concept

- **One** new Blogger `full`-mode post under `content/blogger/posts/{date}-{slug}.md` (the
  production pipeline), per fixture-plan §3.5 priority 1.
- The post carries **exactly one** GitHub cross-link in `relatedLinks` — a single,
  controlled, human-readable "further reading" reference to an existing GitHub Pages
  article (`github-pages-blog-planning` or `portable-blog-system-mvp`). One link is enough
  to exercise the positive invariant; more adds noise without proving more.
- Topic candidates that make the reference natural (per fixture-plan §4.2 / §10.4 — **not**
  to be written now, author's choice of timing):
  - 「我如何用 Portable Blog System 管理 Blogger + GitHub 雙站內容」
  - 「Blogger + GitHub Pages 雙站策略：流量、SEO、收益的權衡」
  - 「為什麼我的 Blogger 文章開始加上 GitHub Pages 延伸閱讀連結」

### E.2 Structure requirements (per fixture-plan §3.3)

- `publishTargets.blogger.enabled: true` + `publishTargets.blogger.mode: 'full'`.
- `status: ready`, `draft: false` (may stay `draft` until Dean agrees to ready).
- ≥ 1 `relatedLinks` (or `otherLinks`) entry whose hostname is `babel-lab.github.io`.
- `kind: internal` or `external` both acceptable (hostname decides, not `kind`).
- Do **not** pre-embed `utm_*` in the link URL (unless deliberately testing Strategy A skip).
- Passes `npm run validate:content` with 0 warnings before any build.

### E.3 Fixture design rules (binding for the future build phase)

- Treat reverse UTM as **dormant until explicit approval** — landing this doc changes nothing.
- Prefer **one minimal controlled test link concept only**; do not seed many cross-links.
- Do **not** add raw personal data (no email / name / phone / school / Drive IDs / tokens).
- Do **not** add user identifiers (no membership, no per-user keys — system has none).
- Do **not** register raw full URLs as GA4 custom dimensions.
- Do **not** introduce high-cardinality dimensions.
- Each later step (content create → build verify → commit → Blogger repost → GA4 observe →
  verification report) must be **separately approved and separately recorded** as its own
  phase.

### E.4 Explicitly rejected fixture shapes (per fixture-plan §2 / §4.4)

- ❌ Forcing a GitHub cross-link onto `we-media-myself2` (overwrites a published post;
  book-review→tech-note reference unnatural; breaks the "book reviews only link to same-
  theme Blogger predecessors" strategy invariant).
- ❌ Flipping `github-pages-blog-planning` or `portable-blog-system-mvp` from `summary` to
  `full` (breaks publish strategy / canonical / SEO-fixture lock).
- ❌ A test-titled post, lorem-ipsum body, or any fixture under
  `content/validation-fixtures/` (that dir is for validator error samples).

---

## F. Parameters and naming rules

> The UTM keys are **fixed by `CLAUDE.md` §16.4**; this file restates them and must not
> coin new ones.

| Parameter | Fixed value | Note |
| --- | --- | --- |
| `utm_source` | `blogger` | distinguishes reverse from forward (`github_pages`) |
| `utm_medium` | `referral` | **not** legacy summary CTA's `internal_referral` |
| `utm_campaign` | `portable_blog_system` | **not** legacy summary CTA's `blogger_to_github` |
| `utm_content` | `related_links` \| `other_links` | by slot; **not** legacy summary CTA's `{slug}` |

Naming discipline:

- Keep parameter values **stable and human-readable**; the four keys above are the entire
  surface — do not invent per-fixture suffixes or encode the post slug into the UTM.
- The reverse scheme must stay **distinguishable from** (a) forward UTM (`utm_source=
  github_pages`) and (b) legacy summary CTA UTM (`utm_source=blogger` + `utm_medium=
  internal_referral` + `utm_campaign=blogger_to_github`). Any fixture that blurs these is a
  failed fixture.
- GA4 reads these via built-in **acquisition** dimensions (Session/First-user source,
  medium, campaign, manual ad content). **No** custom dimension is registered for reverse
  UTM; raw `page_location` URLs stay queryable only via Explore `event_params`, never
  registered (consistent with K.4 §F).

---

## G. GA4 evidence Dean should capture later

> Only if (and after) Dean explicitly approves the build → repost → observe phases. Claude
> performs none of these and observes nothing itself. All evidence is **user-provided
> manual evidence**.

| Item | Form | Confirms |
| --- | --- | --- |
| `dist-blogger/posts/{slug}/post.html` grep | text snippet | the 4 reverse-UTM keys + `target="_blank"` + merged `rel` on the GitHub cross-link |
| legacy scheme unchanged | grep count | `utm_medium=internal_referral` count in `dist-blogger` unchanged vs pre-fixture |
| forward UTM unchanged | byte-compare | `dist/posts/*/index.html` Blogger cross-links still `utm_source=github_pages` (byte-identical-modulo-builtAt) |
| GA4 Realtime / DebugView `page_view` | masked screenshot or text | landing on GitHub Pages within ~30s of a click |
| `page_location` of that event | masked text | contains all 4 reverse-UTM keys |
| GA4 acquisition shows `source=blogger / medium=referral / campaign=portable_blog_system / content=related_links\|other_links` | masked screenshot | reverse signal arrives and is distinct from forward + legacy |
| exact date range + source screen | text | mandatory for any GA4 figure |

Capture rules:

- [ ] Note the **exact date range** and **which screen** (Realtime / DebugView / Reports)
      each figure came from.
- [ ] **Mask** property ID / account ID / measurement ID / `pub-…` / email / any personal
      identifier before saving or sharing.
- [ ] Mark non-visible fields `not visible`; do not guess.
- [ ] Remember the affiliate-redirect `uid1` token must **never** be registered or pasted
      into docs/commits/chat.
- [ ] Hand masked, dated, source-labeled evidence to Claude **as user-provided manual
      evidence** only if a follow-up record phase is wanted.

---

## H. Acceptance criteria

A future positive fixture is **accepted** only when all of the following hold (mirrors
fixture-plan §5 / pm-26 checklist §D):

### H.1 Build-side (necessary, local; can pass without any live action)

- [ ] Fixture post passes `npm run validate:content` with 0 warnings.
- [ ] `npm run build:blogger` succeeds; `dist-blogger/posts/{slug}/post.html` grep hits all
      four reverse-UTM keys on the GitHub cross-link.
- [ ] That anchor has `target="_blank"` + `rel` containing `nofollow noopener noreferrer`
      (order-free; author tokens preserved).
- [ ] Non-GitHub cross-links / same-site / third-party external links in that post.html do
      **not** carry `utm_source=blogger`.
- [ ] Legacy summary-CTA `internal_referral` / `blogger_to_github` counts in `dist-blogger`
      are unchanged vs pre-fixture.
- [ ] `npm run build:github` shows forward UTM unaffected (byte-identical-modulo-builtAt).

### H.2 Live-side (only if Dean approves the repost + GA4 phases)

- [ ] After Blogger repost + a click in a clean (incognito / GA Debug) session, GA4
      Realtime/DebugView shows the `page_view` with all four reverse-UTM keys, distinct from
      forward (`github_pages`) and legacy (`internal_referral` / `blogger_to_github`).

> Static (H.1-only) acceptance is a legitimate stopping point: it proves source→build is
> correct without touching live pages. The GA4 receipt (H.2) is a separate, separately
> approved step.

---

## I. Rollback criteria

- I-1. **Pre-repost rollback is trivial.** Until the Blogger repost, the fixture lives only
  in `content/` + `dist-blogger/`; reverting the content commit (and not deploying) fully
  removes it. No live surface is touched.
- I-2. **Prefer not to publish over publishing-then-deleting.** If, before repost, the topic
  proves unsuitable for public content, stop at static (H.1) acceptance and do **not**
  repost — do not publish-then-delete production content (fixture-plan §7.2).
- I-3. **If already reposted and a problem appears**, follow `docs/20260524-blogger-repost-
  checklist.md` §6 rollback: restore the backed-up previous Blogger HTML for that post.
  Reposting requires that a backup of the old HTML was taken first (checklist §2.2).
- I-4. **Any rollback that touches a live surface is its own approved step** and gets its
  own docs record; Claude does not perform it.

---

## J. Do-not-claim list

Claude must **not** state (now or after receiving evidence) any of the following unless Dean
supplies dated, sourced, masked evidence that directly shows it — and even then only as
"user-provided manual evidence reports X":

- ❌ Do **not** say reverse UTM is deployed.
- ❌ Do **not** say reverse UTM is live.
- ❌ Do **not** say GA4 received events.
- ❌ Do **not** say reports are populated.
- ❌ Do **not** say attribution is verified.
- ❌ Do **not** say Blogger live pages were retested.
- ❌ Do **not** say any GA4 dashboard value was observed by Claude.
- ❌ Do **not** treat a docs-only preanalysis as proof a fixture exists.
- ❌ Do **not** infer that any repo change caused any live traffic or any GA4 number.

All future live / GA4 evidence = **user-provided manual evidence only**.

---

## K. Recommended next follow-up

All options are **docs-only or content-only to start**, require Dean explicit approval, and
begin no deploy / repost / GA4 action. Priority order (per fixture-plan §8 / §10.4):

| Priority | Follow-up | Nature | Blocker |
| --- | --- | --- | --- |
| 1 | **Main track — wait for a natural article** that genuinely references a GitHub Pages article; let the fixture arise from real content | passive | unpredictable timing; highest production-grade authenticity |
| 2 | **Side track A — author a dual-site essay** (per §E.1) as a deliberate fixture, then run the §10.5 Phase 1 *content-create* phase | content-only, separately approved | Dean chooses to write it |
| 3 | **Static-only acceptance** — if a fixture exists, run build verify (H.1) and stop there, no repost | build-only, separately approved | a fixture post exists |
| 4 | **Full live verification (pm-26)** — repost + GA4 observe + verification report | live, separately approved | all H.1 met **and** Dean approves repost + GA4 |

Conservative default: **idle freeze** — reverse UTM stays dormant; pm-26 stays BLOCKED;
nothing here auto-advances. Each step up the ladder is its own phase + explicit approval.

---

## L. Blocked actions (not performed; not auto-allowed later)

- 🔴 `npm run build*` / `preview` / dev server / any deploy / `gh-pages` push.
- 🔴 Creating or editing any `content/` fixture post (`.md` / `.publish.json` / `.fb.md`).
- 🔴 Editing tracking source (`ga4-url-builder.js` / `build-blogger.js` / templates) or any
  generated HTML.
- 🔴 Blogger repost (per-post HTML or Theme CSS); Blogger AdSense Batch 2 P2/P3 repost stays
  BLOCKED.
- 🔴 Logging in to / operating GA4 / AdSense / Search Console / Blogger / Drive; calling any
  GA4 Admin / Reporting API (permanently forbidden for this repo).
- 🔴 GA4 backend changes (measurement ID / dimensions / channel grouping / audiences).
- 🔴 Reopening ADMIN or any write path (Apply / middleware / `admin-write-cli` / `--apply` /
  `dryRun:false`).
- 🔴 Any claim of live traffic, deployment, or GA4 receipt (see §J).
- 🔴 Writing full `measurementId` / AdSense real client / slot / affiliate `uid1` token into
  `docs/`, `CLAUDE.md`, `MEMORY.md`, `src/`, commits, or chat.

Each of the above, if ever wanted, requires its **own phase + explicit Dean approval**.

---

## M. Phase status

- ✅ docs-only preanalysis file created (this file).
- ✅ Baseline matched (`c0adb4f`); no source / content / settings / build / deploy / repost /
  GA4 action.
- ✅ No reverse UTM fixture activated; reverse UTM remains landed but **dormant**; pm-26
  deploy gate remains **BLOCKED**.
- ⏸ Awaiting Dean approval before any further step.

---

## N. Cross-links

- `CLAUDE.md` §16.4 (reverse UTM spec anchor; source landed, un-deployed, dormant)
- `docs/reverse-utm-fixture-plan.md` (fixture design SOP §0–§9 + §10 readiness addendum)
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` (pm-26 preflight §C–§F)
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md` (5/26 candidate scan; 0/5 usable)
- `docs/blogger-to-github-reverse-utm-plan.md` (original reverse-UTM plan; step 1–7)
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md` (negative invariant + L1 smoke)
- `docs/20260524-blogger-repost-checklist.md` (Blogger repost SOP; backup / rollback §2.2/§6)
- `docs/20260524-ga4-reverse-utm-observation.md` (GA4 reverse-UTM observation SOP)
- `docs/ga4-link-tracking-spec.md` §3.5 / `docs/ga4-parameter-naming-registry.md` §4.2 (naming)
- `docs/20260622-k3-adsense-dashboard-observation-preanalysis.md` (sibling K.3)
- `docs/20260622-k4-ga4-p2-p3-dimension-expansion-preanalysis.md` (sibling K.4)
- CLAUDE.md §3a Core operating rules / §3a Red lines / §29

---

（本文件結束 / end of document）
