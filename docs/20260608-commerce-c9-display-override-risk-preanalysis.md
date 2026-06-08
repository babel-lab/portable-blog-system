# 2026-06-08 Commerce C9 Display Override Risk — Standalone Preanalysis (docs-only)

Phase name: `20260608-pm-1-commerce-c9-display-override-risk-preanalysis-docs-only-a`
Date: 2026-06-08 12:06 +0800
Mode: **docs-only C9 standalone contract preanalysis**（no source / no fixture / no content / no settings registry mutation / no registry seed / no templates / no renderer / no loader change / no validator rule landing / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no admin selector implementation / no download renderer / landing implementation / no real affiliate link / tracking id / token / credential / merchant id / no production content migration / no `npm install` / no CLAUDE.md mutation / no MEMORY mutation / no amend / rebase / force-push）

本檔對應 `docs/20260608-registry-seed-governance-preanalysis.md` §13 phase ladder 之 **L2（C9 standalone contract preanalysis，docs-only）**。L1（seed governance docs-only acceptance）已隨 registry-seed governance doc accepted；本輪只做 L2，不跨入 L3 sample design / L4 overlay preflight / L5 source。

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-18 `（schema decision）` | commerce registry schema decision | 凍結 registry 欄位 `linkId` / `internalLabel` / `targetUrl` / `networkKey` / `active` / `replacementTarget` / `displayLabel`；§9.3 internalLabel 為內部識別、**不**得渲染前台 |
| night-22 `d5cfcd0` | commerce-links validator preanalysis（docs-only） | 凍結 registry-level R1..R15 + content-reference C1..C9 rule contract；**V14 = internalLabel 洩漏防護**（C9 之 registry-side 對應） |
| am-7 (20260604) `（content-ref preanalysis）` | commerce content-reference validation preanalysis | C1..C9 content-reference rule contract 凍結；§4.4 凍結 `labelOverride` override 邊界；§5.1 / §5.8 凍結 C9 命名 `commerce-ref-display-override-risk` + trigger 概述；C9 標 long-tail / defer |
| `39b89e3` / `281cd43` | commerce content-ref source landing | `validateCommerceRefs`：C1 / C2 / C3 / C5 / C6 |
| `149efdc` / `3aeabbc` | commerce content-ref fixtures landing | 5 個 post-level fixture |
| `8c9fddf` | commerce C4 inactive ref validation preanalysis（docs-only） | C4 contract 凍結；**source blocked by empty registry + Option D fixture lock** |
| `57c983b` | commerce C8 invalid role validation source landing | `validateCommerceRefs` 新增 C8 `commerce-ref-invalid-role`（warning-only；post-side；無 registry coupling；獨立 pass） |
| `bb33523` | commerce C8 invalid role fixture landing | `_test-commerce-ref-invalid-role.md`；baseline → 69/59 |
| `bc744d4` | registry seed governance preanalysis（docs-only） | 共同 blocker = empty registry + Option D fixture lock；§9 標 C9 雙重 block（registry coupling + 缺 standalone contract）；§13 phase ladder L2 = 本檔 |
| **pm-1（本 phase）** `（本 commit）` | **commerce C9 display override risk standalone preanalysis（docs-only）** | 為未來 C9 source 凍結 rule definition / 風險語意 / field scope / trigger options / registry coupling / fixture strategy / cascade / 紅線；**不**實作 source；**不**新增 fixture；**不** seed registry；**不**碰 production content |

本階段唯一目的為：

> 在 commerce C1 / C2 / C3 / C5 / C6 / C8 source + fixtures 全部 landed and accepted、C4 docs-only plan landed but source blocked、registry-seed governance accepted、commerce + download registries 仍 empty `[]`、production posts 0 使用 `ref` / 0 使用 `role` / 0 使用 `labelOverride` 之現況下，**先**為 C9（`commerce-ref-display-override-risk`）凍結 standalone rule contract（rule id 最終命名 candidate / trigger 精確定義 / message shape「不 echo internalLabel」/ field scope / registry coupling / cascade / fixture strategy / 紅線），並明確判定**不在本階段 implement C9 source**（C9 同 C4 為 registry-coupled，empty registry + Option D fixture lock 下無法驗證；貿然 land = dead source 且無 fixture 可走）。本階段**不**改任何可執行檔；**不**新增任何 fixture；**不**改 `content/settings/commerce-links.json`；**不**改 CLAUDE.md / MEMORY。

---

## 1. Executive Summary

### 1.1 本輪性質宣告

> **本輪為 docs-only C9 standalone contract preanalysis。** 不實作 C9 source；不新增 fixture；不 seed registry；不改 production content；不改 src / content / settings / templates / views / fixtures / package / lockfile / dist / gh-pages / .cache / CLAUDE.md / MEMORY。唯一輸出為本檔。

### 1.2 一句話結論

> **建議 docs-only 凍結 C9 rule contract（最終命名沿用 am-7 §5.1 凍結之 `commerce-ref-display-override-risk`、warning-only、針對 post-level `affiliate.links[i].labelOverride`、trigger 採最保守之「leak-equality」語意 = `labelOverride` trim 後等於命中 registry entry 之 `internalLabel` 時警告、message shape 只報欄位名與風險類型且 **絕不 echo internalLabel / labelOverride 原值**、與 C1..C8 全 orthogonal、不遮蔽任何既有 rule、不改 renderer）；C9 為 registry-coupled rule（需 registry 內有帶 `internalLabel` 之 entry 才可觸發），與 C4 同被 empty registry + Option D fixture lock 雙重 block；本階段不 implement C9 source；下一階段應為 read-only acceptance cross-check 或 Final Idle Freeze。**

### 1.3 推薦理由摘要

- **C9 contract 已有種子但缺 standalone 文**：am-7 §4.4 / §5.1 / §5.8 已凍結命名與 trigger 概述（`labelOverride` trim 等於 entry `internalLabel`），但散落於 master doc；registry-seed governance §9.1 明指 C9 source 前須**獨立 docs-only preanalysis**（mirror C4 `8c9fddf` / C8 `bb33523` 格式）。本檔補齊此缺。
- **C9 是 governance warning，不是 security error**：internalLabel 洩漏前台屬「站長內部識別外顯」之治理問題，非資料正確性 / build 阻擋問題；故 warning-only，且 message 本身**不可** echo internalLabel 值（否則 validator log 反而成為洩漏管道）。
- **C9 為 registry-coupled，與 C4 同 blocked**：trigger 需比對 registry entry 之 `internalLabel`；empty registry + Option D fixture lock → 無合法 entry 來源 → C9 source 即使 land 亦 0 觸發 / 0 fixture / dead source。此即 registry-seed governance §9 將 C9 標雙重 block 之原因。
- **最保守 trigger = leak-equality**：在 §6 比較之 A..E 五種 trigger 候選中，「divergence」型（A / B / D：post label 與 registry label **不同**即警告）會對 `labelOverride` 之**正常設計用途**（per-article CTA 客製）大量誤報，違反 am-7 §4.4 「允許文章端覆寫顯示文字」之既定決策；唯有 am-7 凍結之 leak-equality（labelOverride **等於** internalLabel）只在真正洩漏風險時觸發，false-positive 最低。
- **不違反紅線**：本 phase 為 docs-only；不放真實 affiliate URL / token / merchant tracking id / OAuth secret；不 mutate production registry；reverse UTM 與 pm-26 維持 dormant / BLOCKED。

### 1.4 本 phase 範圍

- 凍結 C9 rule id 最終命名 candidate 與 acceptance gate。
- 凍結 C9 problem statement / 為何是 governance warning 非 security error。
- 盤點既有 contract source（am-7 / night-22 V14 / night-18 §9.3）。
- field scope 分析：post-side `labelOverride` vs registry-side `internalLabel` / `displayLabel`；釐清 C9 比較哪兩欄位。
- 比較 5 種 trigger 定義候選（A..E）+ leak-equality 基準；多維評估。
- 凍結最保守推薦 trigger contract（warning-only / 不 echo 敏感值 / 不遮蔽其他 rule）。
- 分析 registry coupling / empty registry dead-code 約束 / 與 seed governance doc 之關係。
- 凍結 future fixture strategy（須 registry entry → Option D overlay 或 Option G real）。
- 凍結 cascade / mutual-exclusivity（C1..C8）。
- production impact / Admin / renderer impact / security 紅線。
- future phase ladder（對齊 seed governance §13）。
- 預設 baseline 不變動（0 errors / 69 warnings / 59 posts）。
- 給下一階段建議；不執行下一階段。

### 1.5 本 phase 不做的事

- ❌ 不 implement C9 source（`validateCommerceRefs` 不改）。
- ❌ 不新增任何 fixture（不論 post-level 或 settings-level）。
- ❌ 不 seed `content/settings/commerce-links.json`（registry 維持 empty）。
- ❌ 不 migrate / mutate production posts；不新增 commerce frontmatter / `labelOverride`。
- ❌ 不啟用 renderer fallback；不啟用 Admin picker / selector / display；不啟動 download renderer / landing implementation。
- ❌ 不啟用 build / deploy / Blogger repost / GA4 commerce dimension。
- ❌ 不 unblock pm-26；不啟用 reverse UTM；不啟用 admin-write-cli / Admin Apply / middleware write。
- ❌ 不改 CLAUDE.md / MEMORY / auto-memory；不改既有 docs（只新增本檔）。
- ❌ 不改 C1 / C2 / C3 / C5 / C6 / C8 之既有 contract。
- ❌ 不 `npm install`；package / lockfile 不動。
- ❌ 不 amend / rebase / force-push；不修正上一個 commit subject 之 `@` 前綴。

---

## 2. Current Baseline

### 2.1 git / validate baseline（本 phase 開始時）

```
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: bc744d4d4a38c9e2520331946472a1aac18071c4
origin/main: bc744d4d4a38c9e2520331946472a1aac18071c4
ahead/behind: 0/0
working tree: clean
latest subject: docs(registry): plan seed governance
validate: 0 errors / 69 warnings / 59 posts
```

### 2.2 commerce content-reference 已 landed 範圍

- ✅ C1 `commerce-ref-invalid-type` / C2 `commerce-ref-empty` / C3 `commerce-ref-not-found` / C5 `commerce-ref-duplicate-in-post` / C6 `commerce-ref-direct-url-coexist`：source + fixture landed。
- ✅ **C8 `commerce-ref-invalid-role`：source（`57c983b`）+ fixture（`bb33523`）landed and accepted**；`_test-commerce-ref-invalid-role.md` 觸發 `commerce-ref-invalid-role: affiliate.links[0].role="Primary"`（raw-only entry，registry 維持 empty 未 seed）。
- 🔄 C4 `commerce-ref-inactive`：docs-only plan landed（`8c9fddf`）；**source blocked by empty registry + Option D fixture lock**。
- ❌ C7 `commerce-ref-missing-role`：**不建議啟用**（role optional，missing-role warning 會 noise）。
- ❌ **C9 `commerce-ref-display-override-risk`：contract 概述存在（am-7 §4.4 / §5.1 / §5.8 + night-22 V14），standalone 文 = 本檔；source 未實作。**

### 2.3 registry / production 現況

- `content/settings/commerce-links.json` = `{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`（empty；R1-clean 七條件全滿足）。
- registry schema（night-18 凍結）欄位含 `internalLabel` / `displayLabel`，但 registry 為 empty `[]` → **無任何 entry 帶 internalLabel / displayLabel**。
- production posts 使用 `affiliate.links[].ref` = **0 篇**；使用 `affiliate.links[].role` = **0 篇**；使用 `affiliate.links[].labelOverride` = **0 篇**（既有 production `affiliate.links` 皆為 `[]`）。
- 69/59 warnings 全屬 `content/validation-fixtures/`（validator 預期樣本，非 regression）。

### 2.4 dormant / blocked rails

- commerce renderer / Admin picker / Admin selector / display：dormant。
- download landing real-path renderer / Google Forms 串接 / 下載頁：dormant（placeholder-only）。
- reverse UTM activation：dormant（pm-24 source landed; un-deployed）。
- pm-26 deploy gate：BLOCKED。
- Admin Apply / middleware write / admin-write-cli：dormant。
- build / deploy / Blogger repost / GA4 commerce / download dimension：dormant。

---

## 3. C9 Problem Statement

### 3.1 C9 要防的風險

- registry `commerceLinks[]` 每筆 entry 有兩個 label 維度（night-18 凍結）：
  - **`displayLabel`** — 對外可見之顯示文字（如「博客來」/「金石堂」）；**可**渲染前台。
  - **`internalLabel`** — 站長內部識別字串（如「atomic-habits 主推-博客來-2026Q2」/ 含內部備註 / 結算分類）；**不**得渲染前台（night-18 §9.3）。
- 文章端可用 `affiliate.links[i].labelOverride`（per am-7 §4.4）覆寫顯示文字，達成 per-article CTA 客製。
- **風險**：若站長（或未來 Admin picker 自動填值）把 `labelOverride` 填成等同 registry entry 之 `internalLabel`，則內部識別字串會被當作前台 CTA 顯示 → **內部識別洩漏至前台 / SEO / Blogger 重貼 / FB 推廣文案**。
- C9 = 在 `npm run validate:content` 階段提早抓出此 leak risk，提示站長改用 `displayLabel` / 合理 CTA 文案。

### 3.2 為何 C9 是 governance warning，而非 security error

| 觀點 | 說明 |
| --- | --- |
| 非資料正確性問題 | `labelOverride` 等於 internalLabel **不會**讓 build 失敗、不會讓 ref 解析錯誤、不會破壞 frontmatter shape；資料仍「有效」，只是「顯示了不該顯示的字串」。 |
| 屬「治理 / 隱私 hygiene」維度 | 與 download R1（respondent data 不進 repo）/ commerce §9（secret safety）同類 —— 防止內部 / 敏感字串外顯，屬治理紅線而非語法錯誤。 |
| 嚴重度取決於 internalLabel 內容 | internalLabel 可能只是無害的內部命名，也可能含結算 / 通路內部代號；validator 無從判斷其敏感度 → 一律 warning 提示，由站長判斷，**不**強制阻擋。 |
| warning-only 一致政策 | 全部 commerce content-ref rule（C1..C8）皆 warning-only；C9 沿用，不破壞既有「validator 不阻擋 build」之專案慣例（CLAUDE.md §1 不過度工程化）。 |
| message 本身不可成為洩漏管道 | ⚠️ 關鍵：若 C9 warning message echo 出 internalLabel 原值，則 validator log（可能進 CI log / 終端截圖 / 貼給他人 debug）反而洩漏內部字串 → C9 message **只報欄位名 + 風險類型，不 echo 值**（mirror C6 之「不 echo url value」既有先例，validate-content.js:642）。 |

> 結論：C9 是 **warning-only governance warning**；其唯一行為是「提示可能洩漏」，不阻擋、不自動改寫、不 echo 敏感值。

---

## 4. Existing Contract Source

### 4.1 C9 原始定義出處

| 來源 | 內容 |
| --- | --- |
| night-22 `d5cfcd0` §6 V14 | registry-level V14「internalLabel 洩漏防護」之 **author-side mirror**；C9 為其 content-reference 維度（post side）對應 |
| night-18 §9.3 | internalLabel 為站長內部識別、**不**得渲染前台 → C9 之治理依據 |
| am-7 §4.4（display label override 邊界）| 「fallback chain：`labelOverride`（文章端）→ registry `displayLabel`；internalLabel 之安全 fallback **禁止**」；「**若 `labelOverride` 等於 registry `internalLabel` → C9 warning** 提示可能洩漏內部識別至前台」 |
| am-7 §5.1（rule catalog）| C9 = `commerce-ref-display-override-risk`；trigger =「`labelOverride` trim 後等於 entry `internalLabel`（洩漏風險）」；empty registry 觸發 = ❌ no；in-scope =「long-tail（需 registry entry；defer）」 |
| am-7 §5.8 | C9 `commerce-ref-display-override-risk`：「`labelOverride` 為 string 且 trim 後等於 entry `internalLabel`」；「屬 night-22 V14 之 author-side mirror；防 internalLabel 洩漏前台；需 registry entry → coupling Option A」 |
| registry-seed governance §9（`bc744d4`）| C9 雙重 block（registry coupling + 缺 standalone contract）；§9.2 明定「C9 message **不可** echo internalLabel 原值」；§13 ladder L2 = 本檔 |

### 4.2 目前 rule id candidate

- **candidate rule id = `commerce-ref-display-override-risk`**（am-7 §5.1 / §5.8 已凍結命名；night-22 同名思路）。
- 命名風格與既有 `commerce-ref-*` 系列一致（`commerce-ref-invalid-type` / `-empty` / `-not-found` / `-duplicate-in-post` / `-direct-url-coexist` / `-invalid-role`）。
- 本檔**沿用**此命名，**不**自行更名。

### 4.3 rule id 是否已完全固定

- ⚠️ 命名 `commerce-ref-display-override-risk` 雖於 am-7 凍結，但 C9 之 **trigger 精確語意** 尚未經 source-phase user final-confirm（mirror C8 enum 仍標 provisional 直到 `57c983b` 落地前 user 確認）。
- 因此本檔：
  - **rule id**：沿用 `commerce-ref-display-override-risk`（穩定 candidate；除非 user 於 acceptance 階段要求更名，否則維持）。
  - **trigger 語意**：本檔在 §6 比較 A..E + leak-equality 基準，**推薦** leak-equality；但標明仍為 **provisional contract**，須 user 於未來 source preflight 階段最終確認後方可 land source。
- **不**自行改變 C1 / C2 / C3 / C5 / C6 / C8 之既有 contract（皆已 landed / accepted；本檔只談 C9）。

---

## 5. Field Scope Analysis

### 5.1 post-side 欄位（per am-7 §4.1）

| 欄位 | 型別 | 角色 | C9 相關性 |
| --- | --- | --- | --- |
| `affiliate.links[i].ref` | string | 指向 registry `linkId`（machine key）| C9 需 ref 命中 registry 才有 entry 可比對（coupling 來源）|
| `affiliate.links[i].url` | string | raw affiliate URL（過渡期 fallback）| 與 C9 無關（C6 管轄）|
| `affiliate.links[i].label` | string | raw 顯示文字（過渡期；非 override 機制）| ⚠️ 邊界：`label`（raw 形態顯示文字）與 `labelOverride`（ref 形態覆寫）為兩欄位；C9 **以 `labelOverride` 為主**（見 §5.4）|
| `affiliate.links[i].labelOverride` | string | 文章端覆寫顯示文字（per am-7 §4.4）| **C9 主對象** |
| `affiliate.links[i].role` | string enum | 顯示角色 | 與 C9 無關（C8 管轄）|

### 5.2 registry-side 欄位（per night-18 凍結 schema）

| 欄位 | 型別 | 角色 | C9 相關性 |
| --- | --- | --- | --- |
| `commerceLinks[].linkId` | string | machine key（ref 指向目標）| C9 經 ref → linkId lookup 取得 entry |
| `commerceLinks[].displayLabel` | string | 對外可見顯示文字 | **可**渲染前台；divergence 型 trigger 才比對（§6 A/D）|
| `commerceLinks[].internalLabel` | string | 站長內部識別（**不**得前台）| **C9 leak-equality 主比對對象** |
| `commerceLinks[].targetUrl` | string | 真正導向 URL（registry 單一管理）| 與 C9 無關（文章端不可覆寫 targetUrl，per am-7 §4.4）|
| `commerceLinks[].networkKey` | string | affiliate 網路 key | 與 C9 無關 |
| `commerceLinks[].active` | boolean | 是否啟用 | 與 C9 無關（C4 管轄）|
| `commerceLinks[].replacementTarget` | string | 下架替代 linkId | 與 C9 無關（C4 / R14 管轄）|

### 5.3 C9 要比較哪兩個欄位

> **C9 核心比較 = post-side `affiliate.links[i].labelOverride`（trim 後）vs registry entry（由 `ref` lookup 取得）之 `internalLabel`（trim 後）。** 兩者相等 → leak-equality warning。

- **不**比較 `labelOverride` vs `displayLabel`（divergence 是 `labelOverride` 之**正常設計用途**，per am-7 §4.4「允許文章端覆寫顯示文字」；比對 divergence 會大量誤報 → 見 §6 否決理由）。
- **不**比較 raw `label`（raw 形態無 ref → 無對應 registry entry → 無 internalLabel 可比；見 §5.4）。

### 5.4 raw `label` 是否納入 C9（邊界釐清）

- `label`（raw 形態，per am-7 §4.1 形態 2 / 3）出現在「無 ref」或「ref + raw coexist」之 entry；其中**純 raw**（無 ref）形態無對應 registry entry → 無 internalLabel 可比 → **C9 不適用**。
- 對「ref + raw coexist」形態（同帶 `ref` + `label`），理論上可比 `label` vs entry.internalLabel；但：
  - 此形態已由 **C6**（`commerce-ref-direct-url-coexist`，針對 `url`）提示應 migration；額外對 `label` 做 leak 比對屬 long-tail。
  - 為降低 false-positive 與實作複雜度，**本檔建議 C9 v0 只看 `labelOverride`**（ref 形態之 explicit override 欄位），**不**納入 raw `label`。raw `label` 之 leak 比對標記為 **future extension（defer）**，不在 C9 v0 contract。

### 5.5 internalLabel / displayLabel 目前狀態（關鍵約束）

> ⚠️ **registry 為 empty `[]`，目前沒有任何 entry 帶 `internalLabel` / `displayLabel`。** 欄位本身已於 night-18 凍結入 schema，但無實際 entry → C9 之比對對象（entry.internalLabel）在現況下**不存在**。因此 C9 在 empty registry 下**永遠 0 觸發**，屬 **blocked / future-compatible** 狀態（同 C4）。本檔明確標記：C9 之 source / fixture 須等 registry 有帶 internalLabel 之 entry（透過 Option D overlay 或 Option G real entry）後方可驗證；**不**在本 phase 解此 coupling。

---

## 6. Trigger Definition Options

⚠️ 以下為 trigger 候選比較；本 phase **不**裁決最終 source 行為，僅**推薦**最保守者。所有候選皆 warning-only、皆需 registry 有對應 entry（empty registry 下全 0 觸發）。

基準參照：am-7 已凍結之 **leak-equality** = `labelOverride` trim 後**等於** entry `internalLabel` → warning。以下 A..E 為 user 要求比較之其他候選，與 leak-equality 對照。

### 6.1 候選定義

| 代號 | trigger 定義 | 語意 |
| --- | --- | --- |
| **基準 (leak-equality)** | `labelOverride` trim == entry `internalLabel` trim | 偵測「把內部識別當顯示文字」之**洩漏** |
| **A** | post `labelOverride` 與 entry `displayLabel` **不同** | 偵測「顯示文字偏離 registry 正規顯示文字」 |
| **B** | post `labelOverride` 與 entry `internalLabel` **不同** | 偵測「顯示文字偏離內部識別」 |
| **C** | post `labelOverride` 存在 **且** `ref` 存在 | 偵測「ref 形態下還手填 override」 |
| **D** | post `labelOverride` 存在 **且** 與 canonical label（displayLabel 優先，否則 internalLabel）**不同** | 偵測「偏離 canonical 顯示文字」 |
| **E** | 只在 post `labelOverride` 看起來像 merchant / product override（heuristic：含通路名 / 含內部代號 pattern）時警告 | 偵測「可疑覆寫」（pattern-based）|

### 6.2 多維評估

| 維度 | 基準 leak-equality | A (≠displayLabel) | B (≠internalLabel) | C (override+ref exists) | D (≠canonical) | E (heuristic merchant) |
| --- | --- | --- | --- | --- | --- | --- |
| false positive | **極低**（只在真的等於 internalLabel 時觸發）| **極高**（每次合法 CTA 客製都 ≠ displayLabel → 必誤報）| 高（合法 override 幾乎都 ≠ internalLabel → 誤報）| **極高**（ref+override 是正常用法 → 幾乎每篇誤報）| **極高**（同 A/D）| 中（heuristic 易誤判通路名）|
| false negative | 中（只抓「完全相等」；近似 internalLabel 不抓）| 低 | 低 | 低 | 低 | 高（pattern 漏抓）|
| 與 am-7 §4.4 設計一致 | ✅ 一致（override 本來就該 ≠ displayLabel；只在 ==internalLabel 時警告）| ❌ **矛盾**（A 等於懲罰 override 之正常用途）| ❌ 矛盾 | ❌ 矛盾（override+ref 是推薦長期形態）| ❌ 矛盾 | ⚠️ 部分（heuristic 無明確依據）|
| 防 internalLabel 洩漏（C9 本旨）| ✅ **正中目標** | ❌ 不防（比的是 displayLabel）| ⚠️ 反向（≠internalLabel 反而是安全的）| ❌ 不防 | ❌ 不防 | ⚠️ 間接 |
| 實作複雜度 | **低**（單一字串 trim 相等比較）| 低 | 低 | 低 | 中（canonical fallback chain）| **高**（pattern / heuristic；違反「不自動推斷」紅線）|
| registry dependency | 需 entry.internalLabel | 需 entry.displayLabel | 需 entry.internalLabel | 不需 entry label（只看 ref 存在）但 C9 旨意要求比對 → 仍需 entry | 需 entry.displayLabel + internalLabel | 需 entry（含 internalLabel）|
| 是否 echo 敏感值風險 | 可控（不 echo internalLabel）| 可控 | 可控 | 低（不涉 label 值）| 可控 | ⚠️ heuristic 可能需讀 label 內容 |
| message 可不洩漏 | ✅（只報欄位名）| ✅ | ✅ | ✅ | ✅ | ⚠️ heuristic 難不引用片段 |

### 6.3 各候選裁決

- **基準 leak-equality** → ✅ **推薦**（false-positive 最低、正中 C9 本旨、與 am-7 §4.4 既定設計一致、實作最單純、message 易做到不 echo）。
- **A（≠displayLabel）** → ❌ reject（直接懲罰 `labelOverride` 之正常設計用途 → 幾乎每篇合法客製都誤報；違反 am-7 §4.4）。
- **B（≠internalLabel）** → ❌ reject（語意反向 —— ≠internalLabel 其實是「安全」的；誤報大量合法 override）。
- **C（override+ref exists）** → ❌ reject（ref + labelOverride 是 am-7 §4.1 形態 1 之推薦長期形態 → 等於懲罰推薦用法）。
- **D（≠canonical）** → ❌ reject（同 A/D 之誤報問題；canonical fallback 增加複雜度卻不防洩漏）。
- **E（heuristic merchant）** → ❌ reject（pattern-based 推斷違反 CLAUDE.md commerce 治理紅線「不用 URL/字串 pattern 自動推斷；所有 key 由作者明示」；heuristic 誤判 + 難不 echo 片段）。

> **結論：採基準 leak-equality（`labelOverride` trim == entry `internalLabel` trim）為 C9 v0 trigger。** A..E 皆否決。

---

## 7. Recommended C9 Trigger Contract

⚠️ **本 phase 不改 source。** 以下為**建議凍結**之 C9 contract（provisional；待 user 於未來 source preflight 最終確認）。

### 7.1 C9 候選 rule contract

| 屬性 | 值（建議凍結） |
| --- | --- |
| candidate rule id | `commerce-ref-display-override-risk`（沿用 am-7 §5.1 / §5.8）|
| severity | `warning`（warning-only；**不**得 error；**不**阻擋 build）|
| 觸發對象 | post-level `affiliate.links[i].labelOverride`（per-instance override 欄位）|
| sourcePath | post `.md` 路徑（mirror C1..C8）|
| trigger（建議）| `labelOverride` 為 string 且 trim 後非空；`ref` 為 trimmed non-empty string 且命中 registry；命中 entry 之 `internalLabel` 為 string 且 trim 後非空；且 `labelOverride.trim() === entry.internalLabel.trim()`（case-sensitive exact match，mirror C5 / C8 比較語意）|
| **缺 labelOverride 是否警告** | ❌ no（`labelOverride === undefined` / 空 → 不觸發）|
| **ref not-found 是否進行比對** | ❌ no（ref 未命中 → 無 entry → **不**比對；避免 cascade noise，見 §10）|
| **entry 無 internalLabel 是否警告** | ❌ no（entry.internalLabel 缺 / 空 → 無比對對象 → 不觸發）|
| **非字串 labelOverride 是否 hard error** | ❌ no（非字串 → 不符 string 前提 → 不觸發；不 throw）|
| message shape | `affiliate.links[<i>].labelOverride matches the registry internalLabel for ref="<ref>" (possible internal-identifier leak; use displayLabel or a public CTA)` —— **只報欄位名 + ref（machine key，非敏感）+ 風險說明；絕不 echo `internalLabel` 值、絕不 echo `labelOverride` 值** |
| empty registry 觸發 | ❌ no（registry 無 entry → ref 不可能命中 → 0 觸發）|
| 0 labelOverride 使用觸發 | ❌ no（production 0 篇用 labelOverride → 0 觸發）|
| renderer / build 行為 | **不**改變；C9 為 validator-only warning |
| 自動修正行為 | **不**自動移除 / 改寫 labelOverride；**不** codemod；**不**改 render output |
| production content 影響 | **不**自動修改任一 production post；warning-only |

### 7.2 最保守原則（明確列舉）

- ✅ **warning-only**：不 hard error、不阻擋 build。
- ✅ **不自動改 label**：不移除 / 不改寫 `labelOverride`；不 codemod。
- ✅ **不印出 / 不 echo 敏感值**：message 不含 `internalLabel` 原值、不含 `labelOverride` 原值；只報欄位名 + ref machine key + 風險類型（mirror C6 不 echo url，validate-content.js:642）。ref 為作者明示之 machine key（非 token / 非 tracking），可安全出現於 message。
- ✅ **不遮蔽 C3 / C4 / C5 / C6 / C8**：C9 為獨立比對，不改變任何既有 rule 之觸發 / 結果；同一 entry 可同時觸發 C9 與其他 orthogonal rule。
- ✅ **不改 renderer behavior**：renderer fallback chain（per night-9 / am-7 §4.4）獨立於 C9；C9 不啟動 renderer、不改前台顯示。

### 7.3 與 leak-equality 之 false-negative 殘留（誠實標記）

- C9 v0 只抓「完全相等」之 leak；「近似 internalLabel」（如多 / 少空白以外之變體、含 internalLabel 為子字串）**不**抓 → false negative 殘留。
- 本檔**不**擴張為 substring / fuzzy 比對：fuzzy 會引入 false positive + 難不 echo 片段 + 違反「不自動推斷」精神。殘留 false negative 由站長 review 補足；C9 只做「明確相等」之安全網。

---

## 8. Registry Coupling / Empty Registry Constraint

### 8.1 C9 是否需要 registry entry 才能判斷

- ✅ **需要**。C9 trigger 之核心比對對象為 registry entry 之 `internalLabel`；無 entry → 無 internalLabel → 無從比對。
- C9 與 C4 同屬 **registry-coupled rule**（registry-seed governance §3.3 / §9 已明指）；與 C1 / C2 / C3 / C5 / C6 / C8（registry-independent，empty registry 下可測）不同。

### 8.2 empty registry 下是否 dead code

- ✅ **是**。registry empty `[]` → 任何 post `ref` 皆 not-found（C3）→ C9 比對前提（ref 命中 + entry.internalLabel 存在）永遠不成立 → C9 **0 觸發**。
- C9 source 即使 land，於 empty registry + 0 production labelOverride 下為 **dead source**（0 fixture 覆蓋、0 production 觸發、0 可觀察行為）。此即不應在本 phase land C9 source 之根本原因（mirror C4 `8c9fddf` §1.2）。

### 8.3 與 registry-seed governance doc 之關係

- registry-seed governance（`bc744d4`）§9 已將 C9 標為**雙重 block**：
  1. **registry coupling**（同 C4）：需 registry 有帶 internalLabel 之 entry。
  2. **缺 standalone contract**：am-7 僅 §5 概述 → 本檔（L2）補齊。
- 本檔閉合第 2 項（standalone contract 凍結）；第 1 項（registry coupling）仍 **open**，須等 seed governance §13 ladder 之 L3（sample design）/ L4（Option D overlay preflight）/ Option G（user real entry）解開。
- registry-seed governance §7.1 首選 = Option F sample 藍本 + Option G real；次選 = Option D overlay（須獨立 phase）。C9 fixture 對齊此決策（見 §9）。

### 8.4 為何不可現在直接 source

- ❌ **dead source**：empty registry + 0 labelOverride → land 即 0 觸發、無法 acceptance、無法 fixture。
- ❌ **無合法 fixture 路徑**：C9 fixture 需 registry 內有 `{ linkId, internalLabel }` entry + post `labelOverride == internalLabel`；am-2 Option D fixture lock（skip settings-level fixtures）下無合法管道餵 entry，除非污染 production registry（違反 R1-clean）。
- ❌ **trigger 仍 provisional**：leak-equality 雖推薦，但未經 user source-phase final-confirm（mirror C8 enum 之 provisional → `57c983b` 前 confirm 流程）。
- → 結論：C9 source 須等 (a) seed governance 解 registry coupling + (b) user confirm trigger 後，方可獨立 phase land。

---

## 9. Fixture Strategy

⚠️ **本 phase 不建立任何 fixture。** 以下為未來 fixture phase 之規劃約束。

### 9.1 C9 fixture 最小需求

- C9 fixture 須同時具備：
  1. registry 內 ≥1 筆 entry `{ linkId: "<fixture-key>", internalLabel: "<fixture-internal>", displayLabel: "<fixture-display>", targetUrl: "<reserved>", active: true, ... }`；
  2. 一個 post `affiliate.links: [{ ref: "<fixture-key>", labelOverride: "<fixture-internal>" }]`（`labelOverride` 故意 == entry.internalLabel → 觸發 C9）。
- 此 entry **必須**透過 **Option D overlay**（fixture-scoped settings fixture；registry-seed governance §6.4）或 **Option G**（user 真實 entry）提供；**不可**寫入 production `commerce-links.json`（違反 R1-clean / am-2 Option D lock）。
- registry 維持 empty `[]`（production）；fixture entry 留在 fixture-scoped overlay。

### 9.2 fixture 內容紅線（不放敏感資料）

- ❌ **不**含真實 affiliate URL / tracking id / token / credential / merchant key / OAuth secret。
- ✅ `targetUrl` 用 RFC 2606 reserved（`https://example.invalid/...`）。
- ✅ `linkId` / `internalLabel` / `displayLabel` 用明顯 fixture 字串（如 `fixture-c9-internal-label` / `fixture-c9-display`），與真實內部識別區隔。
- ✅ `labelOverride` 設為與 fixture entry.internalLabel **完全相同**之 fixture 字串（觸發 leak-equality）。
- ⚠️ **fixture 之 internalLabel 字串本身也不可像真實內部代號**（避免 fixture review / git blame 混淆，且避免「示範洩漏」誤導）；用無意義 namespaced 字串。

### 9.3 須等 seed governance 下一步後再做 fixture

> C9 fixture **不**在本 phase 建立。fixture 之前置 = registry-seed governance §13 ladder 之 **L3（sample registry design）/ L4（Option D overlay source preflight）** 先 landed（讓 validator 能讀到 fixture-scoped entry），或 **Option G**（user 真實 entry）出現。在 Option D overlay 機制 landed 前，C9 fixture **無合法路徑**；本檔僅凍結上述 fixture shape 與紅線，不建檔。

---

## 10. Cascade / Mutual Exclusivity

### 10.1 C9 與既有 rules 之關係

| rule | 檢查對象 | 與 C9 關係 |
| --- | --- | --- |
| C1 `commerce-ref-invalid-type` | `ref` 型別 | **orthogonal**（C9 看 labelOverride，不看 ref 型別）；但 C1 觸發（非字串 ref）→ 該 entry ref cascade `continue`，C9 之 ref-命中前提不成立 → C9 不觸發該 entry |
| C2 `commerce-ref-empty` | `ref` trim 空 | **orthogonal**；C2 觸發（空 ref）→ ref 不命中 → C9 不觸發 |
| C3 `commerce-ref-not-found` | `ref` 不在 registry | **前提互動**：C3 觸發（ref not-found）→ 無 entry → **C9 不進行比對**（見 §10.2）|
| C4 `commerce-ref-inactive`（plan） | ref 命中但 entry inactive | **orthogonal**（C9 不看 active；同一 entry 可同時 inactive(C4) + labelOverride==internalLabel(C9)）|
| C5 `commerce-ref-duplicate-in-post` | 同 post ref 重複 | **orthogonal** |
| C6 `commerce-ref-direct-url-coexist` | ref + raw url 並存 | **orthogonal** |
| C8 `commerce-ref-invalid-role` | `role` enum | **orthogonal**（C9 看 labelOverride，C8 看 role；獨立 pass）|

### 10.2 C9 不應對 ref-not-found entry 進行 label comparison（避免 cascade noise）

> ⚠️ **設計決策（凍結為 contract）**：C9 之比對前提包含「ref 命中 registry 且 entry 存在」。若 ref **not-found**（C3 已觸發），則無對應 entry / 無 internalLabel → C9 **跳過該 entry 之 label comparison**，**不**額外報 C9 warning。理由：
> - 對 not-found ref 做 label 比對在邏輯上不可能（無比對對象）；
> - 避免「一個 not-found ref 同時報 C3 + 無意義 C9」之 cascade noise；
> - 與 C4 之 registry gate 一致（registry-seed governance §8 / C4 doc §7.3：`commerceLinkIdSet === null` → skip）。
>
> 具體：C9 只在 `commerceLinkEntryMap !== null && entry_from_registry 存在 && entry_from_registry.internalLabel 非空` 時比對。

### 10.3 C9 不改變既有 warning count（除非 fixture / registry 顯式新增）

- C9 為 registry-coupled + 0 production labelOverride → 在 empty registry + 現有 production / fixture 下 **0 觸發**。
- C9 source 即使 land：baseline 維持 **0 errors / 69 warnings / 59 posts**（不變）。
- 唯有未來「C9 fixture（含 overlay entry + labelOverride==internalLabel post）」landed 時，baseline 才 +1 C9 warning（+ 可能 orthogonal cascade）；此屬未來 fixture phase，**本 phase 不 commit 任何數字變動**。

### 10.4 實作所需 helper（未來；本 phase 不做）

- 現有 `validateCommerceRefs(affiliate, sourcePath, issues, commerceLinkIdSet)` 只收 `commerceLinkIdSet`（Set of linkId，validate-content.js:586）—— **無 entry 資料**。
- C9（與 C4）需「ref → entry」mapping 才能取 `internalLabel`（與 C4 之 `active` 需求相同）→ 未來須擴展為 `buildCommerceLinkEntryMap(commerceLinks): Map<linkId, entry> | null`（mirror `buildCommerceLinkIdSet` 之 null fallback / trim / case-sensitive 語意），並擴增 `validateCommerceRefs` signature。此 helper 與 C4 共用（C4 doc §6.3 已提同一 helper）→ C9 / C4 應視為**共享 registry-entry-map 之 coupled pair**，宜同一 source phase 一併 land（避免重複改 signature）。
- ⚠️ 以上為**未來 shape**；本 phase **不**寫 source。

---

## 11. Production Impact

### 11.1 目前 production 觸發為零

- production posts 使用 `affiliate.links[].labelOverride` = **0 篇**；使用 `ref` = **0 篇**；registry empty `[]` → C9 比對前提全不成立。
- 即使 C9 source 落地，於現況 production 下 **0 觸發**（dead source；§8.2）。

### 11.2 即使落地也可能 0 production trigger

- C9 只在「站長 / Admin 把 `labelOverride` 填成等同 entry.internalLabel」時觸發；正常使用（labelOverride = 合理 CTA 文案 ≠ internalLabel）**不**觸發 → 即便未來 registry seeded + production 用 ref + labelOverride，C9 仍可能長期 0 觸發（屬「安全網」性質，只在出錯時響）。

### 11.3 但因 registry empty，source 現在可能不可測

- 與 §8.2 一致：empty registry + 0 labelOverride → C9 source 現在無法被 fixture / production 觸發驗證 → 不應現在 land。

### 11.4 不做 production migration

- 本 phase **不**將任何 production post 之 raw `label` 改為 `ref` + `labelOverride`；**不**新增 labelOverride；**不**碰 production content。production content migration 屬獨立 phase + explicit approval（registry-seed governance §4.3 紅線）。

---

## 12. Admin / Renderer Impact

### 12.1 C9 不應直接改 renderer

- C9 為 validator-only warning；**不**改 renderer fallback chain（per night-9 / am-7 §4.4：`labelOverride` → `displayLabel`；internalLabel **禁止** fallback 前台）。
- renderer 之 internalLabel-禁前台保護與 C9 validator warning 為**兩層獨立防線**：renderer 層保證即使 frontmatter 出錯也不渲染 internalLabel（若 renderer 落地時遵守 night-18 §9.3）；C9 層在 validate 階段提早提示。本 phase **不**啟動 renderer。

### 12.2 Admin selector 可能需要呈現 registry canonical label / display label

- 未來 Admin picker / selector 若讓站長從 registry 下拉選 commerce link，應呈現 entry 之 `displayLabel`（對外可見）作為選項標籤，**不**應把 `internalLabel` 當預設 `labelOverride` 自動填入（否則 Admin 自身會製造 C9 觸發之 leak）。
- → C9 之存在反向約束 Admin selector 設計：**Admin 自動填 labelOverride 時應用 displayLabel / 留空，不得用 internalLabel**。此為未來 Admin phase 之設計提示；本 phase **不**啟動 Admin selector implementation。

### 12.3 Admin Apply / middleware / admin-write-cli 仍 dormant

- Admin Apply / middleware write / admin-write-cli 維持 dormant；本 phase 不啟動、不規劃啟動。selector（read / 顯示）與 write（Apply / 寫回 frontmatter）為兩獨立維度；write 維度紅線更嚴，須另行 user 授權。

---

## 13. Security / Privacy / Commercial Risk

| 風險類別 | 具體風險 | 緩解（本 phase enforced / C9 contract 凍結）|
| --- | --- | --- |
| internalLabel 洩漏前台 | `labelOverride` == internalLabel → 內部識別外顯至前台 / SEO / Blogger / FB | C9 leak-equality warning 提早提示；renderer 層 internalLabel 禁前台（night-18 §9.3）|
| validator log 反成洩漏管道 | C9 message 若 echo internalLabel 原值 → log / 截圖 / 貼 debug 時洩漏 | **C9 message 絕不 echo internalLabel / labelOverride 值**；只報欄位名 + ref machine key + 風險類型（mirror C6 不 echo url）|
| 真實 affiliate URL / token 洩漏 | fixture / sample / docs 誤放真實商業連結 | 本 doc 不放任一真實 URL / token / tracking id / merchant id；未來 fixture 用 RFC 2606 reserved + fixture-namespaced key |
| sensitive internalLabel 誤放 fixture | fixture 之 internalLabel 寫成像真實內部代號 | fixture internalLabel 用無意義 namespaced 字串（§9.2）；不示範真實內部命名 |
| respondent / download private data 混入 commerce registry | 跨 registry 污染 | commerce registry 不含 respondent data / download direct URL / Google Form id（CLAUDE.md §3 commerce 治理紅線；registry-seed governance §4.1）|
| pattern-based 推斷 | heuristic trigger（候選 E）讀 label 內容推斷 | ❌ 否決候選 E；C9 採明示 exact-match，不自動推斷（CLAUDE.md commerce 紅線「所有 key 由作者明示」）|

> 共同原則：任何進 repo（commit）之 registry / fixture / sample / validator message 內容皆視為公開；商業 / 隱私 / 內部識別敏感字串一律不進 repo、不進 validator log。

---

## 14. Future Phase Ladder

未來若要推進 C9（**本輪不執行任一階**），建議安全階梯（對齊 registry-seed governance §13 之 L2..L7；每階須**獨立 user approval**，不得自動跨階；deploy / Blogger repost / GA4 / reverse UTM / pm-26 在任何階皆須 user 另行明確批准）：

| 階 | 名稱 | 範圍 | 紅線 |
| --- | --- | --- | --- |
| 1（本檔 = L2）| C9 standalone contract preanalysis（docs-only）| 凍結 C9 rule id / trigger（leak-equality）/ message（不 echo）/ field scope / cascade / fixture shape | 不 source / 不 fixture / 不 seed |
| 2 | C9 contract acceptance（read-only）| 核對本檔 §5 / §6 / §7 / §10 與既有 `validateCommerceRefs`（C8 獨立 pass）/ registry schema / am-7 §4.4 一致 | 不寫檔 |
| 3 | seed governance 下一步（L3 sample design / L4 Option D overlay preflight；docs-only）| 解 C9 / C4 共同 registry coupling（提供 fixture-scoped entry 來源）| 不放真實資料；不污染 production registry |
| 4 | source preflight（docs-only）| 凍結 `buildCommerceLinkEntryMap` helper / `validateCommerceRefs` signature 擴增 / C9+C4 共同 entry-map 落點；user final-confirm leak-equality trigger | 不 source |
| 5 | source implementation | land C9（+ 可選 C4）warning-only；獨立比對；不 echo 敏感值；registry gate | 不 deploy / 不 Blogger / 不 GA4 |
| 6 | fixture / smoke test | Option D overlay settings fixture（含 internalLabel entry）+ post `labelOverride==internalLabel`；驗 C9 觸發；驗 message 不含 internalLabel 值 | no commit of 敏感資料；fixture-namespaced + reserved |
| 7 | Admin / renderer | Admin selector（read；填 displayLabel 不填 internalLabel）+ renderer internalLabel 禁前台 | write 維度另行授權；不 deploy |

> 注意：C9 與 C4 共享「registry entry map」需求（§10.4）→ 第 4 / 5 階宜將 C9 + C4 視為**同一 coupled source phase**，避免兩度改 `validateCommerceRefs` signature。

---

## 15. Final Recommendation

### 15.1 本階段 single conclusion

> **本 phase 為 docs-only C9 standalone contract preanalysis（registry-seed governance §13 ladder L2）。C9 rule contract 凍結為：`commerce-ref-display-override-risk`、warning-only、針對 post `affiliate.links[i].labelOverride`、trigger = leak-equality（labelOverride trim == 命中 registry entry 之 internalLabel trim）、message 絕不 echo internalLabel / labelOverride 值、與 C1..C8 orthogonal、不對 ref-not-found entry 比對、不改 renderer。C9 同 C4 為 registry-coupled，被 empty registry + Option D fixture lock 雙重 block；C9 source 不在本階段 implement。下一階段應為 read-only acceptance cross-check 或 Final Idle Freeze。**

### 15.2 明確不建議

- ❌ **不**建議在本輪或下一輪直接 implement C9 source（registry coupling 未解 + trigger 未 user final-confirm + dead source 風險）。
- ❌ **不**建議直接 seed production registry（違反 R1-clean / am-2 Option D lock；C9 fixture 須走 Option D overlay 或 Option G real）。
- ❌ **不**建議採 divergence 型 trigger（A / B / D）或 heuristic（E）（誤報 / 違反 am-7 §4.4 / 違反不自動推斷紅線）。
- ❌ **不**建議 deploy / Blogger repost / GA4 / reverse UTM activation / pm-26 unblock / Admin Apply / middleware / admin-write-cli / download renderer / landing implementation。

### 15.3 本階段結束後預設狀態

- HEAD 前進 1 commit（`docs(commerce): plan C9 display override risk`）。
- working tree clean；ahead/behind = 0/0（push 後）。
- `npm run validate:content` 維持 **0 errors / 69 warnings / 59 posts**。
- commerce content-reference source / fixtures landed 範圍不變（C1 / C2 / C3 / C5 / C6 / C8）。
- commerce + download registries 維持 empty `[]`。
- C4（plan）/ C7 / C9 source 與 fixture 仍未 implement。
- download landing real-path / Admin / renderer / build / deploy / Blogger repost / GA4 / reverse UTM / pm-26 全部 dormant / BLOCKED。

### 15.4 不自動推進下一階段

- ❌ 本 phase 結束後**不**自動啟動 acceptance / Final Idle Freeze / seed governance 下一步 / C9 / C4 source / fixture / sample 建檔 / Admin / renderer。
- 必須等待 user 明確授權。

---

## Appendix A — Cross-reference index

| 主題 | 文件 / commit |
| --- | --- |
| commerce content-reference validation preanalysis（C1..C9 contract + §4.4 labelOverride + §5.1 / §5.8 C9）| `docs/20260604-commerce-links-content-reference-validation-preanalysis.md` |
| commerce registry-level validator preanalysis（night-22；V14 internalLabel 洩漏防護）| `docs/20260603-commerce-links-validator-preanalysis.md` |
| commerce registry schema decision（night-18；internalLabel / displayLabel 欄位 + §9.3 internalLabel 禁前台）| `docs/20260603-commerce-affiliate-link-registry-schema-decision.md` |
| commerce C4 inactive ref preanalysis（registry coupling 同型）| `docs/20260608-commerce-c4-inactive-ref-validation-preanalysis.md`（commit `8c9fddf`）|
| commerce C8 invalid role preanalysis（doc 格式 mirror + 獨立 pass precedent）| `docs/20260608-commerce-c8-invalid-role-preanalysis.md`（source `57c983b` / fixture `bb33523`）|
| registry seed governance preanalysis（§9 C9 雙重 block + §13 ladder L2）| `docs/20260608-registry-seed-governance-preanalysis.md`（commit `bc744d4`）|
| commerce renderer fallback contract preanalysis | `docs/20260607-commerce-renderer-fallback-contract-preanalysis.md` |
| commerce content-ref validator current source（C1 / C2 / C3 / C5 / C6 / C8）| `src/scripts/validate-content.js:586`（`validateCommerceRefs`）/ `:388`（`buildCommerceLinkIdSet`）/ C6 不 echo url 先例 `:642` |
| CLAUDE.md commerce 區塊 + 治理紅線 | `CLAUDE.md` §3（commerce-links registry governance）+ §12（affiliate.links schema）+ §16（連結處理）|

---

## Appendix B — Baseline snapshot

```
date: 2026-06-08 12:06 +0800
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: bc744d4d4a38c9e2520331946472a1aac18071c4
origin/main: bc744d4d4a38c9e2520331946472a1aac18071c4
ahead/behind: 0/0
working tree: clean
latest subject: docs(registry): plan seed governance
validate: 0 errors / 69 warnings / 59 posts

commerce content-reference rules landed: C1 / C2 / C3 / C5 / C6 / C8
commerce content-reference rules: C4 docs-only plan landed (source blocked); C7 not recommended; C9 standalone contract = THIS doc (source not implemented)
commerce content-reference fixtures landed: 6 (C1 / C2 / C3 / C5 / C6 / C8)
commerce registry: empty []
commerce production ref usage: 0 / role usage: 0 / labelOverride usage: 0
registry schema internalLabel / displayLabel: frozen (night-18) but 0 entries (empty registry)
commerce renderer / Admin / build / deploy / Blogger repost / GA4: dormant
reverse UTM activation: dormant (pm-24 source landed; un-deployed)
pm-26: BLOCKED
Admin Apply / middleware write / admin-write-cli: dormant
```

---

## Appendix C — C9 rule contract quick card

```
candidate rule id: commerce-ref-display-override-risk
severity:          warning
target:            post-level affiliate.links[i].labelOverride
sourcePath:        post .md path
trigger (leak-equality, recommended):
                   labelOverride is non-empty string
                   && ref is non-empty trimmed string && ref 命中 registry
                   && entry.internalLabel is non-empty string
                   && labelOverride.trim() === entry.internalLabel.trim()  (case-sensitive)
rejected triggers: A (≠displayLabel) / B (≠internalLabel) / C (override+ref exists)
                   / D (≠canonical) / E (heuristic merchant)  —— 全誤報 / 違反 am-7 §4.4 / 違反不自動推斷
missing labelOverride: 不觸發
ref not-found:     不比對（避免 cascade noise；registry gate，mirror C4）
entry no internalLabel: 不觸發
non-string labelOverride: 不觸發（非 hard error）
message:           affiliate.links[<i>].labelOverride matches registry internalLabel for ref="<ref>"
                   (possible internal-identifier leak; use displayLabel or a public CTA)
                   ⚠️ 絕不 echo internalLabel / labelOverride 值（mirror C6 不 echo url，:642）
cascade:           與 C1..C8 orthogonal；同一 entry 可與 C4 / C5 / C6 / C8 共存
registry coupling: 需 entry.internalLabel（同 C4）；empty registry → 0 觸發 = dead source
helper (future):   buildCommerceLinkEntryMap (ref→entry Map)；與 C4 共用；擴增 validateCommerceRefs signature
empty registry:    0 觸發
0 labelOverride usage: 0 觸發
fixture:           須 Option D overlay 或 Option G real entry（registry 不污染）；fixture-namespaced + RFC 2606 reserved
status:            standalone contract frozen (docs-only)；source not implemented
blocker:           registry coupling（同 C4，empty registry + Option D fixture lock）+ trigger user final-confirm
recommendation:    本 phase 後 read-only acceptance 或 Final Idle Freeze；不直接 source / 不 seed / 不 deploy
```

---

（本文件結束）
