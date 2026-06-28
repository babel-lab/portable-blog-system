// Phase 20260627-admin-markdown-draft-export-implementation-a:
//   Smoke test for admin-markdown-export.js.
//
//   Mirrors check-admin-validation-consume.js style:
//   - zero new dependency (node:assert + gray-matter; both already in deps)
//   - in-memory only; no fs / fetch / mutation; deterministic
//   - exit 0 on all PASS, exit 1 on any FAIL
//
// Run:
//   node src/scripts/check-admin-markdown-export.js
//   npm run check:admin-markdown-export

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import matter from 'gray-matter';
import {
  buildPostMarkdown,
  buildPostFilename,
  buildTargetFolder,
  buildTargetPath,
  isExportReady,
  analyzeReadyGap,
  analyzeRegistryHints,
  buildExportSummary,
  READY_UNSUPPORTED_CONTENT_KINDS,
  READY_MAX_TITLE_LEN,
  READY_MAX_DESCRIPTION_LEN,
  VALIDATION_COMMAND,
  TARGET_FOLDERS,
  VALID_SITES,
  VALID_CONTENT_KINDS,
  VALID_PRIMARY_PLATFORMS,
} from './admin-markdown-export.js';

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name} :: ${err.message}`);
  }
}

const happy = {
  site: 'github',
  contentKind: 'tech-note',
  primaryPlatform: 'github',
  title: '測試標題',
  slug: 'test-post',
  date: '2026-06-27',
  category: 'tech-note',
  tags: 'github, vite',
  description: '一個測試文章描述',
};

check('1 happy path parses with gray-matter', () => {
  const md = buildPostMarkdown(happy);
  const parsed = matter(md);
  assert.equal(parsed.data.site, 'github');
  assert.equal(parsed.data.contentKind, 'tech-note');
  assert.equal(parsed.data.primaryPlatform, 'github');
  assert.equal(parsed.data.title, '測試標題');
  assert.equal(parsed.data.slug, 'test-post');
  assert.equal(parsed.data.date, '2026-06-27');
  assert.equal(parsed.data.category, 'tech-note');
  assert.deepEqual(parsed.data.tags, ['github', 'vite']);
  assert.equal(parsed.data.status, 'draft');
  assert.equal(parsed.data.draft, true);
  assert.equal(parsed.data.canonical, 'auto');
  assert.equal(parsed.data.publishTargets.github.enabled, true);
  assert.equal(parsed.data.publishTargets.blogger.enabled, false);
  assert.ok(parsed.content.trim().length > 0, 'body must not be empty');
});

check('2 enums align with validate-content.js source-of-truth', () => {
  assert.deepEqual(VALID_SITES, ['github', 'blogger']);
  assert.deepEqual(VALID_CONTENT_KINDS, [
    'post',
    'tech-note',
    'book-review',
    'download',
    'comic',
    'life-note',
    'page',
  ]);
  assert.deepEqual(VALID_PRIMARY_PLATFORMS, ['github', 'blogger']);
});

check('3 invalid site falls back to github', () => {
  const md = buildPostMarkdown({ ...happy, site: 'twitter' });
  assert.equal(matter(md).data.site, 'github');
});

check('4 invalid contentKind falls back to tech-note', () => {
  const md = buildPostMarkdown({ ...happy, contentKind: 'rants' });
  assert.equal(matter(md).data.contentKind, 'tech-note');
});

check('5 invalid primaryPlatform falls back to site', () => {
  const md = buildPostMarkdown({ ...happy, site: 'blogger', primaryPlatform: 'x' });
  assert.equal(matter(md).data.primaryPlatform, 'blogger');
});

check('6 default body present when body empty', () => {
  const md = buildPostMarkdown({ ...happy, body: '' });
  assert.ok(matter(md).content.includes('## 簡介'));
});

check('7 user body preserved verbatim (markdown not re-rendered)', () => {
  const md = buildPostMarkdown({ ...happy, body: '## hello\n\nworld content\n' });
  const parsed = matter(md);
  assert.ok(parsed.content.includes('## hello'));
  assert.ok(parsed.content.includes('world content'));
});

check('8 YAML escape handles colon / double-quote / newline in title', () => {
  const md = buildPostMarkdown({
    ...happy,
    title: 'tricky: has "quote" and \nnewline',
  });
  assert.equal(matter(md).data.title, 'tricky: has "quote" and newline');
});

check('9 YAML escape handles backslash in title', () => {
  const md = buildPostMarkdown({ ...happy, title: 'path\\to\\thing' });
  assert.equal(matter(md).data.title, 'path\\to\\thing');
});

check('10 tags string → trimmed unique array, first-seen order', () => {
  const md = buildPostMarkdown({ ...happy, tags: ' github , vite, github , , react ' });
  assert.deepEqual(matter(md).data.tags, ['github', 'vite', 'react']);
});

check('11 tags array input dedupes + drops empties + preserves order', () => {
  const md = buildPostMarkdown({ ...happy, tags: ['a', 'b', 'a', '', 'c'] });
  assert.deepEqual(matter(md).data.tags, ['a', 'b', 'c']);
});

check('12 empty tags → empty array (not omitted)', () => {
  const md = buildPostMarkdown({ ...happy, tags: '' });
  assert.deepEqual(matter(md).data.tags, []);
});

check('13 filename pattern YYYY-MM-DD-slug.md', () => {
  assert.equal(buildPostFilename(happy), '2026-06-27-test-post.md');
});

check('14 filename empty when date missing', () => {
  assert.equal(buildPostFilename({ ...happy, date: '' }), '');
});

check('15 filename empty when date format bad', () => {
  assert.equal(buildPostFilename({ ...happy, date: '2026/06/27' }), '');
  assert.equal(buildPostFilename({ ...happy, date: '06-27-2026' }), '');
});

check('16 filename empty when slug has unsafe chars', () => {
  assert.equal(buildPostFilename({ ...happy, slug: 'test post' }), '');
  assert.equal(buildPostFilename({ ...happy, slug: '../etc/passwd' }), '');
  assert.equal(buildPostFilename({ ...happy, slug: 'TEST-POST' }), '');
  assert.equal(buildPostFilename({ ...happy, slug: '-leading-dash' }), '');
  assert.equal(buildPostFilename({ ...happy, slug: 'trailing-dash-' }), '');
});

check('17 slug valid forms accepted', () => {
  assert.equal(buildPostFilename({ ...happy, slug: 'a' }), '2026-06-27-a.md');
  assert.equal(buildPostFilename({ ...happy, slug: 'a-b-c' }), '2026-06-27-a-b-c.md');
  assert.equal(buildPostFilename({ ...happy, slug: 'abc123' }), '2026-06-27-abc123.md');
});

check('18 missing title → TODO marker', () => {
  const md = buildPostMarkdown({ ...happy, title: '' });
  assert.equal(matter(md).data.title, 'TODO-fill-title');
});

check('19 missing slug → TODO marker', () => {
  const md = buildPostMarkdown({ ...happy, slug: '' });
  assert.equal(matter(md).data.slug, 'TODO-fill-slug');
});

check('20 missing date → TODO marker', () => {
  const md = buildPostMarkdown({ ...happy, date: '' });
  assert.equal(matter(md).data.date, 'TODO-fill-date');
});

check('21 site=blogger → blogger enabled+full, github disabled', () => {
  const md = buildPostMarkdown({ ...happy, site: 'blogger' });
  const t = matter(md).data.publishTargets;
  assert.equal(t.blogger.enabled, true);
  assert.equal(t.blogger.mode, 'full');
  assert.equal(t.github.enabled, false);
});

check('22 site=github → github enabled+full, blogger disabled+summary', () => {
  const t = matter(buildPostMarkdown(happy)).data.publishTargets;
  assert.equal(t.github.enabled, true);
  assert.equal(t.github.mode, 'full');
  assert.equal(t.blogger.enabled, false);
  assert.equal(t.blogger.mode, 'summary');
});

check('23 blocks defaults match new-post.js template', () => {
  const b = matter(buildPostMarkdown(happy)).data.blocks;
  assert.equal(b.toc, false);
  assert.equal(b.adsenseTop, true);
  assert.equal(b.adsenseMiddle, false);
  assert.equal(b.adsenseBottom, true);
  assert.equal(b.hashtags, true);
  assert.equal(b.socialFollow, true);
  assert.equal(b.relatedPosts, true);
  assert.equal(b.sidebar, true);
});

check('24 status always draft + draft true (safest zero-warning)', () => {
  const md = buildPostMarkdown({ ...happy, status: 'ready', draft: false });
  const d = matter(md).data;
  assert.equal(d.status, 'draft');
  assert.equal(d.draft, true);
});

check('25 null / undefined input does not throw', () => {
  const md1 = buildPostMarkdown(null);
  const md2 = buildPostMarkdown(undefined);
  const p1 = matter(md1);
  const p2 = matter(md2);
  assert.equal(p1.data.site, 'github');
  assert.equal(p1.data.status, 'draft');
  assert.equal(p2.data.site, 'github');
  assert.equal(p2.data.status, 'draft');
  assert.equal(buildPostFilename(null), '');
  assert.equal(buildPostFilename(undefined), '');
});

// Phase 20260627-admin-markdown-import-checklist-slice2-a:
//   Slice-2 cases — additive only; mirror the 4 new helper exports plus the
//   constants the inline client script reads. Cover happy path + invalid
//   input + null/undefined-safety, since the Admin UI relies on these for
//   Copy markdown / Download / Copy target path / Copy validation command
//   gating (per CLAUDE.md §27).
check('26 buildTargetFolder site=github → content/github/posts/', () => {
  assert.equal(buildTargetFolder({ site: 'github' }), 'content/github/posts/');
});

check('27 buildTargetFolder site=blogger → content/blogger/posts/', () => {
  assert.equal(buildTargetFolder({ site: 'blogger' }), 'content/blogger/posts/');
});

check('28 buildTargetFolder invalid site → fallback to github folder', () => {
  assert.equal(buildTargetFolder({ site: 'twitter' }), 'content/github/posts/');
  assert.equal(buildTargetFolder({ site: '' }), 'content/github/posts/');
  assert.equal(buildTargetFolder({}), 'content/github/posts/');
  assert.equal(buildTargetFolder(null), 'content/github/posts/');
  assert.equal(buildTargetFolder(undefined), 'content/github/posts/');
});

check('29 buildTargetPath happy = folder + filename', () => {
  assert.equal(buildTargetPath(happy), 'content/github/posts/2026-06-27-test-post.md');
  assert.equal(
    buildTargetPath({ ...happy, site: 'blogger' }),
    'content/blogger/posts/2026-06-27-test-post.md'
  );
});

check('30 buildTargetPath empty when date invalid', () => {
  assert.equal(buildTargetPath({ ...happy, date: '' }), '');
  assert.equal(buildTargetPath({ ...happy, date: '2026/06/27' }), '');
});

check('31 buildTargetPath empty when slug invalid', () => {
  assert.equal(buildTargetPath({ ...happy, slug: '' }), '');
  assert.equal(buildTargetPath({ ...happy, slug: 'TEST-POST' }), '');
  assert.equal(buildTargetPath({ ...happy, slug: '../etc/passwd' }), '');
});

check('32 VALIDATION_COMMAND is the literal "npm run validate:content"', () => {
  assert.equal(VALIDATION_COMMAND, 'npm run validate:content');
});

check('33 TARGET_FOLDERS shape matches sites', () => {
  assert.deepEqual(Object.keys(TARGET_FOLDERS).sort(), ['blogger', 'github']);
  assert.equal(TARGET_FOLDERS.github, 'content/github/posts/');
  assert.equal(TARGET_FOLDERS.blogger, 'content/blogger/posts/');
});

check('34 isExportReady happy → ok=true, missing=[]', () => {
  assert.deepEqual(isExportReady(happy), { ok: true, missing: [] });
});

check('35 isExportReady missing title → ok=false, missing=[title]', () => {
  assert.deepEqual(isExportReady({ ...happy, title: '' }), { ok: false, missing: ['title'] });
  assert.deepEqual(isExportReady({ ...happy, title: '   ' }), { ok: false, missing: ['title'] });
});

check('36 isExportReady invalid slug → ok=false, missing=[slug]', () => {
  assert.deepEqual(isExportReady({ ...happy, slug: '' }), { ok: false, missing: ['slug'] });
  assert.deepEqual(isExportReady({ ...happy, slug: 'TEST POST' }), { ok: false, missing: ['slug'] });
  assert.deepEqual(isExportReady({ ...happy, slug: '-bad' }), { ok: false, missing: ['slug'] });
});

check('37 isExportReady invalid date → ok=false, missing=[date]', () => {
  assert.deepEqual(isExportReady({ ...happy, date: '' }), { ok: false, missing: ['date'] });
  assert.deepEqual(isExportReady({ ...happy, date: '2026/06/27' }), { ok: false, missing: ['date'] });
});

check('38 isExportReady multi-missing preserves title/slug/date order', () => {
  assert.deepEqual(isExportReady({}), { ok: false, missing: ['title', 'slug', 'date'] });
  assert.deepEqual(
    isExportReady({ ...happy, title: '', slug: '' }),
    { ok: false, missing: ['title', 'slug'] }
  );
  assert.deepEqual(
    isExportReady({ ...happy, slug: '', date: '' }),
    { ok: false, missing: ['slug', 'date'] }
  );
});

check('39 isExportReady null / undefined input does not throw', () => {
  assert.deepEqual(isExportReady(null), { ok: false, missing: ['title', 'slug', 'date'] });
  assert.deepEqual(isExportReady(undefined), { ok: false, missing: ['title', 'slug', 'date'] });
});

// Phase 20260627-admin-ready-preflight-panel-implementation-a:
//   analyzeReadyGap smoke cases — read-only hint helper. These tests lock the
//   shape returned to the Admin UI panel + the rules listed in the preanalysis
//   (docs/20260627-admin-ready-mode-validator-impact-preanalysis.md §10).
//   The helper MUST NOT mutate buildPostMarkdown output (case 51 locks this).
const readyHappy = {
  ...happy,
  cover: 'https://example.com/cover.jpg',
  coverAlt: 'cover alt',
  searchDescription: 'search description',
};

function fieldNames(arr) {
  return arr.map((x) => x.field);
}

check('40 analyzeReadyGap happy → ok=true, summary=ready-candidate', () => {
  const r = analyzeReadyGap(readyHappy);
  assert.equal(r.ok, true, 'ok must be true when nothing blocking / unsupported');
  assert.deepEqual(r.blocking, []);
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.unsupported, []);
  assert.equal(r.summary, 'ready-candidate');
});

check('41 analyzeReadyGap missing description → blocking includes description', () => {
  const r = analyzeReadyGap({ ...readyHappy, description: '' });
  assert.equal(r.ok, false);
  assert.ok(fieldNames(r.blocking).includes('description'));
  assert.equal(r.summary, 'keep-draft');
});

check('42 analyzeReadyGap missing category → blocking includes category', () => {
  const r = analyzeReadyGap({ ...readyHappy, category: '' });
  assert.equal(r.ok, false);
  assert.ok(fieldNames(r.blocking).includes('category'));
});

check('43 analyzeReadyGap empty tags → blocking includes tags', () => {
  const r1 = analyzeReadyGap({ ...readyHappy, tags: '' });
  const r2 = analyzeReadyGap({ ...readyHappy, tags: [] });
  const r3 = analyzeReadyGap({ ...readyHappy, tags: '   ,  , ' });
  assert.ok(fieldNames(r1.blocking).includes('tags'));
  assert.ok(fieldNames(r2.blocking).includes('tags'));
  assert.ok(fieldNames(r3.blocking).includes('tags'));
});

check('44 analyzeReadyGap missing cover → blocking includes cover', () => {
  const r = analyzeReadyGap({ ...readyHappy, cover: '' });
  assert.equal(r.ok, false);
  assert.ok(fieldNames(r.blocking).includes('cover'));
});

check('45 analyzeReadyGap empty searchDescription → soft warnings (not blocking)', () => {
  const r = analyzeReadyGap({ ...readyHappy, searchDescription: '' });
  assert.ok(fieldNames(r.warnings).includes('searchDescription'));
  assert.equal(fieldNames(r.blocking).includes('searchDescription'), false);
  // searchDescription empty alone is warning-only → ok must still be true
  assert.equal(r.ok, true);
  assert.equal(r.summary, 'ready-candidate');
});

check('46 analyzeReadyGap unsupported contentKind download', () => {
  const r = analyzeReadyGap({ ...readyHappy, contentKind: 'download' });
  assert.equal(r.ok, false, 'unsupported contentKind must flip ok=false');
  assert.equal(r.unsupported.length, 1);
  assert.equal(r.unsupported[0].contentKind, 'download');
  assert.equal(typeof r.unsupported[0].reason, 'string');
  assert.ok(r.unsupported[0].reason.length > 0);
  assert.equal(r.summary, 'keep-draft');
});

check('47 analyzeReadyGap unsupported contentKind book-review', () => {
  const r = analyzeReadyGap({ ...readyHappy, contentKind: 'book-review' });
  assert.equal(r.ok, false);
  assert.equal(r.unsupported.length, 1);
  assert.equal(r.unsupported[0].contentKind, 'book-review');
});

check('48 analyzeReadyGap null / undefined → no throw; all required fields blocking', () => {
  const r1 = analyzeReadyGap(null);
  const r2 = analyzeReadyGap(undefined);
  for (const r of [r1, r2]) {
    assert.equal(r.ok, false);
    assert.equal(r.summary, 'keep-draft');
    const fields = fieldNames(r.blocking);
    assert.ok(fields.includes('title'));
    assert.ok(fields.includes('slug'));
    assert.ok(fields.includes('date'));
    assert.ok(fields.includes('description'));
    assert.ok(fields.includes('category'));
    assert.ok(fields.includes('tags'));
    assert.ok(fields.includes('cover'));
    assert.deepEqual(r.unsupported, []);
  }
});

check('49 analyzeReadyGap long title → soft warning titleLength', () => {
  const longTitle = 'x'.repeat(READY_MAX_TITLE_LEN + 1);
  const r = analyzeReadyGap({ ...readyHappy, title: longTitle });
  assert.ok(fieldNames(r.warnings).includes('titleLength'));
  // long title alone is warning-only; blocking should not include title (it's non-empty)
  assert.equal(fieldNames(r.blocking).includes('title'), false);
});

check('50 analyzeReadyGap long description → soft warning descriptionLength', () => {
  const longDesc = 'x'.repeat(READY_MAX_DESCRIPTION_LEN + 1);
  const r = analyzeReadyGap({ ...readyHappy, description: longDesc });
  assert.ok(fieldNames(r.warnings).includes('descriptionLength'));
  assert.equal(fieldNames(r.blocking).includes('description'), false);
});

check('51 analyzeReadyGap does not alter buildPostMarkdown output (status stays draft)', () => {
  // Whatever analyzeReadyGap reports, the export markdown MUST still be
  // status:"draft" + draft:true (zero-warning safe path).
  const inputs = [
    readyHappy,
    { ...readyHappy, contentKind: 'download' },
    { ...readyHappy, contentKind: 'book-review' },
    { ...readyHappy, description: '', category: '', tags: '', cover: '' },
  ];
  for (const inp of inputs) {
    analyzeReadyGap(inp);
    const md = buildPostMarkdown(inp);
    const d = matter(md).data;
    assert.equal(d.status, 'draft', 'status must remain draft regardless of preflight');
    assert.equal(d.draft, true, 'draft must remain true regardless of preflight');
  }
});

check('52 READY_UNSUPPORTED_CONTENT_KINDS enum exposed; tech-note + post not unsupported', () => {
  assert.ok(Array.isArray(READY_UNSUPPORTED_CONTENT_KINDS));
  assert.ok(READY_UNSUPPORTED_CONTENT_KINDS.includes('download'));
  assert.ok(READY_UNSUPPORTED_CONTENT_KINDS.includes('book-review'));
  assert.equal(READY_UNSUPPORTED_CONTENT_KINDS.includes('tech-note'), false);
  assert.equal(READY_UNSUPPORTED_CONTENT_KINDS.includes('post'), false);
  // tech-note happy path should have empty unsupported
  const r = analyzeReadyGap({ ...readyHappy, contentKind: 'tech-note' });
  assert.deepEqual(r.unsupported, []);
});

// Phase 20260627-admin-richer-fields-slice-a:
//   Smoke cases for optional SEO / Cover scalars now collected by the Admin form.
//   - buildPostMarkdown must emit them into frontmatter (smoke 53–55)
//   - empty defaults stay "" (smoke 56)
//   - YAML escaping mirrors title escaping (smoke 57)
//   - analyzeReadyGap blocker / warning resolution lines up with form fills (smoke 58–60)
//   - status / draft invariant preserved across all combinations (smoke 61)
//   - null / undefined safety preserved across new fields (smoke 62)
check('53 frontmatter emits searchDescription when provided', () => {
  const md = buildPostMarkdown({ ...happy, searchDescription: '搜尋說明文字' });
  assert.equal(matter(md).data.searchDescription, '搜尋說明文字');
});

check('54 frontmatter emits cover when provided', () => {
  const md = buildPostMarkdown({
    ...happy,
    cover: '/images/placeholders/cover-placeholder.svg',
  });
  assert.equal(matter(md).data.cover, '/images/placeholders/cover-placeholder.svg');
});

check('55 frontmatter emits coverAlt when provided', () => {
  const md = buildPostMarkdown({ ...happy, coverAlt: '封面圖示意：書桌與筆電' });
  assert.equal(matter(md).data.coverAlt, '封面圖示意：書桌與筆電');
});

check('56 frontmatter default for SEO / cover fields is "" when not provided', () => {
  const d = matter(buildPostMarkdown(happy)).data;
  assert.equal(d.searchDescription, '');
  assert.equal(d.cover, '');
  assert.equal(d.coverAlt, '');
});

check('57 YAML escape handles quote / newline / backslash in SEO / cover fields', () => {
  const md = buildPostMarkdown({
    ...happy,
    searchDescription: 'has "quote"\nand newline',
    cover: 'path\\to\\image.jpg',
    coverAlt: 'alt: with "quote"',
  });
  const d = matter(md).data;
  assert.equal(d.searchDescription, 'has "quote" and newline');
  assert.equal(d.cover, 'path\\to\\image.jpg');
  assert.equal(d.coverAlt, 'alt: with "quote"');
});

check('58 analyzeReadyGap cover blocker clears once cover provided', () => {
  const before = analyzeReadyGap({ ...readyHappy, cover: '' });
  assert.ok(fieldNames(before.blocking).includes('cover'));
  const after = analyzeReadyGap({
    ...readyHappy,
    cover: '/images/placeholders/cover-placeholder.svg',
  });
  assert.equal(fieldNames(after.blocking).includes('cover'), false);
});

check('59 analyzeReadyGap searchDescription warning clears once filled', () => {
  const before = analyzeReadyGap({ ...readyHappy, searchDescription: '' });
  assert.ok(fieldNames(before.warnings).includes('searchDescription'));
  const after = analyzeReadyGap({ ...readyHappy, searchDescription: '搜尋摘要' });
  assert.equal(fieldNames(after.warnings).includes('searchDescription'), false);
});

check('60 analyzeReadyGap coverAlt warning clears once filled', () => {
  const before = analyzeReadyGap({ ...readyHappy, coverAlt: '' });
  assert.ok(fieldNames(before.warnings).includes('coverAlt'));
  const after = analyzeReadyGap({ ...readyHappy, coverAlt: '封面圖替代文字' });
  assert.equal(fieldNames(after.warnings).includes('coverAlt'), false);
});

check('61 status:"draft" + draft:true preserved when richer fields filled', () => {
  // Even if user fills every optional field, export must stay draft (no ready
  // option in this slice). Mirrors smoke 24 / 51 but covers the new fields.
  const md = buildPostMarkdown({
    ...readyHappy,
    searchDescription: '搜尋摘要',
    cover: '/images/cover.jpg',
    coverAlt: 'alt text',
  });
  const d = matter(md).data;
  assert.equal(d.status, 'draft');
  assert.equal(d.draft, true);
});

check('62 null / undefined SEO / cover fields stay safe + emit ""', () => {
  for (const v of [null, undefined]) {
    const md = buildPostMarkdown({
      ...happy,
      searchDescription: v,
      cover: v,
      coverAlt: v,
    });
    const d = matter(md).data;
    assert.equal(d.searchDescription, '');
    assert.equal(d.cover, '');
    assert.equal(d.coverAlt, '');
    assert.equal(d.status, 'draft');
    assert.equal(d.draft, true);
  }
});

// Phase 20260627-admin-category-tag-registry-hints-implementation-a:
//   analyzeRegistryHints smoke cases — registry alignment hint helper.
//   Lock shape consumed by Admin UI Ready preflight panel + mirror rules from
//   validate-content.js (unknown-category / category-site-mismatch /
//   unknown-tag / tag-site-mismatch). Must NOT mutate buildPostMarkdown output
//   (case 75 locks this), MUST NOT throw on missing / empty registries, and
//   MUST treat entry.site=[] as "no site constraint" (case 73).
const REGS = {
  categories: [
    { id: 'tech-note', slug: 'tech-note', site: ['github', 'blogger'] },
    { id: 'book-review', slug: 'book-review', site: ['blogger'] },
  ],
  tags: [
    { id: 'github', slug: 'github', site: ['github'] },
    { id: 'vite', slug: 'vite', site: ['github'] },
    { id: 'book', slug: 'book', site: ['blogger'] },
  ],
};

check('63 analyzeRegistryHints known category + known tags → no hints', () => {
  const r = analyzeRegistryHints(
    { site: 'github', category: 'tech-note', tags: 'github, vite' },
    REGS
  );
  assert.equal(r.hasHints, false);
  assert.deepEqual(r.hints, []);
});

check('64 analyzeRegistryHints unknown category → unknown-category hint', () => {
  const r = analyzeRegistryHints(
    { site: 'github', category: 'made-up-cat', tags: '' },
    REGS
  );
  assert.equal(r.hasHints, true);
  assert.equal(r.hints.length, 1);
  assert.equal(r.hints[0].kind, 'unknown-category');
  assert.equal(r.hints[0].field, 'category');
  assert.equal(r.hints[0].value, 'made-up-cat');
  assert.equal(typeof r.hints[0].label, 'string');
});

check('65 analyzeRegistryHints category-site-mismatch hint', () => {
  // book-review allowed sites=[blogger]; site=github → mismatch
  const r = analyzeRegistryHints(
    { site: 'github', category: 'book-review', tags: '' },
    REGS
  );
  assert.equal(r.hasHints, true);
  const kinds = r.hints.map((h) => h.kind);
  assert.ok(kinds.includes('category-site-mismatch'));
  const hint = r.hints.find((h) => h.kind === 'category-site-mismatch');
  assert.deepEqual(hint.siteAllowed, ['blogger']);
  assert.equal(hint.siteCurrent, 'github');
});

check('66 analyzeRegistryHints unknown tag → unknown-tag hint', () => {
  const r = analyzeRegistryHints(
    { site: 'github', category: '', tags: 'made-up-tag' },
    REGS
  );
  assert.equal(r.hasHints, true);
  assert.equal(r.hints[0].kind, 'unknown-tag');
  assert.equal(r.hints[0].field, 'tags');
  assert.equal(r.hints[0].value, 'made-up-tag');
});

check('67 analyzeRegistryHints tag-site-mismatch hint', () => {
  // book allowed sites=[blogger]; site=github → mismatch
  const r = analyzeRegistryHints(
    { site: 'github', category: '', tags: 'book' },
    REGS
  );
  const kinds = r.hints.map((h) => h.kind);
  assert.ok(kinds.includes('tag-site-mismatch'));
});

check('68 analyzeRegistryHints empty registries → no hints, no throw', () => {
  const r1 = analyzeRegistryHints(
    { site: 'github', category: 'whatever', tags: 'whatever' },
    {}
  );
  const r2 = analyzeRegistryHints(
    { site: 'github', category: 'whatever', tags: 'whatever' }
  );
  const r3 = analyzeRegistryHints(
    { site: 'github', category: 'whatever', tags: 'whatever' },
    null
  );
  const r4 = analyzeRegistryHints(
    { site: 'github', category: 'whatever', tags: 'whatever' },
    { categories: [], tags: [] }
  );
  for (const r of [r1, r2, r3, r4]) {
    assert.deepEqual(r.hints, []);
    assert.equal(r.hasHints, false);
  }
});

check('69 analyzeRegistryHints null / undefined input safe', () => {
  assert.doesNotThrow(() => analyzeRegistryHints(null, REGS));
  assert.doesNotThrow(() => analyzeRegistryHints(undefined, REGS));
  assert.doesNotThrow(() => analyzeRegistryHints(null, null));
  const r1 = analyzeRegistryHints(null, REGS);
  assert.deepEqual(r1.hints, []);
  assert.equal(r1.hasHints, false);
});

check('70 analyzeRegistryHints matches by id OR slug', () => {
  const localRegs = {
    tags: [
      { id: 'tag-id-only', slug: '', site: [] },
      { id: '', slug: 'slug-only', site: [] },
    ],
  };
  const r1 = analyzeRegistryHints(
    { site: 'github', category: '', tags: 'tag-id-only' },
    localRegs
  );
  const r2 = analyzeRegistryHints(
    { site: 'github', category: '', tags: 'slug-only' },
    localRegs
  );
  assert.equal(r1.hasHints, false);
  assert.equal(r2.hasHints, false);
});

check('71 analyzeRegistryHints site-mismatch only when entry.site non-empty', () => {
  const localRegs = {
    tags: [{ id: 'wildcard', slug: 'wildcard', site: [] }],
  };
  const r = analyzeRegistryHints(
    { site: 'github', category: '', tags: 'wildcard' },
    localRegs
  );
  // entry.site=[] interpreted as "no constraint" → no mismatch hint
  assert.equal(r.hasHints, false);
});

check('72 analyzeRegistryHints multiple unknown tags accumulate', () => {
  const r = analyzeRegistryHints(
    { site: 'github', category: '', tags: 'a, b, c' },
    REGS
  );
  assert.equal(r.hints.length, 3);
  for (const h of r.hints) {
    assert.equal(h.kind, 'unknown-tag');
    assert.equal(h.field, 'tags');
  }
});

check('73 analyzeRegistryHints empty category + empty tags → no hints', () => {
  const r = analyzeRegistryHints(
    { site: 'github', category: '', tags: '' },
    REGS
  );
  assert.equal(r.hasHints, false);
});

check('74 analyzeRegistryHints invalid site falls back to github for mismatch check', () => {
  // pickEnum fallback: site='twitter' → 'github'
  // book (allowed=[blogger]) → mismatch against github
  const r = analyzeRegistryHints(
    { site: 'twitter', category: '', tags: 'book' },
    REGS
  );
  const hint = r.hints.find((h) => h.kind === 'tag-site-mismatch');
  assert.ok(hint);
  assert.equal(hint.siteCurrent, 'github');
});

check('75 analyzeRegistryHints does not alter buildPostMarkdown output', () => {
  const inputs = [
    { ...happy, category: 'unknown-cat', tags: 'unknown-tag1, unknown-tag2' },
    { ...happy, site: 'blogger', category: 'tech-note', tags: 'github' },
    { ...happy, category: 'book-review' },
  ];
  for (const inp of inputs) {
    analyzeRegistryHints(inp, REGS);
    const md = buildPostMarkdown(inp);
    const d = matter(md).data;
    assert.equal(d.status, 'draft');
    assert.equal(d.draft, true);
  }
});

// Phase 20260627-admin-draft-markdown-output-usability-slice-a:
//   buildExportSummary smoke cases — at-a-glance digest helper for the Admin
//   draft summary strip. Locks shape + status invariant + counts + limits so
//   the inline UI mirror stays aligned with the server helper.
check('76 buildExportSummary happy → shape + values', () => {
  const s = buildExportSummary(happy);
  assert.equal(s.site, 'github');
  assert.equal(s.contentKind, 'tech-note');
  assert.equal(s.primaryPlatform, 'github');
  assert.equal(s.slug, 'test-post');
  assert.equal(s.filename, '2026-06-27-test-post.md');
  assert.equal(s.targetFolder, 'content/github/posts/');
  assert.equal(s.targetPath, 'content/github/posts/2026-06-27-test-post.md');
  assert.equal(s.status, 'draft');
  assert.equal(s.draft, true);
  assert.equal(s.ready.ok, true);
  assert.deepEqual(s.ready.missing, []);
});

check('77 buildExportSummary counts match trimmed input lengths', () => {
  const s = buildExportSummary({
    ...happy,
    title: '  abcd  ',
    description: '一二三四五',
    searchDescription: '搜尋摘要',
    coverAlt: '封面替代',
    tags: 'a, b, c',
  });
  assert.equal(s.counts.title, 4);
  assert.equal(s.counts.description, 5);
  assert.equal(s.counts.searchDescription, 4);
  assert.equal(s.counts.coverAlt, 4);
  assert.equal(s.counts.tags, 3);
});

check('78 buildExportSummary limits mirror READY_MAX_* constants', () => {
  const s = buildExportSummary(happy);
  assert.equal(s.limits.titleMax, READY_MAX_TITLE_LEN);
  assert.equal(s.limits.descriptionMax, READY_MAX_DESCRIPTION_LEN);
});

check('79 buildExportSummary invalid slug → slug empty, filename empty, targetPath empty', () => {
  const s = buildExportSummary({ ...happy, slug: 'BAD SLUG' });
  assert.equal(s.slug, '');
  assert.equal(s.filename, '');
  assert.equal(s.targetPath, '');
  assert.equal(s.targetFolder, 'content/github/posts/');
  assert.equal(s.ready.ok, false);
  assert.ok(s.ready.missing.includes('slug'));
});

check('80 buildExportSummary invalid date → filename empty, targetPath empty, status still draft', () => {
  const s = buildExportSummary({ ...happy, date: '06/27/2026' });
  assert.equal(s.filename, '');
  assert.equal(s.targetPath, '');
  assert.equal(s.status, 'draft');
  assert.equal(s.draft, true);
  assert.ok(s.ready.missing.includes('date'));
});

check('81 buildExportSummary site=blogger → blogger folder + path', () => {
  const s = buildExportSummary({ ...happy, site: 'blogger' });
  assert.equal(s.targetFolder, 'content/blogger/posts/');
  assert.equal(s.targetPath, 'content/blogger/posts/2026-06-27-test-post.md');
  assert.equal(s.primaryPlatform, 'github', 'primaryPlatform unchanged unless caller overrides');
});

check('82 buildExportSummary invalid site / contentKind fall back', () => {
  const s = buildExportSummary({ ...happy, site: 'twitter', contentKind: 'rants' });
  assert.equal(s.site, 'github');
  assert.equal(s.contentKind, 'tech-note');
  assert.equal(s.targetFolder, 'content/github/posts/');
});

check('83 buildExportSummary status / draft always literal regardless of input', () => {
  // Mirrors smoke 24 / 51 — at-a-glance digest must never advertise ready.
  const inputs = [
    { ...happy, status: 'ready', draft: false },
    { ...happy, contentKind: 'book-review' },
    { ...happy, title: '', slug: '', date: '' },
  ];
  for (const inp of inputs) {
    const s = buildExportSummary(inp);
    assert.equal(s.status, 'draft');
    assert.equal(s.draft, true);
  }
});

check('84 buildExportSummary null / undefined input does not throw + defaults stable', () => {
  for (const v of [null, undefined]) {
    const s = buildExportSummary(v);
    assert.equal(s.site, 'github');
    assert.equal(s.contentKind, 'tech-note');
    assert.equal(s.primaryPlatform, 'github');
    assert.equal(s.slug, '');
    assert.equal(s.filename, '');
    assert.equal(s.targetFolder, 'content/github/posts/');
    assert.equal(s.targetPath, '');
    assert.equal(s.status, 'draft');
    assert.equal(s.draft, true);
    assert.equal(s.ready.ok, false);
    assert.equal(s.counts.title, 0);
    assert.equal(s.counts.description, 0);
    assert.equal(s.counts.searchDescription, 0);
    assert.equal(s.counts.coverAlt, 0);
    assert.equal(s.counts.tags, 0);
    assert.equal(s.limits.titleMax, READY_MAX_TITLE_LEN);
    assert.equal(s.limits.descriptionMax, READY_MAX_DESCRIPTION_LEN);
  }
});

check('85 buildExportSummary does not alter buildPostMarkdown output', () => {
  // Read-only invariant: calling buildExportSummary first must not mutate
  // anything downstream — buildPostMarkdown still emits status:"draft" + draft:true.
  const inputs = [
    happy,
    { ...happy, slug: '', date: '' },
    { ...happy, contentKind: 'download' },
  ];
  for (const inp of inputs) {
    buildExportSummary(inp);
    const md = buildPostMarkdown(inp);
    const d = matter(md).data;
    assert.equal(d.status, 'draft');
    assert.equal(d.draft, true);
  }
});

check('86 buildExportSummary tag counter dedupes / trims (matches normalizeTags rule)', () => {
  const s = buildExportSummary({
    ...happy,
    tags: ' github , vite, github , , react ',
  });
  // Mirrors smoke 10 normalization rule — first-seen unique non-empty.
  assert.equal(s.counts.tags, 3);
});

// Phase 20260627-admin-markdown-export-cross-helper-smoke-evidence:
//   Cross-helper invariant cases. The individual helpers already have
//   per-helper non-mutation cases (24 / 51 / 75 / 85) and per-rule edge cases
//   (35–39 / 41–50 / 63–74). These 5 cases lock the *combined* behaviour
//   the Admin UI relies on every keystroke — all 4 read-only helpers run on
//   the same input, then buildPostMarkdown runs, and the export must still
//   emit status:"draft" + draft:true. Pure smoke; no new exports.
check('87 analyzeRegistryHints accumulates category + tag hints in input order', () => {
  // category-site-mismatch comes first (max 1, scanned before tags), then tag
  // hints follow input order. 'github' is known + allowed for github → no hint.
  const r = analyzeRegistryHints(
    { site: 'github', category: 'book-review', tags: 'made-up, book, github' },
    REGS
  );
  assert.equal(r.hasHints, true);
  assert.equal(r.hints.length, 3, 'expected 1 category + 2 tag hints');
  assert.equal(r.hints[0].kind, 'category-site-mismatch');
  assert.equal(r.hints[0].value, 'book-review');
  assert.equal(r.hints[1].kind, 'unknown-tag');
  assert.equal(r.hints[1].value, 'made-up');
  assert.equal(r.hints[2].kind, 'tag-site-mismatch');
  assert.equal(r.hints[2].value, 'book');
});

check('88 cross-helper sequence does not throw and does not flip export to ready', () => {
  // Mirrors the Admin UI recompute() ordering: isExportReady → analyzeReadyGap →
  // analyzeRegistryHints → buildExportSummary → buildPostMarkdown. Locks that
  // any combination of input states keeps the export draft-only.
  const inputs = [
    happy,                                                  // valid draft baseline
    {},                                                      // all missing
    { ...readyHappy, status: 'ready', draft: false },        // pretends to be ready
    { ...readyHappy, category: 'unknown-cat', tags: 'a,b' }, // registry mismatches
    null,                                                    // null safety
  ];
  for (const inp of inputs) {
    assert.doesNotThrow(() => {
      isExportReady(inp);
      analyzeReadyGap(inp);
      analyzeRegistryHints(inp, REGS);
      buildExportSummary(inp);
    });
    const d = matter(buildPostMarkdown(inp)).data;
    assert.equal(d.status, 'draft', 'status must stay draft after full helper sequence');
    assert.equal(d.draft, true, 'draft must stay true after full helper sequence');
  }
});

check('89 many tags input handled without throw; counts + hints match expected', () => {
  // Stress case — 20 tags total: 2 known (github, vite) + 18 unknown.
  // analyzeRegistryHints must report 18 unknown-tag hints; buildExportSummary
  // counts.tags must reflect the deduped (=20) array; buildPostMarkdown emits
  // all 20 in tags[] without breaking gray-matter parsing.
  const known = ['github', 'vite'];
  const unknown = Array.from({ length: 18 }, (_, i) => 'unknown-' + i);
  const tagsList = known.concat(unknown);
  const input = { site: 'github', category: 'tech-note', tags: tagsList };
  const hints = analyzeRegistryHints(input, REGS);
  const unknownCount = hints.hints.filter((h) => h.kind === 'unknown-tag').length;
  assert.equal(unknownCount, 18);
  const summary = buildExportSummary({ ...happy, tags: tagsList });
  assert.equal(summary.counts.tags, 20);
  const parsed = matter(buildPostMarkdown({ ...happy, tags: tagsList }));
  assert.equal(parsed.data.tags.length, 20);
  assert.equal(parsed.data.status, 'draft');
});

check('90 cross-consistency: isExportReady.ok=true ⇒ filename and targetPath non-empty', () => {
  // When isExportReady reports OK, buildExportSummary MUST be able to produce
  // both filename and targetPath — these power the Download / Copy target path
  // buttons that gate on isExportReady. Locks the contract so the UI cannot
  // expose an enabled Download button with an empty filename.
  for (const inp of [happy, readyHappy, { ...happy, site: 'blogger' }]) {
    const ready = isExportReady(inp);
    const summary = buildExportSummary(inp);
    if (ready.ok) {
      assert.notEqual(summary.filename, '', 'filename must be present when ready.ok');
      assert.notEqual(summary.targetPath, '', 'targetPath must be present when ready.ok');
      assert.equal(summary.targetPath, summary.targetFolder + summary.filename);
    }
  }
  // Conversely: any single missing/invalid required field → targetPath empty.
  const failures = [
    { ...happy, title: '' },           // title missing — filename still works but ready=false
    { ...happy, slug: '' },            // slug invalid → filename empty
    { ...happy, date: '2026/06/27' },  // date format bad → filename empty
  ];
  for (const inp of failures) {
    const ready = isExportReady(inp);
    const summary = buildExportSummary(inp);
    assert.equal(ready.ok, false);
    // title-only failure still yields a filename (title is not part of filename);
    // slug / date failures must zero filename + targetPath.
    if (ready.missing.includes('slug') || ready.missing.includes('date')) {
      assert.equal(summary.filename, '');
      assert.equal(summary.targetPath, '');
    }
  }
});

check('91 defense-in-depth: input pretending to be ready cannot flip export status', () => {
  // Even when every analyzer reports "this looks ready", buildPostMarkdown
  // STILL emits status:"draft" + draft:true. The export is the single source
  // of truth for what lands in content/{site}/posts/*.md; analysis is hint-only.
  const pretend = {
    ...readyHappy,
    status: 'ready',
    draft: false,
    publishedAt: '2026-06-27T12:00:00Z',  // ignored — no such field on input contract
  };
  const ready = isExportReady(pretend);
  const gap = analyzeReadyGap(pretend);
  const summary = buildExportSummary(pretend);
  assert.equal(ready.ok, true);
  assert.equal(gap.ok, true);
  assert.equal(gap.summary, 'ready-candidate');
  assert.equal(summary.status, 'draft', 'summary.status must be literal "draft"');
  assert.equal(summary.draft, true, 'summary.draft must be literal true');
  assert.equal(summary.ready.ok, true);
  const d = matter(buildPostMarkdown(pretend)).data;
  assert.equal(d.status, 'draft', 'frontmatter status MUST stay draft');
  assert.equal(d.draft, true, 'frontmatter draft MUST stay true');
});

// Phase 20260627-admin-markdown-export-ui-preflight-hardening-a:
//   Defense-in-depth lock on the raw markdown TEXT (not just gray-matter parsed
//   data). Case 91 already locks parsed `d.status === 'draft'` via gray-matter,
//   but the Admin "Draft-only contract" callout claims literally
//   `status: "draft"` and `draft: true` appear in the file. Lock those literal
//   substrings so any future helper refactor that switches YAML quoting style
//   without updating UI copy will surface here.
check('92 raw markdown text contains literal `status: "draft"` and `draft: true` lines', () => {
  const inputs = [
    happy,
    {},
    null,
    undefined,
    { ...readyHappy, status: 'ready', draft: false },  // pretend-ready must NOT flip serialized text
    { ...happy, site: 'blogger' },
    { ...happy, title: 'edge "quoted" title', slug: 'edge-case' },
  ];
  for (const inp of inputs) {
    const md = buildPostMarkdown(inp);
    assert.ok(
      /^status: "draft"$/m.test(md),
      'raw markdown MUST contain literal `status: "draft"` line (input: ' + JSON.stringify(inp) + ')'
    );
    assert.ok(
      /^draft: true$/m.test(md),
      'raw markdown MUST contain literal `draft: true` line (input: ' + JSON.stringify(inp) + ')'
    );
    // Cross-lock: must NOT contain ready / published / draft:false text anywhere in frontmatter.
    const fmEnd = md.indexOf('\n---', 4);
    const frontmatter = fmEnd > 0 ? md.slice(0, fmEnd) : md;
    assert.ok(!/^status: "ready"$/m.test(frontmatter), 'frontmatter MUST NOT contain `status: "ready"`');
    assert.ok(!/^status: "published"$/m.test(frontmatter), 'frontmatter MUST NOT contain `status: "published"`');
    assert.ok(!/^draft: false$/m.test(frontmatter), 'frontmatter MUST NOT contain `draft: false`');
  }
});

// Phase 20260627-admin-markdown-export-import-flow-hygiene-a:
//   Lock Admin UI manual import flow to 5 steps (matches actual DOM since
//   slice2-a). Browser smoke 2026-06-27 confirmed 5 <li>; source comment near
//   line 2019 used to claim "4 步" which drifted out of sync. This smoke
//   pins both the source comment hygiene and the DOM li count so any future
//   silent regression (e.g. dropping a step or reintroducing the stale "4 步"
//   wording) surfaces here instead of waiting for the next browser smoke.
//
//   No DOM / no headless browser; pure string scan of the EJS source. The
//   <ol> in question is the only `class="..."` ol inside `.npd-import-flow`
//   (a literal source string), making the slice deterministic.
check('93 admin index.ejs manual import flow is 5-step (no stale "4 步" / "4-step")', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  assert.ok(
    !/4\s*步\s*checklist/.test(src),
    'index.ejs MUST NOT still claim "4 步 checklist" (actual import flow is 5-step)'
  );
  assert.ok(
    !/4-step\s+(checklist|import|flow)/i.test(src),
    'index.ejs MUST NOT mention "4-step checklist/import/flow" (actual import flow is 5-step)'
  );
  assert.ok(
    !/four[-\s]step\s+(checklist|import|flow)/i.test(src),
    'index.ejs MUST NOT mention "four-step checklist/import/flow" (actual import flow is 5-step)'
  );

  const flowAnchor = src.indexOf('class="npd-import-flow"');
  assert.ok(flowAnchor > 0, 'index.ejs MUST contain `class="npd-import-flow"` block');
  const olOpen = src.indexOf('<ol', flowAnchor);
  const olClose = src.indexOf('</ol>', olOpen);
  assert.ok(olOpen > flowAnchor && olClose > olOpen, 'npd-import-flow MUST contain an <ol>…</ol> checklist after the anchor');
  const olBlock = src.slice(olOpen, olClose);
  const liMatches = olBlock.match(/<li(\s|>)/g) || [];
  assert.equal(
    liMatches.length,
    5,
    `manual import flow <ol> MUST have exactly 5 <li> (found ${liMatches.length})`
  );
});

// Phase 20260628-admin-markdown-export-client-mirror-hygiene-a:
//   Lock the EJS client-side mirror of TARGET_FOLDERS + VALIDATION_COMMAND
//   against the server-side constants. The Admin UI inline <script>
//   (slice2-a) hardcodes these for buildTargetPath + Copy validation command;
//   the initial DOM in #npd-target-folder + #npd-validation-command also
//   surfaces the same strings before the first recompute(). Either side could
//   silently drift from admin-markdown-export.js. This smoke surfaces drift
//   without waiting for a manual browser smoke. Pure string scan; no DOM.
check('94 admin index.ejs client mirrors TARGET_FOLDERS / VALIDATION_COMMAND from server', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  const jsGh = "github: '" + TARGET_FOLDERS.github + "'";
  const jsBg = "blogger: '" + TARGET_FOLDERS.blogger + "'";
  const jsCmd = "var VALIDATION_COMMAND = '" + VALIDATION_COMMAND + "'";

  assert.ok(
    src.includes(jsGh),
    `EJS client mirror MUST contain \`${jsGh}\` (drift from server TARGET_FOLDERS.github)`
  );
  assert.ok(
    src.includes(jsBg),
    `EJS client mirror MUST contain \`${jsBg}\` (drift from server TARGET_FOLDERS.blogger)`
  );
  assert.ok(
    src.includes(jsCmd),
    `EJS client mirror MUST contain \`${jsCmd}\` (drift from server VALIDATION_COMMAND)`
  );

  // Initial DOM (before first recompute()): the target-folder readout shows
  // the default github folder; the validation-command readout shows the
  // single literal command. Both must match the server-side constants.
  const folderAnchor = 'id="npd-target-folder">';
  const folderTagOpen = src.indexOf(folderAnchor);
  assert.ok(folderTagOpen > 0, 'index.ejs MUST contain `id="npd-target-folder">`');
  const folderTagClose = src.indexOf('</code>', folderTagOpen);
  assert.ok(folderTagClose > folderTagOpen, 'npd-target-folder MUST be inside a <code>…</code>');
  const folderInit = src.slice(folderTagOpen + folderAnchor.length, folderTagClose);
  assert.equal(
    folderInit,
    TARGET_FOLDERS.github,
    `npd-target-folder initial text MUST equal server TARGET_FOLDERS.github (got \`${folderInit}\`)`
  );

  const cmdAnchor = 'id="npd-validation-command">';
  const cmdTagOpen = src.indexOf(cmdAnchor);
  assert.ok(cmdTagOpen > 0, 'index.ejs MUST contain `id="npd-validation-command">`');
  const cmdTagClose = src.indexOf('</code>', cmdTagOpen);
  assert.ok(cmdTagClose > cmdTagOpen, 'npd-validation-command MUST be inside a <code>…</code>');
  const cmdInit = src.slice(cmdTagOpen + cmdAnchor.length, cmdTagClose);
  assert.equal(
    cmdInit,
    VALIDATION_COMMAND,
    `npd-validation-command initial text MUST equal server VALIDATION_COMMAND (got \`${cmdInit}\`)`
  );
});

// Phase 20260628-admin-markdown-import-flow-button-gating-hygiene-a:
//   Lock the initial disabled / aria-disabled attribute pattern on the 4
//   buttons that make up the manual import flow group (slice2-a contract):
//     - #npd-copy            Copy markdown            MUST start disabled
//     - #npd-download        Download .md             MUST start disabled
//     - #npd-copy-path       Copy target path         MUST start disabled
//     - #npd-copy-cmd        Copy validation command  MUST NOT carry disabled
//
//   The first three share isExportReady gating (title + slug + date) per the
//   panel text around L2035 ("三顆都會被 disable") and the inline JS at
//   recompute() / DL_BTN / COPY_PATH_BTN. The fourth is always-enabled
//   because the command string is a static literal (no input dependency).
//
//   Note on DOM scope: #npd-copy and #npd-download physically live in the
//   markdown preview block immediately above .npd-import-flow (lines
//   ~2010–2013), while #npd-copy-path and #npd-copy-cmd sit inside the
//   .npd-import-flow block. The slice2-a contract groups all four
//   regardless of parent class; we scan by id so the smoke captures the
//   logical group, not the DOM parent.
//
//   Pure EJS source string scan; no DOM, no headless browser.
check('95 admin index.ejs manual import flow button gating preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  function buttonOpenTag(id) {
    const idLit = 'id="' + id + '"';
    const idPos = src.indexOf(idLit);
    assert.ok(idPos > 0, `index.ejs MUST contain a button with \`${idLit}\``);
    const tagStart = src.lastIndexOf('<button', idPos);
    assert.ok(tagStart > 0, `\`${idLit}\` MUST be inside a <button …> opening tag`);
    const tagEnd = src.indexOf('>', idPos);
    assert.ok(tagEnd > idPos, `\`${idLit}\` opening tag MUST close with \`>\``);
    return src.slice(tagStart, tagEnd + 1);
  }

  const gated = ['npd-copy', 'npd-download', 'npd-copy-path'];
  for (const id of gated) {
    const tag = buttonOpenTag(id);
    assert.ok(
      /\sdisabled(\s|>)/.test(tag),
      `#${id} MUST carry initial \`disabled\` attribute (gated by isExportReady)`
    );
    assert.ok(
      /\saria-disabled="true"/.test(tag),
      `#${id} MUST carry initial \`aria-disabled="true"\` attribute (gated by isExportReady)`
    );
  }

  // #npd-copy-cmd is the always-enabled exception; it copies a static string
  // (VALIDATION_COMMAND) and never depends on isExportReady. Disallow the
  // literal `disabled` attribute. Leading-whitespace anchor in the regex
  // ensures we do NOT accidentally match `aria-disabled` (different attr).
  const alwaysOn = buttonOpenTag('npd-copy-cmd');
  assert.ok(
    !/\sdisabled(\s|>|=)/.test(alwaysOn),
    '#npd-copy-cmd MUST NOT carry `disabled` (always-enabled static string; per panel text around L2035)'
  );
});

console.log(`\n${passed} / ${passed + failed} PASS${failed ? ` (${failed} FAIL)` : ''}`);
process.exit(failed === 0 ? 0 : 1);
