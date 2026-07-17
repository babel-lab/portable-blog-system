# canonical docs direct-node `.js` script reference guard — preanalysis（2026-07-17）

- 建立日期：2026-07-17（Asia/Taipei）
- 類型：docs-only preanalysis + minimal additive checks-only guard
- 上位契約：`CLAUDE.md` §3a Core operating rules（本 slice 為新增 read-only guard，非 build / deploy 動作）
- Sibling guards：`check:npm-script-targets`（`package.json` 端）、`check:docs-npm-run-refs`（docs 端 `npm run` 型式）。本 slice 補兩者交集之外之最後一個象限。
- 本 slice 邊界（cumulative）：**不** build / deploy / dev server / fetch / pull；**不** 動 content / sidecar / frontmatter；**不** 動既有 guard / umbrella；**不** 動 `CLAUDE.md` / `README.md`；**不** 掃描 `docs/**/*.md`；**不** 讀 deploy clone；**不** 讀 `package.json`（本 guard 執行期）；**不** 呼叫 Blogger / Google / GA4 / AdSense API；**不** 引入 dependency / devDependency / lockfile 變更。

## Confirmed silent gap

`CLAUDE.md` § Validation baseline 表格以 **direct-node 形式**列出數條指令（`node src/scripts/X.js`）。若該 `.js` 被 rename / move / delete，`CLAUDE.md` 會**靜默腐化**：operator 照抄指令得到 runtime `Cannot find module`，而 repo baseline 全綠——因為既有兩支 guard 都覆蓋不到這個象限。

本 slice 前，該象限**無任何 guard**。2026-07-17 read-only audit 於 `3dd6b0a` 實測確認：canonical docs 內恰 **3 條** direct-node 參照，全在 `CLAUDE.md`（258 / 263 / 267 行），目標檔**目前皆存在**——即當下無實際 dangling，但**無任何斷言保證它們繼續存在**。本 guard 即為將該象限納入靜態覆蓋，屬預防性防呆，非修補既有缺陷。

### Repository evidence

commit `616a18a docs(project): fix affiliate resolver invocation`（2026-07-16）修正了一起真實事件：`CLAUDE.md` 曾列出 `npm run check-commerce-affiliate-resolver`，該 npm script 從未存在，operator 照抄即得 "Missing script"。該次修法是把該參照改寫為既有 direct-node 形式（`node src/scripts/check-commerce-affiliate-resolver.js`）。

值得記錄的因果：**該修法等同把參照從（其後由 `check:docs-npm-run-refs` 覆蓋之）`npm run` 象限，搬進當時無人覆蓋之 direct-node 象限。** 上一個 slice（`3dd6b0a`，`check:docs-npm-run-refs`）補上了 `npm run` 那一半，並在其 header 明文將 direct-node 形式排除於範圍外。本 slice 補其對稱缺口。

## 責任矩陣

| 參照來源 ＼ 參照型式 | `npm run <name>` | `node <path>.js` |
| --- | --- | --- |
| `package.json` | `check:npm-script-targets` | `check:npm-script-targets` |
| `CLAUDE.md` / `README.md` | `check:docs-npm-run-refs` | **`check:docs-node-script-refs`（本 slice）** |

各 guard 邊界（皆於各自 script header 明文）：

- `check:npm-script-targets`：只讀 `package.json`；斷言 script value 內之 `.js` 目標存在、且 `npm run` 參照可解析到既有 key。**不掃任何 `.md`**。
- `check:docs-npm-run-refs`：只讀 `CLAUDE.md` + `README.md`；只認 `npm run <name>` 型式；斷言 `<name>` 存在於 `package.json.scripts`。**明文排除 direct-node 型式**。
- `check:docs-node-script-refs`（本 guard）：只讀 `CLAUDE.md` + `README.md`；只認 direct-node `.js` 型式；斷言目標為 repo root 之下之現存 regular `.js` file。**明文排除 `npm run <name>`**（屬 sibling 責任，不重複覆蓋、不爭搶）。

## Chosen scope: `CLAUDE.md` + `README.md`

`CLAUDE.md` = 操作規範主檔（Core operating rules / Validation baseline 皆在此，且 3 條 direct-node 參照全在此）。
`README.md` = 使用者入口與可用指令表。

這兩份是 operator 與新加入者實際照抄指令之 **canonical operator-facing contract**；其中之參照 dangling 即為現行流程可觀察之缺陷。scope 與 sibling `check:docs-npm-run-refs` 完全一致，維持兩支 docs-side guard 之邊界對稱、易於推理。

## Why `docs/**/*.md` is excluded

`docs/` 現存 100+ 檔，含大量 `phase-*`、eod-report、closeout-note、handoff、rehearsal packet 等 **historical snapshot**。專案紀律明文（`CLAUDE.md` §3a "Historical ledger replacement rule"）要求每 phase ledger 寫入 `docs/<date>-<phase>.md` 且 historical snapshot **刻意保留當時語境**。

歷史 doc 內之 direct-node 參照可能為當時真實但今已 rename / retire。若一併掃入，會把歷史 drift 拖入 baseline，違反上述紀律，並製造長期不可修正之 hard-fail（無法回頭改歷史 doc）。root docs 是目前 operator-facing contract；歷史分析文件保留當時語境，不納入 hard guard。

未來若要擴展至 `docs/`（例如僅掃 "current-status region"），須另開 phase + explicit approval，並先建立 region 標記 / opt-in list 機制。

## Direct-node reference：明確範圍

**In-scope**：`node` 之後**緊接的第一個 token**，且該 token 以 `.js` 結尾。

canonical docs 現況 100% 為此形（`node src/scripts/X.js`，其中一條後接 `--registry-overlay <path>.json` args）。

**明確 out-of-scope**（刻意不擴張成通用 Markdown / command parser）：

- node flag 前置形（`node --flag x.js`）——canonical docs 現無此形；若未來出現須另開 phase 擴充，不由本 guard 靜默容忍或就地擴張。
- node binaries / eval 形（`node -e "..."`）。
- 任意 shell command parsing、其他 CLI binary。
- `npm run <name>`——屬 `check:docs-npm-run-refs` 責任。本 guard 有明確 self-check 斷言其**不**被誤收。

### Parser 設計要點

Pattern：`/(?<![\w-])node[ \t]+([^\s`|]+)/g`

1. **Negative lookbehind `(?<![\w-])` 為必要**：prose 內之 "Direct-node smoke"（`CLAUDE.md` 208 / 280 行）中，`-` 屬 regex word boundary，裸 `\bnode` 會誤命中並把後續 prose 當作 token。實測確認此為真實 false-positive 來源，非假想。
2. **Markdown wrapper 由 charset 天然終止**：token charset 排除空白 / backtick / table pipe，故 code span（`` `node x.js` ``）與表格 cell（`| ... |`）不需額外處理。此為授權 §4 所允許之「最小必要支援」，非 Markdown parser。
3. **Trailing prose punctuation**：由右至左剝除尾隨標點，一旦 token 以 `.js` 結尾即停（不切掉副檔名本身）。
4. **In-scope 判定與有效性判定分離**：不以 `.js` 結尾者視為 out-of-scope（靜默跳過，非 fail）；以 `.js` 結尾者才進入 hard-fail classifier。此分離確保「不處理 node binaries」與「dangling 必 hard-fail」兩項要求不互相污染。

## Hard-fail 條件

任一成立 → 該參照判定 unresolved → guard exit 1（與 `check:docs-npm-run-refs` 之 hard-fail 語意一致，非 report-only）：

1. **absolute path**——POSIX（`/x.js`）、UNC（`\\server\share\x.js`）、Windows drive（`D:\x.js` / `D:/x.js`）。本 guard 只接受 repo-relative 參照。
2. **逃逸 repo root**——`../outside.js`、`src/../../outside.js`，或正規化後等於 repo root 本身。
3. **非 `.js` target**。
4. **target 不存在**。
5. **target 存在但非 regular file**（如同名目錄 `adir.js/`）。
6. **無效 path**（path 解析或 `stat` 拋錯）。

Windows drive 與 UNC 之判定不依賴 `path.isAbsolute` 之平台相依行為（POSIX 下 `path.isAbsolute('D:\\x.js')` 為 `false`），改以顯式 regex 併同判定，確保跨平台 deterministic。

## Self-check 設計

內建於 guard、**無外部 dependency**、**不新增第四個 repo file**。fixtures 建於 `os.tmpdir()` 之 `mkdtempSync` 目錄，`finally` 區塊確保清除。核心 `classifyTarget(token, repoRoot)` 之 `repoRoot` 為參數，使 self-check 可注入合成 root，不依賴 repo 現有 script 名。

覆蓋 24 項，含授權 §5 要求之全部必備項：

- **valid existing target → PASS**；**missing target → FAIL**
- **repo-relative `./` normalization**（前綴 `./scripts/ok.js` 與內嵌 `scripts/./ok.js` 兩式）
- **target escaping repo root → FAIL**（直接 `../`、內嵌 traversal、正規化為 repo root 本身三式）
- **absolute path → FAIL**（POSIX / Windows drive / UNC 三式）
- **non-regular-file → FAIL**（同名為 `.js` 之目錄）
- **拒絕 `npm run <name>`**，不當作 direct-node script（含 `npm run build.js` 這種名稱以 `.js` 結尾之刁鑽案）
- **拒絕 node binary / eval 形**、**拒絕非 `.js` target（`.json`）**
- **拒絕 hyphenated prose 詞**（`Direct-node smoke`）與 **word-prefixed `node`**（`autonode`）
- **Markdown 最小支援**：backtick code span 終止、table pipe 終止、trailing CLI args 不被當 target、trailing prose 句點剝除
- **deterministic reference ordering**（行內多筆維持 source order；同一輸入重複掃描結果逐字相同）
- **不執行 target script**：fixture `exec-sentinel.js` 於被執行時會寫出 sentinel 檔；self-check 斷言掃描後該參照 resolved 為 true **且** sentinel **不存在**——以行為證明本 guard 只做靜態存在性檢查，從不執行被參照之 script

## Standalone rationale

本 guard **不接** `check:phase1-readiness` / `check:release-readiness` / `check:redraft-all` 或任何 umbrella，亦**不改變**任何既有 guard 之執行語意、覆蓋面或順序。理由：

- 對齊 sibling `check:docs-npm-run-refs` 之 standalone 決策（同 slice 類型、同 scope、同 hard-fail 語意）。
- 對齊 `check:byline-contract` 之既有 standalone 先例。
- umbrella 整合是**下一階段語意決策**，非本 slice 之 gap；若未來要整合，須另開 phase 與 rationale 落地。

## Exactly 3 changed paths

- **New**：`src/scripts/check-docs-node-script-refs.js`（本 guard 實作）
- **New**：`docs/20260717-docs-node-script-refs-preanalysis.md`（本 doc）
- **Modified**：`package.json`（**僅新增一筆** script entry `"check:docs-node-script-refs": "node src/scripts/check-docs-node-script-refs.js"`，緊鄰 `check:docs-npm-run-refs`；**未**改 version、**未**改任何 dependency、**未**產生或修改 lockfile）

不動：`CLAUDE.md`、`README.md`、任何既有 guard、任何 readiness／redraft umbrella、任何 content / frontmatter / sidecar、deploy repo、generated output。

## Guard-count expectations

- `check:docs-node-script-refs`（新）：**30 / 30 PASS**（於 `3dd6b0a` 實跑推導，非預先 hard-code）。組成為 deterministic：2 doc presence + 24 self-check + 3 occurrence + 1 sanity。occurrence 數由 `CLAUDE.md` + `README.md` 之實際分布決定；**不**因預期為 3 而硬編碼成 3。
- `check:npm-script-targets`：110 / 110 → **111 / 111**（+1 新 `.js` target；本 guard 未接任何 umbrella，故無新 `npm run` 參照被 pkg 端計入）。
- `check:docs-npm-run-refs`：80 / 80 unchanged。
- `check:phase1-readiness`：16 / 16 unchanged；`check:github-pages-prepublish-smoke`：8 / 8 unchanged。
- `check:redraft-all`：PASS unchanged（contract 31 / 31、docs-status 99 / 99）。
- `validate:content`：0 / 135 / 107 unchanged。
- 既知之 Blogger backfill report-only warnings 維持既有型別與數量，無新增。

## Production / deploy / Blogger safety boundary

本 guard 為 **additive checks-only**：純讀兩份 root Markdown + `fs.existsSync` / `fs.statSync` 對 repo-local 路徑做靜態斷言。它**不執行**被參照之任何 script、**不寫**任何 repo 檔（唯一寫入為 `os.tmpdir()` 下之 self-check fixtures，`finally` 即刪）、**不讀** deploy clone、**不發**任何網路請求。因此結構上無法觸及 production build / preview / deploy / `gh-pages` write / live URL probing / Blogger preview / publish / write。

本 slice **未** 動 content / sidecar / frontmatter / `.publish.json`，故無 content status change；**未** 觸發 admin write path（`--apply` / env gate / confirmation phrase / `admin:redraft-apply`）；**未** 呼叫 Blogger / Google / GA4 / AdSense / Search Console 任何 API；**未** 同步 `CLAUDE.md` / memory。

**本文件不聲稱任何 production execution 已獲授權。** Dean 之 production authorization 未因本 slice 落地而發生任何變更：F5 維持 deferred、Blogger backfill intake candidate 維持 deferred，redraft / republish / Blogger backfill 之授權狀態維持前 slice 之 `implemented / never authorized / never executed` 分類。「已 implemented」不得被推定為 production execution 已獲授權。

## Rollback

本 slice 為單一 commit、恰 3 個 path、無 migration、無 generated output、無 lockfile、無既有 guard 語意變更，因此 rollback 為純機械操作且無殘留狀態：

- **已 push 後**：`git revert <commit-sha>`（建立反向 commit，保留歷史；為預設建議做法）。revert 後 `check:npm-script-targets` 回到 110 / 110，其餘 guard 數值不變。
- **未 push 前**：`git reset --soft HEAD~1`（保留工作區）或 `git reset --hard HEAD~1`（丟棄）。
- **僅停用不移除**：自 `package.json` 移除該筆 script entry 即可停用；兩個新檔為 inert（無 import 者、無 umbrella 引用），留存不影響任何既有流程。

任何 rollback 皆**不需**碰 deploy repo、`gh-pages`、content 或 Blogger——本 slice 從未寫入這些面向。

## Validation plan

本地 read-only 驗證，順序：

1. `npm run check:docs-node-script-refs`（預期實際 deterministic `N / N PASS`）
2. `npm run check:docs-npm-run-refs`（預期 80 / 80 unchanged）
3. `npm run check:npm-script-targets`（預期 110 → 111）
4. `npm run check:phase1-readiness`（預期 16 / 16 + smoke 8 / 8 unchanged）
5. `npm run check:redraft-all`（預期 PASS unchanged）
6. `git diff --check` / `git status --short`（預期恰 3 changed paths、無 lockfile、`.git/index.lock` absent）

若新 guard 找到現存 dangling direct-node reference、或實際 scope 超出已確認之 3 條 canonical references、或既有 guard 出現非預期變化、或需要修改 `CLAUDE.md` / `README.md` / 第四個 path 才能通過 → **不自行修文件、不擴張 scope**，停止並回報。
