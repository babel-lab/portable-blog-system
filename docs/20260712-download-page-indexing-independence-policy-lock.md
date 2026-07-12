# Download page indexing independence — policy lock（docs-only）

- Phase id：`20260712-download-page-indexing-independence-policy-lock`
- 日期：2026-07-12（Asia/Taipei）
- 類型：**docs-only policy lock + additive contract guard**（唯一 mutation = 新增本 doc + 新增 1 支 read-only guard + 註冊 1 個 npm script；**不**改 content、**不**改 frontmatter、**不**改 sidecar、**不**改既有 source、**不**改既有 validator、**不**改 build / deploy、**不**改 CLAUDE.md / MEMORY.md）
- 影響分類編號（`CLAUDE.md` §7）：A（規範文件）+ L（build script — guard 純讀取現有 pure resolver）
- 授權：Dean explicit approval（2026-07-12 13:19 Asia/Taipei；本次 session prompt §四 A / B / C）

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `260dd1b` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | — | — | 本 phase **不**進 deploy clone | — | — | — |

Source HEAD full hash = `260dd1bdb30bbe6253a97e3aab63a1dad00cae72`；subject `chore(blogger): add write rehearsal template contract guard`。前一 slice 僅動 `package.json` + 新 `src/scripts/check-blogger-backfill-write-rehearsal-template-contract.js`，58/58 PASS。

判定：baseline 完全一致；本 phase 允許 mutation ＝ 新增 `docs/20260712-download-page-indexing-independence-policy-lock.md`（本檔）＋ 新增 `src/scripts/check-download-indexing-independence.js`（新 guard）＋ `package.json` 註冊 1 個 npm script（`check:download-indexing-independence`）。

---

## 1. Trigger（今日 Dean 明確確認之產品規則）

2026-07-12 13:19 Asia/Taipei，Dean 於 session prompt §四 明確補上下載頁架構之三條產品規則。摘錄為決策條文（原文語意保留）：

### 1.1 活動式直接下載頁（archetype A：activity/direct-download）

例如：

- 著色圖 JPG 下載頁
- 注音練習紙 JPG 下載頁
- 海盜船活動素材下載頁

特性：

- 視覺上可設計成活動頁 / 推廣頁。
- 通常由其他文章導入，紙本印刷可能直接印頁面 URL 或 QR Code。
- 使用者可能直接進入，因此頁面本身必須完整、可理解、可操作。
- 可作為獨立 SEO landing page。
- **預設應允許搜尋引擎索引。**

### 1.2 Google Form 門檻式下載頁（archetype B：gated download）

特性：

- 使用者須先提交 Google Form，才取得或存取下載內容。
- 預設不希望進入搜尋索引。
- **預設可為 `noindex`。**

### 1.3 最重要修正：索引設定必須獨立（Dean 原文）

> 下載頁是否可被索引，必須是獨立、可明確設定的 metadata／configuration。

禁止：

- 只因為是直接下載，就在程式內永久推論為 `index`。
- 只因為經過 Google Form，就在程式內永久推論為 `noindex`。
- 將下載流程與 robots / indexing 狀態寫成不可覆寫的隱性耦合。
- 只靠 page type 猜測最終索引狀態。

可以有合理預設值：

- `activity/direct-download` → 預設 `index`
- `Google Form gated download` → 預設 `noindex`

但最終 indexing 狀態必須能獨立明確設定，且 validator、builder、template、文件與測試不得互相矛盾。

---

## 2. Current architecture already satisfies §1.3 independence

Dean 之「indexing 必須獨立、明確設定、可覆寫隱性推論」規則，於**既有 architecture 已完整落地**（本 phase 未新增機制、未改資料流；僅 audit + document + 加 invariant guard）。

### 2.1 三條正交 resolver（三個 pure 函式；互不推導；已 landed）

| 面向 | 檔案 | precedence | 隱性耦合狀態 |
| --- | --- | --- | --- |
| Robots meta / indexing | `src/scripts/page-type-robots.js` `resolvePostDetailRobots()` | (1) explicit `seo.indexing` → (2) legacy `contentKind === 'download'` safety → (3) `pageType` 推導 → (4) caller default → (5) SP-9b `platformPolicy.github.indexing` tighten-only | ❌ 無隱性耦合：explicit `seo.indexing` 為最高優先；contentKind / pageType 僅作為 default fallback；SP-9b 只能收緊、絕不放寬 |
| Listing inclusion | `src/scripts/include-in-listings.js` `resolveIncludeInListings()` | (1) top-level `includeInListings === false` → (2) SP-9b `platformPolicy.github.includeInListings === false` → (3) top-level `includeInListings === true` → (4) Slice 2 特殊頁 default-exclude → (5) normal default include | ❌ 無隱性耦合：explicit `includeInListings: true/false` 為最高優先；contentKind / pageType 僅作為 default fallback；**明示 opt-in 可覆寫 default-exclude** |
| Sitemap inclusion | `src/scripts/include-in-sitemap.js` `resolveIncludeInSitemap()` | (1) safety exclusion（noindex-\* / legacy `contentKind:download` 且非 explicit `seo.indexing:index`）→ (2) top-level `includeInSitemap === false` → (3) SP-9b `platformPolicy.github.includeInSitemap === false` → (4) 其餘 include | 🟡 safety 為 floor（不可被 override 放寬）：這是**設計上的安全底線**，非隱性耦合——author 若要 index，須設 explicit `seo.indexing: 'index'`，safety 即自動放行（見 §2.3 補述） |

### 2.2 三支既有 contract guard 已鎖住 explicit override

| 對應 resolver | Contract guard | 已鎖住之 explicit-override 場景（節錄） |
| --- | --- | --- |
| robots | `src/scripts/check-page-type-robots.js`（15 cases） | R3 `explicit index + pageType:gated_download → index, follow`；R13 `explicit index + contentKind:download → index, follow`；R4 `explicit noindex-follow + pageType:article → noindex, follow`；R5 `explicit noindex-nofollow → noindex, nofollow` |
| listing | `src/scripts/check-include-in-listings.js`（21 cases） | R7 `contentKind:download + includeInListings:true → true`；R8 `pageType:gated_download + includeInListings:true → true`；R11–R12 top-level `false` 最高優先；R19 mvp-like shape |
| sitemap | `src/scripts/check-include-in-sitemap.js`（14 cases） | `explicit index + contentKind:download → true`（safety 放行）；`noindex-\* + includeInSitemap:true → false`（safety 不放寬）；mvp-like shape |

→ 三支既有 guard **皆已存在、且已鎖住** 「explicit override 覆蓋 contentKind / pageType default」的 core cases。本 phase **不重做**這三支既有 guard、**不新增重複** case。

### 2.3 Safety floor（sitemap）並非隱性耦合，符合 §1.3 之 spirit

`include-in-sitemap.js` 之 `isSitemapEligible()`（line 36–43）之 safety exclusion 規則：

```js
if (seoIndexing === 'noindex-follow' || seoIndexing === 'noindex-nofollow') return false;
if (seoIndexing !== 'index' && post.contentKind === 'download') return false;
return true;
```

- 這**不是**「因為是 download 就永久推論為 noindex」；author 可透過 explicit `seo.indexing: 'index'` 明示 opt-in，safety 立即放行（第二行 `seoIndexing !== 'index' && ...` 之 short-circuit）。
- 這**是**「若 author 未明示指定，legacy `contentKind:download` 走安全預設」——`activity/direct-download` archetype 之 author 只要 explicit `seo.indexing: 'index'` 即可完全 override（並使 sitemap eligible）。
- ✅ 與 Dean §1.3 之 spirit 一致：「index 為預設值，但最終狀態必須能獨立明確設定」——author explicit `seo.indexing: 'index'` 就是 §1.3 所要求之「明確設定 override 途徑」。

### 2.4 三條線正交（不互相推導；已於 Q6 policy lock §3 明列）

- listing selector **不**由 `seo.indexing` / `includeInSitemap` / robots 推導
- sitemap selector **不**由 `includeInListings` / `includeInFeeds` / `pageType` 推導
- robots resolver **不**由 `includeInListings` / `includeInSitemap` 推導

→ 三面向可獨立、明確設定；符合 Dean §1.3 「多獨立維度」要求。

---

## 3. Recommended archetype → schema mapping（本 phase 不新增 schema 欄位）

**❌ 本 phase 不新增任何 metadata 欄位**（依 session prompt §六：「不要自行發明欄位名稱」）。以下為**使用既有欄位**達成 §1.1 / §1.2 兩個 archetype 之推薦寫法（給 author reference；非強制 lock）：

### 3.1 Archetype A — 活動式直接下載頁（activity/direct-download）

推薦寫法（任一皆可，以 explicit + landing 為最保險）：

**方案 A-1（推薦）**：`pageType: landing` + explicit `seo.indexing: 'index'` + explicit `includeInSitemap: true` + explicit `includeInListings: true`

```yaml
pageType: landing                # SP-3 landing → 無推導 → default index
seo:
  indexing: index                # explicit index（最高優先；safety 放行）
includeInSitemap: true           # 明示 include（safety 已放行；此為 opt-in confirm）
includeInListings: true          # 明示 include（正交，避免任何 default-exclude 意外）
contentKind: page                # 或 'post'；避免使用 'download'（因 legacy safety fallback 為 noindex）
```

**方案 A-2**：`contentKind: download` + explicit `seo.indexing: 'index'`（若真的希望以 download 為內容體裁描述）

```yaml
contentKind: download            # legacy download 體裁（會觸發 SEO-1 default noindex，但下方 explicit override）
pageType: landing                # 明示 IA 角色為 landing（避免走 pageType:download default noindex）
seo:
  indexing: index                # explicit index：完全 override legacy download safety + pageType default
includeInSitemap: true           # 顯式 opt-in（sitemap safety 已因 explicit index 放行）
includeInListings: true          # 顯式 opt-in（覆蓋 Slice 2 download default-exclude）
```

→ 兩方案任一皆滿足 §1.1「預設應允許搜尋引擎索引」。方案 A-1 較保險（避免 legacy download safety fallback 之隱性 noindex）。

### 3.2 Archetype B — Google Form 門檻式下載頁（gated download）

推薦寫法：`pageType: gated_download`（推薦；SP-3 已將 gated_download default 為 noindex, follow）

```yaml
pageType: gated_download         # SP-3 gated_download → derived noindex, follow
# seo.indexing 可省略（走 pageType default）；亦可 explicit noindex-follow 更明確
seo:
  indexing: noindex-follow       # 可省略；顯式寫可增加可讀性
includeInSitemap: false          # 顯式 exclude（safety 已排除；此為 confirm）
includeInListings: false         # 顯式 exclude（正交；覆蓋 mvp-like scenario）
contentKind: download            # 內容體裁保持 download；此處 legacy safety noindex 與 gated_download 一致
```

若特殊 gated 頁需要 opt-in index（罕見，如公開資源 gated 但仍希望 index），explicit `seo.indexing: 'index'` 可覆蓋：

```yaml
pageType: gated_download
seo:
  indexing: index                # explicit override：最高優先；safety 放行
```

→ Dean §1.3 之獨立性保證：**任何 pageType 皆可被 `seo.indexing` explicit 覆蓋**。

### 3.3 Legacy MVP post 不變（Q6 policy lock 生效中）

- `content/github/posts/20260504-portable-blog-system-mvp.md`（唯一 production `contentKind:download` post；Q6 asymmetry hold）
- state：`contentKind: download` + `seo.indexing: noindex-follow` + `includeInListings: true`
- 屬 Q6 documented / intentional hold（`docs/20260626-q6-download-listing-asymmetry-policy-lock.md`）
- **本 phase 不動**；`page-noindex-in-listings` warning 維持 1 條（Q6 baseline 對齊）

---

## 4. New additive contract guard：`check:download-indexing-independence`

### 4.1 位置

- 腳本：`src/scripts/check-download-indexing-independence.js`
- npm script：`check:download-indexing-independence`

### 4.2 目的

用 **matrix / cross-resolver invariant** 鎖住 Dean §1.3 之 core invariant：

> **當 `seo.indexing` 為 explicit 合法值時，robots 與 sitemap eligibility 完全由 `seo.indexing` 決定，與 `contentKind` / `pageType` 無關。**

此為既有 3 支 per-resolver guard 之**補充 invariant 層**，非重疊：

| 既有 guard | Scope | 本 guard 新增 |
| --- | --- | --- |
| `check:page-type-robots` | 每種 pageType / contentKind 對應的 robots 值 | ✅ 已鎖 explicit override 之關鍵 case |
| `check:include-in-listings` | 每種 pageType / contentKind 對應的 listing 值 | ✅ 已鎖 explicit override 之關鍵 case |
| `check:include-in-sitemap` | 每種 pageType / contentKind 對應的 sitemap 值 | ✅ 已鎖 explicit override 之關鍵 case |
| **`check:download-indexing-independence`（本 phase）** | 對每個 (contentKind × pageType) 組合，assert explicit seo.indexing 完全決定 robots + sitemap eligibility | 🆕 **matrix 完整化 + 跨 resolver invariant 鎖** |

### 4.3 斷言（in-memory；純 pure 函式；不動任何檔）

- **Matrix M-A**（robots invariance under explicit seo.indexing）：對每個 `(contentKind, pageType, explicitIndexing)` 組合，`resolvePostDetailRobots()` 之結果**只**依賴 `explicitIndexing`；`contentKind` / `pageType` 對 result **無影響**。
  - `explicit 'index' → 'index, follow'`
  - `explicit 'noindex-follow' → 'noindex, follow'`
  - `explicit 'noindex-nofollow' → 'noindex, nofollow'`
- **Matrix M-B**（sitemap invariance under explicit seo.indexing）：對每個 `(contentKind, pageType, explicitIndexing)` 組合，`shouldIncludeInSitemap()` 之結果**只**依賴 `explicitIndexing`（`noindex-*` → exclude；`'index'` → include）；`contentKind` / `pageType` 對 result **無影響**。
- **Matrix M-C**（archetype A 完整範例 sanity）：activity/direct-download 推薦寫法（§3.1 方案 A-1）→ robots `'index, follow'`；sitemap eligible / include；listing include。
- **Matrix M-D**（archetype B 完整範例 sanity）：gated download 推薦寫法（§3.2）→ robots `'noindex, follow'`；sitemap exclude；listing exclude。
- **Matrix M-E**（legacy MVP shape）：`contentKind:download + seo.indexing:noindex-follow + includeInListings:true` → robots `'noindex, follow'`；sitemap exclude；listing include（Q6 asymmetry documented）。
- **Matrix M-F**（fallback default-behavior，無 explicit seo.indexing）：確認在**未 explicit** 情況下，`contentKind:download` / `pageType:download` / `pageType:gated_download` 分別走 legacy / derived default（noindex-follow）；`pageType:landing` / `pageType:article` / `pageType:static_page` / `pageType:platform_special` 走 caller default（index-follow）；`pageType:utility_hidden` / `pageType:redirect_canonical` 走 derived noindex 值。

### 4.4 邊界（binding）

- ❌ 不 import build-github.js / build-sitemap.js（其 import 即觸發 main() build side effect）；只呼叫 pure 函式。
- ❌ 不改 production posts / registry / build / package（除 package.json 之 1 個 script 註冊）。
- ❌ 不新增 validator rule / schema 欄位 / EJS template / SCSS / build script 邏輯。
- ❌ 不 build / deploy / dev server / fetch / pull / Blogger API / GA4 / AdSense / Search Console。
- ❌ 不動既有 3 支 per-resolver guard（`check:page-type-robots` / `check:include-in-listings` / `check:include-in-sitemap`）。
- ✅ 本 guard **不加入**任何 umbrella check（**不**進 `check:phase1-readiness` / **不**進 `check:metadata-all` / **不**進 `check:release-readiness`）；standalone / additive only。若未來 Dean 想 promote 入 umbrella，須另開獨立 phase。

### 4.5 為何刻意**不改 seo.indexing 預設值 semantic**

- Dean §1.3 之核心 = **可獨立覆寫**，**非** default 值本身。
- 目前 default 值狀態：
  - `contentKind: download` → legacy safety noindex（SEO-1，2026-05-20 landed；已 5 個 batch 之 SEO-2 系列覆蓋 fixtures 與 validator hardening；MVP post 已依此設計 explicit noindex-follow）
  - `pageType: download` / `pageType: gated_download` → derived noindex, follow（SP-3，2026-06-23 landed）
- Dean §1.3.5 表 `activity/direct-download → 預設 index` 語意於 **`pageType: landing` 已自然滿足**（SP-3 中 landing → 無推導 → caller default `index, follow`）。
- **改變 `contentKind: download` 之 default 語意**（例：從 noindex 改為 index）會：
  - 破壞 SEO-2 fixture 系列（16 fixtures）
  - 破壞 `include-in-listings.js` R4 / R7 / R19（mvp-like）與 Q6 asymmetry documented state
  - 破壞 `include-in-sitemap.js` line 41 safety semantic 與所有既有 sitemap 輸出對照
  - 破壞 `page-type-robots.js` case 12 / 13 之 SEO-1 legacy safety 契約
  - → 屬**大範圍 metadata semantic drift**，違反 session prompt §六「禁止 大範圍重新命名 metadata」、「禁止 大範圍重構」與 Q6 §9 lock
- 因此本 phase 選擇：**架構已足以支持 Dean §1.3；透過 §3 archetype guidance 引導 author 用 `pageType: landing` + explicit `seo.indexing: 'index'` 表達 archetype A；不改 default 語意**。

---

## 5. Not-doing scope（本 phase 絕對不動）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 動既有 `src/scripts/page-type-robots.js` / `include-in-listings.js` / `include-in-sitemap.js` 資料流 | ❌ 未動 |
| 2 | 動既有 `check:page-type-robots` / `check:include-in-listings` / `check:include-in-sitemap` guard 語意 | ❌ 未動 |
| 3 | 動 `content/**/*.md` frontmatter / `.publish.json` sidecar / `.fb.md` | ❌ 未動 |
| 4 | 動 `content/settings/*.json` | ❌ 未動 |
| 5 | 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 6 | 動 `src/views/**` / `src/styles/**` / `src/js/**` | ❌ 未動 |
| 7 | 動 `validate:content` rule / VALID_SEO_INDEXING set / invalid-seo-indexing warning 語意 | ❌ 未動 |
| 8 | 動 `check:phase1-readiness` / `check:metadata-all` / `check:release-readiness` umbrella | ❌ 未動 |
| 9 | 動 `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` | ❌ 未動 |
| 10 | build / deploy / dev server / preview / push gh-pages | ❌ 未執行 |
| 11 | Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| 12 | 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` / `bloggerBlogId` | ❌ 未猜 |
| 13 | Admin write path / Apply / middleware / admin-write-cli | ❌ 未動 |
| 14 | Blogger backfill 語意升級 / real write phase 啟動 | ❌ 未動 |
| 15 | 動 `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` / deploy clone | ❌ 未動 |
| 16 | 改變 `contentKind: download` 或 `pageType: download` / `gated_download` 之 default robots / listing / sitemap 語意 | ❌ 未動（見 §4.5）|
| 17 | 新增 metadata 欄位（含 `activity_page` / `direct_download` 等 pageType 新值） | ❌ 未做（依 session prompt §六「不要自行發明欄位名稱」） |

---

## 6. Validation baseline expectations

| 指令 | 執行前 baseline | 執行後 expected | 說明 |
| --- | --- | --- | --- |
| `node src/scripts/check-page-type-robots.js` | 27/27 PASS（carry-forward） | 27/27 PASS | 未動；regression check |
| `node src/scripts/check-include-in-listings.js` | 21/21 PASS（carry-forward） | 21/21 PASS | 未動；regression check |
| `node src/scripts/check-include-in-sitemap.js` | 14/14 PASS（carry-forward） | 14/14 PASS | 未動；regression check |
| `node src/scripts/check-download-indexing-independence.js` | — 新 guard | expect 全 PASS 且 exit 0 | 本 phase 新增 |
| `npm run check:npm-script-targets` | 53/53 PASS | **54/54 PASS**（+1 新 script） | additive-only drift |
| `npm run check:phase1-readiness-contract` | 22/22 PASS | 22/22 PASS | 未動 umbrella；contract 不變 |
| `npm run validate:content` | 0 / 135 / 107 | 0 / 135 / 107 | 未動 content / rules |
| `npm run check:phase1-readiness` | exit 0（含 validate 0/135/107 / adsense-mode-metadata 17-0 / blogger-backfill scanned 12 candidates 7 missing 7 skipped 5 / prepublish 16/16 / smoke 8/8） | exit 0（同上） | 未動 umbrella；本新 guard 不入 umbrella |

**Q6 documented warning 維持 1 條**（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`）；本 phase 不動 MVP post、不動 Q6 intent hold。

Blogger backfill report-only 狀態維持不變（scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5）。

---

## 7. Cross-links

- `docs/seo-indexing-rules.md`（SEO indexing policy 總則；SEO-1 / SEO-2 系列 6 batch history；robots / sitemap 分工）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1 preanalysis；pageType 封閉列舉；4 面向正交；archetype metadata model）
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（Q6 asymmetry documented hold；MVP post state；三條正交 selector 紅線）
- `docs/20260624-download-listing-special-page-preflight-spec-lock.md`（Slice 2 download listing default-exclude 生效；`includeInListings:true` opt-in）
- `docs/20260624-sp-download-include-in-listings-opt-in-preanalysis.md`（Slice 2 preanalysis；opt-in 契約 rationale）
- `src/scripts/page-type-robots.js`（robots resolver；SP-3 + SP-9b 完整 precedence）
- `src/scripts/include-in-listings.js`（listing resolver；SP-4a + SP-9b + Slice 2）
- `src/scripts/include-in-sitemap.js`（sitemap resolver；SP-5a + SP-9b + SEO-1/2 safety floor）
- `src/scripts/check-page-type-robots.js`（既有 27-case guard；含 explicit override R3 / R13）
- `src/scripts/check-include-in-listings.js`（既有 21-case guard；含 explicit opt-in R7 / R8 / R19）
- `src/scripts/check-include-in-sitemap.js`（既有 14-case guard；含 explicit override sitemap 放行）
- `CLAUDE.md` §11（`contentKind` 封閉列舉）／§17（文章頁基本版型）／§21（SEO 規則）／§23（發布狀態）／§27（Claude Code 修改規則）／§29（第一版不做）
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths）
- `docs/20260710-phase1-rc-docs-index.md`（Phase 1 RC 單頁 lookup index；本 phase 屬 idle-freeze 期間之 additive 補充）

---

## 8. Next steps（本 phase 完結後）

- 本 phase 完結 → **回到 idle freeze**（`CLAUDE.md` §3a Recommended next paths；`docs/20260710-phase1-rc-docs-index.md` §11）。
- **不主動**啟動任何後續動作。以下 Dean explicit approval 才可啟動之候選（本 phase 不代決策）：
  - 若 Dean 想在 UI（Admin）暴露 `pageType` / `includeInListings` / `includeInSitemap` / `seo.indexing` 之獨立設定 UI → 屬 SP-8（`docs/20260623-special-page-types-indexing-metadata-preanalysis.md` §6.4 SP-8）；需 Admin write path 啟動；本 phase 不動 Admin。
  - 若 Dean 想在 validator 加「危險組合 warn」（如 `pageType:gated_download + seo.indexing:index` → warn；per SP-1 §5.3）→ 屬獨立 validator hardening phase；本 phase 不動 validator。
  - 若 Dean 想新增 `pageType: activity_page` 封閉列舉值 → 屬 schema 擴充；需 SP-2 fixture 系列同步；本 phase 不動 schema。
  - 若 Dean 想促本新 guard 入 `check:phase1-readiness` / `check:metadata-all` umbrella → 屬 umbrella semantic 擴充；需獨立 contract phase；本 phase 不改 umbrella。

---

## 9. Sign-off

- 唯一 mutation：新增本 doc + 新增 `src/scripts/check-download-indexing-independence.js` + `package.json` 註冊 `check:download-indexing-independence` 1 個 npm script（總 3 檔）。
- 未動：content / frontmatter / sidecar / settings / views / styles / js / 其他 scripts / lockfile / CLAUDE.md / MEMORY.md / memory/ / dist / deploy clone。
- Baseline drift（預期）：`check:npm-script-targets` 由 53/53 → 54/54（additive-only）；其他 baseline 未動。
- 未 build / 未 deploy / 未 preview / 未 push gh-pages / 未 dev server / 未 Blogger / AdSense / GA4 / Google Drive / Search Console / 未動 backfill 語意 / 未猜 Blogger 真值 / 未寫回大型 ledger 至 `CLAUDE.md`。
- Recommendation：**idle freeze**（sign-off 後）。

（本文件結束 / end of document）
