# Admin GitHub 退回草稿 / 重新上架 write-path 唯讀前置分析（2026-07-14）

- 建立日期：2026-07-14（Asia/Taipei）
- 類型：**read-only analysis + docs-only preflight**（唯一 mutation = 本 doc 新增 + commit + push origin/main）
- 角色：`docs/20260714-github-redraft-lifecycle-contract.md` §6 明列「若要真正實現『Admin UI 一鍵退回草稿』→ 屬 Admin write path（dormant），須另開 phase + preflight approval」。**本文件即該 preflight**；補該 doc 缺口，不重複其 lifecycle / build 契約內容。
- 本 session 邊界（cumulative；違反即 abort）：**不**啟用 `--apply`、**不**改 Admin UI 操作按鈕、**不**新增 repository write API、**不**改任何 production Markdown / 文章 `status`／`draft`、**不** commit／push production content、**不** build production site、**不** deploy、**不**動 gh-pages、**不** Blogger API 寫入 / Blogger 下架、**不**永久刪除、**不** git history rewrite、**不**自訂網域 / AdSense、**不**大型 Admin 重構、**不**新增未經分析的 metadata 欄位、**不**實作自動 commit／push／deploy。原則上只允許本 docs 變更。

---

## 1. Executive summary

Dean 需求：GitHub 文章能安全地「退回草稿（暫時下架）→ 未來沿用相同 slug／URL 重新上架」，且**明確 ≠ 永久刪除**。

**結論（先講結果）**：

1. **底層生命週期 + build 行為已正確且已被 guard 鎖住**（`classify()` + stale-HTML 清除 + `check:github-redraft-lifecycle` 13/0；見 lifecycle contract doc）。退回草稿 / 重新上架的**建置結果**現況已對；缺的只有「安全地把 `status`／`draft` 兩欄位寫回 Markdown」的 write path。
2. **現有 dormant write path（`admin-write-cli.js`）無法做退回草稿**：其欄位白名單只含 `description` / `searchDescription`，patcher 只支援 string scalar（不支援 boolean `draft`），且 real-write 的 status 前置閘門把可寫目標**收窄到 `status:draft`**（退回草稿的起點是 `ready`／`published`，會被拒）。因此退回草稿 / 重新上架是**新能力**，不是「打開既有開關」。
3. **現有 write infra 的安全骨架成熟可重用**：atomic tmp+rename（`safe-write.js`）、path 白名單 + traversal 防禦（`admin-write-whitelist.js`）、byte-preserving 單欄位 patcher（`admin-frontmatter-patcher.js`）、`expectedOldValue` stale-overwrite 防禦、clean-tree 強制（`git-status-check.js` + `enforceCleanGit`）、dry-run ↔ `--apply` 雙重配對閘門。
4. **git-safety 有明確缺口**：目前寫入前**未**檢查 branch（是否在 `main`）、`main == origin/main`（ahead／behind）、`.git/index.lock` 是否存在。這三項屬本次新增 write path 的必備 preflight。
5. **本 session 不實作任何 write path**；只產出本 preflight，並給下一 coding slice 的 go／no-go 建議。

**Go／no-go（詳 §16）**：本 session = **NO-GO for any write／`--apply`**。下一 coding slice 建議 = **GO for read-only article lookup（Phase A）**；dry-run patch generation（Phase B）緊隨其後但另開 slice；apply／commit／push／deploy 各自獨立 Dean-gated。

---

## 2. Current implementation inventory（現況盤點；程式碼證據）

| 元件 | 檔案 | 現況（證據） |
| --- | --- | --- |
| Admin UI shell | `src/views/admin/index.ejs` | dev-only、noindex、不進 prod build。inline 註解自證「純前端字串組裝；無 fetch / fs / XHR / form submit」；Apply 按鈕 `.apply-disabled` 永久 disabled（hover 不變色、不引導點擊）。讀取 source posts 僅供**顯示**（`posts.length` 含所有狀態）。 |
| Markdown 組裝 | `src/scripts/admin-markdown-export.js` | 檔頭自證「Pure: no fs / fetch / process IO. String assembly only.」（多處重申）。新草稿恆輸出 `status:"draft"` + `draft:true`。 |
| 唯讀貼文載入 | `src/scripts/load-admin-posts.js` / `load-posts.js` | 供 Admin / guard 讀取；`classify()` 為「是否進正式輸出」唯一判斷（見 lifecycle contract §1.1）。 |
| Dormant write CLI | `src/scripts/admin-write-cli.js` | 完整但 Dean-gated；`ALLOWED_FIELDS = {description, searchDescription}`；`admin:write` npm script 已註冊；real-write 需 `--apply` **且** `payload.dryRun===false`。 |
| Path 白名單 | `src/scripts/admin-write-whitelist.js` | 只允許 `content/{github,blogger}/posts/*.{md,publish.json,fb.md}`；恰 4 段 rel path；拒 `..` / `.` / null byte / 絕對路徑 / 跨 root。 |
| Frontmatter patcher | `src/scripts/admin-frontmatter-patcher.js` | 只改目標欄位 inline scalar、其餘 byte-for-byte 保留（含 inline array / nested / 註解 / 引號 / 縮排）；block scalar / missing / duplicate key → fail-closed；**value 必須為 string**（`new-value-must-be-string`）；`ALLOWED_TOP_LEVEL_KEYS = {description, searchDescription}`。 |
| Atomic write | `src/scripts/safe-write.js` | whitelist → git clean → validators → tmp write → rename；失敗清 `.tmp`、不留 partial；`enforceCleanGit:true`。 |
| Git status probe | `src/scripts/git-status-check.js` | `git status --porcelain` → `{ ok, clean, dirtyFiles[], untracked[] }`；不 stash/reset、5s timeout。**不查 branch / ahead-behind / index.lock**。 |
| Lifecycle guard | `src/scripts/check-github-redraft-lifecycle.js` | 13/0；state matrix + round-trip + stale-HTML 契約（hard-fail）+ status⇔draft 矛盾掃描（warning-only）。 |
| Draft metadata smoke | `src/scripts/check-github-draft-metadata.js` | direct-node smoke（非 package script）；已改 lifecycle-aware（status⇔draft 不變式）11/0。 |

---

## 3. Confirmed current limitations（目前做不到什麼；已證實）

**Admin UI 目前僅能**：組裝 Markdown 字串、預覽、Copy／Download、跑 ready preflight（前端）、導引 build／preview；**並且完全不能**：修改 repository 既有文章、定位原始 Markdown 以寫入、commit、push、deploy（`admin-markdown-export.js` 無任何 fs/fetch/IO；`index.ejs` 無 fetch/XHR/form submit；Apply 永久 disabled）。註：Admin **會**讀取既有文章**供顯示**（read-only），但無任何寫回路徑。

**現有 dormant write path 目前**：

- 只更新既有 `.md`（step 6 先讀檔）；**不建立新文章**（無 create 路徑）。
- 只能安全改**單一** whitelisted 欄位（`description`／`searchDescription`），**不能改 `status`／`draft`**。
- patcher 只替換該欄位 inline scalar、**保留未知欄位與原始格式 byte-for-byte**；**不重寫整份 Markdown**（永不 fallback `matter.stringify`）；**不動** body／slug／date／tags／圖片／其他 metadata。
- `draft` 為 boolean → 現行 patcher 之 `new-value-must-be-string` 會直接拒，**無法寫 boolean**。
- dry-run ↔ `--apply` 界線嚴格：`--apply` 必須配 `dryRun:false`（否則 exit 2）；兩者皆缺 → dry-run（不寫檔）。
- **不 commit／不 push／不 deploy**（CLI 只寫 `.md`）。
- 既有 preflight：whitelist + traversal 防禦、`expectedOldValue`（stale-overwrite 防禦）、clean-tree 強制、寫前 whitelist re-check（TOCTOU）。
- **缺**：branch check、`main==origin/main`（ahead／behind）、`.git/index.lock` 檢查（三項皆 grep 證實不存在於 write infra）；slug→post 唯一解析（目前 caller 直接給 `targetRel`，未做 slug 唯一性解析）。

---

## 4. Existing dormant write-path capability（既有能力 vs 退回草稿所需差距）

| 面向 | admin-write-cli 現況 | 退回草稿 / 重新上架所需 | 差距 |
| --- | --- | --- | --- |
| 可寫欄位 | `description` / `searchDescription` | `status` + `draft` | **新** whitelist（含 status/draft） |
| 值型別 | string only | `status`=string、`draft`=boolean | patcher 需支援 boolean scalar |
| 欄位數 | 單欄位 | **兩欄位耦合**（status ⇄ draft 必須同時且一致） | 新耦合語意 + 兩欄位 `expectedOldValue` |
| status 前置閘門 | real-write 收窄到 `{draft}` | 退回草稿起點 = `ready`/`published` | 需放寬起點（見 §5 狀態機） |
| create 新檔 | 不支援（僅 update） | 不需要（沿用既有檔） | 無差距（正確） |
| commit/push/deploy | 不做 | 不做（維持分離） | 無差距（正確） |
| git-safety | clean-tree only | + branch + ahead/behind + index.lock | **新** preflight |
| slug 解析 | 直接吃 targetRel | slug/ID → 唯一 post | **新** resolver（Phase A） |

**判定**：安全骨架可重用；但退回草稿是**新能力**，需擴充（Option D，見 §8）或新建專用工具。

---

## 5. Proposed redraft／republish state transitions（狀態轉換契約）

以 `classify()` 真實語意（`VISIBLE_STATUS = {ready, published}`；draft:true 或 status∉visible → 隱藏）為準。

### 5.1 退回草稿（暫時下架）

```
起點：status ∈ {ready, published}, draft ∈ {false, 缺省}
終點：status = draft,            draft = true
```

- **兩欄位必須同時改**：只改一半（例只把 `status→draft` 而留 `draft:false`）→ `classify` 仍隱藏但**無警告**（footgun；lifecycle contract §2 已載）。write path 必須把 status+draft 當**單一原子操作**，且寫入後跑 `check:github-redraft-lifecycle` 確認無矛盾。

### 5.2 重新上架

```
起點：status = draft, draft = true
終點：status = ready, draft = false      ← 建議預設
```

- **建議回到 `ready`（非 `published`）**：對 GitHub build，`ready` 與 `published` 皆 visible、輸出等價；`published` 依 §24 帶「已在平台發布並回填 URL」語意，不應由自動流程臆測。**除非** Dean 明示該篇原為 `published` 且要精確還原，才回 `published`。
- **沿用原 slug** → 重新 build+deploy 後恢復相同 `posts/<slug>/index.html` 與公開 URL（`classify` 為唯讀 predicate、不 mutate slug；已由 guard round-trip 鎖住）。

### 5.3 previousStatus / sidecar / archived — 是否必要

- **是否需 `previousStatus`**：**預設不需要**。GitHub build 下 ready/published 等價，回 `ready` 即可；新增 frontmatter 欄位違反「不新增未經分析的 metadata」。若未來 Dean 需精確還原 `published`，優先考慮 sidecar 記錄（`.publish.json`）而非新增 frontmatter 欄位，且**另開 phase**。
- **是否需 sidecar 紀錄**：本操作**不需要**新 sidecar。退回草稿只動 frontmatter 兩欄位；Blogger 發布真值仍走既有 `.publish.json` backfill 流程（獨立線）。
- **archived 是否同一操作**：**否**。`archived` 為獨立語意（封存），雖同樣被 `classify` 排除，但退回草稿應用 `draft`（對齊 lifecycle contract round-trip）。archived 轉換不在本操作範圍。

### 5.4 Blogger 與 GitHub 狀態分離 / blogger-cross 限制

- **GitHub 退回草稿 = 只影響 GitHub build 輸出**：flip status/draft → GitHub build 不產出 → 重新 deploy 後 GitHub URL 404。**不觸及 Blogger 平台**。
- **Blogger 平台下架 = 另屬 Blogger 手動流程**（Claude 永禁登入 Blogger 後台；§29）。兩平台狀態必須完全分離。
- **`blogger-cross`（同一 `.md` 經 `publishTargets` 鏡射進 GitHub build）額外限制**：flip status/draft 會同時使該篇從 **GitHub build 與 build:blogger 輸出**消失，但**線上 Blogger 既有貼文不受影響**（仍需 Dean 手動下架）。write path 必須明確標示此不對稱：「動 frontmatter 只影響本機 build／未來 deploy；已發布之 Blogger 貼文須另行手動處理」。

---

## 6. Fields allowed to change（允許改動白名單）

僅限：

- `status`（string；退回草稿→`draft`；重新上架→`ready`，或 Dean 明示 `published`）
- `draft`（boolean；退回草稿→`true`；重新上架→`false`）

以上為**唯二**允許改動欄位，且必須成對、值必須一致（visible⇔`draft:false`、hidden⇔`draft:true`）。

---

## 7. Fields that must remain unchanged（必須完全不變）

除 §6 兩欄位外，**其餘一切 byte-for-byte 不變**，明確包含：`id`、`slug`、`date`、`updated`（不自動 bump，避免額外語意；如需更新另議）、`title`／`titleEn`、`category`、`tags`、`description`／`searchDescription`、`cover`／`coverAlt`、`canonical`、`primaryPlatform`、`publishTargets`、`blocks`、`affiliate`／`book`／`download`、`images`、`promotion`、body 全文、以及任何未知／未來欄位。patcher 的 byte-preserving 特性正是為此設計（不 fallback 全量 YAML dump）。

---

## 8. Browser UI／CLI boundary（一鍵操作應採哪種橋接）

四選項：

```
A. Admin UI 只產生安全操作指令，由 Dean 在 CLI 執行
B. Admin UI 呼叫本機受控 API／server bridge
C. Admin UI 產生 patch／sidecar，由另一個明確 apply 步驟寫入
D. 延伸現有 admin-write-cli
```

**建議：D（延伸現有 `admin-write-cli`）為底層，A（Admin 產生指令、Dean 於 CLI 執行）為前端銜接**。理由：

- Admin UI 本質是 browser（無 fs／無寫回能力，且刻意保持 read-only）；引入 server bridge（B）會打破「dev-mode read-only dashboard」定位、擴大攻擊面，違反第一版「不做真正後台」與最小工程化。
- 既有 `admin-write-cli` 已具白名單 / traversal / expectedOld / clean-tree / atomic / TOCTOU；**擴充**（新欄位集 + boolean + 耦合 + 新 git preflight）比新建重複骨架風險低、程式碼重用高。
- Admin UI 端只做 A：顯示文章、產生一段**可複製的 CLI 指令 + payload JSON**（含 `expectedOldValue`），由 Dean 貼到終端機執行。write 決策與執行完全落在 Dean 手上的 CLI，非一鍵自動。
- C（patch／sidecar 再 apply）本質上等同「dry-run 產物 + 明確 apply 步驟」，已被 D 的 dry-run↔`--apply` 兩段式涵蓋，無需另建 patch 檔格式。

**本 session 不選定為最終決策、不實作**；僅提出最小可行、風險最低方向供 Dean 審。

---

## 9. Dry-run and apply flow（兩段式；沿用既有閘門）

```
dry-run（預設）：
  admin:write --payload=<file>        （payload.dryRun:true, 無 --apply）
  → 讀檔 → 解析 frontmatter → 顯示 old/new status+draft diff → 不寫檔 → exit 0

apply（Dean 明確）：
  admin:write --payload=<file> --apply （payload.dryRun:false）
  → 全部 preflight（§10）→ 原子寫入 → 不 commit/push/deploy
```

- `--apply` 必須配 `dryRun:false`，否則拒（既有 exit 2 語意）；防「不小心 apply」。
- dry-run 產物即「Dean 檢視用 diff」；apply 前**再次**核對 `expectedOldValue`（status 與 draft 各一）避免 stale overwrite。
- 退回草稿為兩欄位耦合：dry-run 需同時顯示 `status: ready→draft` 與 `draft: false→true`，且**任一不一致即整體拒**。

---

## 10. Git safety preflight（apply 前必過；hard-fail / warning / Dean gate 分級）

| # | 檢查 | 現況 | 分級 |
| --- | --- | --- | --- |
| 1 | 在 git repository 內 | ✅ **已補**（§19 not-git-repository + repo-root-mismatch） | hard-fail |
| 2 | 在 `main`（或明確允許 branch） | ✅ **已補**（§19 wrong-branch / detached-head） | **hard-fail** |
| 3 | working tree clean（或明確拒絕覆蓋使用者修改） | ✅ `enforceCleanGit`；§19 亦獨立涵蓋 | hard-fail |
| 4 | `main == origin/main`（ahead／behind 明確處理） | ✅ **已補**（§19 ahead-of-origin / behind-origin / diverged） | **hard-fail**（ahead/behind ≠ 0 → 拒或明示） |
| 5 | `.git/index.lock` 不存在 | ✅ **已補**（§19 index-lock-present；不刪除 / 不修改 lock） | **hard-fail** |
| 6 | 目標 Markdown 唯一存在 | ✅（whitelist 單一 resolved path） | hard-fail |
| 7 | 目標位於允許 content root | ✅ whitelist | hard-fail |
| 8 | 不接受任意檔案路徑 | ✅ whitelist + traversal | hard-fail |
| 9 | slug／ID 唯一解析到一篇 | **缺**（若引入 slug lookup）→ Phase A 新增 | hard-fail |
| 10 | 寫入前顯示 old/new frontmatter diff | ✅ dry-run（需擴 status/draft） | Dean gate |
| 11 | 只允許白名單欄位改動 | 需**新** whitelist（status/draft） | hard-fail |
| 12 | apply 前再次核對 expectedOldValue（防 stale） | ✅（需擴為兩欄位） | hard-fail |
| 13 | 寫入後 schema validation（`validate:content`） | **缺**（未自動跑）→ 新增 | hard-fail |
| 14 | 寫入後 redraft lifecycle guard | **缺**（未自動跑）→ 新增 | hard-fail |
| 15 | 寫入失敗不留半寫檔 | ✅ atomic tmp+rename | hard-fail |
| 16 | 不自動永久刪除 | ✅ 無 delete 路徑 | 契約 |
| 17 | 不修改 git history | ✅ | 契約 |
| 18 | 不自動 deploy | ✅ CLI 只寫 .md | 契約 |
| 19 | 必須可取消 | ✅ dry-run 預設 | 契約 |
| 20 | 明確顯示「URL 需 build + deploy 後才成 404」 | 文件／輸出訊息要求 | warning-only 提示 |

**三分級定義**：hard-fail = 未過即 exit 非 0、不寫；warning-only = 提示但不阻擋（如 #20 訊息、status⇔draft 矛盾掃描）；Dean confirmation gate = 需 Dean 於 CLI 明確動作（`--apply`、貼 payload）才前進。

---

## 11. Fields / validators（欄位驗證器）

- `status`：字串，值須 ∈ `VALID_STATUS = {draft, ready, published, archived}`（validator 既有），且退回草稿限 `draft`、重新上架限 `ready`（或 Dean 明示 `published`）。
- `draft`：boolean；退回草稿=`true`、重新上架=`false`。
- **跨欄位一致性**：visible status（ready/published）⇔ `draft:false`；hidden status（draft/archived）⇔ `draft:true`。寫入後由 `check:github-redraft-lifecycle` 矛盾掃描確認 production 仍 0 筆。
- patcher 需新增 **boolean scalar** 支援（現況只支援 string；為新增能力，屬 Phase B/C 程式變更）。

---

## 12. Build／deploy separation（寫入與發布必須分離）

```
修改 Markdown 狀態  →  commit  →  push  →  build  →  deploy
     (Phase C)         (Phase D)  (Phase D)  (Dean)   (Phase E, Dean)
```

- **絕不**一鍵完成 write+commit+push+deploy。既有架構已天然分離（CLI 只寫 `.md`，不 commit/push/deploy）；本設計維持此分離。
- 每段之間需 Dean 明確動作；`status` frontmatter 改動 → 需**重新 build 並 deploy**（同步 `dist/`→gh-pages）URL 才真正 404，此為 Dean-gated deploy slice（本 session 不做）。

---

## 13. Failure modes（失敗模式表）

| 失敗 | 行為 | 分級 |
| --- | --- | --- |
| 不在 main / ahead-behind≠0 / index.lock 存在 | 拒、不寫 | hard-fail |
| tree dirty | 拒、不寫（不覆蓋 Dean 修改） | hard-fail |
| targetRel 非允許 content root / traversal / 非 .md | 拒（whitelist） | hard-fail |
| slug 解析到 0 或 >1 篇 | 拒 | hard-fail |
| expectedOldValue（status 或 draft）不符 | 拒（stale overwrite 防禦） | hard-fail |
| status/draft 目標值非法或不一致 | 拒 | hard-fail |
| 寫入 I/O 失敗 | 清 `.tmp`、不留 partial | hard-fail |
| 寫入後 validate:content / lifecycle guard 失敗 | 報錯（檔已寫；提示 Dean 手動 revert 或修正） | hard-fail（回報） |
| status⇔draft 掃描出矛盾 | 提示 | warning-only |
| 「URL 尚未 404」 | 提示需 build+deploy | warning-only |

---

## 14. Recommended implementation phases（建議分階段；各須 Dean explicit approval）

| Phase | 內容 | 寫檔 | git 自動化 |
| --- | --- | --- | --- |
| **A. read-only article lookup** ✅ **IMPLEMENTED（2026-07-14；見 §17）** | CLI／resolver 讀取並顯示既有文章 slug／title／current status／current draft／source path／GitHub·Blogger publishing metadata；建立 slug→唯一 post resolver。**不寫檔**。 | ❌ | ❌ |
| **B. dry-run patch generation** ✅ **IMPLEMENTED（2026-07-14；見 §18）** | 產生僅含 status+draft 之 old/new diff（boolean 支援、兩欄位成對、expectedOldValues、source/target SHA-256）；**不 apply**。 | ❌ | ❌ |
| **C.1a. dormant atomic apply engine** ✅ **IMPLEMENTED（2026-07-14；fixture-only / dormant；見 §20）** | atomic two-field write 本體：plan schema recheck → repository safety preflight（§19）→ Phase A 重新唯一解析 → source SHA TOCTOU → lifecycle precondition → target 重算核 SHA → same-dir atomic replace（exclusive create + fsync + mode 保留）→ 必要 post-write validation callback → 失敗 rollback。**無 production CLI 入口 / 無 `--apply` / 無 npm apply script / 未被任何 production CLI / Admin UI import；只在 contract guard 之 OS temp fixtures 實際寫入。** | ✅（temp fixtures only；production .md 從未被測試寫入） | ❌ |
| **C.1b. production CLI activation**（未實作） | 將 engine 接上 Dean-gated 正式 CLI（explicit confirmation + Dean approval）；仍 disabled-by-default。 | — | ❌ |
| **C. local apply, no Git automation**（git-safety preflight 前置**已備**，§19；C.1a engine **已備 dormant**；正式 CLI 啟用〔C.1b〕仍未實作） | 全部 preflight（§10；git-safety 部分見 §19）通過 + Dean 明確確認後：原子寫入 Markdown → `validate:content` → `check:github-redraft-lifecycle`。**不 commit / 不 push / 不 deploy**。 | ✅（.md only） | ❌ |
| **D. optional Git assistance** | 另行評估 commit／push 輔助；**仍不得與 deploy 綁定**。 | — | commit/push（Dean-gated） |
| **E. deploy assistance** | 另一個 Dean-gated slice；build + 同步 dist→gh-pages 使 URL 生效 404。 | — | deploy（Dean-gated） |

**對現有架構的調整建議**：Phase A 之 read-only lookup 部分 Admin 已有（顯示既有文章），可只補「CLI 唯讀查詢 + slug 唯一 resolver」小切片；Phase B 需先在 patcher 加 boolean 支援（現況 `new-value-must-be-string`）。順序維持 A→B→C→D→E 不變（write 前置 read-only、apply 前置 dry-run，皆與既有 dormant CLI 的兩段式一致）。

---

## 15. Explicit non-goals（本 session 明確不做）

啟用 `--apply`；改 Admin UI 操作按鈕；新增 repository write API；改 production Markdown / 任何 status·draft；commit／push production content；build production；deploy；動 gh-pages；Blogger API 寫入 / Blogger 下架；永久刪除；git history rewrite；自訂網域；AdSense；大型 Admin 重構；新增未經分析的 metadata 欄位；實作自動 commit／push／deploy。**本 session 僅 docs（+ 必要 docs index，若有）。**

---

## 16. Go／no-go recommendation for the next coding slice

**本 session（analysis/docs-only）= 完成；不啟用任何 write path。**

> **2026-07-14 update**：Phase A（read-only article lookup，§17）、Phase B（dry-run-only status/draft
> patch generation，§18）與 **git-safety preflight（Phase C 前置；§19）均已落地**。§10 之三項缺口
> （branch / ahead-behind / index.lock）現已有 **reusable、read-only** 的 checker + contract guard。
> 下一建議 slice = **Phase C（local apply, no Git automation）**，仍 **NO-GO 至 Dean explicit
> approval + Phase C atomic two-field write / expected source SHA recheck 實作**；`--apply` 仍未實作 /
> 仍被拒絕。git-safety preflight **通過 ≠ 已授權寫入**。

已完成 coding slices：

```
GO for read-only article lookup (Phase A)                    ← DONE 2026-07-14 (§17)
GO for dry-run-only status/draft patch generation (Phase B)  ← DONE 2026-07-14 (§18)
GO for read-only repository safety preflight (Phase C 前置)   ← DONE 2026-07-14 (§19)
GO for dormant atomic apply engine (Phase C.1a; fixture-only) ← DONE 2026-07-14 (§20)
```

> **2026-07-14 update（Phase C.1a）**：atomic two-field write 本體（`redraft-apply-engine.js`）已落地為
> **dormant / fixture-only** engine（§20）：整合 git-safety preflight + source SHA recheck + article
> re-resolution + target 重算 + atomic replace（fsync / mode 保留）+ 必要 post-write validation callback
> + rollback。**無 production CLI 入口、無 `--apply`、無 apply npm script、未被任何 production CLI / Admin
> UI import；production content 從未被測試寫入。** 下一 slice = **Phase C.1b（production CLI activation）**：
> **GO only for a separate explicit-confirmation production CLI wiring slice; still disabled by default**，
> 仍須 Dean explicit approval。**通過所有安全門 ≠ 已授權寫入。**

理由：

1. write path 為**新能力**（現有 CLI 無法改 status/draft），不可直接 apply。
2. Phase A 零寫檔、可測試、建立 slug→唯一 post resolver（§10 #9）與顯示契約，為 dry-run（Phase B）之必要前置。
3. dry-run（Phase B）需先為 patcher 加 boolean 支援（程式變更）；建議在 Phase A 落地後另開 slice，仍 dry-run-only、不 apply。
4. apply（Phase C）、commit/push（Phase D）、deploy（Phase E）**各自獨立 Dean-gated**；**不得**一次實作完整 write+commit+push+deploy。

若 Dean 傾向直接進 dry-run，替代建議 = **GO for dry-run-only patch generation（Phase B）**，但須明確接受其包含 patcher boolean 支援之程式變更，且仍 **NO-GO for `--apply`**。

**NO-GO 條件（未解不得進 apply/Phase C）**：§10 之 branch / ahead-behind / index.lock 三項 git-safety preflight 未實作前，不得啟用任何 `--apply` 寫回 status/draft。

---

## 17. Phase A 實作紀錄（read-only article lookup；2026-07-14 landed）

Phase A 已落地為**純唯讀** slug→唯一文章 resolver + CLI + contract guard。**零寫檔、零 apply、零 build、零 deploy、零 Git 自動化**。

### 17.1 檔案 / 進入點

| 檔案 | 角色 |
| --- | --- |
| `src/scripts/admin-article-lookup.js` | 純 resolver（`resolveArticleBySlug` / `formatArticleLookup` / `validateSlug` / `ALLOWED_CONTENT_ROOTS`）+ CLI adapter（`runCli`）。 |
| `src/scripts/check-admin-article-lookup.js` | contract guard（26 斷言；OS temp fixtures；finally 清除）。 |
| npm `admin:lookup` | `node src/scripts/admin-article-lookup.js`（CLI 進入點）。 |
| npm `check:admin-article-lookup` | 跑 contract guard。 |

### 17.2 使用方式 / 支援輸入

```bash
npm run admin:lookup -- --slug=<slug> [--site=github|blogger] [--json]
# 或
node src/scripts/admin-article-lookup.js --slug=<slug> [--site=github|blogger] [--json]
```

- `--slug=<slug>`：**唯一必填**；只接受精確 slug（不做模糊 / 全文搜尋）。
- `--site=github|blogger`：選填；當 slug 於兩 content root 重複時，依 content-root 資料夾精確消歧。
- `--json`：選填；輸出 deterministic JSON（固定 schema / key 順序）。
- `--apply`（及 `--commit` / `--push` / `--deploy` / `--write`）：**明確拒絕**（exit 2），非忽略。

### 17.3 允許的 content roots（allowlist）

只掃 `content/github/posts` 與 `content/blogger/posts` 之直屬 `*.md`（排除 `.fb.md` sidecar）。**不掃** `content/settings` / `content/*/pages` / `dist*` / `validation-fixtures` / 任意 repo 外部路徑。slug 格式驗證拒絕 `..` traversal、`/`、`\`、URL-encoded、絕對路徑。

### 17.4 唯一解析

`0 筆 → hard-fail(not-found, exit 4)`；`1 筆 → 成功(exit 0)`；`≥2 筆 → hard-fail(not-unique, exit 5)`。**不默默取第一筆**；`--site` 可消歧。

### 17.5 顯示欄位（唯讀；安全子集）

title / id / slug / repo-relative source path / contentRoot / site / contentKind / primaryPlatform / category / date / updated / status / draft / status⇔draft 一致性 / publishTargets 摘要（enabled+mode）/ 是否有 publish sidecar / Blogger·GitHub publishing metadata 摘要（blogger status·publishedUrl·publishedAt·hasPostId、github enabled·publishedUrl）。

### 17.6 明確**不**輸出

article body、secrets / token / credentials、大量原始 frontmatter、repo 外部 absolute path。（contract guard 以 secret marker + body 字串斷言 human 與 json 兩模式皆不外洩。）

### 17.7 分級

- **hard-fail（非 0 exit）**：非法 slug（3）/ traversal（3）/ 找不到（4）/ slug 命中多篇（5）/ frontmatter 無法解析（6；cache-independent 偵測）/ status·draft 型別不合法（7）/ 不支援的 write·apply 參數（2）/ invalid projectRoot（1）。
- **warning-only（不影響 exit code、不自動修復）**：status⇔draft 矛盾（顯示 ⚠ 標示但仍 exit 0）、publishing metadata 缺漏。

### 17.8 zero-write 保證

resolver 只 import `readFile`（node:fs/promises）/ fast-glob / gray-matter；**未** import / 呼叫任何寫入 API（writeFile / appendFile / mkdir / rename / copyFile / unlink / rm / safe-write / admin-write-cli / patchFrontmatter）。contract guard §13a 以 import-line + call-site 靜態斷言此契約；§12 斷言 lookup 後檔案 byte-identical；§13b 斷言 mtime 不變。

### 17.9 Browser UI / CLI 邊界

本 slice **未**新增任何 Admin UI「讀取文章」按鈕、**未**新增 local server bridge、**未**新增 repository write API。Admin UI 維持 dev-only、read-only、無 fetch/fs。Phase A 以 **CLI / resolver foundation** 為交付；未來若接入 Admin UI 須另開 phase。

### 17.10 與 Blogger / 未來 Phase 邊界

- 本功能**不修改** Blogger 線上貼文、**不**登入 Blogger、**不**碰 GA4 / AdSense / gh-pages / deploy。
- **`--apply` 不存在**（明確拒絕）。write path（Phase B dry-run patch / Phase C apply / Phase D commit-push / Phase E deploy）**皆未實作、皆 NO-GO、各須另開 phase + Dean explicit approval**。

---

## 18. Phase B 實作紀錄（dry-run-only status/draft patch planner；2026-07-14 landed）

Phase B 已落地為 **dry-run-only** lifecycle patch planner：產生 redraft / republish 之 status+draft 兩欄位變更計畫（human diff + JSON plan + source/target SHA-256），**絕不寫檔**。

### 18.1 檔案 / 進入點

| 檔案 | 角色 |
| --- | --- |
| `src/scripts/redraft-plan.js` | planner（`planRedraft` / `applyLifecyclePatch`〔byte-preserving 兩欄位記憶體 patch，含 boolean 支援〕/ `formatPlan` / `runCli`）。 |
| `src/scripts/check-redraft-plan.js` | contract guard（23 斷言；OS temp fixtures；finally 清除）。 |
| npm `admin:plan-redraft` | `node src/scripts/redraft-plan.js`（CLI 進入點）。 |
| npm `check:redraft-plan` | 跑 contract guard。 |

### 18.2 使用方式

```bash
npm run admin:plan-redraft -- --slug=<slug> --op=redraft|republish [--site=github|blogger] [--json]
# 或
node src/scripts/redraft-plan.js --slug=<slug> --op=redraft [--json]
```

- redraft：`status ∈ {ready, published} + draft:false` → `status:draft + draft:true`。
- republish：`status:draft + draft:true` → `status:ready + draft:false`。
- `--op` 必填且必須符合當前 lifecycle 狀態（不符 → `precondition-not-met`，exit 8）。

### 18.3 輸出

- **human diff**（deterministic）：status / draft old→new、byte-level 兩行 frontmatter diff（含行號）、source/target SHA-256、boundary 說明。
- **JSON plan**（`--json`；deterministic 固定 schema/key 順序）：`op / slug / sourcePath / contentRoot / current / target / changes[] / expectedOldValues / sourceSha256 / targetSha256 / dryRun:true / apply:false / written:false / effectNote`。
- **SHA-256**：`sourceSha256` = 原始檔 bytes 之 SHA-256；`targetSha256` = 記憶體中 patch 後內容之 SHA-256（供未來 Phase C apply 前後核對）。

### 18.4 byte-preserving 兩欄位成對變更

`applyLifecyclePatch` 只替換 frontmatter 中唯一 top-level `status:` 與 `draft:` 兩行之值，其餘一切 byte-for-byte 不變（inline array / nested block / 註解 / 引號風格 / CRLF 皆保留；contract guard 斷言「恰 2 行 differ」）。boolean `draft` 以 literal `true`/`false` 表示（不加引號）。fail-closed：缺 status/draft 行、重複、block scalar、非 boolean literal、raw↔parsed precondition mismatch、no-op。

### 18.5 zero-write 保證 + 既有 write 路徑不變（紅線）

- planner 只 import `readFile`（node:fs/promises）/ `node:crypto`（hash）/ Phase A resolver；**未** import safe-write / admin-write-cli / admin-frontmatter-patcher / admin-write-whitelist，**未**呼叫任何寫入 API。contract guard 以 import-line + call-site 靜態斷言，並斷言 planning 後檔案 byte-identical + mtime 不變。
- **未修改**既有 dormant real-write whitelist：`admin-frontmatter-patcher.js` 之 `ALLOWED_TOP_LEVEL_KEYS` 與 `admin-write-cli.js` 之 `ALLOWED_FIELDS` 維持 `{description, searchDescription}`、**未**加入 `status`/`draft`（contract guard 靜態斷言此不變式）。Phase B 之 boolean/兩欄位 patch 走**獨立** planner，不經既有 write 路徑。

### 18.6 明確拒絕的參數 / 邊界

- `--apply` / `--write` / `--commit` / `--push` / `--deploy` / `--save` / `--output` **明確拒絕**（exit 2，非忽略）。
- **無** apply / write / commit / push / build / deploy 路徑。Phase C（local apply）、D（commit/push）、E（deploy）**皆未實作、皆 NO-GO、各須另開 phase + Dean explicit approval**；Phase C 另受 §10 git-safety preflight（branch / ahead-behind / index.lock）未實作之阻擋。
- 不修改 Blogger 線上貼文、不碰 GA4 / AdSense / gh-pages。

---

## 19. git-safety preflight 實作紀錄（read-only repository safety checker；2026-07-14 landed）

§10 之三項 git-safety 缺口（branch == main / `main == origin/main` ahead-behind / `.git/index.lock`）已落地為**純唯讀、可重用**的 repository safety preflight + contract guard。**零寫檔、零 git mutation、零 network fetch、零自動修復、零 lock deletion、零 apply、零 build/deploy。**此為未來 Phase C local apply 的前置安全門，**通過 ≠ 已授權寫入**。

### 19.1 檔案 / 進入點

| 檔案 | 角色 |
| --- | --- |
| `src/scripts/admin-git-safety-preflight.js` | reusable helper（`evaluatePreflight` / `runGit` / `parsePorcelainZ` / `samePath` / `formatReport` / `exitCodeFor`）+ CLI adapter（`runCli`）。 |
| `src/scripts/check-admin-git-safety-preflight.js` | contract guard（32 斷言；OS temp isolated git repos；finally 清除）。 |
| npm `admin:check-git-safety` | `node src/scripts/admin-git-safety-preflight.js`（CLI 進入點）。 |
| npm `check:admin-git-safety-preflight` | 跑 contract guard。 |

### 19.2 使用方式

```bash
npm run admin:check-git-safety           # human-readable
npm run admin:check-git-safety -- --json # deterministic JSON
```

- 預設唯讀 safety check；`--json` 輸出固定 schema / key 順序。
- **明確拒絕**（exit 2，非忽略）：`--apply` / `--write` / `--fix` / `--repair` / `--unlock` / `--delete-lock` / `--reset` / `--checkout` / `--stash` / `--clean` / `--fetch` / `--pull` / `--push` / `--commit` / `--deploy` 及任何未知參數。

### 19.3 Safety gate 契約（全部 hard-fail；未過即 non-zero exit、eligible:false）

| gate | 失敗分類 | exit |
| --- | --- | --- |
| projectRoot 合法（非空絕對路徑且存在） | `invalid-project-root` | 10 |
| 位於 git worktree（`rev-parse --show-toplevel`） | `not-git-repository` | 11 |
| repository top-level == 傳入 project root（不接受外部／上層 repo） | `repo-root-mismatch` | 12 |
| branch == main（不自動 checkout） | `wrong-branch` / `detached-head` / `unresolvable-head` | 13 / 14 |
| `refs/heads/main` 存在 | `missing-main-ref` | 15 |
| `refs/remotes/origin/main` 存在（本機 remote-tracking ref；未 fetch） | `missing-origin-main-ref` | 16 |
| ahead == 0 && behind == 0（`rev-list --left-right --count main...origin/main`） | `ahead-of-origin` / `behind-origin` / `diverged` | 17 / 18 / 19 |
| working tree clean（staged / unstaged / untracked / deleted / renamed / conflicted 皆涵蓋；`.gitignore` 排除者依 git status 真實結果不視為 dirty） | `dirty-working-tree` | 20 |
| `.git/index.lock` 不存在（`rev-parse --git-path index.lock` 定位；不刪除／不修改） | `index-lock-present` | 21 |
| git 命令執行成功 | `git-command-failed` | 22 |
| 危險 / 未知 CLI 參數 | `unsupported-argument` | 2 |

eligible → exit 0。多重 failure 時取排序後第一項（deterministic priority）之 exit code。

### 19.4 只用的 read-only git 命令（allowlist；defense-in-depth）

`rev-parse --show-toplevel` / `branch --show-current` / `rev-parse --verify HEAD` / `rev-parse --verify refs/heads/main` / `rev-parse --verify refs/remotes/origin/main` / `rev-list --left-right --count main...origin/main` / `status --porcelain=v1 -z --untracked-files=all` / `rev-parse --git-path index.lock`。`runGit` 以子命令 allowlist（`rev-parse` / `branch` / `rev-list` / `status`）+ forbidden set 雙層拒絕任何 mutation / network 子命令（**絕不** fetch / pull / push / add / commit / reset / checkout / switch / restore / stash / clean / gc / rm / merge / rebase / update-index / update-ref / init / apply）。

### 19.5 輸出（無 secrets / 無檔案內容 / 無 repo 外部絕對路徑）

- **human**：repository root / branch / HEAD·main·origin/main short hash / ahead·behind / working tree clean·dirty / dirty entry count / index.lock present·absent / eligible / failure reasons / `network fetch performed: no` / `write performed: no` / 「通過 preflight ≠ 已授權寫入」note。
- **JSON**（固定 key 順序）：`schemaVersion / mode:"read-only-preflight" / repositoryRoot / projectRoot / branch / head / mainHead / originMainHead / ahead / behind / workingTreeClean / dirtyEntryCount / dirtyPaths / indexLockPresent / eligible / failures / warnings / networkFetchPerformed:false / writePerformed:false`。
- dirty paths 僅輸出 **repo-relative 路徑**（非檔案內容、非 repo 外部絕對路徑）；不輸出 credentials / token / git config / 環境變數 / 檔案內容。

### 19.6 zero-write / zero-mutation 保證（紅線）

- helper 只 import `spawnSync`（node:child_process）/ `existsSync`（node:fs）/ path / url；**未** import / 呼叫任何寫入 API（writeFile / rename / unlink / rm / safe-write / admin-write-cli / patcher）。
- **不** fetch / pull / push；`networkFetchPerformed` / `writePerformed` 恆 `false`。
- `.git/index.lock` 存在時**只回報**，**絕不**刪除 / rename / truncate / 讀取內容判斷 stale；訊息要求人工確認無 git process 後再處理。
- **不**自動修復任何 failure（不 checkout main、不 pull / merge / reset、不 clean、不刪 lock）。
- contract guard 以 source 靜態掃描斷言每個 `runGit` call site 皆用 allowlisted 子命令、無 fetch/pull/push；並以 production repo read-only smoke 斷言 smoke 前後 HEAD / working tree / index.lock **三者狀態不變**。

### 19.7 測試 / contract guard（32 斷言；isolated temp git repos）

覆蓋：porcelain-z parser（staged/unstaged/untracked/deleted/rename/empty）、samePath、runGit 拒絕 mutation 子命令、危險 flag 集合；PASS（main/0-0/clean/no-lock → eligible exit 0）；hard-fail 全套（wrong-branch / detached-head / missing-main-ref〔unborn repo〕/ missing-origin-main-ref / ahead 1-0 / behind 0-1〔commit-tree 同 tree 保 clean〕/ diverged 1-1 / staged / unstaged / untracked / deleted / conflicted〔merge conflict〕/ index.lock present〔且斷言 lock 不被刪除/修改〕/ repo-root-mismatch〔subdir〕/ non-git dir / invalid projectRoot）；determinism（human + JSON byte-identical + 固定 key 順序）；no-leak（僅 repo-relative path、無 secret 檔案內容）；source no-write git command contract；no fetch/pull/push；**production repo read-only smoke（HEAD / tree / index.lock 前後不變）**；回歸（Phase B planner 仍拒 `--apply`、既有 real-write whitelist 未加 status/draft）；CLI 全危險參數 exit 2。temp git fixture 可建 commits / refs 但隔離於 OS temp、finally 清除、**不**污染 production repository。

### 19.8 與 Phase C 的整合邊界

- 本 slice **只**匯出 reusable read-only preflight + 獨立 CLI + contract guard；**未**修改 `redraft-plan.js`（Phase B planner 仍可獨立 dry-run，未接入 git-safety）、**未**新增 `--apply`、**未**串接 plan → write CLI、**未**改 real-write whitelist、**未**實作 atomic two-field write / expected source SHA apply / commit / push。
- 未來 Phase C actual apply **必須先呼叫此 preflight**（eligible:true 才前進），但 **actual local apply 仍未實作、仍需 Dean explicit approval**；atomic two-field filesystem write 與 expected source SHA recheck 仍是下一階段缺口。
- 不修改 Blogger 線上貼文、不碰 GA4 / AdSense / gh-pages / deploy。

---

## 20. Phase C.1a 實作紀錄（dormant atomic apply engine；fixture-only；2026-07-14 landed）

Phase C 的 **atomic two-field write 本體**已落地為 **dormant、fixture-only** engine：具備 filesystem write 能力，但**未接任何 production 入口**、**只在 contract guard 之 OS temp isolated git fixtures 實際寫入**、**production content 從未被測試寫入**。**通過所有安全門 ≠ 已授權寫入**；正式 CLI 啟用（Phase C.1b）須另開 phase + Dean explicit approval。

### 20.1 檔案 / 進入點

| 檔案 | 角色 |
| --- | --- |
| `src/scripts/redraft-apply-engine.js` | dormant engine（`applyLifecycleAtomic({ projectRoot, plan, validateAfterWrite })`）。**無 CLI apply 進入點**；`isMainModule` 只印 dormant 提示、不 apply。 |
| `src/scripts/check-redraft-apply-engine.js` | contract guard（36 斷言；OS temp isolated git repos；finally 清除）。 |
| npm `check:redraft-apply-engine` | 跑 contract guard。**未**新增任何 `admin:apply-redraft` / `--apply` / production apply CLI。 |

### 20.2 Engine API 與安全門順序（寫入前全部 hard-fail-able）

`applyLifecycleAtomic({ projectRoot, plan, validateAfterWrite })` 依序：

1. **參數 + validation callback 必要性**：`validateAfterWrite` 缺失／非 function → `validation-callback-required`，**寫入前 hard-fail**（沒有 post-write validation 不得寫入）。
2. **§5.1 plan schema**：`dryRun:true` / `apply:false` / `written:false` / `op ∈ {redraft, republish}` / `changes` 精確為 `{status, draft}` 兩筆 / `current` 符 op 前置 / `target` 精確等於 op 固定轉換（拒任意 target status）/ status⇔draft 成對一致 / `sourceSha256`·`targetSha256` 皆 64-hex 且相異 / `sourcePath` 落在 allowlisted content root 且 site 對齊。不接受自行拼裝的不完整 plan。
3. **§5.2 repository safety**：engine **自行**重跑 `evaluatePreflight`（§19）；要求 `eligible && branch===main && ahead===0 && behind===0 && workingTreeClean && !indexLockPresent`。任一不符 → `repository-not-eligible`。**不** fetch / pull / push / checkout / reset / stash / clean / delete-lock / 自動修復。
4. **§5.3 article re-resolution**：以 `plan.slug` / `plan.contentRoot` 重新呼叫 Phase A resolver；驗證唯一命中、`sourcePath`·`slug`·`site` 皆等於 plan、落在 allowlist。**不信任呼叫端任意檔案路徑**（目標絕對路徑由重新解析結果組裝）。
5. **§5.4 source SHA / TOCTOU**：重讀當下 bytes 計算 SHA-256；`!== plan.sourceSha256` → `stale-source`。**不**自動重產 plan、**不**覆蓋最新檔案。
6. **§5.5 lifecycle precondition**：當下 `status`／`draft` 必須等於 `plan.current` 且符 op 轉換；狀態已改變 / 矛盾 / archived / no-op → hard-fail。
7. **§5.6 target recomputation**：以 Phase B `applyLifecyclePatch` 重算 candidate；`recomputedTargetSha256 !== plan.targetSha256` → `target-sha-mismatch`；防禦性斷言 candidate 與原檔**恰 2 行 differ**（status + draft），body / slug / 其他 frontmatter / EOL / 引號風格 / key order 皆由 Phase B 契約保留。
8. **§6 atomic write**：**僅**在上述全通過後執行 same-directory atomic replace。

### 20.3 Atomic-write / Windows / file-mode 行為

- **same-directory** temp（`.<base>.redraft-apply.tmp-<pid>-<seq>-<attempt>`），**exclusive create（`wx`）** 避免與既有 temp 衝突／覆蓋；寫入精確 candidate bytes → `fsync`（file flush）→ `chmod` 精確還原原始 mode → `fs.rename` over 目標。
- **Windows**：`fs.rename` 於同目錄以 `MoveFileEx(REPLACE_EXISTING)` 語意替換既有檔（與既有 `safe-write.js` 同一 Node 契約）；**不**假設 POSIX rename 語意即成立。
- **file mode**：寫入前 `stat` 取 `mode & 0o777`，寫入後對 temp `chmod` 同值再 rename → 原始 mode / permissions 保留（contract guard 斷言）。
- 成功或失敗（含 rollback）後**皆不留 temp residue**（`finally` 清 temp handle / unlink）。
- **不動 sidecar**（`.publish.json` / `.fb.md`）、**不動任何其他檔**。

### 20.4 Post-write validation + rollback

- 寫入後重讀並核 `targetSha256`；再呼叫必要的 `validateAfterWrite({ projectRoot, sourcePath, plan })`（可 async）。engine **不**由此 commit / push / build / deploy。
- **validation success** → 回報成功（bytes 保留、target SHA 正確、無 temp residue）。
- **validation failure**（或 post-write 讀取／SHA 核對失敗）→ 以**原始 source bytes** 執行 atomic rollback → 重新驗證 source SHA 恢復 → 原始 mode 恢復 → 無 temp residue → 回報 `apply failed + rollback succeeded`、無半套 lifecycle state。
- **rollback 本身失敗** → high-severity hard failure：`needsManualInspection:true`、**絕不**宣稱成功、明示需人工檢查。（此極端路徑僅於 isolated fixture 概念覆蓋；實測 rollback 失敗跨平台不穩定，列為已知限制。）

### 20.5 維持的 dormant / 未啟用狀態（紅線；contract guard 靜態斷言）

- engine **無** production CLI 入口、**未**新增 `admin:apply-redraft` npm script、**未**被任何 production CLI / Admin UI / existing write CLI import；`node redraft-apply-engine.js` 只印 dormant 提示、exit 0、不 apply。
- **未**修改既有 real-write whitelist：`admin-frontmatter-patcher.js` `ALLOWED_TOP_LEVEL_KEYS` 與 `admin-write-cli.js` `ALLOWED_FIELDS` 維持 `{description, searchDescription}`、未加 `status`/`draft`。
- Phase A（`admin-article-lookup`）/ Phase B（`redraft-plan`）CLI 仍拒 `--apply`（exit 2）。
- engine 只 import Phase A resolver / Phase B patch / Phase C0 preflight；**不** import safe-write / admin-write-cli / whitelist / patcher / child_process；source 靜態掃描斷言無 `spawnSync` / `exec` / `fetch` / git mutation / deploy 呼叫。
- `package.json` 無任何 `--apply` / apply-redraft 入口；engine `.js` 僅由其 guard script 引用。

### 20.6 驗證快照（2026-07-14）

`check:redraft-apply-engine` **36/0**；回歸維持：`check:redraft-plan` **23/0**、`check:admin-git-safety-preflight` **32/0**、`check:admin-article-lookup` **26/0**、`check:github-redraft-lifecycle` **13/0**、`check-github-draft-metadata`（direct node）**11/0**、`validate:content` **0/135/107**、`check:npm-script-targets` **68/68**、`check:release-readiness-contract` **14/14**、`check:phase1-readiness-contract` **23/23**。production content tree / HEAD / `.git/index.lock` 於全部 fixture 測試前後不變；temp fixtures 全清、無 residue；**無** build / deploy / gh-pages 變動。

### 20.7 與 Phase C.1b 邊界

- 本 slice **只**交付 dormant engine + guard + docs；**未**接正式 CLI、**未**啟用 `--apply`、**未** commit / push 文章狀態、**未** build / deploy。
- Phase C.1b（正式 CLI activation）須**另開 phase + Dean explicit approval**，且 disabled-by-default；**通過所有安全門 ≠ 已授權寫入**。commit / push / build / deploy 與本 write path 仍完全分離。

---

## See also

- `docs/20260714-github-redraft-lifecycle-contract.md`（lifecycle + build 契約；本 preflight 之上位；§6 指向本文件）
- `src/scripts/admin-write-cli.js` / `admin-write-whitelist.js` / `admin-frontmatter-patcher.js` / `safe-write.js` / `git-status-check.js`（既有 dormant write infra）
- `src/scripts/load-posts.js`（`classify()` 唯一輸出判斷）/ `src/scripts/check-github-redraft-lifecycle.js`（lifecycle guard）
- `docs/20260617-phase2-admin-write-path-*`（既有 Admin write path 系列 preanalysis / dry-run / design acceptance）
- `docs/20260710-phase1-rc-docs-index.md` §5 / §7（Admin write path dormant；須 Dean explicit approval）
- `CLAUDE.md` §23（發布狀態；draft 不得進正式 dist）、§24（Blogger 發布 URL 回填）、§27（Claude Code 修改規則）、§29（第一版不做）

---

（本文件結束 / end of document）
