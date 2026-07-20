#!/usr/bin/env node
// Phase 20260705-P：Blogger backfill report-only guard（warning-only）。
//
// 範圍 / 邊界：
//   - 只讀 content/blogger/posts/*.md 與同名 .publish.json sidecar（若存在）。
//   - 不寫任何檔；不 build / preview / deploy；不呼叫 Blogger / Google API；不 guess URL / postId / publishedAt。
//   - 即使有 missing backfill，也 exit 0（report-only；warning-only）。
//   - 唯有 script crash / IO error 才 exit 1。
//
// 目的：
//   盤點所有 status 為 ready / published、draft !== true、publishTargets.blogger.enabled === true
//   之 Blogger 文章，是否已回填：
//     - blogger.publishedUrl
//     - blogger.bloggerPostId
//     - blogger.publishedAt
//   來源優先：.publish.json sidecar > .md frontmatter（legacy）。
//   兩處皆缺 or 皆為空字串 → 視為 missing，列 warning。
//
// 使用：
//   npm run check:blogger-backfill

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

import { isProductionStage } from './publish-stage.js';

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

// 若值為非空 string 或非空 number（e.g. bloggerPostId 可能存為 numeric），視為 present。
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

// 讀 field 值：先看 sidecar.blogger.<field>，再 fallback frontmatter.blogger.<field>。
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
  if (!fm || typeof fm !== 'object') return false;
  const blogger = fm.publishTargets && fm.publishTargets.blogger;
  const enabled = !!(blogger && blogger.enabled === true);
  if (!enabled) return false;
  if (fm.draft === true) return false;
  const status = typeof fm.status === 'string' ? fm.status.trim() : '';
  if (status !== 'ready' && status !== 'published') return false;
  // Phase 20260720 Slice 2：Blogger production stage 過濾。preview / invalid 均排除。
  //   missing stage → production（backward compat；本 repo 現無文章宣告 stage）。
  return isProductionStage(blogger.stage, 'blogger');
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

async function main() {
  const files = await fg('content/blogger/posts/**/*.md', {
    cwd: PROJECT_ROOT,
    absolute: true,
  });

  // 排除 .fb.md（FB sidecar，非文章本體）
  const postFiles = files.filter((f) => !f.endsWith('.fb.md')).sort();

  let scanned = 0;
  let candidateCount = 0;
  let completeCount = 0;
  const missingReports = [];
  const nonCandidates = [];
  const sidecarParseErrors = [];

  for (const file of postFiles) {
    scanned += 1;
    let raw;
    try {
      raw = await fs.readFile(file, 'utf-8');
    } catch (err) {
      process.stderr.write(
        `ERROR reading ${toRel(file)}: ${err.message}\n`,
      );
      throw err;
    }

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
    if (!isCandidate(fm)) {
      nonCandidates.push({
        file,
        status: fm.status ?? '(unset)',
        draft: fm.draft,
        bloggerEnabled: fm?.publishTargets?.blogger?.enabled ?? '(unset)',
      });
      continue;
    }

    candidateCount += 1;

    const sidecar = await readSidecarIfExists(file);
    if (sidecar.parseError) {
      sidecarParseErrors.push({
        file: toRel(sidecar.path),
        error: sidecar.parseError,
      });
    }

    const missing = [];
    const present = [];
    for (const field of BACKFILL_FIELDS) {
      const short = field.replace(/^blogger\./, '');
      const r = resolveBackfillValue(sidecar.data, fm, short);
      if (r.source === 'missing') {
        missing.push(field);
      } else {
        present.push({ field, source: r.source });
      }
    }

    if (missing.length === 0) {
      completeCount += 1;
    } else {
      missingReports.push({
        file,
        sidecarExists: sidecar.exists,
        status: fm.status,
        missing,
        present,
      });
    }
  }

  // ── 輸出 ──
  console.log('check-blogger-backfill (report-only; warning-only)');
  console.log('');
  console.log(`scanned:    ${scanned} .md file(s) under content/blogger/posts/`);
  console.log(`candidates: ${candidateCount} (publishTargets.blogger.enabled === true AND status in [ready, published] AND draft !== true)`);
  console.log(`complete:   ${completeCount}`);
  console.log(`missing:    ${missingReports.length}`);
  console.log(`skipped:    ${nonCandidates.length} non-candidate .md file(s)`);
  console.log('');

  if (sidecarParseErrors.length > 0) {
    console.log('---- sidecar parse errors (informational; not a failure) ----');
    for (const e of sidecarParseErrors) {
      console.log(`  NOTE ${e.file}: ${e.error}`);
    }
    console.log('');
  }

  if (missingReports.length > 0) {
    console.log('---- candidates with missing backfill ----');
    for (const r of missingReports) {
      const rel = toRel(r.file);
      const sc = r.sidecarExists ? 'sidecar-present' : 'sidecar-absent';
      console.log(`  WARN blogger backfill missing: ${rel} [${sc}, status=${r.status}] missing ${r.missing.join(', ')}`);
      for (const p of r.present) {
        console.log(`       (present: ${p.field} from ${p.source})`);
      }
    }
    console.log('');
  }

  console.log('PASS blogger backfill report completed (warning-only; missing backfill does not fail this check).');
  return 0;
}

main()
  .then((code) => {
    process.exit(typeof code === 'number' ? code : 0);
  })
  .catch((err) => {
    process.stderr.write(
      `[check-blogger-backfill] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
    );
    process.exit(1);
  });
