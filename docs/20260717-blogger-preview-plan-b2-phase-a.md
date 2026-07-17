# B2 Phase A — Blogger draft-aware preview target planner（source slice；dry-run only）

- 建立日期：2026-07-17（Asia/Taipei）
- 類型：**source-only slice**（新增 1 支 planner + 1 支 guard + 2 個 npm script + 1 行 additive export + 本 doc）
- 上位契約：`docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2（Variant B2）/ §7 allowed / §8 forbidden / §9 gates / §11.2 acceptance；`docs/20260710-phase1-rc-next-phase-route-selection.md` Route D
- 觸發：Dean 於本 session 明確授權「實作 B2 的下一個最小、local-only、non-production 切片」，並明確**未**解除 live Blogger preview / login / Blogger API / draft creation / publish / deploy 等 gate。

---

## 0. Boot baseline（本輪已驗；read-only）

| Repo | branch | HEAD | 對照 | ahead / behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `eaac898` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `0eaf9c6` | `== origin/gh-pages` ✅（read-only 驗證） | `0 / 0` | clean | absent ✅ |

Source HEAD full = `eaac8987c56bb1b4fb00b77235badf05aa6e6b48`；subject `test(docs): guard node script references`。
Deploy HEAD full = `0eaf9c686ca3ed0d082443baec67197a77cb86fd`；subject `deploy(github): unpublish what-is-design-token; sync source 8a062b7`。**deploy clone 全程 read-only、未寫入。**

Pre-change guard baseline（全數與預期一致、未 drift）：

| 指令 | 結果 |
| --- | --- |
| `check:docs-node-script-refs` | 30/30 PASS |
| `check:docs-npm-run-refs` | 80/80 PASS |
| `check:npm-script-targets` | 111/111 PASS |
| `check:phase1-readiness` | total 16 / pass 16 / fail 0；smoke 8/8 PASS |
| `check:redraft-all` | contract 31/31；docs-status 99/99 |
| `validate:content` | 0 error / 135 warning / 107 post |

既有 Blogger backfill missing warnings 維持 **report-only**，本 slice 未觸碰、未修正、未升級。

---

## 1. B2 canonical 定義（依 repository 證據；非本 session 臆測）

依 `docs/20260710-blogger-preview-only-script-preanalysis.md` §6.2「Variant B2 — draft-aware preview build」：

- 建立獨立 `dist-blogger-preview/` 目錄（gitignored）。
- 讀指定 slug（**可含 draft**）；產出 HTML / copy-helper / meta（**可省** publish-checklist）；輸出標記 `PREVIEW-ONLY / NOT FOR DEPLOY`。
- **不改** `build:blogger` / `classify` / `load-posts.js` / 正式 `dist-blogger/`。
- 命令列**須要求指定 slug**（避免無腦全部 build 進 preview dist）。
- **不寫入** content / frontmatter / `.publish.json` / `CLAUDE.md` / `MEMORY.md` / `memory/`。
- **不呼叫** Blogger API、**不猜** Blogger IDs、**不改** AdSense production 行為。

B2 要解決之痛點（§6.3）：**「改 ready → build → 改回 draft 忘記」**。§9 G-S4 另定：**B2 之 default 應為 dry-run**。

---

## 2. B1 / B2 責任邊界

| | B1 navigator（已 landed `cc6497b`） | B2 draft-aware preview（本線） |
| --- | --- | --- |
| 資料來源 | `dist-blogger/` 之**既有輸出檔** | `content/**/*.md` frontmatter（**含 draft**） |
| 能否處理 draft | **結構上不能** —— `dist-blogger/` 依 `CLAUDE.md` §23 恆不含 draft | 能（本 slice 已落地解析層） |
| 回答的問題 | 「檔案在哪 / 是否已 build / 是否 stale」 | 「這 slug 是否合法 Blogger 目標 / 正式 build 為何跳過它 / preview 會怎麼產」 |
| 產出 | 無（純 console） | 未來：`dist-blogger-preview/`（**本 slice 尚未實作**） |

**關鍵**：B1 之盲區不是「懶得做」，而是資料來源決定的 —— draft 永不進 `dist-blogger/`，故 B1 對 draft 一無所知。本 slice 補上這個盲區的**解析層**。

---

## 3. 為何本切片是 planner 而非直接 render（工程約束）

`src/scripts/build-blogger.js` 現況（本輪 read-only 盤點）：

- 913 行、**零 `export`**（`grep -c "^export "` = 0）。
- `DIST_DIR` 硬編為 `dist-blogger`。
- 檔尾直接呼叫 `main()` → **import 即觸發整包正式 build**。

因此「render draft 到 preview dist」必須先把 renderer 從正式 build 入口抽出（新 renderer entrypoint + entrypoint guard + dist 產出邏輯），屬**對正式 build 入口之重構**，其體積與風險超出「最小切片」，且與 §11.2「`build:blogger` 行為 byte-identical」之驗證負擔不成比例。

故本 slice 沿用**本 repo 既有階梯**（見 `redraft-plan.js` / `redraft-apply-engine.js` / `redraft-apply-cli.js`）：

```text
Phase A  唯讀 lookup            → admin-article-lookup.js（已存在）
Phase B  dry-run plan（本 slice）→ blogger-preview-plan.js
Phase C  engine / render         → 未實作（後續獨立 Dean-gated phase）
Phase D  gated CLI 產檔          → 未實作（後續獨立 Dean-gated phase）
```

`admin:plan-redraft` 至今仍 **dry-run only**；本 slice 與之對稱。

---

## 4. 本切片 problem statement

> 目前 Dean 若想知道「某篇 draft 是否為合法 Blogger preview 目標、會以哪個 mode 產出、正式 `build:blogger` 為何跳過它」，**唯一辦法是把 frontmatter 改成 `ready` 再 build 看看** —— 這正是 B2 要消除的摩擦，且「改回 draft」為 runbook §D-10 之已知隱患。

本 slice 讓上述問題**不改任何 frontmatter、不產任何檔**即可回答。

---

## 5. 落地內容

### 5.1 新增 `src/scripts/blogger-preview-plan.js`（planner；dry-run only）

```bash
node src/scripts/blogger-preview-plan.js --slug=<slug> [--site=github|blogger] [--json] [--dry-run]
# npm：
npm run blogger:plan-preview -- --slug=<slug>
```

回報：`sourceSite`（blogger / github-cross）、`status/draft`、正式 `build:blogger` 是否收錄 + `classify` reason、preview `mode` + 來源（frontmatter / default）、`outputDir`、`wouldWrite`、`marker`。

**反 drift（不另抄規格）**：

- 「正式 build 是否收錄」→ 呼叫 `load-posts.js` 之**真實 exported `classify`**。
- bloggerMode 列舉 → 用 `load-blogger-posts.js` 之**真實 exported `VALID_BLOGGER_MODES`**。
- slug→文章 → reuse `admin-article-lookup.js` 之唯讀 resolver（含 slug 驗證 / 唯一性 / 型別檢查）；該 resolver 直讀 frontmatter、**不經 classify 過濾** → draft 亦可解析。

**Hard-fail（非靜默略過）exit code**：

| error | exit |
| --- | --- |
| `invalid-project-root` | 1 |
| `write-flag-not-supported` / `unknown-arg` / `slug-arg-missing` / `invalid-site` | 2 |
| `invalid-slug` | 3 |
| `not-found` | 4 |
| `not-unique` | 5 |
| `frontmatter-parse-failed` | 6 |
| `status-draft-type-invalid` | 7 |
| `not-a-blogger-target` | 8 |

`--apply` / `--write` / `--build` / `--deploy` / `--push` / `--publish` / `--save` / `--output` / `--force` **一律明確拒絕並 exit 2**（含 `--apply=true` 帶值形式），不靜默忽略。

### 5.2 新增 `src/scripts/check-blogger-preview-plan.js`（contract guard）

`npm run check:blogger-preview-plan` → **44 / 0 PASS**。全部斷言跑在 **OS temp 目錄** 之 synthetic fixture tree，`finally{}` 清除；不碰 production content / dist / settings / gh-pages。

覆蓋：draft-aware 解析 / ready 對照 / blogger-native / github-cross enabled / github-cross disabled hard-fail / mode 有效·缺漏·無效 / 輸出路徑不逸出 preview dist / marker / planned files（不含 publish-checklist）/ 邊界旗標 / zero-write（內容 + mtime + 目錄未建立）/ source 無 write·exec API / 無網路·API token / 9 個 write flag 逐一拒絕 / unknown-arg / slug 缺漏 / `--dry-run` / `--json` / `--site` 解 duplicate / Phase A 錯誤透傳 / determinism / 不洩 body / 反 drift（真實 export）。

### 5.3 `src/scripts/load-blogger-posts.js` — 1 行 additive export

```diff
-const VALID_BLOGGER_MODES = new Set(['full', 'summary', 'redirect-card']);
+export const VALID_BLOGGER_MODES = new Set(['full', 'summary', 'redirect-card']);
```

**行為不變**（僅加 `export` 關鍵字；本檔內部沿用同一 Set；`build:blogger` 執行路徑未改）。沿用 `load-posts.js` 對 `classify` 之 additive export 慣例（該處註解明載：additive export 供 guard「以真實函式驗證，避免另抄一份規格產生 drift」）。

### 5.4 `package.json` — 2 個 npm script（additive）

```json
"check:blogger-preview-plan": "node src/scripts/check-blogger-preview-plan.js",
"blogger:plan-preview": "node src/scripts/blogger-preview-plan.js",
```

命名依 preanalysis §10：**不用** `preview:blogger`（易與 Vite `preview` 混淆）；`build:blogger-preview` **刻意保留**給未來真正產檔之 B2 write phase（本 slice 不產檔，佔用該名稱會誤導）。`blogger:plan-preview` 與既有 `admin:plan-redraft` 對稱。

**未**接入 `check:phase1-readiness` / `check:release-readiness` umbrella（per §9.4 G-V3 / G-V4）。

---

## 6. 驗證結果

### 6.1 Focused

| 指令 | 結果 |
| --- | --- |
| `npm run check:blogger-preview-plan` | **44 / 0 PASS** |

### 6.2 真實內容 read-only 實跑（未產檔）

| 目標 | 結果 |
| --- | --- |
| `phonics-practice-sheet-download`（真實 draft） | ✅ 解析成功；收錄 NO（`classify: draft:true`）；mode `full`（frontmatter）；outputDir `dist-blogger-preview/posts/...` |
| `we-media-myself2`（真實 ready） | ✅ 解析成功；收錄 YES（`classify: ok`）；正式輸出 `dist-blogger/posts/we-media-myself2/` |
| `what-is-design-token`（github、blogger 未啟用） | ✅ hard-fail `not-a-blogger-target`（exit 8） |
| `nope-not-real` | ✅ hard-fail `not-found`（exit 4） |
| `--apply` / `--deploy` / 無 slug | ✅ hard-fail exit 2 |

實跑後 `dist-blogger-preview/` **仍 absent**；`dist-blogger/` 未動。

### 6.3 Full guards（post-change）

| 指令 | Pre | Post | 說明 |
| --- | --- | --- | --- |
| `check:docs-node-script-refs` | 30/30 | **30/30** | **不變**。該 guard 之 `IN_SCOPE_DOCS = ['CLAUDE.md', 'README.md']`，**不掃** `docs/**`；本 slice 未動該二檔 → 計數不受本 doc 影響 |
| `check:docs-npm-run-refs` | 80/80 | **80/80** | **不變**。同上（`IN_SCOPE_DOCS` 僅 `CLAUDE.md` / `README.md`） |
| `check:npm-script-targets` | 111/111 | **113/113** | **+2**：新增 2 個直接 `node <path>` target（`check:blogger-preview-plan` / `blogger:plan-preview`），guard 逐一驗證檔案存在 |
| `check:phase1-readiness` | 16/16 | **16/16** | 未接入 umbrella → 計數不變（見下方 working-tree 註） |
| `check:redraft-all` | contract 31/31 / docs-status 99/99 | contract 31/31 / docs-status 99/99 | 未觸碰 redraft 線 |
| `validate:content` | 0 / 135 / 107 | 0 / 135 / 107 | 未動 content |

**count 增加原因**：唯一增加為 `check:npm-script-targets` **111 → 113**，且完全來自本 slice 真實新增之 2 個 npm script（每個 target 1 條存在性斷言）。**非**放寬既有斷言、**非**改寫 expected count 以求通過。

**新增 assertion 之責任**：`check:blogger-preview-plan` 之 44 條全部為**本 slice 新工具之自我契約**（draft-aware 解析正確性 / hard-fail exit code / zero-write / 無網路·API / 反 drift），不覆蓋、不放寬、不改寫任何既有 guard 之責任範圍。

**working-tree 註（實測記錄）**：`check:phase1-readiness` 於**尚未 commit**時會出現 `total=16 pass=15 fail=1` —— 唯一 fail 為 `[FAIL] source: working tree clean — dirty entries: 5`，即 prepublish guard 正確偵測到本 slice 之未 commit 檔案（該 guard 之 smoke 亦有對應 `[PASS] source-dirty — exit=1 flagged dirty`）。此為 deploy-readiness 前置條件之**預期行為、非本 slice 之 regression**；commit 後回復 **16/16 pass / 0 fail**（已於 commit 後複驗，見 §6.4）。

---

## 7. 為何本切片不觸發 live Blogger operation

| 面向 | 事實 |
| --- | --- |
| Blogger login | ❌ 無；本工具無 auth 路徑 |
| Blogger API | ❌ 無；guard 斷言原始碼不含 `fetch(` / `node:https` / `googleapis` / `blogger.googleapis` / `OAuth` / `apiKey` |
| 網路 | ❌ 零；只讀本機檔案 |
| Credential | ❌ 未存取任何 credential / token / secret |
| Blogger 文章建立 / 更新 / 發布 / draft flip | ❌ 無；本工具不寫任何檔 |
| production content mutation | ❌ 無；guard 斷言內容 + mtime 不變 |
| `.publish.json` / `.fb.md` | ❌ 未讀寫（resolver 僅取 sidecar 存在性摘要，本 plan 不輸出其值） |
| Blogger true values（`bloggerPostId` / `publishedUrl` / `publishedAt`） | ❌ 未猜、未填、未輸出 |
| build / deploy / push / gh-pages / `dist*` | ❌ 全無 |
| AdSense / GA4 ID | ❌ 未讀 `ads.config.json`、未輸出任何 ID |

---

## 8. 仍需 Dean 明確授權之後續步驟（本 slice **不**啟動）

> **狀態更新（2026-07-17）**：下方第 1、2 項已於 **B2 Phase C** 落地（Dean-gated；獨立 slice）。
> 落地紀錄：`docs/20260717-blogger-preview-artifact-builder-b2-phase-c.md`。
> 本 §8 原文保留作歷史對照，**不**代表當前待辦。

1. ~~**B2 Phase C — renderer 抽出 + preview 產出**~~ → ✅ **已落地**：共用 renderer `src/scripts/blogger-render.js`（正式 build 與 preview 共用同一實作）；`src/scripts/build-blogger-preview.js` 產出 `dist-blogger-preview/posts/<slug>/`；`.gitignore` 已加 `dist-blogger-preview/`；三載體標記 `PREVIEW-ONLY / NOT FOR DEPLOY`；`npm run build:blogger-preview -- --slug=<slug>` 已註冊。**`build:blogger` byte-identical modulo `builtAt` 已驗證**（pre/post 快照 37/37 檔、0 real differences）。guard `check:build-blogger-preview` 61/0。
   - 附帶：本檔 §3 所述之工程約束（`build-blogger.js` 913 行 / 零 export / import 即執行 `main()`）**已於 Phase C 解除** —— renderer 已無 top-level side effect（不 import `node:fs`）。
2. ~~**Runbook / sanity checklist 更新**~~ → ✅ **已落地**：runbook 新增 **§C.6「B2 alternative」**（`build:blogger-preview` 不需暫改 frontmatter），§D 原 10 步**保留未刪**（仍為 fallback）。
3. 其餘一律維持 deferred：F5 / Blogger backfill intake（7 篇 true values）/ production backfill / production redraft / production republish / Route G deploy / Blogger AdSense Batch 2 live repost / reverse UTM pm-26。
4. **人工 Blogger Preview**（B2 實際收益驗收）：須 Dean 明確授權；Claude 不代登入 Blogger、不代貼、不代發布。

---

## 9. 變更安全性

本 slice 唯一 mutation = `src/scripts/blogger-preview-plan.js`（新）、`src/scripts/check-blogger-preview-plan.js`（新）、`src/scripts/load-blogger-posts.js`（+1 行 `export`，行為不變）、`package.json`（+2 additive script）、本 doc（新）。

**未**動：`content/**`（frontmatter / `.publish.json` / `.fb.md`）/ `content/settings/**` / `src/views/**` / `src/styles/**` / `src/js/**` / `build-blogger.js` / `build-github.js` / `load-posts.js` / `classify` / `.gitignore` / `package-lock.json` / `CLAUDE.md` / `MEMORY.md` / `memory/**` / `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `.cache/` / deploy clone / gh-pages。
**未**做：build / preview / dev server / deploy / push gh-pages / Blogger 後台 / Blogger API / AdSense / GA4 / Search Console / Drive / DNS / domain。
**未**降低任何既有 approval gate；**未**升級任何 report-only guard 為 fail-fast；**未**接入 phase1-readiness / release-readiness umbrella。

---

## See also

- `docs/20260710-blogger-preview-only-script-preanalysis.md`（B2 canonical 定義 §6.2 / allowed §7 / forbidden §8 / gates §9 / acceptance §11.2；本 slice 之上位）
- `docs/20260712-preview-only-helper-implementation.md`（B1 navigator landing ledger；`cc6497b`）
- `docs/20260710-phase1-rc-next-phase-route-selection.md`（Route D；B1 已 landed / B2 為下一步）
- `docs/20260708-blogger-draft-preview-runbook.md`（§D 10 步手動流程；本 slice 未變動）
- `docs/20260710-blogger-preview-sanity-analysis.md`（preview 40 項 sanity checklist；planner console output 指向此處）
- `docs/20260708-blogger-draft-preview-export-eligibility-inventory.md`（§7 Option B = B2 之源頭）
- `docs/20260714-admin-github-redraft-write-path-preflight.md`（Phase A→B→C 階梯之上位；本 slice 對稱沿用）
- `src/scripts/redraft-plan.js`（dry-run-only planner 之既有範本）
- `src/scripts/admin-article-lookup.js`（唯讀 slug resolver；本 slice reuse）
- `src/scripts/load-posts.js`（`classify` 單一事實來源 + additive export 慣例）
- `src/scripts/load-blogger-posts.js`（`VALID_BLOGGER_MODES`；本 slice +1 行 additive export）
- `CLAUDE.md` §23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§27（Claude Code 修改規則）、§29（第一版不做：Blogger API 永禁）
- `CLAUDE.md` §3a Red lines（不猜 Blogger IDs / 不動後台 / report-only guard 不升級）

---

（本文件結束 / end of document）
