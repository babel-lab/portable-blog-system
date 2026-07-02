# Reverse UTM positive fixture preanalysis (2026-07-02)

- Phase name: `20260702-pm-k5-reverse-utm-positive-fixture-followup-preanalysis-docs-only-a`
- Date: 2026-07-02 (Asia/Taipei)
- Author of record: Dean (operator) / Claude Code (docs drafting only)
- Scope: **docs-only / read-only preanalysis**

---

## 1. Purpose

This file is a **preanalysis update** to the K.5 reverse-UTM positive-fixture line.
Prior art is complete and canonical:

- `docs/20260526-reverse-utm-positive-fixture-scan-report.md` — 5/26 candidate scan; 0/5 usable.
- `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md` — 6/22 English-language
  decision view (goals / minimal fixture design / acceptance / rollback / do-not-claim).

This 2026-07-02 preanalysis exists only to record **what has changed in `content/`
since 5/26** with regard to Blogger → GitHub Pages cross-links, so that Dean can
decide — later, and separately — whether the K.5 fixture deadlock (`fixture-plan §10.2`)
has been narrowed. It **does not** redefine the reverse-UTM spec, coin new UTM keys, or
open pm-26 deploy gate.

---

## 2. Current boundary

- **No** build was run this phase.
- **No** deploy / repost / gh-pages push was performed.
- **No** publish action; no Blogger post reposted; no live URL touched.
- **No** dev server started; no `vite` / `preview`; no `validate:content` / `report:*` /
  `check:*` / `smoke:*` re-execution beyond the K1 prepublish guards required by
  session-start baseline verify.
- **No** Blogger / GA4 / AdSense / Search Console / Google Drive / Google Form backend
  operation. Claude is not logged in to any Google surface.
- **No** source / content / settings / runtime behavior changed. `src/`, `views/`,
  `scripts/`, `content/`, `settings/`, `package.json`, lockfile, `dist*/`,
  `portable-blog-deploy/`, `.cache/`, `CLAUDE.md`, `MEMORY.md` are all untouched.
  The only mutation in this phase is the addition of this single docs file.
- **pm-26 deploy gate remains BLOCKED.** Reverse UTM source (`7e1d356` / `e2309e9` /
  `7c769fe`, 2026-05-23) remains landed but **dormant**. Nothing in this doc changes
  that status.

---

## 3. Existing reference

| Doc | Role |
| --- | --- |
| `CLAUDE.md` §16.4 | reverse-UTM spec anchor (source landed, un-deployed, dormant) |
| `docs/reverse-utm-fixture-plan.md` | fixture design SOP §0–§9 + §10 readiness addendum |
| `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` | pm-26 preflight §C–§F |
| `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md` | negative invariant + L1 smoke |
| `docs/20260526-reverse-utm-positive-fixture-scan-report.md` | 5/26 scan — 0/5 usable |
| `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md` | 6/22 K.5 English decision view |
| `docs/blogger-to-github-reverse-utm-plan.md` | original reverse-UTM plan |

Prior findings are load-bearing. This file only **appends** what has changed since.

---

## 4. Inventory findings (2026-07-02)

Read-only grep across `docs/`, `src/`, `content/`, `package.json`. Relevant hits:

### 4.1 `githubSiteUrl` in settings

- `content/settings/site.config.json` → `"githubSiteUrl": "https://babel-lab.github.io/portable-blog-system"` (project-site base, unchanged since 5/26).

### 4.2 Reverse-UTM source (unchanged)

- `src/scripts/ga4-url-builder.js` → `isGithubCrossLink` + `applyCrossSiteUtm({direction:'to_github'})` (landed 2026-05-23).
- `src/scripts/build-blogger.js` → `deriveRenderedCrossLinks` full-mode caller.
- `src/views/blogger/blogger-post-full.ejs` → reads `relatedLinksRendered` / `otherLinksRendered`.
- `src/scripts/smoke-reverse-utm.js` → L1 in-memory smoke (unchanged).

No source line changed in this session.

### 4.3 Blogger posts carrying `relatedLinks` / `otherLinks`

| Blogger post file | `relatedLinks` shape | `otherLinks` shape | Contains `babel-lab.github.io`? | Status |
| --- | --- | --- | --- | --- |
| `content/blogger/posts/20260515-we-media-myself2.md` | 1 entry, Blogger-internal cross-link (`platform: "blogger"`) | `[]` | ❌ no | `ready` / `draft: false` — LIVE (per §BLOG A1) |
| `content/blogger/posts/20260525-draft-book-review.md` | `[]` | `[]` | ❌ no | `draft` / `draft: true` |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | 1 entry, `url: https://babel-lab.github.io/portable-blog-system/posts/portable-blog-system-mvp/` | (not present) | ✅ **yes** | `draft` / `draft: true` |
| `content/blogger/posts/20260612-*` (6 posts; blog-restart-steady-rhythm-notes / ai-tools-simplify-daily-workflow / blog-as-personal-knowledge-base / daily-reading-habit-notes / after-work-writing-time-blocking / reading-notes-three-questions) | no `relatedLinks` / `otherLinks` fields declared (per grep miss) | — | ❌ no | mixed |
| `content/blogger/posts/20260626-bopomofo-practice-cards-{access,entry}.md` | not observed in grep | — | ❌ no | — |
| `content/blogger/posts/20260504-sample-book-review.md` | no fields | — | ❌ no | draft |

### 4.4 Github-side observations (context only)

- `content/github/posts/20260504-github-pages-blog-planning.fb.md` contains the FB-side
  URL with **forward** UTM (`utm_source=facebook`), unrelated to reverse UTM.
- Validation fixtures under `content/validation-fixtures/blogger/posts/_test-related-links-*.md`
  exercise validator error paths (invalid `kind` / missing `url` / non-array / `sourceKey`
  faults). They are **not** publish-eligible and do not participate in reverse UTM.

### 4.5 What has changed since the 5/26 scan

- **One new datapoint since 5/26**: `20260529-phonics-practice-sheet-download.md` (a
  Blogger-side download draft) now carries a `relatedLinks` entry whose URL hostname is
  `babel-lab.github.io`. This is the **first** Blogger post in the repo that naturally
  references a GitHub Pages article by URL. The 5/26 scan reported 0 such hits repo-wide.
- Everything else the 5/26 scan reported is still true: `we-media-myself2` still has
  only a Blogger-internal cross-link; no `full`-mode `ready` Blogger post carries a
  GitHub cross-link; no other Blogger draft / ready file contains `babel-lab.github.io`.

---

## 5. Candidate fixture selection criteria

For a Blogger post to serve as a K.5 positive fixture (per fixture-plan §3 / §6 +
6/22 K.5 §E), it must at minimum:

- carry `publishTargets.blogger.enabled: true` **and** `publishTargets.blogger.mode: 'full'`
  (summary / redirect-card modes do not trigger `renderFullPost` → do not run
  `deriveRenderedCrossLinks` → reverse UTM never injected);
- reach `status: ready` + `draft: false` so it is export-eligible (drafts never emit
  into `dist-blogger/`);
- contain ≥ 1 `relatedLinks` or `otherLinks` entry whose hostname equals
  `settings.site.githubSiteUrl` (i.e. `babel-lab.github.io`);
- be a real article Dean would genuinely write (production-grade content; no lorem
  ipsum, no test post title);
- not overwrite an already-published live Blogger post's `mode` / `relatedLinks` /
  `primaryPlatform` / SEO-fixture role;
- pass `npm run validate:content` with 0 new warnings **before** any build.

Meta-rules that also apply and are **not** relaxed:

- GA4 / Blogger / AdSense live verification is a **separate, separately approved**
  step; landing a candidate doc or content does not open pm-26.
- Reverse UTM stays dormant until explicit pm-26 approval.
- Evidence for any live claim must be **user-provided, dated, source-labeled, masked**
  per 6/22 K.5 §G / §J. Claude observes nothing on Google surfaces.

---

## 6. Candidate shortlist (2026-07-02)

All entries are **`candidate only`** — inclusion here proves **nothing** about live
export, live UTM injection, live GA4 receipt, or K.5 acceptance. Each unresolved
question is called out; nothing is auto-promoted.

| ID | File | Blogger mode | Status | Has GitHub cross-link? | Verdict | Unresolved questions |
| --- | --- | --- | --- | --- | --- | --- |
| C1 (5/26 carry-over) | `content/blogger/posts/20260515-we-media-myself2.md` | full | ready / published live | ❌ no | ❌ **Not usable** — no GitHub cross-link; forcing one would overwrite a published post (rejected per fixture-plan §2 + 6/22 K.5 §E.4) | none — decision locked |
| C2 (5/26 carry-over) | `content/blogger/posts/20260525-draft-book-review.md` | full | draft | ❌ no | 🚫 **Structurally unusable** — draft; empty link arrays; skeleton content | none — same as 5/26 |
| **C6 (new since 5/26)** | `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | full | draft | ✅ **yes** (`relatedLinks[0].url = .../posts/portable-blog-system-mvp/`) | ⚠️ **Candidate only** — first Blogger post in repo whose `relatedLinks` naturally references GitHub Pages, but currently draft; also a `download`-type post whose fileUrl is empty (`download-r5b` guidance-path). Not promoting to `ready` in this doc | (a) Is a **download-type** post an acceptable K.5 positive fixture surface, or does K.5 prefer a `tech-note` / `book-review` / `life-note` per 6/22 §E.1? (b) Does `download.fileUrl` need to be filled before `status: ready` for validator hygiene? (c) Is the naturalness bar met given the reference is from a phonics practice sheet to a system MVP doc? (d) Does Dean want this post advanced at all, or is he waiting for a fully natural essay per fixture-plan §10.4 main track? |
| Cx (hypothetical) | any 20260612 Blogger post with no `relatedLinks` field | full / summary mixed | mixed | ❌ no | ❌ **Not usable without content-side edit** — adding a GitHub cross-link to an already-live Blogger post would violate fixture-plan §2 "no overwrite of live" | none — decision locked |

Interpretation: the deadlock reported on 5/26 is **narrowed but not broken**. The
repo now contains **one** Blogger `full`-mode post whose `relatedLinks` naturally
references a GitHub Pages article (C6), but it is still `draft` and it is a
`download`-type surface rather than a `tech-note` / `book-review` / `life-note`,
which the 6/22 K.5 §E.1 preferred.

`fixture-plan §10.4` main track — "wait for a natural article" — remains the
default. C6 is **noted, not selected**.

---

## 7. Non-goals

This document does **not**:

- ❌ approve pm-26 or otherwise unblock the deploy gate;
- ❌ change reverse-UTM live / dormant status;
- ❌ promote C6 (or any candidate) from `draft` to `ready`;
- ❌ modify any `.md` / `.publish.json` / `.fb.md` under `content/`;
- ❌ modify any file under `src/`, `views/`, `scripts/`, `content/settings/`;
- ❌ touch `CLAUDE.md`, `MEMORY.md`, `memory/`, `package.json`, lockfile,
  `dist*/`, `portable-blog-deploy/`, `gh-pages` content;
- ❌ update Blogger; run any Blogger repost; touch any Blogger backend surface;
- ❌ verify any GA4 event, dimension, source, medium, campaign, or acquisition figure;
- ❌ run `npm run build*`, `npm run preview`, `npm run report:*`, `npm run smoke:*`,
  or `npm run check:*` beyond the two K1 prepublish guards that boot every session.

All GA4 / Blogger / AdSense live evidence — now and in the future — remains
**user-provided manual evidence only**, per 6/22 K.5 §G / §J.

---

## 8. Recommended next step (proposal only)

None of the options below is executed by this file. Each is a **separately
approved** future phase; ordering follows fixture-plan §8 / §10.4 + 6/22 K.5 §K.

| Priority | Follow-up | Nature | Blocker / gate |
| --- | --- | --- | --- |
| 1 | **Idle freeze — keep as docs-only archive.** Do nothing further; wait for a natural article per fixture-plan §10.4 main track. Reverse UTM stays dormant; pm-26 stays BLOCKED. | passive | none — this is the default |
| 2 | **Decide C6's role (docs-only).** Ask Dean whether `20260529-phonics-practice-sheet-download.md` is intended as a future K.5 fixture surface at all, or whether K.5 should still wait for a `tech-note` / `book-review` / `life-note` per 6/22 K.5 §E.1. Purely a Q&A memo — no `content/` change. | docs-only | Dean's answer |
| 3 | **Static acceptance path only.** If Dean later authorizes it as a separate phase, land the content edits (fill `download.fileUrl` if needed; flip `status: ready` + `draft: false`), then run `npm run validate:content` + `npm run build:blogger`, and verify `dist-blogger/posts/phonics-practice-sheet-download/post.html` contains the four reverse-UTM keys on the GitHub cross-link + `target="_blank"` + merged `rel`. **Stop there.** No repost, no GA4 observation. | content + build, separately approved | pre-approval; validator clean; no live surface touched |
| 4 | **Full live verification (pm-26).** Only after §3 static acceptance passes and Dean explicitly opens pm-26: Blogger repost + GA4 Realtime / DebugView observation + verification report. Follows `docs/20260524-blogger-repost-checklist.md` for backup / rollback. | live, separately approved | all §3 met + Dean opens pm-26 |

Conservative default recommended by this preanalysis: **Priority 1** (idle
freeze). Reverse UTM stays dormant; pm-26 stays BLOCKED; nothing advances until
Dean chooses to.

Before *any* of Priorities 2–4 is actioned, the standard K1 prepublish guards
must pass on entry:

- `npm run check:github-pages-prepublish`
- `npm run check:github-pages-prepublish-smoke`

They are read-only and do not build / deploy / publish / fetch / pull.

---

## 9. Cross-links

- `CLAUDE.md` §16.4 (reverse UTM spec)
- `docs/reverse-utm-fixture-plan.md` §0–§10
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md` (5/26 scan; 0/5)
- `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md` (6/22 K.5 decision view)
- `docs/blogger-to-github-reverse-utm-plan.md`
- `docs/20260524-blogger-repost-checklist.md`
- `docs/20260524-ga4-reverse-utm-observation.md`
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`
- `docs/20260702-session-start-dual-repo-baseline-snapshot.md`

---

（本文件結束 / end of document）
