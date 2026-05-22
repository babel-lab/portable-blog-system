# Ad / Affiliate Schema Proposal

本文件為 BLOG 系統之**廣告 / 聯盟行銷區塊統一 metadata schema proposal**；屬 docs-only governance spec，**不**代表已實作；本批 phase `20260522-day-1-ad-affiliate-schema-proposal-a` **不**修改任何 source / template / settings / build / deploy。

對應上層：
- `docs/click-tracking-governance.md`（GA4 click event / placement / provider / campaign 治理；本提案對齊其命名）
- `docs/20260522-day-1-readonly-a-report.md` §2 模組 4（識別此 schema gap）
- `CLAUDE.md` §12（書評文章 affiliate 規則）/ §16.2（聯盟連結 rel）/ §17（文章頁版型；含 Optional Affiliate Box）
- `content/settings/ads.config.json`（當前偏 Google AdSense）
- `content/settings/affiliate-networks.json`（當前記錄通路王 / 聯盟網）

---

## 1. Purpose

### 1.1 文件目的

- **統一**廣告與聯盟行銷區塊之 **metadata 結構**，避免 AdSense / 通路王 / 聯盟網 / future provider 各自為政
- 支援 **Google AdSense / 通路王 / 聯盟網 / Custom Direct / future provider** 四+ 類 provider
- 明確**區分「廣告顯示」與「導購 CTA」**之追蹤方式（前者由 AdSense 內建處理；後者由我方站內 GA4 event 記錄）
- 對齊 `docs/click-tracking-governance.md` 之 `click_affiliate_cta` event / placement / provider / campaign 規則
- 為 Phase 2 ad-affiliate Module 之 EJS template / settings 重構提供 schema 基準

### 1.2 文件性質

- **Docs-only proposal**；不代表任何 schema 已實作 / 已套用至 settings JSON / 已套用至 EJS template
- 不規範**何時**實作；只規範**實作時應採何種命名 / 結構**
- 任何未來實作 phase 應引用本文件之 field name + provider mapping

### 1.3 不做事項

- ❌ 不修改 `content/settings/ads.config.json`
- ❌ 不修改 `content/settings/affiliate-networks.json`
- ❌ 不修改任何 EJS partial（含 `adsense-*.ejs` × 6 + affiliate-box render）
- ❌ 不修改 build scripts
- ❌ 不新增 GA4 listener
- ❌ 不新增 AdSense script / 不啟用 AdSense
- ❌ 不改 Blogger / GitHub output
- ❌ 不跑 build / validate
- ❌ 不 deploy / push

---

## 2. Current State

| 項目 | 狀態 | 證據 |
|---|---|---|
| `content/settings/ads.config.json` | 偏 Google AdSense | enabled=false / adsenseClient="" / 5 個 slot id（postTop / postMiddle / postBottom / sidebar / homeInline）全空 |
| `content/settings/affiliate-networks.json` | 記錄通路王 / 聯盟網 provider | 2 個 entry：`books`=通路王、`affiliate-network`=聯盟網；每 entry 含 id / name / rel |
| Blogger / GitHub 文章 conditional render AdSense / affiliate box | ✅ 已實作 | `src/views/ads/adsense-*.ejs` × 6 + `src/views/blogger/blogger-post-full.ejs` 兩個 conditional affiliate-box `<aside>` + `src/styles/components/_affiliate-box.scss` + GitHub mirror via post-detail render |
| `docs/click-tracking-governance.md` | ✅ 已落地（commit `aabc082`）| 已定義 `click_affiliate_cta` event + provider / placement / campaign / link_url / outbound params |
| **統一 adProvider / placement / campaign / linkUrl / displayText / trackingId / GA event name schema** | 🔴 **尚未存在** | per `docs/20260522-day-1-readonly-a-report.md` §2 模組 4 識別 gap |

---

## 3. Conceptual Model

本 schema 採**三層分離**：Provider layer / Placement layer / Campaign-Content layer。三層**獨立但組合**為單一 ad-affiliate metadata entry。

### 3.1 Provider Layer

代表廣告或聯盟**服務來源**。

| 列舉值 | 對應 | 性質 |
|---|---|---|
| `google_adsense` | Google AdSense | 廣告平台（display ad）|
| `tongluwang` | 通路王 | 聯盟導購 |
| `affiliate_network` | 聯盟網 | 聯盟導購 |
| `custom_direct` | 自有直接合作 | 直接贊助 / 廠商提供連結 |
| `future_provider` | reserved | 未來新 provider；以對應 id 命名 |

⚠️ Provider id 採 **snake_case**；對齊 `docs/click-tracking-governance.md` 之 utm / param 命名 convention。

### 3.2 Placement Layer

代表**出現位置**。

| 列舉值 | 對應位置 |
|---|---|
| `article_top` | 文章上方（h1 之後 / article body 之前）|
| `article_bottom` | 文章下方（article body 之後 / hashtag 之前）|
| `article_inline` | 文章中段（per content 段落 split；目前未實作）|
| `sidebar` | 側欄（desktop sidebar；mobile fallback 至文章下方）|
| `related_area` | 相關區塊（relatedLinks / otherLinks 旁；目前未實作）|
| `footer` | 頁尾 |

⚠️ Placement 為 **schema 必填**；同一篇文章可有上方 + 下方兩個 affiliate-box（同 provider / 同 linkUrl 皆可），**必須**靠 placement 區分 GA4 event（per §7）。

### 3.3 Campaign / Content Layer

代表與**文章 / 活動之關係**。

| 維度 | 用途 | 範例 |
|---|---|---|
| `postSlug` | 對應文章 slug | `we-media-myself2` |
| `campaign` | 活動 / 主題 | `reasons_for_travel` / `book_review_atomic_habits` |
| `content_group` | 內容類型 grouping | `tech-note` / `book-review` |
| `product_type` | 推廣產品類型 | `book` / `course` / `tool` |
| `display_context` | 顯示情境 | `seasonal` / `evergreen` / `time_limited` |

⚠️ Campaign-content layer 部分維度為 optional；最小 viable 集為 `postSlug` + `campaign`。

---

## 4. Recommended Unified Schema

### 4.1 JSON example

```json
{
  "id": "affiliate_reasons_for_travel_top",
  "enabled": true,
  "provider": "tongluwang",
  "type": "affiliate_cta",
  "placement": "article_top",
  "campaign": "reasons_for_travel",
  "postSlug": "reasons-for-travel",
  "displayText": "查看相關書籍與優惠",
  "linkUrl": "https://example.com/affiliate-link",
  "linkLabel": "通路王導購連結",
  "tracking": {
    "ga4Event": "click_affiliate_cta",
    "utmAllowed": false,
    "outbound": true
  },
  "providerMeta": {
    "networkId": "tongluwang",
    "subId": "optional-provider-sub-id"
  }
}
```

### 4.2 每個欄位用途

| 欄位 | 用途 |
|---|---|
| `id` | entry 之唯一識別；建議格式 `<type>_<campaign>_<placement>`（如 `affiliate_reasons_for_travel_top`）；供 build / log / debug 引用 |
| `enabled` | 是否啟用該 entry；`false` 時 render 階段 skip；不需從 settings 物理刪除 |
| `provider` | provider id（per §3.1 列舉）；render 階段決定 partial 變體 / GA4 event params |
| `type` | entry 性質；`display_ad`（廣告）/ `affiliate_cta`（聯盟導購）/ `sponsor_cta`（贊助）/ `direct_cta`（直接合作）|
| `placement` | 出現位置（per §3.2 列舉）；決定 render 區塊 + GA4 event params 之 `placement` value |
| `campaign` | 活動 / 主題標記（snake_case）；對齊 `docs/click-tracking-governance.md` §4.1 utm_campaign convention |
| `postSlug` | 對應文章 slug；可從 frontmatter 派生或顯式填入；GA4 event params 之 `post_slug` 來源 |
| `displayText` | UI 顯示文案（可中文 / 自由 string）；EJS render 階段渲染至 CTA button 內 |
| `linkUrl` | 實際導購 / 廣告連結；**對 AdSense 通常不 controlled by us**（per §6）；對 affiliate / sponsor 由我方填入 |
| `linkLabel` | 連結 accessibility label（aria / title）；GA4 event params 之 `link_label` 來源 |
| `tracking.ga4Event` | GA4 event name（per `docs/click-tracking-governance.md` §5；如 `click_affiliate_cta`）；AdSense 通常 `null` 或不設 |
| `tracking.utmAllowed` | 是否允許 build pipeline 對 `linkUrl` append UTM；聯盟平台常 `false`（per §8）|
| `tracking.outbound` | 是否離站；聯盟 / AdSense / 跨域 sponsor 通常 `true`；站內 sponsor 可 `false` |
| `providerMeta.networkId` | provider 端網路 id（如 affiliate-networks.json 之 `id`）；用於 link rel / GA4 params 之 fallback fill |
| `providerMeta.subId` | provider 端子帳號 / sub_id（聯盟平台自定義機制；如通路王之子帳號）；optional；未來支援 |

---

## 5. Field Dictionary

| field | required? | type | example | description | notes |
|---|---|---|---|---|---|
| `id` | ✅ required | string | `affiliate_reasons_for_travel_top` | entry 唯一識別 | snake_case；建議 `<type>_<campaign>_<placement>` |
| `enabled` | ✅ required | boolean | `true` | 是否啟用 | `false` 時 render skip；entry 保留方便 toggle |
| `provider` | ✅ required | string (enum) | `tongluwang` | provider id | per §3.1 列舉；snake_case |
| `type` | ✅ required | string (enum) | `affiliate_cta` | entry 性質 | `display_ad` / `affiliate_cta` / `sponsor_cta` / `direct_cta` |
| `placement` | ✅ required | string (enum) | `article_top` | 出現位置 | per §3.2 列舉；同文章可有多個 entry 之同 placement 嗎？建議**不**（per §7）|
| `campaign` | 🟡 recommended | string | `reasons_for_travel` | 活動標記 | snake_case；對齊 click-tracking-governance.md utm_campaign |
| `postSlug` | 🟡 recommended | string | `reasons-for-travel` | 文章 slug | 可從 frontmatter 派生；顯式填入較穩 |
| `displayText` | 🟡 recommended | string | `查看相關書籍與優惠` | UI 文案 | 自由 string；可中文；多語未來考量 |
| `linkUrl` | ⚠️ conditional | string (URL) | `https://example.com/affiliate-link` | 實際連結 | type=`display_ad` 通常 N/A（AdSense 自管）；其餘 required |
| `linkLabel` | 🟡 recommended | string | `通路王導購連結` | aria/title label | 與 displayText 可不同；前者偏無障礙；後者偏 UI |
| `tracking.ga4Event` | 🟡 recommended | string \| null | `click_affiliate_cta` | GA4 event name | per click-tracking-governance.md §5；AdSense 可 `null` |
| `tracking.utmAllowed` | ✅ required | boolean | `false` | 是否允 UTM | per §8；聯盟平台預設 `false`；外部 sponsor 可 `true` |
| `tracking.outbound` | ✅ required | boolean | `true` | 是否離站 | per click-tracking-governance.md §8.2 outbound 判斷 |
| `providerMeta.networkId` | 🟡 optional | string | `tongluwang` | provider 端網路 id | 對應 affiliate-networks.json `id`；可作 fallback fill |
| `providerMeta.subId` | ❌ optional / future | string | `dean-sub-001` | provider 端 sub_id | 聯盟平台自定義；未來支援；當前 reserved |

⚠️ **欄位完整 required 與否會因 type 而異**：`display_ad` 通常不填 linkUrl / linkLabel / ga4Event；`affiliate_cta` 與 `sponsor_cta` 則需全填。

---

## 6. Provider Mapping

不同 provider 之建議處理方式（**建議；非強制；本批不實作**）：

### 6.1 Google AdSense

| 欄位 | 建議值 / 處理 |
|---|---|
| `provider` | `google_adsense` |
| `type` | `display_ad` |
| `linkUrl` | **通常不由我方 control**（AdSense 內部填入；slot id 對應）|
| `linkLabel` | N/A |
| `tracking.ga4Event` | **optional 或不建議**（AdSense 內建 impression / click handling；自插 GA4 event 可能與 AdSense 報表不一致）|
| `tracking.utmAllowed` | N/A（AdSense 內部處理）|
| `tracking.outbound` | `true`（外部廣告主網域）|
| `providerMeta.networkId` | `google_adsense` |
| `providerMeta.subId` | N/A |

**Notes**：
- ⚠️ **不要干擾 AdSense 原生廣告點擊 / impression**；不於 AdSense slot 上加自訂 listener / `data-ga4-*` attr
- AdSense 之追蹤靠 AdSense 後台 + GA4 內建 AdSense link（per Google 官方）；不需我方額外 event
- 本 schema 對 `display_ad` 主要存「placement / enabled / slot id（透過 providerMeta）」即可

### 6.2 通路王

| 欄位 | 建議值 / 處理 |
|---|---|
| `provider` | `tongluwang` |
| `type` | `affiliate_cta` |
| `linkUrl` | **由我方 control**（authors 從通路王後台複製貼上）|
| `linkLabel` | 由我方填（如「博客來」/「PChome」）|
| `tracking.ga4Event` | `click_affiliate_cta` |
| `tracking.utmAllowed` | **usually `false`**（聯盟平台常不吃 UTM；除非確認接受）|
| `tracking.outbound` | `true` |
| `providerMeta.networkId` | `tongluwang`（對應 `affiliate-networks.json` `id`）|
| `providerMeta.subId` | future optional（通路王子帳號）|

**Notes**：
- 通路王導購 URL 自帶 affiliate tracking code；不要污染
- GA4 站內 event 記錄「點出前」；不依賴聯盟平台回傳

### 6.3 聯盟網

| 欄位 | 建議值 / 處理 |
|---|---|
| `provider` | `affiliate_network` |
| `type` | `affiliate_cta` |
| `linkUrl` | **由我方 control** |
| `linkLabel` | 由我方填 |
| `tracking.ga4Event` | `click_affiliate_cta` |
| `tracking.utmAllowed` | **depends on provider**（聯盟網對 URL 額外參數之政策需個案確認；建議預設 `false`）|
| `tracking.outbound` | `true` |
| `providerMeta.networkId` | `affiliate_network` |
| `providerMeta.subId` | future optional |

**Notes**：
- 與通路王處理方式類似
- 建議與通路王共用同一 partial 變體（type=`affiliate_cta` 即可；不需 per-provider 之 EJS 分支）

### 6.4 Custom Direct（自有直接合作 / 贊助）

| 欄位 | 建議值 / 處理 |
|---|---|
| `provider` | `custom_direct` |
| `type` | `sponsor_cta` 或 `direct_cta` |
| `linkUrl` | **由我方 control**（與廠商談定）|
| `linkLabel` | 由我方填 |
| `tracking.ga4Event` | `click_affiliate_cta` 或 `click_sponsor_cta`（reserved；本治理建議仍用 `click_affiliate_cta` + 靠 type / provider 區分）|
| `tracking.utmAllowed` | **`true` if external URL accepts UTM**；可由 build pipeline append UTM（per `docs/click-tracking-governance.md` §3.1）|
| `tracking.outbound` | `true` 或 `false`（站內 sponsor 偶有 false 之情況）|
| `providerMeta.networkId` | `custom_direct` |
| `providerMeta.subId` | N/A |

**Notes**：
- 與廠商談定之 sponsor 連結通常可接受 UTM；可作為唯一啟用 `utmAllowed=true` 之 type
- 未來若新增 `click_sponsor_cta` event，需同步更新 click-tracking-governance.md §5

---

## 7. Placement Rules

### 7.1 命名定義

| placement | 對應位置 |
|---|---|
| `article_top` | 文章上方 |
| `article_bottom` | 文章下方 |
| `article_inline` | 文章中段（per content 段落 split；未來支援）|
| `sidebar` | 側欄 |
| `related_area` | 相關區塊（relatedLinks / otherLinks 旁；未來支援）|
| `footer` | 頁尾 |

### 7.2 ⚠️ 同篇文章 top + bottom 兩個 affiliate-box

**目前使用者頁面可能同一篇文章有上方與下方兩個聯盟區塊**（per `docs/checklists/blogger-publish-checklist.md` + 既有 affiliate-box render 慣例）。

| 維度 | 規則 |
|---|---|
| 同 linkUrl 可以嗎？ | ✅ 可以；上下兩個 box 可指向同一導購 URL |
| 同 GA4 event name 可以嗎？ | ✅ 可以（皆 `click_affiliate_cta`）|
| **如何區分？** | **靠 `placement`**；GA4 event params 之 `placement` value 不同（`article_top` vs `article_bottom`）|
| schema entry 怎麼存？ | **兩個獨立 entry**；`id` 不同（如 `affiliate_<campaign>_top` / `affiliate_<campaign>_bottom`）|

### 7.3 與 click-tracking-governance.md 之對應

| click-tracking-governance.md §4 | 本 schema `placement` |
|---|---|
| `affiliate CTA top`（#8）| `article_top` |
| `affiliate CTA bottom`（#9）| `article_bottom` |
| utm_content `affiliate_top` | 對應 `placement=article_top` |
| utm_content `affiliate_bottom` | 對應 `placement=article_bottom` |

⚠️ utm_content 之 short form（`affiliate_top` / `affiliate_bottom`）與 schema `placement` 之 long form（`article_top` / `article_bottom`）為**兩套對齊命名**；utm_content 受 GA4 報表 readability 限制偏 short；schema 偏 explicit。對齊 mapping 建議由 build pipeline / URL builder 處理。

---

## 8. Relationship with GA4 / UTM

### 8.1 兩者角色不同

| 機制 | 用途 | 端點 |
|---|---|---|
| **GA4 event** | 站內記錄「**點出前**」之行為 | 我方站內 listener；fire 至 GA4 property |
| **UTM** | **被連到**之目標網站辨識**來源** | 目標網站之 analytics 系統（Google / 聯盟平台 / sponsor 等）|

### 8.2 聯盟平台 UTM 政策

- 聯盟平台**不一定接受** UTM 額外 query string
- **不應強制**把 UTM 加到 `linkUrl`
- 若 `tracking.utmAllowed=false`，系統未來 build pipeline 應**保留原始** `linkUrl`（不 append）
- 若 `tracking.utmAllowed=true`，未來可由 URL builder（per `src/scripts/ga4-url-builder.js` 既有架構）append UTM

### 8.3 `click_affiliate_cta` 至少帶之 params

per `docs/click-tracking-governance.md` §5.5：

```
required:
  - provider       (per §3.1 列舉)
  - placement      (per §3.2 列舉)
  - campaign       (per §3.3)
  - post_slug      (per §3.3)
  - link_label     (per §4.2)
  - link_url       (per §4.2)
  - outbound       (per §4.2；通常 true)
```

⚠️ 上述 params **皆可從本 schema entry 之欄位派生**；EJS render 階段透過 `data-ga4-*` attr 傳遞（per click-tracking-governance.md §6）。

### 8.4 對齊摘要

| 項目 | GA4 Event | UTM |
|---|---|---|
| 永遠 fire？ | ✅ 站內 event 永遠 fire（per §6.2 click_affiliate_cta；無聯盟平台政策限制）| ❌ 視 `utmAllowed` 而定 |
| 由誰使用？ | 我方 GA4 property | 目標網站之 analytics（聯盟平台 / sponsor / etc.）|
| 受 provider 限制？ | ❌ 不受（站內 event）| ✅ 受聯盟平台 URL policy 限制 |
| 對應 schema 欄位 | `tracking.ga4Event` | `tracking.utmAllowed` |

---

## 9. Blogger / GitHub Rendering Implications

本 schema 為 **platform-agnostic**；Blogger 與 GitHub Pages 兩端 render 應採**相同 metadata 來源**。

### 9.1 Render 對應

| 維度 | Blogger render | GitHub Pages render |
|---|---|---|
| AdSense partial | `src/views/ads/adsense-*.ejs` × 6（既有；不動）| 同 |
| Affiliate-box partial | `src/views/blogger/blogger-post-full.ejs` 兩個 conditional `<aside>` | `src/views/pages/post-detail.ejs` mirror |
| Schema 來源 | frontmatter `affiliate.*` + settings `affiliate-networks.json` | 同（共用）|
| `data-ga4-*` attr | 兩端皆未來輸出（per click-tracking-governance.md §6；本批不實作）| 同 |
| copy-helper 對應區塊 | [11] affiliate metadata（未來考量）| N/A（GitHub 端無 copy-helper）|
| publish-checklist 對應 | affiliate 項目（未來考量）| N/A |

### 9.2 Platform mirror 不對稱事項

- AdSense 區塊**兩端皆 render**；但生效與否由 `ads.config.json` enabled + adsenseClient 決定
- Affiliate-box **兩端皆 render**；schema entry 為 platform-agnostic；不需 per-platform 變體
- `tracking.utmAllowed=true` 之 UTM injection：未來建議由 build pipeline 階段處理（與既有 cross-link UTM 共用 `ga4-url-builder.js`）；不在 render 階段動 URL

### 9.3 與既有 settings 之關係

本 schema 為**新提案**；落地時可能需：

| 既有 settings | 是否需動 | 建議 |
|---|---|---|
| `content/settings/ads.config.json` | 🟡 可能擴充 | 加 `provider` enum 維度；保留 backward-compat（既有 enabled / adsenseClient / slots 不變）|
| `content/settings/affiliate-networks.json` | 🟡 可能擴充 | 對應 schema `providerMeta.networkId`；可加 `provider` enum 對照欄位 |
| frontmatter `affiliate.*`（per `CLAUDE.md` §12）| 🟡 可能升級 | 新增 entry array 形式；保留 backward-compat for 既有 `affiliate.links[].label / network / url` |

⚠️ 上述**不在本批 scope**；僅 proposal；落地時應拆獨立 phase + backward-compat migration plan。

---

## 10. Phase 2 Migration / Rollout

建議實作順序（**proposal；非承諾**）：

| 順序 | 動作 | 阻擋條件 |
|---|---|---|
| 1 | **AdSense 是否納入同 schema 之 user 決策** | 兩個選項：(a) AdSense + Affiliate 共用同 schema（per 本提案）；(b) 兩套獨立 schema（AdSense 留 ads.config.json；Affiliate 走 frontmatter）；user 表態 |
| 2 | **EJS partials 加入 `data-ga4-*` data attributes**（per `docs/click-tracking-governance.md` §6 + 本提案 §4 + §9） | 順序 1 決策後 |
| 3 | **新增 GA4 click listener**（`src/js/modules/ga4-click-listener.js`；per click-tracking-governance.md §10 順序 1）| 順序 2 完成 |
| 4 | **GA4 DebugView / Realtime 驗收**（per click-tracking-governance.md §10 順序 6）| 順序 3 完成；含每 placement / provider 之驗收項 |
| 5 | **provider `subId` / campaign automation**（如自動派生 campaign from frontmatter / 自動 subId fill）| 順序 4 通過後；屬最後優化 |

⚠️ 每順序皆**獨立 commit**；不混入跨類變動；不為趕進度合併。

---

## 11. Non-goals（本批 phase 不做）

| 項目 | 理由 |
|---|---|
| 不修改 `content/settings/ads.config.json` | 本批屬 proposal；落地由獨立 phase |
| 不修改 `content/settings/affiliate-networks.json` | 同上 |
| 不修改 EJS partial（含 adsense-*.ejs / affiliate-box） | 同上 |
| 不修改 build scripts | 同上 |
| 不新增 GA4 listener | 屬 click-tracking-governance §10 順序 1；非本 phase scope |
| 不新增 AdSense script | AdSense 啟用屬獨立 phase；依賴 custom domain + HTTPS Enforce |
| 不啟用 AdSense | 同上；per `docs/custom-domain-root-files-strategy.md` §4.5 |
| 不改 Blogger / GitHub output | 本批純 docs |
| 不跑 build / validate | 本批純 docs |
| 不 deploy / push | push 屬獨立 phase |

---

## 12. Acceptance Criteria（本文件完成條件）

| # | 條件 | 滿足 |
|---|---|---|
| 1 | 有 unified schema 範例 | ✅ §4.1 JSON example + §4.2 per-field 用途 |
| 2 | 有 field dictionary | ✅ §5 表列 15 欄位（含 required / type / example / description / notes）|
| 3 | 有 provider mapping | ✅ §6 涵蓋 Google AdSense / 通路王 / 聯盟網 / Custom Direct 共 4 類 |
| 4 | 有 placement rules | ✅ §7 列舉 6 個 placement + top/bottom 規則 + 與 click-tracking-governance.md 對應 |
| 5 | 有 GA4 / UTM 關係說明 | ✅ §8 含 GA4 event 與 UTM 角色區分 + 聯盟平台 utm 政策 + click_affiliate_cta 必帶 params |
| 6 | 有 Blogger / GitHub rendering implication | ✅ §9 含兩端 render 對應 + platform-agnostic 原則 + 既有 settings 關係 |
| 7 | 明確標示 proposal-only，不實作 | ✅ §1.2 + §1.3 + §11 三處明示 |

---

## 13. Cross-links

- `docs/click-tracking-governance.md`（GA4 click event 治理；本提案對齊其命名 + params）
- `docs/20260522-day-1-readonly-a-report.md` §2 模組 4（識別 gap 之來源）
- `CLAUDE.md` §12（書評 affiliate 規則）/ §16.2（聯盟連結 rel）/ §17（文章頁版型）
- `content/settings/ads.config.json`（既有 AdSense 設定）
- `content/settings/affiliate-networks.json`（既有 affiliate provider 列表）
- `src/views/ads/adsense-*.ejs`（既有 AdSense 6 partials）
- `src/views/blogger/blogger-post-full.ejs`（既有 affiliate-box render）
- `src/scripts/ga4-url-builder.js`（既有 URL UTM helper；未來 `utmAllowed=true` 落地時共用）
- `docs/ga4-parameter-naming-registry.md`（既有 GA4 / UTM naming convention）
- `docs/phase-2-candidate-roadmap.md`（Phase 2 候選 roadmap）

---

（本文件結束）
