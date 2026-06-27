---
date: 2026-06-27
phase: 20260627-admin-markdown-export-ui-preflight-hardening-a
status: docs-only evidence record
scope: admin-ui-copy + 1 additive smoke case
predecessor-commit: a50a43b (test(admin): expand markdown export smoke cases — 91/91 PASS)
---

# Admin Markdown export — UI / preflight clarity hardening evidence

## 0. 一句話結論

`/admin/#new-post-draft` 區塊新增一塊 scannable 的 **Draft-only contract** 提示，
並把既有的「Manual import flow」說明與 4-step checklist 升級為更明確的「Admin
不寫入 repo」契約敘述（5 步）；同步補一條 smoke case 鎖住 `buildPostMarkdown`
**raw 文字**仍含 literal `status: "draft"` + `draft: true` 字串，
避免 helper 未來改 YAML quoting 風格時 UI copy 出現與檔案內容不一致的漂移。

驗證結果：

| 指令 | baseline | 本輪 |
| --- | --- | --- |
| `npm run check:admin-markdown-export` | 91 / 91 PASS | **92 / 92 PASS** |

紅線：

- ✅ 仍是 draft-only；無 ready option
- ✅ 仍無 repo write path；無 Apply / middleware / admin-write-cli
- ✅ 仍無 fetch / XHR / form submit；純 client-side display
- ✅ 仍無 DB / login / multi-user
- ✅ 沒有碰 `content/` / `content/settings/`
- ✅ 沒有碰 Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console
- ✅ 沒有改 `package.json` / `package-lock.json`
- ✅ 沒有 deploy / 沒有跑 dev server
- ✅ 沒有 build / 沒有改 `dist/` / `gh-pages/`

---

## 1. 進場 baseline verify（unchanged）

```text
pwd                                  → /d/github/blog-new/portable-blog-system
git branch --show-current            → main
git rev-parse HEAD                   → a50a43bfffbff99456c5da2f5c0d81e42d5c1307
git log -1 --oneline                 → a50a43b test(admin): expand markdown export smoke cases
git status --short                   → (empty)
git rev-list --left-right --count    → 0   0
.git/index.lock                      → absent
npm run check:admin-markdown-export  → 91 / 91 PASS
```

baseline ✅

---

## 2. 動機

上一輪（`a50a43b`）把 Admin Markdown export 純函式 smoke 從原本的 86 擴張到
91 個 case，鎖住了 cross-helper invariants（buildPostMarkdown ↔ analyzeReadyGap
↔ analyzeRegistryHints ↔ buildExportSummary ↔ isExportReady 不互相 mutate；
pretend-ready input 仍會被強制壓回 draft）。

但 Dean 實際手動使用 `/admin/#new-post-draft` 時，現場文案還是分散在好幾段
text-muted 小字裡，**「Admin 不會寫入 repo / 不會發布 / 永遠 draft」**這三個
最關鍵的 safety contract 一眼看下去不夠突顯：

1. 第一段 lede 用 `<p class="section-lede">`，淡灰色字
2. 第二段黃色 lock banner 只說 `no fs write · no fetch · no Apply`（英文 + 偏技術）
3. 第三段 summary strip 顯示固定 `status: draft` badge（要看到 badge 才知道）
4. Manual import flow lede 補了「不寫入 content/」但跟前面三段並列、不夠收斂

對人工作業流程（Dean 用 Admin 產生 markdown → 自己貼到 VS Code →
跑 validate → 編成 ready）來說，最容易誤踩的雷區是：

- 以為按 Copy / Download 已經把檔案進到 repo
- 以為 Admin 會自動發布到 Blogger
- 不知道應該存到 `content/blogger/posts/` 還是其他位置
- 不確定 import 完之後到底要跑什麼指令

本輪目標：把這四個雷區整理成一塊 scannable 的「Draft-only contract」清單，
讓 Dean 一眼看到「Admin 做什麼、不做什麼、檔案要存到哪、後面要跑什麼指令」。

---

## 3. 變更摘要

### 3.1 UI — `src/views/admin/index.ejs`

#### 3.1.1 lede 微調（line ~1794–1798）

在原本「產出永遠是 `status:"draft"`」之後補一句：

> Admin **不會**自動寫入 repo、**不會**自動發布；取得 `.md` 後請由 Dean 人工存到
> `content/{site}/posts/`，再以 VS Code 編修為 ready/published。

理由：lede 是 Dean 進這個區塊第一眼看到的 60 字小段，需要先把
「Admin 不會自動發布」這一句明文化（原本只有「請手動存到 content/{site}/posts/」
暗示 Admin 不寫，但沒寫清楚「不發布」）。

#### 3.1.2 新增 Draft-only contract callout（line ~1804–1817）

在黃色 lock banner 之後、form table 之前新增一塊淺藍底（`#eef4fb`）+
深藍邊（`#b3c8e0`）的 callout，含 6 條 invariant：

```text
📋 Draft-only contract  [read-only invariants]
  • 產出永遠是 draft：frontmatter 固定 status: "draft" + draft: true；表單沒有 ready / published 切換
  • 產出 ≠ 發布：Copy / Download 不會送上 Blogger、GitHub Pages、Google Drive 或任何後台；不會觸發 build / deploy
  • 不會自動寫入 repo：Admin 不寫 content/、不發 fetch、不跑 Apply / safeWrite / middleware；要存檔請由 Dean 人工貼入
  • 目標位置：依 site 切換 content/github/posts/ 或 content/blogger/posts/，檔名 {date}-{slug}.md
  • 匯入後請執行 validation：npm run validate:content（VS Code terminal）；通過後再決定是否在 VS Code 把 status 改成 ready / published
  • 狀態切換在 repo 端：Admin 永遠不切 ready / published；要升 ready 請先檢視下方 Ready preflight 列出的 blocking 欄位
```

設計重點：

- **pure display**，不接 JS、無 event binding、無 fetch
- 文案直接對應 helper 端鎖住的 6 個常量 / invariant，
  下方 §3.3 列出對應 smoke case
- 視覺權重高於下面 manual import flow 區塊，
  但低於黃色 banner —— 避免新增「看起來像功能切換」的視覺元素
- `section-tag tag-readonly` chip 重申 read-only 屬性

#### 3.1.3 Manual import flow lede 強化（line ~2006–2011）

在原本「本區塊只顯示路徑與指令給 Dean 手動操作；Admin 不寫入 content/、
不觸發 build、不 deploy」之後補一段：

> 即使按下 Copy / Download，`.md` 也不會在 repo 中產生；必須由 Dean 用
> VS Code / Explorer 手動存到下方 **target folder**，才算進入 repo。

理由：原本 lede 沒有明說「按下按鈕後檔案在哪」。
新增這句把 Copy / Download 之後的「下載到瀏覽器 ≠ 進入 repo」這個
Dean 最容易誤踩的雷區明文化。

#### 3.1.4 4-step 升級為 5-step checklist（line ~2041–2046）

原本：

```text
1. Download .md（或 Copy markdown），取得 {date}-{slug}.md 檔案
2. 把 .md 手動存到 target folder（例：content/github/posts/）
3. 在 terminal 跑 npm run validate:content 檢查 frontmatter 與 schema
4. 需要時用 VS Code 編修 body / category / tags / cover；維持 status:"draft" 直到內容完成
```

新版：

```text
1. Download .md（或 Copy markdown），取得 {date}-{slug}.md 檔案 — 此時檔案還在
   瀏覽器 / 剪貼簿，尚未進入 repo
2. 用 VS Code 或 Explorer 把 .md 手動存到 target folder（例：content/github/posts/）
   — 這一步完成後檔案才正式在 repo 內
3. 在 terminal 跑 npm run validate:content 檢查 frontmatter 與 schema
   （PASS 才算 import 完成）
4. 需要時用 VS Code 編修 body / category / tags / cover；本階段請維持
   status:"draft" + draft:true
5. 若日後要升 ready / published，請在 VS Code 手動改 frontmatter
   （Admin 永遠不切 status），改完再跑 npm run validate:content 確認 0 errors
```

差異：

- 第 1 / 2 步補上「還在瀏覽器 / 剪貼簿 vs 已經進 repo」的對比 — 明確化檔案位置
- 第 3 步補上「PASS 才算 import 完成」明確完成條件
- 第 4 步補上 `draft:true` 的搭配（與 contract callout 第一條對齊）
- **新增第 5 步**：升 ready / published 的責任歸屬給 VS Code，
  明確切斷「能不能在 Admin 切 ready」的疑問

### 3.2 Smoke — `src/scripts/check-admin-markdown-export.js`

新增 1 個 case：

```text
PASS  92 raw markdown text contains literal `status: "draft"` and `draft: true` lines
```

差異 vs 既有 case 91（pretend-ready 仍會被壓回 draft）：

| case | 檢查方式 | 鎖住的層 |
| --- | --- | --- |
| 91 | `matter(buildPostMarkdown(pretend)).data.status === 'draft'` | gray-matter parser 解出的物件 |
| 92 | `/^status: "draft"$/m.test(buildPostMarkdown(input))` 直接掃**字串** | 序列化後的 raw markdown 文字 |

兩者並存的價值：若未來 helper 改 YAML quoting 風格（例如改成單引號、改成
multiline string、加 anchor），case 91 仍可能通過（gray-matter 仍解出
`status: "draft"`），但 case 92 會立即抓到 — 因為 UI 的 Draft-only contract
callout 明文寫了 `status: "draft"` + `draft: true` 這個雙引號 + 全小寫
的具體字串。

case 92 同時加 cross-lock 反向斷言（frontmatter 區段內不可出現
`status: "ready"` / `status: "published"` / `draft: false`），
覆蓋 pretend-ready / `{}` / `null` / `undefined` / `blogger` site /
edge-quoted title 共 7 種 input。

### 3.3 UI ↔ helper 對齊矩陣

| UI Draft-only contract 第 N 條 | 鎖住的 helper 常量 / smoke case |
| --- | --- |
| ① 產出永遠是 draft：`status: "draft"` + `draft: true` | smoke 23 / 24 / 51 / 83 / 91 / **92** |
| ② 產出 ≠ 發布；不會觸發 build / deploy | 由 helper 沒有 fetch / 沒有 fs.write API surface 保證（無對應 smoke；架構性紅線） |
| ③ 不會自動寫入 repo | 同上（架構性紅線） |
| ④ 目標位置 = `content/github/posts/` / `content/blogger/posts/` | smoke 26 / 27 / 28 / 33 |
| ⑤ 匯入後執行 `npm run validate:content` | smoke 32 |
| ⑥ 狀態切換在 repo 端；Admin 不切 status | smoke 91 / 92（即使 input 假裝 ready 也壓回 draft） |

意思：UI 文案上看到的「constant / 不變量」全部對應到至少一個 smoke case 鎖住，
未來改 helper 或 UI 任何一邊都必須同步更新另一邊（否則 smoke 會 fail）。

---

## 4. 驗證

### 4.1 Smoke

```text
$ npm run check:admin-markdown-export
... (cases 01–86 unchanged, all PASS) ...
PASS  87 analyzeRegistryHints accumulates category + tag hints in input order
PASS  88 cross-helper sequence does not throw and does not flip export to ready
PASS  89 many tags input handled without throw; counts + hints match expected
PASS  90 cross-consistency: isExportReady.ok=true ⇒ filename and targetPath non-empty
PASS  91 defense-in-depth: input pretending to be ready cannot flip export status
PASS  92 raw markdown text contains literal `status: "draft"` and `draft: true` lines

92 / 92 PASS
```

baseline `91 / 91 PASS` → 本輪 **`92 / 92 PASS`**（+1 case；無 regression）。

### 4.2 Diff sanity

```text
$ git diff --check        → (clean; no whitespace errors)
$ git diff --stat
 docs/20260627-admin-markdown-export-ui-preflight-evidence.md | NEW
 src/scripts/check-admin-markdown-export.js                    | +~36
 src/views/admin/index.ejs                                     | +~30 / -~8
$ git status --short
 M  src/scripts/check-admin-markdown-export.js
 M  src/views/admin/index.ejs
 ?? docs/20260627-admin-markdown-export-ui-preflight-evidence.md
```

### 4.3 沒有跑的東西（紅線）

| 項目 | 為何沒跑 |
| --- | --- |
| `npm run validate:content` | UI copy / smoke 修改不影響 content；baseline carry-forward 0/134/106 |
| `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` | 同上；admin 區塊不在 prod build |
| `npm run dev` / Vite dev server | UI copy 變更是純 EJS 文字，不啟 dev server 可由 source-level 驗證；CLAUDE.md §27 不需 user 手動檢查 |
| `npm install` / 改 `package.json` | 零新依賴 |
| Playwright / 任何 e2e | CLAUDE.md 明文禁止引入；smoke 已覆蓋 helper 端 |
| Blogger / GA4 / AdSense / Search Console / Google Drive 後台 | 紅線 — 永禁自行操作 |
| `git push` | 等本輪 commit + Dean 同意 |

---

## 5. 紅線總結

本輪沒有跨越的紅線：

- ❌ 沒有新增 repo write path（依然無 Apply / middleware / admin-write-cli）
- ❌ 沒有新增 ready 發布模式（UI 也沒有 ready option 任何形式）
- ❌ 沒有讓 UI 能產出 `status: "ready"` / `draft: false` —— smoke 92 反向斷言鎖住
- ❌ 沒有新增 database / login / auth / multi-user
- ❌ 沒有碰 Blogger live / Google Form / Google Drive / GA4 / AdSense / Search Console
- ❌ 沒有碰 `content/` / `content/settings/`
- ❌ 沒有碰 `dist/` / `dist-blogger/` / `dist-promotion/` / `gh-pages/`
- ❌ 沒有改 `package.json` / `package-lock.json` / lockfile
- ❌ 沒有碰 LearnOops 專案
- ❌ 沒有 deploy
- ❌ 沒有開 dev server
- ❌ 沒有跳過 hooks（`--no-verify`）/ 跳過 signing
- ❌ 沒有 destructive git op（reset --hard / push --force / amend / rebase / cherry-pick）
- ❌ 沒有把巨型 ledger 寫回 CLAUDE.md

本輪是 docs / UI / smoke 三者最小切片：
**UI 端文案明確化 + smoke 端 raw text invariant lock + docs 端紀錄**。
完全不引入 ready / 寫入 / 自動發布的任何 affordance。

---

## 6. 下一輪可選方向（不在本輪執行）

- N1：Admin UI Draft-only contract callout 做完整 browser-run smoke
  （Dean 本機手動開 `npm run dev`，確認 callout 視覺與 6 條 invariant 文字皆顯示；
  本輪僅 source-level 驗證，未開 dev server）
- N2：把 Draft-only contract 文案抽成 EJS partial / data attribute，
  讓 helper 與 UI 共用單一 source-of-truth（目前是 EJS 內 inline + helper 常量平行維護；
  靠 §3.3 矩陣對齊 + smoke 鎖住）
- N3：Ready preflight panel 把「需要 cover / coverAlt / searchDescription」三條
  blocker 對應的補欄位 inline edit affordance 拆出一條 quick-fix link

以上皆為**可選**，須各別開 phase + Dean 明示同意才執行；
本輪不主動推進。

---

## 7. 提交資訊（待 commit）

建議 commit message：

```text
feat(admin): clarify markdown export preflight
```

（主要是 UI copy 強化 + 1 個 invariant smoke + docs；
若認為主要是 smoke 也可改用 `test(admin): cover markdown export ui preflight copy`，
本 evidence 認為以 UI 文案強化為主軸，feat 較準。）
