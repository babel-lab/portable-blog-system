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
npm run build                # GitHub 站 build（含 prebuild data + postbuild sitemap auto-chain）
# npm run build:sitemap      # 已由 postbuild 自動 chain；獨立 idempotent，可單獨手動執行
npm run build:blogger        # Blogger HTML
npm run build:promotion      # FB 推廣 .txt
npm run build:blogger-theme  # Blogger 可貼用 CSS（首次貼主題用）
```

### `npm run build:sitemap` 注意事項

`npm run build:sitemap` 自 Phase deploy-workflow-defense 起**已接入 npm `postbuild` lifecycle hook**：每次 `npm run build` 完成後 npm 會自動 chain `build:sitemap`，無需人為記憶順序。

仍保留為**獨立 idempotent script**；可手動單獨執行（如僅想重產 sitemap 而不 rebuild 整站）。

產出：

- `dist/sitemap.xml`（GitHub Pages 站之 sitemap；含 home / post-list / 各 ready post / categories / tags）
- `dist/robots.txt`（GitHub Pages 站之 robots；含 `Sitemap:` 引用 + `Disallow: /design-system/` + `Disallow: /404.html`）

**為何採 postbuild chain**：

vite build 之 `emptyOutDir: true` 行為（per `vite.config.js`）會清空 `dist/` 後再寫入；若 sitemap 在 build 之前產生會被清掉。先前依賴人工記憶之 ordering 多次被遺忘（含 2026-05-19 之 image size deploy 之 sitemap regression，per `docs/phase-10-completion-report.md` 之後續紀錄），改用 npm 標準 lifecycle hook 自動化保證順序。

**對稱 lifecycle hook**：

```
prebuild  → node src/scripts/build-github.js --mode=build   # build 前產 .cache/pages/ data
build     → vite build                                       # vite 將 .cache/pages/ 轉至 dist/
postbuild → npm run build:sitemap                            # build 後產 dist/sitemap.xml + dist/robots.txt
```

**範圍**：

- 只針對 **GitHub Pages** site（per `site.config.json.githubSiteUrl`）
- **不**產生 Blogger sitemap（Blogger 平台自行管理 sitemap / robots）
- **不**包含 Blogger publishedUrl（不會與 GitHub canonical 混入）

**dist 與 git 之關係**：

- `dist/sitemap.xml` + `dist/robots.txt` 屬 `.gitignore` 內（per `dist/*` 排除規則）
- 不入 git；屬部署流程之 build output；GitHub Pages 部署時需含整個 dist/ 內容

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

## 6. Reports

per `npm run report:*`；輸出至 `dist-reports/`：
- `npm run report:build`：彙總 ready / draft 數量、warning 數、產物 manifest → `build-report.{txt,json}`
- `npm run report:drafts`：未發布草稿清單 → `draft-posts-report.{txt,json}`
- `npm run report:missing-tags`：用到但未定義於 `tags.json` 的 tag → `missing-tags-report.{txt,json}`
- `npm run report:urls`：Blogger URL 是否回填 → `published-urls-report.{txt,json}`
- `npm run report:series`：series metadata 一致性 → `series-report.{txt,json}`（Phase 9-f-b 補充）
- `npm run report:book`：book metadata 一致性 → `book-report.{txt,json}`（Phase 9-f-b-1 補充）

---

## 7. Checks

per `npm run check:*`；輸出至 `dist-reports/`：
- `npm run check:links`：站內死連結檢查 → `check-broken-links-report.{txt,json}`
- `npm run check:images`：圖片連結 / cover 路徑可達性 → `check-image-links-report.{txt,json}`

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

**書評 / 雜誌類文章（`contentKind: "book-review"`）補述**（per Phase 9-f-c 落地之 manual posting helper）：

書評 / 雜誌類文章手動貼到 Blogger 時，除上述基本檢查項外，可另參考：

- `dist-blogger/posts/{slug}/copy-helper.txt` 之 **[12] 書籍 / 內容來源 metadata** 區塊（per `docs/book-schema.md` §13）：書名 / 作者 / 出版社 / 出版年 / ISBN / 雜誌 issue 等欄位之純文字傾印；conditional show（僅 `post.book` 為 plain object 時顯示）；mediaType-aware
- `dist-blogger/posts/{slug}/publish-checklist.txt` 之 **書籍 / 雜誌內容檢查（book-review 類）** 區塊（per `docs/book-schema.md` §14）：3 項 checkbox（copy-helper [12] 對照確認 / `book.coverImage` URL 確認 / mediaType=magazine 期數標示確認）
- 完整收尾紀錄：`docs/phase-9f-c-completion-report.md`（Phase 9-f-c **子系列**收尾；⚠️ 註：本子系列收尾**不等於** Phase 9-f 整體收尾 —— Phase 9-f-e / 9-f-f / 9-f-g 仍未啟動，Phase 9 overall 仍 🔄 進行中）

**相關連結 / 其他連結補述**（per Phase 9-g-d / 9-g-e 落地之 manual posting helper）：

含 `relatedLinks` / `otherLinks` 之文章手動貼到 Blogger 時，除上述基本檢查項外，可另參考：

- `dist-blogger/posts/{slug}/post.html` 之「相關連結 / 其他連結」區塊（per Phase 9-g-d-b）：HTML body 已自動輸出 `<aside class="lab-related-links">` / `<aside class="lab-other-links">`；複製 HTML 整段時即包含
- `dist-blogger/posts/{slug}/copy-helper.txt` 之 **[13] 相關連結 / 其他連結**（per Phase 9-g-d-c）：純文字確認清單；**只供作者對照，不需手動貼到 Blogger**
- `dist-blogger/posts/{slug}/publish-checklist.txt` 之 **相關連結 / 其他連結內容檢查** 區塊（per Phase 9-g-e-b）：僅當文章有 renderable `relatedLinks` / `otherLinks` 時顯示；含連結數量 / external rel auto / internal url 提醒 / url-title 空 item skip 提示
- **GitHub 端**：`dist/posts/{slug}/index.html` 之「相關連結 / 其他連結」區塊（per Phase 9-g-f-b）：HTML body 已自動輸出（包覆 `<div class="lab-container">`）；GitHub Pages 部署後讀者直接看到，**無需手動操作**
- 完整 schema 詳見 `docs/related-links-schema.md`

注意事項：

- **internal link 之 url 應為已發布後回填之真實 URL**（per `docs/publish-json-schema.md` §5.3 Blogger URL 不可預測禁則）；若目標 Blogger 文章尚未發布，可先不加入或讓 url 保持空值，render 會 skip 該 item
- **external link 之 `target="_blank"` / `rel="nofollow noopener"` 由 render 階段依 `kind` 自動套用**，作者**不需手填**
- **`[Youtube]` / `[台北市立圖書館]` 等顯示前綴應拆入 `platform` 欄位**，**不**併入 `title`
- **`relatedLinks` / `otherLinks` 屬內容屬性**，**不放** `.publish.json` 與 `.fb.md`（per `docs/publish-bundle.md` §2.6.4 硬性原則）

**聯盟連結 affiliate box GitHub 端補述**（per Phase 9-h-b-b 落地之 GitHub article block parity）：

- GitHub 端現在除 `relatedLinks` / `otherLinks` 外，若文章 frontmatter 有 `affiliate.enabled: true` 與 `affiliate.position.top: true` 或 `affiliate.position.bottom: true`，`dist/posts/{slug}/index.html` 也會自動輸出「立即購買」affiliate box（mirror Blogger `lab-affiliate-box` BEM；`rel="sponsored nofollow noopener noreferrer"` + `target="_blank"` 由 render 自動套用）
- Blogger 端原 affiliate 流程**完全不變**（per `src/views/blogger/blogger-post-full.ejs` 既有 `<aside class="lab-affiliate-box">` 區塊；無修改）

**教具下載 download box GitHub 端補述**（per Phase 9-h-c-b 落地之 GitHub article block parity）：

- GitHub 端現在若文章 frontmatter 有 `download.enabled: true` 且 `download.fileUrl` 有值，`dist/posts/{slug}/index.html` 也會自動輸出 Download Box（mirror Blogger `lab-download-box` BEM；`<a class="lab-download-box__cta">` 使用 HTML5 `download` 屬性，**不**加 `target` / `rel`；可選 `title` / `description` / `fileType` badge / `licenseNote` 條件渲染）
- Blogger 端原 download 流程**完全不變**（per `src/views/blogger/blogger-post-full.ejs` 既有 `<aside class="lab-download-box">` 區塊；無修改）

**Hashtag GitHub 端補述**（per Phase 9-h-d-b 落地之 GitHub article block parity）：

- GitHub 端現在若文章 frontmatter 有 `blocks.hashtags: true` 且 `tags` 非空 array，`dist/posts/{slug}/index.html` 也會自動輸出 Hashtag 區塊（mirror Blogger `lab-hashtags` / `lab-hashtag` BEM；`<ul class="lab-hashtags">` 內每 tag 渲染為 `<li><span class="lab-hashtag">#tag</span></li>`）
- Hashtag 為 **display-only span**，**不是連結**；**不**加 `href` / `target` / `rel`（mirror Blogger 之 non-link pattern；hashtag link / GA4 tag_click event 屬未來增強候選）
- Blogger 端原 hashtag 流程**完全不變**（per `src/views/blogger/blogger-post-full.ejs` 既有 `<ul class="lab-hashtags">` 區塊；無修改）

**Book Photo GitHub 端補述**（per Phase 9-h-e-b 落地之 GitHub article block parity）：

- GitHub 端現在若文章 frontmatter `contentKind: "book-review"` 且 `book.showBookPhoto: true` 與 `book.coverImage` 有值，`dist/posts/{slug}/index.html` 也會自動輸出 Book Photo 區塊（mirror Blogger `lab-book-photo` BEM；`<figure class="lab-book-photo">` + `<img class="lab-book-photo__image">`；title 有值時輸出 `<figcaption class="lab-book-photo__caption">《title》` 含可選 ` — publisher` nested append；img alt 三層 fallback `coverAlt → title → 空字串`）
- 本功能目前為 **dormant render**：因 `content/github/posts/` 無 ready book-review post（兩篇 ready posts 均為 `contentKind: tech-note`），4 條 AND guard 之 ① 即 fail，dist 對既有 ready posts 完全不輸出；infrastructure ready 當未來新增 ready book-review GitHub post 時自動激活 render
- Blogger 端原 book photo 流程**完全不變**（per `src/views/blogger/blogger-post-full.ejs` 既有 `<figure class="lab-book-photo">` 區塊；無修改）

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

**推薦自動化路徑**：`npm run backfill:url`（Phase 9-c-1 落地；commit `f5f71b4`）：

四種常用呼叫範例：

```bash
# 1. 以 id 識別 post（基本用法；--url 與 --published-at 皆為必填真值）
npm run backfill:url -- --id "<post-id>" --url "<blogger-url>" --published-at "<iso>"

# 2. 以 slug 識別 post
npm run backfill:url -- --slug "<slug>" --url "<blogger-url>" --published-at "<iso>"

# 3. dry-run（只印 plan；不寫入）
npm run backfill:url -- --id "<post-id>" --url "<blogger-url>" --published-at "<iso>" --dry-run

# 4. 完整選填（加上 bloggerPostId）
npm run backfill:url -- --id "<post-id>" --url "<blogger-url>" --published-at "<iso>" --blogger-post-id "<id>"
```

本工具行為（per `src/scripts/backfill-published-url.js`）：

1. **只寫既有 `.publish.json`**（之 `blogger.publishedUrl` / `publishedAt` / `status: "published"` / `publishYear` / `publishMonth`（由 `publishedAt` 推導）/ `bloggerPostId`（若提供））
2. **不建立 `.publish.json`**（屬本批未支援之 `--create-sidecar` flag）
3. **不寫 `.md` frontmatter legacy 欄位**（若 legacy 已存在 `blogger.publishedUrl` → stderr warning，不自動清除）
4. **不預測 Blogger URL**（`--url` 必須由作者於 Blogger 後台複製貼上；`/yyyy/mm/` pattern 由 Blogger 平台依實際發布時間產生）
4b. **不預測 `publishedAt`**（`--published-at` 為必填；缺省 → 寫入前 exit 1，**不**回填當下時間、**不**由當下時間推導 `publishYear` / `publishMonth`；per `docs/publish-json-schema.md` §5.4 + CLAUDE.md §3a Red lines。契約由 `npm run check:backfill-published-url` 保護）
4b-2. **`--published-at` 必須為嚴格 ISO 8601**（`YYYY-MM-DD` 或 `YYYY-MM-DDThh:mm[:ss][Z|±hh:mm]`）。JS `new Date()` 之 legacy parser 會接受 `2026-05-15 10:00`（空格取代 `T`）、`May 15, 2026`、`2026/05/15` 等形式，但 4c 之嚴格推導無法自其取得年月 → 若放行，將寫出 `status: "published"` 但 `publishYear` / `publishMonth` 為空字串之 sidecar，與 `publishedUrl` 之 `/yyyy/mm/` 不一致（§9.5）。故此類值於**寫入前** exit 1，並於 stderr 指引正確格式。不變式：凡 `resolvePublishedAt` 接受之值，`deriveYearMonth` 必推得非空年月。契約由 `npm run check:backfill-published-url` 保護
4c. **`publishYear` / `publishMonth` 取自 `--published-at` 之 ISO-8601 原始日期部分**（字串開頭之 `YYYY-MM`），**不先換算 UTC**、不依執行機器 local timezone 推導；例 `2026-08-01T00:30:00+08:00` → `2026` / `08`（換算 UTC 會誤得 `07`，與 Blogger URL `/2026/08/` 矛盾）。無效時間戳（含 `2026-02-30T10:00:00+08:00` 這類不存在之曆法日期）→ fail-closed 留空字串。per `docs/publish-json-schema.md` §5.4 + §5.3.1 + §9.5
5. **不呼叫 Blogger API**（屬第一版禁區；per CLAUDE.md §29 / §4 技術限制）
6. **若 `.publish.json` 不存在會失敗並提示作者先建立 sidecar**（exit 1；提示複製 `content/templates/_sample.publish.json`；`--create-sidecar` 屬未來批次）
7. **若既有 `publishedUrl` 已存在，預設拒絕覆寫；需要 `--force`**（exit 1 unless `--force`；保護作者意外覆蓋）

`--id` / `--slug` 二擇一識別 post；`--dry-run` 可預覽 plan；完整 flag 參考 `npm run backfill:url -- --help`。

**手動路徑**（無工具時 fallback）：直接編輯 `.publish.json` 之 `blogger` 區塊；確保 JSON 格式合法。

**回填後驗收**：

推薦（每次回填皆跑）：

```bash
npm run validate:content    # 確認 baseline 不退步
npm run report:urls         # 確認 target post 從 missing → filled
```

視需要（本 docs sync 不要求實際執行 build；屬作者於發布流程之選擇性 sanity check）：

```bash
npm run build:blogger       # 確認 Blogger meta.json 含正確 publishedUrl
npm run build:promotion     # 確認 FB finalUrl 採用 publishedUrl
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
| `relatedLinks` | ready 前 | 選填 | 作者手動指定之延伸閱讀 / 系列文章 / 來源連結 array | platform 不要併入 title；internal link url 應為已回填之真實 URL |
| `otherLinks` | ready 前 | 選填 | 作者手動指定之次要補充 / 館藏 / 影片 array | 同 relatedLinks 規則 |

---

## 16. 本 Phase 9-b 不做

以下項目**不在本批 scope**；屬後續 Phase 9-c+ 或更晚：

> **註**（Phase 9-c-2 補述）：本 §16 反映 **Phase 9-b 當時**之 scope boundary。其後 **Phase 9-c-1**（commit `f5f71b4`）已**另批**新增 `npm run backfill:url` CLI helper（屬下表 #1 / #2 之「publishedUrl backfill CLI helper / CLI 指令」之具體實作）；該工具之使用方式詳見 **§13「推薦自動化路徑」**。本節之 #1 / #2 描述**不代表 Phase 9 全期不做**；僅指 Phase 9-b 當時之 docs-only 邊界，並保留歷史脈絡。

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
