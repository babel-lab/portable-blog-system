# Blogger Bopomofo funnel — content pair landing record（draft pair, Blogger-only）

- Phase id：`20260626-blogger-bopomofo-funnel-content-pair-landing-a`
- 日期：2026-06-26（Asia/Taipei）
- 類型：**content `.md` draft landing only / Blogger-only / no live publish / no source implementation**
- 影響分類編號（CLAUDE.md §7）：C（內容資料 / Markdown 文章）、A（landing record docs）
- 授權：Dean explicit approval（限定本 phase scope：兩篇 draft `.md` + 一份 landing record，無其他寫入）
- 性質：依 spec-lock + 兩份 preflight + readiness map + input packet 落地 **注音字卡 family** 之 funnel pair（entry + gated）為 Blogger 端 **draft** `.md`；同一 commit 落地以避免 F8 bidirectional reciprocity transient warning。

---

## 1. Baseline

進場 baseline（read-only verify；未跑 pre-mutation script 前）：

| 檢查 | 值 |
| --- | --- |
| repo | `D:/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD（進場） | `e7c46d49fc962c7e2b99a834706e1d553906d0c3`（`e7c46d4`） |
| origin/main（進場） | 同 HEAD |
| ahead / behind | `0 / 0` |
| working tree | clean（`git status --short` 空輸出） |
| `.git/index.lock` | absent |
| 進場 latest subject | `docs(state): sync funnel spec lock baseline` |

進場目標檔不存在 ✅：

- `content/blogger/posts/20260626-bopomofo-practice-cards-entry.md` → 不存在
- `content/blogger/posts/20260626-bopomofo-practice-cards-access.md` → 不存在
- `docs/20260626-blogger-bopomofo-funnel-content-pair-landing-record.md` → 不存在（本檔）

pre-mutation validate snapshot（read-only，作為 regression 對照）：

| 指令 | 結果 |
| --- | --- |
| `npm run validate:content` | `0 / 134 / 106`（matches CLAUDE.md §3a baseline） |

---

## 2. Phase name + changed files

phase name：`20260626-blogger-bopomofo-funnel-content-pair-landing-a`

changed files（**僅** 3 新增 / 0 修改 / 0 刪除）：

1. `content/blogger/posts/20260626-bopomofo-practice-cards-entry.md`（新增；layer A indexed entry draft）
2. `content/blogger/posts/20260626-bopomofo-practice-cards-access.md`（新增；layer B gated_download draft）
3. `docs/20260626-blogger-bopomofo-funnel-content-pair-landing-record.md`（新增；本檔）

**未動**檔案：

- ❌ 既有 draft `content/blogger/posts/20260529-phonics-practice-sheet-download.md`（僅 read-only 參考；本 phase 不變動其歸屬 / 去留 / wording / metadata）
- ❌ `src/**`（含 validator / scripts / EJS / SCSS / JS / Admin / selector）
- ❌ `content/settings/**`（含 categories.json / tags.json / 任何 registry / GA4 / ads / download-* / 等）
- ❌ `package.json` / lockfile
- ❌ `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages` / `.cache` / generated HTML
- ❌ `CLAUDE.md` / `MEMORY.md` / `memory/`
- ❌ Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin write path

---

## 3. Why same-commit pair landing

依 readiness map §5.1 #3、preflight（entry）§9、preflight（gated）§8、input packet §8：

- **避免 F8 bidirectional reciprocity transient warning**：entry + gated 同 commit 落地，則 entry 的 `targetGatedPage` 與 gated 的 `entryPages[]` 在第一次 corpus pass 即雙向可解析 → 0 warning，mirror group 1 valid pair sealed 行為。
- **避免分批期間誤留單向 ref**：若分批落 entry 再落 gated（或反之），雖然 dangling simple slug 當前 deferred-silent（0 warning），但第二次必須同時補互指；漏補 → reciprocity warning（`downloadFunnel-entry-page-not-listed-by-gated-page` / `downloadFunnel-gated-page-not-targeted-by-entry`）。同 commit 落地是最不易出錯之做法。
- **mirror group 1 valid fixture pair sealed 行為**：fixture corpus 中 `_test-download-funnel-valid-entry.md` ↔ `_test-download-funnel-valid-gated-page.md` 即同 phase 落地之雙向 0 warning 範例。

---

## 4. Entry page metadata summary（layer A）

`content/blogger/posts/20260626-bopomofo-practice-cards-entry.md`：

| 欄位 | 值 / 規則對照 |
| --- | --- |
| `site` | `blogger`（per spec-lock：funnel 當前僅 Blogger active；GitHub `future_possible_not_active`） |
| `status` / `draft` | `draft` / `true`（per spec：禁 published；validatePageTypeMetadata + funnel role/policy/robots-safety/private-value 全 READY_STATUS gated → draft 不觸發） |
| `contentKind` | `post`（VALID_CONTENT_KIND；entry 不必為 download，per preflight §4 E-3） |
| `primaryPlatform` | `blogger` |
| `category` | `download`（categories.json 有 entry `id:download, site:[blogger]` → `unknown-category` / `category-site-mismatch` 0 warning） |
| `tags` | `[]`（空陣列；draft 不觸發 `empty-tags`（READY_STATUS gated），亦不觸發 `unknown-tag`） |
| `slug` | `bopomofo-practice-cards-entry` |
| `pageType` | `article`（VALID_PAGE_TYPE；**禁** `gated_download`，per preflight §4 E-4） |
| `seo.indexing` | `index`（VALID_SEO_INDEXING；entry 走 normal indexed path） |
| `includeInSitemap` | `true`（entry 應進 sitemap） |
| `includeInListings` | `true`（entry 應進站內列表；normal post default） |
| `platformPolicy.blogger.indexing` / `.github.indexing` | `index`（記錄事實；valid enum：`inherit/index/noindex-follow/noindex-nofollow`） |
| `downloadFunnel.role` | `entry`（VALID_DOWNLOAD_FUNNEL_ROLE） |
| `downloadFunnel.targetGatedPage` | `bopomofo-practice-cards-access`（simple slug；指向 gated draft 之 slug；非 Drive/Form/token → `looksLikePrivateFunnelLink` 0 false） |
| `downloadFunnel.ctaEventName` | `click_all_download`（沿用既有 GA4 event；spec-lock §2.4；不改 GA4 backend） |
| `publishTargets.blogger` | `enabled: true, mode: full` |
| `publishTargets.github` | `enabled: false`（GitHub funnel `future_possible_not_active`） |
| `canonical` | `""`（空字串；**未**用 `auto`；待 Dean 於 publish phase 顯式指定） |
| `cover` | `""`（draft 不觸發 `missing-cover`） |
| visible content | 全部以 `<…placeholder>` 標記；**未**使用 `display:none` / `visibility:hidden` / off-screen positioning（per spec-lock §1.4 / §6） |

---

## 5. Gated page metadata summary（layer B）

`content/blogger/posts/20260626-bopomofo-practice-cards-access.md`：

| 欄位 | 值 / 規則對照 |
| --- | --- |
| `site` | `blogger` |
| `status` / `draft` | `draft` / `true` |
| `contentKind` | `download`（VALID_CONTENT_KIND；gated 體裁為 download） |
| `primaryPlatform` | `blogger` |
| `category` | `download` |
| `tags` | `[]` |
| `slug` | `bopomofo-practice-cards-access` |
| `pageType` | `gated_download`（VALID_PAGE_TYPE；觸發 robots noindex 自動推導 + Slice 2 listings default-exclude） |
| `seo.indexing` | `noindex-follow`（gated 不被索引；F6 robots-safety 不觸發） |
| `includeInSitemap` | `false`（顯式排除；safety 已 cover；F4 sitemap-safety 一致） |
| `includeInListings` | `false`（顯式排除；Slice 2 default 已 exclude；F4 listings-default 一致） |
| `platformPolicy.blogger.indexing` | `noindex-nofollow`（事實紀錄；Blogger 後台 NO INDEX 仍須 Dean 手動設定） |
| `platformPolicy.github.indexing` | `noindex-nofollow`（事實紀錄；GitHub 三平台皆 noindex） |
| `platformPolicy.future.indexing` | `noindex-nofollow`（預留 merged-domain；三平台皆 noindex） |
| `gatedDownload.mechanism` | `google-form` |
| `gatedDownload.formEmbedUrl` | `""`（空字串；public embed only；遷移當下才填；**禁** edit URL / response URL） |
| `gatedDownload.postSubmitResource` | `drive-link`（列舉值 only；不寫真實 Drive URL / ID） |
| `downloadFunnel.role` | `gated_page` |
| `downloadFunnel.entryPages` | `["bopomofo-practice-cards-entry"]`（互指對端 entry slug） |
| `publishTargets.blogger` | `enabled: true, mode: full` |
| `publishTargets.github` | `enabled: false` |
| `canonical` | `""`（**未**用 `auto`，per spec-lock §3.2） |
| visible content | 全部以 `<…placeholder>` 標記；含 visible 表單說明 / 使用限制 / post-submit 顯示 / feedback / Form embed 區塊（皆 placeholder） |

---

## 6. Security / SEO / sitemap / listings safety

| 規則 | 狀態 |
| --- | --- |
| gated_download 不可 index | ✅ `pageType: gated_download` 自動推 robots `noindex, follow`（SP-3）；`seo.indexing: noindex-follow` 顯式 |
| gated_download 不可進 sitemap | ✅ `includeInSitemap: false` 顯式；noindex-* safety 自動 cover |
| gated_download 不可進 listings | ✅ `includeInListings: false` 顯式；Slice 2 default-exclude；**禁** opt-in `true` |
| indexed entry 可 index / sitemap / listings | ✅ `seo.indexing: index` + `includeInSitemap: true` + `includeInListings: true` |
| platformPolicy 不放寬 noindex/special pageType | ✅ gated 之三 platform 皆 `noindex-nofollow` |
| canonical 不可 auto | ✅ 兩篇 `canonical: ""`（empty，非 auto） |
| 不寫真實 Google Form URL / Drive ID / token / respondent data / secret | ✅ `gatedDownload.formEmbedUrl: ""` / `postSubmitResource: drive-link`（enum only） |
| 不放真實下載連結於 entry | ✅ entry CTA 僅指向 gated slug |
| visible content discipline（禁 hidden SEO） | ✅ 全 placeholder 皆為 visible 文案；無 `display:none` / `visibility:hidden` |
| Blogger 後台 NO INDEX | ⚠️ 系統無法 inject Blogger head；**須 Dean 於 Blogger 後台手動設定**（gated 草稿正文已標示警語；per spec-lock §2.5 / preflight §6.1） |
| 既有 `20260529-phonics-practice-sheet-download.md` 不動 | ✅ 僅 read-only 參考；未修改 |
| 不建立 GitHub funnel content | ✅ 兩篇 `publishTargets.github.enabled: false` |

---

## 7. Explicit non-goals（本 phase 一律不做）

- ❌ no Blogger / Google Form / Google Drive / GA4 / AdSense / Search Console / Admin backend access
- ❌ no live publish（Blogger / GitHub Pages 皆不 publish；draft only）
- ❌ no real Form embed URL / Drive ID / Drive URL / OAuth token / API key / respondent data 寫入 repo
- ❌ no `src/**` change（含 validator / scripts / EJS / SCSS / JS / Admin / selector / 純函式 helper）
- ❌ no `content/settings/**` change（含 categories.json / tags.json / ads / GA4 / download-* / 任何 registry）
- ❌ no `package.json` / lockfile / `dist*` / `gh-pages` / `.cache` / generated HTML change
- ❌ no `CLAUDE.md` / `MEMORY.md` / `memory/` change
- ❌ no build（含 `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `preview` / dev server）
- ❌ no deploy
- ❌ no 練練看 / 數字卡 family 落地（各須獨立 phase + Dean approval）
- ❌ no GitHub funnel content（`future_possible_not_active`，per input packet §16）
- ❌ no 既有 `20260529-phonics-practice-sheet-download.md` 改動
- ❌ no validation baseline bump（兩篇 draft 預期 0 added warning；issuePostCount 不變）
- ❌ no new tag / new category 建立（registry 無對應；改用 `tags: []` + `category: download`）
- ❌ no `pageType: standard_download_entry` 寫入（未進 VALID_PAGE_TYPE；改用 `article`，per preflight §4 E-4）
- ❌ no rebase / amend / force-push / cherry-pick / merge / reset
- ❌ no slash command

---

## 8. Validation commands and results

post-mutation validation（regression check；無 file mutation 風險）：

| # | 指令 | 預期 | 實際 |
| --- | --- | --- | --- |
| 1 | `npm run validate:content` | `0 / 134 / 106`（無 added warning；issuePostCount 不變） | （填入實際結果） |
| 2 | `npm run report:validation` | `0 / 134 / 106`（同上；輸出至 `dist-reports/`，gitignored） | （填入實際結果） |
| 3 | `npm run check:validation-report` | `27 / 0`（assert BASELINE = 0/134/106；B7 funnel scanned invalid fixture 仍 exactly 1） | （填入實際結果） |
| 4 | `node src/scripts/check-page-type-validator.js` | `103 / 0` | （填入實際結果） |

說明：
- pre-mutation 已 read-only verify `validate:content` 為 `0 / 134 / 106`（與 CLAUDE.md §3a 一致）。
- 本 phase 兩 draft posts 預期 0 added warning，理由：
  1. `validatePageTypeMetadata`（含 funnel F2 / F4 / F6 / F7 + gated_download suspicious-field + page-type / sitemap / listings safety）為 `READY_STATUS` gated → draft 不觸發
  2. F8 bidirectional reciprocity 非 `READY_STATUS` gated，但本對之雙向互指完整 → 0 warning
  3. `category: download` 在 Blogger registry → 0 unknown-category
  4. `tags: []` 空陣列 → `empty-tags`（READY_STATUS gated）不觸發；`unknown-tag` 因無 tag 而不觸發
  5. 兩 slug 為 corpus 新值 → `duplicate-slug` 0 觸發
- 若實際 validation 出現 warning/error，依本 phase 紀律：**不**自行 baseline bump / 不改 validator / source / settings；停止回報原因與最小修正建議。

---

## 9. Final freeze result

（落地後 read-only 填入）

| 檢查 | 值 |
| --- | --- |
| 落地後 HEAD | `<填入 final HEAD>` |
| origin/main | `<填入>` |
| ahead / behind | `<填入>` |
| working tree | `<填入>` |
| `.git/index.lock` | `<填入>` |
| latest subject | `docs(content): land blogger bopomofo funnel draft pair` |

---

## 10. Next recommended phase（建議，不執行）

候選（每片獨立 phase + Dean explicit approval；本 phase 不啟動任一）：

1. **保守路徑（建議）= idle freeze**。注音 family pair draft 已落，後續由 Dean 決定下一步。
2. **content wording follow-up**（注音 family）：Dean 補齊 placeholder（entry intro / update log / CTA copy + gated form intro / usage restriction / feedback / post-submit display）；仍為 draft，不 publish。
3. **練練看 family pair landing**：mirror 本 phase 結構新增 entry + gated draft pair；獨立 phase（不混批）。
4. **數字卡 family pair landing**：同上。
5. **Blogger live publish phase（注音 family）**：須 Dean 同時提供 (a) wording 定稿 (b) Google Form public embed URL ready (c) Blogger 後台 NO INDEX 已手動設定 (d) explicit approval；屬獨立 phase。
6. **F1 source phases**（`pageType` enum validation / `downloadTargets[]` cardinality / `resourceAccess` / `layoutPolicy` 等）：仍 deferred；屬獨立 source phase（spec-lock §8.1）+ baseline bump 紀律。

---

## 11. Cross-links

- `docs/20260627-funnel-production-content-input-packet-docs-only-a.md`（input packet；§14 / §15 / §16 / §17）
- `docs/20260626-indexed-entry-page-metadata-content-preflight-a.md`（layer A entry preflight checklist）
- `docs/20260627-gated-download-page-metadata-content-preflight-docs-only-a.md`（layer B gated preflight checklist）
- `docs/20260626-funnel-production-migration-readiness-map-docs-only.md`（readiness map；§4 / §5）
- `docs/20260625-funnel-page-type-metadata-spec-lock-docs-only-a.md`（spec lock；§2 / §3 / §4 / §5 / §6）
- `docs/20260624-gated-download-funnel-spec-lock.md`（funnel spec lock；§3 三層 / §4 page family）
- `content/validation-fixtures/github/posts/_test-download-funnel-valid-entry.md`（group 1 valid entry fixture，本對結構 mirror）
- `content/validation-fixtures/github/posts/_test-download-funnel-valid-gated-page.md`（group 1 valid gated fixture，本對結構 mirror）
- `src/scripts/validate-content.js`（funnel F2/F4/F6/F7 in `validatePageTypeMetadata`；F8 corpus bidirectional pass）
- `src/scripts/check-validation-report.js`（BASELINE `0/134/106` + 27 checks）
- `CLAUDE.md` §3a / §11 / §13 / §14 / §15 / §16 / §17 / §21 / §22 / §23 / §24 / §29

---

`VERDICT: DRAFT PAIR LANDED (BLOGGER-ONLY)`
`SAME-COMMIT PAIR — F8 RECIPROCITY 0 WARNING EXPECTED`
`STATUS DRAFT — NO PRODUCTION TRIGGER`
`NO REAL FORM / DRIVE / SECRET WRITTEN`
`NO SOURCE / SETTINGS / BUILD / DEPLOY / LIVE CHANGE`
`AWAITING POST-VALIDATION FREEZE`

（本文件結束）
