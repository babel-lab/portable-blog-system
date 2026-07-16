#!/usr/bin/env node
// Phase 9-c-1：publishedUrl backfill CLI helper
//
// 用途：
//   作者於 Blogger 後台手動發布文章後，使用本工具回填 publishedUrl 至對應之 .publish.json sidecar。
//   不接 Blogger API；不發布；不預測 URL；不預測 publishedAt；不建立 sidecar。
//
// publishedAt 真值契約（fail-closed）：
//   --url 與 --published-at 皆為 Blogger 平台真值，只能由作者自後台複製提供。
//   --published-at 缺省 → 寫入前 hard-fail（exit 1），**不**回填當下時間、**不**推導 publishYear/publishMonth。
//   依據：docs/publish-json-schema.md §5.4（不得預測、不得回填當下時間）、docs/publish-workflow.md §13、
//        CLAUDE.md §3a Red lines（不得 guess publishedAt）、docs/20260706-blogger-identity-and-backfill-strategy.md。
//
// 設計依據：
//   - docs/publish-workflow.md §13 publishedUrl backfill SOP（Phase 9-b 落地）
//   - docs/publish-json-schema.md §5 blogger 區塊（含 §5.3 publishedUrl 不可預測 / §5.4 publishYear/Month 由 publishedAt 推導）
//   - mirror Phase 8-g-2 之 new-post.js / suggest-series-number.js CLI pattern（process.argv.slice + named flag + stderr-only warning）
//
// Phase 9-c-1 限制：
//   - 不支援 --create-sidecar（若 .publish.json 不存在 → exit 1；提示作者自 content/templates/_sample.publish.json 複製）
//   - 只寫 .publish.json；不寫 .md frontmatter legacy 欄位
//   - 不接 build pipeline / 不修改 normalize chain / 不退場 Phase 8-h legacy fallback
//   - 不解封 Phase 8-g-1 fixture deferred / 不實作 candidate 6

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const USAGE = `Usage: backfill-published-url --url <url> (--id <id> | --slug <slug>) [options]

Backfill Blogger publishedUrl to corresponding .publish.json sidecar.
Designed for use AFTER manually publishing on Blogger backstage.

Required:
  --url <url>              Blogger published URL (http:// or https://)
  --published-at <iso>     Strict ISO 8601 publish timestamp, copied from Blogger backstage
                           (YYYY-MM-DD or YYYY-MM-DDThh:mm[:ss][Z|±hh:mm])
  --id <id>                Post identifier (frontmatter id); OR
  --slug <slug>            Post slug (frontmatter slug)

Optional:
  --blogger-post-id <id>   Blogger internal post ID (numeric string)
  --dry-run                Print plan; do not write
  --force                  Overwrite existing publishedUrl
  --help                   Print this usage

Behavior:
  - Writes only to .publish.json (blogger.publishedUrl / publishedAt / status / publishYear / publishMonth / [bloggerPostId])
  - Does NOT touch .md frontmatter
  - If .publish.json does not exist, exits with error (--create-sidecar is NOT supported in this batch)
  - Atomic write: writes to .tmp then renames
  - Does NOT predict Blogger URLs; --url must be provided by author
  - Rejects --url with surrounding whitespace before any write; the accepted value is
    written verbatim, so it must match the Blogger URL exactly
  - Does NOT predict publishedAt; --published-at must be provided by author (never defaults to now)
  - Rejects non-strict-ISO --published-at (e.g. "2026-05-15 10:00", or a value with
    surrounding whitespace) before any write; the accepted value is written verbatim,
    so it must itself be strict ISO

Examples:
  npm run backfill:url -- --id "20260504-my-post" --url "https://yourblog.blogspot.com/2026/05/my-slug.html" --published-at "2026-05-12T08:30:00+08:00"
  npm run backfill:url -- --slug "my-slug" --url "https://yourblog.blogspot.com/2026/05/my-slug.html" --published-at "2026-05-12T08:30:00+08:00" --dry-run
`;

// ─── flag parsing ───────────────────────────────────────────

export function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    url: null,
    id: null,
    slug: null,
    publishedAt: null,
    bloggerPostId: null,
    dryRun: false,
    force: false,
    help: false,
    unknown: [],
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--url':
        opts.url = args[++i] ?? null;
        break;
      case '--id':
        opts.id = args[++i] ?? null;
        break;
      case '--slug':
        opts.slug = args[++i] ?? null;
        break;
      case '--published-at':
        opts.publishedAt = args[++i] ?? null;
        break;
      case '--blogger-post-id':
        opts.bloggerPostId = args[++i] ?? null;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--force':
        opts.force = true;
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
      default:
        opts.unknown.push(a);
    }
  }
  return opts;
}

// ─── validators ─────────────────────────────────────────────

// publishedUrl 為 Blogger 平台之真值，CLI 逐字寫入 sidecar（見 main 之 newBlogger.publishedUrl）。
// 驗證與寫入必須是同一個字串：先前以 s.trim() 比對 http(s) 前綴，卻回寫未 trim 之原值，使
// " https://…" / "https://…\t" 這類自後台複製時常見之形狀通過驗證，以 exit 0 寫出帶空白之
// blogger.publishedUrl —— 該值不再與 Blogger 上之真實 URL 逐字相同（docs/publish-json-schema.md
// §5.3）。此處於任何寫入前 fail-closed。不 trim 後放行：URL 為作者複製之真值，工具不改寫、
// 不正規化（與 resolvePublishedAt 同一契約）。
export function isHttpUrl(s) {
  if (typeof s !== 'string') return false;
  if (s !== s.trim()) return false;
  return /^https?:\/\//.test(s);
}

function hasBloggerYyyyMmPattern(url) {
  if (typeof url !== 'string') return false;
  return /\/\d{4}\/\d{2}\//.test(url);
}

function isParseableDate(s) {
  if (typeof s !== 'string') return false;
  if (s.trim() === '') return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

// publishedAt 為 Blogger 平台之真值，只能由作者自後台複製提供。
// docs/publish-json-schema.md §5.4：publishedAt 缺少 / 無效時不得預測、不得回填當下時間。
// 回 { ok: true, publishedAt } 或 { ok: false, error: 'missing' | 'unparseable' | 'not-strict-iso' }。
//
// 第二段（padded）：deriveYearMonth 以 trim 後之字串比對，但本函式回傳作者原值且 CLI 逐字寫入
// sidecar。兩者落差使 `\t2026-05-15` / `2026-05-15\n` 這類前後帶空白之值推得非空年月而被接受，
// 寫出之 blogger.publishedAt 卻含空白、本身不符 §5.4 之嚴格 ISO-8601。此處於任何寫入前拒絕，
// 使「凡接受之值本身即嚴格 ISO」與既有「凡接受之值必推得年月」兩不變式同時成立。
// 不 trim 後放行：publishedAt 為作者自後台複製之真值，工具不改寫、不正規化（§5.4）。
//
// 四段式 fail-closed。末段（not-strict-iso）攔截「Date 可解析、但 deriveYearMonth 無法推導年月」
// 之落差值，例如 `2026-05-15 10:00`（空格取代 T）或 `May 15, 2026` —— V8 legacy parser 接受，
// 但 §5.4 之嚴格 ISO-8601 推導會回空字串。若不在此攔截，CLI 會以 exit 0 寫入
// status:"published" + publishYear:"" + publishMonth:""，靜默產生與 publishedUrl 之 /yyyy/mm/
// 不一致之 sidecar（§9.5）。此處收斂為「凡接受之值，deriveYearMonth 必非空」之不變式。
export function resolvePublishedAt(rawPublishedAt) {
  if (typeof rawPublishedAt !== 'string' || rawPublishedAt.trim() === '') {
    return { ok: false, error: 'missing' };
  }
  if (rawPublishedAt !== rawPublishedAt.trim()) {
    return { ok: false, error: 'not-strict-iso' };
  }
  if (!isParseableDate(rawPublishedAt)) {
    return { ok: false, error: 'unparseable' };
  }
  const { year, month } = deriveYearMonth(rawPublishedAt);
  if (year === '' || month === '') {
    return { ok: false, error: 'not-strict-iso' };
  }
  return { ok: true, publishedAt: rawPublishedAt };
}

function isNumericString(s) {
  if (typeof s !== 'string') return false;
  return /^\d+$/.test(s);
}

// 嚴格 ISO-8601：日期（YYYY-MM-DD）+ 可選之時間與 offset（Z 或 ±HH:MM）。
// 全字串比對 → 任何前綴／尾隨垃圾字元皆不匹配。
const ISO_8601_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

// publishYear / publishMonth 取自 publishedAt 字串本身之 YYYY-MM，**不**先換算 UTC。
// 依據 docs/publish-json-schema.md §5.4（年月為 publishedAt「其」年月）與 §5.3.1
// （Blogger URL 之 yyyy/mm 由平台依當地發布月份產生）+ §9.5（URL yyyy/mm 須與年月一致）。
// 換算 UTC 會使含 offset 之時間戳在月份邊界推導出錯誤月份，例如
// 2026-08-01T00:30:00+08:00 會被誤推成 2026/07，與 Blogger 之 /2026/08/ 矛盾。
// 無法解析時回 { year: '', month: '' }（fail-closed；per §5.4 不得預測、不得回填當下時間）。
export function deriveYearMonth(isoStr) {
  const EMPTY = { year: '', month: '' };
  if (typeof isoStr !== 'string') return EMPTY;
  const m = ISO_8601_RE.exec(isoStr.trim());
  if (!m) return EMPTY;
  const [, year, month, day] = m;
  // 曆法存在性驗證：以 Date.UTC 建構後 round-trip 比對，攔截 2026-02-30 這類看似 ISO
  // 但實際不存在之日期。此處僅用於「日期是否存在」，不參與年月推導 → 與執行機器時區無關。
  const probe = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    probe.getUTCFullYear() !== Number(year) ||
    probe.getUTCMonth() !== Number(month) - 1 ||
    probe.getUTCDate() !== Number(day)
  ) {
    return EMPTY;
  }
  return { year, month };
}

function toRel(p) {
  return path.relative(PROJECT_ROOT, p).split(path.sep).join('/');
}

// ─── post discovery ─────────────────────────────────────────

async function findPosts({ id, slug }) {
  const patterns = [
    'content/blogger/posts/**/*.md',
    'content/blogger/pages/**/*.md',
    'content/github/posts/**/*.md',
    'content/github/pages/**/*.md',
  ];
  const files = await fg(patterns, { cwd: PROJECT_ROOT, absolute: true });
  const matches = [];
  for (const file of files) {
    let raw;
    try {
      raw = await fs.readFile(file, 'utf-8');
    } catch (err) {
      continue;
    }
    let parsed;
    try {
      parsed = matter(raw);
    } catch (err) {
      continue;
    }
    const fm = parsed.data || {};
    if (id != null && fm.id === id) {
      matches.push({ file, frontmatter: fm });
    } else if (slug != null && fm.slug === slug) {
      matches.push({ file, frontmatter: fm });
    }
  }
  return matches;
}

// ─── main ───────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  // unknown args → stderr warning（mirror new-post.js 寬鬆容錯）
  for (const a of opts.unknown) {
    process.stderr.write(`[backfill-published-url] WARN: unknown arg ignored: ${a}\n`);
  }

  // ── basic flag validation ──
  if (!opts.url) {
    process.stderr.write('[backfill-published-url] ERROR: --url is required\n');
    process.stderr.write(USAGE);
    return 1;
  }
  if (opts.id == null && opts.slug == null) {
    process.stderr.write('[backfill-published-url] ERROR: --id or --slug is required\n');
    process.stderr.write(USAGE);
    return 1;
  }
  if (opts.id != null && opts.slug != null) {
    process.stderr.write(
      '[backfill-published-url] ERROR: --id and --slug are mutually exclusive\n',
    );
    return 1;
  }
  if (!isHttpUrl(opts.url)) {
    process.stderr.write(
      `[backfill-published-url] ERROR: --url must start with http:// or https:// (got: ${JSON.stringify(opts.url)})\n`,
    );
    process.stderr.write(
      '  The value is written verbatim, so surrounding whitespace is rejected too; re-copy the URL\n' +
        '  from the Blogger backstage without padding.\n',
    );
    process.stderr.write(
      '  See docs/publish-json-schema.md §5.3 / docs/publish-workflow.md §13.\n',
    );
    return 1;
  }
  if (!hasBloggerYyyyMmPattern(opts.url)) {
    process.stderr.write(
      '[backfill-published-url] WARN: --url does not contain /yyyy/mm/ pattern; may not be a Blogger post URL (this is OK for type=="page", continuing)\n',
    );
  }

  const resolvedAt = resolvePublishedAt(opts.publishedAt);
  if (!resolvedAt.ok) {
    if (resolvedAt.error === 'missing') {
      process.stderr.write(
        '[backfill-published-url] ERROR: --published-at is required (Blogger 後台之實際發布時間)\n',
      );
      process.stderr.write(
        '  publishedAt 為 Blogger 平台真值，必須自後台複製；本工具不得回填當下時間。\n',
      );
      process.stderr.write(
        '  See docs/publish-json-schema.md §5.4 / docs/publish-workflow.md §13.\n',
      );
      return 1;
    }
    if (resolvedAt.error === 'not-strict-iso') {
      process.stderr.write(
        `[backfill-published-url] ERROR: --published-at must be strict ISO 8601 (got: ${opts.publishedAt})\n`,
      );
      process.stderr.write(
        '  Expected YYYY-MM-DD or YYYY-MM-DDThh:mm[:ss][Z|±hh:mm] — note the "T" separator.\n',
      );
      process.stderr.write(
        '  The value is written verbatim, so surrounding whitespace is rejected too; other non-ISO\n' +
          '  forms cannot yield publishYear/publishMonth and would write an inconsistent sidecar.\n',
      );
      process.stderr.write(
        '  See docs/publish-json-schema.md §5.4 / docs/publish-workflow.md §13.\n',
      );
      return 1;
    }
    process.stderr.write(
      `[backfill-published-url] ERROR: --published-at is not parseable as a date (got: ${opts.publishedAt})\n`,
    );
    return 1;
  }
  const publishedAt = resolvedAt.publishedAt;

  if (opts.bloggerPostId != null && !isNumericString(opts.bloggerPostId)) {
    process.stderr.write(
      `[backfill-published-url] ERROR: --blogger-post-id must be a numeric string (got: ${opts.bloggerPostId})\n`,
    );
    return 1;
  }

  // ── find post ──
  const matches = await findPosts({ id: opts.id, slug: opts.slug });
  if (matches.length === 0) {
    const ident = opts.id != null ? `id="${opts.id}"` : `slug="${opts.slug}"`;
    process.stderr.write(`[backfill-published-url] ERROR: no post found matching ${ident}\n`);
    return 1;
  }
  if (matches.length > 1) {
    const ident = opts.id != null ? `id="${opts.id}"` : `slug="${opts.slug}"`;
    process.stderr.write(
      `[backfill-published-url] ERROR: multiple posts found matching ${ident}:\n`,
    );
    for (const m of matches) {
      process.stderr.write(`  - ${toRel(m.file)}\n`);
    }
    return 1;
  }

  const post = matches[0];
  const mdFile = post.file;
  const dir = path.dirname(mdFile);
  const ext = path.extname(mdFile);
  const stem = path.basename(mdFile, ext);
  const publishJsonPath = path.join(dir, `${stem}.publish.json`);

  // ── .publish.json must exist（Phase 9-c-1 不支援 --create-sidecar）──
  let publishExists = false;
  try {
    await fs.access(publishJsonPath, fs.constants.F_OK);
    publishExists = true;
  } catch (err) {
    publishExists = false;
  }
  if (!publishExists) {
    process.stderr.write(
      `[backfill-published-url] ERROR: .publish.json does not exist: ${toRel(publishJsonPath)}\n`,
    );
    process.stderr.write(
      '  Note: --create-sidecar is NOT supported in Phase 9-c-1.\n',
    );
    process.stderr.write(
      '  Please create .publish.json manually (copy content/templates/_sample.publish.json as reference), or wait for future batch with sidecar creation support.\n',
    );
    return 1;
  }

  // ── read existing .publish.json ──
  let publishData;
  try {
    const raw = await fs.readFile(publishJsonPath, 'utf-8');
    publishData = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[backfill-published-url] ERROR: failed to read/parse .publish.json: ${toRel(publishJsonPath)}: ${err.message}\n`,
    );
    return 1;
  }

  // ── safety: existing publishedUrl ──
  const existingUrl = publishData?.blogger?.publishedUrl;
  const hasExistingUrl =
    typeof existingUrl === 'string' && existingUrl.trim() !== '';
  if (hasExistingUrl && !opts.force) {
    process.stderr.write(
      `[backfill-published-url] ERROR: existing publishedUrl found: ${existingUrl}\n`,
    );
    process.stderr.write('  Use --force to overwrite.\n');
    return 1;
  }

  // ── safety: legacy frontmatter publishedUrl ──
  const legacyFmUrl = post.frontmatter?.blogger?.publishedUrl;
  if (typeof legacyFmUrl === 'string' && legacyFmUrl.trim() !== '') {
    process.stderr.write(
      `[backfill-published-url] WARN: legacy frontmatter blogger.publishedUrl exists: ${legacyFmUrl}\n`,
    );
    process.stderr.write(
      '  This tool does not automatically clear legacy frontmatter values; please consider manual migration.\n',
    );
  }

  // ── compute new blogger block ──
  const { year, month } = deriveYearMonth(publishedAt);
  const existingBlogger =
    publishData.blogger && typeof publishData.blogger === 'object'
      ? publishData.blogger
      : {};
  const newBlogger = {
    ...existingBlogger,
    publishedUrl: opts.url,
    publishedAt,
    status: 'published',
    publishYear: year,
    publishMonth: month,
  };
  if (opts.bloggerPostId != null) {
    newBlogger.bloggerPostId = opts.bloggerPostId;
  }
  const newPublishData = { ...publishData, blogger: newBlogger };

  // ── summary plan ──
  const summary = {
    post: toRel(mdFile),
    sidecar: toRel(publishJsonPath),
    changes: {
      'blogger.publishedUrl': opts.url,
      'blogger.publishedAt': publishedAt,
      'blogger.status': 'published',
      'blogger.publishYear': year,
      'blogger.publishMonth': month,
    },
  };
  if (opts.bloggerPostId != null) {
    summary.changes['blogger.bloggerPostId'] = opts.bloggerPostId;
  }
  if (hasExistingUrl) {
    summary.changes['(overwriting previous blogger.publishedUrl)'] = existingUrl;
  }

  // ── dry-run ──
  if (opts.dryRun) {
    process.stdout.write('[backfill-published-url] DRY-RUN plan:\n');
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    process.stdout.write('[backfill-published-url] No changes written.\n');
    return 0;
  }

  // ── atomic write ──
  const jsonStr = JSON.stringify(newPublishData, null, 2) + '\n';
  const tmpPath = publishJsonPath + '.tmp';
  try {
    await fs.writeFile(tmpPath, jsonStr, 'utf-8');
    await fs.rename(tmpPath, publishJsonPath);
  } catch (err) {
    try {
      await fs.unlink(tmpPath);
    } catch (_) {
      // ignore cleanup failure
    }
    process.stderr.write(
      `[backfill-published-url] ERROR: write failed: ${err.message}\n`,
    );
    return 1;
  }

  process.stdout.write('[backfill-published-url] OK\n');
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  return 0;
}

// ─── entry ──────────────────────────────────────────────────

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main()
    .then((code) => {
      process.exit(typeof code === 'number' ? code : 0);
    })
    .catch((err) => {
      process.stderr.write(
        `[backfill-published-url] UNEXPECTED ERROR: ${err.stack || err.message || err}\n`,
      );
      process.exit(1);
    });
}
