# 2026-07-12 · download-indexing guard → check:metadata-all umbrella integration（gap closure）

## 0. Scope / boundary（binding）

- 類型：**package.json 二 script 修改 + 新增 metadata-all contract guard + phase ledger doc**。唯一 mutation：
  1. `package.json` 之 `check:metadata-all` 尾端加入 `&& npm run check:download-indexing-independence`，並在其前端加入 `npm run check:metadata-all-contract &&`（與 release-readiness / phase1-readiness 之 contract-first pattern 一致）。
  2. `package.json` 新增 npm script `check:metadata-all-contract` → `node src/scripts/check-metadata-all-contract.js`。
  3. 新增 `src/scripts/check-metadata-all-contract.js`（新 file；純讀 package.json 靜態斷言 guard；mirror `check-release-readiness-contract.js` / `check-phase1-readiness-contract.js` 慣例）。
  4. 新增本 doc。
- **不**改：guard 本體（`check-download-indexing-independence.js`）／resolver（`page-type-robots.js` / `include-in-listings.js` / `include-in-sitemap.js`）／validator（`validate-content.js`）／schema／content／frontmatter／sidecar／template / EJS / SCSS / JS／build／deploy／deploy clone／Blogger／GA4／AdSense／Search Console／custom domain／`check:phase1-readiness` script／`check:phase1-readiness-contract.js`／`check:release-readiness` script／`check:release-readiness-contract.js`。
- 前置 baseline：source HEAD = origin/main = `2d1b4622ec5d1065615713259015dac0a536a14f`（subject `chore(checks): integrate download indexing guard`；上一 phase = `docs/20260712-download-indexing-guard-phase1-umbrella-integration.md`），branch main，clean，0/0，`.git/index.lock` absent。deploy clone = `1170e7e`（未動）。
- baseline verify（本 phase 開頭執行）：`pwd` = `/d/github/blog-new/portable-blog-system`；`git branch --show-current` = `main`；`git rev-parse HEAD` = `2d1b4622ec5d1065615713259015dac0a536a14f`；`git rev-parse origin/main` = 同上；`git status --short` = empty；`git rev-list --left-right --count origin/main...main` = `0	0`；index.lock = `NO_INDEX_LOCK`。→ baseline 完全一致。

## 1. 動機（Dean 指示）

上一 phase `docs/20260712-download-indexing-guard-phase1-umbrella-integration.md` §3 documented 一個 **known gap**：

> Trade-off / 已知 gap：
> - `check:metadata-all` 直接執行時**不會**跑到本 guard。
> - `check:release-readiness` 執行時（其呼叫 metadata-all，metadata-all 內不含本 guard）**不會**跑到本 guard。
> - 若 Dean 日後想讓 metadata-all 與 release-readiness 也覆蓋本 guard，需另開獨立 phase 處理。

Dean 於 2026-07-12 14:08（Asia/Taipei）明確授權開啟本獨立 phase，目的 = **closing the metadata-all / release-readiness coverage gap**。

Dean 之 binding（本 phase 精確 scope）：

> 將 `check:download-indexing-independence` 加入 `check:metadata-all`，使 `check:metadata-all` 與既有會呼叫它的 `check:release-readiness` 都能自動執行該 guard；保留目前 `check:phase1-readiness` 的直接 integration。

三條入口之硬約束：每次呼叫時 guard 執行次數 = **exactly 1**（不多不少）。

## 2. 修改前 umbrella 呼叫鏈（after 前一 phase）

```
check:metadata-guards       = 5 single-field guards
check:metadata-cross-fields = 3 cross-field guards
check:metadata-all          = metadata-guards && metadata-cross-fields        ← 【本 phase 目標入口】

check:release-readiness
  → check:release-readiness-contract
  → check:github-pages-prepublish
  → check:github-pages-prepublish-smoke
  → check:metadata-all                                                         ← 內含 metadata-guards + cross-fields
  → validate:content

check:phase1-readiness
  → validate:content
  → check:npm-script-targets
  → check:adsense-mode-metadata
  → check:blogger-backfill
  → check:download-indexing-independence   ← 【前 phase direct integration；本 phase 保留】
  → check:github-pages-prepublish
  → check:github-pages-prepublish-smoke
```

## 3. 修改後 umbrella 呼叫鏈

```
check:metadata-all
  → check:metadata-all-contract                    ← 新增（contract-first pattern）
  → check:metadata-guards
  → check:metadata-cross-fields
  → check:download-indexing-independence           ← 【本 phase 新增】

check:release-readiness
  → check:release-readiness-contract
  → check:github-pages-prepublish
  → check:github-pages-prepublish-smoke
  → check:metadata-all
     → check:metadata-all-contract
     → check:metadata-guards
     → check:metadata-cross-fields
     → check:download-indexing-independence        ← 【間接覆蓋，本 phase 完成】
  → validate:content

check:phase1-readiness                              ← **未動**
  → validate:content
  → check:npm-script-targets
  → check:adsense-mode-metadata
  → check:blogger-backfill
  → check:download-indexing-independence           ← 【direct integration 維持】
  → check:github-pages-prepublish
  → check:github-pages-prepublish-smoke
```

## 4. Integration 決策

### 4.1 為何加入 `check:metadata-all`（而非 `check:release-readiness` 直接）

- `check:release-readiness` 已透過 `check:metadata-all` 承接子檢查。加在 metadata-all 內，release-readiness 自動獲得 coverage，**不需修改 release-readiness script 本身**。
- 若同時直接加入 release-readiness，同一條 release chain 會執行 guard 兩次（一次來自 metadata-all、一次來自 release-readiness 直接），違反 Dean 之「單條 chain 只執行一次」硬約束。
- 語意層面：`check:metadata-all` 已聚合所有 metadata / cross-field invariant checks，`check:download-indexing-independence` 屬 cross-resolver invariant guard（同樣是「非破壞式的公理型檢查」），歸屬 metadata-all 最為自然。

### 4.2 為何保留 Phase 1 direct integration

- `check:phase1-readiness` 不呼叫 `check:metadata-all`（前 phase §2 已確認為平行鏈）。
- 若將 phase1 改為呼叫 metadata-all，將改變 Phase 1 readiness 的執行內容（會多跑 5 個 metadata guards + 3 cross-field guards + metadata-all-contract），屬 umbrella 架構改寫，超出本 phase 「最小切片」scope。
- Direct integration 保留 = Phase 1 執行時仍精準跑本 guard 一次；不因 metadata-all 未包含在 phase1 而遺漏。

### 4.3 為何在 metadata-all 前端加 `check:metadata-all-contract`

- Mirror `check:release-readiness` 與 `check:phase1-readiness` 之 contract-first pattern：contract 先跑，static assertion 先 fail 才不浪費後續執行時間。
- 保護新 coverage：若未來有人誤刪 `check:download-indexing-independence` from `check:metadata-all`，metadata-all-contract 會 fail（REQUIRED_FRAGMENTS + ORDERED_FRAGMENTS 均含之），release-readiness 也會 fail-fast。
- 對稱：`check:release-readiness` 有 `release-readiness-contract`；`check:phase1-readiness` 有 `phase1-readiness-contract`；此後 `check:metadata-all` 有 `metadata-all-contract`。

### 4.4 為何不修改 `check:release-readiness-contract`

- `check:release-readiness-contract` 之 REQUIRED_FRAGMENTS / ORDERED_FRAGMENTS / FORBIDDEN_TOKENS 均以 `npm run check:metadata-all` 為 unit 引用；**不**深入 metadata-all 內部。
- metadata-all 內部組成改變不影響 release-readiness 契約合約 —— release-readiness 契約要求仍為「呼叫 metadata-all」，該事實維持不變。
- 本 phase 遵守 task binding「若某一 contract 不受影響，不要為了湊檔案而修改」。
- 額外驗證：`npm run check:release-readiness-contract` post-mutation 為 14/14 PASS（未改 contract 檔，數字理應不動）。

### 4.5 為何不修改 `check:phase1-readiness-contract`

- Phase 1 direct integration 保留，`check:phase1-readiness` 之 REQUIRED_FRAGMENTS 已於前 phase 加入 `npm run check:download-indexing-independence`（位置 5，contract 23/23 PASS）。
- 本 phase 不動 phase1 umbrella，contract 無需更新。

## 5. 新增 `src/scripts/check-metadata-all-contract.js`

依循前面 `check-release-readiness-contract.js` / `check-phase1-readiness-contract.js` 慣例：

- 純讀 `package.json` 文字；不執行任何被指到的腳本；不 build / deploy / dev / fetch / pull / write。
- REQUIRED_FRAGMENTS（4）：
  1. `npm run check:metadata-all-contract`（本 contract 自身，前端 fail-fast）
  2. `npm run check:metadata-guards`
  3. `npm run check:metadata-cross-fields`
  4. `npm run check:download-indexing-independence`
- ORDERED_FRAGMENTS（4）：與 REQUIRED 同序；indexOf 嚴格遞增。
- FORBIDDEN_TOKENS（13）：`build` / `deploy` / `gh-pages` / `publish` / `push` / `write` / `backfill:url` / `admin:write` / `safe-write` / `rm -rf` / `git push` / `git checkout` / `git reset` —— 對齊 phase1-readiness-contract 之 checks-only 契約清單。
- 案例總數 = 20：
  - 1 × package.json parseable
  - 1 × script exists & non-empty
  - 4 × required fragment present
  - 13 × forbidden token absent
  - 1 × ordered fragments in expected sequence

## 6. npm script 名稱新增

新增 1 個 npm script 名稱：`check:metadata-all-contract`。

`check:npm-script-targets` 目標數變化：
- 前：53 targets / 54 cases（53 + 1 sanity）
- 後：54 targets / 55 cases（54 + 1 sanity）

## 7. 驗證結果

### 7.1 Pre-commit 驗證（source-level static + guard body）

| Command | Exit | Result |
| --- | :---: | --- |
| `npm run check:metadata-all-contract` | 0 | 20/20 PASS（required 4/4 · ordered 4/4 · forbidden 0/13） |
| `npm run check:release-readiness-contract` | 0 | 14/14 PASS（required 4/4 · ordered 5/5 · forbidden 0/7）—— 未動 contract 檔，數字不動 |
| `npm run check:phase1-readiness-contract` | 0 | 23/23 PASS（required 7/7 · ordered 7/7 · forbidden 0/13）—— 未動 contract 檔，數字不動 |
| `npm run check:npm-script-targets` | 0 | 55/55 PASS（54 targets + 1 sanity；+1 vs. 前 baseline 之 54/54） |
| `npm run check:download-indexing-independence` | 0 | 298/298 PASS |
| `npm run check:metadata-all` | 0 | 全鏈 PASS；guard invocation × 1，summary × 1 |

### 7.2 Post-commit 驗證（full umbrella；tree clean 前提）

Post-commit 執行以下三條完整 chain，取 `/tmp/*.log` 分別驗證 invocation / summary count：

| Chain | Invocation count | Summary count | Exit |
| --- | :---: | :---: | :---: |
| `check:metadata-all` | 1 | 1 | 0 |
| `check:release-readiness` | 1 | 1 | 0 |
| `check:phase1-readiness` | 1 | 1 | 0 |

- Release chain：invocation 來自 metadata-all（唯一路徑）。
- Phase 1 chain：invocation 來自 direct integration（唯一路徑）。
- Metadata-all chain：invocation 來自 metadata-all 尾端（唯一路徑）。

三條入口皆 exactly 1，無 duplicate，符合 Dean 硬約束。

### 7.3 承載 baseline 數字（carry-forward，本 phase 未動 validator / content）

| Item | Baseline | 本 phase 之後 |
| --- | --- | --- |
| `validate:content` | 0 error / 135 warning / 107 post | unchanged |
| `check:blogger-backfill` | scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 / exit 0（report-only） | unchanged |
| `check:github-pages-prepublish` | 16/16 PASS | unchanged |
| `check:github-pages-prepublish-smoke` | 8/8 PASS | unchanged |
| `check:download-indexing-independence` | 298/298 PASS | 298/298 PASS（未動 body） |

## 8. Red-line / 未觸範圍再度確認

本 phase **未觸**：

- resolver：`page-type-robots.js` / `include-in-listings.js` / `include-in-sitemap.js`
- validator：`validate-content.js`
- schema / metadata 欄位 / `pageType` 枚舉 / `contentKind: download` 預設 / warning 行為
- content：任何 `content/**/*.md` / `.publish.json` / `.fb.md`
- template：任何 `src/views/**/*.ejs`
- style：任何 `src/styles/**/*.scss`
- frontend JS：任何 `src/js/**/*.js`
- Admin UI：任何 `views/admin/*`
- 實際下載頁
- build / deploy / dist / preview
- deploy clone（`/d/github/blog-new/portable-blog-deploy`）
- gh-pages branch
- Blogger 後台 / Blogger API / Blogger backfill write phase
- GA4 / AdSense / Search Console / custom domain
- Phase 1 direct integration（`check:phase1-readiness` script + `check-phase1-readiness-contract.js`）
- release-readiness umbrella（`check:release-readiness` script + `check-release-readiness-contract.js`）

## 9. Remaining gap

前 phase §3 documented 之 gap（metadata-all / release-readiness 不覆蓋本 guard）**已清除**：

- `check:metadata-all` ✅ 直接覆蓋
- `check:release-readiness` ✅ 經 metadata-all 間接覆蓋
- `check:phase1-readiness` ✅ 保留直接覆蓋

三條 readiness 入口皆自動執行 `check:download-indexing-independence` 且各 exactly 1 次。無新 gap 生成。

## 10. See also

- `docs/20260712-download-indexing-guard-phase1-umbrella-integration.md`（前 phase：Phase 1 direct integration；本 phase 保留）
- `docs/20260712-download-page-indexing-independence-policy-lock.md`（前前 phase：guard body 政策鎖）
- `src/scripts/check-download-indexing-independence.js`（guard body，未動）
- `src/scripts/check-release-readiness-contract.js`（未動；契約仍以 metadata-all 為 unit）
- `src/scripts/check-phase1-readiness-contract.js`（未動；契約仍列直接 integration）
- `src/scripts/check-metadata-all-contract.js`（本 phase 新增）
