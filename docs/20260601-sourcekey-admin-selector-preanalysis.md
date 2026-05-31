# 2026-06-01 sourceKey Admin Selector Preanalysis

> Phase: `20260531-night-8-sourcekey-admin-selector-preanalysis-docs-only-a`
> Date: 2026-05-31（post-EOD；night-8 recovery cold-start session 落地；先前 API socket 中斷後 working tree clean，未產生部分檔）
> Scope: **docs-only**（單檔新增 `docs/20260601-sourcekey-admin-selector-preanalysis.md`；無 source / content / settings / templates / fixture / package / dist / gh-pages / `.cache` / `CLAUDE.md` / 既有 docs 變更）
> Baseline: HEAD = origin/main = `a0e2706721bd6d7e3540a4ff2630889233fa4f9d`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **docs-only sourceKey Admin selector preanalysis**：在 2026-05-31 night-7（`a0e2706`）之後，依 night-3 next-work roadmap §6（Candidate D）展開**第三條** docs-only preanalysis track，規劃未來 sourceKey Admin selector UI 與 `source-inactive` warning rule 之 source phase 邊界。
- 本文件 **docs-only**；**不**啟動任何 implementation：
  - ❌ 不授權任何 Admin selector source implementation（`src/**` 不動）
  - ❌ 不授權任何 source-inactive warning rule source implementation（`src/scripts/validate-content.js` 不動）
  - ❌ 不授權 Admin Apply enablement
  - ❌ 不授權新增 middleware write route
  - ❌ 不授權 admin-write-cli dry-run / apply
  - ❌ 不授權 settings / content / fixture / template / package 變動
  - ❌ 不授權 build / deploy / Blogger repost / GA4 validation
  - ❌ 不授權 reverse UTM activation；不授權 pm-26 deploy gate unblock
  - ❌ 不授權 download loader / validator-via-registry / Admin picker / renderer / content migration source implementation
- **當前基線**：HEAD = origin/main = `a0e2706`；working tree clean；ahead/behind = 0/0；`npm run validate:content` = **0 errors / 47 warnings / 42 posts**。
- **sourceKey renderer / GA4 baseline 已 landed**（per `docs/related-links-schema.md` §11.5 step 2-5；landed at `c658e1b` / `089b157` / `d1f1224` / `310062d`，2026-05-27）；**validate rule step 7 部分 landed**（`source-key-not-found` / `source-key-invalid-type` / `source-key-empty` 已實作；`source-inactive` 仍 dormant）。
- **Admin selector（step 6）remains dormant**；本文件僅規劃未來其 source phase 之邊界與啟動條件。
- 本 phase 之預期變動：新增單一 docs 檔（本文件）；validate baseline 維持 `0 / 47 / 42` 不變。

### 1.1 一句話裁決

> **本文件僅 docs-only 規劃 Admin selector + source-inactive warning 之未來 source phase 邊界；不啟動任何 implementation；建議完成 commit + push 後即進入 Final Idle Freeze / EXIT，待 user 明示授權方推進下一步。**

---

## 2. Frozen Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` tracking `origin/main` |
| HEAD（本 phase 啟動時） | `a0e2706721bd6d7e3540a4ff2630889233fa4f9d` |
| origin/main（本 phase 啟動時） | `a0e2706721bd6d7e3540a4ff2630889233fa4f9d` |
| short | `a0e2706` |
| ahead / behind | `0 / 0` |
| working tree | clean |
| validate:content | **0 errors / 47 warnings / 42 posts** |
| latest commit subject | `docs(download): plan remaining validation rules` |

### 2.1 Governance dormancy snapshot

| Gate / Surface | 狀態 |
|---|---|
| Reverse UTM source（pm-24a / b / c at `7e1d356` / `e2309e9` / `7c769fe`） | ✅ landed origin/main（2026-05-23） |
| Reverse UTM live | ❄ **dormant**（未 deploy；Blogger 後台未重貼；GA4 Realtime validation 未啟動） |
| pm-26 deploy gate | ❄ **BLOCKED**（per `docs/reverse-utm-fixture-plan.md` §6；positive fixture 仍 `status: draft`） |
| Admin Apply enable flag | ❄ **disabled / dormant** |
| Middleware write route（server-side） | ❄ **absent**（無 route handler；無 fs.writeFile 路徑） |
| admin-write-cli dry-run / apply | ❄ **dormant** |
| Download empty registry（`download-assets.json` + `download-forms.json`） | ✅ landed at `466e471`；shape = empty registry |
| Download loader / validator-via-registry / Admin picker / renderer / content migration | ❄ **dormant** |
| sourceKey renderer baseline（step 2-5 of `related-links-schema.md` §11.5） | ✅ landed（`c658e1b` / `089b157` / `d1f1224` / `310062d`，2026-05-27） |
| sourceKey validate rules: `source-key-not-found` / `source-key-invalid-type` / `source-key-empty` | ✅ landed（`9ce7e8a` + `pm-14`，2026-05-27） |
| sourceKey Admin selector（step 6） | ❄ **dormant**（無 source；無 UI；無 frontmatter 寫入 path） |
| sourceKey `source-inactive` warning rule（step 7 最末項） | ❄ **dormant**（rule logic 未實作；當下 8 sources 全 active 使得無實際 warning） |

### 2.2 Recovery note

本 phase 之首次嘗試於 docs file 寫入階段發生 API socket connection error。recovery cold-start session 檢查發現：

- working tree clean（無 partial file）
- HEAD 仍為 `a0e2706`；ahead/behind = 0/0
- validate baseline 維持 `0 / 47 / 42`

故 recovery 直接續做原 phase（新增單一 docs 檔）；**未**動用任何 amend / rebase / reset / stash / force-push / 刪除動作。

---

## 3. Current sourceKey State

### 3.1 Settings registry：`content/settings/link-sources.json`

`content/settings/link-sources.json` 已 landed 於 `c658e1b`（2026-05-27）。當前狀態（read-only inspection）：

- `version: 1`
- `sources: []` 含 **8 個 active entries**（per night-3 roadmap §2.1 與本次 read-only check 一致）：
  - `blogger`（displayLabel: `BLOG`；sourceType: `internalPlatform`；defaultPlatform: `blogger`）
  - `github`（displayLabel: `GITHUB`；sourceType: `internalPlatform`；defaultPlatform: `github`）
  - `bagel-books`（displayLabel: `貝果書屋`；sourceType: `internalCategory`；defaultPlatform: `blogger`）
  - `life`（displayLabel: `生活`；sourceType: `internalCategory`；defaultPlatform: `blogger`）
  - `tech-note`（displayLabel: `技術文章`；sourceType: `internalCategory`；defaultPlatform: `github`）
  - `youtube`（displayLabel: `YouTube`；sourceType: `mediaPlatform`；defaultTargetType: `external`）
  - `netflix`（displayLabel: `Netflix`；sourceType: `mediaPlatform`；defaultTargetType: `external`）
  - `taipei-library`（displayLabel: `台北市立圖書館`；sourceType: `library`；defaultTargetType: `external`）
- 每筆 entry 之 schema 含：`sourceKey` / `displayLabel` / `sourceType` / `defaultTargetType` / `defaultPlatform` / `defaultRel[]` / `defaultTrackingPolicy.{enabled,ga4SourceKey,utm}` / `isActive` / `sortOrder`
- **全部 8 筆 `isActive: true`**；故 `source-inactive` warning rule 即使未來實作，當下亦不會觸發任一 warning。

### 3.2 Renderer / template baseline

- `content/templates/*.md`：sample `sourceKey` 已補入（step 3 `089b157`）
- `src/scripts/build-github.js` / `src/scripts/build-blogger.js`：renderer fallback chain（`labelOverride` → registry lookup by `sourceKey` → `platform` → `kind` fallback）已 landed（step 4 `d1f1224`）
- `src/views/pages/post-detail.ejs`：relatedLinks / otherLinks anchors 含 `data-ga4-param-link_source_key` attribute（step 5 `310062d`；GitHub post detail only）
- `src/views/blogger/blogger-post-full.ejs`：sourceKey 顯示 fallback chain 套用；GA4 attrs 不套用於 Blogger render（既有設計）

### 3.3 Validate rule baseline

`src/scripts/validate-content.js`（read-only inspection）含：

- `buildActiveSourceKeySet(settings)`：從 `settings.linkSources.sources` 取 `isActive !== false` 之 `sourceKey` 字串建構 Set
- `validateRelatedLinksField(...)` 內：
  - sourceKey **三條互斥規則**已 landed（per pm-14 step-7-d）：
    1. `entry.sourceKey !== undefined && typeof !== 'string'` → `related-links-source-key-invalid-type`（warning）
    2. else if `typeof === 'string' && trim() === ''` → `related-links-source-key-empty`（warning）
    3. else if non-empty string 但不在 `activeSourceKeys` → `related-links-source-key-not-found`（warning）
  - `entry.sourceKey === undefined`：合法（不觸發任何 rule；保留 optional 欄位語意）
  - **`source-inactive` rule 未實作**：當下 inactive source（isActive: false）被 `buildActiveSourceKeySet` 排除，post 引用 inactive sourceKey 會被 not-found 視角捕捉；本批未區分「inactive source 引用」與「真正不存在 source 引用」之語意

### 3.4 Admin UI gap

當前 repo 中**不存在** `src/admin/` 目錄：

- 存在之 admin-relevant source（`src/scripts/`）：
  - `admin-write-whitelist.js`（write target 白名單；dormant；無 caller）
  - `admin-field-validators.js`（field-level validation helpers；dormant；無 caller）
  - `admin-frontmatter-patcher.js`（frontmatter patcher；dormant；無 caller）
  - `admin-write-cli.js`（CLI script；dormant；無 npm script entry）
- **無 Admin UI selector 元件**；**無 picker view / template**；**無 middleware write route**；**無 server-side write path**。
- sourceKey 之 frontmatter 填寫當前**僅靠作者手動編輯 `.md`**；validate 為 post-hoc 警告，**無撰寫期 picker**。

### 3.5 source-inactive warning rule 未實作

當前 8 sources 全 `isActive: true`；即使將 `isActive: false` 之 source 加入 registry，validator 亦不會明確區分「inactive 引用」與「不存在引用」（兩者皆以 not-found 視角捕捉，warning 文字相同）。

未來若需區分，須新增獨立 rule（建議 id：`related-links-source-key-inactive`），但**本文件不啟動其實作**。

---

## 4. Admin Selector UX Concept

本節描述**未來** UI 行為；**不**規範實作；**不**含 markup / 元件命名。

### 4.1 Selector 欄位形態

- 目標：在文章撰寫 / 編輯場景，作者可從**下拉選單**選擇 `sourceKey`，**不**重打顯示文字
- 範圍：**僅 relatedLinks / otherLinks entry 之 `sourceKey` 欄位**；不涵蓋 `kind` / `platform` / `url` / `title` / `description` 欄位
- 選單來源：`content/settings/link-sources.json` 之 `sources[]`
- 排序依據：`sortOrder` 升冪（per `docs/20260526-related-links-source-label-admin-design.md` §5.2）

### 4.2 顯示 metadata

selector option 應顯示 machine-readable + human-readable 兩者：

- `sourceKey`（machine-readable；穩定）
- `displayLabel`（human-readable；UI 顯示文字）
- `sourceType`（如 `internalPlatform` / `internalCategory` / `mediaPlatform` / `library`）
- `isActive` 狀態 indicator（active / inactive 視覺差異）

建議顯示格式（**示意；非規範**）：

```text
[<sourceType>] <displayLabel> （sourceKey: <sourceKey>）
```

### 4.3 active / inactive behavior

- **active source**（`isActive: true`）：可選；正常顯示
- **inactive source**（`isActive: false`）：
  - 預設**不顯示**於 picker（per `docs/20260526-related-links-source-label-admin-design.md` §5.2「只顯示 isActive: true 之 source」）
  - 若 post 已引用 inactive sourceKey（既有資料）：顯示**唯讀**值並輔以 inactive icon / tooltip；**不**自動清除既有引用（避免歷史文章顯示中斷）

### 4.4 Empty value behavior

- 作者可清空 sourceKey；對應 frontmatter `sourceKey: ""` 或省略欄位
- 清空時 picker 顯示「未指定」placeholder
- 不強制必填（per `related-links-schema.md` §3.2：sourceKey 為選填）

### 4.5 Custom / manual link behavior

- 對「非 registry 涵蓋」之來源（如作者自有平台、一次性合作頁面），picker 應提供「自訂 / manual」選項
- 選擇後 sourceKey 留空；作者改填 `platform` / `displayLabel` 之既有欄位（per §3.4 既有 fallback chain）
- 不**自動新增**至 registry；不變動 registry settings

### 4.6 fallback if sourceKey is absent

- 若 entry 無 `sourceKey`：renderer fallback chain（per `docs/related-links-schema.md` §11.2.2）仍適用：
  - `labelOverride` → registry lookup → `platform` → `kind` fallback
- selector UI 應**不主動補入** sourceKey；保留作者意圖

### 4.7 No Apply action enabled by this phase

- **此 phase 完全不涉及 Apply**：picker 設計為 read-only viewer concept；不寫入 .md frontmatter
- 真正 selector 之 source phase（未來；須獨立授權）亦**僅**讀取 registry 與顯示；frontmatter 寫入屬另一獨立 phase（須 Admin Apply / middleware / admin-write-cli 三者其一落地）

---

## 5. Registry Data Model Boundary

### 5.1 Expected `link-sources.json` shape

當前 schema（read-only inspection；不變動）：

```json
{
  "version": 1,
  "description": "...",
  "sources": [
    {
      "sourceKey": "string (machine-readable; required)",
      "displayLabel": "string (human-readable; required)",
      "sourceType": "internalPlatform | internalCategory | mediaPlatform | library | ... (required)",
      "defaultTargetType": "internal | external (required)",
      "defaultPlatform": "blogger | github | null (required; nullable)",
      "defaultRel": ["noopener", ...],
      "defaultTrackingPolicy": {
        "enabled": true,
        "ga4SourceKey": true,
        "utm": false
      },
      "isActive": true,
      "sortOrder": 10
    }
  ]
}
```

### 5.2 active / inactive behavior

- `isActive: true`：source 視為可用；validator 之 `buildActiveSourceKeySet` 納入；picker 可選
- `isActive: false`：source 不納入 active set；validator 之既有規則會將其引用視為 not-found（per §3.3）
- 未來若新增 `source-inactive` warning rule（per §6）：需區分「inactive 引用」與「真正不存在引用」

### 5.3 source key 命名 convention

per 既有 8 sources 觀察：

- 全小寫
- 連字號分隔（`bagel-books` / `tech-note` / `taipei-library`）
- 內部 platform 用單字（`blogger` / `github`）
- 媒體平台用品牌名（`youtube` / `netflix`）
- 圖書館 / 機構用「地名-機構類型」（`taipei-library`）

本文件**不**規範新命名；僅描述既有觀察。

### 5.4 platform 與 sourceKey 之獨立性

- `sourceKey`：作者標記之 source identifier（registry-managed；穩定）
- `platform`：渲染前綴 fallback（per `related-links-schema.md` §3.4）；作者自由字串
- **sourceKey 不替代 platform**：
  - 在 reverse UTM 與 cross-link 判斷（per `CLAUDE.md` §16.4）中，**hostname** 才是 cross-link 判斷依據；`platform` / `sourceKey` 均**不**參與 hostname 判斷
  - `sourceKey` 之主要用途：(a) 顯示 fallback chain；(b) GA4 `link_source_key` event param；(c) 未來 picker UI 選取依據

### 5.5 sourceKey 不應替代既有欄位

- ❌ 不替代 `url`（連結本體）
- ❌ 不替代 `title`（連結文字）
- ❌ 不替代 `description`（連結副文）
- ❌ 不替代 `platform`（渲染前綴）
- ❌ 不替代 `kind`（internal / external）

### 5.6 為何本 phase 不動 registry settings

- registry 已 landed 且 stable；無需求變動
- 本 phase 為 docs-only preanalysis；改 registry 屬未來 selector 或新 source 加入之獨立 phase
- 任何 registry 結構變動須走獨立 docs-only preanalysis + settings-only landing 兩階段（mirror step 1 / step 2 cadence）

---

## 6. Source-inactive Warning Concept

本節僅 **plan 未來 validation rule**；**不**實作；**不**改 `src/scripts/validate-content.js`。

### 6.1 Possible rule id

建議命名：`related-links-source-key-inactive`（mirror 既有 `related-links-source-key-not-found` / `-invalid-type` / `-empty` 三條 sourceKey 規則之命名 pattern）。

### 6.2 When it should fire

- entry 之 `sourceKey` 為 **non-empty trimmed string**
- 該 sourceKey **存在於 registry**（`settings.linkSources.sources[].sourceKey` 命中）
- 該 sourceKey 之 entry **`isActive === false`**
- 預期觸發**獨立** warning（與 not-found 區分）

### 6.3 與既有三條 sourceKey 規則之互斥順序

建議互斥順序（在既有三條後新增第 4 條；mirror pm-14 step-7-d pattern）：

```text
if (entry.sourceKey !== undefined) {
  if (typeof !== 'string')                 → source-key-invalid-type
  else if (trim() === '')                  → source-key-empty
  else if (registry has key && !isActive)  → source-key-inactive  ← 新加（建議）
  else if (!activeSourceKeys.has(key))     → source-key-not-found
  // else: 合法
}
```

注意：新規則順序須在 `not-found` **之前**判斷，否則 inactive 會被 not-found 先攔（因 `activeSourceKeys` 已排除 inactive）。

### 6.4 Severity

建議 **warning-only**（mirror 既有四條 sourceKey / kind / url 規則之 severity）：

- 既有 ready / published 文章引用之 source 若被 deactivate，不應變 build error（避免歷史文章 build 中斷）
- inactive 為 author / admin 管理動作；validator 角色為提醒，不為阻擋

### 6.5 status 適用範圍

建議**所有 status**皆檢查（沿用既有四條 sourceKey 規則之 status-agnostic pattern）：

- `draft`：作者編輯中；提醒源頭問題
- `ready` / `published`：仍提醒；不阻擋 build
- `archived`：仍提醒；管理參考

但**不**新增 status-gated 條件（避免複雜化既有規則矩陣）。

### 6.6 如何避免 false positive

- registry 之 inactive 切換**僅由作者 / admin 主動**；validator 不自動推導 inactive
- 既有 8 sources 全 `isActive: true`；當下實作此規則後預期 baseline **不變**（仍 `0 / 47 / 42`）
- 若未來確實有 deactivation 需求：須先評估是否同步**手動清除**既有 post 引用，或允許歷史 grandfather

### 6.7 Why not now

- 當前 8 sources 全 active；rule 即使實作亦無觸發案例；對 baseline 無立即改善
- 實作此 rule 涉及 `validate-content.js` 變動 + fixture 新增（mirror 既有三條規則之 fixture 落地 pattern）；屬獨立 source phase
- 本 phase 為 docs-only；不啟動任何 source 修改

---

## 7. Admin Apply Boundary

### 7.1 Admin Apply 仍 disabled

- 當前無 Admin Apply enable flag 落地之 settings；無 UI toggle；無 server-side gate
- 本 phase **明確不**啟用 Admin Apply
- 任何啟用須走 `docs/admin-2-write-pre-analysis.md` 之 4-step safety chain（atomic write + dry-run + pre-write validate + post-write validate）+ user explicit approval per write target

### 7.2 No middleware write route

- 當前 repo **無** server-side route handler 提供 `.md` frontmatter 寫入 endpoint
- 無 `fs.writeFile` 之 callable path 由 HTTP / fetch 觸發
- 本 phase **不**新增任何 middleware write route

### 7.3 admin-write-cli remains dormant

- `src/scripts/admin-write-cli.js` 存在但**無 npm script entry**；無 caller；無 5/28 之 4 個 gated SEO writes 以外之新 target
- 本 phase **不**新增 write target；**不**執行 dry-run / apply

### 7.4 Selector UI planning ≠ write capability

- 本 phase 之 Admin Selector UX Concept（§4）僅描述**讀取 + 顯示** UI 行為
- selector 之 source phase 即使未來 landed，預設亦為 **read-only viewer**；frontmatter 寫入屬另一獨立 phase
- 不可因「selector docs landed」誤解為「Apply 可啟用」

### 7.5 Future Apply enablement 須獨立 phase

未來若啟用 Admin Apply 對 `sourceKey` 之寫入，須依序：

1. 擴張 `docs/admin-2-write-pre-analysis.md` allowed write scope（新增第 5 個 SEO write target 或專屬 sourceKey write target）
2. 對應之 docs-only preanalysis（write surface / safety chain / rollback）
3. 對應之 source phase（middleware route 或 admin-write-cli target）
4. 對應之 fixture / smoke test phase
5. 對應之 read-only acceptance cross-check phase

每一步皆須 user explicit approval；不在本文件範疇內。

---

## 8. GA4 / Renderer Relationship

### 8.1 sourceKey GA4 param 已 landed

- `data-ga4-param-link_source_key` attribute 已於 step 5（`310062d`）落地於 `src/views/pages/post-detail.ejs` relatedLinks / otherLinks anchors
- 觸發條件：`item.sourceKey` 為非空 trimmed string
- runtime `link-tracker.js` / `ga4-events.js` 之全域 attr scanner 自動 propagate；未動

### 8.2 Admin selector 僅供 sourceKey metadata 來源

- 未來 selector 之角色：協助作者**選擇** sourceKey
- selector **不**直接 emit GA4 event；GA4 event 由 runtime scanner + renderer attr 提供
- 故 selector 與 GA4 之關係為**間接**：selector → frontmatter `sourceKey` → renderer attr → GA4

### 8.3 No GA4 validation in this phase

- 本 phase 不執行 GA4 Realtime / DebugView 驗證
- 本 phase 不變動 GA4 event params
- 本 phase 不變動 `docs/ga4-link-tracking-spec.md`（如存在）

### 8.4 No renderer output drift

- 本 phase 不改 `src/views/pages/post-detail.ejs` / `src/views/blogger/blogger-post-full.ejs` 任一行
- 本 phase 不改 `src/scripts/build-github.js` / `src/scripts/build-blogger.js` 任一行
- renderer 對 sourceKey 之既有 fallback chain 維持不變
- 既有 ready / published posts 之 render output 預期 byte-identical-modulo-builtAt

### 8.5 No deploy / Blogger repost

- 本 phase 不 build；不觸發 `dist/` / `dist-blogger/` 變動
- 本 phase 不 push gh-pages；不重貼 Blogger 後台
- pm-26 deploy gate 維持 BLOCKED

---

## 9. Validation Relationship

### 9.1 Current validate baseline

- `npm run validate:content` = **0 errors / 47 warnings / 42 posts**
- 本 phase 完成 commit + push 後預期 baseline 維持不變

### 9.2 source-inactive warning 屬未來獨立 source phase

- 本 phase **不**新增任何 validate rule
- 未來 `source-inactive` rule 之 source phase（per §6）須獨立授權
- 預期該 source phase 完成後，若 8 sources 全 active，baseline 仍 `0 / 47 / 42`

### 9.3 Invalid sourceKey 行為（既有；不變）

- `source-key-invalid-type`（typeof !== 'string'）→ warning
- `source-key-empty`（trim() === ''）→ warning
- `source-key-not-found`（不在 active registry）→ warning
- `source-key-inactive`（未來；建議獨立 rule）→ warning（per §6）
- `undefined`（欄位省略）→ 合法；不觸發

### 9.4 Missing sourceKey 行為（既有；不變）

- entry 無 `sourceKey` 欄位：**合法**（per `related-links-schema.md` §11.2 之 optional 設計）
- renderer fallback chain 補入 displayLabel（per §3.2）
- 不觸發任何 warning

### 9.5 Warning id 穩定性

- 既有四條 warning id（含 sourceKey 之三條 + url-missing 等）**不**變動
- 未來新增之 `source-key-inactive` id 須**穩定 frozen**；不隨後續調整 rename
- 不對既有 id 做 deprecation（避免 fixture 與 docs cascade 變動）

### 9.6 Fixture needs（未來；不在本 phase）

未來 `source-inactive` source phase 之 fixture 規劃（**示意；不啟動**）：

- 命名建議：`_test-related-links-source-key-inactive.md`（mirror 既有 `_test-related-links-*` 既有命名 pattern）
- 形狀建議：post frontmatter 引用一個 inactive sourceKey；validator 預期觸發 `related-links-source-key-inactive` warning
- 需配套：registry 須暫時新增一個 inactive entry（或重複利用既存 entry 切換）；該 settings 變動屬 fixture phase 之獨立 settings landing

### 9.7 Why no fixture is created now

- 本 phase docs-only；無 fixture / settings 變動
- 未來 source phase 之 fixture 須在該 source phase 統一規劃；本 phase 不預先建立
- 避免 fixture 落地後**長期 dormant**（如 reverse UTM positive fixture 之 draft 滯留教訓）

---

## 10. Risk Matrix

| # | Risk | 風險等級 | 緩解 | 本 phase 是否允許 |
|---|---|---|---|---|
| R1 | 意外啟用 Admin Apply | 🔴 高 | 本 phase 僅 docs；不改 settings / source；明示禁令見 §7 / §12 | ❌ 不允許 |
| R2 | 意外新增 middleware write route | 🔴 高 | 不改 `src/**`；不新增 server-side route | ❌ 不允許 |
| R3 | 意外 settings mutation（`link-sources.json` 等） | 🟠 中 | allowed write scope 限本 docs 檔；不允許 `content/settings/*` 變動 | ❌ 不允許 |
| R4 | 意外 content mutation（`.md` post 變動 / fixture 新增 / promotion） | 🟠 中 | 不改 `content/**`；不新增 fixture；不 promote draft fixture | ❌ 不允許 |
| R5 | 在 docs acceptance 前就跳到 source implementation | 🟠 中 | 本 phase 完成後須先有 read-only acceptance cross-check phase（未來），方能進 source phase | ❌ 不允許 |
| R6 | validate baseline drift | 🟢 低 | 本 phase 為 docs-only；pre-commit 與 post-push 各跑一次 validate；任一不符預期即 stop | ❌ 不允許 drift |
| R7 | GA4 / renderer output drift | 🟢 低 | 不改 `src/views/**` / `src/scripts/build-*.js`；無 build 觸發 | ❌ 不允許 |
| R8 | sourceKey 錯誤替代 platform（語意混淆） | 🟢 低 | 本 docs §5.4 / §5.5 明示 sourceKey 不替代 platform；未來實作須遵守 | ❌ 不允許混淆 |
| R9 | inactive source 觸發 false positive warning | 🟢 低 | 當下 8 sources 全 active；rule 即使未來實作亦預期不觸發既有 baseline | ❌ 本 phase 不實作 rule |
| R10 | 意外觸發 build / deploy | 🔴 高 | 本 phase 不執行 `npm run build:*` / `npm run dev` / gh-pages push；僅 `npm run validate:content` | ❌ 不允許 |
| R11 | 意外解除 reverse UTM dormant | 🔴 高 | pm-26 deploy gate 維持 BLOCKED；本 phase 不碰 reverse UTM source / fixture | ❌ 不允許 |
| R12 | 意外執行 admin-write-cli dry-run / apply | 🔴 高 | 不執行 admin-write-cli 之任一 npm script；admin-write-cli 維持 dormant | ❌ 不允許 |
| R13 | 意外開始 download loader / validator / picker / renderer / migration | 🟠 中 | 本 phase 不碰 download surface；download dormancy 不變 | ❌ 不允許 |

### 10.1 紅線重申

per `CLAUDE.md` §3.2 + `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + pm-20 §4：

- **R1**：registry 永不含 respondent data / token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID
- **R2**：`download.fileUrl` 與 Google Form URL 不可混淆
- **R3**：landing page 之 noindex 沿用既有 SEO pipeline；本 phase 不變動

本文件之任一動作**不**違反上述紅線。

---

## 11. Future Source Phase Candidates

下列為未來可能之 phase name（**僅命名提示**；**全部 NOT authorized now**）：

### 11.1 `20260601-am-4-sourcekey-admin-selector-preflight-readonly-a`

性質：**read-only preflight**（僅檢查 source surface；不改檔；可新增單一 preflight 報告 docs 檔）

likely acceptance gates：

- 不改任何 `src/**` / `content/**` / `content/settings/**`
- 不執行 build / deploy
- 不觸發 npm install
- validate baseline 仍 `0 / 47 / 42`
- 僅 read-only inspection；輸出形式為 docs（如 preflight report）
- 完成後須有 read-only acceptance cross-check（mirror am-3 / am-5 / am-7 cadence）

### 11.2 `20260601-am-4-sourcekey-admin-selector-source-implementation-a`

性質：**source implementation**（須先有 preflight + acceptance landed 後方可啟動）

likely acceptance gates：

- 明確之 source file scope（如：僅 `src/admin/` 新建 + 對應 view template + 對應 scss component；**不**動 build / renderer / GA4 source）
- 不變動 `content/settings/*.json`
- 不變動任何 `.md` post 或 template
- **不**啟用 Admin Apply
- **不**新建 middleware route
- 不執行 build / deploy
- validate baseline 仍 `0 / 47 / 42`
- 完成後須有 read-only acceptance cross-check

### 11.3 `20260601-am-4-sourcekey-source-inactive-warning-preanalysis-docs-only-a`

性質：**docs-only preanalysis**（為 source-inactive warning rule 之未來 source phase 鋪墊）

likely acceptance gates：

- 新增單一 docs 檔
- 不改 source / settings / fixture / content
- 不執行 build / deploy
- validate baseline 仍 `0 / 47 / 42`
- 完成後須有 read-only acceptance cross-check

### 11.4 啟動先決條件

- user explicit approval（明示 phase name 與 scope）
- baseline 為本文件 commit 後之新 HEAD
- scope 限於該 phase 之 allowed write scope；不夾帶其他工作
- 不混合多 candidate 於同一 phase

---

## 12. Non-goals / Red Lines

本文件**明確不**授權下列任一動作：

| 項目 | 授權狀態 |
|---|---|
| Admin selector source implementation（任何 `src/**` 新建或變動） | ❌ 不授權 |
| source-inactive warning rule source implementation（`src/scripts/validate-content.js` 變動） | ❌ 不授權 |
| settings 變動（`content/settings/link-sources.json` 或其他 settings 變動） | ❌ 不授權 |
| content migration（任何 `content/{site}/posts/*.md` 變動） | ❌ 不授權 |
| fixture creation（任何 `content/validation-fixtures/**` 新增） | ❌ 不授權 |
| fixture promotion（draft → ready / published） | ❌ 不授權 |
| build（`npm run build:*` / `npm run dev`） | ❌ 不授權 |
| deploy（gh-pages push / `dist/` 變動） | ❌ 不授權 |
| Blogger repost（後台貼 HTML） | ❌ 不授權 |
| GA4 validation（Realtime / DebugView 操作） | ❌ 不授權 |
| reverse UTM activation | ❌ 不授權 |
| pm-26 deploy gate unblock | ❌ 不授權 |
| Admin Apply enable | ❌ 不授權 |
| middleware write route 新建 | ❌ 不授權 |
| admin-write-cli dry-run / apply 執行 | ❌ 不授權 |
| renderer output 變動（`src/views/**` / build pipeline） | ❌ 不授權 |
| validate-content source implementation 變動 | ❌ 不授權 |
| download loader / validator-via-registry / Admin picker / renderer / content migration | ❌ 不授權 |
| npm install / `package.json` 變動 | ❌ 不授權 |
| amend / rebase / reset / stash / force-push | ❌ 不授權 |
| CLAUDE.md / 既有 docs 修改 | ❌ 不授權 |

---

## 13. Suggested Next Session Entry Points

下列 3 個 phase name 為可能之下一步（**僅命名提示；不在本文件啟動；皆須 user explicit instruction**）：

1. `20260601-am-4-sourcekey-admin-selector-acceptance-crosscheck-readonly-a`
   - 性質：read-only acceptance cross-check（檢查本 phase commit 之內容、scope、baseline 不漏；不改檔）
   - 推薦作為**下一步首選**：先驗收本 phase 再考慮其他動作

2. `20260601-am-4-sourcekey-admin-selector-preflight-readonly-a`
   - 性質：read-only preflight（先檢查未來 selector source phase 所需之 source surface 是否齊備；不改檔或僅新增單一 preflight 報告 docs）
   - 僅在 acceptance cross-check landed 後考慮

3. `20260601-am-4-sourcekey-source-inactive-warning-preanalysis-docs-only-a`
   - 性質：docs-only preanalysis（為 source-inactive warning rule 鋪墊）
   - 與 selector 工作獨立；可任意時間啟動

### 13.1 啟動先決條件（重申）

- 須 user explicit instruction（明示 phase name 與 scope）
- baseline 為本文件 commit 後之新 HEAD
- scope 限於該 phase 之 allowed write scope
- 不夾帶其他工作；不混合多 candidate

---

## 14. Final Recommendation

### 14.1 推薦

**Final Idle Freeze / EXIT after this phase commit + push.**

理由：

1. 本 phase 為 night-3 roadmap §6 Candidate D 之單檔 docs-only 落地；commit 完成後即達成本 phase 目標。
2. 下一最安全步驟為**對本 commit 之 read-only acceptance cross-check**（per §13.1 之第 1 個 entry point），**不**為 source implementation。
3. Admin selector / source-inactive warning 之 source phase 均屬獨立 source 變動；須先有 acceptance cross-check + preflight 兩階段 landed，方能進 source phase。
4. 所有 dormant gates（reverse UTM / pm-26 / Admin Apply / middleware / admin-write-cli / download consumers）**無被動到期事項**；無時間壓力。
5. 對齊 `CLAUDE.md` §1 / §29 / §30 之「**不過度工程化**」原則。

### 14.2 反推薦

下列若 user 提出，須**先**確認對應之 preanalysis chain 是否已 landed：

- 直接展開 selector source implementation → 須先 acceptance cross-check（§13.1 #1）+ preflight（§13.1 #2）
- 直接展開 source-inactive warning rule source → 須先 §13.1 #3 之 docs-only preanalysis landed
- 直接 Admin Apply enable → 須先擴張 `docs/admin-2-write-pre-analysis.md` allowed write scope（per §7.5）
- 直接 middleware write route 新建 → 須先 server-side write 邊界 preanalysis

### 14.3 Out-of-scope confirmation for this phase

本 phase 之預期：

- ✅ 新增 1 檔：`docs/20260601-sourcekey-admin-selector-preanalysis.md`
- ❌ 不修改任何既有 docs
- ❌ 不修改 `CLAUDE.md`
- ❌ 不修改 source / content / settings / templates / fixtures / package
- ❌ 不 touch `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` branch / `.cache`
- ❌ 不 amend / rebase / force-push
- ❌ 不啟動任何 dormant gate
- ❌ 不影響 validate baseline（保持 `0 / 47 / 42`）

完成後請 Final Idle Freeze / EXIT；不自動啟動任何下一階段。

---

## Cross-references

- `docs/20260601-next-work-roadmap-preanalysis.md`（night-3 roadmap §6 Candidate D：本 phase 之 upstream 推薦來源）
- `docs/20260531-end-of-day-report.md`（2026-05-31 EOD checkpoint；先於本 phase 之 baseline 紀錄）
- `docs/related-links-schema.md` §3.2 / §11 / §11.5（sourceKey canonical schema + 7 子批 roadmap；step 6 selector 即本文件之主題）
- `docs/20260526-related-links-source-label-admin-design.md`（night-1 source label / sourceKey 設計建議；對應本文件之 §4 / §5 UX 概念來源）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選工作清單；含 §3.8 sourceKey 子批 roadmap）
- `docs/admin-2-write-pre-analysis.md`（Admin-2 write surface + safety plan；Admin Apply 啟用所須）
- `docs/ga4-link-tracking-spec.md`（GA4 event spec；含 `link_source_key` param 之既有定義）
- `docs/click-tracking-governance.md`（click tracking 治理原則）
- `content/settings/link-sources.json`（registry 既有 8 entries；本 phase 不變動）
- `src/scripts/validate-content.js`（既有 3 條 sourceKey rules；本 phase 不變動）
- `CLAUDE.md`（專案規範主檔）

---

End of preanalysis.
