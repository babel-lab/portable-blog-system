# Commerce L1 Seed Intake Packet — Checkpoint

> **Phase**: 20260609-am-18-commerce-l1-seed-intake-packet-docs-only-a
> **Status**: docs-only checkpoint (read-only packet record)
> **Created**: 2026-06-09
> **Predecessor**: `20260609-am-17-commerce-l1-seed-intake-packet-readonly-a` (INTAKE PACKET PASS — packet existed only in the reply; this doc persists it)

---

## A. Executive summary

This document is the **L1 seed intake packet checkpoint**. It consolidates, into one durable file, the
intake packet that the predecessor read-only phase (`am-17`) assembled and passed, so that a future
session does not have to reconstruct it from scratch.

Explicit non-claims:

- **This document is NOT a registry seed.** `content/settings/commerce-links.json` remains
  `commerceLinks: []` (empty) after this checkpoint lands.
- **This document does NOT represent any candidate as passed.** There are currently **zero** candidate
  entries. No merchant, no publisher, no affiliate network, no product URL is recorded here.
- **L1 seed remains BLOCKED.** It is unblocked only when the **user** provides a `commerceSeedCandidates:`
  YAML block (per §C) **and** gives explicit approval to open an L1 candidate-preflight phase.
- **absence of objection ≠ approval.** Silence does not authorize any seed, write, or phase advance.

This checkpoint is **docs-only**: it adds exactly one file and changes no source, settings, registry,
fixture, template, view, or build/deploy state.

---

## B. Current baseline

At the time this checkpoint was authored, the frozen repo state is:

| Field | Value |
| --- | --- |
| Branch | `main` |
| HEAD | `2721412` |
| origin/main | `2721412` |
| ahead/behind | `0/0` |
| Working tree | clean |
| Latest subject | `docs(claude): sync C9 governance baseline` |
| `npm run validate:content` (normal) | **0 errors / 69 warnings / 59 posts** |
| Overlay (`commerce-c4-c9-overlay.json`) | **0 errors / 70 warnings / 59 posts** |
| `content/settings/commerce-links.json` | `commerceLinks: []` (empty) |
| Production posts using `affiliate.links[].ref` | 0 |
| Production posts coexisting `ref` + `url` (C6) | 0 |
| C9 (`commerce-ref-display-override-risk`) | **Option D / no expansion** — narrow leak-equality only |
| Reverse UTM (Blogger → GitHub) | source landed, **un-deployed**, live state **dormant**, pm-26 deploy gate **BLOCKED** |
| Admin Apply / middleware / admin-write-cli | dormant |
| C4 / C7 source | C4 source landed (warning-only); C7 (`commerce-ref-missing-role`) **NO-GO / not started** |

This checkpoint **must not change** any of the above. If a future session's work would change any of
these, that work belongs in its own phase with its own preanalysis — not in this checkpoint.

**C9 reminder**: per `docs/20260609-commerce-c9-label-override-safety-preanalysis.md`, the accepted
decision is **Option D — do not expand C9**; keep the existing narrow leak-equality check
(`labelOverride.trim() === entry.internalLabel.trim()`, `validate-content.js:761-783`, warning-only,
never echoes the sensitive value). Any broader C9 (URL-leak heuristics, token-like detection) is **not
implemented** and would require its own independent expansion preanalysis + fixture + acceptance phase.

---

## C. `commerceSeedCandidates:` YAML skeleton

When the user is ready to propose L1 seed candidates in a **future** session, they paste a YAML block in
the conversation following the shape below. This is a **proposal format only** — it is not a file written
to disk, and it is not the registry shape. Conversion from intake YAML → registry entry happens in a
separate, explicitly-approved apply step (L2), never here.

### C.1 Blank skeleton (copy this)

```yaml
commerceSeedCandidates:
  - linkId: ""
    displayLabel: ""
    role: ""
    targetUrl: ""
    sourceReason: ""
```

### C.2 Placeholder-only example (reserved domains only — do NOT treat as real entries)

```yaml
commerceSeedCandidates:
  - linkId: "example-official-product"
    displayLabel: "Example Official Product Page"
    role: "official"
    targetUrl: "https://example.com/public-product-page"
    sourceReason: "Public official page; no tracking params; safe for first-seed review."

  - linkId: "example-library-catalogue"
    displayLabel: "Example Public Library Catalogue Entry"
    role: "library"
    targetUrl: "https://example.org/catalogue/item-id"
    sourceReason: "Public catalogue entry; no auth required; safe for first-seed review."

  - linkId: "example-price-check"
    displayLabel: "Example Price Reference"
    role: "price-check"
    targetUrl: "https://store.example.net/product/canonical-id"
    sourceReason: "Product page with all tracking params stripped; verified canonical URL."
```

### C.3 Reserved placeholder namespaces

Template / example URLs may use **only** the RFC 2606 / RFC 6761 reserved namespaces:

- second-level domains: `example.com`, `example.org`, `example.net`
- reserved TLDs: `.example`, `.invalid`, `.test`, `.localhost`

Do **NOT** substitute any other TLD, country-code TLD, real-government / real-organisation domain, real
merchant, real publisher, real affiliate network, real product URL, or real tracking parameter into the
placeholders. Replacing the reserved-namespace placeholders with real candidate URLs is the **user's**
job, in a later session, with real candidate entries.

---

## D. Candidate fields

Each candidate entry the user proposes should contain the fields below. **All fields are user-provided.**
AI must not infer / guess / auto-fill any of these from a URL, hostname, or pattern.

### D.1 `linkId`

- **Requirement**: required.
- **Format**: lowercase kebab-case ASCII; unique within the proposal/registry.
- **Purpose**: stable machine key referenced by `affiliate.links[].ref` in post frontmatter.
- **Enters production registry?** Yes — primary key in `commerce-links.json`.
- **Appears in Admin / snippet?** Yes — snippet writes `ref: "<linkId>"`; Admin selector preview exposes
  `linkId` as the safe machine key.
- **Notes**: avoid meaningless ids (`id-1`); avoid anything containing tracking ids / session tokens.

### D.2 `displayLabel`

- **Requirement**: required.
- **Format**: human-readable short string suitable for end-user display.
- **Purpose**: the user-visible name of the destination.
- **Enters production registry?** Yes — stored as `displayLabel`.
- **Appears in Admin / snippet?** Yes — Admin selector preview uses it as the safe public label; if
  missing, falls back to `linkId` (never to `internalLabel` or `targetUrl`, per `active-commerce-links.js`).
- **Notes**: no internal codes; no empty string; no tracking params / campaign names.

### D.3 `role`

- **Requirement**: recommended (collected at intake; see §E). Currently optional-but-recommended in
  source because C7 (`commerce-ref-missing-role`) is NO-GO / not enforcing.
- **Format**: exactly one of the §E enum values; lowercase kebab-case; case-sensitive.
- **Purpose**: semantic categorization of the link relative to the post's commerce intent.
- **Enters production registry?** **No** — `role` is a per-reference attribute that belongs in the post's
  `affiliate.links[].role`, not on the registry entry.
- **Appears in Admin / snippet?** Yes — snippet writes `role: "<role>"` into the YAML the author pastes.
- **Notes**: collected at intake so the author has guidance ready at the snippet step; the live C8 enum
  check (`commerce-ref-invalid-role`) will pass when the value is in-enum.

### D.4 `targetUrl`

- **Requirement**: required.
- **Format**: public HTTPS URL satisfying §F safe-URL constraints.
- **Purpose**: the destination the end-user reaches when clicking the rendered link.
- **Enters production registry?** Yes — stored as `targetUrl`.
- **Appears in Admin / snippet?** **No** — `active-commerce-links.js` deliberately excludes `targetUrl`
  from the Admin selector preview; the snippet does not write `targetUrl` into the post (the post
  references the entry via `ref`, the registry holds the URL).
- **Notes**: plain HTTPS only; tracking-free for first seed (see §F).

### D.5 `sourceReason` / `usageNote`

- **Requirement**: recommended.
- **Format**: short free-text (English or Traditional Chinese), ≤ ~200 chars.
- **Purpose**: human-readable note explaining *why* the URL is safe-for-first-seed; used during per-entry
  review before any write.
- **Enters production registry?** **需 user 確認** — may optionally be stored as `notes` on the entry, or
  kept only in the intake form and discarded at apply time. Decided per-entry; do **not** auto-promote
  `sourceReason` into `notes` without explicit user instruction. (See §I.1.)
- **Appears in Admin / snippet?** No.
- **Notes**: the reason must not itself contain any §H red-line sensitive data.

> Any field semantics not stated above are marked **需 user 確認**. Do not invent additional fields,
> defaults, or behaviours.

---

## E. Allowed `role` enum

The only accepted values for `role` are, exactly:

```
primary
alternate
official
price-check
library
direct
```

Rules:

- **lowercase kebab-case**, and **case-sensitive**. `Primary`, `OFFICIAL`, `Price-Check` are all
  **rejected** (C8 `commerce-ref-invalid-role` flags them).
- **No synonyms.** `main`, `default`, `vendor`, `other`, `bookstore`, `price`, `pricecheck`,
  `official-link` are all **rejected**.
- **No empty string** at intake — the user must propose a role per entry, even though C7 (missing-role)
  source is dormant and would currently pass an omitted role silently.
- This enum is mirrored in `src/scripts/active-commerce-links.js` (`ALLOWED_COMMERCE_ROLES`, Admin
  authoring guidance) and is the source of truth for C8 in `src/scripts/validate-content.js`. They must
  not drift; today they match.

---

## F. Per-candidate preflight checks (what L1 candidate-preflight will verify)

When an L1 candidate-preflight phase later runs against user-pasted candidates, it will check **per entry**
(read-only, no writes):

- **Is it user-supplied?** Every field must come from the user. AI-originated values are rejected.
- **Is it AI-invented?** Any merchant, URL, label, or tracking value the AI fabricated is rejected. AI may
  not propose candidate rows.
- **Has `displayLabel`?** Non-empty human-readable label present.
- **Has HTTPS `targetUrl`?** Plain `https://`, public, reachable-by-anyone shape.
- **Tracking-free for first seed?** No affiliate ids / partner codes / `utm_*` / `sid` / `aff_id` / `tag`
  / `ref` query params; no URL shorteners; no tokens; no signed/expiring URLs.
- **No sensitive data?** No credential / token / API key / account email / 個資 / private note /
  commission / payout / clickCount / private Drive folder id / Google Form edit URL / respondent data.
  (Full red-line list: §H.)
- **Still only a candidate?** Passing preflight does **not** mean the entry is written to the production
  registry. Preflight produces a per-entry pass/fail report only.
- **Conforms to the L1 → L2 → L3 → L4 ladder?** (See §G.) Preflight is L1; it never crosses into L2 write.

### F.1 User self-check (fill in before submitting a candidate block)

The user should be able to answer "yes" to all of these, per entry, before sending the block:

- [ ] `linkId` is lowercase kebab-case and unique within this proposal.
- [ ] `displayLabel` is the human-readable name; no internal codes; no tracking ids.
- [ ] `role` is exactly one of `primary` / `alternate` / `official` / `price-check` / `library` / `direct`.
- [ ] `targetUrl` is plain HTTPS, public, no tracking params, no shortener, no token, no login required,
      no Drive folder, no Form edit URL.
- [ ] `sourceReason` does not itself contain any red-line sensitive data.
- [ ] None of the §H red-line items appear anywhere in this entry.

---

## G. L1 → L2 → L3 → L4 ladder

The commerce seed ladder is deliberately staged. Each rung is its own phase with its own preanalysis,
its own approval, and its own acceptance.

| Rung | Scope | Writes / Modifies |
| --- | --- | --- |
| **L1 — candidate preflight** | Read-only review of user-pasted candidates against §D / §E / §F. | **Nothing.** Output is a per-entry pass/fail report only. No file write. |
| **L2 — seed implementation** | Settings-only write of vetted entries. | May write `content/settings/commerce-links.json` (`[]` → non-empty). **No** source / renderer / content / build changes. Separate phase. |
| **L3 — seed acceptance** | Read-only cross-check of the L2 write. | **Nothing.** Output is registry-shape check, validator output, Admin selector preview, red-line re-scan. Separate phase. |
| **L4 — renderer / migration** | Source activation. | Wires `affiliate.links[].ref` resolution into render output; optionally enables C7 source; possibly triggers production content migration (raw `url` → `ref`). **Not now.** Separate phase. |

Rules across all rungs:

- **Each stage needs explicit approval.** No rung auto-starts because the previous one passed.
- **absence of objection ≠ approval.** AI must obtain an explicit "yes" before advancing.
- **This checkpoint is the input form for L1, not an L1 execution.** Filling this in does not start L1.
- L2 may write the registry; L1, L3, and this checkpoint never do.

---

## H. Forbidden / red lines (this checkpoint and any L1 phase)

Explicitly forbidden:

- **No auto-seed registry.** `commerce-links.json` stays `commerceLinks: []` until an approved L2 phase.
- **No fixture creation.** No new validation fixtures / overlays from this checkpoint.
- **No sample promote.** `_sample.commerce-links.json` is not promoted to production.
- **No production migration.** Posts using raw `url` are not migrated to `ref`.
- **No renderer / Admin / deploy / Blogger / GA4 activation.**
- **No reverse UTM activation.** Reverse UTM remains dormant / un-deployed.
- **No pm-26 unblock.** Deploy gate remains BLOCKED.
- **No C9 expansion.** C9 remains Option D / narrow leak-equality only.
- **No C4 / C7 / C9 source implementation.** No source edits to these rules.
- **No AI-invented merchant / URL / affiliate data.** Only the user may supply candidate identity.

Sensitive-data red-line — must **never** appear in the repo, the production registry, the sample
registry, any fixture/overlay, or the intake form when committed:

- affiliate dashboard credentials — email, password, OAuth client secret, API key, secret token
- access tokens — bearer / refresh tokens, session ids, Authorization headers
- account email used to log into an affiliate program
- private Drive folder / file IDs (IDs are credential-equivalent)
- Google Form edit URLs (`/edit` paths) and Form respondent data (names, emails, phone, school, answers)
- commission / payout / clickCount / conversion stats; settlement / bank / payout info
- customer data (orders, addresses, payment info) and personal contact data (phone, address, ID numbers)

If a future candidate entry contains any of the above, AI must **refuse to write** it, point at the
offending field, and ask the user for a sanitized re-supply. AI must **not** silently strip the value
(silent strip risks residue in `notes`, commit messages, or PR descriptions).

---

## I. Open questions / future semantics (mark 需 user 確認; do not self-decide)

These are recorded so a future L1/L2 phase addresses them explicitly. They are **not** decided here.

1. **Does `sourceReason` become registry `notes`?** **需 user 確認.** Default for now: do not auto-promote
   `sourceReason` into `notes`; decide per-entry at L2 apply time with explicit user instruction.
2. **How does repo public/private status affect URL exposure?** **需 user 確認.** If the repo is (or
   becomes) public, every `targetUrl` in `commerce-links.json` is world-readable in git history forever.
   This raises the bar for what is "safe for first seed" and reinforces the tracking-free constraint
   (§F). The public/private decision and its implications belong to the L2 preanalysis.
3. **Are affiliate tracking params ever allowed in future?** **需 user 確認.** First seed is tracking-free
   (§F). Whether a later, more permissive URL form (with publisher-set or affiliate params) is ever
   admitted is a separate, per-entry, explicitly-approved decision — not granted by this checkpoint.
4. **`merchantKey` / `networkKey` / `displayName` future semantics.** **需 user 確認.** These are not part
   of the §D required field set. If a future registry shape needs them, they must be user-supplied and
   never inferred from URL hostname patterns (CLAUDE.md §3.1 red-line). No spec is invented here.

---

## J. Final recommendation

- **Next actual step requires the user** to paste a real `commerceSeedCandidates:` YAML block (per §C)
  with real candidate entries, plus an explicit request to open the L1 phase.
- **Then open a separate `L1 candidate-preflight read-only` phase** to run §D / §E / §F checks against the
  user-supplied entries and produce a per-entry pass/fail report — writing nothing.
- **Do not auto-start L1 seed.** AI must not run L1 against fabricated or guessed entries, and must not
  advance to L2 / L3 / L4, C7 activation, renderer activation, Admin Apply, registry seed, production
  migration, deploy, Blogger repost, or GA4 validation based on this checkpoint alone.
- After this checkpoint lands, the recommended posture is **Final Idle Freeze / EXIT** until the user
  provides candidates.

---

## K. References (read-only)

- `CLAUDE.md` §3.1 — commerce registry governance red-line
- `docs/20260608-commerce-l1-seed-candidate-intake-template.md` — the L1 intake template (input form)
- `docs/20260608-commerce-registry-seed-governance-preanalysis.md` — registry seed governance plan
- `docs/20260609-commerce-c9-label-override-safety-preanalysis.md` — C9 decision (**Option D / no expansion**)
- `content/settings/commerce-links.json` — production registry (empty `[]`)
- `content/settings/_sample.commerce-links.json` — sample blueprint (not loaded; placeholders only)
- `src/scripts/active-commerce-links.js` — Admin selector preview helper (safe fields only)
- `src/scripts/validate-content.js` — registry-level (R-rules) + content-ref (C-rules) validator

---

*End of L1 seed intake packet checkpoint.*
