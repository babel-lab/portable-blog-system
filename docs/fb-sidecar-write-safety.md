# FB Sidecar Write Safety Plan

本文件為 **Phase FB-P5-c** 真實寫入 `.fb.md` 前之**安全規範與防護機制**。屬純 docs / 規劃性文件；**本批不修改 source / loader / Admin UI / write flow / .fb.md 實際資料**。實作必須等本 safety doc 完成且 user 批准後另開 FB-P5-c phase。

對應上層文件：
- `docs/fb-sidecar-metadata-pre-analysis.md`（FB-P4 pre-analysis；含 FB-P5 拆批藍圖）
- `docs/fb-sidecar-schema.md`（`.fb.md` 既有 schema；SEO-2-c 收編欄位）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + B+D+E+F 策略；本 doc 之策略繼承來源）
- `docs/admin-1-completion-report.md`（Admin-1 read-only 邊界政策）
- `CLAUDE.md` §29（第一版不做清單；FB API / 自動社群發文）

---

## §1 背景與範圍

### 1.1 FB-P5-c 之風險地形

FB-P5-c 為 FB 系列**第一個真實 write batch**；屬高風險：

- 直接修改 `.fb.md` source 檔；錯誤寫入難 rollback（除非 git restore）
- YAML frontmatter 易壞（單一 quote / indent / colon 之 syntax error 即破壞整 sidecar）
- Admin / browser 之 form input 未經嚴格驗證即寫入會放大風險（如 XSS-like 值 / non-UTF-8 / 異常 newline）
- 若 path traversal 漏洞存在，可能波及 .md / .publish.json / 系統檔案

本 safety doc 之目標：**寫入前先把所有 guard / strategy / rollback path 文件化**；user 與 implementor 在 P5-c 啟動前對齊安全邊界。

### 1.2 本批範圍

- 寫入範圍邊界（哪些檔案可寫 / 哪些禁止）
- 寫入前 guard checklist
- YAML frontmatter preservation 策略
- 寫入策略（B+D+E+F；繼承 admin-2-a §6）
- pre-write / post-write validation
- rollback 流程
- Admin API 安全設計（dev-only / local-only / CSRF 注意）
- 欄位白名單
- 測試案例
- 結論：P5-c 啟動前置

### 1.3 不在本批

- 任何 source / loader / Admin UI / write flow / .fb.md 實際資料 修改
- 跑 build / 新增 fixtures / 動 validator
- 啟動 FB-P5-c
- 接 FB API

---

## §2 FB-P5-c 寫入範圍邊界

### 2.1 允許寫入

| 範疇 | 路徑 | 條件 |
|---|---|---|
| `.fb.md` sidecar | `content/{github,blogger}/posts/{YYYYMMDD-slug}.fb.md` | 必須對應 Admin loaded post 之 sourcePath；必須以 `.fb.md` 結尾 |

**僅此一類**。

### 2.2 禁止寫入（即使 Admin user 要求）

| 範疇 | 路徑 pattern | 禁止理由 |
|---|---|---|
| 主文章 `.md` | `content/{github,blogger}/posts/{...}.md`（不含 `.fb.md`） | 屬主文章；FB sidecar write 不應觸及主文章 metadata |
| publish sidecar | `content/{github,blogger}/posts/{...}.publish.json` | 屬 publish bundle；應由 `npm run backfill:url` 等專屬 CLI 操作；不屬 FB scope |
| validation fixtures | `content/validation-fixtures/**` | 屬 validate 內部 fixtures；非作者內容；不應被 Admin write |
| 主文章 pages | `content/{github,blogger}/pages/**` | 屬 page 範疇；非 post sidecar；獨立批次處理 |
| settings | `content/settings/**` | 屬全站 config；本 phase 不允許 |
| dist | `dist/**` / `dist-blogger/**` | 屬 build artifact；不可 source-level write |
| source code | `src/**` | 屬 codebase；只能 IDE + git 編輯 |
| docs | `docs/**` | 屬人類維護文件；Admin 不應自動 mutate |
| git metadata | `.git/**` | 屬 git internal |
| deploy repo | `D:\github\blog-new\portable-blog-deploy\**` | per `admin-local-boundary` §3 / Phase 10 部署設計 |
| symlinks / network paths | any | 不解析 symlink；不允許 UNC / network share path |

### 2.3 path 解析嚴格規則

P5-c 寫入前必須：

- **不接受任意 path from client**：Admin UI（browser）傳給後端 handler 之識別子**只應為 post slug / post id**，不應為 file path
- **server 端反查 sidecar path**：handler 接到 post slug 後，從 Admin loaded posts 之 `sourcePath` 反推 `.fb.md` path（如 `sourcePath.replace(/\.md$/, '.fb.md')`）
- **path normalize + canonicalize**：`path.resolve()` + `path.normalize()` 比對 PROJECT_ROOT prefix；任何超出 PROJECT_ROOT 之 path 一律拒絕

---

## §3 寫入前 guard checklist

實作時 P5-c 之 write handler 必須**依序通過**以下 guard，任何一條失敗 → 拒絕寫入並回報 user：

### 3.1 必須通過之 11 項 guard

| # | Guard | 失敗回應 |
|---|---|---|
| 1 | `git status` **必須 clean**（無 untracked / modified 檔案於 `content/` / `src/` / `docs/`）；或顯示既有 dirty 清單讓 user 明確確認「我已備份，要繼續」 | 拒絕 / 顯示 dirty list 要求確認 |
| 2 | Target path 必須**以 `.fb.md` 結尾**（per `endsWith('.fb.md')` 而非 includes） | 拒絕；log 違規 |
| 3 | Target path resolve 後必須**落在允許資料夾**（`content/github/posts/` 或 `content/blogger/posts/`） | 拒絕 |
| 4 | Target path 不可含 `..`（path traversal）；不可含 null byte（`\0`） | 拒絕；log 違規 |
| 5 | Target post slug 必須**存在於 Admin 當前 loaded posts**（mutex with `loadAdminPosts()` 之 cache） | 拒絕；提示 user reload Admin |
| 6 | Target post 之 sourcePath 反推之 `.fb.md` 必須與 client 傳之 slug 一致（雙向 verify） | 拒絕；防止 ID/path mismatch |
| 7 | Target 檔若已存在，必須**可讀**（`fs.access(R)`）；不可讀則拒絕 | 拒絕 |
| 8 | Target 之既有 YAML frontmatter 必須**可被 gray-matter parse**（解析失敗 → 該 sidecar 已壞；拒絕寫入避免覆蓋未知狀態） | 拒絕；建議 user 手動修復後重試 |
| 9 | 新值 fields 必須**全部在白名單**（per §8 之 12 個 editable 欄位） | 拒絕；列違規欄位 |
| 10 | 新值 fields 必須通過 **inline schema validation**（type / format；per §5.1） | 拒絕；inline error |
| 11 | 用戶必須**明示 confirm**（"Apply Changes" button click + dry-run preview 已展示） | 拒絕；要求先 preview diff |

### 3.2 server 端 path 反查（推薦實作 pseudo-code）

```js
function resolveFbSidecarPath(slug, postLoader) {
  const posts = postLoader.cache;
  const post = posts.find(p => p.slug === slug);
  if (!post) throw new Error('slug not in loaded posts');
  // 從 .md 反推 .fb.md（同目錄；副檔名替換）
  const fbPath = post.sourcePath.replace(/\.md$/, '.fb.md');
  // canonicalize
  const resolved = path.resolve(fbPath);
  // 必須落在 PROJECT_ROOT
  if (!resolved.startsWith(PROJECT_ROOT + path.sep)) throw new Error('out of root');
  // 必須以 .fb.md 結尾
  if (!resolved.endsWith('.fb.md')) throw new Error('not .fb.md');
  // 必須落在允許資料夾
  const allowedPrefixes = [
    path.resolve(PROJECT_ROOT, 'content/github/posts') + path.sep,
    path.resolve(PROJECT_ROOT, 'content/blogger/posts') + path.sep,
  ];
  if (!allowedPrefixes.some(p => resolved.startsWith(p))) throw new Error('not in allowed folder');
  return resolved;
}
```

---

## §4 YAML frontmatter preservation 策略

### 4.1 核心原則

寫入 `.fb.md` 不應破壞既有結構：

- **保留既有 body**（frontmatter 之後的 markdown 內容）— 完全不動
- **保留未知欄位**（schema 未列但作者手動加之欄位）— 例如 `finalUrl` 之 schema drift 期間
- **只更新白名單欄位**（per §8 之 12 個）；其他欄位之值 / 順序 / comments 保留
- **欄位排序**：理想保留既有檔案內順序；若新加欄位，按 schema convention 順序追加

### 4.2 推薦實作策略

**不從 scratch 重寫 frontmatter**（會丟 comments / 改順序）。改採 **selective update** 策略：

1. `fs.readFile(target)` → 原 raw text
2. gray-matter parse → `{ data, content }`（data = frontmatter object；content = body）
3. **不取代 data**；只**選擇性 mutate 白名單欄位**：
   ```js
   for (const field of WHITELIST_FIELDS) {
     if (newValues[field] !== undefined) data[field] = newValues[field];
   }
   ```
4. gray-matter stringify → 重組 frontmatter + body
5. `fs.writeFile(target.tmp)` + `fs.rename(target.tmp, target)`

注意：gray-matter `stringify` 之 YAML serializer 可能改 quote style / key order。為更穩定可考慮：

- **A.** 接受 gray-matter 之 stringify 預設輸出（最簡；可能有 cosmetic diff）
- **B.** 自製 minimal YAML serializer 對白名單欄位逐行替換 raw text（精準保留；但實作複雜）

**P5-c 推薦採方案 A**；如 user 對 cosmetic diff 敏感再考慮 B。

### 4.3 各欄位 YAML 寫法建議

| 欄位 | 型別 | YAML 寫法 | 空值處理 |
|---|---|---|---|
| `enabled` | boolean | `enabled: true` / `enabled: false`（裸 boolean；不加 quote） | 必填；無「空值」概念 |
| `status` | string | `status: "ready"`（含 quote） | 空時 `status: ""` 保留欄位；或省略整 key |
| `postUrl` | string (URL) | `postUrl: "https://www.facebook.com/..."` | 同上 |
| `postedAt` | string (date) | `postedAt: "2026-05-20T20:30:00+08:00"`（ISO 8601）或 `"YYYY-MM-DD HH:mm"`；**canonical 留 P5-d-2 決議** | 同上 |
| `postId` | string | `postId: ""` | 同上 |
| `campaign` | string | `campaign: "book-review-2026q2"` | 同上 |
| `audience` | string | `audience: "creators"` | 同上 |
| `title` | string | `title: "..."` | 同上 |
| `titleEn` | string | `titleEn: "..."` | 同上 |
| `hashtags` | array of string | block style：`hashtags:\n  - "#書評"\n  - "#AI"`；空 array：`hashtags: []` | 空陣列保留；不省略 key |
| `imageUrl` | string (URL) | `imageUrl: "https://..."` | 同 string 空值 |
| `note` | string (multi-line possible) | 短：`note: "..."`；長：multi-line block style `note: \|\n  ...` | 同 string 空值 |

### 4.4 空值欄位保留 vs 省略

**P5-c 推薦：空值 string 欄位保留 key 但用 `""`**；理由：

- 讀者（含 validator）一眼看出此欄位「已知；當前空」vs 「未定義」
- 與 P4 pre-analysis §5 之範例一致
- `enabled` 必保留；`hashtags: []` 必保留；其餘 string 空值用 `""`

例外：若 user 主動清空（如把既有 postUrl 刪空），則保留 `postUrl: ""` 而非刪除整 key（紀錄「曾有但已撤銷」之語意）。

---

## §5 寫入策略（B+D+E+F；繼承 admin-2-a §6.7）

### 5.1 採 4 種策略組合

| Strategy | 內容 |
|---|---|
| **B: temp file + atomic rename** | 寫入 `{file}.tmp` → `fs.rename({file}.tmp, {file})`（OS-level atomic）；失敗 → `fs.unlink({file}.tmp)` |
| **D: dry-run default + explicit "Apply"** | Admin UI 預設只顯示 diff（per FB-P5-b 已落地之 dry-run editor）；user 必須明示 "Apply Changes"（FB-P5-c 才實作此 button）才寫入 |
| **E: pre-write inline schema validation** | type check / format check（per §5.2）；失敗 → 顯示 inline error；不寫入 |
| **F: post-write validate:content** | 寫入後 spawn `npm run validate:content`；baseline 退步 → 顯示 warning + rollback 提示 |

### 5.2 pre-write inline validation（白名單欄位）

| 欄位 | 驗證 |
|---|---|
| `enabled` | 必為 boolean；非 boolean → error |
| `status` | 必為 string；建議 enum check（`draft` / `ready` / `posted` / `archived`；未列值 → warning） |
| `postUrl` | 非空時必為 `http(s)://` 開頭；建議 host = facebook.com / fb.com（非此 host → warning） |
| `postedAt` | 非空時必可被 `Date.parse()` 解析；建議 ISO 8601 / `YYYY-MM-DD HH:mm`（其他 → warning） |
| `postId` | 必為 string；不強制格式 |
| `campaign` | 必為 string；不強制格式 |
| `audience` | 必為 string；不強制格式 |
| `title` / `titleEn` | 必為 string；不強制長度（建議 <= 200 chars 否則 warning） |
| `hashtags` | 必為 array；元素必為 string；非 string element → 過濾 + warning |
| `imageUrl` | 非空時必為 `http(s)://` 開頭 |
| `note` | 必為 string；不強制長度 |

### 5.3 post-write validation

- 寫入完成後 spawn `node src/scripts/validate-content.js`（非同步；不阻塞 UI）
- 比對 baseline（當前 `0/38/33`）；若 warning count 增加 → 顯示「⚠️ 寫入後 validate baseline 變化」+ 提供 rollback button
- 顯示 `git diff content/{site}/posts/{slug}.fb.md` 內容供 user 確認

---

## §6 pre-write / post-write validation 完整清單

### 6.1 Pre-write checklist

- [ ] git status check（per §3 guard #1）
- [ ] path resolution + 後綴 + 資料夾白名單（per §3 guard #2-#6）
- [ ] target 檔存在性 + 可讀性 + frontmatter parseable（per §3 guard #7-#8）
- [ ] fields 在白名單（per §3 guard #9 + §8）
- [ ] fields 通過 inline schema validation（per §3 guard #10 + §5.2）
- [ ] user 明示 confirm + dry-run preview 已展示（per §3 guard #11）

### 6.2 Write atomicity

- `fs.writeFile({file}.tmp, newContent, { encoding: 'utf-8' })`（顯式 UTF-8）
- 確認 `{file}.tmp` 寫入成功（檢查 `fs.stat`）
- `fs.rename({file}.tmp, {file})`（OS-level atomic）
- 失敗時 `fs.unlink({file}.tmp)` 並 throw

### 6.3 Post-write checklist

- [ ] atomic rename 完成（`{file}.tmp` 已不存在）
- [ ] 寫入後檔可重新 gray-matter parse（確認 YAML 未壞）
- [ ] `git status` 顯示**只有本批預期之 `.fb.md` 變動**（無誤動其他檔）
- [ ] `git diff content/{site}/posts/{slug}.fb.md` 內容預期（per §6.4 grep）
- [ ] `npm run validate:content` baseline 未退步（per §5.3）
- [ ] dist / sitemap / nav / admin isolation 不受影響（per Admin-1 邊界）
- [ ] 顯示 git commit 提示（per admin-2-a §6.8 「Admin 不自動 git add/commit」原則）

### 6.4 寫入後驗證 grep（建議）

```bash
git diff --stat content/**/*.fb.md        # 只應顯示目標檔
git diff content/{site}/posts/{slug}.fb.md  # 內容 diff
git status --short                         # 確認無其他誤動
npm run validate:content                   # baseline 確認
```

### 6.5 失敗 rollback 流程（per §7）

---

## §7 Rollback 流程

### 7.1 Rollback level 分級

| Level | 場景 | 命令 / 流程 |
|---|---|---|
| **L1：尚未 commit** | working tree 有改動但 user 尚未 git add | `git restore content/{site}/posts/{slug}.fb.md`（單檔） |
| **L2：尚未 commit，多檔誤動** | working tree 有多個誤改 | `git restore content/blogger/posts/` 或 `git restore content/github/posts/`（資料夾級） |
| **L3：已 commit 但尚未 push** | 已 commit；可 reset / revert | `git revert <commit>`（推薦；保留 commit history）或 `git reset --soft HEAD~1`（取消 commit 但保留改動）|
| **L4：已 push** | 已 push 至 remote | `git revert <commit>` + 重 push（不可 force push 至 main） |

### 7.2 嚴格禁止之 rollback 操作

- ❌ **`rm -rf`** — 不可用 rm 處理 git-tracked 檔案
- ❌ **手動編輯回原狀** — 易有 cosmetic 差異；應用 git restore
- ❌ **`git reset --hard`** — 會丟失 unrelated working tree 改動；危險
- ❌ **`git push --force` 至 main** — 永禁

### 7.3 Rollback 自動化建議（P5-c 實作）

Admin UI 寫入後顯示「Rollback last write」button：

- **Option A（推薦）**：spawn `git restore <file>` CLI；顯示結果
- **Option B（保守）**：不 spawn git；改顯示 manual command 之 copy-pasteable 字串：「請於 terminal 跑：`git restore content/blogger/posts/we-media-myself2.fb.md`」

P5-c 推薦 Option B；屬「明示 + 不自動 spawn」較保守；spec 之 admin-2-a §8.7 已標 Option A 為 narrow exception。

---

## §8 欄位白名單

### 8.1 允許更新（12 個）

| 欄位 | 型別 | 對應 FB-P5-b dry-run editor 之 form row |
|---|---|---|
| `enabled` | boolean | ✅ |
| `status` | string | ✅ |
| `postUrl` | string | ✅ |
| `postedAt` | string | ✅ |
| `postId` | string | ✅ |
| `campaign` | string | ✅ |
| `audience` | string | ✅ |
| `title` | string | ✅ |
| `titleEn` | string | ✅ |
| `hashtags` | array of string | ✅ |
| `imageUrl` | string | ✅ |
| `note` | string | ✅ |

### 8.2 禁止更新（4 個既有 + 1 個 schema drift）

| 欄位 | 禁止理由 |
|---|---|
| `page` | 屬 promotion config 之 page key 引用；改值會影響 build-promotion 之 page mapping；應另開 phase 處理 |
| `target` | enum（`auto` / `blogger` / `github` / `canonical` / `custom`）；屬 URL 解析邏輯；改錯破壞 placeholder 解析 |
| `customUrl` | 屬 target=custom 時之 URL；與 target 耦合；應整批處理 |
| `finalUrl` | 屬 schema drift 收編欄位（per `docs/fb-sidecar-schema.md` §3.5.2）；與 placeholder 之優先序未定；應留至 placeholder/finalUrl 整合 phase |
| **body**（frontmatter 後內文） | 屬 FB 貼文內容；長文字編輯應由 VS Code 處理；非 form-friendly；另開 phase |

### 8.3 為何 page / target / finalUrl 不入白名單

- `page` 改錯 → build-promotion 無法找到對應粉專；多文章受影響
- `target` 改錯 → placeholder `{{ articleUrl }}` 解析失敗；FB 貼文連結錯
- `finalUrl` 屬 schema drift / placeholder 互動範疇；需專屬 batch 設計

---

## §9 Admin API 安全設計（只分析；P5-c 才實作）

### 9.1 部署模式必為 local-only / dev-only

- ❌ **不**在 GitHub Pages 線上版暴露寫入 API（GitHub Pages 為靜態托管；本身無 server runtime；天然安全）
- ❌ **不**支援 production build 之 write route（per Admin-1-b 之 `--mode=build` 早期 cleanup 機制）
- ✅ 寫入功能**只能在本機 source repo `npm run dev` 模式使用**
- ✅ vite dev server 預設 bind `localhost`；不應 expose external network（本專案 vite.config.js 設 `host: '0.0.0.0'` ⚠️ 屬 LAN 暴露；P5-c 啟動前需 user 評估是否限制 `host: 'localhost'`）

### 9.2 Endpoint 設計建議

- Endpoint name：`/admin/api/fb-write`（明確標識 Admin + scope）
- HTTP method：`POST`
- request body：`{ slug: string, fields: { whitelisted_fields_only } }`（**不**接受 path）
- response：`{ ok: boolean, diff: string, validate: object, error?: string }`
- server-side ensure：
  - dev-mode-only 註冊（prod / build mode 不註冊此 endpoint）
  - 拒絕來自非 localhost 之 request（檢 `req.ip === '127.0.0.1' || '::1'`）
  - CSRF token（簡單即可；dev 環境 token 從頁面 `<meta name="csrf">` 取）

### 9.3 不應做的設計

- ❌ 接受 client path（任意 file path 注入）
- ❌ 接受 unwrapped object spread 到 frontmatter（容易引入非白名單欄位）
- ❌ 跑 `eval` / `Function` 動態執行字串
- ❌ 在 GitHub Pages production HTML 含 admin route 之 reference
- ❌ 把 write 功能放在 build:github 之 prebuild 階段（屬 build pipeline；不應有 write 副作用）

---

## §10 測試案例

### 10.1 Happy path

| # | 案例 | 預期 |
|---|---|---|
| 1 | 新增 postUrl（empty → `https://www.facebook.com/...`） | atomic 寫入；validate baseline 不退步；git diff 顯示 +1 line |
| 2 | 修改 postedAt（`2026-05-20T20:30:00+08:00`） | 同上 |
| 3 | hashtags array 新增 `["#新主題"]` | YAML block style 寫入；validate OK |
| 4 | empty note 設定 | `note: ""` 保留 key；validate OK |
| 5 | enabled false | boolean `false` 寫入；validate OK；FB build 端不再產出 dist-promotion/.../{slug}.txt |

### 10.2 Edge case / validation

| # | 案例 | 預期 |
|---|---|---|
| 6 | invalid URL（`postUrl: "not-a-url"`） | inline pre-write validate **warning**（不阻擋）或 **error**（阻擋）— 本 doc 建議 **warning**；P5-c 實作時對齊 validator 之既有 warning-only 慣例 |
| 7 | 目標 sidecar 不存在 | per §3 guard #7：拒絕；不自動建立（避免誤建 sidecar；建立 sidecar 屬「new sidecar」獨立場景；不在 P5-c scope） |
| 8 | sidecar 已有未知欄位（如 finalUrl）| YAML preservation 必保留未知欄位（per §4.1）；只動白名單 |
| 9 | 寫入錯 path（client 傳 slug = `../etc/passwd`） | per §3 guard #3-#5：拒絕；log 違規 |
| 10 | validate 失敗 rollback | 顯示「⚠️ baseline 退步」+ 提供 git restore 指令 |
| 11 | git status dirty | per §3 guard #1：拒絕 / 要求 user 明示 confirm |
| 12 | 同時編輯（user 手動編 + Admin write race condition） | git status check 偵測；拒絕；要求 user reload |
| 13 | YAML stringify cosmetic diff（key 順序變 / quote style 變） | 標 warning；建議 user check diff 後 commit；不阻擋 |
| 14 | atomic rename 失敗（磁碟滿） | `.tmp` 不污染既有檔；throw 顯示 error |
| 15 | UTF-8 encoding 一致性（含中文 hashtags） | 顯式 `{ encoding: 'utf-8' }` write；驗 round-trip parse 結果一致 |

---

## §11 風險點與緩解

| # | 風險 | 等級 | 緩解 |
|---|---|---|---|
| 1 | path traversal 寫入系統檔 | 🔴 高 | §3 guard #3-#5；server 端反查不信 client path |
| 2 | YAML frontmatter 壞掉 | 🔴 高 | §3 guard #8（pre-read parse）+ §5.1 strategy B（atomic rename；失敗 .tmp 不污染）+ §5.2 inline validate |
| 3 | 覆蓋主文章 .md | 🔴 高 | §3 guard #2（`.fb.md` 後綴強制） |
| 4 | git race condition（user 手動編 + Admin write） | 🟡 中 | §3 guard #1（git status check）+ guard #6（雙向 path verify） |
| 5 | localhost expose 至 LAN（vite host=0.0.0.0） | 🟡 中 | §9.1 提示；P5-c 實作前 user 評估改 host=localhost 或加 firewall |
| 6 | post-write validate 退步未察 | 🟡 中 | §5.3 post-write validate + UI 顯示 baseline 變化 + rollback button |
| 7 | YAML serializer cosmetic diff（gray-matter stringify）| 🟢 低 | §4.2 接受 default；告知 user 屬可接受變化 |
| 8 | UTF-8 / LF 編碼不一致（Windows CRLF） | 🟡 中 | §6.2 顯式 utf-8；考慮 normalize newline 為 `\n` |
| 9 | `git restore` rollback 失敗（git not in PATH） | 🟢 低 | §7.3 Option B：顯示 manual command 不 spawn |
| 10 | 多 FB 貼文 / multi-post array 未來 schema 變動 | 🟡 中 | §10.x 不在 P5-c scope；屬 FB-P6+ |

---

## §12 安全檢查清單

### 12.1 Pre-write checklist（P5-c handler 必跑）

- [ ] git status clean（或 dirty 已 user 明示 confirm）
- [ ] target path 通過 §3 之 11 guard
- [ ] fields 在白名單
- [ ] fields 通過 inline schema validation
- [ ] user 已 dry-run preview + Apply confirm

### 12.2 Post-write checklist

- [ ] atomic rename 完成；temp 已 removed
- [ ] target 檔可重新 gray-matter parse
- [ ] git status 顯示只有預期變動
- [ ] git diff 內容 user 已 visual confirm
- [ ] `npm run validate:content` baseline 不退步
- [ ] 顯示 git commit 提示
- [ ] 暴露 rollback button

### 12.3 Rollback checklist

- [ ] confirm rollback 操作
- [ ] 執行 `git restore <file>`（Option A）或顯示 manual command（Option B；推薦）
- [ ] verify 檔已還原至 commit 狀態
- [ ] verify Admin form 顯示之 current value 已同步（reload page）

---

## §13 結論

### 13.1 FB-P5-c 啟動前 6 項前置確認

1. ✅ 本 safety doc 文件化完成（本批 Phase 20260520-fb-p5-d-safety-doc）
2. ⏳ user 批准 §8 白名單 + §3 guard checklist + §5 寫入策略
3. ⏳ user 評估 §9.1 之 vite host 設定（`0.0.0.0` vs `localhost`）
4. ⏳ user 確認 §4.2 之 YAML serializer 策略（A 接受 cosmetic diff vs B 自製 line-precise）
5. ⏳ user 確認 §5.2 之 invalid URL 為 warning 還是 error
6. ⏳ user 確認 §7.3 之 rollback automation level（A spawn git vs B manual command；推薦 B）

### 13.2 P5-c 之保守實作建議

- **第一版只支援單一 `.fb.md` sidecar write**（per FB-P4 pre-analysis §9.4）
- **多 FB post array 不納入 P5-c**；留至 FB-P6 或更晚評估
- **不接 FB Graph API**（per CLAUDE.md §29；P6 才評估）
- **不擴大白名單**至 `page` / `target` / `finalUrl` / body（per §8.2）
- **dry-run default + Apply 明示 + git restore manual** 三層保守
- **接 post-write validate:content baseline check**；發現退步立即 alert

### 13.3 必須等 safety doc 完成後另開 phase

✅ **FB-P5-c 必須等本 safety doc commit 後 + user 明示批准方可啟動**；不可在本批同時實作。

---

## §14 本批不做事項

| # | 項目 | 狀態 |
|---|---|---|
| 1 | 不改 source（`src/**`）| ✅ |
| 2 | 不改 loader / Admin UI / validator | ✅ |
| 3 | 不改 build scripts / .fb.md 實際資料 | ✅ |
| 4 | 不改 content / fixtures / dist / deploy | ✅ |
| 5 | 不跑 npm run build | ✅ |
| 6 | 不啟動 FB-P5-c write | ✅ |
| 7 | 不接 FB API | ✅ |
| 8 | 不裁決 §4.2 YAML serializer 策略 | ✅（留 user 決） |
| 9 | 不裁決 §5.2 invalid URL severity | ✅（建議 warning） |
| 10 | 不裁決 §7.3 rollback automation level | ✅（推薦 Option B） |
| 11 | 不裁決 §9.1 vite host 設定 | ✅（提示 user） |
| 12 | 不 push | ✅ |

---

## §15 對既有系統之影響

| 維度 | 狀態 |
|---|---|
| `src/**` | ❌ 未動 |
| `content/**` | ❌ 未動 |
| `dist/**` / `dist-blogger/**` | ❌ 未動 |
| Deploy repo | ❌ 未動（HEAD 仍 `4ecd92d`）|
| GitHub Pages 線上 | ❌ 未動 |
| Blogger 後台 | ❌ 未動 |
| validate baseline `0/38/33` | ❌ 預期未動（純 docs 編輯）|
| Admin 既有 read-only + dry-run editor 功能 | ❌ 未動 |
| `.fb.md` 實際資料（4 個 .fb.md）| ❌ 未動 |

---

## §16 邊界聲明

- ✅ 本文件**僅為 FB-P5-c safety plan**；不改任何 source / loader / Admin UI / write flow / .fb.md 實際資料
- ✅ 本文件**不**啟動 FB-P5-c；P5-c 必須等本 doc commit 後 + user 明示批准
- ✅ 本文件**不**裁決 §13.1 之 6 項前置確認；屬 user 決策範圍
- ✅ 本文件**不**動 `.fb.md` schema 文件
- ✅ 本文件**不** push
- ✅ 對齊 `CLAUDE.md` §29「不接 FB API / 不自動社群發文」之預設邊界

---

## §17 Cross-links

- `docs/fb-sidecar-metadata-pre-analysis.md`（FB-P4 pre-analysis；§7 FB-P5 拆批藍圖；本 doc 為 FB-P5-d 章節之獨立 safety reference）
- `docs/fb-sidecar-schema.md`（`.fb.md` 既有 schema；SEO-2-c 收編欄位；本 doc §4 / §8 之白名單對應 schema §3.1）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write safety plan；本 doc §5 寫入策略 B+D+E+F 繼承來源；§6 / §10 reuse pattern）
- `docs/admin-1-completion-report.md`（Admin-1 read-only 邊界政策）
- `docs/admin-2b1-completion-report.md`（Admin-2-b-1 dry-run viewer pattern；FB-P5-b 之 mirror）
- FB 系列 commits：`bdf8fdf` SEO-2-c schema 收編 / `aa08e66` FB c-1 read-only / `be20dbd` c-3 disclaimer fix / `101c85d` c-4 completeness / `8416a2f` FB-P4 pre / `a8a094c` FB-P5-a polish / `a5a28b6` FB-P5-b dry-run editor
- `CLAUDE.md` §29（第一版不做清單）

---

（本文件結束）
