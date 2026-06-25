#!/usr/bin/env node
// Phase 20260616-admin-validation-reporter-script-implementation-a
//   read-only validation reporter — serialises validateContent() output to JSON.
//
//   Implements the schema (§C) + per-post join contract (§D) + class mapping (§C.4)
//   locked in docs/20260616-admin-validation-report-schema-and-join-contract-preanalysis.md
//   (pm-14, human-accepted read-only).
//
//   Design boundaries (strict):
//   - validator = ground truth: imports validateContent() AS-IS; does NOT change any rule,
//     severity, or exit semantics. This script re-runs the SAME load sequence as the
//     validate-content.js CLI main() and serialises the returned issues.
//   - reporter = pure serialisation: no rule re-judgement; class mapping is a view-side
//     convention only (§C.4) and never alters validator output.
//   - read-only w.r.t. the repo: the ONLY write target is .cache/data/validation-report.json,
//     a git-ignored cache (.cache/ is in .gitignore). Does NOT touch admin / content / settings.
//   - secret red line (§F): issue values may contain author-supplied strings (e.g. unknown tag
//     names) which validator already emits; this reporter does NOT add/echo commerce
//     internalLabel / real AdSense client·slot id / token / credential. The report is a
//     git-ignored cache and must never be committed.
//
//   This phase produces the reporter ONLY. ADMIN UI consumption of the JSON is a separate,
//   later phase (§G.3) and is intentionally not wired here.

import path from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { loadSettings } from './load-settings.js';
import { loadPosts } from './load-posts.js';
import { validateContent } from './validate-content.js';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const REPORT_DIR = path.join(PROJECT_ROOT, '.cache', 'data');
const REPORT_PATH = path.join(REPORT_DIR, 'validation-report.json');

const SCHEMA_VERSION = 1;
const GENERATOR = 'report-validation';

// §D.2 cross-post rule types — these remain in their per-sourcePath entry AND get an
// aggregated view in buckets.crossPost.
const CROSS_POST_TYPES = new Set([
  'duplicate-slug',
  'series-number-duplicate',
  // F8 / slice 10：downloadFunnel entry ↔ gated_page 跨檔案一致性（corpus cross-post warnings）
  'downloadFunnel-entry-page-not-listed-by-gated-page',
  'downloadFunnel-gated-page-not-targeted-by-entry',
]);

// §C.2 byClass canonical key set (stable shape; download/book/series fold into frontmatter
// for v1 per §C.4, so their keys stay 0 — kept for forward-compat / schema stability).
// Exported (read-only) so the smoke guard can assert the key set without re-declaring it.
export const BY_CLASS_KEYS = [
  'taxonomy',
  'commerce',
  'adsense',
  'blogger',
  'frontmatter',
  'download',
  'book',
  'series',
  'unknown',
];

/**
 * §C.4 class mapping (view-side convention only — does NOT change validator rule/severity).
 * Order matters: blogger is checked before frontmatter so `invalid-publish-target-mode`
 * (a blogger rule starting with `invalid-`) is not swallowed by the frontmatter `invalid-*` rule.
 */
export function classifyRuleClass(type) {
  const t = String(type || '');
  if (/^(unknown-category|category-site-mismatch|unknown-tag|tag-site-mismatch)$/.test(t)) {
    return 'taxonomy';
  }
  if (/^(commerce-ref-|commerce-link-|affiliate-block)/.test(t)) return 'commerce';
  if (/^(adsense-|ads-)/.test(t)) return 'adsense';
  if (
    /^(promotion-|fb-md-|fb-post-url-missing|sidecar-frontmatter-overlap|invalid-publish-target-mode)/.test(
      t,
    )
  ) {
    return 'blogger';
  }
  if (
    /^(missing-|invalid-|long-|empty-tags|body-leading-h1|contentkind-and-type-conflict|related-links-|book-|series-|download-|downloadFunnel-|page-|duplicate-slug)/.test(
      t,
    )
  ) {
    return 'frontmatter';
  }
  return 'unknown';
}

/**
 * §C.2 kind by sourcePath. sourcePath is validator-native repo-relative posix (§B.2 / §D.1).
 * Order: fixtures first (a fixture path lives under content/validation-fixtures/, not
 * content/settings/), then settings, else post.
 */
export function classifyKind(sourcePath) {
  const p = String(sourcePath || '');
  if (p.includes('content/validation-fixtures/')) return 'fixture';
  if (p.includes('content/settings/')) return 'settings';
  return 'post';
}

function emptyByClass() {
  const obj = {};
  for (const k of BY_CLASS_KEYS) obj[k] = 0;
  return obj;
}

/**
 * Build the §C report envelope from a validateContent() result (pure transform).
 * Exported (read-only) so the smoke guard can exercise it on synthetic input.
 */
export function buildReport(result, { asOf }) {
  const issues = Array.isArray(result.issues) ? result.issues : [];

  // Group by sourcePath, preserving first-seen order (mirrors printIssues Map ordering).
  const byPath = new Map();
  for (const i of issues) {
    const key = i.sourcePath;
    if (!byPath.has(key)) byPath.set(key, []);
    byPath.get(key).push(i);
  }

  const bySourcePath = [];
  for (const [sourcePath, list] of byPath) {
    const kind = classifyKind(sourcePath);
    const byClass = emptyByClass();
    let errorCount = 0;
    let warningCount = 0;
    const entryIssues = [];
    for (const i of list) {
      const cls = classifyRuleClass(i.type);
      byClass[cls] = (byClass[cls] || 0) + 1;
      if (i.severity === 'error') errorCount += 1;
      else warningCount += 1;
      const issueObj = { severity: i.severity || 'warning', type: i.type, class: cls };
      if (i.value !== undefined) issueObj.value = i.value;
      if (i.site !== undefined) issueObj.site = i.site;
      entryIssues.push(issueObj);
    }
    bySourcePath.push({
      sourcePath,
      // validator sourcePath is already repo-relative posix (§D.1) → canonical join key == raw.
      normalizedKey: sourcePath,
      kind,
      errorCount,
      warningCount,
      byClass,
      issues: entryIssues,
    });
  }

  // §C.3 buckets — non per-post homes (settings / fixtures) + cross-post aggregated view.
  const settings = bySourcePath.filter((e) => e.kind === 'settings');
  const fixtures = bySourcePath.filter((e) => e.kind === 'fixture');
  const crossPost = [];
  for (const i of issues) {
    if (CROSS_POST_TYPES.has(i.type)) {
      const obj = {
        severity: i.severity || 'warning',
        type: i.type,
        class: classifyRuleClass(i.type),
        sourcePath: i.sourcePath,
      };
      if (i.value !== undefined) obj.value = i.value;
      crossPost.push(obj);
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    generator: GENERATOR,
    asOf,
    inputs: {
      sites: ['github', 'blogger'],
      includesFixtures: true,
      // Overlay-aware reporting is deferred; this reporter runs the production (non-overlay)
      // load path, mirroring validate-content.js CLI main() without --registry-overlay.
      registryOverlay: null,
    },
    totals: {
      errorCount: result.errorCount,
      warningCount: result.warningCount,
      issuePostCount: byPath.size,
    },
    bySourcePath,
    buckets: { settings, fixtures, crossPost },
  };
}

async function main() {
  // Mirror validate-content.js CLI main() load sequence exactly (production, no overlay).
  const settings = await loadSettings();
  const github = await loadPosts({ site: 'github', settings });
  const blogger = await loadPosts({ site: 'blogger', settings });
  const fixturesGithub = await loadPosts({ site: 'validation-fixtures/github', settings });
  const fixturesBlogger = await loadPosts({ site: 'validation-fixtures/blogger', settings });

  const posts = [
    ...github.posts,
    ...blogger.posts,
    ...fixturesGithub.posts,
    ...fixturesBlogger.posts,
  ];

  const result = validateContent({ posts, settings });
  const report = buildReport(result, { asOf: new Date().toISOString() });

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const rel = path.relative(PROJECT_ROOT, REPORT_PATH).split(path.sep).join('/');
  console.log(`[report-validation] wrote ${rel} (git-ignored cache)`);
  console.log(
    `[report-validation] schemaVersion=${report.schemaVersion} generator=${report.generator} asOf=${report.asOf}`,
  );
  console.log(
    `[report-validation] totals: ${report.totals.errorCount} error(s) / ${report.totals.warningCount} warning(s) / ${report.totals.issuePostCount} issue-post(s)`,
  );
  console.log(
    `[report-validation] bySourcePath=${report.bySourcePath.length} settings=${report.buckets.settings.length} fixtures=${report.buckets.fixtures.length} crossPost=${report.buckets.crossPost.length}`,
  );
}

// Only run the (I/O-performing, cache-writing) entrypoint when invoked as a script.
// When imported (e.g. by the smoke guard), exports are loaded without side effects.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main().catch((err) => {
    console.error('[report-validation] failed:', err);
    process.exit(1);
  });
}
