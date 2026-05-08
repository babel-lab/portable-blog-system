# Sidecar I/O Helper 設計

本文件為 Phase 8-b-1 之 sidecar I/O helper 設計文件。**僅設計、不實作、不接入 `load-posts.js`**。

對應之上層規範：
- `docs/publish-bundle.md`（總則）
- `docs/publish-json-schema.md`（`.publish.json` 欄位字典）
- `docs/fb-sidecar-schema.md`（`.fb.md` 規格）

實作落地批次：**8-b-2**（純實作 helper，不接入 load-posts）。

---

## §1 Purpose

本文件**只設計** sidecar I/O helper 之 API、return shape、責任邊界，**不實作、不接入 `load-posts.js`、不改 `validate-content.js`、不改 build 流程**。

設計目的：

- 為後續 8-b-2 純實作批次提供精確 API 規格
- 為 8-b-3 / 8-b-4 / 8-b-5 之 sidecar 合併與 warning 規則奠定接口
- 隔離「機械式 I/O」與「業務驗證」兩種責任，避免 helper 越界

本文件**不**涵蓋：
- helper 之具體實作 code
- merge 邏輯（sidecar 與 frontmatter 之欄位優先序合併）
- schema 欄位深度驗證
- placeholder 解析
- pages/ 路徑支援（屬延後批次）

---

## §2 Sidecar File Naming and Location

### 2.1 一對一對應

每篇 `.md` 文章對應**最多兩個** sidecar 檔案：

```
content/{site}/posts/{slug}.md
content/{site}/posts/{slug}.publish.json    ← 跨平台發布回填
content/{site}/posts/{slug}.fb.md            ← Facebook 推廣文案
```

`{site}` 為 `github` 或 `blogger`，與 `docs/publish-bundle.md` §1.2 一致。

### 2.2 規則

- **同資料夾**：sidecar 必須與 `.md` 在同一目錄
- **同檔名前綴**：`{slug}` 必須完全一致
- **不同副檔名**：`.publish.json` / `.fb.md`
- **不掃描全域 sidecar**：不在 `content/templates/`、`content/settings/`、其他平行資料夾尋找
- **不尋找替代位置**：sidecar 必須與 `.md` 同層；不向上（`..`）或向下（子目錄）找

### 2.3 檔名推導規則

給定 `markdownPath`（指向 `.md` 之路徑）：

```
publishJsonPath = <dir of markdownPath>/<basename without .md>.publish.json
fbMdPath        = <dir of markdownPath>/<basename without .md>.fb.md
```

範例：

```
markdownPath     = "content/github/posts/foo.md"
publishJsonPath  = "content/github/posts/foo.publish.json"
fbMdPath         = "content/github/posts/foo.fb.md"
```

### 2.4 不適用範圍

- 範本檔（`content/templates/_sample*`）不視為「文章 + sidecar」之關係，本 helper 不為範本而設計
- `pages/` 路徑於本批設計中**暫不涵蓋**；屬延後批次

---

## §3 Helper Module

### 3.1 候選檔案位置

```
src/scripts/load-sidecars.js
```

於 8-b-2 批次新增；**本批（8-b-1）只寫設計文件，不新增此 `.js` 檔**。

### 3.2 候選函式 API

```
getSidecarPaths(markdownPath)
readPublishSidecar(markdownPath)
readFacebookSidecar(markdownPath)
readPostSidecars(markdownPath)
```

### 3.3 各函式職責

| 函式 | 職責 | 回傳 |
|---|---|---|
| `getSidecarPaths(markdownPath)` | 純路徑推導，不做 I/O | `{ publishJsonPath, fbMdPath }` |
| `readPublishSidecar(markdownPath)` | 讀取 `.publish.json`，容錯 parse | 詳見 §4 |
| `readFacebookSidecar(markdownPath)` | 讀取 `.fb.md`，容錯 gray-matter parse | 詳見 §5 |
| `readPostSidecars(markdownPath)` | 一次讀取兩個 sidecar；內部呼叫上述兩函式 | `{ publish: ..., facebook: ... }` |

### 3.4 設計原則

- 全部 async（使用 `node:fs/promises`）
- **不拋例外**（除程式錯誤如 invalid argument）；I/O 與 parse 失敗皆以 issue 物件回報
- 不做合併、不做 schema 深度驗證、不做 placeholder 解析

---

## §4 `readPublishSidecar` Return Shape

```
{
  exists: boolean,
  path: string,
  data: object | null,
  issues: Array<Issue>
}
```

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `exists` | boolean | `.publish.json` 是否存在於推導之路徑 |
| `path` | string | 推導出的 `.publish.json` 路徑（相對 PROJECT_ROOT） |
| `data` | object \| null | `JSON.parse` 結果；`exists=false` 或 parse 失敗時為 `null` |
| `issues` | Array | 低階 I/O 與 parse 階段之 issue（結構詳見 §6） |

### 4.1 行為

| 情境 | `exists` | `data` | `issues` |
|---|---|---|---|
| 檔案不存在 | `false` | `null` | `[]` |
| 檔案存在但 JSON.parse 失敗 | `true` | `null` | `[publish-json-parse-failed]` |
| 檔案存在且 parse 成功 | `true` | parsed 物件 | `[]` |
| 檔案存在但內容為空字串 | `true` | `null` | `[sidecar-empty-file]` |
| `fs.readFile` 失敗（非 ENOENT） | `false`（保守值） | `null` | `[sidecar-read-failed]` |

### 4.2 不在 helper 階段做的事

- **schema 欄位完整性**（缺 top-level key、缺必填子欄位、enum 違規）→ 留給 `validate-content`
- **schema 型別檢查**（`schemaVersion` 非 number、`blogger.type` 非字串）→ 留給 `validate-content`
- **欄位衝突檢查**（與 frontmatter 同欄位值不同）→ 留給後續 merge / validate-content
- **`$comment` 欄位處置**（範本允許、正式檔不允許）→ 留給 `validate-content`

`.publish.json` parse 成功後即視為「raw data 通過低階 I/O」，後續業務驗證屬其他層。

---

## §5 `readFacebookSidecar` Return Shape

```
{
  exists: boolean,
  path: string,
  data: object | null,
  body: string,
  issues: Array<Issue>
}
```

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `exists` | boolean | `.fb.md` 是否存在 |
| `path` | string | 推導出的 `.fb.md` 路徑（相對 PROJECT_ROOT） |
| `data` | object \| null | gray-matter 解析之 frontmatter；`exists=false` 或 parse 失敗時為 `null` |
| `body` | string | gray-matter 解析之 body 段；純文字保留；`exists=false` 或 parse 失敗時為 `""` |
| `issues` | Array | 低階 I/O 與 parse 階段之 issue |

### 5.1 行為

| 情境 | `exists` | `data` | `body` | `issues` |
|---|---|---|---|---|
| 檔案不存在 | `false` | `null` | `""` | `[]` |
| YAML frontmatter parse 失敗 | `true` | `null` | `""` | `[fb-md-parse-failed]` |
| 檔案存在且 parse 成功 | `true` | frontmatter 物件 | body 字串 | `[]` |
| 檔案存在但內容為空字串 | `true` | `null` | `""` | `[sidecar-empty-file]` |
| `fs.readFile` 失敗（非 ENOENT） | `false`（保守值） | `null` | `""` | `[sidecar-read-failed]` |

### 5.2 body 處置原則（強制）

- **`.fb.md` body 保留純文字**
  - 不丟給 `parse-markdown.js`
  - 不 render 為 HTML（FB 不解析 markdown，render 只會破壞貼文格式）
- **`.fb.md` body 不在 helper 階段解析 placeholder**
  - `{{ articleUrl }}` / `{{ blogger.publishedUrl }}` / `{{ github.publishedUrl }}` / `{{ canonicalUrl }}` 等 placeholder 留待後續 build / promotion 階段（屬 8-c 範圍）
  - helper 階段 body 字串維持原樣，含 placeholder 文字
- **body 結尾換行 / 多空行保留**
  - 段落分隔屬 FB 貼文格式之一部分，不做 trim

### 5.3 不在 helper 階段做的事

- **frontmatter 欄位 enum 驗證**（`enabled` 非 boolean、`target` 非列舉值）→ 留給 `validate-content`
- **placeholder 解析失敗判定**（依 status × severity 矩陣）→ 留給後續 build / 8-c
- **`page` 欄位是否在 `promotion.config.json`**→ 留給 `validate-content`
- **與 frontmatter `promotion.facebook` 之衝突檢查**→ 留給後續 merge / validate-content

---

## §6 Issue Object Format

```
{
  severity: "warning" | "error",
  type: string,
  message: string,
  sidecarPath: string
}
```

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `severity` | enum | `"warning"` 或 `"error"` |
| `type` | string | issue 類型代碼（kebab-case，與 `validate-content` 命名風格一致） |
| `message` | string | 人讀說明（可空字串）；建議含原始錯誤摘要（如 `JSON.parse error: ...`） |
| `sidecarPath` | string | 對應之 sidecar 路徑（相對 PROJECT_ROOT） |

### 6.1 helper 階段至少列出之 issue type

| `type` | `severity` | 觸發條件 |
|---|---|---|
| `publish-json-parse-failed` | error | `.publish.json` 存在但 `JSON.parse` 失敗 |
| `fb-md-parse-failed` | error | `.fb.md` 存在但 gray-matter 解析失敗（YAML 不合法、缺 `---` 分隔等） |
| `sidecar-read-failed` | error | `fs.readFile` 失敗（非 ENOENT 之 I/O 錯誤，如權限問題） |
| `sidecar-empty-file` | warning | sidecar 檔案存在但內容為空字串（0 bytes 或全空白） |

### 6.2 不在 helper 階段列出之 issue

下列 issue 屬其他層職責，**helper 不檢測、不產生**：

- schema 欄位缺漏 / enum 違規（屬 `validate-content`）
- sidecar 與 frontmatter 同欄位衝突（屬合併層 / `validate-content`）
- `status === "published"` 之必填欄位（屬 `validate-content`）
- placeholder 未解析（屬 build / 8-c）
- `publishedUrl` 與 yyyy/mm pattern 一致性（屬 `validate-content` §9.5～§9.6）

---

## §7 Responsibility Boundary with `validate-content.js`

### 7.1 helper 只負責

| 職責 | 說明 |
|---|---|
| 檔案定位 | 依 markdownPath 推導 sidecar 路徑（§2.3） |
| 讀取 | `fs.readFile` 容錯 |
| parse | `JSON.parse` / gray-matter 容錯 |
| 低階 I/O issue | parse failed / read failed / empty file（§6.1） |

### 7.2 `validate-content` 負責

| 職責 | 對應規範 |
|---|---|
| schema 欄位檢查（top-level keys、必填欄位、enum） | `publish-json-schema.md` §9.1～§9.3、`fb-sidecar-schema.md` §3.1 |
| sidecar / frontmatter 欄位衝突 | `publish-bundle.md` §3.2 |
| `status === "published"` 條件下之必填欄位 | `publish-json-schema.md` §8.2 |
| placeholder 未解析（依 status × severity 矩陣） | `fb-sidecar-schema.md` §7.2 |
| `publishedUrl` 與 `publishYear`/`publishMonth`/URL yyyy/mm 一致性 | `publish-json-schema.md` §9.5～§9.6 |

### 7.3 設計原則

- helper 是**機械式 I/O 層**，不參與業務邏輯
- `validate-content` 是**業務驗證層**，依 helper 提供之 raw data 做進一步檢查
- 兩層**不共享狀態**；helper 不知道 frontmatter，`validate-content` 不負責 I/O

---

## §8 Responsibility Boundary with `load-posts.js`

### 8.1 helper 不合併資料

helper 只回傳 sidecar 之 raw 結構：
- `publishSidecar.data`：整個 `.publish.json` 物件（top-level 6 個 key + 子欄位）
- `fbSidecar.data`：`.fb.md` 之 frontmatter（7 個欄位）
- `fbSidecar.body`：`.fb.md` 之 body 字串（保留原樣）

helper **不**做下列事：

- 不合併到 post 物件
- 不決定欄位優先序（sidecar vs frontmatter）
- 不寫 fallback 邏輯（如「`canonical.url` 為空時 fallback 至 `frontmatter.canonical`」）
- 不修改 frontmatter 內容
- 不主動讀取 `.md` 檔（呼叫者自行讀）

### 8.2 load-posts 或後續 merge helper 才合併

8-b-3 / 8-b-4 / 8-b-5 / 8-b-6 批次將：

- 在 `load-posts.js` 流程中呼叫 `readPostSidecars(markdownPath)`
- 將 sidecar `data` 合併到 post 物件（依 `publish-bundle.md` §3 之 sidecar 勝、frontmatter fallback 原則）
- 呼叫 `validate-content` 之 warning 機制處理衝突與 schema 違規

### 8.3 本批不設計完整 merge 邏輯

完整 merge 邏輯（欄位優先序、衝突處置、fallback 順序）屬後續批次。本文件僅列**接口需求**：

- helper 必須回傳「足以判斷 sidecar 是否存在」的資訊（`exists`）
- helper 必須回傳「足以做 parse 級錯誤判斷」的資訊（`issues`）
- helper 必須回傳「足以做後續合併」的資料（`data`、`body`）
- 不得隱藏或改寫任何來自 sidecar 的原始欄位
- 不得偷偷對 sidecar data 做型別轉換（例如把字串 `"true"` 轉成 boolean）

---

## §9 Compatibility when No Sidecar Exists

### 9.1 無 sidecar 之回傳

兩 sidecar 皆不存在時：

```
readPostSidecars(markdownPath) === {
  publish: {
    exists: false,
    path: "<推導路徑>",
    data: null,
    issues: []
  },
  facebook: {
    exists: false,
    path: "<推導路徑>",
    data: null,
    body: "",
    issues: []
  }
}
```

### 9.2 對既有 post 物件之影響

helper 本身**不改變既有 post 物件**。

於 8-b-2（helper 純實作、不接入 load-posts）期間，呼叫 helper 不影響 `load-posts` 行為，不影響 build output。

### 9.3 對 build output 之承諾

8-b-3 / 8-b-4 接入 load-posts 後，**無 sidecar 情境下 build output 應維持 byte-identical**。具體做法：

- merge 邏輯遇 `exists === false` 時直接跳過，不對 post 物件做任何寫入
- 既有 frontmatter fallback 路徑完全不動
- 不引入新的副作用（例如不寫 log 到 `dist-reports/`、不變更排序穩定性）

對應 `docs/publish-bundle.md` §9.1（Phase 8-a 之 byte-identical 承諾）原則延伸：在無 sidecar 之既有文章上，8-b 系列實作後 build 結果應仍 byte-identical。

byte-identical 之自檢機制（如 `dist/` 目錄整體 sha256 比對）建議於 8-b-3 起加入，做為 regression guard。

---

## §10 Next Batch Recommendation: 8-b-2

### 10.1 範圍

**實作 helper（純寫，不接入 load-posts）**。

### 10.2 最小修改檔案

| 動作 | 檔案 |
|---|---|
| 新增 | `src/scripts/load-sidecars.js`（含 §3.2 之 4 個函式） |
| **不修改** | `src/scripts/load-posts.js` |
| **不修改** | `src/scripts/validate-content.js` |
| **不修改** | `src/scripts/parse-markdown.js` |
| **不修改** | 任何 `docs/` |
| **不修改** | 任何 `content/templates/` |
| **不修改** | 任何 `content/{site}/posts/*.md` |
| **不修改** | `package.json` / `vite.config.js` |
| **不修改** | `src/views/` / `src/styles/` |

### 10.3 修改目標

依 §4 / §5 / §6 之 return shape 與 issue type 列舉實作；對應 §7 / §8 之責任邊界（helper 不越界）。

### 10.4 驗收方式

- **不執行 build**
- **不執行 validate-content**
- **不接入 load-posts**
- 用既有 sample 檔人工檢查：
  - `content/templates/_sample.publish.json` → `readPublishSidecar` 應回傳 `exists=true`、`data` 為 7 top-level key 物件（含 `$comment`）、`issues=[]`（注意：`$comment` 為範本特例，schema 例外見 publish-json-schema.md §1.3，helper 不檢測）
  - `content/templates/_sample.fb.md` → `readFacebookSidecar` 應回傳 `exists=true`、`data` 為 7 欄位 frontmatter、`body` 為示範文案字串（含 `{{ articleUrl }}` placeholder 原樣保留）、`issues=[]`
  - 不存在的 slug → 兩函式皆回 `exists=false, issues=[]`
- 可寫一支簡單的 manual smoke script（**不入 npm scripts**、**不入 git**）人工跑

### 10.5 設計原則

- helper 不接入 `load-posts`
- helper 不改 `validate-content`
- 不執行 build
- 不執行 validate-content（避免在 helper 完成前出現 false positive warning）
- 不 commit（依使用者後續指令）
- 不引入新依賴（沿用既有 `gray-matter`）

### 10.6 未在 8-b-2 範圍

- merge 邏輯（屬 8-b-3 起）
- pages/ 路徑支援（延後批次）
- placeholder 解析（屬 8-c）
- schema 欄位深度驗證（屬 `validate-content`）
- byte-identical 自檢機制（屬 8-b-3 起）

---

（本文件結束）
