# Blogger backfill sidecar identity contract audit（2026-07-19）

Session：`260719 / audit blogger backfill sidecar payload contract and apply-readiness`

- Date：2026-07-19（Asia/Taipei）
- Type：docs-only audit conclusion（**no** source / content / sidecar / deploy mutation this slice）
- Baseline audited：source `HEAD = origin/main = 7f9fccb`（subject `feat(backfill): add validated truth apply planner`）；deploy `HEAD = origin/gh-pages = 0eaf9c6`。
- Audit scope：`bloggerPostId` field contract across schema、writer、validator、apply-plan gate、downstream consumers、production sidecar precedent、Git history。

> ⚠️ 本文件**不含** Blogger 真值。**不**授權 apply / write / build / deploy / Blogger API。**不**填任何 production `bloggerPostId`。

---

## 1. 核心問題與結論

**核心問題**：以下 payload 片段：

```json
{ "bloggerPostId": "" }
```

在 `plan:blogger-backfill-truth-apply` 產出之 exact apply payload 中，是（a）schema 明確允許之「已知 URL / 發布時間，但 Blogger ID 尚未取得」狀態、（b）僅適合 template / preview / rehearsal 之暫時值、（c）production `.publish.json` 不得接受之缺失 identity、還是（d）互相矛盾之契約？

**結論 = Decision A**：`bloggerPostId: ""` 為 **schema 明確允許之 incomplete-identity state**，代表「sidecar 已具備 human-supplied truth（`publishedUrl` / `publishedAt`），但 A.3 之 system-supplied Blogger ID 尚待未來 Blogger API integration 由系統填入」。此契約於 schema / writer / validator / consumers / production precedent 中一致，**無矛盾**。

---

## 2. 權威來源（authorities）

本結論以下列既有 authorities 為證據；本文件**不**新設契約，僅**consolidate**現行契約之審計結論。

| Authority | 位置 | 對 `bloggerPostId` 之陳述 |
| --- | --- | --- |
| Schema §5.2 | `docs/publish-json-schema.md` | `bloggerPostId: string, 選填, 預設 ""`；「Blogger 後台之文章 / 網頁 ID」 |
| Schema §8.2 | `docs/publish-json-schema.md` | `blogger.status === "published"` 之**必填**欄位 = `permalink` / `publishedUrl` / `publishedAt`；**未列** `bloggerPostId` |
| Identity strategy §A.2 | `docs/20260706-blogger-identity-and-backfill-strategy.md` | `bloggerPostId` 屬 Blogger internal ID；Dean 從一般後台介面**無法直接取得**；**不得**列為人工 backfill 必填 |
| Identity strategy §A.3 | 同上 | `bloggerPostId` 之正確歸屬 = **系統取得**；未來 Blogger API / publish / update flow 落地後由系統於 response 取得並保存 |
| Identity strategy §B | 同上 | 不猜 ID：不由 title / slug / URL / date / GitHub metadata 推測任何 Blogger internal identifier |
| Bootstrap writer schema | `src/scripts/bootstrap-blogger-backfill-sidecars.js` §head + `ALLOWED_RECORD_BLOGGER_KEYS` | manifest 只接受 `sourcePath` + `blogger.{publishedUrl, publishedAt}`；**明確拒絕** `bloggerPostId` key（guard T5c 驗證此拒絕） |
| `buildSidecarBody` | 同上 line 242 | `bloggerPostId: ''` 硬編碼；「system-supplied per identity strategy A.3 (never fabricated)」 |
| Apply-plan gate 契約 | `docs/20260719-blogger-backfill-truth-apply-plan.md` §1 / §9 / §11 | plan payload「byte-identical modulo `bloggerPostId` 之 system-supplied 填值」；fingerprint informational；apply-plan gate 存在**不**授權任何 apply / write |

---

## 3. 現行 production sidecar inventory（唯讀）

於 baseline `7f9fccb` 執行 `Glob content/**/*.publish.json` 之結果：

| 檔案 | `bloggerPostId` | `publishedUrl` | `publishedAt` | 備註 |
| --- | --- | --- | --- | --- |
| `content/blogger/posts/20260515-we-media-myself2.publish.json` | `""` | ✅ 已回填 | ✅ 已回填 | **live-published Blogger post**；符合 schema §5.2 optional + §8.2 published-required；`validate:content` = 0 error |
| `content/blogger/posts/20260525-draft-book-review.publish.json` | `""` | `""` | `""` | draft；符合 schema §8.2 draft 皆選填 |
| `content/templates/_sample.publish.json` | `""` | `""` | `""` | 範本檔（含 `$comment`；正式文章不得複製 `$comment`） |
| `content/templates/_sample-from-frontmatter.publish.json` | `"1234567890123456789"` | (示例) | (示例) | 假想搬遷範本；示例已填之 sidecar 長相 |

**Production precedent**：`we-media-myself2.publish.json` 為 **live-published Blogger post**，其 `bloggerPostId: ""` 與 `publishedUrl` / `publishedAt` 已回填之組合，於 schema、validate、check-blogger-backfill 均**合法**，且已於現行 baseline 產生 `check:blogger-backfill` 之 warning-only report（非 blocker）。**此 precedent 是現行有效狀態，非歷史殘留。**

七篇 Blogger backfill 候選（於 `plan:blogger-backfill-sidecars` 之 candidate discovery）目前狀態：
- 6 篇 `20260612-*` = `MISSING_SIDECAR`（`.publish.json` 不存在）
- 1 篇 `20260515-we-media-myself2` = `PRESENT_COMPLETE`（human-supplied 已備妥；system-supplied `bloggerPostId` 為空但不 block readiness，屬 `NO_ACTION_REQUIRED`）
- 本 Session **不**修改任一狀態。

---

## 4. Downstream consumer matrix（真實行為）

以下矩陣以 baseline `7f9fccb` 之 `Grep bloggerPostId` 為完整列舉，涵蓋所有 read / classification / API construction path：

| Consumer | 用途 | 對 `""` 之行為 | 對 missing 之行為 | write capability | production relevance |
| --- | --- | --- | --- | --- | --- |
| `src/scripts/check-blogger-backfill.js` | 父 guard；report-only | `isPresent(v)` → `false` → warning-only（不 block） | 同「`""`」 | ❌ | ✅ 每次 `validate:content` 附帶 baseline |
| `src/scripts/plan-blogger-backfill-sidecars.js` | 分類 candidate 之 sidecarStatus / readiness | `isPresentValue` → `false` → 分類為 A.3 system-supplied missing → **informational only**；readiness = `NO_ACTION_REQUIRED`（若 human-supplied 均具備） | 同「`""`」 | ❌ | ✅ candidate discovery |
| `src/scripts/bootstrap-blogger-backfill-sidecars.js` | `.publish.json` create-only writer | writes `""` unconditionally（`buildSidecarBody` hardcoded） | manifest 若含 `bloggerPostId` key → hard-fail `INVALID_RECORD`（guard T5c） | ✅（create-only；只寫 `""`） | future apply（本 Session 不執行） |
| `src/scripts/plan-blogger-backfill-truth-apply.js` | validated apply-plan gate | 重用 `buildSidecarBody`；payload 之 `bloggerPostId` 恆為 `""` | 同「`""`」 | ❌（`writePerformed: false` 恆真） | future review（本 Session 不執行） |
| `src/scripts/backfill-published-url.js` | 補回 URL / publishedAt 於 sidecar | `--blogger-post-id` 為**選填** CLI flag；未提供則 skip 該欄位 | 未提供即不觸該欄位 | ✅（現行僅寫 URL / publishedAt / status / publishYear / publishMonth；`bloggerPostId` 需 explicit CLI 傳入才寫，須通過 `isNumericString` 檢查） | 未來人工回填（本 Session 不執行） |
| `src/scripts/admin-article-lookup.js` | Admin dev-mode-only read | 產出 `hasBloggerPostId: b.bloggerPostId && b.bloggerPostId.trim() !== ''`（**boolean 旗標；非 identity string**） | 同「`""`」 | ❌ | Admin dev route（noindex；不進 prod build） |
| `src/views/blogger/blogger-copy-helper.ejs` | Blogger 發布 checklist copy helper | 顯示 `bloggerPostId: "<從 Blogger 後台取得>"` 提示（純作者 checklist 文本，**非 API 構造**） | 同「`""`」 | ❌ | 人工發布 checklist（不 build API） |
| `src/scripts/build-blogger.js` / `build-github.js` / `blogger-render.js` / `blogger-preview-plan.js` / `build-blogger-preview.js` / `load-blogger-posts.js` / `load-github-posts.js` / `build-sitemap.js` / `normalize-post-output.js` / `ga4-url-builder.js` / view partials | GitHub / Blogger build / preview / render / SEO / GA4 pipeline | **完全不讀 `bloggerPostId`**（`Grep` 於 build path 內僅命中「不猜 ID」之 policy 註解） | 同 | ❌ | build / preview |
| `src/scripts/validate-content.js` | production validator | **完全無** `bloggerPostId` 提及 | 同 | ❌ | 每次 `npm run validate:content` |

**Blogger / Google API integrations**：`Grep "from ['\"]googleapis|require\(['\"]googleapis|import.*google-auth|blogger\.v3|blogger\.googleapis\.com|fetch\(.*blogger"` 於整個 repo 命中 = **0 個 production integration**（3 個命中皆為 guard 之 static ban 斷言，非實際 API 呼叫）。CLAUDE.md §29 明確：Blogger API auto publish 為第一版**永禁**。

**危險形狀（`sidecar.bloggerPostId || fallback` / `posts.update({postId: sidecar.bloggerPostId})` / `posts/${bloggerPostId}` 等）**：**0 命中**。所有 consumer 對 `""` 皆採 "not present" 語意；無任何 API path 會以 `""` 建構請求。

---

## 5. `plan:blogger-backfill-truth-apply` wording audit

檢核 baseline `7f9fccb` 版本之 human / JSON / docs 輸出，對照 Session §7 之審核清單：

| 檢核項 | 現行 wording | 判定 |
| --- | --- | --- |
| 是否暗示「validation PASS = production apply-ready」？ | 輸出恆帶 footer「`Planning only. / No files were created, modified, renamed, or deleted. / Production apply was not performed.`」；JSON `writePerformed` 恆為 `false`；`mode: "plan-apply"`；USAGE header 明說 "future writer apply（另 slice；本 slice 不執行）" | **不暗示**；wording 精確 |
| 是否暗示「exact payload 一定可以寫入」？ | 每筆 planned create 之 full payload 於 human output 內以 JSON 區塊完整顯示（含 `bloggerPostId: ""`）供人工審核；文件 §1 / §9 明說「byte-identical modulo `bloggerPostId` 之 system-supplied 填值」 | **不暗示**；顯示為 "for review"，非 "cleared for apply" |
| 是否暗示「fingerprint = approval」？ | `docs/20260719-blogger-backfill-truth-apply-plan.md` §7：「Fingerprint 為 informational。本 slice **不**實作 approval token / apply-time 強制比對。」；source line 132-133 USAGE：「The fingerprint is informational: ... It does not, by itself, authorize apply.」 | **不暗示**；wording 精確 |
| 是否暗示「empty `bloggerPostId` 不構成 blocker」？ | 依 Decision A，此為**正確暗示**：empty `bloggerPostId` 於 schema § 5.2 / §8.2 確實非 blocker（optional，不在 published-required 清單）；符合現行 production `we-media-myself2` precedent | **正確**；不需修改 |

**結論**：`Overall: PASS` + 完整 planning-only footer + `writePerformed: false` + fingerprint informational 之組合，於 Decision A 語境下**wording 已精確**。無需修改。

---

## 6. Fingerprint contract audit

`plan-blogger-backfill-truth-apply.js` `fingerprintPlan()` 之輸入：

```
sha256(canonicalJSON({
  planSchemaVersion,
  manifestSchemaVersion,
  entries: [{ sourcePath, targetPath, operation, payload }]
}))
```

payload **含** `bloggerPostId`（值恆為 `""`）。因此：

| 契約問題 | 答覆 |
| --- | --- |
| 未來 post ID 從 `""` 變成真值時，fingerprint 是否必然改變？ | **是**。payload 之 `blogger.bloggerPostId` 變化 → canonical JSON 變化 → sha256 變化。此為結構性必然，非需另外斷言。 |
| Fingerprint 是否可能被誤認為已批准 final production payload？ | 依 docs / USAGE / source docstring，答案 = **不**。三處均明說 informational + no approval semantics。 |
| Docs 是否明確說明 fingerprint 只綁定當下 payload、不代表 payload 已完整或已核准？ | **是**（§7 §11） |
| 若 plan 被標記 blocked（validation FAIL），是否仍輸出 fingerprint？ | **不輸出**。source line 473-479：validation FAIL 時 `fingerprint = null`；human output 顯示 `(not emitted; validation failed)`。 |
| 若輸出 blocked-plan fingerprint，其語意是否清楚？ | N/A（blocked 時不輸出）。 |

**結論**：fingerprint contract 於 Decision A 下**已一致**。無需修改。

---

## 7. Decision A：確認條款

依 Session §5 - Decision A 所要求之條款：

- **空字串代表什麼**：`bloggerPostId` 之 A.3 system-supplied 欄位尚未由未來 Blogger API integration 之 response 填入；schema 允許之 incomplete-identity state；非 error、非 blocker、非 human backlog。
- **哪些 read-only workflows 可接受**：全部（validate / classify / plan / build / render / preview / admin lookup / copy helper / GA4 / SEO；見 §4 matrix）。所有已知 consumer 均正確以 "not present" 語意處理 `""`。
- **哪些 write workflows 必須拒絕**：
  - Blogger API `posts.update` / `posts.delete` / `posts.get` 等**任何**需以真實 postId 建構 request 者 = 必須拒絕（現無此類 code path；CLAUDE.md §29 明確永禁）。
  - Bootstrap writer manifest 若含 `bloggerPostId` key = 現已 hard-fail `INVALID_RECORD`（guard T5c 覆蓋）。
  - `backfill:url --blogger-post-id ""` 或空白 = 不合法（`isNumericString` 檢查會擋，需 numeric 字串）。
- **Sidecar 是否可存在於 production content tree**：**可以**。schema §5.2 明確允許；`we-media-myself2` 為現行 live-published precedent。
- **何時才算 identity complete**：當 `bloggerPostId` 為**非空 numeric string** 且與 Blogger 後台真實 ID 一致。目前**無**已建立此判定之 helper（現行 3 處 consumer 使用 `isPresent` / `hasBloggerPostId` 各自實作；語意一致，未共用 helper）。**若未來** Blogger API integration slice 落地，可於該 slice 引入 `hasCompleteBloggerIdentity(sidecar)` / `assessBloggerSidecarReadiness(sidecar)` helper。本 Session **不**引入（premature；無 consumer 需要）。
- **如何補入真正 post ID**：僅由未來 Blogger API integration slice（§A.3）之系統流程寫入；**不**由人工填入。CLAUDE.md §29 + `docs/20260706-blogger-identity-and-backfill-strategy.md` §A.2/§E 均明確。
- **哪些 guards 防止它被誤當成完整 Blogger identity**：
  - `check:blogger-backfill`：warning-only 報告 missing。
  - `check:blogger-backfill-sidecar-plan`：classify sidecar completeness by human-supplied fields only；system-supplied missing 屬 informational。
  - `check:blogger-backfill-sidecar-bootstrap` T5c / T13a：writer 拒絕 manifest 內 `bloggerPostId`；`buildSidecarBody` 恆 `""`。
  - `check:blogger-backfill-truth-manifest-validator`：manifest 內 `bloggerPostId` = unknown field → hard-fail。
  - `check:blogger-backfill-truth-apply-plan`：payload `bloggerPostId` 恆 `""`；fingerprint deterministic。

---

## 8. 本 Session 之硬性邊界

- ✅ 無 production `.publish.json` 建立 / 修改 / 刪除。
- ✅ 無 production Markdown 修改。
- ✅ 無任何 `bloggerPostId` 填入 production sidecar。
- ✅ 無 Blogger / Google API 呼叫；零網路；無 credential。
- ✅ 無 build / deploy / preview / `dist-*` 觸發。
- ✅ 無 gh-pages / deploy clone 修改。
- ✅ 無 warning-only guard 升級為 blocking。
- ✅ 無 sidecar schema 變更。
- ✅ 無新 CLI command / npm script。
- ✅ 無 `plan:blogger-backfill-truth-apply` 之 human / JSON / docs wording 變更（現行已精確）。
- ✅ 無 `fingerprintPlan()` 契約變更。
- ✅ 無 apply command 建立。

本 slice 唯一 mutation = 新增本 audit 文件於 `docs/`。

---

## 9. 承接關係

- Predecessor（authoritative）：
  - `docs/publish-json-schema.md` §5 / §8 / §9（sidecar schema、必填規則、驗證規則）
  - `docs/20260706-blogger-identity-and-backfill-strategy.md`（identity 分層 A.1 / A.2 / A.3；不猜 ID）
  - `docs/20260706-blogger-backfill-write-target-inventory.md`（canonical write target = sidecar）
  - `docs/20260706-blogger-backfill-report-only-baseline.md`（parent guard 行為契約）
- Sibling（slice-level）：
  - `docs/20260718-blogger-backfill-missing-sidecar-planner.md`
  - `docs/20260718-blogger-backfill-missing-sidecar-bootstrap.md`
  - `docs/20260718-blogger-backfill-truth-manifest-template.md`
  - `docs/20260719-blogger-backfill-truth-manifest-intake-validator.md`
  - `docs/20260719-blogger-backfill-truth-apply-plan.md`
- 本文件 = **audit consolidation**；不新設契約，只 record 本 Session 之審計結論（Decision A + wording 精確 + fingerprint 一致 + 無 API 危險路徑 + 無 source 修改必要）。
