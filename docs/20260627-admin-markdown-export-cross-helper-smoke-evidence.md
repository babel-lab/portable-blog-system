# 20260627 — Admin Markdown export cross-helper smoke evidence

本文件記錄 `test(admin): expand markdown export smoke cases` 切片：
在 `src/scripts/check-admin-markdown-export.js` 末段新增 5 個 cross-helper
invariant cases（87–91），把目前 86 個 per-helper smoke 之外的「組合呼叫」
不變量補進。所有新增皆為 **pure additive smoke**：

- ❌ 不改 `src/scripts/admin-markdown-export.js`（helper 函式 / exports 完全不動）
- ❌ 不改 `src/views/admin/index.ejs`（UI / inline client script / DOM hooks 完全不動）
- ❌ 不改 `content/` / `content/settings/`
- ❌ 不改 `package.json` / `package-lock.json` / dependencies
- ❌ 不跑 `npm run build` / `build:github` / `build:blogger` / `build:promotion` /
  `preview` / `deploy` / push gh-pages
- ❌ 不啟用 Admin Apply / middleware / `admin-write-cli`（永久 dormant；本 slice
  不引入 fs / fetch / network / write path）
- ❌ 不碰 Blogger live / Google Form / Drive / GA4 / AdSense / Search Console
- ❌ 不寫 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- ❌ 不改 `CLAUDE.md` / `MEMORY.md`（CLAUDE.md §3a snapshot 之 baseline
  數值僅 +5；下次 phase 完成時統一 sync，本 slice 不主動回寫巨型 ledger）
- ❌ 不開 vite dev server / 不需要 browser smoke
- ❌ 不引入 ready option、不新增 repo write path、不引入 database / login /
  multi-user 管理
- ✅ 新增本 docs evidence 檔
- ✅ 新增 5 個 smoke cases（test-only；CI / local 可直接 reproduce）

---

## 1. Baseline before

```
pwd                                        # /d/github/blog-new/portable-blog-system
git branch --show-current                  # main
git rev-parse HEAD                         # d8088631eabffd1252fc9033bc7f75d25a9bf517
git rev-parse origin/main                  # d8088631eabffd1252fc9033bc7f75d25a9bf517
git rev-list --left-right --count origin/main...HEAD   # 0   0
git log -1 --oneline                       # d808863 docs(state): sync admin markdown baseline
ls .git/index.lock                         # absent
git status --short                         # (empty)
npm run check:admin-markdown-export        # 86 / 86 PASS
```

- branch = `main` ✅
- HEAD = origin/main = `d8088631eabffd1252fc9033bc7f75d25a9bf517` ✅
- short HEAD = `d808863` ✅
- subject = `docs(state): sync admin markdown baseline` ✅
- working tree clean ✅
- ahead / behind = 0 / 0 ✅
- `.git/index.lock` absent ✅
- 既有 smoke baseline = **86 / 86 PASS**

Phase 1 Admin UI / Markdown draft export MVP 維持 idle freeze；本 slice 只在
**test layer** 補 cross-helper invariant，不改變任何 production / UI / source
contract。

---

## 2. Gap analysis — 既有 86 個 smoke 之外仍未鎖定的不變量

| 編號 | 已有 case | 缺口 |
| --- | --- | --- |
| 24 / 51 / 75 / 85 | 個別 helper 之 buildPostMarkdown 不變量 | ❌ 未鎖定「全部 4 個 read-only helper 連續呼叫」之 cross-helper 不變量 |
| 64 / 65 / 66 / 67 / 72 | 單軸 hint accumulation（category-only 或 tag-only） | ❌ 未鎖定「category + tag mismatch 同時發生」之輸出順序 |
| 10 / 11 / 12 / 77 / 86 | 小規模 tags input（≤ 5 個） | ❌ 未鎖定「20 個以上 tags 混合 known / unknown」之 stress safety |
| 34 / 38 / 79 / 80 | `isExportReady` 自身 ok / missing 判斷 | ❌ 未鎖定「`isExportReady.ok=true` ⇒ `buildExportSummary.filename` & `targetPath` 非空」之 cross-consistency |
| 24 | 單一輸入 `status:'ready' + draft:false` → buildPostMarkdown 仍 draft | ❌ 未鎖定「同時通過 4 個 read-only helper（皆判定 ready-candidate）」時 export 仍 draft 之 defense-in-depth |

5 個缺口 → 5 個新 case。

---

## 3. New smoke cases（87–91）

實作於 `src/scripts/check-admin-markdown-export.js` 末段，**未**新增 export、**未**改動既有 case。

### case 87 — registry hints 累積 category + tag hint 之輸入順序

| 屬性 | 值 |
| --- | --- |
| 鎖定的不變量 | hint 先 category-site-mismatch（最多 1）→ 再 tags（依輸入順序，one per tag） |
| Input | `site='github'`, `category='book-review'`, `tags='made-up, book, github'` |
| 預期 hints | `[category-site-mismatch(book-review), unknown-tag(made-up), tag-site-mismatch(book)]` |
| 為何重要 | 既有 case 64–67 每次只測單軸；UI 在 Ready preflight panel render hints 時需要穩定的順序，否則 Dean 看到的清單會 flaky |

### case 88 — 4 個 read-only helper 連續呼叫不會破壞 export

| 屬性 | 值 |
| --- | --- |
| 鎖定的不變量 | `isExportReady → analyzeReadyGap → analyzeRegistryHints → buildExportSummary → buildPostMarkdown` 任一輸入皆 `status:"draft"` + `draft:true` |
| Inputs | 5 組：happy / `{}` / `{...readyHappy, status:'ready', draft:false}` / `{...readyHappy, category:'unknown-cat', tags:'a,b'}` / `null` |
| 為何重要 | Admin UI 之 `recompute()`（`src/views/admin/index.ejs` line 3998–4005）每次按鍵都依此順序呼叫 4 個 helper；單一 helper 已有非破壞性 case（24 / 51 / 75 / 85），但**序列**之 commutativity / 非破壞性未鎖定 |

### case 89 — 大量 tags 之 stress safety

| 屬性 | 值 |
| --- | --- |
| 鎖定的不變量 | 20 個 tags（2 known + 18 unknown）不會讓任一 helper throw；hint count 與 export count 精準對齊 |
| Input | `tags = ['github', 'vite', 'unknown-0', ..., 'unknown-17']` |
| 預期 | `analyzeRegistryHints` 回 18 個 unknown-tag hints；`buildExportSummary.counts.tags === 20`；`buildPostMarkdown` parsed `data.tags.length === 20`；`data.status === 'draft'` |
| 為何重要 | 既有 case 最多測 ≤ 5 個 tags；無 sanity guard 對 ≥ 10 個。雖然 `normalizeTagsInput` 是 O(n) + Set dedupe，但若未來有人加 hard cap，需有 smoke 攔截 |

### case 90 — `isExportReady` 與 `buildExportSummary` cross-consistency

| 屬性 | 值 |
| --- | --- |
| 鎖定的不變量 | `isExportReady.ok=true ⇒ summary.filename ≠ '' && summary.targetPath ≠ ''` |
| 反向不變量 | 若 `ready.missing` 含 `slug` 或 `date` → `summary.filename === ''` 且 `summary.targetPath === ''` |
| 額外鎖 | `summary.targetPath === summary.targetFolder + summary.filename`（不會出現 folder 與 path 不一致） |
| 為何重要 | Admin UI 之 Copy markdown / Download / Copy target path 三顆按鈕都 gate on `isExportReady.ok`（line 2009）。若沒有這個 cross-consistency，理論上可能出現「按鈕 enabled 但 filename 空字串」之 race state，會讓 Download 下載空檔名 `.md` |

### case 91 — defense-in-depth：input pretending to be ready 也無法翻轉 export

| 屬性 | 值 |
| --- | --- |
| 鎖定的不變量 | 即使 input 攜帶 `status:'ready'` + `draft:false` + 每個必填欄位都合法 + 有 `publishedAt`（無視 input contract），`buildPostMarkdown` 仍輸出 `status:"draft"` + `draft:true` |
| 進一步驗收 | `isExportReady.ok=true`、`analyzeReadyGap.ok=true` + `summary='ready-candidate'`、`buildExportSummary.status='draft'`（**literal**，不被 input.status 影響）、`buildExportSummary.draft=true`（**literal**） |
| 為何重要 | smoke 24 已測過部分（單一輸入），但本 case 把「**所有 4 個 read-only helper 都報 ready-candidate 之輸入**」一起鎖。export 是「進入 `content/{site}/posts/*.md`」的單一真實來源；分析器永遠是 hint，不可作為 status 的 source-of-truth |

---

## 4. After-state — smoke result

```
$ npm run check:admin-markdown-export
PASS  1 happy path parses with gray-matter
PASS  2 enums align with validate-content.js source-of-truth
...
PASS  86 buildExportSummary tag counter dedupes / trims (matches normalizeTags rule)
PASS  87 analyzeRegistryHints accumulates category + tag hints in input order
PASS  88 cross-helper sequence does not throw and does not flip export to ready
PASS  89 many tags input handled without throw; counts + hints match expected
PASS  90 cross-consistency: isExportReady.ok=true ⇒ filename and targetPath non-empty
PASS  91 defense-in-depth: input pretending to be ready cannot flip export status

91 / 91 PASS
```

baseline carry-forward：86 / 86 → **91 / 91**（+5；皆 PASS；無 FAIL；無 SKIP）。

---

## 5. Diff scope

| 檔案 | 變動 | 性質 |
| --- | --- | --- |
| `src/scripts/check-admin-markdown-export.js` | +5 cases（87–91），插在 case 86 與 `console.log(...)` 之間 | test-only；無 production-code 變動 |
| `docs/20260627-admin-markdown-export-cross-helper-smoke-evidence.md` | 新增本檔 | docs-only |

```
$ git diff --stat
 ...check-admin-markdown-export.js         | +120 -1
 ...cross-helper-smoke-evidence.md         | +N  -0
```

無下列檔案異動：

- `src/scripts/admin-markdown-export.js`（helper exports 完全不動）
- `src/views/admin/index.ejs`（UI / inline client mirror 完全不動）
- `package.json` / `package-lock.json`
- `content/` / `content/settings/` / `content/validation-fixtures/`
- `CLAUDE.md` / `MEMORY.md`
- 任何 `dist*/`

---

## 6. 紅線確認（CLAUDE.md §3a + Phase 1 final + Admin idle freeze）

本 slice **未**碰任何 §3a 紅線：

- ❌ 沒有 `git push --force` / `git rebase` / `git reset --hard` / `git amend` / `git cherry-pick` / `git merge`
- ❌ 沒有 `--no-verify` / `--no-gpg-sign`
- ❌ 沒有 `npm install` / 沒有動 `package.json` / 沒有動 lockfile
- ❌ 沒有 `npm run build*` / `preview` / deploy / gh-pages
- ❌ 沒有 regression check（除了本 slice 之 `check:admin-markdown-export`；其他
  validation script 之 baseline 數值未量測、未變動）
- ❌ 沒有動 `src/views/` / `src/scripts/` 其它檔案 / `content/` / `settings/` /
  `.cache/`
- ❌ 沒有動 `MEMORY.md`（本 slice 非 memory-sync phase）
- ❌ 沒有任何 Blogger / AdSense / GA4 / Google Drive / Search Console 後台動作
- ❌ 沒有 Phase 1 final 降級
- ❌ 沒有把巨型 ledger 又寫回 CLAUDE.md（本 docs 是 phase-specific evidence，
  per §3a Historical ledger replacement rule 寫到 `docs/<date>-<phase>.md`）

ADMIN stage checkpoint = ✅ **idle freeze**（仍維持；本 slice 只在 test layer，
不推進 ready option / write path / R2+ 任一）。

---

## 7. 限制與後續注意

- 本 slice **沒有**跑完整 browser-run smoke。Admin UI 之 `recompute()` 與 inline
  client script 是 source-side helper 之 mirror — 若未來有人改 inline client
  script 但忘了改 server helper，本 smoke **不會**抓到 mirror divergence。
  之後需要 browser-run smoke 才能 catch（由 Dean 本機手動跑 `npm run dev` +
  在 `/admin/#new-post-draft` 操作；本 slice 不主動推進那條線）。
- case 89 之 stress 上限為 20 tags。若未來業務需要 > 100 tags（不太可能），
  可再加。本 slice 不主動展開。
- case 90 之 cross-consistency 只在 forward direction（ready=true ⇒ filename
  非空）加強反向（title 缺但 slug/date 合法 → filename 仍可生成），其餘
  forward / backward edge case 已有 case 79 / 80 涵蓋。
- case 91 之「pretending to be ready」未涵蓋「`affiliate.*` / `book.*` /
  `download.*` 等次 schema 已填」之假設，因為 Admin 表單不收這些欄位。若未來
  Admin 表單擴張，本 case 須同步擴張。

---

## 8. Reproducibility

```
git checkout main
git fetch origin
git reset --soft origin/main   # only if you need to bisect; otherwise skip
npm run check:admin-markdown-export
# expected: 91 / 91 PASS
```

無外部依賴；不需要 secrets / Google account / Blogger / GA4 / AdSense；不需
network；只需 node + `node_modules`（已安裝 `gray-matter` — 既有依賴）。
