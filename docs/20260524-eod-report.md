# 20260524 End-of-Day Report

本文件為 BLOG / portable-blog-system 之 **2026-05-24 全日收尾報告**；屬 docs-only；於 phase `20260524-am-7c-eod-checkpoint-a` 落地（本批）。

本文件**不是** roadmap，**不是**新 spec，**不是**啟動指令；屬今日工作收尾紀錄，方便明日 cold-start 接續。

---

## 1. Date / Context

| 項目 | 值 |
|---|---|
| **日期** | 2026-05-24 |
| **工作主軸** | GA4 click tracking coverage audit → G1 affiliate placement reconcile → G2 link_type root-cause + spec rule + source fix → deploy + user manual validation |
| **工作性質** | docs-only audit 系列（am-2/3/4/5）+ 單檔 source micro-fix（am-6）+ deploy（am-7b）+ EOD checkpoint（am-7c）|
| **session 起點** | 08:14（am-1 startup inventory）|
| **session 終點** | 本批 EOD checkpoint 落地後 |

---

## 2. Completed Today

| 段 | Phase | 性質 | 範圍 | Commit |
|---|---|---|---|---|
| **am-1** | `20260524-am-1-startup-inventory` | read-only | 5/24 cold-start inventory；確認 working tree clean / HEAD = origin/main = `f3ac5ca`；產出 3 candidate routes | — |
| **am-2** | `20260524-am-2-ga4-click-tracking-coverage-audit-a` | docs-only | 新增 `docs/ga4-click-tracking-coverage-audit-20260524.md`（370 行）；spec ↔ source ↔ dist 對照；識別 G1（affiliate placement drift）/ G2（link_type 誤分類）/ G3（spec 內部矛盾）+ G4-G8 次要 gaps | `32f042a docs(ga4): audit click tracking coverage` |
| **am-3** | `20260524-am-3-ga4-spec-placement-enum-drift-fix-a` | docs-only | 修 G1 + G3：spec §3.7 / §4.2.1 example / §5.4 utm_content 釐清 / §11.1 enum 表 / §11.3 example / §11.4.2 historical reconcile / §12.2.5 / §12.2.6 / §14.1 / §14.3 統一採 `article_top` / `article_bottom`；publishing-workflow §6.1 / §7.5 / §7.6 / §9.6 drift 修；audit doc sync | `073647a docs(ga4): align affiliate placement enum` |
| **am-4** | `20260524-am-4-ga4-g2-relatedlinks-link-type-root-cause-audit-a` | docs-only | G2 root-cause 補入 audit doc §12（161 行追加）；確認**主因**為 source helper 之 linkType 派生以 kind 主導 + **次因** spec underspecified；content 非問題；建議 Option 2 source + Option 3 spec | `c783c3e docs(ga4): audit link_type root cause for related links` |
| **am-5** | `20260524-am-5-ga4-spec-link-type-derivation-rule-a` | docs-only | G2 spec rule landed：spec 新增 §4.5「link_type 派生規則」7 子節（兩軸命名 author_kind / destination_type / 派生優先序 / outbound mapping / 適用範圍 / 既有 source gap / am-6 指引）+ governance §3.3 / §8.2 + schema §7.3 / §7.4 兩軸命名分離 + audit doc sync | `93fec24 docs(ga4): define link_type derivation rule` |
| **am-5b** | docs-only checkpoint push | push only | 4 docs commits 推上 origin/main 作為 source fix 前 backup | — |
| **am-6** | `20260524-am-6-ga4-link-type-cross-site-priority-source-fix-a` | source small fix | `src/views/pages/post-detail.ejs` +4 / -4（relatedLinks L171-173 + otherLinks L208-210 mirror swap）；linkType 派生改為 cross-site fingerprint 優先；EJS compile pass + `npm run build` pass + dist `we-media-myself2` 驗證 `link_type` `internal → cross_site` | `e6f0a5f fix(ga4): prioritize cross-site link_type derivation` |
| **am-6b** | source push | push only | source fix 推上 origin/main 作為 deploy 前 checkpoint | — |
| **am-7a** | `20260524-am-7a-pre-deploy-readiness-audit` | read-only | 比對 dist 與 deploy repo；確認 deploy delta = 1 個語意 HTML attr（G2 fix）+ 1 個 CSS rule（DT-A2 hashtag wrap）+ sitemap lastmod + bundle hash refresh；風險 🟢 低；建議進入 am-7b | — |
| **am-7b** | `20260524-am-7b-deploy-accumulated-gh-pages-update` | deploy | `npm run build` → `cp -r dist/*` → `git rm` 2 個 stale bundles → commit `960f234` → push gh-pages；deploy repo HEAD = origin/gh-pages = `960f234` | deploy `960f234 deploy: update ga4 link_type and hashtag wrap` |
| **am-7c**（本批）| `20260524-am-7c-eod-checkpoint-a` | docs-only | 新增本 EOD report + sync audit doc 之 G2 status 為 fully resolved | `5ab7c05 docs(report): add 20260524 eod checkpoint` |

### 2.1 統計

- **source commits**：1（`e6f0a5f` GA4 G2 source fix；+4 / -4；單檔 EJS）
- **docs commits**：4（am-2 / am-3 / am-4 / am-5）+ 本批 EOD checkpoint
- **deploy commits**：1（`960f234` on gh-pages branch）
- **push 動作**：2 次 origin/main（am-5b + am-6b）+ 1 次 origin/gh-pages（am-7b）
- **read-only audit phases**：3（am-1 startup / am-7a pre-deploy / 本批 am-7c 前置 review）
- **idle freeze phases**：本批落地後 1

---

## 3. Commits Today（origin/main timeline）

5/24 全部進入 origin/main 之 commits（時序由舊至新；不含本批 am-7c 自身與 deploy repo commit）：

| # | commit | message | 性質 | 段 |
|---|---|---|---|---|
| 1 | `32f042a` | `docs(ga4): audit click tracking coverage` | docs new | am-2 |
| 2 | `073647a` | `docs(ga4): align affiliate placement enum` | docs modify | am-3 |
| 3 | `c783c3e` | `docs(ga4): audit link_type root cause for related links` | docs modify | am-4 |
| 4 | `93fec24` | `docs(ga4): define link_type derivation rule` | docs modify | am-5 |
| 5 | `e6f0a5f` | `fix(ga4): prioritize cross-site link_type derivation` | **source small fix** | am-6 |

### 3.1 Deploy repo commit

| commit | message | source snap | branch |
|---|---|---|---|
| `960f234` | `deploy: update ga4 link_type and hashtag wrap` | `e6f0a5f` | gh-pages |

### 3.2 變動類型分布

- `docs(ga4)`：4（spec / governance / schema / audit 系列）
- `fix(ga4)`：1（**唯一** source 變動；單檔 `src/views/pages/post-detail.ejs` +4 / -4）
- **無**：content / settings JSON / build script / template 其他檔 / SCSS / JS modules / public assets 變動

---

## 4. G1 + G3 收斂摘要（am-3）

### 4.1 背景

5/24 am-2 audit 識別：
- **G1**：source 採 `placement=article_top|article_bottom`；spec §11.1 表內列了 `affiliate_top|affiliate_bottom` 為已落地之 placement value → spec ↔ source drift
- **G3**：spec §11.1 同時列 `article_top` 與 `affiliate_top` 兩 row，內部自相矛盾

### 4.2 收斂方向

不動 source（既有 5/22 落地之 inline attrs 沿用 `article_top` / `article_bottom`）；以 spec 對齊 source 為主：

- 移除 §11.1 內重複之 `affiliate_top` / `affiliate_bottom` 行
- §11.4.2 新增 historical / rejected reconcile 紀錄
- §5.4 utm_content list 明確標 `affiliate_top` / `affiliate_bottom` 屬 utm_content value 而非 placement value（兩套獨立命名）
- §12.2.5 / §12.2.6 manual checklist 更新為 `article_top` / `article_bottom`
- §3.7 / §4.2.1 example / §14.1 / §14.3 同步
- `publishing-workflow-20260523.md` §6.1 / §7.5 / §7.6 / §9.6 drift 修

### 4.3 結果

✅ G1 + G3 fully resolved（spec ↔ source 一致）；source 端未動；source 落地之 `article_top` / `article_bottom` 為 canonical placement value。

---

## 5. G2 收斂摘要（am-4 + am-5 + am-6 + am-7b）

### 5.1 G2 問題重述

GitHub Pages 端 `dist/posts/we-media-myself2/index.html` relatedLinks anchor 之 GA4 dimension 與 URL UTM 注入語意衝突：
- URL 含 cross-site UTM 4 鍵（build pipeline 注入）
- 但 `data-ga4-param-link_type="internal"`（EJS render 從 `item.kind` 派生）
- 結果：GA4 後台分析時 `link_type=internal` 與 cross-site UTM 並存於同一 URL

### 5.2 Root cause（am-4 識別；c783c3e）

**主因**：`src/views/pages/post-detail.ejs:171-173` 之 EJS render `linkType` 派生**以 `item.kind` 為主導**；當 `kind === 'internal'` 短路跳出 `'internal'` 不進 cross_site 分支。

**次因**：spec / governance / schema 未顯式裁決 `kind` vs URL hostname 何者優先決定 `link_type`。

**非問題**：
- ❌ Content frontmatter 不錯（per schema §5.4：「`kind: internal` 之語意為本站任一已發布平台之連結」）
- ❌ Build pipeline / `applyCrossSiteUtm` 不錯（per schema §4.3 已明示依 URL hostname）
- ❌ link-tracker JS 不錯（pass-through）

### 5.3 Spec rule landed（am-5 / `93fec24`）

兩軸命名分離（canonical 規則來源：`ga4-link-tracking-spec.md` §4.5）：

| 軸 | 概念 | 來源 |
|---|---|---|
| **author_kind**（content layer）| 作者於 `relatedLinks[].kind` 之標記 | `.md` frontmatter |
| **destination_type**（render / event layer；對外名稱為 `link_type`）| 系統依 URL hostname / cross-site fingerprint 判定 | build / render pipeline |

派生優先序：
```
1. affiliate URL → 'affiliate'
2. cross-site hostname → 'cross_site'
3. 同平台 host → 'internal'
4. 第三方 host → 'external'
```

### 5.4 Source fix landed（am-6 / `e6f0a5f`）

`src/views/pages/post-detail.ejs`：
```diff
- const isCrossSite = !isInternal && typeof item.target === 'string' && item.target !== '';
- const linkType = isInternal ? 'internal' : (isCrossSite ? 'cross_site' : 'external');
+ const isCrossSite = typeof item.target === 'string' && item.target !== '';
+ const linkType = isCrossSite ? 'cross_site' : (isInternal ? 'internal' : 'external');
```

relatedLinks（L171-172）+ otherLinks（L208-209）mirror swap；共 4 行修改。

### 5.5 Deploy（am-7b / `960f234`）

- `npm run build` → dist 含 `link_type="cross_site"` ✓
- `cp -r dist/*` → deploy repo
- `git rm` 2 個 stale bundles
- commit `960f234 deploy: update ga4 link_type and hashtag wrap`
- push gh-pages

### 5.6 User manual validation passed（5/24；本批之前）

User 確認線上驗收全部通過：

| 驗收項 | 結果 |
|---|---|
| `posts/we-media-myself2/` 頁面正常 render | ✅ |
| relatedLinks anchor attrs：`data-ga4-event="click_related_link"` / `data-ga4-param-link_type="cross_site"` / `data-ga4-param-outbound="false"` / `data-ga4-param-placement="related_links"` | ✅ |
| GA4 DebugView / Realtime 點擊後可觀察 `click_related_link` event | ✅ |
| event params：`link_type=cross_site` / `outbound=false` / `placement=related_links` / `post_slug=we-media-myself2` | ✅ |
| sitemap.xml 可開啟；lastmod 為 `2026-05-24` | ✅ |
| 其他 ready posts（`github-pages-blog-planning` / `portable-blog-system-mvp`）無 regression | ✅ |

### 5.7 G2 最終狀態

✅ **fully resolved**：
- root cause identified ✓（am-4）
- spec rule landed ✓（am-5）
- source fix landed ✓（am-6）
- deployed ✓（am-7b）
- user manual validation passed ✓（5/24 本批之前）

---

## 6. 其他 deploy 附帶上線項目

### 6.1 DT-A2 hashtag wrap 已上線

- 5/23 pm-7 之 source（`0f71d6e`；`src/styles/components/_hashtag.scss` + Blogger mirror）已隨本 deploy 入 production CSS bundle
- 線上 CSS：`.lab-hashtag{...overflow-wrap:anywhere;...max-width:100%}`
- 對 production hashtag 區塊：長 hashtag 不撐爆容器；short hashtag 視覺幾乎不變

### 6.2 sitemap lastmod 更新

- 14 個 URL entries `<lastmod>` 從 `2026-05-22` → `2026-05-24`
- URL count / 順序 / robots.txt 全部不變

### 6.3 JS bundle 之 100% rename

- Git 偵測為 rename（`entry-2Be8Gnf6.js` → `entry-DMkekbk_.js`；100% similarity）
- 語意 byte-identical；僅 hash 變動
- 無實際 JS 模組變更（自 `b94cf77` 以來 `src/js/` 完全未動）

---

## 7. Final Baseline

### 7.1 Source repo（本機 = origin/main）

| 項目 | 值 |
|---|---|
| **HEAD**（本批 EOD commit 前）| `e6f0a5f fix(ga4): prioritize cross-site link_type derivation`（am-6 結果；am-6b 已 push）|
| **HEAD**（本批 EOD commit + push 後）| `5ab7c05 docs(report): add 20260524 eod checkpoint`（am-7c 結果；已 push）|
| **working tree** | clean（am-7b deploy 後源 repo 未動；am-7c docs commit 已落地）|
| **branch tracking** | `main` → `[origin/main]`；ahead 0 / behind 0（am-7c commit + push 後已驗證）|
| **是否 push remote** | ✅ am-5b + am-6b + am-7c（`5ab7c05`）均已 push origin/main |

### 7.2 Deploy repo（本機 = origin/gh-pages）

| 項目 | 值 |
|---|---|
| **HEAD** | `960f234 deploy: update ga4 link_type and hashtag wrap`（5/24 am-7b 結果）|
| **origin/gh-pages** | `960f234`（同步）|
| **working tree** | clean |
| **ahead / behind** | 0 / 0 |

### 7.3 Production state（線上 GitHub Pages）

- 線上 URL base：`https://babel-lab.github.io/portable-blog-system/`
- 服務內容對應 deploy `960f234`
- GA4 production：✅ live（measurementId `G-C77SMPF8VD`；自 5/21 pm-46 起持續）
- GA4 click event `click_related_link` 已可從 we-media-myself2 之 cross-site relatedLink 觸發；user 已驗收
- sitemap.xml：14 URL entries；lastmod `2026-05-24`
- robots.txt：含 `Disallow` + `Sitemap`（無變動）

### 7.4 Build / Validate

| 項目 | 值 |
|---|---|
| **是否跑 build** | ✅ am-6 pre-commit + am-7b deploy 共跑 2 次；皆 pass（`✓ built in 313ms - 1.99s`）|
| **是否跑 validate** | ❌ 本日未跑（per template / Admin 既有 pattern；source change 屬 EJS render 邏輯；validate scope 不掃 EJS）|
| **是否跑 EJS compile sanity** | ✅ am-6 跑過（`ejs.compile` with `async: true` → OK）|

---

## 8. 今日未動項目

per 本日所有 phases 之邊界遵守：

| 區塊 | 狀態 |
|---|---|
| **Blogger 後台** | ❌ 完全未動 |
| **Blogger theme CSS 重貼 / 重產** | ❌ 完全未動（pm-7 累積之 mirror sync 重貼仍 deferred；user 自決時機）|
| **dist-blogger / dist-promotion / dist-reports** | ❌ 完全未動 |
| **content/**（Markdown / .fb.md / .publish.json / settings JSON）| ❌ 完全未動 |
| **settings JSON**（site / themes / categories / tags / ads / promotion / link-rules / seo / ga4）| ❌ 完全未動（ga4.config.json 仍 enabled=true / measurementId=G-C77SMPF8VD）|
| **build scripts**（`src/scripts/`）| ❌ 完全未動 |
| **SCSS**（`src/styles/`）| ❌ 完全未動 |
| **JS modules**（`src/js/`）| ❌ 完全未動 |
| **public/**（images / icons / downloads / favicon）| ❌ 完全未動 |
| **package.json / vite.config.js / .gitignore** | ❌ 完全未動 |
| **.claude/** | ❌ 不重新建立 |
| **CLAUDE.md** | ❌ 完全未動 |
| **既有 5/23 之其他 docs**（如 admin-overview-audit / phase-status / b-series-decision-prep 等）| ❌ 完全未動 |

→ **唯一 source 變動**：`src/views/pages/post-detail.ejs`（+4 / -4；am-6 / `e6f0a5f`；G2 fix）

---

## 9. 後續 deferred items（明日可能接續）

| 項目 | 狀態 | 阻擋 / 性質 |
|---|---|---|
| **Reverse UTM Blogger→GitHub（pm-24a/b/c）**| 🟡 **live but dormant**；source landed；未 deploy 任何 fixture；無 production 觸發 | user 主動表態建立 fixture / 自然 full-mode Blogger 文章 |
| **Blogger 端 click attrs**| 🔴 不追（per `blogger-listener-strategy.md` §5.1）| 設計層面決議；非短期變更 |
| **Blogger 後台重貼**（per pm-7 hashtag wrap mirror + DT-A2 / DS-3 / SCSS 累積變動之 Blogger CSS 重貼）| 🟡 待 user 主動決定 | user 自決時機；可整合於下次 DT-B / DS-3-b-blogger-entry 批次 |
| **GA4 後台報表觀察**（reverse UTM / click_related_link / click_affiliate_cta 等 event 之長期觀察）| 🟡 累積中 | 1-2 週後可考慮整理觀察報告 |
| **Admin B1**（FB posted ok stat-card）| 🟡 待 user 表態語意 | per `admin-overview-b-series-decision-prep.md` |
| **Admin B2**（affiliate enabled stat-card）| 🟡 待內容累積 ≥10 篇聯盟相關文章 | 同上 |
| **Admin C 系列**（tag 多選 filter / per-row action / pagination）| 🟡 規模未到（6 篇） | 同上 |
| **Admin D 系列 / FB-P5-c / Admin-2-b-2 SEO write**| 🔴 blocked on 8+6 項 preflight | per `fb-sidecar-write-preflight-decision.md` §7 |
| **GA4 G4-G8 次要 gaps**（hashtag span→a / download / social click event / provider id mapping / article body inline link）| 🟡 future Phase 2 | per `ga4-click-tracking-coverage-audit-20260524.md` §7.2 |
| **Canonical-with-UTM SEO 反模式（per audit doc §4.1）**| 🔴 not to be fixed（per D3 user 決議）| 獨立 SEO bug；不在當前範圍 |
| **Custom domain prep**| 🟡 阻擋於 user DNS access | 未變化 |

---

## 10. Cross-links

### 10.1 今日新增 / 修改 docs

- `docs/ga4-click-tracking-coverage-audit-20260524.md`（am-2 新增；am-3 / am-4 / am-5 / 本批 am-7c 多輪 append + sync）
- `docs/ga4-link-tracking-spec.md`（am-3 / am-5 修改；§3.7 / §4.2.1 / §4.3 / §4.5 / §5.4 / §11.1 / §11.3 / §11.4 / §12.2.5 / §12.2.6 / §14.1 / §14.3 / 更新紀錄）
- `docs/click-tracking-governance.md`（am-5 修改；§3.3 / §8.2）
- `docs/related-links-schema.md`（am-5 修改；§4.3 / §7.3 / §7.4）
- `docs/publishing-workflow-20260523.md`（am-3 修改；§6.1 / §7.5 / §7.6 / §9.6）
- `docs/20260524-eod-report.md`（本批 am-7c 新增）

### 10.2 今日 source 變動

- `src/views/pages/post-detail.ejs`（am-6 / `e6f0a5f`；+4 / -4；G2 source fix）

### 10.3 上層 / 對齊 docs

- `docs/20260523-eod-report.md`（昨日 EOD；本文件結構對齊）
- `docs/ga4-link-tracking-spec.md`（GA4 spec 主檔；今日大幅更新）
- `docs/click-tracking-governance.md`（GA4 governance）
- `docs/related-links-schema.md`（relatedLinks schema；今日兩軸命名分離）
- `CLAUDE.md` §5（既有 9 個 GA4 event）/ §16（連結處理）/ §17（文章版型）

### 10.4 對應規範

- `CLAUDE.md` §28（第一版 MVP 必做）/ §29（第一版不做清單）

---

## 11. Cold-start 明日 onboarding 順序建議

1. 讀 `docs/20260524-eod-report.md`（本文件）— ~5 min 掌握今日全貌
2. 讀 `docs/ga4-click-tracking-coverage-audit-20260524.md` — 確認 G1 / G2 / G3 全 resolved；G4-G8 仍 pending
3. 讀 `docs/ga4-link-tracking-spec.md` §4.5 — 確認 link_type 派生規則之 canonical 來源
4. 若繼續 GA4 系列：可考慮 G4（hashtag click event）/ G6（download click）/ G7（social click）之候選；皆有 spec 對應前置或 schema decision pending
5. 若切其他線：B1 / B2 待 user 表態 / DS-3-b platform theme tokens / Reverse UTM pm-29c fixture / Custom domain prep / content expansion

---

## 12. Freeze Note

### 12.1 本批落地後預期狀態

- 本批 EOD doc commit 後，HEAD 將變為新 commit；main 與 origin/main 在 push 後再次同步
- 預期 working tree 重新 clean
- 預期 ahead / behind 重新 0 / 0

### 12.2 確認無 dirty / untracked

- 本批 EOD doc 落地後預期 `git status` clean
- 無任何意外 dirty 檔案
- `.claude/` 不重新建立

### 12.3 邊界遵守（本 am-7c phase）

| 項目 | 狀態 |
|---|---|
| 不改 source code | ✅ |
| 不改 content / frontmatter | ✅ |
| 不 build / 不 validate / 不 deploy | ✅ |
| 不 push gh-pages | ✅ |
| 不碰 Blogger 後台 | ✅ |
| 不碰 `.claude/` / dist / dist-blogger / dist-promotion | ✅ |
| 本批僅 docs（新增 EOD report + sync audit doc 之 G2 status）| ✅ |

---

（本文件結束）
