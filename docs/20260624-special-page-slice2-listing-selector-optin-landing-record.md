# Slice 2 — download / gated_download listing default-exclude opt-in landing record

- Phase id：`20260624-night-special-page-slice2-listing-selector-optin-landing-a`
- 日期：2026-06-24（Asia/Taipei）
- 類型：**最小 source + content backfill landing**（selector flip + smoke + content backfill + 1 docs record；無新 fixtures；無 baseline pin 變更）
- 前序：
  - `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §2.D Slice 2（spec lock）
  - `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 validator landed）
- frozen pre-baseline：`main @ 26a294f`（HEAD = origin/main，ahead/behind 0/0，working tree clean，`.git/index.lock` absent）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、F（GitHub 靜態站 listing selector）、J（SEO / 索引；listing precedence）、C（content frontmatter 單篇 backfill）

---

## 1. Dean explicit decision（本 phase）

- `content/github/posts/20260504-portable-blog-system-mvp.md` listing intent = **keep**
- 授權範圍：
  - Selector flip + content backfill + smoke update
  - `npm run build:github` 僅 verification（不 deploy / 不 push gh-pages / 不動 `dist/`）
- 不授權：deploy / gh-pages push / Blogger live / GA4 / AdSense / Drive / Search Console / Slice 3 / Slice 4 / Admin write path

---

## 2. Slice 2 scope（per spec lock §2.D Slice 2）

**選用設計**：listing selector 對 download / gated_download special page 預設 exclude；作者須顯式 `includeInListings: true` 才能保留 listing 露出。

**selector 行為改變者僅限**：
- `contentKind === 'download'`
- `pageType ∈ {'download', 'gated_download'}`

**normal post 預設行為**：仍 include（byte-identical SP-4a 不變式）。

**SP-9b precedence 不變**：
- top-level `includeInListings === false` 永遠最高優先（policy true 不放寬）
- `platformPolicy.github.includeInListings === false`（override）仍可排除
- policy true 仍 no-op（**不**另闢 opt-in 路徑；只有 top-level true 才能 opt-in 回 listing）

**正交性保持**：
- selector 不讀 `seo.indexing` / `robots` / `includeInSitemap` / `includeInFeeds` / `gatedDownload`
- 不改 sitemap selector（SP-5a 不變）
- 不改 robots meta selector（SP-3 / SP-9b indexing tighten-only 不變）
- 不重啟 SP-9b / SP-9e

**非 boolean 型別**：
- normal post（contentKind 非 download；pageType 非 download/gated_download）+ invalid type → 預設 include（runtime safety）
- download special page + invalid type → 預設 **exclude**（非「明示 true」即不 opt-in）
- validator rule 2 `page-include-flag-invalid-type` 已對非法型別 warn；此處不重複解讀

---

## 3. Files changed

| 檔案 | 變更類型 | 說明 |
| --- | --- | --- |
| `content/github/posts/20260504-portable-blog-system-mvp.md` | M（frontmatter only） | 新增 `includeInListings: true` + 註解段（per Dean decision: listing intent = keep）；body 未動 |
| `src/scripts/include-in-listings.js` | M | 新增 `DOWNLOAD_PAGE_TYPES` 常數 + `isDownloadSpecialPage` 純函式 helper；`resolveIncludeInListings` 新增 Slice 2 default-exclude 分支（介於 top-level true opt-in 與 normal post default include 之間）；JSDoc + 頂部 phase comment 同步更新 |
| `src/scripts/check-include-in-listings.js` | M | 全面重寫測試矩陣（21 assertions）：R1–R10 對應 user-required 10 條 contract；R11–R21 補強覆蓋 invalid type / runtime safety / mvp shape / 防呆 |
| `src/scripts/check-platform-policy-github-precedence.js` | M | 更新 C.4 + C.9（**只**這兩個 case）：C.4 `contentKind:download + policy true` 由 `true` 改為 `false`（policy true 仍 no-op，但 default 自 SP-4a include 改為 Slice 2 exclude）；C.9 補一條 `contentKind:download + includeInListings:true → true` 之 opt-in 鎖；其他 C.1–C.3, C.5–C.8, C.10 完全未改 |
| `docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md` | A | 本檔 |

**未動**：
- `src/scripts/validate-content.js`（warning-only 規則 6b 仍由 Slice 1 鎖住；本 phase 不動）
- `src/scripts/check-validation-report.js`（BASELINE pin `{0, 133, 105}` 不變；warning 數值同 Slice 1）
- `src/scripts/check-page-type-validator.js`（45 assertion 全 PASS；本 phase 不動）
- `src/scripts/check-admin-validation-consume.js`（12 PASS；不動）
- `src/scripts/page-metadata-summary.js`（Admin display 委派 `resolveIncludeInListings`，自動跟隨；不需改）
- `src/scripts/build-github.js`（消費 `shouldIncludeInListings`，自動跟隨；不需改）
- 其他 fixtures / content posts / settings registry / package.json / lockfile / Blogger templates / GA4 / AdSense / Drive / Google Form 後台 / dist / gh-pages

---

## 4. Selector precedence（old vs new）

| 順序 | 舊（Slice 1 後 / Slice 2 前） | 新（Slice 2 後） |
| --- | --- | --- |
| 1 | top-level `includeInListings === false` → false | **unchanged** |
| 2 | `platformPolicy.github.includeInListings === false`（override）→ false | **unchanged**（SP-9b 不變） |
| 3 | — | **新**：top-level `includeInListings === true` → true（明示 opt-in） |
| 4 | — | **新**：`contentKind === 'download'` 或 `pageType ∈ {download, gated_download}` → false（default-exclude；無論 includeInListings 為 undefined / 非 boolean / null / inherit） |
| 5 | 其餘 → true（預設 include） | **unchanged**（normal post 預設仍 include；byte-identical） |

---

## 5. Validation baseline before / after

| 指令 | before（pre-Slice-2，HEAD `26a294f`） | after（本 phase） | delta |
| --- | --- | --- | --- |
| `npm run validate:content` | 0 / 133 / 105 | 0 / 133 / 105 | 0 / 0 / 0 |
| `npm run report:validation` | 0 / 133 / 105 | 0 / 133 / 105 | 0 / 0 / 0 |
| `npm run check:validation-report` | 14 / 0 | 14 / 0 | 0 / 0（BASELINE pin 未改） |
| `node src/scripts/check-page-type-validator.js` | 45 / 0 | 45 / 0 | 0 / 0 |
| `npm run check:admin-validation-consume` | 12 / 0 | 12 / 0 | 0 / 0 |
| `node src/scripts/check-include-in-listings.js` | 14 / 0（pre-Slice-2 smoke） | 21 / 0（Slice 2 contract 重寫 + 補強） | +7 / 0 |
| `node src/scripts/check-platform-policy-github-precedence.js` | 36 / 0 | 36 / 0 | 0 / 0（C.4 / C.9 expected 翻轉；count 不變） |

### 5.1 mvp.md warning fingerprint（before / after）

| 階段 | 警告數 | 警告類別 |
| --- | --- | --- |
| Slice 1 後 / Slice 2 前 | 1 | `download-in-listings-default`（rule 6b；contentKind=download + includeInListings 缺省） |
| Slice 2 後 | 1 | `page-noindex-in-listings`（rule 8；seo.indexing=noindex-follow + includeInListings=true；屬「noindex + in-listings」**合法但罕見**之 informational warning，per spec lock §1.3 / opt-in preanalysis §1.4） |

→ **net delta**：mvp.md 由「rule 6b 觸發 1 次」改為「rule 8 觸發 1 次」；issue-post 身份未變；warning 總數 0 變化；issue-post 總數 0 變化。

### 5.2 為何 baseline pin 不改

per Dean instruction：
> Modify validation/report baseline pin only if the warning count legitimately changes because `mvp.md` is now explicit.

實際 warning 總數 = 133，issuePost 總數 = 105，與 Slice 1 後 BASELINE pin `{0, 133, 105}` 完全一致。
→ **不**修改 `src/scripts/check-validation-report.js` 之 BASELINE 常數；mirror 既有 14/0 PASS。

---

## 6. Exact smoke commands and results

```text
$ node src/scripts/check-include-in-listings.js
21 passed, 0 failed
# R1–R10 對應 user-required 10 條 contract；R11–R21 補強（invalid type / mvp shape / 防呆 / lower-level mirror）

$ node src/scripts/check-platform-policy-github-precedence.js
36 passed, 0 failed
# C.4 / C.9 case expectation 已 flip 對齊 Slice 2；C.1–C.3, C.5–C.8, C.10 完全未動

$ node src/scripts/check-page-type-validator.js
45 passed, 0 failed
# Slice 1 validator 鎖未受 Slice 2 影響

$ npm run validate:content
0 error(s) / 133 warning(s) on 105 post(s)

$ npm run report:validation
[report-validation] totals: 0 error(s) / 133 warning(s) / 105 issue-post(s)
[report-validation] bySourcePath=105 settings=0 fixtures=104 crossPost=2

$ npm run check:validation-report
PASS  B2 totals match validate:content baseline (0/133/105)
14 passed / 0 failed

$ npm run check:admin-validation-consume
12 passed / 0 failed
```

baseline preflight 在 HEAD = `26a294f` 量測（make-changes 前）：`validate:content` = 0 / 133 / 105，與本 phase 完成後一致。

---

## 7. Build / dist verification（Dean explicit-authorized）

```text
$ npm run build:github
[build-github] done in 171ms
[build-github] wrote .cache/pages/index.html
[build-github] wrote .cache/pages/posts/index.html
[build-github] wrote .cache/pages/posts/portable-blog-system-mvp/index.html
... (其他 detail / category / tag / design-system / admin 略)

$ grep -c "portable-blog-system-mvp" .cache/pages/index.html .cache/pages/posts/index.html \
    .cache/pages/categories/tech-note/index.html .cache/pages/tags/github/index.html
.cache/pages/index.html:1
.cache/pages/posts/index.html:1
.cache/pages/categories/tech-note/index.html:1
.cache/pages/tags/github/index.html:1

$ grep -c "we-media-myself2\|github-pages-blog-planning\|portable-blog-system-mvp" \
    .cache/pages/posts/index.html .cache/pages/index.html
.cache/pages/posts/index.html:3
.cache/pages/index.html:3
```

### 7.1 dist / generated HTML 處置

- `build-github.js` 輸出 → `.cache/pages/**`（**git-ignored**，per `.gitignore`，`git check-ignore .cache` 確認 ignored）
- `dist/` 為 vite build 之輸出位置；本 phase **未** 跑 `npm run build`（vite build），`dist/` 為空目錄
- **不** commit 任何 generated HTML
- 本 phase commit 之檔案僅限：1 個 content frontmatter + 3 個 source `.js` + 1 個 docs record

### 7.2 listing-page spot-check 結論

| 預期 | 觀察 | 結果 |
| --- | --- | --- |
| `portable-blog-system-mvp` 仍列於 home / posts / category(tech-note) / tag(github) | 4 個 listing surface 各 1 次出現 | ✅ PASS（顯式 `includeInListings:true` opt-in 生效） |
| `we-media-myself2` / `github-pages-blog-planning` 仍列 | home + posts index 各 3 篇 | ✅ PASS（normal post default include 不變） |
| post-detail 頁仍對全 3 篇 production 生成 | `.cache/pages/posts/portable-blog-system-mvp/index.html` 等檔存在 | ✅ PASS（detail 生成不受 listing 過濾影響；mvp 仍可訪問雖 `noindex, follow`） |
| 無其他 download/gated production post 受 selector flip 影響 | 唯一 live download post = mvp.md（per spec lock §1.6）；其餘 download 為 draft / template / fixture，不進 build | ✅ PASS（per inventory；本 phase 未引入新內容） |

→ Slice 2 selector flip **不破壞** 既有 production listing 輸出（mvp.md opt-in 後仍在；normal post byte-identical）。

---

## 8. Explicit no-touch list（本 phase 完全未動）

- ❌ Admin（views / loader / governance aggregation / write path / Apply / middleware / API；K8 / K9 / R2+ 一律未動）
- ❌ build scripts（build-github / build-blogger / build-promotion / build-sitemap / build-blogger-theme；除 build-github 之 verification run，未改 source）
- ❌ 其他 selectors（include-in-sitemap / page-type-robots / platform-policy-effective；本 phase 只動 listing selector）
- ❌ validator（validate-content.js / check-page-type-validator.js / check-admin-validation-consume.js；Slice 1 規則仍鎖）
- ❌ Blogger guidance（check-blogger-operator-guidance / blogger-copy-helper.ejs / blogger-publish-checklist.ejs）
- ❌ Blogger live posts / AdSense dashboard / GA4 / GA4 dimensions / Drive folders / Search Console / Google Form 後台
- ❌ content posts（除 `content/github/posts/20260504-portable-blog-system-mvp.md` frontmatter 6 行 backfill 外，無任何 .md 內容變動；body 未動；其他 post 完全未碰）
- ❌ Blogger gated download `.md` migration（屬 Slice 3，未啟動；無新 `.md` 建立；無 Form / Drive metadata 進 repo）
- ❌ settings registry（`content/settings/**`）
- ❌ fixtures（`content/validation-fixtures/**` 一律未動；無新 fixture）
- ❌ package.json / package-lock / npm install / 新 dependency
- ❌ CLAUDE.md / MEMORY.md / memory/
- ❌ deploy / preview / gh-pages push / Blogger live repost
- ❌ generated HTML / dist / dist-blogger / dist-promotion / gh-pages（除 `.cache/**` 為 git-ignored build output，仍未 commit）
- ❌ force-push / amend / rebase / `--no-verify`
- ❌ Slice 3 / Slice 4 / Admin write path 解 dormant / SP-9b 或 SP-9e 重啟
- ❌ Reverse UTM / FB sidecar / commerce L2+ / download production migration / AdSense Batch 2 P2 P3 live repost

---

## 9. Final git state（本 phase commit 前）

```text
$ git status --short
 M content/github/posts/20260504-portable-blog-system-mvp.md
 M src/scripts/check-include-in-listings.js
 M src/scripts/check-platform-policy-github-precedence.js
 M src/scripts/include-in-listings.js
# 預計 add：
#   M 上 4 個
#   A docs/20260624-special-page-slice2-listing-selector-optin-landing-record.md（本檔）
```

pre-commit HEAD = `26a294f`（origin/main）；commit 後將更新；ahead/behind 預期 push 後 0/0。

---

## 10. Recommended next phase（不啟動，僅標籤）

per spec lock §6 + opt-in preanalysis §6：

- **保守路徑 = idle freeze**。本 Slice 2 已 land + verify；後續 slice 一律待 Dean explicit approval。
- 候選順序（每片獨立 phase + explicit approval；mirror Slice 1 closeout 之建議）：
  - `20260XXX-blogger-gated-download-md-migration-a`（Slice 3；內容遷移；無 source；須先 Dean 提供內容 + secret preflight：Drive folder ID / form response / token 等**不**進 repo 之確認）
  - `20260XXX-admin-special-page-metadata-write-path-*`（Slice 4；Admin write path 解 dormant 之後）
  - download production live post / sitemap `*-mvp` 之 fingerprint 觀察（屬 SEO / Search Console 監看，非 source phase）

實際日期前綴以落地當日為準；本 phase **不**預先佔位、**不**啟動任一。

---

## 11. Cross-links

- `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §2.D Slice 2（直接前序 + spec lock）
- `docs/20260624-sp-download-include-in-listings-opt-in-preanalysis.md` §6 Slice 2（行為變更影響與 byte-diff 預期）
- `docs/20260624-special-page-slice1-default-case-warning-record.md`（Slice 1 validator landed；對 mvp.md 之 default-case warning 由本 Slice 2 因 backfill 而解消，置換為 rule 8 informational warning）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md` §2.4（SP-4 listing inclusion 平台無關架構）
- `docs/20260623-sp4-include-in-listings-inventory-preflight.md` §H / §I（SP-4 selector 邊界）
- `docs/20260623-pm-sp4a-include-in-listings-selector-github-wiring.md`（SP-4a wiring base）
- `docs/20260624-sp9b-conservative-precedence-a-...`（SP-9b SP-4a precedence；本 Slice 2 不改 policy 半邊）
- `docs/seo-indexing-rules.md`（SEO indexing 規則總則；本 Slice 2 不動 robots）
- `CLAUDE.md` §13（download 文章規則）、§14–§15（tags / category）、§21（SEO）、§23（draft / ready / published / archived）

（本文件結束）
