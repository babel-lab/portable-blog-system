# 20260529 Reverse UTM Topic Plan Preanalysis

本文件為 **Phase `20260529-am-14-reverse-utm-topic-plan-preanalysis-docs-only-a`** 之 docs-only 規劃文件。屬 **planning / topic strategy** 性質；**不**啟動 fixture 建立、**不**修改任何 content / source / settings / templates / dist。

對應上層文件：
- `CLAUDE.md` §16.4（Blogger ↔ GitHub 互導 UTM；GitHub→Blogger live；Blogger→GitHub source landed but dormant）
- `docs/reverse-utm-fixture-plan.md`（reverse UTM fixture 既有計畫；§6 pm-26 deploy gate 條件）
- `docs/admin-2-write-pre-analysis.md` §15.G.11 / §15.G.12（governance：reverse UTM 仍 dormant；pm-26 仍 BLOCKED；不視為任一條件成立）
- `docs/system-direction.md`（BLOG 系統整體方向；雙站定位）

---

## 1. Purpose

本文件之**唯一目的**：

- ✅ 整理未來 positive GitHub cross-link fixture 之**題材選擇策略**
- ✅ 列出候選題材原則 + 候選題材選項 + 推薦最安全方向
- ✅ 列出未來 fixture 落地之保守 phase 順序作為參考

本文件之**明確非目的**：

- ❌ **不**建立 fixture（無 content 新增；無 .md / .publish.json / .fb.md 落地）
- ❌ **不**修改 content（既有 37 posts 全不動）
- ❌ **不**啟動 reverse UTM（per `CLAUDE.md` §16.4；remains landed but dormant）
- ❌ **不**解除 pm-26 deploy gate（per `docs/reverse-utm-fixture-plan.md` §6；remains BLOCKED）
- ❌ **不** build / deploy / Blogger repost / GA4 validation

---

## 2. Current baseline（2026-05-29 10:05 +0800）

| 維度 | 狀態 | 證據 |
|---|---|---|
| HEAD | `8b40d0961a0d268d05df887bc1b2456788f14438`（short `8b40d09`）| `git rev-parse HEAD` |
| origin/main | 同 HEAD | `git rev-parse origin/main` |
| ahead / behind | 0 / 0 | `git rev-list --left-right --count HEAD...origin/main` |
| working tree | clean | `git status --short --branch` |
| 上一 commit subject | `docs(admin): plan add-empty-seo-field cli` | `git log -1 --oneline` |
| safe-write:test | 209 pass / 0 fail | `npm run safe-write:test` |
| validate:content | 0 errors / 42 warnings / 37 posts | `npm run validate:content` |
| reverse UTM source（pm-24a/b/c）| ✅ landed but **dormant** | per `CLAUDE.md` §16.4 |
| Blogger → GitHub UTM live status | ❌ 未 deploy / 未 Blogger repost / 未 GA4 验收 | per `CLAUDE.md` §16.4 |
| pm-26 deploy gate | ❌ **remains BLOCKED** | per `docs/reverse-utm-fixture-plan.md` §6 — no positive GitHub cross-link fixture exists |
| Admin Apply UI | ❌ **disabled** | per `src/views/admin/index.ejs` line 616-619 / 721-724 |
| Middleware write route | ❌ **not started** | `vite.config.js` 無 `configureServer` |
| CLI real write | ⛔ remains gated by per-phase explicit user approval | per `docs/admin-2-write-pre-analysis.md` §15.G.11 §G |
| Fourth SEO real write | ⛔ remains unauthorized | per `docs/admin-2-write-pre-analysis.md` §15.G.10 §I / §15.G.11 §F-5 |

---

## 3. Problem statement

目前 reverse UTM（Blogger → GitHub Pages）之阻塞點：

1. **Source 已落地但 dormant**：pm-24a (`7e1d356`) / pm-24b (`e2309e9`) / pm-24c (`7c769fe`) 已 push origin/main；`src/scripts/ga4-url-builder.js` / `src/scripts/build-blogger.js` / `src/views/blogger/blogger-post-full.ejs` 已支援 `direction='to_github'`；既有 build verify 通過（pm-24d）。
2. **Deploy gate（pm-26）remains BLOCKED**：per `docs/reverse-utm-fixture-plan.md` §6；deploy / Blogger repost / GA4 Realtime 验收**未啟動**之原因 — **沒有任何 Blogger ready post 含 positive GitHub cross-link** 可作為驗收 fixture。
3. **Fixture 題材必須自然**：不應為了「過 gate」而**硬塞**一條 GitHub link 到既有 Blogger post，這會：
   - 破壞文章自然性 / 讀者體驗
   - 污染既有 production content 之語意
   - 違反 `CLAUDE.md` §1「不過度工程化」原則
4. **不能製造不合理文章**：fixture 不應是「為測試而寫」之無意義內容；必須是**未來真實可用**之題材（或至少屬 `validation-fixtures/` 之 sample-only）。
5. **應先做題材設計，再進入 fixture 建立 phase**：未經題材討論直接建立 fixture，會導致：
   - 候選題材未對齊雙站定位
   - 自然性 / 風險評估不明
   - sample vs. real content 邊界不清

→ 本 §3 結論：**先 docs-only 題材設計**（本 phase），**後**才進 fixture preanalysis（後續獨立 phase），**最後**才落地 fixture（再後續獨立 phase + user explicit approval）。

---

## 4. Candidate topic principles

未來 positive GitHub cross-link fixture 之題材**必須滿足**以下原則：

| # | 原則 | 說明 |
|---|---|---|
| P-1 | Blogger 文章與 GitHub 技術文章之間要有**自然導流關係** | 不是「為了測試而連」；讀者跨站閱讀有實質價值 |
| P-2 | Blogger 端最好是**圖文 / 教具 / 書評 / 四格 / 下載 / 操作說明**等內容 | 對齊 `CLAUDE.md` §2.1 Blogger 站定位（生活、書評、四格漫畫、教具下載、親子教育素材）|
| P-3 | GitHub 端最好是**技術筆記 / 製作流程 / 模板說明 / 資料結構 / 工具化流程** | 對齊 `CLAUDE.md` §2.2 GitHub Pages 站定位（技術筆記、心得、經營筆記）|
| P-4 | 連結文案要**自然** | 例如「技術實作筆記」、「製作流程說明」、「GitHub 技術補充」、「背後的工具設計」等；不直接寫「請點此測試 UTM」 |
| P-5 | **不為測試 UTM 而寫無意義文章** | 內容本身須具獨立閱讀價值；移除 cross-link 後仍是合理文章 |
| P-6 | 優先選 **draft / sample 題材**，**不碰** published production post | 降低風險；sample 階段可隨時拿掉；不污染既有 37 posts 之 baseline |
| P-7 | Fixture 應放於可控位置 | 候選位置：`content/validation-fixtures/blogger/posts/` / `content/drafts/` / `content/blogger/posts/`（status: draft）；**不**放至 production status: ready 之 post |
| P-8 | 一次只建一個 fixture | per `docs/admin-2-write-pre-analysis.md` §15.C #8（one post / one transaction at a time）；不 bulk |

---

## 5. Candidate topic options

以下列 **3 組候選題材**；每組標註：Blogger-side article idea / GitHub-side article idea / Why the cross-link is natural / Fixture risk / Sample-only vs. future real content。

### 5.A 書評文章 → 技術文章

| 欄位 | 內容 |
|---|---|
| **Blogger-side** | 書評文章（如 *《原子習慣》* 之類已熟悉之書名 sample；或既有 `20260504-sample-book-review.md` 之 mirror 至 Blogger 端 draft）|
| **GitHub-side** | 該書評之**模板說明** / `book.*` frontmatter schema 解析 / Blogger publish bundle 流程說明 |
| **Cross-link 文案範例** | Blogger 端：「想看本站書評之背後系統實作？可看 [GitHub 技術補充：書評模板與 publish flow](github-url)」 |
| **自然性** | ✅ 讀者看書評；技術讀者可看背後建置方式；雙站讀者群有部分重疊 |
| **Fixture risk** | 🟢 **低**；唯一風險：內容若寫得太像「系統測試文」會破壞自然性 |
| **Sample-only / Future real?** | 🟡 **建議先 sample-only**；若未來真寫該書評可升級至 draft |

### 5.B 教具下載文章 → GitHub 技術筆記

| 欄位 | 內容 |
|---|---|
| **Blogger-side** | 可下載教具 / 學習單 / 模板素材文章（對齊 `CLAUDE.md` §13 教具下載規則）|
| **GitHub-side** | 該教具下載文章之**檔案命名規則** / `download.*` frontmatter / download template 實作說明 / sourceAssets 管理流程 |
| **Cross-link 文案範例** | Blogger 端：「本站教具下載背後之檔案管理流程，可參考 [GitHub 技術筆記：教具下載 metadata 與模板設計](github-url)」 |
| **自然性** | ✅ 內容使用者看下載；開發者看製作流程；兩種讀者群完全不衝突 |
| **Fixture risk** | 🟢 **低**；適合未來真內容（教具下載屬 Blogger 站既定主力內容）|
| **Sample-only / Future real?** | 🟢 **建議 future real content**；可同時測試 Blogger 內容與 GitHub 技術補充導流 |

### 5.C 四格漫畫 / 圖文文章 → GitHub 製作流程

| 欄位 | 內容 |
|---|---|
| **Blogger-side** | 四格漫畫 / 圖文創作（對齊 `CLAUDE.md` §2.1 Blogger 站定位之「生活四格 / 書評四格 / 講座四格」）|
| **GitHub-side** | 圖片壓縮流程 / 文章模板設計 / publish flow / metadata 設計說明 |
| **Cross-link 文案範例** | Blogger 端：「本站四格製作流程與圖片處理工具設計，可看 [GitHub 製作流程說明](github-url)」 |
| **自然性** | ✅ 創作成果與製作流程互補；對開發者讀者有額外價值 |
| **Fixture risk** | 🟡 **中低**；需避免太早承諾正式四格漫畫系統（會綁住未來內容方向）|
| **Sample-only / Future real?** | 🟡 **建議先 sample-only**；待四格內容方向更成熟再考慮升級 |

---

## 6. Recommended safest fixture direction

**推薦：5.B 教具下載文章 → GitHub 技術筆記**

理由：

| # | 理由 |
|---|---|
| R-1 | 與 BLOG 系統定位**自然相符**（per `CLAUDE.md` §2.1 Blogger 教具下載 / §2.2 GitHub 技術筆記）|
| R-2 | 可**同時**測試 Blogger 內容與 GitHub 技術補充之雙向導流語意 |
| R-3 | **不需碰已 published production post**（教具下載屬未來主力內容；現有 37 posts 不被污染）|
| R-4 | 未來可用 sample / draft fixture **控制風險**（draft status 可隨時改回 / 移除）|
| R-5 | 比 5.A 書評**更不像硬塞技術連結**（書評之 GitHub 端常被讀者質疑「為什麼書評要連技術文」）|
| R-6 | 比 5.C 四格漫畫**更不涉及尚未成熟之內容承諾**（四格內容方向未定；承諾過早會綁住未來路線）|

→ 未來若進入 fixture 建立 phase（per §7），**建議 default 採 5.B**；5.A / 5.C 可作為 backup 方案，但**不**作為首選。

---

## 7. Proposed future phase sequence

本 §7 **不啟動**以下任一 phase；本節僅列保守落地順序作為參考。每段獨立 user explicit approval。

| 序 | Phase 性質 | 內容 | 是否本 phase 啟動 |
|---|---|---|---|
| 7-1 | read-only | Scan current `content/{blogger,github}/posts/` + `content/templates/` + `content/validation-fixtures/` for possible fixture base（report-only；無寫入）| ❌ 不啟動 |
| 7-2 | docs-only | Choose one sample / draft fixture candidate（依 §6 推薦 default 5.B；user 可選 5.A / 5.C 為替代）| ❌ 不啟動 |
| 7-3 | docs-only | Create fixture preanalysis docs（明列 target file / cross-link 文案 / GitHub-side URL / 風險評估 / rollback plan）| ❌ 不啟動 |
| 7-4 | content-mutation | Create content fixture in draft / sample only（status: draft；位置：`content/validation-fixtures/` 或 `content/drafts/` 或 `content/blogger/posts/` status: draft；一次一檔；無 bulk）| ❌ 不啟動 |
| 7-5 | read-only | `validate:content`（驗 0 errors baseline 不退步；warnings 變化記錄並可接受）| ❌ 不啟動 |
| 7-6 | governance | Self check / user explicit approval if later approved（user 書面確認 fixture 內容、cross-link URL、status 設定三項全部）| ❌ 不啟動 |
| 7-7 | read-only | Deploy gate cross-check（per `docs/reverse-utm-fixture-plan.md` §6；驗 fixture 是否滿足 pm-26 啟動條件）| ❌ 不啟動 |
| 7-8 | separate | Blogger repost decision remains **separate**（不在本 sequence；user 主動觸發；獨立 phase）| ❌ 不啟動 |
| 7-9 | separate | GA4 validation remains **separate**（不在本 sequence；user 主動觸發；獨立 phase + Realtime / DebugView 驗收）| ❌ 不啟動 |
| 7-10 | docs-only | Docs checkpoint（append landed state；baseline 變化記錄；governance 重申）| ❌ 不啟動 |

7-1 至 7-10 之**任一**啟動皆須**獨立 phase + 該次 phase 之 user explicit approval**；本 §7 docs-only 規劃**不**等同 7-1 至 7-10 任一段之預授權。

---

## 8. Explicit non-goals（本 phase）

本 phase `20260529-am-14-...-docs-only-a` 之**硬性非目的**：

| # | 不做 | 對齊文件 |
|---|---|---|
| N-1 | ❌ no fixture creation | 本 phase docs-only；無 content 新增 |
| N-2 | ❌ no content changes | 既有 37 posts / 4 templates / drafts / archive / shared 全不動 |
| N-3 | ❌ no source changes | 無 `src/**` 修改；無新 .js / .ejs / .scss |
| N-4 | ❌ no settings / templates changes | `content/settings/**` / `content/templates/**` 不動 |
| N-5 | ❌ no package changes | `package.json` / `package-lock.json` 不動；無 npm install |
| N-6 | ❌ no build / deploy | `npm run build` / `build:github` / `build:blogger` 全不跑；gh-pages 不動 |
| N-7 | ❌ no Blogger repost | Blogger 後台不重貼 |
| N-8 | ❌ no GA4 validation | Realtime / DebugView 不開 |
| N-9 | ❌ no Admin Apply | 仍 disabled（per `src/views/admin/index.ejs`）|
| N-10 | ❌ no middleware route | `vite.config.js` 無 `configureServer` 新增 |
| N-11 | ❌ no admin-write-cli dry-run / apply | 既有 write CLI 不執行任何 dry-run / apply 路徑 |
| N-12 | ❌ no fourth SEO write | per `docs/admin-2-write-pre-analysis.md` §15.G.10 §I；fourth SEO write 仍 unauthorized |
| N-13 | ❌ no reverse UTM activation | reverse UTM source remains landed but dormant（per `CLAUDE.md` §16.4）|
| N-14 | ❌ no pm-26 deploy gate unblock | per `docs/reverse-utm-fixture-plan.md` §6；remains BLOCKED |

---

## 9. Acceptance checklist

本文件 / phase 之**完成條件**：

| # | 條件 | 驗證方法 |
|---|---|---|
| AC-1 | docs file only（單一新檔；`docs/20260529-reverse-utm-topic-plan-preanalysis.md`）| `git diff-tree --no-commit-id --name-only -r HEAD` |
| AC-2 | no source / content / settings / templates / package / dist changes | 同 AC-1；除新 docs 檔外無其他 path |
| AC-3 | reverse UTM remains dormant | `CLAUDE.md` §16.4 不變；無 build / Blogger repost / GA4 validation |
| AC-4 | pm-26 deploy gate remains BLOCKED | `docs/reverse-utm-fixture-plan.md` §6 不變；無 fixture 建立 |
| AC-5 | tests remain green | `safe-write:test = 209 pass / 0 fail`；`validate:content = 0 errors / 42 warnings / 37 posts` |
| AC-6 | working tree clean after commit / push | `git status --short --branch` 無未追蹤 / 未提交檔案 |

---

（本文件結束）
