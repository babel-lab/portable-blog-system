# 2026-06-02 Download R5 Duplicate Rule Preanalysis

Phase name: `20260602-night-18-download-r5-duplicate-rule-preanalysis-docs-only-a`
Date: 2026-06-02 (night-18, 23:41 local)
Mode: docs-only preanalysis (no source / no fixture / no registry mutation / no loader / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM / no pm-26 unblock / no admin-write-cli / no Admin Apply)

---

## 1. Executive Summary

R4a (`docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`,
commit `d2b04ff`) recommended **Option A — keep registries empty; defer
inactive** as the primary path, and the R4b implementation readiness preflight
returned an immediate **NO-GO** because:

- registries remain empty (`assets: []` / `forms: []`);
- the candidate inactive rule (`download-asset-ref-inactive` /
  `download-form-ref-inactive`) is short-circuited by `*-not-found` against
  an empty registry — so the rule cannot fire and the fixture cannot be
  designed cleanly;
- Option C (test-only registry fixture override) would require a loader /
  validator architecture preanalysis that is itself out of R4b scope.

The next forward step that is **registry-independent** (does not require
registry data, does not require loader changes, does not break the
empty-registry invariant) is **R5 — intra-post duplicate validation** of
`download.assetRefs[]`. This phase is the docs-only preanalysis for that
rule. No source change, no fixture creation, no registry mutation is
performed.

This document records:

- The current accepted state at HEAD `d2b04ff`.
- The R5 candidate rule (`download-asset-ref-duplicate`), its scope and
  exclusions.
- A duplicate-semantics decision (trim, case sensitivity, item-type
  participation).
- An ordering / mutual exclusion analysis vis-à-vis the R2 cascade
  (`invalid-type → empty → not-found`) and a warning-count strategy.
- A fixture strategy that respects the **empty-registry invariant**
  (no registry mutation), with explicit acknowledgement of the
  duplicate + not-found cascade cost.
- A minimal R5b implementation boundary proposal.
- Risks, recommended phase plan, explicit non-goals.

Output of this phase is exactly **one** new file:
`docs/20260602-download-r5-duplicate-rule-preanalysis.md`.

See also:

- `docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`
  (R4a — inactive strategy decision; precedes this phase and motivates
  the R4b NO-GO that surfaced R5 as the next registry-independent step)
- `docs/20260602-download-r2-not-found-checkpoint.md` (R2 freeze
  baseline; R5 builds on top of R2's `invalid-type → empty → not-found`
  cascade)
- `docs/20260602-download-registry-aware-validation-preanalysis.md`
  (R-series plan; the R5 candidate originated here as §5.4)
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
  (registry schema decision; R5 does not interact with the
  `download-registry-duplicate-key` registry-level rule, but the
  naming distinction matters — see §3.4 below)
- `docs/20260531-download-empty-registry-implementation-plan.md`
  (empty-registry landing plan; R5 preserves this invariant)
- CLAUDE.md §3.2 (registry red lines + current loader/validator state)
- CLAUDE.md §13 (download.fileUrl warning policy)

---

## 2. Current Accepted State

Baseline confirmed at start of this phase (2026-06-02 23:41 local):

- repo path: `D:\github\blog-new\portable-blog-system`
- branch: `main`
- HEAD: `d2b04ffa2373211a7c3145efb56b9f131b6e7e98` (short `d2b04ff`)
- HEAD == `origin/main`: yes (ahead/behind 0/0)
- working tree clean
- latest commit subject: `docs(download): decide inactive registry strategy`
- `npm run validate:content` → **0 errors / 57 warnings / 52 posts**

Recent commit chain (top of this phase window, most recent first):

```text
d2b04ff docs(download): decide inactive registry strategy
7e513e8 docs(download): record r2 not-found checkpoint
145a548 feat(download): validate ref not-found against registry
53a2a73 docs(claude): clarify download registry state
53c691e docs(download): plan registry-aware validation
```

### 2.1 What is implemented and accepted

The download validator surface at HEAD `d2b04ff` includes the following
rules (all warning-only):

**Frontmatter `download.fileUrl` shape (D1 / D2 / D3):**

| Rule id                            | Condition                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `download-fileurl-invalid-type`    | `download.fileUrl` is set and not a string                                                  |
| `download-enabled-fileurl-empty`   | `contentKind === 'download' && download.enabled === true` and `fileUrl` missing/empty       |
| `download-fileurl-invalid-format`  | `download.fileUrl` is a non-empty string but does not match `^https?://`                    |

**SEO interlock:**

| Rule id                              | Condition                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `download-content-should-be-noindex` | `contentKind === 'download'` and `seo.indexing ∉ { 'noindex-follow', 'noindex-nofollow' }` and D1/D2/D3 did not fire |

**Frontmatter `assetRefs` / `formRef` shape (Option 6 + Option A):**

| Rule id                              | Condition                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `download-asset-refs-invalid-type`   | `assetRefs !== undefined && !Array.isArray(assetRefs)`                                              |
| `download-asset-ref-invalid-type`    | `assetRefs` is array, item is not string                                                            |
| `download-asset-ref-empty`           | `assetRefs` is array, item is string, `item.trim() === ''`                                          |
| `download-form-ref-invalid-type`     | `formRef !== undefined && typeof formRef !== 'string'`                                              |
| `download-form-ref-empty`            | `typeof formRef === 'string' && formRef.trim() === ''`                                              |

**Registry-level (R2-shape):**

| Rule id                              | Condition                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `download-registry-invalid-shape`    | `downloadAssets`/`downloadForms` is not a plain object, or `assets`/`forms` is not an array        |
| `download-registry-duplicate-key`    | Same `assetId` (or `formId`), after `trim`, appears ≥ 2 times in the registry array                |

**R2 — Registry-aware content reference not-found (landed Phase 20260602-night-9, commit `145a548`):**

| Rule id                              | Condition                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `download-asset-ref-not-found`       | `assetRefs[i]` is a trimmed non-empty string and no `downloadAssets.assets[].assetId.trim()` matches |
| `download-form-ref-not-found`        | `formRef` is a trimmed non-empty string and no `downloadForms.forms[].formId.trim()` matches        |

Both R2 rules use the `assetKeySet` / `formKeySet` returned by
`buildDownloadKeySet()`. If the registry shape is invalid, the key set is
`null` and the lookup is skipped (avoids cascade with
`download-registry-invalid-shape`).

### 2.2 What is NOT implemented yet

- ❌ `download-asset-ref-inactive` / `download-form-ref-inactive`
  (R4b — NO-GO per R4a Option A recommendation + R4b preflight findings).
- ❌ `download-asset-ref-duplicate` (R5 — **this preanalysis plans it**;
  no source yet).
- ❌ Coexistence rules (R6 — `download.fileUrl` vs `assetRefs` vs
  `formRef` interactions).
- ❌ Admin picker, renderer, landing page, content migration.
- ❌ Loader extension beyond the additive read-only surface for the two
  registries.

### 2.3 Empty-registry state preserved

```json
content/settings/download-assets.json
{ "schemaVersion": 1, "updatedAt": "", "assets": [], "notes": "" }

content/settings/download-forms.json
{ "schemaVersion": 1, "updatedAt": "", "forms":  [], "notes": "" }
```

Both registries are unchanged since commit `466e471`. R2 did not seed any
entries. R4a recommended preserving this state. R5 does not require any
mutation (this is precisely why R5 is the recommended next step).

### 2.4 Production posts unaffected

A repository-wide grep for `assetRefs|formRef` under both
`content/blogger/posts/` and `content/github/posts/` returns **zero
matches**. Production downloads continue to use `download.fileUrl` only.
This means:

- R5, when eventually implemented, can only fire on fixtures under
  `content/validation-fixtures/`. The production-post warning count is
  guaranteed not to move under R5.
- Any later production migration to `assetRefs[]` / `formRef` is a
  separate, explicitly-authorized phase. Until that migration, R5 is
  fixture-only coverage.

### 2.5 Why R5 is the chosen next step (over R4b retry / R6 / Admin / renderer)

- **Independent of registry data.** Duplicate detection is a
  frontmatter-only computation over a single post's `assetRefs` array.
  It does not need any registry entry.
- **Independent of loader changes.** No new loader surface is needed.
- **Independent of `download-registry-duplicate-key`.** That rule
  detects duplicate **registry entries**; this rule detects duplicate
  **references from a single post**. The two are orthogonal — registry
  duplicate-key checks the registry; intra-post duplicate checks the
  post's frontmatter. Both can exist without interfering.
- **Composes with R2 without contradiction.** R5 is array-level and
  does not displace the existing per-index cascade
  (`invalid-type → invalid-type(item) → empty → not-found`).
- **Acceptably small.** Single rule, single fixture, single commit
  (per the established Option 6 / Option A precedent that R2 followed
  at commit `145a548`).

---

## 3. R5 Duplicate Rule Candidate

### 3.1 Recommended rule id

`download-asset-ref-duplicate`

Naming rationale:

- Continues the existing `download-asset-ref-*` family (consistent
  with `download-asset-ref-invalid-type`, `download-asset-ref-empty`,
  `download-asset-ref-not-found`).
- Distinct from `download-registry-duplicate-key` (registry-level
  rule), preventing reader confusion. The user-facing distinction is:
  - `download-registry-duplicate-key` — registry has two entries with
    the same key (deduplicate the registry).
  - `download-asset-ref-duplicate` — a single post's `assetRefs[]`
    contains the same ref twice (deduplicate the post's array).
- No conflict with the rejected `download-asset-ref-inactive` rule
  (R4b NO-GO).

### 3.2 Severity

**warning** (consistent with the rest of the download family and with
project policy that download rules never block build).

### 3.3 Target field

**`download.assetRefs[]` only.** `download.formRef` is a single value;
it cannot duplicate against itself. There is no
`download-form-ref-duplicate` candidate.

### 3.4 Scope and exclusions

R5 is **intra-post only**. Specifically:

- ✅ Detects: same ref appearing twice or more inside a single post's
  `download.assetRefs[]` array.
- ❌ Does NOT detect: same ref appearing in two different posts'
  `assetRefs[]` arrays. Cross-post duplicate is a different concern
  with no obvious authoring failure mode (it is legitimate for two
  posts to share an asset).
- ❌ Does NOT detect: duplicate entries inside the registry
  (`assets[].assetId` repeated). That is already covered by
  `download-registry-duplicate-key`.
- ❌ Does NOT detect: duplicate `formRef` across the registry. Not
  applicable to a single-value field.
- ❌ Does NOT check inactive status. R4b is NO-GO.
- ❌ Does NOT check coexistence with `fileUrl`. That is R6.
- ❌ Does NOT modify the registry. Empty-registry invariant preserved.
- ❌ Does NOT introduce error severity.
- ❌ Does NOT introduce build-time blocking.

### 3.5 Conceptual condition (semantics decided in §4)

Within a single post's `download.assetRefs` array:

- Two or more **non-empty string** items, after `trim()`, are equal.

The full decision tree, including ordering against existing R2 rules
and the warning-count strategy, is in §5.

---

## 4. Duplicate Semantics Decision

This section pins down the comparison semantics. All decisions below
apply only when the per-item shape gate (R2 cascade) has classified the
item as a non-empty trimmed string (see §5.1).

### 4.1 Trim before comparing — **YES**

Recommendation: `assetRefs[i].trim()` is the canonical key for both
duplicate detection and not-found lookup.

Rationale:

- Consistent with the R2 not-found rule, which already trims before
  comparing against the registry (per `validate-content.js` line 669
  branch: `assetKeySet.has(item.trim())`).
- Consistent with `download-registry-duplicate-key`, which trims
  before comparing registry keys (per `validateDownloadRegistry()`
  line 310).
- Treats `"abc"` and `"abc "` as the same ref — which matches author
  intent if a stray trailing space slips in.
- Avoids surprising mismatches where a fixture appears to be
  "duplicate but not duplicate" because of invisible whitespace.

### 4.2 Empty / whitespace items — **EXCLUDED**

Items where `item.trim() === ''` are **not** candidates for duplicate
detection. They are already flagged by `download-asset-ref-empty` (see
§5.1 step C) and there is no useful semantic to "two empty strings are
duplicates."

This is enforced by the per-index cascade: empty items fire
`download-asset-ref-empty` and are NOT added to the duplicate-detection
working set.

### 4.3 Non-string items — **EXCLUDED**

Items where `typeof item !== 'string'` are **not** candidates for
duplicate detection. They are already flagged by
`download-asset-ref-invalid-type` (per `validate-content.js` line 653).

This is enforced by the per-index cascade in the same way as §4.2.

### 4.4 Case sensitivity — **CASE-SENSITIVE**

Recommendation: comparison is `===` after `trim()`. `"abc"` and `"ABC"`
are **different** refs.

Rationale:

- `assetId` in the registry is a kebab-case primary key (per
  `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
  §5). Kebab-case ids are conventionally lowercase, and the
  `download-registry-duplicate-key` rule uses case-sensitive
  comparison. If R5 used case-insensitive comparison, the validator
  would treat `"foo-bar"` and `"Foo-Bar"` as duplicates intra-post
  but the registry would treat them as distinct keys. That asymmetry
  is hard to reason about.
- Consistent with R2 not-found lookup, which uses `Set.has(trimmed)`
  on a `Set<string>` of trimmed registry keys — case-sensitive by
  default.
- Future migration risk: if a later phase decides to canonicalize
  registry keys to lowercase, the duplicate rule would automatically
  align (both sides lowercase). The reverse change (case-insensitive
  → case-sensitive) is harder.
- If authors typo a ref with the wrong case, R2 not-found already
  catches it (the wrong-case key won't match the registry). R5 does
  not need to also catch this; it would just double-warn.

### 4.5 Only non-empty string items participate

The intersection of §4.2 + §4.3 + §4.1 yields the duplicate-detection
working set per post:

```text
duplicateCandidates = assetRefs
  .filter(item => typeof item === 'string')
  .filter(item => item.trim() !== '')
  .map(item => item.trim())
```

Duplicate detection runs over this set. Non-string and empty items
are flagged by their own R2-cascade rule and silently dropped from
duplicate detection.

### 4.6 Recap

| Aspect                          | Recommendation     |
| ------------------------------- | ------------------ |
| Trim before compare             | yes                |
| Empty / whitespace items        | excluded           |
| Non-string items                | excluded           |
| Case sensitivity                | case-sensitive     |
| Comparison operator             | `===` after `trim` |

---

## 5. Ordering and Warning Count Strategy

### 5.1 Per-index cascade (unchanged by R5)

R5 does **not** modify the existing per-index cascade. For each index
`i` of `assetRefs`:

```text
A. if assetRefs is not an array
   → download-asset-refs-invalid-type
   → STOP (no per-item loop, no duplicate detection)

B. else for each i:
   if assetRefs[i] is non-string
     → download-asset-ref-invalid-type (item at i)
     → next i; item excluded from duplicate detection
   else if assetRefs[i].trim() === ''
     → download-asset-ref-empty (item at i)
     → next i; item excluded from duplicate detection
   else if assetKeySet !== null && !assetKeySet.has(assetRefs[i].trim())
     → download-asset-ref-not-found (item at i)
     → next i; item STILL participates in duplicate detection
   else
     → per-index rule passes; item participates in duplicate detection
```

### 5.2 Array-level duplicate pass (new in R5)

After the per-index cascade, R5 adds an **array-level pass** over
`duplicateCandidates` (per §4.5):

```text
seen = new Set()
duplicateKeys = new Set()
for trimmed in duplicateCandidates:
  if trimmed in seen:
    duplicateKeys.add(trimmed)
  else:
    seen.add(trimmed)

for key in duplicateKeys:
  emit download-asset-ref-duplicate(key)
```

This is the **per-key** counting strategy (see §5.4).

### 5.3 Mutual exclusion: orthogonal to per-index rules

**Recommended: orthogonal.** A single ref may simultaneously trigger
`download-asset-ref-not-found` (per index) AND
`download-asset-ref-duplicate` (per array). They flag different
authoring failures:

- `not-found` says "this ref does not match any registry entry."
- `duplicate` says "this ref appears twice in your array."

Both are independently true and useful. Suppressing one because the
other fires would lose information.

Rationale:

- Matches the design committed in
  `docs/20260602-download-registry-aware-validation-preanalysis.md`
  §6.2 and §6.3 ("duplicate is an array-level rule and may co-occur
  with per-item rules on different indices").
- Avoids special-case logic that couples the per-item loop to the
  array-level pass. Each pass can read frontmatter independently.
- Matches the existing pattern used by the `related-links-*` family,
  where array-level checks and per-entry checks run independently.

**Rejected alternatives:**

- **Suppress duplicate when not-found fires for the same key.**
  Would mean `["a", "a"]` against an empty registry produces only 2×
  `not-found` and no `duplicate` warning. The author then sees
  "two not-found warnings on the same id" and must mentally
  reconstruct that the array is also duplicated. Loses information;
  rejected.
- **Suppress not-found on duplicate items beyond the first
  occurrence.** Would mean `["a", "a"]` against an empty registry
  produces only 1× `not-found` (index 0) and 1× `duplicate`
  (index 1). Lower noise, but introduces ordering coupling between
  per-index cascade and array-level pass — the per-index loop would
  need to know which indices have been "absorbed" by the duplicate
  rule. Possible but adds non-trivial code; not recommended for
  first R5 implementation. May be revisited if real noise becomes a
  problem.
- **Suppress duplicate when invalid-type or empty fires.** Already
  enforced by §4 (non-string and empty items are excluded from the
  duplicate working set). This is not really a separate suppression;
  it is just the natural consequence of the §4.5 filter.

### 5.4 Warning count strategy — **per-key (1 warning per duplicated key)**

For an input like `assetRefs: ["a", "a", "a"]`:

- **Per-key (recommended).** Emit **one** `download-asset-ref-duplicate`
  warning naming key `"a"`. The warning value SHOULD include the
  duplicate indexes (e.g. `assetRefs[0,1,2]="a"` or equivalent) so the
  author can locate every occurrence.
- **Per-occurrence-beyond-first (rejected).** Emit one warning per
  duplicate occurrence (indexes 1 and 2 in the example, two warnings
  total). Grows linearly with the number of duplicates; high noise
  for pathological cases.
- **Per-occurrence-including-first (rejected).** Emit one warning per
  occurrence (three warnings in the example). Even noisier; harder
  to reason about because the "first" occurrence is also flagged
  alongside the duplicates.

Recommendation: **per-key**, with the value string carrying the
duplicate indexes for traceability.

Example value strings (for the rule's `value` field):

- `assetRefs[0,1]="duplicate-id"` (two-occurrence case)
- `assetRefs[0,2,4]="duplicate-id"` (three-occurrence non-contiguous case)
- `assetRefs[1,3]="trimmed-id" (after trim)` if a trim normalization
  surfaced the duplicate that raw comparison would miss. (Optional;
  may be deferred to the implementation phase.)

The exact value-string format is an implementation detail that the
R5b phase fixes; this preanalysis pins only the semantic ("include
indexes of every occurrence").

### 5.5 Cascade summary after R5b lands

```text
download.assetRefs:
  per-index   : invalid-type(array) → invalid-type(item) → empty → not-found
  array-level : duplicate (per key; orthogonal to per-index rules)

download.formRef:
  per-post    : invalid-type → empty → not-found
  no duplicate rule (single-value field)
```

### 5.6 Mutual exclusion matrix (post-R5b)

| Pair                                                                | Exclusive? | Notes                                                  |
| ------------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `download-asset-refs-invalid-type` ↔ `download-asset-ref-duplicate` | yes        | array-level shape failure short-circuits per-index loop AND array-level duplicate pass |
| `download-asset-ref-invalid-type` ↔ `download-asset-ref-duplicate`  | per index  | non-string item excluded from duplicate working set; other indices may still duplicate |
| `download-asset-ref-empty` ↔ `download-asset-ref-duplicate`         | per index  | empty item excluded from duplicate working set; other indices may still duplicate |
| `download-asset-ref-not-found` ↔ `download-asset-ref-duplicate`     | **NO**     | both may fire on the same key (orthogonal; see §5.3)   |
| `download-registry-duplicate-key` ↔ `download-asset-ref-duplicate`  | NO         | different rules at different levels; independent       |
| `download-registry-invalid-shape` ↔ `download-asset-ref-duplicate`  | NO         | registry shape failure does not gate intra-post duplicate detection (R5 does not read the registry) |

---

## 6. Fixture Strategy

This preanalysis **does not** create any fixture. This section plans
fixtures so that R5b has a stable target.

### 6.1 Planned fixture

One fixture is needed for R5b:

- `content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md`
  - `assetRefs: ["duplicate-asset-id", "duplicate-asset-id"]`
  - `download.fileUrl`: valid `https://` URL (avoid D1 / D2 / D3 noise)
  - `seo.indexing: "noindex-follow"` (avoid the SEO interlock rule)
  - `status: "ready"`, `draft: false`
  - `contentKind: "download"`, `site: "blogger"`, `primaryPlatform: "blogger"`
  - All other interference-prone fields populated per the established
    fixture template (per
    `docs/20260601-download-content-reference-fixture-creation-preflight.md`).

### 6.2 The empty-registry cascade problem

With the empty-registry invariant preserved (per §2.3), the fixture
`assetRefs: ["duplicate-asset-id", "duplicate-asset-id"]` will fire
**three** warnings, not one:

1. `download-asset-ref-not-found` on `assetRefs[0]` (R2 not-found)
2. `download-asset-ref-not-found` on `assetRefs[1]` (R2 not-found)
3. `download-asset-ref-duplicate` for key `"duplicate-asset-id"` (R5)

This is the direct consequence of the §5.3 orthogonal-design choice
plus the empty-registry invariant: every non-empty string ref must
not-found (because the registry has no entries), and the duplicate
rule emits independently.

### 6.3 Strategy options evaluated

| Strategy                                                                                                                                                                          | Pros                                                                                       | Cons                                                                                                       | Verdict        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------- |
| **S1.** Accept the 3-warning fixture (duplicate + 2 not-found). Document expected multi-rule warnings in the fixture header.                                                       | No registry mutation. No loader change. Simplest R5 source. Matches §5.3 orthogonal design. | Fixture warning count higher (3 vs 1). Movement estimate is +1 post / +3 warnings.                          | **Recommended** |
| **S2.** Re-design R5 source so duplicate items beyond the first do not emit `not-found`. Lower fixture noise.                                                                      | Fixture would produce 2 warnings (1 not-found + 1 duplicate).                              | Introduces per-index / array-level coupling. Diverges from §5.3 orthogonal recommendation. More code.       | Defer          |
| **S3.** Seed the registry with `"duplicate-asset-id"` so not-found does not fire. Fixture produces 1 warning (only duplicate).                                                     | Cleanest single-warning fixture.                                                           | **Breaks the empty-registry invariant.** Same R4a Option B objection. Requires explicit user authorization. | Reject         |
| **S4.** Introduce a fixture-only registry override (Option C from R4a §4.3). Fixture against override produces 1 warning.                                                          | Cleanest fixture; preserves production registry.                                            | Requires loader / validator extension preanalysis FIRST. Out of R5b scope.                                  | Defer          |
| **S5.** Defer R5 entirely until either S3 or S4 becomes feasible.                                                                                                                  | No baseline movement now.                                                                  | R5 remains unimplemented; duplicate authoring mistakes silently shipped.                                     | Reject         |

**Recommendation: S1** — accept the multi-rule fixture, with the
expected three warnings documented in the fixture header.

Rationale:

- **Preserves empty-registry invariant** (per CLAUDE.md §3.2 red
  lines + R4a recommendation + R4b NO-GO).
- **No loader changes** required.
- **Smallest R5 implementation diff** (single rule, single fixture,
  single commit).
- **Matches §5.3 orthogonal design.** Three warnings are
  *correct* — the fixture truly has two not-found refs AND a
  duplicate. Suppressing any of them would be a lie.
- **Aligns with existing multi-rule fixture precedent.** Some
  fixtures already intentionally exercise multi-rule paths (e.g.
  fixtures whose header explicitly lists the expected set of
  warnings); R5b would document the same way.
- **Cheap to reverse.** If S4 lands later (fixture-only registry
  override), the R5 fixture can be repointed at the override and
  the cascade trimmed to 1 warning — no rule rewrite needed.

### 6.4 Predicted baseline movement under S1

| Fixture                                              | New posts | New warnings |
| ---------------------------------------------------- | --------- | ------------ |
| `_test-download-asset-ref-duplicate.md` (3-warning) | +1        | +3           |

Baseline movement: `0 / 57 / 52` → `0 / 60 / 53`.

If the eventual measurement diverges from this prediction (e.g.
`0 / 59 / 53` or `0 / 61 / 53`), R5b MUST stop before commit. The
prediction is the stop signal.

### 6.5 Predicted baseline movement under rejected strategies (for record)

- **S2 (suppress not-found on dup items):** `0 / 57 / 52` →
  `0 / 59 / 53`. Cleaner but adds source coupling.
- **S3 (seed registry):** `0 / 57 / 52` → `0 / 58 / 53`. Cleanest
  but breaks empty-registry invariant.
- **S4 (fixture-only registry override):** `0 / 57 / 52` →
  `0 / 58 / 53`. Cleanest and preserves invariant but requires
  loader / validator preanalysis FIRST.
- **S5 (defer):** baseline unchanged.

### 6.6 Fixture isolation discipline

The R5b fixture is intentionally **multi-rule** but its expected
warning set is **fully enumerated** in the fixture header. Per the
established fixture isolation discipline (per
`docs/20260601-download-content-reference-fixture-creation-preflight.md`
§4), multi-rule fixtures are permitted when the rule set is exhaustive
and documented. The R5b fixture must list all three expected
warnings:

```text
Expected warnings:
  - download-asset-ref-not-found  (assetRefs[0]="duplicate-asset-id")
  - download-asset-ref-not-found  (assetRefs[1]="duplicate-asset-id")
  - download-asset-ref-duplicate  (key="duplicate-asset-id"; assetRefs[0,1])
```

R5b's acceptance step (`R5c`) must verify all three by exact match,
not just the count.

### 6.7 Production posts remain unchanged

Per §2.4, no production post uses `assetRefs` / `formRef`. R5b does
not modify any production post. The production warning contribution
from R5 is **zero**. Any future production migration to `assetRefs[]`
must verify it does not introduce duplicate refs (which R5 would then
correctly flag).

---

## 7. R5 Implementation Boundary Proposal

This section sketches what R5b would look like, **once** the user
authorizes the next phase. R5b is **not** authorized by this phase.

### 7.1 Scope

**In scope:**

- `src/scripts/validate-content.js`: add an array-level pass after
  the existing per-index loop for `assetRefs`. Emit
  `download-asset-ref-duplicate` warnings per duplicate key (per
  §5.4).
- 1 new fixture file:
  `content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md`
  (per §6.1).

**Out of scope:**

- ❌ `content/settings/download-assets.json` — registry stays empty.
- ❌ `content/settings/download-forms.json` — registry stays empty.
- ❌ `src/scripts/load-settings.js` — loader unchanged.
- ❌ Any template, renderer, EJS, SCSS, JavaScript module.
- ❌ Admin picker, middleware, `admin-write-cli`.
- ❌ CLAUDE.md — docs sync for R5 belongs to a separate R5d phase.
- ❌ Any other `docs/` file — implementation phase landings should
  not also rewrite the preanalysis.
- ❌ Build, deploy, Blogger repost, GA4 validation.
- ❌ Reverse UTM activation; `pm-26` unblock.
- ❌ Production content migration.
- ❌ Loader extension (would be a separate phase if pursued for
  Option C / S4).

### 7.2 Single-commit bundle

R5b SHOULD land source + fixture in a **single commit**, matching
the R2 precedent at commit `145a548`:

```text
feat(download): validate intra-post asset ref duplicate
  src/scripts/validate-content.js
  content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md
```

No registry JSON in this commit. No CLAUDE.md in this commit. No
other doc in this commit.

### 7.3 R5b should NOT touch the registry JSONs

This is the load-bearing invariant of the S1 strategy choice
(per §6.3). Any drift to non-S1 would require an explicit
authorization in the prompt that opens R5b.

### 7.4 R5b should NOT modify CLAUDE.md or this preanalysis

Following the R2 precedent (R2 landed source at `145a548`; CLAUDE.md
docs sync landed separately at the `7e513e8` checkpoint phase):

- R5b: source + fixture only.
- R5c: read-only acceptance cross-check (docs-only).
- R5d: CLAUDE.md docs sync + checkpoint document (docs-only).

### 7.5 R5b should NOT touch loader / renderer / Admin

Same rationale as R2 / R4a: validator and renderer / Admin are
independent consumers of the same registry. R5 affects only the
validator.

### 7.6 R5b should NOT migrate production content

`assetRefs[]` adoption in production posts is a separate migration
phase. R5 lands the rule defensively before any production post
uses `assetRefs[]`.

### 7.7 Predicted baseline movement (must verify before commit)

Per §6.4: `0 / 57 / 52` → `0 / 60 / 53` (single fixture, three
warnings).

Stop signal: if the post-source + post-fixture measurement deviates
from `0 / 60 / 53`, R5b MUST stop before commit. Likely deviations
to investigate:

- Higher warning count → check whether the fixture inadvertently
  triggers an unrelated rule (e.g. missing cover, missing
  description). Standard fixture-template cleanup.
- Lower warning count → check whether the duplicate detection or
  the per-index not-found is failing to fire correctly.
- Same warning count but different post count → likely a fixture
  filename or `status` field issue.

### 7.8 Guards that must verify before R5b proceeds

1. R5a (this phase) committed and pushed; `npm run validate:content`
   on baseline returns `0 / 57 / 52` (unchanged from this phase's
   start).
2. The chosen fixture strategy (S1 per §6.3) is explicitly
   acknowledged by the user in the prompt that opens R5b.
3. The duplicate semantics (trim, case-sensitive, per-key
   warning count) are acknowledged.
4. The rule naming (`download-asset-ref-duplicate`) is acknowledged.
5. The single-commit boundary (source + fixture in one commit; no
   registry, no CLAUDE.md, no other docs) is acknowledged.

If any of these guards is unclear in the R5b prompt, R5b should
stop and request clarification before any edit.

---

## 8. Risk Analysis

### 8.1 Duplicate + not-found cascade noise

**Risk.** Under the recommended S1 strategy, the R5b fixture
produces three warnings. If future fixtures or production posts
inadvertently create similar cascades (e.g. an author types the
same wrong ref twice), they will produce N × not-found + 1
duplicate warnings.

**Mitigation.**

- Per §5.4, R5 uses per-key counting. The duplicate-rule
  contribution is bounded at 1 per unique duplicate key.
- The not-found contribution is bounded by the array length, which
  is already bounded by the post itself.
- In production, `assetRefs[]` is not used today (per §2.4); the
  near-term risk is zero.
- If real noise becomes an issue after production adoption,
  Strategy S2 (suppress not-found on duplicate items beyond first)
  can be revisited in a separate phase.

### 8.2 Empty registry making the fixture "look like a duplicate rule failure"

**Risk.** The fixture's expected warning set includes
`download-asset-ref-not-found` warnings. A future reader might
assume these are R5 warnings (because the fixture filename is about
duplicate) and incorrectly think the duplicate rule is broken.

**Mitigation.** The fixture header MUST enumerate all three
warnings with their rule ids (per §6.6). R5b commit message
SHOULD reference this preanalysis so the multi-rule expectation is
discoverable. R5c (acceptance) verifies all three by name, not
just by count.

### 8.3 Case-sensitivity decision conflicting with future migration

**Risk.** If a later phase decides to canonicalize all registry
keys to lowercase (e.g. as part of a `download-registry-key-shape`
hardening rule), the R5 case-sensitive comparison would
automatically align — duplicates that previously differed only by
case would suddenly become duplicates. This could affect any
production post that already uses `assetRefs[]` (zero today).

**Mitigation.** Case-sensitive is the **conservative** choice
(matches existing R2 / `download-registry-duplicate-key` behavior).
Migrating from case-sensitive to case-insensitive is harder than
the reverse; we pick the easier path. Production posts using
`assetRefs[]` are zero, so the migration cost is zero today.

### 8.4 Warning count strategy affecting baseline

**Risk.** If the per-key strategy is later changed to
per-occurrence-beyond-first, every duplicate-containing fixture's
warning contribution doubles or more.

**Mitigation.** Per-key is committed in §5.4. Any change must go
through its own decision preanalysis and re-baseline. R5b lands
per-key; R5d records per-key in CLAUDE.md if applicable.

### 8.5 Naming confusion with `download-registry-duplicate-key`

**Risk.** Reader sees two `*-duplicate*` rules and confuses them.

**Mitigation.** §3.4 spells out the distinction explicitly. R5b
commit message and source comment block SHOULD restate the
distinction. R5d CLAUDE.md sync SHOULD include both rules in the
§3.2 status block with a one-line each clarification.

### 8.6 Future Admin picker / renderer divergence

**Risk.** A future Admin picker might silently de-duplicate
`assetRefs[]` entries on save, never letting the duplicate rule
fire on Admin-authored posts. Direct .md edits would still
trigger the rule.

**Mitigation.** This is intentional — validator is a
defense-in-depth layer against direct edits. R5 does not block
Admin-side de-duplication and does not impose any contract on a
future Admin picker. R5 is a validator-only rule.

### 8.7 Future production migration possibly multiplying warnings

**Risk.** If a later phase migrates production downloads from
`download.fileUrl` to `download.assetRefs`, and any of those
posts has accidentally repeated refs, the production warning
count would jump.

**Mitigation.** The migration phase itself is a separate,
authorized phase. The R5 rule landed defensively is what makes
the migration *safer* — duplicate authoring mistakes would be
caught at migration time. No mitigation needed; this is the
intended behavior.

### 8.8 Empty-registry change accidentally breaking R5 fixture

**Risk.** If some unrelated future phase seeds an entry called
`duplicate-asset-id` in the registry (highly unlikely), the R5
fixture's two not-found warnings would vanish, dropping the
fixture from 3 warnings to 1. R5c would detect this; R5b would not.

**Mitigation.** Use a deliberately unlikely-to-collide id in the
fixture (e.g. `_test-duplicate-asset-id-not-found-in-registry-`
or similar). R5b's fixture-design step should pick an id obviously
intended for testing.

### 8.9 Coupling with R6 (coexistence rules)

**Risk.** A future R6 coexistence rule might warn when `fileUrl`
+ `assetRefs` coexist. The R5 fixture has both. R5 fixture might
gain an R6 warning later, breaking R5c's exact-match acceptance.

**Mitigation.** R6 is not yet designed. When R6 is designed, its
preanalysis MUST consider the R5 fixture's coexistence pattern
and either:

- design R6 so the R5 fixture is exempt (e.g. R6 only fires when
  certain other conditions hold), or
- explicitly update the R5 fixture's expected warning set as part
  of R6 implementation.

This is a forward-compatibility note, not a blocker.

### 8.10 Reverse UTM and pm-26 dormancy

**Risk.** None. R5 is a validator rule and does not interact
with reverse UTM, Admin Apply, middleware, `admin-write-cli`, or
the `pm-26` deploy gate.

**Mitigation.** N/A. Recorded here only for completeness; per
CLAUDE.md §3.2 + §16.4 all of those workstreams remain dormant.

---

## 9. Recommended Phase Plan

Conservative phased plan. Each phase requires explicit user
authorization; none auto-starts from this preanalysis.

### R5a (this phase, docs-only) — completed by this document

- Duplicate rule candidate identification (§3).
- Duplicate semantics decision (§4).
- Ordering + warning count strategy (§5).
- Fixture strategy decision (§6 — S1 recommended).
- R5b implementation boundary proposal (§7).
- Output: this file.
- Baseline impact: **none** (`0 / 57 / 52` unchanged).

### R5b-preflight (docs-only, optional)

Open only if a non-obvious source-shape question surfaces between
R5a and R5b implementation. Plans the validator code edit; does
not change source. Baseline impact: none. Skip unless needed.

### R5b (source + fixture; single commit)

Implements `download-asset-ref-duplicate` per §3–§5; lands the
single fixture per §6.1. Single commit per §7.2.

- Touches: `src/scripts/validate-content.js`,
  `content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md`.
- Does NOT touch: registry JSONs, loader, CLAUDE.md, other docs,
  templates, renderer, Admin, middleware, production content.
- Baseline impact (predicted): `+1 post / +3 warnings`
  (`0 / 57 / 52` → `0 / 60 / 53`).
- Stop signal: any deviation from the predicted movement.

### R5c (docs-only)

Read-only acceptance cross-check of R5b. Verifies:

- The three R5b fixture warnings appear with the expected rule ids
  and values.
- No production post gained any new warning.
- No unrelated rule's count moved.
- `npm run validate:content` baseline is `0 / 60 / 53`.

Output: one checkpoint document. Baseline impact: none.

### R5d (docs-only)

CLAUDE.md §3.2 sync to record the new rule. Updates the rule
inventory and the bracketed status. May also update the
"already implemented" section in
`docs/20260602-download-r2-not-found-checkpoint.md` cross-reference
list, or create a new checkpoint doc for R5. Baseline impact: none.

### R6 (docs-only preanalysis first, then implementation later)

Coexistence rules. Requires its own decision preanalysis before
implementation. R6 design MUST consider the R5 fixture's
`fileUrl + assetRefs` coexistence (per §8.9).

### Final Idle Freeze

At the end of any of the above phases, the project may pause
indefinitely.

### Phase exit criteria (shared by R5b / R5c / R5d / R6)

Each phase MUST:

- Verify baseline before any edit.
- Verify baseline movement after the edit.
- Be a single commit (R5b bundles source + fixture; R5c / R5d are
  docs-only single-commit phases).
- Not bundle work from other phases.
- Be followed by an explicit user prompt before the next phase
  opens.

---

## 10. Explicit Non-goals

This phase (the docs-only R5a preanalysis) does **not**:

- ❌ Add or modify any rule in `src/scripts/validate-content.js`.
- ❌ Add or modify any fixture under
  `content/validation-fixtures/`.
- ❌ Modify `content/settings/download-assets.json` or
  `content/settings/download-forms.json` (registries stay empty).
- ❌ Modify `src/scripts/load-settings.js` or any other loader code.
- ❌ Modify any template, EJS, SCSS, or renderer.
- ❌ Modify any Admin UI / picker / middleware /
  `admin-write-cli`.
- ❌ Modify `package.json` or any lockfile.
- ❌ Modify `CLAUDE.md` (the §3.2 status update belongs to a
  future R5d, not here).
- ❌ Run `npm run build`, `build:github`, `build:blogger`,
  `build:promotion`, `build:sitemap`, or `build:blogger-theme`.
- ❌ Touch `gh-pages`; no deploy.
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
- ❌ Land `download-asset-ref-duplicate` (R5b scope).
- ❌ Land `download-asset-ref-inactive` / `download-form-ref-inactive`
  (R4b scope — and currently NO-GO per R4a).
- ❌ Land coexistence rules (R6 scope).
- ❌ Introduce a fixture-only registry override / loader extension
  (would be its own preanalysis phase).
- ❌ Schedule, poll, or self-start any follow-up phase
  (R5b-preflight / R5b / R5c / R5d / R6 / Admin / renderer / loader
  extension / build / deploy / Blogger repost / GA4 validation).

This preanalysis does **not** confer authorization to begin
R5b-preflight, R5b, R5c, R5d, R6, or any other phase. Each requires
the user's explicit next prompt.

---

## 11. Final Recommendation

**Recommendation: Final Idle Freeze / EXIT.**

This document is the planning artifact for R5. The next move is the
user's.

If the user authorizes R5 to proceed:

- **Default (recommended): proceed with R5b per §7.** Single
  commit bundling source (`download-asset-ref-duplicate` rule, per
  §3–§5) + single fixture (`_test-download-asset-ref-duplicate.md`,
  per §6.1). Strategy S1 (orthogonal cascade, multi-rule fixture)
  per §6.3. Predicted baseline movement: `0 / 60 / 53`.
- **Alternative: R5b-preflight first.** If any source-shape
  question is unresolved, open a docs-only preflight to plan the
  exact validator code edit before R5b. Skip if §7 is clear enough.
- **Alternative: defer R5 indefinitely.** Acceptable if other
  workstreams take priority. R5 does not block anything else.

If R5 is **not** chosen as the next forward step, valid
alternatives include:

- Open R6-preanalysis (coexistence policy decision; docs-only).
- Open the R4a/Option C track (test-only registry fixture
  override; needs its own loader / validator extension
  preanalysis FIRST).
- Open a CLAUDE.md correction phase for unrelated drift (docs-only).
- Pause indefinitely.

Any other forward motion — Admin picker, renderer, landing page,
content migration, build, deploy, Blogger repost, GA4 validation,
reverse UTM activation, or `pm-26` unblock — remains explicitly
out of scope and is **not** authorized by this preanalysis.

---

## Appendix A — Cross-reference index

- R4a freeze: `docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`
- R2 freeze: `docs/20260602-download-r2-not-found-checkpoint.md`
- R-series plan: `docs/20260602-download-registry-aware-validation-preanalysis.md`
  (R5 candidate originated in §5.4)
- Schema decision: `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
  (§5 registry primary keys; §15.3 status-vs-active discussion)
- Empty-registry implementation plan:
  `docs/20260531-download-empty-registry-implementation-plan.md`
- Option A formRef-empty policy (R2 parent):
  `docs/20260602-download-form-ref-empty-policy-preanalysis.md`
- Fixture creation discipline:
  `docs/20260601-download-content-reference-fixture-creation-preflight.md`
- Governing policy: CLAUDE.md §3.2 (empty registry red lines /
  current loader+validator state), §13 (download.fileUrl warning
  policy), §16.4 (reverse UTM dormancy), §27 (Claude Code
  modification rules), §29 (no membership / no view counts / no
  comments).
- Source of truth at HEAD `d2b04ff`:
  - `src/scripts/load-settings.js` (lines 53–58: download
    registry additive loader, Phase 20260601-pm-11).
  - `src/scripts/validate-content.js` (lines 272–326:
    `validateDownloadRegistry`; lines 328–349:
    `buildDownloadKeySet`; lines 397–402: per-run key set
    construction; lines 627–717: per-post download cascade
    including R2 not-found at lines 669–680 and 705–716).
  - `content/settings/download-assets.json` /
    `content/settings/download-forms.json` (empty-registry
    landing shape; unchanged since commit `466e471`).
- R2 fixtures:
  - `content/validation-fixtures/blogger/posts/_test-download-asset-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-download-form-ref-not-found.md`
