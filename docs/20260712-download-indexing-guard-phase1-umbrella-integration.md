# 2026-07-12 · download-indexing guard → check:phase1-readiness umbrella integration

## 0. Scope / boundary（binding）

- 類型：**package.json 單 script 修改 + contract guard fragment 補強 + phase ledger doc**（唯一 mutation = `package.json` 改 `check:phase1-readiness` 1 行 + `src/scripts/check-phase1-readiness-contract.js` 加 1 fragment（REQUIRED 與 ORDERED 各 +1，case count 22 → 23） + 新增本 doc；**不**改 guard 本體、**不**改 resolver、**不**改 validator、**不**改 schema、**不**改 content、**不**改 sidecar、**不**改 template / EJS / SCSS / JS、**不**改 build / deploy、**不**動 deploy clone、**不**碰 Blogger / GA4 / AdSense / Search Console / domain）。
- 前置 baseline：source HEAD = origin/main = `7cbb278d457a002650c79743941b30c6a855913b`（subject `feat(content): decouple download page indexing`；上一 phase = `docs/20260712-download-page-indexing-independence-policy-lock.md`），branch main，clean，0/0，`.git/index.lock` absent。deploy clone HEAD = origin/gh-pages = `1170e7e`（未動）。
- baseline verify（本 phase 開頭執行）：`pwd` = `/d/github/blog-new/portable-blog-system`；`git branch --show-current` = `main`；`git rev-parse HEAD` = `7cbb278d457a002650c79743941b30c6a855913b`；`git rev-parse origin/main` = 同上；`git status --short` = empty；`git rev-list --left-right --count origin/main...main` = `0	0`；index.lock = `NO_INDEX_LOCK`。→ 判定：baseline 完全一致；本 phase 允許 mutation ＝ 上述 3 項。

## 1. 動機（Dean 指示）

上一 phase `docs/20260712-download-page-indexing-independence-policy-lock.md` §4.6 明確標記：

> ✅ 本 guard **不加入**任何 umbrella check（**不**進 `check:phase1-readiness` / **不**進 `check:metadata-all` / **不**進 `check:release-readiness`）；standalone / additive only。若未來 Dean 想 promote 入 umbrella，須另開獨立 phase。

Dean 於 2026-07-12 13:42（Asia/Taipei）明確授權開啟本獨立 phase，目的 = **將 `check:download-indexing-independence` 納入正式 umbrella 檢查鏈，確保日後執行標準 metadata / release / Phase 1 readiness 驗收時，不會漏跑這支 guard**。

核心不變式（Dean binding）：

> guard 只能被接入一次，不得因同時加入多層 umbrella 而在同一條 readiness chain 中重複執行。

且 Dean 明訂「本次禁止：同時把 guard 塞入多個 umbrella」。

## 2. 修改前 umbrella 呼叫鏈調查

修改前的實際 dependency graph（純讀 `package.json`）：

```
check:metadata-guards      = 5 single-field guards（content-type / adsense-mode / campaign-purpose / campaign-industry / custom-promo）
check:metadata-cross-fields = 3 cross-field guards（campaign / custom-promo / adsense）
check:metadata-all         = metadata-guards && metadata-cross-fields

check:release-readiness
  → check:release-readiness-contract
  → check:github-pages-prepublish
  → check:github-pages-prepublish-smoke
  → check:metadata-all             ← 內含 metadata-guards + cross-fields
  → validate:content

check:phase1-readiness             ← **不**呼叫 check:metadata-all；**不**呼叫 check:release-readiness
  → validate:content
  → check:npm-script-targets
  → check:adsense-mode-metadata    ← 只呼叫 5 個單欄 metadata guard 之一
  → check:blogger-backfill
  → check:github-pages-prepublish
  → check:github-pages-prepublish-smoke
```

Section 五 required questions 之答覆：

1. **check:metadata-all 是否已被 check:release-readiness 呼叫？** ✅ 是。release-readiness 於 metadata-all fragment 位置調用。
2. **check:release-readiness 是否已被 check:phase1-readiness 呼叫？** ❌ 否。phase1-readiness 為獨立平行鏈，未呼叫 release-readiness。
3. **Phase 1 readiness 是否另有平行路徑再次執行 metadata guards？** 部分 —— phase1-readiness 只跑 `check:adsense-mode-metadata`（5 個單欄 guard 之一），不跑完整 `check:metadata-all`。
4. **將新 guard 加入 check:metadata-all 後，是否會在一次 Phase 1 readiness 中執行超過一次？** ❌ 不會，因 phase1-readiness 根本不呼叫 metadata-all；但也代表**若只加入 metadata-all，phase1-readiness 完全不會執行到本 guard**。
5. **哪些 contract / order guard 會因增加一個步驟而需要更新？** 取決於選擇；本 phase 選擇 phase1-readiness → 需更新 `src/scripts/check-phase1-readiness-contract.js`（REQUIRED_FRAGMENTS + ORDERED_FRAGMENTS 各 +1 fragment）；不需更新 `check:release-readiness-contract`（release-readiness umbrella 本身未動）。

## 3. 選擇：`check:phase1-readiness`

三個候選 umbrella 之覆蓋分析：

| 候選 umbrella | 覆蓋 metadata（`check:metadata-all` 直接）| 覆蓋 release（`check:release-readiness`）| 覆蓋 Phase 1（`check:phase1-readiness`） |
| --- | :---: | :---: | :---: |
| 加入 `check:metadata-all` | ✅ 直接 | ✅ 經 release-readiness → metadata-all | ❌ phase1-readiness 不呼叫 metadata-all |
| 加入 `check:phase1-readiness` | ❌ | ❌ | ✅ 直接 |
| 加入 `check:release-readiness`（不經 metadata-all）| ❌ | ✅ 直接 | ❌ |

在「單一 umbrella 只加入一次」的硬約束下，沒有任何**單一** umbrella 可同時覆蓋三種驗收路徑。

Dean 於任務書 Section 八 E 與 十二.5 明確要求：**Phase 1 readiness 執行時，新 guard 必須自動執行且恰執行一次**。此為 hard verification requirement。

∴ **選擇 = `check:phase1-readiness`**（direct integration）。

Trade-off / 已知 gap：
- `check:metadata-all` 直接執行時**不會**跑到本 guard。
- `check:release-readiness` 執行時（其呼叫 metadata-all，metadata-all 內不含本 guard）**不會**跑到本 guard。
- 若 Dean 日後想讓 metadata-all 與 release-readiness 也覆蓋本 guard，需另開獨立 phase 處理（例如 metadata-all 加入本 guard，或 phase1-readiness 改呼叫 metadata-all；後者屬 umbrella 架構改寫，非本 phase 範圍）。

不採「同時加入 metadata-all + phase1-readiness」策略：Dean 之 binding 明訂「本次禁止：同時把 guard 塞入多個 umbrella」；即使兩者為獨立鏈、不會 duplicate 執行，該 binding 仍為 hard rule，本 phase 遵守。

## 4. 修改內容

### 4.1 `package.json`

`check:phase1-readiness` 一行修改，`check:download-indexing-independence` 插入於 `blogger-backfill` 與 `github-pages-prepublish` 之間：

```diff
- "check:phase1-readiness": "npm run validate:content && npm run check:npm-script-targets && npm run check:adsense-mode-metadata && npm run check:blogger-backfill && npm run check:github-pages-prepublish && npm run check:github-pages-prepublish-smoke",
+ "check:phase1-readiness": "npm run validate:content && npm run check:npm-script-targets && npm run check:adsense-mode-metadata && npm run check:blogger-backfill && npm run check:download-indexing-independence && npm run check:github-pages-prepublish && npm run check:github-pages-prepublish-smoke",
```

順序位置 = 個別 metadata / resolver / backfill guards **之後**、prepublish / smoke checks **之前**，符合任務書 Section 七 之建議：

```
個別 metadata / resolver guards → download indexing cross-resolver invariant guard → 後續 prepublish / release / smoke checks
```

### 4.2 `src/scripts/check-phase1-readiness-contract.js`

- 檔頭 doc comment 更新：六個 → 七個必要片段；順序描述追加 `download-indexing-independence`。
- `REQUIRED_FRAGMENTS`：`+ 'npm run check:download-indexing-independence'`（插於 `blogger-backfill` 與 `github-pages-prepublish` 之間）。
- `ORDERED_FRAGMENTS`：同上，同位置插入。
- Case count：22 → **23**（1 parse + 1 script exists + 7 required + 13 forbidden + 1 ordered sequence = 23）。

### 4.3 本 doc（`docs/20260712-download-indexing-guard-phase1-umbrella-integration.md`）

新增本 ledger，per §Historical ledger replacement rule。

### 4.4 未動之明確清單

- ❌ 未動 `src/scripts/check-download-indexing-independence.js` 本體（含核心 matrix 邏輯與 header comment）。
- ❌ 未動 robots resolver（`src/scripts/page-type-robots.js`）。
- ❌ 未動 sitemap resolver（`src/scripts/include-in-sitemap.js`）。
- ❌ 未動 listings resolver（`src/scripts/include-in-listings.js`）。
- ❌ 未動 `src/scripts/validate-content.js`；未動 `VALID_SEO_INDEXING`。
- ❌ 未新增 metadata 欄位、`pageType: activity_page`；未改 `contentKind: download` 預設。
- ❌ 未動 `check:metadata-all` / `check:metadata-guards` / `check:metadata-cross-fields`；未動 `check:release-readiness` / `check:release-readiness-contract`；未動其他任何既有 umbrella。
- ❌ 未動 EJS / SCSS / JS / template。
- ❌ 未實作 Admin UI；未建立實際下載頁。
- ❌ 未動 content（`content/**`）；未動 sidecar（`*.publish.json`）；未動 frontmatter。
- ❌ 未動 deploy clone（`/d/github/blog-new/portable-blog-deploy`）；未 push gh-pages；未 build / deploy。
- ❌ 未動 Blogger 後台；未 backfill Blogger 真值；未動 domain / AdSense / GA4 / Search Console。
- ❌ 未新增 warning；validate:content 保持 0 / 135 / 107。
- ❌ 未改 `docs/20260712-download-page-indexing-independence-policy-lock.md` 之「本 guard 不加入 umbrella」語句（該 doc 為前一 phase frozen ledger；本 phase 之 promotion 由本 doc 單獨記錄）。

## 5. 驗證結果

### 5.1 精準 guard

- Command: `npm run check:download-indexing-independence`
- Exit: 0
- PASS/FAIL: PASS
- 重要輸出：`download indexing independence guard: 298/298 PASS`（無變化）

### 5.2 被修改的 umbrella：`check:phase1-readiness`

- 於 §5.5 完整驗證；此處僅記錄 `check:download-indexing-independence` 於單次執行中恰出現 1 次（見 §5.6）。

### 5.3 相關 contract / order guards

#### 5.3.1 `check:phase1-readiness-contract`

- Command: `npm run check:phase1-readiness-contract`
- Exit: 0
- PASS/FAIL: PASS
- 重要輸出：`phase1-readiness contract guard: 23/23 PASS`（22 → 23，additive +1 fragment）
  - required fragments: 7/7
  - ordered fragments: 7/7
  - forbidden tokens found: 0/13 checked

#### 5.3.2 `check:release-readiness-contract`（sanity check：未動）

- Command: `npm run check:release-readiness-contract`
- Exit: 0
- PASS/FAIL: PASS
- 重要輸出：`release-readiness contract guard: 14/14 PASS`（無變化）
  - required fragments: 4/4
  - ordered fragments: 5/5
  - forbidden tokens found: 0/7 checked

### 5.4 `check:npm-script-targets`

- Command: `npm run check:npm-script-targets`
- Exit: 0
- PASS/FAIL: PASS
- 重要輸出：`npm script target existence guard: 54/54 PASS`（無變化；本 phase 未新增 npm script）

### 5.5 `check:phase1-readiness`

- Command: `npm run check:phase1-readiness`
- Exit: **1**（pre-existing behavior：`check:github-pages-prepublish` 之 source 端 `working tree clean` case 於本 phase 修改尚未 commit 時報 FAIL；此為 prepublish guard 之預期行為，非本 phase integration 之 regression）
- PASS/FAIL：本 phase 之 integration 目標 = **PASS**（見 §5.6 唯一性驗證）；`working tree clean` FAIL 於 commit 後應立即恢復 PASS。
- 重要輸出（節錄）：
  - `validate:content` 0 error / 135 warning / 107 post PASS
  - `check:npm-script-targets` 54/54 PASS
  - `check:adsense-mode-metadata` scanned 17 / candidates 0 / warnings 0 PASS
  - `check:blogger-backfill` scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5，report-only exit 0 PASS
  - `check:download-indexing-independence` 298/298 PASS ← **新增執行**
  - `check:github-pages-prepublish` 16 中 15 PASS / 1 FAIL（源自 working tree dirty，pre-commit 預期）
  - `check:github-pages-prepublish-smoke` 未執行（因前一 step 已 fail short-circuit）

**Post-commit re-verify（見 §7）** 應顯示 `check:phase1-readiness` exit 0，且 `check:github-pages-prepublish` 16/16 PASS、`check:github-pages-prepublish-smoke` 8/8 PASS。

### 5.6 唯一性驗證（Section 九 要求）

於 `npm run check:phase1-readiness` 完整輸出中：

```
在一次標準 Phase 1 readiness 中，
check:download-indexing-independence 執行次數：1
```

- `check:download-indexing-independence` npm invocation banner 出現次數：**1**
- `download indexing independence guard: 298/298 PASS` summary line 出現次數：**1**

∴ 唯一性驗證 PASS；guard 恰執行一次，未 duplicate。

### 5.7 baseline sanity

- `validate:content`：0 error / 135 warning / 107 post（無變化）
- `check:metadata-all`：scanned 17 / candidates 0 / warnings 0 exit 0（無變化；未動）
- `check:blogger-backfill`：scanned 12 / candidates 7 / complete 0 / missing 7 / skipped 5 exit 0（無變化；report-only）

## 6. 已知 gap（後續 phase 候選；不主動執行）

- **Gap-1**：`check:metadata-all` 直接執行時**不**涵蓋 `check:download-indexing-independence`。若 Dean 要求 metadata 直接驗收也覆蓋本 guard，需另開 phase 將本 guard 加入 `check:metadata-all`（並更新 metadata-all-contract 如未來新增此 contract）。
- **Gap-2**：`check:release-readiness` 執行時（經 `check:metadata-all`）**不**涵蓋 `check:download-indexing-independence`。若 Dean 要求 release 驗收也覆蓋本 guard，Gap-2 隨 Gap-1 一併解除。
- **Gap-3**：`src/scripts/check-download-indexing-independence.js` 檔頭 comment 仍記載「本 guard **不**加入任何 umbrella check」；本 phase 未修改該 comment（避免動 guard 檔本體）；docs 已由本 phase ledger 記錄新現況。若 Dean 未來要求同步更新 guard 本體 header comment，屬另一獨立 phase。

以上三 gap 皆屬 **後續選項**、**不阻塞** Phase 1；除非 Dean 明確授權，**不主動執行**。

## 7. Post-commit re-verify（待 commit / push 後填入）

- source HEAD（post-push）= ...
- origin/main（post-push）= ...
- branch = main、clean、0/0、`.git/index.lock` absent、`git status --short` empty。
- `npm run check:phase1-readiness` exit 0 期待。

## 8. 收尾

Baseline drift（預期）：

| 指令 | 修改前（`7cbb278`） | 本 phase | drift 分類 |
| --- | --- | --- | --- |
| `check:download-indexing-independence` | 298/298 PASS（standalone；未入 umbrella）| 298/298 PASS（入 `check:phase1-readiness`）| umbrella integration |
| `check:phase1-readiness-contract` | 22/22 PASS（6 required fragments）| **23/23 PASS**（7 required fragments）| +1 fragment additive |
| `check:phase1-readiness`（本 phase commit 後）| exit 0 | exit 0（含本 guard 298/298）| additive step |
| `check:release-readiness-contract` | 14/14 PASS | 14/14 PASS | 未動 |
| `check:release-readiness` | exit 0 | exit 0 | 未動 |
| `check:metadata-all` | exit 0 | exit 0 | 未動 |
| `check:npm-script-targets` | 54/54 PASS | 54/54 PASS | 未動 |
| `validate:content` | 0 / 135 / 107 | 0 / 135 / 107 | 未動 |
| `check:blogger-backfill` | scanned 12 candidates 7 complete 0 missing 7 skipped 5 | 同上 | 未動；report-only |

紅線 sanity（本 phase 全部 hold）：

- 未 build / 未 deploy / 未 push gh-pages。
- 未動 deploy clone（`/d/github/blog-new/portable-blog-deploy`）。
- 未真實寫入 Blogger；未 backfill Blogger 真值；未猜測 Blogger URL / postId / publishedAt。
- 未動 content / sidecar / frontmatter / registry。
- 未動 runtime resolver / validator / schema / build script / EJS / SCSS / JS。
- 未新增 npm script；未動 lockfile / `package.json` 除 `check:phase1-readiness` 該行外之欄位。
- 未動 CLAUDE.md / MEMORY.md。
- 未動 GA4 / AdSense / Search Console / domain / 任何外部平台後台。

完成後進入 **idle-freeze**；不主動開下一個 phase；後續 §6 三個 gap 之處理各須 Dean 明確授權。

## 9. See also

- `docs/20260712-download-page-indexing-independence-policy-lock.md`（前一 phase：guard 本體 landing / policy lock；標明「本 guard 不加入 umbrella」；本 phase 為其 §4.6 明確保留之「未來 promote 入 umbrella」follow-up phase）
- `docs/20260707-metadata-all-prepublish-integration-audit.md`（`check:metadata-all` 定位審計）
- `docs/20260707-release-readiness-clean-baseline-verification.md`（`check:release-readiness` = contract → prepublish → smoke → metadata-all → validate 之 clean baseline）
- `docs/20260707-release-readiness-contract-baseline-verification.md`（`check:release-readiness-contract` baseline 14/14）
- CLAUDE.md §3a Snapshot（Validation baseline table；本 phase 後 `check:phase1-readiness-contract` 由 22/22 → 23/23）
