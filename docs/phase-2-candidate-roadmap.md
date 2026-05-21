# Phase 2 候選工作清單

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
| 1.2 | GA4 prod-only gating（dev mode 不送 event）| `docs/ga4-enable-preflight.md` §2.4 Option B | ~10 LOC ga4.ejs | 需 user 決議；對齊 Admin-1-b dev-mode-only pattern |
| 1.3 | ~~FB completeness 條件式（如 `enabled=true && status=published && !postUrl → missing`）~~ | `docs/fb-post-url-metadata-proposal.md` §5.3 / P3 | — | ✅ Admin-only 已於 Phase 20260521-mid-2 / C-3-a（commit `edbf6d0`）完成；validate-level rule deferred；fixture metadata sample deferred |
| 1.4 | Admin disclaimer drift fix（若有新 phase 落地後 disclaimer 過時） | per c-3 pattern | <5 LOC | 例如 P5-c 落地後更新 FB Post section disclaimer |
| 1.5 | docs index 更新（如新增 phase docs 後 README cross-link 補齊）| 本批已建 `docs/README.md` | docs only | 隨 docs 變動逐次同步 |

---

## 2. 🟡 需要 user 決策後才能做

需 user 明示同意 / 提供決策值 / 勾選 preflight checklist 才可啟動。

### 2.1 GA4 真正啟用 measurementId

- 對應：`docs/ga4-enable-preflight.md` §3.1
- 阻擋條件：
  - user 須取得 GA4 property `G-XXXXXXXXXX`
  - user 須勾完 8 項必勾 checklist
  - 涉及線上追蹤資料收集 → user 明示同意
- 預估：~3 LOC 變動（ga4.config.json）+ commit + push 至 deploy repo
- 風險：🟡 中（啟用後 GitHub Pages 線上即收 event）

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

### 3.3 Blogger 反向 UTM 自動處理（cross-link GA4）

- 對應：`CLAUDE.md` §16.4「Blogger → GitHub Pages 反向尚未實作；列為 future phase」
- 範圍：Blogger 文章內指向 GitHub Pages 之 link 自動加 UTM
- 待決：Blogger 之 build 端是否要對 cross-link 做 UTM injection（per 既有 GitHub→Blogger 方向）
- 風險：🟡 中-高（涉 Blogger article HTML mutation；需 user 確認 UTM 規格）

### 3.4 Admin pagination（替代 show-all toggle）

- 對應：Phase 20260520-a audit §5 task D / Phase 20260520-b-4 已落地 show-all toggle
- 若文章 > 100 時 show-all 仍可能慢 → 改 pagination
- 風險：🟡 中（UI 改動；需設計 page size / page nav）

### 3.5 GA4 event attr rollout（5-d 後續整合）

- 對應：`docs/seo-ga4-adsense.md` §5.3 之 8 個 event（除 page_view 自動）
- 範圍：逐 EJS template 加 `data-ga4-event` / `data-ga4-param-*` attr
- 預估：~多 phases；每 event type 1 batch
- 風險：🟡 中（涉多 EJS templates；需 GA4 啟用後驗證 event 實際送達）

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
  - ~~DS-3-c-a hex 違規低風險修正~~（✅ 已於 20260520 commit `f530a39` 完成；per §1.1）
  - GA4 prod-only gating（per §1.2；user 決後）
  - ~~FB completeness P3 條件式~~（✅ Admin-only 已於 20260521 commit `edbf6d0` 完成；validate-level rule deferred；per §1.3）

Phase 2.2（user-decided；🟡 中；依需求展開）
  ↓
  - 若 user 啟用 GA4 → §2.1 落地
  - 若 user 推進 FB write → §2.2 之 P5-c-a 起手
  - 若 user 推進 Admin SEO write → §2.3 起手

Phase 2.3（visual / Blogger 同步；🟡 中；需 visual diff）
  ↓
  - DS-3-b platform theme tokens（per §2.4）
  - DS-3-b-blogger-entry（per §2.5）
  - ~~DS-3-c-b hover overlay + mirror 同步~~（✅ 已於 20260520 commits `67a0ccc` + `cc2621d` 完成；per §2.6）
  - ~~DS-3-c-c hero gradient~~（✅ 已於 20260520 pm-6 採方案 C 豁免；per §2.7）

Phase 2.4（規模觸發；🔴 高；建議當前不啟動）
  ↓
  - sitemap 拆分（per §3.1；用戶量增 + post 數量 > 100 後再評估）
  - mirror partial 整合（per §3.2；user 主動評估 mirror 維護痛點後）

Phase Z（永禁 / 二階段）
  ↓
  - FB Graph API / Blogger API / Drive API / WYSIWYG / 後端 DB / 留言 / View 數 / 全文搜尋
```

---

## 7. 待決事項摘要（user 明示前不啟動）

- [ ] GA4 measurementId 是否啟用（per §2.1）
- [ ] FB-P5-c 是否啟動（per §2.2 + `docs/fb-sidecar-write-preflight-decision.md` §7）
- [ ] FB-P5-c 是否採拆批策略（P5-c-a + P5-c-b vs 單批）
- [ ] Admin SEO write 是否啟動（per §2.3）
- [ ] DS-3-b platform theme 方案（A 保守 vs B 品牌化；per §2.4）
- [ ] DS-3-b-blogger-entry 是否啟動 + Blogger 後台重貼時機（per §2.5）
- [x] DS-3-c-c hero gradient 方案（✅ 採方案 C 豁免；per §2.7 / pm-6）
- [ ] sitemap 拆分是否做（per §3.1；當前不建議）
- [ ] mirror partial 整合啟動時機（per §3.2；user 主動評估）
- [ ] GA4 prod-only gating 是否做（per §1.2）
- [x] FB completeness P3 條件式是否做（per §1.3）（✅ Admin-only 已於 commit `edbf6d0` 完成；validate-level rule + fixture metadata sample 仍 deferred）
- [ ] vite host 設定 0.0.0.0 vs localhost（per `docs/fb-sidecar-write-preflight-decision.md` §3.2；影響 FB write API 設計）

---

## 8. 邊界聲明

- ✅ 本文件**僅為 roadmap 候選**；不啟動任一項目；不承諾時程
- ✅ 任何項目啟動必須 user 明示
- ✅ 對應之 pre-analysis / preflight / safety doc 須先過 user checklist
- ✅ 永禁項（§5）任何情況不可進行
- ✅ 第一版限制（CLAUDE.md §29）之項目屬 Z 類；要做必須完全重評估架構

---

## 9. Cross-links

- `docs/README.md` — docs 入口
- `docs/phase-1-user-operation-guide.md` — 第一階段操作手冊
- `CLAUDE.md` §28（第一版 MVP 必做）/ §29（第一版不做清單）
- 各系列 pre-analysis / preflight / safety docs（per `docs/README.md` §3）

---

（本文件結束）
