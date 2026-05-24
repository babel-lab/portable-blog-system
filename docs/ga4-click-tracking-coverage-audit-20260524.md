# GA4 Click Tracking Coverage Audit — 2026-05-24

本文件為 BLOG / portable-blog-system 之 **GA4 click tracking 覆蓋面 read-only audit**；屬 docs-only；新增於 phase `20260524-am-2-ga4-click-tracking-coverage-audit-a`。

本文件**不**修改任何 source / template / JS / GA4 config / build / deploy；屬純盤點，產出 spec ↔ source ↔ dist 對照與後續 micro-batch 拆批建議。

對應上層：
- `docs/ga4-link-tracking-spec.md`（spec 主檔；2026-05-23 day-1-batch-2 固化）
- `docs/click-tracking-governance.md`（attr convention / event name 主檔）
- `docs/ga4-parameter-naming-registry.md`（snake_case naming registry）
- `docs/blogger-listener-strategy.md`（Blogger 端 listener 短期不做策略）
- `docs/hashtag-slug-decision.md`（hashtag span→a 前置改造未啟動）
- `docs/blogger-to-github-reverse-utm-plan.md`（Blogger → GitHub UTM）
- `CLAUDE.md` §5（既有 9 個 event）/ §16（連結處理）

---

## 1. Audit 範圍

### 1.1 維度

| 維度 | 涵蓋 |
|---|---|
| **Spec** | `ga4-link-tracking-spec.md` 之 §3 8 類 tracking target / §4 event 命名 / §5 UTM 命名 / §11 placement enum |
| **Source（GitHub）** | `src/views/pages/post-detail.ejs` / `src/scripts/build-github.js` / `src/scripts/ga4-url-builder.js` / `src/js/modules/{ga4-events,link-tracker}.js` / `src/views/tracking/{ga4,ga4-events-helper}.ejs` |
| **Source（Blogger）** | `src/views/blogger/{blogger-post-full,blogger-post-summary,blogger-redirect-card,blogger-home-index,blogger-category-index}.ejs` / `src/scripts/build-blogger.js` |
| **Source（其他 GitHub 頁）** | `src/views/pages/{home,post-list,category,tag,about,search,404}.ejs` / `src/views/layout/*.ejs` |
| **Settings** | `content/settings/{ga4.config.json,link-rules.json,promotion.config.json}` |
| **Dist output** | `dist/posts/we-media-myself2/index.html`（GitHub 端 rendered HTML 抽樣）/ `dist-blogger/posts/we-media-myself2/post.html`（Blogger 端 rendered HTML 抽樣）|

### 1.2 不在範圍

| 項目 | 理由 |
|---|---|
| GA4 後台 event-level 真實數據驗收 | 屬 user 手動 SOP（per `ga4-link-tracking-spec.md` §12.2）；本 audit 只盤點 source / dist 端覆蓋面 |
| AdSense click 追蹤 | per spec §3.8 + P6；不應自插 GA4 event；本 audit 不評估 AdSense 端 |
| Phase 2 source rollout 實作 | 本 audit 純 read-only；不啟動任何 source change |
| 修 Blogger 端 click listener 框架 | per `blogger-listener-strategy.md` §5.1 短期推薦不做；本 audit 不質疑此決策 |

---

## 2. Infrastructure 盤點（一覽）

### 2.1 GA4 production gating

| 項目 | 狀態 | 證據 |
|---|---|---|
| `ga4.config.json` `enabled` | ✅ `true` | `content/settings/ga4.config.json:2` |
| `ga4.config.json` `measurementId` | ✅ `G-C77SMPF8VD` | line 3 |
| `ga4.ejs` 4-AND gating | ✅ build-time gate（ga4 + enabled + measurementId + isProdBuild）| `src/views/tracking/ga4.ejs:1-2` |
| dev mode 不送 | ✅ `isProdBuild` 為 `false` 時 ga4 script 不輸出 | 同上 |

### 2.2 Helper / Listener 4 元件

| 元件 | 路徑 | 狀態 |
|---|---|---|
| `trackEvent` helper | `src/js/modules/ga4-events.js` | ✅ wrap `gtag('event', name, params)`；`gtag` 不存在時 silent no-op |
| Delegated click listener | `src/js/modules/link-tracker.js` | ✅ document-level；掃 `[data-ga4-event]` + 讀 `data-ga4-param-<key>` |
| EJS attr helper partial | `src/views/tracking/ga4-events-helper.ejs` | ✅ 已存在但**未被 include**；key regex `/^[a-zA-Z0-9_-]+$/` |
| `main.js` wire `initLinkTracker()` | `src/js/main.js` | ✅ 每頁載入 |
| **Vite bundle 載入範圍** | `dist/posts/*/index.html`（GitHub 端）| ✅ 載入 `entry-*.js`（含 link-tracker）|
| **Vite bundle 載入範圍** | `dist-blogger/posts/*/post.html`（Blogger 端）| ❌ **不載入**；後台貼上之 HTML 不含 Vite bundle → listener 永不啟動 |

### 2.3 URL / UTM helper

| Helper | 路徑 | 功能 |
|---|---|---|
| `expandPattern` | `src/scripts/ga4-url-builder.js:7` | `{key}` placeholder 展開 |
| `applyUtm` | line 19 | rawUrl + utm 物件 → URL 加 utm 4 鍵 |
| `resolvePostBaseUrl` | line 38 | 依 post.site 解析 baseUrl |
| `isBloggerCrossLink` | line 94 | hostname 比對 `settings.site.bloggerSiteUrl` |
| `isGithubCrossLink` | line 111 | hostname 比對 `settings.site.githubSiteUrl`（pm-24a 新增）|
| `mergeRel` | line 126 | rel token 合併（保序 + 去重）|
| `applyCrossSiteUtm` | line 155 | direction `to_blogger` / `to_github` 雙向；策略 A（已含 utm 保留 author intent）|
| `buildFacebookUrl` | line 185 | FB promotion UTM 組合 |

### 2.4 既有 9 個 `ga4.config.json` event 與 governance 6 個 `click_*` 之 reconcile

| `ga4.config.json` 既有 | spec / governance `click_*` | reconcile 狀態 |
|---|---|---|
| `page_view` | 沿用 | ✅ 自動 fire |
| `internal_link_click` | （未 reconcile）| 🟡 未對接；屬未來 governance decision |
| `tag_click` | `click_hashtag` | 🟡 alias / 未對接 |
| `category_click` | （未 reconcile）| 🟡 屬 navigation；未對接 |
| `affiliate_click` | `click_affiliate_cta` | 🟡 alias；當前 source 採 `click_affiliate_cta` |
| `download_click` | （未 reconcile）| 🟡 未對接 |
| `social_click` | （未 reconcile）| 🟡 未對接 |
| `blogger_to_github_click` | `click_cross_site_link` with `source_platform=blogger` | 🟡 未對接 |
| `github_to_blogger_click` | `click_cross_site_link` with `source_platform=github_pages` | 🟡 未對接 |

⚠️ `ga4.config.json` 之 events array 為**宣告性清單**（per CLAUDE.md §5）；GA4 後台不依此 array 過濾，會接受任意 event name；當前 source 採 governance 之 `click_*` 命名，與 array 內既有 9 個並存。

---

## 3. Source-level 點擊區塊覆蓋面（grep + inspect）

`grep -l "data-ga4-" src/**/*.ejs` 命中清單：

| 檔案 | data-ga4-* 出現次數 | 用途 |
|---|---|---|
| `src/views/pages/post-detail.ejs` | **4** | affiliate top / bottom + relatedLinks / otherLinks |
| `src/views/tracking/ga4-events-helper.ejs` | helper（未 include）| 模板用 |

**所有其他 src 端 EJS 檔案皆無 `data-ga4-*` attrs**。

### 3.1 GitHub 端 `post-detail.ejs` 落地 attrs 對照表

| Click 區塊 | 行號 | event name | placement value | 對齊 spec? |
|---|---|---|---|---|
| Affiliate top CTA | L86 | `click_affiliate_cta` | **`article_top`** | ⚠️ spec §11.1 / §3.7 / §12.2.5 預期 `affiliate_top`；spec §11.1 同時亦列 `article_top` 為 reserved → **spec 內部矛盾 + source 採 `article_top`** |
| Affiliate bottom CTA | L139 | `click_affiliate_cta` | **`article_bottom`** | 同上 |
| relatedLinks anchor | L177 | `click_related_link` | `related_links` | ✅ 對齊 |
| otherLinks anchor | L214 | `click_other_link` | `other_links` | ✅ 對齊 |

### 3.2 Affiliate inline attrs 完整欄位（top L86）

```ejs
data-ga4-event="click_affiliate_cta"
data-ga4-param-post_slug="<%= post.slug %>"
data-ga4-param-link_label="<%= link.label %>"
data-ga4-param-link_type="affiliate"
data-ga4-param-link_url="<%= link.url %>"
data-ga4-param-outbound="true"
data-ga4-param-provider="<%= link.network || '' %>"
data-ga4-param-placement="article_top"
```

Bottom（L139）唯一 diff：`placement="article_bottom"`。

⚠️ **缺漏 / 偏差**：
- `placement` 採 `article_top` / `article_bottom`；spec `§3.7` 與 `§12.2.5` 之 manual checklist 預期 `affiliate_top` / `affiliate_bottom`；**spec ↔ source 不一致**
- `provider` 來自 `link.network`（如「博客來」/「通路王」中文字串）；spec §6.2 / governance §7 預期 `provider` 為 affiliate-networks.json 之 `id`（slug；如 `tongluwang`）；當前 source 直接送中文 label 進 GA4 → 可用，但 GA4 後台 dimension 會看到中文字串
- `campaign` ❌ 未送（spec §4.3 / governance §7.2 optional；source 未填）

### 3.3 relatedLinks / otherLinks attrs 完整欄位（L177 / L214）

```ejs
data-ga4-event="click_related_link"
data-ga4-param-post_slug="<%= post.slug %>"
data-ga4-param-link_label="<%= item.title %>"
data-ga4-param-link_type="<%= linkType %>"
data-ga4-param-link_url="<%= item.url %>"
data-ga4-param-outbound="<%= outbound %>"
data-ga4-param-placement="related_links"
```

`linkType` 計算邏輯（L166-173）：
```js
const isInternal = item.kind === 'internal';
const isCrossSite = !isInternal && typeof item.target === 'string' && item.target !== '';
const linkType = isInternal ? 'internal' : (isCrossSite ? 'cross_site' : 'external');
const outbound = (isInternal || isCrossSite) ? 'false' : 'true';
```

⚠️ **潛在 link_type 誤分類**（confirmed via dist 抽樣，per §5）：
- 若作者於 frontmatter 標 `kind: internal`，但連結 URL 為跨站 Blogger（被 `applyCrossSiteUtm` 注入 UTM + 設 target=_blank + rel）→ `isInternal=true` 致 `isCrossSite` 短路為 `false` → `linkType='internal'`，但 URL **實際上**已被系統視為 cross-site 並注入 UTM
- 結果：GA4 event 之 `link_type=internal` 與系統判斷之 cross-site 行為不一致

⚠️ **缺漏**：
- 無 `platform` param（當前頁面所在平台；spec §4.3 list）
- 無 `source_platform` / `target_platform`（spec §5.1 推薦於 `click_cross_site_link` 攜帶；當前 source 採 `click_related_link` 不送）

### 3.4 全頁無 `data-ga4-*` 之區塊（缺漏；GitHub 端）

| 區塊 | 位置 | 缺什麼 | 嚴重度 |
|---|---|---|---|
| **Hashtag** | post-detail.ejs L233-241 | 仍為 `<span class="lab-hashtag">`；無 anchor；無 GA4 attr | 🟡 中（前置 span→a 改造未啟動）|
| **Article body 內 inline 連結** | bodyHtml 直接 inject（L94）| markdown render 後 `<a>` 無任何 GA4 attr / 無 rel/target 強制 | 🟡 中（per `link-processor.js` 為 stub；無 post-process）|
| **Article header 內連結** | L11-29 | 無 click event；多為純 text；非主要 click target | 🟢 低 |
| **Post-card（home / post-list / category / tag）** | home.ejs / post-list.ejs / category.ejs / tag.ejs | 無 GA4 attr | 🟢 低（站內 navigation；屬 spec §11.1 之 `card_list` / `homepage` `🔵 future`）|
| **Sidebar / Footer / Header / Nav / Breadcrumb** | layout/*.ejs | 無 GA4 attr | 🟢 低（站內 navigation）|
| **Mobile Drawer** | layout/mobile-drawer.ejs | 無 GA4 attr | 🟢 低（同上）|
| **Download Box CTA** | post-detail.ejs L115 | `<a class="lab-download-box__cta" download>`；無 GA4 attr | 🟡 中（spec §3 未列；CLAUDE.md §5 有 `download_click`；落地 gap）|
| **Cover image** | L34 | 無 click target | 🟢 低 |
| **Adsense slot** | ads/*.ejs（include partial）| ❌ **不應**加 GA4 attr | ✅ per spec §3.8 + P6 政策；不做為正解 |
| **Social Follow（若有）** | 未 grep 到專屬 EJS；可能於 footer/sidebar | 無 GA4 attr | 🟡 中（CLAUDE.md §5 有 `social_click`；落地 gap）|

### 3.5 Blogger 端 EJS（全部無 data-ga4-*）

| Blogger 模板 | data-ga4-* | 原因 |
|---|---|---|
| `blogger-post-full.ejs` | ❌ 無 | per `blogger-listener-strategy.md` §5.1 短期不做；Blogger 後台貼上之 HTML 無 Vite bundle → listener 永不啟動 → 即使加 attr 亦無效 |
| `blogger-post-summary.ejs` | ❌ 無 | 同上；且 summary 只有 1 個 CTA 走 canonical UTM 路徑（per `buildBloggerToGithubUrl`）|
| `blogger-redirect-card.ejs` | ❌ 無 | 同上 |
| `blogger-home-index.ejs` | ❌ 無 | 同上 |
| `blogger-category-index.ejs` | ❌ 無 | 同上 |
| `blogger-meta-json.ejs` | ❌ 無 | metadata only；無連結 |
| `blogger-copy-helper.ejs` | ❌ 無 | publish helper text；無 HTML |
| `blogger-publish-checklist.ejs` | ❌ 無 | publish helper text；無 HTML |

→ Blogger 端：**全部走 UTM-only attribution**；無 GA4 event。
→ 屬已知 deferred 決策（per blogger-listener-strategy.md §5.1）；**不**視為缺漏。

---

## 4. Spec ↔ Source ↔ Dist 對照表

| Tracking target | Spec 定義 | GitHub source | Blogger source | GitHub dist | Blogger dist | 對齊狀態 |
|---|---|---|---|---|---|---|
| **§3.1 一般外部連結（article body inline）** | `click_external_link`（spec §4.2 建議追加；未實作）| ❌ 無 attr；無 link-processor | ❌ 無 attr | ❌ 無 attr | ❌ 無 attr | 🟡 spec 已 reserved；source 未對接 |
| **§3.2 relatedLinks（external）** | `click_related_link`；UTM 不主動加 | ✅ L177 attr 落地 | ❌ Blogger 端不做 | ✅ 渲染 | ❌ 無 attr | ✅ GitHub OK；Blogger by design |
| **§3.2 relatedLinks（cross-site → Blogger）** | `click_related_link` + UTM injected | ✅ attr + UTM via build-github | ❌ Blogger 端不做 | ✅ UTM `github_pages→Blogger` ✓ | ❌ 無 attr | ✅ OK |
| **§3.2 relatedLinks（cross-site → GitHub from Blogger）** | UTM `blogger→GitHub` | ❌ N/A（GitHub side rendering only）| ✅ source landed pm-24a/b/c | N/A | 🟡 dormant；無 fixture | 🟡 dormant；un-deployed |
| **§3.3 hashtag** | `click_hashtag` + UTM 不加；前置 span→a 改造 | ❌ 仍為 `<span>` | ❌ 仍為 `<span>` | ❌ `<span>` | ❌ `<span>` | 🔴 spec 已標 `🔵 future`；源 + dist 皆未動 |
| **§3.4 FB → Blogger / GitHub** | UTM via promotion.config.json | ✅ FB promotion txt 輸出（dist-promotion/）| ✅ 同（FB 文案手動貼）| N/A（不 render 至 HTML）| N/A | ✅ OK |
| **§3.5 Blogger → GitHub UTM** | reverse UTM；un-deployed dormant | N/A | ✅ source landed pm-24a/b/c | N/A | 🟡 等 fixture 觸發 | 🟡 dormant |
| **§3.6 GitHub → Blogger UTM** | `utm_source=github_pages` + UTM 4 鍵 | ✅ `applyCrossSiteUtm` direction=to_blogger | N/A | ✅ dist 抽樣確認 | N/A | ✅ OK |
| **§3.7 Affiliate top** | `click_affiliate_cta` + `placement=affiliate_top` | ⚠️ source 採 **`article_top`**（spec drift）| ❌ Blogger 端不做 | ✅ render（待 user 啟用 enabled=true）| ❌ 無 attr | ⚠️ spec ↔ source placement value 不一致 |
| **§3.7 Affiliate bottom** | `click_affiliate_cta` + `placement=affiliate_bottom` | ⚠️ source 採 **`article_bottom`** | ❌ Blogger 端不做 | 同上 | ❌ 無 attr | ⚠️ 同上 |
| **§3.8 AdSense** | 不追蹤；per P6 政策 | ✅ 無 attr（正確）| ✅ 無 attr | ✅ 無 attr | ✅ 無 attr | ✅ OK（政策遵守）|
| **Download box CTA** | spec 未列；CLAUDE.md §5 有 `download_click` | ❌ 無 attr | ❌ 無 attr（Blogger by design 無）| ❌ 無 attr | ❌ 無 attr | 🟡 CLAUDE.md §5 與 spec 間 reconcile gap |
| **Social follow link** | spec 未列；CLAUDE.md §5 有 `social_click` | ❌ 無 attr（footer / sidebar 未審）| ❌ 無 attr | ❌ 無 attr | ❌ 無 attr | 🟡 同上 |
| **Internal nav（category / tag / post-card）** | spec §11.1 之 `card_list` / `homepage` 標 `🔵 future` | ❌ 無 attr | N/A | ❌ 無 attr | N/A | ✅ 對齊 spec future |
| **Canonical URL** | clean URL（per §7 SEO rules）| ✅ post-detail.ejs canonical clean | 🟡 see §4.x 下 | ✅ dist clean | 🟡 see §4.x 下 | ⚠️ Blogger summary 有 SEO bug |

### 4.1 Blogger canonical SEO 反模式（pm-23 audit D3 已知；未修）

`src/scripts/build-blogger.js:115-127` 之 `buildBloggerToGithubUrl`：

```js
function buildBloggerToGithubUrl(rawUrl, slug) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('utm_source', 'blogger');
    url.searchParams.set('utm_medium', 'internal_referral');
    url.searchParams.set('utm_campaign', 'blogger_to_github');
    url.searchParams.set('utm_content', slug);
    return url.toString();
  } catch {
    return rawUrl;
  }
}
```

`resolveCanonicalUrl` (line 133-159) 之分支：
- primaryPlatform=blogger + 有 publishedUrl → **clean** Blogger URL ✓
- 其他情況（含 primaryPlatform=github 之 summary post）→ **`buildBloggerToGithubUrl(absolute, slug)`** 注入 UTM

→ 該 `canonicalUrl` 同時被用於：
- `<link rel="canonical">`（per blogger-post-full.ejs L20 / summary L17）
- BlogPosting JSON-LD 之 `@id` + `mainEntityOfPage`（per build-blogger.js L262 / L268）
- Summary CTA href（per summary L44）
- Redirect-card CTA href（per redirect L25）

⚠️ **SEO 反模式**：canonical 與 JSON-LD `@id` 含 UTM 違反 spec §7.1 規則 #1 / #2；但屬 D3 user 已決議**不修**之獨立 SEO bug；本 audit 紀錄但**不**列為當前候選修正。

### 4.2 UTM 4-direction 命名 reconcile

| 方向 | 既有 production / source | spec §5 推薦 | 對齊狀態 |
|---|---|---|---|
| FB → Blogger | `utm_source=facebook` / `medium=social` / `campaign={pattern}` / `content={pattern}` per `promotion.config.json` | 對齊 | ✅ |
| FB → GitHub | 同上 | 同上 | ✅ |
| GitHub → Blogger（relatedLinks / otherLinks）| `utm_source=github_pages` / `medium=referral` / `campaign=portable_blog_system` / `content=related_links\|other_links` | 對齊 | ✅ |
| Blogger → GitHub（relatedLinks / otherLinks）| `utm_source=blogger` / `medium=referral` / `campaign=portable_blog_system` / `content=related_links\|other_links`（pm-24a/b/c source landed；un-deployed）| 對齊 | ✅ source；🟡 dormant |
| Blogger → GitHub（summary CTA / redirect CTA / canonical / JSON-LD / home / category index）| `utm_source=blogger` / `medium=`**`internal_referral`** / `campaign=`**`blogger_to_github`** / `content={slug}`（per `buildBloggerToGithubUrl`）| 不對齊 spec §5；屬獨立既有實作 | ⚠️ per D1=c user 決策：**不統一**；新增 reverse UTM 為第二套 scheme；既有 `internal_referral` / `blogger_to_github` / `<slug>` 保留 |

→ Blogger 端**兩套 UTM 並存**：
- `relatedLinks` / `otherLinks` aside → 新 scheme（`referral` / `portable_blog_system` / `related_links|other_links`）
- summary CTA / redirect CTA / canonical / JSON-LD / index CTA → 舊 scheme（`internal_referral` / `blogger_to_github` / `<slug>`）

⚠️ **GA4 後台分析時須留意**：同一篇 Blogger 文章「按 CTA」與「按 aside cross-link」之 attribution UTM 不同；報表須以 utm_content 區分。

---

## 5. Dist 抽樣驗證

### 5.1 GitHub dist `dist/posts/we-media-myself2/index.html`

完整 `data-ga4-*` 命中 1 行（為 relatedLinks 之 internal-marked Blogger cross-link）：

```
<a class="lab-related-links__link"
   href="https://babel-lab.blogspot.com/2026/04/we-media-myself.html?utm_source=github_pages&amp;utm_medium=referral&amp;utm_campaign=portable_blog_system&amp;utm_content=related_links"
   target="_blank"
   rel="nofollow noopener noreferrer"
   data-ga4-event="click_related_link"
   data-ga4-param-post_slug="we-media-myself2"
   data-ga4-param-link_label="貝果書屋-AI玩轉自媒體的52個商業思維"
   data-ga4-param-link_type="internal"      ← ⚠️ 應為 cross_site；frontmatter kind=internal 誤標
   data-ga4-param-link_url="..."（同 href）
   data-ga4-param-outbound="false"
   data-ga4-param-placement="related_links">
```

⚠️ **link_type 誤分類確認**：
- frontmatter（`content/blogger/posts/20260515-we-media-myself2.md:74-75`）標 `kind: internal` + `platform: "blogger"`
- 但 URL host = `babel-lab.blogspot.com` → `applyCrossSiteUtm` 判定為 cross-site → 注入 UTM + 設 target/rel
- EJS L172 之 `linkType = isInternal ? 'internal' : ...` → 跳出 `'internal'`，未進入 `isCrossSite` 分支
- 結果：GA4 event 報 `link_type=internal` + `outbound=false`，但 URL 在 build 端已被視為 cross-site

⚠️ **outbound=false** 對 cross-site 之語意對齊 spec / governance §8.2（cross_site 視同自家流量）— 不算錯，但 `link_type=internal` 與 cross-site UTM 並存於同一 URL → **report dimension 不一致**。

### 5.2 Blogger dist `dist-blogger/posts/we-media-myself2/post.html`

完整 `data-ga4-*` 命中：**0** 行 ✅（per design；Blogger 端不對接 listener）

該 post 內**唯一**之 relatedLinks anchor：
```
<a class="lab-related-links__link" href="https://babel-lab.blogspot.com/2026/04/we-media-myself.html">
```

→ 無 target / 無 rel / 無 UTM / 無 GA4 attr。

⚠️ **觀察**：此 link 為 Blogger 同站 cross-link（host = bloggerSiteUrl）；非 GitHub cross-link → `applyCrossSiteUtm` direction=to_github 不觸發 → 保留原始 href（per pm-24d 驗證）。
- 屬正確邏輯。
- 但 author 在 Blogger 上點此 link → GA4 page_view 將自動 attribute 為 "blogger referral"，不會有 click event；屬 deferred Blogger listener 策略一致。

### 5.3 Blogger canonical 抽樣

```
<link rel="canonical" href="https://babel-lab.blogspot.com/2026/05/we-media-myself2.html" />
```

→ Clean URL ✓（因為 we-media-myself2 為 primaryPlatform=blogger + 有 publishedUrl → 命中 §4.1 clean 分支）。

⚠️ **若有 primaryPlatform=github 之 Blogger summary post**，其 canonical 與 JSON-LD `@id` 會含 UTM；本 audit 抽樣未覆蓋此情境（當前 ready posts 之 primaryPlatform 分佈未審）。

---

## 6. 已覆蓋項目（截至 2026-05-24 am-2）

✅ 以下視為**已覆蓋 / 已實作**：

| 項目 | 證據 |
|---|---|
| GA4 production gating（4-AND）| `src/views/tracking/ga4.ejs:1-2` |
| measurementId enable | `content/settings/ga4.config.json:3` |
| `trackEvent` helper | `src/js/modules/ga4-events.js` |
| Document-level click listener | `src/js/modules/link-tracker.js` |
| `ga4-events-helper.ejs` partial（保留；當前未 include；inline 模式落地）| `src/views/tracking/ga4-events-helper.ejs` |
| URL builder（4 directions UTM 完整支援）| `src/scripts/ga4-url-builder.js` |
| GitHub 端 affiliate top click attr | `src/views/pages/post-detail.ejs:86` |
| GitHub 端 affiliate bottom click attr | L139 |
| GitHub 端 relatedLinks click attr | L177 |
| GitHub 端 otherLinks click attr | L214 |
| GitHub 端 placement params 已注入 | per 5/22 `b94cf77` |
| GitHub → Blogger UTM 自動注入 | `applyCrossSiteUtm` direction=to_blogger（既有）|
| Blogger → GitHub UTM 自動注入（source landed）| `applyCrossSiteUtm` direction=to_github（pm-24a/b/c；un-deployed dormant）|
| FB → Blogger / GitHub UTM（promotion）| `content/settings/promotion.config.json` + `buildFacebookUrl` |
| canonical / JSON-LD URL：GitHub Pages 端 clean | post-detail rendering |
| canonical / JSON-LD URL：Blogger 端有 publishedUrl 之 primaryPlatform=blogger 走 clean | `resolveCanonicalUrl` §4.1 第一分支 |

---

## 7. 未覆蓋 / 不一致項目

### 7.1 🔴 Spec ↔ Source drift（建議優先處理）

| # | Item | Detail | 影響 |
|---|---|---|---|
| ~~**G1**~~ | ~~Affiliate placement value drift~~ ✅ **resolved 2026-05-24 am-3**（docs-only；spec §3.7 / §11.1 enum 表 / §11.4 / §12.2.5 / §12.2.6 / §14.1 / §14.3 收斂為 `article_top` / `article_bottom`；historical 標 §11.4.2 rejected；source 端 EJS 不變；per `20260524-am-3-ga4-spec-placement-enum-drift-fix-a`）| ~~原描述：source 採 `article_top` / `article_bottom`；spec §3.7 / §11.1 row 7-8 / §12.2.5 manual checklist 預期 `affiliate_top` / `affiliate_bottom`；spec §11.1 內部也同時列了 `article_top`/`article_bottom` 為 reserved（內部矛盾）~~ | ✅ spec 收斂後 GA4 後台 placement dimension 與 spec 一致；validation checklist 對齊實際 attr |
| **G2** | relatedLinks linkType 誤分類 | 作者標 `kind: internal` 但 URL 為跨站 → `applyCrossSiteUtm` 注入 UTM + 設 target/rel；但 EJS 之 `linkType` 仍輸出 `'internal'` | GA4 event dimension 與 URL UTM 矛盾；分析 cross-site CTR 時內外 linkType 互衝 |
| ~~**G3**~~ | ~~spec §11.1 placement enum 內部矛盾~~ ✅ **resolved 2026-05-24 am-3**（同 G1；spec §11.1 移除重複 `affiliate_top` / `affiliate_bottom` 行；historical 收錄於 §11.4.2）| ~~原描述：row 1 `article_top` 註解「當前 `affiliate_top` 已啟用此語意」+ row 7 `affiliate_top` 註解「✅ GitHub 端已落地」→ 同一個概念兩 row~~ | ✅ 收斂後僅 11 row；無重複；未來 reader 不再需在兩值間挑選 |

### 7.2 🟡 Source 缺漏（CLAUDE.md §5 與 spec 未 reconcile）

| # | Item | Detail | 影響 |
|---|---|---|---|
| **G4** | Hashtag click 未對接 | 全頁仍為 `<span>`；前置 span→a 改造未啟動 | spec §3.3 + governance §5.4 標 🟡；CLAUDE.md §5 `tag_click` 未觸發 |
| **G5** | Article body inline 連結未對接 | `link-processor.js` 為 stub；markdown bodyHtml 直接 inject；外部連結 rel/target 規則仰賴 markdown 來源端手動 | spec §3.1 未對接；CLAUDE.md §16.1 之 `target="_blank" rel="nofollow noopener noreferrer"` 未自動套用 |
| **G6** | Download box CTA 未對接 GA4 | post-detail.ejs L115 `<a class="lab-download-box__cta" download>` 無 GA4 attr | CLAUDE.md §5 之 `download_click` 未觸發；spec 未列；屬 reconcile gap |
| **G7** | Social follow link 未對接 GA4 | footer / sidebar 之 social links（若有）無 GA4 attr | CLAUDE.md §5 之 `social_click` 未觸發；spec 未列 |
| **G8** | provider 送中文 label 而非 affiliate-networks.json `id` | post-detail.ejs L86 `data-ga4-param-provider="<%= link.network || '' %>"` 直送中文 | spec §6.2 / governance §7.1 預期 provider 為 `id`（slug）|

### 7.3 🟡 Spec / Governance 內 deferred 決策（不需現修）

| # | Item | Status |
|---|---|---|
| **D1** | Blogger 端 listener 短期不做 | per blogger-listener-strategy.md §5.1；本 audit 不質疑 |
| **D2** | CLAUDE.md §5 既有 9 event 與 governance `click_*` 之 reconcile | per governance §9.2 屬 deferred governance decision；user 表態才動 |
| **D3** | Reverse UTM source landed dormant；待 fixture / Blogger 後台重貼 | per reverse-utm-fixture-plan.md §6 啟動條件；user 主動觸發 |
| **D4** | Blogger canonical-with-UTM SEO 反模式（per §4.1）| per pm-23 D3 user 已決議**不修**；屬獨立 SEO phase |

### 7.4 🔵 Future（不建議現在做）

| # | Item | Status |
|---|---|---|
| **F1** | post-card click event（home / list / category / tag）| spec §11.1 標 `🔵 future`；非當前優先 |
| **F2** | `click_external_link` 新 event（一般外部連結）| spec §4.2 reserved；屬 Phase 2 |
| **F3** | Affiliate `affiliate_inline` / `affiliate_sidebar` placement 擴充 | spec §11.1；屬 Phase 2 |
| **F4** | `campaign` per-post / per-series metadata schema | spec §5.3 / §6.1；屬 Phase 2 schema |
| **F5** | `affiliateBlocks[]` schema 落地至 frontmatter | spec §6.2；屬 Phase 2 schema |

---

## 8. 後續 micro-batch 拆批建議

**不啟動；僅列為候選**。每 micro-batch 皆**單批獨立 commit**；遵守邊界（單檔或最少數檔；不混入跨類；不 build 除非必要）。

### 8.1 🟢 低風險 docs-only micro-batches（最保守起手；不動 source）

| Phase 名候選 | 主題 | 範圍 | 預估 |
|---|---|---|---|
| ~~`20260524-ga4-spec-placement-enum-drift-fix-a`~~ ✅ **已於 am-3 落地** | ~~修 spec §11.1 placement enum 內部矛盾 + spec ↔ source 對齊 placement 值~~ | spec / publishing-workflow / 本 audit 共 3 docs 收斂；source 端 EJS 不變 | ✅ resolved（同步 G1 / G3）|
| `20260524-ga4-spec-reconcile-claude-md-5-events-a` | spec / governance / CLAUDE.md §5 之 event reconcile 表固化（不改 ga4.config.json）| `docs/ga4-link-tracking-spec.md` 新增 §16 reconcile table 或補入 §4 / governance §9.2 之 cross-link | docs 50-100 行 |
| `20260524-ga4-spec-link-type-classification-fix-docs-a` | 在 spec / governance 補入 `link_type` 之 cross_site vs internal vs kind 衝突之裁決規則（建議 source 端優先採 isCrossSite 而非 isInternal）| `docs/ga4-link-tracking-spec.md` / `docs/click-tracking-governance.md` | docs 30-50 行 |

### 8.2 🟢 低風險 source micro-batches（可單檔合 docs 落地）

| Phase 名候選 | 主題 | 範圍 | 預估 LOC | 風險 |
|---|---|---|---|---|
| `20260524-ga4-affiliate-placement-source-align-a` | source 端將 `article_top` / `article_bottom` 改為 `affiliate_top` / `affiliate_bottom`（若 user 偏 spec 對齊）| `src/views/pages/post-detail.ejs:86 / 139` | 2 行 | 🟢 低（純 attr 字串）；需 build 驗證；deploy 後 GA4 後台 dimension 會變 |
| `20260524-ga4-link-type-cross-site-priority-fix-a` | 修 EJS linkType 計算：cross_site 優先於 internal | post-detail.ejs L172 邏輯 | 2-5 行 | 🟢 低；需 build + visual diff |
| `20260524-ga4-affiliate-provider-id-mapping-a` | source 送 affiliate-networks.json `id` 而非 `link.network` 中文 label | post-detail.ejs L86 / L139（加 lookup）| 5-15 行 | 🟡 中（需 affiliate-networks.json 對 link.network 的 reverse map；可能需擴 loader）|

### 8.3 🟡 中風險 source micro-batches（涉新區塊 / 前置改造）

| Phase 名候選 | 主題 | 範圍 | 預估 LOC | 阻擋條件 |
|---|---|---|---|---|
| `20260524-ga4-hashtag-span-to-anchor-a` | hashtag span → a 前置改造 | post-detail.ejs L233-241 + blogger-post-full.ejs L185-189 + `_hashtag.scss` href styling + `link-processor.js` 或派生 | ~40-60 行 | per hashtag-slug-decision.md；needs slug derivation strategy；user 表態 |
| `20260524-ga4-hashtag-click-event-attr-a` | hashtag `<a>` 加 `click_hashtag` event attr | post-detail.ejs hashtag 區段 | ~10 行 | 阻擋於 hashtag-span-to-anchor batch 完成 |
| `20260524-ga4-download-click-event-attr-a` | download box CTA 加 `click_download` event | post-detail.ejs L115 | ~5 行 | 🟢 低；但需 user 決 event name（spec / CLAUDE.md §5 命名 reconcile）|
| `20260524-ga4-social-click-event-attr-a` | social follow link 加 `click_social` event | footer / sidebar / 其他 EJS | ~10 行 | 🟡 中；需先盤點 social link 實際位置；user 決 event name |

### 8.4 🟡 中-高風險 micro-batches（需 Blogger 後台重貼 / production 驗收）

| Phase 名候選 | 主題 | 範圍 | 阻擋條件 |
|---|---|---|---|
| `20260524-ga4-deploy-and-verify-affiliate-placement-a` | 若 8.2 placement align 落地後，重 build + deploy + GA4 Realtime 驗收 | dist 重 build + push gh-pages + user manual sign-off | source batch 完成 |
| `pm-26b-reverse-utm-fixture-create-and-verify-a` | 建立 reverse UTM fixture + Blogger 後台重貼 + GA4 Realtime 驗收 | per reverse-utm-fixture-plan.md §3-§5；屬第二系列 phase；非 GA4 click coverage 範圍 | user 主動表態題目選擇；屬獨立工作流 |

### 8.5 🔴 不建議現在做

| 項目 | 不建議理由 |
|---|---|
| Blogger 端 listener 強行對接 | per blogger-listener-strategy.md §5.1；Blogger 後台貼上之 HTML 無 Vite bundle；強行 inline script 之 maintenance cost 高 |
| ga4.config.json events array 大改 | per governance §9.2 deferred；屬未來 governance decision；非當前 click coverage 痛點 |
| 修 Blogger canonical-with-UTM SEO bug（per §4.1）| per pm-23 D3 user 已決議**不修**；屬獨立 SEO phase；非 click coverage 範疇 |
| 統一既有 `buildBloggerToGithubUrl` UTM 命名至 spec §5 推薦 | per pm-23 D1=c user 決議**不統一**；既有 production live 之 UTM 命名 churn 成本高 |
| Article body inline 連結 link-processor 全面實作 | spec 與 governance 尚未充分定義 markdown body 之 GA4 對接規格；屬 Phase 2 較大 batch |
| post-card / nav / breadcrumb click event 大規模對接 | per spec §11.1 標 `🔵 future`；非當前優先；GA4 後台 internal navigation 之 attribution 用 page_view 已足 |

---

## 9. 建議優先順序

依**最小破壞性 + spec 對齊優先**：

### 9.1 第一推薦：先做 §8.1 之 docs-only 修正

理由：
- spec ↔ source 之 placement value drift（G1）是當前最明顯不一致
- spec §11.1 內部矛盾（G3）為文件 self-conflict；docs-only 修正零風險
- 修完 docs 後，source 端 placement 值是否要從 `article_top` 改為 `affiliate_top` 變成獨立決策；user 可選擇「以源為準」更新 spec，或「以 spec 為準」修 source（§8.2 第一批）
- 不動 source 即不需 deploy；不需 Blogger 後台重貼

### 9.2 第二推薦：linkType 誤分類修正（G2；§8.2 第 2 批）

理由：
- 為 GA4 dimension 之**精度**問題；不影響 UTM 注入或實際 link 行為
- 純 EJS 計算邏輯 swap；2-5 行
- 需 build + deploy + GA4 Realtime 驗收
- 屬下一輪 source batch 之合適起手（介於 docs-only 與大規模 click event 對接之間）

### 9.3 第三推薦：Hashtag / Download / Social 系列（§8.3）

依**前置依賴 + 風險梯度**：
1. hashtag span→a 前置（高 LOC；需 user 表態 slug 策略）
2. hashtag click event attr（依賴 1 完成）
3. download click event（獨立；可直接做）
4. social click event（需先盤點 social link 位置）

### 9.4 不建議今日同批做之組合

| 不建議組合 | 理由 |
|---|---|
| §8.1 docs + §8.2 source 第 1 批同批 | source change 應於 docs reconcile 後再啟動；避免 spec drift 期間落地 source |
| §8.3 hashtag span→a + click event attr 同批 | LOC 過高；應拆批以利 visual diff |
| 任何 source batch + deploy + Blogger 後台動作同批 | deploy / Blogger 後台屬獨立 user 操作；不應與 source batch 合 |

---

## 10. 邊界遵守（本 audit phase）

| 邊界 | 狀態 |
|---|---|
| 不改 source code（src/）| ✅ |
| 不改 EJS template | ✅ |
| 不改 JS tracker / helper | ✅ |
| 不改 content / frontmatter | ✅ |
| 不改 settings JSON | ✅ |
| 不 build | ✅ |
| 不 deploy | ✅ |
| 不 push gh-pages | ✅ |
| 不碰 Blogger 後台 | ✅ |
| 不碰 `.claude/` / dist / dist-blogger / dist-promotion | ✅ |
| 僅新增 docs 單檔 | ✅（本檔）|
| 不 push origin/main | 🟡 由 user 決議（per phase prompt 第 6 條：commit 可做但不 push）|

---

## 11. Cross-links

### 11.1 主要對應 docs

- `docs/ga4-link-tracking-spec.md`（spec 主檔；§3 / §4 / §5 / §11 / §12 / §14）
- `docs/click-tracking-governance.md`（governance 主檔；§4 / §5 / §6 / §7 / §8 / §9）
- `docs/ga4-parameter-naming-registry.md`（snake_case naming registry）
- `docs/blogger-listener-strategy.md`（Blogger 端 listener 策略；§5.1）
- `docs/hashtag-slug-decision.md`（hashtag span→a 前置）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM plan）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture SOP）
- `docs/20260522-ga4-click-tracking-manual-validation.md`（5/22 manual validation）
- `docs/ga4-enable-preflight.md`（GA4 production gating）
- `docs/ad-affiliate-schema-proposal.md`（affiliate schema）
- `docs/20260523-eod-report.md` §14 / §15（reverse UTM step 2 source landed + EOD freeze）
- `docs/phase-status-20260523.md`（5/23 Phase 1 完成度）

### 11.2 規範

- `CLAUDE.md` §5（既有 9 個 GA4 event）/ §16（連結處理）/ §17（文章版型）/ §21（SEO）

### 11.3 Source code refs

- `src/views/pages/post-detail.ejs`（GitHub 端唯一 click attr 落地檔）
- `src/views/blogger/blogger-post-full.ejs`（Blogger 端；無 click attr by design）
- `src/scripts/ga4-url-builder.js`（URL/UTM helper）
- `src/scripts/build-github.js`（GitHub build；relatedLinksRendered / otherLinksRendered preprocess）
- `src/scripts/build-blogger.js`（Blogger build；same preprocess + canonical 計算）
- `src/js/modules/{ga4-events,link-tracker}.js`（client-side helper / listener）
- `src/views/tracking/{ga4,ga4-events-helper}.ejs`（tracking partials）
- `content/settings/{ga4.config.json,link-rules.json,promotion.config.json}`

---

## 12. G2 Root-Cause Note（追加；2026-05-24 am-4）

本節為 phase `20260524-am-4-ga4-g2-relatedlinks-link-type-root-cause-audit-a` 之 read-only root-cause 補記；docs-only；不動 source / content / build / deploy。

### 12.1 問題重述

GitHub Pages 端 `dist/posts/we-media-myself2/index.html` relatedLinks anchor 抽樣（per §5.1）：

| attr | 值 |
|---|---|
| `href` | `https://babel-lab.blogspot.com/2026/04/we-media-myself.html?utm_source=github_pages&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links` ← **含 cross-site UTM** |
| `target` | `_blank` ← **由 `applyCrossSiteUtm` 設定** |
| `rel` | `nofollow noopener noreferrer` ← **由 `mergeRel` 合併** |
| `data-ga4-param-link_type` | **`internal`** ← ⚠️ 不一致 |
| `data-ga4-param-outbound` | **`false`** ← 與 cross-site 之 retained-自家流量語意一致 |
| `data-ga4-param-placement` | `related_links` ✓ |

→ 同一個 `<a>` 之 URL 端被視為 cross-site（UTM 4 鍵注入 + target/rel 強制設定），但 GA4 event dimension `link_type` 仍報 `internal`；產生**內外語意衝突**。

### 12.2 各層責任盤點

| 層 | 行為 | 是否符合既有規格 |
|---|---|---|
| **Content / frontmatter**（`content/blogger/posts/20260515-we-media-myself2.md:74-77`）| 作者標 `kind: internal` + `platform: "blogger"` + Blogger 同站 URL | ✅ 符合 `related-links-schema.md` §5.4：「`kind: internal` 不等於 `platform === "blogger"`；internal 之語意為**本站任一已發布平台之連結**」。作者把 Blogger 自家文章標 internal 是**正確語意**（屬「我的內容；只是放在另一個平台」）|
| **Schema spec**（`related-links-schema.md` §4.3）| 規定 cross-link 判斷**依 URL hostname，不依 `kind`** | ✅ 設計層面正確：「判斷依據：URL hostname；**不**依賴 `kind` 欄位（`kind: internal` 之 Blogger URL 亦適用）」|
| **Build pipeline**（`src/scripts/build-github.js:480` → `applyCrossSiteUtm`）| 依 URL hostname 判定為 cross-site → 注入 UTM + 設 target/rel | ✅ 對齊 schema §4.3 規定 |
| **EJS render**（`src/views/pages/post-detail.ejs:166-173`）| `linkType = isInternal ? 'internal' : (isCrossSite ? 'cross_site' : 'external')`；`isInternal = item.kind === 'internal'` | ❌ **不對齊 schema §4.3 原則**：此處 `linkType` 仍以 `item.kind` 為主導；當 `kind: internal` 時跳出 `'internal'` 不進入 `isCrossSite` 分支 |
| **link-tracker JS**（`src/js/modules/link-tracker.js`）| 純 attr → param pass-through；無語意 | ✅ 不負責此類判定 |
| **Spec / governance docs 對 GA4 `link_type` 規格**（`ga4-link-tracking-spec.md` §4.3 / `click-tracking-governance.md` §5.2 / §8.2 + `related-links-schema.md` §7.3）| `link_type` 列舉值 `internal` / `cross_site` / `external` / `affiliate`；但**未明示**「當 `kind: internal` + URL 為跨站時，`link_type` 應採何值」之裁決規則 | 🟡 spec 語意 underspecified；§8.2 雖列「連 Blogger ↔ GitHub Pages → `link_type=cross_site`」表，但與 `kind` 之優先序未顯式裁決 |

### 12.3 根因分類（per A）

**主因**：EJS render 端之 link_type 派生邏輯（`post-detail.ejs:166-173`）以 `kind` 為主導，而非以 cross-link 處理結果（`item.target` 已被 build pipeline 填入）為主導。

**次因**：spec / governance 未顯式裁決 `kind` vs URL 何者優先決定 `link_type`；當前作者依 schema §5.4 之 internal 語意填寫時，會自然產生此 dimension 衝突。

**非問題**：
- ❌ Content / frontmatter **不錯**（per schema §5.4）；要求作者改 `kind` = 違反 schema 語意
- ❌ `applyCrossSiteUtm` / `deriveRenderedCrossLinks` / build pipeline **不錯**（per schema §4.3）；改它 = 倒退到 kind-driven 判斷
- ❌ link-tracker JS **不錯**；listener 為 pass-through

**結論**：屬 **source helper 判斷問題**為主 + **spec 語意 underspecified** 為次因。**非** content 標記問題。

### 12.4 受影響範圍量化

| 維度 | 數量 |
|---|---|
| 全 content posts | 4（real production；含 1 Blogger + 2 GitHub + 1 sample-book-review fixture-grade）+ 4 validation-fixtures |
| 有 `relatedLinks` / `otherLinks` 之 real production posts | **1**（`20260515-we-media-myself2.md`；single entry）|
| 該 entry 之分類 | `kind: internal` + Blogger 同站 URL → 在 GitHub render context 為 cross-site；觸發 G2 |
| `kind: external` + 本站 URL 之 inverse 案例 | **0**（無 production case；schema §4 規則為跨站 → cross-site UTM；author intent 矛盾的 inverse 案例現實不會發生）|
| 其他既有 ready posts 是否會碰到 | **否**；其他 ready posts 之 `relatedLinks` 為空 array（per `content/github/posts/*.md` + `content/blogger/posts/*.md` grep）|
| dist GitHub posts 受影響 | **1**：`dist/posts/we-media-myself2/index.html` 之 1 個 anchor |
| dist Blogger posts 受影響 | **0**：Blogger 端無 data-ga4-* attrs（per `blogger-listener-strategy.md` §5.1）|

→ 量化：**1 個生產 anchor 觸發**；scope 極小。

### 12.5 Option 比較（per B）

#### Option 1：Content-only 修正

範圍：把 `content/blogger/posts/20260515-we-media-myself2.md:74` 之 `kind: internal` 改 `kind: external`。

| 維度 | 評估 |
|---|---|
| 優點 | • 零 source change；零 build / deploy schema 變動<br>• docs / 框架不變 |
| 缺點 | • **違反 `related-links-schema.md` §5.4 之 internal 語意**（「internal = 本站任一已發布平台」）<br>• 作者 display 意圖被迫扭曲（從「我的另一篇」變成「外部連結」）<br>• Schema §1.2 已明示「兩欄位皆可同時包含 `kind: internal` 與 `kind: external` 之 item」；本修法逼作者放棄 internal 語意<br>• 未來作者撰寫類似 cross-platform self-content 時又會重蹈覆轍<br>• 不解決系統層**根因**；只 patch 單篇 |
| 風險 | 🟡 中（schema 語意 regression；author intent 失真）|
| 操作 | content edit 1 行；無 source / build / deploy；需 user 同意違反 schema §5.4 |

#### Option 2：Source helper 修正（推薦）

範圍：`src/views/pages/post-detail.ejs:171-173`（GitHub 端唯一 GA4 attr render 落地檔）修正 linkType 派生邏輯，從 `kind`-driven 改為 cross-site-fingerprint-driven。

具體修法（示意；尚未 commit）：
```js
const isInternal = item.kind === 'internal';
const isCrossSite = typeof item.target === 'string' && item.target !== '';
// 修正前：linkType = isInternal ? 'internal' : (isCrossSite ? 'cross_site' : 'external')
// 修正後：以 cross-site fingerprint 為優先：
const linkType = isCrossSite ? 'cross_site' : (isInternal ? 'internal' : 'external');
const outbound = (linkType === 'internal' || linkType === 'cross_site') ? 'false' : 'true';
```

含 otherLinks 對應段（L202-210）mirror 同樣修正；共 ~4-6 行 LOC 變動。

| 維度 | 評估 |
|---|---|
| 優點 | • **對齊 schema §4.3 之既有設計原則**（cross-link 判斷依 URL hostname）<br>• 作者繼續沿用 `kind: internal` 之 schema §5.4 語意；無需 content 變動<br>• GA4 `link_type` 正確反映實際 destination 行為（與 URL UTM 一致）<br>• 修法集中於單檔；可用 EJS compile + dist diff 快速驗證<br>• 未來作者撰寫 cross-platform self-content 時 GA4 自動正確分類 |
| 缺點 | • 需 source change（首次 non-Admin source change since pm-24c reverse UTM source）<br>• 需 build → deploy → user GA4 Realtime / DebugView 手動驗收 dimension 變化（從 `internal` → `cross_site`）<br>• `outbound` 不變（仍 `false`）但 `link_type` dimension 變動會影響 GA4 後台 historical report continuity（屬可接受；單篇單 anchor）|
| 風險 | 🟢 低（純 EJS render 邏輯 swap；4-6 行；無 schema / build pipeline / 框架變動）|
| 操作 | source EJS edit ~4-6 行；需 `npm run build` 驗證 dist diff；建議 deploy → GA4 Realtime 點擊驗收 |

#### Option 3：Spec 修正（補強 source change）

範圍：在 `ga4-link-tracking-spec.md` §4.3 / `click-tracking-governance.md` §8.2 / `related-links-schema.md` §7.3 補入「link_type 由 cross-site fingerprint（URL hostname）優先 derive，kind 僅作 UI grouping」之**裁決規則**。

| 維度 | 評估 |
|---|---|
| 優點 | • 修補 spec underspecified 處<br>• 未來工程師看 spec 即知 link_type 派生規則<br>• 純 docs；零 build / deploy |
| 缺點 | • spec-only 不修 source；問題仍存在於 production<br>• 需與 Option 2 source 修一起做才能完整收尾 |
| 風險 | 🟢 低（docs-only）|
| 操作 | docs 3 個檔；~30-50 行 |

→ **Option 3 為 Option 2 之 docs-side 補強；非獨立替代方案。**

### 12.6 推薦方案（per C）

**推薦：Option 2 + Option 3 拆兩批落地**

| 批次 | 性質 | 範圍 | 阻擋 |
|---|---|---|---|
| **am-5（建議下批）**| docs-only | Option 3：spec §4.3 / governance §8.2 / related-links-schema §7.3 補裁決規則 + 本 audit doc §7.1 G2 標 update（spec 收斂 ✓；source 修正 pending）| 無 |
| **am-6 或之後**| source | Option 2：post-detail.ejs L171-173（related）+ L206-208（other）linkType 派生邏輯 swap；mirror otherLinks | 阻擋於 user 同意 source change + build/deploy verify checkpoint |

### 12.7 修法所需後續動作

| 動作 | Option 1（content）| Option 2（source；推薦）| Option 3（spec）|
|---|---|---|---|
| Source change | ❌ | ✅ post-detail.ejs ~4-6 行 | ❌ |
| Content change | ✅ 1 篇 | ❌ | ❌ |
| Spec / docs change | ❌（但留 G2 未真正解決 root cause）| 🟡 建議併 docs sync | ✅ docs only |
| Build | ❌ | ✅ `npm run build` | ❌ |
| Validate | ❌ | 🟡 可選（per Admin / template 既有 pattern；非必需）| ❌ |
| Deploy | ❌ | ✅ `npm run deploy` + push gh-pages | ❌ |
| Blogger 後台重貼 | ❌ | ❌（Blogger 端無 data-ga4-* attrs）| ❌ |
| GA4 Realtime 驗收 | ❌ | ✅ 建議 user 於 dist 部署後手動點擊 we-media-myself2 之 relatedLink 觀察 `link_type=cross_site`（從原 `internal` 變動）| ❌ |

### 12.8 後續 micro-batch 建議（per D）

| Phase 候選 | 主題 | 範圍 | 預估 LOC | 風險 |
|---|---|---|---|---|
| `20260524-am-5-ga4-spec-link-type-derivation-rule-a` | Option 3 docs-only：spec / governance / schema 補裁決規則 + audit doc G2 status sync | `docs/ga4-link-tracking-spec.md` §4.3 + `docs/click-tracking-governance.md` §8.2 + `docs/related-links-schema.md` §7.3 + 本 audit doc §7.1 G2 + §12.6 | docs ~30-50 行 / 4 檔 | 🟢 低 |
| `20260524-am-6-ga4-link-type-cross-site-priority-source-fix-a` | Option 2 source：post-detail.ejs linkType 派生邏輯 swap；mirror related + other | `src/views/pages/post-detail.ejs` L166-173 + L202-210 | source 4-6 行 / 1 檔 | 🟢 低 |
| （後續可選）`20260524-am-7-ga4-link-type-deploy-verify-a` | build + deploy + dist diff sanity check；user GA4 Realtime 手動驗收 | dist 重建 + push gh-pages + manual sign-off | n/a | 🟡 中（首次非 Admin source 變更落地 production；deploy / GA4 manual verify）|

### 12.9 為何不建議 Option 1（content-only）

| 反對理由 | 來源 |
|---|---|
| 違反 `related-links-schema.md` §5.4 之 internal 語意 | schema |
| 違反 §1.2 之「kind 與 platform 無強制對應」原則 | schema |
| 不解決系統層根因；只 patch 單篇 | 工程層 |
| 未來作者撰寫類似內容時又會重蹈覆轍 | 維護層 |
| 作者 intent 失真（從「我的另一篇」變成「外部」）| UX 層 |

### 12.10 邊界遵守（本 am-4 phase）

| 邊界 | 狀態 |
|---|---|
| 不改 source code | ✅ |
| 不改 EJS template | ✅ |
| 不改 JS helper / tracker | ✅ |
| 不改 content / frontmatter | ✅ |
| 不 build / 不 validate / 不 deploy | ✅ |
| 不碰 Blogger 後台 | ✅ |
| 不 push origin/main | ✅（待 user 確認後再 commit + push）|
| 僅更新單檔 docs（本 audit doc 追加 §12）| ✅ |

---

（本文件結束）
