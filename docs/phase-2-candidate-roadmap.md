# Phase 2 候選工作清單

> Last updated: 2026-05-26
> Audit baseline: commit `863d7e8`
> 本次更新對應 `20260526-am-6-phase-2-roadmap-drift-audit-readonly-a` 之 DR1 ~ DR20 處理；incidental observations OB1 ~ OB10 deferred to later session。

本文件集中列**第一階段完成後可能推進之候選工作**。屬 roadmap 性質；**所有項目皆需 user 明示啟動方可進**；本文件**不**承諾任何時程。

對應上層：
- `docs/README.md` §6 — 下一階段候選摘要
- `docs/phase-1-user-operation-guide.md` §10 — 第一階段完成前仍需人工確認項目
- `CLAUDE.md` §29 — 第一版不做清單

---

## 1. 🟢 可安全做的小修

低風險；docs / 純 additive / 不影響線上 / baseline 漂移可控。

| # | 項目 | 對應文件 / 系列 | 預估 LOC | 備註 |
|---|---|---|---|---|
| 1.1 | ~~DS-3-c-a：`_header.scss` `#fff` → token / `_mobile-drawer.scss` 移除 fallback~~ | `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §14 | — | ✅ DS-3-c-a 已於 20260520 commit `f530a39` 完成；✅ DS-3-c-b 已於 commits `67a0ccc` (GitHub source) + `cc2621d` (mirror partial sync) 完成；✅ DS-3-c-c 已於 Phase 20260520-pm-6 採方案 C 豁免（documented exemption；無 source 改動；per `design-system-ds3c-hardcoded-color-pre-analysis.md` §5.2 / §14.3）；**DS-3-c 整體 resolved**（10 fixes + 2 documented exemptions）|
| 1.2 | ~~GA4 prod-only gating（dev mode 不送 event）~~ | `docs/ga4-enable-preflight.md` §2.4（已採 B_docs；對應 pm-11 user Option A）/ §2.6 | — | ✅ **gating + 啟用全部完成** — gating 已 Phase 20260521-pm-11 / C-2 Option A 落地（`isProdBuild` flag at `makeBaseData` + 4-AND condition at `ga4.ejs`）；**GA4 已 activated 2026-05-21**（measurementId `G-C77SMPF8VD` production live；per README）|
| 1.3 | ~~FB completeness 條件式（如 `enabled=true && status=published && !postUrl → missing`）~~ | `docs/fb-post-url-metadata-proposal.md` §5.3 / P3 | — | ✅ **Admin completeness + validate-level rule 皆完成**：Admin-only 已於 Phase 20260521-mid-2 / C-3-a（commit `edbf6d0`）；validate-level rule `fb-post-url-missing`（severity=`warning`）已於 Phase 20260521-pm-34（commit `13e38ba`）；fixtures：pm-31 populated（commit `0d4d821`）+ pm-34 missing（同 `13e38ba`）；validate baseline 目前為 `0 error / 39 warning / 34 posts`（+1 warning from negative fixture）|
| 1.4 | Admin disclaimer drift fix（若有新 phase 落地後 disclaimer 過時） | per c-3 pattern | <5 LOC | 例如 P5-c 落地後更新 FB Post section disclaimer |
| 1.5 | docs index 更新（如新增 phase docs 後 README cross-link 補齊）| 本批已建 `docs/README.md` | docs only | 隨 docs 變動逐次同步 |
| 1.6 | Affiliate 首篇啟用 readiness（自然書評觸發；schema / providers / `click_affiliate_cta` event 全就位；無 ready post 設 `affiliate.enabled=true`）| `docs/20260525-affiliate-first-activation-readiness.md` | 0 source 改 | 🟡 **passive wait**；不主動建 fixture；待自然書評觸發後 author 設 `affiliate.enabled=true` + 填 `affiliate.links` 即自動 live |
| 1.7 | 自然 fixture 內容規劃（reverse UTM positive fixture；docs-only / content-only；**不**現在實作）| `docs/reverse-utm-fixture-plan.md` §4 / §10.4 + `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` §H + `docs/20260526-reverse-utm-positive-fixture-scan-report.md` §7 | docs only / passive | 🟡 **passive wait**（主軌）；屬 reverse UTM dormant 期間自然產出；題目規劃可 docs-only 落地（per user spec「不得實作」邊界）|

---

## 2. 🟡 需要 user 決策後才能做

需 user 明示同意 / 提供決策值 / 勾選 preflight checklist 才可啟動。

### 2.1 ~~GA4 真正啟用 measurementId~~

✅ **已於 2026-05-21 落地**；measurementId `G-C77SMPF8VD` production live；最近 deploy `960f234`（2026-05-24）；per README line 156 + `docs/phase-1-completion-report.md`。原阻擋條件（user 取得 GA4 property + 勾完 8 項 preflight + 明示同意）皆已完成。本條目保留為歷史脈絡。

### 2.2 FB sidecar write（FB-P5-c）

- 對應：`docs/fb-sidecar-write-preflight-decision.md` §7
- 阻擋條件：user 須勾完 8 項 + 6 項前置確認
- 推薦拆批：
  - **FB-P5-c-a** server-side dry-run validation endpoint（不寫檔；🟢 低）
  - **FB-P5-c-b** 真實寫入（🟡 中）
- 預估：P5-c-a ~150 LOC / P5-c-b ~80 LOC
- 風險：🟡 中（首次落地 fs.writeFile + atomic rename）

### 2.3 Admin SEO write（Admin-2-b-2）

- 對應：`docs/admin-2-write-pre-analysis.md` §7.2
- 範圍：write `description` / `searchDescription` 至 `.md` frontmatter
- 寫入策略：B（temp+rename atomic）+ D（dry-run default）+ E（pre-write validate）+ F（post-write validate）
- 預估：~80 LOC
- 風險：🟡 中（首次落地 .md 寫入；與 FB-P5-c 同類）

### 2.4 DS-3-b platform theme tokens（補完整 platform override）

- 對應：`docs/design-system-ds3b-theme-overrides-proposal.md` §4 / §5
- 阻擋條件：
  - user 設計師決方案（A 保守 alias vs B 平台品牌化）
  - 若採 B → user 確認具體色票 hex 值
- 已落地：方案 A 保守版（commit `a129a79`；只 `--lab-color-primary` + secondary alias + link 沿用 primary；其餘 reserved）
- 預估：~20 LOC SCSS（_themes.scss）
- 風險：🟡 中（平台視覺改變；需 visual diff）

### 2.5 DS-3-b-blogger-entry（讓 themes 真進 Blogger CSS）

- 對應：`docs/design-system-ds3b-theme-overrides-proposal.md` §5.6 / §7
- 範圍：blogger entry SCSS `@use 'abstracts/themes'`；讓 platform override 進入 dist-blogger/theme/*.css
- 影響：Blogger 後台需重貼 `blogger-full-style.css`
- 預估：~10 LOC + 重產 dist-blogger
- 風險：🟡 中（user 需重貼 Blogger 後台 CSS；單次成本）

### 2.6 ~~DS-3-c-b：hover overlay tokenize + mirror 同步~~

✅ **已於 20260520 完成**（commits `67a0ccc` GitHub source + `cc2621d` mirror partial sync）；per `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §14.2。

- 對應：`docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §5.1 / §7 / §14.2
- 範圍：8 個 `color-mix(..., #000)` → `color-mix(..., var(--lab-color-overlay-dark))`；含 `_blogger-components-rules.scss` mirror 同步
- 預估：~7 行 / 3 檔（實際落地 1+2 commits / 3 檔）
- 風險：🟡 中（mirror 同步成本；Blogger CSS 文本變動建議重貼；user 可擇時重貼，render 視覺相同）

### 2.7 ~~DS-3-c-c：`.lab-hero` gradient 抽 token~~

✅ **已於 20260520 Phase pm-6 採方案 C 豁免**（documented exemption；per `docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §5.2 / §14.3）。

- 對應：`docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §5.2 / §14.3
- 決議：方案 C（豁免；保留 hex；無 source 改動）
- 理由：hero gradient 為視覺表現色（chrome；非共用 component）；不適合套 semantic token；不為清零而製造不自然 token
- 影響：`src/styles/base/_base.scss:5` 之 `#eff6ff` + `#fff` 2 個 hex 視為 documented exemption；DS-3-c 整體 resolved（10 fixes + 2 exemptions）

### 2.8 FB sidecar 新建 sidecar（FB-P5-e）

- 對應：`docs/fb-sidecar-write-preflight-decision.md` §3.6
- 範圍：Admin 提供「create new `.fb.md`」功能
- 阻擋條件：FB-P5-c 已落地 + user 決議 sidecar template 預設值
- 風險：🟡 中（new file creation；與 FB-P5-c 同類 atomic write 邏輯）

### 2.9 Custom domain 啟用

- 對應：`docs/custom-domain-root-files-strategy.md`
- 範圍：將 GitHub Pages 預設 host（`babel-lab.github.io/portable-blog-system`）切換為自訂網域；同步調整 canonical / sitemap base / GA4 / Blogger cross-link 引用
- **🔴 BLOCKED**：user 須取得 domain + DNS provider access
- 後續依賴：§2.10 AdSense 啟用之前置；HTTPS Enforce 為一次性設定
- 風險：🟡 中（涉 deploy repo CNAME + canonical 大規模重 build；user 一次性手動）

### 2.10 AdSense 申請 / 啟用

- 對應：`content/settings/ads.config.json`（`enabled=false`）+ README line 172-173
- 範圍：啟用 GitHub Pages 站之 AdSense；既有 Blogger 站 AdSense 不變
- **🔴 BLOCKED**：依賴 §2.9 custom domain 完成 + HTTPS Enforce + AdSense 審核通過
- 風險：🟡 中（外部審核時程不可控）

---

## 3. 🔴 中風險功能

### 3.1 sitemap 多平台拆分（SEO-4-a ~ e）

- 對應：`docs/seo-sitemap-split-pre-analysis.md` §7
- **本 pre-analysis 結論：當前規模未到拆分必要；不建議實作**
- 若啟動需拆 5 sub-batches（a 盤點 / b build-sitemap / c 跑 build 驗證 / d robots+docs sync / e deploy repo 同步）
- 風險：🔴 高（涉 build / robots / Search Console resubmit / GitHub Pages 部署）

### 3.2 _blogger-components-rules.scss mirror 整合（DS-3-e）

- 對應：`docs/design-system-ds3c-hardcoded-color-pre-analysis.md` §6.1
- 範圍：將 Blogger build pipeline 改為直接 import `src/styles/components/*`（不 mirror）
- 影響：dist-blogger/theme/* 內容大幅變動；Blogger 後台需重貼
- 風險：🔴 高（屬 build 結構重構；Blogger 後台必重貼；影響範圍廣）

### 3.3 Blogger → GitHub Pages 反向 UTM 自動處理（cross-link GA4）

- **狀態：🟡 source landed but dormant**（pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe`；2026-05-23 push origin/main）
- 對應：`CLAUDE.md` §16.4（規格主錨）+ `docs/blogger-to-github-reverse-utm-plan.md` + `docs/reverse-utm-fixture-plan.md` + `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md` + `docs/20260526-reverse-utm-positive-fixture-scan-report.md`
- 已完成：source 三 commits + L1 smoke + pm-25 pre-deploy verify + pm-26 preflight readiness doc + fixture scan report
- 範圍：Blogger full-mode 文章之 `relatedLinks` / `otherLinks` 中之 GitHub Pages cross-link 自動注入 `utm_source=blogger&utm_medium=referral&utm_campaign=portable_blog_system&utm_content=related_links|other_links`
- **🔴 pm-26 deploy gate BLOCKED**：positive GitHub cross-link fixture 不存在（per `reverse-utm-fixture-plan.md` §6 條件 1 不成立 + `pm26-preflight` §D.1-3 條件 2 不成立）
- 啟動條件：等自然書評 / 心得文章自然引用 GitHub Pages 技術文（主軌；per `fixture-plan` §10.4）；或 user 自決時機主動撰寫副軌 A 文章
- 風險：🟢 source 已驗證；pm-26 啟動屬 user 手動操作（Blogger 重貼 + GA4 Realtime 驗收）

### 3.4 Admin pagination（替代 show-all toggle）

- 對應：Phase 20260520-a audit §5 task D / Phase 20260520-b-4 已落地 show-all toggle
- 若文章 > 100 時 show-all 仍可能慢 → 改 pagination
- 風險：🟡 中（UI 改動；需設計 page size / page nav）

### 3.5 GA4 event attr rollout（5-d 後續整合）

- 對應：`docs/seo-ga4-adsense.md` §5.3 之 8 個 event（除 page_view 自動）
- ✅ **多數已 landed**：`click_affiliate_cta`（top / bottom + placement params）/ `click_related_link` / `click_other_link` 全 landed；GitHub→Blogger forward UTM live；Blogger→GitHub reverse UTM source landed dormant（per §3.3）；GA4 production live 2026-05-21
- 🟡 **唯一明確 pending**：hashtag `click_hashtag` event（per §3.6）
- 風險：🟢 多數已完成；剩餘項目見 §3.6

### 3.6 hashtag `<span>` → `<a>` + `click_hashtag` event 對接

- 對應：`docs/hashtag-slug-decision.md` + README line 159 / 177
- 範圍：hashtag 改為 `<a>` 連結（含 slug routing 決議）+ 注入 `data-ga4-event="click_hashtag"` attr
- 屬 Phase 2 候選（per `docs/phase-1-completion-report.md` §8）
- 風險：🟡 中（DOM 結構變動；涉兩端 Blogger / GitHub mirror；需驗 SEO 影響）
- 待決：hashtag slug 規則 / 路由策略（per `hashtag-slug-decision.md`）

### 3.7 Phase 9-h-f 兩端 Related Posts auto block

- 對應：`docs/phase-1-completion-report.md` §8.4
- 範圍：跨兩端（GitHub + Blogger）自動相關文章推薦邏輯（依 tags / category / contentKind / series.id 計算）
- 與 `relatedLinks` / `otherLinks` 屬 two-track 獨立機制（不互相 fallback）
- **🔴 BLOCKED**：trigger 為作者 ≥ 5 篇 ready post；當前 3 篇
- 建議拆 3 子批：GitHub-only / Blogger-only / 共用邏輯
- 風險：🟡 中（演算法設計 + 兩端 render 對齊）

### 3.8 Link source registry / related-links source labels

- **狀態：🟢 design-only landed；無 consumer**
- 對應：
  - `docs/20260526-related-links-source-label-admin-design.md`（night-1 docs-only / design-only 設計建議；commit `fc7ac8a`）
  - `docs/related-links-schema.md` §11（addendum；本批同步落地）
  - night-3 read-only implementation-impact audit（與既有 canonical schema 無衝突；新欄位皆為 additive）

#### 背景

- night-1 已完成 source label / `sourceKey` / `displayLabel` / Admin 可管理 之設計建議
- night-3 read-only audit 確認設計與既有 canonical schema 完全不衝突；既有 8 欄位 `kind` / `platform` / `title` / `url` / `description` / `order` / `target` / `rel` 不變
- 當前 repo **無** `content/settings/link-sources.json`；**無** `sourceKey` 寫入；**無** 任何 consumer（renderer / GA4 / Admin / validate 皆未感知）

#### 範圍（建議拆 7 子批；逐批啟動）

1. **Step 1：docs-only roadmap / schema addendum**（本批；roadmap §3.8 + schema §11）
2. **Step 2：settings-only** — 新增 `content/settings/link-sources.json` 初版 registry（純 additive；無 consumer；零 build / dist 影響）
3. **Step 3：template-only** — 5 個 `content/templates/*.md` 之 `relatedLinks` / `otherLinks` sample 補入 `sourceKey` 範例行（templates 不被 `build:*` 掃描）
4. **Step 4：renderer** — 兩端 EJS 引入 fallback chain `labelOverride > registry.displayLabel > platform > kind`；無 `sourceKey` 時 fallback 至既有 `platform` 字串（backward compatible）
5. **Step 5：GA4** — anchor 加 `data-ga4-param-link_source_key`；`ga4-link-tracking-spec.md` 同步加一行；屬 production dimension 變動，需 preflight
6. **Step 6：Admin selector** — 撰寫文章時下拉選擇 `sourceKey`；屬 Admin write 系列；需 atomic write
7. **Step 7：validate rules** — 新增 warning：`source-key-not-found` / `source-inactive`；mirror 既有 4 條 `related-links-*` warning-only pattern

#### 邊界

- 不因本路線而啟動 build / deploy / Blogger repost / GA4 validation / fixture creation / npm install
- **reverse UTM remains landed but dormant**（per §3.3；本路線與 reverse UTM 屬兩條獨立軌；不互相觸發）
- **pm-26 deploy gate remains BLOCKED**（no positive GitHub cross-link fixture；per §3.3 + `docs/20260526-reverse-utm-positive-fixture-scan-report.md`）
- 既有 `kind` / `platform` / GA4 `link_type` 兩軸命名（per `docs/related-links-schema.md` §7.4）不變

#### 風險

- 🟢 step 1-3：極低（純 docs / settings / template additive；無 consumer 即無 dist 影響）
- 🟡 step 4-7：中（renderer 須 byte-identical-modulo-builtAt 驗證；GA4 prod dimension 須 preflight；Admin write 須 atomic）

#### 推薦

先 step 1（本批）→ step 2 → step 3；後續 step 4+ 須 user 明示啟動，並各自走 pre-analysis / preflight。

---

## 4. ❌ 暫不建議做

- **第一版接 FB Graph API**（per `CLAUDE.md` §29）— 屬 Z 類；需重評估 OAuth / token storage / API rate limit / 隱私
- **第一版接 Blogger API 自動發文**（per `CLAUDE.md` §29）
- **第一版接 Google Drive API 圖片上傳**（per `CLAUDE.md` §29）
- **第一版做完整視覺化 CMS WYSIWYG 編輯器**（per `CLAUDE.md` §29；屬 Z 類）
- **第一版引入後端資料庫 / 會員系統 / 留言系統**（per `CLAUDE.md` §29）
- **第一版加 React / Vue / Astro / Next.js / Nuxt / Tailwind**（per `CLAUDE.md` §4 技術限制）
- **第一版做全文搜尋**（per `CLAUDE.md` §29）
- **大規模 content migration / batch slug rename**（屬高風險；應拆獨立 phase 仔細評估）
- **直接 push 至 deploy repo gh-pages 之 force push**（永禁；deploy 屬獨立 pipeline）

---

## 5. ❌ 不可碰的操作

| 操作 | 為何不可 |
|---|---|
| `git push --force` 至 main 或 gh-pages | 永禁；歷史線性堆疊不可破壞 |
| `git rebase` / `git amend` | 永禁；對齊「線性堆疊；無 amend / rebase / force」原則 |
| 手動編輯 `dist/` / `dist-blogger/` 內檔案 | 屬 build artifact；應 source 重 build |
| 手動編輯 deploy repo 之 git 歷史 | 屬獨立 pipeline；本機 source 不碰 |
| 修改 `package.json` 之 dependencies 而未先 pre-analysis | 屬技術選型；per `CLAUDE.md` §4 第一版限制 |
| 修改 `vite.config.js` 之 build target / output 結構 | 屬 build pipeline；需 user 明示 + pre-analysis |
| 修改 CLAUDE.md 內之 §1-§29 規範 | 屬專案憲法；需 user 明示 + 完整評估 |
| 刪除既有 docs / commits | 永禁；屬歷史保存 |
| 自啟動任何 write phase 而未過對應 preflight checklist | 永禁；違反保守落地原則 |

---

## 6. 推薦執行順序（建議；非承諾）

依**最小破壞性 + 安全收益優先**：

```
Phase 2.1（quick wins；🟢 低）
  ↓
  - ~~DS-3-c-a hex 違規低風險修正~~（✅ 完成 commit `f530a39`；per §1.1）
  - ~~GA4 prod-only gating~~（✅ 完成；per §1.2）
  - ~~FB completeness P3 條件式~~（✅ Admin + validate-level rule + fixtures 全部完成；per §1.3）

Phase 2.2（user-decided；🟡 中；依需求展開）
  ↓
  - ~~若 user 啟用 GA4 → §2.1 落地~~（✅ 已於 2026-05-21 落地；per §2.1）
  - 若 user 推進 FB write → §2.2 之 P5-c-a 起手
  - 若 user 推進 Admin SEO write → §2.3 起手

Phase 2.3（visual / Blogger 同步；🟡 中；需 visual diff）
  ↓
  - DS-3-b platform theme tokens（per §2.4）
  - DS-3-b-blogger-entry（per §2.5）
  - ~~DS-3-c-b hover overlay + mirror 同步~~（✅ 完成 commits `67a0ccc` + `cc2621d`；per §2.6）
  - ~~DS-3-c-c hero gradient~~（✅ 豁免；per §2.7）

Phase 2.4（規模觸發；🔴 高；建議當前不啟動）
  ↓
  - sitemap 拆分（per §3.1；用戶量增 + post 數量 > 100 後再評估）
  - mirror partial 整合（per §3.2；user 主動評估 mirror 維護痛點後）

Phase 2.5（reverse UTM / external trigger；🟡 passive wait）
  ↓
  - reverse UTM pm-26 deploy gate（per §3.3；BLOCKED on positive fixture；等自然書評）
  - 自然 fixture 內容規劃（per §1.7；passive；docs-only 可預備）
  - Affiliate 首篇啟用（per §1.6；passive；等自然書評）
  - Custom domain 啟用（per §2.9；BLOCKED on user 取得 domain）
  - AdSense 申請（per §2.10；BLOCKED on §2.9）
  - hashtag click_hashtag event（per §3.6；Phase 2 候選 DOM 改動）
  - Phase 9-h-f Related Posts auto（per §3.7；BLOCKED on ≥ 5 ready post）

Phase Z（永禁 / 二階段）
  ↓
  - FB Graph API / Blogger API / Drive API / WYSIWYG / 後端 DB / 留言 / View 數 / 全文搜尋
```

---

## 7. 待決事項摘要（user 明示前不啟動）

- [x] GA4 measurementId 已啟用（✅ 2026-05-21；`G-C77SMPF8VD` production live；per §2.1）
- [ ] FB-P5-c 是否啟動（per §2.2 + `docs/fb-sidecar-write-preflight-decision.md` §7）
- [ ] FB-P5-c 是否採拆批策略（P5-c-a + P5-c-b vs 單批）
- [ ] Admin SEO write 是否啟動（per §2.3）
- [ ] DS-3-b platform theme 方案（A 保守 vs B 品牌化；per §2.4）
- [ ] DS-3-b-blogger-entry 是否啟動 + Blogger 後台重貼時機（per §2.5）
- [x] DS-3-c-c hero gradient 方案（✅ 採方案 C 豁免；per §2.7 / pm-6）
- [ ] sitemap 拆分是否做（per §3.1；當前不建議）
- [ ] mirror partial 整合啟動時機（per §3.2；user 主動評估）
- [x] GA4 prod-only gating（✅ 完成；per §1.2）
- [x] FB completeness P3 條件式（✅ Admin + validate-level rule + fixtures 全部完成；commits `edbf6d0` / `13e38ba` / `0d4d821`；per §1.3）
- [x] vite host 已採 0.0.0.0（per `package.json`；FB write API 設計層之 host 選擇可獨立決策）
- [ ] reverse UTM pm-26 deploy gate 啟動時機（per §3.3；BLOCKED on positive fixture；等自然書評）
- [ ] 自然 fixture 內容規劃時機（per §1.7；passive；user 自決）
- [ ] Affiliate 首篇啟用時機（per §1.6；passive；等自然書評）
- [ ] Custom domain 啟用時機（per §2.9；BLOCKED on user 取得 domain）
- [ ] AdSense 申請啟用時機（per §2.10；BLOCKED on §2.9）
- [ ] hashtag click_hashtag event 對接（per §3.6；Phase 2 中風險 DOM 改動）
- [ ] Phase 9-h-f Related Posts auto block 啟動時機（per §3.7；BLOCKED on ≥ 5 ready post）

---

## 8. 邊界聲明

- ✅ 本文件**僅為 roadmap 候選**；不啟動任一項目；不承諾時程
- ✅ 任何項目啟動必須 user 明示
- ✅ 對應之 pre-analysis / preflight / safety doc 須先過 user checklist
- ✅ 永禁項（§5）任何情況不可進行
- ✅ 第一版限制（CLAUDE.md §29）之項目屬 Z 類；要做必須完全重評估架構
- ℹ️ Incidental observations OB1 ~ OB10 deferred to later session（不在本檔範圍；屬其他 docs / templates / dep audit 等後續 phase 處理）

---

## 9. Cross-links

### 9.1 既有 cross-links

- `docs/README.md` — docs 入口
- `docs/phase-1-user-operation-guide.md` — 第一階段操作手冊
- `CLAUDE.md` §28（第一版 MVP 必做）/ §29（第一版不做清單）
- 各系列 pre-analysis / preflight / safety docs（per `docs/README.md` §3）

### 9.2 5/23 ~ 5/26 新增重要 docs

- `docs/phase-1-completion-report.md`（Phase 9-z-d 正式 final report）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 設計 SOP §0-§9 + §10 addendum）
- `docs/20260525-reverse-utm-pm26-preflight-readiness-checklist.md`（pm-26 pre-flight readiness checklist）
- `docs/20260526-reverse-utm-positive-fixture-scan-report.md`（5/26 positive fixture scan）
- `docs/20260525-deploy-diff-dry-run-readonly-report.md`（5/25 night-8 deploy diff dry-run）
- `docs/20260525-phase1-usability-review.md`（7 維度 + 13 流程盤點）
- `docs/20260525-phase1-user-guide-drift-check.md`（user guide drift audit）
- `docs/20260525-readme-drift-audit.md`（README drift audit D1-D27）
- `docs/20260525-affiliate-first-activation-readiness.md`（affiliate 啟用 readiness）
- `docs/20260524-blogger-github-publishing-runbook.md`（operator entry runbook）
- `docs/custom-domain-root-files-strategy.md`（custom domain 策略）
- `docs/hashtag-slug-decision.md`（hashtag slug 決議）
- `docs/20260526-related-links-source-label-admin-design.md`（link source registry / `sourceKey` / Admin 可管理之 docs-only / design-only 設計建議；對應 §3.8）

---

（本文件結束）
