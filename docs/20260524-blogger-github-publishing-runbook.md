# Blogger / GitHub Publishing & Reverse UTM Validation Runbook

本文件為 BLOG / portable-blog-system 之 **Blogger 手動重貼 + GitHub 文章頁檢查 + reverse UTM 驗收**之**操作者 runbook**；屬 docs-only；於 phase `20260524-am-10a-blogger-repost-operator-runbook-a` 落地。

本文件**不是**新 spec、**不是**啟動指令、**不是**自動化腳本；屬「user 主動執行 Blogger / GitHub 發布 + GA4 / UTM 驗收時，從前置 baseline 確認到事後紀錄之**單一 entry SOP**」。本文件之落地**不**觸發任何 content / src / build / deploy / Blogger 後台 / GA4 後台行為。

本 runbook 整合 5/24 am-8 / am-9 系列三件 SOP 與 reverse UTM readiness 結論，提供 user 在實際操作時**單檔可走完一輪**之指引；既有 am-8b / am-8c / am-9c 三件 source SOP 仍為 canonical 詳本，本 runbook 只做收斂 + 操作 sequencing。

對應上層：

- `CLAUDE.md` §16（連結處理）/ §16.4（Blogger ↔ GitHub cross-site UTM；reverse 方向 source landed but dormant）/ §22（圖片）/ §23（status）/ §24（Blogger publishedUrl 回填）
- `CLAUDE.md` §5（GA4 event）/ §17（文章版型）/ §19（Design System）
- `docs/20260524-blogger-repost-checklist.md`（am-8b；Blogger 後台手動重貼 SOP；canonical 詳本）
- `docs/20260524-ga4-reverse-utm-observation.md`（am-8c；GA4 reverse UTM 觀察 SOP；canonical 詳本）
- `docs/reverse-utm-fixture-plan.md` §10（am-9c；reverse UTM readiness addendum；canonical 詳本）
- `docs/20260524-eod-report.md` §6 / §8 / §9 / §13（5/24 EOD 全貌；am-8 series 收尾）
- `docs/ga4-click-tracking-coverage-audit-20260524.md`（GA4 覆蓋面 audit；G1-G3 resolved；G4-G8 pending）
- `docs/ga4-link-tracking-spec.md` §3 / §4 / §4.5 / §5 / §11（spec 主檔；link_type 派生規則 §4.5 為 canonical）
- `docs/ga4-parameter-naming-registry.md` §3 / §4.2（snake_case 命名 + reverse UTM 規格）
- `docs/click-tracking-governance.md`（governance）
- `docs/related-links-schema.md`（`relatedLinks` / `otherLinks` 欄位字典）
- `docs/checklists/blogger-publish-checklist.md`（精簡發布勾選清單）
- `docs/checklists/github-deploy-checklist.md`（GitHub Pages 部署清單）

---

## §1 Purpose / 使用情境

### 1.1 本 runbook 解決什麼

整合 5/24 之三件 SOP（am-8b / am-8c / am-9c）為**單一 entry 操作指引**；user 不必同時開三份 doc 也可走完一輪「Blogger 重貼 → GitHub 對齊檢查 → GA4 / UTM 驗收 → 紀錄」。

### 1.2 適用情境

| 情境 | 是否適用本 runbook |
|---|---|
| 已有新建 / 修改之 Blogger full-mode post，需手動重貼後台 | ✅ |
| Theme CSS 批次重貼（DT-A2 hashtag wrap / DS-3-c hover overlay 等累積變動）| ✅ §3.A 路線 |
| Reverse UTM fixture 已建立，欲走完整 fixture 驗收流程（pm-26b）| ✅ §6 + §10.B 路線 |
| GitHub Pages 端 GA4 forward UTM（github_pages → blogger）日常觀察 | ✅ §5 |
| 全新 Blogger / GitHub 站初次部署 | ❌ 改讀 `docs/checklists/github-deploy-checklist.md` + `docs/blogger-export.md` |
| 單篇 post 之 Blogger 首次發布（非重貼）| ⚠️ 部分適用；§3 重貼步驟可參考，但發布前 SEO / metadata 設定走 `docs/checklists/blogger-publish-checklist.md` |
| GA4 後台 property / data stream 設定變更 | ❌ 不在本 runbook 範圍 |

### 1.3 不適用情境（明確排除）

- ❌ 不**啟動** fixture 內容建立（屬 `docs/reverse-utm-fixture-plan.md` §10.5 Phase 1）
- ❌ 不**自動執行** Blogger 後台操作（屬 user 手動行為；本 runbook 僅描述）
- ❌ 不**自動執行** GA4 後台查詢（屬 user 手動行為）
- ❌ 不修改 `src/` / `content/` / `dist*/` / deploy repo / settings JSON
- ❌ 不執行 `npm run build*` / git push（除非 §3 / §6 流程明文）

---

## §2 Current baseline / 已知完成狀態

### 2.1 Source repo（2026-05-24 am-9c freeze）

| 項目 | 值 |
|---|---|
| **branch** | `main` |
| **HEAD** | `72ee459 docs(reverse-utm): add 20260524 fixture readiness addendum`（am-9c push 結果）|
| **origin/main** | `72ee459`（同步）|
| **working tree** | clean |
| **ahead / behind** | 0 / 0 |

### 2.2 Deploy repo（2026-05-24 am-7b 結果；am-8 / am-9 系列未動）

| 項目 | 值 |
|---|---|
| **branch** | `gh-pages` |
| **HEAD** | `960f234 deploy: update ga4 link_type and hashtag wrap` |
| **origin/gh-pages** | `960f234`（同步）|
| **working tree** | clean |

### 2.3 Production state 摘要

| 區塊 | 狀態 | 來源 |
|---|---|---|
| GitHub Pages production | ✅ live；對應 deploy `960f234` | am-7b |
| GA4 production | ✅ live；measurementId `G-C77SMPF8VD` | 5/21 pm-46 起 |
| GA4 forward UTM（github_pages → blogger）| ✅ live；含 `click_related_link` / `click_other_link` user 已驗收 | am-7b / am-7c user validation |
| GA4 click `link_type` 派生 | ✅ G2 fully resolved；cross_site fingerprint 優先 | am-6 `e6f0a5f` |
| Affiliate placement enum | ✅ G1 resolved；spec 對齊 source `article_top` / `article_bottom` | am-3 |
| DT-A2 hashtag wrap | ✅ GitHub Pages live；❌ Blogger 後台未重貼 | am-7b（GitHub）/ pm-7（source mirror）|
| **Reverse UTM Blogger → GitHub** | ✅ source live `pm-24a/b/c`；❌ Blogger 後台無任何 full-mode post 重貼；🟡 **dormant** | per `CLAUDE.md` §16.4 / am-9c |
| Reverse UTM fixture | ❌ 尚無 ready full-mode Blogger post 含 GitHub cross-link | per `reverse-utm-fixture-plan.md` §10 |
| GA4 G4-G8 次要 gaps | 🟡 deferred；hashtag span→a / download / social click event 未對接 | per `ga4-click-tracking-coverage-audit-20260524.md` §7.2 |

### 2.4 既有 ready full-mode Blogger post（2026-05-24）

| Slug | status / mode | `relatedLinks` 含 GitHub cross-link？ | 適合 reverse UTM fixture？ |
|---|---|---|---|
| `we-media-myself2` | ready / full / published | ❌ 否 | ❌ 不建議改造（per `reverse-utm-fixture-plan.md` §10.3）|
| `sample-book-review` | draft / full | — | 🚫 不可選（永遠不 export）|
| `github-pages-blog-planning` | ready / summary | — | ❌ 不建議轉 full（破壞 SEO 策略）|
| `portable-blog-system-mvp` | ready / summary | — | 🚫 不可選（已被 seo-2 / seo-3 鎖定）|

→ **目前無可用 fixture**；reverse UTM 驗收條件未成立；維持 dormant。

---

## §3 Blogger 手動 repost 操作流程

本 §3 描述**已決定要重貼**之操作 sequencing；前置決策（是否要重貼）由 user 自決。canonical 詳本：`docs/20260524-blogger-repost-checklist.md`。

### 3.0 兩條重貼路線（先決定走哪條，可同批執行）

| 路線 | 用途 | 觸發條件 | canonical SOP |
|---|---|---|---|
| **路線 A — Theme CSS 重貼** | 套用累積之全站 CSS 變動（DT-A2 hashtag wrap / 未來 DS-3-c hover overlay）| user 主動決定整理累積 CSS | `am-8b §3` |
| **路線 B — Per-post HTML 重貼** | 套用 reverse UTM / 個別 post HTML 變動 | user 主動決定 + fixture 存在 + 已重 build dist-blogger | `am-8b §4` + 本 runbook §6 |

可分別執行；同批執行建議順序：**先 A 後 B**（先全站 CSS 對齊，再個別 post 驗收）。

### 3.1 Pre-flight（每次重貼必做）

```bash
# source repo
cd D:\github\blog-new\portable-blog-system
git status --short --branch         # 應 = ## main...origin/main（clean）
git rev-parse HEAD                  # 對齊 §2.1 之 HEAD 或之後

# deploy repo（read-only 確認；不操作）
cd D:\github\blog-new\portable-blog-deploy
git status --short --branch         # 應 = ## gh-pages...origin/gh-pages（clean）
```

若 baseline 漂移（ahead / behind / dirty）→ **先處理 baseline**，不重貼。

### 3.2 備份（強烈建議；操作前一次性完成）

| 項目 | 路徑 | 何時做 |
|---|---|---|
| Blogger Theme CSS 完整備份 | `D:\github\blog-new\backup\blogger-theme-css-backup-YYYYMMDD.txt` | 路線 A / 任何 Theme CSS 變動前 |
| 目標 post 原始 HTML 備份 | `D:\github\blog-new\backup\blogger-post-html-{slug}-YYYYMMDD.txt` | 路線 B / 每篇重貼前 |

備份保留期：重貼驗收完成 + 24 小時；或永久保留於 `backup/` 作 audit trail。

詳細備份步驟：`am-8b §2`。

### 3.3 路線 A — Theme CSS 重貼

1. 完成 §3.1 + §3.2 之 Theme CSS 備份
2. 開啟 `dist-blogger/theme/blogger-full-style.css`
3. 全選 → 複製
4. Blogger 後台 → **主題** → **自訂** → **進階** → **加入 CSS** → 清空 → 貼入 → **儲存**
5. 重貼後肉眼檢查（任選 1 篇含 hashtag 區塊之 Blogger published post）：

| 檢查項 | 預期 |
|---|---|
| 短 hashtag（< 10 字）| 正常一行 |
| 長 hashtag（如 `#這是一個非常長的中文hashtag字串測試換行`）| 不溢出容器；超寬換行 |
| 多 hashtag 並排 | 容器內自動 wrap；無水平 scroll |
| 桌機 / 平板 / 手機 | 三 viewport 皆 wrap 正常 |
| 文章本文 typography | 與重貼前一致 |
| AdSense 區塊 | 未破版 |

異常徵兆 → §11 觸發回滾。

### 3.4 路線 B — Per-post HTML 重貼

**前置**（任一不成立則停止）：
- ✅ 目標 post 之 `dist-blogger/posts/{slug}/post.html` 已重 build
- ✅ 該 post 確實對應 user 預期之 frontmatter / publishedUrl
- ✅ §3.1 baseline 對齊 + §3.2 該 post HTML 備份完成

**步驟**：

1. Blogger 後台 → **文章** → 目標文章 → **編輯**
2. 切到 **HTML 檢視**
3. 清空目前 HTML
4. 開啟 `D:\github\blog-new\portable-blog-system\dist-blogger\posts\{slug}\post.html`
5. 全選 → 複製 → 貼入 Blogger HTML 檢視區
6. **儲存** → **預覽**（桌機 + 手機皆預覽）
7. 預覽通過後 → **更新**（覆蓋 published 版本）或 **發佈**（首次）
8. 若為 reverse UTM fixture post → 進入 §6 GA4 驗收
9. 若為 published 文章之 URL 變動 → 依 `CLAUDE.md` §24 回填 `.publish.json` 之 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`

---

## §4 GitHub 文章頁檢查流程

GitHub Pages 端在 deploy `960f234` 後屬 production-live；本 §4 為**每次 Blogger 端重貼後 / 每次 deploy 後**之**對齊檢查**。

### 4.1 GitHub Pages production URL 抽樣

production base：`https://babel-lab.github.io/portable-blog-system/`

| URL | 預期 | 用途 |
|---|---|---|
| `/` | 首頁可開啟 | 基本 functional |
| `/posts/we-media-myself2/` | 開啟正常；含 relatedLinks aside | G2 fix 線上驗證樣本 |
| `/posts/github-pages-blog-planning/` | 開啟正常 | regression check |
| `/posts/portable-blog-system-mvp/` | 開啟正常 | regression check |
| `/sitemap.xml` | 14 entries；lastmod `2026-05-24` 或之後 | SEO indexing |
| `/robots.txt` | 含 `Disallow` + `Sitemap` | SEO indexing |

### 4.2 GitHub 文章頁 forward UTM 注入抽樣（every page load）

開啟 `https://babel-lab.github.io/portable-blog-system/posts/we-media-myself2/`；右鍵 → 檢視原始碼 → grep `babel-lab.blogspot.com`：

預期 anchor：

```html
<a class="lab-related-links__link"
   href="https://babel-lab.blogspot.com/.../we-media-myself.html?utm_source=github_pages&amp;utm_medium=referral&amp;utm_campaign=portable_blog_system&amp;utm_content=related_links"
   target="_blank"
   rel="nofollow noopener noreferrer"
   data-ga4-event="click_related_link"
   data-ga4-param-link_type="cross_site"
   data-ga4-param-outbound="false"
   data-ga4-param-placement="related_links" ...>
```

關鍵 invariant：
- ✅ URL 含 forward UTM 4 鍵（`github_pages` / `referral` / `portable_blog_system` / `related_links`）
- ✅ `data-ga4-param-link_type="cross_site"`（**非** `internal`；G2 fix 結果）
- ✅ `data-ga4-param-outbound="false"`（cross-site 視同自家流量；per spec / governance §8.2）
- ✅ `target="_blank"` + `rel` 含 `nofollow noopener noreferrer`

若 `link_type="internal"` 出現 → **G2 fix regression**；停止並開 issue。

### 4.3 GitHub Pages 端不適用之檢查（本 §4 範圍外）

| 項目 | 為何不在此 |
|---|---|
| GA4 measurementId 是否生效 | 屬 GA4 console 側；走 §5 |
| reverse UTM（blogger → github_pages）| 屬 §6；GitHub Pages 端僅是 landing；無 source code 變動 |
| Blogger 端 click attrs | 屬 deferred；per `blogger-listener-strategy.md` §5.1 短期不做 |

---

## §5 GA4 / UTM 檢查點

### 5.1 UTM 方向總表（4 方向 + 兩套 Blogger scheme）

per `docs/ga4-parameter-naming-registry.md` §4.2 + `CLAUDE.md` §16.4 + `ga4-click-tracking-coverage-audit-20260524.md` §4.2：

| 方向 | utm_source | utm_medium | utm_campaign | utm_content | 狀態 |
|---|---|---|---|---|---|
| **FB → Blogger / GitHub** | `facebook` | `social` | `{page}_post` | `{slug}` | ✅ live；走 promotion txt |
| **GitHub → Blogger**（relatedLinks / otherLinks aside）| `github_pages` | `referral` | `portable_blog_system` | `related_links` / `other_links` | ✅ live |
| **Blogger → GitHub**（relatedLinks / otherLinks aside；reverse UTM）| `blogger` | `referral` | `portable_blog_system` | `related_links` / `other_links` | 🟡 source live；🟡 dormant（無 fixture）|
| **Blogger → GitHub**（summary CTA / redirect CTA / canonical / JSON-LD / home/category index）| `blogger` | `internal_referral` | `blogger_to_github` | `{slug}` | ✅ live；legacy `buildBloggerToGithubUrl` scheme |

⚠️ **Blogger 端 2 套 UTM 並存**：aside 走 reverse UTM scheme；CTA / canonical 走 legacy scheme。GA4 報表分析時須以 `utm_content` 區分。

### 5.2 GA4 觀察區域 quick reference

per `docs/20260524-ga4-reverse-utm-observation.md` §2.1：

| 區域 | 延遲 | 用途 |
|---|---|---|
| **Realtime** | < 30 秒 | 重貼 / 點擊後立即驗收 |
| **DebugView** | < 30 秒 | event-level 細節（需 GA Debug Mode extension）|
| **Reports → Acquisition** | 24-48 小時 | 長期 source / medium / campaign 分布 |
| **Reports → Engagement → Events** | 24-48 小時 | 各 GA4 event 觸發次數 |
| **Explore** | 24-48 小時 | 自訂維度交叉 |

### 5.3 必看 GA4 event（per `CLAUDE.md` §5 + `ga4-link-tracking-spec.md`）

| Event | 觸發來源 | 必看 params |
|---|---|---|
| `page_view` | 任何頁面載入 | `page_location`（檢查 UTM query）/ `page_referrer` |
| `session_start` | 新 session | `source` / `medium` / `campaign` / `content`（UTM 歸因）|
| `click_related_link` | GitHub 端 relatedLinks aside 點擊 | `link_type`（**必 `cross_site` 或 `internal` 或 `external`**）/ `placement="related_links"` / `outbound` / `link_url` |
| `click_other_link` | GitHub 端 otherLinks aside 點擊 | 同上；`placement="other_links"` |
| `click_affiliate_cta` | GitHub 端聯盟區塊點擊（若 enabled）| `placement="article_top"` 或 `"article_bottom"`（**非** `affiliate_top`）/ `provider` / `link_url` |

### 5.4 GA4 健康度速查（每次重貼後）

| 檢查 | 預期 | 異常時 |
|---|---|---|
| 開 GA4 Realtime / 用無痕 browser 點 GitHub 文章 → 30 秒內有 `page_view` event | ✅ | 走 `am-8c §6.1` 排查（adblock / cache / extension）|
| `page_location` 含 UTM query | ✅（若連結為 Blogger ↔ GitHub 跨站）| 檢查 Blogger 端 HTML 是否含完整 UTM；§11 觸發回滾 |
| `link_type` 與 URL hostname 一致 | ✅（cross-site host → cross_site；同站 host → internal）| G2 regression；停止 + 開 issue |
| reverse UTM `source=blogger` 出現在 Realtime | ❌ **dormant 期間預期 0**；fixture + 重貼後才有 | per `am-8c §5.1`：dormant 不是 tracking 壞掉 |

---

## §6 Reverse UTM 驗收檢查點

本 §6 為 **fixture 已存在 + Blogger 端已重貼**之啟動條件下之驗收 SOP；fixture 未建立前**本節整段 dormant**。canonical 詳本：`docs/20260524-ga4-reverse-utm-observation.md` §4 + `docs/reverse-utm-fixture-plan.md` §5。

### 6.1 啟動 5 條件（per `am-8c §1.3` + `am-9c §10.5`）

| # | 條件 | 對應 Phase（per `reverse-utm-fixture-plan.md` §10.5）|
|---|---|---|
| 1 | 至少 1 篇 fixture post（content edit + `validate:content` 通過 + frontmatter 含 GitHub cross-link）| Phase 1 |
| 2 | `npm run build:blogger` 成功；dist-blogger post.html 含 reverse UTM 4 鍵；§5.1.1-5.1.4 全部 invariant 通過 | Phase 2 |
| 3 | fixture content commit + push origin/main | Phase 3 |
| 4 | user 手動 Blogger 後台重貼 fixture post；回填 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`；等待 5-10 分鐘 cache | Phase 4（本 runbook §3.4 路線 B）|
| 5 | GA4 Realtime / DebugView 已準備（GA Debug Mode extension 已啟動）| Phase 5 起 |

5 條件**全部成立**才可進入 §6.2 驗收；任一未成立 → **不啟動**；reverse UTM 維持 dormant。

### 6.2 驗收步驟（5 條件齊備後）

1. 開 GA4 Realtime + DebugView 並排視窗
2. 用 **Chrome 無痕 + 無 extension**（或啟用 GA Debug Mode 之 browser）開啟 Blogger 重貼後文章
3. 記錄點擊前 GA4 「使用者」計數
4. 點擊文章內任一 GitHub Pages cross-link（建議分別測 `relatedLinks` aside 與 `otherLinks` aside 兩種）
5. < 30 秒內預期觀察：
   - Realtime 使用者計數 +1
   - DebugView 出現 `page_view`；展開 → `page_location` 含 `?utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links`（或 `other_links`）
   - GitHub Pages 端 page title 對應點擊之 landing page

### 6.3 期望 GA4 dimension 對照

per `am-8c §3.1`：

| URL query param | GA4 dimension | 期望值 |
|---|---|---|
| `utm_source=blogger` | Session source | `blogger` |
| `utm_medium=referral` | Session medium | `referral` |
| `utm_campaign=portable_blog_system` | Session campaign | `portable_blog_system` |
| `utm_content=related_links` / `other_links` | Session manual ad content | `related_links` / `other_links` |

### 6.4 forward UTM 共存驗證

reverse UTM 驗收**同期**亦須驗證 forward UTM 不受影響：

| 動作 | 預期 |
|---|---|
| 開 GitHub 文章 → 點 Blogger cross-link → 回到 Blogger | URL 含 `utm_source=github_pages` |
| 開 Blogger 文章 → 點 GitHub cross-link → 到 GitHub | URL 含 `utm_source=blogger` |
| 兩方向 session 在 GA4 Reports（24-48h 後）皆可看到 | ✅ 雙向並存無衝突 |

### 6.5 與 summary CTA legacy UTM 區分

⚠️ 同一篇 Blogger summary post 之 CTA 點擊（走 legacy `internal_referral` / `blogger_to_github` / `<slug>`）vs aside cross-link 點擊（走 reverse UTM `referral` / `portable_blog_system` / `related_links`）→ **兩者 utm_content 必不相同**：

| 來源 | utm_content 範例 |
|---|---|
| summary CTA | `we-media-myself2`（slug 字串）|
| aside relatedLinks | `related_links`（固定字串）|
| aside otherLinks | `other_links`（固定字串）|

GA4 Reports 篩 `utm_content` 即可區分。

### 6.6 dormant 是預期狀態

per `am-8c §5.1`：

```
source push 完成 → GA4 立即有 reverse UTM 資料？❌ 否
build:blogger 完成 + dist-blogger 含 reverse UTM → 立即有？❌ 否
fixture post.html 重貼 Blogger 後台 → 等 cache + 讀者點擊 → 才有 ✅
```

Realtime 0 使用者 / Reports 24h 後仍 0 row → 走 `am-8c §6.1` 排查；**不要**直接懷疑 source / spec。

---

## §7 聯盟行銷區塊 / 上下區塊點擊識別注意事項

本 §7 為 affiliate placement enum G1 收斂後之**操作層 cheat sheet**；canonical 詳本：`docs/ga4-link-tracking-spec.md` §3.7 / §11.1 + `docs/ga4-click-tracking-coverage-audit-20260524.md` §3.1 / §3.2。

### 7.1 placement value canonical（G1 resolved；source = canonical）

| 區塊 | placement value | 對應 source 位置 |
|---|---|---|
| 聯盟區塊**上方** CTA（top）| **`article_top`** | `src/views/pages/post-detail.ejs:86` |
| 聯盟區塊**下方** CTA（bottom）| **`article_bottom`** | `src/views/pages/post-detail.ejs:139` |

⚠️ **早期 spec 曾出現 `affiliate_top` / `affiliate_bottom`**；am-3 G3 收斂後**已移除**；目前 spec 與 source 皆採 `article_top` / `article_bottom`。

⚠️ **`affiliate_top` / `affiliate_bottom` 字串**：spec §5.4 列為 `utm_content` value，**非** placement value；屬兩套獨立命名 namespace。

### 7.2 聯盟 click event 完整 params（GitHub 端；Blogger 端不對接）

```
data-ga4-event="click_affiliate_cta"
data-ga4-param-post_slug="<%= post.slug %>"
data-ga4-param-link_label="<%= link.label %>"
data-ga4-param-link_type="affiliate"
data-ga4-param-link_url="<%= link.url %>"
data-ga4-param-outbound="true"
data-ga4-param-provider="<%= link.network || '' %>"
data-ga4-param-placement="article_top"   ← 或 article_bottom
```

### 7.3 已知 source 偏差（per G1 audit）

| 項目 | 現況 | 影響 |
|---|---|---|
| `provider` 送中文 label（如「博客來」/「通路王」）| ⚠️ source 直接送 `link.network`（為中文字串）| GA4 dimension 看到中文；可運作但非 slug 標準 |
| `campaign` 未送 | ⚠️ source 未填；spec §4.3 / governance §7.2 optional | 影響有限；屬 optional |

**處理建議**：兩項皆未列入 G2 / G3 之 critical fix；屬 future Phase 2 cleanup。**不**在本 runbook 範圍主動修。

### 7.4 聯盟連結之 rel / target 處理

per `CLAUDE.md` §16.2 + `docs/link-rules.md`：

```html
target="_blank" rel="sponsored nofollow noopener noreferrer"
```

⚠️ 任何聯盟連結若 rel **缺 `sponsored`** → 屬規範違反；視為 source bug，停止使用該 anchor 並通報。

### 7.5 affiliate disclosure 必須伴隨聯盟區塊

per `CLAUDE.md` §12 / `docs/checklists/seo-checklist.md`：

```
affiliate.enabled: true → 必須有 affiliate.disclosure 文字
affiliate.enabled: true + links 為空 → build 時應 warning
```

每次重貼後抽樣檢查：**聯盟區塊不可只有連結沒有 disclosure**。

---

## §8 相關連結 / 其他連結 / hashtag click tracking 檢查點

### 8.1 `relatedLinks` / `otherLinks` aside 之 GA4 attrs（GitHub 端）

per `src/views/pages/post-detail.ejs:177` / `:214` 之 inline attrs：

```html
<a class="lab-related-links__link"
   href="<URL（含 forward UTM 若 cross-site）>"
   target="_blank|（無）"
   rel="nofollow noopener noreferrer|（無）"
   data-ga4-event="click_related_link"
   data-ga4-param-post_slug="<slug>"
   data-ga4-param-link_label="<title>"
   data-ga4-param-link_type="cross_site|internal|external"
   data-ga4-param-link_url="<同 href>"
   data-ga4-param-outbound="true|false"
   data-ga4-param-placement="related_links">
```

`otherLinks` 同型；event 改 `click_other_link`、placement 改 `other_links`。

### 8.2 `link_type` 派生規則（per spec §4.5 / am-5 landed）

cross-site fingerprint **優先於** kind：

```
1. affiliate URL → 'affiliate'
2. cross-site hostname（≠ 當前平台 host）→ 'cross_site'
3. 同平台 host → 'internal'
4. 第三方 host → 'external'
```

⚠️ 即使作者於 frontmatter 標 `kind: internal`，若 URL 為 cross-site host → `link_type='cross_site'`（**非** `internal`）；屬 am-6 `e6f0a5f` source fix 後 canonical 行為。

### 8.3 `kind` 與 `link_type` 兩軸命名分離

per spec §4.5 / `related-links-schema.md` §7.3 / §7.4：

| 軸 | 名稱 | 來源 | 用途 |
|---|---|---|---|
| **author_kind**（content layer）| `kind` | `.md` frontmatter `relatedLinks[].kind` | 作者標記 internal / external |
| **destination_type**（render layer；對外名稱 `link_type`）| `link_type` | build / render derive from URL hostname | GA4 event param |

兩軸**獨立**；**不互相 fallback**。

### 8.4 `relatedLinks` / `otherLinks` 內容屬性放置

per `related-links-schema.md` + `CLAUDE.md` §16.5：

| 欄位 | 放置 | 不放 |
|---|---|---|
| `relatedLinks` / `otherLinks` 陣列 | `.md` frontmatter | `.publish.json` / `.fb.md` |
| `[Youtube]` / `[台北市立圖書館]` 等顯示前綴 | `platform` 欄位 | **不**併入 `title` |
| `target` / `rel` 之手填 | ❌ 不手填；build / render 依 `kind` + URL 自動派生 | — |

### 8.5 Hashtag click tracking — 目前狀態

per `ga4-click-tracking-coverage-audit-20260524.md` §3.4 / §7 + `hashtag-slug-decision.md`：

| 項目 | 狀態 |
|---|---|
| Hashtag DOM | `<span class="lab-hashtag">`（**非** `<a>`）|
| `click_hashtag` event | ❌ 未實作（屬 G4；deferred） |
| 前置 span→a 改造 | ❌ 未啟動 |
| Source landed 屬 | ❌ **無** GA4 attr 於 hashtag span |

→ **目前 hashtag 點擊不會觸發任何 GA4 event**；屬已知 deferred。

驗收注意：若 GA4 後台無 `click_hashtag` event row → 屬**預期**；非 tracking 壞。

### 8.6 內部連結（同平台）vs 跨站 vs 外部 — 完整 cheat sheet

per `CLAUDE.md` §16 + `link-rules.md` + spec §4.5：

| 場景 | rel | target | UTM | link_type | outbound |
|---|---|---|---|---|---|
| 同站內部連結（同 host）| 不加 nofollow | 同分頁 | ❌ 不加（避免污染 GA4 source）| `internal` | `false` |
| 跨站（Blogger ↔ GitHub）relatedLinks / otherLinks | `nofollow noopener noreferrer` | `_blank` | ✅ forward / reverse UTM 自動注入 | `cross_site` | `false` |
| 第三方外部連結（一般）| `nofollow noopener noreferrer` | `_blank` | ❌ 不加 | `external` | `true` |
| 聯盟連結 | `sponsored nofollow noopener noreferrer` | `_blank` | ❌ 不加（promotion.config.json 走另一路徑）| `affiliate` | `true` |

---

## §9 操作前 checklist

每次啟動 §3 重貼前**逐項勾選**。

### 9.1 Baseline / repo state

- [ ] source repo HEAD 對齊 §2.1（或 user 確認之後續 commit）
- [ ] source repo working tree clean（`git status --short --branch` 顯示 `## main...origin/main` 無 modified / untracked）
- [ ] source repo ahead / behind = 0 / 0
- [ ] deploy repo 已對齊 origin/gh-pages（read-only；不操作）
- [ ] 預期不需重 build（dist / dist-blogger 已 up-to-date）；若需重 build，先停下並對齊期望

### 9.2 備份

- [ ] 路線 A：Blogger Theme CSS 已備份至 `backup/blogger-theme-css-backup-YYYYMMDD.txt`
- [ ] 路線 B：每篇目標 post 之原始 HTML 已備份至 `backup/blogger-post-html-{slug}-YYYYMMDD.txt`
- [ ] 備份檔已開啟驗證（內容非空、編碼正常）

### 9.3 環境 / 驗收準備

- [ ] 預備 **無痕 / Incognito** browser（Chrome 推薦）以排除 cache / 登入 session 影響
- [ ] GA Debug Mode chrome extension 已安裝（若走 §6 reverse UTM 驗收）
- [ ] GA4 Realtime / DebugView 後台分頁已開啟並登入正確 property
- [ ] 預估驗收時段足以涵蓋桌機 + 手機 + GA4 觀察（建議 30 分鐘以上）

### 9.4 Reverse UTM fixture 啟動條件（僅 §6 路徑）

僅當欲走 §6 reverse UTM fixture 驗收時必填：

- [ ] §6.1 條件 1：fixture post 已存在於 `content/blogger/posts/`
- [ ] §6.1 條件 2：`npm run build:blogger` 已重 build；dist-blogger post.html 已含 reverse UTM 4 鍵
- [ ] §6.1 條件 3：fixture content 已 commit + push origin/main
- [ ] §6.1 條件 4 / 5：本次 session 已準備執行 §3.4 路線 B 重貼 + GA4 觀察

若任一條件不成立 → **不啟動** §6；reverse UTM 維持 dormant。

### 9.5 不該做的事（每次必勾）

- [ ] **不**為驗收硬改既有 ready / published 文章之 `mode` / `relatedLinks` 結構（per `reverse-utm-fixture-plan.md` §2 / §10.3）
- [ ] **不**在 `content/validation-fixtures/` 建立 reverse UTM fixture（per `reverse-utm-fixture-plan.md` §3.5）
- [ ] **不**修改 GA4 後台 property / data stream / custom dimension 設定（屬獨立操作）
- [ ] **不**啟動 Blogger API / Google Drive API 自動化（per `CLAUDE.md` §4 / §29 第一版禁用）

---

## §10 操作後 checklist

每次重貼完成後**逐項勾選**。

### 10.1 視覺驗收（桌機 + 手機）

| 區塊 | 桌機 ☐ | 手機 ☐ |
|---|---|---|
| 文章標題 / metadata | □ | □ |
| 文章本文 typography | □ | □ |
| Hashtag 區塊（換行 / wrap）| □ | □ |
| 相關連結 / 其他連結 aside | □ | □ |
| 聯盟區塊（若有；disclosure + links）| □ | □ |
| AdSense 區塊（若有）| □ | □ |
| Footer / 社群連結 | □ | □ |

### 10.2 互動驗收

- [ ] Hashtag 點擊 → 跳轉至對應 Blogger 標籤頁（無 click event 為預期；per §8.5）
- [ ] 內部相關連結（Blogger 同站）→ 同分頁開啟；無 nofollow
- [ ] 跨站連結（Blogger → GitHub）→ 新分頁開啟；URL 含 reverse UTM（**僅當** §3.4 重貼了含 reverse UTM 之 post.html；否則 URL 為 raw）
- [ ] 第三方外部連結 → 新分頁；rel 含 `nofollow noopener`
- [ ] 聯盟連結（若有）→ 新分頁；rel 含 `sponsored nofollow noopener`

### 10.3 GA4 Realtime / DebugView 觀察

| Event | 預期參數 | ☐ |
|---|---|---|
| `page_view`（重貼後文章）| `page_title` / `page_location` 對應重貼文章 | □ |
| reverse UTM `session_start`（若 §6 走完）| `source=blogger` / `medium=referral` / `campaign=portable_blog_system` / `content=related_links` 或 `other_links` | □（僅 §6）|
| forward UTM `session_start`（從 GitHub → Blogger 點擊回測）| `source=github_pages` / 同 medium / 同 campaign / 同 content | □ |
| GitHub 端 `click_related_link`（若走 §4.2 抽樣 + 真實點擊）| `link_type=cross_site` / `outbound=false` / `placement=related_links` | □ |

### 10.4 跨瀏覽器（建議；非必要）

| Browser | 桌機 ☐ | 手機 ☐ |
|---|---|---|
| Chrome | □ | □ |
| Safari | □ | □ |
| Firefox | □ | — |
| Edge | □ | — |

### 10.5 紀錄與後續

- [ ] 若為 §3.4 路線 B published 文章 URL 變動 → 回填 `.publish.json` 之 `blogger.publishedUrl` / `bloggerPostId` / `publishedAt`
- [ ] 若為 §6 reverse UTM fixture 驗收完成 → 新增 `docs/YYYYMMDD-reverse-utm-fixture-verification-report.md`（per `reverse-utm-fixture-plan.md` §7.3）
- [ ] 若有任何異常 / 回滾 → 於 `docs/` 註記異常徵兆 + 觸發回滾之檔案版本（per `am-8b §6.4`）
- [ ] 備份檔保留期：驗收完成 + 24 小時後可整理；或永久保留作 audit trail

---

## §11 風險與停止條件

### 11.1 立即停止 / 觸發回滾之徵兆

| 徵兆 | 動作 |
|---|---|
| 重貼後文章版面破版 | 立即 §11.2 回滾 |
| AdSense 區塊異常 | 立即 §11.2 回滾 |
| 任何讀者可見之顯示錯誤 | 立即 §11.2 回滾 |
| GitHub 端 `link_type="internal"` 出現於 cross-site URL | G2 fix regression；停止 + 開 issue；**不**回滾 deploy（屬 source 問題）|
| Blogger 端重貼後 hashtag 區塊橫向溢出 / 出現水平 scrollbar | DT-A2 失效；§11.2 回滾 Theme CSS |
| GA4 Realtime 24 小時後仍無任何 event（含 `page_view`）| 走 `am-8c §6` 排查（adblock / GTM consent / measurementId）；非自動回滾 |
| reverse UTM 之 `utm_content` 為 `(not set)` | 該連結不在 `relatedLinks` / `otherLinks` aside 內（per `am-8c §6.1`）；確認連結 source；**非** bug |

### 11.2 回滾步驟（per `am-8b §6`）

#### Theme CSS 回滾（路線 A）

1. Blogger 後台 → **主題** → **自訂** → **進階** → **加入 CSS** → 清空
2. 開啟 `backup/blogger-theme-css-backup-YYYYMMDD.txt` → 全選複製
3. 貼回 Blogger → **儲存**
4. 驗收：開啟原異常文章 → 確認回到舊版顯示

#### 單篇 post HTML 回滾（路線 B）

1. Blogger 後台 → **文章** → 目標文章 → **編輯** → **HTML 檢視**
2. 清空 HTML
3. 開啟 `backup/blogger-post-html-{slug}-YYYYMMDD.txt` → 全選複製
4. 貼回 Blogger → **儲存** → **預覽** → **更新**

#### 回滾後

- [ ] **不**立即重試重貼；先確認 source 端是否有修正需求
- [ ] 於 `docs/` 註記異常徵兆 + 觸發回滾之檔案版本
- [ ] 若涉及 reverse UTM 失效，註記 fixture URL 與點擊行為，供 `reverse-utm-fixture-plan.md` 後續更新

### 11.3 停止條件（不執行整個 runbook）

任一成立 → **本 runbook 不啟動**：

- ❌ source repo working tree dirty / ahead 未推 / behind 未拉
- ❌ user 對重貼風險未明確同意（覆蓋既有 published post 之決策必須 user 明文）
- ❌ 路線 A 未完成 Theme CSS 備份
- ❌ 路線 B 未完成目標 post HTML 備份
- ❌ §6 reverse UTM 驗收：fixture 不存在 / 未 build / 未 commit
- ❌ 無可用驗收時段（< 15 分鐘）→ 改下次

### 11.4 本 runbook 邊界（落地保證）

| 項目 | 狀態 |
|---|---|
| 修改 source（`src/`）| ❌ 無 |
| 修改 content（`content/`）| ❌ 無 |
| 修改 settings（`content/settings/`）| ❌ 無 |
| 修改 template（`src/views/`）| ❌ 無 |
| 修改 dist / dist-blogger / dist-promotion / dist-reports | ❌ 無 |
| 修改 deploy repo（`portable-blog-deploy/`）| ❌ 無 |
| 執行 `npm run build*` | ❌ 無（本 runbook 不執行；但 §6 / §3.4 之 user 路徑可能需要先 build）|
| 執行 git push | ❌ 無 |
| 觸碰 Blogger 後台 | ❌ 無（本 runbook 僅描述步驟，未執行）|
| 觸碰 GA4 後台 | ❌ 無 |

本 runbook 為**操作支援文件**，落地後**不**改變任何 production state；只在 user 主動啟動操作時被讀取參考。

---

## §12 下一步建議

### 12.1 短期（user 主動決定時機）

| 動作 | 啟動條件 | 對應 SOP |
|---|---|---|
| 走 §3 路線 A — Theme CSS 重貼 | user 評估 DT-A2 hashtag wrap mirror 已累積足夠價值 | 本 §3 + `am-8b §3` |
| 走 §3 路線 B — `we-media-myself2` 重貼（非 reverse UTM 路徑）| user 評估該 post 需更新 metadata / typography | 本 §3 + `am-8b §4` |
| reverse UTM fixture 建立 | user 寫新書評 / 心得 / 系統建置文章自然引用 GitHub 站，或主動依 `reverse-utm-fixture-plan.md` §10.5 Phase 1 落地 | `reverse-utm-fixture-plan.md` §3 / §4 / §10.5 |

### 12.2 中期（fixture 落地後）

完整 fixture 驗收 6 phase（per `reverse-utm-fixture-plan.md` §10.5）：

```
Phase 1（content edit）→ Phase 2（build verify）→ Phase 3（commit + push）
                                                        ↓
Phase 4（Blogger repost；本 runbook §3.4）→ Phase 5（GA4 observe；本 runbook §6.2）→ Phase 6（verification report）
```

Phase 1-3 可一個 session 走完；Phase 4-5 需 user 手動 + GA4 觀察時段；Phase 6 driven by 驗收結果。

### 12.3 長期（GA4 G4-G8 deferred）

per `docs/ga4-click-tracking-coverage-audit-20260524.md` §7.2：

| Gap | 候選方向 |
|---|---|
| G4：hashtag span→a + `click_hashtag` event | 前置改造 + spec 已 `🔵 future`；待 user 決定時機 |
| G6：download box `download_click` event | `CLAUDE.md` §5 列；spec 未對接；reconcile gap |
| G7：social follow `social_click` event | 同上 |
| G5：article body inline link `click_external_link` | 屬 spec §4.2 建議追加；未實作 |
| G8：provider id mapping（中文 label → slug）| affiliate provider 中文化問題 |

→ 本 runbook **不**啟動 G4-G8；屬 Phase 2 cleanup；user 主動決定。

### 12.4 不建議方向

- ❌ 為驗收硬改既有 ready / published 文章作為 fixture
- ❌ 在 `content/validation-fixtures/` 建立 reverse UTM fixture
- ❌ Blogger 端加 click attrs（per `blogger-listener-strategy.md` §5.1 短期不做；Blogger 後台貼上之 HTML 不含 Vite bundle，listener 永不啟動）
- ❌ 整本 runbook 後續若需更新（如新增 fixture / GA4 G4-G8 落地 / Blogger 後台累積新變動）→ 維持 append-only 或新版命名；**不**回頭改 §1-§11 既有內容

---

## §13 後續調整空間

本 runbook 為**第一版 v0**；可後續調整：

- 首次走完 §3 路線 A + B + §6 驗收後，§9 / §10 checklist 可依實際操作經驗細化
- reverse UTM fixture 落地後，§6 之「dormant 但已啟動」段可改寫為「live」段
- GA4 G4-G8 中任一落地後，§5 / §7 / §8 對應段可加 event 細節
- Blogger 後台介面改版時，§3 步驟描述需更新
- 累積實際異常 / 回滾經驗後，§11 risk matrix 可細化新增 case
