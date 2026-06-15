# ADMIN — Suggested-Fix Read-Only UI Preanalysis — Human Acceptance

- **Phase**：`20260616-admin-suggested-fix-readonly-ui-preanalysis-human-acceptance-a`
- **日期**：2026-06-16（07:35 起；am session）
- **性質**：docs-only human acceptance（**不**改 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `CLAUDE.md`；**不** `npm install`；**不** build / deploy / 重貼 Blogger；**不**新增 UI；**不**啟用 admin write / Apply / Save / browser write / middleware / CLI fix-cmd；**不**修 frontmatter / tags.json / categories.json / validator / loader / EJS；**不**升 validator warning 為 error；**不**做 implementation；**不**動 build output / Blogger / GA4 / AdSense；**不** amend / rebase / reset / force-push）
- **baseline**：`main` HEAD == origin/main == `0096dad`（`docs(admin): plan suggested-fix read-only ui`）；working tree clean
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 IA + 現況盤點）
  - `docs/20260615-admin-content-taxonomy-governance-preanalysis.md`（night-9 governance）
  - `docs/20260616-admin-content-taxonomy-governance-preanalysis-human-acceptance.md`（am-1 governance acceptance）
  - `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis.md`（am-2，本 acceptance target）

> **本文件性質聲明**：acceptance 判斷 preanalysis 是否符合 phase 指示之六項安全面向；不啟動 implementation；任何 implementation 切片均屬獨立 phase + user explicit approval。

---

## A. Phase name

`20260616-admin-suggested-fix-readonly-ui-preanalysis-human-acceptance-a`

---

## B. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main (ahead/behind 0/0)
HEAD           : 0096dad == origin/main
working tree   : clean
last commit    : docs(admin): plan suggested-fix read-only ui

git log --oneline -5:
  0096dad docs(admin): plan suggested-fix read-only ui
  49161c6 docs(admin): accept taxonomy governance preanalysis
  3a06fe3 docs(admin): plan taxonomy governance
  3ec1bc5 docs(admin): record tag usage acceptance
  ac0476b feat(admin): add tag usage counts
```

→ 完全符合 phase 指示。

---

## C. Files read

| 路徑 | 範圍 | 目的 |
|---|---|---|
| `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis.md` | 完整（A–L 12 區段） | 本 acceptance target |
| `docs/20260615-admin-content-taxonomy-governance-preanalysis.md` | 已於 am-1 phase 完整讀；本 acceptance 引用其 §E.5 L1–L4 分級作對齊 | cross-reference |
| `docs/20260616-admin-content-taxonomy-governance-preanalysis-human-acceptance.md` | 已於 am-1 phase 作者撰寫；不重讀 | acceptance pattern 樣板 |

→ **未**讀 / **未**修 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / `CLAUDE.md`。

---

## D. Human acceptance result

### D.1 Phase 指示六項安全面向逐項判定

#### D.1.1 是否維持 read-only UI 原則

| 檢查項 | preanalysis 落點 | Verdict |
|---|---|---|
| 只顯示 suggested-fix / governance signal | §C.1 「只做 read-only visibility」/ §E.1 表列既有可擴充渲染面 | ✅ PASS |
| 不提供 Apply / Save | §E.2 表列「Apply 修正」按鈕為 L4 紅線 + §G.2「不提供 Apply / Save（任何形式）」+ §H.1 條件 1 EJS 元素白名單 | ✅ PASS |
| 不提供 auto-fix | §E.2「一鍵新增 tag」按鈕為 L4 紅線 + §G.2「不提供 auto-fix」+ §D.4 L4 紅線 | ✅ PASS |
| 不暗示系統可直接改 content/frontmatter/settings | §C.2 第 1 條 anti-write 一句話 + §E.4 顯示策略六條（含 anti-write / 文字選擇 / UI 控制項 / cross-link / banner / loader 不擴 write field）+ §G.2「不修改 frontmatter / tags.json / categories.json registry」 | ✅ PASS |

**綜合**：read-only UI 原則嚴守；anti-write 表面+語意+元素三層紅線都鎖住。✅

#### D.1.2 L1 / L2 / L3 / L4 分級是否合理

| 檢查項 | preanalysis 落點 | Verdict |
|---|---|---|
| L1/L2 只做提示與人眼判斷 | §D.1（L1 純提示計數 pill + 中性文字）/ §D.2（L2 warn pill + sample posts + bucket-note + cross-link；明示「不含 prescription」） | ✅ PASS |
| L3/L4 沒有被做成可操作 UI | §D.3（L3「僅」sub-bucket 區段之 docs cross-link；**不**顯示 per-post 「建議改為 X」prescription）/ §D.4（L4 = 紅線 = 不存在於 UI） | ✅ PASS |
| 避免 per-post prescription | §C.2 第 3 條（per-post 只給計數不給 prescription）+ §D.3 條目 4「禁止 per-post 級 prescription」+ §D.5 對 night-9 §E.5 之 L3 作**保守降級**（明示反對 prescription） | ✅ PASS |

**綜合**：分級**比 night-9 §E.5 更保守**（將原 L3 prescription 降級為「per-post 計數 badge + docs cross-link」，並明示禁止「應改為 X」字串）；分級表 §D.5 顯示對齊邏輯清楚。✅

#### D.1.3 UI contract 是否安全

| 檢查項 | preanalysis 落點 | Verdict |
|---|---|---|
| 只允許 badge / list / details / summary / readonly text 類型 | §H.1 條件 1 EJS 元素白名單：`<span>` / `<p>` / `<code>` / `<a>` / `<ul>` / `<li>` / `<details>` / `<summary>` | ✅ PASS |
| 禁止 form / button / input / select / textarea / fetch | §H.1 條件 1 黑名單：`<form>` / `<button>` / `<input>` / `<select>` / `<textarea>` / 無 onclick fetch；§G.2 第 14 條「不渲染 form / button / fetch / input / select / textarea 之 mutation 元素」；§H.2 acceptance grep 條目 0 命中要求 | ✅ PASS |
| severity 維持 warn-only，不暗示 build blocker | §E.3 表格「Severity」欄明示「只用 `warn` 一級 class；不引入 `error` / `blocker` 級別（避免暗示 build block）」；§G.2 第 13 條「不引入新 severity 級別（除 warn 外）」 | ✅ PASS |

**綜合**：UI contract 三層鎖（白名單 / 黑名單 / acceptance grep）；severity 單級避免 build block 暗示。✅

#### D.1.4 資料來源是否安全

| 檢查項 | preanalysis 落點 | Verdict |
|---|---|---|
| 只使用既有 validation / usage / governance summary | §F.1 表列既有 derived data（categoryUsage / tagUsage / commerceLinksPreview / systemSummary）；§F.2 表列待補 derive 為**純函式 derive 自既有 frontmatter+registry**（無 fs.writeFile / no fetch / no child_process） | ✅ PASS |
| 沒有新增真實修正資料 | §F.2 明示「不新增之欄位（紅線）：suggestedFix[] / adminWriteHint.* / recommendedTag / fixableByAdmin」 | ✅ PASS |
| 沒有改 registry / frontmatter / tags.json / categories | §G.1（本 phase 紅線）+ §G.2（implementation phase 紅線）+ §J explicit non-actions 共 17 條皆涵蓋；§F.3 不新增之資料來源涵蓋 validator API / 規則引擎 / 真實修法資料 / 外部 API / LLM | ✅ PASS |

**綜合**：資料來源限既有 read-only derived；新欄位若 implementation 需要，皆純函式 derive 無寫入；prescription 類欄位明列紅線。✅

#### D.1.5 implementation 切片是否保守

| 檢查項 | preanalysis 落點 | Verdict |
|---|---|---|
| 可以拆成小 phase | §L.3 提出 5 個獨立 implementation 切片（sub-bucket docs cross-link / loader derive / posts index badge / detail panel section / empty state text）+ §H.3 同表 + 風險評估 | ✅ PASS |
| 不混做 loader derive / UI badge / detail panel / empty state | §H.3 表末明示「每切片獨立 phase；每切片獨立 acceptance；不跳階；不混做」；§L.3 表末同要求；§L.5 紅線第 4 條「不可在 implementation phase 同時做切片 1+2+3+4+5（須拆開）」 | ✅ PASS |
| 每個 implementation phase 都能保持 existing output 不變 | §H.1 條件 4「加 EJS partial 為 additive；不動既有 statistics pill / table / detail panel 順序；既有 byte snapshot test 須 pass」；§H.2 acceptance checklist 涵蓋 `validate:content` carry / `build:github` byte-identical / `build:blogger` byte-identical / `check:*` carry / admin/index.html render 不破版 / Posts index 行為不變 | ✅ PASS |

**綜合**：5 切片 + 風險分級 + 不混做紅線 + acceptance checklist（含 build byte-identical + check guard carry）齊備。✅

#### D.1.6 紅線是否完整

| 檢查項 | preanalysis 落點 | Verdict |
|---|---|---|
| 不改 src/content/settings/package unless later implementation explicitly scoped | §G.1 第 1 條（本 phase）+ §G.2 全表（implementation phase 共通）+ §J explicit non-actions 17 條 | ✅ PASS |
| 不開 write path | §G.1 第 5 條 + §G.2 第 1, 2, 3, 4 條 + §I dormant list（middleware / CLI / browser write 全 dormant；不跳階） | ✅ PASS |
| 不改 validator error policy | §G.1 第 7 條「不升 validator warning 為 error」+ §G.2 第 5 條 + §J 第 14 條 | ✅ PASS |
| 不做 build/deploy/Blogger/GA4/AdSense | §G.1 第 3 條 + §J 第 11, 12 條（build / deploy / push gh-pages / 重貼 Blogger / AdSense / GA4 / commerce 後台） | ✅ PASS |
| 不 amend/rebase/reset/force-push | §G.1 末條 | ✅ PASS |

**綜合**：紅線分三層（本 phase / implementation phase 共通 / explicit non-actions）；條目間互相 cross-check 無漏。✅

### D.2 Overall verdict

**✅ ACCEPTED**

逐項判定：

- ✅ Read-only UI 原則嚴守（anti-write 表面+語意+元素三層）
- ✅ L1–L4 分級**比 night-9 §E.5 更保守**（L3 prescription 降級為計數 badge + docs link；§D.5 對齊表清楚）
- ✅ UI contract 三層鎖（白名單 / 黑名單 / acceptance grep）+ severity 單級避免 build blocker 暗示
- ✅ 資料來源限既有 derived；新欄位純函式 derive；prescription 類欄位列紅線
- ✅ 5 切片獨立 + 不混做 + acceptance checklist 含 byte-identical 證明
- ✅ 紅線分三層 + 17 條 explicit non-actions + cross-check 無漏
- ✅ 無事實錯誤（loader 已 derive 之 governance signal 結構與 `load-admin-posts.js` 觀察一致；既有 bucket-note 文字樣板與 `admin/index.ejs` L1602 / L1805 觀察一致；UI 元素白名單與既有 admin 渲染樣式一致）
- ✅ 無治理倒置（reject prescription、reject auto-fix、reject 規則引擎 → 維持 docs 為唯一規格來源）
- ✅ proposed next phases（§L）保守優先 + 並行不衝突 + 紅線提醒齊備

### D.3 No-go / 須修正項目

無。

### D.4 觀察建議（非阻斷；不在本 phase 處理）

- 觀察 1：preanalysis §H.3 切片 1（sub-bucket bucket-note 加 docs cross-link）為**最低風險**首選；若 user 啟動 implementation，建議從切片 1 開始，建立 docs cross-link 樣板，後續切片沿用。
- 觀察 2：preanalysis §F.2 提出之 `post.governanceSignals.*` derive 欄位設計屬切片 2 範圍；切片 2 完成後即便切片 3（badge）/ 切片 4（detail section）未啟動，亦不影響既有 admin/index.ejs render（loader 加 derive 欄位但 view 端忽略）— 此性質讓切片 2 之 backout cost = 0，acceptance 風險最低。
- 觀察 3：preanalysis §H.2 acceptance checklist 之 grep guard（`auto-fix` / `Apply` / `Save` / `<form>` / `<button>` / `fetch(` 在新 EJS partial 內 = 0）建議於 implementation phase 之 acceptance 自動執行；本 acceptance 不啟動該 guard。
- 觀察 4：preanalysis §D.5 對 night-9 §E.5 L3 之**保守降級**為本 phase 之關鍵設計決策；未來若 user 認為「per-post 應建議改成 X」確有價值，須**獨立 phase + 獨立 preanalysis + 獨立 acceptance**，不可在切片 1–5 implementation 內偷渡 prescription。

→ 四項觀察皆**不**在本 phase 處理；列此處作為未來治理軌跡 cross-reference。

---

## E. Acceptance notes / required corrections

### E.1 Required corrections

**無**。preanalysis 已涵蓋 phase 指示之六項面向，無事實錯誤、無紅線缺漏、無分級倒置、無 prescription 暗示、無 build blocker 暗示。

### E.2 Acceptance notes

- preanalysis 與既有 source（`load-admin-posts.js` derive 範圍 + `admin/index.ejs` 渲染結構 + `admin-write-cli.js` dormant 狀態）對齊；未脫離真實現況硬編規則。
- preanalysis §C.2 顯示哲學六條為本 phase 之**新貢獻**（既有 docs 未明示「顯示哲學六條」之系統化規範），對未來 implementation 切片之 UI 文字審稿有指引作用。
- preanalysis §D.5 對齊表為本 phase 之**新貢獻**（明示對 night-9 §E.5 L3 prescription 之**保守降級**理由）；此降級屬 conservative governance、與既有 admin read-only 定位一致。
- preanalysis §H.2 acceptance checklist 為**可執行樣板**（grep 規則 + byte-identical + guard carry），未來 implementation phase 可直接套用。
- preanalysis §L 之保守預設 + Acceptance + 5 切片 + 並行不衝突 + 紅線提醒分區清楚，與既有 phase discipline pattern 一致。

### E.3 Cross-reference 一致性檢查

| 引用對象 | preanalysis 引用位置 | 引用內容 | 是否一致 |
|---|---|---|---|
| night-9 §E.5 L1–L4 分級 | preanalysis §D.5 對齊表 | 對齊 + 對 L3 作保守降級 | ✅ 一致 |
| night-9 §E.6 auto-fix 紅線 | preanalysis §G.2 第 1–2 條 | 沿用 | ✅ 一致 |
| night-9 §G.2 status filter 設計差異 | preanalysis §H.1 條件 2 | 引用作為 derive 邊界 | ✅ 一致 |
| pm-2 IA §F 缺口 | preanalysis §B.3 缺口 1–5 | 補述 admin governance signal 範圍 | ✅ 一致 |
| am-1 acceptance verdict | preanalysis 承接段 + §C.2 顯示哲學 | 沿用 ACCEPTED governance rule | ✅ 一致 |
| 既有 bucket-note 文字（L1602 / L1805） | preanalysis §E.4 第 1 條 + §H.1 條件 9 | 「完全沿用既有樣板」 | ✅ 一致 |
| loader derive 結構（categoryUsage / tagUsage） | preanalysis §B.1 表 + §F.1 表 | 對齊 `load-admin-posts.js` L175–290 / L934–943 觀察 | ✅ 一致 |
| EJS 元素白名單 | preanalysis §H.1 條件 1 | 與既有 admin/index.ejs 渲染 elements 一致 | ✅ 一致 |
| Admin write path dormant 狀態 | preanalysis §I dormant list | 沿用 admin-write-cli.js gated 狀態 | ✅ 一致 |

→ 所有 cross-reference 內外一致；未脫離既有 docs 規格 + source 現況。

---

## F. Whether next implementation phase is allowed

### F.1 直接 implementation：⚠️ 條件式允許

依 preanalysis §L.3 提出之 5 個獨立切片排序：

| Phase | 是否允許啟動 | 條件 |
|---|---|---|
| L.3 切片 1：`20260616-admin-suggested-fix-sub-bucket-docs-crosslink-implementation-a` | ✅ 條件式允許 | 須 user explicit approval；最低風險首選；single change scope（改既有 `<p>` 加 `<a>`）；不動 statistics / table / detail panel |
| L.3 切片 2：`20260616-admin-suggested-fix-loader-derive-implementation-a` | ✅ 條件式允許 | 須 user explicit approval；loader 加 derive 欄位；不改 EJS；既有 view backout cost = 0 |
| L.3 切片 3：`20260616-admin-suggested-fix-posts-index-badge-implementation-a` | ⚠️ 須切片 2 先 ship | 切片 2 derive 欄位為切片 3 badge 渲染之資料來源；不可越級 |
| L.3 切片 4：`20260616-admin-suggested-fix-detail-panel-section-implementation-a` | ⚠️ 須切片 2 先 ship | 同上 |
| L.3 切片 5：`20260616-admin-suggested-fix-empty-state-text-refinement-a` | ✅ 條件式允許 | 純文字審稿；可獨立 |

### F.2 並行不衝突路徑（須 user explicit approval；docs-only）

| Phase | 是否允許啟動 |
|---|---|
| `20260616-admin-validation-per-post-aggregation-preanalysis-docs-only-a`（night-9 §I.4.8） | ✅ docs-only；與本 UI preanalysis 並行不衝突 |

### F.3 保守預設

`20260616-idle-freeze-after-admin-suggested-fix-readonly-ui-preanalysis-acceptance-no-op-a` — 收工 idle freeze；等 user 決定下一步。

### F.4 仍 dormant / 不允許啟動

| 項目 | 原因 |
|---|---|
| write path（middleware / CLI fix-cmd / browser write / Apply / Save） | preanalysis §G.2 紅線；night-9 §F.2 八條安全條件未達；admin-write-cli.js 對 content / settings 仍 dormant |
| L3 per-post prescription（「應改為 X」字串） | preanalysis §D.3 / §D.5 / §L.5 紅線 |
| L4 UI（auto-fix / form / button / fetch） | preanalysis §D.4 紅線（從不存在於 UI） |
| 新 severity 級別（error / blocker） | preanalysis §E.3 / §G.2 第 13 條 |
| validator warning 升 error | preanalysis §G.1 / §G.2 第 5 條 |
| 同 phase 混做多切片 | preanalysis §L.5 第 4 條 |

---

## G. Files changed

- `docs/20260616-admin-suggested-fix-readonly-ui-preanalysis-human-acceptance.md`（new；docs-only acceptance）
- **未**改 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `CLAUDE.md` / 任何 `.md` frontmatter / EJS / loader / validator / Admin UI / dist / gh-pages / `.cache`

→ 唯一 mutation = 本 acceptance doc 自身。

---

## H. Commit hash / push result

（待本 doc commit 後填入；由 closeout 步驟產出）

---

## I. Final repo state

```
branch         : main
HEAD           : （待 commit + push 後確認）== origin/main
working tree   : clean（commit + push 後）
mutations      : 唯一 mutation = 本 acceptance doc
not changed    : src/ / content/ / content/settings/ / src/views/ / package.json / lockfile / CLAUDE.md / 任何 .md frontmatter / EJS / loader / validator / admin UI / build artifacts / dist / gh-pages
guard runs     : 本 acceptance 為 docs-only，未跑 validate:content / check:adsense-* / build:* / npm install
acceptance     : ✅ PASS（preanalysis 涵蓋 phase 指示六項面向、無事實錯誤、無紅線缺漏、無分級倒置、無 prescription 暗示、無 build blocker 暗示）
```

---

## J. Recommended next phase

### J.1 保守預設（推薦）

**`20260616-idle-freeze-after-admin-suggested-fix-readonly-ui-preanalysis-acceptance-no-op-a`** — 收工 idle freeze；等 user 決定下一步。

### J.2 Implementation 切片（須 user explicit approval；按 §F.1 排序）

1. **`20260616-admin-suggested-fix-sub-bucket-docs-crosslink-implementation-a`**（切片 1） — 最低風險首選；改既有 sub-bucket bucket-note `<p>` 加 `<a href="…">`；single change scope；不動 statistics / table / detail panel。
2. **`20260616-admin-suggested-fix-loader-derive-implementation-a`**（切片 2） — loader 新增 `post.governanceSignals.*` derive；不改 EJS；既有 view backout cost = 0。
3. （切片 2 先 ship 後）**`20260616-admin-suggested-fix-posts-index-badge-implementation-a`**（切片 3） — Posts index 表格 badge + filter chip。
4. （切片 2 先 ship 後）**`20260616-admin-suggested-fix-detail-panel-section-implementation-a`**（切片 4） — Post detail panel 新增 Governance signals section。
5. **`20260616-admin-suggested-fix-empty-state-text-refinement-a`**（切片 5） — empty state 文字審稿；可獨立。

### J.3 並行不衝突（docs-only）

**`20260616-admin-validation-per-post-aggregation-preanalysis-docs-only-a`** — validator per-post API 設計（night-9 §I.4.8）；docs-only；與本 UI 切片並行不衝突。

### J.4 紅線提醒

- ❌ 不可跳階至 write path / middleware / CLI fix-cmd / browser write
- ❌ 不可跳階至 L3 per-post prescription
- ❌ 不可掛 L4 UI（auto-fix / form / button / fetch）
- ❌ 不可同 phase 混做多切片
- ❌ 不可升 validator warning 為 error
- ❌ 不可不經獨立 phase 偷渡「應改為 X」字串

---

（本紀錄結束）
