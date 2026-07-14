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
| 1 | 在 git repository 內 | 隱含 | hard-fail |
| 2 | 在 `main`（或明確允許 branch） | **缺** → 新增 | **hard-fail** |
| 3 | working tree clean（或明確拒絕覆蓋使用者修改） | ✅ `enforceCleanGit` | hard-fail |
| 4 | `main == origin/main`（ahead／behind 明確處理） | **缺** → 新增 | **hard-fail**（ahead/behind ≠ 0 → 拒或明示） |
| 5 | `.git/index.lock` 不存在 | **缺** → 新增 | **hard-fail** |
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
| **B. dry-run patch generation** | 產生僅含 status+draft（白名單）之 old/new diff（含 boolean 支援、兩欄位耦合、expectedOldValue）；**不 apply**。 | ❌ | ❌ |
| **C. local apply, no Git automation** | 全部 preflight（§10）通過 + Dean 明確確認後：原子寫入 Markdown → `validate:content` → `check:github-redraft-lifecycle`。**不 commit / 不 push / 不 deploy**。 | ✅（.md only） | ❌ |
| **D. optional Git assistance** | 另行評估 commit／push 輔助；**仍不得與 deploy 綁定**。 | — | commit/push（Dean-gated） |
| **E. deploy assistance** | 另一個 Dean-gated slice；build + 同步 dist→gh-pages 使 URL 生效 404。 | — | deploy（Dean-gated） |

**對現有架構的調整建議**：Phase A 之 read-only lookup 部分 Admin 已有（顯示既有文章），可只補「CLI 唯讀查詢 + slug 唯一 resolver」小切片；Phase B 需先在 patcher 加 boolean 支援（現況 `new-value-must-be-string`）。順序維持 A→B→C→D→E 不變（write 前置 read-only、apply 前置 dry-run，皆與既有 dormant CLI 的兩段式一致）。

---

## 15. Explicit non-goals（本 session 明確不做）

啟用 `--apply`；改 Admin UI 操作按鈕；新增 repository write API；改 production Markdown / 任何 status·draft；commit／push production content；build production；deploy；動 gh-pages；Blogger API 寫入 / Blogger 下架；永久刪除；git history rewrite；自訂網域；AdSense；大型 Admin 重構；新增未經分析的 metadata 欄位；實作自動 commit／push／deploy。**本 session 僅 docs（+ 必要 docs index，若有）。**

---

## 16. Go／no-go recommendation for the next coding slice

**本 session（analysis/docs-only）= 完成；不啟用任何 write path。**

> **2026-07-14 update**：Phase A（read-only article lookup）**已於後續 coding slice 落地**（見 §17）。
> 下一建議 slice 改為 **Phase B（dry-run-only status/draft patch generation）**，仍 **NO-GO for `--apply`**。

下一 coding slice（原建議，已完成）：

```
GO for read-only article lookup (Phase A)   ← DONE 2026-07-14
```

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

## See also

- `docs/20260714-github-redraft-lifecycle-contract.md`（lifecycle + build 契約；本 preflight 之上位；§6 指向本文件）
- `src/scripts/admin-write-cli.js` / `admin-write-whitelist.js` / `admin-frontmatter-patcher.js` / `safe-write.js` / `git-status-check.js`（既有 dormant write infra）
- `src/scripts/load-posts.js`（`classify()` 唯一輸出判斷）/ `src/scripts/check-github-redraft-lifecycle.js`（lifecycle guard）
- `docs/20260617-phase2-admin-write-path-*`（既有 Admin write path 系列 preanalysis / dry-run / design acceptance）
- `docs/20260710-phase1-rc-docs-index.md` §5 / §7（Admin write path dormant；須 Dean explicit approval）
- `CLAUDE.md` §23（發布狀態；draft 不得進正式 dist）、§24（Blogger 發布 URL 回填）、§27（Claude Code 修改規則）、§29（第一版不做）

---

（本文件結束 / end of document）
