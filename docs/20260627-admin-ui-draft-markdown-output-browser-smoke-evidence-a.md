# 20260627 — Admin UI draft Markdown output browser smoke evidence (slice A)

本文件記錄 `feat(admin): improve draft markdown output usability`
（commit `cdf521f9622232d096bcd0f3e952426e43291c14`，2026-06-27 15:37 +0800）
之 docs-only browser smoke evidence。本切片**只驗證、只紀錄**：

- ❌ 不改 `src/`
- ❌ 不改 `content/` / `content/settings/`
- ❌ 不改 `package.json` / `package-lock.json`
- ❌ 不跑 `npm run build` / `build:github` / `build:blogger` / `build:promotion` /
  `preview` / deploy / gh-pages
- ❌ 不啟用 Admin Apply / middleware / `admin-write-cli`（永久 dormant）
- ❌ 不碰 Blogger live / Google Form / Drive / GA4 / AdSense / Search Console
- ❌ 不寫 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- ❌ 不改 `CLAUDE.md` / `MEMORY.md`
- ✅ 只新增本 docs 檔（單一檔案）

---

## 1. Baseline before

驗收於本 phase 啟動前執行（read-only baseline verify）：

```
pwd                                        # /d/github/blog-new/portable-blog-system
git branch --show-current                  # main
git status -sb                             # ## main...origin/main（無變動）
git rev-parse HEAD                         # cdf521f9622232d096bcd0f3e952426e43291c14
git rev-parse origin/main                  # cdf521f9622232d096bcd0f3e952426e43291c14
git rev-list --left-right --count origin/main...HEAD   # 0   0
git log -5 --oneline                       # cdf521f / 5520724 / c48d80d / 54233df / 107370f
ls .git/index.lock                         # absent
```

- branch = `main` ✅
- HEAD = origin/main = `cdf521f9622232d096bcd0f3e952426e43291c14` ✅
- short HEAD = `cdf521f` ✅
- subject = `feat(admin): improve draft markdown output usability` ✅
- working tree clean ✅
- ahead / behind = 0 / 0 ✅
- `.git/index.lock` absent ✅

Phase 1 Admin UI / Markdown draft export MVP 仍為 idle freeze；本切片仍在
docs-only smoke evidence 範圍內，不推進 source。

---

## 2. Smoke method

採用 **source-level static smoke + server-side helper simulation**，無 dev
server boot、無 browser automation、無 new dependency、無 fs write。

### 2.1 為何不啟動 vite dev server

| 嘗試 | 結果 |
| --- | --- |
| `node src/scripts/build-github.js --mode=dev`（regenerate `.cache/pages/admin/index.html` 用於 dev server） | ⛔ harness classifier 視為 build / 已 deny |
| `npm run dev`（包含同樣的 predev = `build-github.js --mode=dev`） | ⛔ 同上 deny risk；本切片不再嘗試以免越線 |

`.cache/pages/admin/index.html` 最後 mtime = `2026-06-27 13:50:46`，**早於**
commit `cdf521f`（15:37:10），故現存 cache 不含本切片新元素，dev server 即便
啟動也無法 serve 最新 UI。為遵守紅線（不主動跑 build），本切片改以
**source-of-truth EJS 直接掃** + **server-side helper 直接驅動** 的方式建立
靜態等價 evidence。Dean 之後手動跑 `npm run dev` 即可在瀏覽器看 live UI。

### 2.2 evidence collection

1. **EJS source inventory**：以 `Grep` 對 `src/views/admin/index.ejs` 列出本
   slice 新增的 DOM `id` / 函式名稱，確認所有 markup hook 與 client-side
   function 都在 commit 內落地。
2. **Source map sanity**：抽 `src/views/admin/index.ejs` line ranges 1800–
   2095（HTML block）/ 3460–3480（element refs）/ 3796–3840
   (`renderExportSummary` + `paintCounter`) / 3931–4006 (`recompute`)，逐塊
   閱讀；確認 `renderExportSummary(buildExportSummary(input))` 被掛在
   `recompute()` 末段。
3. **Server-side helper drive**：用 node ESM import `buildExportSummary` 直
   接餵 5 組典型輸入（empty / over-limit title / happy github / blogger +
   invalid slug / invalid site enum + null tags），捕捉具體輸出 shape。
4. **Smoke harness re-run**：`node src/scripts/check-admin-markdown-export.js`
   regression check（含本 slice 新增 cases 76–86）。

---

## 3. Checked surfaces

| Surface | 形式 |
| --- | --- |
| `/admin` IA shell | EJS source @ `src/views/admin/index.ejs` |
| `/admin#new-post-draft` | EJS source line 1803 ~ 2094 (`.new-post-draft-block`) |
| 客戶端 mirror `buildExportSummary` | EJS inline script line 3757 ~ 3795 |
| 客戶端 `renderExportSummary` + `paintCounter` | EJS inline script line 3796 ~ 3840 |
| `recompute()` wiring | EJS inline script line 3931 ~ 4006（4005 行掛入 summary）|
| Server-side `buildExportSummary` | `src/scripts/admin-markdown-export.js` 338 ~ 378 |
| Smoke regression harness | `src/scripts/check-admin-markdown-export.js`（86/86 PASS）|

說明：本評估**未啟動** vite dev server、**未** open browser、**未** capture
screenshot；evidence 為 source-level + helper-drive 等價驗證。

---

## 4. Verified behaviors

### 4.1 Summary strip presence

`src/views/admin/index.ejs` line 1811 ~ 1828 含 7 個 read-only digest hook，
全部存在於 source：

| DOM id | 用途 | 預設文字 |
| --- | --- | --- |
| `npd-summary-site` | 即時鏡射 `site` select | `github` |
| `npd-summary-kind` | 即時鏡射 `contentKind` select | `tech-note` |
| `npd-summary-slug` | sanitize 後的 slug；空 / 不合法時顯示「（未填 / 不合法）」+ 紅字 | `（未填）` |
| `npd-summary-filename` | `{date}-{slug}.md`；不合法時顯示「（待 date + slug）」+ 紅字 | `（待 date + slug）` |
| `npd-summary-target` | `targetPath` 優先；不合法時 fallback `targetFolder` | `content/github/posts/` |
| `npd-summary-ready` | `export ok` / `missing title / slug / date`（`aria-live="polite"`） | `missing` |
| `npd-summary-tagcount` | normalize 後 tag 個數 | `0` |

`status` 沒給 hook id（line 1817），因為它是 hard-wired 寫死 `<span class="badge b-draft">draft</span>`，不會因任何 form 變動切換 —— 此設計即「summary strip status 永遠 draft」之 read-only invariant 之 UI 表現。

### 4.2 Per-field character counters

`src/views/admin/index.ejs` 4 個 inline counter 全部 wired：

| DOM id | 來源欄位 | 顯示形式 | over-limit 行為 |
| --- | --- | --- | --- |
| `npd-count-title` | `npd-title` `<input>` | `<n>/60（超過為 long-title soft warning，不擋 export）` | `paintCounter` 套 `#856404`（暖黃，warning）；不擋 export |
| `npd-count-description` | `npd-description` `<textarea maxlength="160">` | `<n>/160（超過為 long-description soft warning）` | 同上；不擋 export |
| `npd-count-search-description` | `npd-search-description` `<textarea>` | `（目前 <n> 字）` | 無 limit；恆顯灰 |
| `npd-count-cover-alt` | `npd-cover-alt` `<input>` | `（目前 <n> 字）` | 無 limit；恆顯灰 |

`paintCounter`（line 3831）邏輯：

```javascript
function paintCounter(el, value, limit) {
  if (!el) return;
  el.textContent = String(value);
  el.style.color = (typeof limit === 'number' && value > limit) ? '#856404' : '#555';
}
```

兩個帶 limit 的 counter（title 60 / description 160）會在 over-limit 時切
warning 色（`#856404`，暖黃）；無 limit 的兩個 counter 永遠維持 `#555`。
**不**擋 Copy markdown / Download / Copy target path 按鈕的 enable/disable —
此三鈕只依 `isExportReady`（title + slug + date）gating。

### 4.3 recompute wiring

`recompute()`（line 3931）末段順序：

```text
3998   renderReadyPreflight(analyzeReadyGap(input));
4001   renderRegistryHints(analyzeRegistryHints(input, REGISTRY_SNAPSHOT));
4005   renderExportSummary(buildExportSummary(input));
```

故所有 input 變動（site / contentKind / primaryPlatform / title / slug /
date / category / tags / description / searchDescription / cover / coverAlt
/ body）皆同時觸發：
- Markdown preview 重 render
- Filename 預覽
- Target path 預覽
- Copy / Download / Copy path 按鈕 enable/disable
- Status 文字（missing reason）
- Ready preflight panel（blocking / warnings / unsupported / registry hints）
- Registry hint row
- **Summary strip + per-field counters（本切片新增）**

### 4.4 status / draft 永為 literal 'draft' / true

- Summary strip badge：line 1817 寫死 `<span class="badge b-draft">draft</span>`。
- 客戶端 `buildExportSummary`（line 3772 ~ 3783）回傳 `status: 'draft'`，
  `draft: true`，與 input 完全無關。
- 服務端 `buildExportSummary`（`src/scripts/admin-markdown-export.js`
  line 363 ~ 364）相同寫死。
- Smoke case 83 / 85 鎖死此 invariant：「regardless of input」。

### 4.5 ready / missing 隨必要欄位即時更新

`isExportReady(title, slug, date)`（line 3568）回傳 `{ ok, missing }`。
`renderExportSummary`（line 3820）：

- `ok=true` → badge 改 `export ok` + class `b-ready`
- `ok=false` → badge 改 `missing title / slug` 等 + class `b-draft`

Summary strip 的 `npd-summary-ready` 與表單下方的 `npd-status` 文字共用
**同一個 `isExportReady` source of truth**（也與 `analyzeReadyGap` 的
blocking 維度對齊），所以三處不會打架。

### 4.6 registry hints 仍正常顯示

`renderRegistryHints` 仍在 line 4001 被呼叫；`#npd-ready-registry-hints` 元素
仍在 line 2085；本切片**未改動** registry hints 任何行為。

### 4.7 Tag 輸入 / tag count 合理性

`normalizeTags`（line 3509 客戶端 / `normalizeTagsInput` 服務端）規則：

- 以 `,` split
- 各 token 去 leading/trailing whitespace
- 空 token 跳過
- 重複 token 去除（first-write-wins）

Smoke case 86「tag counter dedupes / trims」鎖死此規則；server-side drive
範例第 3 組（"a, b, a, c"）→ `counts.tags=3`，與規則一致。

`#npd-summary-tagcount` 顯示 `counts.tags`（line 3829），即時跟著 input 變動。

### 4.8 Over-limit 視覺處理

- title > 60：counter 數字轉 `#856404`（warning 暖黃）；**未**對 input 框
  本身加 outline / border 色；**未**對 summary strip 任何欄位加 warning 視覺。
- description > 160：同上。

**觀察缺口**（見 §6）：目前 over-limit 視覺只發生在 counter 數字本身，
若使用者沒注意到 counter，可能會錯過 warning。

---

## 5. Server-side helper drive — concrete shapes

以 node ESM 直接 import `buildExportSummary` 並餵 5 組輸入，記錄具體輸出
（**未** 寫入任何檔案；純 read-only 觀察）：

### 5.1 empty form

```json
{
  "site":"github","contentKind":"tech-note","slug":"","filename":"",
  "targetPath":"","status":"draft","draft":true,
  "ready":{"ok":false,"missing":["title","slug","date"]},
  "counts":{"title":0,"description":0,"searchDescription":0,"coverAlt":0,"tags":0},
  "limits":{"titleMax":60,"descriptionMax":160}
}
```

→ Summary strip 對應：slug `（未填 / 不合法）` 紅、filename `（待 date + slug）`
紅、target fallback `content/github/posts/`、ready badge `missing title / slug
/ date`、tagcount `0`。

### 5.2 over-limit title + good slug/date

`{ title: 'x'.repeat(80), slug: 'my-post', date: '2026-06-27' }`

```json
{
  "site":"github","contentKind":"tech-note","slug":"my-post",
  "filename":"2026-06-27-my-post.md",
  "targetPath":"content/github/posts/2026-06-27-my-post.md",
  "status":"draft","draft":true,
  "ready":{"ok":true,"missing":[]},
  "counts":{"title":80,"description":0,"searchDescription":0,"coverAlt":0,"tags":0},
  "limits":{"titleMax":60,"descriptionMax":160}
}
```

→ `ready.ok=true`（title >60 不擋 export，只是 soft warning），counter
`80/60` 會被 `paintCounter` 套 `#856404`；按鈕全 enabled。

### 5.3 happy github（tags 帶重複）

`{ site:'github', contentKind:'tech-note', title:'OK', slug:'ok-post',
date:'2026-06-27', description:'hi', searchDescription:'srch', coverAlt:'alt',
tags:'a, b, a, c' }`

```json
{
  "site":"github","contentKind":"tech-note","slug":"ok-post",
  "filename":"2026-06-27-ok-post.md",
  "targetPath":"content/github/posts/2026-06-27-ok-post.md",
  "status":"draft","draft":true,
  "ready":{"ok":true,"missing":[]},
  "counts":{"title":2,"description":2,"searchDescription":4,"coverAlt":3,"tags":3},
  "limits":{"titleMax":60,"descriptionMax":160}
}
```

→ `counts.tags=3`（"a" 重複被 dedupe）；strip 全 happy path。

### 5.4 blogger site + invalid slug

`{ site:'blogger', title:'T', slug:'BAD SLUG', date:'2026-06-27' }`

```json
{
  "site":"blogger","contentKind":"tech-note","slug":"",
  "filename":"","targetPath":"",
  "status":"draft","draft":true,
  "ready":{"ok":false,"missing":["slug"]},
  "counts":{"title":1,"description":0,"searchDescription":0,"coverAlt":0,"tags":0},
  "limits":{"titleMax":60,"descriptionMax":160}
}
```

→ `slug=""`（含空白不合法）；`targetPath=""`；strip 顯示 `（未填 / 不合法）`
紅；ready badge `missing slug`；button 全 disabled。

### 5.5 invalid site enum + null tags

`{ site:'mars', tags:null }`

```json
{
  "site":"github","contentKind":"tech-note","slug":"",
  "filename":"","targetPath":"",
  "status":"draft","draft":true,
  "ready":{"ok":false,"missing":["title","slug","date"]},
  "counts":{"title":0,"description":0,"searchDescription":0,"coverAlt":0,"tags":0},
  "limits":{"titleMax":60,"descriptionMax":160}
}
```

→ `pickEnum('mars', ..., 'github')` fallback 至 `github`；`null` tags 安全
（smoke 84 / 86 鎖）；不丟 exception。

---

## 6. Issues / observations

### 6.1 已 confirm 之正向行為

- ✅ Summary strip 7 個 hook 全在 source
- ✅ 4 個 counter hook 全在 source
- ✅ `recompute()` 末段確實掛 `renderExportSummary(buildExportSummary(input))`
- ✅ status / draft 永為 literal `'draft'` / `true`（client + server 雙鎖）
- ✅ ready badge 與 `npd-status` 共用 `isExportReady`，不會打架
- ✅ tag count dedupes / trims，與 `normalizeTags` 規則一致
- ✅ over-limit title / description 數字會切 warning 色（`#856404`）
- ✅ registry hints 仍掛 `recompute()`，未被本切片動到

### 6.2 觀察到的 UI 缺口（**不**自行修，僅記錄）

| 缺口 | 嚴重度 | 建議 |
| --- | --- | --- |
| over-limit 視覺只在 counter 數字本身上色，input 框 / summary strip 並未同步加 warning 提示。使用者若 focus 在 input 框上可能錯過 counter | 低 | 不修；不擋 export，符合 soft warning 設計；若未來想強化，建議在 input 框加 `border-color` 或 summary strip 加 `title-over-limit` warning 標籤 |
| `npd-summary-target` 顯示「`targetFolder` fallback」（slug/date 不合法時），文字無明顯提示這是 fallback；與 `npd-target-path` 區塊的「（請補上合法 title / slug / date）」說法不一致 | 低 | 不修；兩個區塊用途不同（strip 是 digest、import flow 是 step-by-step），但可在 strip 加類似 `（待 date + slug）` 提示一致化 |
| Summary strip `status:` 部分沒給 DOM id，故無法被 client JS 改寫 — 這實際是設計意圖（hard-wired draft），但對 source-level reader 可能看起來像「漏寫 hook」 | 資訊 | 不修；此即「永遠 draft」之 UI invariant 表現 |
| `.cache/pages/admin/` 仍為 13:50 stale cache（早於本 commit 15:37），dev server 在 Dean 端執行時需先跑一次 `npm run dev`（含 predev = `build-github.js --mode=dev`）才會 render 出本切片新元素 | 資訊 | Dean 之後手動跑即可；本切片不主動跑 build |
| 本評估**未** capture browser screenshot；evidence 為 source-level + helper drive 等價 | 紅線範圍 | Dean 想要 visual 確認時，請手動跑 `npm run dev` → open `http://localhost:5173/admin/#new-post-draft` → 截圖；本 session 不主動執行 |

### 6.3 沒看到的問題（明確排除）

- ❌ source 內**沒看到** `fetch(` / `fs.writeFile` / `Apply` / backend write
  path 之痕跡（本切片新增 helper 純讀寫 DOM、不通網路、不碰 fs）
- ❌ source 內**沒看到** `status: 'ready'` / `draft: false` 之輸出路徑
- ❌ source 內**沒看到** 本切片動到 `content/` / `dist/` / `dist-blogger/` /
  `dist-promotion/` / Blogger / Drive / Form API

---

## 7. Red lines untouched

| 紅線 | 本 session 狀態 |
| --- | --- |
| Admin Apply / middleware / `admin-write-cli` | ✅ dormant，未啟用 |
| Repo fs write | ✅ 0；僅新增 1 docs file |
| `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap` | ✅ 未跑（一度被 harness deny 後即停止嘗試）|
| `preview` / `gh-pages` / deploy | ✅ 未碰 |
| Blogger live / Google Form / Drive / GA4 / AdSense / Search Console 後台 | ✅ 未動 |
| `src/` / `content/` / `content/settings/` / `package.json` / `package-lock.json` | ✅ 0 mod |
| `CLAUDE.md` / `MEMORY.md` | ✅ 0 mod |
| LearnOops / 能歐普斯 / 星艦宇宙快遞 | ✅ 完全 out of scope，0 touch |
| AdSense `client id` / `slot id` / 完整 GA4 measurement id | ✅ 未引用，未洩漏 |
| Phase 1 final freeze | ✅ idle freeze 維持 |

---

## 8. Smoke regression

`node src/scripts/check-admin-markdown-export.js`：

```
PASS  76 buildExportSummary happy → shape + values
PASS  77 buildExportSummary counts match trimmed input lengths
PASS  78 buildExportSummary limits mirror READY_MAX_* constants
PASS  79 buildExportSummary invalid slug → slug empty, filename empty, targetPath empty
PASS  80 buildExportSummary invalid date → filename empty, targetPath empty, status still draft
PASS  81 buildExportSummary site=blogger → blogger folder + path
PASS  82 buildExportSummary invalid site / contentKind fall back
PASS  83 buildExportSummary status / draft always literal regardless of input
PASS  84 buildExportSummary null / undefined input does not throw + defaults stable
PASS  85 buildExportSummary does not alter buildPostMarkdown output
PASS  86 buildExportSummary tag counter dedupes / trims (matches normalizeTags rule)

86 / 86 PASS
```

匹配 CLAUDE.md `check:admin-markdown-export` baseline（由 52/52 → 86/86，已
被 commit `cdf521f` 升級；CLAUDE.md §3a snapshot 仍寫 52/52，待下次 memory
sync phase 處理，**本切片不動 CLAUDE.md**）。

---

## 9. Final status

- 本切片新增檔案：`docs/20260627-admin-ui-draft-markdown-output-browser-smoke-evidence-a.md`（本檔）
- 修改檔案：0
- 刪除檔案：0
- Smoke regression：86/86 PASS
- Source-level inventory：7 summary hooks + 4 counter hooks + 1 client mirror
  + 1 server helper 全到位
- Helper drive：5 case 均符合預期 invariants
- Red lines：全部維持，無觸碰
- 本 session 屬 docs-only smoke evidence；Phase 1 Admin UI / Markdown draft
  export MVP 維持 idle freeze

---

## 10. Next recommended small slice

每項都須獨立 phase + user explicit approval；本切片**不**主動推進。

| 候選 | 形式 | 估計範疇 |
| --- | --- | --- |
| **B1**：Dean 手動跑 `npm run dev` 在實際 browser 截圖 1 ~ 3 張關鍵畫面（empty form / over-limit title / happy github），附入本 evidence | docs-only +1 圖檔 | 極小；Dean 端手動操作；Claude 端只負責新增 docs |
| **B2**：CLAUDE.md §3a snapshot 微 sync，將 `check:admin-markdown-export` baseline 從 `52/52` 校正為 `86/86`（memory-sync-only phase） | CLAUDE.md 1 行 | 極小；docs-only |
| **B3**：把 over-limit input 框本身加 `border-color`（讓使用者在 focus input 時也看得到 warning） | source 改 1 行 CSS + 1 處 JS | 小；須 explicit approval；本切片觀察到的低嚴重度缺口 |
| **B4**：`npd-summary-target` 在 fallback 至 folder 時加「`（待 date + slug）`」一致提示 | source 改 1 處 render 條件 | 小；觀察到的低嚴重度缺口 |
| **B5**：browser smoke 用 Playwright headless 取代手動截圖（dev-only test）| 新增 1 個 npm devDep + 1 個 spec | 中；須 explicit approval；可能引入新工具 |

預設 = 保守路徑：idle freeze；不主動執行 B1–B5。
