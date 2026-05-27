# Admin Write Infra Phase 4 — Vite Dev Middleware Pre-analysis (docs-only)

Phase: `20260528-admin-write-phase-4-middleware-preanalysis-docs-only-a`
Date: 2026-05-27 23:00 +0800（cold-start verify 於 2026-05-27 22:47 +0800）
Status: 🔄 docs-only pre-analysis；不啟動 source change；不啟用 actual write path；不解開 browser → Node fs 通道

本文件為 Admin Write Infra **Phase 4（Vite dev middleware / Admin write route）** 之**啟動前盤點 + 設計分析**；屬 `docs/admin-2-write-pre-analysis.md` §15.G phase 4 之 pre-analysis 階段。對齊 §15.D + §15.E + §15.G 既有設計；不重寫；不變更既有 phase 順序。

本文件**不**啟動 Phase 4 之 source change；實作留待 user 簽收方案後拆批落地（per §15）。本 phase 唯一 source 動作為新增本文件單檔；無其他 source / content / settings / templates / fixtures / dist / package / vite config 變動。

---

## §1 Phase metadata

| 項目 | 值 |
|---|---|
| Phase name | `20260528-admin-write-phase-4-middleware-preanalysis-docs-only-a` |
| Date | 2026-05-27 23:00 +0800 |
| Baseline HEAD | `e6d18551cb8961c03e51f9f8365f364ffbe30e11`（short `e6d1855`）|
| Latest subject | `docs(admin): record phase 3b dry-run UI checkpoint` |
| Branch | `main` tracking `origin/main`；ahead/behind `0/0`；working tree clean |
| `safe-write:test` baseline | `71 pass / 0 fail` |
| `validate:content` baseline | `0 errors / 42 warnings / 37 posts` |
| Trigger | night-12 read-only preanalysis Candidate A：user 簽收採用 |
| Purpose | 把 night-12 之 Vite dev middleware / Admin write route 設計，整理成正式可審查 docs-only 設計文件 |
| Scope | 新增單一 docs 檔；無 source change；無 content change；無 fixture change；無 dist / settings / template / package / vite config 變動 |
| Non-goals | 見 §16 |

### 1.1 Carried-in phase landings

| Phase | Status | Landed commit | Note |
|---|---|---|---|
| Phase 2（safe-write helper source）| ✅ | `5bcdd02` (2026-05-27 21:00) | 5 helpers + 1 CLI self-test + 1 npm script |
| Phase 3a docs preanalysis | ✅ | `a44e0c2` (2026-05-27) | `docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md` |
| Phase 3b dry-run UI source | ✅ | `efd3ac5` (2026-05-27 night-9) | +116 lines；EJS Apply disabled + validator preview + readiness checklist |
| Phase 3c docs checkpoint | ✅ | `e6d1855` (2026-05-27 night-11) | EOD report 補 phase 3b checkpoint |
| night-12 read-only preanalysis | ✅ | （無 commit；read-only chat output） | 比較 3 方案；user 採 Candidate A |

→ Phase 4 之 helper 基礎設施與 dry-run UI shell 全部就位；本 phase 評估如何**設計** browser → Node fs 通道之 middleware shape，但**不**實作。

---

## §2 Current baseline summary

### 2.1 Admin Phase 3b dry-run UI 狀態（per `efd3ac5`）

- `src/views/admin/index.ejs`（~1003+ LOC）：
  - SEO dry-run viewer（client-side diff；4 fields）+ FB sidecar dry-run editor（client-side simulation；12 fields）；皆 **client-side only**；無 fs.write；無 fetch
  - 4 個 SEO + 4 個 FB inline validator preview；server-side pre-computed by `load-admin-posts.js` → render 端純顯示
  - **Disabled** Apply button × 2（`.apply-disabled`；`disabled` + `aria-disabled` + cursor not-allowed）；無 click handler；無 fetch / XHR
  - Future write readiness checklist（4-row Phase 2 ✅ / Phase 3 ✅ / Phase 4 ⏸ / Phase 5 ⏸）
- `src/scripts/load-admin-posts.js`：import 5 validators → `toAdminView` pre-compute `seoValidation` + `fbValidation`；attach 至 return；不寫入；不 spawn

→ Admin UI 視覺上已呈現「可寫入」之 affordance，但 runtime 與 fs 之間**完全隔離**。

### 2.2 safe-write infra 狀態（per Phase 2 landing `5bcdd02`）

| 元件 | 檔案 | LOC | 角色 |
|---|---|---|---|
| safe-write helper | `src/scripts/safe-write.js` | 106 | whitelist → git-status (caller-supplied) → validators → tmp write → rename；失敗清 `.tmp`；不 spawn git |
| git status check | `src/scripts/git-status-check.js` | 66 | `spawn('git', ['status', '--porcelain'])`；5s timeout；4 graceful reason；不修改 git 狀態 |
| write target whitelist | `src/scripts/admin-write-whitelist.js` | 72 | 只允 `content/{github,blogger}/posts/*.{md,publish.json,fb.md}`；`..` / 跨 drive / 非 absolute / 非 4-part rel → 拒 |
| field validators | `src/scripts/admin-field-validators.js` | 94 | 8 個 validator + `LIMITS`（description 1000 / search 500 / titleEn 200 / cover 500 / coverAlt 500） |
| active source keys | `src/scripts/active-source-keys.js` | 33 | `buildActiveSourceKeySet(settings)` / `loadActiveSourceKeySet(projectRoot)` |
| CLI self-test | `src/scripts/safe-write-test.js` | — | `npm run safe-write:test`；71 cases |

→ Helper API 已 ready；**無** runtime caller 對 production content 寫入；待 Phase 5 接 middleware handler。

### 2.3 Vite config 現況

per `vite.config.js`（51 LOC）：

- 純 MPA config：`root: .cache/pages`；`publicDir: public`；`fs.allow: [PROJECT_ROOT]`
- `appType: 'mpa'`；`emptyOutDir: true`；`server: { open: true, fs: { allow: [PROJECT_ROOT] } }`
- **無** `configureServer` hook
- **無** plugin object 自帶 middleware
- **無** 第三方 plugin 如 `vite-plugin-rest` / `vite-plugin-api`
- **無** dev server 端 HTTP route
- Dev server URL：`vite --host 0.0.0.0` → 預設 `http://localhost:5173`（無自訂 host alias）

→ Phase 4 若實作 middleware，需新增 `configureServer` hook；本 phase 不動。

### 2.4 無 middleware / 無 write endpoint 現況

- `grep -rn 'configureServer\|app.use\|app.post' src/ vite.config.js` → **0 命中**
- `grep -rn 'fetch(\|XMLHttpRequest\|fs.writeFile\|fs.rename' src/views/admin/` → **0 runtime 命中**（唯一為 EJS comment 之負向聲明）
- `grep -rn 'safeWrite(' src/` → **0 runtime caller**（唯一命中為 `safe-write.js` 自身 export 與 `safe-write-test.js` 之 self-test caller）

→ browser ↔ Node fs 通道**完全未開**；本 phase 不解開。

### 2.5 baseline gates（cold-start verify）

- `pwd` = `D:\github\blog-new\portable-blog-system` ✅
- `git rev-parse HEAD` = `e6d18551cb8961c03e51f9f8365f364ffbe30e11` ✅
- `git rev-parse origin/main` = `e6d18551cb8961c03e51f9f8365f364ffbe30e11` ✅
- `git rev-list --left-right --count HEAD...origin/main` = `0 0` ✅
- `git status --short --branch` = `## main...origin/main`（clean）✅
- `npm run safe-write:test` = `71 pass / 0 fail` ✅
- `npm run validate:content` = `0 error(s) / 42 warning(s) on 37 post(s)` ✅

---

## §3 Why Phase 4 should stay docs-only first

### 3.1 browser → filesystem 通道是新風險面

到 Phase 3b 為止，整個 Admin UI 與 Node fs 之間**完全隔離**：

- EJS template 無 `fetch` / `XMLHttpRequest` / `fs.*`
- vite.config.js 無 server middleware / 無 route handler
- safeWrite 雖 landed，但**無 runtime caller**

Phase 4 一旦實作 middleware，這條隔離邊界**第一次**被解開。設計錯誤之 cost：

- LAN 暴露 fs（若 vite 跑 `--host 0.0.0.0`）
- prod build 殘留 middleware（若 gate 不嚴）
- browser 其他 tab CSRF（即使本機）
- path traversal（即使有 whitelist，仍需 server 端強驗）
- arbitrary field write（若 endpoint 未限 field allowlist）

→ 這些風險面在 docs 階段就應該被**寫死**為設計約束，而不是在 source 階段邊寫邊發現。

### 3.2 不應把首次 real write 與 middleware 實作合併

per §15.E.1 + night-12 §9.2，建議將「首次 production content write」與「browser→fs 通道」拆成獨立 phases：

| Phase | 動作 | 首次解開 browser→fs？ | 首次 safeWrite 對 prod content？ |
|---|---|---|---|
| 4（本 phase） | docs-only middleware design | ❌ | ❌ |
| 4 acceptance | read-only cross-check | ❌ | ❌ |
| 4.5（候選） | CLI write driver 或 dry-run preflight | ❌ | 🟡 待 user 決定 |
| 5 | middleware source landing | ✅ | ❌（先接 dry-run echo） |
| 6 | first real content write gate | （已啟用） | ✅ |

→ 一個 phase 只動一件事；每階段 rollback 路徑單一。docs-only 階段沒有任何 rollback 需求（無 source）。

### 3.3 延續專案既有 docs-first / source-later 拆批模式

既有 phase 3 series 為 reference：

- Phase 3a：`a44e0c2` docs-only preanalysis `docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md`
- Phase 3b：`efd3ac5` source landing（+116 lines；user 簽收後）
- Phase 3c：`e6d1855` docs sync checkpoint

→ Phase 4 應照同模式拆批；docs 階段先把設計落定 + 留審查空間；source 階段才解開通道。

---

## §4 Proposed Vite dev middleware design

### 4.1 Endpoint 建議

| 項目 | 建議值 | 理由 |
|---|---|---|
| Path | `POST /__admin/write-preview`（Phase 5 起 dry-run only）+ `POST /__admin/write`（Phase 6 起 real write）| 雙底線前綴避免與正常 vite asset path 衝突；preview / write 雙 endpoint 確保 dry-run 永遠可獨立呼叫 |
| Mount | vite `configureServer(server) { server.middlewares.use(path, handler) }` | vite 原生 middleware；不引第三方 dep（不引 express / body-parser / cors / multer） |
| Default response | `Content-Type: application/json; charset=utf-8` | 整個 endpoint 永遠回 JSON；不回 HTML |

→ **兩 endpoint 設計**：preview 與 write 分離；UI 端 dry-run flow 永遠走 preview；real write 必須 user 顯式 confirm 後才走 write。

### 4.2 Dev-only gate

雙層 gate；任一層失敗 → 不掛 middleware：

```js
configureServer(server) {
  // Layer 1: vite serve mode only
  if (server.config.command !== 'serve') return;
  // Layer 2: explicit env opt-in（可選）
  if (process.env.PORTABLE_BLOG_ADMIN_WRITE_ENABLED !== '1') return;
  server.middlewares.use('/__admin/write-preview', ...);
  server.middlewares.use('/__admin/write', ...);
}
```

- **Layer 1** 確保 `vite build` 與 `vite preview` mode 完全不掛 middleware（即使 user 誤跑 build script，middleware 不會被打包進 dist）
- **Layer 2** 為可選 env opt-in；user 必須顯式 `PORTABLE_BLOG_ADMIN_WRITE_ENABLED=1 npm run dev` 才解開；預設 `npm run dev` **不**啟用 middleware
- vite build 之 rollup pipeline 不會 import vite.config.js 之 `configureServer` callback；middleware code 不入 bundle

### 4.3 command === serve gate（雙層備援）

- `vite.config.js` 之 export 已採 `defineConfig(async ({ command }) => { ... })` 形式
- middleware 之 `configureServer` 為 vite serve mode 專屬 hook；vite build 不呼叫
- 額外在 handler 內檢 `process.env.NODE_ENV !== 'production'`（第三層備援；防 user 誤設）

### 4.4 Local-only / host / origin / referer 檢查

| 檢查項 | 規則 | 失敗 status |
|---|---|---|
| host bind | 強制 `127.0.0.1`；middleware 內檢 `req.socket.remoteAddress === '127.0.0.1' \|\| '::ffff:127.0.0.1' \|\| '::1'`；其他全拒 | 403 |
| Origin header | 必須屬 `['http://127.0.0.1:5173', 'http://localhost:5173']`（環境兩個都接） | 403 |
| Referer header | 必須以 `http://127.0.0.1:5173/admin/` 或 `http://localhost:5173/admin/` 起頭 | 403 |
| Host header | 必須屬 `['127.0.0.1:5173', 'localhost:5173']` | 403 |
| User-Agent | 不限制（無 reliable check） | — |

**注意**：即使 user 啟動 `vite --host 0.0.0.0`，middleware 仍應**只接** 127.0.0.1；LAN 上其他 device 即使能 GET asset，POST `/__admin/write` 一律 403。

### 4.5 CSRF token 策略

- vite dev 啟動時，server-side 產生 random token（`crypto.randomBytes(32).toString('hex')`）；存 in-memory；vite restart 重產
- EJS render 階段（`build-github.js` 之 admin emit）讀 server-side cached token → 嵌入 `data-csrf-token` attribute 或 `<meta name="admin-csrf">` tag
- client-side fetch 帶 `X-Admin-Csrf` header；middleware handler 對比；mismatch → 403
- token 不過期（避免 long-running dev session 中斷）；vite restart 自動重新嵌入

**注意**：CSRF token 與 origin / referer 檢查為**獨立**兩層；任一失敗皆拒。token 之主要 mitigation 為「同源其他 tab 不能 fetch」（其他 tab 拿不到 token；無法構造合法 request）。

### 4.6 Method 限制

| Method | 行為 |
|---|---|
| `POST` | 進入 handler 主流程 |
| `OPTIONS` | 回 `204 No Content`（CORS preflight；雖 same-origin 通常無 preflight；保險加） |
| 其他（`GET` / `PUT` / `PATCH` / `DELETE` / `HEAD`） | `405 Method Not Allowed`；`Allow: POST, OPTIONS` header |

### 4.7 Content-Type 限制

- 必須 `Content-Type: application/json`；其他（`multipart/form-data` / `text/plain` / `application/x-www-form-urlencoded`）一律 `415 Unsupported Media Type`
- 不接受 `Content-Type` 缺失之 request

### 4.8 Body size limit

- 強制 `64KB` 上限（`request.headers['content-length']` 超過即拒）
- streaming 讀取時若累積超過 64KB → 中止並回 `413 Payload Too Large`
- 64KB 對 SEO description（1000 chars）+ searchDescription（500 chars）+ JSON envelope 綽綽有餘；防 DoS

### 4.9 JSON parse failure handling

- middleware 自手 `JSON.parse(rawBody)`；不引第三方 body-parser
- parse 失敗（malformed JSON / 空 body / 非 object） → `400 Bad Request`；body `{ ok: false, reason: 'invalid-json', detail: '<error message>' }`
- top-level 必須為 object（陣列 / null / primitive 一律 400）

---

## §5 Request payload minimum schema

### 5.1 Payload 形狀

```json
{
  "targetRel": "content/blogger/posts/<slug>.md",
  "field": "description",
  "newValue": "新的 SEO description；UTF-8；無 control chars",
  "expectedOldValue": "舊的 SEO description；用於 race-condition guard",
  "dryRun": true,
  "csrfToken": "<token from EJS dataset>"
}
```

### 5.2 欄位定義

| 欄位 | 型別 | 必填 | 規則 |
|---|---|---|---|
| `targetRel` | string | ✅ | 必須為**相對路徑**；以 `content/blogger/posts/` 或 `content/github/posts/` 開頭；不含 `..`；不含 `\0`；server 端 `path.resolve(projectRoot, targetRel)` 後過 `isWriteAllowed`；fail → 403 |
| `field` | string | ✅ | enum `['description', 'searchDescription']`（Phase 4 設計階段固定 2 個；Phase 6 起酌情擴）；非 enum → 400 |
| `newValue` | string | ✅ | 必須 string；過對應 validator（`validateDescription` / `validateSearchDescription`）；fail → 422 |
| `expectedOldValue` | string | ✅ | 必須 string；server 端讀檔後對比 frontmatter 之 current value；不一致 → 409（race-condition guard） |
| `dryRun` | boolean | ✅ | `true` → preview only；`false` → real write；type 非 boolean → 400 |
| `csrfToken` | string | ✅ | 必須 match server-side cached token；mismatch → 403 |

### 5.3 不允許之 payload 形狀

- ❌ **absolute path**：client 不可傳 `D:\github\...` 或 `/d/github/...`；server 端只接 relative；統一過 `path.resolve(projectRoot, targetRel)` + whitelist
- ❌ **任意 field**：固定 enum；不支援 `tags` / `category` / `publishTargets` / `status` / `cover` / `coverAlt` / `titleEn` / `blocks.*` / `relatedLinks` / `otherLinks` / `book.*` / `download.*` / `images.*` / `affiliate.*`（這些屬後續 phase；Phase 4 設計階段不開）
- ❌ **任意 content path**：固定 `content/{github,blogger}/posts/*.md`；不支援 `.publish.json` / `.fb.md` / `content/settings/**` / `content/templates/**` / `content/validation-fixtures/**` / `content/{github,blogger}/pages/**` / `dist/**` / `src/**`（whitelist 同一檔；統一拒）
- ❌ **batch payload**：一個 request 只寫一個 field；不接受 `[{...}, {...}]` array；避免 partial failure 處理複雜度
- ❌ **任意 method / Content-Type**：見 §4.6 / §4.7
- ❌ **csrfToken 缺失**：必填；缺 → 403

---

## §6 Allowed write scope

### 6.1 初期允許範圍（Phase 4 設計階段固定）

| 維度 | 允許值 |
|---|---|
| 路徑 prefix | `content/blogger/posts/` 或 `content/github/posts/` |
| 副檔名 | `.md`（沿用 `admin-write-whitelist.js` classifyFilename 之 `post-md` kind） |
| field | `description` / `searchDescription`（SEO 雙欄）|
| 文章 status | `draft` 或 `ready`（per night-12 §9.1；不允寫 `published` 文章作為**首個 real write gate**；避免 live deploy regression） |
| 寫入動作 | 純 frontmatter mutate；body content bit-exact preserved |
| 寫入單檔上限 | 1 file per request |
| 一次寫入欄位數 | 1 field per request |

### 6.2 初期禁止範圍

| 維度 | 禁止值 | 統一回拒 status |
|---|---|---|
| `.publish.json` | 整類禁；改用既有 `npm run backfill:url` CLI | 403 |
| `.fb.md` | 整類禁；FB sidecar write 屬 §15.G phase 6（Phase 4 之後） | 403 |
| `relatedLinks` / `otherLinks` array mutation | 整類禁；屬 §15.F prereq #1-#12 + §15.G phase 10 | 403 |
| `book.*` / `download.*` / `affiliate.*` / `images.*` | 整類禁；屬 risky-editable 後段 | 403 |
| `category` / `tags` / `status` / `publishTargets` / `contentKind` | 整類禁；屬 Admin-2-c risky-editable | 403 |
| `content/settings/**` | 整類禁；屬全站 config；非 per-post | 403 |
| `content/templates/**` | 整類禁；屬作者範本 | 403 |
| `content/validation-fixtures/**` | 整類禁；屬 fixture | 403 |
| `content/{github,blogger}/pages/**` | 整類禁；屬固定頁；非 post | 403 |
| `dist/**` / `dist-blogger/**` / `dist-promotion/**` / `dist-reports/**` | 整類禁；屬 build output | 403 |
| `src/**` | 整類禁；屬 source code | 403 |
| `package.json` / `package-lock.json` | 整類禁；屬 dep 管理 | 403 |
| `vite.config.js` | 整類禁；屬 build config | 403 |
| `gh-pages/**` | 整類禁；屬 deploy artifact | 403 |
| `.cache/**` | 整類禁；屬 build 中介物 | 403 |
| `node_modules/**` | 整類禁；屬 dep | 403 |
| **published 文章**（per frontmatter `status: published`） | Phase 6 首批禁；避免 live deploy regression；Phase 7+ 解 | 422 |

### 6.3 首個 real write gate（per night-12 §9.1）

選定**SEO description / searchDescription** 作為首個 production content write 對象之理由：

1. 影響範圍最小：只動 frontmatter 雙欄；不影響 routing / build scope / lifecycle / GA4 / sitemap structure
2. 已有 validator：Phase 2 `validateDescription` / `validateSearchDescription` 已 ready；71/71 self-test 通過
3. 已有 dry-run UI：Phase 3b SEO dry-run viewer 已 wired；client-side diff 已驗證
4. 已有 readiness checklist：Phase 3b 已嵌入 4-row 進度顯示
5. downstream 風險最低：失敗只影響 SEO meta tag / OG description 顯示；無 routing / build scope 退步

→ **首篇寫入對象**：選一篇 `draft` 或 `ready` 之 `.md`；不選 `published`；不選 reverse UTM 涉及之 cross-link 文章（避免 pm-26 deploy gate 干擾）

---

## §7 Atomic write flow

### 7.1 與既有 safeWrite 對齊

Phase 5 middleware handler 之核心 flow（pseudo；本 phase 不實作）：

```js
async function handleWrite(req, res, body) {
  // 1. CSRF / origin / method / content-type / size 已在 §4 layers gate
  // 2. payload schema gate (per §5)
  if (!validatePayloadShape(body)) return reply(res, 400, { ok: false, reason: 'invalid-payload' });

  // 3. Path resolve + whitelist
  const projectRoot = process.cwd();
  const targetAbs = path.resolve(projectRoot, body.targetRel);
  // safeWrite 內部會再過 isWriteAllowed；但 middleware 端先 sanity check

  // 4. Read current file content
  const current = await fs.readFile(targetAbs, 'utf-8');
  const { data: currentFm, content: currentBody } = matter(current);

  // 5. expectedOldValue check (race-condition guard)
  if (currentFm[body.field] !== body.expectedOldValue) {
    return reply(res, 409, {
      ok: false,
      reason: 'expected-old-value-mismatch',
      actualOldValue: currentFm[body.field],
    });
  }

  // 6. Mutate frontmatter
  const newFm = { ...currentFm, [body.field]: body.newValue };
  const newContent = matter.stringify(currentBody, newFm);

  // 7. Pre-write field validator (已內建於 safeWrite)
  const validators = [
    body.field === 'description'
      ? (c) => validateDescription(matter(c).data.description)
      : (c) => validateSearchDescription(matter(c).data.searchDescription),
  ];

  // 8. dryRun branch
  if (body.dryRun === true) {
    return reply(res, 200, {
      ok: true,
      dryRun: true,
      wouldWriteBytes: Buffer.byteLength(newContent, 'utf-8'),
      currentBytes: Buffer.byteLength(current, 'utf-8'),
      diffSummary: { field: body.field, oldLen: body.expectedOldValue.length, newLen: body.newValue.length },
    });
  }

  // 9. git status check (per §15.D.2)
  const gitStatus = await checkGitStatus({ cwd: projectRoot });
  if (!gitStatus.ok) return reply(res, 500, { ok: false, reason: 'git-status-failed', detail: gitStatus.reason });
  if (!gitStatus.clean) return reply(res, 409, { ok: false, reason: 'git-dirty', dirtyFiles: gitStatus.dirtyFiles });

  // 10. safeWrite atomic (whitelist + validators + tmp + rename)
  const result = await safeWrite({
    targetPath: targetAbs,
    newContent,
    projectRoot,
    validators,
    gitStatus,
    enforceCleanGit: true,
  });

  if (!result.ok) {
    return reply(res, mapReasonToStatus(result.reason), { ok: false, reason: result.reason, ...result });
  }

  // 11. Post-write validate:content (optional; spawn child process)
  const validateResult = await runValidateContent({ projectRoot, timeoutMs: 30000 });
  return reply(res, 200, {
    ok: true,
    writtenPath: result.writtenPath,
    validateBaseline: validateResult.summary,
    rollbackHint: `git restore ${body.targetRel}`,
  });
}
```

### 7.2 Flow 對齊既有 safeWrite 之承諾

per `src/scripts/safe-write.js`：

1. ✅ **git clean check**：由 caller (middleware handler) 呼叫 `checkGitStatus()` 並傳入 safeWrite；safeWrite 自身**不 spawn git**
2. ✅ **whitelist check**：safeWrite 內部 `isWriteAllowed(targetPath, projectRoot)`；middleware 端額外 sanity（雙層備援）
3. ✅ **field validator**：safeWrite 之 `validators` array；fail → 不寫
4. ✅ **expectedOldValue check**：middleware handler 內手動讀檔對比；不入 safeWrite 內部（safeWrite 是 content-agnostic helper）
5. ✅ **tmp write**：`fs.writeFile(targetPath + '.tmp', newContent, 'utf-8')`
6. ✅ **rename**：`fs.rename(tmpPath, resolved)`；POSIX 原子；Windows NTFS 同檔系統亦原子
7. ✅ **cleanup tmp on failure**：safeWrite catch block 內 `fs.unlink(tmpPath).catch(() => {})`
8. ✅ **no git mutation**：safeWrite 自身不 spawn git；middleware handler 不 spawn git commit / restore / stash / reset
9. ✅ **no auto commit**：所有 commit 由 user 在 terminal 手動執行
10. ✅ **no auto restore**：所有 rollback 由 user 在 terminal 手動 `git restore`

### 7.3 Frontmatter parse / stringify

per §15.D.3：

- `gray-matter` parse 原檔 → `{ data, content }`
- mutate `data[field]` 為 newValue
- `matter.stringify(content, data)` 寫回
- 保留 body content bit-exact（gray-matter 之 stringify 預設保留 body LF / trailing newline；前提 raw input 也是 LF）
- YAML emitter：`js-yaml`（gray-matter 內建；無新 dep）

**注意**：`matter.stringify` 之 YAML quote / indent 行為可能與原檔細微差異（例如 string 是否 quote）；Phase 5 source landing 時需 manual 驗 git diff 是否僅變動目標 field；若有其他 YAML emitter 副作用，需在 Phase 5 之 acceptance gate 處理。

---

## §8 Pre-write / post-write validation

### 8.1 Pre-write 階段

| 檢查項 | 觸發點 | 失敗 status |
|---|---|---|
| payload shape | middleware handler 起手 | 400 |
| CSRF / origin / referer / host | middleware handler 起手 | 403 |
| Method / Content-Type / body size | middleware handler 起手 | 405 / 415 / 413 |
| targetRel whitelist | `safeWrite` 內部 `isWriteAllowed` | 403 |
| field allowlist | middleware handler enum check | 400 |
| field-level validator | `safeWrite` validators array | 422 |
| expectedOldValue match | middleware handler 讀檔對比 | 409 |
| git status clean | middleware handler `checkGitStatus()` → `safeWrite` enforceCleanGit | 409 |

### 8.2 Post-write 階段

| 檢查項 | 動作 | 失敗處理 |
|---|---|---|
| validate:content baseline | spawn `node src/scripts/validate-content.js`；capture stdout 最後一行；30s timeout | 若 error count 或 warning count 增加 → response body 含 `regression: true` + `before/after summary`；不自動 rollback；UI 顯示 manual `git restore` 提示 |
| safe-write:test | **不**自動跑（test 與 prod content 無關）；若需可 user 手動 | — |

### 8.3 為什麼**不**同步跑 `safe-write:test`

- `safe-write:test` 為 helper 之 self-test（71 cases）；其驗證對象為 `safe-write.js` / `git-status-check.js` / `admin-write-whitelist.js` / `admin-field-validators.js` 本身
- 與 production content 寫入結果**無關**；每次寫 content 跑 self-test 是 noise
- 留給 user 在 CI / pre-commit / 手動驗證時跑；middleware 不負責

### 8.4 Validation failed 時之回報

middleware response 例：

```json
{
  "ok": false,
  "reason": "validator-failed",
  "errors": [
    { "field": "description", "error": "description-too-long" }
  ]
}
```

或 post-write regression 例：

```json
{
  "ok": true,
  "writtenPath": "<abs>",
  "regression": true,
  "validateBefore": "0 error(s) / 42 warning(s) on 37 post(s)",
  "validateAfter": "0 error(s) / 43 warning(s) on 37 post(s)",
  "rollbackHint": "git restore content/blogger/posts/<slug>.md"
}
```

→ UI 端收到 `regression: true` 時應**自動**顯示紅底 banner + `git restore` 命令；不引導 user 點任何 button 自動修復

### 8.5 不自動修復

- 不自動 `git restore`
- 不自動 `git stash`
- 不自動 `git reset`
- 不自動 revert 寫入
- 不自動 backup 至其他位置（git working tree 即 backup）

→ **任何**修復動作由 user 在 terminal 手動執行；middleware 只顯示提示

---

## §9 Dry-run vs real-write mode

### 9.1 dryRun=true 行為

- 不呼叫 `fs.writeFile`
- 仍跑 §8.1 之所有 pre-write check（payload / CSRF / origin / whitelist / field allowlist / validator / expectedOldValue）
- 仍跑 git status check（但 clean 失敗時不 hard-block；只在 response 顯示 `gitDirty: true` warning）
- response body 形狀：

```json
{
  "ok": true,
  "dryRun": true,
  "wouldWriteBytes": 4321,
  "currentBytes": 4290,
  "diffSummary": {
    "field": "description",
    "oldLen": 80,
    "newLen": 95,
    "changed": true
  },
  "validators": { "description": { "ok": true } },
  "gitClean": true
}
```

### 9.2 real-write 必須條件（per §15.D.9）

UI 端 Apply button enable 之全部 gate（任一不滿足 → button 維持 disabled）：

1. ✅ field validator preview = `ok: true`
2. ✅ git status clean（UI 端 dry-run preflight 拿到 `gitClean: true`）
3. ✅ dryRun computed `changed: true`（無變更不允寫）
4. ✅ user 看到 explicit confirm checkbox 並勾起（防誤觸）
5. ✅ CSRF token 存在於 dataset
6. ✅ expectedOldValue 與 dry-run preflight 拿到之 currentFm 對齊（無 race condition）

### 9.3 real-write 需要 user 明確執行

- click Apply button 不自動 trigger；button enable 後 user 必須再次點選
- 點選後彈出 confirm dialog（`window.confirm()`）顯示 target path + field + 新舊長度 + git status；user 必須 OK 才實際 fetch
- 不接受 keyboard auto-submit；不接受 form auto-submit

### 9.4 兩 endpoint 與 dryRun flag 之關係

| Endpoint | dryRun flag | 行為 |
|---|---|---|
| `POST /__admin/write-preview` | 強制 `true`；client 即使傳 `false`，server 端覆寫為 `true` | 永遠 preview；保險層 |
| `POST /__admin/write` | client 傳之 `dryRun` 為準 | dryRun=true → preview；dryRun=false → real write |

→ **兩 endpoint + dryRun flag 雙層**：UI 之 「Preview Diff」 流程永遠走 preview endpoint；「Apply」 流程才走 write endpoint。Preview endpoint 即使被誤調用，也永遠不寫入。

---

## §10 UI Apply button enable gates

### 10.1 Phase 4 docs-only 不啟用

本 phase 為 docs-only；**不**碰 `src/views/admin/index.ejs`；**不**移除 `disabled` attribute；**不**綁 click handler；**不**新增 fetch / XHR；**不**新增 CSRF token dataset。

Phase 3b 之既有 disabled 狀態 100% 保留：

- `<button class="apply-disabled" disabled aria-disabled="true">Apply (disabled — Phase 3 dry-run only)</button>`
- visual：`background: #ccc; color: #666; cursor: not-allowed; opacity: 0.6`
- hover 不變色（不引導點擊）
- **不**綁 click handler
- DOM 上**無** fetch / endpoint 引用

### 10.2 未來 source phase 何時可啟用

依 §15 recommended sequence：

| Phase | UI Apply button 狀態 |
|---|---|
| 4（本 phase；docs-only） | 仍 disabled；不動 EJS |
| 4 acceptance（read-only） | 仍 disabled |
| 4.5（CLI / preflight；候選） | 仍 disabled |
| 5（middleware source landing） | 解開 disabled；但僅綁 preview endpoint（dryRun=true）；仍**不**寫入 |
| 6（first real content write gate） | Preview button + 獨立 Apply button；Apply 綁 write endpoint；首篇 SEO write |

### 10.3 disabled 狀態如何維持

per Phase 3b 之承諾：

- 文字 label 明確寫 `Apply (disabled — Phase 3 dry-run only)`
- `disabled` HTML attribute + `aria-disabled="true"` 雙重
- 視覺：灰底 + cursor: not-allowed + opacity 0.6
- hover 不變色
- DOM 內**無** click handler；**無** fetch；**無** XHR；**無** `safeWrite` / `fs.write` 字串

### 10.4 不新增 fetch / XHR

本 phase 嚴格保證 `src/views/admin/index.ejs` 內：

- `fetch(` 命中 = 0
- `XMLHttpRequest` 命中 = 0
- `axios` / `ky` / `wretch` 命中 = 0（本來就無第三方 dep）
- `EventSource` 命中 = 0
- `WebSocket` 命中 = 0

### 10.5 不新增 click handler

- 不在 EJS 中加 `onclick=` inline handler
- 不在 EJS `<script>` 中 `addEventListener('click', ...)` 對 `.apply-disabled` 綁
- 不新增 module-level event delegation

---

## §11 Failure handling matrix

| Status | reason code | 觸發條件 | 預期 response body |
|---|---|---|---|
| `400` | `invalid-json` | body 非合法 JSON / 空 body / 非 object | `{ ok: false, reason: 'invalid-json', detail }` |
| `400` | `invalid-payload` | payload 缺欄位 / 型別錯 / `field` 不在 enum | `{ ok: false, reason: 'invalid-payload', missingFields, typeErrors }` |
| `400` | `invalid-target-rel` | targetRel 為 absolute / 含 `..` / 含 `\0` / 非 string | `{ ok: false, reason: 'invalid-target-rel' }` |
| `403` | `forbidden-origin` | Origin / Referer / Host header 不符 | `{ ok: false, reason: 'forbidden-origin' }` |
| `403` | `forbidden-remote` | `req.socket.remoteAddress` 非 127.0.0.1 | `{ ok: false, reason: 'forbidden-remote' }` |
| `403` | `forbidden-csrf` | csrfToken 缺失 / mismatch | `{ ok: false, reason: 'forbidden-csrf' }` |
| `403` | `whitelist-rejected` | safeWrite 之 isWriteAllowed 拒（含 `not-in-content-folder` / `not-in-posts-folder` / `site-folder-not-allowed` / `filename-extension-not-allowed` 等 reason）| `{ ok: false, reason: 'whitelist-rejected', detail }` |
| `405` | `method-not-allowed` | 非 POST / OPTIONS | `{ ok: false, reason: 'method-not-allowed' }` + `Allow: POST, OPTIONS` header |
| `409` | `git-dirty` | git status `clean !== true` | `{ ok: false, reason: 'git-dirty', dirtyFiles, untracked }` |
| `409` | `expected-old-value-mismatch` | currentFm[field] !== body.expectedOldValue | `{ ok: false, reason: 'expected-old-value-mismatch', actualOldValue }` |
| `413` | `payload-too-large` | body size 超過 64KB | `{ ok: false, reason: 'payload-too-large' }` |
| `415` | `unsupported-media-type` | Content-Type 非 `application/json` | `{ ok: false, reason: 'unsupported-media-type' }` |
| `422` | `validator-failed` | field validator fail（如 `description-too-long` / `description-has-control-chars`） | `{ ok: false, reason: 'validator-failed', errors: [{ field, error }] }` |
| `422` | `target-status-not-allowed` | 目標文章 frontmatter `status === 'published'`（首期防 live deploy regression） | `{ ok: false, reason: 'target-status-not-allowed', actualStatus: 'published' }` |
| `500` | `git-status-failed` | checkGitStatus 回 `ok: false`（spawn 失敗 / timeout / exit nonzero）| `{ ok: false, reason: 'git-status-failed', detail }` |
| `500` | `read-failed` | 讀目標檔失敗（檔不存在 / permission） | `{ ok: false, reason: 'read-failed', detail }` |
| `500` | `write-failed` | safeWrite 之 `fs.writeFile` / `fs.rename` throw | `{ ok: false, reason: 'write-failed', detail }` |
| `200` + `regression: true` | （成功寫入但 post-write validate 退步） | validate:content error / warning count 增加 | `{ ok: true, writtenPath, regression: true, validateBefore, validateAfter, rollbackHint }` |

→ **所有 failure response 一律 `{ ok: false, reason, ...detail }`**；UI 端統一 dispatch by `reason`；不嘗試解析人類訊息

---

## §12 Rollback / recovery design

### 12.1 主策略：以 `git restore <path>` 為主

- 寫入後不自動 rollback
- 寫入後 UI 顯示 banner：
  ```
  ✅ 寫入完成：content/blogger/posts/<slug>.md (description field)
  若需 rollback，請於 terminal 執行：
    cd D:\github\blog-new\portable-blog-system
    git restore content/blogger/posts/<slug>.md
  ```
- response body 含 `rollbackHint: "git restore <rel>"`；UI 端 render

### 12.2 不自動 rollback

- 不在 middleware handler 內 spawn `git restore`
- 不在 middleware handler 內 spawn `git stash`
- 不在 middleware handler 內 spawn `git reset`
- 不在 middleware handler 內 spawn `git checkout`
- 不在 middleware handler 內回寫 expectedOldValue（不視為 rollback；avoid silent revert）

理由：

1. 自動 rollback 之 surface area 比寫入更大；同樣需 git status check / whitelist 等保護
2. user 看到 banner 後可以**先看 git diff** → 確認改了什麼 → 再決定 restore 或 commit
3. CI / pre-commit hook / IDE git integration 已有完整 rollback workflow；middleware 不重複

### 12.3 不自動 stash / reset

per §15.D.2 + §15.D.8 之承諾：

- `git-status-check.js` 只做 status query；不 mutate
- `safe-write.js` 只做 file write；不 spawn git
- middleware handler 也不 spawn git mutate command

→ git working tree 之**所有** mutation 由 user 手動執行

### 12.4 UI 應提示 affected file

寫入後 UI 顯示：

```
✅ 寫入完成
  Path: content/blogger/posts/<slug>.md
  Field: description
  Bytes: 4290 → 4321 (+31)
  Validate baseline: 0 error / 42 warning / 37 posts → 0 error / 42 warning / 37 posts (no change)

請於 terminal 確認 git diff：
  git diff content/blogger/posts/<slug>.md

若 OK，請 commit：
  git add content/blogger/posts/<slug>.md
  git commit -m "..."

若不 OK，請 rollback：
  git restore content/blogger/posts/<slug>.md
```

### 12.5 docs 應提示 user 手動確認 diff

per §15.D.8 + night-12 §9.1：

- 寫入後 user 必須**先看** `git diff <path>`，再決定 commit 或 restore
- 不提供「自動 commit」option
- 不提供「自動 push」option
- 不提供「直接寫入後不顯示 banner」option

### 12.6 規模化考量

- 連續多筆寫入時，每筆 dirty git 都會被 safeWrite 拒；user 必須**先 commit 上一筆**才能寫下一筆
- 此為**安全特性**而非 bug；避免「一次寫多筆但 rollback 不細」
- 若 user 希望 batch 寫入，需在 Phase 7+ 設計 batch mode（本 phase 不開）

---

## §13 Security / risk boundary

### 13.1 LAN exposure risk

- **Risk**：`vite --host 0.0.0.0` 預設讓 LAN 上其他 device 能 GET asset；若 middleware 不限 127.0.0.1，遠端 device 可 POST 寫入本機 fs
- **Mitigation**：
  - middleware handler 內檢 `req.socket.remoteAddress`；非 127.0.0.1 / ::1 一律 403（§4.4）
  - Origin / Referer header 雙重檢查（§4.4）
  - dev 啟動文件提示 user 採 `vite --host 127.0.0.1` 而非 `0.0.0.0`（本 phase 不改 `vite.config.js`；提示寫入 docs）

### 13.2 Browser tab CSRF risk

- **Risk**：即使本機，同 browser 之其他 tab（如惡意網站）可 `fetch('http://localhost:5173/__admin/write', { method: 'POST', credentials: 'include' })`；同源 policy 允許因為兩個都是 localhost
- **Mitigation**：
  - CSRF token（§4.5）：其他 tab 拿不到 token（Admin EJS 才 inject）
  - Origin / Referer 必須是 `http://localhost:5173/admin/...`；其他 tab 之 Referer 不會是 `/admin/`
  - Content-Type 必須 `application/json`；form-urlencoded / multipart 一律 415（防部分 simple request CSRF vector）
  - 推薦 user 在 Admin 操作時**不要**在同 browser 開不信任網站（dev-only；user 一般已知此 boundary）

### 13.3 Production build leakage risk

- **Risk**：middleware handler code 若被打包進 `dist/`，user `vite preview` 或部署後 endpoint 仍存在
- **Mitigation**：
  - vite `configureServer` hook 為 serve mode 專屬；vite build 不 invoke；middleware function 不入 rollup bundle
  - 雙層 gate（§4.2 / §4.3）：`server.config.command !== 'serve'` + `process.env.NODE_ENV === 'production'` 拒
  - 三層 gate：env opt-in `PORTABLE_BLOG_ADMIN_WRITE_ENABLED === '1'`；預設**不**啟用
  - admin/index.html 自身 already gated by `mode === 'dev'`（per `build-github.js:663-676`）；prod build 不產出 admin 頁
  - `robots.txt` 已 Disallow `/admin/`
  - HTML `<meta name="robots" content="noindex, nofollow">` 已存在

### 13.4 Path traversal risk

- **Risk**：client 傳 `targetRel: "../../../../etc/passwd"` 試圖跳出 projectRoot
- **Mitigation**：
  - `admin-write-whitelist.js` 已防 `..`（classifyFilename 規則 + path.resolve 後過 `path.relative` 檢 `..` 開頭）
  - middleware handler 額外 sanity：`targetRel.includes('..')` → 直接 400
  - 雙層備援；單層失敗仍有第二層擋

### 13.5 Arbitrary field write risk

- **Risk**：client 傳 `field: "publishTargets.blogger.enabled"` 或 `field: "status"` 試圖改 routing / lifecycle
- **Mitigation**：
  - middleware handler enum check：`field` 必須屬 `['description', 'searchDescription']`；其他全 400
  - 即使有人錯誤 patch enum，frontmatter 之其他欄位仍會被 mutate（gray-matter 不保護）；但 safeWrite 之 validator 不會通過（其他 field 之 validator 未綁；fail-safe）
  - Phase 6 之後若擴 field，每次擴需要獨立 phase 設計 + validator + UI test；不一次性開 list

### 13.6 Overbroad content write risk

- **Risk**：client 傳 `targetRel: "content/blogger/posts/published-popular-post.md"` 寫入 high-traffic 文章；regression 後 live deploy 受影響
- **Mitigation**：
  - middleware handler 讀檔後檢 `currentFm.status`；若 `'published'` → 首期 422（per §6.2）
  - Phase 6 設計階段才考慮放寬至 published；user 手動 opt-in per-post（如 frontmatter 加 `adminWriteAllowed: true`）；本 phase 不開
  - dry-run 流程不受此限；user 仍可 preview published 文章之 diff（只是不能 real write）

### 13.7 Mitigation checklist

| 風險 | Mitigation 1 | Mitigation 2 | Mitigation 3 |
|---|---|---|---|
| LAN exposure | remoteAddress check | Origin check | docs 推薦 127.0.0.1 bind |
| CSRF | token | Origin/Referer | Content-Type |
| Prod build leakage | configureServer hook scope | command === serve | env opt-in |
| Path traversal | whitelist `..` reject | middleware sanity | path.relative check |
| Arbitrary field | enum allowlist | per-field validator | future per-phase expand |
| Overbroad write | status: published reject | first-write gate (draft/ready) | per-post opt-in (future) |
| Race condition | expectedOldValue check | git status clean | atomic tmp+rename |
| Regression | post-write validate baseline | manual git diff | rollbackHint banner |

---

## §14 Candidate comparison

### 14.1 night-12 三方案保留

per night-12 read-only preanalysis §8：

| 比較項 | 方案 1：Vite dev middleware | 方案 2：CLI write driver | 方案 3：dry-run only（延後） |
|---|---|---|---|
| 目的 | vite `configureServer` middleware；Admin UI fetch POST → safeWrite | 不接 browser；user 從 Admin UI 複製欄位值 → `npm run admin:write -- --target=... --field=... --value=...` CLI | 完全不啟用 write path；繼續累積 dry-run UX |
| 寫入安全性 | 🟡 中 | 🟢 高 | 🟢 最高 |
| 重用 safeWrite | ✅ | ✅ | ❌ |
| 影響 build / deploy | ❌ 0 | ❌ 0 | ❌ 0 |
| 主要風險 | LAN / CSRF / prod leakage / path traversal | UX 倒退（與 UI 脫鉤） | 無進展 |
| 推薦時機 | Phase 5（待本 phase docs 落定 + Phase 4.5 / Phase 4 acceptance 通過） | Phase 4.5（候選；user 決定） | 任何時點皆可繼續維持 |

### 14.2 本文件範圍

**本文件只落 Phase 4 middleware preanalysis（方案 1）**；**不**實作；**不**碰 source；**不**啟動 CLI 路徑。

| 屬性 | 本 phase 之動作 |
|---|---|
| 方案 1 設計細節 | ✅ §4 / §5 / §6 / §7 / §8 / §9 / §10 / §11 / §12 / §13 完整描述 |
| 方案 2 CLI 設計 | 🟡 §15 提一句作為候選；本文件不展開細節（留 Phase 4.5 user 決定後另立 docs） |
| 方案 3 dry-run only | 🟡 §15 提一句作為候選；既有 Phase 3b 已落實 |
| 方案實作 | ❌ 不實作 |

→ 本 phase 之 user 簽收後，下一 phase 候選為 Phase 4 acceptance（read-only）或 Phase 4.5（user 決定走 CLI 或直接到 Phase 5 middleware source）

---

## §15 Recommended implementation sequence

### 15.1 Phase 4 sequence

| Phase | Phase 名稱 | 屬性 | 動作 | 風險 | Status |
|---|---|---|---|---|---|
| 4a | 本 phase | docs-only | 新增本文件；無 source change | 🟢 零 | 🔄 進行中 |
| 4b | acceptance cross-check | read-only | 確認本文件 + baseline 一致；docs 同步至 `admin-2-write-pre-analysis.md` § 15.G phase 4 status | 🟢 零 | ⏸ pending |
| 4.5（候選 A）| CLI write driver docs-only | docs-only | 新增 `docs/20260529-admin-write-phase-4p5-cli-driver-preanalysis.md`（候選；user 決定）| 🟢 零 | ⏸ pending |
| 4.5（候選 B）| middleware dry-run endpoint preflight docs-only | docs-only | 新增 `docs/20260529-admin-write-phase-4p5-middleware-preview-preflight.md`（候選；user 決定）| 🟢 零 | ⏸ pending |
| 5 | middleware source landing | source | 動 `vite.config.js`（加 `configureServer`）+ 新 `src/scripts/admin-write-middleware.js`；endpoint 只接 preview（dryRun forced true） | 🟡 中（首次解開 browser→fs） | ⏸ pending |
| 6 | first real content write gate | source | UI Apply enable + write endpoint 接 real write；首篇 SEO description 寫入 draft / ready 文章 | 🟡 中（首次 production content write） | ⏸ pending |

### 15.2 為什麼分 5 個小批

- **4a → 4b → 4.5 → 5 → 6** 之每階段 rollback 路徑單一：
  - 4a → 4b：rollback = `git restore docs/20260528-...md` 或 `git revert <commit>`（單檔 docs；零風險）
  - 4b → 4.5：rollback = 同 4a
  - 4.5 → 5：rollback = `git revert <commit>` （多源碼變動；單一 commit 限制）
  - 5 → 6：rollback = `git revert <commit>` + 還可選擇 disable env opt-in 不解開 endpoint
  - 6 → user 自選下一步：rollback = `git restore <md>`（per §12）

- 每階段獨立 user 簽收；不一次合併

### 15.3 候選 phase 4.5

per night-12 §9.2 之建議 + user 簽收：

- **候選 A**（推薦保守路徑）：先寫 CLI write driver docs；user 在 terminal 跑 `npm run admin:write` 寫一筆 SEO description；驗 safeWrite + git guard 在 production content 路徑安全；再進 Phase 5 middleware
- **候選 B**（直接前進路徑）：跳過 CLI；直接寫 middleware preview-only endpoint 之 docs（更窄；只開 preview endpoint；real write 留 Phase 6）；user 簽收後 Phase 5 source

兩候選**皆 docs-only**；user 在 Phase 4b acceptance 後再決定走 A 或 B

### 15.4 Phase 5 與 Phase 6 之分界

| 維度 | Phase 5 | Phase 6 |
|---|---|---|
| middleware code | ✅ landed | （已 landed） |
| `vite.config.js` `configureServer` hook | ✅ 加 | （已加） |
| endpoint `/__admin/write-preview` | ✅ 啟用 | ✅ 啟用 |
| endpoint `/__admin/write` | 🟡 啟用但 hardcode dryRun=true（real write 內部 short-circuit；保險層）| ✅ 啟用 real write |
| UI Apply button | 🟡 解開 disabled；但綁 preview endpoint | ✅ 綁 write endpoint |
| first production content mutate | ❌ 仍不寫 | ✅ 寫一篇 SEO description |
| validate baseline 預期 | 不變 | 不變（首篇寫入不應引發 regression） |
| safe-write:test 預期 | 71/0 不變 | 71/0 不變 |

→ Phase 5 為「通道解開但不流」；Phase 6 為「首次流通」

---

## §16 Explicit non-goals

本 phase（4a；本文件落地）**明確不做**：

| 非目標 | 理由 |
|---|---|
| ❌ 實作 middleware | 屬 Phase 5；本 phase docs-only |
| ❌ 實作 write route | 同上 |
| ❌ 實作 CLI write driver | 屬 Phase 4.5 候選 A；本 phase 不開 |
| ❌ 啟用 Admin Apply button | 屬 Phase 5；本 phase 維持 disabled |
| ❌ 任何 content write | 屬 Phase 6；本 phase 不寫 |
| ❌ build / deploy | 本 phase docs-only；無 build 需求 |
| ❌ Blogger repost | 本 phase 與 Blogger 無關 |
| ❌ GA4 validation | 本 phase 與 GA4 無關 |
| ❌ 解除 pm-26 deploy gate | reverse UTM 仍 dormant；獨立 gate |
| ❌ 建立 reverse UTM fixture | 屬 pm-26 之獨立 phase |
| ❌ 動 `vite.config.js` | 本 phase 不碰 |
| ❌ 動 `package.json` | 無新 script / 無新 dep |
| ❌ 動 `src/**` | 不碰任何 source |
| ❌ 動 `content/**` | 不碰任何 content |
| ❌ 動 `content/settings/**` / `content/templates/**` / `content/validation-fixtures/**` | 不碰 |
| ❌ 動 `dist/**` / `dist-blogger/**` / `dist-promotion/**` / `dist-reports/**` | 不碰 |
| ❌ 動 `gh-pages/**` | 不碰 |
| ❌ 動 `.cache/**` | 不碰 |
| ❌ 動 `node_modules/**` | 不碰 |
| ❌ 動既有 docs 檔 | 只新增本文件單檔；不修改 `admin-2-write-pre-analysis.md` 或其他既有 docs |
| ❌ git fetch / pull / push（push 由 user 簽收後 trigger） | docs-only commit；push 等 user OK |
| ❌ npm install | 無新 dep |
| ❌ npm run build / dev / preview | docs-only；無 build 需求 |
| ❌ 新增 fixture | 無 fixture 需求 |
| ❌ 新增 fetch / XHR / POST / PUT runtime | 不碰 UI runtime |
| ❌ 新增 fs.writeFile / fs.rename / safeWrite production caller | 不碰 src |

---

## §17 Acceptance checklist

本 docs-only phase 之驗收項目：

### 17.1 File scope

- [ ] **只新增**`docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（單檔；本文件）
- [ ] **無**其他檔案新增
- [ ] **無**任何既有檔案修改（含既有 docs / source / content / settings / template / fixture / dist / package / vite config）

### 17.2 Baseline gates

- [ ] `git status --short --branch` 在 commit 前只顯示本文件之 `??`（untracked）
- [ ] `git diff --stat` 0 modified files；只 1 new file
- [ ] `npm run safe-write:test` = `71 pass / 0 fail`（與 baseline 一致）
- [ ] `npm run validate:content` = `0 errors / 42 warnings / 37 posts`（與 baseline 一致）

### 17.3 Post-commit gates

- [ ] commit 後 `git log -1 --oneline` 顯示 commit message `docs(admin): plan phase 4 vite write middleware`
- [ ] commit 後 `git status --short --branch` clean
- [ ] push 後 `HEAD` = `origin/main`
- [ ] push 後 `git rev-list --left-right --count HEAD...origin/main` = `0 0`
- [ ] push 後 working tree clean

### 17.4 Boundary preservation

- [ ] no content change（`content/**/*.md` / `*.publish.json` / `*.fb.md` 全 0 改）
- [ ] no settings change（`content/settings/**` 全 0 改）
- [ ] no template change（`content/templates/**` 全 0 改）
- [ ] no fixture change（`content/validation-fixtures/**` 全 0 改）
- [ ] no dist change（`dist/**` / `dist-blogger/**` / `gh-pages/**` 全 0 改）
- [ ] no deploy（Blogger / GitHub Pages 全未動）
- [ ] no Blogger repost
- [ ] no GA4 dimension change
- [ ] no src change（`src/**` 全 0 改）
- [ ] no package change（`package.json` / `package-lock.json` 全 0 改）
- [ ] no vite config change（`vite.config.js` 全 0 改）
- [ ] no existing docs change（除本新增檔外，`docs/**` 全 0 改）

### 17.5 Carry-forward state

- [ ] Admin UI Apply button 仍 disabled（未動 EJS）
- [ ] safeWrite 仍無 production caller（未動 src）
- [ ] Vite middleware 仍未掛載（未動 vite.config.js）
- [ ] pm-26 deploy gate 仍 blocked（不解除）
- [ ] reverse UTM 仍 dormant（不啟動）

---

## §18 Cross-links

- `docs/admin-2-write-pre-analysis.md` §15.D（Proposed Architecture；本 phase 引用 §15.D.1 / §15.D.2 / §15.D.4 / §15.D.5 / §15.D.6 / §15.D.7 / §15.D.8 / §15.D.9）
- `docs/admin-2-write-pre-analysis.md` §15.E（First Write Scope Recommendation；本 phase §6 引用 §15.E.1 之 SEO 排名）
- `docs/admin-2-write-pre-analysis.md` §15.F（sourceKey Step 6 Prerequisites；本 phase 不解除 prereq #1-#12）
- `docs/admin-2-write-pre-analysis.md` §15.G（Recommended Phase Sequence；本 phase 為 phase 4 之 pre-analysis）
- `docs/20260527-admin-write-phase-3-dry-run-ui-preanalysis.md`（Phase 3 docs-only preanalysis；本 phase 沿用同模式）
- `docs/20260527-end-of-day-report.md`（Phase 2 / Phase 3a-3c landing 紀錄）
- `CLAUDE.md` §27（Claude Code 修改規則；說明 + 回報義務）
- `CLAUDE.md` §29（第一版不做清單；Admin 屬第二階段；不引入後端 / 不引入登入）

---

## §19 Boundary reaffirmation

本 phase（4a；本文件落地）：

| 維度 | 狀態 |
|---|---|
| 新增檔案 | ✅ `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（單檔；本文件）|
| 修改既有 docs | ❌ 無 |
| 修改 source | ❌ 無 |
| 修改 content | ❌ 無 |
| 修改 settings / template / fixture | ❌ 無 |
| 修改 dist / gh-pages | ❌ 無 |
| 修改 package / vite config | ❌ 無 |
| 新增 fixture | ❌ 無 |
| 新增 npm dep | ❌ 無 |
| 新增 middleware | ❌ 無（docs only） |
| 新增 write route | ❌ 無 |
| 新增 CLI write driver | ❌ 無 |
| 啟用 Admin Apply | ❌ 無 |
| Content mutation | ❌ 無 |
| Build / deploy / Blogger repost / GA4 | ❌ 無 |

→ 本 phase 結束後 baseline 應為 HEAD shifted by 1 commit（本文件）；其餘 100% 維持 night-12 之 baseline state。
