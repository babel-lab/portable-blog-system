// Phase 20260627-admin-markdown-draft-export-implementation-a:
//   Pure ESM helper that builds a markdown string (frontmatter + body) for the
//   Admin UI draft-export surface. Mirrors src/scripts/new-post.js template
//   structure so files produced by the Admin UI pass through validate-content.js
//   without raising additional warnings.
//
// Constraints:
//   - Pure: no fs / fetch / process IO. String assembly only.
//   - Always emits status: "draft" + draft: true (safest zero-warning path
//     per validate-content.js §READY_STATUS rules).
//   - Enums (sites / contentKinds / primaryPlatforms / modes) mirror
//     validate-content.js so the smoke can lock alignment.
//   - YAML scalars are wrapped in double quotes with backslash + double quote
//     escaped; whitespace (CR / LF / TAB / multiple spaces) collapses to a
//     single space so values stay on one line and can never break the document.
//   - Tag input accepts a comma-separated string OR an array; tags are trimmed,
//     deduped (first-seen order preserved), empties dropped.
//   - filename pattern is `{YYYY-MM-DD}-{slug}.md`; date must match
//     /^\d{4}-\d{2}-\d{2}$/ and slug must match the conservative
//     /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/ pattern (no path traversal, no upper,
//     no whitespace, no slashes) or buildPostFilename returns '' to signal the
//     UI to keep the Download button disabled.
//   - This module has a mirror inline in src/views/admin/index.ejs (client
//     script). Keep both in sync — the smoke locks the server-side version.

export const VALID_SITES = ['github', 'blogger'];
export const VALID_CONTENT_KINDS = [
  'post',
  'tech-note',
  'book-review',
  'download',
  'comic',
  'life-note',
  'page',
];
export const VALID_PRIMARY_PLATFORMS = ['github', 'blogger'];
export const VALID_MODES = ['full', 'summary', 'redirect-card'];
export const VALID_SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
export const VALID_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Phase 20260627-admin-markdown-import-checklist-slice2-a:
//   - Manual import flow constants used by both the Admin UI inline client
//     script and the smoke. Kept as constants (not derived) so the smoke
//     can lock the exact string the UI offers as "Copy validation command".
//   - Folder strings are intentionally written as POSIX-style (CLAUDE.md §8).
export const VALIDATION_COMMAND = 'npm run validate:content';
export const TARGET_FOLDERS = {
  github: 'content/github/posts/',
  blogger: 'content/blogger/posts/',
};

function yamlEscapeScalar(raw) {
  const collapsed = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
  const escaped = collapsed.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return '"' + escaped + '"';
}

function normalizeTagsInput(rawTags) {
  let arr;
  if (Array.isArray(rawTags)) {
    arr = rawTags;
  } else if (typeof rawTags === 'string') {
    arr = rawTags.split(',');
  } else {
    arr = [];
  }
  const out = [];
  const seen = new Set();
  for (const t of arr) {
    const s = String(t == null ? '' : t).trim();
    if (s === '') continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function sanitizeSlug(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (s === '') return '';
  if (!VALID_SLUG_RE.test(s)) return '';
  return s;
}

function sanitizeDate(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (s === '') return '';
  if (!VALID_DATE_RE.test(s)) return '';
  return s;
}

function pickEnum(raw, allowed, fallback) {
  if (typeof raw !== 'string') return fallback;
  return allowed.includes(raw) ? raw : fallback;
}

function defaultBody() {
  return [
    '## 簡介',
    '',
    '請從 `##` 開始撰文；frontmatter 的 title 已是文章主 H1。',
    '',
    '## 段落標題範例',
    '',
    '主要內容請放這裡。',
    '',
    '## 結尾段落',
    '',
    '文章結尾...',
    '',
  ].join('\n');
}

export function buildPostFilename(input) {
  const date = sanitizeDate(input && input.date);
  const slug = sanitizeSlug(input && input.slug);
  if (date === '' || slug === '') return '';
  return date + '-' + slug + '.md';
}

// Phase 20260627-admin-markdown-import-checklist-slice2-a:
//   buildTargetFolder / buildTargetPath / isExportReady are additive pure
//   helpers for the manual-import flow block. They never touch fs / fetch
//   and never throw on null / undefined. UI gating (Copy markdown / Download
//   / Copy target path) reads isExportReady(input).ok so the three buttons
//   share a single source of truth for date+slug+title validity.
export function buildTargetFolder(input) {
  const site = pickEnum(input && input.site, VALID_SITES, 'github');
  return TARGET_FOLDERS[site];
}

export function buildTargetPath(input) {
  const filename = buildPostFilename(input);
  if (filename === '') return '';
  return buildTargetFolder(input) + filename;
}

export function isExportReady(input) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const titleRaw = String(safeInput.title == null ? '' : safeInput.title).trim();
  const slugClean = sanitizeSlug(safeInput.slug);
  const dateClean = sanitizeDate(safeInput.date);
  const missing = [];
  if (titleRaw === '') missing.push('title');
  if (slugClean === '') missing.push('slug');
  if (dateClean === '') missing.push('date');
  return { ok: missing.length === 0, missing };
}

export function buildPostMarkdown(input) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const site = pickEnum(safeInput.site, VALID_SITES, 'github');
  const contentKind = pickEnum(safeInput.contentKind, VALID_CONTENT_KINDS, 'tech-note');
  const primaryPlatform = pickEnum(safeInput.primaryPlatform, VALID_PRIMARY_PLATFORMS, site);
  const date = sanitizeDate(safeInput.date);
  const slugClean = sanitizeSlug(safeInput.slug);
  const titleRaw = String(safeInput.title == null ? '' : safeInput.title).trim();
  const description = String(safeInput.description == null ? '' : safeInput.description);
  const category = String(safeInput.category == null ? '' : safeInput.category).trim();
  const tags = normalizeTagsInput(safeInput.tags);
  const bodyRaw =
    typeof safeInput.body === 'string' && safeInput.body.trim() !== ''
      ? safeInput.body
      : defaultBody();

  // Missing required scalars get TODO markers so the generated file is obviously
  // incomplete (a user who saves it under content/{site}/posts/ would notice).
  const idStr =
    date !== '' && slugClean !== ''
      ? date.replace(/-/g, '') + '-' + slugClean
      : 'TODO-fill-id';
  const slugForFm = slugClean !== '' ? slugClean : 'TODO-fill-slug';
  const dateForFm = date !== '' ? date : 'TODO-fill-date';
  const titleForFm = titleRaw !== '' ? titleRaw : 'TODO-fill-title';

  const tagsBlock =
    tags.length === 0
      ? 'tags: []'
      : 'tags:\n' + tags.map((t) => '  - ' + yamlEscapeScalar(t)).join('\n');

  const lines = [];
  lines.push('---');
  lines.push('id: ' + yamlEscapeScalar(idStr));
  lines.push('site: ' + yamlEscapeScalar(site));
  lines.push('contentKind: ' + yamlEscapeScalar(contentKind));
  lines.push('primaryPlatform: ' + yamlEscapeScalar(primaryPlatform));
  lines.push('');
  lines.push('title: ' + yamlEscapeScalar(titleForFm));
  lines.push('titleEn: ""');
  lines.push('slug: ' + yamlEscapeScalar(slugForFm));
  lines.push('');
  lines.push('date: ' + yamlEscapeScalar(dateForFm));
  lines.push('updated: ' + yamlEscapeScalar(dateForFm));
  lines.push('author: "Dean"');
  lines.push('');
  lines.push(category !== '' ? 'category: ' + yamlEscapeScalar(category) : 'category: ""');
  lines.push(tagsBlock);
  lines.push('');
  lines.push('description: ' + yamlEscapeScalar(description));
  lines.push('searchDescription: ""');
  lines.push('');
  lines.push('cover: ""');
  lines.push('coverAlt: ""');
  lines.push('');
  lines.push('status: "draft"');
  lines.push('draft: true');
  lines.push('');
  lines.push('canonical: "auto"');
  lines.push('');
  lines.push('publishTargets:');
  lines.push('  github:');
  lines.push('    enabled: ' + (site === 'github' ? 'true' : 'false'));
  lines.push('    mode: "full"');
  lines.push('  blogger:');
  lines.push('    enabled: ' + (site === 'blogger' ? 'true' : 'false'));
  lines.push('    mode: ' + (site === 'blogger' ? '"full"' : '"summary"'));
  lines.push('');
  lines.push('blocks:');
  lines.push('  toc: false');
  lines.push('  adsenseTop: true');
  lines.push('  adsenseMiddle: false');
  lines.push('  adsenseBottom: true');
  lines.push('  hashtags: true');
  lines.push('  socialFollow: true');
  lines.push('  relatedPosts: true');
  lines.push('  sidebar: true');
  lines.push('---');
  lines.push('');
  lines.push(bodyRaw);
  if (!bodyRaw.endsWith('\n')) lines.push('');
  return lines.join('\n');
}
