# docs/claude-md-ledger-archive/

> Phase landed: `20260616-night-claude-md-ledger-archive-landing-a`
> Date: 2026-06-16 22:54
> Type: archive landing only — **本 phase 不壓縮、不改寫、不刪除 `CLAUDE.md` 本體**；僅建立 archive 資料夾 + 兩個 landing 檔，作為未來 CLAUDE.md compression phase 的安全落點。

---

## 1. Archive purpose

`CLAUDE.md` 目前 227.9k chars（cd33a10 時點），是 Claude Code 警告閾值 40k 的 **5.7×**。每次 Session cold-start 都會把整檔注入 system prompt，造成：

- prompt token 持續上升
- context window 預算被巨型 ledger 吃掉
- prompt cache 首次或超量 invalidation 時成本爆量

主要 bloat 來源（per `docs/20260616-night-claude-md-size-warning-compression-preanalysis.md` §C）：

| 區塊 | 行號 | 大小 | 占比 |
| --- | --- | --- | --- |
| §3 巨型「當前 baseline」單行（Blogger AdSense 全戰史 N7→pm-28） | line 293 | **113.96k chars** | **41.7%** |
| §3 ADMIN ledger 段（pm-2 → pm-25 + night-1 / night-2） | 行 223–290 | ~83k chars | ~30% |
| §3 download / commerce registry landing | 行 198–222 | 6.5k chars | 2.3% |
| §1–§2 + §4–§30 規範主體 | 其他行 | ~24.6k chars | ~9% |

→ `CLAUDE.md` 之**規範主體**（§1 系統目的 / §2 平台定位 / §4 技術限制 / §5–§30 規則）剝除 ledger 後僅 ~31k chars，**本來就在 ≤40k ideal 範圍**。問題不在規範，是在 ledger。

本 archive 解決方式：把 ledger 從 CLAUDE.md 移出至 `docs/`，CLAUDE.md 只保留「規範 + 當前快照 + pointer 索引」。

---

## 2. Source baseline

- branch: `main`
- HEAD: `cd33a10a4aefac9995621081e67854ebcf3c677a`
- short HEAD: `cd33a10`
- latest commit subject: `docs(claude): plan size warning compression`
- HEAD == origin/main: ✅
- ahead / behind: `0 / 0`
- working tree: clean
- CLAUDE.md 量測：284,431 bytes / 227,910 chars / 1,624 lines

本 phase 在 baseline `cd33a10` 之上建立 archive，未動 CLAUDE.md。

---

## 3. Why CLAUDE.md needs compression

依 preanalysis §B / §C / §E：

1. **規範 / 紅線 / 紀律**（§1–§2、§4–§30）= 每次 Session 都需要讀。
2. **歷史 ledger**（§3 內巨型段）= 每筆都已有獨立 `docs/<date>-<phase>.md` 對應；**不需要每次 Session 都讀**。
3. 目前兩類混在同檔 → 「規範被 ledger 淹沒」。
4. 後續每加一個 phase 又寫回 CLAUDE.md ledger → 累積壓力持續上升、撞牆只是時間問題。

→ 解決根因：**把 ledger 改放 `docs/<date>-<phase>.md`，CLAUDE.md 只保留 current state + pointer**。

---

## 4. Archive strategy: current-state-only CLAUDE.md + docs pointers

採用 preanalysis §G.3 **Option C**：

- `CLAUDE.md` 之 §3「核心資料來源」改為：
  - 文章 frontmatter 範例（保留）
  - 設定檔清單（保留）
  - **當前 system snapshot 表**（≤30 行；validation baseline / guard counts / Blogger AdSense live inventory / Batch 1 minimum status / commerce registry status / reverse UTM dormant 標記 / pm-26 BLOCKED 標記）
  - **歷史 ledger 索引**（pointer-only；指向 `docs/claude-md-ledger-archive/` 與各 phase docs）
- 其他 §1–§2 / §4–§30 不動。
- 新 phase 完成後 ledger 寫到 `docs/<date>-<phase>.md`，**不**回寫 CLAUDE.md `### 當前 baseline` 段。

預期：CLAUDE.md → ~28–32k chars，落入 ≤40k ideal，且未來不再累積回 40k。

---

## 5. What this archive covers

本 archive 落地之 phase（`20260616-night-claude-md-ledger-archive-landing-a`）已新增：

| 檔案 | 角色 |
| --- | --- |
| `docs/claude-md-ledger-archive/README.md` | 本檔；archive purpose / strategy / non-actions |
| `docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md` | current state snapshot + 歷史 ledger pointer 索引；未來 CLAUDE.md compression 可直接引用此檔作為「當前快照 + 索引」之單一來源 |

`CLAUDE.md` 本體**保持原樣**（仍含完整 ledger；227.9k chars）。

---

## 6. What this archive does NOT do

本 phase **嚴格未做**：

- ❌ 未修改 `CLAUDE.md`（含 ledger / heading / snapshot / 任何行）
- ❌ 未壓縮 / 重排 / 重寫 `CLAUDE.md`
- ❌ 未刪除任何 ledger 內容（CLAUDE.md 行 198–320 之巨型 ledger 維持原文）
- ❌ 未搬移任何 ledger 原文進 archive 子檔（本 phase 僅建立 landing；未把巨型行搬出）
- ❌ 未搬動 / 改名既有 `docs/` 檔案
- ❌ 未修改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / lockfile / `dist/` / `gh-pages` / `.cache/`
- ❌ 未 `npm install` / 未 build / 未 deploy / 未 push gh-pages / 未跑 validate / 未跑 check guard
- ❌ 未啟動 BLOG / ADMIN / Blogger / GA4 / AdSense / GitHub Pages / Reverse UTM / FB sidecar 任何新工作
- ❌ 未 amend / rebase / reset / force push / cherry-pick / merge
- ❌ 未動 `MEMORY.md` / 任何 user memory 檔
- ❌ 未對 Phase 1 final 宣告做任何降級或重新封存
- ❌ 未啟動 reverse UTM deploy / pm-26 deploy gate / Admin write path / FB sidecar 真實寫入

唯一 mutation = 本資料夾下 2 個新檔（README.md + current-state-ledger-pointer-index.md）。

---

## 7. Future compression phase handoff

依 preanalysis §I 之分 phase 路徑，本 phase 完成後**下一步候選**（各須獨立 phase + user explicit approval；不混做）：

### 7.1 Phase 2：CLAUDE.md compression（NOT docs-only）

- Phase 命名建議：`20260617-XX-claude-md-current-state-compression-a`
- 前置：本 phase（archive landing）已 landed 且 user 確認 archive 完整
- 操作：CLAUDE.md 行 198–320 替換為 ~30 行「當前 system snapshot 表 + 歷史 ledger 索引 pointer」（pointer 直接引用 `docs/claude-md-ledger-archive/20260616-current-state-ledger-pointer-index.md` 與既有 phase docs）
- 紅線：**不**動 source / settings / content / build / deploy / 任何 Blogger / GA4 / AdSense 後台

### 7.2 Phase 3：team discipline 更新（docs-only）

- Phase 命名建議：`20260617-XX-phase-discipline-no-ledger-writeback-a`
- 操作：於 CLAUDE.md §27（Claude Code 修改規則）或 `feedback_phase_discipline.md` memory 新增一條：「新 phase 完成後 ledger 寫到 `docs/<date>-<phase>.md`，**不**回寫 CLAUDE.md `### 當前 baseline` 段」

### 7.3 替代路徑：純 archive expansion（docs-only；可選；非必要）

- 若 user 偏好把巨型 ledger 原文也搬出 CLAUDE.md 但暫不改 CLAUDE.md 本體，可另開 docs-only phase 把 line 198–320 原文逐段 copy 到本 archive 之新檔（例如 `2026-06-15-admin-ia-resume.md` / `2026-06-16-admin-governance-line.md` / `blogger-adsense-n7-n9-phase-d-batch-history.md`），作為「歷史原文 backup」。
- **本 phase 不執行此 expansion**；僅 landing。

### 7.4 紅線

- archive landing / compression / discipline 三 phase 一律獨立、不混做
- compression 之 phase 須以本 archive landing 完成作為前置
- 任何 phase 不得碰 `src/` / `settings/` / build / deploy / Blogger / GA4 / AdSense / 任何 content frontmatter mutation

---

## 8. Non-actions（本 phase 明確不做；對齊 §6）

| 項目 | 狀態 |
| --- | --- |
| 修改 `CLAUDE.md` | ❌ 未做 |
| 壓縮 / 改寫 / 刪除 `CLAUDE.md` ledger | ❌ 未做 |
| 搬動既有 docs | ❌ 未做 |
| 修改 src / views / scripts / content / settings / package / lockfile / dist / gh-pages / `.cache` | ❌ 未做 |
| `npm install` / build / deploy / validate / check guard | ❌ 未做（baseline carry-forward） |
| 啟動 BLOG / ADMIN / Blogger / GA4 / AdSense / GitHub Pages / Reverse UTM / FB sidecar 新工作 | ❌ 未做 |
| amend / rebase / reset / force push | ❌ 未做 |
| 動 `MEMORY.md` / user memory | ❌ 未做 |
| 對 Phase 1 final 宣告做降級或重新封存 | ❌ 未做 |

---

real AdSense client / slot id 一律不寫入本 archive；docs 內也無 commerce token / credential / respondent data / 任何 secret 字面值。本 archive 純粹是 docs pointer 與 current state 索引。

（本文件結束）
