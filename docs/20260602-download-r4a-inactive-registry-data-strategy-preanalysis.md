# 2026-06-02 Download R4a Inactive Registry Data Strategy Preanalysis

Phase name: `20260602-night-14-download-r4a-inactive-registry-data-strategy-preanalysis-docs-only-a`
Date: 2026-06-02 (night-14, 23:07 local)
Mode: docs-only preanalysis (no source / no fixture / no registry mutation / no loader / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM / no pm-26 unblock / no admin-write-cli / no Admin Apply)

---

## 1. Executive Summary

R2 (registry-aware not-found validation, batch 1) has landed and been
accepted at commit `7e513e8` (final freeze baseline). The next
candidate workstream is **R4 — inactive validation**: warning-only
rules that flag `assetRefs[]` / `formRef` whose registry entry is
deactivated.

R4 cannot land until two prior questions are answered:

1. **Where does the test data come from?** The current registry is
   `assets: []` / `forms: []` (empty). An inactive rule cannot be
   exercised against an empty registry — fixtures need at least one
   entry that resolves but is marked inactive. R2 (not-found) needed
   no registry data because empty-registry is the test case; R4 cannot
   reuse this property.

2. **What field on the registry entry signals "inactive"?** The
   registry schema decision pm-2 (commit predating empty-registry
   landing) settled on a `status` enum (`draft` / `ready` /
   `published` / `archived`) aligned with post `status` per
   CLAUDE.md §23. The earlier registry-aware preanalysis
   (`docs/20260602-download-registry-aware-validation-preanalysis.md`)
   referred to the candidate rules as
   `download-asset-ref-inactive` / `download-form-ref-inactive` and
   listed the gate as `active === false` or "equivalent status field
   per pm-2 schema decision." Those two framings disagree on rule
   name and field shape; this docs-only phase must reconcile them
   before any source lands.

This document records:

- The current accepted state at HEAD `7e513e8`.
- A reconciliation of the conflicting candidate framings.
- Five candidate registry-data strategies (Options A–E) with explicit
  trade-offs.
- A field-schema decision recommending **reuse of the pm-2 `status`
  enum**, with `status === 'archived'` as the inactive signal.
- A minimal R4b implementation boundary proposal.
- Risks, recommended phase plan, explicit non-goals.

Output of this phase is exactly **one** new file:
`docs/20260602-download-r4a-inactive-registry-data-strategy-preanalysis.md`.

See also:

- `docs/20260602-download-registry-aware-validation-preanalysis.md`
  (R-series plan; the R4 candidate originated here)
- `docs/20260602-download-r2-not-found-checkpoint.md` (R2 freeze
  baseline immediately preceding this phase)
- `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
  (pm-2 schema decision; defines `status` enum and `archived` semantics)
- `docs/20260531-download-empty-registry-implementation-plan.md`
  (empty-registry landing plan)
- `docs/20260602-download-form-ref-empty-policy-preanalysis.md`
  (Option A formRef-empty policy, parent of the R2 cascade)
- CLAUDE.md §3.2 (registry red lines + current loader/validator state)
- CLAUDE.md §13 (download.fileUrl warning policy)
- CLAUDE.md §23 (post `status` enum)

---

## 2. Current Accepted State

Baseline confirmed at start of this phase (2026-06-02 23:07 local):

- repo path: `D:\github\blog-new\portable-blog-system`
- branch: `main`
- HEAD: `7e513e802b1aafd0a99da631275491d1e8bf7529` (short `7e513e8`)
- HEAD == `origin/main`: yes (ahead/behind 0/0)
- working tree clean
- latest commit subject: `docs(download): record r2 not-found checkpoint`
- `npm run validate:content` → **0 errors / 57 warnings / 52 posts**

Recent commit chain (top of this phase window, most recent first):

```text
7e513e8 docs(download): record r2 not-found checkpoint
145a548 feat(download): validate ref not-found against registry
53a2a73 docs(claude): clarify download registry state
53c691e docs(download): plan registry-aware validation
63e6a9b docs(download): record form ref empty checkpoint
```

### 2.1 R2 — accepted (frozen)

Two warning-only registry-aware rules have landed:

- `download-asset-ref-not-found` — `assetRefs[i]` is a trimmed
  non-empty string but no `settings.downloadAssets.assets[].assetId`
  matches.
- `download-form-ref-not-found` — `formRef` is a trimmed non-empty
  string but no `settings.downloadForms.forms[].formId` matches.

Both rules use the read-only registry surface exposed by the loader
(Phase 20260601-pm-11 additive). Both rules sit at the tail of the
mutual-exclusion cascade:

```text
assetRefs[i]: invalid-type → empty → not-found
formRef     : invalid-type → empty → not-found
```

The registry-shape gate (`assetKeySet === null` /
`formKeySet === null` from `buildDownloadKeySet`) skips lookup when
the registry shape is invalid, so cascade noise from
`download-registry-invalid-shape` is avoided.

R2 fixtures (one per rule) live at:

- `content/validation-fixtures/blogger/posts/_test-download-asset-ref-not-found.md`
- `content/validation-fixtures/blogger/posts/_test-download-form-ref-not-found.md`

R2 introduced no registry mutation; both registry files remain at the
empty-registry shape:

```json
{ "schemaVersion": 1, "updatedAt": "", "assets": [], "notes": "" }
{ "schemaVersion": 1, "updatedAt": "", "forms":  [], "notes": "" }
```

### 2.2 What R4 needs that R2 did not

The not-found rule's correctness can be verified against an empty
registry — every lookup misses by construction. An inactive rule
cannot:

- "Inactive" requires a registry entry that **exists** (otherwise
  not-found fires first and short-circuits).
- That entry must carry a deactivation signal in some agreed field.
- Therefore R4's fixtures necessarily depend on at least one resolvable
  registry entry whose deactivation field is set.

This is the single load-bearing fact for the rest of this document.

### 2.3 What remains dormant / unstarted

- `download-asset-ref-inactive` / `download-form-ref-inactive`
  (or whichever final name R4a chooses; see §5)
- `download-asset-ref-duplicate` / intra-post duplicate (R5)
- Coexistence rules (R6)
- Admin picker, renderer, landing page, content migration
- Loader extension beyond the additive read-only surface
- Reverse UTM (Blogger → GitHub Pages); pm-26 deploy gate (BLOCKED)
- Admin Apply / middleware write / admin-write-cli (dormant)

---

## 3. R4 Inactive Rule Candidates

This section enumerates the two rules R4 will eventually need. **No
rule lands in this phase.** Conditions are stated abstractly with
respect to "the inactive signal field"; §5 chooses what that field
actually is.

### 3.1 `download-asset-ref-inactive` (candidate)

- **Condition.** `assetRefs[i]` is a string with `trim() !== ''`,
  there exists a registry entry whose `assetId.trim()` equals
  `assetRefs[i].trim()`, and that entry's inactive-signal field
  declares it inactive (see §5 for the field choice).
- **Severity.** warning (consistent with all download rules; never
  error in the first registry-aware phases).
- **Mutual exclusion (per array index).** Only one of
  `download-asset-ref-invalid-type`, `download-asset-ref-empty`,
  `download-asset-ref-not-found`, `download-asset-ref-inactive` may
  fire. Inactive sits strictly **after** not-found:
  - If the ref does not resolve to any registry entry → not-found
    fires; inactive MUST NOT also fire.
  - Inactive may fire only after the ref has resolved.
- **Mutual exclusion (registry-shape gate).** If
  `download-registry-invalid-shape` fires for `downloadAssets`, the
  per-index inactive check is skipped (same gate as R2 not-found, via
  `assetKeySet === null` or an equivalent shape-aware accessor).
- **Default.** Missing inactive-signal field on a registry entry is
  treated as **active** (i.e. no warning fires). See §5.4.

### 3.2 `download-form-ref-inactive` (candidate)

- **Condition.** `formRef` is a string with `trim() !== ''`, there
  exists a registry entry whose `formId.trim()` equals
  `formRef.trim()`, and that entry's inactive-signal field declares
  it inactive.
- **Severity.** warning.
- **Mutual exclusion (per post).** Only one of
  `download-form-ref-invalid-type`, `download-form-ref-empty`,
  `download-form-ref-not-found`, `download-form-ref-inactive` may
  fire. Same downstream-of-not-found ordering as §3.1.
- **Default.** Same as §3.1.

### 3.3 Cascade ordering recap (post-R4b)

```text
assetRefs[i]:
  invalid-type → invalid-type(item) → empty → not-found → inactive

formRef:
  invalid-type → empty → not-found → inactive
```

The R2-landed cascade does not change; R4b appends one terminal
branch per family.

### 3.4 What R4 does NOT introduce

- ❌ Promotion of inactive from warning to error.
- ❌ Cross-registry inactive (e.g. asset inactive triggers form
  warning) — no such linkage exists in the schema decision.
- ❌ Build-time blocking of inactive references.
- ❌ Renderer-side suppression of inactive references (renderer is
  not built; out of scope).
- ❌ Admin-picker filtering of inactive entries (Admin picker is
  not built; out of scope).
- ❌ Content migration of any production post (production posts use
  `download.fileUrl` only and remain unchanged).

---

## 4. Registry Data Strategy Options

To exercise `*-inactive` rules, fixtures need a registry entry that
both resolves (so not-found does not preempt inactive) and is marked
inactive. The empty registry cannot supply either property.
Below are five candidate strategies. §4.6 picks one.

### 4.1 Option A — Keep registries empty; defer inactive

- **Description.** Do nothing to the registry. Skip R4 entirely
  until some other phase introduces production registry entries.
- **Pros.**
  - Zero risk to the empty-registry baseline.
  - No registry red-line concerns (per CLAUDE.md §3.2 governance).
  - Preserves Admin Apply / middleware dormancy with no incidental
    pressure to wire them up.
- **Cons.**
  - The inactive rule remains unimplemented and unverified
    indefinitely.
  - When inactive eventually lands, there is no regression fixture —
    the rule could silently rot.
  - Punts the decision rather than answering it; future-us has the
    same problem.
- **Conclusion.** Safe but unhelpful. Acceptable only if the user
  explicitly decides inactive is not worth implementing in the
  current scope.

### 4.2 Option B — Add inactive entries directly to the production settings registry

- **Description.** Add 2 entries (one asset, one form) to
  `content/settings/download-assets.json` and
  `content/settings/download-forms.json` with the chosen inactive
  field set, e.g.
  `{ "assetId": "test-inactive-asset", "status": "archived", ... }`.
  Same JSON files that the loader currently exposes read-only.
- **Pros.**
  - Closest to "real" data; matches how Admin picker / renderer would
    eventually see the registry.
  - Single source of truth; no special fixture-only loader path.
  - Minimal source change (validate-content only).
- **Cons.**
  - Pollutes the production registry baseline. Until Admin /
    renderer arrive, this pollution is harmless; once they arrive,
    those consumers will see test-only ids in their pickers / lists.
  - The "empty-registry landing point" invariant from
    `docs/20260531-download-empty-registry-implementation-plan.md`
    §5 / §8 is broken (registries are no longer empty).
  - Forces a downstream cleanup phase before production rollout of
    Admin / renderer: someone must delete or namespace these entries.
  - Increases the chance that a future migration accidentally
    interprets the test entries as production data.
  - May require additional registry-red-line audits (per
    CLAUDE.md §3.2) to confirm the entries contain no respondent
    data / no tokens — easy now, easy to forget six months out.
- **Conclusion.** Not recommended. The "registry stays empty until
  there's real data" invariant is load-bearing for the project's
  red lines and should not be broken just to satisfy a validator
  regression fixture.

### 4.3 Option C — Test-only registry fixture file

- **Description.** Introduce a separate JSON file at e.g.
  `content/validation-fixtures/settings/download-assets-inactive.json`
  (and the form sibling). The validator runner is taught to merge or
  swap to these files when running against fixtures.
- **Pros.**
  - Production registry stays empty (preserves §4.2's broken
    invariant).
  - Test data is co-located with test fixtures, which is the existing
    fixture discipline.
- **Cons.**
  - **Loader and validate-content do not currently support an
    alternate registry path.** Per
    `src/scripts/load-settings.js` (Phase 20260601-pm-11), the
    loader reads a fixed list of files from `content/settings/`.
    Implementing this option requires:
    - Either a loader extension (alternate path argument or a merge
      step), which is explicitly out of R4 scope and not authorized
      by this phase.
    - Or a validator-side override that reads the fixture registry
      and substitutes it for `settings.downloadAssets` /
      `settings.downloadForms` — also a source change beyond a
      single-rule R4b.
  - The Admin picker / renderer (when built) would never see this
    fixture file, so it does not lower the future cleanup burden of
    real registry data.
  - Risk that the validator's two modes (production-registry vs
    fixture-registry) silently diverge over time.
- **Conclusion.** Architecturally clean but requires non-trivial
  source changes that exceed an R4b "minimum safe commit." Defer
  unless the user explicitly wants the loader extension first.

### 4.4 Option D — Temporarily mutate the registry during fixture test flow

- **Description.** The R4b fixture flow temporarily writes inactive
  entries to the production registry JSON, runs `validate:content`,
  then reverts. This could be a script or a git-managed
  test-only commit that is reverted before push.
- **Pros.**
  - No persistent registry pollution.
  - No loader change.
- **Cons.**
  - **High risk.** The repository's reproducibility guarantees
    require deterministic file state. Any flow that mutates and
    reverts is one Ctrl-C away from leaving the working tree dirty
    in production state.
  - Breaks the "regression fixture in repo" property: subsequent
    `npm run validate:content` from a fresh clone would not exercise
    the inactive rule, because the mutation is ephemeral.
  - Hostile to CI: there is no CI yet (this project is local-first)
    but if added later, this strategy fails.
- **Conclusion.** Not recommended. Lose-lose.

### 4.5 Option E — Introduce the inactive rule only after real registry entries exist

- **Description.** Wait for some future content phase to need a real
  registry entry (e.g. an actual production download). Once that
  entry exists and the user marks it archived in the normal course
  of business, build the inactive rule and use that real entry as
  the regression fixture.
- **Pros.**
  - No test-only data in the registry.
  - Drives rule introduction by real demand; avoids speculative
    implementation.
  - Cleanest possible repo state.
- **Cons.**
  - Indefinite delay; depends on a content event that may never
    happen.
  - The rule is unimplemented in the interim, so authors who do
    start using `assetRefs[]` / `formRef` get no warning when an
    asset is silently retired.
  - When the rule eventually lands, the regression fixture is a
    real-world entry — which means changing or deleting that entry
    breaks the test. Test fragility risk.
- **Conclusion.** Reasonable if the project genuinely has no
  near-term need for inactive validation. Equivalent in practice to
  Option A but with a "we'll do it later for real reasons" framing.

### 4.6 Recommendation

**Recommended order:**

1. **Primary recommendation: Option A — keep registries empty;
   defer inactive.** This is the most conservative choice and
   matches the project's stated red lines and dormancy policies
   (CLAUDE.md §3.2, §27, §29). The R2 not-found rule is now
   landed, covers the highest-value failure mode (typos and missing
   refs), and is exercisable against the empty registry. Inactive
   adds modest additional coverage and can wait until either:
   - real production registry data exists (then Option E applies
     naturally), or
   - a separate phase decides to lift the empty-registry invariant
     for explicit reasons unrelated to validator coverage.

2. **If the user wants inactive coverage now, prefer Option C
   (test-only registry fixture file) over Option B.** Option C
   requires loader / validator changes that exceed an R4b
   single-commit, so it would have to be split:
   - R4a-source-preflight (loader / validator extension to accept a
     fixture-registry override; docs-only preanalysis first).
   - R4b-source (inactive rules).
   - R4b-fixtures (inactive fixtures + fixture registry JSON).
   That sequence respects the project's "one rule family per phase /
   smallest delta" discipline.

3. **Reject Option B**: pollutes the production registry baseline
   and breaks the empty-registry invariant for a test-data reason.

4. **Reject Option D**: ephemeral mutation breaks reproducibility.

5. **Option E** is acceptable as a passive default if the user is
   uncertain; functionally equivalent to Option A in the near term.

The remainder of this document assumes the conservative path
(Option A or Option E). §6 sketches an R4b implementation boundary
that would apply once a registry data strategy is chosen.

---

## 5. Inactive Field Schema Decision

This section answers the second R4 prerequisite: what field on a
registry entry signals "this is inactive"?

### 5.1 Candidates

| Field shape           | Example                       | Default if missing | Source                                           |
| --------------------- | ----------------------------- | ------------------ | ------------------------------------------------ |
| `active: false`       | `{ "active": false }`         | active (true)      | Earlier R-series preanalysis §5.3                |
| `status: "archived"`  | `{ "status": "archived" }`    | active (any non-archived value, or missing) | pm-2 schema decision §7.4 |
| `enabled: false`      | `{ "enabled": false }`        | enabled (true)     | (proposed for comparison)                        |
| `isActive: false`     | `{ "isActive": false }`       | active (true)      | (proposed for comparison)                        |

### 5.2 Trade-offs

**Readability.**
- `status` is the most expressive — it carries the full lifecycle
  (`draft` / `ready` / `published` / `archived`) rather than a
  binary.
- `active` / `isActive` are simplest to read at a glance but lose
  information.
- `enabled` is concise but easy to confuse with frontmatter's
  `download.enabled` (a separate boolean controlling per-post
  download display; see CLAUDE.md §13).

**Risk of confusion with `download.enabled`.**
- `enabled: false` on a registry entry would land within ~10 lines
  of the existing `download.enabled` frontmatter rule
  (`download-enabled-fileurl-empty`). High risk of reader confusion
  and accidental cross-wiring in source.
- `status` has no analog in the existing download frontmatter (post
  `status` is at the top level, not inside `download`); cleanly
  separable.
- `active` / `isActive` are unused in the current download schema;
  low collision risk.

**Admin picker usability.**
- `status` enum maps directly onto the kind of status-chip Admin UIs
  expect (per the schema-decision §6.2 reference to a "status chip"
  in the picker). The picker can display "Active" / "Archived"
  badges with no further translation.
- A binary `active` requires the picker to choose its own label
  ("Active" / "Inactive").

**Existing decision pressure.**
- The pm-2 schema decision
  (`docs/20260531-download-asset-form-settings-registry-schema-decision.md`
  §7.4) already mandates `status` as a `required` enum field on
  both `DownloadAsset` and `FormConfig` registry entries, with
  `archived` explicitly the value meaning "no longer in use; ref
  resolution still works." That decision predates R2 and was
  authored to govern the registry from the start.
- The earlier registry-aware preanalysis
  (`docs/20260602-download-registry-aware-validation-preanalysis.md`
  §5.3) referred to the candidate rule as
  `download-asset-ref-inactive` / `download-form-ref-inactive` and
  the gate as "`active === false` or equivalent status field per
  pm-2 schema decision" — that wording was deliberately
  non-committal pending this phase.

### 5.3 Recommendation

**Reuse the pm-2 `status` enum. Treat `status === 'archived'` as
the inactive signal.**

Rationale:

- The schema decision is already pinned and predates this phase.
  Introducing a parallel `active` field would create two sources of
  truth for "is this entry still in use" and force every consumer
  (validator, Admin picker, renderer) to check both.
- `status` carries more information for free; future extensions
  (e.g. "ready but unlisted" or "draft and embargoed") have an
  obvious home that a binary does not.
- `download.enabled` (post frontmatter) and `status` (registry
  entry) are clearly distinct in name and location, avoiding the
  confusion risk that `enabled` on the registry would introduce.

### 5.4 Default value when `status` is missing

The pm-2 schema marks `status` as **required**. Therefore the
validator's contract should be:

- If `status` is missing or not a string → the registry entry is
  malformed; this is **not** an inactive case. Treat as **active**
  for the purposes of the inactive rule (no warning fires), and
  rely on a separate registry-shape rule to surface the missing
  field. (That separate rule is **not** part of R4; it is a
  candidate for a future registry-shape hardening phase, beyond R4
  scope.)
- If `status` is a string but not one of the enum values → again,
  treat as active for the purposes of the inactive rule; a separate
  enum-validation rule (also out of R4 scope) would catch the
  invalid value.
- If `status === 'archived'` → inactive; the rule fires.
- If `status ∈ { 'draft', 'ready', 'published' }` → active; the rule
  does not fire.

The conservative default ("missing or unknown → active, no
warning") avoids cascading new warnings from R4 when registry data
is partial. This is consistent with how `download-asset-refs-invalid-type`
short-circuits per-item rules in R2.

### 5.5 Rule naming

Two consistent naming options:

- **Option N1 (preanalysis-aligned):** `download-asset-ref-inactive`
  / `download-form-ref-inactive`. Matches the wording in
  `docs/20260602-download-registry-aware-validation-preanalysis.md`
  §5.3 and the R-series ordering already understood by the user.
- **Option N2 (schema-decision-aligned):** `download-assetref-archived`
  / `download-formref-archived`. Matches the wording in
  `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
  §5.4 table (line 558-559 — "asset-inactive" and "form-inactive"
  rows refer to `download-assetref-archived` /
  `download-formref-archived`).

**Recommendation: Option N1.** Reasons:

- R2 already uses the `*-asset-ref-*` (with hyphen between `asset`
  and `ref`) compound and the `*-form-ref-*` compound. Continuing
  that pattern keeps the validator surface internally consistent.
- "Inactive" is the more readable user-facing term even when the
  underlying mechanic is `status === 'archived'`. The rule value
  string can spell out the actual state: e.g.
  `value: 'assetRefs[0]="..." resolves but status="archived"'`.
- The schema-decision doc's naming is a **candidate name** (§5.4
  is a candidate matrix, not a final commitment); the
  registry-aware preanalysis names are also candidates. Either
  choice is internally documentable.

R4a's decision: **Option N1 for the rule id; mention `archived` in
the rule's value string for clarity.**

---

## 6. R4b Implementation Boundary Proposal

This section sketches what R4b would look like, **once** §4 and §5
are committed and the user authorizes the next phase. R4b is not
authorized by this phase.

### 6.1 Scope (if Option A is rejected and inactive proceeds)

- **In scope.**
  - `src/scripts/validate-content.js`: append per-family inactive
    branch after not-found, plus a registry-entry accessor that
    returns the matching entry given a ref (the current
    `buildDownloadKeySet` returns only the key set; an inactive
    check needs the entry).
  - 2 fixtures under `content/validation-fixtures/blogger/posts/`:
    one per rule, each isolating a single new warning.
  - **If Option B is chosen**: 2 minimal entries (1 asset, 1 form)
    added to `content/settings/download-assets.json` /
    `download-forms.json` with `status: "archived"` and a
    documented prefix (e.g. `test-` or `__test__-`) to clearly mark
    test data.
  - **If Option C is chosen**: a loader / validator extension to
    support a fixture-registry override (would itself be split into
    a dedicated preflight phase before R4b).
- **Out of scope.**
  - CLAUDE.md updates — those belong to a separate R4c docs sync.
  - Admin picker, renderer, landing page.
  - Loader extension beyond what is strictly required for the
    chosen strategy.
  - Production content migration.
  - Build / deploy / Blogger repost / GA4 validation.
  - Reverse UTM activation; pm-26 unblock.

### 6.2 Minimum safe commit

If Option A is overridden and Option B is chosen, R4b should still
be a **single commit** bundling source + fixtures + minimal
registry seed, per the established Option 6 / Option A precedent:

```text
feat(download): validate ref inactive against registry
  src/scripts/validate-content.js
  content/validation-fixtures/blogger/posts/_test-download-asset-ref-inactive.md
  content/validation-fixtures/blogger/posts/_test-download-form-ref-inactive.md
  content/settings/download-assets.json   (1 archived entry)
  content/settings/download-forms.json    (1 archived entry)
```

If Option C is chosen, the commit instead touches the alternate
fixture-registry path and not the production registry. Either way,
**one commit**, with the message tying back to this R4a decision
doc.

### 6.3 Expected baseline movement

- Option A (do nothing): baseline unchanged.
- Option B / Option C / Option E (rule lands; fixtures land):
  estimated `Δposts = +2`, `Δwarnings = +2`. Each fixture is
  designed to fire exactly one inactive warning.
- If the registry seed under Option B is accidentally interpreted
  by an unrelated rule (e.g. a future registry-shape rule), the
  baseline movement would exceed `+2 / +2` — that is the stop
  signal for R4b.

### 6.4 Guards that must verify before R4b proceeds

1. R4a (this phase) committed and pushed; `npm run validate:content`
   on baseline returns `0 / 57 / 52` (unchanged from R2 freeze).
2. The chosen strategy (Option A / B / C / D / E) is explicitly
   acknowledged by the user in the prompt that opens R4b.
3. The field-schema decision (`status === 'archived'` is the
   inactive signal) is acknowledged by the user.
4. The rule naming (`download-asset-ref-inactive` /
   `download-form-ref-inactive`) is acknowledged.
5. (If Option B) the user explicitly accepts breaking the
   empty-registry invariant for this purpose.
6. (If Option C) a separate loader / validator extension preflight
   must precede R4b; that preflight is itself a docs-only phase.

### 6.5 Should R4b bundle source + fixtures, or split?

- **Bundle.** Consistent with R2 (`145a548`), which landed source
  and both fixtures in a single commit. Easier to reason about
  baseline movement attribution.
- **Split.** Would let the source land first against a still-empty
  registry, but with no fixture the new rule would have zero
  coverage — pointless.

R4a's recommendation: **bundle**, matching R2.

---

## 7. Risk Analysis

### 7.1 Registry production data being polluted by test data

Specific to **Option B**. The risk is that test-only entries in the
production registry confuse future Admin / renderer consumers. The
mitigation (clear prefix, documented in the schema-decision red
lines) helps but does not eliminate the risk. The empty-registry
invariant exists precisely to prevent this category of issue.

### 7.2 Inactive schema choice being wrong

If R4a picks `active: false` and pm-2 later turns out to require
`status === 'archived'` (which it already does), every fixture and
every validator branch has to be migrated. The reverse error (R4a
picks `status`, schema-decision later changes to `active`) is far
less likely because pm-2 is pinned. Recommendation §5.3 minimizes
this risk.

### 7.3 Admin picker / renderer divergence

If a future Admin picker treats `status === 'draft'` as "do not
show in author UI" while the validator treats only
`status === 'archived'` as inactive, the picker and validator
disagree on which entries are "usable." This is not
incorrect — different consumers have different policies — but it
must be documented. R4c (docs sync) is the place for that
documentation; R4a flags it.

### 7.4 not-found and inactive cascading on the same ref

By the per-index cascade in §3.3, only one of not-found / inactive
fires per ref. The cascade is enforced by ordered `else if`
branches, identical in shape to the R2 implementation. Risk is
low; mitigation is the existing R2 cascade pattern.

### 7.5 Loader fallback causing false negatives

`readJsonOptional` returns the empty-registry fallback on missing
file / parse error. In the empty-registry case, **every ref
not-founds** — inactive cannot fire because there are no entries
to be archived. This means:

- Under Option A (registry stays empty), the inactive rule, if
  landed, would be permanently dormant. The fixture could not be
  designed to fire it.
- Under any option that introduces a non-empty registry, the
  fallback risk is bounded by whether the file is present and
  parseable on each validation run.

This is the main reason §4.6 recommends Option A as the
conservative default — implementing a dormant rule provides little
benefit.

### 7.6 Empty-registry-invariant breakage

The empty-registry invariant is named explicitly in CLAUDE.md §3.2:

> 兩檔內容為 `{ schemaVersion: 1, updatedAt: "", assets|forms: [], notes: "" }`（empty registry）

Breaking that invariant for a test-only reason (Option B) creates a
documentation maintenance burden — CLAUDE.md §3.2 would need to be
updated to describe the seeded entries, and the next reader would
need to know which entries are "real" vs "test." Option C and
Option E preserve the invariant.

### 7.7 Baseline drift

R2 brought the baseline from `0 / 55 / 50` to `0 / 57 / 52`. R4b
would bring it to `0 / 59 / 54` (under any non-A option). Cumulative
fixture growth is small per phase but compounds. Each phase's stop
signal is the per-phase delta; the cumulative number is informational
only.

### 7.8 Coupling between R4a (this phase) and R4b

R4a is purely documentary. R4b can be opened by any future prompt
that quotes the R4a recommendation it accepts (e.g. "proceed with
Option A and the recommended rule naming"). R4a does not pre-stage
any source or fixture changes; the next phase has full freedom to
diverge if new information arrives.

---

## 8. Recommended Phase Plan

The R-series sequence, updated to reflect this phase's findings:

### R4a (this phase, docs-only) — completed by this document

- Inactive registry-data-strategy decision (§4).
- Inactive field-schema decision (§5).
- Inactive rule-naming decision (§5.5).
- R4b boundary proposal (§6).
- Output: this file.
- Baseline impact: none.

### R4b-preflight (docs-only, optional)

Open only if Option C is chosen and a loader / validator extension
is needed. Plans the extension shape; does not change source.
Baseline impact: none.

### R4b (source + fixtures, optional)

Lands the inactive rules under the strategy chosen in R4a.
Estimated baseline impact: `+2 posts / +2 warnings` (assuming
two single-warning fixtures, one per rule).

### R4c (docs-only, optional)

Acceptance cross-check of R4b — verifies the rule behaves per
§3.1 / §3.2 expectations, updates CLAUDE.md §3.2 to record the
new rule names and the strategy chosen, updates this R4a doc with
the actual outcome where it diverges from prediction.

### R5 (docs-only preanalysis → source + fixture)

`download-asset-ref-duplicate` (intra-post). Independent of R4
because duplicate is a frontmatter-only rule that does not need
registry data. R5 could in principle precede R4b. R4a does not
re-litigate the R-series ordering recommendation from the earlier
registry-aware preanalysis (§9 R5 there).

### R6 (docs-only preanalysis only; implementation later)

Coexistence rules. Requires its own decision preanalysis before
implementation; not influenced by R4a.

### Final Idle Freeze

At the end of any of the above phases, the project may pause
indefinitely. R4a does not authorize R4b-preflight, R4b, R4c, R5,
R6, or any other forward motion.

---

## 9. Explicit Non-goals

This phase (the docs-only R4a preanalysis) does **not**:

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
  future R4c, not here).
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
- ❌ Land `download-asset-ref-inactive` or
  `download-form-ref-inactive`.
- ❌ Land `download-asset-ref-duplicate` (R5 scope).
- ❌ Land coexistence rules (R6 scope).
- ❌ Schedule, poll, or self-start any follow-up phase
  (R4b-preflight / R4b / R4c / R5 / R6 / Admin / renderer / loader
  extension / build / deploy / Blogger repost / GA4 validation).

This preanalysis does **not** confer authorization to begin
R4b-preflight, R4b, R4c, R5, R6, or any other phase. Each requires
the user's explicit next prompt.

---

## 10. Final Recommendation

**Recommendation: Final Idle Freeze / EXIT.**

This document is the planning artifact for R4. The next move is the
user's.

If the user authorizes R4 to proceed:

- **Default (recommended): Option A — keep registries empty; defer
  inactive.** No R4b is opened; the project pauses at the R2
  freeze. The empty-registry invariant is preserved. Inactive
  validation is documented as deferred and may be re-opened later
  under Option E when real registry data exists.
- **Alternative: Option C — fixture-only registry override.**
  Requires an R4b-preflight phase to plan the loader / validator
  extension; that preflight is itself docs-only.
- **Discouraged: Option B — seed production registry.** Possible
  but breaks the empty-registry invariant; requires explicit user
  acknowledgment.
- **Rejected: Option D — ephemeral mutation.** Not recommended;
  R4a does not authorize this.

If R4 is **not** chosen as the next forward step, valid alternatives
include:

- Skip to R5 (intra-post duplicate). R5 needs no registry data and
  is independent of R4a's decision; it could land before R4b.
- Skip to R6-preanalysis (coexistence). Decision-only; no source.
- Pause indefinitely.

Any other forward motion — Admin picker, renderer, landing page,
content migration, build, deploy, Blogger repost, GA4 validation,
reverse UTM activation, or `pm-26` unblock — remains explicitly
out of scope and is **not** authorized by this preanalysis.

---

## Appendix A — Cross-reference index

- R2 freeze: `docs/20260602-download-r2-not-found-checkpoint.md`
- R-series plan: `docs/20260602-download-registry-aware-validation-preanalysis.md`
- pm-2 schema decision (status enum, archived semantics):
  `docs/20260531-download-asset-form-settings-registry-schema-decision.md`
  (§5.4 candidate rule names; §7.4 status enum; §15.3 status-vs-active discussion)
- Empty-registry implementation plan:
  `docs/20260531-download-empty-registry-implementation-plan.md`
- Option A formRef-empty policy (R2 parent):
  `docs/20260602-download-form-ref-empty-policy-preanalysis.md`
- Governing policy: CLAUDE.md §3.2 (empty registry red lines /
  current loader+validator state), §13 (download.fileUrl warning
  policy), §16.4 (reverse UTM dormancy), §23 (post status enum),
  §27 (Claude Code modification rules), §29 (no membership /
  no view counts / no comments).
- Source of truth at HEAD `7e513e8`:
  - `src/scripts/load-settings.js` (lines 53–58: download
    registry additive loader, Phase 20260601-pm-11).
  - `src/scripts/validate-content.js` (lines 272–326:
    `validateDownloadRegistry`; lines 328–349:
    `buildDownloadKeySet`; lines 401–402: per-run key set
    construction; lines 669–681 / 705–716: R2 not-found
    branches).
  - `content/settings/download-assets.json` /
    `content/settings/download-forms.json` (empty-registry
    landing shape).
- R2 fixtures:
  - `content/validation-fixtures/blogger/posts/_test-download-asset-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-download-form-ref-not-found.md`
