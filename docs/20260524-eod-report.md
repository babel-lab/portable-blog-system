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

## 13. Addendum — am-8 docs-only follow-up series（落地於 phase `20260524-am-8d-eod-addendum-docs-only-a`）

am-7c EOD freeze 之後，5/24 上午接續啟動 am-8 系列 docs-only 收尾共 4 小批（含本 addendum 自身）。本 §13 為 append-only 補記；§1-§12 內容未修改。

### 13.1 am-8 系列 commits（origin/main timeline；am-7c 後）

| # | commit | message | 性質 | 段 |
|---|---|---|---|---|
| 6 | `581c0a1` | `docs(report): backfill am-7c commit hash in 20260524 eod report` | docs modify | am-8a |
| 7 | `058ebce` | `docs(checklist): add 20260524 blogger backend repost checklist draft` | docs new | am-8b |
| 8 | `fc2a852` | `docs(ga4): add reverse utm observation guide for blogger to github` | docs new | am-8c |

（接續 §3 commits today 表之 #1-#5 + am-7c `5ab7c05`；am-8d 自身 commit 待 user 確認後落地）

### 13.2 am-8 series 各批用途

| 批次 | phase id | 用途 | 影響檔案 |
|---|---|---|---|
| am-8a | `20260524-am-8a-docs-sync-coldstart-followup-a` | cold-start verification 後補實 EOD report §2 / §7.1 五處 placeholder（am-7c commit `5ab7c05` 落地後 + push 後狀態同步至 EOD 文字）| `docs/20260524-eod-report.md`（modify；+5 / -5）|
| am-8b | `20260524-am-8b-blogger-repost-checklist-a` | 新增 Blogger 後台手動重貼 SOP checklist（Theme CSS 重貼 + per-post reverse UTM HTML 重貼 + 備份 / 驗收 / 回滾）| `docs/20260524-blogger-repost-checklist.md`（new；354 lines）|
| am-8c | `20260524-am-8c-ga4-reverse-utm-observation-doc-a` | 新增 GA4 reverse UTM dormant→live 長期觀察指引（Realtime / DebugView / Reports / 常見誤判 / live but dormant 釋義）| `docs/20260524-ga4-reverse-utm-observation.md`（new；323 lines）|
| am-8d（本批）| `20260524-am-8d-eod-addendum-docs-only-a` | 將 am-8 系列補記入 EOD report；維持 §1-§12 既有內容不動 | `docs/20260524-eod-report.md`（append-only；§13 addendum）|

### 13.3 新增文件對照（am-8 系列 docs new）

| 文件 | 性質 | 上層對應 |
|---|---|---|
| `docs/20260524-blogger-repost-checklist.md` | 操作 SOP 草稿；7 章 + status snapshot + 邊界保證 + 後續調整空間（合計 10 章 / 354 行）| `CLAUDE.md` §16.4 / §10、`docs/blogger-to-github-reverse-utm-plan.md`、`docs/reverse-utm-fixture-plan.md`、`docs/design-system-ds3c-hardcoded-color-pre-analysis.md`、`docs/design-token-audit-20260523.md` |
| `docs/20260524-ga4-reverse-utm-observation.md` | 觀察指引；7 章 + status snapshot + 邊界保證 + 後續調整空間（合計 9 章 + §0 / 323 行）| `CLAUDE.md` §16.4、`docs/ga4-enable-preflight.md`、`docs/ga4-link-tracking-spec.md`、`docs/ga4-parameter-naming-registry.md` §1 / §3 / §4.2、`docs/blogger-to-github-reverse-utm-plan.md`、`docs/reverse-utm-fixture-plan.md`、`docs/20260522-ga4-click-tracking-manual-validation.md`、`docs/20260524-blogger-repost-checklist.md` |

### 13.4 狀態維持（unchanged through am-8 series）

| 項目 | 狀態 | am-7c 起變化 |
|---|---|---|
| G2 fully resolved | ✅ live since am-7b deploy `960f234` | ❌ 無變化 |
| DT-A2 hashtag wrap live | ✅ GitHub Pages live；Blogger 後台未重貼 | ❌ 無變化 |
| Reverse UTM Blogger→GitHub live but dormant | 🟡 source live；無 production fixture；Blogger 後台未重貼 | ❌ 無變化 |
| Blogger 後台重貼 deferred | 🟡 待 user 主動決定；am-8b checklist 已備 | 🆕 操作 SOP 已落地（不改變 deferred 狀態）|
| GA4 reverse UTM observation 指引 | 🆕 落地於 am-8c | 🆕 觀察 SOP 已落地（不觸發任何 GA4 後台動作）|

### 13.5 新凍結基準（am-8c push 後 / am-8d 落地前）

| 項目 | 值 |
|---|---|
| **Source repo HEAD** | `fc2a852 docs(ga4): add reverse utm observation guide for blogger to github`（am-8c push 結果）|
| **Source repo origin/main** | `fc2a852`（同步）|
| **Source repo working tree** | clean |
| **Source repo branch tracking** | `main` → `[origin/main]`；ahead 0 / behind 0 |
| **Deploy repo HEAD** | `960f234 deploy: update ga4 link_type and hashtag wrap`（5/24 am-7b 結果；am-8 系列未動）|
| **Deploy repo origin/gh-pages** | `960f234`（同步）|
| **Deploy repo working tree** | clean |
| **Deploy repo branch tracking** | `gh-pages` → `[origin/gh-pages]`；ahead 0 / behind 0 |

（am-8d 自身 commit + push 後新凍結基準將推進至 am-8d commit hash；待 user 確認後更新）

### 13.6 邊界遵守（整個 am-8 系列）

| 項目 | am-8a | am-8b | am-8c | am-8d（本批）|
|---|---|---|---|---|
| 不改 src / 不改 source code | ✅ | ✅ | ✅ | ✅ |
| 不改 content / settings / template / frontmatter | ✅ | ✅ | ✅ | ✅ |
| 不改 dist / dist-blogger / dist-promotion / dist-reports | ✅ | ✅ | ✅ | ✅ |
| 不改 deploy repo（`portable-blog-deploy/`）| ✅ | ✅ | ✅ | ✅ |
| 不 build / 不 validate | ✅ | ✅ | ✅ | ✅ |
| 不 deploy | ✅ | ✅ | ✅ | ✅ |
| 不 push gh-pages | ✅ | ✅ | ✅ | ✅ |
| 不碰 Blogger 後台 | ✅ | ✅ | ✅ | ✅ |
| 不碰 GA4 後台 | ✅ | ✅ | ✅ | ✅ |
| 純 docs（modify / new）| ✅ modify | ✅ new | ✅ new | ✅ append-only modify |

整個 am-8 系列**無**任何 production state 變動；source code / dist / deploy / Blogger 後台 / GA4 後台皆完全未動。

### 13.7 5/24 全日 commits 總覽（含 am-7c + am-8 系列）

| # | commit | 段 | 性質 |
|---|---|---|---|
| 1 | `32f042a` | am-2 | docs new |
| 2 | `073647a` | am-3 | docs modify |
| 3 | `c783c3e` | am-4 | docs modify |
| 4 | `93fec24` | am-5 | docs modify |
| 5 | `e6f0a5f` | am-6 | **source small fix** |
| 6 | `5ab7c05` | am-7c | docs new + modify（EOD report 新增 + audit doc sync）|
| 7 | `581c0a1` | am-8a | docs modify |
| 8 | `058ebce` | am-8b | docs new |
| 9 | `fc2a852` | am-8c | docs new |
| 10（待） | （am-8d commit hash 待 user 確認）| am-8d | docs modify（本 addendum）|

deploy commits: 1（`960f234` on gh-pages；am-7b 結果；am-8 series 未推進）

### 13.8 後續可能（deferred；不啟動）

am-8 series 收尾不改變既有 deferred items；以下仍待 user 主動決定時機：

- Blogger 後台 Theme CSS 重貼（per pm-7 mirror + DT-A2 + DS-3 累積）→ 可用 `docs/20260524-blogger-repost-checklist.md` §3 操作
- Reverse UTM fixture 建立（具 GitHub cross-link 之 full-mode Blogger ready post）→ 詳見 `docs/reverse-utm-fixture-plan.md` §3-§6
- Reverse UTM 進入 production 後之 GA4 觀察 → 可用 `docs/20260524-ga4-reverse-utm-observation.md` §4 / §5 / §6 操作
- G4-G8 次要 gaps triage（per `docs/ga4-click-tracking-coverage-audit-20260524.md`）
- Phase 9-f-e / 9-f-f / 9-f-g（per `docs/phase-9f-c-completion-report.md` 未收尾項）

---

## 14. Addendum — am-9 / am-10 docs-only follow-up series

5/24 上午 am-8d EOD freeze 後接續啟動 am-9（read-only 三批）+ am-10（operator runbook 落地三批）。本 §14 為 append-only 補記；§1-§13 內容未修改。

### 14.1 am-9 / am-10 系列 commits（origin/main timeline；am-8 後）

| # | commit | message | 性質 | 段 |
|---|---|---|---|---|
| 11 | `72ee459` | `docs(reverse-utm): add 20260524 fixture readiness addendum` | docs modify（append-only addendum）| am-9c |
| 12 | `0b62a13` | `docs(runbook): add blogger github publishing and reverse utm runbook` | docs new | am-10a/b |

（接續 §13.7 之 #1-#10；am-10c 自身 commit 待 user 確認後落地）

### 14.2 am-9 / am-10 各批用途

| 批次 | phase id | 性質 | 用途 | 影響檔案 |
|---|---|---|---|---|
| am-9a | `20260524-am-9a-blogger-repost-walkthrough-dryrun-a` | read-only | Blogger 後台手動重貼步驟乾跑；無檔案修改 | — |
| am-9b | `20260524-am-9b-reverse-utm-fixture-readiness-review-a` | read-only | reverse UTM fixture readiness review；確認 dormant 狀態未漂移；無新候選 | — |
| am-9c | `20260524-am-9c-reverse-utm-fixture-readiness-addendum-a` | docs-only（append-only）| 將 am-9b read-only 結論落地為 `docs/reverse-utm-fixture-plan.md` §10 addendum；含 §10.1-§10.7（readiness confirmed / blocked root cause / 現有候選風險 / 最低風險策略 / 未來 6 phase 切分 / cross-links）| `docs/reverse-utm-fixture-plan.md`（append-only；§10 共 7 子節）|
| am-10a | `20260524-am-10a-blogger-repost-operator-runbook-a` | docs-only（new file）| 整合 am-8b / am-8c / am-9c 三件 SOP 為單一 operator-facing runbook | `docs/20260524-blogger-github-publishing-runbook.md`（new；715 lines；§1-§13）|
| am-10b | `20260524-am-10b-runbook-commit-and-push-a` | source push | 將 am-10a runbook commit + push origin/main；無檔案內容變動 | （same as am-10a；commit `0b62a13`）|
| am-10c（本批）| `20260524-am-10c-runbook-index-crosslink-a` | docs-only | 將 runbook 加入 `docs/README.md` §3.3 索引 + append 本 §14 至 EOD report | `docs/README.md`（modify；+1 line）+ `docs/20260524-eod-report.md`（append-only §14）|

### 14.3 am-10 新增文件對照

| 文件 | 性質 | 上層對應 |
|---|---|---|
| `docs/20260524-blogger-github-publishing-runbook.md` | Operator-facing runbook（13 章 / 715 行）| `CLAUDE.md` §5 / §16 / §16.4 / §17 / §19 / §22 / §23 / §24、`docs/20260524-blogger-repost-checklist.md`（canonical 詳本）、`docs/20260524-ga4-reverse-utm-observation.md`（canonical 詳本）、`docs/reverse-utm-fixture-plan.md` §10（canonical 詳本）、`docs/ga4-click-tracking-coverage-audit-20260524.md`、`docs/ga4-link-tracking-spec.md` §4.5、`docs/ga4-parameter-naming-registry.md` §3 / §4.2、`docs/related-links-schema.md`、`docs/checklists/blogger-publish-checklist.md`、`docs/checklists/github-deploy-checklist.md` |

### 14.4 狀態維持（unchanged through am-9 / am-10 series）

| 項目 | 狀態 | am-8d 起變化 |
|---|---|---|
| G2 fully resolved | ✅ live since am-7b deploy `960f234` | ❌ 無變化 |
| DT-A2 hashtag wrap | ✅ GitHub Pages live；Blogger 後台未重貼 | ❌ 無變化 |
| Reverse UTM Blogger→GitHub live but dormant | 🟡 source live；無 production fixture；Blogger 後台未重貼 | ❌ 無變化 |
| Blogger 後台重貼 deferred | 🟡 待 user 主動決定；am-8b checklist + am-10a runbook 已備 | 🆕 runbook entry index 已備（不改變 deferred 狀態）|
| GA4 reverse UTM observation 指引 | 🆕 落地於 am-8c；am-10a runbook §6 收斂引用 | ❌ 無變化（am-10 為彙整）|

### 14.5 新凍結基準（am-10b push 後 / am-10c 落地前）

| 項目 | 值 |
|---|---|
| **Source repo HEAD** | `0b62a13 docs(runbook): add blogger github publishing and reverse utm runbook`（am-10b push 結果）|
| **Source repo origin/main** | `0b62a13`（同步）|
| **Source repo working tree** | clean |
| **Source repo branch tracking** | `main` → `[origin/main]`；ahead 0 / behind 0 |
| **Deploy repo HEAD** | `960f234 deploy: update ga4 link_type and hashtag wrap`（5/24 am-7b 結果；am-9 / am-10 系列未動）|
| **Deploy repo origin/gh-pages** | `960f234`（同步）|
| **Deploy repo working tree** | clean |
| **Deploy repo branch tracking** | `gh-pages` → `[origin/gh-pages]`；ahead 0 / behind 0 |

（am-10c 自身 commit + push 後新凍結基準將推進至 am-10c commit hash；待 user 確認後更新）

### 14.6 邊界遵守（整個 am-9 / am-10 系列）

| 項目 | am-9a | am-9b | am-9c | am-10a | am-10b | am-10c（本批）|
|---|---|---|---|---|---|---|
| 不改 src / 不改 source code | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 不改 content / settings / template / frontmatter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 不改 dist / dist-blogger / dist-promotion / dist-reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 不改 deploy repo（`portable-blog-deploy/`）| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 不 build / 不 validate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 不 deploy | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 不 push gh-pages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 不碰 Blogger 後台 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 不碰 GA4 後台 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 純 docs（read-only / modify / new）| read-only | read-only | append-only modify | docs new | push only | docs modify + append-only |

整個 am-9 + am-10 系列**無**任何 production state 變動；source code / dist / deploy / Blogger 後台 / GA4 後台皆完全未動。

### 14.7 5/24 全日 commits 總覽（含 am-7c + am-8 / am-9 / am-10 系列）

| # | commit | 段 | 性質 |
|---|---|---|---|
| 1 | `32f042a` | am-2 | docs new |
| 2 | `073647a` | am-3 | docs modify |
| 3 | `c783c3e` | am-4 | docs modify |
| 4 | `93fec24` | am-5 | docs modify |
| 5 | `e6f0a5f` | am-6 | **source small fix** |
| 6 | `5ab7c05` | am-7c | docs new + modify（EOD report 新增 + audit doc sync）|
| 7 | `581c0a1` | am-8a | docs modify |
| 8 | `058ebce` | am-8b | docs new |
| 9 | `fc2a852` | am-8c | docs new |
| 10 | （am-8d commit 待回填）| am-8d | docs modify |
| 11 | `72ee459` | am-9c | docs modify（append-only addendum）|
| 12 | `0b62a13` | am-10a/b | docs new |
| 13（待） | （am-10c commit hash 待 user 確認）| am-10c | docs modify（本 §14 + README §3.3）|

deploy commits: 1（`960f234` on gh-pages；am-7b 結果；am-8 / am-9 / am-10 series 未推進）

### 14.8 後續可能（deferred；不啟動）

am-9 / am-10 series 收尾不改變既有 deferred items；§13.8 列項仍待 user 主動決定時機；am-10a runbook 提供 §3 / §6 操作 entry，但不啟動任何實際操作。

---

## 15. Docs Trail / Cross-reference Map — 5/24 SOP and Runbook Index

本章節為 **append-only 補記**；落地於 phase `20260524-pm-11b-docs-trail-consolidation-a`。§1-§14 內容未修改；本 §15 整理 5/24 全日新增 / 修改之主要 docs 之 cross-reference 圖、角色分工、與建議 cold-start 讀取順序，便於明日（或更晚）接手者**單檔可定位**整套 5/24 SOP 與 runbook，避免在密集 cross-link 網中迷路。

本 §15 之落地**不**觸發任何 Blogger / GA4 / build / deploy 行為；屬純導讀工具。

### 15.1 5/24 主要 docs 出生順序（時序由早至晚）

| # | 文件 | 落地 phase | commit | 性質 |
|---|---|---|---|---|
| 1 | `docs/ga4-click-tracking-coverage-audit-20260524.md` | am-2 / am-3 / am-4 / am-5（多輪 append + sync）| `32f042a` / `073647a` / `c783c3e` / `93fec24` | docs new + 多輪 modify（audit 主檔；G1 / G2 / G3 root-cause + resolved；G4-G8 pending）|
| 2 | `docs/ga4-link-tracking-spec.md`（既有；am-3 / am-5 修改）| am-3 / am-5 | 同 1 | docs modify（spec 主檔；§4.5 link_type 派生規則為 canonical）|
| 3 | `docs/click-tracking-governance.md`（既有；am-5 修改）| am-5 | `93fec24` | docs modify |
| 4 | `docs/related-links-schema.md`（既有；am-5 修改）| am-5 | `93fec24` | docs modify |
| 5 | `docs/publishing-workflow-20260523.md`（既有；am-3 修改）| am-3 | `073647a` | docs modify |
| 6 | `src/views/pages/post-detail.ejs`（唯一 source 變動）| am-6 | `e6f0a5f` | source small fix（+4 / -4；cross-site fingerprint 優先）|
| 7 | （deploy 上線）`portable-blog-deploy@960f234` | am-7b | deploy `960f234` | deploy（GA4 link_type + DT-A2 hashtag wrap）|
| 8 | `docs/20260524-eod-report.md`（本文件）| am-7c | `5ab7c05` | docs new（§1-§12 初版）|
| 9 | 本文件 §13 addendum（am-8 series 補記）| am-8d | （待回填）| docs modify（append-only）|
| 10 | `docs/20260524-blogger-repost-checklist.md` | am-8b | `058ebce` | docs new（Blogger 後台手動重貼 SOP）|
| 11 | `docs/20260524-ga4-reverse-utm-observation.md` | am-8c | `fc2a852` | docs new（GA4 reverse UTM 觀察 SOP）|
| 12 | `docs/reverse-utm-fixture-plan.md` §10 addendum | am-9c | `72ee459` | docs modify（append-only readiness review）|
| 13 | `docs/20260524-blogger-github-publishing-runbook.md` | am-10a / am-10b | `0b62a13` | docs new（operator-facing entry runbook；715 行）|
| 14 | `docs/README.md` §3.3 cross-link | am-10c | `7bdfb3a` | docs modify（+1 line；runbook entry）|
| 15 | 本文件 §14 addendum（am-9 / am-10 series 補記）| am-10c | `7bdfb3a` | docs modify（append-only）|
| 16（本批）| 本 §15 + `docs/README.md` §3.3 trail map 提示 | pm-11b | （待 commit）| docs modify（append-only + 1 line README）|

### 15.2 各 docs 之角色分工

| 角色 | 文件 | 用途 |
|---|---|---|
| **EOD checkpoint / decision log** | `docs/20260524-eod-report.md` | 全日工作總覽；§1-§12 為 am-2~am-7c；§13 為 am-8 addendum；§14 為 am-9 / am-10 addendum；§15 為本 trail map；屬歷史紀錄 + 接手導讀 |
| **GA4 audit 主檔** | `docs/ga4-click-tracking-coverage-audit-20260524.md` | G1-G8 coverage gaps；G1 / G2 / G3 fully resolved；G4-G8 deferred；為未來 G4-G8 triage 之入口 |
| **GA4 spec 主檔**（canonical 規則來源）| `docs/ga4-link-tracking-spec.md` | §4.5 link_type 派生規則；§11.1 placement enum；G2 / G3 收斂後之 canonical |
| **Blogger repost canonical 詳本** | `docs/20260524-blogger-repost-checklist.md` | Blogger 後台 Theme CSS / per-post HTML 重貼之完整操作 SOP（備份 / 重貼 / 驗收 / 回滾）；operator 實際操作時開此檔 |
| **GA4 reverse UTM observation canonical 詳本** | `docs/20260524-ga4-reverse-utm-observation.md` | GA4 後台 Realtime / DebugView / Reports 觀察指引；reverse UTM dormant→live 之常見誤判排查 |
| **Reverse UTM fixture canonical 詳本** | `docs/reverse-utm-fixture-plan.md`（含 §10 addendum）| fixture 設計原則 / fixture 類型 / 啟動 6 phase 切分；fixture 建立前讀此檔 |
| **Operator-facing entry runbook**（**非** canonical 詳本；屬整合 entry）| `docs/20260524-blogger-github-publishing-runbook.md` | 單檔可走完一輪 Blogger 重貼 → GitHub 對齊檢查 → GA4 / UTM / reverse UTM 驗收 → 紀錄；引用上述 3 件 canonical 詳本作 deep-dive |
| **Docs index entry** | `docs/README.md` §3.3 | runbook 與 canonical 詳本三件套之 cross-link entry |

### 15.3 Canonical 詳本 vs Entry Runbook 關係

```
                       docs/20260524-blogger-github-publishing-runbook.md
                                     （am-10a；entry runbook；715 行）
                                                  │
                            ┌─────────────────────┼─────────────────────┐
                            ↓                     ↓                     ↓
       docs/20260524-blogger-repost-checklist.md  │   docs/20260524-ga4-reverse-utm-observation.md
              （am-8b；canonical 詳本）           │           （am-8c；canonical 詳本）
                            │                     │                     │
                            │           docs/reverse-utm-fixture-plan.md │
                            │           （含 §10 addendum；am-9c；canonical 詳本）
                            │                     │                     │
                            └─────────────────────┼─────────────────────┘
                                                  ↓
                              docs/ga4-link-tracking-spec.md §4.5
                                  + docs/ga4-click-tracking-coverage-audit-20260524.md
                                       （spec / audit 主檔；canonical 規則來源）
```

**讀法規則**：

- **runbook**（am-10a）= **整合 entry**；提供 sequencing 與 cheat sheet；不重複 canonical 詳本之深度內容
- **canonical 詳本**（am-8b / am-8c / am-9c）= **權威來源**；任何操作細節之 single source of truth
- **spec / audit 主檔**（ga4-link-tracking-spec / ga4-click-tracking-coverage-audit）= **規則 / 缺口** 之 canonical；source / dist 行為對齊之基準
- **runbook 與 canonical 詳本若衝突** → 以 canonical 詳本為準；runbook 應更新；spec 為最高權威

### 15.4 建議 cold-start 讀取順序

#### 15.4.1 5 分鐘快速讀法（只想掌握 5/24 全貌）

1. `docs/20260524-eod-report.md` §1（Date / Context）→ §2.1（統計）→ §5.7（G2 最終狀態）→ §7（Final Baseline）→ §9（Deferred items）（~3 min）
2. `docs/20260524-blogger-github-publishing-runbook.md` §1（Purpose）→ §2.3（Production state 摘要）→ §5.1（UTM 方向總表）（~2 min）

✅ 結果：掌握「今日做了什麼 / production 現況 / 明日可做候選」三件事。

#### 15.4.2 15 分鐘完整讀法（接手者；準備推進下一階段）

1. `docs/20260524-eod-report.md` §1-§7（今日全貌）→ §13（am-8 addendum）→ §14（am-9 / am-10 addendum）→ §15（本 trail map）（~6 min）
2. `docs/20260524-blogger-github-publishing-runbook.md`（runbook 通讀）（~5 min）
3. `docs/ga4-click-tracking-coverage-audit-20260524.md` §7.2（G4-G8 pending）（~2 min）
4. `docs/reverse-utm-fixture-plan.md` §10（readiness review）（~2 min）

✅ 結果：掌握 5/24 + 接手可推進之具體下一階段候選。

#### 15.4.3 Operator 實際操作前讀法

依操作類型分流：

| 操作 | 必讀 | 順序 |
|---|---|---|
| **Theme CSS 重貼** | runbook §3 路線 A → `20260524-blogger-repost-checklist.md` §3（深度步驟）| runbook 先；checklist 對深度步驟 |
| **per-post HTML 重貼** | runbook §3 路線 B + §4 GitHub 對齊 → `20260524-blogger-repost-checklist.md` §4 → `20260524-ga4-reverse-utm-observation.md` §4-§6 | 三件 sequencing |
| **Reverse UTM fixture 建立** | `reverse-utm-fixture-plan.md` §3 / §4 / §10.5 → runbook §6 → checklist §4 → observation guide §4 | fixture plan 先；其他為驗收支援 |
| **GA4 後台觀察** | runbook §5 cheat sheet → `20260524-ga4-reverse-utm-observation.md`（深度指引）| runbook 先；observation 對細節 |

### 15.5 Operator 必看 vs 歷史紀錄 / decision log

| 文件 | Operator 實際操作必看？ | 歷史紀錄 / decision log？ |
|---|---|---|
| `docs/20260524-blogger-github-publishing-runbook.md` | ✅ **必看 entry** | △（同時兼具）|
| `docs/20260524-blogger-repost-checklist.md` | ✅ 必看（深度步驟）| △ |
| `docs/20260524-ga4-reverse-utm-observation.md` | ✅ 必看（GA4 操作時）| △ |
| `docs/reverse-utm-fixture-plan.md`（含 §10）| ✅ fixture 建立時必看 | ✅ §10 為 readiness review snapshot |
| `docs/ga4-click-tracking-coverage-audit-20260524.md` | ❌ 不為日常操作；G4-G8 triage 時讀 | ✅ G1-G8 root-cause 之歷史紀錄 |
| `docs/ga4-link-tracking-spec.md` | ❌ 不為日常操作；source 改動前讀 | ✅ §4.5 為 canonical 規則來源 |
| `docs/20260524-eod-report.md` | ❌ 不為日常操作 | ✅ **全日 decision log**；cold-start onboarding |
| `docs/README.md` §3.3 | ❌ 不為日常操作 | ✅ docs 入口索引 |

### 15.6 5/24 落地之 deferred items 對齊

本 trail map **不**改變既有 deferred items；以下為各 deferred 對應之啟動 entry doc：

| Deferred item | 啟動 entry doc | 對應 phase 切分 |
|---|---|---|
| Blogger 後台 Theme CSS 重貼 | runbook §3 路線 A → `20260524-blogger-repost-checklist.md` §3 | user 自決時機 |
| Reverse UTM fixture 建立 | `reverse-utm-fixture-plan.md` §10.5 Phase 1-6 | user 自決 + 自然文章機會 |
| Reverse UTM production GA4 觀察 | `20260524-ga4-reverse-utm-observation.md` §4-§6 + runbook §6 | blocked on fixture |
| GA4 G4-G8 deferred triage | `ga4-click-tracking-coverage-audit-20260524.md` §7.2 | user 自決優先序 |
| Blogger 端 click attrs | `blogger-listener-strategy.md` §5.1 | 設計層面決議；短期不做 |

### 15.7 邊界保證（落地時）

| 項目 | 狀態 |
|---|---|
| 修改 src（`src/`）| ❌ 無 |
| 修改 content（`content/`）| ❌ 無 |
| 修改 settings JSON | ❌ 無 |
| 修改 template（`src/views/`）| ❌ 無 |
| 修改 dist / dist-blogger / dist-promotion / dist-reports | ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`）| ❌ 無 |
| 執行 `npm run build*` | ❌ 無 |
| 執行 git push | ❌ 無（push 屬 user 確認後另行決定）|
| 觸碰 Blogger 後台 | ❌ 無 |
| 觸碰 GA4 後台 | ❌ 無 |
| 啟動任何 deferred items | ❌ 無 |
| 修改 §1-§14 既有內容 | ❌ 無（純 append §15）|
| 修改其他 5/24 docs 之既有章節 | ❌ 無 |

本 §15 為**純 docs trail / cross-reference map**；落地後**不**改變任何 production state；僅作為未來 cold-start onboarding 與 operator 操作前導讀工具。

### 15.8 後續調整空間

- 未來如有 5/24 之 docs 後續更新（如 G4-G8 落地、fixture 建立、Blogger 後台重貼完成）→ 應**新增** §15.x 子節 append，**不**改本 §15 既有內容
- 5/25 起新一日之 docs trail → 應新建 `docs/20260525-eod-report.md` §15 同型結構，**不**塞回本日 EOD report
- 若 runbook 與任何 canonical 詳本之 cross-link 漂移（如 canonical 詳本章節編號改動）→ 應同時更新 runbook + 本 §15 之引用

---

（本文件結束）
