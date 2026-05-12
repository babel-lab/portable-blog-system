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
| 8-g-2-d-f | validate series rules docs 補強 | ✅ 完成 | commit `94ca4c6` |
| 8-g-2-d-e-a | `series-number-duplicate` warning + fixture 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-2-d-e-b | `validate-content.js` 加 `series-number-duplicate` warning | ✅ 完成 | commit `89bbbd0` |
| 8-g-2-d-e-c | `series-number-duplicate` validation fixtures（2 篇）| ✅ 完成 | commit `f97cded` |
| 8-g-2-d-g | Phase 8-g-2-d completion report | ✅ 完成 | commit `c29f63b`；`docs/phase-8g-2-d-completion-report.md`（含 `docs/future-roadmap.md` / `docs/phase-8g-candidate-analysis.md` / `docs/series-schema.md` 同步）|
| 8-g-3 | Phase 8-g overall completion report 初版 | ✅ 完成 | commit `c3b6c63`；`docs/phase-8g-completion-report.md`（初版）+ 本文件（§3 / §7.2 同步）|
| 8-g-4-a | 候選 C docs cross-link 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-4-b | 候選 C §5.1 必要補強（schema docs → phase reports cross-link）| ✅ 完成 | commit `4730152`；`phase-8d-completion-report.md` + `publish-bundle.md` §8.1 + `publish-json-schema.md` §12（3 檔 +32 行）|
| 8-g-4-c | 候選 C §5.2 可選後向 link（phase-8b ~ 8-f）| ✅ 完成 | commit `ddae181`；5 檔各補 1 行（+10 行）；§5.2.6 `fb-sidecar-schema.md` 依保守決策未補 |
| 8-g-4-d | Phase 8-g overall completion report 更新（含候選 C landings）| ✅ 完成 | commit `eec8ff7`；`docs/phase-8g-completion-report.md`（補入 §3.5 candidate C 落地紀錄 + §5 / §6 / §7 對應更新）|
| 8-g-4-e | Phase 8-g-4 候選 C 落地後之 roadmap 同步 | ✅ 完成 | commit `5d38d46`；本文件（§3 表格 + §3.4 新增 + §5.1 + §7.2 同步）|
| 8-g-5-a | sample post H1 + deprecated type 對齊讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-5-b | sample post H1 + deprecated type 對齊實作（2 篇 github sample posts）| ✅ 完成 | commit `44c0e8f`；`20260504-github-pages-blog-planning.md` + `20260504-portable-blog-system-mvp.md`（2 檔 +2 / −6）；validate baseline 從 `0/13/7` 收斂回 `0/9/5` |
| 8-g-6-a | content/templates 對齊讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-6-b | content/templates 對齊實作（5 個 markdown post templates）| ✅ 完成 | commit `5976162`；`post-template.md` + `github-tech-note-template.md` + `blogger-book-review-template.md` + `blogger-download-template.md` + `blogger-summary-template.md`（5 檔 +5 / −15）；validate baseline 維持 `0/9/5` |
| 8-g-7 | future-roadmap 同步 sample/template 對齊收尾（本批）| 🔄 進行中 | 本文件（§3 表格 + §3.5 新增 + §5.1 + §7.2 同步）|
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
- **baseline 變動（預期）**：`0 error / 9 warning on 5 post(s)` → **`0 error / 13 warning on 7 post(s)`**（Phase 8-g-2-d-e-c 新增 2 個 validation-fixtures 觸發 +4 warning：2× `series-id-not-in-settings` + 2× `series-number-duplicate`）；4 條規則本身落地時 baseline 不變，僅 fixture 落地才觸發
- **未落地候選**：series report（`dist-reports/series.txt`）仍 candidate（屬 future batch）；其他 series 規則（升級 error / 跨 status duplicate / titleTemplate unresolved 升級 user-visible）皆 future candidate
- 詳細落地紀錄與規則邊界：`docs/phase-8g-2-d-completion-report.md`（完整收尾報告）/ `docs/series-schema.md` §21 / `docs/phase-8g-candidate-analysis.md` §11

### 3.4 Phase 8-g-4 落地摘要（候選 C docs cross-link 補強）

Phase 8-g-4 系列補完 docs cross-link 缺口（per `docs/phase-8g-candidate-analysis.md` §6 候選 C / `docs/phase-8g-completion-report.md` §3.5）：

- 8-g-4-a：候選 C 讀取分析（對話內；無 commit）— 識別 G1~G5 缺口、§5.1 必要 / §5.2 可選 / §5.3 不建議補強之三段式分級
- 8-g-4-b：§5.1 必要補強（commit `4730152`）— 修補 schema docs → phase reports cross-link：`phase-8d-completion-report.md` 開頭引用區補前向 link + `publish-bundle.md` §8.1 新節 + `publish-json-schema.md` §12 新節（3 檔 +32 行）
- 8-g-4-c：§5.2 可選後向 link（commit `ddae181`）— 5 份 phase 報告各補 1 行後向 prose link：`phase-8b/c/d/e/f-completion-report.md` 末段（5 檔 +10 行）
- 8-g-4-d：Phase 8-g overall completion report 更新（commit `eec8ff7`）— `docs/phase-8g-completion-report.md` 補入 §3.5 candidate C 落地紀錄與 §5 / §6 / §7 對應更新；reflect 候選 C 已 landed

**保守決策保留**：

- §5.2.6（`fb-sidecar-schema.md`）依「不過度 cross-link」原則未補；屬可選 future candidate
- 不修正 `publish-bundle.md` §7.5 / §7.6 / §7.7 過時描述（屬規格內容更新而非 cross-link 補強；列為 future candidate）

**對 dist / build / validate 影響**：純 docs；不接 build pipeline；`npm run validate:content` baseline 維持 `0 error / 13 warning on 7 post(s)`；`dist*` 全程 byte-identical。

詳細落地紀錄詳見 `docs/phase-8g-completion-report.md` §3.5。

### 3.5 Phase 8-g-5 / 8-g-6 落地摘要（sample post + template 對齊）

Phase 8-g-5 + Phase 8-g-6 補完 sample / template 來源層之 deprecated `type` 與 body leading H1 cleanup（per `docs/phase-8g-completion-report.md` §5.2 之 sample 對齊候選與 Phase 8-g-6 讀取分析）：

- **Phase 8-g-5（sample posts 對齊；commit `44c0e8f`）**：對齊 2 篇正式 ready sample post：
  - `content/github/posts/20260504-github-pages-blog-planning.md`
  - `content/github/posts/20260504-portable-blog-system-mvp.md`
  - 每篇兩處變更：`type: "tech-note"` → `contentKind: "tech-note"`（不保留 legacy `type`）；body 開頭 `# 文章標題` 移除（含尾隨空白行）
  - **validate baseline 變化**：`0 error / 13 warning on 7 post(s)` → **`0 error / 9 warning on 5 post(s)`**（−4 warnings / −2 posts；兩篇 sample 之 `body-leading-h1` + `frontmatter-uses-deprecated-type` 共 4 條消除；剩餘 9 warnings 全為 5 篇 validation fixtures）

- **Phase 8-g-6（content/templates 對齊；commit `5976162`）**：對齊 5 個 markdown post 範本：
  - `content/templates/post-template.md`
  - `content/templates/github-tech-note-template.md`
  - `content/templates/blogger-book-review-template.md`
  - `content/templates/blogger-download-template.md`
  - `content/templates/blogger-summary-template.md`
  - 每檔同樣兩處變更：`type` → `contentKind` + 移除 body `# 文章標題` placeholder
  - **validate baseline 維持** `0 error / 9 warning on 5 post(s)`（templates 不在 validate scan path）
  - 範圍排除：`_sample-series-post.md`（已現代化）/ `_sample.fb.md`（FB sidecar schema）/ `*.publish.json`（JSON schema）

**對 dist / build / validate 之影響**：

- Phase 8-g-5：兩篇 sample post 改變 source；dist 變動限於 `dist/posts/{slug}/index.html` 各少一個 `<h2>` 重複 title 行（per `parse-markdown.js` 既有 H1 → H2 自動降級邏輯）；其他 dist 產物 byte-identical
- Phase 8-g-6：純 docs/templates；不被 `build:*` 掃到；dist 完全不變

**保守決策保留**：本對齊只清理 **sample / template 來源層**，**不等同 source code 層 legacy fallback 退場**：

- `src/scripts/load-posts.js` 之 `contentKind ?? type` fallback **仍存在**
- `src/scripts/validate-content.js` 之 `frontmatter-uses-deprecated-type` warning 規則**仍存在**
- `src/scripts/parse-markdown.js` 之 body H1 → H2 自動降級**仍存在**
- 上述 source code 層之相容層退場屬 Phase 8-h 或更晚（per §5.2「相容層退場」之既有立場）

`new-post.js` 之 inline TEMPLATE 已於 Phase 8-g-2-b1（commit `fa7d825`）對齊 `contentKind`；與本批之 `content/templates/*.md` 範本獨立。

詳細落地紀錄詳見 commits `44c0e8f` / `5976162` 之 message 與本文件 §3 表格之 8-g-5 / 8-g-6 列；overall completion report 之 §5 / §6 同步待 Phase 8-g-8（後續可選批次）。

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
| ~~C~~ | ~~docs consistency / cross-link 補強~~ | ✅ 已於 Phase 8-g-4 系列落地（commits `4730152` + `ddae181` + `eec8ff7`；§5.2.6 `fb-sidecar-schema.md` 未補；詳見 §3.4）| — | — |
| D | Phase 8-g-2 completion report（new-post.js 系列收尾報告）| 純文件 | ❌ 不影響 | 整合 8-g-2-b1 / b2 / c-b / c-c 之完整紀錄、4 個 commit 與保守設計依據 |
| ~~E~~ | ~~sample / template 對齊（deprecated `type` + body leading H1 cleanup）~~ | ✅ 已於 Phase 8-g-5 / 8-g-6 落地（commits `44c0e8f` + `5976162`；2 篇 sample posts + 5 個 templates；詳見 §3.5）；價值：避免未來複製模板或 sample 再產生 `frontmatter-uses-deprecated-type` / `body-leading-h1` noise warning | — | — |

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
- `docs/phase-8g-2-completion-report.md`（Phase 8-g-2 new-post.js prompt 系列收尾；commit `3c9b2e3`）
- `docs/phase-8g-2-d-completion-report.md`（Phase 8-g-2-d validate-content series warning 規則收尾；commit `c29f63b`）
- `docs/phase-8g-completion-report.md`（Phase 8-g overall 收尾報告；初版 commit `c3b6c63`；候選 C 落地後更新 commit `eec8ff7`；含 §3.5 Phase 8-g-4 candidate C 落地紀錄；8-g-1 fixture 仍 deferred。註：sample/template 對齊已於 `44c0e8f` / `5976162` 落地；overall completion report 之 §5 / §6 待後續獨立批次同步）

### 7.3 規格與設計文件

- `docs/series-schema.md` §15-§19（Phase 8-f 各子批次落地紀錄）
- `docs/promotion-export.md` §10（promotion manifest 4 個 additive 欄位）
- `docs/fb-sidecar-schema.md` §12.3.1（Blogger tags / FB hashtags 格式分離）
- `docs/publish-bundle.md` / `docs/publish-json-schema.md`（sidecar bundle / publish.json schema）
- `docs/migration-from-frontmatter.md`（既有 frontmatter 遷移指南）

### 7.4 專案規範

- `CLAUDE.md`（專案開發規範與分階段計畫）
