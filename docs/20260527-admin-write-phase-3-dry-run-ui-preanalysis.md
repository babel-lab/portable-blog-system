# Admin Write Infra Phase 3 — Dry-Run-Only UI Pre-analysis

Phase: `20260527-night-6-admin-write-phase-3-dry-run-ui-preanalysis-docs-only-a`
Date: 2026-05-27
Status: 🔄 docs-only pre-analysis；不啟動 source change；不啟用 actual write path

本文件為 Admin Write Infra **Phase 3（First dry-run-only UI enhancement）** 之**啟動前盤點 + 設計分析**；屬 `docs/admin-2-write-pre-analysis.md` §15.G phase 3 之 pre-analysis 階段。對齊 §15.D + §15.E + §15.G 既有設計；不重寫；不變更既有 phase 順序。

本文件**不**啟動 Phase 3 之 source change；實作留待 user 批准方案後之 Phase 3b 拆批落地（per §7）。

---

## §1 Baseline snapshot

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD | `084f284503120d1c0d0b70068fc4b87ce52c9eba` |
| origin/main | `084f284503120d1c0d0b70068fc4b87ce52c9eba` |
| short | `084f284` |
| latest subject | `docs(admin): record safe write helper checkpoint` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| `safe-write:test` | `71 pass / 0 fail` |
| `validate:content` | `0 errors / 42 warnings / 37 posts` |

關鍵 phase landings carried in：

- **Phase 2（safe-write helper source）** ✅ landed `5bcdd02`（2026-05-27 21:00 +0800）
  - 5 helpers + 1 CLI self-test + 1 npm script
  - `src/scripts/safe-write.js` / `git-status-check.js` / `admin-write-whitelist.js` / `admin-field-validators.js` / `active-source-keys.js` / `safe-write-test.js`
  - 71/71 self-test pass；validate baseline 0 drift
- **EOD §13 docs sync** ✅ landed `084f284`（本 phase 之 baseline；含 night-2 + night-3 + night-4 之 checkpoint append）

→ Phase 3 之 helper 基礎設施已就位；本 phase 評估如何把 helper 接入 Admin UI 但**不**啟用實際寫入。

---

## §2 Phase 3 目標定義

### 2.1 目標（per §15.G phase 3）

Phase 3 為 Admin write infra 第一個**碰 Admin UI** 的 phase；定位為**過渡層**：

- ✅ Admin UI 視覺上呈現「可寫入」之 affordance（Apply / Save 類 button）
- ✅ 顯示 client-side validation 預覽（重用 Phase 2 之 `admin-field-validators.js`）
- ✅ 顯示「Phase 3 dry-run only」明確提示；user 不會誤以為已可保存
- ✅ 顯示 future write readiness checklist（讓 user 看到 Phase 4 之前還缺什麼）
- ✅ 顯示 sourceKey / SEO / FB sidecar 欄位之 inline validation 結果
- ✅ 可整理 UI 文案（dry-run / disabled / banner 等）

### 2.2 非目標（明確不做）

- ❌ **不**呼叫 `safeWrite()` 對 production content 寫入
- ❌ **不**新增 Vite dev middleware / 不接 HTTP POST handler
- ❌ **不**新增 server / API route
- ❌ **不**改變既有 content / settings / templates / validation-fixtures
- ❌ **不**啟用任何 actual write path
- ❌ **不**整合 git CLI（不 spawn `git status` / `git restore`）
- ❌ **不**修改 `package.json` scripts（不新增 `dev:admin` 之類）
- ❌ **不**改變既有 Admin-1 read-only 邊界（dev-mode-only / 不入 dist / sitemap / robots Disallow）

### 2.3 與 §15.G phase 4 / 5 之邊界

- Phase 3 之 Apply button **必須 disabled**（或 click 後僅進入 dry-run flow）；按下不會發 fetch / POST / fs write
- Phase 4 = 新增 Vite dev middleware；解開「browser → Node fs」之通道；本 phase **不做**
- Phase 5 = 真正 SEO write；button 改為 enabled；本 phase **不做**

→ Phase 3 為「**UI shell + validator preview**」；不解開 write 通道。

---

## §3 Admin UI 現況盤點

per `src/views/admin/index.ejs`（~1003 LOC）+ `src/scripts/load-admin-posts.js`（~298 LOC）：

### 3.1 既有可用區塊

| 區塊 | 行數 | 屬性 | 寫入能力 |
|---|---|---|---|
| Stats bar / filters / sort / search | ~95-275 | client-side only | ❌ |
| Post list table（卡片）| ~280-410 | read-only render | ❌ |
| Detail panel（per post）| ~410-700 | read-only render + dry-run editors | ❌ |
| SEO dry-run viewer | ~625-678 | **client-side dry-run**；4 fields | ❌（no fs.write） |
| FB sidecar dry-run editor | ~545-585 | **client-side dry-run**；12 fields | ❌（no fs.write） |
| Platform routing display | ~416-457 | read-only derived | ❌ |
| FB post read-only metadata | ~516-543 | read-only display | ❌ |
| Related / other links | ~587-596 | **count only**（length） | ❌ |
| Completeness summary | ~598-617 | read-only badges | ❌ |
| Missing fields | ~611-617 | read-only badges | ❌ |

### 3.2 Loader 行為 per `load-admin-posts.js`

- glob `content/{github,blogger}/posts/*.md`；排除 `.fb.md`
- 同時讀 `.publish.json`（存在性 + 內容）
- 同時讀 `.fb.md`（13 個 read-only display 欄位 + `fbBadge` derived）
- 不寫入任何檔案
- 不解析 `.fb.md` body
- `relatedLinks` / `otherLinks` arrays **未** expose；只 derive `.length` → `relatedLinksCount` / `otherLinksCount`（line 130-131）
- `linkSources` **未**通過 loader 傳入；`toAdminView` 未使用 `settings.linkSources`

### 3.3 既有 dry-run pattern（Phase 3 之 reference design）

兩個既有 dry-run 區塊提供 Phase 3 可 mirror 之 UX pattern：

- **SEO dry-run viewer**（黃底 / `.dry-run-section` / `Start Edit` → `Show Dry-run Diff`）
  - 4 fields：description / searchDescription / titleEn / coverAlt
  - per-field 比對 → 標 `changed / unchanged / unchanged-empty`
  - **無** validator preview；**無** Apply button
- **FB sidecar dry-run editor**（藍底 / `.fb-dry-run-section` / `Edit FB Metadata` → `Show FB Dry-run Diff`）
  - 12 fields；frontmatter simulation
  - **無** validator preview；**無** Apply button

→ Phase 3 應在這些 dry-run 區塊**之上**疊加 validator preview + Apply button (disabled)；不取代既有 dry-run；不重寫 client-side diff 邏輯。

### 3.4 仍無 actual write path

`grep -n 'fs.writeFile\|writeFile' src/views/admin/index.ejs src/scripts/load-admin-posts.js` → **0 命中**
`vite.config.js` → 無 custom middleware / 無 API routes
無 server / 無 HTTP POST handler / 無 IPC endpoint

→ 即使 Phase 3 加上 Apply button，UI 與 fs 之間仍**完全隔離**（per 設計目標）。

---

## §4 Phase 3 可做項目

per §2.1 目標細化：

### 4.1 Apply / Save button visible but disabled

- 既有 SEO dry-run section 底部加 `<button>Apply</button>` 但 `disabled` + visual treatment（灰色 + cursor: not-allowed）
- 同理 FB dry-run section
- HTML：
  ```html
  <button type="button" class="dry-run-apply" disabled
          title="Phase 3 dry-run only — actual write 由 Phase 5 啟用">
    Apply (disabled — Phase 3 dry-run only)
  </button>
  ```
- **不**綁 click handler；或 click handler 為 noop（保險：避免 future 重構誤啟用）

### 4.2 Tooltip / helper text 說明 Phase 3 dry-run only

- 既有 `.dry-run-warning` 段加一段 Phase 3 specific 說明：
  ```
  ⚠️ Apply button disabled — Phase 3 dry-run only.
  Phase 5 才會啟用實際寫入。當前請手動編輯 source 檔 + git commit。
  ```
- Apply button 之 `title` attribute（hover tooltip）統一文案

### 4.3 Client-side validation preview

- import `admin-field-validators.js`（ESM；既有 file；無新 dep）至 inline script
- 不過：Admin 為 server-rendered EJS；client-side 不易 import ESM module；**建議**改為 EJS server-side compute 一次 + 把 `LIMITS` 嵌入 dataset；client-side 跑簡化版（length / control char regex）
- 顯示 inline：
  - `description`: 「目前 0 / 1000 chars」
  - 超出 → 紅字 `description-too-long`
  - control char → 紅字 `description-has-control-chars`
- per-field 顯示 `{ ok: true }` 之綠勾 or `{ ok: false, error }` 之紅 ✗ + error code

### 4.4 Future write readiness checklist 顯示

新增 detail-section（或全站 banner）：

```
Future write readiness（Phase 5 啟動條件）：
  ✅ Phase 2 safe-write helper landed (5bcdd02)
  ⏸ Phase 3 dry-run-only UI（本 phase；implementation pending）
  ⏸ Phase 4 Vite dev middleware
  ⏸ Phase 5 actual SEO field write
```

讓 user 看到 chain 之 progression；不引導 user 點任何按鈕。

### 4.5 sourceKey / SEO / FB sidecar inline validation

- SEO dry-run：4 fields 各跑對應 validator（`validateDescription` / `validateSearchDescription` / `validateTitleEn` / `validateCoverAlt`）
- FB dry-run：12 fields 中對應 string 欄位（title / titleEn / postUrl / note 等）跑 validator
- sourceKey（屬 relatedLinks）：**本 phase 不開**；needs Phase 6 之 relatedLinks editor shell（per §15.F prereq #6）

### 4.6 UI 文案整理

- 既有 SEO / FB dry-run 文案 wording 可順手統一（dry-run / disabled / banner）
- 不改 functionality；只是 wording 一致性
- **限制**：每改一處文案都需 user 簽收；不主動潤色

---

## §5 Phase 3 不可做項目

per §2.2 非目標 + §15.G phase 3 之 acceptance gate：

| 項目 | 理由 |
|---|---|
| `fs.writeFile()` / `fs.rename()` 對 production content | 屬 Phase 5 之 write path；本 phase 嚴禁 |
| `safeWrite()` 對 production target | 同上 |
| Vite dev middleware 新增 | 屬 Phase 4；本 phase 不解開 browser → Node fs 通道 |
| HTTP POST / PUT / DELETE route | 同上；無 server 端 endpoint |
| Markdown / publish.json / fb.md mutation | 同上 |
| 新增 fixture | 本 phase 不需 fixture；validate baseline 必須保持 |
| Build / deploy | 本 phase docs-only；後續 implementation phase 也只動 src/ 不動 dist |
| Blogger repost | render 端未動；無重貼需求 |
| GA4 validation | 屬 deploy 後 user 手動操作 |
| npm install / new dependency | 整 Admin write infra 系列承諾無新 dep |
| `package.json` scripts 變更 | Phase 3 不需新 npm script；保留至 Phase 4 |
| Spawn `git status` / `git restore` from Admin UI | per §15.D.2 + §15.D.8；helper 已存在但 Admin UI 本 phase 不呼叫 |
| 改變既有 SEO / FB dry-run 之 client-side diff 行為 | 屬既有功能；本 phase 只**疊加** validator preview + Apply button shell |

---

## §6 風險分析

### 6.1 UI button 易被誤認為已可保存

- **Risk**：user 看到 Apply button 即使 disabled，仍可能誤點 / 誤抓 / 未來重構時不小心 enable
- **Mitigation**：
  - button label 直接寫「Apply (disabled — Phase 3 dry-run only)」
  - 灰色 + cursor: not-allowed + `aria-disabled="true"`
  - 上方紅底 banner 明示 dry-run（既有 `.dry-run-warning` 文案加強）
  - **不**綁 click handler（即使有人錯誤移除 `disabled`，也不會觸發任何寫入）
  - DOM 上**完全沒有** fetch / fs / endpoint 引用；無 surface 可被誤觸發

### 6.2 client-side validator import 之 module 形式

- **Risk**：`admin-field-validators.js` 為 ESM；EJS 為 server-rendered；browser script 載入 ESM 需 `<script type="module">` + 路徑 mapping
- **Mitigation**：
  - 選項 A：EJS 端 server-side 計算 validator 結果 → 嵌入 dataset → client-side 純顯示（**推薦**：避免 client-side module 載入；最少 source change）
  - 選項 B：browser 端載入 `<script type="module" src="/src/scripts/admin-field-validators.js">`；需 vite middleware 設定（vite dev 預設可 serve src/）
  - 選項 C：client-side inline 重寫簡化版 validator（複製 LIMITS 常數；不重用 ESM module）
- → Phase 3b 實作前需 user 確認選項

### 6.3 disabled button 之 a11y / 視覺一致性

- **Risk**：disabled button 顏色 / cursor / focus state 若不夠明顯，視障 user 可能誤觸
- **Mitigation**：
  - `disabled` attribute + `aria-disabled="true"` 雙重
  - 視覺：`background: #ccc; color: #666; cursor: not-allowed; opacity: 0.6;`
  - hover 不變色（不引導點擊）
  - `title` tooltip 統一文案

### 6.4 Future write path 啟用時之安全前置

Phase 5 啟動 actual write 前，必須先有：

1. ✅ Phase 2：safe-write helper landed（已完成 `5bcdd02`）
2. ⏸ Phase 3：dry-run-only UI shell + validator preview（本 phase）
3. ⏸ Phase 4：Vite dev middleware 設計 + landed；含 endpoint auth / origin check / 限 dev mode 等
4. ⏸ git dirty guard 整合 UI（caller 呼叫 `checkGitStatus()` 並顯示 dirty list）
5. ⏸ Whitelist 整合 UI（顯示 target path + isWriteAllowed 結果）
6. ⏸ Validator 整合 UI（pre-write inline check pass → enable Apply）
7. ⏸ Backup / rollback 策略文案（`git restore` 提示；不 spawn）

→ Phase 3 為這些前置之 visual stub；Phase 4 之後逐步 wiring；Phase 5 才真正寫入。

### 6.5 validate baseline 影響

- Phase 3 若只改 `src/views/admin/index.ejs` + 可能 server-side 新增 `validators` 計算到 view object → `validate:content` baseline 應**不變**（validate 只掃 content；不掃 src/views）
- 但仍需在 Phase 3b 實作後跑 `npm run validate:content` 驗證

### 6.6 既有 dry-run 行為破壞風險

- **Risk**：Phase 3 疊加 validator preview / Apply button 時可能誤改既有 dry-run 邏輯（SEO / FB 兩處）
- **Mitigation**：
  - Phase 3b 實作分 sub-batches；每 sub-batch 只動 1 個 dry-run section（如 b-1 只動 SEO；b-2 才動 FB）
  - 每批前先 manual 驗證既有 dry-run 流程仍跑通（user 在 Admin 點 `Start Edit` → `Show Dry-run Diff`）

---

## §7 建議實作切分

依**最小破壞性**原則，Phase 3 拆**獨立 sub-batches**：

### 7.1 Phase 3a：docs-only preanalysis（本 phase）

| 維度 | 內容 |
|---|---|
| 動作 | 新增本文件 `docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md` |
| 影響 source | ❌ 無 |
| 影響 content | ❌ 無 |
| 影響 fixture | ❌ 無 |
| validate baseline | 維持 `0/42/37` |
| safe-write:test | 維持 `71/0` |
| 屬性 | docs-only |
| 風險 | 🟢 零 |

### 7.2 Phase 3b：Admin UI dry-run-only implementation

| 維度 | 內容 |
|---|---|
| 動作 | source change；EJS 加 Apply button (disabled) + validator preview + readiness checklist |
| 影響 source | ✅ `src/views/admin/index.ejs`（疊加；不刪既有 dry-run）；可能 `src/scripts/load-admin-posts.js`（server-side pre-compute validator 結果至 view object）|
| 影響 content | ❌ 無 |
| 影響 fixture | ❌ 無 |
| validate baseline | 應維持 `0/42/37`；實作後驗證 |
| safe-write:test | 維持 `71/0` |
| 屬性 | source；無 fs.write；無 fetch；無 server endpoint |
| 風險 | 🟢 低 |
| 預估 LOC | ~100-200（EJS + 可選 loader server-side validator pre-compute）|

### 7.3 Phase 3c：acceptance cross-check

| 維度 | 內容 |
|---|---|
| 動作 | read-only acceptance；user 手動於 Admin UI 驗證；docs sync |
| 影響 source | ❌ 無（或僅 docs append）|
| 屬性 | read-only + docs-only |
| 風險 | 🟢 零 |

### 7.4 Phase 4：server-side write route / middleware preanalysis

| 維度 | 內容 |
|---|---|
| 動作 | docs-only；設計 Vite dev middleware shape / auth / origin check / dev-mode-only gate |
| 範圍 | 不實作；只盤點 |
| 風險 | 🟢 零 |

### 7.5 Phase 5：actual write path gated implementation

| 維度 | 內容 |
|---|---|
| 動作 | source；Vite middleware 落地 + Admin Apply button enabled + safeWrite caller wiring |
| 預估 | 等 Phase 3 + 4 全部完成；user 簽收後啟動 |
| 風險 | 🟡 中（首個 actual write；需 dry-run 演練 + git diff verify）|

→ 本 phase（3a）僅產 docs；3b / 3c / 4 / 5 全部 pending；每批之間 stop point。

---

## §8 Acceptance criteria for future Phase 3b

Phase 3b 實作完成後，**必須**通過以下 acceptance gates：

### 8.1 UI behavior

- [ ] Admin UI（dev mode）可看到 Apply button visible but **disabled**
- [ ] button label / tooltip / aria-disabled 三層皆明示 dry-run only
- [ ] 點 disabled button **不會**觸發任何 fetch / POST / fs / console error
- [ ] 既有 SEO dry-run（Start Edit → Show Dry-run Diff）仍正常運作
- [ ] 既有 FB dry-run（Edit FB Metadata → Show FB Dry-run Diff）仍正常運作
- [ ] Validator preview 顯示 length count + ok/error code per field
- [ ] Future write readiness checklist 區塊顯示 Phase 2 ✅ / Phase 3 ⏸ / Phase 4 ⏸ / Phase 5 ⏸

### 8.2 Source safety

- [ ] `src/views/admin/index.ejs` 內**無** `fetch(` / `XMLHttpRequest` / `fs.` / `safeWrite` / `writeFile`
- [ ] `src/scripts/load-admin-posts.js` 內**無** `fs.writeFile` / `safeWrite` caller
- [ ] `vite.config.js` 未改（無新 middleware）
- [ ] `package.json` 未改（無新 script / 無新 dep）

### 8.3 Test / baseline gates

- [ ] `npm run safe-write:test` = `71 pass / 0 fail`
- [ ] `npm run validate:content` = `0 errors / 42 warnings / 37 posts`（與 Phase 2 baseline 對齊）
- [ ] `git status` clean after build attempt（Phase 3b 不 build；但 verify state）

### 8.4 Boundary preservation

- [ ] no content change（`content/**/*.md` / `*.publish.json` / `*.fb.md` 全 0 改）
- [ ] no settings change（`content/settings/**` 全 0 改）
- [ ] no template change（`content/templates/**` 全 0 改）
- [ ] no fixture change（`content/validation-fixtures/**` 全 0 改）
- [ ] no dist change（`dist/**` / `dist-blogger/**` / `gh-pages/**` 全 0 改）
- [ ] no deploy（Blogger / GitHub Pages 全未動）
- [ ] no Blogger repost（render 端未動）
- [ ] no GA4 dimension change（emit 端未動）

### 8.5 Documentation

- [ ] EOD report append Phase 3b checkpoint section
- [ ] `docs/admin-2-write-pre-analysis.md` §15.G phase 3 status 更新為 ✅ landed（with commit hash）
- [ ] 本文件之 §7.2 LOC 估計回填實際數字

---

## §9 Carried-forward blockers

per `docs/admin-2-write-pre-analysis.md` §15.G + 本 phase 之 cold-start trigger：

| Blocker | 狀態 | 阻擋對象 | 解除條件 |
|---|---|---|---|
| Admin actual write path | ⏸ not enabled | sourceKey Step 6 selector / 所有 risky-editable | Phase 4 + Phase 5 |
| sourceKey Step 6 Admin selector | ⏸ blocked | 自身 | Phase 5 wrap + relatedLinks editor shell（§15.F prereq #6）|
| sourceKey Step 7-c source-inactive warning | ⏸ future | 自身 | 等真實 inactive source 出現 |
| reverse UTM | 💤 landed but dormant | pm-26 deploy gate | user 手動於 pm-26 deploy + 重貼 Blogger + GA4 Realtime 驗收 |
| pm-26 deploy gate | ⏸ blocked | reverse UTM verification | 至少 1 篇 positive GitHub cross-link fixture（per `docs/reverse-utm-fixture-plan.md` §3-§6）|

本 phase 3a **不解除**任何 blocker；僅產 docs。Phase 3b 落地後解除「Phase 3 dry-run-only UI」之 placeholder 狀態；其餘 blockers 不變。

---

## §10 Cross-links

- `docs/admin-2-write-pre-analysis.md` §15.G（Recommended Phase Sequence；本 phase 為 phase 3 之 pre-analysis）
- `docs/admin-2-write-pre-analysis.md` §15.D（Proposed Architecture；本 phase 引用 §15.D.5 / §15.D.7 / §15.D.9 之元件設計）
- `docs/admin-2-write-pre-analysis.md` §15.F（sourceKey Step 6 Prerequisites；本 phase 不解除 prereq #1-#12）
- `docs/admin-2-write-pre-analysis.md` §6（Write Strategy 比較；B + D + E + F 組合）
- `docs/admin-2-write-pre-analysis.md` §8（dry-run / diff / backup / validate / rollback 設計）
- `docs/admin-mvp-pre-analysis.md` §4 + §7（Admin MVP 階段順序）
- `docs/admin-local-boundary-pre-analysis.md` §3（Admin 邊界政策；本 phase 100% 對齊）
- `docs/20260527-end-of-day-report.md` §12 + §13（am-13 ~ am-15 + night-2 ~ night-4 checkpoint；Phase 2 helper landing 紀錄）
- `CLAUDE.md` §29（第一版不做清單；Admin 屬第二階段；不引入後端 / 不引入登入）
- `CLAUDE.md` §27（Claude Code 修改規則；說明 + 回報義務）

---

## §11 Boundary reaffirmation

本 phase（3a；本文件落地）：

| 維度 | 狀態 |
|---|---|
| 新增檔案 | ✅ `docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md`（單檔；本文件）|
| 修改既有 docs | ❌ 無 |
| 修改 source（`src/**`）| ❌ 無 |
| 修改 `vite.config.js` | ❌ 無 |
| 修改 `package.json` | ❌ 無 |
| 修改 Admin UI（`src/views/admin/**`）| ❌ 無 |
| 修改 Admin loader（`src/scripts/load-admin-posts.js`）| ❌ 無 |
| 修改 content posts | ❌ 無 |
| 修改 settings JSON | ❌ 無 |
| 修改 templates | ❌ 無 |
| 修改 validation-fixtures | ❌ 無 |
| 修改 dist / dist-blogger / gh-pages | ❌ 無 |
| npm install / 新 dep | ❌ 無 |
| build / deploy | ❌ 無 |
| Blogger repost | ❌ 無 |
| GA4 validation | ❌ 無 |
| fixture 建立 | ❌ 無 |
| amend / rebase / force-push | ❌ 無 |
| 啟動 Phase 3b 實作 | ❌ 不啟動；等 user 批准 |
| 解除既有 blocker | ❌ 無 |

---

## §12 下一步建議

per §7 拆批 + §9 blocker 狀態：

1. **本 phase 3a**：commit + push 本文件（user 確認後）→ Final Idle Freeze
2. **下次 cold-start**：user 批准 Phase 3b 方向後啟動 source change
3. **Phase 3b 啟動前**：user 需先決定 §6.2 之 client-side validator 載入方式（選項 A / B / C）
4. **Phase 3b 完成後**：跑 Phase 3c acceptance cross-check（read-only）
5. **不建議插隊**：sourceKey Step 6 selector / Step 7-c source-inactive / reverse UTM pm-26；皆等 Phase 5 actual write 穩定後

→ 本 phase **不**自行啟動下一步；停在 Pre-commit Report 等待 user 確認。

---

（本文件結束）
