# Phase 20260602-am-2 — download.formRef Empty / Whitespace Policy Preanalysis (docs-only)

Phase name: `20260602-am-2-download-form-ref-empty-policy-preanalysis-docs-only-a`
Date: 2026-06-02
Mode: docs-only preanalysis (no source / no fixture / no settings / no loader / no build / no deploy)

---

## 1. Executive Summary

This document is a **docs-only preanalysis**. It exists solely to decide the
policy for `download.formRef` being the **empty string** (`""`) or a
**whitespace-only string** (e.g. `"   "`), and to record a recommended
direction for a future source + fixture implementation phase.

Explicit scope statement:

- **No source change** — `src/scripts/validate-content.js` will not be modified.
- **No new fixtures** — `content/validation-fixtures/blogger/posts/` will not
  receive new `_test-download-form-ref-empty*.md` files in this phase.
- **No registry mutation** — `content/settings/download-forms.json` and
  `content/settings/download-assets.json` remain at empty registry shape.
- **No loader change** — `src/scripts/load-settings.js` is not touched and
  registries are not connected.
- **No Admin / no renderer / no build / no deploy / no Blogger repost.**
- **No GA4 / no reverse UTM activation / no pm-26 unblock.**

The output of this phase is **one new file only**:
`docs/20260602-download-form-ref-empty-policy-preanalysis.md`.

The recommendation in §6 is **Option A — empty / whitespace `formRef` should
warn** — but stated as a preanalysis recommendation, not as an instruction to
implement. The next phase that may act on this recommendation is described in
§12 and requires explicit user authorization.

---

## 2. Current Accepted Baseline

Baseline confirmed at start of this phase (2026-06-02 08:04 local):

- repo: `D:\github\blog-new\portable-blog-system`
- branch: `main`
- HEAD: `8277feb2477c08cc092cf812b50bd0de2b4a824e` (short `8277feb`)
- origin/main: `8277feb2477c08cc092cf812b50bd0de2b4a824e`
- ahead/behind: clean — `## main...origin/main` (no ahead / no behind)
- working tree: clean
- latest commit subject: `feat(download): validate content reference field shapes`
- `npm run validate:content` → **0 errors / 53 warnings / 48 posts**

Option 6 landed in `8277feb` and currently exposes **4 warning-only rules**:

1. `download-asset-refs-invalid-type` — `assetRefs !== undefined && !Array.isArray(assetRefs)`
2. `download-asset-ref-invalid-type` — `assetRefs` is array but item is not string
3. `download-asset-ref-empty` — item is string but `trim() === ''`
4. `download-form-ref-invalid-type` — `formRef !== undefined && typeof formRef !== 'string'`

Notes on what is **not** yet implemented (and therefore in-scope for future
preanalysis or future implementation phases):

- No `download-form-ref-empty` rule exists.
- No E1 (`_test-download-form-ref-empty.md`) fixture exists.
- No E2 (`_test-download-form-ref-whitespace.md`) fixture exists.
- No registry-aware validation exists (no not-found / inactive / duplicate /
  coexistence rules; registries are not read by validator).
- `download-assets.json` and `download-forms.json` remain **empty registry
  landing points** (per `CLAUDE.md` §3.2 and per the empty registry policy
  landed in `466e471`).

---

## 3. Current Source Behavior

Authoritative reference: `src/scripts/validate-content.js`, Option 6 block
beginning at L597 (per current `8277feb`).

### 3.1 `download.formRef` shape check (currently landed)

```js
const formRef = download.formRef;
if (formRef !== undefined && typeof formRef !== 'string') {
  issues.push({
    severity: 'warning',
    type: 'download-form-ref-invalid-type',
    sourcePath,
    value: Array.isArray(formRef)
      ? 'typeof=array'
      : formRef === null
        ? 'typeof=null'
        : `typeof=${typeof formRef}`,
  });
}
```

### 3.2 Implications of current source

- `download.formRef === undefined` → no warning, treated as **absent**.
- `download.formRef` non-string (array / object / number / boolean / null) →
  `download-form-ref-invalid-type` warning fires once.
- `download.formRef` of type `string`, **including** `""` and `"   "` →
  **no warning is emitted today**. The string is silently accepted as a valid
  reference shape.

### 3.3 What the source explicitly does NOT do today

- It does **not** read `content/settings/download-forms.json`.
- It does **not** check whether the (non-empty) string matches a registry id.
- It does **not** check `inactive` status.
- It does **not** check duplicate `formRef` across posts.
- It does **not** check `formRef` + `assetRefs` coexistence rules.
- It does **not** trim before applying any check.

This is consistent with the Option 6 inline comment at L607:

> 不引入 download-form-ref-empty（empty string policy 延後拍板）

The present phase exists to **拍板** that policy.

---

## 4. Problem Statement

The current source behavior creates a **silent gap** between `formRef: ""`
(user wrote an empty value) and `formRef: undefined` (user did not set the
field at all). From the validator's perspective they are indistinguishable,
but from a content-author perspective they are very different states:

- `formRef: undefined` — author has no form for this post.
- `formRef: ""` — author was prompted (likely via Admin UI or a template
  scaffold) to fill a form id but submitted blank.
- `formRef: "   "` — same as above, with stray whitespace.

The silent gap matters now, for two reasons:

### 4.1 Consistency with `assetRefs`

`assetRefs` already has an explicit empty rule:
`download-asset-ref-empty` fires when an item is a string but
`trim() === ''`. If `formRef` does **not** have a matching rule, the two
sibling reference fields disagree on what "blank string" means:

- `assetRefs: ["", "x"]` → `download-asset-ref-empty` on index 0.
- `formRef: ""` → silent.

This asymmetry is the **strongest** signal that the current state is an
oversight, not a deliberate design.

### 4.2 Blocking future registry-aware validation design

A future registry-aware `not-found` rule (the natural next step after
loader registries are connected) needs a clear contract for what input
strings it receives:

- If the empty/whitespace case is **already handled upstream by an empty rule**,
  the registry lookup contract becomes simple: "lookup is only called with a
  trimmed non-empty string."
- If the empty/whitespace case is **not** handled upstream, the not-found rule
  must decide for itself: either treat `""` as not-found (noisy, semantically
  wrong) or skip it silently (re-introduces the asymmetry from §4.1).

Deciding the empty policy **before** the registry-aware phase is therefore
the right ordering. It is also the reason E1/E2 fixtures cannot be safely
designed until this policy is fixed: an E1 fixture must hit exactly one
rule, and "exactly one rule" depends on which rule we choose to introduce.

---

## 5. Policy Options

### 5.1 Option A — empty / whitespace `formRef` should warn

**Behavior.** Introduce a new warning-only rule:

- id (future): `download-form-ref-empty`
- severity: `warning`
- trigger (future): `typeof download.formRef === 'string' && download.formRef.trim() === ''`
- evaluated **after** `download-form-ref-invalid-type` (the two rules are
  mutually exclusive: invalid-type catches non-strings; empty catches
  strings that trim to nothing).
- evaluated **before** any future registry-aware `not-found` rule.

**Pros.**

- Restores symmetry with `download-asset-ref-empty`.
- Provides an authoring-time signal that a `formRef` field was scaffolded
  but never filled.
- Cleanly partitions inputs for future registry-aware checks: lookup is
  only ever called with a trimmed non-empty string.
- Mirrors the existing trim-aware empty pattern used by
  `related-links-source-key-empty` and `download-asset-ref-empty`
  (`trim() === ''`).
- Warning-only — non-blocking for build / deploy.

**Cons.**

- Adds one more warning category to the validator output. Numerically minor:
  the rule is exclusive with invalid-type, so the maximum increase in
  warning count per offending post is +1.
- Authors who treat `formRef: ""` as a deliberate placeholder will now see a
  warning. (Counterpoint: that is the point — the placeholder is invisible
  state today; making it visible is correct.)

**Baseline impact.** None in this phase (docs-only). When the future
implementation phase lands with two new fixtures (E1 + E2), the expected
baseline shifts:

```
0 errors / 53 warnings / 48 posts
  → 0 errors / 55 warnings / 50 posts
```

This is an **expected** future delta; this phase changes nothing.

**Fixture needs (future, not this phase).** Two fixtures (see §8):
E1 (`""`) and E2 (`"   "`), each isolated to fire exactly one warning.

---

### 5.2 Option B — empty / whitespace `formRef` treated as absent

**Behavior.** Do not introduce `download-form-ref-empty`. Treat `formRef: ""`
and `formRef: "   "` as semantically equivalent to `formRef: undefined`. All
future registry-aware code must skip lookup when `formRef.trim() === ''`.

**Pros.**

- Smallest source-surface change. No new rule, no new fixtures.
- Matches a reading of the spec where any "no usable id" → "no form".
- Avoids the (small) noise of warning on what could be a placeholder.

**Cons.**

- Permanently entrenches the asymmetry with `download-asset-ref-empty`.
- Authoring mistakes (UI scaffolded a blank id) remain invisible. The user
  only finds out later — at runtime when the renderer silently shows no
  form, or at registry time when the not-found rule silently skips.
- Future code that consumes `formRef` (renderer, Admin picker, build) must
  each independently re-implement the same `trim() === '' → treat as absent`
  guard. Distributed responsibility, more places to forget.
- Sets a precedent that contradicts the existing
  `download-asset-ref-empty` rule, which is then either rolled back (more
  churn) or left as a one-off inconsistency.

**Risk.** Future registry-aware design has to thread the `trim`-equivalence
through every callsite. Easy to get wrong; easy to drift between renderer
and validator definitions of "empty".

---

### 5.3 Option C — defer the policy again

**Behavior.** Do nothing in this phase, do nothing in the next phase either.
Leave `formRef: ""` silently accepted until some later trigger forces a
decision (e.g. Admin picker landing, or registry-aware rule landing).

**Pros.**

- Zero work now.

**Cons.**

- The decision is already overdue: it is what was deferred at Option 6
  landing time. Deferring again has no new information advantage.
- Blocks E1/E2 fixture creation indefinitely.
- Blocks the design of registry-aware not-found (because not-found has to
  resolve the empty-string ambiguity locally — see §4.2).
- Increases the chance that the registry-aware phase has to be paused
  mid-flight to come back here.

**Recommendation.** Not recommended. The only reason to choose C is if we
expect a **specific** upstream design decision (e.g. Admin schema change) in
the near term that would invalidate either A or B. No such decision is in
flight; Admin Apply remains dormant per the registry red lines in CLAUDE.md
§3.2.

---

## 6. Recommended Policy

**Recommendation: Option A — empty / whitespace `formRef` should warn.**

Stated as preanalysis, not as implementation.

### 6.1 Rationale

1. **Consistency with the already-landed peer rule.** `assetRefs` items
   trigger `download-asset-ref-empty` on `trim() === ''`. `formRef` is the
   sibling single-reference field of the same `download` block. Treating
   them differently is hard to justify on any principle other than
   "we forgot."

2. **`formRef` is a single reference field.** Empty string on a single
   reference is almost certainly an authoring or scaffolding mistake. There
   is no legitimate "intentionally empty single reference" use case in this
   codebase (there is no shape where `""` carries meaning distinct from
   absence).

3. **Cleans the registry-aware boundary.** Having `download-form-ref-empty`
   land **before** the registry-aware not-found rule means the not-found
   rule has a simple, single-shape input contract. This reduces complexity
   in the next preanalysis phase.

4. **Non-blocking.** Warning-only severity preserves the project's policy
   of never blocking build/deploy on content shape concerns.

5. **Reversibility.** A warning rule is cheap to introduce and cheap to
   remove. If Option B turns out to be correct, deleting one rule + two
   fixtures is a small change. The reverse direction (introducing the rule
   later after Option B has been baked into the registry-aware design) is
   significantly more disruptive.

### 6.2 What this recommendation does NOT include

- Does **not** include implementation in this phase.
- Does **not** include fixture authoring in this phase.
- Does **not** include any registry-aware behavior.
- Does **not** include any change to `download-forms.json`.
- Does **not** include any loader / Admin / renderer / build work.

---

## 7. Future Rule Design if Option A is approved

Specification for the **future** source change (no implementation in this
phase).

### 7.1 Rule metadata

- id: `download-form-ref-empty`
- severity: `warning`
- emitted from: `src/scripts/validate-content.js`, inside the
  `post.download` block, after `download-form-ref-invalid-type`, before any
  (currently non-existent) registry-aware checks.

### 7.2 Guard logic (specification, not code)

```text
const formRef = download.formRef;
if (formRef === undefined) {
  // no rule fires (absent is allowed)
} else if (typeof formRef !== 'string') {
  // download-form-ref-invalid-type fires (existing rule)
  // download-form-ref-empty does NOT fire
} else if (formRef.trim() === '') {
  // download-form-ref-empty fires (new rule)
  // future registry-aware checks do NOT run on this formRef
} else {
  // future registry-aware checks may continue
  // (registry lookup, inactive check, etc.)
}
```

### 7.3 Mutual exclusivity contract

- Exactly one of `download-form-ref-invalid-type` /
  `download-form-ref-empty` may fire for any given post's `formRef` field
  (or neither, if `formRef` is absent or a non-empty string).
- This exclusivity mirrors the existing `assetRefs` invalid-type / empty
  partition.

### 7.4 Suggested message shape

`download.formRef must be a non-empty string when provided`

The message MUST NOT include the empty value itself (logging `""` or `"   "`
adds no information). It MAY include the field path (`download.formRef`)
for diagnosability.

### 7.5 Placement note

Place the new rule immediately after the existing invalid-type block (after
L654 in the current source, before any future registry-aware code is added).
Keep the `// Phase 20260601-night-9 Option 6` comment intact; add a new
comment line referencing this phase document for the empty rule.

The current inline comment at L607
(`不引入 download-form-ref-empty（empty string policy 延後拍板）`) should
be **removed or rewritten** in the future implementation phase to reflect
that the policy has now been decided.

---

## 8. Future Fixture Design if Option A is approved

Specification for **future** fixtures (no fixture creation in this phase).

### 8.1 E1 — empty string

- path: `content/validation-fixtures/blogger/posts/_test-download-form-ref-empty.md`
- minimal frontmatter pattern (modeled after the existing
  `_test-download-form-ref-invalid-type-array.md`):
  - `status: "ready"`, `draft: false`
  - `contentKind: "download"`, `site: "blogger"`, `primaryPlatform: "blogger"`
  - `category: "download"`, `tags: ["book"]`
  - `cover: "/images/placeholders/cover.png"` (avoid cover warnings)
  - `seo.indexing: "noindex-follow"` (avoid `download-content-should-be-noindex`)
  - `download.enabled: true`
  - `download.fileUrl: "https://example.com/placeholder.pdf"` (avoid
    `download-enabled-fileurl-empty` / `download-fileurl-invalid-format` /
    `download-fileurl-invalid-type`)
  - `download.formRef: ""`
- expected single warning: `download-form-ref-empty`
- expected to NOT trigger: any other `download-*`, SEO, title, fileUrl,
  related-links, book, series rule.

### 8.2 E2 — whitespace-only string

- path: `content/validation-fixtures/blogger/posts/_test-download-form-ref-whitespace.md`
- same frontmatter pattern as E1, except:
  - `download.formRef: "   "`
- expected single warning: `download-form-ref-empty`
- expected to NOT trigger any other rule.

### 8.3 Isolation rule (reuse of established fixture discipline)

Each fixture must isolate **exactly one** rule. This is the same rule
already enforced by the Option 6 fixture batch (per the four
`_test-download-asset-*` / `_test-download-form-ref-invalid-type-*`
fixtures). No mixed-warning fixtures.

### 8.4 Expected baseline shift when source + E1 + E2 land together

```
0 errors / 53 warnings / 48 posts  (current, this phase)
  → 0 errors / 55 warnings / 50 posts  (future, after source + 2 fixtures)
```

Notes:

- This is the **expected** delta and **not** verified by this docs-only phase.
- The actual delta MUST be re-verified in the future implementation phase.
- A delta other than +2 warnings / +2 posts in that future phase is a signal
  that a fixture is leaking into another rule or that the implementation
  is wrong.

### 8.5 Why source + E1 + E2 should be a single phase

Splitting source and fixtures across phases creates a transient state
where either (a) the rule exists with no fixture coverage, or (b) the
fixtures exist but the rule does not fire. Both states are confusing for
future re-readers of the validate output. Co-landing keeps the validator
internally consistent at every commit.

---

## 9. Interaction With Registry-Aware Validation

This policy is **strictly upstream** of any registry-aware logic.

- Empty check MUST run before registry lookup.
- Empty / whitespace strings MUST NOT enter `download-forms.json` lookup.
- Registry not-found, when introduced, MUST receive only trimmed non-empty
  strings.
- `download-forms.json` is **not** consulted by this rule. The rule is a
  pure frontmatter shape rule, by the same design as `download-asset-ref-empty`.

This phase does **not** modify `content/settings/download-forms.json`. The
registry remains an empty landing point per CLAUDE.md §3.2:
`{ schemaVersion: 1, updatedAt: "", forms: [], notes: "" }`.

The registry-aware design (not-found / inactive / duplicate / coexistence)
is the subject of a **separate** future preanalysis phase, after Option A
is implemented. It MUST NOT be folded into the Option A implementation
phase.

---

## 10. Interaction With Loader Registry Connection

This policy does **not** require the loader to be connected to the
registries.

- The future `download-form-ref-empty` rule is a frontmatter-only rule.
- It does not call `load-settings.js`.
- It does not depend on `readJsonOptional` behavior or on the silent
  fallback shape of the empty registry.
- Loader malformed-JSON handling and registry-shape hardening remain a
  **separate** future preflight concern, governed by the existing
  Option 6 source comment at L282–L283:

  > malformed JSON 不在本批範圍：loader readJsonOptional 已 silent fallback
  > 成 default object；validator 只檢查「loader 傳進來的 object shape」，
  > 不 throw、不 error（屬後續 hardening phase）

The loader contract therefore MUST NOT be decided in this phase. It is the
subject of an independent preanalysis when registry-aware validation is
actually scheduled.

---

## 11. Non-goals / Explicitly Out of Scope

This phase does **not** do any of the following:

- ❌ Source implementation (no edit to `src/scripts/validate-content.js`).
- ❌ Fixture creation (no E1, no E2, no other `_test-*` files).
- ❌ Registry-aware validation (no not-found / inactive / duplicate /
  coexistence rules).
- ❌ `download-forms.json` mutation.
- ❌ `download-assets.json` mutation.
- ❌ `src/scripts/load-settings.js` mutation; no loader registry connection.
- ❌ Admin picker design or implementation.
- ❌ Renderer / landing-page implementation.
- ❌ Content migration of existing `download.fileUrl` posts to
  `assetRefs[]` / `formRef`.
- ❌ Build (`npm run build:github` / `:blogger` / `:promotion` / `:sitemap`).
- ❌ Deploy.
- ❌ Blogger repost / manual posting.
- ❌ GA4 validation, including reverse UTM (remains dormant).
- ❌ `pm-26` deploy gate unblock (remains BLOCKED).
- ❌ `admin-write-cli` dry-run or apply.
- ❌ Middleware write route.
- ❌ Any change to `CLAUDE.md`.
- ❌ Any change to `package.json` or dependencies.
- ❌ `git rebase` / `git amend` / `git push --force` / `git reset` /
  `git stash`.
- ❌ `git fetch` / `git pull` (unless `git push origin main` is rejected, at
  which point this phase MUST stop and report).

---

## 12. Recommended Next Phase

If the conclusion of this document (Option A) is accepted by the user, the
**only** sanctioned next phase is:

```
20260602-am-3-download-form-ref-empty-source-fixture-implementation-a
```

Constraints on that future phase:

- Requires **explicit user authorization**. This document does NOT confer
  that authorization.
- MUST co-land source + E1 + E2 in a single phase (see §8.5).
- MUST verify the expected baseline shift (`53→55` warnings,
  `48→50` posts) and report any deviation as a stop condition.
- MUST be followed by a separate **read-only acceptance cross-check**
  phase (e.g. `20260602-am-4-...readonly-a`) before any further
  registry-aware work.
- MUST NOT bundle in registry-aware not-found / inactive / duplicate /
  coexistence rules. Those are separate future preanalyses.
- MUST NOT auto-start from this document. The trigger is the user's next
  explicit prompt.

If, on reflection, the user prefers **Option B** instead, the corresponding
sanctioned next phase is a docs-only acceptance + a follow-up registry-aware
preanalysis (no source change in either case). Naming suggestion:

```
20260602-am-3-download-form-ref-empty-policy-option-b-acceptance-docs-only-a
20260602-am-4-download-registry-aware-validation-preanalysis-docs-only-a
```

Neither alternative is auto-started. User must explicitly direct the next
phase.

---

## 13. Final Idle Freeze

On completion of this phase:

- Final Idle Freeze.
- EXIT.
- Do **not** auto-start `20260602-am-3-*` or any other phase.
- Do **not** poll, watch, or schedule wakeups.
- Resume only on the user's next explicit prompt.

---

## Appendix A — Cross-reference index

- Source: `src/scripts/validate-content.js` (Option 6 block at L597–L654 in
  commit `8277feb`).
- Settings: `content/settings/download-forms.json` (empty registry).
- Settings: `content/settings/download-assets.json` (empty registry).
- Sibling fixtures (Option 6):
  - `content/validation-fixtures/blogger/posts/_test-download-asset-refs-invalid-type-object.md`
  - `content/validation-fixtures/blogger/posts/_test-download-asset-refs-invalid-type-string.md`
  - `content/validation-fixtures/blogger/posts/_test-download-asset-ref-invalid-type-item.md`
  - `content/validation-fixtures/blogger/posts/_test-download-asset-ref-empty-item.md`
  - `content/validation-fixtures/blogger/posts/_test-download-form-ref-invalid-type-array.md`
  - `content/validation-fixtures/blogger/posts/_test-download-form-ref-invalid-type-object.md`
- Prior preanalyses (read in this phase):
  - `docs/20260601-download-content-reference-fixture-creation-preflight.md`
  - `docs/20260601-download-content-reference-validation-preanalysis.md`
  - `docs/20260601-download-validator-fixture-strategy-preanalysis.md`
  - `docs/20260601-download-content-reference-fixture-batch-design-preanalysis.md`
- Governing policy: `CLAUDE.md` §3.2 (empty registry red lines),
  CLAUDE.md §13 (download rules), CLAUDE.md §27 (Claude Code modification
  rules).
