# docs-side `npm run` reference existence guard — preanalysis（2026-07-17）

- 建立日期：2026-07-17（Asia/Taipei）
- 類型：docs-only preanalysis + minimal additive checks-only guard
- 上位契約：`CLAUDE.md` §3a Core operating rules（本 slice 為新增 read-only guard，非 build/deploy 動作）；`check:npm-script-targets` 為 sibling guard，本 slice 補其 docs-side 覆蓋缺口。
- 本 slice 邊界（cumulative）：**不** build / deploy / dev server / fetch / pull；**不** commit / push；**不** 動 content / sidecar / frontmatter；**不** 動既有 guard / umbrella；**不** 動 CLAUDE.md / README.md；**不** 掃描 `docs/**/*.md`；**不** 讀 deploy clone；**不** 呼叫 Blogger / Google / GA4 / AdSense API。

## Problem

`package.json` 內許多 script 形如 `node src/scripts/X.js`；operator-facing docs（`CLAUDE.md` §Validation baseline / `README.md` 指令表）內許多操作說明形如 `npm run <name>`。若 script 被 rename / retire / typo，docs 內的 `npm run <name>` 會 dangling —— operator 照抄即得 npm 執行時的 "Missing script" 錯誤。此類缺陷不會被 build / test / validate baseline 攔下，因為它們不執行 docs 內的指令。

## Repository evidence

commit `616a18a docs(project): fix affiliate resolver invocation`（2026-07-16）修正了一起真實事件：`CLAUDE.md` § Validation baseline 曾列出 `npm run check-commerce-affiliate-resolver`，但該 npm script 從未存在（`git log -S` over `package.json` 無任何 hit）。commit message 明文寫下：

> An operator following the table got a "Missing script" error. `check-npm-script-targets` only reads `package.json`, so no guard could ever catch a dangling reference living in `CLAUDE.md`.

該次修法將 invocation 改為既有 direct-node form（`node src/scripts/check-commerce-affiliate-resolver.js`），是**反應式**修補，並未加入結構性防呆。

`git log -p` 顯示 `check:npm-script-targets` 之現行實作僅解析 `package.json.scripts` 之 values（`src/scripts/check-npm-script-targets.js` §抽出 targets / §抽出 npm run 參照皆針對 pkg.scripts）；範圍不含任何 Markdown docs。

## Why package.json-only target checking is insufficient

`check:npm-script-targets` 涵蓋兩個面向，皆限於 `package.json` 自身：

1. 每個 script value 內出現的 `.js` 檔存在於 repo。
2. 每個 script value 內的 `npm run <name>` 參照解析到 `scripts` 內既有 key（umbrella script 之防呆）。

它**不**掃描 `.md` 檔；operator 只讀 CLAUDE.md / README.md 時實際會遇到的失效模式（docs 內 `npm run <name>` 指向不存在之 script）落在既有 guard 覆蓋範圍外。此為 `616a18a` 事件之根因，該 commit 明文承認 guard 缺口。

## Scanner design（source-of-truth-aware resolver）

Parser 不由單一 regex 同時決定 token boundary 與 script 合法性；改採兩段：

1. **Maximal token 抽取**：`\bnpm\s+run\s+([A-Za-z0-9][A-Za-z0-9:_.-]*)/g`。首字元限 `[A-Za-z0-9]`（拒 `<script>` / `${name}` placeholder / bare `npm run`）；後續允許 npm-script 慣用字元集 `[A-Za-z0-9:_.-]`，**包含末字元**——不由 regex 強制末字元為 alnum，以支援 npm-script 契約允許之末字元 `: - _ .`。Markdown wrapper（backtick / pipe / 中英文標點 / 空白 / ` -- ` args）不在 charset 內，由 regex 天然終止 token。

2. **Source-of-truth resolver**：
   - **Exact-key precedence**：若 maximal token 精確存在於 `package.json.scripts` → 直接 resolve。此路徑保證合法以 `:` / `-` / `_` / `.` 結尾之 script key 可維持可辨識與可解析（例如未來出現 `task:` 之 key，`` `npm run task:` `` 之 maximal token `task:` 直接命中，不會被誤剝為 `task`）。
   - **Deterministic prose stripping**：若 maximal token 不匹配，由右至左逐字元剝除 trailing punctuation（限 `[:_.-]`），每剝一字元即再比對 scripts；命中即 resolve 為剝離後之 key。不剝除 alnum 字元。此路徑處理常見 prose / Markdown 尾隨情形（如 `npm run dev.` 中之句末句點）。
   - **Unresolved 必 hard-fail**：剝除至無 trailing punctuation 仍無 match → hard-fail，並以**原始 maximal token** 回報（不靜默丟棄；operator 需看到 docs 內實際字串）。

**現有 package script keys 均以 alnum 結尾之現況（`endingWithAllowedPunctuation: []` on 83 keys）** 不得作為固化 regex 末字元 restriction 之理由；contract 允許 `: - _ .` 於末字元，將來 rename / 新增之 script 名須無縫可辨識。

**Self-check 使用 synthetic script set**（如 `{ 'task:': '' }` / `{ dev: '', 'dev.': '' }`），不依賴 repo 現有 script 名。因此 self-check 檢驗的是「parser + resolver 對合法規則」，非「parser 對現有 script 之特定 hard-code」。

## Chosen scope: CLAUDE.md + README.md

`CLAUDE.md` = 操作規範主檔（Core operating rules / Validation baseline / package.json 指令小節皆在此）。
`README.md` = 使用者入口與可用指令表（`npm run` 使用範例集中於單一表格）。

這兩份是 operator 與新加入者實際照抄指令之 canonical docs；若其中之 `npm run <name>` dangling，即為現行流程可觀察之缺陷。

## Why `docs/**/*.md` is excluded

`docs/` 現存 100+ 檔，含大量 phase-*、eod-report、closeout-note、handoff、rehearsal packet 等 **historical snapshot**。專案紀律明文（見 `CLAUDE.md` §3a "Historical ledger replacement rule"）：

> CLAUDE.md 不再保存逐 phase 戰史 ledger；每 phase ledger 寫到 `docs/<date>-<phase>.md`。... historical snapshot 刻意保留當時語境。

歷史 doc 內之 `npm run <name>` 可能為當時真實但今已 rename / retire。若一併掃入，會把歷史 drift 拖入 baseline，違反上述紀律，且會製造長期不可修正之 warning / fail（無法回頭改歷史 doc）。

scope 收窄至 CLAUDE.md + README.md 對齊 `616a18a` 修法之實際 target，且與現行「report-only additive guard 收在最小 authoritative surface」之精神一致。未來若要擴展至 docs/（例如僅掃「current-status region」），須另開 phase + explicit approval，並先建立 region 標記 / opt-in list 機制。

## Hard-fail rationale

`616a18a` 將該事件視為 bug（reactive 修補），不視為 warning-tolerable drift。因此本 guard 採 **hard-fail**（任一 dangling reference → exit 1），與 `check:npm-script-targets` 相同語意，非 report-only。若未來某 canonical doc 允許出現「已 retire 但保留在歷史章節之 script 名稱」，須先建立顯式 exclusion 機制再放行，不由本 guard 靜默容忍。

## Standalone rationale

本 guard **不接** `check:phase1-readiness` / `check:release-readiness` / `check:redraft-all` 或任何 umbrella。理由：

- 對齊 `check:byline-contract` 之 standalone 決策（已完成 audit、刻意保持 standalone）。
- 對齊「report-only additive guard 各自 standalone、透過 `check:npm-script-targets` 統一涵蓋 script 存在性」之現行模式。
- umbrella 整合是**下一階段語意決策**，非本 slice 之 gap；若未來要整合，須另開 phase 與 rationale 落地。

## Expected file scope

只新增 / 修改三個檔：

- New：`src/scripts/check-docs-npm-run-refs.js`（本 guard 之實作）
- New：`docs/20260717-docs-npm-run-refs-preanalysis.md`（本 doc）
- Modified：`package.json`（僅新增一筆 script entry `"check:docs-npm-run-refs": "node src/scripts/check-docs-npm-run-refs.js"`；緊隨 `check:npm-script-targets` 之後）

不動：CLAUDE.md、README.md、任何既有 guard、任何 umbrella、任何 content / sidecar / frontmatter、`portable-blog-deploy`。

## Expected guard-count changes

- `check:docs-npm-run-refs`（新）：N/N PASS，N 由實際 deterministic 組成（package.json parseable + scripts is object + 2 doc presence + K 個 self-check + M 個 occurrence + 1 sanity）；**K 與 M 之絕對數字不預先 hard-code**、不寫入本 doc 為 frozen expectation。self-check 覆蓋範圍見 §Scanner design；per-occurrence 數量由 CLAUDE.md + README.md 之實際 `npm run` 分布決定。
- `check:npm-script-targets`：109/109 → **110/110**（+1 新 `.js` target；本 guard 未加入任何 umbrella，故無新 `npm run` 參照被 pkg 端計入）。
- `check:redraft-docs-status`：99/99 unchanged。
- `check:phase1-readiness`：16/16 unchanged；`check:github-pages-prepublish-smoke` 8/8 unchanged。
- `check:redraft-all`：PASS unchanged。
- `validate:content`：0/135/107 unchanged。

## Explicit non-goals

- **不** 修改 CLAUDE.md / README.md 內容（本 slice 為 additive guard）。
- **不** sweep `docs/**/*.md`。
- **不** 接 umbrella。
- **不** 改既有 checker 之邏輯 / 覆蓋面 / 順序。
- **不** 動 content / sidecar / frontmatter / build output / deploy clone。
- **不** commit / push / build / deploy / fetch / pull / preview。
- **不** production redraft / republish / Blogger action / gh-pages 動作。
- **不** 引入新 devDependency / dependency（純 node `fs` + string regex）。
- **不** 引入 fixture 檔（self-check 內建於 guard；per authorization）。

## Validation plan

本地 read-only 驗證，順序：

1. `npm run check:docs-npm-run-refs`（預期 N/N PASS；N 由實際掃描決定）
2. `npm run check:npm-script-targets`（預期 109 → 110 PASS）
3. `npm run check:redraft-docs-status`（預期 99/99 unchanged）
4. `npm run check:phase1-readiness`（預期 16/16 + smoke 8/8 unchanged）
5. `npm run check:redraft-all`（預期 PASS unchanged）

若任一預期不成立、或新 guard 找到現有 dangling reference、或需要修改 CLAUDE.md / README.md 才能通過 → 不自行擴大 scope，停止並回報。

diff 檢查：`git status --short` / `git diff --stat` / `git diff --check` 恰 3 changed paths、無 generated 檔、無 deploy clone changes、無 unrelated formatting、無 `.git/index.lock`。

## Production safety statement

本 slice **無任何** production write / commit / push / build / deploy / preview / fetch / pull 動作；**未** 動 CLAUDE.md / README.md；**未** 動 content / sidecar / frontmatter / dist / gh-pages；**未** 觸發 admin write path（`--apply` / env gate / confirmation phrase / `admin:redraft-apply` / `admin:write`）；**未** 呼叫 Blogger / Google / GA4 / AdSense API；**未** 讀取 `../portable-blog-deploy`。Dean production authorization **未** 因本 slice 落地而發生變更；redraft / republish / Blogger backfill 之授權狀態維持前 slice 之 `implemented / never authorized / never executed` 分類。
