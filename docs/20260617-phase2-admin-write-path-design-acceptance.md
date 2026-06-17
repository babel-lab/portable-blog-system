# Phase 2 ADMIN Write-Path Design Acceptance（docs-only）

> Phase: `20260617-pm-phase2-admin-write-path-design-acceptance-docs-only-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **docs-only design acceptance**。唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md。
> Scope: 把前一份 preanalysis（`docs/20260617-phase2-admin-write-path-preanalysis.md`）之結論收斂為 **設計決策 / acceptance checkpoint**。採用保守 **A→B 漸進路線**，**不**進入 implementation、**不**啟用任何寫入行為、**不** build / deploy / Blogger repost。
>
> ⚠️ 本文件**不是**實作核可，也**不**啟用 write-path。它記錄 Dean 對「保守 A→B 漸進路線」之 design acceptance，並把未來實作順序與 acceptance gates 鎖定為單頁可審清單。既有 write-path infra 維持 **dormant**。

---

## 1. Baseline（phase 開始前）

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD | `f92abc2`（full `f92abc268f5194c1838afe3a7f94f260253a9054`） |
| origin/main | `f92abc2` |
| HEAD == origin/main | ✅ |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `docs(admin): plan phase 2 write path` |

→ Baseline 完全符合 frozen baseline `f92abc2`。未 pull / merge / reset / rebase / amend / force-push。

**前置 preanalysis**：`docs/20260617-phase2-admin-write-path-preanalysis.md`（landed @ `f92abc2`，subject `docs(admin): plan phase 2 write path`）。本 doc 接續其 §7「Recommended conservative path」與 §9「Recommended next phase」之保守路線，將其落成 design acceptance。

Carry-forward acceptance numbers（**本 phase 不重跑**；僅引用 CLAUDE.md §3a / preanalysis §1）：

- `validate:content` = 0 errors / 94 warnings / 84 issue-posts（production-post warnings = 0）
- `safe-write:test` = 71 pass / 0 fail（carry-forward；本 phase 未跑）
- 其餘 guard 皆 carry-forward green。

---

## 2. Decision

**接受保守 A→B 漸進路線。** 具體決策：

### 2.1 採納

- **Option A（現在 / 持續）**：ADMIN 維持 read-only；強化「可複製 YAML / markdown / packet snippet」匯出能力，由 Dean 手動貼回。零 fs.write 風險。
- **Option B（下一技術步，僅 dry-run）**：local CLI dry-run（`admin-write-cli.js` 之 dry-run path，對 fixture / production `.md` 算 byte-diff），**不** `--apply`。作為 A 之後的下一個技術步驟。
- **actual write（更後段）**：僅在 snippet / dry-run 路線驗證充分後，**behind explicit flag + validation gate + Dean approval** 才逐欄 / 逐檔推進。

### 2.2 明確不採納（現階段）

- ❌ **不**現在開 middleware / API server（Option C `vite.config.js configureServer` / localhost write service）。
- ❌ **不**現在啟用 Admin Apply（browser → Node fs 通道維持關閉）。
- ❌ **不**現在做 direct production writes（任何對 production source content 之 `fs.writeFile`）。

---

## 3. Reasoning

| 理由 | 說明 |
| --- | --- |
| one-person operator safety | Dean 單人操作、無第二位 reviewer 把關；保守路線把首次風險集中在可觀察的 terminal dry-run，而非自動 GUI write。 |
| 避免意外 content mutation | snippet / dry-run-first 確保「先看、再貼 / 再寫」，不會 save-on-blur 或隱式覆寫。 |
| 避免 malformed frontmatter | YAML emitter 對 nested object（`book.authors[]` / `affiliate.links[]` / `images[]`）有 drift 風險；dry-run byte-diff + post-write `validate:content` 可在實寫前攔截。 |
| 保持 Git history 可審 | CLI 不自動 commit / push；所有 mutation 經 `git diff` 由 Dean 審後手動 commit，history 全程 reviewable。 |
| write / publish / repost 解耦 | write-path 與 build / deploy / Blogger repost 完全解耦；寫入不會誤觸發布或重貼。 |
| 允許 rollback + diff review | 唯一回退機制 = `git restore <file>`（working-tree-level）；任何 write 前 working tree 須 clean 作為 restore point。 |
| 既有 infra 應維持 dormant | `safe-write.js` / `admin-write-cli.js` / helpers / npm scripts 雖存在，但在 acceptance gates 未滿足前**維持 dormant**，不啟用。 |

---

## 4. Current accepted state

| 項目 | 狀態 |
| --- | --- |
| ADMIN 性質 | 安全：read-only / preview / dry-run / snippet-export-oriented UI |
| write-path infra | **存在但 not active**（dormant） |
| production content write | **未發生任何一次** |
| Admin Apply | **disabled**（FB sidecar Apply 永久 disabled） |
| middleware / API server | **closed**（`vite.config.js` 無 `configureServer` / `fs.writeFile` / `app.post`） |

**Factual confirmation（本 session read-only 查證）**：

- `src/scripts/safe-write.js` 存在：atomic tmp + rename；流程 whitelist → git-status-check（caller 提供）→ validators → tmp write → rename；失敗清 `.tmp` 不留 partial；不 spawn git；不直接綁 Admin UI。
- `src/scripts/admin-write-cli.js` 存在：`--apply` + `payload.dryRun===false` 才走 real-write；`--apply` alone 或 `dryRun:false` alone 皆 reject；real-write 額外 gate（status 收窄至 `{'draft'}`、寫前 re-check whitelist TOCTOU、委派 safeWrite `enforceCleanGit:true`、no-op skip）；dry-run 行為 verbatim 保留；exit codes 0/1/2/3/4/6/7/8。
- `package.json` scripts：`safe-write:test`（line 40）/ `admin:write`（line 41）存在但 dormant（未接 browser、無 runtime production write）。

→ 上述為 read-only 查證，**未執行、未修改**任何 infra。

---

## 5. Future implementation sequence

| 步驟 | 內容 | 寫入? |
| --- | --- | --- |
| Step 1 | design acceptance checkpoint（= 本 doc，**現在**） | ❌ 零 source |
| Step 2 | fixture-only audit of existing `safe-write` / `admin-write-cli`（read-only 審查 + fixture 盤點） | ❌ 無 production write |
| Step 3 | CLI dry-run proof **against fixture only** | ❌ dry-run，無 fs write |
| Step 4 | production-target **dry-run diff only**（對 production `.md` 算 byte-diff，**no write**） | ❌ no write |
| Step 5 | actual write —— 僅 with explicit flag + backup/restore point + dirty-tree guard + validation gate + Dean approval | 🟡 受 §6 全 gate 約束 |
| Step 6 | commit only after Dean reviews diff（CLI 不自動 commit / push） | — |

每步之間皆為 stop point；**無鏈式啟動**。

---

## 6. Acceptance gates before any actual write

任一 actual write 須**同時**滿足以下全部 gate（缺一不寫）：

1. **clean working tree required** —— pre-write `git status` 須 clean（git 即 restore point）。
2. **explicit target file required** —— 單一明確 target 檔；不接受隱式 / 推斷 target。
3. **no glob / bulk write by default** —— 預設禁批次 / glob 寫入；逐檔逐欄。
4. **backup or restore point required** —— working tree clean 作為 restore point；dirty 時拒寫。
5. **`validate:content` required before commit** —— post-write validation 不退步才能 commit。
6. **no build / deploy / repost coupling** —— write-path 與 build / deploy / Blogger repost 完全解耦；CLI 不 spawn 之。
7. **no Blogger / GA4 / AdSense backend coupling** —— write-path 不觸碰任何外部後台。
8. **Dean approval required before real write** —— 每次 actual write 前皆須 Dean 明示；無 auto-write / 無 implicit save-on-blur。
9. **rollback instructions required** —— 每次 write 須附 rollback 指示（`git restore <file>`）。

---

## 7. Non-goals（本 phase 明確不做）

- ❌ no source implementation in this phase
- ❌ no middleware activation
- ❌ no Admin Apply activation
- ❌ no content mutation
- ❌ no package / dependency changes
- ❌ no Blogger repost
- ❌ no deployment
- ❌ no Phase 1 history rewrite
- ❌ 不修改 source / content / settings / views / scripts / package / lockfile / dist / dist-blogger / dist-promotion / gh-pages / `.cache` / CLAUDE.md / MEMORY.md
- ❌ 不 build / 不重跑 validate / guards（baseline carry-forward）
- ❌ 不 merge / rebase / reset / amend / force-push
- ❌ 不啟用任何 write behavior；既有 dormant infra 維持 dormant

唯一 mutation = 本 doc（`docs/20260617-phase2-admin-write-path-design-acceptance.md`）新增。

---

## 8. Recommended next phase

**保守 next（推薦）**：

```
20260617-pm-phase2-admin-write-path-fixture-audit-readonly-a
```

- **Goal**：read-only 審查 dormant `safe-write` / `admin-write-cli` 之行為與 fixtures，盤點現有 fixture 覆蓋，然後**回報** fixture-only dry-run proof 是否可安全開啟。
- **Do not implement yet** —— 該 phase 仍為 read-only / docs；任何 dry-run proof 之實際開啟須再經 Dean approval。

---

## 9. Cross-links

- `docs/20260617-phase2-admin-write-path-preanalysis.md`（本 doc 之前置 preanalysis）
- `docs/20260617-blog-phase1-closure-checkpoint.md`（Phase 1 closure）
- `docs/admin-2-write-pre-analysis.md`（write surface inventory / 欄位分級 / Strategy A–F）
- `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（middleware surface / security boundary）
- `docs/20260528-admin-write-phase-4p5-cli-driver-preanalysis.md`（CLI write driver / payload schema / exit codes / byte-exact gate）
- `docs/20260528-admin-write-phase-4p5e-yaml-drift-mitigation-preanalysis.md`（YAML emitter drift mitigation）
- `docs/fb-sidecar-write-preflight-decision.md`（FB sidecar 真實寫入 dormant gate）
- `CLAUDE.md` §8 / §28 / §29（第二階段 / MVP 必做 / 第一版不做清單）

---

## 10. Acceptance（本 phase 自身）

| 項目 | 結果 |
| --- | --- |
| baseline verify（branch / HEAD / origin / ahead-behind / clean） | ✅ `main` / `f92abc2` / 0-0 / clean |
| 唯一 file change | `docs/20260617-phase2-admin-write-path-design-acceptance.md`（新增） |
| 未改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` | ✅ |
| 未改 CLAUDE.md / MEMORY.md | ✅ |
| 未啟用 Admin Apply / middleware / API / write behavior；未新增 npm dep | ✅ |
| 未 build / deploy / repost / npm install / merge / rebase / reset / amend / force-push | ✅ |
| dormant write-path 維持 dormant；無 production write | ✅ |

→ docs-only design acceptance，acceptance trivially PASS。

---

（本文件結束）
