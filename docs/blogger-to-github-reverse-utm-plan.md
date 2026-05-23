# Blogger → GitHub Pages Reverse UTM Plan

本文件為 **Blogger 文章內連回 GitHub Pages 之 GA4 UTM 注入策略**之 docs-only read-only plan；屬未來 implementation phase 之前置規格。**本批 phase `20260522-blogger-to-github-reverse-utm-plan-a` 不修改任何 source / template / content / settings / build / dist / deploy**。

對應上層：
- `CLAUDE.md` §16.4（cross-link UTM 規則；含 future Blogger → GitHub 反向 UTM 為 future phase）
- `docs/click-tracking-governance.md` §4 row 3（reverse UTM 規格）/ §10 順序 5（Phase 2-d Blogger → GitHub reverse UTM）
- `docs/ga4-link-tracking-spec.md` §3.5（Blogger to GitHub UTM；尚未實作）
- `docs/ga4-parameter-naming-registry.md` §4.2（Blogger → GitHub UTM 既建議規格；snake_case）
- `docs/blogger-listener-strategy.md` §5.1 / §6.4 / §7（短期推薦方案 D；reverse UTM 命名；implementation 順序）
- `docs/20260522-pm-phase-2-batch-plan.md` §10（Reverse UTM Plan）

---

## §1 背景

### 1.1 GitHub → Blogger UTM 已實作

per `src/scripts/ga4-url-builder.js` 之 `applyCrossSiteUtm`（per pm-6 / pm-45 deploy；production live）+ `src/scripts/build-github.js` 之 `deriveRenderedCrossLinks`：

```
方向：GitHub Pages article → Blogger article（relatedLinks / otherLinks 內 cross-site link）
utm_source=github_pages
utm_medium=referral
utm_campaign=portable_blog_system
utm_content=related_links | other_links
```

附帶機制：
- 策略 A：若原 URL 已含任一 `utm_*` → 保留 author intent，不覆寫 UTM；但仍套 `target="_blank"` + rel 合併
- `rel` 合併：`['nofollow', 'noopener', 'noreferrer']`；保留既有 author rel

### 1.2 Blogger → GitHub reverse UTM 尚未實作

per `CLAUDE.md` §16.4：

```
Blogger → GitHub Pages（future phase；未實作）
未來若實作，**建議**規則（尚未生效）：
  utm_source=blogger
  utm_medium=referral
  utm_campaign=portable_blog_system
  utm_content=related_links | other_links
當前 Blogger 端對 GitHub Pages 連結不自動加 UTM；作者若需 UTM 可於 frontmatter 之 url 欄位手動加入。
```

當前現況：
- `src/scripts/build-blogger.js` 對 `post.relatedLinks` / `post.otherLinks` 之 GitHub Pages 連結**不做** UTM 注入
- `src/views/blogger/blogger-post-full.ejs` 直接 render `item.url`；無預處理
- 作者僅能於 frontmatter `url` 欄位手動填 UTM；屬非結構化、易遺漏

### 1.3 Blogger listener strategy 短期推薦先採 reverse UTM

per `docs/blogger-listener-strategy.md` §5.1：

> **短期推薦：方案 D — reverse UTM；不急 Blogger listener**
> 
> - 保守落地：不動 Blogger template；不引入 `<script>`；風險最低
> - 完整 cross-link attribution：Blogger → GitHub 之 UTM 補齊；對稱 GitHub → Blogger 既有實作
> - 對齊 `CLAUDE.md` §16.4 future spec：reverse UTM 已列為待實作項

→ 本 doc 為 **方案 D 之 implementation 前置 spec**。

---

## §2 現況

### 2.1 GitHub Pages 端 click tracking pipeline 完整

per `docs/blogger-listener-strategy.md` §1.1：

- ✅ `link-tracker.js` document-level click listener 已 wire
- ✅ `ga4-events.js` `trackEvent` 已就位
- ✅ `ga4-events-helper.ejs` EJS attr helper 已就位（5/22 latent bug fix `aa7b594`）
- ✅ `post-detail.ejs` 已注入 affiliate / relatedLinks / otherLinks 之 `data-ga4-*` attr

→ GitHub Pages 端為**完整 click tracking pipeline**：attr → listener → GA4 production。

### 2.2 Blogger 端目前無 listener

per `docs/blogger-listener-strategy.md` §2.2 + §5.1：

- 🔴 Blogger full export template 無 Vite bundle
- 🔴 Blogger 端 click event 完全無追蹤
- 🔴 reverse UTM 也尚未實作

→ Blogger 端 click 行為**完全黑盒**；僅 `page_view` 之 referrer 可看出 source 大方向。

### 2.3 Blogger 端短期應先以 UTM 追蹤跨站流量

per `docs/blogger-listener-strategy.md` §5.1 + §7 推薦序列：

- 短期：reverse UTM 補齊 Blogger → GitHub 跨站 attribution
- 中期：觀察 GitHub 端 click event 上線後之資料；決定 Blogger 端 click event ROI
- 長期：若做 listener，採方案 B-theme（主題級）

→ 本 doc 服務於**短期 reverse UTM** 之實作前置。

---

## §3 目標

### 3.1 主要目標

讓 Blogger 文章內 **連回 GitHub Pages 之連結**於 build 階段自動注入 GA4 UTM 參數：

1. **relatedLinks** aside 內之 cross-link
2. **otherLinks** aside 內之 cross-link
3. **article body cross-link**（內文中之 cross-link；若有；屬可選擴展）

讓 GA4 後台之 Acquisition / Traffic Source 維度可辨識：
- `utm_source` = 來源平台（Blogger）
- `utm_medium` = 流量型態（referral）
- `utm_campaign` = 活動 / 文章 / 系統 campaign（建議 `portable_blog_system` 預設；對齊既有實作）
- `utm_content` = link slot（如 `related_links` / `other_links`）

### 3.2 次要目標

- 對稱 GitHub → Blogger 既有 UTM 實作；維持 cross-link attribution 雙向一致
- 不依賴 Blogger listener；避免 Blogger 端 `<script>` 之 sanitize 風險
- 自動化：build-blogger.js 預處理；author 不須手填 UTM

### 3.3 範圍邊界

| 範圍 | 是否在本 plan 內 |
|---|---|
| relatedLinks / otherLinks aside 之 cross-link UTM 注入 | ✅ |
| article body 內 inline cross-link UTM 注入 | 🟡 evaluate；屬可選擴展 |
| Blogger 端 click event listener | ❌（屬 `docs/blogger-listener-strategy.md` 之 deferred 範圍）|
| affiliate 導購 URL | ❌（per §4 非目標）|
| hashtag click | ❌（hashtag span→a 尚未實作；屬 `docs/hashtag-slug-decision.md` 之 deferred 範圍）|
| FB → Blogger UTM | ❌（既有實作；per `promotion.config.json`）|
| GitHub → Blogger UTM | ❌（既有實作；per `ga4-url-builder.js applyCrossSiteUtm`）|

---

## §4 非目標

per spec 明示之 explicit non-goals：

| 非目標 | 理由 |
|---|---|
| **追蹤 Blogger 內部 click event** | 屬 listener strategy 範圍；deferred |
| **加 Blogger listener** | per `blogger-listener-strategy.md` §5.1 推薦短期不做 |
| **新增 `data-ga4-*` attr** | per 上述；無 listener → attr 無 ROI |
| **改 hashtag** | 屬 `hashtag-slug-decision.md` 之 deferred 範圍 |
| **改 GA4 runtime gating** | 既有 4-AND gating 已就位；本 plan 不動 |
| **affiliate 導購 URL 加 UTM** | 導向通路王 / 聯盟網等；非 GitHub；per `click-tracking-governance.md` §7.3 之 affiliate URL UTM 政策（**不主動加**）|
| **改 canonical URL** | per `ga4-link-tracking-spec.md` §7 P3：canonical 必為 clean URL；不含 UTM |
| **改 sitemap.xml URL** | 同上；sitemap 必為 clean canonical URL |
| **改 Open Graph URL** | 同上；OG URL 建議 clean |
| **deploy** | docs-only batch；不 deploy |

---

## §5 建議 UTM 命名

### 5.1 utm_source

**推薦：`blogger`**

- 對齊 `CLAUDE.md` §16.4 + `docs/click-tracking-governance.md` §4 row 3 + `docs/ga4-parameter-naming-registry.md` §4.2
- snake_case；單一 token；lowercase
- 對稱 GitHub → Blogger 之 `utm_source=github_pages`（既有實作）

### 5.2 utm_medium

**推薦：`referral`**（**非** `social`）

理由：
1. ✅ **對稱既有實作**：GitHub → Blogger 用 `referral`（per `ga4-url-builder.js:148`）；Blogger → GitHub 採同 medium 保持 cross-link 對稱
2. ✅ **語義準確**：Blogger 為「另一站台之參考連結」（referral），非「社群平台貼文」（social）
3. ✅ **GA4 後台 channel grouping**：GA4 預設 channel grouping 對 `medium=referral` 之識別清晰；對 `social` 則限定為 social platforms
4. ❌ **不採 `social`**：Blogger 雖含「分享」感，但 medium=social 通常專指 FB / X / IG / Threads / LinkedIn 等社群平台貼文之 referral；Blogger 為 publishing platform（per `CLAUDE.md` §2.1）；採 `social` 會誤導 GA4 channel attribution
5. ❌ **不採 `internal-crosslink`**：per `ga4-link-tracking-spec.md` §3.5 已評估；非標準 channel；需自訂 GA4 channel grouping；維護成本高

### 5.3 utm_campaign

**推薦：`portable_blog_system`**（mirror 既有 GitHub → Blogger）

理由：
1. ✅ **對稱**：GitHub → Blogger 用 `portable_blog_system`（per `ga4-url-builder.js:149`）
2. ✅ **snake_case**：對齊 `docs/ga4-parameter-naming-registry.md` §3 命名規則
3. ✅ **靜態 default**：簡化 build 邏輯；不需 per-post campaign metadata
4. ✅ **GA4 後台分析**：可用 `utm_content` 維度切片至 slot 級；不需 utm_campaign 切片至 post 級

**未來擴展（可選）**：

若 user 後續想做 per-post / per-series campaign attribution：

| 場景 | utm_campaign |
|---|---|
| 一般文章 | `portable_blog_system`（default）|
| 書評系列 | `book_review_<slug>` |
| 講座 / 活動 | `event_<name>_<YYYYMM>` |

→ 屬獨立 implementation phase；本 plan **建議先採 static default**；不混入 per-post campaign。

### 5.4 utm_content

**推薦：snake_case slot 名；對稱既有實作之 plural convention**

| Slot 名 | 適用範圍 | 對稱既有 |
|---|---|---|
| `related_links` | relatedLinks aside 內之 cross-link | ✅ mirror GitHub → Blogger 之 `related_links` |
| `other_links` | otherLinks aside 內之 cross-link | ✅ mirror |
| `article_cross_link` 或 `article_cross_links` | article body 內 inline cross-link | 🟡 新增；命名 reconcile 詳 §5.4.1 |

⚠️ **plural / singular 命名 reconcile**：
- 既有實作：`related_links` / `other_links` 為 **plural**（複數）
- 用戶 spec 提及：`related_link` / `other_link` / `article_cross_link`（singular）
- **推薦**：對齊既有 plural convention → `related_links` / `other_links` / `article_cross_links`
- 若決定改全 singular → 需重 build + Google 已索引 UTM URL 之 GA4 dimension drift 風險（高）
- → **本 plan 推薦保持既有 plural**

#### 5.4.1 article_cross_link 之命名選擇

若決定支援 article body 內 inline cross-link UTM 注入：

| 候選命名 | 推薦度 |
|---|---|
| `article_cross_links` | ✅ plural；對齊既有 `related_links` / `other_links` |
| `body_cross_link` / `body_link` | 🟡 singular；強調「文章本體」位置 |
| `inline_link` / `inline_cross_link` | 🟡 強調 inline 性質 |

**本 plan 推薦：`article_cross_links`**（plural；mirror existing convention）

⚠️ **若決定不支援 inline cross-link UTM 注入**：本 slot 不需新增；僅 `related_links` / `other_links` 兩 slot。

### 5.5 utm_term

**推薦：不使用**

per `docs/ga4-parameter-naming-registry.md` §6.1（雖屬 utm_term 但 registry 標明）+ `docs/ga4-link-tracking-spec.md` §5.5：

> utm_term：**本 spec 建議：暫不使用**
> 理由：個人 blog 規模小；utm_term 傳統用於 paid search keyword；當前無 paid 流量

→ 不採 utm_term；不混入 tag / link label 等資訊（這些屬 GA4 event params 範圍；非 UTM）。

### 5.6 完整 UTM 範例

| 場景 | 完整 UTM 範例 |
|---|---|
| relatedLinks aside link | `?utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links` |
| otherLinks aside link | `?utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=other_links` |
| article body inline cross-link（若支援）| `?utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=article_cross_links` |

### 5.7 與既有 3 個 UTM 方向之一致性比較

本小節為 docs-only 補入；對應 phase `20260523-pm-22-reverse-utm-step1-docs-a` 之 user 第 4 問（「與目前 GitHub → Blogger / FB → Blogger / FB → GitHub 的 UTM 規則是否一致」）。

#### 5.7.1 4-direction UTM 一覽

| 方向 | utm_source | utm_medium | utm_campaign | utm_content | 來源 / 狀態 |
|---|---|---|---|---|---|
| **FB → Blogger** | `facebook` | `social` | `{page}_post`（pattern；例：`fan1_post`）| `{slug}`（pattern；例：`we-media-myself2`）| `content/settings/promotion.config.json` 之 UTM block；既有實作；production |
| **FB → GitHub** | `facebook` | `social` | `{page}_post`（同上 pattern）| `{slug}`（同上 pattern）| 同上 `promotion.config.json`；FB 推廣文案之 article URL 不分 target host；既有實作；production |
| **GitHub Pages → Blogger** | `github_pages` | `referral` | `portable_blog_system`（static default）| `related_links` / `other_links`（snake_case slot；靜態二擇一）| `src/scripts/ga4-url-builder.js applyCrossSiteUtm`（per pm-6）+ `src/scripts/build-github.js deriveRenderedCrossLinks`；production |
| **Blogger → GitHub Pages**（本 plan）| `blogger` | `referral` | `portable_blog_system`（mirror）| `related_links` / `other_links`（+ 可選 `article_cross_links`）| **未實作**；本 plan 之規格設計；mirror GitHub→Blogger |

#### 5.7.2 一致性檢查 — 哪些對齊、哪些有意 diverge

**對齊（symmetric / mirror）**：

| 維度 | FB→Blogger | FB→GitHub | GH→Blogger | Blogger→GH | 一致性 |
|---|---|---|---|---|---|
| **utm_source 用「平台識別」** | ✅ facebook | ✅ facebook | ✅ github_pages | ✅ blogger | ✅ 一致（皆 source-side platform token；皆 lowercase；皆 snake_case 容忍）|
| **平台 token 之 lowercase + 單一 token 規則** | ✅ | ✅ | ✅（雙 token snake_case：`github_pages`）| ✅（單 token：`blogger`）| ✅ 符合 `ga4-parameter-naming-registry.md` §3.1 之 case 規則 |
| **cross-link 之 utm_medium=referral / FB 之 utm_medium=social** | n/a（FB→Blogger 為 social）| n/a（FB→GitHub 為 social）| ✅ referral | ✅ referral（mirror GH→Blogger）| ✅ cross-link 雙向同 medium（referral）；FB 雙向同 medium（social）|
| **cross-link 雙向之 utm_campaign 同值** | n/a | n/a | ✅ portable_blog_system | ✅ portable_blog_system（mirror）| ✅ cross-link 雙向 campaign 對稱 |
| **cross-link 雙向之 utm_content 同 slot 命名** | n/a | n/a | ✅ related_links / other_links | ✅ related_links / other_links（mirror）| ✅ snake_case plural；mirror existing |
| **snake_case convention** | ✅ `fan1_post`（campaign pattern）| ✅ `fan1_post` | ✅ all snake_case | ✅ all snake_case | ✅ 全方向 snake_case；對齊 `ga4-parameter-naming-registry.md` §3 |

**有意 diverge（差異有理由）**：

| 維度 | FB 方向 | cross-link 方向（含本 plan）| diverge 理由 |
|---|---|---|---|
| **utm_medium** | `social` | `referral` | FB 為社群平台貼文（social channel）；GH↔Blogger 為跨站 publishing platform 之 referral；GA4 channel grouping 對二者識別 path 不同（per §5.2）|
| **utm_campaign 是否 pattern-based** | `{page}_post`（per-page pattern；多粉絲頁可擴展）| `portable_blog_system`（static default）| FB 多粉絲頁時需區分 source page；cross-link 為自家雙站，campaign attribution 走 utm_content slot 即可；無需 pattern |
| **utm_content 顆粒度** | `{slug}`（per-post 顆粒）| `related_links` / `other_links`（per-slot 顆粒）| FB 一篇貼文對應一篇文章；utm_content=slug 直接對應；cross-link 一文可含多個 slot；utm_content=slot 切片至 link 位置 |

#### 5.7.3 結論

| 問題 | 答 |
|---|---|
| **本 plan 之 reverse UTM 是否與既有 GitHub → Blogger 完全 mirror？** | ✅ 是；4 個 UTM 欄位皆 mirror（source 由 `github_pages` ↔ `blogger` 對換；其他 3 欄完全相同）|
| **是否與 FB → Blogger / FB → GitHub 完全一致？** | ❌ 否；**有意 diverge**：FB 為 social medium + per-page campaign + per-post content；cross-link 為 referral medium + static campaign + per-slot content |
| **diverge 是否合理？** | ✅ 是；對齊 GA4 channel grouping 慣例（social vs referral）+ cross-link 雙向對稱 + 既有 production validated |
| **本 plan 是否需修改既有 FB UTM 規則以求 4-direction 統一？** | ❌ 不需；既有 FB UTM 為 production-validated 多月；強行統一會破壞 FB 流量 attribution 之 channel grouping |
| **本 plan 是否需修改既有 GitHub→Blogger UTM 規則？** | ❌ 不需；本 plan 為 mirror；既有規則為設計起點 |

→ **本 plan 之 UTM 設計為「最大 mirror 對稱（vs GH→Blogger）+ 與 FB 雙向之 有意 diverge 保留」**；docs 規格設計階段（step 1）已完成一致性 audit。

---

## §6 Link Slot / utm_content 涵蓋範圍

### 6.1 必須涵蓋 slots

| Slot | 涵蓋 |
|---|---|
| `related_links` | ✅ relatedLinks aside（per `blogger-post-full.ejs` line 113-144）|
| `other_links` | ✅ otherLinks aside（per `blogger-post-full.ejs` line 146-173）|

→ mirror GitHub → Blogger 之既有 2 slots。

### 6.2 可選涵蓋 slot

| Slot | 涵蓋 | 評估 |
|---|---|---|
| `article_cross_links` | 🟡 evaluate | article body 內 inline cross-link；屬 markdown body 內之連結；需 markdown post-process 或 EJS render 階段 link detection |

**article body cross-link 之 challenges**：
- markdown 解析後之 `<a>` 為 inline；需 build 階段或 render 階段對 GitHub Pages domain 之 link 預處理
- 與 markdown 自由度可能衝突（author 可寫任意 `<a>`）
- 需考慮策略 A：若 author URL 已含 utm_*，是否覆寫

**推薦**：**第一階段先不支援**；僅做 relatedLinks / otherLinks 兩 slots。article body cross-link 之 UTM 注入屬獨立未來 phase。

### 6.3 排除 slots

| Slot | 排除理由 |
|---|---|
| `affiliate_link` | per §4 非目標；affiliate 導向通路王 / 聯盟網等非 GitHub Pages domain；不適用 reverse UTM；且 affiliate URL 不主動加 UTM（per `click-tracking-governance.md` §7.3 + `ga4-link-tracking-spec.md` P5）|
| `hashtag_link` | per §4 非目標；hashtag span→a 尚未實作（屬 `hashtag-slug-decision.md` 之 deferred）；且 hashtag 站內導向 `/tags/{slug}/` 為**同站**連結；無 reverse UTM 必要 |
| Internal Blogger link | 同站連結；無 cross-link 屬性 |
| External non-GitHub link | 屬第三方；不應強加本站 UTM |

---

## §7 實作候選位置（read-only 分析；不實作）

### 7.1 `src/scripts/ga4-url-builder.js` — 擴充建議

**目前**（per pm-6 既有實作）：
```js
// Phase related-links-ga4-audit：判斷 url 是否為指向 Blogger cross-site host 之連結。
export function isBloggerCrossLink(rawUrl, settings) { ... }

// applyCrossSiteUtm：對 GitHub Pages → Blogger cross-link 之 UTM 注入 + target/rel 標記。
export function applyCrossSiteUtm({ url, settings, slot, existingRel = '' }) { ... }
```

**建議擴充**（read-only 分析；不實作）：

#### 7.1.1 新增 `isGithubCrossLink`（mirror `isBloggerCrossLink`）

```js
// (proposed) 判斷 url 是否為指向 GitHub Pages cross-site host 之連結。
//   依據 settings.site.githubSiteUrl 之 hostname 比對；忽略 kind 欄位。
//   用於 Blogger 端 relatedLinks / otherLinks 之 reverse UTM 處理。
export function isGithubCrossLink(rawUrl, settings) {
  // mirror isBloggerCrossLink 結構
  // 唯一 diff：settings.site.bloggerSiteUrl → settings.site.githubSiteUrl
}
```

#### 7.1.2 `applyCrossSiteUtm` 參數化方向

**方案 A**：新增 `direction` 參數

```js
applyCrossSiteUtm({ url, settings, slot, existingRel, direction: 'to_blogger' | 'to_github' })
```

- 函式內依 direction 決定：
  - isBloggerCrossLink vs isGithubCrossLink 用哪個
  - utm_source: github_pages vs blogger
  - utm_medium / campaign / content（同名；無需切換）

**方案 B**：新增獨立函式 `applyReverseUtm`（或 `applyBloggerToGithubUtm`）

```js
applyReverseUtm({ url, settings, slot, existingRel = '' })
```

- 函式內 hard-code utm_source=blogger（無需參數化方向）
- mirror 結構

**推薦**：**方案 A**（參數化方向）；DRY + 後續若有第三方向（如 future custom-domain）易擴展。

#### 7.1.3 既有函式之 backward compat

若採方案 A，需確保既有 caller（`build-github.js deriveRenderedCrossLinks`）不受影響：

- 既有 signature：`applyCrossSiteUtm({ url, settings, slot, existingRel })`
- 新 signature：`applyCrossSiteUtm({ url, settings, slot, existingRel, direction = 'to_blogger' })`
- `direction` 之 default 為 `'to_blogger'` → 既有 caller 不變
- 新 caller（`build-blogger.js`）顯式傳 `direction: 'to_github'`

### 7.2 `src/scripts/build-blogger.js` — 預處理建議

**建議新增**（mirror `build-github.js:480-481` pattern）：

```js
// (proposed) Phase Blogger-to-GitHub-reverse-UTM：對每篇 Blogger post 預處理 relatedLinks / otherLinks
//   - 對 GitHub Pages cross-link 注入 reverse UTM + 強制 target=_blank + 合併 rel
//   - 非 GitHub Pages 連結 / 同站連結維持原樣
//   - 既有 utm_* 套用策略 A：跳過 UTM 注入但仍套 target/rel
function deriveRenderedCrossLinks(rawLinks, settings, slot) {
  const arr = Array.isArray(rawLinks) ? rawLinks : [];
  return arr.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    if (typeof item.url !== 'string' || item.url.trim() === '') return item;
    const xs = applyCrossSiteUtm({
      url: item.url,
      settings,
      slot,
      existingRel: typeof item.rel === 'string' ? item.rel : '',
      direction: 'to_github',  // <-- key diff vs GitHub
    });
    if (xs.target === null) return item; // 非 GitHub cross-link：不動
    return { ...item, url: xs.url, target: xs.target, rel: xs.rel };
  });
}

// (proposed) per-post 預處理
const relatedLinksRendered = deriveRenderedCrossLinks(post.relatedLinks, settings, 'related_links');
const otherLinksRendered = deriveRenderedCrossLinks(post.otherLinks, settings, 'other_links');

// (proposed) 傳入 EJS template
const html = await ejs.renderFile(template, { ...post, relatedLinksRendered, otherLinksRendered, ... });
```

→ 完全 mirror `build-github.js:475-498` pattern；唯一 diff 為 `direction: 'to_github'`。

### 7.3 `src/views/blogger/blogger-post-full.ejs` — Template 改動建議

**目前**（per `blogger-post-full.ejs:119-125`）：
```ejs
<%
  const renderableRelated = (Array.isArray(post.relatedLinks) ? post.relatedLinks : []).filter(...);
-%>
```

**建議**（mirror `post-detail.ejs:171-177` pattern）：
```ejs
<%
  const renderableRelated = (Array.isArray(relatedLinksRendered) ? relatedLinksRendered : []).filter(...);
-%>
```

→ 從讀 `post.relatedLinks`（raw）改讀 `relatedLinksRendered`（已預處理之 cross-link UTM + target/rel）。

**target/rel 邏輯**（mirror `post-detail.ejs:187-188`）：
```ejs
const finalTarget = (typeof item.target === 'string' && item.target !== '') ? item.target : (isInternal ? null : '_blank');
const finalRel = (typeof item.rel === 'string' && item.rel !== '') ? item.rel : (isInternal ? null : 'nofollow noopener');
```

→ 若 `item.target` / `item.rel` 已由 build-blogger 預處理填入 → 用其值；否則 fallback 至 default。

⚠️ **本 plan 不實作**；屬 future implementation phase 之改動。

### 7.4 是否 mirror GitHub→Blogger 既有 deriveRenderedCrossLinks pattern

**推薦：完全 mirror**

理由：
1. ✅ **既有 pattern 已 production-validated**（pm-6 / pm-45 deploy；user Realtime 驗收通過）
2. ✅ **對稱性**：build-blogger.js mirror build-github.js；read 端讀 `*Rendered` 預處理結果
3. ✅ **單一 source of truth**：`applyCrossSiteUtm` 為核心邏輯；參數化 direction 即可
4. ✅ **可逆性**：mirror 結構 → revert 容易（revert build-blogger.js 之 deriveRenderedCrossLinks 即可）

### 7.5 build pipeline 預處理 vs EJS render 階段處理

**選項 A**：build pipeline 預處理（推薦）

- 在 `build-blogger.js` 之 deriveRenderedCrossLinks 預處理 raw `post.relatedLinks` → `relatedLinksRendered`
- EJS template 僅吃 `*Rendered`（已處理 URL + target + rel）
- mirror GitHub 既有 pattern

**選項 B**：EJS render 階段處理

- EJS template 內呼叫 helper（如 `<%- applyReverseUtm(item.url, settings, 'related_links') %>`）
- 不需 build script 改動

**推薦**：**選項 A**（build pipeline 預處理）；理由：
- mirror GitHub 既有 pattern
- 邏輯集中於 JS（非 EJS）；測試更容易
- EJS template 保持 thin render
- 預處理之 `item.target` / `item.rel` 與 既有 EJS fallback 邏輯對接乾淨

---

## §8 資料需求

### 8.1 既有資料（無需新增）

| 資料 | 來源 |
|---|---|
| `post.slug` | frontmatter `slug` |
| `post.relatedLinks` / `post.otherLinks` | frontmatter（per `docs/related-links-schema.md`）|
| `settings.site.githubSiteUrl` | `content/settings/site.config.json` 之 `site.githubSiteUrl`（建議；需確認既有 settings 結構）|
| `link.url` / `link.title` | `relatedLinks[].url` / `.title` |

### 8.2 建議新增（read-only 分析；非本 batch 改動）

| 資料 | 是否需新增 |
|---|---|
| `content/settings/ga4.config.json` 新增 reverse UTM 設定 | 🟡 **不建議**；UTM 命名建議 hard-code 於 `ga4-url-builder.js`（mirror 既有 GitHub→Blogger 之 hard-code）；無需設定檔擴充 |
| `content/settings/site.config.json` 新增 `githubSiteUrl` | ✅ **需確認**；若既有未有此 field → 需新增；若已有 → mirror `isBloggerCrossLink` 之 `settings.site.bloggerSiteUrl` 既有讀法 |

### 8.3 既有 settings 確認項（本 plan 不執行；屬未來 implementation 之前置）

future implementation phase 啟動前須確認：

- `content/settings/site.config.json` 是否含 `githubSiteUrl` field？
- 若無 → impl phase 第 1 步須先補
- 對齊 `bloggerSiteUrl` 既有 settings 對稱

---

## §9 風險與 Rollback

### 9.1 Blogger 文章 URL 已發布後修改之風險

| 場景 | 風險 | 緩解 |
|---|---|---|
| 既有已發布 Blogger 文章（如 `we-media-myself2`）含 cross-link → GitHub | 🟡 中 | reverse UTM 落地後須 user 重 build + 重貼 Blogger 後台；屬一次性人工成本 |
| 重貼前後之 Google 已索引 URL drift | 🟢 低 | UTM URL 不應為 canonical / sitemap URL（per `ga4-link-tracking-spec.md` §7 P3）；Google 索引以 canonical 為主 |
| 已散佈外部之 Blogger URL（FB 貼文 / 留言）| 🟢 低（外部連結） | 外部 referrer 仍有效；reverse UTM 僅影響「從 Blogger 跳 GitHub」之點擊；不影響外部 referrer |

### 9.2 UTM 參數造成 URL 變長

| 維度 | 影響 |
|---|---|
| URL byte 增加 | ~80-100 bytes per UTM-injected link |
| 視覺檢視 | URL 較長；可讀性下降 |
| HTTP request | 無功能影響 |
| GA4 後台 | 預期；utm 為 GA4 接收參數 |

→ 風險：🟢 低；屬 UTM 機制之預期成本。

### 9.3 Canonical / SEO 影響

| 範圍 | 影響 |
|---|---|
| GitHub Pages 文章之 `<link rel="canonical">` | ✅ **不影響**；canonical 為 build 階段 derive 之 clean URL；不含 UTM（per 既有 build-github.js） |
| GitHub Pages 文章之 `sitemap.xml` | ✅ **不影響**；sitemap 為 clean canonical URL |
| GitHub Pages 文章之 Open Graph `og:url` | ✅ **不影響**；OG URL 對齊 canonical |
| Google 索引 | ✅ **不影響**；Google 對 UTM URL 之歸併能力良好；以 canonical 為主 |

→ 風險：🟢 無；既有 SEO safety rules（per `ga4-link-tracking-spec.md` §7）保持完整。

### 9.4 重複 UTM 參數處理

per 既有 `applyCrossSiteUtm` 策略 A：

```js
const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
  .some((key) => u.searchParams.has(key));
if (hasUtm) {
  return { url, target: '_blank', rel: mergedRel, applied: false };
}
```

→ 若 author 手填之 `relatedLinks[].url` 已含 utm_*：
- ✅ 系統**不覆寫**；保留 author intent
- ✅ 仍套 `target="_blank"` + rel 合併
- ✅ mirror GitHub → Blogger 既有策略

風險：🟢 無；策略 A 已 production-validated。

### 9.5 外部連結不應強加 Blogger→GitHub UTM

| 連結類型 | 處理 |
|---|---|
| GitHub Pages cross-link（host match `settings.site.githubSiteUrl`）| ✅ 注入 reverse UTM + 套 target/rel |
| 第三方 external link（如 YouTube / 圖書館 / 其他站）| ❌ **不注入** UTM；mirror `isBloggerCrossLink` 之 hostname 比對機制 |
| 同站 Blogger internal link | ❌ 不注入（同站 referrer 已可識別）|

→ 風險：🟢 無；`isGithubCrossLink` 之 hostname guard 確保不誤注。

### 9.6 Rollback 方式

| 階段 | rollback |
|---|---|
| 本 doc | revert single commit；純 docs |
| reverse UTM source impl（`ga4-url-builder.js` + `build-blogger.js`）| revert commits；既有 Blogger build 不受影響（attr 為 url 預處理；revert 後回 raw url）|
| Blogger template 改動（`blogger-post-full.ejs` 改讀 `*Rendered`）| revert template；回讀 `post.relatedLinks` raw |
| Blogger 後台已重貼之文章 | user 需重 build + 重貼舊版（無 UTM）；屬一次性逆操作 |

每階段獨立 commit（per `docs/20260522-pm-phase-2-batch-plan.md` §4.1）；single-commit revert 即可。

---

## §10 推薦實作順序

**本 doc 不啟動實作**；以下為**未來 implementation phase 之建議順序**：

| # | 階段 | 範圍 | 阻擋 |
|---|---|---|---|
| 1 | **Read-only inspect 既有 GitHub→Blogger UTM builder** | docs / 分析既有 `applyCrossSiteUtm` 結構 + `deriveRenderedCrossLinks` pattern | 本 doc decision approved |
| 2 | **決定 reverse UTM 命名**（user 表態 §5 / §6 之命名選項）| user decision | #1 完成 |
| 3 | **`ga4-url-builder.js` 擴充**（新增 `isGithubCrossLink` + `applyCrossSiteUtm` 參數化 `direction`）| source（`src/scripts/ga4-url-builder.js`）+ 既有 unit test if any | #2 完成 |
| 4 | **`build-blogger.js` 預處理**（新增 `deriveRenderedCrossLinks` mirror）| source（`src/scripts/build-blogger.js`）| #3 完成 |
| 5 | **`blogger-post-full.ejs` 改讀 `*Rendered`**（mirror `post-detail.ejs` pattern）| source（`src/views/blogger/blogger-post-full.ejs`）| #4 完成 |
| 6 | **build / validate / 既有 Blogger HTML 測試**（無 cross-link 之 ready post 之 post.html 應 byte-identical-modulo-builtAt）| build + validate | #5 完成 |
| 7 | **user 手動重貼 Blogger** + GA4 Acquisition / Realtime 驗收（confirm reverse UTM 接收）| user 操作 + GA4 後台 | #6 deploy |

### 10.1 拆批原則

per memory + `docs/20260522-pm-phase-2-batch-plan.md` §4.1：

- ✅ #3 / #4 / #5 各為獨立 commit（不混批）
- ✅ #3 ~ #5 LOC 小（各 < 50 行；mirror 既有 pattern）
- ✅ trim-newline pattern：對無 cross-link 之 ready post，post.html 結構性 byte-identical-modulo-builtAt
- ✅ build / validate 驗收 + user 重貼 屬最後階段

### 10.2 與 `docs/click-tracking-governance.md` §10 之對齊

| governance §10 順序 | 本 plan §10 |
|---|---|
| 順序 5（Phase 2-d-blogger-to-github-utm）| ✅ 對應本 plan |
| 順序 1-4（listener / affiliate / related-other / hashtag）| 各自獨立 phase；本 plan 不依賴 |

### 10.3 與 `docs/blogger-listener-strategy.md` §7 之對齊

| blogger-listener-strategy §7 | 本 plan §10 |
|---|---|
| #3 Blogger → GitHub reverse UTM read-only plan | **本 doc**（本 phase）|
| #4 Blogger → GitHub reverse UTM implementation | 對應本 plan #3-#7 |
| #5 觀察期 | 本 plan #7 之 GA4 驗收 + 後續觀察 |

---

## §11 本批不做事項

per spec 之「禁止事項」+ docs-only 性質：

| 項目 | 不做 |
|---|---|
| 改 `src/scripts/ga4-url-builder.js` | ✅ 不做 |
| 改 `src/scripts/build-blogger.js` | ✅ 不做 |
| 改 Blogger template（`blogger-post-full.ejs` 等）| ✅ 不做 |
| 改 GitHub `post-detail.ejs` | ✅ 不做 |
| 改 `ga4.config.json` | ✅ 不做 |
| 改 `content/settings/site.config.json` | ✅ 不做 |
| 加 Blogger listener | ✅ 不做（屬 `blogger-listener-strategy.md` 之 deferred 範圍）|
| 加 `data-ga4-*` attr | ✅ 不做 |
| 改 hashtag | ✅ 不做 |
| 改 affiliate URL UTM 政策 | ✅ 不做（per §4 非目標）|
| 實作 reverse UTM 任何部分 | ✅ 不做 |
| build / validate | ✅ 不做 |
| push / deploy | ✅ 不做 |
| 動 gh-pages / deploy repo | ✅ 不做 |
| user 重貼 Blogger 文章 | ✅ 不做（屬未來 #7 階段）|
| GA4 production 驗收 | ✅ 不做 |

---

## §12 Acceptance Criteria（本文件完成條件）

| # | 條件 | 滿足 |
|---|---|---|
| 1 | 文件清楚說明 reverse UTM 之目的 | ✅ §3 主要 / 次要目標 + §1 背景 |
| 2 | 清楚區分 reverse UTM 與 Blogger listener | ✅ §1.3 + §4 非目標（明確切割 listener 屬另一 doc 範圍）|
| 3 | 提出 utm_source / medium / campaign / content 建議 | ✅ §5 四 sub-section + §5.6 範例 |
| 4 | 列出未來實作位置但不修改 source | ✅ §7 含 ga4-url-builder.js / build-blogger.js / blogger-post-full.ejs 之 read-only 分析 |
| 5 | 完全 docs-only | ✅ §11 列 15 項不做事項 |
| 6 | 與既有 3 個 UTM 方向（GH→Blogger / FB→Blogger / FB→GitHub）一致性 audit | ✅ §5.7 四方向比較表 + 對齊 / 有意 diverge 之分類 + 5 結論 row |

---

## §13 Cross-links

- `CLAUDE.md` §2.1（Blogger 站定位）/ §5（既有 GA4 events）/ §16.4（既有 cross-link UTM 規則 + future Blogger→GitHub）
- `docs/click-tracking-governance.md` §3.1 UTM Layer / §4 row 3（reverse UTM 規格）/ §10 順序 5（Phase 2-d）
- `docs/ga4-link-tracking-spec.md` §3.5（Blogger to GitHub UTM；尚未實作）/ §5.2 utm_medium 列舉 / §5.5 utm_term 不使用 / §7 SEO safety rules
- `docs/ga4-parameter-naming-registry.md` §3 命名規則 / §4.2（Blogger → GitHub UTM 既建議規格）/ §5.2 系列文章 campaign
- `docs/blogger-listener-strategy.md` §5.1（短期推薦方案 D）/ §6.4（reverse UTM 命名）/ §7（implementation 順序）
- `docs/20260522-pm-phase-2-batch-plan.md` §10（Reverse UTM Plan；含 user 表態必要性）
- `docs/hashtag-slug-decision.md` §5 / §7（hashtag click 屬 deferred；不在本 plan 範圍）
- `docs/related-links-schema.md`（`relatedLinks` / `otherLinks` 既有 schema）
- `docs/blogger-export.md`（Blogger 匯出 pipeline）
- `src/scripts/ga4-url-builder.js`（既有 `isBloggerCrossLink` / `applyCrossSiteUtm` / `mergeRel`；reverse UTM mirror 目標）
- `src/scripts/build-github.js`（既有 `deriveRenderedCrossLinks`；mirror reference pattern）
- `src/scripts/build-blogger.js`（未來 reverse UTM 改動目標檔之一）
- `src/views/blogger/blogger-post-full.ejs`（Blogger HTML 結構；relatedLinks / otherLinks 渲染位置）
- `src/views/pages/post-detail.ejs`（既有 `relatedLinksRendered` / `otherLinksRendered` 讀法 reference）
- `content/settings/site.config.json`（`bloggerSiteUrl` / 建議新增 `githubSiteUrl`）

---

（本文件結束）
