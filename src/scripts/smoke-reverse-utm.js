// Phase 20260525-night-2-reverse-utm-l1-smoke-feasibility-a：
//   reverse UTM L1 fixture-free smoke harness
//   per docs/20260525-reverse-utm-code-smoke-plan.md §3.1-§3.6
//
// 約束：
//   - zero new dependency（僅 node:assert）
//   - no I/O（不讀 content / 不讀 settings / 不寫 dist）
//   - 純 in-memory assertion；< 1 秒
//   - fixture-free；不依賴 ready / published 文章
//   - 不改 src/scripts/ga4-url-builder.js（僅 import named exports）
//
// 執行：node src/scripts/smoke-reverse-utm.js
//   - exit 0 = 全 pass
//   - exit !0 = assertion failure（throw 含 case id）

import { strict as assert } from 'node:assert';
import {
  isGithubCrossLink,
  applyCrossSiteUtm,
  mergeRel,
} from './ga4-url-builder.js';

const SETTINGS = {
  site: {
    githubSiteUrl: 'https://babel-lab.github.io',
    bloggerSiteUrl: 'https://babel-lab.blogspot.com',
  },
};

// ─── §3.1 isGithubCrossLink ───────────────────────────────────────────

// 3.1.1 GitHub host → true
assert.equal(
  isGithubCrossLink('https://babel-lab.github.io/posts/foo/', SETTINGS),
  true,
  '3.1.1 GitHub host should be cross-link',
);

// 3.1.2 third-party host → false
assert.equal(
  isGithubCrossLink('https://example.com/foo', SETTINGS),
  false,
  '3.1.2 third-party host should not be cross-link',
);

// 3.1.3 Blogger host (not GitHub) → false
assert.equal(
  isGithubCrossLink('https://babel-lab.blogspot.com/2026/05/post.html', SETTINGS),
  false,
  '3.1.3 Blogger host should not match GitHub cross-link check',
);

// 3.1.4 non-string / invalid inputs → false (must not throw)
assert.equal(isGithubCrossLink('not-a-url', SETTINGS), false, '3.1.4.a non-URL string');
assert.equal(isGithubCrossLink('', SETTINGS), false, '3.1.4.b empty string');
assert.equal(isGithubCrossLink(null, SETTINGS), false, '3.1.4.c null');
assert.equal(isGithubCrossLink(undefined, SETTINGS), false, '3.1.4.d undefined');
assert.equal(isGithubCrossLink(42, SETTINGS), false, '3.1.4.e number');
assert.equal(isGithubCrossLink({}, SETTINGS), false, '3.1.4.f object');

// 3.1.5 settings missing githubSiteUrl → false
assert.equal(
  isGithubCrossLink('https://babel-lab.github.io/posts/foo/', { site: {} }),
  false,
  '3.1.5 settings.site.githubSiteUrl missing should return false',
);

// 3.1.6 settings absent → false (must not throw)
assert.equal(isGithubCrossLink('https://babel-lab.github.io/', {}), false, '3.1.6.a settings = {}');
assert.equal(isGithubCrossLink('https://babel-lab.github.io/', null), false, '3.1.6.b settings = null');
assert.equal(isGithubCrossLink('https://babel-lab.github.io/', undefined), false, '3.1.6.c settings = undefined');

// ─── §3.2 applyCrossSiteUtm({direction:'to_github'}) ──────────────────

// 3.2.1 GitHub cross-link + slot=related_links + no existing UTM
{
  const r = applyCrossSiteUtm({
    url: 'https://babel-lab.github.io/posts/foo/',
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
    direction: 'to_github',
  });
  assert.equal(r.applied, true, '3.2.1 applied should be true');
  assert.equal(r.target, '_blank', '3.2.1 target should be _blank');
  const u = new URL(r.url);
  assert.equal(u.searchParams.get('utm_source'), 'blogger', '3.2.1 utm_source = blogger');
  assert.equal(u.searchParams.get('utm_medium'), 'referral', '3.2.1 utm_medium = referral');
  assert.equal(u.searchParams.get('utm_campaign'), 'portable_blog_system', '3.2.1 utm_campaign');
  assert.equal(u.searchParams.get('utm_content'), 'related_links', '3.2.1 utm_content = related_links');
  const tokens = r.rel.split(/\s+/);
  assert.ok(tokens.includes('nofollow'), '3.2.1 rel includes nofollow');
  assert.ok(tokens.includes('noopener'), '3.2.1 rel includes noopener');
  assert.ok(tokens.includes('noreferrer'), '3.2.1 rel includes noreferrer');
}

// 3.2.2 slot=other_links → utm_content=other_links
{
  const r = applyCrossSiteUtm({
    url: 'https://babel-lab.github.io/posts/bar/',
    settings: SETTINGS,
    slot: 'other_links',
    existingRel: '',
    direction: 'to_github',
  });
  assert.equal(r.applied, true, '3.2.2 applied');
  const u = new URL(r.url);
  assert.equal(u.searchParams.get('utm_content'), 'other_links', '3.2.2 utm_content = other_links');
}

// 3.2.3 non-GitHub host + direction=to_github → not applied; url/target/rel untouched
{
  const inputUrl = 'https://example.com/foo';
  const r = applyCrossSiteUtm({
    url: inputUrl,
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
    direction: 'to_github',
  });
  assert.equal(r.applied, false, '3.2.3 applied = false');
  assert.equal(r.url, inputUrl, '3.2.3 url unchanged');
  assert.equal(r.target, null, '3.2.3 target = null');
  assert.equal(r.rel, null, '3.2.3 rel = null');
}

// 3.2.4 GitHub cross-link with existing utm_source (Strategy A: preserve author intent)
{
  const inputUrl = 'https://babel-lab.github.io/posts/foo/?utm_source=other';
  const r = applyCrossSiteUtm({
    url: inputUrl,
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
    direction: 'to_github',
  });
  assert.equal(r.applied, false, '3.2.4 applied = false (Strategy A)');
  assert.equal(r.url, inputUrl, '3.2.4 url not overwritten');
  assert.equal(r.target, '_blank', '3.2.4 target still applied');
  assert.ok(typeof r.rel === 'string' && r.rel.includes('nofollow'), '3.2.4 rel still merged');
  const u = new URL(r.url);
  assert.equal(u.searchParams.get('utm_source'), 'other', '3.2.4 utm_source preserved');
}

// 3.2.5 GitHub cross-link with existing utm_medium only (Strategy A also triggers)
{
  const inputUrl = 'https://babel-lab.github.io/posts/foo/?utm_medium=email';
  const r = applyCrossSiteUtm({
    url: inputUrl,
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
    direction: 'to_github',
  });
  assert.equal(r.applied, false, '3.2.5 applied = false');
  const u = new URL(r.url);
  assert.equal(u.searchParams.get('utm_medium'), 'email', '3.2.5 utm_medium preserved');
  assert.equal(u.searchParams.get('utm_source'), null, '3.2.5 utm_source not injected');
}

// 3.2.6 direction omitted (default 'to_blogger') — backward compat
{
  // GitHub URL + default direction → checks bloggerHost → not cross-link → not applied
  const githubUrl = 'https://babel-lab.github.io/posts/foo/';
  const rGithub = applyCrossSiteUtm({
    url: githubUrl,
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
  });
  assert.equal(rGithub.applied, false, '3.2.6.a GitHub URL + default direction → not applied');

  // Blogger URL + default direction → applied as forward UTM (utm_source=github_pages)
  const bloggerUrl = 'https://babel-lab.blogspot.com/2026/05/post.html';
  const rBlogger = applyCrossSiteUtm({
    url: bloggerUrl,
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
  });
  assert.equal(rBlogger.applied, true, '3.2.6.b Blogger URL + default direction → applied');
  const u = new URL(rBlogger.url);
  assert.equal(u.searchParams.get('utm_source'), 'github_pages', '3.2.6.b forward utm_source = github_pages');
}

// ─── §3.4 guard: utm_content must NOT be legacy forward-UTM values ────

{
  const r = applyCrossSiteUtm({
    url: 'https://babel-lab.github.io/posts/foo/',
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
    direction: 'to_github',
  });
  const u = new URL(r.url);
  // legacy buildBloggerToGithubUrl forward UTM scheme uses utm_medium=internal_referral
  //   and utm_campaign=blogger_to_github — reverse UTM must NOT collide with these.
  assert.notEqual(u.searchParams.get('utm_medium'), 'internal_referral', '3.4.guard utm_medium not legacy');
  assert.notEqual(u.searchParams.get('utm_campaign'), 'blogger_to_github', '3.4.guard utm_campaign not legacy');
  assert.notEqual(u.searchParams.get('utm_content'), 'internal_referral', '3.4.guard utm_content not legacy');
}

// ─── §3.5 mergeRel pure function ──────────────────────────────────────

// 3.5.4 plain merge
assert.equal(
  mergeRel('', ['nofollow', 'noopener', 'noreferrer']),
  'nofollow noopener noreferrer',
  '3.5.4 plain merge into empty primary',
);

// 3.5.5 existing token preserved + order maintained
assert.equal(
  mergeRel('sponsored', ['nofollow', 'noopener', 'noreferrer']),
  'sponsored nofollow noopener noreferrer',
  '3.5.5 sponsored preserved at head',
);

// 3.5.6 deduplication
assert.equal(
  mergeRel('nofollow', ['nofollow', 'noopener']),
  'nofollow noopener',
  '3.5.6 duplicate nofollow dropped',
);

// 3.5.7 both empty
assert.equal(mergeRel('', []), '', '3.5.7 both empty → empty');

// 3.5.8 null / undefined primary must not throw
assert.equal(mergeRel(null, ['noopener']), 'noopener', '3.5.8.a null primary');
assert.equal(mergeRel(undefined, ['noopener']), 'noopener', '3.5.8.b undefined primary');

// 3.5.x via applyCrossSiteUtm with existingRel='sponsored'
{
  const r = applyCrossSiteUtm({
    url: 'https://babel-lab.github.io/posts/foo/',
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: 'sponsored',
    direction: 'to_github',
  });
  const tokens = r.rel.split(/\s+/);
  assert.ok(tokens.includes('sponsored'), '3.5.x sponsored preserved through applyCrossSiteUtm');
  assert.ok(tokens.includes('nofollow'), '3.5.x nofollow merged');
  assert.ok(tokens.includes('noopener'), '3.5.x noopener merged');
  assert.ok(tokens.includes('noreferrer'), '3.5.x noreferrer merged');
}

// ─── §3.6 CORE INVARIANT: non-GitHub link must NOT get reverse UTM ────

// 3.6.1 Blogger same-site link + direction=to_github → not applied; no reverse UTM
{
  const inputUrl = 'https://babel-lab.blogspot.com/2026/05/post.html';
  const r = applyCrossSiteUtm({
    url: inputUrl,
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
    direction: 'to_github',
  });
  assert.equal(r.applied, false, '3.6.1 applied = false');
  assert.ok(!r.url.includes('utm_source=blogger'), '3.6.1 no utm_source=blogger injected');
  assert.equal(r.target, null, '3.6.1 target = null');
  assert.equal(r.rel, null, '3.6.1 rel = null');
}

// 3.6.2 third-party external link + direction=to_github → not applied
{
  const inputUrl = 'https://example.com/article';
  const r = applyCrossSiteUtm({
    url: inputUrl,
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: '',
    direction: 'to_github',
  });
  assert.equal(r.applied, false, '3.6.2 applied = false');
  assert.ok(!r.url.includes('utm_source=blogger'), '3.6.2 no reverse UTM on third-party');
  assert.equal(r.url, inputUrl, '3.6.2 url unchanged');
}

// 3.6.3 affiliate link + direction=to_github + existingRel='sponsored' → not applied
{
  const inputUrl = 'https://www.books.com.tw/products/0010800000';
  const r = applyCrossSiteUtm({
    url: inputUrl,
    settings: SETTINGS,
    slot: 'related_links',
    existingRel: 'sponsored',
    direction: 'to_github',
  });
  assert.equal(r.applied, false, '3.6.3 applied = false');
  assert.equal(r.url, inputUrl, '3.6.3 affiliate url unchanged');
}

console.log('reverse UTM L1 smoke passed');
