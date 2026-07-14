#!/usr/bin/env node
// Phase 20260714-A：admin-article-lookup（GitHub 文章唯讀查詢）contract guard / tests。
//
// 範圍 / 邊界：
//   - 全部斷言在 **OS temp 目錄** 建 synthetic fixture tree 上跑；**絕不**碰 production content /
//     dist / settings / gh-pages；temp 目錄於 finally{} 清除。
//   - 只 import 被測模組（admin-article-lookup.js）之唯讀 API + node 讀取 API；**不** build / deploy /
//     dev server / fetch / pull / commit / push；**不**寫 production 檔。
//   - 唯一 write = 寫入自己的 temp fixtures（測試用；隔離於 OS temp、finally 清除）。
//
// 覆蓋（本 session spec §七 之 16 項 + §6 型別不合法 hard-fail + site filter）：
//   1 合法 slug 唯一命中 / 2 找不到 / 3 重複 slug hard-fail / 4 ../ traversal hard-fail /
//   5 Windows-style traversal hard-fail / 6 非法 slug hard-fail / 7 allowlisted root 成功 /
//   8 非 allowlisted path 被拒絕（不掃 settings / pages）/ 9 正確讀出 status 與 boolean draft /
//   10 status⇔draft 矛盾標示（warning-only、exit 0）/ 11 publishing metadata 摘要正確 /
//   12 lookup 不修改檔案內容 / 13 lookup 不修改 mtime + no-write source contract /
//   14 --apply 明確拒絕 / 15 JSON 輸出 deterministic / 16 human 輸出不含 body / secrets。
//
// 執行：`npm run check:admin-article-lookup`（或 `node src/scripts/check-admin-article-lookup.js`）。

import assert from 'node:assert';
import fs from 'node:fs/promises';
import { statSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveArticleBySlug,
  runCli,
  formatArticleLookup,
  validateSlug,
  ALLOWED_CONTENT_ROOTS,
} from './admin-article-lookup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

let pass = 0;
let fail = 0;
const fails = [];
function check(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    fail += 1;
    fails.push(`${name} — ${err.message}`);
    console.error(`[FAIL] ${name}`);
    console.error(`       ${err.message}`);
  }
}
// async variant
async function checkAsync(name, fn) {
  try {
    await fn();
    pass += 1;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    fail += 1;
    fails.push(`${name} — ${err.message}`);
    console.error(`[FAIL] ${name}`);
    console.error(`       ${err.message}`);
  }
}

const SECRET_MARKER = 'TOPSECRET-DO-NOT-LEAK-abc123';

async function buildFixtures(root) {
  const ghPosts = path.join(root, 'content', 'github', 'posts');
  const bgPosts = path.join(root, 'content', 'blogger', 'posts');
  const ghPages = path.join(root, 'content', 'github', 'pages');
  const settings = path.join(root, 'content', 'settings');
  await fs.mkdir(ghPosts, { recursive: true });
  await fs.mkdir(bgPosts, { recursive: true });
  await fs.mkdir(ghPages, { recursive: true });
  await fs.mkdir(settings, { recursive: true });

  // alpha: unique, published/false, body contains a secret marker + long body.
  const alphaPath = path.join(ghPosts, '2026-01-01-alpha-post.md');
  await fs.writeFile(
    alphaPath,
    [
      '---',
      'id: "20260101-alpha-post"',
      'site: "github"',
      'contentKind: "tech-note"',
      'primaryPlatform: "github"',
      'title: "Alpha Post"',
      'slug: "alpha-post"',
      'date: "2026-01-01"',
      'updated: "2026-01-02"',
      'category: "tech-note"',
      'status: "published"',
      'draft: false',
      'publishTargets:',
      '  github:',
      '    enabled: true',
      '    mode: "full"',
      '  blogger:',
      '    enabled: false',
      '    mode: "summary"',
      '---',
      '',
      `body paragraph one ${SECRET_MARKER} and more content here.`,
      'body paragraph two with lots of words to ensure body is not echoed.',
      '',
    ].join('\n'),
    'utf-8',
  );

  // A .fb.md sidecar next to alpha — must be excluded even if it declares a slug.
  await fs.writeFile(
    path.join(ghPosts, '2026-01-01-alpha-post.fb.md'),
    ['---', 'slug: "alpha-post"', '---', '', 'fb promo copy', ''].join('\n'),
    'utf-8',
  );

  // inconsistent: status:ready but draft:true (warning-only inconsistency).
  await fs.writeFile(
    path.join(ghPosts, '2026-01-02-inconsistent-post.md'),
    [
      '---',
      'id: "20260102-inconsistent"',
      'site: "github"',
      'title: "Inconsistent"',
      'slug: "inconsistent-post"',
      'status: "ready"',
      'draft: true',
      '---',
      '',
      'body',
      '',
    ].join('\n'),
    'utf-8',
  );

  // type-invalid: status is a number → hard-fail on lookup.
  await fs.writeFile(
    path.join(ghPosts, '2026-01-04-typebad-post.md'),
    ['---', 'title: "Typebad"', 'slug: "typebad-post"', 'status: 123', 'draft: false', '---', '', 'body', ''].join('\n'),
    'utf-8',
  );

  // parse-failure: frontmatter YAML that throws; raw declares slug:broken-slug.
  await fs.writeFile(
    path.join(ghPosts, '2026-01-05-broken.md'),
    ['---', 'slug: "broken-slug"', 'title: "Broken"', 'badyaml: [1, 2', '---', '', 'body', ''].join('\n'),
    'utf-8',
  );

  // blogger post with publish sidecar.
  await fs.writeFile(
    path.join(bgPosts, '2026-01-03-blogger-post.md'),
    [
      '---',
      'id: "20260103-blogger-post"',
      'site: "blogger"',
      'contentKind: "book-review"',
      'primaryPlatform: "blogger"',
      'title: "Blogger Post"',
      'slug: "blogger-post"',
      'date: "2026-01-03"',
      'category: "book-review"',
      'status: "ready"',
      'draft: false',
      '---',
      '',
      'body',
      '',
    ].join('\n'),
    'utf-8',
  );
  await fs.writeFile(
    path.join(bgPosts, '2026-01-03-blogger-post.publish.json'),
    JSON.stringify(
      {
        blogger: {
          status: 'published',
          publishedUrl: 'https://babel-lab.blogspot.com/2026/01/blogger-post.html',
          publishedAt: '2026-01-03',
          bloggerPostId: '',
        },
        github: { enabled: true, publishedUrl: '' },
      },
      null,
      2,
    ),
    'utf-8',
  );

  // duplicate slug across github + blogger roots.
  await fs.writeFile(
    path.join(ghPosts, '2026-01-06-dup-a.md'),
    ['---', 'title: "Dup A"', 'slug: "dup-slug"', 'status: "ready"', 'draft: false', '---', '', 'body', ''].join('\n'),
    'utf-8',
  );
  await fs.writeFile(
    path.join(bgPosts, '2026-01-06-dup-b.md'),
    ['---', 'title: "Dup B"', 'slug: "dup-slug"', 'status: "ready"', 'draft: false', '---', '', 'body', ''].join('\n'),
    'utf-8',
  );

  // non-allowlisted locations declaring slugs — resolver must NOT find these.
  await fs.writeFile(
    path.join(settings, 'rogue.md'),
    ['---', 'title: "Rogue"', 'slug: "rogue-slug"', 'status: "ready"', 'draft: false', '---', '', 'x', ''].join('\n'),
    'utf-8',
  );
  await fs.writeFile(
    path.join(ghPages, 'page-x.md'),
    ['---', 'title: "Page"', 'slug: "page-slug"', 'status: "ready"', 'draft: false', '---', '', 'x', ''].join('\n'),
    'utf-8',
  );

  return { alphaPath };
}

async function main() {
  // ── static / pure checks (no fixtures) ─────────────────────────────────────
  check('allowlist roots = content/{github,blogger}/posts', () => {
    const rels = ALLOWED_CONTENT_ROOTS.map((r) => r.rel).sort();
    assert.deepStrictEqual(rels, ['content/blogger/posts', 'content/github/posts']);
  });

  check('validateSlug accepts real-world slugs', () => {
    for (const s of ['github-pages-build-preview-workflow', 'we-media-myself2', 'what-is-design-token', 'a']) {
      assert.strictEqual(validateSlug(s).ok, true, `should accept ${s}`);
    }
  });

  check('(4) ../ traversal → invalid-slug/slug-traversal', () => {
    const r = validateSlug('../../etc/passwd');
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'slug-traversal');
  });

  check('(5) Windows-style traversal → invalid-slug', () => {
    const r1 = validateSlug('..\\..\\secret');
    assert.strictEqual(r1.ok, false);
    assert.strictEqual(r1.reason, 'slug-traversal');
    const r2 = validateSlug('a\\b');
    assert.strictEqual(r2.ok, false);
    assert.strictEqual(r2.reason, 'slug-path-separator');
  });

  check('(6) invalid slugs rejected (spaces / caps / url-encoded / leading dash / dot)', () => {
    assert.strictEqual(validateSlug('Not A Slug!').reason, 'slug-format-invalid');
    assert.strictEqual(validateSlug('Alpha').reason, 'slug-format-invalid');
    assert.strictEqual(validateSlug('a%2e%2e').reason, 'slug-url-encoded');
    assert.strictEqual(validateSlug('-lead').reason, 'slug-format-invalid');
    assert.strictEqual(validateSlug('a.b').reason, 'slug-format-invalid');
    assert.strictEqual(validateSlug('').reason, 'slug-missing-or-empty');
  });

  // source no-write contract (part of 13): scan IMPORTS + CALL-SITES, not comments.
  //   (the resolver's boundary comment intentionally names the forbidden APIs, so a naive
  //    substring grep would false-positive on the doc text.)
  check('(13a) resolver imports/calls no write API (no-write contract)', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src', 'scripts', 'admin-article-lookup.js'), 'utf-8');
    const importLines = src.split('\n').filter((l) => /^\s*import\b/.test(l));
    // fs/promises import must bring ONLY readFile.
    const fsImport = importLines.find((l) => l.includes('node:fs/promises'));
    assert.ok(fsImport, 'must import from node:fs/promises');
    assert.ok(/import\s*\{\s*readFile\s*\}\s*from/.test(fsImport), `fs/promises import must be readFile only (got: ${fsImport.trim()})`);
    // must not import any write-infra module.
    for (const bad of ['safe-write', 'admin-write-cli', 'admin-frontmatter-patcher', 'admin-write-whitelist', 'node:fs\'', 'node:fs"']) {
      assert.ok(!importLines.some((l) => l.includes(bad)), `must not import ${bad}`);
    }
    // no fs write CALL patterns anywhere in source.
    assert.ok(!/\b(writeFile|appendFile|mkdir|rename|copyFile|unlink|rmdir)\s*\(/.test(src), 'must not call fs write APIs');
    assert.ok(!/\bfs\.rm\s*\(/.test(src) && !/(^|[^a-zA-Z._])rm\s*\(/.test(src), 'must not call rm()');
    assert.ok(!/patchFrontmatter\s*\(/.test(src), 'must not call patchFrontmatter()');
  });

  // ── fixture-based checks ──────────────────────────────────────────────────
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'admin-article-lookup-test-'));
  console.log(`  tmpRoot=${tmpRoot}`);
  try {
    const { alphaPath } = await buildFixtures(tmpRoot);

    await checkAsync('(1) valid slug unique hit', async () => {
      const r = await resolveArticleBySlug({ slug: 'alpha-post', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true, `should resolve (got ${r.error})`);
      assert.strictEqual(r.article.slug, 'alpha-post');
      assert.strictEqual(r.article.id, '20260101-alpha-post');
      assert.strictEqual(r.article.title, 'Alpha Post');
      assert.strictEqual(r.article.sourcePath, 'content/github/posts/2026-01-01-alpha-post.md');
      assert.strictEqual(r.article.contentRoot, 'github');
    });

    await checkAsync('(2) not found → hard-fail not-found', async () => {
      const r = await resolveArticleBySlug({ slug: 'no-such-slug', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'not-found');
    });

    await checkAsync('(3) duplicate slug → hard-fail not-unique (no silent first-pick)', async () => {
      const r = await resolveArticleBySlug({ slug: 'dup-slug', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'not-unique');
      assert.strictEqual(r.matches.length, 2);
    });

    await checkAsync('(3b) site filter disambiguates duplicate to unique', async () => {
      const r = await resolveArticleBySlug({ slug: 'dup-slug', site: 'github', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true, `should resolve unique within site (got ${r.error})`);
      assert.strictEqual(r.article.contentRoot, 'github');
    });

    await checkAsync('(4b) resolver rejects ../ traversal slug', async () => {
      const r = await resolveArticleBySlug({ slug: '../../etc/passwd', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'invalid-slug');
    });

    await checkAsync('(6b) resolver rejects invalid slug format', async () => {
      const r = await resolveArticleBySlug({ slug: 'Bad Slug', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'invalid-slug');
    });

    await checkAsync('(7) allowlisted root success (github + blogger)', async () => {
      const g = await resolveArticleBySlug({ slug: 'alpha-post', projectRoot: tmpRoot });
      const b = await resolveArticleBySlug({ slug: 'blogger-post', projectRoot: tmpRoot });
      assert.strictEqual(g.ok, true);
      assert.strictEqual(b.ok, true);
      assert.strictEqual(b.article.contentRoot, 'blogger');
    });

    await checkAsync('(8) non-allowlisted path rejected (settings / pages not scanned)', async () => {
      const rogue = await resolveArticleBySlug({ slug: 'rogue-slug', projectRoot: tmpRoot });
      const page = await resolveArticleBySlug({ slug: 'page-slug', projectRoot: tmpRoot });
      assert.strictEqual(rogue.ok, false, 'content/settings must not be scanned');
      assert.strictEqual(rogue.error, 'not-found');
      assert.strictEqual(page.ok, false, 'content/github/pages must not be scanned');
      assert.strictEqual(page.error, 'not-found');
    });

    await checkAsync('(8b) .fb.md sidecar excluded (no false duplicate for alpha-post)', async () => {
      const r = await resolveArticleBySlug({ slug: 'alpha-post', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true, `alpha-post must stay unique despite .fb.md (got ${r.error})`);
    });

    await checkAsync('(9) reads status string + boolean draft correctly', async () => {
      const r = await resolveArticleBySlug({ slug: 'alpha-post', projectRoot: tmpRoot });
      assert.strictEqual(r.article.status, 'published');
      assert.strictEqual(r.article.draft, false);
      assert.strictEqual(typeof r.article.draft, 'boolean');
      assert.strictEqual(r.article.statusDraftConsistent, true);
    });

    await checkAsync('(9b) status/draft type invalid → hard-fail (warning is NOT auto-fixed)', async () => {
      const r = await resolveArticleBySlug({ slug: 'typebad-post', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'status-draft-type-invalid');
    });

    await checkAsync('(10) status⇔draft inconsistency flagged (warning-only; still ok/exit 0)', async () => {
      const r = await resolveArticleBySlug({ slug: 'inconsistent-post', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true, 'inconsistency must NOT hard-fail (warning-only)');
      assert.strictEqual(r.article.statusDraftConsistent, false);
      assert.ok(/矛盾/.test(r.article.statusDraftNote), 'note should describe the contradiction');
    });

    await checkAsync('(11) publishing metadata summary correct (sidecar; safe fields only)', async () => {
      const r = await resolveArticleBySlug({ slug: 'blogger-post', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, true);
      const p = r.article.publishing;
      assert.strictEqual(p.hasSidecar, true);
      assert.strictEqual(p.blogger.status, 'published');
      assert.strictEqual(p.blogger.hasPublishedUrl, true);
      assert.strictEqual(p.blogger.publishedUrl, 'https://babel-lab.blogspot.com/2026/01/blogger-post.html');
      assert.strictEqual(p.blogger.publishedAt, '2026-01-03');
      assert.strictEqual(p.blogger.hasBloggerPostId, false);
      assert.strictEqual(p.github.enabled, true);
    });

    await checkAsync('(parse) frontmatter unparseable for target slug → hard-fail', async () => {
      const r = await resolveArticleBySlug({ slug: 'broken-slug', projectRoot: tmpRoot });
      assert.strictEqual(r.ok, false);
      assert.strictEqual(r.error, 'frontmatter-parse-failed');
    });

    await checkAsync('(12) lookup does not mutate file content', async () => {
      const before = await fs.readFile(alphaPath, 'utf-8');
      await resolveArticleBySlug({ slug: 'alpha-post', projectRoot: tmpRoot });
      await runCli({ argv: ['--slug=alpha-post', '--json'], projectRoot: tmpRoot });
      const after = await fs.readFile(alphaPath, 'utf-8');
      assert.strictEqual(after, before, 'file content must be byte-identical after lookup');
    });

    await checkAsync('(13b) lookup does not change file mtime', async () => {
      const before = statSync(alphaPath).mtimeMs;
      await resolveArticleBySlug({ slug: 'alpha-post', projectRoot: tmpRoot });
      const after = statSync(alphaPath).mtimeMs;
      assert.strictEqual(after, before, 'mtime must be unchanged after read-only lookup');
    });

    await checkAsync('(14) --apply explicitly rejected (not ignored)', async () => {
      const r = await runCli({ argv: ['--slug=alpha-post', '--apply'], projectRoot: tmpRoot });
      assert.strictEqual(r.exit, 2);
      assert.strictEqual(r.result.error, 'apply-not-supported');
      // other write flags also rejected
      const rc = await runCli({ argv: ['--slug=alpha-post', '--commit'], projectRoot: tmpRoot });
      assert.strictEqual(rc.exit, 2);
    });

    await checkAsync('(14b) CLI exit codes: success 0 / not-found 4 / duplicate 5 / invalid 3', async () => {
      assert.strictEqual((await runCli({ argv: ['--slug=alpha-post'], projectRoot: tmpRoot })).exit, 0);
      assert.strictEqual((await runCli({ argv: ['--slug=no-such-slug'], projectRoot: tmpRoot })).exit, 4);
      assert.strictEqual((await runCli({ argv: ['--slug=dup-slug'], projectRoot: tmpRoot })).exit, 5);
      assert.strictEqual((await runCli({ argv: ['--slug=Bad Slug'], projectRoot: tmpRoot })).exit, 3);
      assert.strictEqual((await runCli({ argv: [], projectRoot: tmpRoot })).exit, 2); // missing --slug
    });

    await checkAsync('(15) JSON output deterministic (stable schema/order across runs)', async () => {
      const r1 = await runCli({ argv: ['--slug=alpha-post', '--json'], projectRoot: tmpRoot });
      const r2 = await runCli({ argv: ['--slug=alpha-post', '--json'], projectRoot: tmpRoot });
      assert.strictEqual(r1.stdout, r2.stdout, 'JSON output must be byte-identical across runs');
      const parsed = JSON.parse(r1.stdout);
      assert.strictEqual(parsed.ok, true);
      const keys = Object.keys(parsed.article);
      assert.deepStrictEqual(keys.slice(0, 4), ['slug', 'id', 'title', 'sourcePath'], 'article key order stable');
    });

    await checkAsync('(16) human output contains no body text and no secret marker', async () => {
      const r = await resolveArticleBySlug({ slug: 'alpha-post', projectRoot: tmpRoot });
      const human = formatArticleLookup(r, { json: false });
      assert.ok(!human.includes(SECRET_MARKER), 'human output must not leak secret marker');
      assert.ok(!human.includes('body paragraph'), 'human output must not include article body');
      // json mode likewise omits body
      const jsonOut = formatArticleLookup(r, { json: true });
      assert.ok(!jsonOut.includes(SECRET_MARKER), 'json output must not leak secret marker');
      assert.ok(!jsonOut.includes('body paragraph'), 'json output must not include article body');
    });
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
    console.log('  cleanup: temp dir removed');
  }

  console.log('');
  console.log(`admin-article-lookup contract guard: ${pass} / ${fail}`);
  if (fail > 0) {
    console.log('');
    console.log('Failed:');
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[check-admin-article-lookup] crashed: ${err && err.stack ? err.stack : err}`);
  process.exit(2);
});
