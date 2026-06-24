// Phase 20260624-ga4-param-allowlist-source-a：
//   GA4 event param allowlist filter regression smoke harness。
//
// 目的：鎖住 src/js/modules/link-tracker.js 之 filterGa4EventParams() 行為——
//   只 forward allowlisted key（D4 已註冊 4 維度 + P1 article_bottom_nav 報表依賴欄位），
//   其餘（raw URL / deferred / 未知 / email-like / user-id-like / token-like）一律 drop。
//
// 約束（mirror src/scripts/check-commerce-affiliate-resolver.js / smoke-reverse-utm.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - 純函式 import 測試；不需 DOM / jsdom；不碰 build / dist / .cache / generated files
//   - 不寫任何 output；read-only import of source module
//
// 執行：node src/scripts/check-ga4-param-allowlist.js
//   - exit 0 = 全 pass
//   - exit 1 = 任一 case fail（列出 FAIL 後 process.exit(1)）

import { strict as assert } from 'node:assert';
import {
  filterGa4EventParams,
  GA4_PARAM_ALLOWLIST,
} from '../js/modules/link-tracker.js';

let passed = 0;
const failures = [];

function check(label, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failures.push(`${label}: ${err && err.message ? err.message : err}`);
  }
}

const D4_KEEP = ['link_type', 'provider', 'placement', 'link_label'];
const P1_KEEP = ['post_slug', 'surface', 'click_area', 'nav_direction', 'target_slug'];
const MUST_DROP = ['link_url', 'target_url', 'outbound', 'link_source_key'];

// --- 0. allowlist 常數鎖定（精確等於 D4 + P1，無多無少） ---
check('allowlist constant = exactly D4 + P1 keys', () => {
  const expected = [...D4_KEEP, ...P1_KEEP].sort();
  const actual = [...GA4_PARAM_ALLOWLIST].sort();
  assert.deepEqual(actual, expected,
    `allowlist mismatch: ${JSON.stringify(actual)}`);
});

check('allowlist does NOT contain any drop key', () => {
  for (const k of MUST_DROP) {
    assert.ok(!GA4_PARAM_ALLOWLIST.includes(k),
      `drop key leaked into allowlist: ${k}`);
  }
});

// --- 1. D4 keep：四個註冊維度通過 filter ---
check('D4 keep: link_type / provider / placement / link_label survive', () => {
  const input = {
    link_type: 'affiliate',
    provider: '通路王',
    placement: 'article_bottom',
    link_label: '博客來：實體書',
  };
  const out = filterGa4EventParams(input);
  for (const k of D4_KEEP) {
    assert.equal(out[k], input[k], `D4 field dropped: ${k}`);
  }
  assert.deepEqual(Object.keys(out).sort(), D4_KEEP.slice().sort());
});

// --- 2. P1 keep：bottom-nav 報表依賴欄位通過 filter ---
check('P1 keep: post_slug / surface / click_area / nav_direction / target_slug survive', () => {
  const input = {
    post_slug: 'we-media-myself2',
    surface: 'github_pages',
    click_area: 'article_bottom_nav',
    nav_direction: 'next',
    target_slug: 'daily-reading-habit-notes',
  };
  const out = filterGa4EventParams(input);
  for (const k of P1_KEEP) {
    assert.equal(out[k], input[k], `P1 field dropped: ${k}`);
  }
  assert.deepEqual(Object.keys(out).sort(), P1_KEEP.slice().sort());
});

// --- 3. Drop：deferred / 未知欄位被移除 ---
check('drop: link_url / target_url / outbound / link_source_key / unknown removed', () => {
  const input = {
    link_type: 'cross_site',
    post_slug: 'slug-a',
    link_url: 'https://example.com/redirect?uid1=blog',
    target_url: 'https://babel-lab.github.io/portable-blog-system/posts/x/',
    outbound: 'true',
    link_source_key: 'taipei-library',
    some_future_param: 'whatever',
  };
  const out = filterGa4EventParams(input);
  assert.ok(!('link_url' in out), 'link_url survived');
  assert.ok(!('target_url' in out), 'target_url survived');
  assert.ok(!('outbound' in out), 'outbound survived');
  assert.ok(!('link_source_key' in out), 'link_source_key survived');
  assert.ok(!('some_future_param' in out), 'unknown param survived');
  // allowlisted 同時存在者仍保留
  assert.equal(out.link_type, 'cross_site');
  assert.equal(out.post_slug, 'slug-a');
});

// --- 4. 可疑 value/key safety ---
check('suspicious: raw URL under non-allowlisted key does not survive', () => {
  const out = filterGa4EventParams({ random_url: 'https://evil.example/x' });
  assert.deepEqual(out, {}, 'raw URL under unknown key survived');
});

check('suspicious: email-like / user-id-like / token-like non-allowlisted keys removed', () => {
  const out = filterGa4EventParams({
    email: 'someone@example.com',
    user_id: 'u-123456',
    auth_token: 'Bearer abcdef123456',
    session_id: 'sess_987654',
  });
  assert.deepEqual(out, {}, 'suspicious non-allowlisted keys survived');
});

check('no over-filter: allowlisted field kept even if its value looks like text/url/email', () => {
  // link_label 是高基數人類文字（D4 by-design）；即使值含 @ 或 url 樣式也不應被丟。
  const input = {
    link_label: 'contact me at hi@example.com / see https://x.example',
    provider: '通路王',
  };
  const out = filterGa4EventParams(input);
  assert.equal(out.link_label, input.link_label, 'allowlisted link_label over-filtered');
  assert.equal(out.provider, '通路王');
});

// --- 5. 代表性 event payload（mirror 實際 emit 端） ---
check('payload: click_affiliate_cta keeps D4 + post_slug, drops link_url / outbound', () => {
  // mirror post-detail.ejs L93/L194
  const input = {
    post_slug: 'we-media-myself2',
    link_label: '博客來：實體書',
    link_type: 'affiliate',
    link_url: 'https://example.com/redirect?uid1=blog',
    outbound: 'true',
    provider: '通路王',
    placement: 'article_bottom',
  };
  const out = filterGa4EventParams(input);
  assert.deepEqual(Object.keys(out).sort(),
    ['link_label', 'link_type', 'placement', 'post_slug', 'provider'].sort());
  assert.ok(!('link_url' in out) && !('outbound' in out));
});

check('payload: click_related_link keeps D4 + post_slug, drops link_url / outbound / link_source_key', () => {
  // mirror post-detail.ejs L237
  const input = {
    post_slug: 'github-pages-blog-planning',
    link_label: '相關文章標題',
    link_type: 'cross_site',
    link_url: 'https://babel-lab.blogspot.com/2026/05/x.html',
    outbound: 'false',
    placement: 'related_links',
    link_source_key: 'some-source',
  };
  const out = filterGa4EventParams(input);
  assert.deepEqual(Object.keys(out).sort(),
    ['link_label', 'link_type', 'placement', 'post_slug'].sort());
  assert.ok(!('link_url' in out) && !('outbound' in out) && !('link_source_key' in out));
});

check('payload: article_bottom_nav keeps surface/click_area/nav_direction/post_slug/target_slug/link_label, drops target_url', () => {
  // mirror article-bottom-nav.ejs L18/24/29
  const input = {
    surface: 'github_pages',
    click_area: 'article_bottom_nav',
    nav_direction: 'previous',
    post_slug: 'we-media-myself2',
    target_slug: 'daily-reading-habit-notes',
    target_url: 'https://babel-lab.github.io/portable-blog-system/posts/x/',
    link_label: '上一篇標題',
  };
  const out = filterGa4EventParams(input);
  assert.deepEqual(Object.keys(out).sort(),
    ['click_area', 'link_label', 'nav_direction', 'post_slug', 'surface', 'target_slug'].sort());
  assert.ok(!('target_url' in out), 'target_url survived bottom-nav payload');
});

// --- 6. 邊界輸入 ---
check('edge: non-object / null / undefined → empty object', () => {
  assert.deepEqual(filterGa4EventParams(null), {});
  assert.deepEqual(filterGa4EventParams(undefined), {});
  assert.deepEqual(filterGa4EventParams('x'), {});
  assert.deepEqual(filterGa4EventParams(123), {});
});

check('edge: empty object → empty object', () => {
  assert.deepEqual(filterGa4EventParams({}), {});
});

// --- 結果 ---
if (failures.length > 0) {
  console.error(`check-ga4-param-allowlist: ${passed} passed, ${failures.length} FAILED`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log(`check-ga4-param-allowlist: ${passed}/${passed} passed`);
