# Phase 8-h-c-pre: Legacy Fallback Removal Fixture / Split Plan Analysis

本文件封存 **Phase 8-h-c-pre（純讀取分析批）** 之分析結果：驗證 `docs/phase-8h-pre-analysis.md` §3 列出之 17 個 legacy fallback 位置、風險分級、fixture 保護缺口、12-commit 拆批精修計畫，並推薦下一個最小安全批次為 **Phase 8-h-c-pre-1（fixture 補強）**。

對應之上層文件：
- `docs/phase-8h-pre-analysis.md`（Phase 8-h-a-doc 退場前盤點分析；commit `a538564`）—— 列出 17 個位置與 §5 拆批規劃
- `docs/phase-8h-baseline-snapshot.md`（Phase 8-h-b 退場前 baseline run；commit `c9ce52c`）—— 提供退場批之 regression 對照基準
- `docs/phase-1-completion-report.md`（Phase 1 final completion report；commit `7f4958c`）—— §8.3 Phase 8-h pending；§11 順序 3 退場批啟動 trigger condition
- `docs/phase-8h-completion-report.md`（**Phase 8-h 系列收尾報告；本拆批 plan 中 12-commit roadmap 之實際落地結果**；含 8-h-e-2-b skipped / permanent deferred + 8-h-f-content-migration-a regression handling）

---

## §1 文件目的

### 1.1 本文件是什麼

- BLOG 系統 **Phase 8-h-c-pre（fixture / split plan analysis）** 之純讀取分析封存
- 對照既有 6 個 source files 與 `docs/phase-8h-pre-analysis.md` §3，重新驗證 17 個 legacy fallback 位置之**現況準確性**
- 分析 fixture 保護缺口（0/16 covered）並提出最小 fixture 設計建議
- 提供 Phase 8-h-c-pre-1 至 Phase 8-h-z 共 12 commits 之拆批精修表
- 推薦下一個最小安全批次

### 1.2 本文件不是什麼

- ❌ **不是** Phase 8-h-c-pre-1（fixture 落地批；本批不實作 fixture）
- ❌ **不是** Phase 8-h-c 至 Phase 8-h-z（退場實作批；全未啟動）
- ❌ **不是**任何 source code 變動（17 個位置完整保留）
- ❌ **不是**任何 fixture 新增（純分析；本批不動 `content/validation-fixtures/`）
- ❌ **不是**任何 dist / build / validate 重新執行

### 1.3 Phase 8-h-c-pre 當前狀態

```
Phase 8-h-c-pre fixture / split plan analysis          ✅ completed（本批；docs-only）
├── 17 位置驗證                                         ✅ 全數驗證；16 in-scope + 1 out-of-scope
├── 風險分級                                            ✅ 完成（🔴 高 2 / 🟠 中 4 / 🟡 低-中 5 / 🟡 不在範圍 1）
├── Fixture 缺口分析                                    ✅ 完成（0/16 covered；建議 6 個最小 fixtures）
├── 12-commit 拆批精修表                                ✅ 完成（8-h-c-pre-1 → 8-h-z）
└── 推薦下一批：Phase 8-h-c-pre-1 fixture 補強           ✅ 未啟動（待批准）
```

---

## §2 啟動前 snapshot

### 2.1 Git 狀態

| 項目 | 值 |
|---|---|
| **HEAD** | `c9ce52cc5455bc617673e7d1d2419520ae724418`（短：`c9ce52c`） |
| **working tree** | clean |
| **本批名稱** | Phase 8-h-c-pre（fixture / split plan analysis） |
| **前一 HEAD** | `7758ce2 docs(phase-10ab): add sitemap/robots dist baseline snapshot` |

### 2.2 與 Phase 8-h-a-doc / 8-h-b 之關係

| 上游里程碑 | 狀態 | commit | 本批之關係 |
|---|---|---|---|
| Phase 8-h-a-doc（退場前盤點分析）| ✅ landed | `a538564` | 本批繼承其 §3 之 17 位置列表，重新對照 source code |
| Phase 8-h-b（退場前 baseline run + snapshot）| ✅ landed（本批 HEAD）| `c9ce52c` | 本批之 git status / dist regression baseline 直接由 8-h-b 提供 |
| **Phase 8-h-c-pre（本批）** | ✅ landed（本批）| 見本批 git log | 補強 fixture 設計建議 + 12-commit 拆批精修表 |
| Phase 8-h-c-pre-1（fixture 落地）| ⏸ 未啟動 | — | 本批之**推薦下一批**（per §7）|
| Phase 8-h-c 至 Phase 8-h-z（退場實作系列）| ⏸ 全未啟動 | — | 等 Phase 8-h-c-pre-1 完成後再啟動 |

### 2.3 Baseline 起點指標（per Phase 8-h-b）

| 指標 | 數值 | 來源 |
|---|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)` | `docs/phase-8h-baseline-snapshot.md` §4.1 |
| Ready GitHub posts | 2 篇 | 同上 §2.3 |
| Ready Blogger posts | 1 篇（we-media-myself2）| 同上 |
| Validation fixtures | 15 個 | 同上 §3.8 |
| dist 全域檔案數 | 72 個（dist 34 + dist-blogger 17 + dist-promotion 5 + dist-reports 17） | 同上 §7.5 |
| Phase 1 final | ✅ 已封存 | commit `7f4958c` |

---

## §3 17 個 legacy fallback 位置驗證

### 3.1 驗證結論

✅ **17 個位置全數驗證；line range 與 `docs/phase-8h-pre-analysis.md` §3 一致**（±1-3 行微移；屬 Phase 9-h-i / 9-j 後續 commit 之周邊代碼調整，**不**影響 fallback 邏輯）。

⚠️ **附帶觀察**：`docs/phase-8h-pre-analysis.md` §3.7 合計表寫「17 個 Phase 8-h 範圍位置 + 1 個明確排除 = 18 個位置」，但實際 in-scope 為 **16 個**（+ #10 parse-markdown 排除 = 17 個 total 命名位置）。**屬 pre-analysis 文件之合計 typo；不影響任何實作判斷**。本文件以實際表內容為準：

- **16 個 in-scope**（編號 #1, #2-#9, #11-#17）
- **1 個 out-of-scope**（編號 #10：parse-markdown.js H1→H2 自動降級；屬永久 SEO 防呆）
- 合計 **17 個命名位置**

### 3.2 16 個 in-scope 位置驗證表

| # | 檔案 | 行號（驗證後）| 函式 / 區塊 | legacy 欄位 | normalized 欄位 | active caller 風險 | fixture 保護 | 建議批次 |
|---|---|---|---|---|---|---|---|---|
| 1 | `src/scripts/validate-content.js` | 326-333 | 主迴圈 `frontmatter-uses-deprecated-type` warning | `post.type === post.contentKind` 同值偵測 | —（validate rule；非 fallback）| 🟢 **0 active**（content/ 全 0 命中 `^type:`）| ❌ 無 fixture | **8-h-c** |
| 2 | `src/scripts/normalize-post-output.js` | 179-198 | `identity.contentKind` resolution | `p.type` fallback + `deprecated-legacy-type-fallback` warning | `normalized.identity.contentKind` | 🟢 **0 active**（同上）| ❌ 無 fixture | **8-h-d-1** |
| 3 | `src/scripts/normalize-post-output.js` | 715-738 | `promotion.facebook.enabled` | `legacyFb.enabled` boolean | `normalized.promotion.facebook.enabled` | 🟢 **0 active**（content/ 全 0 命中 `.md` 內 `promotion.facebook.*`）| ❌ 無 fixture | **8-h-d-2** |
| 4 | `src/scripts/normalize-post-output.js` | 741-757 | `promotion.facebook.target` | `legacyFb.target` string | `normalized.promotion.facebook.target` | 🟢 0 active | ❌ 無 fixture | **8-h-d-2** |
| 5 | `src/scripts/normalize-post-output.js` | 759-769 | `promotion.facebook.message` | `legacyFb.message`（**legacy-only**；無 sidecar 對應）| `normalized.promotion.facebook.message` | 🟢 0 active | ❌ 無 fixture | **8-h-d-2** |
| 6 | `src/scripts/normalize-post-output.js` | 771-789 | `promotion.facebook.body` | `fb.md.body` 優先 + `promotion.facebook.message` legacy fallback | `normalized.promotion.facebook.body` | 🟢 0 active | ❌ 無 fixture | **8-h-d-2** |
| 7 | `src/scripts/normalize-post-output.js` | 791-815 | `promotion.facebook.hashtags` | `legacyFb.hashtags` array | `normalized.promotion.facebook.hashtags` | 🟢 0 active；既有 step 3-4 fallback chain 已覆蓋 | ❌ 無 fixture | **8-h-d-2** |
| 8 | `src/scripts/normalize-post-output.js` | 817-844 | `promotion.facebook.finalUrl` | `legacyFb.finalUrl` | `normalized.promotion.facebook.finalUrl` | 🟢 0 active；步驟 3-5 fallback 已覆蓋 | ❌ 無 fixture | **8-h-d-2** |
| 9 | `src/scripts/normalize-post-output.js` | 674-688 | `seo.canonicalUrl` | `frontmatter.canonical` URL string（非 `'auto'`）| `normalized.seo.canonicalUrl` | 🟢 0 active（所有 ready posts canonical='auto'）| ❌ 無 fixture | **8-h-d-3** |
| 11 | `src/scripts/build-blogger.js` | 251-257 | `buildMeta()` bloggerTags | `post.tags` array | `normalized.publish.blogger.tags` | 🟡 **dormant 但仍可被觸發**（normalized tags 為空 + post.tags 非空時 fallback 生效）| ❌ 無 fixture | **8-h-e-1** |
| 12 | `src/scripts/build-blogger.js` | 264 | `buildMeta()` meta.json `type` field | `post.type ?? null` → `meta.json.type` | —（兩個獨立來源；不是 fallback）| 🟠 **schema-observable**（所有 meta.json 含 `"type": null`）| ❌ 無 fixture | **8-h-e-2**（拆 2 子批）|
| 13 | `src/scripts/build-promotion.js` | 145 + 170-220 | `classifyFacebook()` + `buildManifestEntry()` 4 欄位 normalized 優先 | `fb.{title,message,target,hashtags}`（4 欄）| `normalized.promotion.facebook.{title,message,target,hashtags}` | 🟢 0 active（同 #3-#8 之 0 caller）| ❌ 無 fixture | **8-h-f** |
| 14 | `src/scripts/resolve-placeholders.js` | 91-94 | `getBloggerPublishedUrl()` step 3 | `post.publishedUrl`（top-level frontmatter）| `post.publish.blogger.publishedUrl` | 🟢 0 active（content/ 全 0 命中 top-level `publishedUrl`）| ❌ 無 fixture | **8-h-d-4** |
| 15 | `src/scripts/resolve-placeholders.js` | 112-115 | `getGithubPublishedUrl()` step 3 | `post.github.publishedUrl`（nested frontmatter）| `post.publish.github.publishedUrl` | 🟢 0 active | ❌ 無 fixture | **8-h-d-4** |
| 16 | `src/scripts/resolve-placeholders.js` | 116-119 | `getGithubPublishedUrl()` step 4 | `post.githubUrl`（top-level alias）| 同上 | 🟢 0 active | ❌ 無 fixture | **8-h-d-4** |
| 17 | `src/scripts/resolve-placeholders.js` | 137-140 | `getCanonicalUrl()` step 3 | `post.canonicalUrl`（top-level）| `post.publish.canonical.url` | 🟢 0 active | ❌ 無 fixture | **8-h-d-4** |

### 3.3 1 個 out-of-scope 位置

| # | 檔案 | 行號 | 描述 | Phase 8-h 範圍 |
|---|---|---|---|---|
| 10 | `src/scripts/parse-markdown.js` | 10-49 | H1 → H2 自動降級 renderer 覆寫 | ❌ **不在範圍**（per `docs/phase-8h-pre-analysis.md` §3.3；屬 Phase 7-fix-1 (B) 永久 SEO 防呆設計；與 schema migration legacy 屬不同範疇）|

### 3.4 active caller 狀態彙整

| active caller 數 | 位置數 | 位置編號 |
|---|---|---|
| 🟢 **0 active**（dormant；可安全移除）| 15 | #1, #2, #3, #4, #5, #6, #7, #8, #9, #12, #13, #14, #15, #16, #17 |
| 🟡 **dormant 但仍可被觸發** | 1 | **#11**（build-blogger bloggerTags fallback：normalized tags 為空 + post.tags 非空時觸發）|
| 🔴 active caller 存在 | 0 | — |
| ⚠️ out-of-scope（不在 Phase 8-h 範圍）| 1 | #10（parse-markdown H1→H2）|

**意涵**：
- 15 個位置之移除技術上不會改變既有 ready posts 之 dist 輸出（byte-identical）
- 1 個位置（#11）之移除需確認 normalize 邏輯之邊界條件
- dormant **不等於零風險**：fallback 移除後若**作者**未來誤填 legacy schema 即會 silent broken

---

## §4 風險分級

### 4.1 🔴 高風險（強烈建議移除前必須補 fixture；移除後易 silent broken）

| 位置 | 風險點 |
|---|---|
| **#12** `build-blogger.js` `meta.json.type` | meta.json schema 變動；若有外部消費者讀 `type` 欄位會破壞；屬可觀察 schema 變動 |
| **#3-#8** normalize FB sidecar legacy fallback × 6 | 若作者誤填 `promotion.facebook.*` 於 `.md`，移除後 FB promotion 將 silent broken（dist-promotion txt 缺漏；validate 雖有 warning 但作者可能略過）|

### 4.2 🟠 中風險（建議移除前補 fixture；含 normalize 內部一致性風險）

| 位置 | 風險點 |
|---|---|
| **#2** normalize `contentKind ?? type` fallback | contentKind 為文章核心 metadata；缺值會影響 article block conditional render |
| **#11** `build-blogger.js` `bloggerTags` fallback | Blogger labels 為 SEO 核心；normalize bug 時無 fallback 會 silent 空 tags |
| **#13** `build-promotion.js` 4 欄位 fallback | 與 #3-#8 連動；normalize 缺值時 silent broken |

### 4.3 🟡 低-中風險（可考慮移除前不補 fixture；靠既有 warning 規則保護）

| 位置 | 風險點 |
|---|---|
| **#1** `validate-content.js` `frontmatter-uses-deprecated-type` warning rule | warning-only；無 dist 影響；移除即 warning 規則消失 |
| **#9** normalize canonical legacy fallback | 既有 sidecar canonical.url + computed 兩層已足；legacy 屬第三層 |
| **#14-#17** `resolve-placeholders.js` 4 處 URL fallback | 屬 resolver 之最末層 fallback；URL chain 結構性強 |

### 4.4 ⚠️ 不在範圍

| 位置 | 性質 |
|---|---|
| **#10** `parse-markdown.js` H1 → H2 自動降級 | Phase 7-fix-1 (B) 永久 SEO 防呆；與 schema migration legacy 不同範疇；若未來退場需另開獨立批 |

### 4.5 dormant 狀態彙整

**16 個 in-scope 位置之 dormant 狀態**：

- 🟢 **15 個位置 = 完全 dormant**（0 active caller；移除技術上不會改變既有 ready posts 之 dist 輸出）
- 🟡 **1 個位置（#11）= dormant 但可被觸發**（normalized empty + post.tags non-empty 時 fallback 才生效；當前所有 ready posts 走 normalized 路徑）

**意涵**：dormant 狀態為移除批之**有利條件**；但 fallback 之防禦性價值（作者誤填 legacy schema 時之 graceful fallback）需透過 fixture / warning 保留。

---

## §5 Fixture / sample 保護缺口分析

### 5.1 當前 fixture 保護覆蓋率：**0/16 covered**

| Phase 8-h 路徑類別 | 既有 fixture 數 | 覆蓋率 |
|---|---|---|
| 16 個 in-scope legacy fallback | **0 個 fixture** 直接觸發 | **0%** |
| `frontmatter-uses-deprecated-type` warning rule | 0 | 0% |
| `deprecated-legacy-type-fallback` normalize warning | 0 | 0% |
| legacy `promotion.facebook.*` 於 `.md` frontmatter | 0 | 0% |
| top-level `publishedUrl` / `githubUrl` / `canonicalUrl` | 0 | 0% |
| `frontmatter.canonical` URL string（非 `'auto'`）| 0 | 0% |

**現況**：15 個 fixtures（series 5 + book 7 + related-links 4 + fb-titleEn 1，部分共用）**全數不觸發** Phase 8-h legacy 路徑。

### 5.2 建議補強之 6 個最小 fixtures（本批不實作）

若採「fixture-first」路線（per §7 推薦），建議於 Phase 8-h-c-pre-1 落地以下 **6 個最小 fixtures**：

| # | Fixture 名稱 | 觸發位置 | frontmatter 重點欄位 | 預期 warnings |
|---|---|---|---|---|
| 1 | `_test-deprecated-type-only.md` | #2 normalize + `deprecated-legacy-type-fallback` warning | `type: "tech-note"`（無 contentKind） | 1（normalize warning；#1 validate 不觸發因 contentKind undefined）|
| 2 | `_test-deprecated-type-same.md` | #1 validate `frontmatter-uses-deprecated-type` | `type: "tech-note"` + `contentKind: "tech-note"`（同值） | 1 |
| 3 | `_test-legacy-fb-in-md.md` | #3-#8 normalize legacyFb chain | `.md` 內 `promotion.facebook.{enabled,target,message,hashtags,finalUrl}` | 0（normalize 不發 warning；屬 dormant fallback exercise）|
| 4 | `_test-legacy-published-url.md` | #14 + #16 resolve-placeholders | top-level `publishedUrl` + `githubUrl` | 0 |
| 5 | `_test-legacy-canonical-url.md` | #17 + #9 | top-level `canonicalUrl` + `canonical: "https://..."` | 0 |
| 6 | `_test-empty-normalized-tags.md` | #11 build-blogger tags fallback | 觸發 normalized.publish.blogger.tags 為空 + post.tags 非空之邊界條件（可能需特殊欄位組合或 mock）| 0 |

**注**：fixtures 屬 `ready` 狀態會進入 validate；若預期 warnings 數變動，validate baseline 將 `0/22/17` → 約 `0/22-24/17-19`（依實際 fixture 觸發；屬預期 fixture 落地變動，**非 regression**）。

**注**：fixtures 落地後，後續退場批之 sanity check 可透過比對 fixture-driven dist 輸出對照「fallback 路徑是否仍生效」與「移除後是否如預期失效」。

### 5.3 Fixture 落地後之 validate baseline 預期演進

| 階段 | validate baseline | 說明 |
|---|---|---|
| 當前（Phase 8-h-b 後）| `0/22/17` | 既有 15 fixtures 之 22 warnings |
| Phase 8-h-c-pre-1（6 fixtures 落地後）| 預期 `0/24/19` 左右 | +2 warnings（#1 + #2 fixture）；+2 posts（如 fixtures 觸發 warning）|
| Phase 8-h-c（#1 warning rule 退場後）| 預期 `0/23/18` 左右 | -1 warning（移除 `frontmatter-uses-deprecated-type`）|
| Phase 8-h-d-1（#2 normalize 退場後）| 預期 `0/22/17` 左右 | -1 warning（移除 `deprecated-legacy-type-fallback`）|
| Phase 8-h-z（全退場完成後）| 依各批變動累積 | 最終 baseline 將於 8-h-z 之 completion report 確認 |

**注**：上述預期僅為粗估；實際 baseline 變動須由各批之 sanity check 確認。

---

## §6 拆批建議：8-h-c-pre-1 → 8-h-z 共 12 commits 之精修表

per `docs/phase-8h-pre-analysis.md` §5 既有規劃 + 本批風險分級之**精修建議**：

| 順序 | 批次 | 目標 | 修改檔案 | 預期風險 | 是否需 fixture | 預期 commands | 預期 commit message |
|---|---|---|---|---|---|---|---|
| 1 | **Phase 8-h-c-pre-1** | 補 6 個 legacy regression fixtures | `content/validation-fixtures/{blogger,github}/posts/_test-*.md` × 6 | 🟢 低（純 additive；不動 source）| ✅ 落地 fixtures 本身 | validate:content（驗 baseline 演進）| `test(fixtures): add Phase 8-h legacy fallback regression fixtures (8-h-c-pre-1)` |
| 2 | **Phase 8-h-c-pre-2**（可選）| baseline run + snapshot 更新 | `docs/phase-8h-baseline-snapshot.md` amend 或新增 | 🟢 極低（純 docs）| ❌ | 15 個 baseline commands | `docs(phase-8h): update baseline snapshot after fixture additions (8-h-c-pre-2)` |
| 3 | **Phase 8-h-c** | 移除 `frontmatter-uses-deprecated-type` warning rule（位置 #1）| `src/scripts/validate-content.js`（-8 行；line 326-333）| 🟡 低-中（warning rule；無 dist 影響）| 由 8-h-c-pre-1 之 `_test-deprecated-type-same.md` 保護 | validate + 完整 baseline 對照 | `refactor(validate): retire frontmatter-uses-deprecated-type warning (8-h-c)` |
| 4 | **Phase 8-h-d-1** | normalize contentKind/type fallback 退場（位置 #2）| `src/scripts/normalize-post-output.js`（line 179-198）| 🟠 中（contentKind 為核心 metadata）| 由 8-h-c-pre-1 之 `_test-deprecated-type-only.md` 保護 | 同上 | `refactor(normalize): retire contentKind ?? type legacy fallback (8-h-d-1)` |
| 5 | **Phase 8-h-d-2** | normalize FB sidecar legacy fallback 6 處退場（位置 #3-#8）| 同上（line 715-844）| 🔴 中-高（FB 流程核心）| 由 8-h-c-pre-1 之 `_test-legacy-fb-in-md.md` 保護 | 同上 + build:promotion 驗 byte-identical | `refactor(normalize): retire 6 FB sidecar legacy fallbacks (8-h-d-2)` |
| 6 | **Phase 8-h-d-3** | normalize canonical legacy fallback 退場（位置 #9）| 同上（line 674-688）| 🟡 低-中 | 由 8-h-c-pre-1 之 `_test-legacy-canonical-url.md` 保護 | 同上 | `refactor(normalize): retire canonical legacy frontmatter fallback (8-h-d-3)` |
| 7 | **Phase 8-h-d-4** | resolve-placeholders 4 處 URL fallback 退場（位置 #14-#17）| `src/scripts/resolve-placeholders.js`（line 91-119, 137-140）| 🟡 低-中 | 由 8-h-c-pre-1 之 `_test-legacy-published-url.md` + `_test-legacy-canonical-url.md` 保護 | 同上 | `refactor(placeholders): retire 4 legacy URL fallbacks (8-h-d-4)` |
| 8 | **Phase 8-h-e-1** | build-blogger tags fallback 退場（位置 #11）| `src/scripts/build-blogger.js`（line 251-257）| 🟠 中 | 由 8-h-c-pre-1 之 `_test-empty-normalized-tags.md` 保護 | 同上 + meta.json 對照 | `refactor(blogger): retire post.tags legacy fallback in buildMeta (8-h-e-1)` |
| 9 | **Phase 8-h-e-2-a** | build-blogger meta.json `type` 欄位改用 `normalized.identity.contentKind`（位置 #12 第一步）| 同上（line 264）| 🟠 中（meta.json schema 觀察性變動）| 由既有 ready posts 之 meta.json 對照保護 | 同上 | `refactor(blogger): switch meta.json type to normalized.identity.contentKind (8-h-e-2-a)` |
| 10 | **Phase 8-h-e-2-b**（可選）| 移除 meta.json `type` 欄位（位置 #12 第二步）| 同上 | 🔴 中-高（meta.json schema 變動更大）| 同上 | 同上 | `refactor(blogger): remove meta.json type field (8-h-e-2-b)` |
| 11 | **Phase 8-h-f** | build-promotion 4 欄位 fallback 退場（位置 #13）| `src/scripts/build-promotion.js`（line 145, 170-220）| 🟠 中 | 由 8-h-c-pre-1 之 `_test-legacy-fb-in-md.md` 保護 | 同上 + FB txt 對照 | `refactor(promotion): retire 4-field legacy fallback in build-promotion (8-h-f)` |
| 12 | **Phase 8-h-z** | docs sync + completion report | `docs/phase-8h-completion-report.md`（新增）+ `docs/future-roadmap.md` 同步 + `docs/phase-1-completion-report.md` §8.3 更新 | 🟢 低（純 docs）| ❌ | — | `docs(phase-8h): land legacy fallback removal completion report (8-h-z)` |

**合計**：**12 commits**（含 8-h-c-pre-1 + 8-h-c-pre-2 + 8-h-c ~ 8-h-z；含可選 8-h-e-2-b）。

**注**：若 8-h-c-pre-2（baseline update）與 8-h-e-2-b（meta.json type 整欄移除）跳過，commits 數可降至 **10**。

---

## §7 推薦下一個最小安全批次

### 7.1 推薦：**Phase 8-h-c-pre-1（fixture 補強）**

**理由**：

1. **0/16 fixture 覆蓋率**：當前無任何 fixture 觸發 Phase 8-h 任何 legacy 路徑；退場批之 regression 對照無 fixture 安全網
2. **保守路線符合既有偏好**：per `docs/phase-8h-pre-analysis.md` §7.4「無 fixture 保護退場路徑」+ §5 建議拆批之 8-h-c-pre 預留批位
3. **defense in depth**：fixture 落地後，後續退場批失敗可由 fixture diff 立即發現；無 fixture 則只能靠手動對照 dist
4. **fixture 屬純 additive**：不動 source code / 不移除任何 fallback / validate baseline 預期上升 +0 ~ +2 warnings（屬預期 fixture 觸發，非 regression）
5. **mirror Phase 9-e-d-d-b pattern**：Phase 9-e 系列亦先補 7 個 book validation fixtures 才進入 validate rule 落地，本批 fixture 為退場批同類 safety net

### 7.2 候選比較

| 候選 | 風險 | 效益 | 是否推薦 |
|---|---|---|---|
| 1. **Phase 8-h-c-pre-1（fixture 補強）** | 🟢 低 | 為後續 9 個退場批建立 fixture safety net | ✅ **推薦** |
| 2. Phase 8-h-c validate-content 直接退場 | 🟡 低-中 | scope 最小（單檔 / 1 warning rule）；可立即啟動退場 | ⚠️ 可行但無 fixture 保護 |
| 3. 更細的 single-file pre-analysis | 🟢 低 | 過度分析；本文件已涵蓋 16 in-scope 位置 | ❌ 不推薦（over-engineering）|
| 4. 暫停 Phase 8-h，改做其他 post-Phase-1 quick win | 🟢 低 | 可做 sitemap cross-source gap / Google Rich Results Test 準備 | ⚠️ 可行但破壞 Phase 8-h 連續性；baseline doc 變 stale |

### 7.3 不建議直接進 Phase 8-h-c 之原因

雖然 Phase 8-h-c（移除 #1 validate warning rule）為**最小退場批**，但**不建議直接進**：

- **無 fixture 保護**：若退場後發現 warning rule 仍有未知 caller，無 fixture 可逐項追溯
- **失去 8-h-c-pre-1 補強之機會**：後續 8-h-d-* / 8-h-e-* / 8-h-f 之 fixture 補強若延遲到 8-h-c 之後，安全性持續缺口擴大
- **mirror Phase 9-e 既有 pattern 建議**：先補 fixtures 再退場 rule 是 BLOG 系統一貫保守作法

---

## §8 不做項目與邊界聲明

### 8.1 本文件嚴格邊界

- ✅ 本文件**僅為純讀取分析封存**；不啟動任何 source / dist / validate 變動
- ✅ 本文件**不**啟動 Phase 8-h-c-pre-1（fixture 落地批；屬下一批之推薦）
- ✅ 本文件**不**啟動 Phase 8-h-c 至 Phase 8-h-z 任何退場實作批
- ✅ 本文件**不**移除任何 legacy fallback（17 個位置完整保留）
- ✅ 本文件**不**新增任何 fixture（per spec 規則 6）
- ✅ 本文件**不**啟動 Phase 9-g-g / 9-f-g（JSON-LD 進階強化）
- ✅ 本文件**不**啟動 Phase 9-h-f（兩端 Related Posts auto block）
- ✅ 本文件**不**啟動 Google Rich Results Test 驗證批
- ✅ 本文件**不**處理 we-media-myself2 cross-source mirror sitemap gap
- ✅ 本文件**不**動既有 source code / EJS templates / build scripts / settings / content
- ✅ 本文件**不**改 `.gitignore` 或 `package.json` / `vite.config.js`

### 8.2 與既有 Phase 8-h docs 之關係

- `docs/phase-8h-pre-analysis.md`（commit `a538564`）為 **Phase 8-h-a-doc** 最初盤點；本文件**繼承**其 §3 之 17 位置列表
- `docs/phase-8h-baseline-snapshot.md`（commit `c9ce52c`）為 **Phase 8-h-b** baseline run snapshot；本文件**繼承**其 §3.4 之 dist regression baseline
- 本文件作為 **Phase 8-h-c-pre** 之分析封存；補強 fixture 設計建議 + 12-commit 拆批精修表
- 三份文件構成 **Phase 8-h 退場系列之前置三部曲**：pre-analysis → baseline → c-pre plan

### 8.3 安全網設計

- 本文件之 §6 拆批表為「12 commits 退場路線」之**官方建議**
- 任何後續退場批失敗 → 可由 fixture diff（per §5.2）+ baseline snapshot（per §6 順序 2）對照定位
- 退場批之 sanity check **至少**驗證：(1) validate baseline 演進符合 §5.3 預期 / (2) dist 檔案數一致 / (3) build × 6 exit 0 / (4) 各 report 計數一致

### 8.4 本批 commit 範圍

- 本批僅新增 `docs/phase-8h-c-pre-plan.md` 1 個檔案
- 0 個 source code 變動
- 0 個 fixture 新增（per spec 規則 6）
- 0 個 legacy fallback 移除（per spec 規則 7）
- 本批 commit 範圍：**1 個 docs 檔案；單檔 commit**

---

## §9 Cross-links

### 9.1 主要引用基準

- `docs/phase-8h-pre-analysis.md`（Phase 8-h-a-doc 退場前盤點分析；commit `a538564`）
- `docs/phase-8h-baseline-snapshot.md`（Phase 8-h-b 退場前 baseline run；commit `c9ce52c`）
- `docs/phase-1-completion-report.md` §8.3 / §11 順序 3（Phase 8-h pending + 退場批 trigger condition）
- `docs/future-roadmap.md` §8.5 順序 3（Phase 8-h 退場批排程）

### 9.2 主要 source code（17 位置之檔案）

- `src/scripts/validate-content.js`（位置 #1）
- `src/scripts/normalize-post-output.js`（位置 #2-#9）
- `src/scripts/parse-markdown.js`（位置 #10；out-of-scope）
- `src/scripts/build-blogger.js`（位置 #11-#12）
- `src/scripts/build-promotion.js`（位置 #13）
- `src/scripts/resolve-placeholders.js`（位置 #14-#17）

### 9.3 主要 Phase 8 系列 schema docs（fallback 對應之 normalized schema）

- `docs/publish-bundle.md`（sidecar bundle 三檔結構；contentKind / FB sidecar / canonical 分離）
- `docs/publish-json-schema.md`（`.publish.json` schema；canonical / publishedUrl 規則）
- `docs/fb-sidecar-schema.md`（`.fb.md` schema；FB sidecar 欄位）
- `docs/migration-from-frontmatter.md`（舊 frontmatter 遷移指引；含 `type` → `contentKind` / FB 欄位遷移）

### 9.4 規範來源

- `CLAUDE.md` §27（Claude Code 修改規則；本文件嚴格遵守「不動 source / 不移除 legacy fallback / 不 push」之保守原則）

---

（本文件結束）
