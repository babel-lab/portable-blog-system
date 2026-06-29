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

// Phase 20260628-admin-markdown-import-flow-runtime-button-gating-hygiene-a:
//   Lock the recompute() runtime re-gating that mirrors the initial HTML
//   attribute pattern locked by smoke #95. After each input event the inline
//   <script>'s recompute() reapplies the gate; if a future refactor drops a
//   reassignment, swaps button refs, or accidentally gates COPY_CMD_BTN, the
//   initial attrs would stay correct but runtime behavior would silently
//   break. Smoke #95 locks initial HTML; smoke #96 locks runtime re-gating.
//
//   Contract:
//     - recompute() MUST contain `COPY_BTN.disabled = disable`,
//       `DL_BTN.disabled = disable`, and `COPY_PATH_BTN.disabled = disable`
//       (the 3 gated buttons per slice2-a / smoke #95).
//     - Each MUST be paired (within proximity) with the corresponding
//       `XXX.setAttribute('aria-disabled', disable ? 'true' : 'false')`.
//     - recompute() MUST NOT contain `COPY_CMD_BTN.disabled` (always-enabled
//       exception per smoke #95).
//
//   Block extraction: linear brace-count from `function recompute() {`. The
//   current block has no `{`/`}` inside string literals or comments, so this
//   is robust. A future change that introduces such literals would surface
//   here as a loud failure (not a silent regression) — at which point the
//   extractor should be tightened.
//
//   Pure EJS source string scan; no DOM, no headless browser.
check('96 admin index.ejs recompute() runtime re-gating preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  function extractRecomputeBlock() {
    const sig = 'function recompute() {';
    const sigPos = src.indexOf(sig);
    assert.ok(sigPos > 0, 'index.ejs MUST contain `function recompute() {`');
    let depth = 0;
    // Start at the opening `{` of the function body.
    let i = sigPos + sig.length - 1;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return src.slice(sigPos, i + 1);
      }
    }
    assert.fail('index.ejs `recompute()` opening brace MUST have a matching close');
  }

  const block = extractRecomputeBlock();

  const gated = ['COPY_BTN', 'DL_BTN', 'COPY_PATH_BTN'];
  for (const name of gated) {
    const assignLit = name + '.disabled = disable';
    const setAttrLit = name + ".setAttribute('aria-disabled', disable ? 'true' : 'false')";
    const assignPos = block.indexOf(assignLit);
    assert.ok(
      assignPos >= 0,
      `recompute() MUST contain runtime re-gate \`${assignLit}\` (mirror of smoke #95 initial attr)`
    );
    const setAttrPos = block.indexOf(setAttrLit, assignPos);
    assert.ok(
      setAttrPos >= 0,
      `recompute() MUST pair \`${assignLit}\` with \`${setAttrLit}\``
    );
    // Proximity guard: the pair lives within ~200 chars in current source
    // (next non-blank line). A larger gap would suggest a refactor split.
    assert.ok(
      setAttrPos - assignPos < 200,
      `recompute() pair for ${name} MUST stay co-located (assign @${assignPos}, setAttr @${setAttrPos}; gap ${setAttrPos - assignPos})`
    );
  }

  assert.ok(
    !block.includes('COPY_CMD_BTN.disabled'),
    'recompute() MUST NOT touch `COPY_CMD_BTN.disabled` (always-enabled static VALIDATION_COMMAND copy; per smoke #95)'
  );
});

// Phase 20260628-admin-markdown-import-flow-event-wiring-symmetry-hygiene-a:
//   Lock the inline-script event-wiring tail that triggers recompute() /
//   debounceRecompute(). Smokes #95 + #96 lock gating state (initial HTML
//   attrs and runtime re-application inside recompute()) but neither
//   catches a regression that drops one of the addEventListener rows —
//   recompute() would stay mechanically correct yet never fire for the
//   missing field.
//
//   Lock layering:
//     - #95 locks initial HTML button attributes (slice2-a)
//     - #96 locks recompute() runtime re-gating (assignment + setAttribute pair)
//     - #97 locks event wiring that triggers recompute / debounceRecompute
//
//   Contract:
//     - change-event wiring MUST contain the exact 4-element array
//       `[SITE_EL, KIND_EL, PRIM_EL, CAT_EL]` and the literal listener
//       `addEventListener('change', recompute)` co-located with it.
//     - input-event wiring MUST contain the exact 9-element array
//       `[TITLE_EL, SLUG_EL, DATE_EL, TAGS_EL, DESC_EL, SEARCH_DESC_EL,
//        COVER_EL, COVER_ALT_EL, BODY_EL]` and the literal listener
//       `addEventListener('input', debounceRecompute)` co-located with it.
//     - The wiring tail MUST end with a `recompute();` initial-paint call
//       (after the input-event listener) so the first render is gated by
//       the same readiness check the events feed.
//
//   Scoping: extract the tail from `function debounceRecompute()` (which
//   sits immediately above the wiring) to the first `})();` (the
//   markdown-export IIFE close) so the scan is local — not the whole
//   inline script and certainly not the whole file. `function
//   debounceRecompute()` is a unique anchor in this file (verified at
//   smoke-authoring time); `})();` appears multiple times across the
//   file but `indexOf` from the wiring start correctly captures the
//   first one (the markdown-export IIFE close).
//
//   Pure EJS source string scan; no DOM, no headless browser.
check('97 admin index.ejs recompute / debounceRecompute event wiring preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  const wiringStartSig = 'function debounceRecompute()';
  const wiringStart = src.indexOf(wiringStartSig);
  assert.ok(wiringStart > 0, 'index.ejs MUST contain `function debounceRecompute()`');
  const iifeCloseLit = '})();';
  const wiringEnd = src.indexOf(iifeCloseLit, wiringStart);
  assert.ok(wiringEnd > wiringStart, 'index.ejs MUST contain `})();` IIFE close after debounceRecompute');
  const tail = src.slice(wiringStart, wiringEnd + iifeCloseLit.length);

  // 1. change-event wiring: exact 4-element array + co-located listener.
  const changeArr = '[SITE_EL, KIND_EL, PRIM_EL, CAT_EL]';
  const changeArrPos = tail.indexOf(changeArr);
  assert.ok(
    changeArrPos >= 0,
    `wiring tail MUST contain change-event array \`${changeArr}\``
  );
  const changeListenerLit = "addEventListener('change', recompute)";
  const changeListenerPos = tail.indexOf(changeListenerLit, changeArrPos);
  assert.ok(
    changeListenerPos >= 0,
    `wiring tail MUST wire change-event array to \`${changeListenerLit}\``
  );
  assert.ok(
    changeListenerPos - changeArrPos < 300,
    `change-event array and listener MUST stay co-located (gap ${changeListenerPos - changeArrPos})`
  );

  // 2. input-event wiring: exact 9-element array + co-located listener.
  const inputArr =
    '[TITLE_EL, SLUG_EL, DATE_EL, TAGS_EL, DESC_EL, SEARCH_DESC_EL, COVER_EL, COVER_ALT_EL, BODY_EL]';
  const inputArrPos = tail.indexOf(inputArr);
  assert.ok(
    inputArrPos >= 0,
    `wiring tail MUST contain input-event array \`${inputArr}\``
  );
  const inputListenerLit = "addEventListener('input', debounceRecompute)";
  const inputListenerPos = tail.indexOf(inputListenerLit, inputArrPos);
  assert.ok(
    inputListenerPos >= 0,
    `wiring tail MUST wire input-event array to \`${inputListenerLit}\``
  );
  assert.ok(
    inputListenerPos - inputArrPos < 500,
    `input-event array and listener MUST stay co-located (gap ${inputListenerPos - inputArrPos})`
  );

  // 3. Trailing initial-paint call AFTER the input wiring — so the first
  // render runs through the same gating check as later events.
  const initPaintLit = 'recompute();';
  const initPaintPos = tail.indexOf(initPaintLit, inputListenerPos);
  assert.ok(
    initPaintPos >= 0,
    'wiring tail MUST contain trailing `recompute();` initial-paint call after the input listener'
  );
});

// Phase 20260628-admin-markdown-import-flow-missing-reason-copy-hygiene-a:
//   Lock the user-facing literals returned by the inline missingReason()
//   helper. recompute() writes its output into #npd-status whenever the
//   export gate is closed (ready.missing populated). Smokes #93–#97 cover
//   structural / behavioral contracts; #98 closes the remaining gap by
//   locking the validation-missing hint copy.
//
//   Lock layering:
//     - #95 locks initial HTML button attributes
//     - #96 locks recompute() runtime re-gating
//     - #97 locks event wiring that triggers recompute / debounceRecompute
//     - #98 locks missingReason() validation hint output strings
//
//   Contract:
//     - missingReason(missing) MUST early-return `''` when `missing` is
//       null / undefined / empty (no false-positive hint when nothing is
//       wrong).
//     - The label map MUST contain the 3 literal entries Dean sees in
//       the gate-closed status line:
//         title: 'title'
//         slug:  'slug (僅 a-z 0-9 -)'
//         date:  'date (YYYY-MM-DD)'
//     - The composition MUST use the Chinese prefix `'請補上：'` and join
//       missing labels with the fullwidth comma `'、'`. Locked so a future
//       "translation" pass can't silently swap the copy without surfacing
//       here. Multi-field combination output (e.g. "請補上：title、slug")
//       is composed dynamically — there are no hardcoded N-field literal
//       strings to lock individually.
//
//   Scoping: extract the helper body via brace-counting from the unique
//   `function missingReason(` anchor (same pattern as smoke #96's
//   recompute() extractor). Safe because no `{`/`}` appear inside any of
//   the locked string literals; future refactors that introduce such
//   literals would surface as a loud extractor failure, not a silent
//   regression.
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of
//   scope: success path / other UI message hygiene.
check('98 admin index.ejs missingReason() validation hint output strings preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  function extractMissingReasonBlock() {
    const sig = 'function missingReason(';
    const sigPos = src.indexOf(sig);
    assert.ok(sigPos > 0, 'index.ejs MUST contain `function missingReason(`');
    const openBrace = src.indexOf('{', sigPos);
    assert.ok(openBrace > sigPos, '`function missingReason(...)` MUST have an opening `{`');
    let depth = 0;
    for (let i = openBrace; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return src.slice(sigPos, i + 1);
      }
    }
    assert.fail('index.ejs `missingReason()` opening brace MUST have a matching close');
  }

  const block = extractMissingReasonBlock();

  // 1. Empty / no-missing early-return. Locks both the guard predicate and
  // the empty-string return so any rewrite that silently drops the early
  // exit (or returns a non-empty hint when nothing's wrong) surfaces here.
  assert.ok(
    /if\s*\(\s*!missing\s*\|\|\s*missing\.length\s*===\s*0\s*\)\s*return\s*''/.test(block),
    "`missingReason()` MUST early-return `''` for null / empty missing arrays"
  );

  // 2. Label literals: the user-facing label for each ready.missing field.
  // These are exactly the strings #npd-status surfaces — silent drift here
  // would change Dean's UX without breaking any other smoke.
  const labelLits = [
    "title: 'title'",
    "slug: 'slug (僅 a-z 0-9 -)'",
    "date: 'date (YYYY-MM-DD)'",
  ];
  for (const lit of labelLits) {
    assert.ok(
      block.includes(lit),
      '`missingReason()` MUST contain label literal `' + lit + '`'
    );
  }

  // 3. Output composition: Chinese prefix + fullwidth comma joiner.
  assert.ok(
    block.includes("'請補上：'"),
    "`missingReason()` MUST use `'請補上：'` prefix for multi-missing output"
  );
  assert.ok(
    block.includes(".join('、')"),
    "`missingReason()` MUST join missing labels with fullwidth comma `'、'`"
  );
});

// Phase 20260628-admin-markdown-import-flow-show-status-display-contract-hygiene-a:
//   Lock the inline showStatus(msg, isErr) helper that drives every
//   #npd-status update inside the markdown-export IIFE. recompute()'s
//   validation-missing branch and the Copy / Download click handlers all
//   route through this helper; #98 locked the validation-missing copy
//   itself, but the display contract (colors / timing / unchanged-guard)
//   was still un-locked until now.
//
//   Lock layering:
//     - #95 locks initial HTML button attributes
//     - #96 locks recompute() runtime re-gating
//     - #97 locks event wiring that triggers recompute / debounceRecompute
//     - #98 locks missingReason() validation hint output strings
//     - #99 locks showStatus() display contract
//
//   Contract:
//     - Error color literal: `'#a00'` (set when `isErr` truthy)
//     - Success color literal: `'#080'` (set when `isErr` falsy)
//     - Auto-clear timeout: `setTimeout(..., 2000)` — silent removal /
//       change would either leave stale messages forever (delay dropped)
//       or strobe too fast to read.
//     - Clear-only-if-unchanged guard: `STATUS_EL.textContent === msg` —
//       without this guard, a stale "clear" call from an earlier message
//       could clobber a newer status update (common timing gotcha).
//
//   Disambiguation: the file contains THREE `function showStatus(`
//   declarations (one per IIFE). Anchoring directly on `function
//   showStatus(` would be ambiguous. We disambiguate by anchoring on the
//   unique `function missingReason(` (locked by smoke #98) and searching
//   the `function showStatus(` signature FORWARD from there — this
//   deterministically lands on the markdown-export IIFE's version, which
//   is the one paired with recompute() / missingReason() /
//   debounceRecompute(). A sanity check then confirms the extracted block
//   references the capitalized `STATUS_EL` closure variable (the other
//   two IIFEs use lowercased `statusEl`).
//
//   Scoping: brace-count from `function showStatus(` (after disambiguation)
//   to the matching `}`. Safe because the body has no `{`/`}` inside
//   string literals; future refactors that introduce such literals would
//   surface as a loud extractor failure, not a silent regression.
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of
//   scope: other status helpers (e.g. showFlowStatus / nested payload
//   showStatus) or other UI message paths.
check('99 admin index.ejs showStatus() display contract preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  function extractShowStatusBlock() {
    const mrAnchor = 'function missingReason(';
    const mrPos = src.indexOf(mrAnchor);
    assert.ok(
      mrPos > 0,
      'index.ejs MUST contain `function missingReason(` (smoke #98 anchor used for disambiguation)'
    );
    const sig = 'function showStatus(';
    const sigPos = src.indexOf(sig, mrPos);
    assert.ok(
      sigPos > mrPos,
      'index.ejs MUST contain `function showStatus(` AFTER `function missingReason(` (markdown-export IIFE companion)'
    );
    const openBrace = src.indexOf('{', sigPos);
    assert.ok(openBrace > sigPos, '`function showStatus(...)` MUST have an opening `{`');
    let depth = 0;
    for (let i = openBrace; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return src.slice(sigPos, i + 1);
      }
    }
    assert.fail('index.ejs `showStatus()` opening brace MUST have a matching close');
  }

  const block = extractShowStatusBlock();

  // Disambiguation sanity: confirm we landed on the markdown-export IIFE's
  // showStatus (capitalized STATUS_EL), not one of the other two IIFEs'
  // lowercased-statusEl versions.
  assert.ok(
    block.includes('STATUS_EL'),
    'extracted showStatus() MUST reference `STATUS_EL` (markdown-export IIFE; other IIFEs use lowercased `statusEl`)'
  );

  // 1. Error color literal.
  assert.ok(
    block.includes("'#a00'"),
    "`showStatus()` MUST use `'#a00'` for error color"
  );

  // 2. Success color literal.
  assert.ok(
    block.includes("'#080'"),
    "`showStatus()` MUST use `'#080'` for success color"
  );

  // 3. Auto-clear timeout: setTimeout(..., 2000). Regex tolerates whitespace
  // variations around the delay arg but pins the literal `2000` value.
  assert.ok(
    /setTimeout\([\s\S]*?,\s*2000\s*\)/.test(block),
    '`showStatus()` MUST schedule the auto-clear via `setTimeout(..., 2000)`'
  );

  // 4. Clear-only-if-unchanged guard inside the setTimeout callback.
  assert.ok(
    block.includes('STATUS_EL.textContent === msg'),
    '`showStatus()` MUST guard the auto-clear with `STATUS_EL.textContent === msg`'
  );
});

// Phase 20260628-admin-markdown-import-flow-show-flow-status-display-contract-hygiene-a:
//   Lock the inline showFlowStatus(msg, isErr) helper that drives every
//   #npd-flow-status update. This is the manual-import-flow sibling of
//   showStatus() — paired by design but a separate helper writing to a
//   separate DOM target. The Copy target path / Copy validation command
//   button handlers (and the inline copyTextToClipboard helper) all
//   route their results through this function.
//
//   Lock layering:
//     - #99  locks showStatus()     / STATUS_EL       (markdown-preview status)
//     - #100 locks showFlowStatus() / FLOW_STATUS_EL  (manual-import-flow status)
//
//   Contract (mirrors #99 but for FLOW_STATUS_EL):
//     - Error color literal: `'#a00'`
//     - Success color literal: `'#080'`
//     - Auto-clear timeout: `setTimeout(..., 2000)` — same 2s timing as
//       the slice2-a comment at L4063 promises ("#npd-flow-status (2s clear)").
//     - Clear-only-if-unchanged guard: `FLOW_STATUS_EL.textContent === msg`
//       — same paired-message-safe pattern as showStatus().
//
//   Anchor: `function showFlowStatus(` is a UNIQUE substring in the file
//   (verified at smoke-authoring time — single occurrence at L4064). No
//   disambiguation needed unlike smoke #99 (which had 3 candidates). We
//   still add a duplicate-check assertion so any future refactor that
//   spawns a sibling helper in another IIFE surfaces here as a loud
//   failure rather than a silent regression where the smoke could match
//   the wrong copy.
//
//   Scoping: brace-count from the unique signature to the matching `}`.
//   Safe because the body has no `{`/`}` inside string literals.
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of
//   scope: other status helpers, button wiring, or copy-text behavior.
check('100 admin index.ejs showFlowStatus() display contract preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  function extractShowFlowStatusBlock() {
    const sig = 'function showFlowStatus(';
    const sigPos = src.indexOf(sig);
    assert.ok(sigPos > 0, 'index.ejs MUST contain `function showFlowStatus(`');
    // Anchor uniqueness re-verified here so a future refactor that
    // duplicates the helper across IIFEs (the way showStatus is) surfaces
    // immediately rather than silently letting indexOf grab the first one.
    const dupPos = src.indexOf(sig, sigPos + sig.length);
    assert.ok(
      dupPos < 0,
      'index.ejs MUST contain exactly one `function showFlowStatus(` (no IIFE duplicates expected; if intentional, add a disambiguation strategy like smoke #99)'
    );
    const openBrace = src.indexOf('{', sigPos);
    assert.ok(openBrace > sigPos, '`function showFlowStatus(...)` MUST have an opening `{`');
    let depth = 0;
    for (let i = openBrace; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return src.slice(sigPos, i + 1);
      }
    }
    assert.fail('index.ejs `showFlowStatus()` opening brace MUST have a matching close');
  }

  const block = extractShowFlowStatusBlock();

  // Sanity: helper MUST reference the FLOW_STATUS_EL closure variable
  // (parallel to STATUS_EL for the markdown-preview helper locked by #99).
  assert.ok(
    block.includes('FLOW_STATUS_EL'),
    'extracted showFlowStatus() MUST reference `FLOW_STATUS_EL` (manual-import-flow status closure)'
  );

  // 1. Error color literal.
  assert.ok(
    block.includes("'#a00'"),
    "`showFlowStatus()` MUST use `'#a00'` for error color"
  );

  // 2. Success color literal.
  assert.ok(
    block.includes("'#080'"),
    "`showFlowStatus()` MUST use `'#080'` for success color"
  );

  // 3. Auto-clear timeout: setTimeout(..., 2000). Regex tolerates whitespace
  // variations around the delay arg but pins the literal `2000` value.
  assert.ok(
    /setTimeout\([\s\S]*?,\s*2000\s*\)/.test(block),
    '`showFlowStatus()` MUST schedule the auto-clear via `setTimeout(..., 2000)`'
  );

  // 4. Clear-only-if-unchanged guard inside the setTimeout callback.
  assert.ok(
    block.includes('FLOW_STATUS_EL.textContent === msg'),
    '`showFlowStatus()` MUST guard the auto-clear with `FLOW_STATUS_EL.textContent === msg`'
  );
});

// Phase 20260628-admin-markdown-import-flow-copy-text-to-clipboard-contract-hygiene-a:
//   Lock the inline copyTextToClipboard(text, okMsg) helper that backs the two
//   manual-import-flow Copy buttons (#npd-copy-path / #npd-copy-cmd). This is
//   the runtime path Dean exercises every time he runs the import drill — and
//   it is the only remaining unlocked piece of the markdown-export IIFE
//   chain after smokes #93–#100.
//
//   Lock layering (regression net):
//     - #93  markup hygiene  (5-step <ol>)
//     - #94  client-mirror   (TARGET_FOLDERS / VALIDATION_COMMAND)
//     - #95  initial gating  (initial HTML disabled / aria-disabled)
//     - #96  runtime gating  (recompute() runtime re-gate)
//     - #97  event wiring    (change / input listeners + initial paint)
//     - #98  missing reason  (validation hint output strings)
//     - #99  showStatus      (markdown-preview status display)
//     - #100 showFlowStatus  (manual-import-flow status display)
//     - #101 copyTextToClipboard (clipboard-side contract)
//
//   Contract:
//     - Both paths' SUCCESS handler MUST delegate to `showFlowStatus(okMsg, false)`
//       — caller-controlled message (#npd-copy-path: '已複製 path';
//       #npd-copy-cmd: '已複製指令'). Locking the param-passthrough prevents a
//       silent refactor that hardcodes a generic '已複製' which would drop the
//       per-button context Dean uses to tell the two buttons apart.
//     - Both paths' FAILURE handler MUST surface `showFlowStatus('複製失敗，請手動選取', true)`
//       — exact literal (no `…後 Ctrl+C` suffix; that suffix belongs to the
//       other IIFE clipboard helpers at L3091 / L3392 / L3394 / L4045 / L4047
//       which use showStatus). The literal MUST occur exactly 3 times inside
//       the helper: (1) modern `.catch()`, (2) fallback `else`, (3) outer
//       `try/catch` envelope.
//     - Modern path MUST call `navigator.clipboard.writeText(text)` — the
//       Promise-based API. Without this, Chrome / Firefox modern path
//       silently drops to fallback every keystroke.
//     - Fallback path MUST use `document.createElement('textarea')` +
//       `document.execCommand('copy')` — the legacy reliable path for
//       browsers without clipboard API (or for non-secure contexts).
//     - Outer try/catch envelope MUST exist so a thrown DOM exception
//       (e.g. createElement under a hostile CSP) still surfaces a visible
//       failure to Dean instead of going silent.
//
//   Anchor: `function copyTextToClipboard(` is a UNIQUE substring in the
//   file (verified at smoke-authoring time — single occurrence at L4072).
//   Mirrors smoke #100's uniqueness pattern; duplicate-check assertion
//   below would surface any future refactor that spawns a sibling helper.
//
//   Scoping: brace-count from the unique signature to the matching `}`.
//   The body contains string literals with `(` and `)` but no `{` / `}`
//   (verified at smoke-authoring time); a future literal containing
//   `{` / `}` would surface as a loud extractor failure, not a silent
//   regression.
//
//   Pure EJS source string scan; no DOM, no headless browser, no
//   navigator.clipboard simulation. Out of scope: button wiring (handled
//   by smoke #95 / #96), Copy buttons' caller-side okMsg strings
//   (caller-controlled; could be locked separately if drift surfaces),
//   showStatus IIFE helpers (handled by smoke #99 / #98), fallback
//   textarea styling (cosmetic offscreen positioning, not user-visible).
check('101 admin index.ejs copyTextToClipboard() clipboard contract preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  function extractCopyTextToClipboardBlock() {
    const sig = 'function copyTextToClipboard(';
    const sigPos = src.indexOf(sig);
    assert.ok(sigPos > 0, 'index.ejs MUST contain `function copyTextToClipboard(`');
    // Anchor uniqueness — same paired-message-safe pattern as smoke #100.
    // If a future refactor splits the helper across multiple IIFEs, this
    // assertion surfaces immediately rather than letting indexOf grab the
    // first one and silently miss the second copy's contract drift.
    const dupPos = src.indexOf(sig, sigPos + sig.length);
    assert.ok(
      dupPos < 0,
      'index.ejs MUST contain exactly one `function copyTextToClipboard(` (no IIFE duplicates expected; if intentional, add a disambiguation strategy like smoke #99)'
    );
    const openBrace = src.indexOf('{', sigPos);
    assert.ok(openBrace > sigPos, '`function copyTextToClipboard(...)` MUST have an opening `{`');
    let depth = 0;
    for (let i = openBrace; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return src.slice(sigPos, i + 1);
      }
    }
    assert.fail('index.ejs `copyTextToClipboard()` opening brace MUST have a matching close');
  }

  const block = extractCopyTextToClipboardBlock();

  // 1. Modern path: navigator.clipboard.writeText(text). The Promise-based
  // API is the primary path on any secure context Chrome / Firefox; silent
  // removal (or swap to a stub) would force every Dean session into the
  // fallback path. Locking the literal substring (with `text` arg, not
  // a different param name) keeps the contract obvious.
  assert.ok(
    block.includes('navigator.clipboard.writeText(text)'),
    '`copyTextToClipboard()` MUST invoke `navigator.clipboard.writeText(text)` on the modern path'
  );

  // 2. Fallback path: document.createElement('textarea') +
  // document.execCommand('copy'). These two together prove the legacy
  // reliable path is wired; either one alone would be ambiguous (e.g.
  // execCommand could be invoked on the document selection without a
  // hidden textarea, which is unreliable on Safari mobile).
  assert.ok(
    block.includes("document.createElement('textarea')"),
    '`copyTextToClipboard()` fallback path MUST create a hidden `<textarea>` via `document.createElement(\'textarea\')`'
  );
  assert.ok(
    block.includes("document.execCommand('copy')"),
    '`copyTextToClipboard()` fallback path MUST invoke `document.execCommand(\'copy\')`'
  );

  // 3. Success delegation: showFlowStatus(okMsg, false). The caller-passed
  // okMsg MUST flow through unmodified — locks param-passthrough so a
  // future refactor that hardcodes '已複製' or '已複製 (Copied)' would
  // surface here. Appears in BOTH modern (.then) and fallback (if ok)
  // branches; locking exactly 2 occurrences ensures both paths intact.
  const successLit = 'showFlowStatus(okMsg, false)';
  const successCount = (block.match(new RegExp(successLit.replace(/[(){}.]/g, '\\$&'), 'g')) || []).length;
  assert.equal(
    successCount,
    2,
    `\`copyTextToClipboard()\` MUST call \`${successLit}\` exactly 2 times (modern .then + fallback if-ok); found ${successCount}`
  );

  // 4. Failure literal: showFlowStatus('複製失敗，請手動選取', true).
  // Exact string (no `…後 Ctrl+C` suffix — that suffix belongs to the
  // showStatus-based clipboard helpers elsewhere in the file). MUST occur
  // exactly 3 times inside this helper:
  //   (1) modern `.catch()` rejection,
  //   (2) fallback `else` branch when execCommand returns false,
  //   (3) outer `try/catch` envelope on createElement / DOM exception.
  // Counting drift surfaces any path that silently goes to no-op or to
  // a different message.
  const failureLit = "showFlowStatus('複製失敗，請手動選取', true)";
  const failureCount = (block.match(new RegExp(failureLit.replace(/[(){}.，]/g, '\\$&'), 'g')) || []).length;
  assert.equal(
    failureCount,
    3,
    `\`copyTextToClipboard()\` MUST call \`${failureLit}\` exactly 3 times (modern .catch + fallback else + outer catch); found ${failureCount}`
  );

  // 5. Outer try/catch envelope: the fallback path MUST be wrapped so a
  // DOM exception (e.g. CSP-blocked createElement, hostile environment)
  // still surfaces a visible failure rather than a silent crash. We lock
  // the inner `try { ok = document.execCommand('copy'); }` AND a separate
  // outer `try {` that wraps createElement / appendChild / removeChild.
  // Two `try {` and at least two `catch (` MUST appear.
  const tryCount = (block.match(/\btry\s*\{/g) || []).length;
  const catchCount = (block.match(/\bcatch\s*\(/g) || []).length;
  assert.ok(
    tryCount >= 2,
    `\`copyTextToClipboard()\` fallback path MUST have BOTH an outer try (DOM exception envelope) AND an inner try (execCommand guard); found ${tryCount} \`try {\` occurrences`
  );
  assert.ok(
    catchCount >= 2,
    `\`copyTextToClipboard()\` MUST have matching catch blocks for each try; found ${catchCount} \`catch (\` occurrences`
  );
});

// Phase 20260628-admin-markdown-import-flow-copy-buttons-okmsg-contract-hygiene-a:
//   Lock the caller-side okMsg literals passed into copyTextToClipboard() by
//   the two manual-import-flow Copy buttons (#npd-copy-path / #npd-copy-cmd),
//   plus the empty-target-path guard literal surfaced by the same path
//   button when the form is not yet complete.
//
//   This closes the explicit "out of scope" gap noted in smoke #101 around
//   L1748: "Copy buttons' caller-side okMsg strings (caller-controlled;
//   could be locked separately if drift surfaces)". Smoke #101 locks the
//   helper-side contract (param-passthrough of okMsg, navigator + fallback
//   path, failure literal counts); it cannot catch a caller that swaps
//   '已複製 path' for a generic '已複製' because the helper would still
//   passthrough whatever string the caller hands in.
//
//   Lock layering:
//     - #100 showFlowStatus()    display contract (color / timing / guard)
//     - #101 copyTextToClipboard() helper contract (modern + fallback paths)
//     - #102 caller-side okMsg literals for the two Copy buttons
//
//   Contract:
//     - #npd-copy-path click handler MUST call
//       `copyTextToClipboard(tp, '已複製 path')` — locks both the param
//       name (`tp`, the computed target path) and the caller-controlled
//       success message Dean uses to confirm THIS button succeeded.
//     - #npd-copy-path click handler MUST surface
//       `showFlowStatus('target path 尚未合法', true)` when `tp === ''`.
//       Locks the only user-visible surface that explains why the click
//       did nothing when the date / slug fields are not yet complete.
//     - #npd-copy-cmd click handler MUST call
//       `copyTextToClipboard(VALIDATION_COMMAND, '已複製指令')` — locks
//       both that the static VALIDATION_COMMAND constant flows through
//       (not a recomputed string) AND the distinct success message Dean
//       uses to confirm THIS button (not the path button) succeeded.
//
//   Anchor: `COPY_PATH_BTN.addEventListener('click',` and
//   `COPY_CMD_BTN.addEventListener('click',` are UNIQUE substrings in the
//   file (verified at smoke-authoring time via Grep, single occurrence
//   each). The uniqueness assertions below would catch any future refactor
//   that splits the handlers or duplicates them across IIFEs.
//
//   Scoping: rather than brace-count (the surrounding `if (COPY_PATH_BTN)
//   { ... }` adds an extra nesting layer that complicates extraction), we
//   slice a fixed-size proximity window after each anchor. The window
//   matches the current handler size with comfortable headroom; a future
//   refactor that grows the handler past the window would surface as a
//   loud failure (not a silent regression) — at which point the window
//   should be widened in step.
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of
//   scope: button wiring presence (handled by #95 / #96), guard short-
//   circuit on `.disabled` (handled by #95 / #96), helper-side okMsg
//   passthrough behavior (handled by #101).
check('102 admin index.ejs manual import flow Copy buttons caller okMsg preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  function sliceAfterUniqueAnchor(anchor, windowSize, label) {
    const pos = src.indexOf(anchor);
    assert.ok(pos > 0, `index.ejs MUST contain \`${anchor}\` (${label})`);
    const dupPos = src.indexOf(anchor, pos + anchor.length);
    assert.ok(
      dupPos < 0,
      `index.ejs MUST contain exactly one \`${anchor}\` (${label}); if intentional duplicate, add a disambiguation strategy`
    );
    return src.slice(pos, pos + windowSize);
  }

  // 1. #npd-copy-path click handler (~600 char current size; window 800
  // gives headroom for one more guard line without a smoke maintenance pass).
  const pathBlock = sliceAfterUniqueAnchor(
    "COPY_PATH_BTN.addEventListener('click',",
    800,
    '#npd-copy-path click handler'
  );

  assert.ok(
    pathBlock.includes("copyTextToClipboard(tp, '已複製 path')"),
    "#npd-copy-path click handler MUST call `copyTextToClipboard(tp, '已複製 path')` — caller-side okMsg locks per-button success context"
  );

  assert.ok(
    pathBlock.includes("showFlowStatus('target path 尚未合法', true)"),
    "#npd-copy-path click handler MUST surface `showFlowStatus('target path 尚未合法', true)` when `tp === ''` — only user-visible surface explaining the empty-path skip"
  );

  // 2. #npd-copy-cmd click handler (~200 char current size; window 500
  // gives headroom for the same reason as above).
  const cmdBlock = sliceAfterUniqueAnchor(
    "COPY_CMD_BTN.addEventListener('click',",
    500,
    '#npd-copy-cmd click handler'
  );

  assert.ok(
    cmdBlock.includes("copyTextToClipboard(VALIDATION_COMMAND, '已複製指令')"),
    "#npd-copy-cmd click handler MUST call `copyTextToClipboard(VALIDATION_COMMAND, '已複製指令')` — caller-side okMsg + static-constant passthrough"
  );
});

// Phase 20260628-admin-markdown-import-flow-target-path-empty-state-copy-hygiene-a:
//   Lock the empty-state copy of the #npd-target-path readout. Previously the
//   string was '（請補上合法 title / slug / date）' on BOTH surfaces (initial
//   DOM at L2049 + recompute() runtime fallback at L3997). buildTargetPath
//   only depends on site + date + slug (it concatenates TARGET_FOLDERS[site]
//   with buildFilename(date, slug)); title is never read. If Dean filled
//   `title` but blanked `slug`, the readout still triggered the empty-state
//   and told Dean to fix `title` — misleading, since the only way out is to
//   fix slug / date.
//
//   The fix dropped `title` from the empty-state copy on both surfaces. This
//   smoke locks the corrected contract so a future refactor cannot silently
//   reintroduce the misleading wording or drift the two surfaces apart.
//
//   Lock layering (regression net):
//     - #93  markup hygiene  (5-step <ol>)
//     - #94  client-mirror   (TARGET_FOLDERS / VALIDATION_COMMAND)
//     - #95  initial gating  (initial HTML disabled / aria-disabled)
//     - #96  runtime gating  (recompute() runtime re-gate)
//     - #97  event wiring    (change / input listeners + initial paint)
//     - #98  missing reason  (validation hint output strings)
//     - #99  showStatus      (markdown-preview status display)
//     - #100 showFlowStatus  (manual-import-flow status display)
//     - #101 copyTextToClipboard (clipboard-side contract)
//     - #102 caller-side okMsg literals for the two Copy buttons
//     - #103 target-path empty-state copy hygiene (this smoke)
//
//   Contract:
//     - Initial DOM at `id="npd-target-path">` MUST start with `（請補上合法 `
//       (gate-closed empty state) — locked so the readout is recognisably an
//       empty-state placeholder before recompute() runs.
//     - The same initial text MUST NOT include the substring `title` — since
//       buildTargetPath ignores title, surfacing title in the prompt would
//       point Dean at the wrong field.
//     - The same initial text MUST include both `slug` and `date` — the
//       actual required inputs.
//     - The recompute() runtime fallback `TARGET_PATH_EL.textContent = '…'`
//       branch MUST contain a literal starting with `（請補上合法 ` that
//       satisfies the same MUST-NOT-include-title + MUST-include-slug+date
//       rules. This locks server-side initial DOM and client-side runtime
//       fallback against drift.
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of scope:
//   the success-branch readout (the path itself) — that text is computed from
//   site + date + slug and is locked transitively by smokes #29 / #30 / #31.
check('103 admin index.ejs target-path empty-state copy does not mislead with `title`', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  // 1. Initial DOM at #npd-target-path. The smoke pattern mirrors smoke #94's
  //    extraction of `id="npd-target-folder">…</code>` and `id="npd-validation-command">…</code>`.
  const initAnchor = 'id="npd-target-path">';
  const initOpen = src.indexOf(initAnchor);
  assert.ok(initOpen > 0, 'index.ejs MUST contain `id="npd-target-path">`');
  const initClose = src.indexOf('</code>', initOpen);
  assert.ok(initClose > initOpen, '#npd-target-path MUST be inside a <code>…</code>');
  const initText = src.slice(initOpen + initAnchor.length, initClose);

  assert.ok(
    initText.indexOf('（請補上合法 ') === 0,
    "#npd-target-path initial text MUST start with `（請補上合法 ` (gate-closed empty state; got `" + initText + "`)"
  );
  assert.ok(
    !initText.includes('title'),
    "#npd-target-path initial text MUST NOT include `title` (buildTargetPath ignores title; mention would mislead Dean to the wrong field; got `" + initText + "`)"
  );
  assert.ok(
    initText.includes('slug') && initText.includes('date'),
    "#npd-target-path initial text MUST include both `slug` and `date` (the actual required inputs; got `" + initText + "`)"
  );

  // 2. Runtime fallback inside recompute(). Capture every
  //    `TARGET_PATH_EL.textContent = '…'` assignment, then locate the empty-state
  //    branch via the same `（請補上合法 ` prefix. Locking both surfaces ensures
  //    they cannot drift apart silently.
  const reAssign = /TARGET_PATH_EL\.textContent\s*=\s*'([^']*)'/g;
  const seen = [];
  let m;
  while ((m = reAssign.exec(src)) !== null) {
    seen.push(m[1]);
  }
  assert.ok(
    seen.length >= 1,
    "recompute() MUST contain at least one `TARGET_PATH_EL.textContent = '…'` literal assignment"
  );
  const emptyState = seen.find((s) => s.indexOf('（請補上合法 ') === 0);
  assert.ok(
    typeof emptyState === 'string',
    "recompute() MUST contain a `TARGET_PATH_EL.textContent = '（請補上合法 …）'` empty-state branch"
  );
  assert.ok(
    !emptyState.includes('title'),
    "recompute() empty-state for #npd-target-path MUST NOT include `title` (buildTargetPath ignores title; mention would mislead Dean to the wrong field; got `" + emptyState + "`)"
  );
  assert.ok(
    emptyState.includes('slug') && emptyState.includes('date'),
    "recompute() empty-state for #npd-target-path MUST include both `slug` and `date` (got `" + emptyState + "`)"
  );
});

// Phase 20260629-admin-markdown-import-flow-filename-empty-state-copy-hygiene-a:
//   Lock the empty-state copy of the #npd-filename readout. Parallel to smoke
//   #103 (which locks #npd-target-path against misleading `title` mentions in
//   the empty-state copy), this smoke locks the sibling #npd-filename surface
//   against the same regression class.
//
//   #npd-filename and #npd-target-path share the EXACT same trigger condition:
//   both empty-state branches fire when buildFilename(date, slug) returns ''
//   — i.e. when date OR slug is invalid. buildFilename ignores title entirely,
//   so surfacing `title` in the empty-state prompt would point Dean at the
//   wrong field, the same UX bug smoke #103 fixed for #npd-target-path.
//
//   Lock layering (regression net):
//     - #93  markup hygiene  (5-step <ol>)
//     - #94  client-mirror   (TARGET_FOLDERS / VALIDATION_COMMAND)
//     - #95  initial gating  (initial HTML disabled / aria-disabled)
//     - #96  runtime gating  (recompute() runtime re-gate)
//     - #97  event wiring    (change / input listeners + initial paint)
//     - #98  missing reason  (validation hint output strings)
//     - #99  showStatus      (markdown-preview status display)
//     - #100 showFlowStatus  (manual-import-flow status display)
//     - #101 copyTextToClipboard (clipboard-side contract)
//     - #102 caller-side okMsg literals for the two Copy buttons
//     - #103 #npd-target-path empty-state copy hygiene
//     - #104 #npd-filename    empty-state copy hygiene (this smoke)
//
//   Contract:
//     - Initial DOM at `id="npd-filename"` MUST NOT include `title` (since
//       buildFilename ignores title; mentioning it would mislead Dean).
//     - Initial DOM MUST include both `slug` and `date` — the actual
//       required inputs.
//     - The recompute() runtime fallback `FN_EL.textContent = '…'` empty-state
//       branch MUST NOT include `title` and MUST include both `slug` and `date`,
//       mirroring the initial DOM contract. Locking both surfaces ensures
//       they cannot drift apart silently (the same regression pattern smoke
//       #103 catches for #npd-target-path).
//
//   Anchor uniqueness: there is exactly one `id="npd-filename"` in the file
//   (verified at smoke-authoring time via Grep). Smoke surfaces any future
//   refactor that duplicates the element across IIFEs by relying on
//   indexOf — a second occurrence would shift the slice and almost
//   certainly fail one of the contract checks.
//
//   Out of scope: success-branch readout (the variable assignment
//   `FN_EL.textContent = fn` becomes the actual filename and is locked
//   transitively by smokes #13–#17 / #29–#31). Cross-surface wording
//   consistency between #npd-filename and #npd-target-path is intentionally
//   NOT locked — the two readouts have different framing (filename label
//   vs path prompt) and aligning their phrasing is a UX call, not a
//   correctness contract.
//
//   Pure EJS source string scan; no DOM, no headless browser.
check('104 admin index.ejs filename empty-state copy does not mislead with `title`', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  // 1. Initial DOM at #npd-filename. The element is a <span> (not <code>
  //    like #npd-target-path), so we close on </span> instead of </code>.
  const initAnchor = 'id="npd-filename"';
  const initOpen = src.indexOf(initAnchor);
  assert.ok(initOpen > 0, 'index.ejs MUST contain `id="npd-filename"`');
  const tagClose = src.indexOf('>', initOpen);
  assert.ok(tagClose > initOpen, '#npd-filename opening tag MUST close with `>`');
  const elClose = src.indexOf('</span>', tagClose);
  assert.ok(elClose > tagClose, '#npd-filename MUST be inside a <span>…</span>');
  const initText = src.slice(tagClose + 1, elClose);

  assert.ok(
    !initText.includes('title'),
    "#npd-filename initial text MUST NOT include `title` (buildFilename ignores title; mention would mislead Dean to the wrong field; got `" + initText + "`)"
  );
  assert.ok(
    initText.includes('slug') && initText.includes('date'),
    "#npd-filename initial text MUST include both `slug` and `date` (the actual required inputs; got `" + initText + "`)"
  );

  // 2. Runtime fallback inside recompute(). The success branch assigns the
  //    `fn` variable (`FN_EL.textContent = fn;` — no quotes), so the regex
  //    below naturally only matches the empty-state literal assignment.
  //    Locking both surfaces ensures they cannot drift apart silently.
  const reAssign = /FN_EL\.textContent\s*=\s*'([^']*)'/g;
  const seen = [];
  let m;
  while ((m = reAssign.exec(src)) !== null) {
    seen.push(m[1]);
  }
  assert.ok(
    seen.length >= 1,
    "recompute() MUST contain at least one `FN_EL.textContent = '…'` literal assignment (empty-state branch)"
  );
  // Find the empty-state literal — the one that uses the fullwidth `（`
  // prompt prefix (current source: `（filename 待輸入合法 date + slug）`).
  // Anchoring on `（` instead of the exact wording lets Dean later tweak
  // the phrasing without breaking the smoke, while still pinning the
  // anti-misleading + must-include-slug+date contract.
  const emptyState = seen.find((s) => s.indexOf('（') === 0);
  assert.ok(
    typeof emptyState === 'string',
    "recompute() MUST contain a `FN_EL.textContent = '（…）'` empty-state branch"
  );
  assert.ok(
    !emptyState.includes('title'),
    "recompute() empty-state for #npd-filename MUST NOT include `title` (buildFilename ignores title; mention would mislead Dean to the wrong field; got `" + emptyState + "`)"
  );
  assert.ok(
    emptyState.includes('slug') && emptyState.includes('date'),
    "recompute() empty-state for #npd-filename MUST include both `slug` and `date` (got `" + emptyState + "`)"
  );
});

// Phase 20260629-admin-markdown-summary-target-empty-state-color-hygiene-a:
//   Lock the renderExportSummary() empty-state branch for #npd-summary-target.
//   Sibling cells SUM_FILENAME_EL and SUM_SLUG_EL already render their empty
//   states with red `#a00` color + `（…）` placeholder copy when slug / date /
//   filename are invalid. SUM_TARGET_EL previously fell back silently to just
//   `sum.targetFolder` with default color, so the strip row showed slug +
//   filename red but target neutral — visually inconsistent and misleading
//   ("target looks completed" while filename was still pending). The fix
//   appends `（待 date + slug）` to the folder and switches to the red color
//   when targetPath is empty, mirroring the sibling pattern.
//
//   Lock layering (regression net):
//     - #93  markup hygiene  (5-step <ol>)
//     - #94  client-mirror   (TARGET_FOLDERS / VALIDATION_COMMAND)
//     - #95  initial gating  (initial HTML disabled / aria-disabled)
//     - #96  runtime gating  (recompute() runtime re-gate)
//     - #97  event wiring    (change / input listeners + initial paint)
//     - #98  missing reason  (validation hint output strings)
//     - #99  showStatus      (markdown-preview status display)
//     - #100 showFlowStatus  (manual-import-flow status display)
//     - #101 copyTextToClipboard (clipboard-side contract)
//     - #102 caller-side okMsg literals for the two Copy buttons
//     - #103 #npd-target-path empty-state copy hygiene
//     - #104 #npd-filename    empty-state copy hygiene
//     - #105 #npd-summary-target empty-state color + suffix hygiene (this smoke)
//
//   Contract:
//     - renderExportSummary() MUST contain a branch that, when
//       `sum.targetPath !== ''`, sets `SUM_TARGET_EL.style.color = '#2c5282'`
//       (success color shared with sibling success branches).
//     - renderExportSummary() MUST contain a branch that, when targetPath is
//       empty, sets `SUM_TARGET_EL.style.color = '#a00'` (error color shared
//       with sibling SUM_SLUG_EL / SUM_FILENAME_EL empty branches).
//     - The empty-state textContent MUST concatenate `sum.targetFolder` with a
//       literal containing both `slug` and `date` (the actual required inputs)
//       but MUST NOT contain `title` (buildTargetPath ignores title; surfacing
//       title would mislead Dean to the wrong field — same regression class
//       smoke #103 / #104 catch for #npd-target-path / #npd-filename).
//
//   Anchor: `function renderExportSummary(` is a UNIQUE substring in the file
//   (verified at smoke-authoring time via Grep). The duplicate-check assertion
//   surfaces any future refactor that spawns a sibling helper across IIFEs.
//
//   Scoping: brace-count from the unique signature to the matching `}`. Safe
//   because the body has no `{`/`}` inside string literals; future refactors
//   that introduce such literals would surface as a loud extractor failure,
//   not a silent regression.
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of scope:
//   initial DOM at `id="npd-summary-target"` — that placeholder is overwritten
//   the moment recompute() fires (locked by smoke #97's trailing initial paint).
check('105 admin index.ejs renderExportSummary() target empty-state color + suffix preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  function extractRenderExportSummaryBlock() {
    const sig = 'function renderExportSummary(';
    const sigPos = src.indexOf(sig);
    assert.ok(sigPos > 0, 'index.ejs MUST contain `function renderExportSummary(`');
    const dupPos = src.indexOf(sig, sigPos + sig.length);
    assert.ok(
      dupPos < 0,
      'index.ejs MUST contain exactly one `function renderExportSummary(` (no IIFE duplicates expected; if intentional, add a disambiguation strategy like smoke #99)'
    );
    const openBrace = src.indexOf('{', sigPos);
    assert.ok(openBrace > sigPos, '`function renderExportSummary(...)` MUST have an opening `{`');
    let depth = 0;
    for (let i = openBrace; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return src.slice(sigPos, i + 1);
      }
    }
    assert.fail('index.ejs `renderExportSummary()` opening brace MUST have a matching close');
  }

  const block = extractRenderExportSummaryBlock();

  // Sanity: helper MUST reference SUM_TARGET_EL (the cell this smoke covers).
  assert.ok(
    block.includes('SUM_TARGET_EL'),
    'extracted renderExportSummary() MUST reference `SUM_TARGET_EL` (export summary target cell)'
  );

  // 1. Success branch: SUM_TARGET_EL.style.color = '#2c5282'.
  //    Shared success color with sibling SUM_SLUG_EL / SUM_FILENAME_EL.
  assert.ok(
    block.includes("SUM_TARGET_EL.style.color = '#2c5282'"),
    "renderExportSummary() MUST set `SUM_TARGET_EL.style.color = '#2c5282'` on the success branch (sum.targetPath !== '')"
  );

  // 2. Empty-state branch: SUM_TARGET_EL.style.color = '#a00'.
  //    Shared error color with sibling empty-state branches (smoke #103-style
  //    visual consistency). Without this, the row would show slug + filename
  //    red but target neutral — visually inconsistent.
  assert.ok(
    block.includes("SUM_TARGET_EL.style.color = '#a00'"),
    "renderExportSummary() MUST set `SUM_TARGET_EL.style.color = '#a00'` on the empty-state branch (sum.targetPath === '')"
  );

  // 3. Empty-state literal: must concatenate `sum.targetFolder` with a string
  //    literal mentioning both `slug` and `date`, and MUST NOT mention `title`.
  //    Mirrors the smoke #103 / #104 regression class for #npd-target-path /
  //    #npd-filename — buildTargetPath ignores title, so surfacing it would
  //    point Dean at the wrong field.
  const reAssign = /SUM_TARGET_EL\.textContent\s*=\s*sum\.targetFolder\s*\+\s*'([^']*)'/g;
  const seen = [];
  let m;
  while ((m = reAssign.exec(block)) !== null) {
    seen.push(m[1]);
  }
  assert.ok(
    seen.length >= 1,
    "renderExportSummary() MUST contain at least one `SUM_TARGET_EL.textContent = sum.targetFolder + '…'` empty-state assignment"
  );
  const emptySuffix = seen[0];
  assert.ok(
    !emptySuffix.includes('title'),
    "renderExportSummary() empty-state suffix MUST NOT include `title` (buildTargetPath ignores title; mention would mislead Dean to the wrong field; got `" + emptySuffix + "`)"
  );
  assert.ok(
    emptySuffix.includes('slug') && emptySuffix.includes('date'),
    "renderExportSummary() empty-state suffix MUST include both `slug` and `date` (the actual required inputs; got `" + emptySuffix + "`)"
  );
});

// Phase 20260629-admin-markdown-summary-target-initial-dom-empty-state-color-hygiene-a:
//   #106 summary target initial DOM empty-state guard. Closes the gap that smoke
//   #105 explicitly listed as out-of-scope ("initial DOM at `id=\"npd-summary-target\"`
//   — that placeholder is overwritten the moment recompute() fires"). Smoke #103
//   and #104 already lock initial DOM for sibling cells (#npd-target-path /
//   #npd-filename); the summary strip's target cell was the only one without an
//   initial-DOM lock, leaving a brief pre-JS render window where the cell looked
//   "complete" (default black color, bare folder) before recompute() flipped it to
//   the red empty-state. The fix appends the same `（待 date + slug）` suffix the
//   runtime branch uses and adds `style="color: #a00;"` so the initial paint
//   matches the runtime empty-state visually.
//
//   Lock layering (regression net):
//     - #93  markup hygiene  (5-step <ol>)
//     - #94  client-mirror   (TARGET_FOLDERS / VALIDATION_COMMAND)
//     - #95  initial gating  (initial HTML disabled / aria-disabled)
//     - #96  runtime gating  (recompute() runtime re-gate)
//     - #97  event wiring    (change / input listeners + initial paint)
//     - #98  missing reason  (validation hint output strings)
//     - #99  showStatus      (markdown-preview status display)
//     - #100 showFlowStatus  (manual-import-flow status display)
//     - #101 copyTextToClipboard (clipboard-side contract)
//     - #102 caller-side okMsg literals for the two Copy buttons
//     - #103 #npd-target-path    empty-state copy hygiene (initial DOM + runtime)
//     - #104 #npd-filename       empty-state copy hygiene (initial DOM + runtime)
//     - #105 #npd-summary-target empty-state color + suffix (runtime only)
//     - #106 #npd-summary-target initial DOM empty-state guard (this smoke)
//
//   Contract:
//     - The element with `id="npd-summary-target"` MUST exist exactly once in the
//       file (anchor uniqueness; mirrors smokes #100 / #101 / #102).
//     - Its opening tag MUST carry an inline style containing `color: #a00`
//       (matches sibling SUM_FILENAME_EL / SUM_SLUG_EL empty-state red color
//       locked by smoke #105's runtime contract).
//     - Its textContent MUST include the literal `content/github/posts/`
//       (default `github` site folder; mirrors smoke #94's initial DOM contract
//       for #npd-target-folder).
//     - Its textContent MUST mention both `slug` and `date` — the actual
//       buildTargetPath dependencies (same anti-misleading rule smokes #103 /
//       #104 / #105 lock for sibling empty-state copy).
//     - Its textContent MUST NOT mention `title` — buildTargetPath ignores
//       title; surfacing it would point Dean at the wrong field (same
//       regression class smokes #103 / #104 / #105 catch).
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of scope:
//   runtime empty-state branch (locked by #105), non-empty success path
//   (transitively locked by buildExportSummary smokes #76-#86), other summary
//   strip cells (sibling SUM_SLUG_EL / SUM_FILENAME_EL initial DOM left for a
//   separate slice if drift surfaces).
check('106 admin index.ejs #npd-summary-target initial DOM empty-state guard', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  const idLit = 'id="npd-summary-target"';
  const idPos = src.indexOf(idLit);
  assert.ok(idPos > 0, 'index.ejs MUST contain `' + idLit + '`');
  const dupPos = src.indexOf(idLit, idPos + idLit.length);
  assert.ok(
    dupPos < 0,
    'index.ejs MUST contain exactly one `' + idLit + '` (no IIFE duplicates expected; if intentional, add a disambiguation strategy)'
  );

  const tagStart = src.lastIndexOf('<code', idPos);
  assert.ok(tagStart > 0, '`' + idLit + '` MUST be inside a <code …> opening tag');
  const tagEnd = src.indexOf('>', idPos);
  assert.ok(tagEnd > idPos, '`' + idLit + '` opening tag MUST close with `>`');
  const openTag = src.slice(tagStart, tagEnd + 1);
  const closePos = src.indexOf('</code>', tagEnd);
  assert.ok(closePos > tagEnd, '#npd-summary-target MUST be inside a <code>…</code>');
  const innerText = src.slice(tagEnd + 1, closePos);

  // 1. Pending/error color in the opening tag's inline style. Matches sibling
  //    SUM_FILENAME_EL / SUM_SLUG_EL empty-state red color (locked by smoke
  //    #105's runtime contract). Whitespace-tolerant so a future formatter
  //    pass cannot silently drop the lock.
  assert.ok(
    /style="[^"]*color:\s*#a00/.test(openTag),
    '#npd-summary-target opening tag MUST carry inline `color: #a00` (initial DOM empty-state red; mirrors runtime branch locked by #105). Got: `' + openTag + '`'
  );

  // 2. Base path. The default site is github, so the readout MUST start with
  //    the github posts folder — mirrors smoke #94's initial DOM contract for
  //    #npd-target-folder (which locks the exact `content/github/posts/` literal).
  assert.ok(
    innerText.includes('content/github/posts/'),
    '#npd-summary-target initial text MUST include `content/github/posts/` (default github folder; mirrors smoke #94). Got: `' + innerText + '`'
  );

  // 3. Empty-state copy MUST mention both `slug` and `date` — the actual
  //    buildTargetPath dependencies. Same anti-misleading rule smokes #103 /
  //    #104 / #105 lock for sibling cells.
  assert.ok(
    innerText.includes('slug') && innerText.includes('date'),
    '#npd-summary-target initial text MUST mention both `slug` and `date` (actual buildTargetPath inputs). Got: `' + innerText + '`'
  );

  // 4. Anti-misleading: MUST NOT mention `title`. buildTargetPath ignores
  //    title; surfacing it would point Dean at the wrong field (same
  //    regression class smokes #103 / #104 / #105 catch for sibling cells).
  assert.ok(
    !innerText.includes('title'),
    '#npd-summary-target initial text MUST NOT include `title` (buildTargetPath ignores title; mention would mislead Dean to the wrong field). Got: `' + innerText + '`'
  );
});

// Phase 20260629-admin-markdown-summary-sibling-initial-dom-empty-state-color-hygiene-a:
//   #107 + #108 sibling summary-strip initial DOM empty-state guards. Smoke #106
//   locked the #npd-summary-target cell's initial DOM red empty-state and
//   explicitly listed the sibling cells as the deferred next slice ("other
//   summary strip cells (sibling SUM_SLUG_EL / SUM_FILENAME_EL initial DOM left
//   for a separate slice if drift surfaces)"). The drift surfaced: the target
//   cell rendered red `#a00` at initial paint while #npd-summary-slug and
//   #npd-summary-filename still rendered default black — visually inconsistent
//   in the brief pre-JS render window before recompute() flips them red (their
//   runtime empty-state branches at SUM_SLUG_EL / SUM_FILENAME_EL already set
//   `#a00`). The fix adds `style="color: #a00;"` to both initial-DOM cells and
//   aligns the slug copy `（未填）` → `（未填 / 不合法）` to match its runtime
//   empty-state text exactly.
//
//   Lock layering (regression net):
//     - #103 #npd-target-path      empty-state copy hygiene (initial DOM + runtime)
//     - #104 #npd-filename         empty-state copy hygiene (initial DOM + runtime)
//     - #105 #npd-summary-target   empty-state color + suffix (runtime only)
//     - #106 #npd-summary-target   initial DOM empty-state guard
//     - #107 #npd-summary-slug     initial DOM empty-state guard (this slice)
//     - #108 #npd-summary-filename initial DOM empty-state guard (this slice)
//
//   Contract (#107 — #npd-summary-slug):
//     - Element MUST exist exactly once (anchor uniqueness).
//     - Opening tag MUST carry inline `color: #a00` (matches runtime empty-state
//       red set by `SUM_SLUG_EL.style.color = '#a00'`).
//     - textContent MUST equal the runtime empty-state literal `（未填 / 不合法）`
//       so the initial paint matches the runtime empty-state exactly (no drift).
//
//   Contract (#108 — #npd-summary-filename):
//     - Element MUST exist exactly once (anchor uniqueness).
//     - Opening tag MUST carry inline `color: #a00` (matches runtime empty-state
//       red set by `SUM_FILENAME_EL.style.color = '#a00'`).
//     - textContent MUST mention both `slug` and `date` (the actual
//       buildFilename dependencies) but MUST NOT mention `title` — same
//       anti-misleading regression class smokes #103 / #104 / #105 / #106 lock.
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of scope:
//   runtime empty-state branches (locked transitively by smoke #105's pattern
//   and buildExportSummary smokes #76-#86), non-empty success paths.
check('107 admin index.ejs #npd-summary-slug initial DOM empty-state guard', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  const idLit = 'id="npd-summary-slug"';
  const idPos = src.indexOf(idLit);
  assert.ok(idPos > 0, 'index.ejs MUST contain `' + idLit + '`');
  const dupPos = src.indexOf(idLit, idPos + idLit.length);
  assert.ok(
    dupPos < 0,
    'index.ejs MUST contain exactly one `' + idLit + '` (no IIFE duplicates expected; if intentional, add a disambiguation strategy)'
  );

  const tagStart = src.lastIndexOf('<code', idPos);
  assert.ok(tagStart > 0, '`' + idLit + '` MUST be inside a <code …> opening tag');
  const tagEnd = src.indexOf('>', idPos);
  assert.ok(tagEnd > idPos, '`' + idLit + '` opening tag MUST close with `>`');
  const openTag = src.slice(tagStart, tagEnd + 1);
  const closePos = src.indexOf('</code>', tagEnd);
  assert.ok(closePos > tagEnd, '#npd-summary-slug MUST be inside a <code>…</code>');
  const innerText = src.slice(tagEnd + 1, closePos);

  // 1. Pending/error color in the opening tag's inline style. Matches the
  //    runtime empty-state red (`SUM_SLUG_EL.style.color = '#a00'`) and the
  //    sibling #npd-summary-target initial DOM locked by smoke #106.
  assert.ok(
    /style="[^"]*color:\s*#a00/.test(openTag),
    '#npd-summary-slug opening tag MUST carry inline `color: #a00` (initial DOM empty-state red; mirrors runtime branch + smoke #106). Got: `' + openTag + '`'
  );

  // 2. textContent MUST equal the runtime empty-state literal so initial paint
  //    matches runtime exactly (no drift). The runtime branch sets
  //    `SUM_SLUG_EL.textContent = '（未填 / 不合法）'`.
  assert.equal(
    innerText,
    '（未填 / 不合法）',
    '#npd-summary-slug initial text MUST equal the runtime empty-state literal `（未填 / 不合法）` (no drift). Got: `' + innerText + '`'
  );
});

check('108 admin index.ejs #npd-summary-filename initial DOM empty-state guard', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  const idLit = 'id="npd-summary-filename"';
  const idPos = src.indexOf(idLit);
  assert.ok(idPos > 0, 'index.ejs MUST contain `' + idLit + '`');
  const dupPos = src.indexOf(idLit, idPos + idLit.length);
  assert.ok(
    dupPos < 0,
    'index.ejs MUST contain exactly one `' + idLit + '` (no IIFE duplicates expected; if intentional, add a disambiguation strategy)'
  );

  const tagStart = src.lastIndexOf('<code', idPos);
  assert.ok(tagStart > 0, '`' + idLit + '` MUST be inside a <code …> opening tag');
  const tagEnd = src.indexOf('>', idPos);
  assert.ok(tagEnd > idPos, '`' + idLit + '` opening tag MUST close with `>`');
  const openTag = src.slice(tagStart, tagEnd + 1);
  const closePos = src.indexOf('</code>', tagEnd);
  assert.ok(closePos > tagEnd, '#npd-summary-filename MUST be inside a <code>…</code>');
  const innerText = src.slice(tagEnd + 1, closePos);

  // 1. Pending/error color in the opening tag's inline style. Matches the
  //    runtime empty-state red (`SUM_FILENAME_EL.style.color = '#a00'`) and the
  //    sibling #npd-summary-target initial DOM locked by smoke #106.
  assert.ok(
    /style="[^"]*color:\s*#a00/.test(openTag),
    '#npd-summary-filename opening tag MUST carry inline `color: #a00` (initial DOM empty-state red; mirrors runtime branch + smoke #106). Got: `' + openTag + '`'
  );

  // 2. Empty-state copy MUST mention both `slug` and `date` — the actual
  //    buildFilename dependencies. Same anti-misleading rule smokes #103 /
  //    #104 / #105 / #106 lock for sibling cells.
  assert.ok(
    innerText.includes('slug') && innerText.includes('date'),
    '#npd-summary-filename initial text MUST mention both `slug` and `date` (actual buildFilename inputs). Got: `' + innerText + '`'
  );

  // 3. Anti-misleading: MUST NOT mention `title`. buildFilename ignores title;
  //    surfacing it would point Dean at the wrong field (same regression class
  //    smokes #103 / #104 / #105 / #106 catch for sibling cells).
  assert.ok(
    !innerText.includes('title'),
    '#npd-summary-filename initial text MUST NOT include `title` (buildFilename ignores title; mention would mislead Dean to the wrong field). Got: `' + innerText + '`'
  );
});

console.log(`\n${passed} / ${passed + failed} PASS${failed ? ` (${failed} FAIL)` : ''}`);
process.exit(failed === 0 ? 0 : 1);
