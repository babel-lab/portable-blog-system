# Phase 9-f-c Completion Report：Blogger manual posting helper 系列

本文件為 Phase 9-f 之 **9-f-c 子系列** 完整完成報告。涵蓋 Blogger 手動貼文輔助層之 book-review 支援（copy-helper [12] book metadata 區塊 + publish-checklist book-review / magazine 內容檢查區塊）。

**重要**：本報告為 **9-f-c 子系列收尾**，**不等於** Phase 9-f 整體收尾。Phase 9-f-e / 9-f-f / 9-f-g 仍 ⏸ 未啟動；Phase 9 overall 仍 🔄 進行中（per `docs/future-roadmap.md` §2 Phase 9 row 狀態）。

對應之上層紀錄：
- `docs/book-schema.md` §13 / §14（9-f-c-b / 9-f-c-c-b 之完整技術 spec）+ §14.9（既有 9-f-c 系列收尾摘要 + 6 子批 table）
- `docs/future-roadmap.md` §2 Phase 9 row（跨 phase 視角；含全部 commits 紀錄）

---

## §1 Phase 9-f-c 目標摘要

Phase 9-f-c 系列之目標為建立 **Blogger 手動貼文輔助層**之 book-review 支援，含以下 2 大成果：

1. **copy-helper [12] book metadata 區塊**：作者貼 Blogger 後台時直接對照 frontmatter book 欄位（純文字傾印）
2. **publish-checklist book-review / magazine 內容檢查區塊**：作者貼 Blogger 後逐項勾選確認（3 項 checkbox）

兩者皆屬 **manual-friendly diagnostic helpers**，**非** blocking validation / **非** customer-facing HTML render。

### 1.1 與 Phase 9-f-a 保守路線之關係

per `docs/future-roadmap.md` §5.2 排除原則 + Phase 9-f-a A.2 既有保守決策：

- ✅ **本系列已交付**：manual posting helpers（copy-helper + publish-checklist）為純文字輔助；對既有 ready post **byte-identical-modulo-builtAt**
- ⏸ **仍延後**：customer-facing HTML render（post.html / GitHub index.html / JSON-LD）→ 屬 Phase 9-f-e / 9-f-f / 9-f-g 候選；待有 ready book review post 後評估

---

## §2 子批列表

共 6 個子批；4 個含 commit + 2 個純分析：

| 子批 | 性質 | commit | subject |
| --- | --- | --- | --- |
| 9-f-c-a | 純分析 | — | copy-helper book section 前置分析 |
| 9-f-c-b | 含 commit | `fac693a` | `feat(phase-9): add book section to blogger copy-helper (9-f-c-b)` |
| 9-f-c-c-a | 純分析 | — | publish-checklist book items 前置分析 |
| 9-f-c-c-b | 含 commit | `f9e518a` | `feat(phase-9): add book-review section to publish-checklist (9-f-c-c-b)` |
| 9-f-c-d | 含 commit | `ff3367d` | `docs(phase-9): sync book-schema and roadmap with 9-f-c-b landing` |
| 9-f-c-e | 含 commit | `6449e88` | `docs(phase-9): sync book-schema and roadmap with 9-f-c-c-b landing` |

**累計**：4 commits + 2 pure analysis。

---

## §3 已完成成果

### 3.1 copy-helper [12] book metadata 區塊（9-f-c-b commit `fac693a`）

- **修改檔**：`src/views/blogger/blogger-copy-helper.ejs`（+74 行；既有 [1]-[11] 區塊完全不動）
- **完整規格**：詳見 `docs/book-schema.md` §13
- **特性**：
  - conditional show（per `post.book && typeof === 'object' && !isArray`）
  - mediaType-aware（book / magazine 顯示不同欄位組合；per book-schema §5.2）
  - **11 欄位**：mediaType / title / titleEn / originalTitle / authors / publisher / publishedYear / isbn / issn / issue / volume + volumeLabel
  - authors fallback chain inline 實作（per book-schema §7.1 之 5 步 fallback；displayName → localName → originalName → legacy book.author（i=0 only））
  - 全 EJS 標籤採 `-%>` trim-newline → byte-identical-modulo-builtAt
- **產出格式**：`dist-blogger/posts/{slug}/copy-helper.txt` 之 `[12] 書籍 / 內容來源 metadata（書評類文章參考）` 區塊（conditional）

### 3.2 publish-checklist book-review / magazine 區段（9-f-c-c-b commit `f9e518a`）

- **修改檔**：`src/views/blogger/blogger-publish-checklist.ejs`（+17 行；既有 5 區段完全不動）
- **完整規格**：詳見 `docs/book-schema.md` §14
- **特性**：
  - conditional show（per `post.book && typeof === 'object' && !isArray`）
  - **3 項 checkbox**：
    1. `[ ] 已對照 copy-helper [12] 書籍 / 內容來源 metadata，確認 frontmatter book 欄位正確`
    2. `[ ] 若有 book.coverImage / 書封圖，已確認圖片已上傳至外部空間，且 URL 可正常開啟`
    3. `[ ] 雜誌文章已確認 issue / ISSN / Blogger 標籤 / 標題期數標示正確`（內層 conditional `effectiveMediaType === 'magazine'`）
  - 全 EJS 標籤採 `-%>` trim-newline → byte-identical-modulo-builtAt
- **產出格式**：`dist-blogger/posts/{slug}/publish-checklist.txt` 之 `書籍 / 雜誌內容檢查（book-review 類）` 區塊（conditional）

### 3.3 docs sync §13 / §14（9-f-c-d / 9-f-c-e）

- **9-f-c-d** commit `ff3367d`：
  - `docs/book-schema.md` §13 新增（95 行；7 子節：範圍 / 落地 / 用途 / 輸出格式 / dual-channel / receipt / 邊界）
  - `docs/future-roadmap.md` Phase 9 row 同步 9-f-c-b landing
- **9-f-c-e** commit `6449e88`：
  - `docs/book-schema.md` §14 新增（125 行；9 子節：範圍 / 落地 / 3 項 checklist / 延後項目 / 設計原則 / receipt / quadruple-channel / 邊界 / 9-f-c 系列收尾摘要）
  - `docs/future-roadmap.md` Phase 9 row 同步 9-f-c-c-b landing + **9-f-c 系列收尾標註**

---

## §4 validate / dist baseline

### 4.1 validate baseline 不變

| 階段 | error | warning | post 數 |
| --- | --- | --- | --- |
| Phase 9-f-c 系列前後 | 0 | 18 | 13 |

✅ 理論維持 `0 error / 18 warning on 13 post(s)`（per `docs/book-schema.md` §13.6 + §14.6 之 receipts；本系列**未動** `src/scripts/validate-content.js` / fixtures）。

### 4.2 dist baseline byte-identical-modulo-builtAt

| 對象 | 狀態 |
| --- | --- |
| 既有 ready post 之 publish-checklist.txt | ✅ byte-identical-modulo-builtAt（per book-schema §14.6 receipt：1953 bytes / 49 CRLF；唯一差異為 `builtAt:` 時戳行）|
| 既有 ready post 之 copy-helper.txt | ✅ byte-identical-modulo-builtAt（per book-schema §13.6 receipt：3013 chars；除 builtAt 外結構完全相同）|
| 其他 dist-blogger 檔案（post.html / meta.json / build-manifest.json / index 頁）| ✅ 完全不受影響 |
| dist-blogger 本機 build 結果 | gitignored；不入 commit |

### 4.3 驗證證據 cross-link

- `docs/book-schema.md` §13.6（9-f-c-b commit `fac693a` 之 8 項 receipt）
- `docs/book-schema.md` §14.6（9-f-c-c-b commit `f9e518a` 之 10 項 receipt）

---

## §5 邊界聲明

### 5.1 與 quadruple-channel 視角

per `docs/book-schema.md` §14.7：

| 維度 | validate（§11）| report（§12）| copy-helper（§13）| publish-checklist（§14）|
| --- | --- | --- | --- | --- |
| 觸發 | `validate:content` | `report:book` | `build:blogger` | `build:blogger` |
| 範圍 status | ready + published | draft + ready + published | ready + published | ready + published |
| 影響 exit code | ✅ | ❌ | ❌ | ❌ |
| 新增 warning / error | ✅ 7 條 warning-only | ❌ | ❌ | ❌ |
| 接 build pipeline | ❌ | ❌ | ✅（既有；不擴張）| ✅（既有；不擴張）|
| 目標讀者 | release-gate 自動檢查 | 設計階段 visibility | 作者貼文時對照 | 作者貼文後逐項勾選 |

9-f-c 系列之 §13 / §14 為 quadruple-channel 中之**第 3 / 第 4 channel**。

### 5.2 邊界（7 項「不」）

本系列**不**做下列事項：

- ❌ **不**改 `src/scripts/build-blogger.js`（EJS 直接讀 `post.book`；既有 plumbing）
- ❌ **不**接 `src/scripts/normalize-post-output.js`（per book-schema §11.7 / §12.7 / §13.8 / §14.8 邊界 + Phase 9-f-a Q5）
- ❌ **不**改 Blogger HTML render template（post-full / -summary / -redirect-card / -home-index / -category-index）
- ❌ **不**接 FB promotion / sidecar（per book-schema §8.4 + `docs/promotion-export.md` §12）
- ❌ **不**接 JSON-LD / SEO structured data（per book-schema §9 deferred；屬 Phase 5 SEO 議題）
- ❌ **不**修改 content / settings
- ❌ **不**新建任何 helper 檔（inline JS within EJS templates）

### 5.3 ⚠️ 重要區分：「9-f-c 子系列收尾」**不等於**「Phase 9-f 整體收尾」

| 範疇 | 狀態 |
| --- | --- |
| ✅ **本系列（9-f-c）已收尾** | Blogger 手動貼文輔助層之 book-review 支援已完備 |
| ⏸ **Phase 9-f 整體仍 🔄 進行中** | Phase 9-f-e / 9-f-f / 9-f-g 仍未啟動 |
| 📌 **`docs/future-roadmap.md` §2 Phase 9 row** | 狀態欄維持 `🔄 進行中`（**本報告不改**；待 9-f 整體完成時另開批次處理）|

---

## §6 deferred / 未啟動項目

| Phase | 狀態 | 範圍 |
| --- | --- | --- |
| **Phase 9-f-e** | ⏸ 未啟動 | Blogger render book card：`blogger-post-full.ejs` book photo 區塊欄位擴充（含 authors[] / publishedYear / volume / issue 等 9-e 新欄位；目前僅用 title / publisher / coverImage / coverAlt 5 欄）|
| **Phase 9-f-f** | ⏸ 未啟動 | GitHub render book card：`src/views/pages/post-detail.ejs` + 可能新建 `book-card.ejs` partial + SCSS 配套 |
| **Phase 9-f-g** | ⏸ 未啟動 | JSON-LD Book / Periodical structured data：`src/views/seo/json-ld.ejs` 擴充或新 `json-ld-book.ejs` partial |
| **Phase 8-h** | ⏸ pending | legacy fallback 退場（含 legacy `book.author` / `contentKind ?? type` fallback / H1→H2 自動降級 / AdSense 舊 boolean 等；屬破壞性變更）|
| **Phase 8-g pause-state** | ⏸ 維持不變 | candidate 6 deferred / 8-g-1 fixture deferred / 8-h 退場 pending |

3 項 9-f-* 候選皆 per Phase 9-f-a A.2 保守路線**延後至有 ready book review post 後評估**。

---

## §7 後續可選方向（本報告不啟動）

下列方向已識別但**本報告不啟動**；列入紀錄供未來 Phase 評估：

### 7.1 Phase 9-f 後續實作候選（render 系列）

- **Phase 9-f-e** Blogger render book card：mirror 9-f-c-b 之 conditional + mediaType-aware 模式；需 SCSS 配套（`_book-photo.scss` 既有可擴充）+ byte-identical 驗證（對既有 ready post）
- **Phase 9-f-f** GitHub render book card：同上但跨更廣範圍；可能新建 `book-card.ejs` partial；需 RWD 驗證
- **Phase 9-f-g** JSON-LD Book / Periodical：schema.org 欄位映射（mediaType → `@type`）；屬 **Phase 5 SEO 整體議題**（per `docs/seo-ga4-adsense.md`）；不應在 9-f 單獨開做以免與 Phase 5 規劃衝突

### 7.2 Phase 9-f 整體 closure

待 9-f-e / 9-f-f / 9-f-g 皆完成後，可開啟新批次：

- 新建 `docs/phase-9f-completion-report.md`（9-f 整體 closure；mirror 9-e-e 模式）
- 更新 `docs/future-roadmap.md` §2 Phase 9 row 狀態 `🔄 → ✅`（同時 Phase 9 整體 closure；若無 9-g/9-h 等候選）

### 7.3 Phase 8-h legacy fallback retirement

per `docs/book-schema.md` §6.5 / §9 / §11.5：

- legacy `book.author` 退場（需先有遷移流程；屬 §6.5 退場路徑紀錄之未來 Phase 8-h+ 候選）
- `contentKind ?? type` fallback 退場（per `docs/publish-bundle.md` §7.7）
- `parse-markdown.js` H1 → H2 自動降級退場
- AdSense 舊 boolean 退場

屬破壞性變更；需更晚批次評估；本報告不啟動。

---

（本文件結束）
