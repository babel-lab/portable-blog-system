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

### 3.4 SEO / GA4 / AdSense

- `docs/seo-ga4-adsense.md` — SEO meta + sitemap + GA4 + AdSense 完整實作報告
- `docs/seo-indexing-rules.md` — indexing policy（含 SEO-0 ~ SEO-2-z 7 batches checkpoint）
- `docs/seo-sitemap-split-pre-analysis.md` — SEO-4 多平台 sitemap 拆分 pre-analysis（結論：當前不建議實作）
- `docs/ga4-enable-preflight.md` — GA4 measurementId 接入 preflight + user checklist

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

## §7 今日穩定 baseline

（更新時點：2026-05-21；pm-17 後快照）

- HEAD: `ffb1b37 docs(project): record ga4 gating completion and deploy decision` （pm-15 後 push origin/main；pm-17 為本批 baseline cleanup commit；本 §7 自身落後 1 commit 為既知遞迴）
- branch: `main` / tracking `origin/main` / 與 remote 同步
- working tree: clean
- deploy repo HEAD: `06e26ae deploy: 68cfddb snapshot (SEO noindex + DS-3 CSS + admin overview polish)`（pm-6 已 push `origin/gh-pages`；pm-13 確認 pm-11 之 ga4 gating 不需 deploy；deploy repo 自 pm-6 起未動）
- validate baseline: `0 error(s) / 38 warning(s) on 33 issue-post(s)`
- dist/sitemap.xml: 14 url entries（mid-5 / pm-11 build 確認；pm-6 deploy 已上線）
- dist/.gitkeep: tracked & clean（mid-5-b / pm-11 經驗：每次 build 後手動 restore；長期策略 deferred）
- 今日 commits 總計 **16 source + 1 deploy**（pm-17 commit 後將為 17 source）
- 今日 commits 純線性堆疊；無 amend / rebase / force；source main 已 sync `origin/main`；deploy gh-pages 已 sync `origin/gh-pages`
- 今日重點摘要：
  - Admin overview polish（am-2 ~ am-7：C-1 README baseline / C-4 audit / S-1 empty states / S-4 tooltips / S-2 linkify / S-5 docs sync）
  - C-3 Admin-only fbPublished P3 rule（mid-1 pre-analysis / mid-2 C-3-a loader + EJS / mid-3 C-3-c docs sync 4 docs；validate-level rule 仍 deferred）
  - Dev route 404 fix（mid-4-a diagnosis / mid-4-b basePath dev/build 分流 / mid-4-c user 手測通過 + verification doc）
  - Production sanity check（mid-5 build 成功 + mid-5-b dist/.gitkeep restore + docs §10）
  - README baseline sync × 2（pm-1 + 本批 pm-17）
  - End-of-day report（pm-2 docs 落地；pm-7 線上 smoke test；pm-8 EOD §10；pm-14 EOD §11 GA4 gating series）
  - Source push × 3（pm-4 首次 push 13 commits + upstream / pm-9 pm-8 docs / pm-12 pm-11 GA4 gating / pm-15 pm-14 docs）
  - Deploy phase B（pm-6：dist → deploy repo → push gh-pages → 線上 smoke test 通過 / pm-13 GA4 gating commit 不需 deploy）
  - C-2 GA4 prod-only gating 機制就位（pm-10 preflight → pm-11 Option A implementation commit `92f4f07` → pm-12 push → pm-13 deploy decision；**GA4 仍未啟用**）
  - Deferred items read-only review（pm-16）
- 仍未啟動（pending；需 user 決策）：S-3 fixture 補 FB metadata / Option B validate-level fbPublished rule / `.gitkeep` emptyOutDir 長期策略 / **GA4 真實啟用**（measurementId + enabled=true）/ **hostname allowlist**（user Option B/C；GA4 啟用後再評估）
- 今日完整收尾報告：`docs/20260521-end-of-day-report.md`（§1-§11；含 GA4 gating series）
- 昨日完整收尾報告：`docs/20260520-end-of-day-report.md`

---

## §8 面向使用者之操作手冊

詳見 `docs/phase-1-user-operation-guide.md`（繁中；面向系統擁有者；含 FAQ）。

---

（本文件結束）
