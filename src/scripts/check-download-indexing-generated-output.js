#!/usr/bin/env node
// Phase 20260712：check:download-indexing-generated-output
//
// End-to-end generated-output contract guard for the two download-page archetypes
// defined in docs/20260712-download-page-indexing-independence-policy-lock.md §1.1
// and §1.2. Companion to check:download-indexing-independence (pure resolver matrix,
// 298 cases). This guard proves that the same invariants survive the real transform
// chain:
//
//   inline frontmatter YAML
//     → gray-matter parse                (mirrors load-posts.js processMarkdownEntry)
//     → normalizePostOutput               (mirrors load-posts.js entry.normalized)
//     → resolvePostDetailRobots           (mirrors build-github.js buildSeoForPostDetail)
//     → shouldIncludeInSitemap            (mirrors build-sitemap.js buildEntries filter)
//     → shouldIncludeInListings           (mirrors build-github.js listings filter)
//     → ejs.renderFile(seo/meta-tags.ejs) (real EJS partial used by build-github.js)
//     → <meta name="robots" content="..."> assertions on the rendered HTML string
//
// Binding / red lines (per session prompt §十一 + docs §4.4):
//   - ❌ Does NOT import build-github.js / build-sitemap.js / build-blogger.js
//     (their top-level main() would trigger a real build on import).
//   - ❌ Does NOT modify content/ / frontmatter / sidecar / registry / package /
//     schema / resolver semantics / validator rules / EJS / SCSS / dist / deploy clone.
//   - ❌ Does NOT create fixture files on disk; fixtures are inline strings so
//     validate:content baseline stays 0 / 135 / 107.
//   - ❌ Does NOT fetch / pull / build / deploy / push / dev-serve / talk to
//     Blogger / AdSense / GA4 / Google Drive / Search Console.
//   - ✅ Runs in memory, pure-read of seo/meta-tags.ejs, exits 0 on full PASS.
//
// Umbrella integration:
//   - Registered in check:metadata-all (executed once via check:release-readiness).
//   - NOT registered in check:phase1-readiness (avoids double-run; per prompt §十).
//
// Execution:
//   node src/scripts/check-download-indexing-generated-output.js
//     exit 0 = all cases PASS ; exit 1 = any case FAIL.

import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';
import ejs from 'ejs';

import { normalizePostOutput } from './normalize-post-output.js';
import { resolvePostDetailRobots } from './page-type-robots.js';
import { shouldIncludeInSitemap } from './include-in-sitemap.js';
import { shouldIncludeInListings } from './include-in-listings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const VIEWS_DIR = path.join(REPO_ROOT, 'src', 'views');
const META_TAGS_EJS = path.join(VIEWS_DIR, 'seo', 'meta-tags.ejs');

const DEFAULT_ROBOTS = 'index, follow';

// Inline fixtures. Kept as verbatim frontmatter strings so gray-matter is exercised
// with production-shaped YAML (not hand-built objects). Each fixture maps to an
// archetype documented in the policy lock and states the expected downstream
// robots / sitemap / listings behavior + the exact <meta name="robots"> string
// that must appear in the rendered EJS partial.
const FIXTURES = [
  {
    key: 'A1',
    label: 'archetype A-1 (activity/direct-download; pageType:landing + explicit index)',
    frontmatter: `---
title: "Fixture A1: activity direct-download landing"
slug: "fixture-a1-activity-direct"
contentKind: "page"
pageType: "landing"
seo:
  indexing: "index"
includeInSitemap: true
includeInListings: true
description: "Fixture: activity direct-download landing page (color-in JPG, activity worksheet, pirate-ship kit)."
status: "ready"
date: "2026-07-12"
---
Body content intentionally minimal — the pipeline under test consumes frontmatter only.
`,
    expect: {
      robots: 'index, follow',
      sitemap: true,
      listings: true,
      metaTagLine: '<meta name="robots" content="index, follow" />',
    },
  },
  {
    key: 'A2',
    label:
      'archetype A-2 (legacy contentKind:download + pageType:landing + explicit index override)',
    frontmatter: `---
title: "Fixture A2: legacy download shape with explicit index override"
slug: "fixture-a2-download-explicit-index"
contentKind: "download"
pageType: "landing"
seo:
  indexing: "index"
includeInSitemap: true
includeInListings: true
description: "Fixture: legacy contentKind:download body but explicit index — override wins over SEO-1 safety."
status: "ready"
date: "2026-07-12"
---
Body ignored.
`,
    expect: {
      robots: 'index, follow',
      sitemap: true,
      listings: true,
      metaTagLine: '<meta name="robots" content="index, follow" />',
    },
  },
  {
    key: 'B',
    label:
      'archetype B (Google Form gated download; pageType:gated_download + explicit noindex-follow + explicit exclude)',
    frontmatter: `---
title: "Fixture B: Google Form gated download"
slug: "fixture-b-gated-download"
contentKind: "download"
pageType: "gated_download"
seo:
  indexing: "noindex-follow"
includeInSitemap: false
includeInListings: false
description: "Fixture: user must submit Google Form before receiving download; default noindex."
status: "ready"
date: "2026-07-12"
---
Body ignored.
`,
    expect: {
      robots: 'noindex, follow',
      sitemap: false,
      listings: false,
      metaTagLine: '<meta name="robots" content="noindex, follow" />',
    },
  },
  {
    key: 'C',
    label:
      'override case (gated_download + explicit index + explicit include-in-* true — override wins)',
    frontmatter: `---
title: "Fixture C: gated_download opt-in via explicit index"
slug: "fixture-c-gated-opt-in-index"
contentKind: "download"
pageType: "gated_download"
seo:
  indexing: "index"
includeInSitemap: true
includeInListings: true
description: "Fixture: rare opt-in scenario — gated page kept indexable by explicit seo.indexing."
status: "ready"
date: "2026-07-12"
---
Body ignored.
`,
    expect: {
      robots: 'index, follow',
      sitemap: true,
      listings: true,
      metaTagLine: '<meta name="robots" content="index, follow" />',
    },
  },
];

// Case runner ────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failed += 1;
    failures.push({ name, message: err.message });
    console.log(`[FAIL] ${name} :: ${err.message}`);
  }
}

// Pipeline (mirrors load-posts.js → build-github.js post-detail slice) ───────
async function runFixture(fixture) {
  const { data, content } = matter(fixture.frontmatter);

  // load-posts.js processMarkdownEntry step: contentKind ?? type fallback.
  const normalizedData = { ...data, contentKind: data.contentKind ?? data.type };

  // load-posts.js entry shape (empty sidecars for inline fixture).
  const entry = {
    ...normalizedData,
    sourcePath: `__inline_fixture_${fixture.key}__`,
    sourceCollection: 'posts',
    bodyLength: content.length,
    body: content,
    sidecars: {
      publish: { exists: false, path: null, issues: [] },
      facebook: { exists: false, path: null, data: null, body: null, issues: [] },
    },
  };
  entry.normalized = normalizePostOutput(entry, {}, { deriveGithubUrl: false });

  const post = entry;

  // build-github.js buildSeoForPostDetail → resolvePostDetailRobots
  const seoRobots = resolvePostDetailRobots(post, DEFAULT_ROBOTS);
  // build-sitemap.js buildEntries → shouldIncludeInSitemap
  const sitemapIncluded = shouldIncludeInSitemap(post);
  // build-github.js listing filter → shouldIncludeInListings
  const listingsIncluded = shouldIncludeInListings(post);

  // build-github.js commonSeo produces seo.robots; renderHeadPartials feeds
  // the whole data object to each partial, so we mirror that shape here.
  const html = await ejs.renderFile(
    META_TAGS_EJS,
    {
      seo: { robots: seoRobots },
      description: post.description || '',
      site: { author: null },
    },
    { async: true },
  );

  return { post, seoRobots, sitemapIncluded, listingsIncluded, html };
}

async function main() {
  console.log('── seo/meta-tags.ejs source available ──');
  check('seo/meta-tags.ejs exists at expected path', () => {
    assert.ok(
      existsSync(META_TAGS_EJS),
      `expected EJS partial at ${path.relative(REPO_ROOT, META_TAGS_EJS)}`,
    );
  });

  for (const fx of FIXTURES) {
    console.log('');
    console.log(`── ${fx.label} ──`);

    let result;
    try {
      result = await runFixture(fx);
    } catch (err) {
      failed += 1;
      failures.push({ name: `${fx.key}: pipeline threw`, message: err.message });
      console.log(`[FAIL] ${fx.key}: pipeline threw :: ${err.message}`);
      continue;
    }

    check(`${fx.key}: resolvePostDetailRobots → "${fx.expect.robots}"`, () => {
      assert.equal(result.seoRobots, fx.expect.robots);
    });
    check(`${fx.key}: shouldIncludeInSitemap → ${fx.expect.sitemap}`, () => {
      assert.equal(result.sitemapIncluded, fx.expect.sitemap);
    });
    check(`${fx.key}: shouldIncludeInListings → ${fx.expect.listings}`, () => {
      assert.equal(result.listingsIncluded, fx.expect.listings);
    });
    check(
      `${fx.key}: rendered HTML contains exact meta tag "${fx.expect.metaTagLine}"`,
      () => {
        assert.ok(
          result.html.includes(fx.expect.metaTagLine),
          `expected substring not found. rendered:\n${result.html}`,
        );
      },
    );
    check(`${fx.key}: rendered HTML non-empty (EJS render succeeded)`, () => {
      assert.ok(
        result.html.trim().length > 0,
        `rendered HTML is empty for fixture ${fx.key}`,
      );
    });
  }

  // Summary ────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('');
  console.log(
    `download indexing generated-output guard: ${passed}/${total} ${failed === 0 ? 'PASS' : 'FAIL'}`,
  );
  if (failed > 0) {
    console.log('');
    console.log('FAIL reasons:');
    for (const f of failures) {
      console.log(`  - ${f.name}  (${f.message})`);
    }
    process.exit(1);
  }
}

await main();
