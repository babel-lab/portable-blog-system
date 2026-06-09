# 2026-06-09 Commerce C9 labelOverride Safety — Broader Preanalysis (docs-only)

Phase name: `20260609-am-4-commerce-c9-label-override-safety-preanalysis-docs-only-a`
Date: 2026-06-09
Mode: **docs-only**（new docs file only；no source / no fixture / no settings registry seed / no content / no templates / no views / no package / no CLAUDE.md / no MEMORY mutation；no build / no deploy / no Blogger repost / no GA4 validation；no Admin Apply / middleware write / admin-write-cli activation；no reverse UTM activation；no pm-26 unblock；no L1 seed）

> ⚠️ 本文件**僅含 placeholder / 概念描述**；**不含**任何真實 affiliate URL、tracking id、sid、aff_id、merchant id、token、credential、Google Form ID、respondent data、commission-sensitive data。本檔之所有 URL / label / token 範例均為純 `example.com` / `example.org` 系列之 RFC 2606 reserved namespace placeholder。

---

## 1. Executive Summary

### 1.1 本輪性質

C9（commerce `labelOverride` 安全規則）**是治理/安全規則，不是連結替換功能**。其目標是避免作者在文章 `affiliate.links[].labelOverride` 直接使用、複製或夾帶 registry 內部欄位（`internalLabel`）、追蹤識別、私人備註或 `targetUrl` 等內部資訊。

本輪 phase 為 **docs-only broader preanalysis**：在現有 narrow C9（leak-equality，per `docs/20260608-commerce-c9-display-override-risk-preanalysis.md`）之上，分析是否應**擴大** C9 涵蓋面（URL leak / tracking-like token detection），並評估擴大之風險、誤報率、fixture 可行性。**本輪不實作任何 source、不加 fixture、不動 registry、不改 production content。**

### 1.2 一句話結論

> **推薦 Option D（不擴大 C9；維持現有 narrow leak-equality 不動；持續仰賴 Admin snippet helper §7 之 author-controlled-only 邊界）；如果未來真要擴大，須先有獨立 expansion preanalysis、獨立 fixture phase、獨立 acceptance phase；本輪 baseline 維持 0/69/59（normal）+ 0/70/59（overlay）不變。**

### 1.3 推薦理由摘要

- 現有 narrow C9（labelOverride === registry.internalLabel）已 landed at `src/scripts/validate-content.js:761-783`，且 message **絕不** echo 敏感值（per `docs/20260608-commerce-c9-display-override-risk-preanalysis.md` §7 / §10）。此設計 false-positive 最低，已覆蓋「複製 internalLabel」此最常見洩漏路徑。
- 擴大為 substring / heuristic（Option B / C）將引入高誤報率：`labelOverride` 之**正常設計用途**是「博客來」「蝦皮」「官方網站」等短公開字串，這些字串本身可能與 registry `internalLabel` 部分重疊，或無意間命中 token-like pattern（例如 hex/uuid-like 字段在書目 ISBN / 圖書館 ID 之偽陽性）。
- Empty registry + production 0 篇用 `ref` / 0 篇用 `labelOverride` → 任何 C9 擴大規則對 production 0 觸發；擴大 = 純增加 fixture / overlay 維護負擔而無 production yield。
- Admin snippet helper 已實作 §7 邊界（per `docs/20260608-commerce-admin-snippet-helper-acceptance-checkpoint.md` §7 / §8）：`labelOverride` 預設 empty / never auto-filled from `internalLabel` or `targetUrl` / never written back to registry。從**生成端**已截斷洩漏路徑，再加 validator 層擴大檢查屬重複保險。
- C7（missing-role）NO-GO 結論不變；本 phase 不解除 C7 NO-GO；不改變 L1 seed blocker；不啟動 renderer / Admin write path / reverse UTM。

---

## 2. Current Baseline

### 2.1 git / validate baseline（本 phase 開始時）

```
repo: D:\github\blog-new\portable-blog-system
branch: main
HEAD: ff2972e0d15a7ad536016b20cceddb9ef2bba3c0
origin/main: ff2972e0d15a7ad536016b20cceddb9ef2bba3c0
ahead/behind: 0/0
working tree: clean
latest subject: docs(index): sync current baseline and commerce docs
npm run validate:content: 0 errors / 69 warnings / 59 posts
overlay (commerce-c4-c9-overlay.json): 0 errors / 70 warnings / 59 posts
```

### 2.2 commerce content-reference 已 landed 範圍

- ✅ C1 `commerce-ref-invalid-type`
- ✅ C2 `commerce-ref-empty`
- ✅ C3 `commerce-ref-not-found`
- ✅ C4 `commerce-ref-inactive`（registry-coupled；L5b 已 landed）
- ✅ C5 `commerce-ref-duplicate-in-post`
- ✅ C6 `commerce-ref-direct-url-coexist`
- ✅ C8 `commerce-ref-invalid-role`
- ✅ **C9 `commerce-ref-display-override-risk` (narrow leak-equality only)** — per `validate-content.js:761-783`；trigger = `labelOverride.trim() === entry.internalLabel.trim()`；warning-only；不 echo 敏感值。
- ❌ C7 `commerce-ref-missing-role`：**deferred / NO-GO**（per CLAUDE.md commerce-links 段落）

### 2.3 registry / production 狀態

- `content/settings/commerce-links.json` 為 empty registry（`commerceLinks: []`）。
- production 0 篇使用 `affiliate.links[].ref`。
- production 0 篇使用 `labelOverride`。
- production 0 篇使用 `assetRefs[]` / `formRef`。
- L1 seed 仍 blocked（待 user 提供 `commerceSeedCandidates:` YAML，per `docs/20260608-commerce-l1-seed-candidate-intake-template.md` §3 / §8）。

### 2.4 Admin snippet helper 邊界（已 landed）

per `docs/20260608-commerce-admin-snippet-helper-acceptance-checkpoint.md` §7 / §8：

- `labelOverride` author-controlled only；default empty；**never auto-filled from `internalLabel`**；**never auto-filled from `displayLabel`**；**never written back** to registry。
- snippet UI 不輸出 `targetUrl` / `internalLabel` / `networkKey` / `merchantKey` / token / credential。
- snippet 對 server / file system / registry **零副作用**。

---

## 3. Existing Contract References

下列為本 broader preanalysis 之 ground truth；本輪不修改之：

| 來源 | 範疇 | 引用語意 |
|---|---|---|
| `CLAUDE.md` §3.1 commerce-links | empty registry 治理 + C9 narrow rule 段落 | 紅線：不放 credential / token / dashboard 統計；fixture 不修 production `affiliate-networks.json` |
| `CLAUDE.md` §16 link rules | 連結處理 | 站內不加 UTM；外連 nofollow；affiliate 加 sponsored |
| `docs/20260608-commerce-c9-display-override-risk-preanalysis.md` | narrow C9 contract | rule id `commerce-ref-display-override-risk`；warning-only；leak-equality only；不 echo 敏感值 |
| `docs/20260608-commerce-admin-snippet-helper-acceptance-checkpoint.md` §7 / §8 | snippet 邊界 | `labelOverride` author-controlled；never auto-fill 自 `internalLabel` / `displayLabel`；snippet 零副作用 |
| `docs/20260608-commerce-l1-seed-candidate-intake-template.md` §4.2 / §6 | seed 候選欄位 / safe URL policy | `displayLabel` = safe public label；`internalLabel` = sensitive；URL 不含 tracking |
| `docs/20260608-commerce-registry-seed-governance-preanalysis.md` §6 / §13 | label policy + 紅線 | `displayLabel` 可顯示；`internalLabel` 不可顯示；token / tracking 永不入 repo |
| `docs/20260608-project-wide-status-checkpoint.md` §3 / §10 | commerce 狀態 + 紅線 | L1 seed blocked；C7 NO-GO；不自動生成假 seed |
| C8 role enum（已 landed） | `primary` / `alternate` / `official` / `price-check` / `library` / `direct` | role 為 recommended-but-optional；lowercase kebab-case |

---

## 4. Problem Definition

### 4.1 為什麼需要 broader C9 安全分析

current narrow C9（leak-equality）只攔截「`labelOverride` **完全等於** `internalLabel`」這一條洩漏路徑。但治理上仍有其他可能的洩漏路徑：

1. **substring leak**：`labelOverride = "金石堂 - internal-aff-channel-3"`（前段公開 + 後段內部代號黏在一起）。
2. **URL leak**：`labelOverride = "https://merchant.example.com/path?aff_id=XXX&sid=YYY"`（作者誤把追蹤 URL 當顯示文字）。
3. **token-like leak**：`labelOverride = "abc123def456ghi789"`（hex / base64-like / uuid-like 字串，疑似 token / session id）。
4. **targetUrl partial leak**：`labelOverride = "merchant.example.com/aff/XXX"`（targetUrl 的可識別片段）。
5. **internalLabel 變形**：`labelOverride` 為 `internalLabel` 之大小寫變體 / 加空格 / 加標點。

### 4.2 治理風險分級（從現有來源觀察）

- **internalLabel exact match**（narrow C9 已覆蓋）：高風險；直接複製內部代號到前台。**已有 source 攔截。**
- **URL leak**：中風險；URL 本身屬 public outbound（per `docs/20260608-commerce-registry-seed-governance-preanalysis.md` §7.1）但出現在 `labelOverride` 屬「誤用欄位」；外觀上對讀者不友善，但**非 secret 洩漏**。
- **token-like leak**：低～中風險；難以區分「token」與「正常 ISBN / 圖書館 ID / 書名數字」；heuristic 易誤報。
- **substring / 變形**：低風險；但邊界模糊，誤報率高（短公開字串如「博客來」可能與 internalLabel 部分重疊）。

### 4.3 C9 設計約束（不可違反）

- **warning-only**（per `docs/20260608-commerce-c9-display-override-risk-preanalysis.md` §1.2）：不阻擋內容驗證；不阻擋 build / deploy。
- **不 echo 敏感值**（per 同 §7 / §10）：C9 message 絕不輸出 `internalLabel` / `labelOverride` / `targetUrl` 原值；只報欄位名 + ref machine key + 風險類型。
- **不自動改文**：不修改 `labelOverride`；不修改 registry；不自動 fallback 至 `displayLabel`。
- **不 heuristic merchant / product 推斷**（per CLAUDE.md §3.1 紅線）：不從 URL pattern 猜 `merchantKey` / `networkKey` / `linkId`。
- **不影響正常作者用法**：作者填「博客來」「蝦皮」「官方網站」「Buy on Publisher Site」等短公開字串應**完全不觸發**任何 C9 規則。

---

## 5. Candidate C9 Rule Semantics（Options A / B / C / D）

下列四 option 為「擴大或維持現有 C9」之決策樹。**Option A 為現狀（已 landed）**；Option B / C 為擴大方向；Option D = 維持現狀 + 不擴大。

### 5.1 Option A — narrow leak-equality only（現狀 / 已 landed）

**Trigger**：post `labelOverride.trim() === registry entry.internalLabel.trim()`（case-sensitive exact，mirror C5 / C8）。

**Source 狀態**：✅ **已 landed** at `src/scripts/validate-content.js:761-783`。

**優點**：
- false-positive 最低（exact equality）。
- 不 echo 敏感值；message 只報欄位名 + ref machine key。
- 與正常作者短字串用法不衝突（「博客來」≠ `internalLabel` 之機率極高）。
- 與 C1..C8 全 orthogonal；不遮蔽既有 rule。

**缺點**：
- 不覆蓋 substring leak（`internalLabel` 嵌在 `labelOverride` 中間）。
- 不覆蓋 URL leak / token-like leak。
- 對「作者拷貝 `internalLabel` 然後加幾個空格 / 加標點」之變形版本不觸發。

**誤報風險**：極低（exact 匹配）。

**fixture 需求**：1 個 overlay registry + 1 個 post-level fixture（已配置於 `commerce-c4-c9-overlay.json` + 既有 overlay baseline 0/70/59 中之 +1 warning）。

**registry coupling**：需 registry entry 有 `internalLabel` 才能觸發。

---

### 5.2 Option B — URL / tracking-like token detection only

**Trigger**：post `labelOverride` 滿足以下任一 pattern → warning：

- 含 URL 字元組合（如 `^https?://` 開頭、含 `://`、含 `www.` 開頭、含 `.com/` / `.org/` / `.net/` 子字串）。
- 含 affiliate tracking 參數樣式（如 `?aff_id=` / `?sid=` / `?utm_` / `&aff_id=` / `&sid=` / `/aff/` / `/track/`）。
- 含 token-like 連續字串（如 ≥16 字元連續 hex / base64-like）。
- 含 URL shortener domain（如 `bit.ly` / `lihi.cc` / `pse.is` / `t.co` / `goo.gl`）。

**Source 狀態**：❌ 未實作。

**優點**：
- 覆蓋「作者把追蹤 URL 當顯示文字」之高風險誤用。
- 不需 registry entry 即可觸發（registry-decoupled）；無 empty registry block 問題。
- 對 narrow C9 漏掉的 URL leak 路徑補洞。

**缺點**：
- **高誤報風險**：
  - 「`example.com/product/123` 上有特價」這類書名 / 描述可能命中 `.com/`。
  - 書名含長 ISBN（13 字元）+ 圖書館 ID（5–10 字元）拼接可能命中 token-like 條件（雖然 16 字元 threshold 較保守）。
  - 圖書館 catalogue ID 等公開機器鍵可能被誤判為 token。
- heuristic 設計需獨立 preanalysis：threshold（多少字元算 token？）、character class（hex-only？base64？）、whitelist domain（哪些 domain 不算 URL leak？）。
- C9 既有設計約束「不 heuristic merchant 推斷」可能被擴大解釋為「不 heuristic URL 偵測」（需澄清邊界）。
- fixture 需求：多個 post-level fixture（URL leak / token-like / shortener / tracking 參數 各一），無需 overlay registry。

**誤報風險**：中～高（取決於 heuristic 嚴格度）。

**fixture 需求**：4–6 個 post-level fixture（無需 overlay；registry-decoupled）。

**registry coupling**：無（純 post-side heuristic）。

---

### 5.3 Option C — combined（A + B）

**Trigger**：A 條件 OR B 條件任一命中 → warning。

**Source 狀態**：❌ 未實作。

**優點**：
- 覆蓋面最廣（leak-equality + URL leak + token-like）。
- 對「作者複製 internalLabel」+「作者貼追蹤 URL」雙路徑同時防護。

**缺點**：
- 集 Option A + Option B 之**全部誤報風險**。
- rule id 命名複雜：應仍用單一 `commerce-ref-display-override-risk` 但 message 區分子類型？還是拆 `commerce-ref-display-override-equality` + `commerce-ref-display-override-url-leak` + `commerce-ref-display-override-token-like`？需獨立 naming preanalysis。
- 共用同一 rule id 會讓 fixture / acceptance 難以精準對應；拆 rule id 又增加 5+ 條 warning id，違反「最小擴張」原則。
- 兩段觸發語意混在一條 rule 內，message 設計困難（既要不 echo 敏感值，又要區分子類型）。

**誤報風險**：高（疊加 A + B 風險）。

**fixture 需求**：1 overlay + 4–6 post-level fixture（A 部分 + B 部分各一套）。

**registry coupling**：部分（A 部分需 registry；B 部分 registry-decoupled）。

---

### 5.4 Option D — 維持現狀 / 不擴大；仰賴 Admin helper §7 邊界

**Trigger**：維持 Option A narrow leak-equality；不擴大。

**Source 狀態**：✅ Option A 部分已 landed；不再加 source。

**優點**：
- 零新增 source / fixture 維護負擔。
- 零誤報新增。
- Admin snippet helper §7 已從**生成端**截斷洩漏：`labelOverride` default empty / never auto-filled from `internalLabel` / `displayLabel`；作者要洩漏需主動手動複製 `internalLabel`。narrow C9 已攔此路徑。
- URL leak / token-like leak 屬「作者誤用顯示欄位」之 UX 問題，更適合：
  - Admin UI 端「貼上即時驗證」（client-side warning，非 validator）。
  - 文件 / 教育（per L1 intake template §6 safe URL policy 之延伸）。
  - 而非 validator 層 heuristic。
- 對 production 0 觸發（empty registry + 0 `labelOverride`）；不擴大 = 不浪費 fixture cadence。
- C7 NO-GO / L1 seed blocker 不變。

**缺點**：
- 未覆蓋 URL leak / token-like leak 路徑。
- 仰賴 Admin helper 邊界「永不被改」假設（未來若 helper 加 auto-fill 功能會破洞）。

**誤報風險**：零（不擴大）。

**fixture 需求**：零（不擴大）。

**registry coupling**：保持 Option A 之 registry-coupled 特性。

---

### 5.5 Option 比較表

| 維度 | A（現狀） | B（URL/token） | C（combined） | D（不擴大） |
|---|---|---|---|---|
| source 狀態 | ✅ landed | ❌ | ❌ | ✅ A landed；不再加 |
| 覆蓋 internalLabel exact leak | ✅ | ❌ | ✅ | ✅ |
| 覆蓋 URL leak in labelOverride | ❌ | ✅ | ✅ | ❌ |
| 覆蓋 token-like leak | ❌ | ✅ | ✅ | ❌ |
| 覆蓋 substring / 變形 | ❌ | 部分 | 部分 | ❌ |
| false-positive 風險 | 極低 | 中～高 | 高 | 零 |
| registry coupling | 需 | 不需 | 部分需 | 需（A 部分） |
| 需 overlay registry fixture | 是 | 否 | 是 | 是（既有） |
| 需 post-level fixture | 1 | 4–6 | 5–7 | 既有 |
| baseline impact（normal） | +0 | +0（empty registry） | +0 | +0 |
| baseline impact（overlay） | +1（已含） | +N（新 fixture） | +1+N | +0 |
| 與 C7 NO-GO 衝突 | 否 | 否 | 否 | 否 |
| heuristic 風險 | 無 | 是 | 是 | 無 |
| 違反「不 heuristic 推斷」紅線? | 否 | 邊界模糊 | 邊界模糊 | 否 |

---

## 6. Recommended C9 Path

### 6.1 推薦：Option D（不擴大；維持現有 narrow leak-equality）

理由：

1. **narrow C9 已從最危險路徑攔截**：複製 `internalLabel` 到 `labelOverride` 屬最直接、最高風險之洩漏路徑；該路徑已被 source 攔截，且 message 不 echo 敏感值。
2. **生成端已截斷**：Admin snippet helper §7 / §8 邊界明示 `labelOverride` 永不從 `internalLabel` / `displayLabel` auto-fill。作者要走 narrow C9 攔截範圍外的路徑需「明知故犯」程度的手動誤用。
3. **production 收益 = 0**：empty registry + 0 篇 `labelOverride` → 擴大 C9 對 production validation count 零影響；增加 source = 純增加 dead-code 維護負擔。
4. **誤報成本高**：Option B / C 之 heuristic 易誤報「博客來」「蝦皮」「圖書館 ID」等正常用法；validator log 之 noise floor 一旦上升，會稀釋 warning 之 actionability。
5. **不破壞 C7 NO-GO**：Option D 不改變 role 規則；不解除 C7；不啟動 renderer / Admin write / L1 seed。
6. **保留 escape hatch**：若未來 production 真出現 URL leak / token-like leak 之**真實**案例（從 Admin preview 或 build 報告觀察），可再開獨立 expansion preanalysis 處理；非預先 over-engineering。

### 6.2 保守原則（即使未來考慮擴大）

若未來某次 user 明確 prompt 擴大 C9（極不推薦），仍須遵守：

- ❌ **不**強制 `labelOverride` 必填（保持 optional）。
- ❌ **不**改變 C7 NO-GO 結論。
- ❌ **不**阻擋正常作者自訂短文字（「博客來」「蝦皮」「官方網站」「Buy on Publisher Site」等）。
- ❌ **不**在沒有真實 seed 或 overlay fixture 機制前強推 production 規則。
- ❌ **不**改 C9 為 error 級別（永遠 warning-only）。
- ❌ **不**讓 C9 message echo 任何 `internalLabel` / `labelOverride` / `targetUrl` 原值。
- ❌ **不**用 URL pattern 推斷 `merchantKey` / `networkKey` / `linkId`（per CLAUDE.md §3.1 紅線）。
- ✅ **需**獨立 source phase（不混 fixture / acceptance）。
- ✅ **需**獨立 fixture phase（Option B / C 需 4–6 個新 fixture）。
- ✅ **需**獨立 acceptance phase（per phase ladder 規律）。
- ✅ **需** docs-only naming preanalysis（rule id 拆 vs 合）。

---

## 7. Interaction with Existing Rules

### 7.1 與 C1..C8 / C4 之 orthogonality 表

| Rule | C9（current narrow A） | C9 expansion (B/C) 假設 |
|---|---|---|
| C1 `commerce-ref-invalid-type` | orthogonal（C9 需 ref 為 string；C1 在前 continue） | orthogonal |
| C2 `commerce-ref-empty` | orthogonal（C9 需 ref trim 非空；C2 在前 continue） | orthogonal |
| C3 `commerce-ref-not-found` | **互斥**（C9 需 ref 命中 registry；C3 觸發即 continue） | A 部分互斥；B 部分**可共存**（registry-decoupled） |
| C4 `commerce-ref-inactive` | **可共存**（C4 + C9 同 ref 命中 registry，inactive entry 也可能有 internalLabel）；warning-only 不互斥 | 同 A 部分；B 部分與 C4 完全 orthogonal |
| C5 `commerce-ref-duplicate-in-post` | orthogonal（C5 在 ref 字串層去重；C9 在 ref→entry 比對層） | orthogonal |
| C6 `commerce-ref-direct-url-coexist` | orthogonal（C6 偵測同筆 ref+url 共存；C9 偵測 labelOverride 與 internalLabel） | orthogonal |
| C7 `commerce-ref-missing-role` | N/A（C7 deferred / NO-GO） | N/A |
| C8 `commerce-ref-invalid-role` | orthogonal（C8 在 role 欄位；C9 在 labelOverride 欄位） | orthogonal |

### 7.2 與 registry-level R 規則之 orthogonality

- R8 `commerce-link-internal-label-missing` / R9 `commerce-link-internal-label-empty`：在 registry-side 檢查 `internalLabel` 形狀；與 C9 post-side 檢查 `labelOverride` 為兩維度，orthogonal。
- R11 `commerce-link-network-key-invalid`：與 C9 無關。
- R12 / R13 / R14 replacement chain：與 C9 無關。

### 7.3 C9 擴大不應遮蔽既有 rule

- Option B / C 不得在 C3（not-found）觸發時跳過 C9-B 之 URL leak 檢查（registry-decoupled 部分可單獨觸發）；但若 ref 為空（C2）/ ref 非字串（C1），則 C9 整體不觸發。
- Option B / C 不得改變 C4 / C5 / C6 / C8 之 trigger 條件或 message。

---

## 8. Fixture / Overlay Strategy

### 8.1 本輪不建立 fixture

- ❌ 不新增 post-level fixture（`content/validation-fixtures/blogger/posts/_test-commerce-ref-*.md`）。
- ❌ 不修改既有 overlay（`content/validation-fixtures/settings/commerce-c4-c9-overlay.json`）。
- ❌ 不新增其他 settings-level overlay。

### 8.2 未來擴大 C9 之 fixture 評估（不啟動）

| Option | overlay registry 需求 | post-level fixture 需求 |
|---|---|---|
| A（現狀） | ✅ 既有 `commerce-c4-c9-overlay.json` 已含；不需新增 | ✅ 既有；不需新增 |
| B（URL/token） | ❌ 不需（registry-decoupled） | 4–6 個新 fixture（URL leak / token-like / shortener / tracking 各一） |
| C（combined） | ✅ 既有；不需新增 | A 既有 + B 新 4–6 個 |
| D（不擴大） | ✅ 既有；不需新增 | ✅ 既有；不需新增 |

### 8.3 紅線（即使未來建 fixture）

- ❌ 不在 production `commerce-links.json` 注入假 entry（mirror C4 / C9 既有 Option D fixture lock）。
- ❌ 不在 fixture 中放真實 affiliate token / tracking id / merchant id / OAuth secret。
- ❌ overlay registry 必須採 `example.com` / `example.org` / `example.invalid` 等 RFC 2606 reserved namespace。
- ❌ 不修改 production `affiliate-networks.json` 為 fixture 配套（per CLAUDE.md §3.1 紅線）。

### 8.4 不需 overlay 才能測試之路徑（若 Option B/C）

Option B / C 之 URL leak / token-like 部分為 registry-decoupled，**理論上**只需 post-level fixture（無需 overlay）。但與既有 overlay 配置維持一致（`commerce-c4-c9-overlay.json` 已存在）較佳；新增 fixture 屬未來 phase 範圍。

---

## 9. Expected Baseline Impact

### 9.1 本 docs-only phase 預期

| 指令 | 預期 |
|---|---|
| `npm run validate:content` | **0 errors / 69 warnings / 59 posts**（不變） |
| `node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json` | **0 errors / 70 warnings / 59 posts**（不變） |
| `git diff --stat` | 僅本新增之 `docs/20260609-commerce-c9-label-override-safety-preanalysis.md` |
| `git diff --check` | clean |
| working tree | clean（commit 後） |

### 9.2 未來若 Option B/C 實作之 baseline 估算（不啟動）

- normal: production 0 篇 `labelOverride` → +0 production warning；fixture 數量決定 fixture warnings 增量（預估 +4 ~ +6）。
- overlay: 同上（registry-decoupled 部分不需 overlay）。
- 若 Option B/C 真要落地，須在獨立 expansion preanalysis 中精算 baseline delta，並在 acceptance phase 重新凍結 baseline 數值。

### 9.3 Option D（推薦）之 baseline 估算

- normal / overlay 維持 0/69/59 + 0/70/59；無 baseline delta。

---

## 10. Non-goals / Red Lines

本 phase **嚴格禁止**下列動作。任一動作之啟動均須**獨立 phase + explicit user prompt**：

- ❌ **no source implementation**（不改 `src/scripts/validate-content.js`；不擴大 C9；不修改 narrow C9）。
- ❌ **no fixture**（不新增 post-level `_test-commerce-ref-*.md`；不修改 `commerce-c4-c9-overlay.json`；不新增其他 overlay）。
- ❌ **no registry seed**（`content/settings/commerce-links.json` 維持 empty `[]`；不 promote `_sample.commerce-links.json`）。
- ❌ **no sample promotion**（不修改 `_sample.commerce-links.json`；不引入 sample-derived seed）。
- ❌ **no production migration**（不批量改 production post；不把 raw `url` 改 `ref`；不加 `labelOverride` 至既有 post）。
- ❌ **no renderer activation**（commerce / download renderer 維持 dormant；不啟用 `targetUrl` 消耗）。
- ❌ **no Admin Apply / middleware / admin-write-cli**（write path 全 dormant）。
- ❌ **no build**（不執行 `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`）。
- ❌ **no deploy**（不動 `gh-pages` / `dist*/`）。
- ❌ **no Blogger repost**（不重貼 Blogger 後台）。
- ❌ **no GA4 validation**（不開 GA4 DebugView / Realtime）。
- ❌ **no reverse UTM activation**（pm-24 source 維持 dormant；不啟動 reverse UTM 之 live state）。
- ❌ **no pm-26 unblock**（deploy gate 維持 BLOCKED）。
- ❌ **no L1 seed without user-provided `commerceSeedCandidates:` YAML**（per L1 intake template §3 / §8 / §10）。
- ❌ **no CLAUDE.md mutation**。
- ❌ **no docs/README.md mutation**。
- ❌ **no README.md mutation**。
- ❌ **no MEMORY mutation**（auto-memory 不寫入；本檔 commit 不觸發 memory write）。
- ❌ **no npm install** / **no package.json mutation** / **no lockfile mutation**。
- ❌ **no amend / rebase / force-push**（單一 commit、fast-forward only）。
- ❌ **no C9 source implementation expansion**（Option B/C 不啟動）。
- ❌ **no C4 source modification**（C4 既有 source 不動）。
- ❌ **no C7 source implementation**（C7 NO-GO 不變）。
- ❌ **no URL pattern auto-inference**（不從 URL 推 `merchantKey` / `networkKey` / `linkId`）。
- ❌ **no real affiliate URL / tracking id / sid / aff_id / merchant id / token / credential / Form ID / respondent data / 私人下載連結 / commission data** 出現在本檔。

---

## 11. Proposed Next Phases（不啟動）

下列 phase 為 **logical continuations**；本 phase 不啟動任一：

| 候選 phase | 範疇 | 啟動條件 |
|---|---|---|
| **C9 broader preanalysis acceptance read-only** | new SESSION cold-start verify baseline + cross-read 本檔 + 不寫任何檔 | user 明示 |
| **C9 expansion preanalysis（Option B / C）** | 獨立 docs-only：精算 URL leak heuristic threshold / character class / whitelist / rule id 拆 vs 合 / fixture count / baseline delta | user 明確要求擴大 C9（極不推薦，先看 Option D 收益） |
| **C9 source implementation（expansion）** | 獨立 source phase；僅在 expansion preanalysis 完成後 | expansion preanalysis accepted + user 明示 |
| **C9 fixture design（expansion）** | 獨立 docs-only：列舉 fixture 命名 / overlay vs post-level / RFC 2606 namespace | expansion source 落地後 |
| **C9 fixture implementation（expansion）** | 獨立 source phase；新增 fixture | fixture design accepted |
| **C9 CLAUDE.md / docs sync** | 將 C9 narrow + 擴大狀態同步入 CLAUDE.md commerce-links 段落（目前 CLAUDE.md 仍寫「C1/C2/C3/C5/C6 landed」，未反映 C4/C8/C9 narrow 已 landed） | 視 narrow / expansion 範圍而定 |
| **Final Idle Freeze（推薦）** | 完成本 docs-only commit 後 EXIT | 預設 |

**強推薦**：本 phase commit 完成後採 **Final Idle Freeze / EXIT**；下一 SESSION 視需要 cold-start verify baseline 即可。

---

## 12. Final Recommendation

1. **本輪不擴大 C9**——Option D（維持現有 narrow leak-equality）為最保守、最低誤報、零 fixture 維護負擔之選項。
2. **下一步建議 Final Idle Freeze / EXIT**——本 docs-only preanalysis commit 後 EXIT；不啟動 Option B / C 任何 source / fixture / overlay 工作。
3. **不擴大 ≠ 永不擴大**——若未來 production 出現真實 URL leak / token-like leak 案例（從 Admin preview / build 報告 / 作者誤用回報觀察），可再開獨立 expansion preanalysis 處理；非預先 over-engineering。
4. **C7 / Admin write / renderer / deploy / reverse UTM 全部維持 dormant**——本 phase 不解除任一 blocker。
5. **L1 seed 依然待 user 提供 `commerceSeedCandidates:` YAML**（per L1 intake template §3 / §8 / §10）；本 phase 不啟動 L1。

---

## Appendix A — Confirmed Non-actions

- ❌ no source / content / settings / fixtures / templates / views / package changes
- ❌ no README.md / CLAUDE.md / docs/README.md changes
- ❌ no MEMORY mutation
- ❌ no registry seed / sample / fixture
- ❌ no production migration
- ❌ no `npm install`
- ❌ no build / deploy
- ❌ no Blogger repost
- ❌ no GA4 validation
- ❌ no reverse UTM activation
- ❌ no pm-26 unblock
- ❌ no Admin Apply / middleware / admin-write-cli
- ❌ no C9 source implementation expansion（Option B / C 不啟動）
- ❌ no C4 / C7 source implementation
- ❌ no L1 seed
- ❌ no amend / rebase / force-push
- ❌ no real affiliate URL / tracking id / sid / aff_id / merchant id / token / credential / Form ID / respondent data / 私人下載連結 / commission data

---

*End of broader C9 labelOverride safety preanalysis.*
