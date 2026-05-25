# 2026-05-25 README Drift Audit

> Phase: `20260525-night-12-readme-drift-audit-readonly-a` → docs landing in `20260525-night-13-readme-drift-audit-doc-commit-a`
> 模式：docs-only audit doc landing；**不**修改 `README.md` 本身
> 來源：本文件為 night-12 read-only drift audit 結果整理 + night-13 docs commit

---

## §A. Baseline

### A.1 Audit baseline（night-12 啟動時 = night-13 docs landing 時）

| 項目 | 值 |
|---|---|
| repo | `portable-blog-system` |
| working directory | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `30cdadf5deebb309fe72cd1fd58815c347592307`（short `30cdadf`；deploy diff dry-run report commit）|
| origin/main | `30cdadf5deebb309fe72cd1fd58815c347592307` |
| ahead / behind | `0 / 0` |
| working tree | clean（`## main...origin/main`）|
| reverse UTM live 狀態 | 🟡 landed but dormant（per `CLAUDE.md` §16.4；user 5/25 night-10 決議採 C 路線維持 dormant）|

### A.2 audit 範圍

| 項目 | 涵蓋 |
|---|---|
| **audit 對象** | `README.md`（146 行）|
| **比對對象** | 當前 source / settings / dist / vite.config.js / package.json + 較新 docs |
| **本 phase 是否修改 README** | ❌ 否（night-12 read-only；night-13 僅落地 audit doc）|
| **是否觸及其他 source** | ❌ 否；唯一新增檔為本 audit doc |

### A.3 read-only 檢查依據

- `README.md` 全檔（146 行）
- `CLAUDE.md` 全檔（in-context）
- `package.json`（21 npm scripts）
- `vite.config.js`（appType: 'mpa' 確認）
- `docs/phase-1-completion-report.md`（Phase 9-z-d 正式 final）
- `docs/phase-status-20260523.md`（5/23 Phase 1 完成度盤點）
- `docs/20260525-phase1-usability-review.md`（5/25 am-3 usability review）
- `docs/20260525-phase1-user-guide-drift-check.md`（5/25 am-5 user-guide drift check；本 audit mirror 其結構）
- `dist/` 23 HTML / `dist-blogger/` 3 posts + index / `dist-promotion/` / `src/views/` 50+ EJS / `content/settings/` 16+ JSON

**任何 npm script 是否執行**：❌ 否；本 audit 純 grep / read；不執行 `validate:content` / `build:*` / `report:*` / `check:*`。

---

## §B. README 8 區段 drift audit 摘要

按 user spec 列 8 主要區段（npm 指令表 §C 列為附加；不在 user 8-section list 但 drift 嚴重）：

| § | 區段 | README 行 | drift 點數 | 最高嚴重度 |
|---|---|---|---|---|
| §B.1 | 專案定位 | 6-11 | 1 | 🔴 HIGH（D2）|
| §B.2 | （附加）主要 npm 指令表 | 23-36 | 5 | 🔴 HIGH（D3-D6）|
| §B.3 | 可用頁面與 URL | 38-53 | 1 | 🔴 HIGH（D8）|
| §B.4 | 內容資料夾 | 55-66 | 2 | 🔴 HIGH（D9）|
| §B.5 | Frontmatter 必填欄位 | 68-90 | 3 | 🔴 HIGH（D11-D13）|
| §B.6 | 發布狀態與 draft 過濾 | 92-100 | 0 | — |
| §B.7 | Phase 1 已完成項目 | 102-116 | 1 | 🔴 HIGH（D14）|
| §B.8 | 目前限制 | 118-126 | 6 | 🔴 HIGH（D19 為最嚴重之單一 drift）|
| §B.9 | Phase 2 及後續待辦 | 128-136 | 6 | 🔴 HIGH（D21-D23, D25）|
| 附加 §B.0 | Header / 摘要 | 1-4 | 1 | 🔵 INFO（D1）|
| 附加 §B.10 | 修改本專案 | 138-end | 1 | 🟡 LOW（D27）|

**總計 27 drift（D1-D27）**；分佈：HIGH 19 / MEDIUM 5 / LOW 2 / INFO 1。

---

## §C. D1-D27 Drift Table

### §C.1 Header / 摘要（line 1-4）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D1** | line 4 | 「Phase 1 收尾版本」 | Phase 1 已正式 final（per `docs/phase-1-completion-report.md` Phase 9-z-d；commit `4d68f50`）；範圍含 Phase 0~9-z-d；不只 GitHub Pages（含 Blogger 匯出 / FB promotion / GA4 live / sitemap）| 🔵 INFO | 措辭低估目前完成度；新讀者誤以為 Phase 1 還在收尾中 | 改「Phase 1 已正式 final」+ 補列 Blogger / FB / GA4 / sitemap 等已 live 能力 |

### §C.2 專案定位（line 6-11）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D2** | line 9 | 「Blogger 作為既有流量入口與 AdSense 內容站（**Phase 3 才做匯出**）」 | Phase 3 已 done；`build:blogger` 一鍵產 4 檔 dist（post.html / copy-helper.txt 13 區塊 / meta.json / publish-checklist.txt）；Blogger theme CSS 4 檔；`we-media-myself2` 已通過 build × 5 端到端 | 🔴 HIGH | 「Phase 3 才做匯出」直接誤導；讀者以為 Blogger 匯出未實作 | 移除「Phase 3 才做匯出」；改「Blogger 匯出已 live（per `blogger-export.md`）」|

### §C.3 主要 npm 指令表（line 23-36；user 8-section list 未包含但 drift 嚴重）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D3** | line 33 | `build:blogger \| 占位（Phase 3）` | ❌ active；`src/scripts/build-blogger.js` 504+ 行；產 3 ready posts × 4 檔 + Blogger home + 2 category index | 🔴 HIGH | 讀者跑 `npm run build:blogger` 預期無輸出，但實際產出 dist-blogger/；混淆 | 改「Blogger 4 檔 dist（含 13 區塊 copy-helper / publish-checklist）」|
| **D4** | line 34 | `build:promotion \| 占位（Phase 4）` | ❌ active；產 `dist-promotion/facebook/{blogger,github}/{slug}.txt` + all-posts-index.txt；UTM 自 `promotion.config.json` 注入 | 🔴 HIGH | 同上 | 改「產 FB 粉絲頁推廣文案 txt」|
| **D5** | line 35 | `build:sitemap \| 占位（Phase 5）` | ❌ active；postbuild 自動串接；產 `dist/sitemap.xml`（14 entries；filter noindex）+ `robots.txt` | 🔴 HIGH | 同上 | 改「sitemap.xml 14 entries + robots.txt」|
| **D6** | line 36 | `build:blogger-theme \| 占位（Phase 3）` | ❌ active；產 `dist-blogger/theme/blogger-{tokens,components,article,full-style}.css` 4 檔 | 🔴 HIGH | 同上 | 改「Blogger 主題 CSS 4 檔（tokens / components / article / full-style）」|
| **D7** | npm 表整體 | 表共列 11 個 script | 實際 `package.json` 有 **21 個 npm scripts**（per phase-1-usability-review §2.1 5 類；扣除 pre/post hooks 後 17 個 user-facing）；缺 **10 個**：`new:post` / `backfill:url` / `report:build` / `report:drafts` / `report:missing-tags` / `report:urls` / `report:series` / `report:book` / `check:links` / `check:images` / `smoke:reverse-utm` | 🟡 MEDIUM | 工具能力缺漏；user 不知有 report / check / new-post / backfill helpers | 補入 5 類分組（dev/build / build:* / validate-new-backfill / report:* / check+smoke）|

### §C.4 可用頁面與 URL（line 38-53）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D8** | line 50 | `/design-system/ \| Design System 占位（Phase 2 才填內容）\| 200` | ❌ DS 子頁已全部就位：`dist/design-system/{index,colors,spacing,typography,buttons,cards,article-components}/` × 7 頁；DS-3 hardcoded color resolved（10 fixes + 2 exemptions）| 🔴 HIGH | 「占位」說法直接矛盾實際 | 改「DS 子頁全部 live（colors / spacing / typography / buttons / cards / article-components）」|

📝 註：sitemap.xml / robots.txt 不在「可用頁面 URL 表」內；可考慮新增 row 但屬補完非 drift。

### §C.5 內容資料夾（line 55-66）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D9** | line 60 | `blogger/posts/  # Blogger 站 Markdown 文章（**Phase 3 才匯出**）` | 同 D2；Phase 3 已 done | 🔴 HIGH | 同 D2；重複 stale 訊號 | 移除「Phase 3 才匯出」 |
| **D10** | line 64 | `settings/  # **14 個 JSON 設定檔**` | 實際 16 個 production JSON（site / themes / categories / tags / ads / social-links / promotion / affiliate-networks / link-rules / seo / ga4 / navigation / sidebar / footer / series + 1 sample）+ 2 sample（per usability review §2.2）| 🟡 LOW | 數字落差小；不阻擋操作 | 改「16+ 個 JSON 設定檔」或「per `CLAUDE.md` §8」|

📝 註：tree 缺 `validation-fixtures/` 子目錄（28 個 `_test-*` fixture）+ 缺 `content/templates/` 之 6 個內容模板實際清單；屬補完非 drift。

### §C.6 Frontmatter 必填欄位（line 68-90）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D11** | line 76 | example 使用 `type: "tech-note"` | ❌ deprecated；Phase 8-g-5 (`44c0e8f`) 已對齊 sample post 為 `contentKind: "tech-note"`；Phase 8-g-6 (`5976162`) 對齊 5 個 templates；validate 會 warn `frontmatter-uses-deprecated-type` | 🔴 HIGH | 新手照 README 例子寫文章 → 觸發 validate warning；reverse 操作成本 | 改 example 為 `contentKind: "tech-note"`；補 cross-link `docs/migration-from-frontmatter.md` |
| **D12** | line 81 | `site: "github"  # 目前 build 流程只讀 site=github` | ❌ 不正確；`build:blogger` 讀 `content/blogger/posts/`；`build:github` 讀 `content/github/posts/`；兩 site 各自 build pipeline | 🔴 HIGH | 誤導讀者以為 blogger/posts/ 不被 build | 改「`build:github` 讀 github 站；`build:blogger` 讀 blogger 站」|
| **D13** | line 85 | example 缺欄位 | 缺：`publishTargets` / `blocks` / `book`（mediaType / authors / publisher / isbn / coverImage 等）/ `relatedLinks` / `otherLinks` / `series` / `affiliate` / `download` / `promotion` / `seo.indexing`（Phase 20260520-seo-2）/ `searchDescription` 等 production 文章常用欄位 | 🔴 HIGH | 新手只看 README 不知有這些欄位；schema 完整度錯失 | example 加上常見欄位；cross-link 至 `content-schema.md` / `publish-bundle.md` / `book-schema.md` / `series-schema.md` / `related-links-schema.md` |

### §C.7 發布狀態與 draft 過濾（line 92-100）

✅ **無 drift**；`load-posts.js` 過濾規則仍對齊（draft / status: draft / archived / 缺值 → 排除；ready / published → 列入 + 產 HTML；filteredOut[] 機制仍存在於 `.cache/data/posts.json`）。詳 phase-1-usability-review §5 row 12「驗證文章 metadata」對齊。

### §C.8 Phase 1 已完成項目（line 102-116）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D14** | line 104-116 整節 | 僅列 Phase 1-A（A-1 / A-2）+ Phase 1-B（B-1/B-2/B-3）+ Phase 1-C（C-1/C-2/C-3）共 8 個早期子階段 | ❌ Phase 1 範圍延伸至 Phase 9-z-d final；含 Phase 2 DS / Phase 3 Blogger 匯出 / Phase 4 FB / Phase 5 SEO+GA4+sitemap / Phase 6 RWD+JS / Phase 7 checklist / Phase 8 sidecars（schemas）/ Phase 9 book/series/relatedLinks/SEO/JSON-LD（全部已 land）| 🔴 HIGH | 整節嚴重低估完成度；新讀者完全不知有 Phase 2-9 work；docs/phase-1-completion-checklist.md 13 主節 525 行之內容毫無體現 | 整節 rewrite：補列 Phase 2-9 各主軸（DS / Blogger / FB / GA4 / sidecars / book schema / related links / JSON-LD），或 strikethrough 整節改 cross-link `docs/phase-1-completion-report.md` |

### §C.9 目前限制（line 118-126）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D15** | line 120 | 「Markdown body 起首 `# 標題` 與 article header `<h1>` 重複：1-B-2 已知限制，留 Phase 2 統一處理」 | ⚠️ 已透過 `parse-markdown.js` H1 → H2 自動降級 + Phase 8-g-5 sample post body 端對齊（移除起首 `# 標題`）+ Phase 8-g-6 templates 對齊；validate 含 `body-leading-h1` warning | 🟡 MEDIUM | 痛點已大幅緩解；README 仍稱「Phase 2 才處理」過時 | 改「自動 H1→H2 + validate warn 提醒；作者撰文無需起首 `# 標題`」|
| **D16** | line 121 | 「無 SCSS 精緻樣式：Phase 0 SCSS partial 為最小可顯示，Phase 2 才精緻化」 | ❌ Phase 2 系列已完成；tokens / themes / spacing / typography / breakpoints / mixins / z-index 完整；BEM + `lab-` prefix 一致；DS-3 hardcoded color resolved（10 fixes + 2 documented exemptions）；component SCSS 16+ files | 🔴 HIGH | 直接矛盾實際 | 改「SCSS DS 已完成（per `design-token-audit-20260523.md`）」|
| **D17** | line 122 | 「Header 無 sticky 行為、無 Mobile Drawer、無 Back to Top 互動：JS 模組存在但 HTML 未掛 data attribute → Phase 6」 | ❌ Phase 6 全部 landed；`back-to-top.js` / `sticky-header.js` / `mobile-drawer.js` data attr 皆已掛（per phase-status §3.2 表）；production live | 🔴 HIGH | 同上；讀者以為功能尚未上線 | 改「Sticky Header / Mobile Drawer / Back to Top 全部 live」|
| **—** | line 123 | 「`vite.config.js` 採 `appType: 'mpa'`：dev 階段不存在路徑回 Vite 預設 404，不自動載入 `/404.html`；GitHub Pages 部署後才會自動 fallback」 | ✅ 完全對齊（`vite.config.js` line 30 `appType: 'mpa'` 確認）| — | — | 保留 |
| **D18** | line 124 | 「無連結處理器：外部連結未自動加 `nofollow`、聯盟連結未加 `sponsored`、Blogger↔GitHub 互導未加 UTM → Phase 5」 | ❌ Phase 5 連結處理器已 live；`src/scripts/link-processor.js` + `src/scripts/ga4-url-builder.js` 既存；外部連結自動 `target="_blank" rel="nofollow noopener noreferrer"`；聯盟連結自動 `sponsored`；GitHub→Blogger forward UTM live；Blogger→GitHub reverse UTM source landed but dormant（per `CLAUDE.md` §16.4）| 🔴 HIGH | 直接矛盾實際；3 個子項全錯 | 改「連結處理器 live（per `link-rules.md` + `CLAUDE.md` §16）；Blogger→GitHub reverse UTM source landed dormant」|
| **D19** | line 125 | 「**目前不是 git repo**：尚未 `git init`。日後若初始化 git，`.gitignore` 已涵蓋…」 | ❌❌ **重大 drift**：是 git repo；HEAD = `30cdadf`；origin/main 已 push（remotes/origin/main 與 origin/gh-pages 皆存在）；commits 累積 130+ 筆；gh-pages branch deploy 中（`960f234` 為最近 deploy snapshot）| 🔴 HIGH（最嚴重）| 此 drift 反向程度最強；任何讀者 / 新 session 看此會以為應該 `git init`；嚴重誤導 | 整行刪除；改「source repo 採 `main`；deploy repo 採 `gh-pages` branch（per `20260524-blogger-github-publishing-runbook.md`）」|
| **D20** | line 126 | 「GitHub Pages 部署：尚未配置 deploy workflow、未綁自訂網域 → Phase 5+」 | ⚠️ 部分正確：deploy 為手動（cp dist + git rm + commit + push gh-pages；無 CI）但 production live since 5/21 pm-46；最近 deploy `960f234` 5/24 am-7b；custom domain 仍未綁 | 🟡 MEDIUM | 第一段「未配置 deploy workflow」字面誤導為「未 deploy」；實際是有 deploy SOP 只是手動 | 改「deploy 採手動 SOP（per `github-deploy.md` / runbook §3-§4）；production live since 2026-05-21；custom domain 未綁」|

### §C.10 Phase 2 及後續待辦（line 128-136）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **D21** | line 130 | 「**Phase 2** Design System 子頁與 SCSS 精緻化」 | ❌ done（per D8 / D16）| 🔴 HIGH | 列為「待辦」誤導 | 移出待辦；標 ✅ done 並 cross-link |
| **D22** | line 131 | 「**Phase 3** Blogger 匯出：full / summary / redirect-card、copy-helper、publish-checklist、Blogger 主題 CSS」 | ❌ done（per D2 / D3 / D6 / D9）| 🔴 HIGH | 同 | 移出；標 ✅ done |
| **D23** | line 132 | 「**Phase 4** FB Promotion 匯出」 | ❌ done（per D4）；含 `.fb.md` schema + Admin detail panel FB 欄位 + `backfill:url` helper | 🔴 HIGH | 同 | 移出；標 ✅ done |
| **D24** | line 133 | 「**Phase 5** SEO / GA4 / AdSense / sitemap / robots / 連結處理器」 | ⚠️ mixed：SEO + GA4（live since 5/21）+ sitemap + robots + 連結處理器**全 done**；**AdSense dormant**（blocked on custom domain 審核）| 🟡 MEDIUM | 不完全錯但 mixed | 拆兩列：「Phase 5 done except AdSense」+「AdSense → Phase 2+ blocked on custom domain」|
| **D25** | line 134 | 「**Phase 6** RWD / Sticky Header / Mobile Drawer / Back to Top JS / 圖片 lazy」 | ❌ done（per D17）；`lazy-image.js` 亦 landed | 🔴 HIGH | 同 D21 | 移出；標 ✅ done |
| **D26** | line 135 | 「**Phase 7** 發布 checklist / 備份策略 / build report」 | ⚠️ mixed：publish-checklist.txt + `docs/checklists/` 7 個 checklist + `report:*` × 6 scripts + `docs/backup-and-migration.md`**已 done**；備份實際執行為 user-side（per `CLAUDE.md` §25）| 🟡 MEDIUM | 不完全錯 | 改「Phase 7 工具 / 文件 done；備份執行為 user-side」|
| **—** | line 136 | 「**Phase 8（暫緩）** View 數、Like、留言、會員、後端、Blogger API、Drive API」 | ✅ 對齊 CLAUDE.md §29 第一版不做清單 | — | — | 保留 |

### §C.11 修改本專案（line 138-end）

| drift id | README 位置 | 原文件寫法 | 目前實際狀態 | 風險 | 影響 | 建議處理 |
|---|---|---|---|---|---|---|
| **—** | line 140 | 「§27 流程：1. 列出修改目標… 2. 取得確認後動工 3. 完成後回報」 | ✅ 對齊 CLAUDE.md §27 | — | — | 保留 |
| **D27** | line 146 | 「`docs/` 內含 Phase 0 規劃文件，可作為 Phase 2-7 細節參考」 | docs/ 現有 **100+** files（含 Phase 0~9-z-d 所有完成報告 + schemas + EOD reports + handoff baselines + audits）；不只 Phase 0 規劃 | 🟡 LOW | 數字 / 範圍嚴重低估；新讀者不知 docs 規模 | 改「docs/ 含 100+ 文件；cold-start 入口見 `20260524-eod-report.md` §15 trail map」|

---

## §D. Drift 總計

| 嚴重度 | 數量 | drift IDs |
|---|---|---|
| 🔴 HIGH | **19** | D2, D3, D4, D5, D6, D8, D9, D11, D12, D13, D14, D16, D17, D18, D19, D21, D22, D23, D25 |
| 🟡 MEDIUM | **5** | D7, D15, D20, D24, D26 |
| 🟡 LOW | **2** | D10, D27 |
| 🔵 INFO | **1** | D1 |
| **總計** | **27** | — |

→ 對照 5/25 am-5 `docs/20260525-phase1-user-guide-drift-check.md`（8 drift；其中 4 HIGH）→ **README drift 是 user-guide 的 3.4 倍**；HIGH drift 是 4.75 倍。README **嚴重 stale**，可能是整個 portable-blog-system 最 outdated 的單一檔案。

### 主因

README 寫於 **Phase 1 早期收尾**（`README.md` line 4「Phase 1 收尾版本」措辭 + line 102-116 僅列 1-A/1-B/1-C 子階段）→ 自此後 Phase 1 範圍透過 Phase 2~9-z-d 連續擴展（DS / Blogger 匯出 / FB / GA4 / sidecars / book schema / related links / JSON-LD / SEO indexing 等共 100+ commits）；README **從未隨之同步**。最嚴重之 D19「目前不是 git repo」即 README 寫成於本機 pre-git-init 階段之化石。

---

## §E. 未漂移段落清單

以下 README 段落經本 audit 比對後**確認仍對齊當前狀態**，不需修改：

| # | 段落 | 確認結果 | 比對依據 |
|---|---|---|---|
| 1 | §3「第一次使用」line 13-21 | ✅ `npm install` + `npm run dev`（含 predev 自動 build:data）+ port 5173 + 瀏覽器自動開（`server.open: true`）| `vite.config.js` line 37 + `package.json` line 7-8 |
| 2 | §4 npm 表「dev / predev / build / prebuild / postbuild / preview / build:data / build:github / validate:content」9 列描述 | ✅ 對齊 | `package.json` |
| 3 | §5「可用頁面與 URL」表中除 design-system 外其餘 row（/ / posts / post-detail / categories / tags / 404 / draft / 不存在路徑）| ✅ 對齊 | `dist/` 實際 23 HTML files |
| 4 | §6「內容資料夾」tree 結構（除 D9 / D10 兩處外）| ✅ 對齊 | `content/` 實際結構 |
| 5 | §7 Frontmatter 章節中之**通則性描述**（id 必填 / slug 必填 / category 必須存在於 settings / tags 必須存在於 settings 等規則）| ✅ 對齊 | `validate-content.js` 規則 |
| 6 | §8「發布狀態與 draft 過濾」整節 | ✅ 完全對齊 | `load-posts.js` 過濾規則 + `.cache/data/posts.json` filteredOut[] 機制 |
| 7 | §9 line 123「vite.config.js 採 `appType: 'mpa'` + dev 階段不自動 fallback /404.html」 | ✅ 完全對齊 | `vite.config.js` line 30 |
| 8 | §10 line 136「Phase 8（暫緩）View / Like / 留言 / 會員 / 後端 / Blogger API / Drive API」 | ✅ 對齊 CLAUDE.md §29 | CLAUDE.md §29 |
| 9 | §11「修改本專案」line 138-145 | ✅ 對齊 CLAUDE.md §27 | CLAUDE.md §27 |

---

## §F. 是否建議 rewrite README

### F.1 結論

🟢 **建議**。對應 user 7-output 之 option **A — 可以直接開下一批 README rewrite docs-only phase**。

### F.2 推薦原因

1. **嚴重度極高**：19 HIGH drifts；包含 D19「目前不是 git repo」這種反向程度滿格的化石訊息
2. **mirror 已驗證模式**：5/25 am-5 user-guide drift check → am-6 後續 rewrite 拆批模式已示範；本次「audit landed → rewrite phase」順序可直接複用
3. **單檔修改**：只動 `README.md`；docs-only；不 build / 不 deploy / 不操作 Blogger / 不操作 GA4
4. **可控時間**：~45-60 min（單檔 ~146 行；27 drift；可一次 rewrite 或拆 HIGH / MEDIUM / LOW 三 commit）
5. **戰略價值高**：README 是新 session / 新人 / 未來 Claude 首讀文件；當前狀態誤導性 > usability review / drift check 等內部 docs
6. **無 user 表態依賴**：drift 全屬「事實漂移」非「策略選擇」；無需 user 決定保留方式（不像 user-guide D1/D6 之 preflight 內容處理需 user 決定）

### F.3 不推薦之替代

- **option B（只先記錄 drift，不急著改）**：本 audit doc 落地後雖然資訊已 captured，但 D19 等化石訊息留在 README 對 cold-start session 之誤導成本仍存在
- **option C（等 Phase 1 再多跑一次後再改）**：Phase 1 已 final（9-z-d；commit `4d68f50`）；無「再多跑一次」之觸發；繼續等只會讓 drift 累積更深

---

## §G. 下一階段 README rewrite phase proposal

| 項目 | 值 |
|---|---|
| **phase name** | `20260525-night-14-readme-rewrite-docs-only-a`（或 `20260526-am-x-readme-rewrite-docs-only-a` 若延後） |
| **scope** | 依本 audit D1-D27 改 `README.md`；docs-only；mirror 5/25 am-5 → am-6 user-guide audit → rewrite 已驗證之拆批模式 |
| **expected files to change** | `README.md` 單檔（共 ~146 行 → 預估 rewrite 後 180-220 行）|
| **不會改之檔** | ❌ `CLAUDE.md` / `package.json` / `vite.config.js` / `docs/*` / `src/*` / `content/*` / `dist/*` |
| **boundaries** | 僅修 README §1-§12 對應 drift；不增新規格 / 不改 source / 不改 schema / 不改 settings；不 build / 不 deploy / 不 commit content / 不操作 Blogger / 不操作 GA4 |
| **validation commands** | • `git diff README.md` cross-check 本 audit D1-D27 全部處理<br>• `git status --short --branch` → 應僅 `M README.md`<br>• 不需跑 `npm run validate:content`（README 不影響 validate baseline）<br>• 不需跑 `npm run build*`（README 不影響 dist） |
| **commit?** | ✅ 是；docs commit message 範例：「docs(readme): sync drift D1-D27 from 20260525-readme-drift-audit」 |
| **push?** | ✅ 建議 push origin/main（per am-3 / am-5 / am-11 既有 push pattern；docs-only 安全）|
| **build?** | ❌ 否 |
| **user 手動操作 Blogger / GA4?** | ❌ 否 |
| **何時可進 pm-26 deploy gate?** | n/a；README rewrite 與 reverse UTM pm-26 無關；reverse UTM 維持 dormant（user 已選 C）|

### G.1 拆批建議

| 拆法 | 內容 | 推薦 |
|---|---|---|
| **單 commit** | 一次處理 D1-D27 | 🟢 推薦（單檔；變動範圍清晰；user-guide rewrite 亦預期單 commit）|
| **3-commit by severity** | HIGH（19）/ MEDIUM（5）/ LOW+INFO（3）| 🟡 可選；若 user 想 staged review |
| **section-by-section** | 11 commits（§B.1-§B.10）| 🔴 過度拆 |

### G.2 paste-ready 指令草稿（下一階段 rewrite phase）

```text
請執行 20260525-night-14-readme-rewrite-docs-only-a。

目標：
依 docs/20260525-readme-drift-audit.md 之 D1-D27 對 README.md 做單檔 rewrite；
docs-only；mirror 5/25 am-5 → am-6 user-guide audit → rewrite 之拆批模式。

背景：
- 本 audit 已 commit（hash 待填）
- HEAD = origin/main 已包含 readme-drift-audit
- working tree clean
- reverse UTM 維持 dormant（user 已選 C）

Hard constraints：
- 僅修改 README.md 單檔
- 不修改任何其他檔案（CLAUDE.md / package.json / vite.config.js / docs/* / src/* / content/* / dist/* 一律不動）
- 不 npm run build / 不 npm run deploy / 不切換 branch / 不碰 gh-pages
- 不操作 Blogger / 不操作 GA4
- 不建立 fixture
- 不啟動任何 deferred items（FB-P5-c / Admin-2-b-2 / hashtag a / reverse UTM deploy verify）

處理範圍（per drift audit §D）：
- HIGH drifts（19）：D2 / D3 / D4 / D5 / D6 / D8 / D9 / D11 / D12 / D13 /
  D14 / D16 / D17 / D18 / D19 / D21 / D22 / D23 / D25
- MEDIUM drifts（5）：D7 / D15 / D20 / D24 / D26
- LOW drifts（2）：D10 / D27
- INFO drifts（1）：D1
- 未漂移段落（per drift audit §E）：保留不動

驗證：
- git diff README.md cross-check 本 audit D1-D27 全部處理
- git status --short --branch → 應僅 `M README.md`
- 不需跑 npm run validate:content（README 不影響 validate baseline）
- 不需跑 npm run build*（README 不影響 dist）

請回報：
1. Baseline 確認
2. 本批變動範圍摘要（drift 處理對照）
3. git diff 之摘要（不需貼完整 diff；列每段變動之 from → to）
4. 是否 commit 與 commit message 草稿
5. 是否 push origin/main
6. 完成後停下

commit message 草稿：
  docs(readme): sync drift D1-D27 from 20260525-readme-drift-audit

完成後停下，不要碰其他檔案，不要 build / deploy / 操作 Blogger / GA4。
```

---

## §H. Boundaries / Non-goals

### H.1 本 phase（night-13 docs commit）邊界

| 項目 | 狀態 |
|---|---|
| 新增 `docs/20260525-readme-drift-audit.md`（本檔）| ✅ 唯一允許之檔案變動 |
| 修改 `README.md`（本 audit 對象）| ❌ 無 |
| 修改 `CLAUDE.md` / `package.json` / `vite.config.js` | ❌ 無 |
| 修改 `docs/` 其他既有檔案 | ❌ 無 |
| 修改 `src/` / `content/` / `templates/` / `settings/` / build scripts | ❌ 無 |
| 修改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` | ❌ 無 |
| 修改 deploy repo | ❌ 無 |
| 執行 `npm install` | ❌ 無 |
| 執行 `npm run build*` / `npm run dev` / `npm run validate*` | ❌ 無 |
| 執行 `npm run report:*` / `npm run check:*` / `npm run smoke:*` | ❌ 無 |
| 執行 git commit | ✅ 1 次（單檔 `docs/20260525-readme-drift-audit.md`；commit message: `docs(readme): add drift audit D1-D27`）|
| 執行 git push | ❌ 否（本批不 push；待 user 確認後另行決定）|
| 切換 branch / 碰 gh-pages | ❌ 無 |
| 觸碰 Blogger 後台 / GA4 後台 / FB 後台 | ❌ 無 |
| 建立 reverse UTM fixture | ❌ 無（per user 5/25 night-10 C 路線決議）|
| 啟動 README rewrite phase | ❌ 無（屬下一階段 night-14；本批不自動進入）|

### H.2 Non-goals

- ❌ 本 phase **不**改 README 本身（即 D1-D27 全部處理留待 night-14 rewrite phase）
- ❌ 本 phase **不**啟動 reverse UTM pm-26（user 已選 C）
- ❌ 本 phase **不**處理其他 Phase 1 backlog 項目（per `20260525-phase1-usability-review.md` §5.2-§5.4）
- ❌ 本 phase **不**自動進入 night-14；user 需明確指令啟動下一階段

本文件落地後**不**改變任何 production state；屬純 audit 紀錄 + rewrite phase 前置 reference 工具。

---

## §I. Final Recommendation

### I.1 推薦下一步

🟢 **A1 + A2 兩步**：

1. **A1（本 phase；night-13）**：commit 本 audit doc `docs/20260525-readme-drift-audit.md`（單檔；docs-only）→ working tree 恢復 clean；audit traceability 落地
2. **A2（下一階段；night-14 或延 5/26 am-x）**：另開 `20260525-night-14-readme-rewrite-docs-only-a` phase 對 `README.md` 做單檔 rewrite；按本 audit D1-D27 處理；單 commit；push origin/main

對齊 5/25 am-5 → am-6 user-guide audit → rewrite 之兩階段拆批 pattern。

### I.2 替代方案

| 替代 | 名稱 | 適用情境 |
|---|---|---|
| **Alt-1** | 只 commit audit（A1）；rewrite 延至 5/26 上午 | 若今晚已疲勞；audit 落地後也達本批目標 |
| **Alt-2** | audit + rewrite 同一 night session 連續做（A1 + A2 連跑；拆 2 commit）| 若體力 OK；mirror am-3 / am-5 一日多 docs commit pattern |
| **Alt-3** | 收工 freeze（不 commit；明日決定）| 若想保留 working tree 之 audit doc 為 untracked 過夜 review |

### I.3 不推薦

| 不推薦 | 理由 |
|---|---|
| **直接改 README 而不先 commit audit** | 失去 audit traceability；mirror am-5 拆批原則：先 audit doc → 後 rewrite |
| **改 README 同時改 CLAUDE.md / package.json / 其他** | 跨檔；超出單檔 rewrite scope；增加 review 成本 |
| **跳過 README 改其他 Phase 1 backlog** | README 是 19 HIGH drift 之最高優先；先處理 |
| **任何 build / deploy / Blogger 重貼 / GA4 操作** | 違反 hard constraints；與 reverse UTM C 路線決議衝突 |

---

## §J. Cross-links

### J.1 規範來源

- `CLAUDE.md` §1 / §27 / §28 / §29 / §30
- `README.md`（本 audit 對象；待 night-14 rewrite）

### J.2 Phase 1 收尾基準

- `docs/phase-1-completion-report.md`（Phase 9-z-d 正式 final report）
- `docs/phase-1-completion-checklist.md`（Phase 9-z-b 逐項對照清單）
- `docs/phase-status-20260523.md`（5/23 Phase 1 完成度盤點）

### J.3 5/25 docs trail

- `docs/20260525-pc-handoff-baseline.md`（am；PC handoff baseline）
- `docs/20260525-phase1-usability-review.md`（am-3；7 維度 + 13 流程盤點）
- `docs/20260525-phase1-user-guide-drift-check.md`（am-5；user guide 8-drift audit；本 audit mirror 其結構）
- `docs/20260525-affiliate-first-activation-readiness.md`（am-11；affiliate readiness）
- `docs/20260525-reverse-utm-l1-smoke-completion-report.md`（night-4）
- `docs/20260525-reverse-utm-pm25-predeploy-verify-report.md`（night-5）
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（night-6）
- `docs/20260525-deploy-diff-dry-run-readonly-report.md`（night-8）
- 本檔（night-13；待 commit）

### J.4 比對依據

- `package.json`（21 npm scripts）
- `vite.config.js`（appType: 'mpa'）
- `dist/` 23 HTML / `dist-blogger/` 3 posts + index / `dist-promotion/` / `src/views/` 50+ EJS / `content/settings/` 16+ JSON

---

（本文件結束）
