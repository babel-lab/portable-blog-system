# 2026-06-08 Commerce C8 Invalid Role Validation — Preanalysis (docs-only)

Phase name: `20260608-am-11-commerce-c8-invalid-role-preanalysis-docs-only-a`
Date: 2026-06-08 10:30 +0800
Mode: **docs-only C8 source preanalysis**（no source / no fixture / no content / no settings registry mutation / no templates / no renderer / no loader change / no validator rule landing / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / no production content migration / no `npm install` / no CLAUDE.md mutation / no MEMORY mutation）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-22 `d5cfcd0` | commerce-links validator preanalysis（docs-only） | 凍結 registry-level R1..R15 + content-reference C1..C9 rule contract |
| am-7 (20260604) `（content-ref preanalysis）` | commerce-links content-reference validation preanalysis | C1..C9 content-reference rule contract 凍結；**§4.5 凍結 role enum 候選**；C8 標記 defer |
| `39b89e3` | commerce content-reference source landing（C1 / C2 / C3 / C5） | `validate-content.js` 新增 `validateCommerceRefs`；C4 / C8 / C9 skipped |
| `149efdc` / `3aeabbc` | commerce content-ref C1/C2/C3/C5/C6 fixtures landing | 5 個 post-level fixture；baseline → 68/58 |
| `281cd43` | commerce C6 source landing | `validateCommerceRefs` 新增 C6 `commerce-ref-direct-url-coexist`（warning-only） |
| `8c9fddf` (20260608-am) | commerce C4 inactive ref validation preanalysis（docs-only） | C4 `commerce-ref-inactive` rule contract / registry coupling / fixture strategy 凍結；source 未實作 |
| `92e0c69` (20260608) | docs(claude): soft compress project memory guide | CLAUDE.md soft compression |
| **am-11（本 phase）** `（本 commit）` | **commerce C8 invalid role validation preanalysis（docs-only）** | 規劃未來 C8 source 之 rule id / trigger / enum strategy / cascade / fixture constraint；**不**實作 source；**不**新增 fixture；**不** seed registry；**不**碰 production content |

本階段唯一目的為：

> 在 commerce content-reference C1 / C2 / C3 / C5 / C6 source 與相應 fixtures 全部 landed、C4 docs-only plan 已凍結（source 未實作）、commerce registry 仍為 empty `[]`、production posts 0 使用 `ref` / 0 使用 `role` 之現況下，**先**為 C8（`commerce-ref-invalid-role`）source phase 凍結 rule contract / enum strategy / cascade ordering / fixture constraint，並明確判定**不在本階段 implement C8 source**。本階段**不**改任何可執行檔；**不**新增任何 fixture；**不**改 `content/settings/commerce-links.json`；**不**改 CLAUDE.md / MEMORY。

---

## 1. Executive Summary

### 1.1 本輪性質宣告

> **本輪為 docs-only preanalysis。** 不實作 C8 source；不新增 fixture；不 seed registry；不改 src / content / settings / templates / views / fixtures / package / CLAUDE.md / MEMORY。唯一輸出為本檔。

### 1.2 一句話結論

> **建議 docs-only 凍結 C8 rule contract（命名 `commerce-ref-invalid-role`、warning-only、針對 post-level `affiliate.links[i].role`、enum 沿用 am-7 §4.5 凍結之 provisional 候選 `primary / alternate / official / price-check / library / direct`、與 C1..C6 全 orthogonal、缺漏 role 不警告、非字串 role 不 hard error 而走 warning + typeof message）；本階段不 implement C8 source；下一階段應為 read-only acceptance cross-check 或 Final Idle Freeze。**

### 1.3 推薦理由摘要

- **enum 候選已凍結（am-7 §4.5）**：C8 不需要在本 phase 發明新 enum；既有 6 值 provisional 候選已存在，本 phase 沿用並標明仍為 provisional（需 user 最終確認方可落 source）。
- **C8 為純 post-level rule，無 registry coupling**：與 C4 最大差異 —— `role` 是 post-instance 顯示 hint（`affiliate.links[i].role`），**不**是 registry 欄位。registry schema（`linkId` / `internalLabel` / `targetUrl` / `networkKey` / `active` / `replacementTarget` / `displayLabel`）無 `role`。因此 C8 fixture **可純 post-level**、registry 維持 empty `[]` 即可驗證 → **無 dead-code / no-fixture 風險**（與 C4 不同）。
- **既有 precedent 可直接 mirror**：`book-authors-invalid-role`（`validate-content.js:51` `VALID_BOOK_AUTHOR_ROLE` + `:1373` 檢查）已是同型 enum role validator —— `role === undefined` 不觸發、role 存在但不在 enum → warning、非字串 role 走 warning + typeof message（**非** hard error）。C8 可直接沿用此 idiom。
- **不違反紅線**：本 phase 為 docs-only；不放真實 affiliate URL / token / merchant tracking id / OAuth secret；不 mutate production registry；reverse UTM 與 pm-26 維持 dormant / BLOCKED。

### 1.4 本 phase 範圍

- 凍結 C8 rule id 候選與最終建議命名。
- 凍結 C8 trigger / severity / message shape / empty registry 觸發判定。
- 分析 `role`（與類似角色欄位）之 field scope：post-side vs registry-side。
- 凍結 enum strategy：沿用 am-7 §4.5 provisional 候選；討論 kebab-case 與 unknown-role warning-only。
- 凍結 C8 在 C1 / C2 / C3 / C4 / C5 / C6 中之 cascade / 互斥 / orthogonal 語意。
- 評估 C8 fixture 約束（post-level；registry empty 可測）與 fixture 命名 / 內容紅線。
- 標記 Admin / renderer 不在本 phase。
- 給「未來 source phase 之最小 in-scope」候選 + insertion point。
- 預設 baseline 不變動（0 errors / 68 warnings / 58 posts）。
- 給下一階段建議；不執行下一階段。

### 1.5 本 phase 不做的事

- ❌ 不 implement C8 source（`validateCommerceRefs` 不改）。
- ❌ 不新增任何 fixture（不論 post-level 或 settings-level）。
- ❌ 不 seed `content/settings/commerce-links.json`（registry 維持 empty）。
- ❌ 不 migrate / mutate production posts；不新增 commerce frontmatter / role。
- ❌ 不啟用 renderer fallback；不啟用 Admin picker / selector / display。
- ❌ 不啟用 build / deploy / Blogger repost / GA4 commerce dimension。
- ❌ 不 unblock pm-26；不啟用 reverse UTM；不啟用 admin-write-cli / Admin Apply / middleware write。
- ❌ 不改 CLAUDE.md / MEMORY / auto-memory。
- ❌ 不發明新 enum（沿用 am-7 §4.5）。

---

## 2. Current Baseline

### 2.1 git / validate baseline（本 phase 開始時）

```
branch: main
HEAD: 92e0c69aef924a01de607e4c8eb82d81cf2e871f
origin/main: 92e0c69
ahead/behind: 0/0
working tree: clean
latest subject: docs(claude): soft compress project memory guide
validate: 0 errors / 68 warnings / 58 posts
```

### 2.2 commerce content-reference 已 landed 範圍

- ✅ `validateCommerceRefs(affiliate, sourcePath, issues, commerceLinkIdSet)`（`validate-content.js:581`）與 `buildCommerceLinkIdSet(commerceLinks)`（`:383`）helper 已存在。
- ✅ C1 `commerce-ref-invalid-type`、C2 `commerce-ref-empty`、C3 `commerce-ref-not-found`、C5 `commerce-ref-duplicate-in-post`、C6 `commerce-ref-direct-url-coexist` 為 warning-only 已 landed。
- 🔄 C4 `commerce-ref-inactive` = docs-only plan landed（`8c9fddf`）；source 未實作。
- ❌ C7 `commerce-ref-missing-role` / **C8 `commerce-ref-invalid-role`** / C9 `commerce-ref-display-override-risk` 未 implement。
- ❌ C4 / C7 / C8 / C9 fixture 未建立。

### 2.3 commerce registry 與 production 文章現況

- `content/settings/commerce-links.json` = `{ schemaVersion: 1, updatedAt: "", commerceLinks: [], notes: "" }`（empty registry；R1-clean 七條件全滿足）。
- production posts 使用 `affiliate.links[].ref` = **0 篇**。
- production posts 使用 `affiliate.links[].role` = **0 篇**（既有 production `affiliate.links` 皆為 `[]`）。
- 任何 fixture 含真實 affiliate URL / merchant tracking id / OAuth secret = **無**。

### 2.4 enum 候選凍結現況

- am-7（`docs/20260604-commerce-links-content-reference-validation-preanalysis.md`）§4.5 已凍結 role enum **provisional 候選**：

  ```
  primary       主要購買連結（如官方 / 主推通路）
  alternate     次要 / 替代通路
  official      官方商店
  price-check   比價用途
  library       圖書館館藏（非購買）
  direct        直接連結（無聯盟）
  ```

- §5.8 標註：「enum 候選已於 §4.5 凍結；需 user 確認 enum 凍結後再 land」→ 仍為 **provisional**，非 final。

---

## 3. Rule Intent / Definition

### 3.1 C8 候選 rule contract

| 屬性 | 值（建議凍結） |
| --- | --- |
| candidate rule id | `commerce-ref-invalid-role`（沿用 am-7 §5.1 / §5.8 凍結命名）|
| severity | `warning`（warning-only；**不**得 error）|
| 觸發對象 | post-level `affiliate.links[i].role`（per-instance 顯示角色欄位）|
| sourcePath | post `.md` 路徑（mirror C1..C6）|
| trigger（建議）| `role` 存在（`!== undefined`）且不屬於凍結 enum；含「非字串 role」與「字串但不在 enum 之值」兩類 |
| **缺漏 role 是否警告** | ❌ **no**（`role === undefined` 不觸發；缺漏 role 屬 C7 `commerce-ref-missing-role` 之 long-tail scope，本 phase **不**啟用、**不**建議啟用）|
| **非字串 role 是否 hard error** | ❌ **no**（mirror `book-authors-invalid-role`：非字串 role 走 warning + typeof message，**不** throw / **不** error）|
| message shape（字串 role）| `affiliate.links[<i>].role="<role>"`（不在 enum）|
| message shape（非字串 role）| `affiliate.links[<i>].role typeof=<type>`（mirror book 之 typeof 分支）|
| empty registry 觸發 | role 為 post-side 欄位，**不**依賴 registry；empty registry 不影響 C8 |
| 0 role 使用觸發 | ❌ no（production 0 篇用 role → 0 觸發）|
| renderer / build 行為 | **不**改變；C8 為 validator-only warning |
| 自動修正行為 | **不**自動移除 / 改寫 role；**不** codemod；**不**改 render output |
| production content 影響 | **不**自動修改任一 production post；warning-only |

### 3.2 rule purpose（一句話）

> 檢查 post-level `affiliate.links[i].role` 之值是否屬於允許之顯示角色 enum；目的是在站長手填 role 時，於 `npm run validate:content` 階段提早抓出 typo / 非預期角色字串（如 `Primary` 大小寫錯 / `buy` 非 enum），避免未來 renderer 依 role 做顯示分支時遇到無法對應之值。**不**負責 ref 解析、ref not-found / inactive / duplicate 等問題（屬 C3 / C4 / C5）。

### 3.3 不在 C8 範圍

- ❌ C8 **不**檢查 `role` 缺漏（屬 C7；本 phase 不啟用）。
- ❌ C8 **不**檢查 ref 是否存在 / 命中 registry / inactive（屬 C3 / C4）。
- ❌ C8 **不**檢查 `labelOverride` 是否洩漏 internalLabel（屬 C9）。
- ❌ C8 **不**檢查 `order` / `position` / placement 欄位（placement 由既有 `affiliate.position` 管理；C8 只看 `role`）。
- ❌ C8 **不**觸發 build error；**不**阻擋 `dist/` / `dist-blogger/` 輸出。
- ❌ C8 **不**自行擴張 enum；enum 由 am-7 §4.5 + 未來 user 確認凍結。

---

## 4. Field Scope Analysis

### 4.1 frontmatter 是否已有 `affiliate.links[].role`

- am-7 §4.1 / §4.5 已**設計** `affiliate.links[].role`（optional per-instance 顯示角色）；但：
  - production posts `affiliate.links` 皆為 `[]` → **0 篇實際使用 role**。
  - `validate-content.js` `validateCommerceRefs` **目前不檢查 role**（grep：`validate-content.js` 內 `commerce-ref-` 僅 invalid-type / empty / not-found / direct-url-coexist / duplicate-in-post，**無** role 相關 type）。
- 結論：`role` 為 **已設計、未驗證、未使用** 之 post-side 欄位。

### 4.2 registry `commerceLinks` 是否有 role / kind / type / placement 類欄位

- registry schema（night-18 凍結）欄位：`linkId` / `internalLabel` / `targetUrl` / `networkKey` / `active` / `replacementTarget` / `displayLabel`。
- **無** `role` / `kind` / `type` / `placement` 欄位。
- registry 目前為 empty `[]`（無任何 entry）。
- 結論：`role` **不是** registry 維度；C8 之檢查對象**純為 post-side**。

### 4.3 field scope 結論（關鍵）

> **`role` 為 post-instance 顯示 hint，存在於 `affiliate.links[i].role`；registry 端無對應欄位。** 因此 C8 之驗證**不需 registry 內有任何 entry**，registry 維持 empty `[]` 即可用 post-level fixture 完整驗證。此為 C8 與 C4（需 registry `active:false` entry coupling）之根本差異 —— **C8 無 registry coupling、無 dead-code / no-fixture 風險**。

### 4.4 「類似角色欄位」之邊界

- 本 phase **只**將 `role` 視為 C8 對象。
- `order`（顯示排序 hint，number）/ `network`（raw 通路名）/ `labelOverride`（顯示文字覆寫）**不**納入 C8。
- placement（top / bottom）由 `affiliate.position` 管理，**不**在 per-link `role` 重複定義（per am-7 §4.5）→ C8 不檢查 placement。

---

## 5. Enum Strategy

### 5.1 既有 frozen enum candidate（沿用，不自行發明）

- **已有 candidate**：am-7 §4.5 凍結之 6 值 provisional 候選：

  ```
  primary  alternate  official  price-check  library  direct
  ```

- 本 phase **沿用**此候選；**不**自行新增 / 刪除 / 改寫 enum 值。
- 仍標明為 **provisional**：per am-7 §5.8「需 user 確認 enum 凍結後再 land」→ C8 source 落地前須 user 對此 6 值做最終確認（confirm / 增減）。

### 5.2 既有同型 precedent（VALID_BOOK_AUTHOR_ROLE）

- `validate-content.js:51`：`const VALID_BOOK_AUTHOR_ROLE = new Set(['author', 'translator', 'illustrator', 'editor', 'other']);`
- `validate-content.js:1373`：`if (entry.role !== undefined && !VALID_BOOK_AUTHOR_ROLE.has(entry.role)) { ... }`
  - `role === undefined` → 不觸發（缺省不警告）。
  - role 存在但不在 set（含非字串，`.has()` 回 false）→ warning。
  - message：字串 role → `authors[i].role="<role>"`；非字串 role → `authors[i].role typeof=<type>`。
- C8 建議**直接 mirror 此 idiom**：定義 `VALID_COMMERCE_LINK_ROLE = new Set([...])`，per-entry 檢查 `entry.role !== undefined && !VALID_COMMERCE_LINK_ROLE.has(entry.role)`。

### 5.3 小寫 kebab-case 討論

- am-7 §4.5 候選已採全小寫；其中 `price-check` 為 kebab-case，其餘為單字小寫。
- 建議**統一以小寫 kebab-case 為慣例**（與既有 `price-check` 一致；與專案 slug / class prefix `lab-` 之 kebab 風格一致）。
- 不引入 camelCase（如 `priceCheck`）或 PascalCase（如 `Primary`）；C8 之 enum 比對為 **case-sensitive exact match**（mirror book role），因此 `Primary` / `PRICE-CHECK` 等大小寫變體會被視為 invalid → warning（此即 C8 抓 typo 之用途）。

### 5.4 unknown role 是否 warning-only

- ✅ **warning-only**：unknown role（不在 enum 之字串、或非字串）一律 warning，**不** error、**不**阻擋 build、**不**自動改寫。
- 理由：role 為顯示 hint；未知 role 不影響資料正確性 / ref 解析；過嚴會阻擋作者實驗性標記。mirror book role + 全 commerce content-ref rules 之 warning-only 一致政策。

### 5.5 enum 演進治理

- 未來若需新增 role 值（如 `bundle` / `subscription`），須：
  1. 先於 docs 提案並 user 確認；
  2. 同步更新 am-7 §4.5（或後繼 enum 凍結 doc）+ C8 source `VALID_COMMERCE_LINK_ROLE`；
  3. **不**由 C8 source 自行推斷 / 放寬。
- enum 為 **explicit allowlist**，非 pattern-based 推斷（與 CLAUDE.md commerce 治理紅線「所有 key 由作者明示填寫」精神一致）。

---

## 6. Rule Cascade / Mutual Exclusivity

### 6.1 C8 與既有 / 規劃 rules 之關係

| rule | 檢查對象 | 與 C8 關係 |
| --- | --- | --- |
| C1 `commerce-ref-invalid-type` | `ref` 型別 | **orthogonal**（C8 看 role，不看 ref 型別）|
| C2 `commerce-ref-empty` | `ref` trim 空 | **orthogonal** |
| C3 `commerce-ref-not-found` | `ref` 不在 registry | **orthogonal**（C8 不依賴 ref 解析）|
| C4 `commerce-ref-inactive`（plan） | ref 命中但 entry inactive | **orthogonal** |
| C5 `commerce-ref-duplicate-in-post` | 同 post ref 重複 | **orthogonal** |
| C6 `commerce-ref-direct-url-coexist` | ref + raw url 並存 | **orthogonal** |
| C7 `commerce-ref-missing-role`（未啟用） | role 缺漏 | **互斥**（C7 = 缺漏；C8 = 存在但無效；同一 entry 不可能同時缺漏又無效）|

### 6.2 C8 不遮蔽 ref-side rules

> C8 **只**針對 `role` 欄位本身；**不**改變 C3 / C4 / C5 / C6 之 ref validation 結果。同一 entry 可同時：ref not-found（C3）+ role invalid（C8）；兩者各報各的 warning，互不 suppress。

### 6.3 C8 是否受 ref cascade 之 `continue` 影響（重要設計決策）

- 現有 `validateCommerceRefs` per-entry loop（`:586`–`:647`）有兩處 early skip：
  - `:590` `if (ref === undefined) continue;` —— **raw-only entry（無 ref）整個被跳過**。
  - `:602` C1（非字串 ref）`continue`；`:615` C2（空 ref）`continue`。
- `role` 可出現在三種 entry 形態（per am-7 §4.1）：ref-only、ref+raw、**raw-only**。若 C8 寫在現有 loop 之 `ref === undefined continue` 之後，**raw-only entry 的 role 不會被檢查**。
- **建議（凍結為 contract 決策候選）**：C8 採**獨立 pass**（mirror C5 duplicate 之獨立 loop 寫法，於 ref cascade loop **之後**單獨掃 `affiliate.links[]` 的 `role`），如此：
  - C8 對 ref-only / ref+raw / raw-only 三形態之 role 一律檢查；
  - C8 **完全不碰** ref cascade（不改 C1..C6 之 `continue` 流程）→ 符合「C8 應只針對 role 欄位本身，不改 ref validation 結果」。
- 替代方案（mirror book role：寫在 entry loop 內但移到 `ref === undefined continue` **之前**）亦可，但會與 ref cascade 共用 loop body、較易誤動 ref 邏輯；**較不推薦**。本 phase **不**最終裁決，標記為 source phase 之 contract 決策點，**推薦獨立 pass**。

### 6.4 cascade ordering（含 C8）

```
（ref cascade，per-entry loop）
C1 (invalid type) → skip 該 entry 其餘 ref 檢查
C2 (empty trim)   → skip 該 entry 其餘 ref 檢查
C3 / C4 (not-found / inactive) — 互斥
C6 (ref+url coexist) — orthogonal
（loop 後獨立 pass）
C5 (duplicate-in-post) — 獨立掃 ref
C8 (invalid role) — 獨立掃 role（建議；與 ref cascade 完全解耦）
```

---

## 7. Empty Registry / Fixture Constraint

### 7.1 C8 不依賴 registry → 無 dead-code 風險

- C8 檢查 post-side `role`；registry 維持 empty `[]` **完全不影響** C8 觸發能力。
- 與 C4 對照：C4 需 registry 有 `active:false` entry 才能驗證（registry empty → C4 dead source）；**C8 無此問題**。

### 7.2 C8 可用 post fixture 測（registry 維持 empty）

- 未來 C8 fixture 只需一個 post-level `.md`，其 `affiliate.links` 含一個 `role: "<invalid>"` 之 entry → 自然觸發 C8 warning。
- registry **不需 seed**；`commerce-links.json` 維持 empty `[]`。
- 此與 C1 / C2 / C3 / C5 fixture 之 registry-empty cadence 一致（C3 用「故意不存在 ref」、C8 用「故意非 enum role」）。

### 7.3 明確建議：不要為 C8 seed production registry

> ❌ **不建議**為 C8 動 production `commerce-links.json`。C8 既不需 registry entry，任何 registry seed 對 C8 都是多餘且會引入 registry-level warning drift（R6 / R8 / R14 等）。C8 fixture 應**純 post-level**，registry 永遠維持 empty `[]`。

---

## 8. Fixture Strategy

⚠️ **本 phase 不建立任何 fixture。** 以下為未來 fixture phase 之規劃約束。

### 8.1 fixture 形態

- C8 fixture **必須 post-level**：`content/validation-fixtures/{blogger,github}/posts/_test-commerce-ref-invalid-role.md`（mirror 既有 `_test-commerce-ref-*.md` cadence）。
- registry 維持 empty `[]`；**不** seed。

### 8.2 fixture frontmatter 候選 shape（未來；本 phase 不建）

```yaml
affiliate:
  enabled: true
  links:
    - ref: "fixture-commerce-ref-role"   # fixture-namespaced；registry empty → 同時觸發 C3 not-found（orthogonal）
      role: "bogus-role"                  # 故意非 enum 值 → 觸發 C8
```

- 註：上例 ref 不在 empty registry → 會**同時**觸發 C3 not-found（orthogonal，預期）；若要**單獨**只觸發 C8，可改用 raw-only entry：

  ```yaml
  affiliate:
    enabled: true
    links:
      - label: "fixture raw link"
        role: "bogus-role"   # 純 role 無效；無 ref → 不觸發 C3（前提：C8 採 §6.3 獨立 pass，覆蓋 raw-only entry）
  ```

- 哪一種為最終 fixture，待 C8 source 之 §6.3 決策（獨立 pass vs entry-loop）確定後於 fixture phase 裁決。

### 8.3 fixture 內容紅線

- ❌ **不**含真實商業連結 / affiliate URL / tracking id / token / credential / merchant key。
- ✅ 可用 `example.invalid`（RFC 2606 reserved）或 fixture-namespaced ref（如 `fixture-commerce-ref-role`）。
- ✅ role 值用明顯 fixture 字串（如 `bogus-role` / `__invalid-role__`），與真實 enum 區隔。
- **本 phase 不建立此 fixture**；僅凍結上述約束。

### 8.4 預期 baseline 影響（未來 fixture phase；參考）

- C8 source-only land（無 fixture）：baseline **不變**（production 0 篇用 role）。
- C8 fixture land（+1 post fixture）：baseline +1 post +1 C8 warning（若用 raw-only entry 單獨觸發），或 +1 post +1 C8 +1 C3（若用 ref 形態，orthogonal cascade）。
- 實際數字待 fixture phase 裁決；本 phase **不** commit 任何數字。

---

## 9. Admin / Renderer Impact

### 9.1 本 phase 不啟動 Admin

- ❌ **無** Admin picker / selector / display 消費 `role`。
- 未來 Admin picker 若讓站長從 enum 下拉選 role 插入 `affiliate.links[].role`，屬獨立 Admin phase；**本 phase 不規劃、不啟動**。
- C8 之 enum 為未來 Admin role 下拉之 source of truth，但 Admin 本身不在本 phase 範圍。

### 9.2 本 phase 不啟動 renderer

- ❌ **無** renderer 依 role 做顯示分支（如 primary 醒目 / library 次要）。
- renderer fallback contract 由 night-9 doc 凍結但 source 未 land；C8 為 validator-only warning，**不**改 renderer。
- C8 將來若落地，Admin selector / renderer display 仍應**另開 phase**。

### 9.3 範圍界定

> 本 doc **只**定義 C8 之 validation 方向（role enum warning-only）。**不**定義 Admin role picker / renderer role-based 顯示 / CTA component / GA4 commerce dimension / build / deploy。上列屬各自獨立後續 phase。

---

## 10. Recommended Future Implementation Shape

⚠️ **本 phase 不改 source。** 以下為**未來** C8 source phase 之建議形狀（供未來 phase 參考，非本輪執行）。

### 10.1 建議：只做 warning-only validator

- C8 source 應**只**新增一條 warning-only rule；不 error、不阻擋 build、不自動修正。
- 不引入 unit-test framework / CI runner（CLAUDE.md §1 / §29）。

### 10.2 建議 insertion point（function location）

- 檔案：`src/scripts/validate-content.js`。
- enum 常數：於檔案頂部常數區（mirror `:51` `VALID_BOOK_AUTHOR_ROLE`）新增：

  ```js
  // 候選；待 user 確認 am-7 §4.5 enum 凍結後落地
  const VALID_COMMERCE_LINK_ROLE = new Set(['primary', 'alternate', 'official', 'price-check', 'library', 'direct']);
  ```

- 檢查邏輯：於 `validateCommerceRefs`（`:581`）內、C5 duplicate 獨立 pass（`:649`–`:673`）**之後**，新增一段**獨立 role pass**（per §6.3 推薦），mirror book role idiom：

  ```js
  // C8（候選；本 phase 未實作）：role enum 檢查（warning-only；獨立 pass；不碰 ref cascade）
  for (let i = 0; i < links.length; i++) {
    const entry = links[i];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    if (entry.role !== undefined && !VALID_COMMERCE_LINK_ROLE.has(entry.role)) {
      issues.push({
        severity: 'warning',
        type: 'commerce-ref-invalid-role',
        sourcePath,
        value: typeof entry.role === 'string'
          ? `affiliate.links[${i}].role="${entry.role}"`
          : `affiliate.links[${i}].role typeof=${typeof entry.role}`,
      });
    }
  }
  ```

- call site：無需改（`validateCommerceRefs` 已於 `:1424` 被呼叫）；無需改 signature（role 不依賴 `commerceLinkIdSet`）；無需改 loader。
- ⚠️ 以上為**候選 shape**；本 phase **不**寫入 source。

### 10.3 建議推進順序

> **docs acceptance（本 doc 認可）→ source preflight（確認 enum 最終凍結 + §6.3 決策）→ source implementation（warning-only C8）→ fixture phase（post-level fixture）。**
> **不**建議跳過 enum user 確認直接 land source；**不**建議 source + fixture 同 phase 混做（fixture 須對齊最終 trigger / message shape）。

---

## 11. Risks / Non-goals

本 phase **明確 NOT do**：

- ❌ **no source**：`src/scripts/validate-content.js` 與所有 src/** 不動。
- ❌ **no fixture**：`content/validation-fixtures/**` 不新增 / 不修改。
- ❌ **no registry seed**：`content/settings/commerce-links.json` 維持 `commerceLinks: []`。
- ❌ **no production migration**：production posts 不新增 / 不修改 commerce frontmatter；不新增 role。
- ❌ **no new enum invention**：沿用 am-7 §4.5；不自行增刪 enum 值。
- ❌ **no renderer / Admin**：role-based 顯示 / role picker 全 dormant。
- ❌ **no build / deploy / Blogger repost / GA4**。
- ❌ **no reverse UTM activation**；**no pm-26 unblock**。
- ❌ **no Admin Apply / middleware / admin-write-cli real write**。
- ❌ **no `npm install`**；package / lockfile 不動。
- ❌ **no CLAUDE.md / MEMORY mutation**。
- ❌ **no real affiliate URL / merchant token / OAuth secret / tracking id** 進入本 doc 或 fixture。
- ❌ **不啟動 C4 / C7 / C9 source**；不與 C8 並行。

### 11.1 殘留風險

- enum 仍為 provisional：若 user 最終調整 §4.5 6 值，C8 source `VALID_COMMERCE_LINK_ROLE` 須同步；本 doc 已標明 enum 落地前須 user 確認。
- §6.3 entry-loop vs 獨立 pass 決策未最終裁決：本 doc 推薦獨立 pass（覆蓋 raw-only entry 之 role），待 source preflight 確認。

---

## 12. Final Recommendation

### 12.1 本階段 single conclusion

> **本 phase 為 docs-only C8 contract freeze；C8 source 不在本階段 implement；下一階段應為 read-only acceptance cross-check 或 Final Idle Freeze。**

### 12.2 是否建議下一步直接做 C8 source？

- ⚠️ **可做，但須先 enum 確認 + §6.3 決策**：C8 與 C4 不同 —— **無 registry coupling、無 dead-code 風險、可純 post-level fixture 驗證**，因此 C8 source 之 blocker 顯著低於 C4。
- 但 per CLAUDE.md §27 / 本專案保守落地慣例，仍**不建議**在本輪直接跨入 source；建議：
  - **首選**：read-only acceptance cross-check（核對本 doc §3 / §5 / §6 / §10 與既有 `validateCommerceRefs` / `VALID_BOOK_AUTHOR_ROLE` precedent 一致）或 **Final Idle Freeze**。
  - **次選（需 explicit approval）**：C8 source-only preflight + warning-only landing（前提：user 確認 §4.5 enum 最終凍結 + §6.3 採獨立 pass）。
- **明確不建議**：在 enum 未最終確認、§6.3 未裁決前直接 land C8 source；不建議 source + fixture 同 phase 混做。

### 12.3 本階段結束後預設狀態

- HEAD 前進 1 commit（`docs(commerce): plan C8 invalid role validation`）。
- working tree clean；ahead/behind = 0/0（push 後）。
- `npm run validate:content` 維持 **0 errors / 68 warnings / 58 posts**。
- commerce content-reference source / fixtures landed 範圍不變（C1 / C2 / C3 / C5 / C6）。
- commerce registry 維持 empty `[]`。
- C4（plan）/ C7 / C8 / C9 source 與 fixture 仍未 implement。
- renderer / Admin / build / deploy / Blogger repost / GA4 / reverse UTM / pm-26 全部 dormant / BLOCKED。

### 12.4 不自動推進下一階段

- ❌ 本 phase 結束後**不**自動啟動 acceptance / Final Idle Freeze / C8 source / fixture / registry seed。
- 必須等待 user 明確授權。

---

## Appendix A — Cross-reference index

| 主題 | 文件 / commit |
| --- | --- |
| commerce content-reference validation preanalysis（C1..C9 contract + §4.5 role enum）| `docs/20260604-commerce-links-content-reference-validation-preanalysis.md` |
| commerce content-reference source landing（C1 / C2 / C3 / C5）| commit `39b89e3` |
| commerce C6 source landing | commit `281cd43` |
| commerce content-ref fixtures landing | commits `149efdc` / `3aeabbc` |
| commerce C4 inactive ref validation preanalysis | `docs/20260608-commerce-c4-inactive-ref-validation-preanalysis.md`（commit `8c9fddf`）|
| book authors role enum precedent | `src/scripts/validate-content.js:51`（`VALID_BOOK_AUTHOR_ROLE`）/ `:1373`（檢查）|
| commerce content-ref validator current source | `src/scripts/validate-content.js:581`（`validateCommerceRefs`）/ `:383`（`buildCommerceLinkIdSet`）|
| commerce registry schema decision | `docs/20260603-commerce-affiliate-link-registry-schema-decision.md` |
| commerce empty registry decision | `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md` |
| CLAUDE.md commerce 區塊 | `CLAUDE.md` §3 commerce-links 段落 + §12 affiliate.links schema |

---

## Appendix B — Baseline snapshot

```
date: 2026-06-08 10:30 +0800
branch: main
HEAD: 92e0c69aef924a01de607e4c8eb82d81cf2e871f
origin/main: 92e0c69
ahead/behind: 0/0
working tree: clean
latest subject: docs(claude): soft compress project memory guide
validate: 0 errors / 68 warnings / 58 posts

commerce content-reference rules landed: C1 / C2 / C3 / C5 / C6
commerce content-reference rules: C4 docs-only plan landed (source not implemented); C7 / C8 / C9 deferred
commerce content-reference fixtures landed: 5 (C1 / C2 / C3 / C5 / C6)
commerce registry: empty []
commerce production ref usage: 0
commerce production role usage: 0
role enum candidate: provisional (am-7 §4.5; needs user final confirmation)
commerce renderer / Admin / build / deploy / Blogger repost / GA4: dormant
reverse UTM activation: dormant (pm-24 source landed; un-deployed)
pm-26: BLOCKED
```

---

## Appendix C — C8 rule contract quick card

```
candidate rule id: commerce-ref-invalid-role
severity:          warning
target:            post-level affiliate.links[i].role（post-instance；非 registry 欄位）
sourcePath:        post .md path
trigger:           entry.role !== undefined && role 不在 VALID_COMMERCE_LINK_ROLE
                   （含非字串 role；走 typeof message，非 hard error）
enum (provisional):primary / alternate / official / price-check / library / direct（am-7 §4.5）
missing role:      不觸發（屬 C7；本 phase 不啟用）
message (string):  affiliate.links[<i>].role="<role>"
message (other):   affiliate.links[<i>].role typeof=<type>
cascade:           與 C1..C6 全 orthogonal；與 C7（missing）互斥；不改 ref validation 結果
registry coupling: 無（role 為 post-side；registry 維持 empty 即可測）
empty registry:    不影響 C8
0 role usage:      0 觸發
fixture:           post-level（registry 不 seed）；可 raw-only entry 單獨觸發 C8
precedent:         mirror book-authors-invalid-role（validate-content.js:51 / :1373）
insertion point:   validateCommerceRefs 內、C5 pass 之後、獨立 role pass（建議）
status:            contract frozen (docs-only)；source not implemented
blocker:           enum user final-confirm + §6.3 entry-loop-vs-independent-pass 決策
```

---

（本文件結束）
</content>
</invoke>
