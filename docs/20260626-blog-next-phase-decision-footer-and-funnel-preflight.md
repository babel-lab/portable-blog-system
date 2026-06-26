# BLOG 下一階段決策 Preflight / Spec Lock：Footer 揭露與 Download Funnel

> 文件名稱：**BLOG 下一階段決策 Preflight（Footer disclosure / Download funnel / GitHub-new-domain / legacy routing）**
> 日期：**2026-06-26**
> 對象專案：`D:\github\blog-new\portable-blog-system`（portable-blog-system，第一版 MVP）
> 性質：**docs-only preflight / spec lock**。本文件**不進 source、不進 build/deploy、不碰 Blogger/Google backend**，僅把上一階段 review 轉成下一階段「可決策」的選項與 scope。

---

## 1. Baseline

| 項目 | 狀態 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `c1431ba` |
| subject | `docs(review): add blogger static page function review` |
| working tree | clean |
| origin/main | synced（ahead/behind 0/0） |
| `.git/index.lock` | absent |

**上一階段參考文件**：`docs/20260626-blogger-static-pages-function-review.md`（259 行；Blogger 系統靜態頁功能檢視與調整建議；P1–P10 問題總表 + §8 Open Questions）。本 preflight 以該 review 為唯一事實來源，不重新掃 source。

---

## 2. Purpose

本文件目的：把 review 的 P1–P10 與 §8 Open Questions 轉成**下一階段可決策的 preflight / spec lock**，讓 Dean 在不進 source 的前提下拍板方向。

明確界線：

- **不進 source**：不改 `src/` / `content/` / `settings/`。
- **不進 build/deploy**：不跑 build / dev / preview / sitemap / deploy / gh-pages。
- **不碰 Blogger/Google backend**：不進 Blogger 後台、Google Form、Google Drive、GA4、AdSense、Search Console、Admin write path。
- 本文件僅整理 **Footer disclosure / Download funnel / GitHub-new-domain / legacy routing / nav / listing 不對稱**等下一階段決策題；**所有選項皆「列出不實作」**。

---

## 3. Confirmed facts from review

### 3.1 Blogger static pages / templates 已確認事實

- 頁面 source of truth = `src/views/**/*.ejs`；Blogger 端由 `build-blogger.js` 產生**手貼 HTML**（full / summary / redirect-card / home-index / category-index + copy-helper / meta-json / publish-checklist），repo 不模擬 Blogger 預覽。
- Blogger full 模板現有區塊：canonical + inline JSON-LD、header、book photo、affiliate（legacy `links[]` + dual-block `blocks[]`）、body、**download box 僅 `download.fileUrl` 直接下載**、related/other links（含 reverse-UTM 預處理）、hashtags、beforeRelatedLinks AdSense anchor。
- summary / redirect-card：description + CTA（canonical + UTM）；canonical 缺漏皆有 fallback 文案；不渲染全文。
- 生產線穩定：GitHub Pages live、Blogger 手動發布、GA4 live、validator baseline 皆穩定，**無阻斷生產級問題**。

### 3.2 Blogger-only 能力

- Blogger 手動發布輔助鏈（copy-helper / meta-json / publish-checklist）。
- Blogger dual-block affiliate（`affiliate.blocks[]`，**Blogger-only surface**；GitHub 維持 legacy 單區塊 byte-identical）。
- reverse-UTM（Blogger→GitHub）source 已 landed 但 **un-deployed / dormant**（須後台重貼，pm-26 gate BLOCKED）。
- Blogger gated NO INDEX：須 Dean **後台手動**設定「自訂 robots 標頭標記」；系統**無法** inject Blogger head。

### 3.3 目前只是文件觀察、尚未 source / Admin / GitHub / new-domain 實作

- **Download funnel renderer（P3/P4）**：`gatedDownload`（google-form / formEmbedUrl / postSubmitResource）與 `downloadFunnel`（role / targetGatedPage / ctaEventName / entryPages）schema 已 spec-lock + validator 多 slice 把關，但**無任何模板 render**。
- GitHub post-detail 的 download landing 分支仍讀**舊欄位** `download.landingPage`，**不吃**新 funnel schema（`pageType: gated_download` + `gatedDownload`）。
- Blogger full **無** gated / Google Form / post-submit 分支。
- funnel draft pair（entry / access）為 placeholder 內容、`status: draft` / `draft: true` / `github.enabled: false` / `blogger.enabled: true` → 不進 production listing/sitemap，前端不渲染。
- **Footer 揭露（P1/P2）**：`footer.config.json.links`（`/privacy/`、`/affiliate-disclosure/`）存在於 settings，但 `footer.ejs` **未渲染**、頁面模板**未生成** → 純文件觀察。
- 空 stub（about/search/breadcrumb/sidebar/DS layouts·forms-search）、nav 缺 `/tags/`·DS、§17 版型落差（Breadcrumb/TOC/Sidebar/Social Follow）皆為文件觀察，未實作。

---

## 4. Blogger-only vs transferable decisions

### 4.1 只適用 Blogger 的結論

- funnel draft pair `primaryPlatform: blogger` / `blogger.enabled: true` / `github.enabled: false` → 現階段 funnel 意圖**僅** Blogger。
- Blogger gated NO INDEX 只能後台手動；系統 robots 注入（`HEAD_PARTIALS`）對 Blogger **不適用**。
- dual-block affiliate 為 Blogger-only surface。

### 4.2 不能推論到 GitHub Pages / future new-domain / merged site

- 「Blogger funnel 內容已存在」**不等於** GitHub / new-domain 要有 funnel；input packet 標 `future_possible_not_active`（Q3）。
- GitHub robots / sitemap / listings 由 `page-type-robots.js` + `HEAD_PARTIALS` + `build-sitemap.js` 推導；此鏈為 GitHub-only，**不能**反推 Blogger 行為。
- 現 `githubSiteUrl` = project-site `babel-lab.github.io/portable-blog-system/`；**new-domain / merged site 尚無任何 binding**，不可由現況推導 URL / canonical / 平台政策。

### 4.3 若未來要轉成系統功能，需重設計的層面

| 層面 | 需重設計的內容 |
| --- | --- |
| **metadata** | GitHub post-detail 的舊欄位 `download.landingPage` → 新 `pageType: gated_download` + `gatedDownload` schema，須橋接或汰換（兩維度目前不對齊）。 |
| **renderer** | GitHub post-detail + Blogger full 皆需新增 gated 分支（form embed / entry CTA / post-submit UI）；目前全為 markdown body placeholder。 |
| **Admin UI** | funnel surface 目前 read-only 呈現；若要管理需新 panel，且**不得**違反「無寫入路徑」紅線。 |
| **validation** | 跨平台 funnel（GitHub enabled）會觸發目前 deferred 的 dimension（Blogger robots、dangling/absolute URL、host-mismatch），須另開 validator slice。 |
| **sitemap/listings/robots policy** | gated = noindex / 不進 sitemap / 不進 listings 之政策目前僅 Blogger 維度落地；GitHub/new-domain 啟用時須一致化（含 §10 之 download/listing 不對稱）。 |

---

## 5. Decision item Q1：Footer disclosure links

> review P1（footer.ejs 未讀 config.links）+ P2（`/privacy/`·`/affiliate-disclosure/` 無模板、未生成 → 渲染即 dead link）。**以下選項僅列出，不實作。**

### Option A — 維持現狀（暫不渲染 `footer.config.json.links`）
- **會碰的檔案**：無。
- **不可碰的檔案**：全部（純維持）。
- **風險**：AdSense / 聯盟站台之隱私權 / 聯盟揭露長期缺可見連結；config 與呈現持續不同步。
- **驗證方式**：無（無變更）。
- **rollback / stop**：N/A。

### Option B — source landing（footer.ejs 渲染 config links + 同步補 privacy / affiliate disclosure 頁，避免 dead links）
- **會碰的檔案**：`src/views/layout/footer.ejs`（渲染 `links`）、新增 `src/views/pages/privacy.ejs` 與 `src/views/pages/affiliate-disclosure.ejs`、`src/scripts/build-github.js`（加 `/privacy/`·`/affiliate-disclosure/` route）、可能新增對應 content/copy 來源。
- **不可碰的檔案**：`content/`（除新揭露頁 copy 若以 content 管理）、其他 `settings/`、`package.json`/lockfile、`dist*/`、`gh-pages`、`.cache/`、Blogger 模板、Admin。
- **風險**：路由新增牽動 `build-github.js`；若只渲染 links 未補頁 → dead link（P2）；揭露文案屬法遵內容，須 Dean 提供/核定。
- **驗證方式**：`validate:content` 不退步、`check:validation-report` 27/0、新頁人工確認非 dead link（**須 Dean 授權跑 build/dev**）。
- **rollback / stop**：單一 phase commit，可 `git revert`；若 build route 影響既有頁輸出即 STOP。

### Option C — docs-only placeholder（先鎖資訊架構與文案，不進 renderer）
- **會碰的檔案**：僅新增 docs（如 `docs/<date>-footer-disclosure-ia-copy-lock.md`）。
- **不可碰的檔案**：`src/` / `content/` / `settings/` / build / deploy 全部。
- **風險**：低；僅延後實作，未解決 config↔呈現落差。
- **驗證方式**：`git status --short` + `git diff --check`。
- **rollback / stop**：docs-only，刪檔即還原。

### Q1 推薦與理由
**推薦 Option C → 之後 Option B。** 揭露文案屬法遵內容、且 Option B 須補頁避免 dead link；先以 **Option C** 鎖 IA + 文案（最小、零 source 風險、符合保守路線），待文案 Dean 核定後再以 **Option B** 作為**第一個最小 source phase**（見 §11）。Option A 不推薦（合規落差長期未解）。

---

## 6. Decision item Q2：Download funnel renderer

> review P3（funnel schema lock 但無 render 路徑）+ P4（Blogger full 無 gated 分支）。draft pair 仍 placeholder / draft / GitHub disabled。**以下選項僅列出，不實作。**

### Option A — 維持 docs/content draft，不進 renderer
- **metadata 影響**：無（schema 已 lock，維持）。
- **renderer 影響**：無。
- **validation 影響**：無（現 validator baseline 不變）。
- **標記**：Blogger-only（現況）。
- **風險 / stop**：低；funnel 內容定稿後仍無法由系統輸出（落差持續）。

### Option B — 只做 Blogger 手貼 HTML 支援
- **metadata 影響**：沿用 `gatedDownload` / `downloadFunnel`（Blogger 維度）；不動 GitHub 舊欄位。
- **renderer 影響**：`blogger/blogger-post-full.ejs` 加 gated 分支（form embed placeholder / post-submit CTA）；`build-blogger.js` 對應推導。
- **validation 影響**：可能需 Blogger-robots / formEmbedUrl 非空之 warning slice（warning-only-first）。
- **標記**：**Blogger-only**（不 transfer 到 GitHub）。
- **風險 / stop**：Blogger NO INDEX 仍須後台手動；`formEmbedUrl` 為空時須 placeholder 而非洩漏；GitHub 輸出**不得改變**（byte-identical）；若影響 GitHub 即 STOP。

### Option C — 跨平台 renderer 設計，但 source deferred
- **metadata 影響**：須橋接 GitHub 舊 `download.landingPage` → 新 schema（§4.3）。
- **renderer 影響**：GitHub post-detail + Blogger full 雙端 gated 分支設計（僅設計，source deferred）。
- **validation 影響**：須規劃 deferred dimension（dangling/absolute URL、host-mismatch、Blogger robots）之 slice 路線。
- **標記**：transferable（設計層），但**實作 deferred**。
- **風險 / stop**：範圍大、易 churn；draft 內容未定稿前實作 = 浪費；本階段僅文件。

### Option D — GitHub / new-domain 先不啟用 funnel
- **metadata 影響**：維持 `github.enabled: false` / `future_possible_not_active`。
- **renderer 影響**：GitHub 端不動。
- **validation 影響**：無新 GitHub funnel 維度。
- **標記**：政策決定（與 Q3 連動）。
- **風險 / stop**：低；明確凍結 GitHub funnel，避免誤推論。

### Q2 推薦與理由
**推薦 Option A（維持 draft）+ Option D（GitHub 不啟用）並存，Option C 僅作未來設計參考。** funnel 內容仍 placeholder draft，現在進 renderer（B/C）會 churn；最小安全 = 凍結現狀、待內容定稿再另開 funnel renderer phase。

---

## 7. Decision item Q3：GitHub / new-domain funnel activation

- **目前狀態（明確記錄）**：GitHub / new-domain funnel = **`future_possible_not_active`**（input packet 標記；`github.enabled: false`）。
- **不可由 Blogger funnel 推論 GitHub / new-domain 也要啟用**（§4.2）。
- **若未來要啟用，需前置條件（全部待 Dean 拍板，現不做）**：
  - **canonical / URL policy**：new-domain / merged site 的 canonical 與 URL 命名規則（現僅 project-site，無 binding）。
  - **pageType policy**：`gated_download` 等 pageType 在 GitHub/new-domain 的行為定義。
  - **robots / sitemap / listing behavior**：GitHub 端 noindex / 不進 sitemap / listing 行為一致化。
  - **gated page noindex policy**：GitHub 可由 `HEAD_PARTIALS` 注入（與 Blogger 後台手動不同），須明確政策。
  - **validation slice**：跨平台 funnel 之 deferred dimension（dangling/absolute URL、host-mismatch、Blogger robots）。
  - **Admin metadata surface**：funnel 跨平台呈現於 Admin（read-only，不得有寫入路徑）。

---

## 8. Decision item Q4：/tags/ nav

- **狀態**：是否將標籤索引 `/tags/` 納入主選單仍屬 **open question**（review P7）。Design System 是否刻意不放 nav 亦待確認。
- **不實作**。
- **風險**：使用者無從 nav 到達標籤索引（瀏覽性）。
- **deferred 條件**：待 Dean 確認內容意圖（`/tags/` 是否進主選單、DS 是否刻意排除）後，於 `navigation.json` 另開最小 phase。

---

## 9. Decision item Q5：root legacy index.html

- **狀態**：根 `index.html`（Phase 0 legacy skeleton，orphan，不進 build，nav 與現況不符）是否清理 / 隔離仍屬 **open question**（review P5）。
- **不實作**。
- **風險**：易被維護者誤當入口而誤判專案現況。
- **deferred 條件**：待 Dean 同意後另開 phase，清理或移至 `docs/legacy/` 隔離（本階段不動）。

---

## 10. Decision item Q6：MVP download listing asymmetry

- **狀態（記錄）**：download pages noindex + 不進 sitemap，但**預設仍進 listings**；唯一受影響 live post = `content/github/posts/20260504-portable-blog-system-mvp.md`。Blogger vs GitHub 維度：funnel frontmatter 三平台 indexing/listings 已對齊，但此 MVP post 屬舊行為（hold）。
- **不實作**（不主動加 validator warning、不加 `includeInListings` 欄位、不實作 `download-default-in-listings`）。
- **未來若要統一需處理**：
  - **metadata**：是否新增 `includeInListings` 顯式欄位 / `download-default-in-listings` 政策。
  - **renderer**：listing 產生端（home / post-list）對 download pageType 之過濾。
  - **validation**：download noindex ↔ listings 一致性之 warning slice。
- **deferred 條件**：待 Dean 決定 MVP post 內容意圖（維持 hold vs 排除於 listings）。

---

## 11. Recommended next implementation phase（最小安全 source phase 草案，僅寫文件不執行）

**建議：下一個最小安全 source phase = Q1 Option B 的「Footer 揭露最小落地」，但須先完成 Q1 Option C（文案/IA lock）並取得 Dean 對揭露文案的核定後才執行。** funnel renderer（Q2）**建議繼續 deferred**。

### 11.1 最小 source phase 草案（Footer 揭露）
- **預計會碰的檔案**：
  - `src/views/layout/footer.ejs`（讀 `footer.config.json.links` 並渲染）
  - 新增 `src/views/pages/privacy.ejs`、`src/views/pages/affiliate-disclosure.ejs`
  - `src/scripts/build-github.js`（加 `/privacy/`、`/affiliate-disclosure/` 兩 route）
  - （視 copy 管理方式）對應 content/settings copy 來源
- **不碰的檔案**：`content/`（除揭露頁 copy）、其他 `settings/`、`package.json`/lockfile、`dist*/`、`gh-pages`、`.cache/`、Blogger 模板、Admin、funnel draft pair。
- **驗證指令（須 Dean 授權跑 build/dev 時）**：
  - `npm run validate:content`（期望 0 / 134 / 106 不退步）
  - `npm run check:validation-report`（27 / 0）
  - `node src/scripts/check-page-type-validator.js`（103 / 0）
  - dev 預覽人工確認 footer links 非 dead link
- **rollback / stop 條件**：
  - 單一 phase commit，可 `git revert`。
  - 若 footer 渲染未同步補頁（dead link）→ STOP。
  - 若 build route 變更影響既有頁輸出（非 footer/新頁）→ STOP。
  - 若需 Blogger / Google / GA4 / Admin / backend 操作 → STOP。

### 11.2 為何 funnel renderer 建議繼續 deferred
funnel draft pair 仍 placeholder / draft / `github.enabled: false`；renderer 牽涉雙端模板 + metadata 橋接 + deferred validation dimension（§4.3）。在內容定稿前實作會 churn，違反保守路線。建議待 Dean 內容定稿後另開「funnel renderer phase」。

---

## 12. Validation plan for this docs-only phase

本階段**不跑 build / deploy / dev server / Blogger / GA4 / Form / Drive backend**。僅允許：

```
git status --short
git status -sb
git diff -- docs/20260626-blog-next-phase-decision-footer-and-funnel-preflight.md
git diff --check
git diff --stat
```

預期：唯一變更 = 新增本 docs 檔；`git diff --check` 無 whitespace / conflict marker 錯誤。

---

## 13. Final status

- 若只新增本 docs-only 文件且 diff 無異常 → 可 commit / push。
- commit message：`docs(decision): add blog next phase preflight`
- commit 前後回報：`git status --short` / `git status -sb` / `git log -1 --oneline` / origin/main 同步 / index.lock 是否存在。
- 完成後 read-only freeze 確認：working tree clean、ahead/behind 0/0、no index.lock。
- 最後 **STOP**，等待 Dean 下一步指示。

### 硬性 STOP 條件
- baseline 非 `c1431ba` clean → 立刻 STOP，不修。
- 需要修改 docs 以外任何檔案 → 立刻 STOP。
- 出現 index.lock → 立刻 STOP，不刪除，先回報。
- 不慎碰到 source/content/settings/package/dist/gh-pages/.cache/generated HTML → 立刻 STOP，不 commit。
- 需要 Blogger / Google / GA4 / Admin / backend 操作 → 立刻 STOP。

---

*本文件為 docs-only preflight，未修改任何 source / content / settings / build / deploy / live service，未碰 LearnOops 及任何 Blogger/Google backend。所有選項僅列出供決策，未實作。*
