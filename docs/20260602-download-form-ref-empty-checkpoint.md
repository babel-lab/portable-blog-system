# 2026-06-02 Download formRef Empty Checkpoint

Phase name: `20260602-night-2-download-form-ref-empty-checkpoint-docs-only-a`
Date: 2026-06-02 (night-2)
Mode: docs-only checkpoint (no source / no fixture / no settings / no loader / no renderer / no Admin / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM / no pm-26 unblock)

---

## 1. Executive Summary

This document is a **docs-only checkpoint**. It freezes the state of the
`download.formRef` empty / whitespace warning-only validation work that was
completed and accepted earlier today (2026-06-02), before any further download
workflow phase is opened.

Summary of frozen state:

- `download.formRef` empty / whitespace validation has been **implemented**
  and **accepted** as a warning-only rule.
- The rule is **registry-free** — it does not read
  `content/settings/download-forms.json` and does not perform any registry
  lookup.
- The rule covers exactly two cases:
  - `formRef === ""` (empty string)
  - `formRef` is a string and `formRef.trim() === ""` (whitespace-only string)
- Other `formRef` shapes (`undefined`, non-string types) continue to be handled
  by their existing rules (`download-form-ref-invalid-type` for non-string;
  `undefined` is not flagged).
- The subsequent **registry-aware** validation work (not-found / inactive /
  duplicate / coexistence rules; loader; Admin; renderer; landing page) has
  **not started** and is **not** unlocked by this checkpoint.

This document records the verified baseline so that a future phase can resume
from a known-good state without having to re-derive it from git history.

See also:

- `docs/20260602-download-form-ref-empty-policy-preanalysis.md`
  (Phase 20260602-am-2 — preanalysis that recommended Option A: empty /
  whitespace `formRef` should warn)

---

## 2. Final Baseline

Baseline verified at start of this phase (2026-06-02 21:15 local):

- repo path: `D:\github\blog-new\portable-blog-system`
- branch: `main`
- HEAD before docs checkpoint: `f6eec8399dc9d32ea9c540ae6e8f90a1dde863ff`
- HEAD short hash: `f6eec83`
- HEAD == `origin/main`: yes (ahead/behind 0/0)
- working tree clean before phase: yes
- latest subject: `feat(download): validate empty form ref`
- `npm run validate:content`: **0 errors / 55 warnings / 50 posts**

Recent commit chain (most recent first, top of this checkpoint window):

```text
f6eec83 feat(download): validate empty form ref
f038ce0 docs(download): decide form ref empty policy
8277feb feat(download): validate content reference field shapes
45b9a29 docs(download): preflight content reference fixtures
67c6213 docs(download): design content reference fixtures
```

---

## 3. Implemented Rule

- **Rule id:** `download-form-ref-empty`
- **Target field:** `download.formRef`
- **Severity:** `warning` (warning-only; never errors)
- **Condition:** `typeof formRef === 'string' && formRef.trim() === ''`
- **Cases covered:**
  - empty string (`""`)
  - whitespace-only string (e.g. `"   "`, `"\t"`, `"\n"`)
- **Cases NOT covered by this rule:**
  - `formRef === undefined` — explicitly NOT flagged (formRef is optional)
  - `formRef` is a non-string (array / number / null / boolean / object) —
    flagged by `download-form-ref-invalid-type` instead
- **Registry interaction:** none. The rule performs no lookup against
  `content/settings/download-forms.json` and has no dependency on the empty
  registry landing point.
- **Mutual exclusion:**
  - `download-form-ref-invalid-type` and `download-form-ref-empty` are
    mutually exclusive (a single value cannot be both a non-string and an
    empty string).
  - The rule does not interact with assetRefs rules; it operates only on
    `download.formRef`.

Implementation lives in `src/scripts/validate-content.js` inside the
existing Phase 20260601-night-9 / Phase 20260602-am-3 content-reference
shape-check block; no new top-level scaffolding was added.

---

## 4. Fixtures Added

Two new validation fixtures were added under
`content/validation-fixtures/blogger/posts/`:

- `content/validation-fixtures/blogger/posts/_test-download-form-ref-empty.md`
  — `download.formRef: ""` (empty string case)
- `content/validation-fixtures/blogger/posts/_test-download-form-ref-whitespace.md`
  — `download.formRef: "   "` (whitespace-only string case)

Per-fixture expectations:

- Each fixture is designed to trigger exactly **one** warning:
  `download-form-ref-empty`.
- Each fixture explicitly avoids triggering `download-form-ref-invalid-type`
  (the value is a string in both cases).
- Each fixture sets `download.enabled: true`, a valid `download.fileUrl`, and
  `seo.indexing: "noindex-follow"` so that no other download / seo rule fires
  on the same post.
- Both files are **validation fixtures**, not production posts. They live
  under `content/validation-fixtures/blogger/posts/` and are scanned only by
  `validate-content`; `build:github`, `build:blogger`, and `build:promotion`
  do not pick them up.

---

## 5. Validation Baseline Movement

- **Previous baseline** (before Phase 20260602-am-3 implementation +
  fixtures): `0 errors / 53 warnings / 48 posts`
- **Current baseline** (frozen by this checkpoint):
  `0 errors / 55 warnings / 50 posts`
- **Movement:** `+0 errors / +2 warnings / +2 posts`
- **Source of movement:** exactly the two new validation fixtures listed in
  §4. Each fixture contributes `+1 post` and `+1 warning` of type
  `download-form-ref-empty`. No other counters changed; no existing fixture
  or production post moved between the two states.

---

## 6. Explicit Non-goals

The following were **not** attempted in the work frozen by this checkpoint,
and are **not** authorized by this checkpoint:

- No registry lookup of `content/settings/download-forms.json` or
  `content/settings/download-assets.json`.
- No `download-form-ref-not-found` rule.
- No `download-form-ref-inactive` rule.
- No `download-form-ref-duplicate` rule.
- No `download-asset-ref-not-found` / `inactive` / `duplicate` rules.
- No coexistence rule between `assetRefs` and `formRef`.
- No loader changes — `src/scripts/load-settings.js` was not touched;
  `downloadAssets` / `downloadForms` registries remain unconnected.
- No renderer changes — no landing-page renderer; no consumer of formRef /
  assetRefs in templates.
- No Admin UI changes — no picker, no Apply flow, no middleware route.
- No settings changes — `content/settings/download-assets.json` and
  `content/settings/download-forms.json` remain at the empty registry shape
  landed in commit `466e471`.
- No production content migration — no production post under
  `content/blogger/posts/` or `content/github/posts/` had its
  `download.fileUrl` rewritten to `assetRefs[]` / `formRef`.
- No build (`npm run build`, `build:github`, `build:blogger`,
  `build:promotion`, `build:sitemap`, `build:blogger-theme`).
- No deploy / no `gh-pages` mutation.
- No Blogger manual repost.
- No GA4 Realtime validation.
- No reverse UTM activation (Blogger → GitHub Pages remains dormant per §16.4).
- No `pm-26` deploy gate unblock.

---

## 7. Current Dormant / Blocked Items

State of adjacent workstreams at this checkpoint:

- **Download registry-aware validation** — not started.
  - No not-found / inactive / duplicate / coexistence rules implemented.
  - No registry-aware preview-risk rule implemented.
- **Download loader expansion** — not started.
  - `src/scripts/load-settings.js` does not source
    `download-assets.json` / `download-forms.json`.
- **Admin picker / renderer / landing page** — not started.
  - No Admin UI consumes the empty registries.
  - No landing-page renderer reads `assetRefs[]` / `formRef`.
- **Reverse UTM (Blogger → GitHub Pages)** — remains dormant.
  - Source landed in `7e1d356` / `e2309e9` / `7c769fe` (per CLAUDE.md §16.4)
    but live state is dormant; not unblocked here.
- **pm-26 deploy gate** — remains **BLOCKED**. Not unblocked here.
- **Admin Apply / middleware write route / admin-write-cli** — remain
  dormant. Not enabled here and not authorized to be enabled without a
  separate explicit phase.

---

## 8. Recommended Next State

**Recommendation: Final Idle Freeze / EXIT.**

Rationale:

- The `download.formRef` empty / whitespace warning-only rule is complete,
  fixture-verified, and pushed.
- The baseline (`0 / 55 / 50`) is stable and reproducible.
- Any further forward motion — registry-aware validation, loader expansion,
  Admin picker, renderer, landing page, production content migration,
  reverse UTM activation, or pm-26 deploy gate work — belongs to a
  **separate phase** with its own preanalysis, scope statement, and
  explicit authorization from the user.

This checkpoint does **not** authorize, and must **not** be used to
auto-start, any of the following:

- a `download-form-ref-not-found` or any other registry-aware validator
  phase;
- a loader-connection phase;
- an Admin picker / renderer / landing page implementation phase;
- a production content migration phase;
- a build / deploy / Blogger repost / GA4 validation phase;
- a reverse UTM activation or `pm-26` unblock phase.

The next phase, whenever it is opened, must restate its scope and
non-goals; this checkpoint is not a license to widen scope automatically.

---
