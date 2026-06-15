# ADMIN — Suggested-Fix Read-Only UI Preanalysis

- **Phase**：`20260616-admin-suggested-fix-readonly-ui-preanalysis-docs-only-a`
- **日期**：2026-06-16（07:28 起；am session）
- **性質**：docs-only preanalysis（顯示哲學 / 分級 / IA / 資料 contract / 紅線 / implementation 條件分析；**不**改 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `CLAUDE.md`；**不** `npm install`；**不** build / deploy / 重貼 Blogger；**不**新增 UI；**不**啟用 admin write / Apply / Save / browser write / middleware / CLI fix-cmd；**不**修 frontmatter / tags.json / categories.json / validator；**不**升 validator warning 為 error；**不**動 build output / Blogger / GA4 / AdSense；**不** amend / rebase / reset / force-push）
- **baseline**：`main` HEAD == origin/main == `49161c6`（`docs(admin): accept taxonomy governance preanalysis`）；working tree clean
- **承接**：
  - `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 IA + 現況盤點）
  - `docs/20260615-admin-categories-readonly-usage-counts-record.md` / `…-human-acceptance.md`（night-5 / night-6）
  - `docs/20260615-admin-tags-readonly-usage-counts-record.md` / `…-human-acceptance.md`（night-7 / night-8）
  - `docs/20260615-admin-content-taxonomy-governance-preanalysis.md`（night-9）
  - `docs/20260616-admin-content-taxonomy-governance-preanalysis-human-acceptance.md`（am-1）

> **本文件性質聲明**：preanalysis 是規劃，不是實作 UI。本 phase 不新增任何 ADMIN 顯示元素、不改 loader derive 欄位、不新增 EJS partial、不寫 CSS / JS、不改 validator 規則、不啟用 write path。任何「真的渲染 suggested-fix UI」之動作均屬獨立 implementation phase + user explicit approval。

---

## A. Baseline verify

```
pwd            : /d/github/blog-new/portable-blog-system
branch         : main (ahead/behind 0/0)
HEAD           : 49161c6 == origin/main
working tree   : clean
last 5 commits :
  49161c6 docs(admin): accept taxonomy governance preanalysis
  3a06fe3 docs(admin): plan taxonomy governance
  3ec1bc5 docs(admin): record tag usage acceptance
  ac0476b feat(admin): add tag usage counts
  77bdc20 docs(admin): record category usage acceptance
```

→ baseline 完全符合 phase 指示。

---

## B. 現況觀察（read-only；只讀掃描）

### B.1 loader 已 derive 之 governance signal（read-only；無 write）

從 `src/scripts/load-admin-posts.js` 量測：

| 欄位 | derive 範圍 | 結構 |
|---|---|---|
| `categoryUsage.perCategory[]` | 每 categories.json entry × 文章使用統計 | id / name / slug / site[] / postCount / statusBreakdown / siteBreakdown / **crossSiteMismatchCount** / **samplePosts**（含 `isMismatch` flag）/ truncated |
| `categoryUsage.unusedCategories[]` | postCount === 0 之 entry | 同上 |
| `categoryUsage.unknownCategories[]` | 文章使用了未在 registry 之 key | key / postCount / statusBreakdown / samplePosts / truncated |
| `categoryUsage.uncategorized` | frontmatter.category 為空 / 缺欄位 | count / samplePosts / truncated |
| `categoryUsage.totals` | `totalPosts` / `categorizedPosts` / `uncategorizedPosts` / `unknownCategoryPosts` / `definedCategoryCount` / `unusedCategoryCount` / `unknownCategoryKeyCount` | scalar 計數 |
| `tagUsage.perTag[]` | 每 tags.json entry × 文章使用統計 | 同 perCategory shape（含 crossSiteMismatchCount / samplePosts / isMismatch） |
| `tagUsage.unusedTags[]` / `unknownTags[]` / `untagged` / `totals` | 對應 tag 維度 | 同上 |
| `commerceLinksPreview` | commerce-links.json 已 derive 之 safe-only preview（無 targetUrl / internalLabel / token） | per-link safe fields |
| `systemSummary` | 全站 14+ 統計卡之來源 | counts |

→ **registry-level governance signal 之 read-only derive 已 100% 就位**；suggested-fix UI 之 **registry 層**（per category / per tag / unknown / unused / uncategorized / untagged / cross-site mismatch）所需資料**全在 loader 輸出**，view 層只需「組合 + 文字 hint + cross-link」。

### B.2 admin/index.ejs 已渲染之 governance signal

從 `src/views/admin/index.ejs` 量測：

| 渲染區塊 | 顯示什麼 | 是否已含 suggested-fix 文字 hint |
|---|---|---|
| Categories totals pills（L1427–1440） | totalPosts / uncategorized / unknown category / definedCategoryCount / unusedDefined | ⚠️ 部分（warn pill 顯示計數，無修法 hint） |
| Categories perCategory table（含 samplePosts） | 每 category 之 postCount / statusBreakdown / siteBreakdown / mismatch / sample posts | ❌ 無 hint |
| Categories sub-buckets（uncategorized / unknown / unused） | sample posts + bucket-note 文字 | ✅ **已有極簡 hint**（如 L1602「對應 validator 之 `unknown-category` warning。Admin 不自動修；請新增 categories.json 條目或修正 frontmatter。」） |
| Tags totals pills（L1634–1652） | totalPosts / untagged / unknown tag key / definedTagCount / unusedDefined | ⚠️ 部分 |
| Tags perTag table | 同 perCategory | ❌ 無 hint |
| Tags sub-buckets（untagged / unknown / unused） | sample posts + bucket-note 文字 | ✅ 已有極簡 hint（如 L1805「對應 validator 之 `unknown-tag` warning。Admin 不自動修；請新增 tags.json 條目或修正 frontmatter。」） |
| Posts index（總覽表格） | search / filter / sort + per-post Identity / Surfaces / Dates / SEO / Blogger / GitHub / FB | ❌ **無 per-post governance signal**（無 per-post unknown-tag count / unknown-category count / mismatch count / suggested-fix list） |
| Post detail panel | Identity / Platform Routing / Dates / SEO / Blogger / GitHub / FB / commerce ref preview / SEO+FB dry-run | ❌ **無 per-post suggested-fix list** |

### B.3 缺口（本 preanalysis 之核心問題）

1. **缺口 1**：per-post 層級之 suggested-fix signal（每篇文章「我有 N 個 unknown tag / M 個 cross-site mismatch / K 個 uncategorized 問題」）—— loader 已能 derive，但**未**在 view 渲染。
2. **缺口 2**：governance docs cross-link（registry / sub-bucket 之 bucket-note 文字應 link 到本 preanalysis + night-9 governance preanalysis，避免 admin 內硬編「下一步該怎麼做」之規則）。
3. **缺口 3**：L2「decision option 摘要」之顯示（如 unknown tag `download` 之三個 Options 摘要）—— 應以**純文字 + docs link** 形式呈現，不在 admin 內硬編規則。
4. **缺口 4**：避免 Apply / Save 誤認之顯示哲學 —— 既有 bucket-note 有「Admin 不自動修」字樣，但 detail / per-post signal 尚未一致；需要全站統一語氣。
5. **缺口 5**：validator warning 與 admin signal 之關係文字 —— 既有 bucket-note 有「對應 validator 之 unknown-tag warning」字樣（已 PASS）；但 per-post 顯示時需明示「validator 過濾 draft → admin 含 draft → 兩者數字不對齊屬設計」（per night-9 §G.2）。

---

## C. UI 目的 & 顯示哲學

### C.1 目的（按 phase 指示）

1. **只做 read-only visibility**：把現有 derived governance signal **可視化**（loader 已 derive，view 渲染），不新增規則引擎。
2. **協助人眼判斷 taxonomy / frontmatter / registry / validation 訊號**：以 sample posts、計數、cross-link 形式提供「我下一步該去看哪裡」之線索。
3. **不提供一鍵修正**：UI 不含 form / button / fetch / Apply / Save / write fs；任何 mutation 動作 = user 手改 markdown / JSON + `npm run validate:content`。
4. **不暗示系統已可安全寫入**：所有顯示元素須含 anti-write 訊號（「Admin 不自動修」、「請手改」、「nominate 對應 docs」）。

### C.2 顯示哲學六條（內部規範）

| # | 規範 | 為什麼 |
|---|---|---|
| 1 | **每個 suggested-fix 顯示須含 anti-write 一句話** | 避免被誤認為 CMS；既有 bucket-note 已建立樣板 |
| 2 | **L2 以上 hint 須 cross-link 到 governance docs** | 不在 admin 硬編規則；docs 為單一規格來源 |
| 3 | **per-post signal 須含計數，不含 prescription** | 顯示「有 1 個 unknown tag」而**不**顯示「請改成 X」 |
| 4 | **empty state 須明示「皆已對齊」** | unknown=0 / mismatch=0 / unused=0 時，bucket-note 文案改為正向確認（已有樣板 L1580） |
| 5 | **drf / ready / published / archived 須分桶顯示** | per night-9 §E.2 status 區分 |
| 6 | **不顯示「建議改為 Y」之 per-post prescription** | 屬 L3 規則引擎範圍，已紅線禁止 |

---

## D. Suggested-fix 分級定義

> 本分級**承襲** night-9 §E.5 之 L1 / L2 / L3 / L4 級別表（純提示 / 人眼建議 / 跨檔判斷 / blocker 訊號），本 phase 細化「顯示形式 + 資料來源 + 是否需要 cross-link + 紅線」。

### D.1 L1：純提示 / 可忽略 / 低風險

| 屬性 | 值 |
|---|---|
| 範例 | unused defined category（registry 有但 0 篇用）、untagged 0 但 unused tag ≥ 1、unused commerce link entry |
| 顯示形式 | 計數 pill（pill 無 `warn` class）+ 一句中性文字 |
| 是否需 cross-link | 否（純提示；用 inline 一句話即可） |
| 是否 per-post 顯示 | ❌ 否（registry 層 only） |
| 是否需 anti-write 文字 | ⚠️ 弱化版（「可考慮 …」+「Admin 不自動修」） |
| 既有實作覆蓋 | ✅ 已有（L1437「unused defined」pill + L1617 unused 段 bucket-note） |
| 缺口 | 無 |

### D.2 L2：人眼可判斷的建議修正，但仍不得自動套用

| 屬性 | 值 |
|---|---|
| 範例 | unknown category（文章使用了未在 registry 之 key）、unknown tag、cross-site mismatch、uncategorized post、untagged post |
| 顯示形式 | warn 計數 pill + sub-bucket card + sample posts + bucket-note + **cross-link to governance preanalysis** |
| 是否需 cross-link | ✅ **必要** — bucket-note 應含 `→ 詳細決策參考 docs/20260615-admin-content-taxonomy-governance-preanalysis.md §D` |
| 是否 per-post 顯示 | ⚠️ **建議補**（缺口 1） — per-post 計數 badge + click 連到 detail panel；但 **不**含 prescription |
| 是否需 anti-write 文字 | ✅ **必要** — bucket-note 須含「Admin 不自動修；請手改 …」 |
| 既有實作覆蓋 | ⚠️ 部分（registry 層已有；per-post 層缺） |
| 缺口 | per-post badge + detail panel suggested-fix list + governance docs cross-link |

### D.3 L3：需跨檔案 / governance 判斷，read-only 顯示即可

| 屬性 | 值 |
|---|---|
| 範例 | `download` 應屬 contentKind+category 而非 tag（需跨 5 維度判斷）、commerce ref 過期、validator warning 與 admin signal 數字不對齊（loader 範圍差） |
| 顯示形式 | **僅** sub-bucket / registry 區段之 docs cross-link；**不**顯示 per-post 「建議改為 X」之 prescription |
| 是否需 cross-link | ✅ **強制必要** — 須連到具體 docs 段落（不在 admin 內硬編規則） |
| 是否 per-post 顯示 | ❌ **禁止** per-post 級 prescription（即「該文章建議改為 X」字樣） |
| 是否需 anti-write 文字 | ✅ **強制必要** |
| 既有實作覆蓋 | ❌ 無（L3 全新領域） |
| 缺口 | governance docs cross-link 樣板（沿用 docs/ 為唯一規格來源） |

### D.4 L4：禁止自動化；僅作 blocker / manual review 訊號

| 屬性 | 值 |
|---|---|
| 範例 | 試圖 auto-fix（**永不顯示**）、試圖開啟 Apply / Save UI（**永不顯示**）、試圖顯示 «一鍵新增 tag» 按鈕（**永不顯示**） |
| 顯示形式 | **不顯示** — L4 = 紅線 = 不存在於 UI |
| 是否需 cross-link | N/A |
| 是否 per-post 顯示 | ❌ 絕對禁止 |
| 是否需 anti-write 文字 | N/A（從未渲染） |
| 既有實作覆蓋 | ✅（從未存在 → 紅線自然維持） |
| 缺口 | 無（持續紅線監督；任何 implementation PR 須拒收 L4 行為） |

### D.5 分級與 night-9 §E.5 對齊表

| 本 phase | night-9 §E.5 | 行為 |
|---|---|---|
| L1 | L1：read-only 顯示 unknown bucket + sample posts | ✅ 對齊；已實作 |
| L2 | L2：read-only 顯示「decision option 摘要」（連結至 docs） | ✅ 對齊；本 preanalysis 細化顯示形式 |
| L3 | L3：read-only 顯示「per-post suggested fix」 | ❌ **降級為 read-only docs cross-link**；本 phase 反對 per-post prescription |
| L4 | L4：one-click auto-fix | ✅ 對齊；紅線（從不存在） |

→ 本 phase 對 night-9 L3「per-post suggested fix」之原 L3 定義作**保守降級**：原 L3 含「per-post 建議改為 X tag」prescription；本 phase 認為 prescription = 規則引擎範圍 = 不開放；改採「per-post 計數 badge + 連結到 docs」之保守替代。

---

## E. ADMIN UI 呈現方式（IA / 放在哪）

### E.1 已有可擴充之渲染面

| 位置 | 現況 | 建議擴充（仍 read-only） |
|---|---|---|
| Categories sub-buckets card（uncategorized / unknown / unused） | ✅ 已有 sample posts + bucket-note | 加 cross-link 到 night-9 §D；加 «查看詳細決策路徑» 連結 |
| Tags sub-buckets card（untagged / unknown / unused） | ✅ 已有 sample posts + bucket-note | 同上 |
| Posts index 表格 | ✅ 已有 status / channel / sourceSite / completeness filter | **新增 read-only column**：governance signal count badge（如 「3」warn pill；click 連到 detail panel） |
| Post detail panel（已有 Identity / Platform Routing / Dates / SEO / Blogger / GitHub / FB / commerce 區塊） | ✅ 已有 | **新增 read-only section** 「Governance signals (read-only)」：列 unknown-tag / unknown-category / cross-site mismatch 之 per-post signal；含 anti-write 文字 + docs cross-link |
| Categories totals pills | ✅ 已有 | 不變（L1 already adequate） |
| Tags totals pills | ✅ 已有 | 不變 |

### E.2 不建議新增之 UI 元素

| 元素 | 為什麼不建議 |
|---|---|
| 「Apply 修正」按鈕 | L4 紅線 |
| 「一鍵新增 tag」按鈕 | L4 紅線 |
| 「建議改為 X」per-post prescription 文字 | L3 規則引擎範圍；不開放 |
| 全域 suggested-fix 統計 dashboard 卡 | 重複統計；既有 totals pills 已涵蓋；新增徒增雜訊 |
| Suggested-fix 修法 form input | 直接寫入 surface；違反 read-only |
| Validator 自動重跑按鈕 | 屬另一獨立 phase（per night-9 §G.3）；本 phase 不開放 |
| Per-post auto-suggest tag list | 規則引擎；L3 紅線 |
| Apply Save fetch POST endpoint | L4 紅線；middleware 安全 preanalysis 未做 |

### E.3 Filter / badge / severity / source 設計建議（不在本 phase 實作）

未來 implementation 若加 filter，建議 contract：

| 設計面 | 建議 |
|---|---|
| Filter（Posts index 加） | new filter chip：has-unknown-tag / has-unknown-category / has-cross-site-mismatch；read-only filter（不改 fs） |
| Badge | per-post 顯示 warn pill「N」；click = 開 detail panel（既有行為） |
| Severity | 只用 `warn` 一級 class（沿用 totals-pill warn 樣板）；不引入 `error` / `blocker` 級別（避免暗示 build block） |
| Source 標籤 | 文字明示「來源：admin loader（含 draft / 所有 status）」+ 「validator 範圍：ready/published」；參考 night-9 §G.2 |

### E.4 避免使用者誤以為可以直接 Apply 之顯示策略

| 策略 | 樣板 |
|---|---|
| 1. Anti-write 一句話 | 「Admin 不自動修；請手改 frontmatter / `tags.json` + `npm run validate:content`」（**完全沿用既有 L1602 / L1805 樣板**） |
| 2. 文字選擇 | 用「來源」/「對應」/「請查看」/「請手改」之動詞；**禁止**「Apply」/「Save」/「Fix」/「Repair」 |
| 3. UI 控制項 | 純文字 + link；**禁止** input / button / form / select / textarea |
| 4. Cross-link 之 link | 連到 docs/ 內 governance preanalysis 之**錨點**（如 `#D-unknown-tag-download-decision-options`）；docs 為唯一規格來源 |
| 5. 頁面 banner | 既有 admin index banner「不公開 / 不寫入 / 不部署」**已涵蓋**；本 phase 沿用 |
| 6. Loader 不擴 write field | loader 仍純 `loadAdminPosts` 之 read shape；**不**新增 `adminFix.*` / `pendingChange.*` 之欄位（避免後續被誤改為寫入） |

---

## F. 資料來源（read-only contract）

### F.1 既有 derived data（loader 已備）

| 來源 | 內容 | 使用範圍 |
|---|---|---|
| `categoryUsage.*` | per-category / unknown / unused / uncategorized | L1（unused）/ L2（unknown / uncategorized / mismatch） |
| `tagUsage.*` | per-tag / unknown / unused / untagged | L1（unused）/ L2（unknown / untagged / mismatch） |
| `commerceLinksPreview` | safe-only commerce signal | L2（unused commerce link） |
| `systemSummary` | 全站計數 | （不直接給 suggested-fix，但作 dashboard health 用） |

### F.2 待補 read-only derive（若 implementation phase 啟動才做）

| 欄位（建議命名） | derive 方式 | 屬性 |
|---|---|---|
| `post.governanceSignals.unknownTagCount` | 對該篇文章 tags 過濾 `tagBySlug` / `tagById` 未命中 之數量 | 純函式；無 fs；無 fetch |
| `post.governanceSignals.unknownCategoryFlag` | 對該篇文章 category 過濾 registry 未命中 → bool | 同上 |
| `post.governanceSignals.crossSiteMismatchTagCount` | 對該篇文章 tags 過濾 site mismatch | 同上 |
| `post.governanceSignals.crossSiteMismatchCategoryFlag` | 同上但對 category | 同上 |
| `post.governanceSignals.signalSum` | 上四項 sum（badge 用） | 同上 |

**不**新增之欄位（紅線）：
- ❌ `post.suggestedFix[]`（prescription）
- ❌ `post.adminWriteHint.*`（暗示寫入）
- ❌ `post.recommendedTag` / `post.recommendedCategory`
- ❌ `post.fixableByAdmin` flag

### F.3 不新增的資料來源

| 不新增 | 為什麼 |
|---|---|
| validator API per-post 查詢（重跑 validate:content） | 屬獨立 phase（night-9 §G.3）；本 phase 不開放 |
| 規則引擎（「unknown tag X 應改為 Y」） | L3 紅線 |
| 真實修法資料（如「修法歷史」/「歷次 suggested fix」） | 無 write surface；不需要 |
| GitHub API / Blogger API / GA4 API | 屬 admin 外圍；本 phase 不打外部 API |
| 機器學習 / LLM 推薦 | 不在本系統範圍 |

---

## G. 安全紅線（本 phase + 未來 implementation phase 共通）

### G.1 本 phase（docs-only）紅線

- ❌ 不改 `src/` / `content/` / `content/settings/` / `src/views/` / `package.json` / lockfile / `CLAUDE.md`
- ❌ 不 `npm install`
- ❌ 不 build / deploy / push gh-pages / 重貼 Blogger
- ❌ 不新增 UI / EJS / CSS / JS
- ❌ 不啟用 admin write / Apply / Save / browser write / middleware / CLI fix-cmd
- ❌ 不修 frontmatter / tags.json / categories.json / validator
- ❌ 不升 validator warning 為 error
- ❌ 不動 GA4 / AdSense / commerce 後台
- ❌ 不做 taxonomy 真實資料遷移
- ❌ 不做 GA4 驗證
- ❌ 不 amend / rebase / reset / force-push
- ✅ 唯一 mutation = 本 preanalysis doc 自身

### G.2 未來 implementation phase 共通紅線（沿用 + 補強）

- ❌ 不提供 Apply / Save（任何形式）
- ❌ 不提供 auto-fix
- ❌ 不修改 frontmatter
- ❌ 不修改 tags.json / categories.json registry
- ❌ 不升級 validator warning 為 error
- ❌ 不修改 build output
- ❌ 不碰 Blogger repost
- ❌ 不碰 GA4 / AdSense
- ❌ 不打外部 API
- ❌ 不引入規則引擎（per-post prescription）
- ❌ 不在 admin 內硬編規則文字（須 docs cross-link）
- ❌ 不引入新 severity 級別（除 warn 外）
- ❌ 不渲染 form / button / fetch / input / select / textarea
- ❌ 不改 loader 為寫入路徑

---

## H. 後續 implementation phase 之安全條件

### H.1 安全條件清單（必要全達）

| # | 條件 | 達成方式 |
|---|---|---|
| 1 | 只允許 read-only UI | EJS 只渲染 `<span>` / `<p>` / `<code>` / `<a>` / `<ul>` / `<li>` / `<details>` / `<summary>`；**禁** `<form>` / `<button>` / `<input>` / `<select>` / `<textarea>` 之 mutation 元素（無 onclick fetch） |
| 2 | 明確定義資料 contract | 在 implementation phase 之 preanalysis 列 `post.governanceSignals.*` derive 函式 + 純函式單元測 + 對齊 night-9 §G.2 status filter 差異 |
| 3 | 有 empty state | 每個 sub-bucket / per-post panel 在 count === 0 時顯示正向確認文字（沿用既有 L1580 / L1783 樣板） |
| 4 | 保證 existing output 不變 | 加 EJS partial 為 additive；不動既有 statistics pill / table / detail panel 順序；既有 byte snapshot test 須 pass |
| 5 | Guard / acceptance checklist | implementation phase 須含：(a) `validate:content` 0/94/84 carry forward 證明、(b) build:github / build:blogger output 對 production post byte snapshot 不變、(c) admin `/admin/` 頁 render 不破版、(d) Posts 表格 search/filter/sort 行為不變 |
| 6 | docs cross-link 為唯一規格來源 | bucket-note 之 governance link 連到 docs/ 內 docs；admin 不重述 docs 規格 |
| 7 | per-post signal 不含 prescription | derive 欄位只含計數 / flag；不含「應改為 X」字串 |
| 8 | 不擴 loader 為 fetch / writeable | loader 仍為 fs.glob + parse；無 fs.writeFile / no fetch / no child_process / no IO 副作用 |
| 9 | Anti-write 文字一致 | 沿用既有 L1602 / L1805 樣板；新區塊文字審稿須對齊 |
| 10 | 紅線監督 | implementation PR 須對照本 §G.2 紅線清單；任何違反 = block / revert |

### H.2 Acceptance checklist 範本

```
[ ] validate:content 維持 0/94/84（normal baseline；overlay 0/101/85）
[ ] build:github 對既有 3 ready post HTML byte-identical（modulo builtAt / mtime）
[ ] build:blogger 對既有 6 ready post HTML byte-identical（modulo builtAt / mtime）
[ ] check:adsense-resolver 34/0 carry
[ ] check:adsense-article-block 13/0 carry
[ ] check:adsense-anchor-wiring 14/0 carry
[ ] check:blogger-adsense-output 85/0 carry
[ ] admin/index.html render 不破版（dev mode 載入 /admin/）
[ ] Posts index 表格 search / filter / sort 行為不變
[ ] Categories sub-buckets / Tags sub-buckets 顯示不變（新增區塊 additive）
[ ] 新增之 per-post Governance signals section：(a) 顯示計數 (b) 顯示 anti-write 文字 (c) 顯示 cross-link
[ ] grep -c 'auto-fix\|Apply\|Save'  在新 EJS partial 內 = 0
[ ] grep -c '<form\|<button\|<input\|<select\|<textarea\|fetch(' 在新 EJS partial 內 = 0
[ ] 紅線清單逐條 self-check pass（§G.2）
[ ] 無 npm install / 無 build artifact commit / 無 lockfile drift
```

### H.3 Implementation phase 之最小切片建議

按低風險→高風險順序：

| 切片 | 範圍 | 風險 |
|---|---|---|
| 切片 1：sub-bucket bucket-note 加 docs cross-link | 改 admin/index.ejs 之既有 bucket-note `<p>` 加 `<a href="…">` | 極低 |
| 切片 2：loader 新增 `post.governanceSignals.*` derive（無 view） | 改 load-admin-posts.js；不改 EJS | 低（derived field；既有 admin/index.ejs 忽略亦 OK） |
| 切片 3：Posts index 表格新增 governance signal badge column | 改 admin/index.ejs 之 Posts 表格 + filter chip | 中（影響 layout / filter 行為） |
| 切片 4：Post detail panel 新增 Governance signals section | 改 admin/index.ejs 之 detail panel | 低（additive section） |
| 切片 5：empty state 文字審稿 | 改各 sub-bucket / panel empty 文字 | 極低 |

→ 建議**每切片獨立 phase**；每切片獨立 acceptance；不跳階；不混做。

---

## I. Future / 不在本 phase 處理（list of what stays dormant）

- `validator per-post aggregation API`（night-9 §G.3；獨立 docs-only preanalysis）
- `admin/posts detail readability refinement`（night-9 §I.5.9；獨立 implementation phase）
- `admin post detail readonly expand`（commerce ref / book metadata / download ref / prev / next slug 預覽；night-9 §I.5.10）
- `admin build/deploy readonly status`（read-only 顯示最後 build / deploy 狀態；night-9 §I.5.11）
- `admin write path`（middleware / CLI / browser write；night-9 §I.5.12；按 phased red lines；不跳階）
- `content fix phonics download frontmatter`（night-9 §I.3.3；docs-only preanalysis；獨立 phase）
- `tags.json update`（night-9 §I.3.4；僅 user 選 Option A 才需要；獨立 phase）
- `GA4 P2 維度 / Blogger surface AdSense Batch 2 / commerce L2 seed`（與本 phase 完全無關；獨立 phase）

---

## J. Explicit non-actions（本 phase 紅線）

- ❌ **未**改 `content/settings/tags.json`
- ❌ **未**改 `content/settings/categories.json`
- ❌ **未**改任何 `.md` frontmatter
- ❌ **未**改 `src/scripts/validate-content.js`
- ❌ **未**改 `src/scripts/load-admin-posts.js`
- ❌ **未**改 `src/scripts/load-posts.js`
- ❌ **未**改 `src/views/admin/index.ejs`
- ❌ **未**改 `src/scripts/build-github.js`
- ❌ **未**新增 EJS partial / CSS / JS / loader 欄位
- ❌ **未**啟用 admin write / Apply / Save / browser write / middleware / CLI fix-cmd
- ❌ **未** `npm install`；**未**動 `package.json` / lockfile
- ❌ **未** build / deploy / push gh-pages / 重貼 Blogger
- ❌ **未**動 AdSense / GA4 / commerce 後台
- ❌ **未**動 `CLAUDE.md`
- ❌ **未**升級 unknown-tag / unknown-category warning 為 error
- ❌ **未**做 taxonomy 真實資料遷移
- ❌ **未**做 GA4 驗證
- ❌ **未**做 unrelated cleanup

→ 唯一 mutation = 本 preanalysis doc 自身。

---

## K. Cross-links

- `docs/20260615-blog-admin-ia-current-state-preanalysis.md`（pm-2 IA + 現況盤點）
- `docs/20260615-admin-categories-readonly-usage-counts-record.md` / `…-human-acceptance.md`（night-5 / night-6）
- `docs/20260615-admin-tags-readonly-usage-counts-record.md` / `…-human-acceptance.md`（night-7 / night-8）
- `docs/20260615-admin-content-taxonomy-governance-preanalysis.md`（night-9）
- `docs/20260616-admin-content-taxonomy-governance-preanalysis-human-acceptance.md`（am-1）
- `docs/admin-mvp-pre-analysis.md` / `docs/admin-local-boundary-pre-analysis.md` / `docs/admin-1-readonly-preflight.md`（ADMIN 邊界與 Plan B）
- `docs/admin-2-write-pre-analysis.md` / `docs/20260528-admin-write-phase-4-middleware-preanalysis.md`（write surface / middleware；本 phase **不**啟用）
- source 觀察：`src/views/admin/index.ejs`、`src/scripts/load-admin-posts.js`、`src/scripts/build-github.js`（L803–825）、`src/scripts/admin-write-cli.js`（read-only 觀察，未改）

---

## L. Proposed next phases

### L.1 保守預設（推薦）

**`20260616-idle-freeze-after-admin-suggested-fix-readonly-ui-preanalysis-no-op-a`** — 收工 idle freeze；等 user 決定下一步。

### L.2 Acceptance（並行可做）

**`20260616-admin-suggested-fix-readonly-ui-preanalysis-human-acceptance-a`** — 人眼閱讀本 preanalysis，docs-only acceptance；沿用 night-6 / night-8 / am-1 pattern。

### L.3 Implementation 切片（須 user explicit approval）

最低風險先：

1. **`20260616-admin-suggested-fix-sub-bucket-docs-crosslink-implementation-a`**（切片 1） — sub-bucket bucket-note 加 docs cross-link；改既有 `<p>` 加 `<a>`；single change scope；不動 statistics / table / detail panel。
2. **`20260616-admin-suggested-fix-loader-derive-implementation-a`**（切片 2） — loader 新增 `post.governanceSignals.*` derive 欄位；不改 EJS；不影響既有 view。
3. **`20260616-admin-suggested-fix-posts-index-badge-implementation-a`**（切片 3） — Posts index 表格新增 governance signal badge + filter chip。
4. **`20260616-admin-suggested-fix-detail-panel-section-implementation-a`**（切片 4） — Post detail panel 新增 Governance signals section（additive）。
5. **`20260616-admin-suggested-fix-empty-state-text-refinement-a`**（切片 5） — empty state 文字審稿。

→ 每切片獨立 phase + 獨立 acceptance；**不**跳階；**不**混做。

### L.4 並行不衝突

- `20260616-admin-validation-per-post-aggregation-preanalysis-docs-only-a`（night-9 §I.4.8） — validator per-post API 設計；docs-only；與本 UI preanalysis 並行不衝突。

### L.5 紅線提醒

- ❌ 不可跳階至 write path
- ❌ 不可跳階至 L3 per-post prescription
- ❌ 不可在 ADMIN 直接掛 L4 UI（Apply / Save / auto-fix / form / button）
- ❌ 不可在 implementation phase 同時做切片 1+2+3+4+5（須拆開）

---

（本紀錄結束）
