# Download page generated-output contract — end-to-end guard

- Phase id：`20260712-download-page-generated-output-contract`
- 日期：2026-07-12（Asia/Taipei）
- 類型：**test-only additive**（唯一 mutation = 新增本 doc + 新增 1 支 read-only guard + `package.json` 註冊 1 個 npm script + 更新 `check:metadata-all` umbrella 加入該 guard + 更新 `check:metadata-all-contract` 之 REQUIRED/ORDERED fragments）
- 影響分類編號（`CLAUDE.md` §7）：A（docs）+ L（build script — 純 read-only guard）
- 授權：Dean explicit approval（2026-07-12 14:27 Asia/Taipei；session prompt §四 / §十）

---

## 0. Boot baseline（本輪已驗）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `9304e50` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | — | — | 本 phase **不**進 deploy clone | — | — | — |

Source HEAD full = `9304e5094815aff7ce53881c3c6e1a1a5d095049`；subject `chore(checks): cover metadata umbrella with download guard`。

---

## 1. Trigger（本 phase 補的 gap）

前 slice（`docs/20260712-download-page-indexing-independence-policy-lock.md`）已完成：

- pure resolver 之 cross-resolver invariant 覆蓋（`check:download-indexing-independence` 298/298 PASS）
- 三支 per-resolver guard 之 explicit-override cases 已完整鎖住
- `check:metadata-all` / `check:release-readiness` / `check:phase1-readiness` 三條正式 umbrella 皆已把 pure guard 拉進來

**但仍缺一層**：從實際 fixture-shape frontmatter 出發，經 `gray-matter → normalize-post-output → resolvePostDetailRobots → shouldIncludeInSitemap → shouldIncludeInListings → ejs.renderFile(seo/meta-tags.ejs)` 這條完整 build path，assert 最後**輸出的 HTML 字串**確實對應到 §1.3 policy lock 所要求之獨立 indexing 行為。

pure guard 用 inline object literals（`post({ contentKind, pageType, seo: { indexing } })`），完全略過：

- `gray-matter` frontmatter YAML parse
- `normalizePostOutput()` 之 additive normalization
- `ejs.renderFile()` on `src/views/seo/meta-tags.ejs`

若未來 refactor 動到 loader / normalization / template render 任一環節（例如意外把 `seo.robots` 覆寫成 constant / 拿掉 `<meta name="robots">` 標籤 / 把 frontmatter 值路徑改名），pure guard 全綠但 real build 會靜默 drift。這條端到端 gap 由本 phase 補齊。

---

## 2. Guard 設計

### 2.1 位置

- 腳本：`src/scripts/check-download-indexing-generated-output.js`
- npm script：`check:download-indexing-generated-output`

### 2.2 Pipeline（每個 fixture 走完整一遍）

```text
inline frontmatter YAML string
  → gray-matter parse                    ← mirrors src/scripts/load-posts.js processMarkdownEntry
  → normalizePostOutput(entry, {}, ...)  ← mirrors load-posts.js entry.normalized
  → resolvePostDetailRobots(post, 'index, follow')
                                          ← mirrors src/scripts/build-github.js buildSeoForPostDetail 第 309 行
  → shouldIncludeInSitemap(post)         ← mirrors src/scripts/build-sitemap.js buildEntries 第 134 行
  → shouldIncludeInListings(post)        ← mirrors src/scripts/build-github.js listing filter（SP-4a 使用）
  → ejs.renderFile(src/views/seo/meta-tags.ejs, { seo: { robots }, ... })
                                          ← mirrors src/scripts/build-github.js renderHeadPartials
  → assertion on rendered HTML substring: '<meta name="robots" content="..." />'
```

**與既有 pure guard 分工**：pure guard 掃 matrix invariant（298 cases）確保任意 `(contentKind × pageType × explicit seo.indexing)` 組合下之 resolver 語意；本 guard 用 4 個代表性 archetype 走完整 build pipeline，assert 端到端 output 一致。

### 2.3 Fixture matrix

| Key | Archetype | frontmatter 關鍵欄位 | 預期 robots | 預期 sitemap | 預期 listings |
| --- | --- | --- | --- | --- | --- |
| **A1** | activity/direct-download（policy §1.1；推薦寫法 A-1） | `pageType: landing` + `contentKind: page` + `seo.indexing: index` + `includeInSitemap: true` + `includeInListings: true` | `index, follow` | ✅ included | ✅ included |
| **A2** | activity 之 legacy download shape + explicit index override | `contentKind: download` + `pageType: landing` + `seo.indexing: index` + `includeInSitemap: true` + `includeInListings: true` | `index, follow` | ✅ included（safety 放行） | ✅ included（explicit opt-in 覆蓋 Slice 2 default-exclude） |
| **B** | Google Form gated download（policy §1.2） | `contentKind: download` + `pageType: gated_download` + `seo.indexing: noindex-follow` + `includeInSitemap: false` + `includeInListings: false` | `noindex, follow` | ❌ excluded | ❌ excluded |
| **C** | override case：gated_download + explicit index（Dean §1.3 core statement） | `contentKind: download` + `pageType: gated_download` + `seo.indexing: index` + `includeInSitemap: true` + `includeInListings: true` | `index, follow`（override wins） | ✅ included（safety 放行） | ✅ included（explicit opt-in） |

### 2.4 Fixture 隔離

Fixture 為**內嵌 YAML 字串**（`const FIXTURES = [{ frontmatter: '---\n...\n---\n' }]`）。**不**建立任何 `.md` 檔於 `content/`；不動 `validate:content` 之 baseline（0 / 135 / 107 維持）；不擴大 `content/validation-fixtures/` 之計數；不占用 production content namespace。

Fixture 直接對應 `src/scripts/load-posts.js processMarkdownEntry` 產生的 entry shape：`{ ...normalizedData, sourcePath, sourceCollection, bodyLength, body, sidecars, normalized }`。`sidecars` 使用空殼佔位（`exists: false`），mirrors real fixture 無 sidecar 時的行為。

### 2.5 每 fixture 之 assertions（5 個）

1. `resolvePostDetailRobots(post, 'index, follow')` = 預期 robots 字串
2. `shouldIncludeInSitemap(post)` = 預期 sitemap boolean
3. `shouldIncludeInListings(post)` = 預期 listings boolean
4. Rendered HTML `includes(...)` 一個明確 `<meta name="robots" content="X" />` 字串
5. Rendered HTML `trim().length > 0`（EJS render 未爆、非空）

再加 1 個 sanity check：`src/views/seo/meta-tags.ejs` 檔案存在。

**Total = 1 + 4 × 5 = 21 assertions。**

### 2.6 邊界 / 紅線（binding）

- ❌ 不 import `build-github.js` / `build-sitemap.js` / `build-blogger.js`（其 top-level `main()` 會觸發真實 build side effect）；只 import 純函式與 EJS partial。
- ❌ 不修改 `content/` / frontmatter / sidecar / registry / package / schema。
- ❌ 不動既有 `page-type-robots.js` / `include-in-sitemap.js` / `include-in-listings.js` resolver 語意。
- ❌ 不改 `validate-content.js` 規則、`VALID_SEO_INDEXING` set、warning 語意。
- ❌ 不動 `check:download-indexing-independence` guard 之 298 cases。
- ❌ 不 build / deploy / dev-server / preview / fetch / pull / push gh-pages / dist / deploy clone。
- ❌ 不呼叫 Blogger / AdSense / GA4 / Google Drive / Search Console。
- ❌ 不 gate `check:phase1-readiness`（避免 Phase 1 readiness 變得過重；per session prompt §十）。

---

## 3. Umbrella integration

新 guard 加入 `check:metadata-all` 之尾端（`&& npm run check:download-indexing-generated-output`）。因 `check:metadata-all` 已是 `check:release-readiness` 之子檢查，因此 release-readiness 會**間接**跑到本 guard（**一次**，不重複）。

`check:phase1-readiness` 直接串 `check:download-indexing-independence`（pure guard），但**不**直接串本 guard；避免 Phase 1 readiness chain 累積過多 EJS render 成本（本 guard 讀取 `seo/meta-tags.ejs` 並 render 4 次）。若未來 Dean 明示 promote，屬獨立 phase。

### 3.1 `check:metadata-all-contract` 更新

`REQUIRED_FRAGMENTS` + `ORDERED_FRAGMENTS` 各新增 1 條 `'npm run check:download-indexing-generated-output'`。順序 = contract → guards → cross-fields → **independence** → **generated-output**。

FORBIDDEN_TOKENS 保持不變；新片段之字面值不含 `build` / `deploy` / `publish` / `push` / `write` / `gh-pages` / `admin:write` / `safe-write` / `rm -rf` / `git push` / `git checkout` / `git reset` / `backfill:url`。

contract 全 PASS 計數：**20 → 21**（+1 required fragment case）。

---

## 4. Not-doing scope

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 動既有 resolver（robots / sitemap / listings）之語意 | ❌ 未動 |
| 2 | 動既有 pure guard（`check:download-indexing-independence`）之 298 cases | ❌ 未動 |
| 3 | 動 `content/**/*.md` frontmatter / `.publish.json` sidecar / `.fb.md` | ❌ 未動 |
| 4 | 動 `content/settings/*.json` / `content/validation-fixtures/**/*.md` | ❌ 未動 |
| 5 | 動 `CLAUDE.md` / `MEMORY.md` / `memory/**` | ❌ 未動 |
| 6 | 動 `src/views/**` / `src/styles/**` / `src/js/**` | ❌ 未動 |
| 7 | 動 `validate-content.js` 規則 / `VALID_SEO_INDEXING` set / warning 語意 | ❌ 未動 |
| 8 | 動 `check:phase1-readiness` / `check:release-readiness` script value | ❌ 未動 |
| 9 | 動 `check:release-readiness-contract` / `check:phase1-readiness-contract` | ❌ 未動 |
| 10 | 動 `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` | ❌ 未動 |
| 11 | build / deploy / dev server / preview / push gh-pages | ❌ 未執行 |
| 12 | Blogger / AdSense / GA4 / Google Drive / Search Console / DNS / domain 後台 | ❌ 未動 |
| 13 | 猜 Blogger `bloggerPostId` / `publishedUrl` / `publishedAt` | ❌ 未猜 |
| 14 | Admin write path / Apply / middleware / admin-write-cli | ❌ 未動 |
| 15 | 動 `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` / deploy clone | ❌ 未動 |
| 16 | 新增 metadata 欄位 / schema 值 / pageType 枚舉值 | ❌ 未做 |
| 17 | 新增 `content/validation-fixtures/**/*.md` fixture 檔（bump 107 post baseline） | ❌ 未做（fixture 全 inline） |

---

## 5. Validation baseline expectations

| 指令 | 執行前 baseline | 執行後 expected | 說明 |
| --- | --- | --- | --- |
| `npm run check:download-indexing-generated-output` | — 新 guard | **21/21 PASS** | 本 phase 新增 |
| `npm run check:download-indexing-independence` | 298/298 PASS | 298/298 PASS | pure guard 未動 |
| `npm run check:metadata-all-contract` | 20/20 PASS | **21/21 PASS**（+1 required fragment case） | REQUIRED_FRAGMENTS / ORDERED_FRAGMENTS 各 +1 |
| `npm run check:metadata-all` | — | 全 PASS；含 generated-output 21/21 | umbrella 尾端串入本 guard |
| `npm run check:npm-script-targets` | 55/55 PASS | **56/56 PASS**（+1 新 script） | additive |
| `npm run check:release-readiness-contract` | 14/14 PASS | 14/14 PASS | 未動 umbrella script 值 |
| `npm run check:release-readiness` | exit 0 | exit 0；含 metadata-all → generated-output 一次 | 間接串入；無重複 |
| `npm run check:phase1-readiness-contract` | 23/23 PASS | 23/23 PASS | 未動 |
| `npm run check:phase1-readiness` | exit 0 | exit 0 | 未串入本 guard；chain 未變重 |
| `npm run check:github-pages-prepublish-smoke` | 8/8 PASS | 8/8 PASS | 未動 |
| `npm run validate:content` | 0 error / 135 warning / 107 post | 0 / 135 / 107 | fixture 全 inline，不動 validate scan |
| `npm run check:blogger-backfill` | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 | 12 / 7 / 0 / 7 / 5 | 未動 |

**Q6 documented warning 維持 1 條**（`page-noindex-in-listings` @ `content/github/posts/20260504-portable-blog-system-mvp.md`）；本 phase 不動 MVP post。

---

## 6. Cross-links

- `docs/20260712-download-page-indexing-independence-policy-lock.md`（policy lock；pure invariant guard 298/298）
- `docs/20260712-download-indexing-guard-metadata-umbrella-integration.md`（metadata-all umbrella integration；pure guard 掛入時之 rationale）
- `docs/20260712-download-indexing-guard-phase1-umbrella-integration.md`（phase1-readiness umbrella integration；pure guard 掛入時之 rationale）
- `docs/seo-indexing-rules.md`（SEO indexing policy 總則；robots / sitemap / listings 分工）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1 preanalysis；pageType 封閉列舉；4 面向正交；archetype metadata model）
- `docs/20260626-q6-download-listing-asymmetry-policy-lock.md`（Q6 asymmetry documented hold；三條正交 selector 紅線）
- `docs/20260624-download-listing-special-page-preflight-spec-lock.md`（Slice 2 download listing default-exclude；opt-in 契約）
- `src/scripts/page-type-robots.js`（robots resolver；SP-3 + SP-9b 完整 precedence）
- `src/scripts/include-in-sitemap.js`（sitemap resolver；SEO-1/2 safety floor + SP-5a + SP-9b）
- `src/scripts/include-in-listings.js`（listings resolver；SP-4a + Slice 2 + SP-9b）
- `src/scripts/normalize-post-output.js`（load-posts.js entry.normalized attach helper）
- `src/scripts/load-posts.js`（processMarkdownEntry；gray-matter + normalize + sidecar）
- `src/views/seo/meta-tags.ejs`（EJS partial rendered by this guard）
- `CLAUDE.md` §11 / §17 / §21 / §23 / §27 / §29
- `CLAUDE.md` §3a Current state snapshot（含 Red lines / Recommended next paths）
- `docs/20260710-phase1-rc-docs-index.md`（Phase 1 RC 單頁 lookup index）

---

## 7. Next steps

- 本 phase 完結 → **回到 idle freeze**。
- **不主動**啟動任何後續動作。以下 Dean explicit approval 才可啟動之候選（本 phase 不代決策）：
  - 若 Dean 想擴充 fixture matrix（e.g. 補 `pageType: article` / `pageType: static_page` / `pageType: platform_special` 之 activity variant）→ 屬 fixture expansion phase。
  - 若 Dean 想把本 guard 加入 `check:phase1-readiness` chain → 屬 umbrella 擴充；需獨立 contract phase。
  - 若 Dean 想改為讀取 real `content/validation-fixtures/**/*.md` fixture 檔而非 inline（含 baseline 107 → 111 之 fixture 增量）→ 屬 fixture externalization phase；需 baseline drift 授權。
  - 若 Dean 想加對 `dist/sitemap.xml` / `dist/robots.txt` 的字面斷言（需先跑 `npm run build:sitemap`）→ 屬 downstream output smoke；不進 read-only umbrella；需 Dean 明示啟動與 build gate。
  - 若 fixture 揭露 runtime bug（本 phase 未發現）→ 屬獨立 bug-fix phase；不在本 slice 修 runtime。

---

## 8. Sign-off

- 唯一 mutation：新增本 doc（`docs/20260712-download-page-generated-output-contract.md`）+ 新增 `src/scripts/check-download-indexing-generated-output.js`（新 guard，21 assertions）+ `package.json` 新增 1 個 npm script + 更新 `check:metadata-all` 尾端加入該 script + 更新 `src/scripts/check-metadata-all-contract.js` 之 REQUIRED/ORDERED fragments（各 +1 條）。**共 4 檔。**
- 未動：content / frontmatter / sidecar / settings / views / styles / js / 其他 scripts / lockfile / CLAUDE.md / MEMORY.md / memory/ / dist / deploy clone / production posts / production settings / validation-fixtures/.
- Baseline drift（預期）：
  - `check:npm-script-targets` 55/55 → **56/56**（+1 新 script）
  - `check:metadata-all-contract` 20/20 → **21/21**（+1 required fragment case）
  - 其餘 baseline 未動：validate 0/135/107、pure guard 298/298、release-readiness-contract 14/14、phase1-readiness-contract 23/23、prepublish-smoke 8/8、Blogger backfill 12/7/0/7/5。
- 未 build / 未 deploy / 未 preview / 未 push gh-pages / 未 dev server / 未 Blogger / AdSense / GA4 / Google Drive / Search Console / 未動 backfill 語意 / 未猜 Blogger 真值 / 未寫回大型 ledger 至 `CLAUDE.md`。
- Runtime gap 發現：**無**。
- Recommendation：**idle freeze**（sign-off 後）。

（本文件結束 / end of document）
