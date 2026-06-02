# 2026-06-02 Download Registry-aware Validation Preanalysis

Phase name: `20260602-night-4-download-registry-aware-validation-preanalysis-docs-only-a`
Date: 2026-06-02 (night-4)
Mode: docs-only preanalysis (no source / no fixture / no settings / no loader / no renderer / no Admin / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM / no pm-26 unblock / no admin-write-cli / no middleware)

---

## 1. Executive Summary

This document is a **docs-only preanalysis** that plans the next workstream
on top of the recently-completed `download-form-ref-empty` checkpoint
(commit `63e6a9b`). The next workstream is **download registry-aware
validation**: rules that consult `content/settings/download-assets.json`
and `content/settings/download-forms.json` in order to validate
frontmatter `assetRefs[]` / `download.formRef` against the registries
(not-found / inactive / duplicate / coexistence).

This preanalysis:

- Reaffirms the current validate baseline (`0 errors / 55 warnings /
  50 posts`).
- Documents the existing download-related rules already in source
  (frontmatter-shape rules + registry-level shape/dup-key rules from
  Phase 20260601-pm-17).
- Notes — for record only — a small drift between CLAUDE.md §3.2 text
  and source-of-truth state at HEAD `63e6a9b` (CLAUDE.md describes the
  registries as "loader not connected, validator no rule," but loader
  pm-11 and validator pm-17 have in fact landed read-only access).
  No CLAUDE.md edit is performed in this phase.
- Lists candidate warning-only registry-aware rules and ranks them by
  introduction order, risk, and dependency.
- Proposes a conservative multi-phase plan (R1–R6) where each phase
  introduces at most one rule family and at most a small fixture batch.
- Records explicit non-goals and a final recommendation of
  **Final Idle Freeze / EXIT** with no auto-start.

Output of this phase is exactly **one** new file:
`docs/20260602-download-registry-aware-validation-preanalysis.md`.

See also:

- `docs/20260602-download-form-ref-empty-checkpoint.md` (the freeze
  baseline preceding this phase)
- `docs/20260602-download-form-ref-empty-policy-preanalysis.md`
  (the Option A policy that landed `download-form-ref-empty`)
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
  (registry schema decision and red lines)
- `docs/20260531-download-empty-registry-implementation-plan.md`
  (empty-registry landing plan)
- `docs/20260601-download-validation-remaining-rules-preanalysis.md`
  (earlier note on remaining download rules)
- `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md`
  (landing-page registry direction; out of scope for this phase but
  related to future Admin/renderer phases)

---

## 2. Current Baseline

Baseline confirmed at start of this phase (2026-06-02 21:25 local):

- repo path: `D:\github\blog-new\portable-blog-system`
- branch: `main`
- HEAD: `63e6a9b85c3d7a0bf33b809ca2893fb3695e7e9f` (short `63e6a9b`)
- HEAD == `origin/main`: yes (ahead/behind 0/0)
- working tree clean
- latest commit subject: `docs(download): record form ref empty checkpoint`
- `npm run validate:content` → **0 errors / 55 warnings / 50 posts**

Recent commit chain (top of this preanalysis window, most recent first):

```text
63e6a9b docs(download): record form ref empty checkpoint
f6eec83 feat(download): validate empty form ref
f038ce0 docs(download): decide form ref empty policy
8277feb feat(download): validate content reference field shapes
45b9a29 docs(download): preflight content reference fixtures
```

---

## 3. Existing Download Validation Rules

This section enumerates **all** currently-implemented download-related
warning rules in `src/scripts/validate-content.js` at HEAD `63e6a9b`.
This is the ground truth from which the candidate registry-aware rules
in §5 build.

### 3.1 Frontmatter `download.fileUrl` shape (D1 / D2 / D3)

Block: lines 530–595 of `src/scripts/validate-content.js`.

| Rule id                          | Condition                                                                                  | Mutual exclusion                          |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `download-fileurl-invalid-type`  | `download.fileUrl !== undefined && typeof !== 'string'`                                    | Suppresses D1 / D3 on same post           |
| `download-enabled-fileurl-empty` | `contentKind === 'download' && download.enabled === true && (missing or empty/whitespace)` | Mutually exclusive with D2 / D3           |
| `download-fileurl-invalid-format`| `download.fileUrl` is non-empty string and does not match `^https?://`                     | Mutually exclusive with D1 / D2           |

Source-of-truth references in source comments:

- `docs/20260530-download-validation-d3-s1-s2-decision-preanalysis.md`
- `docs/20260530-download-validation-fileurl-relative-path-decision-preanalysis.md`

### 3.2 Frontmatter `assetRefs[]` / `formRef` shape (Option 6 + Option A)

Block: lines 597–665 of `src/scripts/validate-content.js`.

| Rule id                            | Condition                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `download-asset-refs-invalid-type` | `assetRefs !== undefined && !Array.isArray(assetRefs)`                                      |
| `download-asset-ref-invalid-type`  | `assetRefs` is array, item is not string                                                    |
| `download-asset-ref-empty`         | `assetRefs` is array, item is string, `item.trim() === ''`                                  |
| `download-form-ref-invalid-type`   | `formRef !== undefined && typeof formRef !== 'string'`                                      |
| `download-form-ref-empty`          | `typeof formRef === 'string' && formRef.trim() === ''` (Phase 20260602-am-3 / Option A)     |

Notes:

- `download-form-ref-empty` and `download-form-ref-invalid-type` are
  mutually exclusive (a string cannot also be a non-string).
- `download-asset-ref-empty` and `download-asset-ref-invalid-type` are
  per-array-index mutually exclusive: invalid-type catches non-string
  items; empty catches string items that trim to nothing.
- `download-asset-refs-invalid-type` short-circuits the inner item
  loop; if `assetRefs` is not an array, no per-item rule fires.
- None of these rules read the registry.
- None of these rules check `assetRefs: []` (an empty array is
  silently accepted; semantics are deferred to a later coexistence
  rule — see §5.4).

### 3.3 SEO interlock (`download-content-should-be-noindex`)

Block: lines 668–711 of `src/scripts/validate-content.js`.

| Rule id                              | Condition                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `download-content-should-be-noindex` | `contentKind === 'download' && seo.indexing ∉ { 'noindex-follow', 'noindex-nofollow' }` and D1/D2/D3 did not fire |

Suppressed when any of D1 / D2 / D3 fires on the same post
(per `docs/20260530-download-validation-s1-s2-merge-decision.md` §G.1).

### 3.4 Registry-level shape + key uniqueness (Phase 20260601-pm-17)

Block: lines 272–326 and 354–372 of `src/scripts/validate-content.js`.

| Rule id                            | Condition                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `download-registry-invalid-shape`  | `downloadAssets`/`downloadForms` is not a plain object, or `assets`/`forms` is not an array  |
| `download-registry-duplicate-key`  | Same `assetId` (or `formId`), after `trim`, appears ≥ 2 times in registry array              |

These run **once per validator run**, outside the post loop. They use
the loader's already-exposed `settings.downloadAssets` /
`settings.downloadForms` (additive surface from Phase 20260601-pm-11).
On the current empty registries (`{ schemaVersion: 1, updatedAt: "",
assets: [], notes: "" }` / `{ ..., forms: [], notes: "" }`), neither
rule fires.

### 3.5 Composition of the current `55` warnings

The `0 / 55 / 50` baseline is composed of warning-only fixture posts.
This preanalysis does not re-tabulate the per-rule breakdown — that
breakdown was last captured in
`docs/20260602-download-form-ref-empty-checkpoint.md` §5. The
relevant invariant for this phase is: **no production post under
`content/blogger/posts/` or `content/github/posts/` contributes a
download-related warning at this baseline.** Any movement in the
production-post warning count during a future registry-aware
implementation phase is a stop signal.

### 3.6 Relationship between `download-form-ref-empty` and `download-form-ref-invalid-type`

These two rules are explicitly mutually exclusive — only one can fire
per `download.formRef` value. The decision tree is fully specified in
`docs/20260602-download-form-ref-empty-policy-preanalysis.md` §7. The
key implication for registry-aware design is:

- If `formRef` is `undefined` → no rule fires; registry lookup MUST NOT
  run.
- If `formRef` is a non-string → `download-form-ref-invalid-type` fires;
  registry lookup MUST NOT run.
- If `formRef` is a string with `trim() === ''` →
  `download-form-ref-empty` fires; registry lookup MUST NOT run.
- Otherwise → `formRef` is a trimmable non-empty string and registry
  lookup MAY run.

The same shape contract applies per item to `assetRefs[]`: lookup may
only run on a string item whose trim is non-empty.

---

## 4. Registry Files and Loader State

### 4.1 Current registry files

- `content/settings/download-assets.json`:
  `{ "schemaVersion": 1, "updatedAt": "", "assets": [], "notes": "" }`
- `content/settings/download-forms.json`:
  `{ "schemaVersion": 1, "updatedAt": "", "forms": [], "notes": "" }`

Both files have remained at the empty-registry landing shape since
commit `466e471` (per
`docs/20260531-download-empty-registry-implementation-plan.md`). The
registry red lines from CLAUDE.md §3.2 still hold:

- ❌ never contain respondent data
- ❌ never contain access tokens / API keys / OAuth secrets
- ❌ Google Forms responses remain in Google Forms / Sheets, not in repo

### 4.2 Loader state (additive read-only surface)

`src/scripts/load-settings.js` exposes the registries on `settings` via
`readJsonOptional` with a default fallback:

```js
result.downloadAssets = await readJsonOptional(
  'download-assets.json',
  { schemaVersion: 0, updatedAt: '', assets: [], notes: '' },
);
result.downloadForms = await readJsonOptional(
  'download-forms.json',
  { schemaVersion: 0, updatedAt: '', forms: [], notes: '' },
);
```

Behavior:

- File missing → fallback object (`assets: []` / `forms: []`).
- JSON parse error → fallback object.
- File present and JSON-valid but malformed (e.g. `assets` is a number)
  → object returned **verbatim**; loader does not normalize. The
  `download-registry-invalid-shape` rule catches this at validator
  time (see §3.4).

This was landed in Phase 20260601-pm-11 as additive surface only — no
downstream consumer was activated. The only consumer at HEAD `63e6a9b`
is `validateDownloadRegistry()` in `validate-content.js`.

### 4.3 CLAUDE.md drift (record only)

CLAUDE.md §3.2 currently states (excerpt):

> - ❌ **沒有 loader source** 讀取此兩檔（`src/scripts/load-settings.js` 未串接）
> - ❌ **沒有 validator rule** 對應之 unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry 等規則皆未實作

This is partially out of date at HEAD `63e6a9b`:

- The loader is in fact connected (additive, Phase 20260601-pm-11).
- The validator does have `download-registry-invalid-shape` and
  `download-registry-duplicate-key` (Phase 20260601-pm-17).
- The validator does **not** yet have `ref-not-found` / `inactive` /
  `unknown-field` / `preview-risk-via-registry` — those remain
  candidates for the registry-aware phase planned here.

This preanalysis does **not** modify CLAUDE.md. The CLAUDE.md update,
if any, belongs to a separate documentation-only phase whose scope is
explicitly that update. Recording the drift here is for traceability
only.

### 4.4 What "registry-aware" means for this phase

For the purposes of this preanalysis:

- **Registry-aware** rules are those that, in addition to inspecting
  frontmatter, also inspect the registry contents (per-entry
  `assetId` / `formId`, plus optional `active` / `status` fields per
  `docs/20260531-download-asset-form-settings-registry-schema-decision.md`).
- **Registry-shape** rules (already landed in §3.4) inspect only the
  top-level shape and key uniqueness; they do not cross-reference
  frontmatter. They are **prerequisites** for registry-aware rules
  and are out of scope for the new R-series phases.

---

## 5. Candidate Registry-aware Rules

This section enumerates candidate warning-only rules. **No rule is
authorized to land in this phase.** Each candidate is recorded with
condition, severity, dependencies, and rationale.

### 5.1 `download-asset-ref-not-found`

- **Condition.** `assetRefs[i]` is a string with `trim() !== ''` and
  there is no entry in `settings.downloadAssets.assets` whose
  `assetId.trim()` equals `assetRefs[i].trim()`.
- **Severity.** warning (consistent with all other download rules).
- **Mutual exclusion.** Per array index: only one of
  `download-asset-ref-invalid-type`, `download-asset-ref-empty`,
  `download-asset-ref-not-found` may fire.
- **Dependencies.**
  - `download-registry-invalid-shape` must NOT have fired for
    `downloadAssets`; if it has, this rule is skipped entirely (no
    point comparing against malformed data).
  - Loader registry must be non-empty for this rule to be useful in
    practice (an empty registry would flag every non-empty
    `assetRefs` entry — see risk §8.3).
- **Rationale.** The next obvious step after shape validation: catch
  typos and stale references.

### 5.2 `download-form-ref-not-found`

- **Condition.** `formRef` is a string with `trim() !== ''` and there
  is no entry in `settings.downloadForms.forms` whose
  `formId.trim()` equals `formRef.trim()`.
- **Severity.** warning.
- **Mutual exclusion.** Per post: only one of
  `download-form-ref-invalid-type`, `download-form-ref-empty`,
  `download-form-ref-not-found` may fire.
- **Dependencies.** Same as §5.1 but for `downloadForms`.
- **Rationale.** Sibling of §5.1; symmetry across the two reference
  fields keeps the validator surface consistent.

### 5.3 `download-asset-ref-inactive` / `download-form-ref-inactive`

- **Condition.** Reference resolves to a registry entry whose
  `active` (or equivalent status field per pm-2 schema decision) is
  explicitly `false`.
- **Severity.** warning.
- **Mutual exclusion.** Strictly downstream of not-found: only fires
  when not-found does NOT fire (i.e. the registry entry exists). Only
  one of `not-found` / `inactive` may fire per reference.
- **Dependencies.**
  - The pm-2 schema decision must explicitly land the `active`
    field. At HEAD `63e6a9b` the registries are empty so this is
    untestable in practice.
- **Rationale.** Allows soft-retirement of assets/forms without
  immediate content edits. Lower priority than not-found.

### 5.4 `download-asset-ref-duplicate` (intra-post)

- **Condition.** Within a single post's `assetRefs[]`, two items
  trim-equal each other (and both are strings with `trim() !== ''`).
- **Severity.** warning.
- **Mutual exclusion.** Per array: only the **second and subsequent**
  duplicates fire. Index 0 (the first occurrence) does NOT fire.
- **Dependencies.** None on the registry; this is an
  intra-frontmatter rule and could legitimately live alongside the
  §3.2 shape rules. It is grouped here because the intended
  rationale ("don't reference the same asset twice in a download
  page") makes most sense when registry semantics are in scope.
- **Rationale.** Catches authoring mistakes when copy-pasting asset
  ids.
- **Note.** This rule is **not** the same as
  `download-registry-duplicate-key` (§3.4), which detects duplicate
  registry entries. The same `assetId` cannot occur twice in the
  registry; that is enforced. The rule here covers duplicate
  **references** from a single post.

### 5.5 Coexistence rules

Several plausible coexistence checks across `download.fileUrl` /
`download.assetRefs` / `download.formRef`. None of these have a
single obvious "correct" semantics — each must be decided by the user
in a separate decision preanalysis before implementation.

Candidate behaviors:

- `download-coexistence-fileurl-and-asset-refs`: warn when a single
  post sets **both** a non-empty `fileUrl` and a non-empty
  `assetRefs` array.
  - Rationale: post is ambiguous to the renderer (which to display?).
  - Risk: every legacy `fileUrl`-only post that gets a registry
    `assetRefs` would temporarily double-up during migration.
- `download-assetrefs-empty-array`: warn when `assetRefs: []` AND
  `download.enabled: true` AND no `fileUrl`.
  - Rationale: declared download with no source.
- `download-formref-without-target`: warn when `formRef` is set but
  `download.enabled !== true`.
  - Rationale: orphan formRef.
- Several more permutations possible.

This preanalysis recommends **not** designing coexistence rules in
the first registry-aware phase. They should be deferred to a
dedicated coexistence preanalysis after not-found/inactive are
stable. See §9 R6.

### 5.6 Preview-risk-via-registry (deferred)

The pm-20 §4 R1 governance line specifies that registry-derived
preview-risk validation (e.g. "this `fileUrl` looks like a private
Drive link") is dormant pending pm-26 unblock. **This phase does
not plan that rule.** Recording for traceability only.

### 5.7 Out-of-scope candidates (recorded but rejected)

- ❌ "Unknown field in registry entry" warning — too noisy without
  a schema lock; defer to a schema-lock phase.
- ❌ "Registry entry references unknown asset/form on another
  registry" — there is no cross-registry foreign-key relationship
  in the current schema decision.
- ❌ Error-severity promotions — none of the candidates should be
  errors in the first registry-aware phase (project policy: never
  block build on content shape; CLAUDE.md §13 / §27).

---

## 6. Rule Ordering and Mutual Exclusion

### 6.1 Per-post-`formRef` decision tree (final, after not-found / inactive land)

```text
download.formRef === undefined
  → no rule fires; no registry lookup

download.formRef is non-string
  → download-form-ref-invalid-type
  → STOP (no further rules)

download.formRef is string && trim() === ''
  → download-form-ref-empty
  → STOP

else (trimmed non-empty string)
  if download-registry-invalid-shape fired for downloadForms
    → skip; no further rules
  else if no registry entry with matching formId.trim()
    → download-form-ref-not-found
    → STOP
  else if registry entry active === false
    → download-form-ref-inactive
    → STOP
  else
    → no warning
```

### 6.2 Per-index `assetRefs[i]` decision tree

```text
assetRefs === undefined
  → no rule fires

assetRefs is non-array
  → download-asset-refs-invalid-type
  → STOP (no per-item loop)

assetRefs is array
  for each i in assetRefs:
    if assetRefs[i] is non-string
      → download-asset-ref-invalid-type
      → next i
    else if assetRefs[i].trim() === ''
      → download-asset-ref-empty
      → next i
    else
      if download-registry-invalid-shape fired for downloadAssets
        → skip registry-aware checks for this index
      else if no registry entry with matching assetId.trim()
        → download-asset-ref-not-found
        → next i
      else if registry entry active === false
        → download-asset-ref-inactive
        → next i
      else
        → no per-index warning

  // array-level duplicate check (independent of per-item rules)
  trimEqual(assetRefs[i], assetRefs[j]) for any i < j, both strings, both non-empty
    → download-asset-ref-duplicate fires on index j (the later one)
    → at most one warning per duplicate key; first occurrence not flagged
```

### 6.3 Mutual exclusion summary

| Pair                                                                | Exclusive? | Notes                                            |
| ------------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| `download-form-ref-invalid-type` ↔ `download-form-ref-empty`        | yes        | type-disjoint conditions                         |
| `download-form-ref-empty` ↔ `download-form-ref-not-found`           | yes        | only one runs after the shape gate              |
| `download-form-ref-not-found` ↔ `download-form-ref-inactive`        | yes        | not-found short-circuits inactive               |
| `download-asset-ref-invalid-type` ↔ `download-asset-ref-empty`      | yes (per i)| same gate as formRef                            |
| `download-asset-ref-empty` ↔ `download-asset-ref-not-found`         | yes (per i)| same gate                                       |
| `download-asset-ref-not-found` ↔ `download-asset-ref-inactive`      | yes (per i)| same gate                                       |
| `download-asset-ref-duplicate` ↔ any other `download-asset-*`       | NO         | duplicate is an array-level rule and may co-occur with per-item rules on different indices |
| `download-registry-invalid-shape` ↔ all registry-aware rules        | yes        | shape failure short-circuits all registry-aware lookup for that registry |
| `download-registry-duplicate-key` ↔ any registry-aware rule         | NO         | duplicate-key fires on the registry independently; aware rules continue (with whichever entry won the key, see §8.4) |

### 6.4 Why this ordering

- **Shape-first.** Frontmatter shape rules (invalid-type, empty) come
  before registry-aware rules. This is consistent with the design
  decided in
  `docs/20260602-download-form-ref-empty-policy-preanalysis.md` §4.2
  and §9: the registry lookup contract is "trimmed non-empty string."
- **Registry-shape-first.** Registry shape rules
  (`download-registry-invalid-shape`) gate **all** registry-aware
  rules for that registry. If `downloadForms` is malformed, no
  form-ref-not-found / form-ref-inactive fires on any post — those
  warnings would be unhelpful noise on top of the registry-shape
  warning.
- **Not-found before inactive.** A reference that doesn't exist can't
  be inactive; not-found short-circuits inactive.
- **Duplicate is orthogonal.** Duplicate is an array-property
  warning, not a per-index warning. It composes additively with
  per-index rules; this is intentional and consistent with the
  existing `related-links-entry-*` family.

---

## 7. Fixture Strategy

No fixtures are created in this phase. This section specifies the
**future** fixture plan so that a downstream implementation phase has
a stable target.

### 7.1 Per-rule fixture plan (planned, not landed)

| Rule                              | Fixture filename(s)                                                                            | Expected single warning                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `download-asset-ref-not-found`    | `_test-download-asset-ref-not-found.md`                                                        | `download-asset-ref-not-found`           |
| `download-form-ref-not-found`     | `_test-download-form-ref-not-found.md`                                                         | `download-form-ref-not-found`            |
| `download-asset-ref-inactive`    | `_test-download-asset-ref-inactive.md` (requires non-empty registry — see §7.3)                | `download-asset-ref-inactive`            |
| `download-form-ref-inactive`     | `_test-download-form-ref-inactive.md` (requires non-empty registry — see §7.3)                 | `download-form-ref-inactive`             |
| `download-asset-ref-duplicate`    | `_test-download-asset-ref-duplicate-intra-post.md`                                             | `download-asset-ref-duplicate`           |
| (mixed valid/invalid refs)        | `_test-download-asset-refs-mixed-valid-and-not-found.md` (optional, audit-only)                | one valid pass + one `*-not-found`       |
| (coexistence, future)             | `_test-download-coexistence-fileurl-and-asset-refs.md` etc.                                    | TBD per coexistence preanalysis          |

Each fixture follows the existing fixture discipline:

- `status: "ready"`, `draft: false`
- `contentKind: "download"`, `site: "blogger"`,
  `primaryPlatform: "blogger"`
- `category: "download"`, `tags: ["book"]`
- valid cover, valid `fileUrl`, `seo.indexing: "noindex-follow"`
- exactly one rule must fire (except the optional mixed fixture in
  §7.1 which intentionally asserts a multi-index decision tree)

### 7.2 Estimated baseline movement (per phase, planned)

The numbers below are **estimates only**, not commitments. The real
movement must be re-verified in each future implementation phase and
treated as a stop signal if it deviates.

| Implementation phase | Rules landed              | Fixtures added | Estimated `Δposts` | Estimated `Δwarnings` |
| -------------------- | ------------------------- | -------------- | ------------------ | --------------------- |
| R2 (not-found only)  | 2 (asset + form not-found)| 2              | +2                 | +2                    |
| R4 (inactive)        | 2 (asset + form inactive) | 2              | +2                 | +2                    |
| R5 (duplicate)       | 1 (intra-post duplicate)  | 1              | +1                 | +1                    |
| R6 (coexistence)     | TBD                       | TBD            | TBD                | TBD                   |

Starting baseline for R2: `0 / 55 / 50`.
End baseline after R5 (no coexistence): `0 / 60 / 55` (estimated).

### 7.3 Registry data for fixtures

The most subtle design question: how do fixtures referencing
"inactive" or "duplicate" registry entries actually populate the
registry? Two strategies:

- **Strategy X — populate the production registry with a small,
  documented test fixture set.** Simple to implement; visible to all
  consumers (Admin picker / renderer / build) once those are
  connected. Pollutes the production surface with rows that exist
  only for validator coverage.
- **Strategy Y — introduce a fixture-scoped registry override.**
  Complex; requires the loader to accept an override path or the
  validator to accept injected registry data. No existing
  infrastructure supports this; would be a meaningful loader change
  not in scope.

This preanalysis **defers** the strategy decision to the R4 phase
(inactive). R2 (not-found) does not need registry entries — by
definition, it tests the case where the registry does **not**
contain the reference, which is exactly the current empty-registry
state.

This is one reason R2 is recommended as the first implementation
phase: it requires no registry mutation and no strategy decision.

### 7.4 Fixture-rule isolation

Per the established discipline
(`docs/20260601-download-content-reference-fixture-creation-preflight.md`
§4 et al.), each fixture must isolate exactly one rule unless it is
intentionally designed to exercise a multi-rule decision tree (in
which case the expected multi-rule set must be enumerated in the
fixture's own header comment block and verified bit-for-bit in the
implementation phase).

### 7.5 Production content unchanged

No production post under `content/blogger/posts/` or
`content/github/posts/` is modified, migrated, or added in any of
the planned R-phases. Production downloads continue to use
`download.fileUrl` only. The `assetRefs[]` / `formRef` reference
model remains adopted by **fixtures only** until a separate
production-migration phase is explicitly authorized.

---

## 8. Risk Analysis

### 8.1 Baseline warnings/posts growth risk

After R2 + R4 + R5 the baseline is estimated to grow from
`0 / 55 / 50` to `0 / 60 / 55`. This is a `+5 warnings / +5 posts`
movement spread across three phases. Each implementation phase has a
stop signal: if `Δwarnings ≠ planned`, the phase aborts before
commit.

Mitigation: each phase explicitly states its expected delta and
verifies before-commit.

### 8.2 Fixture warning interference

Risk: a new fixture inadvertently triggers an unrelated warning
(e.g. forgets `cover` and triggers `cover-missing`). Historical
incidents have happened in earlier fixture batches; the mitigation
is a strict fixture template (per `docs/20260601-download-content-reference-fixture-creation-preflight.md`)
that pre-fills all known interference-prone fields.

Mitigation: future R2 preflight phase MUST verify the exact warning
count of each new fixture in isolation before commit (single-file
validate sweep before the registry-aware code lands).

### 8.3 Registry loader fallback false-negative risk

`readJsonOptional` silently returns the empty fallback on file
missing / parse error. A future R2 phase running on a system where
the registry has been **accidentally deleted** would see "every
fixture's reference is not-found," but so would every production
post that uses `assetRefs[]`. The current production-post count of
`assetRefs[]` usage is **zero**, so the production fallout in the
near term is bounded.

Mitigation:

- Production posts using `assetRefs[]` MUST NOT be introduced until
  the registry-aware rule is stable. (This phase reaffirms that
  rule; see §10 non-goals.)
- A future preanalysis may consider promoting the registry-missing
  case to its own rule (`download-registry-missing`) or hardening
  loader to fail-fast on missing-but-required-by-validator. Not
  decided here.

### 8.4 Registry-duplicate-key interaction with not-found

When `download-registry-duplicate-key` fires, the registry has two
entries with the same key. The registry-aware lookup must still
deterministically resolve "is X found?" The simplest contract:
"found" = "at least one registry entry's `assetId.trim()` equals
the reference." This is the natural interpretation of
`Array.prototype.some` and matches user expectation. Inactive
becomes ambiguous (which entry's `active` field wins?) — the
recommended contract is "if **any** matching entry is active, treat
as active; otherwise inactive." Both interpretations must be
specified in the R2/R4 implementation preanalyses.

### 8.5 Production content being newly flagged

If a production post somehow already contains `assetRefs[]` /
`formRef` (it should not), then R2 would generate new warnings on
production posts. This phase's §2 baseline check confirms no
production post contributes a download warning today; any change
to that fact between phases is a stop signal.

Mitigation: before R2 implementation, re-verify baseline `0 / 55 /
50` and re-verify per-rule contribution (production posts only
contribute non-download warnings).

### 8.6 Rule naming consistency

The naming pattern `download-<field>-<failure>` is enforced by the
existing rules (per §3.1 / §3.2 / §3.4). All candidate rules in §5
follow this pattern. Mitigation: implementation preanalyses must
explicitly cross-check naming against the existing five
`download-asset-*` / `download-form-ref-*` rules to avoid drift.

### 8.7 Coupling with future Admin picker / renderer / landing page

A registry-aware validator does **not** require an Admin picker or
renderer. The validator and the renderer are independent consumers
of the same registry. However:

- If the renderer / landing page is built first, the renderer might
  silently tolerate not-found references (skip rendering). This is
  the opposite of the validator policy (warn loudly). The two
  policies are compatible — they target different stages — but
  the implementation must document the intentional split.
- If Admin picker is built first, the picker would prevent
  not-found references from being authored in the first place,
  reducing the value of the validator rule. The validator rule is
  still useful as a defense-in-depth check against direct .md edits.

Mitigation: §5 candidate rules and §9 R-phases are independent of
renderer / Admin scheduling. The validator phases do not block,
and are not blocked by, renderer or Admin phases.

### 8.8 Reverse UTM and pm-26 boundary

None of the candidates in §5 depend on, or interact with, reverse
UTM, `pm-26`, Admin Apply, middleware write routes, or
`admin-write-cli`. Those remain dormant per CLAUDE.md §3.2 and §16.4.

This phase, and all planned R-phases, explicitly do **not** unblock
any of those workstreams.

---

## 9. Recommended Phase Plan

Conservative phased plan (one rule family per phase, smallest deltas
first). Each phase requires explicit user authorization to start;
none auto-starts from this preanalysis.

### R1 — Registry-aware source preflight (docs-only, read-only)

- Output: one new preflight doc.
- Verifies: source state in `src/scripts/validate-content.js`, current
  baseline, candidate rule list (this document), and exact
  insertion site for the future code in the Option 6 block.
- Touches: docs only.
- Baseline impact: none.
- Recommended only if some non-trivial source-shape question arises
  between this preanalysis and R2; otherwise R1 may be skipped.

### R2 — `not-found` rules only (source + fixtures)

- Output: source change implementing `download-asset-ref-not-found`
  and `download-form-ref-not-found`; two fixtures.
- Touches: `src/scripts/validate-content.js`, two new fixture
  files.
- Baseline impact (estimated): `+2 posts / +2 warnings`.
- Why R2 first: requires **no** registry mutation; the empty
  registry is the test data.

### R3 — Read-only acceptance cross-check (docs-only)

- Output: one new acceptance doc verifying R2 landed correctly.
- Touches: docs only.
- Baseline impact: none.

### R4 — `inactive` rules + registry data strategy decision

- Output: registry data strategy decision (Strategy X vs Y from
  §7.3) **as a separate decision preanalysis**, followed by source
  change implementing `download-asset-ref-inactive` /
  `download-form-ref-inactive`, plus two fixtures plus optional
  registry seed entries.
- Touches: `src/scripts/validate-content.js`, two new fixture
  files, possibly the registry JSONs.
- Baseline impact (estimated): `+2 posts / +2 warnings` from
  fixtures.
- **Should be split into two phases** in practice: R4a (decision)
  and R4b (implementation), so that the strategy decision is
  pinned down before any code lands.

### R5 — `download-asset-ref-duplicate` (intra-post)

- Output: source change implementing
  `download-asset-ref-duplicate`; one fixture.
- Touches: `src/scripts/validate-content.js`, one new fixture.
- Baseline impact (estimated): `+1 post / +1 warning`.
- Independent of registry data; could in principle land before R4.

### R6 — Coexistence rules (separate decision preanalysis required)

- Pre-step: dedicated coexistence preanalysis to decide which
  permutations (`fileUrl` + `assetRefs`, `assetRefs: []` while
  `enabled`, `formRef` without `enabled`, etc.) should warn.
- Then a separate implementation phase.
- Not planned in this document beyond candidate listing.

### Alternative ordering (rejected)

- ❌ Land all five candidates in one phase. Rejected: too much in
  one diff; baseline drift becomes hard to attribute when it
  deviates.
- ❌ Land inactive before not-found. Rejected: inactive is
  semantically downstream of not-found (must exist before inactive
  matters) and requires registry data that not-found does not.
- ❌ Land duplicate first. Tolerable, but not-found-first preserves
  the natural per-index decision-tree ordering and is the more
  visible reader-facing rule.

### Phase exit criteria (shared by R2 / R4 / R5)

Each implementation phase MUST:

- Verify baseline before any source edit.
- Verify baseline movement after source + fixtures together.
- Have a single commit that bundles source + fixtures (per the
  established Option 6 / Option A precedent in
  `docs/20260602-download-form-ref-empty-policy-preanalysis.md` §8.5).
- Be followed by a docs-only acceptance cross-check phase before
  the next R-phase opens.

---

## 10. Explicit Non-goals

This phase (the docs-only preanalysis) does **not**:

- ❌ Add or modify any rule in `src/scripts/validate-content.js`.
- ❌ Add or modify any fixture under
  `content/validation-fixtures/`.
- ❌ Modify `content/settings/download-assets.json` or
  `content/settings/download-forms.json` (registries stay empty).
- ❌ Modify `src/scripts/load-settings.js` or any other loader code.
- ❌ Modify any template in `src/views/` (no renderer wiring).
- ❌ Modify any Admin UI / picker / middleware / `admin-write-cli`.
- ❌ Modify `package.json` or any lockfile.
- ❌ Modify `CLAUDE.md` (the §3.2 drift recorded in §4.3 is
  documented but not patched).
- ❌ Run `npm run build`, `build:github`, `build:blogger`,
  `build:promotion`, `build:sitemap`, or `build:blogger-theme`.
- ❌ Mutate `gh-pages`; no deploy.
- ❌ Repost to Blogger; no Blogger HTML manual copy.
- ❌ Trigger any GA4 validation flow.
- ❌ Activate reverse UTM (Blogger → GitHub Pages remains dormant
  per CLAUDE.md §16.4).
- ❌ Unblock the `pm-26` deploy gate (remains BLOCKED).
- ❌ Run `admin-write-cli` dry-run or apply (remains dormant).
- ❌ Enable Admin Apply or any middleware write route (remain
  dormant per CLAUDE.md §3.2).
- ❌ Migrate any production post from `download.fileUrl` to
  `assetRefs[]` / `formRef`.
- ❌ Add new fixtures for production content migration.
- ❌ Schedule, poll, or self-start a follow-up phase.

This preanalysis does **not** confer authorization to begin R1 / R2
/ R3 / R4 / R5 / R6. Each requires the user's explicit next prompt.

---

## 11. Final Recommendation

**Recommendation: Final Idle Freeze / EXIT.**

This document is the planning artifact; the next move is the user's,
not the assistant's.

If R2 is approved as the next forward step:

- It MUST be opened as its own phase with its own preflight/preanalysis
  doc, explicitly bundling source + fixtures (no split).
- It MUST verify `0 / 55 / 50` baseline before any source edit.
- It MUST verify the planned `+2 / +2` movement after the change.
- It MUST NOT bundle inactive / duplicate / coexistence work.
- It MUST NOT touch registries (the empty registry IS the not-found
  fixture data).
- It MUST NOT unblock any of the dormant workstreams listed in §10.

If R2 is not the chosen next step, valid alternatives include:

- Defer further until other unrelated workstreams complete.
- Open a separate CLAUDE.md correction phase to fix the §3.2 drift
  recorded in §4.3 (docs-only).
- Open a separate registry data strategy decision phase ahead of R4
  if the user prefers to lock that contract before any not-found
  work.

Any other forward motion — Admin picker, renderer, landing page,
content migration, build, deploy, Blogger repost, GA4 validation,
reverse UTM activation, or `pm-26` unblock — remains explicitly
out of scope and is **not** authorized by this preanalysis.

---

## Appendix A — Cross-reference index

- Baseline freeze: `docs/20260602-download-form-ref-empty-checkpoint.md`
- Option A policy: `docs/20260602-download-form-ref-empty-policy-preanalysis.md`
- Option 6 fixture batch: `docs/20260601-download-content-reference-fixture-creation-preflight.md`
- Registry schema decision: `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
- Empty-registry implementation plan: `docs/20260531-download-empty-registry-implementation-plan.md`
- Remaining-rules note: `docs/20260601-download-validation-remaining-rules-preanalysis.md`
- S1/S2 merge decision: `docs/20260530-download-validation-s1-s2-merge-decision.md`
- Landing page direction: `docs/20260529-download-landing-page-settings-registry-direction-preanalysis.md`
- Governing policy: `CLAUDE.md` §3.2 (empty registry red lines),
  §13 (download rules), §27 (Claude Code modification rules).
- Source of truth: `src/scripts/validate-content.js` (lines 272–326
  registry rules; lines 530–595 fileUrl rules; lines 597–665
  assetRefs/formRef rules; lines 668–711 SEO interlock).
- Loader: `src/scripts/load-settings.js` (Phase 20260601-pm-11
  additive surface for `downloadAssets` / `downloadForms`).
