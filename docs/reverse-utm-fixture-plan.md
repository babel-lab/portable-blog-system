# Reverse UTM Fixture Validation Plan

本文件為 **Blogger → GitHub Pages reverse UTM** 之 **fixture / production-grade 驗收文章建立 SOP**；屬 docs-only 規劃；初版於 phase `20260523-pm-29b-reverse-utm-fixture-plan-a` 落地。

本文件**不是**新 spec、**不是**啟動指令、**不是**實作 plan；屬「未來如需主動驗收 reverse UTM，應如何建立 fixture」之**前置設計文件**。本文件之落地**不**觸發任何 content / src / build / deploy 行為。

對應上層：
- `CLAUDE.md` §16.4（Blogger → GitHub reverse UTM 規則；source landed pm-24a/b/c；un-deployed；dormant）
- `docs/blogger-to-github-reverse-utm-plan.md`（reverse UTM 原 plan 與 step 1-7 對照；本 fixture plan 為其 step 7「user 手動重貼 Blogger + GA4 Realtime 驗收」之前置）
- `docs/click-tracking-governance.md` §4 row 3 / §10 順序 5（reverse UTM 規格）
- `docs/ga4-link-tracking-spec.md` §3.5（Blogger to GitHub UTM；source landed；dormant）
- `docs/ga4-parameter-naming-registry.md` §4.2（reverse UTM 命名規格）
- `docs/20260523-eod-report.md` §14.3-14.7（pm-22 ~ pm-25 工作流）

---

## §0 Status Snapshot（2026-05-23 pm-29b）

| 項目 | 狀態 |
|---|---|
| reverse UTM source landed | ✅ pm-24a `7e1d356` + pm-24b `e2309e9` + pm-24c `7c769fe` |
| docs synced | ✅ pm-22 ~ pm-25（CLAUDE.md §16.4 / click-tracking-governance / ga4-link-tracking-spec / ga4-parameter-naming-registry / blogger-to-github-reverse-utm-plan §0） |
| build:blogger pm-26a 結構驗證 | ✅ build 成功；3 ready posts；無 warning |
| reverse UTM 路徑被 ready content 觸發 | ❌ **無**（唯一 full-mode Blogger post `we-media-myself2` 之 relatedLinks 不含 GitHub Pages cross-link） |
| Blogger 後台重貼 | ❌ 尚未 |
| GA4 Realtime 驗收 | ❌ 尚未 |
| live 狀態 | 🟡 dormant |

---

## §1 背景

### 1.1 為何需要本 plan

`docs/blogger-to-github-reverse-utm-plan.md` §10 step 7 之「user 手動重貼 Blogger + GA4 Realtime 驗收」之啟動，需有「至少一篇 Blogger full-mode post 之 post.html 含 reverse UTM 注入結果」作為驗收 fixture。

pm-26a `build:blogger` 結構驗證已通過：build 成功 / 無 warning / 「無 GitHub cross-link 之 post 不誤注入」之 invariant 維持成立。

但 pm-26a 同時揭露：**目前 ready 之 full-mode Blogger post 僅 1 篇（`we-media-myself2`）**，且其 `relatedLinks` 僅含 Blogger 內部 cross-link，無 GitHub Pages cross-link → reverse UTM 路徑**無 fixture 可觸發** → pm-26b GA4 Realtime 驗收條件不成立。

pm-29a read-only audit 之結論已排除三個既有候選（詳見 §2）；本 plan 規劃**未來主動驗收**時，應如何**自然**建立 production-grade fixture，而**不**為驗收硬改正式文章。

### 1.2 reverse UTM 規格摘要（per CLAUDE.md §16.4 / ga4-link-tracking-spec §3.5）

| 項目 | 值 |
|---|---|
| 套用方向 | Blogger article → GitHub Pages article |
| 套用模式 | `bloggerMode: 'full'` 唯一（`renderFullPost` caller） |
| 套用範圍 | `relatedLinks` / `otherLinks` 之 GitHub Pages cross-link |
| 判斷依據 | URL hostname 等於 `settings.site.githubSiteUrl` 之 host |
| `utm_source` | `blogger` |
| `utm_medium` | `referral` |
| `utm_campaign` | `portable_blog_system` |
| `utm_content` | `related_links`（relatedLinks aside 內）/ `other_links`（otherLinks aside 內） |
| target | 強制 `_blank` |
| rel | 合併 `nofollow noopener noreferrer`；保留作者既有 token（如 `sponsored`） |
| 策略 A | 若原 URL 已含任一 `utm_*`，視為作者手動指定 → 不覆蓋；但仍套 target / rel |

---

## §2 為何不直接改現有文章（per pm-29a audit）

pm-29a 已對現有 3 篇 ready post + 1 篇 draft 完成 read-only audit；以下為**不採用**之理由摘要：

### 2.1 `we-media-myself2` — 加 GitHub Pages cross-link：**不採用**

- 主題為書評（《AI 玩轉自媒體的 52 個商業思維》書摘漫畫 + 提問筆記）
- GitHub Pages 站既有兩篇技術文章主題為「GitHub Pages 免費空間限制」與「Portable Blog System MVP 開發筆記」
- 書評 → 系統開發類技術文章之引用**主題不自然**；強塞 cross-link 對讀者觀感差，且破壞作者「書評文章末尾只導 Blogger 系列同主題前作」之既有策略 invariant
- 該文 `blogger.status: published`、`publishedAt: 2026-05-15` → 任何 relatedLinks 變動 = 手動重貼 Blogger 後台**覆蓋既有已發布文章**
- 風險等級：⚠️ 中高

### 2.2 `github-pages-blog-planning` — 轉 `mode: summary → full`：**不採用**

- 主題天然契合（文章本身講 GitHub Pages，relatedLinks 自然導向 `portable-blog-system-mvp`）
- 但改 mode 會將 publish strategy 從「Blogger 摘要 → GitHub 全文」變成「Blogger 全文 + GitHub 全文 duplicate」→ 破壞既有 SEO 規劃（canonical / JSON-LD / noindex/follow / summary CTA GA4 數據連續性）
- `primaryPlatform: github` + Blogger full 並存 → canonical 處理需重新驗證
- 風險等級：⚠️ 高（影響 SEO 策略）

### 2.3 `portable-blog-system-mvp` — 轉 `mode: summary → full`：**不採用**

- 該文 frontmatter 註解明指為 **Phase 20260520-seo-2 / seo-3 之 SEO fixture sample**：「`enabled: true` 以驗證 Blogger copy-helper [14] 之 noindex-follow path」、「`contentKind: download` (SEO-1 fallback 路徑)」、「`mode: summary`」
- 改 mode 會破壞 seo-2 / seo-3 既有驗證樣本之意義 → 該文章已被另一 Phase 鎖定為 fixture，不可重用
- 風險等級：🚫 **不可選**（與既有其他 Phase fixture invariant 衝突）

### 2.4 `sample-book-review` / `.fb.md` / `validation-fixtures/`：**全部不適用**

- `sample-book-review`：`status: draft, draft: true` → 永遠不會 export 到 `dist-blogger/`，無法觸發 reverse UTM 路徑
- `.fb.md`：FB promotion 內容，與 Blogger relatedLinks render 路徑無關
- `validation-fixtures/*`：validator 錯誤樣本，frontmatter 是錯誤型樣本，不是 production-grade 內容

### 2.5 共同原則

⛔ **不可為驗收硬改既有正式內容**：所有候選之變動皆會破壞至少一項既有 invariant（讀者觀感 / 已發布 / SEO 策略 / 既有 fixture）。

---

## §3 Fixture 設計原則

未來如需主動建立 reverse UTM 驗收 fixture，應遵循以下原則：

### 3.1 Production-grade

- ❌ 不做純粹為驗收而寫之「假測試文」（如「reverse UTM fixture post」標題、無實質內容）
- ✅ 必須為作者**真實會寫**之文章主題；驗收完成後若為合適內容應**保留為正式 production post**
- ✅ 內容字數、深度、書評 / 教學 / 心得結構應與既有正式文章對等

### 3.2 主題自然性

- Blogger 文章主題必須**自然需要**引用 GitHub Pages 技術文章作為延伸閱讀
- 自然引用之 use case 範例：
  - 書評提到「AI 自媒體工具 / 個人品牌經營」自然連到 GitHub 站技術 / 心得文章
  - 教具 / 親子素材文章提到「網站製作 / 線上素材發布」自然連到 GitHub 站技術文章
  - 系統建置心得文章（如「我如何用 portable-blog-system 管理 Blogger + GitHub 雙站」）自然連到 GitHub 站之該系統開發筆記

### 3.3 結構要求

- ✅ `publishTargets.blogger.enabled: true` + `publishTargets.blogger.mode: 'full'`
- ✅ `status: ready`、`draft: false`（驗收前可短暫保留 `draft` 直到 user 同意 ready）
- ✅ `relatedLinks` 或 `otherLinks` 至少 1 筆 hostname 為 `babel-lab.github.io` 之 cross-link
- ✅ `kind: internal` 或 `kind: external` 皆可（per CLAUDE.md §16.4：判斷依據為 hostname，不依賴 kind 欄位）
- ✅ 不在 link `url` 內預埋 `utm_*`（除非刻意測試策略 A 之 skip 行為）

### 3.4 不破壞既有 SEO / fixture invariant

- ❌ 不改既有 ready post 之 `publishTargets.blogger.mode`
- ❌ 不改既有 `primaryPlatform`
- ❌ 不重用既有 SEO fixture sample（如 `portable-blog-system-mvp` seo-2/seo-3）
- ❌ 不覆蓋既有已發布之 Blogger 文章（如 `we-media-myself2` 之 `publishedUrl`），**除非 user 明確同意**

### 3.5 放置位置決策

優先級：

1. **新增至 `content/blogger/posts/{date}-{slug}.md`**（推薦）
   - 屬正式 production post pipeline
   - 走完整 frontmatter / publish bundle / FB sidecar 流程
2. `content/drafts/`：作者尚未決定發布之初稿暫存；若驗收用 fixture 不會發布，**不應**走此路徑（drafts 預期未來會 promote 到 ready，不是永久存放區）
3. `content/validation-fixtures/`：⛔ **不可**；該目錄專供 validator 錯誤樣本，與 production render 路徑無關

---

## §4 建議 fixture 類型

依「最自然 → 較主動」排序：

### 4.1 主軌：等待**下一篇自然書評 / 心得文章**自然引用 GitHub 站

- 觸發條件：未來作者撰寫之新書評（AI / 自媒體 / 工具書 / 教育類），若主題自然涉及「網站製作 / 部落格策略 / AI 工具」，可在 `relatedLinks` 自然引用 GitHub 站既有技術文章（如 `github-pages-blog-planning`、`portable-blog-system-mvp`）
- 時程不可預測
- 屬最高 production-grade 真實性

### 4.2 副軌 A：新增專門「系統建置心得 / 數位筆記策略」類 Blogger full-mode 文章

- 提案題目範例（**不**現在落地，僅供未來作者選用）：
  - 「我如何用 Portable Blog System 管理 Blogger + GitHub 雙站內容」
  - 「Blogger + GitHub Pages 雙站策略：流量、SEO、收益的權衡」
  - 「為什麼我的 Blogger 文章開始加上 GitHub Pages 延伸閱讀連結」
- 文章內容**自然需要**引用 GitHub Pages 既有技術文章 → reverse UTM 注入發生於自然引用，非硬塞
- 同時兼具 production 價值（讀者實際會讀）+ 驗收 fixture 價值（觸發 reverse UTM 路徑）

### 4.3 副軌 B：未來新教具 / 親子素材 Blogger full-mode 文章

- 若教具下載文章自然提到「網站製作 / 教學素材發布平台」，可連 GitHub 技術文章
- 主題契合度視具體文章而定；不勉強

### 4.4 ⛔ 不採用之 fixture 類型

- ❌ 純測試標題（「reverse UTM fixture」、「test post for UTM」）
- ❌ 內容為 lorem ipsum 或測試字串
- ❌ 「為驗收而寫」之水準低於正式文章之短文
- ❌ 修改既有 ready / published 文章之 `mode` / `relatedLinks` 結構（per §2）

---

## §5 驗收條件

### 5.1 本機驗收（build:blogger）

執行 `npm run build:blogger` 後，新 fixture post 之 `dist-blogger/posts/{slug}/post.html` 應包含：

#### 5.1.1 `lab-related-links` / `lab-other-links` aside 內之 GitHub cross-link：

✅ **必要 invariant**

- href 包含 `utm_source=blogger`
- href 包含 `utm_medium=referral`
- href 包含 `utm_campaign=portable_blog_system`
- href 包含 `utm_content=related_links`（relatedLinks 內）或 `utm_content=other_links`（otherLinks 內）
- `target="_blank"`
- `rel` 包含 `nofollow`、`noopener`、`noreferrer`（順序不限；合併既有 token，per CLAUDE.md §16.4）

#### 5.1.2 非 GitHub cross-link / 同站連結 / 第三方非 GitHub external link：

✅ **不可** 含 `utm_source=blogger`（per CLAUDE.md §16.4 invariant）

#### 5.1.3 Canonical / summary CTA 不被誤改：

✅ 既有 summary mode post 之 canonical / summary CTA 維持 **legacy `buildBloggerToGithubUrl` UTM scheme**：
- `utm_medium=internal_referral`（**非** reverse UTM 之 `referral`）
- `utm_campaign=blogger_to_github`（**非** reverse UTM 之 `portable_blog_system`）
- `utm_content={slug}`（**非** reverse UTM 之 `related_links` / `other_links`）

驗收方法：grep `utm_medium=internal_referral` 於 `dist-blogger/posts/*/post.html`，計數應與 fixture 加入前一致。

#### 5.1.4 GitHub → Blogger forward UTM 不受影響：

✅ 執行 `npm run build:github` 後，`dist/posts/*/index.html` 內之 Blogger cross-link 維持：
- `utm_source=github_pages`
- `utm_medium=referral`
- `utm_campaign=portable_blog_system`
- `utm_content=related_links` / `other_links`

驗收方法：與 fixture 加入前之 `dist/` 比對 byte-identical-modulo-builtAt。

### 5.2 Production 驗收（pm-26b）

- Blogger 後台手動重貼 fixture post 之 `post.html`
- GA4 Realtime / Acquisition 觀察：
  - 是否出現 `source = blogger`、`medium = referral`、`campaign = portable_blog_system`、`content = related_links` / `other_links` 之 event
  - 是否與既有 forward UTM（`source = github_pages`）區分清楚，無誤混

---

## §6 pm-26b 啟動條件

僅當以下**全部**成立，方可啟動 pm-26b：

1. ✅ 已存在至少 1 篇符合 §3 / §4 之 fixture post（自然或副軌設計皆可）
2. ✅ fixture post 之 frontmatter 已通過 `npm run validate:content`，0 warning
3. ✅ `npm run build:blogger` 成功 + 5.1.1 ~ 5.1.4 全部驗證通過
4. ✅ user 已**明確同意**手動重貼 Blogger 後台（含覆蓋同 slug 既有 post 之決策，如適用）
5. ✅ 若 fixture post 為新建非已發布文章，已決定**驗收後是否保留為正式發布文章**（per §7）
6. ✅ GA4 Realtime / Acquisition 已準備就緒（測試 GA4 measurement ID 之 dataLayer 正常）

⛔ 任一條件未滿足，**不啟動** pm-26b；繼續維持 dormant。

---

## §7 驗收後處理

### 7.1 若 fixture post 為正式 production 文章

- 保留為正式發布文章
- frontmatter 維持 `status: ready` 或更新為 `status: published`
- `blogger.publishedUrl` 回填正式 URL
- `blogger.publishedAt` 紀錄發布日期
- 後續視為正常 production post 維護

### 7.2 若 fixture post **不適合**保留為公開內容

⛔ **不建議事後刪改 production 內容**（如：發布後再從 Blogger 後台刪、改 publishTargets.enabled: false、移到 archive）

✅ 改採「**驗收前**就避免發布」策略：
- 若評估發現主題不適合公開，**驗收階段就不執行 Blogger 後台重貼**
- 改採「本機 build:blogger + grep dist-blogger/ post.html」之**靜態驗收**取代「Blogger 後台重貼 + GA4 Realtime」之**動態驗收**
- 靜態驗收可確認 source / build 正確，但無法驗收 GA4 接收端；接受此 trade-off

### 7.3 驗收 report 紀錄

完成 pm-26b 後，建議產出一份 docs-only verification report，至少包含：

- fixture post 之 slug / 標題 / 發布日期 / 是否為新建
- `dist-blogger/posts/{slug}/post.html` 內 reverse UTM 之 grep snippet
- GA4 Realtime 截圖或手動觀察紀錄（event 出現時間、source / medium / campaign / content 值）
- GA4 Realtime 是否有觀察到既有 forward UTM 之 event 共存（確認雙向 UTM 不衝突）
- 與既有 summary CTA forward UTM 之 event 區分驗證
- 驗收後處理決策（保留 / 不發布）

---

## §8 下一步路線

🟢 **建議雙軌並行**：

### 8.1 主軌：維持 dormant + 等自然文章

- 不主動建立 fixture
- reverse UTM live 狀態維持 dormant，無時間壓力
- 等待 §4.1 之自然引用機會
- 時程不可預測，但屬最高 production-grade 真實性

### 8.2 副軌：依本 plan 為 reference

- 本 plan 落地後即為「reverse UTM fixture 建立 SOP」
- 未來若 user 評估需主動驗收（如 §4.2 / §4.3），可直接依本 plan §3 ~ §7 執行 pm-29c（fixture 建立實作）→ pm-26b（GA4 Realtime 驗收）→ verification report
- 本 plan 不強制副軌實作，僅作為 reference 待命

🔴 **不建議**：

- ❌ 現 session 或近期 session 為驗收建立 fixture（無時間壓力 + 無明確驗收 deadline）
- ❌ 為驗收硬改 §2 之既有候選
- ❌ 在 `content/validation-fixtures/` 內建立 reverse UTM fixture（該目錄專供 validator 錯誤樣本）

---

## §9 本 plan 之 invariant

本 plan 之**落地與更新**屬 docs-only，不觸發：

- ❌ content / publish.json 修改
- ❌ src / views / scripts 修改
- ❌ dist / dist-blogger 重 build
- ❌ deploy / gh-pages
- ❌ Blogger 後台重貼
- ❌ 新增實際 fixture 文章
- ❌ 修改既有正式文章

未來如本 plan 內容需更新（如規格改動、驗收條件補充、fixture 設計原則調整），仍應維持 docs-only 性質；觸發實際 fixture 建立或驗收行為時，須另開 pm-29c / pm-26b phase。
