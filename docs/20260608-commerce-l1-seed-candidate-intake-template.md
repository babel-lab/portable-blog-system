# Commerce L1 Seed Candidate Intake Template

> **Phase**: 20260608-night-9-commerce-l1-seed-candidate-intake-template-docs-only-a
> **Status**: docs-only intake template
> **Created**: 2026-06-08

---

## 1. Purpose

This document is a **user-facing intake template** for collecting Commerce L1 seed candidate entries.

Scope and non-scope:

- This document is **docs-only**. Adding this template **does not** start the L1 seed ladder.
- It **does not** seed the registry. `content/settings/commerce-links.json` remains `commerceLinks: []`.
- It **does not** activate the renderer. Commerce output remains dormant.
- It **does not** activate the Admin write path / middleware / `admin-write-cli`.
- It **does not** trigger any deploy / Blogger repost / GA4 validation.
- It **does not** unlock C7 source (`commerce-ref-missing-role`); role remains recommended-but-optional in source.

The template exists only so the **next conversation** in which user wants to actually propose L1 candidate entries has a single, governance-aligned form to fill in, with the safety red-lines stated up-front rather than reconstructed from scratch.

---

## 2. Current frozen baseline

At the time this template was authored, the repo state is:

| Field | Value |
| --- | --- |
| HEAD | `cadac7e` |
| origin/main | `cadac7e` |
| ahead/behind | `0/0` |
| Working tree | clean |
| Latest subject | `docs(operations): checkpoint project-wide status` |
| `npm run validate:content` | **0 errors / 69 warnings / 59 posts** |
| Overlay (`commerce-c4-c9-overlay.json`) | **0 errors / 70 warnings / 59 posts** |
| `content/settings/commerce-links.json` | `commerceLinks: []` (empty) |
| Production posts using `affiliate.links[].ref` | 0 |
| Production posts coexisting `ref` + `url` (C6) | 0 |
| Admin commerce YAML snippet helper | landed + accepted; renders empty-state until registry is non-empty |
| Reverse UTM (Blogger → GitHub) | source landed (pm-24a/b/c), **un-deployed**, live state **dormant**, pm-26 deploy gate **BLOCKED** |
| Admin Apply / middleware / admin-write-cli | dormant |
| C7 source | not started (docs-only plan landed at `8c9fddf`) |

This template **must not change** any of the above. If filling in this template in a later session would change any of the above, that work must go through its own preanalysis and its own phase, not through this intake doc.

---

## 3. Why this template exists

- **L1 seed cannot be auto-inferred by AI.** Commerce entries name real merchants and real product pages. The only safe path is for the user to explicitly state candidate entries.
- **User must explicitly propose candidates.** Even after this template exists, AI may not invent a candidate row, may not guess merchant identity, may not derive `networkKey` / `merchantKey` from URL hostname patterns (per CLAUDE.md §3.1 commerce governance red-line).
- **Empty `[]` → non-empty is a state change requiring its own approval.** Today the production registry is empty. The first transition to a non-empty array is a load-bearing governance event:
  - First entry exposes the registry shape live in loader / validator / Admin selector.
  - First entry establishes a precedent for what "safe enough for first seed" means.
  - First entry is also the first row Admin commerce selector / preview UI will show with real content.
  - Therefore: filling in this template is a *proposal*, not an *apply*. The apply step requires its own phase boundary.
- **This template makes the future ask safer.** When user later says "here are commerce candidates," AI does not have to re-derive the field list, the role enum, the safe URL policy, or the red-line list — they are stated here.

---

## 4. Required candidate fields

Each candidate entry the user proposes should contain at minimum the following fields. **All fields are user-provided.** AI must not infer / guess / auto-fill any of these from URL or hostname.

### 4.1 `linkId`

- **Format**: lowercase kebab-case ASCII string; must be unique within the registry.
- **Purpose**: stable machine key used by `affiliate.links[].ref` in post frontmatter to point at this registry entry.
- **Acceptable examples**: `kingstone-atomic-habits`, `bookstw-quiet-power`, `publisher-acme-isbn-9789570000000`
- **Unacceptable examples**:
  - `Kingstone_AtomicHabits` (not lowercase kebab)
  - `id-1`, `id-2` (meaningless; not stable when the entry's identity changes)
  - any value containing tracking ids, customer ids, or affiliate session tokens
- **Will enter production registry?** Yes — this is the entry's primary key in `commerce-links.json`.
- **Will appear in Admin UI / snippet?** Yes — the snippet helper renders `ref: "<linkId>"`; the Admin selector preview row exposes `linkId` as the safe machine key.

### 4.2 `displayLabel`

- **Format**: human-readable short string suitable for end-user display (e.g., button label, link text).
- **Purpose**: the user-visible name of the destination (book store, publisher, library, etc.).
- **Acceptable examples**: `金石堂`, `博客來`, `台北市立圖書館`, `Publisher Official Page`
- **Unacceptable examples**:
  - internal codes (`internal-aff-channel-3`)
  - empty string (would trigger Admin selector to fall back to `linkId`, leaking machine key into UI)
  - values containing tracking parameters or campaign names
- **Will enter production registry?** Yes — stored as `displayLabel` on the entry.
- **Will appear in Admin UI / snippet?** Yes — Admin selector preview row uses this as the safe public label; if missing, falls back to `linkId` (never to `internalLabel` or `targetUrl`, per `active-commerce-links.js`).

### 4.3 `role`

- **Format**: one of the allowed enum values (see §5). lowercase kebab-case, case-sensitive.
- **Purpose**: semantic categorization of the link's function relative to the post's commerce intent.
- **Acceptable examples**: `primary`, `official`, `library`
- **Unacceptable examples**: `Primary`, `OFFICIAL`, `affiliate-main`, `other`, empty string
- **Will enter production registry?** **No.** `role` is a per-reference attribute that belongs in the post's `affiliate.links[].role`, *not* on the registry entry itself.
- **Will appear in Admin UI / snippet?** Yes — the snippet helper writes `role: "<role>"` into the YAML block the author pastes into the post.
- **Why we still collect it here**: C7 (`commerce-ref-missing-role`) source is not active, so role is currently *optional-but-recommended* in posts. Asking for a recommended role at intake time means the author has guidance ready when they reach the snippet step, and the C8 enum check (already live) will pass.

### 4.4 `targetUrl`

- **Format**: public HTTPS URL pointing at the destination page. Must satisfy §6 safe-URL policy.
- **Purpose**: the actual destination the end-user reaches when they click the rendered link.
- **Acceptable examples**: `https://bookstore.example.com/basic/<isbn>`, `https://books.example.org/products/<id>` (only if no tracking params), `https://publisher.example.net/book/<slug>`. **Note**: real merchant domains (e.g., actual Taiwanese bookstores, real publisher sites) may only be supplied **by the user** in the actual candidate list; this template-doc never contains real merchant domains in its illustrative examples.
- **Unacceptable examples**: see §6 in full. In short: anything containing tracking params, shorteners, tokens, login-required URLs, private Drive URLs, Google Form edit URLs, or admin/editor URLs.
- **Will enter production registry?** Yes — stored as `targetUrl` on the entry.
- **Will appear in Admin UI / snippet?** **No** — `active-commerce-links.js` deliberately excludes `targetUrl` from the Admin selector preview row (it is never echoed back to UI). The snippet helper similarly does not write `targetUrl` into the post (the post references the entry via `ref`, and the registry holds the URL).

### 4.5 `sourceReason` or `usageNote`

- **Format**: short free-text English or Traditional Chinese sentence (≤ 200 chars recommended).
- **Purpose**: human-readable note explaining *why* this URL is safe-for-first-seed. Used during the per-entry review step before the user authorizes a write into production registry.
- **Acceptable examples**:
  - `Public official product page on publisher site; no tracking params; verified 2026-06-08.`
  - `Public city library catalogue entry; no auth required; safe.`
- **Unacceptable examples**:
  - empty string
  - any sentence that itself contains a token, credential, account email, or private URL (the *reason* must not itself leak sensitive data)
- **Will enter production registry?** Optional — may be stored as `notes` on the entry, or kept only in the intake form and discarded at apply time. Decide per-entry; do not auto-promote intake `sourceReason` into `notes` without explicit user instruction.
- **Will appear in Admin UI / snippet?** No.

---

## 5. Allowed `role` enum

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

- **lowercase kebab-case**. Mixed case (`Primary`, `Official`) is rejected by C8 (`commerce-ref-invalid-role`).
- **case-sensitive**. `PRIMARY` and `primary` are different; only `primary` passes.
- **No synonyms** are accepted: `main`, `default`, `bookstore`, `vendor`, `other`, `official-link`, `price`, `pricecheck` are all rejected.
- **No empty string**. An empty `role` in source is C7 territory (currently NO-GO; missing role passes silently in source today). But for L1 *seed candidate intake*, user **must** propose a role per entry, even though C7 source is not yet enforcing missing-role.
- This enum is mirrored in `src/scripts/active-commerce-links.js` as `ALLOWED_COMMERCE_ROLES` (for Admin authoring guidance) and is the source of truth for C8 in `src/scripts/validate-content.js`. The two must not drift; today they happen to match.

Rationale for collecting `role` at intake even though C7 source is dormant: when user pastes the Admin snippet into a post, the snippet helper writes `role: "<role>"` based on what the author supplies. If the author hasn't thought about role until that moment, they may either omit it (currently C7 passes silently) or invent a value (C8 will flag it). Collecting role at intake makes the snippet step a no-think paste.

---

## 6. Safe `targetUrl` policy (first seed)

For the **first L1 seed entries**, prefer the most conservative URL form available for each destination. The first non-empty registry is high-visibility; later, more permissive URL forms can be considered per-entry through their own approval, but the first seed should be exemplary.

### 6.1 Acceptable URL forms

- **Official publisher product page** (e.g., publisher's own website, no affiliate program involved)
- **Bookstore public product page WITHOUT tracking params** (canonical URL only; strip all `utm_*`, `sid`, `aff_id`, `ref`, `tag`, `partner`, etc.)
- **Public library catalogue entry** (e.g., 台北市立圖書館 公開檢索頁)
- **Public direct manufacturer / brand page** for non-book commerce
- **Plain HTTPS only**; no HTTP.

### 6.2 Unacceptable URL forms

The following must not appear in `targetUrl` for first seed entries:

- **Affiliate tracking URLs** — any URL whose path or query carries affiliate ids, partner codes, commission codes, click-through tokens. (`?aff_id=`, `?partner=`, `?sid=`, `?tag=`, `?ref=`, `/aff/`, `/track/`, etc.)
- **URL shorteners** (bit.ly, lihi.cc, pse.is, t.co, goo.gl, etc.) — opaque destination, cannot be governance-reviewed, may rewrite over time.
- **Private preview / staging URLs** (private CMS preview, password-protected publisher pages, draft pages).
- **Login-required URLs** (URLs that 302 to a login page when opened in an incognito window).
- **Tokenized URLs** — URLs whose path or query contains a one-time token, session id, signed request, or expiring signature.
- **Google Drive private folder / file URLs** — anything under `drive.google.com/drive/folders/` or `drive.google.com/file/d/` that requires auth, even if "anyone with link can view" is set (still trackable through the requesting Google account).
- **Google Form edit URLs** (`docs.google.com/forms/d/<id>/edit`) — edit access is sensitive.
- **Respondent / customer data URLs** — any URL that lists per-user data (form responses, order history, customer detail pages).
- **Personal account URLs** — author's personal `/u/0/`-style URLs, account profile pages, dashboard pages.
- **Internal admin / editor URLs** — backend admin panels, content management UIs, billing dashboards.

If a candidate URL falls into a gray area (e.g., publisher's page has UTM params the publisher set themselves, not added by us), default to **rejecting for first seed**, strip what's strippable, and re-evaluate per-entry through a normal approval step.

---

## 7. Sensitive data red-line checklist

Independent of URL safety, the following content must **never** appear in:

- the repo (any file under version control),
- the production registry (`content/settings/commerce-links.json`),
- the sample registry (`content/settings/_sample.commerce-links.json`),
- any validation fixture or overlay,
- the intake form itself when committed.

Red-line list (mirrors and reinforces CLAUDE.md §3.1 commerce governance red-line):

- **Affiliate dashboard credentials** — email, password, OAuth client secret, API key, secret token
- **Access tokens** — bearer tokens, refresh tokens, session ids, Authorization headers
- **Merchant tracking ids** beyond what is intrinsic to a public URL (no API-side merchant ids, no commission ids, no payout reference ids)
- **Commission / payout / clickCount / conversion stats** — these belong in the affiliate dashboard, never in repo
- **Account email** used to log into the affiliate program
- **Settlement / bank / payout info** (routing numbers, account names, payout addresses)
- **Private Drive folder IDs** even if they look harmless — IDs are credentials-equivalent for shared assets
- **Google Form edit URLs** (`/edit` paths)
- **Respondent data** — any value derived from Google Form responses, including names, emails, phone numbers, school names, free-text answers, response timestamps tied to individuals
- **Customer data** — any per-customer order, address, payment info
- **Personal contact data** — phone, address, ID numbers, family member info

If the user, in a later session, drafts a candidate entry that contains any of the above, AI must **refuse to write** the entry into the registry, point at the offending field, and ask for a sanitized version. AI must not silently strip the sensitive value — the user must re-supply the sanitized form, because silent strip risks leaving residue (e.g., in `notes`, in commit message, in PR description).

---

## 8. Suggested user-provided format

When the user is ready to propose L1 seed candidates in a future session, paste a block of YAML in the conversation following this shape. This is a *proposal format only* — it is not a file to be written to disk, and it is not the registry shape. The conversion from intake YAML → registry entry happens in a separate, explicit apply step.

### 8.1 Template (placeholders only — do NOT use these as real entries)

```yaml
commerceSeedCandidates:
  - linkId: "example-official-product"
    displayLabel: "Example Official Product Page"
    role: "official"
    targetUrl: "https://example.com/public-product-page"
    sourceReason: "Public official page; no tracking params; safe for first seed review."

  - linkId: "example-library-catalogue"
    displayLabel: "Example Public Library Catalogue Entry"
    role: "library"
    targetUrl: "https://library.example.org/catalogue/item-id"
    sourceReason: "Public library catalogue; no auth; safe for first seed review."

  - linkId: "example-price-check"
    displayLabel: "Example Price Reference"
    role: "price-check"
    targetUrl: "https://store.example.com/product/canonical-id"
    sourceReason: "Bookstore product page with all tracking params stripped; verified canonical URL."
```

All values in the template above are placeholders using `example.com` / `example.org` / `library.example.org` / `store.example.com`. RFC 2606 reserves **only** the second-level domains `example.com` / `example.org` / `example.net` plus the TLDs `.example` / `.invalid` / `.test` / `.localhost`. Do **not** substitute any other TLD (no country-code TLDs, no real-government or real-organisation TLDs, no real merchant domains) into the placeholder URLs — only the above reserved namespaces are safe for template-doc examples. Replacing the reserved-namespace placeholders with real URLs is the user's job, in a later session, with real candidate entries.

### 8.2 Per-entry self-check (user fills in before submitting the block)

Before sending the candidate block, the user should be able to answer "yes" to all of these per entry:

- [ ] `linkId` is lowercase kebab-case and unique within this proposal.
- [ ] `displayLabel` is the human-readable name; no internal codes; no tracking ids.
- [ ] `role` is exactly one of `primary` / `alternate` / `official` / `price-check` / `library` / `direct`.
- [ ] `targetUrl` is plain HTTPS, public, no tracking params, no shortener, no token, no login required, no Drive folder, no Form edit URL.
- [ ] `sourceReason` does not itself contain any red-line sensitive data.
- [ ] None of the §7 red-line items are present anywhere in this entry.

---

## 9. What this template does NOT do

For clarity, restating:

- **Not** a registry write. `commerce-links.json` is unchanged.
- **Not** an L1 seed start. L1 seed start requires a separate phase with its own preanalysis.
- **Not** a renderer activation. Renderer remains dormant.
- **Not** an Admin Apply / middleware / admin-write-cli activation.
- **Not** a content migration trigger. Production posts using raw `url` are not migrated to `ref` by this template.
- **Not** a build / deploy / Blogger repost / GA4 validation trigger. pm-26 deploy gate remains BLOCKED.
- **Not** a green light to invent / auto-fill candidate entries. AI may not propose entries; only user may.

---

## 10. What happens next (out of scope for this phase)

Out of scope here; recorded so the next session knows what the natural next step is, without committing to do it:

1. **User proposes candidate entries** by pasting an `commerceSeedCandidates:` YAML block (per §8) in a future conversation.
2. **AI runs §4 / §5 / §6 / §7 / §8.2 checks on each entry** and reports per-entry pass/fail, *without writing anything*.
3. **User approves the cleaned set** explicitly. AI does not assume approval from the absence of objection.
4. **L1 seed phase opens**, with its own preanalysis covering registry write mechanics (which fields land where; whether `notes` is populated from `sourceReason`; what `updatedAt` value is used; whether the write goes through Admin Apply (currently dormant) or a one-shot bypass write per a separate explicit phase boundary).
5. **Post-write verification**: validator output should remain 0 errors; registry-level rules (R3–R14 against the new rows) should pass; Admin selector preview should render the new safe rows; content-ref rules (C-rules) remain at current state since no post yet uses `ref`.

Each of the above is a separate phase. None of them start because this template exists.

---

## 11. L1 / L2 / L3 / L4 ladder reminder

The commerce seed ladder is deliberately staged. Each rung is its own phase with its own preanalysis, its own approval, and its own acceptance:

| Rung | Scope | Modifies | This template's relation |
| --- | --- | --- | --- |
| **L1** | Candidate preflight — docs-only / read-only review of user-provided candidate entries against §4 / §5 / §6 / §7 / §8.2 | **Nothing** is written. Output is a per-entry pass/fail report. | This template **is the input form** for L1. Filling it does not start L1; L1 starts only when user pastes candidates and explicitly opens an L1 phase. |
| **L2** | Settings-only seed implementation | `content/settings/commerce-links.json` (`commerceLinks: []` → non-empty array of vetted entries). No source / renderer / content / build changes. | This template **is not** L2 and does not authorize an L2 write. L2 requires L1 to have passed, a separate L2 preanalysis, and explicit user approval. |
| **L3** | L2 seed acceptance — read-only cross-check of the L2 write | **Nothing** is written. Output is registry-shape, validator output, Admin selector preview, and red-line re-scan. | This template **is not** L3. L3 only runs after L2 has landed and been pushed. |
| **L4** | Renderer activation | source (`src/**`) — wires `affiliate.links[].ref` resolution into post detail render output; optionally enables C7 source. Possibly triggers production content migration (raw `url` → `ref`). | This template **is not** L4. L4 requires L3 acceptance, a separate L4 preanalysis, and explicit user approval. C7 source remains dormant until L4 (or its own dedicated phase). |

Explicit non-claims:

- This template **is not** an L1 execution result. L1 runs only when user submits candidates and authorizes the L1 phase.
- This template **is not** an L2 seed. `commerce-links.json` remains `commerceLinks: []` after this template lands.
- This template **is not** an L4 renderer activation. Renderer remains dormant. No post output changes because this template exists.

---

## 12. Final recommendation

- **After this template (or its docs-only correction) lands, recommend Final Idle Freeze / EXIT.** The next conversation has the form it needs; nothing else needs to happen until user provides candidates.
- **Do not auto-start L1.** AI must not preemptively run L1 checks against fabricated or guessed entries. L1 starts only when user explicitly pastes a `commerceSeedCandidates:` block (per §8) and asks for the L1 phase.
- **Wait for user-provided candidate entries.** No registry write, no L2 preanalysis, no L3, no L4, no C7 activation, no renderer activation, no Admin Apply, no production content migration, no deploy, no Blogger repost, no GA4 validation should be initiated based on this template alone.
- **Any future L1 phase must be independently authorized** by user with its own phase name, its own scope statement, and its own acceptance criteria — this template does not pre-authorize any of them.

---

## 13. References (read-only)

- `CLAUDE.md` §3.1 commerce registry governance red-line
- `docs/20260608-project-wide-status-checkpoint.md` — current project-wide status
- `docs/20260608-commerce-admin-snippet-helper-acceptance-checkpoint.md` — snippet helper acceptance
- `docs/20260608-commerce-registry-seed-governance-preanalysis.md` — registry seed governance plan
- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md` — original empty-registry phase analysis
- `content/settings/commerce-links.json` — production registry (empty)
- `content/settings/_sample.commerce-links.json` — sample blueprint (not loaded; placeholders only)
- `src/scripts/active-commerce-links.js` — Admin selector preview helper (safe fields only)
- `src/scripts/validate-content.js` — registry-level (R-rules) + content-ref (C-rules) validator

---

*End of intake template.*
