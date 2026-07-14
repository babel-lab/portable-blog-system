# GitHub 文章退回草稿 / 重新上架 生命週期契約（2026-07-14）

## 0. 目的與範圍

Dean 需求（2026-07-14）：GitHub 文章能安全地

```
READY／已上架 → 退回草稿（暫時下架）→ 未來沿用相同 slug 與 URL 重新上架
```

這是**文章生命週期與建置行為**的安全切片，**不是永久刪除**。「退回草稿」與「永久刪除」是不同概念：

| 概念 | Markdown 原始檔 | git history | slug / 日期 / metadata | 正式站可見 | 未來可重新上架 |
| --- | --- | --- | --- | --- | --- |
| **退回草稿（本契約）** | 保留 | 保留 | 保留 | 否（暫時 404） | 是（沿用原 slug） |
| 永久刪除（**本次不做**） | 刪除 | （不改寫） | 失去 | 否 | 否 |

本 session **不做**：Admin UI 寫回 repository／自動 commit／push／觸發 deploy、永久刪除、改寫 git history、Blogger API 寫入、Blogger 下架、任意修改現有正式文章狀態、deploy repository 修改、無關重構。

## 1. 既有行為結論：GitHub build 已正確實現退回草稿（Section A）

以**實際程式碼與 build 行為**（非文件推測）確認，退回草稿所需的建置行為**現況已全部正確**，因此本 session **不重寫既有架構**，改為補強契約 guard + 測試。

### 1.1 唯一狀態判斷：`classify()`

`src/scripts/load-posts.js` 的 `classify()` 是「文章是否進正式輸出」的唯一判斷：

```js
if (data.draft === true) return { include: false, reason: 'draft:true' };
const status = data.status ?? 'draft';               // 缺省視為 draft
if (!VISIBLE_STATUS.has(status)) return { include: false, reason: `status:${status}` };
return { include: true, reason: 'ok' };              // VISIBLE_STATUS = { ready, published }
```

State matrix（本 session guard 以真實 `classify()` 驗證）：

| status | draft | 結果 | 說明 |
| --- | --- | --- | --- |
| `ready` | `false` / 缺省 | **include** | 正常上架 |
| `published` | `false` / 缺省 | **include** | 正常上架 |
| `ready` | `true` | exclude | 矛盾 → draft 保守勝出（隱藏） |
| `published` | `true` | exclude | 矛盾 → draft 保守勝出（隱藏） |
| `draft` | `false` | exclude | 矛盾 → status 保守勝出（隱藏） |
| `draft` | `true` | exclude | 一致草稿 |
| `archived` | 任意 | exclude | 已封存 |
| 缺省 | 任意 | exclude | 預設 draft |

**設計特性：偏向隱藏（fail-safe）** —— 任一欄位指向隱藏即隱藏，永不誤上架。

### 1.2 退回草稿後不產出 HTML、不進列表／索引／sitemap

- `build-github.js` 的 `loadGithubPosts()` 只回傳 `classify().include === true` 的 posts；draft 篇目根本不進 `posts` 陣列 → 不寫 `posts/<slug>/index.html`。
- home / post-list / category / tag / prev-next 全部由 `listingPosts`（過濾後 posts 再套 `shouldIncludeInListings`）派生 → draft 從所有列表與索引消失。
- `build-sitemap.js` 同樣用 `loadGithubPosts()` + `shouldIncludeInSitemap` → draft 不進 `sitemap.xml`。

### 1.3 stale HTML 已修復（Phase C1-G1）

退回草稿的關鍵風險 = 第一次上架 build 後殘留舊 HTML。已於 Phase C1-G1 修復：

- `build-github.js:main()` 於寫入任何 page 前 `fs.rm(PAGES_DIR, { recursive: true, force: true })` 整棵清除 `.cache/pages`。
- `vite.config.js` build `emptyOutDir: true` 清空 `dist/`；rollup input 只掃 `.cache/pages/**/*.html`。
- 既有 `check:github-build-cache-hygiene`（2/2）守護 PAGES_DIR 清除；本 session 新 guard 額外鎖 `vite emptyOutDir: true`。

### 1.4 端到端實證（2026-07-14 正式 build）

`npm run build:github -- --mode=build`：scanned 20 / ready 4 / filtered 16。真實案例 `content/github/posts/20260504-github-pages-blog-planning.md`（`draft: true`，曾上架後退回草稿）：

- `dist/posts/github-pages-blog-planning/` **不存在**（無 stale HTML → 重新部署後該 URL 404）。
- `dist/sitemap.xml` 0 筆該 slug。
- 沿用同 slug 重新上架（`status: ready` + `draft: false`）→ 恢復 `posts/github-pages-blog-planning/index.html`（同輸出路徑、同公開 URL）。

## 2. 唯一補強缺口：矛盾狀態靜默通過（Section C）

content 過濾（`classify`）發生在 `validate-content.js` **之前**，validator 只看到過濾後的 posts。因此矛盾狀態
（`status:ready`+`draft:true`、`status:draft`+`draft:false`）雖被 `classify()` **安全隱藏**，卻**不會產生任何 warning**。

這是 republish 的真實 footgun：Dean 重新上架時若只改一半（例：改 `status:ready` 卻忘了把 `draft:true` → `false`），
文章仍被隱藏且**無提示**。

既有 schema **沒有** status⇔draft 一致性規則（`VALID_STATUS` 只檢單一欄位合法值；無跨欄位一致性檢查）。
本 session 採**最小補強**：新增 warning-only 掃描（見 §3），不發明與既有 `classify` 不相容的規則、不改 `classify` 語意。

## 3. 本 session 落地物

| 檔案 | 必要性 |
| --- | --- |
| `src/scripts/load-posts.js`（改） | `function classify` → `export function classify`。additive named export，行為不變（`loadPosts` 內部沿用同函式）；供 guard 以**真實**函式驗證，避免另抄規格 drift。 |
| `src/scripts/check-github-redraft-lifecycle.js`（新） | lifecycle/build contract guard。 |
| `package.json`（改） | 註冊 `check:github-redraft-lifecycle`。 |
| `docs/20260714-github-redraft-lifecycle-contract.md`（新） | 本契約文件。 |

### 3.1 `check:github-redraft-lifecycle` 斷言

Hard-fail（任一失敗 exit 1）：

1. **state matrix**（10 案）：以真實 `classify()` 驗證 §1.1 全表。
2. **redraft round-trip**：同 slug `ready → draft → ready` 之 `include` 為 `true → false → true`（編碼需求：退回草稿移除輸出、重新上架沿用同 slug 恢復同輸出路徑）。
3. **stale HTML 契約**：`build-github.js` 於寫入前清除 `PAGES_DIR`；`vite.config.js` build `emptyOutDir === true`。

Warning-only（不影響 exit code；`classify` 已保守隱藏）：

4. 掃全部 `content/github/posts` + `content/blogger/posts` 之 `.md`，列出 status⇔draft 矛盾。**production 期望 0 筆**（本 session 量測 0 筆）。

Guard 為唯讀：不 build / deploy / dev server / fetch / pull、不寫檔、不改 content／frontmatter、不碰 gh-pages / deploy clone。

## 4. 驗證結果（2026-07-14）

| 檢查 | 結果 |
| --- | --- |
| `check:github-redraft-lifecycle`（新） | **13 / 0** + 矛盾掃描 0 筆 |
| `validate:content` | 0 error / 135 warning / 107 post（baseline 一致，無 regression） |
| `check:npm-script-targets` | 61/61（+1 新 target） |
| `check:github-build-cache-hygiene` | 2/2 |
| `check:phase1-readiness` | commit 後 16/16（跑於未 commit 時，唯一 fail = working-tree-dirty，屬預期） |
| `build:github --mode=build` | PASS（scanned 20 / ready 4 / filtered 16） |
| `build:sitemap` | PASS（17 url entries；draft slug 0 筆） |

## 5. 已知限制（Known limitations）

- **Admin UI 尚無 repository write 能力**：`admin-markdown-export.js` 為純字串組裝（無 fs／fetch／IO），且永遠輸出 `status:"draft"` + `draft:true`；`admin-write-cli.js` 之 `--apply` 仍 dormant／Dean-gated。因此**退回草稿與重新上架目前仍需 Dean 手動編輯 Markdown frontmatter（切換 `status`／`draft`），再重新 build／deploy**。本 session 只建立／補強底層生命週期與建置契約，不接 Admin 寫入。
- **重新部署才會生效**：退回草稿後原公開 URL 成為 404，前提是重新 build **並 deploy**（同步 `dist/` → gh-pages）。deploy 屬 Dean-gated，本 session 未執行。
- **`content/blogger/posts` 之 GitHub 契約**：矛盾掃描一併掃 blogger 來源（因其可經 `publishTargets.github.enabled` 鏡射進 GitHub build），但 Blogger 平台端下架另屬 Blogger 手動流程，不在本契約範圍。
- **既有 stale smoke（非本 session 造成）**：direct-node `check-github-draft-metadata.js`（**非** package script、**不**在任何 readiness chain）hard-pin `content/github/posts/2026-07-01-github-pages-build-preview-workflow.md` 必須為 draft；該篇已於先前 commit `b4b8ecc` 重新上架為 `published`，故該 smoke 現為 10/1（pre-existing）。依「不任意修改現有正式文章狀態／無關重構」原則本 session 不動它；若要清除，應另開 slice 更新或退役該 draft-pinned smoke。

## 6. 建議下一步（各須 Dean explicit approval）

- 更新／退役 `check-github-draft-metadata.js`（該篇已重新上架，draft-pin 已過時）。
- 若要真正實現「Admin UI 一鍵退回草稿」→ 屬 Admin write path（dormant），須另開 phase + preflight approval。
- 退回草稿後之實際 deploy（使 URL 生效 404）→ Dean-gated deploy slice。
