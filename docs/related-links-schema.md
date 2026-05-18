# 相關連結 / 其他連結 Metadata 規格 (Related / Other Links Metadata Schema)

本文件為 `relatedLinks` / `otherLinks` 之 metadata 規格。所有讀取、寫入、驗證 `relatedLinks` / `otherLinks` 之實作皆須以本文件為準。

對應之上層規範詳見：
- `docs/publish-bundle.md` §2.6.1（內容屬性放 `.md` frontmatter 之硬性原則；`relatedLinks` / `otherLinks` 屬其預留欄位之列舉）
- `docs/publish-bundle.md` §2.6.4（內容屬性不得塞入 `.publish.json` / `.fb.md`）
- `docs/publish-json-schema.md`（`relatedLinks` / `otherLinks` 不屬 `.publish.json`）
- `docs/fb-sidecar-schema.md`（`relatedLinks` / `otherLinks` 不屬 `.fb.md`）
- `CLAUDE.md` §16（連結處理規則之原始 spec；本文件之 `kind` 自動 rel 規則為其延伸）
- `CLAUDE.md` §17（文章頁基本版型；relatedLinks / otherLinks 為文章 body 後之新區塊，與既有 Related Posts auto 區塊嚴格分離）

本文件之實作落地時機為 **Phase 9-g-d 之後**；Phase 9-g-b 階段僅交付規格文件，**不寫程式、不建立 sample、不修改 template、不接入任何 caller**。

---

## §1 文件目的

### 1.1 relatedLinks / otherLinks 是「作者於文章末尾手動指定之連結清單」

`relatedLinks` 與 `otherLinks` 描述**作者於該篇文章手動指定**之兩個連結分區，用於文章 body 後渲染「相關連結」與「其他連結」兩個 H2 區塊。

實際應用情境：

- 書評文章列出同系列文章、原書出版社頁、圖書館館藏頁、相關 YouTube 影片
- 技術文章列出參考來源、官方文件、相關 GitHub repo、延伸閱讀
- 教具下載文章列出主題相關下載、配套使用教材
- 講座 / 活動心得文列出講者其他資源、相關書目

`relatedLinks` / `otherLinks` 屬**內容屬性**（per `docs/publish-bundle.md` §2.6.1）：

- 文章創作時即決定，發布後極少變動
- 與平台無關，Blogger / GitHub Pages / FB 皆共用同一份 metadata
- 屬內容創作層級之資源 / 引用描述

### 1.2 「相關連結」與「其他連結」之分區語意

兩欄位皆為扁平 array；分區邊界由「在哪個 array」表達，**不需 discriminator 欄位**。

| 欄位 | 顯示 H2 | 建議語意 |
| --- | --- | --- |
| `relatedLinks` | 「相關連結」 | 與本文主題**直接相關**之延伸閱讀 / 系列其他文章 / 重要參考資源 |
| `otherLinks` | 「其他連結」 | **次要補充**之外部來源 / 館藏 / 影片 / 資料引用 |

兩欄位**皆可同時包含** `kind: internal` 與 `kind: external` 之 item — 分區純為**顯示分組**，與 `kind` 無強制對應關係。例：作者可於 `relatedLinks` 同時放「同系列之 Blogger 文章（internal）」與「原書出版社頁（external）」；於 `otherLinks` 放「圖書館館藏（external）」與「另一本站平台之延伸閱讀（internal）」。

### 1.3 relatedLinks / otherLinks 不是平台發布 / 推廣資料

兩欄位**不**屬下列範疇：

- ❌ 不是平台發布狀態（與 `.publish.json` `blogger.status` / `github.status` 無關）
- ❌ 不是 URL 推導依據（與 `blogger.publishedUrl` / `github.publishedUrl` 之自動產生無關；但 internal link 之 url 應**使用回填後之真實 URL** — 見 §5）
- ❌ 不是 FB 推廣文案（與 `.fb.md` 無關）
- ❌ 不是 SEO meta 欄位（與 `.publish.json` `seo` 無關）

由此衍生：兩欄位不放 `.publish.json`；亦不放 `.fb.md`。

---

## §2 與其他 schema 的邊界

### 2.1 邊界總表

| Schema / 機制 | 範疇 | 落點 | 與 relatedLinks / otherLinks 關係 |
| --- | --- | --- | --- |
| **post frontmatter**（top-level） | 文章本身（title、slug、date、tags、cover 等） | `.md` frontmatter 頂層 | relatedLinks / otherLinks 為其子區塊 |
| **本文件**（`relatedLinks` / `otherLinks`） | 作者手動指定之兩個連結分區 | `.md` frontmatter `relatedLinks:` / `otherLinks:` | 本文件 |
| **`blocks.relatedPosts`** | **系統自動推薦**之相關文章卡片區塊（依 tags / category 自動產生） | `.md` frontmatter `blocks.relatedPosts: true/false` | **兩套獨立機制**；詳見 §7 |
| **`affiliate.links`** | 聯盟販售連結（書評 / 教具下載文章專用） | `.md` frontmatter `affiliate.links[]` | **兩套獨立機制**；rel 規則不同；詳見 §6 |
| **`book.*`** | 文章所評論 / 引用之單一書本 / 雜誌實體 metadata | `.md` frontmatter `book:` | 完全獨立；book 描述「實體」、relatedLinks 描述「連結」 |
| **`series.*`** | 跨文章系列歸類 | `.md` frontmatter `series:` | 完全獨立；series 為跨文章主題、relatedLinks 為單篇連結清單 |
| **`.publish.json`** | 平台發布輔助資料 | sidecar 檔 | 完全獨立；relatedLinks / otherLinks **不寫入** `.publish.json` |
| **`.fb.md`** | FB 推廣文案 | sidecar 檔 | 完全獨立；relatedLinks / otherLinks **不寫入** `.fb.md` |

### 2.2 relatedLinks ≠ blocks.relatedPosts（two-track 原則）

| 維度 | `blocks.relatedPosts`（自動） | `relatedLinks` / `otherLinks`（手動） |
| --- | --- | --- |
| 資料來源 | 系統依 tags / category 自動推薦 | 作者於 frontmatter 手動指定 |
| 對作者透明度 | 透明（作者不需逐筆填寫） | 顯式（作者逐筆填寫） |
| 連結對象 | 僅本站文章 | 可 internal（本站任一平台）/ 可 external（任意第三方）|
| 控制粒度 | 整個區塊 on / off（boolean） | 逐項 platform / title / description / url 控制 |
| 顯示 H2 | 「相關文章」（或 template 自訂） | 「相關連結」 / 「其他連結」 |
| 落點 | 文章 body 後段；template 自動渲染 | 文章 body 後段；template 條件渲染（per §8） |

兩機制可**同時存在於同一篇文章**；兩者顯示位置可前後排列，由 EJS template 決定。本文件之 `relatedLinks` / `otherLinks` **不取代** `blocks.relatedPosts`；後者屬 CLAUDE.md §17 / §19 既有設計。

### 2.3 relatedLinks ≠ affiliate.links

| 維度 | `affiliate.links` | `relatedLinks` / `otherLinks` |
| --- | --- | --- |
| 用途 | 聯盟販售 / 商品推薦 | 延伸閱讀 / 來源引用 |
| 自動 rel | `sponsored nofollow noopener noreferrer`（per CLAUDE.md §16.2） | 依 `kind` 動態決定（per §4） |
| 強制 disclosure | 是（`affiliate.disclosure`） | 否 |
| GA4 event | `affiliate_click` | `internal_link_click` / `tag_click` 等視情境（per CLAUDE.md §5 GA4 event 列表） |
| 第一版顯示位置 | 文章前置 / 後置（per `position.top` / `position.bottom`） | 文章 body 後段（per §8）|

`relatedLinks` / `otherLinks` 之 item **不得**塞入 affiliate 連結；如有聯盟販售需求，使用 `affiliate.links`。

---

## §3 欄位字典

### 3.1 頂層結構

```yaml
# .md frontmatter
relatedLinks: <array of link entries>   # 可選；空陣列或省略時不渲染「相關連結」區塊
otherLinks:   <array of link entries>   # 可選；空陣列或省略時不渲染「其他連結」區塊
```

兩欄位皆為**頂層 array**，與 `tags` / `affiliate` / `book` / `series` 平行。空陣列、`null`、`undefined` 皆視為「該分區無連結」，渲染端不輸出空白區塊（per CLAUDE.md §17 之「Optional block 沒有資料時，不得輸出空白區塊」原則）。

### 3.2 link entry 欄位總表

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- | --- |
| `kind` | enum | **是** | — | `"internal"` / `"external"`；決定自動 rel 規則（§4） |
| `platform` | string | **是** | — | 來源 / 平台 / 站台名稱（如 `"blogger"` / `"github"` / `"Youtube"` / `"台北市立圖書館"` / `"官方網站"`） |
| `title` | string | **是** | — | 真正顯示的連結標題（**不**包含 platform）|
| `url` | string | **是** | — | 連結網址；internal 應為已發布後之真實 URL（per §5）|
| `description` | string | 否 | `""` | 補充說明；空字串時不渲染描述行 |
| `order` | number | 否 | 陣列順序 | 顯示排序；同 array 內以 `order` 升冪排序；缺值者沿用陣列順序 |
| `target` | string | 否 | 依 `kind` 自動 | `"_blank"` 等；空字串或缺值時由 build / render 階段依 `kind` 自動套（§4）|
| `rel` | string | 否 | 依 `kind` 自動 | 空字串或缺值時由 build / render 階段依 `kind` 自動套（§4）；作者**不需手填** |

### 3.3 欄位驗證細節

Phase 9-g-c-c 已落地 4 條 warning-only 規則（per `src/scripts/validate-content.js` + 4 fixtures `content/validation-fixtures/blogger/posts/_test-related-links-*.md`）：

| # | 規則 key | 觸發條件 |
| --- | --- | --- |
| 1 | `related-links-not-array` | `relatedLinks` 或 `otherLinks` 欄位存在但非 array；觸發後 skip 該欄位之 entry-level 檢查 |
| 2 | `related-links-entry-missing-kind` | entry 為 plain object 且 `kind` 缺漏 / 空字串 |
| 3 | `related-links-entry-kind-invalid` | entry 之 `kind` 已存在且為非空值，但不在 `{ "internal", "external" }`；**與 #2 互斥**（避免同 entry 重複噪音） |
| 4 | `related-links-entry-missing-url` | entry 之 `url` 缺漏或空字串 |

合法 / skip 行為（不觸發 warning）：

- `relatedLinks` / `otherLinks` 欄位 `undefined` — 合法
- 空陣列 `[]` — 合法
- entry 非 plain object（含 array / null / 非 object）— **skip 該 entry**（mirror `book.authors[]` 既有 pattern；**不新增** entry-not-object warning）

規則範圍：僅 `ready` / `published` 文章（沿用既有 series / book 規則範圍；drafts / archived 由 `loadPosts` 過濾不進）。

`relatedLinks` 與 `otherLinks` 共用同一 helper `validateRelatedLinksField`（schema 完全相同）。

**保守延後**（per Phase 9-g-c-c-a §6.2 / Phase 9-g-c-c 第 11 點）：以下規則於本批**不落地**，留待後續觀察作者實際使用情況再評估：

- `related-links-entry-missing-platform` — `platform` 必填 warning（completeness 面向）
- `related-links-entry-missing-title` — `title` 必填 warning（completeness 面向）
- `related-links-platform-in-title` — `title` 開頭含 `[xxx]` 顯示前綴之 heuristic warning（誤判風險）

`description` / `order` / `target` / `rel` 為選填欄位，本批不檢查型別 / 格式。

### 3.4 platform 命名規則

`platform` 為**自由字串**，用於渲染端顯示前綴 `[{platform}]`（如 `[Youtube]` / `[台北市立圖書館]`）：

- 本站平台建議使用 lowercase short slug：`"blogger"` / `"github"`（與 site identifier 對齊）
- 外部平台使用人類可讀名稱（中文 / 英文皆可）：`"Youtube"` / `"台北市立圖書館"` / `"博客來"` / `"官方網站"` / `"作者部落格"` 等
- 不限長度；但建議簡短（< 12 字元）以利顯示

**重要**：`[Youtube]` / `[台北市立圖書館]` 等顯示前綴**不得**併入 `title`。例：

```yaml
# ❌ 錯誤示範（platform 併入 title）
- kind: external
  platform: ""
  title: "[Youtube]🚩【吳淡如Ｘ鄧惠文】做個內力強大的人，別再讓能量被綁架"
  url: "..."

# ✅ 正確示範（platform 與 title 拆開）
- kind: external
  platform: "Youtube"
  title: "🚩【吳淡如Ｘ鄧惠文】做個內力強大的人，別再讓能量被綁架"
  url: "..."
```

理由：分離 platform 後，渲染端可一致格式化、可條件套用 platform 圖示、可日後統一改 display style，不需修改既有文章 frontmatter。

---

## §4 internal / external 與自動 target / rel 規則

### 4.1 規則總表

| `kind` | 預設 `target` | 預設 `rel` | 對應 CLAUDE.md 連結處理規則 |
| --- | --- | --- | --- |
| `"internal"` | 無（同分頁開啟） | 無 | §16.3（站內連結不加 nofollow；不加 UTM 避免污染 GA4） |
| `"external"` | `"_blank"` | `"nofollow noopener"` | §16.1（一般外部連結） |

### 4.2 設計原則

1. **作者不需手填 `target` / `rel`**：避免不同文章間 rel 不一致；build / render 階段依 `kind` 自動套
2. **若作者顯式填 `target` / `rel`，採作者值**：保留覆蓋機制，但不鼓勵
3. **affiliate / sponsored 不走本 schema**：聯盟販售連結使用 `affiliate.links`（自動 `sponsored nofollow noopener noreferrer`，per CLAUDE.md §16.2）；relatedLinks / otherLinks 之 external item **不應**為聯盟連結

### 4.3 與 Blogger / GitHub 互導之關係

CLAUDE.md §16.4 描述 Blogger ↔ GitHub 互導之 UTM 規則（`utm_source=blogger` 等）。本文件 `kind: internal` 連結之 UTM 套用屬未來 build / render 階段之決策，屬本批之外；第一版實作（Phase 9-g-d）建議**不**自動套 UTM，由作者於 `url` 欄位自行決定。

---

## §5 與 publishedUrl 之關係（不可預測 Blogger URL）

### 5.1 internal link 之 url 應使用「已發布後回填之真實 URL」

`kind: internal` 之 item 通常指向本站另一篇文章；其 `url` 應為**已發布且已回填 `publishedUrl`** 之真實 URL：

- 對 Blogger 文章：`url` 應為作者於 Blogger 後台複製之正式 URL（已含 `yyyy/mm/`），對應 `.publish.json` 之 `blogger.publishedUrl`
- 對 GitHub Pages 文章：`url` 應為 GitHub Pages 部署後之正式 URL，對應 `.publish.json` 之 `github.publishedUrl`
- 對未來新平台文章：同上原則 — 已發布後之真實 URL

### 5.2 Blogger URL 不可預測（沿用既有禁則）

沿用 `docs/publish-json-schema.md` §5.3 / `docs/fb-sidecar-schema.md` §5.6 / `docs/publish-workflow.md` §13 之 Blogger URL 不可預測原則：

- **作者不得**在 `url` 欄位填入「預期之 Blogger URL」之 placeholder（例：尚未發布之文章不可填 `https://babel-lab.blogspot.com/2026/05/foo.html`，因 `yyyy/mm/` 由 Blogger 平台依**實際發布月份**產生）
- **build / render 不得**預測 / 推算 Blogger URL；不得從 permalink + 當下月份組合產生 internal link 之 url
- 若目標文章尚未發布，作者應暫不加入該 link，待目標發布完成、`publishedUrl` 回填後再加

### 5.3 為何 internal link 不設計成 post-id 引用

可能的替代設計：以 post id 引用（例 `internal: { postId: "20260504-foo" }`），由 build 階段自動解析為 URL。本文件**不採此設計**，理由：

- 增加 build 階段之 post lookup 複雜度
- 對 Blogger 文章而言，post 之 URL 由作者手動回填，仍需配合 `.publish.json` 之 `blogger.publishedUrl`；無法純由 id 推導
- 跨平台時複雜（同一 post 可能於 Blogger 與 GitHub 皆已發布，id 對應之 URL 取哪個？）
- 第一版避免過度工程化（per CLAUDE.md §1）

第一版（Phase 9-g-d）採**作者直接填 URL** 之最直接設計；未來如有自動化需求，屬第二階段（CLAUDE.md §8 / §29）。

### 5.4 internal link 不綁死 Blogger

`kind: internal` 不等於 `platform === "blogger"`。internal 之語意為「**本站任一已發布平台之連結**」，可為：

- `platform: "blogger"` — Blogger 平台之自家文章
- `platform: "github"` — GitHub Pages 平台之自家文章
- `platform: "<新平台 slug>"` — 未來搬家或新增之本站平台

跨平台搬家、未來新增 GitHub Pages 與 Blogger 之外的平台時，`platform` 可自由擴充；本文件 schema 不強制限定 internal 之 platform 取值範圍。

---

## §6 與 affiliate.links 之差異（重述 §2.3 並補語意分界）

`affiliate.links` 與 `relatedLinks` / `otherLinks` 為**兩套獨立機制**，請勿混用。判斷準則：

- **販售 / 商品連結** → `affiliate.links`（自動 `sponsored` rel + 強制 disclosure + GA4 affiliate_click）
- **非販售 / 來源 / 延伸閱讀** → `relatedLinks` / `otherLinks`

例：

```yaml
# 書評文章

book:
  title: "原子習慣"
  isbn: "9789861784755"

affiliate:
  enabled: true
  links:
    - label: "博客來"
      network: "通路王"
      url: "https://affiliate-link-with-tracking..."

relatedLinks:
  - kind: external
    platform: "出版社官網"
    title: "方智出版社《原子習慣》介紹頁"
    url: "https://www.fineart.com.tw/..."
  - kind: internal
    platform: "blogger"
    title: "貝果書屋 - 改寫人生系列 #1"
    url: "https://babel-lab.blogspot.com/2026/03/change-your-life1.html"

otherLinks:
  - kind: external
    platform: "台北市立圖書館"
    title: "書籍館藏頁"
    url: "https://book.tpml.edu.tw/bookDetail/341232"
```

「博客來」走 `affiliate.links`（販售）；出版社官網、圖書館館藏走 `relatedLinks` / `otherLinks`（非販售）。

---

## §7 與 blocks.relatedPosts 之差異（two-track 原則）

承 §2.2 之邊界表，補充落地關注點：

### 7.1 兩機制可同時啟用

同一篇文章可同時：

- 設定 `blocks.relatedPosts: true`（顯示系統自動推薦）
- 設定 `relatedLinks` / `otherLinks` 陣列（顯示作者手動指定）

兩者於文章 body 後段之**排列順序**由 EJS template 決定；本文件不強制。建議順序（屬未來 Phase 9-g-d 之決策範圍）：

1. 作者手動 `relatedLinks`（H2「相關連結」）
2. 作者手動 `otherLinks`（H2「其他連結」）
3. 系統自動 Related Posts（CLAUDE.md §17 之 Related Posts 區塊）

理由：作者主動指定之資源優先於系統自動推薦。

### 7.2 兩機制不互相 fallback

- `relatedLinks` 為空時，**不**自動 fallback 到 `blocks.relatedPosts` 之推薦結果
- `blocks.relatedPosts: false` 時，**不**影響 `relatedLinks` / `otherLinks` 之渲染

兩機制完全獨立；fallback 屬未來決策（屬本文件之外）。

### 7.3 GA4 event 差異

- `blocks.relatedPosts` 之點擊歸 `internal_link_click`（per CLAUDE.md §5）
- `relatedLinks` / `otherLinks` 之點擊：
  - `kind: internal` → `internal_link_click`
  - `kind: external` → 視 platform 決定（YouTube → 可考慮 `external_video_click`；圖書館 / 官方網站 → `external_reference_click`；具體 event name 屬未來決策）

第一版實作建議：兩機制皆採 `internal_link_click` / 通用 external click event；不引入新 GA4 event。屬 Phase 9-g-d 落地時之決策。

---

## §8 預期 Blogger HTML 輸出範例

### 8.1 frontmatter 輸入範例

```yaml
relatedLinks:
  - kind: internal
    platform: "blogger"
    title: "改寫人生：影響個人的15種負面思維#2（不足掛齒的小事）"
    url: "https://babel-lab.blogspot.com/2026/03/change-your-life2.html"

otherLinks:
  - kind: external
    platform: "台北市立圖書館"
    title: "書籍館藏頁"
    url: "https://book.tpml.edu.tw/bookDetail/341232"
  - kind: external
    platform: "Youtube"
    title: "🚩【吳淡如Ｘ鄧惠文】做個內力強大的人，別再讓能量被綁架"
    description: ""
    url: "https://www.youtube.com/xxx"
    order: 1
```

### 8.2 預期渲染後之 Blogger HTML

```html
<section class="lab-related-links">
  <h2>相關連結</h2>
  <ul class="lab-related-links__list">
    <li class="lab-related-links__item lab-related-links__item--internal">
      <a class="lab-related-links__link" href="https://babel-lab.blogspot.com/2026/03/change-your-life2.html">
        <span class="lab-related-links__platform">[blogger]</span>
        <span class="lab-related-links__title">改寫人生：影響個人的15種負面思維#2（不足掛齒的小事）</span>
      </a>
    </li>
  </ul>
</section>

<section class="lab-other-links">
  <h2>其他連結</h2>
  <ul class="lab-other-links__list">
    <li class="lab-other-links__item lab-other-links__item--external">
      <a class="lab-other-links__link" href="https://book.tpml.edu.tw/bookDetail/341232" target="_blank" rel="nofollow noopener">
        <span class="lab-other-links__platform">[台北市立圖書館]</span>
        <span class="lab-other-links__title">書籍館藏頁</span>
      </a>
    </li>
    <li class="lab-other-links__item lab-other-links__item--external">
      <a class="lab-other-links__link" href="https://www.youtube.com/xxx" target="_blank" rel="nofollow noopener">
        <span class="lab-other-links__platform">[Youtube]</span>
        <span class="lab-other-links__title">🚩【吳淡如Ｘ鄧惠文】做個內力強大的人，別再讓能量被綁架</span>
      </a>
    </li>
  </ul>
</section>
```

### 8.3 範例說明

1. 兩個 H2 區塊獨立；任一陣列為空 / 缺漏時對應 `<section>` 不渲染（沿用 CLAUDE.md §17 之 Optional block 原則）
2. internal link **無** `target` / `rel`（per §4）；external link 自動加 `target="_blank" rel="nofollow noopener"`
3. `platform` 以 `[{platform}]` 格式作前綴；具體 markup 由 EJS template 決定（屬 Phase 9-g-d）
4. class 命名沿用 CLAUDE.md §9 之 `lab-` prefix + BEM 規則
5. `description` 非空時可額外渲染為 `<p class="lab-related-links__description">`；具體位置由 template 決定
6. 此處 HTML 為**示意**；真實落地之 markup 由 EJS template 決定，本文件不強制細節

---

## §9 Implementation notes

### 9.1 Phase 9-g 子批進度

| 子批次 | 範圍 | 狀態 |
| --- | --- | --- |
| 9-g-a | related / external links metadata design analysis（純分析） | ✅ completed |
| 9-g-b | schema docs：新增本文件 + 5 個既有 docs cross-link（`publish-bundle.md` / `CLAUDE.md` §3.1 + §16.5 / `migration-from-frontmatter.md` / `content-schema.md` / `future-roadmap.md`） | ✅ completed（commit `258ab9e`） |
| 9-g-c-a | sample / template update analysis（純分析） | ✅ completed |
| 9-g-c-b | 5 個 `content/templates/*.md` 補入 `relatedLinks` / `otherLinks` frontmatter sample | ✅ completed（commit `fbe6597`） |
| 9-g-c-c-a | validate rules + fixtures landing analysis（純分析；推薦方案 A 4 條 critical 規則） | ✅ completed |
| 9-g-c-c | 4 條 warning-only validate 規則 + 4 個 fixtures（per §3.3） | ✅ completed（commit `b05240b`；baseline `0/18/13` → `0/22/17`） |
| 9-g-c-d | docs sync：本文件 §3.3 / §9 + `docs/future-roadmap.md` Phase 9-g row 同步 9-g-c-b / 9-g-c-c landings 與 baseline 更新 | ✅ completed（commit `1c77b96`） |
| 9-g-d-a | Blogger render / copy-helper analysis（純分析） | ✅ completed |
| 9-g-d-b | Blogger post HTML render（`blogger-post-full.ejs` 在 Affiliate Box bottom 與 Hashtag 之間新增 `<aside class="lab-related-links">` / `<aside class="lab-other-links">` 兩個 conditional 區塊）+ SCSS（新增 `src/styles/components/_related-links.scss` + Blogger mirror + `main.scss` import） | ✅ completed（commit `500df12`） |
| 9-g-d-c-a | blogger-copy-helper [13] analysis（純分析） | ✅ completed |
| 9-g-d-c | blogger-copy-helper [13] 區塊（純文字確認清單；mirror [12] book metadata 之 conditional + inline JS + trim-newline pattern） | ✅ completed（commit `f7cd5b9`；含後續 9-g-d-c-fix 修正之 EJS comment delimiter leak） |
| **9-g-d-c-fix** | **修正 commit `f7cd5b9` 之 `blogger-copy-helper.ejs` line 199 comment 內嵌 EJS delimiter 字串**（EJS parser 命中第一個內嵌 delimiter 提早關閉 comment，導致 `trim-newline` 文字漏出於所有 ready posts 之 copy-helper.txt）；移除內嵌 delimiter 字串；不改 [13] 邏輯（diff +1/-1）；build:blogger sanity check **pass**：copy-helper.txt 不再含 `trim-newline` 漏出文字，無意外 [13] 區塊 | ✅ completed（commit `b97c57a`） |
| 9-g-e-a | publish-checklist / workflow sync analysis（純分析） | ✅ completed |
| 9-g-e-b | `blogger-publish-checklist.ejs` 新增「相關連結 / 其他連結內容檢查」conditional 區塊（mirror book-review checklist pattern；4 條 always-show checkbox + 1 條 internal nested conditional checkbox）；**含同類 EJS comment fix inline**（同源於 9-g-d-c-fix 模式；本批 commit 內預先修正）；build:blogger sanity check **pass** | ✅ completed（commit `97e2c56`） |
| 9-g-e-c | docs sync：`docs/checklists/blogger-publish-checklist.md` +1 行 checkbox + `docs/publish-workflow.md` §11 末段「相關連結 / 其他連結補述」（4 cross-link + 4 注意事項 bullets；mirror 9-f-c 書評補述結構）+ §15 表格 2 列 | ✅ completed（commit `3aa8a9a`） |
| 9-g-e-d | docs sync：本文件 §9 全面更新含 9-g-d / 9-g-d-c-fix / 9-g-e 全部 landings 與 commit hashes + `docs/future-roadmap.md` Phase 9-g row 同步；屬 **Phase 9-g-e 系列收尾** | ✅ completed（本批） |
| 9-g-f-a | GitHub render 純讀取分析（確認 SCSS / build pipeline 無需動；推薦插入點 article body 後 / AdSense Bottom 前；包覆 `<div class="lab-container">`） | ✅ completed |
| 9-g-f-b | GitHub article HTML render：`src/views/pages/post-detail.ejs` 在 article body 後 / AdSense Bottom 前新增 `<aside class="lab-related-links">` / `<aside class="lab-other-links">` 兩個 conditional 區塊；mirror Blogger 9-g-d-b pattern；EJS comment 嚴格無 delimiter 字符 inline 預防（per 9-g-d-c-fix 教訓）；不改 SCSS / build script / Blogger 端 | ✅ completed（commit `1bb807f`） |
| 9-g-f-c | docs sync：本文件 §9 + `docs/future-roadmap.md` Phase 9-g row + `docs/phase-9g-completion-report.md` §3 / §4.12 / §5.2 / §8 補入 GitHub render 紀錄；可選 `docs/publish-workflow.md` §11 末段補一行；屬 **Phase 9-g-f 系列收尾** | ✅ completed（本批） |
| 9-g-g（系列；含 a/b/c/d/z 5 子批） | JSON-LD `mentions` / `isPartOf` structured data；BlogPosting schema additive；Blogger / GitHub 兩端 mirror | ✅ completed（pre-plan commit `f5fb400` / isPartOf source commit `70fbf22` / mentions source commit `1d56f8a` / 收尾報告 `docs/phase-9g-g-completion-report.md`）|

當前 validate baseline：**`0 error / 22 warning on 17 post(s)`**（簡稱 `0/22/17`）

baseline 演進：

- Phase 9-g-c-c 前：`0/18/13`
- Phase 9-g-c-c 後：`0/22/17`
- Phase 9-g-c-d 至 9-g-f-c 期間：**baseline 維持 `0/22/17`**（本期間 9-g-d-b / 9-g-d-c / 9-g-d-c-fix / 9-g-e-b / 9-g-f-b 之 EJS template 變更不在 validate scan path；9-g-c-d / 9-g-e-c / 9-g-e-d / 9-g-r / 本批 9-g-f-c 為純 docs；validate 不掃 EJS / SCSS / docs）
- 變動原因：+4 個 validation fixtures（`_test-related-links-*.md`），每 fixture 各觸發 1 條 dedicated warning，無 noise
- 屬 fixture 落地之**預期變動**，**非 regression**（mirror 既有 book / series fixture pattern）

### 9.2 Phase 9-g 後續批次

（截至 Phase 9-g-g-z 收尾；Phase 9-g 系列全數已 landed；本節不再有未啟動批次。Phase 9-g-g 完整收尾紀錄見 `docs/phase-9g-g-completion-report.md`。）

| 子批次 | 範圍 | 狀態 |
| --- | --- | --- |
| Phase 9-g-g（系列；含 a/b/c/d/z 5 子批） | JSON-LD `mentions` / `isPartOf` structured data | ✅ completed（per `docs/phase-9g-g-completion-report.md`）|

### 9.3 不接 normalize-post-output（第一版）

第一版實作（Phase 9-g-d）建議**不**接入 `src/scripts/normalize-post-output.js`：

- relatedLinks / otherLinks 之 fallback / inheritance 邏輯**不複雜**：無 series-level 繼承、無 site-level default、無 sidecar / frontmatter 多源衝突
- 直接於 EJS 讀取 `post.relatedLinks` / `post.otherLinks` 即可（mirror `post.affiliate` / `post.download` 之既有 pattern）
- 自動 `target` / `rel` 套用可於 EJS 內聯處理（mirror `affiliate` 之 `rel="sponsored nofollow noopener noreferrer"` 既有 pattern）

如未來有跨文章 / 跨平台繼承需求，再評估接入 normalize；屬第二階段。

### 9.4 dist baseline / sanity check 紀錄

各子批之 dist 變動範圍（Blogger 端 dist-blogger / GitHub 端 dist）：

- **9-g-b** / **9-g-c-d** / **9-g-e-c** / **9-g-e-d** / **9-g-r** / **9-g-f-c**（本批）：純 docs；dist 完全不變
- **9-g-c-b**：僅 `content/templates/*.md`（templates 不被 `build:*` 掃描，per Phase 8-g-6 紀錄）；dist 不變
- **9-g-c-c**：僅 `src/scripts/validate-content.js` + `content/validation-fixtures/blogger/posts/`（validation-fixtures 目錄不被 `build:*` 掃描，per Phase 8-e-6-b-1 紀錄）；dist 不變
- **9-g-d-b**：Blogger post HTML render + SCSS；對含 `relatedLinks` / `otherLinks` 之 post 之 `post.html` 新增 `<aside class="lab-related-links">` / `<aside class="lab-other-links">` 區塊；對無此兩欄位之既有 ready post，`post.html` 理論上維持 **byte-identical-modulo-builtAt**（mirror Phase 9-f-c-b book metadata 之保守原則）
- **9-g-d-c**：blogger-copy-helper [13] 區塊；對含 `relatedLinks` / `otherLinks` 之 post 之 `copy-helper.txt` 新增 [13] 純文字確認清單；首次 build:blogger 後發現 9-g-d-c 之 EJS comment 內嵌 delimiter 導致 `trim-newline` 漏出（於 9-g-d-c-fix 修正）
- **9-g-d-c-fix**：移除 9-g-d-c 之 EJS comment 內嵌 delimiter 字串；build:blogger sanity check **pass**：對既有無 `relatedLinks` / `otherLinks` 之 ready post，`copy-helper.txt` 不再含 `trim-newline` 漏出文字、不意外輸出 [13] 區塊、達成 byte-identical-modulo-builtAt
- **9-g-e-b**：blogger-publish-checklist 新增「相關連結 / 其他連結內容檢查」conditional 區塊；對含 `relatedLinks` / `otherLinks` 之 post 之 `publish-checklist.txt` 新增該區塊；本批含同類 EJS comment fix（commit 內 inline 修正）；build:blogger sanity check **pass**：對既有無此兩欄位之 ready post，`publish-checklist.txt` 不含 `trim-newline` 漏出、不意外輸出新區塊、達成 byte-identical-modulo-builtAt
- **9-g-f-b**：GitHub post HTML render；`src/views/pages/post-detail.ejs` 在 article body 後 / AdSense Bottom 前新增 `<aside class="lab-related-links">` / `<aside class="lab-other-links">` 兩個 conditional 區塊（包覆 `<div class="lab-container">`）；mirror Blogger 9-g-d-b pattern；EJS comment 嚴格無 delimiter 字符 inline 預防（per 9-g-d-c-fix 教訓）；`npm run build` sanity check **pass**：對既有 2 篇 ready GitHub post（`github-pages-blog-planning` + `portable-blog-system-mvp`）之 `dist/posts/{slug}/index.html` 達成 byte-identical-modulo-builtAt（grep `相關連結` / `其他連結` / `lab-related-links` / `lab-other-links` 皆無命中）；不改 SCSS（已於 9-g-d-b 落地，GitHub 端直接重用） / 不改 build script / 不改 Blogger 端

當前 dist 整體狀態（Blogger + GitHub 兩端）：

- 對既有無 `relatedLinks` / `otherLinks` 之 ready posts：
  - **dist-blogger**：`post.html` / `copy-helper.txt` / `publish-checklist.txt` / `meta.json` 皆 **byte-identical-modulo-builtAt**
  - **dist**（GitHub）：`posts/{slug}/index.html` 達成 **byte-identical-modulo-builtAt**
- 無 leaked text（兩個 EJS comment delimiter bug 皆已於 9-g-d-c-fix / 9-g-e-b 修復；9-g-f-b 採嚴格無 delimiter 字符 inline 預防）
- 無意外 `[13]` 區塊 / 無意外「相關連結 / 其他連結內容檢查」checklist 區塊 / 無意外 `<aside class="lab-related-links">` / `<aside class="lab-other-links">` HTML 區塊
- validate baseline 維持 **`0/22/17`**

**Phase 9-g-g** 屬 JSON-LD 範疇（structured data）；本節 §9.5 紀錄 mentions / isPartOf 之最終設計與 landed 狀態（per Phase 9-g-g-b pre-plan + Phase 9-g-g-c / 9-g-g-d source landings + Phase 9-g-g-z 收尾報告）。

### 9.5 Phase 9-g-g JSON-LD mentions / isPartOf 設計與落地紀錄

per `docs/phase-9g-g-pre-plan.md`（Phase 9-g-g-b；commit `f5fb400`）+ `docs/phase-9g-g-completion-report.md`（Phase 9-g-g-z；本系列收尾報告）：

#### 9.5.1 relatedLinks / otherLinks 作為 JSON-LD mentions source

✅ **已 landed**（Phase 9-g-g-d；commit `1d56f8a`）：`post.relatedLinks` + `post.otherLinks` 兩個 array 已正式作為 BlogPosting JSON-LD 之 `mentions[]` 來源。語義對應：

- schema.org 之 `mentions` 定義為「CreativeWork contains a reference to, but is not necessarily about」
- relatedLinks / otherLinks 屬作者主動策劃之延伸閱讀 / 來源連結；語義精確匹配

#### 9.5.2 第一版 mentions mapping

per Phase 9-g-g-d source 落地（commit `1d56f8a`；兩端 `src/scripts/build-github.js` `buildSeoForPostDetail()` + `src/scripts/build-blogger.js` `buildBloggerJsonLd()` mirror）之實際映射：

| relatedLinks / otherLinks per-item 欄位 | mentions[] item 欄位 |
|---|---|
| `title` | `name`（必填）|
| `url` | `url`（必填）|
| —（不映射）| `@type`：`'WebPage'`（fixed；schema.org base type 或 `CreativeWork` 替代候選）|

**不映射之欄位**：`kind` / `platform` / `description` / `order` / `target` / `rel`（per §3.1 之 8 per-item 欄位中之 6 個）

#### 9.5.3 Pre-filter rule

每個 entry 必須通過以下條件才進 mentions[]：

1. entry 為 plain object（非 null / 非 array）
2. `entry.title` 為 string 且 `trim() !== ''`
3. `entry.url` 為 string 且 `trim() !== ''`

**Empty array 處置**：若 pre-filter 後 mentionsItems 為空，**不輸出** `mentions` 欄位（避免 empty array / null 噪音被 Google 標 invalid）。

#### 9.5.4 明確標註之 scope 限制

| 限制 | 說明 |
|---|---|
| ❌ **不使用 `platform` 推導 specific @type** | platform 為 free-form 字串（"Youtube" / "台北市立圖書館" / "出版社官網" 等）；不映射為 schema.org subType；統一用 `WebPage` base |
| ❌ **不引入 YouTube / Netflix / DVD / magazine specific schema 細分** | VideoObject / MediaObject / Book / Periodical 等 subType 需正確 metadata；本批不臆造 |
| ❌ **不把 relatedLinks schema 接進 normalize-post-output** | per §9.3 既有設計；第一版直接於 build-blogger.js / build-github.js 讀 `post.relatedLinks` / `post.otherLinks` |
| ❌ **不映射 affiliate.links 為 mentions** | affiliate 屬 sponsored 性質；schema.org mentions 為「referenced」；混入會誤導 Google 解讀 |

#### 9.5.5 isPartOf 設計（Phase 9-g-g 同系列處理）

✅ **已 landed**（Phase 9-g-g-c；commit `70fbf22`）：per source 落地：

| isPartOf 子欄位 | 來源 |
|---|---|
| `@type` | `'Blog'`（fixed；schema.org 標準）|
| `@id` | `settings.site.githubSiteUrl` 或 `settings.site.bloggerSiteUrl`（依 post.primaryPlatform）|
| `name` | `settings.site.siteName` |
| `url` | 同 `@id` |
| `inLanguage` | `settings.site.language` |

**第一版只接 site / blog 層級**；不用 book（書評文章不是 PART OF 被評書本；屬語義錯誤）；不用 series（當前 0 ready posts 含 series）；不用 category（WebPageSection 在 schema.org 較少見）。

#### 9.5.6 與 Phase 9-g-g-* 系列子批之關係

| Phase | 範圍 | 狀態 | commit |
|---|---|---|---|
| Phase 9-g-g-a | 純讀取分析（read-only pre-analysis）| ✅ completed | — |
| Phase 9-g-g-b | docs-only pre-plan（含本節 §9.5）| ✅ landed | `f5fb400` |
| Phase 9-g-g-c | source 接入 isPartOf only | ✅ landed | `70fbf22` |
| Phase 9-g-g-d | source 接入 mentions only | ✅ landed | `1d56f8a` |
| Phase 9-g-g-z | completion report + docs sync（含本節狀態更新）| 🔄 本批進行中 | 本批 |

詳細拆批理由與驗證策略見 `docs/phase-9g-g-pre-plan.md` §8 + §9；完整收尾紀錄見 `docs/phase-9g-g-completion-report.md`。

---

## §10 相關文件

### 10.1 上層規範

- `docs/publish-bundle.md` §2.6.1（內容屬性 / 長期不變動之欄位列表）
- `docs/publish-bundle.md` §2.6.4（不可混用原則 / 硬性）
- `docs/publish-json-schema.md`（`.publish.json` 不含 relatedLinks / otherLinks）
- `docs/fb-sidecar-schema.md`（`.fb.md` 不含 relatedLinks / otherLinks）

### 10.2 設計原則來源

- `CLAUDE.md` §3.1（文章資料 frontmatter）
- `CLAUDE.md` §16（連結處理規則 / external / internal / affiliate rel）
- `CLAUDE.md` §17（文章頁基本版型 / Related Posts 為自動推薦區塊）
- `CLAUDE.md` §9（CSS / class 命名規則：`lab-` prefix + BEM）

### 10.3 遷移與檢查表

- `docs/migration-from-frontmatter.md` §4（內容屬性遷移對照表；`relatedLinks` / `otherLinks` 為 8-a 起建議新增之內容屬性欄位）
- `docs/checklists/sidecar-migration-checklist.md`（遷移檢查表已含 `relatedLinks` / `otherLinks` row）

### 10.4 相關 schema

- `docs/book-schema.md`（書籍 / 雜誌 / 來源實體 metadata；與本文件嚴格分離 — book 為「實體」、relatedLinks 為「連結」）
- `docs/series-schema.md`（series 系列文章 metadata；與本文件獨立 — series 為跨文章主題、relatedLinks 為單篇連結清單）

### 10.5 跨 Phase 路線

- `docs/future-roadmap.md`（Phase 9-g 系列進度）

---

（本文件結束）
