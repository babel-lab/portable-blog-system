# Phase 9-e Completion Report：book / source metadata schema 系列

本文件為 Phase 9-e **book / source metadata schema 系列**之完整完成報告。涵蓋自 Phase 9-e-a（純分析）至 Phase 9-e-e（本批）共 13 個子批（含 5 個純分析批 + 8 個含 commit）之落地紀錄、驗證結果與 deferred 項目。

對應之上層紀錄詳見：
- `docs/book-schema.md` §11（已落地之 validate rules 完整規格）
- `docs/future-roadmap.md` §2 Phase 9 row（跨 phase 路線總覽）
- `CLAUDE.md` §12（書評文章規則原始 spec；含 See also 至 `docs/book-schema.md`）

---

## §1 Phase 9-e 目標摘要

Phase 9-e 之目標為建立 **book / source metadata schema**（書 / 雜誌 / 來源實體）之完整 metadata 系統，含以下五大成果：

1. **book / source metadata schema**：新建 `docs/book-schema.md` 規範文件（10 節主體 + §11 validate rules 章節）
2. **book review / magazine template**：sample post 補欄位、新增 magazine template、book template realign
3. **validation warning rules**：7 條 warning-only validate rules 落地於 `src/scripts/validate-content.js`
4. **validation fixtures**：7 個 fixtures 落地於 `content/validation-fixtures/blogger/posts/`（每規則一檔）
5. **docs sync**：`docs/book-schema.md` §11 + `docs/future-roadmap.md` §2 Phase 9 row + 本完成報告

---

## §2 Phase 9-e 子批列表

共 13 個子批（5 個純分析 + 8 個含 commit）：

| 子批 | 性質 | commit | subject |
| --- | --- | --- | --- |
| 9-e-a | 純分析 | — | book / source metadata schema 純分析決策紀錄 |
| 9-e-b | 含 commit | `e03c87d` | `docs(phase-9): add book source metadata schema` |
| 9-e-c-a | 純分析 | — | sample / template 補強前置分析 |
| 9-e-c-b | 含 commit | `235cdf7` | `docs(phase-9): backfill book schema in sample and add magazine template` |
| 9-e-c-c-a | 純分析 | — | blogger-book-review-template realign 前置分析 |
| 9-e-c-c-b | 含 commit | `f16e79e` | `docs(phase-9): realign blogger-book-review-template to book-review semantics` |
| 9-e-d-a | 純分析 | — | book schema validate warning / helper 前置分析 |
| 9-e-d-b | 含 commit | `95437a3` | `feat(phase-9): add book schema mediaType / magazine field warnings` |
| 9-e-d-c | 含 commit | `4f37cbc` | `feat(phase-9): add book authors / volume / publishedYear validate warnings` |
| 9-e-d-d-a | 純分析 | — | book schema validation fixtures 前置分析 |
| 9-e-d-d-b | 含 commit | `63aa497` | `feat(phase-9): add book schema validation fixtures (7 rules)` |
| 9-e-d-e | 含 commit | `a084bea` | `docs(phase-9): sync book-schema and roadmap with 9-e-d landings` |
| **9-e-e**（本批）| 含 commit | 見本批 git log | `docs(phase-9): add phase-9e completion report` |

**含 commit 子批合計**：8 個（含本批）
**純分析子批合計**：5 個

---

## §3 已完成成果

### 3.1 `docs/book-schema.md` 新增完整 book schema

- **新建主體**（9-e-b commit `e03c87d`）：10 節
  - §1 文件目的（book = 單篇文章評論 / 引用之來源實體）
  - §2 與其他 schema 邊界（含與 `series` schema 嚴格分離原則）
  - §3 基本 frontmatter 範例（book review + magazine review）
  - §4 欄位字典（20 欄位總表 + 子節詳述）
  - §5 mediaType 規則（缺省為 `"book"`）
  - §6 author legacy handling（legacy `book.author` + `book.authors[]` 並存）
  - §7 `authors[]` fallback chain（5 步）
  - §8 設計原則（additive only / all optional / 不輸出空白 / 不推導發布資料 / 不與 series 混用）
  - §9 未來可能擴充但本期不做（10 條候選表）
  - §10 Phase 9-e-b 落地紀錄
- **§11 新增**（9-e-d-e commit `a084bea`）：已落地之 validate rules（Phase 9-e-d 系列）
  - §11.1 範圍與性質（warning-only / 不阻擋 build / 不改 dist / ready+published only / 共用 book 前置 guard）
  - §11.2 規則清單（7 條完整表）
  - §11.3 對應 validation fixtures（7 個對應表）
  - §11.4 validate baseline 變動紀錄
  - §11.5 deferred rules（3 條 + 不落地理由）
  - §11.6 helpers / constants inline 清單
  - §11.7 不接 normalize-post-output / build pipeline 之邊界聲明

### 3.2 `docs/content-schema.md` / `CLAUDE.md` 已有 cross-link

- `docs/content-schema.md`（9-e-b 同批落地）：See also 新增一行指向 `docs/book-schema.md`（書籍 / 雜誌 / 來源實體 metadata 規格）
- `CLAUDE.md` §12（9-e-b 同批落地）：See also 區塊新增（不改 §12 主體規格；含 `book.mediaType` / `book.titleEn` / `book.volume` / `book.issue` / `book.authors[]` / `book.publishedYear` 等 additive 欄位字典與 fallback chain 之 link）

### 3.3 sample post 已 backfill book schema

- `content/blogger/posts/20260504-sample-book-review.md`（9-e-c-b commit `235cdf7`）：
  - 補新欄位：`titleEn` / `authors[]`（4 子欄）/ `publishedYear` / `volume` / `volumeLabel`
  - 保留 legacy `book.author`（per Phase 9-e-a 決策 2）
  - 順手清 legacy 殘留：`type:` → `contentKind:` + 移除 body leading H1（屬 Phase 8-g-5 漏網清理補登；非 9-e-c-b 主軸）
  - 保留 `status: draft` + `draft: true`（不進 dist scan path）

### 3.4 magazine template 已新增

- `content/templates/blogger-magazine-review-template.md`（9-e-c-b commit `235cdf7`）：
  - 全新範本；52 行
  - `book.mediaType: "magazine"`（顯式宣告，per `docs/book-schema.md` §5.1）
  - 含 `book.issue` / `book.issn` 等雜誌專屬欄位
  - `book.authors[0].role: "editor"`（per 9-e-c-b Q5 決策）
  - 不包含 `book.isbn` / `book.volume` / `book.volumeLabel`（per `docs/book-schema.md` §5.2 magazine 不適用清單）

### 3.5 book review template 已 realign

- `content/templates/blogger-book-review-template.md`（9-e-c-c-b commit `f16e79e`）：
  - 修正語意錯位（原為未改寫之 GitHub tech-note 範本；屬 Phase 8-g-6 漏網之歷史債）：
    - `site` / `contentKind` / `primaryPlatform` / `category` / `tags` / `title` / `titleEn` / `slug` / `description` / `searchDescription` 全部對齊書評語境
    - 移除 `publishTargets.github`（只保留 `blogger.full`）
  - 新增 `book` block（含全欄位；mirror sample post 結構）
  - 新增 `affiliate` block（含 disclosure / position / links；mirror sample 結構）
  - body 改寫為「請在此撰寫書評內容。」（無 leading H1）

### 3.6 `validate-content.js` 已新增 7 條 warning-only rules

於 `src/scripts/validate-content.js` 落地，全部 warning-only / ready+published only / 共用 `book` 前置 guard：

| commit | 子批 | 規則數 | 規則 |
| --- | --- | --- | --- |
| `95437a3` | 9-e-d-b | 3 | `book-mediatype-invalid` / `book-issue-without-magazine-mediatype` / `book-issn-without-magazine-mediatype` |
| `4f37cbc` | 9-e-d-c | 4 | `book-volume-invalid-type` / `book-published-year-invalid-type` / `book-authors-invalid-role` / `book-authors-entry-empty` |

**合計 7 條 warning-only**。詳細規格詳見 `docs/book-schema.md` §11.2。

另新增 2 組 constants + 4 個 inline helpers（per 9-e-d-b Q2 決策；inline at `validate-content.js`，不抽 helper 模組）：

| 項目 | 落地批 | 用途 |
| --- | --- | --- |
| `VALID_BOOK_MEDIA_TYPE` (Set) | 9-e-d-b | mediaType 列舉值 |
| `VALID_BOOK_AUTHOR_ROLE` (Set) | 9-e-d-c | `authors[].role` 列舉值 |
| `isNonEmptyString(value)` | 9-e-d-b | non-empty trimmed string 守門 |
| `getBookMediaType(book)` | 9-e-d-b | effective mediaType（缺省 `"book"`）|
| `isIntegerOrNull(value)` | 9-e-d-c | integer / null 型別檢查 |
| `hasAnyAuthorName(authorEntry)` | 9-e-d-c | `authors[]` entry 名稱欄 OR 檢查 |

### 3.7 validation fixtures 已新增 7 檔

於 `content/validation-fixtures/blogger/posts/`（首次建立該目錄）落地（9-e-d-d-b commit `63aa497`）：

- `_test-book-mediatype-invalid.md`
- `_test-book-issue-without-magazine.md`
- `_test-book-issn-without-magazine.md`
- `_test-book-volume-invalid-type.md`
- `_test-book-published-year-invalid-type.md`
- `_test-book-authors-invalid-role.md`
- `_test-book-authors-entry-empty.md`

**每檔嚴格只觸發 1 條指定 warning**（per 9-e-d-d-b 回報 C 段對照表驗證）。詳細對應表詳見 `docs/book-schema.md` §11.3。

### 3.8 `docs/book-schema.md` §11 已記錄 validate rules / fixtures / baseline

- §11.1 範圍與性質
- §11.2 7 條規則完整清單（rule type / severity / 落地 commit / trigger condition）
- §11.3 7 個 fixture 對應規則表 + 「每檔嚴格只觸發 1 條」聲明
- §11.4 validate baseline 變動紀錄（`0/11/6 → 0/18/13`；明確標註「預期變動，非 regression」）
- §11.5 deferred rules（3 條 + 不落地理由）
- §11.6 helpers / constants inline 清單
- §11.7 不接 normalize-post-output / build pipeline 之邊界聲明

### 3.9 `docs/future-roadmap.md` 已同步 9-e-d landings

- §2 Phase 9 row 完整同步（9-e-d-e commit `a084bea`）：列入 9-e-* 全 8 個含 commit 子批 + 5 個純分析子批
- 本批（9-e-e）再次同步：標註 Phase 9-e 系列收尾 + cross-link 至本完成報告

---

## §4 validate baseline 變動

```
Phase 9-e 前（Phase 8-g-21-c 收尾後）：         0 error / 9 warning on 5 post(s)
9-e-d-d-b 前（Phase 9-e 中段）：                 0 error / 11 warning on 6 post(s)
9-e-d-d-b 收尾後（Phase 9-e 完整完成）：         0 error / 18 warning on 13 post(s)
```

| 階段 | error | warning | post 數 | 變動原因 |
| --- | --- | --- | --- | --- |
| Phase 9-e 前 | 0 | 9 | 5 | Phase 8-g 系列收尾後之 baseline |
| 9-e-d-d-b 前 | 0 | 11 | 6 | Phase 8-g-12-c `_test-series-title-unresolved` fixture 落地（+2 warnings / +1 post；非本系列）|
| **9-e-d-d-b 後** | **0** | **18** | **13** | **本系列 7 個 book schema validation fixtures 落地**（**+7 warnings / +7 posts**）|

**性質**：✅ **預期變動，非 regression**。

- 7 條新 warning 皆來自本期新增之 7 個 fixtures
- 每 fixture 嚴格只觸發 1 條指定 book warning
- 既有 6 篇 github fixture 之 11 條 warning 完全 byte-identical（per 9-e-d-d-b 驗證對照）
- mirror Phase 8-g-12-c / 8-g-2-d-e-c 之 fixture 落地推 baseline 之既有模式

---

## §5 dist baseline

✅ **Phase 9-e 全程 dist 維持不變**。

- 全 13 個子批 **未執行任何 build pipeline**（無 `npm run build:github` / `build:blogger` / `build:promotion` / `build:sitemap` / `build:blogger-theme`）
- `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` **全程 byte-identical**

### 5.1 為何 dist 不受影響

| 變動範疇 | 是否在 build scan path | 對 dist 影響 |
| --- | --- | --- |
| docs 變動（`docs/book-schema.md` / `docs/future-roadmap.md` / `docs/content-schema.md` / `CLAUDE.md` / 本完成報告）| ❌ 不在 | 0 |
| 模板變動（`content/templates/*.md`）| ❌ 不在 | 0 |
| draft sample post 變動（`content/blogger/posts/20260504-sample-book-review.md` 為 draft）| 🟡 在 source dir 但被 draft filter 過濾 | 0 |
| `validate-content.js` 新增規則 | ❌ validate 為純檢查工具；不寫入 dist | 0 |
| validation fixtures 新增（`content/validation-fixtures/blogger/posts/*`）| ❌ 不在（fixtures 排除）| 0 |

---

## §6 邊界聲明

### 6.1 7 條 book schema validate rules 之嚴格邊界

- **全部 warning-only**：嚴格 `severity: 'warning'`；無一條 error
- **不阻擋 build**：與 `build:github` / `build:blogger` / `build:promotion` pipeline 完全無關（validate-content 為獨立檢查工具）
- **不阻擋 validate exit code**：warning-only → `npm run validate:content` exit 0
- **不接 normalize-post-output**：純 validate 內部；不寫入 `normalized.*` 任何欄位
- **不接 build pipeline**：不被 build script 呼叫；不影響任何 build 輸出
- **不改前台輸出**：不接 EJS render 邏輯；不寫入任何 `dist*/`
- **不改 Blogger / GitHub render pipeline**：與 `src/scripts/build-*.js` / `src/views/**/*.ejs` 完全無接觸

### 6.2 與既有 series schema 之嚴格分離

per `docs/book-schema.md` §2.2 / §8.5：

- `series` 與 `book` 為兩個獨立維度
- 不可相互推導（`series.name` 與 `book.title` 可巧合相同但不可推導）
- 同一篇文章可同時擁有 `series` 與 `book`

### 6.3 不新建額外 source code / settings

- **不新建** `src/scripts/normalize-book-authors.js`（per 9-e-d-b Q2 決策）
- **不新建** `content/settings/books.json`（per 9-e-a 決策 4）
- helpers 全部 inline 於 `validate-content.js`（per 9-e-d-b Q2 決策）

---

## §7 deferred / 未落地項目

於 Phase 9-e-d-a 分析後評估**與 docs spec 衝突或誤觸風險高**，依 9-e-d-b Q1 決策不落地之 3 條 validate rules：

| 候選 rule | 不落地理由 |
| --- | --- |
| `book-isbn-with-magazine-mediatype` | `docs/book-schema.md` §4.9 明文「特殊雜誌情形除外」（bookazine / 特刊常見同時有 ISBN）；warning 會與 docs spec 之 carve-out 衝突 |
| `book-volume-label-empty-with-volume-number` | `docs/book-schema.md` §4.7 明文「兩欄獨立填寫；可單獨存在」；warning 會與 docs spec 直接衝突 |
| `book-author-and-authors-both-present` | `docs/book-schema.md` §6.2 之並存策略明確允許兩者共存（`authors[]` 勝出）；warning 會與 docs spec 直接衝突；Phase 9-e-a 決策 2 已明確「不標 deprecated、不警告」|

3 條保留於 `docs/book-schema.md` §9 future candidate 紀錄 + §11.5 deferred rules 詳述。**已評估但 Phase 9-e 不落地**；未來如政策調整可再評估。

---

## §8 後續可選方向（本批不啟動）

下列方向已識別但**本批 9-e-e 不啟動**；列入紀錄供未來 Phase 評估：

### 8.1 Phase 9-f（候選）

GitHub / Blogger output 使用 book metadata。可能範圍：

- 於 GitHub 站輸出 `Book` / `Periodical` / `Person` JSON-LD（per `docs/book-schema.md` §9 之 Structured data 候選）
- Blogger `meta.json` 補 book 欄位（如書名、ISBN）
- 書本卡片 EJS 元件（mirror 既有 post-card 模式）
- 雜誌特輯區塊

**觸發條件**：若實際需要將 book 資料導入前台 / SEO 結構化資料

### 8.2 Phase 9-g（候選）

更多 report / helper。可能範圍：

- `dist-reports/book-report.{txt,json}`（mirror Phase 8-g-17 series report 模式）
- 書評索引頁產出（依書名 / 作者 / mediaType 分組）
- `src/scripts/normalize-book-authors.js`（接 normalize-post-output 之 helper-first 模式）

**觸發條件**：若需要 book metadata 之 visibility / dump channel

### 8.3 Phase 8-h（候選）

sample / template cleanup vs source code fallback 退場。可能範圍：

- legacy `book.author` 退場（per `docs/book-schema.md` §6.5 之退場路徑紀錄）
- `contentKind ?? type` fallback 退場（per `docs/publish-bundle.md` §7.7）
- `parse-markdown.js` H1 → H2 自動降級退場
- AdSense 舊 boolean 退場

**觸發條件**：需先有正式遷移流程與工具；屬破壞性變更

### 8.4 Phase 8-g pause-state 維持不變

下列 Phase 8-g deferred / pending 項目**狀態未動**：

- **candidate 6**（first article `.fb.md` hashtags fallback）仍 ⏸ `nice-to-have / Phase 8-h+`（per `docs/phase-8g-completion-report.md` §3.14 / `docs/future-roadmap.md` §3 8-g-20-final）
- **Phase 8-g-1** fixture / sample end-to-end 驗證仍 ⏸ deferred（per `docs/future-roadmap.md` §4）
- **Phase 8-h** legacy fallback 退場仍 pending（per `docs/publish-bundle.md` §7.7）

Phase 9-e 系列**未碰**上述任何項目；保留原 pause-state。

---

（本文件結束）
