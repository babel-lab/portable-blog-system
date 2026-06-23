# SP-9a — platformPolicy effective derive helper（source-light / display-only / no build consumption）

> Phase：`20260624-am-sp9a-platform-policy-effective-derive-helper-a`（2026-06-24）
> Baseline：`main @ 2204a05`（HEAD == origin/main，ahead/behind 0/0，working tree clean）
> 前身：
> - `docs/20260623-pm-sp8-platform-policy-shape-validator.md`（SP-8 platformPolicy shallow shape validator）
> - `docs/20260623-special-page-types-indexing-metadata-preanalysis.md` §2.7 / §3 / §4 / §6.4（platformPolicy 概念 + 分階段建議）
> - `docs/20260623-pm-sp7a-admin-readonly-page-metadata-summary.md`（SP-7a Admin read-only metadata summary）
>
> Dean approval（2026-06-24 簽收）：
> 1. 同意 split SP-9 → SP-9a / SP-9b / SP-9c
> 2. 只批准 SP-9a；SP-9b / SP-9c **不批准**，全 dormant
> 3. SP-9a 定義修正：**source-light / display-only / no build consumption**，**不**稱 docs-only
> 4. SP-9a 範圍：建立 effective helper + Admin read-only summary/UI 顯示 effective hint；**不得**改 GitHub Pages / Blogger / sitemap / robots / listing / canonical / feeds / live output

---

## 1. 本 phase 邊界（binding；嚴格）

### 1.1 做了什麼

純粹擴充 read-only 顯示路徑：

1. 新增純函式 `src/scripts/platform-policy-effective.js`
   - `resolvePlatformPolicyValue(fm, platform, field)` —— per-platform per-field effective lookup
   - `derivePlatformPolicyEffective(fm)` —— per-platform recognized / secretLike / raw / effective / source summary
   - 支援 `inherit` 語意；invalid / suspicious 一律不讀 value
2. 新增 smoke `src/scripts/check-platform-policy-effective.js`（40/0；自含；不加 package.json script）
3. 擴充 `src/scripts/page-metadata-summary.js` `derivePlatformPolicySafe()`：per-platform 加 `recognized` / `secretLike` / `effectiveIndexing` / `effectiveIncludeInListings`；既有 raw 欄位（`indexing` / `includeInListings`）完全保留
4. 擴充 `src/scripts/check-page-metadata-summary.js` 加 7 個 SP-9a 案例（22 → 29）
5. 擴充 `src/views/admin/index.ejs` Platform policy `<dd>`：清楚分 raw / effective 兩行；secret / unrecognized / invalid / inherit / override 各自帶 badge 與 hint；明示「**display-only**，不改任何輸出」
6. 本 docs ledger

### 1.2 沒做什麼（嚴格 dormant；違反即為 phase review 攔截）

- ❌ **不**改 `src/scripts/validate-content.js`（SP-2 / SP-8 validator 行為一字不動）
- ❌ **不**改 `src/scripts/page-type-robots.js`（robots precedence 不接 platformPolicy）
- ❌ **不**改 `src/scripts/include-in-listings.js`（listing inclusion 不接 platformPolicy）
- ❌ **不**改 `src/scripts/include-in-sitemap.js`（sitemap inclusion 不接 platformPolicy）
- ❌ **不**改 `src/scripts/build-github.js`（GitHub Pages render 行為 byte-identical）
- ❌ **不**改 `src/scripts/build-blogger.js`（Blogger build / copy-helper / publish-checklist 行為 byte-identical）
- ❌ **不**改 `src/scripts/build-sitemap.js`（sitemap.xml / robots.txt 行為 byte-identical）
- ❌ **不**改 `src/scripts/load-admin-posts.js`（Admin loader 透過既有 `derivePageMetadataView` 自然繼承新欄位）
- ❌ **不**改 `src/views/blogger/**`（Blogger copy-helper [14] / publish-checklist 行為 byte-identical）
- ❌ **不**改 `src/views/seo/**`（robots meta partial 不動）
- ❌ **不**改 `content/**` / `content/settings/**`（無新 fixture；既有 SP-8 fixtures 已涵蓋 shape）
- ❌ **不**改 `package.json` / lockfile
- ❌ **不**動 `dist*/` / `gh-pages` / `.cache/`
- ❌ **不**改 `MEMORY.md` / `memory/**`（本 phase 非 memory-sync）
- ❌ **不**跑 `npm run build*` / `dev` / `preview` / deploy / repost
- ❌ **不**碰 Blogger / GA4 / AdSense / Search Console / Google Drive 後台
- ❌ **不**啟用 Admin write path / dryRun:false / `--apply`
- ❌ **不**新增列舉值、未動 SP-2 / SP-8 列舉 set

### 1.3 SP-9a 不解決的問題

- 🔴 **Blogger Google Form gated download 頁仍需 Blogger 後台人工 noindex**：即使作者在 `.md` 寫 `platformPolicy.blogger.indexing: noindex-nofollow`，本 phase **不**改 Blogger copy-helper / publish-checklist / build-blogger 輸出。真實生效仍依賴作者去 Blogger 後台「搜尋設定 → 自訂 robots 標頭標記」手動設定。本 phase 之 Admin Platform policy 顯示已標示「display-only；不改任何輸出」。
- 🔴 **GitHub Pages render robots / listing / sitemap / canonical 仍以頂層欄位為準**：`build-github.js` 之 `resolvePostDetailRobots` 不讀 platformPolicy；`build-sitemap.js` 不讀 platformPolicy。即使作者寫 `platformPolicy.github.indexing: noindex-follow`，GitHub Pages 之 robots meta 仍由頂層 `seo.indexing` / `contentKind:download` / `pageType` / default 決定。
- 🔴 **未來 GitHub Pages 與 Blogger 合併時之 indexing/list/sitemap/canonical 行為仍未生效**：合併情境之真實消費屬 SP-9b / SP-9c。

---

## 2. 新增 / 擴充契約

### 2.1 `src/scripts/platform-policy-effective.js`（新增）

純函式、零依賴、無 side effect。export 兩個函式：

#### `resolvePlatformPolicyValue(fm, platform, field)`

回傳 `{ value, source }`：

| source | 觸發條件 | value | 用途 |
|---|---|---|---|
| `'override'` | leaf 為合法 enum（indexing）/ boolean（flag）/ non-empty string（canonical）/ string（note） | 原值 | Admin 直接顯示；未來 SP-9b/c 之 build override 入口 |
| `'inherit'` | leaf === `'inherit'` 字串 | `null` | Admin 顯示「inherit → top-level」；未來 build 端走頂層 fallback |
| `'secret'` | platform key 或 field key 命中 SUSPICIOUS_KEYS | `null` | Admin 顯示 secretLike badge；**永不**讀 value |
| `'invalid'` | leaf 存在但 shape / 型別不合（含 nested object/array）| `null` | Admin 顯示 invalid badge；validator 已 warn |
| `'absent'` | platformPolicy 缺省 / 非 object / platform 缺省 / nested 缺省 / caller 傳 unrecognized platform 或 field | `null` | Admin 不顯示推導值 |

#### `derivePlatformPolicyEffective(fm)`

回傳 `{ present, isObject, platforms[] }`，每個 entry：

```js
{
  name: string,                // platform key（可能 unrecognized 或 secretLike）
  recognized: boolean,         // 是否為 'github' / 'blogger' / 'future'
  isObject: boolean,           // platform value 是否為 plain object
  secretLike: boolean,         // platform key 是否命中 SUSPICIOUS_KEYS
  indexing: { raw, effective, source },
  includeInListings: { raw, effective, source },
}
```

`raw` = leaf 顯示用 label（'inherit' / enum / 'true' / 'false' / `invalid (...)` / '' for secret / absent）；`effective` = override 之 value 或 null；`source` mirror 上表。

### 2.2 `src/scripts/page-metadata-summary.js`（擴充）

`derivePlatformPolicySafe(pp, fallbacks)` 之 platform entry **加** 5 個欄位（既有 `name` / `indexing` / `includeInListings` 不刪不改）：

```js
{
  name, indexing, includeInListings,                // 既有
  recognized,                                       // 新（mirror effective）
  secretLike,                                       // 新（mirror effective）
  effectiveIndexing: { value, source, topLevelFallback },
  effectiveIncludeInListings: { value, source, topLevelFallback },
}
```

`topLevelFallback` 由 `derivePageMetadataView` 傳入：
- `indexingFallback` = `mapRobotsToIndexingEnum(robotsValue)` —— effective robots meta 字串 → indexing enum
- `listingFallback` = `resolveIncludeInListings(safeFm)` —— SP-4a effective listing

僅用於 Admin 顯示「inherit → top-level X」。**不**接 build pipeline。

### 2.3 `src/views/admin/index.ejs`（擴充）

Platform policy `<dd>`：
- 預設 hint：明示「display-only；目前**不**改 robots / listing / sitemap / canonical / feeds / Blogger guidance」
- per-platform 兩行（indexing / includeInListings）：raw + effective
- effective badge 區分 5 種 source：override / inherit→fallback / invalid / secret / unrecognized-platform / absent
- secret platform key：顯示 `b-warn` badge + 明確「value 不顯示 / 不應入 repo」hint；raw 一律空（不讀 sub）
- unrecognized platform key：raw 顯示原值（供作者除錯），effective 不推導
- **無**任何 button / input / form / onclick / fetch / write path

---

## 3. Validation results（pre → post SP-9a）

| 指令 | pre（SP-8 後 baseline） | post SP-9a | Δ |
|---|---|---|---|
| `npm run validate:content` | 0 / 112 / 102 | **0 / 112 / 102** | 不變 |
| `validate:content` overlay（commerce-c4-c9-overlay） | 0 / 119 / 103 | **0 / 119 / 103** | 不變 |
| `node src/scripts/check-page-type-validator.js` | 37 / 0 | **37 / 0** | 不變 |
| `node src/scripts/check-page-type-robots.js` | 29 / 0 | **29 / 0** | 不變 |
| `node src/scripts/check-include-in-listings.js` | 16 / 0 | **16 / 0** | 不變 |
| `node src/scripts/check-include-in-sitemap.js` | 19 / 0 | **19 / 0** | 不變 |
| `node src/scripts/check-page-metadata-summary.js` | 22 / 0 | **29 / 0** | +7 case |
| `node src/scripts/check-platform-policy-effective.js`（新） | — | **40 / 0** | 新增 |
| `npm run check-commerce-affiliate-resolver` | 23 / 0 | **23 / 0** | 不變 |
| `npm run check:admin-validation-consume` | 12 / 0 | **12 / 0** | 不變（Admin loader pageMetadata shape 為 additive） |
| `npm run report:validation` | 0 / 112 / 102 | **0 / 112 / 102** | 不變 |
| `npm run check:validation-report` | 14 / 0 | **14 / 0** | 不變 |

**production-post warnings 仍 0**（沒有 production posts 使用 platformPolicy；fixtures 全在 `content/validation-fixtures/`）。

---

## 4. Output-preservation confirmation

- `src/scripts/validate-content.js` **未動** → validator 行為 byte-identical（rules 37/0 鎖）。
- `src/scripts/page-type-robots.js` / `include-in-listings.js` / `include-in-sitemap.js` **未動** → SP-3 / SP-4a / SP-5a 行為 byte-identical（29/0 / 16/0 / 19/0 鎖）。
- `src/scripts/build-github.js` / `build-blogger.js` / `build-sitemap.js` **未動** → `dist/` / `dist-blogger/` / `dist-promotion/` 輸出 by construction byte-identical（本 phase 未跑 build 驗證；per Dean 紀律不跑）。
- `src/views/blogger/**` / `src/views/seo/**` **未動** → robots meta / OG / canonical / Blogger copy-helper / publish-checklist 行為不變。
- `src/scripts/page-metadata-summary.js` 之改動為純 additive：
  - 既有 `derivePlatformPolicySafe` 回傳 shape 完全 backward-compatible（既有欄位皆保留；新欄位 additive；既有 EJS 引用 `pf.indexing` / `pf.includeInListings` 仍正確）
  - 新增 import 為純函式 import；無 side effect
- `src/views/admin/index.ejs` 之改動僅在 Platform policy `<dd>` 內部；Admin 路由 / write path / governance signals / validation report 區段一字不動

---

## 5. Red lines（不可違反；本 phase 之 binding）

1. ❌ **不**啟用 platformPolicy 之 build / render / listing / sitemap / canonical / feeds / Blogger guidance 任一消費（SP-9b / SP-9c 才接，當前 dormant）
2. ❌ **不**讀 / **不** echo suspicious key 之 value（mirror SP-8 secret-safety）
3. ❌ **不**新增 listing / sitemap / robots 預設行為（仍以頂層欄位為準）
4. ❌ **不**改 production posts / fixtures / settings
5. ❌ **不**啟動 build / deploy / preview / dev server / repost
6. ❌ **不**碰 Blogger / GA4 / AdSense / Search Console / Drive 後台
7. ❌ **不**動 Admin write path / dryRun:false / `--apply`
8. ❌ **不** force-push / amend / rebase
9. ❌ Blogger Google Form gated download 頁仍須 Blogger 後台人工 noindex（SP-9c dormant）

---

## 6. Follow-up / dormant phases

### SP-9b — GitHub Pages 真實消費（🟡 中；dormant；待 Dean 另行批准）

- `page-type-robots.js` `resolvePostDetailRobots()` 在 explicit `seo.indexing` 與 `contentKind:download` safety 之間插入 `platformPolicy.github.indexing` override 入口（仍尊重 download safety）
- `include-in-listings.js` 加 `platformPolicy.github.includeInListings` override（非 inherit boolean 才生效）
- `include-in-sitemap.js` 加 `platformPolicy.github.includeInSitemap` override（safety exclusion 仍最高優先）
- production posts 之 byte-identical 保證：production 仍無 platformPolicy → diff = 0；fixture 加入後 expected diff 須在 SP-9b ledger 紀錄

### SP-9c — Blogger guidance 擴充（🟡 中；dormant；待 Dean 另行批准）

- `src/views/blogger/blogger-copy-helper.ejs` [14] / `blogger-publish-checklist.ejs` 顯示 `platformPolicy.blogger.indexing` 之 effective 值（仍 read-only guidance；Blogger 後台仍需作者手動設定）
- 6 篇 Blogger AdSense live post 之 `dist-blogger/posts/*/copy-helper.txt` diff 須在 SP-9c ledger 紀錄為 expected

### SP-9 後續其他（dormant）

- `includeInFeeds` + feed builder（無消費端；preanalysis §2.5）
- `platformPolicy.canonical` 之 canonical override 真消費
- ADMIN R2+ / write path / auto-fix / browser write
- 任何跨平台 / 合併站 / Blogger API 自動化

---

## 7. Acceptance summary

- ✅ SP-9a binding 全達成（display-only / no build consumption / inherit / suspicious-safe / unrecognized-safe）
- ✅ validation baseline 一字不動（0/112/102 + 0/119/103 + 14/0 等全保）
- ✅ 既有 page-metadata-summary 契約 backward-compatible（22 → 29，全 PASS）
- ✅ 新 smoke `check-platform-policy-effective.js` 40/0
- ✅ Admin Platform policy UI 清楚分 raw vs effective；明示 display-only；secret-safety 維持
- ✅ Dean 簽收之 SP-9b / SP-9c dormant 條款全保

（本 docs 結束）
