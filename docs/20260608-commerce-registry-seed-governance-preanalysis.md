# Commerce Registry Seed Governance — Preanalysis (docs-only)

Phase: `20260608-pm-29-commerce-registry-seed-governance-preanalysis-docs-only-a`
Date: 2026-06-08
Baseline: HEAD `3c271aa` — `feat(admin): add commerce selector preview`
Status: **docs-only governance preanalysis. NO seed. NO source change. NO Admin change. NO write path.**

> ⚠️ 本文僅含 placeholder / `example.invalid` / `sample-*` 值。**不含**任何真實 affiliate URL、tracking id、sid、aff_id、merchant id、token、credential、Google Form ID、respondent data、私人下載連結、commission-sensitive data。

---

## 1. Executive Summary

本輪是一份 **docs-only governance preanalysis**，目的是在「Admin commerce read-only preview 已 landed/accepted」之後，先把「未來如何把真實 commerceLinks 寫進 production registry（seed）」的治理規則與安全邊界寫清楚，**再**進入任何 seed 動作。

本輪明確 **不做**：

- ❌ 不 seed registry（`content/settings/commerce-links.json` 維持 empty `[]`）
- ❌ 不改任何 source（validator / loader / helper / build / Admin EJS 全不動）
- ❌ 不改 Admin（preview 維持 read-only / empty-state）
- ❌ 不啟動任何 write path（Admin Apply / middleware / admin-write-cli 維持 dormant）
- ❌ 不啟動 C7（missing-role）、不啟動 renderer activation、不啟動 deploy / Blogger repost / GA4 / reverse UTM
- ❌ 不 promote `_sample.commerce-links.json`、不新增 overlay / fixture、不做 production migration

本文唯一的交付物是本檔自身：`docs/20260608-commerce-registry-seed-governance-preanalysis.md`。

**核心結論（詳見 §17）**：本輪不 seed；先 acceptance。下一步**不應**直接改 registry，除非 user 明確提供候選 entries 並批准獨立的 seed phase。C7 / Admin write / renderer / deploy 全部維持 dormant。

---

## 2. Baseline

| 項目 | 值 |
|---|---|
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD = origin/main | `3c271aa` |
| latest subject | `feat(admin): add commerce selector preview` |
| working tree | clean |
| `npm run validate:content` | **0 errors / 69 warnings / 59 posts** |
| overlay direct-node validate | **0 errors / 70 warnings / 59 posts** |
| production `commerceLinks` | empty `[]` |
| Admin commerce preview | landed/accepted（read-only；empty-state） |
| Admin preview data source | production `settings.commerceLinks` only |
| memory | 已於 pm-28 sync |

Overlay validate 標準指令：

```bash
node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json
```

---

## 3. Field Inventory（依實際 source 觀察）

下列欄位依 **實際觀察**（不臆測）整理自：

- `src/scripts/load-settings.js`（loader：unwrap `commerceLinks` 為 array）
- `src/scripts/validate-content.js`（registry-level R3–R14 + content-ref C1–C9）
- `content/settings/_sample.commerce-links.json`（sample blueprint 欄位形狀）
- `src/scripts/active-commerce-links.js`（Admin preview helper 之 safe-row 選欄）

### 3.1 Registry entry 欄位（`commerceLinks[]` 內每筆）

| 欄位 | 型別 | 必要性 | 安全分級 | source 依據 | 說明 |
|---|---|---|---|---|---|
| `linkId` | string | **required** | display-safe（machine key） | R4 missing / R5 duplicate / C3 ref target / helper key | 穩定機器鍵；ref 由此比對；缺漏則 entry 不可被引用 |
| `active` | boolean | optional（default true 語意） | display-safe | R14 / helper `active` / C4 | `false` = 退役；需配 `replacementTarget` |
| `displayLabel` | string | likely required（display 用） | **display-safe** | helper 唯一輸出 label；缺則 fallback=`linkId` | 可顯示給作者 / Admin preview 的 public label |
| `internalLabel` | string | optional | **sensitive / should-not-display** | R8/R9 shape；C9 leak-equality | 內部識別字串；Admin preview **永不**輸出；C9 偵測其外洩 |
| `networkKey` | string | optional | sensitive-leaning（merchant-ish） | R11 against `affiliate-networks.json` | 聯盟網路 key；Admin preview 不輸出 |
| `targetUrl` | string | optional（renderer 才消耗） | **should-not-display（in Admin）** | R6 missing / R7 format | public outbound URL（非 secret，見 §7），但 Admin preview 不顯示完整值 |
| `replacementTarget` | string | optional | display-safe（presence only） | R12/R13/R14 | 指向另一 `linkId`；Admin preview 只輸出 `hasReplacementTarget` boolean |
| `notes` | string | optional | **should-not-display / 易誤放敏感** | sample only；validator 不檢查 | 自由欄位；治理上視為「可能含私人備註」→ 紅線（見 §6 / §13） |
| `schemaVersion` | number | registry-root（非 entry） | — | loader / sample | registry 檔頂層 |
| `updatedAt` | string | registry-root（非 entry） | — | loader / sample | registry 檔頂層 |

### 3.2 Post-level 欄位（**屬內容屬性，不在 registry**）

| 欄位 | 位置 | 安全分級 | source 依據 | 說明 |
|---|---|---|---|---|
| `ref` | `affiliate.links[].ref` | display-safe | C1/C2/C3/C5/C6 | 指向 registry `linkId`；machine key |
| `role` | `affiliate.links[].role` | display-safe | C8 enum | recommended-but-optional（見 §8） |
| `labelOverride` | `affiliate.links[].labelOverride` | **sensitive if = internalLabel** | C9 | 等於 registry `internalLabel` 時觸發 leak risk |
| `url` | `affiliate.links[].url` | public outbound | C6 coexist | raw url；與 `ref` 共存時 C6 warning |

### 3.3 Unknown（不臆測）

- `merchantKey`：R10 規格未凍、merchant registry 未存在 → **unknown**，本輪不定義 seed 欄位語意。
- 是否需要 future `displayName`（書名 / 產品名專用，與 `displayLabel` 區分）→ **future decision**（見 §6）。
- `notes` 是否應在 future 直接禁止入 registry，或改為 validator 掃描 → **future decision**。

---

## 4. Seed Governance Problem Statement

### 4.1 為什麼不能直接把 `_sample.commerce-links.json` promote 成 production

- `_sample.commerce-links.json` 的 `$comment` 已明示：「不得整檔複製為 production commerce-links.json」。
- sample 值全為 `sample-*` / `example.invalid` placeholder，promote 後會在 production registry 留下**無意義且誤導**的 entries，且 Admin preview 會把它們當真實 options 顯示。
- loader 白名單（`SETTINGS_FILES` 具名載入、無 readdir/glob）天然不載入 `_sample.*`；promote 會破壞「sample 永不被讀」這個安全前提。
- sample 是 schema 藍本，不是 seed 來源；auto-promote 等於把「治理討論用的假資料」誤升為「商業真實資料」。

### 4.2 為什麼不能直接把真實 affiliate URL 大量寫進 repo 而不先定治理規則

- 一旦 commit，git history **永久保留**（見 §13）；事後刪檔無法真正移除。
- 真實 affiliate URL 可能夾帶 tracking id / sid / aff_id / merchant id，需先明確 decision 哪些允許入 repo（§7）。
- 大量寫入前若無 linkId 命名規則（§5），會產生不穩定 / vendor-temporary 的 key，未來文章 `ref` 全部要跟著改。
- 無 role / replacement 政策前批量寫入，會讓「一篇文章多連結」情境難以辨識與維護（§8 / §9）。

### 4.3 為什麼 Admin preview / future renderer / validator / snippet 需要同一套 seed policy

- 四者**共用同一份** production `settings.commerceLinks` 作為 single source of truth：
  - validator：C3/C4/C9 以 registry entry 比對 post `ref` / `labelOverride`。
  - Admin preview：helper 讀 registry 整成 safe rows。
  - future renderer：消耗 `targetUrl` 產出實際連結。
  - future copyable snippet（A6，未啟動）：輸出作者可貼的 YAML。
- 若 seed 不遵守統一 policy（欄位安全分級、命名、紅線），任一 consumer 都可能洩漏 `internalLabel` / `targetUrl` / merchant 資料，或產生不一致行為。
- 因此 seed policy 必須**先於** seed，且對所有 consumer 一致。

---

## 5. Link ID Naming Policy（future `linkId` / `ref`）

目標：`linkId`（= post `ref` 比對目標）是**穩定的機器鍵**，不是顯示字串、不是行銷活動名稱、不是私人備註。

### 5.1 規則

1. **stable machine key**：一旦發布並被文章 `ref` 引用，`linkId` 不應再改（改了等於斷掉所有引用文章）。
2. **avoid vendor-specific temporary campaign names**：不可用「雙11」「summer-sale-2026」「618」等臨時活動字樣作 key（活動會過期，key 不該過期）。
3. **avoid sensitive personal note**：不可把私人備註 / 帳號 / 結算資訊 / commission 編入 key。
4. **支援一篇文章多個 affiliate links**：同一篇可有多個不同 `linkId` 的 ref（書名 + 不同通路 + 不同 role）。
5. **可識別但不過度暴露**：key 可表達「產品 / 通路 / role」語意以利人讀，但不得暴露私人資料。
6. **lowercase + hyphen**：建議 `[a-z0-9-]`，與既有 fixture / sample 命名一致（mirror `sample-*`）。

### 5.2 建議格式（**僅 placeholder，不可用真實書名 / 真實通路**）

```text
sample-book-title-shopee-primary
sample-book-title-books-official
sample-course-official-primary
```

語意拆解（示意）：`sample-<產品識別>-<通路>-<role>`。**以上全為 placeholder**；真實 seed 時的實際 `linkId` 由 user 提供並人工 review，不在本文出現。

### 5.3 不確定處（不臆測）

- 是否強制 `linkId` 內嵌 role（如 `-primary`）或 role 只放 post-level `affiliate.links[].role` → **future decision**（與 §8 role policy 連動；目前 role 為 recommended-but-optional，傾向不強制嵌入 key）。

---

## 6. Display Label / Internal Label Policy

### 6.1 規則

1. `displayLabel`：**可**顯示給作者 / Admin preview（helper 已如此實作；缺則 fallback=`linkId`）。
2. `internalLabel`：即使存在，**仍不可**自動顯示於 Admin UI（helper 已明確「絕不 fallback 至 internalLabel」）。
3. `labelOverride`（post-level）/ `internalLabel`（registry）與 **C9** 的關係：
   - C9 `commerce-ref-display-override-risk`：當 post `labelOverride` 之 trim 值 **等於** registry entry `internalLabel` 之 trim 值 → warning（疑似內部識別字串外洩）。
   - C9 message **絕不** echo `internalLabel` / `labelOverride` 值，只報欄位名 + ref machine key + 風險類型。
4. **不把** tracking info / commission / 私人備註放進任何 label 欄位（`displayLabel` / `internalLabel` / `labelOverride`）。

### 6.2 書名 / 產品名應放哪個欄位

- 若書名 / 產品名是**要顯示給讀者**的 → 放 `displayLabel`（display-safe）。
- 若只是**作者內部識別**用途（不顯示）→ 目前唯一 internal 欄位是 `internalLabel`，但它被 C9 視為「不可外洩」且 Admin 不顯示，語意上偏「內部代號」而非「人類可讀產品名」。
- 因此「作者識別用、人類可讀、但又不想當成 public label」這個需求**目前無乾淨欄位** → 是否需要 future `displayName`（或 `authorNote`-style 但受 validator 掃描保護）欄位 → **future decision**，本輪不定義、不實作。

---

## 7. Target URL / Affiliate URL Policy

### 7.1 規則

1. `targetUrl` 若未來使用，必須視為 **public outbound URL，不是 secret**（它最終會出現在已發布頁面的 `href`）。
2. 但「public outbound」**不等於**「可任意入 repo」：
   - ❌ 不可含 token / credential / private file URL / respondent data。
   - ⚠️ 若含 affiliate tracking id / sid / aff_id / merchant id → 是否允許入 repo 須**明確 decision**（見 §7.2）。
3. **建議先採「manual reviewed public URL only」**：每筆 `targetUrl` 入 registry 前須人工 review，確認是公開可分享的落地 URL，無夾帶私密參數。
4. **不在 Admin preview 顯示完整 `targetUrl`**（helper 已如此；只輸出 `hasReplacementTarget` 等 safe 欄位）。
5. **不在 docs 放真實 URL**；本文一律 `example.invalid`。

### 7.2 affiliate tracking id / sid / aff_id / merchant id decision（待 user 拍板）

- 這些參數通常**本身即 public**（出現在分享連結中），但它們可能：
  - 綁定**個人帳號結算**（等同半私密識別）。
  - 一旦入 git history 永久可追溯到帳號。
- **本文建議（conservative，待 user 確認）**：first seed 階段**先採不含 tracking 參數的 official / direct public URL**（見 §11）；含 tracking 參數的 affiliate deep link 留待 seed governance accepted 後的獨立 decision。
- 此為 **decision pending**，本輪不拍板、不寫入任何真實值。

---

## 8. Role Policy

### 8.1 現況

- `role` 為 **recommended-but-optional**。
- **C7（missing-role required）remains deferred / NO-GO**（per pm-19/pm-20）。
- C8 `commerce-ref-invalid-role` enum（已 landed，校驗 role 若存在則須在 enum 內）：

```text
primary
alternate
official
price-check
library
direct
```

（helper `ALLOWED_COMMERCE_ROLES` mirror 同一 enum，供 Admin UI guidance；非 C7 啟動。）

### 8.2 規則

1. 未來 seed **可建議** role，但 **不可讓 seed policy 等同啟動 C7**（seed 寫了 role ≠ role 變必填）。
2. role 留在 post-level `affiliate.links[].role`（C8 校驗），**不**強制嵌入 registry `linkId`（§5.3）。
3. 多連結同文章情境下，role 協助作者識別「哪個是主推 / 哪個是備援 / 哪個是官方 / 哪個是比價 / 哪個是圖書館借閱 / 哪個是直購」：
   - 例：一篇書評同時放 `primary`（主聯盟通路）+ `official`（出版社官網）+ `library`（圖書館查詢）+ `price-check`（比價）。
   - role 是 authoring guidance，不是 gatekeeper；C7 維持 NO-GO，啟用需 user product 決策（role-required + frozen scope + fixture + baseline impact + Admin/UI + warning id + acceptance plan）。

---

## 9. Inactive / Replacement Governance

### 9.1 欄位用途

- `active: false`：標記退役 entry；C4 `commerce-ref-inactive` 會對引用它的 post `ref` 發 warning。
- `replacementTarget`：指向另一個 `linkId`，作為退役後的替代 hint。
  - R12 not-found / R13 self / R14 inactive-missing-replacement 已校驗其形狀。
  - Admin preview **只**輸出 `hasReplacementTarget` boolean，**不**顯示其值、**不**導向真實 `targetUrl`。

### 9.2 規則

1. `replacementTarget` 只做 **safe hint**（指向另一 linkId），不在 Admin preview 顯示 targetUrl。
2. 更新 registry 以支援歷史文章：通路失效時，**先更新 registry**（設 `active:false` + 配 `replacementTarget`），由 validator（C4）+ Admin preview 輔助作者，**不自動批次改文**。
3. future validator C4 / C6 / C9 關係：
   - C4：post `ref` 命中但 registry entry inactive → warning。
   - C6：post 同時有 `ref` 與 `url` → coexistence warning。
   - C9：post `labelOverride` = registry `internalLabel` → leak risk warning。
   - 三者 orthogonal；皆 warning-only；皆不自動改文。
4. **不做自動替換**（不自動把 inactive ref 改寫成 replacementTarget；由作者手動決定）。

---

## 10. Registry Seed Source Options

| 選項 | 說明 | 優點 | 缺點 / 風險 | 評估 |
|---|---|---|---|---|
| **A. 手動編輯 production `commerce-links.json`** | user/author 直接在 registry JSON 手填 entries | 直接；與 CLAUDE.md §3 紅線一致（作者明示填寫）；可逐筆 review；無 sample 污染 | 需人工守紅線；需先有 §5 命名 + §7 URL policy | ✅ **推薦 first safe option** |
| B. 從 `_sample` 複製後人工改寫 | 以 sample 為模板複製再改 | 有欄位藍本參考 | 易殘留 `sample-*` / `example.invalid`；違反 sample「不得整檔複製」紅線；高誤帶風險 | ⚠️ 不推薦作為機制；sample 僅供「對照欄位」閱讀 |
| C. 從外部私有表格整理後手動貼入 | 從私人 spreadsheet 整理 | 可批次 | 私有表格易夾帶 commission / 帳號 / token；高敏感外洩風險；需逐欄清洗 | ⚠️ 風險高；若採用須嚴格 §13 scan |
| D. Admin write-enabled 之後由 UI 寫入 | 由 write-enabled Admin 寫 registry | 流程化 | write path 全 dormant（Admin Apply / middleware / admin-write-cli 未啟）；遠未到位 | ❌ 不在本階段可行範圍 |
| E. 不 seed，維持 empty until first real post need | 維持 `[]` 直到真有文章需要 | 零風險；零 history 污染；baseline 不變 | 功能延後 | ✅ **本輪採此（default）** |

### 推薦

- **本輪**：採 **E（不 seed）**。
- **未來真要 seed 時**：採 **A（手動編輯 production registry）**，並先完成 §5 / §7 / §13 policy，且由 user 明確提供候選 entries（linkId / displayLabel / role / targetUrl）後，於獨立 seed phase 執行。

---

## 11. Recommended First Seed Scope（未來，非本輪）

未來第一個 seed phase 的**最小安全範圍**建議：

1. **只新增 1–3 筆** entries（不批量）。
2. **是否允許真實 affiliate URL**：first seed **先不含 tracking 參數**；採 **official / direct public URL only**（§7.2）。
3. **是否先用 official/direct public URLs**：✅ 是（最低敏感度起步）。
4. **是否需先釐清 repo public/private**：✅ **是**——若 repo 為 public，任何入庫 URL 即公開；若 private，仍受 §13「git history 永久」約束。此為 seed 前必答項。
5. **是否需要 user 手動提供 linkId / label / role / targetUrl**：✅ **是**。所有值由 user 明示提供（mirror CLAUDE.md §3：「所有 key 由作者明示填寫」），AI 不臆測、不從 URL pattern 推斷 merchantKey / networkKey / linkId。
6. **本輪不做 seed**。

---

## 12. Validator / Admin / Renderer Relationship

| 角色 | 對 registry 的關係 | 狀態 |
|---|---|---|
| **Validator** | gatekeeper：C3/C4/C9 以 registry 校驗 post `ref` / `labelOverride`；warning-only | landed；對 empty registry 全 0 觸發 |
| **Admin preview** | visibility：只讀 registry 整成 safe rows 顯示；**不**消耗 `targetUrl` | landed/accepted；read-only；empty-state |
| **future renderer** | 唯一**消耗** `targetUrl` 產出實際連結者 | dormant（未啟動） |
| **future snippet（A6）** | 輸出作者可貼 YAML | dormant（未啟動） |

關鍵語意（seed ≠ activation）：

- **Validator = gatekeeper**；**Admin preview = visibility only**；**future 才會消耗 `targetUrl`**。
- **seed 本身 ≠ renderer activation**（寫了 registry 不代表頁面開始輸出連結）。
- **seed 本身 ≠ Admin write activation**（preview 仍 read-only）。
- **seed 本身 ≠ C7 activation**（role 仍 optional）。

---

## 13. Security / Privacy / Commercial Red Lines

未來 seed **永不可**包含（mirror CLAUDE.md §3 commerce 治理紅線）：

- ❌ token / access token / bearer / refresh token / session id / Authorization header
- ❌ credential（email / password / OAuth client secret / API key）
- ❌ private download URL / 私人 Drive folder ID
- ❌ Google Form respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Sheet response rows）
- ❌ non-public tracking data（綁帳號之私密追蹤識別）
- ❌ private notes（私人備註，尤其勿放 `notes` / label 欄位）
- ❌ commission-sensitive values（commission / payout / clickCount 等 dashboard 統計）
- ❌ customer data（讀者 / 客戶個資）
- ❌ 帳號 email / 結算密碼
- ❌ 任何 should-not-be-in-git-history 之資料

> **git history 警告**：上述任一若誤 commit，**不能只靠刪檔解決**。git 是內容定址的版本歷史——刪檔只是新增一個「移除」commit，**舊 blob 仍存在於 history**，可被 `git log -p` / `git cat-file` / 既有 clone / fork / GitHub 快取還原。真正移除需 history rewrite（filter-repo / BFG）+ force-push + 撤換已外洩之 secret，代價高且對已 push 之 public repo 往往無法完全收回。**因此唯一安全策略是「commit 前就不放」**。

---

## 14. Future Seed Phase Acceptance Criteria

未來真正 seed phase 的 acceptance 條件：

1. **exact file scope**：diff 只含 `content/settings/commerce-links.json`（seed 本身）；**no source change**；**no Admin change**；**no renderer change**；無 package / vite / fixture / docs 連帶變更（docs 若需更新另列）。
2. **validate count expected**：seed N 筆後，registry-level R 規則對 well-formed entries 應 0 新 error；新增 warning（若有）須**事前列舉預期值**並逐條解釋；normal 與 overlay count 須明確記錄前後差。
3. **no source change** / **no Admin write** / **no renderer change**。
4. **no real secrets**：通過 §13 紅線。
5. **每筆 entry manual reviewed**（linkId / displayLabel / role / targetUrl 皆 user 提供並逐筆 review）。
6. **sensitive scan**：commit 前掃描 token / credential / aff_id / sid / merchant id / Form ID / respondent data；確認無誤帶。
7. **working tree clean**（commit 後）。
8. **commit/push rules**：單一 commit、明確 subject、push 後確認 HEAD = origin/main、ahead/behind = 0/0。

---

## 15. Future Rollback / Replacement Policy

- 通路 / 連結失效時，以 `replacementTarget` + `active:false` 管理（§9），**不自動批次改文**。
- 流程：**先更新 registry**（退役舊 entry、配替代），**再由 validator（C4）/ Admin preview 輔助**作者人工決定是否改文。
- 避免一篇文章多連結混淆：以 `role` + `displayLabel` 區分；以 registry 為 single source of truth，不在多處複製連結。
- rollback（撤回 seed）：因 git history 永久（§13），撤回 entry 只能新增 commit 移除；**唯一**對抗 secret 外洩的方式仍是「commit 前不放」。

---

## 16. Recommended Phase Ladder（conservative）

| 階段 | 內容 | 狀態 |
|---|---|---|
| **L0（本輪）** | seed governance doc（本檔） | ✅ 本輪 |
| L1 | seed preflight with **user-provided candidate list**（user 提供 linkId / label / role / targetUrl 候選；docs-only 審核 + §13 scan plan） | 未啟動 |
| L2 | seed implementation（**docs / settings-only**：寫 `commerce-links.json`；no source） | 未啟動 |
| L3 | seed acceptance（§14 條件逐項驗收） | 未啟動 |
| L4+ | renderer activation **only after seed governance accepted** | dormant |
| — | **C7 source only after product decision** | NO-GO |
| — | **write-enabled Admin much later** | dormant |

ladder 不自動推進；每階段需 explicit approval。

---

## 17. Final Recommendation

1. **本輪不 seed**——registry 維持 empty `[]`；baseline 不變。
2. **推薦先 acceptance**（驗收本 governance doc）。
3. **下一步不應直接改 registry**，除非 user **明確提供候選 entries** 並**批准獨立的 seed phase（L1 → L2 → L3）**。
4. **C7 / Admin write / renderer / deploy 全部保持 dormant**。
5. first safe seed 機制 = **Option A（手動編輯 production registry）**；first scope = **1–3 筆 official/direct public URL，不含 tracking 參數**（§11）；所有值 user 明示提供、逐筆 manual review、通過 §13 紅線。

---

## Appendix A — 非本輪動作清單（confirmed non-actions）

- ❌ no seed / no registry write / no `_sample` promote / no overlay / no fixture / no production migration
- ❌ no source change（validator / loader / helper / build / Admin EJS）
- ❌ no Admin write / no middleware / no admin-write-cli / no Admin Apply
- ❌ no C7 activation / no A6 copyable snippet / no Admin selector further impl
- ❌ no renderer / landing-page activation / no build / no deploy / no Blogger repost
- ❌ no GA4 validation / no reverse UTM activation / no pm-26 unblock
- ❌ no CLAUDE.md / MEMORY.md / package / vite / 既有 docs 修改
- ❌ no amend / rebase / force-push / no prior-commit subject 修正
- ❌ no real affiliate URL / tracking id / sid / aff_id / merchant id / token / credential / Form ID / respondent data / 私人下載連結 / commission data
