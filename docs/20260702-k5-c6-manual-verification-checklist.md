# K.5 C6 manual verification checklist

- Phase name: `20260702-pm-k5-c6-manual-verification-checklist-docs-only-a`
- Date: 2026-07-02 (Asia/Taipei)
- Author of record: Dean (operator) / Claude Code (docs drafting only)
- Scope: **docs-only / future manual checklist**

---

## 1. Purpose

This file is a **future-use manual checklist** for the day (if ever)
that Dean explicitly opens the pm-26 / reverse-UTM deploy gate and
wants to promote

> `content/blogger/posts/20260529-phonics-practice-sheet-download.md`

(hereafter **C6**) from the current `candidate-only` state toward an
approved reverse-UTM positive fixture.

It sits under two prior 2026-07-02 K.5 docs:

- `docs/20260702-reverse-utm-positive-fixture-preanalysis.md`
  (inventory + candidate shortlist)
- `docs/20260702-k5-c6-reverse-utm-fixture-role-decision-memo.md`
  (C6 role decision = candidate-only)

The checklist **cannot open any gate**, **cannot approve any deploy**,
**cannot repost any Blogger post**, and **cannot verify any GA4 event**.
It only exists so that a future approved slice has a pre-agreed set of
manual steps to walk through, one checkbox at a time.

---

## 2. Current decision carried forward

Load-bearing state at time of writing (do **not** re-derive without a
fresh session-start baseline verify):

- **C6 is `candidate-only`.**
- **C6 is not an approved positive fixture.**
- **pm-26 remains BLOCKED.**
- **reverse UTM remains dormant** (source landed `7e1d356` / `e2309e9`
  / `7c769fe`, 2026-05-23; un-deployed).
- **No content edit, build, deploy, repost, Blogger update, or GA4
  verification is authorized by this checklist.**
- All future GA4 / Blogger / AdSense evidence remains **user-provided,
  dated, masked, source-labeled** per 6/22 K.5 §G / §J. Claude does not
  read any Google surface.

---

## 3. Preconditions before using this checklist

None of the following is satisfied by this file. Each must be met
before any subsequent phase begins to use this checklist:

- [ ] Dean has explicitly approved opening a future pm-26 / reverse-UTM
      deploy gate for C6, in writing, in a new session prompt.
- [ ] Source repo is on `main`, clean, `HEAD == origin/main`,
      `ahead/behind == 0/0`, no `.git/index.lock`.
- [ ] Deploy clone (`../portable-blog-deploy`) is on `gh-pages`, clean,
      `HEAD == origin/gh-pages`, `ahead/behind == 0/0`,
      no `.git/index.lock`.
- [ ] `npm run check:github-pages-prepublish` returns **16/16 PASS**.
- [ ] `npm run check:github-pages-prepublish-smoke` returns **8/8 PASS**.
- [ ] The **content decision** for C6 (`status: draft` → `ready`,
      `download.fileUrl` policy, topic-naturalness) is landed in a
      **separate approved content slice**, not folded into a
      verification pass.
- [ ] No Blogger / GA4 / AdSense / Search Console / Google Drive /
      Google Form backend action is performed without its own explicit
      Dean approval and its own docs artifact.
- [ ] The `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`
      §D activation conditions D.1 / D.2 / D.3 are individually
      re-verified against then-current repo state.

---

## 4. Repo-side verification checklist

Static / offline checks. Performed only inside the approved future
slice, not by this file:

- [ ] Confirm C6 file path exists at
      `content/blogger/posts/20260529-phonics-practice-sheet-download.md`.
- [ ] Confirm C6 frontmatter `publishTargets.blogger.enabled: true` and
      `publishTargets.blogger.mode: "full"` (summary / redirect-card
      would not trigger `renderFullPost` → reverse UTM never injected).
- [ ] Confirm C6 frontmatter `status`, `draft` fields match the content
      slice's declared intent (not silently mutated).
- [ ] Confirm C6 `relatedLinks[0].url` still resolves to a hostname
      equal to `settings.site.githubSiteUrl` (currently
      `babel-lab.github.io`).
- [ ] Confirm the `relatedLinks` entry's `url` has **no** pre-existing
      `utm_*` parameters (unless deliberately testing Strategy A skip
      per 6/22 K.5 §C.1 / §E.2); otherwise the four reverse-UTM keys
      will not be injected by design.
- [ ] Confirm the reverse-UTM source (`src/scripts/ga4-url-builder.js`
      + `src/scripts/build-blogger.js` + `src/views/blogger/blogger-
      post-full.ejs`) has **not** drifted from the pm-24 landed
      version (`7e1d356` / `e2309e9` / `7c769fe`).
- [ ] Confirm the C6 content-hygiene story for a `download`-type post
      (e.g. `download.fileUrl`, licence note, download CTA copy) has
      been resolved by a separate content slice — this checklist does
      not re-decide it.
- [ ] Confirm no content rewrite is required, or explicitly point to
      the separate content slice that authorized any rewrite.
- [ ] Confirm the fixture surface reads as topically **natural**
      (Dean's judgment call per fixture-plan §3.2 / §4.4).
- [ ] Confirm `npm run validate:content` runs clean under the approved
      content slice (0 new warnings introduced by C6 promotion).
- [ ] Confirm `npm run build:blogger` succeeds and
      `dist-blogger/posts/phonics-practice-sheet-download/post.html`
      contains, on the GitHub cross-link anchor:
      - [ ] `utm_source=blogger`
      - [ ] `utm_medium=referral`
      - [ ] `utm_campaign=portable_blog_system`
      - [ ] `utm_content=related_links`
      - [ ] `target="_blank"`
      - [ ] `rel` merged with `nofollow noopener noreferrer`
              (author `sponsored` etc. preserved; order-free)
- [ ] Confirm non-GitHub cross-links / same-site / third-party external
      links inside that `post.html` do **not** carry
      `utm_source=blogger`.
- [ ] Confirm legacy summary-CTA counts (`utm_medium=internal_referral`
      / `utm_campaign=blogger_to_github`) in `dist-blogger` are
      unchanged vs pre-fixture (byte-identical-modulo-builtAt on
      unrelated posts).
- [ ] Confirm `npm run build:github` shows forward UTM
      (`utm_source=github_pages`) still applies unaffected.

Note: Static (H.1) acceptance per 6/22 K.5 §H.1 is a legitimate stop
point. Everything below §5 / §6 is a **separate** approval.

---

## 5. Live / Blogger-side verification checklist

**Not performed in this slice.** These are only walked through inside
a **separately approved Blogger repost phase**, in a session where
Dean is signed into Blogger himself and Claude does not touch the
Blogger backend. Governing SOP: `docs/20260524-blogger-repost-
checklist.md` (§2.2 backup / §6 rollback discipline).

- [ ] Confirm a backup of the current live Blogger HTML for C6 is
      taken and saved locally **before** any repost step.
- [ ] Confirm the Blogger post for slug
      `phonics-practice-sheet-download` exists (Blogger post yyyy/mm
      URL discipline per publish-json-schema §5.3 — do **not** guess a
      URL if it has not been published yet).
- [ ] Confirm the live post URL is captured verbatim (not guessed),
      and back-filled to `blogger.publishedUrl` **only in a separate
      approved slice**, not by this checklist.
- [ ] Confirm the GitHub Pages cross-link on the live page is
      visible and clickable, target = new tab, `rel` includes
      `nofollow noopener noreferrer`.
- [ ] Confirm the live page has **not** introduced a broken or
      misleading download CTA (`download.fileUrl` policy per §4).
- [ ] Confirm no unintended live change to other Blogger posts
      (Batch 1 / Batch 2 P2 / P3 targets untouched; AdSense anchors
      unchanged).
- [ ] Confirm rollback path (backup HTML restore) is ready before any
      live change is made.

Claude does not perform any of the above; each is Dean's manual step
with masked evidence per 6/22 K.5 §G.

---

## 6. GA4 / reverse-UTM observation checklist

**Not performed in this slice.** These are only walked through inside
a **separately approved GA4 observation phase**, following the SOP in
`docs/20260524-ga4-reverse-utm-observation.md`. Claude does not
observe any GA4 surface.

- [ ] Confirm the GA4 observation is limited to Realtime / DebugView
      and Reports **acquisition** dimensions (source / medium /
      campaign / manual ad content). **Do not** register raw URLs as
      custom dimensions (K.4 §F).
- [ ] Confirm the click test is done in a clean session (incognito or
      GA Debug mode), from the reposted Blogger live page, into the
      GitHub Pages target article.
- [ ] Confirm the `page_view` event on the GitHub Pages landing arrives
      within the expected latency window (~30s Realtime).
- [ ] Confirm `page_location` on that event contains all four
      reverse-UTM keys exactly as designed
      (`utm_source=blogger&utm_medium=referral&utm_campaign=
      portable_blog_system&utm_content=related_links`).
- [ ] Confirm GA4 acquisition columns for that session show
      `source=blogger` / `medium=referral` /
      `campaign=portable_blog_system` /
      `content=related_links`, distinct from forward
      (`source=github_pages`) and legacy summary-CTA
      (`medium=internal_referral` / `campaign=blogger_to_github`).
- [ ] Record evidence with **date range**, **screen source**
      (Realtime / DebugView / Reports), **masked property ID /
      measurement ID / account ID / `pub-...` / email / any personal
      identifier**. Any non-visible field marked `not visible`; no
      guesses.
- [ ] Do not paste the affiliate-redirect `uid1` token into any doc,
      commit, or chat (6/22 K.5 §G / red-line).
- [ ] Confirm no production behavior was altered by observation itself
      (Realtime / DebugView views are read-only on Google's side, but
      still record which sessions were used).
- [ ] Hand masked, dated, source-labeled evidence to Claude only if
      Dean wants a follow-up **verification report** phase, which is
      itself separately approved.

---

## 7. Stop conditions

Stop and **do not proceed** with any subsequent step (repo-side or
otherwise) if any of the following is true:

- Source or deploy repo is dirty, off-branch, ahead-of-remote,
  behind-remote, or has `.git/index.lock` present.
- Either K1 prepublish guard returns non-PASS.
- Reverse-UTM source has drifted from pm-24 landed state without an
  explicitly approved change slice.
- C6's frontmatter has mutated versus the state recorded in the 2026-
  07-02 role-decision memo, without a separately approved content
  slice recording the mutation.
- C6 requires content rewrite but no content slice is approved.
- Download metadata (`download.fileUrl`, licence note, CTA copy) is
  ambiguous and no separate content slice has resolved it.
- Live Blogger post status cannot be verified via a Dean-provided
  screenshot / URL — do **not** guess the URL or `bloggerPostId`.
- GA4 / Blogger / AdSense / Search Console backend access is
  unavailable, and any step would require such access without its own
  explicit approval slice.
- Any step would require `npm run build*`, `preview`, `dev`, deploy,
  gh-pages push, or Google-side login without an explicit approval
  slice covering that specific action.
- The repo evidence is insufficient but the step demands a live-state
  claim — in that case, report insufficiency and stop; **do not**
  fabricate.

---

## 8. Non-goals

This checklist does **not**:

- ❌ approve pm-26 or otherwise unblock the deploy gate;
- ❌ deploy reverse UTM or change its dormant status;
- ❌ update Blogger; repost any post; touch Blogger backend;
- ❌ verify GA4 events, dimensions, sources, mediums, campaigns, or
  acquisition figures;
- ❌ modify any file under `content/` (`.md` / `.publish.json` / `.fb.md`);
- ❌ modify any file under `src/`, `views/`, `scripts/`,
  `content/settings/`;
- ❌ modify `CLAUDE.md`, `MEMORY.md`, `memory/`, `package.json`,
  lockfile, `dist*/`, `portable-blog-deploy/`, `gh-pages` content;
- ❌ run `npm run build*`, `preview`, `dev`, `report:*`, `smoke:*`, or
  any `check:*` beyond the two K1 prepublish guards required by
  session-start baseline verify;
- ❌ promote C6 from `draft` to `ready`, fill `download.fileUrl`, or
  create sidecar files;
- ❌ record any live claim about C6, Blogger, GA4, or reverse UTM.

---

## 9. Recommended next step (proposal only)

- **Default (recommended): idle freeze.** Keep C6 `candidate-only`;
  reverse UTM stays dormant; pm-26 stays BLOCKED. This checklist sits
  unused until Dean opens the gate.
- If Dean later wants to continue K.5, choose between:
  - **Manual verification planning refinement** (docs-only) — extend
    this checklist with more specific evidence-capture wording if any
    of §5 / §6 items feel underspecified in situ, still without opening
    the gate;
  - **Wait for a mainline natural article** (per fixture-plan §10.4) —
    defer C6 in favour of a `tech-note` / `book-review` / `life-note`
    that naturally cross-links to a GitHub Pages article;
  - **Open a separately approved deploy-gate slice** — a fresh session,
    a fresh baseline verify, and the entire §3 preconditions block met
    on entry.

Whichever path is chosen, each subsequent step is its own phase with
its own explicit approval and its own docs artifact. No auto-promotion.

---

## 10. Cross-links

- `CLAUDE.md` §16.4 (reverse UTM spec)
- `docs/reverse-utm-fixture-plan.md` §0–§10
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md`
- `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md`
- `docs/20260702-reverse-utm-positive-fixture-preanalysis.md`
- `docs/20260702-k5-c6-reverse-utm-fixture-role-decision-memo.md`
- `docs/20260524-blogger-repost-checklist.md`
- `docs/20260524-ga4-reverse-utm-observation.md`
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`
- `docs/20260702-session-start-dual-repo-baseline-snapshot.md`

---

（本文件結束 / end of document）
