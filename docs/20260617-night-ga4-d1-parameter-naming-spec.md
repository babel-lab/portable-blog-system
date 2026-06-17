# GA4 D1 — event parameter / custom dimension naming spec（docs-only）

- **Phase**：`20260617-night-ga4-d1-parameter-naming-spec-docs-only-a`
- **Date**：2026-06-17（Asia/Taipei；night, 23:30+）
- **Type**：**docs-only naming spec**（唯一 mutation = 本 doc 新增；CLAUDE.md / MEMORY.md / source / settings / content / build / dist 皆不動）
- **Verdict**：**SPEC ONLY — no source / settings / GA4 backend changes**
- **Baseline**：`main` HEAD == origin/main == `e95950ed8aef8c629b576afc17259aaf6b06b86d`（short `e95950e`；subject `docs(ga4): preanalysis dimension expansion`）；ahead/behind = 0/0；working tree clean。
- **Predecessor**：`docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md`（同日 23:13+；§5.2 / §5.3 候選表 + §8 D1～D5 phase 計畫）
- **Scope flag**：**不**改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md；**不** build / deploy / dev / Blogger repost / admin write / safe-write:test / --apply / dryRun:false / 打 GA4 / AdSense / Blogger / Google Drive / Search Console 後台。

> 本檔目的：把 predecessor preanalysis §5.2 P2 / §5.3 P3 候選 dimensions，整理成**單一權威 naming spec**，供後續 phase 使用：
>
> - GA4-D4 — Dean 於 GA4 後台 Admin → Custom definitions → Create custom dimensions 之**逐項勾選 checklist**
> - GA4-D5 — Dean 於 GA4 DebugView / Realtime / Explore 之 **evidence 驗證 checklist**
> - GA4-D2 / GA4-D3 — 若未來 Dean 決定擴張需要 source / Blogger listener 改動之 **wiring preflight**
>
> ⚠️ 本 phase **不**啟動任何 source / GA4 後台改動；不註冊任何 dimension；不打 Realtime / DebugView。

---

## 1. Baseline verify observed

```
pwd                                     /d/github/blog-new/portable-blog-system
branch                                  main
HEAD                                    e95950ed8aef8c629b576afc17259aaf6b06b86d
origin/main                             e95950ed8aef8c629b576afc17259aaf6b06b86d
ahead / behind                          0 / 0
working tree                            clean
latest subject                          docs(ga4): preanalysis dimension expansion
npm run validate:content                0 errors / 94 warnings / 84 issue-posts（對齊 CLAUDE.md §3a baseline）
```

baseline 與 phase prompt §A 完全一致。inspection 全為 `Read` / `Grep`；未觸 receive 任何受控檔案。

---

## 2. Scope summary

| 動作 | 範圍 |
| --- | --- |
| 新增 | `docs/20260617-night-ga4-d1-parameter-naming-spec.md`（本檔） |
| 修改 | **無** |
| 已跑（read-only） | baseline git 7 件、`npm run validate:content`、`Read` / `Grep` inspect `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md` / `docs/ga4-parameter-naming-registry.md` / `src/views/layout/article-bottom-nav.ejs` / `src/views/pages/post-detail.ejs`（grep `data-ga4-event` / `data-ga4-param-*`） |
| 未動 | `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `.cache/` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md / docs/README |
| 未跑 | build / build:github / build:blogger / build:promotion / build:sitemap / deploy / preview / dev server / `safe-write:test` / `admin:write` / `admin-write-cli` / `--apply` / `dryRun:false` / Blogger / GA4 / AdSense 後台 / npm install / amend / rebase / force-push |

---

## 3. Source documents inspected

| doc / file | 用途 | 確認重點 |
| --- | --- | --- |
| `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md` | 上一輪 preanalysis | §3.1 4-AND gating；§3.3 surface coverage；§4 LIVE event / param inventory；§5.2 P2 / §5.3 P3 候選；§6 red lines；§7 surface gap；§8 D1～D5 phase 計畫 |
| `docs/ga4-parameter-naming-registry.md` | P1 + UTM naming registry（pm-48 / pm-52） | §1 measurementId（本檔僅 masked tail4 `…PF8VD`）；§6 event 命名規則（snake_case）；§6.4 param 命名（snake_case；短而具體） |
| `content/settings/ga4.config.json` | GA4 settings | `ga4.enabled=true`；`ga4.measurementId`（masked tail4 = `…PF8VD`）；events 宣告清單與實際 emit 已 drift（events 宣告未 wire；real emit 為 inline attr family B） |
| `src/views/tracking/ga4.ejs` | gtag loader | 4-AND gating；不在本 phase 改 |
| `src/js/modules/link-tracker.js` | delegated click listener | 全頁掃 `[data-ga4-event]` + 全部 `data-ga4-param-*` 為 params；GitHub Pages 已 LIVE |
| `src/js/modules/ga4-events.js` | trackEvent helper | `gtag` 不存在時 no-op；safe at `enabled=false` |
| `src/views/layout/article-bottom-nav.ejs` | nav anchor source（3 處：prev / next / home） | 確認 `data-ga4-event="click_other_link"` + 8 個 `data-ga4-param-*`：`surface` / `click_area` / `nav_direction` / `post_slug` / `target_slug` / `target_url` / `link_label`（home 缺 `link_label` 之 title 但保留 `link_label="回首頁"`） |
| `src/views/pages/post-detail.ejs` | 4 處 inline ga4 anchor | line 93（CTA top；`click_affiliate_cta`；placement `article_top`）；line 194（CTA bottom；`click_affiliate_cta`；placement `article_bottom`；⚠️ predecessor §4.2 表格未列；本 spec 補登）；line 237（related；`click_related_link`；placement `related_links`）；line 279（other；`click_other_link`；placement `other_links`） |
| `src/scripts/ga4-url-builder.js` | UTM helper（cross-link / FB） | 本 phase 不改；僅交叉確認 `utm_*` 屬 GA4 內建 dimension，無須 custom |

> ⚠️ predecessor preanalysis §4.2 之 LIVE emit 表格**漏列 `post-detail.ejs:194`**（bottom affiliate CTA；placement = `article_bottom`）；本 spec 補登。其餘 emit 行為與 predecessor 一致。

---

## 4. Current LIVE emitted parameter summary（GitHub Pages；grep 證據導向）

### 4.1 LIVE event surface（GitHub Pages）

| event_name | trigger anchor | placement | source |
| --- | --- | --- | --- |
| `page_view` | gtag auto | — | gtag config |
| `click_affiliate_cta` | `<a class="lab-affiliate-box__link">` | `article_top` / `article_bottom` | `post-detail.ejs:93,194` |
| `click_related_link` | `<a class="lab-related-links__link">` | `related_links` | `post-detail.ejs:237` |
| `click_other_link` | (1) `<a class="lab-other-links__link">`<br>(2) `<a class="lab-article-bottom-nav__link…">`（prev / next / home） | (1) `other_links`<br>(2) `article_bottom_nav`（區分靠 `click_area`） | `post-detail.ejs:279` + `article-bottom-nav.ejs:18,24,29` |

⚠️ Blogger surface 之 `click_*` event **不**會被送出（無 listener；attr 亦無）；per predecessor §3.3 / §7。

### 4.2 LIVE parameter inventory（含 emit-surface 細粒度）

| param_key | events 上 emit | LIVE 值範例 | emit-surface 細節 | source |
| --- | --- | --- | --- | --- |
| `surface` | `click_other_link`（nav 3 anchors） | `github_pages` | ⚠️ **僅 nav anchor 注入**；CTA / related / other aside **未注入**（per grep 確認） | `article-bottom-nav.ejs:18,24,29` |
| `click_area` | `click_other_link`（nav 3 anchors） | `article_bottom_nav` | 僅 nav；otherLinks aside 缺值 → 在 GA4 為 `(not set)`（dimension 分流關鍵） | 同上 |
| `nav_direction` | `click_other_link`（nav 3 anchors） | `previous` / `next` / `home` | 僅 nav | 同上 |
| `post_slug` | nav + CTA top + CTA bottom + related + other | `github-pages-blog-planning` | 全 5 處 anchor | 同 anchor + `post-detail.ejs:93,194,237,279` |
| `target_slug` | `click_other_link`（nav 3 anchors） | `<post.slug>` / `home` | 僅 nav | `article-bottom-nav.ejs:18,24,29` |
| `target_url` | `click_other_link`（nav 3 anchors） | `/portable-blog-system/posts/<slug>/` | 僅 nav | 同上 |
| `link_label` | nav + CTA top + CTA bottom + related + other | 連結文字（多為標題或固定字） | 全 5 處 anchor | 同 anchor |
| `link_type` | CTA top + CTA bottom + related + other | `affiliate` / `cross_site` / `internal` / `external` | aside 三處 + CTA 兩處（共 4 anchor classes） | `post-detail.ejs:93,194,237,279` |
| `link_url` | CTA top + CTA bottom + related + other | `https://...?uid1=blog` | 同上 4 anchor classes | 同上 |
| `outbound` | CTA top + CTA bottom + related + other | `true` / `false`（字串） | 同上 4 anchor classes | 同上 |
| `provider` | CTA top + CTA bottom | `通路王`（目前唯一 active network） | 僅 affiliate CTA | `post-detail.ejs:93,194` |
| `placement` | CTA top + CTA bottom + related + other | `article_top` / `article_bottom` / `related_links` / `other_links` | 同上 4 anchor classes；nav 不注入 `placement`（以 `click_area` 區分） | 同上 |
| `link_source_key` | related + other（conditional；僅 `sourceKey` 有值才 emit） | `taipei-library` | aside 兩處；非全 anchor | `post-detail.ejs:237,279` |

⚠️ 關鍵不對稱：

- `surface` / `click_area` / `nav_direction` / `target_slug` / `target_url` **只在 nav** 注入；非 nav 之 click 沒這 5 個 param
- `link_type` / `link_url` / `outbound` / `placement` **只在 CTA / related / other** 注入；nav 沒這 4 個（nav 對應 placement 概念由 `click_area=article_bottom_nav` + `nav_direction` 承擔）
- `provider` **只在 affiliate CTA** 注入（top + bottom）
- `link_source_key` **只在 related / other aside** 且 entry 提供 `sourceKey` 才注入

未來若 D4 後台註冊任一 dimension，其 `(not set)` 比例會直接受此「注入範圍」影響；報表 filter 須先固定 event_name + 對應 click_area / placement 再讀對應 dimension。

---

## 5. Recommended GA4 custom dimension table（P2 / P3）

> 共同 column 定義：
>
> - **Display name** = GA4 後台 Admin → Custom definitions → Create custom dimensions → "Dimension name" 欄之**人類可讀名稱**
> - **Parameter** = `data-ga4-param-{key}` 對應之 GA4 event parameter key
> - **Scope** = Event / User / Item；本檔候選**全為 Event scope**；若未指定預設 Event
> - **Source surface** = 何 platform 實際 emit；目前所有 LIVE emit 皆在 GitHub Pages（Blogger surface 缺 listener；per §7）
> - **Source status** = `LIVE` / `planned` / `blocked` / `not_recommended`
> - **Event(s)** = 該 param 出現於哪個 event_name；含 placement 細粒度
> - **Value type** = `string` / `number` / `boolean`（GA4 dimension 值一律為 string；本欄表示**原始語義型別**）
> - **Cardinality** = `low` / `medium` / `high`（low = ≤ ~10 distinct；medium = 10–1000；high > 1000 / 隨內容線性成長）
> - **Privacy/secret risk** = `none` / `caution` / `forbidden`
> - **Registration priority** = `P1-strict` / `P2` / `P3` / `not_recommended` / `forbidden`
> - **Dean backend action required?** = ✅ = Dean 須在 GA4 後台 Admin → Custom definitions 註冊；❌ = 不需 / 不可註冊
> - **Notes** = 補充：cardinality 替代、wire 成本、blocker 等

### 5.1 P2 已 LIVE / 高 ROI / 0 source 成本（建議優先註冊）

| order | Display name | Parameter | Scope | Source surface | Source status | Event(s) | Value type | Cardinality | Privacy | Reg priority | Dean backend? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P2-1 | Link Type | `link_type` | Event | GitHub Pages | LIVE | `click_affiliate_cta`（top + bottom）/ `click_related_link` / `click_other_link`（aside；nav 無） | string | low（4 值：`affiliate` / `cross_site` / `internal` / `external`） | none | **P1-strict（建議補登）** | ✅ | predecessor §5.2 標 "P1 strict（建議補登）"；P1 註冊批次未含；DebugView 報表派得上用場 |
| P2-2 | Affiliate Network | `provider` | Event | GitHub Pages | LIVE | `click_affiliate_cta`（top + bottom） | string | low（目前單一 `通路王`；commerce L2 後可能 → medium） | none | **P2** | ✅ | affiliate.networks 之 `displayName`；commerce L2 啟動後拓展 |
| P2-3 | Placement | `placement` | Event | GitHub Pages | LIVE | `click_affiliate_cta` / `click_related_link` / `click_other_link`（aside；nav 無） | string | low（4 值：`article_top` / `article_bottom` / `related_links` / `other_links`） | none | **P2** | ✅ | nav 之 placement 概念由 `click_area` 承擔；報表 filter 須注意 nav `placement=(not set)` |
| P2-4 | Link Label | `link_label` | Event | GitHub Pages | LIVE | 全 5 anchor classes | string | high（≒ 標題；隨文章增加） | caution（隨文章標題改名 → dimension 連續性破裂；接受 GA4 自動「(other)」聚合） | **P2（caution）** | ✅ | 高 cardinality；若 ROI 不足可改 `target_slug` 替代 |

### 5.2 P2 候選但 caution / 建議 skip（已 LIVE；高 cardinality）

| order | Display name | Parameter | Scope | Source surface | Source status | Event(s) | Value type | Cardinality | Privacy | Reg priority | Dean backend? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P2-5 | Target URL | `target_url` | Event | GitHub Pages | LIVE | `click_other_link`（nav 3 anchors only） | string | high | caution（高 cardinality；資訊已含於 `target_slug`） | **not_recommended**（建議 skip） | ❌ | 替代方案：直接用 `target_slug` dimension；若仍需 URL 可 GA4 Explore 串 `event_params.target_url`（不註冊）；註冊只浪費 dimension 配額 |

### 5.3 P2 候選但需 source change（planned；GA4-D2 preflight 落地後才能 wire）

| order | Display name | Parameter | Scope | Source surface | Source status | Event(s)（規劃） | Value type | Cardinality | Privacy | Reg priority | Dean backend? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P2-6 | Content Kind | `content_kind` | Event | GitHub Pages（future） | planned | 全 5 anchor classes（規劃） | string | low（≤ 7 值：`post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page`；per CLAUDE.md §11） | none | **P2（planned）** | ✅（含 D2 source phase） | 對齊 frontmatter `contentKind`；D2 preflight 須評估舊文章 byte-identical-modulo-builtAt + article-block parity guard 影響 |
| P2-7 | Category | `category` | Event | GitHub Pages（future） | planned | 全 5 anchor classes（規劃） | string | low～medium（per `categories.json` 增減） | none | **P2（planned）** | ✅（含 D2 source phase） | 對齊 frontmatter `category`（single）；D2 source；未來可加 category page click 之 attr |
| P2-8 | Commerce Link ID | `commerce_link_id` | Event | GitHub Pages（future） | planned | `click_affiliate_cta`（規劃） | string | medium（per commerce links registry 增減） | none | **P2（planned）** | ✅（含 D2 source phase） | 對齊 `commerce-links.json` 之 `ref`；commerce L2 啟動相依；不可由 URL pattern 自動推斷 `merchantKey` / `networkKey`（per CLAUDE.md commerce red line） |

### 5.4 P3 候選（低急迫；建議延後）

| order | Display name | Parameter | Scope | Source surface | Source status | Event(s) | Value type | Cardinality | Privacy | Reg priority | Dean backend? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P3-1 | Link Source Key | `link_source_key` | Event | GitHub Pages | LIVE（conditional） | `click_related_link` / `click_other_link`（aside；entry 提供 `sourceKey` 才 emit） | string | low～medium | none | **P3** | ✅ | 待 `sourceKey` 採用率提升再註冊；目前 LIVE 但稀疏；報表易 `(not set)` |
| P3-2 | Outbound | `outbound` | Event | GitHub Pages | LIVE | CTA + related + other（4 anchor classes；nav 無） | boolean（string `true`/`false`） | low（2 值） | none | **not_recommended** | ❌ | GA4 報表用 `link_type=external` + `link_url=^https?://` filter 即可；註冊浪費配額 |
| P3-3 | Link URL | `link_url` | Event | GitHub Pages | LIVE | CTA + related + other（4 anchor classes） | string | very high | caution（含 affiliate redirect 之 `uid1`/`uid2` tracking param；公開連結；非 secret；但 high cardinality） | **not_recommended**（forbidden 之相鄰建議：見 §6） | ❌ | 與 `target_url` 概念重疊；註冊 → 報表幾乎全 `(other)` 聚合；改用 `link_type=affiliate` + `provider` dimension 替代 |
| P3-4 | Tag Count | `tag_count` | Event | GitHub Pages（future） | planned | 全 5 anchor classes（規劃） | number（GA4 dimension 仍以 string 儲存） | low（0–~20 / 文章） | none | **P3** | ✅（含 D2 source phase） | 低 ROI；報表用「文章長度 vs 點擊」可改用 GA4 custom metric `article_word_count` 替代但**不**註冊（per predecessor §5.4） |
| P3-5 | Series Key | `series_key` | Event | GitHub Pages（future） | planned | 全 5 anchor classes（規劃） | string | low（per `series.json`） | none | **P3** | ✅（含 D2 source phase） | series 採用率低；待 series 內容增加 |
| P3-6 | Merchant Key | `merchant_key` | Event | GitHub Pages（future） | planned | `click_affiliate_cta`（規劃） | string | low（per `affiliate-networks.json`） | none | **P3** | ✅（含 D2 source phase） | 對齊 commerce L2 / multi-network 啟動；目前單一 network；過早註冊 ROI 低 |
| P3-7 | Label Override Present | `label_override_present` | Event | GitHub Pages（future） | planned | `click_affiliate_cta`（規劃） | boolean | low（2 值） | none | **P3** | ✅（含 D2 source phase） | 觀察 `labelOverride` 採用率用；ROI 待評估 |
| P3-8 | Surface Ads Enabled | `surface_ads_enabled` | Event | GitHub Pages（future） | planned | all events（page-level） | boolean | low（2 值） | none | **P3** | ✅（含 D2 source phase） | 對齊 `settings.ads.enabled`；可與 AdSense ramp 配合觀察 |

### 5.5 Custom metrics（GA4 event-scoped numeric metric；非 dimension）

| metric name | 用途 | 建議 | 原因 |
| --- | --- | --- | --- |
| `link_position_index` | nav / related / other 之 link 順位（1, 2, …） | **P3** | 需 source D2；ROI 低；報表用 `link_label` order 即可推 |
| `article_word_count` | 文章字數 | **not_recommended** | 屬 page metadata；不需 event metric；GA4 Explore 用 user-defined property 即可 |
| `affiliate_link_count_in_block` | per-block 連結數 | **not_recommended** | 報表派不上用場 |

> ⚠️ GA4 custom dimensions 標準資源上限約 **50** 個 event-scoped；目前 P1 已用 5–6 個；本 spec 建議**先 land P1-strict 補登（P2-1 Link Type）+ P2 / order 2–4（共 3 個）** = 累計 ≤ 10；P2-5 skip；P2-6/7/8 待 D2 source；P3 全延後。

---

## 6. Deferred / not recommended table

| param | 原因 | 替代方案 | 何時可解封 |
| --- | --- | --- | --- |
| `target_url` | 高 cardinality；資訊已含於 `target_slug` | 用 `target_slug` dimension；URL 可在 Explore 用 event_params 串 | Dean 確認 GA4 Explore 串 event_params 不便利時可重新評估 |
| `link_url` | very high cardinality；含 affiliate `uid1` tracking param | 用 `link_type=affiliate` + `provider` filter；具體 URL 觀察用 GA4 Explore | 不建議解封；若需個別 affiliate 觀察改用 `commerce_link_id`（P2-8） |
| `outbound` | 與 `link_type` 高度重疊 | 用 `link_type=external` filter | 不建議解封 |
| `link_label` | 高 cardinality；標題改字 → dimension 連續性破裂 | 接受 GA4 自動 `(other)` 聚合；或改用 `target_slug` | 註冊但接受 "(other)" 聚合；報表慎用 |
| `is_admin_dev_mode` | admin 不進 prod build / noindex（per CLAUDE.md §29） | 報表 filter `hostname` 即可 | 不啟動 |
| `is_preview` | 已由 4-AND gating（`isProdBuild=false`）阻擋 | 無需註冊 | 不啟動 |
| `cross_link_direction` | GA4 內建 `utm_source` 已可分（`github_pages` vs `blogger`） | 用 traffic source dimension 報表 filter | 不啟動 |
| `fb_sidecar_status` | FB sidecar 真實寫入 dormant（per CLAUDE.md §29）；屬 ADMIN governance signal | ADMIN R-Aggregation 即可 | FB sidecar 啟用前**永禁**註冊 |
| `articleAd_block_count` | dev observation 用；非 prod report | `check:adsense-resolver` dev script 替代 | 不啟動 |
| `block_id` | click_area 已足；高細碎 | 用 `click_area` + `placement` | 不啟動 |
| `host` | GA4 內建 `hostname` dimension 即可 | 報表 filter 即可 | 不啟動 |
| `is_first` / `is_last` | nav anchor 缺失即可推導（report 用「無 `nav_direction=previous`」） | 報表 filter 即可 | 不啟動 |
| `blogger_published_state` | 屬 ADMIN governance；非 GA4 click event | ADMIN R-Aggregation 即可 | 不啟動 |

⚠️ Blogger postId / publishedAt 類欄位**不適合**作為 GA4 dimension；屬 frontmatter metadata；且須 Dean evidence 提供，不可猜測（per CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3）。

---

## 7. Forbidden parameter list（永禁 emit / 永禁註冊；red line）

| 項 | 原因 | source rule |
| --- | --- | --- |
| AdSense `data-ad-client` 真實值（如 `ca-pub-…`） | AdSense red line；只存於 `content/settings/ads.config.json` | CLAUDE.md §3a Red lines / AdSense |
| AdSense `data-ad-slot` 真實值 | 同上 | 同上 |
| Affiliate dashboard credentials（email / password / OAuth client secret / API key / refresh token / access token / bearer token / Authorization header） | commerce red line | CLAUDE.md §3a Red lines / Commerce |
| Affiliate dashboard 統計（commission / payout / clickCount） | 同上 | 同上 |
| Affiliate tracking URL 中之 author token（如 `uid1=<personal-id>`） | 非 secret 但**不**建議註冊為 dimension；已存於 `link_url`（亦不建議註冊；per §5.4 / §6） | `link-tracker.js` + `link_url` LIVE 行為 |
| Google Forms responses（email / 姓名 / 電話 / 學校 / 答覆） | download red line | CLAUDE.md §3a Red lines / Download |
| Blogger postId（猜測值；非 Dean evidence） | metadata backfill rule | CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3 |
| 精確 `publishedAt`（由 live verification 約略時間推導） | 同上 | 同上 |
| 完整 GA4 `measurementId` 寫入 docs / `MEMORY.md` / 任何 ledger | naming registry 慣例 | `docs/ga4-parameter-naming-registry.md` §1（僅可 masked tail4） |
| 完整 AdSense client / slot 寫入 docs / `MEMORY.md` / 任何 ledger | AdSense red line | CLAUDE.md §3a Red lines |

> ⚠️ 本檔遵守該 red line：全文不含完整 `measurementId`、不含 AdSense 真實 client / slot、不含 affiliate tracking URL 完整值、不含 token / credential。

---

## 8. Source-state breakdown（明確區分三類）

> 為避免 D4 / D5 phase 在「該欄位是否已有資料」上踩雷，明確區分：

### 8.1 已 emit（GitHub Pages LIVE；可立即在 GA4 後台註冊；不需 source / deploy）

| param | 對應 §5 order | 註冊前提 |
| --- | --- | --- |
| `link_type` | P2-1 | ✅ 已 emit；註冊後新事件即可在 Explore 看見；歷史**不**回填 |
| `provider` | P2-2 | ✅ 已 emit（僅 affiliate CTA） |
| `placement` | P2-3 | ✅ 已 emit（aside 4 anchor classes；nav 無 placement） |
| `link_label` | P2-4 | ✅ 已 emit（全 5 anchor classes） |
| `target_url` | P2-5 | ⚠️ 已 emit（僅 nav）；**不建議註冊**（per §5.2 / §6） |
| `link_source_key` | P3-1 | ✅ 已 emit（conditional；entry 提供才 emit） |
| `outbound` | P3-2 | ⚠️ 已 emit；**不建議註冊**（per §6） |
| `link_url` | P3-3 | ⚠️ 已 emit；**不建議註冊**（per §6） |

### 8.2 已在 GA4 後台註冊或建議補登（accumulated state）

| param | 對應 §5 order | 狀態 |
| --- | --- | --- |
| `click_area` | P1（已 registered） | ✅ `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` §3 |
| `nav_direction` | P1（已 registered） | ✅ 同上 |
| `post_slug`（source_post_slug equivalent） | P1（已 registered） | ✅ 同上 |
| `target_slug` | P1（已 registered） | ✅ 同上 |
| `surface` | P1（已 registered） | ✅ 同上 |
| `link_type` | P1-strict 建議補登（P2-1） | ⚠️ predecessor 標 "建議一併"；本 spec 列為 D4 第一項補登 |

### 8.3 Future candidate（尚未 emit；屬 D2 source preflight scope）

| param | 對應 §5 order | 阻擋條件 |
| --- | --- | --- |
| `content_kind` | P2-6 | D2 preflight + minimal source phase + redeploy |
| `category` | P2-7 | D2 preflight + minimal source phase + redeploy |
| `commerce_link_id` | P2-8 | D2 preflight + minimal source phase + redeploy + commerce L2 啟動 |
| `tag_count` | P3-4 | D2；ROI 低；建議延後 |
| `series_key` | P3-5 | D2；待 series 內容；建議延後 |
| `merchant_key` | P3-6 | D2；待 multi-network；建議延後 |
| `label_override_present` | P3-7 | D2；ROI 待評估；建議延後 |
| `surface_ads_enabled` | P3-8 | D2；可與 AdSense ramp 配合；建議延後 |

⚠️ 「已 emit ≠ 已註冊」；「已註冊 ≠ 已有歷史資料」：GA4 註冊**不**回填；以 Dean approve 註冊時點為起算。

---

## 9. D4 manual registration checklist handoff

> 此節定義 GA4-D4 phase 之**設計輸入**：未來 D4 phase 之 docs 將以本表為模板，產出 Dean 可在 GA4 後台逐項勾選之 checklist。

### 9.1 D4 phase 之 SOP（per predecessor §8.4）

```
1. 開新 phase docs：docs/2026XXXX-ga4-d4-p2-registration-checklist.md
2. 引用本 spec §5（不複製；reference link）
3. 把 §5.1 之 P2-1 ~ P2-4 整理為 4 行勾選清單
4. 每行包含：
   - GA4 後台路徑（Admin → Data display → Custom definitions → Create custom dimensions）
   - Display name（含中文 / 英文對照；建議 English UI）
   - Parameter name（snake_case；對齊本 spec §5）
   - Scope（Event）
   - Description（50 字內；對齊 GA4 Description 欄位上限）
   - Source surface 提醒（僅 GitHub Pages；Blogger 缺 listener）
   - 歷史不回填提醒（per §8.2）
5. D4 phase 不打 GA4 後台；不註冊；僅產 docs checklist
```

### 9.2 D4 之**建議 first batch**（最小 source change path；零 source / 零 deploy）

| order | Display name | Parameter | Reason for batching |
| --- | --- | --- | --- |
| 1 | Link Type | `link_type` | P1-strict 補登；4 個 LIVE 值；報表派得上用場 |
| 2 | Affiliate Network | `provider` | LIVE；commerce L2 後可拓展 |
| 3 | Placement | `placement` | LIVE；4 LIVE 值；和 `click_area` 對照可區分 nav / aside |
| 4 | Link Label | `link_label` | LIVE；接受 `(other)` 聚合；ROI 觀察期 |

> 上 4 個全 zero source / zero deploy；Dean 註冊後新事件直接送入 GA4 Explore。

### 9.3 D4 之**建議 second batch**（待 D2 source phase；需 redeploy）

| order | Display name | Parameter | Pre-req |
| --- | --- | --- | --- |
| 5 | Content Kind | `content_kind` | D2 preflight + source change + redeploy |
| 6 | Category | `category` | D2 preflight + source change + redeploy |
| 7 | Commerce Link ID | `commerce_link_id` | D2 + commerce L2 啟動 + source change + redeploy |

⚠️ D4 SOP 嚴禁：

- 不註冊 §6 之 deferred / not_recommended dimensions
- 不註冊 §7 之 forbidden dimensions
- 不註冊 GA4 內建 dimensions（`utm_*` / `hostname` / `page_title` / `page_location` 等）
- 不在 docs 寫完整 `measurementId`
- 不在 docs 寫完整 AdSense client / slot
- 不打 GA4 Admin API / Reporting API

---

## 10. D5 DebugView / Realtime evidence checklist handoff

> 此節定義 GA4-D5 phase 之**設計輸入**：D5 phase 之 docs 將以本表為模板，產出 Dean 之 evidence record。

### 10.1 D5 phase 之 SOP（per predecessor §8.5）

```
1. 開新 phase docs：docs/2026XXXX-ga4-d5-p2-evidence-record.md
2. 引用本 spec §5 + D4 註冊 checklist
3. Dean 於下列 GA4 介面收集 evidence：
   - Admin → Custom definitions → 註冊狀態截圖（per dimension）
   - Reports → Realtime → Events → 觸發近 30 分內事件之 param 值
   - Reports → Engagement → Events → 對應 event_name 之 6h~30d aggregate
   - Explore → Free form → 加入新註冊之 dimension → 確認非全 `(not set)`
4. 截圖貼入 docs（masked sensitive：full measurementId 不可入；只可 tail4 `…PF8VD`）
5. 對齊 D4 batch 之每一 dimension 寫一行 verdict：PASS / PARTIAL / FAIL
6. D5 phase 不改 source；不註冊；僅紀錄 evidence
```

### 10.2 D5 之**驗證最小集**（per dimension）

| dimension | 驗證最小集 |
| --- | --- |
| Link Type | Realtime 看到 `link_type=affiliate` ≥ 1 hit；Explore 看到 `link_type` × `event_name` 分桶 |
| Affiliate Network | Realtime 看到 `provider=通路王` ≥ 1 hit；非 `(not set)` |
| Placement | Realtime 看到 `placement=article_top` / `related_links` / `other_links` ≥ 各 1 hit |
| Link Label | Realtime 看到非 `(not set)` 之 `link_label` ≥ 1 hit；接受未來 GA4 自動 `(other)` 聚合 |

### 10.3 D5 之**容錯**

| 觀察 | 解釋 | 動作 |
| --- | --- | --- |
| `(not set)` 比例高 | nav anchor 不注入 `placement`；CTA / related / other 不注入 `surface` / `click_area` / `nav_direction` / `target_slug` / `target_url`；屬 emit-surface 不對稱（per §4.2） | 報表 filter 須先固定 `event_name` + 對應 `click_area` / `placement` 再讀 dimension |
| Blogger surface 完全無 `click_*` event | Blogger listener 未落地（per predecessor §3.3 / §7） | 不需驚訝；屬已知 gap；D3 phase 解；本 D5 範圍**僅** GitHub Pages |
| dimension 註冊後仍無資料 | GA4 註冊**不**回填歷史；以新事件為準 | 等 24~72 hr aggregate；或於 DebugView 即時驗證 |

---

## 11. D2 / D3 之相依（仍未進入；本 spec 僅 handoff 標示）

### 11.1 何時才需要 D2

per predecessor §8.2，**全部**滿足才考慮：

- D1（本檔）spec land + Dean approve naming
- D4 first batch 已落地 + Dean 確認**ROI 不足**，需要 `content_kind` / `category` / `commerce_link_id` 才能切分
- Dean approve 動 source（minimal additive；mirror `post-detail.ejs:93` inline pattern）

⚠️ 若 D4 first batch 之 4 個 dimension 已能滿足 ROI，**D2 不需要啟動**；屬可選 path。

### 11.2 何時才需要 D3

per predecessor §8.3，**全部**滿足才考慮：

- D1（本檔）spec land
- Dean approve review Blogger 主題之 GA4 listener 可行性
- 與 AdSense ramp / Reverse UTM pm-26 deploy gate 之優先順序評估後啟動

⚠️ Blogger listener 屬第二階段（per CLAUDE.md §29）；本 spec **不**主張立刻啟動。

---

## 12. Explicit no-touch list

### 12.1 本 phase 完全未動

| 類 | 範圍 |
| --- | --- |
| source | `src/views/` / `src/scripts/` / `src/js/` / `src/styles/` |
| content | `content/settings/` / `content/github/` / `content/blogger/` / `content/templates/` / `content/drafts/` / `content/archive/` / `content/validation-fixtures/` |
| settings | `content/settings/ga4.config.json`（events 宣告未動） / `content/settings/ads.config.json`（real client/slot 未讀寫） / `content/settings/affiliate-networks.json`（無動） / `content/settings/promotion.config.json`（無動） / `content/settings/commerce-links.json`（無動） |
| build / deploy | `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` |
| package | `package.json` / lockfile / `vite.config.js` |
| meta | CLAUDE.md / MEMORY.md / docs README |
| external | GA4 後台 / AdSense / Blogger / Google Drive / Search Console / GitHub Pages 後台 |
| admin | Admin Apply / middleware / API / `admin-write-cli` / `safe-write:test` / `--apply` / `dryRun:false` |
| payload | payload files / 第三次 write |
| migration | npm install / amend / rebase / force-push |

### 12.2 後續 D2～D5 phase 預設不動（除非該 phase 明確要求 + Dean explicit approval）

- 不改 `content/settings/ga4.config.json` 之 `measurementId` / `enabled` / `events[]` 宣告
- 不改 `src/views/tracking/ga4.ejs` 之 4-AND gating
- 不改 `src/js/modules/link-tracker.js` 之 delegated listener
- 不改 `src/js/modules/ga4-events.js`
- 不改 `src/scripts/ga4-url-builder.js` 之 cross-link UTM
- 不改 `content/settings/promotion.config.json` 之 FB UTM
- 不動 Blogger 主題（主題 JS / CSS / widget / layout）
- 不打 GA4 Admin API / Reporting API
- 不啟用 Blogger reverse UTM deploy（pm-26 BLOCKED 維持）
- 不啟用 Admin write path
- 不啟用 FB sidecar 真實寫入
- 不啟用 commerce L2 / L3 / L4
- 不啟用 download production migration
- 不啟用 Blogger API / Google Drive API
- 不在 docs / `MEMORY.md` / 任何 ledger 寫完整 `measurementId` / AdSense 真實 client / slot / affiliate token / credential

---

## 13. Final recommendation

### 13.1 短期（本 spec land 之後）

1. **不**主動推進；屬 `docs/20260617-night-project-status-and-next-paths-checkpoint.md` §6 Path A 保守路徑
2. Dean 可依需求啟動 GA4-D4 first batch（per §9.2）；屬 docs-only；零 source / 零 deploy；4 dimensions
3. D5 evidence record 隨 D4 後 24~72 hr 收集；屬 docs-only

### 13.2 中期（D4 first batch 落地後）

1. Dean 評估 ROI：若 4 dimensions 已能切分行為 → **停止**擴張；省下 GA4 配額
2. 若 ROI 不足 → 啟動 D2 preflight；評估 `content_kind` / `category` / `commerce_link_id` 之 wiring
3. D3（Blogger listener）建議**先擱置**；與 AdSense ramp / Reverse UTM pm-26 deploy gate 一起評估

### 13.3 長期（≥ Phase 2）

1. Blogger listener 屬第二階段（per CLAUDE.md §29）；不在本 spec scope
2. Custom metrics（`link_position_index` / `article_word_count`）暫不啟動；ROI 待累積
3. AdSense / commerce real id 永禁 emit；維持 red line

### 13.4 本 spec 之 self-discipline

- 本 spec 為**單一權威 naming source**；後續 D4 / D5 / D2 / D3 之 docs 不重複定義 parameter key / display name；只 reference 本 spec
- 若 Dean 之命名 review 與本 spec drift → **必須**先回頭改本 spec（land 後）才動下游 phase
- 本 spec 不 freeze 完美狀態；未來 commerce L2 / Blogger listener / hostname allowlist 落地時，可於同一檔案內以 §14（待開）方式 amend；amend 必須 docs phase；不直接動下游 GA4 後台

---

## 14. Cross-links

- `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md`（本 spec 之 predecessor；候選來源 + D1～D5 phase 計畫）
- `docs/ga4-parameter-naming-registry.md`（P1 naming + UTM；本 spec 之 §6.4 命名規則對齊）
- `docs/ga4-link-tracking-spec.md`（既有 event design / param union / placement enum）
- `docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`（am-1；taxonomy）
- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（am-3；P1 SOP）
- `docs/20260615-github-pages-live-dom-ga4-nav-observation-record.md`（am-5；DOM 證據）
- `docs/20260615-ga4-bottom-nav-backend-event-receipt-record.md`（am-6；backend evidence）
- `docs/20260615-ga4-custom-dimensions-registration-checklist.md`（am-7；P1 註冊清單；本 spec 之 D4 mirror）
- `docs/20260615-ga4-cross-surface-parameter-management.md`（am-8；cross-surface spec + Blogger manual snippet）
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md`（am-9；P1 註冊紀錄）
- `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`（pm-1；P1 報表 PASS）
- `docs/blogger-listener-strategy.md`（Blogger listener 不對稱 + 方案 A/B/C/D；D3 預備）
- `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（current state；Path A 保守）
- `content/settings/ga4.config.json`（masked tail4 `…PF8VD`；events 宣告清單）
- `src/views/tracking/ga4.ejs`（gtag loader；4-AND gating）
- `src/js/modules/link-tracker.js` / `src/js/modules/ga4-events.js`（listener + trackEvent）
- `src/views/layout/article-bottom-nav.ejs`（nav 3 anchor；8 個 `data-ga4-*` attr）
- `src/views/pages/post-detail.ejs:93,194,237,279`（4 處 inline ga4 anchor；含 bottom CTA）

---

（本文件結束）
