# C1-G1 Fix Stale Page Cache Before Deploy（docs report）

- **Phase name**：`20260703-i-c1-g1-fix-stale-github-pages-cache`
- **Date**：2026-07-03（Asia/Taipei；接續 `20260703-H` / C1-G0 build-only verification）
- **Type**：**最小 source 修復**（build cache hygiene）+ 回歸 smoke guard + docs。**不** preview、**不** deploy、**不**碰 gh-pages、**不**寫 deploy clone、**不**改 `content/` / `content/settings/` / `CLAUDE.md`、**不** `npm install` / dependency / lockfile。

---

## 1. Blocker（C1-G0 發現）

vite `emptyOutDir` 清 `dist/` 但**不清** `.cache/pages`；`vite.config.js` 以 glob `**/*.html` 掃 `.cache/pages` 當 rollup input。`build-github.js` 過去只**增量寫入** `.cache/pages`、**從不清舊檔** → draft / quarantined / deleted post 的 stale `.cache/pages/posts/<slug>/` 殘留，被 vite 複製進 `dist/` 成 **orphan URL**（不被 listing/sitemap 連結，但 URL 可達）。若照此 deploy 會使 quarantine 在 detail 頁層失效。

---

## 2. Fix

`src/scripts/build-github.js` `main()`：把原本只清 `.cache/pages/admin/` 的 cleanup（Phase Admin-1-b）**一般化為整棵 `PAGES_DIR` 清除**，於寫入任何 page 之前執行：

```js
await fs.rm(PAGES_DIR, { recursive: true, force: true }).catch(() => {});
```

**安全性**：`PAGES_DIR`（`.cache/pages`）下全部內容皆由同一 `main()` run 重新產生（posts / categories / tags / design-system / admin(dev) / _assets / index / 404）；`DATA_DIR`（`.cache/data`）為其 sibling、不受影響；`dev`（`vite --host`）serve 時不經 plugin 重跑 build-github（無 serve-time race）。此修復同時涵蓋原 admin-only 清除與 categories / tags 之同類 stale slug 目錄。

---

## 3. 回歸 guard（防 fix 被誤刪）

新增 `src/scripts/check-github-build-cache-hygiene.js`（純 source-level 靜態斷言；不 build / 不寫檔）+ npm script `check:github-build-cache-hygiene`：

1. `build-github.js` 含整棵 `fs.rm(PAGES_DIR, { recursive: true, force: true })` 清除。
2. 該清除出現在第一個 `writeText(path.join(PAGES_DIR, ...))` page 寫入之前。

→ **2/2 PASS**。

---

## 4. 驗證

**canary + 已知 orphan 植入** `.cache/pages/posts/`（`__stale-cache-canary__` / `github-pages-blog-planning` / `phase1-e2e-manual-test-1547`）後：

| 檢查 | 結果 |
|---|---|
| `npm run validate:content` | ✅ 0 error / 135 warning / 107 post |
| `npm run check:github-pages-prepublish-smoke` | ✅ 8/8 PASS |
| `npm run check:github-pages-prepublish` | ✅ 16/16 PASS（commit + push 後乾淨同步工作區） |
| `npm run check:github-build-cache-hygiene` | ✅ 2/2 PASS |
| `npm run build` | ✅ 成功（sitemap 17 url entries） |

**build 後 `dist/posts/`**（stale 全清）：

```text
dist/posts/
  index.html
  github-pages-build-preview-workflow/   ✅ 預期（published）
  portable-blog-system-mvp/              ✅ 預期（ready；noindex）
  what-is-design-token/                  ✅ 預期（ready）
  we-media-myself2/                      ✅ 既有 blogger-cross mirror（非 GitHub scope regression）
```

逐項斷言：`__stale-cache-canary__` / `github-pages-blog-planning` / `admin-ui-draft-generator-first-test` / `phase1-e2e-manual-test-1547` / `test-admin-ui-post` **全部 absent** ✅；預期 3 篇 present ✅。

**sitemap / listing**（仍符合 C1-G0）：sitemap posts = `what-is-design-token` ✅ / `github-pages-build-preview-workflow` ✅ / `we-media-myself2`；`portable-blog-system-mvp` noindex 正確不在 sitemap、但在 listing（=1）✅；canary / quarantined / stale 全不在 sitemap / listing ✅。

---

## 5. 修改檔案

| 檔案 | 變更 |
|---|---|
| `src/scripts/build-github.js` | admin-only cleanup → 整棵 `PAGES_DIR` cleanup（+ 註解） |
| `src/scripts/check-github-build-cache-hygiene.js` | **新增** 回歸 guard |
| `package.json` | 新增 npm script `check:github-build-cache-hygiene`（非 dependency / 非 lockfile 變更） |
| `docs/20260703-c1-g1-fix-stale-page-cache.md` | 本報告 |

`.cache/` 與 `dist/` 為 git-ignored build artifact，未 stage / 未 commit。

---

## 6. 本輪未做 / 下一步

- 未 preview / 未 deploy / 未碰 gh-pages / 未寫 deploy clone；deploy clone 僅 read-only 驗證。
- **下一步（各需 Dean 明確授權）**：deploy readiness → preview → deploy（push gh-pages）。deploy 用的 dist 現在由乾淨 `.cache/pages` 產生，orphan 風險已於 build pipeline 根除（不再需要手動 `rm -rf .cache/pages`）。

---

## 7. Cross-links

- `docs/20260703-c1-g0-build-only-verification.md`（C1-G0；blocker 發現與 remedy 驗證）。
- `docs/20260703-c1-f0-deploy-scope-recheck-after-quarantine.md`（C1-F0）+ C1-E1 quarantine `94385b1`。
- `src/scripts/build-github.js`（`PAGES_DIR` cleanup）+ `vite.config.js`（glob `**/*.html` rollup input）。

---

（本文件結束 / end of document）
