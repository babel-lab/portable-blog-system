# 舊 frontmatter 遷移到 publish bundle 三檔結構

本文件為 Phase 8-a 之遷移指引文件。所有由 Phase 1-7 既有 `.md` frontmatter 結構遷移至 Phase 8 引入之 publish bundle 三檔（`.md` / `.publish.json` / `.fb.md`）之手動操作步驟、欄位對照、原則性規範，皆以本文件為準。

對應之上層規範詳見 `docs/publish-bundle.md`、`docs/publish-json-schema.md`、`docs/fb-sidecar-schema.md`。

---

## §1 文件目的

### 1.1 範圍

本文件用於處理「舊 frontmatter / 舊文章資料」如何遷移至新 publish bundle 三檔結構：

1. `.md`（內容本體與內容屬性）
2. `.publish.json`（跨平台發布回填資料）
3. `.fb.md`（Facebook 推廣文案）

涵蓋之來源資料：

- Phase 1-7 既有 `.md` frontmatter 中之欄位
- 既有 Blogger 平台已發布之文章（手動重貼至本系統）
- 舊版各種發布資料記錄（若有）

### 1.2 手動遷移為主，不開發自動匯入工具

舊 Blogger 貼文之內容遷移採**手動重貼**方式：作者自 Blogger 後台或既有備份取得文章內容，貼回本專案 `.md` 檔，並依本文件指引建立對應之 `.publish.json` 與 `.fb.md`。

**Phase 8 不開發任何自動匯入工具**，亦不抓取 Blogger API、不爬 RSS、不解析既有 Blogger 主題 XML。理由：

- 第一版避免過度工程化（CLAUDE.md §1）
- 舊文章數量有限，手動重貼可逐篇審視內容、補欄位、確認連結
- 自動工具引入後維護成本高，且第一版重點在架構釐清而非搬遷效率

---

## §2 遷移後的三檔結構

### 2.1 posts 路徑

```
content/{site}/posts/{slug}.md
content/{site}/posts/{slug}.publish.json
content/{site}/posts/{slug}.fb.md
```

### 2.2 pages 路徑

```
content/{site}/pages/{slug}.md
content/{site}/pages/{slug}.publish.json
content/{site}/pages/{slug}.fb.md
```

`{site}` 為 `github` 或 `blogger`，與 `docs/publish-bundle.md` §1.2 規則一致。

### 2.3 Page 採完整三檔，不簡化

Page 採用與 post 完全相同之三檔組合，**不另設簡化版**。Page 不因「於 Blogger 後台被歸為網頁」而失去任何 metadata 能力。詳見 `docs/publish-bundle.md` §2.5。

---

## §3 `type` → `contentKind` 改名規則

### 3.1 改名原則

1. 舊 frontmatter 之 `type` 欄位代表內容型態（如 `post` / `tech-note` / `book-review` / `download` / `comic` / `life-note`）
2. 新架構中此欄位**改名為 `contentKind`**，列舉值另加 `page`
3. `contentKind` 放在 `.md` frontmatter
4. `blogger.type` 放在 `.publish.json` 之 `blogger` 區塊
5. **兩者不可混用**：`contentKind` 不得寫入 `.publish.json`、`blogger.type` 不得寫入 `.md` frontmatter

詳細規範見 `docs/publish-bundle.md` §2.4 與 `docs/publish-json-schema.md` §5.6。

### 3.2 改名範例

#### 3.2.1 一般文章 / 書評

舊 frontmatter：

```yaml
type: book-review
```

新結構：

```yaml
# .md frontmatter
contentKind: book-review
```

```json
// .publish.json（示意，實際 JSON 不含註解）
{
  "blogger": {
    "type": "post"
  }
}
```

語意：內容是書評，發到 Blogger「文章」區。

#### 3.2.2 Page 範例

新結構（無對應舊 frontmatter，因 Phase 1-7 未明確處理 Page）：

```yaml
# .md frontmatter
contentKind: page
```

```json
// .publish.json（示意）
{
  "blogger": {
    "type": "page"
  }
}
```

語意：固定頁（如 About / 工具目錄 / 下載索引頁），發到 Blogger「網頁」區。

---

## §4 舊 frontmatter → `.md` frontmatter 對照

下表列出**內容屬性類**欄位之遷移對照。內容屬性放 `.md` frontmatter，**不放 `.publish.json`**。

| 舊欄位 | 新位置（`.md` frontmatter） | 說明 |
| --- | --- | --- |
| `title` | `title` | 名稱不變 |
| `slug` | `slug` | 名稱不變；同時用於三檔檔名前綴一致性 |
| `type` | **`contentKind`** | **改名**。舊值（如 `book-review`）直接沿用；新增 `page` 為 8-a 起列舉值 |
| `description` | `description` | 名稱不變 |
| `tags` | `tags` | 名稱不變 |
| `category` | `category` | 名稱不變 |
| `cover` | `cover` | 名稱不變；可選，部分內容（如四格漫畫）可無封面 |
| `draft` | `draft` | 名稱不變；與 `status` 並存（沿用 CLAUDE.md §23） |
| `series` | `series` | **8-a 起建議新增**；若舊資料無此欄位，可留空或省略 |
| `quote` | `quote` | **8-a 起建議新增**；若舊資料無金句，可留空或省略 |
| `relatedLinks` | `relatedLinks` | **8-a 起建議新增**；若舊資料無相關連結，可留空 |
| `otherLinks` | `otherLinks` | **8-a 起建議新增**；若舊資料無其他連結，可留空 |

### 4.1 標註

1. **`type` 改為 `contentKind`**（§3）
2. `series` / `quote` / `relatedLinks` / `otherLinks` 為 8-a 起建議新增之內容屬性欄位，舊資料可能完全沒有；遷移時可逐篇補上或留空，不阻擋遷移完成
3. 上述欄位皆放 `.md` frontmatter，**不放 `.publish.json`**

具體欄位字典（型別、選填性、巢狀結構）留待後續 content-schema 文件批次定義；本文件僅提供遷移對照。

---

## §5 舊 frontmatter / 舊發布欄位 → `.publish.json` 對照

下表列出**發布狀態類**欄位之遷移對照。平台發布資料放 `.publish.json`，**不放 `.md` frontmatter**。

舊欄位名稱於 Phase 1-7 階段未完全統一，下表以「可能來源欄位」方式描述；若舊資料無對應欄位，遷移時直接以新位置之預設值（空字串或 enum 預設）填入，**不假設舊資料一定存在**。

| 舊欄位（可能來源） | 新位置（`.publish.json`） | 說明 |
| --- | --- | --- |
| `publishedUrl` / `blogger.publishedUrl` | `blogger.publishedUrl` | Blogger 實際發布後回填的**唯一真相**；發布前不得預測（§5.1） |
| `publishedAt` / `blogger.publishedAt` | `blogger.publishedAt` | ISO 8601 發布時間；空字串時 `publishYear` / `publishMonth` 亦留空 |
| `canonical` | `canonical.url` + `canonical.source` | 拆為兩欄位：URL 與來源平台（`auto` / `github` / `blogger` / `manual`） |
| `bloggerPostId` / `blogger.id` | `blogger.bloggerPostId` | Blogger 後台之文章或網頁 ID |
| `blogger.status` / 平台層 `status` | `blogger.status` | 平台層 status，與 `.md` frontmatter 文件層 `status` 為兩層級（詳見 `docs/publish-json-schema.md` §10.2） |
| `github.enabled` / `publishTargets.github.enabled` | （目前 `.publish.json` schema 未含此欄位） | 8-a 階段不大幅新增；若舊文章 frontmatter 帶此欄位，於遷移時暫保留於 `.md` frontmatter 之 `publishTargets.github.enabled`，待 Phase 8-d 之後評估搬入 `.publish.json` |
| `github.path` / `publishTargets.github.path` | `github.path` | 頁面相對路徑，例 `/posts/{slug}/` |

### 5.1 publishedUrl 與 yyyy/mm 規則

1. **`publishedUrl` 是 Blogger 實際發布後回填的唯一真相**。發布前不得預測或推算正式 URL。詳見 `docs/publish-json-schema.md` §5.3。
2. **Blogger post URL 可能帶 yyyy/mm**（例：`https://babel-lab.blogspot.com/2026/04/we-media-myself.html`），月份由 Blogger 平台依實際發布月份產生，作者於 Blogger 後台無法修改。
3. Blogger Page URL **不一定遵守 yyyy/mm 結構**；遷移 Page 時不可假設 `publishedUrl` 帶年月。詳見 `docs/publish-json-schema.md` §5.3.2。

### 5.2 標註

1. 上述欄位皆放 `.publish.json`，**不放 `.md` frontmatter**
2. 舊文章若 `publishedUrl` 已存在於 frontmatter，遷移時搬至 `.publish.json` 後，**舊 frontmatter 欄位可保留作為相容期 fallback**（沿用 `docs/publish-bundle.md` §3 之 sidecar 勝、frontmatter fallback 原則），亦可於遷移後刪除（屬作者選擇）
3. `github.enabled` 之最終位置於 8-a 階段尚未定案，遷移時暫保留於原 frontmatter 結構

---

## §6 舊 frontmatter / 舊推廣欄位 → `.fb.md` 對照

下表列出**FB 推廣類**欄位之遷移對照。FB 文案資料放 `.fb.md`。

| 舊欄位（可能來源） | 新位置 | 說明 |
| --- | --- | --- |
| `promotion.facebook.message` / `fbMessage` | `.fb.md` body | 整段 FB 貼文正文搬至 body（YAML frontmatter 之後） |
| `promotion.facebook.hashtags` / `fbHashtags` | `.fb.md` frontmatter `hashtags` | 陣列結構保留；建議帶 `#` 號 |
| `cta` / `promotion.facebook.cta` | `.fb.md` body | CTA 屬 body 內容；無獨立 frontmatter 欄位 |
| `utmSource` / `promotion.facebook.utmSource` | （**不寫入** `.fb.md`） | UTM 由 `content/settings/promotion.config.json` 集中管理（詳見 `docs/fb-sidecar-schema.md` §8.3） |
| `utmMedium` | （**不寫入** `.fb.md`） | 同上 |
| `utmCampaign` | （**不寫入** `.fb.md`） | 同上；`campaignPattern` 由 `promotion.config.json` 動態組裝 |
| `note` / `promotion.facebook.note` | `.fb.md` frontmatter `note` | 作者備忘，不輸出至 FB 貼文 |
| `promotion.facebook.enabled` | `.fb.md` frontmatter `enabled` | 直接搬移；舊 frontmatter `enabled === true` 視為相容期 FB 文案來源（詳見 `docs/fb-sidecar-schema.md` §6.3） |
| `promotion.facebook.target` | `.fb.md` frontmatter `target` | 同名直接搬移 |
| `promotion.facebook.page` | `.fb.md` frontmatter `page` | 同名直接搬移 |
| `promotion.facebook.title` | `.fb.md` frontmatter `title` | 同名直接搬移 |

### 6.1 標註

1. **FB 文案資料放 `.fb.md`**
2. **不放 `.md` frontmatter**
3. **不放 `.publish.json`**
4. 若目前只有手動 FB 導流（作者自行貼文），仍可用 `.fb.md` 保存文案與貼文策略；`enabled` 暫設 `false`，待要發再改 `true`
5. 未來 GitHub 版本之文章亦可共用 `.fb.md`；同一篇文章不論 `primaryPlatform` 為何，FB 推廣文案皆放 `.fb.md`

### 6.2 UTM 集中管理之原因

UTM 參數、粉專完整名稱、URL pattern、campaign 命名規則由 `content/settings/promotion.config.json` 集中管理，**不寫死於 `.fb.md`**。理由：

- 一處改 UTM、所有文章自動套用
- 粉專名稱變更、新增粉專時不需逐篇改
- campaign / content pattern 統一，避免 GA4 報表雜亂

詳細規範見 `docs/fb-sidecar-schema.md` §8。

---

## §7 遷移流程（人工步驟）

下列為一篇舊文章遷移之建議步驟。每完成一篇，以 `docs/checklists/sidecar-migration-checklist.md` 逐項驗收。

1. **建立文章或頁面的 `.md`**：於 `content/{site}/posts/{slug}.md` 或 `content/{site}/pages/{slug}.md` 建立檔案
2. **整理 frontmatter**：依 `.md` frontmatter 預期欄位（§4）整理；本文 Markdown 主體貼入 frontmatter 之後
3. **將舊 `type` 改為 `contentKind`**（§3）
4. **判斷 `blogger.type` 是 `post` 還是 `page`**：依文章性質與 Blogger 後台目標管理區決定
5. **建立 `.publish.json`**：自 `content/templates/_sample.publish.json` 複製為 `{slug}.publish.json`，刪除 `$comment` 欄位
6. **確認 `publishedUrl` / `publishedAt`**：若該文已於 Blogger 發布，自 Blogger 後台取得正式 URL 與發布時間，回填至 `.publish.json` `blogger.publishedUrl` / `blogger.publishedAt`；若尚未發布，留空字串
7. **建立 `.fb.md`**：依 `docs/fb-sidecar-schema.md` §3 結構建立 `{slug}.fb.md`；若舊資料有 `promotion.facebook.*`，依 §6 對照表搬移；若無，依 sample（屬 8-a-6 後續批次）建立空骨架
8. **確認 `canonical`**：依文章主要平台決定 `canonical.source`（`auto` / `github` / `blogger` / `manual`），`canonical.url` 可留空由系統推導
9. **檢查 `relatedLinks` / `otherLinks`**：補上文章末段之相關文章與其他連結（`.md` frontmatter）；若舊資料無此欄位，可留空
10. **完成後再進入後續 validate / build 流程**：本文件不涵蓋 validate / build；屬 Phase 8-b 之後

每一步完成後，可於 `docs/checklists/sidecar-migration-checklist.md` 對應節次勾選對應項目。

---

## §8 本文件不做的事

本文件範圍**不涵蓋**下列事項，相關需求屬其他批次：

1. **不開發自動匯入工具**：手動重貼為唯一遷移方式（§1.2）
2. **不抓 Blogger API**：第一版禁用（CLAUDE.md §4 / §29）
3. **不預測 Blogger URL**：`publishedUrl` 為唯一真相（§5.1）
4. **不修改 CLAUDE.md**：CLAUDE.md §11 之 `type` 命名於本批不變動，待 Phase 8 後續批次（CLAUDE.md 整理批次）統一更名為 `contentKind`
5. **不實作 validate-content**：本文件僅為人工遷移指引；自動驗證實作落地時機為 Phase 8-b / 8-c
6. **不實作 build script**：build 流程修改屬 Phase 8-b 之後
7. **不進 Phase 8-b**：本批屬 Phase 8-a 文件先行階段

---

（本文件結束）
