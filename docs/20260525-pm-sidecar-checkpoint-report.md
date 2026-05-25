# 2026-05-25 PM Sidecar Checkpoint Report

> Phase: `20260525-pm-sidecar-checkpoint-doc-a`
> 模式：docs-only（純 checkpoint report 落地；為下次 cold-start 入口）
> 來源：本文件整理 2026-05-25 下午完成之 4 個 sidecar 相關 phases；上接 `docs/20260525-am-checkpoint-report.md`。

---

## §1 日期與背景

| 項目 | 內容 |
|------|------|
| **日期** | 2026-05-25 下午 |
| **背景** | 接續上午 affiliate readiness（commit `762386a`）後，於下午建立 `20260525-draft-book-review` blogger draft 之三檔組合（`.md` + `.publish.json` + `.fb.md`）並完成 build smoke |
| **本日下午工作性質** | content draft skeleton 新增（2 commit）+ push + build smoke read-only 驗證 + 本檔 docs-only |
| **production state 改動** | ❌ 無（無 build artifact deploy；無 Blogger 後台 / GA4 後台 / FB 後台操作；新增之 draft 文章 `status: draft` + `draft: true`，正確被所有 build pipeline 過濾，未進 dist / dist-blogger / dist-promotion）|

---

## §2 Phase 名稱與時間序

下午共 4 個 phase（按時序由舊至新；皆從 efe40b9 baseline 出發）：

| # | phase | 性質 | 落地物 |
|---|-------|------|--------|
| 1 | `20260525-pm-sidecar-readiness-a` | read-only inspection | 確認既有 commit `efe40b9` 之 `.publish.json` schema 對齊 + validate baseline 0/39/34 不變；無 commit |
| 2 | `20260525-pm-fb-sidecar-draft-a` | content add（單檔）| 新增 `.fb.md` 第三檔；commit `7e7102b`（local） |
| 3 | `20260525-pm-fb-sidecar-push-main-a` | git sync | `git push origin main`：`efe40b9..7e7102b main -> main` fast-forward；無 commit |
| 4 | `20260525-pm-sidecar-build-smoke-a` | build smoke read-only | 跑 5 個 script 驗 pipeline；產物全落 gitignored dist-* / .cache/；無 commit |

本檔自身為 phase 5：`20260525-pm-sidecar-checkpoint-doc-a`（docs-only）。

---

## §3 Commit timeline

下午共 2 commits（pre-PM HEAD `762386a`；本檔之外）：

| # | commit | message | phase | 性質 |
|---|--------|---------|-------|------|
| 1 | `efe40b9` | `chore(content): add publish sidecar for blogger book-review draft` | （上午延伸；本日早些時候建立）| content new（34 行；單檔 `.publish.json`）|
| 2 | `7e7102b` | `chore(content): add fb sidecar for blogger book-review draft` | pm-fb-sidecar-draft-a | content new（20 行；單檔 `.fb.md`）|

加上本檔 commit 之後將為下午第 3 commit。

### 3.1 統計

- **content new**：2 commits（皆單檔；皆對應同一篇 blogger draft 之 sidecar）
- **content modify**：0
- **source / settings / templates / scripts / package.json / dist / deploy 變動**：0
- **push 動作**：1 次 origin/main（pm-fb-sidecar-push-main-a；fast-forward）
- **build / validate**：5 次 read-only（pm-sidecar-build-smoke-a：validate:content / build / build:github / build:blogger / build:promotion）
- **Blogger / GA4 / FB 後台操作**：0

---

## §4 本次完成內容

### 4.1 `.publish.json` schema inspection passed（pm-sidecar-readiness-a）

- 對象：`content/blogger/posts/20260525-draft-book-review.publish.json`（commit `efe40b9` 已建）
- 比對：`docs/publish-json-schema.md` §1～§12 + `content/templates/_sample.publish.json`
- 結論：✅ 6 個頂層 key 齊全；`schemaVersion: 1`；`canonical.source: "auto"`；`blogger.type: "post"`；`blogger.status: "draft"`；`publishedUrl/publishedAt/publishYear/publishMonth` 正確留空（per §5.3 唯一真相規則）；`github.status: "draft"`；無 `$comment`；無 `contentKind` / `series`（per §2 不可塞入規則）
- 無修正項

### 4.2 `.fb.md` draft sidecar added（pm-fb-sidecar-draft-a）

- 新增：`content/blogger/posts/20260525-draft-book-review.fb.md`（20 行；commit `7e7102b`）
- schema 對齊：`docs/fb-sidecar-schema.md` §3.1 欄位（`enabled: false` / `page: "fan1"` / `target: "auto"` / `customUrl: ""` / `hashtags: []` / `title: "[貝果書屋] 待填書評文章"` / `titleEn: "Draft Book Review"` / `note` / `finalUrl: ""`）
- body：TODO placeholder（避免觸發 `fb-md-content-missing` warning）+ `{{ articleUrl }}` URL placeholder（draft 階段未觸發 `fb-md-placeholder-unresolved`）
- 邊界：未寫死 UTM；未寫死 publishedUrl / canonical / Blogger URL；未動 `.md` / `.publish.json`

### 4.3 三檔組合完成

```
content/blogger/posts/20260525-draft-book-review.md           ← 70a697d 既有（content + frontmatter）
content/blogger/posts/20260525-draft-book-review.publish.json ← efe40b9（platform 回填 sidecar）
content/blogger/posts/20260525-draft-book-review.fb.md        ← 7e7102b（FB 推廣 sidecar）
```

per `docs/publish-bundle.md` §1.2 之三檔組合定義；slug 一致：檔名前綴 `20260525-draft-book-review` + frontmatter `slug: "draft-book-review"`（檔名前綴與 `slug` 不完全一致屬本 repo 既有慣例，與 `20260515-we-media-myself2.*` 同型）。

### 4.4 Local commit 已 push（pm-fb-sidecar-push-main-a）

- `git push origin main` ✅ fast-forward
- 範圍：`efe40b9..7e7102b  main -> main`
- 非 force push；非 merge；非 rebase
- post-push: HEAD = origin/main = `7e7102b`；ahead / behind = 0 / 0

---

## §5 Validation / build smoke 結果（pm-sidecar-build-smoke-a）

| 指令 | 結果 | 細節 |
|------|------|------|
| `npm run validate:content` | ✅ | `0 error(s) / 39 warning(s) on 34 post(s)`；與 `b409580` baseline byte-identical |
| `npm run build` | ✅ | prebuild（`build-github --mode=build`，163 ms）+ vite build（35 modules，566 ms）+ postbuild（`build:sitemap`：14 url entries + robots.txt，43 ms）|
| `npm run build:github` | ✅ | 163 ms；wrote `.cache/pages/*` + `.cache/data/*`；內含 `[validate-content] 0 warning(s)` |
| `npm run build:blogger` | ✅ | 90 ms；sources scanned blogger=5 / github-cross=3；total ready 3 / filtered 5；wrote `dist-blogger/posts/{we-media-myself2,github-pages-blog-planning,portable-blog-system-mvp}/*` + 3 index pages + build-manifest |
| `npm run build:promotion` | ✅ | 48 ms；sources scanned github=3 / blogger=5；total enabled 2 / filtered 6；wrote `dist-promotion/facebook/{blogger/we-media-myself2.txt,github/github-pages-blog-planning.txt}` + all-posts-index + build-manifest |

### 5.1 build 範圍覆蓋判定

依 `package.json` 之 `prebuild` / `postbuild` hooks：

- `npm run build` = `prebuild`（`build-github --mode=build`）+ `vite build` + `postbuild`（`build:sitemap`）
- → 涵蓋 `build:github`（透過 prebuild；差異僅 `--mode=build` 旗標）
- → 涵蓋 `build:sitemap`（透過 postbuild）
- → **不**涵蓋 `build:blogger`（獨立 script）
- → **不**涵蓋 `build:promotion`（獨立 script）

---

## §6 Pipeline 判定

| 檢查項 | 結果 |
|--------|------|
| draft `status: draft` + `draft: true` 正確被 `load-posts` 過濾 | ✅ |
| `.fb.md status: draft` / `enabled: false` 被 build-blogger / build-promotion 過濾 | ✅（filter 訊息明確列出 `20260525-draft-book-review.fb.md (status:draft)`）|
| draft 文章未進 `dist/posts/*` | ✅ `dist/posts/` 僅 3 條：github-pages-blog-planning / portable-blog-system-mvp / we-media-myself2 |
| draft 文章未進 `dist-blogger/posts/*` | ✅ `dist-blogger/posts/` 僅 3 條：we-media-myself2 / github-pages-blog-planning / portable-blog-system-mvp |
| promotion output 未產生 `draft-book-review.txt` | ✅ `dist-promotion/facebook/` 僅 2 條 txt（blogger/we-media-myself2.txt + github/github-pages-blog-planning.txt）|
| grep `draft-book-review` / `20260525-draft` across dist / dist-blogger / dist-promotion | ✅ No files found |
| build 產物皆 gitignored | ✅ `dist/` / `dist-blogger/` / `dist-promotion/` / `.cache/` 全部不出現在 git status |
| source working tree 仍 clean | ✅ build 前後 git status 皆 `## main...origin/main` 無 entries |

---

## §7 Non-blocking observations

1. **build-blogger / build-promotion scanner 行為**：scanner 會把 `.fb.md` 視為獨立 source entry 掃入再過濾（filter 訊息中可見 `*.fb.md (status:draft)` 與 `*.md (draft:true)` 兩條 entry 同時出現）；屬既有掃描器行為，本批未引入。最終 dist 輸出正確。
2. **`seo.robots` draft 預設 `index,follow`**：屬 advisory，未阻擋；日後升 ready 前若希望保守索引，可改為 `noindex,follow`。
3. **`.fb.md` body 為 TODO placeholder**：日後升 `ready` / `published` 前需補正式 FB 推廣文案，否則違反 `docs/fb-sidecar-schema.md` §7.1 之 ready/published error 規則。
4. **`.fb.md` hashtags 目前空陣列**：fallback chain 為 `.fb.md hashtags` > legacy `promotion.facebook.hashtags` > `series.hashtags` > `[]`；本 draft 三層皆空 → 最終 `[]`；日後可在本 `.fb.md` 直接補 per-post override（per `docs/series-schema.md` §19）。
5. **UTM 不寫死於 `.fb.md`**：由 `content/settings/promotion.config.json` 之 `facebook.utm` + build 階段動態組裝（per `docs/fb-sidecar-schema.md` §8.3）；Blogger ↔ GitHub 互導 UTM 另由 `src/scripts/ga4-url-builder.js` 處理（per `CLAUDE.md` §16.4）。
6. **檔名前綴 vs frontmatter slug 不完全一致**：本 draft 檔名前綴 `20260525-draft-book-review`，frontmatter `slug: "draft-book-review"`；屬本 repo 既有慣例（與 `20260515-we-media-myself2.*` 同型）；schema 不強制；無 build / validate 影響。

---

## §8 本日下午未做事項

明確列出本日下午**未碰**之範圍：

| 項目 | 狀態 |
|------|------|
| 修改 `src/`（views / styles / js / scripts） | ❌ 無 |
| 修改 `content/settings/` / `content/templates/` / `content/{site}/pages/` | ❌ 無 |
| 修改其他既有 `content/{site}/posts/*.md` / `.publish.json` / `.fb.md` | ❌ 無 |
| 修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`（直接編輯）| ❌ 無（僅 build 產出 gitignored 物）|
| 修改 `README.md` / docs index / `CLAUDE.md` | ❌ 無 |
| 修改 `package.json` / `vite.config.js` / `.gitignore` | ❌ 無 |
| 修改既有 docs（schema / completion-report / 5/25 上午 6 docs 等）| ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`）| ❌ 無 |
| 執行 `npm install` / `npm run dev` / `npm run preview` | ❌ 無 |
| 執行 deploy（`cp -r dist/*` to deploy repo / push gh-pages）| ❌ 無 |
| 觸碰 Blogger 後台（Theme CSS / per-post HTML 重貼 / 發布 / 編輯）| ❌ 無 |
| 觸碰 GA4 後台 / FB 後台 | ❌ 無 |
| 啟動 deferred items（FB-P5-c / Admin-2-b-2 / reverse UTM fixture / custom domain / AdSense / Blogger listener 等）| ❌ 無 |

下午唯一允許並執行之動作：

- ✅ 新增 1 個 `content/blogger/posts/20260525-draft-book-review.fb.md`（commit `7e7102b`）
- ✅ `git push origin main`（fast-forward）
- ✅ 跑 5 個 read-only build / validate scripts（產物全落 gitignored dist-* / .cache/）
- ✅ 新增本檔 `docs/20260525-pm-sidecar-checkpoint-report.md`（commit pending）
- ✅ git read-only commands（status / log / rev-parse / diff / grep）

---

## §9 Final baseline

| 項目 | 值 |
|------|---|
| repo | `portable-blog-system` |
| working directory | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（本檔 commit 前）| `7e7102bdad25a31eb060abbccaf32820ab17ac64`（short `7e7102b`）|
| origin/main（本檔 commit 前）| `7e7102bdad25a31eb060abbccaf32820ab17ac64` |
| ahead / behind（本檔 commit 前）| `0 / 0` |
| working tree（本檔 commit 前）| clean |
| validate baseline | `0 error(s) / 39 warning(s) on 34 post(s)`（與 `b409580` byte-identical）|
| build smoke | 5 scripts ✅；產物全 gitignored |
| deploy 狀態 | 未動（gh-pages production 仍為 `960f234` 之 2026-05-24 deploy；本日下午無新 deploy）|

---

## §10 Cold-start 指引

給下一個 Claude session 之 cold-start 讀取順序（下午延伸版）：

| # | 文件 | 用途 | 預估時間 |
|---|------|------|---------|
| 1 | **本文件**（`docs/20260525-pm-sidecar-checkpoint-report.md`）| 5/25 下午全貌總覽；接續工作起點 | ~5 min |
| 2 | `docs/20260525-am-checkpoint-report.md` | 5/25 上午全貌（Phase 1 usability / user guide drift / reverse UTM readiness / affiliate readiness）| ~5 min |
| 3 | `docs/publish-bundle.md` §1 / §2 / §4 | 三檔組合定義與 severity matrix | ~3 min |
| 4 | `docs/publish-json-schema.md` §1～§9 | `.publish.json` schema | ~5 min |
| 5 | `docs/fb-sidecar-schema.md` §1 / §3 / §5 / §7 / §8 | `.fb.md` schema | ~5 min |
| 6 | 最後確認 | `git status --short --branch` 應為 `## main...origin/main`（clean）；`git rev-parse HEAD` 應等於 `git rev-parse origin/main`（皆 = 本檔 commit hash 或更新 HEAD）| ~1 min |

讀完 1-6 後即可判斷下一步方向。

若需深入查 5/24 細節，再讀 `docs/20260524-eod-report.md`。

---

## §11 邊界保證

本 phase `20260525-pm-sidecar-checkpoint-doc-a` 嚴格 docs-only：

| 項目 | 狀態 |
|------|------|
| 新增 `docs/20260525-pm-sidecar-checkpoint-report.md`（本檔）| ✅ 唯一允許之動作 |
| 修改其他 docs（含 5/25 上午 6 docs + 5/25 下午之 content / sidecar 既有檔）| ❌ 無 |
| 修改 README / docs index / CLAUDE.md | ❌ 無 |
| 修改 src / content / templates / settings / build scripts / package.json | ❌ 無 |
| 修改 dist / dist-blogger / dist-promotion / dist-reports | ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`）| ❌ 無 |
| 重新執行 `npm install` / `npm run build*` / `npm run validate*` / `npm run dev` | ❌ 無（baseline 已於 pm-sidecar-build-smoke-a 確認，本 phase 不重跑）|
| 觸碰 Blogger 後台 / GA4 後台 / FB 後台 | ❌ 無 |
| 啟動任何 deferred items / 未來候選 | ❌ 無 |

本文件落地後**不**改變任何 production state；屬純 cold-start onboarding 工具。

---

（本文件結束）
