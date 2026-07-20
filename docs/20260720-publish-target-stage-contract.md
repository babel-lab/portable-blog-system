# Publish Target Stage 契約（`publishTargets.<platform>.stage`）

**Phase**：20260720-publish-target-stage — **Slice 1**（schema / validator / read-only classification）
**狀態**：Slice 1 landed。**尚未**接入任何 production selector（enforcement 屬 Slice 2）。

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
| Slice 1 | stage schema / helper、validator 規則、read-only 顯示、focused guard、docs | ✅ landed（本文件） |
| Slice 2 | production selector enforcement（把 predicate 接入各平台 production entry point） | ❌ 未啟動 |
| Slice 3 | transitional warning（例如 `stage: preview` 但已有 landed publish sidecar） | ❌ 未啟動 |
| Slice 4+ | landed sidecar withdrawal 等 | ❌ 未啟動 |

Slice 1 **未改變任何 production 行為**：

- `assertProductionStage` / `isProductionStage` 於本 Slice **無任何 caller**。
- helper 未被任何 build / deploy / apply / manifest / authorization 路徑引用。
- 未修改任何文章 metadata、未修改任何 `.publish.json`。

上述邊界由 guard 靜態掃描守住（見 §9）。

---

## §8 其他契約要點

1. **不存在 top-level `undecided` 安全 gate**。`stage` 只有 `preview` / `production` 兩值；缺漏即 production、非法即 fail closed，沒有第三個「待決」狀態。
2. **Landed sidecar withdrawal 是後續獨立 phase**。已 landed 的 publish sidecar 不因本契約被撤回或改寫。
3. `stage` 屬 `.md` frontmatter 之發布目標宣告（與 `enabled` / `mode` 同層），**不放** `.publish.json`、**不放** `.fb.md`。

---

## §9 實作位置

| 角色 | 檔案 |
| --- | --- |
| Helper（單一事實來源） | `src/scripts/publish-stage.js` |
| Validator 規則 | `src/scripts/validate-content.js`（diagnostic type `invalid-publish-target-stage`） |
| Admin read-only 顯示 | `src/scripts/load-admin-posts.js` / `src/scripts/admin-article-lookup.js` |
| Preview planner read-only 顯示 | `src/scripts/blogger-preview-plan.js` |
| Focused guard | `src/scripts/check-publish-target-stage.js` |

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
