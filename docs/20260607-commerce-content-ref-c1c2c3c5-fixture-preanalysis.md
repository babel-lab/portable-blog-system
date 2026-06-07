# 2026-06-07 Commerce Content-Reference C1 / C2 / C3 / C5 Fixture — Preanalysis (docs-only)

Phase name: `20260607-night-2-commerce-content-ref-c1c2c3c5-fixture-preanalysis-docs-only-a`
Date: 2026-06-07 19:45 +0800
Mode: **docs-only fixture preanalysis**（no source / no content / no settings registry mutation / no templates / no fixture creation / no loader change / no validator rule landing / no renderer / no Admin / no middleware / no build / no deploy / no Blogger repost / no GA4 / no reverse UTM activation / no pm-26 unblock / no admin-write-cli / no Admin Apply / no real affiliate link added / no registry seeding / no production content migration / no `npm install`）

---

## 0. Relation to prior phases

| 順序 | Phase / commit | 角色 |
| --- | --- | --- |
| night-19 `e40a278` | commerce affiliate link empty registry preanalysis | R1-clean 7 條件 |
| night-20 `c1a6974` | empty registry implementation（settings-only） | 新增 `content/settings/commerce-links.json` empty registry |
| night-21 `78f1e9a` | commerce-links loader exposure（source-only） | `load-settings.js` 暴露 `settings.commerceLinks = []` |
| night-22 `d5cfcd0` | commerce-links validator preanalysis（docs-only） | 凍結 registry-level R1..R15 + content-reference C1..C9 之 rule contract |
| night-25 `94a1d47` | commerce links registry-level validator source-only landing | `validate-content.js` 新增 11 條 registry-level rule |
| am-2 `89cbf75` | commerce-links registry fixture mechanism preanalysis | 凍結 fixture mechanism = Option D |
| am-7 `（per docs filename）` | commerce-links content-reference validation preanalysis | 凍結 C1..C9 content-reference rule contract |
| am-10..12 + `39b89e3` | commerce links content-reference source landing（C1 / C2 / C3 / C5） | `validate-content.js` 新增 `validateCommerceRefs` + `buildCommerceLinkIdSet`；call site post-loop 內 |
| `5b81da6` | docs(claude) sync commerce content ref validator state | CLAUDE.md commerce content-ref validator 狀態同步 |
| **night-2（本 phase）** `（本 commit）` | **commerce content-reference C1 / C2 / C3 / C5 fixture preanalysis（docs-only）** | 設計未來 fixture phase 之檔名 / frontmatter shape / 預期 warning / 預期 baseline / acceptance；**不**建立 fixture；**不**改 source / registry / content / templates |

本階段唯一目的為：

> 在 C1 / C2 / C3 / C5 source 已 landed、empty registry 維持、0 篇 production 用 `ref` 之現況下，**專注於 fixture 設計**：凍結未來 fixture phase 之檔名 convention / 最小 frontmatter / 預期觸發 warning / 預期 baseline 影響 / acceptance criteria / 紅線，使 fixture implementation phase 可直接執行。

本階段為純文件；**不**改 `src/scripts/validate-content.js`、**不**改 `src/scripts/load-settings.js`、**不**改 `content/settings/commerce-links.json`、**不**改任何 content / templates / fixtures / package。

---

## 1. Executive Summary

### 1.1 一句話結論

> **本文件只設計 fixtures，不建立 fixtures**。C1 / C2 / C3 / C5 source 已於 `39b89e3` landed，validate baseline 維持 `0 / 60 / 53`（empty registry + 0 篇 production 用 `ref`）。本文件凍結未來 fixture phase 之 4 個 post-level fixture 之檔名 / frontmatter shape / 預期 warning / 預期 baseline / acceptance criteria，為下一個 fixture implementation phase 提供可直接執行 contract。

### 1.2 本 phase 範圍

- 摘要 C1 / C2 / C3 / C5 之 source-of-truth rule id（**以 `validate-content.js` 為準**；其中 C5 之 rule id = `commerce-ref-duplicate-in-post`，**非** `commerce-ref-duplicate`）。
- 為每條 rule 設計 1 個 post-level fixture：檔名 / 最小 frontmatter / 預期 warning。
- 凍結預期 baseline：理想設計 vs empty-registry 現實設計（C5 fixture 因 empty registry 必然帶 2 × C3 not-found 衍生 warning）。
- 凍結 acceptance criteria：fixture implementation phase 之 git diff scope / 不可變動範圍。
- 凍結紅線 / non-goals。
- 提出下一階段 phase name，但**不**自動啟動。

### 1.3 本 phase 不做的事

- ❌ 不新增任何 fixture（無 `.md` / `.json`）
- ❌ 不改 `src/scripts/validate-content.js` / `src/scripts/load-settings.js` / 任一 `src/`
- ❌ 不改 `content/settings/commerce-links.json` / 任一 settings JSON
- ❌ 不改任何 production content / templates / drafts / archive
- ❌ 不改 `package.json` / `package-lock.json` / `vite.config.js`
- ❌ 不執行 `npm install` / `npm run build` / `npm run dev`
- ❌ 不 build / deploy / Blogger repost / GA4 validation
- ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate
- ❌ 不啟動 Admin Apply / middleware / admin-write-cli
- ❌ 不 seed production commerce registry
- ❌ 不自動啟動下一階段

---

## 2. Current Baseline

| 項目 | 值 |
| --- | --- |
| repo | `D:\github\blog-new\portable-blog-system` |
| branch | `main` |
| HEAD（pre-commit）| `5b81da64891fbb835e54d05490159b1c934b8515` |
| `HEAD == origin/main`（pre-commit）| yes（ahead/behind = `0 / 0`）|
| working tree（pre-commit）| clean |
| latest subject（pre-commit）| `docs(claude): sync commerce content ref validator state` |
| `npm run validate:content`（pre-commit）| **0 errors / 60 warnings / 53 posts** |
| `content/settings/commerce-links.json` | empty registry `{ schemaVersion: 1, updatedAt: "", commerceLinks: [], notes: "" }` |
| loader（`src/scripts/load-settings.js`）| `settings.commerceLinks = []`（read-only；read via `readJsonOptional`；unwrap to array）|
| registry-level validator | 11 warning-only rules landed（R3..R9 / R11..R14；R1 / R2 / R10 / R15 deferred）|
| content-reference validator | **C1 / C2 / C3 / C5** landed via `validateCommerceRefs(affiliate, sourcePath, issues, commerceLinkIdSet)`；call site post-loop 內 |
| C4 / C6 / C7 / C8 / C9 | ❌ 未啟用（per 20260604 am-7 §5.10）|
| production posts 用 `affiliate.links[].ref` | **0 篇**（既有 3 篇有 `affiliate:` 區塊之 production post 皆為 `links: []`）|
| commerce fixtures（settings / posts）| **0 個**（mirror Option D + content-ref source-only-first cadence）|

### 2.1 為何 production 不觸發 commerce warnings

- `affiliate.links[].ref` 為 v1 新引入 reference 欄位；既有 production posts 之 `affiliate.links: []` 為空 array → `validateCommerceRefs` 直接跳出 loop。
- 即使未來 production posts 加入 raw `affiliate.links[i].url` 而**不**用 `ref` → `entry.ref === undefined` → 不觸發任何 C1..C5。
- registry-level 11 條 rule 全部 gated by `commerceLinks.length > 0`；empty `[]` → 0 觸發。
- 結論：fixture phase **不**建立任何 fixture 前，baseline 已維持 `0 / 60 / 53`；fixture phase 之唯一 baseline 變動來源即新增之 4 個 fixture markdown。

---

## 3. Rule-to-Fixture Mapping

⚠️ **本節為設計，非實作**。所有 rule id 與 message shape 以 `src/scripts/validate-content.js` `validateCommerceRefs`（lines 567–655）為準。

### 3.1 C1 — `commerce-ref-invalid-type`

| 屬性 | 值 |
| --- | --- |
| 目標 | `affiliate.links[i].ref` 為非 undefined、且 typeof ≠ `'string'` |
| 預期 warning | `commerce-ref-invalid-type` |
| 預期 message shape | `affiliate.links[0].ref typeof=number (must be string)`（或 `null` / `array` / `boolean` / `object`，視 ref 型別而定）|
| 依賴 registry？ | ❌ no（typeof check 不查 registry）|
| Cascade 行為 | C1 觸發 → 同一 entry 跳過 C2 / C3 / C5 |
| 設計建議 | 單一 entry，`ref` 設為 `42`（number）或 `null` 或 `[]`；建議 `42` 最簡單可讀 |
| 額外 warning 風險 | 若 fixture 只放 1 個 entry → 不可能觸發 C5（C5 需 ≥ 2 同字串 ref）→ 乾淨 +1 warning |

### 3.2 C2 — `commerce-ref-empty`

| 屬性 | 值 |
| --- | --- |
| 目標 | `affiliate.links[i].ref` 為 string，但 `trim()` 後為空字串 |
| 預期 warning | `commerce-ref-empty` |
| 預期 message shape | `affiliate.links[0].ref is empty or whitespace-only` |
| 依賴 registry？ | ❌ no（trim check 不查 registry）|
| Cascade 行為 | C2 觸發 → 同一 entry 跳過 C3 / C5 |
| 設計建議 | 單一 entry，`ref` 設為 `""`（空字串）或 `"   "`（純空白）；建議 `""` 最簡單 |
| 額外 warning 風險 | 單 entry + empty string → 不可能觸發 C5（trim 後空之 ref 不參與 duplicate map）→ 乾淨 +1 warning |

### 3.3 C3 — `commerce-ref-not-found`

| 屬性 | 值 |
| --- | --- |
| 目標 | `affiliate.links[i].ref` 為非空 trimmed string；`commerceLinkIdSet !== null`；`ref` 不在 set |
| 預期 warning | `commerce-ref-not-found` |
| 預期 message shape | `affiliate.links[0].ref="__nonexistent-commerce-ref__" not found in commerce-links registry` |
| 依賴 registry？ | ✅ yes，但 **registry empty 時 set 為空 → 任何非空 ref 都 not-found**（不需 seed）|
| Cascade 行為 | C3 與 C5 orthogonal（同 entry 可同時觸發）|
| 設計建議 | 單一 entry，`ref` 設為 fixture 命名空間 string（如 `"__nonexistent-commerce-ref__"`）；**不**得與 production linkId 命名混用 |
| 額外 warning 風險 | 單 entry + 非空 ref → 不可能觸發 C5 → 乾淨 +1 warning |

### 3.4 C5 — `commerce-ref-duplicate-in-post` ⚠️ 名稱注意

| 屬性 | 值 |
| --- | --- |
| 目標 | 同 post 之 `affiliate.links[]` 內 trimmed `ref`（非空）出現 ≥ 2 次 |
| 預期 warning | **`commerce-ref-duplicate-in-post`**（per source line 649）|
| 注意 | 本 phase user prompt 提到 `commerce-ref-duplicate`；**source 實際 emit `commerce-ref-duplicate-in-post`**；以 source 為準。fixture filename 採用 `_test-commerce-ref-duplicate.md`（與 rule id 同義縮寫）作為作者可讀檔名；fixture 內**預期觸發** `commerce-ref-duplicate-in-post`。 |
| 預期 message shape | `affiliate.links[0,1] duplicate ref="fixture-ref-001"` |
| 依賴 registry？ | ❌ no（duplicate check 純比對 frontmatter array；但 empty registry 下 ref 亦被 C3 視為 not-found）|
| Cascade 行為 | 與 C3 **orthogonal**：同 entry 之非空 ref 同時觸發 C3（not-found）+ C5（duplicate）|
| 設計建議 | 2 個 entry，`ref` 設為同一 fixture 命名空間 string（如 `"fixture-ref-001"`）|
| 額外 warning 風險 | 🔴 **無法避免**：empty registry 下 2 個非空 ref 必觸發 2 × C3 → fixture **預期觸發 3 個 warning**（1 × C5 + 2 × C3）；mirror download R5b `_test-download-asset-ref-duplicate.md` cadence（2 × not-found + 1 × duplicate） |
| 替代設計（NOT 推薦） | 若想讓 fixture 只觸發 1 × C5：須 seed registry entry → 違反「不 seed production registry」紅線；或新增 settings-level fixture registry → 違反 am-2 Option D 凍結；**皆不採** |

### 3.5 Cascade matrix summary

```
單 entry case：
  C1 (typeof≠string)       → +1 C1，跳過 C2/C3/C5
  C2 (trim empty)          → +1 C2，跳過 C3/C5
  C3 (non-empty + not in set)→ +1 C3

雙 entry case（同非空 ref）：
  C5 觸發                   → +1 C5
  + 每 entry 之 ref 不在 empty registry → 2 × C3
  → 雙 entry duplicate fixture = +3 warnings
```

---

## 4. Proposed Fixture File Names

⚠️ **本 phase 不建立**。以下為未來 fixture phase 之檔名 contract。

| # | path | 對應 rule | 預期觸發 warning |
| --- | --- | --- | --- |
| FC1 | `content/validation-fixtures/blogger/posts/_test-commerce-ref-invalid-type.md` | C1 | 1 × `commerce-ref-invalid-type` |
| FC2 | `content/validation-fixtures/blogger/posts/_test-commerce-ref-empty.md` | C2 | 1 × `commerce-ref-empty` |
| FC3 | `content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md` | C3 | 1 × `commerce-ref-not-found` |
| FC5 | `content/validation-fixtures/blogger/posts/_test-commerce-ref-duplicate.md` | C5 | 1 × `commerce-ref-duplicate-in-post` + 2 × `commerce-ref-not-found`（orthogonal cascade；empty registry 下無法避免）|

### 4.1 Path convention 對照

- 沿用既有 cadence：`content/validation-fixtures/blogger/posts/_test-<rule-id-or-purpose>.md`
- 既有對照：`_test-download-asset-ref-invalid-type-item.md` / `_test-download-asset-ref-empty-item.md` / `_test-download-asset-ref-not-found.md` / `_test-download-asset-ref-duplicate.md`
- 與既有 download fixture 同 directory；prefix `_test-` 區隔 production post
- 採 `blogger/` 子目錄而非 `github/` 因 `affiliate.links` 為書評（blogger 站常用）語義；validator 不區分子目錄，純為人類可讀分類
- FC5 之 filename 採 `_test-commerce-ref-duplicate.md`（不含 `-in-post` 尾綴）以對齊既有 download `_test-download-asset-ref-duplicate.md` 命名習慣；fixture 內預期觸發 source 真實 rule id `commerce-ref-duplicate-in-post`

### 4.2 Fixture filename 與 source rule id 對應表

| fixture filename | source-emitted rule id |
| --- | --- |
| `_test-commerce-ref-invalid-type.md` | `commerce-ref-invalid-type` |
| `_test-commerce-ref-empty.md` | `commerce-ref-empty` |
| `_test-commerce-ref-not-found.md` | `commerce-ref-not-found` |
| `_test-commerce-ref-duplicate.md` | `commerce-ref-duplicate-in-post`（+ orthogonal `commerce-ref-not-found` × 2）|

---

## 5. Frontmatter Design

⚠️ **本 phase 不建立 fixture**；以下為未來 fixture phase 之最小 frontmatter contract。所有 fixture 須：

- 純 fixture 命名空間（無真實 affiliate 連結、無真實 merchant token、無真實 tracking id）
- `status: "ready"` 但 fixture 命名空間（`_test-` prefix）+ `seo.indexing: "noindex-follow"` → 不被 indexed
- 不依賴 commerce-links registry 有任何 entry（registry 維持 empty）
- 不新增 commerce registry entry
- 只測 validator；不測 renderer / Admin
- mirror 既有 `_test-download-asset-ref-*.md` cadence

### 5.1 共同 frontmatter 樣板（基線）

每個 fixture 之最小 frontmatter（FC1 / FC2 / FC3 / FC5 共用基線；僅 `title` / `slug` / `description` / `affiliate.links` 隨 fixture purpose 變動）：

```yaml
---
title: "[validation-fixture] commerce ref <purpose>"
slug: "test-commerce-ref-<purpose>"
status: "ready"
draft: false
date: "2026-06-07"
description: "Phase 20260607-night-<future> fixture：故意觸發 <warning-id> warning（<purpose>）。"
contentKind: "book-review"
site: "blogger"
primaryPlatform: "blogger"
category: "book-review"
tags: ["book"]
cover: "/images/placeholders/cover.png"
seo:
  indexing: "noindex-follow"
affiliate:
  enabled: true
  disclosure: "（fixture）本文為 validation fixture，無真實聯盟連結。"
  links:
    - ref: <fixture-specific>
---
```

### 5.2 各 fixture 之 `affiliate.links` 差異

#### FC1 — `_test-commerce-ref-invalid-type.md`

```yaml
affiliate:
  enabled: true
  disclosure: "（fixture）..."
  links:
    - ref: 42
```

- `ref` 為 number → 觸發 C1
- 單 entry → 不可能觸發 C5
- 預期：+1 × `commerce-ref-invalid-type`

#### FC2 — `_test-commerce-ref-empty.md`

```yaml
affiliate:
  enabled: true
  disclosure: "（fixture）..."
  links:
    - ref: ""
```

- `ref` 為空字串 → 觸發 C2
- 單 entry → 不可能觸發 C5
- 預期：+1 × `commerce-ref-empty`

#### FC3 — `_test-commerce-ref-not-found.md`

```yaml
affiliate:
  enabled: true
  disclosure: "（fixture）..."
  links:
    - ref: "__nonexistent-commerce-ref__"
```

- `ref` 為 fixture 命名空間 string，不在 empty registry → 觸發 C3
- 單 entry → 不可能觸發 C5
- 預期：+1 × `commerce-ref-not-found`

#### FC5 — `_test-commerce-ref-duplicate.md`

```yaml
affiliate:
  enabled: true
  disclosure: "（fixture）..."
  links:
    - ref: "fixture-ref-001"
    - ref: "fixture-ref-001"
```

- 2 entry 之 `ref` 為同 fixture 命名空間 string → 觸發 C5（intra-post duplicate）
- empty registry 下兩 entry 之 `ref` 皆 not-found → orthogonal 觸發 2 × C3
- 預期：+1 × `commerce-ref-duplicate-in-post` + 2 × `commerce-ref-not-found` = +3 warnings

### 5.3 為何選 `contentKind: "book-review"`

- `affiliate.links` 為書評/書籍販售區塊之 frontmatter；`book-review` 為 §11 列舉值最相符語義
- 既有 production posts 用 `affiliate:` 區塊者皆為書評（如 `20260504-sample-book-review.md`）
- fixture implementation phase 須 verify：選擇 `book-review` 之後 validator **不**因缺 `book.title` / `book.author` 等欄位觸發其他 warning（若觸發，須改 `contentKind` 為更中性類別，或補最小 `book` 區塊）
- 替代候選：`contentKind: "post"`（最中性）；fixture phase 可在 verify 階段裁決

### 5.4 為何選 `cover: "/images/placeholders/cover.png"`

- 既有 fixture（`_test-download-asset-ref-duplicate.md`）已採此 path
- placeholder image 不需真實存在（validator 不 fetch image）

### 5.5 為何選 `seo.indexing: "noindex-follow"`

- 既有 fixture 統一採此值 → 即使未來 fixture 意外被 build 也不會 indexed
- 注意：validator 已採 fixture 路徑分流（`build:github` / `build:blogger` 不會掃 `validation-fixtures/`），但 `noindex-follow` 為 defence-in-depth

### 5.6 紅線：不可使用之 frontmatter 內容

🔴 fixture frontmatter 內**絕對不可**包含：

- 真實 affiliate 連結（不可使用真實博客來 / 蝦皮 / momo / 聯盟網 / 通路王 URL）
- 真實 merchant tracking id / affiliate token
- 真實 OAuth token / API key / Authorization header
- 真實 commission / payout 數據
- 真實 respondent data / email
- 與既有 production / future 真實 commerce-links registry 之 `linkId` 命名衝突（fixture 命名空間建議：`__nonexistent-*` / `fixture-ref-*`）

---

## 6. Expected Validate Baseline Impact

### 6.1 Design 1（理想；每 fixture 觸發 1 個 warning）

| stage | posts | warnings |
| --- | --- | --- |
| current（本 phase 後）| 53 | 60 |
| FC1 (C1 only) | +1 | +1 |
| FC2 (C2 only) | +1 | +1 |
| FC3 (C3 only) | +1 | +1 |
| FC5 (C5 only — 假設無 orthogonal C3) | +1 | +1 |
| Design 1 預期 | **57** | **64** |

⚠️ **Design 1 在 empty registry 下無法達成**：FC5 之兩個非空 ref 在 empty registry 下必然觸發 2 × C3（orthogonal cascade）。Design 1 僅為 reference 對照值。

### 6.2 Design 2（現實；推薦；mirror download R5b cadence）

| stage | posts | warnings |
| --- | --- | --- |
| current（本 phase 後）| 53 | 60 |
| FC1 (C1 only) | +1 | +1 |
| FC2 (C2 only) | +1 | +1 |
| FC3 (C3 only) | +1 | +1 |
| FC5 (C5 + 2 × C3 orthogonal) | +1 | +3 |
| Design 2 預期 | **57** | **66** |

✅ **Design 2 為推薦**：

- 與 download R5b `_test-download-asset-ref-duplicate.md` cadence 一致（2 × not-found + 1 × duplicate = 3 warnings）
- 不需 seed registry（empty registry 紅線維持）
- 不需新增 settings-level fixture（Option D 凍結維持）
- orthogonal cascade 之驗收是 C5 source contract 的明確設計（per source line 630 註解 + 20260604 am-7 §5.6 備註）
- fixture description 內須明確記載「預期觸發 3 個 warning（1 × C5 + 2 × C3）」以利 reviewer 對照

### 6.3 替代設計（NOT 推薦）

#### 替代 A：seed registry 讓 FC5 之 ref 命中 → C5 only

- ❌ 違反「不 seed production commerce registry」紅線
- ❌ 違反 §8.1 / am-2 / night-19 R1-clean 凍結
- ❌ 影響 registry-level validator 11 條 rule 之觸發判定（registry 非 empty 後須 verify R3..R14 不誤觸）

#### 替代 B：新增 settings-level fixture registry 讓 FC5 命中

- ❌ 違反 am-2 Option D 凍結（settings-level fixture mechanism deferred）
- ❌ 須擴 loader 暴露 raw registry + 新 fixture-mode code path → 違反 §1「不過度工程化」

#### 替代 C：FC5 採非 string ref 同時重複

- ❌ 不可行：非 string ref → C1 → cascade `continue` → 跳過 C5 duplicate map（per source line 639 `if (typeof ref !== 'string') continue`）

#### 替代 D：FC5 採空字串 ref 同時重複

- ❌ 不可行：空字串 ref → C2 → cascade `continue`；且 duplicate map 跳過 `trimmed === ''`（per source line 641）

→ 結論：**Design 2 為唯一可行設計**；Design 1 為理論對照。

---

## 7. Acceptance Criteria for Future Implementation Phase

未來真正建立 4 個 fixture 之 phase 須符合：

### 7.1 git diff scope（必須）

- ✅ 僅新增 4 個 `.md` fixture：
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-invalid-type.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-empty.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-not-found.md`
  - `content/validation-fixtures/blogger/posts/_test-commerce-ref-duplicate.md`
- ✅ `git diff --name-status` 必須為 4 行 `A`（純新增；無 modify / delete）
- ✅ `git diff --stat` 之 total 行數須為 4 個 fixture 之 frontmatter + 簡短 body；無他檔變動

### 7.2 不可變動範圍（紅線）

- ❌ 不改 `src/scripts/validate-content.js` / `src/scripts/load-settings.js` / 任一 `src/`
- ❌ 不改 `content/settings/commerce-links.json`
- ❌ 不改 `content/settings/affiliate-networks.json`
- ❌ 不改 `CLAUDE.md`（若需 sync CLAUDE.md 之 commerce baseline → **另開 docs-sync phase**）
- ❌ 不改 `package.json` / `package-lock.json` / `vite.config.js`
- ❌ 不改 production posts（`content/blogger/posts/` / `content/github/posts/` / `content/shared/posts/` / `content/drafts/` / `content/archive/`）
- ❌ 不改 templates（`content/templates/`）
- ❌ 不改 docs（除非另起 docs-sync phase）

### 7.3 validation 要求

- ✅ `npm run validate:content` 應為 **0 errors / 66 warnings / 57 posts**（Design 2 預期）
- ⚠️ 若實際為 64 warnings → 表示 FC5 設計被替代 A/B 改動 → 須回頭 verify 紅線未碰
- ⚠️ 若 warnings ≠ 64 且 ≠ 66 → 表示有非預期 cascade（如 `contentKind` 選擇導致 book-* warning 衍生）→ 須 verify 並修正 frontmatter
- ⚠️ 若 errors > 0 → 立即 stop；不 commit

### 7.4 forbidden actions

- ❌ no `npm install`
- ❌ no `npm run build` / `npm run dev` / `npm run preview`
- ❌ no Blogger repost / GA4 validation / reverse UTM activation / pm-26 unblock
- ❌ no Admin Apply / middleware / admin-write-cli (dry-run or apply)
- ❌ no git reset / stash / rebase / amend / force-push
- ❌ no commit 不符合 §7.1 / §7.2 / §7.3 之 diff

### 7.5 commit message convention（建議）

```
feat(validate-fixtures): add commerce ref C1/C2/C3/C5 fixtures
```

→ 為 `feat(validate-fixtures)` scope；mirror 既有 download fixture commit cadence。

---

## 8. Non-goals / Blocked Items

### 8.1 本 phase 紅線（必須 enforced）

- ❌ **no source changes**：不改 `src/scripts/validate-content.js` / `src/scripts/load-settings.js` / 任一 `src/`
- ❌ **no settings changes**：不改 `content/settings/commerce-links.json` / 任一 settings JSON
- ❌ **no fixture creation**：不新增任何 fixture（`.md` / `.json`）；本 phase 為純 docs
- ❌ **no production content migration**：既有 `affiliate.links` 不動
- ❌ **no production commerce registry seed**：production `commerce-links.json` 維持 empty `[]`
- ❌ **no real affiliate links**：本 doc 內不含真實 affiliate URL / token / merchant id
- ❌ **no template changes**
- ❌ **no package change**：不改 `package.json` / `package-lock.json` / `vite.config.js`
- ❌ **no `npm install`**
- ❌ **no build/deploy**：不執行 `npm run build` / `build:github` / `build:blogger` / `dev` / `preview`；不 deploy gh-pages
- ❌ **no Blogger repost**：不重貼 Blogger 後台；不觸發 GA4 Realtime 驗收
- ❌ **no reverse UTM activation**：不解除 reverse UTM dormant
- ❌ **no pm-26 unblock**：不解除 pm-26 deploy gate
- ❌ **no Admin Apply / middleware / admin-write-cli**：全維持 dormant
- ❌ **不**自動啟動下一階段

### 8.2 不在本 doc 範圍之 commerce content-ref rules

本 doc 之 fixture 設計**只**涵蓋 C1 / C2 / C3 / C5；以下 rule 全部 **out-of-scope**：

| rule | 狀態 | 原因 |
| --- | --- | --- |
| C4 `commerce-ref-inactive` | source 未啟動；fixture defer | 需 registry 有 `active: false` entry → coupling Option A；違反「不 seed registry」紅線 |
| C6 `commerce-ref-local-url-coexistence-warning` | source 未啟動；不啟用 | gated by renderer landed + migration phase（per am-7 §5.7）|
| C7 `commerce-ref-missing-role` | source 未啟動；不建議啟用 | long-tail；role 為 hint，缺漏不阻擋 |
| C8 `commerce-ref-invalid-role` | source 未啟動；fixture defer | 需先凍 enum + source land 後才設計 fixture |
| C9 `commerce-ref-display-override-risk` | source 未啟動；fixture defer | 需 registry 有對應 entry → coupling Option A |

### 8.3 不在本 doc 範圍之系統元件

- ❌ renderer fallback（ref → registry `targetUrl` lookup）
- ❌ Admin picker / selector / display
- ❌ registry seed（任何真實 affiliate entry）
- ❌ production content migration（既有 raw URL → ref）
- ❌ reverse UTM Blogger→GitHub live posting
- ❌ pm-26 deploy gate
- ❌ build / deploy / Blogger repost / GA4 commerce dimension
- ❌ Admin Apply / middleware write route / admin-write-cli

---

## 9. Risk Analysis

### 9.1 fixture 不可讓 commerce registry 從 empty 變 seeded

🔴 **核心紅線**：fixture 設計**必須**在 empty registry 下測通；**不**得透過 seed registry 達成 C5「only 1 warning」。

- 已於 §6.3 替代 A / B 明確拒絕
- 已於 §7.2 列為 git diff 紅線
- 已於 §8.1 列為 phase-level 紅線

### 9.2 不可讓未來 reviewer 誤以為要建立真實 affiliate link

- 本 doc 之 fixture frontmatter 樣板（§5）**全部**使用 fixture 命名空間（`__nonexistent-*` / `fixture-ref-*` / `42` / `""`）
- 本 doc **未列**任何真實 merchant / network 名稱（不含「博客來」「蝦皮」「momo」「聯盟網」「通路王」之 affiliate-specific 連結；§5.6 已列為紅線）
- 本 doc **未列**任何 deeplink 樣式之 fixture ref（不含 `aff_*` / `utm_source=*` 之 query string）
- fixture implementation phase 之 `disclosure` 字串建議採 `（fixture）...` 前綴明示

### 9.3 C3 在 empty registry 下測 not-found 是安全的

- empty registry → `commerceLinkIdSet = new Set()`（空 set，非 `null`）
- 非空 trimmed ref → `set.has(...)` 為 false → 必觸發 C3
- C3 不需 seed registry；不需建立 settings-level fixture
- 與 download R2 `_test-download-asset-ref-not-found.md` cadence 完全一致

### 9.4 C5 duplicate 採 fixture 命名空間 ref 避免 baseline 雜訊

- FC5 之 `ref: "fixture-ref-001"` 為 fixture-only 命名；
  - **不**會與 production linkId 衝突（production registry 為 empty；未來 seed 時須避此命名）
  - **不**會被誤判為真實 affiliate ref
  - mirror download R5b `"duplicate-asset-id"` 命名 cadence

### 9.5 fixture path 分流穩定性

- validator 已掃 `content/validation-fixtures/`（per 既有 baseline 包含 download / book / authors / seo fixtures）
- `build:github` / `build:blogger` 不掃 `validation-fixtures/`（per 既有 download fixture 註解 §32）
- fixture 不會污染 production dist；不會被 Blogger / GitHub Pages 公開
- fixture implementation phase 須 verify：build 後 dist 內**無**任何 `_test-commerce-ref-*` 痕跡

### 9.6 `contentKind: "book-review"` 之 side-effect 風險

- 若 fixture 採 `contentKind: "book-review"`，validator 可能因缺 `book` 區塊 / `book.title` / `book.author` 等觸發 book-* warning
- 已知 book-* warning（per 現有 baseline）包含 `book-mediatype-invalid` / `book-issn-without-magazine-mediatype` 等；多為 conditional 觸發，缺漏不一定報
- 建議 fixture implementation phase **先 dry-run** 一個 fixture（只先建 FC1）→ verify baseline 為 `0 errors / 61 warnings / 54 posts`（理想）→ 再建其餘 3 個
- 若發現 book-* side effect → 切換 `contentKind: "post"` 並 re-verify

---

## 10. Final Recommendation

### 10.1 本階段 single conclusion

> **Commerce content-reference C1 / C2 / C3 / C5 fixture preanalysis 已凍結**：
>
> - **fixture 數**：4 個 post-level `.md`（FC1 / FC2 / FC3 / FC5）
> - **檔名**：`content/validation-fixtures/blogger/posts/_test-commerce-ref-<purpose>.md`
> - **frontmatter shape**：`status: "ready"` + `seo.indexing: "noindex-follow"` + `contentKind: "book-review"` + fixture 命名空間 `affiliate.links[].ref`
> - **預期 baseline**：`0 errors / 66 warnings / 57 posts`（Design 2；推薦）
> - **紅線**：不 seed registry / 不改 source / 不改 settings / 不真實 affiliate / 不真實 token

### 10.2 本階段結束後預設狀態

**Final Idle Freeze / EXIT**。

唯一輸出為本檔 `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`；不動 source / content / settings / templates / fixtures / package / dist / gh-pages / memory；validate baseline 維持 **0 errors / 60 warnings / 53 posts**；所有 dormant gates 維持 dormant；所有紅線維持 enforced。

### 10.3 不自動推進下一階段

下一個 phase（如 user 明確授權）建議：

```
20260607-night-3-commerce-content-ref-c1c2c3c5-fixtures-source-free-implementation-a
```

該 phase **才**真正建立 4 個 fixture markdown；仍**不**得改 source / registry / renderer / Admin / templates；commit message 採 `feat(validate-fixtures): add commerce ref C1/C2/C3/C5 fixtures`。

---

## Appendix A — Cross-reference index

- `docs/20260603-commerce-affiliate-link-registry-schema-decision.md`（night-18；schema decision + v0 欄位 + linkId 命名 + ref 候選）
- `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md`（night-19；R1-clean 7 條件）
- `docs/20260603-commerce-links-validator-preanalysis.md`（night-22；R1..R15 / C1..C9 rule contract）
- `docs/20260604-commerce-links-registry-fixture-mechanism-preanalysis.md`（am-2；fixture mechanism Option D；Option A path naming convention）
- `docs/20260604-commerce-links-content-reference-validation-preanalysis.md`（am-7；C1..C9 content-reference rule contract + cascade ordering + 推薦 source-only-first cadence）
- `docs/20260602-download-registry-aware-validation-preanalysis.md`（download R2 not-found / R5b duplicate cadence 範本）
- `CLAUDE.md` §1（不過度工程化）/ §3.2（commerce registry 狀態 + download R-series cadence + 紅線）/ §12（書評 affiliate.links schema）/ §16（連結處理）/ §27 / §29 / §30
- `content/settings/commerce-links.json`（empty registry；本 phase 不動）
- `content/settings/affiliate-networks.json`（既有 network registry；R11 referential target；本 phase 不動）
- `src/scripts/load-settings.js`（commerce loader 已落地；本 phase 不動）
- `src/scripts/validate-content.js`（`validateCommerceRefs` lines 567–655；本 phase 不動）
- `content/validation-fixtures/blogger/posts/_test-download-asset-ref-duplicate.md`（download R5b fixture cadence 範本）
- `content/templates/blogger-book-review-template.md`（`affiliate.links: []` 範本）

---

## Appendix B — Baseline snapshot

- repo path：`D:\github\blog-new\portable-blog-system`
- branch：`main`
- HEAD（pre-commit）：`5b81da64891fbb835e54d05490159b1c934b8515`
- `HEAD == origin/main`（pre-commit）：yes（ahead / behind = `0 / 0`）
- working tree（pre-commit）：clean
- latest commit subject（pre-commit）：`docs(claude): sync commerce content ref validator state`
- `npm run validate:content`（pre-commit）→ **0 errors / 60 warnings / 53 posts**

本階段結束後預期：

- 唯一新增：本檔 `docs/20260607-commerce-content-ref-c1c2c3c5-fixture-preanalysis.md`
- 其他狀態完全不變
- `npm run validate:content`（post-commit）預期維持 **0 / 60 / 53**

---

（本文件結束）
