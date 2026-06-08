# Commerce Admin Selector / Preview UI — Source Pre-analysis（docs-only）

- Phase：`20260608-pm-23-commerce-admin-selector-ui-source-preanalysis-docs-only-a`
- Date：2026-06-08
- Status：**docs-only source preanalysis**（無 source implementation、無 write route、無 registry / fixture / memory mutation）
- 上一層：`docs/20260608-commerce-admin-selector-preanalysis.md`（A1，已 accepted）
- 本文件 = 該 ladder 之 **A2**（Admin selector UI source preanalysis；docs-only）

---

## 1. Executive Summary

本文件是一份 **docs-only source preanalysis**，盤點「未來」若要實作 read-only commerce selector / preview UI 時的 source touch points 與最小安全實作路徑。

明確界定：

- 本文件 **不做** Admin implementation。
- 本文件 **不做** write route。
- 本文件 **不啟動** Admin Apply / middleware / admin-write-cli。
- 本文件 **不啟動** C7（missing-role required policy）source。
- 本文件 **不啟動** download renderer / landing page implementation。
- 目標僅是盤點未來 read-only Admin commerce selector / preview UI 的 source touch points 與最小安全實作路徑，並界定其與既有 Admin 架構、loader、validator、空 registry、紅線之間的關係。

此文件本身不改變 production 行為；commerce registry 仍為 empty，validator 行為不變，baseline 不變。

---

## 2. Accepted Baseline

- HEAD = origin/main = `cb2f8e0`
- latest subject = `docs(admin): plan commerce selector`
- normal validate = **0 errors / 69 warnings / 59 posts**
- overlay validate = **0 errors / 70 warnings / 59 posts**
- Admin selector preanalysis（A1）**accepted**

狀態事實（authoring 時）：

- commerce content-reference rules C1 / C2 / C3 / C5 / C6 / C8 / C4 / C9 已 landed 且 fixture-proven（warning-only）。
- **C7（missing-role required）deferred / NO-GO**。
- role 欄位維持 **recommended-but-optional**（建議填、但非必填）。
- production commerce registry **empty**（`content/settings/commerce-links.json` = `{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`）。
- Admin Apply / middleware / admin-write-cli **dormant**。

---

## 3. Existing Admin / Source Architecture Inventory（read-only 盤點）

本節為 **read-only 觀察**，描述目前 repo 中既有 Admin 相關 source 與路徑。所有結論基於實際檔案內容；**未知者標 unknown，不臆測**。

### 3.1 既有 read-only Admin UI source（已存在）

- `src/views/admin/index.ejs`：read-only Admin overview 頁（`<meta name="robots" content="noindex, nofollow">`）。為純顯示頁；含 post 列表、SEO / FB sidecar dry-run validation 結果顯示，以及一個 **sourceKey selector preview（disabled `<select>`）**。
- `src/scripts/load-admin-posts.js`：**dev-mode-only read-only loader**。glob `content/{github,blogger}/posts/*.md`，attach 既有 `admin-field-validators.js` 之 validation 結果，並透過 `active-source-keys.js` 之 `buildActiveSourceOptions` 提供 sourceKey selector 之 options。檔頭明示「不寫入任何檔案；不呼叫 safe-write；不接 actual write path；不啟用 Admin Apply / middleware write / admin-write-cli」。
- 渲染途徑：`src/scripts/build-github.js` import `loadAdminPosts` 並於 build 時渲染 admin 頁。

**重要先例（precedent）**：repo 已有一個落地的 **read-only selector pattern**——sourceKey selector（`active-source-keys.js` + `load-admin-posts.js` + admin `index.ejs` 之 disabled `<select>`，per `docs/20260601-sourcekey-admin-selector-preanalysis.md`）。commerce selector 可 **mirror 此既有 pattern**，不需發明新架構。

### 3.2 既有 settings loading path（可供 Admin 使用）

- `src/scripts/load-settings.js`：read-only 載入全站 settings，並把 commerce registry **unwrap 為 array** 暴露為 `settings.commerceLinks`（CLAUDE.md 已載明；loader 無下游 consumer）。
- 但 **目前 admin 頁的 render context 並未帶入 settings**：per `load-admin-posts.js` 檔頭註記，build-github 之 admin render context 僅含 `{ posts, builtAt }`（不含 settings）。換言之，settings → admin 之 read-only exposure path **概念上可行但尚未接通**；未來 selector 需新增此 read-only data flow（見 §4 / §10）。

### 3.3 既有 write route / middleware route（狀態盤點）

- **無 web / dev-server write route**：`vite.config.js` 不含 `configureServer` / middleware；admin `index.ejs` 內明文標註「Phase 4 Vite dev middleware / write route preanalysis（not started）」。
- **唯一 write 路徑為 CLI**，且 dormant + 範圍極窄：
  - `src/scripts/admin-write-cli.js`（`npm run admin:write`）：gated write driver。dry-run 為預設；real-write 需 `--apply` **且** `payload.dryRun === false`；real-write 僅允許 `status: 'draft'`；僅允許 field `description` / `searchDescription`；delegates 至 `safeWrite`（atomic tmp+rename；`enforceCleanGit: true`）。
  - `src/scripts/admin-write-whitelist.js`：白名單僅 `content/{github,blogger}/posts/*.{md,publish.json,fb.md}`；**明確拒絕 settings / dist / validation-fixtures / package**；拒絕相對路徑 / 跨 drive / `..` traversal。
  - 支援檔：`admin-frontmatter-patcher.js`、`admin-field-validators.js`、`safe-write.js`、`git-status-check.js`、`safe-write-test.js`。

### 3.4 Admin Apply 目前狀態

- **針對 commerce**：**不存在** commerce 的 Admin Apply。commerce registry 之寫入未在任何 source 被 wire；且 write whitelist **明確拒絕 settings**（commerce registry 屬 settings JSON），故即便既有 CLI 也無法寫 commerce registry。
- **針對 post frontmatter 之兩個欄位（`description` / `searchDescription`）**：存在一個 **gated、dormant** 的 CLI Apply 路徑（§3.3），但其 scope 與 commerce 無關，亦未接任何 UI button / middleware。
- 結論：**commerce 的 Admin Apply = 不存在 / dormant**；既有的窄範圍 post-field CLI Apply 與本 workline 正交，不應被本 selector 觸及或擴張。

---

## 4. Data Source Design for Future Selector

- selector 之 data source **應為 production `settings.commerceLinks`**（loader 已 read-only 載入並 unwrap 為 array）。
- **不讀** `_sample.commerce-links.json` 作為 production data（該檔為 sample-only blueprint；loader 白名單天然不載入；不得整檔複製為 production registry）。
- **不 auto-promote** sample entries 成 production options。
- production registry **empty 時顯示 empty state**（見 §6 / §10）；不得因此自動建立假 entry。
- **不寫入 registry**、**不 seed registry**。
- **不**使用 validation fixture（含 overlay fixture）作為 Admin source；fixture 僅供 validator 測試，與 Admin data source 正交。
- selector data 之 shape **應與 validator / loader 之 registry shape 對齊**（single source of truth），避免兩處各自定義而 drift；建議重用 / mirror loader 之 unwrap 結果與 validator 之 key 概念（如 `commerce-links.json` entry 之 `linkId` / `active` / 安全 display 欄位）。

---

## 5. Read-only UI Scope

initial UI **只做 selector / preview**（mirror §3.1 sourceKey precedent）：

- 顯示 available `commerceLinks`。
- 顯示 active / inactive status。
- 顯示 safe display label（公開可見之 display 欄位）。
- 顯示 ref machine key（讓作者知道將寫入 frontmatter 的字串）。
- 顯示 role dropdown（authoring guidance；§7）。
- labelOverride caution UI（advanced / 收合；§8）。
- 可產生 **copyable YAML snippet**（§9）。
- **不自動寫入 markdown**。
- **不自動寫入 registry**。
- **不觸發 Admin Apply**。

第一版 UI 元件建議維持與既有 sourceKey selector 同等克制：**disabled / copy-only 互動**，不接任何 fetch / POST / write endpoint。

---

## 6. Ref Picker UI Design

- empty registry → **empty state**（例如：「目前沒有可用的 commerce link，請先依紅線規範手填 registry entry」）。
- inactive entry → 顯示 **inactive badge**，並建議不可直接選用（引導改用其 replacement / active entry；對齊 C4）。
- `replacementTarget` 存在時 → **僅顯示安全 hint**（如「has replacement target」），**不**顯示 `targetUrl`、**不**顯示 tracking URL、**不**顯示 merchant id。
- picker 只需 **ref machine key + safe display label + status**；ref 應標示為 **internal reference key**（machine key），讓作者理解這是將寫入 frontmatter 的識別字串、非對外顯示文字。
- 若 registry entry 缺 display label 欄位 → 應有 **safe fallback**（例如退回顯示 ref machine key 本身，而非顯示任何敏感欄位）。

---

## 7. Role Dropdown UI Design

- enum 必須與 C8 source 一致（single source of truth，建議對齊 `VALID_COMMERCE_LINK_ROLE`）：

  ```
  primary / alternate / official / price-check / library / direct
  ```

- **不允許 free-text role**（避免 C8 invalid-role）。
- missing role 目前 **optional**：dropdown 可提供「（不指定）」選項或允許不選。
- dropdown 是 **guidance**，**不代表 C7 required**。
- required-role policy 必須 **另案 user / product approval**。
- UI **不應使 C7 看起來已啟動**（不得在 UI 上把 role 標為必填 / 不得以紅星 / 阻擋送出等暗示 required）。

---

## 8. LabelOverride Caution UI Design

- `labelOverride` 是 **advanced / caution 欄位**（建議 UI 預設收合）。
- **不顯示** `internalLabel` 給一般 author。
- **不 auto-populate** `internalLabel`（不得自動帶入作為 `labelOverride` 預設值；否則等同主動製造 C9）。
- **不 echo sensitive values**：UI / snippet 不回顯 `internalLabel` 實際值；任何「是否等於 internalLabel」之判斷應在不向作者揭露原值前提下處理（對齊 C9 message 不 echo internalLabel）。
- 提示作者：`labelOverride` 請填**公開 CTA 或短文字**，**不要貼內部識別字串**。
- 與 **C9 display-override-risk** 對齊（selector 從源頭降低 C9 發生率）。

---

## 9. Copyable YAML Snippet Design

- snippet 可包含：
  - `ref`
  - `role`
  - `labelOverride` **only if** user explicitly fills it
- snippet **不應包含** `targetUrl` / tracking URL / token / credential / merchant id / sid / aff_id。
- snippet **不應自動 apply**。
- snippet **只是 copy-only**：由作者貼回 markdown 後，仍由 **validator 把關**（selector 不取代 validator）。
- 若 registry empty，snippet UI 應 **disabled 或 empty-state**（無 entry 可選時不產生 snippet）。

snippet 範例（**僅示意；值皆 placeholder**）：

```yaml
affiliate:
  links:
    - ref: "sample-commerce-active"   # 由 selector 從 registry 帶出（machine key）
      role: "primary"                 # 由 role dropdown 選取（enum，非 free-text）
      # labelOverride 預設不帶；如需自訂 CTA，請填公開文案，勿貼內部識別字串
```

---

## 10. Source Touch Point Candidates（read-only 盤點）

未來若實作 read-only selector，**可能** touch 的檔案類型（僅列候選與風險；**不實作**）：

| 候選類型 | 可能檔案 | 角色 | 風險註記 |
|----------|----------|------|----------|
| UI source（EJS） | `src/views/admin/index.ejs`（新增一個 read-only commerce selector 區塊） | 純顯示 | 低；mirror 既有 sourceKey selector；維持 disabled / copy-only |
| read-only helper（JS） | 新檔，如 `src/scripts/active-commerce-links.js`（mirror `active-source-keys.js`） | 把 `settings.commerceLinks` 整成安全的 selector options | 低-中；須只輸出 safe 欄位（ref / label / status），不得帶 targetUrl / token |
| admin loader 接線 | `src/scripts/load-admin-posts.js`（新增 read-only attach；非寫入） | 把 commerce options attach 到 admin view context | 中；須 **read-only**；不得擴張 write path |
| settings 暴露 path | `build-github.js` admin render context（目前僅 `{ posts, builtAt }`）需新增 read-only `commerceLinks` 暴露 | 把 settings 帶進 admin view | 中；僅 read；不得改動 build-github 其他 render context / 不得碰 production data |
| type / schema helper | 可選的 shape 對齊常數（與 validator enum 對齊） | single source of truth | 低；應 reuse，不得分叉 |
| CSS / UI component | admin `index.ejs` 既有 inline `<style>` 或 components SCSS | 顯示樣式 | 低；遵 §9.4 Flex-first / §9.5 SCSS 歸類 |
| test / validation hook | 可選 | 驗證 selector 為 read-only | 低；非必要；不得引入 write |
| package script | 預設**不需新增**（selector 隨 build-github / dev 渲染） | — | 若日後需獨立預覽再評估；本層不決定 |

**明確列出不應 touch 的檔案 / 路徑：**

- `src/scripts/validate-content.js`（validator 行為不可被 selector 改動）。
- `src/scripts/load-settings.js` 之 **production behavior**（不可為 selector 改變 loader 對 production settings 之載入語意）。
- `content/settings/commerce-links.json`（production registry；不寫、不 seed）。
- `content/settings/_sample.commerce-links.json`（sample blueprint；不得當 production source、不得 auto-promote）。
- middleware / write route（不建立）。
- `admin-write-cli.js` / `admin-write-whitelist.js` / `safe-write.js`（不擴張 write path；不把 commerce 納入 whitelist）。

---

## 11. Security / Privacy / Commercial Red Lines

本設計（與任何後續實作）必須維持：

- **no** real affiliate URL display。
- **no** tracking id / sid / aff_id display。
- **no** merchant id / token / credential display。
- **no** commission-sensitive data（commission / payout / clickCount 等 dashboard 統計）。
- **no** production registry seed。
- **no** sample auto-promote（`_sample.*` 不得被當 production options）。
- **no** write route。
- **no** Admin Apply。
- **no** middleware write。
- **no** admin-write-cli production caller（不得把 commerce 接上既有 CLI write path）。
- **no** Google Form / respondent data。

本文件所有範例值皆 placeholder（`sample-*` / `example.invalid`），不含任何真實 affiliate / merchant / token / tracking id / sid / aff_id / commission / Google Form ID / respondent data / 私人下載連結。

---

## 12. Relationship to Validators

- selector 之價值在於從源頭 **降低 C1 / C2 / C3 / C5 / C6 / C8 / C4 / C9 的 authoring mistakes**（把易錯人工輸入轉成受約束選擇）。
- selector **不取代 validator**：validator 仍是最終守門人（gatekeeper）。
- 作者貼回 markdown 之 snippet **仍須通過既有 validator**。
- **C7 remains deferred**：selector 之 role dropdown 僅 guidance，不啟動 required policy。
- selector **未來可支援** C7（提供穩定合法 role 輸入途徑），但**不啟動** C7（啟動需另案 product / user approval + scope freeze + baseline impact 量化）。

---

## 13. Implementation Risk Assessment（未來實作選項比較）

| 選項 | source complexity | mutation risk | validator alignment | authoring benefit | required tests / acceptance burden | 適合 first implementation |
|------|-------------------|---------------|---------------------|-------------------|-------------------------------------|---------------------------|
| **A. Static read-only registry preview only** | 低（顯示 entries / status / safe label） | **極低**（純讀純顯示） | 中性 | 中（看得到有哪些 entry） | 低（baseline 不變 + empty-state） | **是** |
| **B. Read-only ref picker + role dropdown** | 低-中 | 低（copy-only） | 正向（ref 只能選 registry 內、role 只能選 enum） | 中高（消滅 C1/C2/C3/C8，部分 C5） | 低-中（enum 對齊 + empty-state） | **是**（A 的自然延伸） |
| **C. Read-only ref picker + role dropdown + copyable snippet** | 中 | 低（snippet 不自動 apply） | 正向（產 ref-only snippet，避 C6） | 高 | 中（snippet 內容 red-line 檢查） | **可接受**（建議納入，前提是 snippet 嚴守紅線） |
| **D. Include labelOverride advanced field** | 中 | 低-中（caution 欄位） | 正向（額外降 C9） | 高 | 中（不 echo / 不 auto-populate internalLabel 之驗收） | **可接受**（建議收合 advanced 區） |
| **E. Write-enabled editor** | **高**（寫 .md / registry） | **高**（直接改 production / settings） | 複雜（寫入後須立即驗證） | 高（一站式） | **高**（write gate / TOCTOU / clean-git / 紅線全驗） | **否（NO-GO for now）** |

**小結**：first implementation 建議落在 **A + B（+ C/D 視紅線把關成熟度逐步納入）**，全部 read-only / copy-only。**E NO-GO**，違反「Admin Apply / middleware / admin-write-cli dormant」紅線。

---

## 14. Recommended Future Implementation Scope

- 建議第一個 source implementation **仍應 read-only**。
- 建議 **不寫 markdown、不寫 registry**。
- 建議 **不碰 middleware**。
- 建議 **不碰 Admin Apply**。
- 建議最小可接受範圍：
  - read-only registry preview（mirror sourceKey selector pattern）。
  - role dropdown enum display（authoring guidance，不 required）。
  - copyable YAML snippet **if low risk**（snippet 嚴守 §9 / §11 紅線）。
- registry 目前 empty → implementation 應 **以 empty-state 為主**（real-entry path 待 user 依紅線手填後才出現）。

---

## 15. Future Acceptance Criteria

未來若進行 source implementation，須滿足：

- normal validate **remains unchanged**（empty registry → production posts 0 觸發）。
- overlay validate **remains unchanged**。
- **no** production registry mutation。
- **no** sample auto-promote。
- **no** write route。
- **no** sensitive value display（無 real affiliate URL / tracking id / sid / aff_id / merchant id / token / credential / commission data）。
- **no** Admin Apply。
- UI handles empty registry（empty-state 正確）。
- **C7 still deferred**。
- commit scope limited and reviewed（單一 workline；diff 可審）。

---

## 16. Future Phase Ladder（建議）

- **A2**（本文件）：read-only Admin selector UI **source preanalysis**（docs-only）。
- **A3**：read-only acceptance of this source preanalysis（本文件被接受；不啟動任何 source）。
- **A4**：read-only registry preview **implementation**（**no write**；empty-state；mirror sourceKey selector）。
- **A5**：implementation acceptance（驗證完全 read-only、baseline 不變、無 production mutation）。
- **A6**：optional copyable snippet **preanalysis / implementation**（仍不自動 apply）。
- **much later**：write-enabled Admin，**only with explicit approval**（NO-GO until then）。
- **C7 source remains separate and blocked**（與本 ladder 正交；不因 selector 落地而解鎖）。

每一階 ladder 之間**不自動推進**，皆需 explicit user approval。

---

## 17. Final Recommendation

- **不要**直接 implementation。
- **不要**啟動 write-enabled Admin。
- **不要**啟動 C7。
- 對本文件本身，建議的下一步是 **read-only acceptance of this doc**。
- 真正的下一個 implementing phase 才是 **read-only registry preview implementation**（A4）或更細一層 implementation preflight。
- 在 product / user decision 出現前：C7 remains **deferred / NO-GO**；role remains **recommended-but-optional**；production commerce registry remains **empty**；Admin Apply / middleware / admin-write-cli remain **dormant**。

> 完成本 preanalysis 後不自動開始下一個 phase。進入 Final Idle Freeze / await user instruction。
