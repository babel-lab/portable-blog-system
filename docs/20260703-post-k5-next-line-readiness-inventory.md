# Post-K.5 Next-Line Readiness Inventory (docs-only)

- Phase name: `20260703-am-post-k5-next-line-readiness-inventory-docs-only-a`
- Date: 2026-07-03 (Asia/Taipei)
- Type: **docs-only inventory**. Adds **no** new decision, opens **no** gate,
  authorizes **no** build / deploy / repost / backend action.

---

## 0. Critical disclaimers (read first)

1. This inventory is **docs-only**. Its only mutation is the addition of this
   single Markdown file under `docs/`.
2. It restates the **already-closed** state of the K.5 reverse-UTM docs line
   and the C1 GitHub Pages publish-path readiness line. It does **not**
   re-open, re-decide, or advance any of them.
3. It lists the **remaining candidate lines** (K.1 / K.2 / K.3 / K.4, plus
   C1 next-step B / C, plus dormant write-path / deploy lines) purely so a
   future cold-start session can reconstruct the option surface without
   guessing.
4. All candidates are **idle-freeze by default**. Each requires **explicit
   Dean approval** before any subsequent phase starts. Nothing here is a
   TODO for Claude to pick up.
5. **No** build / deploy / preview / gh-pages / Blogger / GA4 / AdSense /
   Search Console / Google Drive action was performed while producing this
   file.

---

## 1. Purpose

Give a single anchor doc that summarises, at cold-start:

- **What just closed** at the end of the previous session
  (2026-07-02 evening).
- **What automated read-only guards are live** (K1 prepublish guard pair).
- **What remains available** as candidate next slices, and under what
  approval gate each sits.
- **What is dormant / blocked** and must not be touched without a
  separately approved phase.

This is not a decision doc. It is a reading map.

---

## 2. Session-start baseline (2026-07-03 07:11 AM, Asia/Taipei)

Source repo (`/d/github/blog-new/portable-blog-system`):

```text
branch: main
HEAD = origin/main = 546f3b1aec8f7bb9b4817b182e62da57041e18b0
short: 546f3b1
subject: docs(analytics): index k5 reverse utm docs
ahead/behind: 0/0
working tree: clean
.git/index.lock: absent
CLAUDE.md: 38811 chars / 50469 bytes (unchanged this session)
```

Deploy clone (`/d/github/blog-new/portable-blog-deploy`; read-only inspection):

```text
branch: gh-pages
HEAD = origin/gh-pages = d0f37ebce2d0a716d9b12f9a6e78fb1f14de7df7
short: d0f37eb
subject: deploy(github): refresh SEO meta for github-pages-build-preview-workflow
ahead/behind: 0/0
working tree: clean
.git/index.lock: absent
```

Baseline **matched** on entry; no repair was attempted; deploy clone is
**not** touched by this phase beyond a read-only `git status` /
`rev-parse` verification.

---

## 3. Lines closed prior to this session

### 3.1 C1 — GitHub Pages publish-path readiness + prepublish guard

Landed as a self-contained line ending 2026-07-02:

| Commit | Role |
| --- | --- |
| `1dfe281` | `docs(publish): add github pages pre-publish checklist` — C1 checklist (`docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`) |
| `6d1608d` | `feat(publish): add github pages prepublish guard` — read-only guard script |
| `05fde99` | `test(publish): add prepublish guard smoke` |
| `a7bb9fb` | `test(publish): cover prepublish guard edge failures` |
| `1c9842c` | `docs(state): sync prepublish guard baseline` |
| `efc3f6b` | `docs(publish): link prepublish guard from checklist` — added §10 automated verification pointer |

Automated read-only guard baseline (carry-forward; do **not** re-run
without cause):

- `npm run check:github-pages-prepublish` → **16/16 PASS**
- `npm run check:github-pages-prepublish-smoke` → **8/8 PASS**

Both guards are **read-only**. They do **not** build, deploy, publish,
fetch, or pull. They verify source/deploy repo baseline invariants
(branch / HEAD / clean / ahead·behind / `.git/index.lock` absence /
required docs presence) and self-test the guard against seven failure
fixtures.

C1 §8 next-step options **B** (Dean names a real article as ready
candidate) and **C** (a separate session for read-only build readiness)
remain **unselected** and **not** started.

### 3.2 K.5 — Reverse UTM positive fixture / C6 candidate line

Landed as a docs-only planning line ending 2026-07-02:

| Commit | Role |
| --- | --- |
| `e0fe28e` | `docs(analytics): add reverse utm fixture preanalysis` — 7/02 follow-up preanalysis introducing C6 |
| `9a392d8` | `docs(analytics): decide c6 reverse utm fixture role` — C6 = candidate-only, not approved fixture |
| `61beee6` | `docs(analytics): add c6 fixture verification checklist` — future manual checklist (§5 / §6 marked "not performed in this slice") |
| `546f3b1` | `docs(analytics): index k5 reverse utm docs` — reading-order index note |

Standing decisions carried forward from K.5:

- **C6 remains candidate-only**, **not** an approved positive fixture.
- **pm-26 remains BLOCKED**.
- **Reverse UTM remains dormant** (source landed `7e1d356` / `e2309e9` /
  `7c769fe`, 2026-05-23; un-deployed).
- **No** content edit / build / deploy / repost / Blogger update / GA4
  verification / backend action was authorized by the K.5 line.

---

## 4. Remaining candidate lines (all idle-freeze; require Dean explicit approval)

Listed for orientation only. Claude does **not** advance any of these
without a separately approved phase.

### 4.1 BLOG line (per CLAUDE.md §3a Recommended next paths)

| ID | Candidate | Current stance |
| --- | --- | --- |
| K.1 | P3 content landing (further steady-rhythm / other natural articles) | 🟡 candidate; Dean-driven; docs-only until content emerges naturally |
| K.2 | Blogger AdSense Batch 2 P2 live repost (`ai-tools-simplify-daily-workflow`) | 🔴 BLOCKED live-side; content landed at `50c9…` era but live repost not authorized |
| K.3 | AdSense dashboard observation (docs-only record of Dean-provided masked evidence) | 🟡 candidate; requires Dean-provided masked screenshots |
| K.4 | GA4 P2 / P3 dimension expansion beyond D4 first-batch | 🟡 candidate; docs-only until Dean-provided masked evidence lands |
| K.5 | Reverse UTM positive fixture reopen | ⏸ closed at planning; only re-open path is item 8 of `docs/20260702-k5-reverse-utm-docs-index-note.md` |

### 4.2 C1 publish-path follow-ups

| ID | Candidate | Current stance |
| --- | --- | --- |
| C1-B | Dean names one real article and walks §4 pre-publish checklist single-post | 🟡 candidate; Dean-driven; will change article `status` frontmatter (manual) |
| C1-C | Separate session for read-only build readiness (check `build:github` script path + dist product mapping; no build executed) | 🟡 candidate; would be its own docs-only phase |

### 4.3 Dormant / Blocked (not candidates — require independent phase + explicit approval)

- 🔴 Reverse UTM deploy (pm-26 gate) — dormant / BLOCKED.
- 🔴 Admin write path — Apply / middleware / `admin-write-cli` /
  `--apply` / `dryRun:false` all dormant (per
  `memory/project_admin_write_path_status.md`).
- 🔴 FB sidecar real write — dormant (waits on 8-item preflight).
- 🔴 Blogger AdSense Batch 2 P2 / P3 live repost — BLOCKED.
- 🔴 Any Blogger / GA4 / AdSense / Google Drive / Search Console backend
  action by Claude — permanently forbidden per CLAUDE.md §29.

---

## 5. Recommended next smallest step

**Idle freeze.** The two closed lines (C1 and K.5) are self-consistent
at the planning / read-only-guard stage. There is no clear docs-only
step that meaningfully advances either without new input.

The next genuine progress is **Dean-side and manual**:

- name one real article to walk C1 §4 checklist (C1-B), **or**
- pick one of K.1 / K.3 / K.4 to open as its own docs-only phase, **or**
- decide the timing for C1-C read-only build readiness audit.

Until Dean provides explicit approval + direction, the smallest correct
step is to hold.

---

## 6. Red-line pointer (do not violate)

Restated from CLAUDE.md §3a **Red lines** and §29 (unchanged; this doc
does not modify them):

- ❌ **No** git push / force / rebase / reset --hard / amend /
  cherry-pick / merge without an active phase + explicit approval.
- ❌ **No** `npm install` / dependency / lockfile changes.
- ❌ **No** `npm run build*` / `preview` / `deploy` / gh-pages push /
  `dist*/` mutation.
- ❌ **No** `src/` / `views/` / `scripts/` / `content/` / `settings/` /
  `.cache/` mutation.
- ❌ **No** `MEMORY.md` / `memory/` change (this phase is not
  memory-sync).
- ❌ **No** Blogger / AdSense / GA4 / Google Drive / Search Console
  backend action.
- ❌ **No** CLAUDE.md compression / rewrite / decompression this phase.
- ❌ **No** Phase 1 final downgrade or re-freeze.
- ❌ Real AdSense `client id` / `slot id` live **only** in
  `content/settings/ads.config.json`; must **not** appear in `docs/` /
  CLAUDE.md / commit messages / any frontmatter.

---

## 7. Do-not-claim list (restated)

Claude must **not** state any of the following unless Dean supplies
dated, sourced, masked evidence that directly shows it — and even then
only as "user-provided manual evidence reports X":

- ❌ AdSense dashboard status was observed.
- ❌ GA4 dimensions were registered.
- ❌ GA4 reports are populated beyond D4 first-batch.
- ❌ Reverse UTM is live.
- ❌ Attribution is verified.
- ❌ Blogger pages were retested.
- ❌ Any backend dashboard metric was confirmed.

All future backend / live evidence = **user-provided manual evidence only**.

---

## 8. Phase self-check

- ✅ Baseline matched on entry (`546f3b1`); no repair attempted; deploy
  clone read-only inspected (`d0f37eb`) and left untouched.
- ✅ Only one file mutated: this file (`docs/20260703-post-k5-next-line-readiness-inventory.md`).
- ✅ **No** change to `src/` / `views/` / `scripts/` / `content/` /
  `settings/` / `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` /
  `memory/`.
- ✅ **No** build / deploy / preview / dev server / repost / gh-pages
  action; deploy clone untouched.
- ✅ **No** Blogger / Google / GA4 / AdSense / Search Console
  interaction.
- ✅ **No** new devDependency (no Playwright, no test runner change).
- ✅ **No** guard re-run beyond baseline verify (carry-forward
  `check:github-pages-prepublish` 16/16 and
  `check:github-pages-prepublish-smoke` 8/8).

---

## 9. Cross-links

- `CLAUDE.md` §3a Current state snapshot + Core operating rules + Red
  lines + Validation baseline + Recommended next paths.
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`
  (C1 checklist; §5 command list = future-step-only; §8 next-step A/B/C).
- `docs/20260702-k5-reverse-utm-docs-index-note.md`
  (K.5 reading-order index; §4 suggested next action).
- `docs/20260702-k5-c6-reverse-utm-fixture-role-decision-memo.md`
  (C6 = candidate-only decision).
- `docs/20260702-k5-c6-manual-verification-checklist.md`
  (future manual checklist §5 / §6 not performed).
- `docs/20260702-phase1-manual-e2e-runbook.md`
  (Phase 1 Manual E2E PASS 2026-07-02).
- `docs/20260702-session-start-dual-repo-baseline-snapshot.md`
  (prior session start-of-day dual-repo snapshot pattern).
- `docs/20260622-k3-k4-k5-docs-only-closure-checkpoint.md`
  (prior K.3 / K.4 / K.5 closure checkpoint pattern this doc follows).

---

（本文件結束 / end of document）
