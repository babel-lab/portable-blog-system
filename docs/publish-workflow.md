# N-01 publish workflow

本專案的「人工發布流程」總索引。本機 Markdown 為唯一資料來源，輸出至 GitHub Pages 與 Blogger 兩個平台。

---

## 1. 整體流程概覽

```text
撰文（content/）→ 驗證 → build → 發布 → 後續（推廣 / 備份 / 回填）
```

### 兩個平台的核心差異

- **GitHub Pages**：`npm run build` 後將 `dist/` 部署到 GitHub Pages（本專案不模擬 push 流程，依平台預設）
- **Blogger**：`npm run build:blogger` 產出可貼用 HTML，**人工複製**到 Blogger 後台發布

兩平台共用 Markdown 來源，但走不同 build script。

---

## 2. 發布前置（撰文時）

請依以下檢查清單於 frontmatter 補齊資訊：

- 一般 SEO：`docs/checklists/seo-checklist.md` §1
- FB 推廣（如 enabled）：`docs/checklists/fb-promotion-checklist.md` §1
- 圖片：`docs/checklists/image-upload-checklist.md`

`status` 維持 `"ready"` 或 `"published"`，`draft: false` 才會進 build。

---

## 3. Build 與檢查

執行順序（重要）：

```bash
npm run validate:content     # 0 errors / 0 warnings 才繼續
npm run build                # GitHub 站 build（含 prebuild）
npm run build:sitemap        # 必須在 vite build 之後（vite 會清空 dist/）
npm run build:blogger        # Blogger HTML
npm run build:promotion      # FB 推廣 .txt
npm run build:blogger-theme  # Blogger 可貼用 CSS（首次貼主題用）
```

---

## 4. 發布

依平台拆三條主線：

### 4.1 GitHub Pages
依 `docs/checklists/github-deploy-checklist.md`。

### 4.2 Blogger
依 `docs/checklists/blogger-publish-checklist.md`。
複製 `dist-blogger/posts/{slug}/post.html` 內容到 Blogger HTML 編輯器。

### 4.3 FB 粉絲頁推廣
依 `docs/checklists/fb-promotion-checklist.md`。
複製 `dist-promotion/facebook/{site}/{slug}.txt` 到 FB 發文框。

---

## 5. 後續

- **回填 Blogger URL**：發布後將正式 URL 回填到文章 frontmatter `blogger.publishedUrl / bloggerPostId / publishedAt`（CLAUDE.md §24）
- **備份**：依 `docs/checklists/backup-checklist.md`
- **圖片素材**：依 `docs/checklists/image-upload-checklist.md` §6 備份原始檔

---

## 6. Reports（待 Phase 7-b 補完）

未來於 `dist-reports/` 提供：
- build report：彙總 ready / draft 數量、warning 數、產物 manifest
- draft posts report：未發布草稿清單
- missing tags report：用到但未定義於 `tags.json` 的 tag
- published URL report：Blogger URL 是否回填

---

## 7. Checks（待 Phase 7-c 補完）

未來於 `dist-reports/` 提供：
- broken links check：站內死連結
- image links check：圖片連結 / cover 路徑可達性

---

## 8. 新文章建立前置檢查（撰文 SOP）

在 `npm run new:post` 或手動建立新 `.md` 之前，作者應決定下列項目：

| 項目 | 決定要點 | 影響 |
|---|---|---|
| **文章主題** | 一句話描述；對應未來 H1 / Blogger 標題 / FB 文案核心 | 決定 `title` / `titleEn` / `description` |
| **slug / 檔名** | 短英文 slug；建議 `kebab-case`；對應 URL 末段；不含中文 | 決定 `slug` + `.md` 檔名（建議 `YYYYMMDD-{slug}.md`） |
| **status 初始狀態** | 新文章預設 `draft`；待內容齊備後再轉 `ready` | 決定是否進入 build |
| **contentKind** | `post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page`（per CLAUDE.md §11）；**不再使用 legacy `type`**（屬 Phase 8-h 退場對象）| 決定文章類型；影響 EJS template / category / 部分 SCSS class |
| **category / tags** | category 必須存在於 `content/settings/categories.json`；tags 必須存在於 `content/settings/tags.json`（用 id 或 slug） | 影響 GitHub category / tag 頁；validate-content 檢查 |
| **cover / coverAlt** | cover 圖 URL（可為 Google Drive / Blogger 上傳 / GitHub raw URL）；coverAlt 為短描述（建議 < 100 chars） | 影響 OG image / 文章 hero 區塊 / FB preview |
| **title / titleEn** | title 為中文標題；titleEn 為英文標題（FB / OG / 搜尋輔助）；兩者預設一致來源（per `docs/series-schema.md` §6） | 影響 SEO meta / Blogger 標題 / FB title |
| **是否屬於 series** | 若是 → 決定 `series.id`（必須於 `content/settings/series.json` 有對應 entry）+ `series.number`（可跳號）；可選 `series.subtitle` / `series.name` override | 影響 series report / copy-helper / 未來 series page |

**建議流程**：

```bash
npm run new:post -- --slug "my-new-post" --series-id "we-media-ai-52" --series-number 7
```

`new-post.js` 會於 stderr 印出 next series.number suggestion（per Phase 8-g-2-c-c）；屬建議性質；作者可 override。

---

## 9. publish bundle 三檔使用流程

每篇正式文章對應三個檔案（per `docs/publish-bundle.md` §2）：

| 檔名 | 角色 | 必要性 |
|---|---|---|
| `{slug}.md` | **內容主體 + 過渡 frontmatter**；Markdown 內容 + 內容屬性 metadata（title / category / tags / series / cover / contentKind 等） | ✅ 必要 |
| `{slug}.publish.json` | **平台發布資料 sidecar**；canonical / publishTargets / blogger publishedUrl / github status / SEO metaTitle / metaDescription 等 | ⚠️ 過渡為必要；新建議於 ready 前補上 |
| `{slug}.fb.md` | **Facebook 推廣 sidecar**；FB 專用 enabled / page / hashtags / target / message / body | 🟡 選填；僅當 FB enabled 時建立 |

**三檔角色分工 SOP**：

1. **新建文章時**：先建 `.md`（含 frontmatter）；`.publish.json` 與 `.fb.md` 可後續補建
2. **進入 `ready` 前**：建議建立 `.publish.json` 並補入 `publish.canonical.source` / `publish.publishTargets.*.enabled`；若 FB enabled，補建 `.fb.md`
3. **`.md` frontmatter 過渡定位**：legacy frontmatter（如 `promotion.facebook.hashtags` / `canonical` / `publishedUrl` 等舊欄位）仍可用，但**屬過渡相容路徑**（per `docs/migration-from-frontmatter.md`）；新建議走 sidecar 路徑；source code 之 legacy fallback 退場屬 Phase 8-h
4. **sidecar 內容屬性 vs 平台屬性分工**（per `docs/publish-bundle.md` §1.1 / §1.2）：
   - 內容屬性（如 `series`、`tags`、`title`）→ 放 `.md` frontmatter
   - 平台屬性（如 `canonical.url`、`blogger.publishedUrl`）→ 放 `.publish.json`
   - FB 專用屬性（如 `hashtags`、`message`、`page`）→ 放 `.fb.md`

---

## 10. status transition SOP

文章生命週期：`draft → ready → published`（→ 可選 `archived`）。

| 狀態 | 進入條件 | 應檢查項 | 動作 |
|---|---|---|---|
| `draft` | 新建文章預設；內容未齊備 | — | 撰寫 markdown 內容；補 frontmatter；可暫存 |
| `ready` | 內容完整；frontmatter 必填欄位齊備；SEO / cover / tags 已決定 | `npm run validate:content` 應為 `0 error`；warning 可接受但需理解 | 可進入 build；可手動發布至 Blogger（但 `publishedUrl` 尚未回填） |
| `published` | 已實際發布至平台（Blogger 已貼上 / GitHub Pages 已部署） | `publishedUrl` 已回填；`publishedAt` 已記錄 | 進入維護階段；可被 promotion / sitemap 收錄 |
| `archived`（可選） | 退役文章；不再列在新文章流；保留歷史 | — | 不出現在首頁 / 列表；可保留於 sitemap / search |

**進 Blogger 手動發布之前置**：

- `status` 為 `ready` 或 `published`（不能 `draft`）
- `publish.publishTargets.blogger.enabled === true`
- `npm run build:blogger` 已成功；`dist-blogger/posts/{slug}/post.html` 已產生
- 已閱讀 `dist-blogger/posts/{slug}/publish-checklist.txt` 與 `copy-helper.txt`

**回填 publishedUrl 時機**：發布**之後**立即回填；詳見 §13。

---

## 11. Blogger 發布流程 SOP（補強 §4.2）

**build-blogger / copy-helper 使用定位**：

- `dist-blogger/posts/{slug}/post.html`：可直接複製到 Blogger HTML 編輯器之 body
- `dist-blogger/posts/{slug}/copy-helper.txt`：人工輔助清單（標題 / 搜尋說明 / 標籤 / 自訂網址 等）；供 Blogger 後台逐欄填入
- `dist-blogger/posts/{slug}/meta.json`：機器可讀 metadata；下游工具（如 promotion）使用
- `dist-blogger/posts/{slug}/publish-checklist.txt`：發布勾選清單

**手動貼到 Blogger 後檢查項**（per `docs/checklists/blogger-publish-checklist.md`）：

- [ ] Blogger 標題已貼
- [ ] Blogger HTML 已貼
- [ ] Blogger 搜尋說明已貼
- [ ] Blogger 自訂網址已設定（依 copy-helper.txt 之 slug 建議）
- [ ] Blogger 標籤已設定（依 copy-helper.txt 之 tag 清單）
- [ ] Blogger 預覽桌機版 / 手機版皆正常
- [ ] 圖片可正常顯示
- [ ] AdSense 區塊未破版
- [ ] **發布後 URL 已回填**（per §13）
- [ ] FB 推廣文案已複製（若 FB enabled）

**Blogger URL 不可預測**（per `docs/publish-json-schema.md` §5.3）：

- Blogger 之 `yyyy/mm` 路徑由 Blogger 平台依**實際發布時間**決定
- 系統**永遠不預測** Blogger URL；不於 `build-blogger` 階段填入 `publishedUrl`
- `publishedUrl` 為 `null` 直到作者手動回填；屬「Blogger 發布完成後的正式回填」步驟
- 即使作者預期之 `yyyy/mm`（如 5 月發布），亦**不應**預填 placeholder URL

---

## 12. Facebook promotion 流程 SOP（補強 §4.3）

**`.fb.md` 角色**（per `docs/fb-sidecar-schema.md`）：

- FB 專用 sidecar；frontmatter（7 欄位 + Phase 8-e-2 之 titleEn 第 8 欄）+ body 為完整 FB 貼文文字
- **僅當作者要做 FB 推廣時建立**；非必要

**FB title / titleEn / excerpt / hashtags 使用原則**：

- **title**（`.fb.md` frontmatter）：FB / OG 標題；空字串時 fallback 至 `.md` frontmatter `title`（per `docs/series-schema.md` §6）
- **titleEn**（`.fb.md` frontmatter；Phase 8-e-2）：FB 端英文標題 metadata；目前未在 `.txt` 顯示；保留供未來
- **excerpt**：屬 `.md` frontmatter；FB 端目前不直接讀，但會經 normalize 暴露於 manifest
- **hashtags**（`.fb.md` frontmatter）：含 `#` prefix；array of string

**Blogger 與 FB title 預設一致但允許手動調整**（per series-schema §6）：

- 預設來源：`.md` frontmatter `title`
- 若 `.fb.md` `title` 非空 → 採用 `.fb.md` `title`（單篇 override）
- Blogger 端用 `.publish.json` `seo.metaTitle` 或 fallback 至 `.md` `title`
- 三處皆允許手動分歧；SEO 一致性靠作者紀律

**hashtags 預設繼承與 override 原則**（per `docs/promotion-export.md` §11 / `docs/series-schema.md` §19）：

FB hashtags fallback chain（5 段；per Phase 8-g-19 後）：

```
[step 1] .fb.md.hashtags                                       （sidecar-first；非空 array）
[step 2] legacy frontmatter.promotion.facebook.hashtags        （非空 array；過渡）
[step 3] series.hashtags（Phase 8-f-7-b）                       （非空 array；series-level）
[step 4] settings.promotion.facebook.defaultHashtags            （site-level；Phase 8-g-19）
[step 5] []
```

- 單篇 override 採完整覆寫（不合併）；per series-schema §8.4
- 若想沿用 `series.hashtags` 但補 1-2 個單篇 hashtag，需於 `.fb.md` 完整列出（含 series 之 hashtags）

---

## 13. publishedUrl backfill SOP（補強 §5 後續）

**何時回填**：Blogger 文章發布**之後立即**回填；不可預測；不可延後（會影響 canonical / FB finalUrl / promotion 連結正確性）。

**回填到哪裡**（per CLAUDE.md §24 / `docs/publish-json-schema.md` §5.3）：

`{slug}.publish.json` 之以下欄位（推薦走 sidecar 路徑）：

```json
{
  "blogger": {
    "status": "published",
    "publishedUrl": "https://yourblog.blogspot.com/2026/05/your-post-slug.html",
    "bloggerPostId": "1234567890123456789",
    "publishedAt": "2026-05-12T08:30:00+08:00"
  }
}
```

或 legacy 路徑（過渡）：`.md` frontmatter `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`。

**回填後應跑哪些 report / check**：

```bash
npm run validate:content    # 確認 baseline 不退步
npm run build:blogger       # 確認 Blogger meta.json 含正確 publishedUrl
npm run build:promotion     # 確認 FB finalUrl 採用 publishedUrl
npm run report:urls         # published URL 回填統計
```

**不要預測 Blogger URL**：

- 即使預期 `yyyy/mm`（如 5 月發布 → 推測 `/2026/05/`），系統與作者皆**不應**預先填入 placeholder URL
- 屬 `null` 直到實際發布後取得正式 URL；以實際結果為準

---

## 14. series 文章 SOP

**series.id**：

- 必須存在於 `content/settings/series.json` 之 entries（per `docs/series-schema.md` §11）
- 若未存在，`validate:content` 會 warn `series-id-not-in-settings`（per Phase 8-g-2-d-b）
- 建議於建立新 series 時先補 `series.json` entry

**series.number**：

- 屬「**創作層級**之編號」；**不一定**等同於發布順序（per series-schema §4.1）
- **可跳號發布**：如先發 `#1` → `#2` → `#4`，之後回頭發 `#3`
- 系統可建議補洞序號（`npm run new:post -- --series-id X` 會於 stderr 印出 next number suggestion；per Phase 8-g-2-c-c）
- **作者可 override**：手動 `--series-number N` 強制指定；系統不擋

**hashtags / tags 三層分工**（per Phase 8-g-18 / 8-g-19 / 8-g-20 系列）：

| 欄位 | 服務對象 | 格式 | fallback chain 位置 |
|---|---|---|---|
| `series.hashtags`（series-level）| Facebook promotion | `#` prefix | step 3（per Phase 8-f-7-b）|
| `promotion.facebook.defaultHashtags`（site-level）| Facebook promotion | `#` prefix | step 4（per Phase 8-g-19）|
| `series.tags`（series-level）| Blogger labels | 短 slug；**不含 `#`** | Blogger 獨立 namespace（per Phase 8-g-18）|

**candidate 6（首篇 `.fb.md` hashtags 自動繼承）已 deferred**（per Phase 8-g-20-final；commit `5c1f731`）：

- **不依賴**「首篇 `.fb.md` hashtags 自動繼承」之 implicit shortcut
- 若想讓系列其他文章繼承首篇 hashtags → 走 explicit 路徑：於 `series.json` 之 `series.hashtags` 顯式設定
- candidate 6 屬 `nice-to-have / Phase 8-h+`；尚未接入 normalize chain

---

## 15. 最小必要欄位清單

| 欄位 | 階段 | 必填 / 建議 | 目的 | 常見錯誤 |
|---|---|---|---|---|
| `id` | draft 起 | 必填 | 文章唯一識別；推薦 `YYYYMMDD-{slug}` | 重複 id 會造成 validate error |
| `site` | draft 起 | 必填 | `github` / `blogger`；決定走哪條 build pipeline | 寫錯 site 會被 loadPosts 過濾 |
| `slug` | draft 起 | 必填 | URL 末段；短英文 | 含中文 / 空格 / 特殊字元會破壞 URL |
| `contentKind` | draft 起 | 必填 | 文章類型（`post` / `tech-note` / `book-review` 等）；**不再用 legacy `type`** | 用 `type` 會觸發 `frontmatter-uses-deprecated-type` warning |
| `title` | draft 起 | 必填 | 中文標題；對應 H1 / SEO / OG | 空字串會 fallback 但 SEO 受損 |
| `date` | draft 起 | 必填 | 創作日期；ISO 8601（如 `2026-05-12`） | 寫成 `YYYY/MM/DD` 會被解析失敗 |
| `status` | draft 起 | 必填 | `draft` / `ready` / `published` / `archived` | 與 `draft: true/false` 之關係：兩者皆可，新建議走 `status` |
| `category` | ready 前 | 必填 | 必須存在於 `categories.json` | 不存在會 warn |
| `tags` | ready 前 | 建議 | array；必須存在於 `tags.json` | 不存在會 warn |
| `cover` | ready 前 | 建議 | 封面圖 URL | 空字串時無 OG image |
| `coverAlt` | ready 前 | 建議 | 封面圖 alt 文字 | 缺 alt 會 fallback 至 title（per normalize-post-output） |
| `description` | ready 前 | 建議 | 文章摘要；SEO meta description 來源 | 空字串時 SEO 受損 |
| `titleEn` | ready 前 | 選填 | 英文標題；FB / OG / 搜尋輔助 | — |
| `publish.canonical.source` | ready 前 | 建議 | `blogger` / `github` / `auto`；決定 canonical platform | `auto` 時取 `primaryPlatform` |
| `publish.publishTargets.{platform}.enabled` | ready 前 | 建議 | 是否輸出至該平台 | 兩平台皆 false 時 build 不輸出 |
| `promotion.facebook.enabled`（或 `.fb.md.enabled`） | ready 前 | 選填 | FB 推廣開關 | true 時必須補 `.fb.md` 或 legacy hashtags |
| `series.id` | 系列文章 ready 前 | 選填（系列才填） | 必須存在於 `series.json` | 不存在會 warn |
| `series.number` | 系列文章 ready 前 | 選填（系列才填） | 可跳號 | duplicate 會 warn |
| `publish.blogger.publishedUrl` | published 後 | 必填（已發布之 Blogger 文章） | 正式 URL；canonical / FB finalUrl 依賴此 | 不可預測；屬發布後回填 |
| `publish.blogger.publishedAt` | published 後 | 建議 | 實際發布時間 | ISO 8601 |
| `publish.blogger.bloggerPostId` | published 後 | 建議 | Blogger 內部 post ID | 用於未來工具識別 |

---

## 16. 本 Phase 9-b 不做

以下項目**不在本批 scope**；屬後續 Phase 9-c+ 或更晚：

| # | 項目 | 理由 |
|---|---|---|
| 1 | 工具實作（如 publishedUrl backfill CLI helper / status transition checker） | 屬 Phase 9-c 實作批次；本批 docs only |
| 2 | 新增 CLI 指令 | 同上 |
| 3 | 修改 build output | 本批不影響 dist baseline；維持 byte-identical |
| 4 | 修改 schema（`.publish.json` / `.fb.md` / `.md` frontmatter） | 本批不動 schema |
| 5 | 修改 validate rules | 本批不新增 / 不修改 `validate-content.js` 規則 |
| 6 | Phase 8-h legacy fallback 退場 | 屬獨立 Phase 8-h；不在 Phase 9 範圍 |
| 7 | 解封 Phase 8-g-1 fixture deferred | 觸發條件未滿足；維持 deferred |
| 8 | 實作 candidate 6（首篇 `.fb.md` hashtags 自動繼承） | 屬 nice-to-have / Phase 8-h+；尚未接入 normalize chain |
| 9 | 新增 `docs/author-sop.md` | 本批 SOP 內容整合於本文件；未來如要拆分為獨立 docs，屬另開批次 |
| 10 | 修改 `docs/checklists/*.md` | 本批不動既有 checklist；如要強化 checklists 之 cross-link / 互補性，屬另開批次 |
| 11 | 修改 Phase 8-g 相關文件（`docs/phase-8g-completion-report.md` / `docs/future-roadmap.md` / `docs/series-schema.md` / `docs/promotion-export.md` / `docs/publish-bundle.md` / `docs/publish-json-schema.md` / `docs/fb-sidecar-schema.md`） | 本批不回頭修改 Phase 8-g 文件；維持 Phase 8-g pause-state |

---

## 相關文件

- 規範來源：`CLAUDE.md` §6 Phase 7、§22 圖片素材、§24 Blogger URL 回填、§25 備份搬家
- Phase 3 細節：`docs/blogger-export.md`
- Phase 4 細節：`docs/promotion-export.md`
- Phase 5 細節：`docs/seo-ga4-adsense.md`
- 部署細節：`docs/github-deploy.md`
- 備份細節：`docs/backup-and-migration.md`

---

See also:
- `docs/publish-bundle.md` §2.6（三檔欄位分工）
- `docs/migration-from-frontmatter.md` §7（人工遷移 10 步）
- `docs/checklists/sidecar-migration-checklist.md`（三檔遷移檢查表）
