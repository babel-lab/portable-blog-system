# CLAUDE.md size warning compression preanalysis

Phase name: `20260616-night-claude-md-size-warning-compression-preanalysis-docs-only-a`
Timestamp: 2026-06-16 22:27
Type: docs-only preanalysis（**不**壓縮、**不**重寫、**不**刪內容、**不**碰 source）
Baseline HEAD: `36fffe3`（`docs(blog): checkpoint phase1 mainline readiness`）

---

## A. Baseline 狀態

| 項目 | 值 |
| --- | --- |
| pwd | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD | `36fffe321b70a8983d39390074657b43baf6c63f` |
| origin/main | `36fffe321b70a8983d39390074657b43baf6c63f` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest commit subject | `docs(blog): checkpoint phase1 mainline readiness` |

Recent 5 commits（newest first）：

```
36fffe3 docs(blog): checkpoint phase1 mainline readiness
2de35e9 docs(admin): checkpoint admin stage progress
3628fcb docs(admin): record detail panel browser pass
df0c02f docs(admin): accept detail panel collapsible sections
f89ad09 feat(admin): collapse detail panel sections
```

**Baseline verify PASS（與使用者預期完全一致）。**

---

## B. 警告內容與影響

新開 Session 時 CLI 出現：

```
⚠ Large CLAUDE.md will impact performance (227.9k chars > 40.0k)
```

### B.1 警告含意

- Claude Code harness 每次 Session 啟動會把 `CLAUDE.md` 全文注入 system prompt。
- 超過 ~40k chars 後：
  - prompt token 使用量上升 → 每次回應前置成本變高
  - context window 預算被「規範文件」吃掉 → 留給實際對話 / tool result 的空間下降
  - prompt cache 雖會吸收重覆部分，但首次 / 超量 invalidation 時成本爆量

### B.2 對既有工作流的實質影響

- 大量 ledger 已是「歷史記錄」性質、**不需要每次 Session 都讀**。
- 規範 / 紅線 / 第一版 MVP 清單 / 不做清單 / SEO·連結·圖片規則等是**真的每次都需要**。
- 目前 CLAUDE.md 把這兩類混在同一檔，造成「規範被 ledger 淹沒」。

---

## C. CLAUDE.md 目前大小

| 計量 | 值 |
| --- | --- |
| bytes（`wc -c`） | 284,431 |
| chars（`wc -m`） | 227,910 |
| lines（`wc -l`） | 1,624 |
| 警告閾值 | 40,000 chars |
| 目前 vs 閾值 | **5.7×** 上限 |

### C.1 區段大小分布

實測（`awk` 逐行累計 `length($0)+1`，含換行）：

| 行號 | 角色 | 大小（chars） | 占比 |
| --- | --- | --- | --- |
| 1–197 | header + §1 系統目的 + §2 平台定位 + §3.1 文章資料 + §3.2 設定 | 3,697 | 1.3% |
| 198–222 | download / commerce registry landing point（含現狀 ledger） | 6,494 | 2.3% |
| **223–320** | **「GA4 article bottom nav P1」+「當前 baseline」（巨型 ledger）** | **196,785** | **69.2%** |
| 321–end | §4–§30 技術限制 / 階段計畫 / CSS 命名 / SEO / 圖片 / 發布 / Claude 修改規則 / 第一版必做/不做 | 20,934 | 7.4% |

附註：`wc -c`（284,431）≈ `wc -m` × CJK 多 bytes 修正；本表用 `awk length()` = 字元數，與「227.9k chars」警告口徑一致。

### C.2 最關鍵發現：單一巨型行

- **Line 293 一行就佔 113,958 chars**（41.7% 全檔），即「當前 baseline」之 normal validate baseline 那一句被無限串接的 Blogger AdSense / Batch 0 / Batch 1 / Batch 2 / Phase D / Phase F / N7–N9e / pm-1 → pm-28 / am-1 → am-15 / Batch 1a / Batch 1 expansion 全部記錄壓縮為單行 Markdown bullet。
- Line 225 之 GA4 P1 entry = 1,582 chars。
- Line 223–290 其餘 ledger 段（ADMIN am-1 → pm-25、night-1、night-2）已是各自分行，多數每行 1–6k chars。

→ **壓縮 / 治理的首要目標 = line 293 巨型行**；單獨處理它就能把檔案從 227.9k 降到 ~114k；若 line 293 + lines 223–290 一併移出可降到 ~31k（已低於 40k ideal）。

### C.3 主要 heading 結構（行號）

```
1   # CLAUDE.md
8   # 1. 系統目的
29  # 2. 目前兩平台定位
121 # 3. 核心資料來源
    198 ### download-assets.json / download-forms.json
    208 ### commerce-links.json
    223 ### GA4 article bottom nav P1（report-verified；idle freeze 解除）   ← 巨大 ADMIN ledger 起點
    291 ### 當前 baseline                                                      ← 巨大 Blogger AdSense ledger 起點
321 # 4. 技術限制
357 # 5. 開發方向
365 # 6. 分階段開發計畫
775 # 7. 系統分類編號
810 # 8. 建議資料夾結構
835 # 9. CSS 與 class 命名規則
923 # 10. Blogger Design Token 匯出
953 # 11. 文章類型
975 # 12. 書評文章規則
1021 # 13. 下載文章規則
1039 # 14. 標籤管理規則
1065 # 15. 分類管理規則
1080 # 16. 連結處理規則
1179 # 17. 文章頁基本版型
1225 # 18. 首頁 / 目錄頁規則
1249 # 19. Design System 頁規則
1301 # 20. JavaScript 互動功能
1325 # 21. SEO 規則
1355 # 22. 圖片與素材管理
1408 # 23. 發布狀態規則
1439 # 24. Blogger 發布 URL 回填
1466 # 25. 備份與搬家規則
1484 # 26. package.json 指令
1511 # 27. Claude Code 修改規則
1547 # 28. 第一版 MVP 必做清單
1573 # 29. 第一版不做清單
1594 # 30. 專案最終樣貌
```

### C.4 最近 ledger 區塊位置

- ADMIN 系列 ledger（am-1 → pm-25）：**行 225–290**（各自分行）
- 「當前 baseline」單一巨型行 ledger（Blogger AdSense 全戰史）：**行 293**
- Registry empty-landing ledger（download / commerce）：**行 198–222**

---

## D. 必須保留在 CLAUDE.md 的內容類型

以下屬於「規範 / 紅線 / current operating rules」，**不可移除**、必須留在 CLAUDE.md：

1. **§1 系統目的**（10 條核心理念：可搬家 / Markdown+frontmatter / 不綁 Blogger / 不過度工程化…）。
2. **§2 兩平台定位**（Blogger 流量入口 + AdSense；GitHub Pages 技術主站；模式 full / summary / redirect-card）。
3. **§3.1 文章資料 frontmatter 模板**（id / site / contentKind / title / slug / category / tags / status / publishTargets / blocks…）。
4. **§3.2 設定檔清單**（site / themes / categories / tags / ads / social / promotion / affiliate / link-rules / seo / ga4 / navigation / sidebar / footer / download-* 主清單；屬於目錄索引）。
5. **§4 技術限制**（必用 Vite/EJS/SCSS/Vanilla；禁用 React/Vue/Astro/Tailwind/後端/會員/Blogger API/Drive API…）。
6. **§5 開發方向 + §6 分階段計畫**（Phase 0–8 各階段範疇）。
7. **§7 系統分類編號**（A–Z 分類）。
8. **§8 建議資料夾結構**（top-level outline）。
9. **§9 CSS / class 命名規則**（`lab-` prefix / BEM / Flexbox 優先 / SCSS 集中）。
10. **§10–§24 各規則章節**（Blogger Design Token / 文章類型 / 書評 / 下載 / 標籤 / 分類 / 連結處理 / 文章版型 / 首頁 / Design System / JS / SEO / 圖片 / 發布狀態 / Blogger URL 回填）。
11. **§25 備份與搬家規則**。
12. **§26 package.json 指令**。
13. **§27 Claude Code 修改規則**（每次修改前後須報告的格式 + 不得自動執行清單）。
14. **§28 第一版 MVP 必做清單**。
15. **§29 第一版不做清單**。
16. **§30 專案最終樣貌**。
17. **核心紅線**（散落於 §16.4 / §16.5 / registry landing point 區塊；節錄）：
    - real AdSense client / slot id 只存 `ads.config.json`，不得寫入 docs / CLAUDE.md / source hardcode
    - commerce registry 不得含 token / credential / email / dashboard 統計
    - download registry 不得含 respondent data
    - reverse UTM remains dormant；pm-26 deploy gate BLOCKED
    - Admin Apply / middleware write / admin-write-cli remain dormant
    - 不得自動 git push / 刪除大量檔案 / 加入 React/Vue/Tailwind / 加入後端 / 加入 Blogger API…
18. **`See also:` 指標**（§3.1、§11、§12、§16.4、§24 等已有的 docs cross-link 集中表，本身就是壓縮手段）。

→ 上述若全部保留 = **~31k chars，已落在 ≤40k ideal 目標**。

---

## E. 可移出 / 可壓縮 / 可改成 pointer 的內容類型

以下屬於「歷史 ledger / 已有 docs 可追溯」，**可安全移出**或壓縮為 pointer：

### E.1 line 293 之「當前 baseline」單一巨型行（113,958 chars）

- 內容 = Blogger AdSense 從 N7 → N9e → Phase D → Phase E → Phase F → Batch 0 → Batch 1 → Batch 1a → Batch 2 → pm-1 → pm-28 之**全戰史**。
- **每一筆都已有獨立 docs/** 對應檔（如 `docs/20260611-adsense-n9e-*`、`docs/20260612-blogger-adsense-batch-*` 等）。
- 可改寫為 ~30 行的「當前 validation baseline 數值 + Blogger AdSense 戰史 docs 索引」pointer table，預估降至 < 5k chars。

### E.2 line 223–290 之 ADMIN 系列 ledger（~83k chars）

- 內容 = 20260615-pm-2 → 20260616-pm-25 之 ADMIN UI / read-only consume / governance signals / validator-warning join / collapsible sections 全紀錄。
- 同樣每筆已有 `docs/20260616-admin-*.md`（pm-2 → pm-25 與 night-1/night-2 共 ~30 個檔）。
- 可改寫為 ~15 行的 ADMIN 線 docs 索引 pointer，預估降至 < 3k chars。

### E.3 §3 之 download / commerce registry landing 區塊（6,494 chars，行 198–222）

- 內容混合「當前狀態」（landing point empty registry / L1 seed 10 entries）+「historical ledger」（哪些 commit、哪些 rule landed）。
- 可拆：
  - 保留「當前狀態 1–2 行」於 CLAUDE.md（必要 current state）。
  - 「rule landing 戰史」移至 `docs/registry-status-*.md` 索引。
- 預估降至 < 1.5k chars。

### E.4 多個重覆 acceptance 描述

- 同一句「`validate:content` 0/94/84 不變」、「real id 仍只存 `ads.config.json`」、「未開 Blogger / AdSense 後台」等出現數十次。
- 在歷史 ledger 中是 per-phase non-actions 必要；但 ledger 一旦移出 docs 後，僅須在 CLAUDE.md「紅線」段 1 次。

---

## F. 不可直接刪除的風險內容

以下若直接刪除（**不**做 docs archive）會喪失資訊或破壞操作安全：

| 內容類型 | 風險 | 處置建議 |
| --- | --- | --- |
| 當前 validation baseline 數值（normal 0/94/84、overlay 0/101/85） | 後續 phase 判斷 regression 須有對照基準 | **必須保留為 1 行** snapshot 於 CLAUDE.md |
| guard counts（resolver 34/0、article-block 13/0、anchor-wiring 14/0、blogger-output 85/0、commerce-resolver 23/0、admin-governance-aggregation 16/0、validation-report 14/0、admin-validation-consume 12/0） | regression detection 對照 | 保留為 1 行 snapshot |
| 紅線政策（real id / credential / token / respondent data 不入 repo；reverse UTM dormant；pm-26 BLOCKED；Admin write dormant） | 操作安全護欄 | **必須完整保留** |
| Phase 1 MVP completion 狀態（pages live posts 6 篇、Blogger AdSense Batch 1 minimum complete、commerce L1 seed 10 entries、GA4 P1 report verified） | 後續判斷新增 phase 屬於 Phase 1 內 vs post-Phase-1 擴張 | **保留為 status table** |
| 「不應重做」清單（Phase 1 final 不被 post-Phase-1 擴張改變） | 防止下個 Session 重啟已完成的線 | **保留為列表** |
| docs cross-link（`See also:` 指標 + ledger 移出後的 archive 索引） | 不喪失歷史追溯能力 | **必須建立 docs index** |
| Git commit SHA / 日期戳於各 ledger（如 `1586d10` 是 L1 seed HEAD） | 偶有定位需要 | **遷移至 docs archive，CLAUDE.md 不留** |

→ 結論：**任何壓縮方案都必須以 docs archive 為前提**，不可純刪除。

---

## G. 建議壓縮策略

### G.1 Option A — Soft compression（**不推薦**）

**做法**：

- 不移檔，只在原地刪除重覆的 acceptance 描述（「validate 0/94/84 不變」、「real id 仍只存 ads.config.json」等）。
- 把 line 293 巨型行從 113,958 → 50,000 chars。
- 合併 ADMIN 系列同性質連續 entry。

**預期結果**：

- chars：227,910 → ~150,000（仍 **3.75×** 警告閾值，未解決問題）。
- 風險：原地修改容易誤刪語意 / 失去歷史 / 後續 ledger 再次累積仍會撞牆。

**不推薦理由**：付出修改成本但仍超過警告閾值；典型「治標不治本」。

### G.2 Option B — Hard compression with docs archive（**次推薦**）

**做法**：

- 建立 `docs/claude-md-ledger-archive/`（**新資料夾**）。
- 把 line 223–290（ADMIN ledger）+ line 293（Blogger AdSense 戰史）原文搬移至：
  - `docs/claude-md-ledger-archive/2026-06-15-admin-ia-resume.md`
  - `docs/claude-md-ledger-archive/2026-06-16-admin-governance-line.md`
  - `docs/claude-md-ledger-archive/blogger-adsense-n7-n9-phase-d-batch-history.md`
- CLAUDE.md 對應位置改為：「歷史 ledger 已 archive 至 `docs/claude-md-ledger-archive/`；當前 validation baseline + Blogger AdSense live inventory snapshot 見下表」+ 索引表。

**預期結果**：

- chars：227,910 → **~31,000**（落在 ≤40k ideal）。
- 風險：搬移過程須逐段 diff 確認不喪失內容；歷史內容仍可追溯（已 commit 入 docs/）。

**優點**：

- 完整保留歷史。
- CLAUDE.md 解除警告。
- 後續 Session 啟動快。

**缺點**：

- archive 仍在 repo（git push 一次後永久存在）。
- 需做 1 次中等規模 docs-only commit（純 docs 搬遷，不碰 source）。

### G.3 Option C — Current-state-only CLAUDE.md + docs index pointers（**推薦**）

**做法**：

- 同 Option B 之 archive 步驟。
- 但 CLAUDE.md 之 §3「核心資料來源」只保留：
  - 文章 frontmatter 範例
  - 設定檔清單
  - **新增**「當前 system snapshot」表（≤30 行）：validation baseline 數值 / guard counts / Blogger AdSense live inventory / Batch 1 minimum status / commerce registry status / reverse UTM dormant 標記 / pm-26 BLOCKED 標記
  - **新增**「歷史 ledger 索引」：指向 `docs/claude-md-ledger-archive/` + 每筆對應 docs 檔名清單（pointer-only）
- 其他 §4–§30 不動（已是純規則，未受影響）。

**預期結果**：

- chars：227,910 → **~28,000–32,000**（落在 ≤40k ideal）。
- 後續每加新 phase ledger → 加到 `docs/<date>-<phase>.md`，**不**回寫 CLAUDE.md（avoid 累積回 40k）。
- CLAUDE.md「當前 system snapshot」表偶爾 update（如 baseline 數值變動），但維持 1 行 1 數值，不再累積。

**優點**：

- 解決問題根因（避免未來 ledger 再次累積回 40k）。
- CLAUDE.md 角色純化為「規範 + 當前快照」，不再兼任歷史 ledger。
- 後續 Session 認知負擔降低。

**缺點**：

- 比 Option B 多一步「定義 snapshot 表內容 schema」。
- 須建立「未來新 phase 不得回寫 CLAUDE.md ledger」之團隊紀律（已在本文件提及）。

---

## H. 建議採用方案

**推薦 Option C**（current-state-only CLAUDE.md + docs index pointers）。

理由：

1. 解決問題根因（避免再累積）。
2. 與既有 docs/<date>-<phase>.md 慣例完全契合（過去 312 個 docs 已是此模式，只是 ledger 又重覆寫回 CLAUDE.md）。
3. Option B 雖也能降到 ≤40k，但若未來繼續回寫 ledger，3–6 個月後又會撞牆。
4. CLAUDE.md 規範本身（§1–§2、§4–§30，剝除 ledger 後）≈31k chars，**已在 ≤40k ideal 範圍**，搬移 ledger 後不需額外重寫規則。
5. 紅線 / 必做 / 不做清單完整保留。

**次選 Option B**：若 user 偏好「不改變 §3 結構，僅把巨型 ledger 段搬走」，採 B 仍可達 ≤40k；但須額外承諾未來不再回寫 ledger 到 CLAUDE.md。

**不推薦 Option A**：成本接近 B/C，但效果不達標。

---

## I. 未來 implementation phase 的安全步驟

當 user 批准執行壓縮後（**本 phase 不執行**），建議分兩個獨立 phase 進行，**不混做**：

### I.1 Phase 1：docs archive landing（NOT docs-only？）

- 名稱建議：`20260617-XX-claude-md-ledger-archive-landing-a`
- 操作：
  1. 建立 `docs/claude-md-ledger-archive/` 資料夾。
  2. 從 CLAUDE.md 行 198–320 完整原文搬出到 3 個 archive 檔（download/commerce / ADMIN / Blogger AdSense）。
  3. **CLAUDE.md 本身暫不動**（保留歷史 ledger 原文），先讓 archive 落地。
  4. acceptance：
     - `git diff --stat` 顯示新增 3 個 docs/claude-md-ledger-archive/*.md，CLAUDE.md 未變。
     - `wc -c docs/claude-md-ledger-archive/*` 加總 ≈ 200k chars（與 CLAUDE.md 移出區段一致，零字喪失）。
- 風險：低（純 docs 新檔）。
- 紅線：**不**動 CLAUDE.md、**不**動 source。

### I.2 Phase 2：CLAUDE.md compression（NOT docs-only）

- 名稱建議：`20260617-XX-claude-md-current-state-compression-a`
- 前置：Phase 1 已 landed 且 user 確認 archive 完整。
- 操作：
  1. CLAUDE.md 行 198–320 替換為 ~30 行「當前 system snapshot 表 + 歷史 ledger 索引 pointer」。
  2. 其他章節不動。
  3. acceptance：
     - `wc -m CLAUDE.md` ≤ 40,000 chars。
     - 透過 grep 確認紅線政策 / Phase 1 MVP / 不做清單 / `lab-` prefix / `See also:` 連結等關鍵字仍存在。
     - 透過 ledger 索引可從 CLAUDE.md 跳到任一歷史 phase doc（pointer 正確）。
- 風險：中（修改 CLAUDE.md 本體；但已有 archive 作 backup）。
- 紅線：**不**動 source / settings / content / build / deploy / 任何 Blogger / GA4 / AdSense 後台。

### I.3 Phase 3：team discipline 更新（docs-only）

- 名稱建議：`20260617-XX-phase-discipline-no-ledger-writeback-a`
- 操作：於 CLAUDE.md §27（Claude Code 修改規則）或 `feedback_phase_discipline.md` memory 新增一條：「新 phase 完成後 ledger 寫到 `docs/<date>-<phase>.md`，**不**回寫 CLAUDE.md `### 當前 baseline` 段」。
- 紅線：純規則 update。

---

## J. 明確 non-actions（本 phase）

本 phase **嚴格未做**：

- ❌ 未修改 CLAUDE.md（含 ledger / snapshot / 任何行）
- ❌ 未建立 `docs/claude-md-ledger-archive/`
- ❌ 未搬移任何 ledger 內容
- ❌ 未修改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / lockfile / `dist/` / `gh-pages` / `.cache/`
- ❌ 未 build / deploy / push gh-pages / Blogger repost / 開 Blogger / AdSense / GA4 後台
- ❌ 未 npm install
- ❌ 未啟動 BLOG / ADMIN / Blogger / GA4 / AdSense 任何 source / UI 變更
- ❌ 未 amend / rebase / reset / force push
- ❌ 未 cherry-pick / merge / branch operation
- ❌ 未跑 validate:content / 任何 check guard（read-only baseline carry forward）
- ❌ 未啟用 reverse UTM deploy / pm-26 gate / Admin write path
- ❌ 未做 Phase 1 / 2 / 3 implementation（壓縮策略只 propose，不執行）
- ❌ 未動 user memory / `/memory` / MEMORY.md

唯一 mutation = 本 preanalysis doc 自身（+ 後續可選 commit）。

---

## K. Exit / handoff note

**結論**：

1. Baseline 與 user 預期完全一致（HEAD `36fffe3`，clean，0/0）。
2. CLAUDE.md 目前 227.9k chars，超出 40k 警告閾值 **5.7×**。
3. 主要 bloat 集中於 §3 內兩個 ledger 段（行 223–320），合計 **~197k chars（69.2%）**，且 line 293 單行就佔 114k。
4. CLAUDE.md 規範主體（§1–§2、§4–§30，剝除 ledger）≈ 31k chars，**已在 ≤40k ideal**。
5. **推薦 Option C**：current-state-only CLAUDE.md + docs index pointers，分 3 個獨立 phase 執行（archive landing → compression → discipline update）。
6. 任何壓縮 / 搬移**必須以 docs archive 為前提**，不可純刪除（紅線政策、Phase 1 MVP 狀態、validation baseline 數值不可遺失）。

**Handoff**：

- 下一個建議 phase = `20260617-XX-claude-md-ledger-archive-landing-a`（NOT docs-only，但僅新增 archive 檔，不動 CLAUDE.md 本體；須 user explicit approval）。
- 並行可行 = 保守 idle freeze（不執行；接受目前警告繼續工作，缺點 = 後續 Session 成本持續上升）。
- 紅線：archive landing、compression、discipline update 三 phase 一律獨立、不混做；CLAUDE.md compression 之 phase 須有 archive landing 完成作為前置；任何 phase 不得碰 source / settings / build / deploy / Blogger / GA4 / AdSense。

real id 仍只存 `ads.config.json`；本 doc 無任何 real AdSense id / commerce token / credential / respondent data 字面值。
