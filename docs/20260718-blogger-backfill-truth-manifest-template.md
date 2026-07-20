# Blogger backfill truth-manifest template generator（2026-07-18）

Session：`260718 / add truth-manifest template generator`

> **Update（2026-07-20）**：generator 現支援 explicit selected coverage（可重複 `--source-path`）；
> 無 `--source-path` 時 full-coverage 預設行為與輸出**不變**。current runbook 見
> `docs/20260720-blogger-backfill-selected-coverage.md`。

- Date：2026-07-18（Asia/Taipei）
- Type：source implementation + targeted guard + minimal docs
- 上游 policy：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`（identity 分層 A.1 human / A.3 system；不猜 ID）
  - `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = `.publish.json` sidecar）
  - `docs/publish-json-schema.md` §5.3 / §5.4（Blogger URL / publishedAt 為唯一真相）
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`（planner classification；本工具重用其 structured result）
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`（writer manifest schema；本工具產物 = writer 輸入）
- Predecessor / sibling tools：
  - `src/scripts/plan-blogger-backfill-sidecars.js`（planner；本工具重用 `planMissingSidecars(...)`）
  - `src/scripts/bootstrap-blogger-backfill-sidecars.js`（writer；本工具產物之下游）
  - `src/scripts/backfill-published-url.js`（既有 sidecar 現地寫入 CLI；本 slice 不動）
  - `src/scripts/check-blogger-backfill.js`（父 guard；warning-only）

> ⚠️ 本工具**不含** Blogger 真值。
> Claude **不得猜** `publishedUrl` / `bloggerPostId` / `publishedAt` / `bloggerBlogId`。
> Generator 輸出之 template **不含** production truth；Dean 需人工從 Blogger 後台複製 `publishedUrl` / `publishedAt`。
> `bloggerPostId` 屬 identity 分層 A.3（system-supplied），template 完全**不含**該欄，未來 Blogger API integration 落地後由系統於 publish/update response 填入。

---

## 1. 目的

`prepare-blogger-backfill-truth-manifest` 對現行 planner 判定為 `MISSING_SIDECAR` 之 Blogger backfill candidates，產出一份 deterministic、人工可填寫、schema 與 `bootstrap-blogger-backfill-sidecars` **完全一致**之 truth manifest **template**。

Template 為**純輸出**（stdout）：本工具本身不建立、修改任何檔案；不呼叫 Blogger / Google API；不需網路；不需 credential。

生成之 template 之定位：

- 作為 planner（現況盤點）與 writer（真正建立 sidecar）之間的**安全橋接**。
- 讓 Dean 用一份確定 schema、確定範圍、確定內容之 JSON 檔案，逐格填入 Blogger 後台真值，然後交給 writer 進行 dry-run 驗證。
- 未填 template 直接交給 writer 會 fail-closed（writer 之 URL / ISO 驗證 reject 空字串），確保「未填 = 不寫」為 hard invariant，不依賴 human review。

---

## 2. 邊界（fail-closed）

Generator 是純 read-only：

- 執行前後 repo 檔案 bytes / mtime 均不變；
- 唯一 mutation channel = stdout（human-readable 文字 / `--json` envelope / `--manifest-only` 純 manifest）；
- 無 `--output` / `--write` / `--apply` / `--force` / `--overwrite` / `--merge` / `--yes` / `-y` / `--fix` 等 mutation-like flag，出現即 hard-fail exit 1；
- 不建立 template file；不修改 Markdown；不修改任何 sidecar；不動 `dist-*`；不動 gh-pages；不動 deploy clone；
- 不呼叫 Blogger / Google API；不需網路；不需 credential；
- 不透過 `child_process` 執行 planner CLI 再 parse console text；**直接** import `planMissingSidecars(...)` structured result；
- 不透過 `child_process` 呼叫 writer。

輸出 JSON **不含** `generatedAt` / `timestamp` / absolute machine path / hostname / OS-dependent separator / random ID。

---

## 3. Template schema（與 writer manifest v1 完全一致）

Template 之 top-level 恰為兩個 key（順序即輸出順序）：

```json
{
  "schemaVersion": 1,
  "records": [
    {
      "sourcePath": "content/blogger/posts/<file>.md",
      "blogger": {
        "publishedUrl": "",
        "publishedAt": ""
      }
    }
  ]
}
```

每筆 record 恰有兩個 top-level key（`sourcePath` 先，`blogger` 後）；`blogger` 恰有兩個 key（`publishedUrl` 先，`publishedAt` 後）。

Template **不**包含以下欄位（與 writer 之 `ALLOWED_RECORD_TOP_KEYS` / `ALLOWED_RECORD_BLOGGER_KEYS` 完全一致）：

- `bloggerPostId`（identity A.3；system-supplied；writer 一律寫 `""`）
- `permalink` / `type` / `status` / `history`
- `canonical` / `ogImage` / `github` / `seo`（皆由 writer 從 template default 值產出）
- 任何其他 writer 未接受欄位

未填 truth 之表示：`publishedUrl` 與 `publishedAt` 皆為空字串 `""`；writer 之 `isHttpUrl("") === false` 與 `resolvePublishedAt("")` 皆 fail-closed，dry-run 會 report `INVALID_RECORD` + `publishedUrl must be strict http(s):// URL` / `publishedAt is invalid`。

---

## 4. 執行方式

Human-readable summary（預設；stdout；unfilled template 之逐筆說明）：

```bash
npm run prepare:blogger-backfill-truth-manifest
```

完整 JSON envelope（planner scan result + template manifest + excluded list + summary；`mutationPerformed: false`）：

```bash
npm run prepare:blogger-backfill-truth-manifest -- --json
```

純 manifest（可直接存檔後餵給 bootstrap writer `--input`）：

```bash
npm run prepare:blogger-backfill-truth-manifest -- --manifest-only
```

Help（含 no-write / never-fabricates 聲明）：

```bash
npm run prepare:blogger-backfill-truth-manifest -- --help
```

Guard：

```bash
npm run check:blogger-backfill-truth-manifest
```

Guard 覆蓋 template shape、determinism、writer schema 一致性、no-write（fixture bytes / mtime 執行前後不變）、forbidden flag hard-fail、source-level 無 write API / 無 child_process / 無 network / 無 Blogger API import 之靜態斷言、**與 writer 之整合往返**（temp fixture 內以 `--apply` 完成一次 create-only 寫入）、real-repo template = 六篇 20260612-* candidates，且 production `.publish.json` inventory 前後不變。

---

## 5. Exit behavior

- Exit 0：normal completion（human-readable / `--json` / `--manifest-only` 皆為 read-only 成功）
- Exit 1：任一
  - unknown flag
  - forbidden flag（`--apply` / `--write` / `--output` / `--out` / `--force` / `--overwrite` / `--replace` / `--merge` / `--yes` / `-y` / `--fix`）
  - `--json` 與 `--manifest-only` 同時出現（mutually exclusive）
  - non-absolute `--repo-root`

publication truth 尚未提供**不**當作 command failure（generator 之工作即為產出等待填寫之 template）。

---

## 6. Recommended workflow（Dean 未來 slice；本 slice 不執行）

1. 現況盤點：
   ```bash
   npm run plan:blogger-backfill-sidecars
   ```
2. Preview template（human-readable summary，確認要 bootstrap 的候選為預期）：
   ```bash
   npm run prepare:blogger-backfill-truth-manifest
   ```
3. Emit pure manifest 至檔案（filename 由 Dean 決定；本 slice **不**建議固定路徑；本工具**不**主動寫檔）：
   ```bash
   npm run prepare:blogger-backfill-truth-manifest -- --manifest-only > <path>
   ```
4. Dean 於**本機、非 tracked** location 逐筆填入 Blogger 後台真值（`publishedUrl` / `publishedAt`）。
5. Dry-run 驗證：
   ```bash
   npm run bootstrap:blogger-backfill-sidecars -- --input <path>
   ```
   全部 `READY_FOR_WRITE` 前**不得** apply。
6. 明確授權後才 apply：
   ```bash
   npm run bootstrap:blogger-backfill-sidecars -- --input <path> --apply
   ```
   仍需獨立 phase + explicit approval；本 slice **不**執行 apply。

---

## 7. Publication truth 不得猜測

無論任何情況，generator 都：

- **不**推導 / 猜測 `publishedUrl`（不由 slug / permalink / date 組出）
- **不**推導 / 猜測 `publishedAt`（不 fallback 至當下時間）
- **不**推導 / 猜測 `bloggerPostId`（identity A.3；template 完全不含該欄）
- **不**推導 / 猜測 `bloggerBlogId`
- **不**從 slug、title、URL、檔案時間推導任何 Blogger identifier
- **不**由 `.md` frontmatter `date` 推導 Blogger `publishedAt`

Blogger 平台真值只能由 Dean 從 Blogger 後台複製提供（human-supplied 部分），或由未來 Blogger API integration 之 response 取得（system-supplied 部分）。

---

## 8. 未來 slice（本 slice 不做）

以下屬 future slice，各須另開 phase + Dean explicit approval：

- 對六篇正式 `20260612-*` 之 production truth 填寫（Dean human input）
- 對六篇正式 `20260612-*` 之 bootstrap `--apply`（實際建立 sidecar）
- Blogger API credential / auth / publish / update flow
- Blogger `postId` capture after API publish / update
- 對 `PRESENT_INCOMPLETE` sidecar 之現地補值（`backfill:url` 路徑；本 slice 不動）
- 拓展 template output 至 `PRESENT_INCOMPLETE`（現階段刻意排除；避免 template 與 writer create-only 語意衝突）
- `--output` flag（本 slice 刻意不支援；避免自動化寫入 tracked location）
- Cloudflare / CNAME / AdSense / GA4 / build / deploy

---

## 9. 硬性聲明（不可違反）

- 本文件**不含** Blogger 真值。
- Generator **不得**建立任何 template 檔案於 tracked location。
- Generator **不得** touch Markdown / sidecar / dist-* / gh-pages / deploy clone。
- Generator **不得** 呼叫 Blogger / Google API。
- Generator **不得** fabricate `bloggerPostId`（template 完全不含該欄）。
- Generator **不得** 由 slug / title / URL / 檔案時間推導 Blogger truth。
- Generator **不得** 透過 `child_process` 呼叫 planner 或 writer；planner 之 structured result 以 in-process import 重用。
- Guard 覆蓋須維持所有 mutation 斷言在 OS temp 目錄；**不得**暫改真實 repo 檔案後再還原。
- Guard 覆蓋須維持 source-level 靜態斷言：generator 原始碼不得含 `fs.writeFile` / `fs.mkdir` / `fs.rm` / `fs.rename` / `fs.unlink` / `fs.copyFile` / `child_process` / `fetch(` / `node:http[s]` / `googleapis` / oauth。
- 現行 `check:blogger-backfill` / `backfill:url` / `check:blogger-backfill:one-post` / `plan:blogger-backfill-sidecars` / `bootstrap:blogger-backfill-sidecars` 之定位與行為**不變**。
- 本 slice **不**升級任何 warning-only guard 為 blocking。
- 本 slice **不**觸發 build / deploy / preview / dist-* / Blogger 後台 / GA4 / AdSense。

---

## 10. 承接關係

- Predecessor：
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`
  - `docs/20260706-blogger-backfill-write-target-inventory.md`
  - `docs/20260706-blogger-backfill-report-only-baseline.md`
  - `docs/publish-json-schema.md` §5
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`
- Sibling tools：
  - `src/scripts/plan-blogger-backfill-sidecars.js`（planner）
  - `src/scripts/bootstrap-blogger-backfill-sidecars.js`（writer；本工具 template 之下游）
  - `src/scripts/backfill-published-url.js`（現地 sidecar 寫入 CLI）
- New：
  - `src/scripts/prepare-blogger-backfill-truth-manifest.js`（generator；本 slice 落地）
  - `src/scripts/check-blogger-backfill-truth-manifest.js`（generator contract guard；本 slice 落地）
  - `package.json` scripts：`prepare:blogger-backfill-truth-manifest` / `check:blogger-backfill-truth-manifest`

本文件補足 missing-sidecar 分工線上「planner → truth manifest → writer」之中間層：先 preview 缺口與 truth 欄位、以確定 schema 之 template 承接 Dean 之人工填寫，然後才進 writer dry-run 驗證與後續明確授權 apply。實際對六篇 `20260612-*` 之 production truth 填寫、bootstrap apply 仍等待 Dean 明確授權，屬未來 slice。
