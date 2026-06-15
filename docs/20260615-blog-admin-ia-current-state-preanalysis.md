# BLOG ADMIN — Information Architecture & Current-State Preanalysis

- **Phase**：`20260615-pm-2-blog-admin-ia-current-state-preanalysis-docs-only-a`
- **日期**：2026-06-15（17:50）
- **性質**：**docs-only preanalysis**（只讀探查 + 文件記錄；**不**實作 ADMIN；不改 src / content / settings / templates·views / dist / package.json·lockfile；不 build / deploy；不產文 / 不重貼 Blogger）
- **baseline**：`main` HEAD == origin/main == `efdc6f5`（`docs(ga4): verify article bottom nav p1 report`）；working tree clean

> 目的：盤點目前 BLOG ADMIN「管理總覽頁雛形」與相關檔案的**真實現況**，並提出升級為完整 ADMIN 後台的**資訊架構 / 頁面清單 / 資料流 / 可讀·可寫邊界 / 風險 / 分階段建議**。
> **本 phase 僅規劃，不寫任何 ADMIN 功能。**

---

## A. 背景與目前狀態

- ✅ **GA4 P1 blocker 已解除**：article bottom nav（`click_other_link` + `click_area=article_bottom_nav`）之 P1 自訂維度 / event parameters / 報表已於 20260615 17:35 人工驗證通過（per `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`）。先前等待 GA4 報表資料之 idle freeze / pause 已解除。
- ✅ **BLOG 系統可恢復建置**：下一主線方向為 ADMIN 後台完整化。
- 🗣️ **使用者已確認**：目前產出的頁面**多半是 Claude 直接產檔**（直接寫 markdown / settings / docs），**不是透過 ADMIN 後台實際操作產生**。ADMIN 目前只是「看」的角色，不是「做」的入口。
- 🎯 **使用者目標**：以後想看某篇文章 / 系統的檔案狀況時，應**從 ADMIN 頁面看詳細資訊**，而不是直接進資料夾用肉眼翻 markdown / JSON。ADMIN 應成為「系統狀態的單一檢視入口」。

→ 結論定調：ADMIN 第一優先是**把現有分散在檔案系統的狀態，整合成一個可讀的後台檢視**；可寫操作為後續階段，謹慎推進。

---

## B. 現有 ADMIN / dashboard 檔案盤點

### B.1 入口頁（read-only dashboard，**已可操作，非純靜態雛形**）

| 檔案 | 角色 | 可操作？ | 只是靜態雛形？ |
|---|---|---|---|
| `src/views/admin/index.ejs`（1385 行）| Admin read-only 總覽頁模板 | ✅ **可操作**（dev-mode）| ❌ **不是**純雛形 — 為功能完整的唯讀 dashboard |
| `src/scripts/load-admin-posts.js` | Admin 專用 loader（glob `content/{github,blogger}/posts/*.md`，含 draft / 所有狀態）| ✅ | — |
| `src/scripts/build-github.js`（L803–825）| dev-mode-only render admin → `.cache/pages/admin/index.html` | ✅ | — |

**運作方式（已驗證自 source）**：
- `npm run dev` 時，`build-github.js --mode=dev` 呼叫 `loadAdminPosts()` → `ejs.renderFile('admin/index.ejs')` → 寫入 `.cache/pages/admin/index.html` → Vite dev server 於 **`/admin/`** 路徑提供。
- **prod build 不產出**：`--mode=build` 會先 `fs.rm('.cache/pages/admin/')`（L566），且只有 `mode==='dev'` 才 render（L804）。→ **不進 `dist/` / 不進 sitemap / 不 deploy / `<meta robots=noindex,nofollow>`**。標題即 `Admin (read-only)`，頁首 banner 明示「不公開 / 不寫入 / 不部署」。

**目前 dashboard 已具備功能**（皆 read-only）：
- 14+ 張統計卡（total / ready / draft / published / blogger·github source / blogger·github enabled / has .fb.md / SEO ok / URL ok / FB published / Missing Blogger·GitHub·FB URL）。
- 文章表格 + **search / filter（status·channel·sourceSite·completeness·fbBadge·contentKind·category·series）/ sort（publishedAt·updatedAt·title·fbPostedAt）**。
- 每篇可展開 detail panel：Identity / **Platform Routing**（primaryPlatform·publishTargets·canonicalTarget·platformUrl·gaHostname·blogger/github status）/ Dates / SEO / Blogger channel / GitHub channel / FB promotion / FB Post metadata。
- **commerce links / affiliate references read-only preview**（只顯示 safe 欄位：linkId·active·displayLabel·has-replacement；永不顯示 targetUrl / internalLabel / token）+ **copyable YAML snippet helper**（純文字 authoring helper，不寫檔）。
- **dry-run editors**：SEO 4 欄位 + FB sidecar 12 欄位 → **client-side 預覽 only，無 form submit / 無 fs write / 無 fetch / Apply button 永遠 disabled**。

### B.2 寫入路徑基礎建設（**存在但 dormant / gated；未接 browser**）

| 檔案 | 角色 | 現況 |
|---|---|---|
| `src/scripts/admin-write-cli.js` | gated real-write CLI（`npm run admin:write`）| **dormant**；real-write 須 `--apply` + `dryRun:false` + status 限 `draft` + 即時重查 whitelist（TOCTOU）+ `enforceCleanGit:true` + atomic tmp+rename |
| `src/scripts/admin-write-whitelist.js` | 寫入目標白名單 / traversal 防護 | 支援 CLI gate |
| `src/scripts/admin-field-validators.js` | per-field validator（SEO / FB 欄位）| 同時被 loader（dry-run preview）與 CLI 重用 |
| `src/scripts/admin-frontmatter-patcher.js` | frontmatter patch（atomic）| 同上 |

→ **瀏覽器 ADMIN 目前零寫入能力**；唯一寫入路徑是 CLI（`admin:write`），且對 content 仍 dormant（FB / SEO write 受 `docs/fb-sidecar-write-preflight-decision.md` §7 之 8+6 項 user preflight gate 擋住）。

### B.3 既有 ADMIN 規劃 / audit 文件（背景，不在本 phase 改動）

`docs/admin-mvp-pre-analysis.md`、`docs/admin-local-boundary-pre-analysis.md`、`docs/admin-1-readonly-preflight.md`、`docs/admin-1-completion-report.md`、`docs/admin-2-write-pre-analysis.md`、`docs/admin-2b1-completion-report.md`、`docs/admin-platform-routing-extension-plan.md`、`docs/20260521-admin-overview-display-audit.md`、`docs/admin-overview-audit-20260523.md`、`docs/20260522-night-admin-usability-report.md`、`docs/20260608-commerce-admin-*.md`（commerce selector / snippet helper）。

### B.4 與 build / content / settings / output 的關係

```
content/{github,blogger}/posts/*.md  ─┐
content/**/*.publish.json , *.fb.md   ─┤→ load-admin-posts.js ─→ admin/index.ejs ─→ .cache/pages/admin/index.html
content/settings/*.json (commerce 等) ─┘        (read-only)              (dev-only)         (served at /admin/, 不進 dist)
```
- ADMIN **只讀** content + settings；**不**觸發 build-blogger / build-github 之實際渲染、**不**寫 `dist/` / `dist-blogger/` / `dist-promotion/`。
- ADMIN 顯示的 URL（blogger.publishedUrl / github.previewUrl / canonicalTarget）為**回填值或 derived 推導**，**不**代表 build / deploy 之實際結果。

---

## C. 建議 ADMIN 後台主要頁面分析

> 評級：✅ 已有（read-only）／🟡 部分已有可擴充／🔶 新頁面建議（read-only 先行）／⏸ 後續階段。

| # | 頁面 | 是否需要 | 現況 | 建議 |
|---|---|---|---|---|
| 1 | **管理總覽 Dashboard** | ✅ 需要 | 🟡 現為「Posts 表格 + 統計卡」混在一頁 | 拆出獨立 Dashboard：全站健康度（counts / warnings / surfaces / GA4·AdSense·commerce 狀態摘要）導覽到各子頁 |
| 2 | **文章列表 Posts** | ✅ 需要 | ✅ 已有（search/filter/sort/badges）| 保留；後續補 GA4 / AdSense / nav readiness 欄（見 §F）|
| 3 | **單篇文章詳細 Post Detail** | ✅ 需要 | ✅ 已有（detail panel：Identity / Platform Routing / Dates / SEO / Blogger / GitHub / FB）| 擴充 GA4 / AdSense / commerce / nav / validation 區塊；可獨立 route |
| 4 | **文章建立/編輯 Draft Editor** | 🟡 需要但**最後做** | 🟡 僅 client-side dry-run preview（無寫入）| **第三階段才碰**；先停在 copy-helper / dry-run，不做 browser 寫檔 |
| 5 | **分類 / 標籤管理** | ✅ 需要 | 🔶 無專頁（僅 filter）| 新增 **read-only** categories.json / tags.json 檢視（用量計數 / site 對應 / 未使用標籤）|
| 6 | **Slug / permalink 管理** | ✅ 需要 | 🟡 detail 內已顯示 slug / blogger.permalink / canonicalTarget | 新增 read-only slug 一覽 + 衝突檢查（重複 slug / 缺 slug）|
| 7 | **Surface 發布管理（Blogger / GitHub Pages）** | ✅ 需要 | 🟡 detail 已顯示 publishTargets / mode / status / URL | 新增 read-only surface matrix（per-post × surface × enabled/mode/published/URL）|
| 8 | **GA4 狀態與事件參數檢查** | ✅ 需要 | 🔶 無（GA4 狀態未進 ADMIN）| 新增 read-only：measurementId、event/param registry、P1 維度註冊狀態、per-post nav tracking readiness（見 §F）|
| 9 | **AdSense slot / block 狀態** | ✅ 需要 | 🔶 無（資料在 `ads.config.json` + resolver）| read-only：master `enabled`、client/slot present、per-post resolved article blocks（surface gate）；**不顯示 real id 全值**（masked）|
| 10 | **Commerce / affiliate links 管理** | ✅ 需要 | ✅ read-only preview + snippet helper 已有 | 保留；補 per-post `affiliate.links[].ref` 使用一覽 + warning 計數 |
| 11 | **Build / output / deploy 狀態** | ✅ 需要 | 🔶 無（ADMIN 不觸發 build）| read-only：last build report（`report:build`）、dist 是否存在、最後 deploy commit（讀 git / report，不重建）|
| 12 | **Blogger manual copy helper** | ✅ 需要 | 🟡 build:blogger 產 `copy-helper.txt` / `publish-checklist.txt`（在 dist-blogger）| ADMIN 提供 per-post 連到既有 copy-helper 產物之入口（read-only 指引；不重貼）|
| 13 | **系統設定 / validation 結果頁** | ✅ 需要 | 🔶 無（validate 在 CLI）| read-only：`validate:content` 最近結果（errors/warnings/issue-posts）、各 check 腳本狀態；per-post warning 計數 |
| 14 | **操作紀錄 / audit log** | 🟡 需要（待有寫入才有意義）| 🔶 無 | 第一階段可先記「ADMIN 為唯讀、無操作可記」；待第三階段寫入時才建 audit log |

---

## D. Read-only 優先策略（**第一階段強烈建議**）

**建議：ADMIN 第一階段一律以 read-only dashboard / status viewer 為主，不要一開始就做可寫操作（Apply / Save / 直接寫檔）。**

原因：
1. **避免誤改 content / settings / source**：ADMIN 一旦能寫，任何 UI bug 或誤點都可能改壞 markdown frontmatter / JSON registry，污染唯一資料來源（CLAUDE.md §25「不得讓唯一資料只存在單一處」）。
2. **目前系統有多條同時在跑的治理線**，可寫操作會橫跨它們、風險面很大：
   - content schema（frontmatter 欄位字典 / contentKind vs blogger.type）
   - Blogger repost（手動重貼 + 備份 + theme CSS gate，仍多處 BLOCKED）
   - GitHub Pages output / deploy（dist sync + gh-pages push）
   - GA4（event/param/custom dimension 命名一致性）
   - AdSense（real id 只存 `ads.config.json`、master kill-switch、surface gate）
   - commerce links（registry 紅線：永不含 credential/token；ref↔registry 一致）
3. **先讓使用者能從 ADMIN「看懂系統現況」，比先做 Apply/Save 更重要**：使用者的核心痛點是「不想再進資料夾肉眼看」，這個痛點用**唯讀檢視**就能解決，不需要寫入能力。
4. 唯讀先行也讓資料模型（§F）、頁面 IA（§C）先穩定下來，之後要加寫入時界面與欄位已被驗證過。

---

## E. 後續可寫功能邊界（分階段）

| 階段 | 可做 | 不可做 | 對應既有基礎 |
|---|---|---|---|
| **第一階段（read-only）** | dashboard / posts / detail / 各 status viewer；search/filter/sort；連到既有產物 | 任何寫檔 / form submit / fetch | `load-admin-posts.js` + `admin/index.ejs`（擴充）|
| **第二階段（copy-helper / snippet helper）** | 產生可手動複製之 YAML / frontmatter / Blogger snippet（純文字輸出）；dry-run preview | 自動寫入 .md / .json / registry | 已有 commerce YAML snippet helper + SEO/FB dry-run editor 為樣板 |
| **第三階段（local write，CLI 優先）** | 經 `admin-write-cli.js` 之 **gated** 本機寫入（`--apply` + `dryRun:false` + status=draft + clean git + whitelist + atomic）| browser 直接寫檔 | `admin-write-cli.js` / `admin-write-whitelist.js` / `admin-frontmatter-patcher.js` / `admin-field-validators.js` |
| **（暫不建議）browser 直接寫檔** | — | 除非已有明確 middleware / CLI safety design 與獨立 preflight + 驗收，否則不開放 | 須另開 preanalysis（per `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`）|

→ 順序紅線：**read-only → copy-helper/dry-run → gated CLI write → （最後且須獨立安全設計）middleware/browser write**。不可跳階。

---

## F. 建議資料模型（ADMIN 每篇文章顯示欄位）

> 標記：✅ loader 已提供／🟡 部分已有／🔶 待新增（derived，read-only）。

| 欄位 | 現況 | 來源 / 備註 |
|---|---|---|
| title | ✅ | frontmatter |
| slug | ✅ | frontmatter |
| status | ✅ | draft / ready / published / archived |
| category | ✅ | frontmatter（對 categories.json）|
| tags | ✅ | frontmatter（對 tags.json）|
| permalink / canonical URL | 🟡 | `blogger.permalink` / `canonicalTarget` / `platformUrl` 已 derived |
| Blogger surface 狀態 | ✅ | `blogger.enabled` / `mode` / `status` / `publishedUrl` |
| GitHub Pages surface 狀態 | ✅ | `github.enabled` / `mode` / `previewUrl` / `githubStatus`(rendered/pending/disabled) |
| GA4 tracking readiness | 🔶 待新增 | derive：是否 indexable + 是否有 article bottom nav + measurementId present；**不**即時打 GA4 API |
| AdSense blocks readiness | 🔶 待新增 | derive：`ads.enabled` + resolver 對該 post/surface 產生幾個 block（重用 `resolve-adsense-blocks.js`）；real id masked |
| commerce links count / warnings | 🟡 | 已有 registry preview；待加 per-post `affiliate.links[].ref` 計數 + C1–C9 warning 數 |
| related previous / next / home nav 狀態 | 🔶 待新增 | derive：post-list 排序中是否有 prev/next、home link 是否存在（對 GA4 P1 分析對齊）|
| validation warning / error count | 🔶 待新增 | 讀 `validate:content` 結果（per-post 聚合）；不即時重跑可採 last-report |
| last generated / last published / last checked | 🟡 | builtAt（admin 產生時間）已有；last published 用 `publishedAt`；last checked 待接 report 時間戳 |

→ 多數**識別 / surface / commerce** 欄位 loader 已備齊；**主要缺口** = GA4 readiness / AdSense readiness / nav 狀態 / validation 計數 / last-checked 時間戳（皆可 read-only derive，無需寫入）。

---

## G. 風險與紅線（本 phase 不可做事項）

- ❌ **不要在本階段實作 ADMIN**（本 phase 純 preanalysis）。
- ❌ **不要改** `src` / `content` / `settings` / `package.json`·lockfile / `dist`·`dist-blogger`·`dist-promotion`。
- ❌ **不要 build / deploy**（無 `npm run build` / `build:*` / `deploy` / gh-pages push）。
- ❌ **不要產新文章 / 不要重貼 Blogger / 不要開 Blogger·AdSense·GA4 後台操作**。
- ❌ **不要修改 GA4 / AdSense / commerce 規則**（命名、registry、real id、surface gate、紅線一律不動）。
- ❌ **不要壓縮 / 重排 / 大改 CLAUDE.md**（只做最小必要 ledger 追加）。
- ❌ 不 `npm install` / 不動 lockfile。
- ✅ 只允許：本 doc 新增 + CLAUDE.md 極小 ledger 追加。

---

## H. 下一步分階段建議（implementation phases）

1. **`...-blog-admin-ia-current-state-preanalysis-docs-only`（本 phase）** — IA + 現況盤點，docs-only。✅
2. **Admin read-only dashboard route / file map implementation** — 規劃 / 落地 ADMIN 路由與檔案地圖（dev-only `/admin/`；拆 Dashboard vs Posts；**仍 read-only**）。
3. **Admin posts index read-only view** — 強化文章列表（保留現有 + 補 §F 缺口欄位之 read-only derive）。
4. **Admin post detail read-only view** — 單篇 detail 擴充（GA4 / AdSense / commerce / nav / validation 區塊，read-only）。
5. **Admin GA4 / AdSense / commerce / surface status integration** — 把多條治理線狀態整合進 ADMIN（read-only；real id masked；不打外部 API）。
6. **Admin copy-helper / YAML snippet helper** — 第二階段；擴充純文字 authoring helper（沿用既有 commerce snippet / dry-run 樣板）。
7. **Admin local write CLI / middleware safety preanalysis** — 第三階段**前置**；docs-only 規劃 gated write 安全設計（沿用 `admin-write-cli.js` gate）。
8. **（最後）gated write implementation** — 僅在 7 的安全設計 + 獨立 preflight + user explicit approval 後，才落地受控寫入。

> 主線節奏：**先 2–5 把唯讀後台補完整（讓使用者能從 ADMIN 看懂一切），再 6（copy-helper），最後 7→8（受控寫入）。** 每階段獨立 phase + 獨立驗收，不跳階、不混做。

---

## I. Cross-links

- `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`（GA4 P1 verified / resume，本 phase 前置）
- `docs/admin-mvp-pre-analysis.md` / `docs/admin-local-boundary-pre-analysis.md` / `docs/admin-1-readonly-preflight.md`（ADMIN 邊界與 Plan B）
- `docs/admin-1-completion-report.md` / `docs/admin-2b1-completion-report.md`（read-only / dry-run 收尾）
- `docs/admin-platform-routing-extension-plan.md`（Platform Routing derived 欄位）
- `docs/admin-2-write-pre-analysis.md` / `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（write surface / middleware 安全策略）
- `docs/fb-sidecar-write-preflight-decision.md` §7（FB write 8+6 preflight gate）
- `docs/20260608-commerce-admin-selector-preanalysis.md` / `docs/20260608-commerce-admin-copyable-yaml-snippet-preanalysis.md`（commerce read-only preview / snippet helper）
- source：`src/views/admin/index.ejs`、`src/scripts/load-admin-posts.js`、`src/scripts/build-github.js`（L803–825）、`src/scripts/admin-write-cli.js`

---

（本文件結束）
