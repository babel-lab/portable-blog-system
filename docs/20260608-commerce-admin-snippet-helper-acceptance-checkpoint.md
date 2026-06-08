# Commerce Admin YAML Snippet Helper — Acceptance Checkpoint

Date: 2026-06-08 night-5
Phase: `20260608-night-5-commerce-admin-snippet-helper-acceptance-checkpoint-docs-only-a`

---

## 1. Purpose

本文件為 commit `77d9ad8` Admin commerce YAML snippet copy helper 的 acceptance checkpoint，作為 read-only 完工存證。

- 文件性質：**docs-only**。
- 本文件**不代表**：
  - commerce registry seed（registry 仍 empty `[]`）
  - renderer activation（renderer 仍 dormant）
  - Admin write path 啟動（Admin Apply / middleware write / admin-write-cli 仍 dormant）
  - production migration（生產文章未遷至 `ref`）
  - build / deploy / Blogger repost / GA4 commerce dimension（全部 dormant）
- 本文件只記錄：source / acceptance / current freeze state，供下一 SESSION cold-start 引用。

---

## 2. Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD | `77d9ad8` |
| origin/main | `77d9ad8` |
| ahead/behind | `0/0` |
| working tree | clean |
| latest subject | `feat(admin): add commerce yaml snippet copy helper` |
| `npm run validate:content` | **0 errors / 69 warnings / 59 posts** |
| overlay validate (`commerce-c4-c9-overlay.json`) | **0 errors / 70 warnings / 59 posts** |
| production `commerceLinks` | **empty `[]`** |

Overlay 指令：

```
node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json
```

---

## 3. Source commit summary

| 項目 | 值 |
|---|---|
| source phase | `20260608-night-1-commerce-admin-copyable-yaml-snippet-source-only-a` |
| commit | `77d9ad8` |
| commit subject | `feat(admin): add commerce yaml snippet copy helper` |
| changed file | `src/views/admin/index.ejs` **only** |
| validator changes | none |
| registry changes | none |
| renderer changes | none |
| content changes | none |
| package / lockfile changes | none |
| CLAUDE.md / MEMORY.md changes | none |

Scope 嚴格限定於 `src/views/admin/index.ejs` 一檔。

---

## 4. Accepted UI behavior

- Admin snippet UI 由 `commerceRows.length > 0` gate。
- production `commerceLinks` empty `[]` 時 → snippet UI **hidden**。
- 既有 empty-state 行為維持正確（未被破壞）。
- **no sample fallback**：不從 sample 載入候選資料。
- **no fake data**：不生成假資料。
- **no crash**：empty registry / missing fields 不導致 JS 例外。

---

## 5. YAML snippet contract

Output shape：

```yaml
affiliate:
  links:
    - ref: <linkId>
      role: <role>
      labelOverride: "<manual override>"
```

規則：

- `role` blank → **omit** `role` key（不輸出空 `role:`）。
- `labelOverride` blank → **omit** `labelOverride` key（不輸出空 `labelOverride:`）。
- snippet 為**純手動 copy helper**。
- snippet **不寫**：
  - markdown 文章檔
  - registry（`content/settings/commerce-links.json`）
  - middleware
  - file system
- 使用者必須**手動**複製 snippet 並貼入目標 `.md` frontmatter。

---

## 6. Role enum contract

允許 role 列舉（**lowercase kebab-case，case-sensitive**）：

- `primary`
- `alternate`
- `official`
- `price-check`
- `library`
- `direct`

額外規則：

- role **remains optional**（可空；輸出時 omit key）。
- **no C7 required-role enforcement**（C7 rule 仍 deferred / NO-GO，per CLAUDE.md commerce-links 段落）。
- snippet UI 之 role selector 列出上述六項。

---

## 7. labelOverride contract

- **author-controlled only**：完全由作者手動填寫。
- default **empty**。
- snippet 輸出前進行：trimmed / single-line / quoted / escaped。
- **never auto-filled** from `displayLabel`。
- **never auto-filled** from `internalLabel`。
- **never written back** to registry。
- 用途：作者在不修改 registry `displayLabel` 的前提下，於該篇文章單獨覆寫顯示文字。

---

## 8. Security / no-leak acceptance

snippet **不得**輸出以下 registry 欄位或衍生資訊：

- `targetUrl`
- `replacementTarget`
- token（access / bearer / refresh / session / Authorization）
- credential（email / password / OAuth client secret / API key）
- tracking URL
- `internalLabel`
- `networkKey`
- merchant id / `merchantKey`
- private notes

行為紅線（snippet UI 不得執行）：

- no `fetch` / no `XMLHttpRequest`
- no form submit
- no `safeWrite`
- no Admin Apply trigger
- no middleware write endpoint call
- no admin-write-cli invocation

snippet helper 純粹為瀏覽器端 in-memory 字串生成 + clipboard copy；對 server / file system / registry **零副作用**。

---

## 9. Acceptance results

night-2 read-only acceptance phase（`20260608-night-2-commerce-admin-copyable-yaml-snippet-source-acceptance-readonly-a`）結果：

| 檢驗項 | 結果 |
|---|---|
| 整體判定 | **ACCEPTANCE PASS** |
| `npm run validate:content` | 0 errors / 69 warnings / 59 posts |
| `node src/scripts/validate-content.js` | 0 errors / 69 warnings / 59 posts |
| overlay validation | 0 errors / 70 warnings / 59 posts |
| `git diff --check` | clean |
| JS syntax sanity | passed |
| scope | exactly one file: `src/views/admin/index.ejs` |

---

## 10. Current blockers / deferred items

| 項目 | 狀態 |
|---|---|
| `content/settings/commerce-links.json` registry | **empty `[]`** |
| L1 seed | **blocked** — requires user-provided candidate entries: `linkId` / `displayLabel` / `role` / `targetUrl`（per night-3 preflight） |
| L2 settings-only seed acceptance | blocked until L1 |
| L3 seed acceptance | blocked until L2 |
| L4 renderer activation | **dormant** |
| C7 missing-role rule | **deferred / NO-GO** |
| Admin write path | **dormant**（Admin Apply / middleware / admin-write-cli 全 dormant） |
| build | not started |
| deploy（gh-pages） | not started |
| Blogger repost | not started |
| GA4 commerce dimension | not started |
| production content migration（raw url → `ref`） | not started |

night-3 preflight 結論：L1 seed 需要 user-provided 真實 candidate entries；不得由 Claude 自動生成假資料 / pattern 推斷 `merchantKey` / `networkKey`（per CLAUDE.md commerce 治理紅線）。

night-4 next-work triage 結論：**Final Idle Freeze / EXIT 最安全**；本 docs-only checkpoint 為低風險選項。

---

## 11. Final frozen state

- 本 checkpoint commit 完成後，建議 **Final Idle Freeze / EXIT**。
- 下一 SESSION **必須** cold-start verify baseline：
  - `pwd` / `git status --short` / `git status --branch --short` / `git log -1 --oneline`
  - HEAD == origin/main
  - working tree clean
  - `npm run validate:content` baseline 數值符合（含本 checkpoint commit 後之新 HEAD）
  - overlay validate baseline 數值符合
- 下一 SESSION **不得自動**啟動：
  - commerce L1 / L2 / L3 / L4 seed ladder
  - C7 source 實作
  - renderer activation
  - Admin write path（Apply / middleware / admin-write-cli）
  - production content migration
  - build / deploy / Blogger repost / GA4 validation
- 任何進一步動作必須由 user 明示啟動，並提供 L1 所需之 candidate entries。
