# Publish Target Stage 契約（`publishTargets.<platform>.stage`）

**Phase**：20260720-publish-target-stage — **Slice 1**（schema / validator / read-only classification） + **Slice 2**（production selector enforcement + write-time anti-bypass） + **Slice 3**（六篇 Blogger metadata 遷移 + transitional mismatch warning） + **Slice 4A**（consumer hardening：active-publication read helper） + **Slice 4B**（Blogger withdrawn sidecar schema / validator / read-only classification；本文 §11）
**狀態**：Slice 1 + Slice 2 + Slice 3 + Slice 4A + Slice 4B landed。所有 production selector（loaders / backfill planner / bootstrap / report / truth-manifest / apply-plan / authorization prepare + validate / apply engine）皆已接入 stage 判定；apply engine 額外加 write-time re-parse anti-bypass。preview 流程（§5）不受影響。Slice 3 於六篇 Blogger 測試文章加上 `stage: "preview"`（見 §7 表格）並啟用 warning-only 之 `publish-target-stage-conflicts-published-sidecar` transitional 規則；六篇之 Blogger production 全線 selector 於本 Slice 之後皆已排除該六篇，但 preview 流程與 GitHub 輸出行為完全不變。Slice 4A 落地 `active-publication.js` read helper（只有 `status === "published"` 且非空 `publishedUrl` 才算 active）。Slice 4B 落地 `blogger.status: "withdrawn"` + `schemaVersion: 2` + `blogger.lifecycle[]` 之 schema / validator / read-only classification（fixture-only guard `check:sidecar-withdrawal-schema`）；**不含** planner / authorization / rehearsal / apply / remote action；真實 sidecar 與 content 未變。

---

## §1 欄位

```text
publishTargets.<platform>.stage
```

Platform：

```text
github
blogger
```

Allowed values（lowercase string；case-sensitive；不 trim、不 normalize）：

```text
preview
production
```

YAML 範例：

```yaml
publishTargets:
  github:
    enabled: true
    stage: "production"
  blogger:
    enabled: true
    mode: "full"
    stage: "preview"
```

---

## §2 三者正交（不可互相推導）

| 欄位 | 語意 |
| --- | --- |
| `enabled` | 該平台是否具備參與輸出／預覽流程的**資格** |
| `mode` | 該平台的輸出**形式**（`full` / `summary` / `redirect-card`） |
| `stage` | 該平台目前是否具有 **production eligibility** |

三者為**正交維度**。不得由任一欄位推導另一欄位；`stage` 亦與文章 lifecycle（`status` / `draft`）為不同維度。

---

## §3 Missing default

```text
stage 缺漏（undefined）→ production
```

此為 **backward-compatibility 契約**。目前所有既有文章皆無 `stage` 欄位，其 production 行為必須**完全不變**。

`stage` 缺漏**不得**產生任何 diagnostics（無 warning、無 error）。

---

## §4 Invalid fail closed

`stage` 已存在但符合下列任一情況即為**非法**：

```text
- 非 string
- 空字串
- null
- object
- array
- 未知值
- 大小寫錯誤（Preview / PRODUCTION）
- 前後空白（" preview" / "production "）
- 使用 github／blogger／dual
- 使用 draft／ready／published／archived
```

非法時必須：

```text
- validate:content hard error（severity: error）
- resolver 回傳 ok:false / stage:null / source:"invalid"
- production predicate 回傳 false
- 不得 fallback 成 production
```

`enabled` 之值**不影響**本規則：`enabled: false` 時非法 `stage` 仍為 error。

型別錯誤之 diagnostic **不得回顯完整原始內容**（object / array 只回型別名稱；長字串截斷）。

---

## §5 Preview 不因 stage 被禁止

`stage: "preview"` 的用途正是「尚未取得 production eligibility」。preview 流程（`blogger:plan-preview` / `build:blogger-preview`）**不因** `stage` 被禁止或過濾。

---

## §6 平台隔離

```text
validate:content：可對 github 與 blogger 任一非法 stage 報 error（兩者可同時報）。
GitHub production entry points：未來只針對 github.stage 做 fail-closed／hard-fail。
Blogger production entry points：未來只針對 blogger.stage 做 fail-closed／hard-fail。
```

**不得**採用：

```text
blogger.stage 非法 → GitHub 也 hard fail
```

亦**不得**採用反方向的跨平台污染。

共享 release / readiness umbrella 若先執行 `validate:content`，可以因任何 metadata error 整體失敗；但每個平台的**直接** production entry point 必須維持平台隔離。

---

## §7 Slice 邊界

| Slice | 範圍 | 狀態 |
| --- | --- | --- |
| Slice 1 | stage schema / helper、validator 規則、read-only 顯示、focused guard、docs | ✅ landed |
| Slice 2 | production selector enforcement（把 predicate 接入各平台 production entry point）+ apply write-time re-parse anti-bypass | ✅ landed |
| Slice 3 | 六篇 Blogger 測試文章遷移為 `blogger.stage: "preview"` + transitional warning（`publish-target-stage-conflicts-published-sidecar`；warning-only） | ✅ landed |
| Slice 4A | consumer hardening：`active-publication.js` read helper（active publication = `status="published"` + 非空 `publishedUrl`；withdrawn / 未知 status 一律 fail-closed inactive） | ✅ landed |
| Slice 4B | Blogger withdrawn sidecar schema（`schemaVersion: 2` + `blogger.status: "withdrawn"` + `blogger.lifecycle[]`）/ validator / read-only classification / fixture-only guard（本文 §11） | ✅ landed |
| Slice 4C+ | withdrawal planner / authorization / rehearsal / production apply / remote action | ❌ 未啟動 |

**Slice 3 遷移之六篇 Blogger 文章**（`publishTargets.blogger.stage = "preview"`）：

```text
content/blogger/posts/20260612-after-work-writing-time-blocking.md
content/blogger/posts/20260612-blog-as-personal-knowledge-base.md
content/blogger/posts/20260612-blog-restart-steady-rhythm-notes.md
content/blogger/posts/20260612-daily-reading-habit-notes.md
content/blogger/posts/20260612-reading-notes-three-questions.md
content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md
```

**Slice 3 transitional warning 契約**（`publish-target-stage-conflicts-published-sidecar`）：

- 觸發條件（三者必須全部成立）：
  1. `resolvePublishTargetStage(publishTargets, 'blogger')` 解析為 `stage: "preview"`（explicit；missing default → production 不觸發、invalid → ok:false 不觸發）
  2. 對應之 `.publish.json` sidecar 存在且為 plain object
  3. `sidecar.blogger.status === "published"`
- 邊界：
  - `severity: "warning"`（絕不升 error，不使 `validate:content` exit non-zero）
  - 不動任何 selector 行為（Slice 2 之 fail-closed 於 preview 不放寬）
  - 不觸碰 `.publish.json`（本 Slice 為 **read-only observation**；withdrawal 屬 Slice 4+）
  - **不得** echo `publishedUrl`；輸出僅含 `sourcePath` + `sidecarPath`
  - 平台專限 Blogger：`github.stage` 對本 rule 不生效
- 現行 repo 觸發計數 = 1（只有 `20260612-after-work-writing-time-blocking.md` 有 landed Blogger publish sidecar；其餘五篇尚無 sidecar）

Slice 1 未改變任何 production 行為（helper 僅 wired 至 validator / Admin read-only 顯示 / preview planner 顯示）。

Slice 2 之 production 行為變化如下（**現行 repo 內無文章宣告 stage，所有既有斷言計數／輸出不變**）：

- Loader 之 production selector 對 native + cross-post 皆依 platform-target `stage` 過濾；preview / invalid → 排除（進 `filteredOut` 並帶 `<platform>:stage-not-production` reason）；missing / production → 納入（backward compat）。
- Backfill candidate 判定（`check:blogger-backfill` / `plan:blogger-backfill-sidecars` / `bootstrap:blogger-backfill-sidecars`）在既有 `enabled + status + draft` 三條件之後加上 Blogger `stage` production 判定；preview-stage source 於整條 truth-manifest / apply-plan / authorization / apply 皆不會出現。
- Truth-manifest intake validator、apply-plan、apply authorization prepare / validate 皆走 planner 之 candidate set；planner 排除 preview 即這幾條 rail 皆繼承。若 manifest 手動塞入 preview-stage source（繞過 planner），`bootstrap:blogger-backfill-sidecars` 之 `planBootstrap.isCandidate` 亦會拒絕（`SOURCE_NOT_CANDIDATE`）。
- Apply engine（`apply-blogger-backfill-truth.js`）於 preflight 通過、write engine 觸發前，會**再次**從 authoritative source Markdown 讀 + parse frontmatter，並以 `resolvePublishTargetStage` + `isProductionStage` 驗證 Blogger `stage` 仍為 production。若 invalid 或 preview → hard-fail，零 mutation。此為反 TOCTOU / anti-bypass。
- Preview 流程（`blogger-preview-plan.js` / `build-blogger-preview.js` / `check-blogger-preview.js`）**刻意**不接入 stage helper（契約 §5：preview 存在正是為了「尚未取得 production eligibility」；stage=preview 反而應該能繼續走 preview flow）。

上述 wiring / anti-wiring 邊界由 focused guard 靜態掃描 + async fixture 端對端驗證（見 §9 / §10）。

---

## §8 其他契約要點

1. **不存在 top-level `undecided` 安全 gate**。`stage` 只有 `preview` / `production` 兩值；缺漏即 production、非法即 fail closed，沒有第三個「待決」狀態。
2. **Landed sidecar withdrawal**：schema / validator / read-only classification 已於 Slice 4B 落地（§11），但**實際撤回**（planner / authorization / rehearsal / production apply / remote action）仍為後續獨立 phase（Slice 4C+）。已 landed 的 publish sidecar 不因本契約或 Slice 4B 被撤回或改寫；Slice 4B 未觸碰任何真實 sidecar bytes。
3. `stage` 屬 `.md` frontmatter 之發布目標宣告（與 `enabled` / `mode` 同層），**不放** `.publish.json`、**不放** `.fb.md`。

---

## §9 實作位置

| 角色 | 檔案 |
| --- | --- |
| Helper（單一事實來源） | `src/scripts/publish-stage.js` |
| Validator 規則 | `src/scripts/validate-content.js`（diagnostic types `invalid-publish-target-stage` + Slice 3 `publish-target-stage-conflicts-published-sidecar` + Slice 4B `publish-target-stage-conflicts-withdrawn-sidecar` + withdrawal schema errors） |
| Consumer read helper（Slice 4A） | `src/scripts/active-publication.js`（`isActivePublishedTarget` / `getActivePublishedUrl`） |
| Withdrawal schema helper（Slice 4B；單一事實來源） | `src/scripts/sidecar-withdrawal-contract.js`（`collectSidecarWithdrawalIssues` / `withdrawnStageStatusWarning` / `resolveSchemaVersion`） |
| Withdrawal focused guard（Slice 4B） | `src/scripts/check-sidecar-withdrawal-schema.js`（`check:sidecar-withdrawal-schema`；fixture-only） |
| Admin read-only 顯示 | `src/scripts/load-admin-posts.js` / `src/scripts/admin-article-lookup.js` |
| Preview planner read-only 顯示 | `src/scripts/blogger-preview-plan.js` |
| GitHub production selector（native + blogger cross） | `src/scripts/load-github-posts.js` |
| Blogger production selector（native + github cross） | `src/scripts/load-blogger-posts.js` |
| Backfill report candidate 判定 | `src/scripts/check-blogger-backfill.js` |
| Backfill planner candidate 判定（downstream truth-manifest / apply-plan / apply 之上游） | `src/scripts/plan-blogger-backfill-sidecars.js` |
| Backfill bootstrap writer candidate 判定（manifest 反 bypass） | `src/scripts/bootstrap-blogger-backfill-sidecars.js` |
| Apply engine write-time re-parse（TOCTOU anti-bypass） | `src/scripts/apply-blogger-backfill-truth.js` |
| Focused guard | `src/scripts/check-publish-target-stage.js` |

> Truth-manifest intake validator / apply-plan / authorization prepare / authorization validate 皆走
> `planMissingSidecars` → `planBootstrap` 之 candidate set，因此 stage 過濾透過 planner + bootstrap
> 之 `isCandidate` 自動繼承；無需重複實作。

Helper 匯出：

```text
VALID_PUBLISH_STAGE
DEFAULT_PUBLISH_STAGE
PUBLISH_STAGE_PLATFORMS
PUBLISH_STAGE_DIAGNOSTIC_TYPE
InvalidPublishStageError
NotProductionStageError
resolvePublishStage
resolvePublishTargetStage
isProductionStage
assertProductionStage
collectPublishTargetStageIssues
formatPublishStage
describePublishStageValue
```

`resolvePublishStage(raw, platform)` 回傳：

```text
raw === undefined  → { ok: true,  stage: "production", source: "default"  }
raw 為合法值        → { ok: true,  stage: raw,          source: "explicit" }
raw 已存在但非法    → { ok: false, stage: null,         source: "invalid"  }
```

---

## §10 執行

```bash
npm run check:publish-target-stage
npm run validate:content
```

本 guard 全部使用 in-memory 物件與 repo 內既有檔案之靜態掃描：**不**修改任何真實文章、**不**建立 fixture、**不**寫暫存檔、**不** build / deploy / push。

Guard 未接入任何 umbrella（`check:metadata-guards` / `check:metadata-cross-fields` / `check:metadata-all` / `check:release-readiness` 皆未變動），以免更動既有 umbrella contract guard 之語意；需要時另開 phase 再接。

---

## §11 Slice 4B：Blogger withdrawn sidecar 契約

> 完整欄位字典 / schema / redaction / stage×status truth table 見 `docs/publish-json-schema.md` §5.7 / §9.2 / §9.3。本節僅記 stage 契約相關要點與邊界。

**範圍（只做以下）**：`blogger.status: "withdrawn"` 正式 schema 語意、sidecar `schemaVersion: 2` 向後相容讀取規則、`blogger.lifecycle[]` read-only validation contract、Markdown stage × sidecar status validator truth table、fixture-only focused guard、schema / contract docs。

**不做（Slice 4C+）**：withdrawal planner、authorization preparation / validation、rehearsal engine、production apply capability、operator-private authorization、真實 withdrawal payload、remote Blogger action。本 Slice 未建立 `operator-private/`。

**核心不變式**：

1. `withdrawn` 只描述 **repository publication truth**，不代表遠端 Blogger 狀態；遠端狀態由 lifecycle event 之 `remoteDisposition` 獨立記錄（operator-confirmed observation，非本 Slice 執行之 remote action）。
2. **eligibility 仍由 `stage` 決定**（§1–§4）；`status` **不得**成為第二套 production stage selector。
3. active publication evidence（`publishedUrl` / `publishedAt` / `bloggerPostId` / `publishYear` / `publishMonth` / `permalink`）於 withdrawal 一律**保留原值**（歷史發布真值）。
4. schemaVersion 相容：缺省 / `1` 維持既有合法行為且**不得**使用 withdrawn / lifecycle；`2` 方可使用；未知 / 非整數 / `0` / 負數 / 過大 → fail-closed error。**不要求**既有 sidecar 全面 migration。
5. `blogger.lifecycle[]` 為 **append-only**（契約）；validator 只驗 snapshot 結構 / 順序，**無法**證明歷史未被改寫；append-only mutation enforcement 留待 future apply capability。

**stage × status truth table**（validator 行為）：

| stage | sidecar.status | 診斷 |
| --- | --- | --- |
| `preview` | `published` | warning `publish-target-stage-conflicts-published-sidecar`（Slice 3 既有；不變） |
| `preview` | `withdrawn` | 無 stage/status 診斷（合法 steady state；前提 withdrawn schema 有效） |
| `production`（含 missing→default） | `withdrawn` | warning `publish-target-stage-conflicts-withdrawn-sidecar`（Slice 4B 新增；不回顯 `publishedUrl`） |
| invalid stage | 任意 | invalid-stage error 優先；**不**因 withdrawn 而 downgrade / fallback / 隱藏 |
| 其餘組合 | — | 維持現行語意，不新增 warning |

**severity**：schema 不完整（缺 evidence / 缺 lifecycle / malformed lifecycle / malformed hash / malformed strict-ISO timestamp / invalid reason / invalid remoteDisposition〔含舊 `confirmed-inactive`〕/ invalid canonical sourcePath / duplicate withdrawn event / transition 不一致 / 重複 publication evidence / 含私人 operator 欄位 / lifecycle 未知 key〔strict allowlist〕/ v2 `blogger.status` fail-closed〔缺漏 / 非字串 / 空 / 未知 / 大小寫變體〕/ unsupported schemaVersion / v1 誤用 v2 功能）一律 **error**（**不得**只是 warning）；stage × status product-state mismatch 為 **warning**。

**redaction**：validator output **不得** echo `publishedUrl` / lifecycle 內任何 URL 值 / operator identity / authorization file path / private directory path；只回顯 `sourcePath` / `sidecarPath` / error type / 欄位名稱 / 安全短碼。

**實際 repo 狀態**：真實 repo 尚無 withdrawn sidecar，故 `publish-target-stage-conflicts-withdrawn-sidecar` 現行計數 = 0；`publish-target-stage-conflicts-published-sidecar` 維持 = 1。

**執行**：

```bash
npm run check:sidecar-withdrawal-schema
npm run validate:content
```

guard 全部使用 in-memory fixture / synthetic URL（`.invalid`）/ synthetic hash：**不**讀 / 改任何真實 sidecar、**不** build / deploy / push / 呼叫 API。未接入任何 umbrella。
