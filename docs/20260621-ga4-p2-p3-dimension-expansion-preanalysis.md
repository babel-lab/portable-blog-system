# GA4 P2 / P3 dimension expansion — continuation preanalysis（docs-only）

- **Phase**：`20260621-ga4-p2-p3-dimension-expansion-preanalysis-docs-only-a`
- **Date**：2026-06-21（Asia/Taipei；evening, 17:18+）
- **Type**：**docs-only continuation preanalysis**（唯一 mutation = 本檔新增；CLAUDE.md / MEMORY.md / source / settings / content / build / dist 皆不動）
- **Verdict**：**PREANALYSIS ONLY — no GA4 backend / source / settings changes**
- **Baseline**：`main` HEAD == origin/main == `50b1536`（subject `docs(admin): record k9 browser pass`）；ahead/behind = 0/0；working tree clean。
- **Predecessors**：
  - `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md`（D-series preanalysis；D1～D5 phase 計畫 + §5 candidate tables）
  - `docs/20260617-night-ga4-d1-parameter-naming-spec.md`（D1 spec；§5 single-source naming table）
  - `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md`（D4；4-dimension manual checklist；docs-only；Dean 後台尚未操作）
- **Scope flag**：**不**改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md；**不** build / 不 deploy / 不 dev / 不 Blogger repost / 不 admin write / 不 safe-write:test / 不 --apply / 不 dryRun:false / 不打 GA4 / AdSense / Blogger / Google Drive / Search Console 後台。

> 本檔目的：在 D4 first-batch checklist 已落地（仍 docs-only；Dean 後台尚未實際註冊）後，整理 **P2/P3 後續觀察與擴張的下一步**。本檔**不**重複 D1 spec 之 single-source naming table；以下表格僅作為 **roadmap 與 risk classification view**，所有 parameter key / display name 之權威仍以 D1 §5 為準。
>
> ⚠️ 本 phase **不**啟動任何 source / GA4 後台改動；不註冊 dimension；不打 Realtime / DebugView；不 deploy；不 repost Blogger。

---

## 1. Baseline verify observed

```
pwd                                     /d/github/blog-new/portable-blog-system
branch                                  main
HEAD                                    50b1536
origin/main                             50b1536
ahead / behind                          0 / 0
working tree                            clean
latest subject                          docs(admin): record k9 browser pass
git rev-list --left-right --count       0  0
```

baseline 與 phase prompt §A 完全一致。inspection 全為 `Read` / `Glob`；未觸碰任何受控檔案。本 phase **未跑** `npm run validate:content`（per CLAUDE.md §3a carry-forward；無 regression 風險，因不動 source / content）。

---

## 2. Scope summary

| 動作 | 範圍 |
| --- | --- |
| 新增 | `docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md`（本檔） |
| 修改 | **無** |
| 已跑（read-only） | baseline git 7 件、`Read` inspect `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` / `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md` / `docs/20260617-night-ga4-d1-parameter-naming-spec.md`、`Glob` `docs/*ga4*.md` / `docs/20260619*` / `docs/20260620*` / `docs/20260621*` |
| 未動 | `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `.cache/` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md / docs/README |
| 未跑 | build / build:github / build:blogger / build:promotion / build:sitemap / deploy / preview / dev server / `safe-write:test` / `admin:write` / `admin-write-cli` / `--apply` / `dryRun:false` / Blogger / GA4 / AdSense / Search Console 後台 / npm install / amend / rebase / force-push |

---

## 3. Baseline / source of truth（截至 HEAD `50b1536`）

### 3.1 GA4 settings / config

| 項目 | 值 | 備註 |
| --- | --- | --- |
| `ga4.enabled` | `true` | `content/settings/ga4.config.json`（per D1 §3.1） |
| `ga4.measurementId`（masked tail4） | `G-…PF8VD` | 完整 measurementId 永禁寫入 docs / `MEMORY.md` / 任何 ledger |
| LIVE since | 2026-05-21 production | per pm-43 / pm-45 / pm-46 |
| Gating | 4-AND（`ga4 存在 && ga4.enabled===true && ga4.measurementId 非空 && isProdBuild===true`） | `src/views/tracking/ga4.ejs`；本 phase 不改 |

### 3.2 D-series progress

| Phase | 狀態 | 證據 |
| --- | --- | --- |
| Pre-D（P2/P3 dimension expansion preanalysis） | ✅ landed（2026-06-17 night） | `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md` |
| D1（parameter naming spec） | ✅ landed（2026-06-17 night；commit `4c799a5`） | `docs/20260617-night-ga4-d1-parameter-naming-spec.md` |
| D4（first-batch manual registration checklist） | ✅ landed（docs-only；commit `a39d51c`） | `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` |
| D4 first-batch 實際 GA4 後台註冊 | ❌ **未執行**（屬 Dean 手動後台動作；不在 repo scope） | n/a |
| D5（DebugView / Realtime evidence record） | ❌ 未啟動（pending D4 後台註冊 + 新事件累積 24~72hr） | n/a |
| D2（GitHub Pages source preflight for unwired params） | ❌ 未啟動（屬 P2-6/7/8 source change 前置） | n/a |
| D3（Blogger listener / theme-boundary preflight） | ❌ 未啟動（屬第二階段；per CLAUDE.md §29） | n/a |

### 3.3 D4 first-batch 已決定之 4 個 dimensions（per `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md` §5）

| # | Display name | Parameter | Scope | LIVE? | Cardinality | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Link Type | `link_type` | Event | ✅ LIVE | low（4 值） | P1-strict 補登 |
| 2 | Link Provider | `provider` | Event | ✅ LIVE（affiliate CTA only） | low（目前單一 `通路王`） | P2 |
| 3 | Link Placement | `placement` | Event | ✅ LIVE（aside 4 anchor；nav 無） | low（4 值） | P2 |
| 4 | Link Label | `link_label` | Event | ✅ LIVE（全 5 anchor classes） | high（≒ 文章標題；接受 GA4 `(other)` 聚合） | P2（caution） |

→ 4 個全 **zero source change / zero deploy / zero Blogger repost**；Dean 只需後台手動建立。

### 3.4 D4 first-batch deferred / excluded（per D4 §6）

| 類別 | param | 原因 | 替代 / 何時可解封 |
| --- | --- | --- | --- |
| Deferred | `target_url` | high cardinality；已含於 P1 已註冊之 `target_slug`；註冊浪費配額 | 用 `target_slug` dimension；URL 可在 Explore 用 event_params 串；不建議解封 |
| Not recommended | `link_url` | very high cardinality；含 affiliate `uid1` redirect token；與 `target_url` 概念重疊 | 用 `link_type=affiliate` + `provider` filter；不建議解封 |
| Not recommended | `outbound` | 與 `link_type` 高度重疊（`link_type=external` 已可推） | 用 `link_type=external` filter；不建議解封 |
| Optional / low ROI | `link_source_key` | LIVE 但 conditional（entry 提供 `sourceKey` 才 emit）；報表易 `(not set)` | 待 `sourceKey` 採用率提升再評估 |
| Blocked（source 未 emit） | `content_kind` / `category` / `commerce_link_id` / `tag_count` / `series_key` / `merchant_key` / `label_override_present` / `surface_ads_enabled` | 須 D2 source preflight + 動 source + redeploy | 屬 D4 second batch；per D1 §9.3 |
| Blocked（surface gap） | Blogger `click_*` events 之 dimensions | Blogger listener 未落地；per D1 §3.3 / §7 | 屬 D3 preflight scope；per CLAUDE.md §29 屬第二階段 |
| Forbidden（永禁） | AdSense real client / slot；affiliate credentials / token；Google Forms responses；Blogger postId 猜測值；完整 measurementId | red lines | per CLAUDE.md §3a Red lines / D1 §7 |

---

## 4. P2 / P3 observation goals（Dean 後續若繼續觀察或擴張時）

### 4.1 P2 / P3 live posts 觀察用之 events × dimensions（GA4 後台側）

P2 live post = `ai-tools-simplify-daily-workflow`（content landed；live repost BLOCKED）
P3 live post = `blog-restart-steady-rhythm-notes`（content landed；live published 2026-06-17）

對應觀察視角（**全屬 GA4 後台 Reports / Realtime / Explore 操作；本 phase 不執行**）：

| 觀察目標 | event_name | 已 LIVE dimensions（GitHub Pages） | 是否需 D2 source change | Blogger surface? |
| --- | --- | --- | --- | --- |
| 跨平台流量分流（Blogger ↔ GitHub） | `page_view` | `surface`（P1） + GA4 內建 `hostname` / `page_location` | ❌ | ⚠️ Blogger 只有 `page_view` auto；不送 `click_*` |
| 文章底部導覽點擊 | `click_other_link` + `click_area=article_bottom_nav` 雙條件（單看 `click_other_link` 會混入 otherLinks aside） | `surface` / `click_area` / `nav_direction` / `post_slug` / `target_slug`（皆 P1 已 registered） | ❌ | ❌（Blogger 無 listener） |
| Related links aside | `click_related_link` | `link_type` / `placement=related_links` / `link_label` / `link_source_key`（conditional） | ❌（dimension 註冊後即可分） | ❌ |
| Other links aside | `click_other_link` + `placement=other_links` + `click_area=(not set)` 三條件區分（與 nav 不同源） | 同 related；另 `link_source_key`（conditional） | ❌ | ❌ |
| Affiliate CTA 點擊（top / bottom） | `click_affiliate_cta` | `link_type=affiliate` + `provider` + `placement=article_top`/`article_bottom` + `link_label` | ❌（D4 first batch 已涵蓋） | ❌ |
| 文章分類 / 主題分群 | 任一 click event | **缺**（`content_kind` / `category` 未 emit） | ✅（D2 + source change） | ❌ |
| 個別 commerce link ROI 比較 | `click_affiliate_cta` | **缺**（`commerce_link_id` 未 emit） | ✅（D2 + source change；待 commerce L2） | ❌ |

### 4.2 可純靠 GA4 後台觀察（不動 source）

| 觀察 | 路徑 |
| --- | --- |
| 跨站流量來源 | Reports → Acquisition → Traffic acquisition；`session_source` / `session_medium`（GA4 內建） |
| 跨站 UTM 分流 | Reports → Engagement → Landing page；filter `utm_source=github_pages` / `blogger` |
| Realtime 點擊驗證 | Reports → Realtime → Events（30 分內） |
| 文章底部導覽 P1 報表 | Explore → `event_name=click_other_link` + `click_area=article_bottom_nav` × `nav_direction` × `target_slug` |
| AdSense 互動（非 dimension；屬 AdSense 後台） | AdSense → 站台 → 廣告封鎖率 / RPM / 觀看次數 / 政策中心；屬 Dean 另跑 |
| P2 / P3 live URL 之 page-level views | Reports → Engagement → Pages and screens；filter `page_path` |

### 4.3 需未來 code / source 支援（本輪不得實作）

下列項目**需 D2 source phase + minimal additive change + redeploy**；本輪不啟動：

| 目標 | 所需 attr 注入位置 | 對應 dimension |
| --- | --- | --- |
| 文章類型分桶 | 全 5 處 anchor 加 `data-ga4-param-content_kind="<post.contentKind>"`（`post-detail.ejs:93,194,237,279` + `article-bottom-nav.ejs:18,24,29`） | `content_kind`（P2-6） |
| 文章分類分桶 | 同上加 `data-ga4-param-category="<post.category>"` | `category`（P2-7） |
| Affiliate link 個別 ROI | `post-detail.ejs:93,194`（affiliate CTA）加 `data-ga4-param-commerce_link_id="<link.ref>"` | `commerce_link_id`（P2-8） |
| Blogger surface 之任何 `click_*` event | Blogger 主題層級 listener（per `docs/blogger-listener-strategy.md` 方案 A） + `build-blogger.js` output 注入 `data-ga4-*` attrs | 跨 surface 行為觀察 |

⚠️ 上述任何項目皆**不**在本輪實作；皆屬 D2 / D3 preflight 後另開 source phase。

---

## 5. Dimension expansion candidates（risk classification view）

> 本表僅作 **risk roadmap**；parameter key / display name / scope 之**權威**仍以 D1 §5 為準（本 phase 不重複定義以避免 drift）。

### 5.1 Safe / low-cardinality（可註冊；屬 D4 first batch 範圍）

| Display name | Parameter | LIVE? | Cardinality | 何時註冊 | 備註 |
| --- | --- | --- | --- | --- | --- |
| Link Type | `link_type` | ✅ | low（4 值） | D4 first batch（已 checklist） | 4 個 LIVE 值；報表派得上用場 |
| Link Provider | `provider` | ✅（affiliate CTA only） | low（單一 `通路王`） | D4 first batch | commerce L2 啟動後 → medium |
| Link Placement | `placement` | ✅（aside 4 anchor；nav 無） | low（4 值） | D4 first batch | nav 之 placement 概念由 `click_area=article_bottom_nav` 承擔 |

### 5.2 Safe but caution（可註冊；接受 `(other)` 聚合風險）

| Display name | Parameter | LIVE? | Cardinality | 何時註冊 | Caution |
| --- | --- | --- | --- | --- | --- |
| Link Label | `link_label` | ✅（全 5 anchor classes） | high（≒ 標題） | D4 first batch | 標題改字 → dimension 連續性破裂；可改用 `target_slug` 替代 |

### 5.3 Medium risk（需 D2 source change；低 cardinality 易聚合）

| Display name | Parameter | LIVE? | Cardinality | 何時註冊 | 阻擋條件 |
| --- | --- | --- | --- | --- | --- |
| Content Kind | `content_kind` | ❌ | low（≤ 7 值） | D4 second batch（須先 D2 preflight + source + redeploy） | source phase + Dean approval |
| Category | `category` | ❌ | low～medium（per `categories.json`） | D4 second batch | source phase + Dean approval |
| Commerce Link ID | `commerce_link_id` | ❌ | medium（per `commerce-links.json`） | D4 second batch | D2 preflight + commerce L2 啟動相依 |
| Link Source Key | `link_source_key` | ✅（conditional） | low～medium | D4 後續批次（待採用率） | sourceKey 採用率提升 |

### 5.4 High-cardinality / should defer（**不建議**註冊）

| Display name | Parameter | LIVE? | Cardinality | 替代 | 何時可解封 |
| --- | --- | --- | --- | --- | --- |
| Target URL | `target_url` | ✅（nav only） | high | `target_slug`（已 P1 註冊）；URL 可 Explore 用 event_params 串 | Dean 確認 Explore 串 event_params 不便利時可重新評估 |
| Link URL | `link_url` | ✅ | very high | `link_type=affiliate` + `provider` filter；個別 affiliate 觀察改用 `commerce_link_id`（P2-8） | **不建議解封** |
| Outbound | `outbound` | ✅ | low（2 值；但與 `link_type` 重疊） | `link_type=external` filter | **不建議解封**（dimension 配額浪費） |

### 5.5 Future planned（需 D2 + source change；低急迫；建議延後）

| Display name | Parameter | Cardinality | 建議 | 阻擋條件 |
| --- | --- | --- | --- | --- |
| Tag Count | `tag_count` | low（0–~20） | P3；ROI 低 | D2 source phase；建議延後 |
| Series Key | `series_key` | low（per `series.json`） | P3；待 series 內容增加 | D2 source phase；建議延後 |
| Merchant Key | `merchant_key` | low（per `affiliate-networks.json`） | P3；待 multi-network | D2 source phase + commerce L2；建議延後 |
| Label Override Present | `label_override_present` | low（boolean） | P3；ROI 待評估 | D2 source phase；建議延後 |
| Surface Ads Enabled | `surface_ads_enabled` | low（boolean） | P3；可與 AdSense ramp 配合 | D2 source phase；建議延後 |

### 5.6 Forbidden（永禁 emit / 永禁註冊；red line）

per D1 §7 / 本檔 §3.4 forbidden 列。本檔不重述。

### 5.7 Risk summary 一覽

| 風險等級 | 數量 | 建議 |
| --- | --- | --- |
| Safe / low-cardinality | 3（`link_type` / `provider` / `placement`） | D4 first batch 立即註冊 |
| Safe but caution | 1（`link_label`） | D4 first batch；接受 `(other)` 聚合 |
| Medium risk（need source） | 4（`content_kind` / `category` / `commerce_link_id` / `link_source_key`） | 評估 ROI 後 D4 second batch |
| High-cardinality / defer | 3（`target_url` / `link_url` / `outbound`） | **不建議**註冊 |
| Future planned（need source；low ROI） | 5（`tag_count` / `series_key` / `merchant_key` / `label_override_present` / `surface_ads_enabled`） | 建議**延後**至 ROI 觸發 |
| Forbidden | n（red line） | 永禁 |

→ **建議 GA4 後台註冊上限**：P1 已 5–6 個 + D4 first batch 4 個 = **累計 ≤ 10**；GA4 event-scoped 上限 ~50；剩餘配額預留給 D4 second batch（≤ 4 個）+ 未來 commerce / Blogger listener。

---

## 6. Registration checklist draft（**roadmap**；非 first batch；first batch 已由 D4 落地）

> 本表為**未來批次排序建議**；first batch 已落於 D4 checklist；本表為 D4 之後**若 Dean 決定擴張**之 next batch 草案。
>
> **本檔不取代** D4 checklist；本表為 **D4 second batch / future batch 之規劃**；如 Dean 確認啟動，須**另開新 phase**（如 `2026XXXX-ga4-d4-second-batch-registration-checklist`）並對齊 D1 §5。

### 6.1 D4 second batch 候選（需 D2 source phase 前置）

| order | Display name | Parameter | Scope | Reg priority | Pre-req | Dean backend? | Source change? | Redeploy? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | Content Kind | `content_kind` | Event | P2 | D2 preflight + source phase | ✅ | ✅ | ✅ |
| 6 | Category | `category` | Event | P2 | D2 preflight + source phase | ✅ | ✅ | ✅ |
| 7 | Commerce Link ID | `commerce_link_id` | Event | P2 | D2 preflight + source phase + commerce L2 啟動相依 | ✅ | ✅ | ✅ |
| 8 | Link Source Key | `link_source_key` | Event | P3 | sourceKey 採用率 ≥ 50% 之 ready posts | ✅ | ❌（已 LIVE conditional） | ❌ |

⚠️ order 5 / 6 / 7 之 source change 須**僅** additive；mirror `post-detail.ejs:93` inline pattern；不改 listener / loader / 4-AND gating；不動 `ga4.config.json`。

### 6.2 D4 future batch 候選（≥ 6 個月後評估）

| Display name | Parameter | Pre-req | 何時評估 |
| --- | --- | --- | --- |
| Tag Count | `tag_count` | D2 source phase | ROI 觸發 |
| Series Key | `series_key` | D2 source phase + series 內容累積 | series 推 ≥ 2 條 |
| Merchant Key | `merchant_key` | D2 source phase + commerce L2 啟動 + multi-network | commerce 接 ≥ 2 networks |
| Label Override Present | `label_override_present` | D2 source phase | `labelOverride` 採用率 ≥ 5 篇 |
| Surface Ads Enabled | `surface_ads_enabled` | D2 source phase + AdSense ramp 觀察期 | AdSense ramp 完成（≥ 3 個月穩定觀察） |

### 6.3 Scope（**Event-scoped 一律即可**；不需 User-scoped）

| 維度 | 是否需 User-scoped | 原因 |
| --- | --- | --- |
| 全 P2 / P3 候選 | ❌ | 全為 click event 觸發；屬 Event scope；User scope 不適用（本 BLOG 系統無會員 / 不識別 user；per CLAUDE.md §29） |
| GA4 內建 user dimensions（`country` / `device_category` / `browser` / `language`） | ✅ auto | GA4 內建；不需 custom |

⚠️ **不**建立任何 User-scoped custom dimension；per CLAUDE.md §29「無會員 / 無資料庫後端」一致性。

### 6.4 Item-scoped dimensions

本 BLOG 系統**無 e-commerce items 事件**（無 `view_item` / `add_to_cart` / `purchase`）；Item-scoped 不啟動。Affiliate click 以 Event-scoped 處理。

---

## 7. Acceptance criteria（本 docs-only phase）

### 7.1 PASS 條件

本 phase 為 **docs-only preanalysis**；以下全部滿足 → PASS：

1. baseline verify observed 與 phase prompt 一致（HEAD = origin/main = `50b1536`；clean；0/0）
2. 本檔（`docs/20260621-ga4-p2-p3-dimension-expansion-preanalysis.md`）新增成功
3. 內容涵蓋 prompt §1–§6 所要求之 6 個 section
4. 不重複定義 D1 §5 之 parameter key / display name（避免 drift；以 reference 為主）
5. dimension classification 對齊 D4 §6 之 deferred / excluded 範圍
6. forbidden / red line 全保留（AdSense / commerce / token / Forms responses / Blogger postId 猜測值 / 完整 measurementId）
7. 本檔 land 後 working tree 回到 clean（除本檔新增以外無 untracked）

### 7.2 **不包含**（明示）

- ❌ **不**包含 GA4 後台任何操作（不登入；不點 Admin → Custom definitions；不打 Realtime / DebugView / Explore）
- ❌ **不**包含任何 source change（`src/` / `views/` / `scripts/` / `js/` / `styles/` 全未動）
- ❌ **不**包含 `npm run validate:content` 重跑（per CLAUDE.md §3a carry-forward；無 regression 風險）
- ❌ **不**包含任何 build / build:github / build:blogger / build:promotion / build:sitemap
- ❌ **不**包含 deploy / preview / dev server
- ❌ **不**包含 Blogger repost / Blogger metadata 回填
- ❌ **不**包含 admin write / safe-write:test / admin-write-cli / --apply / dryRun:false
- ❌ **不**包含 middleware / API / Apply 啟用
- ❌ **不**包含 settings 改動（`ga4.config.json` / `ads.config.json` / `affiliate-networks.json` / `commerce-links.json` / `promotion.config.json` 全未動）
- ❌ **不**包含 D1 spec 改動（避免 single-source drift；若 D1 須改 → 另開 phase）
- ❌ **不**包含 D4 checklist 改動（first batch 範圍 frozen）
- ❌ **不**包含 amend / rebase / reset / merge / cherry-pick / force-push
- ❌ **不**包含 CLAUDE.md / MEMORY.md / docs README 更新（per prompt：「CLAUDE.md 只允許極小 ledger sync；如果不確定就不要改 CLAUDE.md」→ 本 phase 不確定，因此不改）

### 7.3 FAIL 條件

任一發生 → FAIL：

- baseline verify 不符 → 立即停止；不修正；不 commit
- 本檔誤觸 `src/` / `content/` / `settings/` / `package.json` / lockfile / dist
- 本檔含完整 `measurementId`（非 masked tail4）/ AdSense 真實 client / slot / affiliate token / Forms responses / 猜測之 Blogger postId / publishedAt
- 本檔取代 D1 §5 之 single-source naming（造成 drift）
- 本檔誤建議「立即註冊 `target_url` / `link_url` / `outbound`」（per §5.4 應 defer）
- 本檔誤建議「立即啟動 D2 / D3 / Blogger listener / Blogger reverse UTM deploy / write path」（per scope flag 應 defer）

---

## 8. Next phase recommendations（2–3 個後續可選 phase）

每個 phase 一律 **docs-only 起步**；皆須 Dean explicit approval；皆**不**自動執行；皆**不**啟動 source / build / deploy / Blogger repost。

### 8.1 Phase **E1**：D4 first-batch GA4 後台 registration evidence record（docs-only；**首選**）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only evidence record |
| 目的 | Dean 完成 D4 §5 4 個 dimensions 之後台手動註冊後，docs-only 記錄 Dean evidence（截圖 / 文字確認；對應 D4 §7 D5 evidence handoff） |
| 改 source? | ❌ 否 |
| 改 settings? | ❌ 否 |
| 需 Dean evidence? | ✅ 是（GA4 後台 Admin → Custom definitions 截圖 + Realtime 30 分內事件 param 值截圖） |
| 需 Dean approval? | ✅ 是 |
| Risk | low |
| 阻擋條件 | Dean 已完成 D4 §5 後台手動註冊；Dean 已於 GitHub Pages 重新點擊 article 之 4 個 anchor classes |
| Output 建議檔名 | `docs/2026XXXX-ga4-d4-first-batch-evidence-record.md` |
| Mask 規則 | full `measurementId` 不可入；只可 masked tail4 `…PF8VD`；不含 affiliate tracking URL 完整值；不含 AdSense 真實 client / slot |

### 8.2 Phase **E2**：GA4 observation record docs-only（P2 / P3 live posts；需 Dean 截圖或數據）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only observation record |
| 目的 | 觀察 P2（`ai-tools-simplify-daily-workflow`）+ P3（`blog-restart-steady-rhythm-notes`）live posts 之 GA4 表現；docs-only 記錄 Dean 截圖（含 `page_view` / `click_other_link + article_bottom_nav` / `click_affiliate_cta` 之 30d aggregate） |
| 改 source? | ❌ 否 |
| 改 settings? | ❌ 否 |
| 需 Dean evidence? | ✅ 是（GA4 Reports → Engagement / Realtime / Explore 截圖） |
| 需 Dean approval? | ✅ 是 |
| Risk | low |
| 阻擋條件 | P2 / P3 live posts 已累積 ≥ 7d / 30d 觀察期；Dean 同意分享後台截圖 |
| Output 建議檔名 | `docs/2026XXXX-ga4-p2-p3-live-observation-record.md` |
| Mask 規則 | 同 E1 |

### 8.3 Phase **E3**：D2 source-level event parameter preflight（docs-only preflight；**僅在 ROI 不足時啟動**）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only preflight；**不**改 source |
| 目的 | 若 Dean 評估 D4 first batch ROI 不足（4 個 dimensions 不足以切分行為），對 `content_kind` / `category` / `commerce_link_id` 三條 attr 做 source 端 preflight：(1) post-detail.ejs / article-bottom-nav.ejs 注入位置；(2) build-github.js 是否需先 normalize；(3) byte-identical-modulo-builtAt 風險；(4) 是否影響 article-block parity guard 與 GitHub Pages 6/6 parity；(5) 是否影響既有 `check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output` guards |
| 改 source? | ❌ 否（preflight only；不實作） |
| 改 settings? | ❌ 否 |
| 需 Dean evidence? | ✅ 是（D4 first batch 啟動後 ≥ 30d 觀察結論：ROI 不足） |
| 需 Dean approval? | ✅ 是 |
| Risk | low（純 inspection） |
| 阻擋條件 | D4 first batch 已啟動 + E1 evidence 已 land + Dean ROI 評估「不足」 |
| Output 建議檔名 | `docs/2026XXXX-ga4-d2-pages-source-preflight.md` |
| 後續 | preflight PASS → 另開 source phase（minimal additive；mirror Phase 20260522 ga4-inline-attrs pattern；本 phase **不**啟動實作） |

### 8.4 推薦優先序

| 優先 | Phase | 理由 |
| --- | --- | --- |
| 1 | **E1** | docs-only；zero source；zero deploy；4 個 LIVE dimensions 已可註冊；Dean evidence 為唯一阻擋 |
| 2 | **E2** | docs-only；觀察 P2 / P3 live posts ROI；E1 PASS 後 ≥ 7d / 30d 啟動 |
| 3 | **E3** | docs-only preflight；僅在 E2 結論為「ROI 不足」時啟動；不必要時可永久跳過 |

⚠️ **不**主動推進 E1 / E2 / E3 之任一；皆等 Dean 顯式批准。

### 8.5 **不**列為候選（受 CLAUDE.md §29 / red line 約束）

下列任一**不**在本檔之 next phase 建議：

- Blogger listener 落地 / Blogger 主題 GA4 attr 注入（屬第二階段；per `docs/blogger-listener-strategy.md` + CLAUDE.md §29）
- Blogger reverse UTM deploy（pm-26 BLOCKED 維持；per CLAUDE.md §3a Dormant / blocked summary）
- Admin Apply / middleware / `admin-write-cli` 真執行（dormant；per CLAUDE.md §3a）
- FB sidecar 真實寫入（dormant；待 8 項 preflight；per CLAUDE.md §3a）
- Blogger AdSense Batch 2 live repost（BLOCKED；per CLAUDE.md §3a）
- AdSense / commerce real id emit（永禁；red line）
- 完整 `measurementId` / AdSense client / slot 寫入 docs / `MEMORY.md` / ledger（永禁；red line）
- Blogger postId 猜測 / precise `publishedAt` 推導（永禁；per CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3）
- GA4 Admin API / Reporting API 連線（本 repo 永禁；per D1 §9 / D4 §6.5）

---

## 9. Explicit no-touch list（本 phase）

### 9.1 本 phase 完全未動

| 類 | 範圍 |
| --- | --- |
| source | `src/views/` / `src/scripts/` / `src/js/` / `src/styles/` |
| content | `content/settings/` / `content/github/` / `content/blogger/` / `content/templates/` / `content/drafts/` / `content/archive/` / `content/validation-fixtures/` |
| settings | `content/settings/ga4.config.json`（events 宣告 / `measurementId` / `enabled` 全未動） / `content/settings/ads.config.json`（real client / slot 未讀寫） / `content/settings/affiliate-networks.json` / `content/settings/commerce-links.json` / `content/settings/promotion.config.json` / `content/settings/download-assets.json` / `content/settings/download-forms.json` |
| build / deploy | `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` |
| package | `package.json` / lockfile / `vite.config.js` |
| meta | CLAUDE.md / MEMORY.md / docs README |
| external | GA4 後台 / AdSense / Blogger / Google Drive / Search Console / GitHub Pages 後台 |
| admin | Admin Apply / middleware / API / `admin-write-cli` / `safe-write:test` / `--apply` / `dryRun:false` / payload file |
| migration | npm install / amend / rebase / merge / cherry-pick / force-push / `--no-verify` |

### 9.2 後續 E1～E3 phase 預設不動（除非該 phase 明確要求 + Dean explicit approval）

- 不改 `content/settings/ga4.config.json` 之 `measurementId` / `enabled` / `events[]` 宣告
- 不改 `src/views/tracking/ga4.ejs` 之 4-AND gating
- 不改 `src/js/modules/link-tracker.js` 之 delegated listener
- 不改 `src/js/modules/ga4-events.js`
- 不改 `src/scripts/ga4-url-builder.js` 之 cross-link UTM
- 不改 `content/settings/promotion.config.json` 之 FB UTM
- 不動 Blogger 主題（主題 JS / CSS / widget / layout）
- 不打 GA4 Admin API / Reporting API
- 不啟用 Blogger reverse UTM deploy
- 不啟用 Admin write path
- 不啟用 FB sidecar 真實寫入
- 不啟用 commerce L2 / L3 / L4
- 不啟用 download production migration
- 不啟用 Blogger API / Google Drive API
- 不在 docs / `MEMORY.md` / 任何 ledger 寫完整 `measurementId` / AdSense 真實 client / slot / affiliate token / credential

---

## 10. Validation / checks

| 指令 | 結果 | 備註 |
| --- | --- | --- |
| `pwd` | `/d/github/blog-new/portable-blog-system` | baseline §1 |
| `git branch --show-current` | `main` | baseline §1 |
| `git rev-parse --short HEAD` | `50b1536` | baseline §1 |
| `git rev-parse --short origin/main` | `50b1536` | baseline §1 |
| `git status --short` | empty（除本檔新增）| baseline §1 |
| `git log -1 --oneline` | `50b1536 docs(admin): record k9 browser pass` | baseline §1 |
| `git rev-list --left-right --count origin/main...HEAD` | `0 0` | baseline §1 |
| `npm run validate:content` | **未跑**；per CLAUDE.md §3a carry-forward（baseline 0 / 94 / 84；無 regression 風險，因本 phase 不動 source / content / settings） | — |

未跑（per CLAUDE.md §3a / phase scope flag）：

- `npm run build` / `build:github` / `build:blogger` / `build:promotion` / `build:sitemap`：禁止
- `npm run preview` / dev server：禁止
- `npm run check:adsense-resolver` / `check:adsense-article-block` / `check:adsense-anchor-wiring` / `check:blogger-adsense-output` / `check:commerce-affiliate-resolver` / `check:admin-governance-aggregation` / `report:validation` / `check:validation-report` / `check:admin-validation-consume`：本 phase 與 AdSense / commerce / admin 無關；carry-forward
- `safe-write:test` / `admin:write` / `admin-write-cli` / `--apply` / `dryRun:false`：禁止
- GA4 / AdSense / Blogger / Google Drive / Search Console / GitHub Pages 後台：禁止

---

## 11. Cross-links

- `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md`（pre-D series preanalysis；§5.2 / §5.3 候選表；§8 D1～D5 phase 計畫）
- `docs/20260617-night-ga4-d1-parameter-naming-spec.md`（D1；§5 single-source naming；本 phase 之 parameter key / display name 權威）
- `docs/20260617-night-ga4-d4-first-batch-registration-checklist.md`（D4；§5 4 個 dimensions checklist；§6 deferred / excluded；§7 D5 evidence handoff）
- `docs/ga4-parameter-naming-registry.md`（P1 naming + UTM registry；命名規則對齊）
- `docs/ga4-link-tracking-spec.md`（既有 event design / param union / placement enum）
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md`（P1 註冊紀錄；5 dimensions）
- `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`（P1 報表 PASS）
- `docs/20260615-ga4-cross-surface-parameter-management.md`（cross-surface spec + Blogger manual snippet）
- `docs/blogger-listener-strategy.md`（Blogger listener 不對稱；D3 預備）
- `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（current state；Path A 保守）
- `content/settings/ga4.config.json`（masked tail4 `…PF8VD`；events 宣告清單）
- `src/views/tracking/ga4.ejs`（gtag loader；4-AND gating）
- `src/js/modules/link-tracker.js` / `src/js/modules/ga4-events.js`（listener + trackEvent）
- `src/views/layout/article-bottom-nav.ejs`（nav 3 anchor；8 個 `data-ga4-*` attr）
- `src/views/pages/post-detail.ejs:93,194,237,279`（4 處 inline ga4 anchor）
- CLAUDE.md §3a Core operating rules / §3a Red lines / §29

---

（本文件結束）
