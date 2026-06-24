# Slice 1 — `download-in-listings-default` validator landing record

- Phase id：`20260624-night-special-page-slice1-default-case-warning-a`
- 日期：2026-06-24（Asia/Taipei）
- 類型：**最小 source landing**（validator warning-only + smoke + fixtures + 1 baseline pin 更新 + docs record）
- 前序：`docs/20260624-download-listing-special-page-preflight-spec-lock.md` §2.D Slice 1
- frozen pre-baseline：`main @ 2ae6826`（HEAD = origin/main，ahead/behind 0/0，working tree clean，`.git/index.lock` absent）
- 影響分類編號（CLAUDE.md §7）：A（規範文件）、J（SEO / 索引；validator 新規則）

---

## 1. Slice 1 scope（per spec lock §2.D Slice 1）

新 warning（rule id）：**`download-in-listings-default`**

觸發條件（同時成立）：
- `contentKind === 'download'` 或 `pageType ∈ {'download', 'gated_download'}`
- `includeInListings === undefined`（既未顯式 `true` 也未顯式 `false`）
- ready / published only（沿用 `validatePageTypeMetadata` 之 outer ready-status gate）

設計理由：補既有 gap —— `page-noindex-in-listings` / `page-gated-download-in-listings` 只在 `includeInListings === true` 顯式時觸發，無法覆蓋「contentKind=download 之 post 因預設仍納入站內列表」之 default case。本 Slice 1 補上此可見性。

**純 validation layer**：不改 build / render / listing / sitemap / robots 行為。

互斥 cascade：
- `includeInListings` 顯式 boolean → 本 rule 不觸發（非法型別由 rule 2 `page-include-flag-invalid-type` 處理）
- 同 post 命中 contentKind=download 與 pageType ∈ {download, gated_download} → 本 rule 只觸發一次（message 列出兩個 cause）
- 與 rule 6 / 8 完全正交

作者修正方式（warning message 提示）：
> declare `includeInListings: true` to keep, or `false` to hide

---

## 2. Files changed

| 檔案 | 變更類型 | 說明 |
| --- | --- | --- |
| `src/scripts/validate-content.js` | M | 新增 rule 6b（`download-in-listings-default`）於 `validatePageTypeMetadata` 內，位於 rule 6 之後（cohesion） |
| `src/scripts/check-page-type-validator.js` | M | 新增 8 個 in-memory tests（38–45），擴展 `pageIssues` filter 以同時涵蓋 `page-*` 與 `download-in-listings-default` 兩家族；test 12 加入 `includeInListings: false` 以隔離 Slice-1 default-case warning |
| `src/scripts/check-validation-report.js` | M | BASELINE 由 `{0, 112, 102}` 更新為 `{0, 133, 105}`，加註 Slice 1 變動原因；comment 字串同步 |
| `content/validation-fixtures/blogger/posts/_test-download-in-listings-default-trigger.md` | A | 新 fixture：`contentKind: download` + `includeInListings` 缺省（trigger）；`seo.indexing: noindex-follow` 避免 `download-content-should-be-noindex` cascade |
| `content/validation-fixtures/blogger/posts/_test-gated-download-in-listings-default-trigger.md` | A | 新 fixture：`pageType: gated_download` + `contentKind: post` + `includeInListings` 缺省（trigger）；`seo.indexing: noindex-follow` 避免 `page-gated-download-indexed` cascade |

---

## 3. Validation baseline before / after

| 指令 | before（`2ae6826`） | after（本 phase） | delta |
| --- | --- | --- | --- |
| `npm run validate:content` | 0 / 112 / 102 | 0 / 133 / 105 | +0 / +21 / +3 |
| `npm run report:validation` | 0 / 112 / 102 | 0 / 133 / 105 | +0 / +21 / +3 |
| `npm run check:validation-report` | 14 / 0 | 14 / 0 | 0 / 0（BASELINE pin 同步更新） |
| `node src/scripts/check-page-type-validator.js` | 37 / 0 | 45 / 0 | +8 / 0（in-memory tests） |
| `npm run check:admin-validation-consume` | 12 / 0 | 12 / 0 | unchanged |
| `node src/scripts/check-platform-policy-github-precedence.js` | 36 / 0 | 36 / 0 | unchanged |

**Slice 1 rule fire count**：22 fires across the run（per spec; 預先預期 baseline 變動）。

**Breakdown of `download-in-listings-default` fires（22 total）**：

| 類別 | 檔案 | fires |
| --- | --- | --- |
| **production** | `content/github/posts/20260504-portable-blog-system-mvp.md` | 1 |
| 既有 download fixtures（contentKind=download）| `_test-download-asset-ref-duplicate` / `_test-download-asset-ref-empty-item` / `_test-download-asset-ref-invalid-type-item` / `_test-download-asset-ref-not-found` / `_test-download-asset-refs-invalid-type-object` / `_test-download-asset-refs-invalid-type-string` / `_test-download-content-should-be-noindex-index` / `_test-download-content-should-be-noindex-missing` / `_test-download-enabled-fileurl-empty` / `_test-download-fileurl-invalid-format` / `_test-download-fileurl-invalid-type` / `_test-download-form-ref-empty` / `_test-download-form-ref-invalid-type-array` / `_test-download-form-ref-invalid-type-object` / `_test-download-form-ref-not-found` / `_test-download-form-ref-whitespace` | 16 |
| 既有 gated_download fixture（pageType=gated_download）| `content/validation-fixtures/github/posts/_test-page-type-gated-download-indexed.md` | 1 |
| 本 phase 新 fixtures | `_test-download-in-listings-default-trigger.md` / `_test-gated-download-in-listings-default-trigger.md` | 2 |
| 文字加總 | | **20 + 2 = 22** ✅ |

**Issue-post delta（+3）**：
1. `portable-blog-system-mvp.md`（previously had 0 issues → 進入 issue-post 統計）
2. 本 phase 新 fixture #1
3. 本 phase 新 fixture #2

→ Spec lock §2.D Slice 1 明文「須新增 fixtures、重量測 baseline；本 phase 不預測數值」+ `20260624-sp-...-opt-in-preanalysis.md` §3.3 / §6 Slice 1 明文「補既有 gap」並指明 `portable-blog-system-mvp.md` 為唯一 production 受影響候選。本 baseline 變動 = spec-required。

---

## 4. Exact smoke commands and results

```text
$ node src/scripts/check-page-type-validator.js
45 passed, 0 failed

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

$ node src/scripts/check-platform-policy-github-precedence.js
36 passed, 0 failed
```

baseline preflight verified at HEAD = `2ae6826`（git stash + restore round-trip）：pre-change baseline = **0 / 112 / 102**（matches CLAUDE.md §3a snapshot）。

---

## 5. Explicit no-touch list（本 phase 完全未動）

- ❌ Admin（views / loader / governance aggregation / write path / Apply / middleware / API）
- ❌ build scripts（build-github / build-blogger / build-promotion / build-sitemap / build-blogger-theme）
- ❌ selectors（include-in-listings / include-in-sitemap / page-type-robots / platform-policy-effective）
- ❌ Blogger guidance（check-blogger-operator-guidance / blogger-copy-helper.ejs / blogger-publish-checklist.ejs）
- ❌ GA4 / AdSense / Search Console / Drive / Google Form 後台
- ❌ Blogger live posts / AdSense dashboard / GA4 dimensions / Drive folders
- ❌ content posts（`content/{site}/posts/**` 任何 `.md` 未動；mvp.md 雖獲 1 新 warning 但檔案內容未改）
- ❌ settings registry（`content/settings/**`）
- ❌ build / deploy / dev / preview / repost
- ❌ dist / dist-blogger / dist-promotion / gh-pages / .cache（除 `.cache/data/validation-report.json` 為 `report:validation` 生成之 git-ignored cache）
- ❌ generated HTML
- ❌ package.json / package-lock / npm install
- ❌ CLAUDE.md / MEMORY.md / memory/
- ❌ force-push / amend / rebase / --no-verify
- ❌ Slice 2 / Slice 3 / Slice 4（一律未啟動）
- ❌ Blogger gated download `.md` migration（屬 Slice 3，未啟動）
- ❌ SP-9b / SP-9e 重啟

---

## 6. Final state（本 phase commit 前）

- working tree changes：
  - M `src/scripts/check-page-type-validator.js`
  - M `src/scripts/check-validation-report.js`
  - M `src/scripts/validate-content.js`
  - A `content/validation-fixtures/blogger/posts/_test-download-in-listings-default-trigger.md`
  - A `content/validation-fixtures/blogger/posts/_test-gated-download-in-listings-default-trigger.md`
  - A `docs/20260624-special-page-slice1-default-case-warning-record.md`（本檔）
- pre-commit HEAD = `2ae6826`；commit 後將更新
- ahead / behind 預期：commit 後 push origin/main → 0 / 0

---

## 7. Next recommended phase（不啟動，僅標籤）

per spec lock §6 + 20260624 listing opt-in preanalysis §6：

- **保守路徑 = idle freeze**。Slice 1 已 land；後續 slice 一律待 Dean explicit approval。
- 候選順序（每片獨立 phase）：
  - `20260XXX-blogger-gated-download-md-migration-a`（Slice 3；內容遷移，no source；先確認 Dean 內容 + secret preflight）
  - `20260XXX-sp-download-default-exclude-listings-opt-in-selector-a`（Slice 2；行為變更；**會改現有輸出**；須 byte-diff `dist/` + 重量測 baseline）
  - `20260XXX-admin-special-page-metadata-write-path-*`（Slice 4；Admin write path 解 dormant 之後）

實際日期前綴以落地當日為準；本 phase **不**預先佔位、**不**啟動任一。

---

## 8. Cross-links

- `docs/20260624-download-listing-special-page-preflight-spec-lock.md` §2.D Slice 1（直接前序 + spec lock）
- `docs/20260624-sp-download-include-in-listings-opt-in-preanalysis.md` §3.3 / §6 Slice 1（gap 識別與 defer 理由）
- `docs/20260623-special-page-types-indexing-metadata-preanalysis.md`（SP 系列整體架構）
- `docs/20260623-pm-sp2-page-type-schema-warning-validator-fixtures.md`（SP-2 schema lock）
- `docs/20260530-download-validation-s1-s2-merge-decision.md`（既有 `download-content-should-be-noindex` 設計）
- `CLAUDE.md` §13 / §14 / §15 / §21 / §23

（本文件結束）
