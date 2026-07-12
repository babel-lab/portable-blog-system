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

// Phase 20260701-admin-slug-suggestion-helper-slice-a:
//   Pure helper that proposes a kebab-case slug from titleEn / title. Never
//   writes, never influences export; UI uses it read-only for display + a
//   Copy button. Returns { suggested, source } where source is
//   'titleEn' | 'title' | 'none'.
//
// Rules (mirrored by the client inline helper in src/views/admin/index.ejs):
//   - Try titleEn first; if titleEn slugifies to non-empty and passes
//     VALID_SLUG_RE and length <= SLUG_MAX_LEN → source: 'titleEn'.
//   - Else try title; same criteria → source: 'title'.
//   - Else → { suggested: '', source: 'none' }.
//   - CJK / non-ASCII characters are DROPPED (no pinyin, no romanization).
//     If both title and titleEn slugify to '', returns 'none'.
//   - Output never contains a date, never contains '.md', never contains '/'.
//   - Output is a suggestion only. Never influences buildPostFilename /
//     buildTargetPath / isExportReady / analyzeReadyGap / buildPostMarkdown.
export const SLUG_MAX_LEN = 80;

function slugifyForSuggestion(raw) {
  const stripped = String(raw == null ? '' : raw)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (stripped === '') return '';
  let capped = stripped;
  if (capped.length > SLUG_MAX_LEN) {
    capped = capped.slice(0, SLUG_MAX_LEN);
    const lastHyphen = capped.lastIndexOf('-');
    if (lastHyphen > 0) capped = capped.slice(0, lastHyphen);
    capped = capped.replace(/^-+|-+$/g, '');
  }
  if (capped === '') return '';
  if (!VALID_SLUG_RE.test(capped)) return '';
  return capped;
}

// Phase 20260702-admin-slug-suggestion-title-ascii-only-fallback-slice-a:
//   Title fallback MUST NOT strip CJK / non-ASCII characters to expose stray
//   ASCII fragments (e.g. `我的測試PO文` → `po`, `什麼是Design Token?` →
//   `design-token`). Those fragments are semantically weak and mislead the
//   author. If title contains ANY non-ASCII code point, skip the title branch
//   and return `{ '', 'none' }` — the UI then shows the "填 titleEn / 手動
//   輸入" guidance. titleEn's own slugify path is unchanged (titleEn is
//   author-authored English by intent; stray non-ASCII there stays permissive).
const NON_ASCII_RE = /[^\x00-\x7f]/;
function containsNonAscii(raw) {
  return NON_ASCII_RE.test(String(raw == null ? '' : raw));
}

export function suggestSlugFromTitle(input) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const titleEnRaw = String(safeInput.titleEn == null ? '' : safeInput.titleEn);
  const titleRaw = String(safeInput.title == null ? '' : safeInput.title);
  const candidateEn = slugifyForSuggestion(titleEnRaw);
  if (candidateEn !== '') return { suggested: candidateEn, source: 'titleEn' };
  // Title fallback requires ASCII-only (no CJK / non-ASCII). Mixed input like
  // `我的測試PO文` would otherwise yield `po`; skip to 'none' instead.
  if (containsNonAscii(titleRaw)) return { suggested: '', source: 'none' };
  const candidate = slugifyForSuggestion(titleRaw);
  if (candidate !== '') return { suggested: candidate, source: 'title' };
  return { suggested: '', source: 'none' };
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
// Phase 20260629-admin-titleEn-length-warning-slice-a:
//   Admin-only advisory ceiling for the optional titleEn field. There is no
//   validate-content.js rule for titleEn length (the .md validator does not
//   check it), so this is a soft Ready-preflight hint only — never blocking,
//   never affects export. Mirrors the title (60) heuristic at a looser 80.
export const READY_MAX_TITLE_EN_LEN = 80;

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
  titleEnLength: 'titleEn 長度 > 80（建議精簡；不擋 ready）',
  bodyDefault: 'body 仍是預設範例，建議改成正式正文；不擋 ready',
  coverAltWithoutCover: 'coverAlt 有值但 cover 空，建議補封面圖或清空 alt；不擋 ready',
  bodySecondH1: 'body 出現另一個 `# ` 一級標題（title 已是頁面 H1，建議改用 `##`）；不擋 ready',
};

const READY_UNSUPPORTED_REASONS = {
  'book-review':
    'book-review 需 book.title / book.authors / book.publisher / affiliate.* 等欄位；Admin 表單未收集，第一版不建議直接切 ready。',
  download:
    'download contentKind 需 download.fileUrl + listing 策略；Admin 表單未收集，第一版不建議直接切 ready。',
};

// Phase 20260627-admin-category-tag-registry-hints-implementation-a:
//   analyzeRegistryHints — read-only registry alignment hint for the Admin UI
//   Ready preflight panel. Mirrors validate-content.js unknown-category /
//   category-site-mismatch / unknown-tag / tag-site-mismatch rules but does
//   NOT block export (Admin export always emits status:"draft" + draft:true).
//
//   IMPORTANT — safety invariants:
//   - Pure: no fs / fetch / IO; never throws on null / undefined input.
//   - registries arg is optional; missing / empty registries → empty hints
//     (caller may pass `undefined` / `null` / `{}` without crashing).
//   - Read-only: never mutates buildPostMarkdown output (status stays draft).
//   - No auto-fix; never suggests adding tags to tags.json (CLAUDE.md §3 red lines).
//
//   Output shape: { hints: [...], hasHints: boolean }
//     where each hint = { kind, field, value, label[, siteAllowed, siteCurrent] }
//
//   kind values:
//     'unknown-category'        — category not found by id-or-slug in categories.json
//     'category-site-mismatch'  — category exists but entry.site[] excludes current site
//     'unknown-tag'             — tag not found by id-or-slug in tags.json
//     'tag-site-mismatch'       — tag exists but entry.site[] excludes current site
//
//   Site comparison rules:
//     - entry.site must be a non-empty array to trigger mismatch check
//       (entry.site = [] is interpreted as "no constraint" → no mismatch)
//     - input.site is normalized via pickEnum so unsupported values fall back to 'github'
export function analyzeRegistryHints(input, registries) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const safeReg = registries && typeof registries === 'object' ? registries : {};
  const cats = Array.isArray(safeReg.categories) ? safeReg.categories : [];
  const tagsReg = Array.isArray(safeReg.tags) ? safeReg.tags : [];

  const site = pickEnum(safeInput.site, VALID_SITES, 'github');
  const category = String(safeInput.category == null ? '' : safeInput.category).trim();
  const tagsList = normalizeTagsInput(safeInput.tags);

  const hints = [];

  if (cats.length > 0 && category !== '') {
    const entry = findRegistryEntry(cats, category);
    if (!entry) {
      hints.push({
        kind: 'unknown-category',
        field: 'category',
        value: category,
        label:
          'category "' + category + '" 不在 categories.json — validator unknown-category warning',
      });
    } else if (
      Array.isArray(entry.site) &&
      entry.site.length > 0 &&
      !entry.site.includes(site)
    ) {
      hints.push({
        kind: 'category-site-mismatch',
        field: 'category',
        value: category,
        siteAllowed: entry.site.slice(0),
        siteCurrent: site,
        label:
          'category "' + category + '" allowed sites=[' +
          entry.site.join(',') + ']，但目前 site=' + site,
      });
    }
  }

  if (tagsReg.length > 0 && tagsList.length > 0) {
    for (const t of tagsList) {
      const entry = findRegistryEntry(tagsReg, t);
      if (!entry) {
        hints.push({
          kind: 'unknown-tag',
          field: 'tags',
          value: t,
          label: 'tag "' + t + '" 不在 tags.json — validator unknown-tag warning',
        });
      } else if (
        Array.isArray(entry.site) &&
        entry.site.length > 0 &&
        !entry.site.includes(site)
      ) {
        hints.push({
          kind: 'tag-site-mismatch',
          field: 'tags',
          value: t,
          siteAllowed: entry.site.slice(0),
          siteCurrent: site,
          label:
            'tag "' + t + '" allowed sites=[' +
            entry.site.join(',') + ']，但目前 site=' + site,
        });
      }
    }
  }

  return { hints, hasHints: hints.length > 0 };
}

function findRegistryEntry(arr, key) {
  if (!Array.isArray(arr) || typeof key !== 'string' || key === '') return null;
  for (const e of arr) {
    if (!e || typeof e !== 'object') continue;
    if (typeof e.id === 'string' && e.id === key) return e;
    if (typeof e.slug === 'string' && e.slug === key) return e;
  }
  return null;
}

// Phase 20260627-admin-draft-markdown-output-usability-slice-a:
//   buildExportSummary — read-only at-a-glance digest of the current Admin
//   draft form state. Mirrors what Dean already needs to track manually
//   (slug / suggested filename / draft status / character counts vs limits)
//   and consolidates it into one shape the inline UI can render top-of-panel.
//
//   IMPORTANT — safety invariants:
//   - Pure: no fs / fetch / IO; never throws on null / undefined input.
//   - Read-only: never mutates buildPostMarkdown output (status:"draft" stays).
//   - No new "ready" option introduced; status / draft remain literal 'draft' / true.
//   - Field limits mirror analyzeReadyGap (READY_MAX_TITLE_LEN /
//     READY_MAX_DESCRIPTION_LEN) so the panel + preflight stay aligned.
//
//   Output shape:
//     {
//       site, contentKind, primaryPlatform,
//       slug,         // sanitized or '' when invalid (matches sanitizeSlug)
//       filename,     // '' when invalid (matches buildPostFilename)
//       targetFolder, // always present (falls back to github folder)
//       targetPath,   // '' when filename invalid
//       status: 'draft', draft: true,
//       ready: { ok, missing },
//       counts: {
//         title, description, searchDescription, coverAlt, tags
//       },
//       limits: { titleMax, descriptionMax }
//     }
export function buildExportSummary(input) {
  const safeInput = input && typeof input === 'object' ? input : {};
  const site = pickEnum(safeInput.site, VALID_SITES, 'github');
  const contentKind = pickEnum(safeInput.contentKind, VALID_CONTENT_KINDS, 'tech-note');
  const primaryPlatform = pickEnum(safeInput.primaryPlatform, VALID_PRIMARY_PLATFORMS, site);
  const slug = sanitizeSlug(safeInput.slug);
  const filename = buildPostFilename(safeInput);
  const targetFolder = buildTargetFolder(safeInput);
  const targetPath = buildTargetPath(safeInput);
  const ready = isExportReady(safeInput);
  const titleRaw = String(safeInput.title == null ? '' : safeInput.title).trim();
  const description = String(safeInput.description == null ? '' : safeInput.description).trim();
  const searchDescription = String(
    safeInput.searchDescription == null ? '' : safeInput.searchDescription
  ).trim();
  const coverAlt = String(safeInput.coverAlt == null ? '' : safeInput.coverAlt).trim();
  // Phase 20260629-admin-titleEn-summary-count-slice-a:
  //   Track titleEn length in the at-a-glance digest, completing the optional
  //   titleEn field's UX parity with title / description / searchDescription /
  //   coverAlt. Read-only count; never affects buildPostMarkdown output or the
  //   titleEn warning rule.
  const titleEn = String(safeInput.titleEn == null ? '' : safeInput.titleEn).trim();
  const tags = normalizeTagsInput(safeInput.tags);
  return {
    site,
    contentKind,
    primaryPlatform,
    slug,
    filename,
    targetFolder,
    targetPath,
    status: 'draft',
    draft: true,
    ready,
    counts: {
      title: titleRaw.length,
      titleEn: titleEn.length,
      description: description.length,
      searchDescription: searchDescription.length,
      coverAlt: coverAlt.length,
      tags: tags.length,
    },
    limits: {
      titleMax: READY_MAX_TITLE_LEN,
      descriptionMax: READY_MAX_DESCRIPTION_LEN,
    },
  };
}

// Phase 20260629-admin-body-second-h1-warning-slice-a:
//   Fence-aware scan for any top-level `# ` ATX heading inside the Markdown
//   body. The frontmatter title already becomes the page H1, so a body
//   `# Heading` doubles up. Lines starting with 3+ backticks / tildes open
//   and close fenced code blocks (CommonMark-style, matching fence character);
//   `# ` lines inside a fence (e.g. shell comments like `# install`) do NOT
//   trigger the warning. Only `# ` at column 0 is treated as a heading —
//   indented 1–3 space ATX (rare in Dean's drafts) is intentionally skipped.
//   `##` / `###` etc. are not matched (they fail the `line[1] === ' '` check).
function hasTopLevelH1OutsideFence(body) {
  const text = String(body == null ? '' : body);
  if (text === '') return false;
  const lines = text.split('\n');
  let inFence = false;
  let fenceChar = '';
  for (const line of lines) {
    const ch0 = line.charAt(0);
    if (inFence) {
      if (ch0 === fenceChar) {
        let n = 0;
        while (n < line.length && line.charAt(n) === fenceChar) n++;
        if (n >= 3) {
          inFence = false;
          fenceChar = '';
        }
      }
      continue;
    }
    if (ch0 === '`' || ch0 === '~') {
      let n = 0;
      while (n < line.length && line.charAt(n) === ch0) n++;
      if (n >= 3) {
        inFence = true;
        fenceChar = ch0;
        continue;
      }
    }
    if (ch0 === '#' && line.charAt(1) === ' ') {
      return true;
    }
  }
  return false;
}

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
  const titleEn = String(safeInput.titleEn == null ? '' : safeInput.titleEn).trim();
  // Phase 20260629-admin-body-default-warning-slice-a:
  //   Effective body trimmed. Empty body falls back to defaultBody() in
  //   buildPostMarkdown, so empty and the untouched scaffold both count as "not
  //   yet written" for the soft warning below.
  const bodyTrim = String(safeInput.body == null ? '' : safeInput.body).trim();
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
  // Phase 20260629-admin-cover-alt-without-cover-warning-slice-a:
  //   coverAlt set while cover is empty — alt text for a non-existent cover.
  //   warning-only consistency hint; the cover-empty case is independently
  //   handled by the cover blocking rule above (this never adds blocking).
  if (cover === '' && coverAlt !== '') {
    warnings.push({ field: 'coverAltWithoutCover', label: READY_WARNING_LABELS.coverAltWithoutCover });
  }
  if (titleRaw.length > READY_MAX_TITLE_LEN) {
    warnings.push({ field: 'titleLength', label: READY_WARNING_LABELS.titleLength });
  }
  if (description.length > READY_MAX_DESCRIPTION_LEN) {
    warnings.push({ field: 'descriptionLength', label: READY_WARNING_LABELS.descriptionLength });
  }
  // Phase 20260629-admin-titleEn-length-warning-slice-a:
  //   titleEn is optional — empty / within-limit raises nothing; only an
  //   over-length value adds a soft warning. Never blocking; never required.
  if (titleEn.length > READY_MAX_TITLE_EN_LEN) {
    warnings.push({ field: 'titleEnLength', label: READY_WARNING_LABELS.titleEnLength });
  }
  // Phase 20260629-admin-body-default-warning-slice-a:
  //   Soft hint when the body is still empty or the untouched defaultBody()
  //   scaffold (Dean forgot to write the post). warning-only — never blocking,
  //   never required, never alters buildPostMarkdown output.
  if (bodyTrim === '' || bodyTrim === defaultBody().trim()) {
    warnings.push({ field: 'bodyDefault', label: READY_WARNING_LABELS.bodyDefault });
  }
  // Phase 20260629-admin-body-second-h1-warning-slice-a:
  //   Fence-aware soft hint for a body-level `# ` ATX heading. warning-only;
  //   never blocking; never alters buildPostMarkdown output. Scans the raw
  //   body (not bodyTrim) so a leading-newline / TAB-prefixed scaffold still
  //   gets the same column-0 fence/heading treatment as a clean body.
  if (hasTopLevelH1OutsideFence(safeInput.body)) {
    warnings.push({ field: 'bodySecondH1', label: READY_WARNING_LABELS.bodySecondH1 });
  }

  const unsupported = [];
  if (READY_UNSUPPORTED_CONTENT_KINDS.includes(contentKind)) {
    unsupported.push({ contentKind, reason: READY_UNSUPPORTED_REASONS[contentKind] });
  }

  const ok = blocking.length === 0 && unsupported.length === 0;
  const summary = ok ? 'ready-candidate' : 'keep-draft';
  return { ok, blocking, warnings, unsupported, summary };
}

// Phase 20260701-admin-ready-gap-report-copy-slice-a:
//   buildReadyGapReport — assembles a plain-text, clipboard-only digest of the
//   New Post Draft Ready preflight state for the "Copy ready-gap report" button.
//   It is pure string composition over the three existing read-only analyzers
//   (buildExportSummary / analyzeReadyGap / analyzeRegistryHints); the report is
//   meant to be copied to the clipboard and pasted into notes — nothing is
//   written to the repo, uploaded, or sent over the network.
//
//   IMPORTANT — safety invariants:
//   - Pure: no fs / fetch / IO; never throws on null / undefined input.
//   - Read-only: never mutates buildPostMarkdown output (export stays
//     status:"draft" + draft:true regardless of what the report says).
//   - Every list section renders the literal 「無」 when empty (never blank) so a
//     pasted report is unambiguous; the status/draft contract line is always
//     present and always states the export stays draft.
//   - This helper has an inline mirror in src/views/admin/index.ejs (client
//     script). Keep both in sync — the smoke locks the server-side version and
//     the client-side presence / parity.
export const READY_GAP_REPORT_HEADER = 'Admin New Post Draft — Ready-gap report';
export const READY_GAP_DRAFT_CONTRACT =
  'status/draft 契約：匯出永遠 status:"draft" + draft:true（Admin 不切 ready / published）';

function readyGapNone(value) {
  const s = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  return s === '' ? '無' : s;
}

function readyGapList(arr, fmt) {
  if (!Array.isArray(arr) || arr.length === 0) return '無';
  return arr.map((item) => '- ' + fmt(item)).join('\n');
}

export function buildReadyGapReport(input, registries) {
  const summary = buildExportSummary(input);
  const gap = analyzeReadyGap(input);
  const reg = analyzeRegistryHints(input, registries);
  const safeInput = input && typeof input === 'object' ? input : {};
  const title = String(safeInput.title == null ? '' : safeInput.title)
    .replace(/\s+/g, ' ')
    .trim();

  const lines = [];
  lines.push('=== ' + READY_GAP_REPORT_HEADER + ' ===');
  lines.push('summary: ' + gap.summary);
  lines.push('site: ' + readyGapNone(summary.site));
  lines.push('contentKind: ' + readyGapNone(summary.contentKind));
  lines.push('title: ' + readyGapNone(title));
  lines.push('slug: ' + readyGapNone(summary.slug));
  lines.push('filename: ' + readyGapNone(summary.filename));
  lines.push('targetPath: ' + readyGapNone(summary.targetPath));
  lines.push(READY_GAP_DRAFT_CONTRACT);
  lines.push('');
  lines.push('[Blocking（ready 前必補）]');
  lines.push(readyGapList(gap.blocking, (b) => b.label));
  lines.push('');
  lines.push('[Soft warnings（建議補；不擋 ready）]');
  lines.push(readyGapList(gap.warnings, (w) => w.label));
  lines.push('');
  lines.push('[contentKind 提示]');
  lines.push(readyGapList(gap.unsupported, (u) => u.contentKind + '：' + u.reason));
  lines.push('');
  lines.push('[registry 對齊提示]');
  lines.push(readyGapList(reg.hints, (h) => h.label));
  return lines.join('\n');
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
  // Phase 20260629-admin-titleEn-passthrough-slice-a:
  //   Optional English title — direct-through field, same convention as
  //   searchDescription / cover / coverAlt: accepted, trimmed, emitted as a
  //   YAML string. Empty value still emits `titleEn: ""` (always-present key,
  //   matches new-post.js template + keeps preview shape stable). Never affects
  //   the required `title` field.
  const titleEn = String(safeInput.titleEn == null ? '' : safeInput.titleEn).trim();
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
  lines.push('titleEn: ' + yamlEscapeScalar(titleEn));
  lines.push('slug: ' + yamlEscapeScalar(slugForFm));
  lines.push('');
  lines.push('date: ' + yamlEscapeScalar(dateForFm));
  lines.push('updated: ' + yamlEscapeScalar(dateForFm));
  lines.push('author: "Babel"');
  lines.push('');
  lines.push('byline:');
  lines.push('  showAuthor: true');
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
