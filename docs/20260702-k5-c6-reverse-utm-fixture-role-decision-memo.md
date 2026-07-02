# K.5 C6 reverse UTM fixture role decision memo

- Phase name: `20260702-pm-k5-c6-reverse-utm-fixture-role-decision-memo-docs-only-a`
- Date: 2026-07-02 (Asia/Taipei)
- Author of record: Dean (operator) / Claude Code (docs drafting only)
- Scope: **docs-only / read-only decision memo**

---

## 1. Purpose

This memo decides — for the record — what role the Blogger draft post

> `content/blogger/posts/20260529-phonics-practice-sheet-download.md`

(hereafter **C6**) plays in the K.5 reverse-UTM positive-fixture line. It
sits under the 2026-07-02 preanalysis (`docs/20260702-reverse-utm-positive-
fixture-preanalysis.md`) as the follow-up "Priority 2" item: a Q&A memo
that answers whether C6 is a K.5 positive fixture, and if not, why.

It answers nothing outside the C6 question. It does **not** re-open the
reverse-UTM spec, re-open pm-26, re-open Blogger AdSense Batch 2, or
touch content.

---

## 2. Boundary

- **No** build was run this phase.
- **No** deploy / gh-pages push / dist mutation was performed.
- **No** publish action; no Blogger post reposted; no live URL touched.
- **No** dev server started; no `vite`; no `preview`; no `validate:content`
  / `report:*` / `smoke:*` re-execution beyond the two K1 prepublish
  guards required by session-start baseline verify.
- **No** Blogger / GA4 / AdSense / Search Console / Google Drive / Google
  Form backend operation. Claude is not logged in to any Google surface.
- **No** source / content / settings / runtime behavior changed.
  `src/`, `views/`, `scripts/`, `content/`, `settings/`, `package.json`,
  lockfile, `dist*/`, `portable-blog-deploy/`, `.cache/`, `CLAUDE.md`,
  `MEMORY.md` are all untouched. The only mutation in this phase is the
  addition of this single docs file.
- **pm-26 deploy gate remains BLOCKED.** Reverse UTM source (`7e1d356` /
  `e2309e9` / `7c769fe`, 2026-05-23) remains landed but **dormant**.
- **C6 remains `candidate-only`** unless a future, separately approved
  slice changes that. This memo does not promote it.

---

## 3. Inputs reviewed

Read-only reads made this phase:

- `docs/20260702-reverse-utm-positive-fixture-preanalysis.md` (previous
  slice; establishes C6 as "candidate only, first Blogger post whose
  `relatedLinks` naturally references a GitHub Pages article")
- `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md`
  (6/22 K.5 decision view; §E design; §J do-not-claim)
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md`
  (5/26 scan; 0/5 usable, deadlock)
- `docs/reverse-utm-fixture-plan.md` (fixture design SOP §0–§9 + §10)
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`
  (pm-26 preflight §C–§F)
- `content/blogger/posts/20260529-phonics-practice-sheet-download.md`
  (C6 content file — frontmatter only; no sidecar `.publish.json` /
  `.fb.md` present)

Nothing else was read for authoritative decision purposes.

### 3.1 C6 frontmatter facts (as observed today; no edits made)

| Field | Observed value |
| --- | --- |
| `contentKind` | `"download"` |
| `primaryPlatform` | `"blogger"` |
| `category` | `"download"` |
| `status` | `"draft"` |
| `draft` | `true` |
| `canonical` | `"auto"` |
| `publishTargets.blogger.enabled` | `true` |
| `publishTargets.blogger.mode` | `"full"` |
| `publishTargets.github.enabled` | `false` |
| `download.enabled` | `true` |
| `download.fileUrl` | `""` (empty) |
| `download.fileType` | `"PDF"` |
| `relatedLinks[0].kind` | `internal` |
| `relatedLinks[0].sourceKey` | `"github"` |
| `relatedLinks[0].platform` | `"github"` |
| `relatedLinks[0].url` | `https://babel-lab.github.io/portable-blog-system/posts/portable-blog-system-mvp/` |
| `otherLinks` | (not declared) |
| Sidecars (`.publish.json` / `.fb.md`) | not present |

---

## 4. Q&A decision points

### Q1. Can C6 be treated as a confirmed positive fixture now?

**No — not confirmed. Candidate-only.**

The repo can only prove `content/` + `src/` + `settings/` state. It cannot
prove Blogger live-page state, GA4 receipt, deploy status, or reverse-UTM
runtime execution:

- C6 is `status: "draft"` + `draft: true` → excluded from `dist-blogger/`
  export; reverse UTM code path (`deriveRenderedCrossLinks` inside
  `renderFullPost`) is never entered for C6 today.
- Reverse UTM source is landed but un-deployed (per `CLAUDE.md` §16.4 +
  6/22 K.5 §C.1).
- pm-26 deploy gate is BLOCKED (per 5/25 pm-26 preflight §D).
- No user-provided, dated, masked, source-labeled GA4 evidence exists for C6.

Per 6/22 K.5 §J do-not-claim: Claude may not say reverse UTM is deployed,
that GA4 received events, or that any fixture is verified live.

### Q2. Can C6 serve as a future fixture *surface* candidate?

**Yes — conditionally, and only as `candidate-only`.**

C6 is the first Blogger post in the repo whose `relatedLinks` naturally
references a GitHub Pages article (`portable-blog-system-mvp`). Its
`publishTargets.blogger.mode: "full"` is the mode that would trigger
`applyCrossSiteUtm({direction:'to_github'})` at build time. That is a
structurally interesting signal.

However, being a "surface candidate" is not the same as being a fixture:

- No content edit is authorized by this memo.
- No status transition (`draft` → `ready`) is authorized.
- No build / repost / GA4 observation is authorized.
- Any future promotion runs as its own separately approved phase, with a
  fresh baseline verify + K1 guard on entry.

### Q3. Does download-type content make it unsuitable?

**Not disqualifying by itself, but not the preferred surface either.**

- Fixture design SOP (`docs/reverse-utm-fixture-plan.md` §3 / §4) and
  6/22 K.5 §E.1 both express a **preference** for `tech-note` /
  `book-review` / `life-note` topics whose "further reading" cross-link
  to a GitHub Pages tech article reads naturally.
- A `download`-type post that cross-links to a system MVP tech note is
  topically explainable ("technical background for how this teaching
  material is authored"), but it is **not** the mainline naturalness
  case fixture-plan §10.4 targets.
- Conclusion: download-type does not veto C6, but C6's naturalness score
  is lower than the fixture-plan §10.4 main-track "wait for a natural
  essay" path. Naturalness is a **Dean judgment call**, not a mechanical
  test.

### Q4. Does the empty `download.fileUrl` block use as a fixture?

**Yes for `status: ready` promotion; No for the reverse-UTM injection mechanism itself.**

- The reverse-UTM injection at build time depends only on
  `relatedLinks[].url` hostname matching `settings.site.githubSiteUrl`
  (per `src/scripts/ga4-url-builder.js` + `build-blogger.js`). It does
  **not** read `download.fileUrl`. So an empty `fileUrl` does not, by
  itself, prevent the reverse-UTM path from producing the four UTM keys.
- But C6 is a **download-type** post whose body header text says
  "實際下載檔尚未上傳，待定稿後補上". Publishing it live with an
  empty `download.fileUrl` and a "reader is expected to download"
  presentation would be a **content-hygiene** blocker, not a reverse-UTM
  runtime blocker. This memo classifies that as an **unresolved risk**
  attached to any future promotion phase, not to this memo.
- `docs/download-r5b-*` (validator R-rule chain) applies: whether an
  empty `download.fileUrl` on a `download`-type ready post triggers a
  validator warning is out of scope for this docs-only memo and would
  be re-verified in a separate slice — this memo does not run the
  validator or re-derive its output.
- Do not read this Q4 as "C6 can be shipped with empty `fileUrl`". Read
  it as: reverse-UTM mechanism is decoupled from `download.fileUrl`;
  content hygiene is a separate gate.

### Q5. Is a content edit required in this memo?

**No.** This memo is docs-only. It writes exactly one new file under
`docs/`. It does not touch `content/`, `src/`, `views/`, `scripts/`,
`content/settings/`, `package.json`, lockfile, `dist*/`, deploy clone,
`CLAUDE.md`, or `MEMORY.md`. Any future content edit (e.g. filling
`download.fileUrl`, flipping `status` to `ready`, adding a `.publish.json`
sidecar, backfilling `blogger.publishedUrl`) is a separate, explicitly
approved slice — not part of this memo.

### Q6. What would promote C6 from `candidate-only` to approved fixture?

All of the following, each as its own phase with its own explicit
approval; none is scheduled by this memo:

1. Dean gives explicit approval to open the K.5 fixture line for C6
   specifically (rather than continuing to wait for a natural essay per
   fixture-plan §10.4 main track).
2. A separate **content slice** decides and authorizes whatever content
   edits are needed — at minimum the topic-naturalness call, and if
   Dean wants C6 to actually go live as a download post, resolving the
   empty `download.fileUrl` and any related download-validator warnings.
3. Static acceptance runs in its own phase (6/22 K.5 §H.1): full
   `npm run validate:content` clean, `npm run build:blogger` produces
   `dist-blogger/posts/phonics-practice-sheet-download/post.html` whose
   GitHub cross-link carries the four reverse-UTM keys +
   `target="_blank"` + merged `rel`.
4. The K1 prepublish guards pass on entry to each subsequent phase:
   - `npm run check:github-pages-prepublish` → 16/16 PASS
   - `npm run check:github-pages-prepublish-smoke` → 8/8 PASS
5. Dean explicitly opens **pm-26** (currently BLOCKED) and executes the
   Blogger repost per `docs/20260524-blogger-repost-checklist.md`
   (§2.2 backup / §6 rollback discipline).
6. Live GA4 verification (6/22 K.5 §H.2) happens as its own phase, with
   evidence that is **user-provided, dated, source-labeled, masked**
   per 6/22 K.5 §G / §J. Claude does not read any GA4 surface.

Absence of any one of the above keeps C6 at `candidate-only`.

---

## 5. Decision

```text
Decision: C6 is retained as a candidate-only reverse UTM fixture surface,
not an approved positive fixture. No content edit, no status change, no
build, no deploy, no repost, no GA4 verification is authorized by this
memo. pm-26 deploy gate remains BLOCKED. Reverse UTM remains dormant.
```

---

## 6. Recommended next step (proposal only)

Recommended default: **Option 1**. Each option below runs, if at all, as
its own separately approved phase.

- **Option 1 (recommended — idle freeze).** Keep C6 at `candidate-only`.
  Continue to wait for a mainline natural article per fixture-plan §10.4
  main track. Reverse UTM stays dormant; pm-26 stays BLOCKED. This is
  the conservative default.
- **Option 2 (docs-only continuation).** If Dean wants to keep the K.5
  line warm without touching content, land a follow-up **manual
  verification checklist** doc that would apply *only after* pm-26 is
  opened and *only if* content-slice §6-Q6 items 1–2 are approved. That
  checklist would gate build-side H.1 acceptance, repost, and GA4 H.2
  acceptance. Purely docs-only; does not open pm-26.
- **Option 3 (defer C6, prefer natural mainline).** Explicitly deprioritise
  C6 as the K.5 fixture surface in favour of the fixture-plan §10.4 main
  track (wait for a `tech-note` / `book-review` / `life-note` that
  naturally references a GitHub Pages article). This is a docs-only
  decision to record C6 as noted-but-not-selected.

If Dean picks Option 2 or Option 3, that is still a docs-only slice; it
does not deploy, does not repost, does not touch GA4, does not modify C6.

---

## 7. Non-goals

This memo does **not**:

- ❌ approve pm-26 or otherwise unblock the deploy gate;
- ❌ deploy reverse UTM or change its dormant status;
- ❌ update Blogger; repost any post; touch Blogger backend;
- ❌ verify GA4 events, dimensions, sources, mediums, campaigns, or
  acquisition figures;
- ❌ modify any file under `content/` (`.md` / `.publish.json` / `.fb.md`);
- ❌ modify any file under `src/`, `views/`, `scripts/`, `content/settings/`;
- ❌ modify `CLAUDE.md`, `MEMORY.md`, `memory/`, `package.json`, lockfile,
  `dist*/`, `portable-blog-deploy/`, `gh-pages` content;
- ❌ run `npm run build*`, `npm run preview`, `npm run report:*`,
  `npm run smoke:*`, or `npm run check:*` beyond the two K1 prepublish
  guards that boot every session;
- ❌ promote C6 from `draft` to `ready`, edit `download.fileUrl`, or
  create sidecar files for C6;
- ❌ record any live claim about C6, Blogger, GA4, or reverse UTM.

All GA4 / Blogger / AdSense live evidence — now and in the future —
remains **user-provided manual evidence only**, per 6/22 K.5 §G / §J.

---

## 8. Cross-links

- `CLAUDE.md` §16.4 (reverse UTM spec)
- `docs/reverse-utm-fixture-plan.md` §0–§10
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md`
- `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md`
- `docs/20260702-reverse-utm-positive-fixture-preanalysis.md`
- `docs/blogger-to-github-reverse-utm-plan.md`
- `docs/20260524-blogger-repost-checklist.md`
- `docs/20260524-ga4-reverse-utm-observation.md`
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`
- `docs/20260702-session-start-dual-repo-baseline-snapshot.md`

---

（本文件結束 / end of document）
