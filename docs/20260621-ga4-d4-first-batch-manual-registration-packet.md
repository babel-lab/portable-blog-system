# GA4 D4 first-batch — manual registration packet for Dean（docs-only）

- **Phase**：`20260621-ga4-d4-first-batch-manual-registration-packet-docs-only-a`
- **Date**：2026-06-21（Asia/Taipei；evening, 19:32+）
- **Type**：**docs-only manual registration packet**（唯一 mutation = 本檔新增；CLAUDE.md / MEMORY.md / source / settings / content / build / dist 皆不動）
- **Verdict**：**PACKET ONLY — no GA4 backend changes performed**
- **Baseline**：`main` HEAD == origin/main == `260d407`（subject `docs(ga4): plan p2 p3 dimension expansion`）；ahead/behind = 0/0；working tree clean。
- **Predecessors**：
  - `docs/20260617-night-ga4-d1-parameter-naming-spec.md`（D1 spec；§5 single-source naming）
  - `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md`（D4 checklist；4 dimensions table；docs-only；Dean 後台尚未操作）
  - `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md`（P2/P3 roadmap；§8 後續 phase E1/E2/E3 規劃）
- **Scope flag**：**不**改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md；**不** build / 不 deploy / 不 dev / 不 Blogger repost / 不 admin write / 不 safe-write:test / 不 --apply / 不 dryRun:false / 不打 GA4 / AdSense / Blogger / Google Drive / Search Console 後台。

> 本檔之目的：把已 land 之 D4 first-batch checklist **包裝成 Dean 手動 GA4 後台註冊用之操作 packet**，並明確標出註冊完成後須回收哪些 evidence 給下一輪 E1 phase。
>
> ⚠️ 本檔之 land **不代表已完成註冊**；不代表已驗證 evidence；不代表 E1 evidence record 可省略。

---

## 1. Purpose

| 項 | 值 |
| --- | --- |
| 本檔屬性 | **docs-only manual operation packet**（Dean 手動 GA4 後台動作之操作參考） |
| 本檔不屬性 | ❌ 不是 D4 checklist 的取代（checklist 仍以 D4 doc 為 single source of truth） |
| 本檔不屬性 | ❌ 不是 evidence record（evidence 屬下一輪 **E1** phase） |
| 本檔不屬性 | ❌ 不代表已完成 GA4 後台註冊 |
| 本檔不屬性 | ❌ 不代表 Dean 已實際登入 GA4 |
| 本檔不屬性 | ❌ 不代表本 repo 有任何 GA4 後台連線 |
| 適用對象 | Dean（手動於 GA4 Web UI 操作之人類使用者） |
| 適用時機 | Dean 準備啟動 D4 first-batch 註冊；或 Dean 想再次確認 4 個 dimensions 之 spec |

本檔之內容皆可由 D1 spec + D4 checklist 推導；額外提供之價值在於：

1. 提供 Dean 一份操作節奏明確之 packet（GA4 後台路徑 + 4 個 dimensions 之操作 step-by-step）
2. 提前列出 E1 evidence record 之收集要求
3. 重申 red lines（避免操作時誤把 forbidden param 註冊為 dimension）

---

## 2. Source of truth

| Source | 角色 | 備註 |
| --- | --- | --- |
| `docs/20260617-night-ga4-d1-parameter-naming-spec.md` §5 | **權威 single source of truth**（parameter key / display name / scope） | 若 D1 與本檔差異 → 以 D1 為準；本檔若有 drift 須回頭修本檔 |
| `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` §5.1 | first-batch 註冊依據（4 個 dimensions 之選擇與 deferred 範圍） | 本檔之 4 dimensions 完全沿用 D4；不擴張不縮減 |
| `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md` §5 / §6 / §8 | 風險分類與後續觀察 roadmap（補充 first-batch 之外的擴張規劃） | 本檔僅參考；不修改 first-batch scope |
| `docs/ga4-parameter-naming-registry.md` | P1 + UTM naming registry；命名規則（snake_case） | 本檔不重新定義命名 |

### 2.1 Drift rule

若 D1 §5 或 D4 §5.1 與本檔 §3 之欄位不一致 → **以 D1 為準**；本檔須回頭修正。本檔**不**有權力 override D1 之 parameter key / scope。

### 2.2 Display name 沿用

本檔之 display name 沿用 D4 §5.1（已含 D4 §5.2 註記之 display name drift：`Link Provider` / `Link Placement`）。Dean 若不接受該 drift，可在 GA4 後台改回 D1 之 `Affiliate Network` / `Placement`；該 drift 不影響 parameter key（仍為 `provider` / `placement`）。

---

## 3. Registration target

> 本表為 Dean 後台註冊之 4 個 dimensions；全部 **Event-scoped**；全部已 LIVE（GitHub Pages emit）；全部 **zero source change / zero deploy / zero Blogger repost**。
>
> ⚠️ Scope **必須為 Event**；**不可**使用 User-scoped；**不可**使用 Item-scoped；不可註冊 `target_url` / `link_url` / `outbound` 等高 cardinality 欄位（per §5 deferred）。

| # | Display name（GA4 後台 "Dimension name"） | Event parameter（GA4 後台 "Event parameter"） | Scope | Purpose | Risk | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Link Type` | `link_type` | **Event** | 區分連結類型：`affiliate` / `cross_site` / `internal` / `external`；用於 4 個 anchor classes（CTA top / bottom / related / other aside；nav 不注入） | low（4 個 LIVE 值；報表派得上用場） | D1 §5.1 P2-1；P1 註冊批次未含；本次為 P1-strict 補登 |
| 2 | `Link Provider` | `provider` | **Event** | 聯盟通路 displayName（如 `通路王`）；僅 affiliate CTA（top + bottom）注入 | low（目前單一 `通路王`；commerce L2 啟動後可能 → medium） | D1 §5.1 P2-2；對齊 `affiliate-networks.json` 之 `displayName` |
| 3 | `Link Placement` | `placement` | **Event** | 連結版位：`article_top` / `article_bottom` / `related_links` / `other_links`；nav 不注入（以 `click_area=article_bottom_nav` 區分） | low（4 個 LIVE 值） | D1 §5.1 P2-3；報表 filter 須注意 nav `placement=(not set)` |
| 4 | `Link Label` | `link_label` | **Event** | 連結可見文字（多為標題或固定字）；全 5 anchor classes 注入 | high（≒ 文章標題；隨內容線性成長；接受 GA4 自動 `(other)` 聚合） | D1 §5.1 P2-4；標題改字 → dimension 連續性破裂；若 ROI 不足可改用 `target_slug` 替代 |

### 3.1 Scope 強制聲明

| 維度 | 強制值 | 原因 |
| --- | --- | --- |
| Scope | **Event**（全 4 個） | 全為 click event 觸發 |
| ❌ User-scoped | 禁止 | 本 BLOG 系統無會員 / 不識別 user；per CLAUDE.md §29 |
| ❌ Item-scoped | 禁止 | 本系統無 e-commerce items 事件（無 `view_item` / `add_to_cart` / `purchase`） |

### 3.2 Description（建議文案；≤ 50 字；GA4 欄位上限）

| # | 建議 description（Dean 可微調） |
| --- | --- |
| 1 | 連結類型：affiliate / cross_site / internal / external |
| 2 | 聯盟通路 displayName（如 通路王） |
| 3 | 連結版位：article_top / article_bottom / related_links / other_links |
| 4 | 連結可見文字（多為標題或固定字） |

---

## 4. Manual GA4 steps for Dean

> 本節為 Dean 後台手動操作 step-by-step；Claude **不執行**；Claude **不登入 GA4**；本 repo **不打 GA4 Admin API**（per D1 §9 / 本檔 §7 forbidden）。
>
> ⚠️ 本檔不含 measurementId / propertyId / clientId / slotId / 真實帳號資訊；Dean 須以自己之 Google 帳號登入。

### 4.1 GA4 後台導航路徑（英文 UI）

```
GA4
  → Admin
    → Data display
      → Custom definitions
        → Custom dimensions tab
          → Create custom dimensions
```

### 4.2 中文 UI 對照

| 英文 UI | 中文 UI |
| --- | --- |
| Admin | 管理 |
| Data display | 資料顯示 |
| Custom definitions | 自訂定義 |
| Custom dimensions | 自訂維度 |
| Create custom dimensions | 建立自訂維度 |
| Dimension name | 維度名稱 |
| Scope | 範圍 |
| Event parameter | 事件參數 |
| Description | 說明 |
| Save | 儲存 |
| Reports | 報表 |
| Realtime | 即時 |
| Explore | 探索 |
| Free form | 任意形式 |

### 4.3 逐項建立步驟（per dimension；重複 4 次）

每個 dimension 重複以下 7 個步驟：

```
1. 點 "Create custom dimensions"（建立自訂維度）
2. Dimension name = 本檔 §3 該行之 Display name
3. Scope = Event（固定）
4. Event parameter = 本檔 §3 該行之 Event parameter
5. Description = 本檔 §3.2 該行之建議文案（可微調）
6. Save（儲存）
7. 確認該 dimension 出現在 Custom dimensions tab 列表中
```

### 4.4 建議建立順序

| 順位 | Display name | 原因 |
| --- | --- | --- |
| 1 | `Link Type` | P1-strict 補登；最高優先；可立即填入 D5 evidence |
| 2 | `Link Provider` | affiliate CTA only；commerce L2 前先佔位 |
| 3 | `Link Placement` | 4 個 LIVE 值；報表 filter 必備 |
| 4 | `Link Label` | high cardinality；先建好以利後續對齊（即使後台會自動 `(other)` 聚合） |

> 順序可由 Dean 調整；不影響功能。

### 4.5 註冊完成之預期狀態

| 觀察點 | 預期 |
| --- | --- |
| Custom dimensions tab 列表 | 4 個 dimension entries 全部出現（含 Display name + Scope = Event + Event parameter 三欄） |
| Dimension 之 Status | active（GA4 預設） |
| Realtime（30 分內） | 須在註冊**後**新觸發之 click 才會帶 dimension 值；註冊**前**之歷史 click 不會回填 |
| Engagement aggregate | 24~72 hr 後可在 Reports → Engagement → Events 看到 dimension 之 aggregate |
| Explore Free form | 可於 dimension 選單中找到新註冊之 4 個 dimensions |

⚠️ GA4 dimension 註冊**不**回填歷史事件；只有註冊**後**之新事件會 carry dimension 值；Dean 須於註冊完成後**重新點擊** GitHub Pages article 之 4 個 anchor classes 才能驗證。

---

## 5. Evidence Dean should capture for E1

> Dean 於 §4 註冊完成後，須收集以下 evidence 供下一輪 E1 phase（`docs/2026XXXX-ga4-d4-first-batch-evidence-record.md`）使用。
>
> ⚠️ 本檔本身**不**收集 evidence；Dean 收集後須在新 phase 開啟時提供給 Claude。

### 5.1 Per-dimension evidence（4 項；逐項收集）

| Dimension | 須收集之 evidence | 形式 |
| --- | --- | --- |
| `Link Type` | GA4 Admin → Custom definitions 中該 dimension 之截圖（或文字確認）；證明 dimension name + parameter key + scope = Event | 截圖（masked tail4）或文字 |
| `Link Provider` | 同上 | 同上 |
| `Link Placement` | 同上 | 同上 |
| `Link Label` | 同上 | 同上 |

### 5.2 List-level evidence（1 項）

| 觀察 | 須收集之 evidence | 形式 |
| --- | --- | --- |
| Custom dimensions tab 列表 | 顯示 4 個 dimensions 之列表截圖（一張即可） | 截圖（masked tail4） |

### 5.3 Realtime evidence（per dimension；新點擊後 30 分內）

| Dimension | 預期 Realtime 觀察 | 證據 |
| --- | --- | --- |
| `Link Type` | 看到 `link_type=affiliate`（或 `cross_site` / `internal` / `external`）≥ 1 hit | Realtime 截圖（顯示 event_name + dimension 值） |
| `Link Provider` | 看到 `provider=通路王` ≥ 1 hit；非 `(not set)` | 同上 |
| `Link Placement` | 看到 `placement=article_top` 或 `related_links` 或 `other_links` ≥ 各 1 hit | 同上 |
| `Link Label` | 看到非 `(not set)` 之 `link_label` ≥ 1 hit；接受 GA4 自動 `(other)` 聚合 | 同上 |

### 5.4 Explore Free-form evidence

| 觀察 | 預期 | 證據 |
| --- | --- | --- |
| Explore → Free form → Dimensions panel | 4 個新註冊 dimensions 可被選用（出現在 Dimension dropdown 中） | Explore 截圖（顯示 dimension dropdown 含 4 個新 dimensions） |
| Free form 表格內 dimension 之值分布 | 非全 `(not set)`（接受 24~72 hr 之資料累積延遲） | Explore 截圖（顯示 dimension column 之值） |

### 5.5 容錯（若 evidence 未及時呈現，記為 pending 非 FAIL）

> 來源：D4 §7.3。

| 觀察 | 解釋 | 動作 |
| --- | --- | --- |
| Realtime 看到 event 但 dimension 為 `(not set)` | GA4 註冊**不**回填歷史；以新事件為準；新註冊後可能須等資料處理 | 等 24~72 hr 再回查；記為 **pending**，**不**判 FAIL |
| dimension 註冊後 24 hr 仍無資料 | 可能新事件尚未發生；或 parameter key 拼錯 | 先檢查 D1 §5 之 parameter key 拼字；若拼字正確 → 重新點擊 article 之 4 個 anchor classes；記為 **pending**，等 48~72 hr |
| `(not set)` 比例高 | nav anchor 不注入 `placement` / CTA anchor 不注入 `surface` 等 emit-surface 不對稱（per D1 §4.2） | 報表 filter 須先固定 `event_name` + 對應 `click_area` / `placement` 再讀 dimension；屬已知不對稱；**不**判 FAIL |
| Blogger surface 完全無 `click_*` event | Blogger listener 未落地（per D1 §3.3 / §7） | 屬已知 gap；D3 phase 解；本 E1 evidence 範圍**僅** GitHub Pages；記為 **out-of-scope** |

---

## 6. Test click suggestion

> 本節為 Dean 觸發 GA4 dimension 資料**測試方向**；本檔**不要求** Claude 執行；Claude **不**瀏覽 GitHub Pages；Claude **不**自動點擊；Claude **不** claim live verification。

### 6.1 GitHub Pages 端可手動觸發之 4 類 anchor / link 行為

| anchor class | source ejs | 觸發 event_name | 對應 dimension（4 first-batch 中之何者） |
| --- | --- | --- | --- |
| `.lab-affiliate-box__link`（top） | `post-detail.ejs:93` | `click_affiliate_cta` | `link_type=affiliate` + `provider` + `placement=article_top` + `link_label` |
| `.lab-affiliate-box__link`（bottom） | `post-detail.ejs:194` | `click_affiliate_cta` | `link_type=affiliate` + `provider` + `placement=article_bottom` + `link_label` |
| `.lab-related-links__link` | `post-detail.ejs:237` | `click_related_link` | `link_type=*` + `placement=related_links` + `link_label`（+ `link_source_key` conditional） |
| `.lab-other-links__link` | `post-detail.ejs:279` | `click_other_link` | `link_type=*` + `placement=other_links` + `link_label`（+ `link_source_key` conditional） |

### 6.2 額外可觸發之 nav anchor（與 first-batch 不直接相關；但驗證 P1 已註冊 dimensions 仍正常）

| anchor class | source ejs | 觸發 event_name | dimension |
| --- | --- | --- | --- |
| `.lab-article-bottom-nav__link--prev` / `--next` / `--home` | `article-bottom-nav.ejs:18,24,29` | `click_other_link` + `click_area=article_bottom_nav` | P1 `surface` / `click_area` / `nav_direction` / `post_slug` / `target_slug`；first-batch 之 `link_label` 亦有注入；但 first-batch 之 `link_type` / `placement` / `provider` **不**注入（屬已知不對稱；per D1 §4.2） |

### 6.3 建議測試 article（GitHub Pages live page）

| 觀察目標 | 建議 article 屬性 |
| --- | --- |
| affiliate CTA top + bottom | 有 `affiliate.enabled=true` + `affiliate.links[]` 之 book-review post（例：we-media-myself2 dual block） |
| related links + other links aside | 有 `relatedLinks[]` + `otherLinks[]` 之任一 ready post |
| nav 3 anchor | 任一 ready post（autopublished 即有 nav） |

⚠️ 上述建議由 Dean 自由選擇；不必要逐一逐 article 觸發；只需 4 個 anchor classes 各觸發 ≥ 1 次即可。

### 6.4 Claude 端之非執行宣告

| 項 | 聲明 |
| --- | --- |
| Claude 是否瀏覽 GitHub Pages live URL？ | ❌ 否；本 phase 為 docs-only |
| Claude 是否模擬 click？ | ❌ 否 |
| Claude 是否登入 GA4？ | ❌ 否；本 repo 永禁打 GA4 Admin API（per D1 §9） |
| Claude 是否 claim live verification？ | ❌ 否；live verification 屬 E1 evidence record；須 Dean 收集 evidence |
| Claude 是否啟動 dev server / preview？ | ❌ 否 |

---

## 7. Red lines

> 本檔重申 D1 §7 / D4 §6.5 / CLAUDE.md §3a 之 red lines；操作 GA4 後台時須**永禁**之事項。
>
> ⚠️ Dean 後台操作時請務必對齊；Claude 後續任一 phase（含 E1 / E2 / E3）亦須對齊。

### 7.1 GA4 dimension / docs 之 red lines

| 項 | 永禁 | 原因 |
| --- | --- | --- |
| 完整 measurementId（`G-XXXXXXXXXX`） | ❌ 不寫入 docs / `MEMORY.md` / `CLAUDE.md` / 任何 ledger / 任何 archive | naming registry 慣例；本檔僅可 masked tail4 `…PF8VD` |
| AdSense `data-ad-client`（如 `ca-pub-…`）/ `data-ad-slot` | ❌ 不寫入 docs / ledger / 任何 settings 以外位置 | AdSense red line；只存於 `content/settings/ads.config.json` |
| Affiliate dashboard credentials（email / password / OAuth client secret / API key / refresh token / access token / bearer token / Authorization header） | ❌ 不寫入 任何位置 | commerce red line |
| Affiliate dashboard 統計（commission / payout / clickCount） | ❌ 不寫入 任何位置 | 同上 |
| Affiliate tracking URL 之 author token（如 `uid1=<personal-id>`） | ❌ 不註冊為 GA4 dimension；不在 docs 寫完整值 | `link-tracker.js` + `link_url` LIVE 行為；屬非 secret 但 high cardinality |
| Google Forms responses（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows） | ❌ 不進 repo；不寫入 docs / 任何 ledger | download red line |
| Blogger `postId`（猜測值；非 Dean evidence） | ❌ 不猜；不寫入 | metadata backfill rule；per CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3 |
| 精確 `publishedAt`（由 live verification 約略時間推導） | ❌ 不推導；不寫入 | 同上 |

### 7.2 GA4 dimension 註冊行為之 red lines

| 項 | 永禁 |
| --- | --- |
| 註冊 `target_url` 為 custom dimension | ❌；high cardinality；資訊已含於 P1 已註冊之 `target_slug`（per D1 §6 / D4 §6.1） |
| 註冊 `link_url` 為 custom dimension | ❌；very high cardinality；含 affiliate redirect `uid1` token；與 `target_url` 重疊（per D4 §6.2） |
| 註冊 `outbound` 為 custom dimension | ❌；與 `link_type=external` 高度重疊（per D4 §6.2） |
| 註冊任何 full URL 類 dimension | ❌ |
| 註冊 User-scoped custom dimension | ❌；本 BLOG 系統無會員（per CLAUDE.md §29） |
| 註冊 Item-scoped custom dimension | ❌；本系統無 e-commerce items 事件 |
| 註冊任何尚未 LIVE 之 param（如 `content_kind` / `category` / `commerce_link_id`） | ❌；須先 D2 source phase + redeploy + evidence；屬 D4 second batch |
| 註冊 Blogger surface 之 dimension | ❌；Blogger listener 未落地；屬 D3 phase（per CLAUDE.md §29 屬第二階段） |

### 7.3 本 repo / Claude 之 red lines

| 項 | 永禁 |
| --- | --- |
| 使用 GA4 Admin API / Reporting API | ❌；本 repo 永禁；per D1 §9 |
| 由 Claude 登入 GA4 後台 | ❌；本 repo 永禁；Dean 手動操作 |
| 由 Claude 模擬 click / 啟動 browser 自動化 | ❌ |
| 由 Claude 啟動 dev server / preview / build / deploy 來「驗證」GA4 | ❌；屬 Dean 後台 evidence 收集；不需 source / build / deploy |
| 修改 `content/settings/ga4.config.json` 之 `measurementId` / `enabled` / `events[]` 宣告 | ❌；屬另開 source phase + Dean approval |
| 修改 `src/views/tracking/ga4.ejs` 之 4-AND gating | ❌；屬另開 source phase + Dean approval |
| 修改 `src/js/modules/link-tracker.js` 之 delegated listener | ❌；屬另開 source phase + Dean approval |
| 註冊任何 dimension by Claude | ❌；Dean 手動操作 |

---

## 8. Acceptance criteria

### 8.1 PASS 條件（本 docs-only phase）

本 phase 為 **docs-only manual registration packet**；以下全部滿足 → PASS：

1. baseline verify observed 與 phase prompt §Baseline verify 一致（HEAD = origin/main = `260d407`；clean；0/0）
2. 本檔（`docs/20260621-ga4-d4-first-batch-manual-registration-packet.md`）新增成功
3. 內容涵蓋 prompt §Phase §1–§9 所要求之 9 個 section
4. §3 列出 4 個 dimensions 完整對齊 D4 §5.1 / D1 §5
5. §3.1 Event-scoped 強制聲明明確（User/Item 禁止）
6. §7 red lines 明確（含 measurementId / AdSense / affiliate token / Forms responses / postId 猜測 / target_url / link_url / GA4 API / Claude 不登入）
7. §5 evidence blocker 明確（E1 須 Dean evidence；不在本 phase 啟動）
8. 不動 `src/` / `content/` / `settings/` / `package.json` / lockfile / dist / gh-pages / build / deploy / backend / admin-write
9. 本檔 land 後 working tree 回到 clean（除本檔新增以外無 untracked）

### 8.2 FAIL 條件

任一發生 → FAIL：

- baseline verify 不符 → 立即停止；不修正；不 commit
- 本檔誤觸 `src/` / `content/` / `settings/` / `package.json` / lockfile / dist / gh-pages
- 本檔含完整 `measurementId`（非 masked tail4）/ AdSense 真實 client / slot / affiliate token / Forms responses / 猜測之 Blogger postId / publishedAt
- 本檔誤建議「Claude 啟動 GA4 後台註冊」（須 Dean 手動）
- 本檔誤建議「立即註冊 `target_url` / `link_url` / `outbound`」（per §7.2 應永禁）
- 本檔建立 E1 evidence record（屬下一輪 phase；本 phase 不啟動）
- 本檔 claim 已完成 GA4 後台註冊（本檔不代表已完成）
- 本檔誤改 D1 spec / D4 checklist / CLAUDE.md / MEMORY.md

### 8.3 Explicit non-actions（本 phase 完全未做）

| 類 | 範圍 |
| --- | --- |
| GA4 後台 | 未登入；未點 Admin → Custom definitions；未註冊任何 dimension；未打 Realtime / DebugView / Explore；未打 Reporting API / Admin API |
| Source | `src/views/` / `src/scripts/` / `src/js/` / `src/styles/` 全未動 |
| Content | `content/settings/` / `content/github/` / `content/blogger/` / `content/templates/` / `content/drafts/` / `content/archive/` / `content/validation-fixtures/` 全未動 |
| Settings | `content/settings/ga4.config.json` / `ads.config.json` / `affiliate-networks.json` / `commerce-links.json` / `promotion.config.json` / `download-assets.json` / `download-forms.json` 全未動 |
| Build / deploy | `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` 全未動 |
| Package | `package.json` / lockfile / `vite.config.js` 全未動 |
| Meta | CLAUDE.md / MEMORY.md / docs README 全未動 |
| External | GA4 / AdSense / Blogger / Google Drive / Search Console / GitHub Pages 後台全未動 |
| Admin | Admin Apply / middleware / API / `admin-write-cli` / `safe-write:test` / `--apply` / `dryRun:false` 全未動 |
| Migration | npm install / amend / rebase / merge / cherry-pick / force-push / `--no-verify` 全未做 |
| D1 spec / D4 checklist | 全未改 |
| E1 evidence record | 未建立（屬下一輪 phase） |

---

## 9. Next phase

> 本 packet land 後之 next phase 規劃；對齊 `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md` §8 之 E1 / E2 / E3。

### 9.1 E1：D4 first-batch GA4 registration evidence record（docs-only）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only evidence record |
| 目的 | Dean 完成 §4 後台手動註冊 + §6 觸發新 click 後，docs-only 記錄 §5 之 evidence |
| 改 source? | ❌ 否 |
| 改 settings? | ❌ 否 |
| **Blocker** | Dean 已完成 §4 之 4 個 dimensions 後台註冊；Dean 已於 GitHub Pages 重新點擊 §6 之 4 個 anchor classes；Dean 提供 §5 evidence（GA4 後台截圖 / 文字確認） |
| Risk | low |
| Output 建議檔名 | `docs/2026XXXX-ga4-d4-first-batch-evidence-record.md` |
| Mask 規則 | full `measurementId` 不可入；只可 masked tail4 `…PF8VD`；不含 affiliate tracking URL 完整值；不含 AdSense 真實 client / slot；不含 token / credential |

⚠️ **本輪 phase 不建立 E1 evidence record**；E1 之啟動須 Dean 提供 evidence；若 Dean 未提供，E1 record 仍視為 **BLOCKED**。

### 9.2 E2：P2/P3 live GA4 observation record（docs-only）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only observation record |
| 目的 | 觀察 P2（`ai-tools-simplify-daily-workflow`）+ P3（`blog-restart-steady-rhythm-notes`）live posts 之 GA4 表現 |
| **Blocker** | E1 已 land + ≥ 7d / 30d 資料累積期 + Dean 提供 GA4 後台截圖 / 數據 |
| Output 建議檔名 | `docs/2026XXXX-ga4-p2-p3-live-observation-record.md` |

### 9.3 E3：D2 source preflight（optional only）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only preflight；不改 source |
| 目的 | 若 E2 結論為 ROI 不足，對 `content_kind` / `category` / `commerce_link_id` 做 source preflight |
| **Blocker** | E2 結論 + Dean explicit approval |
| Output 建議檔名 | `docs/2026XXXX-ga4-d2-pages-source-preflight.md` |
| 後續 | preflight PASS → 另開 source phase（minimal additive）；本 phase **不**啟動實作 |

### 9.4 推薦優先序

| 優先 | Phase | 條件 |
| --- | --- | --- |
| 1 | E1 | Dean 完成 §4 註冊 + 觸發 §6 click + 提供 §5 evidence |
| 2 | E2 | E1 PASS + ≥ 7d / 30d 觀察期 |
| 3 | E3 | 僅在 E2 結論為「ROI 不足」時啟動；可永久跳過 |

⚠️ **不**主動推進 E1 / E2 / E3 之任一；皆等 Dean 顯式批准。

### 9.5 不列為候選（受 CLAUDE.md §29 / red line 約束）

per `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md` §8.5；本檔不重述。摘要：Blogger listener 落地 / Blogger reverse UTM deploy / Admin write path 啟用 / FB sidecar 真實寫入 / Blogger AdSense Batch 2 live repost / AdSense / commerce real id emit / 完整 measurementId 或 AdSense client / slot 寫入 docs / Blogger postId 猜測 / GA4 Admin API 連線 — 皆**不**列入本檔之 next phase 建議。

---

## 10. Cross-links

- `docs/20260617-night-ga4-d1-parameter-naming-spec.md`（D1；§5 single-source naming；本 packet 之 parameter key / display name 權威）
- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md`（D4；§5.1 4 dimensions checklist；§6 deferred / excluded；§7 D5 evidence handoff；本 packet 之 first-batch scope 權威）
- `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md`（P2/P3 roadmap；§5 risk classification；§8 next phase E1/E2/E3 規劃）
- `docs/ga4-parameter-naming-registry.md`（P1 naming + UTM；命名規則 snake_case）
- `docs/ga4-link-tracking-spec.md`（既有 event design / param union / placement enum）
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md`（P1 5 dimensions 註冊紀錄；本 packet 之 first-batch 為 P2 + P1-strict 補登）
- `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`（P1 報表 PASS）
- `docs/20260615-ga4-cross-surface-parameter-management.md`（cross-surface spec）
- `docs/blogger-listener-strategy.md`（Blogger listener 不對稱；D3 預備）
- `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（current state；保守路徑）
- `content/settings/ga4.config.json`（masked tail4 `…PF8VD`；events 宣告清單；本 phase 未動）
- `src/views/tracking/ga4.ejs`（gtag loader；4-AND gating；本 phase 未動）
- `src/js/modules/link-tracker.js` / `src/js/modules/ga4-events.js`（listener + trackEvent；本 phase 未動）
- `src/views/layout/article-bottom-nav.ejs`（nav 3 anchor；8 個 `data-ga4-*` attr；本 phase 未動）
- `src/views/pages/post-detail.ejs:93,194,237,279`（4 處 inline ga4 anchor；本 phase 未動）
- CLAUDE.md §3a Core operating rules / §3a Red lines / §24 / §29

---

（本文件結束）
