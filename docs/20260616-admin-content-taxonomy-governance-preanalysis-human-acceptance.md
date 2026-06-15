# ADMIN — Content Taxonomy Governance Preanalysis — Human Acceptance

- **Phase**：`20260616-admin-content-taxonomy-governance-preanalysis-human-acceptance-a`
- **日期**：2026-06-16（07:18 起；am session）
- **性質**：docs-only human acceptance / preanalysis review（**不**改 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `CLAUDE.md`；**不** `npm install`；**不** build / deploy / 重貼 Blogger；**不**新增 UI；**不**啟用 admin write / Apply / Save；**不**修正 unknown tag `download`；**不**新增 tag；**不**改 frontmatter；**不**做 taxonomy 真實資料遷移；**不**做 GA4 驗證；**不**做 unrelated cleanup；**不** amend / rebase / reset / force-push）
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis）
  - `docs/20260615-admin-categories-readonly-usage-counts-record.md`（night-5）
  - `docs/20260615-admin-categories-readonly-usage-counts-human-acceptance.md`（night-6）
  - `docs/20260615-admin-tags-readonly-usage-counts-record.md`（night-7）
  - `docs/20260615-admin-tags-readonly-usage-counts-human-acceptance.md`（night-8）
  - `docs/20260615-admin-content-taxonomy-governance-preanalysis.md`（night-9，本 acceptance target）

> **本文件性質聲明**：acceptance 是判斷 preanalysis 是否符合預期，不是治理執行；**不**得在本 phase 修 `tags.json` / 修 frontmatter / 改 validator / 啟用 admin suggested-fix UI / 修正 unknown tag `download`；任何治理動作均屬獨立 phase + user explicit approval。

---

## A. Phase name

`20260616-admin-content-taxonomy-governance-preanalysis-human-acceptance-a`

---

## B. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main
ahead/behind   : 0/0
working tree   : clean
HEAD           : 3a06fe3 == origin/main
last commit    : docs(admin): plan taxonomy governance

git log --oneline -5:
  3a06fe3 docs(admin): plan taxonomy governance
  3ec1bc5 docs(admin): record tag usage acceptance
  ac0476b feat(admin): add tag usage counts
  77bdc20 docs(admin): record category usage acceptance
  f9f7ef5 feat(admin): add category usage counts
```

→ baseline 完全符合 phase 指示（HEAD == origin/main == `3a06fe3`，working tree clean，latest commit 為 night-9 preanalysis landing）。

---

## C. Files read

| 路徑 | 範圍 | 目的 |
|---|---|---|
| `docs/20260615-admin-content-taxonomy-governance-preanalysis.md` | 1–409（完整） | 本 acceptance 之 target |

→ 本 acceptance **未**閱讀 `src/` / `content/` / `content/settings/` 之任何檔案（preanalysis §B / §C / §G 已盤點，本 phase 不重做盤點）。
→ 本 acceptance **未**閱讀 / 修改 CLAUDE.md（preanalysis 紅線 + 本 phase 紅線雙重禁止）。

---

## D. Human acceptance result

### D.1 Per-section verdict

| 區段 | 主題 | Verdict | 備註 |
|---|---|---|---|
| §A | Baseline verify | ✅ PASS | preanalysis landing 時 HEAD `3ec1bc5`；本 acceptance baseline 為其後 +1 commit `3a06fe3`（night-9 landing 自身），符合預期 |
| §B.1 | ADMIN read-only taxonomy visibility 現況 | ✅ PASS | 表格與 night-5 / night-7 record 一致；明示 categories & tags 之 Add/Edit/Delete/Apply UI 故意不開放 |
| §B.2 | 揭露之 unknown tag `download` | ✅ PASS | unknown key 唯一（`download`）；影響 1 篇 draft（phonics-practice-sheet-download.md）；明示 frontmatter 不修 |
| §B.3 | Tag totals 現況快照 | ✅ PASS | 7 指標數字與 night-7 acceptance 一致；untagged=0 / unused=0 / cross-site mismatch=0 |
| §B.4 | categories.json / tags.json 現況 | ✅ PASS | categories 4 / tags 7；正確指出 `download` 在 categories.json 為 id、但不在 tags.json；`book-review` 兩處同名（namespace 互相獨立）說明清楚 |
| §B.5 | Validator 對 unknown-tag / unknown-category 現況 | ✅ PASS | 正確援引 `validate-content.js` 2130–2146 + `load-posts.js` 之 VISIBLE_STATUS filter；得出「admin loader vs validator loader = 兩個 surface；數字不對齊屬設計使然」之結論合理 |
| §C.1 | 五個維度責任區分 | ✅ PASS | contentKind / category / tags / form-metadata / commerce 五維度區分清晰；列管位置明確（registry vs schema vs CLAUDE.md enum） |
| §C.2 | 為什麼五維度不能合一 | ✅ PASS | 形態 / routing / 索引 / 結構 / 外部行銷之語意區分有理；commerce 安全紅線援引 CLAUDE.md §3.2 governance 一致 |
| §C.3 | `download` 屬於哪個維度 | ✅ PASS | 五維度適配度表（contentKind ✅ / category ✅ / tags ⚠️ / form-metadata ✅ / commerce ❌）邏輯一致；初步判斷「download 屬 contentKind + category + form-specific metadata 三維度，不適合作 tag」中立且非倒置治理 |
| §D.1 | Option A：新增 `download` 至 tags.json | ✅ PASS | 公平列出優點 + 缺點 + Blogger / GitHub / ADMIN / validation 影響；正確標示「治理倒置」風險；不推薦但保留 user 決策權 |
| §D.2 | Option B：從 frontmatter 移除或改名 | ✅ PASS | B1 / B2 兩支變體分析清楚；正確指出 B1 製造 untagged bucket / B2 噪音改噪音；不建議 |
| §D.3 | Option C：content kind + form metadata 表達 | ✅ PASS | 方向最乾淨；但**時機未到**之判斷（該文章為 draft + `download.fileUrl: ""`）符合既有 phase discipline |
| §D.4 | Decision options 摘要 | ✅ PASS | 三選項皆不適合「今晚立即執行」之核心觀察符合既有 conservative 風格；「記錄治理規則 + 等該文章自然進入 ready 流程時依規則處理」結論合理 |
| §E.1 | Severity：warning，不是 blocker | ✅ PASS | 維持 warning-only 一致既有 CLAUDE.md 與 validator 慣例；說明「治理是人工決策，不應 block 自動化」之理由充分 |
| §E.2 | Status 區分嚴格度 | ✅ PASS | draft / ready / published / archived 行為差異描述準確；明確反對 ready 升 error（避免歷史包袱）符合 conservative governance |
| §E.3 | Surface 區分（Blogger / GitHub Pages） | ✅ PASS | Blogger surface 對 unknown tag 之渲染後果較直接（hashtag 已 render）優先級略高之觀察合理 |
| §E.4 | Cross-site mismatch | ✅ PASS | 維持 warning-only；ADMIN 已揭露計數 + sample posts；獨立 settings 治理 phase 之歸屬正確 |
| §E.5 | ADMIN suggested fix 級別 | ✅ PASS | L1 ✅ 已實作 / L2 ⚠️ 可考慮 future / L3 ❌ 不開放 / L4 ❌ 絕對不開放 之分級符合既有 admin read-only 定位；L3/L4 紅線符合 CLAUDE.md preanalysis §E phased red lines |
| §E.6 | Auto-fix 紅線 | ✅ PASS | 四條紅線（auto-fix frontmatter / auto-add tag / auto-remove unused tag / 本機 admin loader 即 EJS render 路徑不執行修改）符合既有 admin write path dormant 政策 |
| §F.1 | Suggested-fix 顯示上限 | ✅ PASS | 純 read-only / 連結 docs / 顯示「不是 auto-fix」之免責 / 不擾亂 read-only management shell 定位 — 四條規則皆合理 |
| §F.2 | Apply / Save 安全條件 | ✅ PASS | 8 條最低安全條件（middleware preanalysis / CLI-first / dry-run / validator gate / git audit / 不寫 settings / 不寫敏感欄位 / deploy manual）為將來決策參考；本 phase 不啟用 |
| §G.1 | validate-content 現況對齊 | ✅ PASS | validator vs admin loader 之 5 面向對照表準確 |
| §G.2 | Admin warning vs Validator warning 之 ground truth 關係 | ✅ PASS | validator 為 ready/published ground truth；admin 含 draft 之「提前提醒」性質；兩者不對齊屬設計而非 bug；ADMIN 文案不取代 validator |
| §G.3 | 是否需要 admin validation per-post aggregation preanalysis | ✅ PASS | 已列於 night-5 §H §3 / night-7 §H §4；屬獨立 phase；不在本 phase |
| §H | Explicit non-actions | ✅ PASS | 16 條紅線涵蓋 tags.json / categories.json / phonics frontmatter / 其他 .md frontmatter / validate-content.js / load-admin-posts.js / load-posts.js / admin/index.ejs / admin UI / write path / npm / build / deploy / Blogger / AdSense / GA4 / commerce / CLAUDE.md / unknown 升 error / download.fileUrl / cross-publish site；唯一 mutation = preanalysis doc 自身 |
| §I | Proposed next phases | ✅ PASS | 5 大類（保守 idle freeze / acceptance / 治理執行 / admin 擴充 / 既定主線）排序低風險優先；每條皆 phase name 清楚、行為界定明確；治理執行 phase 須 user explicit approval；不跳階 |

### D.2 Overall verdict

**✅ ACCEPTED**

- preanalysis 結構完整（A–I 九大區段；目的、現況、模型、選項、規則、未來、驗證、紅線、下一步）
- 分析中立（三個 decision options 皆有公平利弊分析；未硬性指向任一選項）
- 紅線明確（§E 四級 suggested-fix + §E.6 四條 auto-fix + §F 八條 Apply/Save + §H 十六條 explicit non-actions）
- 與既有 governance pattern 一致（warning-only / status 區分 / admin read-only 定位 / write path dormant）
- 無事實錯誤（validator 行為、admin loader 行為、frontmatter status、 categories/tags registry 數字皆與本 acceptance baseline `3a06fe3` 之 repo state 一致）
- 無治理倒置（明確反對「為消除訊號而動 registry」/ 明確反對「升 error 製造歷史包袱」）
- 時機判斷保守（指出三選項皆「今晚不立即執行」；建議等該文章自然進入 ready 流程時依規則處理）
- proposed next phases 不跳階（acceptance → 治理執行 preanalysis → 治理執行 implementation → admin 擴充 → write path 仍為最後）

### D.3 No-go / 須修正項目

無。

### D.4 觀察建議（非阻斷；不在本 phase 處理）

- 觀察 1：preanalysis §C.3 之「`download` 屬 contentKind + category + form-specific metadata」三維度判斷，未來若新增其他下載類文章（如其他 phonics worksheet 或教具 PDF），可作為一致性參考；屬獨立 content authoring 慣例文件之候選。
- 觀察 2：preanalysis §E.5 之 L2「decision option 摘要連結至 governance docs」若未來啟動，須注意「不在 admin 內硬編規則」之 §F.1.2 原則，避免 admin 變成規格文件。
- 觀察 3：preanalysis §G.3 之「admin validation per-post aggregation preanalysis」仍待 night-5 §H §3 / night-7 §H §4 排程；屬獨立 docs-only preanalysis。

→ 三項觀察皆**不**在本 phase 處理；列此處作為未來治理軌跡 cross-reference。

---

## E. 是否可以進入下一個 implementation / docs phase

| 路徑 | 是否可進入 | 條件 |
|---|---|---|
| 保守 idle freeze | ✅ 可進入 | 預設選項；無條件 |
| Acceptance（本 phase） | ✅ 已完成 | 即本文件 |
| 治理執行 preanalysis（I.3.3 phonics frontmatter docs-only preanalysis） | ✅ 可進入 | docs-only；需 user explicit approval 啟動 |
| 治理執行 preanalysis（I.3.4 tags.json docs-only preanalysis） | ⚠️ 條件式 | 僅當 user 選 Option A 時才需要 |
| 治理執行 implementation（I.3.5 phonics frontmatter） | ⚠️ 條件式 | 須 user 選定 Option B 或 C；single new commit；不動其他文章 / settings |
| 治理執行 implementation（I.3.6 tags.json） | ⚠️ 條件式 | 僅當 user 選 Option A；single new commit；不動其他 settings / content |
| ADMIN 擴充 docs-only（I.4.7 L2 suggested-fix preanalysis） | ✅ 可進入 | docs-only |
| ADMIN 擴充 docs-only（I.4.8 admin validation per-post aggregation preanalysis） | ✅ 可進入 | docs-only |
| 既定主線（I.5.9–11） | ✅ 可進入 | 仍按主線優先級 |
| Write path | ❌ 仍 dormant | preanalysis §E phased red lines + §F.2 八條安全條件 |

**核心判斷**：本 acceptance 不解鎖 write path；不解鎖 frontmatter 直接修改；不解鎖 tags.json 直接修改；任何 mutation phase 仍須獨立 phase + user explicit approval。

---

## F. Risks / blockers

### F.1 本 acceptance 自身 risks

| 項目 | Risk | Mitigation |
|---|---|---|
| Acceptance 是否會被誤解為「批准治理動作」 | 低 | 本文件 §D.2 / §E 明示 acceptance 僅針對 preanalysis 之 docs 品質；任何治理動作仍須獨立 phase |
| Acceptance 是否會被誤解為「批准升 error」 | 低 | preanalysis §E.1 / §E.2 + 本文件 §D.1 §E.1 §E.2 verdict 皆明示維持 warning-only |
| Acceptance 是否會被誤解為「批准 L2 suggested-fix」 | 低 | preanalysis §E.5 / 本文件 §D.1 §E.5 verdict 皆明示 L2「可考慮 future preanalysis」非「現在開放」 |

### F.2 後續 phase 之 blockers（非本 phase 阻斷）

| 項目 | Blocker |
|---|---|
| phonics frontmatter 修法 implementation | 須 user 選定 Option B 或 C 後始可啟動；且 implementation phase 須 single new commit |
| tags.json 新增 download | 須 user 選定 Option A（不推薦）後始可啟動 |
| L2 suggested-fix UI | 須先做 docs-only preanalysis（I.4.7）；本 acceptance 不開放 |
| Write path | 須先做 middleware 安全 preanalysis + CLI-first 寫入 + dry-run + validator gate + git audit + 不寫 settings + 不寫敏感欄位 + deploy manual 八條條件全達；本 acceptance 不開放 |
| download.fileUrl 空值 / cover 缺漏 | 屬另一獨立 download asset readiness phase；本 acceptance 不處理 |
| Blogger / GitHub Pages cross-publish tag site 設計 | 屬另一獨立 settings 治理 phase；本 acceptance 不決策 |

### F.3 Repository red lines reaffirmed

- ❌ 不修 `content/settings/tags.json`
- ❌ 不修 `content/settings/categories.json`
- ❌ 不修 `content/blogger/posts/20260529-phonics-practice-sheet-download.md`
- ❌ 不修任何其他 `.md` frontmatter
- ❌ 不修 `src/scripts/validate-content.js` / `src/scripts/load-admin-posts.js` / `src/scripts/load-posts.js`
- ❌ 不修 `src/views/admin/index.ejs`
- ❌ 不新增 admin UI（含 suggested-fix hint）
- ❌ 不啟用 admin write / Apply / Save / browser write / middleware / CLI fix-cmd
- ❌ 不 `npm install`；不動 `package.json` / lockfile
- ❌ 不 build / deploy / push gh-pages / 重貼 Blogger
- ❌ 不動 AdSense / GA4 / commerce 後台
- ❌ 不動 `CLAUDE.md`
- ❌ 不升級 unknown-tag / unknown-category warning 為 error
- ❌ 不對 phonics-practice-sheet-download.md 之 `download.fileUrl: ""` 做任何處理
- ❌ 不對 cross-publish tag site 設計做任何決策

→ 唯一 mutation = 本 acceptance doc 自身。

---

## G. Recommended next phase

### G.1 保守預設（推薦）

**`20260616-idle-freeze-after-taxonomy-governance-preanalysis-acceptance-no-op-a`** — 收工 idle freeze；等 user 決定下一步。

### G.2 治理執行路徑（須 user explicit approval 始可啟動）

**`20260616-content-fix-phonics-download-frontmatter-preanalysis-docs-only-a`**（preanalysis §I.3.3）— docs-only preanalysis：就 phonics-practice-sheet-download.md 之 `tags: [download]` 提出具體修法（preanalysis 建議 Option C），同時整併 `download.fileUrl` 空值與 cover 缺漏；**不**改 frontmatter。

### G.3 ADMIN 擴充 docs-only 路徑（仍 read-only；屬未來）

**`20260616-admin-suggested-fix-readonly-ui-preanalysis-docs-only-a`**（preanalysis §I.4.7）— docs-only：分析 L2「per-bucket decision option 摘要」連結至 governance docs 之顯示方式；維持 L1 / L3 / L4 紅線；**不**改 EJS / loader。

**`20260616-admin-validation-per-post-aggregation-preanalysis-docs-only-a`**（preanalysis §I.4.8）— docs-only：探討 admin loader 與 validator sourcePath 對齊 / per-post API 設計；**不**改 validator / loader。

### G.4 既定主線候選（不在本日推進）

`20260616-admin-posts-detail-readability-refinement-a`（I.5.9）/ `20260616-admin-post-detail-readonly-expand-a`（I.5.10）/ `20260616-admin-build-deploy-readonly-status-a`（I.5.11）

### G.5 紅線提醒

- ❌ 不可跳階至 write path
- ❌ 不可跳階至 frontmatter direct mutation 不經 preanalysis
- ❌ 不可跳階至 tags.json direct mutation 不經 preanalysis
- ❌ 不可在 ADMIN 直接掛 L3 / L4 UI

---

## H. Repo state at end

```
branch         : main
ahead/behind   : 0/0（HEAD 仍 == origin/main）
HEAD           : 3a06fe3
working tree   : 1 new untracked file
new file       : docs/20260616-admin-content-taxonomy-governance-preanalysis-human-acceptance.md
mutations      : 唯一 mutation = 本 acceptance doc
not changed    : src/ / content/ / content/settings/ / src/views/ / package.json / lockfile / CLAUDE.md / 任何 .md frontmatter / 任何 EJS / 任何 loader / 任何 validator / 任何 admin UI / build artifacts / dist / gh-pages
guard runs     : 本 acceptance 為 docs-only，未跑 validate:content / check:adsense-* / build:* / npm install
acceptance     : ✅ PASS（preanalysis 結構完整、analysis 中立、紅線明確、無事實錯誤、無治理倒置、時機判斷保守、proposed next phases 不跳階）
```

→ 待 user 確認 acceptance 後決定下一步（保守 idle freeze / 治理執行 preanalysis / ADMIN 擴充 preanalysis / 既定主線）。

---

（本紀錄結束）
