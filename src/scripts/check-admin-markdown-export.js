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
import matter from 'gray-matter';
import {
  buildPostMarkdown,
  buildPostFilename,
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

console.log(`\n${passed} / ${passed + failed} PASS${failed ? ` (${failed} FAIL)` : ''}`);
process.exit(failed === 0 ? 0 : 1);
