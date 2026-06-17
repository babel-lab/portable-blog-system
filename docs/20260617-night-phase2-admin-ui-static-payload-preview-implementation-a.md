# Phase 2 — Admin UI Static Payload Preview Implementation A（source landed）

> Session: `20260617-night-phase2-admin-ui-static-payload-preview-implementation-a`
> Date: 2026-06-17（Asia/Taipei）
> Type: **source landed**（additive；dev-mode-only Admin UI；no write）
> 落地依據：`docs/20260617-phase2-admin-ui-static-payload-preview-implementation-plan.md`（前一輪 docs-only plan）

---

## 1. Purpose

把前一輪 implementation plan 之 §4–§8 設計，落為**最小可回退、純 additive、純前端字串組裝**之 Admin UI 靜態 payload preview block。Preview only；不寫任何檔案；不啟用 Apply；不啟用 middleware / API。

---

## 2. Baseline verify

| 項目 | 值 |
| --- | --- |
| repo | `/d/github/blog-new/portable-blog-system` |
| branch | `main` |
| pre-phase HEAD | `add4f98b93df99f088aeae3111378f96595f99d7`（short `add4f98`） |
| origin/main（pre-phase） | `add4f98`（== HEAD） |
| ahead / behind | `0 / 0` |
| working tree | clean |
| latest subject | `fix(admin): clarify phase wording copy` |

→ 符合 plan §2 frozen baseline 之後續 HEAD（`aaa2463` plan → `e402ed7` plan ledger → `f0e0/65d0/aaa/e402/f0710/add4f98` wording 系列）；本 phase 為 plan accept 之後第一個 source phase。

---

## 3. Scope summary

| 動作 | 範圍 |
| --- | --- |
| 修改 | `src/scripts/load-admin-posts.js`（+5 行；新增 `sourceRel`） |
| 修改 | `src/views/admin/index.ejs`（+82 行；CSS + markup + JS handler） |
| 新增 | `docs/20260617-night-phase2-admin-ui-static-payload-preview-implementation-a.md`（本檔） |
| 未動 | content / settings / templates / vite.config.js / package.json / lockfile / dist* / gh-pages / `.cache` / CLAUDE.md / MEMORY.md |

---

## 4. Files changed

```
docs/20260617-night-phase2-admin-ui-static-payload-preview-implementation-a.md  (new)
src/scripts/load-admin-posts.js                                                 (+5)
src/views/admin/index.ejs                                                       (+82)
```

---

## 5. Implementation details

### 5.1 Loader：新增 `sourceRel` 欄位（read-only）

- `src/scripts/load-admin-posts.js` `toAdminView` return shape 新增 `sourceRel: toNormalizedKey(mdPath)`
- 用 既有 `toNormalizedKey()`（pm-14 §D.1；absolute → repo-relative posix）；mirror `validationReportCtx.byKey` 既有 join 慣例
- 用途：提供 server-side safe relative path 給 EJS render 之 payload preview，避免 client 端字串拼湊（plan §4.3 R2 mitigation）
- 純 additive；不改既有欄位；既有 view 忽略本欄位 → backout cost = 0

### 5.2 EJS：CSS + markup

CSS：新增 `.payload-preview-section` / `.payload-preview-body` / `.payload-json-output` / `.payload-cmd-output` / `.payload-preview-compute` / `.payload-preview-status`（6 個 selector；inline `<style>` 內，與既有 `.dry-run-*` 風格一致；無新外部 CSS file）。

Markup：於既有 `.dry-run-section` 之 `.dry-run-result` 之後、`.apply-disabled` button 之前，新增 nested `<details class="payload-preview-section">` 收合區：

- `<summary>` 標示「Static payload preview（PREVIEW ONLY — 不執行任何寫入）」；預設 closed
- 顯著 `dry-run-warning`：「PREVIEW ONLY · 靜態 payload 預覽 · 不寫任何檔案 · 複製不構成核准」
- field `<select>`：四選一（`description` / `searchDescription` / `titleEn` / `coverAlt`），mirror plan §5 safe-editable subset
- targetRel 顯示：`<pre><code><%= p.sourceRel %></code></pre>`（server-side render；read-only）
- Payload JSON：`<textarea readonly>` 預設為 placeholder（user 須點 Compute 才出內容）
- Command preview：`<pre><code>` 預設 placeholder
- `<button>` Compute payload preview：onClick handler 純字串組裝（§5.3）
- 無 copy 按鈕（本切片）；無 Apply 按鈕（本區塊內）

### 5.3 EJS：client-side JS handler（純前端）

於既有 `.dry-run-section` handler 內加 nested handler（位置在 `compute.addEventListener('click', ...)` 之後、forEach scope 內），讀同 section 內既有 `data-current` 與 textarea `data-input`，組 deterministic JSON：

```js
'{\n'
  + '  "targetRel": ' + JSON.stringify(targetRel) + ',\n'
  + '  "field": ' + JSON.stringify(fieldName) + ',\n'
  + '  "expectedOldValue": ' + JSON.stringify(oldVal) + ',\n'
  + '  "newValue": ' + JSON.stringify(newVal) + ',\n'
  + '  "dryRun": true\n'
  + '}'
```

固定 key 順序：`targetRel` → `field` → `expectedOldValue` → `newValue` → `dryRun`（plan §5 contract）。

Command preview：固定字串 `node src/scripts/admin-write-cli.js --payload=<temp.json>`（無 `--apply`，無 `dryRun:false`）。

無 `fetch` / `XMLHttpRequest` / `fs.writeFile` / `writeFileSync` / `spawn` / `child_process` / `exec` / form submit / auto-submit / auto-copy。

---

## 6. Validation / tests run

| 指令 | 結果 |
| --- | --- |
| `git diff --stat` | 2 files / +87（如 §4） |
| `npm run validate:content` | **0 errors / 94 warnings / 84 posts** —— 與 CLAUDE.md §3a baseline 一致；no regression |
| `npm run check:admin-governance-aggregation` | **16 passed / 0 failed** —— baseline 一致；no regression |
| `npm run check:admin-validation-consume` | **12 passed / 0 failed** —— baseline 一致；no regression |
| guardrail grep — `fetch(` / `XMLHttpRequest` / `method="post"` / `fs.writeFile` / `writeFileSync` in `src/views/admin/index.ejs` | **0 真實 caller**（其餘為 comment / display text） |
| guardrail grep — `spawn` / `child_process` / `exec(` in admin view | **0 matches** |

未跑（per §3a / 本 phase scope）：build / build:github / build:blogger / deploy / `safe-write:test` / `admin:write` / `admin-write-cli` / dev server / `--apply` / `dryRun:false`。

---

## 7. Explicit no-touch confirmation

本 phase **未**：
- 啟用 Admin Apply（仍 `disabled aria-disabled="true"`）
- 啟用 middleware / API / POST endpoint / dev-server `fs.writeFile`
- 執行 `admin-write-cli` / `safe-write:test` / production dry-run
- 加 `--apply` / `dryRun:false` / `dryRun: false`
- 加 `fetch` / `XMLHttpRequest` / form submit / auto-copy / auto-submit
- 動 content / settings / templates / vite.config.js / package.json / lockfile / dist*
- build / deploy / Blogger repost
- 起 dev server / 重生 `.cache`
- 改 CLAUDE.md / MEMORY.md
- amend / rebase / force-push / `--no-verify`
- npm install / 動 dependency

---

## 8. Acceptance criteria check（per plan §10）

| 條件 | 結果 |
| --- | --- |
| single-file additive diff preferred | 2 files（view + loader；loader 為 R2 mitigation 之 server-side safe path 來源；plan §4.3 已預告） |
| output deterministic（payload / command 同輸入恆同輸出；無 timestamp / 隨機） | ✅（固定 key 順序；無 `Date.now()` / `Math.random()`） |
| no runtime write path | ✅ |
| no API / middleware | ✅ |
| no content mutation | ✅ |
| no dependency changes | ✅ |
| no deploy / repost | ✅ |
| source diff reviewed | ✅（git diff --stat 確認） |
| generated HTML verified | ⏸ 待 user 另行 approval 起 dev server 人工檢視（plan §9） |
| working tree clean after commit / push | ✅（待 commit） |

---

## 9. Risk register check（per plan §11）

| # | 風險 | 落地對應 |
| --- | --- | --- |
| R1 stale `expectedOldValue` | UI warning text 已明示「貼上前再核對 + 跑 `validate:content`」；CLI 端 fail-closed 保留 |
| R2 `targetRel` / path mismatch | server-side `p.sourceRel`（loader `toNormalizedKey`）；不 client 拼湊 |
| R3 UI confusion preview vs write | PREVIEW ONLY warning + 永久 disabled Apply + 「複製 ≠ 核准」明示 |
| R4 accidental `--apply` / `dryRun:false` exposure | UI 預設永不產生此二者；guardrail grep 守住 |
| R5 copy button perceived as approval | 本切片**不**加 copy button；後續切片若加須帶「複製 ≠ 核准」 |
| R6 source complexity | 2 file additive；mirror 既有 dry-run viewer + R1 details 收合；無新 view / module |
| R7 wording inconsistency | 由前一輪 wording 系列 phase 已校正（`f0710` / `add4f98`） |
| R8 classifier / tooling interruptions | baseline verify 已跑；working tree clean 為正確收尾 |

---

## 10. Commit / push

待執行：

- commit message：`feat(admin): add static payload preview`
- push to `origin/main`

---

## 11. Recommended next step

- **保守路徑**：idle freeze + 等待 user dev-server browser-PASS 驗收（per plan §9）。
- **可選 follow-up**（各須獨立 phase + user explicit approval）：
  - Copy buttons（mirror commerce snippet helper；plan §6 optional）
  - Field 選項以「目前 dry-run diff 結果中變更欄位」自動切換（避免 user 重選）
  - Browser PASS record（起 dev server 人工檢視）

**不主動執行**：build / deploy / repost / Admin Apply / middleware / `admin-write-cli` / `--apply` / `dryRun:false`。

---

## 12. Cross-links

- `docs/20260617-phase2-admin-ui-static-payload-preview-implementation-plan.md`（前一輪 docs-only plan）
- `docs/20260617-phase2-admin-ui-copyable-payload-panel-preanalysis.md`
- `docs/20260617-phase2-admin-ui-integration-preanalysis.md`
- `docs/20260617-phase2-admin-ui-stale-copy-correction-record.md`
- `docs/20260617-phase2-admin-write-path-milestone-checkpoint.md`
- `CLAUDE.md` §3a / §8 / §27 / §28 / §29

---

（本文件結束）
