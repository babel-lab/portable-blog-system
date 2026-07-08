# Blogger draft-preview export eligibility 盤點（docs-only inventory）

- 建立日期：2026-07-08（Asia/Taipei）
- 類型：docs-only **inventory / 決策建議**（唯一 mutation = 本 doc 新增；**不**改 source / content / settings / views / scripts / package / lockfile / dist / gh-pages / `.cache` / `CLAUDE.md` / `MEMORY.md`）。
- 觸發來源：Phase 1 第二次人工 E2E（`docs/20260708-phase1-second-manual-e2e-result.md` §E P1-2）發現的 P1：
  > 「測試文章需先改為 build-eligible（`status: ready` / `draft: false`）才能經 `build:blogger` 產生 Blogger HTML。待釐清：Blogger draft-preview 流程應支援 draft-only 文章，或僅支援 ready 文章。」
- 本輪界線（read-only / docs-only）：**不**修改 `build:blogger` 行為、**不**新增 guard、**不**新增 npm script、**不** build、**不**產 dist、**不** deploy、**不**碰 DNS / GitHub Pages settings / Blogger / AdSense / GA4 / GSC。僅盤點現況 + 產出下一步決策建議。

---

## 0. Boot baseline（read-only 驗證）

| Repo | branch | HEAD | 對照 | ahead/behind | tree | index.lock |
| --- | --- | --- | --- | --- | --- | --- |
| Source `/d/github/blog-new/portable-blog-system` | `main` | `38a4e98` | `== origin/main` ✅ | `0 / 0` | clean | absent ✅ |
| Deploy `/d/github/blog-new/portable-blog-deploy` | `gh-pages` | `1170e7e` | `== origin/gh-pages` ✅ | `0 / 0` | clean | absent ✅ |

判定：boot baseline 完全符合 frozen baseline。Deploy clone 僅 read-only 讀取，未寫入。

read-only verification checks（本輪授權實跑）：

| # | 指令 | Exit | 結果 |
| --- | --- | --- | --- |
| 1 | `npm run check:phase1-readiness-contract` | 0 | `22/22 PASS`（6/6 required、6/6 ordered、0/13 forbidden token） |
| 2 | `npm run check:npm-script-targets` | 0 | `48/48 PASS`（47 targets） |
| 3 | `npm run validate:content` | 0 | `0 error / 135 warning / 107 post` |
| 4 | `git diff --check` | 0 | clean |

---

## 1. 問題背景

第二次人工 E2E 的目標之一是驗證 **Blogger draft-preview 鏈路**（內容 → Blogger 可貼 HTML → Blogger 後台 draft/preview，不發布）。

實測流程（E2E result §D Attempt notes）：

1. Attempt 1（失敗）：直接把 raw Markdown 貼進 Blogger → 顯示未渲染的 Markdown 語法。
2. Attempt 2（成功）：改跑 `npm run build:blogger` 產生 HTML，以 Blogger HTML 模式貼上 → 渲染正確。

**摩擦點**：測試文章原為 draft（`status: draft` 或 `draft: true`）。直接跑 `build:blogger` **不會**輸出該文章，Dean 必須先把 frontmatter 改成 `status: ready` / `draft: false`，`build:blogger` 才會為它產生 `dist-blogger/posts/{slug}/post.html`。測試後再手動把文章與 `dist-blogger/` 移除（E2E result §F Repo cleanup）。

因此 P1 的本質問題是：**要手動預覽一篇 draft 的 Blogger 外觀，目前唯一的 HTML 產生器（`build:blogger`）會把 draft 擋掉。**

---

## 2. 目前 build eligibility 規則（實測 source 盤點）

### 2.1 核心過濾器（單一事實來源）

`src/scripts/load-posts.js` 之 `classify(data)`（第 21–28 行）是所有 build 的 status/draft 閘門：

```js
const VISIBLE_STATUS = new Set(['ready', 'published']);

function classify(data) {
  if (data.draft === true) return { include: false, reason: 'draft:true' };
  const status = data.status ?? 'draft';
  if (!VISIBLE_STATUS.has(status)) return { include: false, reason: `status:${status}` };
  return { include: true, reason: 'ok' };
}
```

判定規則（AND，兩條件都要過）：

| 條件 | 通過 | 擋掉（reason） |
| --- | --- | --- |
| `draft` 欄位 | `draft !== true`（false / 缺漏） | `draft === true` → `draft:true` |
| `status` 欄位 | `status ∈ {ready, published}` | 其他值或缺漏（預設 `draft`）→ `status:<值>` |

→ **build eligibility = `draft !== true` AND `status ∈ {ready, published}`**。任一不符即從 dist 濾除。

此規則由 `build:github`（`load-github-posts.js`）與 `build:blogger`（`load-blogger-posts.js`）**共用同一個 `loadPosts` / `classify`**，兩平台 draft 政策一致。

### 2.2 Blogger 專屬額外條件（`load-blogger-posts.js`）

`build:blogger` 的來源有兩個，過濾疊在 §2.1 之上：

| 來源 | 路徑 | 是否納入 | 條件 |
| --- | --- | --- | --- |
| blogger-native | `content/blogger/posts/*.md` | 全部（通過 §2.1 者） | 無額外條件 |
| github-cross | `content/github/posts/*.md` | 有條件 | 須 `publishTargets.blogger.enabled === true`，否則濾除（reason `blogger:disabled`） |

### 2.3 mode 解析（不影響 eligibility，只影響「用哪個模板」）

`publishTargets.blogger.mode`：

- `∈ {full, summary, redirect-card}` → 對應模板。
- 缺漏 / 無效值 → 預設 `full` + warning（不擋 build）。

⚠️ 重點：`build-blogger.js` 的 `--mode=` 旗標（`parseMode`，預設 `build`）**只寫進 console log 與 manifest，不參與 eligibility**。目前**沒有**任何 mode / flag 會讓 `build:blogger` 納入 draft。

### 2.4 slug / date / 其他 metadata

- `slug`：只用於輸出資料夾 `dist-blogger/posts/{slug}/` 與衝突偵測 warning；**不是** eligibility 閘門。
- `date`：只用於排序（date desc, slug asc）；不擋 build。
- 其餘 metadata 缺漏：由 `validate-content.js` 產生 warning，但 warning **不擋** build（0 error 才是硬門檻，而 draft 本身不算 error）。

### 2.5 一句話總結

> `build:blogger` 只會輸出「`draft !== true` 且 `status ∈ {ready, published}`」的文章（github-cross 再加 `publishTargets.blogger.enabled === true`）。**draft-only 文章一律不產生任何 `dist-blogger/` 輸出**，且沒有 preview-only 旁路。

---

## 3. Admin New post draft 與 Blogger Export 的語意（盤點）

### 3.1 Admin markdown export 恆為 draft

`src/scripts/admin-markdown-export.js`（header 第 9 行）：

> `Always emits status: "draft" + draft: true (safest zero-warning path per validate-content.js §READY_STATUS rules).`

- Admin New post draft export **永遠**輸出 `status: "draft"` + `draft: true`。
- **無** ready option、**無** repo write path（Copy markdown / Download `.md` only）。
- `analyzeReadyGap`（同檔）只是**報告**「若日後手動改 ready 還缺什麼」，**不改**匯出輸出。
- guard `check:admin-markdown-export`（256/256）鎖定此契約；category `<select>` registry-bound。

### 3.2 Blogger Export（Admin 頁）現況

per E2E result §E P1-1：Admin Export 頁目前**僅唯讀總覽**，未提供 per-post copy-helper / publish-checklist 開啟按鈕。實際的 Blogger 可貼 HTML / copy-helper / publish-checklist / meta.json 由 `build:blogger` 寫到 `dist-blogger/posts/{slug}/`。

### 3.3 語意衝突（問題根因）

```
Admin export ──► 永遠 draft:true / status:draft
                        │
                        ▼
build:blogger ──► 只收 draft:false 且 status ∈ {ready, published}
                        │
                        ▼
結果：Admin 匯出的 draft 檔，若不手動改 status，永遠不會被 build:blogger 產出 HTML
```

這不是 bug，是兩個**各自正確**的設計相接處的縫：
- Admin 端刻意產 draft（避免草稿被誤當正式輸出、zero-warning）。
- build 端刻意擋 draft（避免草稿進正式 dist / 被 deploy）。
- 但「**人工預覽一篇 draft 的 Blogger 外觀**」這個中間需求，落在兩者之間、目前無專屬路徑。

---

## 4. 「build eligibility」與「Blogger draft preview 需求」的語意差異

| 面向 | build eligibility（現況） | Blogger draft preview（E2E 想做的事） |
| --- | --- | --- |
| 目的 | 產出**正式** dist（可能後續 deploy / 正式貼文） | 只想**在本機/Blogger 後台看外觀**，不發布 |
| 對 draft 的態度 | 一律排除（保護） | 想要**包含** draft 才有意義 |
| 輸出去向 | `dist-blogger/`（正式輸出目錄） | 一次性、看完即丟（E2E 已手動 cleanup） |
| 風險 | 若放寬 → draft 可能混入正式 dist / 被 deploy | 若不放寬 → 要改 frontmatter，易忘記改回 |

**關鍵洞察**：現行行為對「正式 build」而言是**正確**的；E2E 的痛點是「**預覽 draft**」這個獨立語意目前借用了正式 build 管線，才被迫改 status。兩者本質不同。

---

## 5. 問題本質分類（對應 spec §C）

對「build:blogger 不輸出 draft」的定性：

| 選項 | 判定 |
| --- | --- |
| 1. 正確設計：只輸出 ready/published，避免草稿被當正式輸出 | ✅ **成立**（正式 build 語意；也是 deploy 安全的根基） |
| 2. 缺功能：人工 Blogger draft preview 需要一條 preview-only export path | 🟡 **部分成立**（確有此需求，但目前有 workaround，非阻擋） |
| 3. 文件不足：流程應明確要求把測試文章暫時改 ready / draft false | ✅ **成立**（目前 runbook 未明列「暫改 ready → 預覽 → 改回 → cleanup」步驟） |
| 4. 其他 | — |

→ **結論：主因是「1 正確設計」，痛點是「3 文件不足」；「2 缺功能」是可選增強、非必需。** 三者不互斥。

---

## 6. 風險分析

### 6.1 維持現狀（不動）的風險

- 每次要預覽 draft 的 Blogger 外觀，都要手動改 `status: ready` / `draft: false` → 預覽 → 改回 → 刪 `dist-blogger/`。
- **人為疏失風險**：若忘記改回 draft，該文章會在下次正式 `build:blogger` / deploy 時被當成 ready 輸出。此為目前最實際的隱患。
- 目前靠 Dean 手動 cleanup（E2E §F 已證可行），但流程未文件化、不可重複性差。

### 6.2 放寬 build:blogger 收 draft 的風險（**不建議**）

- 直接讓 `build:blogger` 收 draft → draft 進 `dist-blogger/` → 若之後 deploy 該目錄，草稿外洩。
- 破壞 §2.1 共用 `classify` 的單一事實來源；`build:github` 也共用，牽一髮動全身。
- 破壞既有 guard / manifest ready-count 語意；可能連鎖影響 prepublish / readiness checks。
- **紅線衝突**：CLAUDE.md §23「任何 draft 文章不得出現在正式 dist」。→ 直接放寬 = 違規。

### 6.3 新增獨立 preview-only script 的風險（可控）

- 若輸出到**獨立目錄**（例如 `dist-blogger-preview/`）且**該目錄永不 deploy**、加入 `.gitignore`，則不污染正式 dist、不違反 §23。
- 成本：新增一支 script + npm script + 可能的 guard；屬**新功能**，須獨立 phase + explicit approval（CLAUDE.md §5 分階段、§27 修改規則）。
- 仍需注意：preview 輸出仍是 draft 內容，Blogger 後台只可存草稿 / 預覽，**不可發布**（維持既有界線）。

---

## 7. 可選方案

### Option A：維持現狀，只補文件（**推薦**）

- 不動任何 code / build / guard。
- 在 Blogger E2E / draft-preview runbook 明確記載**標準預覽流程**：
  1. 暫時把目標文章 `status: draft → ready`（或 `draft: true → false`）。
  2. `npm run build:blogger`，開 `dist-blogger/posts/{slug}/post.html` / `copy-helper.txt`。
  3. 貼到 Blogger **draft/preview**（不發布）。
  4. **改回** `status: ready → draft`（或 `draft: false → true`）。
  5. 刪除 `dist-blogger/`（或整個目錄不 commit）。
  6. 確認 `git status` clean、無殘留 artifact。
- 可選再加一條「預覽後回退檢查」提醒，降低 §6.1 的忘記改回風險。
- 優點：零 code 變更、零紅線風險、最小 diff、立即可用。
- 缺點：仍是手動、依賴紀律；未根治「忘記改回」隱患（靠 checklist 緩解）。

### Option B：新增 preview-only export script（可選增強，須另開 phase）

- 例如 `build:blogger-preview` / `check:blogger-preview`：讀取指定 slug（或含 draft 的全部），輸出到**獨立、永不 deploy、gitignored** 的 `dist-blogger-preview/`。
- **不改** `build:blogger` / `classify` / 正式 dist 語意。
- 須自帶防護：輸出目錄與正式 dist 隔離、明確標記 PREVIEW ONLY / NOT FOR DEPLOY、文件註記不可發布。
- 優點：根治「改 status → 改回」來回，降低人為疏失。
- 缺點：新增 code + script（可能 + guard）= 新功能，違反「第一版避免過度工程化」的傾向，須獨立 phase + explicit approval 才實作。

### Option C：讓 build:blogger 接受 draft，但加防護（**不建議**）

- 例如加 `--include-draft` flag。
- 即使加防護，仍讓 draft 有機會進正式 `dist-blogger/`，與 §6.2 紅線（CLAUDE.md §23）距離最近、審查成本最高。
- 不建議。

---

## 8. 建議方案與理由

**推薦 Option A（維持現狀 + 補文件），作為本問題的收斂解。**

理由：

1. 現行「build:blogger 不輸出 draft」是**正確且必要**的設計（deploy 安全的根基；CLAUDE.md §23 紅線）。問題本質是文件不足（§5 之「3」），不是 code 缺陷。
2. 已有可行 workaround（E2E §F 已證實 Dean 能手動完成並保持 tree clean），痛點是「未文件化 / 易忘記改回」，補一份 runbook 即可大幅緩解，成本最低、風險最低。
3. 符合專案基調（CLAUDE.md §1「避免過度工程化」、feedback「偏好保守落地」）與分階段紀律（§5）。
4. Option B 是**合理的未來增強**，但屬新功能，應在 Option A 文件化後、若手動流程仍顯繁瑣時，再獨立開 phase + explicit approval 評估——**不在**本輪、也不必立即實作。

---

## 9. 下一個最小 safe slice 建議

- **本輪**：只落地本 inventory doc（docs-only），不改 code / build / guard。
- **下一步（擇一，皆須 explicit approval）**：
  - **S1（最小、推薦）**：docs-only 新增或擴充一份「Blogger draft-preview 標準流程 runbook」（把 §7 Option A 的 6 步 + 回退檢查寫成可重複 checklist）。仍不改 code。
  - **S2（可選、較大）**：若 Dean 認為手動流程仍太繁瑣，另開獨立 phase 評估 Option B preview-only script（含輸出隔離 + gitignore + PREVIEW-ONLY 標記 + guard），需 explicit approval 才實作。
- **不做**：放寬 `build:blogger` 收 draft（Option C）、任何 build / deploy / 動正式 dist / 動 `classify`。

---

## 10. 盤點結論（一句話）

> `build:blogger` 只輸出 `draft !== true` 且 `status ∈ {ready, published}`（github-cross 再加 blogger enabled）的文章，此為**正確的正式-build 設計**；E2E 的 P1 摩擦是「人工預覽 draft」缺一條文件化流程（與可選的 preview-only 旁路），**非** bug。**建議 Option A：維持現狀、補一份 draft-preview runbook**；preview-only script（Option B）留作未來獨立 phase 的可選增強。

---

## 變更安全性（docs-only）

本檔為 docs-only 新增，唯一 mutation = 本檔。**不含**任何程式 / frontmatter / settings / build / deploy / dev-server 變更；不新增 guard / npm script；不改 `CLAUDE.md` / `MEMORY.md` / `memory/`；不觸碰 deploy clone 寫入；未 build / 未產 dist / 未 deploy / 未 push gh-pages / 未發布 Blogger；未購買網域 / 未動 DNS / 未碰 AdSense·GA4·Blogger·GSC 後台。§0 之 checks 為本輪授權 read-only 實跑結果；未新增測試文章 / artifact。所有方案為建議，**未**實作。

## See also

- `docs/20260708-phase1-second-manual-e2e-result.md`（§E P1-2 觸發本盤點）
- `docs/20260708-phase1-second-manual-e2e-test-packet.md`（第二次 E2E 測試包）
- `docs/20260702-phase1-manual-e2e-runbook.md`（第一次 E2E：github-site happy-path）
- `src/scripts/load-posts.js`（`classify` 單一事實來源）、`src/scripts/load-blogger-posts.js`（Blogger 兩來源過濾）、`src/scripts/build-blogger.js`（mode 解析 / 渲染）、`src/scripts/admin-markdown-export.js`（Admin 恆 draft 契約）
- `CLAUDE.md` §23（發布狀態；draft 不得進正式 dist）、§26（package.json 指令）、§5（分階段）、§27（修改規則）
