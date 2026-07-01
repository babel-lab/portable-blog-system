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
  buildReadyGapReport,
  READY_GAP_REPORT_HEADER,
  READY_GAP_DRAFT_CONTRACT,
  READY_UNSUPPORTED_CONTENT_KINDS,
  READY_MAX_TITLE_LEN,
  READY_MAX_DESCRIPTION_LEN,
  READY_MAX_TITLE_EN_LEN,
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
  // readyHappy carries no body; a true ready candidate has real content, so
  // pass one here to keep the no-warnings assertion meaningful (an empty /
  // default body now raises the soft bodyDefault warning — locked by #132–135).
  const r = analyzeReadyGap({ ...readyHappy, body: '## 正文\n\n實際撰寫的內容。' });
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
//     - input-event wiring MUST contain the exact 10-element array
//       `[TITLE_EL, TITLE_EN_EL, SLUG_EL, DATE_EL, TAGS_EL, DESC_EL,
//        SEARCH_DESC_EL, COVER_EL, COVER_ALT_EL, BODY_EL]` and the listener
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
    '[TITLE_EL, TITLE_EN_EL, SLUG_EL, DATE_EL, TAGS_EL, DESC_EL, SEARCH_DESC_EL, COVER_EL, COVER_ALT_EL, BODY_EL]';
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

// Phase 20260629-admin-markdown-summary-ready-initial-dom-runtime-parity-hygiene-a:
//   #109 summary-strip ready-badge initial DOM ↔ runtime first-paint parity.
//   The #npd-summary-target / -slug / -filename cells now have their initial DOM
//   aligned to their runtime empty-state (smokes #103–#108). The remaining
//   summary cell with an initial-vs-runtime literal drift was #npd-summary-ready:
//   its initial DOM showed a bare `missing` badge, while the first recompute()
//   on the default empty form (title / slug / date all blank) writes
//   `missing title / slug / date` via `SUM_READY_EL.textContent =
//   'missing ' + sum.ready.missing.join(' / ')` (renderExportSummary). In the
//   brief pre-JS render window the badge therefore read `missing` (generic),
//   then snapped to `missing title / slug / date` once JS ran. The fix aligns
//   the initial DOM to the runtime first-paint composition exactly.
//
//   Lock layering (regression net):
//     - #105 #npd-summary-target   empty-state color + suffix (runtime only)
//     - #106 #npd-summary-target   initial DOM empty-state guard
//     - #107 #npd-summary-slug     initial DOM empty-state guard
//     - #108 #npd-summary-filename initial DOM empty-state guard
//     - #109 #npd-summary-ready    initial DOM ↔ runtime first-paint parity (this slice)
//
//   Contract:
//     - Element MUST exist exactly once (anchor uniqueness).
//     - Opening tag MUST carry the not-ready badge class `b-draft` (the default
//       empty form is never export-ready; runtime also keeps `b-draft` while
//       `sum.ready.ok` is false — `SUM_READY_EL.className = 'badge b-draft'`).
//     - innerText MUST EQUAL the runtime first-paint composition for the default
//       empty form: `'missing ' + ['title','slug','date'].join(' / ')`. The
//       expected string is rebuilt from the same join rule the runtime uses
//       (not a hardcoded magic literal) so a future change to the runtime
//       separator / prefix surfaces here as a parity failure.
//
//   Why title/slug/date specifically: the inputs `#npd-title` / `#npd-slug` /
//   `#npd-date` ship with no `value=` attribute (placeholder-only), so
//   isExportReady reports all three missing on first paint — verified at
//   smoke-authoring time. The ready cell is the only summary cell whose runtime
//   first-paint text is composed from the missing-field list.
//
//   Pure EJS source string scan; no DOM, no headless browser. Out of scope:
//   the export-ready success branch (`export ok` + `b-ready`; reached only when
//   isExportReady passes, transitively locked by smokes #34–#39 / #90), and the
//   aria-live attribute (accessibility wiring, not a copy-parity contract).
check('109 admin index.ejs #npd-summary-ready initial DOM matches runtime first-paint', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  const idLit = 'id="npd-summary-ready"';
  const idPos = src.indexOf(idLit);
  assert.ok(idPos > 0, 'index.ejs MUST contain `' + idLit + '`');
  const dupPos = src.indexOf(idLit, idPos + idLit.length);
  assert.ok(
    dupPos < 0,
    'index.ejs MUST contain exactly one `' + idLit + '` (no IIFE duplicates expected; if intentional, add a disambiguation strategy)'
  );

  const tagStart = src.lastIndexOf('<span', idPos);
  assert.ok(tagStart > 0, '`' + idLit + '` MUST be inside a <span …> opening tag');
  const tagEnd = src.indexOf('>', idPos);
  assert.ok(tagEnd > idPos, '`' + idLit + '` opening tag MUST close with `>`');
  const openTag = src.slice(tagStart, tagEnd + 1);
  const closePos = src.indexOf('</span>', tagEnd);
  assert.ok(closePos > tagEnd, '#npd-summary-ready MUST be inside a <span>…</span>');
  const innerText = src.slice(tagEnd + 1, closePos);

  // 1. Not-ready badge class. The default empty form is never export-ready, so
  //    the initial badge MUST use `b-draft` (matches the runtime not-ready
  //    branch `SUM_READY_EL.className = 'badge b-draft'`).
  assert.ok(
    /class="[^"]*\bb-draft\b/.test(openTag),
    '#npd-summary-ready opening tag MUST carry the not-ready class `b-draft` (default form is never ready; mirrors runtime not-ready branch). Got: `' + openTag + '`'
  );

  // 2. Initial text MUST equal the runtime first-paint composition for the
  //    default empty form. Rebuild the expected string from the same join rule
  //    renderExportSummary() uses (`'missing ' + missing.join(' / ')`) with the
  //    three fields isExportReady reports missing when title/slug/date are blank.
  const expected = 'missing ' + ['title', 'slug', 'date'].join(' / ');
  assert.equal(
    innerText,
    expected,
    '#npd-summary-ready initial text MUST equal the runtime first-paint string `' + expected + '` (no initial-vs-runtime drift). Got: `' + innerText + '`'
  );
});

// Phase 20260629-admin-markdown-client-server-frontmatter-scaffold-parity-hygiene-a:
//   #110 frontmatter scaffold parity between the client mirror buildMarkdown()
//   (inline in src/views/admin/index.ejs) and the server helper
//   buildPostMarkdown() (admin-markdown-export.js). The module header of
//   admin-markdown-export.js explicitly states: "This module has a mirror
//   inline in src/views/admin/index.ejs (client script). Keep both in sync —
//   the smoke locks the server-side version." Smoke #94 locks only the two
//   manual-import constants (TARGET_FOLDERS / VALIDATION_COMMAND); the ~17
//   static frontmatter scaffold lines the two surfaces emit (author /
//   status / draft / canonical / publishTargets scaffold / all 8 blocks
//   defaults) were never mirror-locked. The two surfaces are currently
//   byte-identical (verified at smoke-authoring time), so this is a coverage
//   guard — not a drift fix. It surfaces any future edit that changes a default
//   on one surface (e.g. flips `adsenseTop: true`, renames `author`, drops a
//   blocks key) without mirroring it, before Dean copies a preview that diverges
//   from what the server helper + the rest of this smoke validate.
//
//   Scope: only the STATIC (non-interpolated) scaffold lines emitted via the
//   literal `lines.push('…')` form on BOTH surfaces. Interpolated lines (id /
//   site / contentKind / title / titleEn / slug / date / category / tags /
//   description / cover / publishTargets enabled / blogger mode) are covered by
//   the server-side buildPostMarkdown smokes (#1–#25 / #53–#57 / #115–#118)
//   and are intentionally excluded — their values depend on input so a scan
//   cannot lock them without re-implementing the helper.
//
//   Both surfaces single-quote the push argument (`lines.push('author: "Dean"')`),
//   so one literal substring matches both. The server file uses `lines.push`
//   only inside buildPostMarkdown() (defaultBody() uses an array literal), so a
//   whole-file substring check is unambiguous; the client side is scoped to the
//   brace-counted buildMarkdown() block for precision.
//
//   Pure source string scan; no DOM, no headless browser, no execution of
//   either surface.
check('110 admin buildMarkdown() client mirror frontmatter scaffold matches server buildPostMarkdown()', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const serverPath = resolve(here, 'admin-markdown-export.js');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  const serverSrc = readFileSync(serverPath, 'utf8');

  // Extract the client buildMarkdown(input) block via brace-count from its
  // unique signature, so the scaffold-line checks below cannot accidentally
  // match `lines.push('…')` calls from another inline helper (e.g. buildSnippet).
  function extractClientBuildMarkdown() {
    const sig = 'function buildMarkdown(input) {';
    const sigPos = ejsSrc.indexOf(sig);
    assert.ok(sigPos > 0, 'index.ejs MUST contain `function buildMarkdown(input) {`');
    const dupPos = ejsSrc.indexOf(sig, sigPos + sig.length);
    assert.ok(
      dupPos < 0,
      'index.ejs MUST contain exactly one `function buildMarkdown(input) {` (no duplicates expected)'
    );
    const openBrace = sigPos + sig.length - 1;
    let depth = 0;
    for (let i = openBrace; i < ejsSrc.length; i++) {
      const ch = ejsSrc[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return ejsSrc.slice(sigPos, i + 1);
      }
    }
    assert.fail('client buildMarkdown() opening brace MUST have a matching close');
  }

  const clientBlock = extractClientBuildMarkdown();

  // Static frontmatter scaffold lines both surfaces MUST emit identically.
  // NOTE: titleEn is intentionally NOT here — as of Phase
  //   20260629-admin-titleEn-passthrough-slice-a it is an INTERPOLATED
  //   direct-through field (`titleEn: ' + yamlEscapeScalar(titleEn)`), same
  //   category as title / slug / description. Its parity + empty-default
  //   (`titleEn: ""`) are locked behaviorally by cases 115–118 below.
  const SCAFFOLD = [
    'author: "Dean"',
    'status: "draft"',
    'draft: true',
    'canonical: "auto"',
    'publishTargets:',
    '  github:',
    '    mode: "full"',
    '  blogger:',
    'blocks:',
    '  toc: false',
    '  adsenseTop: true',
    '  adsenseMiddle: false',
    '  adsenseBottom: true',
    '  hashtags: true',
    '  socialFollow: true',
    '  relatedPosts: true',
    '  sidebar: true',
  ];

  for (const lit of SCAFFOLD) {
    const pushCall = "lines.push('" + lit + "')";
    assert.ok(
      clientBlock.includes(pushCall),
      'client buildMarkdown() (index.ejs) MUST emit `' + pushCall + '` (frontmatter scaffold parity with server)'
    );
    assert.ok(
      serverSrc.includes(pushCall),
      'server buildPostMarkdown() (admin-markdown-export.js) MUST emit `' + pushCall + '` (frontmatter scaffold parity with client mirror)'
    );
  }
});

// Phase 20260629-admin-tag-picker-site-aware-options-a:
//   Lock the tag picker's site-aware datalist behaviour. Dean's manual smoke
//   surfaced that the #npd-tags autocomplete listed ALL tags.json ids
//   regardless of the selected site, so on a GitHub draft he was offered
//   Blogger-only tags (book / reading-notes …) mixed with the 3 GitHub-valid
//   tags (github / vite / static-site) — and had to ignore the picker and type
//   `github, vite` by hand. This slice filters the datalist by the selected
//   site: server renders the default-github set; the inline renderTagOptions()
//   rebuilds it on #npd-site change. Free text stays allowed (input remains
//   type=text — NOT converted to a strict <select>).
//
//   This smoke locks four invariants so a future refactor cannot silently
//   regress the UX back to an unfiltered / select-only picker:
//     1. #npd-tags is a free-text input (type=text + list=npd-tags-options),
//        never a <select id="npd-tags"> (manual entry MUST stay possible).
//     2. The server-rendered <datalist id="npd-tags-options"> loop filters to
//        the default site github (npdDefaultSite guard) so the initial DOM
//        does not advertise cross-site tags on the default github form.
//     3. The inline renderTagOptions(site) reads REGISTRY_SNAPSHOT.tags,
//        filters each entry by `sites.indexOf(picked) < 0`, and rewrites
//        TAGS_DATALIST_EL.innerHTML (the client mirror of the server filter).
//     4. renderTagOptions is wired to #npd-site `change` AND called once at
//        init, so switching site re-scopes the suggestions and the first
//        paint is already github-scoped.
//
//   Pure EJS source string scan; no DOM, no headless browser.
check('111 admin index.ejs tag picker datalist is site-aware (free-text preserved)', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  // 1. #npd-tags stays a free-text input bound to the datalist — never a select.
  const tagsIdPos = src.indexOf('id="npd-tags"');
  assert.ok(tagsIdPos > 0, 'index.ejs MUST contain an element with `id="npd-tags"`');
  const tagsTagStart = src.lastIndexOf('<', tagsIdPos);
  const tagsTagEnd = src.indexOf('>', tagsIdPos);
  const tagsTag = src.slice(tagsTagStart, tagsTagEnd + 1);
  assert.ok(
    /^<input\b/.test(tagsTag),
    '#npd-tags MUST be an <input> (free-text entry preserved), not converted to a control'
  );
  assert.ok(
    /type="text"/.test(tagsTag),
    '#npd-tags MUST keep `type="text"` (manual tag entry MUST stay possible)'
  );
  assert.ok(
    /list="npd-tags-options"/.test(tagsTag),
    '#npd-tags MUST stay bound to `list="npd-tags-options"` (datalist hint, not strict select)'
  );
  assert.ok(
    src.indexOf('<select id="npd-tags"') < 0,
    '#npd-tags MUST NOT become a <select> (strict select would drop free-text entry)'
  );

  // 2. Server-rendered datalist loop filters to the default site github.
  const dlAnchor = '<datalist id="npd-tags-options">';
  const dlOpen = src.indexOf(dlAnchor);
  assert.ok(dlOpen > 0, 'index.ejs MUST contain `<datalist id="npd-tags-options">`');
  const dlClose = src.indexOf('</datalist>', dlOpen);
  assert.ok(dlClose > dlOpen, 'npd-tags-options datalist MUST close with </datalist>');
  const dlBlock = src.slice(dlOpen, dlClose);
  assert.ok(
    dlBlock.includes("var npdDefaultSite = 'github'"),
    "server datalist loop MUST define `var npdDefaultSite = 'github'` (default-site scope)"
  );
  assert.ok(
    /tsiteArr\.indexOf\(npdDefaultSite\)\s*<\s*0\)\s*return/.test(dlBlock),
    'server datalist loop MUST skip tags whose site list excludes the default site (initial DOM github-scoped)'
  );

  // 3. Inline renderTagOptions(site) mirrors the server filter on the client.
  function extractRenderTagOptionsBlock() {
    const sig = 'function renderTagOptions(';
    const sigPos = src.indexOf(sig);
    assert.ok(sigPos > 0, 'index.ejs MUST contain `function renderTagOptions(`');
    const dupPos = src.indexOf(sig, sigPos + sig.length);
    assert.ok(dupPos < 0, 'index.ejs MUST contain exactly one `function renderTagOptions(`');
    const openBrace = src.indexOf('{', sigPos);
    let depth = 0;
    for (let i = openBrace; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return src.slice(sigPos, i + 1);
      }
    }
    assert.fail('renderTagOptions() opening brace MUST have a matching close');
  }
  const rtoBlock = extractRenderTagOptionsBlock();
  assert.ok(
    rtoBlock.includes('REGISTRY_SNAPSHOT.tags'),
    'renderTagOptions() MUST source options from `REGISTRY_SNAPSHOT.tags` (injected registry mirror)'
  );
  assert.ok(
    /sites\.indexOf\(picked\)\s*<\s*0\)\s*continue/.test(rtoBlock),
    'renderTagOptions() MUST filter out tags whose site list excludes the selected site'
  );
  assert.ok(
    rtoBlock.includes('TAGS_DATALIST_EL.innerHTML'),
    'renderTagOptions() MUST rewrite `TAGS_DATALIST_EL.innerHTML` (rebuild the datalist)'
  );

  // 4. Wired to #npd-site change AND called at init.
  assert.ok(
    /SITE_EL\.addEventListener\(\s*'change'\s*,\s*function\s*\(\s*\)\s*\{\s*renderTagOptions\(SITE_EL\.value\)/.test(src),
    'renderTagOptions MUST be wired to #npd-site `change` (re-scope suggestions on site switch)'
  );
  assert.ok(
    /\n\s*renderTagOptions\(SITE_EL\.value\);/.test(src),
    'renderTagOptions(SITE_EL.value) MUST be called once at init (first paint github-scoped)'
  );
});

// Phase 20260629-admin-category-helper-site-mismatch-copy-a:
//   Lock the category picker's helper text so it stays consistent with the
//   site-aware tag picker helper. The old copy ("draft 不檢查 site mismatch")
//   was misleading: although the Admin export never blocks on site mismatch
//   (it always emits status:"draft"), the Ready preflight panel DOES surface
//   category-site-mismatch / unknown-category via analyzeRegistryHints
//   (smoke 63-75 / 87). Telling Dean it is "不檢查" invites him to ignore a
//   real cross-site category warning the panel already raises — the same class
//   of manual error the tag picker helper guards against. This smoke pins the
//   corrected copy so a future edit cannot silently regress to the misleading
//   "不檢查" wording.
//
//   Pure EJS source string scan; no DOM, no headless browser.
check('112 admin index.ejs category helper references Ready preflight site-mismatch (not "不檢查")', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');

  // Locate the category select, then the helper <span> that follows its close.
  const catIdPos = src.indexOf('id="npd-category"');
  assert.ok(catIdPos > 0, 'index.ejs MUST contain an element with `id="npd-category"`');
  const selClose = src.indexOf('</select>', catIdPos);
  assert.ok(selClose > catIdPos, '#npd-category MUST be a <select> that closes with </select>');
  const helperOpen = src.indexOf('<span class="text-muted"', selClose);
  assert.ok(helperOpen > selClose, 'category row MUST have a `<span class="text-muted">` helper after the select');
  const helperClose = src.indexOf('</span>', helperOpen);
  assert.ok(helperClose > helperOpen, 'category helper <span> MUST close with </span>');
  const helper = src.slice(helperOpen, helperClose);

  assert.ok(
    helper.includes('category-site-mismatch'),
    'category helper MUST reference `category-site-mismatch` (mirror the tag picker helper)'
  );
  assert.ok(
    helper.includes('Ready preflight'),
    'category helper MUST point Dean at the Ready preflight panel that surfaces the warning'
  );
  assert.ok(
    !helper.includes('不檢查'),
    'category helper MUST NOT claim site mismatch is "不檢查" — the Ready preflight panel does surface it'
  );
});

check('113 analyzeRegistryHints category entry.site=[] → no category-site-mismatch', () => {
  // Mirror of case 71 (tag side) for the CATEGORY branch: an entry whose
  // site=[] is interpreted as "no constraint" → no mismatch hint, regardless
  // of the current input.site. Locks the documented invariant for categories
  // (REGS only carries non-empty-site categories, so this branch was untested).
  const localRegs = {
    categories: [{ id: 'wildcard-cat', slug: 'wildcard-cat', site: [] }],
  };
  const r = analyzeRegistryHints(
    { site: 'blogger', category: 'wildcard-cat', tags: '' },
    localRegs
  );
  assert.equal(r.hasHints, false);
  assert.deepEqual(r.hints, []);
});

check('114 analyzeRegistryHints mixed category + tag entry.site=[] → no hints', () => {
  // Both branches simultaneously carry site=[] ("no constraint"); the combined
  // registry must produce zero hints — neither the category nor the tag branch
  // leaks a mismatch when the OTHER branch is also wildcard. Distinct from
  // case 71 (tag-only) and case 113 (category-only).
  const localRegs = {
    categories: [{ id: 'wildcard-cat', slug: 'wildcard-cat', site: [] }],
    tags: [{ id: 'wildcard-tag', slug: 'wildcard-tag', site: [] }],
  };
  const r = analyzeRegistryHints(
    { site: 'github', category: 'wildcard-cat', tags: 'wildcard-tag' },
    localRegs
  );
  assert.equal(r.hasHints, false);
  assert.deepEqual(r.hints, []);
});

// Phase 20260629-admin-titleEn-passthrough-slice-a:
//   titleEn becomes an optional direct-through field (same convention as
//   searchDescription / cover / coverAlt): filled → emitted; empty → still
//   emits `titleEn: ""` (always-present key, matches new-post.js template).
//   These behavioral cases replace the old static-scaffold lock that case 110
//   carried for the hardcoded `titleEn: ""` line.
check('115 buildPostMarkdown titleEn value → emitted in frontmatter', () => {
  const md = buildPostMarkdown({ ...happy, titleEn: 'My English Title' });
  assert.equal(matter(md).data.titleEn, 'My English Title');
});

check('116 buildPostMarkdown empty / missing titleEn → still emits titleEn: ""', () => {
  // explicit empty
  assert.equal(matter(buildPostMarkdown({ ...happy, titleEn: '' })).data.titleEn, '');
  // whitespace-only collapses to empty
  assert.equal(matter(buildPostMarkdown({ ...happy, titleEn: '   ' })).data.titleEn, '');
  // key absent in input → key still present in output as ''
  assert.ok(Object.prototype.hasOwnProperty.call(matter(buildPostMarkdown(happy)).data, 'titleEn'));
  assert.equal(matter(buildPostMarkdown(happy)).data.titleEn, '');
});

check('117 buildPostMarkdown titleEn does not affect required title (and trims)', () => {
  const md = buildPostMarkdown({ ...happy, title: '中文標題', titleEn: '  Trimmed EN  ' });
  const d = matter(md).data;
  assert.equal(d.title, '中文標題');
  assert.equal(d.titleEn, 'Trimmed EN');
});

check('118 admin index.ejs client buildMarkdown mirrors titleEn passthrough (no static titleEn:"")', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const serverPath = resolve(here, 'admin-markdown-export.js');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  const serverSrc = readFileSync(serverPath, 'utf8');

  // Extract the client buildMarkdown(input) block via brace-count (same method
  // as case 110) so the assertions cannot match another inline helper.
  const sig = 'function buildMarkdown(input) {';
  const sigPos = ejsSrc.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain `function buildMarkdown(input) {`');
  let depth = 0;
  let clientBlock = '';
  for (let i = sigPos + sig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { clientBlock = ejsSrc.slice(sigPos, i + 1); break; }
    }
  }
  assert.ok(clientBlock, 'client buildMarkdown() block MUST be brace-balanced');

  // Both surfaces emit the interpolated form (parity)…
  const emit = "lines.push('titleEn: ' + yamlEscapeScalar(titleEn))";
  assert.ok(clientBlock.includes(emit), 'client buildMarkdown() MUST emit interpolated titleEn (mirror server)');
  assert.ok(serverSrc.includes(emit), 'server buildPostMarkdown() MUST emit interpolated titleEn');

  // …and the OLD hardcoded static line is gone from both (would silently
  // ignore Dean's titleEn input if it lingered on either surface).
  assert.ok(!clientBlock.includes("lines.push('titleEn: \"\"')"), 'client MUST NOT keep static `titleEn: ""`');
  assert.ok(!serverSrc.includes("lines.push('titleEn: \"\"')"), 'server MUST NOT keep static `titleEn: ""`');

  // Client reads input.titleEn (does not silently drop the field).
  assert.ok(clientBlock.includes('input.titleEn'), 'client buildMarkdown() MUST read input.titleEn');
});

// Phase 20260629-admin-titleEn-length-warning-slice-a:
//   titleEn over-length raises a soft, Admin-only Ready-preflight warning
//   (field 'titleEnLength', threshold READY_MAX_TITLE_EN_LEN). It is never
//   blocking, never required, and never alters buildPostMarkdown output —
//   these cases mirror the existing title-length pattern (case 49).
check('119 analyzeReadyGap long titleEn → soft warning titleEnLength', () => {
  const longEn = 'x'.repeat(READY_MAX_TITLE_EN_LEN + 1);
  const r = analyzeReadyGap({ ...readyHappy, titleEn: longEn });
  assert.ok(fieldNames(r.warnings).includes('titleEnLength'));
  // soft only: must NOT appear in blocking, must NOT flip ok=false.
  assert.ok(!fieldNames(r.blocking).includes('titleEnLength'));
  assert.equal(r.ok, true);
  assert.equal(r.summary, 'ready-candidate');
});

check('120 analyzeReadyGap empty / missing titleEn → no titleEnLength warning', () => {
  const rMissing = analyzeReadyGap(readyHappy);
  assert.ok(!fieldNames(rMissing.warnings).includes('titleEnLength'));
  const rEmpty = analyzeReadyGap({ ...readyHappy, titleEn: '' });
  assert.ok(!fieldNames(rEmpty.warnings).includes('titleEnLength'));
  const rSpaces = analyzeReadyGap({ ...readyHappy, titleEn: '   ' });
  assert.ok(!fieldNames(rSpaces.warnings).includes('titleEnLength'));
});

check('121 analyzeReadyGap titleEn at limit → no titleEnLength warning (boundary)', () => {
  const atLimit = 'x'.repeat(READY_MAX_TITLE_EN_LEN);
  const r = analyzeReadyGap({ ...readyHappy, titleEn: atLimit });
  assert.ok(!fieldNames(r.warnings).includes('titleEnLength'));
});

check('122 analyzeReadyGap titleEn never blocking + does not affect title warning', () => {
  // titleEn is optional: a long titleEn with an empty title still blocks on
  // title (not titleEn), and a long title still warns on titleLength
  // independently of titleEn.
  const r = analyzeReadyGap({ ...readyHappy, title: '', titleEn: 'x'.repeat(READY_MAX_TITLE_EN_LEN + 1) });
  assert.ok(fieldNames(r.blocking).includes('title'));
  assert.ok(!fieldNames(r.blocking).includes('titleEn'));
  assert.ok(!fieldNames(r.blocking).includes('titleEnLength'));
  const r2 = analyzeReadyGap({ ...readyHappy, title: 'y'.repeat(READY_MAX_TITLE_LEN + 1) });
  assert.ok(fieldNames(r2.warnings).includes('titleLength'));
  assert.ok(!fieldNames(r2.warnings).includes('titleEnLength'));
});

// Phase 20260629-admin-titleEn-summary-count-slice-a:
//   buildExportSummary now tracks titleEn length (counts.titleEn), completing
//   the optional titleEn field's at-a-glance UX parity. Read-only count: never
//   affects buildPostMarkdown output, the titleEn warning rule, or counts.title.
check('123 buildExportSummary titleEn value → counts.titleEn (trimmed)', () => {
  assert.equal(buildExportSummary({ ...happy, titleEn: 'ABC' }).counts.titleEn, 3);
  assert.equal(buildExportSummary({ ...happy, titleEn: '  Trim Me  ' }).counts.titleEn, 7);
});

check('124 buildExportSummary empty / missing / whitespace titleEn → counts.titleEn 0', () => {
  assert.equal(buildExportSummary(happy).counts.titleEn, 0); // key absent in input
  assert.equal(buildExportSummary({ ...happy, titleEn: '' }).counts.titleEn, 0);
  assert.equal(buildExportSummary({ ...happy, titleEn: '   ' }).counts.titleEn, 0);
});

check('125 buildExportSummary titleEn does not affect counts.title', () => {
  const s = buildExportSummary({ ...happy, title: 'abcd', titleEn: 'English Title Here' });
  assert.equal(s.counts.title, 4);
  assert.equal(s.counts.titleEn, 18);
});

check('126 admin index.ejs client buildExportSummary mirrors titleEn count + paints it', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const ejsSrc = readFileSync(ejsPath, 'utf8');

  // Extract the client buildExportSummary(input) block via brace-count.
  const sig = 'function buildExportSummary(input) {';
  const sigPos = ejsSrc.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain `function buildExportSummary(input) {`');
  let depth = 0;
  let block = '';
  for (let i = sigPos + sig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { block = ejsSrc.slice(sigPos, i + 1); break; }
    }
  }
  assert.ok(block, 'client buildExportSummary() block MUST be brace-balanced');

  // Mirror parity: reads input.titleEn and emits counts.titleEn (server uses
  // the same `titleEn: titleEn.length` shape).
  assert.ok(block.includes('safeInput.titleEn'), 'client buildExportSummary() MUST read safeInput.titleEn');
  assert.ok(block.includes('titleEn: titleEn.length'), 'client counts MUST include `titleEn: titleEn.length`');

  // UI wiring: the renderer paints the titleEn counter against the /80 limit.
  assert.ok(
    ejsSrc.includes('paintCounter(CNT_TITLE_EN_EL, sum.counts.titleEn, READY_MAX_TITLE_EN_LEN)'),
    'renderExportSummary MUST paint CNT_TITLE_EN_EL from sum.counts.titleEn'
  );
});

// Phase 20260629-admin-registry-hint-client-parity-slice-a:
//   analyzeRegistryHints has a server version (smoke 63–75 / 87 / 113–114) AND
//   an index.ejs client mirror that IS surfaced in the Ready preflight panel
//   (#npd-ready-registry-hints), but unlike its siblings (buildMarkdown → #110,
//   buildExportSummary → #126, TARGET_FOLDERS/VALIDATION_COMMAND → #94) the
//   client mirror had NO parity lock. A future edit to the server helper (as
//   the titleEn slices touched analyzeReadyGap) could silently drift the mirror
//   with no smoke to catch it. These two cases lock the client mirror's stable
//   semantics — fields + hint kinds (#127) and the entry.site=[] no-constraint
//   guard (#128) — via key-substring scan, NOT full-function text (so cosmetic
//   refactors stay free). Pure EJS source string scan; no DOM, no execution.
function extractClientAnalyzeRegistryHints() {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  const sig = 'function analyzeRegistryHints(input, registries) {';
  const sigPos = ejsSrc.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain client `function analyzeRegistryHints(input, registries) {`');
  assert.ok(
    ejsSrc.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one client analyzeRegistryHints (no duplicate)'
  );
  let depth = 0;
  for (let i = sigPos + sig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return ejsSrc.slice(sigPos, i + 1);
    }
  }
  assert.fail('client analyzeRegistryHints opening brace MUST have a matching close');
}

check('127 admin index.ejs client analyzeRegistryHints mirrors fields + 4 hint kinds', () => {
  const block = extractClientAnalyzeRegistryHints();
  // Reads the same inputs as the server helper.
  assert.ok(block.includes('safeInput.category'), 'client mirror MUST read safeInput.category');
  assert.ok(block.includes('safeInput.tags'), 'client mirror MUST read safeInput.tags');
  // Emits all four hint kinds the server helper defines (parity with smoke 63–75).
  for (const kind of ['unknown-category', 'category-site-mismatch', 'unknown-tag', 'tag-site-mismatch']) {
    assert.ok(
      block.includes("kind: '" + kind + "'"),
      'client mirror MUST emit hint kind `' + kind + '` (server parity)'
    );
  }
});

check('128 admin index.ejs client analyzeRegistryHints keeps entry.site=[] no-constraint guard', () => {
  const block = extractClientAnalyzeRegistryHints();
  // Both branches gate the mismatch on a NON-empty entry.site (length > 0),
  // so site:[] is treated as "no constraint" — mirror of server cases 71 / 113 / 114.
  assert.ok(
    block.includes('cEntry.site.length > 0'),
    'category branch MUST guard mismatch on cEntry.site.length > 0 (empty = no constraint)'
  );
  assert.ok(
    block.includes('tEntry.site.length > 0'),
    'tag branch MUST guard mismatch on tEntry.site.length > 0 (empty = no constraint)'
  );
  // And the mismatch itself is an indexOf(site) < 0 membership test on both branches.
  assert.ok(
    (block.match(/\.site\.indexOf\(site\) < 0/g) || []).length >= 2,
    'both branches MUST test entry.site.indexOf(site) < 0 for the mismatch'
  );
});

// Phase 20260629-admin-export-summary-client-parity-slice-a:
//   buildExportSummary has a server version (smoke 76–86) and an index.ejs
//   client mirror that feeds the digest strip + per-field counters. Case 126
//   locked only the titleEn count + its paint; the OTHER counts (title /
//   description / searchDescription / coverAlt / tags) and the limits object
//   had no client-mirror parity lock. These two cases close that gap via
//   key-substring scan (NOT full-function text, so cosmetic refactors stay
//   free): #129 the full counts shape, #130 the limits → READY_MAX_* mapping.
//   Pure EJS source string scan; no DOM, no execution.
function extractClientBuildExportSummary() {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  const sig = 'function buildExportSummary(input) {';
  const sigPos = ejsSrc.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain client `function buildExportSummary(input) {`');
  assert.ok(
    ejsSrc.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one client buildExportSummary (no duplicate)'
  );
  let depth = 0;
  for (let i = sigPos + sig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return ejsSrc.slice(sigPos, i + 1);
    }
  }
  assert.fail('client buildExportSummary opening brace MUST have a matching close');
}

check('129 admin index.ejs client buildExportSummary counts shape mirrors server (6 keys)', () => {
  const block = extractClientBuildExportSummary();
  // Each count key maps to the same length expression the server emits
  // (admin-markdown-export.js buildExportSummary counts block).
  const COUNTS = [
    'title: titleRaw.length',
    'titleEn: titleEn.length',
    'description: description.length',
    'searchDescription: searchDescription.length',
    'coverAlt: coverAlt.length',
    'tags: tags.length',
  ];
  for (const expr of COUNTS) {
    assert.ok(
      block.includes(expr),
      'client buildExportSummary counts MUST include `' + expr + '` (server parity)'
    );
  }
});

check('130 admin index.ejs client buildExportSummary limits mirror READY_MAX_* constants', () => {
  const block = extractClientBuildExportSummary();
  // limits object mirrors the server (titleMax / descriptionMax only; the
  // searchDescription / coverAlt counters are unlimited and titleEn uses
  // READY_MAX_TITLE_EN_LEN directly at the paint site, not via summary.limits).
  assert.ok(
    block.includes('titleMax: READY_MAX_TITLE_LEN'),
    'client limits MUST map titleMax to READY_MAX_TITLE_LEN'
  );
  assert.ok(
    block.includes('descriptionMax: READY_MAX_DESCRIPTION_LEN'),
    'client limits MUST map descriptionMax to READY_MAX_DESCRIPTION_LEN'
  );
});

// Phase 20260629-admin-normalize-tags-client-parity-slice-a:
//   The Admin tag input is a comma string, normalized client-side by the inline
//   normalizeTags() in index.ejs and server-side by normalizeTagsInput() in
//   admin-markdown-export.js. The server behavior is exercised indirectly
//   (buildExportSummary tag counter, smoke 86) but the CLIENT mirror had no
//   parity lock. normalizeTags is inline EJS (not importable), so this locks
//   its four core semantics — trim / drop-empty / dedupe / first-occurrence
//   order — via stable key-substring scan of the extracted block (NOT
//   full-function text). Pure EJS source string scan; no DOM, no execution.
check('131 admin index.ejs client normalizeTags mirrors server trim/drop/dedupe/order', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  const sig = 'function normalizeTags(raw) {';
  const sigPos = ejsSrc.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain client `function normalizeTags(raw) {`');
  assert.ok(
    ejsSrc.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one client normalizeTags (no duplicate)'
  );
  let depth = 0;
  let block = '';
  for (let i = sigPos + sig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { block = ejsSrc.slice(sigPos, i + 1); break; }
    }
  }
  assert.ok(block, 'client normalizeTags block MUST be brace-balanced');

  // 1. Splits the comma string into candidate tags (server normalizeTagsInput
  //    does the same for its string branch).
  assert.ok(block.includes("split(',')"), 'client normalizeTags MUST split on comma');
  // 2. Trims each candidate (leading/trailing whitespace).
  assert.ok(
    block.includes('.replace(/^\\s+|\\s+$/g, \'\')'),
    'client normalizeTags MUST trim each tag'
  );
  // 3. Drops empties after trim.
  assert.ok(block.includes("s === ''"), 'client normalizeTags MUST drop empty tags');
  // 4. Dedupes via a seen map (first occurrence wins).
  assert.ok(
    block.includes('Object.prototype.hasOwnProperty.call(seen, s)'),
    'client normalizeTags MUST skip already-seen tags (dedupe)'
  );
  assert.ok(block.includes('seen[s] = true'), 'client normalizeTags MUST record seen tags');
  // 5. Preserves first-occurrence order by pushing in input order.
  assert.ok(block.includes('out.push(s)'), 'client normalizeTags MUST preserve order via out.push');
});

// Phase 20260629-admin-body-default-warning-slice-a:
//   analyzeReadyGap now raises a soft, Admin-only Ready-preflight warning
//   (field 'bodyDefault') when the body is still empty or the untouched
//   defaultBody() scaffold — Dean forgot to write the post before exporting.
//   warning-only: never blocking, never required, never alters
//   buildPostMarkdown output. The default-body string is obtained via a
//   round-trip (buildPostMarkdown with empty body emits defaultBody) so the
//   test needs no extra export of the helper.
const readyHappyBody = { ...readyHappy, body: '## 正文\n\n實際撰寫的內容，已非預設範例。' };

check('132 analyzeReadyGap default body → soft warning bodyDefault (not blocking, ready not gated)', () => {
  // The exact defaultBody scaffold, recovered from an empty-body export.
  const defaultBodyStr = matter(buildPostMarkdown({ ...readyHappy, body: '' })).content;
  const r = analyzeReadyGap({ ...readyHappy, body: defaultBodyStr });
  assert.ok(fieldNames(r.warnings).includes('bodyDefault'), 'unchanged scaffold MUST warn');
  // soft only: never blocking, and the warning does not flip ok=false.
  assert.ok(!fieldNames(r.blocking).includes('bodyDefault'));
  assert.equal(r.ok, true);
  assert.equal(r.summary, 'ready-candidate');
});

check('133 analyzeReadyGap empty / missing / whitespace body → bodyDefault warning (fallback)', () => {
  assert.ok(fieldNames(analyzeReadyGap({ ...readyHappy, body: '' }).warnings).includes('bodyDefault'));
  assert.ok(fieldNames(analyzeReadyGap({ ...readyHappy, body: '   \n  ' }).warnings).includes('bodyDefault'));
  // key absent → buildPostMarkdown falls back to defaultBody, so it also warns.
  assert.ok(fieldNames(analyzeReadyGap(readyHappy).warnings).includes('bodyDefault'));
});

check('134 analyzeReadyGap rewritten body → no bodyDefault warning', () => {
  const r = analyzeReadyGap(readyHappyBody);
  assert.ok(!fieldNames(r.warnings).includes('bodyDefault'), 'real content MUST NOT warn');
  // and the rewritten-body fixture is otherwise a clean ready candidate.
  assert.deepEqual(r.warnings, []);
});

check('135 admin index.ejs client analyzeReadyGap mirrors bodyDefault warning + defaultBody compare', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  const sig = 'function analyzeReadyGap(input) {';
  const sigPos = ejsSrc.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain client `function analyzeReadyGap(input) {`');
  assert.ok(
    ejsSrc.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one client analyzeReadyGap (no duplicate)'
  );
  let depth = 0;
  let block = '';
  for (let i = sigPos + sig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { block = ejsSrc.slice(sigPos, i + 1); break; }
    }
  }
  assert.ok(block, 'client analyzeReadyGap block MUST be brace-balanced');
  // Reads body and compares against defaultBody() (server parity).
  assert.ok(block.includes('safeInput.body'), 'client MUST read safeInput.body');
  assert.ok(block.includes('defaultBody()'), 'client MUST compare against defaultBody()');
  assert.ok(
    block.includes("field: 'bodyDefault'"),
    'client MUST push the bodyDefault warning'
  );
  // And the label constant exists (panel renders it generically).
  assert.ok(
    ejsSrc.includes('bodyDefault:'),
    'client READY_WARNING_LABELS MUST define a bodyDefault label'
  );
});

// Phase 20260629-admin-target-filename-checklist-slice-a:
//   Dean's real-draft note flagged that a manually-saved file whose name does
//   not match the UI filename / target path diverges from the frontmatter slug.
//   The manual-import checklist now (a) tells him the saved filename MUST match
//   the target path / filename and (b) recommends Download (auto-names). These
//   cases lock the reminder copy via short stable key-phrase scan of the
//   import-flow block (NOT full-sentence text) and confirm the existing
//   Copy / Download / Copy-target-path affordances are not removed.
//   Pure EJS source string scan; no DOM, no execution.
function extractImportFlowBlock() {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  const start = ejsSrc.indexOf('📥 Manual import flow');
  assert.ok(start > 0, 'index.ejs MUST contain the 📥 Manual import flow block');
  const end = ejsSrc.indexOf('</ol>', start);
  assert.ok(end > start, 'import flow block MUST contain the checklist <ol>');
  return ejsSrc.slice(start, end + '</ol>'.length);
}

check('136 admin import checklist warns filename must match target path + recommends Download', () => {
  const block = extractImportFlowBlock();
  // (a) filename / target-path consistency reminder.
  assert.ok(block.includes('檔名必須與'), 'checklist MUST warn the saved 檔名 必須與 target path/filename match');
  assert.ok(block.includes('完全一致'), 'checklist MUST stress 完全一致 (exact match)');
  assert.ok(block.includes('target path'), 'checklist MUST reference the target path');
  // (b) Download auto-names → recommended over hand-naming.
  assert.ok(block.includes('建議優先用 Download'), 'checklist MUST recommend Download');
  assert.ok(block.includes('自動以正確檔名'), 'checklist MUST state Download auto-names the file');
});

check('137 admin import checklist keeps Copy / Download / Copy target path affordances', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  // The new reminder copy must NOT have removed the existing buttons.
  for (const id of ['id="npd-copy"', 'id="npd-download"', 'id="npd-copy-path"']) {
    assert.ok(src.includes(id), 'index.ejs MUST keep button `' + id + '` (affordance preserved)');
  }
  for (const label of ['Copy markdown', 'Download .md', 'Copy target path']) {
    assert.ok(src.includes(label), 'index.ejs MUST keep `' + label + '` affordance label');
  }
});

// Phase 20260629-admin-cover-alt-without-cover-warning-slice-a:
//   analyzeReadyGap now raises a soft consistency warning (field
//   'coverAltWithoutCover') when coverAlt is set but cover is empty — alt text
//   for a non-existent cover image. warning-only: never blocking, never alters
//   buildPostMarkdown output. (cover-empty itself is still a separate blocking
//   rule; this new field never adds to blocking.)
check('138 analyzeReadyGap coverAlt set + cover empty → warning (not blocking)', () => {
  const r = analyzeReadyGap({ ...readyHappy, cover: '', coverAlt: '封面替代文字' });
  assert.ok(fieldNames(r.warnings).includes('coverAltWithoutCover'), 'alt-without-cover MUST warn');
  // warning-only: the new field never appears in blocking.
  assert.ok(!fieldNames(r.blocking).includes('coverAltWithoutCover'));
  // (cover-empty independently blocks via the existing cover rule — expected,
  //  unrelated to this warning.)
  assert.ok(fieldNames(r.blocking).includes('cover'));
});

check('139 analyzeReadyGap coverAlt set + cover set → no coverAltWithoutCover warning', () => {
  const r = analyzeReadyGap({ ...readyHappy, cover: 'https://x/c.jpg', coverAlt: '封面替代文字' });
  assert.ok(!fieldNames(r.warnings).includes('coverAltWithoutCover'));
});

check('140 analyzeReadyGap coverAlt empty + cover empty → no coverAltWithoutCover warning', () => {
  const r = analyzeReadyGap({ ...readyHappy, cover: '', coverAlt: '' });
  assert.ok(!fieldNames(r.warnings).includes('coverAltWithoutCover'), 'empty alt MUST NOT trigger this rule');
  // the empty coverAlt still raises its own existing warning (unchanged).
  assert.ok(fieldNames(r.warnings).includes('coverAlt'));
});

check('141 admin index.ejs client analyzeReadyGap mirrors coverAltWithoutCover warning', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  const sig = 'function analyzeReadyGap(input) {';
  const sigPos = ejsSrc.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain client `function analyzeReadyGap(input) {`');
  assert.ok(
    ejsSrc.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one client analyzeReadyGap (no duplicate)'
  );
  let depth = 0;
  let block = '';
  for (let i = sigPos + sig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { block = ejsSrc.slice(sigPos, i + 1); break; }
    }
  }
  assert.ok(block, 'client analyzeReadyGap block MUST be brace-balanced');
  // Same cover-empty + coverAlt-set condition and warning field as the server.
  assert.ok(
    block.includes("cover === '' && coverAlt !== ''"),
    'client MUST gate on cover empty + coverAlt set'
  );
  assert.ok(
    block.includes("field: 'coverAltWithoutCover'"),
    'client MUST push the coverAltWithoutCover warning'
  );
  assert.ok(
    ejsSrc.includes('coverAltWithoutCover:'),
    'client READY_WARNING_LABELS MUST define a coverAltWithoutCover label'
  );
});

// Phase 20260629-admin-body-second-h1-warning-slice-a:
//   analyzeReadyGap raises a soft, fence-aware Admin-only Ready-preflight
//   warning (field 'bodySecondH1') when the Markdown body contains a column-0
//   `# ` ATX heading outside any fenced code block. The frontmatter title
//   already becomes the page H1, so a body `# Heading` would double up.
//   warning-only: never blocking, never alters buildPostMarkdown output.
//   Lines containing `#` inside ``` / ~~~ fenced blocks (e.g. shell comments)
//   MUST NOT trigger the warning. `##` / `###` etc. MUST NOT trigger either —
//   only single-`#` ATX H1 at column 0 counts.
check('142 analyzeReadyGap top-level # H1 outside fence → bodySecondH1 (warning-only)', () => {
  const r = analyzeReadyGap({
    ...readyHappyBody,
    body: '## 簡介\n\n正文段落。\n\n# 另一個一級標題\n\n後續段落。\n',
  });
  assert.ok(fieldNames(r.warnings).includes('bodySecondH1'), 'top-level # H1 MUST warn');
  // warning-only: never appears in blocking, never flips ok=false.
  assert.ok(!fieldNames(r.blocking).includes('bodySecondH1'));
  assert.equal(r.ok, true);
  assert.equal(r.summary, 'ready-candidate');
});

check('143 analyzeReadyGap only ## / ### headings → no bodySecondH1 warning', () => {
  // readyHappyBody body = '## 正文\n\n實際撰寫的內容，已非預設範例。' — no `# `.
  const r1 = analyzeReadyGap(readyHappyBody);
  assert.ok(!fieldNames(r1.warnings).includes('bodySecondH1'));
  const r2 = analyzeReadyGap({
    ...readyHappyBody,
    body: '## 簡介\n\n### 細項\n\n#### 更深層\n\n沒有 `# ` 一級標題。\n',
  });
  assert.ok(!fieldNames(r2.warnings).includes('bodySecondH1'));
  // `#text` (no space) must also NOT match — it is not an ATX heading.
  const r3 = analyzeReadyGap({
    ...readyHappyBody,
    body: '## 段落\n\n#hashtag-not-heading\n\n結尾。\n',
  });
  assert.ok(!fieldNames(r3.warnings).includes('bodySecondH1'));
});

check('144 analyzeReadyGap # inside fenced code block (``` / ~~~) → no warning', () => {
  // Backtick fence — shell comment is the canonical case.
  const backtick = analyzeReadyGap({
    ...readyHappyBody,
    body: '## 步驟\n\n```bash\n# install deps\nnpm install\n```\n\n結尾。\n',
  });
  assert.ok(!fieldNames(backtick.warnings).includes('bodySecondH1'), 'backtick-fenced `#` MUST NOT warn');
  // Tilde fence — same rule applies.
  const tilde = analyzeReadyGap({
    ...readyHappyBody,
    body: '## 範例\n\n~~~text\n# heading inside tilde fence\n~~~\n\n結尾。\n',
  });
  assert.ok(!fieldNames(tilde.warnings).includes('bodySecondH1'), 'tilde-fenced `#` MUST NOT warn');
  // Mixed: `#` inside fence is ignored, but a separate `#` outside the fence still warns.
  const mixed = analyzeReadyGap({
    ...readyHappyBody,
    body: '## 段落\n\n```bash\n# comment\n```\n\n# 真的二級 H1\n\n結尾。\n',
  });
  assert.ok(fieldNames(mixed.warnings).includes('bodySecondH1'), 'outside-fence `#` MUST still warn even after a fenced `#`');
});

check('145 admin index.ejs client analyzeReadyGap mirrors bodySecondH1 (fence-aware)', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const ejsSrc = readFileSync(ejsPath, 'utf8');
  // Client mirror helper MUST exist (single declaration; mirror pattern of #131 / #135 / #141).
  const helperSig = 'function hasTopLevelH1OutsideFence(body) {';
  const helperPos = ejsSrc.indexOf(helperSig);
  assert.ok(helperPos > 0, 'index.ejs MUST contain client `function hasTopLevelH1OutsideFence(body) {`');
  assert.ok(
    ejsSrc.indexOf(helperSig, helperPos + helperSig.length) < 0,
    'index.ejs MUST contain exactly one client hasTopLevelH1OutsideFence (no duplicate)'
  );
  // Brace-balanced extraction of the helper.
  let depth = 0;
  let helperBlock = '';
  for (let i = helperPos + helperSig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { helperBlock = ejsSrc.slice(helperPos, i + 1); break; }
    }
  }
  assert.ok(helperBlock, 'client hasTopLevelH1OutsideFence MUST be brace-balanced');
  // Fence-aware signals: backtick / tilde detection + the inFence toggle.
  assert.ok(helperBlock.includes("'`'") && helperBlock.includes("'~'"), 'helper MUST detect both backtick and tilde fences');
  assert.ok(helperBlock.includes('inFence'), 'helper MUST track inFence state');
  assert.ok(helperBlock.includes('>= 3'), 'helper MUST require >= 3 fence chars to open / close');
  // Top-level `# ` detection: `#` followed by space at column 0.
  assert.ok(helperBlock.includes("ch0 === '#'"), 'helper MUST gate on `#` at column 0');
  assert.ok(helperBlock.includes("line.charAt(1) === ' '"), "helper MUST require ` ` after `#` (rules out `##` / `#text`)");

  // analyzeReadyGap MUST call the helper and push the bodySecondH1 warning.
  const sig = 'function analyzeReadyGap(input) {';
  const sigPos = ejsSrc.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain client `function analyzeReadyGap(input) {`');
  assert.ok(
    ejsSrc.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one client analyzeReadyGap (no duplicate)'
  );
  let d2 = 0;
  let block = '';
  for (let i = sigPos + sig.length - 1; i < ejsSrc.length; i++) {
    const ch = ejsSrc[i];
    if (ch === '{') d2++;
    else if (ch === '}') {
      d2--;
      if (d2 === 0) { block = ejsSrc.slice(sigPos, i + 1); break; }
    }
  }
  assert.ok(block, 'client analyzeReadyGap block MUST be brace-balanced');
  assert.ok(
    block.includes('hasTopLevelH1OutsideFence(safeInput.body)'),
    'client analyzeReadyGap MUST call hasTopLevelH1OutsideFence(safeInput.body)'
  );
  assert.ok(
    block.includes("field: 'bodySecondH1'"),
    'client MUST push the bodySecondH1 warning'
  );
  assert.ok(
    ejsSrc.includes('bodySecondH1:'),
    'client READY_WARNING_LABELS MUST define a bodySecondH1 label'
  );
});

// Phase 20260629-admin-today-date-shortcut-slice-a:
//   Admin UI now offers a "今天" convenience button beside the date input.
//   Click fills #npd-date with today's local YYYY-MM-DD (via the existing
//   todayIso() helper, which uses local date parts — not toISOString — so it
//   stays correct near midnight in any timezone) and dispatches an 'input'
//   event so the existing debounceRecompute path picks it up. Net-additive:
//   the load-time auto-prefill (L~3549) stays intact, so initial ready/export
//   gating is unchanged. Pure EJS source string scan; no DOM, no execution.
check('146 admin index.ejs date row has #npd-today button adjacent to #npd-date', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  const datePos = src.indexOf('id="npd-date"');
  assert.ok(datePos > 0, 'index.ejs MUST contain `id="npd-date"`');
  // Same <td> as the date input — locate the closing </td> after the date
  // and require the today button to appear before it.
  const tdClose = src.indexOf('</td>', datePos);
  assert.ok(tdClose > datePos, 'date input MUST sit inside a closed <td>…</td>');
  const tdSlice = src.slice(datePos, tdClose);
  assert.ok(
    tdSlice.includes('id="npd-today"'),
    '#npd-today MUST live in the same <td> as #npd-date (adjacent placement)'
  );
  // Button must be a type=button (not a submit) and carry the "今天" label so
  // it cannot silently swap into another affordance.
  const todayPos = src.indexOf('id="npd-today"');
  const tagStart = src.lastIndexOf('<button', todayPos);
  assert.ok(tagStart > 0, '#npd-today MUST be inside a <button …> opening tag');
  const tagEnd = src.indexOf('>', todayPos);
  const tag = src.slice(tagStart, tagEnd + 1);
  assert.ok(/type="button"/.test(tag), '#npd-today MUST carry `type="button"` (not submit)');
  // The button text "今天" follows the opening tag.
  const closeTag = src.indexOf('</button>', tagEnd);
  assert.ok(closeTag > tagEnd, '#npd-today MUST close with </button>');
  const label = src.slice(tagEnd + 1, closeTag).replace(/^\s+|\s+$/g, '');
  assert.equal(label, '今天', '#npd-today text MUST be exactly `今天` (got `' + label + '`)');
});

check('147 admin index.ejs todayIso() uses local date parts (NOT toISOString)', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  const sig = 'function todayIso()';
  const sigPos = src.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain `function todayIso()` helper');
  assert.ok(
    src.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one todayIso() (no duplicate)'
  );
  const openBrace = src.indexOf('{', sigPos);
  let depth = 0;
  let block = '';
  for (let i = openBrace; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { block = src.slice(sigPos, i + 1); break; }
    }
  }
  assert.ok(block, 'todayIso() block MUST be brace-balanced');
  // MUST use local date parts.
  assert.ok(block.includes('getFullYear()'), 'todayIso() MUST use getFullYear()');
  assert.ok(block.includes('getMonth()'), 'todayIso() MUST use getMonth()');
  assert.ok(block.includes('getDate()'), 'todayIso() MUST use getDate()');
  // MUST NOT use UTC-based date string (causes ±1 day skew across midnight).
  assert.ok(
    !/toISOString\s*\(/.test(block),
    'todayIso() MUST NOT use toISOString() — local timezone parts only (UTC skew bug guard)'
  );
  assert.ok(
    !/toJSON\s*\(/.test(block),
    'todayIso() MUST NOT use toJSON() — same UTC skew concern as toISOString'
  );
});

check('148 admin index.ejs #npd-today click handler writes value + dispatches input event', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  // TODO_BTN ref must exist + be wired with addEventListener('click', ...).
  const refLit = "var TODAY_BTN = document.getElementById('npd-today')";
  assert.ok(
    src.includes(refLit),
    `index.ejs MUST contain \`${refLit}\` reference (single source for today-button)`
  );
  const wireLit = "TODAY_BTN.addEventListener('click',";
  const wirePos = src.indexOf(wireLit);
  assert.ok(wirePos > 0, "index.ejs MUST wire `TODAY_BTN.addEventListener('click', ...)`");
  // Slice ~400 chars after the wiring anchor — handler body is small.
  const handlerSlice = src.slice(wirePos, wirePos + 400);
  assert.ok(
    handlerSlice.includes('DATE_EL.value = todayIso()'),
    'click handler MUST assign `DATE_EL.value = todayIso()` (route through the local-parts helper, not a new date computation)'
  );
  // Dispatch an input event so the existing debounceRecompute listener fires.
  assert.ok(
    /DATE_EL\.dispatchEvent\(\s*new Event\(\s*['"]input['"]/.test(handlerSlice),
    "click handler MUST dispatch an `input` Event on DATE_EL so debounceRecompute fires"
  );
  // Bubbling helps in case any future listener attaches at <body>; locks the
  // pattern so a future minor edit can't accidentally drop bubbling.
  assert.ok(
    /bubbles\s*:\s*true/.test(handlerSlice),
    'click handler MUST dispatch with `bubbles: true`'
  );
});

check('149 admin index.ejs auto-prefill + input wiring for DATE_EL preserved', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  // Auto-prefill: conditional load-time write into DATE_EL.value (only when
  // empty). This is what keeps Slice C net-additive — initial ready/export
  // gating must not change. Lock the exact guard so a refactor cannot drop
  // the `!DATE_EL.value` short-circuit and start clobbering Dean-typed values.
  assert.ok(
    src.includes('if (DATE_EL && !DATE_EL.value) DATE_EL.value = todayIso();'),
    'index.ejs MUST preserve the conditional auto-prefill `if (DATE_EL && !DATE_EL.value) DATE_EL.value = todayIso();`'
  );
  // Existing input-event wiring (smoke #97 array) must still include DATE_EL,
  // so the today button's dispatched 'input' event has a listener to fire.
  assert.ok(
    src.includes('[TITLE_EL, TITLE_EN_EL, SLUG_EL, DATE_EL, TAGS_EL, DESC_EL, SEARCH_DESC_EL, COVER_EL, COVER_ALT_EL, BODY_EL]'),
    'input-event wiring array MUST still include DATE_EL (debounceRecompute target)'
  );
});

// Phase 20260629-admin-slug-helper-copy-clarify-slice-a:
//   Dean's hand-verification of Slice C surfaced a real UX gap: slug field
//   helper did not explicitly tell new users that slug is ONLY the middle
//   segment — not the date, not `.md`, not the full target path. Dean tried
//   `testTitle` and `20260622-testTitle.md`; both fail sanitizeSlug, which
//   left the Download button disabled with no actionable hint nearby.
//
//   The fix extends the existing slug hint <span> with negative constraints
//   + a concrete `test-title` example. The format placeholder (`kebab-case，
//   僅 a-z 0-9 -`) and the existing `{date}-{slug}.md` composition hint stay
//   intact. No validation rule change, no filename / target-path rule change.
//
//   Smoke locks the new hint copy via stable key-phrase scan of the slug
//   <td> block (NOT full-sentence text). Scope is the same <td> as #npd-slug
//   so a future refactor that moves the hint into a sibling row would surface
//   here rather than silently splitting the message Dean reads.
//
//   Pure EJS source string scan; no DOM, no execution.
function extractSlugTdBlock() {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  const slugPos = src.indexOf('id="npd-slug"');
  assert.ok(slugPos > 0, 'index.ejs MUST contain `id="npd-slug"`');
  const tdClose = src.indexOf('</td>', slugPos);
  assert.ok(tdClose > slugPos, '#npd-slug MUST sit inside a closed <td>…</td>');
  return src.slice(slugPos, tdClose + '</td>'.length);
}

check('150 admin index.ejs slug helper warns against date / .md / 完整路徑', () => {
  const block = extractSlugTdBlock();
  assert.ok(
    block.includes('不含 date'),
    'slug helper MUST warn `不含 date` (Dean tripped trying `20260622-testTitle.md` — date is auto-prepended)'
  );
  assert.ok(
    block.includes('不含 .md'),
    'slug helper MUST warn `不含 .md` (`.md` extension is auto-appended)'
  );
  assert.ok(
    block.includes('不含完整路徑'),
    'slug helper MUST warn `不含完整路徑` (target folder is fixed; only the middle segment goes in)'
  );
  assert.ok(
    block.includes('kebab-case'),
    'slug helper MUST surface `kebab-case` (matches sanitizeSlug rule + placeholder hint)'
  );
});

check('151 admin index.ejs slug helper carries test-title example + {date}-{slug}.md pattern', () => {
  const block = extractSlugTdBlock();
  // Concrete kebab-case example Dean can copy as a starting point.
  assert.ok(
    block.includes('test-title'),
    'slug helper MUST carry the `test-title` example (concrete lowercase kebab-case demo)'
  );
  // Composition hint MUST stay so users still see what filename the system
  // assembles. Locks against a future refactor that drops the pattern when
  // adding the negative-constraint copy.
  assert.ok(
    block.includes('{date}-{slug}.md'),
    'slug helper MUST keep `{date}-{slug}.md` filename pattern (auto-composed; existing affordance)'
  );
  // Existing Download-disable behavior hint stays — no silent removal.
  assert.ok(
    block.includes('Download'),
    'slug helper MUST keep the `Download` button reference (explains why the button stays disabled on invalid slug)'
  );
});

// Phase 20260630-admin-date-helper-copy-clarify-slice-a:
//   Mirror of slug helper slice #150 / #151. The `今天` button (#146) landed
//   adjacent to #npd-date, but the date row hint copy stayed the terse
//   `→ YYYY-MM-DD；預設今天` — it described neither the load-time auto-prefill
//   nor the new button. Dean's hand-verification of Slice C surfaced that
//   gap (the button was discoverable only by hovering its `title` attribute).
//
//   The fix extends the existing hint <span> to explicitly state (a) the
//   load-time auto-prefill behaviour and (b) that the button refills to local
//   today. No format change, no auto-prefill rule change, no recompute /
//   target-path / filename change. Net-additive copy only.
//
//   Smoke scopes to the same <td> as #npd-date so a refactor that moves the
//   hint into a sibling row would surface here rather than silently splitting
//   the message Dean reads. Pure EJS source string scan; no DOM, no execution.
function extractDateTdBlock() {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  const datePos = src.indexOf('id="npd-date"');
  assert.ok(datePos > 0, 'index.ejs MUST contain `id="npd-date"`');
  const tdClose = src.indexOf('</td>', datePos);
  assert.ok(tdClose > datePos, '#npd-date MUST sit inside a closed <td>…</td>');
  return src.slice(datePos, tdClose + '</td>'.length);
}

check('152 admin index.ejs date helper mentions YYYY-MM-DD + 自動填 today behaviour', () => {
  const block = extractDateTdBlock();
  assert.ok(
    block.includes('YYYY-MM-DD'),
    'date helper MUST surface the `YYYY-MM-DD` format (matches DATE_RE + sanitizeDate)'
  );
  assert.ok(
    block.includes('自動填'),
    'date helper MUST describe the load-time auto-prefill behaviour (`if (DATE_EL && !DATE_EL.value) DATE_EL.value = todayIso()`)'
  );
  assert.ok(
    block.includes('本機今天'),
    'date helper MUST clarify that the prefilled value is local today (mirrors todayIso() local-parts contract, smoke #147)'
  );
});

check('153 admin index.ejs date helper points at the 今天 refill button', () => {
  const block = extractDateTdBlock();
  // The hint copy must reference the 「今天」 button by label so Dean discovers
  // it without hovering the button's title attribute. Smoke #146 already locks
  // the button's existence + adjacency; this one locks that the helper copy
  // tells users what it does.
  assert.ok(
    block.includes('今天'),
    'date helper MUST reference the `今天` button label (matches #npd-today button)'
  );
  assert.ok(
    block.includes('重填'),
    'date helper MUST clarify the button refills the date (not just `預設今天`, which described the auto-prefill only)'
  );
});

// Phase 20260630-admin-tags-helper-copy-clarify-slice-a:
//   The tags datalist (npd-tags-options) lists tags.json ids filtered to the
//   selected site. Per #129 (site-aware) + free-text input, Dean CAN type a
//   tag not in the list — Ready preflight then surfaces unknown-tag warning.
//   The prior hint copy stated "不在清單內仍可手動輸入 (...)" but did NOT
//   spell out two adjacent invariants Dean asked about:
//     (a) the datalist is hint-only / not a strict select — i.e. registry
//         binding is soft, the input is the source of truth
//     (b) typing a fresh tag does NOT auto-register it into tags.json —
//         registry stays user-owned; Admin never writes settings files
//
//   The fix appends both clauses into the same hint <span>. No DOM / input
//   behaviour change, no datalist source change, no validator change, no
//   markdown output change. Net-additive copy only.
//
//   Smoke scopes to the same <td> as #npd-tags so a refactor that moves the
//   hint into a sibling row would surface here rather than silently splitting
//   the message Dean reads. Pure EJS source string scan; no DOM, no execution.
function extractTagsTdBlock() {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  const tagsPos = src.indexOf('id="npd-tags"');
  assert.ok(tagsPos > 0, 'index.ejs MUST contain `id="npd-tags"`');
  const tdClose = src.indexOf('</td>', tagsPos);
  assert.ok(tdClose > tagsPos, '#npd-tags MUST sit inside a closed <td>…</td>');
  return src.slice(tagsPos, tdClose + '</td>'.length);
}

check('154 admin index.ejs tags helper clarifies datalist is hint-only (not a hard limit)', () => {
  const block = extractTagsTdBlock();
  // Mirrors the input type=text + list=npd-tags-options contract (free text
  // stays allowed; datalist is suggestion-only). Without this clause, Dean
  // could read "datalist 依目前 site 列出 ..." as a strict whitelist.
  assert.ok(
    block.includes('輔助提示'),
    'tags helper MUST mark the datalist as `輔助提示` (hint-only, not a strict select)'
  );
  assert.ok(
    block.includes('非硬性限制'),
    'tags helper MUST state `非硬性限制` (input remains free text; datalist binding is soft)'
  );
  // Existing free-text + warning hint MUST stay so Dean still sees what
  // happens when typing outside the list.
  assert.ok(
    block.includes('不在清單內仍可手動輸入'),
    'tags helper MUST keep `不在清單內仍可手動輸入` (free-text path is still surfaced)'
  );
  assert.ok(
    block.includes('unknown-tag'),
    'tags helper MUST keep `unknown-tag` warning reference (matches validator + Ready preflight)'
  );
});

check('155 admin index.ejs tags helper warns that a new tag is NOT auto-registered', () => {
  const block = extractTagsTdBlock();
  // Admin is read-only for settings files (see §3a red lines + check-admin-
  // governance-aggregation contract). The hint MUST tell Dean that typing a
  // brand-new tag in this input does NOT mutate tags.json — registry stays
  // user-owned; he must edit tags.json + re-run validate:content himself.
  assert.ok(
    block.includes('不會自動寫入'),
    'tags helper MUST warn `不會自動寫入` (typing a fresh tag does NOT auto-register)'
  );
  assert.ok(
    block.includes('tags.json'),
    'tags helper MUST name `tags.json` as the registry file (so Dean knows where to edit when he wants to add the tag)'
  );
});

// Phase 20260630-admin-category-registry-bound-guard-slice-a:
//   The tags field (#npd-tags) is a free-text <input> bound to a datalist hint,
//   so its helper legitimately says "datalist 是輔助提示 / 非硬性限制 / 不在清單內
//   仍可手動輸入 / 新 tag 不會自動寫入 tags.json" (#154-155). The category field
//   (#npd-category) is a DIFFERENT control model: a registry-bound <select>
//   sourced from categories.json — the UI itself is the hard limit (you can only
//   pick a defined category or leave it empty). The two MUST NOT converge by
//   accident: a future refactor that copy-pastes the tags helper wording onto
//   category, or swaps the <select> for a tags-style free-text <input>+datalist,
//   would silently change category from "registry-bound" to "free text". That is
//   a design decision (own phase + explicit approval), never a drive-by edit.
//
//   These two cases pin the current registry-bound reality:
//     #156 — control stays a <select> (no <input id="npd-category">, no list= /
//            <datalist in the category <td>).
//     #157 — helper copy carries NO tags-style free-text claims, while keeping
//            the existing registry / categories.json / unknown-category copy.
//
//   Test-only guard. No UI behaviour change, no copy change, no markdown output
//   change. Pure EJS source string scan; no DOM, no headless browser.
//   Scope is the category value <td> (the cell holding the <select> + helper
//   span) so a refactor that moves the hint into a sibling row surfaces here.
function extractCategoryTdBlock() {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  const catIdPos = src.indexOf('id="npd-category"');
  assert.ok(catIdPos > 0, 'index.ejs MUST contain an element with `id="npd-category"`');
  const tdOpen = src.lastIndexOf('<td', catIdPos);
  assert.ok(tdOpen >= 0 && tdOpen < catIdPos, '#npd-category MUST sit inside an opening <td');
  const tdClose = src.indexOf('</td>', catIdPos);
  assert.ok(tdClose > catIdPos, '#npd-category MUST sit inside a closed <td>…</td>');
  return src.slice(tdOpen, tdClose + '</td>'.length);
}

check('156 admin index.ejs category row stays a registry-bound <select> (not tags-style free text)', () => {
  const block = extractCategoryTdBlock();
  // The control MUST be a <select id="npd-category">, never an <input>. A
  // <select> can only emit a defined category (or empty) — the registry binding
  // is hard, by construction. Swapping to <input> would silently allow arbitrary
  // category strings, which is a separate design decision.
  assert.ok(
    block.includes('<select id="npd-category"'),
    '#npd-category MUST stay a `<select>` (registry-bound; UI is the hard limit)'
  );
  assert.ok(
    block.indexOf('<input id="npd-category"') < 0,
    '#npd-category MUST NOT become an <input> (that would convert it to free text)'
  );
  // The category <td> MUST carry no tags-style autocomplete plumbing — a
  // `list=` / `<datalist` here would mean it had been turned into the soft,
  // hint-only model the tags field uses.
  assert.ok(
    !/list=/.test(block),
    'category <td> MUST NOT carry a `list=` binding (that is the tags-style datalist model)'
  );
  assert.ok(
    !block.includes('<datalist'),
    'category <td> MUST NOT contain a `<datalist>` (registry-bound select, not autocomplete hint)'
  );
});

check('157 admin index.ejs category helper makes no tags-style free-text claims', () => {
  const block = extractCategoryTdBlock();
  // The tags helper (#154-155) legitimately says these — because tags is free
  // text. Category is a <select>; copying this wording would mislead Dean into
  // thinking he can type an arbitrary category, so it MUST be absent here.
  assert.ok(
    !block.includes('非硬性限制'),
    'category helper MUST NOT claim `非硬性限制` (the <select> IS a hard limit)'
  );
  assert.ok(
    !block.includes('不在清單內仍可手動'),
    'category helper MUST NOT claim `不在清單內仍可手動輸入` (free-text path does not exist for a <select>)'
  );
  assert.ok(
    !block.includes('不會自動寫入'),
    'category helper MUST NOT carry the `不會自動寫入 …json` auto-register caveat (implies free-text entry)'
  );
  // Keep the existing correct registry copy so this guard also locks the
  // registry-bound framing already shipped (matches #112).
  assert.ok(
    block.includes('categories.json'),
    'category helper MUST keep naming `categories.json` as the source registry'
  );
  assert.ok(
    block.includes('unknown-category'),
    'category helper MUST keep the `unknown-category` Ready-preflight reference'
  );
});

// Phase 20260630-admin-registry-ownership-guard-slice-a:
//   Registry entries (categories.json / tags.json) remain user-owned. The Admin
//   draft-export surface *warns / hints* about unknown category / tag, but it
//   MUST NEVER persist a registry file — no fs write, no fetch/POST/PUT/PATCH,
//   no "auto-add unknown tag to tags.json" convenience. Registry changes happen
//   by hand in VS Code, validated by validate-content.js. These two cases pin
//   that ownership boundary on both sides of the mirror:
//     #158 — server module admin-markdown-export.js has no registry write path.
//     #159 — the UI only reads a server-derived registry snapshot and points
//            Dean at the JSON files; it offers no Add/Edit/Delete/Save/Apply.
//   Test-only guard. No UI / copy / behaviour / markdown-output change. Pure
//   source string scan; no DOM, no headless browser. Regexes are scoped to the
//   registry JSON write path (case-sensitive POST|PUT|PATCH so the `post`
//   contentKind enum + prose "post" never false-trip) to avoid full-text noise.
check('158 admin-markdown-export.js never writes the category / tag registry JSON', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const serverPath = resolve(here, 'admin-markdown-export.js');
  const serverSrc = readFileSync(serverPath, 'utf8');
  // (a) No filesystem write API anywhere in the pure module.
  assert.ok(
    !/\b(writeFileSync|writeFile|appendFileSync|appendFile|createWriteStream)\s*\(/.test(serverSrc),
    'admin-markdown-export.js MUST contain no fs write call (module is pure string assembly)'
  );
  // (b) No network mutation call anywhere in the pure module.
  assert.ok(
    !/\b(fetch|XMLHttpRequest|axios)\s*\(/.test(serverSrc),
    'admin-markdown-export.js MUST issue no fetch / XHR (no remote registry persist path)'
  );
  // (c) Targeted: no mutation verb (fs write OR uppercase HTTP method) sitting
  //     within ~120 chars of categories.json / tags.json. Case-sensitive
  //     POST|PUT|PATCH keeps the `post` enum + prose "post" from false-tripping.
  const registryWritePath =
    /(writeFileSync|writeFile|appendFileSync|appendFile|createWriteStream|POST|PUT|PATCH)[\s\S]{0,120}(categories|tags)\.json/;
  assert.ok(
    !registryWritePath.test(serverSrc),
    'admin-markdown-export.js MUST NOT pair any write/POST/PUT/PATCH verb with categories.json / tags.json (registry stays user-owned)'
  );
});

check('159 admin index.ejs keeps the category/tag registry user-owned (read-only snapshot, no persist UI)', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const ejsPath = resolve(here, '..', 'views', 'admin', 'index.ejs');
  const src = readFileSync(ejsPath, 'utf8');
  // (a) Read-only registry snapshot is injected from server-derived data; it is
  //     a read-model for hint alignment, not a write path.
  assert.ok(
    src.includes('window.NPD_REGISTRY'),
    'index.ejs MUST keep the read-only registry snapshot (window.NPD_REGISTRY) for hint alignment'
  );
  // (b) The registry panel offers no mutation control and points Dean at the
  //     JSON files for any add / edit.
  assert.ok(
    /本區無 Add \/ Edit \/ Delete \/ Save \/ Apply 按鈕/.test(src),
    'index.ejs registry panel MUST state it has no Add/Edit/Delete/Save/Apply button'
  );
  assert.ok(
    src.includes('增刪分類 / 標籤請手改'),
    'index.ejs MUST direct Dean to hand-edit categories.json / tags.json for registry changes'
  );
  // (c) The tags helper still surfaces that a fresh tag is NOT auto-written —
  //     registry ownership, mirrors #155 from the ownership angle.
  const tagsBlock = extractTagsTdBlock();
  assert.ok(
    tagsBlock.includes('不會自動寫入') && tagsBlock.includes('tags.json'),
    'tags helper MUST keep the "新 tag 不會自動寫入 tags.json" ownership caveat'
  );
});

// Phase 20260630-admin-offline-mutation-guard-slice-a:
//   The Admin draft-export surface is a *local, offline, static* helper. It
//   assembles markdown strings the author copies into VS Code by hand — it must
//   never grow a way to push data off the machine or to a backend. #158 already
//   pins the export module against fetch/XHR + registry fs writes from the
//   registry-ownership angle; these two cases widen that to the whole surface,
//   on the transport + credential axes that #158 / #159 do not assert:
//     #160 — neither the UI (index.ejs) nor the export module ships any external
//            mutation transport (fetch / XHR / axios / sendBeacon / WebSocket /
//            EventSource / <form> submit / POST-style method literal). This is the
//            first guard that pins index.ejs's *whole-file* transport behaviour
//            (#159 only scoped the registry panel sub-region).
//     #161 — neither file embeds a service credential constant (client_secret /
//            access_token / refresh_token / private_key / Authorization / Bearer).
//   Test-only guard. No UI / copy / behaviour / markdown-output change. Pure
//   source string scan; no DOM, no headless browser, no network. Patterns are
//   deliberately specific (credential literals, not bare "token" / "secret" /
//   "credential") so the legitimate red-line prose — e.g. "永不含 token /
//   credential" and SCSS "color token" mentions — never false-trips.
const ADMIN_SURFACE_FILES = () => {
  const here = dirname(fileURLToPath(import.meta.url));
  return [
    { label: 'index.ejs', src: readFileSync(resolve(here, '..', 'views', 'admin', 'index.ejs'), 'utf8') },
    { label: 'admin-markdown-export.js', src: readFileSync(resolve(here, 'admin-markdown-export.js'), 'utf8') },
  ];
};

check('160 Admin source ships no external mutation transport (UI + export module)', () => {
  const files = ADMIN_SURFACE_FILES();
  // Transport primitives that could send data off the machine. Absent in both
  // files today; this locks that. `axios` / `sendBeacon` / `WebSocket` /
  // `EventSource` are net-new vs #158 (which only checked fetch / XHR / axios on
  // the export module).
  const transport = /\b(fetch|XMLHttpRequest|axios|WebSocket|EventSource)\s*\(|\.sendBeacon\s*\(|navigator\s*\.\s*sendBeacon/;
  for (const { label, src } of files) {
    assert.ok(
      !transport.test(src),
      `${label} MUST contain no network transport primitive (fetch / XHR / axios / sendBeacon / WebSocket / EventSource)`
    );
  }
  // The UI must additionally carry no HTML form submit and no explicit uppercase
  // HTTP mutation method literal. Case-sensitive POST|PUT|PATCH|DELETE keeps the
  // `post` contentKind enum + prose "post" from false-tripping.
  const ejs = files.find((f) => f.label === 'index.ejs').src;
  assert.ok(
    !/<form\b/i.test(ejs),
    'index.ejs MUST contain no <form> element (no form-submit data egress path)'
  );
  assert.ok(
    !/\bmethod\s*:\s*['"`](POST|PUT|PATCH|DELETE)['"`]/.test(ejs),
    'index.ejs MUST declare no POST/PUT/PATCH/DELETE request method literal'
  );
});

check('161 Admin source embeds no service credential constant (UI + export module)', () => {
  const files = ADMIN_SURFACE_FILES();
  // Specific credential literals only — NOT bare "token" / "secret" / "credential",
  // which appear legitimately as red-line prose / design-token mentions. All six
  // verified absent in both files at write time.
  const credential = /client_secret|access_token|refresh_token|private_key|Authorization\s*:|\bBearer\s+[A-Za-z0-9._-]/;
  for (const { label, src } of files) {
    assert.ok(
      !credential.test(src),
      `${label} MUST embed no service credential constant (client_secret / access_token / refresh_token / private_key / Authorization / Bearer)`
    );
  }
});

// Phase 20260630-admin-markdown-output-boundary-guard-slice-a:
//   Lock the raw frontmatter/body BOUNDARY of buildPostMarkdown's output and
//   confirm UI helper / registry hint copy never leaks into the exported
//   markdown. Earlier cases parse the output with gray-matter (#1–#12) or scope
//   the literal draft lines (#92), but none asserts on the *raw string shape*:
//   that the file opens with a `---` fence, has a closing `---` fence, and the
//   body lands strictly after that closing fence. Recent slices added a lot of
//   UI-side helper / registry copy (#150–#159); these two cases pin that none of
//   that copy can drift into the markdown the author copies into VS Code.
//   Test-only; no export-function / UI / copy change. Output is generated from
//   controlled fixtures (NOT a source scan), so legitimate article bodies are
//   never mis-flagged.
check('162 buildPostMarkdown output has a clean frontmatter/body boundary', () => {
  // Cover both the default-body path and an explicit user body.
  for (const inp of [happy, { ...happy, body: '## 自訂\n\n正文段落。\n' }]) {
    const md = buildPostMarkdown(inp);
    // (a) Opens with the YAML frontmatter fence on its own first line.
    assert.ok(
      md.startsWith('---\n'),
      'markdown MUST start with the `---` frontmatter fence (input: ' + JSON.stringify(inp) + ')'
    );
    // (b) A closing fence exists after the opening one.
    const fmEnd = md.indexOf('\n---', 3);
    assert.ok(fmEnd > 0, 'markdown MUST contain a closing `---` frontmatter fence');
    // (c) Required frontmatter fields live inside the frontmatter region only.
    const frontmatter = md.slice(0, fmEnd);
    for (const key of ['title:', 'slug:', 'date:', 'category:', 'tags:']) {
      assert.ok(
        new RegExp('^' + key, 'm').test(frontmatter),
        '`' + key + '` MUST appear in the frontmatter region'
      );
    }
    // (d) Body content appears strictly AFTER the closing fence.
    const afterClose = md.slice(fmEnd);
    const bodyMarker = inp.body ? '## 自訂' : '## 簡介';
    assert.ok(
      afterClose.includes(bodyMarker),
      'body (`' + bodyMarker + '`) MUST appear after the closing frontmatter fence'
    );
    // Cross-check: the body marker must NOT sit inside the frontmatter region.
    assert.ok(
      !frontmatter.includes(bodyMarker),
      'body marker MUST NOT leak into the frontmatter region'
    );
  }
});

check('163 UI helper / registry hint copy never leaks into exported markdown', () => {
  // UI-only strings introduced by the helper / registry-hint slices (#150–#159).
  // None belongs in the markdown file the author pastes into VS Code. Generated
  // from controlled fixtures (default body + explicit body), so a real article
  // body never trips this. `categories.json` / `tags.json` carry the `.json`
  // suffix so the frontmatter `category:` / `tags:` keys never false-match.
  const FORBIDDEN = [
    'NPD_REGISTRY',
    '輔助提示',
    '非硬性限制',
    '不會自動寫入',
    'unknown-category',
    'unknown-tag',
    'categories.json',
    'tags.json',
  ];
  for (const inp of [happy, { ...happy, body: '## 自訂\n\n正文段落，沒有任何提示文案。\n' }]) {
    const md = buildPostMarkdown(inp);
    for (const token of FORBIDDEN) {
      assert.ok(
        !md.includes(token),
        'exported markdown MUST NOT contain UI helper / registry copy `' + token + '` (input: ' + JSON.stringify(inp) + ')'
      );
    }
  }
});

// Phase 20260630-admin-markdown-export-artifact-hygiene-reminder-a:
//   Lock the short-form artifact-hygiene reminder inside the Manual import flow
//   block. Mirrors docs/20260630-admin-markdown-export-artifact-hygiene-reminder.md:
//   exported .md is a test artifact by default; production content trees and the
//   deploy clone are off-limits; promotion to a formal draft requires a separate
//   formal-draft-intake / content slice. Pure EJS source scan; no DOM, no
//   execution. Scope reuses extractImportFlowBlock() (see #136) so the reminder
//   is physically inside the manual-import flow where Dean's eye lands before
//   pasting into VS Code.
check('164 admin import flow includes test-artifact hygiene reminder copy', () => {
  const block = extractImportFlowBlock();
  assert.ok(block.includes('test artifact'), 'hygiene reminder MUST mark export as test artifact');
  assert.ok(block.includes('formal draft intake'), 'hygiene reminder MUST point Dean to formal draft intake / content slice');
  assert.ok(block.includes('content/github/posts/'), 'hygiene reminder MUST name content/github/posts/ as off-limits');
  assert.ok(block.includes('content/blogger/posts/'), 'hygiene reminder MUST name content/blogger/posts/ as off-limits');
  assert.ok(block.includes('content/settings/'), 'hygiene reminder MUST name content/settings/ as off-limits');
  assert.ok(block.includes('deploy clone'), 'hygiene reminder MUST name deploy clone as off-limits');
  assert.ok(block.includes('validate:content'), 'hygiene reminder MUST point Dean to npm run validate:content');
});

check('165 hygiene reminder lives in dedicated wrapper class (npd-artifact-hygiene)', () => {
  // Wrapper class lets future styling / scope changes target the reminder
  // directly without grep-by-copy. Confirms the reminder is its own DOM block,
  // not folded into a sibling paragraph where it could silently disappear in a
  // future refactor.
  const block = extractImportFlowBlock();
  assert.ok(
    block.includes('class="npd-artifact-hygiene"') || block.includes("class='npd-artifact-hygiene'"),
    'hygiene reminder MUST live in a dedicated wrapper (class="npd-artifact-hygiene") for future styling / scope'
  );
});

// Phase 20260701-c1-1-admin-github-draft-metadata-contract-bridge:
//   Bridge coverage — proves that a github tech-note draft produced by the
//   Admin flow (buildPostMarkdown, the real production helper) satisfies the
//   SAME registry-bound frontmatter contract that check-github-draft-metadata.js
//   enforces on the hand-authored committed draft. The two smokes previously
//   covered disjoint surfaces: this smoke tested buildPostMarkdown against a
//   synthetic REGS fixture, while check-github-draft-metadata.js tested a real
//   committed file against the real registry — nobody proved buildPostMarkdown
//   output passes the real-registry contract. These cases close that gap.
//
//   Boundaries (mirrors CLAUDE.md red lines):
//   - Reads the REAL registries (content/settings/{categories,tags}.json) but
//     never writes them. Additive / fixture-isolated: does NOT change
//     admin-markdown-export.js, check-github-draft-metadata.js, or any content.
//   - Assertions duplicate check-github-draft-metadata.js contract semantics on
//     purpose (they are two independent guards) rather than importing it — that
//     script is an executable smoke, not a library, and importing it would run
//     its process.exit path.
{
  const here = dirname(fileURLToPath(import.meta.url));
  const root = resolve(here, '..', '..');
  const categories = JSON.parse(
    readFileSync(resolve(root, 'content', 'settings', 'categories.json'), 'utf8')
  );
  const tagsRegistry = JSON.parse(
    readFileSync(resolve(root, 'content', 'settings', 'tags.json'), 'utf8')
  );

  // registry lookup by id-or-slug (mirrors check-github-draft-metadata.js)
  const resolveEntry = (registry, key) => {
    if (typeof key !== 'string' || key.trim() === '') return null;
    const k = key.trim();
    return registry.find((e) => e && (e.id === k || e.slug === k)) ?? null;
  };
  const siteIncludesGithub = (entry) =>
    !!(entry && Array.isArray(entry.site) && entry.site.includes('github'));

  // Red-line forbidden / non-existent tags — must never appear in a github draft.
  const FORBIDDEN_TAGS = new Set([
    'admin-ui',
    'design-token',
    'blogger',
    'download',
    'markdown',
  ]);

  // Admin flow input: a github tech-note using registry-valid category + tags
  // (tech-note category site=[github,blogger]; github/vite tags site=[github]).
  const githubDraftInput = {
    site: 'github',
    contentKind: 'tech-note',
    primaryPlatform: 'github',
    title: 'GitHub 技術文 draft 契約橋接測試',
    titleEn: 'GitHub Draft Contract Bridge Test',
    slug: 'admin-github-draft-contract-bridge',
    date: '2026-07-01',
    category: 'tech-note',
    tags: 'github, vite',
    description: 'Admin flow 產生的 github tech-note draft，用於驗證 GitHub draft metadata contract。',
  };
  const bridgeFm = matter(buildPostMarkdown(githubDraftInput)).data;

  check('166 bridge: Admin github draft parses to a plain frontmatter object', () => {
    assert.ok(
      bridgeFm && typeof bridgeFm === 'object' && !Array.isArray(bridgeFm),
      'frontmatter 應為物件'
    );
  });

  check('167 bridge: site / primaryPlatform / contentKind are github tech-note', () => {
    assert.equal(bridgeFm.site, 'github');
    assert.equal(bridgeFm.primaryPlatform, 'github');
    assert.equal(bridgeFm.contentKind, 'tech-note');
  });

  check('168 bridge: category is registry-bound and site[] includes github', () => {
    assert.ok(
      typeof bridgeFm.category === 'string' && bridgeFm.category.trim() !== '',
      'category 應為非空字串'
    );
    const entry = resolveEntry(categories, bridgeFm.category);
    assert.ok(entry, `category "${bridgeFm.category}" 不存在於 categories.json registry`);
    assert.ok(
      siteIncludesGithub(entry),
      `category "${bridgeFm.category}" 之 site[] 未含 github（實得 ${JSON.stringify(entry.site)}）`
    );
  });

  check('169 bridge: tags is a non-empty array', () => {
    assert.ok(
      Array.isArray(bridgeFm.tags) && bridgeFm.tags.length > 0,
      `tags 應為非空陣列（實得 ${JSON.stringify(bridgeFm.tags)}）`
    );
  });

  check('170 bridge: every tag is registry-bound and site[] includes github', () => {
    for (const t of bridgeFm.tags ?? []) {
      const entry = resolveEntry(tagsRegistry, t);
      assert.ok(entry, `tag "${t}" 不存在於 tags.json registry`);
      assert.ok(
        siteIncludesGithub(entry),
        `tag "${t}" 之 site[] 未含 github（實得 ${JSON.stringify(entry.site)}）`
      );
    }
  });

  check('171 bridge: no forbidden / non-existent tag is used', () => {
    for (const t of bridgeFm.tags ?? []) {
      assert.ok(
        !FORBIDDEN_TAGS.has(t),
        `tag "${t}" 屬紅線禁用 / 不存在 tag，不得用於 github draft`
      );
    }
  });

  check('172 bridge: status/draft contract consistent (status draft ⇔ draft true)', () => {
    assert.equal(bridgeFm.status, 'draft');
    assert.equal(bridgeFm.draft, true);
  });

  check('173 bridge: publishTargets.github.enabled === true', () => {
    assert.equal(bridgeFm.publishTargets?.github?.enabled, true);
  });

  check('174 bridge: publishTargets.blogger.enabled is not true', () => {
    assert.notEqual(bridgeFm.publishTargets?.blogger?.enabled, true);
  });
}

// Phase 20260701-admin-category-select-site-aware-options-a:
//   Lock the category <select>'s new site-aware behaviour, alongside the
//   registry-bound-select invariant already pinned by #156-157. Dean's spec:
//   switching #npd-site rebuilds #npd-category to only the categories the target
//   site allows (github → tech-note; blogger → its own set), and a selection
//   that is invalid for the new site falls back to that site's FIRST available
//   category. The control never becomes free text (no <input>, no datalist), and
//   the tag datalist stays site-aware (no regression). Pure EJS source string
//   scan; no DOM, no headless browser (mirrors the tag-picker guard #111).
function readAdminEjsSrc() {
  const here = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(here, '..', 'views', 'admin', 'index.ejs'), 'utf8');
}

check('175 admin index.ejs category <select> server options filter to default github site', () => {
  const block = extractCategoryTdBlock();
  // Control stays a registry-bound <select>, not a free-text input (re-lock the
  // control model alongside the new site-aware option loop).
  assert.ok(
    block.includes('<select id="npd-category"'),
    '#npd-category MUST stay a <select> (registry-bound)'
  );
  assert.ok(
    block.indexOf('<input id="npd-category"') < 0,
    '#npd-category MUST NOT become a free-text <input>'
  );
  assert.ok(
    !/list=/.test(block) && !block.includes('<datalist'),
    'category <td> MUST NOT adopt the tags-style datalist model'
  );
  // Server-side option loop default-filters to github so a fresh GitHub draft is
  // never offered a Blogger-only category (book-review / download / life-note).
  assert.ok(
    /npdCatDefaultSite\s*=\s*'github'/.test(block),
    'category server loop MUST default-filter to github (npdCatDefaultSite)'
  );
  assert.ok(
    /indexOf\(npdCatDefaultSite\)\s*<\s*0/.test(block),
    'category server loop MUST skip categories whose site[] excludes the default site'
  );
  // The empty "先不填" placeholder is intentionally gone (site-aware model always
  // auto-selects a real category); it must not silently return.
  assert.ok(
    block.indexOf('<option value="">') < 0,
    'category <select> MUST NOT reintroduce an empty <option value=""> (auto-select first available)'
  );
});

check('176 admin index.ejs inline renderCategoryOptions(site) is site-aware with first-available fallback', () => {
  const src = readAdminEjsSrc();
  const sig = 'function renderCategoryOptions(';
  const sigPos = src.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain `function renderCategoryOptions(`');
  assert.ok(
    src.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one `function renderCategoryOptions(`'
  );
  assert.ok(
    /REGISTRY_SNAPSHOT\.categories/.test(src),
    'renderCategoryOptions MUST source options from REGISTRY_SNAPSHOT.categories'
  );
  assert.ok(
    /sites\.indexOf\(picked\)\s*<\s*0/.test(src),
    'renderCategoryOptions MUST skip categories whose site[] excludes the selected site'
  );
  assert.ok(
    /CAT_EL\.innerHTML\s*=/.test(src),
    'renderCategoryOptions MUST rewrite CAT_EL.innerHTML (rebuild the <select> options, not a datalist)'
  );
  assert.ok(
    /stillValid\s*\?\s*prev\s*:\s*\(available\.length\s*\?\s*available\[0\]\.id/.test(src),
    'renderCategoryOptions MUST preserve a still-valid selection else fall back to the first available category'
  );
});

check('177 admin index.ejs renderCategoryOptions wired to #npd-site change + init; tag site-aware not regressed', () => {
  const src = readAdminEjsSrc();
  assert.ok(
    /SITE_EL\.addEventListener\(\s*'change'\s*,\s*function\s*\(\s*\)\s*\{\s*renderCategoryOptions\(SITE_EL\.value\)/.test(src),
    'renderCategoryOptions MUST be wired to #npd-site `change` (re-scope categories on site switch)'
  );
  assert.ok(
    /\n\s*renderCategoryOptions\(SITE_EL\.value\);/.test(src),
    'renderCategoryOptions(SITE_EL.value) MUST be called once at init (first paint github-scoped)'
  );
  assert.ok(
    /name:\s*c\.name\s*\|\|\s*''/.test(src),
    'NPD_REGISTRY categories snapshot MUST include name (for the client <option> label)'
  );
  // No regression: the tag datalist stays site-aware (renderTagOptions intact +
  // wired), so the two site-aware controls coexist.
  assert.ok(
    src.includes('function renderTagOptions('),
    'tag datalist site-aware renderTagOptions MUST remain (no regression)'
  );
  assert.ok(
    /SITE_EL\.addEventListener\(\s*'change'\s*,\s*function\s*\(\s*\)\s*\{\s*renderTagOptions\(SITE_EL\.value\)/.test(src),
    'renderTagOptions MUST remain wired to #npd-site change (no regression)'
  );
});

// Phase 20260701-admin-primary-platform-auto-follow-site-a:
//   #178-179 pin primaryPlatform auto-follow-site. Before this slice #npd-primary
//   kept its independent default (github) when #npd-site switched to blogger, so
//   a fresh blogger draft silently exported primaryPlatform: github. The new
//   syncPrimaryToSite(site) helper mirrors #npd-primary onto the selected site
//   (github → github, blogger → blogger) on every change + at init, while leaving
//   the site-aware category <select> (#175-177) and tag datalist (#111) intact.
//   Static EJS source scan; no DOM / headless browser (mirrors #111 / #176-177).
check('178 admin index.ejs syncPrimaryToSite mirrors #npd-primary onto the selected site', () => {
  const src = readAdminEjsSrc();
  const sig = 'function syncPrimaryToSite(';
  const sigPos = src.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain `function syncPrimaryToSite(`');
  assert.ok(
    src.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one `function syncPrimaryToSite(`'
  );
  // Identity map: PRIM_EL.value becomes the chosen site (github→github,
  // blogger→blogger), guarded so an unknown site falls back to github rather
  // than writing a bogus primaryPlatform.
  assert.ok(
    /PRIM_EL\.value\s*=\s*VALID_SITES\.indexOf\(site\)\s*>=\s*0\s*\?\s*site\s*:\s*'github'/.test(src),
    'syncPrimaryToSite MUST set PRIM_EL.value to the selected site (github→github / blogger→blogger) with a github fallback'
  );
  // No new egress: the follow is a plain <select> value assignment, not a write
  // path — #npd-primary stays a manual <select> (no fetch / XHR introduced here).
  assert.ok(
    /if\s*\(!PRIM_EL\)\s*return;/.test(src),
    'syncPrimaryToSite MUST no-op when #npd-primary is absent (defensive guard)'
  );
});

check('179 admin index.ejs syncPrimaryToSite wired to #npd-site change + init; category/tag site-aware not regressed', () => {
  const src = readAdminEjsSrc();
  assert.ok(
    /SITE_EL\.addEventListener\(\s*'change'\s*,\s*function\s*\(\s*\)\s*\{\s*syncPrimaryToSite\(SITE_EL\.value\)/.test(src),
    'syncPrimaryToSite MUST be wired to #npd-site `change` (follow primaryPlatform on site switch)'
  );
  assert.ok(
    /\n\s*syncPrimaryToSite\(SITE_EL\.value\);/.test(src),
    'syncPrimaryToSite(SITE_EL.value) MUST be called once at init (first paint site-aligned)'
  );
  // No regression: the site-aware category <select> stays wired (#175-177) and
  // the tag datalist stays site-aware (#111) — all three coexist under #npd-site.
  assert.ok(
    /SITE_EL\.addEventListener\(\s*'change'\s*,\s*function\s*\(\s*\)\s*\{\s*renderCategoryOptions\(SITE_EL\.value\)/.test(src),
    'category <select> site-aware wiring MUST remain (renderCategoryOptions change handler; no regression)'
  );
  assert.ok(
    /SITE_EL\.addEventListener\(\s*'change'\s*,\s*function\s*\(\s*\)\s*\{\s*renderTagOptions\(SITE_EL\.value\)/.test(src),
    'tag datalist site-aware wiring MUST remain (renderTagOptions change handler; no regression)'
  );
});

// Phase 20260701-admin-ready-gap-report-copy-slice-a:
//   buildReadyGapReport — plain-text, clipboard-only Ready-gap digest for the
//   "Copy ready-gap report" button. These cases lock:
//     - required fields (site / contentKind / title / slug / filename /
//       targetPath) + draft-contract reminder appear in the report
//     - blocking / soft warnings / contentKind hints / registry hints surface
//     - empty sections render 「無」 (never blank)
//     - read-only invariant (never flips export off status:"draft" + draft:true)
//     - the UI button lives inside the Ready preflight panel
//     - clipboard-only (no fs write / fetch / XHR / sendBeacon / credentials)
//     - existing Copy markdown / Download / target path / validation command +
//       category site-aware / tag datalist site-aware / primaryPlatform
//       auto-follow are NOT regressed
//     - client inline mirror parity with the server helper
function readyGapEjsSrc() {
  const here = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(here, '..', 'views', 'admin', 'index.ejs'), 'utf8');
}

check('180 buildReadyGapReport happy ready-candidate → required fields + draft contract present', () => {
  const rep = buildReadyGapReport({ ...readyHappy, body: '## 正文\n\n實際撰寫的內容。' }, REGS);
  assert.ok(rep.includes('=== ' + READY_GAP_REPORT_HEADER + ' ==='), 'report MUST carry the header');
  assert.ok(rep.includes('summary: ready-candidate'), 'summary line MUST reflect analyzeReadyGap');
  assert.ok(rep.includes('site: github'));
  assert.ok(rep.includes('contentKind: tech-note'));
  assert.ok(rep.includes('title: 測試標題'));
  assert.ok(rep.includes('slug: test-post'));
  assert.ok(rep.includes('filename: 2026-06-27-test-post.md'));
  assert.ok(rep.includes('targetPath: content/github/posts/2026-06-27-test-post.md'));
  assert.ok(rep.includes(READY_GAP_DRAFT_CONTRACT), 'draft-contract reminder MUST be present verbatim');
  assert.ok(rep.includes('status:"draft" + draft:true'), 'contract MUST state export stays draft');
  // ready-candidate fixture (with body) has nothing blocking / warning.
  assert.ok(/\[Blocking（ready 前必補）\]\n無/.test(rep), 'no blocking → 無');
  assert.ok(/\[Soft warnings（建議補；不擋 ready）\]\n無/.test(rep), 'no warnings → 無');
});

check('181 buildReadyGapReport surfaces blocking + soft warnings + registry hints', () => {
  const rep = buildReadyGapReport(
    {
      site: 'github',
      contentKind: 'tech-note',
      title: 'T',
      slug: 'ok-slug',
      date: '2026-06-27',
      category: 'made-up-cat',
      tags: 'made-up-tag',
      description: '',
      cover: '',
      searchDescription: '',
    },
    REGS
  );
  assert.ok(rep.includes('summary: keep-draft'));
  // blocking: description + cover (labels from READY_FIELD_LABELS)
  assert.ok(rep.includes('- description（SEO 摘要'), 'blocking MUST list description');
  assert.ok(rep.includes('- cover（封面圖'), 'blocking MUST list cover');
  // soft warning: empty searchDescription
  assert.ok(rep.includes('- searchDescription 空'), 'warnings MUST list searchDescription');
  // registry hints: unknown category + unknown tag
  assert.ok(rep.includes('unknown-category warning'), 'registry hints MUST flag unknown category');
  assert.ok(rep.includes('unknown-tag warning'), 'registry hints MUST flag unknown tag');
});

check('182 buildReadyGapReport never renders a blank line directly under a section header', () => {
  // Empty sections MUST show 「無」, never blank — check across several states.
  const HEADERS = [
    '[Blocking（ready 前必補）]',
    '[Soft warnings（建議補；不擋 ready）]',
    '[contentKind 提示]',
    '[registry 對齊提示]',
  ];
  const fixtures = [
    null,
    undefined,
    {},
    { ...readyHappy, body: '## 正文\n\n內容。' },
    { ...readyHappy, contentKind: 'download' },
    { site: 'github', category: 'made-up', tags: 'a,b', title: '', slug: '', date: '' },
  ];
  for (const inp of fixtures) {
    const rep = buildReadyGapReport(inp, REGS);
    for (const header of HEADERS) {
      const idx = rep.indexOf(header + '\n');
      assert.ok(idx >= 0, 'report MUST contain section header ' + header);
      const firstLine = rep.slice(idx + header.length + 1).split('\n')[0];
      assert.notEqual(
        firstLine.trim(),
        '',
        header + ' MUST render content (無 when empty), never a blank line (input: ' + JSON.stringify(inp) + ')'
      );
    }
  }
});

check('183 buildReadyGapReport empty title / slug / filename / targetPath → 無 (not blank)', () => {
  const rep = buildReadyGapReport(
    { site: 'github', contentKind: 'tech-note', title: '', slug: 'BAD SLUG', date: 'nope' },
    REGS
  );
  assert.ok(rep.includes('title: 無'), 'empty title → 無');
  assert.ok(rep.includes('slug: 無'), 'invalid slug → 無');
  assert.ok(rep.includes('filename: 無'), 'no filename → 無');
  assert.ok(rep.includes('targetPath: 無'), 'no targetPath → 無');
});

check('184 buildReadyGapReport unsupported contentKind download surfaces in contentKind hints', () => {
  const rep = buildReadyGapReport(
    { ...readyHappy, contentKind: 'download', body: '## x\n\ny' },
    REGS
  );
  assert.ok(rep.includes('summary: keep-draft'));
  assert.ok(/\[contentKind 提示\]\n- download：/.test(rep), 'download hint MUST be listed with reason');
  assert.ok(rep.includes('download contentKind 需'), 'reason text MUST be included');
});

check('185 buildReadyGapReport null / undefined → no throw; draft contract + empty sections 無', () => {
  for (const v of [null, undefined]) {
    assert.doesNotThrow(() => buildReadyGapReport(v));
    const rep = buildReadyGapReport(v);
    assert.ok(rep.includes('status:"draft" + draft:true'));
    assert.ok(rep.includes('site: github'), 'site falls back to github');
    assert.ok(rep.includes('[contentKind 提示]\n無'));
    assert.ok(rep.includes('[registry 對齊提示]\n無'));
  }
});

check('186 buildReadyGapReport does not alter buildPostMarkdown output (status stays draft)', () => {
  const inputs = [
    readyHappy,
    { ...readyHappy, contentKind: 'download' },
    { ...readyHappy, status: 'ready', draft: false },
    {},
    null,
  ];
  for (const inp of inputs) {
    buildReadyGapReport(inp, REGS);
    const d = matter(buildPostMarkdown(inp)).data;
    assert.equal(d.status, 'draft', 'status must remain draft after building the report');
    assert.equal(d.draft, true, 'draft must remain true after building the report');
  }
});

check('187 buildReadyGapReport registries optional → no throw; registry section 無', () => {
  // Omit registries entirely — analyzeRegistryHints yields no hints → 無.
  const rep = buildReadyGapReport({ ...happy, category: 'made-up', tags: 'made-up' });
  assert.ok(rep.includes('[registry 對齊提示]\n無'), 'no registries → registry hints 無');
});

check('188 admin index.ejs Copy ready-gap report button lives inside the Ready preflight panel', () => {
  const src = readyGapEjsSrc();
  const panelStart = src.indexOf('class="npd-ready-preflight"');
  assert.ok(panelStart > 0, 'index.ejs MUST contain the Ready preflight panel');
  // Panel scan ends at the next major IA-shell section marker after it.
  const panelEnd = src.indexOf('Phase 20260615-night-1-admin-ia-shell-implementation-a', panelStart);
  assert.ok(panelEnd > panelStart, 'panel scan boundary MUST resolve');
  const panel = src.slice(panelStart, panelEnd);
  assert.ok(panel.includes('id="npd-copy-gap"'), 'button #npd-copy-gap MUST live in the Ready preflight panel');
  assert.ok(panel.includes('Copy ready-gap report'), 'button label MUST read "Copy ready-gap report"');
});

check('189 admin index.ejs Copy ready-gap report is clipboard-only (reuses copyTextToClipboard; no transport / credentials)', () => {
  const src = readyGapEjsSrc();
  // Handler wiring: clipboard-only via the vetted helper + shared input reader.
  assert.ok(src.includes("COPY_GAP_BTN.addEventListener('click'"), 'gap button MUST be wired');
  assert.ok(
    /copyTextToClipboard\(buildReadyGapReport\(readInput\(\)\), '已複製 ready-gap report'\)/.test(src),
    'gap handler MUST copy buildReadyGapReport(readInput()) via copyTextToClipboard (clipboard-only)'
  );
  assert.ok(src.includes('function readInput()'), 'readInput() MUST exist as the shared form reader');
  assert.ok(src.includes('var input = readInput();'), 'recompute() MUST read form state via readInput()');
  // No network transport / credential constant anywhere in the Admin surface.
  const files = ADMIN_SURFACE_FILES();
  const transport = /\b(fetch|XMLHttpRequest|axios|WebSocket|EventSource)\s*\(|\.sendBeacon\s*\(|navigator\s*\.\s*sendBeacon/;
  const credential = /client_secret|access_token|refresh_token|private_key|Authorization\s*:|\bBearer\s+[A-Za-z0-9._-]/;
  for (const { label, src: s } of files) {
    assert.ok(!transport.test(s), label + ' MUST carry no network transport primitive');
    assert.ok(!credential.test(s), label + ' MUST embed no service credential constant');
  }
});

check('190 admin index.ejs client buildReadyGapReport mirrors the server helper', () => {
  const src = readyGapEjsSrc();
  const sig = 'function buildReadyGapReport(input) {';
  const sigPos = src.indexOf(sig);
  assert.ok(sigPos > 0, 'index.ejs MUST contain client `function buildReadyGapReport(input) {`');
  assert.ok(
    src.indexOf(sig, sigPos + sig.length) < 0,
    'index.ejs MUST contain exactly one client buildReadyGapReport (no duplicate)'
  );
  let depth = 0;
  let block = '';
  for (let i = sigPos + sig.length - 1; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { block = src.slice(sigPos, i + 1); break; }
    }
  }
  assert.ok(block, 'client buildReadyGapReport block MUST be brace-balanced');
  // Composes over the same three read-only analyzers as the server helper.
  assert.ok(block.includes('buildExportSummary(input)'), 'client MUST compose buildExportSummary');
  assert.ok(block.includes('analyzeReadyGap(input)'), 'client MUST compose analyzeReadyGap');
  assert.ok(block.includes('analyzeRegistryHints(input, REGISTRY_SNAPSHOT)'), 'client MUST compose analyzeRegistryHints');
  assert.ok(block.includes('READY_GAP_REPORT_HEADER'), 'client MUST use the shared header constant');
  assert.ok(block.includes('READY_GAP_DRAFT_CONTRACT'), 'client MUST push the draft-contract line');
  assert.ok(block.includes('readyGapList'), 'client MUST use readyGapList for section bodies (無 empty-state)');
  assert.ok(block.includes('readyGapNone'), 'client MUST use readyGapNone for scalar 無 empty-state');
  // Header + contract constants must match the server literals byte-for-byte.
  assert.ok(
    src.includes("var READY_GAP_REPORT_HEADER = '" + READY_GAP_REPORT_HEADER + "';"),
    'client header constant MUST equal server READY_GAP_REPORT_HEADER'
  );
  assert.ok(
    src.includes("var READY_GAP_DRAFT_CONTRACT = '" + READY_GAP_DRAFT_CONTRACT + "';"),
    'client contract constant MUST equal server READY_GAP_DRAFT_CONTRACT'
  );
});

check('191 admin index.ejs existing export affordances not regressed by the gap button', () => {
  const src = readyGapEjsSrc();
  assert.ok(src.includes('id="npd-copy"'), 'Copy markdown button MUST remain');
  assert.ok(src.includes('id="npd-download"'), 'Download button MUST remain');
  assert.ok(src.includes('id="npd-copy-path"'), 'Copy target path button MUST remain');
  assert.ok(src.includes('id="npd-copy-cmd"'), 'Copy validation command button MUST remain');
  assert.ok(src.includes("copyTextToClipboard(tp, '已複製 path')"), 'Copy target path handler intact');
  assert.ok(src.includes("copyTextToClipboard(VALIDATION_COMMAND, '已複製指令')"), 'Copy validation command handler intact');
});

check('192 admin index.ejs category / tag / primaryPlatform site-aware wiring not regressed', () => {
  const src = readyGapEjsSrc();
  assert.ok(/renderCategoryOptions\(SITE_EL\.value\)/.test(src), 'category site-aware wiring MUST remain');
  assert.ok(/renderTagOptions\(SITE_EL\.value\)/.test(src), 'tag datalist site-aware wiring MUST remain');
  assert.ok(/syncPrimaryToSite\(SITE_EL\.value\)/.test(src), 'primaryPlatform auto-follow wiring MUST remain');
});

check('193 buildReadyGapReport export contract line always draft (defense-in-depth vs pretend-ready)', () => {
  // Even for an input that pretends to be ready, the report advertises draft.
  const pretend = { ...readyHappy, status: 'ready', draft: false, body: '## 正文\n\n內容。' };
  const rep = buildReadyGapReport(pretend, REGS);
  assert.ok(rep.includes(READY_GAP_DRAFT_CONTRACT));
  assert.ok(rep.includes('status:"draft" + draft:true'));
  // And the export itself still lands draft.
  const d = matter(buildPostMarkdown(pretend)).data;
  assert.equal(d.status, 'draft');
  assert.equal(d.draft, true);
});

console.log(`\n${passed} / ${passed + failed} PASS${failed ? ` (${failed} FAIL)` : ''}`);
process.exit(failed === 0 ? 0 : 1);
