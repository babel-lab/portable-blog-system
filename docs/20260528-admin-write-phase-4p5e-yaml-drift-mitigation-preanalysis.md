# Admin Write Infra Phase 4.5e — YAML Emitter Drift Mitigation Pre-analysis (docs-only)

Phase: `20260528-am-7-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis-docs-only-a`
Date: 2026-05-28 09:38 +0800
Status: 🔄 docs-only pre-analysis；不啟動 source change；不實作 mitigation；不解開 `--apply`；不解開 `dryRun:false`；不開 middleware；不開 Admin Apply

本文件為 Admin Write Infra **Phase 4.5e（first real content write gate via CLI）**之**前置風險分析 + mitigation 設計**，對齊 `docs/admin-2-write-pre-analysis.md` §15.G.4 之 ⚠️ YAML emitter drift hard-block。本文件僅做風險分析與候選方案 trade-off；**不**選定方案；**不**實作 source；**不**新增 fixture；**不**動 production content；**不**改 CLI / safeWrite / validator / whitelist。

本 phase 唯一 source 動作為新增本文件單檔；無其他 src / content / settings / templates / validation-fixtures / dist / package / vite config 變動。

---

## §1 Purpose / scope

### 1.1 Purpose

針對 §15.G.4 surface 之 YAML emitter drift 現象，做候選 mitigation 方向之**設計分析與比較**，作為 Phase 4.5e source 動作（spike / prototype / 實作）之**前置 acceptance gate 定義**。

### 1.2 In scope（本文件做）

- 對 Phase 4.5d acceptance 之 concrete drift evidence 做正式陳述
- 對 `diffSummary.changed` vs `bytesChanged` 之 semantic gap 做明確分離
- 對 Phase 4.5a §9.3 已預警之 risk 做 production-content quantify
- 對至少 4 個 mitigation 候選方向做多維 trade-off 比較
- 對 Phase 4.5e source 動作之 acceptance gate 做最低要求列舉
- 對保守 phase sequence（4.5e-a / 4.5e-b / 4.5e-c / 4.5e-d / 4.5e-real-write）做拆批建議

### 1.3 Out of scope（本文件不做）

- ❌ **不**修改 `src/scripts/admin-write-cli.js`
- ❌ **不**修改 `src/scripts/safe-write.js`
- ❌ **不**修改 `src/scripts/admin-write-whitelist.js`
- ❌ **不**修改 `src/scripts/admin-field-validators.js`
- ❌ **不**修改 `src/scripts/safe-write-test.js`
- ❌ **不**修改 `package.json` / `package-lock.json`
- ❌ **不**修改 `vite.config.js`
- ❌ **不**修改 `content/**`（含 settings / templates / validation-fixtures / posts / pages）
- ❌ **不**修改 `dist/**` / `dist-blogger/**` / `dist-promotion/**` / `dist-reports/**` / `gh-pages/**` / `.cache/**`
- ❌ **不**修改 `docs/admin-2-write-pre-analysis.md`（§15.G.4 已 surface；本文件展開）
- ❌ **不** `npm install`；**不**引新 dep；**不**升級 `gray-matter` / `js-yaml`
- ❌ **不** build / **不** deploy / **不** Blogger repost / **不** GA4 validation
- ❌ **不**新增 fixture
- ❌ **不**寫入任何 content；**不**啟動 real write；**不**啟用 Admin Apply；**不**實作 middleware route
- ❌ **不** `git fetch` / **不** commit / **不** push（本文件交付後由 user 決定是否 commit）

### 1.4 Non-goals 明列

per spec：

- ❌ no source implementation
- ❌ no `--apply`
- ❌ no `dryRun:false`
- ❌ no content rewrite
- ❌ no Admin Apply enable
- ❌ no middleware route
- ❌ no fixture creation

---

## §2 Current state

### 2.1 Frozen baseline（cold-start verify）

| 項目 | 值 |
|---|---|
| Repo | `D:\github\blog-new\portable-blog-system` |
| Branch | `main` tracking `origin/main` |
| `git rev-parse HEAD` | `c7f5e288c629bb0794b533957218d9d8726fb608` |
| `git rev-parse origin/main` | `c7f5e288c629bb0794b533957218d9d8726fb608` |
| `git rev-list --left-right --count HEAD...origin/main` | `0 0` |
| Latest subject | `docs(admin): record cli dry-run acceptance checkpoint` |
| Short | `c7f5e28` |
| Working tree | clean |
| `npm run safe-write:test` | `104 pass / 0 fail` |
| `npm run validate:content` | `0 error(s) / 42 warning(s) on 37 post(s)` |

### 2.2 Carried-in phase landings

| Phase | Status | Landed | Note |
|---|---|---|---|
| Phase 2 safe-write helpers source | ✅ | `5bcdd02` | 5 helpers + CLI self-test |
| Phase 3b Admin dry-run UI source | ✅ | `efd3ac5` | Apply disabled；client-side preview only |
| Phase 3c docs checkpoint | ✅ | `e6d1855` | EOD report |
| Phase 4a middleware preanalysis docs | ✅ | `c8b7d74` | `docs/20260528-admin-write-phase-4-middleware-preanalysis.md` |
| Phase 4.5a CLI driver preanalysis docs | ✅ | `32f8951` | `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（1425 lines）|
| Phase 4.5c CLI source dry-run only | ✅ | `5efe83c` | `src/scripts/admin-write-cli.js`（455 lines）|
| Phase 4.5d CLI dry-run acceptance | ✅ done | — | 3 production `.md` cases；6 fail-safe spot checks；no commit |
| Phase 4.5c / 4.5d docs sync | ✅ | `c7f5e28` | §15.G.4 含 YAML drift caveat |
| **Phase 4.5e real-write gate** | ⏸ **hard-blocked** | — | 本文件為 4.5e 前置 mitigation 分析 |

### 2.3 CLI 目前狀態（per `5efe83c`）

- 路徑：`src/scripts/admin-write-cli.js`
- 行為：**dry-run only**
- `--apply` flag → reject with exit 2 / `apply-not-supported-in-phase-4p5c`
- `payload.dryRun: false` → reject with exit 2 / 同 reason
- 不 `import safeWrite`；無 production runtime caller for safeWrite
- 不呼叫 `fs.writeFile` / `fs.rename`
- 不 spawn git
- 對 `content/{github,blogger}/posts/*.md` 之 `description` / `searchDescription` 雙欄能跑 preview；輸出 `currentBytes` / `wouldWriteBytes` / `bytesDelta` / `diffSummary.changed` / `diffSummary.bytesChanged`

### 2.4 Phase 4.5e blocker（per §15.G.4）

`gray-matter` 內部 `js-yaml` emitter 對 inline arrays / indentation / quoting 有 normalize 行為。即使 CLI 只動 `description` 一個 field，stringify 後**整檔 frontmatter** 可能被重排，產生**非目標 sections**之 byte drift。在 dry-run 路徑此差異無害（CLI 不寫檔）；但若 `--apply` 解開，real write 將把該 drift commit 入 git，產生：

1. `git diff` 顯示遠超 SEO 雙欄之變動範圍
2. user 之 `git add <file>` 包含未審查之 YAML 重排
3. 多次 real write 累積後，所有 production frontmatter 之手寫格式被同質化
4. review / audit / blame 之 signal-to-noise ratio 大幅降低

→ 在 mitigation 設計 + 簽收前，Phase 4.5e 之 `--apply` **不得**解開；Phase 4.5e 仍 ⏸ blocked。

---

## §3 Problem statement

### 3.1 `diffSummary.changed` 與 `bytesChanged` 之 semantic gap

CLI（per `admin-write-cli.js` lines 396-397）計算兩個獨立信號：

| 信號 | 計算式 | 語意 |
|---|---|---|
| `diffSummary.changed` | `payload.newValue !== payload.expectedOldValue` | 「**目標 field 之 string value** 是否真的變了」|
| `diffSummary.bytesChanged` | `newContent !== currentContent` | 「**整檔 stringify 後** bytes 是否與原檔一致」|

兩者**不等價**。在 production frontmatter 上，`changed: false`（no-op）仍可導致 `bytesChanged: true`。

### 3.2 `matter.stringify` 會 normalize YAML

`matter.stringify(body, data)` 之 pipeline：

1. `data` → `js-yaml` `dump(data, options)` → YAML string
2. 拼接 frontmatter delimiter（`---\n` ... `\n---\n`）
3. 接 body

`js-yaml` `dump` 之 default options（在 `gray-matter` 預設下）對下列 surface 都會做 normalize：

| 來源樣式 | 預設 emitter 行為 |
|---|---|
| Inline flow array `tags: ["a", "b", "c"]` | 改寫為 block style `tags:\n  - a\n  - b\n  - c` |
| 字串 quoting（`"foo"` vs `foo`）| 依 emitter 啟發式重判（含 colon / special char 才 quote）|
| 縮排 step | 統一為 dump option `indent`（default 2）|
| 空值（`""` / `null`）| 依 emitter rule 選擇代表式 |
| Key 排序 | 保留 JS object key insertion order（但 spread `{ ...currentFm, [field]: newValue }` 之 insertion 行為依 Node version 而定，雖一致為 insertion-ordered 但可能與原檔 key 順序**不同**——當 `payload.field` 已存在於 `currentFm` 時 spread 不改順序；新增 key 才會 append 至尾端，本 phase 之 SEO 雙欄為既有 key，順序保留）|
| 行寬 `lineWidth` | default 80；超過自動折行 |

→ 對單純值 mutation，原檔 YAML 中**任一條**樣式偏離 emitter default，stringify 後即發生 byte drift。

### 3.3 No-op 也可能 `bytesChanged: true`

即使 user 提交 `newValue === expectedOldValue`（純測試 / 誤觸 / dry-run 試打），CLI mutation step：

```js
const newFm = { ...currentFm, [payload.field]: payload.newValue };
const newContent = matter.stringify(currentBody, newFm);
```

仍會跑完整 stringify。若原檔含任一非 default style，`newContent !== currentContent`。此非 bug；屬 emitter 之預期行為。

→ `bytesChanged` **不可**作為 mutation intent 之 proxy；只能作為 byte-level evidence。

### 3.4 Real write 路徑之風險

若 Phase 4.5e 在無 mitigation 下解開 `--apply`：

1. CLI 走完 dry-run path 之 11 步（per `admin-write-cli.js` lines 154-432）
2. CLI 呼叫 `checkGitStatus` → `safeWrite({ ..., newContent, ... })`
3. `safeWrite` 寫入 tmp → rename
4. 該 file 之新 content 包含**目標 field 之 mutation** **+ 整檔 frontmatter 之 emitter normalize**
5. `git diff <file>` 顯示**遠超**目標 field 之 diff hunk
6. `validate:content` 通常仍 pass（YAML 語法不變；schema 不變）→ post-write regression check 不會 catch
7. user 看到 `git diff` 後若仍 `git add` + `git commit`，drift 永久進入 git history
8. 多檔多次 write 後，所有 production frontmatter 之手寫風格被 emitter style 同質化

關鍵點：**SEO 雙欄是 string field（無 nested）**，其值之 mutation diff **無歧義**；歧義來自**其他 frontmatter sections**之被連帶重排。

---

## §4 Concrete evidence from Phase 4.5d

per `docs/admin-2-write-pre-analysis.md` §15.G.4 之 Phase 4.5d acceptance 紀錄。

### 4.1 Drift case：`content/github/posts/20260504-github-pages-blog-planning.md`

| 項目 | 值 |
|---|---|
| File | `content/github/posts/20260504-github-pages-blog-planning.md` |
| Site | `github` |
| Status | `ready` |
| Field | `description` |
| `newValue` | `"整理 GitHub Pages 免費空間限制與可搬家部落格規劃。"`（32 chars）|
| `expectedOldValue` | `"整理 GitHub Pages 免費空間限制與可搬家部落格規劃。"`（32 chars；同字串）|
| `diffSummary.changed` | `false` |
| `diffSummary.bytesChanged` | **`true`** |
| `currentBytes` | `1143` |
| `wouldWriteBytes` | `1111` |
| `bytesDelta` | **`−32`** |
| pre-/post-acceptance `git hash-object` | `533942b2905bb05c877939e6355f9738714bc9c4` / `533942b2905bb05c877939e6355f9738714bc9c4` ✅ identical（CLI 為 dry-run；不寫檔）|

### 4.2 推測之 normalize 來源

該檔 frontmatter（per Read at file head）含至少 3 條 emitter-sensitive surface：

1. **Inline flow array**：`tags: ["github", "vite", "static-site"]` — 預設 emitter 會改為 block style `tags:\n  - github\n  - vite\n  - static-site`。block style 比 inline flow **更長**或**更短**取決於 line width 與 quoting；對本檔結果為 **net −32 bytes**（推測：emitter 移除 quote / brackets / commas / spaces）
2. **Nested object 縮排**：`publishTargets.github.enabled` / `publishTargets.blogger.enabled` 之 2-space indent；若原檔曾混用 tab / 4-space / trailing space，會被 normalize
3. **Quoting heuristics**：原檔多用 `"..."` 包字串；emitter 可能對某些非歧義字串移除 quote（如純 ASCII 數字 / 中文字串）

註：本文件**不**重跑 `matter.stringify` 對該檔做精確 byte 拆解；屬 4.5e 實作前 prototype 的工作。本節僅作為設計 evidence 引用 §15.G.4 已紀錄之 `currentBytes 1143 → wouldWriteBytes 1111`。

### 4.3 對比 case 1 / case 3（有意 mutation）

| Case | Field | Intent | `changed` | `bytesChanged` | `bytesDelta` |
|---|---|---|---|---|---|
| 1 | `searchDescription` | 126→71 chars | true | true | −218 |
| 2 | `description` | no-op | **false** | **true** | **−32** |
| 3 | `description` | "" → 40 chars | true | true | +31 |

→ case 2 之 `bytesDelta = −32` 在「目標 field 0 bytes delta」下，意味**100% drift 來自非目標 sections**。case 1 / case 3 之 bytesDelta 亦含 emitter drift；只是 user intent delta 蓋過 drift signal，難以分離。

### 4.4 為何 Phase 4.5d acceptance 仍判 ✅

Phase 4.5d 之 acceptance 對象為**dry-run path 正確性**：

- CLI 不寫檔 → ✅
- pre/post hash identical → ✅
- payload 各 fail-safe gate 全部 reject 預期 case → ✅
- `validate:content` baseline 不退步 → ✅

Phase 4.5d **不**判定 `bytesChanged` 行為是否合理；只把它**正式 surface** 給 Phase 4.5e 處理。本文件 §3 / §4 / §5 即為該 surface 之後續分析。

---

## §5 Risk analysis

對「若 Phase 4.5e 在無 mitigation 下直接解開 `--apply`」之風險列舉。

### 5.1 Non-target frontmatter rewrite

- **現象**：mutate `description` 之 invocation，stringify 後 `tags` / `publishTargets` / `blocks` / `book` / `affiliate` / `images` / `relatedLinks` / `otherLinks` 等**任一**非目標 section 可能被 emitter 重排
- **可觀察**：`git diff <file>` 顯示遠超 1 行（SEO 雙欄）之 modify hunk
- **不可預測度**：高；emitter 行為取決於每檔 frontmatter 之原始手寫風格
- **跨檔差異**：每篇 production `.md` 之 drift pattern 可能不同；無法以單檔 sample 推論全集

### 5.2 SEO / content audit trail pollution

- **現象**：commit log 之「fix SEO description」commit，diff 包含未審查之 YAML 重排
- **下游影響**：
  - `git blame` 對非 SEO 行回到該 commit；歸因錯誤
  - PR review 之 reviewer 必須逐行確認 drift 是否安全；認知負荷高
  - 若 reviewer 漏看，潛在 schema 改變（如 `publishTargets.github.enabled` boolean → string）會混入
  - `git log -p <file>` 之歷史可讀性降低

### 5.3 expectedOldValue guard 之 scope 限制

- **現有保護**：CLI lines 342-357 之 `expectedOldValue` 對比僅守**目標 field**之 race condition
- **不守之 surface**：其他 frontmatter sections 之原始 bytes / 結構；外部對檔案之其他 mutation；emitter normalize 副作用
- **後果**：即使 `expectedOldValue` 完全對齊，user 在 dry-run 階段看到之 `wouldWriteBytes`仍可能包含 emitter drift；guard 對 drift **無覆蓋**

### 5.4 Reviewer diff noise

- **現象**：PR diff 從「1 行 SEO field 改動」變成「N 行 YAML 重排 + 1 行 SEO 改動」
- **規模**：對 case 2，net −32 bytes 在 frontmatter 內可達 5-15 行 modify（取決於 inline → block array 之展開）
- **後果**：
  - reviewer 必須區分「intended SEO mutation」與「emitter normalize」；認知負荷 +
  - 自動化 review tool（如 `code-review`）可能對 normalize 提出 false-positive findings
  - reviewer 對 drift 之審查標準不一致；team 內部 review policy 易分歧

### 5.5 Automated write 之累積風險

- **現象**：Phase 4.5e+ 若擴至 Admin UI 批量 SEO write，每次 invocation 都觸發 emitter normalize
- **累積效應**：
  - 100 篇 production `.md` × 平均 5 行 normalize = 500 行 drift 進入 git history
  - 一旦 emitter style 之 normalize 完成，**後續再次 mutation 之 drift 趨近 0**（已 normalized；無偏離 emitter default 之 surface 可動）
  - 等價於「不可逆地把所有 frontmatter 同質化為 `gray-matter` style」

### 5.6 Attribution ambiguity

- **現象**：`git blame` 對被 normalize 過之行（如 `tags` 區塊）會指向**某次 SEO commit**，非「作者寫入該 tag 之 commit」
- **後果**：
  - 對 issue tracking 困難：「該 tag 為何被加入？」之 git blame 答案誤導
  - 對 release notes / changelog 自動生成（如未來 phase）困難
  - 對 multi-author 場景（雖本 repo 單作者，但保留 future scaling）治理性差

### 5.7 風險之 summary

| 風險 | 嚴重性 | 不可逆性 | 偵測難度 |
|---|---|---|---|
| Non-target rewrite | 高 | 高（commit 後）| 低（git diff 即見）|
| Audit trail pollution | 中 | 高 | 中（需 reviewer 主動審）|
| expectedOldValue scope 不足 | 中 | n/a（設計面）| 低 |
| Reviewer diff noise | 中 | 低（review 階段可 reject）| 低 |
| Automated write 累積 | 高 | 高（一次性同質化）| 中 |
| Attribution ambiguity | 低 | 高 | 高（需追溯 blame）|

→ 多數風險在 commit 後不可逆；意味 Phase 4.5e 之 acceptance gate 必須在 **fs.writeFile 前**捕獲 drift。

---

## §6 Candidate mitigation comparison

對 §15.G.4 已 surface 之 4 個方向（A / B / C / D）做多維 trade-off。每方向新增一致欄位：implementation complexity、safety、reviewability、compatibility with current content、effect on future Admin Apply、effect on Phase 5 middleware、whether requires content-wide rewrite、whether preserves comments / ordering / formatting、recommended / not recommended。

### 6.1 方向 A — Line-based / AST-aware field-preserving frontmatter patcher

**核心想法**：放棄 `matter.stringify` 之 round-trip；改用 line-based 或 AST-based patcher 只動目標 field 之 value bytes；保留其餘 raw bytes byte-identical。

**實作 shape（概念）**：

```text
1. 讀檔 → 找 frontmatter 區段（first `---\n` ... next `\n---\n`）
2. 在區段內 grep regex `^description: (.+)$` 或 `^description:\n((?: {2,}.+\n)+)$` (block scalar) 
3. 確認 match 唯一（無 nested duplicate key）
4. 取代 capture group bytes → 寫回 patched bytes
5. 其餘 frontmatter / body bytes 完全保留
```

| 維度 | 評估 |
|---|---|
| Implementation complexity | 高。需處理：inline string / quoted string / block scalar `|` / `>` / multi-line value / escape；需 fallback 與錯誤處理 |
| Safety | 高。非目標 sections **byte-exact preserved**；零 drift |
| Reviewability | 高。`git diff` 只見目標 field 一行（或數行 block scalar）|
| Compatibility with current content | 高。對所有 production `.md` 之 inline array / nested object / quoting / indentation **全部保留** |
| Effect on future Admin Apply | 正面。批量 SEO write 之 diff 一致乾淨 |
| Effect on Phase 5 middleware | 正面。middleware 可重用同 patcher；同 acceptance gate |
| Requires content-wide rewrite | ❌ 不需 |
| Preserves comments / ordering / formatting | ✅ 全保留（包含 YAML 內 line comment、空白行、key 順序）|
| Recommended | ✅ **推薦**（per §7）|

**風險**：

- regex 正確性：對 `description` 為 inline string `description: "..."` 易處理；對 block scalar（如 `description: \|\n  ...`）需多 case 支援
- 需單元測試覆蓋 inline / quoted / block scalar / empty / 含特殊 char 之 8+ 變形
- 對未來擴 field（如 `tags` array mutation）難重用；需 per-field patcher

**對 SEO 雙欄之適用性**：高。description / searchDescription 為 single-line string field；regex 規則簡單。

### 6.2 方向 B — Keep `matter.stringify` + bytes-drift fail-closed gate

**核心想法**：保留現有 `matter.stringify` 流程；但 pre-write 比對 byte drift 是否超過「目標 field 預期長度差」。超出 → 整檔 reject；user 必須手動排查。

**實作 shape（概念）**：

```text
expectedDelta = Buffer.byteLength(newValue, 'utf-8') - Buffer.byteLength(expectedOldValue, 'utf-8')
actualDelta = wouldWriteBytes - currentBytes
unexpectedDrift = actualDelta - expectedDelta

if (Math.abs(unexpectedDrift) > tolerance) {
  return { ok: false, reason: 'unexpected-yaml-drift', expectedDelta, actualDelta, unexpectedDrift };
}
```

`tolerance` 候選：
- `0`（最嚴）：任一 byte drift 都 reject；對 case 2（no-op）會 reject −32（drift）；對 case 1 / 3 可能 reject（drift 蓋在 intended delta 內難算）
- `≤ N`（寬鬆）：保留少量容差（如 newline 規範化）；但難 calibrate

| 維度 | 評估 |
|---|---|
| Implementation complexity | 低。CLI 加一段 byte-delta 對比 + fail-close branch |
| Safety | 中。**偵測**得到 drift；但**不修復**drift；user 必須先處理該檔之 emitter 偏離才能 SEO write |
| Reviewability | 中。對 user 之 message：「該檔不可 SEO write，請先 normalize frontmatter」；體驗較差 |
| Compatibility with current content | 低。在 tolerance=0 下，多數 production `.md` 都會 fail（每篇 frontmatter 都有 emitter-偏離 surface）→ 等於 hard-block 全部 SEO write |
| Effect on future Admin Apply | 中性偏負面。批量寫入需先處理 drift；變相要求方向 D（normalize-only commit）作為前置 |
| Effect on Phase 5 middleware | 中性。同 gate 可重用 |
| Requires content-wide rewrite | 取決於 tolerance：嚴格 → 變相要求方向 D；寬鬆 → 可能漏放 |
| Preserves comments / ordering / formatting | n/a（不主動寫入；只 gate）|
| Recommended | 🟡 **次選**（per §7；建議作為**任一方案之 defense-in-depth**，不單獨採用）|

**風險**：

- tolerance 設定難以 calibrate；user 易誤判
- 失敗 message 不可 actionable：user 不知如何處理該檔
- 變相把 mitigation burden 轉嫁給 user

**對 SEO 雙欄之適用性**：中。可作為 method A / C / D 之**附加 safety net**；單獨採用會把 phase 4.5e 變相 hard-block 大量 production posts。

### 6.3 方向 C — `js-yaml` emitter options tuning

**核心想法**：保留 `matter.stringify`；探索 `js-yaml` `dump` options 是否可逼近原檔 style，將 drift 降至接近 0。

**候選 options**（per `js-yaml` API）：

| Option | 候選值 | 效果 |
|---|---|---|
| `flowLevel` | `-1` / `0` / `1` / `Infinity` | 控制何時用 flow style；`Infinity` 全 block / `-1` default heuristic |
| `lineWidth` | `-1` / `80` / `120` / `Infinity` | 控制折行；`-1` / `Infinity` 不折 |
| `quotingType` | `'` / `"` | 預設 quote 字元 |
| `forceQuotes` | `true` / `false` | 強制 quote |
| `indent` | `2` / `4` | 縮排 step |
| `noCompatMode` | `true` / `false` | YAML 1.1 vs 1.2 compat |
| `noArrayIndent` | `true` / `false` | array 是否額外縮排 |
| `noRefs` | `true` / `false` | 是否輸出 anchor / alias |
| `skipInvalid` | `true` / `false` | invalid 跳過 |

| 維度 | 評估 |
|---|---|
| Implementation complexity | 低-中。需多輪實驗找 options 最佳組合；對 each production `.md` 跑 round-trip 驗 drift |
| Safety | 中。即使最佳 options，仍**無法 100%** 達 byte-identical（emitter 對 inline → block array 之選擇通常無 option 可逆）|
| Reviewability | 中。drift 降但未消；reviewer 仍需審 |
| Compatibility with current content | 中-低。inline flow array（如 `tags: [...]`）之還原能力**有限**；emitter 預設多選 block style |
| Effect on future Admin Apply | 中性。drift 降低；但未消 |
| Effect on Phase 5 middleware | 中性 |
| Requires content-wide rewrite | ❌ 不需 |
| Preserves comments / ordering / formatting | ❌ **不**保留 YAML inline comment（js-yaml dump 預設**丟棄**所有 comment；options 無法救）；ordering 保留（依 JS object insertion）|
| Recommended | ❌ **不推薦單獨採用**（comment loss 為硬傷；inline flow array 還原難達 0 drift）|

**關鍵硬傷**：

- **YAML inline comment loss**：`js-yaml` 之 `load` → `dump` round-trip **不保留** `# ...` 註解。若任一 production `.md` frontmatter 內含註解（如 `# TODO: refine description`），round-trip 後消失；不可逆
- **Inline flow array 還原**：`js-yaml` 預設 emitter 對 short array 之 `flowLevel` heuristic 難 exact 重現原檔；options tuning 有極限

**對 SEO 雙欄之適用性**：低。投入相對於收益小；不解決 comment loss；建議放棄此方向作為**單一 mitigation**。

### 6.4 方向 D — One-time normalize-only commit + 後續 SEO write

**核心想法**：先做一次**整個 content/{github,blogger}/posts/** 之 `matter.stringify` round-trip；單一 commit 把所有 frontmatter 同質化為 emitter style；之後所有 SEO write 之 drift 趨近 0。

**實作 shape（概念）**：

```text
1. 寫 normalize-only script（一次性；不接 `--apply` SEO write）
2. 對 ≥ 37 篇 production `.md` 逐檔讀 → matter.stringify → 寫回
3. 跑 validate:content；確認 0 regression
4. user 在 terminal 跑 git diff；逐檔 review；認可後 commit
5. commit message：`refactor(content): normalize frontmatter via gray-matter round-trip`
6. 之後 Phase 4.5e SEO write 之 emitter drift 即等於 0（檔案已 normalized）
```

| 維度 | 評估 |
|---|---|
| Implementation complexity | 中。需寫 normalize script + validate:content gate + manual review 流程 |
| Safety | 中-低。一次性 commit 把所有 frontmatter 同質化；不可逆 |
| Reviewability | **極低**。單 commit 涵蓋 37 篇 .md 之 YAML 重排；reviewer 難審；分批 commit 緩解但仍大量 |
| Compatibility with current content | 中。所有手寫 inline array / quoting / comment **不可逆地**轉成 emitter style；comment 永久 loss |
| Effect on future Admin Apply | 正面。後續所有 SEO write 之 drift = 0 |
| Effect on Phase 5 middleware | 正面 |
| Requires content-wide rewrite | ✅ **需要**（這是其本質）|
| Preserves comments / ordering / formatting | ❌ 全部不保留（comment loss；inline array → block；quoting heuristic 重判）|
| Recommended | ❌ **不推薦**（per §7；屬最後手段；user 顯式簽收後才考慮）|

**關鍵風險**：

- **Comment loss**：若任一 frontmatter 含 `# ...`，永久 loss
- **不可逆**：commit 後若發現問題，rollback 需 revert 整批
- **Review 壓力**：一筆大 commit 等於把 mitigation 推給 reviewer
- **Audit trail polluted in advance**：未來 `git blame` 對所有 frontmatter 行皆指向 normalize commit
- **與 CLAUDE.md 之保守工程化原則衝突**：本專案明示「第一版避免過度工程化」；對 production content 之大規模 emitter 風格化不符精神

**對 SEO 雙欄之適用性**：可行但屬最後手段；不應作為首選。

### 6.5 多維對比表

| 維度 | A (patcher) | B (drift gate) | C (emitter options) | D (normalize commit) |
|---|---|---|---|---|
| Implementation complexity | 高 | 低 | 低-中 | 中 |
| Safety | 高 | 中（偵測 only）| 中 | 低-中 |
| Reviewability | 高 | 中 | 中 | 低 |
| Compatibility | 高 | 低（tolerance=0 hard-block）| 中-低 | 中 |
| Future Admin Apply | 正面 | 中性偏負 | 中性 | 正面 |
| Phase 5 middleware | 正面 | 中性 | 中性 | 正面 |
| Content-wide rewrite | ❌ | ❌（直接）| ❌ | ✅ |
| Preserve comments | ✅ | n/a | ❌ | ❌ |
| Preserve ordering | ✅ | n/a | 部分 | 部分 |
| Preserve formatting | ✅ | n/a | ❌ | ❌ |
| Recommended | **✅ 首選** | 🟡 次選（附加防線） | ❌ | ❌ |

---

## §7 Recommended path

per memory `feedback_conservative_landing.md`（保守落地路線：multi-option 分析應將 warning-only / additive / fixture isolated / helper-first 之保守選項標推薦）。

### 7.1 推薦組合

**首選**：方向 A（field-preserving patcher）**+** 方向 B（bytes-drift fail-closed gate）**作為 defense-in-depth**。

理由：

1. 方向 A **不**需 content-wide rewrite；不污染既有 frontmatter；不丟 comment；reviewer-friendly
2. 方向 A 對 SEO 雙欄（description / searchDescription）之實作複雜度可控；它們是 single-string field
3. 方向 B 作為 A 之**最終 safety net**：即使 patcher 邏輯有漏（如未來新加 field），byte drift gate 在 pre-write 階段 fail closed；不寫入即不污染
4. 不需 `npm install`；不引新 dep；只用既有 `gray-matter` parse + custom patcher write
5. 對未來 Phase 5 middleware **可重用**同套 patcher（無需另設計）
6. 對 future field 擴增（titleEn / cover / coverAlt 等 string field）可同模式擴 patcher；對 array / nested object field 暫不解；屬 Phase 6+ scope

### 7.2 不推薦之決策

- **不推薦**：直接開 `--apply`。本文件 §3 / §5 已說明在無 mitigation 下 real write 風險不可逆
- **不推薦**：方向 D（normalize-only commit）作為 mitigation 首選。comment loss / audit pollution / 不可逆性違反本專案保守工程化原則；若 user 顯式簽收可作為**最後手段**
- **不推薦**：方向 C（emitter options tuning）作為單一 mitigation。inline comment loss 為硬傷；options 對 inline flow array 還原能力有限

### 7.3 若無法做到 field-preserving

per spec：「若無法做到 field-preserving，real write 應繼續 blocked。」

具體 fallback：

- 若方向 A 之 patcher 經 prototype 後判斷複雜度過高（如對 block scalar 之 edge case 太多）
- 若方向 A 之 patcher 對某類 production `.md` 之 frontmatter shape 無法處理（如未來引入新 schema）
- 兩者擇一發生 → Phase 4.5e 之 `--apply` **繼續 blocked**；CLI 維持 dry-run only；不退而求其次走方向 D

→ 「blocked」之狀態是**安全**狀態；不需強行解開

---

## §8 Proposed Phase 4.5e acceptance gate

per spec：「若要實作 mitigation，必須通過什麼條件」。本節定義 Phase 4.5e source 動作（spike / prototype / 正式實作）之**最低 acceptance gate**。

### 8.1 Behavior gates（runtime correctness）

| Gate | 條件 |
|---|---|
| G1 | no-op invocation（`payload.newValue === payload.expectedOldValue`）→ **no file mutation**（`fs.writeFile` 不觸發；no `.tmp` artifact；pre/post `git hash-object` identical）|
| G2 | changed target field invocation → **不重寫**非目標 frontmatter sections（diff 限於目標 field 之 single key/value）|
| G3 | dry-run 之 pre/post `git hash-object` 任一檔不變 |
| G4 | 對應 `bytesChanged`：若採方向 A，則 dry-run output 之 `bytesChanged` 等於 `(newValue bytes − oldValue bytes)`（含 quote 之 single-line case）或可由 patcher 之 expected delta 推導；若採方向 B，`unexpectedDrift` < tolerance；本 gate 之具體 byte threshold 由 4.5e-b prototype 階段於 production sample 上 calibrate |
| G5 | whitelist 模式若未開啟 / 異常 → 仍 fail-safe reject（per 既有 `safe-write.js` lines 47-50；不退化）|
| G6 | `dryRun:false` 在 mitigation 尚未通過 4.5e-c acceptance 前 → 繼續 reject（Phase 4.5c 之 fail-safe 行為保留）|

### 8.2 Test coverage gates

新增 / 擴 `safe-write-test.js` 或新 test module 必須覆蓋：

| Case | 描述 |
|---|---|
| T1 | **Inline array**：`tags: ["a", "b", "c"]`；patcher 對 description mutation 不動 tags 之 raw bytes |
| T2 | **Nested object**：`publishTargets: { github: {...}, blogger: {...} }`；patcher 不動 nested |
| T3 | **Affiliate links**：`affiliate.links: [...]`；patcher 不動 affiliate block |
| T4 | **relatedLinks / otherLinks**：array of objects；patcher 不動 |
| T5 | **Empty field**：`description: ""` → `"new content"`；patcher 正確改 empty quoted scalar |
| T6 | **Non-empty field**：`description: "old"` → `"new"`；patcher 正確 replace |
| T7 | **Field with special chars**：含中文 / `"` / `'` / `:` / `#` / newline-in-block-scalar；patcher quoting 不破壞 YAML 語法 |
| T8 | **Field not present**：frontmatter 缺 `description` key；patcher 行為（reject 或 insert）需明確；本文件建議 **reject**（4.5e source 不負責 schema migration）|

### 8.3 Dependency / config gates

| Gate | 條件 |
|---|---|
| D1 | **No package dependency change** unless explicitly approved by user。即不 `npm install`；不引 `yaml` / `yaml-ast-parser` / `js-yaml-parser` 等替代 lib（除非 user 顯式簽收）|
| D2 | **No `package.json` / `package-lock.json` mutation** unless approved |
| D3 | **No `vite.config.js` mutation**（middleware 不在 4.5e scope）|
| D4 | **No CLAUDE.md / `docs/admin-2-write-pre-analysis.md` mutation**（屬獨立 docs sync phase）|

### 8.4 Baseline gates

| Gate | 條件 |
|---|---|
| B1 | `npm run safe-write:test` baseline 維持綠（**至少** 104/0；mitigation 實作之新 test 加上應大於 104）|
| B2 | `npm run validate:content` 維持 `0 errors / 42 warnings / 37 posts`（mitigation 不應改 production content；不應改 validator 行為）|
| B3 | `git status --short --branch` 維持 clean 直至 Phase 4.5e-real-write 階段；mitigation source 落地後在 acceptance 階段 working tree clean |
| B4 | `safe-write-test.js` 對舊 case 不退化；新 case 為 additive |

### 8.5 Process gates

| Gate | 條件 |
|---|---|
| P1 | mitigation source landing 不啟動 `--apply` |
| P2 | mitigation source landing 不啟動 `dryRun:false` |
| P3 | mitigation 之 dry-run acceptance 對 ≥ 3 篇 production `.md`（含 inline array + nested object）驗 G1-G4；無 production content mutate |
| P4 | docs sync 在 mitigation acceptance 後再做（單獨 phase）|
| P5 | real write 開放（4.5e-real-write）需獨立 user approval；不繼承 4.5e mitigation acceptance 之 approval |

---

## §9 Proposed next phases

per spec：「保守 phase sequence」。對 Phase 4.5e 之拆批建議：

| Phase | Kind | 目標 | Source 範圍 |
|---|---|---|---|
| **4.5e-a** | docs-only | 本文件落地後之 acceptance cross-check（read-only verify）| no commit；或單純 docs sync at `docs/admin-2-write-pre-analysis.md` §15.G（獨立 phase 4.5e-a-docs-sync）|
| **4.5e-b** | source spike / prototype | 在 isolated branch 或 worktree 對方向 A patcher 做 minimum viable prototype；輸出 line-based / regex-based 之 description/searchDescription patcher；對 production `.md` 跑 dry-run；驗 G2 / G3 / G4 | 新增 `src/scripts/admin-frontmatter-patcher.js`（或 inline 進 admin-write-cli.js）；新增對應 unit test；仍 dry-run only；`--apply` 仍 reject |
| **4.5e-c** | dry-run acceptance | 對 ≥ 3 篇 production `.md`（含 inline array + nested object）跑 mitigation 後之 dry-run；驗 §8 之 G1-G4 / T1-T8；pre/post `git hash-object` identical | 無 source change；acceptance only |
| **4.5e-d** | docs sync | 把 4.5e-b / 4.5e-c 之結果記入 `docs/admin-2-write-pre-analysis.md` §15.G.5 新節 | docs-only |
| **4.5e-real-write** | gate | 獨立 user explicit approval；單篇 SEO 雙欄首寫；user 在 terminal 觀察 git diff 後手動 commit | 需 user 簽收；CLI 仍保留 fail-safe；首寫對象建議 draft / ready 之短 frontmatter `.md`（非含 nested affiliate / book schema 之長檔）|

### 9.1 Phase sequence 之保守性原則

- 每階段**最大 1 種 source change**
- 每階段**獨立 user approval**
- mitigation source landing 與 real write 不在同 phase
- docs sync 在每階段 source change 之後**另立 phase**
- 任一階段 baseline 退步即 hard-block 下一階段

### 9.2 與既有 phase 計畫之關係

- 不取代 `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md` §18 之 recommended sequence；屬其延伸
- 不解開 Phase 4.5a §19 列舉之 non-goals
- 不影響 reverse UTM source landing 之 dormant 狀態（per CLAUDE.md §16.4；屬獨立 phase pm-26）
- 不影響 sourceKey selector blocked 狀態（per §15.F 12 prerequisites）
- 不影響 Phase 5 middleware deferred 狀態（per §15.G phase 4）

---

## §10 Non-goals

per spec：明確列出本階段不做。

### 10.1 Source 動作不做

- ❌ no source implementation（不寫 patcher；不寫 byte-drift gate；不擴 CLI；不擴 safeWrite；不擴 validator；不擴 whitelist）
- ❌ no `--apply`（CLI `--apply` flag 維持 fail-safe reject）
- ❌ no `dryRun:false`（payload `dryRun:false` 維持 fail-safe reject）
- ❌ no content rewrite（不動任一 `content/**` 檔；不做 normalize-only commit）

### 10.2 Surface 動作不做

- ❌ no Admin Apply enable（Phase 3b 之 disabled Apply button 維持）
- ❌ no middleware route（`vite.config.js` 之 `configureServer` 維持空）
- ❌ no fixture creation（不新增 `content/validation-fixtures/**`；不新增 OS temp fixture；不在 repo 內留下 acceptance artifact）

### 10.3 Infra / dep 動作不做

- ❌ no `npm install`
- ❌ no `package.json` / `package-lock.json` mutation
- ❌ no dep upgrade（`gray-matter` / `js-yaml` 維持既有版本）
- ❌ no `vite.config.js` mutation

### 10.4 Build / deploy 動作不做

- ❌ no build（`npm run build` / `build:github` / `build:blogger` 任一不跑）
- ❌ no deploy（`gh-pages/**` 不動）
- ❌ no Blogger repost
- ❌ no GA4 validation

### 10.5 Git 動作不做

- ❌ no `git fetch`
- ❌ no commit（本文件交付後由 user 在 terminal 手動 review / commit）
- ❌ no push

### 10.6 Docs 動作不做（本 phase）

- ❌ no mutation to `docs/admin-2-write-pre-analysis.md`（屬獨立 docs sync phase；本 phase 只新增本檔）
- ❌ no mutation to `CLAUDE.md`
- ❌ no mutation to `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（屬 4.5a 已 landed docs）
- ❌ no mutation to `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`

---

## §11 Acceptance summary（本 phase 自身 acceptance）

本文件落地之 acceptance 檢核：

| 項目 | 期待 |
|---|---|
| 新增檔案 | `docs/20260528-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis.md` 1 file |
| 修改檔案 | 0 file |
| 刪除檔案 | 0 file |
| `npm run safe-write:test` | `104 pass / 0 fail`（與 baseline 一致；本 phase 不動 src）|
| `npm run validate:content` | `0 errors / 42 warnings / 37 posts`（與 baseline 一致；本 phase 不動 content）|
| `git status --short --branch` | 1 個 untracked file（本檔）；其他 clean |
| Baseline HEAD | `c7f5e28`（與 origin/main 一致；ahead/behind 0/0）|
| 是否 commit | **建議**user 在 terminal 手動 commit；本文件不自動 commit |
| 建議 commit message | `docs(admin): analyze yaml drift mitigation for cli writes` |

---

## §12 影響分類編號（per CLAUDE.md §7）

本次影響：

```text
A-XX docs/20260528-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis.md（新增；docs-only）
```

不影響：

```text
B 全站設定資料
C 內容資料 / Markdown 文章
D 前台頁面模板
E Blogger 匯出系統
F GitHub 靜態站系統
G 設計系統頁
H SCSS / Design Token / 元件樣式
I JavaScript 互動功能
J SEO / GA4 / AdSense / 追蹤
K Promotion / FB 推廣文案
L Build Script / 工具程式（含 src/scripts/admin-write-cli.js / safe-write.js / 等；皆不動）
M 素材 / 圖片 / 原始檔管理
N 發布 / 備份 / 檢查清單
Z 第二階段暫緩功能
```

---

## §13 EOF reservations

- 本文件 **不**選定 mitigation 方案；屬 user 簽收後另立 phase 4.5e-b prototype 之決策範圍
- 本文件 §6 之 trade-off 為**設計分析**；非實作承諾；prototype 階段可調整
- 本文件 §8 之 acceptance gate 為**最低要求**；prototype 階段可加嚴
- 本文件 §9 之 phase sequence 為**保守拆批建議**；user 可選擇合併部分階段（如 4.5e-c + 4.5e-d 合一）；但**不**建議合併 4.5e-b + 4.5e-real-write
- Phase 4.5e 在 mitigation source landing + acceptance 通過前，`--apply` 持續 hard-block；CLI 維持 dry-run only
- pm-26 deploy gate / reverse UTM dormant 狀態不受本 phase 影響
- 本文件預期生命週期：至 Phase 4.5e mitigation source landing + docs sync 後封存；不應再被擴充
