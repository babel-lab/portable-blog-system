# 2026-05-25 Reverse UTM Code-Level Smoke Plan

> Phase: `20260525-night-1-reverse-utm-fixture-a`
> 模式：docs-only（純設計文件落地；**不**實作 smoke script；**不**新增測試框架；**不**改 src / content / settings / dist / deploy）
> 來源：本文件為 reverse UTM 缺失驗證層補強之設計文件；屬 `docs/reverse-utm-fixture-plan.md` 之**補位**而非取代。
> 對應上層：
> - `CLAUDE.md` §16.4（Blogger → GitHub reverse UTM 規則；source landed pm-24a/b/c；un-deployed；dormant）
> - `docs/reverse-utm-fixture-plan.md`（production-grade content fixture / Blogger repost / GA4 validation SOP）
> - `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan §1-§12）
> - `docs/20260524-ga4-reverse-utm-observation.md`（GA4 reverse UTM 觀察 SOP）
> - `docs/20260525-reverse-utm-readiness-snapshot.md`（5/25 am readiness snapshot）

---

## §1 文件目的與邊界

### 1.1 本文件是什麼

本文件為 **reverse UTM 缺失之 code-level fixture-free smoke 驗證層** 之設計文件。屬 docs-only / 規劃性質；保留為未來如需建立 source-grade 單元驗證 harness 之啟動依據。

### 1.2 本文件不是什麼

- ❌ **不是** smoke script 之實作（本批僅落地設計文件；script 本身未建立）
- ❌ **不是**新測試框架引入提案（明確拒絕引入 vitest / jest / mocha 等）
- ❌ **不是**對 `src/scripts/ga4-url-builder.js` 之修改提案（本批不改 source；若未來 smoke 需要調整 export，需另開 phase 評估）
- ❌ **不是**對 reverse UTM 規格之修改（規格仍以 `CLAUDE.md` §16.4 + `docs/blogger-to-github-reverse-utm-plan.md` 為準）
- ❌ **不取代** `docs/reverse-utm-fixture-plan.md`（該文件處理 content fixture / Blogger 重貼 / GA4 driven 驗收；本文件處理 source-grade in-memory assertion）

### 1.3 本 phase 之嚴格邊界

本 phase 屬 docs-only：

- ❌ 不建立 fixture article（不新增 `content/blogger/posts/*.md` / `.publish.json` / `.fb.md`）
- ❌ 不修改任何文章 `status` / `draft` / `publishTargets`
- ❌ 不修改 `src/`（含 `ga4-url-builder.js` / `build-blogger.js` / `build-github.js`）
- ❌ 不修改 `content/settings/`
- ❌ 不執行 `npm run build*` / `validate:content` / `report:*`
- ❌ 不重貼 Blogger 後台
- ❌ 不驗 GA4 Realtime
- ❌ 不 deploy / 不 push gh-pages
- ❌ 不 commit / 不 push（待 user 決定）
- ❌ 不新增任何測試框架 dependency 至 `package.json`
- ✅ 唯一允許：新增本檔 `docs/20260525-reverse-utm-code-smoke-plan.md`

---

## §2 背景

### 2.1 reverse UTM 三層驗證現況

reverse UTM 之驗證可拆三層：

| 層 | 對應驗證類型 | 現況 | 對應 SOP / 文件 |
|---|---|---|---|
| **L1 Source code 層**（pure function 單元行為）| in-memory assertion；不依賴 content / fixture / build | ❌ **缺失** | （本文件為此層之設計依據）|
| **L2 Build pipeline 層**（render 結果 vs spec）| grep `dist-blogger/posts/*/post.html` 比對 UTM key / target / rel | 🟡 部分（fixture deadlock）；建構機制本身 ✅ pm-24d 已驗 | `docs/reverse-utm-fixture-plan.md` §5.1 |
| **L3 Production runtime 層**（Blogger 後台 → GA4 Realtime）| 手動重貼 + 自我點擊 + GA4 觀察 | ❌ 尚未啟動（dormant；fixture deadlock）| `docs/20260524-blogger-repost-checklist.md` + `docs/20260524-ga4-reverse-utm-observation.md` |

本文件補的是 **L1 缺失**。L2 / L3 已有 docs trail，且 L2 / L3 啟動皆需 content fixture（per `reverse-utm-fixture-plan.md` §2 之既有 invariant deadlock）。L1 之優勢在於：

- **fixture-free**：不需要 ready full-mode Blogger post；不需要 GitHub cross-link；不需要等自然書評
- **deadlock-free**：與 `reverse-utm-fixture-plan.md` §10.2 之 fixture deadlock 完全解耦
- **non-destructive**：不碰 content / 不改 status / 不覆蓋已發布文章
- **可重複執行**：每次跑都應該回傳一致結果，無 side effect
- **快速回饋**：執行時間應 < 1 秒（純 in-memory）

### 2.2 reverse UTM source code 現況（不再贅述細節）

per `docs/20260525-reverse-utm-readiness-snapshot.md` §3 / §4：

- ✅ pm-24a `7e1d356`：`src/scripts/ga4-url-builder.js` 新增 `isGithubCrossLink` + `applyCrossSiteUtm` 加 `direction` 參數
- ✅ pm-24b `e2309e9`：`src/scripts/build-blogger.js` 新增 `deriveRenderedCrossLinks`（direction='to_github'）
- ✅ pm-24c `7c769fe`：`src/views/blogger/blogger-post-full.ejs` 讀 `relatedLinksRendered`
- ✅ pm-24d build smoke：byte-identical-modulo-builtAt
- 🟡 live but dormant（無 fixture 觸發；non-regression default state）

### 2.3 本 repo 測試框架現況

`package.json` 之 `scripts` 與 `dependencies` / `devDependencies` 完整盤點結果：

| 類別 | 結果 |
|---|---|
| `devDependencies` | **空** |
| `scripts` 內含 `test*` | **無** |
| `vitest` / `jest` / `mocha` / `tap` / `node:test` runner 整合 | **無** |
| `__tests__/` 目錄 | **不存在** |
| `*.test.js` 檔案 | **0 個** |
| `*.spec.js` 檔案 | **0 個** |
| `tests/` 目錄 | **不存在** |
| 既有「smoke」/「assert」純函式驗證 script | **無** |

結論：**本 repo 完全無既有測試模式**。所有驗證皆透過：
- `npm run validate:content`（schema / content 規則驗證）
- `npm run build*`（build 成功 + stderr / output 計數 + grep dist）
- `npm run report:*`（產出文字 report）
- 手動 grep + 比對 docs invariant

per `CLAUDE.md` §4「第一版不得使用 React / Vue / Astro / Tailwind / 後端」之精神延伸，**本批亦不主動引入測試框架**；若未來實作 smoke script，**僅使用 Node built-in `node:assert`**（無 npm install 需求）。

---

## §3 驗證目標

未來若依本文件實作 smoke script，應驗證以下 6 項 reverse UTM 規格：

### 3.1 `isGithubCrossLink` 正確辨識

| # | 輸入 | 預期結果 | 對應 spec |
|---|------|---------|---------|
| 3.1.1 | `https://babel-lab.github.io/posts/foo/`（hostname = `settings.site.githubSiteUrl` host）+ valid settings | `true` | `ga4-url-builder.js:111-122` + `CLAUDE.md` §16.4「判斷依據：URL hostname 等於 `settings.site.githubSiteUrl` 之 host」|
| 3.1.2 | `https://example.com/foo`（非 GitHub host）| `false` | 同上 |
| 3.1.3 | `https://blogger.lab.example/foo`（Blogger host 而非 GitHub）| `false` | 同上 |
| 3.1.4 | `not-a-url` / `""` / `null` / `undefined` / `42` / `{}` | `false`（不 throw）| `ga4-url-builder.js:112` 之 `typeof !== 'string'` guard |
| 3.1.5 | settings 缺 `site.githubSiteUrl` | `false`（不 throw）| `ga4-url-builder.js:113-114` 之 guard |
| 3.1.6 | settings = `{}` / `null` / `undefined` | `false`（不 throw）| optional chaining |

### 3.2 `applyCrossSiteUtm({direction:'to_github'})` 補 UTM

| # | 輸入 | 預期結果 |
|---|------|---------|
| 3.2.1 | GitHub cross-link + slot=`related_links` + 無既有 UTM | `applied: true` + `url` 含 4 UTM keys + `target: '_blank'` + `rel` 含 3 token |
| 3.2.2 | GitHub cross-link + slot=`other_links` + 無既有 UTM | `applied: true` + `utm_content=other_links` |
| 3.2.3 | 非 GitHub host（Blogger / 第三方）+ direction=to_github | `applied: false` + 不改動 url / target / rel |
| 3.2.4 | GitHub cross-link 但已含 `utm_source=other` | 策略 A：`applied: false` + UTM 不覆寫 + 仍套 target=`_blank` + rel merge |
| 3.2.5 | GitHub cross-link 但已含 `utm_medium` / `utm_campaign` / `utm_content`（單獨任一）| 同 3.2.4 策略 A |
| 3.2.6 | direction 未傳（default='to_blogger'）| backward compat：不應誤啟動 reverse UTM；行為應為既有 GitHub→Blogger 邏輯 |

### 3.3 `utm_source` 值

| direction | 預期 `utm_source` | 對應 spec |
|---|---|---|
| `to_github` | `blogger` | `ga4-url-builder.js:175` + `CLAUDE.md` §16.4 |
| `to_blogger`（default）| `github_pages` | `CLAUDE.md` §16.4 forward 段 |

### 3.4 `utm_medium` / `utm_campaign` / `utm_content` 值

兩方向共同：

| key | 預期值 | 對應 spec |
|---|---|---|
| `utm_medium` | `referral` | `ga4-url-builder.js:177` + `CLAUDE.md` §16.4 |
| `utm_campaign` | `portable_blog_system` | `ga4-url-builder.js:178` + `CLAUDE.md` §16.4 |
| `utm_content` | `related_links`（relatedLinks aside 內）或 `other_links`（otherLinks aside 內）| `ga4-url-builder.js:179`（由 caller `slot` 參數決定）|

⚠️ 此處應特別驗 `utm_content` **不**為其他值（如 `internal_referral` / `blogger_to_github`）— 那是 legacy `buildBloggerToGithubUrl` 之 forward UTM scheme（per `reverse-utm-fixture-plan.md` §5.1.3）。

### 3.5 `target` / `rel` / `mergeRel` 行為

| # | 輸入 | 預期結果 |
|---|------|---------|
| 3.5.1 | applied=true 時 | `target: '_blank'` |
| 3.5.2 | applied=false 但 hasUtm 策略 A 觸發 | `target: '_blank'`（仍套）|
| 3.5.3 | applied=false 因 hostname 不 match | `target: null` |
| 3.5.4 | `mergeRel('', ['nofollow', 'noopener', 'noreferrer'])` | `'nofollow noopener noreferrer'`（順序保留）|
| 3.5.5 | `mergeRel('sponsored', ['nofollow', 'noopener', 'noreferrer'])` | `'sponsored nofollow noopener noreferrer'`（既有 token 保留 + 不重複）|
| 3.5.6 | `mergeRel('nofollow', ['nofollow', 'noopener'])` | `'nofollow noopener'`（不重複）|
| 3.5.7 | `mergeRel('', [])` | `''` |
| 3.5.8 | `mergeRel(null, ['noopener'])` / `mergeRel(undefined, ['noopener'])` | `'noopener'`（不 throw）|

### 3.6 非 GitHub cross-link 不誤注入

⚠️ **核心 invariant**（per `reverse-utm-fixture-plan.md` §5.1.2 + `CLAUDE.md` §16.4「未受影響範圍」）：

| # | 輸入 | 預期結果 |
|---|------|---------|
| 3.6.1 | Blogger 同站連結（host=`settings.site.bloggerSiteUrl`）+ direction=to_github | `applied: false`；url **不**含 `utm_source=blogger` |
| 3.6.2 | 第三方 external link（如 `https://example.com/`）+ direction=to_github | `applied: false`；url **不**含任何 reverse UTM |
| 3.6.3 | 第三方 affiliate / sponsor link + direction=to_github | `applied: false`；url 不被改動 |

此項對應 `reverse-utm-fixture-plan.md` §5.1.2 之「非 GitHub cross-link / 同站連結 / 第三方非 GitHub external link 不可含 `utm_source=blogger`」之 production-side 驗證 — L1 smoke 可在 source 層提早攔截。

---

## §4 建議未來 script 形式

### 4.1 命名與位置

| 項目 | 建議值 |
|---|---|
| **檔名** | `src/scripts/smoke-reverse-utm.js`（與 `validate-content.js` / `report-*.js` 同層；非 `src/scripts/smokes/`，避免引入新目錄）|
| **執行方式** | `node src/scripts/smoke-reverse-utm.js`（與既有 `check:*` / `report:*` script 同型）|
| **package.json 新增 script**（可選）| `"smoke:reverse-utm": "node src/scripts/smoke-reverse-utm.js"`（屬選擇性；直接 `node ...` 亦可）|

### 4.2 技術約束

| 項目 | 約束 |
|---|---|
| **assert library** | **僅** `node:assert` 之 `strict` mode（`import { strict as assert } from 'node:assert'`）；**不**引入 vitest / jest / mocha / chai |
| **dependencies / devDependencies 新增** | **0**（本 smoke 設計目標為 zero new dependency）|
| **I/O** | **無**（不讀 `content/` / 不讀 `dist*/` / 不讀 `content/settings/`；所有 settings / inputs 為 in-memory literal）|
| **side effect** | **無**（不寫檔；不 console.log warning / error 以外訊息；exit code 0 = 全 pass / 非 0 = 失敗）|
| **執行時間** | 目標 < 1 秒 |
| **import 範圍** | 僅 `src/scripts/ga4-url-builder.js` 之 named exports；**不** import `build-blogger.js` / `build-github.js`（避免帶入 file I/O）|

### 4.3 設計範例（pseudo-code；非實作）

> ⚠️ 以下為**設計參考**，**非**可直接執行之 production code；實作時應另開 phase 仔細實作。

```js
// 範例：未來實作參考（非本批落地）
import { strict as assert } from 'node:assert';
import {
  isGithubCrossLink,
  applyCrossSiteUtm,
  mergeRel,
} from './ga4-url-builder.js';

const settings = {
  site: {
    githubSiteUrl: 'https://babel-lab.github.io',
    bloggerSiteUrl: 'https://babel-lab.blogspot.com',
  },
};

// §3.1.1
assert.equal(isGithubCrossLink('https://babel-lab.github.io/posts/foo/', settings), true);
// §3.1.2
assert.equal(isGithubCrossLink('https://example.com/foo', settings), false);

// §3.2.1
const r1 = applyCrossSiteUtm({
  url: 'https://babel-lab.github.io/posts/foo/',
  settings,
  slot: 'related_links',
  existingRel: '',
  direction: 'to_github',
});
assert.equal(r1.applied, true);
assert.equal(r1.target, '_blank');
const u1 = new URL(r1.url);
assert.equal(u1.searchParams.get('utm_source'), 'blogger');
assert.equal(u1.searchParams.get('utm_medium'), 'referral');
assert.equal(u1.searchParams.get('utm_campaign'), 'portable_blog_system');
assert.equal(u1.searchParams.get('utm_content'), 'related_links');

// §3.6.1 — 核心 invariant
const r2 = applyCrossSiteUtm({
  url: 'https://babel-lab.blogspot.com/2026/05/post.html',
  settings,
  slot: 'related_links',
  existingRel: '',
  direction: 'to_github',
});
assert.equal(r2.applied, false);
assert.ok(!r2.url.includes('utm_source=blogger'));

console.log('[smoke-reverse-utm] all assertions passed');
```

實際實作時應補齊 §3.1 ~ §3.6 全 6 表之 cases；分組命名清楚以利失敗時定位。

### 4.4 import 介面相容性檢查

未來實作 smoke 前，須先確認以下 named exports 仍可直接 import（per 2026-05-25 之 `src/scripts/ga4-url-builder.js`）：

| export | 簽章 | 用途 | 本批檢查狀態 |
|---|---|---|---|
| `isGithubCrossLink(rawUrl, settings)` | 純函式 | §3.1 | ✅ 已 export（line 111-122）|
| `isBloggerCrossLink(rawUrl, settings)` | 純函式 | §3.6.1 對比 | ✅ 已 export（line 94-105）|
| `applyCrossSiteUtm({url, settings, slot, existingRel, direction})` | 純函式 | §3.2 / §3.3 / §3.4 / §3.5 / §3.6 | ✅ 已 export（line 155-181）|
| `mergeRel(primary, additions)` | 純函式 | §3.5.4 ~ §3.5.8 | ✅ 已 export（line 126-140）|

⚠️ 若未來實作 smoke 時發現 function export 簽章不適合 in-memory 測試（如：需要打斷內部 console.log；需要 mock；需要存取 private state），**先不要為了 smoke 改 source**；改採以下二擇一：

1. 另開 phase 評估「`ga4-url-builder.js` 之 testability 重構是否值得」並產 plan 文件
2. 在 smoke script 中以更彈性的 wrapper / harness 包裝（仍不改 source）

**不可**為了 smoke 而直接改 `ga4-url-builder.js` 之 exports / 簽章 / 內部邏輯（per `CLAUDE.md` §27「不得未經要求自動重構」）。

### 4.5 失敗回饋與 CI 整合（非本批 scope）

未來如需擴展：

- **本機**：`node src/scripts/smoke-reverse-utm.js` 之 exit code 0 = pass / 非 0 = fail
- **CI**：可加入 GitHub Actions（若未來啟用）之 pre-deploy gate；但**第一版**不引入 CI（per `CLAUDE.md` §4 第一版限制精神）
- **整合到既有 build pipeline**：可選；若整合，建議掛 `prebuild:blogger` hook，使 `build:blogger` 前自動跑 smoke；但**非本批決定**

---

## §5 不做事項

明確列出本批**不做**之動作（避免未來誤判本批 scope）：

| 項目 | 狀態 |
|---|---|
| 建立 fixture article（如 `content/blogger/posts/reverse-utm-fixture.md`）| ❌ 不做 |
| 修改既有任何文章之 `status` / `draft` / `mode` / `relatedLinks` / `otherLinks` | ❌ 不做 |
| 修改 `20260525-draft-book-review.{md,publish.json,fb.md}`（本日 PM 建立之 draft）| ❌ 不做 |
| 修改 `20260515-we-media-myself2.{md,publish.json,fb.md}`（唯一 ready full-mode Blogger post）| ❌ 不做 |
| 修改 `content/settings/`（含 `site.config.json` / `ga4.config.json` / `promotion.config.json`）| ❌ 不做 |
| 修改 `src/`（含 `ga4-url-builder.js` / `build-blogger.js` / `build-github.js` / 任何 views / styles / js）| ❌ 不做 |
| 修改 `package.json` / `vite.config.js` / `.gitignore` | ❌ 不做 |
| 新增測試框架 dependency（vitest / jest / mocha 等）| ❌ 不做 |
| 新增 `__tests__/` / `tests/` 目錄 | ❌ 不做 |
| 新增 `*.test.js` / `*.spec.js` 檔案 | ❌ 不做 |
| 實作 `src/scripts/smoke-reverse-utm.js`（本批僅落地設計文件）| ❌ 不做 |
| 跑 `npm run build*` / `npm run validate:content` / `npm run report:*` / `npm run check:*` | ❌ 不做 |
| 重貼 Blogger 後台（Theme CSS / per-post HTML）| ❌ 不做 |
| 驗 GA4 Realtime / DebugView / Reports | ❌ 不做 |
| 操作 GA4 後台設定 | ❌ 不做 |
| Deploy gh-pages | ❌ 不做 |
| Push origin/main | ❌ 不做（待 user 後續決定 commit / push 時機）|
| 修改 `.claude/` | ❌ 不做 |
| 修改其他既有 docs（含 `reverse-utm-fixture-plan.md` / `blogger-to-github-reverse-utm-plan.md` / 5/24 三件 SOP / 5/25 readiness snapshot 等）| ❌ 不做 |
| 啟動 reverse UTM fixture phase 1-6（per `reverse-utm-fixture-plan.md` §10.5）| ❌ 不做 |

唯一允許之動作：✅ 新增本檔 `docs/20260525-reverse-utm-code-smoke-plan.md`。

---

## §6 與 `reverse-utm-fixture-plan.md` 的關係

### 6.1 分工

| 維度 | `reverse-utm-fixture-plan.md` | 本文件 |
|---|---|---|
| **驗證層** | L2（build pipeline）+ L3（production runtime / GA4）| L1（source code 單元）|
| **需要 content fixture** | ✅ 是（plan §3 production-grade fixture 設計原則）| ❌ 否（fixture-free）|
| **需要 Blogger 後台重貼** | ✅ 是（plan §6 啟動條件 + §10.5 Phase 4）| ❌ 否 |
| **需要 GA4 Realtime** | ✅ 是（plan §5.2 production 驗收 + §10.5 Phase 5）| ❌ 否 |
| **執行頻率** | 一次性（fixture 啟動驗收）| 可重複（每次 source 變動皆可跑）|
| **執行時間** | 數天〜數週（含等讀者流量）| < 1 秒 |
| **與 fixture deadlock 之關係** | 受限於 deadlock（per plan §10.2）| 完全解耦 |
| **驗證 invariant** | 結果端（`dist-blogger/posts/*/post.html` + GA4 events）| 行為端（pure function input → output）|
| **失敗對應之修補** | 通常為 content / Blogger 後台問題 | 通常為 source code regression |

### 6.2 互補而非取代

兩文件**互補**，不互相取代：

- 即使 L1 smoke 全 pass，仍**不**保證 L2 build pipeline 與 L3 production runtime 行為正確
  - L2 失敗 case 例：build-blogger.js 之 `deriveRenderedCrossLinks` 未正確掛接到 `renderFullPost` caller
  - L3 失敗 case 例：Blogger 後台未重貼 / GA4 measurement ID 配置錯誤 / Blogger CDN cache
- 即使 L2 build pipeline 驗證通過（如 pm-24d），仍**不**保證未來 source 重構不破壞 L1 純函式行為
  - L1 失敗 case 例：未來重構 `applyCrossSiteUtm` 時不慎將策略 A 改為「永遠覆寫 UTM」，build pipeline 仍可能因 fixture 無 utm 而表面通過

完整驗證 = L1 ∧ L2 ∧ L3。本文件補 L1；`reverse-utm-fixture-plan.md` 處理 L2 / L3。

### 6.3 啟動順序建議（非本批落地）

若未來決定主動啟動 reverse UTM 驗證：

```
[step 0] 跑 L1 smoke（本文件規劃；fixture-free；< 1 秒）
         ↓
        L1 pass？
         ├─ No → 修 source 後重 step 0
         └─ Yes → 進 step 1
[step 1] 依 reverse-utm-fixture-plan.md §10.5 Phase 1-3 建立 fixture + L2 build verify
         ↓
[step 2] 依 reverse-utm-fixture-plan.md §10.5 Phase 4-5 重貼 Blogger + L3 GA4 Realtime
         ↓
[step 3] 依 reverse-utm-fixture-plan.md §10.5 Phase 6 落地 verification report
```

L1 為最早可執行且最便宜之 gate；若 L1 失敗，後續 L2 / L3 皆無意義。

### 6.4 docs cross-link

| 文件 | 角色 | 與本文件之 cross-link 方向 |
|---|---|---|
| `docs/reverse-utm-fixture-plan.md` | L2 + L3 SOP 主檔 | 本文件 §1.2 / §2.1 / §6.* 引用 |
| `docs/blogger-to-github-reverse-utm-plan.md` | reverse UTM 原規格 plan | 本文件 §1（header refs）引用 |
| `docs/20260524-ga4-reverse-utm-observation.md` | L3 GA4 觀察 SOP | 本文件 §2.1 L3 列引用 |
| `docs/20260524-blogger-repost-checklist.md` | L3 Blogger 重貼 SOP | 本文件 §2.1 L3 列引用 |
| `docs/20260525-reverse-utm-readiness-snapshot.md` | 5/25 am readiness 對照 | 本文件 §2.2 引用 |
| `CLAUDE.md` §16.4 | reverse UTM 規則 canonical | 本文件 §3 全表行對應 spec 引用 |
| `src/scripts/ga4-url-builder.js` | reverse UTM source | 本文件 §3 / §4.4 line refs 引用 |

未來啟動 L1 smoke 實作時，建議讀取順序：本文件 §3（驗證目標）→ §4（script 形式約束）→ `src/scripts/ga4-url-builder.js`（最新 export 確認）→ `CLAUDE.md` §16.4（規格 canonical 對照）。

---

## §7 本 plan 之 invariant

本 plan 之**落地與更新**屬 docs-only，不觸發：

- ❌ content / `.publish.json` / `.fb.md` 修改
- ❌ src / views / scripts 修改
- ❌ settings / templates 修改
- ❌ dist / dist-blogger / dist-promotion 重 build
- ❌ deploy / gh-pages
- ❌ Blogger 後台重貼
- ❌ GA4 後台操作
- ❌ 新增實際 smoke script
- ❌ 新增測試框架 dependency
- ❌ 修改其他既有 docs

未來如本 plan 內容需更新（如規格改動、驗證目標調整、script 設計重議），仍應維持 docs-only 性質；觸發實際 smoke script 實作時，須另開 phase。

---

## §8 後續可能 phase 建議

本文件落地後，若未來決定推進 L1 smoke：

| Phase 建議 phase id 模板 | scope | 邊界 |
|---|---|---|
| `YYYYMMDD-px-y-reverse-utm-l1-smoke-impl-a` | 實作 `src/scripts/smoke-reverse-utm.js` 涵蓋本文件 §3.1 ~ §3.6 全 cases；使用 `node:assert` strict；不引入 dependency；不改 `ga4-url-builder.js` source | 不 build；不 deploy；不重貼 Blogger；不啟動 L2 / L3 |
| `YYYYMMDD-px-y-reverse-utm-l1-smoke-script-add-a`（可選）| `package.json` 新增 `"smoke:reverse-utm"` script | 純 package.json 編輯；不改 src；不 build |
| `YYYYMMDD-px-y-reverse-utm-l1-smoke-prebuild-hook-a`（可選）| 將 smoke 掛到 `prebuild:blogger` hook | 需評估執行時間 < 1 秒不延遲既有 build；不啟動 L2 / L3 |
| `YYYYMMDD-px-y-reverse-utm-l1-smoke-completion-report-a` | 落地 L1 smoke 完成 report；含 cases 對應表 / 執行紀錄 / 與本 plan §3 比對 | docs-only |

每 phase 完成後建議：

- 跑本 smoke 自身（驗 baseline 不退化）
- 視需要跑 `npm run validate:content` 確認 source 改動未誤動 schema
- 不批量做多 phase；保留 user 可隨時收工 / 暫停

---

## §9 Note

| 項目 | 邊界 |
|------|------|
| 本文件只記錄 L1 smoke 設計規劃 | ✅ |
| 本 phase **不**實作 smoke script | ✅ |
| 本 phase **不**修改 src / content / settings / .publish.json / .fb.md | ✅ |
| 本 phase **不**新增測試框架 | ✅ |
| 本 phase **不** deploy / build / Blogger 後台 / GA4 後台 / FB 後台 | ✅ |
| 本檔落地後**不**改變任何 production state | ✅ 純設計文件 |

---

（本文件結束）
