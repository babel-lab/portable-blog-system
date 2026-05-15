# Phase 8-h Pre-Analysis：legacy fallback removal readiness audit

本文件為 Phase 8-h legacy 欄位退場系列之**退場前分析**。封存 Phase 8-h-a 純讀取盤點結果；**不**代表 Phase 8-h 已開始實作。

對應之上層文件：
- `docs/phase-1-completion-checklist.md` §6.2（殘留 8 個 source code 位置摘要）+ §11.3（拆批建議）
- `docs/phase-1-completion-report.md` §8.3（Phase 8-h pending 描述）+ §11 順序 3（後續批次位置）
- `docs/future-roadmap.md` Phase 9 mega-row 末段（Phase 8-h legacy 退場仍 pending）

---

## §1 文件目的

### 1.1 本文件是什麼

- BLOG 系統 **Phase 8-h（legacy 欄位退場系列）之退場前盤點分析報告**
- Phase 8-h-a（純讀取盤點批；本批之前置）已於對話內完成；本文件將其結果落地為 docs
- 採**快照型**封存：記錄本文件撰寫當下之 source code 狀態與分析判斷

### 1.2 本文件不是什麼

- ❌ **不是** Phase 8-h 之啟動報告或完成報告
- ❌ **不是** legacy 退場之實作說明（無任何 source code 變動）
- ❌ **不是**對「Phase 8-h 必須現在啟動」之背書
- ❌ **不是**對 18 個 legacy 位置之退場最終決策（最終決策待 Phase 8-h-b baseline 與 §10 真實作者流程後再評估）

### 1.3 Phase 8-h 當前狀態

```
Phase 8-h legacy 欄位退場     ⏸ pending
├── Phase 8-h-a 純讀取盤點    ✅ completed（對話內 + 本文件）
└── Phase 8-h-b ~ 8-h-z       未啟動
```

**重要**：本文件 landed 後，**不**等同 Phase 8-h 已啟動。後續批次（8-h-b baseline / 8-h-c-pre fixtures / 8-h-c ~ 8-h-z 退場）皆未啟動，**待**真實作者試寫流程（per `docs/phase-1-completion-checklist.md` §10）與 Phase 9-z-d final report 升正式版**之後**評估啟動時機。

---

## §2 Current Snapshot

### 2.1 Git 狀態

| 項目 | 值 |
|---|---|
| **HEAD**（本文件撰寫前） | `4f4349c docs(phase-9z): draft Phase 1 final completion report (candidate)` |
| **working tree** | clean |
| **本批名稱** | Phase 8-h-a-doc：write legacy fallback removal pre-analysis |

### 2.2 Baseline 指標

| 指標 | 數值 | 來源 |
|---|---|---|
| `validate:content` baseline | `0 error / 22 warning on 17 post(s)`（`0/22/17`） | `docs/phase-9g-completion-report.md` §5.1 / `docs/phase-1-completion-checklist.md` §2.2 |
| Ready GitHub posts | 2 篇（`contentKind: tech-note`） | `content/github/posts/*.md` |
| Ready Blogger posts | 0 篇（`20260504-sample-book-review` 仍為 draft） | `content/blogger/posts/*.md` |

### 2.3 Phase 1 / 9-z 系列相關 landed 狀態

| Milestone | 狀態 | 對 Phase 8-h 之影響 |
|---|---|---|
| Phase 9-z-b：`docs/phase-1-completion-checklist.md` | ✅ landed（commit `4c87d1f`）| 提供 §6.2 殘留 source code 位置之精確標註，作為本文件起點 |
| Phase 9-z-c：`docs/phase-1-completion-report.md`（completion candidate）| ✅ landed（commit `4f4349c`）| 標明 Phase 1 為 completion **candidate** 而非 100% final complete；§11 順序 3 規範 Phase 8-h 之啟動 trigger condition |
| §10 真實作者試寫流程 | ❌ 未啟動 | Phase 8-h 之保守延後依據；fallback 為作者 legacy schema 誤用之主要防護 |

### 2.4 退場範圍 source code grep 確認

本盤點批已執行下列 grep 確認 active caller 狀態：

| 檢測對象 | content/ 內 grep | 結論 |
|---|---|---|
| `^type:` legacy frontmatter | **0 命中** | 所有 posts / templates / fixtures 已遷移為 `contentKind` |
| `promotion.facebook.*` 於 .md frontmatter | **0 命中** | 已遷移至 `.fb.md` sidecar |
| top-level `publishedUrl` / `githubUrl` / `canonicalUrl` | **0 命中** | 已遷移至 `.publish.json` nested 結構 |
| frontmatter `canonical:` 為 URL（非 `"auto"`） | **0 命中** | 7 篇全為 `canonical: "auto"` |

**意涵**：所有 legacy fallback **當前 dormant / 0 active caller**；技術上移除不會改變既有 ready posts 之 dist 輸出（byte-identical-modulo-builtAt）；但這同時意味著**無 fixture 保護**這些 fallback 路徑。

---

## §3 Legacy Fallback Inventory

橫跨 6 個 source files，共 **18 個 legacy 位置**。

### 3.1 `src/scripts/validate-content.js`

| # | 行號 | legacy 對象 | 類型 | 目前用途 | fixture 測試 | 建議處理 | 風險 | 建議批 |
|---|---|---|---|---|---|---|---|---|
| 1 | 326-333 | `frontmatter-uses-deprecated-type` warning | validate warning rule | 偵測作者**同時填** `type` + `contentKind` 之同值 frontmatter | ❌（content/ 內 0 篇 post 觸發） | **保留**至 §10 試寫後；之後可移除 | 🟡 低-中 | 8-h-c |

**附註**：

- line 314-325 之 `contentkind-and-type-conflict` warning（衝突值偵測）建議**不退場**（屬永久防呆價值；deprecated 退場不等於 conflict 退場）
- line 306-313 之 `invalid-content-kind` warning 為正規 schema 檢查，**不在 Phase 8-h 範圍**

### 3.2 `src/scripts/normalize-post-output.js`

| # | 行號 | legacy 對象 | 類型 | 目前用途 | fixture | 建議處理 | 風險 | 建議批 |
|---|---|---|---|---|---|---|---|---|
| 2 | 184-198 | `contentKind ?? type` fallback + `deprecated-legacy-type-fallback` warning record | metadata fallback + warning | post 無 contentKind 但有 type 時，從 type 推 contentKind 並 record warning | ❌ | **保留**至 §10 試寫後；之後移除 | 🟠 中 | 8-h-d-1 |
| 3 | 715-738 | `legacyFb.enabled` boolean fallback | FB sidecar 多源 fallback | `.fb.md` 缺 enabled 時讀舊 frontmatter `promotion.facebook.enabled` | ❌ | **保留**至 §10 試寫後 | 🔴 中-高 | 8-h-d-2 |
| 4 | 741-757 | `legacyFb.target` fallback | 同上 target 欄位 | 同上邏輯 | ❌ | 同上 | 🔴 中-高 | 8-h-d-2 |
| 5 | 759-769 | `legacyFb.message` 純讀（無 sidecar 對應）| legacy-only | 讀舊 frontmatter `promotion.facebook.message` | ❌ | **保留**至 §10 試寫後；之後評估改用 `.fb.md.body` 替代 | 🔴 中-高 | 8-h-d-2 |
| 6 | 771-789 | `promotion.facebook.body` 之 `fb.md.body` 優先 + legacy message fallback | mixed | sidecar body 優先；fallback 至 legacy message | ❌ | 同上 | 🔴 中-高 | 8-h-d-2 |
| 7 | 791-815 | `legacyFb.hashtags` array fallback | 同上 hashtags | sidecar hashtags 空時讀 legacy | ❌ | **保留**至 §10 試寫後；之後可移除（既有 fallback chain step 3-4 已含 series.hashtags / siteDefaultHashtags 保護）| 🟠 中 | 8-h-d-2 |
| 8 | 817-844 | `legacyFb.finalUrl` fallback | 同上 finalUrl | sidecar finalUrl 缺時讀 legacy | ❌ | **保留**至 §10 試寫後 | 🟠 中 | 8-h-d-2 |
| 9 | 674-700 | legacy frontmatter `canonical` URL fallback（限 URL string 非 `'auto'`）| canonical 多源 fallback | sidecar canonical + computed 皆空時讀舊 frontmatter `canonical` 之 URL | ❌（全 ready posts 為 `canonical: "auto"`） | **保留**至 §10 試寫後；之後可移除 | 🟡 低-中 | 8-h-d-3 |

### 3.3 `src/scripts/parse-markdown.js`

| # | 行號 | 對象 | 類型 | 目前用途 | 建議處理 | 風險 | 建議批 |
|---|---|---|---|---|---|---|---|
| 10 | 10-46 | H1 → H2 自動降級（Phase 7-fix-1 (B)）| markdown-it renderer 覆寫 | body 內所有 `<h1>` 降為 `<h2>`，避免一頁兩個 H1（SEO 防呆）| **⚠️ 不退場** | -（不適用）| **⚠️ 不在 Phase 8-h scope** |

**理由**：

- H1 → H2 屬 SEO「一頁一 H1」**永久防呆**，與 contentKind / FB sidecar / canonical 等 **schema migration legacy** 屬不同範疇
- 既有三層防護（validate `body-leading-h1` warning + new-post.js template scaffolding + parse-markdown auto demote）為一致設計，皆無 deprecated 性質
- 本文件**明示**：此項**不**列入 Phase 8-h 退場範圍；若未來有強烈退場需求，應另開獨立批（建議 Phase 9-x 或 Phase 10-x），不混入 Phase 8-h

### 3.4 `src/scripts/build-blogger.js`

| # | 行號 | legacy 對象 | 類型 | 目前用途 | fixture | 建議處理 | 風險 | 建議批 |
|---|---|---|---|---|---|---|---|---|
| 11 | 231-244 | `normalized.publish.blogger.tags` 優先 + `post.tags` legacy fallback | normalized-priority + legacy fallback | meta.json `tags` 欄位來源；normalized 缺值時 fallback 至 `post.tags` | ❌（normalized 必填）| **保留**至 §10 試寫後；之後可移除 fallback 改為純 normalized | 🟠 中 | 8-h-e-1 |
| 12 | 251 | `type: post.type ?? null` 寫入 meta.json | meta.json 欄位 | 輸出至 `dist-blogger/posts/{slug}/meta.json` 之 `type` 欄位（當前所有 ready posts 之 dist 輸出為 `"type": null`） | ❌ | **改用 `normalized.identity.contentKind`** 或**移除整欄**（建議 8-h-e-2 拆 2 子批）| 🔴 中-高（meta.json schema 變動）| 8-h-e-2 |

### 3.5 `src/scripts/build-promotion.js`

| # | 行號 | legacy 對象 | 類型 | 目前用途 | fixture | 建議處理 | 風險 | 建議批 |
|---|---|---|---|---|---|---|---|---|
| 13 | 158-208 | 4 欄位（title / target / message / hashtags）normalized 優先 + legacy fallback | normalized-priority + legacy fallback | manifest entry 之 4 個欄位；normalized 缺值時 fallback 至 `fb.title` / `fb.target` / `fb.message` / `fb.hashtags`（來自 `classifyFacebook` 之 `fb` 來源）| ❌ | **保留**至 §10 試寫後；之後可移除改純 normalized | 🟠 中 | 8-h-f |

### 3.6 `src/scripts/resolve-placeholders.js`

| # | 行號 | legacy 對象 | 類型 | 目前用途 | fixture | 建議處理 | 風險 | 建議批 |
|---|---|---|---|---|---|---|---|---|
| 14 | 91-94 | `post.publishedUrl` legacy top-level frontmatter | resolver step 3 | Blogger publishedUrl 解析之第 3 層 fallback | ❌ | **保留**至 §10 試寫後；之後可移除 | 🟡 低-中 | 8-h-d-4 |
| 15 | 112-115 | `post.github.publishedUrl` legacy frontmatter | resolver step 3 | GitHub publishedUrl 解析之第 3 層 fallback | ❌ | 同上 | 🟡 低-中 | 8-h-d-4 |
| 16 | 116-119 | `post.githubUrl` legacy top-level alias | resolver step 4 | GitHub publishedUrl 解析之第 4 層 fallback | ❌ | 同上 | 🟡 低-中 | 8-h-d-4 |
| 17 | 137-140 | `post.canonicalUrl` legacy frontmatter | canonical resolver step 3 | canonical URL 解析之第 3 層 fallback | ❌ | 同上 | 🟡 低-中 | 8-h-d-4 |

### 3.7 Inventory 合計

| 檔案 | 位置數 |
|---|---|
| `validate-content.js` | 1（#1） |
| `normalize-post-output.js` | 8（#2-#9） |
| `parse-markdown.js` | 1（#10；**不在範圍**） |
| `build-blogger.js` | 2（#11-#12） |
| `build-promotion.js` | 1（#13） |
| `resolve-placeholders.js` | 4（#14-#17） |
| **合計** | **17 個 Phase 8-h 範圍位置 + 1 個明確排除位置 = 18 個位置** |

### 3.8 Fixtures 保護狀態

`content/validation-fixtures/{github,blogger}/posts/` 之 15 個 `_test-*.md` 全為 series / book / fb-titleEn / related-links 之 schema validation 測試；**無一條** fixture 觸發 Phase 8-h 範圍之任何 legacy 規則。

**意涵**：

- 退場前無 fixture 可作為 regression 測試保護
- 退場前若需驗證 fallback 路徑尚可運作，需於 Phase 8-h-c-pre 補寫專屬 fixture

---

## §4 風險排序

依移除後對 dist 之潛在影響程度排序：

### 4.1 🔴 高風險

強烈建議等 §10 真實作者試寫流程後再處理。

| 位置 | 理由 |
|---|---|
| **#12** build-blogger.js:251 `type: post.type ?? null` 寫入 meta.json | meta.json schema 變動會影響下游（若有外部消費者 / 未來工具讀 meta.json）；移除 / 改欄位需評估向後相容性 |
| **#3-#8** normalize-post-output.js FB sidecar legacy fallback chain（6 處：enabled / target / message / body / hashtags / finalUrl） | FB 推廣為核心流程；fallback 移除後若試寫文章誤填 legacy schema，會 silent broken（dist-promotion 之 FB .txt 缺漏） |

### 4.2 🟠 中風險

等 §10 完成且 final report 升正式版後可進。

| 位置 | 理由 |
|---|---|
| **#2** normalize-post-output.js contentKind/type fallback | contentKind 為文章核心 metadata；缺值會影響 article block conditional render |
| **#13** build-promotion.js 4 欄位 fallback | normalize FB legacy 移除後之傳遞風險 |
| **#11** build-blogger.js tags fallback | Blogger labels 為 SEO / 分類核心；移除後若 normalized 失敗會輸出空 tags |

### 4.3 🟡 低-中風險

等 final report 後可進，順序較後。

| 位置 | 理由 |
|---|---|
| **#9** normalize-post-output.js canonical legacy frontmatter fallback | 既有 sidecar canonical.url + computed 兩層已足；legacy 為第三層 fallback |
| **#14-#17** resolve-placeholders.js 4 處 legacy URL fallback | 屬 resolver 之最末層 fallback |
| **#1** validate-content.js `frontmatter-uses-deprecated-type` warning rule | warning-only；移除不阻擋 build / validate exit code |

### 4.4 ⚠️ 不在 Phase 8-h 範圍

| 位置 | 理由 |
|---|---|
| **#10** parse-markdown.js H1 → H2 自動降級 | Phase 7-fix-1 (B) **永久防呆設計**；與 schema migration legacy 不同範疇；若未來退場需另開獨立批（建議 Phase 9-x 或 Phase 10-x） |

---

## §5 建議拆批順序

依 §4 風險排序之保守原則，建議拆批：

| 批次 | 範圍 | 性質 | 預期 commit 數 |
|---|---|---|---|
| **8-h-a** | 純讀取盤點（對話內 + 本文件）| 純對話分析 + docs（本批 8-h-a-doc 即此）| 1（本文件）|
| **8-h-b** | 退場前 baseline 驗證批次（含 validate + 5 個 build + 多個 report / check；產出 `docs/phase-8h-baseline-snapshot.md`）| 唯一允許執行 build / validate 之非退場批 | 1 |
| **8-h-c-pre** | （可選）補滿 legacy 觸發案例之 regression fixtures（避免無保護退場）| 純 additive；不退場 | 1-2 |
| **8-h-c** | validate `frontmatter-uses-deprecated-type` warning 規則調整（位置 #1） | 單檔（`validate-content.js`）；baseline 可能變動 | 1 |
| **8-h-d-1** | normalize contentKind / type fallback 退場（位置 #2） | 單檔（`normalize-post-output.js`）| 1 |
| **8-h-d-2** | normalize FB sidecar legacy fallback 6 處退場（位置 #3-#8） | 單檔；scope 最大 | 1 |
| **8-h-d-3** | normalize canonical legacy frontmatter fallback 退場（位置 #9） | 單檔 | 1 |
| **8-h-d-4** | resolve-placeholders 4 處 legacy URL fallback 退場（位置 #14-#17） | 單檔（`resolve-placeholders.js`）| 1 |
| **8-h-e-1** | build-blogger tags fallback 退場（位置 #11） | 單檔（`build-blogger.js`）| 1 |
| **8-h-e-2** | build-blogger meta.json `type` 欄位處理（位置 #12；改用 `normalized.identity.contentKind` 或移除整欄）| 單檔 | 1 |
| **8-h-f** | build-promotion 4 欄位 legacy fallback 退場（位置 #13） | 單檔（`build-promotion.js`）| 1 |
| **8-h-z** | docs sync + completion report（同步 future-roadmap / phase-1-checklist / phase-1-report 之 Phase 8-h pending → ✅ landed；新增 `docs/phase-8h-completion-report.md`） | 多檔 docs；單 commit | 1-2 |

**合計**：8-h-b 至 8-h-z 共 **9-11 commits**（不含本批 8-h-a-doc 之 1 commit）。

**🚫 不啟動**：parse-markdown.js H1 → H2（位置 #10；屬 Phase 7-fix-1 永久防呆，不在 Phase 8-h 範圍）。

---

## §6 Baseline Run 建議

Phase 8-h-b 退場前 baseline 驗證批次建議執行下列 scripts：

| 命令 | 目的 |
|---|---|
| `npm run validate:content` | 確認 baseline = `0 error / 22 warning on 17 post(s)`（per Phase 9-z-c 紀錄）|
| `npm run build:github` | 取得 GitHub 全站 dist snapshot |
| `npm run build:blogger` | 取得 Blogger dist snapshot（含 meta.json / copy-helper.txt / publish-checklist.txt）|
| `npm run build:promotion` | 取得 FB promotion manifest snapshot |
| `npm run build:sitemap` | **順帶**補上當前缺檔 `dist/sitemap.xml` + `dist/robots.txt`（per `docs/phase-1-completion-report.md` §3.3）|
| `npm run build:blogger-theme` | 取得 Blogger theme CSS dist snapshot |
| `npm run build` | vite build 整合 |
| `npm run report:build` | 取得 build report 作為對照基準 |
| `npm run report:drafts` | 取得 draft posts report snapshot |
| `npm run report:missing-tags` | 取得 missing tags report snapshot |
| `npm run report:urls` | 取得 published URLs report snapshot |
| `npm run report:series` | 取得 series report snapshot |
| `npm run report:book` | 取得 book report snapshot |
| `npm run check:links` | 取得 broken links report snapshot |
| `npm run check:images` | 取得 image links report snapshot |

**Snapshot 儲存建議**（於 8-h-b 落實時決定細節）：

- 跑完後將各 dist 主要檔案之 hash（md5 / sha256）寫入 `docs/phase-8h-baseline-snapshot.md`
- 記錄各 build 之 stdout 摘要（耗時 / module count）
- 記錄 `validate:content` 完整輸出
- 此 snapshot 作為 8-h-c ~ 8-h-f 退場批之 regression 對照基準

**⚠️ 本文件不執行任何 baseline run**；以上僅為記錄 Phase 8-h-b 之預期工作清單。

---

## §7 為什麼建議等真實作者流程後再實作 Phase 8-h

採**強烈保守**判斷，**不建議立刻實作 legacy 退場**。理由依重要性排序：

### 7.1 應先做 §10 真實作者試寫流程

`docs/phase-1-completion-checklist.md` §10 之 ~50 條真實作者使用流程 checklist 當前**0 條已勾選**。

- §10 為 Phase 1「完整使用與測試完成度」之核心驗收
- §10 試寫過程是 legacy fallback **最可能被誤用之時機**：
  - 作者首次填 frontmatter 可能誤用 legacy `type:` 而非 `contentKind:`
  - 作者首次填 FB 推廣可能誤用 legacy `promotion.facebook.*` 於 .md 而非 .fb.md
  - 作者首次填 canonical / publishedUrl 可能誤用 legacy top-level frontmatter
- 當前 fallback + deprecated warning 雙層防護於試寫時為**作者學習曲線之安全網**

若**先退場再試寫**：作者誤用後無 fallback 接住，dist 安靜壞掉，validate 也失去 deprecated warning 提示。

### 7.2 Phase 1 仍為 completion candidate

`docs/phase-1-completion-report.md` 當前為 **completion candidate**（per `docs/phase-9z-...`；通過 commit `4f4349c`），尚未升級為正式 final completion report。

- candidate 狀態下動 source code 會出現「未封存 Phase 1 又動結構」之矛盾
- Phase 1 final 封存 → Phase 8-h 退場 → 為清晰之路線

### 7.3 Phase 8-h-b baseline 應先於 8-h-c 退場批

即使最終啟動 Phase 8-h，也**不應**直接跳到 8-h-c（validate rule 退場）或 8-h-d-* / 8-h-e-* / 8-h-f（source code 退場）。

- 8-h-b 必須先跑：取得退場前 dist snapshot 作為 regression 基準
- 退場批之 sanity check 將依賴 8-h-b snapshot 比對
- 跳過 8-h-b 直接退場 = 無 regression 對照 = 退場後即使壞掉也難察覺

### 7.4 無 fixture 保護退場路徑

per §3.8：當前 0 個 fixture 觸發 Phase 8-h 範圍之 legacy 規則。

- 若退場前無補 fixture，退場後無 test 可確認「fallback 路徑確實移除而非邏輯破壞」
- 建議於 8-h-b 之後、8-h-c 之前增加 8-h-c-pre 補 fixture 批

### 7.5 Phase 9-z-c §11 已明確規範退場 trigger

`docs/phase-1-completion-report.md` §11 順序 3 寫明：

> **Phase 8-h legacy 退場拆批分析**
> - trigger condition：**順序 2 完成（final report 已封存）+ 作者熟悉 Phase 8-a normalized 結構**

當前順序 2 尚未完成。本文件遵守 9-z-c §11 之規範，**不**主動啟動 Phase 8-h-b 或更後續批次。

### 7.6 若使用者仍要立即做，第一步必須是 Phase 8-h-b baseline

**不是**直接刪 fallback。理由：

- 8-h-b 為**最保守**且**可逆**之第一步：只執行 build + validate 並記錄 snapshot，**不**修改任何 source code
- 8-h-b 之產出（baseline snapshot doc）為後續所有退場批之 regression 對照基準
- 若 build / validate 過程發現任何意料外的失敗，可立即回到 8-h-a 重新評估，**不需** rollback source code

---

## §8 與 Phase 1 Completion Candidate 的關係

### 8.1 Phase 8-h 並非 Phase 1 系統能力可驗收的阻擋項

per `docs/phase-1-completion-report.md` §4.1 之系統能力判定：

- CLAUDE.md §28 17 條 MVP 必做項目**全 ✅**
- CLAUDE.md §29 12 項第一版不做清單**全維持不做**
- Phase 0-7 主軸**全 ✅**
- Phase 8-a ~ 8-g 主軸**全 ✅**（Phase 8-h pending **屬清理工作，非新功能缺漏**）
- Phase 9 主軸**全 ✅**

Phase 8-h pending **不阻擋** Phase 1 系統能力之驗收宣告為「✅ 接近收尾條件 / 已達收尾條件」。

### 8.2 但 Phase 8-h 會影響後續 codebase 乾淨程度

- legacy fallback 之存在代表 source code 仍持有「Phase 1-7 之 frontmatter schema」與「Phase 8-a 之新 schema」**兩套並存**之適配層
- normalized metadata 之**完整正式化**需 legacy fallback 退場後才達成
- 未來新增 phase（Phase 10-X 或 Phase 11-X）若再加 schema，並存層會更複雜

### 8.3 因此 Phase 8-h 應放在 final checklist / report 之後獨立處理

完整順序（per `docs/phase-1-completion-report.md` §11 順序 1-3）：

```
順序 1：作者真實內容試寫 / end-to-end validation（§10 試寫）
   ↓
順序 2：視結果修正 checklist / report（包含 Phase 9-z-d 升級 final report 為正式版）
   ↓
順序 3：Phase 8-h legacy 退場拆批分析（即啟動 8-h-b 至 8-h-z）
```

Phase 8-h 與 Phase 9-g-g / 9-f-g JSON-LD 進階（順序 4-5）為**並行候選**，皆排在順序 2 之後；不互相 dependency，可依優先序選擇先啟動哪批。

---

## §9 下一步建議

封存本文件後，依下列三條路線擇一：

### 9.1 路線 A：建議路線（強烈推薦）

**先做真實作者試寫流程，再回來做 Phase 8-h-b baseline**。

順序：

1. 作者依 `docs/phase-1-completion-checklist.md` §10 試寫 ≥ 1 篇 ready post + ≥ 1 個 dormant block 啟用
2. Claude Code 於 Phase 9-z-d 將 `docs/phase-1-completion-report.md` 升級為正式 final completion report（移除 "candidate" 標註）
3. Phase 8-h-b：執行退場前 baseline 批，產出 `docs/phase-8h-baseline-snapshot.md`
4. Phase 8-h-c-pre（可選）：補 legacy regression fixtures
5. Phase 8-h-c → 8-h-d-1 ~ d-4 → 8-h-e-1 / e-2 → 8-h-f：逐批退場
6. Phase 8-h-z：docs sync + 新增 `docs/phase-8h-completion-report.md`

**優點**：完全遵守 9-z-c §11 之規範；fallback 於試寫時為作者學習曲線之安全網；退場前 codebase 已歷經真實流程驗證。

**缺點**：等待時間取決於作者試寫速度。

### 9.2 路線 B：若要現在做

**先跑 Phase 8-h-b baseline**，不直接退場。

順序：

1. Phase 8-h-b：執行退場前 baseline 批，產出 `docs/phase-8h-baseline-snapshot.md`
2. **停下**等待作者試寫或重新評估是否進入 8-h-c

**優點**：取得當前狀態之完整 dist snapshot；順帶補上當前缺檔 `dist/sitemap.xml` + `dist/robots.txt`；可作為 §10 試寫之**前**對照基準。

**缺點**：若試寫過程發現需修 source code，須重跑 8-h-b 取得新基準；8-h-b 之 effort 可能部分浪費。

### 9.3 路線 C：若先暫停

**保留本文件作為後續接續點**。

順序：

1. 不啟動任何後續批次
2. 本文件作為 Phase 8-h-a 之 完成記錄
3. 待未來任何時機（不限於 §10 完成）想啟動 Phase 8-h 時，從本文件 §5 拆批順序起手

**優點**：當前 working tree 維持簡單；不增加未來不確定性。

**缺點**：若 codebase 未來新增功能與 legacy fallback 互動，本文件之分析可能 stale，需重跑 Phase 8-h-a。

---

## §10 Cross-links

### 10.1 上層規範

- `CLAUDE.md` §27（Claude Code 修改規則）+ §29（第一版不做清單）
- `docs/future-roadmap.md` §2 Phase 9 mega-row 末段（Phase 8-h pending 標註）

### 10.2 Phase 1 / 9-z 系列

- `docs/phase-1-completion-checklist.md` §6.2（殘留 source code 位置精確摘要）+ §11.3（拆批建議）
- `docs/phase-1-completion-report.md` §8.3（Phase 8-h pending 描述）+ §11 順序 3（後續批次位置）

### 10.3 相關 Phase Completion Reports

- `docs/phase-8g-completion-report.md`（含 Phase 8-g-20 candidate 6 deferred 至 8-h+ 之記錄）
- `docs/phase-9g-completion-report.md`（含 §8.4 / 9-h-r 相關 deferred 紀錄）
- `docs/phase-9h-completion-report.md`（含 §8.4 Phase 8-h legacy 退場盤點）

### 10.4 Schema 文件

- `docs/publish-bundle.md` §2.4（`contentKind` / `blogger.type` 分離原則）
- `docs/publish-json-schema.md`（`.publish.json` schema；含 publishedUrl 不可預測規則）
- `docs/fb-sidecar-schema.md`（`.fb.md` schema；含 legacy frontmatter fallback 規範）
- `docs/migration-from-frontmatter.md` §3（`type` → `contentKind` 改名規則）+ §5（publish.json fallback 規則）+ §6（fb sidecar 對照）

---

（本文件結束）
