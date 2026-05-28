// Phase 20260527-night-2 Admin Write Infra §15.G Phase 2 CLI self-test
//   - Validates the 5 Admin Write Infra helpers (active-source-keys / admin-write-whitelist /
//     git-status-check / admin-field-validators / safe-write)
//   - Writes ONLY to OS temp directory; never touches production content / dist / settings
//   - Cleans up temp directory in finally{}
//   - Exits non-zero on any failed assertion (for CI / npm script signal)
//
// Usage: npm run safe-write:test
//
// Boundary:
//   - Does NOT touch content/{github,blogger}/posts/**
//   - Does NOT touch content/settings/**
//   - Does NOT touch dist / dist-blogger / gh-pages
//   - Does NOT touch validate:content baseline
//   - Does NOT spawn build / deploy
//   - May spawn `git status --porcelain` (read-only; via git-status-check helper)

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { isWriteAllowed } from './admin-write-whitelist.js';
import { safeWrite } from './safe-write.js';
import { checkGitStatus } from './git-status-check.js';
import { buildActiveSourceKeySet, loadActiveSourceKeySet } from './active-source-keys.js';
import * as fv from './admin-field-validators.js';
import { runCli } from './admin-write-cli.js';
import { patchFrontmatter } from './admin-frontmatter-patcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

let pass = 0;
let fail = 0;
const fails = [];

function assert(label, condition, detail) {
  if (condition) {
    pass += 1;
    process.stdout.write(`  PASS  ${label}\n`);
  } else {
    fail += 1;
    fails.push(label + (detail ? `  (${detail})` : ''));
    process.stdout.write(`  FAIL  ${label}${detail ? '  (' + detail + ')' : ''}\n`);
  }
}

async function existsPath(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  process.stdout.write('[safe-write-test] start\n');
  process.stdout.write(`[safe-write-test] PROJECT_ROOT=${PROJECT_ROOT}\n`);

  // ── 1. admin-write-whitelist ─────────────────────────────────────────
  process.stdout.write('\n[whitelist]\n');
  const okMd = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'github', 'posts', 'foo.md'), PROJECT_ROOT);
  assert('allow github/posts/*.md', okMd.ok === true && okMd.kind === 'post-md', okMd.reason);

  const okPj = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'blogger', 'posts', 'foo.publish.json'), PROJECT_ROOT);
  assert('allow blogger/posts/*.publish.json', okPj.ok === true && okPj.kind === 'publish-json', okPj.reason);

  const okFb = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'blogger', 'posts', 'foo.fb.md'), PROJECT_ROOT);
  assert('allow blogger/posts/*.fb.md', okFb.ok === true && okFb.kind === 'fb-sidecar', okFb.reason);

  const rejSettings = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'settings', 'site.config.json'), PROJECT_ROOT);
  assert('reject content/settings/*', rejSettings.ok === false, rejSettings.reason);

  const rejFixtures = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'validation-fixtures', 'blogger', 'posts', 'x.md'), PROJECT_ROOT);
  assert('reject content/validation-fixtures/**', rejFixtures.ok === false, rejFixtures.reason);

  const rejPages = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'github', 'pages', 'about.md'), PROJECT_ROOT);
  assert('reject github/pages/*', rejPages.ok === false, rejPages.reason);

  const rejDist = isWriteAllowed(path.join(PROJECT_ROOT, 'dist', 'index.html'), PROJECT_ROOT);
  assert('reject dist/**', rejDist.ok === false, rejDist.reason);

  const rejDistBlogger = isWriteAllowed(path.join(PROJECT_ROOT, 'dist-blogger', 'posts', 'x', 'post.html'), PROJECT_ROOT);
  assert('reject dist-blogger/**', rejDistBlogger.ok === false, rejDistBlogger.reason);

  const rejTraversal = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'github', 'posts', '..', '..', '..', 'etc', 'x'), PROJECT_ROOT);
  assert('reject .. traversal', rejTraversal.ok === false, rejTraversal.reason);

  const rejRelative = isWriteAllowed('content/github/posts/x.md', PROJECT_ROOT);
  assert('reject relative path', rejRelative.ok === false, rejRelative.reason);

  const rejPackageLock = isWriteAllowed(path.join(PROJECT_ROOT, 'package-lock.json'), PROJECT_ROOT);
  assert('reject package-lock.json', rejPackageLock.ok === false, rejPackageLock.reason);

  const rejBadExt = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'github', 'posts', 'foo.txt'), PROJECT_ROOT);
  assert('reject non-.md/.publish.json/.fb.md extension', rejBadExt.ok === false, rejBadExt.reason);

  const rejNested = isWriteAllowed(path.join(PROJECT_ROOT, 'content', 'github', 'posts', 'sub', 'foo.md'), PROJECT_ROOT);
  assert('reject nested subfolder under posts/', rejNested.ok === false, rejNested.reason);

  // ── 2. active-source-keys ────────────────────────────────────────────
  process.stdout.write('\n[active-source-keys]\n');
  const loadedSet = await loadActiveSourceKeySet(PROJECT_ROOT);
  assert('loadActiveSourceKeySet returns Set', loadedSet instanceof Set);
  assert('registry has at least 1 active key', loadedSet.size >= 1, `size=${loadedSet.size}`);
  assert('registry contains "blogger"', loadedSet.has('blogger'));
  assert('registry contains "youtube"', loadedSet.has('youtube'));

  const customSet = buildActiveSourceKeySet({
    linkSources: {
      sources: [
        { sourceKey: 'a', isActive: true },
        { sourceKey: 'b', isActive: false },
        { sourceKey: 'c' },
        { sourceKey: '', isActive: true },
        'not-an-object',
        null,
        { sourceKey: 42 },
      ],
    },
  });
  assert('skips isActive:false', !customSet.has('b'));
  assert('defaults isActive missing → active', customSet.has('c'));
  assert('skips empty sourceKey', !customSet.has(''));
  assert('skips non-string sourceKey', !customSet.has(42));
  assert('returns empty Set on undefined settings', buildActiveSourceKeySet(undefined).size === 0);
  assert('returns empty Set on null sources', buildActiveSourceKeySet({ linkSources: { sources: null } }).size === 0);
  assert('returns empty Set on missing linkSources', buildActiveSourceKeySet({}).size === 0);

  // ── 3. admin-field-validators ────────────────────────────────────────
  process.stdout.write('\n[field-validators]\n');
  assert('description accepts normal', fv.validateDescription('Hello, world.').ok === true);
  assert('description rejects non-string', fv.validateDescription(123).ok === false);
  assert('description rejects > 1000 chars', fv.validateDescription('x'.repeat(1001)).ok === false);
  assert('description accepts exactly 1000', fv.validateDescription('x'.repeat(1000)).ok === true);
  assert('description rejects control char', fv.validateDescription('a\x01b').ok === false);
  assert('description accepts tab/lf/cr', fv.validateDescription('a\tb\nc\rd').ok === true);

  assert('searchDescription rejects > 500', fv.validateSearchDescription('x'.repeat(501)).ok === false);
  assert('titleEn rejects > 200', fv.validateTitleEn('x'.repeat(201)).ok === false);
  assert('titleEn accepts empty', fv.validateTitleEn('').ok === true);

  assert('cover rejects non-string', fv.validateCover(null).ok === false);
  assert('coverAlt accepts string', fv.validateCoverAlt('封面圖說明').ok === true);

  assert('kind accepts "internal"', fv.validateRelatedLinkKind('internal').ok === true);
  assert('kind accepts "external"', fv.validateRelatedLinkKind('external').ok === true);
  assert('kind rejects "both"', fv.validateRelatedLinkKind('both').ok === false);
  assert('kind rejects undefined', fv.validateRelatedLinkKind(undefined).ok === false);

  assert('url rejects empty', fv.validateRelatedLinkUrl('').ok === false);
  assert('url rejects whitespace-only', fv.validateRelatedLinkUrl('   ').ok === false);
  assert('url accepts non-empty', fv.validateRelatedLinkUrl('https://example.com').ok === true);

  assert('sourceKey accepts undefined (optional)', fv.validateRelatedLinkSourceKey(undefined, customSet).ok === true);
  assert('sourceKey rejects without Set', fv.validateRelatedLinkSourceKey('a', null).ok === false);
  assert('sourceKey rejects non-string', fv.validateRelatedLinkSourceKey(42, customSet).ok === false);
  assert('sourceKey rejects empty', fv.validateRelatedLinkSourceKey('', customSet).ok === false);
  assert('sourceKey rejects whitespace-only', fv.validateRelatedLinkSourceKey('   ', customSet).ok === false);
  assert('sourceKey rejects unknown', fv.validateRelatedLinkSourceKey('not-real', customSet).ok === false);
  assert('sourceKey accepts known', fv.validateRelatedLinkSourceKey('a', customSet).ok === true);

  assert('LIMITS frozen', Object.isFrozen(fv.LIMITS));
  assert('LIMITS.MAX_DESCRIPTION=1000', fv.LIMITS.MAX_DESCRIPTION === 1000);

  // ── 4. git-status-check ──────────────────────────────────────────────
  process.stdout.write('\n[git-status-check]\n');
  const gs = await checkGitStatus({ cwd: PROJECT_ROOT });
  assert('git status callable', gs.ok === true, gs.reason);
  assert('returns clean boolean', typeof gs.clean === 'boolean');
  assert('returns dirtyFiles array', Array.isArray(gs.dirtyFiles));
  assert('returns untracked array', Array.isArray(gs.untracked));

  const gsBadCwd = await checkGitStatus({ cwd: '' });
  assert('git status rejects empty cwd', gsBadCwd.ok === false);

  // ── 5. safe-write (uses OS temp dir; NEVER touches production content) ──
  process.stdout.write('\n[safe-write]\n');
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'safe-write-test-'));
  process.stdout.write(`  tmpRoot=${tmpRoot}\n`);

  try {
    const fakeRepo = tmpRoot;
    const targetDir = path.join(fakeRepo, 'content', 'github', 'posts');
    await fs.mkdir(targetDir, { recursive: true });
    const target = path.join(targetDir, 'test-post.md');
    const fakeContent = '---\ntitle: test\n---\nbody\n';

    const r1 = await safeWrite({
      targetPath: target,
      newContent: fakeContent,
      projectRoot: fakeRepo,
      enforceCleanGit: false,
    });
    assert('writes to whitelisted path (enforceCleanGit=false)', r1.ok === true, r1.reason);
    const written = await fs.readFile(target, 'utf-8');
    assert('content matches written', written === fakeContent);
    const tmpLeft = await existsPath(target + '.tmp');
    assert('cleans up .tmp on success', tmpLeft === false);

    const r2 = await safeWrite({
      targetPath: path.join(fakeRepo, 'content', 'settings', 'x.json'),
      newContent: '{}',
      projectRoot: fakeRepo,
      enforceCleanGit: false,
    });
    assert('rejects non-whitelisted path', r2.ok === false && r2.reason === 'whitelist-rejected');

    const r3target = path.join(targetDir, 'test-validator.md');
    const r3 = await safeWrite({
      targetPath: r3target,
      newContent: 'bad-content',
      projectRoot: fakeRepo,
      enforceCleanGit: false,
      validators: [
        (c) => ({ ok: c.startsWith('---'), errors: ['must-start-with-frontmatter'] }),
      ],
    });
    assert('validator failure aborts', r3.ok === false && r3.reason === 'validator-failed');
    assert('validator failure surfaces errors', Array.isArray(r3.errors) && r3.errors.includes('must-start-with-frontmatter'));
    assert('no file created on validator fail', (await existsPath(r3target)) === false);

    const r4 = await safeWrite({
      targetPath: target,
      newContent: 'x',
      projectRoot: fakeRepo,
      enforceCleanGit: true,
    });
    assert('requires gitStatus when enforceCleanGit=true', r4.ok === false && r4.reason === 'git-status-required');

    const r5 = await safeWrite({
      targetPath: target,
      newContent: 'x',
      projectRoot: fakeRepo,
      enforceCleanGit: true,
      gitStatus: { ok: true, clean: false, dirtyFiles: ['a.md'], untracked: [] },
    });
    assert('rejects dirty git', r5.ok === false && r5.reason === 'git-dirty');
    assert('dirty git result includes dirtyFiles', Array.isArray(r5.dirtyFiles) && r5.dirtyFiles.length === 1);

    const r6 = await safeWrite({
      targetPath: target,
      newContent: 'updated\n',
      projectRoot: fakeRepo,
      enforceCleanGit: true,
      gitStatus: { ok: true, clean: true, dirtyFiles: [], untracked: [] },
    });
    assert('accepts clean git', r6.ok === true, r6.reason);
    assert('overwrite content updated', (await fs.readFile(target, 'utf-8')) === 'updated\n');

    const r7 = await safeWrite({
      targetPath: target,
      newContent: 'x',
      projectRoot: fakeRepo,
      enforceCleanGit: true,
      gitStatus: { ok: false, reason: 'git-spawn-error' },
    });
    assert('rejects git-status ok:false', r7.ok === false && r7.reason === 'git-status-not-ok');

    const r8 = await safeWrite({
      targetPath: target,
      newContent: 123,
      projectRoot: fakeRepo,
      enforceCleanGit: false,
    });
    assert('rejects non-string content', r8.ok === false && r8.reason === 'new-content-must-be-string');

    const r9 = await safeWrite({
      targetPath: target,
      newContent: 'x',
      projectRoot: '',
      enforceCleanGit: false,
    });
    assert('rejects empty projectRoot', r9.ok === false);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
    process.stdout.write('  cleanup: temp dir removed\n');
  }

  // ── 6. admin-frontmatter-patcher (Phase 4.5e-b mitigation A) ─────────
  process.stdout.write('\n[admin-frontmatter-patcher]\n');
  {
    const mkPost = (fmLines, body = 'body content\n') =>
      ['---', ...fmLines, '---', '', body].join('\n');

    // T1: no-op patch preserves bytes (inline array remains inline)
    {
      const input = mkPost([
        'title: "Hello"',
        'tags: ["a", "b", "c"]',
        'description: "old SEO"',
      ]);
      const r = patchFrontmatter(input, { description: 'old SEO' });
      assert('patcher T1: no-op ok', r.ok === true);
      assert('patcher T1: no-op changed=false', r.changed === false);
      assert('patcher T1: no-op output byte-identical', r.output === input);
      assert('patcher T1: no-op appliedPaths=[description]',
        Array.isArray(r.appliedPaths) && r.appliedPaths.length === 1 && r.appliedPaths[0] === 'description');
    }

    // T2: scalar update only touches target line; inline array preserved
    {
      const input = mkPost([
        'title: "Hello"',
        'tags: ["a", "b", "c"]',
        'description: "old SEO"',
        'status: "draft"',
      ]);
      const r = patchFrontmatter(input, { description: 'new SEO' });
      assert('patcher T2: update ok', r.ok === true);
      assert('patcher T2: changed=true', r.changed === true);
      assert('patcher T2: tags inline array preserved verbatim',
        r.output.includes('tags: ["a", "b", "c"]'));
      assert('patcher T2: status line preserved verbatim',
        r.output.includes('status: "draft"'));
      assert('patcher T2: new value present',
        r.output.includes('description: "new SEO"'));
      assert('patcher T2: old value gone',
        !r.output.includes('description: "old SEO"'));
      // Diff must be limited to target line: every line other than description should be identical
      const inputLines = input.split('\n');
      const outputLines = r.output.split('\n');
      assert('patcher T2: line count unchanged', inputLines.length === outputLines.length);
      let diffCount = 0;
      for (let i = 0; i < inputLines.length; i++) {
        if (inputLines[i] !== outputLines[i]) diffCount++;
      }
      assert('patcher T2: exactly 1 line differs', diffCount === 1);
    }

    // T3: nested path rejected (Phase 4.5e-b scope: top-level only)
    {
      const input = mkPost(['description: "x"']);
      const r = patchFrontmatter(input, { 'seo.description': 'y' });
      assert('patcher T3: nested path rejected', r.ok === false && r.error === 'path-not-allowed');
      assert('patcher T3: nested path in skippedPaths', r.skippedPaths.includes('seo.description'));
      assert('patcher T3: output unchanged', r.output === input);
    }

    // T4a: block scalar fail closed
    {
      const input = mkPost([
        'description: |',
        '  multi-line',
        '  description value',
      ]);
      const r = patchFrontmatter(input, { description: 'new' });
      assert('patcher T4a: block scalar fail closed',
        r.ok === false && r.error === 'block-scalar-not-supported');
      assert('patcher T4a: output unchanged', r.output === input);
      assert('patcher T4a: no appliedPaths on fail',
        Array.isArray(r.appliedPaths) && r.appliedPaths.length === 0);
    }

    // T4b: target key missing
    {
      const input = mkPost(['title: "x"']);
      const r = patchFrontmatter(input, { description: 'y' });
      assert('patcher T4b: missing key fail closed',
        r.ok === false && r.error === 'target-key-not-found');
    }

    // T4c: non-allowlist field rejected
    {
      const input = mkPost(['description: "x"', 'title: "y"']);
      const r = patchFrontmatter(input, { title: 'z' });
      assert('patcher T4c: non-allowlist field rejected',
        r.ok === false && r.error === 'path-not-allowed');
    }

    // T4d: non-string value rejected
    {
      const input = mkPost(['description: "x"']);
      const r = patchFrontmatter(input, { description: 123 });
      assert('patcher T4d: non-string value rejected',
        r.ok === false && r.error === 'new-value-must-be-string');
    }

    // T4e: missing frontmatter delimiters rejected
    {
      const r1 = patchFrontmatter('plain text without frontmatter', { description: 'x' });
      assert('patcher T4e: no opening delimiter rejected',
        r1.ok === false && r1.error === 'no-opening-frontmatter-delimiter');
      const r2 = patchFrontmatter('---\ntitle: x\nno-close-marker\n', { description: 'x' });
      assert('patcher T4e: no closing delimiter rejected',
        r2.ok === false && r2.error === 'no-closing-frontmatter-delimiter');
    }

    // T5: quote-style preservation
    {
      const input = mkPost([
        "description: 'single quoted'",
        'searchDescription: "double quoted"',
      ]);
      const r1 = patchFrontmatter(input, { description: 'updated' });
      assert('patcher T5a: single-quote style preserved on update',
        r1.output.includes("description: 'updated'"));
      assert('patcher T5b: unrelated double-quote line preserved',
        r1.output.includes('searchDescription: "double quoted"'));

      const r2 = patchFrontmatter(input, { searchDescription: 'fresh' });
      assert('patcher T5c: double-quote style preserved on update',
        r2.output.includes('searchDescription: "fresh"'));
      assert('patcher T5d: unrelated single-quote line preserved',
        r2.output.includes("description: 'single quoted'"));
    }

    // T6: nested object sibling preserved verbatim
    {
      const input = [
        '---',
        'title: "x"',
        'description: "old"',
        'publishTargets:',
        '  github:',
        '    enabled: true',
        '    mode: "full"',
        '  blogger:',
        '    enabled: true',
        '    mode: "summary"',
        'status: "draft"',
        '---',
        '',
        'body',
        '',
      ].join('\n');
      const r = patchFrontmatter(input, { description: 'new' });
      assert('patcher T6: nested object block preserved',
        r.output.includes('publishTargets:\n  github:\n    enabled: true\n    mode: "full"\n  blogger:\n    enabled: true\n    mode: "summary"'));
      assert('patcher T6: status line preserved',
        r.output.includes('status: "draft"'));
      assert('patcher T6: target description updated',
        r.output.includes('description: "new"'));
    }

    // T7: plain unquoted preserved when safe
    {
      const input = mkPost(['description: plainvalue', 'title: "x"']);
      const r = patchFrontmatter(input, { description: 'newplain' });
      assert('patcher T7a: plain → plain preserved when safe',
        r.output.includes('description: newplain'));
      assert('patcher T7b: trailing line preserved',
        r.output.includes('title: "x"'));
    }

    // T8: special-char value escalates to double-quoted
    {
      const input = mkPost(['description: plainvalue']);
      const r = patchFrontmatter(input, { description: 'has: colon and # hash' });
      assert('patcher T8a: escalates to double-quoted for unsafe plain',
        r.output.includes('description: "has: colon and # hash"'));

      const inputDq = mkPost(['description: "old"']);
      const r2 = patchFrontmatter(inputDq, { description: 'with "embedded" quotes' });
      assert('patcher T8b: double-quote escape for embedded quotes',
        r2.output.includes('description: "with \\"embedded\\" quotes"'));
    }

    // T9: empty value handling
    {
      const inputEmpty = mkPost(['description:', 'title: "x"']);
      const rNoop = patchFrontmatter(inputEmpty, { description: '' });
      assert('patcher T9a: empty → empty no-op byte-identical',
        rNoop.ok === true && rNoop.changed === false && rNoop.output === inputEmpty);

      const rFill = patchFrontmatter(inputEmpty, { description: 'filled' });
      assert('patcher T9b: empty → non-empty becomes double-quoted',
        rFill.output.includes('description: "filled"'));

      const inputDqEmpty = mkPost(['description: ""']);
      const rDqNoop = patchFrontmatter(inputDqEmpty, { description: '' });
      assert('patcher T9c: "" → "" no-op byte-identical',
        rDqNoop.changed === false && rDqNoop.output === inputDqEmpty);
    }

    // T10: reproduction guard for Phase 4.5d case 2
    //   Production-like fixture: description no-op MUST be byte-identical.
    //   Without patcher, matter.stringify normalized inline tags → block, yielding bytesDelta=-32.
    {
      const input = [
        '---',
        'id: "20260504-x"',
        'site: "github"',
        'slug: "x"',
        'date: "2026-05-04"',
        'title: "X"',
        'tags: ["github", "vite", "static-site"]',
        'description: "整理 GitHub Pages 免費空間限制與可搬家部落格規劃。"',
        'publishTargets:',
        '  github:',
        '    enabled: true',
        '    mode: "full"',
        '  blogger:',
        '    enabled: true',
        '    mode: "summary"',
        'status: "draft"',
        '---',
        '',
        'body content',
        '',
      ].join('\n');
      const r = patchFrontmatter(input, {
        description: '整理 GitHub Pages 免費空間限制與可搬家部落格規劃。',
      });
      assert('patcher T10: reproduction-guard no-op ok', r.ok === true);
      assert('patcher T10: reproduction-guard no-op changed=false', r.changed === false);
      assert('patcher T10: reproduction-guard no-op byte-identical (zero YAML drift)',
        r.output === input);
    }

    // T11: targeted update on reproduction-guard fixture preserves inline array + nested
    {
      const input = [
        '---',
        'id: "20260504-x"',
        'tags: ["github", "vite", "static-site"]',
        'description: "old description text"',
        'publishTargets:',
        '  github:',
        '    enabled: true',
        '---',
        '',
        'body',
        '',
      ].join('\n');
      const r = patchFrontmatter(input, { description: 'new description text' });
      assert('patcher T11: targeted update ok',
        r.ok === true && r.changed === true);
      assert('patcher T11: inline array preserved verbatim',
        r.output.includes('tags: ["github", "vite", "static-site"]'));
      assert('patcher T11: publishTargets nested block preserved verbatim',
        r.output.includes('publishTargets:\n  github:\n    enabled: true'));
      assert('patcher T11: new description present',
        r.output.includes('description: "new description text"'));
    }
  }

  // ── 7. admin-write-cli (dry-run + 4.5e real-write gate + 4.5e-b patcher) ─
  process.stdout.write('\n[admin-write-cli]\n');
  const cliTmp = await fs.mkdtemp(path.join(os.tmpdir(), 'admin-write-cli-test-'));
  process.stdout.write(`  cliTmp=${cliTmp}\n`);

  try {
    const postsDir = path.join(cliTmp, 'content', 'blogger', 'posts');
    await fs.mkdir(postsDir, { recursive: true });
    const postPath = path.join(postsDir, 'fixture-post.md');
    const postContent = [
      '---',
      'id: "20260528-fixture-post"',
      'site: "blogger"',
      'title: "Fixture"',
      'slug: "fixture-post"',
      'date: "2026-05-28"',
      'description: "old SEO description"',
      'searchDescription: "old SEO search"',
      'status: "draft"',
      '---',
      '',
      'body content here',
      '',
    ].join('\n');
    await fs.writeFile(postPath, postContent, 'utf-8');

    const publishedPath = path.join(postsDir, 'published-post.md');
    await fs.writeFile(publishedPath, [
      '---',
      'id: "20260528-published-post"',
      'site: "blogger"',
      'title: "Published"',
      'description: "live description"',
      'status: "published"',
      '---',
      'body',
      '',
    ].join('\n'), 'utf-8');

    const payloadPath = path.join(cliTmp, 'payload.json');
    const writePayload = async (obj) => {
      await fs.writeFile(payloadPath, JSON.stringify(obj), 'utf-8');
    };
    const validPayload = () => ({
      targetRel: 'content/blogger/posts/fixture-post.md',
      field: 'description',
      newValue: 'new SEO description from CLI',
      expectedOldValue: 'old SEO description',
      dryRun: true,
    });

    // missing --payload
    const r0 = await runCli({ argv: [], projectRoot: cliTmp });
    assert('CLI rejects when --payload missing', r0.exit === 2 && r0.stdoutJson.ok === false);

    // unknown arg
    const rUnknown = await runCli({ argv: ['--frobnicate'], projectRoot: cliTmp });
    assert('CLI rejects unknown arg', rUnknown.exit === 2);

    // --apply alone (validPayload has dryRun:true) → must reject with combo-gate reason
    await writePayload(validPayload());
    const rApply = await runCli({ argv: [`--payload=${payloadPath}`, '--apply'], projectRoot: cliTmp });
    assert('CLI rejects --apply without dryRun:false',
      rApply.exit === 2 && rApply.stdoutJson.reason === 'apply-requires-dryRun-false');

    // payload file not found
    const rMissingFile = await runCli({ argv: [`--payload=${path.join(cliTmp, 'nope.json')}`], projectRoot: cliTmp });
    assert('CLI rejects missing payload file', rMissingFile.exit === 2 && rMissingFile.stdoutJson.reason === 'payload-file-not-readable');

    // invalid JSON
    await fs.writeFile(payloadPath, '{not json', 'utf-8');
    const rBadJson = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects invalid JSON', rBadJson.exit === 3 && rBadJson.stdoutJson.reason === 'invalid-payload');

    // payload is array
    await fs.writeFile(payloadPath, '[]', 'utf-8');
    const rArr = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects array payload', rArr.exit === 3);

    // missing required fields
    await writePayload({ targetRel: 'content/blogger/posts/fixture-post.md' });
    const rMissing = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects missing required fields', rMissing.exit === 3 && Array.isArray(rMissing.stdoutJson.detail.missing));

    // field not in allowlist
    await writePayload({ ...validPayload(), field: 'title' });
    const rField = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects field not in allowlist', rField.exit === 3 && rField.stdoutJson.detail.error === 'field-not-in-allowlist');

    // dryRun not boolean
    await writePayload({ ...validPayload(), dryRun: 'yes' });
    const rDryType = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects non-boolean dryRun', rDryType.exit === 3);

    // dryRun:false alone (no --apply flag) → must reject with combo-gate reason
    await writePayload({ ...validPayload(), dryRun: false });
    const rDryFalse = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects dryRun:false without --apply',
      rDryFalse.exit === 2 && rDryFalse.stdoutJson.reason === 'dryRun-false-requires-apply');

    // reason + memo mutex
    await writePayload({ ...validPayload(), reason: 'a', memo: 'b' });
    const rMutex = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects reason+memo both set', rMutex.exit === 3);

    // absolute targetRel
    await writePayload({ ...validPayload(), targetRel: path.join(cliTmp, 'content', 'blogger', 'posts', 'fixture-post.md') });
    const rAbs = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects absolute targetRel', rAbs.exit === 4 && rAbs.stdoutJson.reason === 'forbidden-target');

    // .. traversal in targetRel
    await writePayload({ ...validPayload(), targetRel: 'content/blogger/posts/../../../etc/passwd' });
    const rDotDot = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects .. traversal in targetRel', rDotDot.exit === 4);

    // forbidden prefix
    await writePayload({ ...validPayload(), targetRel: 'content/settings/site.config.json' });
    const rSettings = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects content/settings target', rSettings.exit === 4);

    // forbidden kind (.publish.json not allowed in 4.5c even though whitelist accepts)
    await fs.writeFile(path.join(postsDir, 'fixture-post.publish.json'), '{}', 'utf-8');
    await writePayload({ ...validPayload(), targetRel: 'content/blogger/posts/fixture-post.publish.json' });
    const rPubJson = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects non-post-md kind in 4.5c', rPubJson.exit === 4);

    // file not found
    await writePayload({ ...validPayload(), targetRel: 'content/blogger/posts/does-not-exist.md' });
    const rNotFound = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI exits 8 when target file missing', rNotFound.exit === 8 && rNotFound.stdoutJson.reason === 'read-failed');

    // status:published rejected
    await writePayload({
      ...validPayload(),
      targetRel: 'content/blogger/posts/published-post.md',
      expectedOldValue: 'live description',
    });
    const rPublished = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects published target', rPublished.exit === 7 && rPublished.stdoutJson.reason === 'target-status-not-allowed');

    // expectedOldValue mismatch
    await writePayload({ ...validPayload(), expectedOldValue: 'something else entirely' });
    const rMismatch = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects expectedOldValue mismatch', rMismatch.exit === 6 && rMismatch.stdoutJson.reason === 'expected-old-value-mismatch');

    // validator fail (too long)
    await writePayload({ ...validPayload(), newValue: 'x'.repeat(1001) });
    const rTooLong = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects too-long description', rTooLong.exit === 7 && rTooLong.stdoutJson.reason === 'validator-failed');

    // validator fail (control char)
    await writePayload({ ...validPayload(), newValue: 'has \x01 control char' });
    const rCtrl = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects control char in newValue', rCtrl.exit === 7);

    // newValue not string
    await writePayload({ ...validPayload(), newValue: 123 });
    const rNewType = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects non-string newValue', rNewType.exit === 3);

    // successful dry-run (description)
    await writePayload(validPayload());
    const rOk = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI dry-run success', rOk.exit === 0 && rOk.stdoutJson.ok === true);
    assert('dry-run mode echoed', rOk.stdoutJson.mode === 'dry-run');
    assert('dry-run target normalized', rOk.stdoutJson.target.replace(/\\/g, '/') === 'content/blogger/posts/fixture-post.md');
    assert('dry-run reports diffSummary.changed=true', rOk.stdoutJson.diffSummary.changed === true);
    assert('dry-run validator pass', rOk.stdoutJson.validators.description.ok === true);

    // dry-run did NOT write
    const afterContent = await fs.readFile(postPath, 'utf-8');
    assert('dry-run does NOT mutate target file', afterContent === postContent);
    assert('dry-run does NOT leave .tmp', (await existsPath(postPath + '.tmp')) === false);

    // successful dry-run (searchDescription)
    await writePayload({
      ...validPayload(),
      field: 'searchDescription',
      newValue: 'new search desc',
      expectedOldValue: 'old SEO search',
    });
    const rOkSearch = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI dry-run searchDescription success', rOkSearch.exit === 0 && rOkSearch.stdoutJson.field === 'searchDescription');

    // no-op dry-run (newValue === expectedOldValue)
    await writePayload({
      ...validPayload(),
      newValue: 'old SEO description',
    });
    const rNoop = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI dry-run no-op exits 0', rNoop.exit === 0);
    assert('no-op reports changed=false', rNoop.stdoutJson.diffSummary.changed === false);

    // reason is echoed
    await writePayload({ ...validPayload(), reason: 'fix SEO over-length' });
    const rReason = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI echoes reason in meta', rReason.exit === 0 && rReason.stdoutJson.meta.reason === 'fix SEO over-length');

    // ── Phase 4.5e-b patcher integration reproduction guard ────────────
    //   Fixture has inline flow array `tags: ["a", "b", "c"]` which previously
    //   triggered matter.stringify drift (-32 bytes) on no-op patches.
    //   With patcher, no-op MUST report changed=false AND bytesChanged=false.
    {
      const inlineArrayPath = path.join(postsDir, 'inline-array-post.md');
      const inlineContent = [
        '---',
        'id: "20260528-inline-array"',
        'site: "blogger"',
        'title: "Inline"',
        'tags: ["a", "b", "c"]',
        'description: "stable desc"',
        'searchDescription: "stable search"',
        'publishTargets:',
        '  github:',
        '    enabled: true',
        '  blogger:',
        '    enabled: true',
        'status: "ready"',
        '---',
        'body',
        '',
      ].join('\n');
      await fs.writeFile(inlineArrayPath, inlineContent, 'utf-8');

      // No-op patch
      await writePayload({
        targetRel: 'content/blogger/posts/inline-array-post.md',
        field: 'description',
        newValue: 'stable desc',
        expectedOldValue: 'stable desc',
        dryRun: true,
      });
      const rRepro = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
      assert('CLI repro-guard: no-op exits 0', rRepro.exit === 0);
      assert('CLI repro-guard: no-op diffSummary.changed=false',
        rRepro.stdoutJson.diffSummary.changed === false);
      assert('CLI repro-guard: no-op diffSummary.bytesChanged=false (Phase 4.5e-b fix)',
        rRepro.stdoutJson.diffSummary.bytesChanged === false);
      assert('CLI repro-guard: no-op bytesDelta=0',
        rRepro.stdoutJson.bytesDelta === 0);
      assert('CLI repro-guard: no-op wouldWriteBytes===currentBytes',
        rRepro.stdoutJson.wouldWriteBytes === rRepro.stdoutJson.currentBytes);

      // Targeted update — inline array preserved verbatim; delta predictable
      await writePayload({
        targetRel: 'content/blogger/posts/inline-array-post.md',
        field: 'description',
        newValue: 'updated stable desc',
        expectedOldValue: 'stable desc',
        dryRun: true,
      });
      const rUpd = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
      assert('CLI repro-guard: update exits 0', rUpd.exit === 0);
      assert('CLI repro-guard: update diffSummary.changed=true',
        rUpd.stdoutJson.diffSummary.changed === true);
      assert('CLI repro-guard: update diffSummary.bytesChanged=true',
        rUpd.stdoutJson.diffSummary.bytesChanged === true);
      // 'updated stable desc' (19 chars) − 'stable desc' (11 chars) = +8 bytes
      assert('CLI repro-guard: update bytesDelta=+8 (predictable; no YAML re-emit drift)',
        rUpd.stdoutJson.bytesDelta === 8);

      // Dry-run did not mutate fixture file
      const afterRepro = await fs.readFile(inlineArrayPath, 'utf-8');
      assert('CLI repro-guard: dry-run does NOT mutate fixture',
        afterRepro === inlineContent);
      assert('CLI repro-guard: dry-run leaves no .tmp',
        (await existsPath(inlineArrayPath + '.tmp')) === false);

      // Patcher fail-closed surfaces via CLI: write a fixture with description block scalar
      const blockScalarPath = path.join(postsDir, 'block-scalar-post.md');
      const blockScalarContent = [
        '---',
        'id: "20260528-block-scalar"',
        'site: "blogger"',
        'title: "Block"',
        'description: |',
        '  block scalar',
        '  description value',
        'status: "draft"',
        '---',
        'body',
        '',
      ].join('\n');
      await fs.writeFile(blockScalarPath, blockScalarContent, 'utf-8');
      await writePayload({
        targetRel: 'content/blogger/posts/block-scalar-post.md',
        field: 'description',
        newValue: 'new value',
        expectedOldValue: '',
        dryRun: true,
      });
      // expectedOldValue check runs before patcher; we set '' because the parsed value
      // is a multi-line string and not what the user-facing CLI consumer would supply.
      // We instead want to verify expectedOldValue mismatch OR patcher fail-closed.
      const rBlock = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
      // The expectedOldValue check actually triggers first because gray-matter reads
      // the multi-line string. So we assert mismatch instead of patcher fail-closed.
      assert('CLI repro-guard: block scalar value mismatch caught before patcher',
        rBlock.exit === 6 && rBlock.stdoutJson.reason === 'expected-old-value-mismatch');
    }

    // ── Phase 4.5e real-write gate (--apply + dryRun:false) ───────────
    //   Hermetic gitStatus injection via __testOverrides; no `git status`
    //   spawn during these tests. Production callers (process.argv entry)
    //   do NOT pass __testOverrides; checkGitStatus runs as normal.
    {
      const cleanGit = async () => ({ ok: true, clean: true, dirtyFiles: [], untracked: [] });
      const dirtyGit = async () => ({ ok: true, clean: false, dirtyFiles: ['some.md'], untracked: [] });

      const fmFixture = (lines, body = 'body content here\n') =>
        ['---', ...lines, '---', '', body].join('\n');

      // ── (c) --apply + dryRun:false + draft + match → writes file ────
      const writePath = path.join(postsDir, 'apply-test-write.md');
      const beforeWrite = fmFixture([
        'id: "20260528-apply-write"',
        'site: "blogger"',
        'title: "Apply Write"',
        'tags: ["a", "b", "c"]',
        'description: "old apply desc"',
        'searchDescription: "old apply search"',
        'publishTargets:',
        '  blogger:',
        '    enabled: true',
        'status: "draft"',
      ]);
      await fs.writeFile(writePath, beforeWrite, 'utf-8');

      await writePayload({
        targetRel: 'content/blogger/posts/apply-test-write.md',
        field: 'description',
        newValue: 'new apply desc',
        expectedOldValue: 'old apply desc',
        dryRun: false,
      });
      const rApply = await runCli({
        argv: [`--payload=${payloadPath}`, '--apply'],
        projectRoot: cliTmp,
        __testOverrides: { gitStatusFn: cleanGit },
      });
      assert('apply: --apply+dryRun:false+draft+match exits 0', rApply.exit === 0);
      assert('apply: mode=apply', rApply.stdoutJson.mode === 'apply');
      assert('apply: phase=4.5e-real-write', rApply.stdoutJson.phase === '4.5e-real-write');
      assert('apply: written=true', rApply.stdoutJson.written === true);
      assert('apply: changed=true', rApply.stdoutJson.changed === true);
      assert('apply: diffSummary.changed=true', rApply.stdoutJson.diffSummary.changed === true);
      assert('apply: diffSummary.bytesChanged=true', rApply.stdoutJson.diffSummary.bytesChanged === true);
      assert('apply: bytesDelta=+4 (newValue len − oldValue len)',
        rApply.stdoutJson.bytesDelta === ('new apply desc'.length - 'old apply desc'.length));
      assert('apply: target normalized',
        rApply.stdoutJson.target.replace(/\\/g, '/') === 'content/blogger/posts/apply-test-write.md');
      assert('apply: kind=post-md', rApply.stdoutJson.kind === 'post-md');
      assert('apply: site=blogger', rApply.stdoutJson.site === 'blogger');
      assert('apply: status echoed', rApply.stdoutJson.status === 'draft');

      // File must actually be mutated on disk
      const afterWrite = await fs.readFile(writePath, 'utf-8');
      assert('apply: file content updated', afterWrite !== beforeWrite);
      assert('apply: new description in file', afterWrite.includes('description: "new apply desc"'));
      assert('apply: old description gone', !afterWrite.includes('description: "old apply desc"'));
      assert('apply: leaves no .tmp', (await existsPath(writePath + '.tmp')) === false);

      // Only the target line changed; everything else preserved verbatim
      const beforeLines = beforeWrite.split('\n');
      const afterLines = afterWrite.split('\n');
      assert('apply: line count preserved', beforeLines.length === afterLines.length);
      let diffLines = 0;
      for (let i = 0; i < beforeLines.length; i++) {
        if (beforeLines[i] !== afterLines[i]) diffLines++;
      }
      assert('apply: exactly 1 line differs', diffLines === 1);
      assert('apply: inline tags array preserved verbatim',
        afterWrite.includes('tags: ["a", "b", "c"]'));
      assert('apply: nested publishTargets preserved verbatim',
        afterWrite.includes('publishTargets:\n  blogger:\n    enabled: true'));
      assert('apply: searchDescription line preserved verbatim',
        afterWrite.includes('searchDescription: "old apply search"'));
      assert('apply: status line preserved', afterWrite.includes('status: "draft"'));
      assert('apply: title preserved', afterWrite.includes('title: "Apply Write"'));

      // ── (h) no-op apply (newValue equals current) — must NOT write ──
      const beforeNoop = await fs.readFile(writePath, 'utf-8');
      await writePayload({
        targetRel: 'content/blogger/posts/apply-test-write.md',
        field: 'description',
        newValue: 'new apply desc', // same as current (post (c))
        expectedOldValue: 'new apply desc',
        dryRun: false,
      });
      const rNoopApply = await runCli({
        argv: [`--payload=${payloadPath}`, '--apply'],
        projectRoot: cliTmp,
        __testOverrides: { gitStatusFn: cleanGit },
      });
      assert('apply no-op: exit 0', rNoopApply.exit === 0);
      assert('apply no-op: mode=apply', rNoopApply.stdoutJson.mode === 'apply');
      assert('apply no-op: written=false', rNoopApply.stdoutJson.written === false);
      assert('apply no-op: changed=false', rNoopApply.stdoutJson.changed === false);
      assert('apply no-op: skipped=no-op', rNoopApply.stdoutJson.skipped === 'no-op');
      assert('apply no-op: bytesDelta=0', rNoopApply.stdoutJson.bytesDelta === 0);
      assert('apply no-op: file byte-identical',
        (await fs.readFile(writePath, 'utf-8')) === beforeNoop);
      assert('apply no-op: leaves no .tmp', (await existsPath(writePath + '.tmp')) === false);

      // ── (d) expectedOldValue mismatch in apply mode — must NOT write ─
      const mismatchPath = path.join(postsDir, 'apply-test-mismatch.md');
      const mismatchBefore = fmFixture([
        'id: "20260528-apply-mismatch"',
        'site: "blogger"',
        'title: "Mismatch"',
        'description: "actual value"',
        'status: "draft"',
      ]);
      await fs.writeFile(mismatchPath, mismatchBefore, 'utf-8');
      await writePayload({
        targetRel: 'content/blogger/posts/apply-test-mismatch.md',
        field: 'description',
        newValue: 'attempted new',
        expectedOldValue: 'wrong-expected-value',
        dryRun: false,
      });
      const rMismatchApply = await runCli({
        argv: [`--payload=${payloadPath}`, '--apply'],
        projectRoot: cliTmp,
        __testOverrides: { gitStatusFn: cleanGit },
      });
      assert('apply mismatch: exit 6', rMismatchApply.exit === 6);
      assert('apply mismatch: reason=expected-old-value-mismatch',
        rMismatchApply.stdoutJson.reason === 'expected-old-value-mismatch');
      assert('apply mismatch: file unchanged',
        (await fs.readFile(mismatchPath, 'utf-8')) === mismatchBefore);
      assert('apply mismatch: leaves no .tmp',
        (await existsPath(mismatchPath + '.tmp')) === false);

      // ── (e) status:ready in apply mode — must reject (narrowed to draft) ─
      const readyPath = path.join(postsDir, 'apply-test-ready.md');
      const readyBefore = fmFixture([
        'id: "20260528-apply-ready"',
        'site: "blogger"',
        'title: "Ready Post"',
        'description: "ready desc"',
        'status: "ready"',
      ]);
      await fs.writeFile(readyPath, readyBefore, 'utf-8');
      await writePayload({
        targetRel: 'content/blogger/posts/apply-test-ready.md',
        field: 'description',
        newValue: 'modified',
        expectedOldValue: 'ready desc',
        dryRun: false,
      });
      const rReadyApply = await runCli({
        argv: [`--payload=${payloadPath}`, '--apply'],
        projectRoot: cliTmp,
        __testOverrides: { gitStatusFn: cleanGit },
      });
      assert('apply ready: exit 7', rReadyApply.exit === 7);
      assert('apply ready: reason=target-status-not-allowed',
        rReadyApply.stdoutJson.reason === 'target-status-not-allowed');
      assert('apply ready: allowed list = [draft]',
        Array.isArray(rReadyApply.stdoutJson.allowed) &&
          rReadyApply.stdoutJson.allowed.length === 1 &&
          rReadyApply.stdoutJson.allowed[0] === 'draft');
      assert('apply ready: mode=apply echoed in rejection',
        rReadyApply.stdoutJson.mode === 'apply');
      assert('apply ready: file unchanged',
        (await fs.readFile(readyPath, 'utf-8')) === readyBefore);

      // No-regression: dry-run on same status:ready file still works
      await writePayload({
        targetRel: 'content/blogger/posts/apply-test-ready.md',
        field: 'description',
        newValue: 'modified',
        expectedOldValue: 'ready desc',
        dryRun: true,
      });
      const rReadyDry = await runCli({
        argv: [`--payload=${payloadPath}`],
        projectRoot: cliTmp,
      });
      assert('no-regression: dry-run on status:ready still ok',
        rReadyDry.exit === 0 && rReadyDry.stdoutJson.mode === 'dry-run');
      assert('no-regression: dry-run on ready does NOT mutate file',
        (await fs.readFile(readyPath, 'utf-8')) === readyBefore);

      // ── (f) field outside allowlist in apply mode — rejected at shape ─
      await writePayload({
        targetRel: 'content/blogger/posts/apply-test-write.md',
        field: 'title',
        newValue: 'pwned',
        expectedOldValue: 'whatever',
        dryRun: false,
      });
      const rFieldApply = await runCli({
        argv: [`--payload=${payloadPath}`, '--apply'],
        projectRoot: cliTmp,
        __testOverrides: { gitStatusFn: cleanGit },
      });
      assert('apply field-outside-allowlist: exit 3',
        rFieldApply.exit === 3 &&
          rFieldApply.stdoutJson.detail.error === 'field-not-in-allowlist');

      // ── (g) target outside content posts in apply mode — whitelist rejects ─
      await writePayload({
        targetRel: 'content/settings/site.config.json',
        field: 'description',
        newValue: 'x',
        expectedOldValue: '',
        dryRun: false,
      });
      const rOutsideApply = await runCli({
        argv: [`--payload=${payloadPath}`, '--apply'],
        projectRoot: cliTmp,
        __testOverrides: { gitStatusFn: cleanGit },
      });
      assert('apply target-outside: exit 4',
        rOutsideApply.exit === 4 && rOutsideApply.stdoutJson.reason === 'forbidden-target');

      // ── (i) git-dirty rejects apply ──────────────────────────────────
      const dirtyPath = path.join(postsDir, 'apply-test-gitdirty.md');
      const dirtyBefore = fmFixture([
        'id: "20260528-apply-gitdirty"',
        'site: "blogger"',
        'title: "Dirty"',
        'description: "dirty desc"',
        'status: "draft"',
      ]);
      await fs.writeFile(dirtyPath, dirtyBefore, 'utf-8');
      await writePayload({
        targetRel: 'content/blogger/posts/apply-test-gitdirty.md',
        field: 'description',
        newValue: 'should not land',
        expectedOldValue: 'dirty desc',
        dryRun: false,
      });
      const rDirty = await runCli({
        argv: [`--payload=${payloadPath}`, '--apply'],
        projectRoot: cliTmp,
        __testOverrides: { gitStatusFn: dirtyGit },
      });
      assert('apply git-dirty: exit 8', rDirty.exit === 8);
      assert('apply git-dirty: reason=safe-write-failed',
        rDirty.stdoutJson.reason === 'safe-write-failed');
      assert('apply git-dirty: safeWriteReason=git-dirty',
        rDirty.stdoutJson.safeWriteReason === 'git-dirty');
      assert('apply git-dirty: file unchanged',
        (await fs.readFile(dirtyPath, 'utf-8')) === dirtyBefore);
      assert('apply git-dirty: leaves no .tmp',
        (await existsPath(dirtyPath + '.tmp')) === false);
    }

    // invalid projectRoot
    const rNoRoot = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: '' });
    assert('CLI rejects empty projectRoot', rNoRoot.exit === 1);
  } finally {
    await fs.rm(cliTmp, { recursive: true, force: true });
    process.stdout.write('  cleanup: cli temp dir removed\n');
  }

  process.stdout.write(`\n[safe-write-test] ${pass} pass / ${fail} fail\n`);
  if (fail > 0) {
    process.stdout.write('\nFailed assertions:\n');
    for (const f of fails) process.stdout.write(`  - ${f}\n`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`[safe-write-test] crashed: ${err && err.stack ? err.stack : err}\n`);
  process.exit(2);
});
