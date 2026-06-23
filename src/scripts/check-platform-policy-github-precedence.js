// Phase 20260624-sp9b-conservative-precedence-a：
//   SP-9b GitHub platformPolicy 收緊型 precedence regression smoke。
//
// 目的：鎖住三條 selector 之 SP-9b 契約（tighten-only / safety-first / top-level-first）：
//   A. resolvePostDetailRobots
//      - platformPolicy.github.indexing 只能「收緊」normal/default pages 的 robots
//      - 不可放寬：contentKind:download / pageType:download / pageType:gated_download /
//        pageType:utility_hidden / pageType:redirect_canonical / explicit seo.indexing noindex-*
//      - 缺省 / 非 override（inherit/invalid/secret/absent）→ 維持 base
//   B. shouldIncludeInSitemap
//      - safety 仍最高優先（noindex-* / legacy contentKind:download）
//      - platformPolicy.github.includeInSitemap === true 不放寬 safety；=== false 可排除 eligible
//      - top-level includeInSitemap === false 不可被 policy true 放寬
//   C. shouldIncludeInListings
//      - top-level includeInListings === false 最高優先（policy true 不放寬）
//      - platformPolicy.github.includeInListings === false 可排除 normal post
//      - 與 robots / pageType / sitemap safety 正交（不互相耦合）
//
// 約束（mirror check-page-type-robots.js / check-include-in-*.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - 只 import 純函式 selector；不 import build-github.js / build-sitemap.js（會觸發 main() side effect）
//   - 不改 production posts / registry / build / package
//
// 執行：node src/scripts/check-platform-policy-github-precedence.js
//   - exit 0 = 全 pass；exit 1 = 任一 case fail

import { strict as assert } from 'node:assert';
import { resolvePostDetailRobots } from './page-type-robots.js';
import { shouldIncludeInSitemap } from './include-in-sitemap.js';
import { shouldIncludeInListings } from './include-in-listings.js';

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

// post factory
function post(overrides = {}) {
  return { contentKind: 'post', slug: 'sample', ...overrides };
}
function policy(github = {}) {
  return { github };
}

// ──────────────────────────────────────────────────────────────────────────────
// A. resolvePostDetailRobots：tighten-only
// ──────────────────────────────────────────────────────────────────────────────

// A.1 normal post + policy noindex-follow → tighten
check('A.1 normal + policy noindex-follow → noindex, follow', () => {
  assert.equal(
    resolvePostDetailRobots(post({ platformPolicy: policy({ indexing: 'noindex-follow' }) })),
    'noindex, follow',
  );
});

// A.2 normal post + policy noindex-nofollow → tighten
check('A.2 normal + policy noindex-nofollow → noindex, nofollow', () => {
  assert.equal(
    resolvePostDetailRobots(post({ platformPolicy: policy({ indexing: 'noindex-nofollow' }) })),
    'noindex, nofollow',
  );
});

// A.3 normal post + policy index → no-op（equal tightness）
check('A.3 normal + policy index → index, follow（no-op）', () => {
  assert.equal(
    resolvePostDetailRobots(post({ platformPolicy: policy({ indexing: 'index' }) })),
    'index, follow',
  );
});

// A.4 contentKind:download + policy index → MUST NOT loosen
check('A.4 contentKind:download + policy index → noindex, follow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({ contentKind: 'download', platformPolicy: policy({ indexing: 'index' }) }),
    ),
    'noindex, follow',
  );
});

// A.5 pageType:download + policy index → MUST NOT loosen
check('A.5 pageType:download + policy index → noindex, follow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({ pageType: 'download', platformPolicy: policy({ indexing: 'index' }) }),
    ),
    'noindex, follow',
  );
});

// A.6 pageType:gated_download + policy index → MUST NOT loosen
check('A.6 pageType:gated_download + policy index → noindex, follow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({ pageType: 'gated_download', platformPolicy: policy({ indexing: 'index' }) }),
    ),
    'noindex, follow',
  );
});

// A.7 pageType:utility_hidden + policy index → MUST NOT loosen
check('A.7 pageType:utility_hidden + policy index → noindex, nofollow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({ pageType: 'utility_hidden', platformPolicy: policy({ indexing: 'index' }) }),
    ),
    'noindex, nofollow',
  );
});

// A.8 pageType:redirect_canonical + policy index → MUST NOT loosen
check('A.8 pageType:redirect_canonical + policy index → noindex, follow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({ pageType: 'redirect_canonical', platformPolicy: policy({ indexing: 'index' }) }),
    ),
    'noindex, follow',
  );
});

// A.9 explicit seo.indexing noindex-follow + policy index → MUST NOT loosen
check('A.9 explicit seo.indexing noindex-follow + policy index → noindex, follow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({ seo: { indexing: 'noindex-follow' }, platformPolicy: policy({ indexing: 'index' }) }),
    ),
    'noindex, follow',
  );
});

// A.10 explicit seo.indexing noindex-nofollow + policy noindex-follow → MUST NOT loosen
check('A.10 explicit noindex-nofollow + policy noindex-follow → noindex, nofollow（不放寬）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({
        seo: { indexing: 'noindex-nofollow' },
        platformPolicy: policy({ indexing: 'noindex-follow' }),
      }),
    ),
    'noindex, nofollow',
  );
});

// A.11 pageType:download + policy noindex-nofollow → tighten OK
check('A.11 pageType:download + policy noindex-nofollow → noindex, nofollow（嚴格收緊）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({ pageType: 'download', platformPolicy: policy({ indexing: 'noindex-nofollow' }) }),
    ),
    'noindex, nofollow',
  );
});

// A.12 inherit → no override, base wins（normal post → default）
check('A.12 normal + policy inherit → index, follow（base）', () => {
  assert.equal(
    resolvePostDetailRobots(post({ platformPolicy: policy({ indexing: 'inherit' }) })),
    'index, follow',
  );
});

// A.13 invalid policy value（string 'noindex'）→ no override, base wins
check('A.13 normal + policy invalid string → index, follow（base）', () => {
  assert.equal(
    resolvePostDetailRobots(post({ platformPolicy: policy({ indexing: 'noindex' }) })),
    'index, follow',
  );
});

// A.14 platformPolicy 缺省 → byte-identical 既有行為
check('A.14 no platformPolicy → 既有 SP-3 行為 byte-identical', () => {
  assert.equal(resolvePostDetailRobots(post()), 'index, follow');
  assert.equal(
    resolvePostDetailRobots(post({ contentKind: 'download' })),
    'noindex, follow',
  );
  assert.equal(
    resolvePostDetailRobots(post({ pageType: 'utility_hidden' })),
    'noindex, nofollow',
  );
});

// A.15 platformPolicy 非 object → no override（resolvePlatformPolicyValue 回 'absent'）
check('A.15 platformPolicy 非 object → base 維持', () => {
  assert.equal(
    resolvePostDetailRobots(post({ platformPolicy: 'github' })),
    'index, follow',
  );
});

// A.16 platformPolicy.github 非 object → no override
check('A.16 platformPolicy.github 非 object → base 維持', () => {
  assert.equal(
    resolvePostDetailRobots(post({ platformPolicy: { github: 'noindex' } })),
    'index, follow',
  );
});

// A.17 explicit seo.indexing index + policy noindex-follow → tighten OK（spec 允許）
check('A.17 explicit index + policy noindex-follow → noindex, follow（嚴格收緊）', () => {
  assert.equal(
    resolvePostDetailRobots(
      post({ seo: { indexing: 'index' }, platformPolicy: policy({ indexing: 'noindex-follow' }) }),
    ),
    'noindex, follow',
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// B. shouldIncludeInSitemap：safety-first；policy false 可額外排除；policy true 不放寬
// ──────────────────────────────────────────────────────────────────────────────

// B.1 noindex-follow + policy includeInSitemap true → 仍 false（safety 優先）
check('B.1 noindex-follow + policy includeInSitemap true → false（safety 優先）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({
        seo: { indexing: 'noindex-follow' },
        platformPolicy: policy({ includeInSitemap: true }),
      }),
    ),
    false,
  );
});

// B.2 noindex-nofollow + policy includeInSitemap true → 仍 false
check('B.2 noindex-nofollow + policy includeInSitemap true → false（safety 優先）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({
        seo: { indexing: 'noindex-nofollow' },
        platformPolicy: policy({ includeInSitemap: true }),
      }),
    ),
    false,
  );
});

// B.3 contentKind:download + policy includeInSitemap true → 仍 false（legacy safety）
check('B.3 contentKind:download + policy includeInSitemap true → false（legacy safety）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({ contentKind: 'download', platformPolicy: policy({ includeInSitemap: true }) }),
    ),
    false,
  );
});

// B.4 normal post + policy includeInSitemap false → false（policy 顯式排除）
check('B.4 normal post + policy includeInSitemap false → false', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({ platformPolicy: policy({ includeInSitemap: false }) }),
    ),
    false,
  );
});

// B.5 normal post + policy includeInSitemap true → true（同既有行為，no-op）
check('B.5 normal post + policy includeInSitemap true → true（no-op）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({ platformPolicy: policy({ includeInSitemap: true }) }),
    ),
    true,
  );
});

// B.6 top-level includeInSitemap false + policy includeInSitemap true → false（top-level 不放寬）
check('B.6 top-level false + policy true → false（top-level 顯式排除不放寬）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({ includeInSitemap: false, platformPolicy: policy({ includeInSitemap: true }) }),
    ),
    false,
  );
});

// B.7 policy inherit / invalid / absent → 維持既有行為
check('B.7 policy inherit / invalid / absent → 既有行為（include）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({ platformPolicy: policy({ includeInSitemap: 'inherit' }) }),
    ),
    true,
  );
  assert.equal(
    shouldIncludeInSitemap(
      post({ platformPolicy: policy({ includeInSitemap: 'maybe' }) }),
    ),
    true,
  );
  assert.equal(shouldIncludeInSitemap(post()), true);
});

// B.8 platformPolicy 缺省 → byte-identical 既有 SP-5a 行為
check('B.8 no platformPolicy → 既有 SP-5a 行為 byte-identical', () => {
  assert.equal(shouldIncludeInSitemap(post()), true);
  assert.equal(shouldIncludeInSitemap(post({ contentKind: 'download' })), false);
  assert.equal(shouldIncludeInSitemap(post({ includeInSitemap: false })), false);
});

// B.9 secretLike platform key → 不讀 value（policy 視為 absent → 既有行為）
check('B.9 secret-like nested key → no override（既有行為）', () => {
  assert.equal(
    shouldIncludeInSitemap(
      post({ platformPolicy: { github: { token: 'should-not-be-read' } } }),
    ),
    true,
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// C. shouldIncludeInListings：top-level false 最高；policy false 可額外排除；
//    與 robots / pageType / sitemap safety 正交
// ──────────────────────────────────────────────────────────────────────────────

// C.1 top-level includeInListings false + policy includeInListings true → false（top-level 優先）
check('C.1 top-level false + policy true → false（top-level 最高優先）', () => {
  assert.equal(
    shouldIncludeInListings(
      post({ includeInListings: false, platformPolicy: policy({ includeInListings: true }) }),
    ),
    false,
  );
});

// C.2 normal post + policy includeInListings false → false（policy 排除 normal）
check('C.2 normal post + policy includeInListings false → false', () => {
  assert.equal(
    shouldIncludeInListings(
      post({ platformPolicy: policy({ includeInListings: false }) }),
    ),
    false,
  );
});

// C.3 normal post + policy includeInListings true → true（no-op）
check('C.3 normal post + policy includeInListings true → true（no-op）', () => {
  assert.equal(
    shouldIncludeInListings(
      post({ platformPolicy: policy({ includeInListings: true }) }),
    ),
    true,
  );
});

// C.4 contentKind:download + policy includeInListings true → true（與 robots / sitemap 正交）
check('C.4 contentKind:download + policy includeInListings true → true（正交；不耦合 robots/sitemap safety）', () => {
  assert.equal(
    shouldIncludeInListings(
      post({ contentKind: 'download', platformPolicy: policy({ includeInListings: true }) }),
    ),
    true,
  );
});

// C.5 pageType:gated_download + policy includeInListings false → false
check('C.5 pageType:gated_download + policy includeInListings false → false', () => {
  assert.equal(
    shouldIncludeInListings(
      post({ pageType: 'gated_download', platformPolicy: policy({ includeInListings: false }) }),
    ),
    false,
  );
});

// C.6 seo.indexing noindex-follow + 缺省 includeInListings + 缺省 policy → true（正交）
check('C.6 seo.indexing noindex-follow + 缺省 → true（與 robots 正交）', () => {
  assert.equal(
    shouldIncludeInListings(post({ seo: { indexing: 'noindex-follow' } })),
    true,
  );
});

// C.7 includeInSitemap false 不影響 listings
check('C.7 includeInSitemap false + 缺省 includeInListings → true（與 sitemap 正交）', () => {
  assert.equal(shouldIncludeInListings(post({ includeInSitemap: false })), true);
});

// C.8 policy inherit / invalid / absent → 既有行為
check('C.8 policy inherit / invalid / absent → true（既有行為）', () => {
  assert.equal(
    shouldIncludeInListings(post({ platformPolicy: policy({ includeInListings: 'inherit' }) })),
    true,
  );
  assert.equal(
    shouldIncludeInListings(post({ platformPolicy: policy({ includeInListings: 'maybe' }) })),
    true,
  );
  assert.equal(shouldIncludeInListings(post()), true);
});

// C.9 platformPolicy 缺省 → byte-identical 既有 SP-4a 行為
check('C.9 no platformPolicy → 既有 SP-4a 行為 byte-identical', () => {
  assert.equal(shouldIncludeInListings(post()), true);
  assert.equal(shouldIncludeInListings(post({ includeInListings: false })), false);
  assert.equal(shouldIncludeInListings(post({ contentKind: 'download' })), true);
});

// C.10 secretLike nested key → 不讀 value
check('C.10 secret-like nested key → no override（既有行為）', () => {
  assert.equal(
    shouldIncludeInListings(
      post({ platformPolicy: { github: { token: 'should-not-be-read' } } }),
    ),
    true,
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// summary
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
