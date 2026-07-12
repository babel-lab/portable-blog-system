# Download page temp-build filesystem smoke — 2026-07-12

Additive test-only slice: adds `check:download-indexing-dist-smoke`, a
downstream filesystem-output guard that runs the *real* GitHub Pages /
sitemap builder against isolated fixtures in an OS temp workspace and
asserts on the generated HTML and `sitemap.xml`.

## Baseline

- Repo: `/d/github/blog-new/portable-blog-system`
- Branch: `main`
- Source HEAD before slice: `624d74be56509982efdf7e3f99a20d717410fdf9`
  (subject `test(content): cover download page generated output`)
- Deploy clone: `origin/gh-pages = 1170e7e`, untouched.
- Working tree clean, ahead/behind 0/0, `.git/index.lock` absent.

## Existing coverage before this slice

Four layers already protected download-page indexing:

1. **Policy lock** — `docs/20260712-download-page-indexing-independence-policy-lock.md`
2. **`check:download-indexing-independence`** — 298 pure resolver cases
   (`resolvePostDetailRobots` × `shouldIncludeInSitemap` × `shouldIncludeInListings`).
3. **`check:metadata-all-contract`** — umbrella wiring contract.
4. **`check:download-indexing-generated-output`** — 21 in-process EJS
   generated-output cases: exercises `matter() → normalizePostOutput() →
   resolvers → ejs.renderFile(seo/meta-tags.ejs)` end-to-end in memory.

None of those invoke the real build command, produce a filesystem output
directory, or read a real `sitemap.xml` back from disk. This slice closes
that gap.

## What the new smoke covers

- Real `node src/scripts/build-github.js --mode=build` invocation.
- Real `node src/scripts/build-sitemap.js` invocation.
- Reads back `.cache/pages/posts/<slug>/index.html` from disk.
- Reads back `dist/sitemap.xml` from disk.
- Asserts `<meta name="robots" content="...">` exact substring for each
  fixture and exact `<loc>` sitemap presence / absence.

## What the smoke deliberately does not cover

- `robots.txt` is not asserted as a per-page indexing signal. Per-page
  `noindex` lives in the page's own `<meta name="robots">`; the
  site-wide `robots.txt` says nothing about which individual URLs are
  indexed. The smoke asserts sitemap membership + per-page meta separately.
- Listing artifacts (home / post-list / category / tag) are not
  filesystem-asserted; SP-4a listing invariants remain covered by the
  298-case pure guard and the 21-case in-process guard. Adding
  listing-HTML string assertions would duplicate coverage without
  strengthening the filesystem path.

## Fixture pipeline

```
isolated fixture Markdown (inline in guard, written to temp workspace)
  → real src/scripts/build-github.js  (spawnSync in workspace cwd)
  → real src/scripts/build-sitemap.js (spawnSync in workspace cwd)
  → <workspace>/.cache/pages/posts/<slug>/index.html
  → <workspace>/dist/sitemap.xml
  → filesystem assertions
  → workspace cleanup (unlink junctions, then rmSync)
```

Four fixtures, all `fixture-dist-*` slug prefix to avoid any risk of
collision with production slugs:

| Key | Fixture | Expected robots meta        | Expected sitemap |
| --- | ------- | --------------------------- | ---------------- |
| A1  | activity/direct-download (`pageType: landing`, explicit `index`) | `index, follow`   | present |
| A2  | legacy `contentKind: download` + `pageType: landing` + explicit `index` override | `index, follow`   | present |
| B   | Google Form gated (`pageType: gated_download`, explicit `noindex-follow`, excludes) | `noindex, follow` | absent  |
| C   | gated + explicit `index` override + explicit sitemap include | `index, follow`   | present |

Plus global sanity assertions: sitemap has `<urlset>` root, sitemap
contains no non-`fixture-dist-` `/posts/` entries, workspace `dist/`
exists (confirms writes were isolated).

Total: 20 case labels. Baseline: **20/20 PASS**.

## Isolation model

`mkdtempSync(os.tmpdir(), 'pb-download-dist-smoke-')` → `WORKSPACE`.

Workspace layout:

```
WORKSPACE/
  src/                  <- cpSync from repo (real copied files; ESM realpath
                           resolution keeps PROJECT_ROOT == WORKSPACE)
  package.json          <- cpSync
  vite.config.js        <- cpSync
  node_modules          <- junction (Win) / dir symlink (POSIX) → real
  content/
    settings/           <- junction → real (site.config, categories, tags, ...)
    templates/          <- junction → real
    shared/             <- junction → real
    drafts/             <- junction → real
    archive/            <- junction → real
    validation-fixtures <- junction → real
    github/
      posts/            [REAL empty dir; ONLY fixture .md dropped here]
      pages/            [REAL empty dir]
    blogger/
      posts/            [REAL empty dir]
      pages/            [REAL empty dir]
```

Why copy `src/` instead of junctioning it: Node ESM resolves symlinks
via `realpath` by default, which would rebind `import.meta.url` back to
the real repo path and defeat the isolation. Copying (~2.5 MB) is fast
and keeps `PROJECT_ROOT` inside the workspace.

Why junction `node_modules`: package resolution doesn't care about
paths; junctions on Windows require no admin privileges.

## Cleanup safety

Cleanup unlinks every directory junction/symlink explicitly first
(belt-and-braces), then `rmSync(workspace, { recursive: true, force: true })`.
This prevents any theoretical recursion into a junction from touching
real repo files. The final `[PASS] workspace cleaned` case asserts the
temp path no longer exists.

## Umbrella integration — deferred

This guard is intentionally **not** wired into:

- `check:release-readiness`
- `check:phase1-readiness`
- `check:metadata-all`
- `check:github-pages-prepublish-smoke`

Rationale: each invocation runs a real Node build (~2–5 s wall time).
Wiring into both readiness umbrellas would add cost to two independent
chains; and the 298 + 21 case coverage in the umbrella is already
exhaustive at the resolver / EJS layer. The filesystem smoke is a
standalone regression guard against real builder / EJS emitter drift.

Future integration into `check:github-pages-prepublish-smoke` (the most
natural home) is a candidate for a Dean-gated follow-up phase. If wired,
add a `check:github-pages-prepublish-smoke-contract` fragment (does not
exist today) to lock the wiring, and record execution-cost impact.

## Execution cost

Local wall time on Windows 11 / SSD ≈ 4–6 seconds per run. Dominated by
`node src/scripts/build-github.js` (loads settings + loads posts + runs
validate-content + renders all pages via EJS + writes `.cache/pages/`).

## Guard rails maintained

- ❌ No modification of `page-type-robots.js`, `include-in-sitemap.js`,
  `include-in-listings.js`, `normalizePostOutput()` semantics,
  `load-posts.js` production behavior, schema, validator,
  `VALID_SEO_INDEXING`, `pageType` enum, `contentKind:download` default,
  production templates, production content, Blogger sidecar, CSS, SCSS,
  frontend JS, Admin UI, deploy scripts, or deploy clone.
- ❌ No `git push` / rebase / reset / amend / force operations.
- ❌ No Blogger / AdSense / GA4 / Google Drive / Search Console access.
- ❌ No touch to real repo `.cache/` or `dist/`; every write lands in
  the OS temp workspace which is destroyed in `finally`.
- ✅ Baselines carried forward:
  - `validate:content` = 0 / 135 / 107.
  - `check:blogger-backfill` = scanned 12 / candidates 7 / complete 0 /
    missing 7 / skipped 5 (report-only; exit 0).
  - `check:download-indexing-independence` = 298 / 298.
  - `check:download-indexing-generated-output` = 21 / 21.
  - `check:metadata-all-contract` = 21 / 21.
  - `check:release-readiness-contract` = 14 / 14.
  - `check:phase1-readiness-contract` = 23 / 23.
  - `check:github-pages-prepublish-smoke` = 8 / 8.
  - `check:npm-script-targets` = 56 → **57** (auto-grows on script add).

## Builder gap discovered

None. Both `build-github.js` and `build-sitemap.js` ran to completion
against isolated fixtures in a workspace where `PROJECT_ROOT` resolved
to the temp workspace root, with no changes to builder source. No
production runtime or API modification was required.

## Files added / touched

- **Added** `src/scripts/check-download-indexing-dist-smoke.js` — new guard.
- **Added** `docs/20260712-download-page-temp-build-smoke.md` — this ledger.
- **Modified** `package.json` — one new script registration:
  `check:download-indexing-dist-smoke`.

No other files touched.
