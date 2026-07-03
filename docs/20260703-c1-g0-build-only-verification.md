# C1-G0 Build-Only Verification Before Preview/Deploy（docs-only report）

- **Phase name**：`20260703-h-c1-g0-build-only-verification-docs-only`
- **Date**：2026-07-03（Asia/Taipei；接續 `20260703-G` / C1-F0 re-check）
- **Type**：**build-only 驗證**（本輪授權 build）。**不** preview、**不** deploy、**不**寫入 deploy clone、**不** push gh-pages、**不**改 `content/` / `src/` / `content/settings/` / `CLAUDE.md`、**不**改 Blogger / GA4 / AdSense / Search Console、**不** `npm install` / dependency / lockfile。唯一 git mutation = 新增本 docs 檔（`dist/` 與 `.cache/` 皆 git-ignored，不 stage、不 commit）。

---

## 0. Critical disclaimers（read first）

1. **本輪只 build，不 preview / 不 deploy / 不碰 gh-pages / 不寫 deploy clone。**
2. build 產物 `dist/` 與 build data `.cache/` 皆 **git-ignored**；本輪不 stage / 不 commit 它們。
3. deploy clone（`portable-blog-deploy`）僅 read-only fetch/rev-parse 驗證 baseline，未進入、未寫入。
4. **本輪發現一個 deploy-safety 問題（stale `.cache/pages` → dist orphan 頁），詳 §5；已在 build 範圍內驗證 remedy，但未改 `src/`、未 auto-fix。**

---

## 1. Purpose

在 deploy scope 收斂為 3 篇（C1-F0）後，執行 **build-only 驗證**，確認 `dist/` 輸出是否符合預期：正確納入 3 篇、正確排除 quarantined + draft + stale，sitemap / listing 符合 C1-F0。

---

## 2. Session-start baseline（2026-07-03, Asia/Taipei）

```text
source: /d/github/blog-new/portable-blog-system
branch: main
HEAD = origin/main = 0dff45d7aa9a91a5404da5efbf938821e5ea2980
short: 0dff45d
subject: docs(publish): re-check deploy scope after quarantine
ahead/behind: 0/0 · working tree clean · .git/index.lock absent

deploy clone: /d/github/blog-new/portable-blog-deploy（read-only）
gh-pages = origin/gh-pages = d0f37eb · clean · index.lock absent · 未觸碰
```

Baseline **matched** on entry。

---

## 3. Pre-build gate（全數通過才 build）

| 指令 | 結果 |
|---|---|
| `npm run validate:content` | ✅ **0 error / 135 warning / 107 post**（baseline 一致） |
| `npm run check:github-pages-prepublish-smoke` | ✅ **8/8 PASS** |
| `npm run check:github-pages-prepublish` | ✅ **16/16 PASS** |

三項全通過 → 執行 `npm run build`。

---

## 4. Build 結果

`npm run build`（vite build + prebuild `build-github` + postbuild `build:sitemap`）→ ✅ 成功（`built in ~540ms`；sitemap 17 url entries）。

### 4.1 資料層（listing + sitemap）= 符合預期 ✅

由 `loadGithubPosts()` 產生，正確套用 draft/status 過濾：

- **`dist/posts/index.html`（posts 列表）**：提及 `portable-blog-system-mvp`=1、`what-is-design-token`=1；`github-pages-blog-planning`=**0**、`phase1-e2e-manual-test-1547`=**0**、`test-admin-ui-post`=**0**。
- **`dist/index.html`（首頁）**：`what-is-design-token`=1、`portable-blog-system-mvp`=1；`github-pages-blog-planning`=**0**。
- **`dist/sitemap.xml`（17 entries）**：含 `posts/what-is-design-token/` ✅、`posts/github-pages-build-preview-workflow/` ✅；**不含** `portable-blog-system-mvp`（noindex-follow，正確排除）✅、**不含** `github-pages-blog-planning` ✅、**不含**任何 test/stale ✅。另含 `posts/we-media-myself2/`（既有 blogger-cross mirror，見 §6）、home / posts-index / categories / tags / privacy / affiliate-disclosure。

→ listing 與 sitemap **完全符合 C1-F0 預期**。

### 4.2 feed / search index

本專案第一版**無 RSS/Atom feed、無 search index**（per CLAUDE.md §4 / §20）；`sitemap.xml` 為唯一機器索引 → 無其他 index 需檢查。

---

## 5. 🔴 KEY FINDING：stale `.cache/pages` 導致 dist 出現 orphan detail 頁

### 5.1 現象（首次 build，未清 cache）

雖然資料層（listing/sitemap）正確排除，但 **detail 頁層** `dist/posts/` 多出 **3 個非預期目錄**：

| dist/posts orphan | 應排除原因 | source `.md` |
|---|---|---|
| `github-pages-blog-planning/` | 已 quarantine（`draft:true`） | 存在但 draft |
| `phase1-e2e-manual-test-1547/` | 已刪除的 Phase 1 E2E 測試檔 | **不存在**（orphan） |
| `test-admin-ui-post/` | stale 測試產物 | **不存在**（orphan） |

### 5.2 Root cause

- `src/scripts/build-github.js` 定義 `PAGES_DIR = .cache/pages`，prebuild 只**增量寫入**當前被納入 post 的 page data，**全檔無任何 `.cache/pages` 清理**（唯一 `fs.rm` 針對 `adminCacheDir`，非 posts）。
- 檔案層 mtime 佐證：本次 build 於 **11:28:43** 執行，只有 4 篇被納入 post 的 `.cache/pages/posts/*/index.html` 更新為 11:28:43；3 個排除項為 stale（`github-pages-blog-planning` = 07-02 16:04〔quarantine 前舊版〕、`phase1-e2e-manual-test-1547` = 07-02 16:04、`test-admin-ui-post` = 07-02 11:54），**本次未重生**。
- `vite build` 之 `emptyOutDir: true` 清空 `dist/` 後，把**整個** `.cache/pages`（含 3 個 stale）重寫進 `dist/`（dist detail 頁 mtime 全 11:28:44）。

→ 結論：**stale `.cache/pages` 從不被清理 → vite 把舊/已刪 post 的 detail 頁重新輸出到 dist**。

### 5.3 Deploy-safety 影響

若把「未清 cache」的 `dist/` 直接 deploy：`github-pages-blog-planning`（quarantined scaffold 佔位文）+ 2 個已刪測試檔會以 **orphan URL 上線**（不被 listing/sitemap 連結，但 URL 直接可達）。→ 這會**在 detail 頁層抵銷 quarantine 的 deploy 安全目的**。屬首次 deploy 前必須處理的 **🔴 build-hygiene BLOCKER**。

### 5.4 Remedy（已在 build 範圍內驗證；未改 src、未 auto-fix）

在 build 範圍內驗證：清空 git-ignored 且可完全重生的 `.cache/pages` 後重建：

```text
rm -rf .cache/pages   （git-ignored build cache；非 source）
npm run build
```

結果 —— `dist/posts/` 精確收斂為預期：

```text
dist/posts/
  index.html
  github-pages-build-preview-workflow/   ✅ published
  portable-blog-system-mvp/              ✅ ready（noindex；不進 sitemap，進 listing）
  what-is-design-token/                  ✅ ready
  we-media-myself2/                      ✅ 既有 blogger-cross mirror（§6）
```

prebuild log 明示 `filtered: .../github-pages-blog-planning.md (draft:true)` + `.../admin-ui-draft-generator-first-test.md (draft:true)` → **quarantine 在 prebuild 也生效**；orphan **純由 stale cache 造成**。清 cache 後 **無任何 orphan**（`github-pages-blog-planning` / `phase1-e2e-manual-test-1547` / `test-admin-ui-post` 全消失）。

→ **Remedy CONFIRMED**：deploy 前的 build 必須從乾淨 `.cache/pages` 產生（先清 cache 再 build），或未來由 `build-github.js` 於 prebuild 清理 `PAGES_DIR`（屬 `src/` 修改，須另開 phase）。

---

## 6. we-media-myself2 說明（非 scope 意外）

`dist/posts/we-media-myself2/` 與其 sitemap entry 為**既有** blogger-primary post 之 GitHub cross-source mirror（`content/blogger/posts/20260515-we-media-myself2.md`，`publishTargets.github.enabled = true`），**早已 live**（per commerce governance 紀錄）。不屬 C1 首次 deploy scope 決策（該決策只涵蓋 `content/github/posts/` 之 4 篇 native post）；build 納入它屬**預期既有行為**，非本輪新增風險。

---

## 7. 結論

- **validate:content**：✅ 0 error / 135 warning / 107 post。
- **prepublish smoke**：✅ 8/8 PASS。
- **prepublish guard**：✅ 16/16 PASS。
- **build**：✅ 成功。
- **dist 實際包含哪些文章（清 cache 後）**：`what-is-design-token`、`github-pages-build-preview-workflow`、`portable-blog-system-mvp`、`we-media-myself2`（既有 cross-source）。
- **listing / sitemap / feed / search index**：listing ✅ 符合；sitemap ✅ 符合（mvp noindex 正確不在、design-token/build-preview 在）；無 feed / 無 search index（第一版不做）。
- **是否確認 `github-pages-blog-planning` 沒有輸出**：
  - 資料層（listing/sitemap）：✅ 自始正確排除。
  - detail 頁層：⚠️ **首次未清 cache 的 build 會輸出 stale orphan 頁**；**清 `.cache/pages` 後 build → 完全無輸出** ✅。
- **🔴 Deploy 前置條件**：deploy 用的 dist **必須從乾淨 `.cache/pages` 產生**（先 `rm -rf .cache/pages` 再 `npm run build`），否則 quarantined + 已刪測試檔會以 orphan URL 上線。
- **本輪明確未做**：無 preview / deploy / gh-pages / deploy clone 寫入；未改 src；未 auto-fix build-github.js。

---

## 8. 下一步建議（不自動執行；各需 Dean 明確授權）

1. **（建議先做）決定 stale-cache remedy 路徑**：
   - **選項 A（最小、無改碼）**：deploy 前固定流程 = `rm -rf .cache/pages && npm run build`，確保乾淨 dist。
   - **選項 B（改碼、另開 phase）**：`build-github.js` prebuild 清理 `PAGES_DIR`（讓 `npm run build` 天生乾淨）；屬 `src/` 修改 + 需獨立 acceptance。
2. deploy readiness 之後續（preview → deploy）仍各需 Dean 明確授權；本 report **不代表放行**。
3. （可考慮）把此 build-hygiene gotcha 記入 memory（跨 session 提醒）—— 待 Dean 同意於 memory-sync phase 處理。

---

## 9. 本 phase 邊界（self-check）

- ✅ 唯一 git-tracked mutation：新增本 docs 檔 `docs/20260703-c1-g0-build-only-verification.md`。
- ✅ 未改 `src/` / `content/` / `content/settings/` / `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / `memory/`；未改任何文章 status。
- ✅ build 授權範圍內執行（含一次清 cache 重建以驗證 remedy）；`dist/` + `.cache/` git-ignored，未 stage / 未 commit。
- ✅ 未 preview / 未 deploy / 未寫 deploy clone / 未 push gh-pages；deploy clone 僅 read-only 驗證。
- ✅ 未改 Blogger / Google / GA4 / AdSense / Search Console；未 `npm install` / 動 dependency / lockfile。

---

## 10. Cross-links

- `docs/20260703-c1-f0-deploy-scope-recheck-after-quarantine.md`（C1-F0；本輪之預期基準）。
- `docs/20260703-c1-e0-publish-scope-quarantine-plan.md`（C1-E0）+ C1-E1 quarantine commit `94385b1`。
- `docs/github-deploy.md` §4（dist 產物表）+ §5（gh-pages 部署）。
- `docs/publish-workflow.md` §3（build 順序 + postbuild sitemap chain）。
- `src/scripts/build-github.js`（`PAGES_DIR` 無 cleanup）+ `src/scripts/build-sitemap.js` §3（sitemap inclusion）。

---

（本文件結束 / end of document）
