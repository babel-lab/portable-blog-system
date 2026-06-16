# ADMIN — Suggested-Fix Loader Derive Implementation — Human Acceptance

- **Phase**：`20260616-admin-suggested-fix-loader-derive-human-acceptance-a`
- **日期**：2026-06-16（08:14 起；am session）
- **性質**：docs-only human acceptance / read-only review（**不**改 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `CLAUDE.md`；**不** `npm install`；**不** build / deploy / 重貼 Blogger；**不**新增 UI；**不**做新的 implementation；**不**啟用 admin write / Apply / Save / browser write / middleware / CLI fix-cmd；**不**修 frontmatter / tags.json / categories.json / validator / loader / EJS；**不**升 validator warning 為 error；**不**動 build output / Blogger / GA4 / AdSense；**不** amend / rebase / reset / force-push）
- **baseline**：`main` HEAD == origin/main == `f285f09`（`feat(admin): derive governance signal counts`）；working tree clean
- **承接**：
  - `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis.md`（am-2 preanalysis）
  - `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis-human-acceptance.md`（am-3 preanalysis acceptance）
  - `docs/20260616-admin-suggested-fix-readonly-ui-docs-cross-link-human-acceptance.md`（am-4 切片 1 acceptance）
  - `feeb224 feat(admin): link suggested-fix governance docs`（am-4 切片 1 implementation）
  - `f285f09 feat(admin): derive governance signal counts`（am-5 切片 2 implementation；本 acceptance target）

> **本文件性質聲明**：acceptance 判斷 implementation 是否符合 phase 指示之六項面向；不啟動新 implementation；任何後續切片（posts index badge / detail panel section / empty state text）均屬獨立 phase + user explicit approval。

---

## A. Phase name

`20260616-admin-suggested-fix-loader-derive-human-acceptance-a`

---

## B. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main (ahead/behind 0/0)
HEAD           : f285f09 == origin/main
working tree   : clean
last commit    : feat(admin): derive governance signal counts

git log --oneline -5:
  f285f09 feat(admin): derive governance signal counts
  45c948b docs(admin): accept suggested-fix docs cross-link implementation
  feeb224 feat(admin): link suggested-fix governance docs
  bb4cbd7 docs(admin): accept suggested-fix read-only ui preanalysis
  0096dad docs(admin): plan suggested-fix read-only ui
```

→ 完全符合 phase 指示。

---

## C. Files read

| 路徑 | 範圍 | 目的 |
|---|---|---|
| `git show --stat --oneline HEAD` + `git show HEAD -- src/scripts/load-admin-posts.js` | 完整 diff（+88 / -0；1 file changed） | 本 acceptance 之 target commit |
| `src/scripts/load-admin-posts.js` | L889–1032（getSortTime + 兩個新 helper + loadAdminPosts 主流程）| 確認 derive 邏輯、邊界條件、insertion 位置、attach loop |
| `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis.md` | 已於 am-2 phase 完整讀；本 phase 引用 §F.2 derive 欄位建議 + §G.2 紅線 + §H.1 條件 8 | preanalysis 規範對齊 |
| `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis-human-acceptance.md` / `…-docs-cross-link-human-acceptance.md` | 已於 am-3 / am-4 phase 自著；本 phase 引用 acceptance pattern 樣板 + 切片 2 啟動條件 | 既有 acceptance pattern |

→ **未**讀 / **未**修 `content/` / `content/settings/` / `package.json` / `CLAUDE.md` / EJS / 其他 `src/` 檔案。

---

## D. Human acceptance result

### D.1 Phase 指示六項面向逐項判定

#### D.1.1 Scope 是否正確

| 檢查項 | 觀察 | Verdict |
|---|---|---|
| 只改 src/scripts/load-admin-posts.js | `git show --stat HEAD` 顯示 1 file changed；唯一檔案 = `src/scripts/load-admin-posts.js`；88 insertions / 0 deletions | ✅ PASS |
| 沒有改 EJS / Admin UI 顯示 | `git show --stat HEAD \| grep src/views/admin/index.ejs` → **0 命中**；HEAD commit 不含任何 EJS 變更 | ✅ PASS |
| 沒有改 validator / build script / content / settings / package | HEAD commit stat 僅 1 檔案，無其他 path；無 `validate-content.js` / `build-*.js` / `content/` / `content/settings/` / `package.json` / lockfile 變更 | ✅ PASS |

**綜合**：scope 嚴守切片 2 規範；無外溢。✅

#### D.1.2 Derived field contract 是否符合 phase

| 欄位 | phase 規範型別 | implementation 觀察（load-admin-posts.js） | Verdict |
|---|---|---|---|
| `post.governanceSignals.unknownTagCount` | number | L953「`unknownTagCount += 1`」累加；L964 return `unknownTagCount`；初值 0（L945） | ✅ PASS（number） |
| `post.governanceSignals.unknownCategoryFlag` | boolean | L933 初值 `false`；L938 `unknownCategoryFlag = true`；L965 return；only flips when registry miss on non-empty category | ✅ PASS（boolean） |
| `post.governanceSignals.crossSiteMismatchTagCount` | number | L946 初值 0；L955「`crossSiteMismatchTagCount += 1`」；L966 return | ✅ PASS（number） |
| `post.governanceSignals.crossSiteMismatchCategoryFlag` | boolean | L934 初值 `false`；L940 翻轉 true；L967 return | ✅ PASS（boolean） |
| `post.governanceSignals.signalSum` | number | L959–962 `unknownTagCount + (unknownCategoryFlag ? 1 : 0) + crossSiteMismatchTagCount + (crossSiteMismatchCategoryFlag ? 1 : 0)`；L968 return | ✅ PASS（number；4 欄位合計，boolean 算 1） |

**綜合**：5 欄位 contract 完整對應；型別正確（3 number + 2 boolean）；無多餘欄位、無欠缺欄位。✅

#### D.1.3 語意是否安全

| 檢查項 | 觀察 | Verdict |
|---|---|---|
| 只計算 count / boolean flag | derive 函式 L928–971 僅含 number 累加 + boolean 翻轉；return 物件 L964–970 全為 `unknownTagCount` / `unknownCategoryFlag` / `crossSiteMismatchTagCount` / `crossSiteMismatchCategoryFlag` / `signalSum`，無字串 / 無 array | ✅ PASS |
| 不產生 `suggestedFix[]` | grep added lines = 0 | ✅ PASS |
| 不產生 `recommendedTag` | grep added lines = 0 | ✅ PASS |
| 不產生 `recommendedCategory` | grep added lines = 0 | ✅ PASS |
| 不產生 `fixableByAdmin` | grep added lines = 0 | ✅ PASS |
| 不產生 `adminWriteHint` | grep added lines = 0 | ✅ PASS |
| 不產生「應改為 X」/ per-post prescription 字串 | derive 函式回傳純 number / boolean；無 string concat / 無 prescription template；無「應改」/「建議改為」/「請改成」中文字串 | ✅ PASS |
| 不暗示可以 Apply / Save / auto-fix | grep added lines 對 `Apply` / `Save` / `auto-fix` = 0；註釋以「修法建議」/「prescription」/「write hint」中性詞描述紅線 | ✅ PASS |

**綜合**：語意純粹（count + boolean）；無 prescription 暗示；無 write-path 暗示。✅

#### D.1.4 實作是否維持 read-only

| 檢查項 | 觀察 | Verdict |
|---|---|---|
| 不寫檔 | grep `writeFile` / `writeFileSync` / `appendFile` / `appendFileSync` = 0；無 `fs.write*` API 呼叫 | ✅ PASS |
| 不改 frontmatter | derive 函式接收 post 物件、**只讀** `post.sourceSite` / `post.category` / `post.tags`；無 `post.X = ...` 賦值；attach 之 `p.governanceSignals = ...` 為 in-memory 物件 attach（admin loader return 之 view shape；非 frontmatter source）| ✅ PASS |
| 不改 registry / tags.json / categories.json | derive 函式接收 `settings?.categories` / `settings?.tags`、**只讀** 構建 lookup Map；無對 `settings` 物件 mutation；無 `tags.json` / `categories.json` 寫入 | ✅ PASS |
| 不新增 fetch / POST / API | grep `fetch(` = 0；無 `http.request` / `axios` / `node-fetch` / network module import | ✅ PASS |
| 不改 validator error policy | `src/scripts/validate-content.js` 未在 HEAD commit；無 severity / rule 變更 | ✅ PASS |

**綜合**：read-only 嚴守；無 fs write / no fetch / no registry mutation / no validator policy change。✅

#### D.1.5 邊界條件是否合理

| 邊界 | 處理 | Verdict |
|---|---|---|
| 空 tags（`post.tags = []`）| `Array.isArray(post?.tags) ? post.tags : []`（L947）→ 空陣列 → for loop 0 次 → 0 unknownTagCount + 0 mismatch；不計入「untagged」（屬既有 bucket 責任） | ✅ PASS |
| 非 array tags（如 `post.tags = "foo"` 或 undefined）| 同上 — `Array.isArray` guard 直接 fallback 至 `[]` → 不 crash | ✅ PASS |
| 空 category（`post.category = ''`）| L935 `if (rawCat)` guard → 空字串為 falsy → 跳過整個 category 分支；`unknownCategoryFlag = false`（初值）；不誤算 unknown（uncategorized 屬既有 bucket 責任） | ✅ PASS |
| 非 string category（如 `post.category = null` / undefined / number）| L932 `typeof post?.category === 'string' ? post.category.trim() : ''` → 空字串 → 同上 falsy 跳過 | ✅ PASS |
| registry 缺失（`settings = undefined` / `settings = {}` / `settings.categories = null`）| `buildTaxonomyLookup(undefined)` / `(null)` → `if (!Array.isArray(arr)) return map`（L902）→ 空 Map；lookup `get('id:foo')` 回 undefined → `if (!ce)` true → category 算 unknown（合理：registry 不存在則所有 key 皆 unknown）；不 crash | ✅ PASS |
| `settings.categories[i] = null` / 非物件 / 缺 id 缺 slug | `if (!e \|\| typeof e !== 'object') continue` / `if (!id && !slug) continue`（L904 / L908）→ 跳過該 entry；不 crash | ✅ PASS |
| sourceSite 空（`post.sourceSite = ''`）| `sourceSite && ...`（L939 / L954）guard → 空字串 falsy → mismatch 檢查短路；mismatch 計數不誤觸發；mirror buildCategoryUsage L229 / buildTagUsage L362 慣例 | ✅ PASS |
| signalSum 角色 | derive 函式 L959–962 純加法；無 throw / 無 blocker / 無 build gate；註釋 L923 / L1006 明示「用於未來 badge」非 blocker | ✅ PASS |

**綜合**：8 個邊界全部安全；無 crash 路徑；無誤判 unknown / mismatch；signalSum 純展示用途。✅

#### D.1.6 Guard 是否足夠

| Guard | 結果 | 來源 |
|---|---|---|
| `node --check src/scripts/load-admin-posts.js` | ✅ PASS（syntax ok） | 本 phase 重跑 |
| Forbidden-token grep on HEAD added lines | ✅ **PASS: 0 forbidden tokens** | 本 phase 重跑（13 tokens：`suggestedFix\|recommendedTag\|recommendedCategory\|fixableByAdmin\|adminWriteHint\|Apply\|Save\|auto-fix\|fetch\(\|writeFile\|writeFileSync\|appendFile\|appendFileSync`） |
| admin/index.ejs untouched | ✅ PASS（`git show --stat HEAD \| grep src/views/admin/index.ejs` → 0 命中） | 本 phase 重跑 |
| `validate:content` | ✅ PASS `0 error(s) / 94 warning(s) on 84 post(s)` | am-5 phase 已跑；本 acceptance carry forward |

**綜合**：4 個 guard 齊備；本 acceptance 在 HEAD 之 commit base 上重跑前 3 個 guard 確認結果穩定。✅

### D.2 Overall verdict

**✅ ACCEPTED**

逐項判定：

- ✅ Scope：scope 嚴守切片 2 規範（單檔 +88 行 loader-only；無外溢至 EJS / validator / content / settings / package）
- ✅ Derived field contract：5 欄位齊備（3 number + 2 boolean）；型別正確；signalSum = 4 欄位合計（boolean 算 1）
- ✅ 語意：純 count + boolean；無 prescription；無「應改為 X」字串；無 Apply / Save / auto-fix 暗示
- ✅ Read-only：無 fs write / no fetch / no registry mutation / no validator policy change
- ✅ 邊界條件：8 個邊界全部安全；無 crash 路徑；無誤判
- ✅ Guard：node --check / forbidden-token grep / EJS untouched / validate:content 四項齊備

### D.3 No-go / 須修正項目

無。

### D.4 觀察建議（非阻斷；不在本 phase 處理）

- 觀察 1：`derivePostGovernanceSignals` 使用 admin loader 慣例之 `sourceSite`-based mismatch（mirror `buildCategoryUsage` / `buildTagUsage`），與 validator 之 `post.site`-based mismatch（per night-9 §G.1）存在**設計上的不對齊**。此差異**不是 bug**（admin 與 validator 為兩 surface；night-9 §G.2 已記錄並 accept）；但未來切片 3（badge）/ 切片 4（detail panel section）若要顯示「對應 validator 之 N 個 warning」，須**明示這兩個數字可能不同**之文字說明，避免使用者混淆。
- 觀察 2：`buildTaxonomyLookup` 與既有 `buildCategoryUsage` / `buildTagUsage` 內部 `keyToEntry` Map 為**重複構建**（兩處 Map 各自獨立；無共享 reference）。本切片**故意不重構**以降低變更面 / backout cost；未來若 admin loader 整體性能成為痛點，可考慮抽出 shared lookup（屬獨立 refactor phase；本 acceptance 不背書）。
- 觀察 3：`post.governanceSignals.signalSum` 為**單純展示用 number**（未來 badge 計數）。切片 3（badge）若使用此欄位作 warn pill 文字，建議**不**進一步派生 severity 級別（per preanalysis §E.3「Severity：只用 `warn` 一級 class」/ §G.2 第 13 條）；signalSum > 0 即 warn pill，無 `signalSum >= N → error / blocker` 之分層。
- 觀察 4：本 phase **未** export `buildTaxonomyLookup` / `derivePostGovernanceSignals` 為 module-level export；兩 helper 為 module-internal。未來若有單元測試需求，須獨立 phase 增加 export（屬 testability refactor；本 acceptance 不背書）。

→ 四項觀察皆**不**在本 phase 處理；列此處作為未來切片設計參考。

---

## E. Scope / diff acceptance

### E.1 Diff 統計

```
src/scripts/load-admin-posts.js | 88 +++++++++++++++++++++++++++++++++++++++++
1 file changed, 88 insertions(+), 0 deletions(-)
```

- 唯一檔案：`src/scripts/load-admin-posts.js`
- 唯一變更類型：insertions（無 deletions / 無 modifications）
- 插入位置 1：L896–971（兩個 helper 函式之間 `getSortTime` 與 `loadAdminPosts` 之間）
- 插入位置 2：L1002–1012（`posts.sort(...)` 後、既有 `// Phase 20260608 commerce-admin-selector-...` 之前；attach loop）
- 結構：6 行 EJS-style 註釋 + `buildTaxonomyLookup`（15 行）+ 12 行 EJS-style 註釋 + `derivePostGovernanceSignals`（43 行）+ 6 行 EJS-style 註釋 + attach loop（5 行）

### E.2 Scope 紅線對照

| 紅線 | 是否違反 |
|---|---|
| 不改 src/views/admin/index.ejs | ✅ 未違反（HEAD commit 不含此檔案）|
| 不改任何 EJS | ✅ 未違反 |
| 不改 content/ | ✅ 未違反 |
| 不改 content/settings/ | ✅ 未違反 |
| 不改 package.json / package-lock.json | ✅ 未違反 |
| 不改 validator | ✅ 未違反 |
| 不改 build script | ✅ 未違反 |
| 不改 taxonomy registry / tags.json / categories.json | ✅ 未違反 |
| 不改文章 frontmatter | ✅ 未違反 |
| 不新增 form / button / input / select / textarea | ✅ 未違反（loader 為 .js；無 HTML markup）|
| 不新增 fetch / POST / write API | ✅ 未違反（grep 0 命中）|
| 不新增 Apply / Save / auto-fix 字樣或功能 | ✅ 未違反（grep 0 命中）|
| 不新增 per-post badge | ✅ 未違反（badge 屬 EJS view layer；本切片不動 EJS）|
| 不新增 detail panel | ✅ 未違反（同上）|
| 不跑 npm install | ✅ 未違反（am-5 phase 未跑）|
| 不跑 build / deploy | ✅ 未違反 |
| 不做 Blogger repost | ✅ 未違反 |
| 不做 GA4 / AdSense 驗證 | ✅ 未違反 |
| 不 amend / rebase / reset / force-push | ✅ 未違反（f285f09 為新 commit；fast-forward push）|

**結論**：scope 全部紅線維持。✅

---

## F. Derived field contract acceptance

### F.1 Contract 完整性

| Phase 規範欄位 | 型別 | implementation L# | 初值 | 變更條件 | 最終 return |
|---|---|---|---|---|---|
| `unknownTagCount` | number | L945 | 0 | L953 `+= 1` when tag in `post.tags` not in registry | L965 |
| `unknownCategoryFlag` | boolean | L933 | false | L938 `= true` when `post.category` non-empty & not in registry | L966 |
| `crossSiteMismatchTagCount` | number | L946 | 0 | L955 `+= 1` when tag in registry & `tag.site` non-empty & `sourceSite` non-empty & `sourceSite` not in `tag.site` | L967 |
| `crossSiteMismatchCategoryFlag` | boolean | L934 | false | L940 `= true` when category in registry & `category.site` non-empty & `sourceSite` non-empty & `sourceSite` not in `category.site` | L968 |
| `signalSum` | number | L959 | derived | `unknownTagCount + (unknownCategoryFlag ? 1 : 0) + crossSiteMismatchTagCount + (crossSiteMismatchCategoryFlag ? 1 : 0)` | L969 |

→ 5 欄位齊備；型別正確；變更條件嚴格對齊 preanalysis §F.2 + phase 指示語意。✅

### F.2 Contract 紅線

| 紅線欄位 | 是否新增 |
|---|---|
| `suggestedFix[]` | ❌ 無 |
| `recommendedTag` | ❌ 無 |
| `recommendedCategory` | ❌ 無 |
| `fixableByAdmin` | ❌ 無 |
| `adminWriteHint` | ❌ 無 |
| 任何 per-post prescription string field | ❌ 無 |

→ 紅線欄位 0 新增；contract 純粹（count + boolean only）。✅

### F.3 Attach 機制

- L1010–1012 attach loop：`for (const p of posts) { p.governanceSignals = derivePostGovernanceSignals(p, catGovernanceLookup, tagGovernanceLookup); }`
- attach 位置：在 `posts.sort(...)` 之後、`systemSummary` 之前
- attach 對象：admin loader return shape 之 in-memory 物件（非 frontmatter source）
- attach 行為：additive（不覆蓋既有欄位；既有 view 忽略本欄位 → backout cost = 0）

→ Attach 機制 additive；無破壞性；既有 consumer 不受影響。✅

---

## G. Read-only / no-prescription acceptance

### G.1 Read-only 三層鎖

| 層 | 觀察 | Verdict |
|---|---|---|
| 1. 不寫檔 | grep `writeFile` / `writeFileSync` / `appendFile` / `appendFileSync` = 0；無 `fs.write*` API；無 `child_process` / IO 副作用 | ✅ PASS |
| 2. 不打 API | grep `fetch(` = 0；無 `http.request` / `axios` / `node-fetch` / network module import | ✅ PASS |
| 3. 不改 frontmatter / registry / settings | derive 函式對 `post` / `settings` 物件**只讀**；`buildTaxonomyLookup` 從 array 建構新 Map（不 mutate input array）；`derivePostGovernanceSignals` 從 `post.sourceSite` / `post.category` / `post.tags` **讀取**並回傳新物件（不 mutate input post）；attach loop 對 `p.governanceSignals = ...` 為 in-memory view shape attach（非 frontmatter source write） | ✅ PASS |

→ Read-only 三層鎖齊備。✅

### G.2 No-prescription 三層鎖

| 層 | 觀察 | Verdict |
|---|---|---|
| 1. 無紅線欄位 | `suggestedFix[]` / `recommendedTag` / `recommendedCategory` / `fixableByAdmin` / `adminWriteHint` 全 0 命中 | ✅ PASS |
| 2. 無 prescription 字串 | derive 函式回傳純 number / boolean；無 string concat / 無 prescription template；無「應改」/「建議改為」/「請改成」中文字串 | ✅ PASS |
| 3. 無 Apply / Save / auto-fix 暗示 | grep `Apply` / `Save` / `auto-fix` added lines = 0；註釋以「修法建議」/「prescription」/「write hint」中性詞描述紅線；無 button / form / fetch 暗示 | ✅ PASS |

→ No-prescription 三層鎖齊備。✅

### G.3 Validator policy 維持

- HEAD commit 不含 `src/scripts/validate-content.js`：validator 規則未動
- preanalysis §G.1 / §G.2 第 5 條紅線「不升 validator warning 為 error」維持
- `unknownTagCount`/`crossSiteMismatchTagCount` 等 derive 欄位**獨立於** validator severity；validator 仍 ground truth；admin 僅展示治理訊號（per night-9 §G.2 + am-3 §D.1.4）

→ Validator policy 維持；無紅線違反。✅

---

## H. Guard / validation acceptance

### H.1 本 acceptance 重跑之 guard

| Guard | 指令 | 結果 |
|---|---|---|
| Syntax check | `node --check src/scripts/load-admin-posts.js` | ✅ PASS（syntax ok） |
| Forbidden-token grep on HEAD added lines | `git show HEAD -- src/scripts/load-admin-posts.js \| awk '/^\+[^+]/' \| grep -E "suggestedFix\|recommendedTag\|recommendedCategory\|fixableByAdmin\|adminWriteHint\|Apply\|Save\|auto-fix\|fetch\(\|writeFile\|writeFileSync\|appendFile\|appendFileSync"` | ✅ **PASS: 0 forbidden tokens** |
| admin/index.ejs untouched | `git show --stat HEAD \| grep src/views/admin/index.ejs` | ✅ PASS（0 命中；HEAD commit 不含此檔案） |

### H.2 既有 guard carry-forward

| Guard | 結果 | 來源 |
|---|---|---|
| `validate:content` | `0 error(s) / 94 warning(s) on 84 post(s)` ✅ | am-5 phase 已跑；本 acceptance 為 docs-only review，未重跑（baseline carry forward；admin loader 變更不影響 validator） |
| `check:adsense-resolver` | 34/0 carry forward | 本切片不涉 adsense / EJS / dist；by construction carry forward |
| `check:adsense-article-block` | 13/0 carry forward | 同上 |
| `check:adsense-anchor-wiring` | 14/0 carry forward | 同上 |
| `check:blogger-adsense-output` | 71/0 carry forward | 同上 |

### H.3 本 acceptance 未跑之 guard 與理由

| Guard | 是否跑 | 理由 |
|---|---|---|
| `npm install` | ❌ 未跑 | phase 紅線；無依賴變動 |
| `build:*` | ❌ 未跑 | phase 紅線；無 dist 產物需求 |
| `deploy` / `push gh-pages` | ❌ 未跑 | phase 紅線；無 deploy 需求 |
| Blogger repost | ❌ 未跑 | phase 紅線；本切片不涉 Blogger |
| GA4 / AdSense 驗證 | ❌ 未跑 | phase 紅線；本切片不涉 GA4 / AdSense |

→ Guard 集合充足；read-only acceptance 充分。✅

---

## I. Whether next posts index badge phase is allowed

### I.1 切片 3 啟動條件

| 條件 | 是否滿足 |
|---|---|
| 切片 2 acceptance PASS | ✅（本文件 §D.2） |
| 切片 2 已 ship 至 origin/main | ✅（f285f09） |
| 切片 3 為獨立 phase（不混做切片 4 detail panel / 切片 5 empty state） | ⚠️ 須切片 3 phase 自己守 preanalysis §L.5 第 4 條 |
| 切片 3 資料來源 = 切片 2 derive 欄位 | ✅（`post.governanceSignals.signalSum` 可作 badge 計數；`unknownTagCount` / `unknownCategoryFlag` / `crossSiteMismatchTagCount` / `crossSiteMismatchCategoryFlag` 可作 filter chip 判斷） |
| 切片 3 不引入 write path | ⚠️ 須切片 3 phase 自己守 preanalysis §G.2 第 1–4 條 + §H.1 條件 1 EJS 元素白名單 |
| 切片 3 不引入 severity 級別（除 warn 外） | ⚠️ 須切片 3 phase 自己守 preanalysis §E.3 + §G.2 第 13 條（signalSum > 0 即 warn pill；不分層） |
| 切片 3 不引入 per-post prescription 字串 | ⚠️ 須切片 3 phase 自己守 preanalysis §D.5 + §G.2 第 11 條（badge 只顯示計數，不顯示「應改為 X」） |
| user explicit approval | ⏸ 待 user 啟動切片 3 phase 時提供 |

### I.2 直接允許 / 待 approval / 不允許 三類

| 類型 | 範圍 |
|---|---|
| ✅ 直接允許（本 acceptance 範圍） | 收尾本 phase；commit + push acceptance doc |
| ⚠️ 條件式允許（須 user explicit approval） | 切片 3 `20260616-admin-suggested-fix-posts-index-badge-implementation-a`；切片 4 `20260616-admin-suggested-fix-detail-panel-section-implementation-a`（不混做）；切片 5 `20260616-admin-suggested-fix-empty-state-text-refinement-a`（可獨立）；docs-only `20260616-admin-validation-per-post-aggregation-preanalysis-docs-only-a`（並行不衝突） |
| ❌ 不允許啟動（紅線維持） | write path（middleware / CLI fix-cmd / browser write / Apply / Save）；L3 per-post prescription；L4 UI（auto-fix / form / button / fetch）；新 severity 級別（error / blocker）；validator warning 升 error；同 phase 混做多切片；偷渡「應改為 X」字串；偷渡 `suggestedFix[]` / `adminWriteHint.*` / `recommendedTag` / `fixableByAdmin` 欄位 |

---

## J. Files changed

- `docs/20260616-admin-suggested-fix-loader-derive-human-acceptance.md`（new；docs-only acceptance）
- **未**改 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `CLAUDE.md` / 任何 `.md` frontmatter / EJS / loader / validator / Admin UI / dist / gh-pages / `.cache`

→ 唯一 mutation = 本 acceptance doc 自身。

---

## K. Commit hash / push result

（待本 doc commit 後填入；由 closeout 步驟產出）

---

## L. Final repo state

```
branch         : main
HEAD           : （待 commit + push 後確認）== origin/main
working tree   : clean（commit + push 後）
mutations      : 唯一 mutation = 本 acceptance doc
not changed    : src/ / content/ / content/settings/ / src/views/ / package.json / lockfile / CLAUDE.md / 任何 .md frontmatter / EJS / loader / validator / admin UI / build artifacts / dist / gh-pages
guard runs     : node --check PASS / forbidden-token grep PASS（0 matches on HEAD added lines）/ admin/index.ejs untouched PASS / validate:content carry forward 0/94/84
acceptance     : ✅ PASS（scope / contract / 語意 / read-only / 邊界條件 / guard 六面向皆 PASS）
```

---

## M. Recommended next phase

### M.1 保守預設（推薦）

**`20260616-idle-freeze-after-admin-suggested-fix-loader-derive-acceptance-no-op-a`** — 收工 idle freeze；等 user 決定下一步。

### M.2 下一切片（須 user explicit approval；不混做）

**`20260616-admin-suggested-fix-posts-index-badge-implementation-a`**（切片 3，preanalysis §L.3.3） — Posts index 表格新增 governance signal badge column + filter chip；資料來源 = 本 phase 之 `post.governanceSignals.signalSum`（badge 計數）/ `unknownTagCount` / `unknownCategoryFlag` / `crossSiteMismatchTagCount` / `crossSiteMismatchCategoryFlag`（filter chip 判斷）；只用 warn 一級 class；不引入 prescription / 「應改為 X」字串。

### M.3 可獨立切片（須 user explicit approval）

**`20260616-admin-suggested-fix-empty-state-text-refinement-a`**（切片 5，preanalysis §L.3.5） — empty state 文字審稿；改既有 6 個 bucket-note 之 empty 文字為正向確認；不動 sample posts / table / detail panel。

### M.4 並行不衝突（docs-only）

**`20260616-admin-validation-per-post-aggregation-preanalysis-docs-only-a`**（night-9 §I.4.8） — validator per-post API 設計；docs-only；與本 UI 切片並行不衝突。

### M.5 仍須切片 3 先 ship 之 phase

- 切片 4：`20260616-admin-suggested-fix-detail-panel-section-implementation-a`（Post detail panel 新增 Governance signals section；建議在切片 3 之 badge 啟用後再行）

### M.6 紅線提醒

- ❌ 不可跳階至 write path / middleware / CLI fix-cmd / browser write
- ❌ 不可掛 L3 per-post prescription（`recommendedTag` / `suggestedFix[]` 等欄位禁止）
- ❌ 不可掛 L4 UI（auto-fix / form / button / fetch）
- ❌ 不可同 phase 混做多切片
- ❌ 不可升 validator warning 為 error
- ❌ 不可在切片 3 偷渡「應改為 X」字串
- ❌ 不可在切片 3 新增 `<form>` / `<button>` / `<input>` / `<select>` / `<textarea>` / `fetch(` 之 mutation 元素
- ❌ 不可在切片 3 引入新 severity 級別（除 warn 外；無 error / blocker）

---

（本紀錄結束）
