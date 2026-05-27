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

  // ── 6. admin-write-cli (dry-run only; phase 4.5c) ────────────────────
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

    // --apply flag rejected (4.5c gate)
    await writePayload(validPayload());
    const rApply = await runCli({ argv: [`--payload=${payloadPath}`, '--apply'], projectRoot: cliTmp });
    assert('CLI rejects --apply flag', rApply.exit === 2 && rApply.stdoutJson.reason === 'apply-not-supported-in-phase-4p5c');

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

    // dryRun:false rejected (4.5c gate)
    await writePayload({ ...validPayload(), dryRun: false });
    const rDryFalse = await runCli({ argv: [`--payload=${payloadPath}`], projectRoot: cliTmp });
    assert('CLI rejects dryRun:false (phase 4.5c)', rDryFalse.exit === 2 && rDryFalse.stdoutJson.reason === 'apply-not-supported-in-phase-4p5c');

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
