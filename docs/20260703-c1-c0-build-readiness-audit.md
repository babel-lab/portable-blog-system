# C1-C0 Build Readiness Audit — `what-is-design-token`（docs-only）

- **Phase name**：`20260703-c-c1-c0-build-readiness-audit-docs-only`
- **Date**：2026-07-03（Asia/Taipei；接續 `20260703-B` / C1-B0 dry-run）
- **Type**：**docs-only / read-only audit**。**不**改 `content/` / `src/` / `content/settings/` / `CLAUDE.md`、**不** flip `ready→published`、**不** build、**不** preview、**不** deploy、**不**碰 gh-pages、**不**改 Blogger / GA4 / AdSense / Search Console、**不** `npm install` / dependency / lockfile。唯一 mutation = 新增本檔。

---

## 0. Critical disclaimers（read first）

1. 本輪只**盤點推導**，不改任何檔、不 flip status、不 build、不 deploy。
2. 「若進 build 會影響哪些輸出」全部由**讀 source + build/sitemap script 邏輯推導**得出，**未實際跑 build**；未讀取 `dist/`、未 fetch、未 pull。
3. deploy clone（`portable-blog-deploy` / gh-pages）本輪**未進入、未觸碰**；僅由 prepublish guard read-only 驗證其 baseline invariant。
4. 唯一執行的指令 = **read-only prepublish guard pair**（`check:github-pages-prepublish` + `check:github-pages-prepublish-smoke`）。

---

## 1. Purpose

執行 C1 checklist §8 next-step **C**：對候選文章 `content/github/posts/2026-06-30-what-is-design-token.md`，做**發布前 read-only build readiness audit** —— 推導它若進入 `published` / `build` / `deploy` 會影響哪些輸出、有無 publish 前風險、prepublish guard 是否足以作為 gate、是否仍有 blocker。

延續 C1-B0（`docs/20260703-c1-c0` 之前身 `docs/20260703-c1-b0-single-real-article-publish-checklist-dry-run.md`）之結論：§4 技術面 PASS、§4.6 決策面 Dean-gated BLOCKED、唯一 WARN = cover placeholder。

---

## 2. Session-start baseline（2026-07-03, Asia/Taipei）

Source repo（`/d/github/blog-new/portable-blog-system`）：

```text
branch: main
HEAD = origin/main = 37644b8567e965981b72643e1e3d13668c31f3ff
short: 37644b8
subject: docs(publish): dry run checklist for single real article
ahead/behind: 0/0
working tree: clean
.git/index.lock: absent
```

Deploy clone（`/d/github/blog-new/portable-blog-deploy`；本輪僅由 guard read-only 驗證，未進入）：

```text
branch: gh-pages
HEAD = origin/gh-pages = d0f37eb
（guard 驗證：ahead/behind == 0/0；.git/index.lock absent）
```

Baseline **matched** on entry；未嘗試修正；deploy clone 未被觸碰。

---

## 3. 候選文章關鍵事實（read-only）

| 欄位 | 值 | audit 相關 |
|---|---|---|
| 檔案 | `content/github/posts/2026-06-30-what-is-design-token.md` | — |
| `status` / `draft` | `ready` / `false` | **已是 build 候選**（見 §4.1） |
| `contentKind` | `tech-note` | 非 `download` → 不被 SEO-1 fallback 排除出 sitemap |
| `seo.indexing` | **不存在** | 無 explicit override → sitemap default = **include** |
| `includeInSitemap` / `includeInListings` | **不存在** | 無顯式 override → 走既有 default |
| `publishTargets.github.enabled` | `true`（`mode: full`） | GitHub Pages 會輸出 |
| `publishTargets.blogger.enabled` | `false`（`mode: summary`） | Blogger build 不輸出（見 §5.2） |
| `canonical` | `"auto"` + `primaryPlatform: github` | canonical = GitHub URL |
| `.publish.json` sidecar | **不存在**（posts 目錄無任何 `.publish.json`） | 走 `.md` inline frontmatter 過渡路徑（見 §5.5） |
| `cover` / `coverAlt` | placeholder SVG / "cover placeholder" | advisory WARN（見 §5.3） |

環境事實：

- `site.config.json.githubSiteUrl = "https://babel-lab.github.io/portable-blog-system"` → **project site**（含 subpath），與既有 live 部署一致（per commerce governance memory：project-site LIVE `https://babel-lab.github.io/portable-blog-system/`）→ **不觸發** github-deploy §8 blocker #4（githubSiteUrl 與 site 型態不符）。
- `vite.config.js` build 模式 `base = './'`（relative）→ 適用 project site（per github-deploy §2.1）。

---

## 4. 若進 published / build / deploy 會影響哪些輸出（推導，未實際 build）

### 4.1 關鍵前提：`ready` 已是 build 候選

per status contract（C1 checklist §3 / publish-workflow §10）：`ready` 與 `published` **皆 `draft: false`、皆為 build/publish 候選**。design-token 自 2026-06-30 起即 `ready` →

> **flip `ready → published` 本身「不改變」GitHub Pages build 的納入與否** —— design-token 現在任何一次 `npm run build` 都已被納入。`published` 主要語意是「已實際發布至平台」+ 解鎖 publishedUrl 回填 / promotion / canonical 收錄，對 GitHub Pages 靜態輸出的「是否出現」不構成差異。

### 4.2 一次完整 build 會產生 / 更新的 design-token 相關輸出

| 輸出 | 內容 |
|---|---|
| `dist/posts/what-is-design-token/index.html` | post detail 頁（full mode） |
| `dist/sitemap.xml` | 新增一筆 `https://babel-lab.github.io/portable-blog-system/posts/what-is-design-token/`（sitemap 邏輯：無 `seo.indexing`、非 download、無 `includeInSitemap:false` → default include，per `build-sitemap.js` §3 / `include-in-sitemap.js`） |
| listing 頁 | 首頁 `dist/index.html`、category `dist/categories/tech-note/`、tag `dist/tags/static-site/` 會含 design-token 卡片（tech-note category + static-site tag 已存在於 registry） |
| `dist/robots.txt` | 不因單篇而變（design-token 不在 Disallow 清單） |

### 4.3 「相對 live 的實際 delta」= UNKNOWN this round

實際 deploy 後對線上的**變化量**，取決於「當前 live gh-pages（`d0f37eb`）是否已含 design-token」：

- 若 live 部署早於 design-token 轉 ready → build+deploy 會**新增** design-token 的 detail 頁 + sitemap entry + listing 卡片。
- 若 live 已含 → 幾乎無變化（僅 builtAt 時戳類差異）。

本輪**無法在不 build / 不 fetch / 不碰 deploy clone 前提下確認** live 是否已含 design-token → 標記為 **UNKNOWN（advisory，非 blocker）**；待未來實際 build 時以 `report:build` / `dist/sitemap.xml` url count 對照確認。

---

## 5. Publish 前風險逐項檢查

### 5.1 robots / sitemap / feed 是否受影響

- **sitemap**：✅ 會新增 1 筆 design-token url（見 §4.2）；屬**預期且正確**行為（tech-note、indexable）。非風險。
- **robots.txt**：✅ 不受單篇影響；design-token 不落在 `Disallow: /design-system/` / `/404.html`。非風險。
- **feed**：本專案第一版**無 RSS/Atom feed** 產物（build 產物表無 feed；sitemap.xml 為唯一機器索引）→ 無 feed 面風險。
- 判定：🟢 **無風險**（sitemap 新增 entry 為預期正向行為）。

### 5.2 Blogger disabled 是否安全

- `publishTargets.blogger.enabled = false` → `npm run build:blogger` 不輸出 design-token；不產生 `dist-blogger/posts/what-is-design-token/`；不進 Blogger 手動貼文流程。
- 無 `.fb.md` sidecar → 無 FB promotion 連動。
- 判定：🟢 **安全**（github-only，Blogger surface 完全不涉入）。

### 5.3 cover placeholder 是否只是 advisory WARN

- `cover: /images/placeholders/cover-placeholder.svg`（`public/` 內既有 asset，build 時經 vite copy 至 `dist/images/...`，可正常解析，**不會 broken image**）。
- `coverAlt` 有值且與 cover 一致（有 cover → alt 有值），checklist §4.3 不擋 ready。
- 判定：⚠️ **advisory WARN only**（非 blocker）。屬「正式對外發布前建議換真實封面 + 具描述性 alt」的內容品質提醒，**非技術阻擋**。

### 5.4 prepublish guard 16/16 + 8/8 是否足以作為 publish 前 gate

- guard 驗證範圍：source/deploy repo baseline invariant（branch / HEAD == origin / working tree clean / ahead·behind == 0/0 / `.git/index.lock` absent / 必要 docs 存在）+ 對 7 個 failure fixture 自我測試。
- guard **不做**的事：**不**跑 `validate:content`、**不**檢查單篇 frontmatter 合法性、**不**檢查 §4 checklist 各項、**不** build、**不** deploy。
- 判定：🟡 **必要但不充分**。guard 保證的是「repo 衛生 / deploy 前置狀態乾淨」，**不是**「這篇內容 publish-ready」。完整 publish gate = **guard（repo 衛生）＋ C1-B0 §4 checklist PASS（單篇內容）＋ `validate:content` 0 error（全站回歸）** 三者合看。單靠 guard 不可作為內容層唯一 gate。

### 5.5 `.publish.json` sidecar 缺席

- design-token 無 `.publish.json`；publishTargets / canonical 皆由 `.md` inline frontmatter 提供（過渡相容路徑，per publish-workflow §9）。
- build 讀 frontmatter 即可運作 → **不阻擋 build**。
- 影響：`report:urls`（Blogger publishedUrl 回填檢查）對本篇無意義（Blogger disabled）；canonical 走 `auto` → github，運作正常。
- 判定：🟡 **advisory**（過渡路徑合法；若未來要 Blogger 化或走 sidecar-first SOP 再補 `.publish.json`）。非 blocker。

### 5.6 是否仍有任何 blocker

- github-deploy §8 blocker 清單逐項：#1 remote 未設 → 已設（origin 正常 push）；#2 repo 未建 → 已建；#3 Pages 未啟用 → 既有 live 已啟用；#4 githubSiteUrl 不符 → 已是正確 project-site URL。→ **§8 四項 🔴 blocker 皆不觸發**。
- 內容層：§4.1–§4.5 全 PASS（見 C1-B0）；唯一 WARN = cover placeholder（advisory）。
- 判定：🟢 **無技術 blocker**。唯一仍 BLOCKED = **Dean 決策 gate**（§6）。

---

## 6. 決策 gate 現況（仍 BLOCKED）

| 決策項 | 現況 | 需誰 |
|---|---|---|
| flip `ready → published`（手動改 frontmatter） | 🔴 BLOCKED | Dean 明確授權（Claude 不自動 flip） |
| 是否進 build（`npm run build`） | 🔴 BLOCKED | Dean 明確授權 |
| 是否進 deploy（push gh-pages / 碰 deploy clone） | 🔴 BLOCKED | Dean 明確授權 |
| （可選）cover placeholder → 真實封面 + coverAlt | 🟡 建議、非強制 | Dean 內容決定 |

三項 BLOCKED **非文章瑕疵**，是設計上的 Dean-gated 決策點。

---

## 7. 結論

### 7.1 technical ready / not ready

- **Technical READY.** design-token 在**不修改**前提下已具備 build/publish 所需之全部技術條件：frontmatter contract 合法、registry 命中、sitemap 會正確納入、Blogger 面安全隔離、cover placeholder 可正常解析、無任何 error 級 blocker、github-deploy §8 四項 blocker 皆不觸發。
- 唯一內容層提醒 = cover placeholder（advisory WARN，不擋發布）。

### 7.2 decision gate 是否仍 BLOCKED

- **仍 BLOCKED（決策面）。** flip / build / deploy 三項皆需 Dean 明確授權；本輪一律不執行。技術 ready ≠ 自動放行。

### 7.3 下一步若 Dean 批准，應該做什麼

若 Dean 批准，建議順序（權威流程見 `docs/github-deploy.md` §4–§5 + `docs/publish-workflow.md` §3）：

1. （可選內容修飾）換 design-token 真實封面圖 + 具描述性 `coverAlt`。
2. Dean 手動 flip `status: ready → published` + `draft: false`（Claude 不自動 flip）。
3. `npm run validate:content` → 確認 **0 error**（warning 上升可接受）。
4. `npm run build`（含 postbuild `build:sitemap` auto-chain）→ 產出 `dist/`；對照 github-deploy §4 產物表 + sitemap url count。
5. `npm run preview` 本機 sanity check（檢查後關閉，不長駐）。
6. deploy（**先確認 deploy clone 狀態**）→ 依 github-deploy §5.4 增量更新 push gh-pages。
7. 上線後驗證 → github-deploy §7 + `docs/checklists/github-deploy-checklist.md`。

每一步（尤其 4/6）仍需 Dean 逐步明確授權；本 audit 不代表任何預先放行。

---

## 8. 本輪唯一執行的 read-only 指令

```text
npm run check:github-pages-prepublish        → 16/16 PASS
npm run check:github-pages-prepublish-smoke  → 8/8 PASS
```

皆 read-only（不 build / deploy / publish / fetch / pull）；同時驗證 source repo（`37644b8`）與 deploy clone（`d0f37eb`；ahead/behind 0/0；index.lock absent）baseline invariant 皆成立。

---

## 9. 本 phase 邊界（self-check）

- ✅ 唯一 file change：新增本檔 `docs/20260703-c1-c0-build-readiness-audit.md`。
- ✅ 未改 `src/` / `views/` / `scripts/` / `content/` / `content/settings/` / `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / `memory/`。
- ✅ 未 flip 任何文章 status（design-token 仍 `ready`）。
- ✅ 未 build / preview / deploy / repost / gh-pages；未讀取 `dist/`；deploy clone 未觸碰（僅 guard read-only 驗證）。
- ✅ 未改 Blogger / Google / GA4 / AdSense / Search Console。
- ✅ 未 `npm install` / 未動 dependency / lockfile；未引入 Playwright / 新 devDependency。
- ✅ 唯一執行指令 = read-only prepublish guard pair（16/16 + 8/8）。

---

## 10. Cross-links

- `docs/20260703-c1-b0-single-real-article-publish-checklist-dry-run.md`（C1-B0 §4 dry-run；本 audit 前身結論）。
- `docs/20260702-github-pages-publish-path-readiness-and-prepublish-checklist.md`（C1 checklist；§8 option C = 本 audit）。
- `docs/github-deploy.md`（F-01 deploy runbook；§4 產物表 / §5 gh-pages 流程 / §8 blocker 判定）。
- `docs/publish-workflow.md`（§3 build 順序 / §10 status transition SOP）。
- `src/scripts/build-sitemap.js` §3 + `src/scripts/include-in-sitemap.js`（sitemap inclusion precedence）。
- `CLAUDE.md` §3a Validation baseline（`check:github-pages-prepublish` 16/16 + smoke 8/8）+ Red lines。

---

（本文件結束 / end of document）
