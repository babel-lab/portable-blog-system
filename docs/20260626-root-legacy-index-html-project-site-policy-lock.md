# Root Legacy `index.html` / Project-Site Build-Deploy Policy Lock（Q5 Option B）

> 文件名稱：**Root Legacy index.html Project-Site Policy Lock**
> 日期：**2026-06-26**
> 對象專案：`D:\github\blog-new\portable-blog-system`（portable-blog-system，第一版 MVP）
> 性質：**docs-only policy lock**。本文件只鎖定 root legacy `index.html` 與 project-site build/deploy policy 的「目前事實」與「未來重啟條件」，**不刪檔、不改 source、不 build、不 deploy**。
> 對應決策：上一階段 read-only preflight 之 **Q5 root legacy `index.html` → Option B（docs-only lock）**。

---

## 1. Baseline（lock 撰寫前）

| 項目 | 狀態 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `3e8cef7`（`feat(nav): add tags navigation link`） |
| working tree | clean |
| origin/main | synced（ahead/behind 0/0） |
| `.git/index.lock` | absent |

---

## 2. Purpose

本文件只做一件事：**把 root legacy `index.html` 與 project-site build/deploy policy 的現況鎖成文字紀錄。**

明確界定：

- **不刪檔**：本階段不對 root `index.html` 做 `git rm`。
- **不改 source**：不碰 `src/`、`vite.config.js`、`build-github.js` 或任何 build/deploy script。
- **不 build / 不 deploy / 不 dev server**。
- **不代表 live site 有問題**：本 lock 是 repo hygiene 記錄，不是 incident，不是 live blocking issue。

---

## 3. Current root `index.html` state（read-only preflight 結論）

| 屬性 | 結論 |
| --- | --- |
| 路徑 | repo root `index.html` |
| Git tracked | ✅ **YES**（tracked file） |
| disk 狀態 | 存在，5090 bytes，mtime 2026-05-04 |
| 最後修改 commit | `0bf59cc`「初始化專案 — Phase 0–3 完成版」（**自初始化後從未再被修改**） |
| 內容性質 | **Phase 0 stale skeleton / placeholder** |
| 內容具體特徵 | 含未渲染的 `<%= siteName %>`、`Phase 0 初始化骨架` 字樣、`alert()` placeholder、寫死的範例文章卡片、nav 指向 `#latest` / `#categories` / `#design-system`（與目前實際站台結構不符） |
| 是否 source 生成 | ❌ **不是**。沒有任何 script 產生 root `index.html`；它是手寫靜態檔 |
| 是否目前首頁 source of truth | ❌ **不是**。實際首頁見 §4 |

**結論**：root `index.html` 是 Phase 0 遺留的 orphan 靜態檔，雖被 Git tracked，但**不是**目前首頁的 source of truth。

---

## 4. Current build/deploy policy（現況記錄）

| 項目 | 事實 | 證據位置 |
| --- | --- | --- |
| Vite root | `.cache/pages`（**不是** project root） | `vite.config.js`：`root: PAGES_ROOT`，`PAGES_ROOT = .cache/pages` |
| GitHub 首頁產生 | `build-github.js` 寫到 `.cache/pages/index.html` | `build-github.js:622` `writeText(PAGES_DIR/'index.html', homeHtml)` |
| Vite build input | glob `.cache/pages/**/*.html` | `vite.config.js`：`fg('**/*.html', { cwd: PAGES_ROOT })` |
| Vite build output | `dist/index.html`（及其餘 pages） | `vite.config.js`：`build.outDir = dist/` |
| deploy source | `dist/`（clone `portable-blog-deploy` → sync `dist/` → push `gh-pages`） | commerce governance ledger / deploy 流程 |
| root `index.html` 是否進 build input | ❌ **不進**（build input 只來自 `.cache/pages`） | 同上 |
| root `index.html` 是否進 deploy output | ❌ **不進**（deploy 來源是 `dist/`，與 root 檔零交集） | 同上 |
| `.cache/` 狀態 | generated / `.gitignore` ignored | `.gitignore`：`.cache/` |
| `dist/` 狀態 | generated / `.gitignore` ignored | `.gitignore`：`dist/*` |
| project-site base | build base = `./`（relative），適配 project-site `/portable-blog-system/` | `vite.config.js`：`base = command === 'serve' ? '/' : './'` |

**結論**：build/deploy pipeline 的首頁來源鏈是 `build-github.js → .cache/pages/index.html → vite build → dist/index.html → gh-pages`。root `index.html` **完全不在這條鏈上**。

---

## 5. Live risk assessment

明確記錄目前風險判定：

- ✅ root `index.html` **目前不是 live blocking issue**。
- ✅ **不**造成 project-site duplicate homepage（它不上線）。
- ✅ **不**影響 canonical。
- ✅ **不**影響 sitemap（`build:sitemap` 從 content / generated pages 產，不含 root 檔）。
- ✅ **不**影響 robots.txt。
- ✅ **不**影響 Blogger。
- ✅ **不**影響 footer disclosure。
- ✅ **不**影響 `/tags/` nav。

**目前定性 = housekeeping / repo hygiene issue**，非 live incident。

---

## 6. Future risk / why it still matters

雖然目前不上線，仍保留為待辦的理由：

- ⚠️ **誤導風險**：未來維護者看到 repo root 有 tracked `index.html`，可能誤以為它是首頁 source of truth。
- ⚠️ **config 回退風險**：若未來有人把 Vite `root` 改回 project root，build input 可能誤撈這份 stale skeleton（含未渲染 `<%= siteName %>`）。
- ⚠️ **deploy pipeline 改寫風險**：若未來 deploy 來源從 `dist/` 改變（例如改成 push 整個 repo root），可能誤把 root `index.html` 帶上線。
- ⚠️ **new-domain 切換風險**：若未來從 project-site `/portable-blog-system/` 切換到 root-domain / custom-domain，需重新確認 root vs domain homepage policy；屆時 root `index.html` 的處理需重新評估。

---

## 7. Decision（本階段鎖定）

現階段決策鎖定如下：

- 🔒 **不刪** root `index.html`。
- 🔒 **不改** build/deploy。
- 🔒 **不做** redirect/canonical handling。
- 🔒 **不做** new-domain policy。
- 🔒 Q5 暫定為 **docs-locked housekeeping item**，待 Dean 後續指示才重新打開。

---

## 8. Future cleanup options（僅列出，不執行）

> 以下皆為**未來選項**，每項都須獨立 phase + Dean explicit approval 才執行；本文件不執行任何一項。

### Option A：繼續保留 + 維持 policy lock

- **會碰的檔案**：無（純維持現狀）。
- **風險**：0；唯一負債 = 留一個誤導性 tracked orphan。
- **驗證方式**：無需驗證（不變更）。
- **rollback / stop 條件**：不適用。

### Option B：`git rm index.html`

- **會碰的檔案**：root `index.html`（單一檔，刪除）。
- **風險**：低。Vite root 已是 `.cache/pages`，root 檔不參與 build/dev，移除對 dev/build 行為無影響（preflight 已驗證 root 不參與 input）。
- **驗證方式**：移除後 `npm run dev` + `npm run build` 行為不變、`dist/index.html` byte-identical、`git status` clean。
- **rollback / stop 條件**：若 build/dev 出現任何 `index.html` not found 或首頁異常 → `git restore index.html`，STOP，回報。

### Option C：`git mv index.html docs/legacy/`

- **會碰的檔案**：root `index.html` → `docs/legacy/index.html`（移動）。
- **風險**：低，與 Option B 同；額外保留檔案以供歷史參考。需確認沒有任何相對路徑引用 root `index.html`（preflight 已確認無 source 引用）。
- **驗證方式**：同 Option B；另確認 `docs/legacy/` 不被 build input glob 撈取（build input 限 `.cache/pages`，docs/ 不在範圍）。
- **rollback / stop 條件**：若出現任何引用斷裂 → `git mv` 還原，STOP，回報。

### Option D：future new-domain / root-domain phase 重新處理

- **會碰的檔案**：視屆時 domain 規劃而定（可能含 `vite.config.js` base、deploy script、canonical helper、redirect 規則、root homepage source）。
- **風險**：中高，牽涉 canonical / sitemap / robots / redirect 全套 policy；須完整 phase 設計。
- **驗證方式**：屆時另立 acceptance（live canonical 指向新 domain、無 duplicate homepage、redirect 正確）。
- **rollback / stop 條件**：屆時另定；與 Q5 housekeeping 為獨立議題，不應混入本 lock。

---

## 9. Cleanup trigger conditions（何時重新打開 Q5）

下列任一情況發生時，應重新打開 Q5 評估：

1. Vite `root` / build input 設定改變（例如 root 改回 project root）。
2. deploy source 從 `dist/` 改變。
3. GitHub Pages 從 project-site `/portable-blog-system/` 轉為 root-domain / custom-domain。
4. root `index.html` 開始出現在 build / deploy output。
5. 有人打算刪除或移動 root `index.html`。
6. live site 出現 stale homepage / canonical / sitemap / robots 異常。

在上述條件均未發生前，Q5 維持 docs-locked，不主動推進。

---

## 10. No-touch scope（本階段全程不碰）

- root `index.html`
- source / content / settings / `package.json`
- lockfile（`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`）
- `dist/` / `gh-pages/` / `.cache/` / generated HTML
- `CLAUDE.md` / `MEMORY.md`
- Blogger / Google / GA4 / Admin / LearnOops
- funnel renderer / gatedDownload / downloadFunnel
- footer disclosure
- `/tags/` nav

本階段**唯一**允許的修改 = 新增本 docs 檔。

---

## 11. Verification plan（本 docs-only 階段）

僅允許下列 read-only / docs-diff 指令：

- `git status --short`
- `git status -sb`
- `git diff -- docs/20260626-root-legacy-index-html-project-site-policy-lock.md`
- `git diff --check`
- `git diff --stat`

**不跑**：build / deploy / dev server / 任何 Blogger / Google / GA4 / Admin backend 動作。

---

## 12. Final status（待 commit 時填寫）

若只新增本 docs-only 文件、且 diff 無異常（無 whitespace error、無夾帶其他檔）：

- 允許 commit / push。
- commit message：`docs(policy): lock root legacy index handling`。
- commit 前後皆回報：changed files / `git diff --stat` / `git status --short` / `git status -sb` / `git log -1 --oneline` / 與 origin/main 關係 / ahead-behind / index.lock。
- push 後 final read-only freeze：working tree clean / HEAD = origin/main / ahead-behind 0/0 / no index.lock。
- 最後 STOP，等待 Dean 下一步指示。
