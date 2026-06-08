# CLAUDE.md Soft Compression Plan — Preanalysis (docs-only)

Phase: `20260608-am-5-claude-md-soft-compression-plan-preanalysis-docs-only-a`
Date: 2026-06-08
Status: docs-only preanalysis; no CLAUDE.md mutation; no `/memory` use; no compression executed.

---

## 1. Executive Summary

- 本階段為 **docs-only preanalysis**：規劃 CLAUDE.md soft compression 的安全方案與驗收標準。
- **不**實際壓縮 CLAUDE.md。
- **不**使用 `/memory`。
- **不**修改 CLAUDE.md、source、settings、fixtures、templates、views、package。
- 上一階段 `20260608-am-4-claude-memory-size-preflight-readonly-a` 已測得 CLAUDE.md = **57,063 bytes / 1,865 lines**；Claude UI 顯示 **~43.4k chars > 40k** 警告。
- 主要膨脹源 = §3.2「站台設定」內之 download + commerce 累積敘事（約 16.2 KB / 28.4%）。
- 建議採 **soft compression**：保留語意、保留紅線、降低重複；不採 hard rewrite。
- 本 preanalysis 不啟動實作；實作須另闢 phase，且 plan / implementation / acceptance 必須**三階段分離**。

---

## 2. Current Size Baseline

| 項目 | 值 |
|---|---|
| HEAD | `8c9fddf5987ffe485ee696fdac210c4c371c3f0d` |
| origin/main | `8c9fddf5987ffe485ee696fdac210c4c371c3f0d` |
| ahead/behind | 0 / 0 |
| latest subject | `docs(commerce): plan C4 inactive ref validation` |
| validate | `0 errors / 68 warnings / 58 posts` |
| CLAUDE.md bytes | **57,063** |
| CLAUDE.md lines | **1,865** |
| Claude UI 顯示 chars | **~43.4k** (UI 計數方式不明；byte 計數較保守) |
| UI 警告閾值 | 40k chars |
| 超出量 | ~3.4k chars (UI 計數) / ~17 KB (byte 計數) |

**最大區塊（依 bytes 排序，preflight 階段測得）：**

| Bytes | % | Section |
|---:|---:|---|
| 16,212 | 28.4% | §3.2 站台設定（download + commerce 累積敘事） |
| 5,044 | 8.8% | §8 建議資料夾結構（完整 directory tree） |
| 2,302 | 4.0% | §16.4 ### Blogger → GitHub Pages（reverse UTM source landed 詳細狀態） |
| 1,258 | 2.2% | §16.4 ### GitHub Pages → Blogger（已實作） |
| 1,223 | 2.1% | §3.1 文章資料（完整 frontmatter example） |

**估計可安全壓縮量** = ~19.6 KB。

**壓縮目標**：
- **理想**：CLAUDE.md 降到 < 40k chars，消除 UI 警告。
- **次佳**：降到 ~37–39 KB byte 範圍，留出未來 phase 累積空間。
- **底線**：不為了壓縮而動到任何 red line / dormant flag / current baseline / Claude operating rules。

---

## 3. Must-Keep Context

未來壓縮時**必須保留**（原文或語意等價的明確濃縮，不得 silently drop）。

### 3.1 系統治理層
- §1 系統目的（10 條 design principles）。
- §4 技術限制（必用 vs 禁用框架清單；尤其禁用 React / Vue / Astro / Next / Nuxt / Tailwind / 後端資料庫 / 會員 / Blogger API / Drive API / 留言 / View 數 / Like / 全文搜尋 / 自動社群發文）。
- §7 系統分類編號 A–Z（phase 報告依此 mapping）。
- §27 Claude Code 修改規則（修改前說明 / 修改後回報 / 禁止 git push / 禁止刪除 / 禁止換技術選型）。
- §29 第一版不做清單。

### 3.2 §3.2 治理紅線（兩組 governance red lines）
download registry 紅線：
- 永不含 respondent data。
- 永不含 access token / API key / OAuth secret / 帳號 email / Drive folder ID。
- Google Forms responses remain in Google Forms / Sheets，不進 repo。
- reverse UTM remains **dormant**；pm-26 deploy gate remains **BLOCKED**。
- Admin Apply / middleware write / admin-write-cli remain **dormant**。

commerce registry 紅線：
- 永不含 affiliate dashboard credentials / access token / refresh token / Authorization header。
- 永不含 commission / payout / clickCount 等 dashboard 統計。
- 永不含帳號 email / 結算密碼 / 私人 Drive folder ID。
- 不用 URL pattern 自動推斷 merchantKey / networkKey / linkId。
- 禁止為 fixture 修改 production `affiliate-networks.json`。
- reverse UTM dormant、pm-26 BLOCKED、Admin Apply / middleware / admin-write-cli dormant。

### 3.3 Current Baseline Snapshot
- validate = `0 errors / 68 warnings / 58 posts`。
- HEAD = `8c9fddf` （壓縮 commit 落地後改寫為當下值）。
- latest accepted subject。

### 3.4 Active Registries State
- `download-assets.json` / `download-forms.json` = empty registry；loader read-only；registry-level shape + dup-key validator landed；R2 not-found + R5b intra-post duplicate landed；R4 inactive、R6 coexistence rules deferred。
- `commerce-links.json` = empty registry；loader read-only；11 條 registry-level warning rules landed（R3–R9、R11–R14；R1/R2/R10/R15 deferred）。

### 3.5 Active Validators State
- commerce content-ref C1 / C2 / C3 / C5 / C6 landed（warning-only）。
- commerce content-ref C4 docs-only plan 已 land（per `docs/...-c4-...` series）；source 未實作。
- commerce content-ref C7 / C8 / C9 deferred。
- commerce content-ref fixtures：C1 / C2 / C3 / C5 / C6（共 5 個 post-level fixtures）已 land。
- commerce fixture mechanism = Option D（skip settings-level fixtures；Option A naming 保留為未來 escape hatch）。

### 3.6 Dormant / Blocked Items
所有以下狀態必須以「dormant」/「blocked」/「not implemented」明確標示，不得改寫成「已實作」或被靜默移除：
- renderer fallback / output。
- Admin picker / selector / display / Admin Apply。
- middleware write / admin-write-cli。
- registry seed（production `commerce-links.json` / `download-*.json` 維持 empty）。
- production content migration（`download.fileUrl` → `assetRefs[]` / `formRef`；raw URL → `ref`）。
- build / deploy / Blogger repost / GA4 commerce dimension。
- reverse UTM live activation。
- pm-26 deploy gate。

### 3.7 Reverse UTM 雙向狀態
- **GitHub Pages → Blogger** = live / production。
- **Blogger → GitHub Pages** = source landed（pm-24a/b/c, 2026-05-23, commits `7e1d356` / `e2309e9` / `7c769fe`）；un-deployed；dormant；pm-26 gate BLOCKED。
- 此兩方向之**不同 live state** 是高 recall 風險區，**絕對不可** 在壓縮時被混為「皆 live」或「皆 dormant」。

### 3.8 Content Model 核心約定
- §11 contentKind vs `blogger.type` 分離原則。
- §12 affiliate.enabled / links empty 警告規則。
- §13 download.enabled / fileUrl 警告規則。
- §16.1 / §16.2 nofollow + rel 規則。
- §16.5 relatedLinks / otherLinks production behavior。
- §23 status enum（`draft / ready / published / archived`）。
- §24 Blogger 發布 URL 回填規則。

---

## 4. Compression Candidate Inventory

| # | Section / 區段 | 目前內容類型 | 為何可壓 | 提議替代 | 完整內容在哪 | Risk | 需保留原文? |
|---:|---|---|---|---|---|---|---|
| 1 | §3.2 download R2 / R5b 詳細多段敘事 | per-phase landing 詳述（rule id / cascade / fixture / production 影響） | 已被 commit messages + preanalysis 完整記錄；CLAUDE.md 只需保留「已 land + warning-only」 | 一行：「R2 not-found + R5b intra-post duplicate landed (commits `145a548` / `077c3d1`); warning-only; see `docs/20260602-download-registry-aware-validation-preanalysis.md`」 | commits + preanalysis doc | Low | No |
| 2 | §3.2 commerce 11 條 registry rule 完整列表 | 11 條 rule id + cascade + suppress 細節 | rule list 由 `validate-content.js` + commit `94a1d47` 持有；CLAUDE.md 只需列 count + deferred list | 短表格：landed = R3–R9, R11–R14 (11 rules)；deferred = R1, R2, R10, R15；warning-only；see `docs/20260603-...-night-22-...-preanalysis.md` + commit `94a1d47` | code + commit | Low | No（但 deferred 清單需保留） |
| 3 | §3.2 commerce C1 / C2 / C3 / C5 / C6 詳細描述 | 每條 ~6–10 行描述（cascade / scope / guard / warning style） | 每條 rule 在獨立 preanalysis 已凍結；CLAUDE.md 重述只造成 drift 風險 | 5 行表格：rule id / warning-only / scope short / preanalysis pointer | per-rule preanalysis docs | Low | No |
| 4 | §3.2 commerce fixture mechanism A/B/C/D 比較 | 4 option pros / cons / 決策理由 | 已凍結於 `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md` | 一行：「Option D selected（skip settings-level fixtures, mirror download R1 cadence）；Option A naming reserved；Option B/C rejected。see preanalysis.」 | preanalysis doc | Low | No |
| 5 | §3.2 baseline math 重複（60/53 → 66/57 → 68/58 出現 3 次） | 同一 math 在 download / commerce registry / content-ref 三節各算一次 | 重複；只需保留**一次**最終值（68/58）+ 一行歷史脈絡 | 一行：「current = 68/58；含 download R5b fixture (+2/+1) + commerce content-ref C1/C2/C3/C5 fixtures (+6/+4) + C6 fixture (+2/+1)」 | history 來自 commits | Medium（若刪除則無法追溯每個 +δ 出處，但 commit messages 已記錄） | No |
| 6 | §8 建議資料夾結構 完整 directory tree | ~230 行 tree dump | tree 是「建議」非「現況」；現況可由 `Glob` 即時觀察；docs/ 路徑會持續演化 | 10 行 top-level 概要 + pointer：「see `docs/architecture.md` if present，or live `Glob`」 | live filesystem | Medium（若有 contributor 從未跑過 build，會缺乏 onboarding tree；但本專案 contributor = 1） | No |
| 7 | §16.4 Blogger → GitHub Pages pm-24a/b/c 詳細 commit-level 描述 | per-commit 檔案改動清單 + verification 註記 | 屬 phase-report 等級細節，不屬於長期 CLAUDE.md | 5 行：「source landed pm-24a/b/c (2026-05-23) commits `7e1d356` / `e2309e9` / `7c769fe`；un-deployed；dormant；pm-26 BLOCKED；see `docs/reverse-utm-fixture-plan.md`」 | phase reports + commits | Low | **Yes** — 「source landed but un-deployed / dormant / pm-26 BLOCKED」字樣必須完整保留 |
| 8 | §3.1 完整 frontmatter example | ~55 行 YAML | CLAUDE.md 本身已寫「See also `docs/publish-bundle.md` §2.6.1」 | 縮為 10 行 key 欄位摘錄 + pointer | `docs/publish-bundle.md` §2.6.1 + `docs/migration-from-frontmatter.md` §4 + `docs/related-links-schema.md` | Low | No |

**累計壓縮潛力估算**：
- #1 ~3.5 KB
- #2 ~2.8 KB
- #3 ~3.3 KB
- #4 ~1.4 KB
- #5 ~0.6 KB
- #6 ~4.5 KB（保留 top-level outline）
- #7 ~1.8 KB
- #8 ~1.0 KB
- **合計 ~18.9 KB** → CLAUDE.md ~57 KB → ~38 KB（已低於 40k chars UI 警告閾值，UI 計數通常略低於 byte 計數）。

---

## 5. Proposed Soft Compression Rules

未來實際壓縮時必須遵守：

1. **紅線一字不動或語意完全等價的明確濃縮**。若無把握，**保留原文**。
2. **dormant / blocked / not implemented 狀態必須保留**，且用字明確（不可改寫為 deferred / planned / future 等含混措辭）。
3. **current baseline 必須保留一次且正確**。若壓縮 commit 改變 baseline（如 commit 落地 → HEAD 推進），baseline 區塊必須同步更新為實際值，不得引用過時值。
4. **不用長段 final report**；改用 docs pointer + commit hash。
5. **不重複列完整 rule details**；改用小表格。
6. **不保留完整 folder tree**；改成 top-level 短摘要 + pointer。
7. **不移除任何「禁止事項」與「第一版不做」**。
8. **不把不確定內容寫成已完成**；尤其 reverse UTM Blogger→GitHub「source landed but un-deployed」絕不可被簡化為「landed」。
9. **不引入新功能狀態**；壓縮 ≠ 新增 acceptance / 新增 rule / 新增 dormant entry。
10. **不使用 `/memory`**；CLAUDE.md 編輯必須走檔案層 Edit / Write，不走 memory CLI。
11. **不改動 `MEMORY.md`** 作為 CLAUDE.md 替代品。CLAUDE.md 是 project instruction；MEMORY.md 是 auto-memory index，職責不同。
12. **單一 PR / 單一 commit**：所有壓縮編輯集中於一個 commit，subject 必須清楚標示「docs(claude): soft compress」之類，方便 rollback。

---

## 6. Proposed Target Shape of CLAUDE.md

未來壓縮後建議章節骨架（順序與粒度可微調，但**必須涵蓋**以下載點）：

1. **Purpose / Principles**（§1 原文保留）。
2. **Hard Red Lines**（§3.2 兩組 governance red lines 合併為一節，原文保留）。
3. **Current Baseline Snapshot**（HEAD / origin/main / validate / latest subject；單行 table；隨每次重大 commit 更新）。
4. **Active Registries State**（download / commerce empty registry + loader + validator landed rule counts；表格化）。
5. **Active Validators State**（rule id + warning-only + pointer；表格化）。
6. **Dormant / Blocked Items**（renderer / Admin / middleware / registry seed / migration / build / deploy / Blogger repost / GA4 commerce / reverse UTM live / pm-26；bullet list；明確標記）。
7. **Reverse UTM Bi-directional Status**（GitHub→Blogger live；Blogger→GitHub source-landed-but-un-deployed；兩 state 不可合併）。
8. **Content Model**（§11 / §12 / §13 / §16 / §17 / §23 / §24 等核心 schema 約定；可分小節，可縮例子）。
9. **Publishing / URL / UTM Behavior**（§16 + §24 + §21）。
10. **First-version Not-do List**（§29 原文保留）。
11. **Docs Index / Historical Checkpoints**（取代 §8 directory tree；列重要 docs/* 路徑）。
12. **Claude Operating Rules**（§27 原文保留）。

**未列章節之處理**：技術限制（§4）、系統分類編號（§7）、CSS 命名（§9）、Design System（§19）、JS 互動（§20）、圖片素材（§22）、備份（§25）、package.json 指令（§26）、最終樣貌（§30）— 各保留原文或微縮（移除重複 bullet），不大幅重寫。

---

## 7. Acceptance Criteria for Future Compression

未來執行 CLAUDE.md soft compression 時，**驗收必須全部滿足**：

| # | Criterion | 驗證方式 |
|---:|---|---|
| 1 | CLAUDE.md byte size **明顯降低**；理想 < 40k chars (UI 閾值) | `wc -c CLAUDE.md` 對比壓縮前 |
| 2 | `npm run validate:content` = **0 errors / 68 warnings / 58 posts**（或當下實際 baseline，不得倒退） | 跑 validate |
| 3 | **無** `src/**` / `content/**` / `content/settings/**` / `content/validation-fixtures/**` / `templates/` / `views/` / `package.json` / `package-lock.json` 變更 | `git diff --stat` 必須只見 `CLAUDE.md`（+ 可選 `MEMORY.md` 索引更新，若同步觸及） |
| 4 | 所有 red lines 原文保留（grep 比對關鍵字串） | grep `respondent data` / `access token` / `pm-26` / `dormant` / `BLOCKED` |
| 5 | 所有 dormant flags 原文保留 | grep `dormant` / `not implemented` / `un-deployed` / `BLOCKED` |
| 6 | current baseline 出現且正確 | 視覺檢查 |
| 7 | **無**「已實作」/「已 live」之錯誤升級 | diff review |
| 8 | **無** production behavior 改變 | 壓縮 commit 不含 .js / .json / .md 文章 / .scss / .ejs 修改 |
| 9 | git diff 可逐段審閱、語意保留 | 人工 review |
| 10 | rollback path 清楚（single commit revert 可還原） | `git revert <hash>` 可乾淨還原 |
| 11 | 壓縮 commit 不混入功能改動（plan / impl / accept 三階段分離） | commit subject + diff |
| 12 | **未**使用 `/memory` | 對話紀錄審閱 |

---

## 8. Risk / Rollback Plan

### 8.1 Risks

| Risk | 描述 | Mitigation |
|---|---|---|
| **R-1 Over-compression loses context** | 壓縮過度導致未來 session 缺乏關鍵 dormant / red line context | §3 must-keep list + §7 acceptance grep checks |
| **R-2 Future Claude misses docs pointer** | 壓縮後改用 pointer，但未來 session 可能不主動讀 docs/* | 在 CLAUDE.md 各 pointer 處明示「Claude must read X before acting on Y」 |
| **R-3 Red line accidentally weakened** | 例如 `pm-26 BLOCKED` 被改成 `pm-26 deferred`，語氣弱化 | grep 字串級檢查；§5 規則 1–3 + §7 criterion 4 / 5 / 7 |
| **R-4 Baseline staleness** | 壓縮 commit 本身改變 HEAD，baseline 區塊未同步 | §5 規則 3：壓縮 commit 必同步更新 baseline 區塊；acceptance read-only phase grep HEAD |
| **R-5 reverse UTM 雙向 state 被合併** | 「GitHub→Blogger live」與「Blogger→GitHub source landed but un-deployed」被誤合成單一狀態 | §3.7 must-keep 條目；§7 criterion 7；diff review 必看 §16.4 區塊 |
| **R-6 Folder tree 移除後 onboarding 缺失** | §8 移除後新 contributor / 新 session 缺乏專案地圖 | 保留 top-level 10 行 outline + 指向 live `Glob` |
| **R-7 同一 phase 混入 plan + impl + accept** | 違反三階段分離原則 | 本 plan 明示禁止；下一階段必須只做 acceptance cross-check |

### 8.2 Rollback Plan

1. 若 compression commit 落地後發現任何 acceptance criterion 失敗或 red line 被弱化：
   - `git revert <compression-commit>` → 產生反向 commit。
   - `git push origin main` → 還原 CLAUDE.md 至壓縮前狀態。
   - validate 必須再次 `0/68/58`（或當下 baseline）。
2. 若 commit 已 push 但其後又有新 commit 疊加：
   - 仍以 `git revert <compression-commit>` 為主；**不**用 `reset --hard`。
   - 後續 commit 若依賴 compression commit 之內容（不應該，因 compression 為 docs-only），需逐一檢視。
3. 若僅有局部段落需還原（partial rollback）：
   - 開新 phase「`...-claude-md-partial-restore-...`」，從 git history 取原文段落 cherry-pick 回 CLAUDE.md。
4. **絕不**為了搶救而 force-push 或刪 branch。

### 8.3 Acceptance Cross-check Must Follow Implementation

任何 compression implementation phase **完成後**，必須單獨開一個 read-only acceptance phase，跑：
- `wc -c CLAUDE.md` 對比。
- `npm run validate:content`。
- grep red line keyword set。
- grep dormant flag set。
- 視覺 review §16.4 reverse UTM 雙向 state。
- 視覺 review §3.2 current baseline 區塊。

---

## 9. Candidate Next Phases

僅列出，**不**執行。

| Phase 名稱 (建議) | 類型 | 目的 |
|---|---|---|
| `20260608-am-6-claude-md-soft-compression-plan-acceptance-readonly-a` | read-only acceptance | cross-check 本 plan 內容、grep red lines / dormant flags / baseline 完整存在於現況 CLAUDE.md、確認 candidate inventory 與實際 byte / line 對應正確 |
| `20260608-...-claude-md-soft-compression-impl-docs-only-b` | implementation (僅編 CLAUDE.md) | 依本 plan 之 §6 target shape + §5 rules 實際壓縮 CLAUDE.md；single commit；diff review |
| `20260608-...-claude-md-soft-compression-acceptance-readonly-c` | read-only acceptance | 跑 §7 12 條 acceptance criteria；any FAIL → trigger rollback |
| `final-idle-freeze` | EXIT | 若決定不執行壓縮，直接接受 43.4k warning，繼續其他 phase |

**不**推薦：
- ❌ Hard rewrite。
- ❌ 在同一 phase 內混合 plan + impl + accept。
- ❌ 使用 `/memory` 編輯 CLAUDE.md。
- ❌ 將 §8 folder tree 直接 wholesale delete（建議保留 top-level outline）。

---

## 10. Final Recommendation

1. **下一步 = read-only acceptance cross-check of this plan**（`20260608-am-6-...-acceptance-readonly-a`）。
   - 目的：在實際動 CLAUDE.md 之前，先確認本 preanalysis 與現況 CLAUDE.md 一致（candidate line ranges、red line wording、baseline 數字皆對齊）。
2. **不要直接 hard rewrite**。soft compression 保留語意與紅線；hard rewrite 風險過高。
3. **不要使用 `/memory`**。CLAUDE.md 不是 memory file，是 project instruction file；走 Edit / Write。
4. **不要把 compression implementation 跟 plan 混在同一階段**。即使下一階段通過 acceptance，也應**另開 implementation phase**，並再**另開** acceptance read-only phase 驗收。
5. 若 user 決定**不**壓縮，接受 43.4k UI 警告亦可——警告只影響效能感知，**不**影響功能。可選擇 Final Idle Freeze。

---

## 11. Explicit Non-actions (this phase)

本階段 **未**：
- 修改 CLAUDE.md
- 使用 `/memory`
- 修改 `src/**` / `content/**` / `content/settings/**` / `content/validation-fixtures/**` / templates / views / `package.json` / lockfile
- 新增或修改 fixture
- seed registry
- migrate production content
- 實作 renderer fallback
- 動 Admin picker / Admin Apply / middleware / admin-write-cli
- 跑 `npm install` / `npm run build` / deploy
- repost Blogger / 驗 GA4
- 啟動 reverse UTM live
- unblock pm-26
- 實作 C4 / C7 / C8 / C9 source

唯一新增物 = 本檔 `docs/20260608-claude-md-soft-compression-plan-preanalysis.md`。
