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
| 9 | Phase 8-g pause-state 後之 Direction A + D 起手（author SOP + publishedUrl backfill helper）+ Phase 9-e book / source metadata schema 系列 | 🔄 進行中 | Phase 9-b `a7a467b`（`docs/publish-workflow.md` §8-§16 author SOP）+ Phase 9-c-1 `f5f71b4`（`src/scripts/backfill-published-url.js` CLI helper + `package.json` `backfill:url` npm script）+ Phase 9-c-2 `68c418e`（`docs/publish-workflow.md` §13 / §16 cross-link）+ Phase 9-d-a `9712d8d`（roadmap sync 9-b / 9-c landings；屬 Phase 9-c closure；**不新增 runtime 功能**）+ **Phase 9-e（book / source metadata schema 系列）**：9-e-a（純分析；無 commit）+ 9-e-b `e03c87d`（新增 `docs/book-schema.md` 10 節 + `docs/content-schema.md` / `CLAUDE.md` §12 See also）+ 9-e-c-b `235cdf7`（sample post backfill book schema 新欄位 + 新增 `content/templates/blogger-magazine-review-template.md`）+ 9-e-c-c-b `f16e79e`（`content/templates/blogger-book-review-template.md` realign 為 book-review 語境）+ 9-e-d-b `95437a3`（3 條 validate warnings：`book-mediatype-invalid` / `book-issue-without-magazine-mediatype` / `book-issn-without-magazine-mediatype`）+ 9-e-d-c `4f37cbc`（4 條 validate warnings：`book-volume-invalid-type` / `book-published-year-invalid-type` / `book-authors-invalid-role` / `book-authors-entry-empty`）+ 9-e-d-d-b `63aa497`（7 個 validation fixtures 於 `content/validation-fixtures/blogger/posts/`）+ 本批 9-e-d-e（docs sync：本文件 + `docs/book-schema.md` §11；commit 見本批 git log；屬 9-e-d 系列 closure；**不新增 runtime 功能**）；validate baseline 由 `0/11/6` 推升至 `0/18/13`（屬 fixture 落地預期變動，非 regression；per `docs/book-schema.md` §11.4）；dist baseline 全程不變（本系列未執行 build pipeline / 未改 dist）；Phase 8-g pause-state 不變（candidate 6 仍 ⏸ deferred；Phase 8-g-1 fixture 仍 deferred；Phase 8-h 退場仍 pending）|

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
| 8-g-7 | future-roadmap 同步 sample/template 對齊收尾 | ✅ 完成 | commit `a9db65b`；本文件（§3 表格 + §3.5 新增 + §5.1 + §7.2 同步）|
| 8-g-8 | phase-8g-completion-report.md 同步 sample/template/roadmap landings | ✅ 完成 | commit `38a0007`；`docs/phase-8g-completion-report.md`（補入 §3.6 Phase 8-g-5 + §3.7 Phase 8-g-6 + §3.8 Phase 8-g-7 落地紀錄 + §3.1 候選表新增 S/T 列 + §3.2 baseline `0/13/7` → `0/9/5` 收斂 + §5 / §6 / §7 對應更新；+269 / −93 行）|
| 8-g-9 | future-roadmap 同步 Phase 8-g-7 / 8-g-8 landings | ✅ 完成 | commit `ffa0310`；本文件（§3 表格 + §3.5 末段 + §7.2 同步）|
| 8-g-10 | 修正 8-g-9 roadmap self-reference / sync future-roadmap after `ffa0310` | ✅ 完成 | commit `be4304f`；本文件（§3 表格 8-g-9 列自我參照修正 + 新增 8-g-10 列）|
| 8-g-11 | fb-sidecar-schema.md §5.2.6 補連 8-c / 8-e phase report 讀取分析 | ✅ 完成（決策維持保守）| 對話內讀取分析；確認維持 Phase 8-g-4-c「不過度 cross-link」保守決策；未新增 link；無 commit |
| 8-g-12-a | `titleTemplate unresolved` 升級為 user-visible warning 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件 |
| 8-g-12-b | `validate-content.js` 加 `series-title-unresolved` warning（warning-only；ready/published 範圍）| ✅ 完成 | commit `a73c064`；`src/scripts/validate-content.js`（+44 行 / import resolveTitleTemplate + 新規則）;baseline 不變 |
| 8-g-12-c | `_test-series-title-unresolved` fixture 配套（unsupported-placeholder `{post.unknown}`）| ✅ 完成 | commit `78d1f30`；`content/validation-fixtures/github/posts/_test-series-title-unresolved.md`（+22 行）；baseline `0/9/5` → `0/11/6`（+2 warnings / +1 post：`series-id-not-in-settings` + `series-title-unresolved`；屬預期 fixture 變動，非 regression）|
| 8-g-12-d | docs sync Phase 8-g-12 landings | ✅ 完成 | commit `662bcdf`；`docs/series-schema.md` §15.4.2 / §15.4.3 / §18.5 + `docs/phase-8g-completion-report.md`（baseline 11/6 + Phase 8-g-12 系列子節 + future candidate 收斂）+ 本文件（§3 表格 + §5 收斂）|
| 8-g-13 | publish-bundle §7.5-§7.7 過時描述對齊讀取分析 | ✅ 完成 | 對話內讀取分析；推薦選項 B（保留歷史脈絡 + 補述實際落地；per Phase 8-g-12-b §15.4.3 pattern）；無 commit |
| 8-g-14 | publish-bundle §7.4-§7.7 實際落地對齊（docs-only 實作）| ✅ 完成 | commit `108de25`；`docs/publish-bundle.md`（4 節補述「Phase 8-X 實際落地更新」段落 + cross-link 至 phase-8d/e/f/g-completion-report.md；+57 / −4；§7.1-§7.3 / §8 / §9 未動）|
| 8-g-15 | docs sync publish-bundle §7 對齊收尾 + roadmap 同步 | ✅ 完成 | commit `d81e515`；本文件（§3 表格 + §5.1）+ `docs/phase-8g-completion-report.md`（Header / §1 / §2 / §3 / §5.5 / §7 同步）|
| 8-g-16 | Phase 8-g 剩餘項目短盤點 | ✅ 完成 | 對話內讀取盤點；確認 4 項已完成（Phase 8-g-12 / 14+15 / F3 維持保守 / titleTemplate 升級）+ 9 項仍 pending；推薦下一步 Top 3：B-剩餘（series report）/ candidate 7 / candidate 5 / 6；無 commit |
| 8-g-17-a | B-剩餘 series report `dist-reports/series.txt` 讀取分析 | ✅ 完成 | 對話內讀取分析；確認 dual-output / 獨立 npm script / 含 drafts 排除 archived & fixtures / dual-channel 與 validate warnings；推薦命名 `src/scripts/report-series.js`；無 commit |
| 8-g-17-b | series report script 實作（`src/scripts/report-series.js` + `package.json`）| ✅ 完成 | commit `f21da58`；新增 standalone script 採 `fast-glob` + `gray-matter` 直接掃描；含 status filter + series resolution + resolveTitleTemplate 接入 + group-level missing/duplicate/unresolved 標示；輸出 `dist-reports/series-report.{txt,json}`（ignored）；2 檔 +457 / −0；validate baseline 維持 `0/11/6` |
| 8-g-17-c | docs sync Phase 8-g-17 series report landing | ✅ 完成 | commit `e5f1520`；本文件（§3 表格 + §5.1 ~~B~~ 更新 + ~~H~~ 新增）+ `docs/phase-8g-completion-report.md`（Header / §1 / §2 / §3 / §5 / §7 同步；candidate 1 改為 ✅ landed）|
| 8-g-18-a | candidate 7 Blogger tags inheritance 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件；確認三段式拆批（docs spec → normalize data-layer → build-blogger 接入 → docs sync）|
| 8-g-18-b | `series.tags` schema spec（`docs/series-schema.md` §22 新節 + §19.7 strikethrough）| ✅ 完成 | commit `15c8252`；`docs/series-schema.md` +141 / −1；定義 `series.tags` 為短 slug 陣列（不含 `#`）；與 `series.hashtags` 嚴格分離（per §22.5）；不放 `.publish.json` / `.fb.md`（per §22.6）|
| 8-g-18-c | `normalize-post-output.js` 接入 `series.tags` + 寫入 `normalized.publish.blogger.tags` | ✅ 完成 | commit `48b90af`；`src/scripts/normalize-post-output.js` +53 / 0；fallback chain：`post.tags` (non-empty) → `seriesOut.tags` (non-empty) → `[]`；mirror Phase 8-f-7-b `series.hashtags` backfill pattern；不影響 `promotion.facebook.hashtags`；validate baseline 維持 `0/11/6` |
| 8-g-18-d | `build-blogger.js` 接入 `normalized.publish.blogger.tags`（normalized 優先 + legacy `post.tags` fallback）| ✅ 完成 | commit `a66da18`；`src/scripts/build-blogger.js` +16 / −1；mirror Phase 8-d normalized-priority pattern；保留 legacy `post.tags` fallback（不退場相容層）；既有無 `series.tags` 之 posts 之 `meta.json` byte-identical；validate baseline 維持 `0/11/6` |
| 8-g-18-e | docs sync Phase 8-g-18 candidate 7 landings | ✅ 完成 | commit `564d812`；本文件（§3 表格 + §5.1 candidate 7 新增）+ `docs/phase-8g-completion-report.md`（Header / §1 / §2 / §3 / §5 / §7 同步；candidate 7 改為 ✅ landed）|
| 8-g-19-a | candidate 5 site default hashtags 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件；確認位置 `promotion.config.json` `facebook.defaultHashtags`（非 `site.config.json`）/ 含 `#` / fallback chain step 4 / 與 candidate 6 / 7 之分離 / build-promotion 不需另接 |
| 8-g-19-b | `promotion.facebook.defaultHashtags` schema spec（`docs/promotion-export.md` §11 新節 + `docs/series-schema.md` §15.6 表格 / §19.7 bullet 兩處 strikethrough）| ✅ 完成 | commit `092ac56`；`docs/promotion-export.md` +147 + `docs/series-schema.md` +2 / −2；規格 `string[]` 含 `#`；FB-only；與 `series.hashtags` / `series.tags` 嚴格分離（per §11.5）；不放 sidecar；本批不接 normalize / build pipeline |
| 8-g-19-c | `normalize-post-output.js` 接入 FB hashtags fallback chain step 4 site default backfill | ✅ 完成 | commit `dc64a3f`；`src/scripts/normalize-post-output.js` +41 / 0；mirror Phase 8-f-7-b `series.hashtags` post-pass backfill pattern；觸發條件保守（`promotion.facebook.hashtags.length === 0` AND `settings.promotion.facebook.defaultHashtags` 為非空 array）；不自動補 `#`；不合併；不寫入 Blogger tags / GitHub tags / sidecar；validate baseline 維持 `0/11/6`；既有 FB-enabled post `dist-promotion/facebook/{site}/{slug}.txt` byte-identical |
| 8-g-19-d | docs sync Phase 8-g-19 candidate 5 site default hashtags landings | ✅ 完成 | commit `aab1f03`；本文件（§3 表格 + §5.1 candidate 5 新增）+ `docs/phase-8g-completion-report.md`（Header / §1 / §2 / §3 / §5 / §6 / §7 / §8 同步；candidate 5 改為 ✅ landed）|
| 8-g-20-a | candidate 6 first article hashtags fallback 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件；確認 candidate 6（系列首篇 `.fb.md` hashtags fallback；per series-schema.md §8.2 之 fallback 2 spec 概念）屬「跨文章查找邏輯」之 implicit ergonomic shortcut；複雜度高於 candidate 5 / 7；建議列為 nice-to-have / Phase 8-h+；既有 explicit FB hashtags fallback chain（Phase 8-f-7-b `series.hashtags` / Phase 8-g-19 `defaultHashtags` / Phase 8-g-18 `series.tags` / Phase 8-g-17 series report）已覆蓋主要使用情境 |
| 8-g-20-final | docs sync defer candidate 6 為 nice-to-have / Phase 8-h+ | ✅ 完成 | commit `5c1f731`；`docs/phase-8g-completion-report.md` +26 / −5；§3.1 row 6 標 ⏸ `nice-to-have / Phase 8-h+` + §3.12.5 / §3.13.6 strikethrough redirect + §5.2 移除 candidate 6 + §5.5 補完整 deferred 條目 + §6.2 移除 candidate 6 as next step；6 條決策依據（implicit ergonomic shortcut / explicit fallback chain 覆蓋 / §8.2 spec 概念保留但未接入 normalize chain / 架構成本高 / fixture 受 Phase 8-g-1 deferred 阻擋 / 作者心智模型負擔）；本批不動 source code / 不動 series-schema.md |
| 8-g-21-a | docs housekeeping / roadmap sync 讀取分析 | ✅ 完成 | 對話內分析；未產出獨立文件；盤點 Phase 8-g-19-d / 8-g-20 系列後 staleness；確認 Group A（completion report）+ Group B（future-roadmap）需獨立兩批 sync；推薦拆批為 21-b（completion report）+ 21-c（future-roadmap） |
| 8-g-21-b | phase-8g-completion-report.md housekeeping sync | ✅ 完成 | commit `7bc5e12`；`docs/phase-8g-completion-report.md` +136 / −40；Header 4 處 + §1 item 12 finalize + 新 item 13 / §2.17 finalize `aab1f03` + 新 §2.18 Phase 8-g-20 系列 + §2.19 本批 + §2.20 合計 38 → 40 / §3 摘要列 + 新 §3.14 Phase 8-g-20 落地紀錄（含 6 條決策依據 + candidate 6 狀態明確聲明 + 未來 prerequisite）/ §5.2 placeholder 語意微調 / §7 本批 context 更新 / §8 新增 §8.8 candidate 6 deferred cross-link；本批不動 future-roadmap.md / 不動 series-schema.md / 不動 source code |
| 8-g-21-c | docs sync future-roadmap.md with 8-g-19-d / 8-g-20 / 8-g-21 landings | ✅ 完成 | commit 見本批 git log；本批 `docs/future-roadmap.md` sync；同步 8-g-19-d / 8-g-20 / 8-g-21 landings；candidate 6 標為 ⏸ deferred / nice-to-have / Phase 8-h+；本文件（§3 表格 8-g-19-d ✅ + 新增 8-g-20-a / 8-g-20-final / 8-g-21-a / 8-g-21-b / 8-g-21-c 共 6 列 + §5.1 新增 candidate 6 ⏸ deferred 列）；本批不動 phase-8g-completion-report.md / 不動 series-schema.md / 不動 source code |
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

詳細落地紀錄詳見 commits `44c0e8f` / `5976162` 之 message 與本文件 §3 表格之 8-g-5 / 8-g-6 列；overall completion report 之 §5 / §6 已於 Phase 8-g-8（commit `38a0007`）同步至最新狀態（含 §3.6 Phase 8-g-5 + §3.7 Phase 8-g-6 + §3.8 Phase 8-g-7 落地紀錄）。

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
| ~~B~~ | ~~validation / report 補強分析~~ | ✅ **已全數落地** | validate 規則擴充 / 報表 | Phase 8-g-2-d-b / c / d / e-b 共 4 條 series structure warning 落地（詳見 §3.3）+ Phase 8-g-12-b `series-title-unresolved` 升級為 user-visible warning（詳見 §3.5 candidate F）+ Phase 8-g-17-b series report 落地（詳見 §3.5 candidate H）；本候選之 3 個子議題（structure warnings / titleTemplate unresolved / series report）皆已完成 |
| ~~C~~ | ~~docs consistency / cross-link 補強~~ | ✅ 已於 Phase 8-g-4 系列落地（commits `4730152` + `ddae181` + `eec8ff7`；§5.2.6 `fb-sidecar-schema.md` 未補；詳見 §3.4）| — | — |
| D | Phase 8-g-2 completion report（new-post.js 系列收尾報告）| 純文件 | ❌ 不影響 | 整合 8-g-2-b1 / b2 / c-b / c-c 之完整紀錄、4 個 commit 與保守設計依據 |
| ~~E~~ | ~~sample / template 對齊（deprecated `type` + body leading H1 cleanup）~~ | ✅ 已於 Phase 8-g-5 / 8-g-6 落地（commits `44c0e8f` + `5976162`；2 篇 sample posts + 5 個 templates；詳見 §3.5）；價值：避免未來複製模板或 sample 再產生 `frontmatter-uses-deprecated-type` / `body-leading-h1` noise warning | — | — |
| ~~F~~ | ~~`titleTemplate unresolved` 升級為 user-visible warning（per `docs/series-schema.md` §15.4.2）~~ | ✅ 已於 Phase 8-g-12 落地（commits `a73c064` + `78d1f30`；`validate-content.js` 新增 `series-title-unresolved` 規則 + fixture 配套；validate baseline `0/9/5` → `0/11/6`）；現況描述更新為 `0 error / 11 warning on 6 post(s)`；§3.5 之 source code 層 fallback 退場（Phase 8-h 候選）**仍未啟動** | — | — |
| ~~G~~ | ~~`docs/publish-bundle.md` §7.4-§7.7 過時描述對齊（Phase 8-a 撰寫時預期計畫 vs 實際 Phase 8-d/e/f/g landings）~~ | ✅ 已於 Phase 8-g-13 / 8-g-14 落地（commit `108de25`；採「保留歷史脈絡 + 補述實際落地」pattern；4 節各加「Phase 8-X 實際落地更新」段落 + cross-link 至對應 phase report；§7.1-§7.3 / §8 / §9 未動；validate baseline 仍維持 `0/11/6`）；source code 層 fallback 退場（Phase 8-h 候選）**仍未啟動** | — | — |
| ~~H~~ | ~~series report `dist-reports/series-report.{txt,json}`（candidate 1 / validation / report 補強之最後一片）~~ | ✅ 已於 Phase 8-g-17-b 落地（commit `f21da58`；新增 `src/scripts/report-series.js` + `package.json` 之 `npm run report:series`；採 `fast-glob` + `gray-matter` 直接掃描；含 draft + ready + published；排除 archived + validation-fixtures；依 series.id 分群並標示 missing / duplicate / unresolved；dual-output `.txt + .json`；屬 visibility / dump channel，不接 build pipeline / 不新增 validate 規則；validate baseline 維持 `0/11/6`）；與 candidate ~~B~~ 一同完整收尾 candidate 1 validation / report 補強 | — | — |
| ~~7~~ | ~~Blogger tags inheritance（`series.tags` 短 slug 繼承為 Blogger `post.tags`）~~ | ✅ 已於 Phase 8-g-18 系列落地（commits `15c8252` + `48b90af` + `a66da18`；3 段落地：①`docs/series-schema.md` §22 新節規格化 `series.tags` 短 slug 陣列欄位 ②`src/scripts/normalize-post-output.js` 寫入 `normalized.publish.blogger.tags`（post.tags → series.tags → []）③`src/scripts/build-blogger.js` 改為 `normalized.publish.blogger.tags` 優先 + legacy `post.tags` fallback）；**Blogger tags 與 FB hashtags 維持分離**：`series.tags` 為 Blogger 專用短 slug（不含 `#`）；`series.hashtags` 仍只服務 FB promotion（per §22.5 分離原則；本欄不讀 `series.hashtags`）；**不退場 legacy `post.tags` fallback**（per Phase 8-g-18-d 特別禁止 13）；既有無 `series.tags` 之 posts 之 Blogger `meta.json` byte-identical；validate baseline 維持 `0/11/6` | — | — |
| ~~5~~ | ~~site default hashtags（`promotion.facebook.defaultHashtags` 作為 FB hashtags fallback chain step 4）~~ | ✅ 已於 Phase 8-g-19 系列落地（commits `092ac56` + `dc64a3f`；2 段落地：①`docs/promotion-export.md` §11 新節規格化 `promotion.facebook.defaultHashtags` `string[]` 欄位（位於 `content/settings/promotion.config.json`，**非** `site.config.json`；含 `#`）+ `docs/series-schema.md` §15.6 表格 / §19.7 bullet 兩處 strikethrough redirect 至 §11 ②`src/scripts/normalize-post-output.js` 接入 FB hashtags fallback chain step 4 site default backfill（mirror Phase 8-f-7-b series.hashtags post-pass backfill pattern；觸發保守））；**defaultHashtags 僅限 FB promotion**：`promotion.facebook.defaultHashtags` 為 site-level FB fallback；含 `#`；與 `series.hashtags`（series-level FB）/ `series.tags`（Blogger 短 slug）嚴格分離（per §11.5；三者不可混用 / 不做格式轉換互用）；**不退場 legacy frontmatter `promotion.facebook.hashtags` fallback**（per Phase 8-g-19-c 特別禁止）；既有唯一 FB-enabled post 已於 step 2 legacy frontmatter 命中 + settings 未設定 `defaultHashtags` → 既有 `dist-promotion/facebook/{site}/{slug}.txt` byte-identical；validate baseline 維持 `0/11/6` | — | — |
| ⏸ 6 | candidate 6 first article `.fb.md` hashtags fallback（per `docs/series-schema.md` §8.2 之 fallback 2 spec 概念：「同系列第一篇文章 之 `.fb.md` `hashtags`（若系列尚未定義 `series.hashtags`）」）| ⏸ **`nice-to-have / Phase 8-h+`**（per Phase 8-g-20-a 讀取分析 + Phase 8-g-20-final docs sync 之保守延後決策；commit `5c1f731`）；**不是 landed**；**不在 Phase 8-g 內排程**；屬 implicit ergonomic shortcut（「作者於系列首篇 `.fb.md` 設 hashtags 後，其他同系列文章自動繼承」），**不屬 Phase 8-g 必要收尾**；既有 explicit FB hashtags fallback chain（Phase 8-f-7-b `series.hashtags` series-level / Phase 8-g-19 `defaultHashtags` site-level / Phase 8-g-18 `series.tags` Blogger 獨立 namespace / Phase 8-g-17 series report visibility）已覆蓋主要使用情境；§8.2 spec 概念**保留**但**尚未接入 normalize chain**；未來若要落地需先補完整 docs spec（trigger conditions / self-ref guard / duplicate `series.number` tie-break / `draft` 排除 / cross-site lookup / chain 插入位置等多處 underspecified），再接 normalize chain（架構成本高：normalize-post-output.js per-post 純函式設計需破壞）；詳見 `docs/phase-8g-completion-report.md` §3.14 / §5.5 / §8.8 | — | 不在 Phase 8-g 排程；屬 Phase 8-h+ 候選 |

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
- `docs/phase-8g-completion-report.md`（Phase 8-g overall 收尾報告；初版 commit `c3b6c63`；候選 C 落地後更新 commit `eec8ff7`；sample/template/roadmap landings 同步 commit `38a0007`；含 §3.5 Phase 8-g-4 candidate C + §3.6 Phase 8-g-5 sample post + §3.7 Phase 8-g-6 templates + §3.8 Phase 8-g-7 roadmap 落地紀錄；8-g-1 fixture 仍 deferred；Phase 8-g overall 仍 🔄 進行中）

### 7.3 規格與設計文件

- `docs/series-schema.md` §15-§19（Phase 8-f 各子批次落地紀錄）
- `docs/promotion-export.md` §10（promotion manifest 4 個 additive 欄位）
- `docs/fb-sidecar-schema.md` §12.3.1（Blogger tags / FB hashtags 格式分離）
- `docs/publish-bundle.md` / `docs/publish-json-schema.md`（sidecar bundle / publish.json schema）
- `docs/migration-from-frontmatter.md`（既有 frontmatter 遷移指南）

### 7.4 專案規範

- `CLAUDE.md`（專案開發規範與分階段計畫）
