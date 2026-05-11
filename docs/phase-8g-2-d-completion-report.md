# Phase 8-g-2-d Completion Report — validate-content series warning rules

> 批次系列：Phase 8-g-2-d-a / 8-g-2-d-b / 8-g-2-d-c / 8-g-2-d-d / 8-g-2-d-f / 8-g-2-d-e-a / 8-g-2-d-e-b / 8-g-2-d-e-c / 8-g-2-d-g（本報告）
> 範圍：`src/scripts/validate-content.js` series 結構檢查 warning 規則擴充 + 對應 validation-fixtures 觸發樣本 + docs 同步補強
> 起點 HEAD：`94ca4c6`（Phase 8-g-2-d-f docs 補強收尾）
> 終點 HEAD：`f97cded`（Phase 8-g-2-d-e-c fixtures 收尾）
> 完整 commits：6（4 規則 + 1 docs 補強 + 1 fixture；3 個讀取分析批次無 commit）
> `dist` / `dist-blogger` / `dist-promotion` baseline：**byte-identical**（validate-content 不參與 build pipeline）
> `npm run validate:content` baseline：**`0 error / 9 warning on 5 post(s)` → `0 error / 13 warning on 7 post(s)`**（fixture 落地之預期變動）

---

## §1 本階段目的

Phase 8-g-2-d 之核心目的為**補完 series metadata 之 validate-content 規則覆蓋**，與既有 Phase 8-e-5-b 之 4 條 series 結構規則銜接：

1. **`series-id-not-in-settings`**（8-g-2-d-b）：偵測作者誤打 id 或漏建 `content/settings/series.json` entry
2. **`series-block-missing-number`**（8-g-2-d-c）：偵測 `series:` 區塊只填 id 未填 number（per `docs/series-schema.md` §2.1 之必填規範）
3. **`series-subtitle-without-id`**（8-g-2-d-d）：偵測 subtitle 出現但無 series.id 之語意斷裂
4. **`series-number-duplicate`**（8-g-2-d-e-b）：偵測同系列下 series.number 重號（per `docs/series-schema.md` §5.3）

並透過 2 個 validation-fixtures（8-g-2-d-e-c）為 `series-number-duplicate` 規則提供觸發樣本，**驗證規則邏輯正確且每篇衝突文章各自 push 一條 warning**（與既有 `duplicate-slug` cross-post pattern 一致）。

設計原則：

- **皆為 warning-only**：不升 error；不阻擋 build / `validate:content` exit code
- **觸發範圍**：與既有 Phase 8-e-5-b series 規則一致（僅 ready / published；drafts / archived 由 `load-posts` 過濾不進）
- **無 dist 影響**：validate-content 不參與 build pipeline；fixtures 位於 `content/validation-fixtures/`，不被 `build:*` 掃到
- **無 settings 載入路徑擴充**：`settings.series` 已由 Phase 8-f-2-b plumbing 載入並傳入 `validateContent`
- **保守邊界**：規則互斥 / 共存皆明確設計，避免雙重觸發污染 baseline

---

## §2 Commit 摘要

### 2.1 落地 commits（6 個）

| 子批次 | Commit | 類型 | 摘要 |
| --- | --- | --- | --- |
| 8-g-2-d-b | `e70af85` | `feat` | add series-id-not-in-settings warning to validate-content |
| 8-g-2-d-c | `bf58364` | `feat` | add series-block-missing-number warning to validate-content |
| 8-g-2-d-d | `ca0381a` | `feat` | add series-subtitle-without-id warning to validate-content |
| 8-g-2-d-f | `94ca4c6` | `docs` | record validate-content series rule landings |
| 8-g-2-d-e-b | `89bbbd0` | `feat` | add series-number-duplicate warning to validate-content |
| 8-g-2-d-e-c | `f97cded` | `test` | add series-number-duplicate validation fixtures |

### 2.2 讀取分析批次（無 commit；對話內留下紀錄）

- 8-g-2-d-a：validate series warning 規則讀取分析（6 條候選評估表 + 拆批建議）
- 8-g-2-d-e-a：series-number-duplicate warning + fixture 讀取分析（規則定義 / 實作位置 / warning message / fixture / baseline 影響 / 風險評估）
- 8-g-2-d-g：本報告撰寫批次

---

## §3 功能完成摘要

### 3.1 series validate warning 全表（8 條）

Phase 8-g-2-d 完成後，validate-content 之 series 相關 warning 共 **8 條**：

| 來源 | Rule key | 觸發條件 |
| --- | --- | --- |
| Phase 8-e-5-b | `series-not-object` | `post.series` 非 plain object（string / array / number / boolean / null）|
| Phase 8-e-5-b | `series-id-invalid` | `s.id` 為空字串或非 string |
| Phase 8-e-5-b | `series-number-invalid` | `s.number` defined 但非正整數 |
| Phase 8-e-5-b | `series-subtitle-invalid-type` | `s.subtitle` defined 但非 string |
| **Phase 8-g-2-d-b** | **`series-id-not-in-settings`** | `s.id` valid 但 `settings.series.series` 找不到對應 id |
| **Phase 8-g-2-d-c** | **`series-block-missing-number`** | `s.id` valid 但 `s.number === undefined` |
| **Phase 8-g-2-d-d** | **`series-subtitle-without-id`** | `s.subtitle !== undefined` 且 `s.id === undefined` |
| **Phase 8-g-2-d-e-b** | **`series-number-duplicate`** | 同 `series.id` 下 ≥ 2 篇 ready/published posts 共用 `series.number` |

### 3.2 新增 4 條規則摘要

#### `series-id-not-in-settings`（8-g-2-d-b；commit `e70af85`）

- **觸發**：作者誤打 id 或漏建 settings entry（`settings.series.series` 為空 / 無對應 entry）
- **Message**：`"<id>" not found in content/settings/series.json (add entry or check for typo)`
- **互斥邊界**：與 `series-id-invalid` 互斥（前者要求 id 非 valid；後者要求 id 已通過 valid 檢查）
- **位置**：插入於 `series-id-invalid` 之 `else` 分支內

#### `series-block-missing-number`（8-g-2-d-c；commit `bf58364`）

- **觸發**：作者填了 id 但忘填 number；per `docs/series-schema.md` §2.1，series 區塊存在時 number 為必填
- **Message**：`series.id="<id>"; series.number is required when series.id is set (use new-post.js --series-number to specify)`
- **互斥邊界**：與 `series-number-invalid` 互斥（前者 `s.number === undefined`；後者 `s.number !== undefined` 但 invalid）
- **位置**：緊接 `series-id-not-in-settings` 之後；同位於 `series-id-invalid` 之 `else` 分支

#### `series-subtitle-without-id`（8-g-2-d-d；commit `ca0381a`）

- **觸發**：作者填了 subtitle 但忘填 id（孤兒 subtitle）
- **Message**：`subtitle exists but series.id is missing (series.subtitle must be paired with series.id)`
- **共存邊界**：與 `series-subtitle-invalid-type` **可共存**（subtitle 為非 string 且 id 缺漏時兩條同時觸發）；屬刻意設計，前者檢查結構配對，後者檢查型別
- **位置**：緊接 `series-subtitle-invalid-type` 之後；同位於 `series-not-object` 之 `else` 分支

#### `series-number-duplicate`（8-g-2-d-e-b；commit `89bbbd0`）

- **觸發**：跨文章 cross-post 檢查；同 series.id 下 ≥ 2 篇 ready/published posts 共用 series.number
- **Message**：`series.id="<id>", series.number=<n>`
- **行為**：沿用 `duplicate-slug` cross-post pattern，每篇衝突文章各自 push 一條 warning
- **前置守門**：6 條 `continue`（series 非 plain object / id 非 valid string / number 非 valid positive integer 等）；invalid / missing cases 交給對應既有規則
- **與 series-id-not-in-settings 之關係**：可共存（兩者為獨立面向 warning）
- **位置**：validateContent 函式結尾前，緊接既有 `duplicate-slug` cross-post block 之後

---

## §4 驗證實況 / baseline 變化

### 4.1 baseline 時間軸

| 階段 | HEAD | baseline | 變動 |
| --- | --- | --- | --- |
| 8-g-2-d-b 落地前 | `94ca4c6` | `0 error / 9 warning on 5 post(s)` | — |
| 8-g-2-d-b 落地後 | `e70af85` | `0 error / 9 warning on 5 post(s)` | 不變（無觸發樣本）|
| 8-g-2-d-c 落地後 | `bf58364` | `0 error / 9 warning on 5 post(s)` | 不變 |
| 8-g-2-d-d 落地後 | `ca0381a` | `0 error / 9 warning on 5 post(s)` | 不變 |
| 8-g-2-d-f 落地後 | `94ca4c6` | `0 error / 9 warning on 5 post(s)` | 不變（純 docs）|
| 8-g-2-d-e-b 落地後 | `89bbbd0` | `0 error / 9 warning on 5 post(s)` | 不變（無觸發樣本）|
| **8-g-2-d-e-c 落地後** | `f97cded` | **`0 error / 13 warning on 7 post(s)`** | **+4 warning / +2 post（預期變動）** |

### 4.2 baseline 變動明細（HEAD `89bbbd0` → `f97cded`）

**+4 warning 來源**（每篇 fixture 各觸發 2 條）：

| 來源檔案 | Warning 1 | Warning 2 |
| --- | --- | --- |
| `_test-series-dup-a.md` | `series-id-not-in-settings` | `series-number-duplicate` |
| `_test-series-dup-b.md` | `series-id-not-in-settings` | `series-number-duplicate` |

合計：**2 條 series-id-not-in-settings + 2 條 series-number-duplicate**。

### 4.3 baseline 變動為**預期結果，非 regression**

理由：

1. fixture 設計刻意觸發新規則（per 8-g-2-d-e-c batch spec）
2. series.id `_test-series-dup` 不在 `settings.series.series` 中 → `series-id-not-in-settings` 必觸發（預期）
3. 兩篇 fixture 共用 series.id + series.number → `series-number-duplicate` 必觸發（預期）
4. 兩條 warning 屬獨立面向之設計（per §7.4 / `docs/series-schema.md` §21.3）；刻意共存
5. fixture 之 frontmatter（contentKind / category / tags / cover / description / body）皆完整，未觸發其他 noise warning

---

## §5 fixture 說明

### 5.1 fixture 檔案

- `content/validation-fixtures/github/posts/_test-series-dup-a.md`（21 行；commit `f97cded`）
- `content/validation-fixtures/github/posts/_test-series-dup-b.md`（21 行；commit `f97cded`）

兩篇皆為 `status: ready` 之 markdown post，含完整 frontmatter（title / slug / status / date / contentKind / category / tags / cover / description / series）+ 解說 body。

### 5.2 設計關鍵

| 設計點 | 內容 | 理由 |
| --- | --- | --- |
| 兩篇 slug **不同** | `test-series-dup-a` / `test-series-dup-b` | 避免被 `duplicate-slug` error 攔下；error 會擋 baseline 比對 |
| 兩篇 `series.id` + `series.number` **相同** | `_test-series-dup` / `1` | 觸發 `series-number-duplicate` |
| **不**將 `_test-series-dup` 加入 `content/settings/series.json` | settings.series 維持 `{"series":[]}` | 避免污染作者實際 series namespace；接受 `series-id-not-in-settings` 與 `series-number-duplicate` 共存 |
| 放置於 `content/validation-fixtures/` | 沿用 Phase 8-e-6-b 既有 fixture 路徑 | 不被 `build:*` 掃到；不進 dist / sitemap / promotion |
| 完整 frontmatter | category / tags / cover / description 皆填妥；契合既有 fixtures 命名 | 避免 unknown-category / empty-tags / missing-cover 等 noise warning |
| body 不以 `#` 開頭 | 純文字解說 + cross-link 至 series-schema §21.3 | 避免 `body-leading-h1` warning |

---

## §6 對 validate / build / dist 之影響

| 影響面 | 變動？ | 說明 |
| --- | --- | --- |
| `npm run validate:content` baseline | ⚠️ **預期變動** | `0/9/5` → `0/13/7`（per §4）|
| `npm run build:github` 輸出 | ❌ 不變 | fixtures 在 `content/validation-fixtures/`，不被掃到；validate-content 不在 build pipeline |
| `npm run build:blogger` 輸出 | ❌ 不變 | 同上 |
| `npm run build:promotion` 輸出 | ❌ 不變 | 同上 |
| `dist` / `dist-blogger` / `dist-promotion` baseline | ❌ 不變 | 本系列**未執行** build；無 build output 變動 |
| `package.json` | ❌ 不變 | 無新增 npm script；無新增相依 |
| `content/settings/*` | ❌ 不變 | 含 `series.json` 維持 `{"series":[]}` |
| 正式 `content/{blogger,github}/posts/*` | ❌ 不變 | 無 series 區塊；不觸發新規則 |
| 既有 `_test-series-not-object.md` / `_test-series-validation.md` / `_test-fb-titleEn.md` | ❌ 不變 | 皆被既有規則攔下；不進新規則路徑 |

---

## §7 邊界與設計原則

### 7.1 warning-only，不升 error

per `docs/series-schema.md` §5.3 + Phase 8-g-2-d 系列保守路線；不阻擋 build / `validate:content` exit code。即便 `series-number-duplicate` 為跨文章規則，亦維持 warning-only（不升 error），與既有 `duplicate-slug`（error）形成對比設計：slug 重號為硬規則錯誤（會擋 URL routing）；series.number 重號屬作者編號規劃可接受之軟提示。

### 7.2 ready / published only，沿用 loadPosts

`load-posts.js` `classify()` 既有過濾 draft + non-visible status；本系列 4 條新規則 + 既有 4 條 series 規則皆沿用此範圍。**未擴充 `load-posts.js`**；drafts / archived 不進 validateContent。

⚠️ 注意 series-schema §5.2 對 new-post.js suggest 邏輯規定「所有 status 納入已用編號」（含 drafts）；validate-content 之 cross-post duplicate 屬「告警」而非「編號統計」，兩者目的不同；分歧保留，per 8-g-2-d-e-a §A.4 之決策。

### 7.3 id invalid / number invalid / missing cases 交給既有規則

| invalid case | 由哪條規則處理 |
| --- | --- |
| series 非 plain object | `series-not-object`（既有）|
| s.id 為空字串 / 非 string | `series-id-invalid`（既有）|
| s.id missing（undefined）| 若 subtitle 存在 → `series-subtitle-without-id`（本系列；8-g-2-d-d）|
| s.number defined 但非正整數 | `series-number-invalid`（既有）|
| s.number missing（undefined）| `series-block-missing-number`（本系列；8-g-2-d-c）|
| s.subtitle defined 但非 string | `series-subtitle-invalid-type`（既有）|

→ 新規則之前置守門明確排除上述 cases，避免重複觸發；屬保守邊界設計。

### 7.4 series-id-not-in-settings 與 series-number-duplicate 可共存

兩者為**獨立面向**之 warning：

- `series-id-not-in-settings`：作者 settings 配置問題（series.json 缺 entry）
- `series-number-duplicate`：作者文章編號規劃問題（兩篇文章同 id 同 number）

per `docs/series-schema.md` §21.3，兩條設計上不互斥；fixture 同時觸發兩者屬預期。

### 7.5 duplicate warning 每篇衝突文章各自 warning

沿用既有 `duplicate-slug` cross-post pattern（validate-content.js L532-547）：

- 第一遍：逐 post 收集 `(id, number)` key → `seriesNumberMap`
- 第二遍：對每個 key 之 entries length ≥ 2，**每篇衝突文章各自 push 一條 warning**

理由：

- 與既有 codebase pattern 一致；維護成本低
- actionable：作者打開 validate output 時每篇衝突檔案皆能看到提示
- 公平：不依「第幾篇進掃描」決定觸發

---

## §8 尚未處理 / deferred 候選

### 8.1 Phase 8-g-1：fixture / sample end-to-end 驗證（仍 deferred）

per `docs/phase-8g-candidate-analysis.md` §5：屬「ready fixture 進正式 `content/{site}/posts/`，會進 dist / sitemap / promotion」；本系統第一版無 noindex / staging dist 機制可隔離；觸發條件未滿足。**本批不變動此狀態**。

### 8.2 series report（`dist-reports/series.txt`）— future candidate

per `docs/phase-8g-candidate-analysis.md` §6 候選 #1 之 series report 部分：屬「validate / report 補強」之延伸，與 `series-number-duplicate` 配套之報表形式。**本系列未實作**；**未來可獨立批次評估**。

### 8.3 將 `_test-series-dup` 加入 `content/settings/series.json`（不採用）

技術上可消除兩條 `series-id-not-in-settings` warning，但會**污染作者實際 series namespace**；保守決策維持 `settings.series` 為空，接受 fixture 觸發兩條 warning 共存（per §5.2 設計）。

### 8.4 其他 series 規則候選（future candidate）

- 升級任一 series warning 為 error：違反 Phase 8-g-2-d 系列 warning-only 保守路線；不建議
- 跨 status 之 duplicate 檢查（含 drafts）：需擴充 `load-posts.js`；與既有 series 規則範圍分歧；未來批次評估
- `titleTemplate unresolved` 升級為 user-visible warning（per `docs/series-schema.md` §15.4.2）：屬 Phase 8-f-7 之 helper-internal warnings 升級候選；獨立批次評估

---

## §9 Cross-links

### 9.1 Phase 8-g 系列文件

- `docs/future-roadmap.md` §3 子批次表 / §3.3 Phase 8-g-2-d 落地摘要
- `docs/phase-8g-candidate-analysis.md` §6 候選 #1（`partially landed`）/ §11（Phase 8-g-2-d 落地紀錄）
- `docs/phase-8g-2-completion-report.md`（Phase 8-g-2 new-post.js prompt 系列；scope **不含** 8-g-2-d）

### 9.2 規格與設計文件

- `docs/series-schema.md` §5（series.number auto-suggest 規格）/ §21（Phase 8-g-2-d validate-content series 規則接入實況）

### 9.3 落地檔案

- `src/scripts/validate-content.js`（4 條新規則；commits e70af85 / bf58364 / ca0381a / 89bbbd0）
- `content/validation-fixtures/github/posts/_test-series-dup-a.md`（commit `f97cded`）
- `content/validation-fixtures/github/posts/_test-series-dup-b.md`（commit `f97cded`）

### 9.4 既有 Phase 收尾紀錄（背景）

- `docs/phase-8e-completion-report.md`（Phase 8-e series metadata schema；既有 4 條 series 規則來源）
- `docs/phase-8f-completion-report.md`（Phase 8-f series build pipeline 接入；本階段前置）

---

（本文件結束）
