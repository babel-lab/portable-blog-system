# GA4 D4 — first batch manual registration checklist（docs-only）

- **Phase**：`20260617-night-ga4-d4-first-batch-registration-checklist-docs-only-a`
- **Date**：2026-06-17（Asia/Taipei；night, 23:55+）
- **Type**：**docs-only manual registration checklist**（唯一 mutation = 本 doc 新增；CLAUDE.md / MEMORY.md / source / settings / content / build / dist 皆不動）
- **Verdict**：**CHECKLIST ONLY — no GA4 backend changes**
- **Baseline**：`main` HEAD == origin/main == `4c799a5b97c01518784341e1eec27ded730b04e2`（short `4c799a5`；subject `docs(ga4): specify parameter naming`）；ahead/behind = 0/0；working tree clean。
- **Predecessor**：`docs/20260617-night-ga4-d1-parameter-naming-spec.md`（同日；§5 recommended table + §9.2 D4 first batch handoff）
- **Scope flag**：**不**改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md；**不** build / deploy / dev / Blogger repost / admin write / safe-write:test / --apply / dryRun:false / 打 GA4 / AdSense / Blogger / Google Drive / Search Console 後台。

> 本檔目的：把 D1 naming spec §9.2 之 first batch（4 個 LIVE event parameters），整理成 Dean 之後可在 GA4 後台 Admin → Custom definitions → Create custom dimensions 逐項勾選之 manual checklist。
>
> ⚠️ 本 phase **不**登入 GA4 後台；**不**註冊任何 dimension；**不**改 source；**不**改 settings；**不** deploy。Dean 後台操作須另行人工完成；本檔之 PASS 不代表已註冊。

---

## 1. Baseline verify observed

```
pwd                                     /d/github/blog-new/portable-blog-system
branch                                  main
HEAD                                    4c799a5b97c01518784341e1eec27ded730b04e2
origin/main                             4c799a5b97c01518784341e1eec27ded730b04e2
ahead / behind                          0 / 0
working tree                            clean
latest subject                          docs(ga4): specify parameter naming
npm run validate:content                0 errors / 94 warnings / 84 issue-posts（對齊 CLAUDE.md §3a baseline）
```

baseline 與 phase prompt §A 完全一致。inspection 全為 `Read` / `Grep`；未觸 receive 任何受控檔案。

---

## 2. Scope summary

| 動作 | 範圍 |
| --- | --- |
| 新增 | `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md`（本檔） |
| 修改 | **無** |
| 已跑（read-only） | baseline git 7 件、`npm run validate:content`、`Read` inspect `docs/20260617-night-ga4-d1-parameter-naming-spec.md` / `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md` / `docs/20260615-ga4-custom-dimensions-registration-checklist.md` / `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` |
| 未動 | `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `.cache/` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md / docs/README |
| 未跑 | build / build:github / build:blogger / build:promotion / build:sitemap / deploy / preview / dev server / `safe-write:test` / `admin:write` / `admin-write-cli` / `--apply` / `dryRun:false` / Blogger / GA4 / AdSense 後台 / npm install / amend / rebase / force-push |

---

## 3. Preconditions

| 項 | 狀態 | 來源 |
| --- | --- | --- |
| GA4-D1 naming spec land | ✅ | `docs/20260617-night-ga4-d1-parameter-naming-spec.md`（HEAD `4c799a5`） |
| GA4-D1 §5.1 recommended table land | ✅ | D1 spec §5.1 P2-1 / P2-2 / P2-3 / P2-4 |
| GA4-D1 §9.2 first batch handoff land | ✅ | D1 spec §9.2 |
| GA4 P1 dimensions registered | ✅ | `docs/20260615-ga4-p1-custom-dimensions-registration-record.md`（`click_area` / `nav_direction` / `post_slug` / `target_slug` / `surface`） |
| 4 個 first batch params 已 LIVE 於 GitHub Pages | ✅ | D1 spec §4.2 / §8.1 |
| 本 repo **不**打 GA4 Admin API | ✅ | 永禁；per D1 §9 / 本檔 §8 |
| 本輪不操作 GA4 後台 | ✅ | 本 phase scope flag |
| Dean 之後須**手動登入** GA4 後台操作 | ⏭ | 屬 D4 後續實作；不在本檔 scope |

---

## 4. Manual GA4 path（Dean 後台操作通用 SOP）

> Dean 於本 checklist 落地後，可依下列 GA4 後台路徑逐項建立 custom dimensions。

```
GA4 後台
  → Admin（管理）
    → Data display（資料顯示）
      → Custom definitions（自訂定義）
        → Custom dimensions tab
          → Create custom dimensions（建立自訂維度）
            → Dimension name = §5 各行之 Display name
            → Scope = Event
            → Event parameter = §5 各行之 Parameter
            → Description = §5 各行之 Description（≤ 50 字；GA4 欄位上限）
            → Save
```

GA4 路徑命名以英文 UI 為主；中文 UI 對照：

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

⚠️ Dean 操作時請固定 Scope = **Event**；**不**選 User / Item。

---

## 5. First batch checklist table（4 個 LIVE dimensions）

> 本表沿用 D1 spec §5.1 與 §9.2；Display name 沿用 D1 spec（GA4 後台用英文 UI 命名）；中文對照僅供 Dean 識別。
>
> 共同 column 定義：
>
> - **#** = 建議建立順序（Dean 可調整；不影響功能）
> - **☐** = Dean 後台註冊勾選欄
> - **Display name** = GA4 後台 "Dimension name" 欄；沿用 D1 spec §5.1
> - **Event parameter** = `data-ga4-param-{key}` 對應之 GA4 event parameter key（snake_case）
> - **Scope** = Event（全 4 個固定 Event）
> - **Description（建議文案）** = ≤ 50 字；Dean 可依需求微調
> - **Source event(s)** = 該 param 出現於哪個 event_name；含 placement 細粒度
> - **Current emit status** = 是否已實際送出（LIVE）；GitHub Pages 為唯一 emit surface
> - **Cardinality risk** = low / medium / high
> - **Registration priority** = P1-strict（補登）/ P2
> - **DebugView evidence expectation** = D5 phase 驗證最小集
> - **Notes** = 補充

### 5.1 Checklist table

| # | ☐ | Display name | Event parameter | Scope | Description（建議文案 ≤ 50 字） | Source event(s) | Current emit status | Cardinality risk | Registration priority | DebugView evidence expectation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ☐ | Link Type | `link_type` | Event | 連結類型：affiliate / cross_site / internal / external | `click_affiliate_cta`（top + bottom）/ `click_related_link` / `click_other_link`（aside；nav 無） | LIVE | low（4 個 LIVE 值） | **P1-strict（補登）** | Realtime 看到 `link_type=affiliate` ≥ 1 hit；Explore 看到 `link_type × event_name` 分桶 | D1 §5.1 P2-1；P1 註冊批次未含；本輪建議優先補登 |
| 2 | ☐ | Link Provider | `provider` | Event | 聯盟通路 displayName（如 通路王） | `click_affiliate_cta`（top + bottom） | LIVE | low（目前單一 `通路王`；commerce L2 後可能 → medium） | **P2** | Realtime 看到 `provider=通路王` ≥ 1 hit；非 `(not set)` | D1 §5.1 P2-2；對齊 `affiliate-networks.json` 之 `displayName`；commerce L2 啟動可拓展 |
| 3 | ☐ | Link Placement | `placement` | Event | 連結版位：article_top / article_bottom / related_links / other_links | `click_affiliate_cta` / `click_related_link` / `click_other_link`（aside；nav 無） | LIVE | low（4 個 LIVE 值） | **P2** | Realtime 看到 `placement=article_top` / `related_links` / `other_links` ≥ 各 1 hit | D1 §5.1 P2-3；nav 之 placement 概念由 `click_area=article_bottom_nav` 承擔；報表 filter 須注意 nav `placement=(not set)` |
| 4 | ☐ | Link Label | `link_label` | Event | 連結可見文字（多為標題或固定字） | 全 5 anchor classes（CTA top / bottom / related / other / nav） | LIVE | high（≒ 標題；隨文章增加） | **P2（caution）** | Realtime 看到非 `(not set)` 之 `link_label` ≥ 1 hit；接受未來 GA4 自動 `(other)` 聚合 | D1 §5.1 P2-4；標題改字 → dimension 連續性破裂；ROI 觀察期；若不足可改用 `target_slug` 替代 |

### 5.2 Display name 沿用聲明

| Display name | D1 spec 來源 | 本檔 |
| --- | --- | --- |
| Link Type | D1 §5.1 P2-1 | 沿用 D1 |
| Link Provider | D1 §5.1 P2-2 標 "Affiliate Network" | 本檔調整為 "Link Provider"（沿用 D1 之 parameter `provider`；display name 改為 provider 對齊；理由：commerce L2 啟動後可能含非 affiliate 通路，"Link Provider" 較中性，避免之後 rename 造成 GA4 dimension 連續性破裂） |
| Link Placement | D1 §5.1 P2-3 標 "Placement" | 本檔加 "Link" 前綴對齊 1 / 2 / 4（"Link Type" / "Link Provider" / "Link Label"）；GA4 後台檢索可用前綴 "Link " 一次列出 4 個 dimensions |
| Link Label | D1 §5.1 P2-4 | 沿用 D1 |

> ⚠️ 顯示名 drift（P2-2 / P2-3）已於本檔 §5.2 明示；若 Dean 不接受該調整，可全沿用 D1 之 "Affiliate Network" / "Placement"；該 drift 不影響 parameter key（仍為 `provider` / `placement`），不影響資料正確性。
>
> 不論是否接受，本檔之 source-of-truth 仍以 D1 為主；若 Dean 接受本檔之顯示名 drift → 後續 D5 evidence record / 未來 D2 / D3 docs 須一併採用 "Link Provider" / "Link Placement"；若不接受 → 後續沿用 D1 之 "Affiliate Network" / "Placement"。

---

## 6. Explicitly deferred / excluded

> 本 first batch 嚴格只含 §5.1 之 4 個 LIVE dimensions。下列項目**不**在本 first batch 範圍，由 Dean 之後若評估有 ROI 不足時，再開新 phase 處理。

### 6.1 Deferred（已 LIVE 但不建議註冊；建議 skip first batch）

| param | 原因 | 替代方案 | 何時可解封 |
| --- | --- | --- | --- |
| `target_url` | high cardinality；資訊已含於 P1 已註冊之 `target_slug`；註冊只浪費 GA4 配額 | 用 `target_slug` dimension；URL 可在 GA4 Explore 用 `event_params.target_url` 串（不註冊） | Dean 確認 GA4 Explore 串 event_params 不便利時可重新評估；屬 D1 §5.2 / §6 之 deferred |

### 6.2 Not recommended（已 LIVE 但概念重疊或極高 cardinality）

| param | 原因 | 替代方案 | 何時可解封 |
| --- | --- | --- | --- |
| `link_url` | very high cardinality；含 affiliate redirect 之 `uid1` / `uid2` tracking param；與 `target_url` 概念重疊 | 用 `link_type=affiliate` + `provider` filter；具體 URL 觀察用 GA4 Explore；未來個別 affiliate 觀察改用 `commerce_link_id`（D1 P2-8） | 不建議解封 |
| `outbound` | 與 `link_type` 高度重疊（`link_type=external` 已可推） | 用 `link_type=external` filter | 不建議解封 |
| `link_source_key` | LIVE 但 conditional（entry 提供 `sourceKey` 才 emit）；採用率低；報表易 `(not set)` | 待 `sourceKey` 採用率提升再評估 | 屬 D1 P3-1；本 first batch 不含 |

### 6.3 Optional / low ROI（已 LIVE 但 ROI 低；不列 first batch）

| param | 原因 | 替代方案 | 何時可解封 |
| --- | --- | --- | --- |
| `outbound`（重述） | low ROI；報表用 filter 即可推 | 同 6.2 | 不建議解封 |

### 6.4 Blocked（須 source change 或外部 evidence；不可猜測）

| 項 | 阻擋條件 | 備註 |
| --- | --- | --- |
| `content_kind` / `category` / `commerce_link_id` / `tag_count` / `series_key` / `merchant_key` / `label_override_present` / `surface_ads_enabled` | 屬 D1 §5.3 / §5.4 之 future candidate；尚未 emit；屬 D2 source preflight scope | D4 second batch；per D1 §9.3；本 first batch 不含 |
| Blogger `postId` / `publishedAt` | metadata backfill rule；blocked by Dean evidence 提供；不可由 live verification 約略時間推導；屬 CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3 | 不在 GA4 dimension scope；屬 frontmatter metadata；永禁猜測 |
| Blogger `click_*` events 之 dimensions | Blogger listener 未落地；per D1 §3.3 / §7；屬 D3 preflight scope | 本 first batch 僅 GitHub Pages |

### 6.5 Forbidden（red line；永禁 emit + 永禁註冊）

| 項 | 原因 | source rule |
| --- | --- | --- |
| AdSense real `data-ad-client`（如 `ca-pub-…`）/ `data-ad-slot` | AdSense red line；只存於 `content/settings/ads.config.json` | CLAUDE.md §3a Red lines / AdSense |
| Affiliate dashboard credentials（email / password / OAuth client secret / API key / refresh token / access token / bearer token / Authorization header） | commerce red line | CLAUDE.md §3a Red lines / Commerce |
| Affiliate dashboard 統計（commission / payout / clickCount） | 同上 | 同上 |
| Affiliate tracking URL 中之 author token（如 `uid1=<personal-id>`） | 非 secret 但**不**註冊為 dimension；已存於 `link_url`（亦不註冊；per §6.2） | `link-tracker.js` + `link_url` LIVE 行為 |
| Google Forms responses（email / 姓名 / 電話 / 學校 / 答覆） | download red line | CLAUDE.md §3a Red lines / Download |
| Blogger `postId`（猜測值；非 Dean evidence） | metadata backfill rule | CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3 |
| 精確 `publishedAt`（由 live verification 約略時間推導） | 同上 | 同上 |
| 完整 GA4 `measurementId` 寫入 docs / `MEMORY.md` / 任何 ledger | naming registry 慣例；本檔僅可 masked tail4 `…PF8VD` | `docs/ga4-parameter-naming-registry.md` §1 |
| 完整 AdSense client / slot 寫入 docs / `MEMORY.md` / 任何 ledger | AdSense red line | CLAUDE.md §3a Red lines |

> ⚠️ 本檔遵守該 red line：全文不含完整 `measurementId`（僅 masked tail4 `…PF8VD`）、不含 AdSense 真實 client / slot、不含 affiliate tracking URL 完整值、不含 token / credential、不含猜測之 Blogger postId / publishedAt。

---

## 7. D5 evidence record handoff

> Dean 完成 GA4 後台手動註冊本 first batch 之 4 個 dimensions 後，下一輪 D5 phase 之 docs（建議檔名：`docs/2026XXXX-ga4-d5-first-batch-evidence-record.md`）將以本檔為設計輸入；本節定義 D5 所需資料與容錯。

### 7.1 D5 之收集資料（per dimension）

| 項 | 形式 | 備註 |
| --- | --- | --- |
| GA4 Admin → Custom definitions 中該 dimension 之截圖或文字確認 | 截圖（masked tail4）或文字 | 確認 dimension name + parameter key + scope = Event |
| GA4 Reports → Realtime → Events → 觸發近 30 分內事件之 param 值 | 截圖或文字 | 對應 §5.1 之 "DebugView evidence expectation" |
| GA4 Reports → Engagement → Events → 對應 event_name 之 aggregate | 截圖或文字 | 6h~30d aggregate；屬延遲視窗 |
| GA4 Explore → Free form → 加入新註冊之 dimension → 確認非全 `(not set)` | 截圖或文字 | 確認 dimension 可被選用且有值 |
| 每個 dimension 是否在事件參數中出現 | 對齊 §5.1 之 Source event(s) | 確認 surface = GitHub Pages |

### 7.2 D5 之 PASS / PARTIAL / FAIL 判定

對齊 D4 batch 之每一 dimension 寫一行 verdict：

| dimension | 期望 |
| --- | --- |
| Link Type | Realtime 看到 `link_type=affiliate` ≥ 1 hit；Explore 看到 `link_type × event_name` 分桶 |
| Link Provider | Realtime 看到 `provider=通路王` ≥ 1 hit；非 `(not set)` |
| Link Placement | Realtime 看到 `placement=article_top` / `related_links` / `other_links` ≥ 各 1 hit |
| Link Label | Realtime 看到非 `(not set)` 之 `link_label` ≥ 1 hit；接受未來 GA4 自動 `(other)` 聚合 |

### 7.3 D5 之容錯（DebugView / Realtime 延遲時記為 pending 而非 fail）

| 觀察 | 解釋 | 動作 |
| --- | --- | --- |
| Realtime 看到 event 但 dimension 仍為 `(not set)` | GA4 註冊**不**回填歷史；以新事件為準；新註冊後可能須等資料處理 | 等 24~72 hr 再回查；記為 **pending**，**不**判 FAIL |
| dimension 註冊後 24 hr 仍無資料 | 可能新事件尚未發生；或 dimension 設定錯誤（parameter key 拼錯） | 先檢查 D1 spec §5 之 parameter key；若拼字正確 → 重新點擊 article 之 4 個 anchor classes（CTA top / bottom / related / other）；記為 **pending**，等 48~72 hr |
| `(not set)` 比例高 | nav anchor 不注入 `placement`；CTA / related / other 不注入 `surface` / `click_area` / `nav_direction` / `target_slug` / `target_url`；屬 emit-surface 不對稱（per D1 §4.2） | 報表 filter 須先固定 `event_name` + 對應 `click_area` / `placement` 再讀 dimension；屬已知不對稱；**不**判 FAIL |
| Blogger surface 完全無 `click_*` event | Blogger listener 未落地（per D1 §3.3 / §7） | 不需驚訝；屬已知 gap；D3 phase 解；本 D5 範圍**僅** GitHub Pages；記為 **out-of-scope** |
| Realtime 看到非預期 `placement` 值 | 可能 source 端有更新 | 回查 `src/views/pages/post-detail.ejs:93,194,237,279` 之 `data-ga4-param-placement` 值；對齊 D1 §4.2 之 LIVE inventory |

### 7.4 D5 之 SOP 重申（per D1 §10.1）

```
1. 開新 phase docs：docs/2026XXXX-ga4-d5-first-batch-evidence-record.md
2. 引用本檔（D4）+ D1 spec
3. Dean 於下列 GA4 介面收集 evidence：
   - Admin → Custom definitions → 註冊狀態截圖（per dimension）
   - Reports → Realtime → Events → 觸發近 30 分內事件之 param 值
   - Reports → Engagement → Events → 對應 event_name 之 6h~30d aggregate
   - Explore → Free form → 加入新註冊之 dimension → 確認非全 `(not set)`
4. 截圖貼入 docs（masked sensitive：full measurementId 不可入；只可 tail4 `…PF8VD`）
5. 對齊 D4 batch 之每一 dimension 寫一行 verdict：PASS / PARTIAL / FAIL / pending
6. D5 phase 不改 source；不註冊；僅紀錄 evidence
```

⚠️ D5 SOP 嚴禁：

- 不要求 source change / deploy
- 不打 GA4 Admin API / Reporting API
- 不在 docs 寫完整 `measurementId`
- 不在 docs 寫完整 AdSense client / slot
- 不在 docs 寫 affiliate tracking URL 完整值
- 不寫猜測之 Blogger postId / publishedAt

---

## 8. Safety note

| 項 | 聲明 |
| --- | --- |
| 本 checklist 之 status | docs-only；本檔之 land 不代表已註冊 |
| 本 repo 之 GA4 後台連線 | **本 repo 不打 GA4 Admin API**；永禁；per D1 §9 / 本檔 §6.5 |
| 本輪是否有 backend change | **無**；source / settings / GA4 後台 / dist / gh-pages 皆未動 |
| Dean 後台操作 | 須另行人工完成（GA4 Web UI）；不在本檔 scope |
| D5 evidence 之 source change 需求 | **無**；D5 phase 只記 evidence，不修 source |
| 本 first batch 之擴張規則 | 嚴格只含 §5.1 之 4 個 LIVE dimensions；不可在本 first batch 加 `target_url` / `link_url` / `outbound` / `link_source_key`（per §6） |
| D2 / D3 之啟動條件 | per D1 §11；本 first batch 之 ROI 評估後才考慮；不在本檔 scope |
| 本檔之 source-of-truth | D1 spec；本檔之顯示名 drift 限於 §5.2 註記之範圍；不可影響 parameter key |

---

## 9. Explicit no-touch confirmation

### 9.1 本 phase 完全未動

| 類 | 範圍 |
| --- | --- |
| source | `src/views/` / `src/scripts/` / `src/js/` / `src/styles/` |
| content | `content/settings/` / `content/github/` / `content/blogger/` / `content/templates/` / `content/drafts/` / `content/archive/` / `content/validation-fixtures/` |
| settings | `content/settings/ga4.config.json`（measurementId / enabled / events 宣告皆未動） / `content/settings/ads.config.json`（real client/slot 未讀寫） / `content/settings/affiliate-networks.json`（無動） / `content/settings/promotion.config.json`（無動） / `content/settings/commerce-links.json`（無動） |
| build / deploy | `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` |
| package | `package.json` / lockfile / `vite.config.js` |
| meta | CLAUDE.md / MEMORY.md / docs README |
| external | GA4 後台 / AdSense / Blogger / Google Drive / Search Console / GitHub Pages 後台 |
| admin | Admin Apply / middleware / API / `admin-write-cli` / `safe-write:test` / `--apply` / `dryRun:false` |
| payload | payload files / 第三次 write |
| migration | npm install / amend / rebase / force-push |

### 9.2 本 phase **不**修改 D1 spec / 不新增其他 docs

- 本檔**不**回頭改 D1 spec §5.1（顯示名 drift 之選擇權留給 Dean；per §5.2）
- 本檔**不**新增 D5 evidence record（屬下一輪 phase）
- 本檔**不**新增 D2 / D3 preflight（屬 D4 first batch 落地 + Dean ROI 評估後之 path）

---

## 10. Validation / checks

| 指令 | 結果 | 備註 |
| --- | --- | --- |
| `pwd` | `/d/github/blog-new/portable-blog-system` | baseline §1 |
| `git branch --show-current` | `main` | baseline §1 |
| `git rev-parse HEAD` | `4c799a5b97c01518784341e1eec27ded730b04e2` | baseline §1 |
| `git rev-parse origin/main` | `4c799a5b97c01518784341e1eec27ded730b04e2` | baseline §1 |
| `git rev-list --left-right --count origin/main...HEAD` | `0 0` | baseline §1 |
| `git status -sb` | working tree clean（除本檔新增）| baseline §1 |
| `git log -1 --pretty=format:%s` | `docs(ga4): specify parameter naming` | baseline §1 |
| `npm run validate:content` | 0 errors / 94 warnings / 84 issue-posts | 對齊 CLAUDE.md §3a baseline；無 regression |

未跑（per §F 禁止 / §G 不確定即 skip）：

- `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`：禁止；屬風險 script
- `npm run preview` / dev server：禁止
- `npm run check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output` / `check:commerce-affiliate-resolver` / `check:admin-governance-aggregation` / `report:validation` / `check:validation-report` / `check:admin-validation-consume`：本 phase 與 AdSense / commerce / admin 無關；per CLAUDE.md §3a baseline 之 carry-forward 規則，**不重跑**
- `safe-write:test` / `admin:write` / `admin-write-cli` / `--apply` / `dryRun:false`：禁止
- GA4 後台 / AdSense / Blogger / Google Drive / Search Console / GitHub Pages 後台：禁止

---

## 11. Recommended next step

### 11.1 即時（本檔 land 之後）

| Option | 內容 | 性質 |
| --- | --- | --- |
| **A. Dean 啟動 first batch 註冊** | 依本檔 §4 / §5 於 GA4 後台手動建立 4 個 custom dimensions；屬 docs-only 之外部 backend action | 外部後台操作；不影響本 repo |
| **B. 待 first batch 註冊 + 觸發新 click 後**，開新 D5 phase docs 收集 evidence | 屬 docs-only；前提：A 已落地 + Dean 已於 GitHub Pages 重新點擊 article 之 4 個 anchor classes | docs-only |
| **C. 不主動推進；保守路徑** | 維持 CLAUDE.md §3a 之 idle freeze；不啟動 D5；屬 `docs/20260617-night-project-status-and-next-paths-checkpoint.md` §6 Path A | 保守 |

### 11.2 中期（D4 first batch + D5 evidence land 後）

| Option | 內容 | 性質 |
| --- | --- | --- |
| **D. Dean ROI 評估** | 若 4 dimensions 已能切分行為 → 停止擴張；省下 GA4 配額 | 評估 |
| **E. D2 preflight** | 若 ROI 不足 → 評估 `content_kind` / `category` / `commerce_link_id` 之 source wiring；屬 D1 §5.3 之 future candidate；docs-only preflight | docs-only |
| **F. D3 preflight** | Blogger listener；屬 D1 §11.2 條件式；建議擱置，與 AdSense ramp / Reverse UTM pm-26 deploy gate 一起評估 | docs-only / 擱置 |

### 11.3 長期（≥ Phase 2）

- Blogger listener 屬第二階段（per CLAUDE.md §29）；不在本檔 scope
- Custom metrics（`link_position_index` / `article_word_count`）暫不啟動
- AdSense / commerce real id 永禁 emit；維持 red line

### 11.4 本 phase 之 self-discipline

- 本檔之 source-of-truth = D1 spec
- §5.2 之顯示名 drift（Link Provider / Link Placement）為本檔提案；若 Dean 不接受 → 沿用 D1 之 "Affiliate Network" / "Placement"；該 drift 不影響 parameter key
- 不在本檔 freeze ROI 判斷；屬 Dean 後台操作後之 D5 evidence + 跨 phase 評估

---

## 12. Cross-links

- `docs/20260617-night-ga4-d1-parameter-naming-spec.md`（本檔之 predecessor；§5.1 / §9.2 first batch handoff）
- `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md`（D1 之 predecessor；候選來源 + D1～D5 phase 計畫）
- `docs/ga4-parameter-naming-registry.md`（P1 naming + UTM；命名規則對齊）
- `docs/ga4-link-tracking-spec.md`（既有 event design / param union / placement enum）
- `docs/20260615-ga4-custom-dimensions-registration-checklist.md`（am-7；P1 註冊清單；本檔 mirror 之 D4 first batch）
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md`（am-9；P1 註冊紀錄）
- `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`（pm-1；P1 報表 PASS）
- `docs/20260615-ga4-cross-surface-parameter-management.md`（am-8；cross-surface spec）
- `docs/blogger-listener-strategy.md`（Blogger listener 不對稱；D3 預備）
- `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（current state；Path A 保守）
- `content/settings/ga4.config.json`（masked tail4 `…PF8VD`；events 宣告清單）
- `src/views/tracking/ga4.ejs`（gtag loader；4-AND gating）
- `src/js/modules/link-tracker.js` / `src/js/modules/ga4-events.js`（listener + trackEvent）
- `src/views/layout/article-bottom-nav.ejs`（nav 3 anchor；8 個 `data-ga4-*` attr）
- `src/views/pages/post-detail.ejs:93,194,237,279`（4 處 inline ga4 anchor；含 bottom CTA）

---

（本文件結束）
