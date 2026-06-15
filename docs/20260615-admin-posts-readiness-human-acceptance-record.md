# BLOG ADMIN — Posts Readiness Fields 人眼瀏覽驗收紀錄

- **Phase**：`20260615-night-4-admin-posts-readiness-human-acceptance-record-docs-only-a`
- **日期**：2026-06-15（night-4，22:00）
- **性質**：docs-only acceptance record（人眼瀏覽驗收紀錄；**不**改 src / content / settings / templates / views / package / lockfile；**不** npm install / build / deploy / Blogger repost；**不**動 CLAUDE.md）
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis）
  - `docs/20260615-admin-ia-shell-implementation-record.md`（night-1 IA shell implementation）
  - `docs/20260615-admin-ia-shell-human-acceptance-record.md`（night-2 IA shell acceptance）
  - `docs/20260615-admin-posts-index-readonly-derived-fields-record.md`（night-3 posts readiness fields implementation）

---

## A. Baseline verify

```
branch        : main
working tree  : clean
HEAD          : 215ba07 == origin/main
last commit   : feat(admin): add posts readiness fields
```

`git log --oneline -3`：

```
215ba07 feat(admin): add posts readiness fields
deea42b docs(admin): record management shell acceptance
a34df7d feat(admin): implement management shell
```

→ baseline 完全符合預期；本 phase 自此基礎上做純 docs-only 驗收紀錄。

---

## B. 本 phase 目標

依 night-3 implementation（admin Posts 區塊延伸 5 組 read-only derived readiness 物件 + generation timestamp）之預期使用流程，**由 user 以人眼瀏覽方式驗收**：

- 確認 `npm run dev` 後 ADMIN 頁可正常開啟
- 確認 night-1 IA shell（dashboard / IA nav / system summary / read-only sections）仍正常可見
- 確認 night-3 新增之 Posts readiness / detail derived 欄位已可見且符合 read-only 定位
- 確認 validation / deferred 類資訊已誠實標示（不假裝完成）
- 確認**未**出現 Add / Edit / Delete / Publish / Save / Apply 等寫入按鈕
- 不在本 phase 補新功能；不在本 phase 改任何 source

明確邊界：

- ✅ 只做 docs-only 驗收紀錄
- ❌ **不**改 `src/` / `content/` / `content/settings/` / `src/views/` / `src/scripts/` / `package.json` / lockfile / `CLAUDE.md`
- ❌ **不** `npm install`
- ❌ **不** `npm run build` / `npm run build:blogger` / `npm run build:sitemap` / 任何 deploy
- ❌ **不**重貼 Blogger / 不動 AdSense / GA4 / commerce 後台
- ❌ **不**新增功能；ADMIN 仍維持 **read-only management shell** 狀態

---

## C. 人眼瀏覽驗收結果

由 user（操作者）於 2026-06-15 22:00 左右執行；過程未經 Claude 操作瀏覽器，僅 Claude 紀錄 user 提供之結果。

### C.1 ADMIN 頁可開啟

- ✅ `npm run dev` 啟動後，ADMIN 頁可由 `http://localhost:5173/admin/` 開啟
- ✅ Dashboard / IA nav / system summary / read-only sections 仍正常可見（night-1 IA shell 行為延續）
- ✅ Posts 區塊仍正常顯示，**沒有破版到不可用**

> 紀錄：production build 仍**不**輸出 admin（per night-1 §E．dev-mode-only / 不進 dist / 不 deploy / noindex），本驗收僅針對 dev mode 之本機檢視體驗。

### C.2 Posts 區塊 detail readiness 可見

User 展開單篇文章之 detail panel 後，肉眼確認以下 read-only readiness 區塊皆可見（per night-3 §C / §D.3）：

- ✅ **Content readiness** — title / slug / contentKind / status / draft / category / tagCount 等 frontmatter 衍生 badges
- ✅ **Navigation readiness** — template-level ready badge + eligibleForNav + perPostLiveVerified=no（明示）
- ✅ **GA4 readiness** — configEnabled / hasMeasurementId / measurementIdTail4（masked）/ eventsRegistered / surfaceIndexable / perPostEventReceived='unknown'（明示）
- ✅ **AdSense readiness** — configEnabled / hasClient（masked）/ postLevelEnabled / overrideSource / pagesBlockCount / bloggerBlockCount
- ✅ **Validation readiness（deferred）** — `warn def.` badge + `reason` 明示 admin loader 與 validator sourcePath 表示法不一致，per-post 計數延後到獨立 phase

### C.3 Read-only / deferred 誠實標示

User 確認：

- ✅ Validation per-post warning 計數**明確標示為 deferred**（per night-3 §C.5）；**未**假裝每篇 warning aggregation 已完成
- ✅ GA4 perPostEventReceived 明確標示為 `unknown`；admin 不打 GA4 API、不抓報表
- ✅ Navigation perPostLiveVerified 明確標示為 `false`；admin 不偽稱 GA4 點擊事件已 live verified
- ✅ AdSense readiness 明示為 build-time resolver 推導結果；live 廣告是否填充屬 AdSense 端，admin 不抓後台
- ✅ AdSense client / GA4 measurementId 皆只顯示 tail4 mask；real ID **未**洩入 rendered HTML / source（per night-3 §F.3）

### C.4 未誤導為 CMS 寫入

User 確認：

- ✅ **未**看到 Add / Edit / Delete / Publish / Save / Apply / Submit 等任何會誤導為 CMS 寫入的按鈕
- ✅ ADMIN 仍維持 **read-only management shell** 定位（與 night-2 acceptance 一致）

### C.5 驗收結論

User 確認：

> **本階段驗收結論：night-3 Posts readiness fields 可接受，仍維持 read-only admin dashboard 定位。**

具體達成之效益（符合 preanalysis §F 缺口欄位之 read-only derive 目標）：

1. **可從 ADMIN 直接看每篇文章之 GA4 / AdSense / nav / content readiness 摘要**，不需逐個查 frontmatter / settings
2. **未實作或無法 derive 之欄位皆明示為 deferred / unknown / false**，不放假數據
3. **AdSense / GA4 real ID 全程 masked**，read-only 不洩漏敏感欄位
4. **無任何寫入按鈕**，read-only 邊界清晰，不會被誤認為 CMS

---

## D. 本階段仍是 read-only admin dashboard（不是完整 CMS）

本紀錄**明確再次聲明**（延續 night-2 §D）：

### D.1 read-only 管理殼層之定位

- ADMIN 為「**系統狀態檢視入口**」，**不是**後台 CMS
- **不**在 ADMIN 內新增 / 編輯 / 刪除 / 發布文章
- **不**寫入 `content/` 或 `content/settings/`
- **不**觸發 build / deploy / Blogger repost
- 即使 user 驗收通過 night-3 readiness fields，**不**代表 ADMIN 已可作為完整後台使用

### D.2 仍未實作之功能（per night-3 §I §1–5 + preanalysis §H §3–8）

下列功能本 phase **仍未實作**；ADMIN 內以 `⏳ 未實作` / `deferred` / `unknown` 形式呈現：

| 類別 | 仍未實作 / 仍 deferred |
|---|---|
| 文章 | 新增 / 編輯 / 刪除 / 發布 / 重貼 Blogger |
| 文章 | published URL 一鍵回填 UI |
| Validation | per-post warning 計數聚合（仍 deferred；需獨立 preanalysis） |
| GA4 | per-post event received（不打 GA4 API；仍 `unknown`） |
| Navigation | per-post live verified（不抓 GA4 後台；仍 `false`） |
| 分類 / 標籤 | 用量計數 / 未使用偵測 / cross-site mismatch 紅綠燈 / 編輯 UI |
| Blogger | per-post copy-helper 一鍵打開 / repost readiness flag |
| GitHub Pages | 最後 build / deploy 時間 commit 顯示 / sitemap 預覽 / 一鍵 deploy |
| AdSense | live filled / unfilled / earning 後台 mirror |
| Settings | JSON 編輯 UI / schema 視覺化 / 欄位 picker |
| System checks | 最近一次結果 mirror / 一鍵觸發 |
| Write path（browser 直寫） | **不開放**；須獨立 middleware 安全 preanalysis |
| Write path（gated CLI for content） | 既有 `admin:write` 對 content dormant |

### D.3 寫入路徑紅線（延續 night-2 §D.3）

- ❌ 不在 ADMIN 內提供 browser-side 直接寫檔
- ❌ 不在 ADMIN 內提供 build / deploy 觸發按鈕
- ❌ 不在 ADMIN 內提供 Blogger repost 觸發
- ❌ 不在 ADMIN 內顯示真實 AdSense client / slot id（只顯示 tail4 遮罩）
- ❌ 不在 ADMIN 內顯示真實 GA4 measurementId（只顯示 tail4 遮罩）
- ❌ 不在 ADMIN 內出現 token / API key / OAuth secret / 帳號密碼 / Google Sheet response rows
- ❌ 不在 ADMIN 內顯示 commerce dashboard credentials / commission / payout 統計

→ **night-3 readiness fields 驗收通過 ≠ 開放寫入；≠ 進入第三階段 gated CLI write；≠ 可在 ADMIN 內觸發 build / deploy / repost。**

---

## E. 後續改善觀察（非本階段 blocker）

User 補充觀察：

- ⚠️ **Posts detail 資訊量偏高、畫面密度偏大**，但**不影響本階段驗收**
- 建議後續可另開 UI refinement phase，改善：
  - detail readability（標題層級 / 分隔線 / 空白）
  - collapse grouping（部分 sub-block 可預設收合）
  - summary badges（在 row 摘要 cell 之 readiness 提示可進一步壓縮）
- **此觀察不是 blocker，不要求本階段回頭修改 source**

→ 此項列為下一階段可選項（見 §I §3「UI refinement」分支），不在本 docs-only acceptance phase 內處理。

---

## F. 變更檔案（精確清單）

本 phase 屬 docs-only acceptance record：

```
docs/20260615-admin-posts-readiness-human-acceptance-record.md   — 本紀錄（新增）
```

**未動**：

- `src/`（任何 EJS / JS / SCSS / script；含 `src/views/admin/index.ejs` / `src/scripts/load-admin-posts.js`）
- `content/`（任何 .md / .json）
- `content/settings/`（任何 JSON；含 `ads.config.json` / `ga4.config.json` / `categories.json` / `tags.json` / `commerce-links.json`）
- `package.json` / lockfile（未 `npm install`）
- `CLAUDE.md`（不動，per phase 要求）
- 其他 docs/*.md
- `.cache/` / `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- Blogger live posts / GitHub Pages live deploy / GA4 / AdSense / commerce 後台

---

## G. Validation results

本 phase 屬 docs-only，無 source / settings / build / deploy 變更，**未跑** validation；採用 night-3 既有 baseline carry-forward：

```
npm run validate:content         → 0 error(s) / 94 warning(s) on 84 post(s)  ← carry-forward
check:adsense-resolver           → 34/0  carry-forward
check:adsense-article-block      → 13/0  carry-forward
check:adsense-anchor-wiring      → 14/0  carry-forward
check:blogger-adsense-output     → 85/0  carry-forward（6 target 全覆蓋）
```

本 phase 結束時之 git 驗證（在 commit 前）：

```
git diff --check    → 無錯誤
git status -sb      → 僅有 docs/20260615-admin-posts-readiness-human-acceptance-record.md untracked
```

---

## H. Explicit non-actions

- ❌ 未動 `src/`（任何 EJS template / loader / build script / SCSS / JS）
- ❌ 未動 `content/`（任何 .md / .publish.json / .fb.md / 任何 settings JSON）
- ❌ 未動 `content/settings/` 任一 JSON（含 `ads.config.json` / `ga4.config.json` / `categories.json` / `tags.json` / `commerce-links.json` / `affiliate-networks.json`）
- ❌ 未動 `package.json` / lockfile；未 `npm install`
- ❌ 未動 `CLAUDE.md`（per phase 要求）
- ❌ 未動 templates / views（含 `src/views/admin/index.ejs`）
- ❌ 未動 `src/scripts/load-admin-posts.js` / `resolve-adsense-blocks.js` / `validate-content.js` / `load-posts.js`
- ❌ 未動其他 docs/*.md（僅新增本紀錄一檔）
- ❌ 未跑 `npm run build` / `npm run build:blogger` / `npm run build:sitemap` / `npm run build:promotion`
- ❌ 未跑任何 `check:adsense-*` / `check:blogger-adsense-output`（無 source impact，採用 carry-forward）
- ❌ 未 deploy / 未 push gh-pages / 未動 `portable-blog-deploy` clone
- ❌ 未開 Blogger 後台 / 未重貼任何 Blogger 文章
- ❌ 未開 AdSense 後台 / 未動 ad 設定 / 未新增/hardcode real AdSense id
- ❌ 未動 GA4 後台 / 未動 measurementId / events / custom dimensions / 未打 GA4 API
- ❌ 未動 commerce-links registry / 未新增 affiliate entry / 未動 token / credential 紅線
- ❌ 未動 slug / permalink / category / tags 資料
- ❌ 未壓縮 / 重排 CLAUDE.md
- ❌ 未啟用 browser write / middleware / Apply button / gated CLI for content
- ❌ 未在 ADMIN 內新增任何 Apply / Save / Submit / Edit / Publish / Delete / Add 互動
- ❌ 未針對「Posts detail 資訊量偏高」此觀察回頭改 source（per phase 要求，列為後續可選 UI refinement phase）
- ❌ 未把 read-only acceptance 視為對 ADMIN 寫入路徑之解鎖訊號
- ❌ 未把 read-only acceptance 視為 deploy / Blogger repost gate 解除
- ❌ 未把 Blogger VIEW count 增加判定為真實流量或 AdSense 成效（既有紅線維持）

→ 唯一 mutation = 本紀錄 doc 自身。

---

## I. Next recommended phase

依本 phase 之驗收結果與 user 補充觀察，下一階段建議：

### 保守路線（推薦預設）

1. **`20260615-night-final-idle-freeze-after-admin-posts-acceptance-no-op-a`** —
   收工 idle freeze；不再於本日推進；等 user 隔日決定下一個功能路線。

### 下一個功能路線（等 user 確認後再做）

2. **`20260616-admin-categories-readonly-usage-counts-a`** —
   接續 night-1 §I §3 / night-3 §I §2：Categories / Tags 用量計數（per post category↔post 反向索引）+ cross-site mismatch 紅綠燈（per validate-content 之 `category-site-mismatch` / `tag-site-mismatch` rule）。仍 read-only derived。

3. **`20260616-admin-posts-detail-readability-refinement-a`** —
   回應本 phase §E 之觀察：改善 Posts detail readability（標題層級 / 分隔線 / 空白）/ collapse grouping（部分 sub-block 預設收合）/ summary badges（row cell 進一步壓縮）。仍 read-only；不動 readiness derive 邏輯。

### 仍按既定主線之候選（不在本日推進）

4. **`20260615-XX-admin-validation-per-post-aggregation-preanalysis-a`** —
   docs-only preanalysis：探討 admin loader / validator sourcePath 對齊或 per-post API 設計；不改 validator。
5. **`20260615-XX-admin-post-detail-readonly-expand-a`** —
   detail panel 擴充 commerce ref / book metadata / download ref / prev / next slug 預覽。
6. **`20260615-XX-admin-build-deploy-readonly-status-a`** —
   接 `report:build` / git log，read-only 顯示最後 build / deploy 狀態。
7. **（最後）write path** —
   仍按 preanalysis §E 分階段紅線：read-only → copy-helper / dry-run → gated CLI write → middleware（須獨立安全 preanalysis）。**不跳階。**

---

（本紀錄結束）
