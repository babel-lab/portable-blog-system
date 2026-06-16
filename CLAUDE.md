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

### GA4 article bottom nav P1（report-verified；idle freeze 解除）

**GA4 P1 report verification PASSED（20260615-pm-1，docs-only `docs/20260615-ga4-article-bottom-nav-p1-report-verified-resume-blog-build.md`；baseline HEAD `95430d1`）**：使用者於 **20260615 17:35** 於 GA4 後台出資料並人工肉眼確認 —— Exploration（`BLOG｜文章底部導覽點擊率…`，日期 6/14–2026/6/15，property surface `https://babel-lab.blogspot.com/` GA4）中 **`event_name = click_other_link` + `click_area = article_bottom_nav`** 之 P1 自訂維度 / event parameters / `article_bottom_nav` click reporting 已可被查詢：維度 **Click Area / Nav Direction / Source Post Slug / Target Slug / 事件名稱** 皆可見；**Nav Direction `next` / `previous` / `home` 三方向皆已出資料**；Source→Target slug 已見有效樣本（如 `github-pages-blog-planning`↔`we-media-myself2`、`portable-blog-system-mvp`→`home` 等）→ source/target slug 可用於文章上下篇與首頁導覽分析。**結論：GA4 P1 wait blocker resolved**，先前「等待 GA4 報表資料」之 **idle freeze / pause 已解除**，可恢復 BLOG 系統建置。**後續報表分析紅線**：篩文章底部導覽須 `event_name = click_other_link` **加** `click_area = article_bottom_nav` 兩條件，**不可單看 `click_other_link`**（會混入 otherLinks aside 等點擊）；跨平台再用 `surface` 拆 github_pages / blogger。**Non-actions**：未實作 ADMIN / 未改前台 / 未改 GA4 設定程式碼 / src / content / templates·views / dist / package.json·lockfile / Blogger 已輸出 post HTML；未 build / deploy / 產文 / 重貼 Blogger / 開 GA4·Blogger 後台操作（僅記錄使用者提供結果）；未壓縮·重排 CLAUDE.md。唯一 mutation = 該 record doc + 本 ledger 極小 sync。**下一階段（不在本 phase 實作）** = 回到 **BLOG ADMIN 管理後台完整化**：由「管理總覽頁雛形」升級為可管理文章 / 分類 / 標籤 / slug·permalink / Blogger·GitHub Pages surface / GA4·AdSense·commerce 狀態之系統（須另開 phase + preanalysis）。承續 am-9（`docs/20260615-ga4-p1-custom-dimensions-registration-record.md`）之 PENDING Explore 資料缺口已補齊。

**BLOG ADMIN IA / current-state preanalysis landed（20260615-pm-2，docs-only `docs/20260615-blog-admin-ia-current-state-preanalysis.md`；baseline HEAD `efdc6f5`）**：GA4 P1 blocker 解除後恢復 BLOG 建置之第一個規劃 phase。只讀盤點 ADMIN 現況：**已有可操作之 read-only dashboard**（`src/views/admin/index.ejs` 1385 行 + `src/scripts/load-admin-posts.js`，由 `build-github.js` L803–825 **dev-mode-only** render 至 `.cache/pages/admin/index.html`，Vite dev serve 於 `/admin/`；**prod build 不產出 / 不進 dist / 不 deploy / noindex**）—— 非純靜態雛形，已含 14+ 統計卡 / search·filter·sort / per-post detail（Identity·Platform Routing·Dates·SEO·Blogger·GitHub·FB）/ commerce read-only preview + YAML snippet helper / SEO·FB dry-run editor（**全程無寫入**）。寫入路徑基建（`admin-write-cli.js` 等）**存在但 dormant / gated（CLI-only，未接 browser）**。文件提出：§C 14 個 ADMIN 頁面需求分析、§D **read-only 優先策略**（避免誤改 content/settings + 多條治理線風險）、§E 三階段可寫邊界（read-only → copy-helper/dry-run → gated CLI write；browser 直寫暫不建議）、§F per-post 資料模型（多數識別/surface/commerce 欄位 loader 已備；缺口 = GA4·AdSense readiness / nav 狀態 / validation 計數 / last-checked，皆可 read-only derive）、§H 8 步分階段建議（下一步 = read-only dashboard route/file map）。**Non-actions**：未實作 ADMIN / 未改 src·content·settings·templates·views·dist·package·lockfile / 未 build·deploy / 未產文·重貼 Blogger / 未改 GA4·AdSense·commerce 規則 / 未壓縮·重排 CLAUDE.md。唯一 mutation = 該 preanalysis doc + 本 ledger 極小 sync。

**ADMIN suggested-fix L2 read-only UI landed（20260616-am-1 `docs/20260616-admin-suggested-fix-l2-readonly-ui-implementation-record.md`；baseline HEAD `c0a4794`）**：承接 ADMIN suggested-fix 系列（切片 1 docs cross-link `feeb224` / 切片 2 loader `post.governanceSignals.*` derive `f285f09`+`c0a4794`，皆 human-accepted），把 loader 已 derive 之 **per-post governance signals 接到 ADMIN UI**（仍 100% read-only）。**唯一 source 變更 = `src/views/admin/index.ejs`（+58/−1）**：(1) additive `.b-warn` 黃色 badge class（同 `totals-pill.warn` 色票；刻意不用紅色 `b-missing` → 不暗示 build block / error）；(2) Posts index **既有** readiness cell 內加 per-post governance badge（`signalSum>0 → b-warn「gov: N」`；`=0 → b-ok「gov ✓」`；**不**新增欄、**不**改 `colspan="7"`、**不**碰 search/filter/sort JS）；(3) detail panel additive「Governance signals」section（unknown tag / unknown category / cross-site mismatch tag / cross-site mismatch category 四訊號 + signalSum 摘要 + empty-state 正向「✓ 皆已對齊」+ anti-write 一句話「Admin 不自動修；請手改 frontmatter/tags.json/categories.json 後 `npm run validate:content`」+ 治理 docs cross-link + source/validator 範圍差異說明）。**顯示哲學對齊 preanalysis**：只用 warn 一級 severity；只列計數/flag，**無 per-post prescription**（「應改為 X」規則引擎）；**無** form/button/input/select/textarea/fetch/onclick；未擴 loader 為 write field。acceptance：`validate:content` **0/94/84 不變**；dev build（`--mode=dev`）render `.cache/pages/admin/index.html` 無 EJS error，11 個 detail panel 各 1 section、Posts index 10 篇「gov ✓」+ 1 篇「gov: 1」（唯一 signal post = `phonics-practice-sheet-download`：sourceSite=blogger、tag `download` 未在 tags.json → unknownTagCount=1，真實且正確之治理訊號）；`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check-commerce-affiliate-resolver` 23/0 carry；`check:blogger-adsense-output` 85/0 by construction 不受影響（admin EJS dev-only，不在 build:blogger 路徑）。**Non-actions**：未改任何 frontmatter / content markdown / tags.json / categories.json / validator / loader / build-github.js / build output / dist；未啟用 admin write / Apply / Save / auto-fix；未 build prod / deploy / push gh-pages / 重貼 Blogger；未動 GA4·AdSense·commerce 後台；未 `npm install` / 未動 package·lockfile；未壓縮·重排 CLAUDE.md。下一階段缺口（未做，各須獨立 phase）：Posts index filter chip（須改 filter JS）/ 獨立 governance column（須改 colspan+thead+JS）/ 全站分類治理彙總卡 / 切片 5 empty-state 文字審稿 / validator per-post aggregation。**Recommended next phase** = human-acceptance（人眼於 `/admin/` 展開 `phonics-practice-sheet-download` 目視確認）；或切片 5 / validator aggregation preanalysis（並行不衝突）。

**ADMIN suggested-fix L2 read-only UI human acceptance PASS（20260616-am-2，docs-only `docs/20260616-admin-suggested-fix-l2-readonly-ui-human-acceptance-record.md`；baseline HEAD `a46fff6`）**：承接 am-1 read-only UI 落地，記錄 human acceptance。使用者於 dev mode 目視檢查 `/admin/` + 整頁截圖：(1) `/admin/` 正常載入；(2) Dashboard / 分類治理 / Posts index / Governance signals / Suggested Fix / Settings 區塊正常顯示；(3) Posts index governance badge 可見、未見破版；(4) 資訊密度高但屬 ADMIN dev page 可接受範圍；(5) 未見 Apply / Save / Auto-fix / Write / Mutate 按鈕或寫入暗示；(6) 整體無明顯問題；(7) ChatGPT 截圖輔助亦未見明顯 UI 問題（截圖寬度較低，**不**做逐字文案驗證）→ **Verdict PASS（human-accepted）**。**Caveats**：manual visual acceptance（非 automated UI snapshot / DOM assertion）；截圖寬度較低未逐字比對 empty-state / anti-write / docs cross-link 文字（逐字審稿留切片 5）；未逐 post 重核 badge 數值（沿用 am-1 source-derived 結果）。**Non-actions**：本階段 docs-only —— 未改 src / views / scripts / content / settings / tags.json / categories.json / 任何 frontmatter·markdown；未新增 Apply / Save / Auto-fix / Write / Mutate；未 `npm install` / 未動 package·lockfile；未 build / deploy / push gh-pages / 重貼 Blogger；未動 GA4·AdSense·commerce 後台；未 amend / rebase / reset / force push / unrelated cleanup；未重跑 validate / check（acceptance 僅記錄人眼結果，am-1 已含 validation results + baseline git 已確認）；未壓縮·重排 CLAUDE.md。唯一 mutation = 該 acceptance record doc + 本 ledger 極小 sync。**Recommended next phase** = `20260616-admin-governance-summary-card-preanalysis-docs-only-a`（全站 per-post 治理彙總卡 preanalysis，須先確認與 registry totals pills 不重複統計之價值）；或 `20260616-admin-validator-per-post-aggregation-preanalysis-docs-only-a`；並行不衝突 = 切片 5 empty-state 文字審稿。紅線：filter chip / 獨立 governance 欄 / write path / per-post prescription 一律須獨立 phase + user explicit approval。

**ADMIN governance summary card preanalysis landed（20260616-am-3，docs-only `docs/20260616-admin-governance-summary-card-preanalysis.md`；baseline HEAD `f403dca`）**：執行上條推薦之全站治理彙總卡價值確認（implementation record §H.3 缺口）。**核心結論**：(1) 資料充足——summary card 所需數值全可由現成 `posts[].governanceSignals`（loader am-5 已 derive 五欄位）view 端 reduce 得到，**不需改 loader**（in-view reduce 已是既有 pattern：`index.ejs` L251/L306 `posts.forEach`、L1442 `catMismatchCategoryCount`、L1450 `tagMismatchTagCount`）；(2) **重複統計風險釐清**——「posts with unknown tag/category」之 post-level 分項與既有 `tagUsage.totals.postWithUnknownTagCount` / `categoryUsage.totals.unknownCategoryPosts` 概念同源；但「統一 per-post rollup（N 篇有 ≥1 訊號 / Σ signalSum）」+「cross-site mismatch 之 post-level 視角」（既有 `catMismatchCategoryCount` / `tagMismatchTagCount` 為 registry-key-level）= **net-new，任何地方都沒有** → 卡片**應以統一 rollup 為主軸**，重疊分項從簡或明示同源；(3) **位置推薦 Option B**（Categories & Tags section 前方，與既有治理明細 / totals-pill 同處一節 → 降低重複統計困惑、不動 Dashboard 密度、不動 Posts index 操作區；Option A Dashboard 第 7 卡 / C Posts index 前 / D 獨立 section 各列優缺點）；(4) 對 search/filter/sort **零影響**（靜態 aggregate 顯示，不碰 Posts index JS；filter chip 連動屬獨立高風險 phase）；(5) UI 紅線：read-only only、無 form/button/input/fetch/onclick、無 per-post prescription、warn 一級不暗示 build blocker、empty-state 不過度承諾、明示 source 與不取代 validator。**Non-actions**：docs-only —— 未改 src / views / scripts / loader / validator / content / settings / tags.json / categories.json / 任何 frontmatter·markdown；未新增 Apply/Save/Auto-fix/Write/Mutate；未 npm install / build / deploy / Blogger repost；未 amend/rebase/reset/force push / unrelated cleanup。唯一 mutation = 該 preanalysis doc + 本 ledger 極小 sync。acceptance：`validate:content` 0/94/84 carry（未重跑，docs-only）。**Recommended next phase** = `20260616-admin-governance-summary-card-implementation-a`（改 `index.ejs` 單檔 view 端 reduce，Option B，主軸三指標 + post-level mismatch；NOT docs-only，須 user explicit approval）→ 後 `…-human-acceptance-docs-only-a`；或 `20260616-admin-validator-per-post-aggregation-preanalysis-docs-only-a` / 切片 5 empty-state 文字審稿（並行不衝突）。紅線：write path / per-post prescription / filter chip / loader 聚合搬遷一律獨立 phase + approval。

**ADMIN governance summary card implementation landed（20260616-am-4 `docs/20260616-admin-governance-summary-card-implementation-record.md`；baseline HEAD `39fd2f1`）**：執行 am-3 preanalysis 推薦之 Option B，新增 read-only governance summary card。**唯一 source 變更 = `src/views/admin/index.ejs`（+62/−0）**：(1) Categories & Tags section locals block 內新增 view 端 reduce over `posts[].governanceSignals`（沿用既有 `posts.forEach` 聚合慣例 L251/L306/L1442/L1450）→ `govPostsTotal` / `govPostsWithSignals` / `govSignalTotal` / `govPostsUnknownTag` / `govPostsUnknownCategory` / `govPostsMismatchTag` / `govPostsMismatchCategory`；**未改 loader、未新增 summary object**；(2) summary card 插於該 section governance aside 之後、registry surface-grid 之前 —— `.surface-card` 含標題「內容治理摘要 / Governance summary」+ lede（post-level rollup vs 下方 key-level totals 維度互補、逐篇明細以 Posts index badge/detail panel 為準）+ `.cat-totals-row` totals-pill（篇數檢視中性 / 篇有訊號 `>0 warn` / 訊號總數 `>0 warn` / cross-site mismatch · tag / · category 皆 post-level）+ same-source 註（unknown tag/category 與 `postWithUnknownTagCount`/`unknown category` totals 同源，避免誤判新問題）/ healthy empty-state（不過度承諾）+ anti-write·non-blocker footer；**零新 CSS class**（沿用 `.surface-card`/`.cat-totals-row`/`.totals-pill(.warn)`/`.section-tag`/`.surface-note`）。**read-only only**：無 form/button/input/select/textarea/fetch/onclick；無 per-post prescription；warn 一級不暗示 build blocker。acceptance：`validate:content` **0/94/84 不變**；dev admin render 11 posts 無 EJS error；渲染卡片數值 = 11 篇檢視 / 1 篇有訊號 / 訊號總數 1 / mismatch tag·category 皆 0 / 1 篇 unknown tag（= `phonics-practice-sheet-download`，與 L2 human-accepted 一致）；`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check-commerce-affiliate-resolver` 23/0 carry；`check:blogger-adsense-output` 85/0 by construction 不受影響（admin EJS dev-only）；安全 grep（排除註解列舉行）0 個實際 write 元素 / handler，渲染卡片區 write-element count = 0。**Non-actions**：未改 loader / validator / admin search·filter·sort JS / Posts index table 結構 / content / settings / tags.json / categories.json / 任何 frontmatter·markdown；未新增 Apply/Save/Auto-fix/Write/Mutate；未 `npm install` / 未動 package·lockfile；未 production build / deploy / push gh-pages / 重貼 Blogger；未動 GA4·AdSense·commerce 後台；未壓縮·重排 CLAUDE.md。下一階段缺口（各須獨立 phase）：切片 5 逐字文案審稿 / Dashboard 極簡 governance pill / governance filter chip 跳轉篩選 / loader 聚合搬遷 / validator per-post aggregation。**Recommended next phase** = `20260616-admin-governance-summary-card-human-acceptance-docs-only-a`（人眼於 `/admin/` Categories & Tags 開頭目視確認）；並行不衝突 = 切片 5 / validator aggregation preanalysis。紅線：Dashboard pill / filter chip / 跳轉篩選 / loader 搬遷 / write path / per-post prescription 一律獨立 phase + approval。

**ADMIN governance summary card human acceptance PASS（20260616-pm-1，docs-only `docs/20260616-admin-governance-summary-card-human-acceptance-record.md`；baseline HEAD `63ffbf3`）**：承接 am-4 implementation 落地，記錄 human acceptance。使用者於 dev mode 手動目視 `/admin/#categories`：(1) 頁面正常載入；(2) governance summary card 出現在 Categories & Tags section 開頭附近（governance aside 後、registry surface-grid 前，符合 Option B）；(3) card 標題「內容治理摘要 / Governance summary」+「read-only · derived」標示；(4) 數值符合 am-4 預期 = 11 篇文章檢視（含 draft）/ 1 篇有治理訊號 / 1 治理訊號總數 / 0 篇 cross-site mismatch · tag / 0 篇 · category / 1 篇 unknown tag / 0 篇 unknown category；(5) `Unknown tag usage` 區塊顯示 `download unknown` 對應 `phonics-practice-sheet-download`，與 implementation record 一致；(6) 未見明顯破版；(7) 未見 Apply/Save/Auto-fix/Write/Mutate 按鈕或寫入暗示；(8) 文案標示 read-only 且說明 governance signals 為人眼提示·非 build blocker；(9) 無明顯重複統計困惑，summary card（post-level rollup）與下方 per-category/per-tag usage 明細（key-level totals）可互相對照 → **Verdict PASS（human-accepted）**。**Caveats**：manual visual acceptance（非 automated UI snapshot / DOM assertion）；數值正確性以 am-4 source-derived 結果為準，本 acceptance 確認顯示一致·無破版·無寫入誤導，未逐 post/逐欄獨立重算。**Non-actions**：docs-only —— 未改 src / views / admin index.ejs / loader / validator / scripts / content / settings / tags.json / categories.json / 任何 frontmatter·markdown；未新增 Apply/Save/Auto-fix/Write/Mutate；未 `npm install` / 未動 package·lockfile；未 build / deploy / push gh-pages / 重貼 Blogger；未動 GA4·AdSense·commerce 後台；未 amend/rebase/reset/force push；未重跑 validate/check（acceptance 僅記錄人眼結果，am-4 已含 validation results + baseline git 已確認）；未壓縮·重排 CLAUDE.md。唯一 mutation = 該 acceptance record doc + 本 ledger 極小 sync。**Recommended next phase** = `20260616-admin-validator-per-post-aggregation-preanalysis-docs-only-a`（per-post validator warning count aggregation preanalysis，docs-only）；並行不衝突 = 切片 5 empty-state 文字審稿。紅線：Dashboard pill / filter chip / 跳轉篩選 / loader 搬遷 / write path / per-post prescription 一律獨立 phase + approval。

**ADMIN validator per-post aggregation preanalysis landed（20260616-pm-2，docs-only `docs/20260616-admin-validator-per-post-aggregation-preanalysis.md`；baseline HEAD `2671584`）**：規劃 ADMIN 未來如何安全把 `validate:content` warning 彙總到 per-post detail panel / badge（只 preanalysis，不實作）。**核心盤點**：(1) validator issue shape = `{severity,type,sourcePath,value,site?}`，~110 rule-type 分三層（post-level frontmatter/taxonomy/related-links/commerce-ref/affiliate-blocks/adsense-blocks/download/book/series/promotion-fb；settings-level commerce-link/ads/download-registry；cross-post duplicate-slug/series-number-duplicate）；**無 structured/JSON 輸出**（只 `printIssues` stderr），但 `validateContent()` 已 export 回傳 `{issues,errorCount}` → 結構化資料已存在回傳值，缺的只是序列化 + join 契約；(2) admin governanceSignals（am-5）只 mirror **4 條 taxonomy 概念**（unknown-tag/category + cross-site mismatch tag/category），**非計數 mirror**，未涵蓋其餘 ~106 rule-type；(3) **兩端 universe 不可 1:1 join（核心）**：validator 僅掃 ready/published（draft/archived 由 loadPosts 過濾，source L2106）+ fixtures + settings registries、用相對 sourcePath、site 基準 = `post.site`；admin loader 掃全 11 篇含 draft、排除 fixtures、用絕對路徑、site 基準 = `post.sourceSite` → 唯一 governance signal 的 `phonics-practice-sheet-download` 是 draft，validator 看不到（production validator warnings = 0），故兩端數值天生不等；draft → UI 必須顯「未驗證」非「0 warnings」，settings/fixture issues 無對應文章 → 屬 System checks/summary 層。**資料責任邊界**：validator = ground truth；ADMIN = read-only hints/visibility/triage，不修復、不 per-post prescription、不暗示 build blocker、不重算 rule。**Options**：A1 render-time import（不推薦，double-run 耦合）/ A2 獨立 read-only reporter script → JSON cache → admin 只讀（**未來首選**，不改 validator rule、staleness 以 asOf 標示）/ B validator 加 `--report-json`（動 ground-truth，caution 最高）/ C docs-only 不接 ADMIN / D view 端 reduce governanceSignals（只 4 概念）。**推薦 = 現階段維持 C+D 現狀**（production warnings=0，邊際價值低、universe-mismatch 誤導風險高）；未來若要則走 A2 優於 B。**UI 位置優先**：detail panel `validationReadiness`（低風險，佔位現成）> System checks mirror（容納 settings/fixture/aggregate）> Posts index badge 升級（動 cell）> summary card 補欄（高混淆，v1 不建議）。**structured output**：需要才超越 4 概念；先做 `...-validation-report-schema-and-join-contract-preanalysis-docs-only-a`。**Non-actions**：docs-only —— 未改 src/views/scripts/loader/validator/content/settings/tags.json/categories.json/frontmatter；未新增 Apply/Save/Auto-fix/Write/Mutate；未 npm install/build/deploy/Blogger repost；未 amend/rebase/reset/force push；未壓縮 CLAUDE.md。唯一 mutation = 該 preanalysis doc + 本 ledger 極小 sync。acceptance：`validate:content` 0/94/84 carry。**Recommended next phase** = 最保守維持 C+D 現狀；若推進則 schema+join-contract preanalysis（docs-only）→ reporter script（須 approval）→ admin detail-panel consume（須 approval）。紅線：reporter/admin-consume/validator-flag/summary-card 補欄/Posts-index 計數 badge/write path/per-post prescription 一律獨立 phase + user explicit approval。

**ADMIN validator per-post aggregation preanalysis ACCEPTED（20260616-pm-3，docs-only `docs/20260616-admin-validator-per-post-aggregation-preanalysis-acceptance-record.md`；baseline HEAD `de36a0a`）**：接受 pm-2 preanalysis 並正式記錄決策。**決策**：(1) 暫不實作 validator per-post warning aggregation；(2) 暫不把 validator warnings 接到 ADMIN UI；(3) **維持 Option C+D 現狀**（validator CLI 仍 ground truth；ADMIN 只顯示既有 governanceSignals / governance summary card；ADMIN 不取代 validator）；(4) 接受核心發現（validator universe ≠ admin universe；validator 只掃 ready/published，draft 被 load-posts.js 過濾 L2106；ADMIN 掃全含 draft；唯一 governance signal 的 `phonics-practice-sheet-download` 是 draft → validator 看不到、production warnings = 0；draft 不應誤顯 `0 warnings`，應視為「未驗證」/ deferred）；(5) 未來若推進**必須先做** `20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a` 而非直接 implementation。**Verdict = ACCEPTED**。**Deferred**（各須獨立 phase + approval）：schema+join-contract preanalysis（前置）/ reporter script（A2，不改 validator rule）/ admin detail-panel 只讀消費 + staleness banner / System checks mirror / Posts index 計數 badge / summary card 補欄。**Non-actions**：docs-only —— 未改 src/views/scripts/loader/validator/content/settings/tags.json/categories.json/frontmatter；未新增 Apply/Save/Auto-fix/Write/Mutate；未新增 validator JSON output / reporter script；未改 ADMIN UI；未 npm install/build/deploy/Blogger repost；未 amend/rebase/reset/force push；未重跑 validate/check（carry：validate 0/94/84、resolver 34/0、article-block 13/0、anchor-wiring 14/0、blogger-output 85/0、commerce-resolver 23/0）；未壓縮 CLAUDE.md。唯一 mutation = 該 acceptance record doc + 本 ledger 極小 sync。**Recommended next phase** = idle freeze / exit（最保守；ADMIN governance 線收尾於穩定現狀，validator per-post 線正式 deferred）；或 `20260616-admin-empty-state-copy-review-docs-only-a`（切片 5 empty-state 逐字文案審稿，低風險 docs-only，並行不衝突）。紅線：validator JSON output / reporter / admin-consume / summary-card 補欄 / Posts-index 計數 badge / write path / per-post prescription 一律獨立 phase + approval；未來推進前置 = schema+join-contract preanalysis。

**ADMIN per-post governance signal aggregation implementation landed（20260616-pm-4，`feat(admin): aggregate validator signals per post`；baseline HEAD `0431316`）**：執行 pm-3 接受之 **Option D 落資料層**最小實作 —— 把每篇既有 per-post `governanceSignals`（am-5 五欄 taxonomy 概念）整理成可被 Admin read-only UI 直接列舉之 deterministic 彙總結構。**唯一資料來源 = 既有 governanceSignals（不重跑 validator、不 join validator warnings；per-post validator warning 仍 `deferred`，`validationReadiness` 未動）**，故避開 preanalysis 標示的 validator universe-mismatch / 相對⇄絕對 sourcePath join 問題（schema+join-contract preanalysis 仍為未來 validator-report 路線之前置，本階段**不**碰）。**source 變更 3 檔**：(1) `src/scripts/load-admin-posts.js`（+52）—— 新增 export 純函式 `aggregatePostGovernanceSignals(signals)`（`GOVERNANCE_SIGNAL_ORDER` 固定列舉順序：unknown-tag / unknown-category / cross-site-mismatch-tag / cross-site-mismatch-category；只列 count>0；`{ hasSignals, totalSignalCount, byClass, signals[] }`；count 防呆 floor / 負數·NaN·非 number→0；flag 嚴格 `===true`；不 mutate input）+ 在既有 governanceSignals 迴圈內 attach `p.governanceAggregation`；**未改既有欄位、未改 `validationReadiness`（仍 deferred）、未動 view/EJS（不擴張 UI）**。(2) `src/scripts/check-admin-governance-aggregation.js`（新增 smoke，repo 既有 `node:assert` 風格 mirror `check-adsense-resolver.js`；synthetic input only，不讀 content/settings、不打 API、不寫檔；16 case 涵蓋 null/zero/單訊號/四訊號 canonical 順序/total==signalSum 交叉檢核/只列 count>0/flag 非 true 不計/負數·NaN·floor/determinism 重呼+欄位順序無關/不 mutate）。(3) `package.json`（+1 npm script `check:admin-governance-aggregation`；非 npm install）。**Deterministic**：post 順序沿用既有穩定排序；signal 順序固定常數；count 純值無時間/隨機/I-O 依賴。acceptance：`check:admin-governance-aggregation` **16/0**；`validate:content` **0/94/84 不變**；`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check-commerce-affiliate-resolver` 23/0 carry；`check:blogger-adsense-output` 85/0 by construction 不受影響（admin loader dev-only，不在 build:blogger 路徑，未 re-run）。git diff scope = 上述 3 檔 + 本 ledger，無 unrelated。**Non-actions**：未改 content/frontmatter/markdown、settings、tags.json/categories.json、validator rule、view/EJS、ads/commerce、Blogger repost、GitHub Pages build/deploy；未新增 Apply/Save/Auto-fix/Write/Mutate；未引入 per-post prescription（不出現「應改為 X」規則引擎）；未把 governance signal 誤稱為 validator warning count；未 join validator warnings / 未新增 validator JSON output / reporter；未 npm install / 未 build / deploy / push gh-pages / 重貼 Blogger；未 amend/rebase/reset/force push / unrelated cleanup；未壓縮·重排 CLAUDE.md。**Recommended next phase** = `20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-docs-only-a`（規劃如何把 `governanceAggregation` 接到 detail panel / Posts index 之 read-only 顯示，docs-only）；或 `20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a`（validator-report 路線前置，docs-only）；或切片 5 empty-state 文字審稿。紅線：write path / per-post prescription / filter chip / Posts-index 計數 badge / loader 跨篇聚合搬遷 / validator warning join 一律獨立 phase + user explicit approval。

**ADMIN per-post governance aggregation implementation read-only acceptance PASS（20260616-pm-5，docs-only `docs/20260616-admin-validator-per-post-aggregation-implementation-acceptance-record.md`；reviewed commit `08edc53`）**：對 pm-4 implementation（commit `08edc53`）做 read-only acceptance。baseline verify PASS（branch main、HEAD==origin/main==`08edc53`、clean、0/0）。`git show 08edc53` 確認 scope = 4 檔純 insertions（loader helper + attach / smoke / npm script / ledger），**無** content·frontmatter·views·EJS·settings·validator rule 變更。**Scope acceptance**（逐項 PASS）：只含授權 admin data-layer aggregation；無 content/frontmatter mutation；無 UI/EJS/view；無 settings/tags/categories；無 validator rule semantic change；無 Admin write/apply/fix。**Implementation acceptance**（逐項 PASS）：`aggregatePostGovernanceSignals` 只從既有 `governanceSignals` 派生、不重定義 validator rule、deterministic（純值無時間/隨機/I-O；固定 `GOVERNANCE_SIGNAL_ORDER`）、固定 signal order、不 mutate input、只輸出 read-only derived data；`validationReadiness` 維持 `deferred`/untouched；validator-warning join 仍未實作。**Test acceptance** PASS：smoke synthetic-input-only，覆蓋 empty/null/invalid·strict-true-flag·count-normalization·canonical-order·non-mutation·byClass/totalSignalCount/hasSignals；package.json 只加一條 smoke command。**Validation（本 acceptance 重跑）**：`check:admin-governance-aggregation` **16/0**、`validate:content` **0/94/84 不變**；carry（未重跑）`check:adsense-resolver` 34/0·`check:adsense-article-block` 13/0·`check:adsense-anchor-wiring` 14/0·`check-commerce-affiliate-resolver` 23/0·`check:blogger-adsense-output` 85/0（admin loader dev-only，不在 build:blogger 路徑，未 build）。**Verdict = PASS**。**Non-actions**：read-only —— 未做新 source implementation / UI / EJS / content·frontmatter mutation / Admin write·apply·fix / validator-warning join / Blogger repost / GitHub Pages build·deploy / ads·commerce unrelated change / npm install / merge·rebase·reset·amend·force push / unrelated cleanup / CLAUDE.md 壓縮·重排。唯一 mutation = 該 acceptance record doc + 本 ledger 極小 sync。**Recommended next phase** = `20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-docs-only-a`（把 `governanceAggregation` 接到 detail panel / Posts index read-only 顯示之 preanalysis，docs-only）；或 `20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a`（validator-warning join 路線前置）；或切片 5 empty-state 文字審稿。

**ADMIN per-post governance aggregation read-only UI preanalysis landed（20260616-pm-6，docs-only `docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis.md`；baseline HEAD `d9b37c8`）**：規劃如何在 ADMIN read-only UI 呈現 pm-4 新增之 per-post `governanceAggregation`（只 preanalysis，不實作）。**核心盤點**：(1) data-flow —— `governanceAggregation` **已存在於 dev admin render context**（`posts[].governanceAggregation`；`build-github.js --mode-dev` render `index.ejs`），EJS 尚未引用（view 端 0 命中）→ 顯示純屬 additive EJS read、**不需改 loader**；(2) 既有 UI 已有 governance 落點 —— Posts index `gov: N`/`gov ✓` badge（signalSum，L760）、detail panel「Validation warnings (deferred)」section（L996–1007，`validationReadiness` 仍 deferred）、detail panel「Governance signals」raw 4 訊號 dl（L1016–1056）、Categories & Tags「Governance summary card」site-level rollup（am-4，L1504–1535）；(3) `governanceAggregation` = 同一組 taxonomy 訊號之 normalized/enumerable 重塑（`signals[]` 固定順序 + `byClass` + `totalSignalCount` + `hasSignals`），與 detail panel raw 4 訊號**同源** → 須以「同源 / 非 validator warning count」文案化解重複統計困惑；增量價值中等偏低（structured / future-proof）。**Options**：A detail panel only read-only summary（byClass 一行 + signals[] 列舉，保留 raw dl，單檔 `index.ejs` additive、零新 CSS、零 loader 改動）= **推薦**；B Posts index minimal indicator（tooltip-only，不做 filter chip / count badge 元件）= L1 不建議；C 獨立 per-post governance section = 與既有 raw section 重複、不建議；D 暫不顯示（資料已 derived dormant、backout 0）= 保守次選。**Recommended = Option A**（次選 D）。**L1 allowed**：只讀顯示 `governanceAggregation`、不改資料、不 prescription、不連 write、不 filter、不 badge 元件、不 join validator warnings。**Must be separate phase（各須 approval）**：Posts-index count badge / filter chip / suggested-fix / per-post prescription / validator-warning join / validation report schema / write·apply·fix / cross-post loader aggregation migration。**Non-actions**：docs-only —— 未改 src/views/scripts/loader/validator/content/settings/tags.json/categories.json/package/tests/frontmatter；未做 UI source；未做 Admin write/apply/fix；未做 filter chip / Posts-index count badge source / suggested-fix / validator-warning join；未 build/deploy / npm install / Blogger repost；未 amend/rebase/reset/force push；未壓縮·重排 CLAUDE.md。唯一 mutation = 該 preanalysis doc + 本 ledger 極小 sync。acceptance：docs-only（baseline `validate:content` 0/94/84 carry，未重跑）。**Recommended next phase** = `20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-acceptance-readonly-a`（read-only acceptance，docs-only）；之後若推進 = `…-detail-panel-implementation-a`（Option A，NOT docs-only，單檔 index.ejs additive，須 approval）。

**ADMIN per-post governance aggregation read-only UI preanalysis acceptance PASS（20260616-pm-7，docs-only `docs/20260616-admin-per-post-governance-aggregation-readonly-ui-preanalysis-acceptance-record.md`；reviewed commit `453442a`）**：對 pm-6 preanalysis 做 read-only acceptance。baseline verify PASS（branch main、HEAD==origin/main==`453442a`、clean、0/0）。`git diff-tree 453442a` 確認 commit scope = CLAUDE.md (M) + 1 新 preanalysis doc (A)，**無** source/views/content/settings/package/tests → 證實 docs-only。**Scope acceptance**（逐項 PASS）：preanalysis 只規劃 read-only UI；未授權 write/apply/fix、validator-warning join、filter chip、Posts-index count badge source、suggested-fix/prescription、build/deploy、content/frontmatter 變更（全列 separate phase）。**Current-state findings acceptance**（經 source grep 證實）：`load-admin-posts.js` L1063 確 attach `p.governanceAggregation`；`index.ejs` L1017 確有既有 raw「Governance signals」section + L760 posts-index badge；`grep governanceAggregation src/views/admin/index.ejs` **0 命中** → EJS 尚未引用；same-source（源自 governanceSignals，非 validator warning count）標示正確。**Option acceptance**：四 option（A detail-panel-only / B posts-index minimal no-filter-no-badge / C separate section / D no-UI-yet）完整；推薦 **Option A**（單檔 index.ejs additive、無 loader 改動、無 CSS 擴張、無 write、無 validator-join、最低風險）合理。**Future implementation boundary**：L1 可做 = 只動 index.ejs 既有 Governance signals section additive render byClass + signals[] 固定順序 + same-source 註 + 保留 raw dl + 沿用既有 CSS；不可做 = Posts-index/filter chip/count badge/suggested-fix/prescription/write/validator-join/loader aggregation migration（各須獨立 phase + approval）。**Verdict = PASS**。**Validation（皆 read-only）**：git diff-tree scope + 3 條 grep（loader attach / EJS 未引用 / 既有 raw section）；未跑 validate:content（docs-only，無 source 變更，0/94/84 carry）；未 build/deploy。**Non-actions**：read-only —— 未做 source implementation/UI/EJS/views source change/content·frontmatter mutation/Admin write·apply·fix/filter chip/Posts-index count badge/suggested-fix·prescription/validator-warning join/Blogger repost/GitHub Pages build·deploy/ads·commerce unrelated change/npm install/merge·rebase·reset·amend·force push；未壓縮·重排 CLAUDE.md。唯一 mutation = 該 acceptance record doc + 本 ledger 極小 sync。**Recommended next phase** = `20260616-admin-governance-aggregation-detail-panel-readonly-ui-implementation-a`（Option A，NOT docs-only，單檔 index.ejs additive read-only block，須 user explicit approval）。

**ADMIN governance aggregation detail panel read-only UI implementation landed（20260616-pm-8，`feat(admin): show governance aggregation in detail panel`；baseline HEAD `c24f962`）**：執行 pm-7 接受之 **Option A**，把 pm-4 loader 已 derive 之 per-post `governanceAggregation` 接到 Admin detail panel **唯讀**顯示。**唯一 source 變更 = `src/views/admin/index.ejs`（+35/−0）**：於既有「Governance signals」detail section 之 raw 4-signal dl **之後**插入 additive read-only block —— 「Aggregation summary (read-only · derived; same-source)」h4 + `.detail-grid` dl（`hasSignals` yes/no、`totalSignalCount`、`byClass · taxonomy` 含「其中 cross-site mismatch：N」view 端純 presentation 由 `signals[]` 之 cross-site-mismatch-* 加總）+ `signals[]` **固定順序**列舉（`type · class × count` 之 `.badge`）+ empty fallback（`hasSignals` false / signals[] 空 → 正向「無治理訊號」，不 render error）+ same-source note（明示來自既有 `governanceSignals`/`governanceAggregation`、**非 validator warning count**、不代表 `validationReadiness` 已完成、validator warnings 仍 **deferred**）。**保留**既有 raw 4-signal dl（不刪、不改語意）。**沿用既有 class**（`.detail-grid`/`.badge`/`.b-warn`/`.b-ok`/`.text-muted`）+ 既有 inline-style 排版慣例 → **零新 CSS**。**純唯讀**：無 `<button>`/`<input>`/`<form>`/`onclick`/`onchange`/`fetch(`/handler/filter/badge-link/write path（grep 新 block 僅命中自身「無 button…」描述註解，0 個實際元素）。**未改** loader / settings / package / content / frontmatter / Posts index / 其他 section。acceptance：`validate:content` **0/94/84 不變**；dev admin render（`node src/scripts/build-github.js --mode=dev`）→ `.cache/pages/admin/index.html` 無 EJS error（exit 0），「Aggregation summary」render **11 次**（11 篇 detail panel 各 1），無 undefined/null leak；`index.ejs` 確 reference `governanceAggregation`。carry（admin dev-only，不在 build:blogger 路徑，未 re-run）：`check:admin-governance-aggregation` 16/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check-commerce-affiliate-resolver` 23/0、`check:blogger-adsense-output` 85/0。git diff scope = `index.ejs` 單檔 + 本 ledger，無 unrelated。**Non-actions**：未改 content/frontmatter、loader/source data、settings/package/lockfile、validator；未做 Admin write/apply/fix、filter chip、Posts-index count badge、suggested-fix/prescription、validator-warning join、validation report schema、cross-post loader aggregation migration；未 Blogger repost / GitHub Pages build·deploy / npm install / amend·rebase·reset·force push / unrelated cleanup；未壓縮·重排 CLAUDE.md。**Recommended next phase** = `20260616-admin-governance-aggregation-detail-panel-readonly-ui-implementation-acceptance-readonly-a`（read-only acceptance，docs-only）；或 human visual acceptance（人眼於 `/admin/` 展開 detail panel 目視 Aggregation summary）。紅線：Posts-index count badge / filter chip / suggested-fix / prescription / validator-warning join / write path / loader aggregation migration 一律獨立 phase + approval。

**ADMIN governance aggregation detail panel read-only UI implementation acceptance PASS（20260616-pm-9，docs-only `docs/20260616-admin-governance-aggregation-detail-panel-readonly-ui-implementation-acceptance-record.md`；reviewed commit `a52bed3`）**：對 pm-8 implementation（commit `a52bed3`）做 read-only acceptance。baseline verify PASS（branch main、HEAD==origin/main==`a52bed3`、clean、0/0）。`git diff-tree a52bed3` 確認 scope = `src/views/admin/index.ejs`（唯一 source，+35/−0）+ `CLAUDE.md` ledger，**無** loader/settings/package/lockfile/content/frontmatter/build-deploy artifact。**Commit scope acceptance**（逐項 PASS）。**UI implementation acceptance**（committed block L1046–1080，逐項 PASS）：位於既有「Governance signals」section 內、保留 raw dl 不刪不改、additive read-only、顯示 hasSignals / totalSignalCount / byClass taxonomy（含 cross-site subtotal）/ signals[] 固定順序 type·class×count list / empty fallback（type-guard 預設，不 render error）/ same-source note（非 validator warning count、不代表 validationReadiness completed、validator warnings 仍 deferred）。**UI boundary acceptance**：grep committed block 無 posts-index change / filter chip / count badge / `<button`/`<input`/`<form`/`<select`/`<textarea`/`onclick`/`onchange`/`fetch(` / write·mutate·apply·save·autofix handler / suggested-fix·prescription / validator-warning join；唯一 forbidden-word 命中 = EJS 描述性註解（「純唯讀：無 button…」），標示為 harmless descriptive comment，本 phase 不改 source。**Render/validation（本 acceptance 重跑）**：`validate:content` **0/94/84 不變**；`node src/scripts/build-github.js --mode=dev` exit 0、`admin (dev-mode) rendered: 11 posts`、無 EJS error；rendered `.cache/pages/admin/index.html`「Aggregation summary」**×11**、無 `>undefined<`/`>null<` leak。carry：`check:admin-governance-aggregation` 16/0 等不受影響。**Verdict = PASS**。**Non-actions**：read-only —— 未做 new source implementation / UI·EJS·views source change / content·frontmatter mutation / loader·source data change / settings·package·lockfile change / Admin write·apply·fix / filter chip / Posts-index count badge / suggested-fix·prescription / validator-warning join / validation report schema / cross-post loader aggregation migration / Blogger repost / GitHub Pages build·deploy / ads·commerce unrelated change / npm install / merge·rebase·reset·amend·force push；未壓縮·重排 CLAUDE.md。唯一 mutation = 該 acceptance record doc + 本 ledger 極小 sync。**Recommended next phase（擇一，不直接開始）** = (1) human visual acceptance at `/admin/`（人眼目視 Aggregation summary 顯示·無破版·與 raw dl 同源無混淆）；(2) `20260616-admin-validation-report-schema-and-join-contract-preanalysis-docs-only-a`（validator-warning join 前置，docs-only）；(3) `20260616-admin-suggested-fix-l2-readonly-ui-preanalysis-docs-only-a`（docs-only）。

**ADMIN Posts table `<td>` closure structural audit + fix preanalysis（20260616-pm-10；audit = read-only no-op；preanalysis docs-only `docs/20260616-admin-posts-table-td-closure-fix-preanalysis.md`；baseline HEAD `3066c0f`）**：human 於 `/admin/` view-source 發現 Posts table 之 Completeness `<td class="col-narrow">` 未閉合即接 `<td class="col-urls">`，遂做 read-only structural audit + docs-only fix preanalysis。**Audit verdict = YES（confirmed）**：main post-row（`index.ejs` `<tr class="post-row">` L660→L767）開 **7 `<td>`**（L680/689/711/718/727/733/762）僅關 **6 `</td>`**（L688/710/717/726/732/766）→ **Completeness `<td>`（L733）缺 closing `</td>`**（gov badge `</span>` L761 後直接 `<td class="col-urls">` L762）；rendered `.cache/pages/admin/index.html` 重現（`<td>` 817 / `</td>` 806 = **11 未閉合**，= 11 post-row 各 1；col-narrow 22 / col-urls 11 一致）→ **影響全部 11 post-row**。**Root cause**：`git show a46fff6~1` post-row = 7/7 平衡、`c24f962`（pm-8 parent）= 7/6 失衡 → 失衡由 **`a46fff6`（am-1 gov-badge 插入，+58/−1 之 −1 即丟失該 `</td>`）引入**；**與 Aggregation summary（pm-8 `a52bed3`，diff 僅 detail-panel hunk `@@ -1043 @@`）無關**，pm-9 Aggregation summary acceptance 維持有效。瀏覽器 auto-repair 使視覺多半正常但 source 無效（風險：欄位對齊 edge case / CSS cell targeting / 未來 JS selector·cell-index / accessibility / HTML validator）。**Minimal fix（下一 phase 執行，未做）** = `index.ejs` L761 `</span>` 後、L762 `<td class="col-urls">` 前**插入單一 `</td>`**（no data/CSS/JS/UI-behavior/loader change）。**human visual acceptance record 暫緩**至 fix 完成；「no button/input/form」檢查僅限 Aggregation summary 新增 block（ADMIN 頁既有 Commerce snippet / FB dry-run / Dry-run edit 之 button·input 屬 pre-existing，不計入）。**Non-actions**：audit read-only no-op（0 file change）；preanalysis docs-only —— 未改 src/views/EJS/loader/settings/package/tests/content/frontmatter；未做 source fix / Admin write·apply·fix / filter chip / Posts-index count badge / suggested-fix / prescription / validator-warning join / Blogger repost / GitHub Pages build·deploy / npm install / amend·rebase·reset·force push；未壓縮·重排 CLAUDE.md。唯一 mutation = 該 preanalysis doc + 本 ledger 極小 sync。**Recommended next phase** = `20260616-admin-posts-table-td-closure-source-fix-a`（NOT docs-only，單檔 index.ejs 補 1 個 `</td>`，依 preanalysis §E 驗證，須 user explicit approval）。

### 當前 baseline

`npm run validate:content` = **0 errors / 94 warnings / 84 issue-posts**（normal baseline；80→94 之 +14 全由 night-6 `adsense.blocks[]` validator fixtures 造成：14 trigger fixtures `_test-adsense-*` 各 1 warning + 2 zero-warning guard fixture（`-valid` / `-legacy-coexist`，不增 issue-post 計數）；night-8 N6a 之 ads.config.json shape 擴充 + 11 條 `validateAdsSettings` shape rules landed **不改變 baseline**（production target shape 0 觸發）；night-10 N7 之 `deriveRenderedAdsenseBlocks` resolver（`src/scripts/resolve-adsense-blocks.js`）+ smoke `check-adsense-resolver.js` **24/24** landed **不改變 baseline**（pure module；無 caller；ads.enabled=false 下 resolver 對任何 post 回 `{}`；EJS / build wiring 全部 dormant 至 N8/N9）；night-1（20260611）N8a 之 `adsense-article-block.ejs` partial（接 resolved `{ block, ads }` → 委派 `adsense-slot.ejs` 之 3-gate）+ smoke `check-adsense-article-block.js` **13/13** landed **不改變 baseline**（additive partial；無 caller / 無 anchor wiring；default-safe 空輸出；anchor 插入點仍 dormant 至 N8 後續）；night-2（20260611）N8 anchor wiring 之 `adsense-anchor.ejs` partial（接 `{ blocks, ads }` → 對該 anchor 每 block 委派 `adsense-article-block.ejs`；zero-byte default-safe）+ build-github.js 注入 `adsenseBlocksRendered = deriveRenderedAdsenseBlocks(post, settings.ads, 'pages')` + post-detail.ejs 14 個 v1 anchor 插入點 + smoke `check-adsense-anchor-wiring.js` **14/14** landed **不改變 baseline**（ads.enabled=false → resolver 回 `{}` → 全 anchor zero-byte；3 篇 post HTML 對 pre-change snapshot byte-identical；built posts grep 0 個 adsbygoogle/ca-pub/data-ad-slot；legacy adsenseTop/Bottom path 不變；Blogger N9 仍 dormant）；N8 anchor wiring **acceptance docs checkpoint** landed（`docs/20260611-n8-anchor-wiring-acceptance-and-n9-readiness.md`，docs-only；read-only/source acceptance **PASS**：validate 0/94/84、smoke article-block 13/13 + anchor-wiring 14/14 + resolver 24/24、14 v1 anchor 順序符合 convention、built `.cache/pages/` grep 0 個 adsbygoogle/ca-pub/data-ad-slot/data-ad-client、source+ads.config.json 無 hardcoded ca-pub；含 N9 readiness checklist + 6 項 hard blocker/input；非 N9 執行 / 無 real slot / 無 deploy）；N9 **operator input packet template** landed（`docs/20260611-adsense-n9-operator-input-packet-template.md`，docs-only；列 operator 啟用前須填之 inputs〔enabled 決策 / client id placeholder / articleAd1..6 slot id placeholder / anchor policy / approver〕+ six-slot policy 表 + 14 v1 anchor reference + N9 execution order + acceptance commands + rollback + red lines；**全欄 placeholder，無 real AdSense id**；非 N9 執行 / 無 deploy）；N9a（20260611-am-6）**real slots disabled config seed** landed（`content/settings/ads.config.json`）：operator 提供之 real AdSense client id 寫入 `adsenseClient`、six `articleAd1`..`articleAd6` real slot id 寫入 `slots.*`、`defaults.blocks[]` 由 `[]` → 6 blocks 對映 articleAd1→`afterHeader` / articleAd2→`afterCover` / articleAd3→`afterBookPhoto` / articleAd4→`afterAffiliateTop` / articleAd5→`beforeAffiliateBottom` / articleAd6→`beforeRelatedLinks`（皆 `surfaces:["pages"]`、per-block `enabled:true`、`order` 1–6、附 displayName/purpose/notes）。**`ads.enabled` 維持 `false`（master kill-switch）**；且 `resolve-adsense-blocks.js` **不消費** `defaults.blocks[]`（policy registry only / dormant，未 wire 至任何 post）→ 雙重保證零 ad markup。real client/slot id = **公開 ad-markup identifier（非 secret），僅允許存於 `ads.config.json`，不得寫入 docs / CLAUDE.md / source hardcode**（本 ledger 不記實際 id 值）。acceptance：normal validate **0/94/84 不變**、smoke resolver **24/24** + article-block **13/13** + anchor-wiring **14/14**、`build:github` 後 generated post HTML（`.cache/pages/`）grep **0 個** adsbygoogle / data-ad-client / data-ad-slot / 0 raw id；raw id 僅出現於 git-ignored `.cache/data/site.json`（settings 序列化，不 commit、非 ad markup）；containment grep 確認 7 個 real id **僅存於** `ads.config.json`（docs/CLAUDE.md/EJS/JS 0 命中）；**未 deploy / 未 push gh-pages / 未改 Blogger / 未改 post frontmatter；正式 N9 enable+deploy 仍 BLOCKED**）；N9b（20260611-am-7）**default blocks resolution pre-enable** landed（`src/scripts/resolve-adsense-blocks.js`）：resolver 開始消費 `ads.defaults.blocks[]` 作為 site-wide default article block source（per night-4 §6.2 fallback 設計；N7 曾 deferred）。block source 解析順序＝ **(1) `post.adsense.blocks` 非空 → post-specific override（最高優先，既有行為不變）→ (2) 否則 fallback 至 `ads.defaults.blocks[]` → (3) 否則 `{}`**；legacy `blocks.adsenseTop` / `adsenseBottom` EJS path 為獨立既有機制，resolver 不涉入（未動）。post-level `adsense.enabled===false` 連 site default 一併壓制。global gate 不變：須 `ads.enabled===true` + 非空 client + 非空 slot id 才產生 resolved block；`enabled=false` / 缺 client / 空 slot id / disabled block / unknown anchor 一律 no-op。smoke `check-adsense-resolver.js` **24→33**（+9 case：6-block default resolution、enabled=false no-op、缺 client / 空 slot no-op、post override defaults、post opt-out、disabled+unknown-anchor skip、internal field〔displayName/purpose/notes〕不洩漏；測試一律 **synthetic fake ids**，無 real id）。**未改 EJS / build-github.js**（既有 `adsenseBlocksRendered = deriveRenderedAdsenseBlocks(post, settings.ads, 'pages')` wiring 直接受益）、**未改 post frontmatter / production content**。acceptance：validate **0/94/84 不變**、article-block **13/13** + anchor-wiring **14/14**；`ads.enabled` 維持 `false` → `build:github` generated post HTML（`.cache/pages/`）grep **0 個** adsbygoogle / ca-pub / data-ad-slot / data-ad-client / 0 real slot id；real id 僅存於 `ads.config.json` + git-ignored `.cache/data/site.json`（非 committed、非 post HTML）；**未 deploy / 未 push gh-pages / 未改 Blogger；正式 N9 enable+deploy 仍 BLOCKED**）；N9c（20260611-am-8）**real-enable preview dry-run（no-commit）** 完成（docs-only：`docs/20260611-adsense-n9c-real-enable-preview-dry-run.md`，masked ids）：本機暫設 `ads.enabled=true` → `build:github` 後 generated post HTML 出現預期 AdSense markup（adsbygoogle / data-ad-client / data-ad-slot；3 篇 post 各 6 article block；6 real slot id 全數至少各 3 次；anchor top→bottom = articleAd1`afterHeader`→2`afterCover`→3`afterBookPhoto`→4`afterAffiliateTop`→5`beforeAffiliateBottom`→6`beforeRelatedLinks`；loader script 每篇 1 次不重複，head loader 經 `loader.pages:head` 單獨控制）→ **隨即 `git checkout` 還原 `enabled:false`（byte-identical，無 final diff）** → rerun build grep 回 0 ad markup。dry-run 期間 resolver case 21 self-guard 故意 fail（斷言 production `enabled:false`），還原後回 33/33。**未 commit enabled=true、未 deploy、未 push gh-pages、未改 Blogger；`ads.config.json` 無 final diff；real id 仍僅存 `ads.config.json`；正式 N9 enable+deploy 仍 BLOCKED（next operator decision：是否 commit enabled=true + deploy）**）；N9d（20260611-am-9）**pre-deploy go/no-go checklist（docs-only）** landed（`docs/20260611-adsense-n9d-predeploy-go-nogo-checklist.md`，masked ids）：operator 正式 enable/deploy 前之逐項 go/no-go（接受每篇 6 article blocks、anchor policy articleAd1`afterHeader`/2`afterCover`/3`afterBookPhoto`/4`afterAffiliateTop`/5`beforeAffiliateBottom`/6`beforeRelatedLinks`、先上 GitHub Pages、Blogger 另案、rollback=enabled 改回 false 後 rebuild/redeploy、enable commit 只改 ads.config.json enabled false→true、deploy 前後 validate/check/build/grep + live 檢查）+ 10 步 formal N9 sequence + rollback checklist + red lines。**未 commit enabled=true、未 deploy、未改 source/config/Blogger；docs-only 僅跑 validate（0/94/84）不 build；正式 N9 enable+deploy 仍 BLOCKED**）；N9e（20260611-am-10）**GitHub Pages-only AdSense enable + deploy 🟢 LIVE**：operator GO → `ads.config.json` `enabled:false→true`（commit `3e1f4e3`，**僅此一欄位**）→ validate 0/94/84 + article-block 13/13 + anchor-wiring 14/14 + build；generated post HTML 出現預期 markup（adsbygoogle / data-ad-client / data-ad-slot；3 posts × 6 = 18 slot blocks；client `ca-pub-…3759`；six slot 各 3 次；anchor top→bottom 符合 N9d；loader 每篇 1 次不重複；無 EJS leak）→ deploy 經既有 runbook（`docs/github-deploy.md` §4+§5.4：`npm run build` + `build:sitemap` → `portable-blog-deploy` clone sync `dist/` → push gh-pages **`2acb5a5→c15e514`**）→ live verify（`https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/` 載入正常、無 template leak；實際 ad fill 屬 AdSense 端）。**Blogger 未動（另案 phase）；GA4 未進**。⚠️ N9e commit 後 `check:adsense-resolver` 暫 32/33（case 21 舊 guard 仍 assert enabled:false，已過時，非缺陷）→ N9f 修復。N9f（20260611-am-11）**resolver guard update for enabled baseline**（`src/scripts/check-adsense-resolver.js`）：case 21 由舊「assert production `enabled:false` → {}」改為 **post-N9e production invariant**（`enabled===true` + `adsenseClient`/`slots.articleAd1..6` present 非空 + `defaults.blocks[]` 6 筆對映 N9d policy + anchors 屬 v1 enum + slot/anchor order top→bottom monotonic + 正式 config 實際 resolve 6 blocks〔pages〕/ blogger surface→`{}`；**present-check only，不列印 full real id**，test 無 hardcode real id）→ resolver 恢復 **33/33**。validate 0/94/84、article-block 13/13、anchor-wiring 14/14、build markup 18/18/3-posts 無 leak；real id 仍僅存 `ads.config.json`（docs/CLAUDE.md/EJS/JS/test 0 命中）。**未改 ads.config.json / EJS / render / Blogger；未 deploy / 未 push gh-pages**（test/docs-only，不動 live output）。**N9f source commit `e955f19`**（CLAUDE.md + `src/scripts/check-adsense-resolver.js` 兩檔；HEAD=origin/main）。am-12（20260611）**post-N9f acceptance + docs-only memory sync**：新 session baseline verify（HEAD=origin/main=`e955f19`、ahead/behind 0/0、working tree clean）+ regression re-run **PASS**（`validate:content` **0/94/84**、`check:adsense-resolver` **33/33**〔Case 21 post-N9e invariant 通過；舊 production `enabled:false` 失敗不復現〕）；本 session 無 production config/content/template/src 變更、未 build/deploy、未重貼 Blogger、未碰 AdSense 後台 / GA4，唯一 mutation = 本 CLAUDE.md sync。commerce-links registry L1-seeded 10 active；R1 resolver `src/scripts/resolve-affiliate-links.js` live；R2 smoke `src/scripts/check-commerce-affiliate-resolver.js` **23/23**（pm-11 起；含 9 條 `deriveRenderedAffiliateBlocks` block-resolver case）；R3 首批遷移 `we-media-myself2.md` 2 筆 url→ref；checkpoint `docs/20260610-commerce-we-media-myself2-ref-migration.md`）。**Blogger AdSense surface 線（pm-8→pm-13，20260611）—— 接續上方 N9e GitHub Pages-only LIVE 之後，補上 Blogger surface repo-side wiring（dry-run only；live repost 仍 BLOCKED）**：先有 preanalysis（`docs/20260611-blogger-adsense-surface-preanalysis.md`）→ acceptance（`docs/20260611-blogger-adsense-surface-preanalysis-acceptance.md`）→ Phase B plan（`docs/20260611-blogger-adsense-phase-b-policy-resolver-plan.md`，建議 blogger 首批僅 `articleAd6`/`beforeRelatedLinks` 單底部版位）。**Phase B（pm-8 commit `318686f`，`feat(adsense): allow blogger surface for bottom article ad`）**：`ads.config.json` 之 `articleAd6`/`beforeRelatedLinks` default block `surfaces` 由 `["pages"]`→`["pages","blogger"]`（**僅此一 block**；`articleAd1`–`articleAd5` 維持 pages-only；無 id 值變動、enabled 不變、legacy slot 不變）；`resolve-adsense-blocks.js` **未改**（resolver 早已支援 per-block surfaces）；`check-adsense-resolver.js` 更新 case 21f（blogger surface 由「永遠 `{}`」改為「只 resolve `articleAd6`/`beforeRelatedLinks`」）+ 新增 case 33 negative guard（blogger 不得 broad-enable articleAd1–5）→ resolver **33→34**。**Phase C build-wiring dry-run（pm-10 commit `2b1f166`，`feat(blogger): wire article bottom adsense dry-run`）**：`build-blogger.js` `renderFullPost` 注入 `adsenseBlocksRendered = deriveRenderedAdsenseBlocks(post, settings.ads, 'blogger')` + 傳 `ads: settings.ads`；`blogger-post-full.ejs` 加 `_adsAnchors` + **唯一** `beforeRelatedLinks` anchor 插入點（委派既有 `adsense-anchor`→`adsense-article-block`→`adsense-slot` partial chain）。**GitHub Pages（`build-github.js` / `post-detail.ejs`）完全未改 → pages 輸出 byte-identical by construction**。build:blogger dry-run 對 `dist-blogger/posts/we-media-myself2/post.html` 實測：恰 1 個 `lab-ad-slot--articleAd6`（client `ca-pub-…****` / slot `…****` masked），位於 affiliate bottom 後、related links 前；無 articleAd1–5、無 legacy slot、無 EJS leak；affiliate + related links 完整。**未 deploy / 未開 Blogger / 未貼。`dist-blogger/` git-ignored 不 commit。** **Phase D single-post repost plan（pm-11 commit `add290a`，`docs(blogger): plan single post adsense repost`）= docs-only**（`docs/20260611-blogger-adsense-phase-d-single-post-repost-plan.md`；target `we-media-myself2`；actual repost BLOCKED）。**Phase D readiness/handoff packet（pm-13 commit `6939010`，`docs(blogger): add adsense repost readiness packet`）= docs-only**（`docs/20260611-blogger-adsense-phase-d-readiness-packet-handoff.md`；local HTML path `dist-blogger/posts/we-media-myself2/post.html`；actual repost 仍 BLOCKED，pending 六項 pre-repost inputs：confirmed live Blogger post URL / confirmed account / confirmed blog / backup location / theme-CSS readiness PASS / screenshots location）。**當前 validation baseline 不變**：`validate:content` **0/94/84**、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**。**Hard stop（截至 pm-14）**：未開 Blogger 編輯器、未 paste / publish / repost、未碰 Blogger 後台、未碰 AdSense 後台；actual live repost 須 user 審閱 readiness packet + 完成 backup / theme-CSS gate 後 explicit separate approval 始可執行。real client / slot id 一律不寫入 CLAUDE.md / docs（僅 `ads.config.json`），本 ledger 用 slotKey / masked。**Phase D manual post verification PASS（night-1 record `docs/20260611-blogger-adsense-phase-d-manual-post-verification-record.md`；HEAD `4ca5351`）**：human operator 於 20260611 22:42–22:59 已完成 single-post live repost on `we-media-myself2`；live DOM 內含 `lab-ad-slot--articleAd6` `<ins>`（masked client / slot id）+ inline push + AdSense loader；第一次 unfilled、第二次成功觀察 visible creative；位置符合 affiliate bottom 之後 / related links 之前；console 之 `api.pub.affiliates.one` 429/404 與 `aria-hidden` warnings 屬另案、與 AdSense slot 本體無關（per record §6）；docs-only，未碰 source / config / Blogger / AdSense。**Phase E output guard landed（20260611-night-2，本 session）**：新增 `src/scripts/check-blogger-adsense-output.js`（+ npm `check:blogger-adsense-output`）—— 把 Phase D §7 expected output checklist 轉成 repo-side structural lock，14 case 全 pass：恰 1 個 `lab-ad-slot--articleAd6` `<ins>` + inline push + `data-ad-client`/`data-ad-slot` 值與 `ads.config.json` 一致（不 hardcode real id）+ `data-ad-format="auto"`/`data-full-width-responsive="true"` + 位置（affiliate bottom 後 / related links 前）+ negative guards（articleAd1–5 / legacy 5 slot keys / `<%`/`%>`/`await include` / ad block 周邊 `="undefined"`/`="null"`/`>undefined<`/`>null<` 全 0）+ surrounding intact（related-links / affiliate-box / sponsored rel）+ ads.config.json invariant（enabled=true、`articleAd6` anchor `beforeRelatedLinks` 且 surfaces 含 `blogger`）。target = `dist-blogger/posts/we-media-myself2/post.html`（缺檔給明確 `npm run build:blogger` 提示）。real id 維持只存 `ads.config.json`；test source 無 real id 字面值。**未碰 source 模板 / EJS / build / settings / Blogger 後台 / AdSense 後台 / dist-blogger commit / deploy / gh-pages。** acceptance：`validate:content` 0/94/84、`check:adsense-resolver` 34/0、`build:blogger` ok、`check:blogger-adsense-output` 14/0。**Second-post readiness packet（20260611-night-3，docs-only）**：`docs/20260611-blogger-adsense-second-post-readiness-packet.md`。盤點現況：3 ready Blogger post 中**僅** `we-media-myself2` 為 `bloggerMode: full`（Phase D 已用），另兩篇 `github-pages-blog-planning` / `portable-blog-system-mvp` 為 `summary`（renderer 不注入 AdSense → dist HTML 0 個 `articleAd6` / 0 個 articleAd1–5）。**今天 repo 內無第二篇可直接重貼之 full-mode ready post**；packet 推薦候選 `github-pages-blog-planning`（無 noindex；tech-note 補書評以外形態），但須先做獨立 content-change phase 將其 `publishTargets.blogger.mode: summary→full` + rebuild，否則 dist 仍無 AdSense markup。`portable-blog-system-mvp` 因 `seo.indexing:noindex-follow` **不**推薦。draft post（`sample-book-review` / `draft-book-review` / `phonics-practice-sheet-download`）不在 ready 集合內，不列候選。guard 維持單 slug hardcode；多 slug / registry / CLI param 等參數化方案 = 未來 phase 範疇，**現階段不動** `check-blogger-adsense-output.js`。**未碰 source / settings / package / template / frontmatter / Blogger / AdSense / deploy / gh-pages；real id 維持只在 `ads.config.json`。** acceptance：`validate:content` 0/94/84、`check:adsense-resolver` 34/0、`build:blogger` ok、`check:blogger-adsense-output` 14/0（仍僅驗 `we-media-myself2`，非第二篇 — 預期行為）。**Second-post content-change（20260611-night-4）**：per user explicit approval，僅 1 行 frontmatter 變更 —— `content/github/posts/20260504-github-pages-blog-planning.md` 之 `publishTargets.blogger.mode: "summary"→"full"`（其他欄位 / 其他文章皆未動）。`build:blogger` 後 `dist-blogger/posts/github-pages-blog-planning/post.html` 之 read-only evidence：恰 1 個 `lab-ad-slot--articleAd6` + 0 個 articleAd1–5 + `data-ad-client`/`data-ad-slot` 值與 `ads.config.json` strict-equal + 無 EJS leak + 文件順序在 hashtags 之前（該 post 無 affiliate / related-links / other-links，beforeRelatedLinks anchor 仍正確 fire）。`meta.json` 顯示 `bloggerMode:"full"` / `rendered:"full"`。`check:blogger-adsense-output` 仍 14/0 但僅驗 `we-media-myself2`（**不**代表第二篇已通過 guard；guard 涵蓋 = 未來 phase）。real id 仍只存 `ads.config.json`，docs / source / EJS / tests / package / 任何 frontmatter 皆無 real id 字面值。詳見 `docs/20260611-blogger-adsense-second-post-full-output-acceptance.md`。**未動** `src/` script / EJS template / `ads.config.json` / `package.json` / `check-blogger-adsense-output.js` / 其他 frontmatter；**未** repost / deploy / 開 Blogger / 開 AdSense / gh-pages。live Blogger 對應文章未更動 → live 端仍是 mode-flip 前之 summary 內容；第二篇實際重貼仍 🔴 BLOCKED，待未來 readiness handoff + user explicit approval。**Second-post repost readiness handoff（20260611-night-5，docs-only）**：`docs/20260611-blogger-adsense-second-post-repost-readiness-handoff.md`。target = `github-pages-blog-planning`（dist HTML `dist-blogger/posts/github-pages-blog-planning/post.html`；meta `meta.json` 顯示 `bloggerMode/rendered=full`）。packet 涵蓋：唯一合法 repost source（明列 GitHub Pages dist / markdown raw / summary HTML / redirect-card / FB 文案五種**不可用**）+ rebuild 後之 read-only one-liner 驗證 + 六項 pre-repost inputs（live URL 含「新建空文章」分支 / 帳號 / blog / live HTML 備份 / theme CSS verdict / 截圖位置）+ theme CSS readiness gate（本 post 不引入新 class，繼承 Phase D verdict；明列 `.lab-affiliate-box` / `.lab-related-links*` 不會出現之 class 差異）+ manual repost step draft（包含「既有文章」與「新文章」分支）+ Blogger metadata 對齊建議（標題 / 搜尋說明 / slug / labels / 發布日期，全取自 dist meta.json 而非 hardcode）+ 11 項前台驗收 checklist + 異常分流（DOM `<ins>` 不存在 vs 存在但未填，分別給排查順序）+ rollback procedure（含新文章 / 覆蓋既有 / theme 三分支）+ GO/NO-GO table。**guard 維持單 slug `we-media-myself2`，第二篇 one-off evidence 不納入 repeatable guard**（参數化 = 未來階段）。real id 仍只存 `ads.config.json`，docs / source / EJS / tests / package / 任何 frontmatter / 本 handoff 皆無 real id 字面值。**未動** `src/` script / EJS template / `ads.config.json` / `package.json` / `check-blogger-adsense-output.js` / 任何 content markdown 或 frontmatter；**未** repost / deploy / 開 Blogger / 開 AdSense / gh-pages。下一個 physical step = user 依本 handoff 完成第二篇 Blogger 手動重貼 + 前台檢查（須 user 完成 §6 inputs + explicit approval 始可執行）。acceptance：`validate:content` 0/94/84、`check:adsense-resolver` 34/0、`build:blogger` ok、`check:blogger-adsense-output` 14/0。**Second-post manual verification PASS（20260612-night-1，docs-only record `docs/20260612-blogger-adsense-second-post-manual-verification-record.md`；baseline HEAD `01de400`）**：human operator 已於 20260612 00:06 完成第二篇 Blogger AdSense 文章手動 live 重貼後之前台目視觀察；target = `github-pages-blog-planning`（`bloggerMode:"full"`；source markdown `content/github/posts/20260504-github-pages-blog-planning.md`；dist HTML `dist-blogger/posts/github-pages-blog-planning/post.html`）。觀察結果 PASS：full article content visible（非 summary 卡片）、live 頁面實際 render 一個 AdSense 圖像廣告、位置位於 article body 之後 / hashtag 區段之前、screenshot 無可見 EJS leak。依據 = user 提供 screenshot 1（prior/summary-like state，含「閱讀完整文章 →」）+ screenshot 2（full article state，含可見 AdSense 圖像廣告於 hashtag 之前）。Phase D（we-media-myself2，書評複雜形態）+ 本次（github-pages-blog-planning，tech-note 簡形態）兩篇皆 PASS → `articleAd6`/`beforeRelatedLinks` anchor 跨形態正確 fire。**Caveats**：本紀錄為 manual visual verification，**非** automated guard 涵蓋；`check:blogger-adsense-output` **仍只驗** `we-media-myself2`（hardcoded TARGET_SLUG，本 phase 不動）；`github-pages-blog-planning` = manually verified but not yet included in automated guard。**Non-actions**：本 session 未操作 Blogger / 編輯器 / 預覽 / 重貼、未碰 AdSense 後台、未 deploy / push gh-pages、未改 src / EJS / `ads.config.json` / `package.json` / `check-blogger-adsense-output.js` / 任何 content frontmatter、未做 guard 參數化、未新增或 hardcode real AdSense id、未做 CLAUDE.md compression / 未使用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 verification record doc 自身 + 本 CLAUDE.md 之極小 ledger sync。real id 仍只存 `ads.config.json`；docs / source / EJS / tests / package / 任何 frontmatter / 本 ledger entry 皆無 real id 字面值。acceptance：`validate:content` 0/94/84、`check:adsense-resolver` 34/0、`build:blogger` ok、`check:blogger-adsense-output` 14/0（仍僅驗 `we-media-myself2`）。**Recommended next phase** = `20260612-XX-blogger-adsense-guard-parameterization-preanalysis-docs-only-a`：為多 slug Blogger AdSense guard 涵蓋設計 docs-only preanalysis（Option A CLI param / Option B registry / Option C 自動遍歷 ready full post），**先 docs/preanalysis**，不改 guard / source / settings / content / Blogger / AdSense / deploy。**Phase F batch rollout plan landed（20260612-am-1，docs-only `docs/20260612-blogger-adsense-phase-f-batch-rollout-plan.md`；baseline HEAD `f7cfd98`）**：規格化 Blogger AdSense article bottom slot 之**小批次手動重貼節奏**（Batch 0 = `we-media-myself2` + `github-pages-blog-planning` 已完成並 lock；Batch 1 = 3–5 篇低風險文章，目前 candidate pool **實質為空**——production 3 ready post 已有 2 篇 Batch 0 lock，第 3 篇 `portable-blog-system-mvp` 為 `summary` + `noindex-follow` 須獨立決策，其餘為 draft；Batch 2 / Batch 3 sequential 觀察窗）。文件涵蓋：候選選擇規則 8 條、per-post manual repost checklist 11 步、acceptance criteria（repo / generated HTML / Blogger front-end 三層）、rollback plan（per-post / per-batch / per-repo + 紅線禁止同 session 混做 rollout / source fix / guard 改動）、暫停條件。**guard 維持單 slug `we-media-myself2`**（本 phase 不動 `check-blogger-adsense-output.js`；guard 參數化仍由獨立 preanalysis phase 處理，與 Phase F 並行不衝突）。**Non-actions**：未操作 Blogger / 編輯器、未碰 AdSense 後台、未 deploy / push gh-pages、未改 src / EJS / `ads.config.json` / `package.json` / `check-blogger-adsense-output.js` / 任何 content frontmatter / fixture、未做 guard 參數化、未新增或 hardcode real AdSense id、未做 CLAUDE.md compression / 未使用 `/memory` / 未做 unrelated cleanup、未跑 `build:blogger` / `check:adsense-*`（docs-only，僅跑 `validate:content` 確認 baseline）。唯一 mutation = 該 plan doc 自身 + 本 CLAUDE.md 之極小 ledger sync。real id 仍只存 `ads.config.json`；docs / source / EJS / tests / package / 任何 frontmatter / 本 ledger entry 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**；前次 measurement 之 `check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check:blogger-adsense-output` 14/0 因 source / settings / dist 無變更而 carry forward。**Recommended next phase（主線）** = `20260612-am-2-blogger-adsense-phase-f-batch-1-repost-packet-docs-only-a`：產生 Batch 1 之 candidate-specific copy/paste packet（docs-only；若 candidate pool 仍空則文件化暫停理由；不貼 / 不執行 batch repost）。並行不衝突：guard parameterization preanalysis phase。**Phase F candidate inventory + unblock plan landed（20260612-am-2，docs-only `docs/20260612-blogger-adsense-phase-f-batch-candidate-inventory.md`；baseline HEAD `2b1cae4`）**：以 am-1 §D.1 「Batch 1 候選池為空」之結論為前提，做**只讀盤點**並列**解鎖選項**——am-2 將 am-1 提到的 repost-packet 子 phase 改為先做候選池盤點，因為候選池確實仍為 0。candidate table 含 6 篇 production post：2 篇 Batch 0 locked（we-media-myself2 / github-pages-blog-planning）、1 篇 deferred（`portable-blog-system-mvp` = summary + noindex-follow + download contentKind，三重衝突 §E）、3 篇 draft（`sample-book-review` / `draft-book-review` = template empty book metadata；`phonics-practice-sheet-download` = download asset dormant + noindex SEO-1 fallback risk）。**統計**：production post 6 / Batch 0 lock 2 / ready 非 Batch 0 1 / draft 3 / Batch 1 eligible **0**（與 am-1 §D.1 結論一致）。**production-post warnings = 0**（94 warnings 全來自 `content/validation-fixtures/` fixture posts，無 production 觸發）。**解鎖選項三種（§F）**：Option 1 維持暫停（最低風險；等新內容）；Option 2 開 content/frontmatter docs/source phase 序列解鎖 1–3 篇（推薦主線，分子 phase 不混做）；Option 3 1 篇 mini-batch（命名 Batch 1a；明文標示不是 Batch 1 本體）。**portable-blog-system-mvp 單獨分析（§E）**：解鎖須同時滿足 mode flip + noindex 政策獨立 preanalysis（noindex page 上能否放 AdSense 屬 Google AdSense 政策範疇，repo 無法單方面決定）+ theme readiness gate（download contentKind 尚未 Batch 0 sampled）；屬 content/frontmatter + SEO preanalysis 組合，非 repost packet phase。**Non-actions**：未操作 Blogger / 編輯器、未碰 AdSense 後台、未 deploy / push gh-pages、未改 src / EJS / `ads.config.json` / `package.json` / `check-blogger-adsense-output.js` / 任何 content frontmatter / fixture、未做 guard 參數化、未新增或 hardcode real AdSense id、未做 build / 任何 check guards（read-only baseline 僅跑 `validate:content`）、未做 CLAUDE.md compression / 未使用 `/memory` / 未做 unrelated cleanup、未做 noindex 政策 final 決策（preanalysis 留給下一 phase）。唯一 mutation = 該 inventory doc 自身 + 本 CLAUDE.md 之極小 ledger sync。real id 仍只存 `ads.config.json`；docs / source / EJS / tests / package / 任何 frontmatter / 本 ledger entry 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**（production-post warnings = 0）；前次 measurement 之 `check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check:blogger-adsense-output` 14/0 因 source / settings / dist 無變更而 carry forward。**Recommended next phase（主線推薦 Option 2 第 1 步）** = `20260612-am-3-blogger-adsense-phase-f-batch-1-candidate-unblock-content-plan-docs-only-a`：對 4 篇 non-Batch-0 post 各做獨立 unblock 路徑分析（含 portable-blog-system-mvp noindex 政策 preanalysis、book-review draft minimum viable scope、download asset 上傳路徑）；docs-only；不改 frontmatter / content / theme / settings / src。**候選保守路徑** = Option 1 維持暫停；並行不衝突仍為 guard parameterization preanalysis phase。**Phase F Batch 1 candidate unblock content plan landed（20260612-am-3，docs-only `docs/20260612-blogger-adsense-phase-f-batch-1-candidate-unblock-content-plan.md`；baseline HEAD `7416024`）**：接續 am-2 inventory，對 4 篇 non-Batch-0 production post 各做獨立 unblock 路徑分析 + per-post matrix（slug/file/status/blocker/whether-full/whether-indexable/Blogger-readiness/commerce-complexity/AdSense-suitability/required-unblock-work/recommended-action/risk/eligible-after）。**核心結論**：Batch 1 eligible = 0 **不是** AdSense slot implementation failure（repo-side renderer/wiring/dist 全 live-correct、Batch 0 兩篇 live verified），而是 **candidate readiness 不足**。逐篇：`portable-blog-system-mvp`（ready 但 summary + noindex-follow + download contentKind → 須 SEO policy preanalysis 釐清 noindex+AdSense 政策 + ROI + theme readiness，不建議硬改 SEO 樣本語意）；`sample-book-review` / `draft-book-review`（draft + book metadata 全空 + body placeholder/TODO → 應維持 draft，補成真內容屬正常 content production，空內容對外曝光有 AdSense 政策風險）；`phonics-practice-sheet-download`（draft + `download.fileUrl` 空 + noindex SEO-1 fallback + download 形態 theme 未驗 → 三重 blocker，優先序最後）。**Recommended unblock strategy（保守）**：(1) 無「最接近 full+indexable+low-complexity」之既有文章；(2) 建議優先新增 1–3 篇 low-risk full Blogger post（最乾淨）；(3) 不用 demo/draft/template placeholder 硬做 Batch 1；(4) 若只做 1 篇須標 **Batch 1a mini-batch** 非正式 Batch 1。**Concrete next phases（H1–H4）**：H1 SEO/content policy preanalysis（docs-only，推薦先行，釐清 noindex+AdSense，涵蓋 #3/#6）；H2 single-post frontmatter mutation（僅候選 eligible + H1 放行 + user approval 後）；H3 new low-risk full post authoring（最乾淨解鎖）；H4 conservative pause（保守預設）。**Future mutation acceptance（§I）**：only target post touched / no source-settings-template drift / validate pass / dist Blogger HTML 含 bottom `articleAd6` slot / evidence one-liner / manual repost remains separate phase。**Non-actions**：未開 Blogger / 編輯器 / AdSense 後台、未 repost / publish、未改任何 frontmatter（4 篇候選 draft/summary/noindex 一律只讀未動）、未改 src / settings / template / `ads.config.json` / `package.json` / `check-blogger-adsense-output.js`、未 build / deploy / push gh-pages、未跑 `build:blogger` / `check:adsense-*`（docs-only，僅跑 `validate:content`）、未做 guard 參數化、未新增/hardcode real AdSense id、未做 noindex final 決策、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 plan doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**（production-post warnings = 0）；`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check:blogger-adsense-output` 14/0 因 source/settings/dist 無變更而 carry forward。**Recommended next phase** = Option H1 `20260612-XX-blogger-adsense-noindex-download-seo-policy-preanalysis-docs-only-a`（docs-only；釐清 noindex page AdSense 政策 + mvp SEO 樣本去留 + download theme readiness）；或保守 H4 維持暫停 / 並行 guard parameterization preanalysis。**noindex / download / SEO policy preanalysis landed（20260612-am-4，docs-only `docs/20260612-blogger-adsense-noindex-download-seo-policy-preanalysis.md`；baseline HEAD `784e0a8`）**：執行 am-3 推薦之 Option H1。釐清三件事並輸出 §D 6-row policy decision matrix（D1 ready+full+indexable→✅正式候選 / D2 ready+summary→❌須先 flip / D3 ready+full+noindex→⚠️政策待確認+ROI 低，至多 Batch 1a internal / D4 download+indexable→⚠️須 download asset+theme readiness / D5 download+noindex→❌雙重 blocker / D6 draft+placeholder→❌維持 draft）+ per-post disposition（§G mvp=deferred〔summary+noindex-follow explicit SEO-2 樣本+download contentKind 三重糾纏；不建議為 AdSense 硬改 SEO 樣本語意〕；§H phonics=deferred 優先序最後〔draft+空 fileUrl+noindex fallback+真實 download block theme 未驗 三重〕；§I 兩篇 book-review=維持 draft〔book metadata 全空+佔位 body，解鎖須完整內容重寫非 frontmatter 小修〕）+ §J 5 條建議 project policy（正式 Batch 1 須 full+indexable+ready+non-placeholder；noindex 不得正式 Batch 1 僅可 Batch 1a internal 且須政策確認；download 預設 deferred 至 asset+theme+SEO 全完整；placeholder 不得驗證正式 rollout；候選不足優先新增 1–3 篇 low-risk full post）+ §K 5 個 next-phase 選項（K1 new low-risk full post content plan〔推薦主線最乾淨〕/ K2 mvp mode+SEO mutation preflight / K3 Batch 1a mini repost packet〔僅 eligible 後〕/ K4 conservative pause〔保守預設〕/ K5 guard parameterization preanalysis〔並行不衝突〕）。**核心結論重申**：Batch 1 eligible=0 不是 bottom slot renderer/source failure，而是 noindex/download/半成品三個 content+SEO gate；凡涉 Google 官方政策（noindex page 掛 AdSense、空內容掛廣告是否合規）一律標 ⚠️ 需人工/官方政策確認，未自行腦補。**Non-actions**：未開 Blogger / 編輯器 / AdSense 後台、未 repost / publish、未改任何 frontmatter（6 篇 post 一律只讀未動）、未改 src / settings / template / fixtures / views / `ads.config.json` / `package.json` / lockfile / `check-*.js`、未 build / deploy / push gh-pages、未跑 `build:blogger` / `check:adsense-*`（docs-only，僅跑 `validate:content`）、未做 guard 參數化、未新增/hardcode real AdSense id、未做 noindex/SEO final 決策、未宣稱完成外部 Google AdSense policy verification、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 preanalysis doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**（production-post warnings = 0）；`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check:blogger-adsense-output` 14/0 因 source/settings/dist 無變更而 carry forward。**Recommended next phase** = K1 `20260612-XX-blogger-content-new-lowrisk-full-post-content-plan-docs-only-a`（最乾淨解鎖，docs-only content plan）；或 K2 mvp mutation preflight（須先 ⚠️ noindex 政策確認 + SEO 樣本決策）；保守 K4 維持暫停 / 並行 K5 guard parameterization preanalysis。**new low-risk full Blogger post content plan landed（20260612-am-5，docs-only `docs/20260612-blogger-content-new-lowrisk-full-post-content-plan.md`；baseline HEAD `b486992`）**：執行 am-4 推薦之 Option K1。docs-only content plan（**不**新增文章檔、**不**改任何 frontmatter）規劃如何新增 1 篇 low-risk / full / indexable / ready / non-placeholder 之 Blogger 文章，使其未來成為 Batch 1a / Batch 1 候選（**非**為了立即重貼）。§B 論證為何不硬救既有候選（noindex 政策爭議 / 半成品 / SEO 樣本語意糾纏）、新增普通 full article 較乾淨；§C 9 條新文章硬條件（full / indexable / ready / normal-article-非download / non-placeholder / 內容完整 / 低 commerce / 適合 Blogger output / 適合驗 bottom slot）；**關鍵 zero-drift 限制**：Blogger-valid category 僅 `tech-note`/`book-review`/`download`/`life-note`、Blogger-valid tag 僅 `book`/`book-review`/`reading-notes`/`self-growth`（validator 對 site 不符發 `category-site-mismatch`/`tag-site-mismatch` warning），故為「不改 settings + production warnings 維持 0」新文章只能重用既有 Blogger-valid 值（推薦 category `life-note` + tags `reading-notes`/`self-growth`）；§D 4 個低風險候選（推薦候選 1「每天閱讀的 5 個小方法」`daily-reading-habit-notes`，life-note，0 commerce / 0 素材依賴）；§E 推薦第 1 篇（title/slug/path `content/blogger/posts/20260612-daily-reading-habit-notes.md`/frontmatter/outline/why-safer-than-mvp-download-draft/future-acceptance）；§F frontmatter plan（contentKind `life-note`、blogger full、indexable〔不設 seo.indexing〕、cover 重用既有 placeholder、affiliate/commerce/book/download 全留空）；§G content outline（intro + 5 主段 + conclusion 自然收尾於 related links 前，約 600–900 字，禁 TODO/佔位）；§H future content-mutation acceptance（only one new post file / no source-settings-template drift〔含 categories.json/tags.json/ads.config.json〕/ no AdSense id mutation / validate pass / production warnings 0 / dist Blogger HTML 含 bottom `articleAd6` slot / full+indexable+ready+non-placeholder / 實際 repost 另案）；§I 5 個 next phase（I1 one-post content mutation 撰寫推薦主線 / I2 generated-HTML dry-run slot verification / I3 Batch 1a mini repost packet〔僅 eligible 後〕/ I4 conservative pause / I5 guard parameterization preanalysis 並行）。**Non-actions**：未新增任何文章檔（只列 plan）、未改任何 frontmatter（6 篇既有 post 只讀；未把 noindex/draft/download/placeholder 改成候選）、未改 src/settings/template/fixtures/views/package/lockfile/`check-*.js`、未 build/deploy/push gh-pages、未開 Blogger/AdSense 後台、未 repost、未做外部前台驗證、未跑 `build:blogger`/`check:adsense-*`（docs-only，僅跑 `validate:content`）、未做 guard 參數化、未新增/hardcode real AdSense id、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 plan doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**（production-post warnings = 0）；`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0、`check:blogger-adsense-output` 14/0 因 source/settings/dist 無變更而 carry forward。**Recommended next phase** = I1 `20260612-XX-blogger-content-daily-reading-habit-notes-one-post-content-a`（實際撰寫第 1 篇，single new file，須 user explicit approval）；或保守 I4 維持暫停 / 並行 I5 guard parameterization preanalysis。**new low-risk full Blogger post landed（20260612-am-6 `20260612-am-6-blogger-content-daily-reading-habit-notes-one-post-content-a`；baseline HEAD `e41445b`）**：執行 am-5 推薦之 Option I1。per user explicit approval，**新增單 1 檔** `content/blogger/posts/20260612-daily-reading-habit-notes.md`（title「我這一年養成每天閱讀的 5 個小方法」/ slug `daily-reading-habit-notes` / contentKind `life-note`〔normal article，非 download / 非 book-review〕/ category `life-note` + tags `reading-notes`,`self-growth`〔皆 Blogger-valid，0 settings drift〕/ `publishTargets.blogger.mode:"full"` + `github.enabled:false` / `status:"ready"` `draft:false` / cover 重用既有 `/images/placeholders/cover-placeholder.svg`〔0 新素材〕/ **無** `seo.indexing`（indexable）/ **無** affiliate / commerce ref / book / download / fileUrl / 外部連結；body 約 1100 字真實繁中文章，intro + 方法一〜五〔固定小時段 / 環境觸發 / 不把閱讀變壓力 / 只記一兩句 / 把不同書連起來〕+ 結尾，非 TODO / placeholder / demo）。**僅此 1 新檔；未改任何既有 post / src / settings〔含 categories.json / tags.json / ads.config.json〕/ views / templates / fixtures / package / lockfile / guard。** acceptance：`validate:content` **0/94/84 不變**（新 post 觸發 0 production warning）；`build:blogger` ok；generated `dist-blogger/posts/daily-reading-habit-notes/post.html` read-only evidence：恰 **1 個** `lab-ad-slot--articleAd6` + **0 個** articleAd1–5 + `data-ad-client`/`data-ad-slot` 與 `ads.config.json` strict-equal + 0 EJS leak（`<%`/`%>`/`await include`）+ 0 affiliate box + 0 noindex + 0 legacy ad slot；文件順序 body → articleAd6（line 80）→ hashtags（line 94），`beforeRelatedLinks` anchor 於無 related-links 時仍正確 fire 於 hashtags 前；`meta.json` `bloggerMode/rendered:"full"`。guard carry：`check:adsense-resolver` **34/0** / `check:adsense-article-block` **13/0** / `check:adsense-anchor-wiring` **14/0** / `check:blogger-adsense-output` **14/0**（後者仍 hardcoded `we-media-myself2`，**未**涵蓋本新 post → 本 post 為 manually-evidenced，not yet automated-guard-covered；guard 參數化仍待 I5 獨立 phase）。**該 post 現成為 Blogger AdSense Batch 1a / Batch 1 候選**（full + indexable + ready + non-placeholder + 0 commerce）。**Non-actions**：未 repost / publish / 開 Blogger / 開 AdSense 後台 / 外部前台驗證、未 deploy / push gh-pages、未改 real AdSense id（real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值）、未做 guard 參數化、未做 CLAUDE.md compression、未用 `/memory`、未做 unrelated cleanup。實際 Blogger 重貼仍 🔴 BLOCKED，須另開 execution phase + user approval + 備份 + theme CSS 確認。real id 一律不寫入 CLAUDE.md / docs。**Batch 1a repost packet landed（20260612-am-7，docs-only `docs/20260612-blogger-adsense-batch-1a-daily-reading-repost-packet.md`；baseline HEAD `b747518`）**：為 am-6 新增之 `daily-reading-habit-notes`（Batch 1a 候選，**單篇 mini-batch，非正式 Batch 1 本體**）打包 manual repost packet。涵蓋：A baseline、B candidate summary + why-eligible（full/indexable/ready/non-placeholder/0-commerce/0-drift）+ 與 Batch 0 兩篇形態差異補位（life-note 生活心得形態）、C 本 session repo-side re-verification（**非 live 前台**）、D repost source（唯一 `dist-blogger/posts/daily-reading-habit-notes/post.html`；5 種不可用來源；不塞完整 HTML 進 docs；read-only sanity one-liner）、E 六項 pre-repost inputs、F theme CSS readiness gate（繼承 Batch 0 verdict；不引入新 class group）、G 15 步 manual repost steps（含 Blogger sanitizer strip → 立即停止並記錄）、H Blogger metadata 對齊（取自 dist meta.json）、I manual verification checklist、J 沒看到廣告判斷流程、K Batch 1a acceptance criteria、L rollback plan（含 sanitizer / 破版 → 停止不混做修復）、M verification record 待填模板、N next-phase（成功→verification record / 失敗→failure analysis or source-fix preanalysis；並行 guard parameterization）、K2 guardrails、O real-id masking。**repo-side re-verification 全 PASS**：`validate:content` **0/94/84**、`build:blogger` ok、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**、`check:blogger-adsense-output` **14/0**（仍 hardcoded `we-media-myself2`，**未**涵蓋本 post）；`dist-blogger/posts/daily-reading-habit-notes/post.html` = full（非 summary）+ articleAd6 **1** / articleAd1–5 **0** / client+slot strict-equal `ads.config.json` / EJS leak 0 / noindex 0 / affiliate-box 0 / legacy slot 0 / 順序 body<ad<hashtags。**本文件不代表已完成 Blogger 外部重貼**；所有「verified」皆 repo-side generated-artifact verification。**Non-actions**：未開 Blogger / 編輯器 / AdSense 後台、未 repost / publish / 外部前台驗證、未改任何文章檔（含 daily-reading-habit-notes）/ src / settings / template / views / fixtures / package / lockfile / guard scope、未 commit dist-blogger、未 deploy / push gh-pages / `.cache`、未新增/hardcode real AdSense id、未做 guard 參數化、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 packet doc + 本 CLAUDE.md 極小 ledger sync。實際 repost 仍 🔴 BLOCKED，須 user 完成 §E inputs + explicit approval 另開 execution phase。real id 一律不寫入 CLAUDE.md / docs（僅 `ads.config.json`）。**Batch 1a manual verification PASS（20260612-am-8，docs-only record `docs/20260612-blogger-adsense-batch-1a-daily-reading-manual-verification-record.md`；baseline HEAD `c0e8350`）**：human operator 已於 20260612 10:48 依 am-7 packet 完成 `daily-reading-habit-notes`（life-note 生活心得形態；Blogger live URL `https://babel-lab.blogspot.com/2026/06/daily-reading-habit-notes.html`）之 Blogger 手動重貼 / 發布 + 前台檢查（desktop Chrome + DevTools）。觀察 PASS：desktop OK / mobile OK（user manually checked，未附手機截圖）/ 0 layout break / rollback NO；bottom AdSense slot **present** 位於正文之後、hashtags 之前，status = **real ad / filled**（`data-ad-status="filled"`）；DevTools 可見 `ins.adsbygoogle` / `lab-ad-slot` / `lab-ad-slot--articleAd6` / masked `data-ad-client` / masked `data-ad-slot` / `data-ad-status="filled"` + 下方 adsbygoogle loader script 仍存活 → Blogger **未** strip 關鍵 AdSense attrs / script；無 duplicate slot、無 articleAd1–5、無 affiliate/commerce box、無 layout overlap。此為**第三篇** live PASS（繼 Phase D `we-media-myself2` 複雜書評形態、night-1 `github-pages-blog-planning` tech-note 簡形態），補上 life-note 純 body（0 affiliate / 0 related-links）形態 → `articleAd6`/`beforeRelatedLinks` anchor 跨形態正確 fire。**Caveats**：manual visual / DevTools verification，**非** automated guard；`check:blogger-adsense-output` **仍只驗** `we-media-myself2`（hardcoded TARGET_SLUG，本 phase 不動）；`daily-reading-habit-notes` = manually verified but not yet automated-guard-covered；mobile 無截圖；real ad fill 為單一 time-point 觀察。**Rollout implication**：`daily-reading-habit-notes` 視為 Batch 1a 成功樣本；可考慮新增 2–4 篇 low-risk full posts 或把 Batch 1 擴成 3–5 篇；不建議立刻全量重貼；維持小批次保守節奏。**Non-actions**：未登入 Blogger / 未開編輯器 / 未碰 AdSense 後台、未 repost / publish / 新外部驗證（僅紀錄 user 提供結果）、未改任何 post/frontmatter/content、未改 src/settings/template/views/fixtures/package/lockfile/guard scope、未 commit dist / 截圖、未 deploy / push gh-pages / `.cache`、未新增/hardcode real AdSense id、未做 guard 參數化、未做 CLAUDE.md compression、未用 `/memory`、未做 unrelated cleanup。唯一 mutation = 該 record doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Recommended next phase** = `20260612-XX-blogger-content-lowrisk-posts-batch-1-expansion-plan-docs-only-a`（規劃再 2–4 篇 low-risk full post 擴成 Batch 1）；或 batch-1-rollout-readiness / 並行 guard parameterization preanalysis / 保守 pause。**Blogger AdSense output guard parameterization preanalysis landed（20260612-am-9，docs-only `docs/20260612-blogger-adsense-guard-parameterization-preanalysis.md`；baseline HEAD `435fd4a`）**：分析如何把 hardcoded single-slug `check-blogger-adsense-output.js`（`TARGET_SLUG='we-media-myself2'`）參數化以涵蓋多 Blogger post，第一階段至少 `we-media-myself2` + `daily-reading-habit-notes`。**核心發現**：4 個 AdSense guard 中 `check:adsense-resolver`（34/0）/ `check:adsense-article-block`（13/0）/ `check:adsense-anchor-wiring`（14/0）已 general（測純函式 / partial render，synthetic ids，不綁任何 production post）；**唯一仍 hardcoded** 的是 `check:blogger-adsense-output`（14/0，驗實際 dist 產物，天然 per-post）。**不能單純換 slug**：read-only 量測證實 we-media（affiliate-box **2** / related-links aside **1** / item **2**）vs daily-reading（affiliate-box **0** / related-links **0**）形態不同 → 現行 guard 之 **Case 7 / Case 12 / Case 13**（related-links 存在、affiliate-box ≥1、ad-before-related-links 位置語意）為 **we-media-specific**，直接套 daily-reading 會 FAIL；故參數化須把「周邊區塊存在性 + 位置 anchor 關係」改 **per-target expectation**（we-media positionAnchor=relatedLinks / daily-reading positionAnchor=hashtags）。**推薦最小安全改法**：in-file `TARGETS` array of declarative expectation objects（slug / output path / expected counts / per-target affiliateBox·relatedLinks·noindex·positionAnchor）；對每 target 跑 surface-invariant 共同斷言（articleAd6=1 / articleAd1–5=0 / data-ad-client·data-ad-slot strict-equal `ads.config.json` / no EJS leak / no legacy slot / no undefined-null near ad）+ per-target 分支；**不**新增 settings 檔（避免 validator coupling）、**不**自動 build（caller 先 build；缺檔明確報 slug）、**不** hardcode real id（只從 ads.config.json 讀比對）。Option C 自動遍歷 ready+full post **不採**（對「故意無 ad」post 誤報風險 + 位置 anchor 難一致）。**Risk 分析涵蓋**：dist 需先 build / 不自動 build 理由 / dist git-ignored 無 churn（`.gitignore` `dist-blogger/*` 僅 `.gitkeep` tracked，已確認）/ Windows path.join / real id leak 防護 / 避免 hardcode 絕對 offset（am-7 packet 之 `body@1847<ad@3762<hashtags@4095` 僅一次性 evidence，guard 只斷言相對序）/ 避免斷言 live-only `data-ad-status=filled`（runtime 屬性不在本機 HTML）。**Future implementation acceptance**：only guard script touched（+optional CLAUDE.md）/ no real id hardcode / build:blogger pass / check:blogger-adsense-output 涵蓋 both target / 其餘 3 check 維持 34·13·14 / validate 0/94/84 / git diff minimal / no live action。**Recommended next phase（主線）** = `20260612-XX-blogger-adsense-guard-parameterization-implementation-a`（**會改 source guard script → NOT docs-only**；須 user explicit approval）；alt = Phase F batch-1 expansion / second low-risk post one-post content / conservative pause。**Non-actions**：未改任何 src / guard / content / frontmatter / settings / template / views / fixtures / package / lockfile / dist commit / gh-pages / `.cache`、未開 Blogger / AdSense 後台、未 repost / publish / 外部前台驗證、未新增/hardcode real AdSense id、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 preanalysis doc + 本 CLAUDE.md 極小 ledger sync。read-only 量測：`validate:content` **0/94/84** / `check:adsense-resolver` **34/0** / `check:adsense-article-block` **13/0** / `check:adsense-anchor-wiring` **14/0** / `check:blogger-adsense-output` **14/0**（仍 single-slug `we-media-myself2`）。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Blogger AdSense output guard parameterization implementation landed（20260612-am-10，HEAD pre `7a9711a`）**：執行 am-9 推薦主線，把 `src/scripts/check-blogger-adsense-output.js` 由 single hardcoded slug（`TARGET_SLUG='we-media-myself2'`）改為 **multi-target guard（in-file `TARGETS` array）**，第一階段涵蓋 exactly 2 篇：`we-media-myself2`（複雜形態）+ `daily-reading-habit-notes`（最簡 life-note 形態）。每 target expectation 物件含 slug / articleAd6 count / articleAd1–5 count / noindex count / affiliateBox（`{min}` 或 `{exact}`）/ relatedLinks（true|false）/ positionAnchor（`relatedLinks`|`hashtags`）。共同（surface-invariant）斷言 C1–C10 對每 target 一律跑（恰 1 articleAd6 + adsbygoogle `<ins>` + inline push + `data-ad-client`/`data-ad-slot` strict-equal `ads.config.json`〔從 settings 讀，不 hardcode real id〕+ `data-ad-format="auto"`/`data-full-width-responsive="true"` + 0 articleAd1–5 + 0 legacy slot + 0 EJS leak + ad 周邊無 undefined/null）；per-target P1–P4（noindex 計數 / affiliate box min|exact〔we-media `min:1`+sponsored rel 不弱化既有保障、daily-reading `exact:0`〕/ related-links 存在性 / 位置 anchor）。位置 anchor 一律以**相對順序**斷言（we-media：affiliate-bottom < ad < related-links；daily-reading：body < ad < hashtags），**不依賴 exact line number / 絕對 offset**；**不**斷言 live-only `data-ad-status="filled"`。settings-level invariant（enabled + articleAd6 anchor `beforeRelatedLinks` + surfaces 含 blogger）抽為 target-independent S1 跑一次。輸出每行帶 `[slug] case`，失敗可定位是哪一篇。preflight：缺 artifact → 該 target FAIL 並提示 `npm run build:blogger`，**不 auto-build**。**僅改 `check-blogger-adsense-output.js`（+本 CLAUDE.md ledger）**；未改 content/settings/fixtures/views/templates/package/lockfile/docs/dist/gh-pages/`.cache`/任何文章檔。acceptance：`build:blogger` ok → `check:blogger-adsense-output` **29/0**（1 settings + 14×2 target；both slug covered）、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**、`validate:content` **0/94/84**；guard source grep 0 個 real `ca-pub-<digits>` / real slot digit literal（real id 僅從 `ads.config.json` 讀）。**未開 Blogger / AdSense 後台、未 repost / publish / 外部前台驗證、未 deploy / push gh-pages、未 commit dist-blogger、未新增/hardcode real id、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。** `daily-reading-habit-notes` 自此由 manually-verified-only 進入 automated-guard-covered；`github-pages-blog-planning`（第二篇 live PASS）仍 **未**納入 guard（第二階段擴充候選）。**Recommended next phase** = `20260612-XX-blogger-adsense-guard-coverage-expand-github-pages-blog-planning-a`（把第三個 live-verified target 納入 `TARGETS`；會改 guard source → NOT docs-only）；或 Phase F batch-1 expansion / 保守 pause。**Blogger AdSense output guard coverage expand landed（20260612-am-11，HEAD pre `be6945c`）**：執行 am-10 推薦之第三 target 擴充，在 `src/scripts/check-blogger-adsense-output.js` 之 `TARGETS` array **新增第三個** live/manual-verified target `github-pages-blog-planning`（second-post night-1 live PASS；tech-note，github 主寫 cross-publish 至 Blogger，bloggerMode flip 為 full）。**先 `build:blogger` 後只讀量測** generated `dist-blogger/posts/github-pages-blog-planning/post.html`：articleAd6 **1** / articleAd1–5 **0** / 全 legacy slot **0**（frontmatter `adsenseTop`/`adsenseBottom`/`relatedPosts:true` **不**產生 Blogger legacy slot 或 related-links markup）/ noindex **0** / affiliate-box **0** / related-links **0** / hashtags **1** / EJS leak **false** / 順序 body(1958)<ad(2148)<hashtags(2481) / client+slot strict-equal `ads.config.json` → 與 `daily-reading-habit-notes` 同型（最簡形態），故 expectation = articleAd6 1 / articleAd1to5 0 / noindex 0 / affiliateBox `{exact:0}` / relatedLinks false / positionAnchor `hashtags`（**依實測填寫，未猜**）。既有 P1–P4 已涵蓋此型 → **僅新增 target entry，未改任何 check 邏輯，未弱化 we-media-myself2 / daily-reading-habit-notes 既有 assert**。輸出每行帶 `[slug] case`，三 target slug 清楚可辨。**僅改 `check-blogger-adsense-output.js`（+本 CLAUDE.md ledger）**；未改 content/settings/fixtures/views/templates/package/lockfile/docs/dist/gh-pages/`.cache`/任何文章檔。acceptance：`build:blogger` ok → `check:blogger-adsense-output` **43/0**（1 settings + 14×3 target；三 slug 全覆蓋）、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**、`validate:content` **0/94/84**；guard source grep 0 個 real `ca-pub-<digits>` / real slot digit literal（real id 僅從 `ads.config.json` 讀）。**未開 Blogger / AdSense 後台、未 repost / publish / 外部前台驗證、未 deploy / push gh-pages、未 commit dist-blogger、未新增/hardcode real id、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。** 三篇 live-verified Blogger AdSense post（we-media-myself2 複雜 / daily-reading-habit-notes life-note / github-pages-blog-planning tech-note）自此全進 automated guard。**Recommended next phase** = Phase F batch-1 expansion plan（docs-only；規劃再 2–4 篇 low-risk full post）；或保守 pause / 並行新 low-risk post 撰寫。**Blogger AdSense Phase F Batch 1 expansion plan landed（20260612-am-12，docs-only `docs/20260612-blogger-adsense-phase-f-batch-1-expansion-plan.md`；baseline HEAD `0164ab5`）**：規劃如何從 1 篇 Batch 1a（`daily-reading-habit-notes`）擴展到正式 Batch 1 之 3～5 篇 low-risk full posts。**現況**：Batch 0 lock 2 篇（we-media-myself2 / github-pages-blog-planning）；Batch 1a 成功 1 篇（daily-reading）；guard 覆蓋全 3 篇（43/0）；正式 Batch 1 eligible（非 Batch 0、ready、full、indexable、non-placeholder）**僅 daily-reading 1 篇** → 差 2～4 篇。**zero-drift 硬限制**（read-only 自 categories.json / tags.json）：Blogger-valid category=`tech-note`/`book-review`/`download`/`life-note`、Blogger-valid tag=`book`/`book-review`/`reading-notes`/`self-growth`；tech-note 既有 tag（github/vite/static-site）皆 github-only→tech-note Blogger post 會 tag-site-mismatch → **zero-drift 新 Blogger full post 實務集中於 `life-note`+`reading-notes`/`self-growth`**。**候選 5 個**（E.1–E.5，皆 life-note/full/indexable/0-commerce/0-asset、slug 已對 inventory 不碰撞）：after-work-writing-time-blocking / reading-notes-three-questions / how-i-choose-what-to-read-next / phone-away-reading-time（皆 zero-drift）+ why-local-markdown-first（tech-note，⚠️ tag drift 條件式，不納第一波）。**推薦 expansion set = 3 篇新文章**（reading-notes-three-questions + after-work-writing-time-blocking + how-i-choose-what-to-read-next）+ daily-reading = **4 篇**（落在 3～5）；4 主題軸區隔（習慣/筆記/時間寫作/選書）但**誠實標示仍同屬 life-note 閱讀・自我成長家族**（zero-drift 約束所致；真正跨領域須另開 tags.json settings phase，本 plan 不為多樣性硬塞 tech-note/book-review）。**per-post 序列**：每篇獨立 content phase（single new file）→ generated-HTML 驗證 → repost packet（docs-only）→ user manual repost → verification record → live PASS 後加入 guard `TARGETS`（複用 daily-reading 之 P1–P4 模板：articleAd6 1 / articleAd1to5 0 / noindex 0 / affiliateBox exact 0 / relatedLinks false / positionAnchor hashtags）→ 重複至 3～5 篇 → 才考慮 Batch 2。**每篇 acceptance**：only one new post file / no source-settings-template drift / no AdSense id mutation / validate 0-err + production warnings 0 / build:blogger ok / dist post.html full+indexable+articleAd6=1 / articleAd1–5=0 / no EJS leak / no affiliate unless planned / manual repost separate phase。**risks/stop**：validation warning / settings drift / noindex 誤入 / download 誤用 / dist missing bottom slot / Blogger sanitizer strip / layout break / duplicate slot / container-exists-but-unfilled（首載 no-fill 屬正常，不 rollback repo）→ 各對應 STOP/pause。**Non-actions**：未新增文章檔、未改 content/frontmatter/src/settings/template/views/fixtures/package/lockfile/dist/gh-pages/.cache、未開 Blogger/AdSense 後台、未 repost/publish/外部前台驗證、未新增/hardcode real id、未 commit dist、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 plan doc + 本 CLAUDE.md 極小 ledger sync。acceptance：`validate:content` **0/94/84**、`check:blogger-adsense-output` **43/0**、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Recommended next phase** = K1 `20260612-XX-blogger-content-reading-notes-three-questions-one-post-content-a`（撰寫 expansion 第 1 篇，single new file，須 user approval）；或 K3 batch-1 rollout readiness（docs-only，≥3 eligible 後）/ K4 guard-coverage expand（live PASS 後納 slug）/ K5 保守 pause。**Batch 1 expansion post #1 landed（20260612-am-13 `20260612-am-13-blogger-content-reading-notes-three-questions-one-post-content-a`；baseline HEAD `198b8b5`）**：執行 am-12 推薦之 K1，per user explicit approval **新增單 1 檔** `content/blogger/posts/20260612-reading-notes-three-questions.md`（title「讀完一本書後，我會問自己的 3 個問題」/ slug `reading-notes-three-questions` / contentKind `life-note`〔normal article〕/ category `life-note` + tags `reading-notes`,`self-growth`〔皆 Blogger-valid，0 settings drift〕/ `publishTargets.blogger.enabled:true` `mode:"full"` + `github.enabled:false` / `status:"ready"` `draft:false` / cover 重用既有 `/images/placeholders/cover-placeholder.svg`〔0 新素材〕/ **無** `seo.indexing`（indexable）/ **無** affiliate / commerce ref / book / download / fileUrl / 外部連結；frontmatter schema 完全 mirror `daily-reading-habit-notes`；body 約 1200 字真實繁中文章，開頭 +「問題一：這本書讓我重新注意到什麼」+「問題二：哪個觀點跟我現在的生活有關」+「問題三：我能不能做一個很小的改變」+「三個問題都答不出來呢」+ 結尾，非 TODO / placeholder / demo；無政策敏感 / 無收益醫療投資承諾）。**僅此 1 新檔；未改任何既有 post / src / settings〔含 categories.json / tags.json / ads.config.json〕/ views / templates / fixtures / package / lockfile / guard。** acceptance：`validate:content` **0/94/84 不變**（新 post 觸發 0 production warning）；`build:blogger` ok；generated `dist-blogger/posts/reading-notes-three-questions/post.html` read-only evidence：full/full、articleAd6 **1** / articleAd1–5 **0** / 全 legacy slot **0** / noindex **0** / affiliate-box **0** / related-links **0** / hashtags **1** / EJS leak **false** / client+slot strict-equal `ads.config.json` / 順序 body(1901)<ad(3972)<hashtags(4305)。guard carry：`check:adsense-article-block` **13/0** / `check:adsense-anchor-wiring` **14/0** / `check:blogger-adsense-output` **43/0**（仍 3 target；**未**涵蓋本新 post → 本 post 為 manually-evidenced，not yet automated-guard-covered；納入 guard 須 live verified 後另開 K4 phase）/ `check:adsense-resolver` **34/0**。**該 post 現成為 Blogger AdSense Batch 1 expansion 候選 #1**（full + indexable + ready + non-placeholder + 0 commerce + 0 drift）。**Non-actions**：未 repost / publish / 開 Blogger / 開 AdSense 後台 / 外部前台驗證、未 deploy / push gh-pages、未改 guard / source / settings / template、未新增/hardcode real id、未 commit dist、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。實際 Blogger 重貼仍 🔴 BLOCKED（另開 execution phase + user approval + 備份 + theme CSS）。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Recommended next phase** = K2 `20260612-XX-blogger-content-after-work-writing-time-blocking-one-post-content-a`（撰寫 expansion 第 2 篇）；或本 post 之 generated-HTML dry-run / repost packet（docs-only）；保守 pause。**Batch 1 expansion #1 repost packet landed（20260612-am-14，docs-only `docs/20260612-blogger-adsense-batch-1-reading-notes-repost-packet.md`；baseline HEAD `49ee140`）**：為 am-13 新增之 `reading-notes-three-questions`（Batch 1 expansion 候選 #1）打包 manual repost packet（mirror am-7 Batch 1a packet）。涵蓋 A baseline / B candidate summary + why-eligible（full/indexable/ready/non-placeholder/0-commerce/0-external-links/0-drift）+ 與既有 3 篇 live-verified 形態關係（與 daily-reading 同最簡 life-note 形態）+ **明文：本文件不代表已完成 Blogger 外部重貼、尚未 live verified、尚未納 guard** / C generated-artifact 重驗 / D manual repost steps（含 6 項 pre-repost inputs + HTML 模式 + sanitizer strip→立即停止）/ E copy-paste notes（唯一來源 `dist-blogger/posts/reading-notes-three-questions/post.html`；不塞完整 HTML；sanity one-liner）/ F manual verification checklist / G acceptance（即使 real ad blank 亦可接受；only after live PASS 才納 guard TARGETS）/ H rollback / I post-repost record template / J next-phase / K guardrails / L real-id masking。**repo-side re-verification 全 PASS**：`validate:content` **0/94/84**、`build:blogger` ok、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**、`check:blogger-adsense-output` **43/0**（仍 3 target，**未**含本 post）；`dist-blogger/posts/reading-notes-three-questions/post.html` = full/full + articleAd6 **1** / articleAd1–5 **0** / legacy **0** / noindex **0** / affiliate-box **0** / related-links **0** / hashtags **1** / EJS leak false / client+slot strict-equal `ads.config.json` / 順序 body(1901)<ad(3972)<hashtags(4305)；meta.json/copy-helper.txt/publish-checklist.txt 皆存在。**Non-actions**：未開 Blogger / 編輯器 / AdSense 後台、未 repost / publish / 外部前台驗證、未改任何文章檔（含 reading-notes-three-questions）/ src / settings / template / views / fixtures / package / lockfile / guard scope、未 commit dist-blogger、未 deploy / push gh-pages / `.cache`、未新增/hardcode real id、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 packet doc + 本 CLAUDE.md 極小 ledger sync。實際 repost 仍 🔴 BLOCKED，須 user 完成 §D inputs + explicit approval 另開 execution phase。real id 一律不寫入 CLAUDE.md / docs（僅 `ads.config.json`）。**Recommended next phase** = user 依 packet 手動重貼後 `20260612-XX-blogger-adsense-batch-1-reading-notes-manual-verification-record-docs-only-a`（docs-only verification record）；或並行 K2 expansion 第 2 篇 `after-work-writing-time-blocking` content phase；或保守 pause。**Batch 1 expansion #1 manual verification PASS（20260612-am-15，docs-only record `docs/20260612-blogger-adsense-batch-1-reading-notes-manual-verification-record.md`；baseline HEAD `d53db73`）**：human operator 已於 20260612 11:48 依 am-14 packet 完成 `reading-notes-three-questions`（life-note 最簡形態；Blogger live URL `https://babel-lab.blogspot.com/2026/06/reading-notes-three-questions.html`）之 Blogger 手動重貼 / 發布 + 前台檢查（desktop Chrome + DevTools）。觀察 PASS：desktop OK（廣告顯示正常）/ mobile OK（廣告顯示正常，user manually checked，未附手機截圖）/ 0 layout break / rollback NO；bottom AdSense slot **present** 位於正文結尾之後、hashtags 之前，status = **real ad / filled**（`data-ad-status="filled"`）；DevTools 可見 `ins.adsbygoogle` / `lab-ad-slot` / `lab-ad-slot--articleAd6` / masked `data-ad-client` / masked `data-ad-slot` / `data-ad-status="filled"` + 下方 adsbygoogle loader script 仍存活 → Blogger **未** strip 關鍵 AdSense attrs / script；無 duplicate slot、無 articleAd1–5、無 affiliate/commerce box、無 layout overlap。此為**第四篇** live PASS（繼 Phase D `we-media-myself2` 複雜書評形態、night-1 `github-pages-blog-planning` tech-note 簡形態、am-8 `daily-reading-habit-notes` life-note 形態）。**Caveats**：manual visual / DevTools verification，**非** automated guard；`check:blogger-adsense-output` **仍 3-target**（`we-media-myself2` / `daily-reading-habit-notes` / `github-pages-blog-planning`，本 phase 不動 guard）；`reading-notes-three-questions` = manually verified but not yet automated-guard-covered；mobile 無截圖；real ad fill 為單一 time-point 觀察。**Rollout implication**：目前 Batch 1 low-risk live PASS = `daily-reading-habit-notes` + `reading-notes-three-questions` 兩篇；還可再新增 / 驗證 1～3 篇使正式 Batch 1 達 3～5 篇；不建議立刻全量重貼；維持小批次保守節奏。**Non-actions**：未登入 Blogger / 未開編輯器 / 未碰 AdSense 後台、未 repost / publish / 新外部驗證（僅紀錄 user 提供結果）、未改任何 post/frontmatter/content、未改 src/settings/template/views/fixtures/package/lockfile/guard scope、未 commit dist / 截圖、未 deploy / push gh-pages / `.cache`、未新增/hardcode real AdSense id、未做 guard 參數化、未做 CLAUDE.md compression、未用 `/memory`、未做 unrelated cleanup。唯一 mutation = 該 record doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` 0/94/84。**Recommended next phase** = `20260612-XX-blogger-adsense-guard-coverage-expand-add-reading-notes-target-a`（把 `reading-notes-three-questions` 加入 guard `TARGETS`；NOT docs-only）；或 K2 expansion 第 2 篇 `after-work-writing-time-blocking` content phase；或 batch-1 rollout readiness（docs-only）；或剩餘候選順序 plan（docs-only）；或保守 pause。**Blogger AdSense output guard coverage expand — 4th target（20260612-pm-1，HEAD pre `322ac80`）**：執行 am-15 推薦之 guard target addition，在 `src/scripts/check-blogger-adsense-output.js` 之 `TARGETS` array **新增第四個** live/manual-verified target `reading-notes-three-questions`（am-15 Batch 1 expansion #1 live PASS；life-note 最簡形態）。**先 `build:blogger` 後只讀量測** generated `dist-blogger/posts/reading-notes-three-questions/post.html`：articleAd6 **1** / articleAd1–5 **0** / 全 legacy slot **0** / noindex **0** / affiliate-box **0** / related-links **0** / hashtags **1** / EJS leak **false** / client+slot strict-equal `ads.config.json` / data-ad-format auto + full-width-responsive true / 順序 body(1901)<ad(3972)<hashtags(4305) → 與 `daily-reading-habit-notes` / `github-pages-blog-planning` 同型（最簡形態），故 expectation = articleAd6 1 / articleAd1to5 0 / noindex 0 / affiliateBox `{exact:0}` / relatedLinks false / positionAnchor `hashtags`（**依實際量測填寫，未猜**）。既有 C1–C10 共同斷言 + P1–P4 per-target 已涵蓋此型 → **僅新增 target entry（+16 行，0 刪除），未改任何 check 邏輯，未弱化既有三 target（we-media-myself2 / daily-reading-habit-notes / github-pages-blog-planning）之 assertion**。輸出每行帶 `[slug] case`，四 target slug 清楚可辨。**僅改 `check-blogger-adsense-output.js`（+本 CLAUDE.md ledger）**；未改 content/settings/fixtures/views/templates/package/lockfile/docs/dist/gh-pages/`.cache`/任何文章檔。acceptance：`build:blogger` ok → `check:blogger-adsense-output` **57/0**（1 settings + 14×4 target；四 slug 全覆蓋）、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**、`validate:content` **0/94/84**；guard source grep 0 個 real `ca-pub-<digits>` / real slot digit literal（real id 僅從 `ads.config.json` 讀）。**未開 Blogger / AdSense 後台、未 repost / publish / 外部前台驗證、未 deploy / push gh-pages、未 commit dist-blogger、未新增/hardcode real id、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。** 四篇 live-verified Blogger AdSense post（we-media-myself2 複雜 / daily-reading-habit-notes life-note / github-pages-blog-planning tech-note / reading-notes-three-questions life-note）自此全進 automated guard。**Recommended next phase** = `20260612-XX-blogger-content-after-work-writing-time-blocking-one-post-content-a`（Batch 1 expansion post #2）；或 batch-1 rollout readiness（docs-only）；或保守 pause。**Batch 1 expansion post #2 landed（20260612-pm-2 `20260612-pm-2-blogger-content-after-work-writing-time-blocking-one-post-content-a`；baseline HEAD `e656684`）**：執行 pm-1 推薦之 expansion #2，per user explicit approval **新增單 1 檔** `content/blogger/posts/20260612-after-work-writing-time-blocking.md`（title「下班後，我用一小段時間整理自己的想法」/ slug `after-work-writing-time-blocking` / contentKind `life-note`〔normal article〕/ category `life-note` + tags `reading-notes`,`self-growth`〔皆 Blogger-valid，0 settings drift〕/ `publishTargets.blogger.enabled:true` `mode:"full"` + `github.enabled:false` / `status:"ready"` `draft:false` / cover 重用既有 `/images/placeholders/cover-placeholder.svg`〔0 新素材〕/ **無** `seo.indexing`（indexable）/ **無** affiliate / commerce ref / book / download / fileUrl / 外部連結；frontmatter schema 完全 mirror `reading-notes-three-questions` / `daily-reading-habit-notes`；body 約 1200 字真實繁中文章，開頭 + 不要把它當成正式寫作 + 時間不需要長（十/十五分鐘）+ 寫今天在意的一件事/真正想處理什麼 + 不是為了立刻找答案而是不被情緒帶著走 + 只寫幾行也比不整理好 + 結尾「把生活拿回來」，非 TODO / placeholder / demo；無政策敏感 / 無收益醫療投資承諾 / 無外部連結）。**僅此 1 新檔；未改任何既有 post / src / settings〔含 categories.json / tags.json / ads.config.json〕/ views / templates / fixtures / package / lockfile / guard。** acceptance：`validate:content` **0/94/84 不變**（新 post 觸發 0 production warning）；`build:blogger` ok；generated `dist-blogger/posts/after-work-writing-time-blocking/post.html` read-only evidence：full/full、articleAd6 **1** / articleAd1–5 **0** / 全 legacy slot **0** / noindex **0** / affiliate-box **0** / related-links **0** / hashtags **1** / EJS leak **false** / client+slot strict-equal `ads.config.json` / 順序 body(1895)<ad(3744)<hashtags(4077)。guard carry：`check:adsense-resolver` **34/0** / `check:adsense-article-block` **13/0** / `check:adsense-anchor-wiring` **14/0** / `check:blogger-adsense-output` **57/0**（仍 4 target；**未**涵蓋本新 post → 本 post 為 manually-evidenced，not yet automated-guard-covered；納入 guard 須 live verified 後另開 phase）。**該 post 現成為 Blogger AdSense Batch 1 expansion 候選 #2**（full + indexable + ready + non-placeholder + 0 commerce + 0 drift）。**Non-actions**：未 repost / publish / 開 Blogger / 開 AdSense 後台 / 外部前台驗證、未 deploy / push gh-pages、未改 guard / source / settings / template、未新增/hardcode real id、未 commit dist、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。實際 Blogger 重貼仍 🔴 BLOCKED（另開 execution phase + user approval + 備份 + theme CSS）。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Recommended next phase** = user 依 repost packet 手動重貼後之 verification record（docs-only）；或本 post 之 repost packet（docs-only）；或 batch-1 rollout readiness（docs-only，現有 2 篇 low-risk live PASS + 本第 3 篇 candidate）；或 expansion 第 3 篇 `how-i-choose-what-to-read-next` content phase；或保守 pause。**Batch 1 expansion #2 repost packet landed（20260612-pm-3，docs-only `docs/20260612-blogger-adsense-batch-1-after-work-writing-repost-packet.md`；baseline HEAD `5936fb3`）**：為 pm-2 新增之 `after-work-writing-time-blocking`（Batch 1 expansion 候選 #2）打包 manual repost packet（mirror am-14 reading-notes packet）。涵蓋 A baseline / B candidate summary + why-eligible（full/indexable/ready/non-placeholder/0-commerce/0-external-links/0-drift）+ 與既有 4 篇 live-verified 形態關係（與 daily-reading / reading-notes 同最簡 life-note 形態）+ **明文：本文件不代表已完成 Blogger 外部重貼、尚未 live verified、尚未納 guard** / C generated-artifact 重驗 / D manual repost steps（含 6 項 pre-repost inputs + HTML 模式 + sanitizer strip→立即停止）/ E copy-paste notes（唯一來源 `dist-blogger/posts/after-work-writing-time-blocking/post.html`；不塞完整 HTML；sanity one-liner）/ F manual verification checklist / G acceptance（即使 real ad blank 亦可接受；only after live PASS 才納 guard TARGETS）/ H rollback / I post-repost record template / J next-phase / K guardrails / L real-id masking。**repo-side re-verification 全 PASS**：`validate:content` **0/94/84**、`build:blogger` ok、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**、`check:blogger-adsense-output` **57/0**（仍 4 target，**未**含本 post）；`dist-blogger/posts/after-work-writing-time-blocking/post.html` = full/full + articleAd6 **1** / articleAd1–5 **0** / legacy **0** / noindex **0** / affiliate-box **0** / related-links **0** / hashtags present / EJS leak false / client+slot strict-equal `ads.config.json` / 順序 body(1895)<ad(3744)<hashtags(4077)；meta.json/copy-helper.txt/publish-checklist.txt 皆存在。**Non-actions**：未開 Blogger / 編輯器 / AdSense 後台、未 repost / publish / 外部前台驗證、未改任何文章檔（含 after-work-writing-time-blocking）/ src / settings / template / views / fixtures / package / lockfile / guard scope、未 commit dist-blogger、未 deploy / push gh-pages / `.cache`、未新增/hardcode real id、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 packet doc + 本 CLAUDE.md 極小 ledger sync。實際 repost 仍 🔴 BLOCKED，須 user 完成 §D inputs + explicit approval 另開 execution phase。real id 一律不寫入 CLAUDE.md / docs（僅 `ads.config.json`）。**Recommended next phase** = user 依 packet 手動重貼後 `20260612-XX-blogger-adsense-batch-1-after-work-writing-manual-verification-record-docs-only-a`（docs-only verification record）；或並行 expansion 第 3 篇 `how-i-choose-what-to-read-next` content phase；或保守 pause。**Batch 1 expansion #2 manual verification PASS（20260612-pm-4，docs-only record `docs/20260612-blogger-adsense-batch-1-after-work-writing-manual-verification-record.md`；baseline HEAD `42cc052`）**：human operator 已於 20260612 12:25 依 pm-3 packet 完成 `after-work-writing-time-blocking`（life-note 最簡形態；Blogger live URL `https://babel-lab.blogspot.com/2026/06/after-work-writing-time-blocking.html`）之 Blogger 手動重貼 / 發布 + 前台檢查（Chrome 小版 / 窄版 + DevTools）。觀察 PASS：desktop OK（廣告顯示正常）/ mobile OK（廣告顯示正常，user manually checked，未附手機截圖）/ 0 layout break / rollback NO；bottom AdSense slot **present** 位於正文結尾之後、hashtags 之前，status = **real ad displayed / filled**（`data-ad-status="filled"`）；DevTools 可見 `ins.adsbygoogle` / `lab-ad-slot` / `lab-ad-slot--articleAd6` / masked `data-ad-client` / masked `data-ad-slot` / `data-ad-status="filled"` + ad iframe / creative iframe + adsbygoogle loader 仍存活 → Blogger **未** strip 關鍵 AdSense attrs / script；無 duplicate slot、無 articleAd1–5、無 affiliate/commerce box、無 layout overlap。DevTools console 之瀏覽器 / ad iframe 相關訊息因前台廣告正常顯示且版面未破，**不**記為阻斷問題（per user 指示）。此為**第五篇** live PASS（繼 Phase D `we-media-myself2` 複雜書評形態、night-1 `github-pages-blog-planning` tech-note 簡形態、am-8 `daily-reading-habit-notes` life-note 形態、am-15 `reading-notes-three-questions` life-note 最簡形態）。**Rollout implication**：目前 Batch 1 low-risk live PASS = `daily-reading-habit-notes` + `reading-notes-three-questions` + `after-work-writing-time-blocking` **三篇 → 已達正式 Batch 1 之 3 篇下限**（per am-12 expansion plan 3～5 篇）；仍不建議立刻全量重貼，維持小批次保守節奏。**Caveats**：manual visual / DevTools verification，**非** automated guard；`check:blogger-adsense-output` **仍 4-target**（`we-media-myself2` / `daily-reading-habit-notes` / `github-pages-blog-planning` / `reading-notes-three-questions`，本 phase 不動 guard）；`after-work-writing-time-blocking` = manually verified but not yet automated-guard-covered；mobile 無截圖、DevTools 無截圖（desktop Chrome 截圖已附）；real ad fill 為單一 time-point 觀察。**Non-actions**：未登入 Blogger / 未開編輯器 / 未碰 AdSense 後台、未 repost / publish / 新外部驗證（僅紀錄 user 提供結果）、未改任何 post/frontmatter/content、未改 src/settings/template/views/fixtures/package/lockfile/guard scope、未 commit dist / 截圖、未 deploy / push gh-pages / `.cache`、未新增/hardcode real AdSense id、未做 guard 參數化、未做 CLAUDE.md compression、未用 `/memory`、未做 unrelated cleanup。唯一 mutation = 該 record doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` 0/94/84。**Recommended next phase** = `20260612-XX-blogger-adsense-guard-add-after-work-writing-target-a`（把 `after-work-writing-time-blocking` 加入 guard `TARGETS`；NOT docs-only）；或 `20260612-XX-blogger-adsense-batch-1-rollout-readiness-docs-only-a`（三篇 live PASS 後評估正式 Batch 1 readiness，docs-only）；或 expansion 第 3 篇 `how-i-choose-what-to-read-next` content phase；或剩餘候選順序 plan（docs-only）；或保守 pause。**Blogger AdSense output guard coverage expand — 5th target（20260612-pm-5，HEAD pre `313314b`）**：執行 pm-4 推薦之 guard target addition，在 `src/scripts/check-blogger-adsense-output.js` 之 `TARGETS` array **新增第五個** live/manual-verified target `after-work-writing-time-blocking`（pm-4 Batch 1 expansion #2 live PASS；life-note 最簡形態）。**先 `build:blogger` 後只讀量測** generated `dist-blogger/posts/after-work-writing-time-blocking/post.html`：articleAd6 **1** / articleAd1–5 **0** / 全 legacy slot **0** / noindex **0** / affiliate-box **0** / related-links **0** / hashtags **1** / EJS leak **false** / client+slot strict-equal `ads.config.json` / data-ad-format auto + full-width-responsive true / 順序 body(1895)<ad(3744)<hashtags(4077) → 與 `daily-reading-habit-notes` / `github-pages-blog-planning` / `reading-notes-three-questions` 同型（最簡形態），故 expectation = articleAd6 1 / articleAd1to5 0 / noindex 0 / affiliateBox `{exact:0}` / relatedLinks false / positionAnchor `hashtags`（**依實際量測填寫，未猜**）。既有 C1–C10 共同斷言 + P1–P4 per-target 已涵蓋此型 → **僅新增 target entry（+16 行，0 刪除），未改任何 check 邏輯，未弱化既有四 target（we-media-myself2 / daily-reading-habit-notes / github-pages-blog-planning / reading-notes-three-questions）之 assertion**。輸出每行帶 `[slug] case`，五 target slug 清楚可辨。**僅改 `check-blogger-adsense-output.js`（+本 CLAUDE.md ledger）**；未改 content/settings/fixtures/views/templates/package/lockfile/docs/dist/gh-pages/`.cache`/任何文章檔。acceptance：`build:blogger` ok → `check:blogger-adsense-output` **71/0**（1 settings + 14×5 target；五 slug 全覆蓋）、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**、`validate:content` **0/94/84**；guard source grep 0 個 real `ca-pub-<digits>` / real slot digit literal（real id 僅從 `ads.config.json` 讀）。**未開 Blogger / AdSense 後台、未 repost / publish / 外部前台驗證、未 deploy / push gh-pages、未 commit dist-blogger、未新增/hardcode real id、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。** 五篇 live-verified Blogger AdSense post（we-media-myself2 複雜 / daily-reading-habit-notes life-note / github-pages-blog-planning tech-note / reading-notes-three-questions life-note / after-work-writing-time-blocking life-note）自此全進 automated guard。**Recommended next phase** = `20260612-XX-blogger-adsense-batch-1-rollout-readiness-docs-only-a`（三篇 low-risk live PASS〔daily-reading / reading-notes / after-work-writing〕已達正式 Batch 1 之 3 篇下限，docs-only 評估 readiness）；或 expansion 第 3 篇 `how-i-choose-what-to-read-next` content phase；或保守 pause。**Blogger AdSense Batch 1 rollout readiness assessment landed（20260612-pm-6，docs-only `docs/20260612-blogger-adsense-batch-1-rollout-readiness.md`；baseline HEAD `1cc0ab2`）**：評估 Batch 1 是否可視為完成 / ready。**verification inventory**：live-verified Blogger AdSense post **5 篇**（Batch 0 = `we-media-myself2` 複雜書評 + `github-pages-blog-planning` tech-note；Batch 1 low-risk = `daily-reading-habit-notes` + `reading-notes-three-questions` + `after-work-writing-time-blocking` 三篇 life-note），automated guard `TARGETS` 覆蓋 **5/5**。**readiness verdict**：3 篇 low-risk live PASS 全部滿足 full / indexable / ready / non-placeholder / 0 download / 0 noindex / 0 affiliate / 0 commerce / no layout break / no duplicate slot / guard covered → **Batch 1 minimum 視為完成 / ready**；**但不直接全量 rollout**（Batch 2 須另開 preanalysis，不可直接執行）。**guard readiness**：`check:blogger-adsense-output` 5 targets / 71/0；3 篇 low-risk + 複雜 legacy form + tech-note form 皆 represented；real id 不 hardcode（從 `ads.config.json` 讀）；guard 為 repo-side safety，不取代 live verification。**risk**：real ad fill 時變 / mobile 僅 user-reported 無截圖 / 只 3 篇 low-risk 未涵蓋全形態 / 無 download·noindex·commerce-heavy Batch 1 / Blogger sanitizer 未來可能變 / 新文章仍須 per-post generated HTML + live verification / Batch 2 不可略過 manual verification。**decision options**：A 接受 3 篇 minimum complete 並 pause（→ completion record）／ B 補第 4 篇 low-risk（`how-i-choose-what-to-read-next`）／ C 啟動 Batch 2 preanalysis 但不執行。**保守推薦**：將 Batch 1 minimum 視為完成；不立即全量 rollout；先做 Batch 1 completion record docs-only（Option A 主線）；有時間再補第 4 篇（Option B）；Batch 2 需另開 preanalysis（Option C 僅規劃）。**Batch 1 complete acceptance**：第 2–6 項（3 篇 live PASS / guard-covered / validate·checks pass / no drift / no pending rollback）已達成；第 1、7 項（completion record doc + user 確認）待 Option A phase。**Non-actions**：未新增文章 / 未改 content·frontmatter·source·settings·template·guard·fixtures·views·package·lockfile·dist·gh-pages·.cache、未登入 Blogger / 未 repost / 未 publish / 未外部前台驗證、未改 real AdSense id、未 commit dist、未做 Batch 2 implementation、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 readiness doc + 本 CLAUDE.md 極小 ledger sync。acceptance：`validate:content` **0/94/84**、`check:blogger-adsense-output` **71/0**、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Recommended next phase** = `20260612-XX-blogger-adsense-batch-1-completion-record-docs-only-a`（Option A 主線；正式宣告 Batch 1 minimum complete）；或補第 4 篇 `how-i-choose-what-to-read-next` content phase；或 Batch 2 preanalysis（docs-only，不執行）；或 post-batch-1 monitoring checklist（docs-only）；或保守 pause。**Blogger AdSense Batch 1 completion record landed（20260612-pm-7，docs-only `docs/20260612-blogger-adsense-batch-1-completion-record.md`；baseline HEAD `ef78db2`）**：正式宣告 **Blogger AdSense Batch 1 minimum COMPLETE / READY**。**completion basis** = 3 篇 low-risk posts live PASS（`daily-reading-habit-notes` 20260612 10:48 / `reading-notes-three-questions` 11:48 / `after-work-writing-time-blocking` 12:25；皆 life-note、full、indexable、ready、non-placeholder、0 affiliate/commerce/download/noindex、bottom slot real ad filled、no layout break、no duplicate slot、guard-covered）+ all guard-covered + validation/checks pass。**明確 caveat**：不代表 Batch 2 / 全量 rollout 完成、不代表所有 Blogger post 已重貼、不代表 AdSense fill 對所有 user/device/time 保證。**wider verified inventory = 5 篇** live/manual verified + guard-covered（we-media-myself2 complex affiliate/related-links form + github-pages-blog-planning tech-note form + 三篇 life-note minimal form；**尚未涵蓋** download/page/comic/noindex/commerce-heavy）。**acceptance F**：3 篇 live PASS / full·indexable·ready·non-placeholder / no download·noindex·affiliate·commerce / live verified / no layout break / no duplicate slot / guard-covered / validate·checks pass / no pending rollback 全 **PASS**；user accepted Batch 1 minimum complete = **ACCEPTED**（baseline matches `ef78db2`）。**explicit non-completions**：Batch 2 未開始 / 全量 repost 未開始 / download·noindex·commerce-heavy 未納入 / deferred·draft posts 未解鎖 / 非所有文章 live verified / real ad fill 仍依 AdSense 變動 / monitoring checklist 尚未建立。**Non-actions**：未新增文章 / 未改 content·frontmatter·source·settings·template·guard·fixtures·views·package·lockfile·dist·gh-pages·.cache、未登入 Blogger / 未 repost / 未 publish / 未外部前台驗證、未改 real AdSense id、未 commit dist、未做 Batch 2 / monitoring implementation、未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。唯一 mutation = 該 completion record doc + 本 CLAUDE.md 極小 ledger sync。acceptance：`validate:content` **0/94/84**、`check:blogger-adsense-output` **71/0**、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Recommended next step** = conservative pause / idle freeze（保守預設）；或 post-batch-1 monitoring checklist（docs-only）；或 Batch 2 preanalysis（docs-only，不執行）；或補第 4 篇 low-risk `how-i-choose-what-to-read-next`（須 user approval）；未來 content expansion 一律保持 per-post repost packet + manual verification record + guard add 序列。**Batch 1 post-rollout monitoring checklist landed（20260612-pm-8，docs-only `docs/20260612-blogger-batch1-post-rollout-monitoring-checklist.md`；baseline HEAD `c6df076`）**：執行 pm-7 §I.2 推薦之 monitoring checklist。記錄 user 本 session 新人工觀察 ——「測試頁面連結尚未對外公開，但 Blogger 前台 VIEW 數仍有增加」，並展開 §E 可能解釋（E.1 Google/Blogger/AdSense crawler、E.2 Blogger platform internal preview/fetch/stats delay/recount、E.3 自己多裝置 self-traffic、E.4 少量外部 discoverability 但不可誇大）、§F 不可下的結論（**不可**把 view count 增加直接視為真實自然流量 / AdSense impression·click·earning，**不可**據此立即擴大發文，**Blogger VIEW 數不能單獨當作 AdSense 成效或真實流量判斷依據**）、§G monitoring checklist（Blogger post front-end 檢查 + AdSense slot 是否出現〔`articleAd6` / `ins.adsbygoogle` / `data-ad-status` filled|unfilled / loader script / 位置〕+ 訊號交叉比對不單看 view count + 異常處置）、§H next phases（保守＝keep monitoring docs-only；optional＝Batch 2 preanalysis docs-only / 4th low-risk post plan；不建議＝直接大批量 publish / 直接改 AdSense source / 直接改 template）。**未改 source / template / EJS / renderer / content production post / settings（含 `ads.config.json`）/ guard / fixtures / views / package / lockfile / dist / gh-pages / `.cache`；未登入 Blogger / 未 repost / 未 publish / 未改 real AdSense id / 未做 GA4 實作 / 未 deploy / 未 npm install / 未做 Batch 2 實作 / 未做第 4 篇發文 / 未把 VIEW 增加判定為真實流量 / 未做 CLAUDE.md compression / 未用 `/memory` / 未做 unrelated cleanup。** 唯一 mutation = 該 monitoring checklist doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**；`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 因 source/settings/dist 無變更而 carry forward。**Recommended next phase** = 保守 keep monitoring（docs-only）；或 Batch 2 preanalysis（docs-only，不執行）；或補第 4 篇 low-risk post（須 user approval）。**Batch 2 rollout preanalysis landed（20260612-pm-9，docs-only `docs/20260612-blogger-adsense-batch-2-preanalysis.md`；baseline HEAD `6f307d6`）**：執行 pm-8 §H.2 推薦之 Batch 2 preanalysis（docs-only planning，不發文 / 不重貼）。涵蓋 §D Batch 2 goal（沿用 per-post content→驗證→repost packet→manual repost→verification record→guard add 序列；只 planning）、§E candidate selection principles（低政策風險 / 非醫療高風險·非金融承諾·非敏感誤導 / 內容完整可讀 / 適合長尾搜尋 / 適合 AdSense 但不為廣告硬塞 / 避免過短過舊結構亂需大改寫 / 優先 ready+validate-pass / zero-drift life-note 偏好 / download·noindex·commerce-heavy 暫不納入）、§F readiness checklist（title/slug/excerpt/body 完整 + frontmatter 合理 + 無 EJS leak + 無 broken markdown + 無測試內容 + commerce 不破壞既有規則 + 只沿用 `articleAd6` bottom slot 不新增 slot + repost 前後可人工比對）、§G suggested size（不大量；建議 2–3 篇；**若 Batch 1 仍未穩定觀察則先不執行 Batch 2 只完成候選分析**）、**§G.1 誠實盤點：已存在且立即 eligible 之 Batch 2 候選 = 0**（ready/full 既有文章皆已 Batch 0/1 完成；deferred `portable-blog-system-mvp` + 3 draft 皆有 blocker）→ §G.2 解鎖路徑 A（新增 2–3 篇 low-risk full life-note，推薦）/ 路徑 B（解 deferred/draft，含政策面，不建議首選）、§H risk matrix（AdSense policy / duplicate·repost / Blogger formatting / **crawler·view-count misread（已實際發生 weak signal）** / manual operation / content quality）、§I next phases（conservative continue monitoring〔推薦〕；optional Batch 2 candidate list docs-only / repost packet docs-only / 4th low-risk post plan；not advised mass publish·template/source change·new slot·同 phase GA4）。**核心紅線重申：Blogger VIEW count 增加只能視為 weak signal，不可當作真實流量或 AdSense performance 依據。** **未改 source / template / EJS / renderer / content production post / settings（含 `ads.config.json`）/ guard / fixtures / views / package / lockfile / dist / gh-pages / `.cache`；未 publish / repost / 登入 Blogger / 開 AdSense 後台 / 改 real id / 做 GA4 實作 / deploy / npm install / Batch 2 實作 / 第 4 篇發文 / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量。** 唯一 mutation = 該 preanalysis doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**；`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 因 source/settings/dist 無變更而 carry forward。**Recommended next phase** = 保守 continue monitoring（docs-only）；或 Batch 2 candidate list（docs-only，路徑 A 列 2–3 篇新文候選）；或補第 4 篇 low-risk post（須 user approval）。**Batch 2 new low-risk post candidates plan landed（20260612-pm-10，docs-only `docs/20260612-blogger-batch2-new-low-risk-post-candidates.md`；baseline HEAD `d8b9f4f`）**：執行 pm-9 §G.2 路徑 A（依「現有 eligible Batch 2 候選 = 0」結論，規劃 2–3 篇新低風險 life-note 候選，不硬推 draft/deferred；不新增 content 檔 / 不發文 / 不重貼）。§D candidate principles（低 AdSense policy risk / 非醫療·非金融承諾·非政治敏感·非誇大 AI / 可長尾搜尋 / 真實生活觀察或實用整理 / 不為廣告硬塞 / 適合 Blogger manual repost / 底部自然出現既有 `articleAd6` slot 不新增 slot / 不依賴 GA4·Search Console 才能判斷可否發 / **zero-drift 沿用 am-12 §D.1：category `life-note` + tags `reading-notes`/`self-growth`，不寫成 tech-note 以免 `tag-site-mismatch`** / 0 new asset）。§E 3 篇候選（E.1 `blog-as-personal-knowledge-base` 知識倉庫 P1 / E.2 `ai-tools-simplify-daily-workflow` AI 工具落地心得 P2，明列 policy caution 不得誇大 AI·不點名工具背書·不寫技術深水 / E.3 `blog-restart-steady-rhythm-notes` 部落格重啟先穩定再談其他 P3，policy caution 不承諾流量成長·不把 view count 當 KPI；全 life-note / mode full / indexable / 0 commerce / 0 asset；slug 對既有 post + am-12 proposed slug 確認不碰撞）。§F ranking table（candidate/risk/usefulness/search potential/writing effort/Blogger suitability/recommendation；起手 E.1→E.2→E.3，逐篇撰寫驗證重貼不連發）。§G what not to do（不大量產文 / 不誇大標題 / 不把 VIEW count 當成功指標 / 不為廣告硬拉長 / 不碰醫療·投資承諾·法律保證 / 不在本 phase 寫完整文章）。§H next phases（conservative keep monitoring；optional full article draft docs-only / 1 selected post content file later phase / repost packet docs-only；not advised 同 phase 連寫 3 篇 + 發布）。**未改 source / template / renderer / content production post / settings（含 categories.json/tags.json/ads.config.json）/ guard / fixtures / views / package / lockfile / dist / gh-pages / `.cache`；未 publish / repost / 登入 Blogger / 開 AdSense 後台 / 改 real id / 做 GA4 實作 / deploy / npm install / 直接寫 3 篇完整文章 / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量。** 唯一 mutation = 該 candidate plan doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**；`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守 keep monitoring（docs-only）；或選定 P1（`blog-as-personal-knowledge-base`）full article draft（docs-only）；或經 user approval 後 single new file 落地 1 篇 content phase。**Batch 2 P1 knowledge-base article draft landed（20260612-knowledge-base-article-draft-docs-only-a，docs-only `docs/20260612-blogger-p1-knowledge-base-article-draft.md`；baseline HEAD `0c235c4`）**：執行 pm-10 §H optional（把 P1 候選 `blog-as-personal-knowledge-base` 寫成完整文章草稿供人工審稿，不落地 content / 不發文 / 不重貼）。§C draft metadata proposal（title「為什麼我開始把部落格當成自己的知識倉庫」/ slug `blog-as-personal-knowledge-base` / contentKind `life-note` / category `life-note` + tags `self-growth`,`reading-notes`〔皆 Blogger-valid，0 settings drift〕/ blogger full + indexable / commerce none / assets none / expected slot existing `articleAd6` bottom only；frontmatter 形態 mirror 既有 live `daily-reading-habit-notes`，read-only 參照未改該檔）。§D full article draft（約 1,200 中文字，fenced block；H1 + 6 H2〔以前寫給很多人看 / 先寫給未來的自己 / 工作台 / 留下脈絡 / AI 工具幫整理但想法自己判斷 / 先求穩定再整理成作品〕+ 自然結尾；個人觀察務實溫和、不誇大、無流量·收益·排名承諾、AI 輕描淡寫、無 Claude/phase/commit/HEAD/GitHub 操作細節、無硬 CTA）。§E editorial notes（為何低風險 / 避免誇大的句子 / 可加個人經驗處 / 預設不需補圖 / 初步判斷適合落地但須 user approval 另開 content phase）、§F Blogger·AdSense caution（落地僅用既有 `articleAd6` bottom slot 不新增廣告位 / 不用 VIEW count 判斷成效 / 不寫成流量收益保證）、§G next phases（conservative stop after draft wait human review；optional revise draft docs-only / approval 後 single new file 落地 / 落地後 repost packet docs-only；not advised 同 phase 連寫多篇 + 發布）。**未改 source / template / renderer / content production post / settings（含 categories.json/tags.json/ads.config.json）/ guard / fixtures / views / package / lockfile / dist / gh-pages / `.cache`；未 publish / repost / 登入 Blogger / 開 AdSense 後台 / 改 real id / 做 GA4 實作 / deploy / npm install / 直接寫另外 2 篇完整文章 / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量。** 唯一 mutation = 該 article draft doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**；`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守 stop after draft 等人工審稿；或依審稿意見 revise draft（docs-only）；或經 user approval 後 single new file 落地 `blog-as-personal-knowledge-base` content phase。**Batch 2 P1 draft personal-example revision landed（20260612-pm-13，docs-only `docs/20260612-blogger-p1-knowledge-base-article-draft.md`；baseline HEAD `2ace8d6`）**：依 pm-12 read-only review 建議，修訂 P1 草稿 §D 文章正文，補強 3 處具體個人例子降低通用心得文感（仍 docs-only，不落地 content / 不發文 / 不重貼）：(1)「整理部落格版面」反覆查找例子〔文章底部放什麼 / 封面圖縮多寬不破版，一般讀者語彙，無 repo/build/後台術語〕；(2) self-referential「本文最早只是筆記裡『為什麼老是寫不完一篇文章』的牢騷，後補成完整文章」示範零碎筆記→完整文章；(3) AI 工具具體自我判斷〔被理順段落一句句看過、刪掉語氣太用力 / 非真正想說的〕，維持工具輔助定位不變成推薦文。title / slug `blog-as-personal-knowledge-base` / category `life-note` / tags `self-growth`,`reading-notes` / 低風險定位 / 0 commerce / 0 asset / indexable 全不變；字數約 1,200→1,400（仍 900–1,500 區間）。§E.6 新增修訂 editorial note（補了哪些細節 / 為何仍低風險〔無醫療·投資·政治·法律·誇大、無內部術語、AI 仍輕描淡寫、無流量·收益·排名·AdSense 承諾、0 settings drift〕/ 仍不需補圖 / 仍不需 commerce link）。**未改 source / template / renderer / content production post / settings（含 categories.json/tags.json/ads.config.json）/ guard / fixtures / views / package / lockfile / dist / gh-pages / `.cache`；未 publish / repost / 登入 Blogger / 開 AdSense 後台 / 改 real id / 做 GA4 實作 / deploy / npm install / 改成 AI 工具推薦文 / 加入內部 repo·Claude·phase·commit·HEAD·GitHub 操作細節 / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量。** 唯一 mutation = 該 article draft doc（§0 修訂紀錄 + §D 三段正文 + §D 字數註 + §E.6） + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84 不變**（draft 在 docs/ 非 content post，不入計數）；`check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守等人工複審修訂版；或經 user approval 後 single new file 落地 `blog-as-personal-knowledge-base` content phase；或再依意見 revise（docs-only）。**Batch 2 P1 knowledge-base content landing（20260612-pm-15 `20260612-pm-15-blogger-p1-knowledge-base-content-landing-a`；baseline HEAD `5aa40a4`）**：per user explicit approval，將已審稿通過之 P1 草稿落地為**單一新 content post** `content/blogger/posts/20260612-blog-as-personal-knowledge-base.md`（title「為什麼我開始把部落格當成自己的知識倉庫」/ slug `blog-as-personal-knowledge-base` / contentKind `life-note`〔normal article〕/ category `life-note` + tags `self-growth`,`reading-notes`〔皆 Blogger-valid，0 settings drift〕/ blogger full + indexable / status ready draft false / cover 重用既有 placeholder〔0 new asset〕/ 無 affiliate / commerce ref / book / download / 外部連結；frontmatter 形態 mirror `daily-reading-habit-notes`；body = pm-13 修訂草稿 + pm-15 唯一微調「像剛剛那幾段被理順的文字」→「像那些被理順的段落」）+ landing record doc `docs/20260612-blogger-p1-knowledge-base-content-landing-record.md`。**僅此 1 新 content 檔 + 1 record doc；未改任何既有 post / src / settings〔含 categories.json/tags.json/ads.config.json〕/ views / templates / fixtures / package / lockfile / guard。** acceptance：`validate:content` **0/94/84 不變**（新 post clean 0 觸發；validate 之「on N post(s)」= 有 issue 之 post 數，clean 新 post 不增此計數；新 post 確已納入 blogger ready 4→5 並通過驗證）；`build:blogger` ok；generated `dist-blogger/posts/blog-as-personal-knowledge-base/post.html` read-only evidence：articleAd6 **1** / articleAd1–5 **0** / adsbygoogle ins 1 / EJS leak 0 / undefined·null 0 / noindex 0 / affiliate-box 0 / `data-ad-client`·`data-ad-slot` strict-equal `ads.config.json`（masked compare，未印 real id）/ 順序 body(48)<ad(74)<hashtags(88)。guard carry：`check:blogger-adsense-output` 71/0（仍 5 target，**未**含本新 post → manually-evidenced，not yet automated-guard-covered；納 guard 須 live verified 後另開 phase）/ `check:adsense-resolver` 34/0 / `check:adsense-article-block` 13/0 / `check:adsense-anchor-wiring` 14/0。**該 post 現為 Blogger AdSense Batch 2 候選（full + indexable + ready + non-placeholder + 0 commerce + 0 drift）。** **未 repost / publish / 開 Blogger / 開 AdSense 後台 / 外部前台驗證、未 deploy / push gh-pages、未 commit dist-blogger、未新增/hardcode real id、未一次新增另外 2 篇、未做 CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量。** 實際 Blogger 重貼仍 🔴 BLOCKED（須另開 execution phase + user approval + 備份 + theme CSS）。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Recommended next phase** = 保守 monitoring；或 manual Blogger repost packet（docs-only）；或 P2/P3 draft（docs-only）；live PASS 後 guard coverage expand 納入本 slug。**Batch 2 P1 knowledge-base manual repost packet landed（20260612-pm-16，docs-only `docs/20260612-blogger-p1-knowledge-base-manual-repost-packet.md`；baseline HEAD `2a15c35`）**：為 pm-15 落地之 `blog-as-personal-knowledge-base` 打包 manual Blogger repost packet（mirror am-14 packet 結構；不 repost / 不 publish / 不開 Blogger / 不執行）。§C source content / generated HTML（content path / dist `post.html` / title「為什麼我開始把部落格當成自己的知識倉庫」/ slug / category `life-note` + tags `self-growth`,`reading-notes` / blogger full + indexable / commerce none / assets existing placeholder）+ §C.2 repo-side re-verification（`validate:content` 0/94/84、`build:blogger` ok、articleAd6 **1** / articleAd1–5 **0** / adsbygoogle ins 1 / EJS leak false / undefined·null 0 / noindex 0 / affiliate-box 0 / `data-ad-client`·`data-ad-slot` strict-equal `ads.config.json`〔masked〕/ 順序 body L48<ad L74<hashtags L88）。§D pre-repost checklist（repo clean / latest HEAD / generated HTML exists / body complete / no EJS leak / no undefined-null / articleAd6=1 / articleAd1–5=0 / no commerce / no noindex / data-ad-client·slot preserved / backup if applicable〔本 post 全新文章 N/A〕/ 不用 VIEW count 當成功指標）、§E manual repost steps（open generated HTML → copy full HTML → HTML 模式新增/更新 → set title/permalink/labels → keep full mode → preview → verify bottom slot → publish only after human approval → record URL+timestamp；+ sanity one-liner）、§F post-publish verification（URL opens / content complete / formatting OK / no dup / articleAd6 near bottom before hashtags / data-ad-status filled|unfilled 皆非立即失敗 / articleAd1–5 absent / no commerce box / no EJS·broken markdown / mobile acceptable / VIEW count weak signal / AdSense policy 後續監控）、§G STOP conditions（HTML missing / >1 slot / articleAd6 missing / EJS leak / stripped data-ad-client·slot / duplicate body / editor strips ad code / policy warning / operator 不確定貼哪段）、§H evidence to collect（URL / timestamp / screenshot / front-end result / data-ad-status / AdSense warning / view count 記錄但不解讀為流量·成效）、§J next phases（conservative stop & wait approval；optional human repost→completion record docs-only；live PASS 後另開 guard coverage 納 slug；continue monitoring；not advised 連發多篇·改 template·新增 slot）。**actual live repost 仍 🔴 BLOCKED**（須 user 完成 §D inputs + explicit approval）。**未改 source / template / renderer / settings（含 ads.config.json）/ content post / guard；未新增 assets / commerce links；未 publish / repost / 登入 Blogger / 開 AdSense 後台 / deploy / push gh-pages / commit dist-blogger / npm install / 新增 ad slot / 動 guard coverage / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量。** 唯一 mutation = 該 packet doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84**；guard `check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = user 依 packet 手動重貼後 verification / completion record（docs-only）；或保守 stop & wait approval；或 P2/P3 draft（docs-only）。**Batch 2 P1 knowledge-base manual repost completion record（20260612-pm-17，docs-only `docs/20260612-blogger-p1-knowledge-base-manual-repost-completion-record.md`；baseline HEAD `de01a1c`）**：human operator 已於 `20260612 16:09` 依 pm-16 packet 完成 `blog-as-personal-knowledge-base`（life-note 最簡形態；Blogger live URL `https://babel-lab.blogspot.com/2026/06/blog-as-personal-knowledge-base.html`）之 Blogger 手動重貼 / 發布 + 前台 + DevTools 初步驗證（**Claude 未執行 repost / publish / 任何 Blogger 後台操作；本 phase 僅記錄**）。觀察 PASS：URL opens / title·body visible（full 非 summary）/ 文章下方廣告出現 / DevTools 見 `articleAd6`·`lab-ad-slot--articleAd6` + `ins.adsbygoogle` + `data-ad-status="filled"` + `data-ad-client`·`data-ad-slot` 未被 strip + ad 位於正文後·hashtags 前 / `articleAd1–5` not observed from available evidence / 無可見 EJS leak·破版·commerce box。**hashtags 觀察明確區分**：visible generated hashtags `#self-growth`·`#reading-notes`（很可能來自 frontmatter tags→generated body hashtags），**Blogger backend labels NOT confirmed**（未於 Blogger 編輯器單獨檢查；不得誤記為 labels 已設）。**caution**：`data-ad-status="filled"` = live rendering 正向訊號，但 **filled ≠ earning ≠ policy approval**；VIEW count 仍 weak signal；AdSense dashboard / policy 須後續監控。此為**第 6 篇** live PASS（we-media-myself2 / github-pages-blog-planning / daily-reading-habit-notes / reading-notes-three-questions / after-work-writing-time-blocking + 本篇）；**guard 仍涵蓋 5 篇**（`check-blogger-adsense-output.js` 維持 5-target；本 slug = manually-evidenced but **not yet automated-guard-covered**，待接受 live PASS 後另開 guard-coverage phase 納入）。screenshot 由 human 提供於對話，**未** commit image 檔入 repo（per 指示）。**未改 source / template / renderer / settings（含 ads.config.json）/ content post / guard；未 publish / repost（Claude 未操作）/ 登入 Blogger / 開 AdSense 後台 / deploy / push gh-pages / commit dist-blogger / npm install / GA4 實作 / 新增 ad slot / 新增 assets·commerce / 動 guard coverage / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量。** 唯一 mutation = 該 completion record doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84**；guard `check:blogger-adsense-output` 71/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守 monitor 本 live post + Batch 1；或接受 live PASS 後另開 guard coverage 納入 `blog-as-personal-knowledge-base`；或 P2 draft（docs-only）；或 AdSense dashboard / policy monitoring record（docs-only）。**Blogger AdSense output guard coverage expand — 6th target（20260612-pm-18 `20260612-pm-18-blogger-p1-knowledge-base-guard-coverage-a`；baseline HEAD `d92c14e`；docs `docs/20260612-blogger-p1-knowledge-base-guard-coverage-record.md`）**：在 pm-17 `blog-as-personal-knowledge-base` live PASS 後，於 `src/scripts/check-blogger-adsense-output.js` 之 `TARGETS` array **新增第六個** live/manual-verified target。**先 `build:blogger` 後只讀量測** `dist-blogger/posts/blog-as-personal-knowledge-base/post.html`：articleAd6 **1** / articleAd1–5 **0** / noindex **0** / affiliate-box **0** / related-links **0** / hashtags present / 順序 body(48)<ad(74)<hashtags(88) / client+slot strict-equal `ads.config.json` → 與 daily-reading / reading-notes / after-work-writing 同型（最簡 life-note 形態），expectation = articleAd6 1 / articleAd1to5 0 / noindex 0 / affiliateBox `{exact:0}` / relatedLinks false / positionAnchor `hashtags`（**依實測填寫，未猜**）。既有 C1–C10 共同斷言 + P1–P4 per-target 已涵蓋此型 → **僅新增 target entry（+其註解），未改任何 check 邏輯，未弱化既有五 target 之 assertion**。**僅改 `check-blogger-adsense-output.js`（+ guard-coverage record doc + 本 CLAUDE.md ledger）**；未改 content/settings/fixtures/views/templates/package/lockfile/dist/gh-pages/`.cache`/任何文章檔/Blogger live post。acceptance：`build:blogger` ok → `check:blogger-adsense-output` **85/0**（1 settings + 14×6 target；六 slug 全覆蓋；新 slug 14 case 全 PASS）、`check:adsense-resolver` **34/0**、`check:adsense-article-block` **13/0**、`check:adsense-anchor-wiring` **14/0**、`validate:content` **0/94/84**；guard source grep `ca-pub-[0-9]+` = **0**（real id 僅從 `ads.config.json` 讀）。**未開 Blogger / AdSense 後台、未 repost / publish / 外部前台驗證、未 deploy / push gh-pages、未 commit dist-blogger、未新增/hardcode real id、未新增其他 slug / ad slot / assets / commerce、未 npm install、未做 CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量。** 六篇 live-verified Blogger AdSense post（we-media-myself2 複雜 / github-pages-blog-planning tech-note / daily-reading-habit-notes / reading-notes-three-questions / after-work-writing-time-blocking / blog-as-personal-knowledge-base 四篇 life-note）自此**全進 automated guard（live inventory 6 = guard coverage 6）**。**Recommended next phase** = 保守 monitor 6 篇 live post + AdSense dashboard/policy；或 P2 draft `ai-tools-simplify-daily-workflow`（docs-only）；或 AdSense dashboard/policy monitoring record（docs-only）。**Six live posts monitoring record landed（20260612-pm-19，docs-only `docs/20260612-blogger-adsense-six-live-posts-monitoring-record.md`；baseline HEAD `0c9f48b`）**：接續 pm-18（guard coverage 6/6）建立 AdSense / policy / live-post monitoring record。§C 記錄 current verified state（live-verified inventory **6 posts** = automated guard coverage **6 posts**；`check:blogger-adsense-output` **85/0** carry-forward；`validate:content` **0/94/84** carry-forward；最新 live P1 `https://babel-lab.blogspot.com/2026/06/blog-as-personal-knowledge-base.html`，`articleAd6` observed `data-ad-status="filled"`；Blogger VIEW count remains weak signal only）+ §D six-post front-end 人工觀察清單（URL opens / title·body complete / formatting / no EJS leak / no broken markdown / bottom articleAd6 near bottom / articleAd1–5 absent / no duplicate body / no unexpected commerce box / mobile acceptable / data-ad-status filled|unfilled 分別記錄不立即視為失敗 / view count movement only recorded not interpreted as traffic·performance）+ §E AdSense dashboard·policy 後台清單（policy center·warning / site status / earning availability / invalid traffic / ad serving limited / page·site issue / timing caveat 勿對同日 zero data 過度反應）+ §F interpretation rules（filled=positive rendering signal only / unfilled can be normal early·low-traffic / VIEW≠real visitor·≠impression·≠long-term policy approval / one good post ≠ mass publish）+ §G STOP/hold conditions（policy warning / invalid traffic·ad serving limited / multiple posts lose ad / sanitizer strips ad code / layout break·duplicate slot / articleAd1–5 appear / template·source drift / hashtags-vs-labels 無法區分 / repost uncertainty）+ §H cadence（same day front-end visual；24–72h dashboard·policy；3–7d observe stability before Batch 2；no burst publish unless monitoring clean）+ §J next phase（conservative monitor 6 only / optional P2 draft docs-only one post no landing / optional later AdSense dashboard observation record / optional P2 content landing only after stable monitoring）。**Non-actions**：未改 source / template / renderer / settings（含 ads.config.json）/ content post / guard coverage；未 publish / repost / 登入 Blogger / 開 AdSense 後台 / deploy / push gh-pages / commit dist / npm install / GA4 實作 / 新增 ad slot·assets·commerce / P2 content landing / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量或 AdSense 成效。唯一 mutation = 該 monitoring record doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84**；`check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守 monitor 6 篇 live post（§D/§E/§H）；或 P2 draft `ai-tools-simplify-daily-workflow`（docs-only one post no landing）；或 user 登入後台後之 AdSense dashboard observation record（docs-only）。**Batch 2 P2 AI-workflow article draft landed（20260612-ai-workflow-article-draft，docs-only `docs/20260612-blogger-p2-ai-workflow-article-draft.md`；baseline HEAD `6efad4d`）**：執行 pm-19 §J optional（把 pm-10 §E.2 之 P2 候選 `ai-tools-simplify-daily-workflow` 寫成完整文章草稿供人工審稿；不落地 content / 不發文 / 不重貼）。§C draft metadata（title「AI 工具很多，真正有用的是把日常流程變簡單」/ slug `ai-tools-simplify-daily-workflow` / contentKind `life-note` / category `life-note` + tag `self-growth`〔皆 Blogger-valid，0 settings drift；single tag〕/ blogger full + indexable / commerce none / assets none / expected slot existing `articleAd6` bottom only；frontmatter 形態 mirror 既有 live `blog-as-personal-knowledge-base`，read-only 參照未改該檔）。§D full article draft（約 1,250 中文字，fenced block；H1 +6 H2〔一開始也以為要做大事 / 小地方變順更有感 / 把零散筆記整理成可繼續用的材料 / 幫自己跨過卡住的第一步 / 工具可加速但不要把判斷交出去 / 先讓流程變穩再慢慢累積〕+ 自然結尾；個人觀察務實溫和、刻意克制 AI hype、不背書特定工具、無效率·收入·流量·排名承諾、無「必用/最強/取代/一鍵完成/秒懂/懶人包神器」、非工具推薦文 / 非技術或 prompt 教學、例子僅止整理筆記·初稿·段落·待辦、無 Claude/phase/commit/HEAD/GitHub/validator/build/deploy 字眼、無硬 CTA）。§E editorial notes（為何仍低風險 / 哪些句子避免 AI hype / 審稿可加個人經驗處 / 預設不補圖 / 不需 commerce / 初步判斷適合落地但須人工審稿 + explicit approval）+ §F AI·AdSense caution（非 AI 工具推薦文 / 不背書 / 不承諾效率收入流量排名 / 落地僅用既有 articleAd6 bottom slot / 不新增廣告位 / 不用 VIEW count 判斷成效）+ §G next phases（conservative stop after draft wait review / optional revise docs-only / optional approval 後 single new file 落地 / optional 落地驗證後 repost packet docs-only；not advised content landing·publish·repost in same phase）。**Non-actions**：未新增 content 檔、未改 source / template / renderer / settings（含 categories.json/tags.json/ads.config.json）/ guard / fixtures / views / package / lockfile / dist / `.cache`、未 publish / repost / 登入 Blogger / 開 AdSense 後台 / deploy / push gh-pages / commit dist / npm install / GA4 實作 / 新增 ad slot·assets·commerce / 落地 P2 content / 把文章寫成 AI 工具推薦文 / docs/README.md（無近期 Blogger/AdSense docs index 慣例故不動）/ CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量或 AdSense 成效。唯一 mutation = 該 article draft doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84**；`check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守 stop after draft 等人工審稿；或依審稿意見 revise draft（docs-only）；或經 user approval 後 single new file 落地 `ai-tools-simplify-daily-workflow` content phase。**P2 AI-workflow draft personal-example revision landed（20260612-pm-22，docs-only `docs/20260612-blogger-p2-ai-workflow-article-draft.md`；baseline HEAD `ef120b9`）**：依 pm-21 read-only review 建議（三場景偏抽象、略重疊），修訂 P2 草稿 §D 之「把零散筆記整理成可以繼續用的材料」**單一段**，補入 1 個具體個人場景（手機備忘錄累積一整週雜記〔書裡畫線句 / 洗澡想到的點子 / 跟朋友聊天的提醒，全擠同一頁理不出頭緒〕→ 整頁丟工具請它按主題粗分堆〔工作 / 想寫成文章 / 當下心情〕→ 分完仍粗、有幾則歸錯堆、兩三則想不起來 → 自己搬移歸錯的 / 刪掉想不起來的），降低通用心得文感；**只改該段**（未動「跨過卡住的第一步」「工具可加速但判斷自留」兩段），避免過長失焦。title / slug `ai-tools-simplify-daily-workflow` / category `life-note` / tag `self-growth` / 風險定位不變；不指名任何 AI 工具 / 品牌、0 affiliate / commerce、無效率·收入·流量·排名承諾、無「必用/最強/取代/一鍵完成/秒懂/神器/懶人包」誇大詞、無內部 repo/Claude/phase/commit/HEAD/GitHub/validator/build/deploy 字眼、非工具推薦 / 非技術 / prompt 教學；字數約 1,250→1,400（仍 900–1,500 區間）。§0 加修訂紀錄 + §D 字數註 + §E.7 新增修訂 editorial note（補了哪個場景 / 為何仍低風險 / 仍不需補圖 / 仍不需 commerce / 仍適合 single-new-file landing 但須人工 approval）。**Non-actions**：未新增 content 檔、未改 source / template / renderer / settings（含 categories.json/tags.json/ads.config.json）/ guard / fixtures / views / package / lockfile / dist / `.cache`、未 publish / repost / 登入 Blogger / 開 AdSense 後台 / deploy / push gh-pages / commit dist / npm install / GA4 實作 / 新增 ad slot·assets·commerce / 落地 P2 content / 把文章改成 AI 工具推薦文 / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量或 AdSense 成效。唯一 mutation = 該 article draft doc（§0 修訂紀錄 + §D 段落 + §D 字數註 + §E.7）+ 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84**（draft 在 docs/ 非 content post，不入計數）；`check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守等人工複審修訂版；或經 user approval 後 single new file 落地 `ai-tools-simplify-daily-workflow` content phase；或再依意見 revise（docs-only）。**P2 AI-workflow draft small-flow paragraph revision landed（20260612-pm-24，docs-only `docs/20260612-blogger-p2-ai-workflow-article-draft.md`；baseline HEAD `7b51db5`）**：依 pm-23 read-only review 之最後建議，收斂 P2 草稿 §D 之「後來發現，小地方變順更有感」**單一段**——把原本兩個具體筆記例子（理順筆記 / 雜念分段）改為**概括**敘述（待辦拆小 / 一句不順的話改順 / 把混在一起的念頭先分開放，點到為止不展開），重心移到「少一點空白 / 少一點卡住 / 少一點事後重整成本」之感受，把具體筆記案例完整讓給下一段「把零散筆記整理成可以繼續用的材料」，降低兩段重疊、使六個 H2 場景分布更乾淨；**只動該段**、未大改其他段落。title / slug `ai-tools-simplify-daily-workflow` / category `life-note` / tag `self-growth` / 風險定位不變；不指名任何 AI 工具 / 品牌、0 affiliate / commerce、無效率·收入·流量·排名承諾、無「必用/最強/取代/一鍵完成/秒懂/神器/懶人包」誇大詞、無內部 repo/Claude/phase/commit/HEAD/GitHub/validator/build/deploy 字眼、非工具推薦 / 非技術 / prompt 教學；字數仍約 1,400（900–1,500 區間）。§0 加 pm-24 修訂紀錄 + §D 字數註更新（pm-22+pm-24）+ §E.8 新增微修 editorial note（收斂哪段 / 為何降低重疊 / 為何仍低風險 / 仍不需補圖 / 仍不需 commerce / 仍適合 single-new-file landing 但須人工 approval）。**Non-actions**：未新增 content 檔、未改 source / template / renderer / settings（含 categories.json/tags.json/ads.config.json）/ guard / fixtures / views / package / lockfile / dist / `.cache`、未 publish / repost / 登入 Blogger / 開 AdSense 後台 / deploy / push gh-pages / commit dist / npm install / GA4 實作 / 新增 ad slot·assets·commerce / 落地 P2 content / 把文章改成 AI 工具推薦文 / CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量或 AdSense 成效。唯一 mutation = 該 article draft doc（§0 修訂紀錄 + §D 段落 + §D 字數註 + §E.8）+ 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84**（draft 在 docs/ 非 content post，不入計數）；`check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守等人工複審；或經 user approval 後 single new file 落地 `ai-tools-simplify-daily-workflow` content phase；或再依意見 revise（docs-only）。**Batch 2 P2 AI-workflow content landing（20260612-pm-26 `content/blogger/posts/20260612-ai-tools-simplify-daily-workflow.md`；baseline HEAD `2e95de8`）**：per user explicit approval，將最終審稿（pm-24/pm-25）之 P2 草稿落地為**單一新 content post**（title「AI 工具很多，真正有用的是把日常流程變簡單」/ slug `ai-tools-simplify-daily-workflow` / contentKind `life-note`〔normal article〕/ category `life-note` + tag `self-growth`〔皆 Blogger-valid，0 settings drift；single tag〕/ blogger full + indexable / status ready draft false / cover 重用既有 placeholder〔0 new asset〕/ 無 affiliate / commerce ref / book / download / 外部連結；frontmatter 形態 mirror `daily-reading-habit-notes` / `blog-as-personal-knowledge-base`；body = pm-24 修訂版正文，H1 由 frontmatter title 提供不重複寫入 body）+ landing record doc `docs/20260612-blogger-p2-ai-workflow-content-landing-record.md`。**僅此 1 新 content 檔 + 1 record doc；未改任何既有 post / src / settings〔含 categories.json/tags.json/ads.config.json〕/ views / templates / fixtures / package / lockfile / guard。** acceptance：`validate:content` **0/94/84 不變**（新 post clean 0 觸發）；`build:blogger` ok；generated `dist-blogger/posts/ai-tools-simplify-daily-workflow/post.html` read-only evidence：articleAd6 **1** / articleAd1–5 **0** / adsbygoogle ins **1** / EJS leak **0** / undefined·null **0** / noindex **0** / affiliate-box **0** / legacy slot **0** / test-text **0** / `data-ad-client`·`data-ad-slot` 與 `ads.config.json` masked strict-match（client `…3759` / slot `…6977`）/ 順序 body(L49)<ad(L74)<hashtags(L88) / title + 結尾「這就已經很夠了」present。guard carry：`check:blogger-adsense-output` 85/0（仍 6 target，**未**含本新 post → manually-evidenced，not yet automated-guard-covered；納 guard 須 live verified 後另開 phase）/ `check:adsense-resolver` 34/0 / `check:adsense-article-block` 13/0 / `check:adsense-anchor-wiring` 14/0。**該 post 現為 Blogger AdSense Batch 2 候選（full + indexable + ready + non-placeholder + 0 commerce + 0 drift）。** **未 repost / publish / 開 Blogger / 開 AdSense 後台 / 外部前台驗證、未 deploy / push gh-pages、未 commit dist-blogger、未新增/hardcode real id、未一次新增其他文章、未把文章寫成 AI 工具推薦文、未做 CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量或 AdSense 成效。** 實際 Blogger 重貼仍 🔴 BLOCKED（須另開 execution phase + user approval + 備份 + theme CSS）。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。**Recommended next phase** = 保守 monitoring；或 manual Blogger repost packet（docs-only）；或 P3 draft（docs-only）；live PASS 後 guard coverage expand 納入本 slug。**Batch 2 P2 AI-workflow manual repost packet landed（20260612-pm-27，docs-only `docs/20260612-blogger-p2-ai-workflow-manual-repost-packet.md`；baseline HEAD `b19d5a0`）**：為 pm-26 落地之 `ai-tools-simplify-daily-workflow`（Batch 2 候選；最簡 life-note 形態）打包 manual Blogger repost packet（mirror pm-16 P1 packet 結構；不 repost / 不 publish / 不開 Blogger / 不執行）。涵蓋 A baseline / B see-also / C source+generated HTML（content path / dist `post.html` / title「AI 工具很多，真正有用的是把日常流程變簡單」/ slug / category `life-note` + tag `self-growth` / blogger full + indexable / commerce none / assets existing placeholder / **AI caution: not tool recommendation, 0 brand·tool endorsement, 0 affiliate**）+ C.2 repo-side re-verification（`validate:content` 0/94/84、`build:blogger` ok、articleAd6 **1** / articleAd1–5 **0** / adsbygoogle ins **1** / EJS leak false / undefined·null 0 / noindex 0 / affiliate-box 0 / legacy slot 0 / test-text 0 / `data-ad-client`·`data-ad-slot` masked strict-match `…3759`·`…6977` / 順序 ad@L74<hashtags@L90）/ D pre-repost checklist / E manual repost steps（含 §E.1 sanity one-liner，唯一來源 `post.html` 全檔；HTML 模式；sanitizer strip→停止）/ F post-publish verification（含 no AI-tool-recommendation/affiliate-looking content accidentally introduced；filled|unfilled 皆非立即失敗）/ G STOP conditions（含 looks-like-tool-recommendation / sanitizer strip / policy warning）/ H evidence to collect（view count weak signal only）/ J next phases / K real-id masking。**repo-side re-verification 全 PASS**；本文件**不代表已完成** Blogger 外部重貼。**Non-actions**：未開 Blogger / 編輯器 / AdSense 後台、未 repost / publish / 外部前台驗證、未改任何文章檔（含 `ai-tools-simplify-daily-workflow`）/ src / settings / template / views / fixtures / package / lockfile / guard scope、未 commit dist-blogger、未 deploy / push gh-pages / `.cache`、未新增/hardcode real id、未新增 assets·commerce·ad slot、未把文章改成 AI 工具推薦文、未做 CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量或 AdSense 成效。唯一 mutation = 該 packet doc + 本 CLAUDE.md 極小 ledger sync。實際 repost 仍 🔴 BLOCKED，須 user 完成 §D inputs + explicit approval 另開 execution phase。real id 一律不寫入 CLAUDE.md / docs（僅 `ads.config.json`）。acceptance：`validate:content` **0/94/84**；guard `check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = user 依 packet 手動重貼後 verification / completion record（docs-only）；或保守 stop & wait approval；或 P3 draft（docs-only）；或 continue monitoring 6 live posts only。**Batch 2 P3 steady-rhythm article draft landed（20260612-pm-28，docs-only `docs/20260612-blogger-p3-steady-rhythm-article-draft.md`；baseline HEAD `6f369f8`）**：執行 pm-10 §E.3（把 P3 候選 `blog-restart-steady-rhythm-notes` 寫成完整文章草稿供人工審稿；不落地 content / 不發文 / 不重貼）。§C draft metadata（title「個人部落格重啟筆記：先求穩定，再求流量」/ slug `blog-restart-steady-rhythm-notes` / contentKind `life-note` / category `life-note` + tag `self-growth`〔皆 Blogger-valid，0 settings drift；single tag〕/ blogger full + indexable / commerce none / assets none / expected slot existing `articleAd6` bottom only；frontmatter 形態 mirror 既有 live `blog-as-personal-knowledge-base`，read-only 參照未改該檔）。§D full article draft（約 1,300 中文字，fenced block；H1 +6 H2〔重啟容易想一次做很多事 / 穩定比衝刺更重要 / 先把寫作和整理流程變簡單 / 不急著用數字判斷成敗 / 每篇文章留下可檢查的標準 / 先讓自己願意回來再慢慢把內容變好〕+ 自然結尾；個人觀察務實溫和、**不承諾流量·收益·排名**、**不宣稱 AdSense 會賺錢**、**不鼓勵短時間大量發文**〔內文反而勸阻衝刺式發文〕、**不把 Blogger VIEW count 當 KPI**〔內文明確把判斷標準從「有多少人看」改成「我有沒有持續」〕、無內部 repo/Claude/phase/commit/HEAD/GitHub/validator/build/deploy 字眼、非流量成長 / AdSense 收益教學、無硬 CTA）。§E editorial notes（為何低風險 / 哪些句子避免流量·收益·排名誇大 / 審稿可加個人經驗處 / 預設不補圖 / 不需 commerce / 初步判斷適合落地但須人工審稿 + explicit approval）+ §F Blogger·AdSense caution（非流量成長教學 / 非 AdSense 收益教學 / 不承諾流量·排名·收入 / 落地僅用既有 articleAd6 bottom slot / 不新增廣告位 / 不用 VIEW count 判斷成效）+ §G next phases（conservative stop after draft wait review / optional revise docs-only / optional approval 後 single new file 落地 / optional 落地驗證後 repost packet docs-only；not advised content landing·publish·repost in same phase）。**Non-actions**：未新增 content 檔、未改 source / template / renderer / settings（含 categories.json/tags.json/ads.config.json）/ guard / fixtures / views / package / lockfile / dist / `.cache`、未 publish / repost / 登入 Blogger / 開 AdSense 後台 / deploy / push gh-pages / commit dist / npm install / GA4 實作 / 新增 ad slot·assets·commerce / 落地 P3 content / 把文章寫成流量成長或 AdSense 收益教學 / docs/README.md（無近期 docs index 慣例故不動）/ CLAUDE.md compression / `/memory` / unrelated cleanup；未把 VIEW 增加判定為真實流量或 AdSense 成效。唯一 mutation = 該 article draft doc + 本 CLAUDE.md 極小 ledger sync。real id 仍只存 `ads.config.json`；docs/source/EJS/tests/package/frontmatter/本 ledger 皆無 real id 字面值。acceptance：`validate:content` **0/94/84**；`check:blogger-adsense-output` 85/0、`check:adsense-resolver` 34/0、`check:adsense-article-block` 13/0、`check:adsense-anchor-wiring` 14/0 carry forward。**Recommended next phase** = 保守 stop after draft 等人工審稿；或依審稿意見 revise（docs-only）；或經 user approval 後 single new file 落地 `blog-restart-steady-rhythm-notes` content phase。
`node src/scripts/validate-content.js --registry-overlay content/validation-fixtures/settings/commerce-c4-c9-overlay.json` = **0 errors / 101 warnings / 85 issue-posts**（overlay baseline；87→101 之 +14 同 normal +14 來源；night-8 N6a 同樣不變 overlay baseline；含 C4/C9 overlay-injected entries + we-media 於 overlay replace-semantics 下之 ref C3 not-found：legacy links 2 + pm-13 blocks 4 = **6×** C3；見 `docs/20260610-commerce-we-media-myself2-ref-migration.md` §D）。

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
