# K.5 reverse UTM docs index note

- Phase name: `20260702-pm-k5-reverse-utm-docs-index-note-docs-only-a`
- Date: 2026-07-02 (Asia/Taipei)
- Scope: **docs-only index note**

---

## 1. Purpose

This note is a reading-order index for K.5 reverse-UTM / C6
candidate-only docs. It adds **no** new decisions, opens **no** gate,
and authorizes **no** action.

If you land in a cold-start session and want to reconstruct the K.5
state, read the docs below in order. Everything else is background.

---

## 2. Reading order

1. `docs/blogger-to-github-reverse-utm-plan.md`
   Original reverse-UTM plan (step 1–7). The oldest planning anchor.

2. `docs/reverse-utm-fixture-plan.md`
   Fixture design SOP §0–§10 (main-track "wait for a natural article"
   at §10.4; deadlock analysis at §10.2). This is the authoritative
   fixture SOP.

3. `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`
   pm-26 preflight §C–§F (activation conditions D.1 / D.2 / D.3).

4. `docs/20260526-reverse-utm-positive-fixture-scan-report.md`
   5/26 candidate scan; 0/5 usable; formal declaration of the fixture
   deadlock at that snapshot.

5. `docs/20260622-k5-reverse-utm-positive-fixture-preanalysis.md`
   6/22 English-language K.5 decision view (goals / minimal fixture
   design at §E; acceptance H.1 + H.2 at §H; do-not-claim at §J).

6. `docs/20260702-reverse-utm-positive-fixture-preanalysis.md`
   7/02 follow-up preanalysis: what has changed in `content/` since
   5/26; introduces **C6** = `20260529-phonics-practice-sheet-download`
   as the first Blogger draft whose `relatedLinks` naturally cross-
   links to a GitHub Pages article; candidate shortlist.

7. `docs/20260702-k5-c6-reverse-utm-fixture-role-decision-memo.md`
   7/02 decision memo: **C6 is candidate-only, not an approved
   positive fixture.** Q&A form; explicit non-goals.

8. `docs/20260702-k5-c6-manual-verification-checklist.md`
   7/02 future manual checklist for §3 Preconditions / §4 Repo-side /
   §5 Blogger-side / §6 GA4-side. Sections §5 and §6 are marked
   **"Not performed in this slice"** — they run only after a
   separately approved gate is opened.

Related SOPs referenced from the above (do not need to read straight
through unless a live step is being planned):

- `docs/20260524-blogger-repost-checklist.md` — Blogger repost SOP
  (§2.2 backup / §6 rollback discipline).
- `docs/20260524-ga4-reverse-utm-observation.md` — GA4 reverse-UTM
  observation SOP.

---

## 3. Current decision carried forward

- **C6 remains `candidate-only`.**
- **C6 is not an approved positive fixture.**
- **pm-26 remains BLOCKED.**
- **Reverse UTM remains dormant** (source landed `7e1d356` / `e2309e9`
  / `7c769fe`, 2026-05-23; un-deployed).
- **No content edit, build, deploy, repost, Blogger update, GA4
  verification, or backend action is authorized by this index note.**

---

## 4. Suggested next action

Default: **idle freeze.**

If K.5 is later re-opened by explicit Dean approval:

- Start from item 8 (`20260702-k5-c6-manual-verification-checklist.md`).
- Re-run the session-start baseline verify + both K1 prepublish guards
  before any subsequent step (see the checklist's §3 Preconditions).
- Any content / build / deploy / Blogger / GA4 action is its own
  separately approved phase with its own docs artifact.

---

（本文件結束 / end of document）
