#!/usr/bin/env node
// Phase 20260710：Blogger backfill one-post dry-run report（report-only；warning-only）。
//
// 範圍 / 邊界（與父 guard `check:blogger-backfill` 語意一致，僅 scope 縮至單篇）：
//   - 只讀 content/blogger/posts/*.md 與同名 .publish.json sidecar（若存在）。
//   - 不寫任何檔；不 build / preview / deploy；不呼叫 Blogger / Google API；不 guess URL / postId / publishedAt。
//   - 即使 slug 未提供 / 未命中 / 命中但 missing backfill，也 exit 0（report-only；warning-only）。
//   - 唯有 script crash / IO error 才 exit 1。
//
// 目的：
//   給未來 WP-02（Dean-gated Blogger backfill write phase）之單篇 dry-run 提供
//   offline 可執行之 pre-write 報告。輸出：
//     - resolved markdown path
//     - expected sidecar path (per canonical write target 契約 = 同名 .publish.json)
//     - sidecar-present / sidecar-absent 狀態
//     - 是否為 backfill candidate（publishTargets.blogger.enabled=true, status in ready/published, draft !== true）
//     - 每個 backfill 欄位（publishedUrl / bloggerPostId / publishedAt）之 MISSING/PRESENT + 來源
//   本 script 本身不寫任何 sidecar、不代填任何值、不猜任何 Blogger 真值；
//   Dean 未來若啟動 WP-02，會依本 dry-run 報告對照 §8/§9/§11/§12（見
//   docs/20260710-blogger-backfill-one-post-dry-run-worksheet.md）。
//
// 使用：
//   npm run check:blogger-backfill:one-post -- --slug=<candidate-slug>
//   node src/scripts/check-blogger-backfill-one-post.js --slug=<candidate-slug>
//
//   slug 匹配優先：frontmatter.slug > 檔名去 yyyymmdd- 前綴（例：
//   `20260515-we-media-myself2.md` 之 slug 為 `we-media-myself2`）。

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const BACKFILL_FIELDS = [
  'blogger.publishedUrl',
  'blogger.bloggerPostId',
  'blogger.publishedAt',
];

function toRel(p) {
  return path.relative(PROJECT_ROOT, p).split(path.sep).join('/');
}

function isPresent(v) {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'number') return Number.isFinite(v);
  return false;
}

function getBloggerBlock(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const b = obj.blogger;
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  return b;
}

function resolveBackfillValue(sidecar, frontmatter, field) {
  const scBlogger = getBloggerBlock(sidecar);
  if (scBlogger && isPresent(scBlogger[field])) {
    return { value: scBlogger[field], source: 'sidecar' };
  }
  const fmBlogger = getBloggerBlock(frontmatter);
  if (fmBlogger && isPresent(fmBlogger[field])) {
    return { value: fmBlogger[field], source: 'frontmatter' };
  }
  return { value: null, source: 'missing' };
}

function isCandidate(fm) {
  if (!fm || typeof fm !== 'object') return { ok: false, reasons: ['frontmatter absent'] };
  const reasons = [];
  const blogger = fm.publishTargets && fm.publishTargets.blogger;
  const enabled = !!(blogger && blogger.enabled === true);
  if (!enabled) reasons.push('publishTargets.blogger.enabled !== true');
  if (fm.draft === true) reasons.push('draft === true');
  const status = typeof fm.status === 'string' ? fm.status.trim() : '';
  if (status !== 'ready' && status !== 'published') {
    reasons.push(`status="${status || '(unset)'}" (need ready|published)`);
  }
  return { ok: reasons.length === 0, reasons };
}

async function readSidecarIfExists(mdFile) {
  const dir = path.dirname(mdFile);
  const stem = path.basename(mdFile, path.extname(mdFile));
  const sidecarPath = path.join(dir, `${stem}.publish.json`);
  try {
    const raw = await fs.readFile(sidecarPath, 'utf-8');
    try {
      const parsed = JSON.parse(raw);
      return { path: sidecarPath, data: parsed, exists: true, parseError: null };
    } catch (err) {
      return { path: sidecarPath, data: null, exists: true, parseError: err.message };
    }
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return { path: sidecarPath, data: null, exists: false, parseError: null };
    }
    throw err;
  }
}

function parseSlugFromArgs(argv) {
  for (const raw of argv) {
    if (typeof raw !== 'string') continue;
    if (raw.startsWith('--slug=')) return raw.slice('--slug='.length).trim();
    if (raw === '--slug') {
      const next = argv[argv.indexOf(raw) + 1];
      if (typeof next === 'string' && !next.startsWith('-')) return next.trim();
    }
  }
  return '';
}

function slugFromFilename(mdFile) {
  const stem = path.basename(mdFile, path.extname(mdFile));
  const m = stem.match(/^\d{8}-(.+)$/);
  return m ? m[1] : stem;
}

function printUsage() {
  console.log('usage:');
  console.log('  npm run check:blogger-backfill:one-post -- --slug=<candidate-slug>');
  console.log('  node src/scripts/check-blogger-backfill-one-post.js --slug=<candidate-slug>');
  console.log('');
  console.log('behavior:');
  console.log('  - report-only; warning-only; exit 0 in all normal cases');
  console.log('  - never writes any file; never guesses Blogger publishedUrl / bloggerPostId / publishedAt');
  console.log('  - matches by frontmatter.slug first, then filename minus yyyymmdd- prefix');
}

async function main() {
  const slugArg = parseSlugFromArgs(process.argv.slice(2));

  console.log('check-blogger-backfill-one-post (report-only; warning-only; dry-run)');
  console.log('');

  if (!slugArg) {
    console.log('WARN --slug=<candidate-slug> not provided.');
    console.log('');
    printUsage();
    console.log('');
    console.log('PASS one-post backfill dry-run report completed (no slug supplied; nothing to report; warning-only).');
    return 0;
  }

  console.log(`resolved slug argument: ${slugArg}`);
  console.log('');

  const files = await fg('content/blogger/posts/**/*.md', {
    cwd: PROJECT_ROOT,
    absolute: true,
  });
  const postFiles = files.filter((f) => !f.endsWith('.fb.md')).sort();

  const matches = [];
  for (const file of postFiles) {
    const raw = await fs.readFile(file, 'utf-8');
    let parsed;
    try {
      parsed = matter(raw);
    } catch (err) {
      process.stderr.write(
        `ERROR parsing frontmatter ${toRel(file)}: ${err.message}\n`,
      );
      throw err;
    }
    const fm = parsed.data || {};
    const fmSlug = typeof fm.slug === 'string' ? fm.slug.trim() : '';
    const fileSlug = slugFromFilename(file);
    if (fmSlug === slugArg || fileSlug === slugArg) {
      matches.push({ file, fm, matchedVia: fmSlug === slugArg ? 'frontmatter.slug' : 'filename' });
    }
  }

  if (matches.length === 0) {
    console.log(`WARN no Blogger post matched slug "${slugArg}".`);
    console.log(`     scanned: ${postFiles.length} .md file(s) under content/blogger/posts/`);
    console.log(`     hint:    slug is matched against frontmatter.slug then filename (yyyymmdd- prefix stripped)`);
    console.log('');
    console.log('PASS one-post backfill dry-run report completed (no match; warning-only).');
    return 0;
  }

  if (matches.length > 1) {
    console.log(`WARN slug "${slugArg}" matched ${matches.length} .md file(s); reporting all matches.`);
    for (const m of matches) {
      console.log(`     - ${toRel(m.file)} (via ${m.matchedVia})`);
    }
    console.log('');
  }

  for (const m of matches) {
    const { file, fm, matchedVia } = m;
    const sidecar = await readSidecarIfExists(file);
    const cand = isCandidate(fm);
    const scTag = sidecar.exists ? 'sidecar-present' : 'sidecar-absent';

    console.log('---- match ----');
    console.log(`  matched via:    ${matchedVia}`);
    console.log(`  markdown path:  ${toRel(file)}`);
    console.log(`  sidecar path:   ${toRel(sidecar.path)}  [${scTag}]`);
    console.log(`  status:         ${fm.status ?? '(unset)'}`);
    console.log(`  draft:          ${fm.draft === true ? 'true' : (fm.draft === false ? 'false' : '(unset)')}`);
    console.log(`  publishTargets.blogger.enabled: ${fm?.publishTargets?.blogger?.enabled ?? '(unset)'}`);
    console.log(`  backfill candidate: ${cand.ok ? 'yes' : 'no'}${cand.ok ? '' : ` (${cand.reasons.join('; ')})`}`);

    if (sidecar.parseError) {
      console.log(`  NOTE sidecar parse error: ${sidecar.parseError}`);
    }

    console.log('');
    console.log('  ---- backfill fields ----');
    const missing = [];
    const present = [];
    for (const field of BACKFILL_FIELDS) {
      const short = field.replace(/^blogger\./, '');
      const r = resolveBackfillValue(sidecar.data, fm, short);
      if (r.source === 'missing') {
        missing.push(field);
        console.log(`    MISSING ${field}`);
      } else {
        present.push({ field, source: r.source });
        console.log(`    PRESENT ${field} (from ${r.source})`);
      }
    }

    console.log('');
    console.log('  ---- dry-run summary ----');
    if (!cand.ok) {
      console.log('    non-candidate: this .md would be skipped by the parent guard.');
    } else if (missing.length === 0) {
      console.log('    all backfill fields present; no future write needed for this post.');
    } else {
      console.log(`    ${missing.length}/${BACKFILL_FIELDS.length} backfill field(s) missing; future WP-02 write phase target = sidecar path above.`);
      console.log('    reminder: bloggerPostId is API-only; Dean would NOT manually provide it; it stays "".');
      console.log('    reminder: publishedUrl / publishedAt (and permalink / publishYear / publishMonth for URL) must be supplied by Dean; this tool never guesses.');
    }
    console.log('');
  }

  console.log('PASS one-post backfill dry-run report completed (warning-only; missing backfill does not fail this check).');
  console.log('note: this tool NEVER writes any file. No sidecar was created or modified.');
  return 0;
}

main()
  .then((code) => {
    process.exit(typeof code === 'number' ? code : 0);
  })
  .catch((err) => {
    process.stderr.write(
      `[check-blogger-backfill-one-post] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
    );
    process.exit(1);
  });
