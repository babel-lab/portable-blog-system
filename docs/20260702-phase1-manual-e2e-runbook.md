# Phase 1 手動 E2E Runbook（Admin UI → content → validate → ready）

- 建立日期：2026-07-02
- 類型：docs-only runbook（不含任何程式 / build / deploy 動作）
- 適用範圍：BLOG 系統 Phase 1 的**人工端對端測試流程**——在 Admin UI 填一篇新文章的草稿欄位、匯出 Markdown、手動放進 `content/`、用 `npm run validate:content` 把關、再於 VS Code 手動把 `status` 轉 `ready` 後複驗。
- 不涵蓋：Blogger 貼文 / AdSense / GA4 / FB 推廣 / 反向 UTM 等發布後流程（見文末 See also）。

---

## 0. 心智模型（先讀，最重要）

本系統的內容真實來源是本機 `content/`，**不是** Admin UI，也不是 Blogger 後台。Admin UI 只是一個 **read-only / 產生器** 工具，用來幫你把欄位組成一份合法的 Markdown 草稿文字。牢記以下**不可違反的界線**：

1. **Admin UI 永遠只產出 `status: "draft"` + `draft: true`。** 不論你在表單怎麼填，匯出的 frontmatter 一定是 draft，沒有「輸出 ready」的選項。
2. **Admin 永不直接寫入 `content/`。** 它沒有寫檔路徑（no Apply / no Save / no write CLI / no fetch）。檔案一律由你手動貼上 / 存檔。
3. **Admin 永不把文章切成 `ready` / `published`。** 升級狀態一律由你在 VS Code 手動編輯 frontmatter。
4. **`npm run validate:content` 是唯一權威驗證（ground truth）。** Admin 內顯示的所有提示（Ready preflight、registry 對齊、slug collision、長度提示等）都只是 read-only 早期提醒，**不取代** validator。
5. **但 `draft` 文章不會被 `validate:content` 實質驗證。** validator 只掃 `ready` / `published` 文章；`draft` 會被視為「未驗證」，不會針對它報 schema / 欄位錯誤。
6. **因此，必須在 VS Code 手動把 `status` 改成 `ready`（`draft: false`）後，再跑一次 `validate:content`，那一篇才會被正式驗證。**
7. **若 `validate:content` 有任何 error，不得 publish / build / deploy。** 先修到 0 error 再說。
8. **build / deploy 不是本 runbook 的必要步驟**，只列為 optional / out of scope（見 §5）。

---

## 1. 逐步流程（最小 E2E）

### Step 1 — 開 Admin UI（dev-mode-only）

```bash
npm run dev
```

在瀏覽器開 Admin 頁的 `/admin/#new-post-draft` 區塊。Admin 只在 dev 模式出現，`noindex`，不進 production build、不 deploy。

### Step 2 — 填欄位

new-post-draft 目前支援的欄位：

- `site`（select：github / blogger）、`contentKind`（select）、`primaryPlatform`（select，會跟隨 site 自動調整）
- `title`、`titleEn`、`slug`、`date`
- `category`（**registry-bound select**，只列出目前 site 合法分類）
- `tags`（可自由輸入 + 依 site 過濾的 datalist 提示）
- `description`、`searchDescription`、`cover`、`coverAlt`、`body`

過程中會有 read-only 即時提示協助你（皆**不擋匯出**）：

- 字數計數與 SEO 長度提示（description / searchDescription 建議 60–160）
- slug 建議（copy-only，不會覆蓋你填的 slug）
- **slug collision 提示**：若你的 slug 與**載入當下 content 快照**中既有文章重複，會出現 ⚠。此為**較廣的早期提示**——Admin 快照含 `draft` 等所有狀態，而 `validate:content` 之 `duplicate-slug` **僅在 ready / published 之間判定**；因此此 hint 可能比 validator **較早 / 較廣**示警（例如撞到一篇仍是 `draft` 的文章），權威仍以 `validate:content` 為準
- category / tag registry 對齊提示、目前 site 合法 category / tag 參考
- Ready preflight panel：列出離「可轉 ready」還缺哪些 blocking / warning

### Step 3 — 匯出 Markdown

用面板上的按鈕之一：

- **Copy markdown**：複製整份 `.md` 文字到剪貼簿
- **Download `.md`**：直接下載檔案

匯出的內容一定是 `status: "draft"` + `draft: true`（見 §0.1）。

### Step 4 — 手動放進 content

依面板顯示的 **target path** 提示，把檔案存到：

```
content/{site}/posts/{date}-{slug}.md
```

（例如 `content/github/posts/2026-07-02-my-first-note.md`。檔名前綴是 date，slug 是中段；Admin 會幫你組好路徑字串，但**存檔動作由你手動完成**。）

### Step 5 — 第一次 validate（draft 階段）

```bash
npm run validate:content
```

此時你的新檔還是 `draft`，所以 **validator 不會實質驗證它**。事實上新 draft 會在**載入階段就被 loader 過濾掉**（`load-posts.js` 只收 `ready` / `published`），根本不進 validator，因此連 `duplicate-slug` 這類全集合檢查也掃不到它。這一步的意義是：

- 確認你**沒有破壞**既有 `ready` / `published` 文章（此步驗的是既有語料 baseline，**不是**你的新 draft 本身）
- 期望結果：0 error（warning 數量與既有 baseline 相符即可）

> ⚠️ 不要因為「這步過了」就以為新文章已通過驗證——draft 根本沒被載入、沒被驗。**包含 `duplicate-slug` 在內**的權威驗證，要等你在 Step 6 手動轉 `ready` 之後、於 Step 7 才會真正發生。

### Step 6 — 在 VS Code 手動轉 ready

在 **VS Code** 打開該 `.md`，手動把 frontmatter 改成：

```yaml
status: "ready"
draft: false
```

（Admin **永遠不做這步**；這是刻意的人工關卡。）

### Step 7 — 第二次 validate（ready 階段，正式驗證）

```bash
npm run validate:content
```

現在該篇是 `ready`，**才會被 validator 正式檢查**（missing 欄位、unknown / site-mismatch category·tag、duplicate-slug、schema 等）。

- **必須 0 error** 才算這篇通過 Phase 1 E2E。
- 若有 error → 回 VS Code 修 frontmatter / 補 `categories.json` · `tags.json`，再重跑，直到 0 error。**在 0 error 之前不得 publish / build / deploy**（§0.7）。

至此，一篇文章的 Phase 1 人工 E2E 即完成：**Admin 填表 → 匯出 → 放檔 → validate(draft) → 手動轉 ready → validate(ready) 0 error**。

---

## 2. validate:content 語意速查

| 文章狀態 | 會被 validate:content 實質驗證嗎？ |
| --- | --- |
| `draft`（Admin 匯出預設） | ❌ 否（validator 僅掃 ready / published；draft 之 schema / 欄位不被實質檢查，故 Admin 匯出的新草稿在轉 ready 前不會被正式驗證） |
| `ready` | ✅ 是 |
| `published` | ✅ 是 |
| `archived` | 依 validator 設定（通常不進正式輸出） |

要點：**新草稿要被真正驗證，前提是先轉 `ready`。** 這是本流程最容易誤會的一點。

---

## 3. 錯誤處理

- `validate:content` 出現 **error** → **停**。不要 publish、不要 build、不要 deploy。
- 先判讀 error 類型（missing-slug / duplicate-slug / unknown-category / unknown-tag / site-mismatch / schema 等），在 VS Code 手改 frontmatter 或於 `content/settings/*.json` 補登記，再重跑 `validate:content`。
- 重複至 **0 error**。
- warning 不阻擋，但建議逐條看過（Admin 的 Ready preflight 已先給過對應提示）。

---

## 4. Admin UI 界線再次強調（防止誤用）

- Admin **不**是後台編輯器：沒有 Apply / Save / 寫檔 / 登入 / DB / 自動發文。
- Admin 匯出的 `status` 永遠是 `draft`；**要 ready 只能人工在 VS Code 改**。
- Admin 內任何綠燈 / ✓ / preflight 提示都**不是**驗證通過的證明——`npm run validate:content`（且該篇為 ready）才是。

---

## 5. build / deploy（optional / out of scope）

以下**不是** Phase 1 runbook 的必要步驟，僅在你確認 `validate:content` 0 error 後、且另有需要時才做（各自另有規範 / 可能需獨立授權）：

```bash
npm run build:github     # 產出 GitHub Pages 靜態站（optional）
npm run build:blogger    # 產出 Blogger 可貼 HTML / copy-helper（optional）
npm run preview          # 本機預覽 build 結果（optional）
```

- 部署 GitHub Pages（push gh-pages）、重貼 Blogger 後台、GA4 / AdSense 等皆為**發布後**動作，不在本 runbook。
- **在 `validate:content` 未達 0 error 前，一律不得進行上述任何 build / deploy。**

---

## 6. Execution result / 實測結果（2026-07-02，Dean 手動）

Dean 依本 runbook 手動跑完一次最小 E2E（Admin→content→validate→ready）：

- 測試時間：2026-07-02 15:47–16:12
- 測試檔（已刪除）：`content/github/posts/2026-07-02-phase1-e2e-manual-test-1547.md`
- Admin 匯出：`status: "draft"` + `draft: true`（export contract 成立）
- Step 5 draft 階段 `npm run validate:content`：**`0 error / 135 warning / 107 post`**（新 draft 未被 loader / validator 載入）
- Step 6 手動轉 `status: "ready"` + `draft: false`
- Step 7 ready 階段 `npm run validate:content`：**`0 error / 137 warning / 108 post`**（該篇正式納入驗證，hard gate `0 error` 維持）
- dev preview 首頁 + Admin Posts 皆可見測試文章「Phase 1 E2E Manual Test 1547」
- 測試後 Dean 已刪除測試檔，working tree 回 clean baseline；刪檔後 `npm run validate:content` 回到 **`0 error / 135 warning / 107 post`**

判定：**Phase 1 Manual E2E Happy Path PASS**。全程為 Dean 手動；Admin 未自動寫入 repo，未觸碰 build / deploy / Blogger / GA4 / AdSense / Google 後台。

---

## See also

- `docs/20260524-blogger-github-publishing-runbook.md`（Blogger / GitHub 發布向 runbook；本 runbook 專注 Admin→content→validate→ready 上游流程）
- `docs/20260701-github-draft-publish-readiness-checklist.md`（GitHub draft 發布就緒檢查清單）
- `docs/20260701-admin-github-draft-input-guide.md`（Admin new-post-draft 欄位輸入指引）
- `docs/20260630-admin-markdown-export-manual-acceptance-checklist.md`（Admin Markdown 匯出人工驗收清單）
- `CLAUDE.md` §23（發布狀態規則：draft / ready / published / archived）、§26（package.json 指令）

---

## 變更安全性（docs-only）

本檔為 docs-only 新增，**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不改 `CLAUDE.md` / `MEMORY` / `memory`；不觸碰 deploy clone。所述指令由使用者於自己的 VS Code / terminal 手動執行；本檔僅為說明。
