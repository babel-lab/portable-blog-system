# GA4 P2 / P3 dimension expansion — preanalysis（docs-only）

- **Phase**：`20260617-night-ga4-p2-p3-dimension-expansion-preanalysis-docs-only-a`
- **Date**：2026-06-17（Asia/Taipei；night, 23:13+）
- **Type**：**docs-only preanalysis**（唯一 mutation = 本 doc 新增 + `MEMORY.md` 不動 + `CLAUDE.md` 不動）
- **Verdict**：**PREANALYSIS ONLY — no GA4 / backend / source / settings changes**
- **Baseline**：`main` HEAD == origin/main == `9a0f9f6d0344e4bc540a383879e97357517882d9`（short `9a0f9f6`；subject `docs(blogger): preflight p3 metadata backfill`）；ahead/behind = 0/0；working tree clean（`git status --short` 為空）
- **Scope flag**：**不**改 `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md；**不** build / 不 deploy / 不 dev / 不 Blogger repost / 不 admin write / 不 safe-write:test / 不 --apply / 不 dryRun:false / 不打 GA4 後台 / 不打 AdSense 後台 / 不打 Blogger 後台 / 不打 Google Drive / 不打 Search Console。

> 本檔目的：在 GA4 P1（`article_bottom_nav` 5 dimensions + `Link Type`）已於 2026-06-15 17:35 人工驗證 PASS 之後，把目前 BLOG 系統實際送出 / 已可送出 / 候選未送出之 event parameters 全面盤點，識別**哪些可註冊為 GA4 custom dimensions（P2 / P3）**、**哪些 surface（Blogger / pages）缺 listener / 缺 attr / 缺 mapping**、以及**哪些屬於 secret / privacy / cardinality red line 不可註冊**。後續實作分成 GA4-D1～GA4-D5 五個小 phase，全部 docs-only 起步，逐步降低 risk。
>
> ⚠️ 本 phase **不**啟動 source change、**不**登入 GA4 / Blogger / AdSense / Search Console 後台、**不**改 `content/settings/ga4.config.json` 之 events 宣告。後續 phase 各須 Dean explicit approval。

---

## 1. Baseline verify observed

```
pwd                                     /d/github/blog-new/portable-blog-system
branch                                  main
HEAD                                    9a0f9f6d0344e4bc540a383879e97357517882d9
origin/main                             9a0f9f6d0344e4bc540a383879e97357517882d9
ahead / behind                          0 / 0
working tree                            clean
latest subject                          docs(blogger): preflight p3 metadata backfill
npm run validate:content                0 errors / 94 warnings / 84 issue-posts（與 CLAUDE.md §3a baseline 一致）
```

baseline 與 phase prompt §A 預期完全一致。本 phase 之 read-only inspection 未對任何受控檔案造成 mutation。

---

## 2. Scope summary

| 動作 | 範圍 |
| --- | --- |
| 新增 | `docs/20260617-night-ga4-p2-p3-dimension-expansion-preanalysis.md`（本檔） |
| 修改 | **無** |
| 已跑（read-only） | baseline git 7 件、`npm run validate:content`、`Read` / `Grep` / `Glob` inspect `src/views/tracking/` / `src/views/layout/article-bottom-nav.ejs` / `src/views/pages/post-detail.ejs` / `src/views/blogger/*` / `src/js/modules/ga4-events.js` / `src/js/modules/link-tracker.js` / `src/scripts/ga4-url-builder.js` / `content/settings/ga4.config.json` / 既有 `docs/20260615-ga4-*` / `docs/ga4-parameter-naming-registry.md` |
| 未動 | `src/` / `views/` / `scripts/` / `content/` / `settings/` / `templates/` / `public/` / `dist*` / `gh-pages` / `.cache/` / `package.json` / lockfile / `vite.config.js` / CLAUDE.md / MEMORY.md / docs README |
| 未跑 | build / build:github / build:blogger / build:promotion / build:sitemap / deploy / preview / dev server / `safe-write:test` / `admin:write` / `admin-write-cli` / `--apply` / `dryRun:false` / Blogger / GA4 / AdSense 後台 / npm install |

---

## 3. Current GA4 state（accepted baseline）

### 3.1 settings / config

| 項目 | 值 | source |
| --- | --- | --- |
| `ga4.enabled` | `true` | `content/settings/ga4.config.json` |
| `ga4.measurementId`（masked tail4） | `G-…PF8VD`（tail4 = `PF8VD`） | `content/settings/ga4.config.json` |
| 啟用日期 | 2026-05-21（pm-43；commit `09b9a67`；pm-45 deploy `f32f7d3`；pm-46 Realtime 人工驗收 PASS） | `docs/ga4-parameter-naming-registry.md` §1 |
| Gating | 4-AND（`ga4 存在 && ga4.enabled===true && ga4.measurementId 非空 && isProdBuild===true`） | `src/views/tracking/ga4.ejs` |
| `ga4.events[]` 宣告清單 | `page_view` / `internal_link_click` / `tag_click` / `category_click` / `affiliate_click` / `download_click` / `social_click` / `blogger_to_github_click` / `github_to_blogger_click` | `content/settings/ga4.config.json` |
| ⚠️ events 宣告與實際 emit 之關係 | **宣告清單目前未 wire**；實際 fire 之 event 為 source 端 inline attrs 之 `click_*` family B（`click_other_link` / `click_affiliate_cta` / `click_related_link`） | `docs/20260615-ga4-custom-dimensions-registration-checklist.md` §2 |

> **⚠️ 安全**：本檔之後**不再** echo 完整 `measurementId`；引用一律用 masked tail4 `…PF8VD`。後續 `docs/` 亦比照。

### 3.2 client-side listener / loader

| 元件 | 角色 | source |
| --- | --- | --- |
| `src/views/tracking/ga4.ejs` | gtag loader；4-AND gating；輸出 `gtag('config', measurementId)` | line 1–10 |
| `src/views/tracking/ga4-events-helper.ejs` | render helper；接受 `event` / `params` → 輸出 `data-ga4-event="…" data-ga4-param-key="…"`；目前 **production 未使用**（per `docs/20260615-ga4-custom-dimensions-registration-checklist.md` §3 註） | line 1–9 |
| `src/js/modules/ga4-events.js` | `trackEvent(name, params)`；`gtag` 不存在時 no-op；safe at `enabled=false` | line 1–16 |
| `src/js/modules/link-tracker.js` | delegated click listener；掃 `[data-ga4-event]` + 全部 `data-ga4-param-*` → `trackEvent` | line 1–26 |
| `src/scripts/ga4-url-builder.js` | UTM build helper（cross-link / FB promotion）；`applyCrossSiteUtm({ direction: 'to_blogger' | 'to_github' })` | line 142–181 |

### 3.3 surface coverage

| surface | gtag loader | listener | data-ga4 attr emit | LIVE events |
| --- | --- | --- | --- | --- |
| **GitHub Pages**（`babel-lab.github.io/portable-blog-system/`） | ✅（per `views/layout/base.ejs` include）；prod build only | ✅ `link-tracker.js` 全頁 delegate | ✅ `post-detail.ejs` + `article-bottom-nav.ejs` 三處（CTA top / relatedLinks / otherLinks / 4 nav anchors） | `page_view`（auto）；`click_affiliate_cta`；`click_related_link`；`click_other_link`（nav + otherLinks aside） |
| **Blogger**（`babel-lab.blogspot.com`） | ✅（Blogger 主題已接 measurementId；per Dean 之 user 確認） | ❌ **無**（無 `link-tracker.js` 等 delegated listener；per `docs/blogger-listener-strategy.md` §1.3 + 本 phase grep `src/views/blogger/` 全 0 matches） | ❌ **無**（grep `src/views/blogger/` 全 0 matches；`build-blogger.js` 僅含 `applyCrossSiteUtm` import，**不**注入 `data-ga4-*`） | `page_view`（auto） |

> ⚠️ Blogger surface 目前**僅有自動 `page_view`**；任何 `click_*` event 在 Blogger surface **不會被送出**（無 listener；attr 即使後續手動回補也僅是 markup）。per `docs/20260615-ga4-cross-surface-parameter-management.md` §6。

### 3.4 P1 已完成項目（不在本 phase scope；僅 carry-forward）

| # | 項目 | 證據 |
| --- | --- | --- |
| P1-a | 5 個 P1 custom dimensions registered + Link Type | `docs/20260615-ga4-p1-custom-dimensions-registration-record.md` §3（Click Area / Nav Direction / Source Post Slug / Target Slug / Surface；P1 order 1–5 ✅；6 = `Link Type` 建議一併） |
| P1-b | `article_bottom_nav` P1 report verified | `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`（人工 17:35；Source × Target × Direction 報表已有資料） |
| P1-c | Cross-surface 命名 spec | `docs/20260615-ga4-cross-surface-parameter-management.md`（`surface=github_pages` / `blogger`；event name 跨平台一致） |
| P1-d | DebugView SOP + manual checklist | `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md` |

---

## 4. Existing event inventory（LIVE / GitHub Pages 實際送出）

> 本 §4 為「**code grep 證據導向**」之 LIVE 盤點；不憑 settings 宣告或 ledger 推測。grep 範圍 = `src/views/` + `src/js/`；surface = GitHub Pages（Blogger 全 0；per §3.3）。

### 4.1 Event 清單（GitHub Pages LIVE）

| event_name | 觸發 anchor | 觸發 context | trigger origin | EJS source |
| --- | --- | --- | --- | --- |
| `page_view` | 不需 anchor（gtag auto） | 全頁 | gtag.js auto-emit | `src/views/tracking/ga4.ejs:8` |
| `click_affiliate_cta` | `<a class="lab-affiliate-box__link">` | Article top affiliate CTA list（per-link） | inline `data-ga4-event` + `link-tracker.js` delegate | `src/views/pages/post-detail.ejs:93` |
| `click_related_link` | `<a class="lab-related-links__link">` | RelatedLinks aside（per-link） | 同上 | `src/views/pages/post-detail.ejs:237` |
| `click_other_link` | (1) `<a class="lab-other-links__link">` ；(2) `<a class="lab-article-bottom-nav__link…">`（prev / next / home） | (1) OtherLinks aside ；(2) Article bottom nav | 同上 | `src/views/pages/post-detail.ejs:279` + `src/views/layout/article-bottom-nav.ejs:18,24,29` |

> ⚠️ 區分 `click_other_link` 之兩種來源**必須**靠 `click_area`：`article_bottom_nav` = nav；`undefined / 缺` 或未來補上 `other_links` placement = otherLinks aside。per `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md` §5。

### 4.2 Param emit 清單（GitHub Pages LIVE；以 grep 為準）

| param_key | LIVE events 上 emit | example value | cardinality | privacy | source |
| --- | --- | --- | --- | --- | --- |
| `surface` | nav | `github_pages` | low | none | `article-bottom-nav.ejs:18` |
| `click_area` | nav | `article_bottom_nav` | low | none | `article-bottom-nav.ejs:18` |
| `nav_direction` | nav | `previous` / `next` / `home` | low（3 值） | none | 同 anchor |
| `post_slug` | nav + affiliate CTA + related + other | `github-pages-blog-planning` | medium（隨文章成長） | none | 各 anchor |
| `target_slug` | nav | `portable-blog-system-mvp` / `home` | medium | none | 同 anchor |
| `target_url` | nav | `/portable-blog-system/posts/portable-blog-system-mvp/` | high | none | 同 anchor |
| `link_label` | nav + affiliate CTA + related + other | 連結文字（多為文章標題或固定字） | high（≒ 標題） | none | 各 anchor |
| `link_type` | affiliate CTA + related + other | `affiliate` / `cross_site` / `internal` / `external` | low（4 值） | none | `post-detail.ejs:93,237,279` |
| `link_url` | affiliate CTA + related + other | `https://...?uid1=blog` | high | ⚠️ affiliate redirect URL 含 tracking param；**non-secret**（公開連結）；無 token / credential | 各 anchor |
| `outbound` | affiliate CTA + related + other | `true` / `false` | low（2 值） | none | 各 anchor |
| `provider` | affiliate CTA | `通路王` | low（通路名；目前僅 1 個 active） | none | `post-detail.ejs:93` |
| `placement` | affiliate CTA + related + other | `article_top` / `related_links` / `other_links` | low（多枚舉） | none | 各 anchor |
| `link_source_key` | related + other（conditional；僅 entry 有 `sourceKey` 才 emit） | `taipei-library` | low～medium | none | `post-detail.ejs:237,279` |

> ⚠️ 上表為**實際 grep 證據**；與 `docs/20260615-ga4-custom-dimensions-registration-checklist.md` §3 完全一致。

### 4.3 Param 未 emit（PROPOSED；本 phase 不主張立刻 wire）

| param_key | 候選用途 | 候選 event | 現況 | 原因 |
| --- | --- | --- | --- | --- |
| `tag` | hashtag click 區分 | `tag_click` | 未 emit | hashtag 為 display-only `<span>`（per `post-detail.ejs:304`；mirror Blogger）；無 anchor / 無 listener |
| `category` | category page click | `category_click` | 未 emit | category page 連結未掛 `data-ga4-event`（待 grep 確認） |
| `commerce_link_id` | commerce affiliate ref 維度 | future commerce event | 未 emit | 等 commerce L2 / L3 啟動 |
| `affiliate_network` | provider 標準化名 | mirror `provider` | 未 emit | 目前以 `provider` 代表；若統一須 source migration（per registry §10 D5） |
| `outbound_domain` | external 連結網域分桶 | future external event | 未 emit | external link tracking 未啟動 |
| `page_type` | post_detail / home / list 區分 | future page event | 未 emit | 目前以 `surface` + URL pattern 間接判斷 |
| `block_id` | adsense / nav / 區塊 ID | future | 未 emit | 高細碎；click_area 已足 |
| `series_key` | 文章系列 | future | 未 emit | series.json 已 ready；無 attr 拉入 |

---

## 5. Candidate dimensions / metrics（P2 / P3）

### 5.1 候選分類總覽

| 類 | 候選 dimension | 目前 LIVE? | 建議 priority | 建議 scope | source phase 需求 |
| --- | --- | --- | --- | --- | --- |
| **A. platform / surface** | `surface` | ✅ LIVE（GitHub Pages） | **P1**（已 registered；carry-forward） | Event | n/a |
| A | `host`（report-only；用 GA4 内建 `hostname` dimension） | ✅ auto | not custom（用 GA4 内建） | — | n/a；報表 filter 即可 |
| A | `is_admin_dev_mode`（區分 dev-only admin） | ❌ 未 emit；admin not in prod build / noindex | **不註冊**（per CLAUDE.md §29 admin 不進 prod build） | — | 不啟動 |
| A | `is_preview`（區分 `vite preview` 本機） | ❌ 未 emit；目前以 `isProdBuild=false` gating 阻擋 | **不註冊**（gating 已足） | — | 不啟動 |
| **B. content identity** | `post_slug` | ✅ LIVE | **P1**（已 registered） | Event | n/a |
| B | `target_slug` | ✅ LIVE（nav only） | **P1**（已 registered） | Event | n/a |
| B | `content_kind` | ❌ 未 emit；frontmatter 已有 `contentKind` | **P2**（候選） | Event | 需 source phase D2：在 affiliate / related / other / nav anchor 加 `data-ga4-param-content_kind="<post.contentKind>"` |
| B | `category` | ❌ 未 emit；frontmatter 已有 `category`（單一） | **P2**（候選） | Event | source D2；同上 pattern 加 attr |
| B | `tag_count` | ❌ 未 emit；frontmatter `tags[]` length | **P3**（低急迫） | Event | source D2；數值 dimension 之低 cardinality 替代 |
| B | `series_key` | ❌ 未 emit；`series.json` registry 已備 | **P3**（待 series content 增多） | Event | source D2 |
| **C. navigation** | `nav_direction` | ✅ LIVE | **P1**（已 registered） | Event | n/a |
| C | `target_slug` × `nav_direction` 組合 | derived（報表 sort key） | not custom（Explore concatenate 即可） | — | n/a |
| C | `is_first` / `is_last`（首篇 / 末篇 prev/next 缺失） | ❌ 未 emit；可由 anchor 是否渲染推導 | **P3**（低急迫；報表用「無 nav_direction=previous」即可） | Event | 不主張 |
| **D. campaign / repost** | `utm_source` / `utm_medium` / `utm_campaign` / `utm_content` | ✅ auto（GA4 自動解 URL query）；cross-link 由 `ga4-url-builder.js` 注入 | not custom（GA4 内建） | — | n/a；報表用 traffic source dimension 即可 |
| D | `cross_link_direction`（`to_blogger` / `to_github`） | derived；可由 `utm_source=github_pages|blogger` 推導 | **不註冊**（GA4 内建 source 已可分） | — | 不啟動 |
| D | `fb_sidecar_status` | ❌ 不適合 GA4（無 click event；屬 ADMIN R5 governance signal）；per CLAUDE.md FB sidecar §29 dormant | **不註冊** | — | 不啟動 |
| **E. commerce** | `link_type` | ✅ LIVE | **P1**（已 registered；carry-forward） | Event | n/a |
| E | `provider`（= affiliate network） | ✅ LIVE（affiliate CTA only） | **P2** | Event | 已 emit；後台註冊即可（D4） |
| E | `link_source_key` | ✅ LIVE（conditional） | **P3** | Event | 已 emit；待採用率 |
| E | `commerce_link_id`（= ref） | ❌ 未 emit；ref 已存在於 commerce links registry | **P2**（候選） | Event | 需 source phase D2：affiliate CTA anchor 加 `data-ga4-param-commerce_link_id="<link.ref>"` |
| E | `merchant_key` / `network_key` | ❌ 未 emit；commerce registry 已有 | **P3** | Event | source D2 |
| E | `role_count`（per-block link count） | ❌ 未 emit | **不註冊**（cardinality 低值；報表派不上用場） | — | 不啟動 |
| E | `label_override_present`（boolean） | ❌ 未 emit | **P3** | Event | source D2；boolean dimension |
| **F. AdSense readiness** | （任何 real client id / slot id） | ❌ **永禁 emit / 永禁註冊**（per CLAUDE.md AdSense red line + §29） | **不註冊** | — | 不啟動 |
| F | `articleAd_block_count`（derived；total 已渲染區塊數） | ❌ 未 emit；可由 surface 之 article-block resolver 推導 | **P3**（dev observation 用；非 prod report） | Event | 不啟動；以 dev-only `check:adsense-resolver` 報表替代 |
| F | `surface_ads_enabled`（boolean） | ❌ 未 emit；`settings.ads.enabled` | **P3** | Event | source D2；boolean |
| **G. metadata backfill state** | `blogger_published_state`（`published` / `pending`） | ❌ 不在 GA4 scope；屬 ADMIN governance | **不註冊** | — | 不啟動 |
| G | `blogger_post_id` / `published_at` | ❌ **永禁猜測 emit**；須 Dean evidence 後 frontmatter 回填；frontmatter ≠ event param | **不註冊** | — | 不啟動 |

### 5.2 P2 候選表（建議下一階段優先註冊；皆已 LIVE 或可低 risk wire）

| order | dimension name | parameter | scope | priority | source 已 emit? | wire 成本 | Dean approval 需要? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P2-1 | Link Type | `link_type` | Event | **P1 strict（建議補登）** | ✅ LIVE | 0（後台註冊即可） | ✅ |
| P2-2 | Affiliate Network | `provider` | Event | P2 | ✅ LIVE | 0（後台註冊即可） | ✅ |
| P2-3 | Placement | `placement` | Event | P2 | ✅ LIVE | 0（後台註冊即可） | ✅ |
| P2-4 | Link Label | `link_label` | Event | P2（⚠️ high cardinality） | ✅ LIVE | 0；⚠️ 評估 "(other)" 聚合 | ✅ |
| P2-5 | Target URL | `target_url` | Event | P2（⚠️ high cardinality） | ✅ LIVE（nav only） | 0；建議 skip（資訊已含於 `target_slug`） | ✅ |
| P2-6 | Content Kind | `content_kind` | Event | P2 | ❌ 未 emit | source D2（add data-attr） | ✅ |
| P2-7 | Category | `category` | Event | P2 | ❌ 未 emit | source D2 | ✅ |
| P2-8 | Commerce Link ID | `commerce_link_id` | Event | P2 | ❌ 未 emit | source D2；待 commerce L2 啟動 | ✅ |

### 5.3 P3 候選表（低急迫；多數待 source change + Dean approval）

| order | dimension name | parameter | scope | priority | source 已 emit? | wire 成本 | 建議 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P3-1 | Link Source Key | `link_source_key` | Event | P3 | ✅ LIVE（conditional） | 0（後台註冊即可） | 待 sourceKey 採用率 |
| P3-2 | Outbound | `outbound` | Event | P3 | ✅ LIVE（string `true`/`false`） | 0；報表 filter 已可替代 | 不推薦註冊 |
| P3-3 | Link URL | `link_url` | Event | P3 | ✅ LIVE | 0；⚠️ 高 cardinality + 含 affiliate redirect 參數 | **不推薦註冊** |
| P3-4 | Tag Count | `tag_count` | Event | P3 | ❌ 未 emit | source D2 | 低 ROI |
| P3-5 | Series Key | `series_key` | Event | P3 | ❌ 未 emit | source D2 | 等 series 內容增加 |
| P3-6 | Merchant Key | `merchant_key` | Event | P3 | ❌ 未 emit | source D2 | 待 multi-network |
| P3-7 | Label Override Present | `label_override_present` | Event | P3 | ❌ 未 emit | source D2 | 候選 |
| P3-8 | Surface Ads Enabled | `surface_ads_enabled` | Event | P3 | ❌ 未 emit | source D2 | 候選 |

### 5.4 Custom metrics（GA4 supports event-scoped numeric metrics）

| metric name | 用途 | 是否建議 | 原因 |
| --- | --- | --- | --- |
| `link_position_index` | nav / related / other 之 link 順位（1, 2, …） | **P3** | 需 source D2；ROI 低 |
| `article_word_count` | 文章字數 | **不註冊** | 屬 page metadata；不需 event metric |
| `affiliate_link_count_in_block` | per-block 連結數 | **不註冊** | 報表派不上用場 |

> ⚠️ GA4 custom dimensions 標準資源上限約 50 個 event-scoped；目前 P1 已用 5–6 個；P2 候選 8 個；P3 候選 5+ 個。建議**只註冊 P1 + P2 / order 1–5**（共 ≤ 11 個）；其餘待 ROI 觸發。

---

## 6. Privacy / safety / no-secret policy

### 6.1 永禁 emit / 永禁註冊（red line）

| 項 | 原因 | 來源 |
| --- | --- | --- |
| AdSense 之 `data-ad-client` 真實值（如 `ca-pub-…`） | CLAUDE.md AdSense red line；只存於 `content/settings/ads.config.json`；本檔禁止寫入 | CLAUDE.md §3a Red lines / AdSense |
| AdSense 之 `data-ad-slot` 真實值 | 同上 | 同上 |
| Affiliate dashboard credentials（email / password / OAuth client secret / API key / refresh token / access token / bearer token / Authorization header） | CLAUDE.md commerce red line | CLAUDE.md §3a Red lines / Commerce |
| Affiliate dashboard 統計（commission / payout / clickCount） | 同上 | 同上 |
| Affiliate tracking URL 中之 author token（如 `uid1=<personal-id>`） | 雖屬公開連結，但**不建議**註冊為 dimension（已存於 `link_url`；高 cardinality 且部分為個人識別性 token） | per `link-tracker.js` + `link_url` LIVE 行為 |
| Google Forms responses（email / 姓名 / 電話 / 學校 / 答覆） | CLAUDE.md download red line | CLAUDE.md §3a Red lines / Download |
| Blogger postId（猜測值；非 Dean evidence） | CLAUDE.md §24 + `docs/publish-json-schema.md` §5.3 | per phase prompt §C.5 |
| precise `publishedAt`（由 live verification 約略時間推導） | 同上 | 同上 |
| 完整 GA4 measurementId 寫入 docs / `MEMORY.md` / 任何 ledger | `docs/ga4-parameter-naming-registry.md` §1 慣例（僅可 masked tail4） | 同上 |

### 6.2 Cardinality 風險（不違規但建議避免）

| param | cardinality | 風險 | 建議 |
| --- | --- | --- | --- |
| `target_url` | high | "(other)" 聚合；浪費 dimension 上限 | **不**註冊；用 `target_slug` 替代 |
| `link_url` | very high | 含 affiliate redirect 全 query；報表派不上用場 | **不**註冊 |
| `link_label` | high（≒ 文章標題） | 標題改名 → dimension 連續性破裂；報表雜訊 | 註冊但接受 "(other)" 聚合；或改用 `target_slug` 替代 |

### 6.3 GA4 custom dimensions 後台需手動操作

| 項 | 說明 |
| --- | --- |
| 註冊路徑 | GA4 Admin → Data display → Custom definitions → Create custom dimensions |
| Scope | Event |
| 註冊後資料 | **不**回填歷史；以註冊後新事件為準（per `docs/20260615-ga4-custom-dimensions-registration-checklist.md` §9） |
| Looker Studio / Explore | 須先在後台註冊；本 repo **不**打 GA4 Admin API（無此能力 / 無 OAuth scope / 無 service account） |
| 命名穩定性 | 註冊後**不要事後改 parameter key**（會斷裂報表） |

### 6.4 GA4 Admin / Realtime / DebugView 之執行邊界

- ❌ Claude 端**不**登入 GA4 後台；**不**打 GA4 Admin API / Reporting API；**不**抓 Realtime；**不**抓 DebugView。
- ✅ Dean 端手動操作 GA4 後台；Claude 端僅以 docs-only 形式記錄 Dean evidence。
- ❌ 不在 docs 寫完整 `measurementId`；僅 masked tail4 `…PF8VD`。

---

## 7. Blogger vs GitHub Pages surface differences（核心 gap）

| 維度 | GitHub Pages | Blogger | gap |
| --- | --- | --- | --- |
| gtag loader | ✅（`views/tracking/ga4.ejs`；4-AND gated） | ✅（Blogger 主題已接） | 一致 |
| `page_view`（auto） | ✅ LIVE | ✅ LIVE | 一致 |
| delegated click listener（`link-tracker.js`） | ✅ LIVE | ❌ **無** | ⚠️ Blogger 不送 `click_*` events |
| `data-ga4-event` attr 注入 | ✅ EJS 自動 | ❌ **無**（`src/views/blogger/*` grep 全 0） | ⚠️ Blogger 須未來手動回補 or theme-level listener |
| cross-link UTM 注入 | ✅ `to_blogger` direction（production） | source landed un-deployed（`to_github` direction；pm-24a/b/c） | Blogger reverse UTM 仍 dormant（pm-26 BLOCKED） |
| Article bottom nav | ✅ EJS 渲染 + 8 個 `data-ga4-*` attrs（nav） | Blogger 文章內無底部 nav；屬主題層級或 widget；目前**無**手動回補 | per `docs/20260615-ga4-cross-surface-parameter-management.md` §5 提供 manual snippet |
| Hashtag click | ❌ display-only span（無 anchor） | ❌ display-only span（同源） | 兩平台一致；無 emit |
| Affiliate CTA | ✅ inline `data-ga4-event="click_affiliate_cta"` | ❌（per §3.3）；blogger affiliate.blocks[] renderer 落地，但**無** GA4 attr | Blogger surface 之 affiliate click 在 listener 落地前**不會被計**；per `docs/blogger-listener-strategy.md` |
| `surface` 值 | `github_pages`（注入） | `blogger`（manual snippet 之 placeholder） | 跨平台分析仰賴 `surface` 維度切分 |

### 7.1 Blogger surface 補齊三條路（per `docs/blogger-listener-strategy.md`）

| 方案 | 描述 | 風險 | 建議 |
| --- | --- | --- | --- |
| A | Blogger theme-level delegated listener（一次性貼於主題；掃 `[data-ga4-event]` → `gtag('event',...)`） | 主題層級 JS；單點修正成本低；對齊 GitHub `link-tracker.js` | **推薦**（per `docs/20260615-ga4-cross-surface-parameter-management.md` §6） |
| B | Per-link inline `onclick="gtag(...)"` | 維護成本高；標題改字易失同步 | 不推薦 |
| C | 先注入 attr 但 listener 延後 → 報表雙重缺洞 | 易誤導 | 不推薦 |
| D | build:blogger 產出 per-post nav snippet copy helper（含正確 slug / url / label） | 屬未來 source；不影響 listener；可與 A 並行 | 候選未來 phase |

→ 本 phase **不**主張任何 Blogger surface 之 source change；僅紀錄 gap。後續 phase 各須 Dean explicit approval。

---

## 8. Future phase breakdown（GA4-D1 ~ GA4-D5）

> 每個 phase 一律 **docs-only 起步**（D1 / D4 / D5）或 **single small source change**（D2 / D3）；皆須 Dean explicit approval；皆**不**動 GA4 後台 / AdSense / Blogger / Search Console。

### 8.1 Phase **GA4-D1**：event parameter naming spec（docs-only）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only |
| 目的 | 把本檔 §5 候選 P2 / P3 維度之 **parameter key naming** + **display name** + **values 枚舉** 落成單一權威 spec；對齊 `docs/ga4-parameter-naming-registry.md` § 既有 P1 + 補 P2 / P3 |
| 改 source? | ❌ 否 |
| 改 settings? | ❌ 否 |
| 改 content? | ❌ 否 |
| 需 Dean evidence? | ❌ 否（純命名審議） |
| 需 Dean approval? | ✅ 是 |
| Risk | low |
| 阻擋條件 | 無 |
| Output | `docs/2026XXXX-ga4-p2-p3-naming-spec.md` |

### 8.2 Phase **GA4-D2**：GitHub Pages event parameter source inspection / minimal wiring preflight（docs-only preflight）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only preflight；**不**改 source |
| 目的 | 對 §5.2 P2 候選之 `content_kind` / `category` / `commerce_link_id` 三條 attr，做 source 端 preflight：(1) post-detail.ejs 注入位置；(2) build-github.js 是否需先 normalize post.contentKind / post.category / link.ref；(3) byte-identical-modulo-builtAt 對舊文章之風險；(4) 是否影響 article-block parity guard |
| 改 source? | ❌ 否（preflight only） |
| 改 settings? | ❌ 否 |
| 改 content? | ❌ 否 |
| 需 Dean evidence? | ❌ 否 |
| 需 Dean approval? | ✅ 是 |
| Risk | low（純 inspection） |
| 阻擋條件 | D1 spec 須先 land |
| Output | `docs/2026XXXX-ga4-d2-preflight.md` |
| Follow-up | 若 preflight PASS → 另開 source phase（minimal additive；mirror Phase 20260522 ga4-inline-attrs 之 pattern） |

### 8.3 Phase **GA4-D3**：Blogger output event assumption / theme-boundary preflight（docs-only）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only preflight |
| 目的 | 釐清 Blogger surface 之 GA4 attr **是否注入 build-blogger.js output**；theme-level listener 之 read-only inspection；對齊 §7.1 方案 A / D；釐清 manual paste 之 Blogger postBody 是否會帶 attr；attr ≠ listener 之風險 |
| 改 source? | ❌ 否（preflight only） |
| 改 settings? | ❌ 否 |
| 改 content? | ❌ 否 |
| 需 Dean evidence? | ✅ 是（Dean 確認 Blogger 主題 JS 現狀 + 是否願意接受 theme-level listener） |
| 需 Dean approval? | ✅ 是 |
| Risk | medium（Blogger 主題層級涉及 AdSense layout / 廣告政策；不可干擾 ad fill） |
| 阻擋條件 | D1 spec land + Dean 願意 review Blogger theme |
| Output | `docs/2026XXXX-ga4-d3-blogger-preflight.md` |
| Follow-up | 若 preflight PASS → 另開 listener phase（屬第二階段；per `docs/blogger-listener-strategy.md`） |

### 8.4 Phase **GA4-D4**：Manual GA4 custom dimension setup checklist（docs-only）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only |
| 目的 | 把 §5.2 P2 候選之 8 個 dimension 整理成 Dean 後台逐項勾選 checklist；mirror `docs/20260615-ga4-custom-dimensions-registration-checklist.md` §6 |
| 改 source? | ❌ 否 |
| 改 settings? | ❌ 否 |
| 改 content? | ❌ 否 |
| 需 Dean evidence? | ❌ 否（Dean 操作後另由 D5 收回 evidence） |
| 需 Dean approval? | ✅ 是 |
| Risk | low |
| 阻擋條件 | D1 spec land；建議 D2 / D3 之 attr 已落地（或明確 deferred） |
| Output | `docs/2026XXXX-ga4-d4-p2-registration-checklist.md` |

### 8.5 Phase **GA4-D5**：Browser DebugView / Realtime evidence record（docs-only）

| 項 | 值 |
| --- | --- |
| 性質 | docs-only |
| 目的 | Dean 完成 D4 註冊 + （選擇性）D2 source landed + redeploy 之後，由 Dean 於 GA4 DebugView / Realtime / Explore 截圖；Claude 端記錄 Dean evidence；不打 GA4 後台 |
| 改 source? | ❌ 否 |
| 改 settings? | ❌ 否 |
| 改 content? | ❌ 否 |
| 需 Dean evidence? | ✅ 是（GA4 截圖 / Realtime / DebugView） |
| 需 Dean approval? | ✅ 是 |
| Risk | low |
| 阻擋條件 | D4 註冊已完成；若 D2 source 已落地 → 須 deploy；若僅後台註冊（已 LIVE 維度如 `provider` / `placement` / `link_type`） → 不需 deploy |
| Output | `docs/2026XXXX-ga4-d5-p2-evidence-record.md` |

### 8.6 Phase 依賴關係

```
D1（spec） ──► D2（pages preflight）  ──► [optional source phase] ──┐
   │       └─► D3（blogger preflight）─► [optional listener phase] ─┤
   └──► D4（checklist） ──► Dean 後台註冊 ──► D5（evidence record） ◄┘
```

→ D1 為 entry；其餘可依需求拆 sub-phase；皆**不**自動執行。

---

## 9. Explicit no-touch list（本 phase 完全未動 / 後續 phase 預設不動）

### 9.1 本 phase 完全未動

| 類 | 範圍 |
| --- | --- |
| source | `src/views/` / `src/scripts/` / `src/js/` / `src/styles/` |
| content | `content/settings/` / `content/github/` / `content/blogger/` / `content/templates/` / `content/drafts/` / `content/archive/` / `content/validation-fixtures/` |
| settings | `content/settings/ga4.config.json`（events 宣告未動）/ `content/settings/ads.config.json`（real client/slot 未讀寫）/ `content/settings/affiliate-networks.json`（無動） |
| build / deploy | `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/` / `gh-pages` |
| package | `package.json` / lockfile / `vite.config.js` |
| meta | CLAUDE.md / MEMORY.md / docs README |
| external | GA4 / AdSense / Blogger / Google Drive / Search Console 後台 |
| admin | Admin Apply / middleware / API / `admin-write-cli` / `safe-write:test` / `--apply` / `dryRun:false` |
| payload | payload files / 第三次 write |
| migration | npm install / amend / rebase / force-push |

### 9.2 後續 D1～D5 phase 預設不動（除非 phase 明確要求 + Dean explicit approval）

- 不改 `content/settings/ga4.config.json` 之 `measurementId`
- 不改 `content/settings/ga4.config.json` 之 `enabled`
- 不改 `events[]` 宣告（per `docs/20260615-ga4-custom-dimensions-registration-checklist.md` §2 註：宣告 ≠ wire；本系統實際以 inline attrs 為主）
- 不改 `src/views/tracking/ga4.ejs` 之 4-AND gating
- 不改 `src/js/modules/link-tracker.js` 之 delegated listener
- 不改 `src/js/modules/ga4-events.js`
- 不改 `src/scripts/ga4-url-builder.js` 之 cross-link UTM
- 不改 `content/settings/promotion.config.json` 之 FB UTM
- 不動 Blogger 主題（主題 JS / CSS / widget / layout）
- 不打 GA4 Admin API / Reporting API
- 不啟用 Blogger reverse UTM deploy（pm-26 BLOCKED 仍維持）
- 不啟用 Admin write path
- 不啟用 FB sidecar 真實寫入
- 不啟用 commerce L2 / L3 / L4
- 不啟用 download production migration
- 不啟用 Blogger API / Google Drive API

---

## 10. Recommendation

### 10.1 主推薦：依序執行 D1 → D4 → D5（最小 source change path）

1. **D1**（docs-only）：先把 P2 / P3 命名 spec 確定（含本檔 §5.2 / §5.3 表格）；Dean approve naming。
2. **D4**（docs-only）：把 §5.2 P2 候選之 5 個**已 LIVE** dimension（`link_type` / `provider` / `placement` / `link_label` / `target_url`）整理成 Dean 後台 checklist；Dean 自行勾選註冊。
3. **D5**（docs-only）：Dean 於 GA4 DebugView / Explore 截圖；docs-only 收 evidence。

→ 此路徑**零 source change**；只動 docs；Dean 後台註冊 5 個 dimension（不需 redeploy）；風險最低。

### 10.2 次推薦：若 Dean 想擴張到 `content_kind` / `category` / `commerce_link_id`

→ 須先 **D2**（preflight；docs-only）→ Dean approve 後另開 source phase（minimal additive；mirror `post-detail.ejs:93` inline pattern）→ build:github + deploy → 再回 D4 / D5。

→ 此路徑會動 source；風險中；不在本 phase scope。

### 10.3 Blogger listener（D3）建議**先擱置**

→ Blogger surface 之 `click_*` event 在 listener 落地前都不會被計；屬第二階段（per CLAUDE.md §29）；不在本 phase scope；建議與 P3 P3 內容線、Reverse UTM pm-26 deploy gate 一起評估。

### 10.4 整體建議

- 本 phase 落地後 → **Path A 保守**（per `docs/20260617-night-project-status-and-next-paths-checkpoint.md` §6 Path A）；下一輪可由 Dean 決定是否啟動 D1。
- **不**主動推進 D2 / D3 source phase。
- **不**主動推進 Admin / write path / reverse UTM / Blogger listener。

---

## 11. Cross-links

- `docs/ga4-parameter-naming-registry.md`（P1 naming registry；本 phase P2 / P3 之 spec 由 D1 補登）
- `docs/ga4-link-tracking-spec.md`（event design / param union / placement enum）
- `docs/20260615-blogger-ga4-internal-click-taxonomy-preanalysis.md`（am-1；taxonomy）
- `docs/20260615-ga4-debugview-article-bottom-nav-manual-checklist.md`（am-3）
- `docs/20260615-github-pages-live-dom-ga4-nav-observation-record.md`（am-5）
- `docs/20260615-ga4-bottom-nav-backend-event-receipt-record.md`（am-6）
- `docs/20260615-ga4-custom-dimensions-registration-checklist.md`（am-7；§8 P1 註冊表）
- `docs/20260615-ga4-cross-surface-parameter-management.md`（am-8；cross-surface spec + Blogger manual snippet）
- `docs/20260615-ga4-p1-custom-dimensions-registration-record.md`（am-9；P1 註冊紀錄）
- `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`（pm-1；P1 報表 PASS）
- `docs/blogger-listener-strategy.md`（Blogger listener 不對稱 + 方案 A/B/C/D）
- `docs/20260617-night-project-status-and-next-paths-checkpoint.md`（current state；Path A 保守）
- `content/settings/ga4.config.json`（measurementId masked tail4 = `…PF8VD`；events 宣告清單）
- `src/views/tracking/ga4.ejs`（gtag loader；4-AND gating）
- `src/views/tracking/ga4-events-helper.ejs`（helper；目前 production 未用）
- `src/js/modules/ga4-events.js` / `src/js/modules/link-tracker.js`（trackEvent + delegated listener）
- `src/views/layout/article-bottom-nav.ejs`（nav 8 個 `data-ga4-*` attr）
- `src/views/pages/post-detail.ejs`（CTA / related / other 三處 inline attrs）
- `src/scripts/ga4-url-builder.js`（cross-link UTM helper）

---

（本文件結束）
