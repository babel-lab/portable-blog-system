# 書籍 / 來源實體 Metadata 規格 (Book / Source Entity Metadata Schema)

本文件為「書籍 / 雜誌 / 來源實體」（book）之 metadata 規格。所有讀取、寫入、驗證 `book.*` 欄位之實作皆須以本文件為準。

對應之上層規範詳見：
- `docs/publish-bundle.md` §2.6.1（內容屬性放 `.md` frontmatter 之硬性原則；`book` 屬「型別專屬區塊」之列舉）
- `docs/publish-bundle.md` §2.6.4（內容屬性不得塞入 `.publish.json` / `.fb.md`）
- `docs/publish-json-schema.md`（`book` 不屬 `.publish.json`）
- `docs/fb-sidecar-schema.md`（`book` 不屬 `.fb.md`）
- `CLAUDE.md` §12（書評文章規則之原始 spec；本文件為其延伸與擴充）
- `docs/series-schema.md`（series schema；與 book schema **嚴格分離**，詳見 §2）

本文件之實作落地時機為 **Phase 9-e-c 之後**；Phase 9-e-b 階段僅交付規格文件，**不寫程式、不建立 sample、不修改 template、不接入任何 caller**。

---

## §1 文件目的

### 1.1 book 是「單篇文章所評論 / 引用的內容來源實體」

`book` 區塊描述**該篇文章所評論、引用、介紹之單一書本 / 雜誌 / 來源實體**。例如：

- 書評文章評論一本書 → `book` 描述該書
- 教具下載文章引用某本教材 → `book` 描述該教材
- 雜誌特輯讀後心得 → `book.mediaType: "magazine"` 描述該期雜誌

`book` 屬**內容屬性**（per `docs/publish-bundle.md` §2.6.1）：

- 文章創作時即決定，發布後幾乎不變動
- 與平台無關，Blogger / GitHub Pages / FB 皆共用同一份 `book` metadata
- 屬內容創作層級之來源實體描述

### 1.2 book 不是 post 本身

`book` 描述「文章所評論的對象」，不是「文章自己」。下列為 **post-level 欄位**（與 `book.*` 同層但語意不同）：

| post-level 欄位 | 語意 | 與 book 關係 |
| --- | --- | --- |
| `title` | 文章標題 | 通常含書名；但**不等於** `book.title` |
| `author` | **文章作者**（部落格作者，例：`"Dean"`）| **不等於** `book.author` / `book.authors[]`（書本作者）|
| `date` / `updated` | 文章發布 / 更新日 | **不等於** `book.publishedYear`（書本出版年）|
| `cover` / `coverAlt` | 文章封面（社群分享用）| **不等於** `book.coverImage` / `book.coverAlt`（書本封面）|
| `category` / `tags` | 文章分類 / 標籤 | 與 book 無直接對應關係 |
| `series.*` | 跨文章系列歸類 | 與 book 無直接對應關係（series ≠ book，詳見 §2）|

「文章作者」與「書本作者」之分離，mirror Phase 8-a `contentKind` vs `blogger.type` 之分離原則（避免兩個獨立維度撞名混用）。

### 1.3 book 不是平台發布 / 推廣資料

`book` **不**屬下列範疇：

- ❌ 不是平台發布狀態（與 `.publish.json` `blogger.status` / `github.status` 無關）
- ❌ 不是 URL 推導依據（與 `blogger.publishedUrl` / `github.publishedUrl` 無關）
- ❌ 不是發布時間欄位（與 `publishedAt` 無關；`book.publishedYear` 是書本出版年，不是文章發布時間）
- ❌ 不是 FB 推廣文案（與 `.fb.md` 無關）
- ❌ 不是平台特定 metadata（與 `blogger.permalink` / `github.path` 無關）

由此衍生：`book` 不放 `.publish.json`；亦不放 `.fb.md`。

---

## §2 與其他 schema 的邊界

### 2.1 邊界總表

| Schema | 範疇 | 落點 | 與 book 關係 |
| --- | --- | --- | --- |
| **post frontmatter**（top-level）| 文章本身（title、slug、date、author、category、tags、cover、status 等）| `.md` frontmatter 頂層 | book 為其子區塊；兩者語意獨立 |
| **book**（本文件）| 文章所評論 / 引用之書 / 雜誌 / 來源實體 | `.md` frontmatter `book:` 區塊 | 本文件 |
| **series** | 跨文章系列歸類（例：「貝果書屋共讀系列」之 N 篇文章）| `.md` frontmatter `series:` 區塊 | **嚴格分離**：series 描述「跨文章主題系列」，book 描述「該篇所評之單一書本」；同一篇文章可同時有 series 與 book |
| **`.publish.json`** | Blogger / GitHub 發布輔助資料（canonical、publishedUrl、permalink、bloggerPostId 等）| sidecar 檔 | 完全獨立；`book.*` 不寫入 `.publish.json` |
| **`.fb.md`** | FB 貼文輔助內容（body、hashtags、target、page 等）| sidecar 檔 | 完全獨立；`book.*` 不寫入 `.fb.md` |

### 2.2 book ≠ series

`series` 與 `book` 為**兩個獨立維度**：

- `series` 描述**跨文章**之主題系列（例：「自媒自創 AI 玩轉自媒體共讀」之 52 篇文章）
- `book` 描述**該篇文章**所評之單一書本實體

同一篇文章可同時擁有 `series` 與 `book`：

```yaml
series:
  id: "bagel-bookstore-ai-self-media"
  name: "自媒自創：AI玩轉自媒體的52個商業思維"
  number: 1
book:
  title: "自媒自創：AI玩轉自媒體的52個商業思維"
  authors:
    - displayName: "陳莛蓁"
      role: "author"
```

`book.title` 與 `series.name` 可巧合相同（如上例），但語意層級不同；不可相互推導。

### 2.3 不可混用原則（硬性）

下列為硬性原則：

- `book.*` 欄位 **不得** 塞入 `.publish.json`
- `book.*` 欄位 **不得** 塞入 `.fb.md`
- post-level `author`（文章作者）**不得** 與 `book.author` / `book.authors[]`（書本作者）相互推導
- `book.*` 欄位 **不得** 用於推導 Blogger / FB / GitHub 之發布資料（URL、permalink、tags、hashtags 等）
- `series.*` 與 `book.*` **不得** 相互推導

違反者於 validate 階段列為 warning（實作落地時機為 Phase 9-e-d）。

---

## §3 基本 frontmatter 範例

### 3.1 書評範例（mediaType = "book"，缺省）

```yaml
---
id: "20260504-sample-book-review"
site: "blogger"
contentKind: "book-review"
primaryPlatform: "blogger"

title: "《原子習慣》讀後心得"
slug: "atomic-habits-review"
date: "2026-05-04"
updated: "2026-05-04"
author: "Dean"

category: "book-review"
tags: ["book", "habit", "self-help"]

description: "閱讀《原子習慣》後的整理筆記與三個實踐建議。"

status: "draft"
draft: true

publishTargets:
  blogger:
    enabled: true
    mode: "full"

# ── book 區塊：該篇文章所評論之書 ──
book:
  # mediaType 缺省為 "book"，可不寫
  title: "原子習慣"
  titleEn: "Atomic Habits"
  originalTitle: "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones"
  authors:
    - displayName: "James Clear"
      originalName: "James Clear"
      role: "author"
    - displayName: "蔡世偉"
      localName: "蔡世偉"
      role: "translator"
  publisher: "方智出版社"
  publishedYear: 2019
  isbn: "9789861755267"
  coverImage: ""
  coverAlt: "原子習慣中文版書本封面"
  showBookPhoto: true

affiliate:
  enabled: true
  disclosure: "本文包含聯盟行銷連結。若你透過連結購買，本站可能取得少量回饋。"
  position:
    top: true
    bottom: true
  links: []
---

請在此撰寫書評內容。
```

### 3.2 雜誌特輯範例（mediaType = "magazine"）

```yaml
---
id: "20260504-sample-magazine-review"
site: "blogger"
contentKind: "book-review"
primaryPlatform: "blogger"

title: "《PPaper》2026 年 5 月號讀後筆記"
slug: "ppaper-2026-05-review"
date: "2026-05-04"
updated: "2026-05-04"
author: "Dean"

category: "book-review"
tags: ["magazine", "design"]

description: "PPaper 2026 年 5 月號特輯讀後筆記。"

status: "draft"
draft: true

publishTargets:
  blogger:
    enabled: true
    mode: "full"

# ── book 區塊：mediaType = "magazine" ──
book:
  mediaType: "magazine"
  title: "PPaper"
  issue: "2026 年 5 月號"
  issn: "1991-2080"
  publisher: "包氏國際"
  publishedYear: 2026
  authors:
    - displayName: "包益民"
      localName: "包益民"
      role: "editor"
  coverImage: ""
  coverAlt: "PPaper 2026 年 5 月號雜誌封面"
  showBookPhoto: true
---

請在此撰寫雜誌特輯讀後筆記。
```

---

## §4 欄位字典

### 4.1 總表

`book` 為 `.md` frontmatter 之頂層欄位（與 `title` / `slug` / `category` / `tags` 同層），形式為 object。所有欄位皆 optional；缺省即視為「未指定」，build 階段不得輸出空白區塊（per `CLAUDE.md` §12 既有第 1 / 2 條原則）。

| 欄位 | 型別 | 必填 | 預設值 | 適用 mediaType | 說明 |
| --- | --- | --- | --- | --- | --- |
| `book.mediaType` | string enum | 否 | `"book"` | — | 來源實體型態；列舉值 `"book"` / `"magazine"`；缺省 `"book"` |
| `book.title` | string | 否 | `""` | both | 本地書名（中文）；既有欄位 |
| `book.titleEn` | string | 否 | `""` | both | 英文書名；新欄位；與 `originalTitle` 區別見 §4.4 |
| `book.originalTitle` | string | 否 | `""` | both | 原文書名（語種不限：英 / 日 / 韓 等）；既有欄位 |
| `book.author` | string | 否 | `""` | both | **legacy**：單作者顯示字串；新文章建議改用 `authors[]`（詳見 §6）|
| `book.authors[]` | array of object | 否 | `[]` | both | 結構化作者清單；可多筆；可含 translator / illustrator / editor（詳見 §4.5）|
| `book.authors[].displayName` | string | 否 | `""` | both | 顯示名；fallback chain 起點（詳見 §7）|
| `book.authors[].localName` | string | 否 | `""` | both | 中文 / 譯名 / 本地化名稱 |
| `book.authors[].originalName` | string | 否 | `""` | both | 英文 / 原文名稱 |
| `book.authors[].role` | string enum | 否 | `"author"` | both | 列舉值 `"author"` / `"translator"` / `"illustrator"` / `"editor"` / `"other"` |
| `book.publisher` | string | 否 | `""` | both | 出版社（本地版）；既有欄位 |
| `book.publishedYear` | integer \| null | 否 | `null` | both | 西元出版年（本地版優先）；integer；新欄位 |
| `book.volume` | integer \| null | 否 | `null` | book | 可數位化的集數，用於排序 / index；遇「上 / 中 / 下」留 `null`，僅填 `volumeLabel`；新欄位 |
| `book.volumeLabel` | string | 否 | `""` | book | 顯示用集數字串：`"上"` / `"中"` / `"下"` / `"第 2 集"` / `"Vol.2"`；可獨立於 `volume` 存在；新欄位 |
| `book.issue` | string | 否 | `""` | magazine | 期別**顯示字串**：`"2026 年 5 月號"` / `"第 123 期"` / `"Vol.2 No.3"`；新欄位 |
| `book.isbn` | string | 否 | `""` | book | ISBN-10 或 ISBN-13；既有欄位 |
| `book.issn` | string | 否 | `""` | magazine | ISSN；新欄位；mirror `isbn` 命名 |
| `book.coverImage` | string | 否 | `""` | both | 書本 / 雜誌封面圖 URL；既有欄位 |
| `book.coverAlt` | string | 否 | `""` | both | 封面圖 alt 文字；既有欄位 |
| `book.showBookPhoto` | boolean | 否 | `true` | both | 是否輸出書本 / 雜誌照片區塊；既有欄位；雜誌亦適用（不 rename）|

### 4.2 `book.mediaType`

列舉值（嚴格）：

- `"book"`：書本（含教材、繪本、漫畫單行本等所有 ISBN 體系下之單本出版品）；**缺省值**
- `"magazine"`：雜誌（含期刊、定期出版品；ISSN 體系）

若未宣告 `book.mediaType`，視為 `"book"`。舊文章不需補欄位。

未來若需支援其他媒介（電子書平台限定 / podcast / 線上課程 / 影音），由獨立 Phase 評估擴充列舉值。

### 4.3 `book.title`

本地書名（通常為中文版書名）。為**顯示主標**之來源。

`book.title` 與文章 top-level `title` 之關係：

- 文章 `title` 是文章標題（例：「《原子習慣》讀後心得」），通常**含**書名但不等於書名
- `book.title` 是書本本身的書名（例：「原子習慣」）
- 兩者**不可相互推導**

### 4.4 `book.titleEn` 與 `book.originalTitle`

兩者皆描述「非本地版」書名，但語意層級不同：

| 欄位 | 語意 | 範例 |
| --- | --- | --- |
| `book.originalTitle` | **原文書名**（語種不限：日 / 韓 / 法 / 德 等皆可）| `"嫌われる勇気"` / `"Atomic Habits: An Easy & Proven Way..."` |
| `book.titleEn` | **英文書名**（無論原文是不是英文）| `"The Courage to Be Disliked"` / `"Atomic Habits"` |

範例：

- 原文是日文之書：`originalTitle: "嫌われる勇気"`、`titleEn: "The Courage to Be Disliked"`、`title: "被討厭的勇氣"`
- 原文即英文之書：`originalTitle: "Atomic Habits: An Easy..."`、`titleEn: "Atomic Habits"`（簡稱）、`title: "原子習慣"`

兩欄獨立填寫；若無英文譯名，`titleEn` 留空即可（per CLAUDE.md §22「不輸出空白區塊」原則）。

### 4.5 `book.authors[]`

結構化作者清單。為陣列以支援多作者與多角色（譯者 / 繪者 / 編者）。

每筆 author 物件包含 4 個欄位：

```yaml
authors:
  - displayName: ""    # 顯示名；fallback chain 起點
    localName: ""      # 中文 / 譯名 / 本地化
    originalName: ""   # 英文 / 原文
    role: "author"     # author | translator | illustrator | editor | other
```

`role` 列舉值（嚴格）：

- `"author"`：作者（缺省值）
- `"translator"`：譯者
- `"illustrator"`：繪者 / 插畫家
- `"editor"`：編者（雜誌主編、選集編者）
- `"other"`：其他（攝影、企劃、監修等）；rare case 使用

`displayName` 之 fallback chain 詳見 §7。

### 4.6 `book.publishedYear`

integer 型別（不是 string）。例：`2019`、`2026`。

為書本出版年（本地版優先；無本地版則填原文版年份）。**不要**填月日；若需細粒度發布日期，由獨立 Phase 評估擴充欄位。

與文章 top-level `date`（文章發布日）為兩個獨立維度。

### 4.7 `book.volume` 與 `book.volumeLabel`

兩欄並存以支援兩種集數寫法：

| 場景 | `book.volume` | `book.volumeLabel` |
| --- | --- | --- |
| 數字集數（例：第 2 集）| `2` | `"第 2 集"` 或 `"Vol.2"` |
| 上 / 中 / 下 | `null` | `"上"` / `"中"` / `"下"` |
| 純前傳 / 番外篇 | `null` | `"前傳"` / `"番外篇"` |

`book.volume` 為 integer（可排序 / 可 index）；`book.volumeLabel` 為顯示用字串。兩欄獨立填寫；可單獨存在；可同時存在（例：volume=2、volumeLabel="第 2 集"）。

僅 `mediaType: "book"` 適用；`mediaType: "magazine"` 之集數請改用 `book.issue`。

### 4.8 `book.issue`

期別**顯示字串**。保留靈活性接受異質寫法（中文期號 / 月號 / Vol.+No. 等）：

- `"2026 年 5 月號"`
- `"第 123 期"`
- `"Vol.2 No.3"`
- `"2026 春季號"`

不採 `issueNumber: integer` 之純數位設計，因雜誌期別命名多樣，難以一律數位化（例：「2026 春季號」無對應 integer）。

僅 `mediaType: "magazine"` 適用。

### 4.9 `book.isbn` 與 `book.issn`

| 欄位 | 體系 | 適用 mediaType | 格式 |
| --- | --- | --- | --- |
| `book.isbn` | ISBN（國際標準書號）| `"book"` | ISBN-10 或 ISBN-13；可含或不含連字號 |
| `book.issn` | ISSN（國際標準期刊號）| `"magazine"` | ISSN 8 碼；可含連字號 |

兩欄獨立；不可混用。若雜誌特輯亦有 ISBN（特殊情形），優先填 `book.issn`。

### 4.10 `book.coverImage` / `book.coverAlt` / `book.showBookPhoto`

既有欄位，不動：

- `book.coverImage`：書本 / 雜誌封面圖 URL；外部圖床（Blogger / Google Drive / 其他）皆可
- `book.coverAlt`：alt 文字；無障礙與 SEO 用
- `book.showBookPhoto`：boolean；缺省 `true`；`false` 時 build 不輸出書本照片區塊（即使 `coverImage` 存在）

雜誌之封面亦由 `coverImage` 提供；欄位名雖為 `showBookPhoto`，亦適用雜誌（per 決策：不為命名 rename 而破壞 additive 原則）。

---

## §5 mediaType 規則

### 5.1 缺省值

`book.mediaType` 缺省為 `"book"`。

- 若文章未宣告 `book.mediaType` → 視為 `"book"`
- 既有所有書評文章不需補 `mediaType: "book"` 欄位（前向相容）
- 僅雜誌特輯需顯式宣告 `mediaType: "magazine"`

### 5.2 各 mediaType 適用欄位

| mediaType | 專屬欄位 | 共用欄位 |
| --- | --- | --- |
| `"book"` | `isbn` / `volume` / `volumeLabel` | `title` / `titleEn` / `originalTitle` / `publisher` / `publishedYear` / `authors[]` / `author`（legacy）/ `coverImage` / `coverAlt` / `showBookPhoto` |
| `"magazine"` | `issn` / `issue` | 同上（共用欄位完全一致）|

### 5.3 mediaType 與欄位之邊界

- `"book"` 不應填 `issn` / `issue`（validate warning，Phase 9-e-d）
- `"magazine"` 不應填 `isbn` / `volume` / `volumeLabel`（validate warning，Phase 9-e-d；ISBN 特殊雜誌情形除外）
- 違反者於 build 階段 **不會** 阻擋；僅 validate warning 提示

### 5.4 未來擴充

若未來新增第三種 mediaType（例：podcast / online-course / ebook-platform-exclusive），由獨立 Phase 評估：

- 新增列舉值
- 新增 mediaType 專屬欄位（mirror `isbn` / `issn` 之命名模式）
- 不破壞既有 `"book"` / `"magazine"` 之欄位映射

---

## §6 author legacy handling

### 6.1 legacy `book.author` 之定位

`book.author` 為 **legacy simple string** 欄位（既有 CLAUDE.md §12 spec 之原始欄位）。其性質：

- 單作者顯示字串
- 不結構化，不分本地名 / 原文名
- 不支援多作者
- 仍受支援，不刪除

### 6.2 新文章建議

- 新文章建議使用 `book.authors[]`（結構化）
- 舊文章可暫時保留 `book.author`（無需主動遷移）
- 兩者**同時存在時，`book.authors[]` 勝出**（沿用 publish-bundle §3.1「較精細之資料勝較粗略之資料」精神）

### 6.3 不標 deprecated

- 本期（Phase 9-e）**不標** `book.author` 為 deprecated
- 不於 validate 階段加入 `book-author-uses-legacy-string` warning
- 不於 CLAUDE.md §12 加 deprecated 標註

### 6.4 不自動解析多作者字串

`book.author` 為單一字串，**不**會被解析為多作者（即使含逗號 / 頓號 / 分號）：

```yaml
# ❌ 錯誤：以下不會被解析為兩作者
book:
  author: "James Clear, 蔡世偉"

# ✅ 正確：多作者請用 authors[]
book:
  authors:
    - displayName: "James Clear"
      role: "author"
    - displayName: "蔡世偉"
      role: "translator"
```

若需多作者，**必須**改用 `book.authors[]`。

### 6.5 未來退場路徑（記錄供未來參考；本期不執行）

| 階段 | 行為 |
| --- | --- |
| 本期 9-e | 並存；不警告；docs 標 informational |
| 未來 Phase 8-h+ 候選 | 評估升級為 warning-only：`book-author-uses-legacy-string`（warning，僅 ready+published）|
| 更晚 Phase | 若使用率歸零，評估完全退場 `book.author` 欄位（屬破壞性變更）|

退場時機與其他 legacy fallback（per `docs/publish-bundle.md` §7.7 / `docs/phase-8g-completion-report.md` §3.6.5 / §3.7.5）同批評估。

---

## §7 `authors[]` fallback chain

第 N 位作者之顯示名解析順序（自上而下；前者非空字串時停止）：

```
1. authors[N].displayName
2. authors[N].localName
3. authors[N].originalName
4. legacy book.author              ← 僅當 N === 0 時適用
5. ""（空字串 → 不輸出該作者區塊）
```

### 7.1 適用範圍

- 第 0 位作者：完整 5 步 fallback chain（含 legacy `book.author`）
- 第 1 位以後（N ≥ 1）：跳過第 4 步，僅 4 步 fallback chain（不回頭抓 legacy `book.author`）

### 7.2 範例

範例 1：完整 `authors[]`

```yaml
book:
  authors:
    - displayName: "James Clear"
      localName: ""
      originalName: "James Clear"
      role: "author"
# 解析結果：第 0 位顯示為 "James Clear"（hit step 1）
```

範例 2：僅有 `localName`

```yaml
book:
  authors:
    - displayName: ""
      localName: "蔡世偉"
      originalName: ""
      role: "translator"
# 解析結果：第 0 位顯示為 "蔡世偉"（hit step 2）
```

範例 3：legacy 與 authors[] 並存

```yaml
book:
  author: "James Clear"
  authors:
    - displayName: "詹姆斯·克利爾"
      role: "author"
# 解析結果：第 0 位顯示為 "詹姆斯·克利爾"（authors[] 勝出，hit step 1）
# legacy book.author 之 "James Clear" 不被讀取
```

範例 4：僅 legacy `book.author`

```yaml
book:
  author: "James Clear"
# 解析結果：第 0 位顯示為 "James Clear"（hit step 4，legacy fallback）
```

範例 5：全空 → 不輸出

```yaml
book:
  authors:
    - displayName: ""
      localName: ""
      originalName: ""
      role: "author"
# 解析結果：第 0 位 hit step 5，不輸出該作者區塊
```

### 7.3 role fallback

`authors[N].role` 之 fallback：

```
authors[N].role → "author"
```

僅 1 步 fallback；缺省為 `"author"`。

### 7.4 fallback chain 之實作落地時機

本節 fallback chain 為**規格定義**；實作落地時機為 Phase 9-e-d 之後（normalize-book-authors helper 可選；無 caller 為 helper-first 模式）。本期僅 docs 規格化。

---

## §8 設計原則

### 8.1 additive only

- 所有新欄位皆 additive；不刪除既有 `book.*` 欄位
- 不改既有欄位之型別 / 預設值 / 語意
- 不破壞 `.publish.json` / `.fb.md` schema
- 不新增 `content/settings/books.json`（per Phase 9-e-a 決策 4；本期不開）

### 8.2 all fields optional

- 所有 `book.*` 欄位皆 optional
- 缺省值或空字串 / null 視同未提供
- `book` 區塊本身亦 optional（非書評類文章可完全省略 `book:` 區塊）

### 8.3 不輸出空白區塊

沿用 `CLAUDE.md` §12 第 1 / 2 條既有原則：

- 若 `book.coverImage` 為空 → 不輸出書本照片區塊
- 若 `book.authors[]` 為空且 `book.author` 為空 → 不輸出作者區塊
- 若 `book.publisher` 為空 → 不輸出出版社區塊
- 若 `book.isbn` / `book.issn` 為空 → 不輸出 ISBN / ISSN 區塊
- 其他欄位以此類推

### 8.4 不推導 Blogger / FB / GitHub 發布資料

- `book.*` **不**用於推導 Blogger permalink / publishedUrl
- `book.*` **不**用於推導 GitHub path / publishedUrl
- `book.*` **不**用於推導 FB hashtags / tags（FB hashtags 由 `series.hashtags` / `promotion.facebook.hashtags` / `promotion.facebook.defaultHashtags` fallback chain 處理；book 不參與）
- `book.*` **不**用於推導 Blogger `tags`（per `docs/series-schema.md` §22；Blogger tags 由 `post.tags` → `series.tags` → `[]` fallback chain 處理；book 不參與）

### 8.5 不與 series schema 混用

- `series.*` 與 `book.*` **不**相互推導
- `series.name` 與 `book.title` 可巧合相同；但不可一方推導另一方
- `series.hashtags` 與 `book.*` 完全獨立
- 同一篇文章可同時擁有 `series` 與 `book`（per §2.2 範例）

---

## §9 未來可能擴充但本期不做

下列為已識別但**本期 9-e 不做**之擴充方向；列入紀錄供未來 Phase 評估：

| 候選 | 描述 | 觸發條件 |
| --- | --- | --- |
| `content/settings/books.json` | 跨文章共用之書本實體資料庫；mirror `series.json` 模式 | 同一本書被多篇文章引用，或需要跨文章書籍資料一致性 |
| 書籍索引頁 | 站內自動生成之書籍列表頁 / 書籍詳細頁 | 開了 `content/settings/books.json` 之後 |
| 作者索引頁 | 站內自動生成之作者列表頁 / 作者詳細頁 | 需要跨文章作者導覽（例：「該作者之其他書評」）|
| Structured data（JSON-LD）| 於 GitHub 站輸出 `Book` / `Periodical` / `Person` JSON-LD（SEO）| Phase 5 SEO / JSON-LD 子議題之延伸；屬 customer-facing 輸出，per `docs/future-roadmap.md` §5.2 排除原則之保守路線 |
| `book.author` legacy warning | 升級為 warning-only validate 規則 `book-author-uses-legacy-string` | Phase 8-h+ 相容層退場批次；與其他 legacy fallback 同批評估 |
| book schema 進階 validation rules | 例：ISBN 格式檢查、ISSN 8 碼檢查、`publishedYear` 區間檢查（皆未落地）；`authors[].role` 列舉值嚴格檢查**已於 Phase 9-e-d-c 落地**（詳見 §11.2 rule 6）| 視作者使用模式與 false-positive 風險評估後決定 |
| 3 條經評估不落地之 rules（`book-isbn-with-magazine-mediatype` / `book-volume-label-empty-with-volume-number` / `book-author-and-authors-both-present`）| 屬與 docs spec 衝突或誤觸風險高之候選；詳見 §11.5 deferred rules | Phase 9-e-d-a 評估後 9-e-d 系列不落地；未來如政策調整可再評估 |
| `book.publishedDate`（完整日期）| `YYYY-MM-DD` 或 `YYYY-MM` | 書評類文章通常不需細粒度日期；雜誌或可受益（已可由 `book.issue` 字串攜帶）|
| `book.volumeLabelEn` | 英文集數標籤 | 若未來確有國際版輸出需求 |
| `book.subtitle` | 書本副標 | 若作者使用率高且 `title` 不足表達 |
| 第三種 mediaType（podcast / course / ebook-platform-exclusive 等）| 列舉值擴充 | 視作者實際引用需求 |

上述候選**不**列入 Phase 9-e 之 9-e-c / 9-e-d / 9-e-e 子批；屬未來 Phase 評估範圍。

---

## §10 Phase 9-e-b 落地紀錄

### 10.1 本批範圍

- **新增**：本文件（`docs/book-schema.md`）
- **可選修改**：
  - `docs/content-schema.md`：新增 See also 一行 → 本文件
  - `CLAUDE.md` §12：新增 See also 一行 → 本文件（不改 §12 主體規格）
- **不修改**：
  - 任何 source code（`src/scripts/*.js` / `src/views/**/*.ejs` / `src/styles/**/*.scss`）
  - 任何 sample / template（`content/blogger/posts/*.md` / `content/templates/*.md`）
  - 任何 `.publish.json` / `.fb.md` schema
  - `content/settings/*.json`（不新增 `books.json`，per Phase 9-e-a 決策 4）
  - `package.json` scripts

### 10.2 對 dist / build / validate 之影響

| 項目 | 影響 |
| --- | --- |
| `dist/` | ❌ 不變（純 docs；不被 build:github 掃描）|
| `dist-blogger/` | ❌ 不變（純 docs；不被 build:blogger 掃描）|
| `dist-promotion/` | ❌ 不變（純 docs；不被 build:promotion 掃描）|
| `npm run validate:content` baseline | ❌ 不變（仍 `0 error / 11 warning on 6 post(s)`；docs 不在 validate scan path）|
| `npm run build:*` | ❌ 不需執行（純 docs 不影響任何 build 產物）|

### 10.3 後續批次

- Phase 9-e-c：sample / template 補強（依本文件 §3 範例落地至 `content/blogger/posts/20260504-sample-book-review.md` 與新增 `content/templates/blogger-magazine-review-template.md`）
- Phase 9-e-d：validate warning / helper 跟進（依本文件 §5.3 / §6.5 / §9 之 validation rules 候選逐條落地）
- Phase 9-e-e：Phase 9-e 收尾 + roadmap 同步

各子批之預期修改檔案、dist 影響、validate baseline 影響詳見 Phase 9-e-a 分析回報之 F 段。

---

## §11 已落地之 validate rules（Phase 9-e-d 系列）

### 11.1 範圍與性質

於 Phase 9-e-d-b（commit `95437a3`）與 Phase 9-e-d-c（commit `4f37cbc`），共 **7 條 warning-only validate rules** 落地於 `src/scripts/validate-content.js`。

- **全部 warning-only**：不阻擋 `npm run validate:content` 之 exit code（warning-only → exit 0）
- **全部不阻擋 build**：與 `build:github` / `build:blogger` / `build:promotion` pipeline 無關（validate-content 為純檢查工具）
- **全部不改 dist**：不寫入 `dist/` / `dist-blogger/` / `dist-promotion/` / `dist-reports/`
- **作用範圍**：所有規則嚴格 **ready / published only**（draft / archived 由 `load-posts` 過濾不進）
- **前置 guard**：所有規則共用 `if (post.book && typeof post.book === 'object' && !Array.isArray(post.book))` — `book` 區塊不存在或非 plain object 時全部不觸發

### 11.2 規則清單

| # | rule type | severity | 落地 commit | trigger condition |
| --- | --- | --- | --- | --- |
| 1 | `book-mediatype-invalid` | warning | `95437a3` (9-e-d-b) | `book.mediaType` 存在且不在 `{"book","magazine"}` |
| 2 | `book-issue-without-magazine-mediatype` | warning | `95437a3` (9-e-d-b) | `book.issue` 為非空字串且 effective mediaType !== `"magazine"`（mediaType 缺省為 `"book"`）|
| 3 | `book-issn-without-magazine-mediatype` | warning | `95437a3` (9-e-d-b) | `book.issn` 為非空字串且 effective mediaType !== `"magazine"` |
| 4 | `book-volume-invalid-type` | warning | `4f37cbc` (9-e-d-c) | `book.volume` 存在且非 integer / 非 null |
| 5 | `book-published-year-invalid-type` | warning | `4f37cbc` (9-e-d-c) | `book.publishedYear` 存在且非 integer / 非 null |
| 6 | `book-authors-invalid-role` | warning | `4f37cbc` (9-e-d-c) | `book.authors[N].role` 存在且不在 `{author, translator, illustrator, editor, other}`；`role === undefined` 不觸發（缺省為 `"author"`）|
| 7 | `book-authors-entry-empty` | warning | `4f37cbc` (9-e-d-c) | `book.authors[N]` 之 `displayName` / `localName` / `originalName` 三欄全空；entry 0 額外加 legacy `book.author` fallback 守門（per §7.1）|

### 11.3 對應 validation fixtures

Phase 9-e-d-d-b（commit `63aa497`）落地 **7 個 fixtures** 於 `content/validation-fixtures/blogger/posts/`，每檔嚴格只觸發 1 條指定 book schema warning：

| fixture 路徑 | 對應規則 |
| --- | --- |
| `content/validation-fixtures/blogger/posts/_test-book-mediatype-invalid.md` | `book-mediatype-invalid` |
| `content/validation-fixtures/blogger/posts/_test-book-issue-without-magazine.md` | `book-issue-without-magazine-mediatype` |
| `content/validation-fixtures/blogger/posts/_test-book-issn-without-magazine.md` | `book-issn-without-magazine-mediatype` |
| `content/validation-fixtures/blogger/posts/_test-book-volume-invalid-type.md` | `book-volume-invalid-type` |
| `content/validation-fixtures/blogger/posts/_test-book-published-year-invalid-type.md` | `book-published-year-invalid-type` |
| `content/validation-fixtures/blogger/posts/_test-book-authors-invalid-role.md` | `book-authors-invalid-role` |
| `content/validation-fixtures/blogger/posts/_test-book-authors-entry-empty.md` | `book-authors-entry-empty` |

✅ **這 7 個新增 warning 皆來自 book schema validation fixtures，每檔 fixture 嚴格只觸發 1 條指定 warning**（per Phase 9-e-d-d-b 回報 C 段對照表驗證）。

### 11.4 validate baseline 變動紀錄

| 階段 | error | warning | post 數 |
| --- | --- | --- | --- |
| Phase 9-e-d-c 收尾後（fixture 落地前）| 0 | 11 | 6 |
| Phase 9-e-d-d-b 收尾後（本系列 fixture 落地後）| 0 | **18** | **13** |
| **變動** | 0 | **+7 warnings** | **+7 posts** |

**性質**：✅ **預期變動，非 regression**。每 fixture 觸發 1 條 book warning + 計入 `byPath.size`；既有 6 篇 github fixture 之 11 條 warning 完全 byte-identical（mirror Phase 8-g-12-c / 8-g-2-d-e-c 之 fixture 落地推 baseline 模式）。

### 11.5 deferred rules（評估後 9-e-d 系列不落地）

於 Phase 9-e-d-a 分析後評估為**與 docs spec 衝突或誤觸風險高**，依 Phase 9-e-d-b Q1 決策不落地：

| 候選 rule | 不落地理由 |
| --- | --- |
| `book-isbn-with-magazine-mediatype` | §4.9 明文「特殊雜誌情形除外」（bookazine / 特刊常見同時有 ISBN）；warning 會與 docs spec 之 carve-out 衝突 |
| `book-volume-label-empty-with-volume-number` | §4.7 明文「兩欄獨立填寫；可單獨存在」；warning 會與 docs spec 直接衝突 |
| `book-author-and-authors-both-present` | §6.2 之並存策略明確允許兩者共存（`authors[]` 勝出）；warning 會與 docs spec 直接衝突；Phase 9-e-a 決策 2 已明確「不標 deprecated、不警告」|

上述 3 條保留於 §9 future candidate 紀錄；未來如政策調整可再評估。

### 11.6 helpers / constants（inline at validate-content.js）

於 Phase 9-e-d-b 與 9-e-d-c 共新增 2 組常數 + 4 個 inline helpers，全部 inline 於 `src/scripts/validate-content.js`（per Phase 9-e-d-b Q2 決策；不抽 helper 模組；不新檔；不新建 `normalize-book-authors.js`）：

| 項目 | 落地批 | 用途 |
| --- | --- | --- |
| `VALID_BOOK_MEDIA_TYPE` (Set) | 9-e-d-b | mediaType 列舉值 |
| `VALID_BOOK_AUTHOR_ROLE` (Set) | 9-e-d-c | `authors[].role` 列舉值 |
| `isNonEmptyString(value)` | 9-e-d-b | non-empty trimmed string 守門 |
| `getBookMediaType(book)` | 9-e-d-b | effective mediaType（缺省 `"book"`）|
| `isIntegerOrNull(value)` | 9-e-d-c | integer / null 型別檢查 |
| `hasAnyAuthorName(authorEntry)` | 9-e-d-c | `authors[]` entry 名稱欄 OR 檢查 |

### 11.7 不接 normalize-post-output / build pipeline

- 7 條 validate rules **純** validate 內部；**不**接 `src/scripts/normalize-post-output.js`
- **不**新建 `src/scripts/normalize-book-authors.js`（per Phase 9-e-d-b Q2 決策）
- **不**新建 `content/settings/books.json`（per Phase 9-e-a 決策 4）
- 所有 `book.*` 之 fallback chain（per §7）為 docs 規格定義；實作落地待未來如 customer-facing 輸出接入時再評估

---

（本文件結束）
