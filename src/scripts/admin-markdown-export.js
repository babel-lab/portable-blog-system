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

// Phase 20260627-admin-ready-preflight-panel-implementation-a:
//   analyzeReadyGap is a read-only hint for the Admin UI Ready preflight panel.
//   It reports what would still be missing / risky if this draft were later
//   manually flipped to status: ready, but does NOT change export output.
//
//   IMPORTANT — safety invariants:
//   - Pure: no fs / fetch / IO; never throws on null / undefined input.
//   - Read-only: caller must not feed result back into buildPostMarkdown()
//     (which always emits status:"draft" + draft:true, per smoke 24).
//   - No ready option introduced; this helper does not influence buildPostMarkdown.
//
//   READY required fields mirror validate-content.js READY_STATUS gate rules
//   most likely to bump baseline if user flipped status:
//     missing-description / missing-category / missing-cover / empty-tags.
//   (title / slug / date are already gated by isExportReady; they are repeated
//   here so the panel can show one consolidated blocking list.)
//
//   Soft warnings mirror non-blocking SEO heuristics (long-* + empty
//   searchDescription / coverAlt).
//
//   Unsupported contentKinds = book-review / download — these require entire
//   sub-schemas (book.*, download.*, affiliate.*) that the Admin form does not
//   collect; the preanalysis (§8) notes flipping them to ready would trigger
//   5–15 extra warnings.
export const READY_UNSUPPORTED_CONTENT_KINDS = ['book-review', 'download'];
export const READY_MAX_TITLE_LEN = 60;
export const READY_MAX_DESCRIPTION_LEN = 160;

const READY_FIELD_LABELS = {
  title: 'title（必填；validator missing-title）',
  slug: 'slug（kebab-case；validator missing-slug）',
  date: 'date（YYYY-MM-DD；validator missing-date / invalid-date-format）',
  description: 'description（SEO 摘要；validator missing-description）',
  category: 'category（須對齊 categories.json；validator missing-category / unknown-category）',
  tags: 'tags（至少 1 個；validator empty-tags）',
  cover: 'cover（封面圖；validator missing-cover）',
};

const READY_WARNING_LABELS = {
  searchDescription: 'searchDescription 空（建議補；不影響 baseline）',
  coverAlt: 'coverAlt 空（建議補；不影響 baseline）',
  titleLength: 'title 長度 > 60（validator long-title soft warning）',
  descriptionLength: 'description 長度 > 160（validator long-description soft warning）',
};

const READY_UNSUPPORTED_REASONS = {
  'book-review':
    'book-review 需 book.title / book.authors / book.publisher / affiliate.* 等欄位；Admin 表單未收集，第一版不建議直接切 ready。',
  download:
    'download contentKind 需 download.fileUrl + listing 策略；Admin 表單未收集，第一版不建議直接切 ready。',
};

export function analyzeReadyGap(input) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const titleRaw = String(safeInput.title == null ? '' : safeInput.title).trim();
  const slugClean = sanitizeSlug(safeInput.slug);
  const dateClean = sanitizeDate(safeInput.date);
  const description = String(safeInput.description == null ? '' : safeInput.description).trim();
  const category = String(safeInput.category == null ? '' : safeInput.category).trim();
  const tags = normalizeTagsInput(safeInput.tags);
  const cover = String(safeInput.cover == null ? '' : safeInput.cover).trim();
  const searchDescription = String(
    safeInput.searchDescription == null ? '' : safeInput.searchDescription
  ).trim();
  const coverAlt = String(safeInput.coverAlt == null ? '' : safeInput.coverAlt).trim();
  const contentKind = typeof safeInput.contentKind === 'string' ? safeInput.contentKind : '';

  const blocking = [];
  if (titleRaw === '') blocking.push({ field: 'title', label: READY_FIELD_LABELS.title });
  if (slugClean === '') blocking.push({ field: 'slug', label: READY_FIELD_LABELS.slug });
  if (dateClean === '') blocking.push({ field: 'date', label: READY_FIELD_LABELS.date });
  if (description === '') {
    blocking.push({ field: 'description', label: READY_FIELD_LABELS.description });
  }
  if (category === '') blocking.push({ field: 'category', label: READY_FIELD_LABELS.category });
  if (tags.length === 0) blocking.push({ field: 'tags', label: READY_FIELD_LABELS.tags });
  if (cover === '') blocking.push({ field: 'cover', label: READY_FIELD_LABELS.cover });

  const warnings = [];
  if (searchDescription === '') {
    warnings.push({ field: 'searchDescription', label: READY_WARNING_LABELS.searchDescription });
  }
  if (coverAlt === '') {
    warnings.push({ field: 'coverAlt', label: READY_WARNING_LABELS.coverAlt });
  }
  if (titleRaw.length > READY_MAX_TITLE_LEN) {
    warnings.push({ field: 'titleLength', label: READY_WARNING_LABELS.titleLength });
  }
  if (description.length > READY_MAX_DESCRIPTION_LEN) {
    warnings.push({ field: 'descriptionLength', label: READY_WARNING_LABELS.descriptionLength });
  }

  const unsupported = [];
  if (READY_UNSUPPORTED_CONTENT_KINDS.includes(contentKind)) {
    unsupported.push({ contentKind, reason: READY_UNSUPPORTED_REASONS[contentKind] });
  }

  const ok = blocking.length === 0 && unsupported.length === 0;
  const summary = ok ? 'ready-candidate' : 'keep-draft';
  return { ok, blocking, warnings, unsupported, summary };
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
  // Phase 20260627-admin-richer-fields-slice-a:
  //   Optional SEO / cover scalars — accepted, trimmed, emitted as YAML strings.
  //   Empty values still emit the key with "" (keeps preview shape stable so the
  //   Ready preflight panel mirrors what would land in content/{site}/posts/*.md).
  //   No upload / no file picker — plain text only (see Admin UI note).
  const searchDescription = String(
    safeInput.searchDescription == null ? '' : safeInput.searchDescription
  ).trim();
  const cover = String(safeInput.cover == null ? '' : safeInput.cover).trim();
  const coverAlt = String(safeInput.coverAlt == null ? '' : safeInput.coverAlt).trim();
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
  lines.push('searchDescription: ' + yamlEscapeScalar(searchDescription));
  lines.push('');
  lines.push('cover: ' + yamlEscapeScalar(cover));
  lines.push('coverAlt: ' + yamlEscapeScalar(coverAlt));
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
