# Phase 8-b 完成報告

本文件為 Phase 8-b（load-posts sidecar 整合 + contentKind 相容 + pages 路徑支援）之整體驗收與完成紀錄。

對應之上層規範詳見：
- `docs/publish-bundle.md` §7.2（Phase 8-b 範圍定義）
- `docs/sidecar-io-helper-design.md`（8-b-1 sidecar I/O helper 設計）

---

## §1 Phase 8-b 目標

依 `docs/publish-bundle.md` §7.2：「於 `load-posts` 流程整合 `.publish.json` 與 `.fb.md` 之讀取與合併。sidecar 不存在時 fallback 到 frontmatter；同欄位衝突列 warning。本階段不改變 build 產物之輸出格式。」

實際交付範圍（執行中擴充）：
- sidecar I/O helper 設計與實作（含 `.publish.json` / `.fb.md`）
- 將 sidecar metadata + raw data 掛入 post 物件之 `sidecars` namespace
- `type` → `contentKind` 在 load-posts 與 validate-content 之相容讀取與 warning
- sidecar / frontmatter 欄位 overlap warning（presence-only 檢查）
- `content/{site}/pages/**/*.md` 與 `posts/` 並列之雙路徑支援，獨立陣列、獨立 totals

非範圍（明確不做）：
- 欄位映射（將 sidecar 欄位寫入 post top-level 既有欄位如 `post.canonical` / `post.cover` / `post.blogger` 等）
- placeholder 解析（`{{ articleUrl }}` 等）
- `.publish.json` / `.fb.md` schema 深度驗證
- EJS template 改動 / build output 變更

---

## §2 Commit 清單

| 批次 | Commit | 訊息標題 |
|---|---|---|
| 8-b-1 | `13f30fd` | docs(phase-8b): add sidecar io helper design |
| 8-b-2 | `5a1be12` | feat(phase-8b): add sidecar io helper |
| 8-b-3 | `e2fbe55` | feat(phase-8b): normalize contentKind from legacy type |
| 8-b-4 | `0a1794a` | feat(phase-8b): attach publish sidecar metadata to posts |
| 8-b-5 | `a7f3227` | feat(phase-8b): attach facebook sidecar metadata to posts |
| 8-b-6 | `2626fa3` | feat(phase-8b): warn on sidecar frontmatter field overlap |
| 8-b-7 | `2d2681a` | feat(phase-8b): load page markdown with sidecars |

線性歷史，無 amend、無 rebase。

---

## §3 每批完成內容摘要

### 3.1 8-b-1 sidecar I/O helper 設計（文件先行）

新增 `docs/sidecar-io-helper-design.md`（10 節）：

- §2 sidecar 命名與位置規則（同資料夾、同檔名前綴、不同副檔名）
- §3 helper module 候選 API：`getSidecarPaths` / `readPublishSidecar` / `readFacebookSidecar` / `readPostSidecars`
- §4 / §5 兩個 sidecar reader 之 return shape 規格
- §6 issue object 格式與 4 種 type 列舉（`publish-json-parse-failed` / `fb-md-parse-failed` / `sidecar-read-failed` / `sidecar-empty-file`）
- §7 / §8 與 `validate-content.js` / `load-posts.js` 之責任邊界
- §9 無 sidecar 之 byte-identical 承諾

### 3.2 8-b-2 sidecar I/O helper 實作（純寫，不接入）

新增 `src/scripts/load-sidecars.js`（≈232 行）：

- 4 個 export：`getSidecarPaths` / `readPublishSidecar` / `readFacebookSidecar` / `readPostSidecars`
- 全部 async，不 throw（除程式錯誤）；I/O 與 parse 失敗皆轉為 issues
- ENOENT 處理：`exists: false`、不視為 error
- 不接入 `load-posts.js`、不改 `validate-content.js`、不改 build 行為

### 3.3 8-b-3 type → contentKind 相容讀取

修改 `src/scripts/load-posts.js`：
- 在 frontmatter 解析後加入 `contentKind: data.contentKind ?? data.type` normalization
- 不刪除原 `type` 欄位（保留作 debug 與相容）

修改 `src/scripts/validate-content.js`：
- `VALID_TYPE` → `VALID_CONTENT_KIND`，新增 `'page'` 列舉值
- `invalid-type` → `invalid-content-kind`（檢查目標改為 `post.contentKind`）
- 新增 `frontmatter-uses-deprecated-type` warning（提示舊 type 欄位）
- 新增 `contentkind-and-type-conflict` warning（兩者並存且值不同）

### 3.4 8-b-4 `.publish.json` 合併進 load-posts

修改 `src/scripts/load-posts.js`：
- import `readPublishSidecar`（only，未 import 其他 helper）
- 每筆 post 始終新增 `post.sidecars.publish = { exists, path, issues }`
- 條件式新增 `post.publish = <raw .publish.json data>`（僅當 `exists && data` 時）
- **不**做欄位映射（不寫 `post.canonical` / `post.cover` / `post.blogger` / `post.github` / `post.metaTitle` 等）

### 3.5 8-b-5 `.fb.md` 合併進 load-posts

修改 `src/scripts/load-posts.js`：
- import 擴充至 `{ readPublishSidecar, readFacebookSidecar }`
- 並行 `Promise.all` 讀取兩個 sidecar
- 每筆 post 始終新增 `post.sidecars.facebook = { exists, path, data, body, issues }`
- body 保留純文字（未經 `parse-markdown.js`、未解析 placeholder）
- **無**新增 `post.facebook` top-level 欄位（避免與既有 frontmatter / EJS 衝突）
- `post.sidecars.publish` / `post.publish` 維持 8-b-4 行為不變

### 3.6 8-b-6 sidecar / frontmatter 欄位 overlap warning

修改 `src/scripts/validate-content.js`（純新增 +65 行）：
- 新增 `PUBLISH_OVERLAP_FIELDS`（11 欄位）與 `FB_OVERLAP_FIELDS`（8 欄位）常數
- 新增 `sidecar-frontmatter-overlap` warning type（單一 type，於 `value` 標明欄位與來源）
- presence-only 檢查（不比較值）
- sidecar 不存在或 `data` 為 null 時跳過
- 嚴格 warning（無新 error），不阻擋 build

### 3.7 8-b-7 pages/ 路徑支援

修改 `src/scripts/load-posts.js`（+116 −78，refactor）：
- 抽出共用 helper `processMarkdownEntry(absPath, sourceCollection)` 與 `sortByDateThenSlug` 比較器
- 新增 `content/{site}/pages/**/*.md` 獨立 glob，並行於 posts glob（`Promise.all`）
- pages 與 posts 共用同一處理流程（contentKind / sidecars / sort）
- 每筆 entry / filtered 新增 `sourceCollection: 'posts' | 'pages'` 標記
- 回傳新增 additive 欄位：`pages` / `filteredOutPages` / `pagesTotalScanned` / `pagesTotalReady` / `pagesTotalFiltered`
- `posts` / `filteredOut` / `totalScanned/Ready/Filtered` 既有語意完全保留

---

## §4 post / pages entry 結構摘要

posts 與 pages 共用同一 entry shape（差異僅 `sourceCollection` 值不同）：

```
{
  // 來自 frontmatter 之攤平欄位（sourceCollection 之外）
  ...frontmatter,                        // 含 title, slug, date, tags, category, ... 等

  // 8-b-3 normalize
  contentKind: <data.contentKind 或 fallback 自 data.type>,

  // 8-b-7 來源標記
  sourcePath: <PROJECT_ROOT 相對路徑>,
  sourceCollection: 'posts' | 'pages',

  // 既有
  bodyLength: <markdown body 長度>,
  body: <markdown body 字串，未 render HTML>,

  // 8-b-4 + 8-b-5 sidecar metadata（始終存在）
  sidecars: {
    publish: { exists, path, issues },
    facebook: { exists, path, data, body, issues },
  },

  // 8-b-4 條件式：僅當 .publish.json 存在且 parse 成功時
  publish: <raw .publish.json 物件>,
}
```

---

## §5 sidecars.publish 結構摘要

```
sidecars: {
  publish: {
    exists: boolean,            // .publish.json 是否存在於推導路徑
    path: string,               // 推導之 .publish.json 路徑（PROJECT_ROOT 相對）
    issues: Array<Issue>,       // helper 階段之低階 I/O / parse issues
  }
}
```

對應之四種情境：

| 情境 | `exists` | `post.publish` | `issues` |
|---|---|---|---|
| 檔案不存在 | `false` | 欄位不存在 | `[]` |
| 存在且 parse 成功 | `true` | `<raw data>` | `[]` |
| 存在但 JSON parse 失敗 | `true` | 欄位不存在 | `[error: publish-json-parse-failed]` |
| 空檔（`raw.trim() === ''`） | `true` | 欄位不存在 | `[warning: sidecar-empty-file]` |

---

## §6 sidecars.facebook 結構摘要

```
sidecars: {
  facebook: {
    exists: boolean,            // .fb.md 是否存在
    path: string,               // 推導之 .fb.md 路徑（PROJECT_ROOT 相對）
    data: object | null,        // gray-matter 解析之 frontmatter
    body: string,               // gray-matter 解析之 body 段（純文字保留）
    issues: Array<Issue>,
  }
}
```

對應情境同 §5。

**重要原則**：
- `body` 為原始字串，**未 render HTML**（FB 不解析 markdown）
- `body` 內之 `{{ articleUrl }}` 等 placeholder **未解析**（屬 8-c / build 階段）
- 不新增 `post.facebook` top-level 欄位（與 publish 之 `post.publish` 設計不對稱，因應 frontmatter 既有 `promotion.facebook` 之潛在衝突避險）

---

## §7 contentKind 相容規則摘要

### 7.1 load-posts.js 之 normalize

```js
const normalizedData = {
  ...data,
  contentKind: data.contentKind ?? data.type,
};
```

- `data.contentKind` 為主
- `data.contentKind` 不存在但 `data.type` 存在 → fallback 至 `data.type`
- 兩者皆無 → `contentKind` 為 `undefined`（不報錯，依 8-b-3 指令延後 required 規則）
- 原 `data.type` 欄位**不刪除**（保留作 debug 與相容期）

### 7.2 validate-content.js 之 warning（皆 severity: warning）

| Warning type | 觸發條件 |
|---|---|
| `invalid-content-kind` | `post.contentKind !== undefined && !VALID_CONTENT_KIND.has(post.contentKind)` |
| `frontmatter-uses-deprecated-type` | `post.type !== undefined && post.contentKind === post.type`（即 contentKind 來自舊 type 之相容讀取，或兩者並存且值相同） |
| `contentkind-and-type-conflict` | `post.type !== undefined && post.contentKind !== undefined && post.type !== post.contentKind` |

`VALID_CONTENT_KIND` = `{ post, tech-note, book-review, download, comic, life-note, page }`。

兩條 deprecated-type 與 conflict warning 互斥（一個要求兩值相等，另一個要求不同）。

---

## §8 overlap warning 規則摘要

單一 warning type **`sidecar-frontmatter-overlap`**，於 `value` 區分欄位與來源。

### 8.1 觸發條件（presence-only）

對於 `PUBLISH_OVERLAP_FIELDS` 中之每個欄位：
- `post[field] !== undefined`
- AND `post.publish[field] !== undefined`（含 `post.publish` 為 truthy object 之 guard）

對於 `FB_OVERLAP_FIELDS` 中之每個欄位：
- `post[field] !== undefined`
- AND `post.sidecars.facebook.data[field] !== undefined`（含 `exists === true` 與 `data` 為 truthy 之 guard）

### 8.2 欄位清單

`PUBLISH_OVERLAP_FIELDS`（11 項）：
`title` / `description` / `excerpt` / `slug` / `canonicalUrl` / `publishedUrl` / `status` / `tags` / `category` / `contentKind` / `type`

`FB_OVERLAP_FIELDS`（8 項）：
`title` / `description` / `excerpt` / `url` / `canonicalUrl` / `publishedUrl` / `tags` / `hashtags`

### 8.3 行為承諾

- ✅ sidecar 不存在 → 跳過（不 warn）
- ✅ sidecar 存在但對應欄位不存在 → 跳過該欄位
- ✅ 不比較值（presence-only）
- ✅ 不改 post 欄位、不覆蓋、不阻擋
- ✅ severity 一律 `warning`，不升 error
- ✅ exit code 不因 warning 變成 1（沿用既有 `errorCount > 0` 才退出 1 之邏輯）

---

## §9 pages 支援目前邊界

### 9.1 已支援（8-b-7 範圍內）

- `loadPosts({ site })` 同時掃描 `content/{site}/posts/` 與 `content/{site}/pages/`
- pages 通過與 posts **完全相同**之處理流程：
  - frontmatter 解析（gray-matter）
  - `classify(data)` 過濾（draft / status:ready/published）
  - 8-b-3 contentKind 相容
  - 8-b-4 / 8-b-5 sidecar 接入
  - sort by date desc, slug asc
- 每筆 entry / filtered 標記 `sourceCollection: 'posts' | 'pages'`
- 回傳新增 additive 欄位（不破壞既有 callers）

### 9.2 尚未支援（屬後續階段）

- pages 之 EJS template 渲染（`build-github.js` / `build-blogger.js` 仍只讀 `posts`，pages 對它們透明）
- pages 之 route / slug / outputPath 邏輯
- pages 之 sitemap 加入
- pages 之 validate-content 規則差異化（目前與 posts 共用同一規則集；若 page 有不同必填欄位，需另設規則）
- pages 之 cross-posting 至 Blogger Page 區（屬 Phase 8-d 之後）

### 9.3 callers 影響

驗收 grep 確認所有 `loadPosts({ site })` 之 callers 皆採 `const x = await loadPosts(...)` pattern，**未 destructure 強制特定欄位集合**：

| Caller | 用途 | 對 pages 之態度 |
|---|---|---|
| `validate-content.js` | 驗證 ready/published posts | 只讀 `.posts` / `.filteredOut`，pages 透明 |
| `build-promotion.js` | 產 FB 推廣 .txt | 只讀 `.posts`，pages 透明 |
| `build-github.js` | 產 GitHub Pages dist | 只讀 `.posts`，pages 透明 |
| `build-sitemap.js` | 產 sitemap.xml | 只讀 `.posts`，pages 透明 |
| `export-build-report.js` / `report-*.js` / `check-*.js` / `load-blogger-posts.js` | reports / checks | 只讀 `.posts`，pages 透明 |

新增 `pages` / `filteredOutPages` / `pagesTotal*` 屬 **additive** 變更，零破壞性。

---

## §10 尚未做事項（明確界定）

### 10.1 Placeholder 解析

`.fb.md` body 中之 `{{ articleUrl }}` / `{{ blogger.publishedUrl }}` / `{{ github.publishedUrl }}` / `{{ canonicalUrl }}` placeholder **未在 8-b 階段解析**。

- 屬 Phase 8-c 範圍（依 `docs/fb-sidecar-schema.md` §5 / §7.2 之 status × severity 矩陣）
- 目前 body 為原始字串，含 placeholder 文字保留

### 10.2 Schema 深度驗證

`.publish.json` 與 `.fb.md` 之 schema 深度驗證**未在 8-b 實作**：
- top-level keys 完整性檢查
- 必填欄位（依 status）檢查
- enum 違規檢查
- yyyy/mm URL pattern 一致性
- publishYear/publishMonth 與 publishedAt 推導之一致性

helper 階段僅檢查 parse 成功與否；validate-content 階段於 8-b 僅新增 contentKind 相容與 overlap warning，未補上 schema 規則。

屬 Phase 8-c 之後階段範圍。

### 10.3 EJS template 輸出接入

`src/views/` 下之 EJS 模板**未修改**：
- `post.publish` / `post.sidecars` 等新欄位**不**被任何 template 讀取
- pages 不被任何 template 渲染
- post detail / post list / sitemap / Blogger 匯出之 HTML 結構完全不變

### 10.4 build output 變更

- `dist/` / `dist-blogger/` / `dist-promotion/` 之輸出**完全不變**
- 對既有文章（無 sidecar）：byte-identical
- 對含 sidecar 之新文章：尚未走任何 template，不產生新 output
- pages 不被 build script 處理

### 10.5 欄位映射

不做 sidecar → post top-level 之欄位映射：
- ✗ `publishSidecar.canonical.url` → `post.canonical`
- ✗ `publishSidecar.ogImage.url` → `post.cover`
- ✗ `publishSidecar.blogger` → `post.blogger`
- ✗ `publishSidecar.github` → `post.github`
- ✗ `publishSidecar.seo.metaTitle` → `post.metaTitle`
- ✗ `facebookSidecar.body` → `post.promotion.facebook.message`

屬未來階段（sidecar 勝、frontmatter fallback 之欄位優先序設計）。

### 10.6 pages/ 渲染與 cross-posting

詳見 §9.2。

### 10.7 CLAUDE.md / docs 對齊

`docs/seo-ga4-adsense.md:474` 仍含舊 `invalid-type` 引用（屬路徑 C 之後 docs 對齊批次未處理之殘留）。屬未來 docs 對齊批次。

---

## §11 驗收指令與結果

### 11.1 執行之驗收指令

| 指令 | 用途 |
|---|---|
| `git status` | 確認 working tree clean |
| `git log --oneline -12` | 確認 8-b-1～8-b-7 commit 鏈完整 |
| `git remote -v` | 確認未設 remote |
| `node --check src/scripts/load-posts.js` | 語法檢查 |
| `node --check src/scripts/load-sidecars.js` | 語法檢查 |
| `node --check src/scripts/validate-content.js` | 語法檢查 |
| `npm run validate:content` | 內容驗證 |
| Grep 多個關鍵字 | 確認 8-b-1～8-b-7 各功能存在 |

未執行 build（依本批禁令）。

### 11.2 Grep 驗收結果

| 驗收項 | 結果 |
|---|---|
| `load-sidecars.js` exports（4 個函式） | ✅ getSidecarPaths / readPublishSidecar / readFacebookSidecar / readPostSidecars |
| ENOENT 處理 | ✅ `if (err.code === 'ENOENT')` 之分支存在於兩 reader 內 |
| `data.contentKind ?? data.type` | ✅ load-posts.js line 62 |
| `VALID_CONTENT_KIND` + 7 列舉值 | ✅ validate-content.js line 25 |
| 3 條 contentKind warning | ✅ `invalid-content-kind` / `frontmatter-uses-deprecated-type` / `contentkind-and-type-conflict` |
| 舊 `VALID_TYPE` / `invalid-type` 已不存在 | ✅ Grep 0 matches in src/ |
| `readPublishSidecar` import | ✅ load-posts.js line 11 |
| `sidecars.publish` / `post.publish` | ✅ |
| `readFacebookSidecar` import + `sidecars.facebook` | ✅ |
| `post.facebook = ` 之 top-level 賦值 | ✅ 0 matches（**未新增** top-level，符合設計）|
| `sidecar-frontmatter-overlap` warning | ✅ validate-content.js 兩處（publish + fb）|
| `severity: 'error'` 新增於 8-b-6 | ✅ 0（既有 error 規則皆 5-g-3 既有）|
| `pagesPattern` / `pagesFiles` / `sourceCollection` / `pages` / `filteredOutPages` / `pagesTotal*` | ✅ 全部存在於 load-posts.js |

### 11.3 Syntax 檢查

```
load-posts.js syntax-ok
load-sidecars.js syntax-ok
validate-content.js syntax-ok
```

### 11.4 Validate-content 結果

```
[validate-content] post: content/github/posts/20260504-github-pages-blog-planning.md
[validate-content]   - [WARNING] body-leading-h1
[validate-content]   - [WARNING] frontmatter-uses-deprecated-type: tech-note
[validate-content] post: content/github/posts/20260504-portable-blog-system-mvp.md
[validate-content]   - [WARNING] body-leading-h1
[validate-content]   - [WARNING] frontmatter-uses-deprecated-type: tech-note
[validate-content] 0 error(s) / 4 warning(s) on 2 post(s)
```

| 指標 | 數量 | 來源 |
|---|---|---|
| Errors | 0 | — |
| Warnings | 4 | 2x `body-leading-h1`（Phase 7-fix-1 既有）+ 2x `frontmatter-uses-deprecated-type`（8-b-3 新增規則正確命中）|
| Exit code | 0 | warnings 不阻擋 |

**符合預期**：
- 兩篇既有 posts 仍用 `type: "tech-note"`，被 8-b-3 之 deprecated-type warning 正確命中
- 無 sidecar → 無 `sidecar-frontmatter-overlap` warning
- 無 sidecar → 無 sidecar parse error
- 無 `invalid-content-kind`（`tech-note` 屬合法值）
- 無 `contentkind-and-type-conflict`（無文章兩值並存）

### 11.5 Caller 兼容性

執行 `Grep loadPosts(` 確認所有 callers 採 `const x = await loadPosts(...)` pattern，未 destructure 嚴格欄位集合 → 新增 `pages` / `filteredOutPages` / `pagesTotal*` 屬 additive，零破壞性。

---

## §12 下一階段建議

### 12.1 可立刻啟動之候選

| 階段 | 範圍 | 風險 |
|---|---|---|
| **Phase 8-c：placeholder 解析 + status × severity 矩陣** | 在 build-promotion 階段解析 `.fb.md` body 之 `{{ articleUrl }}` 等 placeholder；validate-content 加 placeholder 未解析之 status × severity warning | 中（首次接入 placeholder；status 條件邏輯較複雜）|
| **Phase 8-d：欄位映射 + sidecar 勝 / frontmatter fallback** | 將 `post.publish.canonical.url` 寫入 `post.canonical`、`post.publish.ogImage` 對應 `post.cover` 等；EJS template 改讀整合後欄位 | 高（首次改變 build output；需大量回歸測試 byte-identical）|
| **CLAUDE.md / docs 對齊批次** | 補正 `docs/seo-ga4-adsense.md` 之舊 `invalid-type` 引用、補入 `page` 列舉 | 低（純 docs，零功能影響）|
| **schema 深度驗證批次** | 在 validate-content 加入 `.publish.json` / `.fb.md` schema 規則（top-level keys / enum / required） | 中（規則多，noise 風險高）|

### 12.2 建議優先序

1. **Phase 8-c**：placeholder 解析屬 sidecar 真正生效之關鍵（FB 推廣連結需要正確 URL）；待 placeholder 完成後 `.fb.md` 才有實用價值
2. **CLAUDE.md / docs 對齊**：可獨立小批次處理，不阻擋 8-c
3. **schema 深度驗證**：可與 8-c 平行設計，落地時機看 noise 控制
4. **Phase 8-d**：建議**最後**——欄位映射改變 build output，需在所有相依規則穩定後再進行

### 12.3 不建議方向

- 直接接入 EJS template 而跳過 placeholder：會輸出含未解析 placeholder 之內容，破壞 FB 推廣
- 一次合併 8-c + 8-d：影響範圍過大，回歸測試成本高
- 跳過 schema 驗證直接合併欄位：欄位語意錯誤可能寫入錯誤 build output

---

（本文件結束）
