# Admin Phase 2 — Static Payload Preview Preflight Record（docs-only）

> Session: `20260618-am-admin-phase2-static-payload-preview-preflight-record-docs-only-a`
> Date: 2026-06-18（Asia/Taipei；am）
> Type: **docs-only**（固化前一輪 read-only preflight 結果；唯一 mutation = 本 doc 新增 + CLAUDE.md §3a ADMIN current state 極小 1-row ledger sync）
> Verdict: **slice COMPLETE — source + browser dual-accepted；write path dormant；next = K7（獨立 phase）**

---

## 1. Purpose

把同日稍早之 read-only preflight（`20260618-am-admin-phase2-static-payload-preview-preflight-a`，inline report，未落 docs）固化為可被引用之 docs record。

本 record **不**改 source / 不實作 K7 / 不啟用任何 write path。內容為 preflight 結論之逐項固化。

⚠️ 本 record 之 land 不代表任何新功能落地；static payload preview 切片本身早已於 2026-06-17 landed + dual-accepted（見 §3）；本檔僅固化「已完成」之狀態與下一步建議。

---

## 2. Baseline verify（PASS）

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| HEAD（pre-phase） | `a39d51c1b6844e20725a2580bc33ab4ef8609a54`（short `a39d51c`） |
| origin/main（pre-phase） | `a39d51c1b6844e20725a2580bc33ab4ef8609a54`（== HEAD） |
| ahead / behind | `0 / 0` |
| working tree（pre-phase） | clean |
| latest subject（pre-phase） | `docs(ga4): add d4 registration checklist` |

→ baseline 完全合格。所有 preflight inspection 皆 read-only（`Read` / `Grep` / `git log` / `git merge-base`）。
（本 record commit 本身會將 HEAD 推進至新 docs commit；以上為寫入前 baseline。）

GA4 線聲明：上一輪 GA4 D4 為 **docs-only registration checklist**；Dean 之手動 GA4 後台註冊尚未提供完成證據 → **不**宣稱 GA4 D4 已完成；本 record **不**新增任何 GA4 backend / source / manual-registration 行為。

---

## 3. Static payload preview current state（source confirmed, not just docs）

切片 = **landed 且 dual-accepted**（source-level + browser-level）。preflight 本輪以 read-only source inspection 逐項確認，非僅引用 docs：

### 3.1 Lineage（commits 皆為 HEAD 之 ancestor；非 revert）

| commit | 角色 |
| --- | --- |
| `f873ec2` | source landed（`feat(admin): add static payload preview`） |
| `2917f59` | browser-pass record-a（source-only inspection PASS；browser pending） |
| browser-pass record-b（2026-06-17 22:17 user evidence） | browser-level acceptance PASS |

`git merge-base --is-ancestor f873ec2 HEAD` ✅；`2917f59` 亦為 ancestor ✅。現 HEAD `a39d51c` 仍含此切片（未 revert）。

### 3.2 Source 確認摘要（read-only inspection）

| 元件 | 位置（`src/views/admin/index.ejs` 除非另註） | 確認 |
| --- | --- | --- |
| CSS（6 個 `.payload-preview-*` selector） | `:93–101`（inline `<style>`） | mirror 既有 `.dry-run-*` 風格；無新外部 CSS file |
| Markup（nested `<details>`，預設 closed） | `:1532–1554` | 位於既有 dry-run editor `.dry-run-result` 之後、disabled Apply button（`:1559`）之前 |
| `<summary>` PREVIEW ONLY 標示 | `:1533` | 「Static payload preview（PREVIEW ONLY — 不執行任何寫入）」 |
| PREVIEW ONLY warning | `:1535` | 「不寫任何檔案 · 複製不構成核准 · 實際寫入僅由終端機 CLI（admin-write-cli）執行，每次仍須 Dean explicit approval」 |
| field `<select>`（4 safe-editable 欄位） | `:1538–1543` | `description` / `searchDescription` / `titleEn` / `coverAlt` |
| targetRel（server-side safe relative path；read-only） | `:1548`（`<%= p.sourceRel %>`） ← loader `sourceRel`（`src/scripts/load-admin-posts.js`，`toNormalizedKey`） | 非 client 端字串拼湊；R2 mitigation 落地 |
| Compute handler（純前端字串組裝） | `:2607–2636` | 讀同 section `data-current` + textarea `data-input`；deterministic |
| payload key 順序 | `:2623–2629` | 固定 `targetRel → field → expectedOldValue → newValue → dryRun` |
| `dryRun` | `:2628` | 恆 `true`（literal；無分支讓 `false` 出現） |
| Command preview | `:2632` | 固定字串 `node src/scripts/admin-write-cli.js --payload=<temp.json>` |
| Apply button | `:1559–1561` | 維持 `disabled aria-disabled="true"`；無 click handler |

### 3.3 Determinism / safety properties（source-level）

| 屬性 | 結論 |
| --- | --- |
| `dryRun` 恆 `true` | ✅ |
| command preview 不含 `--apply` | ✅ |
| command preview / payload 不含 `dryRun:false` | ✅ |
| 同輸入恆同輸出（無 `Date.now()` / `Math.random()` / 序號 / nonce） | ✅ |
| 無自動觸發（user 須手動點 Compute；無 `setTimeout` / `setInterval` / `requestAnimationFrame` / `MutationObserver` 自動 fire） | ✅ |
| 本切片 block 內無 copy 按鈕 / 無 clipboard | ✅（`navigator.clipboard` / `execCommand('copy')` 之 `:2743–2823` 屬**另一獨立** commerce snippet helper region，非 payload-preview block） |

### 3.4 Write path / guardrail state

| 項 | 狀態 |
| --- | --- |
| Admin write path | **dormant**；真實寫入僅由 terminal-only CLI `admin-write-cli` 執行，每次須 Dean explicit approval |
| Apply button | disabled（永久；本切片未動） |
| middleware / API / POST endpoint / browser-to-filesystem write | **未啟用** |
| block 內 real `fetch` / `XMLHttpRequest` / `fs.writeFile` / `writeFileSync` / `spawn` / `child_process` / `exec` / form-submit / auto-trigger | **0 matches**（`--apply` / `dryRun:false` 之字面 match 於 `:1529/1549/1551/2604/2631` 全屬 comment / display label 之否定語句，非 trigger） |
| validator carry-forward | 0 errors / 94 warnings / 84 issue-posts（per CLAUDE.md §3a baseline；本輪未重跑，carry-forward） |

---

## 4. Risks / mitigations（current；no new open risk）

| # | 風險 | 狀態 |
| --- | --- | --- |
| R1 | stale `expectedOldValue`（顯示值落後現值） | **mitigated** — 值取自 server-side `data-current`（逐字）；UI 文案提示「貼上前再核對 + 跑 `validate:content`」；CLI 端 `expectedOldValue` 比對 fail-closed |
| R2 | `targetRel` 絕對路徑 / client 拼湊 | **mitigated** — `p.sourceRel`（loader `toNormalizedKey`，repo-relative posix）；非 client 端拼湊 |
| R3–R5 | preview 誤認為核准（preview vs write / `--apply` 暴露 / copy 視為核准） | **mitigated** — PREVIEW ONLY warning + 永久 disabled Apply + tooltip + 「複製不構成核准」明示；UI 預設永不產生 `--apply` / `dryRun:false`；本切片無 copy 按鈕 |
| R7 | Phase 3/4 stale wording | **resolved** — 前置 wording 系列 phase（`f0710` / `add4f98`）已校正 |
| — | 新 open risk | **無**；切片已 closed；剩餘僅 optional follow-up（§5） |

---

## 5. Next optional follow-up

切片核心已完成，故「下一步」皆為 optional follow-up，各須**獨立 phase + 獨立 commit + explicit approval**：

| 候選 | 內容 | 評估 |
| --- | --- | --- |
| **K7 — Copy buttons** | mirror 既有 commerce snippet helper 之 clipboard 行為（`:2743–2823`）；clipboard-only、non-mutating、預設 disabled、UI 文案明示「複製不構成核准 / Copy does not approve」 | **目前最小且最安全的下一步**；單檔 additive 優先；不觸 write path / 不啟用 Apply / 不加 `--apply` / 不加 `dryRun:false` / 不新增 payload file。spec 詳 implementation-plan §6 |
| K8 | field 選項隨「目前 dry-run diff 變更欄位」自動切換 | 純前端、稍複雜；獨立 phase |
| K9 | B8 multi-click determinism smoke 截圖 | docs-only；非阻塞 |
| 保守路徑 | idle freeze | 切片 acceptance 完成，無強制後續 |

⚠️ **K7 必須是獨立 phase、獨立 commit**，**不得**混入本 preflight record commit。下一個 K7 phase 建議名：`20260618-am-admin-k7-static-payload-preview-copy-buttons-implementation-a`（須 user 於該 phase 再次 explicit approval 後始可實作；本 record **不**實作 K7）。

---

## 6. Allowed / forbidden（本 phase 自身）

### 6.1 Allowed mutation（本 record）

- 新增本 docs record（`docs/20260618-am-admin-phase2-static-payload-preview-preflight-record.md`）
- CLAUDE.md §3a ADMIN current state 之極小 1-row ledger sync（live inventory 更新；per §3a 紀律允許之 1–2 行極小 sync）

### 6.2 Forbidden（本 phase 嚴守）

本 phase **未**：

- 改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `package.json` / lockfile / `dist*` / `gh-pages` / `.cache`
- build / deploy / dev server / preview
- Blogger repost
- GA4 backend / source / manual-registration claim（GA4 D4 仍 checklist-only，未由 Dean evidence 確認完成）
- 實作 K7 / 啟用 write path / Apply / middleware / API / `admin-write-cli` behavior
- 產生 payload files
- 加 `--apply` / `dryRun:false`
- amend / rebase / force-push / `--no-verify`
- npm install / 動 dependency

---

## 7. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | `main` / `a39d51c` / 0-0 / clean |
| file changes | 本 docs record（新增）+ CLAUDE.md §3a ADMIN table（+1 row ledger sync） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 MEMORY.md | ✅ |
| no K7 implementation / no write path / no Apply / no middleware / API / `admin-write-cli` | ✅ |
| no `--apply` / no `dryRun:false` / no payload files | ✅ |
| no build / deploy / dev / Blogger repost / GA4 backend | ✅ |
| no amend / rebase / force-push / no dependency change | ✅ |

→ docs-only preflight record，acceptance trivially PASS。

---

## 8. Cross-links

- `docs/20260617-phase2-admin-ui-static-payload-preview-implementation-plan.md`（docs-only plan）
- `docs/20260617-night-phase2-admin-ui-static-payload-preview-implementation-a.md`（source landed ledger；`f873ec2`）
- `docs/20260617-night-admin-static-payload-preview-browser-pass-record-a.md`（source-only inspection PASS；browser pending；`2917f59`）
- `docs/20260617-night-admin-static-payload-preview-browser-pass-record-b.md`（browser-level acceptance PASS；user evidence 2026-06-17 22:17）
- `docs/20260617-phase2-admin-ui-copyable-payload-panel-preanalysis.md`
- `docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`
- `CLAUDE.md` §3a Core operating rules / §3a Red lines / §3a ADMIN current state / §8 / §27 / §28 / §29

---

（本文件結束）
