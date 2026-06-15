# ADMIN — Content Taxonomy Governance Preanalysis

- **Phase**：`20260615-night-9-admin-content-taxonomy-governance-preanalysis-docs-only-a`
- **日期**：2026-06-15（night-9，23:05 起）
- **性質**：docs-only preanalysis（治理規則 / 決策路徑分析；**不**改 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `CLAUDE.md`；**不** `npm install`；**不** build / deploy / 重貼 Blogger；**不**新增 UI；**不**啟用 admin write / Apply / Save；**不**修正 unknown tag `download`；**不**新增 tag；**不**改 frontmatter）
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 preanalysis）
  - `docs/20260615-admin-categories-readonly-usage-counts-record.md`（night-5）
  - `docs/20260615-admin-categories-readonly-usage-counts-human-acceptance.md`（night-6）
  - `docs/20260615-admin-tags-readonly-usage-counts-record.md`（night-7）
  - `docs/20260615-admin-tags-readonly-usage-counts-human-acceptance.md`（night-8）

> **本文件性質聲明**：preanalysis 是規劃，不是修 bug。unknown tag `download` 目前**只是** ADMIN 成功揭露之內容治理訊號（content governance signal），**不**得在本階段直接修正；任何治理動作（修 `tags.json` / 修 frontmatter / 改 validator / 啟用 admin suggested-fix UI）均屬獨立 phase，須 user explicit approval。

---

## A. Baseline verify

```
branch        : main
working tree  : clean
HEAD          : 3ec1bc5 == origin/main
last commit   : docs(admin): record tag usage acceptance

git log --oneline -5:
  3ec1bc5 docs(admin): record tag usage acceptance
  ac0476b feat(admin): add tag usage counts
  77bdc20 docs(admin): record category usage acceptance
  f9f7ef5 feat(admin): add category usage counts
  30ffd29 docs(admin): record posts readiness acceptance
```

→ baseline 完全符合預期；本 phase 純 docs-only。

---

## B. Current state（read-only 觀察）

### B.1 ADMIN read-only taxonomy visibility 現況

| 維度 | 狀態 | 來源 |
|---|---|---|
| Category registry 顯示 | ✅ landed | night-1 IA shell + night-5 |
| Per-category usage counts | ✅ landed | night-5（commit `f9f7ef5`） |
| Category sub-buckets（uncategorized / unknown / unused） | ✅ landed | night-5 |
| Category cross-site mismatch 提示 | ✅ landed | night-5 |
| Tag registry 顯示 | ✅ landed | night-1 IA shell |
| Per-tag usage counts | ✅ landed | night-7（commit `ac0476b`） |
| Tag sub-buckets（untagged / unknown / unused） | ✅ landed | night-7 |
| Tag cross-site mismatch 提示 | ✅ landed | night-7 |
| Categories & Tags 內 Add / Edit / Delete / Apply UI | ❌ 故意不開放 | preanalysis §E phased red lines |

### B.2 揭露之 unknown tag

從 night-7 `[build-github] admin (dev-mode)` 之 console log：

```
tagUsage: 7 defined / 1 unknown / 0 untagged post(s)
```

- **unknown tag key**：`download`
- **影響文章**：`content/blogger/posts/20260529-phonics-practice-sheet-download.md`（1 篇）
- **該文章 frontmatter（只讀，不修）關鍵欄位**：
  - `contentKind: "download"`
  - `category: "download"`（valid — 在 `categories.json`）
  - `tags: [download]`（**unknown** — 不在 `tags.json`）
  - `status: "draft"`，`draft: true`
  - `publishTargets.blogger.enabled: true`、`publishTargets.github.enabled: false`
  - `download.enabled: true`
- **狀態**：draft（never published；尚未對外）

### B.3 Tag totals 現況快照

| 指標 | 值 | 備註 |
|---|---|---|
| totalPosts | 11 | admin loader 量測 |
| taggedPosts | 11 | 所有文章皆有非空 tags |
| untaggedPosts | **0** | 與 phase 指示讀數一致 |
| postWithUnknownTagCount | 1 | phonics-practice-sheet-download |
| unknownTagKeyCount | 1 | `download` |
| unusedTagCount | **0** | 7 個 tags.json entry 皆有 ≥1 篇使用 |
| crossSiteMismatchCount（tag） | **0** | 與 phase 指示讀數一致 |

→ 與 phase 指示「untagged = 0、unused defined tags = 0、cross-site mismatch = 0」一致；本 phase 不需 observed-vs-expected 異常處理。

### B.4 categories.json / tags.json 現況（只讀）

| Registry | 條目數 | id 一覽 | github surface | blogger surface |
|---|---|---|---|---|
| `categories.json` | 4 | `tech-note` / `book-review` / `download` / `life-note` | 1（tech-note） | 4 |
| `tags.json` | 7 | `github` / `vite` / `static-site` / `book` / `book-review` / `reading-notes` / `self-growth` | 3 | 4 |

**重要觀察**：`download` 是 categories.json 之 **category id**；但**不**在 tags.json。`book-review` 兩處同名（namespace 互相獨立）。

### B.5 Validator 對 unknown-tag / unknown-category 之現況

從 `src/scripts/validate-content.js` 2130–2146：

```js
if (post.category) {
  const cat = categoryById.get(post.category) || categoryBySlug.get(post.category);
  if (!cat) {
    issues.push({ severity: 'warning', type: 'unknown-category', sourcePath, value: post.category });
  } else if (post.site && Array.isArray(cat.site) && !cat.site.includes(post.site)) {
    issues.push({ severity: 'warning', type: 'category-site-mismatch', sourcePath, value: post.category, site: post.site });
  }
}
for (const tag of post.tags || []) {
  const t = tagById.get(tag) || tagBySlug.get(tag);
  if (!t) {
    issues.push({ severity: 'warning', type: 'unknown-tag', sourcePath, value: tag });
  } else if (post.site && Array.isArray(t.site) && !t.site.includes(post.site)) {
    issues.push({ severity: 'warning', type: 'tag-site-mismatch', sourcePath, value: tag, site: post.site });
  }
}
```

- 4 條規則皆 `severity: 'warning'`（**none are blockers**；不會 block build / deploy）
- 規則本身**未**對 status 做特別判斷（無 `if (status === 'ready' …)` 包裹）
- **但**從 `src/scripts/load-posts.js`：

```js
const VISIBLE_STATUS = new Set(['ready', 'published']);
function classify(data) {
  if (data.draft === true) return { include: false, reason: 'draft:true' };
  if (!VISIBLE_STATUS.has(status)) return { include: false, reason: `status:${status}` };
  return { include: true, reason: 'ok' };
}
```

→ `loadPosts` 在來源層即過濾 draft / archived / 其他狀態之文章；validator 永遠**看不到** draft posts。

**結論**：phonics-practice-sheet-download.md 為 draft → `loadPosts` 不回傳 → validator 從未檢查 → 不觸發 `unknown-tag` warning。current baseline `0 errors / 94 warnings on 84 posts` 中**無**這 1 個訊號。

→ **admin loader（讀 all status，11 篇）vs validator loader（filter to ready/published，部分篇）= 兩個 surface；數字不對齊屬設計使然，不是 bug**。

---

## C. Taxonomy model 責任區分

### C.1 五個維度

本系統文章現有五個獨立 metadata 維度，**不可混用**：

| 維度 | frontmatter key | 用途 | 例 | 列管位置 |
|---|---|---|---|---|
| **Content kind** | `contentKind` | 「這是什麼樣的內容」（文章形態） | `post` / `tech-note` / `book-review` / `download` / `comic` / `life-note` / `page` | enum 列於 `CLAUDE.md §11`；renderer 行為 |
| **Category** | `category` | 主要分類；路由 / 列表頁 / Blogger 標籤群 / cross-site routing | `tech-note` / `book-review` / `download` / `life-note` | `content/settings/categories.json`（registry） |
| **Tags** | `tags[]` | 輔助索引；主題關鍵字；多對多；hashtag 群組 | `book` / `reading-notes` / `github` / `vite` | `content/settings/tags.json`（registry） |
| **Content-form metadata** | `book.*` / `download.*` / `affiliate.*` | 形態專用結構欄位（書籍 metadata、下載素材、聯盟連結） | `download.fileUrl` / `book.isbn` | per-form schema（無中央 registry） |
| **Commerce / affiliate** | `affiliate.links[].ref` | 商業連結追蹤；通路選擇 | `commerceLinks[].linkId` | `content/settings/commerce-links.json` |

### C.2 為什麼這五個維度不能合一

- **Content kind 是「形態」**：決定 renderer 行為（書評區塊 / 下載區塊 / 四格漫畫）。形態通常 1-of-N。
- **Category 是「routing surface」**：決定文章被列在哪個分類頁、Blogger 後台收在哪個 label group、cross-site 互導入口。Category 應 1-of-N（多 category 會破壞 routing 一致性）。
- **Tags 是「索引 / 群組」**：多對多。同一篇可同時是 `book` + `reading-notes` + `self-growth`。Tag 為 hashtag 群組之來源；不負責 routing。
- **Content-form metadata 是「形態專用結構」**：作者填欄位（書名 / 下載連結），renderer 拿來組區塊。**不能**用 category / tag 取代結構（缺欄位 = 無法 render；validator 會抓）。
- **Commerce 是「外部行銷關係」**：絕不混入 tag / category（外部金流 / token 安全紅線；per CLAUDE.md §3.2 governance）。

### C.3 `download` 屬於哪個維度？

下表分析 `download` 字串在五個維度之適配度：

| 維度 | `download` 適配？ | 原因 |
|---|---|---|
| **Content kind** | ✅ **適配** | 既有 enum（`CLAUDE.md §11`）已列 `download`；`phonics-practice-sheet-download.md` 之 `contentKind: "download"` 即此用途；renderer 之 download box / license note 由此控制 |
| **Category** | ✅ **適配** | `categories.json` 已列 `id: "download"`、`name: "教具下載"`、`site: ["blogger"]`；對應 Blogger 之教具下載 label 群 + 列表頁 |
| **Tags** | ⚠️ **不適配** | tag 為輔助索引 / 多主題標籤；用 `download` 為 tag 會與 category id 同名造成 namespace 衝突（雖技術上不同 Map，但人讀易混淆）；亦不提供 routing 以外之資訊（contentKind 已表達「這是下載類」） |
| **Content-form metadata** | ✅ **已存在** | `download.enabled / fileUrl / title / description / licenseNote` 等欄位已表達「下載素材本身」；不需用 tag 補述 |
| **Commerce** | ❌ **不適配** | download 為自家素材；不是 affiliate link / 通路 |

**初步判斷**：`download` 屬於 **(1) content kind + (2) category + (3) form-specific metadata** 三個維度，**不**適合作為 tag。phonics-practice-sheet-download.md 之 `tags: [download]` 屬作者意圖不清晰或慣性誤用。

---

## D. Unknown tag `download` decision options

### D.1 Option A：新增 `download` 到 `tags.json`

**做法**：在 `content/settings/tags.json` 新增 `{ id: "download", name: "下載", slug: "download", site: ["blogger"] }`。

| 面向 | 分析 |
|---|---|
| 優點 | 解除 admin unknown 揭露；未來其他下載類文章可重用此 tag；frontmatter 無需動 |
| 缺點 | 與 `categories.json` 之 `download` category 同名；雖 namespace 不同，但人眼讀 frontmatter 時 `category: "download"` + `tags: [download]` 視覺重複；tag 通常擔任「補充索引」角色，但此用途已由 `contentKind` + `category` 覆蓋，新增等於「為了消除 admin 揭露而新增 tag」（治理倒置） |
| 對 Blogger 影響 | Blogger hashtag 區塊會出現 `#download`（語意冗餘） |
| 對 GitHub Pages 影響 | 若該文章未來 cross-publish 至 GitHub，tag 需設 site 含 github；目前 site 僅 blogger，跨站需再決策 |
| 對 ADMIN 影響 | unknown bucket 歸 0；unused 偵測仍正常運作 |
| 對 validation 影響 | validator 不再對 ready/published 之同 frontmatter 發 `unknown-tag` warning |
| 適合現在做？ | ❌ **不**建議；屬「為了消除訊號而動 registry」之治理倒置；應先決定 download 是否應有 tag 角色 |

### D.2 Option B：從文章 frontmatter 移除或改名 `tags: [download]`

**做法**：修 `phonics-practice-sheet-download.md` 之 `tags`：
- **B1（移除）**：`tags: []`（無 tag）→ 但會落入 admin untagged bucket；違反當前「11/11 有 tag」現況
- **B2（改名）**：`tags: [book]` 或 `tags: [reading-notes]`（語意不貼）；或新建符合語意之 tag（如 `printable` / `worksheet` / `kids-learning`），但這變成 Option A 的變體

| 面向 | 分析 |
|---|---|
| 優點 | 不動 registry；保留 tags.json 純淨 |
| 缺點 | B1 製造 untagged bucket（換個訊號）；B2 必須先決定有意義 tag，否則只是噪音改噪音 |
| 對 Blogger 影響 | hashtag 區塊改變 |
| 對 ADMIN 影響 | unknown 0；可能新增 untagged 1（B1）或新 unknown（B2 若選新 tag） |
| 對 validation 影響 | validator 對該 draft 不檢查；ready 後依新 tag 決定 |
| 適合現在做？ | ❌ **不**建議；該文章仍為 draft + `download.fileUrl: ""`（per `phonics-practice-sheet-download.md`），先解決素材檔本身、ready 之前不需動 tag |

### D.3 Option C：改由 content kind / download metadata 表達，不作為一般 tag

**做法**：把 `tags: [download]` 整段移除，依賴既有 `contentKind: "download"` + `category: "download"` + `download.*` 區塊表達。可能新增**內容相關**之 tag（如 `phonics` / `worksheet` / `kids-learning`），但須先在 `tags.json` 註冊。

| 面向 | 分析 |
|---|---|
| 優點 | 維度乾淨；tag 不再扮演「形態提示」角色；未來其他 download 類文章皆遵此規則；admin unknown 揭露歸 0 |
| 缺點 | 該文章若沒有其他 tag → 進入 untagged bucket；可能需先新增有意義之內容 tag（例：phonics / worksheet）；新增 tag 需獨立 settings 治理 phase |
| 對 Blogger 影響 | hashtag 區塊變化；無 `#download`；可能加 `#phonics` 等 |
| 對 ADMIN 影響 | unknown 0；untagged 視 user 是否同步補有意義 tag 而定 |
| 對 validation 影響 | validator 對該 draft 不檢查；ready 之前需先確認 tag 設計 |
| 適合現在做？ | ⚠️ **方向正確但時機未到**；該文章為 draft + 無素材檔，應在進入 ready 流程時一併處理；本日不執行 |

### D.4 Decision options 摘要

| Option | 推薦度 | 適合時機 |
|---|---|---|
| A. 新增 `download` 至 tags.json | 低（治理倒置） | 若 user 認為 download 應有獨立 tag 索引角色（罕見） |
| B. 從 frontmatter 移除或改名 | 中（換個訊號） | 該文章接近 ready 時 |
| **C. content kind + form metadata 表達，必要時補有意義 tag** | **較高** | 該文章接近 ready，與素材檔上傳一併處理 |

**核心觀察**：三選項皆**不**適合「今晚立即執行」。最低風險動作 = **記錄治理規則 + 等該文章自然進入 ready 流程時依規則處理**。

---

## E. Recommended governance rule

### E.1 Severity：warning，不是 blocker

- ✅ `unknown-tag` / `unknown-category` / `tag-site-mismatch` / `category-site-mismatch` 維持 **warning-only**
- ✅ 不升級為 error（避免 build / deploy 被治理問題卡住；治理是人工決策，不應 block 自動化）
- ✅ 但每個 warning 應有明確「來自哪個維度、應如何決策」之文件指引（本 preanalysis 即此類）

### E.2 Status 區分嚴格度

| status | 是否套 unknown taxonomy 規則 | 行為 |
|---|---|---|
| `draft` | ⚠️ admin loader 揭露；validator 不檢查 | 作者整理中；治理訊號為「提醒」而非「警告」 |
| `ready` | ⚠️ admin + validator 雙重揭露 | 即將發布；建議解決 unknown taxonomy 後再 publish；仍 warning |
| `published` | ⚠️ admin + validator 雙重揭露 | 已對外；治理問題需排程處理；仍 warning（避免 block 既有 live post） |
| `archived` | – validator 不檢查 | 不影響 active surface |

> 不建議在 ready 階段升級為 error；published 篇若回頭發現 unknown tag，更不應立即升 error（會造成「修不掉的歷史包袱」）。一律 warning + 紀錄。

### E.3 Surface（Blogger / GitHub Pages）區分

- **Blogger surface**：tag → hashtag 區塊；unknown tag 會渲染為 `#<key>` hashtag（即便未在 registry）；視覺影響直接，建議優先處理
- **GitHub Pages surface**：tag → tag list page；unknown tag 不會自動建立 tag list 頁（無 routing 落點），但會顯示在文章 hashtag UI；建議優先處理

→ 兩 surface 治理規則一致（皆 warning）；但 Blogger 對 unknown tag 之渲染後果較直接（hashtag 已 render），故 ready 前處理優先級略高。

### E.4 Cross-site mismatch（per-tag.site / per-category.site）

- 維持 warning-only
- ADMIN 已揭露 per-tag / per-category mismatch 計數 + sample posts
- 處理路徑：(a) 改 frontmatter 之 site；或 (b) 擴 tag.site / category.site 包含該 surface；屬獨立 settings 治理 phase

### E.5 ADMIN 可以顯示「suggested fix」嗎？

| 級別 | 是否允許 | 條件 |
|---|---|---|
| L1：read-only 顯示 unknown bucket + sample posts | ✅ 已實作（night-5 / night-7） | 純揭露 |
| L2：read-only 顯示「decision option 摘要」（如本文件 §D） | ⚠️ 可考慮 future preanalysis | 需 docs 連結而非硬編規則；避免 admin 變成規格文件 |
| L3：read-only 顯示「per-post suggested fix」（如「建議改為 X tag」） | ❌ **不開放** | 需要規則引擎；admin 不應有規則邏輯；屬 validator / 獨立 lint tool 範圍 |
| L4：one-click auto-fix | ❌ **絕對不開放** | 需 admin write path；違反 preanalysis §E phased red lines |

**推薦**：admin 維持 L1（已實作）；L2 屬未來可選；L3 / L4 維持紅線。

### E.6 Auto-fix 紅線

- ❌ ADMIN **不**得 auto-fix frontmatter
- ❌ ADMIN **不**得 auto-add tag 至 `tags.json`
- ❌ ADMIN **不**得 auto-remove unused tag
- ❌ 即使治理 phase 已上 plan，本機 admin loader / EJS render 路徑亦不執行修改

---

## F. Future admin behavior（仍 read-only）

### F.1 Suggested-fix 顯示之上限

未來如 admin 要顯示「建議修正」hint，須遵：

1. **純 read-only 顯示**：顯示文字 hint，不含 form / button
2. **連結至 docs**：hint 文字應 link 到 governance docs（如本 preanalysis），不在 admin 內硬編規則
3. **顯示「不是 auto-fix」之免責**：hint 須明示「此為建議；請手改 frontmatter / settings 後 run validate:content」
4. **不擾亂 read-only management shell 定位**：hint 為輔助而非主流；避免被誤認為 CMS

### F.2 Apply / Save 之安全條件（屬未來獨立 preanalysis）

若未來真的要開放 admin 寫入路徑（本 preanalysis **不**啟用），最低安全條件：

| 條件 | 說明 |
|---|---|
| 1. 獨立 middleware 安全 preanalysis | 須先 docs-only 分析 attack surface / auth model |
| 2. CLI-first 寫入 | 維持既有 `admin:write` CLI-only 模式；browser 寫入須次序在後 |
| 3. Frontmatter dry-run | Apply 前必須顯示 diff；user explicit confirm |
| 4. Validator gate | Apply 後自動 run `validate:content`；失敗 → rollback |
| 5. Git commit 保留審計 | 每次寫入 = 1 commit；附 audit metadata |
| 6. 不寫 settings | 寫入路徑首版僅限 frontmatter；`tags.json` / `categories.json` / `ads.config.json` / `commerce-links.json` 等 settings 維持 CLI-only / manual |
| 7. 不寫敏感欄位 | AdSense id / GA4 measurementId / commerce credentials 永遠拒寫 |
| 8. Deploy 仍 manual | Apply 不觸發 build / deploy / Blogger repost |

> 本 phase **不**啟用任何寫入路徑；上述條件僅為將來決策參考。

---

## G. Validation alignment

### G.1 `validate-content` 現況對齊

| 維度 | validator | ADMIN loader |
|---|---|---|
| Status filter | 過濾 draft / archived（loadPosts 層） | 不過濾；含全 status |
| 來源路徑 | sourcePath 為相對路徑 | absolute path（fast-glob + path.resolve） |
| unknown-category | warning-only；對 ready/published 篇 | unknown bucket；對所有 status |
| unknown-tag | warning-only；對 ready/published 篇 | unknown bucket；對所有 status |
| cross-site mismatch | warning-only；對 ready/published 篇 | crossSiteMismatchCount + sample；對所有 status |

### G.2 Admin warning vs Validator warning 之 ground truth 關係

- **Validator 是 ready/published 篇之 ground truth**（per night-5 §C.5 / night-7 §C.2）
- **Admin 揭露之 unknown / mismatch 計數**：包含 draft → 比 validator 數字大；屬「提前提醒」性質
- 兩者**不**對齊屬設計使然，不是 bug
- ADMIN 文案明確標示「不取代 validator」+「驗證仍須 `npm run validate:content`」

### G.3 是否需要 admin validation per-post aggregation preanalysis？

- ✅ 需要（已列於 night-5 §H §3 / night-7 §H §4）
- 範圍：探討 admin loader 之 absolute sourcePath vs validator 之 relative sourcePath join 對齊；或改 validator 提供 per-post API
- **不**屬本 phase；屬另一獨立 docs-only preanalysis

---

## H. Explicit non-actions（本 phase 紅線）

- ❌ **未**改 `content/settings/tags.json`
- ❌ **未**改 `content/settings/categories.json`
- ❌ **未**改 `content/blogger/posts/20260529-phonics-practice-sheet-download.md`（即使已誠實揭露其 `tags: [download]` 為 unknown）
- ❌ **未**改任何其他 `.md` frontmatter
- ❌ **未**改 `src/scripts/validate-content.js`
- ❌ **未**改 `src/scripts/load-admin-posts.js`
- ❌ **未**改 `src/scripts/load-posts.js`
- ❌ **未**改 `src/views/admin/index.ejs`
- ❌ **未**新增任何 admin UI（含 suggested-fix hint）
- ❌ **未**啟用 admin write / Apply / Save / browser write / middleware / CLI fix-cmd
- ❌ **未** `npm install`；**未**動 `package.json` / lockfile
- ❌ **未** build / deploy / push gh-pages / 重貼 Blogger
- ❌ **未**動 AdSense / GA4 / commerce 後台
- ❌ **未**動 `CLAUDE.md`
- ❌ **未**升級 unknown-tag / unknown-category warning 為 error
- ❌ **未**對 phonics-practice-sheet-download.md 之 `download.fileUrl: ""` 做任何處理（屬另一獨立 download asset readiness phase）
- ❌ **未**對 Blogger / GitHub Pages cross-publish tag site 設計做任何決策（屬另一獨立 settings 治理 phase）

→ 唯一 mutation = 本 preanalysis doc 自身。

---

## I. Proposed next phases（低風險順序）

### I.1 保守（推薦預設）

1. **`20260615-night-final-idle-freeze-after-taxonomy-governance-preanalysis-no-op-a`** —
   收工 idle freeze；等 user 決定下一步。

### I.2 Acceptance（並行可做；不動 source / content / settings）

2. **`20260615-XX-admin-content-taxonomy-governance-preanalysis-human-acceptance-a`** —
   人眼閱讀本 preanalysis，確認 §C taxonomy model / §D decision options / §E governance rule 是否符合預期；docs-only。

### I.3 治理執行 phase（須 user explicit approval；分開不混做）

3. **`20260616-XX-content-fix-phonics-download-frontmatter-preanalysis-docs-only-a`** —
   docs-only preanalysis：就 phonics-practice-sheet-download.md 之 `tags: [download]` 提出具體修法（建議 Option C），同時整併 `download.fileUrl` 空值與 cover 缺漏；**不**改 frontmatter。
4. **`20260616-XX-tags-json-update-preanalysis-docs-only-a`**（僅在 user 選 Option A 才需要）—
   docs-only：分析新增 `download` tag 之 site allowed / 與 category id 同名之命名空間衝突 / 對 hashtag 區塊之影響；**不**改 `tags.json`。
5. **`20260616-XX-content-fix-phonics-download-frontmatter-implementation-a`**（須 user 選定 Option B 或 C）—
   實作 phonics 文章 frontmatter 修正；single new commit；**不**動其他文章 / settings。
6. **`20260616-XX-tags-json-update-implementation-a`**（僅在 user 選 Option A）—
   實作 `tags.json` 新增 `download` 條目；single new commit；**不**動其他 settings / content。

### I.4 ADMIN 行為擴充候選（仍 read-only；屬未來）

7. **`20260616-XX-admin-suggested-fix-readonly-ui-preanalysis-docs-only-a`** —
   docs-only：分析 L2「per-bucket decision option 摘要」連結至 governance docs 之顯示方式；維持 L1 / L3 / L4 紅線；**不**改 EJS / loader。
8. **`20260616-XX-admin-validation-per-post-aggregation-preanalysis-docs-only-a`** —
   docs-only：探討 admin loader 與 validator sourcePath 對齊 / per-post API 設計；**不**改 validator / loader。

### I.5 仍按既定主線之候選（不在本日推進）

9. **`20260616-admin-posts-detail-readability-refinement-a`** —
   Posts detail + Categories / Tags usage table responsive 折版（card layout）。仍 read-only。
10. **`20260616-XX-admin-post-detail-readonly-expand-a`** —
    detail panel 擴充 commerce ref / book metadata / download ref / prev / next slug 預覽。
11. **`20260616-XX-admin-build-deploy-readonly-status-a`** —
    read-only 顯示最後 build / deploy 狀態。
12. **（最後）write path** —
    仍按 preanalysis §E 分階段紅線：read-only → copy-helper / dry-run → gated CLI write → middleware。**不跳階**。

---

（本紀錄結束）
