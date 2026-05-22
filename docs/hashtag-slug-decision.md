# Hashtag Slug Decision

本文件為 **hashtag slug 派生策略**之 docs-only 決議文件；屬未來 **hashtag span→a 改造** + **GA4 `click_hashtag` event** 實作之前置規格。

**本批 phase `20260522-hashtag-slug-decision-doc-a` 不修改任何 source / template / content / settings / build / dist / deploy**；屬 docs-only proposal。

對應上層：
- `CLAUDE.md` §14（標籤管理規則）/ §16（連結處理）/ §17（文章頁版型）
- `docs/click-tracking-governance.md` §5.4 / §8.4（`click_hashtag` event 規格 + hashtag 特性）
- `docs/ga4-link-tracking-spec.md` §3.3（hashtag 追蹤項）
- `docs/ga4-parameter-naming-registry.md` §6.2 / §6.4（既有 `tag_click` event + `tag` param）
- `docs/20260522-pm-phase-2-batch-plan.md` §8（hashtag plan：tagSlug 來源決議 + span→a 改造）

---

## §1 背景

### 1.1 目前 hashtag 為 display-only `<span>`

per `CLAUDE.md` §17（Hashtag 區塊）+ 既有 EJS template：

GitHub Pages 與 Blogger 兩端之 hashtag 區塊現況皆為 **display-only `<span>`**：

```html
<ul class="lab-hashtags">
  <li><span class="lab-hashtag">#自媒體</span></li>
  <li><span class="lab-hashtag">#GitHub</span></li>
  <li><span class="lab-hashtag">#旅行的理由</span></li>
</ul>
```

- **無 `href`**：不可點擊；無 click target
- **無 `data-ga4-*` attr**：即使 GitHub 端 listener 已就位，亦無觸發點
- **無 tag page**：`/tags/{slug}/` 對應頁面已於 Phase 1 落地（per `CLAUDE.md` §28 第 7 項），但 hashtag 區塊未連回

### 1.2 未來 GA4 `click_hashtag` 之先決條件

per `docs/click-tracking-governance.md` §5.4：

```
event: click_hashtag
required params:
  - tag_slug          ← 穩定 slug；GA4 後台 dimension 主鍵
  - post_slug
optional params:
  - tag_label         ← 顯示文字
  - platform          ← blogger / github_pages
```

實作 `click_hashtag` 需 **3 個前置**：

| # | 前置 | 狀態 |
|---|---|---|
| 1 | hashtag 為 anchor（含 `href`）| 🔴 未做（仍為 `<span>`）|
| 2 | **穩定之 `tag_slug` 派生策略** | 🔴 未做（本 doc 決議目標）|
| 3 | hashtag anchor 上掛 `data-ga4-event` + `data-ga4-param-*` attr | 🔴 未做（需 #1 + #2 完成）|

本 doc **僅決議 #2**；#1 / #3 屬獨立 phase。

---

## §2 現況

### 2.1 GitHub Pages hashtag 渲染位置

`src/views/pages/post-detail.ejs` line 241-251（per 2026-05-22 HEAD `aa7b594`）：

```ejs
<%# Phase 9-h-d-b：Hashtag 區塊（mirror Blogger 端 post-full.ejs 之 hashtag pattern） -%>
<%# 4 條 AND guard：post.blocks 存在 / post.blocks.hashtags 為 truthy / post.tags 是 array / post.tags.length 大於 0 -%>
<%# hashtag 本批採 display-only span 設計（mirror Blogger）；不加 hashtag link / target / rel / GA4 event -%>
<% if (post.blocks && post.blocks.hashtags && Array.isArray(post.tags) && post.tags.length > 0) { %>
<div class="lab-container">
  <ul class="lab-hashtags">
    <% post.tags.forEach(function(tag) { %>
    <li><span class="lab-hashtag">#<%= tag %></span></li>
    <% }); %>
  </ul>
</div>
<% } -%>
```

關鍵特性：
- 4 條 AND guard：post.blocks / blocks.hashtags / tags 為 array / tags 非空
- 直接讀 `post.tags`（**未經 normalize / slug 派生**）
- `<%= tag %>` 直接渲染 frontmatter 之原始 tag 字串

### 2.2 Blogger hashtag 渲染位置

`src/views/blogger/blogger-post-full.ejs` line 175-182：

```ejs
<%# === Hashtag === %>
<% if (post.blocks && post.blocks.hashtags && Array.isArray(post.tags) && post.tags.length > 0) { %>
<ul class="lab-hashtags">
  <% post.tags.forEach(function(tag) { %>
  <li><span class="lab-hashtag">#<%= tag %></span></li>
  <% }); %>
</ul>
<% } %>
```

→ mirror GitHub 端之 4 條 AND guard + display-only span pattern；無 normalize / slug 派生。

### 2.3 目前無 hashtag URL / tag page / tag_slug metadata

| 維度 | 狀態 |
|---|---|
| `content/settings/tags.json` | 🔴 **不存在** |
| tag page `/tags/{slug}/index.html` | ⚠️ 已於 Phase 1 落地，但 slug 來源未明（推測為 build 階段 deduplicate `post.tags` 後直接使用原 tag 字串作 slug）|
| frontmatter `tags[]` 之值 | 字串 array（如 `['自媒體', 'github', '旅行的理由']`）|
| frontmatter `tagSlug[]` 欄位 | 🔴 不存在 |
| GA4 `tag_slug` param 對應 | 🔴 未實作 |
| Blogger / GitHub slug 一致性策略 | 🔴 未定義 |

### 2.4 既有 `tag_click` event（per `ga4.config.json`）

per `CLAUDE.md` §5 + `content/settings/ga4.config.json`：

```json
{
  "events": [
    "page_view",
    "internal_link_click",
    "tag_click",       ← 既有舊命名
    "category_click",
    "affiliate_click",
    ...
  ]
}
```

per `docs/ga4-parameter-naming-registry.md` §6.4：

```
| `tag` | hashtag 值（tag_click）|
```

per `docs/click-tracking-governance.md` §9.2 對照：

```
CLAUDE.md §5 既有: tag_click
本治理建議命名: click_hashtag
對應關係: 同義；建議統一採 click_hashtag（與 affiliate / related / other 對齊 click_* 前綴）
```

→ event name **reconcile decision 仍 deferred**；本 doc **不**強制採 `click_hashtag` 或 `tag_click`；屬獨立 governance 決議。

---

## §3 問題定義

### 3.1 中文 tag

範例：`自媒體`、`旅行的理由`、`AI 工具`

- **無天然 ASCII 對應**；直接作 URL slug 會 URL-encode 為 `%E8%87%AA%E5%AA%92%E9%AB%94` 等
- 多數實踐：**繁中 → 漢語拼音 / 主題英譯 / 通用 keyword**
  - `自媒體` → `self-media` / `we-media`
  - `旅行的理由` → `reasons-for-travel`
  - `AI 工具` → `ai-tools`

### 3.2 空白

範例：`Self Media`、`AI 工具`、`旅行 心得`

- URL slug 需轉為 `-`（kebab-case）
- `'Self Media'` → `self-media`
- 中英混合空白處理需明確：`AI 工具` → `ai-tools` vs `ai 工具`？

### 3.3 大小寫

範例：`GitHub`、`github`、`GITHUB`

- 同一語義不同寫法 → 應映射至**同一** slug
- 推薦：**slug 全 lowercase**；label 保留原大小寫
- `GitHub` / `github` / `GITHUB` 三者 → 共用 slug `github`，label 各自顯示原樣

### 3.4 特殊符號

範例：`C++`、`.NET`、`Node.js`、`React 18`、`Web3`

- `+` / `.` / 數字 / 中英混合等
- URL safe 規則：保留 alphanumeric + `-`；其他轉 `-` 或省略
- `C++` → `cpp` / `c-plus-plus` / `c++`（URL-encoded）？
- `.NET` → `dotnet` / `dot-net`？
- 需明確策略；屬 tags.json 之 author 決定

### 3.5 全形半形

範例：`３D` vs `3D`、`Ｗｅｂ` vs `Web`

- 全形 ASCII 範圍應 normalize 為半形
- 多數 slugify library 不處理；需手動處理或於 tags.json 明列
- 推薦：**lookup table 先 normalize**

### 3.6 重複 tag（語義相同寫法不同）

範例：`AI` / `ai` / `Ai` / `人工智慧` / `人工智能` 

- 5 種寫法但語義相同 → 應映射至**同一** slug
- 5 種 label 都允許顯示（label 為展示層；slug 為 dimension 主鍵）
- 推薦：tags.json 之 lookup 設計成「key 為原 tag 字串 / value 為 slug + label」；多個 key 可指向同一 slug

### 3.7 Blogger / GitHub 是否共用 slug

選項：

| # | 策略 | 優 | 缺 |
|---|---|---|---|
| 1 | **共用同一 slug** | GA4 dimension 一致；統一 attribution 維度 | 兩平台 tag page URL 必須一致；Blogger 端 tag page 在外部（標籤分類頁）格式不同 |
| 2 | **獨立 slug** | 兩平台靈活 | GA4 維度切碎；分析複雜 |

**推薦**：**選項 1（共用 slug）**；理由：
- GA4 後台 `tag_slug` dimension 跨平台聚合
- 即使 Blogger / GitHub 之 tag page URL 結構不同，slug 本身為純識別字串
- 對齊 `docs/click-tracking-governance.md` §3.3 之「跨平台 attribution 維度」原則

### 3.8 GA4 `tag_slug` 是否與 URL slug 一致

選項：

| # | 策略 | 優 | 缺 |
|---|---|---|---|
| 1 | **完全一致**（GA4 `tag_slug` == URL `/tags/{slug}/` 之 slug）| 單一真實來源；無 drift | tags.json 改動會同時影響 URL + GA4 |
| 2 | **分離**（URL slug 為 A；GA4 `tag_slug` 為 B；獨立映射）| 可獨立調整 | drift 風險高 |

**推薦**：**選項 1（完全一致）**；理由：
- 一致性 + 無 drift
- 對齊 single source of truth 原則（per `docs/ga4-parameter-naming-registry.md` §1）
- tags.json 同時驅動 URL slug + GA4 `tag_slug`

---

## §4 候選方案

### 方案 A — Runtime slugify

**作法**：build 階段對每個 tag 跑 `slugify(tag)` 函式產生 slug；無集中設定。

**示意**：

```js
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[\s　]+/g, '-')       // 空白 → -
    .replace(/[^a-z0-9一-鿿-]+/g, '') // 留 alphanumeric + CJK + -
    .replace(/-+/g, '-')                  // 連續 - 合一
    .replace(/^-|-$/g, '');               // 頭尾 - 移除
}
```

**對前述 §3 問題之表現**：

| 問題 | runtime slugify 表現 |
|---|---|
| 中文 tag | ⚠️ 直接保留中文（如 `自媒體` → `自媒體`）；URL-encoded 後可用但難讀 |
| 空白 | ✅ 轉 `-` |
| 大小寫 | ✅ 統一 lowercase |
| 特殊符號 | ⚠️ 直接移除（如 `C++` → `c`）；可能語義丟失 |
| 全形半形 | ❌ 需額外 normalize 邏輯 |
| 語義重複 | ❌ 無法處理（`AI` / `人工智慧` → 不同 slug）|

**優點**：
- 零設定；新 tag 即用
- 無維護成本
- 對純 ASCII tag 效果好

**缺點**：
- 中文 / 特殊符號 / 全形之處理不可控
- 同義不同寫之 tag 無法統一
- slug 結果不直觀；難以人工預測

**適用場景**：
- 標籤全為純英數字
- 不在意 SEO-friendly slug
- 不在意中文語義 keyword

### 方案 B — `content/settings/tags.json` Lookup

**作法**：建立 `content/settings/tags.json`；明列每個 tag 之 slug / label / 其他 metadata。build 階段 lookup。

**示意**：

```json
{
  "自媒體": {
    "slug": "we-media",
    "label": "自媒體",
    "category": "marketing"
  },
  "self-media": {
    "slug": "we-media",
    "label": "Self Media",
    "category": "marketing"
  },
  "GitHub": {
    "slug": "github",
    "label": "GitHub",
    "category": "tech"
  },
  "github": {
    "slug": "github",
    "label": "GitHub",
    "category": "tech"
  },
  "旅行的理由": {
    "slug": "reasons-for-travel",
    "label": "旅行的理由",
    "category": "book"
  }
}
```

**對前述 §3 問題之表現**：

| 問題 | tags.json lookup 表現 |
|---|---|
| 中文 tag | ✅ 明列 slug；可選英譯 / 拼音 |
| 空白 | ✅ 明列 |
| 大小寫 | ✅ 多 key 指向同一 slug |
| 特殊符號 | ✅ author 自定 slug |
| 全形半形 | ✅ 明列；無歧義 |
| 語義重複 | ✅ 多 key（含同義 tag）指向同一 slug |

**優點**：
- 完全可控；無歧義
- 多寫法 tag 可統一 slug
- 中文 → SEO-friendly slug
- single source of truth：tags.json 同驅動 URL + GA4
- 與 `categories.json` / `social-links.json` 等既有 settings JSON 同 pattern（per `CLAUDE.md` §3.2）

**缺點**：
- 維護成本：新 tag 須先補 tags.json
- 缺項時 fallback 策略需明確
- 大量歷史 tag 之 backfill 屬一次性工作

**對齊既有架構**：
- per `CLAUDE.md` §14（標籤管理規則）："標籤需集中管理於 `content/settings/tags.json`"
- per `CLAUDE.md` §28（MVP 必做清單）：標籤集中管理屬第一版必做
- 既有 settings JSON 範本：`categories.json` / `social-links.json` / `affiliate-networks.json`

**適用場景**：
- 內容站含中文 / 多語 / 特殊符號 tag
- 在意 SEO-friendly slug
- 願意承擔 tags.json 維護成本（增 / 改 / 撤）

### 方案 D — 暫時只追 `tag_label`，不做 `tag_slug`

**作法**：GA4 `click_hashtag` event 僅含 `tag_label`（原始 tag 字串）；無 `tag_slug` param；不做 hashtag span→a 改造。

**示意**：

```
event: click_hashtag
params:
  - tag_label: "自媒體"
  - post_slug: "we-media-myself2"
```

（無 `tag_slug`）

**對前述 §3 問題之表現**：

| 問題 | tag_label only 表現 |
|---|---|
| 中文 tag | ⚠️ GA4 dimension 為原始字串；查詢可用但難 aggregate |
| 空白 | ⚠️ 「Self Media」與「self media」會被視為 2 個 label |
| 大小寫 | ⚠️ 「GitHub」與「github」會被視為 2 個 label |
| 特殊符號 | ⚠️ 「C++」與「Cpp」會被視為 2 個 label |
| 全形半形 | ⚠️ 「３D」與「3D」會被視為 2 個 label |
| 語義重複 | ❌ 不處理 |

**優點**：
- **零實作成本**
- 不需 tags.json / 不需 span→a / 不需 build slug 派生
- 可延後決議

**缺點**：
- GA4 dimension aggregate 困難（同義 tag 散在多 row）
- 不解決 hashtag span→a 之根本需求
- 未來改做時仍需重新建 schema

**適用場景**：
- hashtag tracking 不在優先順序
- 等其他更高優先 phase 完成後再評估
- 屬 stop-gap measure

### （方案 C）— Per-post frontmatter 手填 tagSlug（**不推薦**；per §5 顯式拒絕）

**作法**：每篇文章 frontmatter 加 `tagSlug: []` 欄位；array index 與 `tags: []` 對齊。

**示意**：

```yaml
tags:
  - 自媒體
  - GitHub
tagSlug:
  - we-media
  - github
```

**為何不推薦**：
- **維護成本過高**：每篇新文章須手填 N 個 tagSlug；易遺漏 / 易 typo
- **無 single source of truth**：同名 tag 在不同文章可能填不同 slug → drift
- **author 體驗差**：寫文章須思考 slug 命名
- **語義重複 tag 無法統一**：跨文章之 slug 一致性靠 author 自律

→ 本方案保留**僅為設計空間完整性**；不採用。

---

## §5 推薦方案

### 5.1 長期推薦：方案 B（`tags.json` lookup）

**理由**：

1. ✅ **對齊既有架構**：`CLAUDE.md` §14 明文要求「標籤需集中管理於 `content/settings/tags.json`」；屬 MVP 必做之延後項
2. ✅ **解決所有 §3 問題**：中文 / 空白 / 大小寫 / 特殊符號 / 全形半形 / 語義重複皆可處理
3. ✅ **single source of truth**：tags.json 同驅動 URL slug + GA4 `tag_slug` + 其他未來 metadata（如 category / description / OG image）
4. ✅ **Blogger / GitHub 共用**：兩平台讀同一 tags.json；slug 一致
5. ✅ **與既有 settings JSON 同 pattern**：author 已熟悉 `categories.json` / `social-links.json` 之管理方式

### 5.2 Fallback：方案 A（runtime slugify）

**理由**：

- 過渡期 / 初期 tags.json 不完整時，**對 tags.json 缺項之 tag 採 runtime slugify**
- 確保 build 不因 tags.json 漏項而失敗
- 屬 **defensive fallback**；非主路徑

**fallback 行為建議**：

```text
build 階段對每個 post.tags[i]:
  1. 查 tags.json[tag]
     → 命中 → 用 lookup 之 slug
  2. 未命中 → slugify(tag)
     → 同時 emit warning：tag-slug-missing-in-tags-json: tag="<原文>"
  3. warning 提示 author 補 tags.json
```

⚠️ **fallback slugify 之問題**：
- 對中文 / 特殊符號等 §3 問題仍不完美
- 但**至少 build 不爆**；warning 提示 author 補 tags.json
- 屬 best-effort fallback

### 5.3 明確拒絕：per-post 手填 tagSlug

per §4 方案 C：維護成本過高；author 體驗差；同名 tag 跨文章 drift；**永不推薦**。

### 5.4 暫時不採用：方案 D（tag_label only）

per §4 方案 D：作為 stop-gap measure 在資源不足時可用；但未來必補做 `tag_slug`；**不採作長期方案**。

---

## §6 建議資料結構

### 6.1 `content/settings/tags.json` schema

**核心結構**：lookup table；key 為原 tag 字串 / value 為 metadata object。

```json
{
  "自媒體": {
    "slug": "we-media",
    "label": "自媒體",
    "category": "marketing",
    "description": "自媒體經營 / 個人品牌 / 內容創業之題材"
  },
  "self-media": {
    "slug": "we-media",
    "label": "Self Media",
    "category": "marketing",
    "description": "alias for 自媒體"
  },
  "GitHub": {
    "slug": "github",
    "label": "GitHub",
    "category": "tech",
    "description": "GitHub 平台 / Git workflow / Pages"
  },
  "github": {
    "slug": "github",
    "label": "GitHub",
    "category": "tech"
  },
  "旅行的理由": {
    "slug": "reasons-for-travel",
    "label": "旅行的理由",
    "category": "book"
  }
}
```

### 6.2 欄位字典

| 欄位 | required? | 型別 | 用途 |
|---|---|---|---|
| `slug` | ✅ | string | URL slug + GA4 `tag_slug` dimension 主鍵；snake-case 或 kebab-case |
| `label` | ✅ | string | UI 顯示文字（hashtag chip / tag page heading）|
| `category` | 🟡 | string | 大分類（如 `marketing` / `tech` / `book`）；對應 `categories.json` |
| `description` | 🟡 | string | tag page meta description / OG description |
| `seoTitle` | 🟡 | string | tag page `<title>` override |
| `coverImage` | 🟡 | string | tag page hero / OG image URL |

**未來可擴**：
- `aliases[]`：明列 alias key（雖然 lookup 已支援多 key → 同 slug；alias 可作顯示用）
- `featured: boolean`：是否在 home page 之 tag cloud 顯示
- `archived: boolean`：是否從 active tag list 隱藏
- `parent: string`：階層化 tag（如 `github` 之 parent 為 `tech`）

### 6.3 命名慣例

| 維度 | 慣例 |
|---|---|
| `slug` 值 | **kebab-case** 全 lowercase（如 `we-media` / `reasons-for-travel`）|
| `slug` 字符集 | `[a-z0-9-]`（ASCII alphanumeric + `-`）|
| `slug` 長度 | 1-50 字符；建議 2-30 |
| `category` 值 | 對齊 `categories.json` 之 id |
| key（原 tag 字串） | 保留 author frontmatter 原樣（含 case / 全半形 / 符號）|

### 6.4 與既有 settings JSON 之關係

| 既有檔 | 關係 |
|---|---|
| `content/settings/categories.json` | tags.json 之 `category` 欄位 reference 此檔 id |
| `content/settings/site.config.json` | tag page URL pattern（如 `/tags/{slug}/`）於此設定 |
| `content/settings/seo.config.json` | tag page 之 SEO default 於此設定 |

→ tags.json 為 **新增 settings 檔**；不取代任何既有檔。

---

## §7 未來實作順序

**本 doc 不啟動實作**；以下為**未來實作 phase 之建議順序**：

| # | Phase 候選 | 範圍 | 阻擋 |
|---|---|---|---|
| 1 | **建立 `content/settings/tags.json`**（schema + 既有 tag backfill）| 新增 settings 檔；含當前所有 post.tags 之 entry | 本 doc decision approved |
| 2 | **build 階段讀取 tag slug mapping**（含 fallback slugify）| `src/scripts/build-github.js` + 可能 `src/scripts/load-settings.js` | #1 完成 |
| 3 | **GitHub hashtag span → a 改造**（含 `href` 指向 `/tags/{slug}/`）| `src/views/pages/post-detail.ejs`（line 249-251）+ 可能 `src/styles/components/_hashtag.scss`（anchor reset）| #2 完成 |
| 4 | **Blogger hashtag 是否也改 a**（另案決議）| `src/views/blogger/blogger-post-full.ejs`（line 176-181）| 屬獨立 governance；參考 `docs/20260522-pm-phase-2-batch-plan.md` §9 之 Blogger listener strategy decision |
| 5 | **GitHub hashtag GA4 `click_hashtag` attr** | `src/views/pages/post-detail.ejs`（hashtag forEach 內）；helper include 已就位 | #3 完成 |
| 6 | **驗收**（GA4 DebugView / Realtime 觀察 `click_hashtag` event）| docs；user 操作 | #5 deploy |

### 7.1 拆批原則

per memory 之「保守落地」+ `docs/20260522-pm-phase-2-batch-plan.md` §4.1：

- ✅ **每批獨立 commit**
- ✅ **每批 LOC 小**（< 50 行為佳）
- ✅ **GitHub 端先 / Blogger 端後**
- ✅ **schema → build → render → tracking 順序**；不混批

### 7.2 與 `docs/click-tracking-governance.md` §10 之對齊

per governance §10 之 6 順序 Phase 2 rollout：

| 順序 | governance §10 | 本 doc §7 |
|---|---|---|
| 1 | listener 框架就位 | ✅ 已完成（既有；不重做）|
| 2 | `click_affiliate_cta` 對接 | ✅ 已完成（commits `6785bb6` / `221a87c`）|
| 3 | `click_related_link` / `click_other_link` 對接 | ✅ 已完成（commit `aa7b594`）|
| 4 | **`click_hashtag` 對接** | 🔴 **本 doc 之 hashtag rollout**；對應本 doc §7 之 #1-#5 |
| 5 | Blogger → GitHub 反向 UTM | deferred |
| 6 | GA4 DebugView / Realtime SOP | 對應本 doc §7 之 #6 |

→ 本 doc 屬 governance §10 順序 4 之前置 spec。

---

## §8 風險與 Rollback

### 8.1 DOM 結構變動風險

- **變更**：`<span class="lab-hashtag">` → `<a class="lab-hashtag" href="...">`
- **影響**：anchor 之預設樣式（藍色 + 底線）會破 chip 設計
- **緩解**：
  - `_hashtag.scss` 需加 anchor reset：`color: inherit; text-decoration: none;`
  - hover state 需另設計
  - **risk**：🟡 中（SCSS 改動 + 視覺 regression 需檢視）
- **rollback**：revert template + SCSS 改動 1 commit；可回原 span 設計

### 8.2 hashtag URL 變更風險

- **影響**：若既有外部連結（如 FB 貼文 / 其他站連入）指向 `/tags/{old-slug}/`，slug 改變後 404
- **目前狀態**：⚠️ 不確定既有 tag page URL 之 slug 派生規則；需先 audit `build-github.js` 之 tag page 產生邏輯
- **緩解**：
  - tags.json #1 完成時，**對齊**既有 tag page 之既有 slug；不變動
  - 若需變更 slug，須評估外部 backlink 數量
  - **risk**：🟡 中（依既有 backlink 而定）
- **rollback**：revert tags.json + 對應 build 改動；URL 回復

### 8.3 CSS anchor reset 需求

- **變更**：`_hashtag.scss` 需新增 anchor 狀態
- **影響**：兩平台 SCSS 同步更新
- **緩解**：
  - Phase 2-2-g（hashtag SCSS）既有結構可直接擴
  - GitHub `src/styles/components/_hashtag.scss`
  - Blogger 端：per `docs/blogger-export.md` 之 token 匯出 pipeline，Blogger 站之 CSS 由 source 重 build
- **risk**：🟢 低（SCSS additive）
- **rollback**：SCSS 改動單獨 revert 即可

### 8.4 GA4 event 命名一致性

per `docs/click-tracking-governance.md` §9.2：

```
CLAUDE.md §5 既有: tag_click
governance 建議命名: click_hashtag
governance decision: deferred
```

- **問題**：實作 hashtag click 時，是否：
  - (a) 採 `click_hashtag`（governance 建議）→ 需更新 `ga4.config.json` + CLAUDE.md §5
  - (b) 維持 `tag_click`（既有清單）→ 不變 settings
- **緩解**：
  - 本 doc **不**強制；建議 hashtag rollout 之前以獨立 phase 解決命名 reconcile
  - 或於本 doc §7 之 #5 階段 user 表態
- **risk**：🟢 低（純命名；不影響功能）
- **rollback**：event name 改動單獨 revert；GA4 後台 dimension 名同步

### 8.5 tags.json 缺項之 fallback 風險

- **變更**：build 階段對 tags.json 缺項 tag 採 runtime slugify fallback
- **影響**：fallback slug 與未來補 tags.json 之 slug 可能不一致 → drift
- **緩解**：
  - emit warning：`tag-slug-missing-in-tags-json`（per §5.2）
  - 提示 author 即時補 tags.json
  - tag page / GA4 dimension 之 backfill 策略：補 tags.json 時須 audit 是否影響既有 backlink
- **risk**：🟡 中（drift 機率隨 tag 量增大）
- **rollback**：補 tags.json 後重 build

### 8.6 整體 rollback 方式

| 階段 | rollback |
|---|---|
| tags.json 建立 | 刪 `content/settings/tags.json` + revert build script 改動 |
| build 階段 lookup | revert build-github.js / load-settings.js 對應改動 |
| GitHub hashtag span→a | revert post-detail.ejs + `_hashtag.scss` 之改動 |
| GA4 attr | revert attr include；listener 之 no-op fallback 確保不影響 |
| Blogger hashtag span→a | 屬獨立 phase；獨立 revert |

每步皆 **獨立 commit**（per `docs/20260522-pm-phase-2-batch-plan.md` §4.1 拆批原則）；single-commit revert 即可。

---

## §9 本批不做事項

per spec 之「禁止事項」+ docs-only 性質：

| 項目 | 不做 |
|---|---|
| 改 hashtag DOM（span → a）| ✅ 不做（屬未來 phase）|
| 建立 `content/settings/tags.json` | ✅ 不做（屬未來 phase）|
| 新增 tag pages | ✅ 不做（既有 tag pages 不動）|
| 加 GA4 `click_hashtag` attr | ✅ 不做（屬未來 phase）|
| 改 Blogger template | ✅ 不做（屬獨立 phase）|
| 改 `build-github.js` | ✅ 不做 |
| 改 `src/scripts/load-settings.js` | ✅ 不做 |
| 改 `_hashtag.scss` | ✅ 不做 |
| `ga4.config.json` event 命名 reconcile | ✅ 不做（屬獨立 governance）|
| deploy | ✅ 不做 |
| 動 gh-pages | ✅ 不做 |
| build / validate | ✅ 不做 |

---

## §10 Acceptance Criteria（本文件完成條件）

| # | 條件 | 滿足 |
|---|---|---|
| 1 | 明確列出 hashtag 現況（span vs a）| ✅ §1 + §2 |
| 2 | 明確列出 hashtag slug 派生之問題定義（中文 / 空白 / 大小寫 / 特殊符號 / 全形半形 / 重複）| ✅ §3 |
| 3 | 明確列出候選方案（A/B/D + 對 C 之拒絕）| ✅ §4 |
| 4 | 明確推薦方案（B 長期 / A fallback / D 暫存 / C 拒絕）| ✅ §5 |
| 5 | 明確列出 tags.json schema | ✅ §6 |
| 6 | 明確列出未來實作順序 | ✅ §7 |
| 7 | 明確列出風險與 rollback | ✅ §8 |
| 8 | 明確列出本批不做事項 | ✅ §9 |

---

## §11 Cross-links

- `CLAUDE.md` §14（標籤管理規則）/ §16（連結處理）/ §17（文章頁版型）
- `docs/click-tracking-governance.md` §5.4（`click_hashtag` event）/ §8.4（hashtag 特性）/ §9.2（`tag_click` vs `click_hashtag` 命名 reconcile）/ §10（Phase 2 rollout 順序）
- `docs/ga4-link-tracking-spec.md` §3.3（hashtag 追蹤項）
- `docs/ga4-parameter-naming-registry.md` §6.2（既有 9 個 event 含 `tag_click`）/ §6.4（既有 `tag` param）
- `docs/20260522-pm-phase-2-batch-plan.md` §8（hashtag plan：tagSlug 來源決議 + span→a 改造之拆批建議）
- `content/settings/categories.json`（既有 settings JSON 範本之一）
- `content/settings/social-links.json`（既有 settings JSON 範本之二）
- `content/settings/affiliate-networks.json`（既有 settings JSON 範本之三）
- `src/views/pages/post-detail.ejs`（line 241-251；GitHub hashtag 渲染位置）
- `src/views/blogger/blogger-post-full.ejs`（line 175-182；Blogger hashtag 渲染位置）
- `src/styles/components/_hashtag.scss`（既有 hashtag chip SCSS；anchor reset 之預計改動目標）

---

（本文件結束）
