# 2026-05-29 Reverse UTM Fixture Publish Readiness Preanalysis

Phase: `20260529-pm-8-reverse-utm-fixture-publish-readiness-report-docs-only-a`
Date: 2026-05-29 14:30 +0800
Scope: docs-only（唯一新增檔；本檔即本 phase 全部 artifact）

本檔將 phase `20260529-pm-7-reverse-utm-fixture-publish-readiness-preanalysis-readonly-a` 之 read-only publish-readiness preanalysis 結論固化落地，供未來 cold-start session / promote 決策直接讀取，避免重新盤點。

對應上層文件：
- `CLAUDE.md` §13（download 規則；`download.enabled: true` 但無 `fileUrl` 應警告）
- `CLAUDE.md` §16.4（Blogger → GitHub reverse UTM 規則；source landed but dormant）
- `CLAUDE.md` §23（draft 不輸出）
- `docs/20260529-reverse-utm-deploy-gate-readiness-triage.md`（pm-6 gate triage）
- `docs/reverse-utm-fixture-plan.md`（fixture SOP；§6 pm-26 啟動條件）

---

## 1. Executive Summary

- pm-7 為 **read-only preanalysis**（純分析；零修改）；本檔（pm-8）為其結論之 docs-only landing。
- **Blogger fixture 已以 draft 形式存在**：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`（commit `ee263eb`），Blogger `mode: full`，`relatedLinks[0]` 指向 GitHub Pages `portable-blog-system-mvp` → 結構上構成 GitHub cross-link。
- **目前不建議 promote-to-ready**。
- **主要 hard blocker：`download.fileUrl` 為空（`""`）**。
- `validate:content` **不會擋**（無 fileUrl 檢查）；`build-blogger` 與 renderer **目前也不會 warning**（§13 規格期望尚未實作）。
- 但 `blogger-post-full.ejs` 會在 `fileUrl` 為空時**靜默省略整個 download box** → 一篇 `contentKind: download` 且標題即「…下載」的文章渲染後**沒有下載按鈕** → 內容品質重大缺陷。
- **reverse UTM remains landed but dormant**（draft 不輸出 → `renderFullPost` 不觸發 → 無 post.html）。
- **pm-26 deploy gate remains BLOCKED**。

---

## 2. Baseline（2026-05-29 14:30 +0800）

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `0be7e89da7ba453e0d67de689587669a6c0cc1b7`（short `0be7e89`）|
| origin/main | `0be7e89da7ba453e0d67de689587669a6c0cc1b7` |
| latest commit subject | `docs(reverse-utm): record deploy gate readiness triage` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`）|
| validate:content | `0 error(s) / 42 warning(s) on 37 post(s)` |

→ baseline 完全對齊 pm-7 啟動時之狀態。42 warnings 全屬 `content/validation-fixtures/`（validator 錯誤樣本，by design）；draft fixture 本身未新增任何 warning。

---

## 3. Evidence Sources

本分析依據以下檔案（皆 read-only 檢視；本 phase 僅新增本 docs 檔，未改下列任一）：

| 檔案 | 角色 |
|---|---|
| `docs/20260529-reverse-utm-deploy-gate-readiness-triage.md` | pm-6 gate triage；gate remains BLOCKED |
| `docs/20260529-reverse-utm-fixture-candidate-preanalysis.md` | am-18 Pairing 1 設計（relatedLinks `sourceKey: github`）|
| `docs/reverse-utm-fixture-plan.md` | fixture SOP；§6 pm-26 啟動條件（全 AND）；§1.2 reverse UTM 規格 |
| `docs/phase-2-candidate-roadmap.md` | §3.3 reverse UTM pm-26 BLOCKED |
| `content/blogger/posts/20260529-phonics-practice-sheet-download.md` | draft fixture（已落地；本 phase 未改）|
| `src/scripts/ga4-url-builder.js` | reverse UTM 注入核心（`isGithubCrossLink` / `applyCrossSiteUtm`）|
| `src/scripts/build-blogger.js` | `deriveRenderedCrossLinks` / `renderFullPost`；download 透傳（line 452）|
| `src/views/blogger/blogger-post-full.ejs` | download box render（line 81 條件）；`relatedLinksRendered` 讀取 |
| `src/scripts/validate-content.js` | content validator；**無 fileUrl 檢查** |

---

## 4. Current Fixture State

| 欄位 | 值 |
|---|---|
| file path | `content/blogger/posts/20260529-phonics-practice-sheet-download.md` |
| title | 注音符號描寫練習單下載 |
| slug | `phonics-practice-sheet-download` |
| status | `draft` |
| draft | `true` |
| contentKind | `download` |
| primaryPlatform | `blogger` |
| publishTargets.github | `enabled: false` / mode: full |
| publishTargets.blogger | `enabled: true` / mode: full |
| description | ✅ 已填 |
| searchDescription | ✅ 已填 |
| cover | `""`（空值）|
| coverAlt | `""`（空值）|
| download.enabled | `true` |
| download.fileUrl | `""`（空值）|
| download.title / description / fileType / licenseNote | ✅ 皆已填（fileType: PDF）|
| relatedLinks[0].kind | `internal` |
| relatedLinks[0].sourceKey | `"github"`（registry 既有，per `link-sources.json`）|
| relatedLinks[0].platform | `"github"`（fallback / backward-compatible 欄位）|
| relatedLinks[0].url | `https://babel-lab.github.io/portable-blog-system/posts/portable-blog-system-mvp/`（指向 `portable-blog-system-mvp`）|
| otherLinks | 未定義 |

判斷依據（per `CLAUDE.md` §16.4）：`relatedLinks[0].url` hostname `babel-lab.github.io` 等於 `settings.site.githubSiteUrl` host → 結構上構成 GitHub cross-link，不依賴 `kind` 欄位。

---

## 5. Publish Readiness Decision

- ❌ **目前 fixture is NOT ready to promote。**
- ❌ **不建議直接 `draft → ready`。**
- ❌ **不建議在 `download.fileUrl` 空值狀態下上線**（會產出無下載按鈕的下載文）。
- ❌ **不建議直接 build / deploy / Blogger repost / GA4 validation / unblock pm-26 gate。**

技術閘門（`validate:content` / `build:blogger`）不會擋，但正因技術不擋，更須在 promote 前人工把關 `fileUrl`。唯一 hard blocker = 真實下載檔 URL 尚不存在。

---

## 6. download.fileUrl Risk

| 層 | 行為 | 判定 |
|---|---|---|
| `validate-content.js` | **完全無 `fileUrl` 檢查**（grep 0 match；唯一 download 相關為 `VALID_CONTENT_KIND` set 與 SEO-1 fallback 註解）| ❌ 不會擋；0 errors 維持 |
| `build-blogger.js` | 僅 `download: post.download ?? null`（line 452）**透傳**；全 src 無任何 fileUrl warning 實作 | ❌ 不會 warning（§13「build 時應警告」為規格期望但尚未實作）|
| `blogger-post-full.ejs` | line 81：`if (post.download && post.download.enabled && post.download.fileUrl)` → `fileUrl: ""` 為 falsy → **整個 `.lab-download-box` 區塊靜默省略** | 無破版、無空 CTA（符合 §17），但下載文沒有下載按鈕 |

結論：
- `fileUrl` 空字串會讓 download box 整塊不輸出。
- **技術不報錯，但內容品質有重大缺陷**（download 文章渲染後無下載入口；fixture 內文亦自承「實際下載檔尚未上傳，待定稿後補上」）。
- **promote-to-ready 前必須取得真實 PDF URL 並回填 `fileUrl`**（PDF 須先上傳至 Blogger / Google Drive / 外部圖床，per `CLAUDE.md` §22 圖片不自動上傳）。

---

## 7. Reverse UTM Render / Build Path

注入鏈路（3 處 source）：
- `src/scripts/ga4-url-builder.js`：`isGithubCrossLink` / `applyCrossSiteUtm` `direction: 'to_github'`
- `src/scripts/build-blogger.js`：`deriveRenderedCrossLinks`（line 90）於 `renderFullPost`（line 113-125）對 `relatedLinks` / `otherLinks` 預處理
- `src/views/blogger/blogger-post-full.ejs`：render 端讀 `relatedLinksRendered` / `otherLinksRendered`（使用 `item.target` / `item.rel`）

觸發條件（全部成立才注入）：
- post 通過 draft 過濾（status ≠ draft）→ 進 `blogger.posts` render loop
- `post.bloggerMode === 'full'`（line 515；`renderFullPost` 是 `deriveRenderedCrossLinks` 唯一 caller）
- link item `url` hostname == `settings.site.githubSiteUrl` host
- 策略 A：url 未含任何既有 `utm_*`（否則跳過注入，仍套 target / rel）

draft 為何不觸發：build-blogger 先經 `loadBloggerPosts` 過濾，draft 進 `filteredOut`（不在 `blogger.posts`）→ render loop 不含此 post → `renderFullPost` 不被呼叫 → **不產生 post.html → 注入路徑 dormant**。

ready 後預期輸出：
```
dist-blogger/posts/phonics-practice-sheet-download/post.html
```

ready 後需驗證 UTM keys（relatedLinks[0] 指向 GitHub Pages）：
```
utm_source=blogger
utm_medium=referral
utm_campaign=portable_blog_system
utm_content=related_links
```

另需驗：
- `target="_blank"`
- `rel` token 合併（含 `nofollow noopener noreferrer`；不重複 token）
- 非 GitHub link 不誤注入
- legacy summary CTA（`internal_referral`）不變；forward（GitHub→Blogger）UTM 不變

---

## 8. Required Items Before Promote-to-Ready

### Must-fix / Blocking

- 取得並回填真實 `download.fileUrl`（須先有已上傳之真實 PDF URL）
- `status: draft → ready`
- `draft: true → false`
- 移除或改寫內文中「草稿 / 待定稿補上 / 實際下載檔尚未上傳」等未完成語句（fixture body line 53 / 57 / 65）
- ⚠️ 上述 content mutation 需 **user explicit approval**（屬獨立 content-mutation phase）

### Should-fix / Not Blocking

- 補 `cover` / `coverAlt`（OG / FB 分享縮圖品質；空值技術不報錯但無社群縮圖）
- 確認 `relatedLinks[0]` 目標 GitHub URL（`portable-blog-system-mvp`）已 deploy 且可達

### Can Remain Unchanged

- `publishTargets` 設定（blogger.enabled `true` / mode `full` / github.enabled `false` 皆正確）
- `description` / `searchDescription`（已填，SEO 充足）
- `download.title` / `description` / `fileType` / `licenseNote`（已填）
- `relatedLinks` 之 `sourceKey` / `platform` / `kind` 設計（已符合 am-18 §4.2：`sourceKey: github` 為主、`platform` 僅 fallback、`kind: internal`）

---

## 9. Candidate Next Steps

> 任一候選之啟動皆須**獨立 phase + 該次 phase 之 user explicit approval**；本檔之列舉**不**等同任一段之預授權。

- **Candidate A: Final Idle Freeze / EXIT** —— 本階段結束，不開下一 phase。🟢 安全；不解除 gate。
- **Candidate C: prepare real download asset / fileUrl decision** —— 先決定 / 準備真實 PDF 並回填 `fileUrl`。🟢 promote 真正前置；不解除 gate。
- **Candidate D: actual fixture promote-to-ready phase** —— 真正改 `draft → ready` + 必要欄位。🔴 需 user explicit approval；本階段不得執行；單步仍不解 gate。
- **Candidate E: build:blogger output verification phase** —— promote 後做 build 驗證（驗 §7 UTM keys / target / rel）。🔴 promote 後才做；本階段不得執行。
- **Candidate F: deploy / Blogger repost / GA4 validation sequence** —— 最後 activation sequence。🔴 本階段不得執行；完成後始解除 pm-26 gate。

⛔ 明確不推薦：直接 promote-to-ready、直接 deploy、直接 Blogger repost、直接 GA4 validation、直接 unblock pm-26 gate。

---

## 10. Explicit Non-Actions（本 docs-only phase 未做）

| # | 未執行 |
|---|---|
| 1 | ❌ no content changes（既有 37 posts / draft fixture / GitHub reuse target 全不動）|
| 2 | ❌ no source changes（`src/**` 不動）|
| 3 | ❌ no settings changes（`content/settings/**` 不動）|
| 4 | ❌ no templates changes（`content/templates/**` 不動）|
| 5 | ❌ no package changes（無 npm install）|
| 6 | ❌ no dist / gh-pages / .cache changes |
| 7 | ❌ no build / deploy |
| 8 | ❌ no Blogger repost |
| 9 | ❌ no GA4 validation |
| 10 | ❌ no reverse UTM activation（remains landed but dormant）|
| 11 | ❌ no pm-26 deploy gate unblock（remains BLOCKED）|
| 12 | ❌ no draft-to-ready change（fixture 維持 draft；`download.fileUrl` 維持空值）|
| 13 | ❌ no admin-write-cli dry-run / apply |
| 14 | ❌ no Admin Apply enable / no middleware write route |

本檔落地後 production state drift = 0；屬純 docs entry。

---

（本文件結束）
