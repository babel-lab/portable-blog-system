# 20260523 Publishing Workflow Snapshot

本文件為 portable-blog-system 於 **2026-05-23** 之**內容發布 workflow 系統級盤點**；屬 docs-only / read-only；本批 phase `20260523-day-1-batch-4` **不**修改 src / content / template / dist；不 build / 不 deploy / 不 push。

本文件**不取代** `docs/publish-workflow.md`（既有 Phase 9-b 時期之 author SOP；487 行；含 build script / status transition / publishedUrl backfill CLI 等實作細節）；本文件偏 **system-level orientation**（架構 / 平台分工 / GA4·UTM 管理 / monetization / 工作類型分類 / Phase 1 邊界）；兩者 scope 互補。

對應上層：
- `docs/publish-workflow.md`（既有 author SOP；implementation detail authoritative source）
- `docs/blogger-export.md`（Blogger 匯出細節）
- `docs/promotion-export.md`（FB promotion 匯出細節）
- `docs/seo-ga4-adsense.md`（SEO / GA4 / AdSense 整體報告）
- `docs/github-deploy.md`（GitHub Pages 部署 runbook）
- `docs/ga4-link-tracking-spec.md`（GA4 / link tracking spec；5/23 固化）
- `docs/click-tracking-governance.md`（GA4 click 治理 implementation contract）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM plan）
- `docs/fb-sidecar-schema.md`（FB sidecar 12 欄位 schema）
- `docs/fb-sidecar-write-preflight-decision.md`（FB write preflight）
- `docs/publish-json-schema.md`（`.publish.json` schema）
- `docs/publish-bundle.md`（publish bundle 三檔分工）
- `docs/phase-status-20260523.md`（5/23 Phase 1 完成度盤點）
- `docs/admin-overview-audit-20260523.md`（5/23 Admin overview audit）
- `CLAUDE.md` §1-§30

---

## 1. 整體發布架構

### 1.1 五層架構

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1：Source of truth（本機 content/）                │
│   - Markdown + frontmatter                              │
│   - .publish.json sidecar（平台屬性）                    │
│   - .fb.md sidecar（FB 平台屬性）                        │
│   - content/settings/*.json（站台 / 分類 / 標籤 / 廣告等）│
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│ Layer 2:     │  │ Layer 2:       │  │ Layer 2:     │
│ GitHub Pages │  │ Blogger 平台    │  │ FB 粉絲頁     │
│ (build →     │  │ (手動貼文)      │  │ (手動發文)   │
│ dist →       │  │                │  │              │
│ gh-pages     │  │                │  │              │
│ deploy)      │  │                │  │              │
└──────────────┘  └────────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3：追蹤層（GA4 + UTM）                              │
│   - GA4 measurement（page_view / click events）          │
│   - UTM injection（cross-link / FB promotion）           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 4：Monetization（AdSense + Affiliate）             │
│   - AdSense（Blogger 已啟用；GitHub 端待 custom domain）  │
│   - Affiliate（通路王 / 聯盟網；GitHub + Blogger 雙端）   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 5：Metadata 回填（Blogger URL / FB URL / GA4 觀測）│
│   - .publish.json ← Blogger publishedUrl / postId        │
│   - .fb.md ← fbPostUrl / fbPostedAt / fbPostId           │
│   - GA4 後台 ← 自動 attribute（無回填動作）              │
└─────────────────────────────────────────────────────────┘
```

### 1.2 各層之角色與限制

| Layer | 角色 | 寫入路徑 | 可搬家性 |
|---|---|---|---|
| 1. Source（本機 content）| Markdown + JSON 設定；唯一 source of truth | user 於 VS Code 直接編輯 | ✅ 100%（純文字；可備份；可搬機）|
| 2a. GitHub Pages | build/deploy 後之靜態輸出；可重建 | 透過 build script | ✅ 可重建；不為 source |
| 2b. Blogger 平台 | user 手動貼文後之線上副本；可備份但非 source | user 手動 + 回填 .publish.json | ⚠️ 部分（Blogger 後台為線上副本；source 仍本機）|
| 2c. FB 粉絲頁 | 外部社群平台；非 source；不可備份至本機 | user 手動發文；回填 .fb.md metadata | ❌ 不可備份；屬外部依賴 |
| 3. 追蹤層（GA4 / UTM）| 流量 attribution；非 source；數據存 GA4 | 自動 attribute（UTM）/ JS event（GA4）| ⚠️ GA4 後台資料為主；本系統不接 API |
| 4. Monetization | 收益層；非 source；數據存各 provider 後台 | provider 後台 | ⚠️ 不可備份至本機 |
| 5. Metadata 回填 | 將外部狀態反映回本機 source | user 手動 / `npm run backfill:url` CLI | ✅ 回填後屬 Layer 1 source |

### 1.3 三條獨立發布路徑

```
路徑 A：本機 content → GitHub Pages
  build → dist → gh-pages deploy（push 後 GitHub Pages 自動服務）

路徑 B：本機 content → Blogger 後台
  build:blogger → dist-blogger → 人工複製 post.html → Blogger 後台貼上 → 發布 → 回填 publishedUrl

路徑 C：本機 content → FB 粉絲頁
  build:promotion → dist-promotion → 人工複製 .txt → FB 後台發文 → 回填 fbPostUrl 至 .fb.md
```

⚠️ 三條路徑**獨立**；單一文章可選擇走 A / B / C 之任意組合（per `publish.publishTargets.{platform}.enabled` + `.fb.md.enabled`）；無強制同步。

---

## 2. Blogger 發文流程

### 2.1 端到端步驟

```
1. 撰寫 content/blogger/posts/{slug}.md（含 frontmatter + body）
2. 建立 .publish.json sidecar（含 publish.publishTargets.blogger.enabled=true / publish.canonical.source）
3. （可選）建立 .fb.md sidecar（含 enabled=true / hashtags 等；若要 FB 推廣）
4. status: draft → ready（撰寫完成）
5. 跑 npm run validate:content（0 error / warning 可接受但需理解）
6. 跑 npm run build:blogger（產 dist-blogger/posts/{slug}/）
7. 開啟 dist-blogger/posts/{slug}/post.html（複製整 HTML body）
8. 開啟 dist-blogger/posts/{slug}/copy-helper.txt（13 個區塊；逐欄複製）
9. 開啟 dist-blogger/posts/{slug}/publish-checklist.txt（人工 SOP）
10. 開啟 Blogger 後台 → 新文章 → HTML 編輯器 → 貼上 post.html body
11. 依 copy-helper 填入：標題 / 搜尋說明 / 自訂網址（slug）/ 標籤
12. （若 affiliate enabled）核對 affiliate-box top / bottom 區塊
13. （若 book-review / magazine）核對 [12] 書籍 metadata 區塊（per `phase-9f-c-completion-report.md`）
14. 預覽桌機版 + 手機版
15. 確認圖片正常顯示
16. 確認 AdSense 區塊未破版
17. 發布
18. 從 Blogger 後台複製正式 URL
19. 回填：`npm run backfill:url -- --slug "{slug}" --url "{blogger-url}"`（或手動編輯 .publish.json）
20. （若 FB enabled）參考 dist-promotion/facebook/blogger/{slug}.txt → FB 後台發文
21. （若 FB enabled）回填 .fb.md 之 fbPostUrl / fbPostedAt / fbPostId
```

### 2.2 各檔案產出 / 用途

per `dist-blogger/posts/{slug}/`：

| 檔案 | 用途 | 必複製？ |
|---|---|---|
| `post.html` | 整 HTML body；含 article header / body / affiliate / related / hashtag / book-photo / download box 等 conditional render | ✅ 貼至 Blogger HTML 編輯器 |
| `copy-helper.txt` | 13 個區塊；含標題 / 搜尋說明 / slug 建議 / 標籤建議 / 書本 metadata 純文字傾印 / relatedLinks / otherLinks 確認清單等 | 🟡 逐欄複製對應 Blogger 後台欄位 |
| `meta.json` | machine-readable metadata；含 publishedUrl 預備位 / SEO / OG 等 | ❌ 不貼；屬 downstream tool 使用 |
| `publish-checklist.txt` | 人工 SOP checklist | 🟡 逐項勾選 |

### 2.3 HTML / XML / inline image / 圖片尺寸 / 連結 / hashtag 檢查

| 維度 | 檢查重點 | 對應工具 |
|---|---|---|
| **HTML 結構** | 整 post.html body 為 div.lab-blogger-article > article 結構；不污染 Blogger 主題 | dist-blogger build output |
| **XML / RSS** | Blogger 平台自管 RSS；無需本系統處理 | N/A |
| **inline image** | 圖片**不**由系統自動上傳；user 手動上傳至 Blogger / Google Drive / 其他圖床 | 對應 frontmatter `images[]` 記錄 |
| **圖片尺寸** | 系統不檢查圖片實際 dimension；user 自行於 Blogger 後台 / 圖床確認 | 🟡 屬人工 |
| **相關連結 / 其他連結** | post.html 已自動 render `<aside class="lab-related-links">` / `<aside class="lab-other-links">`；複製整 HTML body 時即包含 | dist-blogger post.html |
| **hashtag** | post.html 自動 render `<ul class="lab-hashtags">` 區塊；含 `#tag` span | dist-blogger post.html |
| **affiliate-box** | conditional render（`affiliate.enabled` + `affiliate.position.top / bottom`）| dist-blogger post.html |
| **rel / target** | external link 自動 `target="_blank" rel="nofollow noopener"`；affiliate link 自動 `sponsored nofollow noopener noreferrer` | render 階段 |
| **GA4 click event** | Blogger 端**無** click event 對接（無 Vite bundle = 無 listener）；屬 `blogger-listener-strategy.md` deferred | N/A |

### 2.4 發布後取得 Blogger URL

per `docs/publish-json-schema.md` §5.3：

- ⚠️ **Blogger URL 不可預測**：`/yyyy/mm/` 路徑由 Blogger 平台依**實際發布時間**決定
- ⚠️ 系統**永遠不預測** Blogger URL；不於 build 階段填入 placeholder
- ✅ 發布**之後**立即從 Blogger 後台複製正式 URL
- ✅ 回填至 `.publish.json` 之 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`

### 2.5 Blogger URL 是否需要回填 metadata

✅ **強烈建議立即回填**。理由：

| 用途 | 依賴 publishedUrl |
|---|---|
| canonical URL 計算 | ✅（per `publish-json-schema.md` §5.6）|
| FB promotion 之 finalUrl | ✅（FB 推廣文 .txt 內之文章連結指向 Blogger URL）|
| relatedLinks / otherLinks 內 internal cross-link | ✅（其他文章引用此篇時需真實 URL）|
| Admin overview 顯示 published-URL badge | ✅（per `admin-overview-audit-20260523.md` §2.2 列表 #4 欄）|
| sitemap.xml 之 cross-platform URL（如未來啟用）| 🔵 future |
| Phase 2 reverse UTM 注入（Blogger → GitHub）| 🔵 future（per `blogger-to-github-reverse-utm-plan.md`）|

→ **不**回填會導致 missing FB URL / missing output URL 之 completeness fail；Admin 之 `Missing Output URL` stat-card 會計入。

---

## 3. GitHub Pages 發布流程

### 3.1 端到端步驟

```
1. 撰寫 content/github/posts/{slug}.md（含 frontmatter + body）
2. 建立 .publish.json sidecar（publish.publishTargets.github.enabled=true）
3. （可選）.fb.md sidecar（若要 FB 推廣）
4. status: draft → ready
5. npm run validate:content
6. npm run build（含 prebuild data + postbuild sitemap auto-chain）
7. dist/ 產出（含 index / posts / categories / tags / 404 / design-system / sitemap.xml / robots.txt）
8. 本機 npm run preview 預覽（可選）
9. （deploy 階段）將 dist/ 推至 deploy repo gh-pages branch
10. GitHub Pages 自動服務新版
11. 線上驗收（page_view / GA4 Realtime / 各頁可開）
```

### 3.2 source repo vs deploy repo 之分工

| Repo | 內容 | branch | 線上服務角色 |
|---|---|---|---|
| **source repo**（本系統）| Markdown + JSON + src + docs | `main`（push to `origin/main`）| dev / 開發 / docs 管理 |
| **deploy repo** | dist/ 全內容（git tracked） | `gh-pages`（push to `origin/gh-pages`）| GitHub Pages production 服務 |

✅ 本系統 source repo **永不直接 push to gh-pages**；deploy 為獨立流程。

### 3.3 npm run build 流程

per `package.json` 之 lifecycle hooks（既有實作；不在本批改）：

```
predev   → node src/scripts/build-github.js --mode=dev    (dev: 產 .cache/pages/ data)
dev      → vite --host 0.0.0.0                            (vite dev server)

prebuild → node src/scripts/build-github.js --mode=build  (build: 產 .cache/pages/ data)
build    → vite build                                     (vite 將 .cache/ 轉至 dist/)
postbuild → npm run build:sitemap                         (dist/sitemap.xml + dist/robots.txt)
```

→ `npm run build` 自動 chain prebuild → build → postbuild；無需人為記憶順序。

### 3.4 dist 輸出對應 production 頁面

| dist 路徑 | 線上 URL | 狀態 |
|---|---|---|
| `dist/index.html` | `/` | ✅ |
| `dist/posts/{slug}/index.html` | `/posts/{slug}/` | ✅ |
| `dist/categories/{slug}/index.html` | `/categories/{slug}/` | ✅ |
| `dist/tags/{slug}/index.html` | `/tags/{slug}/` | ✅ |
| `dist/404.html` | （GitHub Pages 自動 fallback）| ✅ |
| `dist/sitemap.xml` | `/sitemap.xml` | ✅（14 entries；過濾 noindex）|
| `dist/robots.txt` | `/robots.txt` | ✅（含 Disallow + Sitemap）|
| `dist/design-system/index.html` | `/design-system/` | ✅（per noindex 規則）|
| `dist/admin/` | ❌ **不產出** | per dev-mode-only Plan B |

### 3.5 什麼情況才需要 deploy

| 變動類型 | 是否需要 deploy | 理由 |
|---|---|---|
| **docs-only commit**（純 `docs/` 變動）| ❌ **不需要** | dist/ 未變；線上 production 無變 |
| **content 變動**（`content/**/*.md` / sidecar / settings）| ✅ 需要 | 影響 dist/ 文章 / metadata |
| **template 變動**（`src/views/**/*.ejs`）| ✅ 需要 | 影響 dist/ render 結構 |
| **SCSS 變動**（`src/styles/**`）| ✅ 需要 | 影響 dist/assets/ 之 CSS bundle |
| **JS 變動**（`src/js/**`）| ✅ 需要 | 影響 dist/assets/ 之 JS bundle |
| **build script 變動**（`src/scripts/**`）| ⚠️ 視情況 | 若影響 dist 輸出 → 需 deploy；若僅工具腳本 → 不需 |
| **vite.config.js 變動** | ✅ 需要 | build behavior 變 |
| **admin 變動**（`src/views/admin/**`）| ❌ **不需要** | dev-mode-only；不進 dist |
| **GA4 settings 變動**（`content/settings/ga4.config.json`）| ✅ 需要 | 影響 dist HTML 之 inline gtag |
| **promotion config 變動**（`content/settings/promotion.config.json`）| ⚠️ 視情況 | 若改變既有 UTM pattern → 影響 dist 之 cross-link UTM |

### 3.6 docs-only commit 不需要 deploy 之原則

⭐ **核心原則**：**`docs/` 變動 = `dist/` 不變 = 線上 production 不變 = 不需要 deploy**。

理由：
- `dist/` 由 `npm run build` 從 `src/` + `content/` derive；不含 `docs/`
- GitHub Pages 服務 deploy repo `gh-pages` branch；deploy repo 不含 source 之 `docs/`
- `docs/` 為 author / Claude / maintainer 內部知識管理；非 production 輸出

當前 (2026-05-23) 已完成之 3 個 batch（phase-status / ga4-spec / admin-audit）皆 docs-only；**未 deploy；線上 GitHub Pages 完全無變**。

---

## 4. FB 貼文流程

### 4.1 端到端步驟

```
1. 撰寫 .md 文章（已完成）
2. 建立 .fb.md sidecar（含 enabled=true / hashtags / page / message 等）
3. （可選）撰寫 .fb.md body 為完整 FB 貼文文字
4. npm run build:promotion（產 dist-promotion/facebook/{site}/{slug}.txt）
5. 開啟 dist-promotion/facebook/{site}/{slug}.txt
6. 複製文字至 FB 粉絲頁發文框
7. 確認 hashtags / 標題 / 文章連結 / UTM 帶入正確
8. （可選）附上圖片（手動上傳；系統不處理）
9. FB 後台發文
10. 從 FB 後台複製貼文 URL（如 https://www.facebook.com/{page}/posts/{post-id}）
11. 回填 .fb.md：fbPostUrl / fbPostedAt / fbPostId / fbCampaign（per §5）
12. （可選）reload Admin overview 確認 FB derived badge 升級為 `posted`
```

### 4.2 FB title 與 Blogger title 之關係

per `docs/series-schema.md` §6 + `docs/publish-workflow.md` §12：

| 場景 | FB title | Blogger title | GitHub title |
|---|---|---|---|
| **預設一致** | `.md.title` | `.md.title`（或 `.publish.json.seo.metaTitle`）| `.md.title` |
| **FB override**（單篇調整）| `.fb.md.title`（如加 [貝果書屋] 前綴）| `.md.title`（不影響）| `.md.title`（不影響）|
| **Blogger override**（SEO 調整）| `.md.title`（不受 Blogger SEO 影響）| `.publish.json.seo.metaTitle`（若有）| `.md.title` |

✅ **三平台 title 預設一致；允許單篇手動分歧**；SEO 一致性靠作者紀律。

### 4.3 FB 可加 category prefix

範例：

```
Blogger title: "原子習慣：細微改變帶來巨大成就的實證法則"
FB title (.fb.md):
  "[貝果書屋] 原子習慣：細微改變帶來巨大成就的實證法則"
  或
  "[書評] 原子習慣：細微改變帶來巨大成就的實證法則"
```

→ FB 粉絲頁可由 category prefix 強化內容定位；不影響 Blogger / GitHub SEO。

### 4.4 FB 內文短句 + Blogger / GitHub 連結

`.fb.md` body 之典型結構（per `docs/fb-sidecar-schema.md`）：

```markdown
---
enabled: true
page: "fan1"
title: ""
hashtags:
  - "#自媒體"
  - "#書評"
fbPostUrl: ""
fbPostedAt: ""
---

引人入勝之短文案（1-3 段；建議 < 200 字）

📖 完整文章請見：https://yourblog.blogspot.com/2026/05/post-slug.html?utm_source=facebook&utm_medium=social&utm_campaign=book_review_atomic_habits&utm_content=fb_post_20260522
```

`build:promotion` 會將上述 body 與 hashtags / page 等 metadata 組裝成 dist-promotion/.txt。

### 4.5 GA4 UTM 使用方式

per `docs/ga4-link-tracking-spec.md` §3.4 + `docs/click-tracking-governance.md` §3.1：

```
FB → Blogger：
  utm_source=facebook
  utm_medium=social
  utm_campaign=book_review_<slug>（per promotion.config.json campaignPattern）
  utm_content=fb_post_<YYYYMMDD>（per contentPattern）

FB → GitHub：
  utm_source=facebook
  utm_medium=social
  utm_campaign=tech_note_<slug>（依文章 contentKind）
  utm_content=fb_post_<YYYYMMDD>
```

✅ FB UTM 由 `content/settings/promotion.config.json` 之 `campaignPattern` / `contentPattern` 動態生成；author 不手填 UTM；build:promotion 產出之 .txt 已含完整 UTM URL。

### 4.6 FB hashtags 可與 Blogger hashtags 不完全相同

| 平台 | hashtag 來源 | 命名規則 |
|---|---|---|
| Blogger 標籤 | `.md.tags`（per `tags.json` lookup）| 短 slug；無 `#` prefix；Blogger 後台之 `Labels` 欄位 |
| FB hashtags | `.fb.md.hashtags`（per fallback chain；per `publish-workflow.md` §12）| 含 `#` prefix；中文 / 英文皆可；社群風格 |

→ **獨立 namespace**；不強制對齊；author 可於 FB 用更通俗 / 流量導向之 hashtag（如 `#親子閱讀`），Blogger 用 SEO 導向之 tag（如 `parent-child-reading`）。

### 4.7 發文後取得 FB URL

| 取得方式 | 步驟 |
|---|---|
| 1. FB 粉絲頁 → 進入剛發布之貼文 |
| 2. 複製貼文 URL（如 `https://www.facebook.com/{page-name}/posts/{post-id}` 或新版 `pfbid` URL）|
| 3. 從 URL 抽出 `post-id`（如 `1234567890123456`；新版 pfbid URL 之 post-id 可能不易抽出，可填空）|
| 4. 紀錄發文時間（建議 ISO 8601；或 `YYYY-MM-DD HH:mm` placeholder）|

---

## 5. FB URL metadata 回填

### 5.1 12 個 .fb.md sidecar 欄位（read-only metadata）

per `docs/fb-sidecar-schema.md` §3.1 / §3.5：

| # | 欄位 | 角色 | Admin 顯示 | 預計寫入路徑 |
|---|---|---|---|---|
| 1 | `enabled` | FB 推廣是否啟用 | ✅ 列表 + detail | user VS Code 編輯 |
| 2 | `status` | FB 推廣狀態（ready / posted / 其他）| ✅ derived badge | 同上 |
| 3 | **`fbPostUrl`** | FB 貼文正式 URL | ✅ detail（linkified）| ⭐ 發文後回填 |
| 4 | **`fbPostedAt`** | FB 發文時間 | ✅ detail | ⭐ 發文後回填 |
| 5 | **`fbPostId`** | FB 貼文 ID（如 1234567890123456） | ✅ detail | 發文後回填（pfbid URL 時可空）|
| 6 | **`fbCampaign`** | 文章對應 FB campaign（如 `book_review_atomic_habits`）| ✅ detail | 規劃發文時設定 |
| 7 | `audience` | FB 受眾標記 | ✅ detail | 規劃時設定 |
| 8 | `title` | FB 端標題 override | ✅ detail | 規劃時設定 |
| 9 | `titleEn` | FB 端英文 title | ✅ detail | 規劃時設定 |
| 10 | `hashtags` | FB hashtags array | ✅ detail | 規劃時設定 |
| 11 | `imageUrl` | FB 配圖 URL（已上傳之 image refs）| ✅ detail（linkified）| 發文後或規劃時 |
| 12 | `note` | author 內部備註 | ✅ detail | 任意時間 |

### 5.2 是否放在 .fb.md sidecar

✅ **是；當前正是放在 .fb.md sidecar**。

理由（per `docs/publish-bundle.md` §1.2）：
- 三檔分工原則：FB 專用屬性（含 fb post URL / postId 等）放 `.fb.md`
- 不污染 `.md` frontmatter（內容屬性）
- 不污染 `.publish.json`（Blogger / GitHub 平台屬性）
- sidecar 為 selective enable；無 FB 推廣之文章不需建立 .fb.md

### 5.3 Admin 未來如何顯示與查詢

per `docs/admin-overview-audit-20260523.md` §5：

當前 Admin 顯示狀態：
- ✅ FB 12 欄位全顯示於 detail panel §7（fbPostUrl + fbImageUrl linkified）
- ✅ Missing FB URL stat-card 統計缺漏數
- ✅ FB derived badge（none / disabled / posted / ready / 其他）顯示於列表
- ✅ FB Sidecar Dry-run Editor（12 欄位 form + diff；client-side preview only）

未來改善候選（per admin audit §10）：
- 🟡 依 fbCampaign 篩選
- 🟡 依 fbBadge optgroup filter（顯示 only posted / only ready / missing）
- 🟡 依 fbPostedAt 排序
- 🔵 FB-P5-c-a/b write surface 啟動（atomic temp+rename 寫入）

### 5.4 是否應只讀取 .fb.md sidecar，不直接寫入

✅ **當前邊界：read-only / dry-run；不直接寫入**。

per `docs/fb-sidecar-write-preflight-decision.md` §7：
- user 須勾完 **8 項 preflight checklist** + **6 項前置確認**
- FB-P5-c-a server-side dry-run validation endpoint 未啟動
- FB-P5-c-b 真實寫入 .fb.md 未啟動
- 當前流程：user 於 VS Code 手動編輯 .fb.md → reload Admin overview 驗收

### 5.5 是否可作為快速回查 FB 貼文之入口

✅ **已支援**：
- 列表 FB derived badge：可一眼看出哪些文章已 posted
- detail panel §7 之 fbPostUrl **linkified**：點即跳至 FB 貼文
- Missing FB URL stat-card：定位需補貼文 URL 之文章

未來可加強：
- 依 fbCampaign 篩選（per §5.3 改善候選）
- 列表新增 FB URL 欄（當前無；屬 nice-to-have）

---

## 6. GA4 / UTM 管理流程

### 6.1 8 個 click source × UTM × GA4 event 對應表

per `docs/click-tracking-governance.md` §4 + `docs/ga4-link-tracking-spec.md` §3：

| Click source | utm_source | utm_medium | utm_campaign | utm_content | GA4 event | 當前狀態 |
|---|---|---|---|---|---|---|
| **FB → Blogger** | `facebook` | `social` | per post（如 `book_review_<slug>`）| `fb_post_<YYYYMMDD>` | `page_view`（自動）| ✅ UTM by promotion.config.json |
| **FB → GitHub** | `facebook` | `social` | per post | `fb_post_<YYYYMMDD>` | `page_view`（自動）| ✅ UTM by promotion.config.json |
| **Blogger → GitHub** | `blogger` | `referral` | `portable_blog_system` | `related_links` \| `other_links` | `click_cross_site_link` | 🟡 UTM **plan only**（per `blogger-to-github-reverse-utm-plan.md`）；event N/A（無 Blogger listener）|
| **GitHub → Blogger** | `github_pages` | `referral` | `portable_blog_system` | `related_links` \| `other_links` | `click_cross_site_link` | ✅ UTM by `applyCrossSiteUtm`；event ✅ landed（per `aa7b594`）|
| **related links（站內 / cross-site）** | —（依 link_type 決定）| —（依 link_type）| —（依 link_type）| `related_links` | `click_related_link` | ✅ GitHub 端 landed（per `aa7b594` + `b94cf77`）|
| **other links（站內 / cross-site）** | —（依 link_type）| —（依 link_type）| —（依 link_type）| `other_links` | `click_other_link` | ✅ GitHub 端 landed |
| **hashtag links** | N/A（站內）| N/A | N/A | N/A | `click_hashtag` | 🔴 未實作（hashtag 仍 `<span>`；前置 span→a 屬 `hashtag-slug-decision.md`）|
| **affiliate top** | N/A（聯盟 URL 不加 UTM；per P5）| N/A | N/A | N/A | `click_affiliate_cta`（placement=`article_top`）| ✅ GitHub 端 landed（per `6785bb6`）|
| **affiliate bottom** | 同上 | N/A | N/A | N/A | `click_affiliate_cta`（placement=`article_bottom`）| ✅ GitHub 端 landed（per `221a87c`）|

### 6.2 三層分離

per `docs/click-tracking-governance.md` §3：

```
Layer 1：UTM Layer
  用途：跨平台流量來源辨識
  介入點：build / render 階段 URL injection（cross-link / promotion）
  GA4 反映：自動 attribute；Acquisition / Traffic source 報表

Layer 2：GA4 Event Layer
  用途：站內互動辨識
  介入點：client-side click listener（data-ga4-event + data-ga4-param-*）
  GA4 反映：Events / Engagement 報表

Layer 3：Content Metadata Layer
  用途：build 階段組裝 UTM / params 之輸入
  介入點：frontmatter / sidecar / settings JSON
  GA4 反映：間接（透過 Layer 1 + 2）
```

✅ 三層**獨立但可組合**；新增 click source 時可只動其中一層。

### 6.3 GA4 Realtime / DebugView 手動驗收流程

per `docs/ga4-link-tracking-spec.md` §12 + `docs/20260522-ga4-click-tracking-manual-validation.md`：

```
1. 確認 ga4.config.json: enabled=true + measurementId='G-C77SMPF8VD'
2. 確認 latest deploy 已上線
3. （可選）安裝 GA Debugger Chrome extension
4. 開啟 GA4 後台 → Admin → DebugView
5. 開啟測試文章頁（如 https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/）
6. 驗收：
   a. DevTools Elements 觀察 data-ga4-* attrs 完整
   b. GA4 Realtime 看到 page_view
   c. 點擊各 click point（related / other / affiliate top / affiliate bottom）
   d. DebugView 1-3 秒內看到對應 event + params
7. 標記驗收狀態：
   ✅ DOM attr 渲染 OK
   ✅ page_view OK
   🟡 event-level 待 user 提供 DebugView 截圖（per phase-status §4.4）
```

### 6.4 當前 GA4 event-level 驗收狀態

per `docs/20260522-ga4-click-tracking-manual-validation.md`：

| 維度 | 狀態 |
|---|---|
| DOM attr 渲染 | ✅ 通過（6 attrs 全部渲染 per §2.2）|
| page_view（兩平台 cross-site flow）| ✅ 通過 |
| `click_related_link` event 明細（DebugView）| 🟡 **user manual pending** |
| `click_other_link` / `click_affiliate_cta` event 明細 | 🟡 同上 |

→ **整體屬「80% 驗收」**；event-level 後台確認尚未完成；屬 user 操作層面 pending；**非** source-level blocking issue。

---

## 7. Affiliate / AdSense 管理

### 7.1 Blogger 平台 AdSense

| 維度 | 狀態 |
|---|---|
| Blogger 平台 AdSense 啟用 | ✅ 既有；user 既存收益來源 |
| 本系統管理範圍 | ❌ 不管 Blogger 平台之 AdSense；屬 Blogger 平台後台設定 |
| AdSense 區塊 render | ✅ Blogger post.html 含 AdSense partial（6 個 placement；per `ads.config.json` 結構）|

### 7.2 GitHub Pages AdSense

| 維度 | 狀態 |
|---|---|
| GitHub Pages AdSense 啟用 | 🔴 **未啟用** |
| `content/settings/ads.config.json` | ✅ schema ready；`enabled: false`；`adsenseClient: ""`；slots 全空 |
| 申請條件 | 依賴 **custom domain 啟用 + HTTPS Enforce**（per `docs/custom-domain-root-files-strategy.md` §4.5）|
| 當前阻擋 | user 取得 domain + DNS provider access 未啟動 |

→ **GitHub Pages 端 AdSense 屬 future**；非 Phase 1 範圍。

### 7.3 GitHub Pages 替代 monetization：Affiliate

per `docs/ad-affiliate-schema-proposal.md` §6.1 + `docs/phase-status-20260523.md` §7.4：

✅ **GitHub Pages 端目前無 AdSense；可先放 affiliate 區塊**。

| Provider | 狀態 |
|---|---|
| 通路王（id=`books`）| ✅ `affiliate-networks.json` 已含；rel auto `sponsored nofollow noopener noreferrer` |
| 聯盟網（id=`affiliate-network`）| ✅ 同上 |
| Future provider | 🟡 可擴充 `affiliate-networks.json` array |

### 7.4 通路王 / 聯盟網不一定吃我方 GA4 參數

per `docs/click-tracking-governance.md` §7.3 + `docs/ga4-link-tracking-spec.md` §3.7：

⚠️ **核心原則**：**不主動將 GA4 UTM 加到聯盟導購連結上**。

理由：
1. 通路王 / 聯盟網等可能 strip extra query string；額外 UTM 影響歸因
2. 避免污染導購 URL；某些平台對非標準入口 URL 視為違規而拒絕分潤
3. 我方追蹤靠站內 GA4 event 記錄「點出前」之點擊；不需要對導購 URL 動手腳
4. 若聯盟平台支援 subid / sid / aff_sub，採各平台機制（非 GA4 utm）

### 7.5 我方 GA4 主要追蹤「點出去」事件

```
我方 GA4 event：click_affiliate_cta
含 params：
  - post_slug      （當前文章 slug）
  - provider       （通路王 / 聯盟網 / future）
  - placement      （article_top / article_bottom；per spec §11.1 收斂 2026-05-24）
  - link_label     （CTA 顯示文字）
  - link_url       （聯盟導購 URL；不含我方 UTM）
  - outbound       （'true'；外部跳轉）

→ 記錄「使用者從我方頁面 click 點出去」之事件
→ 不嘗試追蹤「使用者於聯盟平台是否真實購買」（屬聯盟後台統計）
```

### 7.6 同一銷售連結出現在上下區塊時靠 placement 區分

per `docs/ga4-link-tracking-spec.md` §11.3：

```
範例：同一書本之博客來連結出現在 article_top + article_bottom
GA4 後台會看到兩個獨立 click event：
  - event=click_affiliate_cta + placement=article_top
  - event=click_affiliate_cta + placement=article_bottom

→ 比較 ratio：上方 CTA 效果 vs 下方 CTA 效果
→ 同一 URL 不能只看 link_url 區分；必須靠 placement 參數
```

✅ 當前 GitHub 端實作已含 placement 參數（per `b94cf77` 補完）。

---

## 8. 發布前 checklist

### 8.1 Content metadata 檢查

| 項目 | 檢查重點 | 工具 |
|---|---|---|
| `id` | 唯一；推薦 `YYYYMMDD-{slug}` 格式 | `npm run validate:content` |
| `slug` | 短英文；kebab-case；不含中文 / 空格 / 特殊字元 | 同上 |
| `title` / `titleEn` | title 為中文；titleEn 為英文（可選）| 同上 |
| `description` / `searchDescription` | description 為摘要；searchDescription 為 SEO meta | Admin SEO viewer |
| `status` | `draft` → `ready` 後才能 build | 同上 |
| `contentKind` | `post` / `tech-note` / `book-review` / `download` / etc. | 同上 |
| `category` | 必須存在於 `categories.json` | 同上 |
| `tags` | 必須存在於 `tags.json` | 同上 |
| `cover` / `coverAlt` | cover URL + alt text | Admin detail panel SEO section |
| `hashtags`（.fb.md）| FB 端 hashtags array；含 `#` prefix | Admin detail panel §7 |
| `relatedLinks` | array；item 含 url / title / kind（internal/external）/ platform | per `related-links-schema.md` |
| `otherLinks` | 同上 | 同上 |
| `affiliate.enabled` + `affiliate.links[]` | 若 enabled=true，必須補 links | per `CLAUDE.md` §12 |

### 8.2 Build 是否需要跑

| 變動類型 | build 需要？ | validate 需要？ |
|---|---|---|
| 純 docs（`docs/`）| ❌ | ❌ |
| content（`content/`）| ✅ | ✅ |
| template（`src/views/`）| ✅ | ✅ |
| SCSS（`src/styles/`）| ✅ | ❌ |
| JS（`src/js/`）| ✅ | ❌ |
| build script（`src/scripts/`）| ⚠️ 視影響 | ⚠️ 視影響 |
| admin only（`src/views/admin/`）| ✅ for dev mode；❌ for prod | ❌ |

### 8.3 Deploy 是否需要跑

per §3.5：

| 變動類型 | deploy 需要？ |
|---|---|
| docs-only | ❌ |
| dist/ 已變動（content / template / SCSS / JS / build script / vite.config）| ✅ |
| admin only | ❌（dev-mode-only；不進 dist）|

### 8.4 GA4 / UTM 檢查

| 項目 | 檢查 |
|---|---|
| `ga4.config.json` enabled=true | ✅（per current state）|
| measurementId 非空 | ✅ `G-C77SMPF8VD` |
| inline attrs 在 post-detail.ejs 已注入 | ✅（per `1bbedc4`）|
| placement params 已加 | ✅（per `b94cf77`）|
| affiliate top/bottom attrs | ✅（per `6785bb6` + `221a87c`）|
| related/other links attrs | ✅（per `aa7b594`）|

### 8.5 發布前 checklist 摘要表

```
[ ] frontmatter id / slug / title / status / contentKind / category 齊備
[ ] description / searchDescription 已填
[ ] cover / coverAlt 已填
[ ] tags 已對齊 tags.json
[ ] hashtags（.fb.md）已填（若 FB enabled）
[ ] relatedLinks / otherLinks 已填（若有）
[ ] affiliate.enabled / links 已對齊（若有）
[ ] GA4 / UTM 設定已確認
[ ] npm run validate:content → 0 error
[ ] npm run build → 成功（若 content / template / SCSS / JS 變動）
[ ] npm run build:blogger → 成功（若要貼 Blogger）
[ ] npm run build:promotion → 成功（若要 FB 推廣）
[ ] deploy 已就位（若 dist 變動）
```

---

## 9. 發布後 checklist

### 9.1 Blogger 發布後

```
[ ] Blogger 線上 URL 可開（不論桌機 / 手機）
[ ] 圖片正常顯示
[ ] hashtag 正常顯示
[ ] affiliate-box（若有）正常顯示
[ ] AdSense 區塊未破版
[ ] relatedLinks / otherLinks（若有）正常 render
[ ] book metadata（若 book-review）正確
[ ] 取得正式 Blogger URL
[ ] 回填：npm run backfill:url -- --slug "{slug}" --url "{blogger-url}"
[ ] Admin overview reload；確認 published-URL badge 已升級
```

### 9.2 GitHub Pages 發布後

```
[ ] GitHub Pages URL 可開（如 https://babel-lab.github.io/portable-blog-system/posts/{slug}/）
[ ] 文章內容 render 正常
[ ] hashtag / related / other / affiliate 區塊（若有）正常
[ ] sitemap.xml 包含新文章 entry
[ ] 404 fallback 正常（測試一個不存在路徑）
[ ] GA4 Realtime 看到該頁 page_view
[ ] DevTools 觀察 data-ga4-* attrs 完整
```

### 9.3 FB 發文後

```
[ ] FB 貼文 URL 可開
[ ] 內文 / hashtags / 連結 / 圖片 顯示正常
[ ] 連結帶 UTM（從 FB 跳轉至 Blogger / GitHub 後 URL 含 utm_source=facebook 等）
[ ] 回填 .fb.md：fbPostUrl / fbPostedAt / fbPostId / fbCampaign
[ ] Admin overview reload；確認 FB derived badge 升級為 posted
[ ] Missing FB URL stat-card 計數 -1
```

### 9.4 sitemap 是否更新

| 場景 | sitemap 更新？ |
|---|---|
| 新增 ready post + build | ✅ 自動（postbuild hook）|
| 移除 post / 改 noindex | ✅ 自動 |
| Blogger 發布 / FB 發文 | ❌ 不影響 sitemap（Blogger 平台自管；FB 不在 sitemap）|

### 9.5 GA4 Realtime 是否看到流量

驗收路徑：

```
1. 開啟 GA4 後台 → Reports → Realtime
2. 重訪 GitHub Pages 文章頁
3. 1-30 秒內應看到 page_view 流量
4. 若 FB 已發文，從 FB 點連結進入後可看到含 utm_source=facebook 之 Traffic source
```

### 9.6 affiliate 點擊是否增加

驗收路徑：

```
1. GA4 後台 → Reports → Events
2. 找 `click_affiliate_cta` event
3. filter by placement=article_top / article_bottom 看 ratio（per spec §11.1 收斂 2026-05-24）
4. （未來）filter by provider=通路王 vs 聯盟網 看 ratio
5. ⚠️ 不嘗試從 GA4 看「實際購買」；屬聯盟平台後台
```

### 9.7 搜尋 / hashtag / related links 是否可用

```
[ ] 搜尋功能：Google site:babel-lab.github.io/portable-blog-system "{slug}"（待索引）
[ ] hashtag 頁可開：/tags/{slug}/
[ ] category 頁可開：/categories/{slug}/
[ ] relatedLinks 內各 link 點擊跳轉正常（含 UTM 若 cross-site）
[ ] otherLinks 同上
```

---

## 10. 不同類型工作的處理原則

### 10.1 docs-only

| 性質 | docs-only |
|---|---|
| 變動範圍 | `docs/**/*.md` |
| build | ❌ 不需要 |
| validate | ❌ 不需要 |
| deploy | ❌ 不需要 |
| push | ✅ 推送 source repo `main` |
| GitHub Pages 線上影響 | ❌ 無 |
| Blogger / FB 影響 | ❌ 無 |
| 典型範例 | 今日 5/23 之 3 batches（phase-status / ga4-spec / admin-audit）|

### 10.2 content update

| 性質 | content update |
|---|---|
| 變動範圍 | `content/**/*.md` / `.fb.md` / `.publish.json` / `content/settings/*.json` |
| build | ✅ 視變動；至少 `npm run build`；可能含 `build:blogger` / `build:promotion` |
| validate | ✅ `npm run validate:content` |
| deploy | ✅ 若影響 GitHub Pages dist/ |
| push | ✅ source repo 之 content 變動 push |
| 典型範例 | 新增 post / 補 cover / 補 hashtags / 啟用 affiliate.enabled |

### 10.3 template / src update

| 性質 | template / src update |
|---|---|
| 變動範圍 | `src/views/**/*.ejs` / `src/styles/**` / `src/js/**` / `src/scripts/**`（影響 dist 者）|
| build | ✅ 必要 |
| validate | ✅ 視變動 |
| deploy | ✅ 必要 |
| push | ✅ source repo |
| 額外驗收 | 線上頁面驗收（render 是否正確 / GA4 attrs 是否完整 / cross-link UTM 是否帶入）|
| 典型範例 | inline GA4 attrs（per `1bbedc4`）/ placement params（per `b94cf77`）/ Admin night usability fixes |

### 10.4 Blogger-only 更新

| 性質 | Blogger-only update |
|---|---|
| 範例 | 修正既有 Blogger 文章內容（typo / 加圖片 / 改連結）|
| 本機 source 變動 | ✅ 修 `.md` 並重 `build:blogger` |
| GitHub Pages | ⚠️ 視該文章 publish.publishTargets.github.enabled |
| Blogger 後台 | ✅ user 重新貼 post.html / 重貼 copy-helper 對應欄位 |
| publishedUrl 變化？ | ❌ 通常不變（Blogger 平台之 yyyy/mm 固定）|

### 10.5 FB-only 更新

| 性質 | FB-only update |
|---|---|
| 範例 | FB 推廣文 typo / 改 hashtags / FB 發文後回填 URL |
| 本機 source 變動 | ✅ 修 `.fb.md`；重 `build:promotion` |
| Blogger / GitHub | ❌ 無影響 |
| deploy | ❌ 不需要 |
| 主要動作 | 回填 metadata（fbPostUrl / fbPostedAt 等）|

### 10.6 GA4 spec / docs 更新

| 性質 | GA4 spec / docs |
|---|---|
| 範例 | 更新 ga4-link-tracking-spec.md / click-tracking-governance.md |
| 本機 source 變動 | ❌ 純 docs |
| build / validate / deploy | ❌ 不需要 |
| 對線上 GA4 measurement 影響 | ❌ 無（measurement 由 ga4.config.json + production deploy 決定；spec 變動不影響 runtime）|
| 典型範例 | 今日 batch 2（spec 固化）|

### 10.7 Settings 更新

| 性質 | settings update |
|---|---|
| 範例 | 修改 categories.json / tags.json / promotion.config.json / ads.config.json |
| build | ✅ 視變動；通常需要 `npm run build` |
| validate | ✅ |
| deploy | ⚠️ 視影響 |
| 風險 | settings drift 影響全站 metadata；改前須 docs 同步 |

---

## 11. 不建議現在做的項目

per `CLAUDE.md` §29 + 多份 docs 共識：

| # | 項目 | 不建議理由 |
|---|---|---|
| 1 | **完整 CMS** | per `CLAUDE.md` §4 第一版技術限制 + §29 不做清單；違反系統定位 |
| 2 | **Admin 真寫入啟動**（FB-P5-c-a/b / Admin-2-b-2 / FB-P5-e） | user 8+6 項 preflight 未勾；per `fb-sidecar-write-preflight-decision.md` §7 |
| 3 | **接 GA4 Data API**（Admin 內顯示 GA4 報表）| per `CLAUDE.md` §29；屬會員系統範疇 |
| 4 | **接 Blogger API auto publish** | per `CLAUDE.md` §29 第一版永不清單 |
| 5 | **接 Facebook Graph API**（即使僅 read）| 同上 |
| 6 | **接 Google Drive API auto image upload** | 同上 |
| 7 | **把 Blogger / GitHub / FB 流程一次全自動化** | 違反保守路線；每平台有獨立 lifecycle / 失敗模式 / 回填需求 |
| 8 | **Phase 1 末期大改資料結構**（.fb.md / .publish.json / .md frontmatter schema） | 影響 build / validate / Blogger 已貼文 / Admin loader；屬高風險 |
| 9 | **真正後台登入管理 / 會員系統 / 留言 / view 數 / like** | per `CLAUDE.md` §29 全部屬永不清單 |
| 10 | **大規模 SEO automation**（hreflang / multi-site sitemap split / News sitemap）| per `docs/seo-sitemap-split-pre-analysis.md` 結論：當前不建議 |
| 11 | **改 GA4 event 命名為 generic `link_click`** | 既有 governance + production 已使用 `click_*` 系列；改命名 = 已落地 spec churn |
| 12 | **AdSense 自插 GA4 event** | per `docs/ga4-link-tracking-spec.md` P6；違反 AdSense 政策風險 |
| 13 | **affiliate URL 強加 GA4 UTM** | per §7.4；聯盟平台不一定吃；影響 attribution |
| 14 | **Admin 開放公開部署** | dev-mode-only Plan B 既定；違反此設計需重新評估 Phase 1 整體邊界 |

---

## 12. 後續可改善項目

### 12.1 🟢 短期可改善（docs-only or 小修；風險低）

| # | 項目 | 對應 doc / batch |
|---|---|---|
| 1 | Admin 顯示 workflow status（每篇文章之 Blogger / GitHub / FB 三平台 lifecycle 圖示）| 屬 Admin polish；per `admin-overview-audit-20260523.md` §10 B-series |
| 2 | FB metadata 回填輔助 UI（dry-run preview；non-write）| 已存在 dry-run editor；可補 fbCampaign / audience suggestion |
| 3 | 發布 checklist 自動化（CLI tool 或 npm script；如 `npm run check:publish-ready`）| 🔵 future；可整合既有 report:* scripts |
| 4 | GA4 click validation checklist（per `ga4-link-tracking-spec.md` §12）| ✅ docs 已就位；可加 user 操作 SOP screenshot |
| 5 | content completeness indicator（per `admin-overview-audit-20260523.md` §5 missing warning banner）| ✅ 已落地（5/22 night-3-e）|
| 6 | deploy readiness report（CLI；判斷 dist 是否與 source 一致；當前 dist 是否需要 redeploy）| 🔵 future |
| 7 | Admin filter 擴展（sourceSite / fbBadge / affiliate enabled）| per `admin-overview-audit-20260523.md` §10 A1-A2 / B2 |
| 8 | Blogger / GitHub URL linkify（per `admin-overview-audit-20260523.md` §10 A3 / `20260521-admin-overview-display-audit.md` S-2）| 🟢 high；零風險小修 |

### 12.2 🟡 中期可改善（小批 source 改動；風險中）

| # | 項目 | 對應 |
|---|---|---|
| 1 | Reverse UTM 落地（Blogger → GitHub）| per `blogger-to-github-reverse-utm-plan.md` §10 之 7 步 |
| 2 | Hashtag span→a + `click_hashtag` 對接 | per `hashtag-slug-decision.md` |
| 3 | `campaign` per-post / per-series metadata schema | per `ga4-link-tracking-spec.md` §5.3 + §6.1 |
| 4 | `affiliateBlocks[]` schema 落地至 frontmatter | per `ad-affiliate-schema-proposal.md` |
| 5 | Admin FB write surface（FB-P5-c-a server-side dry-run）| 🟡 阻擋於 user 勾 preflight |
| 6 | Admin pagination（為 ≥ 100 篇預備）| per `admin-overview-audit-20260523.md` §10 C3 |
| 7 | `click_external_link` event（外部一般連結追蹤）| per `ga4-link-tracking-spec.md` §3.1 / §4.2 |

### 12.3 🔵 Phase 2+ 改善（user 表態後啟動）

| # | 項目 | 阻擋條件 |
|---|---|---|
| 1 | Custom domain 啟用 | user 取得 domain + DNS provider access |
| 2 | AdSense 申請 / 啟用於 GitHub 端 | 依賴 #1 + AdSense 審核 |
| 3 | FB-P5-c-b 真實寫入 .fb.md | 同 §11 #2 |
| 4 | Admin-2-b-2 SEO write 真實寫入 | user 表態 |
| 5 | Blogger 端 click listener（option A inline / B 主題級 / C 不做）| per `blogger-listener-strategy.md` §5；短期推薦不做 |
| 6 | DS-3-b platform theme Option B（平台品牌色）| user 設計師決方案 + 色票 hex |
| 7 | DS-3-b-blogger-entry（讓 themes 進 Blogger CSS；user 需重貼）| user 排程 + 一次性貼 CSS |

### 12.4 推薦下一個 batch（per `phase-status-20260523.md` §10）

今日剩餘建議 batch 順序：

| Batch | 主題 | 性質 | 推薦度 |
|---|---|---|---|
| **Batch 1**（已完成）| Phase 1 完成度盤點 | docs | ✅ 939d97a |
| **Batch 2**（已完成）| GA4 click tracking spec 固化 | docs | ✅ be44701 |
| **Batch 3**（已完成）| Admin overview audit | docs | ✅ 430ecb0 |
| **Batch 4**（進行中）| 發布 workflow 文件（本文件）| docs | ⭐ 進行中 |
| **Batch 5**（候選）| Design token audit | docs | 中（DS-3 已 resolved；audit 屬補強）|

---

## 13. 本批不做事項

per spec：

- ❌ 不修改 `src/`
- ❌ 不修改 `content/`
- ❌ 不修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- ❌ 不修改 deploy repo
- ❌ 不修改既有 `docs/publish-workflow.md`（保留 author SOP 焦點）
- ❌ 不跑 `npm run build` / `npm run dev` / `npm run validate:content` / `npm run build:blogger` / `npm run build:promotion`
- ❌ 不 push
- ❌ 不 deploy
- ❌ 不啟動 reverse UTM / hashtag span→a / Admin write / custom domain / AdSense 任一
- ❌ 不修改 `.claude/`

---

## 14. Cross-links

### 14.1 既有 workflow / publishing docs

- `docs/publish-workflow.md`（Phase 9-b author SOP；本文件 implementation detail authoritative）
- `docs/publish-bundle.md`（三檔分工：.md / .publish.json / .fb.md）
- `docs/publish-json-schema.md`（.publish.json schema；含 Blogger URL 不可預測規則）
- `docs/blogger-export.md`（Blogger 匯出 pipeline）
- `docs/promotion-export.md`（FB promotion 匯出 pipeline）
- `docs/github-deploy.md`（GitHub Pages 部署 runbook）
- `docs/backup-and-migration.md`（備份搬家）
- `docs/migration-from-frontmatter.md`（舊 frontmatter 遷移）

### 14.2 GA4 / UTM / tracking docs

- `docs/ga4-link-tracking-spec.md`（5/23 固化 spec）
- `docs/click-tracking-governance.md`（implementation contract）
- `docs/ga4-parameter-naming-registry.md`（snake_case naming registry）
- `docs/ga4-enable-preflight.md`（GA4 production gating）
- `docs/seo-ga4-adsense.md`（GA4 / SEO / AdSense 整體報告）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM plan）
- `docs/blogger-listener-strategy.md`（Blogger 端 listener strategy）
- `docs/hashtag-slug-decision.md`（hashtag slug 派生策略）
- `docs/20260522-ga4-click-tracking-manual-validation.md`（5/22 manual validation 紀錄）

### 14.3 schema docs

- `docs/fb-sidecar-schema.md`（FB sidecar 12 欄位 schema）
- `docs/fb-sidecar-write-preflight-decision.md`（FB write user 8+6 項 preflight）
- `docs/fb-post-url-metadata-proposal.md`（FB post URL metadata proposal）
- `docs/related-links-schema.md`（relatedLinks / otherLinks schema）
- `docs/book-schema.md`（book metadata）
- `docs/series-schema.md`（series metadata）
- `docs/ad-affiliate-schema-proposal.md`（ad / affiliate 統一 schema）

### 14.4 checklists

- `docs/checklists/blogger-publish-checklist.md`
- `docs/checklists/github-deploy-checklist.md`
- `docs/checklists/fb-promotion-checklist.md`
- `docs/checklists/seo-checklist.md`
- `docs/checklists/image-upload-checklist.md`
- `docs/checklists/backup-checklist.md`
- `docs/checklists/sidecar-migration-checklist.md`

### 14.5 5/23 同日 batch docs

- `docs/phase-status-20260523.md`（Batch 1；Phase 1 完成度盤點）
- `docs/ga4-link-tracking-spec.md`（Batch 2；spec 固化）
- `docs/admin-overview-audit-20260523.md`（Batch 3；Admin overview audit）
- 本文件（Batch 4）

### 14.6 上層規範

- `CLAUDE.md` §1（系統定位）/ §2（兩平台定位）/ §3（核心資料來源）/ §4（技術限制）/ §16（連結處理）/ §22（圖片素材）/ §24（Blogger URL 回填）/ §28（MVP 必做）/ §29（不做清單）/ §30（最終樣貌）
- `docs/system-direction.md`（BLOG 系統整體方向）

---

（本文件結束）
