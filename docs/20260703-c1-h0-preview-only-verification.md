# C1-H0 Preview-Only Verification Before First Deploy（docs report）

- **Phase name**：`20260703-j-c1-h0-preview-only-verification-docs-only`
- **Date**：2026-07-03（Asia/Taipei；接續 `20260703-I` / C1-G1 stale-cache fix）
- **Type**：**build + preview-only 驗證**（本輪授權 build + preview）。**不** deploy、**不**寫 deploy clone、**不** push gh-pages、**不**改 `content/` / `src/` / `content/settings/` / `CLAUDE.md`、**不**改 Blogger / GA4 / AdSense / Search Console、**不** `npm install` / dependency / lockfile。唯一 git mutation = 新增本 docs 檔（`dist/` + `.cache/` git-ignored，不 stage）。

---

## 0. Critical disclaimers

1. **本輪只 build + 本機 preview，不 deploy / 不碰 gh-pages / 不寫 deploy clone。**
2. preview server（`vite preview`）綁 `127.0.0.1:4185`、僅本機、驗證後**已關閉**。
3. deploy clone 僅 read-only fetch/rev-parse 驗證 baseline，未觸碰。

---

## 1. Session-start baseline（2026-07-03, Asia/Taipei）

```text
source: /d/github/blog-new/portable-blog-system
branch: main · HEAD = origin/main = 4e21b439daf1980d566deb4ce15e087873aecea8
short: 4e21b43 · subject: fix(build): clear stale github pages cache before build
ahead/behind: 0/0 · working tree clean · .git/index.lock absent

deploy clone: /d/github/blog-new/portable-blog-deploy（read-only）
gh-pages = origin/gh-pages = d0f37eb · clean · index.lock absent · 未觸碰
```

Baseline **matched** on entry。

---

## 2. Pre-preview gate（全通過）

| 指令 | 結果 |
|---|---|
| `npm run validate:content` | ✅ 0 error / 135 warning / 107 post |
| `npm run check:github-pages-prepublish-smoke` | ✅ 8/8 PASS |
| `npm run check:github-pages-prepublish` | ✅ 16/16 PASS |
| `npm run check:github-build-cache-hygiene` | ✅ 2/2 PASS |
| `npm run build` | ✅ 成功（sitemap 17 url entries） |

---

## 3. dist scope 檢查（build 後）

`dist/posts/`：

| 期望 | 項目 | 結果 |
|---|---|---|
| present | `what-is-design-token` | ✅ |
| present | `github-pages-build-preview-workflow` | ✅ |
| present | `portable-blog-system-mvp` | ✅ |
| present（既有 blogger-cross mirror） | `we-media-myself2` | ✅（非 GitHub scope regression） |
| absent | `github-pages-blog-planning`（quarantined） | ✅ |
| absent | `admin-ui-draft-generator-first-test`（draft） | ✅ |
| absent | `phase1-e2e-manual-test-1547`（stale） | ✅ |
| absent | `test-admin-ui-post`（stale） | ✅ |
| absent | `__stale-cache-canary__` | ✅ |

root artifacts 齊全：`index.html` / `posts/` / `categories/` / `tags/` / `404.html` / `sitemap.xml` / `robots.txt` / `assets/`。→ 符合 C1-G1 結果。

---

## 4. Preview 檢查（`http://127.0.0.1:4185`，vite preview）

### 4.1 HTTP 狀態

**應 200（present）**：

| 頁 | 狀態 |
|---|---|
| `/`（首頁） | ✅ 200 |
| `/posts/`（posts index） | ✅ 200 |
| `/posts/what-is-design-token/` | ✅ 200 |
| `/posts/github-pages-build-preview-workflow/` | ✅ 200 |
| `/posts/portable-blog-system-mvp/` | ✅ 200 |
| `/sitemap.xml` | ✅ 200 |
| `/robots.txt` | ✅ 200 |
| `/categories/` · `/tags/` · `/404.html` | ✅ 200 |

**應 404（quarantined / draft / stale 不存在）**：

| 頁 | 狀態 |
|---|---|
| `/posts/github-pages-blog-planning/` | ✅ 404 |
| `/posts/admin-ui-draft-generator-first-test/` | ✅ 404 |
| `/posts/phase1-e2e-manual-test-1547/` | ✅ 404 |
| `/posts/__stale-cache-canary__/` | ✅ 404 |

### 4.2 Asset path（無明顯 404）

- 首頁 asset ref = `./assets/entry-*.css` / `./assets/entry-*.js`（relative base `./`）→ 皆 **200**。
- design-token detail asset ref = `../../assets/entry-*.css` / `.js`（深層相對路徑）→ 解析至 `/assets/*` 皆 **200**。
- → base `./`（relative）在各 URL 深度皆正確解析，**無 asset 404**。

### 4.3 Canonical / base path（GitHub Pages project-site）

- design-token detail `<link rel="canonical">` + `<meta property="og:url">` = `https://babel-lab.github.io/portable-blog-system/posts/what-is-design-token/` → ✅ 正確 project-site subpath 絕對 URL。
- `robots.txt` `Sitemap:` = `https://babel-lab.github.io/portable-blog-system/sitemap.xml` + `Disallow: /design-system/` + `Disallow: /404.html` → ✅。
- sitemap post entries（preview）= `posts/what-is-design-token/` ✅ / `posts/github-pages-build-preview-workflow/` ✅ / `posts/we-media-myself2/`；`portable-blog-system-mvp` noindex **正確不在** sitemap；quarantined / draft / stale / canary 皆不在（bad-matches = 0）✅。

---

## 5. 問題彙總

- **404 問題**：無（asset 全 200；quarantined/draft/stale 頁之 404 為預期正確行為）。
- **asset 問題**：無（relative base 各深度解析正確）。
- **canonical / base path 問題**：無（皆指向 project-site subpath）。

---

## 6. 結論

- pre-preview gate（validate / prepublish smoke / prepublish guard / build-cache hygiene / build）全通過。
- dist scope = 乾淨 3 篇（design-token / build-preview-workflow / portable-blog-system-mvp）+ we-media（既有 cross-source），無任何 quarantined / draft / stale / canary orphan。
- 本機 preview 全頁 HTTP 正常：present 頁 200、absent 頁 404、asset 無 404、canonical / robots / sitemap 皆符合 GitHub Pages project-site 預期。
- **build hygiene fix（C1-G1）在 preview 端驗證有效**：quarantined + stale 頁確實不存在於實際渲染輸出。
- **本輪明確未做**：無 deploy / 無 gh-pages / 無 deploy clone 寫入；preview server 已關閉。

---

## 7. 下一步（不自動執行；需 Dean 明確授權）

第一次 deploy 的 build 面與 preview 面皆已 verified clean。剩餘僅 **deploy 授權決策**：

1. Dean 明確授權 deploy → 依 `docs/github-deploy.md` §5.4：先確認 deploy clone 狀態 → `rm -rf ./*` → `cp -r ../portable-blog-system/dist/*` → `touch .nojekyll` → commit → push gh-pages。
2. 上線後驗證：`docs/github-deploy.md` §7 + `docs/checklists/github-deploy-checklist.md`。

⚠️ 本 report **不代表 deploy 放行**；Claude 不自動 deploy / 不碰 gh-pages。

---

## 8. 本 phase 邊界（self-check）

- ✅ 唯一 git-tracked mutation：新增本 docs 檔。
- ✅ 未改 `src/` / `content/` / `content/settings/` / `package.json` / lockfile / `CLAUDE.md` / `MEMORY.md` / `memory/`。
- ✅ build + preview 授權範圍內；`dist/` + `.cache/` git-ignored，未 stage / 未 commit。
- ✅ preview server 綁 127.0.0.1、驗證後已關閉。
- ✅ 未 deploy / 未寫 deploy clone / 未 push gh-pages；deploy clone 僅 read-only 驗證。
- ✅ 未改 Blogger / Google / GA4 / AdSense / Search Console；未 `npm install` / 動 dependency / lockfile。

---

## 9. Cross-links

- `docs/20260703-c1-g1-fix-stale-page-cache.md`（C1-G1 fix）+ `docs/20260703-c1-g0-build-only-verification.md`（C1-G0 blocker）。
- `docs/20260703-c1-f0-deploy-scope-recheck-after-quarantine.md`（C1-F0 scope）。
- `docs/github-deploy.md` §5–§7（deploy runbook + 上線後驗證）。
- `vite.config.js`（base `./` relative；glob rollup input）。

---

（本文件結束 / end of document）
