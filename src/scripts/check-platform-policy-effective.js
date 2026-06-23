// Phase 20260624-am-sp9a-platform-policy-effective-derive-helper-a：
//   platform-policy-effective helper（SP-9a）regression smoke harness。
//   per docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md
//
// 目的：鎖住 src/scripts/platform-policy-effective.js 之純函式契約：
//   1. inherit：leaf === 'inherit' → source 'inherit' / value null
//   2. explicit override：合法 enum / boolean / canonical / note → source 'override' / value 原值
//   3. missing platform / missing field → source 'absent' / value null
//   4. invalid shape：platform entry 非 object、leaf 非合法 enum、leaf 為巢狀 object → 'invalid'
//   5. boolean false override（區別於缺省）→ source 'override' / value false
//   6. secret-like key safety：suspicious platform key / nested key → source 'secret' / value null；
//      **永不**讀 / **永不** echo value（serialized 不出現 secret 字串）
//   7. derivePlatformPolicyEffective summary：per-platform recognized / secretLike / raw / effective / source
//
// 約束（mirror check-page-metadata-summary.js / check-include-in-sitemap.js 慣例）：
//   - zero new dependency（僅 node:assert）
//   - 不改 production posts / registry / build / package
//   - 自含（不加 package.json script；by `node src/scripts/check-platform-policy-effective.js` 跑）
//
// 執行：node src/scripts/check-platform-policy-effective.js
//   - exit 0 = 全 pass；exit 1 = 任一 case fail

import { strict as assert } from 'node:assert';
import {
  resolvePlatformPolicyValue,
  derivePlatformPolicyEffective,
} from './platform-policy-effective.js';

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

// ─── 1. 缺省 / 非 object policy ─────────────────────────────────────────────
check('1 fm null → absent', () => {
  const r = resolvePlatformPolicyValue(null, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'absent' });
});

check('2 fm without platformPolicy → absent', () => {
  const r = resolvePlatformPolicyValue({ contentKind: 'post' }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'absent' });
});

check('3 platformPolicy non-object (string) → absent (SP-8 rule 3 catches the warn)', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: 'nope' }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'absent' });
});

check('4 platform missing in policy → absent', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { blogger: { indexing: 'index' } } }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'absent' });
});

check('5 nested field missing → absent', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { canonical: 'https://example.com/x' } } }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'absent' });
});

// ─── 2. inherit semantics ──────────────────────────────────────────────────
check('6 indexing=inherit → inherit / null', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { indexing: 'inherit' } } }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'inherit' });
});

check('7 includeInListings=inherit → inherit / null', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { includeInListings: 'inherit' } } }, 'github', 'includeInListings');
  assert.deepEqual(r, { value: null, source: 'inherit' });
});

check('8 canonical=inherit → inherit / null', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { future: { canonical: 'inherit' } } }, 'future', 'canonical');
  assert.deepEqual(r, { value: null, source: 'inherit' });
});

// ─── 3. explicit override (legit enum / boolean / canonical / note) ────────
check('9 indexing=noindex-follow → override / noindex-follow', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { indexing: 'noindex-follow' } } }, 'github', 'indexing');
  assert.deepEqual(r, { value: 'noindex-follow', source: 'override' });
});

check('10 indexing=index → override / index', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { blogger: { indexing: 'index' } } }, 'blogger', 'indexing');
  assert.deepEqual(r, { value: 'index', source: 'override' });
});

check('11 includeInListings=true → override / true', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { includeInListings: true } } }, 'github', 'includeInListings');
  assert.deepEqual(r, { value: true, source: 'override' });
});

check('12 includeInListings=false → override / false (boolean false ≠ absent)', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { blogger: { includeInListings: false } } }, 'blogger', 'includeInListings');
  assert.deepEqual(r, { value: false, source: 'override' });
});

check('13 includeInSitemap=false → override / false', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { includeInSitemap: false } } }, 'github', 'includeInSitemap');
  assert.deepEqual(r, { value: false, source: 'override' });
});

check('14 includeInFeeds=true → override / true', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { future: { includeInFeeds: true } } }, 'future', 'includeInFeeds');
  assert.deepEqual(r, { value: true, source: 'override' });
});

check('15 canonical=non-empty string → override / string', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { canonical: 'https://example.com/y' } } }, 'github', 'canonical');
  assert.deepEqual(r, { value: 'https://example.com/y', source: 'override' });
});

check('16 note=string → override / string', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { future: { note: 'preserved' } } }, 'future', 'note');
  assert.deepEqual(r, { value: 'preserved', source: 'override' });
});

// ─── 4. invalid shape / leaf ───────────────────────────────────────────────
check('17 platform entry non-object (string) → invalid', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: 'noindex' } }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('18 platform entry non-object (array) → invalid', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: ['a'] } }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('19 indexing=unknown enum → invalid', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { indexing: 'sometimes' } } }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('20 indexing=non-string → invalid', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { indexing: 5 } } }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('21 includeInListings=string "maybe" → invalid (boolean / inherit only)', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { blogger: { includeInListings: 'maybe' } } }, 'blogger', 'includeInListings');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('22 canonical=empty string → invalid', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { canonical: '   ' } } }, 'github', 'canonical');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('23 canonical=non-string (number) → invalid', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { canonical: 123 } } }, 'github', 'canonical');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('24 note=non-string → invalid', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { future: { note: 2026 } } }, 'future', 'note');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('25 nested object leaf → invalid (SP-8 nested-object-deferred; do not recurse)', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { indexing: { deep: 'x' } } } }, 'github', 'indexing');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

check('26 nested array leaf → invalid', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { includeInListings: [true] } } }, 'github', 'includeInListings');
  assert.deepEqual(r, { value: null, source: 'invalid' });
});

// ─── 5. caller bug防呆：unrecognized platform / field ───────────────────────
check('27 unrecognized platform key (wordpress) → absent (resolver守門)', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { wordpress: { indexing: 'index' } } }, 'wordpress', 'indexing');
  assert.deepEqual(r, { value: null, source: 'absent' });
});

check('28 unrecognized field name → absent', () => {
  const r = resolvePlatformPolicyValue({ platformPolicy: { github: { priority: 'high' } } }, 'github', 'priority');
  assert.deepEqual(r, { value: null, source: 'absent' });
});

// ─── 6. secret-safety（platform key / nested key 命中 SUSPICIOUS_KEYS）─────
check('29 suspicious platform key (token) → secret / null; value never read', () => {
  const fm = { platformPolicy: { token: 'SECRET-TOP-VALUE' } };
  const r = resolvePlatformPolicyValue(fm, 'token', 'indexing');
  // platform 不在 PLATFORM_POLICY_PLATFORM_KEYS → resolver 直接回 absent；secret 偵測在 derive summary
  assert.deepEqual(r, { value: null, source: 'absent' });
});

check('30 suspicious nested field name (apiKey) → secret / null; value never echoed', () => {
  // 即使 platform recognized + nested 名稱看似可疑，resolver 因 field 不在 PLATFORM_POLICY_NESTED_KEYS
  //   會回 'absent'（caller bug 防呆）。secret 顯示由 derivePlatformPolicyEffective 處理。
  const fm = { platformPolicy: { github: { apiKey: 'SECRET-NESTED-VALUE' } } };
  const r = resolvePlatformPolicyValue(fm, 'github', 'apiKey');
  assert.deepEqual(r, { value: null, source: 'absent' });
});

// ─── 7. derivePlatformPolicyEffective summary projection ────────────────────
check('31 summary: absent → present false / isObject false / platforms []', () => {
  const s = derivePlatformPolicyEffective({ contentKind: 'post' });
  assert.equal(s.present, false);
  assert.equal(s.isObject, false);
  assert.deepEqual(s.platforms, []);
});

check('32 summary: platformPolicy string → present true / isObject false', () => {
  const s = derivePlatformPolicyEffective({ platformPolicy: 'nope' });
  assert.equal(s.present, true);
  assert.equal(s.isObject, false);
  assert.deepEqual(s.platforms, []);
});

check('33 summary: recognized github explicit override (indexing + includeInListings)', () => {
  const s = derivePlatformPolicyEffective({
    platformPolicy: {
      github: { indexing: 'noindex-follow', includeInListings: false },
    },
  });
  assert.equal(s.isObject, true);
  assert.equal(s.platforms.length, 1);
  const g = s.platforms[0];
  assert.equal(g.name, 'github');
  assert.equal(g.recognized, true);
  assert.equal(g.isObject, true);
  assert.equal(g.secretLike, false);
  assert.equal(g.indexing.raw, 'noindex-follow');
  assert.equal(g.indexing.effective, 'noindex-follow');
  assert.equal(g.indexing.source, 'override');
  assert.equal(g.includeInListings.raw, 'false');
  assert.equal(g.includeInListings.effective, false);
  assert.equal(g.includeInListings.source, 'override');
});

check('34 summary: inherit leaf → effective null / source inherit / raw "inherit"', () => {
  const s = derivePlatformPolicyEffective({
    platformPolicy: { blogger: { indexing: 'inherit', includeInListings: 'inherit' } },
  });
  const b = s.platforms[0];
  assert.equal(b.indexing.raw, 'inherit');
  assert.equal(b.indexing.effective, null);
  assert.equal(b.indexing.source, 'inherit');
  assert.equal(b.includeInListings.raw, 'inherit');
  assert.equal(b.includeInListings.effective, null);
  assert.equal(b.includeInListings.source, 'inherit');
});

check('35 summary: future canonical/note不影響 indexing/includeInListings 投影', () => {
  const s = derivePlatformPolicyEffective({
    platformPolicy: { future: { canonical: 'https://example.com/x', note: 'reserved' } },
  });
  const f = s.platforms[0];
  assert.equal(f.recognized, true);
  // indexing / includeInListings 皆未填 → absent
  assert.equal(f.indexing.raw, '');
  assert.equal(f.indexing.source, 'absent');
  assert.equal(f.includeInListings.raw, '');
  assert.equal(f.includeInListings.source, 'absent');
});

check('36 summary: platform entry non-object → isObject false / sources invalid', () => {
  const s = derivePlatformPolicyEffective({ platformPolicy: { github: 'noindex' } });
  const g = s.platforms[0];
  assert.equal(g.isObject, false);
  assert.equal(g.indexing.source, 'invalid');
  assert.equal(g.includeInListings.source, 'invalid');
});

check('37 summary: unrecognized platform key (wordpress) → recognized false; raw 仍顯示, effective null', () => {
  const s = derivePlatformPolicyEffective({
    platformPolicy: { wordpress: { indexing: 'index', includeInListings: false } },
  });
  const w = s.platforms[0];
  assert.equal(w.name, 'wordpress');
  assert.equal(w.recognized, false);
  assert.equal(w.secretLike, false);
  // raw 顯示原值，但 effective 不推導（policy 未認可此 platform key）
  assert.equal(w.indexing.raw, 'index');
  assert.equal(w.indexing.effective, null);
  assert.equal(w.indexing.source, 'unrecognized-platform');
  assert.equal(w.includeInListings.raw, 'false');
  assert.equal(w.includeInListings.effective, null);
  assert.equal(w.includeInListings.source, 'unrecognized-platform');
});

check('38 summary secret-safety: suspicious platform key (token) → secretLike, raw empty, secret source, value never echoed', () => {
  const fm = { platformPolicy: { token: { indexing: 'noindex-follow' } } };
  const s = derivePlatformPolicyEffective(fm);
  const t = s.platforms[0];
  assert.equal(t.name, 'token');
  assert.equal(t.recognized, false);
  assert.equal(t.secretLike, true);
  assert.equal(t.indexing.raw, '');
  assert.equal(t.indexing.effective, null);
  assert.equal(t.indexing.source, 'secret');
  assert.equal(t.includeInListings.raw, '');
  assert.equal(t.includeInListings.source, 'secret');
  // serialized 不含 'noindex-follow' 之 secret 子物件 leak（雖然 'noindex-follow' 本身非 secret，
  //   驗證的是「不讀 sub 物件」契約 → JSON 不含該值）
  const ser = JSON.stringify(s);
  assert.equal(ser.includes('noindex-follow'), false);
});

check('39 summary secret-safety: suspicious nested key with secret-looking value → not echoed', () => {
  // recognized github + suspicious nested key 'access_token'：SP-8 已 warn；
  //   summary 之 indexing/includeInListings 投影本身只讀已知 nested 名稱，故 access_token 之 value
  //   不會在投影內出現。
  const fm = {
    platformPolicy: {
      github: {
        indexing: 'noindex-follow',
        access_token: 'SECRET-NESTED-VALUE-DO-NOT-LEAK',
      },
    },
  };
  const s = derivePlatformPolicyEffective(fm);
  const ser = JSON.stringify(s);
  assert.equal(ser.includes('SECRET-NESTED-VALUE-DO-NOT-LEAK'), false);
  // indexing 之 override 仍正常
  const g = s.platforms[0];
  assert.equal(g.indexing.effective, 'noindex-follow');
  assert.equal(g.indexing.source, 'override');
});

// ─── 8. multi-platform combined（mirror SP-8 minimal-valid fixture）────────
check('40 summary: full minimal-valid fixture shape', () => {
  const fm = {
    platformPolicy: {
      github: { indexing: 'inherit', includeInListings: 'inherit', includeInSitemap: 'inherit' },
      blogger: { indexing: 'noindex-nofollow', includeInListings: false },
      future: { indexing: 'inherit', canonical: 'inherit', note: '保留供未來平台使用' },
    },
  };
  const s = derivePlatformPolicyEffective(fm);
  assert.equal(s.present, true);
  assert.equal(s.isObject, true);
  assert.equal(s.platforms.length, 3);
  const blogger = s.platforms.find((p) => p.name === 'blogger');
  assert.equal(blogger.indexing.effective, 'noindex-nofollow');
  assert.equal(blogger.indexing.source, 'override');
  assert.equal(blogger.includeInListings.effective, false);
  const github = s.platforms.find((p) => p.name === 'github');
  assert.equal(github.indexing.source, 'inherit');
  assert.equal(github.includeInListings.source, 'inherit');
  const future = s.platforms.find((p) => p.name === 'future');
  // future 未填 indexing / includeInListings → absent（canonical/note 不影響此兩欄投影）
  assert.equal(future.indexing.source, 'inherit'); // indexing: inherit
  assert.equal(future.includeInListings.source, 'absent');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
