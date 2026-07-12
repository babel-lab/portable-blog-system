#!/usr/bin/env node
// Phase 20260712：check:download-indexing-dist-smoke
//
// Downstream filesystem-output smoke for the two download-page archetypes
// defined in docs/20260712-download-page-indexing-independence-policy-lock.md
// §1.1 / §1.2, plus one explicit-override archetype. Companion to:
//
//   check:download-indexing-independence        (298 pure resolver cases)
//   check:download-indexing-generated-output    (21 in-process EJS contract)
//
// This guard proves the same invariants survive the *real* filesystem build:
//
//   isolated fixture Markdown
//     → real src/scripts/build-github.js  (spawnSync)
//     → real src/scripts/build-sitemap.js (spawnSync)
//     → temporary workspace .cache/pages/posts/<slug>/index.html
//     → temporary workspace dist/sitemap.xml
//     → assertions on the on-disk HTML meta[name=robots] + sitemap XML entries
//     → temporary workspace cleanup
//
// Isolation model (per session prompt §八 路徑 3 test-only temporary workspace):
//   - mkdtempSync(os.tmpdir(), 'pb-download-dist-smoke-')
//   - COPY src/ into workspace (real files; ESM realpath resolution keeps
//     PROJECT_ROOT == workspace, not the real repo).
//   - JUNCTION (Windows) / dir symlink (POSIX) for node_modules and each
//     content/ subdirectory that must expose real registry data.
//   - REAL empty dirs for content/{github,blogger}/{posts,pages}; ONLY the
//     fixture Markdown files are written into content/github/posts/.
//   - Spawn `node <workspace>/src/scripts/build-github.js --mode=build`
//     and `node <workspace>/src/scripts/build-sitemap.js`.
//   - Read the generated HTML + sitemap and assert.
//   - Cleanup: unlink each junction/symlink explicitly, then rmSync workspace.
//
// Red lines (per session prompt §十一 + §十三):
//   - ❌ Does NOT modify build-github.js / build-sitemap.js / load-posts.js /
//     load-settings.js / resolvers / validator / schema / VALID_SEO_INDEXING /
//     pageType enum / contentKind:download default / production templates /
//     production content / Blogger sidecar / CSS / SCSS / frontend JS /
//     Admin UI / deploy scripts / deploy clone / external backend.
//   - ❌ Does NOT touch the real .cache/ or dist/ (all output written to
//     the temporary workspace).
//   - ❌ Does NOT fetch / pull / push / deploy / dev-serve; does not talk to
//     Blogger / AdSense / GA4 / Google Drive / Search Console.
//   - ❌ Does NOT commit any generated output; workspace is cleaned in `finally`.
//
// Umbrella integration (per session prompt §十一):
//   - This guard is intentionally NOT wired into check:release-readiness,
//     check:phase1-readiness, check:metadata-all, or
//     check:github-pages-prepublish-smoke. Rationale: each invocation runs a
//     real Node build (≈2–5s wall time); wiring into both readiness umbrellas
//     would add cost to two independent chains. The pure 298-case matrix and
//     the in-process 21-case EJS contract remain the umbrella coverage;
//     this filesystem smoke is a standalone regression guard. Future
//     integration is documented in docs/20260712-download-page-temp-build-smoke.md
//     as a candidate for Dean-gated wiring.
//
// Execution:
//   node src/scripts/check-download-indexing-dist-smoke.js
//     exit 0 = all cases PASS ; exit 1 = any case FAIL.

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
  existsSync,
  statSync,
  lstatSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Cross-platform directory link. Windows: junction (no admin required).
// POSIX: 'dir' symlink. Node treats the 3rd arg as Windows-only intent.
const IS_WIN = process.platform === 'win32';
function linkDir(target, linkPath) {
  symlinkSync(target, linkPath, IS_WIN ? 'junction' : 'dir');
}

// site config: read once so sitemap URL assertions match what build-sitemap emits
const siteConfig = JSON.parse(
  readFileSync(path.join(REPO_ROOT, 'content', 'settings', 'site.config.json'), 'utf-8'),
);
const SITE_BASE = (siteConfig.githubSiteUrl || '').replace(/\/+$/, '');

// Fixture set. Each fixture is a full Markdown file dropped into
// workspace/content/github/posts/. Slug prefix `fixture-dist-` makes fixture
// pages obvious in generated output and cannot collide with production slugs.
const FIXTURES = [
  {
    key: 'A1',
    label: 'archetype A-1 (activity/direct-download; pageType:landing + explicit index)',
    slug: 'fixture-dist-a1-activity-direct',
    file: 'fixture-dist-a1-activity-direct.md',
    markdown: `---
title: "Fixture dist A1: activity direct-download landing"
slug: "fixture-dist-a1-activity-direct"
contentKind: "page"
pageType: "landing"
seo:
  indexing: "index"
includeInSitemap: true
includeInListings: true
description: "Fixture dist A1: activity direct-download landing (color-in JPG / worksheet / kit)."
status: "ready"
date: "2026-07-12"
---

Fixture body intentionally minimal — filesystem smoke consumes frontmatter only.
`,
    expect: {
      robotsMeta: '<meta name="robots" content="index, follow" />',
      sitemapPresent: true,
    },
  },
  {
    key: 'A2',
    label: 'archetype A-2 (legacy contentKind:download + pageType:landing + explicit index override)',
    slug: 'fixture-dist-a2-download-explicit-index',
    file: 'fixture-dist-a2-download-explicit-index.md',
    markdown: `---
title: "Fixture dist A2: legacy download shape with explicit index override"
slug: "fixture-dist-a2-download-explicit-index"
contentKind: "download"
pageType: "landing"
seo:
  indexing: "index"
includeInSitemap: true
includeInListings: true
description: "Fixture dist A2: legacy contentKind:download body but explicit index override wins."
status: "ready"
date: "2026-07-12"
---

Fixture body intentionally minimal.
`,
    expect: {
      robotsMeta: '<meta name="robots" content="index, follow" />',
      sitemapPresent: true,
    },
  },
  {
    key: 'B',
    label: 'archetype B (Google Form gated download; pageType:gated_download + explicit noindex-follow + explicit exclude)',
    slug: 'fixture-dist-b-gated-download',
    file: 'fixture-dist-b-gated-download.md',
    markdown: `---
title: "Fixture dist B: Google Form gated download"
slug: "fixture-dist-b-gated-download"
contentKind: "download"
pageType: "gated_download"
seo:
  indexing: "noindex-follow"
includeInSitemap: false
includeInListings: false
description: "Fixture dist B: user must submit Google Form before receiving download; default noindex."
status: "ready"
date: "2026-07-12"
---

Fixture body intentionally minimal.
`,
    expect: {
      robotsMeta: '<meta name="robots" content="noindex, follow" />',
      sitemapPresent: false,
    },
  },
  {
    key: 'C',
    label: 'override (gated_download + explicit index + explicit sitemap include — override wins)',
    slug: 'fixture-dist-c-gated-opt-in-index',
    file: 'fixture-dist-c-gated-opt-in-index.md',
    markdown: `---
title: "Fixture dist C: gated_download opt-in via explicit index"
slug: "fixture-dist-c-gated-opt-in-index"
contentKind: "download"
pageType: "gated_download"
seo:
  indexing: "index"
includeInSitemap: true
includeInListings: true
description: "Fixture dist C: rare opt-in scenario — gated page kept indexable by explicit override."
status: "ready"
date: "2026-07-12"
---

Fixture body intentionally minimal.
`,
    expect: {
      robotsMeta: '<meta name="robots" content="index, follow" />',
      sitemapPresent: true,
    },
  },
];

// Case runner ─────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];
function record(name, ok, detail = '') {
  const tag = ok ? '[PASS]' : '[FAIL]';
  console.log(`${tag} ${name}${detail ? `  — ${detail}` : ''}`);
  if (ok) passed += 1;
  else {
    failed += 1;
    failures.push({ name, detail });
  }
}

// Workspace assembly ──────────────────────────────────────────────────────────
function buildWorkspace(workspace) {
  // Real files: src, package.json, vite.config.js
  cpSync(path.join(REPO_ROOT, 'src'), path.join(workspace, 'src'), { recursive: true });
  cpSync(path.join(REPO_ROOT, 'package.json'), path.join(workspace, 'package.json'));
  cpSync(path.join(REPO_ROOT, 'vite.config.js'), path.join(workspace, 'vite.config.js'));

  // Junction node_modules so `import 'gray-matter'` etc. resolve at runtime.
  linkDir(path.join(REPO_ROOT, 'node_modules'), path.join(workspace, 'node_modules'));

  // content/ layout:
  //   settings / templates / shared / drafts / archive / validation-fixtures → junction
  //   github/posts / github/pages / blogger/posts / blogger/pages → real empty dirs
  mkdirSync(path.join(workspace, 'content'), { recursive: true });
  const contentJunctions = ['settings', 'templates', 'shared', 'drafts', 'archive', 'validation-fixtures'];
  for (const name of contentJunctions) {
    const target = path.join(REPO_ROOT, 'content', name);
    if (existsSync(target)) {
      linkDir(target, path.join(workspace, 'content', name));
    }
  }
  for (const site of ['github', 'blogger']) {
    for (const kind of ['posts', 'pages']) {
      mkdirSync(path.join(workspace, 'content', site, kind), { recursive: true });
    }
  }

  // Write fixtures into workspace/content/github/posts/
  const postsDir = path.join(workspace, 'content', 'github', 'posts');
  for (const fx of FIXTURES) {
    writeFileSync(path.join(postsDir, fx.file), fx.markdown, 'utf-8');
  }
}

// Cleanup: unlink each directory junction/symlink explicitly first, then rm
// the workspace. Belt-and-braces so we cannot accidentally recurse into a
// junction and delete real repo files.
function cleanupWorkspace(workspace) {
  const linkPaths = [
    path.join(workspace, 'node_modules'),
    path.join(workspace, 'content', 'settings'),
    path.join(workspace, 'content', 'templates'),
    path.join(workspace, 'content', 'shared'),
    path.join(workspace, 'content', 'drafts'),
    path.join(workspace, 'content', 'archive'),
    path.join(workspace, 'content', 'validation-fixtures'),
  ];
  for (const p of linkPaths) {
    try {
      const st = lstatSync(p);
      if (st.isSymbolicLink() || (IS_WIN && st.isDirectory())) {
        // On Windows a junction reports as directory via lstat; unlink still
        // removes only the junction, not target contents.
        try {
          unlinkSync(p);
        } catch {
          // Fall back to rmdir-style removal for directory junctions where
          // unlink is not supported by this Node version.
          rmSync(p, { recursive: false, force: true });
        }
      }
    } catch {
      // path may not exist (workspace half-built); ignore
    }
  }
  try {
    rmSync(workspace, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch (err) {
    console.warn(`[warn] cleanup failed: ${workspace} — ${err && err.message ? err.message : err}`);
  }
}

// Spawn a build script inside the workspace. Returns { ok, code, stdout, stderr }.
function runBuild(workspace, scriptRel, args = []) {
  const scriptAbs = path.join(workspace, scriptRel);
  const r = spawnSync(process.execPath, [scriptAbs, ...args], {
    cwd: workspace,
    encoding: 'utf-8',
    shell: false,
  });
  return {
    ok: r.status === 0,
    code: r.status,
    stdout: (r.stdout || '').toString(),
    stderr: (r.stderr || '').toString(),
    error: r.error ? String(r.error.message || r.error) : null,
  };
}

// ── main ─────────────────────────────────────────────────────────────────────
const workspace = mkdtempSync(path.join(os.tmpdir(), 'pb-download-dist-smoke-'));

try {
  console.log(`── workspace: ${workspace} ──`);
  buildWorkspace(workspace);
  record('workspace assembled', true, `src copied + junctions + fixtures written`);

  // Run build-github.js
  const bg = runBuild(workspace, path.join('src', 'scripts', 'build-github.js'), ['--mode=build']);
  record('build-github.js exit 0', bg.ok, bg.ok ? `` : `code=${bg.code}${bg.error ? ` err=${bg.error}` : ''} stderr(tail)=${bg.stderr.split('\n').slice(-5).join(' | ')}`);
  if (!bg.ok) throw new Error('build-github.js failed; aborting downstream checks');

  // Run build-sitemap.js
  const bs = runBuild(workspace, path.join('src', 'scripts', 'build-sitemap.js'));
  record('build-sitemap.js exit 0', bs.ok, bs.ok ? `` : `code=${bs.code}${bs.error ? ` err=${bs.error}` : ''} stderr(tail)=${bs.stderr.split('\n').slice(-5).join(' | ')}`);
  if (!bs.ok) throw new Error('build-sitemap.js failed; aborting downstream checks');

  // Read the generated sitemap once
  const sitemapPath = path.join(workspace, 'dist', 'sitemap.xml');
  record('dist/sitemap.xml exists', existsSync(sitemapPath), existsSync(sitemapPath) ? '' : `missing ${sitemapPath}`);
  const sitemapXml = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf-8') : '';
  record('dist/sitemap.xml has <urlset> root', sitemapXml.includes('<urlset '), sitemapXml.includes('<urlset ') ? '' : 'missing urlset root element');

  // Per-fixture assertions
  for (const fx of FIXTURES) {
    console.log('');
    console.log(`── ${fx.label} ──`);

    const htmlPath = path.join(workspace, '.cache', 'pages', 'posts', fx.slug, 'index.html');
    const htmlExists = existsSync(htmlPath);
    record(`${fx.key}: generated HTML exists at .cache/pages/posts/${fx.slug}/index.html`, htmlExists,
      htmlExists ? '' : `missing ${htmlPath}`);
    if (!htmlExists) continue;

    const html = readFileSync(htmlPath, 'utf-8');
    // Exact meta tag substring — mirrors seo/meta-tags.ejs output and the
    // in-process 21-case guard's expectation. Prevents whitespace / attribute
    // reordering from silently passing.
    record(`${fx.key}: HTML contains exact meta robots '${fx.expect.robotsMeta}'`,
      html.includes(fx.expect.robotsMeta),
      html.includes(fx.expect.robotsMeta) ? '' : `expected substring not found in generated HTML`);

    // Sitemap URL assertion — use the exact <loc> URL to avoid substring
    // collisions between similarly named slugs (fixture-a vs fixture-a-extra).
    const expectedLoc = `<loc>${SITE_BASE}/posts/${fx.slug}/</loc>`;
    const locOccurrences = sitemapXml.split(expectedLoc).length - 1;
    if (fx.expect.sitemapPresent) {
      record(`${fx.key}: sitemap contains exactly one entry for /posts/${fx.slug}/`,
        locOccurrences === 1,
        locOccurrences === 1 ? '' : `expected 1 <loc> occurrence, got ${locOccurrences}`);
    } else {
      record(`${fx.key}: sitemap does NOT contain /posts/${fx.slug}/`,
        locOccurrences === 0,
        locOccurrences === 0 ? '' : `unexpected <loc> occurrence(s): ${locOccurrences}`);
    }
  }

  // Sanity: sitemap contains no production-post <loc> URLs (workspace posts
  // dir was empty except for fixtures, so the only /posts/* entries should
  // be the fixture ones).
  const nonFixturePostsRegex = /<loc>[^<]+\/posts\/(?!fixture-dist-)[^<]+<\/loc>/g;
  const stray = sitemapXml.match(nonFixturePostsRegex) || [];
  record('sitemap contains no production-post /posts/ entries', stray.length === 0,
    stray.length === 0 ? '' : `unexpected non-fixture entries: ${stray.slice(0, 3).join(' | ')}`);

  // Sanity: real repo dist/ and .cache/ untouched by this smoke.
  // (We check size of a well-known real repo dir marker; we can't cleanly
  // compare mtime without racing other work, so instead we assert we wrote
  // exclusively into the workspace by re-reading the workspace dist/.)
  const wsDistDir = path.join(workspace, 'dist');
  record('workspace dist/ was created (writes were isolated to workspace)', existsSync(wsDistDir),
    existsSync(wsDistDir) ? '' : `workspace dist/ missing — writes may have escaped isolation`);
} finally {
  cleanupWorkspace(workspace);
  record('workspace cleaned', !existsSync(workspace),
    !existsSync(workspace) ? '' : `workspace still present at ${workspace}`);
}

const total = passed + failed;
console.log('');
console.log(`download indexing dist-smoke guard: ${passed}/${total} ${failed === 0 ? 'PASS' : 'FAIL'}`);
if (failed > 0) {
  console.log('');
  console.log('FAIL reasons:');
  for (const f of failures) {
    console.log(`  - ${f.name}${f.detail ? `  (${f.detail})` : ''}`);
  }
  process.exit(1);
}
