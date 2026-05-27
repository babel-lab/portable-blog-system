# Admin Write Infra Phase 4.5 — CLI Write Driver Pre-analysis (docs-only)

Phase: `20260527-night-13-admin-write-phase-4p5-cli-driver-preanalysis-docs-only-a`
Date: 2026-05-27 23:22 +0800（cold-start verify 於 2026-05-27 23:22 +0800）
Status: 🔄 docs-only pre-analysis；不啟動 source change；不實作 CLI；不啟用 actual write path；不解開 browser → Node fs 通道

本文件為 Admin Write Infra **Phase 4.5（CLI write driver）** 之**啟動前盤點 + 設計分析**；屬 `docs/admin-2-write-pre-analysis.md` §15.G phase 4.5 之 pre-analysis 階段，亦對齊 `docs/20260528-admin-write-phase-4-middleware-preanalysis.md` §15.3 候選 A。本文件落地後，phase 4.5 之**source 實作**仍由 user 簽收方案後另立 phase 4.5c 拆批執行；本文件**不**啟動任何 CLI source。

本 phase 唯一 source 動作為新增本文件單檔；無其他 source / content / settings / templates / fixtures / dist / package / vite config 變動。

---

## §1 Phase metadata

| 項目 | 值 |
|---|---|
| Phase name | `20260527-night-13-admin-write-phase-4p5-cli-driver-preanalysis-docs-only-a` |
| Date | 2026-05-27 23:22 +0800 |
| Baseline HEAD | `c8b7d74d8a3d4721bf2583a8086cbcc1322fcba4`（short `c8b7d74`）|
| Latest subject | `docs(admin): plan phase 4 vite write middleware` |
| Branch | `main` tracking `origin/main`；ahead/behind `0/0`；working tree clean |
| `safe-write:test` baseline | `71 pass / 0 fail` |
| `validate:content` baseline | `0 errors / 42 warnings / 37 posts` |
| Trigger | Phase 4a docs-only `c8b7d74` 落定；user 選擇進入 §15.3 候選 A（CLI write driver 過渡層）|
| Purpose | 把 Phase 4 middleware 與 Phase 6 首次 production write 之間的過渡層 — CLI write driver — 整理成正式可審查 docs-only 設計文件，作為 Phase 4 middleware 之前的低風險 surface alternative |
| Scope | 新增單一 docs 檔；無 source change；無 content change；無 fixture change；無 dist / settings / template / package / vite config 變動 |
| Non-goals | 見 §19 |

### 1.1 Carried-in phase landings

| Phase | Status | Landed commit | Note |
|---|---|---|---|
| Phase 2（safe-write helper source）| ✅ | `5bcdd02` (2026-05-27 21:00) | 5 helpers + 1 CLI self-test + 1 npm script |
| Phase 3a docs preanalysis | ✅ | `a44e0c2` (2026-05-27) | `docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md` |
| Phase 3b dry-run UI source | ✅ | `efd3ac5` (2026-05-27 night-9) | +116 lines；EJS Apply disabled + validator preview + readiness checklist |
| Phase 3c docs checkpoint | ✅ | `e6d1855` (2026-05-27 night-11) | EOD report 補 phase 3b checkpoint |
| Phase 4a middleware preanalysis | ✅ | `c8b7d74` (2026-05-27 night-12) | `docs/20260528-admin-write-phase-4-middleware-preanalysis.md` |
| Phase 4b acceptance cross-check | ⏸ | — | read-only；docs sync 待 user 決定何時跑 |
| Phase 4.5a 本 phase | 🔄 | （pending commit）| 本文件 |

→ Phase 4 middleware 設計已落定；本 phase 評估如何**設計** CLI 作為 middleware 之前的過渡層，但**不**實作。

---

## §2 Current baseline summary

### 2.1 Phase 3b Admin dry-run UI 狀態（per `efd3ac5`）

- `src/views/admin/index.ejs`（~1003+ LOC）：
  - SEO dry-run viewer（client-side diff；4 fields）+ FB sidecar dry-run editor（client-side simulation；12 fields）；皆 **client-side only**；無 fs.write；無 fetch
  - 4 個 SEO + 4 個 FB inline validator preview；server-side pre-computed by `load-admin-posts.js` → render 端純顯示
  - **Disabled** Apply button × 2（`.apply-disabled`；`disabled` + `aria-disabled` + cursor not-allowed）；無 click handler；無 fetch / XHR
  - Future write readiness checklist（4-row Phase 2 ✅ / Phase 3 ✅ / Phase 4 ⏸ / Phase 5 ⏸）
- `src/scripts/load-admin-posts.js`：import 5 validators → `toAdminView` pre-compute `seoValidation` + `fbValidation`；attach 至 return；不寫入；不 spawn

→ Admin UI 視覺上已呈現「可寫入」之 affordance，但 runtime 與 fs 之間**完全隔離**。

### 2.2 Phase 4a middleware preanalysis 已 landed（per `c8b7d74`）

per `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`：

- §4 完整描述 Vite `configureServer` middleware 之 endpoint shape / dev-only gate / CSRF token / origin / method / content-type / size limit / JSON parse 規則
- §5 完整描述 request payload schema（targetRel / field / newValue / expectedOldValue / dryRun / csrfToken）
- §6 完整描述允許 / 禁止 write scope（`content/{github,blogger}/posts/*.md` + SEO field-pair）
- §7 完整描述 atomic write flow（git clean → whitelist → validator → expectedOldValue → tmp → rename）
- §11 完整描述 failure handling matrix（13 種 status code）
- §13 完整描述 security boundary（LAN / CSRF / prod build leakage / path traversal / arbitrary field / overbroad write）
- §15.3 候選 A：**CLI write driver** 作為 middleware 前過渡層；本文件展開細節

→ Phase 4 middleware 設計**已**落定；本 phase 為 §15.3 候選 A 之展開。

### 2.3 Phase 4b acceptance 全綠

- baseline HEAD = `c8b7d74` = origin/main；ahead/behind 0/0
- working tree clean
- `npm run safe-write:test` = 71/0
- `npm run validate:content` = 0/42/37
- 無 source / content / config drift；docs 增量唯一

### 2.4 safe-write infra 狀態（per Phase 2 landing `5bcdd02`）

| 元件 | 檔案 | LOC | 角色 |
|---|---|---|---|
| safe-write helper | `src/scripts/safe-write.js` | 106 | whitelist → git-status (caller-supplied) → validators → tmp write → rename；失敗清 `.tmp`；不 spawn git |
| git status check | `src/scripts/git-status-check.js` | 66 | `spawn('git', ['status', '--porcelain'])`；5s timeout；4 graceful reason；不修改 git 狀態 |
| write target whitelist | `src/scripts/admin-write-whitelist.js` | 72 | 只允 `content/{github,blogger}/posts/*.{md,publish.json,fb.md}`；`..` / 跨 drive / 非 absolute / 非 4-part rel → 拒 |
| field validators | `src/scripts/admin-field-validators.js` | 94 | 8 個 validator + `LIMITS`（description 1000 / search 500 / titleEn 200 / cover 500 / coverAlt 500） |
| active source keys | `src/scripts/active-source-keys.js` | 33 | `buildActiveSourceKeySet(settings)` / `loadActiveSourceKeySet(projectRoot)` |
| CLI self-test | `src/scripts/safe-write-test.js` | — | `npm run safe-write:test`；71 cases |

→ Helper API 已 ready；**無** runtime caller 對 production content 寫入；本 phase 評估 CLI 作為**首個 runtime caller** 之 shape 與 gate。

### 2.5 目前仍無 CLI write driver

- `ls src/scripts/` → 無 `admin-write-cli.js` / `admin-write.js` / `write-cli.js` 等檔
- `package.json` → 無 `admin:write` / `admin-write` / `write` 等 script
- `grep -rn 'safeWrite(' src/` → 0 runtime caller（唯一命中為 `safe-write.js` self-export 與 `safe-write-test.js` self-test）

→ Phase 4.5 若實作，CLI 為**首個** production content write 路徑；但本 phase docs-only。

### 2.6 目前仍無 Vite middleware / write route

- `grep -rn 'configureServer\|app.use\|app.post' src/ vite.config.js` → 0 命中
- `grep -rn 'fetch(\|XMLHttpRequest\|fs.writeFile\|fs.rename' src/views/admin/` → 0 runtime 命中

→ browser ↔ Node fs 通道**完全未開**；CLI 路徑屬獨立於 middleware 之過渡 surface。

### 2.7 baseline gates（cold-start verify）

- `pwd` = `D:\github\blog-new\portable-blog-system` ✅
- `git rev-parse HEAD` = `c8b7d74d8a3d4721bf2583a8086cbcc1322fcba4` ✅
- `git rev-parse origin/main` = `c8b7d74d8a3d4721bf2583a8086cbcc1322fcba4` ✅
- `git rev-list --left-right --count HEAD...origin/main` = `0 0` ✅
- `git status --short --branch` = `## main...origin/main`（clean）✅
- `npm run safe-write:test` = `71 pass / 0 fail` ✅
- `npm run validate:content` = `0 error(s) / 42 warning(s) on 37 post(s)` ✅

---

## §3 Why Phase 4.5 CLI exists

### 3.1 不直接進 Phase 5 middleware 的原因

per Phase 4a §15.3 候選 A 之承諾，Phase 4 middleware 與 Phase 6 首次 production write 之間存在**兩條獨立風險面**：

| 風險面 | 屬性 | 是否與 middleware 同時引入 |
|---|---|---|
| browser → Node fs 通道首次解開 | 新 HTTP endpoint surface；CSRF / origin / LAN exposure / prod leakage 等 | Phase 5 middleware 解開 |
| `safeWrite` 對 production content 之首次實寫 | git working tree mutation；frontmatter YAML 重 serialize；validator pass-through | Phase 6 首寫解開 |

若 Phase 5 → Phase 6 直接接，這兩條風險**同時**在首次 real write 那刻一起測試。失敗時 root cause 難以 localise（究竟是 middleware shape 錯、CSRF 漏、payload schema 對不上，還是 `matter.stringify` 對某段 frontmatter 重排造成 bit 不一致、或 validator 對 production 文章某種 corner case 失效？）。

CLI 把這兩條風險**錯開**：先用 CLI 把 `safeWrite` 對 production content 之行為驗到底，再回頭驗 middleware 的 HTTP surface。

### 3.2 browser → filesystem 通道仍是較高風險面

per Phase 4a §13：

- LAN exposure（`vite --host 0.0.0.0`）
- 同 browser 其他 tab CSRF
- production build leakage（middleware 不應入 dist）
- path traversal（client-controlled `targetRel`）
- arbitrary field write（client-controlled `field`）
- Origin / Referer / Host header 偽造
- CSRF token in-memory 管理 + EJS inject 之 wiring

每一條在 docs 階段都需要 mitigation；source 階段需要 acceptance test；任一漏失皆可能讓 dev server 變成本機 fs 之開口。

CLI 路徑**完全繞過**這層 surface：

- 無 HTTP endpoint；無 fetch / XHR
- 無 CSRF / Origin / Referer 概念
- 無 LAN exposure（CLI 跑在 user 之本機 terminal）
- 無 prod build leakage（CLI 不入 vite build pipeline）

### 3.3 CLI 可先驗證 safeWrite + git guard + validators + post-write validation

per `safe-write-test.js` 之 71 cases 已涵蓋：

- whitelist 拒收 non-content-folder / non-posts / extension 不符
- enforceCleanGit 對 dirty / clean / `ok: false` 之分支
- validator fail 對 abort 之保證
- tmp file 之 cleanup
- overwrite 流程
- type / required argument check

但這些**全部用 temp 目錄 + mock 內容**驗。對 production content（37 posts；含 book-review / tech-note / download / page；含長 frontmatter / 短 frontmatter / 雙語標題 / 巢狀 affiliate / 巢狀 download / `relatedLinks` / `otherLinks` / `book.authors[]`）之**真實 YAML 重 serialize** 行為，**尚未驗證**。

CLI 可在 dry-run mode 下對任一篇 production `.md` 跑：

- `safeWrite` whitelist 接受
- `gray-matter` parse 成功
- 任一 field mutate 後 `matter.stringify` 不對 body 做意外改寫
- `wouldWriteBytes` 與 `currentBytes` 差距合理
- `validateDescription` / `validateSearchDescription` 對 production 文章之既有值通過

→ 上述驗證**不**需 middleware；不需 browser；不需 HTTP；只需 CLI invoke。

### 3.4 CLI 可讓第一次 real content write 不經 browser

首次 production content write 是「不可逆」事件（雖然 git 可 restore；但 commit log 永遠有那一筆）。讓首次寫入發生在 user **可直接觀察 terminal 完整 trace**的位置（CLI），比發生在 browser DevTools console（middleware）更易 debug：

- CLI 之 stdout / stderr / exit code 為 deterministic
- CLI 可附上完整 payload JSON dump
- CLI 失敗時 user 立即看到完整 stack trace；不需 F12 → Network → Response body 解析
- CLI 寫入後可立即跑 `git diff` 在同 terminal context（不需切視窗）

### 3.5 CLI 是 Phase 5 middleware 前的低風險過渡層

Phase 4.5 → Phase 5 之過渡承諾：

| 維度 | Phase 4.5（CLI） | Phase 5（middleware） |
|---|---|---|
| HTTP surface | ❌ 無 | ✅ 開 `/__admin/write-preview` + `/__admin/write` |
| browser fetch | ❌ 無 | ✅ Admin UI fetch POST |
| Node fs write surface | ✅ 開（透過 safeWrite） | ✅ 開（同 safeWrite） |
| Production content write | 🟡 first write 可選 | ❌ Phase 5 仍 dryRun-only |
| safeWrite production caller | ✅ 首個 | ✅ 第二個 |
| 風險面 | safeWrite × production content | HTTP surface（middleware shape；CSRF；origin） |

→ CLI 落地 + 驗證後，Phase 5 middleware 之 acceptance criteria 可**單獨**聚焦 HTTP surface；不再需同步驗證 safeWrite 對 production content 行為。

---

## §4 CLI write driver design overview

本節之所有設計**不**實作；只描述 shape 與 expected behavior。

### 4.1 Command 建議

未來 npm script 名稱建議：

```bash
npm run admin:write -- <args>
```

理由：

- 與既有 `npm run safe-write:test` / `npm run validate:content` / `npm run validate:fb-tags` 風格一致（皆 `colon-separated`）
- `admin:write` 之 `admin:` namespace 與 admin route / `/admin/` 一致
- `--` 為 npm 之 arg-passthrough 慣例；後續 flag 不會被 npm 攔截

### 4.2 未來 source 檔位置建議

```text
src/scripts/admin-write-cli.js
```

理由：

- 與既有 `src/scripts/safe-write.js` / `src/scripts/safe-write-test.js` / `src/scripts/git-status-check.js` / `src/scripts/admin-field-validators.js` / `src/scripts/admin-write-whitelist.js` 同目錄
- `cli` 後綴明確區分「CLI driver」與「library helper」
- 不放 `bin/` 因為本專案無 `bin/` 目錄；維持既有結構

### 4.3 是否需要 package.json script

**Phase 4.5c source landing 時必要**：

```json
{
  "scripts": {
    "admin:write": "node src/scripts/admin-write-cli.js"
  }
}
```

理由：

- `node src/scripts/admin-write-cli.js` 之路徑長；user 易記憶錯
- npm script 自動處理 cwd / node version / shebang 跨平台

**本 phase docs-only**：**不**新增 npm script；**不**碰 `package.json`。

### 4.4 CLI input 方式

預設採 §5 之 candidate **B（JSON payload file）**為主；另支援 candidate **A（flags）**作為 quick mutation 對短欄位；不支援 candidate C（stdin）作為首批。詳見 §5。

### 4.5 stdout / stderr 格式

| stream | 用途 | 格式 |
|---|---|---|
| stdout | 主結果 JSON | 單一 JSON object；`{ ok, mode, ... }`；newline-terminated |
| stderr | 進度 / debug log | 多行；`[admin-write] <message>` 前綴；可 `--quiet` 抑制 |
| stdout 失敗時 | error JSON | `{ ok: false, reason, detail }`；exit code 非 0 |

理由：

- stdout 純 JSON 讓 future caller（如 Admin UI 之 CLI command preview generator）可 `JSON.parse(stdout)` 解析
- stderr 為人類可讀進度；不污染 stdout
- 不混 stdout / stderr，符合 Unix 慣例

### 4.6 Exit code 定義

詳見 §13；至少 10 種 exit code（0 success；1-9 errors）。

### 4.7 Windows PowerShell 相容性

CLI 必須在以下三種 shell 環境跑通：

| Shell | 啟動方式 | 需注意 |
|---|---|---|
| Windows PowerShell 5.1（`powershell.exe`） | 預設 | quote escape / `--` 分隔符 / `$` 字元 |
| PowerShell Core 7+（`pwsh`） | 用戶可選 | 同上；但 `$()` / `?:` 等 operator 不同 |
| Git Bash（`bash.exe`） | 用戶可選 | POSIX-like；quote escape 與 PowerShell 不同 |

具體需求：

- 不依賴 POSIX-only flag 形式（如 `--field=value` 而非 `--field value`，避免 PowerShell 對空白之解析歧義）
- 不依賴 single quote escape 形式（PowerShell 對 `'` 之解析與 bash 不同）
- 長文 value 之 quote 處理改用 payload file（避免 shell quote 噩夢；詳見 §5）
- shebang `#!/usr/bin/env node` 對 Windows 無用；改用 npm script 包裝（`node src/scripts/admin-write-cli.js`）

### 4.8 dry-run first 原則

per Phase 4a §9 + night-12 §9.1：

- **預設** `dryRun=true`
- real write **必須**顯式 `--apply` 或 payload `dryRun: false`
- 任何 mode confusion → fail-safe to dry-run

詳見 §10。

---

## §5 CLI command proposal

本節比較 3 種命令型態；user 簽收後決定首批 implement 哪一個。

### 5.1 Candidate A — flags style

```bash
npm run admin:write -- \
  --target=content/blogger/posts/some-slug.md \
  --field=description \
  --value="新的 SEO description 內容" \
  --expected-old="舊的 SEO description 內容" \
  --dry-run
```

real write：

```bash
npm run admin:write -- \
  --target=content/blogger/posts/some-slug.md \
  --field=description \
  --value="新的 SEO description 內容" \
  --expected-old="舊的 SEO description 內容" \
  --apply
```

**特性**：

- ✅ 易讀；單行 command 一目了然
- ✅ 適合短欄位（< 100 chars）
- ✅ 對 git history 友善：command 本身可貼進 commit message 作為 audit trail
- ❌ Windows PowerShell quote escape 噩夢：description 含 `"` / `'` / `$` / `` ` `` 時，需多層 escape；user 易錯
- ❌ 不適合長文（description 可達 1000 chars；search 500 chars）
- ❌ 行 length 超出 terminal 寬度時可讀性低
- ❌ shell history 可能洩漏完整 value（含敏感標題 / 描述）

**Windows PowerShell quote 風險範例**：

```powershell
# 假設 description 含 " 與 '：「他說："不可能"，但其實可行」
# 在 PowerShell 5.1 之 escape：
npm run admin:write -- --value="他說：`"不可能`"，但其實可行"
# 在 PowerShell Core：
npm run admin:write -- --value='他說：「不可能」，但其實可行'
# 在 Git Bash：
npm run admin:write -- --value="他說：\"不可能\"，但其實可行"
```

→ **同一 value 在三種 shell 之正確 escape 形式不同**；user 易混淆。

### 5.2 Candidate B — JSON payload file style（推薦首批）

```bash
# Step 1：手動建立 payload 檔
# .cache/admin-write-request.json（或任意 user 自選路徑；CLI 不限制位置）
{
  "targetRel": "content/blogger/posts/some-slug.md",
  "field": "description",
  "newValue": "新的 SEO description 內容；可含「中文」、英文 \"quote\"、$符號、`backtick`",
  "expectedOldValue": "舊的 SEO description 內容",
  "dryRun": true,
  "reason": "fix SEO description over-length warning"
}

# Step 2：跑 CLI
npm run admin:write -- --payload=.cache/admin-write-request.json
```

real write：

```bash
# 改 payload 內 dryRun: false 或 CLI 加 --apply
npm run admin:write -- --payload=.cache/admin-write-request.json --apply
```

**特性**：

- ✅ Shell quote 完全 sidestep：JSON file 內 quote 為 JSON spec；不受 shell 解析影響
- ✅ 適合長文（description 1000 / search 500）
- ✅ payload 為一級檔案：可保存 / review / re-run / git ignore
- ✅ 對未來 Admin UI 友善：UI 可 generate JSON file → 提示 user 在 terminal 跑 CLI（無需 fetch）
- ✅ 對 audit trail 友善：payload file 可 git add 作為 PR evidence（或刻意 git ignore）
- ✅ shell history 不洩漏 value
- ❌ 多一步：先寫檔再執行；不及 flags 直觀
- ❌ payload file 之 path 仍需 user 在 terminal 輸入；建議固定路徑（`.cache/admin-write-request.json`）

**.cache 已存在於 .gitignore**：per existing project structure，`.cache/` 為 build 中介物；payload file 放此目錄預設不入 git；user 若需 audit 可 explicit move 至 docs。

### 5.3 Candidate C — stdin JSON style

```bash
# Linux / macOS / Git Bash
cat .cache/admin-write-request.json | node src/scripts/admin-write-cli.js

# PowerShell
Get-Content .cache/admin-write-request.json | node src/scripts/admin-write-cli.js
```

**特性**：

- ✅ 與 B 同等 sidestep shell quote
- ✅ 對 pipeline / CI 友善（如未來 user 在 git hook 內跑）
- ❌ stdin redirect 在 Windows PowerShell 之語法（`Get-Content | node`）與 bash（`cat | node` 或 `< file`）不同；user 易混淆
- ❌ 無 file path 可供 audit；payload 只在 process memory
- ❌ user 須手動 `Get-Content`；比 `--payload=` 多一層 abstraction
- ❌ 對 Admin UI command preview generator 不友善（UI 端要 generate 一個包含 stdin redirect 之 command；跨 shell 不一致）

### 5.4 比較表

| 維度 | A (flags) | B (payload file) | C (stdin) |
|---|---|---|---|
| 易用性 | 短欄位高；長欄位低 | 中（多一步） | 中（多語法） |
| 安全性 | 中（shell history） | 高（檔案隔離） | 高（process memory） |
| 可審查性 | 高（command 直接） | 高（payload 為一級檔） | 低（無 file） |
| Windows shell 轉義風險 | 高 | 零 | 低（但仍需 shell-specific redirect） |
| 適合長文欄位 | ❌ | ✅ | ✅ |
| 適合未來 Admin UI command preview | ❌（shell-specific quote） | ✅（單一 JSON file + 單行 CLI command） | ❌（redirect syntax 跨 shell 不一致） |
| 推薦時機 | Phase 4.5d 之後選擇性加（短 SEO field 快速修正） | Phase 4.5c 首批 implement | Phase 4.5e 之後選擇性加（CI / hook 用） |

### 5.5 推薦組合

**Phase 4.5c source landing 首批**：

- **Required**：Candidate B（`--payload=<file>`）
- **Optional**：Candidate A 為 alias；只支援 short fields（description / searchDescription 雙欄；不支援其他）；遇 quote 怪異一律建議切 B
- **Deferred**：Candidate C 為 Phase 4.5e+ 候選；本批不開

理由：B 為 cover-all surface；A 為 ergonomic 補強；C 為 advanced 候選。User 若簽收 B-only，Phase 4.5c 可更窄。

---

## §6 Request payload minimum schema

### 6.1 Payload 形狀

```json
{
  "targetRel": "content/blogger/posts/<slug>.md",
  "field": "description",
  "newValue": "新的 SEO description 內容",
  "expectedOldValue": "舊的 SEO description 內容；CLI 用於 race-condition guard",
  "dryRun": true,
  "reason": "fix SEO description over-length warning"
}
```

### 6.2 欄位定義

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `targetRel` | string | ✅ | 必須為**相對路徑**；以 `content/blogger/posts/` 或 `content/github/posts/` 開頭；不含 `..`；不含 `\0`；CLI 端 `path.resolve(projectRoot, targetRel)` 後過 `isWriteAllowed`；fail → exit 4 |
| `field` | string | ✅ | enum `['description', 'searchDescription']`（Phase 4.5 設計階段固定 2 個；Phase 4.5e+ 酌情擴；本 phase 不開 list）；非 enum → exit 3 |
| `newValue` | string | ✅ | 必須 string；過對應 validator（`validateDescription` / `validateSearchDescription`）；fail → exit 7 |
| `expectedOldValue` | string | ✅ | 必須 string；CLI 端讀檔後對比 frontmatter 之 current value；不一致 → exit 6（race-condition guard）|
| `dryRun` | boolean | ✅ | `true` → preview only；`false` → real write；type 非 boolean → exit 3。若 CLI 同時收到 `--apply` flag，與 `dryRun: false` 等價；若 conflict（payload `dryRun: true` + CLI `--apply`）→ exit 3，避免歧義 |
| `reason` | string | ⭕ optional | 自由文 memo；CLI echo to stdout 結果 JSON 之 `meta.reason`；不影響寫入；不寫入 frontmatter |
| `memo` | string | ⭕ optional | alias of `reason`；二擇一；同時填 → exit 3 |

### 6.3 不允許之 payload 形狀

per 對齊 Phase 4a §5.3 之等價約束：

- ❌ **absolute path**：client 不可傳 `D:\github\...` 或 `/d/github/...`；CLI 端只接 relative；統一過 `path.resolve(projectRoot, targetRel)` + whitelist
- ❌ **任意 field**：固定 enum；不支援 `tags` / `category` / `publishTargets` / `status` / `cover` / `coverAlt` / `titleEn` / `blocks.*` / `relatedLinks` / `otherLinks` / `book.*` / `download.*` / `images.*` / `affiliate.*`
- ❌ **任意 content path**：固定 `content/{github,blogger}/posts/*.md`；不支援 `.publish.json` / `.fb.md` / `content/settings/**` / `content/templates/**` / `content/validation-fixtures/**` / `content/{github,blogger}/pages/**`
- ❌ **bulk payload**：一個 payload 只寫一個 field；不接受 `[{...}, {...}]` array；避免 partial failure 處理複雜度
- ❌ **bulk targets**：不接受 `targetRels: [...]` array
- ❌ **YAML / TOML payload**：只接 JSON；不接 YAML（避免 multi-format parser 與 frontmatter parser 混淆）

### 6.4 與 middleware payload 之關係

per Phase 4a §5：middleware payload 與本 CLI payload **完全同形**（除 middleware 需 `csrfToken`，CLI 無）。

理由：

- 同形 → 未來 Admin UI 可同時 generate middleware payload 與 CLI command preview；user 任選通道執行；payload 內容不變
- 同形 → Phase 5 middleware source 可重用 CLI 之 payload validator helper（減少 code drift）

---

## §7 Allowed write scope

### 7.1 初期允許範圍（Phase 4.5 設計階段固定）

| 維度 | 允許值 |
|---|---|
| 路徑 prefix | `content/blogger/posts/` 或 `content/github/posts/` |
| 副檔名 | `.md`（沿用 `admin-write-whitelist.js` classifyFilename 之 `post-md` kind） |
| field | `description` / `searchDescription`（SEO 雙欄）|
| 文章 status | `draft` 或 `ready`（per Phase 4a §6.3；不允寫 `published` 文章作為**首個 real write gate**；避免 live deploy regression） |
| 寫入動作 | 純 frontmatter mutate；body content bit-exact preserved |
| 寫入單檔上限 | 1 file per CLI invocation |
| 一次寫入欄位數 | 1 field per CLI invocation |

### 7.2 初期禁止範圍

per Phase 4a §6.2 之等價約束，CLI 端統一拒：

| 維度 | 禁止值 | 統一 exit code |
|---|---|---|
| `.publish.json` | 整類禁；改用既有 `npm run backfill:url` CLI | 4 |
| `.fb.md` | 整類禁；FB sidecar write 屬 §15.G phase 6（Phase 4.5 之後） | 4 |
| `relatedLinks` / `otherLinks` array mutation | 整類禁；屬 §15.F prereq #1-#12 + §15.G phase 10 | 4 |
| `book.*` / `download.*` / `affiliate.*` / `images.*` | 整類禁；屬 risky-editable 後段 | 4 |
| `category` / `tags` / `status` / `publishTargets` / `contentKind` | 整類禁；屬 Admin-2-c risky-editable | 4 |
| `slug` / `title` / `titleEn` / `publishedAt` / `date` / `id` | 整類禁；屬 routing / lifecycle / canonical identity；首次寫不開 | 4 |
| `content/settings/**` | 整類禁；屬全站 config；非 per-post | 4 |
| `content/templates/**` | 整類禁；屬作者範本 | 4 |
| `content/validation-fixtures/**` | 整類禁；屬 fixture | 4 |
| `content/{github,blogger}/pages/**` | 整類禁；屬固定頁；非 post | 4 |
| `dist/**` / `dist-blogger/**` / `dist-promotion/**` / `dist-reports/**` | 整類禁；屬 build output | 4 |
| `src/**` | 整類禁；屬 source code | 4 |
| `package.json` / `package-lock.json` | 整類禁；屬 dep 管理 | 4 |
| `vite.config.js` | 整類禁；屬 build config | 4 |
| `gh-pages/**` | 整類禁；屬 deploy artifact | 4 |
| `.cache/**` | 整類禁；屬 build 中介物（**payload file 可放此但寫入 target 不可放此**）| 4 |
| `node_modules/**` | 整類禁；屬 dep | 4 |
| **published 文章**（per frontmatter `status: published`）| 首期禁；避免 live deploy regression | 7（target-status-not-allowed；屬 validator-class fail） |

### 7.3 首次 SEO field write gate（per Phase 4a §6.3）

選定 SEO description / searchDescription 為首批理由完全沿用 Phase 4a：

1. 影響範圍最小：只動 frontmatter 雙欄；不影響 routing / build scope / lifecycle / GA4 / sitemap structure
2. 已有 validator：Phase 2 `validateDescription` / `validateSearchDescription` 已 ready；71/71 self-test 通過
3. 已有 dry-run UI：Phase 3b SEO dry-run viewer 已 wired；client-side diff 已驗證
4. 已有 readiness checklist：Phase 3b 已嵌入 4-row 進度顯示
5. downstream 風險最低：失敗只影響 SEO meta tag / OG description 顯示；無 routing / build scope 退步

**首篇寫入對象**：選一篇 `draft` 或 `ready` 之 `.md`；不選 `published`；不選 reverse UTM 涉及之 cross-link 文章（避免 pm-26 deploy gate 干擾）。

---

## §8 safeWrite reuse design

本節對齊既有 helper；CLI **不重新發明寫入流程**。

### 8.1 既有 helper 對 CLI 之 API surface

per `src/scripts/safe-write.js`（106 LOC）：

```js
export async function safeWrite({
  targetPath,          // CLI 計算之 absolute path
  newContent,          // CLI 計算之新 file content
  projectRoot,         // CLI process.cwd()
  validators,          // [(content) => { ok, error }] array
  gitStatus,           // caller-supplied; CLI 端呼叫 checkGitStatus
  enforceCleanGit,     // CLI 預設 true
})
```

CLI 完整 invoke 流程：

1. CLI parse args / payload
2. CLI 驗 payload shape（不交 safeWrite）
3. CLI `path.resolve(projectRoot, payload.targetRel)` → `targetPath`
4. CLI 讀檔 → gray-matter parse → 驗 expectedOldValue
5. CLI mutate frontmatter → `matter.stringify` → `newContent`
6. CLI build validators array（基於 `payload.field`）
7. CLI 若 `dryRun: true` → 印 diff summary；exit 0；不 invoke safeWrite
8. CLI 若 `dryRun: false`：
   - CLI 呼 `checkGitStatus({ cwd: projectRoot })` → `gitStatus`
   - CLI 呼 `safeWrite({ targetPath, newContent, projectRoot, validators, gitStatus, enforceCleanGit: true })`
   - safeWrite 內部：whitelist → validator → tmp write → rename → cleanup
9. CLI 後續：跑 `validate:content`；印結果；exit code

### 8.2 對齊既有 helper（不複製功能）

CLI **必須** import 既有 helper；不重 implement：

| Helper | CLI 使用方式 |
|---|---|
| `safe-write.js` | `import { safeWrite } from './safe-write.js'` |
| `git-status-check.js` | `import { checkGitStatus } from './git-status-check.js'` |
| `admin-write-whitelist.js` | safeWrite 內部已 import；CLI 不需直接 call（但 sanity check 可額外 import `isWriteAllowed` 提前 reject）|
| `admin-field-validators.js` | `import { validateDescription, validateSearchDescription } from './admin-field-validators.js'` |
| `gray-matter` | CLI 自身需 import；既有 dep（per package.json）|
| `safe-write-test.js` | CLI **不** import；test 為獨立 self-test；本 phase 不擴充 test |

### 8.3 CLI 只負責 parse / validate payload / 呼叫 safeWrite / 回報結果

CLI 之**唯一**新增 logic：

- argv / payload file parse
- payload shape validation（不在 safeWrite scope）
- frontmatter read / parse / mutate / stringify
- expectedOldValue 對比
- dry-run preview output
- stdout / stderr / exit code 格式化

CLI **不**新增：

- 新 whitelist 規則
- 新 validator
- 新 atomic write 流程
- 新 git mutation 動作
- 新 fs.write* helper

### 8.4 為什麼不擴 safeWrite

per `safe-write.js` 之設計承諾：

- safeWrite 為 **content-agnostic** helper：不解析 frontmatter；不驗 field；不對比 expectedOldValue；只接收 newContent string 與 validators array
- safeWrite 不 spawn git；不讀檔（只寫）；不解析 markdown / yaml
- safeWrite 之 API surface 經過 71 cases self-test 驗證；不應為 CLI 重新調整

CLI 應建立在 safeWrite **之上**；不修改其內部行為。

---

## §9 Atomic write flow

per Phase 4a §7 + §7.2 之等價約束；CLI 端流程：

### 9.1 完整 atomic flow（pseudo；本 phase 不實作）

```js
async function cliWrite(argv) {
  // 1. Parse argv → flags or payload file
  const payload = await loadPayload(argv);

  // 2. Validate payload shape
  const shape = validatePayloadShape(payload);
  if (!shape.ok) return exitWith(3, { reason: 'invalid-payload', detail: shape.error });

  // 3. Resolve target abs path + whitelist sanity
  const projectRoot = process.cwd();
  const targetAbs = path.resolve(projectRoot, payload.targetRel);
  if (!isWriteAllowed(targetAbs, projectRoot).ok) {
    return exitWith(4, { reason: 'forbidden-target' });
  }

  // 4. Read current file + parse frontmatter
  let current;
  try {
    current = await fs.readFile(targetAbs, 'utf-8');
  } catch (err) {
    return exitWith(8, { reason: 'read-failed', detail: err.message });
  }
  const { data: currentFm, content: currentBody } = matter(current);

  // 5. Status gate (draft/ready only)
  if (currentFm.status === 'published') {
    return exitWith(7, { reason: 'target-status-not-allowed', actualStatus: 'published' });
  }

  // 6. expectedOldValue check (race-condition guard)
  if (currentFm[payload.field] !== payload.expectedOldValue) {
    return exitWith(6, {
      reason: 'expected-old-value-mismatch',
      actualOldValue: currentFm[payload.field],
    });
  }

  // 7. Mutate frontmatter
  const newFm = { ...currentFm, [payload.field]: payload.newValue };
  const newContent = matter.stringify(currentBody, newFm);

  // 8. Build validators (one per field)
  const validators = [
    payload.field === 'description'
      ? (c) => validateDescription(matter(c).data.description)
      : (c) => validateSearchDescription(matter(c).data.searchDescription),
  ];

  // 9. dryRun branch
  if (payload.dryRun === true) {
    return exitWith(0, {
      mode: 'dry-run',
      wouldWriteBytes: Buffer.byteLength(newContent, 'utf-8'),
      currentBytes: Buffer.byteLength(current, 'utf-8'),
      diffSummary: { field: payload.field, oldLen: payload.expectedOldValue.length, newLen: payload.newValue.length },
      validators: { [payload.field]: { ok: true } },
    });
  }

  // 10. git status check
  const gitStatus = await checkGitStatus({ cwd: projectRoot });
  if (!gitStatus.ok) return exitWith(1, { reason: 'git-status-failed', detail: gitStatus.reason });
  if (!gitStatus.clean) return exitWith(5, { reason: 'git-dirty', dirtyFiles: gitStatus.dirtyFiles });

  // 11. safeWrite atomic
  const result = await safeWrite({
    targetPath: targetAbs,
    newContent,
    projectRoot,
    validators,
    gitStatus,
    enforceCleanGit: true,
  });
  if (!result.ok) {
    return exitWith(mapReasonToExit(result.reason), result);
  }

  // 12. Post-write validate:content (spawn child process)
  const validateResult = await runValidateContent({ projectRoot, timeoutMs: 30000 });

  // 13. Print result
  return exitWith(validateResult.regression ? 9 : 0, {
    mode: 'apply',
    writtenPath: result.writtenPath,
    validateBefore: validateResult.before,
    validateAfter: validateResult.after,
    regression: validateResult.regression,
    rollbackHint: `git restore ${payload.targetRel}`,
  });
}
```

### 9.2 Flow 對齊既有 safeWrite 之承諾

per `src/scripts/safe-write.js`：

1. ✅ **git clean check**：由 CLI 呼叫 `checkGitStatus()` 並傳入 safeWrite；safeWrite 自身**不 spawn git**
2. ✅ **whitelist check**：safeWrite 內部 `isWriteAllowed`；CLI 端額外 sanity（雙層備援）
3. ✅ **field validator**：safeWrite 之 `validators` array；fail → 不寫
4. ✅ **expectedOldValue check**：CLI 端手動讀檔對比；不入 safeWrite 內部（content-agnostic）
5. ✅ **gray-matter parse / stringify**：CLI 端執行；body content bit-exact preserved
6. ✅ **tmp write**：`fs.writeFile(targetPath + '.tmp', newContent, 'utf-8')`（safeWrite 內）
7. ✅ **rename**：`fs.rename(tmpPath, resolved)`；POSIX 原子；Windows NTFS 同檔系統亦原子（safeWrite 內）
8. ✅ **cleanup tmp on failure**：safeWrite catch block 內 `fs.unlink(tmpPath).catch(() => {})`
9. ✅ **no git mutation**：safeWrite 自身不 spawn git；CLI 也不 spawn git commit / restore / stash / reset
10. ✅ **no auto commit**：所有 commit 由 user 在 terminal 手動執行
11. ✅ **no auto push**：所有 push 由 user 手動
12. ✅ **no auto restore**：所有 rollback 由 user 手動 `git restore`

### 9.3 Body content bit-exact preservation 風險

per Phase 4a §7.3：

- `gray-matter` parse 後 `content` 為 body string（不含 frontmatter）
- `matter.stringify(content, data)` 寫回時 YAML emitter 可能改變 quote / indent 細節（如 `"foo"` ↔ `foo`；`-\n  - item` ↔ `[item]`）
- 對 production frontmatter 含 nested object（`book.authors[]` / `affiliate.links[]` / `images[]`）之文章，stringify 結果可能對非目標 field **誤改寫**

**本 phase docs-only**；不驗證實際差異。

**Phase 4.5c source landing 之 acceptance gate**：

- 對至少 3 篇 production `.md`（含 nested object）跑 dry-run；比較 `wouldWriteBytes` 與只動目標 field 之 expected bytes
- 若 byte 差距與 expected 不符 → 暫不 implement real write；先排查 YAML emitter 差異
- 必要時 mitigation：CLI 在 mutate 前 deep-clone frontmatter；保證未動 field 不被 normalize

### 9.4 Rename atomic 注意

per `safe-write.js`：

- POSIX `rename` 同 filesystem 為 atomic
- Windows NTFS 同 drive 為 atomic（`fs.rename` 對應 `MoveFileEx` w/ MOVEFILE_REPLACE_EXISTING）
- 跨 drive / 跨 filesystem 不 atomic；safeWrite 已 reject 跨 drive
- `.tmp` 與 target 同目錄；保證同 filesystem

---

## §10 Dry-run mode

### 10.1 Default behavior

`dryRun: true` 為 **CLI 預設**：

- 若 payload 未指定 `dryRun` → 視為 `true`
- 若 payload `dryRun: true` 且 CLI 無 `--apply` → dry-run
- 若 payload `dryRun: false` 或 CLI `--apply` → real write
- 若 payload `dryRun: true` + CLI `--apply` → conflict → exit 3（防誤觸）

### 10.2 dry-run 行為

- ❌ 不呼叫 `fs.writeFile`
- ❌ 不呼叫 `fs.rename`
- ❌ 不呼叫 `safeWrite`（CLI 在 dry-run branch 提前 return）
- ✅ 仍跑 payload shape / whitelist / status gate / expectedOldValue / validator
- 🟡 git status check：dry-run 階段**可**選擇不跑（不影響結果）或跑（只 warning；不 hard-block）；本 phase 推薦 **dry-run 階段不 enforce git clean**，理由：dry-run 為純觀察動作；git dirty 不影響 preview 結果；user 可在 dirty tree 下 preview 並決定是否 commit 後再 apply

### 10.3 dry-run output 形狀

stdout：

```json
{
  "ok": true,
  "mode": "dry-run",
  "wouldWriteBytes": 4321,
  "currentBytes": 4290,
  "diffSummary": {
    "field": "description",
    "oldLen": 80,
    "newLen": 95,
    "changed": true
  },
  "validators": { "description": { "ok": true } },
  "target": "content/blogger/posts/some-slug.md",
  "meta": { "reason": "fix SEO description over-length warning" }
}
```

stderr：

```
[admin-write] payload OK
[admin-write] target = content/blogger/posts/some-slug.md
[admin-write] field = description
[admin-write] status check = draft (allowed)
[admin-write] expectedOldValue match
[admin-write] validator: description = ok
[admin-write] mode = dry-run (no fs write)
[admin-write] diff: 4290 → 4321 bytes (+31)
[admin-write] PASS — run with --apply to actually write
```

### 10.4 dry-run pass 才能 real write

CLI **不**強制 user 必須先跑 dry-run 才能 apply（user 可一次 `--apply`）；但**強烈建議** workflow：

1. 第一次 invocation：`dryRun: true`（或省略）→ 看 stdout / stderr → 確認 diff 合理
2. 第二次 invocation：同 payload + `--apply` → real write
3. 第三次：在 terminal 跑 `git diff <target>` → 確認 mutate 範圍
4. 第四次：user 手動 `git add` + `git commit`

CLI **不**自動連續執行步驟 2 / 3 / 4；每步皆 user 手動。

### 10.5 real-write 必須額外帶 `--apply` 或 dryRun=false

```bash
# 必須二擇一
npm run admin:write -- --payload=.cache/req.json --apply
# 或 payload 內含 "dryRun": false
npm run admin:write -- --payload=.cache/req.json
```

兩種等價；conflict 為 exit 3。

---

## §11 Real-write gate

per Phase 4a §10.2 之等價約束；CLI 端首次 real write 之全部 gate：

### 11.1 Gate list（全部滿足才執行 fs.writeFile）

1. ✅ user 明確下 `--apply` 或 payload `dryRun: false`
2. ✅ git status clean（`checkGitStatus().clean === true`）
3. ✅ `expectedOldValue` 與 currentFm 對齊（無 race condition）
4. ✅ field validator pass（`validateDescription` / `validateSearchDescription` 對 newValue）
5. ✅ `targetRel` 為單一 ready/draft `.md` 文章；不為 published；不為 page
6. ✅ `field` 為 `description` 或 `searchDescription`（不含其他）
7. ✅ `safeWrite` 之 whitelist 接受（雙層備援）
8. ✅ tmp write + rename 成功
9. ✅ post-write `validate:content` 跑通；無 regression

### 11.2 失敗時 fallback

- Gate 1 failure → exit 3
- Gate 2 failure → exit 5
- Gate 3 failure → exit 6
- Gate 4 failure → exit 7
- Gate 5 failure → exit 7（target-status-not-allowed）or 4（forbidden target）
- Gate 6 failure → exit 3
- Gate 7 failure → exit 4
- Gate 8 failure → exit 8
- Gate 9 failure → exit 9

### 11.3 Real-write 後之 manual review 流程

CLI **不**自動 commit / push / restore；user 必須手動：

1. 看 `git diff <target>` → 確認只動 SEO field（無 YAML emitter 副作用）
2. 看 `git status` → 確認只有 1 file modified
3. 看 `npm run validate:content` → 確認 baseline 不退步
4. 若 OK → `git add <target>` + `git commit -m "..."`
5. 若不 OK → `git restore <target>`（rollback）

→ CLI 之**唯一** filesystem mutation 為單一 file 之 atomic write；無其他副作用。

---

## §12 Pre-write / post-write validation

### 12.1 Pre-write 階段

| 檢查項 | 觸發點 | 失敗 exit |
|---|---|---|
| argv / payload shape | CLI 起手 | 2 / 3 |
| targetRel 為 relative + 不含 `..` | CLI sanity check | 3 / 4 |
| `field` enum | CLI enum check | 3 |
| `field` validator | safeWrite validators array（CLI 預先建立） | 7 |
| targetRel whitelist | safeWrite 內部 `isWriteAllowed` | 4 |
| 讀檔成功 | CLI fs.readFile | 8 |
| frontmatter parse 成功 | CLI gray-matter | 8 |
| status === draft / ready | CLI 讀 currentFm | 7 |
| expectedOldValue match | CLI 對比 currentFm | 6 |
| git status clean | CLI `checkGitStatus` → safeWrite `enforceCleanGit` | 5 |

### 12.2 Post-write 階段

| 檢查項 | 動作 | 失敗處理 |
|---|---|---|
| validate:content baseline | spawn `node src/scripts/validate-content.js`；capture stdout 最後一行；30s timeout；compare before / after error / warning count | 若 error 或 warning 增加 → response 含 `regression: true` + before/after；exit 9；不自動 rollback；CLI 印 manual `git restore` 提示 |
| safe-write:test | **不**自動跑（test 與 prod content 無關；如 Phase 4a §8.3）；user 可手動 | — |

### 12.3 為什麼**不**同步跑 `safe-write:test`

per Phase 4a §8.3 之等價理由：

- `safe-write:test` 為 helper self-test（71 cases）；其驗證對象為 `safe-write.js` / `git-status-check.js` / `admin-write-whitelist.js` / `admin-field-validators.js` 本身
- 與 production content 寫入結果**無關**；每次寫 content 跑 self-test 是 noise
- 留給 user 在 CI / pre-commit / 手動驗證時跑；CLI 不負責

### 12.4 Validation failed 時之回報

stdout：

```json
{
  "ok": false,
  "reason": "validator-failed",
  "errors": [
    { "field": "description", "error": "description-too-long" }
  ]
}
```

post-write regression 例：

```json
{
  "ok": true,
  "writtenPath": "content/blogger/posts/some-slug.md",
  "regression": true,
  "validateBefore": "0 error(s) / 42 warning(s) on 37 post(s)",
  "validateAfter": "0 error(s) / 43 warning(s) on 37 post(s)",
  "rollbackHint": "git restore content/blogger/posts/some-slug.md"
}
```

stderr：

```
[admin-write] WARN — post-write validate:content regressed
[admin-write] before: 0 error / 42 warning / 37 posts
[admin-write] after:  0 error / 43 warning / 37 posts
[admin-write] Please review and consider rollback:
[admin-write]   git diff content/blogger/posts/some-slug.md
[admin-write]   git restore content/blogger/posts/some-slug.md
```

### 12.5 不自動修復 / 不自動 rollback

per Phase 4a §8.5：

- 不自動 `git restore`
- 不自動 `git stash`
- 不自動 `git reset`
- 不自動 revert 寫入
- 不自動 backup 至其他位置（git working tree 即 backup）

→ **任何**修復動作由 user 在 terminal 手動執行；CLI 只印提示

---

## §13 Error handling / exit codes

### 13.1 Exit code matrix

| Exit | reason code | 觸發條件 | stdout body |
|---|---|---|---|
| `0` | — | 成功（dry-run pass 或 apply pass without regression） | `{ ok: true, mode, ... }` |
| `1` | `unknown-error` / `git-status-failed` | 未分類錯誤；checkGitStatus 之 spawn 失敗 / timeout / exit nonzero | `{ ok: false, reason, detail }` |
| `2` | `invalid-args` | argv parse 失敗；`--payload` 未指定 / file 不存在；`--apply` 與 payload `dryRun: true` conflict | `{ ok: false, reason: 'invalid-args', detail }` |
| `3` | `invalid-payload` | payload 非 JSON / 非 object / 缺欄位 / 型別錯 / `field` 不在 enum / dryRun 非 boolean | `{ ok: false, reason: 'invalid-payload', missingFields, typeErrors }` |
| `4` | `forbidden-target` | safeWrite 之 isWriteAllowed 拒（含 `not-in-content-folder` / `not-in-posts-folder` / `site-folder-not-allowed` / `filename-extension-not-allowed`）；targetRel 為 absolute / 含 `..` / 含 `\0` | `{ ok: false, reason: 'forbidden-target', detail }` |
| `5` | `git-dirty` | git status `clean !== true` | `{ ok: false, reason: 'git-dirty', dirtyFiles, untracked }` |
| `6` | `expected-old-value-mismatch` | currentFm[field] !== payload.expectedOldValue | `{ ok: false, reason: 'expected-old-value-mismatch', actualOldValue }` |
| `7` | `validator-failed` / `target-status-not-allowed` | field validator fail（如 `description-too-long`）；target 文章 `status: published` | `{ ok: false, reason, errors }` |
| `8` | `filesystem-write-failed` / `read-failed` | 讀檔失敗（檔不存在 / permission）；safeWrite 之 `fs.writeFile` / `fs.rename` throw | `{ ok: false, reason, detail }` |
| `9` | `post-write-validation-failed` | post-write `validate:content` regression（error / warning count 增加） | `{ ok: true, writtenPath, regression: true, validateBefore, validateAfter, rollbackHint }`（注意：**寫入已成功**；只 regression；user 必須 manual review）|

### 13.2 Exit code 設計原則

- `0` = 完全成功（含 dry-run pass）
- `1` = 不可預期 / infra-level 錯誤
- `2-3` = caller side 錯誤（argv / payload shape）
- `4` = security boundary 錯誤（whitelist / target）
- `5-7` = pre-write gate 錯誤（git / race / validator）
- `8` = filesystem-level 錯誤
- `9` = 寫入成功但 downstream 退步（特殊 case；exit 非 0 但 `ok: true`）

### 13.3 Exit code 與 middleware status 之映射

per Phase 4a §11；CLI exit 與 middleware HTTP status 之 1-to-1 mapping：

| CLI exit | middleware status | reason |
|---|---|---|
| 0 | 200 | success |
| 1 | 500 | unknown / git-status-failed |
| 2 | 400 | invalid-args（CLI-only；middleware 無 argv）|
| 3 | 400 | invalid-payload |
| 4 | 403 | forbidden-target |
| 5 | 409 | git-dirty |
| 6 | 409 | expected-old-value-mismatch |
| 7 | 422 | validator-failed / target-status-not-allowed |
| 8 | 500 | filesystem-write-failed |
| 9 | 200 + `regression: true` | post-write-validation-failed（寫入成功；只 regression） |

→ Phase 5 middleware 之 reason code 可重用 CLI 之 reason code；減少 surface drift。

---

## §14 Rollback / recovery design

### 14.1 主策略：以 `git diff` / `git restore <path>` 為主

- 寫入後不自動 rollback
- 寫入後 CLI stderr 印 affected file + manual review hints
- stdout `rollbackHint` 字串 echo 完整 command；caller 可 parse

### 14.2 不自動 rollback / stash / reset

per Phase 4a §12 之等價承諾：

- CLI 不 spawn `git restore`
- CLI 不 spawn `git stash`
- CLI 不 spawn `git reset`
- CLI 不 spawn `git checkout`
- CLI 不回寫 expectedOldValue（不視為 rollback；avoid silent revert）

理由：

1. 自動 rollback 之 surface area 比寫入更大；同樣需 git status check / whitelist 等保護
2. user 看到 stderr hint 後可以**先看 git diff** → 確認改了什麼 → 再決定 restore 或 commit
3. CI / pre-commit hook / IDE git integration 已有完整 rollback workflow；CLI 不重複

### 14.3 CLI 應提示 affected file

寫入後 stderr 例：

```
[admin-write] ✅ wrote: content/blogger/posts/some-slug.md
[admin-write]    field: description
[admin-write]    bytes: 4290 → 4321 (+31)
[admin-write]    validate: 0 error / 42 warning / 37 posts → 0 error / 42 warning / 37 posts (no change)
[admin-write]
[admin-write] Manual review:
[admin-write]   git diff content/blogger/posts/some-slug.md
[admin-write]
[admin-write] If OK, commit:
[admin-write]   git add content/blogger/posts/some-slug.md
[admin-write]   git commit -m "..."
[admin-write]
[admin-write] If not OK, rollback:
[admin-write]   git restore content/blogger/posts/some-slug.md
```

### 14.4 CLI 應提示 manual review command + rollback command

詳見 §14.3 stderr 範例；stdout JSON 之 `rollbackHint` 為單一 command string（方便 programmatic caller 直接 echo）。

### 14.5 CLI 不做 git commit / push

per Phase 4a §12.5 + §15.G phase 6 之承諾：

- CLI 完成 write 後立即 exit
- 不彈 confirm dialog
- 不自動 add
- 不自動 commit
- 不自動 push
- 不嘗試讀 git config 之 user.email / user.name

---

## §15 Admin UI relationship

### 15.1 Phase 4.5 不啟用 Admin Apply button

本 phase 為 docs-only；**不**碰 `src/views/admin/index.ejs`；**不**移除 `disabled` attribute；**不**綁 click handler；**不**新增 fetch / XHR。

Phase 3b 之既有 disabled 狀態 100% 保留（per Phase 4a §10.1）：

- `<button class="apply-disabled" disabled aria-disabled="true">Apply (disabled — Phase 3 dry-run only)</button>`
- visual：灰底 + cursor: not-allowed + opacity 0.6
- hover 不變色
- **不**綁 click handler
- DOM 上**無** fetch / endpoint 引用

### 15.2 未來 Admin UI 可顯示 CLI command preview

Phase 4.5c source landing 後（CLI 可用），**未來** Admin UI 可在 SEO dry-run viewer 之下方加一個 "CLI command preview" 區塊（**本 phase 不實作**）：

```
請於 terminal 執行以下指令：

1. 將下方 JSON 存至 .cache/admin-write-request.json：

{
  "targetRel": "content/blogger/posts/some-slug.md",
  "field": "description",
  "newValue": "...",
  "expectedOldValue": "...",
  "dryRun": true
}

2. 執行 dry-run：

  npm run admin:write -- --payload=.cache/admin-write-request.json

3. 確認 diff 後執行 apply：

  npm run admin:write -- --payload=.cache/admin-write-request.json --apply
```

UI 端**不** fetch / 不 POST / 不 write file；只 render text。

### 15.3 Admin UI 可產生 payload JSON 但本 phase 不實作

本 phase **不**新增以下 UI logic：

- 不新增 "Generate payload" button
- 不新增 "Copy payload JSON" button
- 不新增 textarea 顯示 JSON
- 不新增 download payload as file
- 不新增 clipboard write

Phase 4.5c source landing 後再評估。

### 15.4 不新增 fetch / XHR / click handler

本 phase 嚴格保證 `src/views/admin/index.ejs` 內：

- `fetch(` 命中 = 0
- `XMLHttpRequest` 命中 = 0
- `axios` / `ky` / `wretch` 命中 = 0（本來就無第三方 dep）
- `EventSource` 命中 = 0
- `WebSocket` 命中 = 0
- `addEventListener('click', ...)` 對 `.apply-disabled` 命中 = 0

### 15.5 不打開 browser → filesystem 通道

本 phase 不解開 browser → Node fs 通道。CLI 路徑**完全繞過** browser；user 在 terminal 直接執行；無 HTTP；無 fetch。

### 15.6 Phase 5 middleware 仍需另行設計與驗收

Phase 4.5 之 source landing **不**等於 Phase 5 middleware 落地。Phase 5 middleware 之**所有** acceptance criteria（CSRF / origin / LAN / prod build leakage / endpoint shape / dryRun forced）仍需獨立 phase 4a docs（已落定）+ Phase 5 source landing。

---

## §16 Security / risk boundary

### 16.1 Shell escaping risk

- **Risk**：candidate A（flags style）對 PowerShell / bash / pwsh 之 quote escape 不一致；user 易寫錯
- **Mitigation**：
  - 首批僅推 candidate B（payload file）；shell 完全 sidestep quote
  - candidate A 為 ergonomic 補強；只支援 SEO 雙欄；遇 quote 怪異一律 fallback to B
  - CLI 對 raw argv 做 minimal parse；不 invoke shell；不 eval

### 16.2 Long text value risk

- **Risk**：description 1000 chars / search 500 chars；terminal 行寬常 < 200；flags style 截斷或誤切
- **Mitigation**：
  - payload file 為一級 surface；長文寫檔不切
  - validator `MAX_DESCRIPTION` / `MAX_SEARCH_DESCRIPTION` 保護
  - CLI 對 newValue length 預檢；超限直接 exit 7（不交 safeWrite）

### 16.3 Accidental overwrite risk

- **Risk**：user 誤跑 `--apply` 而非 dry-run；或 payload `dryRun: false` 未察覺
- **Mitigation**：
  - default `dryRun: true`；payload 未指定 dryRun → 視為 true
  - `--apply` 需顯式 flag；不接受 `-a` short form（降低誤打）
  - stderr 在 real write 前印 `WARN — real write mode` 並等 stdin?（**否**；CLI 應 non-interactive；防自動化卡住）；改為**強制顯式 flag** 為唯一 gate
  - dry-run output 完整 echo target + field + diff summary；user pre-flight 自驗
  - real write 後立即 exit；不連續 batch

### 16.4 Wrong file target risk

- **Risk**：targetRel typo（如 `content/blogger/post/some.md` 漏 `s`）→ safeWrite 拒；但若 typo 為合法 path 之他篇 → 寫錯篇
- **Mitigation**：
  - expectedOldValue check：他篇之 description 與 payload 不一致 → exit 6（race-condition guard 順帶當 target mismatch 保護）
  - status check：他篇 status 為 published → exit 7
  - dry-run 必跑：user 看到 diff summary 顯示 oldLen / newLen；目標不對立即發現
  - stderr echo target path：user 可即時對比

### 16.5 Path traversal risk

- **Risk**：targetRel = `"../../../../etc/passwd"` 試圖跳出 projectRoot
- **Mitigation**：
  - `admin-write-whitelist.js` 已防 `..`（path.relative 後檢 `..` 開頭）
  - CLI 端額外 sanity：`payload.targetRel.includes('..')` → 直接 exit 4
  - 雙層備援；單層失敗仍有第二層擋

### 16.6 Arbitrary field write risk

- **Risk**：payload `field: "publishTargets.blogger.enabled"` 或 `field: "status"` 試圖改 routing / lifecycle
- **Mitigation**：
  - CLI enum check：`field` 必須屬 `['description', 'searchDescription']`；其他 exit 3
  - 即使有人錯誤 patch enum，frontmatter 之其他欄位仍會被 mutate（gray-matter 不保護）；但 safeWrite 之 validator 不會通過（其他 field 之 validator 未綁；fail-safe）
  - Phase 4.5e+ 若擴 field，每次擴需獨立 phase 設計 + validator + acceptance；不一次性開 list

### 16.7 Bulk write risk

- **Risk**：payload `[{...}, {...}]` 或 `targetRels: [...]` 試圖一次寫多檔
- **Mitigation**：
  - CLI 對 payload 強驗 object（非 array）；array → exit 3
  - 不支援 batch mode；user 需多次 invoke CLI（每次寫一檔）
  - 連續 invoke 時，第一筆未 commit → git dirty → 第二筆 exit 5；強制 user 逐筆 review + commit

### 16.8 Published content accidental edit risk

- **Risk**：user 誤選 published 文章為 target；high-traffic 文章 regression 影響 live deploy
- **Mitigation**：
  - status === 'published' → exit 7（target-status-not-allowed）
  - 首期僅允 draft / ready；Phase 4.5e+ 才考慮放寬至 published（per-post opt-in）
  - dry-run 不受此限；user 仍可 preview published 文章之 diff（只是不能 real write）

### 16.9 Race condition risk

- **Risk**：user 在 terminal 跑 CLI 期間，IDE / 其他 process 修改同一檔；CLI 之 mutate 覆寫 IDE 之變更
- **Mitigation**：
  - expectedOldValue check：CLI 讀檔時拿 currentFm[field]；若與 payload 不符 → exit 6
  - git status check：若 IDE 已存檔 → dirty → exit 5
  - 雙層保護：即使 IDE 改了但未存檔（disk 未變），CLI 寫入後 IDE 之 unsaved buffer 仍會被 IDE prompt overwrite

### 16.10 Payload file leakage risk

- **Risk**：payload file 含敏感內容（如未發布之 SEO 描述）誤入 git
- **Mitigation**：
  - 推薦放 `.cache/admin-write-request.json`；`.cache/` 已在 `.gitignore`
  - stderr 提醒 user：「payload file 未自動刪除；如需 audit 移至 docs；否則保留於 .cache/」
  - CLI **不**自動刪除 payload file（避免 user 想 re-run 時找不到）

### 16.11 Mitigation checklist

| 風險 | Mitigation 1 | Mitigation 2 | Mitigation 3 |
|---|---|---|---|
| Shell escaping | payload file（quote sidestep） | flags 限短欄 | CLI 不 invoke shell |
| Long text | payload file | validator length check | terminal 寬度不限 |
| Accidental overwrite | default dryRun=true | explicit `--apply` | dry-run echo + stderr WARN |
| Wrong file target | expectedOldValue check | status check | dry-run preview |
| Path traversal | whitelist `..` reject | CLI sanity check | path.relative check |
| Arbitrary field | enum allowlist | per-field validator | future per-phase expand |
| Bulk write | array reject | single-file API | git dirty 連動阻擋 |
| Published content | status check | first-write gate (draft/ready) | per-post opt-in (future) |
| Race condition | expectedOldValue check | git status clean | atomic tmp+rename |
| Payload leakage | .gitignore | stderr 提醒 | CLI 不自動刪除 |
| Regression | post-write validate | manual git diff | rollbackHint stderr |

---

## §17 Candidate comparison

### 17.1 四方案比較

| 比較項 | A. CLI driver docs-only preanalysis（本次）| B. CLI driver source implementation | C. Vite middleware source implementation | D. continue dry-run only |
|---|---|---|---|---|
| 目的 | 把 CLI shape / payload / exit code / security 落定為可審查 docs | 真實 implement CLI；user 可在 terminal 寫 production content | 真實 implement middleware；Admin UI 可 fetch POST | 維持 Phase 3b dry-run UI；不引入任何 write path |
| 修改範圍 | docs 1 file | `src/scripts/admin-write-cli.js`（新檔）+ `package.json`（加 script） | `vite.config.js`（加 `configureServer`）+ `src/scripts/admin-write-middleware.js`（新檔）+ admin EJS（加 CSRF token / fetch）| 0 file |
| 風險 | 🟢 零 | 🟡 中（首次 production content write） | 🔴 高（首次 browser→fs；HTTP surface；CSRF；LAN；prod leakage）| 🟢 零 |
| 是否 source change | ❌ | ✅ | ✅ | ❌ |
| 是否會碰 content | ❌ | 🟡 user 在 real write 時碰；CLI 本身不主動 | 🟡 user 在 real write 時碰 | ❌ |
| 是否會影響 build/deploy/Blogger/GA4 | ❌ | ❌（CLI 與 build pipeline 解耦）| 🟡 middleware 只在 dev mode；不入 build；但需驗證 hook gate 嚴 | ❌ |
| 推薦度 | ✅ **本次採用** | ⏸ Phase 4.5c（user 簽收本文件後啟動）| ⏸ Phase 5（待 Phase 4b acceptance + Phase 4.5 source 完成）| 🟡 fallback；user 可選擇延後 4.5c |

### 17.2 本文件範圍

**本文件只落 Phase 4.5 CLI driver preanalysis（方案 A）**；**不**實作；**不**碰 source；**不**啟動 CLI 路徑。

| 屬性 | 本 phase 之動作 |
|---|---|
| 方案 A docs（本次）| ✅ §4 / §5 / §6 / §7 / §8 / §9 / §10 / §11 / §12 / §13 / §14 / §15 / §16 完整描述 |
| 方案 B CLI source implementation | ❌ 不實作；留 Phase 4.5c |
| 方案 C middleware source implementation | ❌ 不實作；留 Phase 5 |
| 方案 D continue dry-run only | 🟡 fallback；本 phase 落地後仍與此並存 |

### 17.3 為什麼方案 A 為當下唯一推薦

per night-13 trigger context：

- Phase 4a middleware preanalysis 已 `c8b7d74` 落地；Phase 4 之 docs 設計完成
- User 在 Phase 4 之 §15.3 已留候選 A（CLI write driver）；本 phase 為候選 A 之展開
- CLI 設計尚未落定；source 階段無 reference 可審查；先寫 docs 避免 source 邊寫邊發現 boundary
- 維持 docs-first / source-later 之既有 phase 拆批節奏（per Phase 3a → 3b → 3c / Phase 4a → 4b）

---

## §18 Recommended implementation sequence

### 18.1 Phase 4.5 sequence

| Phase | Phase 名稱 | 屬性 | 動作 | 風險 | Status |
|---|---|---|---|---|---|
| 4a | middleware preanalysis | docs-only | `c8b7d74` 已 landed | 🟢 零 | ✅ landed |
| 4b | middleware acceptance cross-check | read-only | docs 同步至 `admin-2-write-pre-analysis.md` § 15.G phase 4 status；無 source change | 🟢 零 | ⏸ pending |
| **4.5a** | **本 phase**：CLI driver docs-only | docs-only | 新增 `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`；無 source change | 🟢 零 | 🔄 進行中 |
| 4.5b | CLI driver read-only acceptance cross-check | read-only | docs 同步至 `admin-2-write-pre-analysis.md` § 15.G phase 4.5 status；確認本文件與既有 helper API 對齊；無 source change | 🟢 零 | ⏸ pending |
| 4.5c | CLI source implementation（dry-run only）| source | 新增 `src/scripts/admin-write-cli.js`（dry-run only；不接 --apply）+ `package.json` 加 script | 🟡 低（無 real write surface）| ⏸ pending |
| 4.5d | CLI dry-run acceptance | source / verify | 對至少 3 篇 production `.md`（含 nested object）跑 dry-run；驗證 wouldWriteBytes 與 stringify 副作用；無 real write | 🟢 零（dry-run） | ⏸ pending |
| 4.5e | CLI real write gate（first SEO field write）| source | 解開 `--apply` flag；首篇 SEO description 寫入 draft / ready 文章；user 明確啟動；post-write validate baseline 必不變 | 🟡 中（首次 production write） | ⏸ pending |
| 5 | middleware source landing | source | 動 `vite.config.js`（加 `configureServer`）+ 新 `src/scripts/admin-write-middleware.js`；endpoint 只接 preview（dryRun forced true） | 🟡 中（首次解開 browser→fs） | ⏸ 延後 |
| 6 | first middleware real write gate | source | UI Apply enable + write endpoint 接 real write；首次 middleware → safeWrite real write | 🟡 中 | ⏸ 延後 |

### 18.2 為什麼分 7 個小批

- **4a → 4b → 4.5a → 4.5b → 4.5c → 4.5d → 4.5e** 之每階段 rollback 路徑單一：
  - 4a / 4.5a / 4.5b / 4b：rollback = `git revert <commit>`（docs only；零風險）
  - 4.5c：rollback = `git revert <commit>`（source change 但無 real write；恢復 zero CLI 狀態）
  - 4.5d：rollback = `git revert <commit>`（無 production content mutate；只跑 dry-run）
  - 4.5e：rollback = `git restore <md>`（per Phase 4a §12；單檔 md 之 restore）
  - 5 → 6：rollback = `git revert <commit>`（middleware）；可選擇 disable env opt-in 不解開 endpoint

- 每階段獨立 user 簽收；不一次合併

### 18.3 為什麼 4.5e 之後可選擇延後 Phase 5

CLI 落地後，user 可在 terminal 直接寫 SEO description；middleware 雖然 ergonomic 高（在 Admin UI 直接 click），但**功能等價**。

User 可選：

- 路徑 1：4.5e → 5（middleware；ergonomic 補強）→ 6（middleware real write）
- 路徑 2：4.5e → 維持 CLI workflow；延後 Phase 5；省下 middleware surface 之風險
- 路徑 3：4.5e → 部分 field 用 CLI；部分 field 等 middleware（field-by-field 過渡）

→ Phase 5 不再是 hard dependency；Phase 4.5 完成後 CLI 已可獨立完成 SEO write 之 use case

### 18.4 不建議跳過 4.5b acceptance

Phase 4.5c source 之前必須有 4.5b 之 docs sync + read-only cross-check；理由：

- 本文件之 §6.2 / §13 / §16 之 reason code / exit code 必須與 Phase 4a §11 middleware 一致；4.5b 為對齊 checkpoint
- `admin-2-write-pre-analysis.md` 為 master tracking；本文件落地後該文件之 phase 4.5 status 仍為 ⏸；4.5b 才更新為 docs landed
- 跳過 4.5b → source phase 開始時 master tracking 與 docs 失配；後續 phase 對齊噪聲增加

---

## §19 Explicit non-goals

本 phase（4.5a；本文件落地）**明確不做**：

| 非目標 | 理由 |
|---|---|
| ❌ 實作 CLI | 屬 Phase 4.5c；本 phase docs-only |
| ❌ 修改 `package.json` | 屬 Phase 4.5c；本 phase 不碰 |
| ❌ 新增 npm script | 同上 |
| ❌ 實作 middleware | 屬 Phase 5；本 phase docs-only |
| ❌ 實作 write route | 同上 |
| ❌ 啟用 Admin Apply button | 屬 Phase 5 之後；本 phase 維持 disabled |
| ❌ 任何 content write | 屬 Phase 4.5e；本 phase 不寫 |
| ❌ build / deploy | 本 phase docs-only；無 build 需求 |
| ❌ Blogger repost | 本 phase 與 Blogger 無關 |
| ❌ GA4 validation | 本 phase 與 GA4 無關 |
| ❌ 解除 pm-26 deploy gate | reverse UTM 仍 dormant；獨立 gate |
| ❌ 建立 reverse UTM fixture | 屬 pm-26 之獨立 phase |
| ❌ 動 `vite.config.js` | 本 phase 不碰 |
| ❌ 動 `src/**` | 不碰任何 source |
| ❌ 動 `content/**` | 不碰任何 content |
| ❌ 動 `content/settings/**` / `content/templates/**` / `content/validation-fixtures/**` | 不碰 |
| ❌ 動 `dist/**` / `dist-blogger/**` / `dist-promotion/**` / `dist-reports/**` | 不碰 |
| ❌ 動 `gh-pages/**` | 不碰 |
| ❌ 動 `.cache/**` | 不碰 |
| ❌ 動 `node_modules/**` | 不碰 |
| ❌ 動既有 docs 檔 | 只新增本文件單檔；不修改 `admin-2-write-pre-analysis.md` / Phase 4a docs / Phase 3 docs |
| ❌ git fetch / pull / push | docs-only commit；push 等 user OK |
| ❌ npm install | 無新 dep |
| ❌ npm run build / dev / preview | docs-only；無 build 需求 |
| ❌ 新增 fixture | 無 fixture 需求 |
| ❌ 新增 fetch / XHR / POST / PUT runtime | 不碰 UI runtime |
| ❌ 新增 fs.writeFile / fs.rename / safeWrite production caller | 不碰 src |

---

## §20 Acceptance checklist

本 docs-only phase 之驗收項目：

### 20.1 File scope

- [ ] **只新增**`docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（單檔；本文件）
- [ ] **無**其他檔案新增
- [ ] **無**任何既有檔案修改（含既有 docs / source / content / settings / template / fixture / dist / package / vite config）

### 20.2 Baseline gates

- [ ] `git status --short --branch` 在 commit 前只顯示本文件之 `??`（untracked）
- [ ] `git diff --stat` 0 modified files；只 1 new file
- [ ] `npm run safe-write:test` = `71 pass / 0 fail`（與 baseline 一致）
- [ ] `npm run validate:content` = `0 errors / 42 warnings / 37 posts`（與 baseline 一致）

### 20.3 Post-commit gates

- [ ] commit 後 `git log -1 --oneline` 顯示 commit message `docs(admin): plan phase 4.5 cli write driver`
- [ ] commit 後 `git status --short --branch` clean
- [ ] push 後 `HEAD` = `origin/main`
- [ ] push 後 `git rev-list --left-right --count HEAD...origin/main` = `0 0`

### 20.4 Phase scope gates

- [ ] 無 CLI source（`src/scripts/admin-write-cli.js` 不存在）
- [ ] 無 npm script 變動（`package.json` 之 `scripts` 不含 `admin:write`）
- [ ] 無 middleware source（`vite.config.js` 無 `configureServer`）
- [ ] 無 admin EJS runtime 變動（`fetch(` / `XMLHttpRequest` 命中 = 0）
- [ ] 無 content mutate（`content/**` 在 commit 前 / 後皆 unchanged）
- [ ] safeWrite caller 命中（`grep -rn 'safeWrite(' src/`）= 既有 2 處（self-export 與 self-test），不增加

---

## §21 Boundary reaffirmation

最後再次確認：

| 邊界 | 本 phase 之承諾 |
|---|---|
| 本文件**只設計** CLI write driver | ✅ 不執行 CLI 實作 |
| 不觸發任何真實寫入 | ✅ 不碰 production content |
| 不解開 browser → Node fs 通道 | ✅ CLI 路徑與 browser 解耦 |
| Phase 5 middleware 不建議現在直接做 | ✅ 推薦先走 4.5a → 4.5b → 4.5c → 4.5d → 4.5e；Phase 5 為延後選項 |
| pm-26 deploy gate 不被觸動 | ✅ reverse UTM 仍 dormant |
| 既有 docs 不被修改 | ✅ 只新增本文件；既有 docs 0 mutate |
| safe-write infra API 不變 | ✅ 既有 helper 0 mutate |
| validate:content baseline 不變 | ✅ 0/42/37 維持 |
| safe-write:test baseline 不變 | ✅ 71/0 維持 |

→ 本 phase 為**純設計**；可隨時 `git revert <commit>` rollback（單檔 docs）；無 downstream 副作用。
