# Z-01 future roadmap

## 1. 文件目的

本文件為跨 phase 路線總覽，紀錄各 phase 之推進狀態、最新決策摘要與下一步候選排程。

各 phase 之完整收尾紀錄請見對應 `docs/phase-8X-completion-report.md`；本文件僅承載「跨 phase 視角」與「下一步排程」。

---

## 2. Phase 8 系列進度總覽

| Phase | 範圍 | 狀態 | 收尾紀錄 |
|---|---|---|---|
| 8-a | 規範文件先行（sidecar bundle / fb / publish.json / migration schemas）| ✅ 完成 | 規格文件分散於 `docs/publish-bundle.md` / `docs/publish-json-schema.md` / `docs/fb-sidecar-schema.md` / `docs/migration-from-frontmatter.md` 等；無單一 completion report |
| 8-b | sidecar I/O 整合 + load-posts + contentKind 相容 + pages 路徑支援 | ✅ 完成 | `docs/phase-8b-completion-report.md`（commit `3a3ebab`）|
| 8-c | placeholder resolver（純函式 → validate → build-promotion 三層接入）| ✅ 完成 | `docs/phase-8c-completion-report.md`（commit `7960fbf`）|
| 8-d | normalized post output helper + load-posts 掛入 + GitHub / Blogger / promotion 漸進採用 normalized 優先 / legacy fallback 策略 | ✅ 完成 | `docs/phase-8d-completion-report.md`（commit `12919cf`）|
| 8-e | series metadata schema 規格化 + `.fb.md` `titleEn` 補強 + sample / template + validate warning-only 規則 + validation-fixtures | ✅ 完成 | `docs/phase-8e-completion-report.md`（commit `e5677dd`，含 fixture 驗證結果）|
| 8-f | series metadata 接入 build pipeline（series 設定層 / loader / `normalized.series` / `resolve-series-title.js` / Blogger copy-helper `[11]` / promotion manifest 4 個 additive 欄位 / `series.hashtags` inheritance backfill）| ✅ 完成 | `docs/phase-8f-completion-report.md`（commit `b1679d1`）|
| 8-g | Phase 8-f 後之候選分析與排程 | 🔄 進行中 | 詳見 §3 |

---

## 3. Phase 8-g 子批次進度與決策摘要

| 子批次 | 範圍 | 狀態 | 紀錄 |
|---|---|---|---|
| 8-g-0-a | 候選方向初步分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-0-b | 候選分析與 fixture 風險決策 | ✅ 完成 | `docs/phase-8g-candidate-analysis.md`（commit `77fb764`）|
| 8-g-0-c | roadmap 更新 | ✅ 完成 | 本文件（commit `a37d92e`）|
| 8-g-0-d | new-post.js series prompt 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-2-b1 | new-post.js template `type` → `contentKind` 修正 | ✅ 完成 | commit `fa7d825` |
| 8-g-2-b2 | new-post.js 加 series CLI flags（`--series-id` / `--series-number` / `--series-subtitle`）| ✅ 完成 | commit `bb58b2d` |
| 8-g-2-c-a | next series.number suggestion 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-2-c-b | `suggest-series-number.js` helper 落地（無 caller）| ✅ 完成 | commit `2262938` |
| 8-g-2-c-c | new-post.js 接入 stderr-only next number suggestion | ✅ 完成 | commit `2507748` |
| 8-g-2-c-d | new-post.js series suggestion docs 補強 | ✅ 完成 | commit `9826bd5` |
| 8-g-2-e | Phase 8-g-2（new-post.js prompt 系列）completion report | ✅ 完成 | `docs/phase-8g-2-completion-report.md`（commit `3c9b2e3`）|
| 8-g-2-d-a | validate series warning 規則讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-2-d-b | validate-content.js 加 `series-id-not-in-settings` warning | ✅ 完成 | commit `e70af85` |
| 8-g-2-d-c | validate-content.js 加 `series-block-missing-number` warning | ✅ 完成 | commit `bf58364` |
| 8-g-2-d-d | validate-content.js 加 `series-subtitle-without-id` warning | ✅ 完成 | commit `ca0381a` |
| 8-g-2-d-f | validate series rules docs 補強（本批）| 🔄 進行中 | 本文件 + `docs/phase-8g-candidate-analysis.md` + `docs/series-schema.md` |
| 8-g-1 | fixture / sample end-to-end 驗證 | ⏸ deferred | 詳見 §4 |

### 3.1 Phase 8-g-0-b 決策摘要

- **Phase 8-g 定位**：不應急著接 customer-facing 輸出（H1 / FB `.txt` 標題 / publish-checklist 顯示組合標題等）；候選應以「驗證 / 工具 / 報表 / docs」為主。
- **方案 E（fixture / sample end-to-end 驗證）**：屬「有價值但有部署風險之測試資產」；`content/{site}/posts/` 之 ready fixture 會被 build 掃到並進入 dist / sitemap / promotion；本系統無 noindex / staging dist 機制可隔離。
- **9 項候選**含狀態定義（`candidate` / `deferred` / `not recommended`）；完整清單見 `docs/phase-8g-candidate-analysis.md` §6。

### 3.2 Phase 8-g-2 落地摘要（new-post.js series prompt + next number suggestion）

- 候選 #2（`new-post.js` series 欄位提示）與候選 #3（series number gap filling）已於 Phase 8-g-2-b1 / b2 / c-b / c-c 共 4 commits 落地：
  - 8-g-2-b1：模板 `type` → `contentKind`（fix deprecated；commit `fa7d825`）
  - 8-g-2-b2：series CLI flags（`--series-id` / `--series-number` / `--series-subtitle`；commit `bb58b2d`）
  - 8-g-2-c-b：`suggest-series-number.js` 純函式 helper（無 caller；commit `2262938`）
  - 8-g-2-c-c：new-post.js 接入 stderr-only next series.number suggestion（commit `2507748`）
- **保守設計**：
  - series CLI flags 為手動輸入；無互動 prompt
  - next number suggestion 只輸出 stderr；stdout template 不自動寫入 suggested number
  - 使用者仍須自行加 `--series-number` 才寫入模板
  - 手動 `--series-number` 永遠優先；提供時不顯示自動建議
  - **完全不影響 dist / dist-blogger / dist-promotion baseline**
- 詳細落地紀錄與 CLI 範例：見 `docs/phase-8g-candidate-analysis.md` §10 與 `docs/series-schema.md` §20。

### 3.3 Phase 8-g-2-d 落地摘要（validate-content series warning 規則）

Phase 8-g-2-d 系列於 `src/scripts/validate-content.js` 加入 3 條 series 結構檢查 warning：

- 8-g-2-d-b：`series-id-not-in-settings`（commit `e70af85`）— s.id 為 valid non-empty string，但 `settings.series.series` 找不到對應 id
- 8-g-2-d-c：`series-block-missing-number`（commit `bf58364`）— s.id valid 但 `s.number === undefined`
- 8-g-2-d-d：`series-subtitle-without-id`（commit `ca0381a`）— `s.subtitle !== undefined` 但 `s.id === undefined`

與既有 Phase 8-e-5-b 之 4 條 series warning（`series-not-object` / `series-id-invalid` / `series-number-invalid` / `series-subtitle-invalid-type`）共組成 **7 條 series warning**。

- **皆 warning-only**：不升 error；不阻擋 build / `validate:content` exit code（warning-only → exit 0）
- **觸發範圍**：與既有 Phase 8-e-5-b series 規則一致（僅 ready / published；drafts / archived 由 `load-posts` 過濾不進）
- **不擴充 settings 載入路徑**：`settings.series` 已由 Phase 8-f-2-b plumbing 載入
- **不新增 fixture**：本系列未動 `content/validation-fixtures/`
- **baseline 不變**：維持 `0 error(s) / 9 warning(s) on 5 post(s)`
- **未落地候選**：`series-number-duplicate`（屬 Phase 8-g-2-d-e；需 ≥ 2 篇 same id same number 觸發樣本 + fixture 配套）；series report（`dist-reports/series.txt`）；Phase 8-g-2-d completion report（屬 8-g-2-d-g）
- 詳細落地紀錄與規則邊界：`docs/series-schema.md` §21 / `docs/phase-8g-candidate-analysis.md` §11

---

## 4. Phase 8-g-1 fixture / sample end-to-end 驗證（deferred）

### 4.1 暫不執行理由

1. ready fixture 會進入正式 dist / sitemap / promotion。
2. 若未來不小心部署，`_sample-` 內容可能對外可見。
3. 已完成 Phase 8-f completion report，目前不是非做 fixture 不可。
4. fixture end-to-end 驗證有價值，但應獨立排程，不能混在 Phase 8-g 起手批次直接做。

### 4.2 觸發條件

進入 Phase 8-g-1 前需滿足以下其一：

- 作者人工確認部署流程能隔離 `_sample-` 內容；或
- 在作者正式建立第一篇系列文章之前不執行；或
- 先設計 noindex / staging dist 機制再執行。

### 4.3 建議方案內容

完整方案內容（series.json entry / fixture post / `.publish.json` / `promotion.facebook.enabled` / 不搭配 `.fb.md` / 拆 2 commits / 部署把關）詳見 `docs/phase-8g-candidate-analysis.md` §5。

---

## 5. 下一步優先候選（「不影響 dist」為原則）

下一步進入實作之候選應符合「**不影響 dist / dist-blogger / dist-promotion baseline**」原則，避免引入部署風險。

### 5.1 推薦候選（皆為 `candidate` 狀態 + 不影響 dist）

| # | 候選 | 性質 | 影響 dist | 建議起手 |
|---|---|---|---|---|
| ~~A~~ | ~~`new-post.js` series 欄位提示分析~~ | ✅ 已於 Phase 8-g-2-b1 / b2 / c-b / c-c 落地（詳見 §3.2）| — | — |
| ~~B~~ | ~~validation / report 補強分析~~ ⚠️ **部分已落地** | validate 規則擴充 / 報表 | ❌ 不影響（已落地 3 條）| Phase 8-g-2-d-b / c / d 已落地 3 條 warning（詳見 §3.3）；剩餘 `series-number-duplicate` 候選需 fixture 配套；series report（`dist-reports/series.txt`）仍 candidate |
| C | docs consistency / cross-link 補強 | 純文件 | ❌ 不影響 | 先盤點哪些既有 docs 缺 cross-link（如 `phase-8b/c/d/e/f-completion-report.md` 之相互 cross-link 是否完整）|
| D | Phase 8-g-2 completion report（new-post.js 系列收尾報告）| 純文件 | ❌ 不影響 | 整合 8-g-2-b1 / b2 / c-b / c-c 之完整紀錄、4 個 commit 與保守設計依據 |

### 5.2 排除原則

以下方向不在本階段優先：

- ❌ **customer-facing 輸出接入**（H1 接 series titleTemplate / FB `.txt` 顯示 titleEn / publish-checklist 顯示組合標題等）— 屬 `not recommended` 狀態，per Phase 8-f-5-c §17.3 / 8-f-6-a 既有保守決策。
- ❌ **fixture 落地**（方案 E / Phase 8-g-1）— 屬 `deferred`，詳見 §4。
- ❌ **相容層退場**（legacy frontmatter fallback / `type` legacy 退場等）— 屬未來 Phase 8-h 或更晚；需先有正式 sidecar 遷移流程與工具。

### 5.3 起手批次節奏建議

每個候選首批應為**純讀取分析 + docs**，不直接修改 JS / EJS / settings；確認方向後再進入實作批次。

---

## 6. 第二階段暫緩功能

登入後台、Blogger API、自動社群發文、全文搜尋、View 數與 Like 屬於第二階段暫緩功能。

詳細暫緩清單請見 `CLAUDE.md` §29「第一版不做清單」。

---

## 7. 相關文件

### 7.1 Phase 8 收尾紀錄

- `docs/phase-8b-completion-report.md`
- `docs/phase-8c-completion-report.md`
- `docs/phase-8d-completion-report.md`
- `docs/phase-8e-completion-report.md`
- `docs/phase-8f-completion-report.md`

### 7.2 Phase 8-g 紀錄

- `docs/phase-8g-candidate-analysis.md`（Phase 8-g-0-b 候選分析與 fixture 風險決策）

### 7.3 規格與設計文件

- `docs/series-schema.md` §15-§19（Phase 8-f 各子批次落地紀錄）
- `docs/promotion-export.md` §10（promotion manifest 4 個 additive 欄位）
- `docs/fb-sidecar-schema.md` §12.3.1（Blogger tags / FB hashtags 格式分離）
- `docs/publish-bundle.md` / `docs/publish-json-schema.md`（sidecar bundle / publish.json schema）
- `docs/migration-from-frontmatter.md`（既有 frontmatter 遷移指南）

### 7.4 專案規範

- `CLAUDE.md`（專案開發規範與分階段計畫）
