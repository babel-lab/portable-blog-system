# Phase 9-g Completion Report：related / other links metadata schema 系列

本文件為 Phase 9-g **related / other links metadata schema 系列**之完整完成報告。涵蓋自 Phase 9-g-a（純分析）至 Phase 9-g-f-c（本批；GitHub render 系列收尾 docs sync）共 20 個子批（含 7 個純分析批 + 13 個含 commit；其中 commit `a44ace8` 為 9-g-r overall completion report，commit 本批 為 9-g-f 系列收尾 docs sync）之落地紀錄、驗證結果與 deferred 項目。

**更新歷程**：本文件原於 commit `a44ace8` 建立為 Phase 9-g overall snapshot；其後 9-g-f-a / 9-g-f-b / 9-g-f-c 系列啟動，於 9-g-f-c 擴充記錄 GitHub render 落地（§4.12）與更新 §3 / §5.2 / §8 / §9。

**後續系列**：Phase 9-g 之後已另開 **Phase 9-h 系列**（GitHub article block parity）；至本文件更新時已落地 2 個子系列：
- **9-h-b 子系列**：GitHub Affiliate Box top / bottom（commit `f16457e`；docs sync `c356a2b`）
- **9-h-c 子系列**：GitHub Download Box（commit `6f06f28`；docs sync 為 Phase 9-h-c-c 本批）

後續候選含 GitHub Hashtag / Book Photo / 兩端 Related Posts auto；詳見 `docs/future-roadmap.md` §2 Phase 9 row 之 Phase 9-h 區段。本文件不擴大記錄 9-h 內容；Phase 9-h 之完整紀錄另由 future-roadmap + 未來可能之 `docs/phase-9h-completion-report.md` 承擔。

對應之上層紀錄詳見：
- `docs/related-links-schema.md` §9.1（已落地之子批進度完整 table）
- `docs/related-links-schema.md` §9.4（dist baseline / sanity check 紀錄）
- `docs/future-roadmap.md` §2 Phase 9 row（跨 phase 路線總覽）
- `CLAUDE.md` §3.1（文章資料 frontmatter See also）+ §16.5（連結處理規則 / `relatedLinks` / `otherLinks` 子節）
- `docs/publish-bundle.md` §2.6.1（內容屬性欄位列表 See also）
- `docs/publish-workflow.md` §11 末段（書評補述後之「相關連結 / 其他連結補述」）+ §15（最小必要欄位清單之 2 列）

---

## §1 Phase 9-g 目標摘要

Phase 9-g 之目標為建立 **作者手動指定之延伸閱讀 / 來源連結 metadata 系統**（兩個顯示分區：「相關連結」與「其他連結」），含以下七大成果：

1. **schema 規格文件**：新建 `docs/related-links-schema.md`（10 節主體；含欄位字典 / kind 規則 / 與 `blocks.relatedPosts` 自動推薦之 two-track 區分 / 與 `affiliate.links` 之語意分界 / Blogger HTML 範例）
2. **content templates 補入 sample frontmatter**：5 個 markdown templates 補 `relatedLinks` / `otherLinks` 示意（不同詳細度；`url: ""` placeholder + internal 註解提醒）
3. **validate warning rules**：4 條 warning-only validate rules（missing-kind / kind-invalid 互斥 / missing-url / not-array）
4. **validation fixtures**：4 個 fixtures（每規則一檔）
5. **Blogger render**：`blogger-post-full.ejs` 新增兩個 conditional `<aside>` + 新增 `_related-links.scss` + Blogger mirror SCSS
6. **Blogger copy-helper / publish-checklist**：copy-helper [13] 純文字確認區塊 + publish-checklist 「相關連結 / 其他連結內容檢查」conditional 區塊
7. **docs sync**：`docs/checklists/blogger-publish-checklist.md` +1 行 + `docs/publish-workflow.md` §11 / §15 補述 + `docs/related-links-schema.md` §9 全面更新 + `docs/future-roadmap.md` Phase 9 row 同步 + 本完成報告

---

## §2 relatedLinks / otherLinks 資料設計摘要

採 **方案 A two-field flat**（per Phase 9-g-a 三方案分析推薦）：

```yaml
# .md frontmatter 範例
relatedLinks:
  - kind: internal
    platform: "blogger"
    title: "改寫人生：影響個人的15種負面思維#2"
    url: "https://babel-lab.blogspot.com/2026/03/change-your-life2.html"
otherLinks:
  - kind: external
    platform: "Youtube"
    title: "🚩【吳淡如Ｘ鄧惠文】做個內力強大的人..."
    description: ""
    url: "https://www.youtube.com/xxx"
    order: 1
```

**頂層**：兩個獨立 array 欄位 `relatedLinks` / `otherLinks`（顯示分區）

**per-item 欄位字典**（共 8 欄）：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `kind` | ✅ | enum `"internal"` / `"external"`；決定自動 `target` / `rel` |
| `platform` | ✅ | 來源 / 平台名稱；用於 `[Platform]` 顯示前綴 |
| `title` | ✅ | 真正連結標題（不含 platform 前綴） |
| `url` | ✅ | 連結網址；internal 應為已發布後回填之真實 URL |
| `description` | 選填 | 補充說明 |
| `order` | 選填 | 排序輔助（本期 render 不接） |
| `target` | 選填 | 由 render 自動依 `kind` 套；作者**不需手填** |
| `rel` | 選填 | 由 render 自動依 `kind` 套；作者**不需手填** |

**設計原則**：
- `kind === "internal"` → render 不加 `target` / `rel`（同分頁開啟）
- `kind !== "internal"` → render 採 external default `target="_blank" rel="nofollow noopener"`
- `[Youtube]` / `[台北市立圖書館]` 等顯示前綴**拆入 `platform`**，**不**併入 `title`
- internal link 之 `url` **應為已發布後回填之真實 URL**（per `docs/publish-json-schema.md` §5.3 Blogger URL 不可預測禁則）；目標未發布時 url 留空 → render skip
- 屬內容屬性，**不放** `.publish.json` / `.fb.md`（per `docs/publish-bundle.md` §2.6.4 硬性原則）
- 與 `blocks.relatedPosts` 系統自動推薦為 **two-track 獨立機制**（不互相 fallback）
- 與 `affiliate.links` 嚴格分離（販售 vs 來源 / 延伸閱讀）

完整 schema 詳見 `docs/related-links-schema.md`。

---

## §3 Phase 9-g 子批列表

共 20 個子批（7 個純分析 + 13 個含 commit）：

| 子批 | 性質 | commit | subject |
| --- | --- | --- | --- |
| 9-g-a | 純分析 | — | related / external links metadata design analysis（Plan A vs B vs C 三方案比較） |
| 9-g-b | 含 commit | `258ab9e` | `docs(phase-9): add related-links-schema` |
| 9-g-c-a | 純分析 | — | sample / template update analysis |
| 9-g-c-b | 含 commit | `fbe6597` | `docs(phase-9): add relatedLinks/otherLinks samples to templates` |
| 9-g-c-c-a | 純分析 | — | validate rules + fixtures landing analysis（推薦方案 A 4 條 critical 規則） |
| 9-g-c-c | 含 commit | `b05240b` | `feat(phase-9): add relatedLinks/otherLinks validate rules + fixtures` |
| 9-g-c-d | 含 commit | `1c77b96` | `docs(phase-9): sync 9-g-c-b/c-c landings + baseline 0/22/17` |
| 9-g-d-a | 純分析 | — | Blogger render / copy-helper analysis |
| 9-g-d-b | 含 commit | `500df12` | `feat(phase-9): add Blogger relatedLinks/otherLinks render + SCSS` |
| 9-g-d-c-a | 純分析 | — | blogger-copy-helper [13] analysis |
| 9-g-d-c | 含 commit | `f7cd5b9` | `feat(phase-9): add Blogger copy-helper [13] relatedLinks/otherLinks` |
| **9-g-d-c-fix** | 含 commit | `b97c57a` | `fix(phase-9): remove copy-helper EJS comment delimiter leak` |
| 9-g-e-a | 純分析 | — | publish-checklist / workflow sync analysis |
| 9-g-e-b | 含 commit | `97e2c56` | `feat(phase-9): add Blogger publish-checklist relatedLinks/otherLinks`（含同類 EJS comment fix inline） |
| 9-g-e-c | 含 commit | `3aa8a9a` | `docs(phase-9): sync publish-workflow + checklist with relatedLinks/otherLinks` |
| 9-g-e-d | 含 commit | `518158a` | `docs(phase-9): sync 9-g-d/9-g-e landings + Phase 9-g series wrap-up` |
| 9-g-r | 含 commit | `a44ace8` | `docs(phase-9): add phase-9g completion report`（首次 Phase 9-g overall snapshot；其後 9-g-f 系列啟動）|
| 9-g-f-a | 純分析 | — | GitHub render 純讀取分析（確認 SCSS / build pipeline 無需動；推薦插入點 article body 後 / AdSense Bottom 前）|
| 9-g-f-b | 含 commit | `1bb807f` | `feat(phase-9): add GitHub relatedLinks/otherLinks render` |
| **9-g-f-c**（本批）| 含 commit | 見本批 git log | `docs(phase-9): sync GitHub render landings + Phase 9-g-f wrap-up`（建議 commit message） |

**含 commit 子批合計**：13 個（含本批）  
**純分析子批合計**：7 個

---

## §4 已完成成果

### 4.1 schema：`docs/related-links-schema.md` 新建

於 9-g-b commit `258ab9e` 落地，含 10 節主體：

- §1 文件目的（兩 array 顯示分區語意 + 不放 sidecar）
- §2 與其他 schema 邊界（vs `blocks.relatedPosts` / vs `affiliate.links` / vs `book` / vs `series` / vs `.publish.json` / vs `.fb.md`）
- §3 欄位字典（per-item 8 欄位 + platform 命名規則 + 正反例）
- §4 internal / external 自動 `target` / `rel` 規則
- §5 與 `publishedUrl` 之關係（不可預測 Blogger URL；不採 post-id 引用之理由；internal 不綁死 Blogger）
- §6 與 `affiliate.links` 之差異
- §7 與 `blocks.relatedPosts` 之差異（two-track 原則）
- §8 預期 Blogger HTML 輸出範例（含 `<aside class="lab-related-links">` markup + lab- BEM class）
- §9 Implementation notes（子批進度 + 後續批次 + 不接 normalize-post-output + dist baseline）
- §10 相關文件

cross-link 5 個既有檔案（同 commit）：
- `docs/publish-bundle.md` §2.6.1 See also
- `docs/migration-from-frontmatter.md` §4.1 See also
- `docs/content-schema.md` See also
- `CLAUDE.md` §3.1 See also + 新增 §16.5 子節
- `docs/future-roadmap.md` Phase 9 row 標註

§3.3 / §9 後續於 9-g-c-d / 9-g-e-d 兩次 docs sync 中持續更新至最新狀態。

### 4.2 templates：5 個 markdown templates 補 sample frontmatter

於 9-g-c-b commit `fbe6597` 落地（+42 行 / 5 檔）：

| Template | 詳細度 | 內容 |
| --- | --- | --- |
| `blogger-book-review-template.md` | 完整示意 | `relatedLinks` × 2 + `otherLinks` × 2（4 entries；含 internal blogger 同系列 + external 出版社官網 + 圖書館 + Youtube）|
| `blogger-download-template.md` | 中等示意 | `relatedLinks` × 1 internal + `otherLinks` × 1 external |
| `github-tech-note-template.md` | 簡短示意 | `relatedLinks` × 1 external 官方文件 + `otherLinks` × 1 external GitHub repo |
| `post-template.md` | 空陣列 placeholder | `relatedLinks: []` + `otherLinks: []` |
| `blogger-summary-template.md` | 空陣列 placeholder | 同上 |

規範遵守：
- ✅ 所有 url 留空字串（待目標文章發布後回填）
- ✅ internal 連結附「待目標文章發布後回填正式 URL」註解
- ✅ 不放 `target` / `rel`（render 自動套）
- ✅ `[Youtube]` / `[台北市立圖書館]` 等顯示前綴拆入 `platform`，**不**併入 `title`
- ✅ 不順手修正 blogger-summary / blogger-download 既有 placeholder copy 問題（屬另一批；不在 9-g-c-b 範圍）

### 4.3 validate rules：4 條 warning-only

於 9-g-c-c commit `b05240b` 落地於 `src/scripts/validate-content.js`（+71 行；純 additive）：

| # | 規則 key | 觸發條件 |
| --- | --- | --- |
| 1 | `related-links-not-array` | `relatedLinks` / `otherLinks` 欄位存在但非 array；觸發後 skip 該欄位之 entry-level 檢查 |
| 2 | `related-links-entry-missing-kind` | entry 為 plain object 且 `kind` 缺漏 / 空字串 |
| 3 | `related-links-entry-kind-invalid` | entry 之 `kind` 已存在且為非空值，但不在 `{ "internal", "external" }`；**與 #2 互斥** |
| 4 | `related-links-entry-missing-url` | entry 之 `url` 缺漏或空字串 |

設計：
- 全 warning-only / ready+published only / 沿用既有 series / book 規則範圍
- 新增 `VALID_LINK_KIND` constant + `validateRelatedLinksField(fieldName, value, sourcePath, issues)` helper
- `relatedLinks` / `otherLinks` **共用同一 helper**（schema 完全相同）
- 主迴圈於 book block 之後、`READY_STATUS` close 之前 caller 兩處
- 沿用既有 `isNonEmptyString` helper（line 95-97）；不重複定義

**保守延後**（per Phase 9-g-c-c-a §6.2）：以下 3 條規則本期**不落地**：

- `related-links-entry-missing-platform`（completeness 面向）
- `related-links-entry-missing-title`（completeness 面向）
- `related-links-platform-in-title`（heuristic；誤判風險）

### 4.4 validation fixtures：4 檔

於 9-g-c-c commit `b05240b`（同 commit）落地於 `content/validation-fixtures/blogger/posts/`：

- `_test-related-links-not-array.md`
- `_test-related-links-entry-missing-kind.md`
- `_test-related-links-entry-kind-invalid.md`
- `_test-related-links-entry-missing-url.md`

每 fixture **嚴格只觸發 1 條 dedicated warning**（per 9-g-c-c sanity check 對照）。皆補齊 `description` / `category` / `tags` / `cover` 等基礎欄位避免既有 `missing-*` warning noise。

### 4.5 docs sync：9-g-c-d schema docs 第一階段

於 9-g-c-d commit `1c77b96` 落地：
- `docs/related-links-schema.md` §3.3 改寫為「Phase 9-g-c-c 已落地 4 條 warning-only 規則」（+ 互斥邏輯 + skip 行為 + 保守延後 3 條）
- §9.1 改為「Phase 9-g 子批進度」table + baseline 演進
- §9.2 改為「Phase 9-g 後續批次」（移除已 landed 之 9-g-c）
- §9.4 改為「dist baseline」含各子批 dist 不變紀錄
- `docs/future-roadmap.md` Phase 9 mega-row append 9-g-c-a / 9-g-c-b / 9-g-c-c-a / 9-g-c-c / 9-g-c-d landings

### 4.6 Blogger render + SCSS：`blogger-post-full.ejs` 新增兩個 conditional `<aside>` + 新 SCSS

於 9-g-d-b commit `500df12` 落地（+153 行 / 4 檔；純 additive）：

**`src/views/blogger/blogger-post-full.ejs`（+62 行）**：
- 在 Affiliate Box bottom（line 111）與 Hashtag 區塊（line 113）之間新增兩個獨立 conditional aside：
  - `<aside class="lab-related-links">`（H2「相關連結」）
  - `<aside class="lab-other-links">`（H2「其他連結」）
- renderable pre-filter（plain object + url non-empty + title non-empty）+ outer guard 避免空 `<ul>`
- inline JS：`renderableRelated` / `renderableOther` 預計算 + per-item `isInternal` / `platform` / `hasDesc`
- `kind === 'internal'` → 不加 `target` / `rel`
- `kind !== 'internal'`（含 external / 缺漏 / invalid）→ 採 external default `_blank` + `nofollow noopener`
- 不支援 `item.target` / `item.rel` author override
- 忽略 `item.order`，照 array 原順序
- platform 非空 → `<span class="lab-related-links__platform">[Platform]</span>` 前綴
- description 非空 → `<p class="lab-related-links__description">` 獨立行
- 採 trim-newline pattern（comment / 定義 / closing-if 皆 `-%>`）

**`src/styles/components/_related-links.scss`（新增；71 行）**：
- BEM 命名空間 `.lab-related-links` 與 `.lab-other-links` 共用同一套 6 條 selectors
- 樣式簡潔：spacing / list reset / platform spacing / description spacing
- 不加 hover / card / border 等視覺裝飾
- 保留 `:focus-visible`（標準 a11y）

**`src/styles/blogger/_blogger-components-rules.scss`（+19 行）**：
- 於 `_related-posts.scss` mirror 之後新增 `_related-links.scss` Blogger 鏡射
- 內容完全 mirror GitHub partial 但採 single-line per rule pattern（mirror file 既有 style）

**`src/styles/main.scss`（+1 行）**：
- 於 `@use './components/related-posts';` 之後新增 `@use './components/related-links';`

不接 `buildMeta()`（保 `meta.json` byte-identical）；不接 `normalize-post-output`（per docs §9.3）。

### 4.7 Blogger copy-helper [13]：blogger-copy-helper.ejs 新增純文字確認區塊

於 9-g-d-c commit `f7cd5b9` 落地（+56 行；後續 9-g-d-c-fix 修正 EJS bug；詳見 §6）：

**`src/views/blogger/blogger-copy-helper.ejs`（+56 行）**：
- 於檔案末尾、[12] book metadata 之後 append [13] 區塊
- 純文字確認清單（不輸出 Blogger HTML；[5] 已 reference postFile）
- renderable pre-filter 與 9-g-d-b 完全一致
- inline JS 含 `pickRenderableLinks` + `formatLinkLines` helpers + 預計算
- outer if guard：兩 array 皆無 renderable item → 完全不輸出 [13]
- relatedLinks / otherLinks 分為兩個 sub-section 各自 numbered list
- platform 非空 → `[Platform] ` 前綴；platform 空 → 直接顯示 title
- description 非空 → 縮排 5 spaces 對齊獨立一行
- kind 不顯示（避免雜訊；外露於提示區尾段）
- 提示區 5 條 bullets：HTML body 已含 / 無需手動貼 / pre-filter skip 透明化 / internal url 為已回填真實 URL / external 自動加 target+rel

mirror Phase 9-f-c-b book metadata [12] 之 conditional + inline JS + lines build + trim-newline pattern。

### 4.8 Blogger publish-checklist：blogger-publish-checklist.ejs 新增 conditional checklist

於 9-g-e-b commit `97e2c56` 落地（+35 行；含同類 EJS comment fix inline；詳見 §6）：

**`src/views/blogger/blogger-publish-checklist.ejs`（+35 行）**：
- 新增第 5 區塊「相關連結 / 其他連結內容檢查」（編號排在書籍 / 雜誌內容檢查之後、SEO 檢查之前）
- renderable pre-filter 與 9-g-d-b / 9-g-d-c 完全一致
- inline JS：`pickRenderableLinksForChecklist` helper + `renderableRelated` / `renderableOther` 預計算 + `hasInternalLink` flag 預計算
- outer if guard：兩 array 皆無 renderable item → 完全不輸出本區塊
- 4 條 always-show checkbox：
  - HTML body 已顯示（含數量：X 個 relatedLinks / Y 個 otherLinks）
  - copy-helper [13] 已對照
  - external 之 target+rel 由 render 自動套用
  - url 空 / title 空 之 item 已自動 skip
- 1 條 nested conditional checkbox（`hasInternalLink === true` 時）：
  - internal link 之 url 為「已發布後回填之真實 URL」（per `docs/publish-json-schema.md` §5.3）
- 不列平台 / title / url 明細（避免 checklist 太長；細節由 copy-helper [13] 提供）
- 「frontmatter 有但全部 url 空 / title 空」之情境由 9-g-c-c validate warnings 處理，不在本 checklist 重複提醒
- build:blogger sanity check **pass**

mirror Phase 9-f-c-c-b book-review checklist 之 conditional + inline JS + outer if guard + trim-newline pattern。

### 4.9 EJS comment delimiter leak fixes（兩個 bug）

詳見 §6。

### 4.10 docs sync：9-g-e-c publish-workflow + checklists

於 9-g-e-c commit `3aa8a9a` 落地：

**`docs/checklists/blogger-publish-checklist.md`（+1 行）**：
- 於「AdSense 區塊未破版」之後、「發布後 URL 已回填」之前新增 1 條 checkbox：「相關連結 / 其他連結已核對（若文章含此區塊；詳見 dist-blogger 產出之 publish-checklist.txt）」
- 其他 10 條既有 checkbox 維持不變

**`docs/publish-workflow.md`（+18 行 / 2 處）**：

§11 末段「相關連結 / 其他連結補述」（+15 行）：
- 4 cross-link bullets：post.html 之 aside（9-g-d-b）/ copy-helper.txt [13]（9-g-d-c）/ publish-checklist.txt 相關連結區塊（9-g-e-b）/ docs/related-links-schema.md
- 4 注意事項 bullets：internal url 應為已回填真實 URL / external target+rel 自動套 / `[Youtube]` 等顯示前綴拆入 platform 不併入 title / relatedLinks 不放 .publish.json / .fb.md
- mirror 9-f-c 書評補述結構

§15 最小必要欄位清單新增 2 列：
- `relatedLinks`：ready 前 / 選填 / 作者手動指定之延伸閱讀 / 系列文章 / 來源連結 array
- `otherLinks`：ready 前 / 選填 / 作者手動指定之次要補充 / 館藏 / 影片 array

### 4.11 docs sync：9-g-e-d schema / roadmap wrap-up

於 9-g-e-d commit `518158a` 落地（Phase 9-g-e 系列收尾）：

**`docs/related-links-schema.md`（+28 / -11；3 處）**：
- §9.1 子批進度 table 從 11 列擴充至 18 列（補入全部 9-g-d / 9-g-d-c-fix / 9-g-e landings + commit hashes）
- §9.2 後續批次 table 從 4 列縮為 2 列（移除已 landed 之 9-g-d / 9-g-e；保留 9-g-f / 9-g-g）
- §9.4 標題改為「dist baseline / sanity check 紀錄」；從 3 條子批變動清單擴充至 7 條（補入 9-g-d-b / 9-g-d-c / 9-g-d-c-fix / 9-g-e-b / 9-g-e-c / 9-g-e-d；新增當前 dist-blogger 整體狀態總結）

**`docs/future-roadmap.md`（+1 / -1；Phase 9 mega-row tail 重寫）**：
- append 全部 9-g-d / 9-g-d-c-fix / 9-g-e landings + commit hashes
- 「仍未啟動」清單移除 9-g-d / 9-g-e；保留 9-g-f / 9-g-g
- 新增整體狀態總結句

### 4.12 GitHub render：post-detail.ejs 新增兩個 conditional `<aside>`

於 9-g-f-b commit `1bb807f` 落地（+65 行 / 1 檔；mirror Blogger 9-g-d-b pattern）：

**`src/views/pages/post-detail.ejs`（+65 行）**：
- 在 article body 之後（`<div class="lab-article__body">` close `</div>` 之後）、AdSense Bottom 之前新增兩個獨立 conditional aside（皆包覆 `<div class="lab-container">`）：
  - `<aside class="lab-related-links">`（H2「相關連結」）
  - `<aside class="lab-other-links">`（H2「其他連結」）
- renderable pre-filter 與 Blogger 9-g-d-b / copy-helper 9-g-d-c / publish-checklist 9-g-e-b 完全一致：plain object + url non-empty + title non-empty；outer guard 確保 0 renderable items 不輸出空 aside
- `kind === 'internal'` → 不加 target / rel
- `kind !== 'internal'`（含 external / 缺漏 / invalid）→ 採 external default `target="_blank" rel="nofollow noopener"`
- 不支援 `item.target` / `item.rel` author override
- 忽略 `item.order`，照 array 原順序
- platform 非空 → `<span class="lab-related-links__platform">[Platform]</span>` 前綴；platform 空 → 直接顯示 title
- description 非空 → `<p class="lab-related-links__description">` 獨立行
- 採 trim-newline pattern（comment / 定義 / closing-if 皆 `-%>`）

**EJS comment delimiter leak 預防（per 9-g-d-c-fix 教訓）**：
- 8 行 EJS comment 內**嚴格不出現** `<%` / `%>` / `-%>` 字符（inline 預防 9-g-d-c / 9-g-e-b 同源 bug 模式）
- 描述 trim-newline pattern 時用純文字描述，避免字面引用 delimiter
- 描述 kind 規則時改寫為「kind 為 internal 時不加 target 與 rel」（避免 `===` 等語法字符）
- mirror 9-g-d-c-fix / 9-g-e-b 之既有預防經驗

**不改其他檔案**：
- 不改 `src/styles/components/_related-links.scss`（已於 9-g-d-b 落地；BEM 命名空間與平台無關，GitHub 端直接重用）
- 不改 `src/styles/main.scss`（`@use './components/related-links';` 已於 9-g-d-b 落地）
- 不改 `src/scripts/build-github.js` / `build-blogger.js`（`post.relatedLinks` / `post.otherLinks` 已透過既有 build pipeline 自動傳入 EJS）
- 不接 `normalize-post-output`（per `docs/related-links-schema.md` §9.3）
- 不改 Blogger 端 EJS / SCSS

**build sanity check pass**：
- `npm run build` 成功（804ms / 30 modules transformed）
- 對既有 2 篇 ready GitHub posts（`github-pages-blog-planning` + `portable-blog-system-mvp`）：
  - 無「相關連結」/「其他連結」標題漏出（grep no-match）
  - 無 `lab-related-links` / `lab-other-links` class 漏出（grep no-match）
  - outer if guard 正確 skip
  - `dist/posts/{slug}/index.html` 達成 byte-identical-modulo-builtAt 預期

**`dist/.gitkeep` 副作用處理**：
- vite build 預設清空 `dist/` 行為造成 `dist/.gitkeep` 副作用刪除
- 採 `git restore dist/.gitkeep` 還原，**未納入** 9-g-f-b commit
- 9-g-f-b commit `1bb807f` 嚴格僅含 1 檔：`src/views/pages/post-detail.ejs`

### 4.13 docs sync：9-g-f-c GitHub render wrap-up（本批）

於本批 9-g-f-c 落地（commit 見本批 git log）：

**`docs/related-links-schema.md`（3 處）**：
- §9.1 子批進度 table 補入 9-g-f-a / 9-g-f-b / 9-g-f-c 3 列 + 保留 9-g-g；同步「baseline 演進」延伸期間至 9-g-f-c
- §9.2 後續批次 table 移除 Phase 9-g-f；intro 補述「9-g-d / 9-g-e / 9-g-f 系列已全數 landed」
- §9.4 dist baseline 補入 9-g-f-b row；整體狀態擴展為「Blogger + GitHub 兩端」；未啟動之 9-g-f 移除（僅保留 9-g-g）

**`docs/future-roadmap.md`（Phase 9 mega-row tail 重寫）**：
- 9-g-e-d 從「本批」更新為實際 hash `518158a`
- append 9-g-r `a44ace8` / 9-g-f-a / 9-g-f-b `1bb807f` / 本批 9-g-f-c landings
- 整體狀態總結句擴展為 Blogger + GitHub 兩端
- 「仍未啟動」清單移除 9-g-f；保留 9-g-g

**本文件（`docs/phase-9g-completion-report.md`）**：
- Header：「17 個子批」更新為「20 個子批」；新增「更新歷程」段落
- §3 子批列表：9-g-r 之 commit 從「見本批 git log」更新為 `a44ace8`；append 9-g-f-a / 9-g-f-b / 9-g-f-c 3 列；合計更新為「13 commits + 7 純分析」
- §4 新增 §4.12 GitHub render（本節）+ §4.13 本節
- §5.2 dist baseline 補入 9-g-f-b / 9-g-f-c；外圍狀態擴展為 Blogger + GitHub 兩端
- §8 deferred 移除原 §8.3 Phase 9-g-f（重編 §8.4 → §8.3 / §8.5 → §8.4）
- §9.2 候選 table 移除 Phase 9-g-f

**`docs/publish-workflow.md`（可選 1 行補述）**：
- §11 末段「相關連結 / 其他連結補述」段落補一行 GitHub 端 cross-link

未動 src/* / content/* / dist*；未執行 build / validate；baseline 維持 `0/22/17`。

---

## §5 baseline 狀態

### 5.1 validate baseline

```
Phase 9-g 前（Phase 9-f-c-e 收尾後）：               0 error / 18 warning on 13 post(s)
9-g-c-c 前（Phase 9-g 中段）：                       0 error / 18 warning on 13 post(s)（不變）
9-g-c-c 收尾後（Phase 9-g 完整完成）：               0 error / 22 warning on 17 post(s)
```

| 階段 | error | warning | post 數 | 變動原因 |
| --- | --- | --- | --- | --- |
| Phase 9-g 前 | 0 | 18 | 13 | Phase 9-f-c 系列收尾後之 baseline |
| 9-g-b / 9-g-c-b 後 | 0 | 18 | 13 | 純 docs / templates；validate 不掃 |
| **9-g-c-c 後** | **0** | **22** | **17** | **+4 個 related-links validation fixtures**（**+4 warnings / +4 posts**） |
| 9-g-c-d 至 9-g-e-d 期間 | 0 | 22 | 17 | 期間 9-g-d-b / 9-g-d-c / 9-g-d-c-fix / 9-g-e-b 之 EJS template 變更不在 validate scan path；9-g-c-d / 9-g-e-c / 9-g-e-d 為純 docs |
| **本批 9-g-r 後（當前）** | **0** | **22** | **17** | 純 docs；不變 |

**性質**：✅ **預期變動，非 regression**。

- 4 條新 warning 皆來自本期新增之 4 個 fixtures
- 每 fixture 嚴格只觸發 1 條指定 related-links warning
- 既有 13 篇 fixture / sample post 之 18 條 warning 完全 byte-identical
- mirror Phase 9-e-d-d-b / Phase 8-g-12-c 之 fixture 落地推 baseline 之既有模式

### 5.2 dist baseline

✅ **Phase 9-g 全程對既有無 `relatedLinks` / `otherLinks` 之 ready posts 達成 byte-identical-modulo-builtAt**。

| 子批 | dist 影響範圍 |
| --- | --- |
| **9-g-b** / **9-g-c-d** / **9-g-e-c** / **9-g-e-d** / **9-g-r** / **9-g-f-c**（本批） | 純 docs；dist 完全不變 |
| **9-g-c-b** | 僅 `content/templates/*.md`（templates 不被 `build:*` 掃描，per Phase 8-g-6 紀錄）；dist 不變 |
| **9-g-c-c** | 僅 `src/scripts/validate-content.js` + `content/validation-fixtures/blogger/posts/`（validation-fixtures 不被 `build:*` 掃描，per Phase 8-e-6-b-1）；dist 不變 |
| **9-g-d-b** | Blogger post HTML render + SCSS；對含 `relatedLinks` / `otherLinks` 之 post 之 `post.html` 新增 `<aside>` 區塊；對無此兩欄位之既有 ready post，`post.html` 維持 byte-identical-modulo-builtAt |
| **9-g-d-c** | blogger-copy-helper [13] 區塊（首次 build:blogger 後發現 EJS comment delimiter leak；於 9-g-d-c-fix 修正） |
| **9-g-d-c-fix** | 移除 EJS comment 內嵌 delimiter；build:blogger sanity check **pass**；copy-helper.txt 不再含 leaked text、達成 byte-identical-modulo-builtAt |
| **9-g-e-b** | publish-checklist 新增區塊；含同類 EJS fix inline；build:blogger sanity check **pass**；publish-checklist.txt 達成 byte-identical-modulo-builtAt |
| **9-g-f-b** | GitHub post HTML render：`src/views/pages/post-detail.ejs` 在 article body 後 / AdSense Bottom 前新增兩個 conditional `<aside>`（包覆 `<div class="lab-container">`）；mirror Blogger 9-g-d-b pattern；EJS comment 嚴格無 delimiter 字符 inline 預防；`npm run build` sanity check **pass**：對既有 2 篇 ready GitHub post（github-pages-blog-planning + portable-blog-system-mvp）之 `dist/posts/{slug}/index.html` 達成 byte-identical-modulo-builtAt（grep 4 個關鍵字皆無命中）；不改 SCSS / build script / Blogger 端 |

**當前 dist 整體狀態（Blogger + GitHub 兩端）**：

- 對既有無 `relatedLinks` / `otherLinks` 之 ready posts：
  - **dist-blogger**：`post.html` / `copy-helper.txt` / `publish-checklist.txt` / `meta.json` 皆 **byte-identical-modulo-builtAt**
  - **dist**（GitHub）：`posts/{slug}/index.html` 達成 **byte-identical-modulo-builtAt**
- 無 leaked text（兩個 EJS comment delimiter bug 皆已於 9-g-d-c-fix / 9-g-e-b 修復；9-g-f-b 採嚴格無 delimiter 字符 inline 預防）
- 無意外 `[13]` 區塊 / 無意外「相關連結 / 其他連結內容檢查」checklist 區塊 / 無意外 `<aside class="lab-related-links">` / `<aside class="lab-other-links">` HTML 區塊
- validate baseline 維持 **`0/22/17`**

未啟動之 **9-g-g** 屬 JSON-LD 範疇（structured data；與 Phase 9-f-g 同步保守原則 deferred）；與當前 dist 無關。

---

## §6 EJS comment delimiter leak fixes

Phase 9-g 系列實作過程中發現並修復 **2 個同源 EJS comment delimiter leak bug**，皆與 EJS parser 處理 comment 內嵌 `-%>` 字串之行為有關。

### 6.1 Bug pattern 描述

EJS comment 寫成 `<%# ... -%>` 時，若 comment 內容**含內嵌 `-%>` 字串**（例如為了文檔說明 trim-newline pattern 而引用 `-%>` 作為例子），EJS parser 會：

1. 命中第一個 `-%>` 並**提早關閉 comment 標籤**
2. 後續文字（原本應屬於 comment 內容的部分）變成**raw text 輸出**
3. 行末的 `-%>` 被解析為 floating tag delimiter（trim 後續 newline）

→ 結果：每篇 ready post 之輸出檔（copy-helper.txt / publish-checklist.txt）都會多出意外的漏出文字。

### 6.2 Bug #1：copy-helper [13] initial implementation 後之 EJS comment leak

**引入**：commit `f7cd5b9`（Phase 9-g-d-c）  
**位置**：`src/views/blogger/blogger-copy-helper.ejs` line 199  
**漏出文字**：` trim-newline `  
**影響範圍**：所有 ready posts 之 `copy-helper.txt`（line 95 區域）  
**發現時機**：Phase 9-g-e-b 之 build:blogger sanity check 順帶檢查 copy-helper.txt 時發現  
**修復**：commit `b97c57a`（Phase 9-g-d-c-fix）  
- 移除 line 199 comment 之內嵌 `-%>` 字串（diff +1 / -1）
- 不改 [13] 邏輯
- build:blogger sanity check **pass**

### 6.3 Bug #2：publish-checklist initial implementation 之同源 leak

**引入**：commit `97e2c56`（Phase 9-g-e-b 之 EJS template 草案；發現於 sanity check 第一輪）  
**位置**：`src/views/blogger/blogger-publish-checklist.ejs` 之 comment line 7  
**漏出文字**：` trim-newline pattern `  
**影響範圍**：所有 ready posts 之 `publish-checklist.txt`（line 32 區域）  
**發現時機**：Phase 9-g-e-b 之首輪 build:blogger sanity check  
**修復**：commit `97e2c56`（Phase 9-g-e-b 之 EJS comment fix inline，**同 commit 內**修正後再 commit）  
- 移除 comment 內嵌 `-%>` 字串
- 不改 checklist 邏輯
- build:blogger sanity check **pass**

### 6.4 教訓與後續預防

**根本原因**：EJS comment 為了**描述** trim-newline pattern，內嵌了 `-%>` 字串作為文檔範例 — 但 EJS 本身會解析此字串為 tag-close。

**預防原則**（per Phase 9-g-d-c-fix spec rule 4）：
- **comment 內不要再出現 `<%` / `%>` / `-%>` 這類 EJS delimiter 文字**
- 描述 trim-newline pattern 時，使用「trim-newline pattern」（無 delimiter prefix）或「結尾標籤帶 dash」等替代敘述
- 修改 EJS template 時，可用 `grep "^<%#"` 掃描所有 comment lines 後人工 review

**現況**：兩個 bug 皆於本系列內修復；當前 dist-blogger 對既有 ready posts 達成 byte-identical-modulo-builtAt。  
全檔 EJS comments 已通過 grep 掃描確認無內嵌 delimiter 文字。

---

## §7 邊界聲明

### 7.1 4 條 related-links validate rules 之嚴格邊界

- **全部 warning-only**：嚴格 `severity: 'warning'`；無一條 error
- **不阻擋 build**：與 `build:github` / `build:blogger` / `build:promotion` pipeline 完全無關
- **不阻擋 validate exit code**：warning-only → `npm run validate:content` exit 0
- **不接 normalize-post-output**：純 validate 內部；不寫入 `normalized.*` 任何欄位
- **不接 build pipeline**：不被 build script 呼叫；不影響任何 build 輸出
- **不寫入 meta.json**：本系列不改 `buildMeta()`；relatedLinks / otherLinks 之 metadata 不出現在 dist-blogger 之 `meta.json`
- **僅作用於 ready / published**：drafts / archived 由 `loadPosts` 過濾不進

### 7.2 與既有 `blocks.relatedPosts` 自動推薦之嚴格分離（two-track 原則）

per `docs/related-links-schema.md` §2.2 / §7：

- `blocks.relatedPosts`（系統自動推薦）與 `relatedLinks` / `otherLinks`（作者手動指定）為**兩條獨立軌道**
- 兩機制可同時存在於同一篇文章
- **不互相 fallback**：`relatedLinks` 為空時不自動 fallback 到 `blocks.relatedPosts`
- 顯示順序由 EJS template 決定（建議：作者手動 → 系統自動）

### 7.3 與 `affiliate.links` 之嚴格分離

per `docs/related-links-schema.md` §2.3 / §6：

- `affiliate.links` 為聯盟販售連結（自動 `sponsored` rel + 強制 disclosure）
- `relatedLinks` / `otherLinks` 為延伸閱讀 / 來源引用（無 disclosure 強制；rel 依 kind 決定）
- 兩機制不可混用；判斷準則：販售 → affiliate；非販售 → relatedLinks / otherLinks

### 7.4 不新建額外 source code / settings

- **不新建** `src/scripts/normalize-related-links.js`（per docs §9.3）
- **不新建** `content/settings/related-links.json`
- helpers 全部 inline 於 EJS templates（mirror book metadata [12] / book-review checklist 之既有 pattern）

### 7.5 schema 維度分離

`relatedLinks` / `otherLinks` 屬**內容屬性**（per `docs/publish-bundle.md` §2.6.1）：

- ✅ 放 `.md` frontmatter
- ❌ **不放** `.publish.json`
- ❌ **不放** `.fb.md`

違反者於 validate 階段之 sidecar overlap warning 涵蓋（per `docs/publish-bundle.md` §2.6.4 硬性原則）。

---

## §8 deferred / 未落地項目

### 8.1 保守延後之 3 條 validate rules（per Phase 9-g-c-c-a §6.2）

評估**過於 noise / completeness 面向 / heuristic 誤判風險**，本期不落地：

| 候選 rule | 不落地理由 |
| --- | --- |
| `related-links-entry-missing-platform` | `platform` 必填屬 completeness warning；非結構錯誤；render 仍可顯示（雖難看）；先觀察作者實際使用情況 |
| `related-links-entry-missing-title` | 同上 completeness 面向；render 仍可 skip（pre-filter 已處理 title 空）|
| `related-links-platform-in-title` | heuristic：title 開頭含 `[xxx]` pattern 之自動偵測；可能誤判（如書名本身含中括號）；保守延後 |

3 條保留於 `docs/related-links-schema.md` §3.3 末段「保守延後」紀錄。**已評估但 Phase 9-g 不落地**；未來如政策調整可再評估。

### 8.2 不接 normalize-post-output（per docs §9.3）

第一版 EJS render 直接讀 `post.relatedLinks` / `post.otherLinks`（mirror `post.affiliate` / `post.download` pattern）：

- relatedLinks / otherLinks 之 fallback / inheritance 邏輯**不複雜**：無 series-level 繼承、無 site-level default、無 sidecar / frontmatter 多源衝突
- 直接於 EJS 讀取即可；自動 `target` / `rel` 套用可於 EJS 內聯處理

如未來有跨文章 / 跨平台繼承需求，再評估接入 normalize；屬第二階段。

### 8.3 Phase 9-g-g：JSON-LD（可選 / deferred）

**範圍**：
- 為 internal links 補 `mentions` / `relatedLink` / `isPartOf` 等 schema.org 屬性

**狀態**：⏸ deferred  
**理由**（mirror Phase 9-f-g 之保守原則）：
- 等真實 ready post 可做 Google Rich Results Test 後再評估
- schema.org 嚴格性（錯誤 schema 會被 Google 標 invalid）
- byte-identical 驗證對 schema 結構正確性不足夠

### 8.4 Phase 8-g pause-state 維持不變

下列 Phase 8-g deferred / pending 項目**狀態未動**：

- **candidate 6**（first article `.fb.md` hashtags fallback）仍 ⏸ `nice-to-have / Phase 8-h+`
- **Phase 8-g-1** fixture / sample end-to-end 驗證仍 ⏸ deferred
- **Phase 8-h** legacy fallback 退場仍 pending

Phase 9-g 系列**未碰**上述任何項目；保留原 pause-state。

---

## §9 對下一步的建議

### 9.1 優先：停在 Phase 9-g complete snapshot

✅ **建議**：Phase 9-g 系列至此實質收尾。

當前狀態適合作為 stable snapshot：
- 所有 schema / template / validate / fixture / Blogger render / copy-helper / publish-checklist / docs sync 皆已 landed
- 兩個 EJS comment delimiter bug 皆已修復
- dist-blogger 對既有所有 ready posts 達成 byte-identical-modulo-builtAt
- validate baseline 穩定維持 `0/22/17`
- 完整紀錄於本完成報告 + `docs/related-links-schema.md` §9 + `docs/future-roadmap.md` Phase 9 row

### 9.2 可選：另開 Phase 9-h 或 Phase 9-g-f / 9-g-g（不混入本批）

| 候選 | 範圍 | 觸發條件 |
| --- | --- | --- |
| ~~Phase 9-g-f~~ | ~~GitHub render~~ | ✅ **已於 9-g-f-a / 9-g-f-b（commit `1bb807f`）/ 9-g-f-c 落地**（詳見 §3 子批列表 / §4.12 / §5.2 / §8.3 之相應 deferred row 已移除）|
| Phase 9-g-g | JSON-LD `mentions` / `isPartOf` structured data | 等真實 ready post 可做 Google Rich Results Test 後再評估（與 Phase 9-f-g 同步） |
| Phase 9-h（可能候選）| 如有新增需求（例如 series + relatedLinks 整合 / 相容層退場 / 其他第二階段功能）| 屬另開系列；不在 Phase 9-g 範圍 |

**保守原則**：每候選獨立批次；不混入本批 9-g-r completion report。

### 9.3 EJS comment delimiter leak 預防（架構性）

future EJS template edits 應遵守 Phase 9-g-d-c-fix spec rule 4：

- comment 內**不要再出現** `<%` / `%>` / `-%>` 這類 EJS delimiter 文字
- 修改 EJS template 後可用 `grep "^<%#"` 掃描全檔 comments 人工 review
- 如未來考慮自動化檢查，可評估在 build pipeline 加入 lint step（屬未來架構候選）

---

（本文件結束）
