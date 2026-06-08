# Commerce Admin Selector / Authoring UI — Pre-analysis（docs-only）

- Phase：`260608-pm-21-commerce-admin-selector-preanalysis-docs-only-a`
- Date：2026-06-08
- Status：**docs-only preanalysis**（無 source、無 Admin implementation、無 registry / fixture / memory mutation）
- Accepted baseline at authoring time：HEAD = origin/main = `2d3006d`；normal validate = 0 errors / 69 warnings / 59 posts；overlay validate = 0 errors / 70 warnings / 59 posts

---

## 1. Executive Summary

本文件是一份 **docs-only preanalysis**，僅討論「未來」commerce links 的 Admin selector / authoring UI 設計方向，**不在本輪做任何實作**。

明確界定：

- 本文件 **不做** Admin implementation。
- 本文件 **不啟動** Admin Apply。
- 本文件 **不啟動** middleware write。
- 本文件 **不啟動** admin-write-cli。
- 本文件 **不啟動** C7（missing-role required policy）source。
- 目標僅是替「未來」commerce Admin selector / authoring UI 描繪方向，並界定其與既有 validator rules、空 registry、紅線之間的關係。
- 設計主張：**read-only 為第一階段，不做任何寫入**（不寫 markdown、不寫 registry）。

此文件本身不改變 production 行為；commerce registry 仍為 empty，validator 行為不變，baseline 不變。

---

## 2. Current Accepted Baseline

- HEAD = origin/main = `2d3006d`
- latest subject = `docs(commerce): evaluate missing role validation`
- normal validate = **0 errors / 69 warnings / 59 posts**
- overlay validate = **0 errors / 70 warnings / 59 posts**

狀態事實（authoring 時）：

- commerce content-reference rules C1 / C2 / C3 / C5 / C6 / C8 / C4 / C9 已 landed 且 fixture-proven（warning-only）。
- **C7（missing-role required）deferred / NO-GO**。
- role 欄位維持 **recommended-but-optional**（建議填、但非必填）。
- production commerce registry **empty**（`content/settings/commerce-links.json` = `{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`）。
- Admin selector **尚未實作**。
- Admin Apply / middleware / admin-write-cli **dormant**。

---

## 3. Problem Statement

未來若要讓作者以 `affiliate.links[].ref` 引用 registry entry（而非手填 raw URL），純手填會有下列風險：

1. **手填 ref 容易出錯**：作者直接在 `.md` frontmatter 鍵入 `ref` machine key，容易 typo、引用到不存在 / inactive 的 entry（觸發 C3 / C4），或重複引用（C5）。
2. **role 目前 optional，但若未來要 required，需要 UI 支援**：role 是 recommended-but-optional；若未來 C7 要把它變 required，作者必須有一個「不會填錯 enum、不會留空」的輸入途徑——free-text 手填只會增加 C8（invalid-role）與未來 C7（missing-role）的發生率。
3. **`labelOverride` 有內部名稱外洩風險**：`labelOverride` 若等於 registry 的 `internalLabel`，等同把內部識別字串對外輸出（C9 偵測之風險）。手填情境下作者很容易把內部代號貼進 `labelOverride`。
4. **production registry empty**：selector **不能假設**已有任何真實 entries 可選。第一階段必須能優雅處理 empty-state，且**不得**因此自動建立假 entry 或做 production migration。

Admin selector 的價值，是把上述「容易填錯的人工輸入」轉成「受約束的選擇」，從源頭降低 C3 / C4 / C5 / C8 / C9（與未來 C7）的發生率。

---

## 4. Relevant Existing Validator Rules

目前已 landed 的 commerce content-reference rules（皆 warning-only；掃 published / ready post 之 `affiliate.links[].ref`）：

| Rule | type | 意義 | Admin selector 如何降低發生率 |
|------|------|------|-------------------------------|
| C1 | `commerce-ref-invalid-type` | `ref` 非 string | selector 永遠產生 string ref → 不會發生 |
| C2 | `commerce-ref-empty` | `ref` 空 / 全空白 | selector 不允許空選取 → 不會發生 |
| C3 | `commerce-ref-not-found` | `ref` 不在 registry | selector 只列 registry 內 entry → 不會選到不存在 ref |
| C5 | `commerce-ref-duplicate-in-post` | 同篇重複 ref | selector 可在 UI 警示「已加入」→ 降低重複 |
| C6 | `commerce-ref-direct-url-coexist` | 同一 link 同時有 `ref` 與直接 `url` | selector 產生 ref-only snippet → 不混入 raw url |
| C8 | `commerce-ref-invalid-role` | `role` 不在 enum | role 用 dropdown（非 free-text）→ 不會 invalid |
| C4 | `commerce-ref-inactive` | ref 指向 inactive entry | selector 對 inactive entry 明確標示 / 不可選 → 降低 |
| C9 | `commerce-ref-display-override-risk` | `labelOverride` == registry `internalLabel` | UI 不顯示 / 不自動帶入 internalLabel → 降低外洩 |
| **C7** | （missing-role required）| role 缺漏需 required | **deferred / NO-GO**；selector 僅做 authoring guidance，**不**代表 required |

role enum（與 C8 一致，source：`VALID_COMMERCE_LINK_ROLE`）：

```
primary / alternate / official / price-check / library / direct
```

關鍵觀察：**Admin selector 主要是「預防性」工具——把易錯的人工輸入轉成受約束選擇，從而降低 C3 / C4 / C5 / C8 / C9 的發生率**；它不取代 validator，validator 仍是最終守門人。

---

## 5. Admin Selector Scope Candidates

下列候選依「risk / authoring benefit / 與 validator 互動 / 誤觸 production mutation 風險 / 對 registry seed 的依賴 / 對 Admin Apply·middleware 的依賴 / 是否適合作為第一階段」比較。

### A. Ref picker only

- risk：**低**（純讀 registry、產生 ref string）。
- authoring benefit：中（直接消滅 C1 / C2 / C3，部分 C5）。
- 與 validator 互動：正向；selector 只能選 registry 內 entry。
- 誤觸 production mutation 風險：**低**（read-only，可只產生 copyable snippet）。
- 依賴 registry seed：高（empty registry 時只能顯示 empty-state）。
- 依賴 Admin Apply / middleware：**無**（若維持 copy-only）。
- 適合第一階段：**是**（最小、最安全）。

### B. Ref picker + role dropdown

- risk：低（多一個受約束 enum 選單）。
- authoring benefit：中高（再消滅 C8；為未來 C7 鋪路）。
- 與 validator 互動：正向；role 只能選合法 enum。
- 誤觸 production mutation 風險：低（仍可 copy-only）。
- 依賴 registry seed：高（同 A）。
- 依賴 Admin Apply / middleware：無。
- 適合第一階段：**是**（A 的自然延伸；推薦納入第一階段）。

### C. Ref picker + role dropdown + labelOverride safety helper

- risk：低-中（labelOverride 是 advanced / caution 欄位）。
- authoring benefit：高（額外處理 C9 外洩風險）。
- 與 validator 互動：正向；helper 主動提示不要貼內部識別字串。
- 誤觸 production mutation 風險：低（copy-only）。
- 依賴 registry seed：高。
- 依賴 Admin Apply / middleware：無。
- 適合第一階段：**可接受**（建議把 labelOverride 設為預設收合的 advanced 區，避免一般作者誤用）。

### D. Registry preview table only

- risk：低（純讀、純顯示）。
- authoring benefit：中（讓作者看到有哪些 entry / status / safe label，但不直接產生 snippet）。
- 與 validator 互動：中性（不直接產生引用）。
- 誤觸 production mutation 風險：**極低**。
- 依賴 registry seed：高（empty 時就是 empty-state）。
- 依賴 Admin Apply / middleware：無。
- 適合第一階段：**是**（可作為 A/B/C 的底層顯示元件）。

### E. Read-only dry-run panel only

- risk：低（顯示「若用此 ref + role 會否觸發 warning」的預覽）。
- authoring benefit：中高（把 validator 結果前移到 authoring 時）。
- 與 validator 互動：高（須重用 validator 既有判斷，不可分叉邏輯）。
- 誤觸 production mutation 風險：低（read-only）。
- 依賴 registry seed：中（empty 時 dry-run 多半回報 C3）。
- 依賴 Admin Apply / middleware：無。
- 適合第一階段：可接受（建議 later phase；須謹慎避免與 validator 邏輯分叉）。

### F. Full write-enabled Admin editor

- risk：**高**（直接寫 `.md` / registry）。
- authoring benefit：高（一站式）。
- 與 validator 互動：複雜（寫入後須立刻驗證）。
- 誤觸 production mutation 風險：**高**（直接改 production 內容 / settings）。
- 依賴 registry seed：高。
- 依賴 Admin Apply / middleware：**高**（必須有 write route + middleware）。
- 適合第一階段：**否（NO-GO for now）**；違反目前「Admin Apply / middleware / admin-write-cli dormant」紅線。

### 小結

第一階段建議落在 **A + B（+ D 作為顯示底層；C 的 labelOverride 以收合 advanced 區呈現）**，全部 **read-only / copy-only**。**E** 推遲為 later phase。**F** 明確 NO-GO。

---

## 6. Recommended Initial Scope

建議第一階段**只做 read-only selector / preview**：

- **不寫入 markdown**。
- **不寫入 registry**。
- **不啟動 Admin Apply**。
- 顯示 available `commerceLinks`（含 status）。
- 顯示 safe display label（`displayLabel`），**不**顯示 `internalLabel`。
- 顯示 allowed role enum（dropdown，作為 authoring guidance）。
- 顯示 ref machine key（讓作者知道將寫入 frontmatter 的字串）。
- 可產生 **copyable YAML snippet**，但**不直接 apply**（作者自行貼到 `.md`，再經既有 validator 把關）。
- role dropdown 僅作 **authoring guidance**，**不代表 C7 required**。

設計理由：copy-only 把「易錯人工輸入」轉成「受約束選擇」，同時完全不碰 production 寫入路徑，最大化收益 / 最小化風險，且不需要 Admin Apply / middleware。

copyable snippet 範例（**僅示意；值皆 placeholder**）：

```yaml
affiliate:
  links:
    - ref: "sample-commerce-active"   # 由 selector 從 registry 帶出（machine key）
      role: "primary"                 # 由 role dropdown 選取（enum，非 free-text）
      # labelOverride 預設不帶；如需自訂 CTA，請填公開文案，勿貼內部識別字串
```

---

## 7. Role Dropdown Design

- enum 需與 C8 **完全一致**（不可分叉）：

  ```
  primary / alternate / official / price-check / library / direct
  ```

- missing role 目前仍 **optional**：dropdown 可提供「（不指定）」選項或允許不選。
- dropdown 可提供**建議**（例如預設高亮 `primary`），但**不代表必填**。
- 未來若 C7 要把 role 變 required，**須先有 product / user decision**；在那之前 dropdown 不得在 UI 上強制要求 role。
- **不允許 free-text role 輸入**，以避免 C8（invalid-role）。
- dropdown 的 enum 來源建議與 source 之 `VALID_COMMERCE_LINK_ROLE` 對齊（single source of truth），避免兩處各自維護而漂移。

---

## 8. Ref Picker Design

- 來源**應**是 `settings.commerceLinks`（loader 已 read-only 載入並 unwrap 為 array）。
- 因 production registry 目前 **empty**，first phase 可用 **empty-state UI**（見 §10）。
- **不應**讀 `_sample.commerce-links.json` 作為 production source（該檔為 sample-only blueprint，loader 白名單天然不載入；不得整檔複製為 production registry）。
- **不應** auto-promote sample entries 成 production options。
- 若 registry entry `active === false`（inactive），UI 應**清楚標示 inactive**（並建議不可直接選用，引導改用其 replacement / active entry）。
- 若 entry 有 `replacementTarget`，只可顯示「has replacement target」或安全 label，**不**顯示敏感 URL / token。
- **不應**顯示 `targetUrl` 或任何 tracking URL（picker 只需 ref machine key + safe display label + status）。

---

## 9. LabelOverride Safety Design

- `labelOverride` 應是 **advanced / caution 欄位**（建議 UI 預設收合，避免一般作者誤用）。
- 風險核心：`labelOverride == internalLabel` 的**內部識別字串外洩**（即 C9 偵測之情形）。
- UI **應避免**把 `internalLabel` 顯示給一般作者。
- 若要提供 `labelOverride` 輸入，應**提示作者不要貼內部識別文字**（請填可公開的 CTA / 顯示文案）。
- **不應**自動帶入 `internalLabel` 作為 `labelOverride` 預設值（否則等於主動製造 C9）。
- selector 不需要、也不應該回顯 internalLabel 的實際值；任何「比對是否等於 internalLabel」的判斷應在不向作者揭露原值的前提下處理（與 C9 message 不 echo internalLabel 的設計一致）。

---

## 10. Registry Preview / Empty State

- production registry empty 時，UI 應顯示 **empty state**（例如：「目前沒有可用的 commerce link，請先依紅線規範手填 registry entry」）。
- **不應**建立 fake production entries。
- sample file（`_sample.commerce-links.json`）**只能作 documentation / reference**，不得作為 selector 的 production 來源、不得 auto-promote。
- 若未來有 **user-provided real entry**（user 依 CLAUDE.md §3 紅線手填至 `commerce-links.json`），selector 才能列出 production options。
- **空 registry 不應解除 C7 deferred**：registry 是否為空，與「role 是否 required」是兩個獨立決策；empty-state 的存在不構成啟動 C7 的理由。

---

## 11. Relationship to C7

- Admin selector 是 C7 的**前置條件之一**（required-role 要可用，作者需要一個不會填錯 role 的途徑），但**selector 存在 ≠ C7 可立即 source**。
- 若未來要 required-role（C7），順序應為：
  1. selector / role dropdown 應**先可用**（authoring 端能穩定產出合法 role）。
  2. C7 的 **scope 必須凍結**（required 範圍、觸發 severity、message）。
  3. **baseline impact 必須已知**（先量化 required 後對現有 posts 的 warning/error 影響）。
  4. selector 必須能支援 required 流程（不可選空 role / 強制選取）。
- 在以上條件齊備並取得 product / user decision 之前，**C7 remains deferred / NO-GO**。

---

## 12. Security / Privacy / Commercial Red Lines

本設計（與任何後續實作）必須維持：

- **no** real affiliate URL。
- **no** tracking id / sid / aff_id。
- **no** merchant id / token / credential。
- **no** commission-sensitive data（commission / payout / clickCount 等 dashboard 統計）。
- **no** production registry seed（本輪不 seed；selector 不得自動 seed）。
- **no** sample auto-promote（`_sample.*` 不得被當 production options）。
- **no** write route（第一階段 read-only / copy-only）。
- **no** Admin Apply。
- **no** middleware write。
- **no** admin-write-cli production caller。

本文件所有範例值皆 placeholder（`sample-*` / `example.invalid`），不含任何真實 affiliate / merchant / token / tracking / commission / Google Form / respondent data。

---

## 13. Future Phase Ladder（建議）

- **A1**：read-only acceptance of this preanalysis（本文件被接受；不啟動任何 source）。
- **A2**：Admin selector UI **source preanalysis**（docs-only；描述元件 / 資料流 / 與 loader 的 read-only 介面，仍不寫入）。
- **A3**：read-only registry preview **implementation**（**no write**；顯示 available entries / status / safe label / role enum；empty-state）。
- **A4**：acceptance cross-check（驗證 A3 完全 read-only、baseline 不變、無 production mutation）。
- **optional**：copyable YAML snippet 生成（仍不直接 apply）。
- **much later, only with explicit approval**：Admin Apply / middleware / write route（NO-GO until then）。

每一階 ladder 之間**不自動推進**，皆需 explicit user approval。

---

## 14. Final Recommendation

- **不要**啟動 Admin Apply。
- **不要**啟動 C7 source。
- **不要**啟動 Admin selector implementation（本輪僅 docs-only preanalysis）。
- 最安全的下一步 workline 是 **Admin selector UI source preanalysis（docs-only）**，而**非** implementation。
- 對本文件本身，建議的下一步是 **read-only acceptance of this doc**。
- 在 product / user decision 出現前：C7 remains **deferred / NO-GO**；role remains **recommended-but-optional**；production commerce registry remains **empty**；Admin Apply / middleware / admin-write-cli remain **dormant**。

> 完成本 preanalysis 後不自動開始下一個 phase。進入 Final Idle Freeze / await user instruction。
