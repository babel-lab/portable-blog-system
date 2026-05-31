# 20260531 Download Empty Registry Implementation Plan

> Phase: `20260531-am-8-download-empty-registry-implementation-plan-docs-only-a`
> Date: 2026-05-31 10:54 +0800
> Scope: **docs-only**（無 source / content / settings / templates / fixture / package / dist / gh-pages 變更）
> Baseline: HEAD = origin/main = `ae14476` —— `docs(download): plan asset form registry json`
> validate:content baseline: **0 errors / 47 warnings / 42 posts**

---

## 1. Executive Summary

- 本文件為 **docs-only implementation plan**：在已驗收通過之 am-6（registry JSON preanalysis；HEAD `ae14476`）+ am-4（schema decision；`b6f5c59`）+ am-2（entity preanalysis；`8709d0b`）三份 docs 之基礎上，為未來「empty registry JSON 真正建檔」之最終實作步驟做 docs-only 落地計畫。
- 本 phase **不**建立 registry JSON：
  - ❌ 不新增 `content/settings/download-assets.json`
  - ❌ 不新增 `content/settings/download-forms.json`
  - ❌ 不新增任何其他 registry JSON 實體檔
  - ❌ 不改 source / content / settings / templates / fixture / package / dist / gh-pages
  - ❌ 不 build / deploy / Blogger repost / GA4 validation
  - ❌ 不啟用 Admin Apply / middleware write / admin-write-cli dry-run / apply
  - ❌ 不解除 reverse UTM dormant；不解除 pm-26 deploy gate
- 本 phase 目標為「規劃下一階段若要建立 empty registry JSON，**應修改哪些檔案**、**預期 validate baseline 是否改變**、**如何驗收**」；不啟動任何下游 phase。
- 本文件落地後 production state drift = 0；唯一變更為新增本 docs 檔。
- 預期 validate:content 維持 **0 errors / 47 warnings / 42 posts**。

### 1.1 一句話裁決

> **下一階段「empty registry JSON 真正建檔」之 commit scope 限為 exactly two settings JSON files（`content/settings/download-assets.json` + `content/settings/download-forms.json`）；內容為 `{ schemaVersion: 1, updatedAt: "", assets|forms: [], notes: "" }`；不改任何 source / content / fixture / validator / Admin / renderer；不 build / deploy；validate baseline 預期不變；驗收須通過 acceptance cross-check。**

---

## 2. Current Accepted Baseline

### 2.1 Repo state

- **HEAD**：`ae144765377a45ed28c7ee47dc5c7eff23bdb738`
- **branch**：`main` tracking `origin/main`
- **ahead/behind**：`0 / 0`
- **working tree**：clean
- **latest subject**：`docs(download): plan asset form registry json`
- **validate:content**：**0 errors / 47 warnings / 42 posts**

### 2.2 Registry / consumer state

| Surface | 狀態 |
|---------|------|
| `content/settings/download-assets.json` | ❌ **不存在** |
| `content/settings/download-forms.json` | ❌ **不存在** |
| Registry loader source | ❌ **未實作** |
| Registry validator rule | ❌ **未實作** |
| post frontmatter `assetRefs[]` / `formRef` schema | ❌ **未擴張** |
| Renderer landing page | ❌ **未實作** |
| Admin asset / form picker | ❌ **未實作** |

### 2.3 Governance frozen state

- **reverse UTM**：landed but **dormant**（pm-24a/b/c 已 push origin/main；尚未 deploy；Blogger 後台未重貼；live 狀態 dormant）。
- **pm-26 deploy gate**：**BLOCKED**。
- **Admin Apply / middleware write / admin-write-cli**：全 **dormant**。
- **fourth SEO write**：未擴張 allowed write scope。
- **R1 / R2 / R3 紅線**（per pm-20 §4）：全程恪守。
- **D1 / D2 / D3 / S / preview-url-risk**：全 frozen；本 phase 不重做、不調整、不退化。

### 2.4 Docs cadence position

| Step | Phase code | 性質 | 狀態 | HEAD |
|------|-----------|------|------|------|
| P1 entity preanalysis | am-2 | docs-only | ✅ landed | `8709d0b` |
| P1 acceptance | am-3 | read-only | ✅ accepted（無 commit） | — |
| P2 schema decision | am-4 | docs-only | ✅ landed | `b6f5c59` |
| P2 acceptance | am-5 | read-only | ✅ accepted（無 commit） | — |
| P3 registry JSON preanalysis | am-6 | docs-only | ✅ landed | `ae14476` |
| P3 acceptance | am-7 | read-only | ✅ accepted（無 commit） | — |
| **P3.5 empty registry implementation plan（本 phase）** | **am-8** | **docs-only** | **🟢 本 phase** | — |

本 phase 之 cadence 位置：在 am-6 / am-7 之後、未來 P4（empty registry JSON 真正建檔）之前；作為**最後一份 docs-only plan**，固化「下一階段若啟動，應如何啟動」之契約。

---

## 3. Prior Decisions Summary

### 3.1 Registry target files（per am-4 §3.3 + am-6 §4）

| Path | 性質 | 用途 |
|------|------|------|
| `content/settings/download-assets.json` | settings registry；單檔 | DownloadAsset entry 陣列 + schemaVersion + updatedAt + notes |
| `content/settings/download-forms.json` | settings registry；單檔 | FormConfig entry 陣列 + schemaVersion + updatedAt + notes |

- 採 Option A 平鋪於 `content/settings/`（per am-4 §3.3）。
- 分檔；不合併為單檔（per am-4 §3.3 / am-6 §3.3）。

### 3.2 Empty registry 合法（per am-6 §5）

- 未來 registry 落地時，empty registry（`assets|forms: []`）**為合法 acceptable shape**。
- 不要求作者先填入 minimal entry 才能建檔。
- empty 為「**系統開出空間但作者尚未填入**」之合法初始狀態。

### 3.3 Missing registry silent fallback（per am-6 §7.1）

- 未來 loader 對 missing file **silent fallback**：return `{ schemaVersion: 0, assets|forms: [] }`。
- 不 fail；不主動 warn；不阻擋 build。
- parse error 才 **fail closed**（throw with file path + parse error）。

### 3.4 Empty registry 不 warning（per am-6 §5.3 / §8.1）

- 未來 validator 對 empty registry **不**主動 warn。
- 不在「registry empty」與「registry 未建檔」兩狀態間造成 baseline drift。

### 3.5 By-demand ref lookup 才 warning（per am-6 §7.4 / §8.1）

- 未來 validator 對 registry 之檢查須 **by demand**：post 引用了 ref → 才 lookup → 才有可能 warn。
- 無 post 引用 → registry 之 missing / empty / shape-invalid 皆不影響 baseline。
- mirror 既有 D1 / D2 / D3 / S 之「by post」per-post iteration pattern。

### 3.6 No respondent data（per am-2 §4.1 / am-4 §8 / am-6 §4.4 + pm-20 §4 R1）

- registry **永不**含 respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）。
- 即使作者明示願意公開個資，registry 之**欄位設計**不為其提供承載空間。

### 3.7 No token / secret（per am-4 §8.4 / am-6 §11.5）

- registry **永不**含 access token / API key / OAuth secret / 帳號 email。
- `notes` / `owner` 欄位即使空字串，亦明示「不可放秘密」之邊界。

### 3.8 FileUrl grandfather（per am-4 §9.3 / am-6 §15）

- 既有 `content/blogger/posts/20260529-phonics-practice-sheet-download.md` 之 `download.fileUrl` **保留**；不主動 migration。
- D1 / D2 / D3 / S 對 fileUrl 之既有規則**繼續有效**；不退化、不重做。
- 即使未來 registry 落地，A（`fileUrl`）與 B+C（`assetRefs[]` / `formRef`）**可共存**。

---

## 4. Proposed Next Implementation Scope

### 4.1 唯一允許新增之兩檔

下一個真正實作 phase（暫稱「P4 empty registry main-only implementation」）若啟動，**唯一允許新增**：

- `content/settings/download-assets.json`
- `content/settings/download-forms.json`

### 4.2 不改之範圍

- ❌ **不改 source**：`src/scripts/validate-content.js` / `build-github.js` / `build-blogger.js` / `load-posts.js` / `load-settings.js` / `parse-markdown.js` / 任一 build script 一行不動。
- ❌ **不改 content posts**：`content/blogger/posts/` / `content/github/posts/` / `content/drafts/` / `content/archive/` 一檔不動。
- ❌ **不改其他 settings**：`content/settings/*.json`（除上述兩新檔外）一檔不動。
- ❌ **不改 templates**：`content/templates/*.md` 一檔不動。
- ❌ **不建 fixture**：`content/validation-fixtures/` 一檔不動。
- ❌ **不改 validator**：不新增 unknown-field / duplicate-id / ref-not-found / inactive / preview-risk-via-registry 等任一規則。
- ❌ **不改 Admin**：不新增 Admin UI component / 不改 Admin source / 不啟用 Admin Apply / 不啟用 middleware write / 不執行 admin-write-cli。
- ❌ **不改 renderer**：不新增 `src/views/pages/post-detail-download.ejs` / `src/views/blogger/blogger-post-download-*.ejs`；不改 `src/views/pages/post-detail.ejs`。
- ❌ **不 build / deploy**：不 `npm run build:*` / `npm run dev`；不 push gh-pages；不改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`。
- ❌ **不 Blogger repost**：Blogger 後台不動。
- ❌ **不 GA4 validation**：不做 GA4 Realtime / DebugView。
- ❌ **不 npm install**：`package.json` / `package-lock.json` / `vite.config.js` 不動。

### 4.3 為何下一階段僅允許「two settings JSON files」

- 對齊 am-6 §19.1 之「exactly two settings JSON files」裁決。
- 一次只新增 settings 檔；不夾帶 source / fixture / validator / Admin / renderer 變動 → 風險面最小。
- 任何超出兩檔之變動須**另開獨立 phase** + user explicit approval；不可在 P4 內順便處理。

---

## 5. Exact JSON Shape Proposal

下列為下一階段（P4）建檔時之**完整檔案內容**示意。本 phase **不**寫入檔案；本節僅作為 P4 之 implementation reference。

### 5.1 `content/settings/download-assets.json`（未來；本 phase 不建立）

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "assets": [],
  "notes": ""
}
```

### 5.2 `content/settings/download-forms.json`（未來；本 phase 不建立）

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "forms": [],
  "notes": ""
}
```

### 5.3 各欄位逐項說明

| 欄位 | 值 | 說明 |
|------|----|------|
| `schemaVersion` | `1` | integer；必填；初版固定為 `1`；未來 breaking change 須走 schemaVersion bump（per am-4 §4.2 + am-6 §5.2） |
| `updatedAt` | `""` | 必填欄位 / 值可為空字串；ISO 8601；空字串 placeholder（per am-4 §4.2 + am-6 §5.5；mirror pm-16 §8.3 placeholder cadence） |
| `assets` / `forms` | `[]` | 必填欄位 / 空陣列合法（per am-4 §4.2 + am-6 §5.2） |
| `notes` | `""` | optional；空字串合法；亦可省略整個 key；不存 PII / token / secret（per am-4 §4.2 / §8 + am-6 §5.2） |

### 5.4 不含任何 respondent data

- empty registry 天然無 entry → 天然無 respondent data。
- 即使 `notes: ""`，亦不含任何字串內容；無 PII / token / secret 風險。
- 對 R1 紅線之守護：⭐⭐⭐⭐⭐（empty registry 為最強防護狀態）。

### 5.5 為何不附 inline comment / README

- 標準 JSON 不支援 comment；不採 jsonc。
- README 屬未來獨立 docs-only sub-phase 範疇（per am-6 §3.3 unknown）；不在 P4 內附加。
- 設計面說明已 docs 化於 am-4 / am-6 / 本文件；JSON 檔本身保持最小。

### 5.6 為何兩檔之 top-level shape 不同（assets vs forms）

- 兩 registry 之 entity 不同；top-level key 名應對應 entity（`assets` / `forms`）。
- 對齊既有 settings cadence：`categories.json` 之 top-level 為 `categories[]`；`tags.json` 之 top-level 為 `tags[]`；本 registry 沿用同 pattern。

---

## 6. Why Empty Registry First

### 6.1 風險最低

- 無真實下載資產資料 → 無 publicUrl / canonicalDownloadUrl / previewUrl 之 URL syntax 風險。
- 無真實 Google Form URL → 無 form URL 與 article fileUrl 混淆之 R2 紅線風險。
- 無 entry → 無 unknown-field / duplicate-id / forbidden-field 之欄位層級風險。

### 6.2 不需要真實下載資產資料

- 作者目前無 ready / published download 真實 asset 之 ZIP 包；無 minimal viable entry 之自然 source。
- 強行建 minimal entry 等於**為 fixture 而 fixture**；違反 am-6 §14.2 之「fixture 為負面樣本 / positive fixture 不作為 fixture」原則。

### 6.3 不需要 Google Form URL

- 作者目前無 ready / published download 之 form gate；無 minimal viable form 之自然 source。
- 強行建 minimal form 等於**示意檔案**；可能誤導未來使用者「此 form 已正式使用」。

### 6.4 不會導入個資

- empty registry 天然無 entry → 天然無個資。
- 對 R1 紅線之守護為**最強**狀態（per §5.4）。

### 6.5 不會影響 existing posts

- 既有 42 posts 無一引用 `assetRefs[]` / `formRef`（schema 尚未擴張）。
- empty registry 不被任何 consumer 讀取 → 不影響任何 post render / validate 行為。
- baseline 預期維持 0 errors / 47 warnings / 42 posts（per §7）。

### 6.6 可先建立 settings 檔案落點

- 對齊 CLAUDE.md §3.2 settings 集中管理原則：先把檔案落點建好，未來作者新增 entry 時知道「該編輯哪個檔」。
- 對齊既有 settings cadence：`categories.json` / `tags.json` / `promotion.config.json` 等皆採「先有空檔 / 最小檔，作者逐步補」。

### 6.7 可為未來 loader/validator 提供穩定目標

- 未來 P5（fixture-only）與 P6（validator source）之 loader 串接須有「**檔案存在**」之穩定狀態作 reference。
- empty registry 提供此 reference；loader 之 missing-file silent fallback 路徑與 empty registry 路徑可分別測試。
- 對齊 am-6 §7.1 之 loader missing / empty / shape-invalid 三分類處理。

### 6.8 為何不一步到位採 minimal entry

- minimal entry 需先裁決：用哪個 asset / form 作為 minimal sample？assetId 命名為何？deliveryMode 設為哪個值？
- 上述裁決皆需獨立 docs-only sub-phase；不可在 P4 內順便處理（per am-6 §3.3）。
- empty 先行 → 將 minimal entry 之裁決推遲至 P5（fixture-only preanalysis），cadence 更穩定。

---

## 7. Expected Validation Behavior

### 7.1 預期 baseline 不變

- 下一階段（P4）建立 empty registry 後，`npm run validate:content` **預期仍為 0 errors / 47 warnings / 42 posts**。
- 理由：目前**沒有 source 讀 registry**（無 loader / 無 validator rule）；empty registry 在 validate pipeline 中為**未被觀察之檔**；理論上 baseline 不變。

### 7.2 為何 baseline 不變之 chain of reasoning

```text
1. P4 新增 content/settings/download-assets.json（empty）
2. validate-content.js 不讀此檔（無 loader 串接）
3. 既有 D1 / D2 / D3 / S / book / related-links 等 validator rule 不受影響
4. 既有 42 posts 不變；warnings 仍由既有 47 個 source 觸發
5. 結果：0 errors / 47 warnings / 42 posts（同 baseline）
```

### 7.3 Empty registry 不應新增 warning

- 對齊 am-6 §5.3 / §8.1：empty registry 不應觸發 warning。
- 即使未來 loader / validator 落地，empty registry 仍不應 warn（per am-6 §5.3）。
- 對 P4 階段：因無 loader / 無 validator rule，更不會 warn。

### 7.4 若 validate baseline 改變，應 STOP

- 若 P4 commit 前後 `npm run validate:content` 結果非「0 errors / 47 warnings / 42 posts」 → **STOP**，不自行修正。
- 若 errors 增加 → 應視為 unexpected regression；須 rollback 並回報。
- 若 warnings 變化 → 應視為 unexpected schema drift；須 rollback 並回報。
- 若 posts 數變化 → 應視為意外影響 fixture loader；須 rollback 並回報。

### 7.5 因為目前沒有 source 讀 registry，所以理論上 baseline 不變

- validate-content.js 目前之 loader 為 `loadPosts()` + 內建 settings loader（categories / tags）；無 download-assets / download-forms loader。
- 新增兩 settings 檔不會被任何 loader 觀察。
- 對 validate pipeline 而言，兩新檔為「**透明檔**」；不影響 validate output。
- 此性質確保 P4 為「**最小風險 commit**」。

---

## 8. Commit Scope Plan

### 8.1 Exactly two files added

下一實作 phase（P4）之 commit scope **嚴格限定為**：

```text
A  content/settings/download-assets.json
A  content/settings/download-forms.json
```

`git diff --stat` 預期顯示 **exactly two new files**（無其他 modification / deletion）。

### 8.2 不允許其他檔案變動

| 類別 | 是否允許 | 備註 |
|------|---------|------|
| source（`src/**`） | ❌ 不允許 | 即使是 typo fix 或 comment 調整也不允許；須另開獨立 phase |
| content posts（`content/{site}/posts/**` / `content/drafts/**` / `content/archive/**`） | ❌ 不允許 | 既有 posts 不動；不主動 migration |
| 其他 settings（`content/settings/*.json` 除兩新檔外） | ❌ 不允許 | 不順便調整 categories / tags / promotion / 等 |
| templates（`content/templates/**`） | ❌ 不允許 | 不擴張 download-template.md 之 frontmatter；不主動補 assetRefs/formRef placeholder |
| fixture（`content/validation-fixtures/**`） | ❌ 不允許 | fixture 屬未來獨立 phase 範疇 |
| package（`package.json` / `package-lock.json` / `vite.config.js`） | ❌ 不允許 | 無 npm install；無 dependency 變動 |
| docs（`docs/**`） | ❌ 不允許 | **不允許 docs 同步夾帶**；docs 屬本 phase（am-8）；P4 commit 不混 docs |
| dist / gh-pages | ❌ 不允許 | 不 build / 不 deploy |
| .cache | ❌ 不允許 | 不主動清 cache；不順便重整 |

### 8.3 不允許 docs 同步夾帶在同一 commit

- P4 為**純 settings creation**；docs 變動屬本 phase（am-8）已 commit。
- 即使 P4 期間發現 docs 有需修正之處，須**另開獨立 docs-only sub-phase**；不在 P4 commit 內順便修。
- 對齊既有 cadence：每個 docs-only phase 與 source / settings phase 嚴格分離。

### 8.4 Commit message 慣例

下一階段（P4）建議之 commit subject：

```text
feat(download): create empty asset and form registry
```

或對齊既有 cadence：

```text
chore(settings): add empty download registry json
```

最終 subject 由 P4 phase prompt 裁決；本文件僅提示形式。

- subject 不超 72 字元。
- 使用 conventional commits prefix（feat / chore / docs / fix）。
- subject 須明示「empty」字樣，避免未來誤解為「已有 entry」之 registry。

### 8.5 不允許 `git add -A` / `git add .`

- 對齊 CLAUDE.md 工具規範：避免意外加入未追蹤之檔。
- P4 須**只**加入兩個明示路徑：
  ```bash
  git add content/settings/download-assets.json
  git add content/settings/download-forms.json
  ```
- 對齊 CLAUDE.md 之安全 staging 慣例。

---

## 9. Acceptance Criteria for Empty Registry Implementation

下一階段（P4）落地時須通過以下 acceptance：

### 9.1 HEAD 起始 baseline 正確

- P4 啟動時 HEAD 應為本 phase landed 後之 HEAD（即包含 am-8 docs）。
- branch = main tracking origin/main；ahead/behind = 0/0。

### 9.2 Working tree clean

- P4 啟動前 `git status` 應為 clean；無 uncommitted change / untracked file。

### 9.3 Validate:content baseline 正確

- P4 啟動前：`npm run validate:content` = 0 errors / 47 warnings / 42 posts。
- 若 baseline 已 drift → P4 不啟動；先回報差異。

### 9.4 Exactly two settings JSON files added

- `git diff --stat` 顯示 exactly two new files（per §8.1）。

### 9.5 JSON parse valid

- 兩檔須通過 JSON parse 驗證；不允許 trailing comma / single quote / 未閉合 bracket。
- 建議以 `node -e "JSON.parse(require('fs').readFileSync('content/settings/download-assets.json'))"` 等方式手動驗。

### 9.6 schemaVersion = 1

- 兩檔之 `schemaVersion` 須為 integer `1`；不可為字串 `"1"` / null / 未填。

### 9.7 assets / forms 為空陣列

- `download-assets.json` 之 `assets` 須為 `[]`。
- `download-forms.json` 之 `forms` 須為 `[]`。

### 9.8 No respondent data

- 兩檔無任何 entry → 天然無 respondent data。
- 即使 `notes` 欄位，亦不含 email / 姓名 / 學校 / 電話 / 答覆內容。

### 9.9 No token / secret

- 兩檔不含 access token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID。
- `notes: ""` 為空字串；無任何字串內容。

### 9.10 No source / content / fixture change

- 對齊 §8.2：source / content / fixture 一檔不動。
- `git diff --stat` 不顯示任何 `src/` / `content/blogger/posts/` / `content/github/posts/` / `content/validation-fixtures/` / `content/drafts/` / `content/templates/` / `content/settings/{除兩新檔外}` 之變動。

### 9.11 Validate:content post-change 不變

- P4 commit 後：`npm run validate:content` 仍為 0 errors / 47 warnings / 42 posts。
- 若改變 → 視為 STOP condition（per §11）。

### 9.12 Push 後 HEAD = origin/main

- `git push origin main` 後：HEAD = origin/main；ahead/behind = 0/0。
- 若 push rejected → 視為 STOP condition（per §11）。

### 9.13 Acceptance cross-check required

- P4 落地後須有獨立 read-only acceptance phase（mirror am-3 / am-5 / am-7 cadence；不 commit）。
- acceptance 驗：
  - HEAD = expected
  - 兩檔內容符合本文件 §5 之提案
  - JSON parse valid
  - validate baseline 不變
  - git 狀態 clean
  - 無 source / content / fixture 變動

---

## 10. Risk Analysis

### 10.1 Settings 檔雖未被 source 讀取，但一旦落地會成為 future source of truth

**風險**：兩 JSON 檔一旦進 git history，未來 schema 變更須走 schemaVersion bump；過早建檔等於凍結初版 schema。

**緩解**：

- 已透過 am-4 / am-6 / 本文件之 docs-only 流程**先固化 schema**；am-6 §5.2 已明示「schemaVersion 必填；初版 `1`」。
- empty registry 內容極簡（4 欄位）；schema drift 風險低於 minimal entry。
- 未來若需 breaking change，schemaVersion bump 為標準路徑；不被 P4 之 empty registry 阻擋。

### 10.2 空 registry 可能被誤解為已啟用下載管理

**風險**：未來使用者（或作者本人）看到 `content/settings/download-assets.json` 存在，誤認為「系統已啟用 download asset management」。

**緩解**：

- 透過 am-6 §5.4 之裁決：empty registry 為「系統尚未啟用」之 Admin display hint；validator 不視為 warning。
- 未來 Admin（若實作）可在 picker 顯示「目前 registry 尚無 entry；點此新增」之 placeholder UI（per am-6 §16.1）。
- docs 路徑（本文件 + am-6）已明示 empty 為 acceptable state；不會誤導熟讀 docs 之使用者。
- 若需在 git 內提供更強之 hint，未來 P5 / P6 sub-phase 可考慮新增 `README.md` 於 `content/settings/`（不在 P4 內處理）。

### 10.3 notes / updatedAt 空字串是否造成解讀問題

**風險**：`updatedAt: ""` 之空字串可能被未來 loader / Admin 誤解為「epoch 0 / 1970-01-01」或「invalid date」。

**緩解**：

- 對齊 am-4 §4.2 + am-6 §5.5 之裁決：空字串為合法 placeholder；mirror pm-16 §8.3 cadence。
- 未來 loader 須**明示**「空字串 = 未填」之處理；不可隱式轉為 Date object。
- 未來 Admin 顯示時須**明示**「（未填）」；不可顯示「1970-01-01」。
- 上述屬未來 loader / Admin source phase 之 implementation contract；本 phase 透過 docs 提示。

### 10.4 未來 loader 若實作，需要避免 missing-file 與 empty-file 行為混淆

**風險**：未來 loader 若對 missing file 與 empty file 採不同行為（如 missing 不 warn / empty warn），會造成 baseline 切換差異。

**緩解**：

- 對齊 am-6 §7.1 + §8.1：missing file 與 empty file 對 baseline 之影響須**同義**；皆不 warn。
- 未來 loader source phase 須在 preanalysis 明示「missing / empty / shape-invalid」三分類之行為；不可 silent drift。
- 本 phase 透過 §3 / §4 / §7 之 docs 化提示，降低未來 loader 設計時之混淆風險。

### 10.5 不應在同一 phase 加入真實 asset / form

**風險**：若 P4 在 empty registry 同時順便加 1 個 minimal entry，會混合「**建檔**」與「**填入內容**」兩種變動；rollback 困難；風險面擴大。

**緩解**：

- 本文件 §4.1 + §8.1 嚴格限定 P4 為「exactly two empty files」。
- 任何「填入 entry」之需求須另開獨立 phase（建議命名 P5 minimal entry preanalysis 或 P5 fixture-only）。
- 對齊 am-6 §19.1 之「exactly two settings JSON files」裁決。

### 10.6 對 gh-pages / dist 之意外影響風險

**風險**：若 P4 不慎觸發 build → 可能改變 dist；若 dist 推 gh-pages → 影響 production。

**緩解**：

- 本 phase 與 P4 皆**不**執行 `npm run build:*` / `npm run dev`。
- 兩新檔位於 `content/settings/`；非 build input；理論上不影響 dist。
- 若未來作者誤觸 build → dist 仍不變（因無 consumer 讀此 registry）；屬「副作用 zero」狀態。
- 進一步安全：P4 不 push gh-pages；不 deploy。

### 10.7 對 reverse UTM / pm-26 gate 之影響

**風險**：若 P4 不慎觸發 reverse UTM 重新 build / 重貼 Blogger → 違反 pm-26 dormant 政策。

**緩解**：

- 兩新 settings 檔與 reverse UTM 完全解耦；reverse UTM source 位於 `src/scripts/ga4-url-builder.js` + `build-blogger.js` + `blogger-post-full.ejs`；不讀 download registry。
- P4 不執行 build / 不 push gh-pages / 不重貼 Blogger / 不 GA4 validation。
- pm-26 deploy gate 保持 BLOCKED；reverse UTM 保持 dormant；不受 P4 影響。

---

## 11. Rollback / Stop Conditions

下一階段（P4）若發生以下情況應 **STOP**，並回報差異；不自行修正：

### 11.1 Validate baseline 改變

- 任一情況：errors ≠ 0 / warnings ≠ 47 / posts ≠ 42 → STOP。
- 即使 warning +1 / -1 → 仍 STOP；視為 unexpected schema drift。

### 11.2 JSON parse failed

- 任一 JSON 檔無法被 `JSON.parse()` 接受 → STOP。
- 不自行修正 syntax；回報原檔內容差異。

### 11.3 出現 respondent data

- 兩 JSON 檔出現任何 email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows → STOP。
- 違反 R1 紅線；立即 rollback。

### 11.4 出現 token / secret

- 兩 JSON 檔出現任何 access token / API key / OAuth secret / 帳號 email / 私人 Drive folder ID → STOP。
- 違反 R1 紅線之延伸；立即 rollback。

### 11.5 除兩個 settings JSON 外有其他檔案變動

- `git diff --stat` 顯示除 `content/settings/download-assets.json` + `content/settings/download-forms.json` 外之任一檔變動 → STOP。
- 即使是 `.gitignore` / `package-lock.json` 之 auto-generated 變動 → 仍 STOP。

### 11.6 Git status 不 clean

- P4 commit 後 `git status` 仍顯示 uncommitted / untracked → STOP。
- 不執行 `git add .` 或 `git stash` 等修正動作；回報原始 status。

### 11.7 Push rejected

- `git push origin main` 被 rejected（如 non-fast-forward / hook fail）→ STOP。
- 不執行 `--force` / `--no-verify`；回報 rejection 原因。

### 11.8 HEAD != origin/main

- Push 後 HEAD 與 origin/main 不同（如 ahead/behind ≠ 0/0）→ STOP。
- 不執行 reset / rebase / merge；回報差異。

### 11.9 STOP 後之處置原則

- STOP 時**不**自行修正；不執行 destructive 動作。
- 回報原始 baseline + 預期 baseline + 實際 baseline + git status + git diff --stat。
- 由 user 裁決下一步（可能為 rollback / re-plan / 暫停 P4）。

---

## 12. Future Follow-up After Empty Registry

P4（empty registry 落地）後之後續 sub-phase 規劃（**僅為設計輸入**；本 phase 不啟動任何）：

### 12.1 Read-only acceptance cross-check

- 性質：read-only；不 commit。
- 範圍：驗 P4 之兩檔內容符合本文件 §5 / §9；驗 baseline 不變；驗 git 狀態 clean。
- mirror am-3 / am-5 / am-7 cadence。
- 啟動條件：P4 landed + user explicit approval。

### 12.2 Minimal valid registry fixture preanalysis

- 性質：docs-only。
- 範圍：為未來建立 minimal valid registry fixture（含 duplicate / forbidden / missing 等 negative fixture）做 preanalysis。
- 不建立 fixture 實體檔。
- 啟動條件：12.1 acceptance landed + user explicit approval。

### 12.3 Validator source preanalysis

- 性質：docs-only。
- 範圍：為未來 validator source 串接 registry loader + A / F 系列 rules 做 preanalysis；估算 baseline 增量。
- 不改 validate-content.js。
- 啟動條件：12.2 landed + user explicit approval。

### 12.4 Loader source preanalysis

- 性質：docs-only。
- 範圍：為未來 loader 串接做 preanalysis；裁決「擴張 load-settings.js」vs「新建 load-download-registry.js」。
- 不改 source。
- 啟動條件：12.3 landed + user explicit approval。

### 12.5 Admin read-only picker preanalysis

- 性質：docs-only。
- 範圍：為未來 Admin asset / form picker UI 做 preanalysis。
- 不改 Admin source。
- 啟動條件：12.4 landed + Admin-2 SEO write 穩定 + user explicit approval。

### 12.6 Content migration 不應立即啟動

- 既有 fileUrl post 之 migration 屬 P7（per am-6 §18）；逐篇 user explicit approval。
- 不可在 empty registry 落地後立即啟動 migration；中間須先完成 12.2 / 12.3 / 12.4 / 12.5。

### 12.7 Deploy / Blogger repost / GA4 不應啟動

- deploy / Blogger repost / GA4 validation 屬 P8（per am-6 §18）。
- empty registry 落地 + 後續 12.2~12.5 docs-only sub-phase 全 landed 後始考慮；不可在 P4 後立即啟動。
- 對 reverse UTM 之關係：P8 啟動須與 pm-26 deploy gate 處置策略協調。

---

## 13. Explicit Non-Actions

本 phase（am-8）明確**未做**：

- ❌ **no source change**：`src/scripts/validate-content.js` / `build-github.js` / `build-blogger.js` / `load-posts.js` / `load-settings.js` / `build-promotion.js` / `build-sitemap.js` / `parse-markdown.js` / `ga4-url-builder.js` 等 source 一行不動。
- ❌ **no content change**：`content/blogger/posts/` / `content/github/posts/` / `content/drafts/` / `content/archive/` 一檔不動。
- ❌ **no settings change**：`content/settings/*.json` 一檔不動（包括**未建立** `download-assets.json` 與 `download-forms.json`）。
- ❌ **no templates change**：`content/templates/*.md` 一檔不動。
- ❌ **no package change**：`package.json` / `package-lock.json` / `vite.config.js` 不動；無 `npm install`。
- ❌ **no fixture creation**：`content/validation-fixtures/` 一檔不動。
- ❌ **no registry JSON creation**：不新增 `content/settings/download-assets.json` / `content/settings/download-forms.json` / `content/registries/*.json` / 任一 registry 實體檔。
- ❌ **no loader source**：不新增 `src/scripts/load-download-registry.js`；不擴張 `src/scripts/load-settings.js`。
- ❌ **no renderer**：不新增 `src/views/pages/post-detail-download.ejs` / `src/views/blogger/blogger-post-download-*.ejs`；不改 `src/views/pages/post-detail.ejs`。
- ❌ **no validator rule**：不新增 A1 / A2 / A3 / F1 / F2 / preview-risk-via-registry / bundle-consistency / asset-inactive / form-inactive / gated-form-required / unknown-field / forbidden-field / duplicate-id / token-like-pattern 等任一規則。
- ❌ **no Admin change**：不新增 Admin UI component；不改 Admin source；不改 `admin-2-write-pre-analysis.md` allowed write scope。
- ❌ **no Admin Apply enable**：Admin Apply 仍 dormant。
- ❌ **no middleware**：不新增 middleware write route；不啟動既有 middleware。
- ❌ **no admin-write-cli dry-run / apply**：`admin-write-cli` 完全不動。
- ❌ **no build**：不 `npm run build:*`；不 `npm run dev`。
- ❌ **no deploy**：不 push gh-pages；不改 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`。
- ❌ **no Blogger repost**：Blogger 後台不動。
- ❌ **no GA4 validation**：不做 GA4 Realtime / DebugView。
- ❌ **no reverse UTM activation**：reverse UTM remains **landed but dormant**。
- ❌ **no pm-26 gate unblock**：pm-26 remains **BLOCKED**。
- ❌ **no respondent data import**：Google Forms / Sheets 之 respondent data 完全不進 repo（R1 紅線恪守）。
- ❌ **no `download.fileUrl` 與 Google Form URL 混淆**：R2 紅線恪守。
- ❌ **no other SEO pipeline**：R3 紅線恪守；landing page 之 noindex 沿用既有 `seo.indexing` + build-github / build-sitemap pipeline。
- ❌ **no am-7 / am-13 / night-5 / night-7 implementation 變更**：D1 / D2 / D3 / S / preview-url-risk policy 全保持 frozen。
- ❌ **no docs revision**：本 phase 不改既有 docs（am-2 / am-3 / am-4 / am-5 / am-6 / am-7 / night-3 / night-5 / night-7 / pm-12 / pm-15 / pm-16 / pm-18 / pm-20 等）；僅新增本 phase 之新 docs 檔。
- ❌ **no `git fetch / pull / merge / rebase / reset / stash / amend / force-push`**：唯一 git 操作為 add + commit + push（單檔 docs）。

### 13.1 Governance frozen state

- reverse UTM remains **landed but dormant**。
- pm-26 deploy gate remains **BLOCKED**。
- Admin Apply / middleware write / admin-write-cli 全 **dormant**。
- fourth SEO write 不擴張；本 phase 不擴張既有 allowed write scope。
- R1 / R2 / R3 紅線（per pm-20 §4）全程恪守。
- D1 / D2 / D3 / S / preview-url-risk 全保持 frozen；本 phase 不重做、不調整、不退化。

---

## 14. Recommendation

### 14.1 推薦下一個最保守 phase

**推薦：read-only acceptance cross-check**

phase name 候選：`20260531-am-9-download-empty-registry-implementation-plan-acceptance-read-only-a`（或 `20260601-...` 視當天時間）

性質：

- 🟢 **read-only**：純驗本文件之內部一致性 + 驗與既有 docs（am-2 / am-4 / am-6 / night-7）cadence 對齊 + 驗 baseline 不變。
- ❌ 不建立 registry JSON 實體檔。
- ❌ 不啟動任何 validator / fixture / renderer / build / deploy。
- ❌ 不 commit；不改任何檔案。

理由：

1. mirror 既有 cadence：am-2（docs）→ am-3（acceptance）→ am-4（docs）→ am-5（acceptance）→ am-6（docs）→ am-7（acceptance）→ **am-8（docs；本 phase）→ am-9（acceptance）**。每一份 docs landed 後皆配對一份 read-only acceptance；不跳級。
2. 本文件之裁決將被 P4（empty registry 真正建檔）所引用；先以 read-only acceptance 驗本文件之內部一致性 + 與既有 docs cadence 對齊，可降低 P4 風險。
3. acceptance phase 為 zero risk；無 commit；不影響任何 production state。

### 14.2 替代次保守選項

若 user 認為 read-only acceptance 過保守，可考慮：

**create empty registry JSON main-only implementation**

phase name 候選：`20260531-am-9-download-empty-registry-main-only-implementation-a`（或 `20260601-...`）

性質：

- 🟡 **settings creation**（非 docs-only；非 source change）。
- 範圍：exactly two settings JSON files added（per §8.1）。
- 不改 source / content / fixture / validator / Admin / renderer。
- 不 build / deploy / Blogger repost / GA4 validation。
- 不 npm install。

風險：

- 中度；雖無 source 變動，但 settings 落地後即為 future source of truth；schema 凍結。
- 已透過本文件之 §10 risk analysis 評估；風險為 acceptable。

啟動條件：

- 本 phase（am-8）landed + user explicit approval。
- 可跳過 acceptance phase（14.1），但建議優先採 acceptance；風險更低。

### 14.3 不推薦下一步

- ❌ **不推薦** minimal fixture creation（屬 12.2 / 12.3 之後）。
- ❌ **不推薦** validator source implementation（屬 12.3 之後）。
- ❌ **不推薦** renderer implementation（屬 P6/P8 之後）。
- ❌ **不推薦** deploy / Blogger repost / GA4 validation（屬 P8 之後；pm-26 gate 仍 BLOCKED）。
- ❌ **不推薦** reverse UTM activation。
- ❌ **不推薦** pm-26 deploy gate unblock。

---

（本文件結束）
