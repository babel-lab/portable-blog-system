# Blogger backfill missing `.publish.json` sidecar bootstrap writer（2026-07-18）

Session：`260718 / add missing-sidecar bootstrap writer`

- Date：2026-07-18（Asia/Taipei）
- Type：source implementation + targeted guard + minimal docs
- 上游 policy：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`（identity 分層 A.1 human / A.3 system；不猜 ID）
  - `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar）
  - `docs/publish-json-schema.md` §5.3 / §5.4（Blogger URL 為唯一真相；publishedAt 嚴格 ISO）
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（planner classification；本 writer 之上游）
- Predecessor / sibling tools：
  - `src/scripts/plan-blogger-backfill-sidecars.js`（planner；本 writer 之上游）
  - `src/scripts/backfill-published-url.js`（既有 sidecar 現地寫入 CLI；本 slice 不動）
  - `src/scripts/check-blogger-backfill.js`（父 guard；warning-only）

> ⚠️ 本工具**不含** Blogger 真值。
> Claude **不得猜** `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId`。
> 對六篇正式 `20260612-*` 之 apply 屬未來 slice；本 slice 只實作 writer capability + guard，**不**執行 production apply。

---

## 1. 目的

`bootstrap-blogger-backfill-sidecars` 對 planner 判定為 `MISSING_SIDECAR` 之 Blogger backfill candidate，依 Dean 提供之 manifest 建立缺漏之 `.publish.json`。

Writer 為 **create-only**：不覆寫、不 patch、不 merge、不 touch Markdown、不 touch 其他 sidecar；不呼叫 Blogger / Google API；不需網路；不需 credential。

---

## 2. 安全契約（fail-closed；hard-coded）

Writer 之預設是 dry-run：

- 直接執行 `bootstrap:blogger-backfill-sidecars -- --input <manifest.json>` 不會建立、修改、刪除或覆寫任何 `.publish.json`；只印出 mutation plan。
- 實際寫入需要 `--apply`。

Writer 拒絕下列 flag：

```text
--force
--overwrite
--replace
--merge
--yes / -y
```

任一出現即 hard-fail exit 1，且不進入 mutation 階段。**不**存在 force bypass；已存在 sidecar 一律 fail-closed。

Writer 之其他不變式：

- 只接受 manifest 明確提供之 human-supplied truth（`blogger.publishedUrl` / `blogger.publishedAt`）。
- 不接受 `blogger.bloggerPostId`（識別分層 A.3；系統欄位、Dean 取不到）；writer 一律寫為空字串 `""`，未來 Blogger API integration 落地時再由系統於 publish/update response 填入。
- 每筆 record 之 sourcePath 必須位於 `content/blogger/posts/`；不接受 `content/blogger/pages/` / `content/github/` / `content/drafts/` / `content/archive/`。
- 每筆 record 之 sourcePath 對應 Markdown 必須存在、frontmatter 可解析、為 Blogger candidate（`publishTargets.blogger.enabled === true` AND `status ∈ [ready, published]` AND `draft !== true`）。
- 每筆 target sidecar 必須尚不存在（create-only）；出現同 target 之兩筆 record 或跨 record 之重複 sourcePath 皆 fail-closed。
- 兩階段執行：全部 validation 通過後才進 mutation；任一筆 invalid → 零 mutation（不會出現「前 N 筆已寫、末筆失敗」）。
- 原子寫入：`writeFile` 走 `flag: 'wx'`（exclusive）寫至 `.tmp` → `rename` 目標；失敗清 `.tmp`；不建立額外目錄。
- 不 touch Markdown / 其他 sidecar / dist-* / deploy clone / gh-pages。
- 不呼叫 Blogger / Google API；不 fetch；不 spawn child process。

---

## 3. Sidecar body 產出（deterministic）

Writer 產出之 sidecar body 依 `content/templates/_sample.publish.json` 結構，去掉 `$comment`（`$comment` 僅範本用；正式文章之 `.publish.json` 不得包含，見 `docs/publish-json-schema.md` §1.3）：

```json
{
  "schemaVersion": 1,
  "canonical": { "url": "", "source": "auto" },
  "ogImage":   { "url": "", "alt": "" },
  "blogger": {
    "type": "post",
    "permalink": "",
    "status": "published",
    "publishedUrl":   "<manifest 提供>",
    "publishedAt":    "<manifest 提供>",
    "bloggerPostId":  "",
    "publishYear":    "<由 publishedAt 推導>",
    "publishMonth":   "<由 publishedAt 推導>",
    "history":        []
  },
  "github": { "slug": "", "path": "", "status": "draft", "publishedUrl": "", "publishedAt": "" },
  "seo":    { "metaTitle": "", "metaDescription": "", "robots": "index,follow" }
}
```

`publishYear` / `publishMonth` 由 `publishedAt` 之 **原始日期部分**（`YYYY-MM`）推導，不先換算 UTC；契約與 `docs/publish-json-schema.md` §5.4 一致（例：`2026-08-01T00:30:00+08:00` → `2026 / 08`；不會因執行機器 timezone 而改變）。

`blogger.status` 寫為 `"published"`：manifest 提供 publishedUrl + publishedAt 即代表該篇已於 Blogger 後台實際發布。`blogger.permalink` 留空字串，依 `docs/publish-json-schema.md` §5.2 之 fallback 回 `.md` frontmatter `slug`（writer 不從 slug 推導 Blogger 平台真值，亦不從 slug 猜測 `bloggerPostId`）。

---

## 4. Manifest shape（v1）

```json
{
  "schemaVersion": 1,
  "notes": "(optional; free-form; ignored by writer)",
  "records": [
    {
      "sourcePath": "content/blogger/posts/<file>.md",
      "blogger": {
        "publishedUrl": "https://<blogspot-domain>/YYYY/MM/<permalink>.html",
        "publishedAt":  "YYYY-MM-DD"
      }
    }
  ]
}
```

Field constraints：

- `schemaVersion` 必為 `1`（int）。
- `records` 為 array；元素可為 0 至 N 筆。
- 每筆 record 只允許 `sourcePath` / `blogger` 兩個 key。
- 每筆 `blogger` 只允許 `publishedUrl` / `publishedAt` 兩個 key。
- `publishedUrl` 必為 strict `http://` / `https://` URL，**不得**帶前後空白（value 逐字寫入，值本身即真值）。
- `publishedAt` 必為 strict ISO-8601（`YYYY-MM-DD` 或 `YYYY-MM-DDThh:mm[:ss][.frac][Z|±hh:mm]`）；不得帶空白；與 `backfill-published-url.js` 之 `resolvePublishedAt` 契約一致。
- `sourcePath` 必為 repo-relative POSIX-style、位於 `content/blogger/posts/`、以 `.md` 結尾且非 `.fb.md`。

任何 record 出現未列於白名單之欄位（包含 `bloggerPostId`）→ INVALID_RECORD、fail closed。

範例 manifest（**fixture only**；請勿冒充 production truth）：

```json
{
  "schemaVersion": 1,
  "records": [
    {
      "sourcePath": "content/blogger/posts/20260101-alpha.md",
      "blogger": {
        "publishedUrl": "https://example.blogspot.com/2026/01/alpha.html",
        "publishedAt": "2026-01-01"
      }
    }
  ]
}
```

---

## 5. Readiness 分類

Writer 之 plan 對每筆 record 標一種 readiness：

| Readiness | 說明 |
| --- | --- |
| `READY_FOR_WRITE` | 通過所有 validation；apply 時會建立此 sidecar |
| `INVALID_RECORD` | shape / schema / URL / date / prefix / 未知欄位錯誤 |
| `SOURCE_NOT_FOUND` | sourcePath 對應 Markdown 不存在 |
| `SOURCE_NOT_CANDIDATE` | Markdown frontmatter 不符合 candidate rule |
| `SIDECAR_ALREADY_EXISTS` | 目標 `.publish.json` 已存在（create-only） |
| `DUPLICATE_SOURCE` | 同 sourcePath 在 manifest 出現多次 |
| `DUPLICATE_TARGET` | 不同 sourcePath 指向同一 target sidecar |

Apply 只在**所有** record 都為 `READY_FOR_WRITE` 時進行；任一非 `READY_FOR_WRITE` → 零 mutation。

---

## 6. 執行方式

Dry-run（預設；無 mutation）：

```bash
npm run bootstrap:blogger-backfill-sidecars -- --input <manifest.json>
```

Dry-run JSON：

```bash
npm run bootstrap:blogger-backfill-sidecars -- --input <manifest.json> --json
```

Apply（實際寫入）：

```bash
npm run bootstrap:blogger-backfill-sidecars -- --input <manifest.json> --apply
```

Apply + JSON：

```bash
npm run bootstrap:blogger-backfill-sidecars -- --input <manifest.json> --apply --json
```

Help（含 create-only 與 defaults-to-dry-run 聲明）：

```bash
npm run bootstrap:blogger-backfill-sidecars -- --help
```

Guard：

```bash
npm run check:blogger-backfill-sidecar-bootstrap
```

Guard 於 OS temp 目錄之 synthetic tree 上跑實際 mutation；正式 repo 之 `.publish.json` inventory 於 guard 前後完全一致。

---

## 7. Exit codes

- `0`：normal completion
  - dry-run 且 manifest 完全 valid（`plan.ok === true`）
  - dry-run 且 manifest 完全空（0 records、無 blocked）
  - apply 且所有 record 皆成功寫入
- `1`：任一
  - malformed CLI（未知 flag / forbidden flag / `--input` 缺 / non-absolute `--repo-root`）
  - manifest 讀取 / parse / schema 錯
  - 任一 record readiness 非 `READY_FOR_WRITE`（含 apply 拒絕情境）
  - apply 過程中之 write 失敗

Apply 拒絕時仍會印出 plan 報表（human 或 JSON），並於 stderr 明示 refused + zero mutation。

---

## 8. Publication truth 不得猜測

無論任何情況，writer 都：

- **不**推導 / 猜測 `publishedUrl`（不由 slug / permalink / date 組出）。
- **不**推導 / 猜測 `publishedAt`（不 fallback 至當下時間）。
- **不**推導 / 猜測 `bloggerPostId`（識別分層 A.3；Dean 從後台無法取得；未來 Blogger API integration 落地時由系統 response 填入；本 writer 一律寫 `""`）。
- **不**推導 / 猜測 `bloggerBlogId`。
- **不**從 slug、title、URL、檔案時間推導任何 Blogger identifier。
- **不**由 `.md` frontmatter `date` 推導 Blogger `publishedAt`。

`--url` / `--published-at` 之驗證與 `backfill-published-url.js` 一致：URL 與 date 皆逐字寫入；不 trim；不正規化；帶空白或非 strict ISO 值於任何寫入前 fail-closed。

---

## 9. 未來 slice（本 slice 不做）

以下屬 future slice，各須另開 phase + Dean explicit approval：

- 對六篇正式 `20260612-*` 之 apply（需要 Dean 提供完整 truth manifest 且 explicit approval）
- Manifest reverse-engineering helper（從 planner output 提示 Dean 填哪些欄位）
- Blogger API credential / auth / publish / update flow
- Blogger `postId` capture after API publish / update（系統自動取得並寫入 A.3 欄位）
- 對 `PRESENT_INCOMPLETE` sidecar 之現地補值（現有 `backfill:url` 路徑處理，本 slice 不動）
- 拓展 manifest 接受欄位（`blogger.permalink` 明示、`seo.metaTitle` 覆寫、`canonical.source` 明示 等）
- 拓展 sourcePath 允許範圍（`content/blogger/pages/`）
- Site-wide 之 `include:` semantics（multi-file manifest 合併、schema 檢查）
- `--dry-run` 之顯式 flag（本 slice 之 dry-run 已為預設；不必顯式 flag）

---

## 10. 硬性聲明（不可違反）

- 本文件**不含** Blogger 真值。
- Writer 預設 dry-run；apply 需明確 `--apply`。
- Writer **不得** overwrite / patch / merge。
- Writer **不得** touch Markdown / 其他 sidecar / dist-* / gh-pages / deploy clone。
- Writer **不得** 呼叫 Blogger / Google API。
- Writer **不得** fabricate `bloggerPostId`（無論任何情境，該欄一律寫 `""`）。
- Writer **不得** 由 slug / title / URL / 檔案時間推導 Blogger truth。
- Guard 覆蓋須維持所有 mutation 斷言在 OS temp 目錄；**不得**暫改真實 repo 檔案後再還原。
- Guard 覆蓋須維持 source-level 靜態斷言：writer 原始碼不得含 `child_process` / `fetch(` / `node:http[s]` / `googleapis` / oauth 等 network 與外部呼叫 API。
- 現行 `check:blogger-backfill` / `backfill:url` / `check:blogger-backfill:one-post` / `plan:blogger-backfill-sidecars` 之定位與行為**不變**。
- 本 slice **不**升級任何 warning-only guard 為 blocking。
- 本 slice **不**觸發 build / deploy / preview / dist-* / Blogger 後台 / GA4 / AdSense。

---

## 11. 承接關係

- Predecessor：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`
  - `docs/20260706-blogger-backfill-write-target-inventory.md`
  - `docs/20260706-blogger-backfill-report-only-baseline.md`
  - `docs/20260706-blogger-backfill-value-intake-template.md`
  - `docs/publish-json-schema.md` §5
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`
- Sibling tools：
  - `src/scripts/check-blogger-backfill.js`（父 guard；warning-only）
  - `src/scripts/check-blogger-backfill-one-post.js`（單篇 dry-run）
  - `src/scripts/backfill-published-url.js`（現地 sidecar 寫入 CLI）
  - `src/scripts/plan-blogger-backfill-sidecars.js`（planner）
- New：
  - `src/scripts/bootstrap-blogger-backfill-sidecars.js`（writer；本 slice 落地）
  - `src/scripts/check-blogger-backfill-sidecar-bootstrap.js`（writer contract guard；本 slice 落地）
  - `package.json` scripts：`bootstrap:blogger-backfill-sidecars` / `check:blogger-backfill-sidecar-bootstrap`

本文件補足 missing-sidecar 分工線之最後一件事：**pre-write 之 deterministic missing-sidecar plan 已有 planner；本 slice 加上 create-only writer capability + guard**。實際對六篇 `20260612-*` 之 apply 仍等待 Dean 提供 truth manifest + explicit approval，屬未來 slice。
