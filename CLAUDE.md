# CLAUDE.md

本文件是本專案給 Claude Code 使用的開發規範。  
Claude Code 在修改、建立、重構本專案前，必須先閱讀本文件，並依照本文件的系統目的、技術方向、資料夾架構、分階段開發方式與命名規則執行。

---

# 1. 系統目的

本專案是一套「可搬家的本機資料夾型內容管理系統」。

主要目標不是做大型後台，而是建立一套可以長期維護、可以備份、可以搬家、可以輸出到 Blogger 與 GitHub Pages 的內容系統。

系統核心理念：

1. 文章資料不綁死在 Blogger。
2. 文章內容以 Markdown + frontmatter 管理。
3. 分類、標籤、站台設定、廣告、社群、推廣文案以 JSON 設定檔管理。
4. 使用 VS Code 作為主要內容管理環境。
5. 使用 Vite + EJS + SCSS 建立靜態網站與匯出工具。
6. GitHub Pages 站可透過 `npm run dev` 本機預覽。
7. Blogger 站不在本機完整模擬，只輸出可貼到 Blogger 的 HTML、metadata 與發布輔助檔。
8. 圖片不由系統自動上傳，圖片可手動上傳至 Blogger、Google Drive 或其他外部空間。
9. 系統資料夾可整包備份，未來可搬到其他平台。
10. 第一版避免過度工程化，不做真正後台、留言、View 數、讚數、會員與資料庫。

---

# 2. 目前兩平台定位

## 2.1 Blogger 站

Blogger 目前已有流量與 Google AdSense 收益，因此不可直接放棄。  
Blogger 的定位是：

1. 既有流量入口。
2. Google AdSense 收益來源。
3. 生活、書評、四格漫畫、教具下載內容站。
4. 導流至 GitHub 技術站的入口。
5. 未來新平台建立前的過渡內容據點。

Blogger 不作為唯一內容資料庫。  
Blogger 後台只是發布平台，真正的文章資料來源仍是本機 Markdown。

Blogger 第一版採手動發布流程：

```text
Markdown 文章
→ 系統 build 產出 Blogger HTML
→ 使用者手動複製到 Blogger
→ 使用 Blogger 平台預覽
→ 確認後發布
```

Blogger 需支援三種輸出模式：

```text
full：完整文章
summary：摘要導流文章
redirect-card：短導流卡片
```

適合 Blogger full 的內容：

```text
書評
生活文章
生活四格
書評四格
講座四格
教具下載
親子教育素材
```

適合 Blogger summary 的內容：

```text
GitHub 技術文章摘要
前端筆記摘要
AI 工具心得摘要
經營筆記摘要
導流至 GitHub 的文章公告
```

---

## 2.2 GitHub Pages 站

GitHub Pages 站的定位是：

1. 技術筆記主站。
2. 心得與經營筆記主站。
3. 可完整本機預覽與 build 的靜態內容站。
4. 未來可綁自訂網域。
5. 可承接 Blogger、FB 粉絲頁與搜尋流量導入。

GitHub 站需支援：

```bash
npm run dev
npm run build
npm run preview
```

GitHub 站第一版需有：

```text
首頁 / 目錄頁
文章列表頁
文章詳細頁
分類頁
標籤頁
404 頁
Design System 頁
sitemap.xml
robots.txt
```

---

# 3. 核心資料來源

本專案真正的內容資料來源是：

```text
content/
```

而不是 Blogger 後台，也不是 GitHub Pages 的 dist 結果。

## 3.1 文章資料

文章使用 Markdown + frontmatter。

例如：

```yaml
---
id: "20260504-github-pages-blog-planning"
site: "github"                 # github | blogger
contentKind: "tech-note"       # post / tech-note / book-review / download / comic / life-note / page
primaryPlatform: "github"
title: "GitHub Pages 免費空間限制與部落格規劃"
titleEn: "GitHub Pages Free Hosting Limits and Blog Planning"
slug: "github-pages-blog-planning"
date: "2026-05-04"
updated: "2026-05-04"
author: "Dean"
category: "tech-note"          # 必須存在於 categories.json
tags: [github, vite, static-site]    # 必須存在於 tags.json
description: "..."
searchDescription: "..."
cover: ""
coverAlt: ""
status: "draft"                # draft / ready / published / archived
draft: true
canonical: "auto"
publishTargets:
  github:  { enabled: true, mode: "full" }
  blogger: { enabled: true, mode: "summary" }    # full / summary / redirect-card
blocks:                        # toc / adsenseTop / adsenseMiddle / adsenseBottom / hashtags / socialFollow / relatedPosts / sidebar
  adsenseTop: true
  hashtags: true
---
```
（完整欄位字典見下方 See also）

See also:
- `docs/publish-bundle.md` §2.6.1（`.md` frontmatter 內容屬性欄位列表）
- `docs/migration-from-frontmatter.md` §4（舊 frontmatter → `.md` frontmatter 對照）
- `docs/related-links-schema.md`（`relatedLinks` / `otherLinks` 欄位字典；屬內容屬性，**不放** `.publish.json` 與 `.fb.md`；`[Youtube]` / `[台北市立圖書館]` 等顯示前綴拆入 `platform` 欄位，**不**併入 `title`）

## 3.2 站台設定

站台、分類、標籤、主題、廣告、社群、推廣、連結規則使用 JSON 管理。

主要設定檔：

```text
content/settings/site.config.json
content/settings/themes.json
content/settings/categories.json
content/settings/tags.json
content/settings/ads.config.json
content/settings/social-links.json
content/settings/promotion.config.json
content/settings/affiliate-networks.json
content/settings/link-rules.json
content/settings/seo.config.json
content/settings/ga4.config.json
content/settings/navigation.json
content/settings/sidebar.config.json
content/settings/footer.config.json
content/settings/download-assets.json
content/settings/download-forms.json
```

### download-assets.json / download-forms.json（empty registry landing point）

empty registry（`{ schemaVersion:1, updatedAt:"", assets|forms:[], notes:"" }`；commit `466e471`）。當前狀態：

- ✅ **loader read-only 載入**（`src/scripts/load-settings.js`；暴露 `settings.downloadAssets` / `settings.downloadForms`；無下游 consumer）
- ✅ **validator landed（warning-only，`src/scripts/validate-content.js`）**：registry-level shape + key-uniqueness（`download-registry-invalid-shape` / `download-registry-duplicate-key`）；frontmatter shape rules（`download.fileUrl` D1/D2/D3 + `assetRefs[]` / `formRef` 共 5 條）；R2 not-found（`download-asset-ref-not-found` / `download-form-ref-not-found`，commit `145a548`）；R5b intra-post `assetRefs[]` duplicate（`download-asset-ref-duplicate`，commit `077c3d1`；與 R2 orthogonal cascade，formRef 無 duplicate 概念）
- ❌ **deferred / 未啟動**：R4 inactive rules、R6 coexistence rule、Admin picker、renderer / landing page、content migration（既有 `download.fileUrl` 未遷至 `assetRefs[]` / `formRef`）、user-facing 下載頁 / Google Forms 串接
- production posts 未使用 `assetRefs[]` / `formRef` → production 觸發為零
- detail：commits + `docs/20260602-download-registry-aware-validation-preanalysis.md`

### commerce-links.json（empty registry landing point）

~~empty registry~~（`{ schemaVersion:1, updatedAt:"", commerceLinks:[], notes:"" }`；commit `c1a6974`）。**🟢 L1 seed landed（2026-06-10，HEAD `1586d10`）：registry 由 empty `[]` → 10 active entries（全 `networkKey: books` 通路王販書 redirect；0 held；1 excluded＝KOBO/金石堂電子書 未入 registry，deferred 至聯盟網）；`targetUrl` 保留 affiliate redirect（`uid1=blog`，不 canonicalize）；無下游 consumer（renderer / Admin / migration 仍 dormant）；validate 維持 0/69/59。詳見 `docs/20260610-commerce-blogger-tongluwang-l1-seed-result.md` + `docs/20260610-commerce-l1-seed-acceptance-checkpoint.md`。** 當前狀態：

- ✅ **loader read-only 載入並 unwrap 為 array**（`settings.commerceLinks`；metadata 不暴露；無下游 consumer；commit `78f1e9a`）
- ✅ **registry-level validator landed 11 條 warning-only rules**（commit `94a1d47`；post loop **外**單一呼叫）：R3 invalid-entry-type、R4 missing-link-id、R5 duplicate-link-id、R6 missing-target-url（僅 `active!==false`）、R7 invalid-target-url（與 R6 互斥）、R8 missing-internal-label、R9 internal-label-empty（與 R8 互斥）、R11 invalid-network-key（against `affiliate-networks.json`）、R12 replacement-target-not-found、R13 replacement-target-self（與 R12 互斥）、R14 inactive-missing-replacement。**deferred**：R1 / R2（unwrap 後不可觀察）、R10 invalid-merchant-key（merchant registry 未存在）、R15 suspicious-secret-token（heuristic 誤判風險）
- ✅ **content-reference validator landed C1 / C2 / C3 / C5 / C6**（warning-only；commits `39b89e3` / `281cd43`；post loop **內**掃 published post `affiliate.links[].ref`）：C1 invalid-type、C2 empty、C3 not-found（against registry）、C5 intra-post duplicate（與 C3 orthogonal）、C6 ref+url coexist（只認 `entry.url`；不 echo ref / url value；與 C3 / C5 orthogonal）。guard：affiliate 非 object 或 `links` 非 array → skip；raw-only links（無 `ref`）不觸發
- ✅ **content-ref validator landed C8 / C4 / C9**：C8 commerce-ref-invalid-role（post-level `affiliate.links[i].role` enum 檢查；commit `57c983b`）；C4 commerce-ref-inactive + C9 commerce-ref-display-override-risk（Phase 20260608-L5b，commit `de3134f`；registry-coupled，共用 `buildCommerceLinkEntryMap`，獨立 pass，不改 C1/C2/C3/C5/C6/C8 行為；warning-only）。**C4 docs-only plan 原為 `8c9fddf`，source 已於 `de3134f` 落地。** C9 = **narrow leak-equality only**（`labelOverride.trim() === entry.internalLabel.trim()`；`validate-content.js:761-783`；message 絕不 echo 敏感值）；C9 broader expansion（URL leak / token-like detection）= **NOT implemented / Option D / no expansion**（per `docs/20260609-commerce-c9-label-override-safety-preanalysis.md` §1.2；維持現狀 narrow 不擴大；未來如擴大須獨立 expansion preanalysis + fixture + acceptance phase）
- ✅ **fixture mechanism = Option D**（skip settings-level fixtures；mirror download R1 source-only cadence；Option A naming `content/validation-fixtures/settings/commerce-links/_test-<rule-id>.json` 保留為未來 escape hatch；Option B/C rejected；commit `89cbf75`）
- ✅ **content-ref fixtures landed C1 / C2 / C3 / C5 / C6 / C8**（post-level fixtures，`content/validation-fixtures/blogger/posts/_test-commerce-ref-*.md`，含 `_test-commerce-ref-invalid-role.md`（C8，commit `bb33523`）；C1/C2/C3/C5/C6 commits `149efdc` / `3aeabbc`）；C4 / C9 = **overlay fixture**（`content/validation-fixtures/settings/commerce-c4-c9-overlay.json` + 重用 `_test-commerce-ref-not-found.md`；commit `baced89`；overlay-only，normal baseline overlay-blind）；fixture-namespaced refs + RFC 2606 reserved url；無真實 affiliate URL / token / tracking id；commerce registry 維持 empty `[]`）
- ❌ **deferred / not started**：C7 content-ref rule（missing-role；**NO-GO / not implemented**，role author-optional，啟用須 user product 決策）、C7 fixture、C9 broader expansion（**Option D / no expansion**）、Admin picker / selector / display、renderer / output、~~registry seed~~（**🟢 L1 seed DONE 2026-06-10：10 active 通路王 entries landed，HEAD `1586d10`；L2 gate 仍 BLOCKED for 新 candidates —— 無 user-provided `commerceSeedCandidates:` YAML + explicit approval 前不可再 seed**；per `docs/20260608-commerce-l1-seed-candidate-intake-template.md`）、production content migration（raw url → `ref`）、build / deploy / Blogger repost / GA4 commerce dimension（全部 dormant）
- 📋 **YAML 欄位命名 convention（docs-only 決策；`docs/20260610-commerce-yaml-fields-site-productkey-category-preanalysis.md`，commit `aa63bce`）**：完整 affiliate `targetUrl` **集中管理於 registry**（不散落文章）；post YAML **只放 `affiliate.links[].ref`**（+ per-instance `role` / `order` / `labelOverride`）。**不**新增 per-link `site`（post 已有 top-level `site`，entry 站台無關）；未來跨站限制採 optional `surfaces`（複數，省略=全站，**v1 deferred**）。商品種類用 optional `productType`（**v1 deferred**；短期用既有 `tags[]`），**不**新增 commerce `category`（避免與內容 `category` collision）。`linkId` = **唯一 machine PK + post ref 指標**；`productKey`（= product-slug，採 article slug）僅作跨通路同商品**分組線索**（v1 optional），**不**另立主鍵。多 network / 多 link 天然支援：`affiliate.links[]` array + registry **每通路一 `linkId`**（network-key suffix 保唯一，不撞 R5 / C5）。欄位命名一律對齊既有 source：`networkKey`（`books`=通路王 / `affiliate-network`=聯盟網）/ `merchantKey` / `merchant` / `internalLabel`（嚴格不渲染）/ `displayLabel` / `targetUrl` / `active`。registry entry **不放 `articleSlug`**（多對多；靠 derived `usedBy[]`）。v0 維持既有凍結欄位；`surfaces` / `productType` / `productKey` 全 **v1 optional additive，未實作 / validator 不檢查**。**L1 seed gate 不變**（仍 BLOCKED；須 user 提供 `commerceSeedCandidates:` YAML + explicit approval）
- production 0 篇用 `ref` / 0 篇 ref+url coexist → production 觸發為零
- detail：`docs/20260604-commerce-links-content-reference-validation-preanalysis.md` + per-rule preanalysis docs

### 當前 baseline

`npm run validate:content` = **0 errors / 80 warnings / 70 posts**（normal baseline；commerce-links registry L1-seeded 10 active；R1 resolver `src/scripts/resolve-affiliate-links.js` live；R2 smoke `src/scripts/check-commerce-affiliate-resolver.js` **23/23**（pm-11 起；含 9 條 `deriveRenderedAffiliateBlocks` block-resolver case）；R3 首批遷移 `we-media-myself2.md` 2 筆 url→ref；checkpoint `docs/20260610-commerce-we-media-myself2-ref-migration.md`）。
`node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json` = **0 errors / 87 warnings / 71 posts**（overlay baseline；含 C4/C9 overlay-injected entries + we-media 於 overlay replace-semantics 下之 ref C3 not-found：legacy links 2 + pm-13 blocks 4 = **6×** C3；見 `docs/20260610-commerce-we-media-myself2-ref-migration.md` §D）。

⚠️ **baseline 自 0/69/59 → 0/80/70（normal）/ 0/72/60 → 0/83/71（overlay）之 +11/+11 全由 pm-9 `affiliate.blocks[]` validator fixtures 造成**（13 新 fixtures：11 觸發各 1 warning + 2 zero-warning guard〔valid / legacy-coexist〕；guard 不增 issue-post 計數）。**production 0 篇用 `affiliate.blocks[]` → 0 production 觸發**；新增 warning 全在 `content/validation-fixtures/blogger/posts/_test-affiliate-block*` 路徑。affiliate.blocks[] **validator landed（warning-only，`src/scripts/validate-content.js`）**：shape 規則 `affiliate-blocks-not-array` / `affiliate-block-invalid-entry-type` / `-missing-id` / `-duplicate-id` / `-invalid-enabled-type` / `-invalid-surfaces-type` / `-invalid-surface-value` / `-invalid-position` / `-links-not-array` / `-enabled-no-links`；block links 重用 `validateCommerceLinkArray`（C1/C2/C3/C5/C6/C8；**block-level C4/C9 deferred**，entryMap=null）；**不**報 legacy/blocks coexistence；tracking 驗證 deferred。**resolver landed（pm-11 `8b4b225`）**：additive helper `deriveRenderedAffiliateBlocks(affiliate, commerceLinks)`（`src/scripts/resolve-affiliate-links.js`）—— Blogger-only surface gate（surfaces 含 blogger，省略預設 ['blogger']；pages 本 phase 不 render）+ enabled/position/≥1-link 過濾 + 委派既有 `deriveRenderedAffiliateLinks`（ref→targetUrl 逐字含 uid1=blog，不洩 internalLabel）；回傳 per-block { id, position, heading, disclosure, links }；smoke 14→**23/23**；**未改** `deriveRenderedAffiliateLinks`（GitHub/legacy backward-compat）。**Blogger renderer wiring landed（pm-12 `feat(blogger): render affiliate blocks`）**：`build-blogger.js` `renderFullPost` 計算 `affiliateBlocksRendered` 並傳入 `blogger-post-full.ejs`；template 在 blocks 非空時渲染 top（body 前）/ bottom（body 後）blocks（每 block 自有 heading fallback「立即購買」/ disclosure fallback `affiliate.disclosure`/ links；沿用 `.lab-affiliate-box` markup）並**抑制 legacy box**（避免重複）；blocks 空 → legacy 行為 **byte-identical**（we-media 無 blocks[] → 仍 1 legacy bottom box，stash-diff 證實 modulo builtAt 不變）；no tracking/GA4。**GitHub Pages renderer 完全未改**（`post-detail.ejs` / `build-github.js` 不動 → by construction 忽略 `blocks[]`，維持 legacy）。**Production content migration landed（pm-13 `feat(content): add blogger affiliate blocks to we-media`）**：`we-media-myself2.md` frontmatter 加入 2 個 Blogger-only `affiliate.blocks[]`（top `blogger-top-books` / bottom `blogger-bottom-network-slot`，皆 `surfaces:["blogger"]`、現有通路王 refs、上下文案故意不同；bottom = 聯盟網 slot 暫用通路王）；**legacy `links[]`/`position` 保留不動** → Blogger build 渲染 2 boxes（top before body / bottom after），GitHub build 仍 1 legacy bottom box（驗證：build:blogger 2 boxes、build:github 1 box 無 block copy）；normal 0/80/70 不變（refs production-valid），overlay 83→**87**（+4 = blocks 4 refs 於 overlay replace 下 C3）。**未 deploy / 未 touch gh-pages / Blogger repost 仍 BLOCKED/DEFERRED**（實際重貼須 user approval + 備份 + theme CSS 確認）；per `docs/20260610-affiliate-blocks-frontmatter-convention.md`。

download-* registries 仍 empty；commerce registry L1-seeded（10 active）+ R3 後 `we-media-myself2.md` 2 筆用 `ref`（對 production registry valid active → normal 0 觸發）；其餘 production 0 篇用 `ref` / `assetRefs[]` / `formRef` / ref+url coexist / `affiliate.blocks[]`。normal 80 = validation-fixtures only（含 pm-9 affiliate-blocks fixtures；we-media refs valid，normal 不觸發）；overlay 83 = fixtures + overlay replace 致 we-media 2× C3 not-found（migration-related，見 §D）。

Commerce registry 治理紅線（per `docs/20260603-commerce-affiliate-link-empty-registry-preanalysis.md` §4.3 / §5.3 + night-22 §9 + am-2 §12）：

- ❌ **永不**含 affiliate dashboard credentials（email / password / OAuth client secret / API key）
- ❌ **永不**含 access token / bearer token / refresh token / session id / Authorization header
- ❌ **永不**含 commission / payout / clickCount 等 dashboard 統計
- ❌ **永不**含帳號 email / 結算密碼 / 私人 Drive folder ID
- ❌ **不**用 URL pattern 自動推斷 `merchantKey` / `networkKey` / `linkId`；所有 key 由作者明示填寫
- ❌ **禁止**為 fixture 修改 production `affiliate-networks.json`；R11 fixture 須採「故意不存在 networkKey」設計
- reverse UTM remains **dormant**；pm-26 deploy gate remains **BLOCKED**
- Admin Apply / middleware write / admin-write-cli remain **dormant**

Registry 治理紅線（per `docs/20260531-download-asset-form-settings-registry-schema-decision.md` §8 + am-2 §4.1 + pm-20 §4 R1）：

- ❌ **永不**含 respondent data（email / 姓名 / 電話 / 學校 / 答覆內容 / Google Sheet response rows）
- ❌ **永不**含 access token / API key / OAuth secret / 帳號 email / private permission / 私人 Drive folder ID
- ❌ Google Forms responses **remain in Google Forms / Sheets**；不進 repo
- reverse UTM remains **dormant**；pm-26 deploy gate remains **BLOCKED**
- Admin Apply / middleware write / admin-write-cli remain **dormant**

---

# 4. 技術限制

第一版必須使用：

```text
Vite
EJS
SCSS
Vanilla JavaScript
Markdown + frontmatter
JSON 設定檔
```

第一版不得使用：

```text
React
Vue
Astro
Next.js
Nuxt
Tailwind
登入後台
後端資料庫
會員系統
Blogger API 自動發文
Google Drive API 自動上傳
留言系統
View 數
讚數 / Like
全文搜尋
自動社群發文
```

---

# 5. 開發方向

本專案不是一次完成所有功能，而是分階段完成。

Claude Code 必須依照分階段方式開發，不得一開始就大量實作過多功能。

---

# 6. 分階段開發計畫

## Phase 0：建立專案骨架與文件

目標：

建立完整資料夾結構、文件、設定檔、模板檔，不實作完整功能。

Phase 0 要完成：

```text
README.md
CLAUDE.md
docs/
docs/checklists/
content/settings/
content/templates/
content/github/posts/
content/blogger/posts/
src/views/
src/styles/
src/js/
src/scripts/
public/
dist/
dist-blogger/
dist-promotion/
dist-reports/
```

Phase 0 不做：

```text
不實作完整 build
不建立複雜 JS
不做 Blogger 匯出
不做 GitHub 完整頁面
不做 GA4
不做 AdSense
不做 sitemap
不安裝多餘套件
不 git push
```

---

## Phase 1：GitHub 本機可預覽 MVP

目標：

讓 GitHub 站可以透過 `npm run dev` 在本機檢視。

Phase 1 要完成：

```text
Vite 基礎設定
EJS layout
SCSS token / theme
基本 Header
基本 Footer
基本首頁
文章列表頁
文章詳細頁
分類頁
標籤頁
Markdown 讀取
frontmatter 解析
draft / status 過濾
基本 Design System 頁
npm run dev
```

Phase 1 暫不做：

```text
Blogger 匯出
FB promotion
GA4
AdSense
sitemap
robots
真正搜尋
留言
View 數
讚數
```

---

## Phase 2：Design System 與共用樣式

目標：

建立兩平台共用的 Design System，使 Blogger 與 GitHub 可共用樣式邏輯。

Phase 2 要完成：

```text
Colors 頁
Spacing 頁
Typography 頁
Buttons 頁
Cards 頁
Article Components 頁
Blogger theme
GitHub theme
SCSS tokens
SCSS themes
按鈕元件
卡片元件
文章元件
CTA 區塊元件
Hashtag 元件
AdSense placeholder
Social Follow 元件
Affiliate Box 元件
Book Photo 元件
Download Box 元件
Related Posts 元件
Prev / Next 元件
Back to Top 元件
```

Design Token 需支援：

```text
主色 primary
副色 accent
文字色 text
背景色 background
連結色 link
灰階 gray
spacing
typography
radius
shadow
z-index
breakpoint
```

Spacing 單位以 `rem` 為主。

---

## Phase 3：Blogger 匯出系統

目標：

讓系統可以輸出 Blogger 可貼用 HTML 與發布輔助檔。

Phase 3 要完成：

```text
Blogger full 文章匯出
Blogger summary 摘要導流匯出
Blogger redirect-card 匯出
Blogger 首頁 / 目錄 HTML 匯出
Blogger copy-helper.txt
Blogger meta.json
Blogger publish-checklist.txt
Blogger theme CSS 匯出
Blogger tokens CSS 匯出
Blogger full style CSS 匯出
```

Blogger 輸出位置：

```text
dist-blogger/posts/{slug}/post.html
dist-blogger/posts/{slug}/copy-helper.txt
dist-blogger/posts/{slug}/meta.json
dist-blogger/posts/{slug}/publish-checklist.txt
dist-blogger/index/blogger-home.html
dist-blogger/theme/blogger-tokens.css
dist-blogger/theme/blogger-components.css
dist-blogger/theme/blogger-article.css
dist-blogger/theme/blogger-full-style.css
```

Blogger 預覽以 Blogger 平台貼上後的預覽為準。  
本專案不需要完整模擬 Blogger 平台。

---

## Phase 4：FB Promotion 匯出

目標：

每篇文章可儲存 FB 粉絲頁推廣文案，並輸出成可手動貼到 FB 的文字檔。

此內容不顯示在文章內。

frontmatter 範例：

```yaml
promotion:
  facebook:
    enabled: true
    page: "fan1"
    title: ""
    message: ""
    target: "auto"
    hashtags:
      - ""
    note: ""
```

promotion.config.json 結構：

```json
{
  "facebook": {
    "enabled": true,
    "defaultPage": "fan1",
    "pages": {
      "fan1": {
        "name": "粉絲頁 1",
        "enabled": true
      }
    },
    "utm": {
      "source": "facebook",
      "medium": "social",
      "campaignPattern": "{page}_post",
      "contentPattern": "{slug}"
    }
  }
}
```

UTM 設定集中於 promotion.config.json，文章 frontmatter 不自帶 utm。
campaignPattern 與 contentPattern 支援 `{page}` 與 `{slug}` placeholder。

輸出位置：

```text
dist-promotion/facebook/blogger/{slug}.txt
dist-promotion/facebook/github/{slug}.txt
dist-promotion/facebook/all-posts-index.txt
```

FB promotion 文案必須包含：

```text
標題
推廣文案
文章連結
UTM 參數
Hashtag
```

src/views/promotion/ 三支模板的角色：

```text
facebook-post.ejs      build-promotion 預設使用，render 完整版 FB 貼文
facebook-summary.ejs   精簡版（無標題），保留供未來在 promotion.facebook 加 mode 欄位時使用
facebook-hashtags.ejs  partial，被 post / summary include
```

---

## Phase 5：SEO / GA4 / AdSense

目標：

補上 SEO、GA4 事件追蹤與 AdSense 區塊管理。

Phase 5 要完成：

```text
meta tags
Open Graph
JSON-LD
canonical
sitemap.xml
robots.txt
GA4 script partial
GA4 event data attributes
AdSense partial
AdSense placeholder
AdSense post top
AdSense post middle
AdSense post bottom
AdSense sidebar
AdSense home inline
```

第一版不顯示 View 數、Like 數。  
文章成效以 GA4 觀察。

需要追蹤的 GA4 event：

```text
page_view
internal_link_click
tag_click
category_click
affiliate_click
download_click
social_click
blogger_to_github_click
github_to_blogger_click
```

---

## Phase 6：RWD 與前台互動

目標：

完成基本網頁互動與 RWD。

Phase 6 要完成：

```text
RWD
Sticky Header
手機版短 Header
Mobile Drawer / Overlay Menu
Back to Top
Active Nav
圖片 lazy loading
基本 accessibility
Footer 隱私權 / 聯盟揭露 / 聯絡 / 社群連結
```

Sticky Header 使用：

```html
<header class="lab-header" data-sticky-header></header>
```

捲動後加：

```html
<header class="lab-header is-scrolled"></header>
```

Back to Top：

```html
<button class="lab-back-to-top" type="button" aria-label="回到頁面上方">
  ↑
</button>
```

---

## Phase 7：發布、檢查與備份流程

目標：

補上人工發布流程、檢查清單與備份策略。

Phase 7 要完成：

```text
Blogger 發布清單
GitHub 部署清單
FB 推廣清單
圖片上傳清單
SEO 檢查清單
備份清單
build report
missing tags report
draft posts report
published URL report
```

Blogger 發布 checklist 至少包含：

```text
[ ] Blogger 標題已貼
[ ] Blogger HTML 已貼
[ ] Blogger 搜尋說明已貼
[ ] Blogger 自訂網址已設定
[ ] Blogger 標籤已設定
[ ] Blogger 預覽桌機版
[ ] Blogger 預覽手機版
[ ] 圖片可正常顯示
[ ] AdSense 區塊未破版
[ ] 發布後 URL 已回填
[ ] FB 推廣文案已複製
```

---

## Phase 8：第二階段功能，暫緩

以下功能不得在第一版主動實作：

```text
真正後台登入管理
視覺化文章編輯器
Blogger API 自動發文
Google Drive API 圖片上傳
前台 View 數
讚數 / Like
留言系統
熱門文章自動統計
全文搜尋
會員系統
資料庫後端
自動社群發文
```

未來如需 View 數、Like 或留言，必須另開第二階段規格，不得混入第一版。

---

# 7. 系統分類編號

本專案採用分類編號，方便日後指示 Claude Code 修改。

```text
A = 專案文件 / Claude 規範
B = 全站設定資料
C = 內容資料 / Markdown 文章
D = 前台頁面模板
E = Blogger 匯出系統
F = GitHub 靜態站系統
G = 設計系統頁
H = SCSS / Design Token / 元件樣式
I = JavaScript 互動功能
J = SEO / GA4 / AdSense / 追蹤
K = Promotion / FB 推廣文案
L = Build Script / 工具程式
M = 素材 / 圖片 / 原始檔管理
N = 發布 / 備份 / 檢查清單
Z = 第二階段暫緩功能
```

Claude Code 在回覆時，應盡量說明本次影響哪些分類。

例如：

```text
本次影響：
D-03 header.ejs
H-13 _header.scss
I-02 sticky-header.js
```

---

# 8. 建議資料夾結構

Claude Code 可依此自動建立資料夾。以下為 top-level outline；現況以 live `Glob` 為準（tree 為建議結構，docs/ 與 fixtures 會持續演化）。

```text
portable-blog-system/
├─ README.md  CLAUDE.md  package.json  vite.config.js  .gitignore
├─ docs/  docs/checklists/        # 規格文件與 checklists
├─ content/
│  ├─ settings/                   # 全站 JSON 設定（site / categories / tags / ads / ga4 / affiliate-networks / commerce-links / download-* / ...）
│  ├─ github/  blogger/  shared/  # posts/ + pages/（shared 含 snippets/）
│  ├─ drafts/  archive/
│  ├─ templates/                  # post / tech-note / book-review / download / summary
│  └─ validation-fixtures/        # validator fixtures（_test-*.md）
├─ src/
│  ├─ views/                      # EJS：layout / pages / blogger / design-system / seo / tracking / ads / promotion
│  ├─ styles/                     # SCSS：abstracts / base / layout / components
│  ├─ js/                         # main.js + modules/（sticky-header / mobile-drawer / back-to-top / ga4-events / link-tracker / active-nav / lazy-image / ...）
│  └─ scripts/                    # build-* / load-* / parse-markdown / validate-content / link-processor / ga4-url-builder / check-* / ...
├─ public/                        # images / icons / downloads / favicon
└─ dist/  dist-blogger/  dist-promotion/  dist-reports/
```

---

# 9. CSS 與 class 命名規則

## 9.1 共用 prefix

本專案使用共用 prefix：

```text
lab-
```

範例：

```html
<article class="lab-post-card">
  <h2 class="lab-post-card__title">文章標題</h2>
</article>
```

## 9.2 Theme class

Blogger：

```html
<body class="lab-site lab-site--blogger"></body>
```

GitHub：

```html
<body class="lab-site lab-site--github"></body>
```

Blogger 文章匯出外層：

```html
<div class="lab-blogger-article">...</div>
```

## 9.3 BEM 命名

SCSS 使用 BEM：

```scss
.lab-post-card {
}
.lab-post-card__title {
}
.lab-post-card__meta {
}
.lab-post-card--featured {
}
```

不得任意使用不清楚的 class 命名。

## 9.4 CSS / SCSS 排版原則

本專案 CSS / SCSS 排版優先使用 Flexbox。

規則：

```text
可用 Flexbox 處理的排版，一律優先使用 Flexbox。
除非有明確需求或人工確認，避免使用 CSS Grid。
多欄卡片排列優先使用 display: flex、flex-wrap、gap、flex-basis 或 width。
不主動新增 grid-template-columns 或 grid-template-rows。
若 class 名稱已存在 .lab-card-grid，可保留 class 名稱，但實作仍優先使用 Flexbox。
只有在 Flexbox 明顯無法合理處理，且經人工確認後，才可以使用 CSS Grid。
若需要使用 CSS Grid，Claude Code 必須先在計畫階段說明原因、影響範圍與替代方案，不得直接實作。
```

## 9.5 SCSS 檔案歸類原則

SCSS 應依功能集中管理。

規則：

```text
Design Token / 變數：src/styles/abstracts/
基礎樣式：src/styles/base/
版面結構：src/styles/layout/
元件樣式：src/styles/components/
```

不得把元件樣式任意寫進 EJS、HTML inline style 或 JavaScript。

---

# 10. Blogger Design Token 匯出

系統需支援將 Design Token 匯出成 Blogger 可貼用 CSS。

輸出檔：

```text
dist-blogger/theme/blogger-tokens.css
dist-blogger/theme/blogger-components.css
dist-blogger/theme/blogger-article.css
dist-blogger/theme/blogger-full-style.css
```

建議 Blogger 使用方式：

```text
Blogger 主題貼一次 blogger-full-style.css
之後文章只貼 HTML
```

Blogger 文章 HTML 需包：

```html
<div class="lab-blogger-article">...</div>
```

避免污染 Blogger 原有主題。

---

# 11. 文章類型

`contentKind` 欄位放在 `.md` frontmatter，描述「這是什麼樣的內容」。列舉值至少支援：

```text
post：一般文章
tech-note：技術筆記
book-review：書評文章
download：教具下載文章
comic：四格漫畫，第二階段可加強
life-note：生活文章，第二階段可加強
page：固定頁（About / 工具目錄 / 下載索引頁等）
```

`contentKind` 與 Blogger 平台之 `blogger.type`（`post` / `page`，放在 `.publish.json`）為獨立兩維度，不可混用、不可相互推導。

See also:
- `docs/publish-bundle.md` §2.4（`contentKind` 與 `blogger.type` 分離原則）
- `docs/migration-from-frontmatter.md` §3（既有 `type` 欄位之 `contentKind` 對應與遷移範例）

---

# 12. 書評文章規則

書評文章需支援：

```yaml
book:
  title: ""
  originalTitle: ""
  author: ""
  publisher: ""
  isbn: ""
  coverImage: ""
  coverAlt: ""
  showBookPhoto: true

affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。"
  position:
    top: true
    bottom: true
  links:
    - label: "博客來"
      network: "通路王"
      url: ""
    - label: "聯盟網"
      network: "聯盟網"
      url: ""
```

規則：

1. 若沒有書本照片，不輸出空白書本照片區塊。
2. 若沒有 affiliate links，不輸出空白販售區塊。
3. 若 `affiliate.enabled: true` 但 links 為空，build 時應警告。
4. 聯盟連結需自動套用 `sponsored nofollow noopener noreferrer`。
5. 聯盟連結需加 GA4 event data attributes。

See also:
- `docs/book-schema.md`（書籍 / 雜誌 / 來源實體 metadata 完整規格；含 `book.mediaType` / `book.titleEn` / `book.volume` / `book.issue` / `book.authors[]` / `book.publishedYear` 等 additive 欄位字典與 fallback chain）
- `docs/phase-9f-c-completion-report.md`（Phase 9-f-c **子系列**收尾紀錄：Blogger manual posting helper —— copy-helper [12] book metadata 區塊 + publish-checklist book-review / magazine 內容檢查區塊；含 4 commits + 2 純分析；⚠️ 註：本**子系列**收尾**不等於** Phase 9-f 整體收尾 —— Phase 9-f-e / 9-f-f / 9-f-g 仍未啟動，Phase 9 overall 仍 🔄 進行中）
- `docs/20260610-blogger-dual-block-content-model-preanalysis.md`（Blogger 上下雙 commerce block content-model 設計 preanalysis；建議 **Option B** `affiliate.blocks[]`，**設計完成 / 實作未開始**）。**🔴 binding 約束（pm-6 surface decision，§3.1）：dual-block intent = Blogger-only（暫定）；實作 dual-block 時 GitHub Pages 必須維持已 live-accepted 之單區塊 / legacy 輸出 byte-identical，per-block surface gating 為 MUST；遷移 we-media-myself2 至 `blocks[]` 不得改變 GitHub Pages 輸出；未來 GitHub Pages 雙區塊須另開 phase + 獨立 acceptance。GitHub Pages affiliate = **deferred（暫放，非 rejected）**。**）
- `docs/20260610-affiliate-blocks-frontmatter-convention.md`（Option B `affiliate.blocks[]` frontmatter YAML convention **lock，實作未開始**：lowerCamelCase + `surfaces`（複數，允許 `blogger`/`pages`；`pages` 已保留但本階段 GitHub renderer dormant）+ per-block `id`/`enabled`/`position`(top|bottom)/`heading`/`disclosure`/`links[]`(沿用 ref)/`tracking`(dormant)。**🔴 precedence：Blogger 有 `blocks[]` 用 blocks、GitHub 一律 legacy；當前階段遷移須同時保留 legacy `links[]`+`position` 以保證 GitHub 輸出 byte-identical（不可只留 blocks）。** 未來 validator 重用 commerce-ref C1–C9 掃 `blocks[].links[].ref`、warning-only-first；未來 GitHub `pages` surface 須另開 phase + acceptance。）

---

# 13. 下載文章規則

教具下載文章需支援：

```yaml
download:
  enabled: true
  title: ""
  description: ""
  fileUrl: ""
  fileType: "PDF"
  licenseNote: "本素材僅供個人、家庭與教學使用，請勿轉售或大量散布。"
```

若 `download.enabled: true` 但沒有 `fileUrl`，build 時應警告。

---

# 14. 標籤管理規則

標籤需集中管理於：

```text
content/settings/tags.json
```

文章 frontmatter 中的 `tags` 必須使用已存在的 tag id 或 slug。

build 時需檢查：

```text
文章使用不存在的 tag
tag 沒有 name
tag 沒有 slug
tag 沒有 site
```

文章底部需自動產生 Hashtag 區塊。

GitHub 站需產生標籤頁。  
Blogger 匯出需產生可貼到 Blogger 標籤欄位的文字。

---

# 15. 分類管理規則

分類需集中管理於：

```text
content/settings/categories.json
```

文章 frontmatter 中的 `category` 必須存在於 categories.json。

GitHub 站需產生分類頁。  
Blogger 匯出需產生分類資訊與目錄輔助。

---

# 16. 連結處理規則

系統需有 link processor。

## 16.1 外部連結

一般外部連結需自動加：

```html
target="_blank" rel="nofollow noopener noreferrer"
```

## 16.2 聯盟連結

聯盟或贊助連結需自動加：

```html
target="_blank" rel="sponsored nofollow noopener noreferrer"
```

## 16.3 站內連結

站內連結不得加 nofollow。  
站內連結預設不加 UTM，避免污染 GA4 來源。  
站內連結使用 GA4 click event 追蹤。

## 16.4 Blogger ↔ GitHub 互導

Blogger 與 GitHub 互導視為自家跨站導流，會自動加 UTM 與 target / rel 控制。第一版**已實作 GitHub Pages → Blogger 方向之自動處理**（per Phase related-links-ga4-audit；production live）；Blogger → GitHub Pages 反向之 **source 已於 pm-24a/b/c 落地（commits `7e1d356` / `e2309e9` / `7c769fe`；2026-05-23）**，但**尚未 deploy / 尚未重貼 Blogger 後台**；live 狀態為 dormant，待 pm-26 階段 user 手動重貼 Blogger + GA4 Realtime 驗收後始進入 production。

### GitHub Pages → Blogger（已實作）

套用範圍：GitHub Pages 文章頁之 `relatedLinks` / `otherLinks` 中之 Blogger cross-link。

判斷依據：URL hostname 等於 `settings.site.bloggerSiteUrl` 之 host → 視為 Blogger cross-link；**不**依賴 frontmatter 之 `kind` 欄位（即使 `kind: internal` 亦同樣套用）。

正式 UTM 規則：

```text
utm_source=github_pages
utm_medium=referral
utm_campaign=portable_blog_system
utm_content=related_links     ← relatedLinks aside 內之連結
utm_content=other_links       ← otherLinks aside 內之連結
```

target / rel 自動處理：

- 強制 `target="_blank"`（開新分頁）
- 合併 `rel="nofollow noopener noreferrer"`；保留既有 token（如作者 explicit `sponsored`），不重複

策略 A（已含 UTM 之 url 處理）：若原 URL 已含**任一** `utm_source` / `utm_medium` / `utm_campaign` / `utm_content`，視為作者手動指定 → 系統**不覆蓋**、**不重複注入** UTM；但仍套 `target="_blank"` + `rel` 合併。

未受影響範圍：

- ❌ GitHub Pages 同站內部連結 → 不加 UTM
- ❌ 第三方非 Blogger external links → 不加 GitHub→Blogger UTM；仍按 §16.1 預設 `target="_blank" rel="nofollow noopener noreferrer"` 處理
- ❌ Blogger templates 與 `dist-blogger/` 輸出 → 完全不變

實作位置：`src/scripts/ga4-url-builder.js`（`isBloggerCrossLink` / `mergeRel` / `applyCrossSiteUtm`）+ `src/scripts/build-github.js`（`deriveRenderedCrossLinks` 於 post-detail render 前套用）+ `src/views/pages/post-detail.ejs`（render 端讀 `relatedLinksRendered` / `otherLinksRendered` 並使用 `item.target` / `item.rel`）。

### Blogger → GitHub Pages（source landed；un-deployed；live but dormant）

狀態（2026-05-23）：**source landed but un-deployed；live 狀態 dormant；pm-26 deploy gate BLOCKED**。

- ✅ source 已 push origin/main：pm-24a `7e1d356`（`ga4-url-builder.js`：`isGithubCrossLink` + `applyCrossSiteUtm` `direction` 參數，default `'to_blogger'` 保 backward compat）、pm-24b `e2309e9`（`build-blogger.js`：`deriveRenderedCrossLinks`，`direction:'to_github'`）、pm-24c `7c769fe`（`blogger-post-full.ejs`：讀 `relatedLinksRendered` / `otherLinksRendered`，fallback raw）
- ✅ build verify（pm-24d）：`dist-blogger/` ready posts byte-identical-modulo-builtAt；無 GitHub cross-link 之 post 無新 UTM
- ❌ 尚未 deploy；尚未碰 gh-pages；Blogger 後台尚未重貼
- ⏭ pm-26 deploy verify 階段才啟動 user 手動重貼 Blogger + GA4 Realtime 驗收；啟動條件見 `docs/reverse-utm-fixture-plan.md` §6

套用範圍：Blogger 文章頁（`bloggerMode:'full'`，`renderFullPost` 為唯一 caller）之 `relatedLinks` / `otherLinks` 中之 GitHub cross-link（hostname = `settings.site.githubSiteUrl` host；不依賴 `kind`）。

UTM / target / rel 規則 mirror 上方 GitHub→Blogger 方向，差異僅 `utm_source=blogger`（`utm_medium=referral` / `utm_campaign=portable_blog_system` / `utm_content=related_links`|`other_links`；策略 A 已含 UTM 不覆蓋；強制 `target="_blank"` + 合併 `rel="nofollow noopener noreferrer"`，保留既有 token）。

不受影響：Blogger 同站內部連結、第三方非 GitHub external（按 §16.1）、Blogger summary / redirect-card / home-index / category-index 模式、`buildBloggerToGithubUrl` / canonical / JSON-LD / summary CTA / redirect CTA / index CTA。

實作位置：`src/scripts/ga4-url-builder.js`（`isGithubCrossLink` / `applyCrossSiteUtm` `direction='to_github'`）+ `src/scripts/build-blogger.js`（`deriveRenderedCrossLinks`）+ `src/views/blogger/blogger-post-full.ejs`。

## 16.5 relatedLinks / otherLinks 連結處理

文章 frontmatter 之 `relatedLinks` / `otherLinks` 屬作者手動指定之兩個連結分區（與 §17 之 Related Posts 自動推薦區塊為兩套獨立機制；不互相 fallback）。

連結處理規則：

```text
kind: internal  → 不加 nofollow；不加 UTM；同分頁開啟（沿用 §16.3）
kind: external  → 自動套 target="_blank" rel="nofollow noopener"（沿用 §16.1）
```

作者**不需手填** `target` / `rel`；由 build / render 階段依 `kind` 自動套。

internal link 之 `url` 應使用**已發布後回填**之真實 URL（對 Blogger 文章為 `blogger.publishedUrl`，per §24）；不可預測 Blogger URL（per `docs/publish-json-schema.md` §5.3）。

`[Youtube]` / `[台北市立圖書館]` 等顯示前綴應拆入 `platform` 欄位，**不**併入 `title`。

完整欄位字典詳見 `docs/related-links-schema.md`。

---

# 17. 文章頁基本版型

文章詳細頁需支援：

```text
Header
Nav
Mobile Drawer
Breadcrumb
Article Header
Article Body
Optional Ads
Optional TOC
Optional Book Photo
Optional Affiliate Box
Optional Download Box
Post CTA
Hashtag
Social Follow
Related Posts
Previous / Next
Back to List
Sidebar
Footer
Back to Top
```

Article Header 至少包含：

```text
分類
標題
英文標題
發布日期
更新日期
作者
摘要
封面圖，可選
```

Sidebar 大版在右側，小版移到文章下方。

Optional block 沒有資料時，不得輸出空白區塊。

---

# 18. 首頁 / 目錄頁規則

Blogger 與 GitHub 都需要首頁 / 目錄頁。

首頁需支援：

```text
Header
Hero / 網站簡介
分類入口
最新文章卡片列表
推薦文章卡片列表，可選
AdSense 區塊
標籤區，可選
社群回導
Footer
```

文章列表使用卡片形式。

首頁可穿插 AdSense 區塊。

---

# 19. Design System 頁規則

第一版需建立：

```text
G-01 Design System 首頁
G-02 Colors
G-03 Spacing
G-04 Typography
G-05 Buttons
G-06 Cards
G-07 Article Components
```

Buttons 至少包含：

```text
Primary
Secondary
Outline
Text
Disabled
```

Cards 至少包含：

```text
一般文章卡片
技術文章卡片
書評卡片
教具下載卡片
側邊欄卡片
推廣卡片
```

Article Components 至少展示：

```text
Hashtag
Post CTA
AdSense placeholder
Social Follow
Affiliate Box
Book Photo
Download Box
Related Posts
Prev / Next
Back to Top
```

---

# 20. JavaScript 互動功能

第一版需支援：

```text
sticky-header.js
mobile-drawer.js
back-to-top.js
ga4-events.js
link-tracker.js
active-nav.js
lazy-image.js
```

第二階段再支援：

```text
search.js
toc.js
copy-code.js
```

---

# 21. SEO 規則

GitHub 站需支援：

```text
title
description
canonical
Open Graph
JSON-LD
sitemap.xml
robots.txt
```

Blogger 匯出需支援：

```text
文章標題
英文標題
搜尋說明
自訂網址 slug
標籤
Blogger metadata
copy-helper
```

若同一內容會輸出到 Blogger 與 GitHub，必須有 `primaryPlatform` 與 `canonical`。

---

# 22. 圖片與素材管理

圖片不由系統自動上傳。

圖片可手動上傳至：

```text
Blogger
Google Drive
其他外部圖床
未來 CDN
```

文章需能記錄：

```yaml
images:
  - id: "cover"
    type: "cover"
    source: "google-drive"
    url: ""
    originalFile: ""
    alt: ""
    caption: ""
```

大型原始檔例如：

```text
PSD
CLIP
AI
原始 JPG
原始 PNG
```

不建議放 public repo。

可放於專案外，例如：

```text
D:/BlogAssets/
```

文章 frontmatter 可記錄：

```yaml
sourceAssets:
  folder: "D:/BlogAssets/blogger/book-review/2026-05-04-atomic-habits/"
```

---

# 23. 發布狀態規則

文章需支援：

```text
draft
ready
published
archived
```

建議：

```yaml
status: "draft"
draft: true
```

規則：

```text
draft：不輸出
ready：可輸出到 preview 或測試
published：正式輸出
archived：可選擇不出現在列表
```

任何 draft 文章不得出現在正式 dist。

---

# 24. Blogger 發布 URL 回填

Blogger 文章發布後，應可回填正式 URL。

```yaml
blogger:
  status: "published"
  publishedUrl: ""
  bloggerPostId: ""
  publishedAt: ""
```

用途：

```text
FB 推廣文案使用正式 URL
canonical 使用正式 URL
未來搬家時保留對應
站內互連時可引用
```

See also:
- `docs/publish-json-schema.md` §5.3（Blogger URL 規則，含 post yyyy/mm 與 page URL 分支）
- `docs/publish-json-schema.md` §5.6（`blogger.type`）

---

# 25. 備份與搬家規則

本專案需維持可搬家性。

備份建議：

```text
Git：程式碼、Markdown、JSON、文件
外部硬碟：圖片原始檔、PSD、CLIP、AI
雲端硬碟：重要素材備份
Blogger：已發布文章平台副本
GitHub Pages：靜態站發布結果
```

不得讓唯一資料只存在 Blogger 後台。

---

# 26. package.json 指令

第一版建議提供：

```bash
npm run dev
npm run build
npm run build:github
npm run build:blogger
npm run build:promotion
npm run build:sitemap
npm run build:blogger-theme
npm run preview
```

規則：

```text
npm run dev
```

必須能本機檢視 GitHub 靜態站與 Design System 頁。

Blogger 預覽以 Blogger 平台貼上後的預覽為準。

---

# 27. Claude Code 修改規則

Claude Code 每次修改前，應先說明：

```text
1. 本次修改目標
2. 會影響哪些分類編號
3. 不會修改哪些部分
4. 預計新增或修改的檔案
```

Claude Code 修改後，應回報：

```text
1. 已新增檔案
2. 已修改檔案
3. 可執行指令
4. 是否需要使用者手動檢查 Blogger 或 GitHub 預覽
```

不得未經要求自動：

```text
git push
刪除大量檔案
重構整個專案
改變技術選型
加入 React / Vue / Tailwind
加入後端資料庫
加入登入後台
加入 Blogger API
加入 Google Drive API
```

---

# 28. 第一版 MVP 必做清單

第一版必做：

```text
1. 建立專案資料夾結構
2. 建立 README.md
3. 建立 CLAUDE.md
4. 建立 docs 文件
5. 建立 settings JSON
6. 建立 Markdown 範例文章
7. 建立 GitHub 首頁、列表、文章頁、分類頁、標籤頁
8. 建立 Blogger full / summary 匯出
9. 建立 Blogger copy-helper 與 checklist
10. 建立 Blogger design token CSS 匯出
11. 建立 FB promotion txt 匯出
12. 建立 Design System 基礎頁
13. 建立 SCSS tokens / themes / components
14. 建立 Sticky Header、Mobile Drawer、Back to Top
15. 建立 link processor
16. 建立 GA4 event data attributes
17. 建立 sitemap.xml、robots.txt
```

---

# 29. 第一版不做清單

第一版不得主動實作：

```text
真正後台登入管理
視覺化文章編輯器
Blogger API 自動發文
Google Drive API 圖片上傳
前台 View 數
讚數 / Like
留言系統
熱門文章自動統計
全文搜尋
會員系統
資料庫後端
自動社群發文
```

---

# 30. 專案最終樣貌

本專案完成第一版後，應該是一個：

```text
本機可管理文章
可本機預覽 GitHub 靜態站
可 build GitHub Pages
可匯出 Blogger 文章 HTML
可匯出 Blogger 摘要導流文
可匯出 Blogger 可貼用 CSS token
可匯出 FB 粉絲頁推廣文案
可管理分類與標籤
可管理 AdSense 版位
可追蹤 GA4 點擊事件
可長期備份
可搬家到其他平台
```

核心價值：

```text
可搬家
可備份
可擴充
可導流
可維護
不過度工程化
```

Claude Code 不得為了方便而破壞以上方向。
