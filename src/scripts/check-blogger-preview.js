#!/usr/bin/env node
// Phase 20260712-preview-only-helper-b1：Blogger preview-only navigator（read-only）。
//
// 範圍 / 邊界（per docs/20260710-blogger-preview-only-script-preanalysis.md §6.1 + §11.1）：
//   - 純讀 content/blogger/posts/*.md + content/github/posts/*.md（經 load-blogger-posts.js）
//     + dist-blogger/posts/<slug>/ 之現有輸出檔。
//   - **不**寫任何檔；**不** build / preview / deploy；**不**觸 Vite dev server；
//     **不**呼叫 Blogger / Google / GA4 / AdSense / Search Console / Drive API；
//     **不**動 frontmatter / `.publish.json` sidecar / `content/settings/`；
//     **不**動 `dist-blogger/`（不新增、不改、不刪、不 touch mtime）；
//     **不**動 deploy clone / gh-pages / `dist/`；
//     **不**猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt`。
//   - 即使 dist-blogger 尚未 build 或 slug 不存在，也 exit 0（navigator = warning-only）。
//   - 唯有 script crash / IO error 才 exit 1。
//
// 目的：
//   降低「找檔」摩擦：一步列出 blogger-enabled 文章之 dist-blogger/posts/<slug>/ 四檔
//   （post.html / copy-helper.txt / publish-checklist.txt / meta.json）之存在性、mtime、size；
//   若尚未 build，提示 `npm run build:blogger`；若指定 slug 為 draft 或未列入 candidate，
//   給出對應診斷指引。console output 亦包含 preview sanity checklist doc pointer。
//
// 使用：
//   npm run check:blogger-preview                    列出所有 blogger-enabled candidates
//   npm run check:blogger-preview -- --slug <slug>   聚焦單一 slug
//   npm run check:blogger-preview -- --json          輸出機器可讀 JSON 至 stdout（diagnostics 走 stderr）
//   npm run check:blogger-preview -- --slug <slug> --json
//
// See also:
//   docs/20260708-blogger-draft-preview-runbook.md（Blogger draft-preview 6 步）
//   docs/20260710-blogger-preview-sanity-analysis.md（Blogger preview 40 項 sanity checklist）
//   docs/20260710-blogger-admin-export-workflow-alignment.md（Admin export → build → dist → Blogger paste）
//   docs/20260710-blogger-preview-only-script-preanalysis.md（B1 / B2 scope）

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_BLOGGER = path.join(PROJECT_ROOT, 'dist-blogger');
const POSTS_DIST = path.join(DIST_BLOGGER, 'posts');

const OUTPUT_FILES = [
  'post.html',
  'copy-helper.txt',
  'publish-checklist.txt',
  'meta.json',
];

const BUILD_COMMAND = 'npm run build:blogger';
const RUNBOOK_DOC = 'docs/20260708-blogger-draft-preview-runbook.md';
const SANITY_DOC = 'docs/20260710-blogger-preview-sanity-analysis.md';
const ALIGNMENT_DOC = 'docs/20260710-blogger-admin-export-workflow-alignment.md';
const PREANALYSIS_DOC = 'docs/20260710-blogger-preview-only-script-preanalysis.md';

function toRel(abs) {
  return path.relative(PROJECT_ROOT, abs).split(path.sep).join('/');
}

function parseArgs(argv) {
  const args = { slug: null, json: false, help: false, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--json') args.json = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--slug') {
      args.slug = argv[i + 1] ?? null;
      i += 1;
    } else if (a.startsWith('--slug=')) {
      args.slug = a.slice('--slug='.length);
    }
  }
  return args;
}

function printHelp(out) {
  out.write(
    [
      'check-blogger-preview — read-only navigator for Blogger preview outputs',
      '',
      'Usage:',
      '  npm run check:blogger-preview                    list all blogger-enabled candidates',
      '  npm run check:blogger-preview -- --slug <slug>   focus a single slug',
      '  npm run check:blogger-preview -- --json          machine-readable JSON to stdout',
      '  npm run check:blogger-preview -- --slug <slug> --json',
      '',
      'Behavior:',
      '  - Read-only. Does not build / deploy / write / touch dist-blogger/.',
      '  - Reports per-post existence / mtime / size of the four Blogger output files',
      '    under dist-blogger/posts/<slug>/.',
      '  - If dist-blogger/posts/<slug>/ is absent, suggests `npm run build:blogger`.',
      '  - Exits 0 for all navigator cases (candidate found / candidate missing /',
      '    dist absent / slug not found). Exits 1 only on unexpected IO error.',
      '',
      `See also: ${RUNBOOK_DOC}, ${SANITY_DOC}, ${ALIGNMENT_DOC}, ${PREANALYSIS_DOC}.`,
      '',
    ].join('\n'),
  );
}

function isBloggerEnabled(fm) {
  return !!(fm && fm.publishTargets && fm.publishTargets.blogger && fm.publishTargets.blogger.enabled === true);
}

function classifyDraft(fm) {
  if (fm.draft === true) return { include: false, reason: 'draft:true' };
  const status = typeof fm.status === 'string' ? fm.status : 'draft';
  if (status !== 'ready' && status !== 'published') {
    return { include: false, reason: `status:${status}` };
  }
  return { include: true, reason: 'ok' };
}

function resolveBloggerMode(fm) {
  const raw = fm?.publishTargets?.blogger?.mode;
  if (raw === 'full' || raw === 'summary' || raw === 'redirect-card') return raw;
  return 'full';
}

async function collectFromDir(rel, sourceSite) {
  const baseAbs = path.join(PROJECT_ROOT, rel);
  const pattern = path.join(baseAbs, '**/*.md').split(path.sep).join('/');
  const files = await fg(pattern, { absolute: true, onlyFiles: true });
  const entries = [];
  for (const abs of files.sort()) {
    if (abs.endsWith('.fb.md')) continue;
    const raw = await fs.readFile(abs, 'utf-8');
    let parsed;
    try {
      parsed = matter(raw);
    } catch (err) {
      entries.push({
        sourcePath: toRel(abs),
        sourceSite,
        parseError: err.message,
      });
      continue;
    }
    const fm = parsed.data || {};
    if (!isBloggerEnabled(fm)) continue;
    const classification = classifyDraft(fm);
    entries.push({
      sourcePath: toRel(abs),
      sourceSite,
      slug: typeof fm.slug === 'string' ? fm.slug : null,
      title: typeof fm.title === 'string' ? fm.title : null,
      status: typeof fm.status === 'string' ? fm.status : null,
      draft: fm.draft === true,
      bloggerMode: resolveBloggerMode(fm),
      candidate: classification.include,
      filterReason: classification.include ? null : classification.reason,
    });
  }
  return entries;
}

async function statOne(abs) {
  try {
    const st = await fs.stat(abs);
    return {
      exists: true,
      size: st.size,
      mtimeIso: st.mtime.toISOString(),
    };
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return { exists: false, size: null, mtimeIso: null };
    }
    throw err;
  }
}

async function probeDist(slug) {
  if (!slug) {
    return { slugDir: null, dirExists: false, files: [] };
  }
  const slugDir = path.join(POSTS_DIST, slug);
  let dirExists = false;
  try {
    const st = await fs.stat(slugDir);
    dirExists = st.isDirectory();
  } catch (err) {
    if (err && err.code !== 'ENOENT') throw err;
    dirExists = false;
  }
  const files = [];
  for (const name of OUTPUT_FILES) {
    const abs = path.join(slugDir, name);
    const st = await statOne(abs);
    files.push({
      name,
      relativePath: toRel(abs),
      ...st,
    });
  }
  return { slugDir: toRel(slugDir), dirExists, files };
}

async function distBloggerRootExists() {
  try {
    const st = await fs.stat(DIST_BLOGGER);
    return st.isDirectory();
  } catch (err) {
    if (err && err.code === 'ENOENT') return false;
    throw err;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp(process.stdout);
    return 0;
  }

  // dry-run is a no-op for a read-only navigator; accepted for CLI-shape parity.
  if (args.dryRun) {
    process.stderr.write('[check-blogger-preview] note: --dry-run is a no-op (navigator is read-only)\n');
  }

  const [bloggerEntries, githubEntries] = await Promise.all([
    collectFromDir('content/blogger/posts', 'blogger'),
    collectFromDir('content/github/posts', 'github-cross'),
  ]);
  const allEntries = [...bloggerEntries, ...githubEntries];

  const parseFailures = allEntries.filter((e) => e.parseError);
  const bloggerEnabled = allEntries.filter((e) => !e.parseError);
  const candidates = bloggerEnabled.filter((e) => e.candidate && e.slug);
  const filteredOut = bloggerEnabled.filter((e) => !e.candidate);
  const missingSlug = bloggerEnabled.filter((e) => e.candidate && !e.slug);

  candidates.sort((a, b) => (a.slug || '').localeCompare(b.slug || ''));

  const distRootExists = await distBloggerRootExists();

  const report = {
    generatedAtNote: 'navigator is read-only; timestamps are stat mtimes of existing dist output files',
    distBloggerRoot: toRel(DIST_BLOGGER),
    distBloggerRootExists: distRootExists,
    candidateCount: candidates.length,
    filteredOutCount: filteredOut.length,
    missingSlugCount: missingSlug.length,
    parseFailureCount: parseFailures.length,
    buildCommand: BUILD_COMMAND,
    pointers: {
      runbook: RUNBOOK_DOC,
      sanityChecklist: SANITY_DOC,
      adminExportAlignment: ALIGNMENT_DOC,
      preanalysis: PREANALYSIS_DOC,
    },
  };

  // Focus mode: single slug lookup.
  if (args.slug) {
    const focus = candidates.find((e) => e.slug === args.slug);
    const filtered = filteredOut.find((e) => e.slug === args.slug);
    const parseFail = parseFailures.find((e) => e.parseError && toRel(e.sourcePath).includes(args.slug));

    let entry = null;
    let outputs = { slugDir: null, dirExists: false, files: [] };
    let advice = null;

    if (focus) {
      entry = focus;
      outputs = await probeDist(focus.slug);
      if (!outputs.dirExists) {
        advice = `dist-blogger/posts/${focus.slug}/ absent — run \`${BUILD_COMMAND}\` to produce Blogger output files.`;
      } else {
        const missing = outputs.files.filter((f) => !f.exists).map((f) => f.name);
        if (missing.length > 0) {
          advice = `dist-blogger/posts/${focus.slug}/ exists but missing ${missing.join(', ')} — re-run \`${BUILD_COMMAND}\`.`;
        } else {
          advice = `dist-blogger/posts/${focus.slug}/ complete — open post.html and paste into Blogger HTML mode (see ${RUNBOOK_DOC} §D-7).`;
        }
      }
    } else if (filtered) {
      entry = filtered;
      advice = `slug "${args.slug}" is blogger-enabled but filtered (${filtered.filterReason}). Follow ${RUNBOOK_DOC} §D-4 to temporarily set status:"ready" + draft:false before \`${BUILD_COMMAND}\`.`;
    } else if (parseFail) {
      advice = `frontmatter parse error at ${parseFail.sourcePath}: ${parseFail.parseError}`;
    } else {
      advice = `slug "${args.slug}" not found among blogger-enabled candidates (${candidates.length}) or filtered entries (${filteredOut.length}). Double-check the slug or the frontmatter's publishTargets.blogger.enabled.`;
    }

    const focusReport = {
      ...report,
      mode: 'focus',
      slug: args.slug,
      entry,
      outputs,
      advice,
    };

    if (args.json) {
      process.stdout.write(`${JSON.stringify(focusReport, null, 2)}\n`);
    } else {
      printFocus(focusReport);
    }
    return 0;
  }

  // Listing mode.
  const enriched = [];
  for (const c of candidates) {
    const outputs = await probeDist(c.slug);
    enriched.push({ ...c, outputs });
  }

  const listReport = {
    ...report,
    mode: 'list',
    entries: enriched,
    filteredOut,
    missingSlug,
    parseFailures,
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(listReport, null, 2)}\n`);
  } else {
    printList(listReport);
  }
  return 0;
}

function printHeader(out, mode) {
  out.write('check-blogger-preview (read-only navigator; warning-only)\n');
  out.write(`mode: ${mode}\n`);
  out.write('\n');
}

function printPointers(out, pointers) {
  out.write('pointers:\n');
  out.write(`  runbook:        ${pointers.runbook}\n`);
  out.write(`  sanity:         ${pointers.sanityChecklist}\n`);
  out.write(`  admin export:   ${pointers.adminExportAlignment}\n`);
  out.write(`  preanalysis:    ${pointers.preanalysis}\n`);
}

function fileLine(f) {
  if (!f.exists) return `    ${f.name}: MISSING`;
  return `    ${f.name}: exists  size=${f.size}  mtime=${f.mtimeIso}`;
}

function printList(report) {
  const out = process.stdout;
  printHeader(out, report.mode);
  out.write(`dist-blogger root:   ${report.distBloggerRoot}${report.distBloggerRootExists ? '' : '  (absent)'}\n`);
  out.write(`candidates:          ${report.candidateCount}\n`);
  out.write(`filtered-out:        ${report.filteredOutCount}\n`);
  out.write(`missing-slug:        ${report.missingSlugCount}\n`);
  out.write(`parse-failures:      ${report.parseFailureCount}\n`);
  out.write(`build command:       ${report.buildCommand}\n`);
  out.write('\n');

  if (report.entries.length === 0) {
    out.write('no blogger-enabled ready candidates.\n\n');
  } else {
    out.write('---- candidates ----\n');
    for (const e of report.entries) {
      out.write(`  slug=${e.slug}  mode=${e.bloggerMode}  source=${e.sourceSite}  path=${e.sourcePath}\n`);
      if (!e.outputs.dirExists) {
        out.write(`    dist folder: MISSING (${e.outputs.slugDir})  → run \`${report.buildCommand}\`\n`);
      } else {
        out.write(`    dist folder: ${e.outputs.slugDir}\n`);
        for (const f of e.outputs.files) out.write(`${fileLine(f)}\n`);
      }
    }
    out.write('\n');
  }

  if (report.filteredOut.length > 0) {
    out.write('---- filtered-out (blogger-enabled but draft / non-ready) ----\n');
    for (const e of report.filteredOut) {
      out.write(`  slug=${e.slug ?? '(none)'}  reason=${e.filterReason}  path=${e.sourcePath}\n`);
    }
    out.write(`  (see ${report.pointers.runbook} §D-4 for the preview workaround)\n\n`);
  }

  if (report.missingSlug.length > 0) {
    out.write('---- missing-slug (blogger-enabled but no slug in frontmatter) ----\n');
    for (const e of report.missingSlug) {
      out.write(`  path=${e.sourcePath}  status=${e.status ?? '(unset)'}\n`);
    }
    out.write('\n');
  }

  if (report.parseFailures.length > 0) {
    out.write('---- frontmatter parse failures (informational) ----\n');
    for (const e of report.parseFailures) {
      out.write(`  path=${e.sourcePath}  error=${e.parseError}\n`);
    }
    out.write('\n');
  }

  printPointers(out, report.pointers);
  out.write('\n');
  out.write('PASS blogger preview navigator (read-only; warning-only; no writes performed).\n');
}

function printFocus(report) {
  const out = process.stdout;
  printHeader(out, report.mode);
  out.write(`slug:                ${report.slug}\n`);
  if (report.entry) {
    out.write(`source path:         ${report.entry.sourcePath}\n`);
    out.write(`source site:         ${report.entry.sourceSite}\n`);
    if (report.entry.bloggerMode) out.write(`blogger mode:        ${report.entry.bloggerMode}\n`);
    if (report.entry.status !== undefined) out.write(`status:              ${report.entry.status ?? '(unset)'}\n`);
    out.write(`draft:               ${report.entry.draft === true}\n`);
    if (report.entry.candidate === false && report.entry.filterReason) {
      out.write(`filter reason:       ${report.entry.filterReason}\n`);
    }
  } else {
    out.write('source path:         (not found)\n');
  }
  out.write(`dist-blogger root:   ${report.distBloggerRoot}${report.distBloggerRootExists ? '' : '  (absent)'}\n`);
  out.write(`build command:       ${report.buildCommand}\n`);
  out.write('\n');

  if (report.outputs.slugDir) {
    out.write(`---- dist outputs (${report.outputs.slugDir}) ----\n`);
    if (!report.outputs.dirExists) {
      out.write('  (folder absent)\n');
    } else {
      for (const f of report.outputs.files) out.write(`${fileLine(f)}\n`);
    }
    out.write('\n');
  }

  out.write('---- advice ----\n');
  out.write(`  ${report.advice}\n\n`);

  printPointers(out, report.pointers);
  out.write('\n');
  out.write('PASS blogger preview navigator (read-only; warning-only; no writes performed).\n');
}

main()
  .then((code) => {
    process.exit(typeof code === 'number' ? code : 0);
  })
  .catch((err) => {
    process.stderr.write(
      `[check-blogger-preview] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
    );
    process.exit(1);
  });
