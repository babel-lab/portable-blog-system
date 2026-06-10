# Phase 20260610-night-4 — AdSense Six-Slot Article Convention Preanalysis

Status: **preanalysis / docs-only / convention 鎖定；實作未開始**。

本文件鎖定「每篇文章約 6 個 AdSense 區塊」之內容模型 convention，作為未來實作之 source of truth。
**本 phase 不動 source / templates / settings / content / build / deploy / gh-pages / Blogger。**

對應前序：
- `docs/seo-ga4-adsense.md` §6（5-e 既有 enabled=false 安全路徑）
- `docs/seo-ga4-adsense.md` §6.10（20260610-night-3 commit `7c1ba79` 之 intent 紀錄）

---

## 1. Phase 性質與紅線

### 1.1 性質

- **docs-only / convention 鎖定**
- 不引入新 settings 鍵
- 不引入新 frontmatter 鍵之 validator 規則
- 不改 partial
- 不改 page templates
- 不改 build script
- 不改任何 .md / .json

### 1.2 紅線（沿用 §6 既有規範）

- 不引 Google AdSense API / 自動上稿
- 不在 settings / docs 存 publisher 真實密鑰 / OAuth client / dashboard 統計
- 不在 docs 寫真實 `ca-pub-XXXXXXXX` 或真實 slot id；範例一律 placeholder
- 不破壞 enabled=false 安全模式（§6.4 三重 gate）
- 未來啟用前仍須完成 §6.7 / §6.8 / §9 部署前檢查
- 不假設 AdSense model 僅 `postTop` / `postBottom`

### 1.3 不在本 phase 範圍

- 不實作 AdSense
- 不 deploy
- 不 touch gh-pages
- 不 edit Blogger
- 不新增 CTA / FAQ / hashtag / otherLinks per-article feature
- 不放真實 publisher / slot id

---

## 2. Repo Evidence 摘要

### 2.1 既有 partial（`src/views/ads/`）

| Partial | 角色 |
|---|---|
| `adsense-slot.ejs` | 基底；接 `{ slotKey, ads }` → 3-gate（enabled + adsenseClient + slots[slotKey] 非空）→ 輸出 `<ins class="adsbygoogle lab-ad-slot lab-ad-slot--<slotKey>">` + push script |
| `adsense-head.ejs` | head loader；2-gate（enabled + adsenseClient）→ 輸出 `<script async src=...adsbygoogle.js?client=...>` |
| `adsense-post-top.ejs` | forward slotKey=`postTop` |
| `adsense-post-middle.ejs` | forward slotKey=`postMiddle`（partial 已備，**未 wire**） |
| `adsense-post-bottom.ejs` | forward slotKey=`postBottom` |
| `adsense-sidebar.ejs` | forward slotKey=`sidebar`（partial 已備，**未 wire**） |
| `adsense-home-inline.ejs` | forward slotKey=`homeInline` |

### 2.2 既有 settings（`content/settings/ads.config.json`）

```json
{
  "enabled": false,
  "adsenseClient": "",
  "slots": {
    "postTop": "",
    "postMiddle": "",
    "postBottom": "",
    "sidebar": "",
    "homeInline": ""
  }
}
```

5 個 slot key；目前 enabled=false，全 placeholder。

### 2.3 既有 wire 點

| 接入點 | 檔案 | 狀態 |
|---|---|---|
| GitHub head loader | `build-github.js` HEAD_PARTIALS 注入 `</head>` 之前 | ✅ wired（enabled=false 時不輸出） |
| GitHub post-detail postTop | `src/views/pages/post-detail.ejs` L63-67 雙重 gate（`ads.enabled` + `post.blocks.adsenseTop`） | ✅ wired |
| GitHub post-detail postBottom | `src/views/pages/post-detail.ejs` L294-298 雙重 gate（`ads.enabled` + `post.blocks.adsenseBottom`） | ✅ wired |
| GitHub home homeInline | `src/views/pages/home.ejs` | ✅ wired（單一 gate） |
| GitHub post-list / category / tag / 404 / design-system | — | ❌ 不接 |
| Blogger 任何模板 | `src/views/blogger/*.ejs` | ❌ 完全不接（§6.6 既有決策） |
| postMiddle / sidebar | — | ❌ partial 已備未 wire |

### 2.4 既有 frontmatter flag

`content/blogger/posts/20260515-we-media-myself2.md` 之 `blocks`：

```yaml
blocks:
  toc: false
  adsenseTop: true
  adsenseMiddle: false
  adsenseBottom: true
  hashtags: true
  socialFollow: true
  relatedPosts: false
  sidebar: true
```

僅 3 個 AdSense flag：`adsenseTop` / `adsenseMiddle` / `adsenseBottom`。**沒有 placement anchor 概念**；位置硬綁在 post-detail.ejs 之 L63 / L294 兩個 anchor + 未 wire 之 postMiddle。

### 2.5 GitHub Pages post-detail 既有區塊順序（13 個 anchor 候選點）

per `src/views/pages/post-detail.ejs`：

1. article header（category / title / titleEn / date / author）
2. cover image（GitHub-only）
3. book photo（book-review + showBookPhoto + coverImage）
4. **adsenseTop**（既有 wire；L63）
5. affiliate top（5-AND guard）
6. article body（`bodyHtml`，markdown render 結果）
7. download box（download.enabled + fileUrl）
8. download landing page（download.enabled + landingPage=true；GitHub-only）
9. affiliate bottom
10. related links
11. other links
12. hashtags
13. **adsenseBottom**（既有 wire；L294）

### 2.6 Blogger post-full 既有區塊順序

per `src/views/blogger/blogger-post-full.ejs`：

1. article header
2. book photo（book-review）
3. affiliate top blocks（dual-block；blocks[] 非空時）/ legacy affiliate top
4. article body（`post.bodyHtml`）
5. download box
6. affiliate bottom legacy / dual-block affiliate bottom blocks
7. related links
8. other links
9. hashtags

⚠️ **Blogger 完全沒有 AdSense partial include**。新 model 需新 wire。

### 2.7 既有 dual-block 範例（affiliate.blocks[]）

`we-media-myself2.md` 已落地 affiliate.blocks[]（per Phase 20260610-pm-12 / pm-13）：

```yaml
affiliate:
  blocks:
    - id: "blogger-top-books"
      enabled: true
      surfaces: ["blogger"]
      position: "top"
      heading: "想入手這本書？"
      disclosure: "..."
      links: [...]
    - id: "blogger-bottom-network-slot"
      enabled: true
      surfaces: ["blogger"]
      position: "bottom"
      heading: "..."
      disclosure: "..."
      links: [...]
```

**此 pattern 為 AdSense 新 model 之直接 precedent**：array + per-block id + enabled + surfaces + position + per-instance content。AdSense 新 model 應 mirror 此 schema 形狀（避免認知負擔）。

---

## 3. Options 比較

### 3.1 Option A：Fixed Named Slots（articleAd1 ~ articleAd6）

frontmatter：

```yaml
blocks:
  articleAd1: true
  articleAd2: false
  articleAd3: true
  articleAd4: false
  articleAd5: true
  articleAd6: true
```

settings：

```json
"slots": {
  "articleAd1": "",
  "articleAd2": "",
  "articleAd3": "",
  "articleAd4": "",
  "articleAd5": "",
  "articleAd6": ""
}
```

EJS 在固定 6 個 anchor 各 include 一次（mirror 現有 postTop / postBottom pattern）。

評估：

| 面向 | 評分 |
|---|---|
| 一人維護 | ✅ 簡單（純 boolean flag） |
| per-article 調整 | ⚠️ 只能開關，**不能改位置** |
| Blogger + GitHub 一致 | ✅ 對齊容易 |
| validation 複雜度 | ✅ 低（型別檢查即可） |
| renderer 複雜度 | ✅ 低（與既有 postTop / postBottom 同模式） |
| 破壞 GitHub 既有風險 | ✅ 低（純 additive） |
| enabled=false 安全 | ✅ 沿用 §6.4 |
| article variation | ❌ **anchor 位置固定，書評 / 教具下載 / 漫畫文無法各自調整 placement** |

**結論**：簡單但**無法滿足「placement points may vary depending on article content」之 user 需求**。

### 3.2 Option B：Array-based Placements（adsense.blocks[]）

frontmatter（mirror affiliate.blocks[]）：

```yaml
adsense:
  blocks:
    - id: "after-header"
      enabled: true
      surfaces: ["blogger", "pages"]
      slotKey: "articleAd1"
      anchor: "afterHeader"
      order: 1
    - id: "after-intro"
      enabled: true
      surfaces: ["blogger", "pages"]
      slotKey: "articleAd2"
      anchor: "afterIntro"
      order: 2
    - id: "before-affiliate-bottom"
      enabled: true
      surfaces: ["pages"]
      slotKey: "articleAd3"
      anchor: "beforeAffiliateBottom"
      order: 3
    # ... ~6 blocks
```

settings：保留 6 個 named `slotKey`（article-anchor agnostic）：

```json
"slots": {
  "articleAd1": "",
  "articleAd2": "",
  "articleAd3": "",
  "articleAd4": "",
  "articleAd5": "",
  "articleAd6": ""
}
```

EJS 在每個 anchor location 檢查 `adsense.blocks[]` 是否有對應 anchor 之 block → 渲染。

評估：

| 面向 | 評分 |
|---|---|
| 一人維護 | ✅ 中（YAML 雖然 verbose，但 explicit） |
| per-article 調整 | ✅ **每篇可獨立配 6 個 anchor** |
| Blogger + GitHub 一致 | ✅ surfaces 控制兩端 |
| validation 複雜度 | ⚠️ 中（id 唯一、anchor enum、surfaces enum、slotKey 存在） |
| renderer 複雜度 | ⚠️ 中（每 anchor location 要 lookup blocks）；可寫 build 端 derive helper |
| 破壞 GitHub 既有風險 | ✅ 低（純 additive，現有 `blocks.adsenseTop` / `Bottom` 並行保留） |
| enabled=false 安全 | ✅ 沿用 §6.4 |
| article variation | ✅ **完整支援**：可開不同 anchor / 不同 order |

**結論**：✅ 完整滿足 user 需求；認知負擔可接受（與 affiliate.blocks[] 同 schema 形狀）。

### 3.3 Option C：Markdown Marker / Shortcode（`<!-- adsense:articleAd1 -->`）

content/blogger/posts/*.md body：

```markdown
## 引言段落

正文...

<!-- adsense:articleAd1 -->

## 第二段

更多正文...

<!-- adsense:articleAd2 -->
```

build 階段在 markdown render 後 / EJS 之前掃 `<!-- adsense:slotKey -->` 並 replace 為對應 `adsense-slot.ejs` 輸出。

評估：

| 面向 | 評分 |
|---|---|
| 一人維護 | ✅ 直觀（位置直接在 body 旁） |
| per-article 調整 | ✅ **完全自由**（位置任意） |
| Blogger + GitHub 一致 | ⚠️ marker 需在 build 端**兩處**處理 |
| validation 複雜度 | ⚠️ 中（marker 字串檢查；slotKey 拼字錯誤無 fail-fast） |
| renderer 複雜度 | ⚠️ 高（需改 `parse-markdown.js` 或加 marker post-process） |
| 破壞 GitHub 既有風險 | ⚠️ 中（碰 markdown pipeline） |
| enabled=false 安全 | ✅ marker stripped 即可 |
| article variation | ✅ **最自由**；可在段落中間放 |

**結論**：最靈活但需動 markdown pipeline；validator / renderer / surface-gating 複雜；author 須在 markdown 內手寫 marker（與「不手貼 ad HTML」之精神一致，但仍是 body 內手寫）。

### 3.4 Option D：Hybrid B + C（Anchor + Inline Marker；deferred）

Option B 之 anchor 涵蓋大部分情境（header 後 / intro 後 / affiliate 前 / hashtag 前 等清楚 anchor）；少數**段落中間**位置（書評每讀完一節插廣告）改用 Option C 之 `<!-- adsense:slotKey -->` marker。

`adsense.blocks[]` entry 可選擇：
- 走 anchor（`anchor: "afterIntro"`）
- 走 marker（`marker: "articleAd3"`，在 body 內找 `<!-- adsense:articleAd3 -->`）

**結論**：⚠️ 複雜；v1 **不採用**；列為未來 v2 升級路徑。

### 3.5 Options 比較總表

| 面向 | A: Fixed | B: Array | C: Marker | D: Hybrid |
|---|---|---|---|---|
| 一人維護 | ✅ 簡單 | ✅ 中 | ✅ 中 | ⚠️ 高 |
| per-article 位置調整 | ❌ 不可 | ✅ 可 | ✅ 完全自由 | ✅ 完全自由 |
| Blogger + GitHub parity | ✅ | ✅ | ⚠️ | ⚠️ |
| validation 成本 | ✅ 低 | ⚠️ 中 | ⚠️ 中 | ⚠️ 高 |
| renderer 成本 | ✅ 低 | ⚠️ 中 | ⚠️ 高 | ⚠️ 高 |
| 破壞既有風險 | ✅ 低 | ✅ 低 | ⚠️ 中 | ⚠️ 中 |
| enabled=false 安全 | ✅ | ✅ | ✅ | ✅ |
| article 變異支援 | ❌ | ✅ | ✅ | ✅ |
| schema 與現有 pattern 對齊 | ❌ | ✅ mirror affiliate.blocks[] | ❌ 新概念 | ❌ |

---

## 4. Recommended Convention（鎖定 Option B）

### 4.1 決策

✅ **採 Option B：`adsense.blocks[]` array-based with anchor enum**。

理由：

1. **per-article 彈性**：每篇 6 個 anchor 可獨立配置（書評 / 漫畫 / 教具下載文不同）
2. **schema 對齊**：與既有 `affiliate.blocks[]`（pm-12 / pm-13 落地）schema 形狀完全 mirror；author 認知負擔最小
3. **surface gating 一致**：`surfaces: ["blogger", "pages"]`，與 affiliate.blocks[] 同字典
4. **不碰 markdown pipeline**：避開 Option C / D 之 `parse-markdown.js` 改動風險
5. **既有 partial 可重用**：`adsense-slot.ejs` 基底不動；只需新增 anchor-level wrapper / lookup helper
6. **validator 重用既有 pattern**：mirror commerce-ref C1~C9 / affiliate-blocks shape rules
7. **enabled=false 安全模式不變**：3-gate（§6.4）由 `adsense-slot.ejs` 保留
8. **Blogger / GitHub parity**：兩端 surface 渲染同一 anchor enum；mirror affiliate dual-block 之 parity 原則

### 4.2 與 Option A 之差異記錄

Option A 之 `articleAd1` ~ `articleAd6` **作為 settings slot key 名稱保留**（不浪費；§5），但**不作 frontmatter flag**。理由：article-level adjustment 之主入口在 `adsense.blocks[]`，slot id 只是「向 Google 提交之 slot 識別」。

### 4.3 與舊 Blogger ad-1 ~ ad-6 之關係

舊 Blogger 文章內手貼之 `ad-1` ~ `ad-6` HTML：

- ✅ 作為**位置 reference**：哪幾個段落間放廣告效果好
- ❌ 不作 class name binding：新系統用 `lab-ad-slot lab-ad-slot--<slotKey>`（沿用 §6.1 既有 markup）
- ❌ 不作 slotKey naming binding：新 slotKey 可任意（`articleAd1`~`6` / `inArticle1`~`6` / 其他）

---

## 5. Settings Model（`content/settings/ads.config.json` 演進設計）

### 5.1 目標 schema（未來實作；本 phase 不改）

```json
{
  "enabled": false,
  "adsenseClient": "",
  "loader": {
    "blogger": "article",
    "pages": "head"
  },
  "slots": {
    "articleAd1": "",
    "articleAd2": "",
    "articleAd3": "",
    "articleAd4": "",
    "articleAd5": "",
    "articleAd6": "",
    "homeInline": "",
    "sidebar": ""
  },
  "defaults": {
    "blocks": []
  }
}
```

### 5.2 欄位字典

| 欄位 | 型別 | 用途 |
|---|---|---|
| `enabled` | boolean | 全域 enable / disable（保留既有 §6.4 三重 gate） |
| `adsenseClient` | string | publisher id（placeholder 空字串）；範例 `"ca-pub-XXXXXXXXXXXXXXXX"` |
| `loader.blogger` | `"article"` \| `"theme"` \| `"none"` | 控制 Blogger 端 `adsbygoogle.js` loader 來源（§5.3） |
| `loader.pages` | `"head"` \| `"none"` | 控制 GitHub Pages 端 loader（既有 §6.2 之 head 注入機制；`"none"` 為 escape hatch） |
| `slots.articleAd1`~`6` | string | 6 個 article-level slot id（向 Google 申請；placeholder 空字串） |
| `slots.homeInline` | string | 首頁 inline slot id（既有保留） |
| `slots.sidebar` | string | 側欄 slot id（既有保留；未 wire） |
| `defaults.blocks[]` | array | 預設 6 個 block 配置（per-article 未填 `adsense.blocks` 時 fallback；§6.2） |

### 5.3 Blogger loader 三選一（避免重複 adsbygoogle.js）

Blogger 平台 theme 可能已自帶 `adsbygoogle.js` script。重複載入會被 Google 視為違規。三種應對：

| `loader.blogger` | 行為 |
|---|---|
| `"theme"` | 信任 Blogger theme 已 inject `adsbygoogle.js`；模板 build 端**不**輸出 loader script，**只**輸出 `<ins>` slot |
| `"article"` | Blogger theme 沒 loader；build 端在 article HTML 開頭輸出 1 次 loader script（per-article 內 inline，重貼時隨 article body 進 Blogger 編輯器） |
| `"none"` | 完全不接 AdSense（fallback 至 §6.6 既有 Blogger-not-wired 行為） |

預設值建議：`"theme"`（保守，避免重複 loader）。實作階段須 user 確認自己 Blogger theme 之 loader 狀態。

### 5.4 紅線

- ❌ 不放真實 `ca-pub-XXXXXXXX` 進 commit
- ❌ 不放 OAuth client secret / API key / dashboard 統計
- ❌ 不放 AdSense 收益 / RPM / 申請帳號 email
- ❌ 不引 AdSense API client library

---

## 6. Per-Article Model（frontmatter `adsense.blocks[]` 設計）

### 6.1 完整 schema（lockdown；未來實作之 source of truth）

```yaml
adsense:
  enabled: true              # 文章層 master switch（default true；fallback 至 settings.ads.enabled）
  blocks:
    - id: "after-header"     # 唯一識別；snake-case-with-dashes
      enabled: true          # 單 block 開關（default true）
      surfaces: ["blogger", "pages"]  # 預設 ["blogger", "pages"]；省略=兩端
      slotKey: "articleAd1"  # 對應 settings.slots[key]
      anchor: "afterHeader"  # 必填；enum 見 §7
      order: 1               # optional；同 anchor 多 block 時排序
      note: ""               # optional；author 自留
```

### 6.2 fallback 行為

- `adsense` 物件缺漏 / `adsense.blocks` 未填 → fallback 至 `settings.ads.defaults.blocks[]`（若 settings 有定義）
- `settings.ads.defaults.blocks[]` 亦未定義 → 退回既有 `blocks.adsenseTop` / `adsenseBottom` 兩個 flag 行為（backward compat 路徑）
- 全空 → 不渲染任何 AdSense

⚠️ **本 phase 不引此 fallback；現有 `blocks.adsenseTop` / `adsenseBottom` 在未來 phase 才考慮 deprecation 或保留 backward compat**。

### 6.3 「文章用預設 6 slot」之 YAML 寫法

最簡：

```yaml
adsense:
  enabled: true
  # blocks 不填，走 settings.defaults.blocks[]
```

### 6.4 「整篇關閉 AdSense」之寫法

```yaml
adsense:
  enabled: false
```

或：

```yaml
adsense:
  blocks: []  # 空 array 視為「explicit 不要任何 block」
```

### 6.5 「關掉某個 block」之寫法

兩種：

A. 在 blocks[] 中保留該 id 但設 enabled=false：

```yaml
adsense:
  blocks:
    - id: "after-header"
      enabled: false
      anchor: "afterHeader"
```

B. 完全省略該 entry（須 author 自己把 default 6 個展開後刪除）。

建議走 A（顯式 audit trail）。

### 6.6 「per-article 改位置 / 順序」之寫法

```yaml
adsense:
  blocks:
    - id: "moved-to-after-intro"
      enabled: true
      slotKey: "articleAd1"
      anchor: "afterIntro"      # 改 anchor
      order: 1
    - id: "block-2"
      enabled: true
      slotKey: "articleAd2"
      anchor: "beforeHashtags"  # 改另一個 anchor
      order: 1
```

### 6.7 「Blogger only / Pages only」之寫法

```yaml
adsense:
  blocks:
    - id: "blogger-only"
      enabled: true
      slotKey: "articleAd1"
      anchor: "afterHeader"
      surfaces: ["blogger"]
    - id: "pages-only"
      enabled: true
      slotKey: "articleAd2"
      anchor: "afterIntro"
      surfaces: ["pages"]
```

### 6.8 紅線

- ❌ 不在 frontmatter 放 publisher id / slot id（slot id 走 settings）
- ❌ 不在 frontmatter 放 ad code HTML
- ❌ 不允許 `surfaces: []`（空 array = 不渲染；視為 misconfig，validator warn）
- ❌ 不允許 anchor 不在 §7 enum

---

## 7. Placement Anchor Vocabulary

### 7.1 anchor 命名原則

- lowerCamelCase
- 動詞 `after` / `before` 前綴；對齊既有區塊名
- 命名與 §2.5 / §2.6 之既有區塊順序 1:1

### 7.2 v1 anchors（10 個；實作時 6 個夠用）

| Anchor | 位置 | Blogger | Pages | v1? |
|---|---|---|---|---|
| `afterHeader` | article header 後（mirror 現有 postTop） | ✅ | ✅ | ✅ v1 |
| `afterCover` | cover image 後（GitHub-only；Blogger 無 cover 區塊） | ❌ | ✅ | ✅ v1 |
| `afterBookPhoto` | book photo 後（book-review 文章專用） | ✅ | ✅ | ✅ v1 |
| `afterAffiliateTop` | affiliate top box 後 | ✅ | ✅ | ✅ v1 |
| `afterIntro` | bodyHtml 內第一段後（**需 marker；deferred 至 v2**） | — | — | ❌ deferred |
| `inArticle` | bodyHtml 中段（**需改 parse-markdown；deferred**） | — | — | ❌ deferred |
| `beforeDownloadBox` | download box 前 | ✅ | ✅ | ✅ v1 |
| `afterDownloadBox` | download box 後 | ✅ | ✅ | ✅ v1 |
| `beforeAffiliateBottom` | affiliate bottom box 前 | ✅ | ✅ | ✅ v1 |
| `afterAffiliateBottom` | affiliate bottom box 後 | ✅ | ✅ | ✅ v1 |
| `beforeRelatedLinks` | related links 前 | ✅ | ✅ | ✅ v1 |
| `afterRelatedLinks` | related links 後 | ✅ | ✅ | ✅ v1 |
| `beforeOtherLinks` | other links 前 | ✅ | ✅ | ✅ v1 |
| `afterOtherLinks` | other links 後 | ✅ | ✅ | ✅ v1 |
| `beforeHashtags` | hashtags 前（mirror 現有 postBottom） | ✅ | ✅ | ✅ v1 |
| `afterHashtags` | hashtags 後 | ✅ | ✅ | ✅ v1 |

### 7.3 v1 範圍說明

v1 = **不動 markdown pipeline**之 anchor（區塊邊界 anchor）。
v2 = **進入 markdown body 內**之 anchor（須加 marker 或改 parse-markdown）；含：

- `afterIntro`：body 第一段後（**deferred**）
- `inArticle`：body 任意中段（**deferred**；走 Option C marker）
- `afterFirstImageGroup`、`afterMainComic`、`afterReadingNotes`：書評 / 漫畫專用 mid-body anchor（**deferred**）

### 7.4 user prompt 中提及之 anchor 對應

| User-suggested | v1 對應 |
|---|---|
| `afterHeader` | ✅ v1 |
| `afterIntro` | ❌ deferred（mid-body） |
| `afterFirstImageGroup` | ❌ deferred（mid-body） |
| `afterMainComic` | ❌ deferred（mid-body） |
| `afterReadingNotes` | ❌ deferred（mid-body） |
| `beforeBookInfo` | ✅ v1（= `afterBookPhoto` 反向；建議用 `afterBookPhoto`） |
| `afterBookInfo` | ✅ v1（= `afterBookPhoto`） |
| `beforeAffiliateBottom` | ✅ v1 |
| `beforeRelatedLinks` | ✅ v1 |
| `beforeHashtags` | ✅ v1 |

### 7.5 6 個建議預設 anchor 組合（settings.defaults.blocks）

書評類型建議：

```
afterHeader → articleAd1
afterBookPhoto → articleAd2
afterAffiliateTop → articleAd3
beforeAffiliateBottom → articleAd4
beforeRelatedLinks → articleAd5
beforeHashtags → articleAd6
```

技術筆記 / 一般文建議：

```
afterHeader → articleAd1
afterCover → articleAd2  (Pages-only)
afterDownloadBox → articleAd3
beforeRelatedLinks → articleAd4
beforeOtherLinks → articleAd5
beforeHashtags → articleAd6
```

⚠️ 預設組合屬**建議**，實際 `settings.defaults.blocks[]` 之預設值由實作階段 user 確認。

---

## 8. Existing Partial Reuse / Refactor Plan

### 8.1 既有 partial 可直接重用

| Partial | 重用程度 |
|---|---|
| `adsense-slot.ejs`（基底） | ✅ **完全重用，零修改**；接 `{ slotKey, ads }` → 3-gate → 輸出 `<ins>`；新 model 之每個 block 仍只是 `{ slotKey }` 之 wrapper |
| `adsense-head.ejs`（head loader） | ✅ **完全重用，零修改**；2-gate；新增 `loader.pages` config 控制是否 include（已有 enabled+adsenseClient gate） |

### 8.2 既有 specialized partial 之去留

| Partial | 處理建議 |
|---|---|
| `adsense-post-top.ejs` | ⚠️ 保留 backward compat（既有 `blocks.adsenseTop` 仍有效）；或於未來 deprecation phase 移除 |
| `adsense-post-bottom.ejs` | ⚠️ 同上 |
| `adsense-post-middle.ejs` | ✅ 保留（partial 已備，未來 mid-body marker phase 可重用） |
| `adsense-home-inline.ejs` | ✅ 保留（首頁 inline，與 article 解耦） |
| `adsense-sidebar.ejs` | ✅ 保留（未 wire；待 sidebar 元件設計） |

### 8.3 新需要之 partial / helper（未來實作）

| 新增項目 | 用途 |
|---|---|
| `adsense-article-block.ejs`（partial） | 接 `{ block, ads }`（resolved block object，含 slotKey）→ 委派 `adsense-slot.ejs` |
| `src/scripts/resolve-adsense-blocks.js`（build-side helper） | mirror `resolve-affiliate-links.js`；輸入 `(post.adsense, settings.ads, surface)` → 輸出 per-anchor `adsenseBlocksRendered: { [anchor]: [block] }`；含 surface filter + enabled filter + defaults fallback |
| Blogger loader emit 邏輯 | `build-blogger.js` 端按 `loader.blogger` 決定是否在 article HTML 開頭 emit `adsbygoogle.js` script（per-article 內 inline） |

### 8.4 Page template 之 wire 點（13+ anchor）

post-detail.ejs（GitHub）與 blogger-post-full.ejs（Blogger）需各自在 §7.2 v1 anchor 位置 include：

```ejs
<%- include('../ads/adsense-article-block', { block: pickBlock('afterHeader'), ads }) %>
```

其中 `pickBlock(anchor)` 由 build 端 resolved `adsenseBlocksRendered[anchor]` 提供。

**現有 L63 / L294 之 `adsense-post-top` / `adsense-post-bottom` include 視 deprecation 策略保留或移除**（實作 phase 決定）。

---

## 9. Validator Design（warning-only first；未來實作）

### 9.1 規則清單（建議 12 條 warning-only）

mirror commerce.blocks[] / affiliate.blocks[] / commerce-ref C1~C9 之既有 pattern：

| Rule | 條件 |
|---|---|
| `adsense-blocks-not-array` | `adsense.blocks` 存在但非 array |
| `adsense-block-invalid-entry-type` | block entry 非 object |
| `adsense-block-missing-id` | block 缺 `id` |
| `adsense-block-duplicate-id` | 同 post 內 `id` 重複 |
| `adsense-block-invalid-enabled-type` | enabled 非 boolean |
| `adsense-block-invalid-surfaces-type` | surfaces 非 array |
| `adsense-block-invalid-surface-value` | surfaces[i] 不在 `{blogger, pages}` |
| `adsense-block-empty-surfaces` | `surfaces: []` |
| `adsense-block-invalid-anchor` | anchor 不在 §7.2 v1 enum |
| `adsense-block-missing-anchor` | anchor 缺 |
| `adsense-block-missing-slot-key` | slotKey 缺 |
| `adsense-block-slot-key-not-found` | slotKey 不在 `settings.ads.slots` |
| `adsense-block-slot-id-empty` | settings.slots[slotKey] 為空字串（warn-only；對應 settings 未填） |

### 9.2 紅線

- 全 warning-only first（mirror affiliate-blocks validator 既有 pattern）
- 不檢 publisher id 是否真實
- 不做網路 reachability
- 不在 message echo publisher id / slot id 值
- fixtures 走 `content/validation-fixtures/blogger/posts/_test-adsense-block-*.md`；不放真實 slot id

---

## 10. Safe Implementation Sequence（多 sub-phase；本 phase 不執行）

| Phase | 內容 | 動作 |
|---|---|---|
| **N4**（本 phase） | docs convention 鎖定 | ✅ 本檔 |
| N5 | validator warning-only landing（schema rules + fixtures） | docs + source |
| N6 | settings shape 擴充（`loader` / `defaults.blocks[]` / `slots` 擴 6 個） | source |
| N7 | build-side resolver（`resolve-adsense-blocks.js`）+ surface filter | source |
| N8 | GitHub Pages EJS insertion（13 anchor wire 點；雙重 gate；enabled=false byte-identical） | source |
| N9 | Blogger EJS insertion + `loader.blogger` emit 邏輯 | source |
| N10 | fixture / local acceptance（dist-blogger / dist 抽樣） | accept |
| N11 | enabled=false byte-identical acceptance（既有 70 posts 全比對） | accept |
| N12 | user 提供真實 publisher id + 6 slot id → enabled=true 之 settings 暫改 + 抽樣 grep | accept |
| N13 | deploy gate（仍 user manual；不自動 push gh-pages） | deploy |
| N14 | Blogger 重貼（user manual；不自動 edit Blogger） | manual |
| N15 | post-deploy GA4 / AdSense 後台驗收 | accept |

⚠️ **每個 sub-phase 之間 normal validate baseline 0/N/70 須保持**（N 可增，但 errors=0）。

⚠️ **deploy / 重貼 Blogger 仍 user manual**；不自動。

---

## 11. Current Non-Goals（本 phase 明確不做）

per user prompt §D + 本檔 §1.3：

- ❌ 不實作 AdSense
- ❌ 不 build
- ❌ 不 deploy
- ❌ 不 touch gh-pages
- ❌ 不 edit Blogger
- ❌ 不改 `src/` 任何檔
- ❌ 不改 partial / EJS templates
- ❌ 不改 content/blogger/posts/ 任何 .md
- ❌ 不改 `content/settings/ads.config.json`（保留 §2.2 既有 5-slot shape）
- ❌ 不動 commerce / affiliate / download registry
- ❌ 不改 affiliate URLs
- ❌ 不 seed 聯盟網 fake data
- ❌ 不新增 per-article CTA / FAQ / hashtag / otherLinks feature
- ❌ 不放真實 publisher / slot id 進 docs

---

## 12. Open Questions / 未來決策

下列須在 N5 ~ N9 sub-phase **由 user 確認**，本 phase 不下定論：

1. **Blogger loader 三選一預設**（`"theme"` / `"article"` / `"none"`）：須 user 確認既有 Blogger theme 是否已含 adsbygoogle.js loader
2. **既有 `blocks.adsenseTop` / `adsenseBottom` 之去留**：v1 並行（backward compat）/ v1 deprecate（一刀切）/ v1 mute（不報 conflict）
3. **`settings.ads.defaults.blocks[]` 之預設 6 組合**：書評 / 技術筆記 / 漫畫 / 教具下載 共用 1 套 / 各 1 套
4. **6 個 slot 是否在 AdSense 後台用 native ads / display ads 混用**：影響 `adsense-slot.ejs` markup 之 `data-ad-format`
5. **mid-body anchor v2 路徑**：marker / parse-markdown 改造 / shortcode
6. **Blogger 端 GA4 click tracking AdSense impression**：deferred；不在 AdSense v1 範圍
7. **AdSense + AdSense Auto Ads 共存**：須 user 確認 Blogger 後台是否已開 Auto Ads（避免重複版位）
8. **enabled=true 抽樣 grep 之 acceptance threshold**：6 slot × 70 posts × 2 surface = 840 anchor location；抽樣方式由 N12 sub-phase 定

---

## 13. Phase 完成標誌

本 phase（20260610-night-4）完成標誌：

- ✅ 本檔 `docs/20260610-night-4-adsense-six-slot-convention-preanalysis.md` landed
- ✅ `docs/seo-ga4-adsense.md` §6.10 加 forward-pointer 到本檔
- ✅ `git diff --check` 乾淨
- ✅ `npm run validate:content` = 0 errors / 80 warnings / 70 posts（baseline 不變）
- ✅ 無 source / template / content / settings / build / deploy / gh-pages / Blogger 變更

未來 sub-phase（N5+）以本檔 §3~§10 為 source of truth。
