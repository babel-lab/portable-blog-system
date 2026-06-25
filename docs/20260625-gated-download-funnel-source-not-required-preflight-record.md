# Gated download funnel — source landing not required preflight record（docs-only）

- Phase id：`20260625-am-gated-download-funnel-source-not-required-preflight-a`
- 日期：2026-06-25（Asia/Taipei）
- 類型：**docs-only preflight evidence record**（不改 source / content / settings / package / lockfile / dist / gh-pages / .cache / generated HTML / Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin write path / CLAUDE.md / MEMORY.md / memory/）
- frozen baseline：`main @ a982432`（HEAD == origin/main，ahead/behind 0/0，working tree clean，`.git/index.lock` absent）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）
- 前序：
  - `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 platform-agnostic spec lock；§2.1–§2.3 結論「既有 selector 已涵蓋 funnel 兩端，本文 funnel spec 不需新增 selector / fixture / validator rule」）
  - `docs/20260624-download-listing-special-page-preflight-spec-lock.md`（download special page schema lock；SP-2/SP-3/SP-4a/SP-5a/SP-8/SP-9b 既有）
  - `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 default-trigger warning landed）
  - `docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md`（Slice 2 listing selector opt-in landed）

---

## 0. 本文目的與非目的

### 目的

把「gated download funnel **目前不需要 source landing**」之判斷做 docs-only 可追溯憑證：

1. 列出 funnel 兩端（Layer A indexed entry / Layer B noindex gated）所需之 selector / validator / fixture 覆蓋面。
2. 對應 repo 內既有 source / fixture，逐項標記 coverage 狀態。
3. 引用 spec lock §2.1–§2.3 之既有結論，鎖定「不需要新增 selector / fixture / validator rule」之決定。
4. 留下 inventory commands、coverage table、verdict、explicit non-actions、recommended next phase。

### 非目的（本 phase 一律不做）

- ❌ 不改 `src/**`（含 build / validator / EJS / Admin / selector / 純函式 helper）
- ❌ 不改 `content/**` / `settings/**` 任何 frontmatter / registry / fixture
- ❌ 不改 `package.json` / lockfile / `dist*` / `.cache` / gh-pages
- ❌ 不執行 build / deploy / dev / preview / repost
- ❌ 不動 Blogger live / Google Form / Google Drive / AdSense / GA4 backend / Search Console
- ❌ 不啟動 Admin write path / `--apply` / `dryRun:false`
- ❌ 不改 CLAUDE.md / MEMORY.md / memory/
- ❌ 不啟動 §7 future phases（F1–F9）任一
- ❌ 不對既有 production posts 做 listing intent 預先裁定

---

## 1. Baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `a98243241f74963e9da664acf6c6cf098aea0ae2` |
| short | `a982432` |
| latest subject | `docs(download): lock gated funnel architecture` |
| origin/main | `a98243241f74963e9da664acf6c6cf098aea0ae2`（同 HEAD） |
| ahead / behind | `0 / 0` |
| working tree | clean（`git status --short` 空輸出） |
| `.git/index.lock` | absent |

---

## 2. Inventory commands 摘要（read-only）

```text
pwd
git branch --show-current
git rev-parse HEAD
git log -1 --oneline
git status --short
git status --branch --short
git rev-list --left-right --count origin/main...HEAD
test -f .git/index.lock

Glob：
  src/scripts/page-type-*.js
  src/scripts/include-in-*.js
  src/scripts/platform-policy-*.js
  src/scripts/check-*.js
  content/validation-fixtures/github/posts/_test-page-type-*.md
  content/validation-fixtures/github/posts/_test-page-gated-download-*.md

ls content/validation-fixtures/github/posts/ | grep -iE "(gated|download|listing|sitemap|noindex|page-type|special-page)"

Read（read-only）：
  src/scripts/page-type-robots.js
  src/scripts/include-in-sitemap.js
  src/scripts/include-in-listings.js
  content/validation-fixtures/github/posts/_test-page-type-gated-download-valid.md
  docs/20260624-gated-download-funnel-spec-lock.md

Grep（read-only）：
  "gated_download|gatedDownload" in src/scripts/validate-content.js（rule lines 76 / 1623–1647 / 1656–1672 / 1697 命中）
```

未執行任何 `git checkout` / `reset` / `rebase` / `commit`（本記錄完成前）/ `push` / `build` / `deploy` / `npm install`。

---

## 3. Existing coverage table

### 3.1 Selector / resolver 覆蓋

| 項次 | funnel 規則 | 既有 source | 行 / 函式 | 覆蓋狀態 |
| --- | --- | --- | --- | --- |
| 1a | `pageType: gated_download` → robots `noindex, follow` | `src/scripts/page-type-robots.js` | L60–L79 `derivePageTypeRobots()` `case 'gated_download'` → `'noindex, follow'` | ✅ 直接命中 |
| 1b | `pageType: download` → robots `noindex, follow` | `src/scripts/page-type-robots.js` | 同上，`case 'download'` 同分支 | ✅ |
| 1c | `pageType: utility_hidden` → robots `noindex, nofollow` | 同上 | L72–L74 | ✅ |
| 1d | `pageType: redirect_canonical` → robots `noindex, follow` | 同上 | L67–L71 | ✅ |
| 1e | explicit `seo.indexing` 永遠最高優先（不被 pageType 推導蓋過） | 同上 | L121–L128 `computeBaseRobots()` 步驟 1 | ✅ |
| 1f | `contentKind: download` legacy safety（即使 pageType 不存在）→ `noindex, follow` | 同上 | L131 步驟 2 | ✅ |
| 1g | SP-9b：`platformPolicy.github.indexing` **tighten-only**（不放寬 explicit noindex / download / special pageType） | 同上 | L33–L45 `isStrictlyTighter()` + L107–L117 `resolvePostDetailRobots()` 末段 | ✅ |
| 2a | `seo.indexing: noindex-*` 永遠排除 sitemap | `src/scripts/include-in-sitemap.js` | L36–L43 `isSitemapEligible()` 步驟 1 | ✅ |
| 2b | `contentKind: download` 且非顯式 index → 排除 sitemap（legacy SEO-1） | 同上 | L42 步驟 2 | ✅ |
| 2c | top-level `includeInSitemap: false` → 顯式排除 | 同上 | L60–L65 `resolveIncludeInSitemap()` 步驟 2 | ✅ |
| 2d | SP-9b：`platformPolicy.github.includeInSitemap: false` 可額外排除；`true` no-op（不放寬 safety） | 同上 | L65–L70 步驟 3 | ✅ |
| 2e | safety 永遠優先：override `true` **不得**把 noindex/download 強塞 sitemap | 同上 | L60–L63（step 1 short-circuit） + module 註解 L17–L21 | ✅ |
| 3a | top-level `includeInListings: false` 永遠最高優先 | `src/scripts/include-in-listings.js` | L72–L76 `resolveIncludeInListings()` 步驟 1 | ✅ |
| 3b | SP-9b：`platformPolicy.github.includeInListings: false` 可排除；`true` no-op | 同上 | L77–L80 步驟 2 | ✅ |
| 3c | top-level `includeInListings: true` opt-in（覆蓋 Slice 2 default-exclude） | 同上 | L80–L82 步驟 3 | ✅ |
| 3d | Slice 2 default-exclude：`contentKind=download` 或 `pageType ∈ {download, gated_download}` 且未顯式 opt-in → 排除 | 同上 | L33–L47 `isDownloadSpecialPage()` + L82–L85 步驟 4 | ✅ |
| 3e | normal post 預設 include（byte-identical） | 同上 | L85–L86 步驟 5 | ✅ |
| 4 | `platformPolicy.github` 不能放寬特殊頁 noindex / sitemap / listing safety（tighten-only / safety-優先） | 三條 selector 共同保證（1g + 2e + 3b） | 註解明確 `SP-9b tighten-only`、`safety 永遠優先`、`policy true → no-op` | ✅ 三線一致 |

### 3.2 Validator 覆蓋

| 項次 | warning rule | 既有 source | 行 | 覆蓋狀態 |
| --- | --- | --- | --- | --- |
| V1 | `page-type-invalid-enum`（封閉列舉檢查；含 `gated_download` 為合法） | `src/scripts/validate-content.js` | L76 enum 列入 | ✅ |
| V2 | `page-gated-download-invalid-type`（`gatedDownload` 非 plain object） | 同上 | L1623–L1635 | ✅ |
| V3 | `page-gated-download-suspicious-field`（disallowed key；**不**echo value） | 同上 | L86 disallow list + L1637–L1650 | ✅ |
| V4 | `page-gated-download-indexed`（`pageType=gated_download` + `seo.indexing=index`） | 同上 | L1656–L1664 | ✅ |
| V5 | `page-gated-download-in-listings`（`pageType=gated_download` + `includeInListings=true`） | 同上 | L1666–L1675 | ✅ |
| V6 | Slice 1 `download-in-listings-default`（download / gated_download + 缺省 `includeInListings`） | 同上 | L1681–L1700 | ✅ |

### 3.3 Fixture 覆蓋

| Fixture 路徑 | 覆蓋角色 | 對應 warning |
| --- | --- | --- |
| `content/validation-fixtures/github/posts/_test-page-type-gated-download-valid.md` | 合法 gated_download（noindex-follow + listings false + sitemap false + plain `gatedDownload`） | 0 觸發（baseline） |
| `_test-page-type-gated-download-indexed.md` | gated_download + 顯式 index | V4 |
| `_test-page-type-gated-download-in-listings.md` | gated_download + `includeInListings:true` | V5 |
| `_test-page-gated-download-invalid-type.md` | `gatedDownload` 非 plain object | V2 |
| `_test-page-gated-download-suspicious-field.md` | `gatedDownload` 含 disallowed key | V3 |
| `_test-page-type-noindex-in-sitemap.md` | `seo.indexing=noindex-*` + `includeInSitemap:true`（驗 safety 不放寬） | 對應 sitemap safety warning |
| `_test-page-type-noindex-in-listings.md` | `seo.indexing=noindex-*` + `includeInListings:true` | 對應 listings 正交 warning |
| `_test-page-type-redirect-canonical-valid.md` / `-missing-target.md` | redirect_canonical safety | SP-2 redirect-canonical 規則 |
| `_test-page-type-absent-valid.md` | 缺省 pageType → 既有行為 byte-identical | 0 觸發（baseline） |
| `_test-page-type-invalid-unknown.md` | pageType 非列舉值 | V1 |
| `_test-seo-indexing-valid-noindex-follow.md` / `-nofollow.md` / `-invalid-case-noindex-follow.md` | seo.indexing enum 邊界 | SEO indexing 規則 |

（Slice 1 之 `_test-gated-download-in-listings-default-trigger.md` 與本 inventory 之 listing 路徑可能採用 `_test-page-type-gated-download-in-listings.md` 涵蓋；Slice 1 record 為信任來源；本 record 不重做 fixture 清點。）

### 3.4 Smoke / regression check 覆蓋

mirror CLAUDE.md §3a validation baseline（**carry-forward；本 phase 未跑**）：

| 指令 | baseline 結果 |
| --- | --- |
| `npm run validate:content` | 0 / 112 / 102 |
| `node src/scripts/check-page-type-validator.js` | 37 / 0 |
| `src/scripts/check-page-type-robots.js`（檔案存在；非 baseline 列名） | 對應 SP-3 |
| `src/scripts/check-include-in-sitemap.js`（檔案存在；非 baseline 列名） | 對應 SP-5a |
| `src/scripts/check-include-in-listings.js`（檔案存在；非 baseline 列名） | 對應 SP-4a / Slice 2 |
| `src/scripts/check-platform-policy-effective.js`（baseline 中 direct-node smoke） | 40 / 0 |
| `src/scripts/check-platform-policy-github-precedence.js`（檔案存在） | 對應 SP-9b |

→ smoke / regression check **檔案全在**；baseline carry-forward 涵蓋 funnel 兩端。

---

## 4. Spec lock 明確結論引用

`docs/20260624-gated-download-funnel-spec-lock.md` §2.1 / §2.2 / §2.3 已明文：

> 「**既有 selector 已涵蓋 funnel 兩端**；本文 funnel spec **不需新增 selector**。」
>
> 「**驗證鏈已備齊**；本文 funnel spec **不需新增 fixture / validator rule**。」

同檔 §11 推薦：

> 「**保守路徑（建議）= idle freeze**。本 spec lock 不觸發任何後續動作；待 Dean 決定。」

§7 列出之 future phases F1–F9 全部標明「不啟動；只列標籤；每片獨立 phase + Dean explicit approval」。

---

## 5. Verdict — source landing not required

依 §3.1（selector / resolver 覆蓋 17/17 ✅）、§3.2（validator 覆蓋 6/6 ✅）、§3.3（fixture 覆蓋 ≥11 個 ✅）、§3.4（smoke 檔案全在 + baseline carry-forward ✅）、§4（spec lock 自身結論）：

**結論：gated download funnel 之 indexing / sitemap / listings 規則於現有 source 已完整覆蓋；本 session 不需要新增 selector / validator rule / fixture / smoke check / production code。**

具體保證：

1. `pageType: gated_download` **必然**輸出 `noindex, follow`，且不被 `platformPolicy.github` 放寬（tighten-only）。
2. `pageType: gated_download` 或 `seo.indexing: noindex-*` 或 `contentKind=download` 之頁面**必然**不入 sitemap，且 `includeInSitemap: true` / `platformPolicy.github.includeInSitemap: true` 不得放寬 safety。
3. `pageType ∈ {download, gated_download}` 或 `contentKind=download` 之頁面預設不入 listings（Slice 2 default-exclude），僅可由 top-level `includeInListings: true` 明示 opt-in；`platformPolicy.github.includeInListings: false` 可額外排除；`policy: true` 不放寬。
4. 違規組合（gated_download + index / gated_download + in-listings / 缺省 includeInListings 之 gated_download / gatedDownload 非 plain object / gatedDownload 含 disallowed key / pageType 非列舉值）皆有 validator warning + fixture。
5. Layer C（post-submit resource）依 spec lock 只記列舉值、不獨立為 `.md`、不入 repo 任何 secret；對應 schema 邊界已由 V3 `page-gated-download-suspicious-field` 守住（不 echo value）。

---

## 6. Explicit non-actions / red lines（本 phase 一律未動）

| # | 項目 | 狀態 |
| --- | --- | --- |
| 1 | 不改 `src/**`（含 build / validator / EJS / Admin / selector / 純函式 helper） | ✅ 未動 |
| 2 | 不改 `content/**` / `settings/**` 任何 frontmatter / registry / fixture | ✅ 未動 |
| 3 | 不改 sitemap.xml / robots.txt / robots meta（線上效果） | ✅ 未動 |
| 4 | 不改 `package.json` / lockfile / `dist*` / `.cache` / gh-pages | ✅ 未動 |
| 5 | 不執行 build / deploy / preview / repost / dev server | ✅ 未執行 |
| 6 | 不動 Blogger live / Google Form / Google Drive / AdSense / GA4 backend / Search Console | ✅ 未動 |
| 7 | 不啟動 spec lock §7 任一 future phase（F1–F9）之 source / 內容遷移 | ✅ 未動 |
| 8 | 不改 CLAUDE.md / MEMORY.md / memory/ | ✅ 未動 |
| 9 | 不啟動 Slice 3 content migration / Slice 4 / Admin write path / `--apply` / `dryRun:false` | ✅ 未動 |
| 10 | 不對既有 production posts 做 listing intent / funnel role 預先裁定 | ✅ 仍交 Dean 決定 |
| 11 | 不加入 Google Form editor URL / response URL / Drive folder ID / Drive file ID / token / respondent data | ✅ 未動 |
| 12 | 僅新增本 1 個 docs 檔 | ✅ |

紅線（mirror CLAUDE.md §3a + spec lock §3.2 §3.3 §5.3）：

- AdSense `client id` / `slot id` 只存於 `content/settings/ads.config.json`；不得寫入 `docs/` / `CLAUDE.md` / `src/` / `views/` / `tests/` / `package.json` / 任何 frontmatter / 任何 ledger
- Commerce registry 不得含 affiliate dashboard credentials / token / commission / payout / email / 結算密碼
- Download registry 不得含 respondent data / token / API key / OAuth secret / 帳號 email / private permission / Drive folder ID
- Google Forms responses 永遠停留在 Google Forms / Sheets；不進 repo
- 不靠 URL pattern 自動推斷 `pageType` / `contentKind` / `gatedDownload.mechanism`；全部由作者顯式宣告
- `downloadFunnel.targetGatedPage` / `downloadFunnel.entryPages`（未來欄位；本 phase 不存在）不得填 Google Drive / Form 私密 URL

---

## 7. Final state（本 phase 完成時）

- ✅ 新增 docs-only record 1 個：`docs/20260625-gated-download-funnel-source-not-required-preflight-record.md`（本檔）
- ✅ **完全無 source changes**（src / views / scripts / content / settings / package / lockfile / dist / gh-pages / .cache / generated HTML / CLAUDE.md / MEMORY.md 一律未動）
- ✅ **無 Admin / backend / GA4 / Blogger / AdSense / Search Console / Drive / Google Form / deploy changes**
- ✅ validation baseline carry-forward（本 phase 未跑；無 source 變更不會回退）
- ✅ HEAD = origin/main = `a982432` →（commit 後將更新）；ahead/behind 預期 push 後 0/0；working tree clean

---

## 8. Recommended next phase

- **保守路徑（建議）= idle freeze**。本記錄不觸發任何後續動作。
- 若 Dean 決定推進 funnel 源碼面，建議候選順序為 spec lock §7 之 F1 → F2 → F3/F4/F5 → F6 → F7 → F8 → F9；每片獨立 phase + explicit approval。
- 若 Dean 決定推進 funnel 內容面（注音 / 練練看 / 數字卡 `.md` migration），建議依 F3 / F4 / F5 各自獨立 phase，且須先做 secret preflight（formEmbedUrl public 確認 / 不含 response / edit / Drive ID）。

---

## 9. Cross-links

- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel 三層 spec lock；本記錄直接前序）
- `docs/20260624-download-listing-special-page-preflight-spec-lock.md`（download special page schema lock）
- `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 default-trigger warning landed）
- `docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md`（Slice 2 listing selector opt-in landed）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP-1 平台無關架構提案）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 schema lock）
- `docs/20260623-pm-sp3-github-page-type-robots-precedence.md`（SP-3 robots precedence）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a listing wiring）
- `docs/20260623-pm-sp5a-include-in-sitemap-selector-wiring.md`（SP-5a sitemap wiring）
- `docs/20260623-pm-sp8-platform-policy-shape-validator.md`（SP-8 shape lock）
- `docs/20260624-am-sp9a-platform-policy-effective-derive-helper.md`（SP-9a display-only helper）
- `docs/20260624-sp9c-blogger-platform-policy-operator-guidance.md`（SP-9c Blogger guidance）
- `docs/seo-indexing-rules.md`（SEO indexing 規則總則）
- `CLAUDE.md` §3a / §7 / §11 / §13 / §15–§17 / §21 / §23 / §24 / §29

（本文件結束）
