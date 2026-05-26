# docs/ 文件入口

本目錄為 BLOG 系統第一階段（**Phase 1 MVP**）之開發 / 規格 / 操作文件總集。屬導覽性質；只指向既有 docs，不複製內容（避免 drift）。

對應上層：
- `CLAUDE.md`（**根目錄**；專案規範主檔；給 Claude Code 用之開發規範）
- `README.md`（**根目錄**；專案主說明）
- `docs/system-direction.md`（系統整體方向）

---

## §1 BLOG 系統目前定位

「可搬家的本機資料夾型內容管理系統」（per `CLAUDE.md` §1）：

- 文章資料以 Markdown + frontmatter 管理（不綁死 Blogger）
- 分類 / 標籤 / 站台設定 / 廣告 / 社群以 JSON 設定檔管理
- VS Code 為主要內容管理環境
- Vite + EJS + SCSS 為靜態站與匯出工具
- 雙平台輸出：GitHub Pages（本機可預覽 + build）+ Blogger（手動貼用 HTML）
- 第一版**避免過度工程化**；無真正後台 / 留言 / View 數 / 會員 / 資料庫

---

## §2 第一階段已完成能力

| 能力 | 狀態 | 主要文件 |
|---|---|---|
| Vite + EJS 靜態站本機預覽 (`npm run dev`) | ✅ | `docs/architecture.md` / `docs/github-deploy.md` |
| Markdown + frontmatter 文章 | ✅ | `docs/content-schema.md` / `docs/publish-bundle.md` |
| 分類 / 標籤 / 文章 / Design System 頁 | ✅ | `docs/design-system.md` / `docs/css-design-system-policy.md` |
| Blogger 匯出（full / summary / redirect-card）| ✅ | `docs/blogger-export.md` |
| Blogger Design Token CSS 匯出 | ✅ | `docs/blogger-export.md` |
| FB Promotion 文案匯出（手動發布）| ✅ | `docs/promotion-export.md` / `docs/fb-sidecar-schema.md` |
| SEO meta tags / sitemap / robots / canonical / OG / JSON-LD | ✅ | `docs/seo-ga4-adsense.md` / `docs/seo-indexing-rules.md` |
| SEO indexing 控制（`contentKind=download` / `seo.indexing`）| ✅ | `docs/seo-indexing-rules.md`（7 batches；SEO-2-z checkpoint） |
| GA4 機制（雙條件 gating；待 user 啟用）| ✅ 機制；⏳ user 填 measurementId | `docs/seo-ga4-adsense.md` §5 / `docs/ga4-enable-preflight.md` |
| AdSense placeholder 區塊 | ✅ | `docs/seo-ga4-adsense.md` §6 |
| Sticky Header / Mobile Drawer / Back to Top / RWD | ✅ | `docs/rwd-interaction.md` |
| Link Processor（外連 nofollow / sponsored / cross-link UTM）| ✅ | `docs/link-rules.md` / `docs/related-links-schema.md` |
| Admin overview（**read-only**；dev-mode-only） | ✅ | `docs/admin-1-completion-report.md` |
| Admin SEO 4 欄位 dry-run viewer | ✅ | `docs/admin-2b1-completion-report.md` |
| Admin FB sidecar read-only display + dry-run editor | ✅ | `docs/fb-sidecar-metadata-pre-analysis.md` / `docs/fb-sidecar-write-preflight-decision.md` |
| FB sidecar **真實寫入** | ⏳ 待 user 勾選 preflight checklist | `docs/fb-sidecar-write-safety.md` / `docs/fb-sidecar-write-preflight-decision.md` §7 |
| sitemap 多平台拆分 | ⏳ 未啟動（不建議當前實作）| `docs/seo-sitemap-split-pre-analysis.md` |
| Blogger 平台 indexing guidance（copy-helper [14] / publish-checklist row） | ✅ | `docs/seo-indexing-rules.md` |

詳完整 17 項 MVP 必做清單見 `CLAUDE.md` §28 與 `docs/phase-1-completion-checklist.md`。

---

## §3 重要文件索引

### 3.1 規範 / 方向

- `CLAUDE.md`（**根目錄**）— 專案規範主檔
- `docs/system-direction.md` — BLOG 系統整體方向
- `docs/architecture.md` — 系統架構
- `docs/requirements.md` — 需求
- `docs/future-roadmap.md` — 未來 roadmap

### 3.2 Schema（資料結構）

- `docs/content-schema.md` — frontmatter 欄位字典
- `docs/publish-bundle.md` — sidecar 三檔結構（.md + .publish.json + .fb.md）
- `docs/publish-json-schema.md` — `.publish.json` schema
- `docs/fb-sidecar-schema.md` — `.fb.md` schema
- `docs/book-schema.md` — book metadata
- `docs/related-links-schema.md` — relatedLinks / otherLinks
- `docs/series-schema.md` — 系列文章
- `docs/migration-from-frontmatter.md` — 舊 frontmatter 遷移

### 3.3 發布工作流

- `docs/blogger-export.md` — Blogger 匯出系統
- `docs/github-deploy.md` — GitHub Pages 部署
- `docs/promotion-export.md` — FB 推廣文案匯出
- `docs/publish-workflow.md` — 整體發布流程
- `docs/backup-and-migration.md` — 備份與搬家
- `docs/20260524-blogger-github-publishing-runbook.md` — **Operator-facing runbook**（commit `0b62a13`；2026-05-24 am-10a/b 落地）；整合 Blogger 手動重貼 + GitHub 文章頁檢查 + GA4 / UTM / reverse UTM 驗收 + affiliate 上下區塊 + related / other / hashtag click tracking 之單一 entry 操作 SOP；canonical 詳本仍為 `docs/20260524-blogger-repost-checklist.md`（am-8b）+ `docs/20260524-ga4-reverse-utm-observation.md`（am-8c）+ `docs/reverse-utm-fixture-plan.md` §10（am-9c）；**5/24 SOP / runbook trail map 與建議 cold-start 讀取順序詳見** `docs/20260524-eod-report.md` §15（pm-11b 落地）

### 3.4 SEO / GA4 / AdSense

- `docs/seo-ga4-adsense.md` — SEO meta + sitemap + GA4 + AdSense 完整實作報告
- `docs/seo-indexing-rules.md` — indexing policy（含 SEO-0 ~ SEO-2-z 7 batches checkpoint）
- `docs/seo-sitemap-split-pre-analysis.md` — SEO-4 多平台 sitemap 拆分 pre-analysis（結論：當前不建議實作）
- `docs/ga4-enable-preflight.md` — GA4 measurementId 接入 preflight + user checklist
- `docs/hashtag-slug-decision.md` — hashtag slug 派生策略（tags.json lookup 推薦；GA4 click_hashtag + span→a 前置 spec）
- `docs/blogger-listener-strategy.md` — Blogger 端 GA4 click tracking 策略（短期 reverse UTM；listener deferred）
- `docs/blogger-to-github-reverse-utm-plan.md` — Blogger → GitHub 反向 UTM 注入計畫（mirror 既有 github_pages→blogger；listener-free 跨站 attribution）
- `docs/reverse-utm-fixture-plan.md` — Blogger → GitHub reverse UTM 驗收 fixture 建立 SOP（pm-26b 啟動條件 / fixture 設計原則 / 驗收 invariant / 驗收後處理）

### 3.5 Design System

- `docs/design-system.md` — Design System 規格
- `docs/css-design-system-policy.md` — 共用 CSS 政策
- `docs/design-system-ds1-audit.md` — DS-1 現況盤點
- `docs/design-system-ds2-token-naming.md` — DS-2 token naming
- `docs/design-system-ds3b-theme-overrides-proposal.md` — DS-3-b platform theme
- `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` — DS-3-c hex 違規修正計畫

### 3.6 Admin（read-only / dry-run）

- `docs/admin-mvp-pre-analysis.md` — Admin MVP 完整規劃
- `docs/admin-local-boundary-pre-analysis.md` — Admin 邊界政策
- `docs/admin-1-readonly-preflight.md` — Admin-1 plan B 選定
- `docs/admin-1-completion-report.md` — Admin-1 read-only 系列收尾
- `docs/admin-2-write-pre-analysis.md` — Admin-2 write surface + 安全策略
- `docs/admin-2b1-completion-report.md` — Admin-2-b-1 dry-run viewer

### 3.7 FB sidecar / FB post

- `docs/fb-sidecar-schema.md` — `.fb.md` schema
- `docs/fb-post-url-metadata-proposal.md` — FB post URL metadata proposal
- `docs/fb-sidecar-metadata-pre-analysis.md` — FB-P4 pre-analysis
- `docs/fb-sidecar-write-safety.md` — FB-P5-d write safety plan
- `docs/fb-sidecar-write-preflight-decision.md` — FB-P5-c preflight decision + user checklist

### 3.8 RWD / 互動 / 連結處理

- `docs/rwd-interaction.md` — RWD 與互動
- `docs/link-rules.md` — 連結處理規則

### 3.9 各 Phase 完成報告（git history）

- `docs/phase-1-completion-checklist.md` / `docs/phase-1-completion-report.md`
- Phase 8 系列：`phase-8b/8c/8d/8e/8f/8g/8h-completion-report.md` + 多 pre-analysis
- Phase 9 系列：`phase-9e/9f-c/9f-g/9g/9g-g/9h/9j-completion-report.md`
- Phase 10：`phase-10-a-b-sitemap-robots-baseline.md` / `phase-10-completion-report.md`

### 3.10 Helper / design notes

- `docs/sidecar-io-helper-design.md`
- `docs/placeholder-resolver-design.md`
- `docs/phase-8d-field-mapping-design.md`

---

## §4 常用驗證指令

```bash
# 內容驗證（baseline 目前 0/38/33）
npm run validate:content

# GitHub Pages 本機預覽
npm run dev

# GitHub Pages prod build（含 sitemap + robots）
npm run build

# Blogger 主題 CSS 匯出
npm run build:blogger-theme

# Blogger 文章匯出（含 copy-helper / publish-checklist / meta.json）
npm run build:blogger

# FB promotion 文案匯出
npm run build:promotion

# sitemap 單獨重產（npm run build 已含）
npm run build:sitemap

# 其他 report scripts
npm run report:build
npm run report:drafts
npm run report:urls
npm run report:series
npm run report:book
npm run check:links
npm run check:images
```

---

## §5 目前不可做 / 需小心的操作

| 操作 | 為何不可做 |
|---|---|
| **Admin 真實 write `.fb.md` / `.md` / `.publish.json`** | 仍 read-only / dry-run；FB write 須先過 `docs/fb-sidecar-write-preflight-decision.md` §7 之 8 項 user 勾選 |
| **改 `ga4.config.json` 為 `enabled: true` + 真實 measurementId** | 屬上線追蹤；參考 `docs/ga4-enable-preflight.md` §3.1 之 8 項必勾 checklist |
| **動 deploy repo 之檔案 / push** | 本機 source repo 完全不碰 deploy repo；deploy 屬獨立 pipeline |
| **`git push --force` 至 main** | 永禁；歷史線性堆疊不可破壞 |
| **`git rebase` / `git amend`** | 永禁；對齊既有「線性堆疊；無 amend / rebase / force」原則 |
| **Blogger 後台已貼 CSS 之 ad-hoc 改動** | 屬手動發布；本系統提供 `build:blogger-theme` 重產之 standard CSS；user 自決重貼時機 |
| **接 FB Graph API / 自動社群發文 / Blogger API** | per `CLAUDE.md` §29 第一版不做清單；屬 Z 類第二階段暫緩 |
| **大量 content migration / batch rename slug** | 屬高風險；應另開 phase 拆批 |
| **整合 `_blogger-components-rules.scss` mirror partial** | per `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` 標 🔴 高風險；屬 DS-3-e 待評估 |

---

## §6 下一階段候選工作

詳見 `docs/phase-2-candidate-roadmap.md`。

摘要：
- 🟢 安全小修：~~DS-3-c-a hex 違規~~（✅ commit `f530a39`）/ ~~DS-3-c-b hex 違規~~（✅ GitHub source commit `67a0ccc` + mirror partial sync commit `cc2621d`）/ FB completeness 微調 / GA4 prod-only gating
- 🟡 需 user 決策：GA4 啟用 measurementId / FB-P5-c write / Admin-2-b-2 SEO write / DS-3-b platform theme tokens
- 🔴 中-高風險：sitemap 拆分 / mirror partial 整合 / Blogger entry themes 整合 / FB Graph API
- ❌ 永不：第一版不接 FB API / 不自動社群發文 / 不接 Blogger API / 不引入 React/Vue/Tailwind / 不引入後端資料庫

---

## §7 最近一次穩定 checkpoint

（更新時點：2026-05-26；pm-17 docs-only checkpoint refresh；本 phase 為 docs-only baseline sync — 未跑 build / validate / deploy / Blogger repost / GA4 validation。下方「5/21 重點摘要 / 解除 deferred items / 新增 docs」起之區塊為**歷史紀錄保留**；非當前快照；請以本節 7.1 為當前狀態）

### 7.1 當前 checkpoint（2026-05-26）

- source HEAD: `d6b6719 docs(operations): record template body scaffold cleanup`（5/26 多 phase 線性堆疊：`863d7e8` reverse-utm fixture scan → `e34b002` roadmap align → `d4fd450` / `1c2a346` / `007875d` template refactor 三連 → `e295af7` phase-1 guide note → `7f18266` PROJECT_TREE refresh → `6f20cf8` README §7 baseline refresh → `3191bea` template body scaffold cleanup（blogger book / magazine / download 三檔）→ `726bb3b` sibling template body scaffold cleanup（post / github-tech-note / blogger-summary 三檔）→ `e6ecd83` README §7 baseline refresh → `d6b6719` phase-1 guide template scaffold record；皆 docs-only / template-only / listing-only；無 source code / build / deploy 變動）
- branch: `main` / tracking `origin/main` / 與 remote 同步
- working tree: clean
- deploy repo HEAD：**本 phase 未 deploy**；最近一次已知 deploy 為 `960f234`（2026-05-24；`deploy: update ga4 link_type and hashtag wrap`；per `docs/phase-1-user-operation-guide.md` §2 / §7）；實際 deploy repo HEAD 仍以本機 deploy repo 檢查為準
- validate baseline：**本 phase 未重跑**；最近一次已知 baseline 為 `0 error / 39 warning / 34 post(s)`（per `docs/phase-1-user-operation-guide.md` §6.1，2026-05-25；baseline 隨 fixture / ready post 自然漂移）
- GA4 status：✅ production live（measurementId `G-C77SMPF8VD`；2026-05-21 起）；**本 phase 未做 GA4 validation**
- 🟡 Reverse UTM Blogger → GitHub：**source landed but dormant**（pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe`；2026-05-23 push origin/main；尚未 deploy；Blogger 後台尚未重貼；live but dormant）
- 🔴 pm-26 deploy gate：仍 **BLOCKED by no positive GitHub cross-link fixture**（per `docs/20260526-reverse-utm-positive-fixture-scan-report.md` §7 + `docs/reverse-utm-fixture-plan.md` §6 + `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` §D.1-3）
- 5/26 am + pm phase 屬 docs / template drift cleanup（am-12 ~ am-17 + pm-1 ~ pm-17）；本批 template body scaffold cleanup 與後續 docs baseline 同步皆無 build / deploy / Blogger repost / GA4 validation；6 個 template body scaffold drift 已由 `3191bea` + `726bb3b` 收斂

### 7.2 歷史紀錄（2026-05-22 之前快照保留）

（以下為原 §7 內容；屬 5/22 day-1-docs-cleanup-a 後當時快照；保留為歷史 trail；**非當前狀態**。當前狀態以 §7.1 為準）

- HEAD: `6593e4c docs(project): add custom domain root files safety strategy` （5/21 夜 custom-domain-root-files-safety-a 已落地；其後 pm-66 EOD §18 commit `f202e51` 已先在 5/21 末段落地；5/22 day-1 docs-cleanup-a 為本批；本 §7 自身落後 1 commit 為既知遞迴）
- branch: `main` / tracking `origin/main` / 與 remote 同步
- working tree: clean
- deploy repo HEAD: `f32f7d3 deploy: 09b9a67 snapshot (GA4 enabled)`（**5/21 2 個 deploy**：pm-6 `06e26ae`（SEO noindex + DS-3 CSS + admin overview polish）+ **pm-45 `f32f7d3`**（**GA4 enabled with measurementId G-C77SMPF8VD**）；皆已 push `origin/gh-pages`；deploy repo 自 pm-45 起未動；後續 commits 皆確認不需 deploy；**註**：5/24 deploy `960f234` 為後續事件；當前最新 deploy HEAD 請見 §7.1）
- validate baseline: `0 error(s) / 39 warning(s) on 34 post(s)`（pm-34 加 `fb-post-url-missing` rule + negative fixture；+1 warning 變動合理）
- dist/sitemap.xml: 14 url entries（mid-5 / pm-11 / pm-20 / pm-43 build 確認；pm-6 + pm-45 deploy 已上線）
- dist/.gitkeep: **已從 source repo 移除**（pm-20 commit `3917526` Option A.1；`.gitignore` 對應 `!dist/.gitkeep` 一行同步移除；build 後 drift 從根源消除；其他 3 個 `dist-*/.gitkeep` 保留）
- **GA4 status**：✅ **production live**（measurementId `G-C77SMPF8VD`；Blogger + GitHub Pages 共用；future custom domain 沿用；user 於 pm-46 手動驗收 Realtime 通過）
- 5/21 commits 總計 **39 source + 2 deploy**（含 pm-66 EOD §18 commit `f202e51` + 5/21 夜 custom-domain-root-files-safety-a commit `6593e4c`；5/22 day-1-docs-cleanup-a 為新一日之起點）
- 5/21 commits 純線性堆疊；無 amend / rebase / force；source main 已 sync `origin/main`；deploy gh-pages 已 sync `origin/gh-pages`
- 5/21 重點摘要：
  - Admin overview polish（am-2 ~ am-7：C-1 README baseline / C-4 audit / S-1 empty states / S-4 tooltips / S-2 linkify / S-5 docs sync）
  - C-3 Admin-only fbPublished P3 rule（mid-1 ~ mid-3；commits `edbf6d0` + `022d8bd`）
  - Dev route 404 fix（mid-4-a/b/c；commit `7c9f7ea` + verification doc）
  - Production sanity check + first deploy（mid-5 / pm-6；deploy `06e26ae` 上線通過 smoke test）
  - End-of-day report（§1-§17；自 pm-2 漸進建構至 pm-62 §17）
  - **C-2 GA4 prod-only gating 機制就位**（pm-11 commit `92f4f07`；4-AND gating Option A）
  - **`.gitkeep` emptyOutDir 長期策略 Option A.1**（pm-20 commit `3917526` 根源消除 drift）
  - **S-3 fixture + Option B validate-level rule**（pm-31 + pm-34；commits `0d4d821` + `13e38ba`；rule `fb-post-url-missing` warning-only）
  - **🎉 GA4 真實啟用全鏈完成**（pm-43 configure `09b9a67` → pm-44 push → pm-45 deploy `f32f7d3` → pm-46 user Realtime 驗收通過）
  - **UTM naming registry + content platform routing docs**（pm-48 / pm-49 / pm-52 / pm-55；registry 對齊 production snake_case convention）
  - **Admin Platform Routing read-only extension**（pm-57 loader cheap derived 4 fields `a34e909` + pm-59 EJS detail section `a285183`；user pm-62 手動驗收通過；utmPreviewUrl + list badge 暫緩）
  - **Custom domain root files safety strategy docs**（5/21 夜 commit `6593e4c`；docs-only；定義 robots / sitemap / ads.txt / CNAME / .nojekyll / favicon 等根目錄檔案策略；**custom domain 尚未啟用**；屬未來 migration 之前置 docs）
  - 多次 README baseline sync（pm-1 / pm-17 / pm-28 / pm-64 / 5/22 day-1-docs-cleanup-a）+ source push 16+ 次
- 後段重要 commits 追蹤：`92f4f07`（C-2 GA4 gating）/ `3917526`（`.gitkeep` 移除）/ `09b9a67`（**GA4 production enable**）/ deploy `f32f7d3`（**GA4 上線**）/ `13e38ba`（Option B rule + negative fixture）/ `d1e5858`（GA4 / UTM registry）/ `023227e`（content platform routing）/ `ebfe254`（UTM registry 對齊既有）/ `21cfa06`（Admin platform routing plan）/ `a34e909`（Admin loader cheap derived）/ `a285183`（Admin EJS Platform Routing section）/ `fc02a56`（Admin manual verification docs）
- **已解除 deferred items（共 6 項）**：
  - C-2 GA4 prod-only gating（機制就位；commit `92f4f07`）
  - `.gitkeep` emptyOutDir 長期策略（Option A.1；commit `3917526`）
  - S-3 fixture 補 FB metadata（populated + missing case；commits `0d4d821` + `13e38ba`）
  - Option B validate-level `fb-post-url-missing` rule（commit `13e38ba`）
  - **GA4 真實啟用**（source `09b9a67` + deploy `f32f7d3`；user Realtime 驗收通過）
  - **UTM naming reconciliation**（pm-52 registry 對齊既有 snake_case；commit `ebfe254`）
- **仍未啟動 deferred items（1 項；需 user 決策）**：
  - **hostname allowlist / GA4 runtime gating 細化**（user Option B/C；等 GA4 啟用後觀察 1-2 週）
- 今日新增 / 更新之重要 docs：
  - `docs/ga4-parameter-naming-registry.md`（pm-48 新增 + pm-52 對齊既有 snake_case）
  - `docs/content-platform-routing.md`（pm-49 新增）
  - `docs/admin-platform-routing-extension-plan.md`（pm-55 新增）
  - `docs/20260521-end-of-day-report.md`（pm-2 新增；§10/§11/§12/§13/§14/§15/§16/§17 漸進補記）
  - `docs/20260521-dev-route-fix-verification.md`（mid-4-c 新增 + mid-5-b §10）
  - `docs/20260521-admin-overview-display-audit.md`（C-4 新增）
  - `docs/admin-1-completion-report.md` §13（多批 append）
  - `docs/fb-sidecar-schema.md` §3.5.5 / `docs/phase-2-candidate-roadmap.md` §1.2 / §1.3（多批 docs sync）
- **暫緩（user 已表態）**：utmPreviewUrl Admin display / list platform indicator badge（Admin detail panel 資訊已偏長）
- **不在 scope（schema 未定 / 阻擋條件多）**：platformMigrationNote schema / custom domain migration / AdSense / `ads.txt` / hostname allowlist 實作
- 今日完整收尾報告：`docs/20260521-end-of-day-report.md`（§1-§17；含 GA4 gating series / .gitkeep cleanup / S-3 fixture / Option B rule / GA4 真實啟用 / UTM registry alignment / Admin Platform Routing extension）
- 昨日完整收尾報告：`docs/20260520-end-of-day-report.md`

---

## §8 面向使用者之操作手冊

詳見 `docs/phase-1-user-operation-guide.md`（繁中；面向系統擁有者；含 FAQ）。

---

（本文件結束）
